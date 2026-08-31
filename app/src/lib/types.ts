/* Domain types. Plain descriptions of what sits in data.js and what the address
   bar understands - with no assumption about who renders any of it. */

export type Lang = 'ru' | 'en';

export type Kind = 'item' | 'consumable' | 'equip';

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
  'frames',
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
  th?: string | null;
  /** `id` of the first item in the upgrade line; empty on one-offs. */
  line?: string;
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
  tier?: VoaTier;
  recall?: number;
  frame?: string;
  community?: string;
}
