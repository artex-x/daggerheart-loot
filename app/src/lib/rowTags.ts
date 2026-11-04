/* Which tags a catalog row hides: the ones that repeat what the page already says
 * (docs/specs/FEATURES.md, "Tables and search"). The one place of this rule.
 *
 * Pure module: no DOM, no data. */

import { groupsFor, type FilterState } from './filters.js';
import type { TableId } from './types.js';

export interface HiddenTags {
  /** The kind tag: the table holds one kind, or the filter picks one. */
  kind: boolean;
  /** The tier in the stat line and the tier tag: a tier heading or one tier picked. */
  tier: boolean;
  /** Every source tag: the table holds one book, or the filter picks one. */
  src: boolean;
}

/* The tables that draw rows from more than one book. */
const MANY_BOOKS: readonly TableId[] = [
  'eq_weapon',
  'eq_secondary',
  'eq_armor',
  'other_starting',
  'alt_item',
  'alt_consumable'
];

/** Returns the tags a row of `table` hides under `filter`; `underTier` is a tier heading. */
export function hiddenTags(
  table: TableId,
  filter: FilterState,
  underTier: boolean
): HiddenTags {
  const kinds = filter['kind'] ?? [];
  const tiers = filter['tier'] ?? [];
  const srcs = filter['src'] ?? [];
  return {
    kind: !groupsFor(table).includes('kind') || (kinds.length === 1 && kinds[0] !== 'equip'),
    tier: underTier || tiers.length === 1,
    src: !MANY_BOOKS.includes(table) || srcs.length === 1
  };
}
