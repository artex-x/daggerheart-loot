import { describe, expect, it } from 'vitest';
import { buildIndex } from './data.js';
import { dict } from './dict.js';
import { facetRows } from './facets.js';
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
    expect(facetRows(index, 'wondrous', t)).toEqual([
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
    const [row0] = facetRows(index, 'dread', t);
    expect(row0?.values.map((v) => v.value)).toEqual(['item', 'equip']);
  });

  it('answers nothing for a table with only one kind', () => {
    const index = buildIndex({
      items: { core_item: [row({ id: 'ci1' })] }
    });
    expect(facetRows(index, 'core_item', t)).toEqual([]);
  });

  it('answers nothing for a table with a kind facet but no rows at all', () => {
    const index = buildIndex({ items: { core_item: [row({ id: 'ci1' })] } });
    expect(facetRows(index, 'wondrous', t)).toEqual([]);
  });

  it('answers nothing for a table with no kind facet at all', () => {
    const index = buildIndex({
      items: { community: [row({ id: 'c1', kind: 'consumable' }), row({ id: 'c2' })] }
    });
    expect(facetRows(index, 'community', t)).toEqual([]);
  });
});
