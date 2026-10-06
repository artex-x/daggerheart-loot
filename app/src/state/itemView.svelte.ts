/* The homebrew item behind the open `#/h/<uuid>`: its read status, the record, the author's
 * related items, whether the reader is the author, and an index the page draws the card
 * over. No feed and no timer of its own: `AppState` re-reads it on the shown-again signal
 * (docs/specs/FEATURES.md, "Records"). On a key the reader also holds, the answer's records
 * win: the page draws the author's relations (docs/specs/FEATURES.md, "Homebrew"). */

import { itemOf } from '../lib/cloudLists.js';
import type { Index } from '../lib/data.js';
import { withRecords, type HomebrewRecord } from '../lib/homebrew.js';
import type { ListRepository } from '../ports/index.js';

export class ItemView {
  /** The open item's id, or null when no item page is open. */
  id = $state<string | null>(null);
  /** `gone` is an id no item has; `error` a read that failed. */
  status = $state<'idle' | 'loading' | 'ready' | 'gone' | 'error'>('idle');
  /* Raw: a re-read replaces the objects, never mutates them, so an unchanged read redraws
     nothing. */
  record = $state.raw<HomebrewRecord | null>(null);
  related = $state.raw<HomebrewRecord[]>([]);
  /** Whether the reader is the item's author. */
  mine = $state(false);
  /** The answer's revision: a re-read with an equal one keeps the objects. */
  revision = $state<string | null>(null);

  /** The catalog with the item and its related items, which win a key over the catalog. */
  index: Index | null = $derived.by(() => {
    const base = this.#base();
    const r = this.record;
    return base && r ? withRecords(base, [r, ...this.related], []) : null;
  });

  readonly #repo: ListRepository;
  readonly #base: () => Index | null;
  /* The user the last read ran for; `undefined` before one. */
  #userId: string | null | undefined = undefined;

  constructor(repo: ListRepository, base: () => Index | null) {
    this.#repo = repo;
    this.#base = base;
  }

  /** The item's id, as the answer names it. */
  get hid(): string | null {
    return this.record?.hid ?? null;
  }

  /** Opens `id` for `userId`: a new id reads with `loading`; the same id with another user
   *  (a sign-in or a sign-out changes `mine`) re-reads. */
  async open(id: string, userId: string | null): Promise<void> {
    if (id !== this.id) {
      this.id = id;
      this.#userId = userId;
      this.record = null;
      this.related = [];
      this.mine = false;
      this.revision = null;
      await this.#read(id);
      return;
    }
    if (userId === this.#userId) return;
    this.#userId = userId;
    await this.refresh();
  }

  /** Reads the open item again: a failed read keeps what is shown, an item gone sets
   *  `gone`, an equal revision keeps the objects and updates `mine` only. Nothing while no
   *  read has answered yet. */
  async refresh(): Promise<void> {
    const id = this.id;
    if (id === null || this.status === 'idle' || this.status === 'loading') return;
    const r = await this.#repo.item(id);
    if (this.id !== id || !r.ok) return;
    this.#take(r.item);
  }

  /** Reads the item again after a failed read. */
  async retry(): Promise<void> {
    const id = this.id;
    if (id === null || this.status !== 'error') return;
    await this.#read(id);
  }

  /** Forgets the item. */
  close(): void {
    this.id = null;
    this.status = 'idle';
    this.record = null;
    this.related = [];
    this.mine = false;
    this.revision = null;
    this.#userId = undefined;
  }

  async #read(id: string): Promise<void> {
    this.status = 'loading';
    const user = this.#userId;
    const r = await this.#repo.item(id);
    if (this.id !== id) return;
    if (!r.ok) {
      this.status = 'error';
      return;
    }
    this.#take(r.item);
    /* A user change during the read found `loading` and skipped its re-read: `mine` is stale. */
    if (this.#userId !== user) await this.refresh();
  }

  #take(answer: unknown): void {
    const read = itemOf(answer);
    if (!read) {
      this.record = null;
      this.related = [];
      this.revision = null;
      this.mine = false;
      this.status = 'gone';
      return;
    }
    this.mine = read.mine;
    if (read.revision !== this.revision || !this.record) {
      this.record = read.record;
      this.related = read.related;
      this.revision = read.revision;
    }
    this.status = 'ready';
  }
}
