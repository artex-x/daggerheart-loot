/* Search across the whole catalogue.
 *
 * Both languages at once, deliberately: a table running in Russian still gets a
 * hit on the English name someone typed off a book, and the reverse. Names,
 * descriptions and - for equipment - the stat line, so "Двуручное" or "melee"
 * finds things too.
 *
 * A query is words in any order: each word must hit one field of the record,
 * as typed (a substring, as before) or as another form of the same word. Word
 * forms come from the Snowball stemmers (`@orama/stemmers`), checked on both
 * sides: the catalogue word must start with the query's stem and reduce to
 * the same stem, so «зелёный» (stem "зелен") never answers "зелье" (stem
 * "зел"). A phrase in quotes matches as typed, with no word forms.
 *
 * No index: 1323 records are few enough to scan on every keystroke, and an
 * own item is searchable the moment it exists.
 *
 * Never a near miss: a fuzzy match would offer "клык" for "лук"
 * (`docs/decisions/2026-10-01-search-is-one-mode-words-in-any-order-snowball-forms.md`).
 *
 * `#/search` and the editor's item pickers rank their hits (`rankHits`); a
 * table keeps its sections and roll order (`matches`, `search`).
 *
 * Pure module: it is handed the records and the stat line, and returns records. */

import { stemmer as stemEn } from '@orama/stemmers/english';
import { stemmer as stemRu } from '@orama/stemmers/russian';
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
export function statLineFor(
  lang: Lang,
  t: Pick<Dict, 'tier' | 'eqTh' | 'eqScore' | 'voaArtifact1'>
): StatLine {
  const labels = {
    tier: t.tier,
    thresholds: t.eqTh,
    armorScore: t.eqScore,
    artifact: t.voaArtifact1
  };
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

/** One unit of a parsed query. */
export interface Term {
  /** Folded text. */
  readonly text: string;
  /** From `"..."`: matched as typed, never by its stem. */
  readonly phrase: boolean;
  /** `text` at a word start. */
  readonly start: RegExp;
  /** The Snowball stem, when it differs from `text` and has two characters or more. */
  readonly stem: string | null;
  /** What a word must start with to be stemmed and compared: `stem`, or for
   *  English `stem` less a final `i` or `e`; null when `stem` is null. */
  readonly stemPrefix: string | null;
  /** Every word that starts with `stemPrefix` (global); null when `stem` is null. */
  readonly stemWords: RegExp | null;
}

/* A word start: the start of a field, or after a character that is not a
   letter or a digit. */
const WORD_START = '(?:^|[^\\p{L}\\p{N}])';
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const QUOTES = /[«»“”„]/g;

const stems = new Map<string, string>();

/** Returns the Snowball stem of one folded word; a word with digits, marks or mixed scripts is its own stem. */
function stemOf(word: string): string {
  let stem = stems.get(word);
  if (stem === undefined) {
    if (/^[а-я]+$/.test(word)) stem = stemRu(word);
    else if (/^[a-z]+$/.test(word)) stem = stemEn(word);
    else stem = word;
    stems.set(word, stem);
  }
  return stem;
}

function term(text: string, phrase: boolean): Term {
  const raw = phrase ? null : stemOf(text);
  /* Snowball turns "ей" into "е": a one-letter stem would let the word answer
     a record that holds only «ее». */
  const stem = raw && raw !== text && raw.length >= 2 ? raw : null;
  /* An English Snowball stem is often not a prefix of the word it comes from
     (ally -> alli, enemy -> enemi, moving -> move), so the candidate words are
     found by the stem less that final letter; `stemHit` still compares stems. */
  const prefix =
    stem && stem.length >= 3 && /^[a-z]+$/.test(stem) && /[ie]$/.test(stem)
      ? stem.slice(0, -1)
      : stem;
  return {
    text,
    phrase,
    start: new RegExp(WORD_START + escapeRe(text), 'u'),
    stem,
    stemPrefix: prefix,
    stemWords: prefix
      ? new RegExp(WORD_START + '(' + escapeRe(prefix) + '[\\p{L}\\p{N}]*)', 'gu')
      : null
  };
}

/**
 * Parses what the reader typed into terms: words, and phrases in quotes.
 *
 * `«»`, `“”` and `„` read as `"`: a phone keyboard with smart punctuation
 * types `“ring of”`, and a Russian reader may type ёлочки. An unclosed quote
 * runs to the end, so the results do not flicker while the closing quote is
 * still to come. No terms means no query.
 */
export function parseQuery(raw: string): readonly Term[] {
  const s = foldQuery(raw).replace(QUOTES, '"');
  const out: Term[] = [];
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s.charAt(i))) {
      i++;
    } else if (s[i] === '"') {
      const close = s.indexOf('"', i + 1);
      const end = close < 0 ? s.length : close;
      const text = s.slice(i + 1, end).trim();
      if (text) out.push(term(text, true));
      i = end + 1;
    } else {
      let end = i;
      while (end < s.length && !/\s/.test(s.charAt(end)) && s.charAt(end) !== '"') end++;
      out.push(term(s.slice(i, end), false));
      i = end;
    }
  }
  return out;
}

/** A record's folded fields, in two groups so a score can tell a name from a description. */
export interface HayParts {
  /** Folded `ru`, `en`. */
  readonly names: readonly string[];
  /** Folded `rud`, `ende`, and the stat line for equipment. */
  readonly texts: readonly string[];
}

/* One folded string per field, so no term can bleed across a field boundary. */
type Hay = (it: Record_) => HayParts;

const folded = (fields: readonly (string | undefined)[]): string[] =>
  fields.filter((s): s is string => !!s).map(foldQuery);

/** Returns a record's folded fields; `hayFor` and the uncached path share it, so they cannot disagree. */
function partsOf(it: Record_, statLine: StatLine): HayParts {
  return {
    names: folded([it.ru, it.en]),
    texts: folded(it.eq ? [it.rud, it.ende, statLine(it)] : [it.rud, it.ende])
  };
}

/**
 * Builds a per-record folded haystack, memoised by record.
 *
 * Folding is the expensive part: refolding the catalogue cost 2.74ms per
 * keystroke when the match was one substring, against 0.33ms with the folded
 * fields cached. With words, stems and ranking a warm query costs 1-6ms for
 * the catalogue and 300 own items in Node (measured 2026-10-02). `matches` without a
 * `hay` folds live for a caller with no index to cache against; this is for
 * the callers that filter the whole catalogue on every query.
 */
export function hayFor(statLine: StatLine): Hay {
  /* Keyed by the record object, not its id: an edited own item is a new object under
     the same key, and its old folding must not answer for it. */
  const cache = new WeakMap<Record_, HayParts>();
  return (it: Record_): HayParts => {
    let parts = cache.get(it);
    if (!parts) {
      parts = partsOf(it, statLine);
      cache.set(it, parts);
    }
    return parts;
  };
}

/** Whether a word of the field starts with the term's stem prefix and reduces to the same stem. */
function stemHit(field: string, t: Term): boolean {
  if (!t.stem || !t.stemPrefix || !t.stemWords || !field.includes(t.stemPrefix)) return false;
  for (const m of field.matchAll(t.stemWords)) if (stemOf(m[1] ?? '') === t.stem) return true;
  return false;
}

/** Returns 2 when the term hits the field at a word start, 1 inside a word, 0 on a miss. */
function hitIn(field: string, t: Term): number {
  if (field.includes(t.text)) return t.start.test(field) || stemHit(field, t) ? 2 : 1;
  return stemHit(field, t) ? 2 : 0;
}

const hitsAny = (fields: readonly string[], t: Term): boolean =>
  fields.some((f) => f.includes(t.text) || stemHit(f, t));

/**
 * Whether one record answers the query: every term hits one of its fields.
 * An empty list of terms answers nothing.
 *
 * `hay`, when given, is consulted instead of re-folding the record's own
 * fields - see `hayFor`. A caller builds `hay` from the same `statLine` it
 * passes here; `hay` wins when the two disagree.
 */
export function matches(
  it: Record_,
  terms: readonly Term[],
  statLine: StatLine = () => '',
  hay?: Hay
): boolean {
  if (!terms.length) return false;
  const p = hay ? hay(it) : partsOf(it, statLine);
  return terms.every((t) => hitsAny(p.names, t) || hitsAny(p.texts, t));
}

/** Returns the record's score for the terms, or 0 when a term misses it. */
function scoreOf(p: HayParts, terms: readonly Term[]): number {
  let sum = 0;
  for (const t of terms) {
    let best = 0;
    for (const f of p.names) best = Math.max(best, hitIn(f, t) * 4);
    if (!best) for (const f of p.texts) best = Math.max(best, hitIn(f, t));
    if (!best) return 0;
    sum += best;
  }
  return sum;
}

/**
 * Records answering the query, best first. Per term, a name at a word start
 * scores 8, a name inside a word 4, a description or stat line at a word
 * start 2, inside a word 1; a record scores the sum. The sort is stable, so
 * equal scores keep the order given: the catalogue first, then own items.
 */
export function rankHits(
  records: readonly Record_[],
  terms: readonly Term[],
  statLine: StatLine = () => '',
  hay?: Hay
): Record_[] {
  if (!terms.length) return [];
  const scored: { it: Record_; score: number }[] = [];
  for (const it of records) {
    const score = scoreOf(hay ? hay(it) : partsOf(it, statLine), terms);
    if (score) scored.push({ it, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((x) => x.it);
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
  const terms = parseQuery(query);
  if (!terms.length) return [];
  return records.filter((it) => matches(it, terms, statLine));
}
