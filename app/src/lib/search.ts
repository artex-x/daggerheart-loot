/* Search across the whole catalogue.
 *
 * Both languages at once, deliberately: a table running in Russian still gets a
 * hit on the English name someone typed off a book, and the reverse. Names,
 * descriptions and - for equipment - the stat line, so "Двуручное" or "melee"
 * finds things too.
 *
 * A substring match, not a fuzzy one. 1091 records is small enough that the
 * filtering is instant, and a fuzzy library would be a dependency bought with
 * results nobody asked for: a search for "лук" should not offer "клык".
 *
 * Pure module: it is handed the records and the stat line, and returns records. */

import { eqLine } from './i18n.js';
import { isFrameRecord } from './label.js';
import type { Dict } from './dict.js';
import type { Lang, Record_ } from './types.js';

/** How a record's stat line reads. Empty for anything without one. */
export type StatLine = (it: Record_) => string;

/**
 * The stat line search matches against - the type word kept, unlike the
 * row's own display, which drops it (`noType: true`).
 *
 * `TablesPage.svelte`'s own `statLine` used to carry this rule; search is
 * its second caller, so it moved here. The live `matches` searches
 * `eqLine(it)` *with* the type word ("Основное оружие · Ранг 1 · ..."), so
 * typing "основное" finds every weapon - dropping the type word here would
 * silently narrow what a query can reach.
 */
export function statLineFor(lang: Lang, t: Pick<Dict, 'tier' | 'eqTh' | 'eqScore'>): StatLine {
  const labels = { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore };
  return (it: Record_): string => eqLine(it, lang, labels, { noTier: isFrameRecord(it) });
}

/**
 * Folds a string the way search compares it: case-insensitive, `ё`/`Ё` read as
 * `е`, and the typographic apostrophes some equipment names carry (U+2019,
 * and U+02BC for good measure) read as the plain `'` a keyboard types. Applied
 * to both the query and the catalogue, so `плетеная` finds "Плетёная" and
 * `soldier's` finds "Soldier's". Nothing else - no `й`/`и` merge, no
 * diacritic stripping; that would be fuzziness nobody asked for.
 */
export function foldQuery(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/[’ʼ]/g, "'");
}

const has = (hay: string | undefined, needle: string): boolean =>
  !!hay && foldQuery(hay).includes(needle);

/** A record's folded searchable text: one folded string per field it is built
 *  from, so checking it agrees exactly with checking the fields one at a time
 *  (see `matches`) - no query can bleed across a field boundary that a
 *  per-field check would never let it cross. */
type Hay = (it: Record_) => readonly string[];

/**
 * Builds a per-record folded haystack, memoised by id.
 *
 * Folding is the expensive part - `performance.md` PF2 measured 2.74ms
 * refolding the catalogue on every keystroke against 0.33ms once this is
 * warm. `matches`'s fallback (`has`, below) folds live for a caller with no
 * index to cache against; this is for the two pages that filter the whole
 * catalogue on every query and can afford to build it once per language.
 */
export function hayFor(statLine: StatLine): Hay {
  const cache = new Map<string, readonly string[]>();
  return (it: Record_): readonly string[] => {
    let parts = cache.get(it.id);
    if (!parts) {
      const raw = [it.ru, it.en, it.rud, it.ende];
      if (it.eq) raw.push(statLine(it));
      parts = raw.filter((s): s is string => !!s).map(foldQuery);
      cache.set(it.id, parts);
    }
    return parts;
  };
}

const hasAny = (parts: readonly string[], needle: string): boolean =>
  parts.some((p) => p.includes(needle));

/**
 * Whether one record answers the query. `q` is already folded (`foldQuery`).
 *
 * `hay`, when given, is consulted instead of re-folding the record's own
 * fields - see `hayFor`. Without it, each field is folded on the spot; the
 * two paths agree on every query because both fold the same fields the same
 * way, just with a cache in front of one of them.
 */
export function matches(
  it: Record_,
  q: string,
  statLine: StatLine = () => '',
  hay?: Hay
): boolean {
  if (hay) return hasAny(hay(it), q);
  return (
    has(it.ru, q) ||
    has(it.en, q) ||
    has(it.rud, q) ||
    has(it.ende, q) ||
    (!!it.eq && has(statLine(it), q))
  );
}

/**
 * Records answering the query, in the order they were given.
 *
 * An empty query returns nothing rather than everything: the search page with
 * no query typed is an invitation, not a dump of the whole catalogue.
 */
export function search(
  records: readonly Record_[],
  query: string,
  statLine: StatLine = () => '',
  hay?: Hay
): Record_[] {
  const q = foldQuery(query.trim());
  if (!q) return [];
  return records.filter((it) => matches(it, q, statLine, hay));
}
