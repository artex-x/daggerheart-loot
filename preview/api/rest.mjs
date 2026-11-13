/*
  The read API's REST adapter (`/api/v1/*`, docs/specs/CONTRACTS.md section 6): routes by
  the paths of openapi.json, checks each parameter and body by hand, calls the service
  (service.mjs) and answers JSON through its own responder. It never calls `answer()` or
  `failed()` of worker.mjs, which send text/html, and it catches every thrown error as the
  JSON 503.

  Every answer under /api/ carries `Access-Control-Allow-Origin: *`, none carries
  `Access-Control-Allow-Credentials`, and a T0 answer never reads `Authorization`: every
  Supabase read runs as the anon reader, so the answer never depends on the caller.
  /api/v1/me/ is reserved for the account tier and answers the 404 below.
*/
import { artBaseOf } from '../../app/src/lib/art.ts';
import { RARITIES } from '../../app/src/lib/alt.ts';
import { ROLL_MODES } from '../../app/src/lib/rollTables.ts';
import { parseQuery } from '../../app/src/lib/search.ts';
import openapi from './openapi.json' with { type: 'json' };
import { drop, readJson, readText, rpc } from './read.mjs';
import {
  ApiError,
  FILE_CHECK_MAX,
  clearCache,
  createService,
  fileTooLarge,
  rollSectionOf,
  tableOf
} from './service.mjs';

export { clearCache };

const ASSET_MS = 2000;
const FILE_MAX = 131072;
const CARDS_MAX = 196608;
const NAMES_MAX = 196608;
const BODY_MAX = 4096;
const RUN_MAX = 2048;
const CACHE_PUBLIC = 'public, max-age=300';
const SEARCH_SHARD = /^apidata\/search\/\d+\.txt$/;
const SEARCH_SHARD_MAX = 262144;
const Q_MAX = 200;
const TERMS_MAX = 8;
const LIMIT_MAX = 50;
const FILTER_MAX = 512;
const KINDS = ['item', 'consumable', 'weapon', 'secondary', 'armor'];
const TIERS = ['1', '2', '3', '4', 'A', 'C'];

export const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; sandbox",
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer'
};
const CORS = { 'Access-Control-Allow-Origin': '*' };
const JSON_TYPE = { 'Content-Type': 'application/json; charset=utf-8' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RECORD_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Returns a JSON answer; a HEAD answer or an empty value has no body. */
function respond(method, status, value, extra = {}) {
  const body = value === undefined ? null : JSON.stringify(value) + '\n';
  return new Response(method === 'HEAD' || body === null ? null : body, {
    status,
    headers: { ...CORS, ...JSON_TYPE, ...SECURITY, ...extra }
  });
}

/** Returns the error answer: the stable `code` and a message that names a field, never a value. */
function failure(method, status, code, message, extra = {}) {
  return respond(
    method,
    status,
    { format: 'daggerheart-loot/api-error', version: 1, error: { code, message } },
    { 'Cache-Control': 'no-store', ...extra }
  );
}

/** Returns the 204 answer of a CORS preflight; it reads no file. */
function preflight() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      ...SECURITY
    }
  });
}

/* ---------- routes ---------- */

const READ = 'GET, HEAD, OPTIONS';
const ROLL = 'POST, OPTIONS';

/** Returns the operation a path names: `{ op, param, allow }`, or null. */
function route(pathname) {
  const seg = pathname.split('/');
  if (seg[1] !== 'api' || seg[2] !== 'v1') return null;
  const rest = seg.slice(3);
  const param = (s) => (s.length > RUN_MAX ? '' : s);
  if (rest.length === 1) {
    const ops = {
      'openapi.json': ['openapi', READ],
      rolls: ['listRolls', READ],
      tables: ['listTables', READ],
      records: ['searchRecords', READ],
      'file-checks': ['checkFile', ROLL]
    };
    const hit = Object.hasOwn(ops, rest[0]) ? ops[rest[0]] : null;
    return hit ? { op: hit[0], param: '', allow: hit[1] } : null;
  }
  if (rest.length === 2 && rest[1] !== '') {
    const ops = {
      rolls: ['roll', ROLL],
      tables: ['getTable', READ],
      records: ['getRecord', READ],
      'homebrew-items': ['getHomebrewItem', READ],
      'shared-lists': ['getSharedList', READ]
    };
    const hit = Object.hasOwn(ops, rest[0]) ? ops[rest[0]] : null;
    return hit ? { op: hit[0], param: param(rest[1]), allow: hit[1] } : null;
  }
  return null;
}

/* ---------- bodies ---------- */

const bad = (message) => new ApiError(400, 'bad_request', message);

function intField(body, name, min, max) {
  const v = body[name];
  if (v === undefined) return undefined;
  if (!Number.isInteger(v) || v < min || (max !== null && v > max)) {
    throw bad(
      `The field ${name} must be an integer ${max === null ? `of ${String(min)} or more` : `from ${String(min)} to ${String(max)}`}.`
    );
  }
  return v;
}

function listField(body, name, allowed) {
  const v = body[name];
  if (v === undefined) return [...allowed];
  if (!Array.isArray(v) || v.length === 0 || !v.every((x) => allowed.includes(x))) {
    throw bad(`The field ${name} must be a non-empty list of: ${allowed.join(', ')}.`);
  }
  return allowed.filter((x) => v.includes(x));
}

/** Returns the input of a roll from its parsed body, or throws the 400 that names the field. */
export function parseRollBody(mode, body) {
  if (mode === 'std') {
    const dice = intField(body, 'dice', 1, 5);
    const total = intField(body, 'total', 1, 60);
    if ((dice === undefined) === (total === undefined)) {
      throw bad('Send exactly one of the fields dice and total.');
    }
    return {
      dice,
      total,
      sources: listField(body, 'sources', ['core', 'hnf']),
      kinds: listField(body, 'kinds', ['item', 'consumable'])
    };
  }
  if (mode === 'alt') {
    const rarity = body['rarity'];
    if (typeof rarity !== 'string' || !RARITIES.includes(rarity)) {
      throw bad(`The field rarity is required and must be one of: ${RARITIES.join(', ')}.`);
    }
    const hope = intField(body, 'hope', 1, 12);
    const fear = intField(body, 'fear', 1, 12);
    if ((hope === undefined) !== (fear === undefined)) {
      throw bad('Send both of the fields hope and fear, or neither.');
    }
    return { rarity, hope, fear, kinds: listField(body, 'kinds', ['item', 'consumable']) };
  }
  const value = intField(body, 'value', 1, null);
  if (mode === 'part') {
    const part = body['part'];
    if (typeof part !== 'string' || part === '' || part.length > 64) {
      throw bad('The field part is required and must be a part id from /api/v1/rolls.');
    }
    return { part, value };
  }
  return { value };
}

/**
 * Returns the checked input of a catalog search from its query strings (the `query` of
 * `runOperation`), or throws the 400 that names the field and never echoes its value.
 */
export function parseSearch(query) {
  const text = (name) => {
    const v = query[name];
    if (v !== undefined && typeof v !== 'string') {
      throw bad(`The field ${name} must be a string.`);
    }
    return v;
  };
  const oneOf = (name, list) => {
    const v = text(name);
    if (v !== undefined && !list.includes(v)) {
      throw bad(`The field ${name} must be one of: ${list.join(', ')}.`);
    }
    return v;
  };
  const q = text('q');
  let terms = [];
  if (q !== undefined) {
    if (q.length > Q_MAX) {
      throw bad(`The field q is past ${String(Q_MAX)} characters. Send a shorter query.`);
    }
    terms = parseQuery(q);
    if (terms.length > TERMS_MAX) {
      throw bad(`The field q holds more than ${String(TERMS_MAX)} words. Send fewer.`);
    }
  }
  const kind = oneOf('kind', KINDS);
  const tier = oneOf('tier', TIERS);
  const rarity = oneOf('rarity', RARITIES);
  const source = text('source');
  const table = text('table');
  if (table !== undefined && tableOf(table) === null) {
    throw bad('The field table must be a table id from /api/v1/tables.');
  }
  const given = text('limit');
  let limit = 20;
  if (given !== undefined) {
    limit = /^[0-9]{1,3}$/.test(given) ? Number(given) : 0;
    if (limit < 1 || limit > LIMIT_MAX) {
      throw bad(`The field limit must be an integer from 1 to ${String(LIMIT_MAX)}.`);
    }
  }
  if (!terms.length && [kind, source, table, tier, rarity].every((v) => v === undefined)) {
    throw bad(
      'The field q is required unless a facet is given. Send q or one of kind, source, table, tier and rarity.'
    );
  }
  return { terms, kind, source, table, tier, rarity, limit };
}

/** Returns the checked `filter` segment of a table read, or undefined for none. */
function parseFilter(query) {
  const v = query.filter;
  if (v === undefined) return undefined;
  if (typeof v !== 'string' || v.length > FILTER_MAX || !v.startsWith('f_')) {
    throw bad(
      `The field filter must be a filter segment of at most ${String(FILTER_MAX)} characters that starts with f_.`
    );
  }
  return v;
}

/** Returns whether a file's UTF-8 bytes pass the file check's cap. */
function overFileCap(file) {
  if (file.length > FILE_CHECK_MAX) return true;
  if (file.length * 3 <= FILE_CHECK_MAX) return false;
  return new TextEncoder().encode(file).length > FILE_CHECK_MAX;
}

async function readBody(request) {
  const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') {
    drop(request.body);
    throw new ApiError(
      415,
      'unsupported_media_type',
      'The body must be application/json. Send the roll fields as a JSON object.'
    );
  }
  const got = await readText(request, BODY_MAX);
  if (got.fail) {
    throw new ApiError(
      413,
      'too_large',
      `The body is past ${String(BODY_MAX)} bytes. Send less.`
    );
  }
  if (got.value.trim() === '') return {};
  let v;
  try {
    v = JSON.parse(got.value);
  } catch {
    throw bad('The body is not valid JSON. Send one JSON object.');
  }
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    throw bad('The body must be one JSON object.');
  }
  return v;
}

/** Reads the file of a file check from the request body: JSON media type, at most 32768 bytes. */
async function readFile(request) {
  const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') {
    drop(request.body);
    throw new ApiError(
      415,
      'unsupported_media_type',
      'The body must be application/json: send the file itself.'
    );
  }
  const got = await readText(request, FILE_CHECK_MAX);
  if (got.fail) throw fileTooLarge();
  return got.value;
}

/** The query parameter names of each operation, from openapi.json. */
const QUERY_OF = new Map(
  Object.values(openapi.paths).flatMap((ops) =>
    Object.values(ops).map((op) => [
      op.operationId,
      (op.parameters ?? []).filter((p) => p.in === 'query').map((p) => p.name)
    ])
  )
);

/** Returns the query parameters an operation reads, as strings; a parameter given twice is a 400. */
function queryOf(url, op) {
  const out = {};
  for (const name of QUERY_OF.get(op) ?? []) {
    const all = url.searchParams.getAll(name);
    if (all.length > 1) throw bad(`The field ${name} is given twice. Send it once.`);
    if (all.length === 1) out[name] = all[0];
  }
  return out;
}

/* ---------- the entry ---------- */

/** Returns the read cap in bytes of a file the service reads: the cap of its own budget. */
export function readCapOf(path) {
  if (path === 'names.json') return NAMES_MAX;
  if (path === 'apidata/cards.json') return CARDS_MAX;
  if (SEARCH_SHARD.test(path)) return SEARCH_SHARD_MAX;
  return FILE_MAX;
}

/** Returns a short hash of a text (FNV-1a, 32 bit) for an ETag; no crypto import needed. */
function hashOf(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** The ETag of the OpenAPI document: its version and a hash of its bytes. */
export const OPENAPI_ETAG = `${openapi.info.version}-${hashOf(JSON.stringify(openapi))}`;

async function fetchAsset(env, path) {
  const res = await env.ASSETS.fetch(env.SITE + path, {
    signal: AbortSignal.timeout(ASSET_MS)
  });
  if (res.status !== 200) {
    drop(res.body);
    throw new Error('status');
  }
  return res;
}

async function readAsset(env, path) {
  const got = await readJson(await fetchAsset(env, path), readCapOf(path));
  if (got.fail) throw new Error(got.fail);
  return got.value;
}

/** Reads a published file as text under its read cap: a catalog chunk is read one line at a time. */
async function readAssetText(env, path) {
  const got = await readText(await fetchAsset(env, path), readCapOf(path));
  if (got.fail) throw new Error(got.fail);
  return got.value;
}

/** Returns the service over this worker's files and Supabase reads. */
export function serviceOf(env) {
  return createService({
    assets: (path) => readAsset(env, path),
    text: (path) => readAssetText(env, path),
    rpc: (name, args, max) => rpc(env, name, args, max),
    random: Math.random,
    site: { base: env.SITE, art: artBaseOf(String(env.SUPABASE_URL ?? '')) }
  });
}

/**
 * Runs one service operation from parsed input and returns its `{ body, etag? }`; the REST and
 * the MCP adapter share it, so both answer the same bytes. `param` is the path value,
 * `query` the query parameters as strings (`part`, `filter`, the search fields), `body` the
 * parsed roll body and `file` the text of a file to check.
 */
export async function runOperation(service, op, { param, query = {}, body = {}, file }) {
  switch (op) {
    case 'listRolls':
      return service.listRolls();
    case 'listTables':
      return service.listTables();
    case 'roll': {
      const section = rollSectionOf(param);
      if (section === null)
        throw new ApiError(404, 'not_found', 'The roll section does not exist.');
      return service.roll(param, parseRollBody(ROLL_MODES[section], body));
    }
    case 'getTable':
      if (tableOf(param) === null)
        throw new ApiError(404, 'not_found', 'The table does not exist.');
      if (query.part !== undefined && (query.part === '' || query.part.length > 64)) {
        throw new ApiError(404, 'not_found', 'The part does not exist.');
      }
      return service.getTable(param, query.part, parseFilter(query));
    case 'searchRecords':
      return service.searchRecords(parseSearch(query));
    case 'checkFile':
      if (typeof file !== 'string') {
        throw bad("The field file is required. Send the file's text as a string.");
      }
      if (overFileCap(file)) throw fileTooLarge();
      return service.checkFile(file);
    case 'getRecord':
      if (!RECORD_ID.test(param))
        throw new ApiError(404, 'not_found', 'The record does not exist.');
      return service.getRecord(param);
    case 'getHomebrewItem': {
      const run = (/^[0-9A-Fa-f-]*/.exec(param)?.[0] ?? '').toLowerCase();
      if (!UUID.test(run))
        throw new ApiError(404, 'not_found', 'The homebrew item does not exist.');
      return service.getHomebrewItem(run);
    }
    default: {
      const run = /^[A-Za-z0-9_-]*/.exec(param)?.[0] ?? '';
      if (run.length !== 43)
        throw new ApiError(404, 'not_found', 'The shared list does not exist.');
      return service.getSharedList(run);
    }
  }
}

const matches = (header, etag) =>
  header !== null &&
  header
    .split(',')
    .map((t) => t.trim().replace(/^W\//, ''))
    .some((t) => t === '*' || t === etag);

async function dispatch(request, env, url) {
  const method = request.method;
  if (method === 'OPTIONS') return preflight();
  const hit = route(url.pathname);
  if (!hit) return failure(method, 404, 'not_found', 'The path does not exist in this API.');
  if (!hit.allow.split(', ').includes(method)) {
    drop(request.body);
    return failure(method, 405, 'method_not_allowed', `Use one of: ${hit.allow}.`, {
      Allow: hit.allow
    });
  }
  const service = serviceOf(env);
  let result;
  if (hit.op === 'openapi') {
    result = { body: openapi, etag: OPENAPI_ETAG };
  } else {
    let body = {};
    let file;
    if (hit.op === 'checkFile') file = await readFile(request);
    if (hit.op === 'roll') {
      /* The section is checked before the body is read: a 404 never waits for the body. */
      if (rollSectionOf(hit.param) === null) {
        drop(request.body);
        throw new ApiError(404, 'not_found', 'The roll section does not exist.');
      }
      body = await readBody(request);
    }
    result = await runOperation(service, hit.op, {
      param: hit.param,
      query: queryOf(url, hit.op),
      body,
      file
    });
  }
  if (result.etag === undefined) {
    return respond(method, 200, result.body, { 'Cache-Control': 'no-store' });
  }
  const etag = `"${result.etag}"`;
  const headers = { ETag: etag, 'Cache-Control': CACHE_PUBLIC };
  if (matches(request.headers.get('If-None-Match'), etag)) {
    return respond(method, 304, undefined, headers);
  }
  return respond(method, 200, result.body, headers);
}

/**
 * Returns the answer for any request under `/api`: bare `/api` and unknown paths answer the
 * JSON 404, `OPTIONS` the 204 preflight, and every failure its row of docs/specs/CONTRACTS.md
 * section 6 as JSON.
 */
export async function handleApi(request, env, url) {
  try {
    return await dispatch(request, env, url);
  } catch (e) {
    if (e instanceof ApiError) return failure(request.method, e.status, e.code, e.message);
    return failure(
      request.method,
      503,
      'unavailable',
      'The API could not answer. Try again later.'
    );
  }
}
