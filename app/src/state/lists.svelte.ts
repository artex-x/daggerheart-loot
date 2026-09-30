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
  freshIds,
  keepLists,
  liftNotes,
  mergeLists,
  movedIds,
  withEntryAt,
  withIds,
  withMeta,
  withMoney,
  withNote,
  type LegacyList,
  type StoredList
} from '../lib/lists.js';
import type { Dict, Msg } from '../lib/dict.js';
import { isHomebrewKey } from '../lib/homebrew.js';
import { canonicalList } from '../lib/legacy.js';
import type { ListEntryMeta, MoneyMode } from '../lib/listLink.js';
import type { Env } from '../ports/index.js';

const LISTS_KEY = 'dhloot.lists.v2';
const LISTS_KEY_V1 = 'dhloot.lists.v1';
/** Where a `dhloot.lists.v2` value that will not parse is copied before this
 *  tab's own next write would otherwise silently overwrite it - R1. */
const LISTS_KEY_BAD = 'dhloot.lists.v2.bad';
/** The move into the account: who owns this browser's lists, the moved ones,
 *  and what the one-time notice still says (docs/specs/STATE.md). */
const MIGRATED_KEY = 'dhloot.migrated.v1';

/**
 * `dhloot.migrated.v1`: `owner` the first account whose app loaded with browser
 * lists, `lists` the tombstones (local id to account id), `notice` the names the
 * one-time notice still shows, `bad` the damaged-backup sentence (true to show,
 * false dismissed), `held` the local ids whose account copy did not match.
 */
export interface Migrated {
  owner?: string;
  lists: Record<string, string>;
  notice?: string[];
  bad?: boolean;
  held?: string[];
}

/** One list the move verified: the text sent and the account row it made or found. */
export interface MovePair {
  localId: string;
  accountId: string;
  canonical: string;
  name: string;
}

/** A browser list that left this browser for the account list `accountId`. */
export interface MovedList {
  list: StoredList;
  accountId: string;
}

const strings = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined;

function parsed(raw: string | null): unknown {
  try {
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

/* A value that does not parse reads as absent, field by field. */
function readMigrated(raw: string | null): Migrated {
  const v = parsed(raw);
  const o =
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const lists: Record<string, string> = {};
  const rawLists = o['lists'];
  if (rawLists && typeof rawLists === 'object' && !Array.isArray(rawLists)) {
    for (const [k, id] of Object.entries(rawLists)) if (typeof id === 'string') lists[k] = id;
  }
  const m: Migrated = { lists };
  if (typeof o['owner'] === 'string') m.owner = o['owner'];
  const notice = strings(o['notice']);
  if (notice?.length) m.notice = notice;
  if (typeof o['bad'] === 'boolean') m.bad = o['bad'];
  const held = strings(o['held']);
  if (held?.length) m.held = held;
  return m;
}

/* One key order, so two tabs write the same text for the same state. */
function writeMigrated(m: Migrated): string {
  return JSON.stringify({
    owner: m.owner,
    lists: m.lists,
    notice: m.notice?.length ? m.notice : undefined,
    bad: m.bad,
    held: m.held?.length ? m.held : undefined
  });
}

const union = (a: readonly string[] | undefined, b: readonly string[]): string[] => [
  ...new Set([...(a ?? []), ...b])
];

/** Four base-36 digits off `env.random`, the same shape `Math.random()
 *  .toString(36).slice(2, 6)` produces but not tied to the global. */
function random36(n: number, random: () => number): string {
  const v = Math.floor(random() * 36 ** n);
  return v.toString(36).padStart(n, '0');
}

/**
 * What the list page and the add-to-list menu ask of a store, local or
 * account (`CloudLists`). Deleting a list stays out: a local delete has an
 * undo, an account delete a confirm and none.
 */
export interface ListModel {
  get(id: string): StoredList | undefined;
  rename(id: string, name: string): void;
  setMeta(
    id: string,
    entryId: string,
    field: 'qty' | 'gold' | 'note' | 'hnote',
    value: string | number
  ): void;
  setNote(id: string, kind: 'note' | 'hnote', text: string): void;
  setMoney(id: string, mode: MoneyMode): void;
  move(id: string, entryId: string, to: number): boolean;
  restoreEntry(id: string, entryId: string, at: number, meta: ListEntryMeta): void;
  removeEntry(id: string, entryId: string): void;
  /** Adds what the list lacks and saves; returns the ids added. */
  add(
    id: string,
    ids: readonly string[],
    knows: (id: string) => boolean,
    meta?: Readonly<Record<string, ListEntryMeta>>
  ): string[];
  /** Whether the last write was taken. */
  readonly saved: boolean;
}

export class ListStore implements ListModel {
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
  /** `dhloot.migrated.v1` as last read: read fresh on every read of the lists, so a
   *  tab hides a list another tab moved on the next signal. */
  migrated = $state.raw<Migrated>({ lists: {} });

  readonly #env: Env;
  /* The raw `dhloot.migrated.v1` `migrated` was parsed from; undefined before
     the first read. */
  #migratedRaw: string | null | undefined = undefined;
  /** What the app's own `say` needs, without this module knowing `AppState`. */
  readonly #say: (msg: Msg, error?: boolean) => void;
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

  constructor(env: Env, say: (msg: Msg, error?: boolean) => void, dict: () => Dict) {
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
    /* Read with no lists key too: the notice and the owner check read it. */
    const moved = this.#readMigrated().lists;
    const raw = this.#env.storage.get(LISTS_KEY);
    if (raw === null) {
      this.#lastRaw = null;
      return null;
    }
    /* A moved list is hidden like a deleted one: a copy another tab still
       held, or a storage rollback, never draws it again. */
    const kept = (l: StoredList): boolean =>
      !this.#deleted[l.id] && !Object.hasOwn(moved, l.id);
    if (raw === this.#lastRaw) {
      this.unreadable = false;
      return this.#lastParsed.filter(kept);
    }
    try {
      const all = keepLists(JSON.parse(raw));
      this.#lastRaw = raw;
      this.#lastParsed = all;
      this.unreadable = false;
      return all.filter(kept);
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
      this.#say((t) => t.saveFailed, true);
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
      created: Date.now(),
      ...init,
      ids: (init.ids ?? []).filter((k) => !isHomebrewKey(k))
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
    /* A homebrew key never goes into a browser list: it lives in one account. */
    const fresh = freshIds(list, ids, (k) => !isHomebrewKey(k) && knows(k));
    if (fresh.length) {
      this.lists = this.lists.map((l) => (l.id === list.id ? withIds(l, fresh, meta) : l));
    }
    return fresh;
  }

  /** `addIds` and the save, by the list's id; nothing for an id no list has. */
  add(
    id: string,
    ids: readonly string[],
    knows: (id: string) => boolean,
    meta?: Readonly<Record<string, ListEntryMeta>>
  ): string[] {
    const l = this.get(id);
    if (!l) return [];
    const fresh = this.addIds(l, ids, knows, meta);
    this.save();
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
  watch(onMoved?: (moved: MovedList[]) => void): () => void {
    return this.#env.storage.onExternalChange((key) => {
      if (key !== LISTS_KEY && key !== MIGRATED_KEY && key !== null) return;
      const raw = this.#env.storage.get(LISTS_KEY);
      /* The early return is for the lists key alone: a new tombstone hides a
         list whose stored text did not change. */
      const sameMoved = this.#env.storage.get(MIGRATED_KEY) === this.#migratedRaw;
      if (key !== MIGRATED_KEY && sameMoved && raw !== null && raw === this.#shownRaw) return;
      const before = this.lists;
      this.#reload();
      const moved = this.migrated.lists;
      const left = before.flatMap((list): MovedList[] => {
        const accountId = moved[list.id];
        return accountId !== undefined && !this.get(list.id) ? [{ list, accountId }] : [];
      });
      if (left.length) onMoved?.(left);
    });
  }

  /* ---------- the move into the account ---------- */

  /** Parses `dhloot.migrated.v1` again only when its raw value changed. */
  #readMigrated(): Migrated {
    const raw = this.#env.storage.get(MIGRATED_KEY);
    if (raw !== this.#migratedRaw) {
      this.#migratedRaw = raw;
      this.migrated = readMigrated(raw);
    }
    return this.migrated;
  }

  /* Every writer merges into a fresh read, so two tabs never write over each
     other's tombstones, names or dismissal. */
  #changeMigrated(change: (m: Migrated) => Migrated): boolean {
    this.#migratedRaw = undefined;
    const next = change(this.#readMigrated());
    const raw = writeMigrated(next);
    if (!this.#env.storage.set(MIGRATED_KEY, raw)) return false;
    this.#migratedRaw = raw;
    this.migrated = next;
    return true;
  }

  /** The browser lists as storage holds them now, less the deleted and the moved. */
  current(): StoredList[] {
    return this.#readCurrent() ?? [];
  }

  /** Whether `dhloot.lists.v2.bad` holds a value: read, never written or deleted here. */
  get hasBadBackup(): boolean {
    return this.#env.storage.get(LISTS_KEY_BAD) !== null;
  }

  /** Records `owner` as the account that owns this browser's lists, once. */
  claim(owner: string): boolean {
    if (this.#readMigrated().owner !== undefined) return true;
    return this.#changeMigrated((m) => ({ ...m, owner: m.owner ?? owner }));
  }

  /** Holds lists whose account copy did not match: no run sends them again. */
  markHeld(owner: string, ids: readonly string[]): boolean {
    return this.#changeMigrated((m) => ({
      ...m,
      owner: m.owner ?? owner,
      held: union(m.held, ids)
    }));
  }

  /** Asks the notice for the damaged-backup sentence, unless it was already asked or dismissed. */
  markBad(owner: string): boolean {
    return this.#changeMigrated((m) => ({
      ...m,
      owner: m.owner ?? owner,
      bad: m.bad ?? true
    }));
  }

  /** «Скрыть»: the names leave the notice, and a shown backup sentence is not shown again. */
  dismissNotice(): boolean {
    return this.#changeMigrated((m) => {
      const next: Migrated = { ...m };
      delete next.notice;
      if (m.bad === true) next.bad = false;
      return next;
    });
  }

  /**
   * Removes lists by id against fresh storage - a delete after the cutoff, with no
   * merge: another tab's additions survive, and this tab's memory becomes the stored
   * truth. A removed id leaves `held` with it.
   */
  removeMany(ids: readonly string[]): boolean {
    const next = (this.#readCurrent() ?? []).filter((l) => !ids.includes(l.id));
    for (const id of ids) this.#deleted[id] = true;
    const ok = this.#writeLists(next);
    this.lists = next;
    this.#shownRaw = ok ? this.#lastRaw : null;
    if (this.migrated.held?.some((id) => ids.includes(id))) {
      this.#changeMigrated((m) => ({
        ...m,
        held: (m.held ?? []).filter((id) => !ids.includes(id))
      }));
    }
    return ok;
  }

  #writeLists(next: StoredList[]): boolean {
    const json = JSON.stringify(next);
    const ok = this.#env.storage.set(LISTS_KEY, json);
    this.saved = ok;
    if (!ok) {
      this.#say((t) => t.saveFailed, true);
      return false;
    }
    this.#lastRaw = json;
    this.#lastParsed = next;
    return true;
  }

  /**
   * The move's removal, in a fixed order. Reads `dhloot.lists.v2` raw (a list another
   * tab tombstoned is still compared), splits the pairs into unchanged or gone from
   * storage and changed, writes `dhloot.migrated.v1` first - tombstones for the
   * unchanged and gone, names for those whose tombstone is new, `held` for the changed
   * (and no tombstone: a changed list draws again, named in the status) - then the lists
   * without the unchanged ones. A pair another tab already holds is left alone. A crash between the two writes leaves a
   * notice with no removal, never a removal with no notice. Answers the removed lists
   * and the changed ids; null, with nothing written, when the lists key does not parse
   * or the tombstones could not be written.
   */
  settleMove(
    owner: string,
    pairs: readonly MovePair[]
  ): { removed: MovedList[]; changed: string[] } | null {
    const raw = this.#env.storage.get(LISTS_KEY);
    let stored: StoredList[] = [];
    try {
      if (raw !== null) stored = keepLists(JSON.parse(raw));
    } catch {
      return null;
    }
    const byId = (id: string): StoredList | undefined => stored.find((l) => l.id === id);
    const settled: MovePair[] = [];
    const changed: string[] = [];
    const held = this.#readMigrated().held ?? [];
    for (const p of pairs) {
      /* Another tab found its account copy different: never settled here. */
      if (held.includes(p.localId)) continue;
      const l = byId(p.localId);
      if (!l || canonicalList(l) === p.canonical) settled.push(p);
      else changed.push(p.localId);
    }
    const before = { ...this.#readMigrated().lists };
    const wrote = this.#changeMigrated((m) => {
      const lists = { ...m.lists };
      const names = [...(m.notice ?? [])];
      for (const p of settled) {
        if (!Object.hasOwn(lists, p.localId)) names.push(p.name);
        lists[p.localId] = p.accountId;
      }
      /* A changed list under another tab's older tombstone loses it, so the
         edit is drawn, held, and no later write drops it. */
      for (const id of changed) Reflect.deleteProperty(lists, id);
      const next: Migrated = { ...m, owner: m.owner ?? owner, lists };
      if (names.length) next.notice = names;
      if (changed.length) next.held = union(m.held, changed);
      return next;
    });
    if (!wrote) return null;
    const unchanged = settled.filter((p) => byId(p.localId)).map((p) => p.localId);
    /* A changed list is held and stays in storage, its older tombstone gone. */
    const prune = (l: StoredList): boolean =>
      unchanged.includes(l.id) || (Object.hasOwn(before, l.id) && !changed.includes(l.id));
    const removed = settled.flatMap((p): MovedList[] => {
      const list = byId(p.localId) ?? this.get(p.localId);
      return list ? [{ list, accountId: p.accountId }] : [];
    });
    for (const id of unchanged) this.#deleted[id] = true;
    if (stored.some(prune)) {
      const ok = this.#writeLists(stored.filter((l) => !prune(l)));
      this.#shownRaw = ok ? this.#lastRaw : null;
    }
    this.lists = (this.#readCurrent() ?? []).filter((l) => !unchanged.includes(l.id));
    return { removed, changed };
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
    this.lists = this.lists.map((l) => (l.id === id ? withMeta(l, entryId, field, value) : l));
    this.save();
  }

  /** The live list-note writer (app.js 4421-4430): trimmed, and a blank value
   *  deletes the key rather than storing an empty string. */
  setNote(id: string, kind: 'note' | 'hnote', text: string): void {
    this.lists = this.lists.map((l) => (l.id === id ? withNote(l, kind, text) : l));
    this.save();
  }

  /** The live money-mode writer (app.js 4086-4094): the default mode is not
   *  stored at all. */
  setMoney(id: string, mode: MoneyMode): void {
    this.lists = this.lists.map((l) => (l.id === id ? withMoney(l, mode) : l));
    this.save();
  }

  /** Through `moveEntry`; returns whether anything actually moved, and saves
   *  only then - the live `moveToInList` (app.js 1223-1231). */
  move(id: string, entryId: string, to: number): boolean {
    const l = this.get(id);
    const ids = l ? movedIds(l, entryId, to) : null;
    if (!ids) return false;
    this.lists = this.lists.map((x) => (x.id === id ? { ...x, ids } : x));
    this.save();
    return true;
  }

  /** The undo of a removed row (app.js 3944-3969's `toastAction`): splice the
   *  entry back in at `min(at, length)`, and put its meta back only when it
   *  is non-empty. A second undo (the entry already back) is a no-op, as the
   *  live handler's own guard makes it. */
  restoreEntry(id: string, entryId: string, at: number, meta: ListEntryMeta): void {
    this.lists = this.lists.map((l) => (l.id === id ? withEntryAt(l, entryId, at, meta) : l));
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
