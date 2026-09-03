/* The four campaign frames, and what each one is called.
 *
 * Unlike Vault of Ages or the communities, a frame has no roll table of its
 * own - `SECTIONS`/`TAB_LIST` never mention one - so there is no existing
 * naming function to reuse the way `sections.ts` is for the other two. The
 * order is a book-authored fact rather than something derived from the data:
 * `motherboard` holds a single row and would sort last by count, but it is
 * still the fourth campaign in the book, not the least of them.
 *
 * Pure module: no DOM, no data beyond what is handed in. */

import type { Lang } from './types.js';

/** The four campaigns, in the book's order. */
export const FRAME_ORDER = ['beast_feast', 'colossus', 'dark_heart', 'motherboard'] as const;

export type FrameId = (typeof FRAME_ORDER)[number];

const FRAME_LABEL: Record<Lang, Record<FrameId, string>> = {
  ru: {
    beast_feast: 'Пир зверей',
    colossus: 'Колоссы Сухоземья',
    dark_heart: 'Тёмное сердце Андалурии',
    motherboard: 'Материнская Плата'
  },
  en: {
    beast_feast: 'Beast Feast',
    colossus: 'Colossus of the Drylands',
    dark_heart: 'Dark Heart of Andaluria',
    motherboard: 'Motherboard'
  }
};

/** A frame's name, or the raw id where it names a frame nothing here knows. */
export function frameName(id: string, lang: Lang): string {
  return (FRAME_LABEL[lang] as Record<string, string>)[id] ?? id;
}
