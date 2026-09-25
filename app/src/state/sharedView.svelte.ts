/* The list behind the open share link `#/s/<token>`: its read status, the
 * projection the link's audience sees, and whether the reader owns the
 * list. The poll and the shown-again signal re-read it through `refresh()`
 * (docs/specs/FEATURES.md, "Account lists"). */

import type { SharedRow } from '../lib/cloudLists.js';
import type { ShareRepository } from '../ports/index.js';

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

  readonly #repo: ShareRepository;
  /* The user the owner check last ran for; `undefined` until it ran. */
  #checkedFor: string | null | undefined = undefined;

  constructor(repo: ShareRepository) {
    this.#repo = repo;
  }

  /** Opens `token` for `userId`: `undefined` while the session is unknown (the owner
   *  check waits), null signed out. The same token with another user re-runs the owner
   *  check only. */
  async open(token: string, userId: string | null | undefined): Promise<void> {
    if (token !== this.token) {
      this.token = token;
      this.shared = null;
      this.mine = null;
      this.#checkedFor = undefined;
      this.status = 'loading';
      const read = await this.#repo.read(token);
      if (this.token !== token) return;
      if (!read.ok) this.status = 'error';
      else if (read.shared) {
        this.shared = read.shared;
        this.status = 'ready';
      } else this.status = 'gone';
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
   *  what is shown. */
  async refresh(): Promise<void> {
    const token = this.token;
    if (token === null || (this.status !== 'ready' && this.status !== 'gone')) return;
    const read = await this.#repo.read(token);
    if (this.token !== token || !read.ok) return;
    if (!read.shared) {
      this.shared = null;
      this.status = 'gone';
      return;
    }
    if (read.shared.updated_at !== this.shared?.updated_at) this.shared = read.shared;
    this.status = 'ready';
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
    this.token = null;
    this.status = 'idle';
    this.shared = null;
    this.mine = null;
    this.#checkedFor = undefined;
  }
}
