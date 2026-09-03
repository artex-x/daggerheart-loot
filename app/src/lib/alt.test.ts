/* The alternate tables, against the real data rather than an invented pair of
   columns: what the panel draws is what these tables hold, and a fixture that
   agreed with the code would prove nothing about either. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RARITIES, RARITY_TIERS, altPicks, altTables, bumpUp } from './alt.js';
import { buildIndex, kindOf, type Loot } from './data.js';
import { isCrit, nextRarity } from './roll.js';

const LOOT = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', '..', 'data.json'), 'utf8')
) as Loot;

const index = buildIndex(LOOT);
const both = { item: true, consumable: true };

describe('a roll on the alternate tables', () => {
  it('offers one row per kind and column, item before consumable', () => {
    const picks = altPicks(index, 'common', { hope: 3, fear: 7 }, both);
    expect(picks.map((p) => p.col)).toEqual(['hope', 'fear', 'hope', 'fear']);
    expect(picks.map((p) => kindOf(p.it))).toEqual([
      'item',
      'item',
      'consumable',
      'consumable'
    ]);
  });

  it('reads the face as the row number, not as a search', () => {
    /* The first column of common items, straight out of the data. */
    const hope = LOOT.alt?.item?.common?.hope ?? [];
    for (const n of [1, 6, 12]) {
      const picks = altPicks(index, 'common', { hope: n, fear: n }, both);
      expect(picks[0]?.it.id).toBe(hope[n - 1]);
      expect(picks[0]?.n).toBe(n);
    }
  });

  it('carries the same record under a different face in another rarity', () => {
    /* Both columns of both kinds exist at every rarity, so a face always
       finds four rows - which is what makes a missing one worth reporting. */
    for (const r of RARITIES) {
      const picks = altPicks(index, r, { hope: 1, fear: 12 }, both);
      expect(picks, r).toHaveLength(4);
    }
  });

  it('drops a kind that is switched off rather than leaving a gap', () => {
    const items = altPicks(
      index,
      'rare',
      { hope: 2, fear: 5 },
      {
        item: true,
        consumable: false
      }
    );
    expect(items).toHaveLength(2);
    expect(items.every((p) => kindOf(p.it) === 'item')).toBe(true);

    const cons = altPicks(
      index,
      'rare',
      { hope: 2, fear: 5 },
      {
        item: false,
        consumable: true
      }
    );
    expect(cons.every((p) => kindOf(p.it) === 'consumable')).toBe(true);
  });

  it('has nothing to offer for a face no column reaches', () => {
    /* Every column is twelve rows because the dice are d12; a thirteenth face
       cannot happen at the table and must not invent a row here. */
    expect(altPicks(index, 'common', { hope: 13, fear: 13 }, both)).toEqual([]);
  });
});

describe('a critical success', () => {
  it('is the two dice agreeing, whatever they agreed on', () => {
    expect(isCrit({ hope: 4, fear: 4 })).toBe(true);
    expect(isCrit({ hope: 4, fear: 5 })).toBe(false);
  });

  it('opens both tables when both kinds are on, and names each', () => {
    expect(altTables(both)).toEqual([
      { table: 'alt_item', label: 'openItems' },
      { table: 'alt_consumable', label: 'openCons' }
    ]);
  });

  it('leaves the label general when there is only one table to open', () => {
    expect(altTables({ item: true, consumable: false })).toEqual([
      { table: 'alt_item', label: 'openTable' }
    ]);
    expect(altTables({ item: false, consumable: true })).toEqual([
      { table: 'alt_consumable', label: 'openTable' }
    ]);
  });

  it('still answers with a table when nothing is on', () => {
    /* The chips refuse to turn the last kind off, so this is unreachable from
       the screen. It stays total so no caller has to guard it. */
    expect(altTables({ item: false, consumable: false })).toEqual([
      { table: 'alt_item', label: 'openTable' }
    ]);
  });

  it('steps up one rarity, and stops at the top', () => {
    expect(nextRarity('common')).toBe('uncommon');
    expect(nextRarity('very_rare')).toBe('legendary');
    expect(nextRarity('legendary')).toBe('legendary');
  });

  it('names the step up as one phrase, because Russian needs the genitive', () => {
    expect(bumpUp('common')).toEqual({ to: 'uncommon', label: 'bumpUncommon' });
    expect(bumpUp('very_rare')).toEqual({ to: 'legendary', label: 'bumpLegendary' });
  });

  it('offers no step up from the top rarity', () => {
    /* The live app reads one past the end of its list and leaves the button
       out; nothing must invent a sixth rarity to bump into. */
    expect(bumpUp('legendary')).toBe(null);
  });
});

describe('the rarity chips', () => {
  it('caption every rarity with the tiers the book recommends it for', () => {
    expect(RARITIES.map((r) => RARITY_TIERS[r])).toEqual(['1–2', '1–2', '2–3', '3–4', '3–4']);
  });
});
