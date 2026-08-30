/* Randomness is an argument here, so these check what the engines guarantee -
   the range, the clamp, the carry - not what one draw happened to produce. */
import { describe, expect, it } from 'vitest';
import {
  clamp,
  coreRoll,
  CORE_MAX,
  die,
  hasRealDie,
  isCrit,
  nextRarity,
  pick,
  RARITY_ORDER,
  rollDuality,
  rollNd12,
  type Random
} from './roll.js';

/** Always the lowest face, always the highest, and a cycle in between. */
const lowest: Random = () => 0;
const highest: Random = () => 0.999999;
const cycle = (...vals: number[]): Random => {
  let i = 0;
  return () => vals[i++ % vals.length] ?? 0;
};

describe('one die', () => {
  it('never falls outside its faces', () => {
    expect(die(12, lowest)).toBe(1);
    expect(die(12, highest)).toBe(12);
    for (let i = 0; i < 500; i++) {
      const v = die(20);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(20);
    }
  });

  it('covers every face over enough draws', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(die(6));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('the Core roll', () => {
  it('is N twelve-sided dice', () => {
    expect(rollNd12(1, lowest)).toBe(1);
    expect(rollNd12(5, lowest)).toBe(5);
    expect(rollNd12(5, highest)).toBe(60);
  });

  it('reaches the end of the table on five dice and no further', () => {
    /* Five dice can make 60 exactly, which is why the table is 60 long */
    expect(coreRoll(5, highest)).toBe(CORE_MAX);
  });

  it('never leaves the table', () => {
    for (const dice of [1, 2, 3, 4, 5]) {
      for (let i = 0; i < 200; i++) {
        const v = coreRoll(dice);
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(CORE_MAX);
      }
    }
  });

  it('clusters in the middle on several dice, which is the rules, not the generator', () => {
    /* The sum of Nd12 is triangular. This is why "the same thing keeps coming
       up" is a fair impression and still not a defect. */
    const counts = new Map<number, number>();
    for (let i = 0; i < 20000; i++) {
      const v = rollNd12(2);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const mid = counts.get(13) ?? 0;
    const edge = counts.get(2) ?? 0;
    expect(mid).toBeGreaterThan(edge * 5);
  });
});

describe('the alternate tables', () => {
  it('roll two named dice, not a sum', () => {
    const d = rollDuality(cycle(0, 0.999999));
    expect(d).toEqual({ hope: 1, fear: 12 });
  });

  it('call equal faces a critical success', () => {
    expect(isCrit({ hope: 7, fear: 7 })).toBe(true);
    expect(isCrit({ hope: 7, fear: 8 })).toBe(false);
  });

  it('offer one step up on a crit', () => {
    expect(nextRarity('common')).toBe('uncommon');
    expect(nextRarity('very_rare')).toBe('legendary');
  });

  it('stop at the top rather than falling off it', () => {
    expect(nextRarity('legendary')).toBe('legendary');
  });

  it('keep the rarities in the order the book prints them', () => {
    expect(RARITY_ORDER).toEqual(['common', 'uncommon', 'rare', 'very_rare', 'legendary']);
  });
});

describe('ranges that are not a die', () => {
  it('still pick within the range', () => {
    expect(pick(119, lowest)).toBe(1);
    expect(pick(119, highest)).toBe(119);
    expect(pick(29, highest)).toBe(29);
  });

  it('return nothing for an empty set rather than a phantom entry', () => {
    /* A list with no entries has nothing to roll; 1 would point at nothing */
    expect(pick(0)).toBe(0);
  });

  it('know which counts have a die of their own', () => {
    /* This is what decides between "d12" and "Random 1-N" on the button */
    expect(hasRealDie(12)).toBe(true);
    expect(hasRealDie(100)).toBe(true);
    expect(hasRealDie(119)).toBe(false);
    expect(hasRealDie(29)).toBe(false);
  });
});

describe('clamp', () => {
  it('keeps a typed number inside the table', () => {
    expect(clamp(0, 1, 60)).toBe(1);
    expect(clamp(61, 1, 60)).toBe(60);
    expect(clamp(30, 1, 60)).toBe(30);
  });
});
