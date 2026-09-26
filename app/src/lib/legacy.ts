/* The legacy write cutoff and the canonical text of a browser list.
 *
 * `LEGACY_WRITE_UNTIL` is the one place the date lives: the texts read it
 * through `legacyDateText`, and `tests/derived.js` names every document that
 * carries it (docs/specs/FEATURES.md, "Account and browser lists").
 * `canonicalList` is what the move sends: the database hashes that exact
 * text as the list's fingerprint (`move_legacy_list`).
 *
 * Pure module: no port, no storage, no catalog. */

import { clip, NAME_MAX, NOTE_MAX, priceOf, quantityOf } from './cloudLists.js';
import type { StoredList } from './lists.js';
import type { Lang } from './types.js';

/** Monday 2026-10-26, 00:00 UTC: from here browser lists are read-only,
 *  `#/l/` links stop opening and the Lists tab leaves the bar
 *  (docs/specs/FEATURES.md, "Account and browser lists"). */
export const LEGACY_WRITE_UNTIL = Date.UTC(2026, 9, 26);

/** Returns whether browser lists may still be written at `now`. */
export function legacyWritable(now: number): boolean {
  return now < LEGACY_WRITE_UNTIL;
}

/** Returns the cutoff date as the texts say it: «26 октября 2026 года», "26 October 2026". */
export function legacyDateText(lang: Lang): string {
  const at = new Date(LEGACY_WRITE_UNTIL);
  if (lang === 'ru') {
    const dayMonth = new Intl.DateTimeFormat('ru', {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC'
    }).format(at);
    return `${dayMonth} ${String(at.getUTCFullYear())} года`;
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(at);
}

/** The id form `move_legacy_list` accepts; a list holding another id is refused whole. */
export const ID_FORM = /^[A-Za-z0-9_-]{1,64}$/;

type Json = string | number | Json[] | { [k: string]: Json };

/* Keys in code-unit order at every level. `JSON.stringify` would put an
   integer-like key ("10") before the others whatever the insertion order. */
function stringify(v: Json): string {
  if (Array.isArray(v)) return '[' + v.map(stringify).join(',') + ']';
  if (typeof v === 'object') {
    return (
      '{' +
      Object.keys(v)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + stringify(v[k] as Json))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(v);
}

const text = (v: unknown): string => (typeof v === 'string' ? v : '');

/**
 * Returns the canonical JSON of a browser list, the text the move sends and the database
 * hashes. Every id of the RPC's form is kept, whether the catalog knows it or not; a repeat
 * and an id of another form are dropped; a quantity of 1, a price of 0 and an empty note are
 * dropped; the name and the notes are cut to the schema's bounds; the keys are sorted.
 */
export function canonicalList(l: StoredList): string {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const id of l.ids as unknown[]) {
    if (typeof id !== 'string' || !ID_FORM.test(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  const allMeta: unknown = l.meta;
  const meta: Record<string, Json> = {};
  for (const id of ids) {
    if (!allMeta || typeof allMeta !== 'object' || !Object.hasOwn(allMeta, id)) continue;
    const m: unknown = (allMeta as Record<string, unknown>)[id];
    if (!m || typeof m !== 'object') continue;
    const { qty, gold, note, hnote } = m as Record<string, unknown>;
    const entry: Record<string, Json> = {};
    const q = quantityOf(qty as number | undefined);
    if (q > 1) entry['qty'] = q;
    const g = priceOf(gold as number | undefined);
    if (g !== null) entry['gold'] = g;
    if (text(note)) entry['note'] = clip(text(note), NOTE_MAX);
    if (text(hnote)) entry['hnote'] = clip(text(hnote), NOTE_MAX);
    if (Object.keys(entry).length) meta[id] = entry;
  }
  const out: Record<string, Json> = { name: clip(text(l.name), NAME_MAX), ids };
  if (Object.keys(meta).length) out['meta'] = meta;
  if (l.money === 'coin') out['money'] = 'coin';
  if (text(l.note)) out['note'] = clip(text(l.note), NOTE_MAX);
  if (text(l.hnote)) out['hnote'] = clip(text(l.hnote), NOTE_MAX);
  return stringify(out);
}
