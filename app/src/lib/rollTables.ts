/* Which table and which rows each roll section rolls over.
 *
 * Moved out of `App.svelte` on its second use: the app's panels and the read API's service
 * (`preview/api/service.mjs`) both take a roll's rows from `rowsOf`, so the pool the API
 * rolls over is the pool the app draws (docs/specs/FEATURES.md, "Rolling").
 *
 * Pure module: no DOM, no data. */

import type { Index } from './data.js';
import type { Dict } from './dict.js';
import {
  communityGroup,
  communityParts,
  sectionGroup,
  sectionParts,
  voaGroup,
  voaParts
} from './sections.js';
import type { Part } from './sections.js';
import type { Lang, Record_, Section } from './types.js';

/** The twelve sections that roll. */
export type RollSection = Extract<Section, `roll/${string}`>;

/** How a roll section rolls: `std` (Nd12 over two books), `alt` (two dice over a rarity),
 *  `table` (one number over a whole table) or `part` (one number inside a chosen part of a
 *  book). */
export type RollMode = 'std' | 'alt' | 'table' | 'part';

export const ROLL_MODES: Record<RollSection, RollMode> = {
  'roll/std': 'std',
  'roll/alt': 'alt',
  'roll/wondrous': 'table',
  'roll/dread': 'table',
  'roll/voa': 'part',
  'roll/dv': 'table',
  'roll/arazo': 'table',
  'roll/community': 'part',
  'roll/mwt': 'part',
  'roll/ph': 'table',
  'roll/lr': 'table',
  'roll/vh': 'table'
};

/* The sections that roll a single number over a whole table. Vault of Ages,
   Communities and Many Worlds Tavern roll one number too, but inside a part of their
   book, so `PICKER_ROLL` names the part and its rows for one shared panel. Core rules
   and the alternate tables roll several cards at once, and the alternate tables roll
   two dice, so both have panels of their own. */
export const ROLL_TABLE: Partial<Record<Section, { table: string }>> = {
  'roll/wondrous': { table: 'wondrous' },
  'roll/dread': { table: 'dread' },
  'roll/dv': { table: 'dv' },
  'roll/arazo': { table: 'arazo' },
  'roll/ph': { table: 'ph' },
  'roll/lr': { table: 'lr' },
  'roll/vh': { table: 'vh' }
};

export interface PickerRoll {
  section: 'voa' | 'community' | 'mwt';
  label: keyof Dict;
  parts: (t: Dict, lang: Lang, index: Index | null) => Part[];
  rows: (index: Index, id: string) => readonly Record_[];
}

export const PICKER_ROLL: Partial<Record<Section, PickerRoll>> = {
  'roll/voa': {
    section: 'voa',
    label: 'voaSection',
    parts: (t) => voaParts(t),
    rows: voaGroup
  },
  'roll/community': {
    section: 'community',
    label: 'communityLabel',
    parts: (_t, lang, index) => communityParts(index, lang),
    rows: communityGroup
  },
  'roll/mwt': {
    section: 'mwt',
    label: 'realmLabel',
    parts: (_t, lang) => sectionParts('mwt', lang),
    rows: (index, id) => sectionGroup(index, 'mwt', id)
  }
};

/** Returns the rows a roll section draws from, before the rungs of upgrade lines are left
 *  out (`rollPool`): a `table` section's whole table, a `part` section's rows of `part`,
 *  and none for `std` and `alt`, which roll over several tables at once. */
export function rowsOf(section: Section, index: Index, part?: string): readonly Record_[] {
  const cfg = ROLL_TABLE[section];
  if (cfg) return index.rows.get(cfg.table) ?? [];
  const picker = PICKER_ROLL[section];
  if (picker && part !== undefined) return picker.rows(index, part);
  return [];
}
