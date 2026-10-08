/* The lists file `import-v1`, `import-v2` and `import-v3`: the export writes it, the
 * import reads it.
 *
 * `schema/import-v1.json`, `import-v2.json` and `import-v3.json` are the published
 * contracts and this module their hand-written validator; `bundle.test.ts` keeps them equal.
 * Version 2 is version 1 plus homebrew entries, each by its key and, optionally, its
 * snapshot; version 3 is version 2 plus the GM-only mark `gm_only`. An export is the lowest
 * version that holds what it writes, so one without a homebrew or GM-only entry stays version
 * 1, byte for byte. An imported homebrew entry links the account's item of its key; for a key
 * the account does not hold, a fixed copy is made first from the snapshot, and an entry
 * without one is skipped. Pure module: the report's words are the component's, this returns
 * indexes and keys. docs/specs/CONTRACTS.md section 4. */

import {
  NAME_MAX,
  NOTE_MAX,
  PRICE_MAX,
  type CloudList,
  type EntryRow,
  type ImportRow
} from './cloudLists.js';
import {
  canonJson,
  contentOfRecord,
  isHomebrewKey,
  snapshotValid,
  type CardContent,
  type CardKind,
  type HomebrewRecord
} from './homebrew.js';
import type { HomebrewImportRows, ImportCardRow, ImportItemRow } from './homebrewFile.js';
import { QTY_MAX, type ListEntryMeta } from './listLink.js';
import { MONEY_DEFAULT, MONEY_MODES, type MoneyMode } from './money.js';

export const BUNDLE_FORMAT = 'daggerheart-loot/lists';
export const BUNDLE_VERSION = 1;
/** The version that adds homebrew entries; the import reads both. */
export const BUNDLE_VERSION_HOMEBREW = 2;
/** The version that adds the GM-only mark; the import reads all three. */
export const BUNDLE_VERSION_GM_ONLY = 3;
/** The schema's `$id`; an export names it as its `$schema`. */
export const BUNDLE_SCHEMA = 'https://artex-x.github.io/daggerheart-loot/schema/import-v1.json';
export const BUNDLE_SCHEMA_HOMEBREW =
  'https://artex-x.github.io/daggerheart-loot/schema/import-v2.json';
export const BUNDLE_SCHEMA_GM_ONLY =
  'https://artex-x.github.io/daggerheart-loot/schema/import-v3.json';
/** The most lists one file holds: `import_lists`' bound per call; the account's limit is the
 *  database's. */
export const LISTS_MAX = 1000;
/** The most entries one list of a file holds: `import_lists`' bound per list; the account's
 *  limit is the database's. */
export const ENTRIES_MAX = 5000;
/** The largest file the import reads, and the largest data file it reads from a zip. */
export const FILE_MAX_BYTES = 5 * 1024 * 1024;
/** The largest data zip the import reads: its two data files at their bound, and their
 *  headers. */
export const ZIP_MAX_BYTES = 2 * FILE_MAX_BYTES + 4096;
/** A record id: `catalog.csv`'s `id` column. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** The entry sources version 1 takes. */
export const SOURCES: readonly string[] = ['official'];
/** The entry sources version 2 takes. */
export const SOURCES_HOMEBREW: readonly string[] = ['official', 'homebrew'];
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
  /** Version 3: written only as true, for an entry the players' link leaves out. */
  gm_only?: true;
  /** Version 2, `source: homebrew` only, optional: the item as a catalog record. The export
   *  always writes it. */
  snapshot?: HomebrewRecord;
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
  version:
    typeof BUNDLE_VERSION | typeof BUNDLE_VERSION_HOMEBREW | typeof BUNDLE_VERSION_GM_ONLY;
  exported_at: string;
  lists: BundleList[];
}

/** Returns the lists file of `lists`, in the order given, and how many entries it left
 *  out. An entry's `name` is `nameOf`'s, left out when it has none; a blank list name is
 *  written as `untitled`, so the file keeps the schema's `minLength`. A homebrew entry is
 *  written with `snapshotOf`'s record of the live item, own or another account's, without
 *  its `hid`, or left out and counted when it answers null. The file is version 3 when an
 *  entry it writes is GM-only, else version 2 when it holds a homebrew entry, else version
 *  1; a GM-only entry left out does not count. */
export function toBundle(
  lists: readonly CloudList[],
  nameOf: (id: string) => string | undefined,
  untitled: string,
  now: Date,
  snapshotOf: (id: string, list: CloudList) => HomebrewRecord | null
): { bundle: Bundle; skipped: number } {
  let skipped = 0;
  const out = lists.map((l): BundleList => {
    const entries: BundleEntry[] = [];
    for (const id of l.ids) {
      const snapshot = isHomebrewKey(id) ? snapshotOf(id, l) : null;
      if (isHomebrewKey(id) && !snapshot) {
        skipped++;
        continue;
      }
      entries.push(entryOf(id, l.meta?.[id] ?? {}, nameOf(id), snapshot));
    }
    return {
      name: l.name.trim() ? l.name : untitled,
      ...(l.money === 'coin' ? { money_mode: 'coin' as const } : {}),
      ...(l.note ? { player_note: l.note } : {}),
      ...(l.hnote ? { gm_note: l.hnote } : {}),
      entries
    };
  });
  const any = (has: (e: BundleEntry) => boolean): boolean =>
    out.some((l) => l.entries.some(has));
  const gmOnly = any((e) => e.gm_only === true);
  const homebrew = any((e) => e.source === 'homebrew');
  return {
    bundle: {
      $schema: gmOnly
        ? BUNDLE_SCHEMA_GM_ONLY
        : homebrew
          ? BUNDLE_SCHEMA_HOMEBREW
          : BUNDLE_SCHEMA,
      format: BUNDLE_FORMAT,
      version: gmOnly
        ? BUNDLE_VERSION_GM_ONLY
        : homebrew
          ? BUNDLE_VERSION_HOMEBREW
          : BUNDLE_VERSION,
      exported_at: now.toISOString(),
      lists: out
    },
    skipped
  };
}

function entryOf(
  id: string,
  m: ListEntryMeta,
  name: string | undefined,
  snapshot: HomebrewRecord | null
): BundleEntry {
  const e: BundleEntry = { id };
  if (name) e.name = name;
  if (snapshot) e.source = 'homebrew';
  if (m.qty && m.qty > 1) e.quantity = m.qty;
  if (m.gold) e.price_coins = m.gold;
  if (m.note) e.player_note = m.note;
  if (m.hnote) e.gm_note = m.hnote;
  if (m.gmOnly) e.gm_only = true;
  if (snapshot) {
    const record = { ...snapshot };
    delete record.hid;
    e.snapshot = record;
  }
  return e;
}

/** Returns the file's text: two-space JSON and a final newline. */
export function bundleText(b: Bundle): string {
  return JSON.stringify(b, null, 2) + '\n';
}

const two = (n: number): string => String(n).padStart(2, '0');
/* The characters Windows refuses in a file name; control characters are replaced too. */
const UNSAFE = '\\/:*?"<>|';

/** Returns an export's day, YYYY-MM-DD in local time. */
export const dayOf = (now: Date): string =>
  [now.getFullYear(), two(now.getMonth() + 1), two(now.getDate())].join('-');

/** Returns `<name>.json` with each character Windows refuses as `_`, cut to 80 characters;
 *  `<fallback>.json` for a name left empty. */
export function jsonFileName(name: string, fallback: string): string {
  const safe = Array.from(name, (c) =>
    c < ' ' || c === '\u007f' || UNSAFE.includes(c) ? '_' : c
  );
  const cut = safe.join('').trim();
  const short = Array.from(cut).slice(0, 80).join('').trim();
  return (short || fallback) + '.json';
}

/** Returns an export's file name: `<name>.json` for one list, else the dated
 *  `daggerheart-loot-lists-<YYYY-MM-DD>.json` in local time. */
export function bundleFileName(lists: readonly { name: string }[], now: Date): string {
  const [only] = lists;
  if (lists.length !== 1 || !only) return 'daggerheart-loot-lists-' + dayOf(now) + '.json';
  return jsonFileName(only.name, 'list');
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
 *  `missing` also covers an empty list name. Version 2 only: `hbId` - a homebrew entry's
 *  `id` that is not a key; `snapshot` - a snapshot that is not a valid copy of its key, or
 *  lacks a text `schema/import-v2.json` requires. */
export type ErrorKind =
  'missing' | 'type' | 'long' | 'range' | 'enum' | 'extra' | 'many' | 'hbId' | 'snapshot';

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
 *  `first` in the same list; `unheld` - a homebrew entry without a snapshot whose key the
 *  account does not hold. */
export interface Skipped {
  list: number;
  entry: number;
  id: string;
  why: 'unknown' | 'repeat' | 'unheld';
  first?: number;
}

export interface ImportEntry {
  item_key: string;
  source: 'official' | 'homebrew';
  /** A homebrew entry's snapshot from the file; null for an official entry or a homebrew
   *  entry without one. */
  snapshot: HomebrewRecord | null;
  quantity: number;
  price_coins: number | null;
  player_note: string;
  gm_note: string;
  /** Version 3: set only for an entry the file marks GM-only. */
  gm_only?: true;
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
/** Version 2's entry keys: version 1's and `snapshot`. */
export const ENTRY_KEYS_HOMEBREW = [...ENTRY_KEYS, 'snapshot'] as const;
/** Version 3's entry keys: version 2's and `gm_only`, in the schema's order. */
export const ENTRY_KEYS_GM_ONLY = [...ENTRY_KEYS, 'gm_only', 'snapshot'] as const;

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

/* The texts `schema/import-v2.json` requires of a snapshot and of its embedded cards, which
   `homebrew_snapshot_of` always writes; `snapshotValid` alone takes a snapshot without them. */
const SNAPSHOT_TEXTS = ['en', 'ru', 'ende', 'rud'] as const;
const SET_TEXTS = SNAPSHOT_TEXTS;
const REF_TEXTS = ['en', 'ru', 'ensub', 'rusub', 'ende', 'rud', 'url'] as const;

const holds = (v: unknown, keys: readonly string[]): boolean =>
  isObj(v) && keys.every((k) => typeof v[k] === 'string');

const cardsHold = (v: unknown, keys: readonly string[]): boolean =>
  v === undefined || (isObj(v) && Object.values(v).every((c) => holds(c, keys)));

function snapshotComplete(snap: Obj): boolean {
  const cards = snap['cards'];
  return (
    holds(snap, SNAPSHOT_TEXTS) &&
    (cards === undefined ||
      (isObj(cards) &&
        cardsHold(cards['sets'], SET_TEXTS) &&
        cardsHold(cards['refs'], REF_TEXTS)))
  );
}

/* One entry; null when it has an error. Its id is read first, so an error on a key before
   `id` names the record too. From version 2 a homebrew entry's id is a key, and a snapshot
   it holds is a valid copy of it, checked after its own keys. */
function walkEntry(r: Report, where: At, v: unknown, version: number): ImportEntry | null {
  if (!isObj(v)) {
    notObject(r, where, v);
    return null;
  }
  const id = v['id'];
  const at: At = typeof id === 'string' && ID_PATTERN.test(id) ? { ...where, item: id } : where;
  const before = r.errors.length + r.more;
  const e: ImportEntry = {
    item_key: '',
    source: 'official',
    snapshot: null,
    quantity: 1,
    price_coins: null,
    player_note: '',
    gm_note: ''
  };
  const v2 = version >= BUNDLE_VERSION_HOMEBREW;
  const keys: readonly string[] =
    version >= BUNDLE_VERSION_GM_ONLY
      ? ENTRY_KEYS_GM_ONLY
      : v2
        ? ENTRY_KEYS_HOMEBREW
        : ENTRY_KEYS;
  const sources = v2 ? SOURCES_HOMEBREW : SOURCES;
  const homebrew = v2 && v['source'] === 'homebrew';
  for (const [k, x] of Object.entries(v)) {
    if (!keys.includes(k) || (k === 'snapshot' && !homebrew)) {
      fieldError(r, at, k, 'extra');
      continue;
    }
    switch (k) {
      case 'snapshot':
        break;
      case 'id':
        if (typeof x !== 'string' || !ID_PATTERN.test(x)) {
          fieldError(r, at, k, 'type', { value: shown(x), limit: ID_PATTERN.source });
        } else e.item_key = x;
        break;
      case 'name':
        stringUpTo(r, at, k, x, NAME_MAX);
        break;
      case 'source':
        if (typeof x !== 'string' || !sources.includes(x)) {
          fieldError(r, at, k, 'enum', { value: shown(x), limit: sources.join(', ') });
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
      case 'gm_only':
        if (typeof x !== 'boolean') {
          fieldError(r, at, k, 'type', { value: shown(x), limit: 'boolean' });
        } else if (x) e.gm_only = true;
        break;
    }
  }
  required(r, at, v, ENTRY_REQUIRED);
  if (homebrew) {
    const id = v['id'];
    const keyed = typeof id === 'string' && isHomebrewKey(id);
    if (typeof id === 'string' && ID_PATTERN.test(id) && !keyed) {
      fieldError(r, at, 'id', 'hbId', { value: shown(id) });
    }
    /* With no valid key an error is already recorded, and a snapshot names nothing. */
    if (!keyed) return null;
    e.source = 'homebrew';
    if ('snapshot' in v) {
      const snap = v['snapshot'];
      if (
        !snapshotValid(snap) ||
        !isObj(snap) ||
        snap['id'] !== id ||
        !snapshotComplete(snap)
      ) {
        fieldError(r, at, 'snapshot', 'snapshot');
      } else e.snapshot = snap as unknown as HomebrewRecord;
    }
  }
  return r.errors.length + r.more === before ? e : null;
}

/* One list and its entries, the skipped ones recorded; null when it has an error. */
function walkList(
  r: Report,
  i: number,
  v: unknown,
  knows: (id: string) => boolean,
  owns: (key: string) => boolean,
  skipped: Skipped[],
  version: number
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
            item,
            version
          );
          if (!e) return;
          const seen = first.get(e.item_key);
          if (e.source === 'official' && !knows(e.item_key)) {
            skipped.push({ list: i, entry: j, id: e.item_key, why: 'unknown' });
          } else if (seen !== undefined) {
            skipped.push({ list: i, entry: j, id: e.item_key, why: 'repeat', first: seen });
          } else if (e.source === 'homebrew' && e.snapshot === null && !owns(e.item_key)) {
            skipped.push({ list: i, entry: j, id: e.item_key, why: 'unheld' });
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

/** Reads a lists file of version 1, 2 or 3: JSON, then `format`, then `version`, then every
 *  key and bound in document order, a list's or an entry's missing keys after its own. A
 *  catalog id `knows` does not know, and a later copy of an id in one list, is left out
 *  and recorded in `skipped`, never an error; a homebrew entry is never unknown. A homebrew
 *  entry without a snapshot whose key `owns` does not hold is left out and recorded as
 *  `unheld`. */
export function parseBundle(
  text: string,
  knows: (id: string) => boolean,
  owns: (key: string) => boolean = () => false
): Parsed {
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'notJson' };
  }
  if (!isObj(doc) || doc['format'] !== BUNDLE_FORMAT) return { ok: false, reason: 'notBundle' };
  const version = doc['version'];
  if (
    version !== BUNDLE_VERSION &&
    version !== BUNDLE_VERSION_HOMEBREW &&
    version !== BUNDLE_VERSION_GM_ONLY
  ) {
    return { ok: false, reason: 'version', version };
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
          const l = walkList(r, i, item, knows, owns, skipped, version);
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

/** A lists file import as two calls: the fixed copies first (`import_homebrew`, null when
 *  there are none), then the lists (`import_lists`). Built once per chosen file, so a
 *  retry sends the same ids. */
export interface ImportPlan {
  rows: ImportRow[];
  copies: HomebrewImportRows | null;
}

/** What a plan reads of the account, and where its ids and keys come from. */
export interface PlanAccount {
  /** A fresh list, entry, item or card id. */
  newId: () => string;
  /** A fresh homebrew key, for a copy whose key another copy of the file already took. */
  newKey: () => string;
  hasItem: (key: string) => boolean;
  hasCard: (key: string) => boolean;
}

/** Returns the import's plan: every id from `newId`, positions counted after the skips. A
 *  homebrew entry is sent by its key, which links the account's own item of that key;
 *  `withCopies` makes, from their snapshots, the items the account does not hold; an entry
 *  without one is in the plan only when its key was held at the parse. A GM-only entry's row
 *  carries `gm_only: true`, on its fixed copy's link too; every other row has no such key. */
export function importPlan(lists: readonly ImportList[], account: PlanAccount): ImportPlan {
  const rows = lists.map((l): ImportRow => ({
    list: {
      id: account.newId(),
      name: l.name,
      money_mode: l.money_mode,
      player_note: l.player_note,
      gm_note: l.gm_note
    },
    entries: l.entries.map((e, position): EntryRow => ({
      id: account.newId(),
      item_key: e.item_key,
      source: e.source,
      hb_item: null,
      position,
      quantity: e.quantity,
      price_coins: e.price_coins,
      player_note: e.player_note,
      gm_note: e.gm_note,
      ...(e.gm_only ? { gm_only: true } : {})
    }))
  }));
  return withCopies({ rows, copies: null }, lists, account);
}

/** Returns `plan` (made by `importPlan` from `lists`) with a fixed copy, an own item in the
 *  default source, of each homebrew entry whose key the account does not hold and the plan
 *  does not copy yet; every id kept, `plan` itself when no entry needs one. One copy is made
 *  per distinct (key, snapshot): the first keeps the key, a later differing one takes a new
 *  key, which its entry then names. The set and rule cards a snapshot embeds are copied the
 *  same way, unless the account holds the card's key, which the copy then names. An entry
 *  without a snapshot is never copied. */
export function withCopies(
  plan: ImportPlan,
  lists: readonly ImportList[],
  account: PlanAccount
): ImportPlan {
  const items: ImportItemRow[] = [...(plan.copies?.items ?? [])];
  const cards: ImportCardRow[] = [...(plan.copies?.cards ?? [])];
  const copied = new Set(items.map((i) => i.key));
  /* Per key of the file, its snapshots by canonical text, each with the key it was given. */
  const variants = new Map<string, Map<string, string>>();
  const cardVariants = new Map<string, Map<string, string>>();
  for (const c of cards) cardVariants.set(c.key, new Map([[canonJson(c.content), c.key]]));
  /* The key a variant of `key` with the canonical text `canon` gets; `make` writes its row. */
  const keyOf = (
    byKey: Map<string, Map<string, string>>,
    key: string,
    canon: string,
    make: (key: string) => void
  ): string => {
    let byText = byKey.get(key);
    if (!byText) byKey.set(key, (byText = new Map<string, string>()));
    let given = byText.get(canon);
    if (given === undefined) {
      given = byText.size ? account.newKey() : key;
      byText.set(canon, given);
      make(given);
    }
    return given;
  };
  const cardKey = (kind: CardKind, key: string, card: CardContent): string => {
    if (account.hasCard(key)) return key;
    const content = { ...card };
    return keyOf(cardVariants, key, canonJson(content), (given) => {
      cards.push({ id: account.newId(), key: given, kind, book: null, content });
    });
  };
  let changed = false as boolean;
  const rows = plan.rows.map((r, i) => ({
    ...r,
    entries: r.entries.map((e, j): EntryRow => {
      if (e.source !== 'homebrew' || copied.has(e.item_key) || account.hasItem(e.item_key)) {
        return e;
      }
      const snap = lists[i]?.entries[j]?.snapshot;
      if (!snap) return e;
      const content = contentOfRecord(snap);
      const set = content.set === undefined ? undefined : snap.cards?.sets?.[content.set];
      if (content.set !== undefined && set) content.set = cardKey('set', content.set, set);
      if (content.refs) {
        content.refs = content.refs.map((ref) => {
          const card = snap.cards?.refs?.[ref];
          return card ? cardKey('ref', ref, card) : ref;
        });
      }
      const key = keyOf(variants, e.item_key, canonJson(content), (given) => {
        items.push({ id: account.newId(), key: given, book: null, content });
      });
      changed = true;
      return key === e.item_key ? e : { ...e, item_key: key };
    })
  }));
  if (!changed) return plan;
  return { rows, copies: { books: [], cards, items, update: false } };
}
