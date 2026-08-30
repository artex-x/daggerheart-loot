/* Encoding a list into the address.
 *
 * The format is frozen: docs/specs/CONTRACTS.md section 3. A link someone pasted
 * into a chat six months ago has to open with this too. Golden fixtures live in
 * docs/fixtures/lists and are replayed by listLink.test.ts and
 * tests/contracts.js.
 *
 * Pure module: no DOM, no storage, no data. Which ids exist is the caller's
 * business - the decoder asks through a predicate. */

/** One entry: everything optional, older lists knew none of these fields. */
export interface ListEntryMeta {
  qty?: number;
  gold?: number;
  /** The note that goes to the players. */
  note?: string;
  /** The note that stays with the GM. */
  hnote?: string;
}

export type MoneyMode = 'bag' | 'coin';

export interface ListShape {
  name: string;
  ids: string[];
  money?: MoneyMode;
  note?: string;
  hnote?: string;
  meta?: Record<string, ListEntryMeta>;
}

/* Notes do not fit on the items line: they may contain newlines. So they ride in
   a tail, separated by characters a person cannot type. */
const N_REC = '\x1e';
const N_SEP = '\x1f';
/** The id standing for the list's own note. */
const N_LIST = '~';
/** Not an id: the price display mode. An older reader skips the record. */
const N_MONEY = '$';
/** A leading "+" on the id marks the note as meant for players. */
const N_SHOW = '+';

const MONEY_MODES: readonly MoneyMode[] = ['bag', 'coin'];
const MONEY_DEFAULT: MoneyMode = 'bag';

/* ---------- base64url ---------- */

export function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(payload: string): string {
  const bin = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* ---------- the checksum ----------
   Four base36 characters: a truncated link lands on the right value about once
   in two million, and it costs nothing. Without it a clipped address would
   decode into a shorter list that looks complete. */

export function stamp(parts: readonly string[]): string {
  const body = parts.join(',');
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${parts.length.toString(36)}.${(h >>> 0).toString(36).slice(-4)}~`;
}

/* ---------- encoding ---------- */

function metaOf(list: ListShape, id: string): ListEntryMeta {
  return list.meta?.[id] ?? {};
}

function itemPart(list: ListShape, id: string): string {
  const m = metaOf(list, id);
  if (m.gold) return `${id}*${String(m.qty ?? 1)}*${String(m.gold)}`;
  if (m.qty && m.qty > 1) return `${id}*${String(m.qty)}`;
  return id;
}

function noteRec(id: string, text: string | undefined, forPlayers: boolean): string {
  if (!text) return '';
  return N_REC + (forPlayers ? N_SHOW : '') + id + N_SEP + text;
}

/**
 * `forPlayers` leaves the GM's own notes out: that link goes into the party
 * chat, while the full one is the GM's backup.
 */
export function encodeListRaw(list: ListShape, forPlayers: boolean): string {
  const parts = list.ids.map((id) => itemPart(list, id));
  let raw = `${list.name}\n${stamp(parts)}${parts.join(',')}`;

  const pair = (id: string, o: { note?: string; hnote?: string }): string =>
    noteRec(id, o.note, true) + (forPlayers ? '' : noteRec(id, o.hnote, false));

  const mode = list.money ?? MONEY_DEFAULT;
  const money = mode === MONEY_DEFAULT ? '' : N_REC + N_MONEY + N_SEP + mode;
  const notes =
    money + pair(N_LIST, list) + list.ids.map((id) => pair(id, metaOf(list, id))).join('');
  if (notes) raw += '\n' + notes;
  return raw;
}

export function encodeList(list: ListShape, forPlayers: boolean): string {
  return toBase64Url(encodeListRaw(list, forPlayers));
}

/* ---------- decoding ---------- */

export interface DecodedList {
  name: string;
  ids: string[];
  money?: MoneyMode;
  note?: string;
  hnote?: string;
  meta?: Record<string, ListEntryMeta>;
}

/** Whether the data knows this id. Unknown entries are dropped. */
export type KnowsId = (id: string) => boolean;

function parseItems(
  itemsLine: string,
  knows: KnowsId
): { ids: string[]; meta: Record<string, ListEntryMeta> } | null {
  /* Links written before the checksum existed carry none - there is nothing to
     check them against, and they are read as they always were. */
  const cut = itemsLine.indexOf('~');
  const head = cut > 0 ? itemsLine.slice(0, cut) : '';
  const hasStamp = cut > 0 && /^[0-9a-z]+\.[0-9a-z]{1,4}$/.test(head);
  const body = hasStamp ? itemsLine.slice(cut + 1) : itemsLine;

  const parts = body.split(',');
  if (hasStamp && stamp(parts) !== head + '~') return null; // truncated or edited

  const ids: string[] = [];
  const meta: Record<string, ListEntryMeta> = {};
  for (const part of parts) {
    const bits = part.split('*');
    const id = bits[0];
    if (!id || !knows(id)) continue;
    ids.push(id);
    const qty = parseInt(bits[1] ?? '', 10);
    const gold = parseInt(bits[2] ?? '', 10);
    const m: ListEntryMeta = {};
    if (qty > 1) m.qty = qty;
    if (gold > 0) m.gold = gold;
    if (Object.keys(m).length) meta[id] = m;
  }
  return ids.length ? { ids, meta } : null;
}

export function decodeList(payload: string, knows: KnowsId): DecodedList | null {
  let raw: string;
  try {
    raw = fromBase64Url(payload);
  } catch {
    return null;
  }

  const nl = raw.indexOf('\n');
  const name = nl >= 0 ? raw.slice(0, nl) : '';
  const rest = nl >= 0 ? raw.slice(nl + 1) : '';
  const nl2 = rest.indexOf('\n');
  const itemsLine = nl2 >= 0 ? rest.slice(0, nl2) : rest;
  const noteBlob = nl2 >= 0 ? rest.slice(nl2 + 1) : '';

  const items = parseItems(itemsLine, knows);
  if (!items) return null;
  const { ids, meta } = items;

  let note = '';
  let hnote = '';
  let money: MoneyMode | '' = '';

  if (noteBlob) {
    const first = noteBlob.indexOf(N_REC);
    /* Anything before the first record is a list note from the first cut of this
       format, which had no marker at all; it meant the GM's own note. */
    hnote = first < 0 ? noteBlob : noteBlob.slice(0, first);
    if (first >= 0) {
      for (const rec of noteBlob.slice(first + 1).split(N_REC)) {
        const at = rec.indexOf(N_SEP);
        if (at < 0) continue;
        let id = rec.slice(0, at);
        const text = rec.slice(at + 1);
        if (!text) continue;
        const forPlayers = id.charAt(0) === N_SHOW;
        if (forPlayers) id = id.slice(1);

        if (id === N_MONEY) {
          if ((MONEY_MODES as readonly string[]).includes(text)) money = text as MoneyMode;
          continue;
        }
        if (id === N_LIST) {
          if (forPlayers) note = text;
          else hnote = text;
          continue;
        }
        if (!knows(id) || !ids.includes(id)) continue;
        const entry = meta[id] ?? (meta[id] = {});
        if (forPlayers) entry.note = text;
        else entry.hnote = text;
      }
    }
  }

  const out: DecodedList = { name, ids };
  if (money) out.money = money;
  if (note) out.note = note;
  if (hnote) out.hnote = hnote;
  if (Object.keys(meta).length) out.meta = meta;
  return out;
}
