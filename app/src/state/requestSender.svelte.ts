/* The reader's side of a purchase request on a share page `#/s/<token>`: the
 * send from the selection bar, and flow b - after an add from the bar, the
 * question whether to tell the list's owner, or the remembered answer.
 *
 * Nothing of a request is stored in the browser: the request id lives here, in
 * memory, only so that a second press after a `network` answer is a replay the
 * database inserts nothing for (docs/specs/FEATURES.md, "Account and browser
 * lists"; docs/DECISIONS.md, 2026-09-27, "A requester sees no request status;
 * the send toast is the only answer"). */

import { limitText } from '../lib/cloudLists.js';
import type { Dict } from '../lib/dict.js';
import { plural } from '../lib/plural.js';
import type { NotifyGm } from '../lib/prefs.js';
import type { Lang } from '../lib/types.js';
import type { RequestRepository } from '../ports/index.js';

/** The ticked entries with their taken counts. */
export type RequestLines = { item: string; qty: number }[];

export interface SenderHooks {
  newId: () => string;
  say: (msg: string, error?: boolean) => void;
  dict: () => Dict;
  lang: () => Lang;
  clearSel: () => void;
  /** Reads the open link again: its list changed, or it is gone. */
  reread: () => void;
  notifyGm: () => NotifyGm;
  setNotifyGm: (v: NotifyGm) => void;
}

export class RequestSender {
  /** A send runs. */
  sending = $state(false);
  /** Flow b's open question: the link, the lines the add carried and the add's toast. */
  asking = $state.raw<{ token: string; lines: RequestLines; after: string } | null>(null);

  readonly #repo: RequestRepository;
  readonly #hooks: SenderHooks;
  /* The selection the kept id was made for, and the id. */
  #key: string | null = null;
  #id: string | null = null;

  constructor(repo: RequestRepository, hooks: SenderHooks) {
    this.#repo = repo;
    this.#hooks = hooks;
  }

  /** Sends the lines to the link's owner. Without `after` (the bar's own button) a success
   *  clears the selection; with it (flow b) the add's toast gains the owner's line. */
  async send(token: string, lines: RequestLines, after?: string): Promise<void> {
    if (this.sending || !lines.length) return;
    const key = [token, ...lines.map((l) => `${l.item}*${String(l.qty)}`).sort()].join(' ');
    if (key !== this.#key || this.#id === null) {
      this.#key = key;
      this.#id = this.#hooks.newId();
    }
    this.sending = true;
    const r = await this.#repo.send(this.#id, token, lines);
    this.sending = false;
    const t = this.#hooks.dict();
    const say = this.#hooks.say;
    if (r.ok) {
      this.#drop();
      if (after === undefined) {
        this.#hooks.clearSel();
        say(t.requestSent);
      } else {
        say(`${after}. ${t.requestSentOwner}`);
      }
      return;
    }
    /* The same id again: the database inserts nothing for a replay. */
    if (r.error === 'network') {
      say(t.requestNetwork, true);
      return;
    }
    this.#drop();
    switch (r.error) {
      case 'limit':
        if (r.key === 'request_rate') say(t.requestRate, true);
        else if (r.key === 'pending_requests_per_list' && r.value !== null) {
          say(
            t.requestPending.replace('%s', plural(r.value, t.requestsN, this.#hooks.lang())),
            true
          );
        } else say(limitText(r.key, r.value, t), true);
        return;
      case 'stale':
        say(t.requestStale, true);
        this.#hooks.reread();
        return;
      case 'gone':
        /* The page itself turns into «Список больше не доступен». */
        this.#hooks.reread();
        return;
      case 'refused':
        say(t.requestRefused, true);
        return;
    }
  }

  /** Flow b after an add from the bar: nothing, a send, or the question, by `notifyGm`. */
  afterAdd(token: string, lines: RequestLines, after: string): void {
    const answer = this.#hooks.notifyGm();
    if (answer === 'never') return;
    if (answer === 'always') void this.send(token, lines, after);
    else this.asking = { token, lines, after };
  }

  /** Answers the question; `remember` saves the answer as `notifyGm`. */
  answer(send: boolean, remember: boolean): void {
    const q = this.asking;
    this.asking = null;
    if (!q) return;
    if (remember) this.#hooks.setNotifyGm(send ? 'always' : 'never');
    if (send) void this.send(q.token, q.lines, q.after);
  }

  /** Drops an unanswered question: the selection was cleared or the page left. */
  dismiss(): void {
    this.asking = null;
  }

  #drop(): void {
    this.#key = null;
    this.#id = null;
  }
}
