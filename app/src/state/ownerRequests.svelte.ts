/* The owner's side of the purchase requests: the heads of every pending request
 * of the account's lists, read once the lists are, again on the owner topic's
 * `request` message, on the feed's join and safety re-read, on the poll while
 * the feed is not live and when the tab is shown again; the lines of the focused
 * list's requests, read at `focus(listId)` and for each new request of that list;
 * a read asked for while one runs is made once more when it ends; apply and decline;
 * and what was decided on this page load, with its items, until it is hidden.
 * Beside them, the change log of the owner's lists (`list_notices`): read with the
 * requests and on the topic's `notice` message, marked read with them, and hidden by id.
 * The list page's panel focuses its list, whose notices are read whole: a read of every
 * list is cut at the row cap and only counts.
 *
 * Apply sends the account's write buffer first, so a buffered quantity edit
 * never lands after it, and re-reads the lists after it: the apply's own
 * `list` message carries this tab's id and is ignored as an echo. A decision
 * answered `decided` after this tab's own `network`, or `gone`, is a quiet
 * re-read with no toast (docs/specs/FEATURES.md, "Account and browser lists";
 * docs/DECISIONS.md, 2026-09-26, "An over-stock request is refused whole;
 * Apply available clamps; zero removes"). */

import type { ShareAudience } from '../lib/cloudLists.js';
import type { Msg } from '../lib/dict.js';
import { COALESCE_MS, readNoticeMessage, readRequestMessage } from '../lib/live.js';
import {
  noticeOf,
  pendingFor,
  type ListNotice,
  type OwnerRequest,
  type RequestHead,
  type RequestLine,
  type ShortLine
} from '../lib/requests.js';
import type { RequestRepository } from '../ports/index.js';

type NoticesRead = Awaited<ReturnType<RequestRepository['notices']>>;

const expired = (h: RequestHead, now: number): boolean => Date.parse(h.expiresAt) <= now;

export interface OwnerHooks {
  /** Sends the account's write buffer; false while a write waits for the network. */
  flush: () => Promise<boolean>;
  /** Re-reads the account's lists. */
  refreshLists: () => Promise<void>;
  say: (msg: Msg, error?: boolean) => void;
  /** This page load's tab id: a message with it is this tab's own. */
  tab: () => string;
  /** Requests not seen before arrived, after the first heads read: one list id each. */
  arrived?: (listIds: string[]) => void;
}

/** A request decided on this page load. */
export interface DecidedRequest {
  id: string;
  listId: string;
  audience: ShareAudience;
  createdAt: string;
  verdict: 'applied' | 'taken' | 'declined';
  taken: number;
  /** The items the request asked for, with the asked count. */
  lines: { item: string; qty: number }[];
}

export class OwnerRequests {
  /** `idle` signed out or before the first read; `loading` while the first read, or the
   *  lines read of a newly focused list, is out; `error` when that read failed; a later
   *  failure keeps what is shown. */
  status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
  /* Raw: a read replaces the arrays, never mutates them. Every pending request of every
     list, expired ones too: the pages hide those by the clock. */
  heads = $state.raw<RequestHead[]>([]);
  /** The pending requests whose lines this store holds: the focused list's, and an earlier
   *  focused list's while they stay pending. */
  requests = $state.raw<OwnerRequest[]>([]);
  /** Newest first. */
  decided = $state.raw<DecidedRequest[]>([]);
  /** The short lines of a refused apply, by request id. */
  short = $state.raw<Record<string, ShortLine[]>>({});
  /** The request being decided, or null. */
  busy = $state<string | null>(null);
  /** Bumped once per read that found a request not seen before, after the first read. */
  arrived = $state(0);
  /** The list of the newest request or notice that arrived. */
  arrivedList = $state<string | null>(null);
  /** What arrived last: a purchase request or a change-log notice. */
  arrivedKind = $state<'request' | 'notice'>('request');
  /** The change log of the owner's lists, newest first. */
  notices = $state.raw<ListNotice[]>([]);
  /** Whether the focused list's own notices read has answered since it was focused. */
  noticesRead = $state(false);

  readonly #repo: RequestRepository;
  readonly #hooks: OwnerHooks;
  /* Bumped by `clear()`: an answer that started before it is dropped. */
  #epoch = 0;
  /* Set false by the first `ok` heads read and reset by `clear()`: a sign-in does not
     announce every pending request. */
  #first = true;
  /* The read in flight, and whether a call asked for another while it ran. */
  #running: Promise<void> | null = null;
  #again = false;
  /* Plain records, not reactive: nothing draws them. */
  #seen: Record<string, true> = {};
  /* The lines read, by request id, while the request is pending. */
  #lines: Record<string, RequestLine[]> = {};
  /* The requests this tab decided on this page load: a read that started before the
     decision cannot bring one back. */
  #decidedIds: Record<string, true> = {};
  /* Requests whose decision got no answer: the transport may have sent it twice. */
  #unsure: Record<string, true> = {};
  /* The lists whose read mark is in flight. */
  #marking: Record<string, true> = {};
  /* Each notice seen, by id, at the time it was made; and the list the panel draws. */
  #seenNotices: Record<string, string> = {};
  #firstNotices = true;
  #focus: string | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor(repo: RequestRepository, hooks: OwnerHooks) {
    this.#repo = repo;
    this.#hooks = hooks;
  }

  /** The list's requests whose lines are held and that have not expired at `now`, newest
   *  first: a request is drawn only with its lines. */
  forList(listId: string, now: number): OwnerRequest[] {
    return pendingFor(this.requests, listId, now);
  }

  /** The count of each list's requests that have not expired at `now`, by list id, in one
   *  pass over the heads; a list with none is absent. */
  pendingCounts(now: number): Map<string, number> {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a count made per call, never state
    const counts = new Map<string, number>();
    for (const h of this.heads) {
      if (!expired(h, now)) counts.set(h.listId, (counts.get(h.listId) ?? 0) + 1);
    }
    return counts;
  }

  pendingCount(listId: string, now: number): number {
    let n = 0;
    for (const h of this.heads) if (h.listId === listId && !expired(h, now)) n++;
    return n;
  }

  /** The count of the unread requests of every list that have not expired at `now`. */
  unreadCount(now: number): number {
    let n = 0;
    for (const h of this.heads) if (h.readAt === null && !expired(h, now)) n++;
    return n;
  }

  /** The list's notices, newest first. */
  noticesFor(listId: string): ListNotice[] {
    return this.notices.filter((n) => n.listId === listId);
  }

  /** How many of the list's notices are unread. */
  unreadNotices(listId: string): number {
    return this.notices.filter((n) => n.listId === listId && n.readAt === null).length;
  }

  /** The list whose panel is drawn, or null: each read then reads its notices whole and the
   *  lines of its requests that the store does not hold. */
  focus(listId: string | null): void {
    if (listId === this.#focus) return;
    this.#focus = listId;
    this.noticesRead = false;
    if (listId === null) return;
    if (this.status === 'ready' && this.#linesMissing(listId)) this.status = 'loading';
    void this.read();
  }

  /* Whether a head of the list that has not expired has no lines held. */
  #linesMissing(listId: string): boolean {
    const now = Date.now();
    return this.heads.some(
      (h) => h.listId === listId && !expired(h, now) && !this.#lines[h.id]
    );
  }

  decidedFor(listId: string): DecidedRequest[] {
    return this.decided.filter((d) => d.listId === listId);
  }

  /** Forgets the list's decided requests of this page load. */
  forget(listId: string): void {
    this.decided = this.decided.filter((d) => d.listId !== listId);
  }

  /** Reads the pending heads, the notices and the focused list's missing lines; a failed
   *  read keeps what is shown. A call while a read runs makes one more read when it ends
   *  and resolves after it. */
  read(): Promise<void> {
    if (this.#running) {
      this.#again = true;
      return this.#running;
    }
    if (this.status === 'idle') this.status = 'loading';
    const run = this.#passes(this.#epoch);
    this.#running = run;
    return run;
  }

  async #passes(epoch: number): Promise<void> {
    try {
      do {
        this.#again = false;
        await this.#readOnce();
      } while (this.#askedAgain() && epoch === this.#epoch);
    } finally {
      /* In the same step as the last check of the flag: a call after it starts a new read
         instead of joining one that already ended. After `clear()` (a new epoch) the field
         may hold a newer read, which this one leaves alone. */
      if (epoch === this.#epoch) this.#running = null;
    }
  }

  /* A call to `read()` sets the flag during the pass; a read through a method keeps the
     type checker from narrowing it to the `false` set before the pass. */
  #askedAgain(): boolean {
    return this.#again;
  }

  async #readOnce(): Promise<void> {
    const epoch = this.#epoch;
    const focus = this.#focus;
    const [r, all, one] = await Promise.all([
      this.#repo.list(),
      this.#repo.notices(),
      focus === null ? null : this.#repo.notices(focus)
    ]);
    if (epoch !== this.#epoch) return;
    if (!r.ok) {
      this.#readNotices(all, focus, one);
      if (this.status === 'loading' && this.#settles(focus)) this.status = 'error';
      return;
    }
    const now = Date.now();
    const missing =
      focus === null
        ? []
        : r.requests
            .filter(
              (h) =>
                h.listId === focus &&
                !expired(h, now) &&
                !this.#lines[h.id] &&
                !this.#decidedIds[h.id]
            )
            .map((h) => h.id);
    let linesOk = true;
    if (missing.length) {
      const got = await this.#repo.lines(missing);
      if (epoch !== this.#epoch) return;
      if (got.ok) for (const x of got.requests) this.#lines[x.id] = x.lines;
      else linesOk = false;
    }
    /* Together, so the panel sees the notices, heads and lines of one pass at once. */
    this.#readNotices(all, focus, one);
    this.#readHeads(r.requests);
    if (!this.#settles(focus)) return;
    if (linesOk || this.#focus === null) this.status = 'ready';
    else if (this.status === 'loading') this.status = 'error';
  }

  /* Whether a pass that read for `focus` sets `status`: a pass whose focus is stale leaves
     it to the pass that `focus()` queued; with no list focused now, none was queued. */
  #settles(focus: string | null): boolean {
    return focus === this.#focus || this.#focus === null;
  }

  /* The cut read of every list never decides the focused list: its own read does. */
  #readNotices(all: NoticesRead, focus: string | null, one: NoticesRead | null): void {
    if (!all.ok && !one?.ok) return;
    const rows = (x: NoticesRead): ListNotice[] =>
      x.ok ? x.notices.flatMap((n) => noticeOf(n) ?? []) : [];
    const others = all.ok ? rows(all) : this.notices;
    const focused =
      focus !== null && one?.ok ? rows(one) : this.notices.filter((n) => n.listId === focus);
    if (focus !== null && one?.ok && focus === this.#focus) this.noticesRead = true;
    const next = [...others.filter((n) => n.listId !== focus), ...focused].sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    );
    const fresh = next.filter((n) => this.#seenNotices[n.id] !== n.createdAt);
    for (const n of fresh) this.#seenNotices[n.id] = n.createdAt;
    const newest = fresh[0];
    if (!this.#firstNotices && newest) {
      this.arrivedList = newest.listId;
      this.arrivedKind = 'notice';
      this.arrived++;
    }
    this.#firstNotices = false;
    const same =
      next.length === this.notices.length &&
      next.every((n, i) => {
        const o = this.notices[i];
        return o?.id === n.id && o.createdAt === n.createdAt && o.readAt === n.readAt;
      });
    if (!same) this.notices = next;
  }

  /* A heads read: the arrivals, the heads, and the requests whose lines are held (the same
     object while its read mark and expiry stay). A head this tab decided stays gone. */
  #readHeads(read: readonly RequestHead[]): void {
    const heads = read.filter((h) => !this.#decidedIds[h.id]);
    const fresh = heads.filter((h) => !this.#seen[h.id]);
    for (const h of fresh) this.#seen[h.id] = true;
    if (!this.#first && fresh.length) {
      const newest = fresh.reduce((a, b) =>
        Date.parse(b.createdAt) > Date.parse(a.createdAt) ? b : a
      );
      this.arrivedList = newest.listId;
      this.arrivedKind = 'request';
      this.arrived++;
      this.#hooks.arrived?.(fresh.map((h) => h.listId));
    }
    this.#first = false;
    const moved =
      heads.length !== this.heads.length ||
      heads.some((h, i) => {
        const o = this.heads[i];
        return o?.id !== h.id || o.readAt !== h.readAt || o.expiresAt !== h.expiresAt;
      });
    if (moved) this.heads = heads;
    const pending: Record<string, true> = {};
    for (const h of heads) pending[h.id] = true;
    for (const id of Object.keys(this.#lines)) {
      if (!pending[id]) Reflect.deleteProperty(this.#lines, id);
    }
    const before: Record<string, OwnerRequest> = {};
    for (const x of this.requests) before[x.id] = x;
    const next: OwnerRequest[] = [];
    for (const h of heads) {
      const lines = this.#lines[h.id];
      if (!lines) continue;
      const o = before[h.id];
      next.push(
        o && o.readAt === h.readAt && o.expiresAt === h.expiresAt ? o : { ...h, lines }
      );
    }
    if (next.length !== this.requests.length || next.some((x, i) => x !== this.requests[i])) {
      this.requests = next;
    }
    if (Object.keys(this.short).some((id) => !pending[id])) {
      this.short = Object.fromEntries(Object.entries(this.short).filter(([id]) => pending[id]));
    }
  }

  /** Marks the list's unread requests and notices read (`mark_list_read`) when it holds
   *  one, then reads them again: each now expires within the hour. It marks nothing while
   *  a request of the list has no lines held: the server marks every unread request of the
   *  list, so an undrawn one would start its last hour unseen. It marks nothing before the
   *  first `ok` heads read of the page: with no heads held, no request of the list is known
   *  to be drawn. A failure changes nothing, and the next draw asks again. */
  async markRead(listId: string): Promise<void> {
    if (this.#first || this.#marking[listId] || this.#linesMissing(listId)) return;
    if (
      !this.heads.some((h) => h.listId === listId && h.readAt === null) &&
      !this.unreadNotices(listId)
    ) {
      return;
    }
    const epoch = this.#epoch;
    this.#marking[listId] = true;
    try {
      const r = await this.#repo.markRead(listId);
      if (epoch !== this.#epoch || !r.ok) return;
      await this.read();
    } finally {
      if (epoch === this.#epoch) Reflect.deleteProperty(this.#marking, listId);
    }
  }

  /** The owner topic's message: another tab's or device's request or decision, or an
   *  author's change to an item of one of the lists. */
  message(event: string, payload: unknown): void {
    if (readNoticeMessage(event, payload)) {
      this.#coalesced();
      return;
    }
    const m = readRequestMessage(event, payload);
    if (!m || m.by === this.#hooks.tab()) return;
    this.#coalesced();
  }

  /** «Скрыть»: deletes the list's notices `ids`, drawn gone at once; a failure says so and
   *  reads again, which brings them back. */
  async hideNotices(listId: string, ids: readonly string[]): Promise<void> {
    if (!ids.length) return;
    const epoch = this.#epoch;
    this.notices = this.notices.filter((n) => n.listId !== listId || !ids.includes(n.id));
    const r = await this.#repo.hideNotices(listId, ids);
    if (epoch !== this.#epoch || r.ok) return;
    this.#hooks.say((t) => t.noticeHideFailed, true);
    await this.read();
  }

  /** The owner feed joined, or its safety re-read came due. */
  refetch(): void {
    this.#coalesced();
  }

  /** Applies a request: its counts, or with `clamp` what the list holds. */
  async apply(id: string, clamp: boolean): Promise<void> {
    if (this.busy !== null) return;
    const epoch = this.#epoch;
    this.busy = id;
    try {
      if (!(await this.#hooks.flush())) {
        if (epoch === this.#epoch) this.#hooks.say((t) => t.requestActFailed, true);
        return;
      }
      if (epoch !== this.#epoch) return;
      const r = await this.#repo.apply(id, clamp);
      if (epoch !== this.#epoch) return;
      if (r.ok) {
        this.#decided(id, clamp ? 'taken' : 'applied', r.taken);
        const taken = r.taken;
        this.#hooks.say(
          clamp ? (t) => t.requestTaken.replace('%n', String(taken)) : (t) => t.requestApplied
        );
        await this.#hooks.refreshLists();
        await this.read();
        return;
      }
      if (r.error === 'short') {
        this.short = { ...this.short, [id]: r.short };
        return;
      }
      await this.#refused(id, r.error);
    } finally {
      if (epoch === this.#epoch) this.busy = null;
    }
  }

  /** Declines a request; no entry changes. */
  async decline(id: string): Promise<void> {
    if (this.busy !== null) return;
    const epoch = this.#epoch;
    this.busy = id;
    try {
      const r = await this.#repo.decline(id);
      if (epoch !== this.#epoch) return;
      if (r.ok) {
        this.#decided(id, 'declined', 0);
        this.#hooks.say((t) => t.requestDeclined);
        await this.read();
        return;
      }
      await this.#refused(id, r.error);
    } finally {
      if (epoch === this.#epoch) this.busy = null;
    }
  }

  /** Signed out, or another user: nothing of the account's requests stays. */
  clear(): void {
    this.#epoch++;
    this.#first = true;
    this.#running = null;
    this.#again = false;
    this.#firstNotices = true;
    this.#seen = {};
    this.#lines = {};
    this.#decidedIds = {};
    this.#seenNotices = {};
    this.#unsure = {};
    this.#marking = {};
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
    this.status = 'idle';
    this.heads = [];
    this.requests = [];
    this.decided = [];
    this.short = {};
    this.busy = null;
    this.arrived = 0;
    this.arrivedList = null;
    this.arrivedKind = 'request';
    this.notices = [];
    this.noticesRead = false;
  }

  async #refused(
    id: string,
    error: 'decided' | 'expired' | 'gone' | 'network' | 'refused'
  ): Promise<void> {
    const say = this.#hooks.say;
    switch (error) {
      case 'network':
        this.#unsure[id] = true;
        say((t) => t.requestActFailed, true);
        return;
      case 'decided':
        /* This tab's own decision, sent twice by the transport: the data is right. */
        if (!this.#unsure[id]) say((t) => t.requestDecidedElsewhere, true);
        await this.#quiet(id);
        return;
      case 'gone':
        /* Its list was deleted elsewhere, or the housekeeping removed it: nothing to act on. */
        await this.#quiet(id);
        return;
      case 'expired':
        say((t) => t.requestExpired, true);
        await this.read();
        return;
      case 'refused':
        say((t) => t.writeRefused, true);
        await this.read();
        return;
    }
  }

  /* A replayed decision may have changed entries, and its own `list` message carried this
     tab's id, which the lists ignore: both are read again. */
  async #quiet(id: string): Promise<void> {
    Reflect.deleteProperty(this.#unsure, id);
    await this.#hooks.refreshLists();
    await this.read();
  }

  #decided(id: string, verdict: DecidedRequest['verdict'], taken: number): void {
    Reflect.deleteProperty(this.#unsure, id);
    this.#decidedIds[id] = true;
    Reflect.deleteProperty(this.#lines, id);
    const r = this.requests.find((x) => x.id === id);
    if (id in this.short) {
      this.short = Object.fromEntries(Object.entries(this.short).filter(([k]) => k !== id));
    }
    if (this.heads.some((h) => h.id === id)) this.heads = this.heads.filter((h) => h.id !== id);
    if (!r) return;
    this.requests = this.requests.filter((x) => x.id !== id);
    this.decided = [
      {
        id,
        listId: r.listId,
        audience: r.audience,
        createdAt: r.createdAt,
        verdict,
        taken,
        lines: r.lines.map((l) => ({ item: l.item, qty: l.qty }))
      },
      ...this.decided
    ];
  }

  #coalesced(): void {
    this.#timer ??= setTimeout(() => {
      this.#timer = null;
      void this.read();
    }, COALESCE_MS);
  }
}
