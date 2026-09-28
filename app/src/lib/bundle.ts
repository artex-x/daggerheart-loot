/* The lists file `import-v1`: the export writes it, the import reads it.
 *
 * `schema/import-v1.json` is the published contract and this module its
 * hand-written validator; `bundle.test.ts` keeps the two equal. Pure module:
 * the report's words are the component's, this returns indexes and keys.
 * docs/specs/CONTRACTS.md section 4. */

import {
  NAME_MAX,
  NOTE_MAX,
  PRICE_MAX,
  type CloudList,
  type EntryRow,
  type ImportRow
} from './cloudLists.js';
import { QTY_MAX, type ListEntryMeta } from './listLink.js';
import { MONEY_DEFAULT, MONEY_MODES, type MoneyMode } from './money.js';

export const BUNDLE_FORMAT = 'daggerheart-loot/lists';
export const BUNDLE_VERSION = 1;
/** The schema's `$id`; an export names it as its `$schema`. */
export const BUNDLE_SCHEMA = 'https://artex-x.github.io/daggerheart-loot/schema/import-v1.json';
/** The most lists one file holds: the account's default limit. */
export const LISTS_MAX = 50;
/** The most entries one list of a file holds: the account's default limit. */
export const ENTRIES_MAX = 100;
/** The largest file the import reads. */
export const FILE_MAX_BYTES = 5 * 1024 * 1024;
/** A record id: `catalog.csv`'s `id` column. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** The entry sources version 1 takes. */
export const SOURCES: readonly string[] = ['official'];
/** The most errors a refused file reports; the rest are counted. */
export const ERRORS_MAX = 50;

export interface BundleEntry {
  id: string;
  name?: string;
  source?: string;
  quantity?: number;
  price_coins?: number;
  player_note?: string;
  gm_note?: string;
}

export interface BundleList {
  name: string;
  money_mode?: MoneyMode;
  player_note?: string;
  gm_note?: string;
  entries: BundleEntry[];
}

/** A lists file as the export writes it: a key is left out when it holds its default. */
export interface Bundle {
  $schema: string;
  format: typeof BUNDLE_FORMAT;
  version: typeof BUNDLE_VERSION;
  exported_at: string;
  lists: BundleList[];
}

/** Returns the lists file of `lists`, in the order given. An entry's `name` is `nameOf`'s,
 *  left out when it has none; a blank list name is written as `untitled`, so the file keeps
 *  the schema's `minLength`. */
export function toBundle(
  lists: readonly CloudList[],
  nameOf: (id: string) => string | undefined,
  untitled: string,
  now: Date
): Bundle {
  return {
    $schema: BUNDLE_SCHEMA,
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    exported_at: now.toISOString(),
    lists: lists.map((l): BundleList => ({
      name: l.name.trim() ? l.name : untitled,
      ...(l.money === 'coin' ? { money_mode: 'coin' as const } : {}),
      ...(l.note ? { player_note: l.note } : {}),
      ...(l.hnote ? { gm_note: l.hnote } : {}),
      entries: l.ids.map((id) => entryOf(id, l.meta?.[id] ?? {}, nameOf(id)))
    }))
  };
}

function entryOf(id: string, m: ListEntryMeta, name: string | undefined): BundleEntry {
  const e: BundleEntry = { id };
  if (name) e.name = name;
  if (m.qty && m.qty > 1) e.quantity = m.qty;
  if (m.gold) e.price_coins = m.gold;
  if (m.note) e.player_note = m.note;
  if (m.hnote) e.gm_note = m.hnote;
  return e;
}

/** Returns the file's text: two-space JSON and a final newline. */
export function bundleText(b: Bundle): string {
  return JSON.stringify(b, null, 2) + '\n';
}

const two = (n: number): string => String(n).padStart(2, '0');
/* The characters Windows refuses in a file name; control characters are replaced too. */
const UNSAFE = '\\/:*?"<>|';

/* The export's day, YYYY-MM-DD in local time. */
const dayOf = (now: Date): string =>
  [now.getFullYear(), two(now.getMonth() + 1), two(now.getDate())].join('-');

/** Returns an export's file name: `<name>.json` for one list, else the dated
 *  `daggerheart-loot-lists-<YYYY-MM-DD>.json` in local time. */
export function bundleFileName(lists: readonly { name: string }[], now: Date): string {
  const [only] = lists;
  if (lists.length !== 1 || !only) return 'daggerheart-loot-lists-' + dayOf(now) + '.json';
  const safe = Array.from(only.name, (c) =>
    c < ' ' || c === '\u007f' || UNSAFE.includes(c) ? '_' : c
  );
  const cut = safe.join('').trim();
  const short = Array.from(cut).slice(0, 80).join('').trim();
  return (short || 'list') + '.json';
}

/** Returns the account's data file name, `daggerheart-loot-data-<YYYY-MM-DD>.zip` in local
 *  time. */
export function dataFileName(now: Date): string {
  return 'daggerheart-loot-data-' + dayOf(now) + '.zip';
}

/** Returns where a file breaks the schema's bounds: `many` past `LISTS_MAX` lists, `long` the
 *  names of the lists past `ENTRIES_MAX` entries, in file order. An export still writes them
 *  whole. */
export function overBounds(b: Bundle): { many: boolean; long: string[] } {
  return {
    many: b.lists.length > LISTS_MAX,
    long: b.lists.filter((l) => l.entries.length > ENTRIES_MAX).map((l) => l.name)
  };
}

const utf8 = new TextDecoder('utf-8', { fatal: true });

/** Returns the bytes as text, strict UTF-8 with a leading byte order mark dropped; null for
 *  bytes that are not UTF-8. The plain file and the data zip's `lists.json` both go
 *  through here. */
export function decodeText(bytes: Uint8Array): string | null {
  try {
    return utf8.decode(bytes);
  } catch {
    return null;
  }
}

/** Why a value was refused. `type` also covers an `id` that does not match `ID_PATTERN`;
 *  `missing` also covers an empty list name. */
export type ErrorKind = 'missing' | 'type' | 'long' | 'range' | 'enum' | 'extra' | 'many';

/** One error of a refused file. `list` and `entry` are indexes in the file (0-based), null
 *  for the file itself or for a list's own field; `field` is the key, `''` for a list or an
 *  entry that is not an object. `value` is the value as text, cut to 40 characters, for a
 *  `type`, `range` or `enum` error; `limit` is the bound, the allowed values or the type.
 *  `item` is the entry's own `id` when that is a valid id, so the report can name the record. */
export interface BundleError {
  path: string;
  list: number | null;
  entry: number | null;
  item?: string;
  field: string;
  value?: string;
  kind: ErrorKind;
  limit?: number | string;
}

/** An entry left out: `unknown` - no record with this id; `repeat` - the id is already at
 *  `first` in the same list. */
export interface Skipped {
  list: number;
  entry: number;
  id: string;
  why: 'unknown' | 'repeat';
  first?: number;
}

export interface ImportEntry {
  item_key: string;
  quantity: number;
  price_coins: number | null;
  player_note: string;
  gm_note: string;
}

export interface ImportList {
  name: string;
  money_mode: MoneyMode;
  player_note: string;
  gm_note: string;
  entries: ImportEntry[];
}

export type Parsed =
  | { ok: true; lists: ImportList[]; skipped: Skipped[] }
  | { ok: false; reason: 'notJson' | 'notBundle' | 'empty' }
  | { ok: false; reason: 'version'; version: unknown }
  | {
      ok: false;
      reason: 'errors';
      errors: BundleError[];
      more: number;
      /** Per list of the file, its `name` when that is a string, else null; empty when
       *  `lists` is not an array. */
      names: (string | null)[];
    };

/** The keys each object of the file may hold, and the ones it must: the schema's
 *  `properties` and `required` (`bundle.test.ts` compares them). */
export const ROOT_KEYS = ['$schema', 'format', 'version', 'exported_at', 'lists'] as const;
export const ROOT_REQUIRED: readonly string[] = ['format', 'version', 'lists'];
export const LIST_KEYS = ['name', 'money_mode', 'player_note', 'gm_note', 'entries'] as const;
export const LIST_REQUIRED: readonly string[] = ['name', 'entries'];
export const ENTRY_KEYS = [
  'id',
  'name',
  'source',
  'quantity',
  'price_coins',
  'player_note',
  'gm_note'
] as const;
export const ENTRY_REQUIRED: readonly string[] = ['id'];

const isKey = <K extends string>(keys: readonly K[], k: string): k is K =>
  (keys as readonly string[]).includes(k);

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const chars = (s: string): number => Array.from(s).length;
const cut40 = (s: string): string => Array.from(s).slice(0, 40).join('');
const shown = (v: unknown): string => cut40(typeof v === 'string' ? v : JSON.stringify(v));
const whole = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const step = (key: string): string =>
  /^[A-Za-z_$][\w$]*$/.test(key) ? '.' + key : '[' + JSON.stringify(key) + ']';

/* The errors of one walk, the first ERRORS_MAX kept and the rest counted. */
class Report {
  errors: BundleError[] = [];
  more = 0;
  add(e: BundleError): void {
    if (this.errors.length < ERRORS_MAX) this.errors.push(e);
    else this.more++;
  }
}

/* Where an error is: the path prefix, the list and entry indexes, and the entry's id. */
interface At {
  path: string;
  list: number | null;
  entry: number | null;
  item?: string;
}

function fieldError(
  r: Report,
  at: At,
  key: string,
  kind: ErrorKind,
  extra: { value?: string; limit?: number | string } = {}
): void {
  const field = cut40(key);
  const path = at.path ? at.path + step(field) : field;
  r.add({
    path,
    list: at.list,
    entry: at.entry,
    ...(at.item === undefined ? {} : { item: at.item }),
    field,
    kind,
    ...extra
  });
}

function stringUpTo(r: Report, at: At, key: string, v: unknown, max: number): string | null {
  if (typeof v !== 'string') {
    fieldError(r, at, key, 'type', { value: shown(v), limit: 'string' });
    return null;
  }
  if (chars(v) > max) {
    fieldError(r, at, key, 'long', { limit: max });
    return null;
  }
  return v;
}

function bounded(
  r: Report,
  at: At,
  key: string,
  v: unknown,
  lo: number,
  hi: number
): number | null {
  if (!whole(v)) {
    fieldError(r, at, key, 'type', { value: shown(v), limit: 'integer' });
    return null;
  }
  if (v < lo || v > hi) {
    fieldError(r, at, key, 'range', { value: shown(v), limit: String(lo) + '..' + String(hi) });
    return null;
  }
  return v;
}

function required(r: Report, at: At, o: Obj, keys: readonly string[]): void {
  for (const k of keys) if (!(k in o)) fieldError(r, at, k, 'missing');
}

function notObject(r: Report, at: At, v: unknown): void {
  r.add({
    path: at.path,
    list: at.list,
    entry: at.entry,
    ...(at.item === undefined ? {} : { item: at.item }),
    field: '',
    kind: 'type',
    value: shown(v),
    limit: 'object'
  });
}

/* One entry; null when it has an error. Its id is read first, so an error on a key before
   `id` names the record too. */
function walkEntry(r: Report, where: At, v: unknown): ImportEntry | null {
  if (!isObj(v)) {
    notObject(r, where, v);
    return null;
  }
  const id = v['id'];
  const at: At = typeof id === 'string' && ID_PATTERN.test(id) ? { ...where, item: id } : where;
  const before = r.errors.length + r.more;
  const e: ImportEntry = {
    item_key: '',
    quantity: 1,
    price_coins: null,
    player_note: '',
    gm_note: ''
  };
  for (const [k, x] of Object.entries(v)) {
    if (!isKey(ENTRY_KEYS, k)) {
      fieldError(r, at, k, 'extra');
      continue;
    }
    switch (k) {
      case 'id':
        if (typeof x !== 'string' || !ID_PATTERN.test(x)) {
          fieldError(r, at, k, 'type', { value: shown(x), limit: ID_PATTERN.source });
        } else e.item_key = x;
        break;
      case 'name':
        stringUpTo(r, at, k, x, NAME_MAX);
        break;
      case 'source':
        if (typeof x !== 'string' || !SOURCES.includes(x)) {
          fieldError(r, at, k, 'enum', { value: shown(x), limit: SOURCES.join(', ') });
        }
        break;
      case 'quantity':
        e.quantity = bounded(r, at, k, x, 1, QTY_MAX) ?? 1;
        break;
      case 'price_coins':
        e.price_coins = bounded(r, at, k, x, 1, PRICE_MAX);
        break;
      case 'player_note':
      case 'gm_note':
        e[k] = stringUpTo(r, at, k, x, NOTE_MAX) ?? '';
        break;
    }
  }
  required(r, at, v, ENTRY_REQUIRED);
  return r.errors.length + r.more === before ? e : null;
}

/* One list and its entries, the skipped ones recorded; null when it has an error. */
function walkList(
  r: Report,
  i: number,
  v: unknown,
  knows: (id: string) => boolean,
  skipped: Skipped[]
): ImportList | null {
  const at: At = { path: 'lists[' + String(i) + ']', list: i, entry: null };
  if (!isObj(v)) {
    notObject(r, at, v);
    return null;
  }
  const before = r.errors.length + r.more;
  const l: ImportList = {
    name: '',
    money_mode: MONEY_DEFAULT,
    player_note: '',
    gm_note: '',
    entries: []
  };
  for (const [k, x] of Object.entries(v)) {
    if (!isKey(LIST_KEYS, k)) {
      fieldError(r, at, k, 'extra');
      continue;
    }
    switch (k) {
      case 'name': {
        const name = stringUpTo(r, at, k, x, NAME_MAX);
        if (name === '') fieldError(r, at, k, 'missing');
        l.name = name ?? '';
        break;
      }
      case 'money_mode':
        if (typeof x === 'string' && (MONEY_MODES as readonly string[]).includes(x)) {
          l.money_mode = x as MoneyMode;
        } else {
          fieldError(r, at, k, 'enum', { value: shown(x), limit: MONEY_MODES.join(', ') });
        }
        break;
      case 'player_note':
      case 'gm_note':
        l[k] = stringUpTo(r, at, k, x, NOTE_MAX) ?? '';
        break;
      case 'entries': {
        if (!Array.isArray(x)) {
          fieldError(r, at, k, 'type', { value: shown(x), limit: 'array' });
          break;
        }
        if (x.length > ENTRIES_MAX) fieldError(r, at, k, 'many', { limit: ENTRIES_MAX });
        const first = new Map<string, number>();
        x.forEach((item: unknown, j) => {
          const e = walkEntry(
            r,
            { path: at.path + '.entries[' + String(j) + ']', list: i, entry: j },
            item
          );
          if (!e) return;
          const seen = first.get(e.item_key);
          if (!knows(e.item_key)) {
            skipped.push({ list: i, entry: j, id: e.item_key, why: 'unknown' });
          } else if (seen !== undefined) {
            skipped.push({ list: i, entry: j, id: e.item_key, why: 'repeat', first: seen });
          } else {
            first.set(e.item_key, j);
            l.entries.push(e);
          }
        });
        break;
      }
    }
  }
  required(r, at, v, LIST_REQUIRED);
  return r.errors.length + r.more === before ? l : null;
}

/** Reads a lists file: JSON, then `format`, then `version`, then every key and bound in
 *  document order, a list's or an entry's missing keys after its own. An id `knows` does
 *  not know, and a later copy of an id in one list, is left out and recorded in `skipped`,
 *  never an error. */
export function parseBundle(text: string, knows: (id: string) => boolean): Parsed {
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'notJson' };
  }
  if (!isObj(doc) || doc['format'] !== BUNDLE_FORMAT) return { ok: false, reason: 'notBundle' };
  if (doc['version'] !== BUNDLE_VERSION) {
    return { ok: false, reason: 'version', version: doc['version'] };
  }
  const r = new Report();
  const root: At = { path: '', list: null, entry: null };
  const lists: ImportList[] = [];
  const skipped: Skipped[] = [];
  let names: (string | null)[] = [];
  let count = 0;
  for (const [k, x] of Object.entries(doc)) {
    if (!isKey(ROOT_KEYS, k)) {
      fieldError(r, root, k, 'extra');
      continue;
    }
    switch (k) {
      case 'format':
      case 'version':
        break;
      case '$schema':
      case 'exported_at':
        if (typeof x !== 'string') {
          fieldError(r, root, k, 'type', { value: shown(x), limit: 'string' });
        }
        break;
      case 'lists':
        if (!Array.isArray(x)) {
          fieldError(r, root, k, 'type', { value: shown(x), limit: 'array' });
          break;
        }
        count = x.length;
        names = x.map((l: unknown) =>
          isObj(l) && typeof l['name'] === 'string' ? l['name'] : null
        );
        if (x.length > LISTS_MAX) fieldError(r, root, k, 'many', { limit: LISTS_MAX });
        x.forEach((item: unknown, i) => {
          const l = walkList(r, i, item, knows, skipped);
          if (l) lists.push(l);
        });
        break;
    }
  }
  required(r, root, doc, ROOT_REQUIRED);
  if (r.errors.length) {
    return { ok: false, reason: 'errors', errors: r.errors, more: r.more, names };
  }
  if (!count) return { ok: false, reason: 'empty' };
  return { ok: true, lists, skipped };
}

/** Returns the import's rows: every id from `newId`, positions counted after the skips. */
export function toImportRows(lists: readonly ImportList[], newId: () => string): ImportRow[] {
  return lists.map((l) => ({
    list: {
      id: newId(),
      name: l.name,
      money_mode: l.money_mode,
      player_note: l.player_note,
      gm_note: l.gm_note
    },
    entries: l.entries.map((e, position): EntryRow => ({
      id: newId(),
      item_key: e.item_key,
      source: 'official',
      snapshot: null,
      position,
      quantity: e.quantity,
      price_coins: e.price_coins,
      player_note: e.player_note,
      gm_note: e.gm_note
    }))
  }));
}
