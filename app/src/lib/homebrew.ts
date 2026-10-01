/* The author's homebrew items and sources: the keys, the stored shapes, the
 * validators and the record a homebrew item draws as.
 *
 * The validators accept and refuse what the database's do
 * (the `homebrew_*` functions in `supabase/migrations/`), over one fixture set
 * (`docs/fixtures/homebrew/`); `recordOf` writes what `homebrew_snapshot_of`
 * writes. Pure module: no port, no storage.
 * docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md. */

import { relate, type Index } from './data.js';
import { nameOf } from './i18n.js';
import type {
  DamageType,
  EquipClass,
  Lang,
  Range,
  Record_,
  RefCard,
  SetCard,
  Trait
} from './types.js';

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
export const SNAPSHOT_BYTES = 131072;

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
  /** The upgrade line: a catalog line's id or an own item's key. */
  line?: string;
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
  /** The ids this upgrades into, 1-8, never its own key. */
  craft?: string[];
  /** The ids this is made from, 1-8, never its own key; only a homebrew item writes it. */
  craft_from?: string[];
  /** A catalog set's key or an own set card's. */
  set?: string;
  /** 1-3 keys of catalog or own rule cards. */
  refs?: string[];
}

export type CardKind = 'set' | 'ref';

/** A card's stored part. A set card holds only the names and `ende`/`rud`, its bonus; a
 *  rule card adds the subtitles and the link. */
export interface CardContent {
  en?: string;
  ru?: string;
  ensub?: string;
  rusub?: string;
  ende?: string;
  rud?: string;
  url?: string;
}

export type CardRef = CardContent & { key: string; kind: CardKind };

export interface CardRow {
  id: string;
  key: string;
  kind: CardKind;
  book_id: string | null;
  content: CardContent;
  revision: number;
  created_at: string;
  updated_at: string;
}

export type NewCardRow = Pick<CardRow, 'id' | 'key' | 'kind' | 'book_id' | 'content'>;

/** The own cards a record embeds, in the catalog's card shape, by key. */
export interface RecordCards {
  sets?: Record<string, SetCard>;
  refs?: Record<string, RefCard>;
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
export type HomebrewRecord = Record_ & {
  book?: NamedKey & { section?: NamedKey };
  craft_from?: readonly string[];
  cards?: RecordCards;
};

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
    /** An item names itself in `craft` or `craft_from`. */
    | 'self'
    /** The form's own rule: the chosen source was deleted meanwhile. */
    | 'gone'
    /** The form's own rule: the inline set or rule card form is still open. */
    | 'open';
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
const DMG = /^d(4|6|8|10|12|20)(\+[1-9][0-9]?)?$/;

const RELATION_ID = /^[A-Za-z0-9_-]{1,64}$/;
/** The most ids of an item's `craft` or `craft_from`. */
export const CRAFT_MAX = 8;
/** The most rule cards an item names in `refs`. */
export const REFS_MAX = 3;
/** The most code points of a card's name, per language. */
export const CARD_NAME_MAX = 80;
/** The most code points of a rule card's subtitle, per language. */
export const CARD_SUB_MAX = 60;
/** The most code points of a card's text (a set's bonus), per language. */
export const CARD_TEXT_MAX = 1500;
/** The most characters of a rule card's link. */
export const CARD_URL_MAX = 300;
const CARD_URL = /^(https:\/\/[\x21-\x7e]+)?$/;
const SET_KEYS = ['en', 'ru', 'ende', 'rud'];
const REF_KEYS = ['en', 'ru', 'ensub', 'rusub', 'ende', 'rud', 'url'];

const CONTENT_KEYS = [
  'kind',
  'en',
  'ru',
  'ende',
  'rud',
  'tier',
  'eq',
  'section',
  'craft',
  'craft_from',
  'set',
  'refs'
];
const EQ_KEYS = ['t', 'tier', 'cls', 'tr', 'rg', 'dmg', 'dt', 'bu', 'as', 'th', 'alt', 'line'];
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
  oneIdProblems(eq, 'line', 'eq', out);
  extraProblems(eq, EQ_KEYS, 'eq', out);
}

/* A list of record ids: absent, or 1..max unique ids of a list entry key's shape, none
   equal to `self`. Past `max` no id is checked. */
function idsProblems(
  o: Obj,
  key: string,
  max: number,
  self: string | undefined,
  out: Problem[]
): void {
  if (!(key in o)) return;
  const v = o[key];
  if (!Array.isArray(v)) out.push({ path: key, rule: 'type' });
  else if (!v.length) out.push({ path: key, rule: 'required' });
  else if (v.length > max) out.push({ path: key, rule: 'many' });
  else {
    const seen = new Set<string>();
    v.forEach((id: unknown, i) => {
      const path = key + '.' + String(i);
      if (typeof id !== 'string') out.push({ path, rule: 'type' });
      else if (!RELATION_ID.test(id)) out.push({ path, rule: 'pattern' });
      else if (seen.has(id)) out.push({ path, rule: 'duplicate' });
      else if (id === self) out.push({ path, rule: 'self' });
      if (typeof id === 'string') seen.add(id);
    });
  }
}

/* One record id: absent, or a string of a list entry key's shape. */
function oneIdProblems(o: Obj, key: string, base: string, out: Problem[]): void {
  if (!(key in o)) return;
  const v = o[key];
  const path = at(base, key);
  if (typeof v !== 'string') out.push({ path, rule: 'type' });
  else if (!RELATION_ID.test(v)) out.push({ path, rule: 'pattern' });
}

/** Returns every problem of an item's stored part, in the order kind, name, en, ru, ende,
 *  rud, tier, section, craft, craft_from, set, refs, eq, then the unknown keys; none for a
 *  valid one. With `key`, an id of `craft` or `craft_from` equal to it is the rule `self`. */
export function contentProblems(v: unknown, key?: string): Problem[] {
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
  idsProblems(v, 'craft', CRAFT_MAX, key, out);
  idsProblems(v, 'craft_from', CRAFT_MAX, key, out);
  oneIdProblems(v, 'set', '', out);
  idsProblems(v, 'refs', REFS_MAX, undefined, out);
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

/** Returns every problem of a card's stored part for its kind, in the order kind, name, en,
 *  ru, ensub, rusub, ende, rud, url, then the unknown keys; none for a valid one. */
export function cardProblems(kind: unknown, v: unknown): Problem[] {
  const out: Problem[] = [];
  if (kind !== 'set' && kind !== 'ref') out.push({ path: 'kind', rule: 'enum' });
  if (!isObj(v)) return [...out, { path: '', rule: 'type' }];
  const set = kind === 'set';
  namesProblems(v, CARD_NAME_MAX, '', out);
  if (!set) {
    textProblems(v, 'ensub', CARD_SUB_MAX, '', out);
    textProblems(v, 'rusub', CARD_SUB_MAX, '', out);
  }
  textProblems(v, 'ende', CARD_TEXT_MAX, '', out);
  textProblems(v, 'rud', CARD_TEXT_MAX, '', out);
  if (!set && 'url' in v) {
    const url = v['url'];
    const before = out.length;
    textProblems(v, 'url', CARD_URL_MAX, '', out);
    if (out.length === before && typeof url === 'string' && !CARD_URL.test(url))
      out.push({ path: 'url', rule: 'pattern' });
  }
  extraProblems(v, set ? SET_KEYS : REF_KEYS, '', out);
  return out;
}

/* A snapshot's `cards`: only `sets` and `refs`, each an object; a set card under the
   record's `set`, a rule card under a key of its `refs`; every key an `hb_` key and every
   card valid for its group's kind (homebrew_snapshot_valid). */
function cardsValid(v: unknown, set: unknown, refs: unknown): boolean {
  if (!isObj(v) || Object.keys(v).some((k) => k !== 'sets' && k !== 'refs')) return false;
  const named = (key: string, kind: CardKind): boolean =>
    kind === 'set' ? key === set : Array.isArray(refs) && refs.includes(key);
  for (const [group, kind] of [
    ['sets', 'set'],
    ['refs', 'ref']
  ] as const) {
    if (!(group in v)) continue;
    const cards = v[group];
    if (!isObj(cards)) return false;
    for (const [key, card] of Object.entries(cards)) {
      if (!named(key, kind) || !HOMEBREW_KEY.test(key)) return false;
      if (cardProblems(kind, card).length) return false;
    }
  }
  return true;
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
  if ('cards' in v && !cardsValid(v['cards'], v['set'], v['refs'])) return false;
  const rest = Object.fromEntries(
    Object.entries(v).filter(
      ([k]) => k !== 'id' && k !== 'src' && k !== 'book' && k !== 'cards'
    )
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
 *  source. Of `cards`, the set card under the item's `set` and the rule cards its `refs`
 *  names are embedded in `cards`, in the catalog's card shape; absent when none is. */
export function recordOf(
  key: string,
  c: HomebrewContent,
  book: BookRef | null,
  cards: readonly CardRef[] = []
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
  const sets: Record<string, SetCard> = {};
  const refs: Record<string, RefCard> = {};
  for (const card of cards) {
    if (card.kind === 'set' && card.key === c.set) {
      sets[card.key] = {
        en: filled(card.en, card.ru),
        ru: filled(card.ru, card.en),
        ende: filled(card.ende, card.rud),
        rud: filled(card.rud, card.ende)
      };
    } else if (card.kind === 'ref' && c.refs?.includes(card.key)) {
      refs[card.key] = {
        en: filled(card.en, card.ru),
        ru: filled(card.ru, card.en),
        ensub: filled(card.ensub, card.rusub),
        rusub: filled(card.rusub, card.ensub),
        ende: filled(card.ende, card.rud),
        rud: filled(card.rud, card.ende),
        url: card.url ?? ''
      };
    }
  }
  const embedded: RecordCards = {};
  if (Object.keys(sets).length) embedded.sets = sets;
  if (Object.keys(refs).length) embedded.refs = refs;
  if (embedded.sets || embedded.refs) out.cards = embedded;
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
 *  an own item stays live. The own records also follow the catalog's in `searchable` and,
 *  with a stat block, in `allEquip`, make the `homebrew` rows and join the relation maps
 *  (`relate`) over the catalog and the own records. `refs` and `sets` add the cards the
 *  own records embed, then those of the frozen copies that joined, a key kept by its first
 *  holder and the catalog's first of all. A frozen copy joins no relation. `base` itself
 *  when both are empty. */
export function withRecords(
  base: Index,
  own: readonly HomebrewRecord[],
  frozen: readonly HomebrewRecord[]
): Index {
  if (!own.length && !frozen.length) return base;
  const byId = new Map<string, Record_>(base.byId);
  for (const it of own) byId.set(it.id, it);
  const relations = own.length ? relate(base, own, byId) : null;
  const joined: HomebrewRecord[] = [];
  for (const it of frozen) {
    if (byId.has(it.id)) continue;
    byId.set(it.id, it);
    joined.push(it);
  }
  const refs: Record<string, RefCard> = { ...base.refs };
  const sets: Record<string, SetCard> = { ...base.sets };
  for (const it of [...own, ...joined]) {
    for (const [k, card] of Object.entries(it.cards?.refs ?? {})) refs[k] ??= card;
    for (const [k, card] of Object.entries(it.cards?.sets ?? {})) sets[k] ??= card;
  }
  if (!relations) return { ...base, byId, refs, sets };
  const rows = new Map(base.rows);
  rows.set('homebrew', own);
  return {
    ...base,
    ...relations,
    byId,
    rows,
    searchable: [...base.searchable, ...own],
    allEquip: [...base.allEquip, ...own.filter((it) => it.eq)],
    refs,
    sets
  };
}

/** Returns the index search and the equipment tables read: `index` itself while the
 *  «Хоумбрю» chip is on, else its `searchable` and `allEquip` taken from `base`. */
export function browseIndex(index: Index, base: Index, shown: boolean): Index {
  if (shown || index === base) return index;
  return { ...index, searchable: base.searchable, allEquip: base.allEquip };
}

/** Returns the language the editor writes an item's name and description in: the UI
 *  language for a new item or one named in both, else the one language that names it. */
export function editLang(content: HomebrewContent | CardContent | null, ui: Lang): Lang {
  if (!content) return ui;
  const en = NON_SPACE.test(content.en ?? '');
  const ru = NON_SPACE.test(content.ru ?? '');
  if (en === ru) return ui;
  return en ? 'en' : 'ru';
}

/** Returns how many of `items`, the item `key` itself left out, name `key` in `craft`,
 *  `craft_from` or `eq.line`. */
export function itemUses(items: readonly ItemRow[], key: string): number {
  return items.filter(
    (it) =>
      it.key !== key &&
      (it.content.craft?.includes(key) ||
        it.content.craft_from?.includes(key) ||
        it.content.eq?.line === key)
  ).length;
}

/** Returns how many of `items` name the card: `set` equal to `key` for a set card, `refs`
 *  holding it for a rule card. */
export function cardUses(items: readonly ItemRow[], kind: CardKind, key: string): number {
  return items.filter((it) =>
    kind === 'set' ? it.content.set === key : !!it.content.refs?.includes(key)
  ).length;
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
