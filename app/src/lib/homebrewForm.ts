/* The homebrew editor's form: the draft it edits, the stored part a draft writes, the
 * problems a save refuses and the field each one belongs to.
 *
 * The form checks what the database checks (`contentProblems`), so a draft that passes
 * never meets a CHECK refusal; the one rule of its own is a source deleted meanwhile.
 * Pure module. docs/specs/FEATURES.md, "Homebrew". */

import type { Dict } from './dict.js';
import {
  contentProblems,
  DESC_MAX,
  NAME_MAX,
  recordOf,
  type BookRef,
  type BookRow,
  type HomebrewContent,
  type HomebrewKind,
  type HomebrewRecord,
  type ItemRow,
  type Problem
} from './homebrew.js';
import type { DamageType, EquipClass, EquipKind, Lang, Range, Trait } from './types.js';

/** What the form holds: every value as the field shows it, `''` until chosen. */
export interface ItemDraft {
  kind: HomebrewKind;
  /** Kept while another kind is chosen, so switching back restores it. */
  t: EquipKind;
  bookId: string | null;
  section: string | null;
  name: string;
  desc: string;
  /** Loot only. */
  tier: '' | '1' | '2' | '3' | '4' | 'A' | 'C';
  eqTier: '' | '1' | '2' | '3' | '4' | 'A';
  cls: '' | EquipClass;
  tr: '' | Trait;
  rg: '' | Range;
  dt: '' | DamageType;
  bu: '' | '1' | '2' | 'any';
  dmg: string;
  as: string;
  th0: string;
  th1: string;
  altTr: '' | Trait;
  altRg: '' | Range;
  altDmg: string;
  altDt: '' | DamageType;
}

/** The id of a field's control; a problem's link and its error line point at it. */
export type FieldId =
  | 'hb-kind'
  | 'hb-type'
  | 'hb-book'
  | 'hb-section'
  | 'hb-name'
  | 'hb-desc'
  | 'hb-tier'
  | 'hb-eqtier'
  | 'hb-cls'
  | 'hb-tr'
  | 'hb-rg'
  | 'hb-dmg'
  | 'hb-dt'
  | 'hb-bu'
  | 'hb-as'
  | 'hb-th'
  | 'hb-alt-tr'
  | 'hb-alt-rg'
  | 'hb-alt-dmg'
  | 'hb-alt-dt';

const EMPTY: ItemDraft = {
  kind: 'item',
  t: 'weapon',
  bookId: null,
  section: null,
  name: '',
  desc: '',
  tier: '',
  eqTier: '',
  cls: '',
  tr: '',
  rg: '',
  dt: '',
  bu: '',
  dmg: '',
  as: '',
  th0: '',
  th1: '',
  altTr: '',
  altRg: '',
  altDmg: '',
  altDt: ''
};

const text = (v: string | number | undefined): string => (v === undefined ? '' : String(v));

/** Returns the draft of an item, its name and description in `lang`; a new item's draft
 *  (`row` null) is a plain item in the default source. */
export function draftOf(row: ItemRow | null, lang: Lang): ItemDraft {
  if (!row) return { ...EMPTY };
  const c = row.content;
  const eq = c.eq;
  return {
    ...EMPTY,
    kind: c.kind,
    t: eq?.t ?? 'weapon',
    bookId: row.book_id,
    section: c.section ?? null,
    name: (lang === 'ru' ? c.ru : c.en) ?? '',
    desc: (lang === 'ru' ? c.rud : c.ende) ?? '',
    tier: c.tier === undefined ? '' : (String(c.tier) as ItemDraft['tier']),
    eqTier: eq ? (String(eq.tier) as ItemDraft['eqTier']) : '',
    cls: eq?.cls ?? '',
    tr: eq?.tr ?? '',
    rg: eq?.rg ?? '',
    dt: eq?.dt ?? '',
    bu: eq?.bu === undefined ? '' : (String(eq.bu) as ItemDraft['bu']),
    dmg: eq?.dmg ?? '',
    as: text(eq?.as),
    th0: text(eq?.th?.[0]),
    th1: text(eq?.th?.[1]),
    altTr: eq?.alt?.tr ?? '',
    altRg: eq?.alt?.rg ?? '',
    altDmg: eq?.alt?.dmg ?? '',
    altDt: eq?.alt?.dt ?? ''
  };
}

const WHOLE = /^\d+$/;
/* A number the field reads as one; else the typed text, which the validator refuses. */
const numberOr = (s: string): number | string => (WHOLE.test(s.trim()) ? Number(s) : s);
const tierOf = (s: string): number | string => (/^[1-4]$/.test(s) ? Number(s) : s);

/** Returns the stored part a draft writes: the name and description in `lang`, the other
 *  language copied from `base` untouched, and only the fields of the chosen kind and type.
 *  Unknown on purpose: a draft may break a rule, and `contentProblems` says which. */
export function contentOf(draft: ItemDraft, lang: Lang, base: HomebrewContent | null): unknown {
  const out: Record<string, unknown> = { kind: draft.kind };
  const [name, desc, otherName, otherDesc] =
    lang === 'ru'
      ? (['ru', 'rud', 'en', 'ende'] as const)
      : (['en', 'ende', 'ru', 'rud'] as const);
  if (base?.[otherName] !== undefined) out[otherName] = base[otherName];
  if (base?.[otherDesc] !== undefined) out[otherDesc] = base[otherDesc];
  if (draft.name.trim()) out[name] = draft.name.trim();
  if (draft.desc.trim()) out[desc] = draft.desc.trim();
  if (draft.kind !== 'equip' && draft.tier !== '') out['tier'] = tierOf(draft.tier);
  if (draft.section !== null && draft.bookId !== null) out['section'] = draft.section;
  if (draft.kind !== 'equip') return out;
  const eq: Record<string, unknown> = { t: draft.t };
  if (draft.eqTier !== '') eq['tier'] = tierOf(draft.eqTier);
  if (draft.t === 'armor') {
    if (draft.as.trim()) eq['as'] = numberOr(draft.as);
    if (draft.th0.trim() || draft.th1.trim()) {
      eq['th'] = [numberOr(draft.th0), numberOr(draft.th1)];
    }
  } else {
    if (draft.cls) eq['cls'] = draft.cls;
    if (draft.tr) eq['tr'] = draft.tr;
    if (draft.rg) eq['rg'] = draft.rg;
    const dmg = draft.dmg.toLowerCase().replace(/\s+/g, '');
    if (dmg) eq['dmg'] = dmg;
    if (draft.dt) eq['dt'] = draft.dt;
    if (draft.bu) eq['bu'] = draft.bu === 'any' ? 'any' : Number(draft.bu);
    const altDmg = draft.altDmg.toLowerCase().replace(/\s+/g, '');
    if (draft.altTr || draft.altRg || altDmg || draft.altDt) {
      const alt: Record<string, unknown> = {};
      if (draft.altTr) alt['tr'] = draft.altTr;
      if (draft.altRg) alt['rg'] = draft.altRg;
      if (altDmg) alt['dmg'] = altDmg;
      if (draft.altDt) alt['dt'] = draft.altDt;
      eq['alt'] = alt;
    }
  }
  out['eq'] = eq;
  return out;
}

/** Returns every problem a save refuses: the database's rules over `contentOf`, then a
 *  source that `books` no longer holds (another tab deleted it). */
export function formProblems(
  draft: ItemDraft,
  lang: Lang,
  base: HomebrewContent | null,
  books: readonly BookRow[]
): Problem[] {
  const out = contentProblems(contentOf(draft, lang, base));
  if (draft.bookId !== null && !books.some((b) => b.id === draft.bookId)) {
    out.push({ path: 'book', rule: 'gone' });
  }
  return out;
}

const FIELDS: Record<string, FieldId> = {
  kind: 'hb-kind',
  eq: 'hb-type',
  'eq.t': 'hb-type',
  book: 'hb-book',
  section: 'hb-section',
  name: 'hb-name',
  en: 'hb-name',
  ru: 'hb-name',
  ende: 'hb-desc',
  rud: 'hb-desc',
  tier: 'hb-tier',
  'eq.tier': 'hb-eqtier',
  'eq.cls': 'hb-cls',
  'eq.tr': 'hb-tr',
  'eq.rg': 'hb-rg',
  'eq.dmg': 'hb-dmg',
  'eq.dt': 'hb-dt',
  'eq.bu': 'hb-bu',
  'eq.as': 'hb-as',
  'eq.th': 'hb-th',
  'eq.alt': 'hb-alt-tr',
  'eq.alt.tr': 'hb-alt-tr',
  'eq.alt.rg': 'hb-alt-rg',
  'eq.alt.dmg': 'hb-alt-dmg',
  'eq.alt.dt': 'hb-alt-dt'
};

/** Returns the field a problem belongs to; the name for a problem of the whole value. */
export function fieldOf(p: Problem): FieldId {
  return FIELDS[p.path] ?? 'hb-name';
}

/** Returns the text a field's error line draws for a problem. */
export function problemText(p: Problem, t: Dict): string {
  const field = fieldOf(p);
  if (p.rule === 'gone') return t.hbErrBookGone;
  if (p.rule === 'order') return t.hbErrThOrder;
  if (p.rule === 'long') {
    return t.hbErrLong.replace('%n', String(field === 'hb-desc' ? DESC_MAX : NAME_MAX));
  }
  if (field === 'hb-name' || field === 'hb-desc') {
    return p.rule === 'required' ? t.hbErrName : t.hbErrControl;
  }
  if (field === 'hb-eqtier') return t.hbErrTier;
  if (p.path.startsWith('eq.alt') && p.rule === 'required') return t.hbErrAlt;
  if (field === 'hb-dmg' || field === 'hb-alt-dmg') return t.hbErrDmg;
  if (field === 'hb-as') return t.hbErrAs;
  if (field === 'hb-th') return t.hbErrTh;
  return t.hbErrPick;
}

/** Returns the record the preview draws: the draft's stored part as `recordOf` draws it,
 *  with no stat block until the author chose a tier (a tier is never shown that the author
 *  did not type). */
export function previewOf(
  key: string,
  draft: ItemDraft,
  lang: Lang,
  base: HomebrewContent | null,
  book: BookRef | null
): HomebrewRecord {
  const c = contentOf(draft, lang, base) as HomebrewContent;
  if (draft.eqTier === '') delete c.eq;
  return recordOf(key, c, book);
}
