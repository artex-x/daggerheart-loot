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
import type { Lang, Record_, TableId } from './types.js';

export function badgeKind(it: Record_): 'item' | 'cons' {
  return it.kind === 'consumable' ? 'cons' : 'item';
}

export function srcLabel(it: Record_, lang: Lang): string {
  const t = dict(lang);
  switch (it.src) {
    case 'core':
      return t.srcCore;
    case 'hnf':
      return t.srcHnf;
    case 'wondrous':
      return t.srcWond;
    case 'dread':
      return t.srcDread;
    case 'voa':
      return t.srcVoa;
    case 'frame':
      return it.frame ?? t.srcFrame;
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
 * Vault of Ages is checked before equipment on purpose: two dozen of its pieces
 * carry a stat block but live in the Vault's own table, and sending the "show
 * in the table" link to the weapons table would land the reader in a section
 * their record is not in.
 */
export function tableOf(it: Record_): TableId | null {
  if (it.src === 'voa') return 'voa';
  if (it.eq && !it.roll) return EQ_TABLE[it.eq.t];
  if (it.src === 'wondrous') return 'wondrous';
  if (it.src === 'dread') return 'dread';
  if (it.src === 'frame') return 'frames';
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
  { ru: 'Фреймы', en: 'Frames', subs: ['frames'] }
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
  eq_armor: { ru: 'Броня', en: 'Armor' }
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
  return sub ? `${head} · ${sub[lang]}` : head;
}
