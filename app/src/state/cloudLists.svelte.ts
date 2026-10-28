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
 * The first read takes each list's head; `detail` reads a list's entries whole when a page
 * needs them, and a re-read reads a changed list whole only when the tab holds its details.
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
  toCloudHead,
  toCloudList,
  type CloudList,
  type EntryPatch,
  type EntryRow,
  type EntrySource,
  type ImportRow,
  type ListHead,
  type ListOp,
  type ListRow,
  type NewListRow
} from '../lib/cloudLists.js';
import type { Dict, Msg } from '../lib/dict.js';
import { canonJson, isHomebrewKey, type HomebrewRecord } from '../lib/homebrew.js';
import { COALESCE_MS, readOwnerMessage } from '../lib/live.js';
import {
  freshIds,
  movedIds,
  withEntryAt,
  withIds,
  withMeta,
  withMoney,
  withNote,
  type ListEntryMeta,
  type StoredList
} from '../lib/lists.js';
import { MONEY_DEFAULT, type MoneyMode } from '../lib/money.js';
import type { Random } from '../lib/roll.js';
import type { EventsPort, ListOpResult, ListRepository, ListWrite } from '../ports/index.js';
import { LiveFeed } from './liveFeed.svelte.js';

/** How long a write that found no network waits before it is sent again. */
export const RETRY_MS = 15_000;
/** How long the buffer waits after the last change before it is sent. */
export const QUIET_MS = 2_000;
/** How many counted faults in a row split a request, or drop a lone write. */
export const FAULT_LIMIT = 3;
/** How many reads `detail` makes of one list before it says the read failed. */
export const DETAIL_READS = 3;

/** Whether the store holds a list's entries' details: `absent` holds heads only. */
export type ListDetail = 'absent' | 'loading' | 'ready' | 'error';

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

export class CloudLists {
  /** `idle` signed out; `loading` until the first read answers; `error` when it failed. */
  status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
  /* Raw: a writer replaces the array and the list it changes, never mutates, so an
     edit redraws that list alone. Newest edit first. */
  lists = $state.raw<CloudList[]>([]);
  /** Whether every write is in: `failed` while one waits for the network. */
  sync = $state<'saved' | 'saving' | 'failed'>('saved');
  /** The account's list and entry limits; null for none or before a limit read answered. A
   *  failed limit read keeps the number known; a refusal for the same key replaces it with
   *  the one the database applied. */
  listLimit = $state<number | null>(null);
  entryLimit = $state<number | null>(null);

  /* The detail state of each list that is not `absent`, by id; replaced on every change. */
  #details = $state.raw<Record<string, Exclude<ListDetail, 'absent'>>>({});

  readonly #repo: ListRepository;
  readonly #say: (msg: Msg, error?: boolean) => void;
  readonly #dict: () => Dict;
  /* Each list's local edits, by id: a detail read that overlapped an edit of one of its
     lists is made again; an edit of another list cannot make its rows stale. */
  #editsOf: Record<string, number> = {};
  /* The detail read running for each list: a second call joins it. */
  #detailRuns: Record<string, Promise<void>> = {};

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
  /* Each read's number, taken when it is sent, and the newest one applied: an answer older
     than the read last applied is dropped, so it can neither remove a list a newer read
     brought nor bring back one it deleted. */
  #readSeq = 0;
  #appliedSeq = 0;
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

  /** Whether the account holds as many lists as its limit allows, a list made and not yet
   *  sent counted; false while the limit is unknown. */
  full(): boolean {
    return this.listLimit !== null && this.lists.length >= this.listLimit;
  }

  get(id: string): CloudList | undefined {
    return this.lists.find((l) => l.id === id);
  }

  /** Whether the store holds the list's entries' details. */
  detailOf(id: string): ListDetail {
    return this.#details[id] ?? 'absent';
  }

  #setDetail(ids: readonly string[], state: ListDetail): void {
    const next = { ...this.#details };
    for (const id of ids) {
      if (state === 'absent') Reflect.deleteProperty(next, id);
      else next[id] = state;
    }
    this.#details = next;
  }

  /**
   * Reads the entries of the named lists that the store holds and has not read whole; a
   * list whose read runs is joined, never read twice. The buffer goes first, so the answer
   * holds every local edit. Answers whether every named list the store still holds is
   * `ready`; false at once unless the account is read.
   */
  async detail(ids: readonly string[]): Promise<boolean> {
    if (this.status !== 'ready') return false;
    const epoch = this.#epoch;
    const runs: Promise<void>[] = [];
    const group: string[] = [];
    for (const id of ids) {
      if (!this.get(id) || this.detailOf(id) === 'ready' || group.includes(id)) continue;
      const running = this.#detailRuns[id];
      if (running) {
        if (!runs.includes(running)) runs.push(running);
      } else group.push(id);
    }
    if (group.length) {
      const run = this.#readRows(group).finally(() => {
        for (const id of group) {
          if (this.#detailRuns[id] === run) Reflect.deleteProperty(this.#detailRuns, id);
        }
      });
      for (const id of group) this.#detailRuns[id] = run;
      runs.push(run);
    }
    await Promise.all(runs);
    return (
      epoch === this.#epoch &&
      this.#readNow() &&
      ids.every((id) => !this.get(id) || this.detailOf(id) === 'ready')
    );
  }

  /* One detail read of `group`: the buffer first, then `rows`, again after an overlapping
     edit of one of its lists or an answer older than the held head, at most `DETAIL_READS`
     reads. */
  async #readRows(group: readonly string[]): Promise<void> {
    const epoch = this.#epoch;
    this.#setDetail(group, 'loading');
    let waiting = [...group];
    for (let n = 0; n < DETAIL_READS && waiting.length; n++) {
      const sent = await this.flushNow();
      if (epoch !== this.#epoch) return;
      /* Only a write that found no network fails the read: an edit made during the flush
         waits for its own quiet window, and the check after the read covers the group's. */
      if (!sent && this.#unsent()) {
        this.#setDetail(waiting, 'error');
        return;
      }
      const edits = waiting.map((id) => this.#editsOf[id] ?? 0);
      const read = await this.#repo.rows(waiting);
      if (epoch !== this.#epoch) return;
      if (!read.ok) {
        this.#setDetail(waiting, 'error');
        return;
      }
      const from = waiting;
      if (
        from.some((id, i) => (this.#editsOf[id] ?? 0) !== edits[i]) ||
        this.#queue.some((q) => from.includes(q.list))
      ) {
        continue;
      }
      const rows: Record<string, ListRow> = Object.fromEntries(
        read.lists.map((r) => [r.id, r])
      );
      const again: string[] = [];
      const ready: string[] = [];
      const gone: string[] = [];
      let lists = this.lists;
      for (const id of from) {
        if (!this.get(id)) continue;
        const row = rows[id];
        if (!row) {
          gone.push(id);
          continue;
        }
        const had = this.#read[id];
        if (had && row.revision < had.rev) {
          again.push(id);
          continue;
        }
        const list = this.#withLinked(toCloudList(row));
        this.#read[id] = { at: row.updated_at, rev: row.revision, list };
        lists = lists.map((l) => (l.id === id ? list : l));
        ready.push(id);
      }
      if (gone.length) {
        /* Deleted elsewhere: the list leaves as a re-read drops it, and a re-read follows,
           so a read sent before the delete cannot leave it on the index. */
        lists = lists.filter((l) => !gone.includes(l.id));
        for (const id of gone) Reflect.deleteProperty(this.#read, id);
        this.#setDetail(gone, 'absent');
      }
      if (ready.length || gone.length) this.lists = [...lists].sort(byUpdated);
      this.#setDetail(ready, 'ready');
      if (gone.length) {
        this.#reread = true;
        this.#rereadWhenIdle();
      }
      this.#readNewLinks();
      waiting = again;
    }
    const failed = waiting.filter((id) => this.get(id));
    if (failed.length) this.#setDetail(failed, 'error');
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
    this.#editsOf = {};
    this.#detailRuns = {};
    this.#details = {};
    this.lists = [];
    this.listLimit = null;
    this.entryLimit = null;
    this.status = 'idle';
    this.sync = 'saved';
  }

  /* Whether a write waits for the network; a method, so a check after an await is not
     narrowed by one before it. */
  #unsent(): boolean {
    return this.sync === 'failed';
  }

  /* Whether the account is read; a method, so a check after an await is not narrowed by one
     before it. */
  #readNow(): boolean {
    return this.status === 'ready';
  }

  /* Whether a local edit, a waiting write or a flush overlapped a read that started at
     `edits`. */
  #overlapped(edits: number): boolean {
    return edits !== this.#edits || this.#queue.length > 0 || this.#flushing;
  }

  async #pull(): Promise<void> {
    const epoch = this.#epoch;
    const edits = this.#edits;
    /* The revisions held: the read sends only the lists whose revision moved. */
    const known = Object.fromEntries(Object.entries(this.#read).map(([id, r]) => [id, r.rev]));
    const seq = ++this.#readSeq;
    const read = await (Object.keys(known).length ? this.#repo.list(known) : this.#repo.list());
    if (epoch !== this.#epoch) return;
    /* A limit is not row data: a read dropped below still applies it, since the port reads
       the limits again only after a failed limit read. A limit read that failed or was not
       made (undefined) keeps the limit known. */
    if (read.ok) {
      if (read.listLimit !== undefined) this.listLimit = read.listLimit;
      if (read.entryLimit !== undefined) this.entryLimit = read.entryLimit;
    }
    if (seq < this.#appliedSeq) return;
    if (this.#overlapped(edits)) {
      this.#reread = true;
      this.#rereadWhenIdle();
      return;
    }
    /* A changed list this tab holds whole is read whole too: its head alone would drop the
       details a page draws. */
    const whole = read.ok
      ? read.lists
          .filter((h) => {
            const had = this.#read[h.id];
            return this.detailOf(h.id) === 'ready' && (!had || h.revision > had.rev);
          })
          .map((h) => h.id)
      : [];
    let rows: readonly ListRow[] = [];
    if (whole.length) {
      const got = await this.#repo.rows(whole);
      if (epoch !== this.#epoch || seq < this.#appliedSeq) return;
      if (this.#overlapped(edits)) {
        this.#reread = true;
        this.#rereadWhenIdle();
        return;
      }
      if (!got.ok) {
        if (this.status === 'loading') this.status = 'error';
        return;
      }
      rows = got.lists;
    }
    if (read.ok) {
      if (!this.#apply(read.lists, read.kept ?? [], rows)) {
        /* A kept list this store no longer holds (an overlapping read replaced it): read
           again with the revisions held now, and draw nothing from this read. */
        this.#reread = true;
        this.#rereadWhenIdle();
        return;
      }
      this.#appliedSeq = seq;
      this.#rereadWhenIdle();
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

  /* Answers false, changing nothing, when a kept id is not held. A list held whole takes its
     row from `rows`, never its head alone; with no row as new as the head it stays as held
     and a later re-read reads it whole. */
  #apply(
    heads: readonly ListHead[],
    kept: readonly string[],
    rows: readonly ListRow[] = []
  ): boolean {
    const read: Record<string, { at: string; rev: number; list: CloudList }> = {};
    const keptLists: CloudList[] = [];
    for (const id of kept) {
      const had = this.#read[id];
      if (!had) return false;
      read[id] = had;
      keptLists.push(had.list);
    }
    const whole: Record<string, ListRow> = Object.fromEntries(rows.map((r) => [r.id, r]));
    const next = heads.flatMap((head): CloudList[] => {
      const had = this.#read[head.id];
      /* A row older than the one held is an overlapping read's: the held list stays. */
      if (had && head.revision < had.rev) {
        read[head.id] = had;
        return [had.list];
      }
      if (had?.at === head.updated_at) {
        read[head.id] = { at: head.updated_at, rev: head.revision, list: had.list };
        return [had.list];
      }
      if (this.detailOf(head.id) === 'ready') {
        const row = whole[head.id];
        if (row && row.revision >= head.revision) {
          const list = this.#withLinked(toCloudList(row));
          read[row.id] = { at: row.updated_at, rev: row.revision, list };
          return [list];
        }
        this.#reread = true;
        const held = had?.list ?? this.get(head.id);
        if (had) read[head.id] = had;
        return held ? [held] : [];
      }
      const list = this.#withLinked(toCloudHead(head));
      read[head.id] = { at: head.updated_at, rev: head.revision, list };
      return [list];
    });
    next.push(...keptLists);
    const dropped = Object.keys(this.#details).filter((id) => !Object.hasOwn(read, id));
    /* A list held whole whose row did not answer stays drawn with its state. */
    const gone = dropped.filter((id) => !next.some((l) => l.id === id));
    if (gone.length) this.#setDetail(gone, 'absent');
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
    this.#editsOf[op.list] = (this.#editsOf[op.list] ?? 0) + 1;
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
      if (!answer.ok && answer.error === 'fault' && answer.timeout && n > 1) {
        /* A statement timeout rolled the call back: the first half goes at once, with no
           wait and no «Не сохранено». A lone write keeps the counted path below. */
        this.#faults = 0;
        this.#faultAt = null;
        this.#cap = Math.ceil(n / 2);
        continue;
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

  /** Makes a list and answers it first in `lists`, its name trimmed or untitled. */
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
    /* It holds every detail, so no read is needed. */
    this.#setDetail([id], 'ready');
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
    this.#setDetail([id], 'absent');
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

  /** Marks the entry «Только для мастера» or shows it to the players again. */
  setGmOnly(id: string, entryId: string, on: boolean): void {
    const rowId = this.get(id)?.entryIds[entryId];
    if (!rowId) return;
    this.#change(id, (l) => withMeta(l, entryId, 'gmOnly', on));
    this.#enqueue({
      key: `entry:${rowId}:gmOnly`,
      list: id,
      write: { op: 'update_entry', id: rowId, patch: { gm_only: on } }
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

  /** Writes back what `removeEntry` removed: the same source and linked item. Only on a list
   *  held whole: a caller that read no details would write empty ones. */
  restoreEntry(id: string, entryId: string, at: number, meta: ListEntryMeta): void {
    const l = this.get(id);
    if (!l || l.ids.includes(entryId) || this.detailOf(id) !== 'ready') return;
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

  /** Points the list's entry of `oldKey` at the item `hbItem`, whose key is `newKey`, in
   *  place (`relink`; the database moves the row's key, `list_entries_hb_key`): its
   *  position, quantity, price, notes and GM-only mark stay under `newKey`. False when the
   *  list holds no entry of `oldKey`, or another entry of `newKey`. */
  relinkAs(id: string, oldKey: string, newKey: string, hbItem: string): boolean {
    const l = this.get(id);
    const rowId = l?.entryIds[oldKey];
    if (!l || !rowId || (newKey !== oldKey && l.ids.includes(newKey))) return false;
    const moved = <T>(o: Readonly<Record<string, T>> | undefined): Record<string, T> => {
      const out: Record<string, T> = {};
      for (const [k, v] of Object.entries(o ?? {})) out[k === oldKey ? newKey : k] = v;
      return out;
    };
    this.#change(id, (x) => {
      const out: CloudList = {
        ...x,
        ids: x.ids.map((k) => (k === oldKey ? newKey : k)),
        entryIds: moved(x.entryIds),
        links: { ...moved(x.links), [newKey]: hbItem }
      };
      if (x.meta) out.meta = moved(x.meta);
      return this.#withLinked(out);
    });
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
