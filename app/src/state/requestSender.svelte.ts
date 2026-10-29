/* The reader's side of a purchase request on a share page `#/s/<token>`: the
 * send from the selection bar, flow b - after an add from the bar, the
 * question whether to tell the list's owner, or the remembered answer - and the
 * owner's decision, heard while this page stays open.
 *
 * Nothing of a request is stored in the browser. The request id lives here, in
 * memory: before a success, so that a second press after a `network` answer is a
 * replay the database inserts nothing for; after it, the newest 20 ids this page
 * load sent, so the share topic's decision message toasts in this tab only
 * (docs/specs/FEATURES.md, "Purchase requests: the send";
 * docs/decisions/2026-10-29-a-sender-hears-a-decision-while-the-page-stays-open.md).
 * A success keeps the selection and marks its lines sent: the same lines are not
 * sent again until the ticks or counts change (docs/DECISIONS.md, 2026-09-29, "A
 * sent purchase request keeps the ticks; the send waits until they change"). */

import { limitText } from '../lib/cloudLists.js';
import type { Msg } from '../lib/dict.js';
import { countPiecesText } from '../lib/i18n.js';
import { plural } from '../lib/plural.js';
import type { NotifyGm } from '../lib/prefs.js';
import type { RequestRepository } from '../ports/index.js';

/** The ticked entries with their taken counts. */
export type RequestLines = { item: string; qty: number }[];

export interface SenderHooks {
  newId: () => string;
  say: (msg: Msg, error?: boolean) => void;
  /** Reads the open link again: its list changed, or it is gone. */
  reread: () => void;
  notifyGm: () => NotifyGm;
  setNotifyGm: (v: NotifyGm) => void;
}

/* The link and its lines in one order-free text: the replay id and the sent mark key on it. */
function keyOf(token: string, lines: RequestLines): string {
  return [token, ...lines.map((l) => `${l.item}*${String(l.qty)}`).sort()].join(' ');
}

/* The sent ids a page load keeps for a decision: one per send, the oldest dropped. */
const MINE_MAX = 20;

/** The owner's decision of a request, as the share topic says it. */
export interface Decision {
  id: string;
  status: 'applied' | 'declined';
  partial: boolean;
}

/** Returns what a request held: «2 позиции» and, when the pieces differ, « · 4 шт.». */
export function sentSummary(lines: RequestLines): Msg {
  const pieces = lines.reduce((n, l) => n + l.qty, 0);
  return (t, lang) => countPiecesText(lines.length, pieces, t.itemsN, lang, t);
}

export class RequestSender {
  /** A send runs. */
  sending = $state(false);
  /** Flow b's open question: the link, the lines the add carried and the add's toast. */
  asking = $state.raw<{ token: string; lines: RequestLines; after: Msg } | null>(null);

  readonly #repo: RequestRepository;
  readonly #hooks: SenderHooks;
  /* The selection the kept id was made for, and the id. */
  #key: string | null = null;
  #id: string | null = null;
  /* The key of the lines last sent through a link; reactive, so the button redraws. */
  #sent = $state<string | null>(null);
  /* The ids sent with success on this page load, newest last, with the key of their lines. */
  #mine: { id: string; key: string }[] = [];
  /* The decision of the request the sent mark holds; reactive, so the line redraws. */
  #verdict = $state.raw<{ key: string; status: Decision['status']; partial: boolean } | null>(
    null
  );

  constructor(repo: RequestRepository, hooks: SenderHooks) {
    this.#repo = repo;
    this.#hooks = hooks;
  }

  /** Whether these lines were the last ones sent through this link. */
  isSent(token: string, lines: RequestLines): boolean {
    return this.#sent !== null && this.#sent === keyOf(token, lines);
  }

  /** Sends the lines to the link's owner. A success keeps the selection and marks the
   *  lines sent; with `after` (flow b) the add's toast gains the owner's line. */
  async send(token: string, lines: RequestLines, after?: Msg): Promise<void> {
    if (this.sending || !lines.length || this.isSent(token, lines)) return;
    const key = keyOf(token, lines);
    if (key !== this.#key || this.#id === null) {
      this.#key = key;
      this.#id = this.#hooks.newId();
    }
    const id = this.#id;
    this.sending = true;
    const r = await this.#repo.send(id, token, lines);
    this.sending = false;
    const say = this.#hooks.say;
    if (r.ok) {
      this.#mine = [...this.#mine, { id, key }].slice(-MINE_MAX);
      this.#drop();
      this.#sent = key;
      this.#verdict = null;
      say(
        after === undefined
          ? (t) => t.requestSent
          : (t, lang) => `${after(t, lang)}. ${t.requestSentOwner}`
      );
      return;
    }
    /* The same id again: the database inserts nothing for a replay. */
    if (r.error === 'network') {
      say((t) => t.requestNetwork, true);
      return;
    }
    this.#drop();
    switch (r.error) {
      case 'limit':
        if (r.key === 'request_rate') say((t) => t.requestRate, true);
        else if (r.key === 'pending_requests_per_list' && r.value !== null) {
          const value = r.value;
          say(
            (t, lang) => t.requestPending.replace('%s', plural(value, t.requestsN, lang)),
            true
          );
        } else if (r.key === 'request_lines' && r.value !== null) {
          /* The reader cannot read the owner's limit, so the refusal names it, never
             the owner's «напишите на почту». */
          const value = r.value;
          const sent = String(lines.length);
          say((t, lang) => plural(value, t.requestLinesMax, lang).replace('%k', sent), true);
        } else {
          const { key, value } = r;
          say((t) => limitText(key, value, t), true);
        }
        return;
      case 'stale':
        say((t) => t.requestStale, true);
        this.#hooks.reread();
        return;
      case 'gone':
        /* The page itself turns into «Список больше не доступен». */
        this.#hooks.reread();
        return;
      case 'refused':
        say((t) => t.requestRefused, true);
        return;
    }
  }

  /** Flow b after an add from the bar: nothing, a send, or the question, by `notifyGm`. */
  afterAdd(token: string, lines: RequestLines, after: Msg): void {
    if (this.isSent(token, lines)) return;
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

  /** Drops an unanswered question and the sent mark: the selection was cleared or the page left. */
  dismiss(): void {
    this.asking = null;
    this.#sent = null;
    this.#verdict = null;
  }

  /** The owner applied or declined a request: a toast when this page load sent it, once;
   *  the line under the bar's actions takes the decision while the sent mark holds it. */
  decided(m: Decision): void {
    const mine = this.#mine.find((x) => x.id === m.id);
    if (!mine) return;
    this.#mine = this.#mine.filter((x) => x !== mine);
    this.#hooks.say((t) =>
      m.status === 'declined'
        ? t.requestDeclinedToast
        : m.partial
          ? t.requestPartialToast
          : t.requestAppliedToast
    );
    if (mine.key === this.#sent) {
      this.#verdict = { key: mine.key, status: m.status, partial: m.partial };
    }
  }

  /** The line under the bar's actions for these lines: the decision while the sent mark
   *  holds the decided request, else what was sent and how long it waits, else null. */
  lineFor(token: string, lines: RequestLines): Msg | null {
    if (!this.isSent(token, lines)) return null;
    const v = this.#verdict;
    if (v && v.key === this.#sent) {
      if (v.status === 'declined') return (t) => t.requestDeclinedSentLine;
      return v.partial ? (t) => t.requestPartialSentLine : (t) => t.requestAppliedSentLine;
    }
    const what = sentSummary(lines);
    return (t, lang) => t.requestSentLine.replace('%s', what(t, lang));
  }

  #drop(): void {
    this.#key = null;
    this.#id = null;
  }
}
