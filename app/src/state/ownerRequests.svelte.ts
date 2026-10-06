/* The owner's side of the purchase requests: every pending request of the
 * account's lists, read once the lists are, again on the owner topic's
 * `request` message, on the feed's join and safety re-read, on the poll while
 * the feed is not live and when the tab is shown again; apply and decline;
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
  type ShortLine
} from '../lib/requests.js';
import type { RequestRepository } from '../ports/index.js';

type NoticesRead = Awaited<ReturnType<RequestRepository['notices']>>;
type RequestsRead = Awaited<ReturnType<RequestRepository['list']>>;

export interface OwnerHooks {
  /** Sends the account's write buffer; false while a write waits for the network. */
  flush: () => Promise<boolean>;
  /** Re-reads the account's lists. */
  refreshLists: () => Promise<void>;
  say: (msg: Msg, error?: boolean) => void;
  /** This page load's tab id: a message with it is this tab's own. */
  tab: () => string;
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
  /* Raw: a read replaces the arrays, never mutates them. Every pending row read,
     expired ones too: the pages hide those by the clock. */
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
  #first = true;
  /* Plain records, not reactive: nothing draws them. */
  #seen: Record<string, true> = {};
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

  /** The list's requests that have not expired at `now`, newest first. */
  forList(listId: string, now: number): OwnerRequest[] {
    return pendingFor(this.requests, listId, now);
  }

  pendingCount(listId: string, now: number): number {
    return this.forList(listId, now).length;
  }

  /** The list's notices, newest first. */
  noticesFor(listId: string): ListNotice[] {
    return this.notices.filter((n) => n.listId === listId);
  }

  /** How many of the list's notices are unread. */
  unreadNotices(listId: string): number {
    return this.notices.filter((n) => n.listId === listId && n.readAt === null).length;
  }

  /** The list whose panel is drawn, or null: each read then reads its notices whole. */
  focus(listId: string | null): void {
    if (listId === this.#focus) return;
    this.#focus = listId;
    this.noticesRead = false;
    if (listId !== null) void this.read();
  }

  decidedFor(listId: string): DecidedRequest[] {
    return this.decided.filter((d) => d.listId === listId);
  }

  /** Forgets the list's decided requests of this page load. */
  forget(listId: string): void {
    this.decided = this.decided.filter((d) => d.listId !== listId);
  }

  /** Reads the pending requests and the notices; a failed read keeps what is shown. */
  async read(): Promise<void> {
    const epoch = this.#epoch;
    const focus = this.#focus;
    const [r, all, one] = await Promise.all([
      this.#repo.list(),
      this.#repo.notices(),
      focus === null ? null : this.#repo.notices(focus)
    ]);
    if (epoch !== this.#epoch) return;
    this.#readNotices(all, focus, one);
    this.#readRequests(r);
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

  #readRequests(r: RequestsRead): void {
    if (!r.ok) return;
    const fresh = r.requests.filter((x) => !this.#seen[x.id]);
    for (const x of fresh) this.#seen[x.id] = true;
    if (!this.#first && fresh.length) {
      const newest = fresh.reduce((a, b) =>
        Date.parse(b.createdAt) > Date.parse(a.createdAt) ? b : a
      );
      this.arrivedList = newest.listId;
      this.arrivedKind = 'request';
      this.arrived++;
    }
    this.#first = false;
    this.requests = r.requests;
    const pending = (id: string): boolean => r.requests.some((x) => x.id === id);
    if (Object.keys(this.short).some((id) => !pending(id))) {
      this.short = Object.fromEntries(Object.entries(this.short).filter(([id]) => pending(id)));
    }
  }

  /** Marks the list's unread requests and notices read (`mark_list_read`) when it holds
   *  one, then reads them again: each now expires within the hour. A failure changes
   *  nothing, and the next draw asks again. */
  async markRead(listId: string): Promise<void> {
    if (this.#marking[listId]) return;
    if (
      !this.requests.some((r) => r.listId === listId && r.readAt === null) &&
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
    this.#firstNotices = true;
    this.#seen = {};
    this.#seenNotices = {};
    this.#unsure = {};
    this.#marking = {};
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
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
    const r = this.requests.find((x) => x.id === id);
    if (id in this.short) {
      this.short = Object.fromEntries(Object.entries(this.short).filter(([k]) => k !== id));
    }
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
