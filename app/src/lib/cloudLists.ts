/* Account lists: the rows `ListRepository` reads and writes, and their
 * mapping onto the `StoredList` shape the list page already draws.
 *
 * Column names follow the schema (`supabase/migrations/20260925130100_lists.sql`).
 * Pure module: no port, no storage. docs/specs/FEATURES.md, "Account and browser lists". */

import type { Dict } from './dict.js';
import {
  isHomebrewKey,
  isHomebrewRecord,
  snapshotValid,
  type HomebrewEquip,
  type HomebrewKind,
  type HomebrewRecord
} from './homebrew.js';
import type { DecodedList, ListEntryMeta, MoneyMode } from './listLink.js';
import { QTY_MAX } from './listLink.js';
import type { StoredList } from './lists.js';
import type { Record_ } from './types.js';

/** The most coins a price holds (`list_entries.price_coins`). */
export const PRICE_MAX = 99999;
/** The longest list name the schema takes, in characters. */
export const NAME_MAX = 200;
/** The longest note, of a list or an entry, the schema takes, in characters. */
export const NOTE_MAX = 4000;

/** Returns `text` cut to `max` characters as the database counts them (code points), so a
 *  long paste is saved cut rather than refused whole. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const chars = Array.from(text);
  return chars.length <= max ? text : chars.slice(0, max).join('');
}

export interface EntryRow {
  id: string;
  item_key: string;
  source: 'official' | 'homebrew';
  /** A homebrew entry's linked item (`homebrew_items.id`), of any account; null for an
   *  official one, or for a homebrew one sent by key, which links the list owner's item. */
  hb_item: string | null;
  position: number;
  quantity: number;
  price_coins: number | null;
  player_note: string;
  gm_note: string;
}

export interface ListRow {
  id: string;
  name: string;
  money_mode: MoneyMode;
  player_note: string;
  gm_note: string;
  created_at: string;
  updated_at: string;
  /** Bumped by every change of the list or of one of its entries. */
  revision: number;
  /** The SHA-256 of the canonical text a moved browser list was made from; null for
   *  every other list. */
  legacy_fingerprint: string | null;
  list_entries: EntryRow[];
}

export type NewListRow = Pick<
  ListRow,
  'id' | 'name' | 'money_mode' | 'player_note' | 'gm_note'
>;
export type ListPatch = Partial<
  Pick<ListRow, 'name' | 'money_mode' | 'player_note' | 'gm_note'>
>;
export type EntryPatch = Partial<
  Pick<EntryRow, 'quantity' | 'price_coins' | 'player_note' | 'gm_note'>
>;

/** One write of `apply_list_writes`, in the shape the function reads
 *  (`supabase/migrations/20260925130600_list_writes.sql`). */
export type ListOp =
  | { op: 'create'; list: NewListRow; entries: EntryRow[] }
  | { op: 'update'; id: string; patch: ListPatch }
  | { op: 'remove'; id: string }
  | { op: 'add'; list_id: string; entries: EntryRow[] }
  | { op: 'update_entry'; id: string; patch: EntryPatch }
  | { op: 'remove_entries'; ids: string[] }
  | { op: 'reorder'; list_id: string; ids: string[] }
  /** Points the entry at another item in place: its position, quantity, price and notes stay. */
  | { op: 'relink'; id: string; hb_item: string };

/** One list of an import: the `create` op's shape (`import_lists`). */
export interface ImportRow {
  list: NewListRow;
  entries: EntryRow[];
}

/** The most bytes of writes one request carries: under the 64 KiB a `keepalive`
 *  request may hold, with room for its headers. */
export const BATCH_BYTES = 60_000;
/** The most writes one request carries; `apply_list_writes` refuses more. */
export const BATCH_OPS = 200;

const utf8 = new TextEncoder();

/** Returns how many writes from the first go in one request: at least one, then while the
 *  JSON of the writes stays within `BATCH_BYTES` and their count within `BATCH_OPS`. */
export function batchSize(ops: readonly ListOp[]): number {
  let bytes = 0;
  let n = 0;
  for (const op of ops) {
    if (n >= BATCH_OPS) break;
    const size = utf8.encode(JSON.stringify(op)).length + 1;
    if (n > 0 && bytes + size > BATCH_BYTES) break;
    bytes += size;
    n++;
  }
  return n;
}

/** An account list as the pages draw it: `ids` are the entries' record ids in list order,
 *  `entryIds` maps each to its row id, `updated` is the last edit in ms, `links` maps each
 *  homebrew entry's key to its linked item's id, and `linked` holds by key the records of
 *  the linked items the account does not hold, as `items()` read them (each absent when
 *  empty). */
export type CloudList = StoredList & {
  updated: number;
  entryIds: Record<string, string>;
  links?: Readonly<Record<string, string>>;
  linked?: Readonly<Record<string, HomebrewRecord>>;
};

/** What an entry is written as: a catalog record, or a link to a homebrew item by its id
 *  (`hb_item` null links the list owner's item of the key). */
export interface EntrySource {
  source: 'official' | 'homebrew';
  hb_item: string | null;
}

export const OFFICIAL: EntrySource = Object.freeze({ source: 'official', hb_item: null });

/* A record the key names, as the database's projection writes it. */
function recordValid(key: string, v: unknown): v is HomebrewRecord {
  return snapshotValid(v) && (v as { id: string }).id === key;
}

/**
 * Returns what an entry of `key` is written as (docs/specs/FEATURES.md, "Lists"): a catalog
 * key is official; a homebrew key links the account's own item when the account holds it,
 * else the item `copy` names by its `hid` (another account's record), and is null (not
 * written) otherwise or while the account's items are not read yet, so an own item is
 * never linked as another account's by mistake.
 */
export function entrySource(
  key: string,
  own: { ready: boolean; has: (key: string) => boolean; hidOf: (key: string) => string | null },
  copy: Record_ | undefined
): EntrySource | null {
  if (!isHomebrewKey(key)) return OFFICIAL;
  if (!own.ready) return null;
  if (own.has(key)) return { source: 'homebrew', hb_item: own.hidOf(key) };
  if (copy && isHomebrewRecord(copy) && copy.id === key && typeof copy.hid === 'string') {
    return { source: 'homebrew', hb_item: copy.hid };
  }
  return null;
}

/* The rule before an account's items are known: a homebrew key is not written. */
const catalogOnly = (key: string): EntrySource | null => (isHomebrewKey(key) ? null : OFFICIAL);

const NO_LINKED: Readonly<Record<string, HomebrewRecord>> = Object.freeze({});

/** Returns the records of a list's linked items by key: an account list's own object, else
 *  one empty object, so the answer keeps its identity while the list's records do not
 *  change. */
export function linkedOf(l: StoredList): Readonly<Record<string, HomebrewRecord>> {
  return (l as Partial<CloudList>).linked ?? NO_LINKED;
}

/** One answer row of `get_homebrew_items`: the item's id and its record. */
export interface LinkedRow {
  hid: string;
  item: unknown;
}

/** Returns the valid records of `get_homebrew_items`'s rows by item id, each with its
 *  `hid`. */
export function linkedRecords(rows: readonly LinkedRow[]): Map<string, HomebrewRecord> {
  const out = new Map<string, HomebrewRecord>();
  for (const r of rows) {
    if (snapshotValid(r.item)) out.set(r.hid, { ...(r.item as HomebrewRecord), hid: r.hid });
  }
  return out;
}

/** Returns the valid records a share's projection carries, each with the `hid` of its
 *  entry: every homebrew entry's snapshot, filled from the linked item. */
export function snapshotRecords(row: SharedRow | null | undefined): HomebrewRecord[] {
  if (!row) return [];
  return row.entries.flatMap((e) =>
    e.source === 'homebrew' && recordValid(e.item_key, e.snapshot)
      ? [typeof e.hid === 'string' ? { ...e.snapshot, hid: e.hid } : e.snapshot]
      : []
  );
}

/** `get_homebrew_item`'s answer for an item that exists: its id, whether the reader is
 *  its author, the revision a re-read compares, the record and the author's related items
 *  (no texts, no cards). `updated_at` is read by R9's page, not here. */
export interface ItemAnswer {
  hid: string;
  mine: boolean;
  revision: string;
  item: unknown;
  related: unknown;
  updated_at?: string;
}

/** One item as `#/h/` draws it: the record with its `hid`, and each related item as a
 *  record with its `hid`, empty descriptions and the relation fields it carries. */
export interface ItemRead {
  hid: string;
  mine: boolean;
  revision: string;
  record: HomebrewRecord;
  related: HomebrewRecord[];
}

const KINDS: readonly unknown[] = ['item', 'consumable', 'equip'];
const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const isIds = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

/* A related row as a record, or null when it lacks a key, an id, a kind or a name. */
function relatedOf(v: unknown): HomebrewRecord | null {
  if (!isObj(v)) return null;
  const { key, hid, kind, en, ru } = v;
  if (typeof key !== 'string' || !isHomebrewKey(key)) return null;
  if (typeof hid !== 'string' || !isCloudId(hid)) return null;
  if (!KINDS.includes(kind) || typeof en !== 'string' || typeof ru !== 'string') return null;
  const r: HomebrewRecord = {
    id: key,
    src: 'homebrew',
    hid,
    kind: kind as HomebrewKind,
    en,
    ru,
    ende: '',
    rud: ''
  };
  const tier = v['tier'];
  if (typeof tier === 'number' || typeof tier === 'string') {
    r.tier = tier as NonNullable<HomebrewRecord['tier']>;
  }
  const eq = v['eq'];
  if (isObj(eq)) {
    const out: Partial<HomebrewEquip> = {};
    if (typeof eq['t'] === 'string') out.t = eq['t'] as HomebrewEquip['t'];
    if (typeof eq['tier'] === 'number' || typeof eq['tier'] === 'string') {
      out.tier = eq['tier'] as HomebrewEquip['tier'];
    }
    if (typeof eq['line'] === 'string') out.line = eq['line'];
    r.eq = out as NonNullable<HomebrewRecord['eq']>;
  }
  if (typeof v['set'] === 'string') r.set = v['set'];
  if (isIds(v['craft'])) r.craft = v['craft'];
  if (isIds(v['craft_from'])) r.craft_from = v['craft_from'];
  return r;
}

/** Returns the item `get_homebrew_item` answered, or null when the answer is not one: `hid`
 *  a uuid, `mine` a boolean, `revision` a string and `item` a valid record. A related row
 *  of another shape is dropped. */
export function itemOf(a: unknown): ItemRead | null {
  if (!isObj(a)) return null;
  const { hid, mine, revision, item, related } = a;
  if (typeof hid !== 'string' || !isCloudId(hid)) return null;
  if (typeof mine !== 'boolean' || typeof revision !== 'string') return null;
  if (!snapshotValid(item)) return null;
  return {
    hid,
    mine,
    revision,
    record: { ...(item as HomebrewRecord), hid },
    related: (Array.isArray(related) ? related : []).flatMap((x) => {
      const r = relatedOf(x);
      return r ? [r] : [];
    })
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Returns whether a list id is an account list's (a UUID) rather than a local one. */
export function isCloudId(id: string): boolean {
  return UUID.test(id);
}

/** Returns the rows in list order: by position, then by id. */
export function entryOrder(a: EntryRow, b: EntryRow): number {
  return a.position - b.position || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/** Returns an entry's meta; a key is set only when it holds something, as the local
 *  store keeps it. */
export function entryMetaOf(e: {
  quantity: number;
  price_coins: number | null;
  player_note: string;
  gm_note?: string | undefined;
}): ListEntryMeta {
  const m: ListEntryMeta = {};
  if (e.quantity > 1) m.qty = e.quantity;
  if (e.price_coins) m.gold = e.price_coins;
  if (e.player_note) m.note = e.player_note;
  if (e.gm_note) m.hnote = e.gm_note;
  return m;
}

/** Returns the list page's shape of an account list; a key is set only when it holds
 *  something, as the local store keeps it. */
export function toCloudList(row: ListRow): CloudList {
  const entries = [...row.list_entries].sort(entryOrder);
  const meta: Record<string, ListEntryMeta> = {};
  const entryIds: Record<string, string> = {};
  const links: Record<string, string> = {};
  for (const e of entries) {
    entryIds[e.item_key] = e.id;
    const m = entryMetaOf(e);
    if (Object.keys(m).length) meta[e.item_key] = m;
    if (e.source === 'homebrew' && e.hb_item) links[e.item_key] = e.hb_item;
  }
  const l: CloudList = {
    id: row.id,
    name: row.name,
    ids: entries.map((e) => e.item_key),
    created: Date.parse(row.created_at),
    updated: Date.parse(row.updated_at),
    entryIds
  };
  if (row.money_mode === 'coin') l.money = 'coin';
  if (row.player_note) l.note = row.player_note;
  if (row.gm_note) l.hnote = row.gm_note;
  if (Object.keys(meta).length) l.meta = meta;
  if (Object.keys(links).length) l.links = links;
  return l;
}

export type ShareAudience = 'player' | 'gm';

/** A share's own row; the owner reads its stopped rows too. */
export interface ShareRow {
  id: string;
  audience: ShareAudience;
  token: string;
  created_at: string;
  revoked_at: string | null;
}

/** `get_shared_list`'s answer, the fields the app reads. A player link has no `gm_note`
 *  key, on the list or on an entry. */
export interface SharedRow {
  audience: ShareAudience;
  updated_at: string;
  /** The list's revision (`ListRow.revision`). */
  revision: number;
  /** The share's live topic is `share:<topic_key>`; a random id of its own, not the token. */
  topic_key: string;
  list: { name: string; money_mode: MoneyMode; player_note: string; gm_note?: string };
  /** A homebrew entry's `snapshot` is its linked item's record and `hid` that item's id;
   *  an official entry's `snapshot` is null. */
  entries: (Omit<EntryRow, 'gm_note' | 'hb_item'> & {
    snapshot: unknown;
    hid?: string;
    gm_note?: string;
  })[];
}

/** Returns whether two reads draw the same page; `revision`, `updated_at` and `topic_key`
 *  are not drawn. */
export function sameProjection(a: SharedRow, b: SharedRow): boolean {
  return (
    JSON.stringify([a.audience, a.list, a.entries]) ===
    JSON.stringify([b.audience, b.list, b.entries])
  );
}

/** Returns the shared page's shape of a share link's list, as a `#/l/` payload decodes:
 *  the entries in their order, an entry the data does not know dropped and counted. */
export function sharedListOf(row: SharedRow, knows: (id: string) => boolean): DecodedList {
  const ids: string[] = [];
  const meta: Record<string, ListEntryMeta> = {};
  let dropped = 0;
  for (const e of row.entries) {
    if (!knows(e.item_key)) {
      dropped++;
      continue;
    }
    ids.push(e.item_key);
    const m = entryMetaOf(e);
    if (Object.keys(m).length) meta[e.item_key] = m;
  }
  const d: DecodedList = { name: row.list.name, ids, dropped };
  if (row.list.money_mode === 'coin') d.money = 'coin';
  if (row.list.player_note) d.note = row.list.player_note;
  if (row.list.gm_note) d.hnote = row.list.gm_note;
  if (Object.keys(meta).length) d.meta = meta;
  return d;
}

/** Returns the audience's active share; else `stopped` when it has any row (a deleted
 *  link is not made again by itself), else `none`. */
export function shareOf(
  rows: readonly ShareRow[],
  audience: ShareAudience
): { id: string; token: string } | 'stopped' | 'none' {
  const mine = rows.filter((r) => r.audience === audience);
  const active = mine.find((r) => r.revoked_at === null);
  if (active) return { id: active.id, token: active.token };
  return mine.length ? 'stopped' : 'none';
}

/** Returns a stored quantity: 1..99. */
export function quantityOf(qty: number | undefined): number {
  return Math.min(QTY_MAX, Math.max(1, Math.floor(qty ?? 1) || 1));
}

/** Returns a stored price: 1..99999 coins, or null for none. */
export function priceOf(gold: number | undefined): number | null {
  const g = Math.floor(gold ?? 0);
  return g > 0 ? Math.min(g, PRICE_MAX) : null;
}

/** Returns the rows of `ids` with their meta, positions counted from `from`, each id from
 *  `newId`, each written as `sourceOf` answers; a key it answers null for is left out. The
 *  default writes catalog keys only. */
export function entryRowsOf(
  ids: readonly string[],
  meta: Readonly<Record<string, ListEntryMeta>> | undefined,
  newId: () => string,
  from = 0,
  sourceOf: (key: string) => EntrySource | null = catalogOnly
): EntryRow[] {
  return ids
    .flatMap((key) => {
      const src = sourceOf(key);
      return src ? [{ key, src }] : [];
    })
    .map(({ key, src }, i) => {
      const m = meta?.[key] ?? {};
      return {
        id: newId(),
        item_key: key,
        source: src.source,
        hb_item: src.hb_item,
        position: from + i,
        quantity: quantityOf(m.qty),
        price_coins: priceOf(m.gold),
        player_note: clip(m.note ?? '', NOTE_MAX),
        gm_note: clip(m.hnote ?? '', NOTE_MAX)
      };
    });
}

/** Returns the toast for a refused write that hit a limit (`limit: <key>`, the database's
 *  message), with the number the database gave. */
export function limitText(key: string, value: number | null, t: Dict): string {
  const named: Partial<Record<string, string>> = {
    lists_per_owner: t.limitLists,
    entries_per_list: t.limitEntries,
    homebrew_items_per_owner: t.limitHbItems,
    homebrew_books_per_owner: t.limitHbBooks,
    homebrew_cards_per_owner: t.limitHbCards
  };
  const text = named[key] ?? t.limitOther;
  return text.replace('%n', value === null ? '?' : String(value));
}
