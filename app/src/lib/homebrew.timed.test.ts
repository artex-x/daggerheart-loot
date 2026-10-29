/* The account's own cards at three times the card limit, each holding the most book items,
 * in the `timed` project: the bound is a time (vite.config.mts, `timed`). */

import { describe, expect, it } from 'vitest';
import { buildIndex } from './data.js';
import { CARD_ITEMS_MAX, recordOf, withRecords, type CardRef } from './homebrew.js';
import { readLoot } from '../test/loot.js';

const loot = readLoot();
const catalog = buildIndex(loot);
const ids = [...catalog.byId.keys()];

describe('the own cards at three times the card limit', () => {
  it('applies 300 cards of 100 book items each in under 50 ms', () => {
    const cards: CardRef[] = Array.from({ length: 300 }, (_, i) => ({
      key:
        'hb_c' +
        String(i)
          .padStart(3, '0')
          .replace(/\d/g, (d) => 'abcdefghij'.charAt(+d)) +
        'aaaaaaaaaaaa',
      kind: i % 2 ? 'ref' : 'set',
      en: 'Card ' + String(i),
      items: ids.slice(
        (i * 7) % (ids.length - CARD_ITEMS_MAX),
        ((i * 7) % (ids.length - CARD_ITEMS_MAX)) + CARD_ITEMS_MAX
      )
    }));
    const start = performance.now();
    const index = withRecords(catalog, [], [], cards);
    expect(performance.now() - start).toBeLessThan(50);
    expect(index.ownSetOf.size).toBeGreaterThan(0);
    expect(index.ownRefsOf.size).toBeGreaterThan(0);
  });
});

describe("the item editor's preview index at three times the item limit", () => {
  it('builds the catalog with 300 own records of 3000-character texts in under 16 ms', () => {
    const text = 'Слово '.repeat(500);
    const own = Array.from({ length: 300 }, (_, i) =>
      recordOf(
        'hb_' +
          String(i)
            .padStart(16, 'a')
            .replace(/\d/g, (d) => 'abcdefghij'.charAt(+d)),
        { kind: 'item', ru: 'Предмет ' + String(i), rud: text },
        null,
        [],
        '00000000-0000-4000-8000-' + String(i).padStart(12, '0'),
        null
      )
    );
    const start = performance.now();
    const index = withRecords(catalog, own, [], []);
    /* One keystroke rebuilds it (`HomebrewEditor.svelte`, `previewIndex`): 0.7-1.4 ms
       measured 2026-10-15 on this host, so it stays built on every keystroke. */
    expect(performance.now() - start).toBeLessThan(16);
    expect(index.byId.size).toBe(catalog.byId.size + 300);
  });
});
