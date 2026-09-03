/* Which facet rows a plain table offers, and what each value is called.
 *
 * `lib/filters.ts` owns the frozen part - the group names and their order.
 * This module decides which values a row actually has and what to call them,
 * which is the caller's business per that file's own comment.
 *
 * Only the `kind` row exists yet: it is the only one any table B2 draws has.
 * `tier`, `frame` and `comm` are B3's, and an untested row here would be worse
 * than a missing one.
 *
 * Pure module: no DOM, no data beyond what is handed in. */

import { kindOf, type Index } from './data.js';
import { groupsFor } from './filters.js';
import type { Dict } from './dict.js';
import type { Kind, TableId } from './types.js';

export interface FacetValue {
  value: string;
  label: string;
}

export interface FacetRow {
  group: string;
  label: string;
  values: FacetValue[];
}

/* Order matches `KINDS` in style, and t().fItems / fCons / fEquip in app.js. */
const KIND_LABEL: Record<Kind, keyof Dict> = {
  item: 'fItems',
  consumable: 'fCons',
  equip: 'fEquip'
};

/**
 * The `kind` row for a plain table - only where the table actually mixes more
 * than one kind. `core_item` and `core_consumable` hold one kind each, so the
 * kind *is* the table and there is nothing to narrow.
 */
export function facetRows(index: Index, table: TableId, t: Dict): FacetRow[] {
  if (!groupsFor(table).includes('kind')) return [];
  const rows = index.rows.get(table) ?? [];
  const kinds = [...new Set(rows.map(kindOf))];
  if (kinds.length < 2) return [];
  const order: Kind[] = ['item', 'consumable', 'equip'];
  return [
    {
      group: 'kind',
      label: t.kindF,
      values: order
        .filter((k) => kinds.includes(k))
        .map((k) => ({ value: k, label: t[KIND_LABEL[k]] }))
    }
  ];
}
