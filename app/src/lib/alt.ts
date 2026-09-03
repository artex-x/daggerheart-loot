/* The alternate tables: the only mode that rolls two dice at once.
 *
 * Hope and Fear are columns rather than a sum, split by theme - Hope holds
 * what aids and protects, Fear what harms and deceives - so one roll offers
 * one row from each, in both the item and the consumable table. Equal faces
 * are a critical success, which hands the whole rarity over instead of a row.
 *
 * Pure module: it is given the index and a pair of faces and answers with
 * records. What that looks like is the panel's problem.
 */

import type { AltCol, Index } from './data.js';
import type { Dict } from './dict.js';
import { rarityKey } from './label.js';
import type { Rarity } from './money.js';
import { nextRarity } from './roll.js';
import type { Duality } from './roll.js';
import { LOOT_KINDS, allows } from './std.js';
import type { Chosen, LootKind } from './std.js';
import { kindOf } from './data.js';
import type { Record_ } from './types.js';

/** The five rarities, in the order the chips show them. */
export const RARITIES: readonly Rarity[] = [
  'common',
  'uncommon',
  'rare',
  'very_rare',
  'legendary'
];

/**
 * The tiers each rarity is a recommendation for, as the chip captions read
 * them. The book attaches these to rarities rather than to items, and the help
 * says in as many words that they are advice - so they are a caption here and
 * nothing filters on them.
 */
export const RARITY_TIERS: Record<Rarity, string> = {
  common: '1–2',
  uncommon: '1–2',
  rare: '2–3',
  very_rare: '3–4',
  legendary: '3–4'
};

export interface AltPick {
  it: Record_;
  /** Which die found it, which is also the badge the card carries. */
  col: AltCol;
  /** The face that die showed, which stands in for the row number. */
  n: number;
}

/**
 * What one roll offers: up to four rows, item before consumable and Hope
 * before Fear, which is the order the cards are laid out in.
 *
 * A row that does not exist, or whose kind is switched off, is dropped rather
 * than left as a gap.
 */
export function altPicks(
  index: Index,
  rarity: Rarity,
  roll: Duality,
  kinds: Chosen<LootKind>
): AltPick[] {
  const out: AltPick[] = [];
  for (const kind of LOOT_KINDS) {
    for (const col of ['hope', 'fear'] as AltCol[]) {
      const n = roll[col];
      const it = index.altRow(kind, rarity, col, n);
      if (it && allows(kinds, kindOf(it))) out.push({ it, col, n });
    }
  }
  return out;
}

/**
 * A rarity's heading on the alternate tables' own page - off `rarityLabel` in
 * app.js: the rarity's name, then the tiers it is a recommendation for.
 */
export function rarityLabel(r: Rarity, t: Dict): string {
  return `${t[rarityKey(r)]} · ${t.tier} ${RARITY_TIERS[r]}`;
}

export interface AltTable {
  /** The table route the link opens. */
  table: 'alt_item' | 'alt_consumable';
  /** The dictionary key its label is under. */
  label: 'openTable' | 'openItems' | 'openCons';
}

/**
 * Where a critical success can be spent: one link per kind that is switched
 * on, because the player may take any entry of that rarity from either table.
 *
 * With one kind on there is nothing to tell apart, so the label stays general.
 * A single link into the items table used to be the whole offer, and half the
 * choice was left off the screen.
 */
export function altTables(kinds: Chosen<LootKind>): AltTable[] {
  const both = kinds.item && kinds.consumable;
  const out: AltTable[] = [];
  if (kinds.item) out.push({ table: 'alt_item', label: both ? 'openItems' : 'openTable' });
  if (kinds.consumable)
    out.push({ table: 'alt_consumable', label: both ? 'openCons' : 'openTable' });
  /* Nothing on is refused by the chips, so this is the answer to a question
     that cannot be asked from the screen - but a total function is cheaper
     than a caller that has to guard. */
  return out.length ? out : [{ table: 'alt_item', label: 'openTable' }];
}

/* The whole phrase is one dictionary key rather than "bump to" plus a rarity:
   Russian wants the genitive there, and no concatenation of the chip labels
   produces it. Nothing bumps down to common, so common is not a target. */
const BUMP: Partial<Record<Rarity, keyof Dict>> = {
  uncommon: 'bumpUncommon',
  rare: 'bumpRare',
  very_rare: 'bumpVeryRare',
  legendary: 'bumpLegendary'
};

/**
 * The step up a critical success offers, or null at the top of the ladder.
 *
 * The live app reads one past the end of its rarity list and leaves the button
 * out when that is undefined; `nextRarity` clamps instead, so the top is the
 * rarity that answers with itself.
 */
export function bumpUp(from: Rarity): { to: Rarity; label: keyof Dict } | null {
  const to = nextRarity(from);
  const label = BUMP[to];
  return to === from || !label ? null : { to, label };
}
