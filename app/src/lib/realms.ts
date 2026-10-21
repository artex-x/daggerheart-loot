/* The four realms of Many Worlds Tavern, and what each one is called.
 *
 * Each realm is its own card set, so a record names its realm as a frame
 * record names its frame (`frames.ts`). The order is the release order of
 * the sets, a publisher fact rather than something derived from the data.
 *
 * Pure module: no DOM, no data beyond what is handed in. */

import type { Lang } from './types.js';

/** The four realms, in release order. */
export const REALM_ORDER = ['sporopolis', 'wagerwood', 'warrens', 'godsvale'] as const;

export type Realm = (typeof REALM_ORDER)[number];

const REALM_LABEL: Record<Lang, Record<Realm, string>> = {
  ru: {
    sporopolis: 'Спорополис',
    wagerwood: 'Лес Пари',
    warrens: 'Воюющие Норы',
    godsvale: 'Долина Богов'
  },
  en: {
    sporopolis: 'Sporopolis',
    wagerwood: 'Wagerwood',
    warrens: "Warrin' Warrens",
    godsvale: 'Godsvale'
  }
};

/** A realm's name, or the raw id where it names a realm nothing here knows. */
export function realmName(id: Realm, lang: Lang): string {
  return (REALM_LABEL[lang] as Record<string, string>)[id] ?? id;
}
