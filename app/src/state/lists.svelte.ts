/* Stored lists, held in memory and kept in step with `localStorage`.
 *
 * `lib/lists.ts` already carries the pure rules - `keepLists`, `liftNotes`,
 * `mergeLists` - and has had no caller since Phase 2. This is that caller: it
 * knows about storage and about the app's own `say`, which the pure module
 * deliberately does not.
 *
 * Off `loadLists`..`storageWorks` (app.js 1149-1204) and `createList`
 * (app.js 1320-1330). */

import {
  keepLists,
  liftNotes,
  mergeLists,
  moveEntry,
  type LegacyList,
  type StoredList
} from '../lib/lists.js';
import type { Dict } from '../lib/dict.js';
import type { ListEntryMeta, MoneyMode } from '../lib/listLink.js';
import { MONEY_DEFAULT } from '../lib/money.js';
import type { Env } from '../ports/index.js';

const LISTS_KEY = 'dhloot.lists.v2';
const LISTS_KEY_V1 = 'dhloot.lists.v1';

/** Four base-36 digits off `env.random`, the same shape `Math.random()
 *  .toString(36).slice(2, 6)` produces but not tied to the global. */
function random36(n: number, random: () => number): string {
  const v = Math.floor(random() * 36 ** n);
  return v.toString(36).padStart(n, '0');
}

export class ListStore {
  lists = $state<StoredList[]>([]);
  /** Whether the last `save()` actually wrote. The live `createList.saved` -
   *  a refused write has already toasted `saveFailed`, and a caller must not
   *  follow it with a cheerful "created". */
  saved = $state(true);

  readonly #env: Env;
  /** What the app's own `say` needs, without this module knowing `AppState`. */
  readonly #say: (msg: string, error?: boolean) => void;
  readonly #dict: () => Dict;

  /* Remembered for this tab's lifetime only, so a merge cannot resurrect a
   * list from another tab's copy after this tab deleted it. `remove` is its
   * writer. */
  readonly #deleted: Record<string, boolean> = {};

  constructor(env: Env, say: (msg: string, error?: boolean) => void, dict: () => Dict) {
    this.#env = env;
    this.#say = say;
    this.#dict = dict;
    this.lists = this.load();
  }

  /** Reads storage fresh. Used at construction and again on another tab's write. */
  load(): StoredList[] {
    const raw = this.#env.storage.get(LISTS_KEY);
    if (raw !== null) {
      try {
        return keepLists(JSON.parse(raw));
      } catch {
        return [];
      }
    }
    /* First run on the new shape: bring the old lists across and leave the
       old key untouched, so nothing is lost if this version is rolled back. */
    const old = this.#env.storage.get(LISTS_KEY_V1);
    if (old === null) return [];
    let moved: StoredList[];
    try {
      /* `keepLists` narrows to `StoredList`, which is the shape the v1 data
         happens to fit at runtime, but its type carries no index signature -
         `liftNotes` wants `LegacyList` for the fields `StoredList` no longer
         declares (`note`, `noteShow`). The cast is exactly that mismatch,
         not a real unknown. */
      moved = keepLists(JSON.parse(old)).map((l) => liftNotes(l as unknown as LegacyList));
    } catch {
      return [];
    }
    this.#env.storage.set(LISTS_KEY, JSON.stringify(moved));
    return moved;
  }

  /**
   * Writes this tab's lists, merged with whatever storage holds right now.
   *
   * Does not update `this.lists` - that stays this tab's own view, the way the
   * live app's `S.lists` does. Only the `storage` event (see `watch()`) or the
   * next `load()` folds another tab's lists in.
   */
  save(): boolean {
    let storedNow: StoredList[];
    try {
      storedNow = keepLists(JSON.parse(this.#env.storage.get(LISTS_KEY) ?? '[]'));
    } catch {
      storedNow = [];
    }
    const merged = mergeLists(this.lists, storedNow, this.#deleted);
    const ok = this.#env.storage.set(LISTS_KEY, JSON.stringify(merged));
    this.saved = ok;
    if (!ok) {
      this.#say(this.#dict().saveFailed, true);
      return false;
    }
    return true;
  }

  get(id: string): StoredList | undefined {
    return this.lists.find((l) => l.id === id);
  }

  /**
   * Puts the new list first, saves it, and hands it back for the caller to
   * add to. `init` spreads in before the one save - a restore hands it `ids`
   * and `meta` in the same write the live app makes as two (create, then fill
   * in), which is unobservable except by another tab's `storage` event
   * landing mid-restore.
   */
  create(
    name: string,
    init: Partial<Omit<StoredList, 'id' | 'name' | 'created'>> = {}
  ): StoredList {
    const trimmed = name.trim();
    const l: StoredList = {
      id: 'l' + Date.now().toString(36) + random36(4, this.#env.random),
      name: trimmed || this.#dict().untitled,
      ids: [],
      created: Date.now(),
      ...init
    };
    this.lists = [l, ...this.lists];
    this.save();
    return l;
  }

  /** Drops the list for good - the live `deleteList`. Remembered in
   *  `#deleted` so a later merge cannot bring it back from another tab's
   *  still-unmerged copy. */
  remove(id: string): void {
    this.#deleted[id] = true;
    this.lists = this.lists.filter((l) => l.id !== id);
    this.save();
  }

  /** Every id the data knows and the list does not already hold. Does not save. */
  addIds(list: StoredList, ids: readonly string[], knows: (id: string) => boolean): string[] {
    const fresh = ids.filter((id) => knows(id) && !list.ids.includes(id));
    if (fresh.length) {
      this.lists = this.lists.map((l) =>
        l.id === list.id ? { ...l, ids: [...l.ids, ...fresh] } : l
      );
    }
    return fresh;
  }

  /** Does not save - the caller decides when, the same as `addIds`. */
  removeId(list: StoredList, id: string): void {
    this.lists = this.lists.map((l) =>
      l.id === list.id ? { ...l, ids: l.ids.filter((x) => x !== id) } : l
    );
  }

  /** Another tab wrote the key: take theirs, the way the live app's `storage`
   *  listener does (`mergeLists(loadLists())` with an empty `theirs`). */
  watch(): () => void {
    return this.#env.storage.onExternalChange((key) => {
      if (key === LISTS_KEY) this.lists = this.load();
    });
  }

  /* ---------- the list page's own writers ---------- */

  /** The live `rename` handler (app.js 4431-4434) - whatever was typed, no
   *  trim: a list is allowed a name that is all spaces, the same as the live
   *  app allows. */
  rename(id: string, name: string): void {
    this.lists = this.lists.map((l) => (l.id === id ? { ...l, name } : l));
    this.save();
  }

  /** The live `setMeta` (app.js 1211-1219): truthy sets, falsy deletes, and an
   *  entry (or the whole `meta` object) emptied by that is pruned rather than
   *  left behind as `{}`. */
  setMeta(
    id: string,
    entryId: string,
    field: 'qty' | 'gold' | 'note' | 'hnote',
    value: string | number
  ): void {
    this.lists = this.lists.map((l) => {
      if (l.id !== id) return l;
      const meta: Record<string, ListEntryMeta> = { ...(l.meta ?? {}) };
      const m: ListEntryMeta = { ...meta[entryId] };
      if (value) m[field] = value as never;
      else Reflect.deleteProperty(m, field);
      if (Object.keys(m).length) meta[entryId] = m;
      else Reflect.deleteProperty(meta, entryId);
      const next: StoredList = { ...l };
      if (Object.keys(meta).length) next.meta = meta;
      else Reflect.deleteProperty(next, 'meta');
      return next;
    });
    this.save();
  }

  /** The live list-note writer (app.js 4421-4430): trimmed, and a blank value
   *  deletes the key rather than storing an empty string. */
  setNote(id: string, kind: 'note' | 'hnote', text: string): void {
    const v = text.trim();
    this.lists = this.lists.map((l) => {
      if (l.id !== id) return l;
      const next: StoredList = { ...l };
      if (v) next[kind] = v;
      else Reflect.deleteProperty(next, kind);
      return next;
    });
    this.save();
  }

  /** The live money-mode writer (app.js 4086-4094): the default mode is not
   *  stored at all. */
  setMoney(id: string, mode: MoneyMode): void {
    this.lists = this.lists.map((l) => {
      if (l.id !== id) return l;
      const next: StoredList = { ...l };
      if (mode === MONEY_DEFAULT) delete next.money;
      else next.money = mode;
      return next;
    });
    this.save();
  }

  /** Through `moveEntry`; returns whether anything actually moved, and saves
   *  only then - the live `moveToInList` (app.js 1223-1231). */
  move(id: string, entryId: string, to: number): boolean {
    const l = this.get(id);
    if (!l) return false;
    const from = l.ids.indexOf(entryId);
    if (from < 0) return false;
    const clamped = Math.max(0, Math.min(to, l.ids.length - 1));
    if (from === clamped) return false;
    const ids = moveEntry(l.ids, from, to);
    this.lists = this.lists.map((x) => (x.id === id ? { ...x, ids } : x));
    this.save();
    return true;
  }

  /** The undo of a removed row (app.js 3944-3969's `toastAction`): splice the
   *  entry back in at `min(at, length)`, and put its meta back only when it
   *  is non-empty. A second undo (the entry already back) is a no-op, as the
   *  live handler's own guard makes it. */
  restoreEntry(id: string, entryId: string, at: number, meta: ListEntryMeta): void {
    this.lists = this.lists.map((l) => {
      if (l.id !== id || l.ids.includes(entryId)) return l;
      const ids = [...l.ids];
      ids.splice(Math.min(at, ids.length), 0, entryId);
      const next: StoredList = { ...l, ids };
      if (Object.keys(meta).length) next.meta = { ...(l.meta ?? {}), [entryId]: meta };
      return next;
    });
    this.save();
  }

  /** The row's own remove cross: the existing `removeId` plus the save the
   *  live `toggleInList` performs inline. `remove(id)` already means deleting
   *  a whole list and keeps that meaning. */
  removeEntry(id: string, entryId: string): void {
    const l = this.get(id);
    if (!l) return;
    this.removeId(l, entryId);
    this.save();
  }
}
