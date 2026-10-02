/* The homebrew file `homebrew-v1`: the import reads it, the export writes it.
 *
 * `schema/homebrew-v1.json` is the published contract and this module its
 * hand-written validator over the editor's own (`lib/homebrew.ts`), so a file
 * that passes never meets a database refusal; `homebrewFile.test.ts` keeps the
 * schema and the constants equal. Pure module: no port, no storage; the app
 * loads it lazily, and the port takes only its types.
 * docs/specs/CONTRACTS.md section 4;
 * docs/decisions/2026-09-30-homebrew-travels-as-its-own-file.md. */

import { dayOf, jsonFileName } from './bundle.js';
import {
  bookProblems,
  cardProblems,
  contentProblems,
  hasName,
  HOME_NAMES,
  HOMEBREW_KEY,
  nameTaken,
  SECTIONS_MAX,
  type BookContent,
  type BookRow,
  type CardContent,
  type CardKind,
  type CardRow,
  type HomebrewContent,
  type HomebrewEquip,
  type ItemRow,
  type Problem,
  type SectionRow
} from './homebrew.js';
import type { Lang } from './types.js';

export const HOMEBREW_FORMAT = 'daggerheart-loot/homebrew';
export const HOMEBREW_VERSION = 1;
/** The schema's `$id`; an export names it as its `$schema`. */
export const HOMEBREW_SCHEMA =
  'https://artex-x.github.io/daggerheart-loot/schema/homebrew-v1.json';
/** The most sources, cards and items one file holds: `import_homebrew`'s bounds per call,
 *  at least three times the default limits; the account's limits are the database's. */
export const FILE_BOOKS_MAX = 100;
export const FILE_CARDS_MAX = 1000;
export const FILE_ITEMS_MAX = 1000;
/** The most errors a refused file reports; the rest are counted. */
export const ERRORS_MAX = 50;

/** The keys each object of the file may hold, in the schema's order, which the export
 *  writes (`homebrewFile.test.ts` compares them with the schema). */
export const ROOT_KEYS = [
  '$schema',
  'format',
  'version',
  'exported_at',
  'books',
  'cards',
  'items'
] as const;
export const BOOK_KEYS = ['key', 'en', 'ru', 'sections'] as const;
export const SECTION_KEYS = ['key', 'en', 'ru'] as const;
export const CARD_KEYS = [
  'key',
  'kind',
  'book',
  'en',
  'ru',
  'ensub',
  'rusub',
  'ende',
  'rud',
  'url'
] as const;
export const ITEM_KEYS = [
  'key',
  'book',
  'section',
  'kind',
  'en',
  'ru',
  'ende',
  'rud',
  'tier',
  'eq',
  'craft',
  'craft_from',
  'set',
  'refs'
] as const;
export const EQ_KEYS = [
  't',
  'tier',
  'cls',
  'tr',
  'rg',
  'dmg',
  'dt',
  'bu',
  'as',
  'th',
  'alt',
  'line'
] as const;
export const STATS_KEYS = ['tr', 'rg', 'dmg', 'dt'] as const;

export type FileBook = BookContent & { key: string };
export type FileCard = CardContent & { key: string; kind: CardKind; book?: string };
export type FileItem = HomebrewContent & { key: string; book?: string };

export interface HomebrewFile {
  $schema?: string;
  format: typeof HOMEBREW_FORMAT;
  version: typeof HOMEBREW_VERSION;
  exported_at?: string;
  books: FileBook[];
  cards: FileCard[];
  items: FileItem[];
}

export type FileArray = 'books' | 'cards' | 'items';

/** Why a value was refused: a validator's rule, or `unknown` for a `book` that names no
 *  source of the file and a `section` that names no section of the item's source. An
 *  `eq.line` whose members hold another equipment type is `enum`, as in the editor. */
export type FileRule = Problem['rule'] | 'unknown';

/** One error of a refused file. `array` and `index` name the object (null for the file
 *  itself); `field` is the dot path inside it, `name` for "no language holds a name", `''`
 *  for the object or the file itself; `path` is the whole path (`items[2].eq.dmg`), the
 *  object's own for `name`. */
export interface FileError {
  path: string;
  array: FileArray | null;
  index: number | null;
  field: string;
  rule: FileRule;
}

/** What the import keeps but names: a relation id that names nothing in the file, the
 *  account or the catalog (it stays and draws nothing), and a held card key of another
 *  kind (the card is skipped). */
export type FileNote =
  | {
      kind: 'relation';
      index: number;
      field: 'craft' | 'craft_from' | 'eq.line' | 'set' | 'refs';
      id: string;
    }
  | { kind: 'cardKind'; index: number; key: string };

/** An object's names as the report draws it; null for an object that is not one. */
export type FileName = { en?: string; ru?: string } | null;

export type HomebrewParsed =
  | { ok: true; file: HomebrewFile; notes: FileNote[] }
  | { ok: false; reason: 'notJson' | 'notHomebrew' | 'empty' }
  | { ok: false; reason: 'version'; version: unknown }
  | {
      ok: false;
      reason: 'errors';
      errors: FileError[];
      more: number;
      /** Per array of the file, each object's names; empty for an array that is not one. */
      names: Record<FileArray, FileName[]>;
    };

export type EqType = HomebrewEquip['t'];

/** What the parse reads beyond the file: the catalog and the account's own rows. */
export interface FileContext {
  catalogHas(id: string): boolean;
  catalogSet(key: string): boolean;
  catalogRef(key: string): boolean;
  ownItem(key: string): boolean;
  /** The kind of the account's card under `key`; null for none. */
  ownCard(key: string): CardKind | null;
  /** The known members of a line in the catalog and the account, with their type. */
  lineMembers(line: string): readonly { key: string; t: EqType }[];
}

/* ---------- the import's rows and answer (`import_homebrew`) ---------- */

/** A source row: `names` lets an update replace the held source's names. */
export interface ImportBookRow {
  id: string;
  key: string;
  content: BookContent;
  names: boolean;
}
export interface ImportCardRow {
  id: string;
  key: string;
  kind: CardKind;
  /** A source key, or null for none. */
  book: string | null;
  content: CardContent;
}
export interface ImportItemRow {
  id: string;
  key: string;
  book: string | null;
  content: HomebrewContent;
}
export interface HomebrewImportRows {
  books: ImportBookRow[];
  cards: ImportCardRow[];
  items: ImportItemRow[];
  /** «Обновить»: a held key is rewritten; else it is skipped. */
  update: boolean;
}
/** `import_homebrew`'s counts; `*_updated` counts the held rows the call wrote. */
export interface HomebrewImported {
  books_created: number;
  cards_created: number;
  cards_updated: number;
  cards_skipped: number;
  items_created: number;
  items_updated: number;
  items_skipped: number;
}
export const IMPORTED_KEYS = [
  'books_created',
  'cards_created',
  'cards_updated',
  'cards_skipped',
  'items_created',
  'items_updated',
  'items_skipped'
] as const;

/* ---------- the parse ---------- */

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const RELATION_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Returns `v` with `\r\n` and `\r` turned into `\n` in every string value: the database
 *  refuses a carriage return, and a file written on Windows holds them. */
export function withNewlines(v: unknown): unknown {
  if (typeof v === 'string') return v.replace(/\r\n?/g, '\n');
  if (Array.isArray(v)) return v.map(withNewlines);
  if (isObj(v))
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, withNewlines(x)]));
  return v;
}

/* A validator's dot path (`sections.1.key`) as the file's (`sections[1].key`). */
const fileStep = (p: string): string =>
  p
    .split('.')
    .map((part, i) => (/^\d+$/.test(part) ? '[' + part + ']' : (i ? '.' : '') + part))
    .join('');

class Report {
  errors: FileError[] = [];
  more = 0;
  add(e: FileError): void {
    if (this.errors.length < ERRORS_MAX) this.errors.push(e);
    else this.more++;
  }
  /* One problem at `field` of `array[index]`. */
  at(array: FileArray, index: number, field: string, rule: FileRule): void {
    const base = array + '[' + String(index) + ']';
    const inner = field === '' || field === 'name' ? '' : fileStep(field);
    this.add({ path: inner ? base + '.' + inner : base, array, index, field, rule });
  }
  root(field: string, rule: FileRule): void {
    this.add({ path: field, array: null, index: null, field, rule });
  }
}

const without = (o: Obj, keys: readonly string[]): Obj =>
  Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));

/* An object's own key: required, a key's shape, unique within its array. */
function keyOf(r: Report, array: FileArray, i: number, o: Obj, seen: Set<string>): void {
  const key = o['key'];
  if (!('key' in o)) r.at(array, i, 'key', 'required');
  else if (typeof key !== 'string') r.at(array, i, 'key', 'type');
  else if (!HOMEBREW_KEY.test(key)) r.at(array, i, 'key', 'pattern');
  else if (seen.has(key)) r.at(array, i, 'key', 'duplicate');
  if (typeof key === 'string') seen.add(key);
}

/* An object's `book`: absent, or a key of a source of the file. */
function bookOf(
  r: Report,
  array: FileArray,
  i: number,
  o: Obj,
  books: ReadonlyMap<string, ReadonlySet<string>>
): string | undefined {
  if (!('book' in o)) return undefined;
  const book = o['book'];
  if (typeof book !== 'string') r.at(array, i, 'book', 'type');
  else if (!HOMEBREW_KEY.test(book)) r.at(array, i, 'book', 'pattern');
  else if (!books.has(book)) r.at(array, i, 'book', 'unknown');
  else return book;
  return undefined;
}

const nameOfObj = (o: unknown): FileName => {
  if (!isObj(o)) return null;
  const out: { en?: string; ru?: string } = {};
  if (typeof o['en'] === 'string') out.en = o['en'];
  if (typeof o['ru'] === 'string') out.ru = o['ru'];
  return out;
};

/** The scan of the whole file the rules of one object need: the sources with their
 *  sections, the cards by kind, the item keys and the type of each line's members. */
interface Known {
  books: Map<string, Set<string>>;
  sets: Set<string>;
  refs: Set<string>;
  items: Set<string>;
  lines: Map<string, { key: string; t: unknown }[]>;
}

function scan(doc: Obj): Known {
  const k: Known = {
    books: new Map(),
    sets: new Set(),
    refs: new Set(),
    items: new Set(),
    lines: new Map()
  };
  const list = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(isObj) : []);
  for (const b of list(doc['books'])) {
    if (typeof b['key'] !== 'string') continue;
    const sections = Array.isArray(b['sections']) ? b['sections'] : [];
    k.books.set(
      b['key'],
      new Set(
        sections.flatMap((s: unknown) =>
          isObj(s) && typeof s['key'] === 'string' ? [s['key']] : []
        )
      )
    );
  }
  for (const c of list(doc['cards'])) {
    if (typeof c['key'] !== 'string') continue;
    if (c['kind'] === 'set') k.sets.add(c['key']);
    if (c['kind'] === 'ref') k.refs.add(c['key']);
  }
  for (const it of list(doc['items'])) {
    if (typeof it['key'] !== 'string') continue;
    k.items.add(it['key']);
    const eq = it['eq'];
    if (!isObj(eq)) continue;
    if (typeof eq['line'] !== 'string') continue;
    const members = k.lines.get(eq['line']) ?? [];
    members.push({ key: it['key'], t: eq['t'] });
    k.lines.set(eq['line'], members);
  }
  /* A line's own first item is a member though it names the line only by its key. */
  for (const it of list(doc['items'])) {
    const eq = it['eq'];
    const key = it['key'];
    if (typeof key !== 'string' || !isObj(eq)) continue;
    const members = k.lines.get(key);
    if (members && !members.some((m) => m.key === key)) members.push({ key, t: eq['t'] });
  }
  return k;
}

function walkBook(r: Report, i: number, v: unknown, seen: Set<string>): void {
  if (!isObj(v)) {
    r.at('books', i, '', 'type');
    return;
  }
  keyOf(r, 'books', i, v, seen);
  for (const p of bookProblems(without(v, ['key']))) r.at('books', i, p.path, p.rule);
}

function walkCard(
  r: Report,
  i: number,
  v: unknown,
  seen: Set<string>,
  k: Known,
  ctx: FileContext,
  notes: FileNote[]
): void {
  if (!isObj(v)) {
    r.at('cards', i, '', 'type');
    return;
  }
  keyOf(r, 'cards', i, v, seen);
  const kind = v['kind'];
  const problems = cardProblems(kind, without(v, ['key', 'kind', 'book']));
  for (const p of problems) {
    r.at('cards', i, p.path, p.path === 'kind' && !('kind' in v) ? 'required' : p.rule);
  }
  bookOf(r, 'cards', i, v, k.books);
  const key = v['key'];
  if (typeof key === 'string' && (kind === 'set' || kind === 'ref')) {
    const held = ctx.ownCard(key);
    if (held !== null && held !== kind) notes.push({ kind: 'cardKind', index: i, key });
  }
}

function walkItem(
  r: Report,
  i: number,
  v: unknown,
  seen: Set<string>,
  k: Known,
  ctx: FileContext,
  notes: FileNote[]
): void {
  if (!isObj(v)) {
    r.at('items', i, '', 'type');
    return;
  }
  keyOf(r, 'items', i, v, seen);
  const key = typeof v['key'] === 'string' ? v['key'] : undefined;
  const content = without(v, ['key', 'book']);
  for (const p of contentProblems(content, key)) r.at('items', i, p.path, p.rule);
  const book = bookOf(r, 'items', i, v, k.books);
  const section = v['section'];
  if (typeof section === 'string' && HOMEBREW_KEY.test(section)) {
    const sections = book === undefined ? undefined : k.books.get(book);
    if (!('book' in v) || (sections && !sections.has(section))) {
      r.at('items', i, 'section', 'unknown');
    }
  }
  const eq = content['eq'];
  const line = isObj(eq) && typeof eq['line'] === 'string' ? eq['line'] : null;
  if (isObj(eq) && line !== null && RELATION_ID.test(line)) {
    const t = eq['t'];
    const members = [
      ...ctx.lineMembers(line).filter((m) => !k.items.has(m.key)),
      ...(k.lines.get(line) ?? [])
    ].filter((m) => m.key !== key);
    if (members.some((m) => m.t !== t)) r.at('items', i, 'eq.line', 'enum');
  }
  /* The notes: a relation id that names nothing anywhere. */
  const item = (id: string): boolean =>
    k.items.has(id) || ctx.ownItem(id) || ctx.catalogHas(id);
  const ids = (field: 'craft' | 'craft_from' | 'refs'): string[] => {
    const x = content[field];
    return Array.isArray(x) ? x.filter((id): id is string => typeof id === 'string') : [];
  };
  for (const field of ['craft', 'craft_from'] as const) {
    for (const id of ids(field))
      if (!item(id)) notes.push({ kind: 'relation', index: i, field, id });
  }
  if (line !== null && !item(line)) {
    notes.push({ kind: 'relation', index: i, field: 'eq.line', id: line });
  }
  const set = content['set'];
  if (
    typeof set === 'string' &&
    !k.sets.has(set) &&
    ctx.ownCard(set) !== 'set' &&
    !ctx.catalogSet(set)
  ) {
    notes.push({ kind: 'relation', index: i, field: 'set', id: set });
  }
  for (const id of ids('refs')) {
    if (!k.refs.has(id) && ctx.ownCard(id) !== 'ref' && !ctx.catalogRef(id)) {
      notes.push({ kind: 'relation', index: i, field: 'refs', id });
    }
  }
}

const MAX: Record<FileArray, number> = {
  books: FILE_BOOKS_MAX,
  cards: FILE_CARDS_MAX,
  items: FILE_ITEMS_MAX
};

/** Reads a homebrew file: JSON, then `format`, then `version`, then, with every string's
 *  `\r\n` and `\r` turned into `\n`, every key and bound in document order. Each object is
 *  checked by the editor's validators, its file path in front, and by the file's own rules:
 *  keys unique within their array, a `book` of the file, a `section` of the item's own
 *  source, a line of one equipment type. A relation that names nothing, and a held card of
 *  another kind, are notes, never errors. */
export function parseHomebrew(text: string, ctx: FileContext): HomebrewParsed {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'notJson' };
  }
  if (!isObj(raw) || raw['format'] !== HOMEBREW_FORMAT)
    return { ok: false, reason: 'notHomebrew' };
  if (raw['version'] !== HOMEBREW_VERSION) {
    return { ok: false, reason: 'version', version: raw['version'] };
  }
  const doc = withNewlines(raw) as Obj;
  const k = scan(doc);
  const r = new Report();
  const notes: FileNote[] = [];
  const names: Record<FileArray, FileName[]> = { books: [], cards: [], items: [] };
  let objects = 0;
  for (const [key, x] of Object.entries(doc)) {
    switch (key) {
      case 'format':
      case 'version':
        break;
      case '$schema':
      case 'exported_at':
        if (typeof x !== 'string') r.root(key, 'type');
        break;
      case 'books':
      case 'cards':
      case 'items': {
        if (!Array.isArray(x)) {
          r.root(key, 'type');
          break;
        }
        names[key] = x.map(nameOfObj);
        objects += x.length;
        if (x.length > MAX[key]) r.root(key, 'many');
        const seen = new Set<string>();
        x.forEach((v: unknown, i) => {
          if (key === 'books') walkBook(r, i, v, seen);
          else if (key === 'cards') walkCard(r, i, v, seen, k, ctx, notes);
          else walkItem(r, i, v, seen, k, ctx, notes);
        });
        break;
      }
      default:
        r.root(key, 'extra');
    }
  }
  if (r.errors.length)
    return { ok: false, reason: 'errors', errors: r.errors, more: r.more, names };
  if (!objects) return { ok: false, reason: 'empty' };
  const file: HomebrewFile = {
    ...(typeof doc['$schema'] === 'string' ? { $schema: doc['$schema'] } : {}),
    format: HOMEBREW_FORMAT,
    version: HOMEBREW_VERSION,
    ...(typeof doc['exported_at'] === 'string' ? { exported_at: doc['exported_at'] } : {}),
    books: (doc['books'] ?? []) as FileBook[],
    cards: (doc['cards'] ?? []) as FileCard[],
    items: (doc['items'] ?? []) as FileItem[]
  };
  return { ok: true, file, notes };
}

/* ---------- the export ---------- */

/* `o`'s keys in `order`, the ones it lacks left out. */
function ordered<T extends object>(o: T, order: readonly string[]): T {
  const src = o as Obj;
  const out: Obj = {};
  for (const k of order) if (k in src && src[k] !== undefined) out[k] = src[k];
  return out as T;
}

const byCreation = <T extends { created_at: string }>(rows: readonly T[]): T[] =>
  [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));

/** Returns the homebrew file of the rows: `$schema`, `format`, `version`, `exported_at`,
 *  then the sources, the cards and the items by creation, each object's keys in the
 *  schema's order and `book` as the source's key. Empty arrays are written. */
export function toHomebrewFile(
  books: readonly BookRow[],
  items: readonly ItemRow[],
  cards: readonly CardRow[],
  now: Date
): HomebrewFile {
  const keyById = new Map(books.map((b) => [b.id, b.key]));
  const bookById = new Map(books.map((b) => [b.id, b]));
  const bookKey = (id: string | null): { book?: string } => {
    const key = id === null ? undefined : keyById.get(id);
    return key === undefined ? {} : { book: key };
  };
  return {
    $schema: HOMEBREW_SCHEMA,
    format: HOMEBREW_FORMAT,
    version: HOMEBREW_VERSION,
    exported_at: now.toISOString(),
    books: byCreation(books).map((b) => {
      const sections = b.content.sections?.map((s: SectionRow) => ordered(s, SECTION_KEYS));
      return ordered(
        { ...b.content, key: b.key, ...(sections ? { sections } : {}) },
        BOOK_KEYS
      );
    }),
    cards: byCreation(cards).map((c) =>
      ordered({ ...c.content, key: c.key, kind: c.kind, ...bookKey(c.book_id) }, CARD_KEYS)
    ),
    items: byCreation(items).map((i) => {
      const { section, ...rest } = i.content;
      const book = i.book_id === null ? undefined : bookById.get(i.book_id);
      /* A section its source no longer holds is left out: the file stays importable. */
      const held =
        section !== undefined && book?.content.sections?.some((s) => s.key === section);
      const eq = i.content.eq;
      const sorted = eq
        ? {
            eq: ordered(
              { ...eq, ...(eq.alt ? { alt: ordered(eq.alt, STATS_KEYS) } : {}) },
              EQ_KEYS
            )
          }
        : {};
      return ordered(
        { ...rest, ...(held ? { section } : {}), ...sorted, key: i.key, ...bookKey(i.book_id) },
        ITEM_KEYS
      );
    })
  };
}

/** Returns the file's text: two-space JSON and a final newline. */
export function homebrewText(f: HomebrewFile): string {
  return JSON.stringify(f, null, 2) + '\n';
}

/** What a download writes: one source with its items (`book`, null for the default
 *  source), or the ticked items (`items`, their keys). */
export type Subset = { book: string | null } | { items: readonly string[] };

/** Returns the rows of a download: for a source, the source, its items and the own cards
 *  that belong to it or that its items name; for ticked items, those items, their sources
 *  and the own cards they name. */
export function subsetOf(held: HeldRows, pick: Subset): HeldRows {
  const known = new Set(held.books.map((b) => b.id));
  const home = (id: string | null): boolean => id === null || !known.has(id);
  let items: ItemRow[];
  let books: BookRow[];
  let own: (c: CardRow) => boolean;
  if ('items' in pick) {
    const keys = new Set(pick.items);
    items = held.items.filter((i) => keys.has(i.key));
    const ids = new Set(items.map((i) => i.book_id));
    books = held.books.filter((b) => ids.has(b.id));
    own = () => false;
  } else {
    const { book } = pick;
    items = held.items.filter((i) => (book === null ? home(i.book_id) : i.book_id === book));
    books = held.books.filter((b) => b.id === book);
    own = (c) => (book === null ? home(c.book_id) : c.book_id === book);
  }
  const named = new Set(items.flatMap((i) => [i.content.set ?? '', ...(i.content.refs ?? [])]));
  const cards = held.cards.filter((c) => own(c) || named.has(c.key));
  return { books, items, cards };
}

/** Returns a download's file name: `<source name>.json` with the lists' rule for unsafe
 *  characters, or the dated `daggerheart-loot-homebrew-<YYYY-MM-DD>.json` for ticked
 *  items (`name` null). */
export function homebrewFileName(name: string | null, now: Date): string {
  return name === null
    ? 'daggerheart-loot-homebrew-' + dayOf(now) + '.json'
    : jsonFileName(name, 'homebrew');
}

/* ---------- the import plan: the «Куда» rows and the call's rows ---------- */

/** What the account holds that the plan and the exports read. */
export interface HeldRows {
  books: readonly BookRow[];
  items: readonly ItemRow[];
  cards: readonly CardRow[];
}

/** One «Куда» row: a source of the file, or `book` null for its items and cards with none. */
export interface PlanRow {
  book: FileBook | null;
  items: number;
  cards: number;
}

/** Where a row's items and cards go: the default source, a held source, the row's own new
 *  source made from the file, a new source the file makes for another row (the «Без
 *  источника» row only), or a new source of the GM's name. */
export type Target =
  | { kind: 'home' }
  | { kind: 'held'; id: string }
  | { kind: 'new' }
  | { kind: 'file'; book: string }
  | { kind: 'custom'; name: string; lang: Lang };

const sameName = (a: { en?: string; ru?: string }, b: { en?: string; ru?: string }): boolean =>
  [a.en, a.ru].some((n) => n !== undefined && hasName(n) && nameTaken([b], n));

/** Returns the rows of the «Куда» part: each source of the file in file order, then one row
 *  for the items and cards with no `book` when there is any. */
export function rowsOf(file: HomebrewFile): PlanRow[] {
  const rows: PlanRow[] = file.books.map((b) => ({
    book: b,
    items: file.items.filter((i) => i.book === b.key).length,
    cards: file.cards.filter((c) => c.book === b.key).length
  }));
  const items = file.items.filter((i) => i.book === undefined).length;
  const cards = file.cards.filter((c) => c.book === undefined).length;
  if (items || cards) rows.push({ book: null, items, cards });
  return rows;
}

/** Returns a row's default target: the held source of the file source's key, then a held
 *  source of the same name in either language without case (the oldest first), then a new
 *  source; the default source for the row with no source. */
export function defaultTarget(row: PlanRow, held: HeldRows): Target {
  const b = row.book;
  if (!b) return { kind: 'home' };
  const books = byCreation(held.books);
  const byKey = books.find((h) => h.key === b.key);
  if (byKey) return { kind: 'held', id: byKey.id };
  const byName = books.find((h) => sameName(b, h.content));
  return byName ? { kind: 'held', id: byName.id } : { kind: 'new' };
}

/** Returns the name the row's own new source takes: the file source's name, with « 2»,
 *  « 3», ... when a held source or the default source has it. */
export function newName(book: FileBook, held: HeldRows): { en?: string; ru?: string } {
  const names = [...held.books.map((h) => h.content), ...HOME_NAMES];
  const taken = (v: { en?: string; ru?: string }): boolean =>
    [v.en, v.ru].some((n) => n !== undefined && nameTaken(names, n));
  const base = { ...(book.en ? { en: book.en } : {}), ...(book.ru ? { ru: book.ru } : {}) };
  if (!taken(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = ' ' + String(n);
    const next = {
      ...(base.en ? { en: base.en + suffix } : {}),
      ...(base.ru ? { ru: base.ru + suffix } : {})
    };
    if (!taken(next)) return next;
  }
}

/** What the press does for one row, drawn under it. */
export type RowNote =
  | { kind: 'new'; sections: number }
  | { kind: 'key' }
  | { kind: 'name' }
  | { kind: 'add'; sections: number }
  | { kind: 'home' };

/** One row's notes, and the target's name when the merge passes `SECTIONS_MAX`. */
export interface RowPlan {
  notes: RowNote[];
  full: { en?: string; ru?: string } | null;
}

/* A file section's key in the target's sections: the same key, then the same name, else
   none (the section is added with the file's key). */
function joinedKey(s: SectionRow, into: readonly SectionRow[]): string | undefined {
  return (into.find((x) => x.key === s.key) ?? into.find((x) => sameName(s, x)))?.key;
}

/** Returns each row's plan for `targets` (one per row, in order): the notes of
 *  docs/specs/FEATURES.md, "Homebrew", "Import", and whether the held target would pass
 *  `SECTIONS_MAX` sections once every row that goes into it adds its own. */
export function planOf(
  rows: readonly PlanRow[],
  targets: readonly Target[],
  held: HeldRows
): RowPlan[] {
  const added = new Map<string, SectionRow[]>();
  const into = (id: string): SectionRow[] => {
    let list = added.get(id);
    if (!list) {
      list = [...(held.books.find((b) => b.id === id)?.content.sections ?? [])];
      added.set(id, list);
    }
    return list;
  };
  const adds = rows.map((row, i) => {
    const t = targets[i];
    if (t?.kind !== 'held' || !row.book) return 0;
    const list = into(t.id);
    let n = 0;
    for (const s of row.book.sections ?? []) {
      if (joinedKey(s, list) === undefined) {
        list.push(s);
        n++;
      }
    }
    return n;
  });
  return rows.map((row, i): RowPlan => {
    const t = targets[i] ?? { kind: 'home' };
    const notes: RowNote[] = [];
    const sections = row.book?.sections?.length ?? 0;
    const sectioned = row.book !== null && sections > 0;
    let full: RowPlan['full'] = null;
    if (t.kind === 'new' || (t.kind === 'custom' && row.book)) {
      if (sections) notes.push({ kind: 'new', sections });
    } else if (t.kind === 'held') {
      const h = held.books.find((b) => b.id === t.id);
      if (h && row.book && h.key === row.book.key) notes.push({ kind: 'key' });
      else if (h && row.book && sameName(row.book, h.content)) notes.push({ kind: 'name' });
      const n = adds[i] ?? 0;
      if (n) notes.push({ kind: 'add', sections: n });
      if (h && (added.get(t.id)?.length ?? 0) > SECTIONS_MAX) full = h.content;
    } else if (t.kind === 'home' && sectioned) {
      notes.push({ kind: 'home' });
    }
    return { notes, full };
  });
}

/** The ids and keys a press sends, made once per file and mapping and kept by the caller,
 *  so a retry after a lost answer sends the same rows. */
export interface ImportIds {
  /** The id of a row the call may insert, by a slot name (`item:<key>`, ...). */
  id(slot: string): string;
  /** The key of a source the press makes (`custom:<row>`, `new:<row>`): `first` when given
   *  on the slot's first call, else a fresh key; the same on every later call. */
  key(slot: string, first?: string): string;
}

/* Where a row's items go: the source key (null: the default source) and each file section's
   key there. */
interface Dest {
  key: string | null;
  sections: Map<string, string>;
}

/** Returns the call's rows for the file, its rows and their targets: each source the press
 *  writes (a held one with the sections it lacks, a new one with the file's names and
 *  sections), then the cards and the items with `book` the target's key and `section` the
 *  joined key (none in the default source). With `update` a held source reached by its own
 *  key takes the file's names. */
export function toHomebrewRows(
  file: HomebrewFile,
  rows: readonly PlanRow[],
  targets: readonly Target[],
  held: HeldRows,
  update: boolean,
  ids: ImportIds
): HomebrewImportRows {
  const books: ImportBookRow[] = [];
  const sent = new Map<string, ImportBookRow>();
  const heldKeys = new Set(held.books.map((b) => b.key));
  const dests: (Dest | undefined)[] = rows.map(() => undefined);
  const sectionsOf = (b: FileBook | null): SectionRow[] => b?.sections ?? [];
  const identity = (b: FileBook | null): Map<string, string> =>
    new Map(sectionsOf(b).map((s) => [s.key, s.key]));

  const resolve = (i: number, seen: number[] = []): Dest => {
    const done = dests[i];
    if (done) return done;
    const row = rows[i];
    const t = targets[i] ?? { kind: 'home' };
    let d: Dest = { key: null, sections: new Map() };
    if (row && t.kind === 'held') {
      const h = held.books.find((b) => b.id === t.id);
      if (h) {
        let book = sent.get(h.id);
        if (!book) {
          const own = row.book !== null && row.book.key === h.key;
          const names = own && row.book ? namesOf(row.book) : namesOf(h.content);
          book = { id: h.id, key: h.key, content: { ...names }, names: own };
          sent.set(h.id, book);
          books.push(book);
        }
        const merged = [...(h.content.sections ?? []), ...(book.content.sections ?? [])];
        const map = new Map<string, string>();
        for (const s of sectionsOf(row.book)) {
          const k = joinedKey(s, merged);
          if (k !== undefined) map.set(s.key, k);
          else {
            const copy = ordered({ ...s }, SECTION_KEYS);
            book.content = {
              ...book.content,
              sections: [...(book.content.sections ?? []), copy]
            };
            merged.push(copy);
            map.set(s.key, s.key);
          }
        }
        d = { key: h.key, sections: map };
      }
    } else if (row?.book && t.kind === 'new') {
      /* The file's key unless the account holds it; kept per row, so a retry after a lost
         answer, which holds it then, sends the same key. */
      const key = ids.key(
        'new:' + String(i),
        heldKeys.has(row.book.key) ? undefined : row.book.key
      );
      const sections = sectionsOf(row.book).map((s) => ordered({ ...s }, SECTION_KEYS));
      books.push({
        id: ids.id('book:' + key),
        key,
        content: { ...newName(row.book, held), ...(sections.length ? { sections } : {}) },
        /* Held already: the retry of a call that landed, which renames nothing. */
        names: !heldKeys.has(key)
      });
      d = { key, sections: identity(row.book) };
    } else if (row && t.kind === 'custom') {
      const key = ids.key('custom:' + String(i));
      const sections = sectionsOf(row.book).map((s) => ordered({ ...s }, SECTION_KEYS));
      books.push({
        id: ids.id('book:' + key),
        key,
        content: { [t.lang]: t.name.trim(), ...(sections.length ? { sections } : {}) },
        names: !heldKeys.has(key)
      });
      d = { key, sections: identity(row.book) };
    } else if (row && t.kind === 'file' && !seen.includes(i)) {
      const at = rows.findIndex((r) => r.book?.key === t.book);
      const other = targets[at];
      if (at >= 0 && (other?.kind === 'new' || other?.kind === 'custom')) {
        d = { key: resolve(at, [...seen, i]).key, sections: new Map() };
      }
    }
    dests[i] = d;
    return d;
  };
  rows.forEach((_r, i) => resolve(i));

  const destOf = (book: string | undefined): Dest => {
    const i = rows.findIndex((r) => (r.book?.key ?? undefined) === book);
    return (i >= 0 ? dests[i] : undefined) ?? { key: null, sections: new Map() };
  };
  const cards = file.cards.map((c): ImportCardRow => {
    const { key, kind, book, ...content } = c;
    return { id: ids.id('card:' + key), key, kind, book: destOf(book).key, content };
  });
  const items = file.items.map((it): ImportItemRow => {
    const { key, book, section, ...rest } = it;
    const d = destOf(book);
    const joined =
      section === undefined || d.key === null ? undefined : d.sections.get(section);
    const content: HomebrewContent = joined === undefined ? rest : { ...rest, section: joined };
    return { id: ids.id('item:' + key), key, book: d.key, content };
  });
  return { books, cards, items, update };
}

const namesOf = (v: { en?: string; ru?: string }): { en?: string; ru?: string } => ({
  ...(v.en !== undefined ? { en: v.en } : {}),
  ...(v.ru !== undefined ? { ru: v.ru } : {})
});

/** The preview's counts: the keys the account holds among the file's items, cards and
 *  sources, and the file items with a new key whose name an account item has. */
export interface HeldCounts {
  items: number;
  cards: number;
  books: number;
  sameNames: number;
}

/** Returns the preview's counts of held keys and repeated names (`HeldCounts`). The key is
 *  the only identity: a repeated name with a new key is added, never matched. */
export function heldOf(file: HomebrewFile, held: HeldRows): HeldCounts {
  const itemKeys = new Set(held.items.map((i) => i.key));
  const cardKeys = new Set(held.cards.map((c) => c.key));
  const bookKeys = new Set(held.books.map((b) => b.key));
  const names = held.items.map((i) => i.content);
  return {
    items: file.items.filter((i) => itemKeys.has(i.key)).length,
    cards: file.cards.filter((c) => cardKeys.has(c.key)).length,
    books: file.books.filter((b) => bookKeys.has(b.key)).length,
    sameNames: file.items.filter(
      (i) =>
        !itemKeys.has(i.key) &&
        [i.en, i.ru].some((n) => n !== undefined && hasName(n) && nameTaken(names, n))
    ).length
  };
}
