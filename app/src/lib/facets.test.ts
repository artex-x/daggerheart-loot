import { describe, expect, it } from 'vitest';
import { buildIndex } from './data.js';
import { dict } from './dict.js';
import { facetRows } from './facets.js';
import { FRAME_ORDER } from './frames.js';
import type { Record_ } from './types.js';

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
    const [frameRow] = facetRows(index, 'frames', t, 'ru');
    expect(frameRow?.values.map((v) => v.value)).toEqual(FRAME_ORDER);
    expect(frameRow?.values.find((v) => v.value === 'beast_feast')?.label).toBe('Пир зверей');
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
