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

/**
 * Folds a Latin diacritic to its plain letter (NFD, then drop the combining
 * mark) - `ä`/`ö` -> `a`/`o`, so a reader who cannot type an umlaut still
 * finds `Ethereal Zweihänder` or `Möbius Orb`. Cyrillic is left untouched
 * character by character rather than run through the same decomposition:
 * NFD decomposes `й` (U+0439) into `и` (U+0438) plus a combining breve,
 * which would silently merge `й` into `и` - the exact merge `foldQuery`
 * deliberately does not make. Verified on this codebase's own alphabet
 * before shipping (`search.test.ts`), not assumed.
 */
function foldLatinDiacritics(s: string): string {
  return Array.from(s)
    .map((ch) => {
      const cp = ch.codePointAt(0) ?? 0;
      if (cp >= 0x0400 && cp <= 0x04ff) return ch; // Cyrillic block - see above
      return ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    })
    .join('');
}

/**
 * Folds a string the way search compares it: case-insensitive, `ё`/`Ё` read
 * as `е`, the typographic apostrophes some equipment names carry (U+2019,
 * and U+02BC for good measure) read as the plain `'` a keyboard types, Latin
 * diacritics read as their plain letter (`foldLatinDiacritics`, above - the
 * owner overrode this file's earlier "no diacritic stripping" stance once
 * `Ethereal Zweihänder`/`Möbius Orb` were shown unreachable by ordinary
 * typing), and the Unicode minus sign (U+2212, which 113 descriptions use)
 * reads as the ASCII `-` a keyboard types, so `-1` finds them. Applied to
 * both the query and the catalogue. Still no `й`/`и` merge - see
 * `foldLatinDiacritics`'s comment.
 */
export function foldQuery(s: string): string {
  return foldLatinDiacritics(s.toLowerCase())
    .replace(/ё/g, 'е')
    .replace(/[’ʼ]/g, "'")
    .replace(/−/g, '-');
}

const has = (text: string | undefined, needle: string): boolean =>
  !!text && foldQuery(text).includes(needle);

/** A record's folded searchable text: one folded string per field it is built
 *  from, so checking it agrees exactly with checking the fields one at a time
 *  (see `matches`) - no query can bleed across a field boundary that a
 *  per-field check would never let it cross. */
type Hay = (it: Record_) => readonly string[];

/**
 * Builds a per-record folded haystack, memoised by id.
 *
 * Folding is the expensive part - measured at 2.74ms refolding the
 * catalogue on every keystroke against 0.33ms warm. That 0.33ms reflects a
 * proposed design: one lowercased string per record, built into
 * `data.ts`'s `Index` at load time. This file builds a
 * different design instead - an array of per-field folded strings, cached
 * per id here rather than baked into the `Index` - for the field-boundary
 * correctness reason `Hay`'s own comment records, so the two numbers are
 * not directly comparable measurements of the same code; only the warm/cold
 * shape (fold once, reuse, instead of refolding every keystroke) carries
 * over. `matches`'s fallback (`has`, below) folds live for a caller with no
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
 *
 * Considered and left open: `statLine` and `hay` are two separate
 * positional arguments, so a caller can pass a `hay` built from one
 * `statLine` and a different `statLine` here - `hay` silently wins, since
 * it is checked first. Unreachable today (every real caller builds both
 * from the same `statLineFor(app.lang, app.t)` call and passes them
 * together), so this is a shape the types allow rather than a live bug. A
 * union third argument would make the mismatch unrepresentable, but costs
 * more than a nit: `StatLine` and `Hay` return different types (`string` vs
 * `readonly string[]`), so folding them into one parameter needs either a
 * tagged wrapper or overloaded signatures, and touches every one of this
 * function's ten-odd call sites across `SearchPage.svelte`, `TablesPage.svelte`
 * (twice) and `search.test.ts`'s eight - past the point a one-line fix stays
 * one line. Left as a doc clause instead of a redesign.
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
 * no query typed is an invitation, not a dump of the whole catalogue. No
 * caller has a `Hay` to offer here (both pages that build one call `matches`
 * directly instead), so unlike `matches` this does not take one - `CLAUDE.md`:
 * "Add no module, export, component, or variant before something uses it."
 */
export function search(
  records: readonly Record_[],
  query: string,
  statLine: StatLine = () => ''
): Record_[] {
  const q = foldQuery(query.trim());
  if (!q) return [];
  return records.filter((it) => matches(it, q, statLine));
}
