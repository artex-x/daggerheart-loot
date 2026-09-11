/* Prices: how a number of coins is spoken, and what a thing is worth.
 *
 * A price is always stored as a whole number of coins. The conversion lives
 * only here, so the display mode can never damage the data. The core book talks
 * in handfuls, bags and chests rather than hundreds of coins, and a list where
 * everything costs "750 gold" reads worse than one made of bags.
 *
 * Pure module: the language arrives as an argument, not from any state. */

import type { Dict } from './dict.js';
import type { Lang, Record_, VoaTier } from './types.js';

export type MoneyMode = 'bag' | 'coin';

/** The book's own units first; coins are the optional rule, hence the default. */
export const MONEY_MODES: readonly MoneyMode[] = ['bag', 'coin'];
export const MONEY_DEFAULT: MoneyMode = 'bag';

/**
 * The mode a list displays its prices in - the live `moneyMode` (app.js
 * 1290-1292). Untrusted storage may hold anything in `money`, so the value is
 * checked against `MONEY_MODES` rather than trusted outright.
 */
export function moneyMode(list: { money?: MoneyMode } | null | undefined): MoneyMode {
  return list?.money && (MONEY_MODES as readonly string[]).includes(list.money)
    ? list.money
    : MONEY_DEFAULT;
}

interface Step {
  n: number;
  ru: [string, string, string];
  en: [string, string];
}

const MONEY_STEP: readonly Step[] = [
  { n: 1000, ru: ['сундук', 'сундука', 'сундуков'], en: ['chest', 'chests'] },
  { n: 100, ru: ['мешок', 'мешка', 'мешков'], en: ['bag', 'bags'] },
  { n: 10, ru: ['горсть', 'горсти', 'горстей'], en: ['handful', 'handfuls'] },
  { n: 1, ru: ['монета', 'монеты', 'монет'], en: ['coin', 'coins'] }
];

/**
 * Russian needs one of three forms by the last digits; English needs two.
 * Anything that counts things in Russian needs this - do not write "3 монета".
 */
export function moneyWord(step: Step, n: number, lang: Lang): string {
  if (lang !== 'ru') return step.en[n === 1 ? 0 : 1];
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return step.ru[0];
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return step.ru[1];
  return step.ru[2];
}

/**
 * How a price reads: at most two units, rounded to the nearest, the way money
 * is spoken of at the table. 750 is 7 bags 5 handfuls; 899 is already 9 bags;
 * 804 is simply 8 bags, because four coins on top add nothing but precision
 * nobody came here for.
 *
 * The sum is rounded to the unit the string will end on *before* it is broken
 * up, so a carry ("10 handfuls" becoming a bag) falls out on its own instead of
 * having to be caught afterwards.
 */
export function priceText(
  coins: number,
  mode: MoneyMode,
  lang: Lang,
  coinWord = lang === 'ru' ? 'зол.' : 'gp'
): string {
  const n = Math.max(0, Math.round(coins) || 0);
  if (!n) return '';
  if (mode !== 'bag') return `${String(n)} ${coinWord}`;

  /* Coins do not appear in this reading at all, so the smallest unit is a
     handful, and anything under one rounds up to it rather than reading empty. */
  const steps = MONEY_STEP.filter((s) => s.n >= 10);
  const top = steps.find((s) => n >= s.n) ?? steps[steps.length - 1];
  if (!top) return '';
  const next = steps[steps.indexOf(top) + 1] ?? top;
  const res = next.n;
  const rounded = Math.max(res, Math.round(n / res) * res);

  const out: string[] = [];
  let left = rounded;
  for (const st of steps) {
    if (out.length >= 2 || left < st.n) continue;
    const v = Math.floor(left / st.n);
    out.push(`${String(v)} ${moneyWord(st, v, lang)}`);
    left -= v * st.n;
  }
  return out.join(' ');
}

/* ---------- what a thing is worth ----------
   A suggestion, not a price list. Equipment is read off its tier, loot off its
   rarity; where there is no rarity the middle of the scale is honester than a
   number invented from the name. */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';

export type Band = readonly [number, number];

const GUESS_EQ: Record<string, readonly Band[]> = {
  weapon: [
    [20, 30],
    [100, 150],
    [500, 700],
    [1000, 1500]
  ],
  secondary: [
    [20, 30],
    [100, 150],
    [500, 700],
    [1000, 1500]
  ],
  armor: [
    [20, 40],
    [150, 200],
    [600, 800],
    [1500, 2000]
  ]
};

const GUESS_RAR: Record<'item' | 'consumable', Record<Rarity, Band>> = {
  item: {
    common: [80, 120],
    uncommon: [150, 250],
    rare: [400, 600],
    very_rare: [800, 1200],
    legendary: [1500, 2500]
  },
  consumable: {
    common: [15, 25],
    uncommon: [30, 50],
    rare: [50, 70],
    very_rare: [70, 90],
    legendary: [100, 150]
  }
};

/** Vault of Ages carries a tier where other sets carry a rarity. */
const TIER_RAR: Record<string, Rarity> = {
  '1': 'common',
  '2': 'uncommon',
  '3': 'rare',
  '4': 'very_rare',
  A: 'legendary',
  C: 'legendary'
};

/**
 * The band a record falls in, or null when there is nothing to go on.
 *
 * `rarityOf` is the alternate tables read backwards: they are the only place a
 * loot record's rarity is written down. Records outside them - Wondrous, Dread,
 * community - have none, and get the middle of the scale.
 */
export function guessBand(
  it: Record_,
  rarityOf: (id: string) => Rarity | undefined
): Band | null {
  if (it.eq) {
    const byKind = GUESS_EQ[it.eq.t];
    return byKind?.[it.eq.tier - 1] ?? null;
  }
  const kind = it.kind === 'consumable' ? 'consumable' : 'item';
  const r = rarityOf(it.id) ?? (it.tier == null ? undefined : TIER_RAR[String(it.tier)]);
  return r ? GUESS_RAR[kind][r] : GUESS_RAR[kind].uncommon;
}

/** The middle of the band, or 0 when the record gives nothing to go on. */
export function guessPrice(it: Record_, rarityOf: (id: string) => Rarity | undefined): number {
  const band = guessBand(it, rarityOf);
  return band ? Math.round((band[0] + band[1]) / 2) : 0;
}

/**
 * Shift a price by a percentage.
 *
 * Rounded to a whole number, because a price is coins and there are no
 * fractional coins, and never allowed to reach zero - that would not be a
 * discount, it would lose the price altogether.
 */
export function reprice(gold: number, percent: number): number {
  return Math.max(1, Math.round((gold * (100 + percent)) / 100));
}

/** `Rarity` read back into the dictionary key that names it (app.js's `RAR_KEY`). */
const RAR_KEY: Record<Rarity, keyof Dict> = {
  common: 'common',
  uncommon: 'uncommon',
  rare: 'rare',
  very_rare: 'veryRare',
  legendary: 'legendary'
};

/** Vault of Ages tiers 1-4 read "Tier N"; 'A' and 'C' are the artifact and
 *  cursed-object sections, which are not tiers at all (app.js's `voaTierName`,
 *  920-924). */
function voaTierName(tier: VoaTier, t: Dict): string {
  if (tier === 'A') return t.voaArtifact;
  if (tier === 'C') return t.voaCursed;
  return `${t.tier} ${String(tier)}`;
}

/**
 * The band's own label - which fact it was read off: a rank for equipment, a
 * rarity for loot the alternate tables know, a Vault of Ages tier where
 * there is one, or a plain admission that none of those apply. The live
 * `guessWhy` (app.js 831-842).
 */
export function guessWhy(
  it: Record_,
  rarityOf: (id: string) => Rarity | undefined,
  t: Dict
): string {
  const band = guessBand(it, rarityOf);
  if (!band) return t.guessNoTier;
  const rarity = rarityOf(it.id);
  const src = it.eq
    ? `${t.tier} ${String(it.eq.tier)}`
    : rarity
      ? t[RAR_KEY[rarity]]
      : it.tier != null
        ? voaTierName(it.tier, t)
        : t.guessNoRarity;
  return `${src} · ${String(band[0])}–${String(band[1])} ${t.goldUnit}`;
}
