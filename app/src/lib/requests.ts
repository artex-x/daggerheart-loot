/* Purchase requests: the shapes the owner's panel reads, the database's
 * answers as the client reads them, and the panel's texts. Pure: the time
 * and the language arrive as arguments. docs/specs/FEATURES.md, "Account and
 * browser lists". */

import { isCloudId, type ShareAudience } from './cloudLists.js';
import type { Dict } from './dict.js';
import type { Lang } from './types.js';

/** One line of a request: the item, the count asked for, the unit price when the
 *  request was made, and what an apply took from it. */
export interface RequestLine {
  item: string;
  qty: number;
  price: number | null;
  applied: number | null;
}

/** A pending request as its list's owner reads it. `readAt` is null until the owner's
 *  page first draws it; from then it expires within the hour. */
export interface OwnerRequest {
  id: string;
  listId: string;
  audience: ShareAudience;
  createdAt: string;
  expiresAt: string;
  readAt: string | null;
  lines: RequestLine[];
}

/** A line an apply could not fill: the count asked for and the stock. */
export interface ShortLine {
  item: string;
  want: number;
  have: number;
}

const MINUTE = 60_000;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const wholeFrom = (v: unknown, lo: number): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= lo;
const orNull = (v: unknown): number | null | undefined =>
  v === null ? null : wholeFrom(v, 0) ? v : undefined;

function lineOf(v: unknown): RequestLine | null {
  if (!isRecord(v)) return null;
  const item = v['item_key'];
  const qty = v['quantity'];
  const price = orNull(v['price_coins']);
  const applied = orNull(v['applied_quantity']);
  if (typeof item !== 'string' || !wholeFrom(qty, 1)) return null;
  if (price === undefined || applied === undefined) return null;
  return { item, qty, price, applied };
}

function requestOf(v: unknown): OwnerRequest | null {
  if (!isRecord(v)) return null;
  const { id, list_id, audience, created_at, expires_at, read_at } = v;
  const rows = v['purchase_request_lines'];
  if (typeof id !== 'string' || typeof list_id !== 'string' || !isCloudId(list_id)) return null;
  if (audience !== 'player' && audience !== 'gm') return null;
  if (typeof created_at !== 'string' || typeof expires_at !== 'string') return null;
  if (read_at !== null && read_at !== undefined && typeof read_at !== 'string') return null;
  if (!Array.isArray(rows)) return null;
  const lines = rows.map(lineOf);
  if (lines.some((l) => l === null)) return null;
  return {
    id,
    listId: list_id,
    audience,
    createdAt: created_at,
    expiresAt: expires_at,
    readAt: typeof read_at === 'string' ? read_at : null,
    lines: (lines as RequestLine[]).sort((a, b) => (a.item < b.item ? -1 : 1))
  };
}

/** Returns the owner's requests of a `purchase_requests` read with its lines, each
 *  request's lines by item; a row of another shape is skipped. Null when `data` is
 *  not an array. */
export function readRequests(data: unknown): OwnerRequest[] | null {
  if (!Array.isArray(data)) return null;
  return data.map(requestOf).filter((r): r is OwnerRequest => r !== null);
}

/** A `list_notices` row as the owner's read returns it: one item of one list that its
 *  author changed or deleted. */
export interface NoticeRow {
  id: string;
  list_id: string;
  item_key: string;
  hid: string | null;
  kind: 'changed' | 'deleted';
  name: { en?: string; ru?: string };
  created_at: string;
  read_at: string | null;
}

/** A notice as the owner's panel draws it; `hid` is null once the item is deleted. */
export interface ListNotice {
  id: string;
  listId: string;
  itemKey: string;
  hid: string | null;
  kind: 'changed' | 'deleted';
  name: { en: string; ru: string };
  createdAt: string;
  readAt: string | null;
}

const NOTICE_KEY = /^[A-Za-z0-9_-]{1,64}$/;
const isTime = (v: unknown): v is string =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v));

/** Returns a notice of a `list_notices` read, or null for a row of another shape: a uuid id
 *  and list, a key of an entry's shape, `hid` a uuid or null, one of the two kinds, a name
 *  in at least one language and ISO times. */
export function noticeOf(v: unknown): ListNotice | null {
  if (!isRecord(v)) return null;
  const { id, list_id, item_key, hid, kind, name, created_at, read_at } = v;
  if (typeof id !== 'string' || !isCloudId(id)) return null;
  if (typeof list_id !== 'string' || !isCloudId(list_id)) return null;
  if (typeof item_key !== 'string' || !NOTICE_KEY.test(item_key)) return null;
  if (hid !== null && (typeof hid !== 'string' || !isCloudId(hid))) return null;
  if (kind !== 'changed' && kind !== 'deleted') return null;
  if (!isRecord(name)) return null;
  const en = typeof name['en'] === 'string' ? name['en'] : '';
  const ru = typeof name['ru'] === 'string' ? name['ru'] : '';
  if (!en && !ru) return null;
  if (!isTime(created_at) || (read_at !== null && !isTime(read_at))) return null;
  return {
    id,
    listId: list_id,
    itemKey: item_key,
    hid,
    kind,
    name: { en, ru },
    createdAt: created_at,
    readAt: read_at
  };
}

/** Returns a notice's item name in `lang`, else in the other language. */
export function noticeName(n: Pick<ListNotice, 'name'>, lang: Lang): string {
  return (lang === 'ru' ? n.name.ru || n.name.en : n.name.en || n.name.ru) || '';
}

/** Returns `apply_purchase_request`'s answer: the count taken, or the lines it could
 *  not fill. Null for any other shape. */
export function readApplied(
  data: unknown
): { ok: true; taken: number } | { ok: false; error: 'short'; short: ShortLine[] } | null {
  if (!isRecord(data)) return null;
  if (data['applied'] === true) {
    const taken = data['taken'];
    return wholeFrom(taken, 0) ? { ok: true, taken } : null;
  }
  const short = data['short'];
  if (!Array.isArray(short) || !short.length) return null;
  const lines: ShortLine[] = [];
  for (const s of short) {
    if (!isRecord(s)) return null;
    const { item, want, have } = s;
    if (typeof item !== 'string' || !wholeFrom(want, 0) || !wholeFrom(have, 0)) return null;
    lines.push({ item, want, have });
  }
  return { ok: false, error: 'short', short: lines };
}

/* The owner message the database gives for a request that is not the caller's or
   no longer exists: it answers no existence question, and the owner's panel lists
   only the owner's own requests, so for the panel the row is gone. */
const NOT_THE_OWNER = 'request: not the owner of the request';

/** Returns what a request function's refusal means to the client, or null when the
 *  write rules decide it (`network`, `limit`, `refused`). `P0002` is `gone` at any
 *  HTTP status. */
export function requestRefusal(
  code: string | undefined,
  message: string | undefined
): 'gone' | 'stale' | 'decided' | 'expired' | null {
  if (code === 'P0002') return 'gone';
  if (code === '42501' && message === NOT_THE_OWNER) return 'gone';
  if (code !== '22023') return null;
  if (message === 'request: stale') return 'stale';
  if (message === 'request: decided') return 'decided';
  if (message === 'request: expired') return 'expired';
  return null;
}

/** Returns the list's requests that have not expired at `now`, newest first; in one
 *  millisecond the greater id first, so the fake's ids keep the order they were made in. */
export function pendingFor(
  requests: readonly OwnerRequest[],
  listId: string,
  now: number
): OwnerRequest[] {
  return requests
    .filter((r) => r.listId === listId && Date.parse(r.expiresAt) > now)
    .sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
        (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)
    );
}

/** Returns a request's total as `totalParts` reads it: the coins of the priced lines,
 *  and how many lines have no price. */
export function requestTotal(lines: readonly RequestLine[]): {
  coins: number;
  unpriced: number;
} {
  let coins = 0;
  let unpriced = 0;
  for (const l of lines) {
    if (l.price === null) unpriced++;
    else coins += l.price * l.qty;
  }
  return { coins, unpriced };
}

const FORMAT: Record<Lang, Intl.RelativeTimeFormat> = {
  ru: new Intl.RelativeTimeFormat('ru', { numeric: 'auto' }),
  en: new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
};

/** Returns a request's link and age: «По ссылке для игроков · 10 минут назад». */
export function ageText(
  r: Pick<OwnerRequest, 'audience' | 'createdAt'>,
  now: number,
  lang: Lang,
  t: Dict
): string {
  const who = r.audience === 'gm' ? t.requestByGm : t.requestByPlayers;
  const minutes = Math.floor((now - Date.parse(r.createdAt)) / MINUTE);
  const age = minutes < 1 ? t.requestJustNow : FORMAT[lang].format(-minutes, 'minute');
  return `${who} · ${age}`;
}

/** Returns `ageText`, and for a read request the time to expiry, «... · истечёт через 50
 *  минут». The minutes stay within 1..60, so a clock older than the read still reads 60;
 *  an unread request has days left and names none. */
export function whoText(r: OwnerRequest, now: number, lang: Lang, t: Dict): string {
  if (r.readAt === null) return ageText(r, now, lang, t);
  const left = Math.ceil((Date.parse(r.expiresAt) - now) / MINUTE);
  const m = Math.min(60, Math.max(1, left));
  const expires = t.requestExpires.replace('%s', FORMAT[lang].format(m, 'minute'));
  return `${ageText(r, now, lang, t)} · ${expires}`;
}

/** Returns the refused apply's alert: every short line, by name, asked and in stock. */
export function shortText(
  short: readonly ShortLine[],
  nameOf: (item: string) => string,
  t: Dict
): string {
  const lines = short.map((s) =>
    t.requestShortLine
      .replace('%s', nameOf(s.item))
      .replace('%w', String(s.want))
      .replace('%h', String(s.have))
  );
  return t.requestShort.replace('%s', lines.join(', '));
}
