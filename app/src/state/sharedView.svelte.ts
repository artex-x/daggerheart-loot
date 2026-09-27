/* The list behind the open share link `#/s/<token>`: its read status, the
 * projection the link's audience sees, and whether the reader owns the
 * list. While the page is drawn it watches the share's Realtime topic and
 * re-reads on a message; the poll and the shown-again signal re-read it
 * through `refresh()`, a failed first read included (docs/specs/FEATURES.md,
 * "Account and browser lists"). */

import { sameProjection, type SharedRow } from '../lib/cloudLists.js';
import { COALESCE_MS, readShareMessage } from '../lib/live.js';
import type { Random } from '../lib/roll.js';
import type { EventsPort, ShareRepository } from '../ports/index.js';
import { LiveFeed } from './liveFeed.svelte.js';

export class SharedView {
  /** The open link's token, or null when no share page is open. */
  token = $state<string | null>(null);
  /** `gone` is a link that opens nothing; `error` a read that failed. */
  status = $state<'idle' | 'loading' | 'ready' | 'gone' | 'error'>('idle');
  /* Raw: a re-read replaces the object, never mutates it, so an unchanged
     read redraws nothing. */
  shared = $state.raw<SharedRow | null>(null);
  /** The reader's own list id behind the link, or null. */
  mine = $state<string | null>(null);
  /** Bumped once per re-read that changed what the page draws. */
  changes = $state(0);

  readonly #repo: ShareRepository;
  readonly #feed: LiveFeed | null;
  /* The user the owner check last ran for; `undefined` until it ran. */
  #checkedFor: string | null | undefined = undefined;
  #coalesce: ReturnType<typeof setTimeout> | null = null;

  constructor(repo: ShareRepository, live?: { events: EventsPort; random: Random }) {
    this.#repo = repo;
    this.#feed = live
      ? new LiveFeed(live.events, live.random, {
          message: (event, payload) => {
            this.#message(event, payload);
          },
          refetch: () => {
            void this.refresh();
          }
        })
      : null;
  }

  /** Whether the share's Realtime topic is joined. */
  get live(): boolean {
    return this.#feed?.state === 'live';
  }

  /** Opens `token` for `userId`: `undefined` while the session is unknown (the owner
   *  check waits), null signed out. The same token with another user re-runs the owner
   *  check only. */
  async open(token: string, userId: string | null | undefined): Promise<void> {
    if (token !== this.token) {
      this.#stopFeed();
      this.token = token;
      this.shared = null;
      this.mine = null;
      this.changes = 0;
      this.#checkedFor = undefined;
      this.status = 'loading';
      const read = await this.#repo.read(token);
      if (this.token !== token) return;
      if (!read.ok) this.status = 'error';
      else if (read.shared) this.#ready(read.shared);
      else this.status = 'gone';
    }
    await this.#checkOwner(token, userId);
  }

  async #checkOwner(token: string, userId: string | null | undefined): Promise<void> {
    if (userId === undefined || userId === this.#checkedFor) return;
    this.#checkedFor = userId;
    if (userId === null) {
      this.mine = null;
      return;
    }
    const mine = await this.#repo.ownerOf(token);
    if (this.token === token && this.#checkedFor === userId) this.mine = mine;
  }

  /** Re-reads the open link; an unchanged list keeps its object, a failed read keeps
   *  what is shown. After a failed first read it reads with no `loading`: the error stays
   *  drawn until a read answers, and the owner check runs again, as `retry()` does. */
  async refresh(): Promise<void> {
    const token = this.token;
    if (token === null || this.status === 'idle' || this.status === 'loading') return;
    const failed = this.status === 'error';
    const read = await this.#repo.read(token);
    if (this.token !== token || !read.ok) return;
    if (!read.shared) {
      this.shared = null;
      this.status = 'gone';
      this.#stopFeed();
      return;
    }
    const old = this.shared;
    let next = read.shared;
    if (old) {
      if (next.updated_at === old.updated_at) next = old;
      else if (!sameProjection(old, next)) this.changes++;
    }
    this.#ready(next);
    if (failed) {
      /* The check that ran beside the failed read got no answer either. */
      const checked = this.#checkedFor;
      this.#checkedFor = undefined;
      await this.#checkOwner(token, checked);
    }
  }

  /** Reads the link again after a failed read. */
  async retry(): Promise<void> {
    const token = this.token;
    if (token === null || this.status !== 'error') return;
    const checked = this.#checkedFor;
    this.token = null;
    await this.open(token, checked);
  }

  /** Forgets the link. */
  close(): void {
    this.#stopFeed();
    this.token = null;
    this.status = 'idle';
    this.shared = null;
    this.mine = null;
    this.changes = 0;
    this.#checkedFor = undefined;
  }

  /* A read that draws the list: the page watches its share's topic. */
  #ready(shared: SharedRow): void {
    this.shared = shared;
    this.status = 'ready';
    this.#feed?.watch('share:' + shared.topic_key);
  }

  #message(event: string, payload: unknown): void {
    const m = readShareMessage(event, payload);
    if (!m) return;
    if (m.revision === null) {
      void this.refresh();
      return;
    }
    if (this.shared && m.revision <= this.shared.revision) return;
    this.#coalesce ??= setTimeout(() => {
      this.#coalesce = null;
      void this.refresh();
    }, COALESCE_MS);
  }

  #stopFeed(): void {
    this.#feed?.stop();
    if (this.#coalesce !== null) clearTimeout(this.#coalesce);
    this.#coalesce = null;
  }
}
