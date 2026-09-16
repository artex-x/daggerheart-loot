/* The words a badge carries, off app.js.
 *
 * `srcLabel` names the book a record comes from, and a community record names
 * the community instead - beside other communities the book is obvious, and the
 * community is the thing that tells them apart.
 *
 * `badgeKind` is the class the badge takes, which is not the same vocabulary as
 * `kindOf` in data.ts: that answers "what does this count as when filtering",
 * and this answers "which of the two colours does the chip take". Equipment
 * carries an item badge, because on a card it is a thing you have. */

import { dict } from './dict.js';
import { frameName } from './frames.js';
import { EQ_TYPE, eqWord } from './i18n.js';
import type { Dict } from './dict.js';
import type { Lang, Record_, TableId } from './types.js';

export function badgeKind(it: Record_): 'item' | 'cons' {
  return it.kind === 'consumable' ? 'cons' : 'item';
}

/** Campaign-frame records are presented as setting material even when a
 * starter (notably f95) carries ordinary equipment metadata too. */
export function isFrameRecord(it: Record_): boolean {
  return !!it.frame || it.src === 'frame';
}

export interface Badge {
  /** The modifier on `.badge` in style.css, which is what colours it. */
  cls: string;
  text: string;
  /** A hover explanation, where the live app gives one. */
  title?: string;
}

/**
 * The badges on a card, in the order the live app prints them.
 *
 * Three of them are conditional and each says something no other line does.
 * Equipment names the kind of gear rather than "item", because on a card that
 * is what you have. "Уникальное" marks a piece the book prints at one tier -
 * not a gap in the data, but a thing you cannot take one tier higher, and the
 * word is the one the "Линия" filter uses. The tier badge appears only for
 * artifacts and cursed objects: those are categories that exist nowhere else,
 * while a numeric tier is already in the stat row or in the table heading.
 */
export function cardBadges(it: Record_, lang: Lang, t: Dict): Badge[] {
  const out: Badge[] = [];

  if (it.eq) {
    out.push({ cls: `eq-${it.eq.t}`, text: eqWord(EQ_TYPE, it.eq.t, lang) });
    /* A named thing rather than a rung on a ladder. */
    if (!it.eq.line) out.push({ cls: 'uniq', text: t.unique, title: t.uniqueHint });
  } else {
    out.push({ cls: badgeKind(it), text: it.kind === 'consumable' ? t.cons : t.item });
  }

  if (it.tier === 'A') out.push({ cls: 'tier', text: t.voaArtifact1 });
  else if (it.tier === 'C') out.push({ cls: 'tier', text: t.voaCursed1 });

  return out;
}

/**
 * The dictionary key a rarity's name is under.
 *
 * Only `very_rare` differs, and it differs in the one place a dictionary key
 * cannot carry an underscore. Two screens name rarities - the dice buttons on
 * Core rules and the chips on the alternate tables - so the mapping is here
 * rather than in both.
 */
export function rarityKey(r: string): keyof Dict {
  return r === 'very_rare' ? 'veryRare' : (r as keyof Dict);
}

/**
 * The name a source *key* takes, off `srcName` in app.js - not a record's own
 * source, which `srcLabel` below already names. The equipment facet's `src`
 * row picks a value out of `EQ_SRC` (the five books plus the four frames) and
 * needs a name for the key alone, with no record behind it.
 */
export function srcName(key: string, lang: Lang): string {
  const t = dict(lang);
  const named: Partial<Record<string, string>> = {
    core: t.srcCore,
    hnf: t.srcHnf,
    wondrous: t.srcWond,
    dread: t.srcDread,
    voa: t.srcVoa
  };
  return named[key] ?? frameName(key, lang);
}

/**
 * The source line on a print card, off app.js:954.
 *
 * A table row's badge names the community, because other communities sit
 * beside it and the book is obvious. A card leaves the table and goes to the
 * table alone, so a community record also names the book it came from.
 */
export function printSrc(it: Record_, lang: Lang): string {
  const t = dict(lang);
  if (isFrameRecord(it)) return whereFrom(it, lang);
  return it.src === 'community' ? `${t.srcComm} · ${srcLabel(it, lang)}` : srcLabel(it, lang);
}

export function srcLabel(it: Record_, lang: Lang): string {
  const t = dict(lang);
  if (it.frame) return frameName(it.frame, lang);
  switch (it.src) {
    case 'core':
    case 'hnf':
    case 'wondrous':
    case 'dread':
    case 'voa':
      return srcName(it.src, lang);
    case 'frame':
      return it.frame ? frameName(it.frame, lang) : t.srcFrame;
    case 'community':
      return (lang === 'ru' ? it.community_ru : it.community) ?? t.srcComm;
    default:
      return it.src;
  }
}

const EQ_TABLE = {
  weapon: 'eq_weapon',
  secondary: 'eq_secondary',
  armor: 'eq_armor'
} as const;

/**
 * Which table a record is printed in, off `tableIdOf` in app.js.
 *
 * Starting inventory, Vault of Ages and campaign frames are checked before equipment on purpose:
 * their pieces carry stat blocks but live in their source tables, and sending
 * the "show in the table" link to a weapons table would land the reader in a
 * section their record is not in.
 */
export function tableOf(it: Record_): TableId | null {
  if (it.frame || it.src === 'frame') return 'other_frames';
  if (it.starting) return 'other_starting';
  if (it.src === 'voa') return 'voa';
  if (it.eq && !it.roll) return EQ_TABLE[it.eq.t];
  if (it.src === 'wondrous') return 'wondrous';
  if (it.src === 'dread') return 'dread';
  if (it.src === 'community') return 'community';

  /* What is left is the roll tables, which are keyed by book and by kind. */
  if (it.src === 'core') return it.kind === 'consumable' ? 'core_consumable' : 'core_item';
  if (it.src === 'hnf') return it.kind === 'consumable' ? 'hnf_consumable' : 'hnf_item';
  return null;
}

/**
 * The tables, grouped as the table page groups them.
 *
 * The group names the book and the sub names the section inside it - "Core"
 * over "Предметы", because "Core - предметы" under a heading that already says
 * "Core" prints the book twice.
 */
const GROUPS: { ru: string; en: string; subs: readonly TableId[] }[] = [
  { ru: 'Core', en: 'Core', subs: ['core_item', 'core_consumable'] },
  { ru: 'Hope & Fear', en: 'Hope & Fear', subs: ['hnf_item', 'hnf_consumable'] },
  { ru: 'Альт. таблицы', en: 'Alt. tables', subs: ['alt_item', 'alt_consumable'] },
  { ru: 'Wondrous Loot', en: 'Wondrous Loot', subs: ['wondrous'] },
  { ru: 'Dread GM Toolbox', en: 'Dread GM Toolbox', subs: ['dread'] },
  { ru: 'Vault of Ages', en: 'Vault of Ages', subs: ['voa'] },
  { ru: 'Сообщества', en: 'Communities', subs: ['community'] },
  { ru: 'Снаряжение', en: 'Equipment', subs: ['eq_weapon', 'eq_secondary', 'eq_armor'] },
  { ru: 'Прочее', en: 'Other', subs: ['other_starting', 'other_frames'] }
];

const SUBS: Partial<Record<TableId, { ru: string; en: string }>> = {
  core_item: { ru: 'Предметы', en: 'Items' },
  core_consumable: { ru: 'Расходники', en: 'Consumables' },
  hnf_item: { ru: 'Предметы', en: 'Items' },
  hnf_consumable: { ru: 'Расходники', en: 'Consumables' },
  alt_item: { ru: 'Предметы', en: 'Items' },
  alt_consumable: { ru: 'Расходники', en: 'Consumables' },
  eq_weapon: { ru: 'Оружие', en: 'Weapons' },
  eq_secondary: { ru: 'Вторичное', en: 'Secondary' },
  eq_armor: { ru: 'Броня', en: 'Armor' },
  other_starting: { ru: 'Стартовые', en: 'Starting' },
  other_frames: { ru: 'Сеттинги', en: 'Frames' }
};

/**
 * Where a record sits, as the line under the heading says it.
 *
 * A community record names its community instead: beside other communities the
 * book is obvious, and the community is what tells them apart.
 */
export function whereFrom(it: Record_, lang: Lang): string {
  if (it.src === 'community') return srcLabel(it, lang);

  const table = tableOf(it);
  if (!table) return srcLabel(it, lang);

  const group = GROUPS.find((g) => g.subs.includes(table));
  const sub = SUBS[table];
  const head = group ? group[lang] : srcLabel(it, lang);
  const base = sub ? `${head} · ${sub[lang]}` : head;

  return isFrameRecord(it) ? `${base} · ${srcLabel(it, lang)}` : base;
}
