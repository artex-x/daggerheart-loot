// A stub Supabase for the account API's suites (me.test.mjs, me-lists.test.mjs): an in-memory
// PostgREST that answers the table reads and writes and the RPCs the account operations send,
// with the database's own rules where an answer depends on them (row ownership, the
// `apply_list_writes` results, the limit triggers, the list revision, the share and copy
// functions, the import retry, the request functions and the print set). It is a test double, not a second database: each rule cites
// the migration it stands in for.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { renderApiData } from '../../tools/api-data.mjs';
import { recordOf } from '../../app/src/lib/homebrew.ts';
import { printEntriesValid } from '../../app/src/lib/printSet.ts';

export const SUPA = 'https://test-project.supabase.co';
export const SITE = 'https://daggerheart-loot.pages.dev/';
export const HOST = 'https://daggerheart-loot.pages.dev';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const API_FIXTURES = join(ROOT, 'docs', 'fixtures', 'api', 'v1');
export const MCP_FIXTURES = join(ROOT, 'docs', 'fixtures', 'mcp');
export const CATALOG = JSON.parse(readFileSync(join(API_FIXTURES, 'catalog.json'), 'utf8'));
const FILES = renderApiData(CATALOG.loot, CATALOG.audit, CATALOG.versions);

/** The worker's env over the pinned catalog's files; the account calls go to `fetch`. */
export const ENV = {
  SITE,
  PAGES_HOST: 'daggerheart-loot.pages.dev',
  SUPABASE_URL: SUPA,
  SUPABASE_KEY: 'sb_publishable_test',
  ASSETS: {
    async fetch(url) {
      const path = String(url).slice(SITE.length);
      const body = FILES.get(path);
      return body === undefined
        ? new Response('missing', { status: 404 })
        : new Response(body, { headers: { 'Content-Type': 'application/json' } });
    }
  }
};

/** Compares `text` with the fixture `file` byte for byte; UPDATE_API_FIXTURES=1 (an api
 *  fixture) or UPDATE_MCP_FIXTURES=1 (an mcp one) writes it. */
export function pinned(file, text) {
  const update =
    process.env[
      file.startsWith(MCP_FIXTURES) ? 'UPDATE_MCP_FIXTURES' : 'UPDATE_API_FIXTURES'
    ] === '1';
  if (update) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  assert.ok(existsSync(file), `The fixture ${file} is missing. Run with the UPDATE variable.`);
  assert.equal(text, readFileSync(file, 'utf8'), `${file} differs from the answer`);
}
export const ISS = SUPA + '/auth/v1';
export const GM = '11111111-1111-4111-8111-111111111111';
export const OTHER = '22222222-2222-4222-8222-222222222222';

const b64 = (v) =>
  Buffer.from(typeof v === 'string' ? v : JSON.stringify(v))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Mints an unsigned JWT with the claims of a client token (`.claude/README.md`, "OAuth
 *  server and the client token"); `over` replaces claims, a key set to undefined drops one. */
export function mint(over = {}) {
  const claims = Object.fromEntries(
    Object.entries({
      iss: ISS,
      sub: GM,
      aud: 'authenticated',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
      client_id: '33333333-3333-4333-8333-333333333333',
      session_id: '44444444-4444-4444-8444-444444444444',
      ...over
    }).filter(([, v]) => v !== undefined)
  );
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(claims)}.${b64('signature')}`;
}

/* A 204 carries no body at all: the Response constructor refuses even an empty one. */
const json = (v, status = 200) =>
  new Response(status === 204 ? null : v === undefined ? '' : JSON.stringify(v), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
const pgError = (status, code, message, details = null) =>
  json({ code, message, details, hint: null }, status);

/** Splits a select list at its top-level commas. */
function selectOf(text) {
  const out = [];
  let depth = 0;
  let at = 0;
  for (let i = 0; i <= text.length; i++) {
    const c = text[i];
    if (c === '(') depth++;
    if (c === ')') depth--;
    if ((c === ',' && depth === 0) || i === text.length) {
      out.push(text.slice(at, i));
      at = i + 1;
    }
  }
  return out.map((f) => {
    const m = /^(?:(\w+):)?(\w+)\((.*)\)$/.exec(f);
    return m ? { alias: m[1] ?? m[2], embed: m[2], inner: m[3] } : { field: f };
  });
}

/** Returns a fresh store and its `fetch`. */
export function fakeSupabase() {
  let clock = 0;
  const now = () => new Date(Date.UTC(2026, 10, 14, 10, 0, clock++)).toISOString();
  let tokens = 0;
  const db = {
    lists: [],
    entries: [],
    shares: [],
    items: [],
    cards: [],
    books: [],
    /** `purchase_requests` rows, each with its `lines` (`purchase_request_lines`). */
    requests: [],
    notices: [],
    /** `print_sets` rows: `{ id, owner_id, entries, digest }`. */
    prints: [],
    limits: {
      lists_per_owner: 50,
      entries_per_list: 100,
      homebrew_items_per_owner: 100,
      homebrew_books_per_owner: 20,
      homebrew_cards_per_owner: 100,
      request_lines: 100,
      pending_requests_per_list: 10,
      print_sets_per_owner: 1000
    }
  };
  const state = {
    db,
    calls: [],
    /** A tokens that PostgREST refuses (an ended session's signature check passes, but a
     *  revoked or expired one is refused): answered 401. */
    refused: new Set(),
    /** Set to answer the guard's 42501 for every call. */
    guard: false,
    /** Set to answer the guard's 42501 of a token whose session a disconnect deleted. */
    ended: false,
    /** `(name, args, method, query) => Response | undefined`: an injected answer before the
     *  fake runs. */
    fail: () => undefined,
    /** The picture files of `homebrew-art` by name: `{ owner, bytes }`. */
    storage: new Map(),
    /** Unset to refuse an upload as the full picture room does. */
    artRoom: true
  };

  const userOf = (init) => {
    const auth = new Headers(init.headers).get('Authorization');
    /* The read API's own reads carry the publishable key alone: the anon reader. */
    if (auth === null) return { user: null };
    const token = auth.slice('Bearer '.length);
    if (state.refused.has(token)) return { refused: true };
    try {
      const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return { user: JSON.parse(Buffer.from(part, 'base64').toString('utf8')).sub };
    } catch {
      return { refused: true };
    }
  };

  const own = (user) => db.lists.filter((l) => l.owner_id === user);
  const entriesOf = (id) => db.entries.filter((e) => e.list_id === id);
  /* `lists.revision`: bumped by every change of the list or one of its entries
     (20260925130100_lists.sql). */
  const bump = (id) => {
    const l = db.lists.find((x) => x.id === id);
    if (l) {
      l.revision += 1;
      l.updated_at = now();
    }
  };

  function project(list, select, q = new URLSearchParams()) {
    const out = {};
    for (const f of selectOf(select)) {
      if (f.field) out[f.field] = list[f.field];
      else if (f.embed === 'list_notices' && f.inner === 'count') {
        /* An embedded filter narrows the count, not the lists (no `!inner`). */
        const unread = q.get('list_notices.read_at') === 'is.null';
        out.list_notices = [
          {
            count: db.notices.filter(
              (n) => n.list_id === list.id && (!unread || n.read_at === null)
            ).length
          }
        ];
      } else if (f.embed === 'list_entries' && f.inner === 'count') {
        out.list_entries = [{ count: entriesOf(list.id).length }];
      } else if (f.embed === 'list_entries') {
        out.list_entries = entriesOf(list.id).map((e) =>
          Object.fromEntries(f.inner.split(',').map((k) => [k, e[k]]))
        );
      } else if (f.embed === 'list_shares') {
        out.list_shares = db.shares
          .filter((s) => s.list_id === list.id)
          .map((s) => Object.fromEntries(f.inner.split(',').map((k) => [k, s[k]])));
      }
    }
    return out;
  }

  /** Returns the value of a column or a JSON path (`content->eq->>line`) of a row; `->>` is
   *  text, as PostgREST reads it. */
  function valueAt(row, path) {
    const parts = path.split(/(->>|->)/);
    let v = row[parts[0]];
    for (let i = 1; i < parts.length; i += 2) {
      v = v !== null && typeof v === 'object' ? v[parts[i + 1]] : undefined;
      if (parts[i] === '->>' && v !== undefined && v !== null && typeof v === 'object') {
        v = JSON.stringify(v);
      }
    }
    return v === undefined ? null : v;
  }

  /** Returns whether a row passes one filter `<op>.<value>` of `path`. */
  function passes(row, path, filter) {
    const [op, ...rest] = filter.split('.');
    const val = rest.join('.');
    const v = valueAt(row, path);
    if (op === 'eq') return v !== null && String(v) === val;
    if (op === 'neq') return v === null || String(v) !== val;
    if (op === 'gt') return v !== null && String(v) > val;
    if (op === 'is') return val === 'null' ? v === null : true;
    if (op === 'in') return val.slice(1, -1).split(',').includes(String(v));
    throw new Error('the fake has no filter ' + op);
  }

  function filtered(rows, q) {
    let out = rows;
    for (const [k, v] of q) {
      if (['select', 'order', 'limit', 'on_conflict'].includes(k)) continue;
      if (k === 'or') {
        const alts = v.slice(1, -1).split(',');
        out = out.filter((r) =>
          alts.some((a) => {
            const m = /^(.+?)\.(eq|neq|gt|is|in)\.(.*)$/.exec(a);
            return m ? passes(r, m[1], `${m[2]}.${m[3]}`) : false;
          })
        );
        continue;
      }
      out = out.filter((r) => passes(r, k, v));
    }
    const order = q.get('order');
    if (order === 'id.asc') out = [...out].sort((a, b) => (a.id < b.id ? -1 : 1));
    if (q.has('limit')) out = out.slice(0, Number(q.get('limit')));
    return out;
  }

  /** Returns a row as a flat select reads it: `col`, or `alias:<column or JSON path>`. */
  function pick(row, select) {
    if (select === '*') return { ...row };
    return Object.fromEntries(
      select.split(',').map((f) => {
        const [alias, path] = f.includes(':') ? f.split(':') : [f, f];
        return [alias, valueAt(row, path)];
      })
    );
  }

  /* ---------- homebrew ---------- */

  const HOMEBREW_TABLES = {
    homebrew_items: { rows: () => db.items, limit: 'homebrew_items_per_owner' },
    homebrew_books: { rows: () => db.books, limit: 'homebrew_books_per_owner' },
    homebrew_cards: { rows: () => db.cards, limit: 'homebrew_cards_per_owner' }
  };
  const ROW_FIELDS = {
    homebrew_items: ['id', 'key', 'book_id', 'content', 'art'],
    homebrew_books: ['id', 'key', 'content'],
    homebrew_cards: ['id', 'key', 'kind', 'book_id', 'content']
  };

  /** The record `homebrew_item_record` answers: `recordOf` over the item's source and cards. */
  function recordFrom(item) {
    if (item.record) return item.record;
    const book = item.book_id ? db.books.find((b) => b.id === item.book_id) : null;
    const cards = db.cards
      .filter((c) => c.owner_id === item.owner_id)
      .map((c) => ({ ...c.content, key: c.key, kind: c.kind }));
    return recordOf(
      item.key,
      item.content,
      book ? { ...book.content, key: book.key } : null,
      cards
    );
  }

  /* The cascades of 20260930130000_homebrew.sql and 20261007130000_homebrew_links.sql: an item
     delete drops every list entry that links it; a source delete moves its items and cards to
     the default source, and an item keeps its section key (the local probe, 2026-11-14). */
  function dropItem(item) {
    const hit = db.entries.filter((e) => e.hb_item === item.id);
    db.entries = db.entries.filter((e) => !hit.includes(e));
    for (const id of new Set(hit.map((e) => e.list_id))) bump(id);
    db.items = db.items.filter((i) => i !== item);
  }
  function dropBook(book) {
    for (const i of db.items.filter((x) => x.book_id === book.id)) i.book_id = null;
    for (const c of db.cards.filter((x) => x.book_id === book.id)) c.book_id = null;
    db.books = db.books.filter((b) => b !== book);
  }

  /* The picture trigger `homebrew_items_art_owned` (20261014120000_homebrew_art.sql): an own
     picture names an upload of the item's owner, both files. */
  const artMissing = (name, owner) =>
    typeof name === 'string' &&
    name.startsWith('p/') &&
    ![name, 't/' + name.slice(2)].every((n) => state.storage.get(n)?.owner === owner);

  function homebrewTable(user, method, table, q, body, prefer) {
    const all = HOMEBREW_TABLES[table].rows;
    const mine = () => all().filter((r) => r.owner_id === user);
    const select = q.get('select') ?? '*';
    const want = (prefer ?? '').includes('return=representation');
    if (method === 'GET') return json(filtered(mine(), q).map((r) => pick(r, select)));
    if (method === 'POST') {
      const row = body;
      /* `on conflict (id) do nothing`: a held id, any owner's, answers no row. */
      if (all().some((r) => r.id === row.id)) return json([], 201);
      if (mine().some((r) => r.key === row.key)) {
        return pgError(
          409,
          '23505',
          `duplicate key value violates unique constraint "${table}_key"`
        );
      }
      const max = db.limits[HOMEBREW_TABLES[table].limit];
      if (max !== undefined && mine().length >= max) {
        return pgError(400, 'P0001', `limit: ${HOMEBREW_TABLES[table].limit}`, String(max));
      }
      if (table === 'homebrew_items' && artMissing(row.art, user)) {
        return pgError(400, 'P0001', 'homebrew: art missing');
      }
      const at = now();
      const made = {
        ...Object.fromEntries(ROW_FIELDS[table].map((k) => [k, row[k] ?? null])),
        owner_id: user,
        revision: 1,
        created_at: at,
        updated_at: at
      };
      all().push(made);
      return json(want ? [pick(made, select)] : undefined, 201);
    }
    const rows = filtered(mine(), q);
    if (method === 'PATCH') {
      if (table === 'homebrew_items' && 'art' in body) {
        for (const r of rows)
          if (artMissing(body.art, r.owner_id)) {
            return pgError(400, 'P0001', 'homebrew: art missing');
          }
      }
      for (const r of rows) {
        Object.assign(r, body);
        r.revision += 1;
        r.updated_at = now();
      }
      return want ? json(rows.map((r) => pick(r, select))) : json(undefined, 204);
    }
    if (method === 'DELETE') {
      const out = rows.map((r) => pick(r, select));
      for (const r of rows) {
        if (table === 'homebrew_items') dropItem(r);
        else if (table === 'homebrew_books') dropBook(r);
        else db.cards = db.cards.filter((c) => c !== r);
      }
      return want ? json(out) : json(undefined, 204);
    }
    return pgError(405, 'PGRST000', 'method');
  }

  /** `get_homebrew_item` (20261014120000_homebrew_art.sql): any item by id, `mine` for its
   *  owner; `related` is left empty here. */
  function homebrewItemOf(user, id) {
    const item = db.items.find((i) => i.id === id);
    if (!item) return null;
    return {
      hid: item.id,
      mine: item.owner_id === user,
      revision: 'r' + String(item.revision ?? 1),
      item: recordFrom(item),
      related: [],
      updated_at: item.updated_at ?? now(),
      ...(item.art ? { img: item.art } : {})
    };
  }

  /* `import_homebrew` (20261002130000_homebrew_files.sql): sources, cards, then items, by key
     within the account; a held key is rewritten with `p_update`, else skipped; every row or
     none (the fake checks the limit before it writes). */
  function importHomebrew(user, args) {
    const counts = {
      books_created: 0,
      cards_created: 0,
      cards_updated: 0,
      cards_skipped: 0,
      items_created: 0,
      items_updated: 0,
      items_skipped: 0
    };
    const ownBooks = () => db.books.filter((b) => b.owner_id === user);
    const newItems = args.p_items.filter(
      (it) => !db.items.some((x) => x.owner_id === user && x.key === it.key)
    ).length;
    const max = db.limits.homebrew_items_per_owner;
    if (db.items.filter((x) => x.owner_id === user).length + newItems > max) {
      return pgError(400, 'P0001', 'limit: homebrew_items_per_owner', String(max));
    }
    /* The insert's `on conflict (owner_id, key)` does not cover the primary key: a new key
       with an id another account holds is a unique violation, and nothing is written. */
    if (
      args.p_items.some(
        (it) =>
          !db.items.some((x) => x.owner_id === user && x.key === it.key) &&
          db.items.some((x) => x.id === it.id && x.owner_id !== user)
      )
    ) {
      return pgError(
        409,
        '23505',
        'duplicate key value violates unique constraint "homebrew_items_pkey"'
      );
    }
    const bookId = (key) =>
      key === null ? null : (ownBooks().find((b) => b.key === key)?.id ?? null);
    const at = now();
    for (const b of args.p_books) {
      const held = ownBooks().find((x) => x.key === b.key);
      if (held) {
        const sections = [...(held.content.sections ?? [])];
        for (const s of b.content.sections ?? []) {
          if (!sections.some((x) => x.key === s.key)) sections.push(s);
        }
        held.content = {
          ...(b.names ? { en: b.content.en, ru: b.content.ru } : held.content),
          ...(sections.length ? { sections } : {})
        };
        held.content = Object.fromEntries(
          Object.entries(held.content).filter(([, v]) => v !== undefined)
        );
        held.revision += 1;
      } else {
        db.books.push({
          id: b.id,
          owner_id: user,
          key: b.key,
          content: b.content,
          revision: 1,
          created_at: at,
          updated_at: at
        });
        counts.books_created++;
      }
    }
    for (const c of args.p_cards) {
      const held = db.cards.find((x) => x.owner_id === user && x.key === c.key);
      if (held && !args.p_update) counts.cards_skipped++;
      else if (held) {
        Object.assign(held, { content: c.content, book_id: bookId(c.book) });
        held.revision += 1;
        counts.cards_updated++;
      } else {
        db.cards.push({
          id: c.id,
          owner_id: user,
          key: c.key,
          kind: c.kind,
          book_id: bookId(c.book),
          content: c.content,
          revision: 1,
          created_at: at,
          updated_at: at
        });
        counts.cards_created++;
      }
    }
    for (const it of args.p_items) {
      const held = db.items.find((x) => x.owner_id === user && x.key === it.key);
      if (held && !args.p_update) counts.items_skipped++;
      else if (held) {
        Object.assign(held, { content: it.content, book_id: bookId(it.book) });
        Reflect.deleteProperty(held, 'record');
        held.revision += 1;
        counts.items_updated++;
      } else {
        db.items.push({
          id: it.id,
          owner_id: user,
          key: it.key,
          book_id: bookId(it.book),
          content: it.content,
          art: null,
          revision: 1,
          created_at: at,
          updated_at: at
        });
        counts.items_created++;
      }
    }
    return json(counts);
  }

  /* `move_homebrew_items` (20261002130000_homebrew_files.sql): every item at its revision or
     none, a conflict P0001. */
  function moveItems(user, args) {
    if (
      args.p_book !== null &&
      !db.books.some((b) => b.id === args.p_book && b.owner_id === user)
    ) {
      return pgError(400, 'P0002', 'move_homebrew_items: no source');
    }
    const rows = args.p_items.map((x) =>
      db.items.find((i) => i.id === x.id && i.owner_id === user && i.revision === x.revision)
    );
    const miss = args.p_items.find((_x, i) => !rows[i]);
    if (miss) return pgError(400, 'P0001', 'move_homebrew_items: conflict ' + miss.id);
    for (const r of rows) {
      r.book_id = args.p_book;
      const { section: _section, ...rest } = r.content;
      r.content = args.p_section === null ? rest : { ...rest, section: args.p_section };
      r.revision += 1;
    }
    return json(rows.length);
  }

  /* The trigger `list_entries_hb_key` (20261007130000_homebrew_links.sql): a homebrew entry by
     key links the list owner's item; one by `hb_item` takes that item's key. */
  function linkEntry(list, e) {
    if (e.source !== 'homebrew' && !e.hb_item) return { ...e, hb_item: null };
    const item = e.hb_item
      ? db.items.find((i) => i.id === e.hb_item)
      : db.items.find((i) => i.owner_id === list.owner_id && i.key === e.item_key);
    if (!item) return null;
    return { ...e, source: 'homebrew', hb_item: item.id, item_key: item.key };
  }

  /** Inserts entries `on conflict (id) do nothing`; answers an error code or null. */
  function insertEntries(list, rows) {
    const made = [];
    for (const raw of rows) {
      if (db.entries.some((x) => x.id === raw.id)) continue;
      const e = linkEntry(list, raw);
      if (!e) return { code: '23503', message: 'list_entries: no homebrew item' };
      if ([...entriesOf(list.id), ...made].some((x) => x.item_key === e.item_key)) {
        return { code: '23505', message: 'duplicate key value violates unique constraint' };
      }
      made.push({
        id: e.id,
        list_id: list.id,
        item_key: e.item_key,
        source: e.source,
        hb_item: e.hb_item,
        position: e.position,
        quantity: e.quantity ?? 1,
        price_coins: e.price_coins ?? null,
        player_note: e.player_note ?? '',
        gm_note: e.gm_note ?? '',
        gm_only: e.gm_only === true
      });
    }
    const max = db.limits.entries_per_list;
    if (entriesOf(list.id).length + made.length > max) {
      return { code: 'P0001', message: 'limit: entries_per_list', details: String(max) };
    }
    db.entries.push(...made);
    if (made.length) bump(list.id);
    return null;
  }

  function createList(user, l) {
    const held = db.lists.find((x) => x.id === l.id);
    if (held) return held.owner_id === user ? { list: held, made: false } : { code: '42501' };
    if (own(user).length >= db.limits.lists_per_owner) {
      return {
        code: 'P0001',
        message: 'limit: lists_per_owner',
        details: String(db.limits.lists_per_owner)
      };
    }
    const at = now();
    const list = {
      id: l.id,
      owner_id: user,
      name: l.name ?? '',
      money_mode: l.money_mode ?? 'bag',
      player_note: l.player_note ?? '',
      gm_note: l.gm_note ?? '',
      created_at: at,
      updated_at: at,
      revision: 1
    };
    db.lists.push(list);
    return { list, made: true };
  }

  function deleteList(id) {
    db.lists = db.lists.filter((l) => l.id !== id);
    db.entries = db.entries.filter((e) => e.list_id !== id);
    db.shares = db.shares.filter((s) => s.list_id !== id);
    db.requests = db.requests.filter((r) => r.list_id !== id);
    db.notices = db.notices.filter((n) => n.list_id !== id);
  }

  /* `apply_list_writes` (20261007130100_list_entry_gm_only.sql): each op in its own
     subtransaction, one result per op. */
  function applyOp(user, op) {
    const mine = (id) => db.lists.find((l) => l.id === id && l.owner_id === user);
    const entryOf = (id) => {
      const e = db.entries.find((x) => x.id === id);
      return e && mine(e.list_id) ? e : null;
    };
    const gone = {
      ok: false,
      code: 'P0002',
      message: 'apply_list_writes: the list or entry is gone'
    };
    switch (op.op) {
      case 'create': {
        const r = createList(user, op.list);
        if (r.code === '42501') {
          return {
            ok: false,
            code: '42501',
            message: 'apply_list_writes: the id belongs to another list'
          };
        }
        if (r.code) return { ok: false, ...r };
        const err = insertEntries(r.list, op.entries);
        if (err) {
          if (r.made) deleteList(r.list.id);
          return { ok: false, ...err };
        }
        return { ok: true };
      }
      case 'add': {
        const l = mine(op.list_id);
        if (!l) return gone;
        const err = insertEntries(l, op.entries);
        return err ? { ok: false, ...err } : { ok: true };
      }
      case 'update': {
        const l = mine(op.id);
        if (!l) return gone;
        Object.assign(l, op.patch);
        bump(l.id);
        return { ok: true };
      }
      case 'remove':
        if (mine(op.id)) deleteList(op.id);
        return { ok: true };
      case 'update_entry': {
        const e = entryOf(op.id);
        if (!e) return gone;
        Object.assign(e, op.patch);
        bump(e.list_id);
        return { ok: true };
      }
      case 'remove_entries': {
        const hit = db.entries.filter((e) => op.ids.includes(e.id) && mine(e.list_id));
        db.entries = db.entries.filter((e) => !hit.includes(e));
        for (const id of new Set(hit.map((e) => e.list_id))) bump(id);
        return { ok: true };
      }
      case 'reorder': {
        const l = mine(op.list_id);
        if (!l) return gone;
        op.ids.forEach((id, i) => {
          const e = db.entries.find((x) => x.id === id && x.list_id === l.id);
          if (e) e.position = i;
        });
        bump(l.id);
        return { ok: true };
      }
      case 'relink': {
        /* The row keeps its place; the trigger `list_entries_hb_key` writes the item's key. */
        const e = entryOf(op.id);
        const item = db.items.find((i) => i.id === op.hb_item);
        if (!e || !item) return gone;
        Object.assign(e, { hb_item: item.id, item_key: item.key, source: 'homebrew' });
        bump(e.list_id);
        return { ok: true };
      }
      default:
        return { ok: false, code: '22023', message: 'apply_list_writes: unknown op' };
    }
  }

  /* ---------- requests, notices, print sets ---------- */

  /* A request's times follow the clock the worker reads (`Date.now`, which a test may fix),
     so a request's `expired` and the function's expiry check agree. */
  const clockIso = (plus = 0) => new Date(Date.now() + plus).toISOString();
  const HOUR = 3600000;
  const ownsList = (user, id) => db.lists.some((l) => l.id === id && l.owner_id === user);
  const unknownLink = () => pgError(404, 'P0002', 'request: unknown link');
  const requestError = (message) => pgError(400, '22023', message);
  const notOwner = () => pgError(403, '42501', 'request: not the owner of the request');

  function requestRow(r, select) {
    const out = {};
    for (const f of selectOf(select)) {
      if (f.field) out[f.field] = r[f.field] ?? null;
      else if (f.embed === 'purchase_request_lines') {
        out[f.alias] = r.lines.map((l) =>
          Object.fromEntries(
            f.inner.split(',').map((k) => {
              const [alias, column] = k.includes(':') ? k.split(':') : [k, k];
              return [alias, l[column] ?? null];
            })
          )
        );
      }
    }
    return out;
  }

  /* RLS of 20260928120000_purchase_requests.sql and 20261007130000_homebrew_links.sql: the
     owner of the row's list reads it; a notice is deleted by its list's owner. */
  const REQUEST_TABLES = {
    purchase_requests(user, method, q) {
      if (method !== 'GET') return pgError(405, 'PGRST000', 'method');
      const rows = filtered(
        db.requests.filter((r) => ownsList(user, r.list_id)),
        q
      );
      return json(rows.map((r) => requestRow(r, q.get('select') ?? '*')));
    },
    list_notices(user, method, q) {
      const mine = db.notices.filter((n) => ownsList(user, n.list_id));
      if (method === 'DELETE') {
        const hit = filtered(mine, q);
        db.notices = db.notices.filter((n) => !hit.includes(n));
        return json(undefined, 204);
      }
      if (method !== 'GET') return pgError(405, 'PGRST000', 'method');
      /* The order comes before the limit, as PostgREST applies them. */
      const unlimited = new URLSearchParams(q);
      unlimited.delete('limit');
      let rows = filtered(mine, unlimited);
      if (q.get('order') === 'created_at.desc,id.asc') {
        rows = [...rows].sort(
          (a, b) =>
            (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0) ||
            (a.id < b.id ? -1 : 1)
        );
      }
      if (q.has('limit')) rows = rows.slice(0, Number(q.get('limit')));
      return json(rows.map((n) => pick(n, q.get('select') ?? '*')));
    },
    list_shares(user, method, q) {
      if (method !== 'GET') return pgError(405, 'PGRST000', 'method');
      const rows = filtered(
        db.shares.filter((s) => ownsList(user, s.list_id)),
        q
      );
      return json(rows.map((s) => pick(s, q.get('select') ?? '*')));
    }
  };

  /* `create_purchase_request` (20261007130100_list_entry_gm_only.sql): the token, the replay
     by id, the lines, the line limit, the stock (a players' link sees no GM-only entry), the
     rate of 5 a minute per link and the pending limit; answers nothing. */
  function sendRequest(args) {
    if (typeof args.p_token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(args.p_token)) {
      return unknownLink();
    }
    const share = db.shares.find((s) => s.token === args.p_token && s.revoked_at === null);
    if (!share) return unknownLink();
    if (!args.p_id) return requestError('request: bad id');
    const held = db.requests.find((r) => r.id === args.p_id);
    if (held) return held.share_id === share.id ? json(undefined, 204) : unknownLink();
    const lines = args.p_lines;
    const items = Array.isArray(lines) ? lines.map((l) => l?.item) : [];
    if (
      !Array.isArray(lines) ||
      !lines.length ||
      lines.some(
        (l) =>
          typeof l?.item !== 'string' ||
          !/^[A-Za-z0-9_-]{1,64}$/.test(l.item) ||
          !Number.isInteger(l.qty) ||
          l.qty < 1 ||
          l.qty > 99
      ) ||
      new Set(items).size !== items.length
    ) {
      return requestError('request: bad lines');
    }
    if (lines.length > db.limits.request_lines) {
      return pgError(400, 'P0001', 'limit: request_lines', String(db.limits.request_lines));
    }
    const stock = entriesOf(share.list_id).filter((e) => share.audience === 'gm' || !e.gm_only);
    if (lines.some((l) => !stock.some((e) => e.item_key === l.item))) {
      return requestError('request: stale');
    }
    const minute = Date.now() - 60000;
    if (
      db.requests.filter((r) => r.share_id === share.id && Date.parse(r.created_at) > minute)
        .length >= 5
    ) {
      return pgError(400, 'P0001', 'limit: request_rate', '5');
    }
    const pending = db.requests.filter(
      (r) =>
        r.list_id === share.list_id &&
        r.status === 'pending' &&
        Date.parse(r.expires_at) > Date.now()
    );
    if (pending.length >= db.limits.pending_requests_per_list) {
      return pgError(
        400,
        'P0001',
        'limit: pending_requests_per_list',
        String(db.limits.pending_requests_per_list)
      );
    }
    db.requests.push({
      id: args.p_id,
      list_id: share.list_id,
      share_id: share.id,
      audience: share.audience,
      status: 'pending',
      created_at: clockIso(),
      expires_at: clockIso(30 * 24 * HOUR),
      decided_at: null,
      read_at: null,
      lines: lines.map((l) => ({
        item_key: l.item,
        quantity: l.qty,
        price_coins: stock.find((e) => e.item_key === l.item).price_coins ?? null,
        applied_quantity: null
      }))
    });
    return json(undefined, 204);
  }

  /* The checks both decisions make first (20261007130000_homebrew_links.sql): the owner, the
     state, the first read (it caps the expiry at an hour), the expiry. */
  function decidable(user, id) {
    const req = db.requests.find((r) => r.id === id && ownsList(user, r.list_id));
    if (!req) return { error: notOwner() };
    if (req.status !== 'pending') return { error: requestError('request: decided') };
    if (req.read_at === null) {
      req.read_at = clockIso();
      req.expires_at = new Date(
        Math.min(Date.parse(req.expires_at), Date.now() + HOUR)
      ).toISOString();
    }
    if (Date.parse(req.expires_at) <= Date.now()) {
      return { error: requestError('request: expired') };
    }
    return { req };
  }

  /* `apply_purchase_request`: { short } and no change when the stock is too low (with clamp,
     only when there is none); an entry taken whole is deleted and the list renumbered. */
  function applyRequest(user, args) {
    const { req, error } = decidable(user, args.p_id);
    if (error) return error;
    const stock = entriesOf(req.list_id);
    const have = (l) => stock.find((e) => e.item_key === l.item_key)?.quantity ?? 0;
    const short = [...req.lines]
      .sort((a, b) => (a.item_key < b.item_key ? -1 : 1))
      .filter((l) => l.quantity > have(l))
      .map((l) => ({ item: l.item_key, want: l.quantity, have: have(l) }));
    const none = req.lines.every((l) => have(l) === 0);
    if (short.length && (!args.p_clamp || none)) return json({ short });
    let deleted = 0;
    for (const l of req.lines) {
      l.applied_quantity = Math.min(l.quantity, have(l));
      const e = stock.find((x) => x.item_key === l.item_key);
      if (!e || l.applied_quantity === 0) continue;
      if (e.quantity === l.applied_quantity) {
        db.entries = db.entries.filter((x) => x !== e);
        deleted++;
      } else e.quantity -= l.applied_quantity;
    }
    if (deleted) {
      entriesOf(req.list_id)
        .sort((a, b) => a.position - b.position || (a.id < b.id ? -1 : 1))
        .forEach((e, i) => {
          e.position = i;
        });
    }
    bump(req.list_id);
    req.status = 'applied';
    req.decided_at = clockIso();
    return json({
      applied: true,
      taken: req.lines.reduce((n, l) => n + l.applied_quantity, 0)
    });
  }

  function declineRequest(user, args) {
    const { req, error } = decidable(user, args.p_id);
    if (error) return error;
    req.status = 'declined';
    req.decided_at = clockIso();
    return json(undefined, 204);
  }

  function markListRead(user, args) {
    if (!ownsList(user, args.p_list)) {
      return pgError(403, '42501', 'mark_list_read: not the owner of the list');
    }
    for (const n of db.notices) {
      if (n.list_id === args.p_list && n.read_at === null) n.read_at = clockIso();
    }
    for (const r of db.requests) {
      if (r.list_id === args.p_list && r.read_at === null) {
        r.read_at = clockIso();
        r.expires_at = new Date(
          Math.min(Date.parse(r.expires_at), Date.now() + HOUR)
        ).toISOString();
      }
    }
    return json(undefined, 204);
  }

  /* `create_print_set` (20261014120100_print_sets.sql): the entries' checks, the same sheet
     of one account answers its id, the set limit. */
  function createPrintSet(user, args) {
    const entries = args.p_entries;
    if (!printEntriesValid(entries) || JSON.stringify(entries).length > 16384) {
      return requestError('print set: bad entries');
    }
    const digest = JSON.stringify(
      entries.map((e) =>
        Object.fromEntries(Object.entries(e).sort(([a], [b]) => (a < b ? -1 : 1)))
      )
    );
    const held = db.prints.find((p) => p.owner_id === user && p.digest === digest);
    if (held) return json(held.id);
    const max = db.limits.print_sets_per_owner;
    if (db.prints.filter((p) => p.owner_id === user).length >= max) {
      return pgError(400, 'P0001', 'limit: print_sets_per_owner', String(max));
    }
    const id = 'P' + String(db.prints.length + 1).padStart(11, '0');
    db.prints.push({ id, owner_id: user, entries, digest });
    return json(id);
  }

  function rpcOf(user, name, args) {
    switch (name) {
      case 'create_purchase_request':
        return sendRequest(args);
      case 'apply_purchase_request':
        return applyRequest(user, args);
      case 'decline_purchase_request':
        return declineRequest(user, args);
      case 'mark_list_read':
        return markListRead(user, args);
      case 'create_print_set':
        return createPrintSet(user, args);
      case 'my_limit':
        return json(db.limits[args.p_key] ?? null);
      case 'apply_list_writes':
        return json(args.p_ops.map((op) => applyOp(user, op)));
      case 'get_homebrew_items':
        return json(
          db.items
            .filter((i) => args.p_ids.includes(i.id))
            .map((i) => ({ hid: i.id, item: recordFrom(i), ...(i.art ? { img: i.art } : {}) }))
        );
      case 'get_homebrew_item':
        return json(homebrewItemOf(user, args.p_id));
      case 'move_homebrew_items':
        return moveItems(user, args);
      case 'delete_homebrew_items': {
        const hit = db.items.filter((i) => args.p_ids.includes(i.id) && i.owner_id === user);
        for (const i of hit) dropItem(i);
        return json(hit.length);
      }
      case 'create_list_share': {
        const l = db.lists.find((x) => x.id === args.p_list && x.owner_id === user);
        if (!l) return pgError(403, '42501', 'create_list_share: not the owner of the list');
        let s = db.shares.find(
          (x) => x.list_id === l.id && x.audience === args.p_audience && x.revoked_at === null
        );
        if (!s) {
          tokens++;
          s = {
            id: `55555555-5555-4555-8555-${String(tokens).padStart(12, '0')}`,
            list_id: l.id,
            audience: args.p_audience,
            token: String.fromCharCode(64 + tokens).repeat(43),
            created_at: now(),
            revoked_at: null
          };
          db.shares.push(s);
        }
        return json([{ id: s.id, token: s.token }]);
      }
      case 'revoke_list_share': {
        const s = db.shares.find((x) => x.id === args.p_share);
        const l = s && db.lists.find((x) => x.id === s.list_id && x.owner_id === user);
        if (!l) return pgError(403, '42501', 'revoke_list_share: not the owner of the share');
        if (s.revoked_at === null) s.revoked_at = now();
        return new Response(null, { status: 204 });
      }
      case 'clone_shared_list': {
        const s = db.shares.find((x) => x.token === args.p_token && x.revoked_at === null);
        if (!s) return pgError(400, '22023', 'clone_shared_list: unknown link');
        const src = db.lists.find((x) => x.id === s.list_id);
        const r = createList(user, { ...src, id: args.p_id });
        if (r.code === '42501') {
          return pgError(403, '42501', 'clone_shared_list: the id belongs to another list');
        }
        if (r.code) return pgError(400, r.code, r.message, r.details);
        if (r.made) {
          const rows = entriesOf(src.id)
            .filter((e) => s.audience === 'gm' || !e.gm_only)
            .map((e, i) => ({
              ...e,
              id: `66666666-6666-4666-8666-${String(i).padStart(12, '0')}`
            }));
          insertEntries(r.list, rows);
        }
        return json(args.p_id);
      }
      case 'import_lists': {
        let count = 0;
        for (const row of args.p_lists) {
          const r = createList(user, row.list);
          if (r.code === '42501') {
            return pgError(403, '42501', 'import_lists: the id belongs to another list');
          }
          if (r.code) return pgError(400, r.code, r.message, r.details);
          if (r.made) count++;
          const err = insertEntries(r.list, row.entries);
          if (err) return pgError(400, err.code, err.message, err.details);
        }
        return json(count);
      }
      case 'import_homebrew':
        return importHomebrew(user, args);
      default:
        return pgError(404, 'PGRST202', 'no function ' + name);
    }
  }

  function tableOf(user, method, table, q, body, prefer) {
    const want = (prefer ?? '').includes('return=representation');
    if (HOMEBREW_TABLES[table]) return homebrewTable(user, method, table, q, body, prefer);
    if (table === 'list_entries' && method === 'GET') {
      const mine = new Set(own(user).map((l) => l.id));
      const rows = filtered(
        db.entries.filter((e) => mine.has(e.list_id)),
        q
      );
      return json(rows.map((e) => pick(e, q.get('select') ?? '*')));
    }
    if (REQUEST_TABLES[table]) return REQUEST_TABLES[table](user, method, q);
    if (table !== 'lists') return pgError(404, 'PGRST205', 'no table ' + table);
    const rows = filtered(own(user), q);
    if (method === 'GET') return json(rows.map((l) => project(l, q.get('select') ?? '*', q)));
    if (method === 'PATCH') {
      for (const l of rows) {
        Object.assign(l, body);
        bump(l.id);
      }
      return want ? json(rows.map((l) => project(l, q.get('select')))) : json(undefined, 204);
    }
    if (method === 'DELETE') {
      const out = rows.map((l) => project(l, q.get('select')));
      for (const l of rows) deleteList(l.id);
      return want ? json(out) : json(undefined, 204);
    }
    return pgError(405, 'PGRST000', 'method');
  }

  /* Storage (`homebrew-art`): an upload under the insert policy `homebrew_art_insert` (the
     room is `state.artRoom`), the same name again 400 with statusCode 409, and the public
     read. */
  async function storage(u, init) {
    const method = init.method ?? 'GET';
    const pub = '/storage/v1/object/public/homebrew-art/';
    const obj = '/storage/v1/object/homebrew-art/';
    state.calls.push({
      method,
      path: u.pathname,
      query: '',
      body: null,
      headers: new Headers(init.headers)
    });
    const injected = state.fail('storage', null, method, u.searchParams);
    if (injected) return injected;
    if (method === 'GET' && u.pathname.startsWith(pub)) {
      const file = state.storage.get(u.pathname.slice(pub.length));
      return file
        ? new Response(file.bytes, { status: 200 })
        : new Response('{}', { status: 400 });
    }
    if (method === 'POST' && u.pathname.startsWith(obj)) {
      const who = userOf(init);
      if (who.refused)
        return json({ statusCode: '403', error: 'Unauthorized', message: 'jwt' }, 400);
      const name = u.pathname.slice(obj.length);
      if (state.storage.has(name)) {
        return json(
          { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' },
          400
        );
      }
      if (!state.artRoom) {
        return json(
          {
            statusCode: '403',
            error: 'Unauthorized',
            message: 'new row violates row-level security policy'
          },
          400
        );
      }
      const bytes = new Uint8Array(await new Response(init.body).arrayBuffer());
      state.storage.set(name, { owner: who.user, bytes });
      return json({ Key: 'homebrew-art/' + name }, 200);
    }
    return new Response('{}', { status: 404 });
  }

  async function fetch(url, init = {}) {
    const u = new URL(String(url));
    if (String(url).startsWith(SUPA + '/storage/v1/')) return storage(u, init);
    if (!String(url).startsWith(SUPA + '/rest/v1/')) throw new Error('only Supabase: ' + url);
    const method = init.method ?? 'GET';
    const path = u.pathname.slice('/rest/v1/'.length);
    const body = init.body === undefined ? undefined : JSON.parse(init.body);
    const headers = new Headers(init.headers);
    state.calls.push({ method, path, query: u.search, body, headers });
    const name = path.startsWith('rpc/') ? path.slice(4) : path;
    const injected = state.fail(name, body, method, u.searchParams);
    if (injected) return injected;
    const who = userOf(init);
    if (who.refused) return pgError(401, 'PGRST301', 'JWT expired');
    if (state.ended)
      return pgError(403, '42501', 'api_client_guard: the session of this token has ended');
    if (state.guard)
      return pgError(403, '42501', 'api_client_guard: not allowed for a connected app');
    if (path.startsWith('rpc/')) return rpcOf(who.user, name, body);
    return tableOf(who.user, method, path, u.searchParams, body, headers.get('Prefer'));
  }

  /** Adds a list of `user` with `entries` (each `{ id, item_key, ... }`). */
  function seedList(list, entries = [], user = GM) {
    const at = now();
    const row = {
      name: '',
      money_mode: 'bag',
      player_note: '',
      gm_note: '',
      created_at: at,
      updated_at: at,
      revision: 1,
      ...list,
      owner_id: user
    };
    db.lists.push(row);
    entries.forEach((e, i) =>
      db.entries.push({
        list_id: row.id,
        source: 'official',
        hb_item: null,
        position: i,
        quantity: 1,
        price_coins: null,
        player_note: '',
        gm_note: '',
        gm_only: false,
        ...e
      })
    );
    return row;
  }

  return { state, fetch, seedList };
}
