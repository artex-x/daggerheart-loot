/* Кодирование списка в адрес.
 *
 * Формат заморожен: docs/specs/CONTRACTS.md, раздел 3. Ссылку, которую кто-то
 * вставил в чат полгода назад, обязано открывать и это. Золотые образцы -
 * docs/fixtures/lists, их проигрывают listLink.test.ts и tests/contracts.js.
 *
 * Модуль чистый: ни DOM, ни хранилища, ни данных. Какие идентификаторы
 * существуют, решает вызывающий - декодер спрашивает предикатом. */

/** Одна позиция списка: всё необязательно, старые списки этих полей не знали. */
export interface ListEntryMeta {
  qty?: number;
  gold?: number;
  /** Заметка, которая уходит игрокам. */
  note?: string;
  /** Заметка, которая остаётся мастеру. */
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

/* Заметки не влезают в строку позиций: в них бывают переводы строки. Поэтому
   они едут хвостом и разделены знаками, которые человек не наберёт. */
const N_REC = '\x1e';
const N_SEP = '\x1f';
/** Идентификатор, под которым едет заметка самого списка. */
const N_LIST = '~';
/** Не идентификатор: режим показа цены. Старый разборщик такую запись пропустит. */
const N_MONEY = '$';
/** «+» перед идентификатором - заметка предназначена игрокам. */
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

/* ---------- контрольная метка ----------
   Четыре знака base36: обрезанная ссылка попадёт в верное значение примерно
   раз на два миллиона, а стоит это ничего. Без метки обрезанный адрес
   раскодировался бы в список поменьше, который выглядит целым. */

export function stamp(parts: readonly string[]): string {
  const body = parts.join(',');
  let h = 2166136261;
  for (let i = 0; i < body.length; i++) {
    h ^= body.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${parts.length.toString(36)}.${(h >>> 0).toString(36).slice(-4)}~`;
}

/* ---------- кодирование ---------- */

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
 * `forPlayers` оставляет за бортом мастерские заметки: эту ссылку кидают в чат
 * партии, а полная - резервная копия мастера.
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

/* ---------- декодирование ---------- */

export interface DecodedList {
  name: string;
  ids: string[];
  money?: MoneyMode;
  note?: string;
  hnote?: string;
  meta?: Record<string, ListEntryMeta>;
}

/** Существует ли такой идентификатор в данных. Незнакомые позиции отбрасываются. */
export type KnowsId = (id: string) => boolean;

function parseItems(
  itemsLine: string,
  knows: KnowsId
): { ids: string[]; meta: Record<string, ListEntryMeta> } | null {
  /* Ссылки, написанные до появления метки, метки не несут - сверять их не с
     чем, и читаются они как читались. */
  const cut = itemsLine.indexOf('~');
  const head = cut > 0 ? itemsLine.slice(0, cut) : '';
  const hasStamp = cut > 0 && /^[0-9a-z]+\.[0-9a-z]{1,4}$/.test(head);
  const body = hasStamp ? itemsLine.slice(cut + 1) : itemsLine;

  const parts = body.split(',');
  if (hasStamp && stamp(parts) !== head + '~') return null; // обрезали или правили

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
    /* Всё до первой записи - заметка списка из первой редакции формата, где
       разметки не было вовсе; она означала мастерскую. */
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
