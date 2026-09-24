/* How a record reads in a language.
 *
 * Two separate things live here, and docs/specs/I18N.md says why they must stay
 * separate: the interface dictionary is small, typed and reviewed, while record
 * text is 1272 pairs maintained with the data. This module only handles the
 * second kind - picking the right field off a record, and turning a stat block
 * into words.
 *
 * The equipment vocabulary follows daggerheart.su, which is the translation the
 * rest of the app quotes, so a weapon reads the same here and there. These maps
 * are not the only copy: `tools/build-share-pages.js`'s own `EQ_*` tables
 * duplicate them for the share stubs in both languages, and `i18n.test.ts`
 * pins the two equal pair for pair.
 *
 * Pure module: the language arrives as an argument. */

import type { Dict } from './dict.js';
import { plural } from './plural.js';
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
  knowledge: ['Знание', 'Knowledge'],
  spellcast: ['Характеристика Заклинателя', 'Spellcast']
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
  '2': ['Двуручное', 'Two-Handed'],
  any: ['Одноручное/двуручное', 'One/Two-Handed']
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

/** The names of several records, comma-separated, in the given order. */
export function namesOf(list: readonly Record_[], lang: Lang): string {
  return list.map((it) => nameOf(it, lang)).join(', ');
}

/* ---------- the stat line ---------- */

/** The words the stat line needs that are not in the vocabulary maps. */
export interface StatLabels {
  tier: string;
  thresholds: string;
  armorScore: string;
  /** Stands in for `tier N` on equipment the book prints among its artifacts. */
  artifact: string;
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
 *
 * `opts.noTier` has no production caller (D11/Q6 - the tier prints everywhere,
 * including on frame equipment). It stays only for `i18n.test.ts`'s old-app
 * parity fixture, which still needs to render a pre-D11 line for `f1`; do not
 * delete it as an unused variant without checking that test first.
 */
export function eqParts(
  it: Record_,
  lang: Lang,
  labels: StatLabels,
  opts: { noType?: boolean; noTier?: boolean } = {}
): string[] {
  const e = it.eq;
  if (!e) return [];

  const out: string[] = opts.noType ? [] : [pick(EQ_TYPE[e.t], lang)];
  if (!opts.noTier)
    out.push(e.tier === 'A' ? labels.artifact : `${labels.tier} ${String(e.tier)}`);

  if (e.t === 'armor') {
    if (e.th) out.push(`${labels.thresholds} ${String(e.th[0])}/${String(e.th[1])}`);
    if (e.as != null) out.push(`${labels.armorScore} ${String(e.as)}`);
  } else {
    /* A character without a Spellcast trait cannot equip a magic weapon, so every
       weapon names its class, secondary too; it is never inferred from the damage type. */
    if (e.cls) out.push(pick(EQ_CLS[e.cls], lang));
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
  opts: { noType?: boolean; noTier?: boolean } = {}
): string {
  return eqParts(it, lang, labels, opts).join(' · ');
}

/* ---------- the list page's selection summary ---------- */

/**
 * Returns a list page's selection summary: the ticked entries, verb and noun
 * agreed with the count, then the taken pieces when they differ -
 * "Выбрана 1 позиция", "Выбрано 4 позиции · 9 шт." (docs/specs/FEATURES.md,
 * "Lists").
 */
export function selCountText(entries: number, pieces: number, lang: Lang, t: Dict): string {
  const head = plural(entries, t.selectedN, lang);
  return pieces === entries ? head : `${head} · ${t.pcsN.replace('%n', String(pieces))}`;
}
