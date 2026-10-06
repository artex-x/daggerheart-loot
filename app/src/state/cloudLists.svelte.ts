/* The signed-in owner's account lists, held in memory and written through
 * `ListRepository`.
 *
 * A writer changes `lists` at once and puts one write in the buffer; an
 * edit of the same field replaces its waiting write. Two seconds after the
 * last change the buffer goes to the server in order as one `apply` request
 * (more only past `BATCH_BYTES` or `BATCH_OPS`), and at once when the page is
 * hidden or another action needs it (`flushNow`). A network failure keeps
 * the request and retries; a limit or another refusal drops that write, says
 * why, and re-reads the account; a write to a row deleted elsewhere (`gone`)
 * is dropped with no toast; a request the database keeps failing is halved.
 * Signed in, the store watches the owner's Realtime topic: another tab's or
 * device's change re-reads the account once the buffer is empty.
 * docs/DECISIONS.md, 2026-09-26: "Account list writes are buffered and sent
 * two seconds after the last edit", "The write buffer goes to the server as
 * one invoker RPC with a result per write", "A request the database fails
 * three times is halved; a lone write is dropped". */

import {
  BATCH_OPS,
  batchSize,
  clip,
  entryRowsOf,
  limitText,
  linkedRecords,
  NAME_MAX,
  NOTE_MAX,
  OFFICIAL,
  priceOf,
  quantityOf,
  toCloudList,
  type CloudList,
  type EntryPatch,
  type EntryRow,
  type EntrySource,
  type ImportRow,
  type ListOp,
  type ListRow,
  type NewListRow
} from '../lib/cloudLists.js';
import type { Dict, Msg } from '../lib/dict.js';
import { canonJson, isHomebrewKey, type HomebrewRecord } from '../lib/homebrew.js';
import { COALESCE_MS, readOwnerMessage } from '../lib/live.js';
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
import type { Random } from '../lib/roll.js';
import type { EventsPort, ListOpResult, ListRepository, ListWrite } from '../ports/index.js';
import type { ListModel } from './lists.svelte.js';
import { LiveFeed } from './liveFeed.svelte.js';

/** How long a write that found no network waits before it is sent again. */
export const RETRY_MS = 15_000;
/** How long the buffer waits after the last change before it is sent. */
export const QUIET_MS = 2_000;
/** How many counted faults in a row split a request, or drop a lone write. */
export const FAULT_LIMIT = 3;

const DROPPED: ListOpResult = { ok: false, error: 'refused' };
const NETWORK_WRITE: ListWrite = { ok: false, error: 'network' };

interface Op {
  /** A waiting op with the same key, not in flight, is replaced by a newer one. */
  key?: string;
  /** The list the op writes to. */
  list: string;
  /** A refused create takes the list's other waiting ops with it. */
  create?: boolean;
  /** The buffer's order: an op merged into is pushed again with the newest. */
  seq: number;
  write: ListOp;
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
  /** The account's list and entry limits; null for none or before a limit read answered. A
   *  failed limit read keeps the number known; a refusal for the same key replaces it with
   *  the one the database applied. */
  listLimit = $state<number | null>(null);
  entryLimit = $state<number | null>(null);

  readonly #repo: ListRepository;
  readonly #say: (msg: Msg, error?: boolean) => void;
  readonly #dict: () => Dict;

  #queue: Op[] = [];
  #flushing = false;
  #running: Promise<void> | null = null;
  /* The newest op's seq, and the newest a flush may send: an edit made
     during a flush waits for its own quiet window. */
  #seq = 0;
  #cut = 0;
  /* The head ops of the request in flight: never merged into or replaced. */
  #inFlight = 0;
  #quiet: ReturnType<typeof setTimeout> | null = null;
  /* The counted faults of the request at the head, when the last one came,
     and the most ops the next request may hold (null: no cap). */
  #faults = 0;
  #faultAt: number | null = null;
  #cap: number | null = null;
  /* Bumped by `clear()`: an answer that started before it is dropped. */
  #epoch = 0;
  /* Bumped by every local write: a read that overlapped one is dropped and
     made again once the queue is empty. */
  #edits = 0;
  #reread = false;
  #timer: ReturnType<typeof setTimeout> | null = null;
  /* Each list as last read, by its `updated_at`: an unchanged row keeps its
     object, so a re-read that finds nothing new redraws nothing. `rev` is the
     revision read, which an owner message is compared with. */
  #read: Record<string, { at: string; rev: number; list: CloudList }> = {};
  readonly #events: EventsPort | null;
  readonly #feed: LiveFeed | null;
  #remoteTimer: ReturnType<typeof setTimeout> | null = null;
  readonly #sourceOf: (key: string) => EntrySource | null;
  /* Whether the account holds an own item: a list row of its key draws the own record, so
     its link is not read through `items()`. */
  readonly #hasOwn: (key: string) => boolean;
  /* What each removed entry was written as, by list and key: an undo writes it back
     exactly, never resolved again (docs/specs/FEATURES.md, "Lists"). */
  #removed: Record<string, EntrySource> = {};
  /* The records of linked items the account does not hold, by item id, as the last
     `items()` answer read them: a failed read keeps them, an unchanged record keeps its
     object. */
  #linked: Record<string, HomebrewRecord> = {};

  constructor(
    repo: ListRepository,
    say: (msg: Msg, error?: boolean) => void,
    dict: () => Dict,
    live?: {
      events: EventsPort;
      random: Random;
      /** The owner's purchase requests: one feed per topic, so they read its messages too. */
      requests?:
        { message(event: string, payload: unknown): void; refetch(): void } | undefined;
      /** The author's homebrew: the same feed carries its `homebrew` messages, and a list
       *  row of a key it holds draws the own record, not a linked one. */
      homebrew?:
        | {
            message(event: string, payload: unknown): void;
            refetch(): void;
            has?(key: string): boolean;
          }
        | undefined;
    },
    /** What an added entry is written as; null leaves the key out. The default writes
     *  catalog keys only. */
    sourceOf?: (key: string) => EntrySource | null
  ) {
    this.#repo = repo;
    this.#say = say;
    this.#dict = dict;
    this.#sourceOf = sourceOf ?? ((key) => (isHomebrewKey(key) ? null : OFFICIAL));
    this.#events = live?.events ?? null;
    const requests = live?.requests;
    const homebrew = live?.homebrew;
    this.#hasOwn = (key) => homebrew?.has?.(key) ?? false;
    this.#feed = live
      ? new LiveFeed(live.events, live.random, {
          message: (event, payload) => {
            this.#message(event, payload);
            requests?.message(event, payload);
            homebrew?.message(event, payload);
          },
          refetch: () => {
            this.#remote();
            requests?.refetch();
            homebrew?.refetch();
          }
        })
      : null;
  }

  /** Whether the owner's Realtime topic is joined. */
  get live(): boolean {
    return this.#feed?.state === 'live';
  }

  /** Watches the owner's topic: another tab's or device's change re-reads the account. */
  watch(userId: string): void {
    this.#feed?.watch('owner:' + userId);
  }

  /** Leaves the owner's topic. */
  unwatch(): void {
    this.#feed?.stop();
    if (this.#remoteTimer !== null) clearTimeout(this.#remoteTimer);
    this.#remoteTimer = null;
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

  /** Sends a failed write again, or re-reads the account: at once while nothing is buffered,
   *  else once the buffer drains. After a
   *  failed first read it reads again with no «Загружаем...»: the error stays drawn until a
   *  read answers. */
  async refresh(): Promise<void> {
    if (this.sync === 'failed') {
      await this.flushNow();
      return;
    }
    if (this.status === 'error') {
      await this.#pull();
      return;
    }
    if (this.status !== 'ready') return;
    /* A busy buffer reads once it drains: an apply's own `list` message is
       ignored as this tab's echo, so this read is the only one it gets. */
    if (this.#queue.length || this.#flushing) {
      this.#reread = true;
      return;
    }
    await this.#pull();
  }

  /** Sends the buffer now. */
  retry(): void {
    void this.flushNow();
  }

  /**
   * Sends the whole buffer now, after a flush that is running. Answers
   * whether the buffer is empty after it (a refused write counts as gone);
   * false while a write waits for the network or when `clear()` ran meanwhile.
   */
  async flushNow(): Promise<boolean> {
    const epoch = this.#epoch;
    this.#stopQuiet();
    this.#cut = this.#seq;
    if (this.#running) await this.#running;
    if (epoch !== this.#epoch) return false;
    this.#cut = this.#seq;
    await this.#flush();
    return epoch === this.#epoch && !this.#queue.length;
  }

  /** Signed out: nothing of the account stays, buffered writes included. */
  clear(): void {
    this.unwatch();
    this.#epoch++;
    this.#edits++;
    this.#queue = [];
    this.#flushing = false;
    this.#running = null;
    this.#inFlight = 0;
    this.#faults = 0;
    this.#faultAt = null;
    this.#cap = null;
    this.#reread = false;
    this.#stopRetry();
    this.#stopQuiet();
    this.#read = {};
    this.#removed = {};
    this.#linked = {};
    this.lists = [];
    this.listLimit = null;
    this.entryLimit = null;
    this.status = 'idle';
    this.sync = 'saved';
  }

  async #pull(): Promise<void> {
    const epoch = this.#epoch;
    const edits = this.#edits;
    /* The revisions held: the read sends only the lists whose revision moved. */
    const known = Object.fromEntries(Object.entries(this.#read).map(([id, r]) => [id, r.rev]));
    const read = await (Object.keys(known).length ? this.#repo.list(known) : this.#repo.list());
    if (epoch !== this.#epoch) return;
    if (edits !== this.#edits || this.#queue.length || this.#flushing) {
      this.#reread = true;
      this.#rereadWhenIdle();
      return;
    }
    if (read.ok) {
      /* A limit read that failed (undefined) keeps the limit known. */
      if (read.listLimit !== undefined) this.listLimit = read.listLimit;
      if (read.entryLimit !== undefined) this.entryLimit = read.entryLimit;
      if (!this.#apply(read.lists, read.kept ?? [])) {
        /* A kept list this store no longer holds (an overlapping read replaced it): read
           again with the revisions held now, and draw nothing from this read. */
        this.#reread = true;
        this.#rereadWhenIdle();
        return;
      }
      /* The first draw waits for the linked records, so a card never counts an item short. */
      await this.#fetchLinked();
      if (epoch === this.#epoch) this.status = 'ready';
    } else if (this.status === 'loading') {
      this.status = 'error';
    }
  }

  /* `l` with the records of its linked items the account does not hold, as the last
     `items()` answer read them; `l` itself when it carries those already. */
  #withLinked(l: CloudList): CloudList {
    const linked: Record<string, HomebrewRecord> = {};
    for (const [key, hid] of Object.entries(l.links ?? {})) {
      const r = this.#hasOwn(key) ? undefined : this.#linked[hid];
      if (r) linked[key] = r;
    }
    const had = l.linked ?? {};
    const keys = Object.keys(linked);
    if (keys.length === Object.keys(had).length && keys.every((k) => had[k] === linked[k])) {
      return l;
    }
    const out: CloudList = { ...l };
    if (keys.length) out.linked = linked;
    else delete out.linked;
    return out;
  }

  /* The ids of the items the held lists link and the account does not hold. */
  #linkedIds(): string[] {
    const ids: Record<string, true> = {};
    for (const l of this.lists) {
      for (const [key, hid] of Object.entries(l.links ?? {})) {
        if (!this.#hasOwn(key)) ids[hid] = true;
      }
    }
    return Object.keys(ids);
  }

  /* One `items()` read of every linked item the account does not hold, whose answer fills
     each list's `linked`. A failed read keeps the records known; the next read asks again. */
  async #fetchLinked(): Promise<void> {
    const epoch = this.#epoch;
    const ids = this.#linkedIds();
    if (!ids.length) return;
    const read = await this.#repo.items(ids);
    if (epoch !== this.#epoch || !read.ok) return;
    const next: Record<string, HomebrewRecord> = {};
    for (const [hid, r] of linkedRecords(read.items)) {
      const had = this.#linked[hid];
      next[hid] = had && canonJson(had) === canonJson(r) ? had : r;
    }
    this.#linked = next;
    /* One new object per list: the drawn list and the one last read are often the same. */
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a lookup within one call, never state
    const made = new Map<CloudList, CloudList>();
    const withLinked = (l: CloudList): CloudList => {
      let n = made.get(l);
      if (!n) made.set(l, (n = this.#withLinked(l)));
      return n;
    };
    const lists = this.lists.map(withLinked);
    const changed = lists.some((n, i) => n !== this.lists[i]);
    for (const [id, r] of Object.entries(this.#read)) {
      const n = withLinked(r.list);
      if (n !== r.list) this.#read[id] = { ...r, list: n };
    }
    if (changed) this.lists = lists;
  }

  /* A write that linked an item no `items()` answer has read: read them now. */
  #readNewLinks(): void {
    if (this.#linkedIds().some((hid) => !Object.hasOwn(this.#linked, hid)))
      void this.#fetchLinked();
  }

  /* Answers false, changing nothing, when a kept id is not held. */
  #apply(rows: readonly ListRow[], kept: readonly string[]): boolean {
    const read: Record<string, { at: string; rev: number; list: CloudList }> = {};
    const keptLists: CloudList[] = [];
    for (const id of kept) {
      const had = this.#read[id];
      if (!had) return false;
      read[id] = had;
      keptLists.push(had.list);
    }
    const next = rows.map((row) => {
      const had = this.#read[row.id];
      const list = had?.at === row.updated_at ? had.list : this.#withLinked(toCloudList(row));
      read[row.id] = { at: row.updated_at, rev: row.revision, list };
      return list;
    });
    next.push(...keptLists);
    this.#read = read;
    next.sort(byUpdated);
    if (next.length !== this.lists.length || next.some((l, i) => l !== this.lists[i])) {
      this.lists = next;
    }
    return true;
  }

  /* A message from this tab's own write, or of a revision already read, asks
     for nothing; a list deleted elsewhere is a re-read too. */
  #message(event: string, payload: unknown): void {
    const m = readOwnerMessage(event, payload);
    if (!m || m.by === this.#events?.tab) return;
    const had = this.#read[m.list];
    if (m.revision === null ? !had : had && m.revision <= had.rev) return;
    this.#remote();
  }

  /* A change elsewhere: one re-read per burst, made once the buffer is empty
     and nothing is in flight. */
  #remote(): void {
    this.#remoteTimer ??= setTimeout(() => {
      this.#remoteTimer = null;
      if (this.status !== 'ready') return;
      this.#reread = true;
      this.#rereadWhenIdle();
    }, COALESCE_MS);
  }

  #rereadWhenIdle(): void {
    if (!this.#reread || this.#queue.length || this.#flushing) return;
    this.#reread = false;
    void this.#pull();
  }

  #enqueue(op: Omit<Op, 'seq'>): void {
    this.#edits++;
    if (op.key) {
      const at = this.#queue.findIndex((q, i) => i >= this.#inFlight && q.key === op.key);
      if (at >= 0) this.#queue.splice(at, 1);
    }
    this.#queue.push({ ...op, seq: ++this.#seq });
    /* A write known unsent keeps «Не сохранено»: the next send is a retry. */
    if (this.sync !== 'failed') this.sync = 'saving';
    this.#stopQuiet();
    this.#quiet = setTimeout(() => {
      this.#quiet = null;
      this.#cut = this.#seq;
      void this.#flush();
    }, QUIET_MS);
  }

  /* One flush at a time; a second call joins the running one, which goes on
     into the ops a raised `#cut` makes due. */
  #flush(): Promise<void> {
    if (!this.#running) {
      const run: Promise<void> = this.#send().finally(() => {
        if (this.#running === run) this.#running = null;
      });
      this.#running = run;
    }
    return this.#running;
  }

  async #send(): Promise<void> {
    this.#stopRetry();
    this.#flushing = true;
    const epoch = this.#epoch;
    /* One toast per flush: a request can hold several refused writes, and a
       later refusal must not replace the first one's text (a limit). */
    let told = false;
    while (this.#queue[0] && this.#queue[0].seq <= this.#cut) {
      /* The queue is in seq order, so the due ops are its head. */
      const due = this.#queue.filter((o) => o.seq <= this.#cut);
      const n = Math.min(batchSize(due.map((o) => o.write)), this.#cap ?? BATCH_OPS);
      const sent = this.#queue.slice(0, n);
      this.#inFlight = n;
      this.sync = 'saving';
      const answer = await this.#repo.apply(sent.map((o) => o.write));
      if (epoch !== this.#epoch) return;
      this.#inFlight = 0;
      if (!answer.ok && answer.error === 'network') {
        this.#failed();
        return;
      }
      if (!answer.ok && answer.error === 'fault') {
        const now = Date.now();
        /* Several paths send again within seconds (the early flushes,
           «Повторить», the shown-again signal): faults that close together
           are one failure, not several. */
        if (this.#faultAt !== null && now - this.#faultAt < RETRY_MS) {
          this.#failed();
          return;
        }
        this.#faultAt = now;
        if (++this.#faults < FAULT_LIMIT) {
          this.#failed();
          return;
        }
        this.#faults = 0;
        this.#faultAt = null;
        if (n > 1) {
          /* The first half goes at once; the second follows when it lands. */
          this.#cap = Math.ceil(n / 2);
          continue;
        }
        /* One write the database keeps failing: dropped below as refused. */
      } else {
        this.#faults = 0;
        this.#faultAt = null;
      }
      this.#queue.splice(0, n);
      const goneLists: string[] = [];
      sent.forEach((o, i) => {
        const r = answer.ok ? answer.results[i] : DROPPED;
        if (!r || r.ok) return;
        this.#reread = true;
        if (r.error === 'gone' || goneLists.includes(o.list)) {
          /* A gone entry says nothing of its list: a replay can answer a
             false gone for an entry that a later write of the request removed. */
          if (o.write.op === 'update_entry') {
            const k = `entry:${o.write.id}:`;
            this.#queue = this.#queue.filter((q) => !q.key?.startsWith(k));
          } else {
            goneLists.push(o.list);
            this.#queue = this.#queue.filter((q) => q.list !== o.list);
          }
          return;
        }
        if (o.create) this.#queue = this.#queue.filter((q) => q.list !== o.list);
        if (!told) {
          if (r.error === 'limit') {
            const { key, value } = r;
            if (value !== null && key === 'lists_per_owner') this.listLimit = value;
            if (value !== null && key === 'entries_per_list') this.entryLimit = value;
            this.#say((t) => limitText(key, value, t), true);
          } else this.#say((t) => t.writeRefused, true);
        }
        told = true;
      });
    }
    this.#flushing = false;
    if (!this.#queue.length) this.#cap = null;
    this.sync = this.#queue.length ? 'saving' : 'saved';
    this.#rereadWhenIdle();
  }

  /* The request at the head waits for the network: sent again after RETRY_MS. */
  #failed(): void {
    this.#flushing = false;
    this.sync = 'failed';
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.#cut = this.#seq;
      void this.#flush();
    }, RETRY_MS);
  }

  #stopRetry(): void {
    if (this.#timer === null) return;
    clearTimeout(this.#timer);
    this.#timer = null;
  }

  #stopQuiet(): void {
    if (this.#quiet === null) return;
    clearTimeout(this.#quiet);
    this.#quiet = null;
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
    const ids = l.ids.map((k) => l.entryIds[k] ?? '');
    this.#enqueue({
      key: 'reorder:' + l.id,
      list: l.id,
      write: { op: 'reorder', list_id: l.id, ids }
    });
  }

  /** The `ListStore.create` signature: the new list first, its name trimmed or untitled. */
  create(
    name: string,
    init: Partial<Omit<StoredList, 'id' | 'name' | 'created'>> = {}
  ): CloudList {
    const now = Date.now();
    const id = this.#repo.newId();
    /* A key the resolver refuses is left out: the page would draw an entry with no row
       behind it. */
    const entries = this.#rowsOf(init.ids ?? [], init.meta, 0);
    const ids = entries.map((e) => e.item_key);
    const l: CloudList = {
      id,
      name: clip(name.trim() || this.#dict().untitled, NAME_MAX),
      created: now,
      ...init,
      ids,
      updated: now,
      entryIds: Object.fromEntries(entries.map((e) => [e.item_key, e.id]))
    };
    const links = linksFrom(entries, {});
    if (links) l.links = links;
    if (l.note) l.note = clip(l.note, NOTE_MAX);
    if (l.hnote) l.hnote = clip(l.hnote, NOTE_MAX);
    const row: NewListRow = {
      id,
      name: l.name,
      money_mode: l.money ?? MONEY_DEFAULT,
      player_note: l.note ?? '',
      gm_note: l.hnote ?? ''
    };
    const made = this.#withLinked(l);
    this.lists = [made, ...this.lists];
    this.#enqueue({ list: id, create: true, write: { op: 'create', list: row, entries } });
    this.#readNewLinks();
    return made;
  }

  /** Imports lists in one call (`import_lists`) after the buffer is sent, then reads the
   *  account again, without «Загружаем...». A lost answer whose lists are all in that
   *  read is `ok`: the call committed, and a retry would bring back entries deleted
   *  since. Not queued, not optimistic, no toast. */
  async import(rows: ImportRow[]): Promise<ListWrite> {
    const epoch = this.#epoch;
    await this.flushNow();
    if (epoch !== this.#epoch) return NETWORK_WRITE;
    const answer = await this.#repo.import(rows);
    if (epoch !== this.#epoch) return NETWORK_WRITE;
    if (answer.ok || answer.error === 'network') {
      await this.#pull();
      if (epoch !== this.#epoch) return NETWORK_WRITE;
      if (!answer.ok && rows.every((r) => this.get(r.list.id))) return { ok: true };
    }
    return answer;
  }

  /** Drops the list for good; there is no undo (the confirm says so). */
  remove(id: string): void {
    this.lists = this.lists.filter((l) => l.id !== id);
    Reflect.deleteProperty(this.#read, id);
    this.#enqueue({ list: id, write: { op: 'remove', id } });
  }

  /* The texts are cut to the schema's bounds here: a longer one is refused
     whole, and the edit would snap back on the next read. */
  rename(id: string, typed: string): void {
    const name = clip(typed, NAME_MAX);
    if (!this.#change(id, (l) => ({ ...l, name }))) return;
    this.#enqueue({
      key: `list:${id}:name`,
      list: id,
      write: { op: 'update', id, patch: { name } }
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
      write: { op: 'update', id, patch }
    });
  }

  setMoney(id: string, mode: MoneyMode): void {
    if (!this.#change(id, (l) => withMoney(l, mode))) return;
    this.#enqueue({
      key: `list:${id}:money`,
      list: id,
      write: { op: 'update', id, patch: { money_mode: mode } }
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
      write: { op: 'update_entry', id: rowId, patch }
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
    /* No list holds a homebrew key as an official row; the undo links the same item. */
    const hid = l.links?.[entryId] ?? null;
    this.#removed[removedKey(id, entryId)] = isHomebrewKey(entryId)
      ? { source: 'homebrew', hb_item: hid }
      : OFFICIAL;
    const next = this.#change(id, (x) => {
      const out: CloudList = { ...x, ids: x.ids.filter((k) => k !== entryId), entryIds };
      if (hid) {
        const links = { ...x.links };
        Reflect.deleteProperty(links, entryId);
        if (Object.keys(links).length) out.links = links;
        else delete out.links;
      }
      return this.#withLinked(out);
    });
    this.#enqueue({ list: id, write: { op: 'remove_entries', ids: [rowId] } });
    /* Positions stay 0..n-1, so an entry added at the end never shares one. */
    if (next && at < next.ids.length) this.#reorder(next);
  }

  /** Writes back what `removeEntry` removed: the same source and linked item. */
  restoreEntry(id: string, entryId: string, at: number, meta: ListEntryMeta): void {
    const l = this.get(id);
    if (!l || l.ids.includes(entryId)) return;
    const k = removedKey(id, entryId);
    const src = this.#removed[k] ?? this.#sourceOf(entryId);
    if (!src) return;
    Reflect.deleteProperty(this.#removed, k);
    const rowId = this.#repo.newId();
    const next = this.#change(id, (x) => {
      const out: CloudList = {
        ...withEntryAt(x, entryId, at, meta),
        updated: x.updated,
        entryIds: { ...x.entryIds, [entryId]: rowId }
      };
      if (src.hb_item) out.links = { ...x.links, [entryId]: src.hb_item };
      return this.#withLinked(out);
    });
    if (!next) return;
    const place = next.ids.indexOf(entryId);
    const rows = entryRowsOf(
      [entryId],
      { [entryId]: meta },
      () => rowId,
      place,
      () => src
    );
    this.#enqueue({ list: id, write: { op: 'add', list_id: id, entries: rows } });
    if (place < next.ids.length - 1) this.#reorder(next);
    this.#readNewLinks();
  }

  add(
    id: string,
    ids: readonly string[],
    knows: (id: string) => boolean,
    meta?: Readonly<Record<string, ListEntryMeta>>
  ): string[] {
    const l = this.get(id);
    if (!l) return [];
    const fresh = freshIds(l, ids, knows).filter((k) => this.#sourceOf(k) !== null);
    if (!fresh.length) return [];
    const added = withIds(l, fresh, meta);
    const rows = this.#rowsOf(fresh, added.meta, l.ids.length);
    const links = linksFrom(rows, l.links ?? {});
    this.#change(id, () => {
      const out: CloudList = {
        ...added,
        updated: l.updated,
        entryIds: { ...l.entryIds, ...Object.fromEntries(rows.map((r) => [r.item_key, r.id])) }
      };
      if (links) out.links = links;
      return this.#withLinked(out);
    });
    this.#enqueue({ list: id, write: { op: 'add', list_id: id, entries: rows } });
    this.#readNewLinks();
    return fresh;
  }

  /** Points the list's entry of `key` at the item `hbItem` of the same key in place
   *  (`relink`): its position, quantity, price and notes stay. False when the list holds
   *  no entry of `key`. */
  relink(id: string, key: string, hbItem: string): boolean {
    const rowId = this.get(id)?.entryIds[key];
    if (!rowId) return false;
    this.#change(id, (x) => this.#withLinked({ ...x, links: { ...x.links, [key]: hbItem } }));
    this.#enqueue({
      key: `entry:${rowId}:link`,
      list: id,
      write: { op: 'relink', id: rowId, hb_item: hbItem }
    });
    this.#readNewLinks();
    return true;
  }

  /* The rows of the keys the resolver writes, with their meta. */
  #rowsOf(
    ids: readonly string[],
    meta: Readonly<Record<string, ListEntryMeta>> | undefined,
    from: number
  ): EntryRow[] {
    return entryRowsOf(ids, meta, () => this.#repo.newId(), from, this.#sourceOf);
  }
}

const removedKey = (list: string, key: string): string => list + ' ' + key;

/* `links` with the rows' linked items by key; null when no row links one. */
function linksFrom(
  rows: readonly EntryRow[],
  links: Readonly<Record<string, string>>
): Record<string, string> | null {
  const made = rows.flatMap((r) => (r.hb_item ? [[r.item_key, r.hb_item]] : []));
  return made.length
    ? { ...links, ...(Object.fromEntries(made) as Record<string, string>) }
    : null;
}
