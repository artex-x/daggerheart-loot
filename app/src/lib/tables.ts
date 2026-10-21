/* The two-level table navigation, off `TABLE_GROUPS` and `SUB_LABEL` in app.js
 * (around line 2410).
 *
 * Fourteen chips in one row used to occupy half a phone screen and pushed the
 * first entry below the fold. The live app split them in two: a top row for
 * the book, a second row for what is inside it - and the second row only
 * appears where a book actually has more than one table.
 *
 * Table addresses do not change: `#/tables/core_item` is still a table, not a
 * pair of "book + section". This is a pure grouping of the same ids, nothing
 * about routing.
 *
 * The last group, `hb`, is the signed-in author's own items: `TablesPage` draws its
 * chip only signed in.
 *
 * Pure module: no DOM, no data. */

import type { TableId } from './types.js';
import type { Dict } from './dict.js';

export interface TableGroup {
  /** Stable identity for "which top chip is on" - not part of any address. */
  id: string;
  /** The dict key the top chip reads its caption from. */
  label: keyof Dict;
  /** What the top chip itself links to - `subs[0]`, named rather than indexed
   *  so a caller never has to ask an array whether it has a first element. */
  top: TableId;
  subs: readonly TableId[];
}

/**
 * The book a bare `#/tables` opens on - `S.tables.t`'s default in app.js. Named
 * rather than reached by indexing `TABLE_GROUPS[0]`, so `groupOf`'s fallback
 * needs no assertion that the array it just built is non-empty.
 */
const CORE_GROUP: TableGroup = {
  id: 'core',
  label: 'srcCore',
  top: 'core_item',
  subs: ['core_item', 'core_consumable']
};

/* The record path words, in path-word order: `whereFrom` and
   `tools/share-card.mjs` `PATH_TEXT` read these groups, so an existing entry
   never changes. The tables page draws `TABLE_NAV` below, in its own order.
   Equipment is a slice through every book at once rather than a book, while
   Other groups starting inventory and campaign-frame equipment, neither of
   which is rollable content from a book. */
export const TABLE_GROUPS: readonly TableGroup[] = [
  CORE_GROUP,
  { id: 'hnf', label: 'srcHnf', top: 'hnf_item', subs: ['hnf_item', 'hnf_consumable'] },
  { id: 'alt', label: 'alt', top: 'alt_item', subs: ['alt_item', 'alt_consumable'] },
  { id: 'wond', label: 'pageWondrous', top: 'wondrous', subs: ['wondrous'] },
  { id: 'dread', label: 'pageDread', top: 'dread', subs: ['dread'] },
  { id: 'voa', label: 'voa', top: 'voa', subs: ['voa'] },
  { id: 'dv', label: 'dv', top: 'dv', subs: ['dv'] },
  { id: 'arazo', label: 'arazo', top: 'arazo', subs: ['arazo'] },
  { id: 'comm', label: 'community', top: 'community', subs: ['community'] },
  { id: 'mwt', label: 'mwt', top: 'mwt', subs: ['mwt'] },
  {
    id: 'eq',
    label: 'grpEquipment',
    top: 'eq_weapon',
    subs: ['eq_weapon', 'eq_secondary', 'eq_armor']
  },
  {
    id: 'other',
    label: 'grpOther',
    top: 'other_starting',
    subs: ['other_starting', 'other_frames']
  },
  { id: 'hb', label: 'srcHomebrew', top: 'homebrew', subs: ['homebrew'] }
];

/**
 * The caption a sub-chip carries: shorter than the table's own name, because
 * the group heading above it already names the book. "Предметы" under "Core",
 * not "Core - предметы".
 */
export const SUB_LABEL: Partial<Record<TableId, keyof Dict>> = {
  core_item: 'fItems',
  core_consumable: 'fCons',
  hnf_item: 'fItems',
  hnf_consumable: 'fCons',
  alt_item: 'fItems',
  alt_consumable: 'fCons',
  eq_weapon: 'subWeapon',
  eq_secondary: 'subSecondary',
  eq_armor: 'subArmor',
  other_starting: 'subStarting',
  other_frames: 'subFrames'
};

/** Which group a table belongs to. Falls back to the first group rather than
 *  throwing: a caller with an unknown id has bigger problems than this one. */
export function groupOf(table: TableId): TableGroup {
  return TABLE_GROUPS.find((g) => g.subs.includes(table)) ?? CORE_GROUP;
}

/* The groups the tables page draws, a second layer over `TABLE_GROUPS`. The seven
   supplement books share one chip, as their roll sections share one header tab
   (`nav.ts`), and their own names move to the second row. `TABLE_GROUPS` and
   `SUB_LABEL` stay the record path words: `whereFrom`, and through it every
   stub under `i/`, reads them. */
const SUPP_GROUP: TableGroup = {
  id: 'supp',
  label: 'grpSupplements',
  top: 'wondrous',
  subs: ['wondrous', 'dread', 'voa', 'dv', 'arazo', 'community', 'mwt']
};

/** The tables page's group chips, in order. Each `TableId` sits in one group. */
export const TABLE_NAV: readonly TableGroup[] = [
  ...TABLE_GROUPS.filter((g) => ['core', 'hnf', 'alt'].includes(g.id)),
  SUPP_GROUP,
  ...TABLE_GROUPS.filter((g) => ['eq', 'other', 'hb'].includes(g.id))
];

/** Returns the tables page's group chip for a table. Falls back to Core, as `groupOf` does. */
export function navGroupOf(table: TableId): TableGroup {
  return TABLE_NAV.find((g) => g.subs.includes(table)) ?? CORE_GROUP;
}

/** Returns a second-row chip's caption: the `SUB_LABEL` word, or else the book's own name. */
export function navSubLabel(table: TableId): keyof Dict {
  return SUB_LABEL[table] ?? groupOf(table).label;
}
