/* A record's description, parsed once.
 *
 * The source is the formatted-text subset of `markup.ts` (docs/specs/FEATURES.md,
 * "Records", "Formatted text"). The card, the row and print render the block
 * tree with Svelte elements, so nothing in the app injects HTML into the page;
 * `descHtml` builds the flat string the clipboard takes. */

import type { Lang, Record_ } from './types.js';
import { descOf } from './i18n.js';
import { ART_BASE, isOwnArt, thumbOf } from './art.js';
import { markupHtml, parseMarkup, type MarkupBlock } from './markup.js';

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Returns the description in the language on screen as blocks; an empty one is one empty paragraph. */
export function descBlocks(it: Record_, lang: Lang): MarkupBlock[] {
  return parseMarkup(descOf(it, lang) || '');
}

/** Returns the description flattened for the clipboard: list items marked with a bullet. */
export function descHtml(it: Record_, lang: Lang): string {
  return markupHtml(descOf(it, lang) || '');
}

/** The placeholder a record with no art, or with art that failed, falls back to. */
const NO_ART = '_none.webp';

/**
 * Where a record's picture lives.
 *
 * A record with no art and one whose file is missing get the same placeholder,
 * so the layout does not shift when one turns into the other. Row-sized sites
 * ask for `'thumb'`, the 160 px derivative (`docs/specs/FEATURES.md`, "Records").
 * An own picture of a homebrew item is the bucket's file, its `t/` copy for a thumb;
 * a `blob:` address (the editor's unsaved crop) passes through at both sizes.
 */
export function artSrc(
  img: string | undefined,
  broken = false,
  size: 'full' | 'thumb' = 'full'
): string {
  if (img && !broken) {
    if (img.startsWith('blob:')) return img;
    if (isOwnArt(img)) return ART_BASE + (size === 'thumb' ? thumbOf(img) : img);
  }
  return (size === 'thumb' ? 'img/thumb/' : 'img/') + (img && !broken ? img : NO_ART);
}
