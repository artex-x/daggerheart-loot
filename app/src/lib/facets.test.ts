import { describe, expect, it } from 'vitest';
import { buildIndex, equipFacets, equipOfKind } from './data.js';
import { dict } from './dict.js';
import { facetRows, type FacetValue } from './facets.js';
import { FRAME_ORDER } from './frames.js';
import { decodeFilter, groupsFor, passes } from './filters.js';
import { browseIndex, recordOf, withRecords, type HomebrewRecord } from './homebrew.js';
import { CHARACTER_TRAITS, type EquipKind, type Record_, type TableId } from './types.js';

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
