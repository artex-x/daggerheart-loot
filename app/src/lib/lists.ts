/* Stored lists: what survives a reload, and what happens when two tabs disagree.
 *
 * Storage itself is not here - this module is given arrays and returns arrays,
 * so the merge can be tested without a browser. The rules it encodes are in
 * docs/specs/STATE.md.
 *
 * Pure module: no localStorage, no DOM. */

import {
  decodeList,
  type DecodedList,
  type KnowsId,
  type ListEntryMeta,
  type MoneyMode
} from './listLink.js';
import { foldQuery } from './search.js';

/** The list count from which both the add-to-list menu and the lists index draw a search box. */
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

/** Returns the `ListStore.create` init for an own copy of a decoded list:
 *  its ids, every entry's meta, the money mode and both list notes. Fresh
 *  arrays and objects, so a reactive proxy is never stored. */
export function copyInit(d: DecodedList): Partial<Omit<StoredList, 'id' | 'name' | 'created'>> {
  const init: Partial<Omit<StoredList, 'id' | 'name' | 'created'>> = { ids: [...d.ids] };
  if (d.money) init.money = d.money;
  if (d.note) init.note = d.note;
  if (d.hnote) init.hnote = d.hnote;
  if (d.meta && Object.keys(d.meta).length) {
    const meta: Record<string, ListEntryMeta> = {};
    for (const id of Object.keys(d.meta)) {
      const m = d.meta[id];
      if (m) meta[id] = { ...m };
    }
    init.meta = meta;
  }
  return init;
}

/** The shape before the note split. Kept because v1 data is still read once. */
export interface LegacyList {
  id: string;
  name: string;
  ids: string[];
  created?: number;
  note?: string;
  noteShow?: boolean;
  meta?: Record<string, { qty?: number; gold?: number; note?: string; noteShow?: boolean }>;
  [k: string]: unknown;
}

/**
 * Anything that is not a list is dropped rather than crashing the app.
 *
 * Storage is read as untrusted data: it may have been written by an older
 * build, edited by hand, or corrupted. One bad entry must not cost the rest.
 */
export function keepLists(arr: unknown): StoredList[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(
    (l): l is StoredList =>
      !!l &&
      typeof l === 'object' &&
      typeof (l as StoredList).id === 'string' &&
      !!(l as StoredList).id &&
      Array.isArray((l as StoredList).ids)
  );
}

/**
 * One flagged note becomes two named ones.
 *
 * The old `noteShow` meant "copy this along with the item", which is precisely
 * the note meant for players - so the split is read off the data rather than
 * guessed. Applied to the list and to every entry.
 */
export function liftNotes(l: LegacyList): StoredList {
  const lift = <T extends { note?: string; noteShow?: boolean; hnote?: string }>(o: T): T => {
    if (o.note && !o.noteShow) {
      o.hnote = o.note;
      delete o.note;
    }
    delete o.noteShow;
    return o;
  };
  const out = lift({ ...l }) as unknown as StoredList;
  if (out.meta) {
    const meta: Record<string, ListEntryMeta> = {};
    for (const id of Object.keys(out.meta)) {
      const entry = out.meta[id];
      if (entry) meta[id] = lift({ ...entry });
    }
    out.meta = meta;
  }
  return out;
}

/**
 * Merge this tab's lists with what is in storage right now.
 *
 * Every write used to stamp this tab's whole array over the key, so two tabs
 * open at once destroyed each other's lists: the one that saved last won
 * outright, silently, with no server and no export to recover from.
 *
 * - lists this tab knows about win, in this tab's order, because that is the
 *   order the person is looking at
 * - lists only the other tab has are appended, not discarded
 * - a list deleted here is in neither `mine` nor storage-as-this-tab-sees-it,
 *   so `deleted` is what tells "I removed it" apart from "I never had it" and
 *   stops the merge resurrecting it from the other tab's copy
 */
export function mergeLists(
  mine: readonly StoredList[],
  stored: readonly StoredList[],
  deleted: Readonly<Record<string, boolean>> = {}
): StoredList[] {
  const seen = new Set(mine.map((l) => l.id));
  const theirs = stored.filter((l) => !seen.has(l.id) && !deleted[l.id]);
  return [...mine, ...theirs];
}

/* ---------- finding a list (docs/specs/FEATURES.md, "Lists") ---------- */

/** Returns the lists whose name holds the query, folded the way search folds it; a blank query keeps every list. */
export function matchLists(lists: readonly StoredList[], query: string): StoredList[] {
  const q = foldQuery(query.trim());
  return q ? lists.filter((l) => foldQuery(l.name).includes(q)) : [...lists];
}

/** Returns a copy with the `first` lists ahead of the rest, each group newest created first. */
export function pickerOrder(
  lists: readonly StoredList[],
  first: (l: StoredList) => boolean
): StoredList[] {
  const rank = (l: StoredList): number => (first(l) ? 0 : 1);
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

/** Returns the coins the priced taken entries cost and how many taken entries have no price. */
export function takenTotal(
  ids: readonly string[],
  metaOf: (id: string) => ListEntryMeta,
  takenOf: (id: string) => number
): { coins: number; unpriced: number } {
  let coins = 0;
  let unpriced = 0;
  for (const id of ids) {
    const gold = metaOf(id).gold ?? 0;
    if (gold > 0) coins += gold * takenOf(id);
    else unpriced++;
  }
  return { coins, unpriced };
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

/**
 * Which of the person's own lists an `#/l/<payload>` address is showing.
 *
 * Comparing encoded payloads is brittle: a list has two flavours (with the
 * GM's notes and without), links made before the checksum look different
 * again, and any future change to the encoding would break recognition once
 * more. So the payload is decoded and the contents compared instead: same
 * name, same entries in the same order, and nothing the link carries that
 * contradicts what is stored - a players' link simply has no GM notes, which
 * is not a disagreement (app.js 1551-1574).
 */
export function findListByPayload(
  lists: readonly StoredList[],
  payload: string,
  knows: KnowsId
): StoredList | null {
  const want = decodeList(payload, knows);
  if (!want) return null;
  const fields = ['qty', 'gold', 'note', 'hnote'] as const;
  for (const l of lists) {
    if (l.name !== want.name || l.ids.length !== want.ids.length) continue;
    if (l.ids.some((id, k) => id !== want.ids[k])) continue;
    const meta = want.meta ?? {};
    const clash = Object.keys(meta).some((id) => {
      const wm = meta[id];
      if (!wm) return false;
      const mine = itemMeta(l, id);
      return fields.some((f) => wm[f] !== undefined && wm[f] !== mine[f]);
    });
    if (clash) continue;
    if (want.note !== undefined && want.note !== l.note) continue;
    if (want.hnote !== undefined && want.hnote !== l.hnote) continue;
    return l;
  }
  return null;
}
