/* The homebrew editor's form: the draft it edits with its relations, the stored part a
 * draft writes, the problems a save refuses and the field each one belongs to; the
 * pickers' options; the set and rule card form's draft, content and problems.
 *
 * The form checks what the database checks (`contentProblems`, `cardProblems`), so a
 * draft that passes never meets a CHECK refusal; its own rules are a source deleted
 * meanwhile, a line of another type or none, an open card form, a repeated card name and
 * a card with no text. Pure module. docs/specs/FEATURES.md, "Homebrew". */

import type { Dict } from './dict.js';
import {
  CARD_NAME_MAX,
  CARD_SUB_MAX,
  CARD_TEXT_MAX,
  CARD_URL_MAX,
  cardProblems,
  contentProblems,
  DESC_MAX,
  hasName,
  NAME_MAX,
  nameTaken,
  recordOf,
  type BookRef,
  type BookRow,
  type CardContent,
  type CardKind,
  type CardRef,
  type CardRow,
  type HomebrewContent,
  type HomebrewKind,
  type HomebrewRecord,
  type ItemRow,
  type Problem
} from './homebrew.js';
import { EQ_TYPE, eqWord, nameOf } from './i18n.js';
import { badgeKind, srcLabel } from './label.js';
import { plural } from './plural.js';
import { foldQuery } from './search.js';
import type {
  DamageType,
  EquipClass,
  EquipKind,
  Lang,
  Range,
  Record_,
  Trait
} from './types.js';

/** A damage die, in the order the select offers them. */
export type Die = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
export const DICE: readonly Die[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

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
  dmgDie: '' | Die;
  /** The flat bonus as typed; empty for none. */
  dmgBonus: string;
  as: string;
  th0: string;
  th1: string;
  altTr: '' | Trait;
  altRg: '' | Range;
  altDmgDie: '' | Die;
  altDmgBonus: string;
  altDt: '' | DamageType;
  /** Kept while another kind is chosen, as `t` is. */
  lineMode: 'unique' | 'in' | 'new';
  /** The line joined under `'in'`; `''` for none. */
  line: string;
  craft: string[];
  craftFrom: string[];
  /** `''` for none. */
  set: string;
  refs: string[];
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
  | 'hb-alt-dt'
  | 'hb-line'
  | 'hb-craft'
  | 'hb-craft-from'
  | 'hb-set'
  | 'hb-refs';

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
  dmgDie: '',
  dmgBonus: '',
  as: '',
  th0: '',
  th1: '',
  altTr: '',
  altRg: '',
  altDmgDie: '',
  altDmgBonus: '',
  altDt: '',
  lineMode: 'unique',
  line: '',
  craft: [],
  craftFrom: [],
  set: '',
  refs: []
};

const text = (v: string | number | undefined): string => (v === undefined ? '' : String(v));

const DMG_PARTS = /^(d(?:4|6|8|10|12|20))(?:\+(\d+))?$/;
/* A stored damage that does not match (the CHECK refuses one) leaves both parts empty. */
const dmgParts = (dmg: string | undefined): { die: '' | Die; bonus: string } => {
  const m = DMG_PARTS.exec(dmg ?? '');
  return m ? { die: m[1] as Die, bonus: m[2] ?? '' } : { die: '', bonus: '' };
};

/** Returns the draft of an item, its name and description in `lang`; a new item's draft
 *  (`row` null) is a plain item in the default source. */
export function draftOf(row: ItemRow | null, lang: Lang): ItemDraft {
  if (!row) return { ...EMPTY, craft: [], craftFrom: [], refs: [] };
  const c = row.content;
  const eq = c.eq;
  const line = eq?.line;
  const dmg = dmgParts(eq?.dmg);
  const altDmg = dmgParts(eq?.alt?.dmg);
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
    dmgDie: dmg.die,
    dmgBonus: dmg.bonus,
    as: text(eq?.as),
    th0: text(eq?.th?.[0]),
    th1: text(eq?.th?.[1]),
    altTr: eq?.alt?.tr ?? '',
    altRg: eq?.alt?.rg ?? '',
    altDmgDie: altDmg.die,
    altDmgBonus: altDmg.bonus,
    altDt: eq?.alt?.dt ?? '',
    lineMode: !line ? 'unique' : line === row.key ? 'new' : 'in',
    line: line && line !== row.key ? line : '',
    craft: [...(c.craft ?? [])],
    craftFrom: [...(c.craft_from ?? [])],
    set: c.set ?? '',
    refs: [...(c.refs ?? [])]
  };
}

const WHOLE = /^\d+$/;
/* A number the field reads as one; else the typed text, which the validator refuses. */
const numberOr = (s: string): number | string => (WHOLE.test(s.trim()) ? Number(s) : s);
const tierOf = (s: string): number | string => (/^[1-4]$/.test(s) ? Number(s) : s);

/** Returns the stored damage of a die and a bonus field, '' for neither. A bonus with no
 *  die, or of 0, writes a value `contentProblems` refuses, so the form names «Урон». */
export function dmgOf(die: '' | Die, bonus: string): string {
  const typed = bonus.trim().replace(/^\+/, '');
  const b = WHOLE.test(typed) ? String(Number(typed)) : typed;
  if (!die && !b) return '';
  return die + (b ? '+' + b : '');
}

/** Returns the stored part a draft writes: the name and description in `lang`, the other
 *  language copied from `base` untouched, the relations, and only the fields of the chosen
 *  kind and type. «Новая линия» writes `key` as the line; without `key` it writes none.
 *  Unknown on purpose: a draft may break a rule, and `contentProblems` says which. */
export function contentOf(
  draft: ItemDraft,
  lang: Lang,
  base: HomebrewContent | null,
  key?: string
): unknown {
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
  if (draft.craft.length) out['craft'] = [...draft.craft];
  if (draft.craftFrom.length) out['craft_from'] = [...draft.craftFrom];
  if (draft.set !== '') out['set'] = draft.set;
  if (draft.refs.length) out['refs'] = [...draft.refs];
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
    const dmg = dmgOf(draft.dmgDie, draft.dmgBonus);
    if (dmg) eq['dmg'] = dmg;
    if (draft.dt) eq['dt'] = draft.dt;
    if (draft.bu) eq['bu'] = draft.bu === 'any' ? 'any' : Number(draft.bu);
    const altDmg = dmgOf(draft.altDmgDie, draft.altDmgBonus);
    if (draft.altTr || draft.altRg || altDmg || draft.altDt) {
      const alt: Record<string, unknown> = {};
      if (draft.altTr) alt['tr'] = draft.altTr;
      if (draft.altRg) alt['rg'] = draft.altRg;
      if (altDmg) alt['dmg'] = altDmg;
      if (draft.altDt) alt['dt'] = draft.altDt;
      eq['alt'] = alt;
    }
  }
  if (draft.lineMode === 'in' && draft.line) eq['line'] = draft.line;
  else if (draft.lineMode === 'new' && key) eq['line'] = key;
  out['eq'] = eq;
  return out;
}

/** What `formProblems` checks beyond the draft: the item's key, the other rungs of the
 *  line it joins, and the card form still open. */
export interface FormContext {
  key?: string;
  rungs?: readonly Record_[];
  open?: CardKind | null;
}

/** Returns every problem a save refuses: the database's rules over `contentOf`, then a
 *  line chosen as «В линии» that is missing or holds another equipment type, a source that
 *  `books` no longer holds (another tab deleted it), and an open card form. */
export function formProblems(
  draft: ItemDraft,
  lang: Lang,
  base: HomebrewContent | null,
  books: readonly BookRow[],
  ctx: FormContext = {}
): Problem[] {
  const out = contentProblems(contentOf(draft, lang, base, ctx.key), ctx.key);
  if (draft.kind === 'equip' && draft.lineMode === 'in') {
    if (!draft.line) out.push({ path: 'eq.line', rule: 'required' });
    else if ((ctx.rungs ?? []).some((r) => r.eq && r.eq.t !== draft.t)) {
      out.push({ path: 'eq.line', rule: 'enum' });
    }
  }
  if (draft.bookId !== null && !books.some((b) => b.id === draft.bookId)) {
    out.push({ path: 'book', rule: 'gone' });
  }
  if (ctx.open === 'set') out.push({ path: 'set', rule: 'open' });
  else if (ctx.open === 'ref') out.push({ path: 'refs', rule: 'open' });
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
  'eq.alt.dt': 'hb-alt-dt',
  'eq.line': 'hb-line',
  set: 'hb-set'
};

const LIST_FIELDS: Record<string, FieldId> = {
  craft: 'hb-craft',
  craft_from: 'hb-craft-from',
  refs: 'hb-refs'
};

/** Returns the field a problem belongs to; the name for a problem of the whole value. */
export function fieldOf(p: Problem): FieldId {
  return FIELDS[p.path] ?? LIST_FIELDS[p.path.split('.')[0] ?? ''] ?? 'hb-name';
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
  if (p.rule === 'open') return p.path === 'set' ? t.hbErrSetOpen : t.hbErrCardOpen;
  if (field === 'hb-line') return p.rule === 'enum' ? t.hbErrLineType : t.hbErrLine;
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
  book: BookRef | null,
  cards: readonly CardRef[] = []
): HomebrewRecord {
  const c = contentOf(draft, lang, base, key) as HomebrewContent;
  if (draft.eqTier === '') delete c.eq;
  return recordOf(key, c, book, cards);
}

/** One option of a picker, and one chosen row. */
export interface PickOption {
  id: string;
  name: string;
  meta: string;
}

const metaOf = (parts: readonly (string | null | undefined)[]): string =>
  parts.filter((p): p is string => !!p).join(' · ');

/** Returns a record's picker option: its name, then its type or kind, its source and, for
 *  equipment, its tier. */
export function recordOption(it: Record_, lang: Lang, t: Dict): PickOption {
  const eq = it.eq;
  const kind = eq ? eqWord(EQ_TYPE, eq.t, lang) : badgeKind(it) === 'cons' ? t.cons : t.item;
  const tier = eq ? (eq.tier === 'A' ? t.voaArtifact1 : `${t.tier} ${String(eq.tier)}`) : null;
  return { id: it.id, name: nameOf(it, lang), meta: metaOf([kind, srcLabel(it, lang), tier]) };
}

/** Returns a line's picker option: the lowest of `rungs` (the line's members but the item)
 *  with the line's size, or «Линия без других предметов» for none. */
export function lineOption(
  rungs: readonly Record_[],
  line: string,
  lang: Lang,
  t: Dict
): PickOption {
  const first = rungs[0];
  if (!first) return { id: line, name: t.hbLineAlone, meta: '' };
  const o = recordOption(first, lang, t);
  return {
    id: line,
    name: o.name,
    meta: metaOf([o.meta, plural(rungs.length, t.hbLineN, lang)])
  };
}

const inLang = (a: string | undefined, b: string | undefined): string => a || b || '';

/** Returns a rule card's picker option: its name, then its subtitle and `own` (the source
 *  of an own card; null for a catalog card). */
export function cardOption(
  key: string,
  card: CardContent,
  lang: Lang,
  own: string | null
): PickOption {
  const ru = lang === 'ru';
  return {
    id: key,
    name: ru ? inLang(card.ru, card.en) : inLang(card.en, card.ru),
    meta: metaOf([ru ? inLang(card.rusub, card.ensub) : inLang(card.ensub, card.rusub), own])
  };
}

/** Returns whether a card's name or subtitle, in either language, holds `q` (folded). */
export function cardMatches(card: CardContent, q: string): boolean {
  return [card.en, card.ru, card.ensub, card.rusub].some(
    (v) => !!v && foldQuery(v).includes(q)
  );
}

/* Here, not in homebrew.ts: homebrew.ts stays clear of search.ts, whose stemmers the
   artwork review's transpiled copy of the label code cannot resolve. */
/** Returns whether either language of the record's name holds `q`; `q` is already folded
 *  (`foldQuery`). */
export function recordMatches(r: Record_, q: string): boolean {
  return foldQuery(r.ru).includes(q) || foldQuery(r.en).includes(q);
}

/** Returns the records whose name holds `query` as search folds it, in order; a blank
 *  query keeps every record (the rule of `matchLists`). */
export function matchRecords<T extends Record_>(records: readonly T[], query: string): T[] {
  const q = foldQuery(query.trim());
  return q ? records.filter((r) => recordMatches(r, q)) : [...records];
}

/** What the set or rule card form holds, in one language. */
export interface CardDraft {
  name: string;
  sub: string;
  text: string;
  url: string;
  bookId: string | null;
}

/** Returns the card form's draft: the card's fields in `lang`, its own source for an edit,
 *  `bookId` for a new card. */
export function cardDraftOf(
  card: CardRow | null,
  lang: Lang,
  bookId: string | null
): CardDraft {
  const c: CardContent = card?.content ?? {};
  const ru = lang === 'ru';
  return {
    name: (ru ? c.ru : c.en) ?? '',
    sub: (ru ? c.rusub : c.ensub) ?? '',
    text: (ru ? c.rud : c.ende) ?? '',
    url: c.url ?? '',
    bookId: card ? card.book_id : bookId
  };
}

/** Returns the stored part a card form writes: `lang`'s trimmed fields when not empty, the
 *  other language's name, subtitle (a rule card) and text copied from `base`. */
export function cardContentOf(
  kind: CardKind,
  d: CardDraft,
  lang: Lang,
  base: CardContent | null
): CardContent {
  const ref = kind === 'ref';
  const [name, sub, text, oName, oSub, oText] =
    lang === 'ru'
      ? (['ru', 'rusub', 'rud', 'en', 'ensub', 'ende'] as const)
      : (['en', 'ensub', 'ende', 'ru', 'rusub', 'rud'] as const);
  const out: CardContent = {};
  const keep = (k: typeof oName | typeof oSub | typeof oText): void => {
    const v = base?.[k];
    if (v !== undefined) out[k] = v;
  };
  keep(oName);
  if (ref) keep(oSub);
  keep(oText);
  if (d.name.trim()) out[name] = d.name.trim();
  if (ref && d.sub.trim()) out[sub] = d.sub.trim();
  if (d.text.trim()) out[text] = d.text.trim();
  if (ref && d.url.trim()) out.url = d.url.trim();
  return out;
}

/** Returns every problem the card form refuses: the database's rules, then a name another
 *  card of `others` holds (without case), then a card with no text in either language. */
export function cardFormProblems(
  kind: CardKind,
  d: CardDraft,
  lang: Lang,
  base: CardContent | null,
  others: readonly CardRow[]
): Problem[] {
  const c = cardContentOf(kind, d, lang, base);
  const out = cardProblems(kind, c);
  const names = others.map((o) => o.content);
  if (nameTaken(names, d.name)) out.push({ path: 'name', rule: 'duplicate' });
  if (!hasName(c.ende ?? '') && !hasName(c.rud ?? '')) {
    out.push({ path: 'text', rule: 'required' });
  }
  return out;
}

/** The card form's fields, by the suffix of their ids. */
export type CardFieldId = 'name' | 'sub' | 'text' | 'url';

const CARD_FIELDS: Record<string, CardFieldId> = {
  name: 'name',
  en: 'name',
  ru: 'name',
  ensub: 'sub',
  rusub: 'sub',
  ende: 'text',
  rud: 'text',
  text: 'text',
  url: 'url'
};

/** Returns the card form's field a problem belongs to; the name for any other. */
export function cardFieldOf(p: Problem): CardFieldId {
  return CARD_FIELDS[p.path] ?? 'name';
}

const CARD_CAPS: Record<CardFieldId, number> = {
  name: CARD_NAME_MAX,
  sub: CARD_SUB_MAX,
  text: CARD_TEXT_MAX,
  url: CARD_URL_MAX
};

/** Returns the text a card form's field line draws for a problem; `name` is the typed name
 *  a duplicate repeats. */
export function cardProblemText(kind: CardKind, p: Problem, t: Dict, name: string): string {
  const field = cardFieldOf(p);
  if (p.rule === 'duplicate') {
    return (kind === 'set' ? t.hbSetTaken : t.hbCardTaken).replace('%s', name.trim());
  }
  if (p.rule === 'required' && field === 'text') {
    return kind === 'set' ? t.hbErrSetBonus : t.hbErrCardText;
  }
  if (p.rule === 'required') return t.hbErrName;
  if (p.rule === 'long') return t.hbErrLong.replace('%n', String(CARD_CAPS[field]));
  if (p.rule === 'pattern' && field === 'url') return t.hbErrUrl;
  return t.hbErrControl;
}

/** Returns an item delete's confirm: the question `lead`, then what the delete does to other
 *  players' lists (`many` for several items), then «Отменить удаление нельзя.»
 *  (docs/specs/FEATURES.md, "Consistency rules", rule 3). */
export function deleteItemAsk(lead: string, many: boolean, t: Dict): string {
  return lead + ' ' + (many ? t.hbDeleteOthersMany : t.hbDeleteOthers) + ' ' + t.deleteNoUndo;
}
