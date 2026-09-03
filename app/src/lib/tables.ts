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

/* Order matches the tabs above: rolling first, then browsing. Equipment and
   frames have no tab of their own - both are a slice through every book at
   once rather than a book - so they go last. */
export const TABLE_GROUPS: readonly TableGroup[] = [
  CORE_GROUP,
  { id: 'hnf', label: 'srcHnf', top: 'hnf_item', subs: ['hnf_item', 'hnf_consumable'] },
  { id: 'alt', label: 'alt', top: 'alt_item', subs: ['alt_item', 'alt_consumable'] },
  { id: 'wond', label: 'pageWondrous', top: 'wondrous', subs: ['wondrous'] },
  { id: 'dread', label: 'pageDread', top: 'dread', subs: ['dread'] },
  { id: 'voa', label: 'voa', top: 'voa', subs: ['voa'] },
  { id: 'comm', label: 'community', top: 'community', subs: ['community'] },
  {
    id: 'eq',
    label: 'grpEquipment',
    top: 'eq_weapon',
    subs: ['eq_weapon', 'eq_secondary', 'eq_armor']
  },
  { id: 'frames', label: 'grpFrames', top: 'frames', subs: ['frames'] }
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
  eq_armor: 'subArmor'
};

/** Which group a table belongs to. Falls back to the first group rather than
 *  throwing: a caller with an unknown id has bigger problems than this one. */
export function groupOf(table: TableId): TableGroup {
  return TABLE_GROUPS.find((g) => g.subs.includes(table)) ?? CORE_GROUP;
}

/**
 * The sub-chip caption for a table, falling back to the tab's own word for a
 * table that somehow has none - defensive rather than reachable: every sub of
 * every group with more than one table has an entry, which `tables.test.ts`
 * checks directly.
 */
export function subLabelOf(table: TableId): keyof Dict {
  return SUB_LABEL[table] ?? 'tables';
}
