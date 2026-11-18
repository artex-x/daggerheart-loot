/*
  The read API's REST adapter (`/api/v1/*`, docs/specs/CONTRACTS.md section 6): routes by
  the paths of openapi.json, checks each parameter and body by hand, calls the service
  (service.mjs) and answers JSON through its own responder. It never calls `answer()` or
  `failed()` of worker.mjs, which send text/html, and it catches every thrown error as the
  JSON 503.

  Every T0 answer under /api/ carries `Access-Control-Allow-Origin: *`, none carries
  `Access-Control-Allow-Credentials`, and a T0 answer never reads `Authorization`: every
  Supabase read runs as the anon reader, so the answer never depends on the caller.
  /api/v1/me/ is the account tier (me.mjs; the operations of me-lists.mjs, me-homebrew.mjs,
  me-requests.mjs and me-print.mjs): a connected app's token, the
  `ME_ORIGINS` allowlist in place of `*`, and `private, no-store` answers.
*/
import { artBaseOf } from '../../app/src/lib/art.ts';
import { RARITIES } from '../../app/src/lib/alt.ts';
import { ROLL_MODES } from '../../app/src/lib/rollTables.ts';
import { parseQuery } from '../../app/src/lib/search.ts';
import { decodeText } from '../../app/src/lib/bundle.ts';
import openapi from './openapi.json' with { type: 'json' };
import { HOMEBREW_OPS } from './me-homebrew.mjs';
import { LIST_OPS } from './me-lists.mjs';
import { PRINT_OPS } from './me-print.mjs';
import { REQUEST_OPS } from './me-requests.mjs';
import {
  IMPORT_BODY_MAX,
  ME_BODY_MAX,
  ME_READ_MAX,
  PAGE_MAX,
  PICTURE_BODY_MAX,
  UUID as ME_ID,
  metadataOf,
  metadataUrl,
  readMeBody,
  readPictures,
  revOf,
  tokenOf
} from './me.mjs';
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
      '': ['index', READ],
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
  /* Bytes that are not UTF-8 read as no JSON, as the import panel reads them (ImportFile.svelte). */
  const got = await readText(request, FILE_CHECK_MAX, (b) => decodeText(b) ?? '');
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

/** Returns the `daggerheart-loot/api-index` answer of `GET /api/v1/` on the site `site`: it
 *  changes only with a deploy, so it takes the OpenAPI document's ETag. */
function indexOf(site) {
  const pair = (path) => ({ ru: `${site}pages/${path}`, en: `${site}pages/en/${path}` });
  return {
    format: 'daggerheart-loot/api-index',
    version: 1,
    api_version: openapi.info.version,
    links: {
      openapi: `${site}api/v1/openapi.json`,
      openapi_view: `https://redocly.github.io/redoc/?url=${site}api/v1/openapi.json`,
      llms_txt: `${site}llms.txt`,
      developers: pair('developers.html'),
      ai: pair('ai.html'),
      mcp: `${site}mcp`,
      mcp_me: `${site}mcp/me`,
      catalog: `${site}api/v1/catalog/index.json`
    },
    auth: {
      public: 'The read operations and /mcp need no key and no sign-in.',
      account:
        "/api/v1/me/ and /mcp/me take a connected app's OAuth 2.1 access token as Authorization: Bearer. The account endpoints answer 401 without a token and after the user disconnects the app.",
      metadata: metadataUrl(site, 'api/v1/me')
    },
    limits: {
      body_bytes: BODY_MAX,
      file_check_bytes: FILE_CHECK_MAX,
      search_rows: LIMIT_MAX,
      account_body_bytes: ME_BODY_MAX,
      account_import_bytes: IMPORT_BODY_MAX,
      account_picture_bytes: PICTURE_BODY_MAX,
      account_answer_bytes: ME_READ_MAX,
      account_page_rows: PAGE_MAX,
      daily_quota:
        'The API, the MCP endpoints and the link cards share one daily quota of 100,000 requests; past it they answer an error until 00:00 UTC.'
    }
  };
}

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
  } else if (hit.op === 'index') {
    result = { body: indexOf(String(env.SITE)), etag: OPENAPI_ETAG };
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
    /* The table id is checked before the query schema (CONTRACTS.md, section 6). */
    if (hit.op === 'getTable' && tableOf(hit.param) === null) {
      throw new ApiError(404, 'not_found', 'The table does not exist.');
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

/* ---------- the account tier: /api/v1/me/ ---------- */

/**
 * The browser origins whose page may call /api/v1/me/: each is a reviewed decision, one deploy
 * and a line of docs/specs/CONTRACTS.md section 6. A bearer token is not ambient, so the list
 * is not a defense against request forgery: it decides which pages hold a token in script.
 */
export const ME_ORIGINS = [];

const ME_OPS = { ...LIST_OPS, ...HOMEBREW_OPS, ...REQUEST_OPS, ...PRINT_OPS };
const SHARE_TOKEN = /^[A-Za-z0-9_-]{43}$/;
/** The saves whose `If-Match: *` writes over any revision. */
export const STAR_OPS = new Set(['saveHomebrewItem', 'saveHomebrewSource', 'saveHomebrewCard']);
const ME_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

/** Returns the operations of an account path (the segments after /api/v1/me/) by method, and
 *  its path parameters, or null. */
function meRoute(seg) {
  const [a, b, c, d] = seg;
  const id = (s) => ME_ID.test(s);
  const list = a === 'lists' && id(b);
  const hit = (ops, params = {}) => ({ ops, params });
  if (seg.length === 1 && a === 'lists') return hit({ GET: 'listMyLists', POST: 'createList' });
  if (seg.length === 1 && a === 'imports') return hit({ POST: 'importFile' });
  if (seg.length === 2 && a === 'lists' && b === 'delete') return hit({ POST: 'deleteLists' });
  if (seg.length === 2 && a === 'lists' && b === 'file') return hit({ GET: 'exportLists' });
  if (seg.length === 2 && a === 'lists' && b === 'copies')
    return hit({ POST: 'saveSharedList' });
  if (seg.length === 2 && list) {
    return hit({ GET: 'getMyList', PATCH: 'updateList', DELETE: 'deleteList' }, { list_id: b });
  }
  if (seg.length === 3 && list && c === 'entries') {
    return hit({ POST: 'addToList', PATCH: 'updateListEntries' }, { list_id: b });
  }
  if (seg.length === 3 && list && c === 'order')
    return hit({ PUT: 'reorderList' }, { list_id: b });
  if (seg.length === 3 && list && c === 'shares') {
    return hit({ GET: 'listShareLinks', POST: 'createShareLink' }, { list_id: b });
  }
  if (seg.length === 4 && list && c === 'entries' && d === 'delete') {
    return hit({ POST: 'removeFromList' }, { list_id: b });
  }
  if (seg.length === 4 && list && c === 'entries' && id(d)) {
    return hit(
      { PATCH: 'updateListEntry', DELETE: 'removeListEntry' },
      { list_id: b, entry_id: d }
    );
  }
  if (seg.length === 2 && a === 'share-links' && id(b)) {
    return hit({ DELETE: 'revokeShareLink' }, { share_id: b });
  }
  if (a === 'homebrew-items') {
    if (seg.length === 1) return hit({ GET: 'listMyHomebrewItems' });
    if (seg.length === 2 && b === 'delete') return hit({ POST: 'deleteHomebrewItems' });
    if (seg.length === 2 && b === 'move') return hit({ POST: 'moveHomebrewItems' });
    if (seg.length === 2 && b === 'copies') return hit({ POST: 'saveItemCopy' });
    if (seg.length === 2 && id(b)) {
      return hit(
        { GET: 'getMyHomebrewItem', PUT: 'saveHomebrewItem', DELETE: 'deleteHomebrewItem' },
        { item_id: b }
      );
    }
    if (seg.length === 3 && id(b) && c === 'picture') {
      return hit({ PUT: 'setItemPicture', DELETE: 'clearItemPicture' }, { item_id: b });
    }
  }
  if (a === 'homebrew-sources') {
    if (seg.length === 1) return hit({ GET: 'listMyHomebrewSources' });
    if (seg.length === 2 && id(b)) {
      return hit(
        { PUT: 'saveHomebrewSource', DELETE: 'deleteHomebrewSource' },
        { source_id: b }
      );
    }
  }
  if (a === 'homebrew-cards') {
    if (seg.length === 1) return hit({ GET: 'listMyHomebrewCards' });
    if (seg.length === 2 && id(b)) {
      return hit({ PUT: 'saveHomebrewCard', DELETE: 'deleteHomebrewCard' }, { card_id: b });
    }
    if (seg.length === 3 && id(b) && c === 'members') {
      return hit({ POST: 'addCardMember' }, { card_id: b });
    }
    if (seg.length === 4 && id(b) && c === 'members' && d === 'delete') {
      return hit({ POST: 'removeCardMember' }, { card_id: b });
    }
  }
  if (seg.length === 2 && a === 'homebrew' && b === 'file')
    return hit({ GET: 'exportHomebrew' });
  if (seg.length === 3 && list && c === 'requests') {
    return hit({ GET: 'listRequests' }, { list_id: b });
  }
  if (seg.length === 3 && list && c === 'read')
    return hit({ POST: 'markListRead' }, { list_id: b });
  if (seg.length === 1 && a === 'requests') return hit({ GET: 'listMyRequests' });
  if (seg.length === 3 && a === 'requests' && id(b) && (c === 'accept' || c === 'decline')) {
    return hit(
      { POST: c === 'accept' ? 'acceptRequest' : 'declineRequest' },
      { request_id: b }
    );
  }
  if (seg.length === 2 && a === 'notices' && b === 'delete')
    return hit({ POST: 'hideNotices' });
  if (seg.length === 3 && a === 'shared-lists' && SHARE_TOKEN.test(b) && c === 'requests') {
    return hit({ POST: 'sendRequest' }, { token: b });
  }
  if (seg.length === 1 && a === 'print-sets') return hit({ POST: 'createPrintSet' });
  return null;
}

/** Returns the request context of an account operation: the reader's token and user, the
 *  site, the resource the token was checked for, the read API's service and the clock. */
export function meContext(env, auth, resource) {
  return {
    env,
    token: auth.token,
    user: auth.user,
    site: String(env.SITE),
    resource,
    service: serviceOf(env),
    now: Date.now
  };
}

/** Runs one account operation by operationId; the REST and the MCP adapter share it. */
export function runMe(ctx, op, input) {
  return ME_OPS[op](ctx, input);
}

/** Returns the CORS headers of an account answer: the echo of a listed `Origin`, else none. */
function meCors(request) {
  const origin = request.headers.get('Origin');
  if (origin === null || !ME_ORIGINS.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Expose-Headers': 'ETag, WWW-Authenticate'
  };
}

function meRespond(request, status, value, extra = {}) {
  const body =
    value === undefined || request.method === 'HEAD' ? null : JSON.stringify(value) + '\n';
  return new Response(body, {
    status,
    headers: {
      ...(value === undefined ? {} : JSON_TYPE),
      ...SECURITY,
      'Cache-Control': 'private, no-store',
      ...meCors(request),
      ...extra
    }
  });
}

/** Returns an account error answer: `error` holds `code`, `message` and the error's extra
 *  fields (`confirm`, `rev`, `order`, `limit`). */
export function meFailure(request, e) {
  return meRespond(
    request,
    e.status,
    {
      format: 'daggerheart-loot/api-error',
      version: 1,
      error: { code: e.code, message: e.message, ...(e.extra ?? {}) }
    },
    e.headers ?? {}
  );
}

function mePreflight(request) {
  const cors = meCors(request);
  return new Response(null, {
    status: 204,
    headers: {
      ...SECURITY,
      ...(cors['Access-Control-Allow-Origin']
        ? {
            ...cors,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
              'Authorization, Content-Type, If-Match, If-None-Match',
            'Access-Control-Max-Age': '86400'
          }
        : {})
    }
  });
}

async function dispatchMe(request, env, url) {
  const method = request.method;
  if (method === 'OPTIONS') return mePreflight(request);
  /* A uuid matches in any case, as on `/mcp/me`; the other segments are lower-case names. */
  const seg = url.pathname
    .split('/')
    .slice(4)
    .map((s) => (ME_ID.test(s.toLowerCase()) ? s.toLowerCase() : s));
  const hit = seg.every((s) => s !== '' && s.length <= RUN_MAX) ? meRoute(seg) : null;
  if (!hit) {
    drop(request.body);
    return meFailure(
      request,
      new ApiError(404, 'not_found', 'The path does not exist in this API.')
    );
  }
  const listed = Object.keys(hit.ops);
  const allow = ME_METHODS.filter(
    (m) => listed.includes(m) || m === 'OPTIONS' || (m === 'HEAD' && listed.includes('GET'))
  ).join(', ');
  const op = hit.ops[method === 'HEAD' ? 'GET' : method];
  if (!op) {
    drop(request.body);
    return meFailure(
      request,
      Object.assign(new ApiError(405, 'method_not_allowed', `Use one of: ${allow}.`), {
        headers: { Allow: allow }
      })
    );
  }
  const auth = tokenOf(request, env, 'api/v1/me');
  let body = {};
  let files;
  const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (op === 'setItemPicture' && type === 'multipart/form-data') {
    const length = Number(request.headers.get('Content-Length'));
    if (Number.isFinite(length) && length > PICTURE_BODY_MAX) {
      drop(request.body);
      throw new ApiError(
        413,
        'too_large',
        `The body is past ${String(PICTURE_BODY_MAX)} bytes. Send less.`
      );
    }
    files = await readPictures(request);
  } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    body = await readMeBody(request, op === 'importFile' ? IMPORT_BODY_MAX : ME_BODY_MAX);
  } else {
    drop(request.body);
  }
  const ifMatch = revOf(request.headers.get('If-Match'), STAR_OPS.has(op));
  const result = await runMe(meContext(env, auth, 'api/v1/me'), op, {
    params: hit.params,
    query: queryOf(url, op),
    body,
    ifMatch,
    ifNoneMatch: (request.headers.get('If-None-Match') ?? '').trim() === '*',
    files
  });
  return meRespond(
    request,
    result.status,
    result.status === 204 ? undefined : result.body,
    result.etag === undefined ? {} : { ETag: `"${result.etag}"` }
  );
}

async function handleMe(request, env, url) {
  try {
    return await dispatchMe(request, env, url);
  } catch (e) {
    if (e instanceof ApiError) return meFailure(request, e);
    return meFailure(
      request,
      new ApiError(503, 'unavailable', 'The API could not answer. Try again later.')
    );
  }
}

/**
 * Returns the answer under /.well-known/oauth-protected-resource/: the metadata (RFC 9728) of
 * `api/v1/me` and `mcp/me`, public and cached for an hour, with CORS `*`; another path is the
 * JSON 404.
 */
export function handleMetadata(request, env, url) {
  const method = request.method;
  if (method === 'OPTIONS') return preflight();
  const resource = url.pathname.slice('/.well-known/oauth-protected-resource/'.length);
  if (resource !== 'api/v1/me' && resource !== 'mcp/me') {
    drop(request.body);
    return failure(method, 404, 'not_found', 'The path does not exist in this API.');
  }
  if (method !== 'GET' && method !== 'HEAD') {
    drop(request.body);
    return failure(method, 405, 'method_not_allowed', 'Use one of: GET, HEAD, OPTIONS.', {
      Allow: 'GET, HEAD, OPTIONS'
    });
  }
  return respond(method, 200, metadataOf(env, resource), {
    'Cache-Control': 'public, max-age=3600'
  });
}

/**
 * Returns the answer for any request under `/api`: bare `/api` and unknown paths answer the
 * JSON 404, `OPTIONS` the 204 preflight, and every failure its row of docs/specs/CONTRACTS.md
 * section 6 as JSON. /api/v1/me and the paths under it are the account tier.
 */
export async function handleApi(request, env, url) {
  if (url.pathname === '/api/v1/me' || url.pathname.startsWith('/api/v1/me/')) {
    return handleMe(request, env, url);
  }
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
