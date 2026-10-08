/* A print set: the ordered cards of one print sheet and their counts, stored in the
 * maker's account and opened by a short id at `#/p/<id>`. It holds references - a catalog
 * id or a homebrew item's id - so a reader sees each card as it is when the set is read.
 * Pure module. docs/specs/FEATURES.md, "Print"; docs/specs/META.md, section 3. */

import { linkedRecords, type LinkedRow } from './cloudLists.js';
import { PRINT_MAX } from './hash.js';
import { isHomebrewRecord, type HomebrewRecord } from './homebrew.js';
import type { Record_ } from './types.js';

/** One card of a print set: a catalog id (`k`) or a homebrew item's id (`h`), and a count
 *  over 1 (`q`, 2..99). */
export type PrintSetEntry = { k: string; q?: number } | { h: string; q?: number };

/** One card of a set as the print page draws it: a catalog id, or the set's own record of
 *  a homebrew item, with its count over 1. */
export type PrintSetRow = { id: string; q?: number } | { record: HomebrewRecord; q?: number };

/** A set's id as `print_sets.id` holds it: 12 base64url characters. */
export const PRINT_SET_ID = /^[A-Za-z0-9_-]{12}$/;

/** A set ends this many days after its last open (`lifecycle_cleanup()`). */
export const PRINT_SET_DAYS = 90;

const PRINT_K = /^[a-z0-9_]{1,32}$/;
const PRINT_H = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const Q_MAX = 99;

/** Returns whether `v` is entries `create_print_set` takes, less its byte bound: 1 to 180
 *  objects of `k` or `h` and an optional `q` of 2..99, no `k` and no `h` twice. */
export function printEntriesValid(v: unknown): v is PrintSetEntry[] {
  if (!Array.isArray(v) || v.length < 1 || v.length > PRINT_MAX) return false;
  const seen = new Set<string>();
  for (const e of v as unknown[]) {
    if (typeof e !== 'object' || e === null || Array.isArray(e)) return false;
    const o = e as Record<string, unknown>;
    if (Object.keys(o).some((k) => k !== 'k' && k !== 'h' && k !== 'q')) return false;
    if ('k' in o === 'h' in o) return false;
    const ref = 'k' in o ? o['k'] : o['h'];
    if (typeof ref !== 'string') return false;
    if ('k' in o ? !PRINT_K.test(ref) || ref.startsWith('hb_') : !PRINT_H.test(ref)) {
      return false;
    }
    const q = o['q'];
    if ('q' in o && !countOk(q)) return false;
    const key = ('k' in o ? 'k:' : 'h:') + ref;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

function countOk(q: unknown): q is number {
  return typeof q === 'number' && Number.isInteger(q) && q >= 2 && q <= Q_MAX;
}

/** Returns the entries a print press stores: the first 180 records, a catalog record by
 *  its id and a homebrew record by its item's id, each with its count from `qty` when over
 *  1 (at most 99). A repeated card keeps its first; a homebrew record with no item id is
 *  left out. `cut` counts the records past 180. */
export function printSetEntries(
  items: readonly Record_[],
  qty: Readonly<Record<string, number>>
): { entries: PrintSetEntry[]; cut: number } {
  const seen = new Set<string>();
  const entries: PrintSetEntry[] = [];
  let cut = 0;
  for (const it of items) {
    const hid = isHomebrewRecord(it) ? it.hid : undefined;
    if (isHomebrewRecord(it) && typeof hid !== 'string') continue;
    const key = hid === undefined ? 'k:' + it.id : 'h:' + hid;
    if (seen.has(key)) continue;
    seen.add(key);
    if (entries.length >= PRINT_MAX) {
      cut++;
      continue;
    }
    const n = qty[it.id] ?? 0;
    const q = n > 1 ? { q: Math.min(Math.floor(n), Q_MAX) } : {};
    entries.push(hid === undefined ? { k: it.id, ...q } : { h: hid, ...q });
  }
  return { entries, cut };
}

/** Returns the rows of `get_print_set`'s answer in the set's order, or null when the
 *  answer is not one. A catalog id the build does not know is dropped; a homebrew record
 *  that is not valid is dropped and counted in `missing`, beside the deleted items the
 *  answer counts. */
export function readPrintSet(
  answer: unknown,
  knows: (id: string) => boolean
): { rows: PrintSetRow[]; missing: number } | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null;
  const { entries, missing } = answer as Record<string, unknown>;
  if (!Array.isArray(entries)) return null;
  if (typeof missing !== 'number' || !Number.isInteger(missing) || missing < 0) return null;
  const objects = (entries as unknown[]).filter(
    (e): e is Record<string, unknown> => !!e && typeof e === 'object' && !Array.isArray(e)
  );
  const records = linkedRecords(
    objects.flatMap((e): LinkedRow[] =>
      typeof e['hid'] === 'string' ? [{ hid: e['hid'], item: e['item'], img: e['img'] }] : []
    )
  );
  const rows: PrintSetRow[] = [];
  let lost = missing;
  for (const e of objects) {
    const q = countOk(e['q']) ? { q: e['q'] } : {};
    const k = e['k'];
    const hid = e['hid'];
    if (typeof k === 'string') {
      if (knows(k)) rows.push({ id: k, ...q });
    } else if (typeof hid === 'string') {
      const record = records.get(hid);
      if (record) rows.push({ record, ...q });
      else lost++;
    }
  }
  return { rows, missing: lost };
}
