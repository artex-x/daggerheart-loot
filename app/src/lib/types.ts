/* Domain types. Plain descriptions of what sits in data.js and what the address
   bar understands - with no assumption about who renders any of it. */

import type { FrameId } from './frames.js';

export type Lang = 'ru' | 'en';

/** The three kinds a record can filter under - Core rules, the alternate
 *  tables and search all narrow by these, search over all three at once. */
export const KINDS = ['item', 'consumable', 'equip'] as const;
export type Kind = (typeof KINDS)[number];

export type EquipKind = 'weapon' | 'secondary' | 'armor';

export type DamageType = 'phy' | 'mag' | 'any';

/** Which section of the book a weapon is printed in. Not the damage type. */
export type EquipClass = 'phy' | 'mag';

export type Trait = 'agility' | 'strength' | 'finesse' | 'instinct' | 'presence' | 'knowledge';

export type Range = 'melee' | 'veryclose' | 'close' | 'far' | 'veryfar';

/** Equipment tier. Always from a book: never inferred from the stats. */
export type Tier = 1 | 2 | 3 | 4;

/** Vault of Ages adds artifacts and cursed objects on top of the tiers. */
export type VoaTier = Tier | 'A' | 'C';

export const TABLE_IDS = [
  'core_item',
  'core_consumable',
  'hnf_item',
  'hnf_consumable',
  'wondrous',
  'community',
  'dread',
  'voa',
  'other_starting',
  'other_frames',
  'alt_item',
  'alt_consumable',
  'eq_weapon',
  'eq_secondary',
  'eq_armor'
] as const;

export type TableId = (typeof TABLE_IDS)[number];

export function isTableId(v: string): v is TableId {
  return (TABLE_IDS as readonly string[]).includes(v);
}

/** The nine sections: also the tabs, also what may be pinned as the start. */
export const SECTIONS = [
  'roll/std',
  'roll/alt',
  'roll/wondrous',
  'roll/dread',
  'roll/voa',
  'roll/community',
  'tables',
  'lists',
  'search'
] as const;

export type Section = (typeof SECTIONS)[number];

export function isSection(v: string): v is Section {
  return (SECTIONS as readonly string[]).includes(v);
}

/** The stat block. Not only records in `eq` carry one. */
export interface Equip {
  t: EquipKind;
  tier: Tier;
  cls?: EquipClass;
  tr?: Trait;
  rg?: Range;
  dmg?: string;
  dt?: DamageType;
  /** Burden: 1 one-handed, 2 two-handed. */
  bu?: 1 | 2;
  /** Armour Score and base thresholds - armour only. */
  as?: number | null;
  /** Minor and major damage thresholds - the pair the data actually carries. */
  th?: readonly [number, number] | null;
  /** `id` of the first item in the upgrade line; empty on one-offs. */
  line?: string;
  /** A versatile weapon's second stat block - the print card draws both. */
  alt?: Pick<Equip, 'tr' | 'rg' | 'dmg' | 'dt'>;
}

/**
 * A rulebook card a description points at, carried in the data so the text
 * travels with the record rather than sending the reader to a website.
 * `url` is the Russian page; the English one differs by subdomain.
 */
export interface RefCard {
  en: string;
  ensub: string;
  ende: string;
  ru: string;
  rusub: string;
  rud: string;
  url: string;
}

export interface Record_ {
  id: string;
  src: string;
  kind: Kind;
  en: string;
  ende: string;
  ru: string;
  rud: string;
  img?: string;
  /** Number in its own table. */
  roll?: number;
  /** `id` of what this upgrades into. Only one direction is stored. */
  craft?: string;
  /** Keys into `refs`: the Core cards a description points at. */
  refs?: string[];
  eq?: Equip;
  /** Vault of Ages section only - not equipment tier, which lives on
   * `eq.tier` and is required there. The two overlap on 1-4 by coincidence
   * of range, not by meaning: never read this field where `eq.tier` is
   * meant, and never derive either from stats (`CLAUDE.md`). */
  tier?: VoaTier;
  recall?: number;
  frame?: FrameId;
  starting?: boolean;
  community?: string;
  community_ru?: string;
}
