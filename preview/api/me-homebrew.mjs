/*
  The account API's homebrew operations (docs/specs/CONTRACTS.md section 6, "Account API"):
  the reader's own items, sources and cards, the items' pictures, a copy into own items, the
  homebrew file out and in. Every write is a call the app makes: a table write under row level
  security (a create by a client-made id that ignores a duplicate, an update by revision with
  the read-back rule of `homebrewUpdate`, a delete by id), `move_homebrew_items`,
  `delete_homebrew_items`, `import_homebrew`, the picture uploads and one `apply_list_writes`
  call of `relink` ops. Every shape is checked and built by the app's own modules
  (`lib/homebrew.ts`, `lib/homebrewForm.ts`, `lib/homebrewFile.ts`, `lib/art.ts`).

  An operation takes `(ctx, input)` as in me-lists.mjs; `input` also holds `ifNoneMatch`
  (`If-None-Match: *` sent) and `files` (the two parts of a picture upload).
*/
import { isArtName, isOwnArt, newArtName, thumbOf } from '../../app/src/lib/art.ts';
import { itemOf } from '../../app/src/lib/cloudLists.ts';
import { dict } from '../../app/src/lib/dict.ts';
import { appUrl, itemHash } from '../../app/src/lib/hash.ts';
import {
  BOOK_NAME_MAX,
  CARD_ITEMS_MAX,
  HOME_NAMES,
  HOMEBREW_KEY,
  REFS_MAX,
  SECTIONS_MAX,
  bookProblems,
  canonJson,
  cardProblems,
  contentProblems,
  copyRows,
  hasName,
  isHomebrewKey,
  keyFrom,
  nameTaken,
  ownKeyFor
} from '../../app/src/lib/homebrew.ts';
import { cardProblemText, problemText } from '../../app/src/lib/homebrewForm.ts';
import {
  defaultTarget,
  deriveFile,
  heldOf,
  homebrewText,
  newItemCount,
  parseHomebrew,
  planOf,
  rowsOf,
  subsetOf,
  toHomebrewFile,
  toHomebrewRows
} from '../../app/src/lib/homebrewFile.ts';
import {
  UUID,
  applyWrites,
  bad,
  boolField,
  bytesOf,
  call,
  confirmed,
  cursorOf,
  idsField,
  limitReached,
  meError,
  needed,
  notFound,
  outcomeOf,
  pageOf,
  pg,
  preconditionFailed,
  preconditionRequired,
  readArt,
  unavailable,
  uploadArt,
  uuidField,
  uuidV5,
  webpSize
} from './me.mjs';
import { ApiError } from './service.mjs';

/** The most ids one bulk call takes: the account's item limit. */
const ITEMS_MAX = 100;
/** The most ids a heads read takes with `ids` (each adds its record). */
const RECORD_IDS_MAX = 10;
/** The most catalog records one rule card write adds: each one's rule cards are read. */
const REF_ADDS_MAX = 10;
/** A homebrew file page holds whole items up to this many bytes (a cap may rise, never fall). */
export const HOMEBREW_PAGE_MAX = 32768;
/** The items a file page reads in one call. */
const FILE_BATCH = 8;
/** The most item reads of one file page: with the three account reads, 15 subrequests. */
const FILE_READS_MAX = 12;
/** The most bytes of the account rows an import or a copy plans over. */
const CONTEXT_MAX = 262144;
const RECORD_ID = /^[A-Za-z0-9_-]{1,64}$/;
const PICTURE_SIDES = { full: 640, thumb: 160 };

const ITEM_SELECT = 'id,key,book_id,content,art,revision,created_at,updated_at';
const ITEM_HEAD = 'id,key,revision,updated_at';
const BOOK_SELECT = 'id,key,content,revision,created_at,updated_at';
const CARD_SELECT = 'id,key,kind,book_id,content,revision,created_at,updated_at';
/* What an import, a copy and a line check read of every own item: its names and stat block. */
const ITEM_CONTEXT =
  'id,key,book_id,created_at,revision,en:content->>en,ru:content->>ru,eq:content->eq';
/* What a card save and a card member change read of the other cards: names and members. */
const CARD_CONTEXT =
  'id,key,kind,book_id,revision,en:content->>en,ru:content->>ru,items:content->items';
/* What a source save reads of the other sources: their names. */
const BOOK_CONTEXT = 'id,en:content->>en,ru:content->>ru';

/** Returns a row of a JSON-path select with `content` rebuilt from the aliases it holds. */
function withContent(row, fields) {
  const content = {};
  for (const f of fields) if (row[f] !== null && row[f] !== undefined) content[f] = row[f];
  return { ...row, content };
}

/** Returns the 422 of an account read past its cap: the app reads it, the API cannot. */
const contextTooLarge = (ctx, what) => () =>
  meError(
    422,
    'answer_too_large',
    `The account's ${what} are too large for the API. Do this in the app: ${ctx.site}homebrew`
  );

const LANGS = /** @type {const} */ (['ru', 'en']);
const TEXTS = { ru: dict('ru'), en: dict('en') };
const siteOf = (ctx) => ({ base: ctx.site });

/** Returns the key an item, a source or a card of a client-made id takes: the last 10 bytes of
 *  the id (74 random bits of a v4 uuid), so a retry with the same id makes the same key. */
export const keyOfId = (id) => keyFrom(bytesOf(id).slice(6));

/** Returns an item's link as the app copies it, without the card version a head cannot know. */
const itemLink = (ctx, id, lang = 'ru') => appUrl(siteOf(ctx), itemHash(id), lang);

const pair = (text) => ({ ru: text(TEXTS.ru), en: text(TEXTS.en) });

/** Returns the 422 of content the app's checks refuse: each problem's field, rule and the
 *  editor's own line in both languages. */
function invalid(problems, text) {
  return meError(
    422,
    'invalid_content',
    "The content does not pass the app's checks; nothing is written. Each problem names its field and the app's line.",
    {
      problems: problems.map((p) => ({
        path: p.path,
        rule: p.rule,
        text: pair((t) => text(p, t))
      }))
    }
  );
}

/** Returns a checked object field. */
function objectField(body, name) {
  const v = body[name];
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    throw bad(`The field ${name} must be an object.`);
  }
  return v;
}

/** Returns a nullable uuid field (null when absent or null). */
function refField(body, name) {
  return body[name] === undefined || body[name] === null ? null : uuidField(body, name);
}

/** Returns a key field of an `hb_` key's shape, or undefined. */
function keyField(body, name) {
  const v = body[name];
  if (v === undefined) return undefined;
  if (typeof v !== 'string' || !HOMEBREW_KEY.test(v)) {
    throw bad(`The field ${name} must be a key: hb_ and 16 characters a-z or 2-7.`);
  }
  return v;
}

/** Returns what a save asks for: `create` (`If-None-Match: *`), `replace` (`If-Match: "<rev>"`)
 *  or `overwrite` (`If-Match: *`, or `overwrite: true` from MCP); none of them is 428. */
function modeOf(ifMatch, ifNoneMatch, body) {
  if (body.overwrite !== undefined && typeof body.overwrite !== 'boolean') {
    throw bad('The field overwrite must be true or false.');
  }
  if (body.overwrite === true && ifMatch !== null && ifMatch !== '*') {
    throw bad('Send rev or overwrite, not both.');
  }
  if (ifMatch === '*' || body.overwrite === true) return 'overwrite';
  if (ifMatch !== null) return 'replace';
  if (ifNoneMatch) return 'create';
  throw meError(
    428,
    'precondition_required',
    'Send If-None-Match: * to create, If-Match: "<rev>" to replace that revision, or If-Match: * to write over any revision.'
  );
}

/* ---------- reads ---------- */

async function rowOf(ctx, table, select, id) {
  const rows = needed(await pg(ctx, 'GET', `${table}?id=eq.${id}&select=${select}`));
  if (!Array.isArray(rows)) throw unavailable();
  return rows[0] ?? null;
}

const readItem = (ctx, id) => rowOf(ctx, 'homebrew_items', ITEM_SELECT, id);
const readBook = (ctx, id) => rowOf(ctx, 'homebrew_books', BOOK_SELECT, id);
const readCard = (ctx, id) => rowOf(ctx, 'homebrew_cards', CARD_SELECT, id);

/** Returns the `api-my-item` answer of an item row: the record `GET
 *  /api/v1/homebrew-items/{uuid}` answers, built from `get_homebrew_item` with the reader's
 *  token. `saved`: a write came before, so a 422 says that the change is saved. */
async function itemAnswer(ctx, row, status = 200, extra = {}, saved = true) {
  const value = needed(await call(ctx, 'get_homebrew_item', { p_id: row.id }), () =>
    meError(
      422,
      'answer_too_large',
      `${saved ? 'The change is saved, but the item' : 'The item'} is too large for the API. Open it in the app: ${itemLink(ctx, row.id)}`
    )
  );
  if (value === null) throw notFound('The homebrew item');
  const record = await ctx.service.homebrewRecord(value);
  return {
    status,
    etag: String(row.revision),
    body: {
      format: 'daggerheart-loot/api-my-item',
      version: 1,
      id: row.id,
      key: row.key,
      rev: String(row.revision),
      updated_at: row.updated_at,
      link: record.link.ru,
      link_en: record.link.en,
      book: row.book_id ?? null,
      art: row.art ?? null,
      content: row.content,
      record,
      ...extra
    }
  };
}

/** Returns the head of a source or a card row (`api-my-source`, `api-my-card`). */
function headAnswer(format, row, status = 200, extra = {}) {
  const card = format === 'daggerheart-loot/api-my-card';
  return {
    status,
    etag: String(row.revision),
    body: {
      format,
      version: 1,
      id: row.id,
      key: row.key,
      ...(card ? { kind: row.kind, book: row.book_id ?? null } : {}),
      rev: String(row.revision),
      updated_at: row.updated_at,
      content: row.content,
      ...extra
    }
  };
}

const tooLargePage = (what) => () =>
  meError(
    422,
    'answer_too_large',
    `The page of ${what} is too large for the API. Send a smaller limit.`
  );

/** Reads one page of an own table in id order and the limit `key` of `rpc/my_limit`. */
async function pageRead(ctx, query, table, select, key, what) {
  const { limit, after } = pageOf(query);
  const [rows, max] = await Promise.all([
    pg(
      ctx,
      'GET',
      `${table}?select=${select}&order=id.asc&limit=${String(limit + 1)}` +
        (after ? `&id=gt.${after}` : '')
    ),
    call(ctx, 'my_limit', { p_key: key })
  ]);
  const all = needed(rows, tooLargePage(what));
  if (!Array.isArray(all) || !max.ok) throw unavailable();
  const page = all.slice(0, limit);
  return {
    page,
    limit: typeof max.value === 'number' ? max.value : null,
    next: all.length > limit ? cursorOf(page[page.length - 1].id) : null
  };
}

const itemHead = (ctx, r) => ({
  id: r.id,
  key: r.key,
  rev: String(r.revision),
  updated_at: r.updated_at,
  link: itemLink(ctx, r.id),
  link_en: itemLink(ctx, r.id, 'en')
});

async function listMyHomebrewItems(ctx, { query }) {
  if (query.ids !== undefined) {
    const ids = idsField({ ids: query.ids.split(',') }, 'ids', 1, RECORD_IDS_MAX).sort();
    const [heads, linked, max] = await Promise.all([
      pg(
        ctx,
        'GET',
        `homebrew_items?id=in.(${ids.join(',')})&select=${ITEM_HEAD}&order=id.asc`
      ),
      call(ctx, 'get_homebrew_items', { p_ids: ids }),
      call(ctx, 'my_limit', { p_key: 'homebrew_items_per_owner' })
    ]);
    const rows = needed(heads);
    if (!Array.isArray(rows) || !max.ok) throw unavailable();
    if (rows.length !== ids.length) {
      throw bad('The field ids names an id that is not one of your items.');
    }
    const records = await ctx.service.linkedApiRecords(
      needed(linked, () =>
        meError(
          422,
          'answer_too_large',
          'The records are too large to read in one call. Send fewer ids.'
        )
      )
    );
    return {
      status: 200,
      body: {
        format: 'daggerheart-loot/api-my-homebrew-items',
        version: 1,
        items: rows.map((r) => itemHead(ctx, r)),
        records: ids.flatMap((id) => (records.has(id) ? [records.get(id)] : [])),
        limits: { items: typeof max.value === 'number' ? max.value : null },
        next: null
      }
    };
  }
  const { page, limit, next } = await pageRead(
    ctx,
    query,
    'homebrew_items',
    ITEM_HEAD,
    'homebrew_items_per_owner',
    'items'
  );
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-homebrew-items',
      version: 1,
      items: page.map((r) => itemHead(ctx, r)),
      limits: { items: limit },
      next
    }
  };
}

async function getMyHomebrewItem(ctx, { params }) {
  const row = await readItem(ctx, params.item_id);
  if (!row) throw notFound('The homebrew item');
  return itemAnswer(ctx, row, 200, {}, false);
}

/* ---------- writes by id and revision ---------- */

/** Returns the error of a refused table write: a limit, a key the account holds, a check the
 *  database refuses, else 503. */
function writeRefusal(r, what) {
  const { code, message } = r.error ?? {};
  if (code === 'P0001' && /^limit: /.test(String(message))) return limitReached(message);
  if (code === 'P0001' && /art missing/.test(String(message))) {
    return meError(409, 'conflict', 'The picture is gone. Choose another picture.');
  }
  if (code === '23505') {
    return meError(409, 'conflict', `${what} of this key exists. Send another key.`);
  }
  if (code === '23514' || code === '22023' || code === '23503') {
    return meError(
      422,
      'invalid_content',
      `The account refused ${what.toLowerCase()} as written. Check it with the app.`
    );
  }
  return unavailable();
}

/**
 * Creates a row by its client-made id, as the app's `homebrewCreate` (`upsert` that ignores a
 * duplicate): 201 with the row; the same id again 200 when the row equals the sent one, 412
 * with its rev when it does not; an id of another account 409.
 */
async function createRow(ctx, table, select, row, same, what) {
  const r = await pg(ctx, 'POST', `${table}?on_conflict=id&select=${select}`, {
    body: row,
    prefer: 'resolution=ignore-duplicates,return=representation'
  });
  if (!r.ok) throw writeRefusal(r, what);
  if (Array.isArray(r.value) && r.value[0]) return { status: 201, row: r.value[0] };
  const held = await rowOf(ctx, table, select, row.id);
  if (!held)
    throw meError(409, 'conflict', 'The id belongs to another account. Send a new uuid.');
  if (!same(held)) throw preconditionFailed(held.revision);
  return { status: 200, row: held };
}

/**
 * Writes `patch` over the row at revision `rev` (null: whatever revision it holds), with the
 * read-back rule of the app's `homebrewUpdate`: no row at the revision is a gone row (404), a
 * newer one (412 with its rev), or this write sent again after its answer was lost (done).
 * Returns the row's new revision.
 */
async function updateRow(ctx, table, id, patch, rev, what) {
  const r = await pg(
    ctx,
    'PATCH',
    `${table}?id=eq.${id}${rev === null ? '' : `&revision=eq.${rev}`}&select=revision`,
    { body: patch, prefer: 'return=representation' }
  );
  if (!r.ok) throw writeRefusal(r, what);
  if (Array.isArray(r.value) && r.value[0]) return r.value[0].revision;
  const held = await rowOf(ctx, table, ['revision', ...Object.keys(patch)].join(','), id);
  if (!held) throw notFound(what);
  if (Object.keys(patch).every((k) => canonJson(held[k]) === canonJson(patch[k]))) {
    return held.revision;
  }
  throw preconditionFailed(held.revision);
}

/** Deletes a row by revision: 428 without one, 204 when deleted or gone, 412 when moved. */
async function deleteRow(ctx, table, id, ifMatch) {
  if (ifMatch === null) throw preconditionRequired();
  const r = await pg(ctx, 'DELETE', `${table}?id=eq.${id}&revision=eq.${ifMatch}&select=id`, {
    prefer: 'return=representation'
  });
  const gone = needed(r);
  if (Array.isArray(gone) && gone.length) return { status: 204 };
  const now = await rowOf(ctx, table, 'revision', id);
  if (now) throw preconditionFailed(now.revision);
  return { status: 204 };
}

/* ---------- items ---------- */

/**
 * Returns the problems the app's editor refuses in an item save: `contentProblems`, then the
 * editor-level checks of `formProblems` that need no draft - a source the account does not
 * hold, a section its source does not hold, and an upgrade line whose rungs are another
 * equipment type (the catalog line's members and the own items on it). A section the held row
 * already stores passes: a section delete and a source delete leave it, and the app draws it as
 * no section (`held`, the stored content; none on a create).
 */
async function itemProblems(ctx, content, key, bookId, selfId, held = null) {
  const out = contentProblems(content, key);
  if (out.length) return out;
  let book = null;
  if (bookId !== null) {
    book = await rowOf(ctx, 'homebrew_books', 'id,content', bookId);
    if (!book) out.push({ path: 'book', rule: 'gone' });
  }
  const section = content.section;
  if (section !== undefined && section !== held?.section) {
    if (
      bookId === null ||
      (book && !(book.content.sections ?? []).some((s) => s.key === section))
    ) {
      out.push({ path: 'section', rule: 'enum' });
    }
  }
  const line = content.kind === 'equip' ? content.eq?.line : undefined;
  if (typeof line === 'string' && line !== key) {
    const [catalog, own] = await Promise.all([
      ctx.service.catalogContext(),
      pg(
        ctx,
        'GET',
        `homebrew_items?select=id,key,eq:content->eq&or=(key.eq.${line},content->eq->>line.eq.${line})`
      )
    ]);
    const rows = needed(own);
    const types = [
      ...catalog.lineMembers(line).map((m) => m.t),
      ...(Array.isArray(rows) ? rows : [])
        .filter((r) => r.id !== selfId && typeof r.eq?.t === 'string')
        .map((r) => r.eq.t)
    ];
    if (types.some((t) => t !== content.eq.t)) out.push({ path: 'eq.line', rule: 'enum' });
  }
  return out;
}

/**
 * Creates an own item from a client-made id (`createRow`), after the app's checks; the picture
 * is never written here. Used by the item save and by «Свой предмет» on a list.
 */
export async function createItemRow(ctx, { id, key, book, content }) {
  const problems = await itemProblems(ctx, content, key, book, id);
  if (problems.length) throw invalid(problems, problemText);
  return createRow(
    ctx,
    'homebrew_items',
    ITEM_SELECT,
    { id, key, book_id: book, content },
    (held) =>
      held.key === key &&
      (held.book_id ?? null) === book &&
      canonJson(held.content) === canonJson(content),
    'The item'
  );
}

async function saveHomebrewItem(ctx, { params, body, ifMatch, ifNoneMatch }) {
  const id = params.item_id;
  const mode = modeOf(ifMatch, ifNoneMatch, body);
  const content = objectField(body, 'content');
  const book = refField(body, 'book');
  const asked = keyField(body, 'key');
  if (mode === 'create') {
    const made = await createItemRow(ctx, { id, key: asked ?? keyOfId(id), book, content });
    return itemAnswer(ctx, made.row, made.status);
  }
  const row = await readItem(ctx, id);
  if (!row) throw notFound('The homebrew item');
  if (asked !== undefined && asked !== row.key) {
    throw bad("The field key never changes. Send the item's key or leave it out.");
  }
  const problems = await itemProblems(ctx, content, row.key, book, id, row.content);
  if (problems.length) throw invalid(problems, problemText);
  await updateRow(
    ctx,
    'homebrew_items',
    id,
    { content, book_id: book },
    mode === 'replace' ? ifMatch : null,
    'The homebrew item'
  );
  return itemAnswer(ctx, (await readItem(ctx, id)) ?? row);
}

async function deleteHomebrewItem(ctx, { params, ifMatch }) {
  return deleteRow(ctx, 'homebrew_items', params.item_id, ifMatch);
}

async function deleteHomebrewItems(ctx, { body }) {
  const ids = idsField(body, 'ids', 1, ITEMS_MAX);
  confirmed(body, ids.length);
  /* Every item or none, as the items tab's request; an item already gone deletes nothing. */
  const r = await call(ctx, 'delete_homebrew_items', { p_ids: ids });
  if (!r.ok) throw unavailable();
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-results',
      version: 1,
      results: ids.map((id) => ({ id, result: 'ok' }))
    }
  };
}

async function moveHomebrewItems(ctx, { body }) {
  const items = (() => {
    const v = body.items;
    if (!Array.isArray(v) || v.length < 1 || v.length > ITEMS_MAX) {
      throw bad(`The field items must be a list of 1 to ${String(ITEMS_MAX)} items.`);
    }
    return v.map((x) => {
      if (x === null || typeof x !== 'object' || Array.isArray(x)) {
        throw bad('Each item of the field items must be an object { id, rev }.');
      }
      if (typeof x.rev !== 'string' || !/^[0-9]{1,19}$/.test(x.rev)) {
        throw bad('Each item of the field items needs the rev that an answer gave.');
      }
      return { id: uuidField(x, 'id', true), revision: Number(x.rev) };
    });
  })();
  if (new Set(items.map((x) => x.id)).size !== items.length) {
    throw bad('The field items names an item twice.');
  }
  const source = refField(body, 'source');
  const section =
    body.section === undefined || body.section === null ? null : keyField(body, 'section');
  if (section !== null && source === null) {
    throw bad('A section needs its source. Send source with section.');
  }
  const r = await call(ctx, 'move_homebrew_items', {
    p_items: items,
    p_book: source,
    p_section: section
  });
  if (!r.ok) {
    const { code, message } = r.error ?? {};
    if (String(message).startsWith('move_homebrew_items: conflict')) {
      throw meError(
        412,
        'precondition_failed',
        'An item changed or is gone since the rev you sent; nothing moved. Read the heads again, then send the move.'
      );
    }
    if (code === 'P0002') throw notFound('The source or its section');
    throw unavailable();
  }
  const ids = items.map((x) => x.id).sort();
  const heads = needed(
    await pg(ctx, 'GET', `homebrew_items?id=in.(${ids.join(',')})&select=id,revision`)
  );
  const revs = new Map(
    (Array.isArray(heads) ? heads : []).map((h) => [h.id, String(h.revision)])
  );
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-results',
      version: 1,
      results: items.map((x) => ({ id: x.id, result: 'ok', rev: revs.get(x.id) ?? null }))
    }
  };
}

/* ---------- pictures ---------- */

/** Returns the picture name `{ from }` reuses: an own item's picture, or a catalog record's. */
async function pictureOf(ctx, from, selfId) {
  if (typeof from !== 'string' || from === '') {
    throw bad('The field from must be a catalog record id or one of your item ids.');
  }
  if (UUID.test(from.toLowerCase())) {
    if (from.toLowerCase() === selfId) throw bad('The field from names this item.');
    const row = await rowOf(ctx, 'homebrew_items', 'id,art', from.toLowerCase());
    if (!row) throw notFound('The item of from');
    if (!row.art) throw bad('The item of from has no picture.');
    return row.art;
  }
  if (!RECORD_ID.test(from)) {
    throw bad('The field from must be a catalog record id or one of your item ids.');
  }
  const { body } = await ctx.service.getRecord(from);
  const full = body?.image?.full;
  const name = typeof full === 'string' ? full.slice(full.lastIndexOf('/') + 1) : '';
  if (!isArtName(name) || isOwnArt(name)) throw bad('The record of from has no picture.');
  return name;
}

async function setItemPicture(ctx, { params, body, files }) {
  const id = params.item_id;
  const row = await readItem(ctx, id);
  if (!row) throw notFound('The homebrew item');
  let name;
  if (files) {
    for (const part of ['full', 'thumb']) {
      const size = webpSize(files[part]);
      if (!size) throw bad(`The part ${part} is not a WebP file.`);
      const side = PICTURE_SIDES[part];
      if (size.width !== side || size.height !== side) {
        throw bad(
          `The part ${part} must be ${String(side)} x ${String(side)} pixels, as the app crops it.`
        );
      }
    }
    name = newArtName('webp', crypto.randomUUID());
    await uploadArt(ctx, name, files.full);
    await uploadArt(ctx, thumbOf(name), files.thumb);
  } else {
    name = await pictureOf(ctx, body.from, id);
  }
  await updateRow(ctx, 'homebrew_items', id, { art: name }, null, 'The homebrew item');
  return itemAnswer(ctx, (await readItem(ctx, id)) ?? row);
}

async function clearItemPicture(ctx, { params }) {
  const id = params.item_id;
  const row = await readItem(ctx, id);
  if (!row) throw notFound('The homebrew item');
  /* A picture no item names any more is deleted by the database. */
  if (row.art)
    await updateRow(ctx, 'homebrew_items', id, { art: null }, null, 'The homebrew item');
  return itemAnswer(ctx, (await readItem(ctx, id)) ?? row);
}

/* ---------- a copy into own items ---------- */

const damageOf = (d) => (d ? d.dice + (d.bonus ? '+' + String(d.bonus) : '') : undefined);

/** Returns the catalog record a neutral record describes, in the fields `copyContentOf` reads.
 *  Each name and text is the record's as the API answers it, an empty language filled. */
function catalogRecordOf(api) {
  const s = api.stats;
  const drop = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null));
  const full = api.image?.full;
  return drop({
    id: api.key,
    src: api.source.id,
    kind: s ? 'item' : api.kind,
    en: api.name.en,
    ru: api.name.ru,
    ende: api.text.en,
    rud: api.text.ru,
    tier: s ? undefined : (api.tier ?? undefined),
    eq: s
      ? drop({
          t: s.type,
          tier: s.tier,
          cls: s.class,
          tr: s.trait,
          rg: s.range,
          dmg: damageOf(s.damage),
          dt: s.damage?.type,
          bu: s.burden,
          as: s.armor_score,
          th: s.thresholds ? [s.thresholds.major, s.thresholds.severe] : undefined,
          alt: s.alt
            ? drop({
                tr: s.alt.trait,
                rg: s.alt.range,
                dmg: damageOf(s.alt.damage),
                dt: s.alt.damage?.type
              })
            : undefined,
          line: s.line
        })
      : undefined,
    craft: api.craft.into.length ? api.craft.into : undefined,
    refs: api.refs.length ? api.refs.map((r) => r.key) : undefined,
    img: typeof full === 'string' ? full.slice(full.lastIndexOf('/') + 1) : undefined
  });
}

/** Copies an own picture file of another account under a new name of the reader's, or null. */
async function copiedArt(ctx, img) {
  const [full, thumb] = await Promise.all([readArt(ctx, img), readArt(ctx, thumbOf(img))]);
  if (!full || !thumb) return null;
  const name = newArtName(img.endsWith('.jpg') ? 'jpg' : 'webp', crypto.randomUUID());
  try {
    await uploadArt(ctx, name, full);
    await uploadArt(ctx, thumbOf(name), thumb);
  } catch {
    return null;
  }
  return name;
}

/**
 * «Сохранить себе» (`app.saveItem`): one own item in the default source from a catalog record
 * or another account's item, its picture copied, and in one `apply_list_writes` call a
 * `relink` of each own list row that links the other account's item. The copy's id makes its
 * key and its card ids, so a retry with the same id converges on the one copy.
 */
async function saveItemCopy(ctx, { body }) {
  const from = body.from;
  const id = uuidField(body, 'id') ?? crypto.randomUUID();
  const key = keyOfId(id);
  let source;
  let hid = null;
  let craftFrom = [];
  if (typeof from === 'string' && UUID.test(from.toLowerCase())) {
    hid = from.toLowerCase();
    const value = needed(await call(ctx, 'get_homebrew_item', { p_id: hid }));
    const item = value === null ? null : itemOf(value);
    if (!item) throw notFound('The homebrew item of from');
    if (item.mine) throw meError(409, 'conflict', 'The item of from is already yours.');
    source = item.record;
  } else if (typeof from === 'string' && RECORD_ID.test(from)) {
    const api = (await ctx.service.getRecord(from)).body;
    source = catalogRecordOf(api);
    craftFrom = api.craft.from;
  } else {
    throw bad("The field from must be a catalog record id or another account's item id.");
  }
  let row = await readItem(ctx, id);
  const made = !row;
  const tooLarge = contextTooLarge(ctx, 'items or cards');
  const [items, cards] = await Promise.all([
    made
      ? pg(ctx, 'GET', 'homebrew_items?select=key,en:content->>en,ru:content->>ru', {
          max: CONTEXT_MAX
        })
      : null,
    pg(ctx, 'GET', 'homebrew_cards?select=key', { max: CONTEXT_MAX })
  ]);
  const own = items ? (needed(items, tooLarge) ?? []) : [];
  const cardKeys = new Set((needed(cards, tooLarge) ?? []).map((c) => c.key));
  const ids = [];
  for (let n = 0; n < 4; n++) ids.push(await uuidV5(id, `card:${String(n)}`));
  let at = 0;
  const rows = copyRows(
    source,
    key,
    {
      newId: () => ids[at++] ?? id,
      cardKeyFor: (k) => ownKeyFor(ctx.user, (x) => cardKeys.has(x), k),
      hasCard: (k) => cardKeys.has(k),
      names: {
        en: new Set(own.map((r) => r.en || r.ru || '')),
        ru: new Set(own.map((r) => r.ru || r.en || ''))
      }
    },
    craftFrom
  );
  rows.items[0].id = id;
  const foreignId = () =>
    meError(409, 'conflict', 'The id belongs to another account. Send a new uuid.');
  if (!made) {
    /* A held row is this copy's retry only when it holds the copy's content; the names may
       differ (a number against the own names, or a rename since). */
    const unnamed = ({ en: _en, ru: _ru, ...rest }) => rest;
    if (canonJson(unnamed(row.content)) !== canonJson(unnamed(rows.items[0].content))) {
      throw meError(409, 'conflict', 'The id names another own item. Send a new uuid.');
    }
  } else {
    const r = await call(ctx, 'import_homebrew', {
      p_books: rows.books,
      p_cards: rows.cards,
      p_items: rows.items,
      p_update: false
    });
    if (!r.ok && r.error?.code === '23505' && /_pkey/.test(String(r.error.message))) {
      throw foreignId();
    }
    if (!r.ok) throw writeRefusal(r, 'The copy');
    row = await readItem(ctx, id);
    if (!row) throw foreignId();
  }
  /* The picture before the relink, as the app: a request cut in the middle leaves the rows on
     the other account's item. A copy that holds a picture keeps it. */
  let picture = row.art ? 'kept' : 'none';
  const img = isArtName(source.img) ? source.img : null;
  if (img && !row.art) {
    const name = isOwnArt(img) ? await copiedArt(ctx, img) : img;
    picture = 'failed';
    if (name) {
      const r = await pg(
        ctx,
        'PATCH',
        `homebrew_items?id=eq.${id}&art=is.null&select=revision`,
        { body: { art: name }, prefer: 'return=representation' }
      );
      if (r.ok) picture = 'copied';
    }
  }
  const relinked = [];
  if (hid !== null) {
    const entries = needed(
      await pg(
        ctx,
        'GET',
        `list_entries?select=id,list_id,item_key,hb_item&or=(hb_item.eq.${hid},item_key.eq.${key})`
      )
    );
    const rows = Array.isArray(entries) ? entries : [];
    /* A list that holds the copy already keeps its row of the other account's item. */
    const linking = rows
      .filter((e) => e.hb_item === hid)
      .filter((e) => !rows.some((x) => x.list_id === e.list_id && x.item_key === key));
    const results = await applyWrites(
      ctx,
      linking.map((e) => ({ op: 'relink', id: e.id, hb_item: id }))
    );
    linking.forEach((e, i) => {
      if (outcomeOf(results[i]) === 'ok' && !relinked.includes(e.list_id)) {
        relinked.push(e.list_id);
      }
    });
  }
  return itemAnswer(ctx, (await readItem(ctx, id)) ?? row, made ? 201 : 200, {
    picture,
    relinked: relinked.sort()
  });
}

/* ---------- sources ---------- */

async function listMyHomebrewSources(ctx, { query }) {
  const { page, limit, next } = await pageRead(
    ctx,
    query,
    'homebrew_books',
    BOOK_SELECT,
    'homebrew_books_per_owner',
    'sources'
  );
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-sources',
      version: 1,
      sources: page.map((b) => headAnswer('daggerheart-loot/api-my-source', b).body),
      limits: { sources: limit },
      next
    }
  };
}

/** Returns the line of a source problem as the sources tab writes it. */
function bookText(p, t) {
  if (p.rule === 'many') return t.hbSectionsFull.replace('%n', String(SECTIONS_MAX));
  const section = p.path.startsWith('sections.');
  if (p.rule === 'duplicate') {
    return (section ? t.hbSectionTaken : t.hbSourceTaken).replace('%s', () => p.name ?? '');
  }
  if (p.rule === 'required' || p.path === 'name') {
    return section ? t.hbErrSectionName : t.hbErrSourceName;
  }
  if (p.rule === 'long') return t.hbErrLong.replace('%n', String(BOOK_NAME_MAX));
  return t.hbErrControl;
}

/** Returns the problems of a source save: `bookProblems`, then the sources tab's own checks of
 *  each name the save writes anew - a name another source or the default source holds, and a
 *  section name another section of the source holds. */
function sourceProblems(content, row, others) {
  const out = bookProblems(content);
  if (out.length) return out;
  const names = [...others.map((b) => b.content), ...HOME_NAMES];
  for (const lang of LANGS) {
    const name = content[lang];
    if (typeof name !== 'string' || !hasName(name) || row?.content[lang] === name) continue;
    if (nameTaken(names, name)) out.push({ path: lang, rule: 'duplicate', name: name.trim() });
  }
  const sections = content.sections ?? [];
  const before = new Map((row?.content.sections ?? []).map((s) => [s.key, s]));
  sections.forEach((s, i) => {
    const rest = sections.filter((x) => x !== s);
    for (const lang of LANGS) {
      const name = s[lang];
      if (typeof name !== 'string' || !hasName(name) || before.get(s.key)?.[lang] === name) {
        continue;
      }
      if (nameTaken(rest, name)) {
        out.push({
          path: `sections.${String(i)}.${lang}`,
          rule: 'duplicate',
          name: name.trim()
        });
      }
    }
  });
  return out;
}

async function saveHomebrewSource(ctx, { params, body, ifMatch, ifNoneMatch }) {
  const id = params.source_id;
  const mode = modeOf(ifMatch, ifNoneMatch, body);
  const content = objectField(body, 'content');
  const asked = keyField(body, 'key');
  const [row, others] = await Promise.all([
    mode === 'create' ? null : readBook(ctx, id),
    pg(ctx, 'GET', `homebrew_books?select=${BOOK_CONTEXT}&id=neq.${id}`)
  ]);
  if (mode !== 'create' && !row) throw notFound('The source');
  if (row && asked !== undefined && asked !== row.key) {
    throw bad("The field key never changes. Send the source's key or leave it out.");
  }
  const held = (needed(others, contextTooLarge(ctx, 'sources')) ?? []).map((b) =>
    withContent(b, ['en', 'ru'])
  );
  const problems = sourceProblems(content, row, held);
  if (problems.length) throw invalid(problems, bookText);
  if (mode === 'create') {
    const key = asked ?? keyOfId(id);
    const made = await createRow(
      ctx,
      'homebrew_books',
      BOOK_SELECT,
      { id, key, content },
      (held) => held.key === key && canonJson(held.content) === canonJson(content),
      'The source'
    );
    return headAnswer('daggerheart-loot/api-my-source', made.row, made.status);
  }
  await updateRow(
    ctx,
    'homebrew_books',
    id,
    { content },
    mode === 'replace' ? ifMatch : null,
    'The source'
  );
  return headAnswer('daggerheart-loot/api-my-source', (await readBook(ctx, id)) ?? row);
}

async function deleteHomebrewSource(ctx, { params, ifMatch }) {
  /* The database moves the source's items and cards to the default source. */
  return deleteRow(ctx, 'homebrew_books', params.source_id, ifMatch);
}

/* ---------- cards ---------- */

async function listMyHomebrewCards(ctx, { query }) {
  const { page, limit, next } = await pageRead(
    ctx,
    query,
    'homebrew_cards',
    CARD_SELECT,
    'homebrew_cards_per_owner',
    'cards'
  );
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-my-cards',
      version: 1,
      cards: page.map((c) => headAnswer('daggerheart-loot/api-my-card', c).body),
      limits: { cards: limit },
      next
    }
  };
}

/** Returns the rule cards a catalog record draws: its own and the own rule cards that hold it
 *  in `items` (`refsOf`), the card `except` left out. */
async function refsDrawn(ctx, id, ownRefs, except) {
  /* A record the catalog does not hold draws no catalog rule card. */
  let catalog;
  try {
    catalog = (await ctx.service.getRecord(id)).body.refs.map((r) => r.key);
  } catch {
    catalog = [];
  }
  const own = ownRefs.filter((c) => c.id !== except && (c.content.items ?? []).includes(id));
  return new Set([...catalog, ...own.map((c) => c.key)]).size;
}

/** Returns the line of a card problem as the cards tab writes it. */
const cardText = (kind) => (p, t) => {
  if (p.path === 'items' && p.rule === 'many') {
    return t.hbCardItemsFull.replace('%n', String(CARD_ITEMS_MAX));
  }
  if (p.path.startsWith('items.') && p.rule === 'many') {
    return t.hbRefsFull.replace('%s', () => p.name ?? '');
  }
  return cardProblemText(kind, p, t, p.name ?? '');
};

/** Returns the problems of a card save: `cardProblems`, then the card form's own checks - a
 *  name another card of the kind holds (each language the save writes anew) and a card with no
 *  text - and, for a rule card, a catalog record it adds that draws `REFS_MAX` rule cards. */
async function cardSaveProblems(ctx, kind, content, row, others) {
  const out = cardProblems(kind, content);
  if (out.length) return out;
  const names = others.filter((c) => c.kind === kind).map((c) => c.content);
  for (const lang of LANGS) {
    const name = content[lang];
    if (typeof name !== 'string' || !hasName(name) || row?.content[lang] === name) continue;
    if (nameTaken(names, name)) out.push({ path: lang, rule: 'duplicate', name: name.trim() });
  }
  if (!hasName(content.ende ?? '') && !hasName(content.rud ?? '')) {
    out.push({ path: 'text', rule: 'required' });
  }
  if (kind === 'ref') {
    const added = (content.items ?? []).filter((x) => !(row?.content.items ?? []).includes(x));
    if (added.length > REF_ADDS_MAX) {
      throw bad(
        `A rule card write adds at most ${String(REF_ADDS_MAX)} catalog records. Send the rest in another write.`
      );
    }
    const refs = others.filter((c) => c.kind === 'ref');
    for (const x of added) {
      if ((await refsDrawn(ctx, x, refs, row?.id)) >= REFS_MAX) {
        const i = content.items.indexOf(x);
        out.push({ path: `items.${String(i)}`, rule: 'many', name: x });
      }
    }
  }
  return out;
}

async function saveHomebrewCard(ctx, { params, body, ifMatch, ifNoneMatch }) {
  const id = params.card_id;
  const mode = modeOf(ifMatch, ifNoneMatch, body);
  const content = objectField(body, 'content');
  const book = refField(body, 'book');
  const asked = keyField(body, 'key');
  const [row, others, owned] = await Promise.all([
    mode === 'create' ? null : readCard(ctx, id),
    pg(ctx, 'GET', `homebrew_cards?select=${CARD_CONTEXT}&id=neq.${id}`, { max: CONTEXT_MAX }),
    book === null ? null : rowOf(ctx, 'homebrew_books', 'id', book)
  ]);
  if (mode !== 'create' && !row) throw notFound('The card');
  const kind = body.kind ?? row?.kind;
  if (kind !== 'set' && kind !== 'ref') throw bad('The field kind must be one of: set, ref.');
  if (row && kind !== row.kind) throw bad("A card's kind never changes. Make a new card.");
  if (row && asked !== undefined && asked !== row.key) {
    throw bad("The field key never changes. Send the card's key or leave it out.");
  }
  if (book !== null && !owned) throw notFound('The source of book');
  const otherCards = (needed(others, contextTooLarge(ctx, 'cards')) ?? []).map((c) =>
    withContent(c, ['en', 'ru', 'items'])
  );
  const problems = await cardSaveProblems(ctx, kind, content, row, otherCards);
  if (problems.length) throw invalid(problems, cardText(kind));
  if (mode === 'create') {
    const key = asked ?? keyOfId(id);
    const made = await createRow(
      ctx,
      'homebrew_cards',
      CARD_SELECT,
      { id, key, kind, book_id: book, content },
      (held) =>
        held.key === key &&
        held.kind === kind &&
        (held.book_id ?? null) === book &&
        canonJson(held.content) === canonJson(content),
      'The card'
    );
    return headAnswer('daggerheart-loot/api-my-card', made.row, made.status);
  }
  await updateRow(
    ctx,
    'homebrew_cards',
    id,
    { content, book_id: book },
    mode === 'replace' ? ifMatch : null,
    'The card'
  );
  return headAnswer('daggerheart-loot/api-my-card', (await readCard(ctx, id)) ?? row);
}

async function deleteHomebrewCard(ctx, { params, ifMatch }) {
  /* Items keep the card's key; list entries do not change. */
  return deleteRow(ctx, 'homebrew_cards', params.card_id, ifMatch);
}

/* ---------- card members ---------- */

const named = (c) => c.ru || c.en || '';

/** Returns the own item `record_id` names (its uuid or its key), or null for a catalog id. */
async function memberOf(ctx, recordId) {
  if (typeof recordId !== 'string' || recordId === '') {
    throw bad('The field record_id must be a catalog record id, an own item uuid or its key.');
  }
  const own = UUID.test(recordId.toLowerCase())
    ? `id=eq.${recordId.toLowerCase()}`
    : isHomebrewKey(recordId)
      ? `key=eq.${recordId}`
      : null;
  if (own === null) {
    if (!RECORD_ID.test(recordId) || !(await ctx.service.catalogFacts()).has(recordId)) {
      throw notFound('The record');
    }
    return null;
  }
  const rows = needed(await pg(ctx, 'GET', `homebrew_items?${own}&select=${ITEM_SELECT}`));
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) throw notFound('The item');
  return row;
}

const withItem = (id) => (content) => ({
  ...content,
  items: [...(content.items ?? []).filter((x) => x !== id), id]
});
const withoutItem = (id) => (content) => {
  const out = { ...content };
  const items = (content.items ?? []).filter((x) => x !== id);
  if (items.length) out.items = items;
  else delete out.items;
  return out;
};

/** Answers a member change: the card's head and the row the call changed with its rev. */
async function memberAnswer(ctx, cardId, member) {
  const card = await readCard(ctx, cardId);
  if (!card) throw notFound('The card');
  return headAnswer('daggerheart-loot/api-my-card', card, 200, { member });
}

/**
 * A record joins a set or a rule card, as the cards tab adds it (`HomebrewCards.svelte`): an
 * own item by its `set` or `refs`, a catalog record by the card's `items`. A record another
 * own set holds is 409 `conflict` naming that set unless `move`; with it the old card is
 * written first, then this one, and a failed second write answers 503 with the first applied.
 * `If-Match` names the rev of the row the call changes.
 */
async function addCardMember(ctx, { params, body, ifMatch }) {
  const card = await readCard(ctx, params.card_id);
  if (!card) throw notFound('The card');
  const move = boolField(body, 'move') === true;
  const item = await memberOf(ctx, body.record_id);
  if (item) {
    const content = { ...item.content };
    if (card.kind === 'set') {
      if (content.set === card.key) {
        return memberAnswer(ctx, card.id, {
          record_id: item.id,
          row: 'item',
          rev: String(item.revision)
        });
      }
      if (content.set && !move) {
        throw meError(
          409,
          'conflict',
          `The item is in the set ${content.set}. Ask the reader, then send move: true to move it.`,
          { set: content.set }
        );
      }
      content.set = card.key;
    } else {
      const refs = content.refs ?? [];
      if (refs.includes(card.key)) {
        return memberAnswer(ctx, card.id, {
          record_id: item.id,
          row: 'item',
          rev: String(item.revision)
        });
      }
      if (refs.length >= REFS_MAX) {
        throw invalid([{ path: 'refs', rule: 'many', name: named(item.content) }], (p, t) =>
          t.hbRefsFull.replace('%s', () => p.name)
        );
      }
      content.refs = [...refs, card.key];
    }
    const rev = await updateRow(
      ctx,
      'homebrew_items',
      item.id,
      { content, book_id: item.book_id },
      ifMatch ?? String(item.revision),
      'The item'
    );
    return memberAnswer(ctx, card.id, { record_id: item.id, row: 'item', rev: String(rev) });
  }
  const id = body.record_id;
  if ((card.content.items ?? []).includes(id)) {
    return memberAnswer(ctx, card.id, {
      record_id: id,
      row: 'card',
      rev: String(card.revision)
    });
  }
  if ((card.content.items ?? []).length >= CARD_ITEMS_MAX) {
    throw invalid([{ path: 'items', rule: 'many' }], cardText(card.kind));
  }
  const others = (
    needed(
      await pg(ctx, 'GET', `homebrew_cards?select=${CARD_CONTEXT}&id=neq.${card.id}`, {
        max: CONTEXT_MAX
      }),
      contextTooLarge(ctx, 'cards')
    ) ?? []
  ).map((c) => withContent(c, ['en', 'ru', 'items']));
  if (card.kind === 'ref') {
    if (
      (await refsDrawn(
        ctx,
        id,
        others.filter((c) => c.kind === 'ref'),
        card.id
      )) >= REFS_MAX
    ) {
      throw invalid([{ path: 'items.0', rule: 'many', name: id }], cardText('ref'));
    }
  } else {
    /* The own set that holds the record: the lowest key, as the index's `ownSetOf`. */
    const old = others
      .filter((c) => c.kind === 'set' && (c.content.items ?? []).includes(id))
      .sort((a, b) => (a.key < b.key ? -1 : 1))[0];
    if (old && !move) {
      throw meError(
        409,
        'conflict',
        `The record is in the set ${named(old.content) || old.key}. Ask the reader, then send move: true to move it.`,
        { set: old.key }
      );
    }
    if (old) {
      /* The client's rev is checked before the first write, so a stale one writes nothing. */
      if (ifMatch !== null && ifMatch !== String(card.revision)) {
        throw preconditionFailed(card.revision);
      }
      /* The other cards were read as names and members; the write needs the whole card. */
      const full = await readCard(ctx, old.id);
      if (!full) throw unavailable();
      await updateRow(
        ctx,
        'homebrew_cards',
        old.id,
        { content: withoutItem(id)(full.content), book_id: full.book_id },
        String(full.revision),
        'The card'
      );
      try {
        const rev = await updateRow(
          ctx,
          'homebrew_cards',
          card.id,
          { content: withItem(id)(card.content), book_id: card.book_id },
          ifMatch ?? String(card.revision),
          'The card'
        );
        return memberAnswer(ctx, card.id, { record_id: id, row: 'card', rev: String(rev) });
      } catch (e) {
        /* An ended connection or a refused path keeps its status (401 is HTTP 401 on /mcp/me). */
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) throw e;
        throw meError(
          503,
          'unavailable',
          `The record left the set ${named(old.content) || old.key} but did not join this card. Send the call again.`
        );
      }
    }
  }
  const rev = await updateRow(
    ctx,
    'homebrew_cards',
    card.id,
    { content: withItem(id)(card.content), book_id: card.book_id },
    ifMatch ?? String(card.revision),
    'The card'
  );
  return memberAnswer(ctx, card.id, { record_id: id, row: 'card', rev: String(rev) });
}

/** A record leaves the card: an own item loses its `set` or this key of its `refs`, a catalog
 *  record leaves the card's `items`. A record that is no member changes nothing. */
async function removeCardMember(ctx, { params, body, ifMatch }) {
  const card = await readCard(ctx, params.card_id);
  if (!card) throw notFound('The card');
  const item = await memberOf(ctx, body.record_id);
  if (item) {
    const content = { ...item.content };
    if (card.kind === 'set' && content.set === card.key) delete content.set;
    else if (card.kind === 'ref' && (content.refs ?? []).includes(card.key)) {
      const refs = content.refs.filter((k) => k !== card.key);
      if (refs.length) content.refs = refs;
      else delete content.refs;
    } else {
      return memberAnswer(ctx, card.id, {
        record_id: item.id,
        row: 'item',
        rev: String(item.revision)
      });
    }
    const rev = await updateRow(
      ctx,
      'homebrew_items',
      item.id,
      { content, book_id: item.book_id },
      ifMatch ?? String(item.revision),
      'The item'
    );
    return memberAnswer(ctx, card.id, { record_id: item.id, row: 'item', rev: String(rev) });
  }
  const id = body.record_id;
  if (!(card.content.items ?? []).includes(id)) {
    return memberAnswer(ctx, card.id, {
      record_id: id,
      row: 'card',
      rev: String(card.revision)
    });
  }
  const rev = await updateRow(
    ctx,
    'homebrew_cards',
    card.id,
    { content: withoutItem(id)(card.content), book_id: card.book_id },
    ifMatch ?? String(card.revision),
    'The card'
  );
  return memberAnswer(ctx, card.id, { record_id: id, row: 'card', rev: String(rev) });
}

/* ---------- the homebrew file ---------- */

const utf8 = new TextEncoder();
const byCreation = (a, b) =>
  a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.id < b.id ? -1 : 1;

/** Reads the content rows of `ids`, or null when the answer passes the read cap. */
async function itemRows(ctx, ids) {
  const r = await pg(
    ctx,
    'GET',
    `homebrew_items?id=in.(${ids.join(',')})&select=${ITEM_SELECT}`
  );
  return r.big ? null : (needed(r) ?? []);
}

/** Returns the bytes one object adds to a file's `books`, `cards` or `items` array: its
 *  two-space JSON four spaces deeper, and the comma and the newline after it. */
function entryBytes(entry) {
  const text = JSON.stringify(entry, null, 2);
  let lines = 1;
  for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1)) lines++;
  return utf8.encode(text).length + 4 * lines + 2;
}

/**
 * «Скачать JSON»: the app's homebrew file of the items `items` names, of one source (`source`,
 * or `home` for the default source) or of every item, paged: a page holds whole items up to
 * 32768 bytes of file with the sources and cards they name; the first page also holds the
 * sources and cards the choice holds that no item names.
 */
async function exportHomebrew(ctx, { query }) {
  let pick = null;
  if (query.items !== undefined && query.source !== undefined) {
    throw bad('Send items or source, not both.');
  }
  if (query.items !== undefined) {
    pick = { ids: idsField({ items: query.items.split(',') }, 'items', 1, ITEMS_MAX) };
  } else if (query.source !== undefined) {
    if (query.source !== 'home' && !UUID.test(query.source.toLowerCase())) {
      throw bad('The field source must be a source id or home.');
    }
    pick = { book: query.source === 'home' ? null : query.source.toLowerCase() };
  }
  const { after } = pageOf({ cursor: query.cursor });
  const tooLarge = () =>
    meError(
      422,
      'answer_too_large',
      `The account's sources or cards are too large for the API. Download the file in the app: ${ctx.site}homebrew`
    );
  const [booksR, cardsR, headsR] = await Promise.all([
    pg(ctx, 'GET', `homebrew_books?select=${BOOK_SELECT}`),
    pg(ctx, 'GET', `homebrew_cards?select=${CARD_SELECT}`),
    pg(
      ctx,
      'GET',
      'homebrew_items?select=id,key,book_id,created_at,set:content->>set,refs:content->refs',
      { max: CONTEXT_MAX }
    )
  ]);
  const books = needed(booksR, tooLarge) ?? [];
  const cards = needed(cardsR, tooLarge) ?? [];
  const heads = (needed(headsR, tooLarge) ?? []).map((h) => ({
    ...h,
    content: { ...(h.set ? { set: h.set } : {}), ...(h.refs ? { refs: h.refs } : {}) }
  }));
  if (pick?.book && !books.some((b) => b.id === pick.book)) throw notFound('The source');
  const known = new Set(books.map((b) => b.id));
  const chosen = heads
    .filter((h) =>
      pick === null
        ? true
        : pick.ids
          ? pick.ids.includes(h.id)
          : pick.book === null
            ? h.book_id === null || !known.has(h.book_id)
            : h.book_id === pick.book
    )
    .sort(byCreation);
  if (pick?.ids && chosen.length !== pick.ids.length) {
    throw bad('The field items names an id that is not one of your items.');
  }
  const base =
    pick === null
      ? { books, cards }
      : pick.ids
        ? { books: [], cards: [] }
        : subsetOf({ books, items: [], cards }, { book: pick.book });
  let start = 0;
  if (after) {
    start = chosen.findIndex((h) => h.id === after) + 1;
    if (start === 0) {
      throw bad('The item of the cursor is gone. Read from the first page again.');
    }
  }
  const now = new Date(ctx.now());
  const first = start === 0;
  const fileOf = (items) => {
    const own = subsetOf({ books, items, cards }, { items: items.map((i) => i.key) });
    const union = (a, b) => [...a, ...b.filter((x) => !a.some((y) => y.id === x.id))];
    const pageBooks = first ? union(base.books, own.books) : own.books;
    const pageCards = first ? union(base.cards, own.cards) : own.cards;
    return toHomebrewFile(pageBooks, items, pageCards, now);
  };
  const bytesOfFile = (f) => utf8.encode(homebrewText(f)).length;
  const pastPage = (id) =>
    meError(
      422,
      'answer_too_large',
      `The item is past ${String(HOMEBREW_PAGE_MAX)} bytes as a file. Download it in the app: ${itemLink(ctx, id)}`
    );
  const tooBig = (id) =>
    meError(
      422,
      'answer_too_large',
      `An item is too large for the API. Download the file in the app: ${itemLink(ctx, id)}`
    );
  /* The page is chosen with a running count of each entry's bytes, and the file is built once:
     a build per added item made the page quadratic in its items. */
  let total = bytesOfFile(fileOf([]));
  if (total > HOMEBREW_PAGE_MAX) throw tooLarge();
  const all = toHomebrewFile(books, [], cards, now);
  const byKey = new Map(all.books.map((b) => [b.key, entryBytes(b)]));
  const bookBytes = new Map(books.map((b) => [b.id, byKey.get(b.key) ?? 0]));
  const cardBytes = new Map(all.cards.map((c) => [c.key, entryBytes(c)]));
  const bookById = new Map(books.map((b) => [b.id, b]));
  const inBooks = new Set(first ? base.books.map((b) => b.id) : []);
  const inCards = new Set(first ? base.cards.map((c) => c.key) : []);
  const page = [];
  let at = start;
  let reads = 0;
  let full = false;
  while (at < chosen.length && !full && reads < FILE_READS_MAX) {
    const batch = chosen.slice(at, at + FILE_BATCH);
    reads++;
    let rows = await itemRows(
      ctx,
      batch.map((h) => h.id)
    );
    let taken = batch.length;
    if (rows === null) {
      /* The batch passed the read cap: each item alone, while the page has room. */
      if (batch.length === 1) throw tooBig(batch[0].id);
      rows = [];
      taken = 0;
      for (const h of batch) {
        if (reads >= FILE_READS_MAX) break;
        reads++;
        const one = await itemRows(ctx, [h.id]);
        if (one === null) throw tooBig(h.id);
        rows.push(...one);
        taken++;
      }
    }
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const h of batch.slice(0, taken)) {
      const row = byId.get(h.id);
      if (row) {
        const book = row.book_id === null ? undefined : bookById.get(row.book_id);
        let add = entryBytes(toHomebrewFile(book ? [book] : [], [row], [], now).items[0]);
        const newBook = book && !inBooks.has(book.id) ? book.id : null;
        if (newBook) add += bookBytes.get(newBook) ?? 0;
        const named = [row.content.set, ...(row.content.refs ?? [])].filter(
          (k) => typeof k === 'string' && cardBytes.has(k) && !inCards.has(k)
        );
        for (const k of new Set(named)) add += cardBytes.get(k);
        if (total + add > HOMEBREW_PAGE_MAX) {
          if (!page.length) throw pastPage(row.id);
          full = true;
          break;
        }
        total += add;
        page.push(row);
        if (newBook) inBooks.add(newBook);
        for (const k of named) inCards.add(k);
      }
      at++;
    }
  }
  /* The count is an estimate of the pretty-printed file; the built file decides. */
  let file = fileOf(page);
  while (page.length && bytesOfFile(file) > HOMEBREW_PAGE_MAX) {
    if (page.length === 1) throw pastPage(page[0].id);
    page.pop();
    file = fileOf(page);
    full = true;
  }
  const rest = full || at < chosen.length;
  const last = page.length ? page[page.length - 1].id : chosen[at - 1]?.id;
  const next = rest && last ? cursorOf(last) : null;
  return {
    status: 200,
    body: { format: 'daggerheart-loot/api-my-homebrew-file', version: 1, file, next }
  };
}

/* ---------- the homebrew file in ---------- */

/** Returns a target of the request's `targets` as `lib/homebrewFile.ts` reads it. */
function targetOf(v, row, i, rows, held) {
  const sourceKey = row.book?.key ?? '';
  const where = sourceKey === '' ? 'the items with no source' : `the source ${sourceKey}`;
  if (v === 'home') return { kind: 'home' };
  if (v === 'new') {
    if (!row.book) throw bad(`The target new needs a source of the file: ${where} has none.`);
    return { kind: 'new' };
  }
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
    if (typeof v.held === 'string') {
      const id = v.held.toLowerCase();
      if (!UUID.test(id) || !held.books.some((b) => b.id === id)) {
        throw notFound(`The held source of ${where}`);
      }
      return { kind: 'held', id };
    }
    if (typeof v.file === 'string') {
      const at = rows.findIndex((r) => r.book?.key === v.file);
      if (row.book || at < 0 || at === i) {
        throw bad(
          `The target file names a source of the file, for the items with no source only.`
        );
      }
      return { kind: 'file', book: v.file };
    }
    if (typeof v.custom === 'string') {
      const lang = v.lang ?? 'ru';
      if (lang !== 'ru' && lang !== 'en') throw bad('The field lang must be one of: ru, en.');
      return { kind: 'custom', name: v.custom, lang };
    }
  }
  throw bad(
    `The target of ${where} must be "home", "new", { held: <source id> }, { file: <source key> } or { custom: <name>, lang }.`
  );
}

/** Returns a target as the answer names it. */
function targetValue(t) {
  switch (t.kind) {
    case 'held':
      return { held: t.id };
    case 'file':
      return { file: t.book };
    case 'custom':
      return { custom: t.name, lang: t.lang };
    default:
      return t.kind;
  }
}

/**
 * The homebrew import of `POST /me/imports` (`HomebrewImport.svelte`): the file read with the
 * account's rows, each key the account does not hold changed to its derived key, every source
 * of the file sent to its target (`targets`, else `defaultTarget`), then `import_homebrew` in
 * one call, every row or none. `mode: "update"` rewrites the held items and cards only with
 * `expect_overwrites` equal to their count. Every id and new key comes from `import_id`.
 */
export async function importHomebrew(ctx, body, file) {
  const mode = body.mode ?? 'add';
  if (mode !== 'add' && mode !== 'update')
    throw bad('The field mode must be one of: add, update.');
  const importId = uuidField(body, 'import_id') ?? crypto.randomUUID();
  const dryRun = boolField(body, 'dry_run') === true;
  if (
    body.targets !== undefined &&
    (body.targets === null || typeof body.targets !== 'object' || Array.isArray(body.targets))
  ) {
    throw bad('The field targets must be an object: a file source key (or "") to its target.');
  }
  const [catalog, booksR, itemsR, cardsR] = await Promise.all([
    ctx.service.catalogContext(),
    pg(ctx, 'GET', `homebrew_books?select=${BOOK_SELECT}`, { max: CONTEXT_MAX }),
    pg(ctx, 'GET', `homebrew_items?select=${ITEM_CONTEXT}`, { max: CONTEXT_MAX }),
    pg(
      ctx,
      'GET',
      'homebrew_cards?select=id,key,kind,book_id,created_at,items:content->items',
      {
        max: CONTEXT_MAX
      }
    )
  ]);
  const tooLarge = () =>
    meError(
      422,
      'answer_too_large',
      `The account's homebrew is too large for the API to plan an import. Import the file in the app: ${ctx.site}homebrew`
    );
  const held = {
    books: needed(booksR, tooLarge) ?? [],
    items: (needed(itemsR, tooLarge) ?? []).map((r) => ({
      ...r,
      content: {
        ...(r.en != null ? { en: r.en } : {}),
        ...(r.ru != null ? { ru: r.ru } : {}),
        ...(r.eq ? { eq: r.eq } : {})
      }
    })),
    cards: (needed(cardsR, tooLarge) ?? []).map((r) => ({
      ...r,
      content: r.items ? { items: r.items } : {}
    }))
  };
  const itemKeys = new Set(held.items.map((i) => i.key));
  const cardKind = new Map(held.cards.map((c) => [c.key, c.kind]));
  const fctx = {
    ...catalog,
    ownItem: (key) => itemKeys.has(key),
    ownCard: (key) => cardKind.get(key) ?? null,
    lineMembers: (line) => {
      const members = catalog.lineMembers(line);
      const own = held.items
        .filter((i) => i.content.eq && (i.key === line || i.content.eq.line === line))
        .filter((i) => !members.some((m) => m.key === i.key))
        .map((i) => ({ key: i.key, t: i.content.eq.t }));
      return [...members, ...own];
    }
  };
  const check = (await ctx.service.checkFile(file)).body;
  let parsed = parseHomebrew(file, fctx);
  if (!parsed.ok) {
    if (!dryRun) {
      throw bad(
        'The file does not pass the check. Send it with dry_run: true to read the lines.'
      );
    }
    return homebrewAnswer(importId, true, check, null, null, null, null);
  }
  const mapped = deriveFile(parsed.file, ctx.user, held);
  if (mapped.file !== parsed.file) {
    parsed = parseHomebrew(homebrewText(mapped.file), fctx);
    if (!parsed.ok) throw unavailable();
  }
  const doc = parsed.file;
  const rows = rowsOf(doc);
  const original = (row) => (row.book ? (mapped.from.get(row.book.key) ?? row.book.key) : '');
  const asked = body.targets ?? {};
  for (const k of Object.keys(asked)) {
    if (!rows.some((r) => original(r) === k)) {
      throw bad(
        `The field targets names ${k === '' ? 'items with no source' : `the source ${k}`}, which the file does not hold.`
      );
    }
  }
  const targets = rows.map((row, i) =>
    Object.hasOwn(asked, original(row))
      ? targetOf(asked[original(row)], row, i, rows, held)
      : defaultTarget(row, held)
  );
  /* The «Куда» panel's own checks: a custom name that is empty or held, a merge past
     SECTIONS_MAX, a file target whose row is not a new source. */
  const problems = [];
  /* A custom source this import made is a retry's own, never a held name. */
  const made = new Set();
  for (const [i, t] of targets.entries()) {
    if (t.kind !== 'custom') continue;
    const key = keyFrom(bytesOf(await uuidV5(importId, `key:custom:${String(i)}`)));
    const mine = held.books.find((b) => b.key === key);
    if (mine && mine.id === (await uuidV5(importId, `id:book:${key}`))) made.add(mine.id);
  }
  targets.forEach((t, i) => {
    const key = original(rows[i]);
    if (t.kind === 'custom') {
      const name = t.name.trim();
      const others = targets
        .filter((x, j) => j !== i && x.kind === 'custom')
        .map((x) => ({ en: x.name }));
      const names = held.books.filter((b) => !made.has(b.id)).map((b) => b.content);
      if (!name) problems.push({ path: `targets.${key}`, rule: 'required' });
      else if (nameTaken([...names, ...HOME_NAMES, ...others], name)) {
        problems.push({ path: `targets.${key}`, rule: 'duplicate', name });
      }
    }
    if (t.kind === 'file') {
      const other = targets[rows.findIndex((r) => r.book?.key === t.book)];
      if (other?.kind !== 'new' && other?.kind !== 'custom') {
        throw bad(
          `The target file of ${key === '' ? 'the items with no source' : key} names a source that is not made new.`
        );
      }
    }
  });
  planOf(rows, targets, held).forEach((p, i) => {
    if (p.full) problems.push({ path: `targets.${original(rows[i])}`, rule: 'many' });
  });
  if (problems.length) {
    throw invalid(problems, (p, t) =>
      p.rule === 'many'
        ? t.hbSectionsFull.replace('%n', String(SECTIONS_MAX))
        : p.rule === 'duplicate'
          ? t.hbSourceTaken.replace('%s', () => p.name)
          : t.hbErrSourceName
    );
  }
  /* A row this import made (its id is the import's UUIDv5 of its key) is a retry's own, not an
     overwrite: a retry of a lost answer asks for the same count. */
  const madeHere = async (rows, kind) => {
    const out = [];
    for (const r of rows) {
      if (r.id !== (await uuidV5(importId, `id:${kind}:${r.key}`))) out.push(r);
    }
    return out;
  };
  let overwrites = 0;
  if (mode === 'update') {
    const counts = heldOf(doc, {
      books: held.books,
      items: await madeHere(held.items, 'item'),
      cards: await madeHere(held.cards, 'card')
    });
    overwrites = counts.items + counts.cards;
  }
  const wouldCreate = {
    sources: targets.filter((t) => t.kind === 'new' || t.kind === 'custom').length,
    cards: doc.cards.filter((c) => !cardKind.has(c.key)).length,
    items: newItemCount(doc, { has: (k) => itemKeys.has(k) })
  };
  const applied = rows.map((row, i) => ({
    source: original(row),
    target: targetValue(targets[i])
  }));
  if (dryRun)
    return homebrewAnswer(importId, true, check, wouldCreate, overwrites, applied, null);
  if (overwrites > 0 && body.expect_overwrites !== overwrites) {
    throw meError(
      409,
      'confirm_required',
      `The import rewrites ${String(overwrites)} of the reader's items and cards. Show the reader which, then send expect_overwrites: ${String(overwrites)}.`,
      { confirm: overwrites }
    );
  }
  /* The panel keeps its ids and keys per file; here every one is a UUIDv5 of import_id, and a
     row's own new source keeps the file's key once this import made it. */
  const slots = new Map();
  for (const [i, row] of rows.entries()) {
    if (!row.book) continue;
    const mine = held.books.find((b) => b.key === row.book.key);
    if (mine && mine.id === (await uuidV5(importId, `id:book:${row.book.key}`))) {
      slots.set(`key:new:${String(i)}`, row.book.key);
    }
  }
  const want = new Set();
  const plan = () =>
    toHomebrewRows(doc, rows, targets, held, mode === 'update', {
      id: (slot) => {
        want.add('id:' + slot);
        return slots.get('id:' + slot) ?? 'pending';
      },
      key: (slot, first) => {
        const k = 'key:' + slot;
        if (!slots.has(k) && first !== undefined) slots.set(k, first);
        want.add(k);
        return slots.get(k) ?? 'hb_pendingpending';
      }
    });
  /* Three passes: the first names the key slots, the second the id slots those keys name
     (`book:<key>`), the third builds the rows. */
  for (let pass = 0; pass < 2; pass++) {
    plan();
    for (const k of want) {
      if (slots.has(k)) continue;
      const v = await uuidV5(importId, k);
      slots.set(k, k.startsWith('key:') ? keyFrom(bytesOf(v)) : v);
    }
  }
  const callRows = plan();
  const r = await call(ctx, 'import_homebrew', {
    p_books: callRows.books,
    p_cards: callRows.cards,
    p_items: callRows.items,
    p_update: callRows.update
  });
  if (!r.ok) {
    const { code, message } = r.error ?? {};
    if (code === 'P0001' && /^limit: /.test(String(message))) throw limitReached(message);
    if (code === '22023') {
      throw meError(
        409,
        'conflict',
        'The account refused the import. Check the file with dry_run.'
      );
    }
    throw unavailable();
  }
  return homebrewAnswer(importId, false, check, wouldCreate, overwrites, applied, r.value);
}

function homebrewAnswer(importId, dryRun, check, wouldCreate, overwrites, targets, created) {
  return {
    status: 200,
    body: {
      format: 'daggerheart-loot/api-import',
      version: 1,
      import_id: importId,
      dry_run: dryRun,
      check,
      would_create: wouldCreate,
      would_overwrite: overwrites,
      targets,
      created
    }
  };
}

/** The homebrew operations by operationId (openapi.json). */
export const HOMEBREW_OPS = {
  listMyHomebrewItems,
  getMyHomebrewItem,
  saveHomebrewItem,
  deleteHomebrewItem,
  deleteHomebrewItems,
  moveHomebrewItems,
  setItemPicture,
  clearItemPicture,
  saveItemCopy,
  listMyHomebrewSources,
  saveHomebrewSource,
  deleteHomebrewSource,
  listMyHomebrewCards,
  saveHomebrewCard,
  deleteHomebrewCard,
  addCardMember,
  removeCardMember,
  exportHomebrew
};
