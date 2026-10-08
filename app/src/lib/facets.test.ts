import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildIndex,
  equipFacets,
  equipOfKind,
  listFacets,
  otherTableRows,
  plainFacets,
  srcOf,
  type Index,
  type Loot
} from './data.js';
import { dict } from './dict.js';
import {
  facetRows,
  listFacetRows,
  narrowRows,
  type FacetRow,
  type FacetValue
} from './facets.js';
import { FRAME_ORDER } from './frames.js';
import { decodeFilter, encodeFilter, groupsFor, LIST_GROUPS, passes } from './filters.js';
import { browseIndex, recordOf, withRecords, type HomebrewRecord } from './homebrew.js';
import { ownAtScale } from '../test/facets.js';
import {
  CHARACTER_TRAITS,
  TABLE_IDS,
  type EquipKind,
  type Record_,
  type TableId
} from './types.js';

const row = (over: Partial<Record_>): Record_ => ({
  id: over.id ?? 'x',
  src: 'wondrous',
  kind: 'item',
  en: 'Thing',
  ende: '',
  ru: 'Вещь',
  rud: '',
  ...over
});

const t = dict('ru');

describe('the kind row', () => {
  it('offers item and consumable, in that order, for a table that mixes them', () => {
    const index = buildIndex({
      items: {
        wondrous: [row({ id: 'w1', kind: 'consumable' }), row({ id: 'w2', kind: 'item' })]
      }
    });
    expect(facetRows(index, 'wondrous', t, 'ru')).toEqual([
      {
        group: 'kind',
        label: 'Тип',
        values: [
          { value: 'item', label: 'Предметы' },
          { value: 'consumable', label: 'Расходники' }
        ]
      }
    ]);
  });

  it('includes equip where the table carries stat blocks too', () => {
    const index = buildIndex({
      items: {
        dread: [
          row({ id: 'd1', kind: 'item' }),
          row({ id: 'd2', kind: 'item', eq: { t: 'weapon', tier: 1 } })
        ]
      }
    });
    const [row0] = facetRows(index, 'dread', t, 'ru');
    expect(row0?.values.map((v) => v.value)).toEqual(['item', 'equip']);
  });

  it('answers nothing for a table with only one kind', () => {
    const index = buildIndex({
      items: { core_item: [row({ id: 'ci1' })] }
    });
    expect(facetRows(index, 'core_item', t, 'ru')).toEqual([]);
  });

  it('answers nothing for a table with a kind facet but no rows at all', () => {
    const index = buildIndex({ items: { core_item: [row({ id: 'ci1' })] } });
    expect(facetRows(index, 'wondrous', t, 'ru')).toEqual([]);
  });

  it('answers nothing for a table with no facet at all', () => {
    const index = buildIndex({
      items: { hnf_item: [row({ id: 'h1', kind: 'consumable' }), row({ id: 'h2' })] }
    });
    expect(facetRows(index, 'hnf_item', t, 'ru')).toEqual([]);
  });
});

describe('the tier row', () => {
  it('lists all six Vault of Ages divisions, named the way the roll picker names them', () => {
    const index = buildIndex({
      items: {
        voa: [
          row({ id: 'v1', tier: 1, kind: 'item' }),
          row({ id: 'v2', tier: 'A', kind: 'consumable' })
        ]
      }
    });
    const [, tierRow] = facetRows(index, 'voa', t, 'ru');
    expect(tierRow).toEqual({
      group: 'tier',
      label: 'Ранг',
      values: [
        { value: '1', label: 'Ранг 1' },
        { value: '2', label: 'Ранг 2' },
        { value: '3', label: 'Ранг 3' },
        { value: '4', label: 'Ранг 4' },
        { value: 'A', label: 'Артефакты' },
        { value: 'C', label: 'Проклятые предметы' }
      ]
    });
  });
});

describe('the frame row', () => {
  it('lists all four campaigns, even one with a single row, in book order', () => {
    const index = buildIndex({
      items: { frames: [row({ id: 'f1', frame: 'motherboard', kind: 'consumable' })] }
    });
    const [frameRow] = facetRows(index, 'other_frames', t, 'ru');
    expect(frameRow?.values.map((v) => v.value)).toEqual(FRAME_ORDER);
    expect(frameRow?.values.find((v) => v.value === 'beast_feast')?.label).toBe('Пир зверей');
  });
});

describe('the equipment tables', () => {
  const EQ_TABLE: Record<EquipKind, TableId> = {
    weapon: 'eq_weapon',
    secondary: 'eq_secondary',
    armor: 'eq_armor'
  };

  const index = buildIndex({
    items: {
      frames: [
        row({
          id: 'f1',
          src: 'frame',
          frame: 'beast_feast',
          kind: 'item',
          eq: { t: 'armor', tier: 2 }
        })
      ]
    },
    eq: [
      row({
        id: 'w1',
        src: 'core',
        kind: 'item',
        eq: { t: 'weapon', tier: 1, cls: 'phy', tr: 'agility', rg: 'melee', bu: 1 }
      }),
      row({
        id: 'w2',
        src: 'hnf',
        kind: 'item',
        eq: { t: 'weapon', tier: 2, cls: 'mag', tr: 'strength', rg: 'far', bu: 2 }
      }),
      row({
        id: 's1',
        src: 'core',
        kind: 'item',
        eq: { t: 'secondary', tier: 1, cls: 'phy', tr: 'finesse', rg: 'close' }
      }),
      row({
        id: 'a1',
        src: 'core',
        kind: 'item',
        eq: { t: 'armor', tier: 1, as: 3, line: 'a1' }
      })
    ]
  });

  it('never drifts from the frozen group order', () => {
    for (const kind of Object.keys(EQ_TABLE) as EquipKind[]) {
      const table = EQ_TABLE[kind];
      const rows = facetRows(index, table, t, 'ru');
      expect(rows.map((r) => r.group)).toEqual(groupsFor(table));
    }
  });

  it("labels the tier row's values with the bare digit", () => {
    const [tierRow] = facetRows(index, 'eq_weapon', t, 'ru');
    expect(tierRow).toEqual({
      group: 'tier',
      label: 'Ранг',
      values: [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' }
      ]
    });
  });

  it('offers the artifact chip only on the kind an artifact record answers, and narrows to it', () => {
    const artifact = row({
      id: 'voa_a9',
      src: 'voa',
      kind: 'equip',
      tier: 'A',
      eq: { t: 'weapon', tier: 'A', cls: 'phy', tr: 'strength', rg: 'melee', bu: 2 }
    });
    const withArtifact = buildIndex({ items: { voa: [artifact] } });
    const tierValues = (ix: typeof index, table: TableId): FacetValue[] =>
      facetRows(ix, table, t, 'ru').find((r) => r.group === 'tier')?.values ?? [];
    expect(tierValues(withArtifact, 'eq_weapon').at(-1)).toEqual({
      value: 'A',
      label: 'Артефакты'
    });
    expect(tierValues(withArtifact, 'eq_secondary').map((v) => v.value)).not.toContain('A');
    expect(tierValues(index, 'eq_weapon').map((v) => v.value)).not.toContain('A');

    const state = decodeFilter('f_tier-A', groupsFor('eq_weapon'));
    const picked = equipOfKind(withArtifact, 'weapon').filter((it) =>
      passes(state, groupsFor('eq_weapon'), (g) => equipFacets(it)[g] ?? '')
    );
    expect(picked.map((it) => it.id)).toEqual(['voa_a9']);
  });

  it('offers only sources with a record of this kind, in book order, naming a frame by frameName', () => {
    const [, srcRow] = facetRows(index, 'eq_armor', t, 'ru');
    expect(srcRow?.values).toEqual([
      { value: 'core', label: 'Core' },
      { value: 'beast_feast', label: 'Пир зверей' }
    ]);
  });

  it('never offers motherboard: no equipment of any kind carries it', () => {
    for (const table of ['eq_weapon', 'eq_secondary', 'eq_armor'] as TableId[]) {
      const [, srcRow] = facetRows(index, table, t, 'ru');
      expect(srcRow?.values.map((v) => v.value)).not.toContain('motherboard');
    }
  });

  it('labels the class row Класс on every weapon kind', () => {
    const [, , clsWeapon] = facetRows(index, 'eq_weapon', t, 'ru');
    const [, , clsSecondary] = facetRows(index, 'eq_secondary', t, 'ru');
    expect(clsWeapon?.label).toBe('Класс');
    expect(clsSecondary?.label).toBe('Класс');
  });

  it('offers burden only on weapons', () => {
    expect(groupsFor('eq_weapon')).toContain('burden');
    expect(groupsFor('eq_secondary')).not.toContain('burden');
    expect(groupsFor('eq_armor')).not.toContain('burden');
    const burdenRow = facetRows(index, 'eq_weapon', t, 'ru').find((r) => r.group === 'burden');
    expect(burdenRow).toEqual({
      group: 'burden',
      label: 'Хват',
      values: [
        { value: '1', label: 'Одноручное' },
        { value: '2', label: 'Двуручное' }
      ]
    });
  });

  it('offers a trait chip only where a record of this kind answers it', () => {
    const traits = (table: TableId): string[] =>
      facetRows(index, table, t, 'ru')
        .find((r) => r.group === 'trait')
        ?.values.map((v) => v.value) ?? [];
    expect(traits('eq_weapon')).toEqual(['agility', 'strength']);
    expect(traits('eq_secondary')).toEqual(['finesse']);
  });

  it('offers all six trait chips for a Spellcast weapon and no spellcast chip', () => {
    const spell = buildIndex({
      items: {},
      eq: [
        row({
          id: 'sb',
          src: 'dv',
          kind: 'equip',
          eq: { t: 'weapon', tier: 2, cls: 'mag', tr: 'spellcast', rg: 'melee', bu: 2 }
        }),
        row({
          id: 's1',
          src: 'core',
          kind: 'equip',
          eq: { t: 'secondary', tier: 1, cls: 'phy', tr: 'finesse', rg: 'close' }
        })
      ]
    });
    const traits = (table: TableId): string[] =>
      facetRows(spell, table, t, 'ru')
        .find((r) => r.group === 'trait')
        ?.values.map((v) => v.value) ?? [];
    expect(traits('eq_weapon')).toEqual([...CHARACTER_TRAITS]);
    expect(traits('eq_secondary')).toEqual(['finesse']);
    expect(traits('eq_secondary')).not.toContain('spellcast');
  });

  it("labels the line row's two values", () => {
    const lineRow = facetRows(index, 'eq_armor', t, 'ru').find((r) => r.group === 'line');
    expect(lineRow).toEqual({
      group: 'line',
      label: 'Линейка',
      values: [
        { value: 'line', label: 'Улучшаемые' },
        { value: 'uniq', label: 'Уникальные' }
      ]
    });
  });
});

describe('the comm row', () => {
  it("lists every community that has records, in the data's own order", () => {
    const index = buildIndex({
      items: {
        community: [
          row({ id: 'c1', community: 'Loreborne', community_ru: 'Научное' }),
          row({ id: 'c2', community: 'Highborne', community_ru: 'Великородное' })
        ]
      }
    });
    const [commRow] = facetRows(index, 'community', t, 'ru');
    expect(commRow).toEqual({
      group: 'comm',
      label: 'Сообщество',
      values: [
        { value: 'Loreborne', label: 'Научное' },
        { value: 'Highborne', label: 'Великородное' }
      ]
    });
  });
});

describe('the own items', () => {
  const base = buildIndex({
    items: { core_item: [row({ id: 'ci1', src: 'core' })] },
    eq: [
      row({
        id: 'w1',
        src: 'core',
        eq: { t: 'weapon', tier: 1, cls: 'phy', tr: 'agility', rg: 'melee', bu: 1 }
      })
    ]
  });
  const workshop = {
    key: 'hb_workshopaaaaaaaa',
    ru: 'Мастерская Ольхи',
    en: 'Alder Workshop',
    sections: [{ key: 'hb_bladesaaaaaaaaaa', ru: 'Клинки', en: 'Blades' }]
  };
  const guild = {
    key: 'hb_guildaaaaaaaaaaa',
    ru: 'Гильдия',
    sections: [{ key: 'hb_guildbladesaaaaa', ru: 'Клинки' }]
  };
  const sword = (key: string, book: typeof workshop | typeof guild | null, section?: string) =>
    recordOf(
      key,
      {
        kind: 'equip',
        ru: 'Меч ' + key,
        ...(section ? { section } : {}),
        eq: {
          t: 'weapon',
          tier: 2,
          cls: 'phy',
          tr: 'agility',
          rg: 'melee',
          dmg: 'd8',
          dt: 'phy',
          bu: 1
        }
      },
      book
    );
  const own = [
    sword('hb_wsaaaaaaaaaaaaaa', workshop, 'hb_bladesaaaaaaaaaa'),
    recordOf('hb_potionaaaaaaaaaa', { kind: 'consumable', ru: 'Зелье' }, null),
    sword('hb_gsaaaaaaaaaaaaaa', guild, 'hb_guildbladesaaaaa')
  ];
  const index = withRecords(base, own, []);
  const values = (ix: typeof index, table: TableId, group: string): string[] =>
    facetRows(ix, table, t, 'ru')
      .find((r) => r.group === group)
      ?.values.map((v) => v.label) ?? [];

  it('appends the own sources after the books on the table of their kind only', () => {
    expect(values(index, 'eq_weapon', 'src')).toEqual(['Core', 'Гильдия', 'Мастерская Ольхи']);
    expect(values(index, 'eq_armor', 'src')).toEqual([]);
    const [, src] = facetRows(index, 'eq_weapon', t, 'ru');
    expect(src?.values.map((v) => v.value)).toEqual([
      'core',
      'hb_guildaaaaaaaaaaa',
      'hb_workshopaaaaaaaa'
    ]);
  });

  it('offers kind and section on the homebrew table, and no source row', () => {
    const rows = facetRows(index, 'homebrew', t, 'ru');
    expect(rows.map((r) => r.group)).toEqual(['kind', 'sect']);
  });

  it('labels a section by its name and lists every source with no chip chosen', () => {
    expect(values(index, 'homebrew', 'sect')).toEqual(['Клинки', 'Клинки']);
  });

  it('lists only the chosen source sections with a chip chosen', () => {
    const sect = (source: string): string[] =>
      facetRows(index, 'homebrew', t, 'ru', source)
        .find((r) => r.group === 'sect')
        ?.values.map((v) => v.value) ?? [];
    expect(sect('hb_guildaaaaaaaaaaa')).toEqual(['hb_guildbladesaaaaa']);
    expect(sect('hb_workshopaaaaaaaa')).toEqual(['hb_bladesaaaaaaaaaa']);
    expect(sect('hb')).toEqual([]);
  });

  it('draws no section row when no own item sits in a section', () => {
    const plain = withRecords(base, [own[1] as HomebrewRecord], []);
    expect(facetRows(plain, 'homebrew', t, 'ru')).toEqual([]);
  });

  it('draws no row at all with no own item', () => {
    expect(facetRows(base, 'homebrew', t, 'ru')).toEqual([]);
  });

  it('drops the own values with the chip off', () => {
    expect(values(browseIndex(index, base, false), 'eq_weapon', 'src')).toEqual(['Core']);
    expect(values(browseIndex(index, base, true), 'eq_weapon', 'src')).toHaveLength(3);
  });
});

describe("a share link's facet rows", () => {
  const LOOT = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
  ) as Loot;
  const catalog = buildIndex(LOOT);
  const byId = (id: string): Record_ => catalog.byId.get(id) as Record_;
  const ALDER = {
    key: 'hb_alderworkshopaaa',
    ru: 'Мастерская Ольхи',
    en: 'Alder Workshop',
    sections: [{ key: 'hb_sectbladesaaaaaa', ru: 'Холодное оружие', en: 'Blades' }]
  };
  const axe = recordOf(
    'hb_emberaxeaaaaaaaa',
    {
      kind: 'equip',
      ru: 'Топор Тлеющих Углей',
      en: 'Ember Axe',
      section: 'hb_sectbladesaaaaaa',
      eq: {
        t: 'weapon',
        tier: 2,
        cls: 'mag',
        tr: 'spellcast',
        rg: 'melee',
        dmg: 'd10+2',
        dt: 'mag',
        bu: 2
      }
    },
    ALDER
  );
  /* The test build's seeded share «Лавка кузнеца», in its order. */
  const SHOP: Record_[] = [
    ...['ci1', 'q1', 'q313', 'cc1', 'voa2_a3', 'q23', 'w51', 'q35', 'di11'].map(byId),
    axe
  ];
  const shape = (rows: FacetRow[]): [string, string, string[]][] =>
    rows.map((r) => [r.group, r.label, r.values.map((v) => v.label)]);
  const gear = (id: string, src: string, eq: NonNullable<Record_['eq']>): Record_ =>
    row({ id, src, kind: 'item', eq });

  it('draws no row for no record and for one record', () => {
    expect(listFacetRows([], t, 'ru')).toEqual([]);
    expect(listFacetRows([byId('q1')], t, 'ru')).toEqual([]);
  });

  it("draws the seeded list's rows and values in the panel's order, in Russian", () => {
    expect(shape(listFacetRows(SHOP, t, 'ru'))).toEqual([
      ['kind', 'Тип', ['Предметы', 'Расходники', 'Оружие', 'Броня']],
      [
        'src',
        'Источник',
        ['Core', 'Hope & Fear', 'Wondrous', 'Dread', 'Vault of Ages', 'Мастерская Ольхи']
      ],
      ['tier', 'Ранг', ['1', '2']],
      ['cls', 'Класс', ['Физическое', 'Магическое']],
      [
        'trait',
        'Характеристика',
        ['Проворность', 'Сила', 'Искусность', 'Инстинкт', 'Влияние', 'Знание']
      ],
      ['range', 'Дистанция', ['Вплотную', 'Средне', 'Далеко']],
      ['burden', 'Хват', ['Одноручное', 'Двуручное']],
      ['line', 'Линейка', ['Улучшаемые', 'Уникальные']]
    ]);
  });

  it("draws the same rows in English, with each value's English name", () => {
    const en = dict('en');
    const rows = listFacetRows(SHOP, en, 'en');
    expect(rows.map((r) => r.label)).toEqual([
      en.kindF,
      en.source,
      en.tier,
      en.eqClass,
      en.eqTrait,
      en.eqRange,
      en.eqBurden,
      en.eqLineF
    ]);
    expect(shape(rows)[0]).toEqual([
      'kind',
      en.kindF,
      ['Items', 'Consumables', 'Weapons', 'Armor']
    ]);
    expect(rows[1]?.values.at(-1)?.label).toBe('Alder Workshop');
    expect(rows[4]?.values[0]?.label).toBe('Agility');
  });

  it('drops a row whose one value every record answers, and keeps one some record lacks', () => {
    const t1 = (id: string): Record_ =>
      gear(id, 'core', { t: 'weapon', tier: 1, cls: 'phy', tr: 'agility', rg: 'melee', bu: 1 });
    const two = [t1('a1'), t1('a2')];
    expect(listFacetRows(two, t, 'ru')).toEqual([]);
    const withItem = [...two, row({ id: 'i1', src: 'core' })];
    expect(listFacetRows(withItem, t, 'ru').map((r) => [r.group, r.values.length])).toEqual([
      ['kind', 2],
      ['tier', 1],
      ['cls', 1],
      ['trait', 1],
      ['range', 1],
      ['burden', 1],
      ['line', 1]
    ]);
  });

  it('offers all six traits for a Spellcast weapon and both burden chips for one held either way', () => {
    const rows = listFacetRows(
      [
        gear('s1', 'core', { t: 'weapon', tier: 1, tr: 'spellcast', bu: 'any' }),
        row({ id: 'i1', src: 'core' })
      ],
      t,
      'ru'
    );
    expect(rows.find((r) => r.group === 'trait')?.values.map((v) => v.value)).toEqual([
      ...CHARACTER_TRAITS
    ]);
    expect(rows.find((r) => r.group === 'burden')?.values.map((v) => v.value)).toEqual([
      '1',
      '2'
    ]);
  });

  it('lists the catalog sources in book order, then no source, then own sources by name', () => {
    const own = (key: string, book: { key: string; ru: string } | null): HomebrewRecord =>
      recordOf(key, { kind: 'item', ru: 'Вещь ' + key }, book);
    const records = [
      own('hb_zzaaaaaaaaaaaaaa', { key: 'hb_yaaaaaaaaaaaaaaa', ru: 'Ясень' }),
      row({ id: 'm1', src: 'frame', frame: 'colossus' }),
      row({ id: 'c1', src: 'community', community: 'Seaborne' }),
      row({ id: 'a1', src: 'arazo' }),
      row({ id: 'v1', src: 'voa' }),
      own('hb_noneaaaaaaaaaaaa', null),
      own('hb_bookaaaaaaaaaaaa', { key: 'hb_baaaaaaaaaaaaaaa', ru: 'Берёза' }),
      row({ id: 'k1', src: 'core' })
    ];
    const src = listFacetRows(records, t, 'ru').find((r) => r.group === 'src');
    expect(src?.values).toEqual([
      { value: 'core', label: 'Core' },
      { value: 'voa', label: 'Vault of Ages' },
      { value: 'arazo', label: t.srcArazo },
      { value: 'community', label: 'Сообщества' },
      { value: 'colossus', label: 'Колоссы Сухоземья' },
      { value: 'hb', label: t.srcHomebrew },
      { value: 'hb_baaaaaaaaaaaaaaa', label: 'Берёза' },
      { value: 'hb_yaaaaaaaaaaaaaaa', label: 'Ясень' }
    ]);
    const enSrc = listFacetRows(records, dict('en'), 'en').find((r) => r.group === 'src');
    expect(enSrc?.values.find((v) => v.value === 'community')?.label).toBe('Communities');
  });

  it('draws no row for 8 entries all alike', () => {
    const potions = Array.from({ length: 8 }, (_, i) =>
      row({ id: 'cc' + String(i + 1), src: 'core', kind: 'consumable' })
    );
    expect(listFacetRows(potions, t, 'ru')).toEqual([]);
  });

  it('draws the tier row alone for 8 weapons that differ only by tier', () => {
    const weapons = Array.from({ length: 8 }, (_, i) =>
      gear('p' + String(i), 'core', {
        t: 'weapon',
        tier: ((i % 4) + 1) as 1 | 2 | 3 | 4,
        cls: 'phy',
        tr: 'presence',
        rg: 'melee',
        bu: 1,
        line: i < 4 ? 'p0' : 'p4'
      })
    );
    expect(shape(listFacetRows(weapons, t, 'ru'))).toEqual([
      ['tier', 'Ранг', ['1', '2', '3', '4']]
    ]);
  });

  it('draws the source and line rows for 8 tier 2 armours from five sources', () => {
    const SRC = ['core', 'hnf', 'wondrous', 'dread', 'voa'];
    const armours = Array.from({ length: 8 }, (_, i) =>
      gear('ar' + String(i), SRC[i % 5] ?? 'core', {
        t: 'armor',
        tier: 2,
        ...(i === 0 ? { line: 'ar0' } : {})
      })
    );
    expect(shape(listFacetRows(armours, t, 'ru'))).toEqual([
      ['src', 'Источник', ['Core', 'Hope & Fear', 'Wondrous', 'Dread', 'Vault of Ages']],
      ['line', 'Линейка', ['Улучшаемые', 'Уникальные']]
    ]);
  });

  describe('at the entry limit and at three times it', () => {
    /* A key of the 19-character shape for the n-th own row. */
    const key = (head: string, n: number): string =>
      (
        'hb_' +
        head +
        'abcdefghij'.charAt(Math.floor(n / 10)) +
        'abcdefghij'.charAt(n % 10)
      ).padEnd(19, 'a');
    /* 60 own sources, three owners at 20 each. */
    const own = Array.from({ length: 60 }, (_, i) =>
      recordOf(
        key('own', i),
        { kind: 'item', ru: 'Своя вещь ' + String(i) },
        { key: key('src', i), ru: 'Источник ' + String(i) }
      )
    );
    /* A fifth own items, the rest spread evenly over the catalog. */
    const mixed = (n: number): Record_[] => {
      const owned = own.slice(0, n / 5);
      const rest = n - owned.length;
      const all = catalog.all;
      return [
        ...owned,
        ...Array.from(
          { length: rest },
          (_, i) => all[Math.floor((i * all.length) / rest)] as Record_
        )
      ];
    };

    for (const n of [100, 300]) {
      it(`bounds every row by its vocabulary and filters to the expected subset at ${String(n)}`, () => {
        const records = mixed(n);
        const rows = listFacetRows(records, t, 'ru');
        const size = (g: string): number => rows.find((r) => r.group === g)?.values.length ?? 0;
        const bound: Record<string, number> = {
          kind: 5,
          tier: 5,
          cls: 2,
          trait: 6,
          range: 5,
          burden: 2,
          line: 2
        };
        for (const [g, most] of Object.entries(bound))
          expect(size(g), g).toBeLessThanOrEqual(most);
        const ownSources = new Set(records.filter((it) => it.src === 'homebrew').map(srcOf));
        expect(size('src')).toBeLessThanOrEqual(12 + ownSources.size);
        const picked = { kind: ['weapon'], tier: ['2'] };
        const passed = records.filter((it) =>
          passes(picked, LIST_GROUPS, (g) => listFacets(it)[g] ?? '')
        );
        expect(passed.length).toBeGreaterThan(0);
        expect(passed).toEqual(
          records.filter((it) => it.eq?.t === 'weapon' && String(it.eq.tier) === '2')
        );
      });
    }

    it('keeps the longest address under the 16384 characters a sign-in return takes', () => {
      const rows = listFacetRows(mixed(300), t, 'ru');
      const every = Object.fromEntries(
        rows.map((r) => [r.group, r.values.map((v) => v.value)])
      );
      expect(every['src']?.length).toBeGreaterThan(60);
      const seg = encodeFilter(every, LIST_GROUPS);
      expect(('#/s/' + 'A'.repeat(43) + '/' + seg).length).toBeLessThan(16384);
    });
  });
});

describe('the offer rule', () => {
  const kindRow: FacetRow = {
    group: 'kind',
    label: 'Тип',
    values: [
      { value: 'item', label: 'Предметы' },
      { value: 'consumable', label: 'Расходники' },
      { value: 'equip', label: 'Снаряжение' }
    ]
  };
  const tierRow: FacetRow = {
    group: 'tier',
    label: 'Ранг',
    values: ['1', '2', '3'].map((v) => ({ value: v, label: v }))
  };
  const plain = (it: Record_, g: string): string => plainFacets(it)[g] ?? '';
  const item = row({ id: 'i1', kind: 'item', tier: 1 });
  const potion = row({ id: 'c1', kind: 'consumable', tier: 1 });

  it('draws no row for no record and no pick', () => {
    expect(narrowRows([kindRow, tierRow], [], plain)).toEqual([]);
  });

  it('drops a row whose one value every record answers', () => {
    expect(narrowRows([kindRow], [item, row({ id: 'i2', kind: 'item' })], plain)).toEqual([]);
  });

  it('keeps a row whose one value some record lacks', () => {
    const rows = narrowRows([tierRow], [item, row({ id: 'i2', kind: 'item' })], plain);
    expect(rows.map((r) => r.values.map((v) => v.value))).toEqual([['1']]);
  });

  it('keeps a row with two answered values and drops the values no record answers', () => {
    expect(narrowRows([kindRow], [potion, item], plain)).toEqual([
      { ...kindRow, values: [kindRow.values[0], kindRow.values[1]] }
    ]);
  });

  it('keeps a picked value no record answers, and so its row', () => {
    const rows = narrowRows([kindRow], [item], plain, { kind: ['consumable'] });
    expect(rows.map((r) => r.values.map((v) => v.value))).toEqual([['item', 'consumable']]);
    const alone = narrowRows([kindRow], [], plain, { kind: ['equip'] });
    expect(alone.map((r) => r.values.map((v) => v.value))).toEqual([['equip']]);
  });

  it('ignores a pick in another row', () => {
    expect(narrowRows([kindRow], [item], plain, { tier: ['2'] })).toEqual([]);
  });

  it("keeps the candidates' order and labels", () => {
    const rows = narrowRows(
      [tierRow, kindRow],
      [potion, item, row({ id: 'i3', tier: 3 })],
      plain
    );
    expect(rows.map((r) => [r.group, r.label, r.values.map((v) => v.label)])).toEqual([
      ['tier', 'Ранг', ['1', '3']],
      ['kind', 'Тип', ['Предметы', 'Расходники']]
    ]);
  });

  it('lets a Spellcast weapon answer all six traits and burden any answer both chips', () => {
    const gear = (id: string, eq: NonNullable<Record_['eq']>): Record_ =>
      row({ id, src: 'core', eq });
    const index = buildIndex({
      items: {},
      eq: [
        gear('w1', {
          t: 'weapon',
          tier: 1,
          cls: 'mag',
          tr: 'spellcast',
          rg: 'melee',
          bu: 'any'
        }),
        gear('w2', { t: 'weapon', tier: 1, cls: 'phy', tr: 'agility', rg: 'far', bu: 1 })
      ]
    });
    const rows = narrowRows(
      facetRows(index, 'eq_weapon', t, 'ru'),
      equipOfKind(index, 'weapon'),
      (it, g) => equipFacets(it)[g] ?? ''
    );
    const of = (g: string): string[] =>
      rows.find((r) => r.group === g)?.values.map((v) => v.value) ?? [];
    expect(of('trait')).toEqual([...CHARACTER_TRAITS]);
    expect(of('burden')).toEqual(['1', '2']);
  });

  describe('on the catalog tables', () => {
    const LOOT = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
    ) as Loot;
    const catalog = buildIndex(LOOT);
    const EQ: Partial<Record<TableId, EquipKind>> = {
      eq_weapon: 'weapon',
      eq_secondary: 'secondary',
      eq_armor: 'armor'
    };
    /* The rows and the accessor TablesPage.svelte gives the table. */
    const drawn = (index: Index, table: TableId): readonly Record_[] => {
      const kind = EQ[table];
      if (kind) return equipOfKind(index, kind);
      if (table === 'other_starting' || table === 'other_frames')
        return otherTableRows(index, table);
      return index.rows.get(table) ?? [];
    };

    for (const table of TABLE_IDS) {
      it(`removes nothing from ${table}`, () => {
        const candidates = facetRows(catalog, table, t, 'ru');
        const valueOf = EQ[table]
          ? (it: Record_, g: string) => equipFacets(it)[g] ?? ''
          : plain;
        expect(narrowRows(candidates, drawn(catalog, table), valueOf)).toEqual(candidates);
      });
    }
  });

  describe('on the homebrew table at the item limit and at three times it', () => {
    for (const n of [100, 300]) {
      it(`bounds the rows by the vocabulary at ${String(n)}`, () => {
        const { index, source, shown } = ownAtScale(n);
        const rows = narrowRows(facetRows(index, 'homebrew', t, 'ru', source), shown, plain);
        expect(rows.map((r) => r.group)).toEqual(['kind', 'sect']);
        expect(rows[0]?.values).toHaveLength(2);
        expect(rows[1]?.values.length).toBeLessThanOrEqual(30);
      });
    }
  });
});
