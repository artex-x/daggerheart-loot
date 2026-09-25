/* The signed-in owner's account lists, held in memory and written through
 * `ListRepository`.
 *
 * A writer changes `lists` at once and queues one write; the queue sends
 * them one at a time, in order, and a queued text edit of the same field is
 * replaced rather than sent twice. A network failure keeps the queue and
 * retries; a limit or another refusal drops that write, says why, and
 * re-reads the account (docs/DECISIONS.md, 2026-09-25, "Account list writes
 * are optimistic, queued in order, and retried ..."). */

import {
  clip,
  entryRowsOf,
  limitText,
  NAME_MAX,
  NOTE_MAX,
  priceOf,
  quantityOf,
  toCloudList,
  type CloudList,
  type EntryPatch,
  type ListRow,
  type NewListRow
} from '../lib/cloudLists.js';
import type { Dict } from '../lib/dict.js';
import type { ListEntryMeta, MoneyMode } from '../lib/listLink.js';
import {
  freshIds,
  movedIds,
  withEntryAt,
  withIds,
  withMeta,
  withMoney,
  withNote,
  type StoredList
} from '../lib/lists.js';
import { MONEY_DEFAULT } from '../lib/money.js';
import type { ListRepository, ListWrite } from '../ports/index.js';
import type { ListModel } from './lists.svelte.js';

/** How long a write that found no network waits before it is sent again. */
export const RETRY_MS = 15_000;

interface Op {
  /** A queued op with the same key, not yet sent, is replaced by a newer one. */
  key?: string;
  /** The list the op writes to. */
  list: string;
  /** A refused create takes the list's other queued ops with it. */
  create?: boolean;
  run: () => Promise<ListWrite>;
}

const byUpdated = (a: CloudList, b: CloudList): number =>
  b.updated - a.updated || (a.id < b.id ? -1 : 1);

export class CloudLists implements ListModel {
  /** `idle` signed out; `loading` until the first read answers; `error` when it failed. */
  status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
  /* Raw, as `ListStore.lists` is: a writer replaces the array and the list it
     changes, never mutates, so an edit redraws that list alone. Newest edit
     first. */
  lists = $state.raw<CloudList[]>([]);
  /** Whether every write is in: `failed` while one waits for the network. */
  sync = $state<'saved' | 'saving' | 'failed'>('saved');

  readonly #repo: ListRepository;
  readonly #say: (msg: string, error?: boolean) => void;
  readonly #dict: () => Dict;

  #queue: Op[] = [];
  #flushing = false;
  /* Bumped by `clear()`: an answer that started before it is dropped. */
  #epoch = 0;
  /* Bumped by every local write: a read that overlapped one is dropped and
     made again once the queue is empty. */
  #edits = 0;
  #reread = false;
  #timer: ReturnType<typeof setTimeout> | null = null;
  /* Each list as last read, by its `updated_at`: an unchanged row keeps its
     object, so a re-read that finds nothing new redraws nothing. */
  #read: Record<string, { at: string; list: CloudList }> = {};

  constructor(
    repo: ListRepository,
    say: (msg: string, error?: boolean) => void,
    dict: () => Dict
  ) {
    this.#repo = repo;
    this.#say = say;
    this.#dict = dict;
  }

  get saved(): boolean {
    return this.sync !== 'failed';
  }

  get(id: string): CloudList | undefined {
    return this.lists.find((l) => l.id === id);
  }

  /** Reads the account's lists; resolves once the read has settled. */
  async load(): Promise<void> {
    this.status = 'loading';
    await this.#pull();
  }

  /** Sends a failed write again, or re-reads the account while nothing is queued. */
  async refresh(): Promise<void> {
    if (this.sync === 'failed') {
      await this.#flush();
      return;
    }
    if (this.status !== 'ready' || this.#queue.length || this.#flushing) return;
    await this.#pull();
  }

  /** Sends the queue now. */
  retry(): void {
    void this.#flush();
  }

  /** Signed out: nothing of the account stays, queued writes included. */
  clear(): void {
    this.#epoch++;
    this.#edits++;
    this.#queue = [];
    this.#flushing = false;
    this.#reread = false;
    this.#stopRetry();
    this.#read = {};
    this.lists = [];
    this.status = 'idle';
    this.sync = 'saved';
  }

  async #pull(): Promise<void> {
    const epoch = this.#epoch;
    const edits = this.#edits;
    const read = await this.#repo.list();
    if (epoch !== this.#epoch) return;
    if (edits !== this.#edits || this.#queue.length || this.#flushing) {
      this.#reread = true;
      this.#rereadWhenIdle();
      return;
    }
    if (read.ok) {
      this.#apply(read.lists);
      this.status = 'ready';
    } else if (this.status === 'loading') {
      this.status = 'error';
    }
  }

  #apply(rows: readonly ListRow[]): void {
    const read: Record<string, { at: string; list: CloudList }> = {};
    const next = rows.map((row) => {
      const had = this.#read[row.id];
      const list = had?.at === row.updated_at ? had.list : toCloudList(row);
      read[row.id] = { at: row.updated_at, list };
      return list;
    });
    this.#read = read;
    next.sort(byUpdated);
    const same = next.length === this.lists.length && next.every((l, i) => l === this.lists[i]);
    if (!same) this.lists = next;
  }

  #rereadWhenIdle(): void {
    if (!this.#reread || this.#queue.length || this.#flushing) return;
    this.#reread = false;
    void this.#pull();
  }

  #enqueue(op: Op): void {
    this.#edits++;
    if (op.key) {
      const at = this.#queue.findIndex(
        (q, i) => q.key === op.key && !(i === 0 && this.#flushing)
      );
      if (at >= 0) this.#queue.splice(at, 1);
    }
    this.#queue.push(op);
    void this.#flush();
  }

  async #flush(): Promise<void> {
    if (this.#flushing) return;
    this.#stopRetry();
    this.#flushing = true;
    const epoch = this.#epoch;
    /* One toast per flush: a refused add is followed by its reorder, and the
       reorder's refusal must not replace the limit text. */
    let told = false;
    for (let op = this.#queue[0]; op; op = this.#queue[0]) {
      this.sync = 'saving';
      const answer = await op.run();
      if (epoch !== this.#epoch) return;
      if (answer.ok) {
        this.#queue.shift();
        continue;
      }
      if (answer.error === 'network') {
        this.#flushing = false;
        this.sync = 'failed';
        this.#timer = setTimeout(() => {
          this.#timer = null;
          void this.#flush();
        }, RETRY_MS);
        return;
      }
      this.#queue.shift();
      const list = op.list;
      if (op.create) this.#queue = this.#queue.filter((q) => q.list !== list);
      const t = this.#dict();
      if (!told) {
        this.#say(
          answer.error === 'limit' ? limitText(answer.key, answer.value, t) : t.writeRefused,
          true
        );
      }
      told = true;
      this.#reread = true;
    }
    this.#flushing = false;
    this.sync = 'saved';
    this.#rereadWhenIdle();
  }

  #stopRetry(): void {
    if (this.#timer === null) return;
    clearTimeout(this.#timer);
    this.#timer = null;
  }

  /* Puts the edited list first: it is the newest edit. */
  #put(next: CloudList): void {
    this.lists = [next, ...this.lists.filter((l) => l.id !== next.id)];
  }

  #change(id: string, edit: (l: CloudList) => StoredList): CloudList | undefined {
    const l = this.get(id);
    if (!l) return undefined;
    const next: CloudList = { ...(edit(l) as CloudList), updated: Date.now() };
    this.#put(next);
    return next;
  }

  #reorder(l: CloudList): void {
    const entryIds = l.ids.map((k) => l.entryIds[k] ?? '');
    this.#enqueue({
      key: 'reorder:' + l.id,
      list: l.id,
      run: () => this.#repo.reorder(l.id, entryIds)
    });
  }

  /** The `ListStore.create` signature: the new list first, its name trimmed or untitled. */
  create(
    name: string,
    init: Partial<Omit<StoredList, 'id' | 'name' | 'created'>> = {}
  ): CloudList {
    const now = Date.now();
    const id = this.#repo.newId();
    const ids = [...(init.ids ?? [])];
    const entries = entryRowsOf(ids, init.meta, () => this.#repo.newId());
    const l: CloudList = {
      id,
      name: clip(name.trim() || this.#dict().untitled, NAME_MAX),
      created: now,
      ...init,
      ids,
      updated: now,
      entryIds: Object.fromEntries(entries.map((e) => [e.item_key, e.id]))
    };
    if (l.note) l.note = clip(l.note, NOTE_MAX);
    if (l.hnote) l.hnote = clip(l.hnote, NOTE_MAX);
    const row: NewListRow = {
      id,
      name: l.name,
      money_mode: l.money ?? MONEY_DEFAULT,
      player_note: l.note ?? '',
      gm_note: l.hnote ?? ''
    };
    this.lists = [l, ...this.lists];
    this.#enqueue({ list: id, create: true, run: () => this.#repo.create(row, entries) });
    return l;
  }

  /** Drops the list for good; there is no undo (the confirm says so). */
  remove(id: string): void {
    this.lists = this.lists.filter((l) => l.id !== id);
    Reflect.deleteProperty(this.#read, id);
    this.#enqueue({ list: id, run: () => this.#repo.remove(id) });
  }

  /* The texts are cut to the schema's bounds here: a longer one is refused
     whole, and the edit would snap back on the next read. */
  rename(id: string, typed: string): void {
    const name = clip(typed, NAME_MAX);
    if (!this.#change(id, (l) => ({ ...l, name }))) return;
    this.#enqueue({
      key: `list:${id}:name`,
      list: id,
      run: () => this.#repo.update(id, { name })
    });
  }

  setNote(id: string, kind: 'note' | 'hnote', typed: string): void {
    const text = clip(typed, NOTE_MAX);
    const next = this.#change(id, (l) => withNote(l, kind, text));
    if (!next) return;
    const value = next[kind] ?? '';
    const patch = kind === 'note' ? { player_note: value } : { gm_note: value };
    this.#enqueue({
      key: `list:${id}:${kind}`,
      list: id,
      run: () => this.#repo.update(id, patch)
    });
  }

  setMoney(id: string, mode: MoneyMode): void {
    if (!this.#change(id, (l) => withMoney(l, mode))) return;
    this.#enqueue({
      key: `list:${id}:money`,
      list: id,
      run: () => this.#repo.update(id, { money_mode: mode })
    });
  }

  setMeta(
    id: string,
    entryId: string,
    field: 'qty' | 'gold' | 'note' | 'hnote',
    typed: string | number
  ): void {
    const rowId = this.get(id)?.entryIds[entryId];
    if (!rowId) return;
    const value = typeof typed === 'string' ? clip(typed, NOTE_MAX) : typed;
    const next = this.#change(id, (l) => withMeta(l, entryId, field, value));
    const m = next?.meta?.[entryId] ?? {};
    const patch: EntryPatch =
      field === 'qty'
        ? { quantity: quantityOf(m.qty) }
        : field === 'gold'
          ? { price_coins: priceOf(m.gold) }
          : field === 'note'
            ? { player_note: m.note ?? '' }
            : { gm_note: m.hnote ?? '' };
    this.#enqueue({
      key: `entry:${rowId}:${field}`,
      list: id,
      run: () => this.#repo.updateEntry(rowId, patch)
    });
  }

  move(id: string, entryId: string, to: number): boolean {
    const l = this.get(id);
    const ids = l ? movedIds(l, entryId, to) : null;
    if (!ids) return false;
    const next = this.#change(id, (x) => ({ ...x, ids }));
    if (next) this.#reorder(next);
    return true;
  }

  removeEntry(id: string, entryId: string): void {
    const l = this.get(id);
    const rowId = l?.entryIds[entryId];
    if (!l || !rowId) return;
    const at = l.ids.indexOf(entryId);
    const entryIds = { ...l.entryIds };
    Reflect.deleteProperty(entryIds, entryId);
    const next = this.#change(id, (x) => ({
      ...x,
      ids: x.ids.filter((k) => k !== entryId),
      entryIds
    }));
    this.#enqueue({ list: id, run: () => this.#repo.removeEntries([rowId]) });
    /* Positions stay 0..n-1, so an entry added at the end never shares one. */
    if (next && at < next.ids.length) this.#reorder(next);
  }

  restoreEntry(id: string, entryId: string, at: number, meta: ListEntryMeta): void {
    const l = this.get(id);
    if (!l || l.ids.includes(entryId)) return;
    const rowId = this.#repo.newId();
    const next = this.#change(id, (x) => ({
      ...withEntryAt(x, entryId, at, meta),
      entryIds: { ...x.entryIds, [entryId]: rowId }
    }));
    if (!next) return;
    const place = next.ids.indexOf(entryId);
    const rows = entryRowsOf([entryId], { [entryId]: meta }, () => rowId, place);
    this.#enqueue({ list: id, run: () => this.#repo.addEntries(id, rows) });
    if (place < next.ids.length - 1) this.#reorder(next);
  }

  add(
    id: string,
    ids: readonly string[],
    knows: (id: string) => boolean,
    meta?: Readonly<Record<string, ListEntryMeta>>
  ): string[] {
    const l = this.get(id);
    if (!l) return [];
    const fresh = freshIds(l, ids, knows);
    if (!fresh.length) return [];
    const added = withIds(l, fresh, meta);
    const rows = entryRowsOf(fresh, added.meta, () => this.#repo.newId(), l.ids.length);
    this.#change(id, () => ({
      ...added,
      entryIds: { ...l.entryIds, ...Object.fromEntries(rows.map((r) => [r.item_key, r.id])) }
    }));
    this.#enqueue({ list: id, run: () => this.#repo.addEntries(id, rows) });
    return fresh;
  }
}
