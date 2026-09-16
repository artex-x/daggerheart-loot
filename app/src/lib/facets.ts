/* Which facet rows a table offers, and what each value is called.
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
 * The equipment tables (`eq_weapon`, `eq_secondary`, `eq_armor`) are a second
 * shape, not a plain table's fourth branch: they hold every piece of gear in
 * the catalogue, not one book's rows, and their groups come from `EQ_GROUPS`
 * rather than `PLAIN_GROUPS`. `facetRows` dispatches to `eqFacetRows` for
 * those three and keeps the plain branches below for everything else.
 *
 * Pure module: no DOM, no data beyond what is handed in. */

import { kindOf, srcOf, type Index } from './data.js';
import { EQ_GROUPS, EQ_TABLE, groupsFor } from './filters.js';
import { FRAME_ORDER, frameName } from './frames.js';
import { srcName } from './label.js';
import { communities, communityName, voaSectionName, VOA_SECTIONS } from './sections.js';
import { EQ_BURDEN, EQ_CLS, EQ_LINE, EQ_RANGE, EQ_TRAIT, eqWord } from './i18n.js';
import type { Dict } from './dict.js';
import type { EquipKind, Kind, Lang, TableId } from './types.js';

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

/* The equipment `src` row's candidates, off `EQ_SRC` in app.js: the five books
   in book order, then the campaign frames. `motherboard` never survives the
   presence filter below - no equipment of any kind carries it - so it is
   never restated separately from `FRAME_ORDER`. */
const EQ_SRC: readonly string[] = ['core', 'hnf', 'wondrous', 'dread', 'voa', ...FRAME_ORDER];

/**
 * The equipment tables' facet rows, off `eqFacets` in app.js. Walks
 * `EQ_GROUPS[kind]` rather than restating its order, which is what keeps the
 * panel, the address and the frozen grammar from drifting apart.
 */
export function eqFacetRows(index: Index, kind: EquipKind, t: Dict, lang: Lang): FacetRow[] {
  const build: Record<string, () => FacetRow> = {
    tier: () => ({
      group: 'tier',
      label: t.tier,
      values: ['1', '2', '3', '4'].map((n) => ({ value: n, label: n }))
    }),
    src: () => ({
      group: 'src',
      label: t.source,
      values: EQ_SRC.filter((k) =>
        index.allEquip.some((it) => it.eq?.t === kind && srcOf(it) === k)
      ).map((k) => ({ value: k, label: srcName(k, lang) }))
    }),
    /* Weapons print the material ("Class"); secondary weapons have none, so
       the same row's label and values become the damage type instead - the
       one live app reuses the row rather than adding a fourth. */
    cls: () => ({
      group: 'cls',
      label: kind === 'secondary' ? t.eqDmg : t.eqClass,
      values: (Object.keys(EQ_CLS) as (keyof typeof EQ_CLS)[]).map((k) => ({
        value: k,
        label: eqWord(EQ_CLS, k, lang)
      }))
    }),
    trait: () => ({
      group: 'trait',
      label: t.eqTrait,
      values: (Object.keys(EQ_TRAIT) as (keyof typeof EQ_TRAIT)[]).map((k) => ({
        value: k,
        label: eqWord(EQ_TRAIT, k, lang)
      }))
    }),
    range: () => ({
      group: 'range',
      label: t.eqRange,
      values: (Object.keys(EQ_RANGE) as (keyof typeof EQ_RANGE)[]).map((k) => ({
        value: k,
        label: eqWord(EQ_RANGE, k, lang)
      }))
    }),
    burden: () => ({
      group: 'burden',
      label: t.eqBurden,
      values: ['1', '2'].map((k) => ({ value: k, label: eqWord(EQ_BURDEN, k, lang) }))
    }),
    line: () => ({
      group: 'line',
      label: t.eqLineF,
      values: Object.keys(EQ_LINE).map((k) => ({
        value: k,
        label: eqWord(EQ_LINE, k, lang)
      }))
    })
  };

  return EQ_GROUPS[kind].map((g) => {
    const row = build[g];
    if (!row) throw new Error(`eqFacetRows: no builder for group "${g}"`);
    return row();
  });
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
  const eqKind = EQ_TABLE[table];
  if (eqKind) return eqFacetRows(index, eqKind, t, lang);

  const rows: FacetRow[] = [];
  const kind = kindRow(index, table, t);
  if (kind) rows.push(kind);

  if (table === 'voa') {
    rows.push({
      group: 'tier',
      label: t.tier,
      values: VOA_SECTIONS.map((k) => ({ value: String(k), label: voaSectionName(k, t) }))
    });
  } else if (table === 'other_frames') {
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
