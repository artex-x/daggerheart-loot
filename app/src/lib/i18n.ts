/* How a record reads in a language.
 *
 * Two separate things live here, and docs/specs/I18N.md says why they must stay
 * separate: the interface dictionary is small, typed and reviewed, while record
 * text is 1061 pairs maintained with the data. This module only handles the
 * second kind - picking the right field off a record, and turning a stat block
 * into words.
 *
 * The equipment vocabulary follows daggerheart.su, which is the translation the
 * rest of the app quotes, so a weapon reads the same here and there. These maps
 * are the single place those words live.
 *
 * Pure module: the language arrives as an argument. */

import type {
  DamageType,
  EquipClass,
  EquipKind,
  Lang,
  Range,
  Record_,
  Trait
} from './types.js';

/** A Russian and an English word for the same thing. */
type Pair = readonly [string, string];

const pick = (p: Pair | undefined, lang: Lang): string => (p ? p[lang === 'ru' ? 0 : 1] : '');

export const EQ_TYPE: Record<EquipKind, Pair> = {
  weapon: ['Основное оружие', 'Primary weapon'],
  secondary: ['Вторичное оружие', 'Secondary weapon'],
  armor: ['Броня', 'Armor']
};

export const EQ_TRAIT: Record<Trait, Pair> = {
  agility: ['Проворность', 'Agility'],
  strength: ['Сила', 'Strength'],
  finesse: ['Искусность', 'Finesse'],
  instinct: ['Инстинкт', 'Instinct'],
  presence: ['Влияние', 'Presence'],
  knowledge: ['Знание', 'Knowledge']
};

export const EQ_RANGE: Record<Range, Pair> = {
  melee: ['Вплотную', 'Melee'],
  veryclose: ['Близко', 'Very Close'],
  close: ['Средне', 'Close'],
  far: ['Далеко', 'Far'],
  veryfar: ['Очень далеко', 'Very Far']
};

export const EQ_DT: Record<DamageType, Pair> = {
  phy: ['физ', 'phy'],
  mag: ['маг', 'mag'],
  any: ['физ/маг', 'phy/mag']
};

export const EQ_BURDEN: Record<string, Pair> = {
  '1': ['Одноручное', 'One-Handed'],
  '2': ['Двуручное', 'Two-Handed']
};

export const EQ_CLS: Record<EquipClass, Pair> = {
  phy: ['Физическое', 'Physical'],
  mag: ['Магическое', 'Magic']
};

export const EQ_LINE: Record<string, Pair> = {
  line: ['Улучшаемые', 'Upgradable'],
  uniq: ['Уникальные', 'Unique']
};

export const eqWord = (
  map: Record<string, Pair>,
  key: string | undefined,
  lang: Lang
): string => (key == null ? '' : pick(map[key], lang));

/* ---------- record text ---------- */

/**
 * Russian falls back to English per field, because a record may arrive before
 * its translation does. English never falls back: English is the source.
 */
export function nameOf(it: Record_, lang: Lang): string {
  return lang === 'ru' ? it.ru || it.en : it.en;
}

export function descOf(it: Record_, lang: Lang): string {
  return lang === 'ru' ? it.rud || it.ende : it.ende;
}

/* ---------- the stat line ---------- */

/** The three words the stat line needs that are not in the vocabulary maps. */
export interface StatLabels {
  tier: string;
  thresholds: string;
  armorScore: string;
}

/**
 * A stat block as a list of pieces, in the order the card and the table row
 * both use. Joined with a middle dot wherever one line is enough.
 *
 * The tier is on every piece of equipment, always taken from a book. Wondrous
 * does not print one next to the item, but its "Loot items by environment"
 * table binds each piece to a location and the location has a tier. It is never
 * guessed from the stats: damage bands for adjacent tiers overlap, and the
 * guess that used to live here lied.
 */
export function eqParts(
  it: Record_,
  lang: Lang,
  labels: StatLabels,
  opts: { noType?: boolean } = {}
): string[] {
  const e = it.eq;
  if (!e) return [];

  const out: string[] = opts.noType ? [] : [pick(EQ_TYPE[e.t], lang)];
  out.push(`${labels.tier} ${String(e.tier)}`);

  if (e.t === 'armor') {
    if (e.th) out.push(`${labels.thresholds} ${e.th[0] ?? ''}/${e.th[1] ?? ''}`);
    if (e.as != null) out.push(`${labels.armorScore} ${String(e.as)}`);
  } else {
    /* A magic weapon stays a magic weapon even when its damage can be physical,
       which is why the class is printed and not inferred from the damage type. */
    if (e.t === 'weapon' && e.cls) out.push(pick(EQ_CLS[e.cls], lang));
    out.push(eqWord(EQ_TRAIT, e.tr, lang));
    out.push(eqWord(EQ_RANGE, e.rg, lang));
    out.push((e.dmg ?? '') + (e.dt ? ' ' + pick(EQ_DT[e.dt], lang) : ''));
    out.push(eqWord(EQ_BURDEN, e.bu == null ? undefined : String(e.bu), lang));
  }
  return out.filter(Boolean);
}

export function eqLine(
  it: Record_,
  lang: Lang,
  labels: StatLabels,
  opts: { noType?: boolean } = {}
): string {
  return eqParts(it, lang, labels, opts).join(' · ');
}
