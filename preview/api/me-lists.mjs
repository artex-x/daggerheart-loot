/*
  The account API's list operations (docs/specs/CONTRACTS.md section 6, "Account API"):
  the reader's lists, their entries,
  share links, a copy of a shared list, and the lists file out and in. Every write is a call
  the app itself makes: `apply_list_writes` with the ops `lib/cloudLists.ts` shapes, a
  `lists` update or delete by revision, and the share and import functions. Every file is
  built and parsed by `lib/bundle.ts`.

  An operation takes `(ctx, input)`: `ctx` holds the reader's token, the env, the site, the
  read API's service and the clock; `input` holds `params`, `query`, `body` and `ifMatch`
  (the rev `If-Match` names, or null). It returns `{ status, body?, etag? }` or throws an
  ApiError.
*/
import {
  NAME_MAX,
  NOTE_MAX,
  PRICE_MAX,
  entryOrder,
  entryRowsOf,
  linkedRecords,
  toCloudList
} from '../../app/src/lib/cloudLists.ts';
import { bundleText, importPlan, parseBundle, toBundle } from '../../app/src/lib/bundle.ts';
import { HOMEBREW_FORMAT } from '../../app/src/lib/homebrewFile.ts';
import { dict } from '../../app/src/lib/dict.ts';
import { appUrl, cardVersion, shareHash, storedListHash } from '../../app/src/lib/hash.ts';
import {
  DESC_MAX,
  NAME_MAX as HB_NAME_MAX,
  isHomebrewKey,
  keyFrom,
  ownKeyFor
} from '../../app/src/lib/homebrew.ts';
import { QTY_MAX } from '../../app/src/lib/lists.ts';
import { guessPrice, reprice } from '../../app/src/lib/money.ts';
import {
  UUID,
  applyWrites,
  arrayField,
  bad,
  boolField,
  bytesOf,
  call,
  confirmed,
  cursorOf,
  idsField,
  intField,
  limitReached,
  meError,
  needed,
  notFound,
  outcomeOf,
  pageOf,
  pg,
  preconditionFailed,
  preconditionRequired,
  textField,
  unavailable,
  uuidField,
  uuidV5
} from './me.mjs';
import { createItemRow, importHomebrew, keyOfId } from './me-homebrew.mjs';

/** The most entries one call adds, changes or deletes: a list's entry limit. */
const ENTRIES_MAX = 100;
/** The most lists one bulk delete takes: each list cascades. */
const LISTS_DELETE_MAX = 10;
/** The most lists a lists file names by `ids`, and the most lists one page reads: a page
 *  makes 1 + 7 x 2 Supabase calls, and with the search files at 3x at most 19 subrequests,
 *  even if an `env.ASSETS` read counts (the Cloudflare docs do not say, 2026-11-14). */
const FILE_IDS_MAX = 10;
const FILE_PAGE_LISTS = 7;
/** A lists file page holds whole lists up to this many bytes (a cap may rise, never fall). */
export const FILE_PAGE_MAX = 32768;
/** The most bytes of a file an import reads: the file check's cap. */
export const IMPORT_FILE_MAX = 32768;
const RECORD_ID = /^[A-Za-z0-9_-]{1,64}$/;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const MONEY = ['bag', 'coin'];
const AUDIENCES = ['player', 'gm'];

const LIST_SELECT =
  'id,name,money_mode,player_note,gm_note,created_at,updated_at,revision,' +
  'list_entries(id,item_key,source,hb_item,position,quantity,price_coins,player_note,gm_note,gm_only)';
const HEAD_SELECT = 'id,name,revision,updated_at,list_entries(count)';
const SHARE_SELECT =
  'id,name,player_note,list_entries(gm_only),list_shares(id,audience,token,created_at,revoked_at)';

const utf8 = new TextEncoder();
const siteOf = (ctx) => ({ base: ctx.site });
const listLink = (ctx, id, lang = 'ru') => appUrl(siteOf(ctx), storedListHash(id), lang);
const tooLargeList = (ctx, id) => () =>
  meError(
    422,
    'answer_too_large',
    `The list is too large for the API. Open it in the app: ${listLink(ctx, id)}`
  );
/* After a write the change is in the account: a client that reads a failure would send it again. */
const tooLargeSaved = (ctx, id) => () =>
  meError(
    422,
    'answer_too_large',
    `The change is saved, but the list is too large for the API to answer. Open it in the app: ${listLink(ctx, id)}`
  );

/* ---------- reads ---------- */

/** Reads one of the reader's lists with its entries in list order, or null; `tooLarge`
 *  makes the 422 of an answer past the read cap. */
async function readList(ctx, id, tooLarge = tooLargeList(ctx, id)) {
  const r = await pg(ctx, 'GET', `lists?id=eq.${id}&select=${LIST_SELECT}`);
  const rows = needed(r, tooLarge);
  if (!Array.isArray(rows)) throw unavailable();
  const row = rows[0];
  if (!row) return null;
  return { ...row, list_entries: [...row.list_entries].sort(entryOrder) };
}

/** Returns a list that must exist, else throws 404. */
async function listOrGone(ctx, id, tooLarge) {
  const row = await readList(ctx, id, tooLarge);
  if (!row) throw notFound('The list');
  return row;
}

/** Returns the entry of the answer: its record is a catalog id or a homebrew item's uuid. */
function entryOf(e) {
  const homebrew = e.source === 'homebrew';
  return {
    id: e.id,
    key: e.item_key,
    origin: homebrew ? 'homebrew' : 'catalog',
    record_id: homebrew ? e.hb_item : e.item_key,
    quantity: e.quantity,
    price_coins: e.price_coins ?? null,
    player_note: e.player_note ?? '',
    gm_note: e.gm_note ?? '',
    gm_only: e.gm_only === true
  };
}

/** Returns the `api-my-list` answer of a read row, with `extra` fields (bulk `results`). */
function listAnswer(ctx, row, status = 200, extra = {}) {
  return {
    status,
    etag: String(row.revision),
    body: {
      format: 'daggerheart-loot/api-my-list',
      version: 1,
      id: row.id,
      rev: String(row.revision),
      name: row.name,
      money_mode: row.money_mode,
      player_note: row.player_note ?? '',
      gm_note: row.gm_note ?? '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      link: listLink(ctx, row.id),
      link_en: listLink(ctx, row.id, 'en'),
      entries: row.list_entries.map(entryOf),
      ...extra
    }
  };
}

/** Reads the list again after a write and answers it. */
async function answerList(ctx, id, status = 200, extra = {}) {
  return listAnswer(ctx, await listOrGone(ctx, id, tooLargeSaved(ctx, id)), status, extra);
}

/* ---------- entries ---------- */

/**
 * Returns what an entry's `record_id` writes as: a catalog id is official, an `hb_` key links
 * the reader's own item of that key, a uuid links that homebrew item (the reader's or another
 * account's). The database's trigger writes a linked item's key. `facts` is the catalog.
 */
function sourceOf(recordId, facts) {
  if (typeof recordId === 'string' && UUID.test(recordId.toLowerCase())) {
    const hid = recordId.toLowerCase();
    return { key: hid.replace(/-/g, ''), source: 'homebrew', hb_item: hid };
  }
  if (typeof recordId === 'string' && isHomebrewKey(recordId)) {
    return { key: recordId, source: 'homebrew', hb_item: null };
  }
  if (typeof recordId === 'string' && RECORD_ID.test(recordId) && facts.has(recordId)) {
    return { key: recordId, source: 'official', hb_item: null };
  }
  throw bad(
    'The field record_id must be a catalog record id, an own item key (hb_...) or a homebrew item uuid.'
  );
}

/** Returns the checked fields of an entry to add. */
function entryInput(x, facts) {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) {
    throw bad('Each item of the field entries must be an object.');
  }
  const price = x.price_coins;
  if (
    price !== undefined &&
    price !== null &&
    (!Number.isInteger(price) || price < 1 || price > PRICE_MAX)
  ) {
    throw bad(
      `The field price_coins must be null or an integer from 1 to ${String(PRICE_MAX)}.`
    );
  }
  return {
    id: uuidField(x, 'id'),
    src: sourceOf(x.record_id, facts),
    quantity: intField(x, 'quantity', 1, QTY_MAX),
    price_coins: price ?? undefined,
    player_note: textField(x, 'player_note', NOTE_MAX),
    gm_note: textField(x, 'gm_note', NOTE_MAX),
    gm_only: boolField(x, 'gm_only')
  };
}

/** Returns the AL rows of checked entries, positions from `from`, through `entryRowsOf`. */
function rowsOf(inputs, from) {
  const ids = inputs.map((e) => e.id ?? crypto.randomUUID());
  let at = 0;
  const meta = {};
  const src = {};
  for (const e of inputs) {
    meta[e.src.key] = {
      ...(e.quantity !== undefined ? { qty: e.quantity } : {}),
      ...(e.price_coins !== undefined ? { gold: e.price_coins } : {}),
      ...(e.player_note ? { note: e.player_note } : {}),
      ...(e.gm_note ? { hnote: e.gm_note } : {}),
      ...(e.gm_only ? { gmOnly: true } : {})
    };
    src[e.src.key] = { source: e.src.source, hb_item: e.src.hb_item };
  }
  return entryRowsOf(
    inputs.map((e) => e.src.key),
    meta,
    () => ids[at++],
    from,
    (key) => src[key] ?? null
  );
}

/** Returns whether a held entry is the record of `src`. */
const holds = (e, src) =>
  src.hb_item !== null ? e.hb_item === src.hb_item : e.item_key === src.key;

/** Returns the HTTP error of a refused single write's raw result. */
function refusal(r, what) {
  const outcome = outcomeOf(r);
  if (outcome === 'gone') return notFound(what);
  if (outcome === 'limit') return limitReached(r.message);
  if (r?.code === '42501') {
    return meError(409, 'conflict', 'The id belongs to another account. Send a new uuid.');
  }
  if (r?.code === '23503') return bad('A record_id names no homebrew item.');
  return meError(409, 'conflict', 'The account refused the write.');
}

/* ---------- lists ---------- */

async function listMyLists(ctx, { query }) {
  const { limit, after } = pageOf(query);
  const [heads, lists, entries] = await Promise.all([
    pg(
      ctx,
      'GET',
      `lists?select=${HEAD_SELECT}&order=id.asc&limit=${String(limit + 1)}` +
        (after ? `&id=gt.${after}` : '')
    ),
    call(ctx, 'my_limit', { p_key: 'lists_per_owner' }),
    call(ctx, 'my_limit', { p_key: 'entries_per_list' })
  ]);
  const rows = needed(heads, () =>
    meError(
      422,
      'answer_too_large',
      'The page of lists is too large for the API. Send a smaller limit.'
    )
  );
  if (!Array.isArray(rows) || !lists.ok || !entries.ok) throw unavailable();
  const page = rows.slice(0, limit);
  const limitOf = (v) => (typeof v === 'number' ? v : null);
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-lists',
      version: 1,
      lists: page.map((l) => ({
        id: l.id,
        rev: String(l.revision),
        name: l.name,
        entries: Number(l.list_entries?.[0]?.count ?? 0),
        updated_at: l.updated_at,
        link: listLink(ctx, l.id),
        link_en: listLink(ctx, l.id, 'en')
      })),
      limits: { lists: limitOf(lists.value), entries: limitOf(entries.value) },
      next: rows.length > limit ? cursorOf(page[page.length - 1].id) : null
    }
  };
}

async function getMyList(ctx, { params }) {
  return listAnswer(ctx, await listOrGone(ctx, params.list_id));
}

/** Returns the checked list fields of a create or a change. */
function listFields(body, required) {
  const out = {};
  const name = textField(body, 'name', NAME_MAX, required);
  if (name !== undefined) out.name = name;
  if (body.money_mode !== undefined) {
    if (!MONEY.includes(body.money_mode)) {
      throw bad('The field money_mode must be one of: bag, coin.');
    }
    out.money_mode = body.money_mode;
  }
  const player = textField(body, 'player_note', NOTE_MAX);
  if (player !== undefined) out.player_note = player;
  const gm = textField(body, 'gm_note', NOTE_MAX);
  if (gm !== undefined) out.gm_note = gm;
  return out;
}

async function createList(ctx, { body }) {
  const fields = listFields(body, true);
  const id = uuidField(body, 'id') ?? crypto.randomUUID();
  const facts = body.entries === undefined ? null : await ctx.service.catalogFacts();
  const inputs =
    body.entries === undefined
      ? []
      : arrayField(body, 'entries', 0, ENTRIES_MAX, (x) => entryInput(x, facts));
  const held = needed(await pg(ctx, 'GET', `lists?id=eq.${id}&select=id`));
  if (Array.isArray(held) && held.length) return answerList(ctx, id, 200);
  const seen = [];
  const unique = inputs.filter((e) => {
    if (seen.some((s) => s.key === e.src.key)) return false;
    seen.push(e.src);
    return true;
  });
  const [result] = await applyWrites(ctx, [
    {
      op: 'create',
      list: {
        id,
        name: fields.name,
        money_mode: fields.money_mode ?? 'bag',
        player_note: fields.player_note ?? '',
        gm_note: fields.gm_note ?? ''
      },
      entries: rowsOf(unique, 0)
    }
  ]);
  if (outcomeOf(result) !== 'ok') throw refusal(result, 'The list');
  return answerList(ctx, id, 201);
}

async function updateList(ctx, { params, body, ifMatch }) {
  const id = params.list_id;
  const patch = listFields(body, false);
  if (!Object.keys(patch).length) {
    throw bad('Send at least one of the fields name, money_mode, player_note and gm_note.');
  }
  if (ifMatch === null) {
    const [r] = await applyWrites(ctx, [{ op: 'update', id, patch }]);
    if (outcomeOf(r) !== 'ok') throw refusal(r, 'The list');
    return answerList(ctx, id);
  }
  /* The read-back rule of the app's `homebrewUpdate`: no row at the revision is a newer row,
     a deleted one, or this update sent again after its answer was lost. */
  const r = await pg(ctx, 'PATCH', `lists?id=eq.${id}&revision=eq.${ifMatch}&select=revision`, {
    body: patch,
    prefer: 'return=representation'
  });
  if (!r.ok) throw r.error?.code === 'P0001' ? limitReached(r.error.message) : unavailable();
  if (!Array.isArray(r.value) || !r.value.length) {
    const now = await readList(ctx, id);
    if (!now) throw notFound('The list');
    const same = Object.keys(patch).every((k) => now[k] === patch[k]);
    if (!same) throw preconditionFailed(now.revision);
    return listAnswer(ctx, now);
  }
  return answerList(ctx, id);
}

async function deleteList(ctx, { params, ifMatch }) {
  const id = params.list_id;
  if (ifMatch === null) throw preconditionRequired();
  const r = await pg(ctx, 'DELETE', `lists?id=eq.${id}&revision=eq.${ifMatch}&select=id`, {
    prefer: 'return=representation'
  });
  const gone = needed(r);
  if (Array.isArray(gone) && gone.length) return { status: 204 };
  const now = needed(await pg(ctx, 'GET', `lists?id=eq.${id}&select=revision`));
  if (Array.isArray(now) && now[0]) throw preconditionFailed(now[0].revision);
  return { status: 204 };
}

async function deleteLists(ctx, { body }) {
  const ids = idsField(body, 'ids', 1, LISTS_DELETE_MAX);
  confirmed(body, ids.length);
  /* One call with a `remove` per list, as «Удалить (N)» sends them; a list already gone
     deletes nothing and answers `ok`, so a retry answers each gone id as deleted. */
  const results = await applyWrites(
    ctx,
    ids.map((id) => ({ op: 'remove', id }))
  );
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-results',
      version: 1,
      results: ids.map((id, i) => ({ id, result: outcomeOf(results[i]) }))
    }
  };
}

/* ---------- entries ---------- */

/**
 * «Свой предмет» on a list: a plain item in the default source, then one entry that links it,
 * two writes in order as `QuickItem.svelte` sends them. The item id makes the key and the
 * entry id, so a retry makes no second item and no second entry; a full list is refused
 * before any write.
 */
async function addNewItem(ctx, id, x) {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) {
    throw bad('The field new_item must be an object.');
  }
  const name = textField(x, 'name', HB_NAME_MAX, true);
  const description = textField(x, 'description', DESC_MAX);
  const lang = x.lang ?? 'ru';
  if (lang !== 'ru' && lang !== 'en') throw bad('The field lang must be one of: ru, en.');
  const itemId = uuidField(x, 'id') ?? crypto.randomUUID();
  const entryId = await uuidV5(itemId, 'entry');
  const content = {
    kind: 'item',
    [lang]: name,
    ...(description ? { [lang === 'ru' ? 'rud' : 'ende']: description } : {})
  };
  const row = await listOrGone(ctx, id);
  const held = row.list_entries.find((e) => e.hb_item === itemId);
  const result = (r) => ({ results: [{ id: entryId, record_id: itemId, result: r }] });
  if (held) return answerList(ctx, id, 200, result('ok'));
  const limit = await call(ctx, 'my_limit', { p_key: 'entries_per_list' });
  if (!limit.ok) throw unavailable();
  if (typeof limit.value === 'number' && row.list_entries.length >= limit.value) {
    throw limitReached('limit: entries_per_list');
  }
  await createItemRow(ctx, { id: itemId, key: keyOfId(itemId), book: null, content });
  const from = row.list_entries.reduce((m, h) => Math.max(m, h.position + 1), 0);
  const [r] = await applyWrites(ctx, [
    {
      op: 'add',
      list_id: id,
      entries: rowsOf(
        [{ id: entryId, src: { key: keyOfId(itemId), source: 'homebrew', hb_item: itemId } }],
        from
      )
    }
  ]);
  if (outcomeOf(r) !== 'ok') throw refusal(r, 'The list');
  return answerList(ctx, id, 200, result('ok'));
}

async function addToList(ctx, { params, body }) {
  const id = params.list_id;
  if (body.new_item !== undefined) {
    if (body.entries !== undefined) throw bad('Send entries or new_item, not both.');
    return addNewItem(ctx, id, body.new_item);
  }
  const facts = await ctx.service.catalogFacts();
  const inputs = arrayField(body, 'entries', 1, ENTRIES_MAX, (x) => entryInput(x, facts));
  const row = await listOrGone(ctx, id);
  const held = row.list_entries;
  const results = [];
  const fresh = [];
  for (const e of inputs) {
    const recordId = e.src.hb_item ?? e.src.key;
    if (e.id && held.some((h) => h.id === e.id)) {
      results.push({ id: e.id, record_id: recordId, result: 'ok' });
      continue;
    }
    const same =
      held.find((h) => holds(h, e.src)) ?? fresh.find((f) => f.src.key === e.src.key);
    if (same) {
      results.push({ id: same.id ?? null, record_id: recordId, result: 'skipped' });
      continue;
    }
    const entryId = e.id ?? crypto.randomUUID();
    fresh.push({ ...e, id: entryId });
    results.push({ id: entryId, record_id: recordId, result: null });
  }
  if (fresh.length) {
    const from = held.reduce((m, h) => Math.max(m, h.position + 1), 0);
    const [r] = await applyWrites(ctx, [
      { op: 'add', list_id: id, entries: rowsOf(fresh, from) }
    ]);
    const outcome = outcomeOf(r);
    for (const res of results) if (res.result === null) res.result = outcome;
  }
  return answerList(ctx, id, 200, { results });
}

/** Returns the checked fields of an entry change. */
function entryPatch(body) {
  const patch = {};
  const q = intField(body, 'quantity', 1, QTY_MAX);
  if (q !== undefined) patch.quantity = q;
  if (body.price_coins !== undefined) {
    const p = body.price_coins;
    if (p !== null && (!Number.isInteger(p) || p < 1 || p > PRICE_MAX)) {
      throw bad(
        `The field price_coins must be null or an integer from 1 to ${String(PRICE_MAX)}.`
      );
    }
    patch.price_coins = p;
  }
  const player = textField(body, 'player_note', NOTE_MAX);
  if (player !== undefined) patch.player_note = player;
  const gm = textField(body, 'gm_note', NOTE_MAX);
  if (gm !== undefined) patch.gm_note = gm;
  const gmOnly = boolField(body, 'gm_only');
  if (gmOnly !== undefined) patch.gm_only = gmOnly;
  return patch;
}

async function updateListEntry(ctx, { params, body }) {
  const patch = entryPatch(body);
  if (!Object.keys(patch).length) {
    throw bad(
      'Send at least one of the fields quantity, price_coins, player_note, gm_note and gm_only.'
    );
  }
  const row = await listOrGone(ctx, params.list_id);
  if (!row.list_entries.some((e) => e.id === params.entry_id)) throw notFound('The entry');
  const [r] = await applyWrites(ctx, [{ op: 'update_entry', id: params.entry_id, patch }]);
  if (outcomeOf(r) !== 'ok') throw refusal(r, 'The entry');
  return answerList(ctx, params.list_id);
}

/** Returns the AL ops that remove `ids` from a list and close the gaps, as the app sends them. */
function removeOps(row, ids) {
  if (!ids.length) return [];
  const left = row.list_entries.filter((e) => !ids.includes(e.id)).map((e) => e.id);
  return [
    { op: 'remove_entries', ids },
    { op: 'reorder', list_id: row.id, ids: left }
  ];
}

async function removeListEntry(ctx, { params }) {
  const row = await listOrGone(ctx, params.list_id);
  if (!row.list_entries.some((e) => e.id === params.entry_id)) return { status: 204 };
  const [r] = await applyWrites(ctx, removeOps(row, [params.entry_id]));
  if (outcomeOf(r) !== 'ok' && outcomeOf(r) !== 'gone') throw refusal(r, 'The entry');
  return { status: 204 };
}

/** Throws unless `ifMatch` names the list's current revision; a missing one is 428. */
function current(row, ifMatch) {
  if (ifMatch === null) throw preconditionRequired();
  if (ifMatch !== String(row.revision)) throw preconditionFailed(row.revision);
}

async function removeFromList(ctx, { params, body, ifMatch }) {
  const asked = arrayField(body, 'entries', 1, ENTRIES_MAX, (x) => {
    if (x === null || typeof x !== 'object' || Array.isArray(x)) {
      throw bad('Each item of the field entries must be an object.');
    }
    return { id: uuidField(x, 'id', true), quantity: intField(x, 'quantity', 1, QTY_MAX) };
  });
  if (new Set(asked.map((e) => e.id)).size !== asked.length) {
    throw bad('The field entries names an entry twice.');
  }
  confirmed(body, asked.length);
  const row = await listOrGone(ctx, params.list_id);
  const byId = new Map(row.list_entries.map((e) => [e.id, e]));
  const part = asked.filter((e) => {
    const held = byId.get(e.id);
    return held && e.quantity !== undefined && e.quantity < held.quantity;
  });
  if (part.length) current(row, ifMatch);
  const whole = asked.filter((e) => byId.has(e.id) && !part.includes(e)).map((e) => e.id);
  const ops = [
    ...part.map((e) => ({
      op: 'update_entry',
      id: e.id,
      patch: { quantity: byId.get(e.id).quantity - e.quantity }
    })),
    ...removeOps(row, whole)
  ];
  const raw = await applyWrites(ctx, ops);
  const removed = whole.length ? outcomeOf(raw[part.length]) : 'ok';
  const results = asked.map((e) => {
    if (!byId.has(e.id)) return { id: e.id, result: 'ok' };
    const i = part.indexOf(e);
    return { id: e.id, result: i >= 0 ? outcomeOf(raw[i]) : removed };
  });
  return answerList(ctx, params.list_id, 200, { results });
}

/** Returns the checked `price` of a bulk change: one of guess, set, clear, raise_percent and
 *  discount_percent. */
function priceInput(v) {
  if (v === undefined) return null;
  const keys = v !== null && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v) : [];
  if (keys.length !== 1) {
    throw bad(
      'The field price must hold exactly one of guess, set, clear, raise_percent and discount_percent.'
    );
  }
  const [k] = keys;
  if ((k === 'guess' || k === 'clear') && v[k] === true) return { kind: k };
  if (k === 'set') return { kind: k, value: intField(v, 'set', 1, PRICE_MAX) };
  if (k === 'raise_percent') return { kind: 'shift', value: intField(v, k, 1, 500) };
  if (k === 'discount_percent') return { kind: 'shift', value: -intField(v, k, 1, 90) };
  throw bad(
    'The field price must hold exactly one of guess, set, clear, raise_percent and discount_percent.'
  );
}

/** Returns the record `guessPrice` reads of a catalog entry, from the catalog's facts. */
function catalogRecord(id, fact) {
  const eq = ['weapon', 'secondary', 'armor'].includes(fact.kind);
  return eq
    ? { id, kind: 'item', eq: { t: fact.kind, tier: fact.tier } }
    : { id, kind: fact.kind, ...(fact.tier === null ? {} : { tier: fact.tier }) };
}

async function updateListEntries(ctx, { params, body, ifMatch }) {
  const ids = idsField(body, 'ids', 1, ENTRIES_MAX);
  const quantity = intField(body, 'quantity', 1, QTY_MAX);
  const gmOnly = boolField(body, 'gm_only');
  const price = priceInput(body.price);
  if (quantity === undefined && gmOnly === undefined && price === null) {
    throw bad('Send at least one of the fields quantity, gm_only and price.');
  }
  const row = await listOrGone(ctx, params.list_id);
  if (price?.kind === 'shift') current(row, ifMatch);
  const byId = new Map(row.list_entries.map((e) => [e.id, e]));
  let guessOf = () => 0;
  if (price?.kind === 'guess') {
    const facts = await ctx.service.catalogFacts();
    const hids = [
      ...new Set(ids.map((id) => byId.get(id)?.hb_item).filter((h) => typeof h === 'string'))
    ];
    let linked = new Map();
    if (hids.length) {
      const r = await call(ctx, 'get_homebrew_items', { p_ids: hids });
      const rows = needed(r, () =>
        meError(
          422,
          'answer_too_large',
          "The entries' own items are too large to read in one call. Send fewer ids."
        )
      );
      linked = linkedRecords(Array.isArray(rows) ? rows : []);
    }
    guessOf = (e) => {
      if (e.source === 'homebrew') {
        const it = linked.get(e.hb_item);
        return it ? guessPrice(it, () => undefined) : 0;
      }
      const fact = facts.get(e.item_key);
      return fact
        ? guessPrice(catalogRecord(e.item_key, fact), () => fact.rarity ?? undefined)
        : 0;
    };
  }
  const ops = [];
  const results = ids.map((id) => {
    const e = byId.get(id);
    if (!e) return { id, result: 'gone' };
    const patch = {};
    if (quantity !== undefined) patch.quantity = quantity;
    if (gmOnly !== undefined) patch.gm_only = gmOnly;
    const priced = (e.price_coins ?? 0) > 0;
    if (price?.kind === 'set') patch.price_coins = price.value;
    if (price?.kind === 'clear' && priced) patch.price_coins = null;
    if (price?.kind === 'shift' && priced) {
      patch.price_coins = Math.min(PRICE_MAX, reprice(e.price_coins, price.value));
    }
    if (price?.kind === 'guess') {
      const v = guessOf(e);
      if (v > 0) patch.price_coins = Math.min(PRICE_MAX, v);
    }
    if (!Object.keys(patch).length) return { id, result: 'skipped' };
    ops.push({ op: 'update_entry', id, patch });
    return { id, result: ops.length - 1 };
  });
  const raw = await applyWrites(ctx, ops);
  for (const r of results)
    if (typeof r.result === 'number') r.result = outcomeOf(raw[r.result]);
  return answerList(ctx, params.list_id, 200, { results });
}

async function reorderList(ctx, { params, body }) {
  const ids = idsField(body, 'ids', 1, ENTRIES_MAX);
  const row = await listOrGone(ctx, params.list_id);
  const held = row.list_entries.map((e) => e.id);
  if (ids.length !== held.length || !ids.every((id) => held.includes(id))) {
    throw meError(
      409,
      'conflict',
      'The field ids must name every entry of the list once. The current order is in order.',
      { order: held }
    );
  }
  const [r] = await applyWrites(ctx, [{ op: 'reorder', list_id: row.id, ids }]);
  if (outcomeOf(r) !== 'ok') throw refusal(r, 'The list');
  return answerList(ctx, row.id);
}

/* ---------- the lists file ---------- */

const NAMES = { untitled: dict('ru').untitled };

/** Returns a list as the app's export reads it: entries and the records of its linked items. */
async function exportedList(ctx, row) {
  const list = toCloudList(row);
  const hids = [
    ...new Set(row.list_entries.map((e) => e.hb_item).filter((h) => typeof h === 'string'))
  ];
  if (hids.length) {
    const r = await call(ctx, 'get_homebrew_items', { p_ids: hids });
    const rows = needed(r, tooLargeList(ctx, row.id));
    const byHid = linkedRecords(Array.isArray(rows) ? rows : []);
    const linked = {};
    for (const e of row.list_entries) {
      const rec = e.hb_item ? byHid.get(e.hb_item) : undefined;
      if (rec) linked[e.item_key] = rec;
    }
    list.linked = linked;
  }
  return list;
}

async function exportLists(ctx, { query }) {
  let ids;
  if (query.ids !== undefined) {
    ids = idsField({ ids: query.ids.split(',') }, 'ids', 1, FILE_IDS_MAX);
  } else {
    const all = needed(await pg(ctx, 'GET', 'lists?select=id&order=id.asc'));
    ids = Array.isArray(all) ? all.map((l) => l.id) : [];
  }
  ids.sort();
  const { after } = pageOf({ cursor: query.cursor });
  const todo = after ? ids.filter((id) => id > after) : ids;
  const facts = await ctx.service.catalogFacts();
  const nameOf = (id) => facts.get(id)?.name.ru || facts.get(id)?.name.en || undefined;
  const now = new Date(ctx.now());
  const snapshotOf = (key, list) => list.linked?.[key] ?? null;
  const fileOf = (lists) => toBundle(lists, nameOf, NAMES.untitled, now, snapshotOf).bundle;
  const page = [];
  let next = null;
  for (const id of todo) {
    if (page.length >= FILE_PAGE_LISTS) {
      next = cursorOf(page[page.length - 1].id);
      break;
    }
    const row = await readList(ctx, id);
    if (!row) {
      if (query.ids !== undefined) throw notFound('The list');
      continue;
    }
    const list = await exportedList(ctx, row);
    const size = utf8.encode(bundleText(fileOf([...page, list]))).length;
    if (size > FILE_PAGE_MAX) {
      if (!page.length) {
        throw meError(
          422,
          'answer_too_large',
          `The list is past ${String(FILE_PAGE_MAX)} bytes as a file. Download it in the app: ${listLink(ctx, id)}`
        );
      }
      next = cursorOf(page[page.length - 1].id);
      break;
    }
    page.push(list);
  }
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-lists-file',
      version: 1,
      file: fileOf(page),
      skipped: page.map((l) => ({
        list_id: l.id,
        count: toBundle([l], nameOf, NAMES.untitled, now, snapshotOf).skipped
      })),
      next
    }
  };
}

/**
 * Returns the import's plan, every id a UUIDv5 under `importId` (CONTRACTS.md section 6,
 * "Imports"): `list:<i>`, `entry:<i>:<j>`, `copy:<key>` for a copy item, `card:<key>` for a
 * copy card and `key:<n>` behind a later variant's key. The same file and `import_id` make the
 * same ids, so `import_lists` and `import_homebrew` read a retry as one.
 */
async function planOf(lists, importId, account) {
  const ids = [];
  for (const [i, l] of lists.entries()) {
    ids.push(await uuidV5(importId, `list:${String(i)}`));
    for (let j = 0; j < l.entries.length; j++) {
      ids.push(await uuidV5(importId, `entry:${String(i)}:${String(j)}`));
    }
  }
  const variants = lists.reduce(
    (n, l) => n + l.entries.filter((e) => e.source === 'homebrew').length,
    0
  );
  const keys = [];
  for (let n = 0; n < variants; n++)
    keys.push(keyFrom(bytesOf(await uuidV5(importId, `key:${String(n)}`))));
  let at = 0;
  let k = 0;
  const plan = importPlan(lists, {
    ...account,
    newId: () => ids[at++] ?? 'pending',
    newKey: () => keys[k++] ?? keys[0]
  });
  if (plan.copies) {
    for (const item of plan.copies.items) item.id = await uuidV5(importId, `copy:${item.key}`);
    for (const card of plan.copies.cards) card.id = await uuidV5(importId, `card:${card.key}`);
  }
  return plan;
}

/** Returns whether a file's UTF-8 bytes pass `max`. */
const over = (file, max) =>
  file.length > max || (file.length * 3 > max && utf8.encode(file).length > max);

async function importFile(ctx, { body }) {
  if (typeof body.file !== 'string') {
    throw bad("The field file is required. Send the file's text as a string.");
  }
  const file = body.file;
  if (over(file, IMPORT_FILE_MAX)) {
    throw meError(
      413,
      'too_large',
      `The file is past ${String(IMPORT_FILE_MAX)} bytes. Send each list on its own, or import the file in the app.`
    );
  }
  if (file.startsWith('PK')) {
    throw bad('The file is a ZIP. Send the text of lists.json from inside it.');
  }
  let doc = null;
  try {
    doc = JSON.parse(file);
  } catch {
    /* not JSON: the lists parser says so */
  }
  if (doc !== null && typeof doc === 'object' && doc.format === HOMEBREW_FORMAT) {
    return importHomebrew(ctx, body, file);
  }
  const importId = uuidField(body, 'import_id') ?? crypto.randomUUID();
  const dryRun = boolField(body, 'dry_run') === true;
  const [facts, items, cards, held] = await Promise.all([
    ctx.service.catalogFacts(),
    pg(ctx, 'GET', 'homebrew_items?select=id,key'),
    pg(ctx, 'GET', 'homebrew_cards?select=key'),
    pg(ctx, 'GET', 'lists?select=id')
  ]);
  const keysOf = (r) => new Set((needed(r) ?? []).map((x) => x.key));
  /* A retry plans as the first attempt did: the copies this import made (each a UUIDv5 of
     `copy:<key>`) count as not held, so each entry links the same copy again. */
  const itemKeys = new Set();
  for (const x of needed(items) ?? []) {
    if (x.id !== (await uuidV5(importId, `copy:${String(x.key)}`))) itemKeys.add(x.key);
  }
  const cardKeys = keysOf(cards);
  const listIds = new Set((needed(held) ?? []).map((x) => x.id));
  const hasItem = (key) => itemKeys.has(key);
  const keyFor = (key) => ownKeyFor(ctx.user, hasItem, key);
  const parsed = parseBundle(
    file,
    (id) => facts.has(id),
    (key) => hasItem(key) || hasItem(keyFor(key))
  );
  const check = (await ctx.service.checkFile(file)).body;
  if (!parsed.ok) {
    if (parsed.reason === 'notBundle') {
      throw bad(
        'The file is neither a lists file (daggerheart-loot/lists) nor a homebrew file (daggerheart-loot/homebrew). Check it with POST /api/v1/file-checks.'
      );
    }
    if (!dryRun) {
      throw bad(
        'The file does not pass the check. Send it with dry_run: true to read the lines.'
      );
    }
    return importAnswer(importId, true, check, null, null);
  }
  const plan = await planOf(parsed.lists, importId, {
    hasItem,
    hasCard: (key) => cardKeys.has(key),
    keyFor,
    cardKeyFor: (key) => ownKeyFor(ctx.user, (x) => cardKeys.has(x), key)
  });
  const wouldCreate = {
    lists: plan.rows.filter((r) => !listIds.has(r.list.id)).length,
    entries: plan.rows.reduce((n, r) => n + r.entries.length, 0),
    copies: plan.copies?.items.length ?? 0
  };
  if (dryRun) return importAnswer(importId, true, check, wouldCreate, null);
  if (plan.copies) {
    const r = await call(ctx, 'import_homebrew', {
      p_books: plan.copies.books,
      p_cards: plan.copies.cards,
      p_items: plan.copies.items,
      p_update: false
    });
    if (!r.ok) throw importRefusal(r);
  }
  const r = await call(ctx, 'import_lists', { p_lists: plan.rows });
  if (!r.ok) throw importRefusal(r);
  return importAnswer(importId, false, check, wouldCreate, {
    lists: typeof r.value === 'number' ? r.value : 0
  });
}

function importRefusal(r) {
  const { code, message } = r.error ?? {};
  if (code === 'P0001' && /^limit: /.test(String(message))) return limitReached(message);
  if (code === '42501') {
    return meError(
      409,
      'conflict',
      'An id of the import belongs to another account. Send a new import_id.'
    );
  }
  if (r.status >= 500 || r.big) return unavailable();
  return meError(409, 'conflict', 'The account refused the import.');
}

function importAnswer(importId, dryRun, check, wouldCreate, created) {
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-import',
      version: 1,
      import_id: importId,
      dry_run: dryRun,
      check,
      would_create: wouldCreate,
      would_overwrite: wouldCreate ? 0 : null,
      created
    }
  };
}

/* ---------- share links and copies ---------- */

async function readShares(ctx, id) {
  const rows = needed(
    await pg(ctx, 'GET', `lists?id=eq.${id}&select=${SHARE_SELECT}`),
    tooLargeList(ctx, id)
  );
  if (!Array.isArray(rows) || !rows[0]) throw notFound('The list');
  return rows[0];
}

/** Returns a share link as the share panel copies it: `v` is what the audience's card draws. */
function shareOfRow(ctx, row, s) {
  const entries = row.list_entries ?? [];
  const n = s.audience === 'gm' ? entries.length : entries.filter((e) => !e.gm_only).length;
  const v = cardVersion([row.name, row.player_note ?? '', n]);
  return {
    id: s.id,
    audience: s.audience,
    created_at: s.created_at,
    revoked_at: s.revoked_at ?? null,
    link: appUrl(siteOf(ctx), shareHash(s.token), 'ru', v),
    link_en: appUrl(siteOf(ctx), shareHash(s.token), 'en', v)
  };
}

const sharesOf = (ctx, row) =>
  [...(row.list_shares ?? [])]
    .sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0))
    .map((s) => shareOfRow(ctx, row, s));

async function listShareLinks(ctx, { params }) {
  const row = await readShares(ctx, params.list_id);
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-share-links',
      version: 1,
      list_id: params.list_id,
      shares: sharesOf(ctx, row)
    }
  };
}

async function createShareLink(ctx, { params, body }) {
  if (!AUDIENCES.includes(body.audience)) {
    throw bad('The field audience must be one of: player, gm.');
  }
  const replaces = uuidField(body, 'replaces');
  const before = await readShares(ctx, params.list_id);
  const shares = before.list_shares ?? [];
  if (replaces !== undefined) {
    const old = shares.find((s) => s.id === replaces);
    if (!old) throw notFound('The share link');
    /* A stop cannot be undone: the other audience's link is never stopped by mistake. */
    if (old.audience !== body.audience) {
      throw bad('The field replaces names a link of the other audience. Send its audience.');
    }
    if (old.revoked_at === null || old.revoked_at === undefined) {
      const r = await call(ctx, 'revoke_list_share', { p_share: replaces });
      if (!r.ok) throw unavailable();
    }
  }
  const active = shares.find(
    (s) => s.audience === body.audience && !s.revoked_at && s.id !== replaces
  );
  const r = await call(ctx, 'create_list_share', {
    p_list: params.list_id,
    p_audience: body.audience
  });
  if (!r.ok) throw r.error?.code === '42501' ? notFound('The list') : unavailable();
  const made = Array.isArray(r.value) ? r.value[0] : null;
  if (!made || typeof made.id !== 'string') throw unavailable();
  const after = await readShares(ctx, params.list_id);
  const share = (after.list_shares ?? []).find((s) => s.id === made.id);
  if (!share) throw unavailable();
  return {
    status: active && active.id === made.id ? 200 : 201,
    body: {
      format: 'daggerheart-loot/api-my-share-link',
      version: 1,
      list_id: params.list_id,
      ...shareOfRow(ctx, after, share)
    }
  };
}

async function revokeShareLink(ctx, { params }) {
  const r = await call(ctx, 'revoke_list_share', { p_share: params.share_id });
  if (!r.ok) throw r.error?.code === '42501' ? notFound('The share link') : unavailable();
  return { status: 204 };
}

async function saveSharedList(ctx, { body }) {
  if (typeof body.token !== 'string' || !TOKEN.test(body.token)) {
    throw bad('The field token must be the 43-character token of a share link.');
  }
  const id = uuidField(body, 'id') ?? crypto.randomUUID();
  const held = needed(await pg(ctx, 'GET', `lists?id=eq.${id}&select=id`));
  if (Array.isArray(held) && held.length) return answerList(ctx, id, 200);
  const r = await call(ctx, 'clone_shared_list', { p_token: body.token, p_id: id });
  if (!r.ok) {
    const { code, message } = r.error ?? {};
    if (code === '22023') throw notFound('The shared list');
    if (code === '42501') {
      throw meError(409, 'conflict', 'The id belongs to another account. Send a new uuid.');
    }
    if (code === 'P0001' && /^limit: /.test(String(message))) throw limitReached(message);
    throw unavailable();
  }
  return answerList(ctx, id, 201);
}

/** The list operations by operationId (openapi.json). */
export const LIST_OPS = {
  listMyLists,
  createList,
  getMyList,
  updateList,
  deleteList,
  deleteLists,
  addToList,
  updateListEntries,
  removeFromList,
  updateListEntry,
  removeListEntry,
  reorderList,
  exportLists,
  importFile,
  listShareLinks,
  createShareLink,
  revokeShareLink,
  saveSharedList
};
