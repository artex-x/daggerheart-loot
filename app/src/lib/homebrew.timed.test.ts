/* The account's own cards at three times the card limit, each holding the most book items,
 * in the `timed` project: the bound is a time (vite.config.mts, `timed`). */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex, type Loot } from './data.js';
import { CARD_ITEMS_MAX, withRecords, type CardRef } from './homebrew.js';

const loot = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
) as Loot;
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
