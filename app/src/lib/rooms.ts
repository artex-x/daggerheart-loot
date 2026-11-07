/* The rooms of Escape the Veiled Halls that print a loot table, and what each one is called.
 *
 * Each room rolls its own table, so a record names its room as a Many Worlds Tavern record
 * names its realm (`realms.ts`). The order is the adventure's.
 *
 * Pure module: no DOM, no data beyond what is handed in, no runtime import, so the
 * generators under `tools/` can require it. */

import type { Lang } from './types.js';

/** The rooms, in the adventure's order. */
export const ROOM_ORDER = ['basement', 'dressing', 'laboratory', 'library'] as const;

export type Room = (typeof ROOM_ORDER)[number];

const ROOM_LABEL: Record<Lang, Record<Room, string>> = {
  ru: {
    basement: 'Подвал',
    dressing: 'Гардеробная',
    laboratory: 'Лаборатория',
    library: 'Библиотека'
  },
  en: {
    basement: 'The Basement',
    dressing: 'The Dressing Room',
    laboratory: 'The Laboratory',
    library: 'The Library'
  }
};

/** A room's name, or the raw id where it names a room nothing here knows. */
export function roomName(id: string, lang: Lang): string {
  return (ROOM_LABEL[lang] as Record<string, string>)[id] ?? id;
}
