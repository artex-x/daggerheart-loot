/* The dataset, indexed.
 *
 * Everything here is derived, never stored: the reverse craft link, the rarity
 * of a loot record, the list of everything that has a stat block. Deriving them
 * is what stops the two halves of a pair from drifting apart, which is the same
 * reason `craft` is written in one direction only.
 *
 * Pure module: it is handed the data and returns an index. Where the data comes
 * from is somebody else's problem - under file:// it can only arrive as a
 * script that assigns a global, and that adapter lives outside this module
 * (docs/specs/CONTRACTS.md, section 4). */

import type { Rarity } from './money.js';
import type { EquipKind, Record_, RefCard } from './types.js';

/** The shape of `window.LOOT`. */
export interface Loot {
  items: Record<string, Record_[]>;
  eq?: Record_[];
  refs?: Record<string, RefCard>;
  alt?: Partial<Record<'item' | 'consumable', Partial<Record<Rarity, AltColumns>>>>;
}

interface AltColumns {
  hope: string[];
  fear: string[];
}

export interface Index {
  /** Every record by id: loot and equipment together, one lookup for both. */
  byId: ReadonlyMap<string, Record_>;
  /** Loot, in the order the tables print it. */
  all: readonly Record_[];
  /** Loot and equipment - what search covers. */
  searchable: readonly Record_[];
  /** Everything with a stat block, wherever it lives. */
  allEquip: readonly Record_[];
  /** `id of the upgrade` -> `id it is made from`. The reverse of `craft`. */
  craftedFrom: ReadonlyMap<string, string>;
  /** A loot record's rarity, where the alternate tables give it one. */
  rarityOf: (id: string) => Rarity | undefined;
  /** Referenced rulebook cards, by the key a record names in `refs`. */
  refs: Record<string, RefCard>;
}

export function buildIndex(loot: Loot): Index {
  const byId = new Map<string, Record_>();

  const all: Record_[] = [];
  for (const key of Object.keys(loot.items)) {
    for (const it of loot.items[key] ?? []) {
      all.push(it);
      byId.set(it.id, it);
    }
  }

  /* Weapons and armour are not loot rolled off a table: they have stats, so
     they are stored apart and carry an `eq` block instead of a roll number. */
  const eq = loot.eq ?? [];
  for (const it of eq) byId.set(it.id, it);

  /* Equipment is not only in `eq`. Eleven Wondrous records, every campaign
     frame entry, and some of Vault of Ages and Dread carry the same block while
     keeping their place in a roll table - one record showing up in both places
     rather than a copy in each. */
  const allEquip = [...all, ...eq].filter((it) => it.eq);

  /* Only one direction is stored. Deriving the other means the two halves
     cannot disagree, and a link to a record that does not exist is simply not
     made. */
  const craftedFrom = new Map<string, string>();
  for (const it of all) {
    if (it.craft && byId.has(it.craft)) craftedFrom.set(it.craft, it.id);
  }

  /* The alternate tables are the only place a loot record's rarity is written
     down, so the index is those tables read backwards. Records outside them -
     Wondrous, Dread, community - have none, and the caller decides what to do
     about that. */
  const rarity = new Map<string, Rarity>();
  for (const kind of Object.keys(loot.alt ?? {}) as ('item' | 'consumable')[]) {
    const byRarity = loot.alt?.[kind] ?? {};
    for (const r of Object.keys(byRarity) as Rarity[]) {
      const cols = byRarity[r];
      if (!cols) continue;
      for (const id of [...cols.hope, ...cols.fear]) rarity.set(id, r);
    }
  }

  return {
    byId,
    all,
    searchable: [...all, ...eq],
    allEquip,
    craftedFrom,
    rarityOf: (id) => rarity.get(id),
    refs: loot.refs ?? {}
  };
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
  return it.src === 'frame' ? (it.frame ?? it.src) : it.src;
}

/** The facet values a record answers with, for the equipment tables. */
export function equipFacets(it: Record_): Record<string, string> {
  const e = it.eq;
  if (!e) return {};
  return {
    tier: String(e.tier),
    src: srcOf(it),
    line: e.line ? 'line' : 'uniq',
    cls: e.cls ?? '',
    trait: e.tr ?? '',
    range: e.rg ?? '',
    burden: e.bu == null ? '' : String(e.bu)
  };
}

/** The facet values a record answers with, on the plain tables. */
export function plainFacets(it: Record_): Record<string, string> {
  return {
    kind: kindOf(it),
    tier: it.tier == null ? '' : String(it.tier),
    frame: it.frame ?? '',
    comm: it.community ?? ''
  };
}

/** Every piece in one upgrade line, in tier order. */
export function upgradeLine(index: Index, it: Record_): Record_[] {
  const line = it.eq?.line;
  if (!line) return [];
  return index.allEquip
    .filter((x) => x.eq?.line === line)
    .sort((a, b) => (a.eq?.tier ?? 0) - (b.eq?.tier ?? 0));
}

export function equipOfKind(index: Index, kind: EquipKind): Record_[] {
  return index.allEquip.filter((it) => it.eq?.t === kind);
}
