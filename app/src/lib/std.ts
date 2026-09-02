/* Core rules: one roll over two books at once.
 *
 * The table is 1-60 whatever you pick, and the number of d12 only decides the
 * rarity band you are rolling for - so the dice counts are the buttons and the
 * rarity each one covers is the caption under it. A roll returns up to four
 * records, because each chosen source contributes both an item and a
 * consumable, and the player takes one of them.
 */

import { kindOf } from './data.js';
import type { Index } from './data.js';
import type { Kind, Record_ } from './types.js';

/** How many d12 each rarity is rolled with, from the Core book. */
const DICE: Record<string, readonly number[]> = {
  common: [1, 2],
  uncommon: [2, 3],
  rare: [3, 4],
  legendary: [4, 5]
};

export interface DiceChoice {
  /** How many d12 this button rolls. */
  n: number;
  /** The rarity bands it covers, in the order the book lists them. */
  rarities: string[];
}

/**
 * The five buttons, read the other way round from `DICE`.
 *
 * The counts overlap - 2d12 is both Common and Uncommon - so a button carries
 * a list rather than one word, and the caption joins them.
 */
export const NDICE: DiceChoice[] = [1, 2, 3, 4, 5].map((n) => ({
  n,
  rarities: Object.keys(DICE).filter((r) => DICE[r]?.includes(n))
}));

/** The two books this section rolls over, in the order the chips show them. */
export const SOURCES = ['core', 'hnf'] as const;
export type Source = (typeof SOURCES)[number];

/** Which kinds the roll can return. Nothing here rolls equipment. */
export const LOOT_KINDS = ['item', 'consumable'] as const;
export type LootKind = (typeof LOOT_KINDS)[number];

export type Chosen<K extends string> = Record<K, boolean>;

/**
 * The records one roll produces, in the order the live app lays them out.
 *
 * Two per chosen source - the item table and the consumable table - so four
 * with both books on, and the player takes one. A row that does not exist in a
 * table is dropped rather than left as a gap: the tables are the same length
 * in practice, but a short one must not shift the others.
 */
export function poolFor(
  index: Index,
  n: number,
  sources: Chosen<Source>,
  kinds: Chosen<LootKind>
): Record_[] {
  const out: Record_[] = [];
  for (const src of SOURCES) {
    if (!sources[src]) continue;
    for (const kind of LOOT_KINDS) {
      const row = index.rows.get(`${src}_${kind}`)?.[n - 1];
      if (row) out.push(row);
    }
  }
  return out.filter((it) => allows(kinds, kindOf(it)));
}

/** Whether a kind is switched on. Equipment never is: nothing rolls it. */
export function allows(kinds: Chosen<LootKind>, kind: Kind): boolean {
  return kind !== 'equip' && kinds[kind];
}

/**
 * Whether turning this one off would leave nothing on.
 *
 * The live app refuses rather than allowing an empty roll, and says why in the
 * button's title - so the control has to know it is the last one before it is
 * pressed, not after.
 */
export function isLastOn<K extends string>(
  chosen: Chosen<K>,
  keys: readonly K[],
  key: K
): boolean {
  return chosen[key] && keys.filter((k) => chosen[k]).length === 1;
}
