/* Search across the whole catalogue.
 *
 * Both languages at once, deliberately: a table running in Russian still gets a
 * hit on the English name someone typed off a book, and the reverse. Names,
 * descriptions and - for equipment - the stat line, so "Двуручное" or "melee"
 * finds things too.
 *
 * A substring match, not a fuzzy one. 1061 records is small enough that the
 * filtering is instant, and a fuzzy library would be a dependency bought with
 * results nobody asked for: a search for "лук" should not offer "клык".
 *
 * Pure module: it is handed the records and the stat line, and returns records. */

import type { Record_ } from './types.js';

/** How a record's stat line reads. Empty for anything without one. */
export type StatLine = (it: Record_) => string;

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
