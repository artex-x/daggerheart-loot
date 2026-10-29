/* A list's shape and the pure edits the account store makes to it: finding, ordering,
 * entry meta, notes, money and moves (docs/specs/FEATURES.md, "Lists").
 *
 * Pure module: no storage, no DOM. */

import { MONEY_DEFAULT, type MoneyMode } from './money.js';
import { foldQuery } from './search.js';

/** The list quantity field's own `max`: a quantity read from any file or row is clamped to it. */
export const QTY_MAX = 99;

/** One entry: everything optional, older lists knew none of these fields. */
export interface ListEntryMeta {
  qty?: number;
  gold?: number;
  /** The note that goes to the players. */
  note?: string;
  /** The note that stays with the GM. */
  hnote?: string;
  /** «Только для мастера», an account list's entry only. */
  gmOnly?: true;
}

export interface ListShape {
  name: string;
  ids: string[];
  money?: MoneyMode;
  note?: string;
  hnote?: string;
  meta?: Record<string, ListEntryMeta>;
}

/** The count from which a search box is drawn: lists in the add-to-list menu and on the
 *  lists index, own items, sets and rule cards on «Мои предметы». */
export const LIST_SEARCH_AT = 8;

/** How many cards the lists index draws before «Показать ещё», and how many each press adds (issue 68). */
export const LIST_PAGE = 24;

export interface StoredList {
  id: string;
  name: string;
  ids: string[];
  created?: number;
  money?: MoneyMode;
  note?: string;
  hnote?: string;
  meta?: Record<string, ListEntryMeta>;
}

/* ---------- finding a list (docs/specs/FEATURES.md, "Lists") ---------- */

/** Returns the lists whose name holds the query, folded the way search folds it; a blank query keeps every list. */
export function matchLists<T extends StoredList>(lists: readonly T[], query: string): T[] {
  const q = foldQuery(query.trim());
  return q ? lists.filter((l) => foldedName(l).includes(q)) : [...lists];
}

/* Each list's folded name, by list object: a store replaces a list on change, so one fold per
   list serves every keystroke of a search; the name kept beside it guards a mutated one. */
const FOLDED = new WeakMap<StoredList, { name: string; folded: string }>();

function foldedName(l: StoredList): string {
  const had = FOLDED.get(l);
  if (had?.name === l.name) return had.folded;
  const folded = foldQuery(l.name);
  FOLDED.set(l, { name: l.name, folded });
  return folded;
}

/** Returns a copy with the `first` lists ahead of the rest, each group newest created first. */
export function pickerOrder<T extends StoredList>(
  lists: readonly T[],
  first: (l: T) => boolean
): T[] {
  const rank = (l: T): number => (first(l) ? 0 : 1);
  return [...lists].sort((a, b) => rank(a) - rank(b) || (b.created ?? 0) - (a.created ?? 0));
}

/* ---------- entries ---------- */

export function itemMeta(l: StoredList, id: string): ListEntryMeta {
  return l.meta?.[id] ?? {};
}

/* ---------- a selection's taken counts (docs/specs/FEATURES.md, "Lists") ---------- */

/** An entry with no `qty` is one of a thing. */
function stockOf(meta: ListEntryMeta): number {
  return Math.max(1, meta.qty ?? 1);
}

/** Returns how many of an entry a selection takes: the picked count held to 1..stock, or the whole stock. */
export function takenQty(meta: ListEntryMeta, picked?: number): number {
  const stock = stockOf(meta);
  if (picked === undefined) return stock;
  return Math.min(stock, Math.max(1, Math.floor(picked) || 1));
}

/** Returns the stock an entry keeps after `taken` of it leave; 0 means the entry leaves the list. */
export function stockLeft(meta: ListEntryMeta, taken: number): number {
  return Math.max(0, stockOf(meta) - taken);
}

/** Returns the coins the priced taken entries cost, how many taken entries have no price, and the taken pieces over all entries. */
export function takenTotal(
  ids: readonly string[],
  metaOf: (id: string) => ListEntryMeta,
  takenOf: (id: string) => number
): { coins: number; unpriced: number; pieces: number } {
  let coins = 0;
  let unpriced = 0;
  let pieces = 0;
  for (const id of ids) {
    const gold = metaOf(id).gold ?? 0;
    const taken = takenOf(id);
    pieces += taken;
    if (gold > 0) coins += gold * taken;
    else unpriced++;
  }
  return { coins, unpriced, pieces };
}

/** Returns how many of the entries are «Только для мастера». */
export function gmOnlyCount(
  ids: readonly string[],
  metaOf: (id: string) => ListEntryMeta
): number {
  let n = 0;
  for (const id of ids) if (metaOf(id).gmOnly === true) n++;
  return n;
}

/* ---------- one list's writers, shared by the local and the account store ---------- */

/** Returns the list with one entry's field set, or removed when `value` is falsy; an entry
 *  or a `meta` emptied by that is pruned rather than left as `{}`. */
export function withMeta(
  l: StoredList,
  entryId: string,
  field: 'qty' | 'gold' | 'note' | 'hnote' | 'gmOnly',
  value: string | number | boolean
): StoredList {
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
}

/** Returns the list with a list note set, trimmed; a blank text removes the key. */
export function withNote(l: StoredList, kind: 'note' | 'hnote', text: string): StoredList {
  const v = text.trim();
  const next: StoredList = { ...l };
  if (v) next[kind] = v;
  else Reflect.deleteProperty(next, kind);
  return next;
}

/** Returns the list with its money mode set; the default mode is not stored. */
export function withMoney(l: StoredList, mode: MoneyMode): StoredList {
  const next: StoredList = { ...l };
  if (mode === MONEY_DEFAULT) delete next.money;
  else next.money = mode;
  return next;
}

/** Returns the ids after a move of `entryId` to `to`, or null when nothing moves. */
export function movedIds(l: StoredList, entryId: string, to: number): string[] | null {
  const from = l.ids.indexOf(entryId);
  if (from < 0) return null;
  const clamped = Math.max(0, Math.min(to, l.ids.length - 1));
  if (from === clamped) return null;
  return moveEntry(l.ids, from, to);
}

/** Returns the list with a removed entry back at `min(at, length)` and its meta when that is
 *  not empty; the same list when the entry is already there. */
export function withEntryAt(
  l: StoredList,
  entryId: string,
  at: number,
  meta: ListEntryMeta
): StoredList {
  if (l.ids.includes(entryId)) return l;
  const ids = [...l.ids];
  ids.splice(Math.min(at, ids.length), 0, entryId);
  const next: StoredList = { ...l, ids };
  if (Object.keys(meta).length) next.meta = { ...(l.meta ?? {}), [entryId]: meta };
  return next;
}

/** Returns the ids the data knows and the list does not hold yet, in the order given. */
export function freshIds(
  l: StoredList,
  ids: readonly string[],
  knows: (id: string) => boolean
): string[] {
  return ids.filter((id) => knows(id) && !l.ids.includes(id));
}

/**
 * Returns the list with `fresh` appended. `meta`, when given, copies the players'-visible
 * facts along for each fresh id - `qty` above 1, `gold` above 0, `note` when present; `hnote`
 * never travels.
 */
export function withIds(
  l: StoredList,
  fresh: readonly string[],
  meta?: Readonly<Record<string, ListEntryMeta>>
): StoredList {
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
}

/**
 * Move an entry to a new position.
 *
 * Typing a number is the same operation as dragging: to send entry 40 to
 * position 20 you type 20, rather than pressing "up" twenty times. Positions
 * the person types are 1-based and may be out of range.
 */
export function moveEntry(ids: readonly string[], from: number, to: number): string[] {
  if (from < 0 || from >= ids.length) return [...ids];
  const out = [...ids];
  const [moved] = out.splice(from, 1);
  if (moved === undefined) return [...ids];
  out.splice(Math.max(0, Math.min(to, out.length)), 0, moved);
  return out;
}
