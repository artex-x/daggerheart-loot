import { describe, expect, it } from 'vitest';
import { buildIndex } from './data.js';
import { dict } from './dict.js';
import { facetRows } from './facets.js';
import { FRAME_ORDER } from './frames.js';
import { groupsFor } from './filters.js';
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

  it('labels the class row by kind: Класс on weapons, Тип урона on secondary', () => {
    const [, , clsWeapon] = facetRows(index, 'eq_weapon', t, 'ru');
    const [, , clsSecondary] = facetRows(index, 'eq_secondary', t, 'ru');
    expect(clsWeapon?.label).toBe('Класс');
    expect(clsSecondary?.label).toBe('Тип урона');
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
