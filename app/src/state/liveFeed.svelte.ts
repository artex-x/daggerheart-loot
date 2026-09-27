/* One Realtime topic's feed: joins it, reports whether it is live, rejoins
 * with a backoff after a loss, and asks its owner to re-read on a join, on a
 * loss, and every 5 minutes while live. The transitions are
 * `lib/live.ts`'s `feedStep`; this class runs their effects. docs/DECISIONS.md,
 * 2026-09-25, "Realtime is the primary live path; the 45 s poll runs while it
 * is down", and 2026-09-26, "While Realtime is live, a safety re-read runs
 * every 5 minutes". */

import {
  backoffMs,
  feedStep,
  JOIN_MS,
  SAFETY_MS,
  type FeedEvent,
  type FeedState
} from '../lib/live.js';
import type { Random } from '../lib/roll.js';
import type { EventsPort } from '../ports/index.js';

export class LiveFeed {
  state = $state<FeedState>('off');
  /** The topic watched, or null while `off`. */
  topic: string | null = null;

  readonly #events: EventsPort;
  readonly #random: Random;
  readonly #on: { message(event: string, payload: unknown): void; refetch(): void };
  #leave: (() => void) | null = null;
  #join: ReturnType<typeof setTimeout> | null = null;
  #retry: ReturnType<typeof setTimeout> | null = null;
  #safety: ReturnType<typeof setInterval> | null = null;
  #attempt = 0;

  constructor(
    events: EventsPort,
    random: Random,
    on: { message(event: string, payload: unknown): void; refetch(): void }
  ) {
    this.#events = events;
    this.#random = random;
    this.#on = on;
  }

  /** Watches `topic`; the same topic again does nothing, another one leaves the first. */
  watch(topic: string): void {
    if (this.state !== 'off' && topic === this.topic) return;
    this.stop();
    this.topic = topic;
    this.#apply('watch');
  }

  /** Leaves the topic and clears every timer. */
  stop(): void {
    this.#apply('stop');
    this.topic = null;
  }

  #apply(event: FeedEvent): void {
    const step = feedStep(this.state, event);
    if (!step) return;
    const was = this.state;
    this.state = step.to;
    if (step.unsubscribe) {
      this.#leave?.();
      this.#leave = null;
    }
    if (step.joinTimer !== null) this.#clear('join');
    if (step.joinTimer === 'start') {
      this.#join = setTimeout(() => {
        this.#join = null;
        this.#apply('timeout');
      }, JOIN_MS);
    }
    if (step.retry !== null) this.#clear('retry');
    if (step.retry === 'schedule') {
      this.#retry = setTimeout(
        () => {
          this.#retry = null;
          this.#apply('retry');
        },
        backoffMs(this.#attempt++, this.#random)
      );
    }
    if (step.resetBackoff) this.#attempt = 0;
    if (was === 'live' && step.to !== 'live' && this.#safety !== null) {
      clearInterval(this.#safety);
      this.#safety = null;
    }
    if (step.to === 'live' && was !== 'live') {
      this.#safety = setInterval(() => {
        this.#on.refetch();
      }, SAFETY_MS);
    }
    if (step.subscribe && this.topic !== null) this.#subscribe(this.topic);
    if (step.refetch) this.#on.refetch();
  }

  #subscribe(topic: string): void {
    let mine = true;
    const leave = this.#events.subscribe(topic, {
      message: (event, payload) => {
        if (mine && this.state === 'live') this.#on.message(event, payload);
      },
      status: (s) => {
        if (mine) this.#apply(s === 'live' ? 'joined' : 'lost');
      }
    });
    this.#leave = () => {
      mine = false;
      leave();
    };
  }

  #clear(which: 'join' | 'retry'): void {
    const timer = which === 'join' ? this.#join : this.#retry;
    if (timer !== null) clearTimeout(timer);
    if (which === 'join') this.#join = null;
    else this.#retry = null;
  }
}
