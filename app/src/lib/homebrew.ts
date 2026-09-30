/* The author's homebrew items and sources: the keys, the stored shapes, the
 * validators and the record a homebrew item draws as.
 *
 * The validators accept and refuse what the database's do
 * (`supabase/migrations/20260930130000_homebrew.sql`), over one fixture set
 * (`docs/fixtures/homebrew/`); `recordOf` writes what `homebrew_snapshot_of`
 * writes. Pure module: no port, no storage.
 * docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md. */

import type { Index } from './data.js';
import { nameOf } from './i18n.js';
import type { DamageType, EquipClass, Lang, Range, Record_, Trait } from './types.js';

/** A source's, a section's or an item's key: `hb_` and 16 base32 characters. */
export const HOMEBREW_KEY = /^hb_[a-z2-7]{16}$/;

export function isHomebrewKey(s: string): boolean {
  return HOMEBREW_KEY.test(s);
}

const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';

/** Returns a key from the first 10 bytes: 80 bits as 16 base32 characters. */
export function keyFrom(bytes: Uint8Array): string {
  if (bytes.length < 10) {
    throw new Error(
      `A homebrew key needs 10 random bytes, got ${String(bytes.length)}. Pass 10 bytes or more.`
    );
  }
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < 10; i++) {
    value = (value << 8) | (bytes[i] as number);
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += BASE32.charAt((value >> bits) & 31);
    }
    value &= (1 << bits) - 1;
  }
  return 'hb_' + out;
}

/** The most code points of an item's name, per language. */
export const NAME_MAX = 120;
/** The most code points of an item's description, per language. */
export const DESC_MAX = 3000;
/** The most code points of a source's or a section's name, per language. */
export const BOOK_NAME_MAX = 80;
/** The most sections a source holds. */
export const SECTIONS_MAX = 30;
/** The most bytes of a frozen copy's snapshot (`list_entries_snapshot_size`). */
export const SNAPSHOT_BYTES = 32768;

export type HomebrewKind = 'item' | 'consumable' | 'equip';
export type HomebrewTier = 1 | 2 | 3 | 4 | 'A' | 'C';

export interface HomebrewStats {
  tr: Trait;
  rg: Range;
  dmg: string;
  dt: DamageType;
}

/** The stat block; the tier is typed by the author, never derived. */
export interface HomebrewEquip {
  t: 'weapon' | 'secondary' | 'armor';
  tier: 1 | 2 | 3 | 4 | 'A';
  cls?: EquipClass;
  tr?: Trait;
  rg?: Range;
  dmg?: string;
  dt?: DamageType;
  bu?: 1 | 2 | 'any';
  as?: number;
  th?: [number, number];
  alt?: HomebrewStats;
}

/** An item's stored part: the catalog's field names, both languages optional, one name
 *  required. */
export interface HomebrewContent {
  kind: HomebrewKind;
  en?: string;
  ru?: string;
  ende?: string;
  rud?: string;
  /** Loot only. */
  tier?: HomebrewTier;
  /** Only when `kind` is `equip`. */
  eq?: HomebrewEquip;
  /** A section key of the item's source. */
  section?: string;
}

export interface SectionRow {
  key: string;
  en?: string;
  ru?: string;
}

export interface BookContent {
  en?: string;
  ru?: string;
  sections?: SectionRow[];
}

export type BookRef = BookContent & { key: string };

export interface BookRow {
  id: string;
  key: string;
  content: BookContent;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface ItemRow {
  id: string;
  key: string;
  book_id: string | null;
  content: HomebrewContent;
  revision: number;
  created_at: string;
  updated_at: string;
}

export type NewBookRow = Pick<BookRow, 'id' | 'key' | 'content'>;
export type NewItemRow = Pick<ItemRow, 'id' | 'key' | 'book_id' | 'content'>;

export interface NamedKey {
  key: string;
  en: string;
  ru: string;
}

/** A homebrew item as the app draws it, and as a frozen copy carries it. */
export type HomebrewRecord = Record_ & { book?: NamedKey & { section?: NamedKey } };

export interface Problem {
  /** The field, dot-separated (`eq.alt.dmg`, `sections.1.key`); `name` is "no language
   *  holds a name"; `''` is the whole value. */
  path: string;
  rule:
    | 'type'
    | 'required'
    | 'extra'
    | 'enum'
    | 'long'
    | 'pattern'
    | 'range'
    | 'order'
    | 'many'
    | 'duplicate'
    /** The form's own rule: the chosen source was deleted meanwhile. */
    | 'gone';
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const chars = (s: string): number => Array.from(s).length;
/* Whether `s` holds a C0 control other than tab and newline, U+0000 included: jsonb
   refuses U+0000 at input, and `jsonb::text` writes the others as six bytes each. */
const hasControl = (s: string): boolean =>
  Array.from(s).some((ch) => {
    const c = ch.charCodeAt(0);
    return c <= 0x1f && c !== 0x09 && c !== 0x0a;
  });
const NON_SPACE = /\S/u;
const DMG = /^d(4|6|8|10|12|20)(\+([1-9]|1[0-9]|20))?$/;

const CONTENT_KEYS = ['kind', 'en', 'ru', 'ende', 'rud', 'tier', 'eq', 'section'];
const EQ_KEYS = ['t', 'tier', 'cls', 'tr', 'rg', 'dmg', 'dt', 'bu', 'as', 'th', 'alt'];
const WEAPON_ONLY = ['cls', 'tr', 'rg', 'dmg', 'dt', 'bu', 'alt'];
const STATS = ['tr', 'rg', 'dmg', 'dt'];
const KINDS: readonly unknown[] = ['item', 'consumable', 'equip'];
const TIERS: readonly unknown[] = [1, 2, 3, 4, 'A', 'C'];
const EQ_TIERS: readonly unknown[] = [1, 2, 3, 4, 'A'];
const EQ_TYPES: readonly unknown[] = ['weapon', 'secondary', 'armor'];
const CLASSES: readonly unknown[] = ['phy', 'mag'];
const TRAITS: readonly unknown[] = [
  'agility',
  'strength',
  'finesse',
  'instinct',
  'presence',
  'knowledge',
  'spellcast'
];
const RANGES: readonly unknown[] = ['melee', 'veryclose', 'close', 'far', 'veryfar'];
const DAMAGE: readonly unknown[] = ['phy', 'mag', 'any'];
const BURDEN: readonly unknown[] = [1, 2, 'any'];

const at = (base: string, key: string): string => (base ? base + '.' + key : key);

/* A text field: absent, or a string of at most `max` code points with no control. */
function textProblems(o: Obj, key: string, max: number, base: string, out: Problem[]): void {
  if (!(key in o)) return;
  const v = o[key];
  const path = at(base, key);
  if (typeof v !== 'string') out.push({ path, rule: 'type' });
  else if (chars(v) > max) out.push({ path, rule: 'long' });
  else if (hasControl(v)) out.push({ path, rule: 'pattern' });
}

/* `en` and `ru`: at least one holds a non-space character, then each on its own. */
function namesProblems(o: Obj, max: number, base: string, out: Problem[]): void {
  const named = ['en', 'ru'].some((k) => {
    const v = o[k];
    return typeof v === 'string' && NON_SPACE.test(v);
  });
  if (!named) out.push({ path: at(base, 'name'), rule: 'required' });
  textProblems(o, 'en', max, base, out);
  textProblems(o, 'ru', max, base, out);
}

function extraProblems(o: Obj, allowed: readonly string[], base: string, out: Problem[]): void {
  for (const k of Object.keys(o)) {
    if (!allowed.includes(k)) out.push({ path: at(base, k), rule: 'extra' });
  }
}

function oneOf(o: Obj, key: string, values: readonly unknown[], base: string, out: Problem[]) {
  const path = at(base, key);
  if (!(key in o)) out.push({ path, rule: 'required' });
  else if (!values.includes(o[key])) out.push({ path, rule: 'enum' });
}

function statProblems(o: Obj, base: string, out: Problem[]): void {
  oneOf(o, 'tr', TRAITS, base, out);
  oneOf(o, 'rg', RANGES, base, out);
  const dmg = o['dmg'];
  if (!('dmg' in o)) out.push({ path: at(base, 'dmg'), rule: 'required' });
  else if (typeof dmg !== 'string') out.push({ path: at(base, 'dmg'), rule: 'type' });
  else if (!DMG.test(dmg)) out.push({ path: at(base, 'dmg'), rule: 'pattern' });
  oneOf(o, 'dt', DAMAGE, base, out);
}

/* A whole number from `lo` to `hi`: `type` for anything else than a whole number. */
function wholeRule(v: unknown, lo: number, hi: number): Problem['rule'] | null {
  if (typeof v !== 'number' || !Number.isInteger(v)) return 'type';
  return v < lo || v > hi ? 'range' : null;
}

function equipProblems(eq: unknown, out: Problem[]): void {
  if (!isObj(eq)) {
    out.push({ path: 'eq', rule: 'type' });
    return;
  }
  oneOf(eq, 't', EQ_TYPES, 'eq', out);
  oneOf(eq, 'tier', EQ_TIERS, 'eq', out);
  const t = eq['t'];
  if (t === 'weapon' || t === 'secondary') {
    oneOf(eq, 'cls', CLASSES, 'eq', out);
    statProblems(eq, 'eq', out);
    oneOf(eq, 'bu', BURDEN, 'eq', out);
    for (const k of ['as', 'th']) if (k in eq) out.push({ path: 'eq.' + k, rule: 'extra' });
    if ('alt' in eq) {
      const alt = eq['alt'];
      if (!isObj(alt)) out.push({ path: 'eq.alt', rule: 'type' });
      else {
        statProblems(alt, 'eq.alt', out);
        extraProblems(alt, STATS, 'eq.alt', out);
      }
    }
  } else if (t === 'armor') {
    for (const k of WEAPON_ONLY) if (k in eq) out.push({ path: 'eq.' + k, rule: 'extra' });
    if (!('as' in eq)) out.push({ path: 'eq.as', rule: 'required' });
    else {
      const rule = wholeRule(eq['as'], 0, 12);
      if (rule) out.push({ path: 'eq.as', rule });
    }
    const th = eq['th'];
    if (!('th' in eq)) out.push({ path: 'eq.th', rule: 'required' });
    else if (!Array.isArray(th) || th.length !== 2) out.push({ path: 'eq.th', rule: 'type' });
    else {
      const rule = wholeRule(th[0], 1, 99) ?? wholeRule(th[1], 1, 99);
      if (rule) out.push({ path: 'eq.th', rule });
      else if ((th[0] as number) >= (th[1] as number))
        out.push({ path: 'eq.th', rule: 'order' });
    }
  }
  extraProblems(eq, EQ_KEYS, 'eq', out);
}

/** Returns every problem of an item's stored part, in the order kind, name, en, ru, ende,
 *  rud, tier, section, eq, then the unknown keys; none for a valid one. */
export function contentProblems(v: unknown): Problem[] {
  if (!isObj(v)) return [{ path: '', rule: 'type' }];
  const out: Problem[] = [];
  const kind = v['kind'];
  if (!('kind' in v)) out.push({ path: 'kind', rule: 'required' });
  else if (typeof kind !== 'string') out.push({ path: 'kind', rule: 'type' });
  else if (!KINDS.includes(kind)) out.push({ path: 'kind', rule: 'enum' });
  namesProblems(v, NAME_MAX, '', out);
  textProblems(v, 'ende', DESC_MAX, '', out);
  textProblems(v, 'rud', DESC_MAX, '', out);
  if ('tier' in v) {
    if (kind === 'equip') out.push({ path: 'tier', rule: 'extra' });
    else if (!TIERS.includes(v['tier'])) out.push({ path: 'tier', rule: 'enum' });
  }
  if ('section' in v) {
    const s = v['section'];
    if (typeof s !== 'string') out.push({ path: 'section', rule: 'type' });
    else if (!HOMEBREW_KEY.test(s)) out.push({ path: 'section', rule: 'pattern' });
  }
  if (kind === 'equip') {
    if (!('eq' in v)) out.push({ path: 'eq', rule: 'required' });
    else equipProblems(v['eq'], out);
  } else if ('eq' in v && KINDS.includes(kind)) {
    out.push({ path: 'eq', rule: 'extra' });
  }
  extraProblems(v, CONTENT_KEYS, '', out);
  return out;
}

/** Returns every problem of a source's content: its name, its sections, then the unknown
 *  keys. A section name repeated in the source is the editor's own rule, not checked here. */
export function bookProblems(v: unknown): Problem[] {
  if (!isObj(v)) return [{ path: '', rule: 'type' }];
  const out: Problem[] = [];
  namesProblems(v, BOOK_NAME_MAX, '', out);
  if ('sections' in v) {
    const sections = v['sections'];
    if (!Array.isArray(sections)) out.push({ path: 'sections', rule: 'type' });
    else {
      if (sections.length > SECTIONS_MAX) out.push({ path: 'sections', rule: 'many' });
      const seen = new Set<string>();
      sections.forEach((s: unknown, i) => {
        const base = 'sections.' + String(i);
        if (!isObj(s)) {
          out.push({ path: base, rule: 'type' });
          return;
        }
        const key = s['key'];
        if (!('key' in s)) out.push({ path: base + '.key', rule: 'required' });
        else if (typeof key !== 'string') out.push({ path: base + '.key', rule: 'type' });
        else if (!HOMEBREW_KEY.test(key)) out.push({ path: base + '.key', rule: 'pattern' });
        else if (seen.has(key)) out.push({ path: base + '.key', rule: 'duplicate' });
        if (typeof key === 'string') seen.add(key);
        namesProblems(s, BOOK_NAME_MAX, base, out);
        extraProblems(s, ['key', 'en', 'ru'], base, out);
      });
    }
  }
  extraProblems(v, ['en', 'ru', 'sections'], '', out);
  return out;
}

/* A `{ key, en, ru }` part of a snapshot: a valid key and a name. */
function namedKeyValid(v: unknown, allowed: readonly string[]): boolean {
  if (!isObj(v) || Object.keys(v).some((k) => !allowed.includes(k))) return false;
  const key = v['key'];
  if (typeof key !== 'string' || !HOMEBREW_KEY.test(key)) return false;
  const problems: Problem[] = [];
  namesProblems(v, BOOK_NAME_MAX, '', problems);
  return !problems.length;
}

/** Returns whether `v` is a frozen copy's snapshot the database takes
 *  (`homebrew_snapshot_valid`). */
export function snapshotValid(v: unknown): boolean {
  if (!isObj(v) || v['src'] !== 'homebrew') return false;
  const id = v['id'];
  if (typeof id !== 'string' || !HOMEBREW_KEY.test(id)) return false;
  if ('book' in v) {
    const book = v['book'];
    if (!namedKeyValid(book, ['key', 'en', 'ru', 'section'])) return false;
    if (
      isObj(book) &&
      'section' in book &&
      !namedKeyValid(book['section'], ['key', 'en', 'ru'])
    ) {
      return false;
    }
  }
  const rest = Object.fromEntries(
    Object.entries(v).filter(([k]) => k !== 'id' && k !== 'src' && k !== 'book')
  );
  if (rest['kind'] === 'equip' && 'tier' in rest) {
    const eq = rest['eq'];
    if (rest['tier'] !== 'A' || !isObj(eq) || eq['tier'] !== 'A') return false;
    delete rest['tier'];
  }
  return !contentProblems(rest).length;
}

/** Returns `JSON.stringify(v)` with the object keys sorted at every level: jsonb stores an
 *  object's keys in its own order, so two equal rows compare equal only this way. */
export function canonJson(v: unknown): string {
  return JSON.stringify(v, (_k, x: unknown) =>
    isObj(x)
      ? Object.fromEntries(
          Object.keys(x)
            .sort()
            .map((k) => [k, x[k]])
        )
      : x
  );
}

const filled = (own: string | undefined, other: string | undefined): string =>
  own || other || '';

function namedOf(key: string, v: { en?: string; ru?: string }): NamedKey {
  return { key, en: filled(v.en, v.ru), ru: filled(v.ru, v.en) };
}

/** Returns the record an item draws as: its content without `section`, the key as `id`,
 *  each missing or empty language filled from the other, the record's `tier` `'A'` for an
 *  artifact, and its source with the section the source holds. `book` null is the default
 *  source. */
export function recordOf(
  key: string,
  c: HomebrewContent,
  book: BookRef | null
): HomebrewRecord {
  const { section, ...rest } = c;
  const out: HomebrewRecord = {
    ...rest,
    id: key,
    src: 'homebrew',
    en: filled(c.en, c.ru),
    ru: filled(c.ru, c.en),
    ende: filled(c.ende, c.rud),
    rud: filled(c.rud, c.ende)
  };
  if (c.eq?.tier === 'A') out.tier = 'A';
  if (book) {
    const s = section === undefined ? undefined : book.sections?.find((x) => x.key === section);
    out.book = s
      ? { ...namedOf(book.key, book), section: namedOf(s.key, s) }
      : namedOf(book.key, book);
  }
  return out;
}

/** Returns whether a record is a homebrew item: an own one, or a frozen copy. */
export function isHomebrewRecord(it: Record_): it is HomebrewRecord {
  return it.src === 'homebrew';
}

/** Returns `base` with the own records and the frozen copies in `byId`: an own record
 *  replaces nothing of `base`'s, and a frozen copy only takes a key that neither holds, so
 *  an own item stays live. `base` itself when both are empty. */
export function withRecords(
  base: Index,
  own: readonly HomebrewRecord[],
  frozen: readonly HomebrewRecord[]
): Index {
  if (!own.length && !frozen.length) return base;
  const byId = new Map<string, Record_>(base.byId);
  for (const it of own) byId.set(it.id, it);
  for (const it of frozen) if (!byId.has(it.id)) byId.set(it.id, it);
  return { ...base, byId };
}

/** Returns the language the editor writes an item's name and description in: the UI
 *  language for a new item or one named in both, else the one language that names it. */
export function editLang(content: HomebrewContent | null, ui: Lang): Lang {
  if (!content) return ui;
  const en = NON_SPACE.test(content.en ?? '');
  const ru = NON_SPACE.test(content.ru ?? '');
  if (en === ru) return ui;
  return en ? 'en' : 'ru';
}

const folded = (s: string): string => s.trim().toLocaleLowerCase();

/** Returns whether `name` repeats a name of `names` in either language, without case. */
export function nameTaken(
  names: readonly { en?: string; ru?: string }[],
  name: string
): boolean {
  const want = folded(name);
  if (!want) return false;
  return names.some((n) => [n.en, n.ru].some((v) => v !== undefined && folded(v) === want));
}

/** A heading of `#/homebrew` and the items under it. */
export interface HomebrewGroup {
  id: string;
  label: string;
  items: HomebrewRecord[];
}

const named = (v: { en?: string; ru?: string }, lang: Lang): string =>
  (lang === 'ru' ? v.ru || v.en : v.en || v.ru) ?? '';

/** Returns the groups of `#/homebrew`: each named source by `created_at`, its sections in
 *  order, then its items with no section under the source name; the default source
 *  (`home`) last; empty groups left out; the items by name in `lang`. */
export function groupsOf(
  books: readonly BookRow[],
  records: readonly HomebrewRecord[],
  lang: Lang,
  home: string
): HomebrewGroup[] {
  const byName = (a: HomebrewRecord, b: HomebrewRecord): number =>
    nameOf(a, lang).localeCompare(nameOf(b, lang), lang);
  const out: HomebrewGroup[] = [];
  const push = (id: string, label: string, items: HomebrewRecord[]): void => {
    if (items.length) out.push({ id, label, items: [...items].sort(byName) });
  };
  const known = new Set(books.map((b) => b.key));
  const sorted = [...books].sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const b of sorted) {
    const mine = records.filter((r) => r.book?.key === b.key);
    const name = named(b.content, lang);
    for (const s of b.content.sections ?? []) {
      push(
        s.key,
        name + ' · ' + named(s, lang),
        mine.filter((r) => r.book?.section?.key === s.key)
      );
    }
    push(
      b.key,
      name,
      mine.filter((r) => !r.book?.section)
    );
  }
  push(
    'hb',
    home,
    records.filter((r) => !r.book || !known.has(r.book.key))
  );
  return out;
}
