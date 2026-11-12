/*
  The read API's service layer: one async function per operation of
  docs/specs/CONTRACTS.md section 6, over the build-time projections (apidata/, read
  through the `assets` function) and the two Supabase reads (the `rpc` function, as the
  anon reader). The REST adapter (rest.mjs) calls it in process; B2's MCP adapter will too.

  Every rule here is a pure module of app/src/lib/, bundled into the worker: a roll
  builds the same index the panels build and calls the same functions (rollTables.ts
  `rowsOf`, std.ts `poolFor`, alt.ts `altPicks`, roll.ts), so the pool the API rolls
  over is the pool the app draws. It stores nothing.

  An operation returns `{ body, etag? }`: `etag` is the `data_version` of the files the
  answer read, so the adapter can answer 304; an answer without one is `no-store`. A
  failure throws an ApiError.
*/
import { apiRecord } from '../../app/src/lib/apiRecord.ts';
import { itemOf, sharedListOf, snapshotRecords } from '../../app/src/lib/cloudLists.ts';
import { buildIndex } from '../../app/src/lib/data.ts';
import { dict } from '../../app/src/lib/dict.ts';
import { SECTION_SLUG, TABLE_SLUG } from '../../app/src/lib/hash.ts';
import { isHomebrewKey, withRecords } from '../../app/src/lib/homebrew.ts';
import { altPicks, bumpUp } from '../../app/src/lib/alt.ts';
import {
  CORE_MAX,
  clamp,
  die,
  isCrit,
  pick,
  rollDuality,
  rollPool
} from '../../app/src/lib/roll.ts';
import { PICKER_ROLL, ROLL_MODES, rowsOf } from '../../app/src/lib/rollTables.ts';
import { poolFor } from '../../app/src/lib/std.ts';
import { SECTIONS, TABLE_IDS } from '../../app/src/lib/types.ts';

/** How long the isolate keeps a cached file: the cards' names.json rule. */
export const CACHE_MS = 600000;
/** The most bytes of a Supabase answer the service reads (`ITEM_MAX` of worker.mjs). */
export const RPC_MAX = 65536;

const has = (o, k) => o != null && typeof o === 'object' && Object.hasOwn(o, k);
const isObject = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);

/** A refusal with its HTTP status and stable `code` (docs/specs/CONTRACTS.md section 6). */
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const unavailable = (what) =>
  new ApiError(503, 'unavailable', `${what} could not be read. Try again later.`);
const notFound = (what) => new ApiError(404, 'not_found', `${what} does not exist.`);

/** The roll sections by the ids that name them: the URL id and the old id. */
const ROLL_SECTION_OF = new Map(
  SECTIONS.filter((s) => s.startsWith('roll/')).flatMap((s) => [
    [(SECTION_SLUG[s] ?? s).slice(5), s],
    [s.slice(5), s]
  ])
);
/** The catalog tables by the ids that name them: the URL id, the old id and the alias. */
const TABLE_OF = new Map(
  TABLE_IDS.filter((t) => t !== 'homebrew').flatMap((t) => [
    [TABLE_SLUG[t] ?? t, t],
    [t, t],
    ...(t === 'other_frames' ? [['frames', t]] : [])
  ])
);

/** Returns the roll section a section id names, or null. */
export const rollSectionOf = (id) => ROLL_SECTION_OF.get(id) ?? null;
/** Returns the catalog table a table id names, or null. */
export const tableOf = (id) => TABLE_OF.get(id) ?? null;
/** Returns the URL id of a roll section. */
export const rollIdOf = (section) => (SECTION_SLUG[section] ?? section).slice(5);
/** Returns the roll mode of a roll section. */
export const modeOf = (section) => ROLL_MODES[section];

const SHARED_CACHE = new Map();

/** Empties the isolate's cached files (tests). */
export function clearCache() {
  SHARED_CACHE.clear();
}

/**
 * Returns the operations.
 *
 * @param deps.assets Reads one published file and returns its parsed JSON; throws when it
 *   cannot (a path under apidata/, api/v1/catalog/, or names.json).
 * @param deps.rpc Reads a Supabase function as the anon reader: `(name, args, max)`
 *   answers `{ value }` or `{ fail: 'big' | ... }`.
 * @param deps.random The source of randomness of a roll.
 * @param deps.site The `ApiSite` the links and pictures are built on.
 * @param deps.cache The isolate's cached files; one shared map by default.
 * @param deps.now The clock, in ms.
 */
export function createService({
  assets,
  rpc,
  random = Math.random,
  site,
  cache = SHARED_CACHE,
  now = Date.now
}) {
  async function read(path) {
    let file;
    try {
      file = await assets(path);
    } catch {
      throw unavailable('A data file');
    }
    const versioned = path !== 'names.json';
    if (
      !isObject(file) ||
      (versioned && typeof file.data_version !== 'string') ||
      (!versioned && (file.format !== 'daggerheart-loot/names' || !isObject(file.items)))
    ) {
      throw unavailable('A data file');
    }
    return file;
  }

  /** Returns a file kept for CACHE_MS; `force` reads it again. */
  async function cached(path, force = false) {
    const hit = cache.get(path);
    if (!force && hit && now() - hit.at < CACHE_MS) return hit.file;
    const file = await read(path);
    cache.set(path, { file, at: now() });
    return file;
  }

  /**
   * Returns the files `load(force)` reads once they agree on one `data_version`. A cached
   * file and a fresh one can come from two deployments (an isolate outlives a deploy): the
   * first mismatch reads the cached ones again, a second answers 503.
   */
  async function consistent(load) {
    for (let force = false; ; force = true) {
      const { files, ok = true } = await load(force);
      if (ok && new Set(files.map((f) => f.data_version)).size === 1) return files;
      if (force) throw unavailable('The data files');
    }
  }

  const chunkPath = (n) => `api/v1/catalog/${String(n)}.json`;

  /* ---------- the lists ---------- */

  async function listRolls() {
    const file = await cached('apidata/rolls.json');
    return { body: file, etag: file.data_version };
  }

  async function listTables() {
    const file = await cached('apidata/tables.json');
    return { body: file, etag: file.data_version };
  }

  /**
   * Returns one table's rows. `part` filters a table that has parts and is required on an
   * equipment table (the adapter has refused a missing one by then).
   */
  async function getTable(id, part) {
    const table = tableOf(id);
    if (table === null) throw notFound('The table');
    const [, file] = await consistent(async (force) => {
      const list = await cached('apidata/tables.json', force);
      const entry = list.tables.find((t) => t.id === (TABLE_SLUG[table] ?? table));
      if (!entry) throw notFound('The table');
      if (entry.part_required && part === undefined) {
        const ids = entry.parts.map((p) => p.id).join(', ');
        throw new ApiError(
          400,
          'bad_request',
          `The field part is required on this table. Use one of: ${ids}.`
        );
      }
      if (part !== undefined && !entry.parts.some((p) => p.id === part)) {
        throw notFound('The part');
      }
      const url = TABLE_SLUG[table] ?? table;
      const data = await read(
        entry.part_required ? `apidata/table/${url}/${part}.json` : `apidata/table/${url}.json`
      );
      return { files: [list, data] };
    });
    const rows =
      part !== undefined && !file.part ? file.rows.filter((r) => r.part === part) : file.rows;
    const body = {
      format: file.format,
      version: file.version,
      data_version: file.data_version,
      table: file.table,
      ...(part !== undefined ? { part } : {}),
      rows
    };
    return { body, etag: file.data_version };
  }

  /* ---------- a catalog record ---------- */

  async function getRecord(id) {
    const [, chunk] = await consistent(async (force) => {
      const idx = await cached('apidata/records/index.json', force);
      const n = idx.chunks.findIndex((ids) => ids.includes(id));
      if (n < 0) throw notFound('The record');
      const data = await read(chunkPath(n));
      return { files: [idx, data], ok: data.records.some((r) => r.id === id) };
    });
    return { body: chunk.records.find((r) => r.id === id), etag: chunk.data_version };
  }

  /* ---------- rolls ---------- */

  /** Returns the rolled rows as `{ it, n, col? }` and the dice of the answer. */
  function rolled(section, mode, index, input) {
    if (mode === 'std') {
      let dice;
      let total;
      if (input.total !== undefined) {
        total = input.total;
        dice = { kind: 'typed', total };
      } else {
        const faces = Array.from({ length: input.dice }, () => die(12, random));
        total = clamp(
          faces.reduce((a, b) => a + b, 0),
          1,
          CORE_MAX
        );
        dice = { kind: 'nd12', count: input.dice, faces, total };
      }
      const sources = {
        core: input.sources.includes('core'),
        hnf: input.sources.includes('hnf')
      };
      const kinds = {
        item: input.kinds.includes('item'),
        consumable: input.kinds.includes('consumable')
      };
      return {
        dice,
        results: poolFor(index, total, sources, kinds).map((it) => ({ it, n: total }))
      };
    }
    if (mode === 'alt') {
      const duality =
        input.hope !== undefined ? { hope: input.hope, fear: input.fear } : rollDuality(random);
      const crit = isCrit(duality);
      const kinds = {
        item: input.kinds.includes('item'),
        consumable: input.kinds.includes('consumable')
      };
      const bump = crit ? bumpUp(input.rarity) : null;
      return {
        dice: { kind: 'duality', hope: duality.hope, fear: duality.fear, crit },
        bump: bump ? { rarity: bump.to } : undefined,
        results: altPicks(index, input.rarity, duality, kinds).map((p) => ({
          it: p.it,
          n: p.n,
          col: p.col
        }))
      };
    }
    let part;
    if (mode === 'part') {
      const parts = PICKER_ROLL[section]?.parts(dict('en'), 'en', index).map((p) => p.id) ?? [];
      if (!parts.includes(input.part)) throw notFound('The part');
      part = input.part;
    }
    const pool = rollPool(rowsOf(section, index, part));
    const max = pool.length;
    if (max === 0) throw unavailable('The roll data');
    if (input.value !== undefined && input.value > max) {
      throw new ApiError(
        400,
        'bad_request',
        `The field value must be an integer from 1 to ${String(max)} for this ${mode === 'part' ? 'part' : 'section'}.`
      );
    }
    const value = input.value ?? pick(max, random);
    const it = pool[value - 1];
    return { dice: { kind: 'pick', max, value }, part, results: it ? [{ it, n: value }] : [] };
  }

  async function roll(sectionId, input) {
    const section = rollSectionOf(sectionId);
    if (section === null) throw notFound('The roll section');
    const mode = ROLL_MODES[section];
    for (let attempt = 0; ; attempt++) {
      const data = await read(`apidata/roll/${rollIdOf(section)}.json`);
      const index = buildIndex(data);
      const drawn = rolled(section, mode, index, input);
      const wanted = [...new Set(drawn.results.map((r) => r.it.c))];
      const chunks = await Promise.all(wanted.map((c) => read(chunkPath(c))));
      const byChunk = new Map(wanted.map((c, i) => [c, chunks[i]]));
      const records = drawn.results.map((r) =>
        byChunk.get(r.it.c)?.records.find((x) => x.id === r.it.id)
      );
      const same = chunks.every((c) => c.data_version === data.data_version);
      if (same && records.every(Boolean)) {
        return {
          body: {
            format: 'daggerheart-loot/api-roll',
            version: 1,
            section: rollIdOf(section),
            ...(drawn.part !== undefined ? { part: drawn.part } : {}),
            dice: drawn.dice,
            ...(drawn.bump ? { bump: drawn.bump } : {}),
            results: drawn.results.map((r, i) => ({
              record: records[i],
              n: r.n,
              ...(r.col ? { col: r.col } : {})
            }))
          }
        };
      }
      if (attempt > 0) throw unavailable('The data files');
    }
  }

  /* ---------- homebrew ---------- */

  async function baseIndex(force) {
    const cards = await cached('apidata/cards.json', force);
    const index = buildIndex({
      items: { set_members: cards.members },
      refs: cards.refs,
      sets: cards.sets
    });
    return { cards, index };
  }

  /** Reads an RPC; a missing answer is 404, a too big one 422, a failure 503. */
  async function remote(name, args, what, app) {
    const got = await rpc(name, args, RPC_MAX);
    if (got.fail === 'big') {
      throw new ApiError(
        422,
        'answer_too_large',
        `${what} is too large for the API. Open it in the app: ${app}`
      );
    }
    if (got.fail) throw unavailable(what);
    if (got.value === null) throw notFound(what);
    return got.value;
  }

  async function getHomebrewItem(id) {
    const value = await remote(
      'get_homebrew_item',
      { p_id: id },
      'The homebrew item',
      `${site.base}h/${id}`
    );
    const item = itemOf(value);
    if (!item) throw unavailable('The homebrew item');
    const { index: base } = await baseIndex(false);
    const index = withRecords(base, [item.record, ...item.related], []);
    return { body: apiRecord(index, item.record, site, 'owner') };
  }

  async function getSharedList(token) {
    const value = await remote(
      'get_shared_list',
      { p_token: token },
      'The shared list',
      `${site.base}s/${token}`
    );
    if (
      !isObject(value) ||
      !Array.isArray(value.entries) ||
      !isObject(value.list) ||
      (value.audience !== 'player' && value.audience !== 'gm')
    ) {
      throw unavailable('The shared list');
    }
    const [{ index: base }, names] = await Promise.all([
      baseIndex(false),
      cached('names.json')
    ]);
    const records = snapshotRecords(value);
    const index = withRecords(base, [], records);
    const recordOf = new Map(records.map((r) => [r.id, r]));
    const knows = (key) => (isHomebrewKey(key) ? recordOf.has(key) : has(names.items, key));
    const list = sharedListOf(value, knows);
    const gm = value.audience === 'gm';
    const entries = value.entries
      .filter((e) => knows(e.item_key))
      .map((e) => {
        const homebrew = e.source === 'homebrew';
        const entry = {
          id: homebrew ? String(e.hid ?? e.item_key) : e.item_key,
          key: e.item_key,
          origin: homebrew ? 'homebrew' : 'catalog',
          count: e.quantity,
          price_coins: e.price_coins ?? null,
          note: e.player_note ?? ''
        };
        if (gm) {
          entry.gm_note = e.gm_note ?? '';
          entry.gm_only = e.gm_only === true;
        }
        if (homebrew) {
          entry.record = apiRecord(index, recordOf.get(e.item_key), site, 'owner');
        } else {
          const pair = names.items[e.item_key];
          entry.name = { ru: pair[0] || pair[1], en: pair[1] };
        }
        return entry;
      });
    return {
      body: {
        format: 'daggerheart-loot/api-shared-list',
        version: 1,
        audience: value.audience,
        name: list.name,
        money_mode: value.list.money_mode,
        note: list.note ?? '',
        ...(gm ? { gm_note: list.hnote ?? '' } : {}),
        dropped: list.dropped,
        entries
      }
    };
  }

  return {
    listRolls,
    roll,
    listTables,
    getTable,
    getRecord,
    getHomebrewItem,
    getSharedList
  };
}
