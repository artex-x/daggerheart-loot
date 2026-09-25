/* Account lists: the rows `ListRepository` reads and writes, and their
 * mapping onto the `StoredList` shape the list page already draws.
 *
 * Column names follow the schema (`supabase/migrations/20260925130100_lists.sql`).
 * Pure module: no port, no storage. docs/specs/FEATURES.md, "Account lists". */

import type { Dict } from './dict.js';
import type { DecodedList, ListEntryMeta, MoneyMode } from './listLink.js';
import { QTY_MAX } from './listLink.js';
import type { StoredList } from './lists.js';

/** The most coins a price holds (`list_entries.price_coins`). */
const PRICE_MAX = 99999;
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
  snapshot: unknown;
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

/** An account list as the pages draw it: `ids` are the entries' record ids in list order,
 *  `entryIds` maps each to its row id, `updated` is the last edit in ms. */
export type CloudList = StoredList & { updated: number; entryIds: Record<string, string> };

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
  for (const e of entries) {
    entryIds[e.item_key] = e.id;
    const m = entryMetaOf(e);
    if (Object.keys(m).length) meta[e.item_key] = m;
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
  list: { name: string; money_mode: MoneyMode; player_note: string; gm_note?: string };
  entries: (Omit<EntryRow, 'gm_note'> & { gm_note?: string })[];
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
 *  `newId`. */
export function entryRowsOf(
  ids: readonly string[],
  meta: Readonly<Record<string, ListEntryMeta>> | undefined,
  newId: () => string,
  from = 0
): EntryRow[] {
  return ids.map((key, i) => {
    const m = meta?.[key] ?? {};
    return {
      id: newId(),
      item_key: key,
      source: 'official',
      snapshot: null,
      position: from + i,
      quantity: quantityOf(m.qty),
      price_coins: priceOf(m.gold),
      player_note: clip(m.note ?? '', NOTE_MAX),
      gm_note: clip(m.hnote ?? '', NOTE_MAX)
    };
  });
}

/** Returns the toast for a refused write that hit a count limit (`limit: <key>`, the
 *  database's message), with the number the database gave. */
export function limitText(key: string, value: number | null, t: Dict): string {
  const text =
    key === 'lists_per_owner'
      ? t.limitLists
      : key === 'entries_per_list'
        ? t.limitEntries
        : t.limitOther;
  return text.replace('%n', value === null ? '?' : String(value));
}
