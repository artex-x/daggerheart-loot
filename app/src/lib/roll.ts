/* The roll engines.
 *
 * Six modes, and the only thing they share is that a person may also type the
 * number instead of rolling for it. Randomness arrives as an argument so the
 * engines can be tested for what they guarantee - the range, the clamping, the
 * carry - rather than for what they happened to produce.
 *
 * Pure module: no DOM, no data. */

/** A source of randomness. `Math.random` in the app, something fixed in tests. */
export type Random = () => number;

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

/** One die of n faces, 1..n. */
export function die(n: number, rnd: Random = Math.random): number {
  return 1 + Math.floor(rnd() * n);
}

/**
 * The Core roll: N twelve-sided dice against the same 1-60 table.
 *
 * Rarity only decides how many dice, which is why there is no rarity picker on
 * that screen - each button is labelled with the count and the rarities it
 * covers. Five dice can reach 60 exactly; the clamp is for the input, not the
 * dice.
 */
export function rollNd12(n: number, rnd: Random = Math.random): number {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += die(12, rnd);
  return sum;
}

/** The Core table is 1-60 however the number was arrived at. */
export const CORE_MAX = 60;

export function coreRoll(dice: number, rnd: Random = Math.random): number {
  return clamp(rollNd12(dice, rnd), 1, CORE_MAX);
}

/**
 * The alternate tables roll two dice with names rather than a sum: Hope and
 * Fear pick a column each. Equal faces are a critical success, which is what
 * offers the jump to the table one rarity up.
 */
export interface Duality {
  hope: number;
  fear: number;
}

export function rollDuality(rnd: Random = Math.random): Duality {
  return { hope: die(12, rnd), fear: die(12, rnd) };
}

export const isCrit = (d: Duality): boolean => d.hope === d.fear;

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'very_rare', 'legendary'] as const;

export type Rarity = (typeof RARITY_ORDER)[number];

/** One step up, and no further than the top - a crit on legendary stays there. */
export function nextRarity(r: Rarity): Rarity {
  const at = RARITY_ORDER.indexOf(r);
  return RARITY_ORDER[Math.min(at + 1, RARITY_ORDER.length - 1)] ?? r;
}

/**
 * Where the range is not a real die - 119 in Wondrous, 29 in Dread, a list of
 * whatever length - the button says "Random 1-N" instead of naming a die that
 * does not exist. Same call either way; only the label differs.
 */
export function pick(count: number, rnd: Random = Math.random): number {
  return count > 0 ? die(count, rnd) : 0;
}

/** Whether a range has a die of its own, which is what the label turns on. */
export const REAL_DICE = [4, 6, 8, 10, 12, 20, 100] as const;

export function hasRealDie(count: number): boolean {
  return (REAL_DICE as readonly number[]).includes(count);
}
