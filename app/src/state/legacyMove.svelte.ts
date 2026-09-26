/* The move of this browser's lists into the account, on the reader's behalf
 * (docs/specs/FEATURES.md, "Account and browser lists").
 *
 * A signed-in page with browser lists sends each one as its canonical text to
 * `ListRepository.move`, reads the account back, and removes from the browser
 * only a list whose account copy matches the text sent and whose stored text
 * did not change meanwhile. Only the first account that signs in on the
 * browser moves anything. Every step is safe to repeat: the RPC answers the
 * first row for a text it already moved. docs/DECISIONS.md, 2026-09-26: "A
 * browser list moves into the account through one RPC", "Browser lists are
 * read-only while the move is due". */

import { toCloudList } from '../lib/cloudLists.js';
import { canonicalList } from '../lib/legacy.js';
import type { StoredList } from '../lib/lists.js';
import type { CloudPort } from '../ports/index.js';
import type { CloudLists } from './cloudLists.svelte.js';
import type { ListStore, MovedList, MovePair } from './lists.svelte.js';

/** What the move reads of the app: `AppState` in the app, a stand-in in a test. */
export interface MoveApp {
  readonly env: { readonly cloud: CloudPort | null };
  readonly lists: ListStore;
  readonly cloudLists: CloudLists | null;
  readonly index: unknown;
  readonly cloning: boolean;
  readonly storageWorks: boolean;
  followMoved(removed: readonly MovedList[]): void;
}

interface Sent extends MovePair {
  inserted: boolean;
}

export class LegacyMove {
  /** `done`: this run ended and nothing more happens without a new signal. `failed`: the
   *  run stopped on the network, a read-back that did not answer or a user switch. */
  status = $state<'idle' | 'moving' | 'done' | 'failed'>('idle');
  /** Lists this page moved and removed. */
  moved = $state(0);
  /** Lists a network drop left for the next run. */
  left = $state(0);
  /** The lists the server refused on this page: skipped until a reload. */
  refused = $state.raw<{ id: string; name: string }[]>([]);
  /** The browser's lists belong to another account's move: nothing moves. */
  foreign = $state(false);
  /** A run was asked for and skipped; the next signal runs it. */
  due = $state(false);

  readonly #app: MoveApp;
  readonly #user: () => string | null;
  /* Bumped by every run and by `reset()`: a run that ended after another
     began, or after a user switch, leaves the status alone. */
  #runs = 0;

  constructor(app: MoveApp, user: () => string | null) {
    this.#app = app;
    this.#user = user;
  }

  /** Forgets this page's runs, for a new user: the move is due again until it runs. */
  reset(): void {
    this.#runs++;
    this.status = 'idle';
    this.moved = 0;
    this.left = 0;
    this.refused = [];
    this.foreign = false;
    this.due = false;
  }

  /** Runs the move when it is due for `userId`; resolves once the run settled. */
  async runIfDue(userId: string): Promise<void> {
    if (this.status === 'moving') return;
    const app = this.#app;
    const store = app.lists;
    const cloud = app.cloudLists;
    const repo = app.env.cloud?.lists;
    if (!cloud || !repo) return;
    /* The order matters: a skipped run must not stay `idle` where the
       harness waits and an offline reader sees nothing. */
    const current = app.storageWorks ? store.current() : [];
    const m = store.migrated;
    this.foreign = app.storageWorks && m.owner !== undefined && m.owner !== userId;
    const skip = [...(m.held ?? []), ...this.refused.map((r) => r.id)];
    const todo = current.filter((l) => !skip.includes(l.id));
    const bad = app.storageWorks && store.hasBadBackup && m.bad === undefined;
    if (!app.storageWorks || this.foreign || (!todo.length && !bad)) {
      this.status = 'done';
      this.due = false;
      return;
    }
    if (cloud.status === 'error') {
      this.status = 'failed';
      this.due = true;
      return;
    }
    if (app.cloning || cloud.status !== 'ready' || app.index === null) {
      this.due = true;
      return;
    }
    this.status = 'moving';
    this.due = false;
    this.left = 0;
    store.claim(userId);
    if (bad) store.markBad(userId);
    const run = ++this.#runs;
    /* A throw must not leave `moving` for the life of the page: that keeps the
       lists read-only and the waiting action waiting. */
    let ended: 'done' | 'failed' = 'failed';
    try {
      ended = await this.#run(userId, todo);
    } finally {
      if (run === this.#runs) this.status = ended;
    }
  }

  async #run(userId: string, todo: readonly StoredList[]): Promise<'done' | 'failed'> {
    const app = this.#app;
    const store = app.lists;
    const cloud = app.cloudLists;
    const repo = app.env.cloud?.lists;
    if (!cloud || !repo) return 'failed';
    const same = (): boolean => this.#user() === userId;
    if (!todo.length) return 'done';
    /* The account holds every buffered edit before the first move. */
    if (!(await cloud.flushNow())) return 'failed';
    const sent: Sent[] = [];
    let ok = true;
    for (const [i, l] of todo.entries()) {
      if (!same()) return 'failed';
      const canonical = canonicalList(l);
      const r = await repo.move(repo.newId(), canonical);
      if (r.ok) {
        sent.push({
          localId: l.id,
          accountId: r.id,
          canonical,
          name: l.name,
          inserted: r.inserted
        });
      } else if (r.error === 'refused') {
        this.refused = [...this.refused, { id: l.id, name: l.name }];
      } else {
        this.left = todo.length - i;
        ok = false;
        break;
      }
    }
    if (sent.length) {
      const read = await repo.list();
      if (!read.ok) return 'failed';
      if (!same()) return 'failed';
      const verified: MovePair[] = [];
      const held: string[] = [];
      for (const s of sent) {
        const row = read.lists.find((x) => x.id === s.accountId);
        /* Deleted on another device meanwhile: the next run moves it again. */
        if (!row) ok = false;
        else if (s.inserted && canonicalList(toCloudList(row)) !== s.canonical)
          held.push(s.localId);
        else verified.push(s);
      }
      if (held.length) {
        if (!same()) return 'failed';
        store.markHeld(userId, held);
      }
      if (!same()) return 'failed';
      const settled = store.settleMove(userId, verified);
      if (!settled) return 'failed';
      app.followMoved(settled.removed);
      this.moved += settled.removed.length;
    }
    await cloud.flushNow();
    await cloud.refresh();
    return ok ? 'done' : 'failed';
  }
}
