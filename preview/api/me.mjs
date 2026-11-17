/*
  The account API's core (`/api/v1/me/` and `/mcp/me`, docs/specs/CONTRACTS.md section 6,
  "Account API"): the bearer token check, the PostgREST and RPC calls that carry the
  reader's token, paging, the `confirm` and `If-Match` rules, and the field checks. The
  operations live in me-lists.mjs, me-homebrew.mjs, me-requests.mjs and me-print.mjs;
  rest.mjs and mcp.mjs route to them.

  The worker decodes the token's claims without checking the signature: PostgREST checks it
  on every call, and the database guard (`api_client_guard`) bounds what a connected app's
  token reaches. The token is forwarded with the publishable key, never logged, cached or
  echoed. The worker stores nothing.
*/
import { READ_MS, drop, readText } from './read.mjs';
import { ApiError } from './service.mjs';

/** The most bytes of a Supabase answer an account operation reads (`RPC_MAX`). */
export const ME_READ_MAX = 65536;
/** The most bytes of an account request body; an import body takes `IMPORT_BODY_MAX`. */
export const ME_BODY_MAX = 32768;
export const IMPORT_BODY_MAX = 65536;
/** The most rows of one page of a collection read. */
export const PAGE_MAX = 100;
/** The guard's message for a token whose session a disconnect deleted
 *  (20261113120000_api_client_guard.sql). */
const SESSION_ENDED = 'api_client_guard: the session of this token has ended';
/** How long a write waits for its answer: a write is idempotent, so a retry is safe. */
const WRITE_MS = 10000;
/** The most bytes of an error answer the worker reads. */
const ERROR_MAX = 4096;

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const isObject = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);

/** Returns an ApiError that also carries `extra` fields of its `error` object and headers. */
export function meError(status, code, message, extra, headers) {
  const e = new ApiError(status, code, message);
  if (extra) e.extra = extra;
  if (headers) e.headers = headers;
  return e;
}

export const bad = (message) => meError(400, 'bad_request', message);
export const notFound = (what) => meError(404, 'not_found', `${what} does not exist.`);
export const unavailable = () =>
  meError(503, 'unavailable', 'The account could not be read or written. Try again later.');

/* ---------- the token ---------- */

const base = (env) => String(env.SUPABASE_URL ?? '').replace(/\/+$/, '');

/** Returns the URL of the protected-resource metadata of `resource` (`api/v1/me`, `mcp/me`). */
export const metadataUrl = (site, resource) =>
  `${site}.well-known/oauth-protected-resource/${resource}`;

/** Returns the `WWW-Authenticate` value of a 401 (RFC 6750, RFC 9728). */
function challenge(site, resource, invalid) {
  const head = `Bearer resource_metadata="${metadataUrl(site, resource)}"`;
  return invalid ? `${head}, error="invalid_token"` : head;
}

/** Returns the 401 of a token PostgREST or the claims refuse. */
export function invalidToken(site, resource, message) {
  return meError(401, 'invalid_token', message, undefined, {
    'WWW-Authenticate': challenge(site, resource, true)
  });
}

function claimsOf(part) {
  if (typeof part !== 'string' || !/^[A-Za-z0-9_-]+$/.test(part)) return null;
  try {
    const bin = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const text = new TextDecoder('utf-8', { fatal: true }).decode(
      Uint8Array.from(bin, (c) => c.charCodeAt(0))
    );
    const v = JSON.parse(text);
    return isObject(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Returns `{ token, user }` of a connected app's bearer token, or throws: none is 401
 * `unauthorized`; not a JWT, another issuer, a past `exp` or no user is 401 `invalid_token`;
 * a token without `client_id` (the app's own session) is 403 `forbidden`. `aud` is not read.
 */
export function tokenOf(request, env, resource, now = Date.now()) {
  const site = String(env.SITE);
  const header = request.headers.get('Authorization') ?? '';
  const m = /^Bearer +(\S+)$/i.exec(header.trim());
  if (!m) {
    throw meError(
      401,
      'unauthorized',
      "Send a connected app's access token as Authorization: Bearer <token>. The metadata in WWW-Authenticate names the authorization server.",
      undefined,
      { 'WWW-Authenticate': challenge(site, resource, false) }
    );
  }
  const token = m[1];
  const parts = token.split('.');
  const claims = parts.length === 3 ? claimsOf(parts[1]) : null;
  const refuse = (message) => invalidToken(site, resource, message);
  if (claims === null || claims.iss !== base(env) + '/auth/v1') {
    throw refuse("The token is not an access token of this site's authorization server.");
  }
  if (typeof claims.exp !== 'number' || claims.exp * 1000 <= now) {
    throw refuse('The token has expired. Refresh it at the authorization server.');
  }
  if (typeof claims.sub !== 'string' || !UUID.test(claims.sub)) {
    throw refuse('The token names no account.');
  }
  if (typeof claims.client_id !== 'string' || claims.client_id === '') {
    throw meError(
      403,
      'forbidden',
      "The token is the app's own session, not a connected app's. Connect the app through the authorization server."
    );
  }
  return { token, user: claims.sub };
}

/* ---------- PostgREST ---------- */

/**
 * Calls PostgREST with the reader's token: `path` is under /rest/v1/ (a table with its
 * query, or `rpc/<name>`). Returns `{ ok: true, status, value }` (value null for an empty
 * body), `{ ok: false, big: true }` past `max` bytes, or `{ ok: false, status, error }` with
 * PostgREST's `code`, `message` and `details`. A 401 and the guard's ended session throw
 * `invalid_token`, the guard's refusal of a path throws 403 `forbidden`, no answer throws 503.
 */
export async function pg(ctx, method, path, { body, prefer, max = ME_READ_MAX } = {}) {
  let res;
  try {
    res = await globalThis.fetch(base(ctx.env) + '/rest/v1/' + path, {
      method,
      headers: {
        apikey: ctx.env.SUPABASE_KEY,
        Authorization: 'Bearer ' + ctx.token,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(prefer ? { Prefer: prefer } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(method === 'GET' ? READ_MS : WRITE_MS)
    });
  } catch {
    throw unavailable();
  }
  if (res.status === 401) {
    drop(res.body);
    throw invalidToken(ctx.site, ctx.resource, 'The authorization server refused the token.');
  }
  if (res.status >= 400) {
    const got = await readText(res, ERROR_MAX);
    let error = {};
    try {
      error = got.fail ? {} : (JSON.parse(got.value) ?? {});
    } catch {
      /* not JSON */
    }
    const message = typeof error.message === 'string' ? error.message : '';
    /* An ended connection is an invalid token (RFC 6750), so the client signs in again. */
    if (res.status === 403 && message.startsWith(SESSION_ENDED)) {
      throw invalidToken(
        ctx.site,
        ctx.resource,
        'The connection was ended. Connect the app again.'
      );
    }
    if (res.status === 403 && message.startsWith('api_client_guard')) {
      throw meError(403, 'forbidden', 'The account refuses this call for a connected app.');
    }
    return {
      ok: false,
      status: res.status,
      error: { code: error.code, message, details: error.details ?? null }
    };
  }
  const got = await readText(res, max);
  if (got.fail) return { ok: false, big: true, status: res.status };
  if (got.value.trim() === '') return { ok: true, status: res.status, value: null };
  try {
    return { ok: true, status: res.status, value: JSON.parse(got.value) };
  } catch {
    throw unavailable();
  }
}

/** Returns the value of a read that must answer, else throws 503 (`big` throws `tooLarge`). */
export function needed(r, tooLarge) {
  if (r.ok) return r.value;
  if (r.big && tooLarge) throw tooLarge();
  throw unavailable();
}

/** Calls an RPC with the reader's token (`pg` on `rpc/<name>`). */
export const call = (ctx, name, args, opts) =>
  pg(ctx, 'POST', 'rpc/' + name, { ...opts, body: args });

/** Returns the outcome of one write of `apply_list_writes`: `ok`, `gone` (a row gone or not
 *  the reader's), `limit` (a limit trigger) or `refused`. */
export function outcomeOf(r) {
  if (isObject(r) && r.ok === true) return 'ok';
  if (isObject(r) && r.code === 'P0002') return 'gone';
  if (isObject(r) && r.code === 'P0001' && /^limit: /.test(String(r.message))) return 'limit';
  return 'refused';
}

/** Sends writes in one `apply_list_writes` call and returns one raw result per write. */
export async function applyWrites(ctx, ops) {
  if (!ops.length) return [];
  const r = await call(ctx, 'apply_list_writes', { p_ops: ops });
  if (!r.ok || !Array.isArray(r.value) || r.value.length !== ops.length) throw unavailable();
  return r.value;
}

/** Returns the 409 of a limit (`limit: <key>` from a limit trigger) with its key. */
export function limitReached(message) {
  const key = /^limit: ([\w-]+)$/.exec(String(message))?.[1] ?? null;
  return meError(
    409,
    'limit_reached',
    'The account is at a limit of its plan. Delete something first.',
    key ? { limit: key } : undefined
  );
}

/* ---------- paging, confirm, If-Match ---------- */

const toBase64Url = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Returns the opaque cursor of a page that ends at `id`. */
export const cursorOf = (id) => toBase64Url(id);

/** Returns the page a collection read asks for: `limit` 1-100 (default 100) and `after`, the
 *  id the `cursor` names, or null. */
export function pageOf(query) {
  let limit = PAGE_MAX;
  if (query.limit !== undefined) {
    limit = /^[0-9]{1,3}$/.test(query.limit) ? Number(query.limit) : 0;
    if (limit < 1 || limit > PAGE_MAX) {
      throw bad(`The field limit must be an integer from 1 to ${String(PAGE_MAX)}.`);
    }
  }
  let after = null;
  if (query.cursor !== undefined) {
    let id;
    try {
      id = /^[A-Za-z0-9_-]{1,64}$/.test(query.cursor)
        ? atob(query.cursor.replace(/-/g, '+').replace(/_/g, '/'))
        : '';
    } catch {
      id = '';
    }
    if (!UUID.test(id)) throw bad('The field cursor must be a cursor that an answer gave.');
    after = id;
  }
  return { limit, after };
}

/** Throws 409 `confirm_required` unless a call that can delete `count` rows (more than one)
 *  carries `confirm` equal to `count`. */
export function confirmed(body, count) {
  if (count <= 1 || body.confirm === count) return;
  throw meError(
    409,
    'confirm_required',
    `The call deletes ${String(count)} rows and cannot be undone. Show the reader what goes, then send confirm: ${String(count)}.`,
    { confirm: count }
  );
}

/** Returns the rev an `If-Match` header names, or null when there is none; with `star`, the
 *  value `*` (any revision) passes as `'*'`. */
export function revOf(header, star = false) {
  if (header === null) return null;
  if (star && header.trim() === '*') return '*';
  const m = /^(?:W\/)?"([0-9]{1,19})"$/.exec(header.trim());
  if (!m) throw bad('The If-Match header must be one rev that an answer gave, in quotes.');
  return m[1];
}

export const preconditionRequired = () =>
  meError(
    428,
    'precondition_required',
    "This change is relative to the current values: send If-Match with the list's rev."
  );

/** Returns the 412 of a stale `If-Match`, with the current rev. */
export const preconditionFailed = (rev) =>
  meError(
    412,
    'precondition_failed',
    'The row changed since the rev you sent. Read it again, then send the change.',
    { rev: String(rev) },
    { ETag: `"${String(rev)}"` }
  );

/* ---------- bodies and fields ---------- */

/** Reads a JSON object body of at most `max` bytes; an empty body reads as {}, and a request
 *  with no body (a decline, a read mark) needs no Content-Type. */
export async function readMeBody(request, max = ME_BODY_MAX) {
  if (request.body === null) return {};
  /* Most clients send Content-Length: 0 and no Content-Type on a POST with no body. */
  if (request.headers.get('Content-Length') === '0') {
    drop(request.body);
    return {};
  }
  const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') {
    drop(request.body);
    throw meError(415, 'unsupported_media_type', 'The body must be application/json.');
  }
  const got = await readText(request, max);
  if (got.fail) {
    throw meError(413, 'too_large', `The body is past ${String(max)} bytes. Send less.`);
  }
  if (got.value.trim() === '') return {};
  let v;
  try {
    v = JSON.parse(got.value);
  } catch {
    throw bad('The body is not valid JSON. Send one JSON object.');
  }
  if (!isObject(v)) throw bad('The body must be one JSON object.');
  return v;
}

/** Returns the string field `name` of at most `max` characters (code points), or undefined. */
export function textField(body, name, max, required = false) {
  const v = body[name];
  if (v === undefined && !required) return undefined;
  if (typeof v !== 'string' || (v.length > max && Array.from(v).length > max)) {
    throw bad(`The field ${name} must be a string of at most ${String(max)} characters.`);
  }
  return v;
}

/** Returns the integer field `name` from `min` to `max`, or undefined. */
export function intField(body, name, min, max) {
  const v = body[name];
  if (v === undefined) return undefined;
  if (!Number.isInteger(v) || v < min || v > max) {
    throw bad(`The field ${name} must be an integer from ${String(min)} to ${String(max)}.`);
  }
  return v;
}

/** Returns the boolean field `name`, or undefined. */
export function boolField(body, name) {
  const v = body[name];
  if (v === undefined) return undefined;
  if (typeof v !== 'boolean') throw bad(`The field ${name} must be true or false.`);
  return v;
}

/** Returns the uuid field `name` in lower case, or undefined. */
export function uuidField(body, name, required = false) {
  const v = body[name];
  if (v === undefined && !required) return undefined;
  if (typeof v !== 'string' || !UUID.test(v.toLowerCase())) {
    throw bad(`The field ${name} must be a uuid.`);
  }
  return v.toLowerCase();
}

/** Returns the array field `name` of `min` to `max` items, each checked by `each`. */
export function arrayField(body, name, min, max, each) {
  const v = body[name];
  if (!Array.isArray(v) || v.length < min || v.length > max) {
    throw bad(`The field ${name} must be a list of ${String(min)} to ${String(max)} items.`);
  }
  return v.map((x, i) => each(x, i));
}

/** Returns a list of distinct uuids of `min` to `max` items (`ids`). */
export function idsField(body, name, min, max) {
  const ids = arrayField(body, name, min, max, (x) => {
    if (typeof x !== 'string' || !UUID.test(x.toLowerCase())) {
      throw bad(`Each item of the field ${name} must be a uuid.`);
    }
    return x.toLowerCase();
  });
  if (new Set(ids).size !== ids.length) throw bad(`The field ${name} names an id twice.`);
  return ids;
}

/* ---------- ids made from ids ---------- */

const utf8 = new TextEncoder();

/** Returns the bytes of a uuid. */
export function bytesOf(uuid) {
  const hex = uuid.replace(/-/g, '');
  return Uint8Array.from({ length: 16 }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16));
}

/** Returns the UUIDv5 of `name` under the namespace uuid `ns` (RFC 9562). */
export async function uuidV5(ns, name) {
  const text = utf8.encode(name);
  const all = new Uint8Array(16 + text.length);
  all.set(bytesOf(ns));
  all.set(text, 16);
  const b = new Uint8Array(await crypto.subtle.digest('SHA-1', all)).slice(0, 16);
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/* ---------- pictures ---------- */

/** The most bytes of one picture file (`ART_BYTES_MAX`, the bucket's own limit). */
export const PICTURE_MAX = 204800;
/** The most bytes of a picture upload: two files and 4096 for the part headers and the
 *  boundaries, checked from `Content-Length` and while reading, before any parse. */
export const PICTURE_BODY_MAX = 2 * PICTURE_MAX + 4096;
const ART_BUCKET = 'homebrew-art';
/* The app's cache age of a picture file (ports/supabase.ts `ART_CACHE`). */
const ART_CACHE = 'max-age=86400';

const tooLargeBody = (max) =>
  meError(413, 'too_large', `The body is past ${String(max)} bytes. Send less.`);

/**
 * Reads a `multipart/form-data` body of two picture files, `full` and `thumb`, each at most
 * 204800 bytes: 413 past `PICTURE_BODY_MAX` before any parse or past a file's cap, 400 for a
 * body that is not multipart, a missing part or a part that is not `image/webp`. The capped
 * bytes are parsed by the runtime's own `formData()`, not scanned in JavaScript (the CPU
 * readings: `.claude/README.md`, "Quotas, recovery and failure"). Returns each part's
 * bytes as given.
 */
export async function readPictures(request) {
  const type = request.headers.get('Content-Type') ?? '';
  if (!/boundary=/i.test(type)) {
    drop(request.body);
    throw bad('A multipart body needs its boundary in Content-Type.');
  }
  const got = await readText(request, PICTURE_BODY_MAX, (b) => b);
  if (got.fail) throw tooLargeBody(PICTURE_BODY_MAX);
  let form;
  try {
    form = await new Response(got.value, { headers: { 'Content-Type': type } }).formData();
  } catch {
    throw bad('The body is not a multipart body. Send the parts full and thumb.');
  }
  const out = {};
  for (const name of ['full', 'thumb']) {
    const p = form.get(name);
    if (p === null || typeof p === 'string') {
      throw bad(`The body has no part named ${name}. Send the parts full and thumb.`);
    }
    if (p.size > PICTURE_MAX) {
      throw meError(
        413,
        'too_large',
        `The part ${name} is past ${String(PICTURE_MAX)} bytes. Send a smaller file.`
      );
    }
    if (p.type.split(';')[0].trim().toLowerCase() !== 'image/webp') {
      throw bad(`The part ${name} must be image/webp.`);
    }
    out[name] = new Uint8Array(await p.arrayBuffer());
  }
  return out;
}

const fourcc = (b, at) => String.fromCharCode(b[at], b[at + 1], b[at + 2], b[at + 3]);

/** Returns `{ width, height }` from a WebP file's RIFF and VP8 headers (the first 30 bytes),
 *  or null for bytes that are not a WebP file. The picture is never decoded. */
export function webpSize(b) {
  if (b.length < 30 || fourcc(b, 0) !== 'RIFF' || fourcc(b, 8) !== 'WEBP') return null;
  const chunk = fourcc(b, 12);
  if (chunk === 'VP8 ' && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
    return { width: (b[26] | (b[27] << 8)) & 0x3fff, height: (b[28] | (b[29] << 8)) & 0x3fff };
  }
  if (chunk === 'VP8L' && b[20] === 0x2f) {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') {
    return {
      width: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
      height: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1
    };
  }
  return null;
}

/**
 * Uploads one picture file under `name` with the reader's token, as the app uploads it
 * (`upsert` false), with the media type of the name's extension. A name is a new random uuid,
 * so a file of the same name is one this call wrote before its answer was lost: it passes. The
 * insert policy's refusal is the picture room (409 `limit_reached`, `homebrew_art`); another
 * 403 is a refused token.
 */
export async function uploadArt(ctx, name, bytes) {
  let res;
  try {
    res = await globalThis.fetch(`${base(ctx.env)}/storage/v1/object/${ART_BUCKET}/${name}`, {
      method: 'POST',
      headers: {
        apikey: ctx.env.SUPABASE_KEY,
        Authorization: 'Bearer ' + ctx.token,
        'Content-Type': name.endsWith('.jpg') ? 'image/jpeg' : 'image/webp',
        'Cache-Control': ART_CACHE,
        'x-upsert': 'false'
      },
      body: bytes,
      signal: AbortSignal.timeout(WRITE_MS)
    });
  } catch {
    throw unavailable();
  }
  const got = await readText(res, ERROR_MAX);
  if (res.status === 200) return;
  let code = String(res.status);
  let message = '';
  try {
    const v = JSON.parse(got.value ?? '');
    code = String(v.statusCode ?? code);
    message = String(v.message ?? '');
  } catch {
    /* not JSON: the HTTP status */
  }
  if (code === '409') return;
  if (code === '403' && /row-level security policy/i.test(message)) {
    throw meError(
      409,
      'limit_reached',
      'The account has no room for one more picture. Delete an item or a picture first.',
      { limit: 'homebrew_art' }
    );
  }
  if (code === '401' || code === '403' || res.status === 401) {
    throw invalidToken(ctx.site, ctx.resource, 'The authorization server refused the token.');
  }
  throw unavailable();
}

/** Reads a public picture file of the bucket (a file of another account's item), or null. */
export async function readArt(ctx, name) {
  try {
    const res = await globalThis.fetch(
      `${base(ctx.env)}/storage/v1/object/public/${ART_BUCKET}/${name}`,
      { signal: AbortSignal.timeout(READ_MS) }
    );
    if (res.status !== 200) {
      drop(res.body);
      return null;
    }
    const got = await readText(res, PICTURE_MAX, (b) => b);
    return got.fail ? null : got.value;
  } catch {
    return null;
  }
}

/* ---------- discovery ---------- */

/**
 * Returns the protected-resource metadata (RFC 9728) of `resource`, `api/v1/me` or `mcp/me`:
 * the resource URL, the authorization server (Supabase Auth's OAuth 2.1 server), the header
 * method and the developer page.
 */
export function metadataOf(env, resource) {
  const site = String(env.SITE);
  return {
    resource: site + resource,
    authorization_servers: [base(env) + '/auth/v1'],
    bearer_methods_supported: ['header'],
    resource_documentation: site + 'pages/en/developers.html'
  };
}
