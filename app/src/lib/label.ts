/* A tag and a path are two different things, off app.js.
 *
 * `srcLabel` is the tag: one leaf naming the book, community, or setting a
 * record comes from. It goes on the `.badge src` chip, which always sits
 * inside a listing or a card that already supplies the surrounding context -
 * a community record names the community instead of the book, because beside
 * other communities the book is obvious and the community is what tells them
 * apart. A tag never carries a path.
 *
 * `whereFrom` is the path: where the record lives in the navigation - the
 * group, its sub-table, and (for the two tables sectioned by a value the
 * record carries) the record's own section leaf. It goes where the reader has
 * no surrounding context: the line under a record-page heading, a print
 * card's source line, and a share stub's subtitle. A path must be complete.
 *
 * `badgeKind` is the class the badge takes, which is not the same vocabulary as
 * `kindOf` in data.ts: that answers "what does this count as when filtering",
 * and this answers "which of the two colours does the chip take". Equipment
 * carries an item badge, because on a card it is a thing you have. */

import { dict } from './dict.js';
import { frameName } from './frames.js';
import type { FrameId } from './frames.js';
import { EQ_TYPE, eqWord } from './i18n.js';
import { SUB_LABEL, groupOf } from './tables.js';
import type { Dict } from './dict.js';
import type { Lang, Record_, TableId } from './types.js';

export function badgeKind(it: Record_): 'item' | 'cons' {
  return it.kind === 'consumable' ? 'cons' : 'item';
}

/** Whether a record belongs to a campaign frame - `it.frame` names it, or
 *  `it.src` marks the table as a whole one.
 *
 *  D11, paid off: this used to guard six sites that hid a frame record's tier
 *  and switched its source label to a full path, on the strength of a comment
 *  ("presented as setting material") that turned out to assert intent with no
 *  evidence behind it - an identical piece of armour prints its tier when it
 *  sits in `eq` and hides it when it sits in a frame table, and nothing a
 *  reader can see explains the difference. The owner settled on printing the
 *  tier like any other equipment (Q6); this predicate is kept for what still
 *  legitimately needs it - locating a frame record in a fixture or a test,
 *  and `whereFrom`'s own path-building, which is a different question (where
 *  a record sits in the navigation, not what it hides). */
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
    voa: t.srcVoa,
    dv: t.srcDv
  };
  /* Anything not one of the five books above is assumed to be a frame id -
     the same assumption `EQ_SRC` bakes into the facet's own value list. */
  return named[key] ?? frameName(key as FrameId, lang);
}

/**
 * The source line on a print card, off app.js:954.
 *
 * A table row's badge names the community, because other communities sit
 * beside it and the book is obvious. A card leaves the table and goes to the
 * table alone, so a community record also names the book it came from. A
 * frame record used to get the same treatment (D11, paid off) - the tag
 * `srcLabel` gives it is already the frame's own name, not a generic word, so
 * it names the card's source exactly as any other piece of equipment's tag
 * does.
 */
export function printSrc(it: Record_, lang: Lang): string {
  return it.src === 'community' ? whereFrom(it, lang) : srcLabel(it, lang);
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
    case 'dv':
      return srcName(it.src, lang);
    case 'frame':
      /* `it.frame` is checked, and returned on, above - reachable here only
         without one (a campaign-frame record with a frame id never falls
         through to this line; `FrameId`, an A9 tightening, is what lets the
         type checker prove it). */
      return t.srcFrame;
    case 'community':
      return (lang === 'ru' ? it.community_ru : it.community) ?? t.srcComm;
    default:
      return it.src;
  }
}

const EQ_TABLE_OF = {
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
  if (it.eq && !it.roll) return EQ_TABLE_OF[it.eq.t];
  if (it.src === 'wondrous') return 'wondrous';
  if (it.src === 'dread') return 'dread';
  if (it.src === 'dv') return 'dv';
  if (it.src === 'community') return 'community';

  /* What is left is the roll tables, which are keyed by book and by kind. */
  if (it.src === 'core') return it.kind === 'consumable' ? 'core_consumable' : 'core_item';
  if (it.src === 'hnf') return it.kind === 'consumable' ? 'hnf_consumable' : 'hnf_item';
  return null;
}

/**
 * Where a record sits, as the line under the heading says it: the group, its
 * sub-table, and - for the two tables sectioned by a value the record itself
 * carries, `other_frames` by `frame` and `community` by `community` - the
 * record's own section leaf. No other table is sectioned by a record
 * property, so no other table appends one.
 *
 * The group and sub names are the same ones the table page's own chips read,
 * off `tables.ts`'s `groupOf`/`SUB_LABEL` - not a second copy of the taxonomy.
 * A group's sub only prints where the book actually has more than one table:
 * `SUB_LABEL` has no entry for a single-table group's own id, which is what
 * `groupOf`/`SUB_LABEL`'s own shape already encodes.
 */
export function whereFrom(it: Record_, lang: Lang): string {
  const table = tableOf(it);
  if (!table) return srcLabel(it, lang);

  const t = dict(lang);
  const head = t[groupOf(table).label];
  const subKey = SUB_LABEL[table];
  const base = subKey ? `${head} · ${t[subKey]}` : head;

  return it.frame || it.community ? `${base} · ${srcLabel(it, lang)}` : base;
}
