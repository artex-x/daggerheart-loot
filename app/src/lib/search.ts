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
  return (it: Record_): string => eqLine(it, lang, labels);
}

const has = (hay: string | undefined, needle: string): boolean =>
  !!hay && hay.toLowerCase().includes(needle);

/** Whether one record answers the query. `q` is already lowercased and trimmed. */
export function matches(it: Record_, q: string, statLine: StatLine = () => ''): boolean {
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
  statLine: StatLine = () => ''
): Record_[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return records.filter((it) => matches(it, q, statLine));
}
