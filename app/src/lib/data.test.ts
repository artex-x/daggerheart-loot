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
  plainFacets,
  srcOf,
  upgradeLine,
  type Loot
} from './data.js';
import type { Record_ } from './types.js';

const LOOT = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
) as Loot;

const index = buildIndex(LOOT);

describe('the index over the real dataset', () => {
  it('holds every record under its id', () => {
    expect(index.byId.size).toBe(1061);
    expect(index.searchable).toHaveLength(1061);
  });

  it('separates loot from equipment the way the data does', () => {
    expect(index.all).toHaveLength(680);
    expect(LOOT.eq).toHaveLength(381);
  });

  it('finds equipment wherever it lives, not only in eq', () => {
    /* 381 in `eq`, and another 155 keeping their place in a roll table */
    expect(index.allEquip.length).toBeGreaterThan(LOOT.eq?.length ?? 0);
    expect(equipOfKind(index, 'weapon')).toHaveLength(317);
    expect(equipOfKind(index, 'secondary')).toHaveLength(108);
    expect(equipOfKind(index, 'armor')).toHaveLength(90);
  });

  it('narrows to the two books through the source, as the tables do', () => {
    const books = equipOfKind(index, 'weapon').filter((it) =>
      ['core', 'hnf'].includes(srcOf(it))
    );
    expect(books).toHaveLength(239);
  });
});

describe('upgrade chains', () => {
  it('derives the reverse link rather than storing it', () => {
    expect(index.craftedFrom.size).toBe(15);
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
    const tiers = line.map((x) => x.eq?.tier);
    expect(tiers).toEqual([...tiers].sort((a, b) => (a ?? 0) - (b ?? 0)));
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
});

describe('referenced cards', () => {
  it('are kept beside the items that point at them', () => {
    expect(Object.keys(index.refs)).toHaveLength(5);
  });

  it('are pointed at by records that exist', () => {
    const pointing = index.all.filter((it) => it.refs?.length);
    expect(pointing).toHaveLength(5);
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
