/* Which facet rows a plain table offers, and what each value is called.
 *
 * `lib/filters.ts` owns the frozen part - the group names and their order.
 * This module decides which values a row actually has and what to call them,
 * which is the caller's business per that file's own comment.
 *
 * `tier`, `frame` and `comm` each wrap a naming function another module
 * already has to have anyway (`voaSectionName` and `communityName` for the
 * roll modes, `frameName` for `srcLabel`) rather than inventing a second one:
 * `tblFacets`'s three branches in app.js are one line each for the same
 * reason.
 *
 * Pure module: no DOM, no data beyond what is handed in. */

import { kindOf, type Index } from './data.js';
import { groupsFor } from './filters.js';
import { FRAME_ORDER, frameName } from './frames.js';
import { communities, communityName, voaSectionName, VOA_SECTIONS } from './sections.js';
import type { Dict } from './dict.js';
import type { Kind, Lang, TableId } from './types.js';

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
function kindRow(index: Index, table: TableId, t: Dict): FacetRow | null {
  if (!groupsFor(table).includes('kind')) return null;
  const rows = index.rows.get(table) ?? [];
  const kinds = [...new Set(rows.map(kindOf))];
  if (kinds.length < 2) return null;
  const order: Kind[] = ['item', 'consumable', 'equip'];
  return {
    group: 'kind',
    label: t.kindF,
    values: order
      .filter((k) => kinds.includes(k))
      .map((k) => ({ value: k, label: t[KIND_LABEL[k]] }))
  };
}

/**
 * Every facet row a table offers, in the order `tblFacets` builds them in
 * app.js: `kind` first where it applies, then the table's own row.
 *
 * `frame` and `comm` list every frame and every community unconditionally,
 * not only the ones with rows left after the current pick - a facet offers
 * values, it does not narrow itself by what else is already narrowed.
 */
export function facetRows(index: Index, table: TableId, t: Dict, lang: Lang): FacetRow[] {
  const rows: FacetRow[] = [];
  const kind = kindRow(index, table, t);
  if (kind) rows.push(kind);

  if (table === 'voa') {
    rows.push({
      group: 'tier',
      label: t.tier,
      values: VOA_SECTIONS.map((k) => ({ value: String(k), label: voaSectionName(k, t) }))
    });
  } else if (table === 'frames') {
    rows.push({
      group: 'frame',
      label: t.frameF,
      values: FRAME_ORDER.map((id) => ({ value: id, label: frameName(id, lang) }))
    });
  } else if (table === 'community') {
    rows.push({
      group: 'comm',
      label: t.commF,
      values: communities(index).map((c) => ({ value: c.id, label: communityName(c, lang) }))
    });
  }

  return rows;
}
