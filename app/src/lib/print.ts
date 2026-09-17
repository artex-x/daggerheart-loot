/* The print sheet's own small helpers, off app.js 3235-3266, 3282-3331,
 * 3520-3522.
 *
 * Everything a card draws that is not text is a vector exported into `card/`
 * by the live app's author, not redrawn here - CLAUDE.md's "Export vectors;
 * do not redraw them." This module only names which file a card wants and
 * how the deck of cards is cut into nine-up sheets.
 *
 * Pure module: no DOM, no `S.printBW` - `bw` arrives as an argument. */

import type { Record_ } from './types.js';

/** Where the exported vectors live, junctioned into `dist/` alongside `img/`
 *  and `og/` - CONTRACTS.md section 5 freezes this as a public asset path. */
export const CARD_DIR = 'card/';

export type GlyphKey = 'weapon' | 'secondary' | 'armor' | 'item' | 'cons';

/** The mark a card with no image falls back to - one path per kind, off
 *  `PRINT_GLYPH` (app.js 3259-3266). */
export const PRINT_GLYPH: Record<GlyphKey, string> = {
  weapon:
    'M24 1 L29 12 V30 H19 V12 Z M9 32 H39 V36 H9 Z M21 36 H27 V44 H21 Z' +
    ' M24 41 A4 4 0 1 0 24 49 A4 4 0 1 0 24 41 Z',
  secondary: 'M24 3 L28 14 V25 H20 V14 Z M13 27 H35 V30 H13 Z M21 30 H27 V45 H21 Z',
  armor: 'M24 3 L42 10 V26 C42 36 34 43 24 47 C14 43 6 36 6 26 V10 Z',
  item: 'M24 2 L41 18 L24 48 L7 18 Z',
  cons: 'M18 4 H30 V14 L38 30 V42 A4 4 0 0 1 34 46 H14 A4 4 0 0 1 10 42 V30 L18 14 Z'
};

/** Which glyph a record with no image falls back to - off app.js 3374-3375. */
export function glyphKey(it: Record_): GlyphKey {
  return it.eq ? it.eq.t : it.kind === 'consumable' ? 'cons' : 'item';
}

/** The dice the layout has a shape for; any other die falls back to a plain
 *  hexagon clipped in CSS - off `DIE_ART` (app.js 3271). Named `DICE_WITH_ART`
 *  here, not `DIE_ART`: `dice.ts` already exports a `DIE_ART` for a different
 *  concept (the roll wheel's per-die SVG), and the two are unrelated maps
 *  that happened to share a name. */
export const DICE_WITH_ART = new Set(['d4', 'd6', 'd8', 'd10', 'd12', 'd20']);

/**
 * A vector's file name, off `cardArt` (app.js 3282-3291).
 *
 * In black and white a die loses the physical/magic split - colour was the
 * only difference between them - but the magic weapon's ribbon keeps its own
 * drawing, so only the die name collapses before `-bw` is appended.
 */
export function cardArt(name: string, bw: boolean): string {
  const collapsed = bw ? name.replace(/^(die-d\d+)-(phy|mag)$/, '$1') : name;
  return CARD_DIR + collapsed + (bw ? '-bw' : '') + '.svg';
}

/** A damage string split into its die and its bonus - off `dmgStripHTML`
 *  (app.js 3299) and `dieHTML` (3321). No match leaves the whole string as
 *  the "die" rather than inventing one. */
export function dmgParts(dmg: string | undefined): { die: string; bonus: string } {
  const m = /^(d\d+)(.*)$/.exec(dmg ?? '');
  return m ? { die: m[1] ?? '', bonus: m[2] ?? '' } : { die: dmg ?? '', bonus: '' };
}

/**
 * The deck cut into nine-up sheets, blanks counted for the last one - off
 * `renderPrint` (app.js 3514-3522). Empty input makes no sheets at all: there
 * is nothing to pad a page that does not exist.
 */
export function pages<T>(items: readonly T[]): { pages: T[][]; blanks: number } {
  if (!items.length) return { pages: [], blanks: 0 };
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += 9) out.push(items.slice(i, i + 9));
  return { pages: out, blanks: (9 - (items.length % 9)) % 9 };
}
