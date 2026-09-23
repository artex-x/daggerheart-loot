/* Run against the real data.json, not a handful of invented records.
   The counts asserted here are the ones the README and llms.txt publish, so a
   silent change to the dataset fails in three places at once rather than none. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildIndex,
  equipFacets,
  equipOfKind,
  kindOf,
  otherTableRows,
  plainFacets,
  setBonusOf,
  setOf,
  srcOf,
  upgradeLine,
  type Loot
} from './data.js';
import { CHARACTER_TRAITS, type Record_ } from './types.js';

const LOOT = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
) as Loot;

const index = buildIndex(LOOT);

type RollPool = readonly Record_[];

function rowAt(rows: readonly Record_[] | undefined, index: number): Record_ {
  if (!rows) throw new Error('real data is missing a table');
  const row = rows[index];
  if (!row) throw new Error(`real data is missing row ${String(index)}`);
  return row;
}

function rollPools(loot: Loot): RollPool[] {
  const pools: RollPool[] = [];
  for (const [name, rows] of Object.entries(loot.items)) {
    if (name === 'frames' || name === 'starting') continue;
    if (name === 'voa') {
      for (const tier of new Set(rows.map((row) => row.tier)))
        pools.push(rows.filter((row) => row.tier === tier));
    } else if (name === 'community') {
      for (const community of new Set(rows.map((row) => row.community)))
        pools.push(rows.filter((row) => row.community === community));
    } else pools.push(rows);
  }
  return pools;
}

function expectRollPools(loot: Loot): void {
  const pools = rollPools(loot);
  const pooled = new Set(pools.flat());
  for (const row of [...Object.values(loot.items).flat(), ...(loot.eq ?? [])])
    expect(pooled.has(row), row.id).toBe(row.roll !== undefined);
  for (const pool of pools) {
    const rolls = pool.map((row) => row.roll);
    expect(rolls.every((roll) => Number.isInteger(roll) && (roll as number) > 0)).toBe(true);
    expect(new Set(rolls).size).toBe(pool.length);
    expect([...rolls].sort((a, b) => (a as number) - (b as number))).toEqual(
      Array.from({ length: pool.length }, (_, index) => index + 1)
    );
  }
}

describe('the index over the real dataset', () => {
  it('holds every record under its id', () => {
    expect(index.byId.size).toBe(1272);
    expect(index.searchable).toHaveLength(1272);
  });

  it('separates loot from equipment the way the data does', () => {
    expect(index.all).toHaveLength(891);
    expect(LOOT.eq).toHaveLength(381);
  });

  it('derives Other without double-counting its source collections', () => {
    const starting = otherTableRows(index, 'other_starting');
    const frames = otherTableRows(index, 'other_frames');
    expect(starting).toHaveLength(29);
    expect(frames).toHaveLength(95);
    expect(new Set([...starting, ...frames]).size).toBe(124);
    expect(index.rows.get('frames')).toHaveLength(94);
    expect(index.all).toHaveLength(891);
    expect(index.searchable).toHaveLength(1272);
  });

  it('keeps roll numbers only in complete, independent roll pools', () => {
    expectRollPools(LOOT);
  });

  it('rejects missing members, outside rolls, duplicates, and gaps', () => {
    const missing = structuredClone(LOOT);
    delete rowAt(missing.items['core_item'], 0).roll;
    expect(() => {
      expectRollPools(missing);
    }).toThrow();
    const outside = structuredClone(LOOT);
    rowAt(outside.items['frames'], 0).roll = 1;
    expect(() => {
      expectRollPools(outside);
    }).toThrow();
    const standalone = structuredClone(LOOT);
    const standaloneEq = standalone.eq;
    if (!standaloneEq) throw new Error('real data must include standalone equipment');
    rowAt(standaloneEq, 0).roll = 1;
    expect(() => {
      expectRollPools(standalone);
    }).toThrow();
    const duplicate = structuredClone(LOOT);
    const wondrous = duplicate.items['wondrous'];
    const sourceRoll = rowAt(wondrous, 0).roll;
    if (sourceRoll == null || !Number.isInteger(sourceRoll))
      throw new Error('real Wondrous data must include an integer roll');
    rowAt(wondrous, 1).roll = sourceRoll;
    expect(() => {
      expectRollPools(duplicate);
    }).toThrow();
    const gap = structuredClone(LOOT);
    rowAt(gap.items['dread'], 0).roll = 30;
    expect(() => {
      expectRollPools(gap);
    }).toThrow();
  });

  it('finds equipment wherever it lives, not only in eq', () => {
    /* 381 in `eq`, and another 223 keeping their source-table placement. */
    expect(index.allEquip.length).toBeGreaterThan(LOOT.eq?.length ?? 0);
    expect(equipOfKind(index, 'weapon')).toHaveLength(381);
    expect(equipOfKind(index, 'secondary')).toHaveLength(123);
    expect(equipOfKind(index, 'armor')).toHaveLength(100);
  });

  it('narrows to the two books through the source, as the tables do', () => {
    const books = equipOfKind(index, 'weapon').filter((it) =>
      ['core', 'hnf'].includes(srcOf(it))
    );
    expect(books).toHaveLength(239);
  });

  it('carries eqtest.js/lists2.js real-data guards nothing else makes', () => {
    /* Ported from tests/eqtest.js:44-51,61 - the only place these ever ran,
       and eqtest.js is one of the ten suites R0c (23c00a6) deletes. */
    const eq = LOOT.eq ?? [];
    const byT = (t: string) => eq.filter((it) => it.eq?.t === t).length;
    expect(byT('secondary')).toBe(73);
    expect(byT('armor')).toBe(69);
    expect(new Set(eq.map((it) => it.en)).size).toBe(381);
    expect(LOOT.items['wondrous']?.filter((it) => it.eq).length).toBe(11);
    expect(index.rows.get('wondrous')).toHaveLength(119);
    /* The book prints Core physical, Core magic, then the same for H&F. */
    const tier1Weapons = eq.filter((it) => it.eq?.t === 'weapon' && it.eq.tier === 1);
    const seq = tier1Weapons
      .map((it) => `${it.src}:${String(it.eq?.cls)}`)
      .filter((v, i, a) => v !== a[i - 1]);
    expect(seq.join(' ')).toBe('core:phy core:mag hnf:phy hnf:mag');
    expect(tier1Weapons[0]?.en).toBe('Broadsword');

    /* Ported from FEATURES.md, "Tables and search": a grid tile shows a
       record's own roll number, not the position it happens to hold in
       whatever subset is currently on screen - the live app's
       `list.map(tileHTML)` passed the array index instead, so filtering a
       roll pool renumbered every tile from 1. Wondrous split by `kind` is
       real data that demonstrates this: the `item` subset's own rolls are
       scattered, not 1..N, proving nothing here recomputes them. */
    const wondrousItems = (LOOT.items['wondrous'] ?? []).filter((it) => it.kind === 'item');
    expect(wondrousItems.length).toBeGreaterThan(0);
    expect(wondrousItems.length).toBeLessThan(LOOT.items['wondrous']?.length ?? 0);
    const rolls = wondrousItems.map((it) => it.roll);
    expect(rolls).not.toEqual(rolls.map((_, i) => i + 1));
  });

  it("orders the equipment pool the way app.js's ALL_EQ does - eq before the roll tables", () => {
    /* `ALL_EQ = EQ.concat(...Object.values(DATA))` in app.js: `eq` first, then
       every roll table in its own order. `allEquip` used to read `all` (the
       roll tables) before `eq`, which was invisible until something drew a
       pool off it directly - a bare `#/tables/eq_weapon` opened on a
       table-embedded weapon rather than on `eq`'s own first one. */
    const want = [...(LOOT.eq ?? []), ...Object.values(LOOT.items).flat()]
      .filter((it) => it.eq?.t === 'weapon')
      .map((it) => it.id);
    expect(equipOfKind(index, 'weapon').map((it) => it.id)).toEqual(want);
  });
});

describe('upgrade chains', () => {
  it('derives the reverse link rather than storing it', () => {
    expect(index.craftedFrom.size).toBe(17);
  });

  it('points back at something that exists, every time', () => {
    for (const [into, from] of index.craftedFrom) {
      expect(index.byId.has(into)).toBe(true);
      expect(index.byId.has(from)).toBe(true);
    }
  });

  it('agrees with the forward direction', () => {
    for (const [into, from] of index.craftedFrom) {
      expect(index.byId.get(from)?.craft).toBe(into);
    }
  });

  it('walks an equipment line in tier order', () => {
    const katana = index.byId.get('q26');
    expect(katana).toBeDefined();
    const line = upgradeLine(index, katana as Record_);
    expect(line.length).toBeGreaterThan(1);
    expect(line.map((x) => x.eq?.tier)).toEqual([1, 2, 3, 4]);
  });

  it('sorts an artifact after the numbered tiers of its line', () => {
    const step = (id: string, tier: 1 | 2 | 'A'): Record_ => ({
      id,
      src: 'voa',
      kind: 'equip',
      en: id,
      ende: '',
      ru: id,
      rud: '',
      eq: { t: 'weapon', tier, line: 'x1' }
    });
    const mixed = { ...index, allEquip: [step('xA', 'A'), step('x2', 2), step('x1', 1)] };
    expect(upgradeLine(mixed, step('x1', 1)).map((x) => x.id)).toEqual(['x1', 'x2', 'xA']);
  });

  it('gives a one-off record no line at all', () => {
    const uniq = index.allEquip.find((it) => !it.eq?.line);
    expect(uniq).toBeDefined();
    expect(upgradeLine(index, uniq as Record_)).toEqual([]);
  });
});

describe('rarity, read off the alternate tables', () => {
  it('knows the rarity of a record those tables list', () => {
    const withRarity = index.all.filter((it) => index.rarityOf(it.id));
    expect(withRarity.length).toBeGreaterThan(100);
  });

  it('says nothing for a record they do not', () => {
    /* Wondrous, Dread and community are not in the alternate tables, and
       inventing a rarity from the name would be worse than admitting it */
    const wondrous = index.all.find((it) => it.src === 'wondrous' && !index.rarityOf(it.id));
    expect(wondrous).toBeDefined();
  });

  it('lists a whole column, numbered by the face that found each row', () => {
    const hope = index.altColumn('item', 'common', 'hope');
    expect(hope.length).toBeGreaterThan(0);
    expect(hope.length).toBeLessThanOrEqual(12);
    expect(hope.map((x) => x.n)).toEqual(hope.map((_, i) => i + 1));
    for (const { it, n } of hope) {
      expect(index.altRow('item', 'common', 'hope', n)).toBe(it);
    }
  });
});

describe('what a record counts as', () => {
  it('calls anything with a stat block equipment, wherever it sits', () => {
    const wondrousWeapon = index.all.find((it) => it.src === 'wondrous' && it.eq);
    expect(wondrousWeapon).toBeDefined();
    expect(kindOf(wondrousWeapon as Record_)).toBe('equip');
  });

  it('keeps items and consumables apart', () => {
    expect(kindOf(index.byId.get('ci1') as Record_)).toBe('item');
    expect(kindOf(index.byId.get('cc1') as Record_)).toBe('consumable');
  });

  it('files a campaign frame under its own frame, not under "frame"', () => {
    /* One value for all three would be useless: at a table running one frame
       the other two are noise, and the filter could only say all or nothing */
    const frameItem = index.all.find((it) => it.src === 'frame');
    expect(frameItem).toBeDefined();
    expect(srcOf(frameItem as Record_)).toBe((frameItem as Record_).frame);
    expect(srcOf(frameItem as Record_)).not.toBe('frame');
  });
});

describe('facet values', () => {
  it('answer every group the equipment tables offer', () => {
    const katana = index.byId.get('q26') as Record_;
    const f = equipFacets(katana);
    for (const g of ['tier', 'src', 'cls', 'trait', 'range', 'burden', 'line']) {
      expect(f).toHaveProperty(g);
    }
    expect(f['tier']).toBe(String(katana.eq?.tier));
  });

  it('are empty rather than missing where a record has no such stat', () => {
    const armour = equipOfKind(index, 'armor')[0] as Record_;
    expect(equipFacets(armour)['range']).toBe('');
  });

  it('answer the plain tables too', () => {
    const voa = index.all.find((it) => it.src === 'voa') as Record_;
    expect(plainFacets(voa)['tier']).toBe(String(voa.tier));
    expect(plainFacets(voa)['kind']).toBeTruthy();
  });

  it('give a record with no stat block no equipment facets', () => {
    expect(equipFacets(index.byId.get('ci1') as Record_)).toEqual({});
  });

  it('answers both burden values for a weapon the book prints both ways', () => {
    /* The Gryphon Hammer is printed One/Two-Handed, so it answers both
       burden chips. */
    const gryphon = index.byId.get('dve30') as Record_;
    expect(equipFacets(gryphon)['burden']).toEqual(['1', '2']);
  });
});

describe('set membership', () => {
  it('groups a set from the records that name it, in allEquip order', () => {
    const ember = index.byId.get('dve19') as Record_;
    const spark = index.byId.get('dve20') as Record_;
    expect(setOf(index, ember)).toEqual([ember, spark]);
    expect(setOf(index, spark)).toEqual([ember, spark]);
  });

  it('answers no members for a record outside any set', () => {
    const gryphon = index.byId.get('dve30') as Record_;
    expect(setOf(index, gryphon)).toEqual([]);
  });

  const member = (id: string, set: string): Record_ => ({
    id,
    src: 'core',
    kind: 'item',
    en: id,
    ende: '',
    ru: id,
    rud: '',
    set
  });

  it('answers no members for a set of one', () => {
    const solo = member('x1', 'solo');
    const small = buildIndex({ items: { core_item: [solo, member('x2', 'pair')] } });
    expect(setOf(small, solo)).toEqual([]);
    expect(setBonusOf(small, solo)).toBeUndefined();
  });

  it("answers the set's shared bonus for each member, and nothing outside a set", () => {
    const bonus = LOOT.sets?.['ember-spark'];
    expect(bonus).toBeDefined();
    expect(setBonusOf(index, index.byId.get('dve19') as Record_)).toBe(bonus);
    expect(setBonusOf(index, index.byId.get('dve20') as Record_)).toBe(bonus);
    expect(setBonusOf(index, index.byId.get('dve30') as Record_)).toBeUndefined();
  });

  it('answers no bonus for a set that has no entry in sets', () => {
    const a = member('x1', 'pair');
    const small = buildIndex({ items: { core_item: [a, member('x2', 'pair')] } });
    expect(setOf(small, a)).toHaveLength(2);
    expect(setBonusOf(small, a)).toBeUndefined();
  });
});

describe("a weapon that uses its wielder's Spellcast trait", () => {
  it('answers all six traits', () => {
    expect(equipFacets(index.byId.get('dve50') as Record_)['trait']).toEqual(CHARACTER_TRAITS);
  });
});

describe('referenced cards', () => {
  it('are kept beside the items that point at them', () => {
    expect(Object.keys(index.refs)).toHaveLength(13);
  });

  it('are pointed at by records that exist', () => {
    /* `index.all` holds the roll tables, equipment with a roll included:
       w88, voa4_t1b, dve38 and dve59 carry a stat block, dve66 an adversary feature. */
    const pointing = index.all.filter((it) => it.refs?.length);
    expect(pointing).toHaveLength(13);
    for (const it of pointing) {
      for (const key of it.refs ?? []) expect(index.refs).toHaveProperty(key);
    }
  });

  it('are pointed at by equipment that exists', () => {
    const pointing = index.allEquip.filter((it) => it.refs?.length);
    expect(pointing.map((it) => it.id)).toEqual(['w88', 'voa4_t1b', 'dve38', 'dve59', 'dve66']);
    for (const it of pointing) {
      for (const key of it.refs ?? []) expect(index.refs).toHaveProperty(key);
    }
  });
});

describe('records with fields missing', () => {
  /* The real data is complete, which is why these branches went unrun. They
     exist for the case it is not - a hand-edited data.js, a source added
     without a facet - and their job is to yield an empty string rather than
     the word "undefined" on a chip. */
  const bare = (over: Partial<Record_> = {}): Record_ => ({
    id: 'x1',
    src: 'core',
    kind: 'item',
    en: 'Thing',
    ende: '',
    ru: 'Вещь',
    rud: '',
    ...over
  });

  it('falls back to the source when a frame record has no frame', () => {
    expect(srcOf(bare({ src: 'frame', frame: 'beast_feast' }))).toBe('beast_feast');
    expect(srcOf(bare({ src: 'frame' }))).toBe('frame');
    expect(srcOf(bare({ src: 'wondrous' }))).toBe('wondrous');
  });

  it('gives empty facets rather than undefined ones', () => {
    const f = plainFacets(bare());
    expect(f['tier']).toBe('');
    expect(f['frame']).toBe('');
    expect(f['comm']).toBe('');
    expect(Object.values(f)).not.toContain(undefined);
  });

  it('writes a tier of zero as a value, not as absent', () => {
    /* `== null` and not falsiness: tier 0 is not a tier this game has, but the
       distinction is what keeps a legitimate 0 from vanishing. */
    expect(plainFacets(bare({ tier: 1 }))['tier']).toBe('1');
  });

  it('puts an upgrade line in tier order whatever order it was stored in', () => {
    const hi = bare({ id: 'e2', eq: { t: 'weapon', tier: 2, line: 'l1' } });
    const lo = bare({ id: 'e1', eq: { t: 'weapon', tier: 1, line: 'l1' } });
    const index = buildIndex({ ...LOOT, eq: [hi, lo] });
    expect(upgradeLine(index, hi).map((r) => r.id)).toEqual(['e1', 'e2']);
  });

  it('has no upgrade line for something outside one', () => {
    expect(upgradeLine(buildIndex(LOOT), bare())).toEqual([]);
  });

  it('survives a dataset with no references at all', () => {
    const { refs, ...noRefs } = LOOT;
    void refs;
    expect(buildIndex(noRefs as Loot).refs).toEqual({});
  });
});
