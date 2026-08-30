/* Stored lists: what survives a reload, and what happens when two tabs disagree.
 *
 * Storage itself is not here - this module is given arrays and returns arrays,
 * so the merge can be tested without a browser. The rules it encodes are in
 * docs/specs/STATE.md.
 *
 * Pure module: no localStorage, no DOM. */

import type { ListEntryMeta, MoneyMode } from './listLink.js';

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

/* ---------- entries ---------- */

export function itemMeta(l: StoredList, id: string): ListEntryMeta {
  return l.meta?.[id] ?? {};
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
