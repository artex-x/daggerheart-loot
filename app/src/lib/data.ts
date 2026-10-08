/* The dataset, indexed.
 *
 * Everything here is derived, never stored: the reverse craft link, the rarity
 * of a loot record, the list of everything that has a stat block. Deriving them
 * is what stops the two halves of a pair from drifting apart, which is the same
 * reason `craft` is written in one direction only.
 *
 * Pure module: it is handed the data and returns an index. Where the data comes
 * from is somebody else's problem - it arrives as a script that assigns a
 * global, and that adapter lives outside this module (docs/specs/CONTRACTS.md,
 * section 4). */

import { isHomebrewRecord } from './homebrew.js';
import type { Rarity } from './money.js';
import { CHARACTER_TRAITS } from './types.js';
import type { EquipKind, Record_, RefCard, SetCard } from './types.js';

/** The shape of `window.LOOT`. */
export interface Loot {
  items: Record<string, Record_[]>;
  eq?: Record_[];
  refs?: Record<string, RefCard>;
  sets?: Record<string, SetCard>;
  alt?: Partial<Record<'item' | 'consumable', Partial<Record<Rarity, AltColumns>>>>;
}

interface AltColumns {
  hope: string[];
  fear: string[];
}

/** Which column of an alternate table a row came out of. */
export type AltCol = 'hope' | 'fear';

/** The two kinds the alternate tables are split into. Nothing there is gear. */
export type AltKind = 'item' | 'consumable';

export interface Index {
  /** Every record by id: loot and equipment together, one lookup for both. */
  byId: ReadonlyMap<string, Record_>;
  /** Table records, in the order their source tables print them. */
  all: readonly Record_[];
  /**
   * The source tables, each in its own order.
   *
   * `all` flattens them, which is right for search and wrong for a roll: a roll
   * is a number within one roll pool. Campaign frames are source tables, not
   * roll pools. The key `homebrew` holds the signed-in author's own items
   * (`withRecords`), never a catalog record.
   */
  rows: ReadonlyMap<string, readonly Record_[]>;
  /** Loot and equipment - what search covers. */
  searchable: readonly Record_[];
  /** Everything with a stat block, wherever it lives. */
  allEquip: readonly Record_[];
  /** `id of an upgrade` -> the records made into it, in `[...eq, ...all]`
   *  order. The reverse of `craft`. */
  craftedFrom: ReadonlyMap<string, readonly Record_[]>;
  /** `id of a record` -> the records whose `craft_from` names it, in the order they
   *  joined. The reverse of `craft_from`, which only a homebrew item writes. */
  craftedInto: ReadonlyMap<string, readonly Record_[]>;
  /**
   * A set's key -> its members, in `[...eq, ...all]` order - the same source
   * list `allEquip` is built from, so a set's members read in the order the
   * equipment tables already use. Derived rather than stored, the way
   * `craftedFrom` is: a record names its own set, and nothing keeps a sibling
   * list that could drift from it.
   */
  setMembers: ReadonlyMap<string, readonly Record_[]>;
  /** A loot record's rarity, where the alternate tables give it one. */
  rarityOf: (id: string) => Rarity | undefined;
  /**
   * One row of an alternate table, by the face the die showed.
   *
   * A column is a table of its own - twelve rows, one per face - so a roll is
   * a lookup rather than a search. Undefined where a column is shorter than
   * the face, which the caller drops rather than drawing as a gap.
   */
  altRow: (kind: AltKind, rarity: Rarity, col: AltCol, n: number) => Record_ | undefined;
  /**
   * A whole column of an alternate table, for the `#/tables/alt_*` listing
   * rather than a single die-face lookup. `n` is the face that found each
   * record - the alternate tables' own numbering, not the record's `roll` in
   * whatever table it is also printed in - so the tables page can show it
   * without borrowing a number that belongs to a different book.
   */
  altColumn: (kind: AltKind, rarity: Rarity, col: AltCol) => { it: Record_; n: number }[];
  /** Referenced rulebook cards, by the key a record names in `refs`. */
  refs: Record<string, RefCard>;
  /** A set's shared bonus by set key. */
  sets: Record<string, SetCard>;
  /** A catalog record's set from the signed-in account's own set card that names it in
   *  `items`, by record id; empty for any other reader. */
  ownSetOf: ReadonlyMap<string, string>;
  /** A catalog record's rule cards from the signed-in account's own cards that name it in
   *  `items`, by record id, in key order; empty for any other reader. */
  ownRefsOf: ReadonlyMap<string, readonly string[]>;
}

export function buildIndex(loot: Loot): Index {
  const byId = new Map<string, Record_>();

  const all: Record_[] = [];
  const rows = new Map<string, readonly Record_[]>();
  for (const key of Object.keys(loot.items)) {
    const table = loot.items[key] ?? [];
    rows.set(key, table);
    for (const it of table) {
      all.push(it);
      byId.set(it.id, it);
    }
  }
  /* Weapons and armour are not loot rolled off a table: they have stats, so
     they are stored apart and carry an `eq` block instead of a roll number. */
  const eq = loot.eq ?? [];
  for (const it of eq) byId.set(it.id, it);

  /* Equipment is not only in `eq`. Eleven Wondrous records, every campaign
     frame entry, and some of Vault of Ages and Dread carry the same block
     while also keeping their place in `rows` - a roll table for most of
     them, though a campaign frame entry has no roll number of its own (see
     the `rows` doc comment above) - one record showing up in both places
     rather than a copy in each.

     `eq` comes first, so `core_item`'s weapons open every equipment table,
     ahead of the campaign frames' own; armour has no `roll` to sort by, so
     the table's whole order comes from this concat. */
  const allEquip = [...eq, ...all].filter((it) => it.eq);

  /* Only one direction is stored. Deriving the other means the two halves
     cannot disagree, and a link to a record that does not exist is simply not
     made.

     Sets are grouped from the same concatenation `allEquip` filters down from,
     before that filter runs - a set is not only ever equipment, even though
     every member today happens to be. */
  const { craftedFrom, craftedInto, setMembers } = relate(
    { craftedFrom: new Map(), craftedInto: new Map(), setMembers: new Map() },
    [...eq, ...all],
    byId
  );

  /* The alternate tables are the only place a loot record's rarity is written
     down, so the index is those tables read backwards. Records outside them -
     Wondrous, Dread, community - have none, and the caller decides what to do
     about that. */
  const rarity = new Map<string, Rarity>();
  /* The same pass resolves each column to records, so a roll on those tables
     is a lookup by die face rather than a walk over the ids. */
  const altCols = new Map<string, readonly (Record_ | undefined)[]>();
  for (const kind of Object.keys(loot.alt ?? {}) as AltKind[]) {
    const byRarity = loot.alt?.[kind] ?? {};
    for (const r of Object.keys(byRarity) as Rarity[]) {
      const cols = byRarity[r];
      if (!cols) continue;
      for (const id of [...cols.hope, ...cols.fear]) rarity.set(id, r);
      /* An id nothing answers to leaves a hole rather than closing the gap:
         the face is the position, so dropping one would move every row under
         it onto the wrong number. */
      for (const col of ['hope', 'fear'] as AltCol[]) {
        altCols.set(
          `${kind}/${r}/${col}`,
          cols[col].map((id) => byId.get(id))
        );
      }
    }
  }

  return {
    byId,
    all,
    rows,
    searchable: [...all, ...eq],
    allEquip,
    craftedFrom,
    craftedInto,
    setMembers,
    rarityOf: (id) => rarity.get(id),
    altRow: (kind, r, col, n) => altCols.get(`${kind}/${r}/${col}`)?.[n - 1],
    altColumn: (kind, r, col) => {
      const out: { it: Record_; n: number }[] = [];
      (altCols.get(`${kind}/${r}/${col}`) ?? []).forEach((it, i) => {
        if (it) out.push({ it, n: i + 1 });
      });
      return out;
    },
    refs: loot.refs ?? {},
    sets: loot.sets ?? {},
    ownSetOf: new Map(),
    ownRefsOf: new Map()
  };
}

/** The Other table's browse-only pool. It deliberately leaves canonical rows
 * untouched, so neither source collection is counted twice by search or rolls. */
export function otherTableRows(
  index: Index,
  table: 'other_starting' | 'other_frames'
): readonly Record_[] {
  const starting = index.rows.get('starting') ?? [];
  return table === 'other_starting'
    ? starting.filter((it) => !it.frame)
    : [...(index.rows.get('frames') ?? []), ...starting.filter((it) => !!it.frame)];
}

/** What a record counts as when filtering by kind. */
export function kindOf(it: Record_): 'item' | 'consumable' | 'equip' {
  return it.eq ? 'equip' : it.kind === 'consumable' ? 'consumable' : 'item';
}

/**
 * Which source a record is filtered under.
 *
 * Campaign frames stand in the filter by name rather than as one "Frame": they
 * are three different campaigns, and equipment from each hangs on its own
 * premise. At a table running Beast Feast the other two are noise, and one
 * value cannot say that - it would be all ninety-odd or none.
 */
export function srcOf(it: Record_): string {
  if (isHomebrewRecord(it)) return it.book?.key ?? 'hb';
  return it.src === 'frame' ? (it.frame ?? it.src) : it.src;
}

/** The facet values a record answers with, for the equipment tables. Burden
 *  answers two values at once for `'any'`: the record fits under either
 *  chip, because the book prints it both ways. A `spellcast` weapon answers
 *  all six traits. */
export function equipFacets(it: Record_): Record<string, string | readonly string[]> {
  const e = it.eq;
  if (!e) return {};
  return {
    tier: String(e.tier),
    src: srcOf(it),
    line: e.line ? 'line' : 'uniq',
    cls: e.cls ?? '',
    trait: e.tr === 'spellcast' ? CHARACTER_TRAITS : (e.tr ?? ''),
    range: e.rg ?? '',
    burden: e.bu == null ? '' : e.bu === 'any' ? ['1', '2'] : String(e.bu)
  };
}

/** The facet values a record answers with, on a share link (`LIST_GROUPS`): the
 *  equipment facets, then `kind` - the gear's own kind where a table says `equip` -
 *  and `src`, which every record answers. */
export function listFacets(it: Record_): Record<string, string | readonly string[]> {
  return { ...equipFacets(it), kind: it.eq?.t ?? kindOf(it), src: srcOf(it) };
}

/** The facet values a record answers with, on the plain tables. */
export function plainFacets(it: Record_): Record<string, string> {
  return {
    kind: kindOf(it),
    tier: it.tier == null ? '' : String(it.tier),
    frame: it.frame ?? '',
    comm: it.community ?? '',
    src: srcOf(it),
    sect: isHomebrewRecord(it) ? (it.book?.section?.key ?? '') : ''
  };
}

/* Tier order; an artifact sorts last. */
const byTier = (a: Record_, b: Record_): number => {
  const rank = (x: Record_): number => {
    const tier = x.eq?.tier ?? 0;
    return tier === 'A' ? 5 : tier;
  };
  return rank(a) - rank(b);
};

/** Every piece in one upgrade line, in tier order, the record itself included when the
 *  index lacks it (a frozen copy); an artifact sorts last. */
export function upgradeLine(index: Index, it: Record_): Record_[] {
  const line = it.eq?.line;
  if (!line) return [];
  const members = lineMembers(index, line);
  return members.some((r) => r.id === it.id) ? members : [...members, it].sort(byTier);
}

/** Every piece of the upgrade line `line`, in tier order; an artifact sorts last. */
export function lineMembers(index: Index, line: string): Record_[] {
  return index.allEquip.filter((x) => x.eq?.line === line).sort(byTier);
}

export function equipOfKind(index: Index, kind: EquipKind): Record_[] {
  return index.allEquip.filter((it) => it.eq?.t === kind);
}

/* A `data.js` cached from before `craft` became a list still holds one id
   string (docs/specs/CONTRACTS.md, section 4), so the reader takes both. */
function craftIds(it: Record_): readonly string[] {
  const craft: unknown = it.craft;
  if (Array.isArray(craft)) return craft as readonly string[];
  return typeof craft === 'string' ? [craft] : [];
}

/* Only a homebrew item writes `craft_from`. */
function craftFromIds(it: Record_): readonly string[] {
  return isHomebrewRecord(it) ? (it.craft_from ?? []) : [];
}

/* Each record once, the catalog's before the homebrew ones, each part in its order. */
function officialFirst(list: readonly Record_[]): Record_[] {
  const once = [...new Set(list)];
  return [
    ...once.filter((r) => !isHomebrewRecord(r)),
    ...once.filter((r) => isHomebrewRecord(r))
  ];
}

const resolved = (index: Index, ids: readonly string[]): Record_[] =>
  [...new Set(ids)].flatMap((id) => {
    const r = index.byId.get(id);
    return r ? [r] : [];
  });

export type Relations = Pick<Index, 'craftedFrom' | 'craftedInto' | 'setMembers'>;

/** Returns `base`'s relation maps with `records` added after its own; a craft link counts
 *  only to an id `byId` holds. `base` does not change. */
export function relate(
  base: Relations,
  records: readonly Record_[],
  byId: ReadonlyMap<string, Record_>
): Relations {
  const copy = (m: ReadonlyMap<string, readonly Record_[]>): Map<string, Record_[]> =>
    new Map([...m].map(([k, v]) => [k, [...v]]));
  const craftedFrom = copy(base.craftedFrom);
  const craftedInto = copy(base.craftedInto);
  const setMembers = copy(base.setMembers);
  const push = (m: Map<string, Record_[]>, id: string, it: Record_): void => {
    const list = m.get(id) ?? [];
    list.push(it);
    m.set(id, list);
  };
  for (const it of records) {
    for (const id of new Set(craftIds(it))) if (byId.has(id)) push(craftedFrom, id, it);
    for (const id of new Set(craftFromIds(it))) if (byId.has(id)) push(craftedInto, id, it);
    if (it.set) push(setMembers, it.set, it);
  }
  return { craftedFrom, craftedInto, setMembers };
}

/** Returns the records this one upgrades into: those its `craft` names, then those whose
 *  `craft_from` names it; each once, the catalog's records before the homebrew ones. */
export function upgradesTo(index: Index, it: Record_): Record_[] {
  return officialFirst([
    ...resolved(index, craftIds(it)),
    ...(index.craftedInto.get(it.id) ?? [])
  ]);
}

/** Returns the records made into this one: those whose `craft` names it, in the order the
 *  tables hold them, then those its `craft_from` names; each once, the catalog's records
 *  before the homebrew ones. */
export function madeFrom(index: Index, it: Record_): Record_[] {
  return officialFirst([
    ...(index.craftedFrom.get(it.id) ?? []),
    ...resolved(index, craftFromIds(it))
  ]);
}

/** Returns the key of the set a record belongs to: its own `set`, else the account's own
 *  set card that names it (`ownSetOf`). */
export function setKeyOf(index: Index, it: Record_): string | undefined {
  return it.set ?? index.ownSetOf.get(it.id);
}

/** Returns the rule card keys a record draws: its own `refs`, then the account's own cards
 *  that name it (`ownRefsOf`), each once. */
export function refsOf(index: Index, it: Record_): string[] {
  return [...new Set([...(it.refs ?? []), ...(index.ownRefsOf.get(it.id) ?? [])])];
}

/** Every member of the set a record belongs to, itself included also when the index
 *  lacks it (a frozen copy) - empty where the record belongs to no set or to a set of one. */
export function setOf(index: Index, it: Record_): readonly Record_[] {
  const key = setKeyOf(index, it);
  if (!key) return [];
  const members = index.setMembers.get(key) ?? [];
  const all = members.some((r) => r.id === it.id) ? members : [...members, it];
  return all.length > 1 ? all : [];
}

/** The shared bonus of the set a record belongs to, where the set has one: the index's
 *  card, else the one the record carries. A frozen copy with no other member of its set
 *  still gets the card it carries; an own item alone in its set gets none. */
export function setBonusOf(index: Index, it: Record_): SetCard | undefined {
  const key = setKeyOf(index, it);
  if (!key) return undefined;
  const carried = isHomebrewRecord(it) ? it.cards?.sets?.[key] : undefined;
  if (setOf(index, it).length) return index.sets[key] ?? carried;
  const listed = (index.setMembers.get(key) ?? []).some((r) => r.id === it.id);
  return listed ? undefined : carried;
}
