/* The print sheet's own small helpers, off `git show 23c00a6^:app.js`,
 * 3520-3522.
 *
 * Everything a card draws that is not text is a vector exported into `card/`
 * by the live app's author, not redrawn here - CLAUDE.md's "Export vectors;
 * do not redraw them." This module names which file an unfolded vector is
 * (`cardVectors.ts` holds the folded ones), the editor preview's scale, how the
 * deck of cards is cut into nine- or sixteen-up sheets, and a card's set line.
 *
 * Pure module: no DOM, no `S.printBW` - `bw` arrives as an argument. */

import { setBonusOf, setKeyOf, setOf, type Index } from './data.js';
import { dict } from './dict.js';
import { EQ_TRAIT, eqWord } from './i18n.js';
import { FOLD_OWN, relText, setFolds } from './label.js';
import type { Lang, Record_, Trait } from './types.js';

/** Where the exported vectors live, junctioned into `dist/` alongside `img/`
 *  and `og/` - CONTRACTS.md section 5 freezes this as a public asset path. */
export const CARD_DIR = '/card/';

/** Cards on the opt-in compact sheet: 4x4 of 44x63 mm - FEATURES.md, "Print". */
export const COMPACT_PER_SHEET = 16;

/** The editor's print card follows the typed text this long after the last change:
 *  one `fit()` per pause instead of one per key on a 3000-character card. */
export const PREVIEW_FIT_MS = 150;

/** A printed cell's width in CSS px (96 per inch): 63 mm, and 44 mm on the compact sheet. */
export const PRINTED_PX = { std: 238.11, compact: 166.3 } as const;

/** The editor's print card is drawn at the preview column's width, at most this wide. */
export const PREVIEW_MAX_PX = 420;

/**
 * The scale the editor draws the print card at: the column's width, at most
 * `PREVIEW_MAX_PX`, over the printed width, cut to two decimals so the cell never
 * passes the column. 1 before the column has a width.
 */
export function previewScale(width: number, compact: boolean): number {
  if (!(width > 0)) return 1;
  const printed = compact ? PRINTED_PX.compact : PRINTED_PX.std;
  return Math.floor((Math.min(width, PREVIEW_MAX_PX) / printed) * 100) / 100;
}

/** The A4 sheet's width in CSS px (210 mm at 96 px per inch). */
export const SHEET_PX = (210 * 96) / 25.4;

/**
 * The screen scale of the print sheet: the column's width over the A4 width, cut to
 * three decimals so the sheet never passes the column. 1 when the column holds the
 * sheet, and before the column has a width.
 */
export function sheetScale(width: number): number {
  if (!(width > 0) || width >= SHEET_PX) return 1;
  return Math.floor((width / SHEET_PX) * 1000) / 1000;
}

/**
 * A vector's file name, off `cardArt` (`git show 23c00a6^:app.js`), for the pairs whose two files
 * differ in shape (`shield`, `burden-1`, `burden-2`): they stay two files drawn by `<img>`.
 * The folded vectors are drawn inline by `CardVector.svelte`.
 */
export function cardArt(name: string, bw: boolean): string {
  return CARD_DIR + name + (bw ? '-bw' : '') + '.svg';
}

/** A damage string split into its die and its bonus - off `dmgStripHTML` and `dieHTML`
 *  (`git show 23c00a6^:app.js`). No match leaves the whole string as
 *  the "die" rather than inventing one. */
export function dmgParts(dmg: string | undefined): { die: string; bonus: string } {
  const m = /^(d\d+)(.*)$/.exec(dmg ?? '');
  return m ? { die: m[1] ?? '', bonus: m[2] ?? '' } : { die: dmg ?? '', bonus: '' };
}

/**
 * The deck cut into sheets of `per` cards, blanks counted for the last one -
 * off `renderPrint` (`git show 23c00a6^:app.js`). Empty input makes no sheets at all:
 * there is nothing to pad a page that does not exist.
 */
export function pages<T>(items: readonly T[], per = 9): { pages: T[][]; blanks: number } {
  if (!items.length) return { pages: [], blanks: 0 };
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += per) out.push(items.slice(i, i + per));
  return { pages: out, blanks: (per - (items.length % per)) % per };
}

/* The full «Характеристика Заклинателя» is 92 px against a 59 px trait cell at
   the 2.2cqw floor (measured 2026-09-23 on this host), so the card abbreviates. */
const SHORT_TRAIT: Partial<Record<Trait, readonly [string, string]>> = {
  spellcast: ['Хар. Заклинателя', 'Spellcast']
};

/** The trait word the print card's trait cell draws: a short form where the
 *  full one does not fit, else the stat line's own word. */
export function printTrait(tr: Trait | undefined, lang: Lang): string {
  const short = tr ? SHORT_TRAIT[tr] : undefined;
  return short ? short[lang === 'ru' ? 0 : 1] : eqWord(EQ_TRAIT, tr, lang);
}

/** A set's shared bonus as a card's last text line. The card prints the name in bold
 *  italic and `members` in italics: ` (<Комплект>: <names>)`, folded as the card folds
 *  them, so a card read alone still says the bonus needs the others; a frozen copy
 *  with no other member names none (`''`). */
export function setLineOf(
  index: Index,
  it: Record_,
  lang: Lang
): { name: string; members: string; body: string } | undefined {
  const bonus = setBonusOf(index, it);
  if (!bonus) return undefined;
  const ru = lang === 'ru';
  const name = ru ? bonus.ru : bonus.en;
  const members = setOf(index, it);
  return {
    name,
    members: members.length
      ? ` (${dict(lang).setLabel}: ${relText(members, lang, FOLD_OWN, it.id, setFolds(setKeyOf(index, it)))})`
      : '',
    body: ru ? bonus.rud : bonus.ende
  };
}
