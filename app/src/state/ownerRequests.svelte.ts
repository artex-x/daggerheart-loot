/* The owner's side of the purchase requests: every pending request of the
 * account's lists, read once the lists are, again on the owner topic's
 * `request` message, on the feed's join and safety re-read, on the poll while
 * the feed is not live and when the tab is shown again; apply and decline;
 * and what was decided on this page load.
 *
 * Apply sends the account's write buffer first, so a buffered quantity edit
 * never lands after it, and re-reads the lists after it: the apply's own
 * `list` message carries this tab's id and is ignored as an echo. A decision
 * answered `decided` after this tab's own `network`, or `gone`, is a quiet
 * re-read with no toast (docs/specs/FEATURES.md, "Account and browser lists";
 * docs/DECISIONS.md, 2026-09-26, "An over-stock request is refused whole;
 * Apply available clamps; zero removes"). */

import type { ShareAudience } from '../lib/cloudLists.js';
import type { Dict } from '../lib/dict.js';
import { COALESCE_MS, readRequestMessage } from '../lib/live.js';
import { pendingFor, type OwnerRequest, type ShortLine } from '../lib/requests.js';
import type { RequestRepository } from '../ports/index.js';

export interface OwnerHooks {
  /** Sends the account's write buffer; false while a write waits for the network. */
  flush: () => Promise<boolean>;
  /** Re-reads the account's lists. */
  refreshLists: () => Promise<void>;
  say: (msg: string, error?: boolean) => void;
  dict: () => Dict;
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
  /** The list of the newest request that arrived. */
  arrivedList = $state<string | null>(null);

  readonly #repo: RequestRepository;
  readonly #hooks: OwnerHooks;
  /* Bumped by `clear()`: an answer that started before it is dropped. */
  #epoch = 0;
  #first = true;
  /* Plain records, not reactive: nothing draws them. */
  #seen: Record<string, true> = {};
  /* Requests whose decision got no answer: the transport may have sent it twice. */
  #unsure: Record<string, true> = {};
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

  decidedFor(listId: string): DecidedRequest[] {
    return this.decided.filter((d) => d.listId === listId);
  }

  /** Reads the pending requests; a failed read keeps what is shown. */
  async read(): Promise<void> {
    const epoch = this.#epoch;
    const r = await this.#repo.list();
    if (epoch !== this.#epoch || !r.ok) return;
    const fresh = r.requests.filter((x) => !this.#seen[x.id]);
    for (const x of fresh) this.#seen[x.id] = true;
    if (!this.#first && fresh.length) {
      const newest = fresh.reduce((a, b) =>
        Date.parse(b.createdAt) > Date.parse(a.createdAt) ? b : a
      );
      this.arrivedList = newest.listId;
      this.arrived++;
    }
    this.#first = false;
    this.requests = r.requests;
    const pending = (id: string): boolean => r.requests.some((x) => x.id === id);
    if (Object.keys(this.short).some((id) => !pending(id))) {
      this.short = Object.fromEntries(Object.entries(this.short).filter(([id]) => pending(id)));
    }
  }

  /** The owner topic's message: another tab's or device's request or decision. */
  message(event: string, payload: unknown): void {
    const m = readRequestMessage(event, payload);
    if (!m || m.by === this.#hooks.tab()) return;
    this.#coalesced();
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
      const t = this.#hooks.dict();
      if (!(await this.#hooks.flush())) {
        if (epoch === this.#epoch) this.#hooks.say(t.requestActFailed, true);
        return;
      }
      if (epoch !== this.#epoch) return;
      const r = await this.#repo.apply(id, clamp);
      if (epoch !== this.#epoch) return;
      if (r.ok) {
        this.#decided(id, clamp ? 'taken' : 'applied', r.taken);
        this.#hooks.say(
          clamp ? t.requestTaken.replace('%n', String(r.taken)) : t.requestApplied
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
        this.#hooks.say(this.#hooks.dict().requestDeclined);
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
    this.#seen = {};
    this.#unsure = {};
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
    this.requests = [];
    this.decided = [];
    this.short = {};
    this.busy = null;
    this.arrived = 0;
    this.arrivedList = null;
  }

  async #refused(
    id: string,
    error: 'decided' | 'expired' | 'gone' | 'network' | 'refused'
  ): Promise<void> {
    const t = this.#hooks.dict();
    const say = this.#hooks.say;
    switch (error) {
      case 'network':
        this.#unsure[id] = true;
        say(t.requestActFailed, true);
        return;
      case 'decided':
        /* This tab's own decision, sent twice by the transport: the data is right. */
        if (!this.#unsure[id]) say(t.requestDecidedElsewhere, true);
        await this.#quiet(id);
        return;
      case 'gone':
        /* Its list was deleted elsewhere, or the housekeeping removed it: nothing to act on. */
        await this.#quiet(id);
        return;
      case 'expired':
        say(t.requestExpired, true);
        await this.read();
        return;
      case 'refused':
        say(t.writeRefused, true);
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
        taken
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
