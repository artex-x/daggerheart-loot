/*
  The read API's service layer: one async function per operation of
  docs/specs/CONTRACTS.md section 6, over the build-time projections (apidata/, read
  through the `assets` function) and the two Supabase reads (the `rpc` function, as the
  anon reader). The REST adapter (rest.mjs) and the MCP adapter (mcp.mjs) call it in process.

  Every rule here is a pure module of app/src/lib/, bundled into the worker: a roll
  builds the same index the panels build and calls the same functions (rollTables.ts
  `rowsOf`, std.ts `poolFor`, alt.ts `altPicks`, roll.ts), so the pool the API rolls
  over is the pool the app draws. It stores nothing.

  An operation returns `{ body, etag? }`: `etag` is the `data_version` of the files the
  answer read, so the adapter can answer 304; an answer without one is `no-store`. A
  failure throws an ApiError.
*/
import { apiRecord } from '../../app/src/lib/apiRecord.ts';
import { parseBundle } from '../../app/src/lib/bundle.ts';
import { itemOf, sharedListOf, snapshotRecords } from '../../app/src/lib/cloudLists.ts';
import { buildIndex } from '../../app/src/lib/data.ts';
import { dict } from '../../app/src/lib/dict.ts';
import { EQ_TABLE, decodeFilter, groupsFor, passes } from '../../app/src/lib/filters.ts';
import { SECTION_SLUG, TABLE_SLUG, recordUrl } from '../../app/src/lib/hash.ts';
import { isHomebrewKey, withRecords } from '../../app/src/lib/homebrew.ts';
import { parseHomebrew } from '../../app/src/lib/homebrewFile.ts';
import {
  homebrewErrorLines,
  homebrewNoteLines,
  homebrewRefusal
} from '../../app/src/lib/homebrewReport.ts';
import {
  lineText,
  listsErrorReport,
  listsRefusal,
  skipLine
} from '../../app/src/lib/importReport.ts';
import { rankHits } from '../../app/src/lib/search.ts';
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
/** The index built from each cached roll file, kept as long as the cache keeps the file. */
const ROLL_INDEX = new WeakMap();
/** The set of catalog ids built from each cached records index. */
const CATALOG_IDS = new WeakMap();
/** The sets and rule cards of each cached file-check file, as objects the panel's `in` reads. */
const CATALOG_KEYS = new WeakMap();

/** Empties the isolate's cached files (tests). */
export function clearCache() {
  SHARED_CACHE.clear();
}

/**
 * Splits the text of a catalog chunk once: line 0 is the head that holds `data_version`,
 * line `l + 1` is record `l` (tools/api-data.mjs `chunkText`). Returns `null` when the text
 * has no such head.
 */
function splitChunk(text) {
  const lines = text.split('\n');
  const dv = /"data_version":"([^"]*)"/.exec(lines[0] ?? '')?.[1];
  return dv === undefined ? null : { dv, lines };
}

/** Returns record `pos` of a split chunk when its `id` is `id`, else null. Parses one line. */
function recordAt(chunk, pos, id) {
  if (!Number.isInteger(pos) || pos < 0) return null;
  const line = chunk.lines[pos + 1];
  if (typeof line !== 'string' || line === ']}' || line === '') return null;
  try {
    const record = JSON.parse(line.endsWith(',') ? line.slice(0, -1) : line);
    return record.id === id ? record : null;
  } catch {
    return null;
  }
}

/** Returns a table row without its build-time facet values `f`. */
function withoutFacets(row) {
  if (!has(row, 'f')) return row;
  const copy = { ...row };
  delete copy.f;
  return copy;
}

/* ---------- search ---------- */

/** The most lines a search keeps to rank, and the most anchor hits it scans (D10). */
export const KEPT_MAX = 300;
export const POSITIONS_MAX = 3000;
/** The most bytes of a file the file check reads. */
export const FILE_CHECK_MAX = 32768;
/** The most lines a file check answers; `more` counts the rest (the parse's ERRORS_MAX). */
const LINES_MAX = 50;

const CODE_BASE = 0x30;
const CODE_FIELDS = ['source', 'kind', 'table', 'tier', 'rarity'];
const CODES = CODE_FIELDS.length;

/** Returns the 413 of a file past the file check's cap; the REST and the MCP path share it. */
export const fileTooLarge = () =>
  new ApiError(
    413,
    'too_large',
    `The file is past ${String(FILE_CHECK_MAX)} bytes. Check a longer file in the app's import, which reads up to 5 MB.`
  );

const tooBroad = () =>
  new ApiError(
    400,
    'too_broad',
    'The query q matches too many records to rank. Add a longer word or a filter (kind, source, table, tier or rarity).'
  );

/**
 * Returns the strings of which a field must hold one to answer a term (the necessary
 * condition of `hitsAny` in search.ts): the term's text, or the stem prefix when that is a
 * substring of the text or another string.
 */
function needlesOf(t) {
  if (t.stemPrefix === null) return [t.text];
  return t.text.includes(t.stemPrefix) ? [t.stemPrefix] : [t.text, t.stemPrefix];
}

/**
 * Prepares the text of a search shard once per cache period: the start offset of each record
 * line and, filled when a line is read, its folded-names part. Returns null when the text
 * has no head with a data_version.
 */
function prepareShard(body) {
  const nl = body.indexOf('\n');
  const dv = /"data_version":"([^"]*)"/.exec(nl < 0 ? '' : body.slice(0, nl))?.[1];
  if (dv === undefined) return null;
  const starts = [];
  for (let at = nl + 1; at < body.length;) {
    starts.push(at);
    const end = body.indexOf('\n', at);
    at = end < 0 ? body.length : end + 1;
  }
  return { data_version: dv, text: body, starts, names: new Array(starts.length) };
}

/** Returns the end offset of record line `li` of a prepared shard, before its newline. */
const lineEnd = (shard, li) =>
  li + 1 < shard.starts.length ? shard.starts[li + 1] - 1 : shard.text.length - 1;

/** Returns the folded-names part of record line `li`: the Russian and English names, TAB-joined. */
function namesPart(shard, li) {
  let part = shard.names[li];
  if (part === undefined) {
    const from = shard.starts[li] + CODES;
    const first = shard.text.indexOf('\t', from);
    const second = shard.text.indexOf('\t', first + 1);
    part = shard.text.slice(from, second);
    shard.names[li] = part;
  }
  return part;
}

/** Returns whether the code characters of record line `li` are in the sets of `allow`. */
function passesCodes(shard, li, allow) {
  const at = shard.starts[li];
  for (let k = 0; k < CODES; k++) {
    const set = allow[k];
    if (set !== null && !set.has(shard.text.charCodeAt(at + k) - CODE_BASE)) return false;
  }
  return true;
}

/**
 * Returns the lines of the shards that answer every term, as `{ shard, li }` in line order:
 * the most selective term (the one whose shortest needle is longest) is found with `indexOf`,
 * and each other term only has to occur in the line's folded names. Throws `too_broad` past
 * KEPT_MAX kept lines or POSITIONS_MAX hits of the anchor.
 */
function scanShards(shards, terms, allow) {
  const needles = terms.map(needlesOf);
  let anchor = 0;
  const shortest = (list) => Math.min(...list.map((n) => n.length));
  needles.forEach((list, i) => {
    if (shortest(list) > shortest(needles[anchor])) anchor = i;
  });
  const others = needles.filter((_, i) => i !== anchor);
  const kept = [];
  let positions = 0;
  for (const shard of shards) {
    const found = new Set();
    for (const needle of needles[anchor]) {
      let li = 0;
      for (
        let at = shard.text.indexOf(needle);
        at !== -1;
        at = shard.text.indexOf(needle, at + 1)
      ) {
        if (++positions > POSITIONS_MAX) throw tooBroad();
        if (at < shard.starts[0]) continue;
        while (li + 1 < shard.starts.length && shard.starts[li + 1] <= at) li++;
        if (at < shard.starts[li] + CODES || found.has(li)) continue;
        const part = namesPart(shard, li);
        if (at >= shard.starts[li] + CODES + part.length) continue;
        if (!passesCodes(shard, li, allow)) continue;
        if (!others.every((list) => list.some((n) => part.includes(n)))) continue;
        found.add(li);
        if (kept.length + found.size > KEPT_MAX) throw tooBroad();
      }
    }
    for (const li of [...found].sort((a, b) => a - b)) kept.push({ shard, li });
  }
  return kept;
}

/**
 * Returns the operations.
 *
 * @param deps.assets Reads one published file and returns its parsed JSON; throws when it
 *   cannot (a path under apidata/, api/v1/catalog/, or names.json).
 * @param deps.text Reads one published file and returns its text; throws when it cannot
 *   (a catalog chunk, which is read one line at a time).
 * @param deps.rpc Reads a Supabase function as the anon reader: `(name, args, max)`
 *   answers `{ value }` or `{ fail: 'big' | ... }`.
 * @param deps.random The source of randomness of a roll.
 * @param deps.site The `ApiSite` the links and pictures are built on.
 * @param deps.cache The isolate's cached files; one shared map by default.
 * @param deps.now The clock, in ms.
 * @param deps.build Builds the index of a roll file (tests count its calls).
 */
export function createService({
  assets,
  text,
  rpc,
  random = Math.random,
  site,
  cache = SHARED_CACHE,
  now = Date.now,
  build = buildIndex
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

  /** Returns the split chunk `n`; a failed read or a text without a head is a 503. */
  async function readChunk(n) {
    let body;
    try {
      body = await text(chunkPath(n));
    } catch {
      throw unavailable('A data file');
    }
    const chunk = typeof body === 'string' ? splitChunk(body) : null;
    if (chunk === null) throw unavailable('A data file');
    return chunk;
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
  async function getTable(id, part, filter) {
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
    let rows =
      part !== undefined && !file.part ? file.rows.filter((r) => r.part === part) : file.rows;
    /* A group the table does not offer is ignored, as the tables page ignores it. */
    const groups = filter === undefined ? [] : groupsFor(table);
    if (groups.length) {
      const state = decodeFilter(filter, groups);
      rows = rows.filter((r) => passes(state, groups, (g) => r.f?.[g] ?? ''));
    }
    /* `f` is the build's facet values for the filter; it never reaches an answer. */
    rows = rows.map(withoutFacets);
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
    let record = null;
    const [, head] = await consistent(async (force) => {
      const idx = await cached('apidata/records/index.json', force);
      const n = idx.chunks.findIndex((ids) => ids.includes(id));
      if (n < 0) throw notFound('The record');
      const chunk = await readChunk(n);
      record = recordAt(chunk, idx.chunks[n].indexOf(id), id);
      return { files: [idx, { data_version: chunk.dv }], ok: record !== null };
    });
    return { body: record, etag: head.data_version };
  }

  /* ---------- search ---------- */

  /** Returns the prepared shard `n`, kept for CACHE_MS; `force` reads it again. */
  async function cachedShard(n, force) {
    const path = `apidata/search/${String(n)}.txt`;
    const hit = cache.get(path);
    if (!force && hit && now() - hit.at < CACHE_MS) return hit.file;
    let body;
    try {
      body = await text(path);
    } catch {
      throw unavailable('A data file');
    }
    const file = typeof body === 'string' ? prepareShard(body) : null;
    if (file === null) throw unavailable('A data file');
    cache.set(path, { file, at: now() });
    return file;
  }

  /**
   * Searches the catalog by name and facets. `input` is the checked REST input: `terms` (the
   * parsed `q`, possibly none) and the facets `kind`, `source`, `table`, `tier` and `rarity`,
   * with `limit` rows kept.
   */
  async function searchRecords(input) {
    const { terms, limit } = input;
    const [head, ...shards] = await consistent(async (force) => {
      const idx = await cached('apidata/search/index.json', force);
      if (!Number.isInteger(idx.shards) || idx.shards < 1 || !isObject(idx.codes)) {
        throw unavailable('A data file');
      }
      const list = await Promise.all(
        Array.from({ length: idx.shards }, (_, n) => cachedShard(n, force))
      );
      return { files: [idx, ...list] };
    });
    const { codes } = head;
    if (input.source !== undefined && !codes.source.some((s) => s.id === input.source)) {
      throw new ApiError(
        400,
        'bad_request',
        'The field source is not a source id of the catalog.'
      );
    }
    const allow = CODE_FIELDS.map(() => null);
    /* A facet becomes the set of code numbers whose value matches; two facets that name one
       field (kind and table) intersect. */
    const narrow = (field, test) => {
      const k = CODE_FIELDS.indexOf(field);
      const set = new Set();
      codes[field].forEach((v, i) => {
        if (test(v) && (allow[k] === null || allow[k].has(i))) set.add(i);
      });
      allow[k] = set;
    };
    if (input.kind !== undefined) narrow('kind', (v) => v === input.kind);
    if (input.source !== undefined) narrow('source', (v) => v.id === input.source);
    if (input.tier !== undefined) narrow('tier', (v) => String(v) === input.tier);
    if (input.rarity !== undefined) narrow('rarity', (v) => v === input.rarity);
    if (input.table !== undefined) {
      const table = tableOf(input.table);
      const gear = EQ_TABLE[table];
      if (gear) {
        narrow('kind', (v) => v === gear);
      } else if (table === 'alt_item' || table === 'alt_consumable') {
        narrow('kind', (v) => v === (table === 'alt_item' ? 'item' : 'consumable'));
        narrow('rarity', (v) => v !== null);
      } else {
        narrow('table', (v) => v === table);
      }
    }
    let total = 0;
    const picked = [];
    if (allow.every((set) => set === null || set.size > 0)) {
      if (terms.length) {
        /* A term with a TAB or a line break cannot occur in a name; it would only match across
           the fields of a line. */
        const kept = terms.some((t) => /[\t\n]/.test(t.text))
          ? []
          : scanShards(shards, terms, allow);
        const hay = ({ shard, li }) => {
          const part = namesPart(shard, li);
          const tab = part.indexOf('\t');
          return { names: [part.slice(0, tab), part.slice(tab + 1)], texts: [] };
        };
        const ranked = rankHits(kept, terms, undefined, hay);
        total = ranked.length;
        picked.push(...ranked.slice(0, limit));
      } else {
        for (const shard of shards) {
          for (let li = 0; li < shard.starts.length; li++) {
            if (!passesCodes(shard, li, allow)) continue;
            total++;
            if (picked.length < limit) picked.push({ shard, li });
          }
        }
      }
    }
    const rows = picked.map(({ shard, li }) => {
      const at = shard.starts[li];
      const [, , id, v, ru, en] = shard.text.slice(at, lineEnd(shard, li)).split('\t');
      const value = (field, k) => codes[field][shard.text.charCodeAt(at + k) - CODE_BASE];
      const version = v || undefined;
      return {
        id,
        name: { ru, en },
        kind: value('kind', 1),
        source: value('source', 0),
        table: value('table', 2),
        tier: value('tier', 3),
        rarity: value('rarity', 4),
        link: {
          ru: recordUrl(site, id, 'ru', version),
          en: recordUrl(site, id, 'en', version)
        }
      };
    });
    return {
      body: {
        format: 'daggerheart-loot/api-search',
        version: 1,
        data_version: head.data_version,
        total,
        rows
      },
      etag: head.data_version
    };
  }

  /* ---------- file checks ---------- */

  /** Returns the catalog ids of a cached records index as a set, built once per cached file. */
  function idsOf(idx) {
    let ids = CATALOG_IDS.get(idx);
    if (ids === undefined) {
      ids = new Set(idx.chunks.flat());
      CATALOG_IDS.set(idx, ids);
    }
    return ids;
  }

  /**
   * Checks the text of an import file with the app's own parsers and report builders, over
   * the catalog alone: no account, so a homebrew entry without a snapshot is `unheld` and a
   * lists error line names its entry by item id only.
   */
  async function checkFile(body) {
    const [idx, data] = await consistent(async (force) => ({
      files: [
        await cached('apidata/records/index.json', force),
        await cached('apidata/file-check.json', force)
      ]
    }));
    const ids = idsOf(idx);
    let keys = CATALOG_KEYS.get(data);
    if (keys === undefined) {
      keys = {
        sets: Object.fromEntries(data.sets.map((k) => [k, true])),
        refs: Object.fromEntries(data.refs.map((k) => [k, true]))
      };
      CATALOG_KEYS.set(data, keys);
    }
    const { sets, refs } = keys;
    const ctx = {
      catalogHas: (id) => ids.has(id),
      catalogSet: (key) => key in sets,
      catalogRef: (key) => key in refs,
      ownItem: () => false,
      ownCard: () => null,
      lineMembers: (line) => (has(data.lines, line) ? data.lines[line] : [])
    };
    const langs = [dict('ru'), dict('en')];
    const none = () => undefined;
    const NO_FILE = { format: null, version: null };
    const answer = (file, ok, reason, message, lines, more, counts) => ({
      body: {
        format: 'daggerheart-loot/api-file-check',
        version: 1,
        file,
        ok,
        reason,
        message,
        lines,
        more,
        counts
      }
    });
    /* The file's own `version` when it is an integer; the parsers do not return it. */
    let doc = null;
    try {
      doc = JSON.parse(body);
    } catch {
      /* not JSON: the lists parser says so */
    }
    const versionOf = () => (Number.isInteger(doc?.version) ? doc.version : null);
    /* A refusal's text in both languages; `%s` takes the version as JSON. */
    const refusal = (file, reason, { key, version }) =>
      answer(
        file,
        false,
        reason,
        {
          ru: langs[0][key].replace('%s', () => version ?? ''),
          en: langs[1][key].replace('%s', () => version ?? '')
        },
        [],
        0,
        null
      );
    /* The lines of two reports of one file, one per language, as `{ list, text }`. */
    const merged = (ru, en, list) =>
      ru.map((l, i) => ({ list: list(i), text: { ru: lineText(l), en: lineText(en[i]) } }));

    const lists = parseBundle(body, (id) => ids.has(id));
    if (lists.ok || lists.reason !== 'notBundle') {
      if (!lists.ok && lists.reason === 'notJson') {
        return refusal(NO_FILE, 'not_json', { key: 'importNotJson' });
      }
      const file = { format: 'daggerheart-loot/lists', version: versionOf() };
      if (lists.ok) {
        /* Past LINES_MAX the lines only cost CPU: the count says how many there are. */
        const shown = lists.skipped.slice(0, LINES_MAX);
        const [ru, en] = langs.map((t) => shown.map((s) => skipLine(s, t, none)));
        return answer(
          file,
          true,
          null,
          null,
          merged(ru, en, (i) => shown[i].list),
          lists.skipped.length - shown.length,
          {
            lists: lists.lists.length,
            entries: lists.lists.reduce((n, l) => n + l.entries.length, 0),
            skipped: lists.skipped.length
          }
        );
      }
      if (lists.reason === 'errors') {
        const [ru, en] = langs.map((t) => listsErrorReport(lists.errors, lists.names, t, none));
        const own = merged(ru.file, en.file, () => null);
        const blocks = ru.lists.flatMap((block, b) =>
          merged(block.lines, en.lists[b].lines, () => block.index)
        );
        return answer(file, false, 'errors', null, [...own, ...blocks], lists.more, null);
      }
      return refusal(
        file,
        lists.reason === 'version' ? 'version' : 'empty',
        listsRefusal(lists)
      );
    }

    const hb = parseHomebrew(body, ctx);
    if (!hb.ok && hb.reason === 'notHomebrew') {
      return answer(
        NO_FILE,
        false,
        'unknown_format',
        {
          ru: `${langs[0].importNotBundle} ${langs[0].hbImportNotFile}`,
          en: `${langs[1].importNotBundle} ${langs[1].hbImportNotFile}`
        },
        [],
        0,
        null
      );
    }
    const file = { format: 'daggerheart-loot/homebrew', version: versionOf() };
    if (hb.ok) {
      const notes = hb.notes.slice(0, LINES_MAX);
      const [ru, en] = langs.map((t, i) =>
        homebrewNoteLines(notes, hb.file, t, i === 0 ? 'ru' : 'en', new Map())
      );
      return answer(
        file,
        true,
        null,
        null,
        merged(ru, en, () => null),
        hb.notes.length - notes.length,
        {
          books: hb.file.books.length,
          sections: hb.file.books.reduce((n, b) => n + (b.sections?.length ?? 0), 0),
          cards: hb.file.cards.length,
          items: hb.file.items.length
        }
      );
    }
    if (hb.reason === 'errors') {
      const [ru, en] = langs.map((t, i) =>
        homebrewErrorLines(hb.errors, doc, hb.names, t, i === 0 ? 'ru' : 'en')
      );
      return answer(
        file,
        false,
        'errors',
        null,
        merged(ru, en, () => null),
        hb.more,
        null
      );
    }
    return refusal(file, hb.reason === 'version' ? 'version' : 'empty', homebrewRefusal(hb));
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
      const path = `apidata/roll/${rollIdOf(section)}.json`;
      const data = await cached(path, attempt > 0);
      let index = ROLL_INDEX.get(data);
      if (index === undefined) {
        index = build(data);
        ROLL_INDEX.set(data, index);
      }
      const drawn = rolled(section, mode, index, input);
      const wanted = [...new Set(drawn.results.map((r) => r.it.c))];
      const chunks = await Promise.all(wanted.map((c) => readChunk(c)));
      const byChunk = new Map(wanted.map((c, i) => [c, chunks[i]]));
      const records = drawn.results.map((r) => {
        const chunk = byChunk.get(r.it.c);
        return chunk ? recordAt(chunk, r.it.l, r.it.id) : null;
      });
      const same = chunks.every((c) => c.dv === data.data_version);
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
    searchRecords,
    getRecord,
    checkFile,
    getHomebrewItem,
    getSharedList
  };
}
