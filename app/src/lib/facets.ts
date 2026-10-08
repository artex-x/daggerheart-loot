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
 * The signed-in author's own items add values at run time: the equipment `src` row
 * appends `hb` and each own source after the books, and the `homebrew` table offers
 * `kind` and `sect` over its own rows; its `src` is the source chip above the table
 * (docs/specs/ROUTES.md, "Values").
 *
 * A share link's filter is a third shape: `listFacetRows` offers only the values the
 * list's own entries answer, because a list is small and changes under its reader.
 *
 * Pure module: no DOM, no data beyond what is handed in. */

import { equipFacets, kindOf, listFacets, srcOf, type Index } from './data.js';
import { EQ_GROUPS, EQ_TABLE, groupsFor, LIST_GROUPS } from './filters.js';
import { FRAME_ORDER, frameName } from './frames.js';
import { isHomebrewRecord } from './homebrew.js';
import { srcName } from './label.js';
import { communities, communityName, voaSectionName, VOA_SECTIONS } from './sections.js';
import { EQ_BURDEN, EQ_CLS, EQ_LINE, EQ_RANGE, EQ_TRAIT, eqWord } from './i18n.js';
import type { Dict } from './dict.js';
import type { EquipKind, Kind, Lang, Record_, TableId } from './types.js';

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

/* The book sources in book order, the roll sections' order. */
const BOOK_SRC: readonly string[] = ['core', 'hnf', 'wondrous', 'dread', 'voa', 'dv', 'arazo'];

/* The equipment `src` row's candidates, off `EQ_SRC` in app.js: the books
   in book order, then the campaign frames. `motherboard` never survives the
   presence filter below - no equipment of any kind carries it - so it is
   never restated separately from `FRAME_ORDER`. */
const EQ_SRC: readonly string[] = [...BOOK_SRC, ...FRAME_ORDER];

/* A share link's `src` candidates: a list also holds community loot. */
const LIST_SRC: readonly string[] = [...BOOK_SRC, 'community', ...FRAME_ORDER];

/* A share link's `kind` values: the search page's two kind words, then the equipment
   tables' three tab words, because a list mixes the gear the tables split. */
const LIST_KIND: readonly (readonly [string, keyof Dict])[] = [
  ['item', 'fItems'],
  ['consumable', 'fCons'],
  ['weapon', 'subWeapon'],
  ['secondary', 'subSecondary'],
  ['armor', 'subArmor']
];

/* Every key of a word map, labelled in `lang`. */
const words = (map: Record<string, readonly [string, string]>, lang: Lang): FacetValue[] =>
  Object.keys(map).map((k) => ({ value: k, label: eqWord(map, k, lang) }));

/* The burden chips: `any` is no chip, it answers both. */
const burdenValues = (lang: Lang): FacetValue[] =>
  ['1', '2'].map((k) => ({ value: k, label: eqWord(EQ_BURDEN, k, lang) }));

const byLabel =
  (lang: Lang) =>
  (a: FacetValue, b: FacetValue): number =>
    a.label.localeCompare(b.label, lang);

/* The `src` values of own items: `hb` (no source) first, then each source by its name. */
function homebrewSrcValues(records: readonly Record_[], t: Dict, lang: Lang): FacetValue[] {
  const own = records.filter(isHomebrewRecord);
  const named = new Map<string, string>();
  for (const it of own) if (it.book) named.set(it.book.key, it.book[lang]);
  return [
    ...(own.some((it) => !it.book) ? [{ value: 'hb', label: t.srcHomebrew }] : []),
    ...[...named].map(([value, label]) => ({ value, label })).sort(byLabel(lang))
  ];
}

/* The `sect` values of the shown source's own items (`source`, or every own item when
   null), each labelled by the section's name: the row holds one source's sections. */
function homebrewSectValues(
  records: readonly Record_[],
  lang: Lang,
  source: string | null
): FacetValue[] {
  const named = new Map<string, string>();
  for (const it of records.filter(isHomebrewRecord)) {
    const s = it.book?.section;
    if (s && (source === null || srcOf(it) === source)) named.set(s.key, s[lang]);
  }
  return [...named].map(([value, label]) => ({ value, label })).sort(byLabel(lang));
}

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
      values: [
        ...['1', '2', '3', '4'].map((n) => ({ value: n, label: n })),
        /* Drawn, like a trait chip, only where a record of this kind answers it. */
        ...(index.allEquip.some((it) => it.eq?.t === kind && it.eq.tier === 'A')
          ? [{ value: 'A', label: t.voaArtifact }]
          : [])
      ]
    }),
    src: () => ({
      group: 'src',
      label: t.source,
      values: [
        ...EQ_SRC.filter((k) =>
          index.allEquip.some((it) => it.eq?.t === kind && srcOf(it) === k)
        ).map((k) => ({ value: k, label: srcName(k, lang) })),
        ...homebrewSrcValues(
          index.allEquip.filter((it) => it.eq?.t === kind),
          t,
          lang
        )
      ]
    }),
    /* The row filters the class on every weapon kind, secondary included. */
    cls: () => ({ group: 'cls', label: t.eqClass, values: words(EQ_CLS, lang) }),
    trait: () => ({
      group: 'trait',
      label: t.eqTrait,
      values: (Object.keys(EQ_TRAIT) as (keyof typeof EQ_TRAIT)[])
        /* A chip is drawn only for a trait some record of this kind answers:
           the Spellblade answers all six, so `spellcast` never gets one. */
        .filter((k) =>
          index.allEquip.some(
            (it) => it.eq?.t === kind && [equipFacets(it)['trait'] ?? ''].flat().includes(k)
          )
        )
        .map((k) => ({
          value: k,
          label: eqWord(EQ_TRAIT, k, lang)
        }))
    }),
    range: () => ({ group: 'range', label: t.eqRange, values: words(EQ_RANGE, lang) }),
    burden: () => ({ group: 'burden', label: t.eqBurden, values: burdenValues(lang) }),
    line: () => ({ group: 'line', label: t.eqLineF, values: words(EQ_LINE, lang) })
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
export function facetRows(
  index: Index,
  table: TableId,
  t: Dict,
  lang: Lang,
  hbSource: string | null = null
): FacetRow[] {
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
  } else if (table === 'homebrew') {
    const sect = homebrewSectValues(index.rows.get('homebrew') ?? [], lang, hbSource);
    if (sect.length) rows.push({ group: 'sect', label: t.hbSection, values: sect });
  }

  return rows;
}

/* Every row a share link's filter can draw, with every value it can take, in
   `LIST_GROUPS` order; `src` adds the own and frozen-copy sources of `records`. */
function listCandidates(records: readonly Record_[], t: Dict, lang: Lang): FacetRow[] {
  const rows: Record<string, Omit<FacetRow, 'group'>> = {
    kind: {
      label: t.kindF,
      values: LIST_KIND.map(([value, key]) => ({ value, label: t[key] }))
    },
    src: {
      label: t.source,
      values: [
        ...LIST_SRC.map((k) => ({ value: k, label: srcName(k, lang) })),
        ...homebrewSrcValues(records, t, lang)
      ]
    },
    tier: {
      label: t.tier,
      values: [
        ...['1', '2', '3', '4'].map((n) => ({ value: n, label: n })),
        { value: 'A', label: t.voaArtifact }
      ]
    },
    cls: { label: t.eqClass, values: words(EQ_CLS, lang) },
    trait: { label: t.eqTrait, values: words(EQ_TRAIT, lang) },
    range: { label: t.eqRange, values: words(EQ_RANGE, lang) },
    burden: { label: t.eqBurden, values: burdenValues(lang) },
    line: { label: t.eqLineF, values: words(EQ_LINE, lang) }
  };
  return LIST_GROUPS.flatMap((group) => {
    const row = rows[group];
    return row ? [{ group, ...row }] : [];
  });
}

/**
 * The facet rows of a share link's filter (docs/specs/FEATURES.md, "Lists"): of the
 * candidates, the values some record answers, and only the rows that can narrow - two
 * values or more, or one value some record lacks. A row never narrows by another
 * row's picks, as on a table.
 */
export function listFacetRows(records: readonly Record_[], t: Dict, lang: Lang): FacetRow[] {
  const answers = records.map((it) => listFacets(it));
  const has = (f: Record<string, string | readonly string[]>, g: string, v: string): boolean =>
    [f[g] ?? ''].flat().includes(v);
  return listCandidates(records, t, lang).flatMap((row) => {
    const values = row.values.filter((v) => answers.some((f) => has(f, row.group, v.value)));
    const [only] = values;
    const narrows =
      values.length > 1 ||
      (only !== undefined && answers.some((f) => !has(f, row.group, only.value)));
    return narrows ? [{ ...row, values }] : [];
  });
}
