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
/** Where a `dhloot.lists.v2` value that will not parse is copied before this
 *  tab's own next write would otherwise silently overwrite it - R1. */
const LISTS_KEY_BAD = 'dhloot.lists.v2.bad';

/** Four base-36 digits off `env.random`, the same shape `Math.random()
 *  .toString(36).slice(2, 6)` produces but not tied to the global. */
function random36(n: number, random: () => number): string {
  const v = Math.floor(random() * 36 ** n);
  return v.toString(36).padStart(n, '0');
}

export class ListStore {
  /* Raw, not deep: a proxy on every list made each save cost what 200 lists
     weigh (docs/DECISIONS.md, 2026-09-23, "The list store is raw state...").
     A writer must replace the array and the list it changes, never mutate. */
  lists = $state.raw<StoredList[]>([]);
  /** Whether the last `save()` actually wrote. The live `createList.saved` -
   *  a refused write has already toasted `saveFailed`, and a caller must not
   *  follow it with a cheerful "created". */
  saved = $state(true);
  /**
   * Whether `dhloot.lists.v2` held something that would not parse, the last
   * time it was read - R1. A bare `catch { return [] }` here used to be the
   * whole story: `load()` and `save()` each caught the same failure
   * independently, both treated storage as empty, and `save()` then wrote
   * this tab's own lists straight over whatever the corrupt value actually
   * was - the eleven-line-older migration comment above `load()` is careful
   * to leave a rollback's old key untouched "so nothing is lost", and the
   * very same file then lost data on the next line down. `#readCurrent`
   * below is now the one place either method reads the key, and it backs
   * the raw value up under `.bad` before either can overwrite it.
   */
  unreadable = $state(false);

  readonly #env: Env;
  /** What the app's own `say` needs, without this module knowing `AppState`. */
  readonly #say: (msg: string, error?: boolean) => void;
  readonly #dict: () => Dict;

  /* Remembered for this tab's lifetime only, so a merge cannot resurrect a
   * list from another tab's copy after this tab deleted it. `remove` is its
   * writer. */
  readonly #deleted: Record<string, boolean> = {};

  /* What `dhloot.lists.v2` held at this tab's last read or write, and its
     parse - an unchanged value is not parsed again. */
  #lastRaw: string | null = null;
  #lastParsed: StoredList[] = [];
  /* The stored string `lists` was last drawn from or saved as, less `#deleted`.
     After a refused write `lists` runs ahead of it until a save succeeds, so a
     signal that finds it in storage keeps this tab's unsaved edit on screen. */
  #shownRaw: string | null = null;

  constructor(env: Env, say: (msg: string, error?: boolean) => void, dict: () => Dict) {
    this.#env = env;
    this.#say = say;
    this.#dict = dict;
    this.#reload();
  }

  #reload(): void {
    this.lists = this.load();
    this.#shownRaw = this.#lastRaw;
  }

  /**
   * Parses `dhloot.lists.v2` as it stands right now - `null` when the key is
   * simply absent, `[]` (with `unreadable` set) when it holds something that
   * will not parse. The one place either `load()` or `save()` reads the key,
   * so the R1 backup below runs exactly once per bad read regardless of
   * which caller hit it, and `unreadable` clears itself the moment the key
   * is readable again - this tab's own next successful write included.
   *
   * `#deleted` is filtered here too (S5): a list this tab has already
   * deleted must not come back from a stored snapshot another tab wrote
   * before it heard about the deletion - the same rule `save()`'s own merge
   * already applies, now applied to a plain read as well, since `watch()`
   * calls this directly on another tab's write.
   */
  #readCurrent(): StoredList[] | null {
    const raw = this.#env.storage.get(LISTS_KEY);
    if (raw === null) {
      this.#lastRaw = null;
      return null;
    }
    if (raw === this.#lastRaw) {
      this.unreadable = false;
      return this.#lastParsed.filter((l) => !this.#deleted[l.id]);
    }
    try {
      const all = keepLists(JSON.parse(raw));
      this.#lastRaw = raw;
      this.#lastParsed = all;
      this.unreadable = false;
      return all.filter((l) => !this.#deleted[l.id]);
    } catch {
      this.#lastRaw = null;
      this.unreadable = true;
      /* Backed up once: a second bad read (this tab's own next save,
         another tab writing something else unreadable) must not overwrite
         the first thing that was actually lost. */
      if (this.#env.storage.get(LISTS_KEY_BAD) === null) {
        this.#env.storage.set(LISTS_KEY_BAD, raw);
      }
      return [];
    }
  }

  /** Reads storage fresh. Used at construction and again on another tab's write. */
  load(): StoredList[] {
    const current = this.#readCurrent();
    if (current !== null) return current;
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
    const json = JSON.stringify(moved);
    if (this.#env.storage.set(LISTS_KEY, json)) {
      this.#lastRaw = json;
      this.#lastParsed = moved;
    }
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
    const storedNow = this.#readCurrent() ?? [];
    const merged = mergeLists(this.lists, storedNow, this.#deleted);
    const json = JSON.stringify(merged);
    const ok = this.#env.storage.set(LISTS_KEY, json);
    this.saved = ok;
    if (!ok) {
      this.#say(this.#dict().saveFailed, true);
      return false;
    }
    this.#lastRaw = json;
    this.#lastParsed = merged;
    /* A merge that appended another tab's lists leaves `lists` short of
       storage, so the next signal must reload. */
    this.#shownRaw = merged.length === this.lists.length ? json : null;
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

  /**
   * Drops the list for good - the live `deleteList`. Remembered in
   * `#deleted` so a later merge cannot bring it back from another tab's
   * still-unmerged copy.
   *
   * Returns the removed list and its old index, so a caller can offer an
   * undo (P5, matching every other destructive action) through
   * `restoreList` below - `undefined` for an id already gone, the same
   * "already handled, nothing to undo" shape `restoreEntry` gives a second
   * undo of one row.
   */
  remove(id: string): { list: StoredList; index: number } | undefined {
    const list = this.lists.find((l) => l.id === id);
    if (!list) return undefined;
    const index = this.lists.indexOf(list);
    this.#deleted[id] = true;
    this.lists = this.lists.filter((l) => l.id !== id);
    this.save();
    return { list, index };
  }

  /** Undoes `remove()`: splices the list back at its old index and forgets
   *  it was ever deleted, so a later merge can see it again - the list-level
   *  counterpart of `restoreEntry` below, for one row. */
  restoreList(list: StoredList, index: number): void {
    Reflect.deleteProperty(this.#deleted, list.id);
    const next = [...this.lists];
    next.splice(Math.min(index, next.length), 0, list);
    this.lists = next;
    this.save();
  }

  /**
   * Every id the data knows and the list does not already hold. Does not save.
   *
   * `meta`, when given, copies the players'-visible facts along for each
   * fresh id - `qty` above 1, `gold` above 0, `note` when present - the live
   * `addIdsTo`'s own `setMeta` sequence (app.js 1924-1940), in that order.
   * `hnote` never travels: only the GM's own note stays behind. An id already
   * in the list keeps whatever meta it already had.
   */
  addIds(
    list: StoredList,
    ids: readonly string[],
    knows: (id: string) => boolean,
    meta?: Readonly<Record<string, ListEntryMeta>>
  ): string[] {
    const fresh = ids.filter((id) => knows(id) && !list.ids.includes(id));
    if (fresh.length) {
      this.lists = this.lists.map((l) => {
        if (l.id !== list.id) return l;
        const next: StoredList = { ...l, ids: [...l.ids, ...fresh] };
        if (meta) {
          const nextMeta: Record<string, ListEntryMeta> = { ...(l.meta ?? {}) };
          for (const id of fresh) {
            const m = meta[id];
            if (!m) continue;
            const entry: ListEntryMeta = {};
            if (typeof m.qty === 'number' && m.qty > 1) entry.qty = m.qty;
            if (typeof m.gold === 'number' && m.gold > 0) entry.gold = m.gold;
            if (m.note) entry.note = m.note;
            if (Object.keys(entry).length) nextMeta[id] = entry;
          }
          if (Object.keys(nextMeta).length) next.meta = nextMeta;
        }
        return next;
      });
    }
    return fresh;
  }

  /** Does not save - the caller decides when, the same as `addIds`. */
  removeId(list: StoredList, id: string): void {
    this.lists = this.lists.map((l) =>
      l.id === list.id ? { ...l, ids: l.ids.filter((x) => x !== id) } : l
    );
  }

  /** Another tab wrote the key, or this tab has reason to think it might
   *  have missed such a write (R2 - `null`, off a `storage` event with no
   *  key, becoming visible again, or a bfcache restore): take theirs, the
   *  way the live app's `storage` listener does (`mergeLists(loadLists())`
   *  with an empty `theirs`). */
  watch(): () => void {
    return this.#env.storage.onExternalChange((key) => {
      if (key !== LISTS_KEY && key !== null) return;
      const raw = this.#env.storage.get(LISTS_KEY);
      if (raw !== null && raw === this.#shownRaw) return;
      this.#reload();
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
