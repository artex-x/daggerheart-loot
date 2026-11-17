/*
  The MCP adapter (`POST /mcp`, docs/specs/CONTRACTS.md section 6): a hand-written
  Streamable HTTP server over the same service as the REST adapter (rest.mjs). It answers one
  JSON message per request, never a stream, and keeps no session. It speaks both eras of the
  protocol: the legacy one (`initialize`, `2025-03-26` to `2025-11-25`) and the modern one
  (`2026-07-28`: per-request `_meta`, `server/discover`, header checks).

  The tools of `/mcp` are the operations of openapi.json that carry `x-mcp-tool` and no
  `security`; a call runs `runOperation` and returns the REST answer. `POST /mcp/me` is the
  account tier: every request carries a connected app's bearer token (else HTTP 401 with
  `WWW-Authenticate`), and it lists the `/api/v1/me/` operations' tools, then the public
  ones; a call runs `runMe` with the token. Both send no CORS header and answer 403 to any
  request that carries `Origin`; `/mcp` never reads `Authorization`, and neither reads
  `Mcp-Session-Id` or `Last-Event-ID`. It stores nothing.
*/
import openapi from './openapi.json' with { type: 'json' };
import { UUID, tokenOf } from './me.mjs';
import { drop, readText } from './read.mjs';
import { SECURITY, STAR_OPS, meContext, runMe, runOperation, serviceOf } from './rest.mjs';
import { ApiError } from './service.mjs';

const BODY_MAX = 65536;
const MODERN = '2026-07-28';
const LEGACY = ['2025-11-25', '2025-06-18', '2025-03-26'];
const SUPPORTED = [MODERN, ...LEGACY];
const META_VERSION = 'io.modelcontextprotocol/protocolVersion';
const META_SERVER = 'io.modelcontextprotocol/serverInfo';
const TTL_MS = 3600000;
const JSON_TYPE = { 'Content-Type': 'application/json; charset=utf-8' };

const SERVER_INFO = { name: 'daggerheart-loot', version: openapi.info.version };
const INSTRUCTIONS = openapi.info['x-mcp-instructions'];
const ME_INSTRUCTIONS = openapi.info['x-mcp-me-instructions'];
const REV = /^[0-9]{1,19}$/;

/* ---------- the tools ---------- */

const resolve = (ref) =>
  ref
    .split('/')
    .slice(1)
    .reduce((o, k) => o[k], openapi);

/** Returns the tools of openapi.json in document order: `{ tool, op, path, query, types, file }`,
 *  where `tool` is the `tools/list` entry, `op` the operationId, `path` and `query` the names of
 *  the path and query parameters, `types` their schema types and `file` the name of the
 *  argument that carries the request body's text (`x-mcp-body-argument`), or null. */
function buildTools() {
  const out = [];
  for (const ops of Object.values(openapi.paths)) {
    for (const op of Object.values(ops)) {
      if (!op['x-mcp-tool'] || op.security) continue;
      const properties = {};
      const required = [];
      const path = [];
      const query = [];
      const types = {};
      for (const p of op.parameters ?? []) {
        properties[p.name] = { ...p.schema, description: p.description };
        types[p.name] = p.schema.type;
        if (p.required) required.push(p.name);
        (p.in === 'path' ? path : query).push(p.name);
      }
      const file = op['x-mcp-body-argument'] ?? null;
      const schema = op.requestBody?.content?.['application/json']?.schema;
      const body = schema?.$ref ? resolve(schema.$ref) : schema;
      if (file) {
        properties[file] = { type: 'string', description: op.requestBody.description };
        required.push(file);
      } else {
        for (const [name, prop] of Object.entries(body?.properties ?? {})) {
          properties[name] = prop;
        }
      }
      out.push({
        tool: {
          name: op['x-mcp-tool'],
          description: `${op.summary}\n\n${op.description}`,
          inputSchema: { type: 'object', properties, required },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: op['x-mcp-tool'] !== 'roll',
            openWorldHint: false
          }
        },
        op: op.operationId,
        path,
        query,
        types,
        file
      });
    }
  }
  return out;
}

const TOOLS = buildTools();
const TOOL_OF = new Map(TOOLS.map((t) => [t.tool.name, t]));

/**
 * Returns the account tools of openapi.json in document order: the operations under
 * /api/v1/me/ that carry `x-mcp-tool` and `security`, and each `x-mcp-also` variant of one (a
 * second tool over the same operation that requires more arguments). An argument is a path or
 * query parameter, the `If-Match` header as `rev` (`x-mcp-argument`), or a body field.
 */
function buildMeTools() {
  const out = [];
  for (const [p, ops] of Object.entries(openapi.paths)) {
    for (const [method, op] of Object.entries(ops)) {
      if (!op['x-mcp-tool'] || !op.security || !p.startsWith('/api/v1/me/')) continue;
      const properties = {};
      const required = [];
      const path = [];
      const query = [];
      const types = {};
      /* A path argument's pattern: a uuid unless its schema names another (a share token). */
      const shapes = {};
      let header = null;
      for (const param of op.parameters ?? []) {
        /* A header without an argument is REST's alone (If-None-Match). */
        if (param.in === 'header' && !param['x-mcp-argument']) continue;
        const name = param.in === 'header' ? param['x-mcp-argument'] : param.name;
        properties[name] = { ...param.schema, description: param.description };
        types[name] = param.schema.type;
        if (param.required) required.push(name);
        if (param.in === 'path') {
          path.push(name);
          shapes[name] = param.schema.pattern ? new RegExp(param.schema.pattern) : null;
        } else if (param.in === 'query') query.push(name);
        else header = name;
      }
      const schema = op.requestBody?.content?.['application/json']?.schema;
      const body = schema?.$ref ? resolve(schema.$ref) : schema;
      for (const [name, prop] of Object.entries(body?.properties ?? {}))
        properties[name] = prop;
      for (const name of body?.required ?? []) required.push(name);
      const variants = [
        {
          name: op['x-mcp-tool'],
          summary: op.summary,
          description: op.description,
          more: op['x-mcp-required'] ?? [],
          omit: op['x-mcp-omit'] ?? []
        },
        ...(op['x-mcp-also'] ?? []).map((v) => ({
          ...v,
          more: v.required ?? [],
          omit: v.omit ?? []
        }))
      ];
      for (const v of variants) {
        const own = Object.fromEntries(
          Object.entries(properties).filter(([name]) => !v.omit.includes(name))
        );
        out.push({
          tool: {
            name: v.name,
            description: `${v.summary}\n\n${v.description}`,
            inputSchema: {
              type: 'object',
              properties: own,
              required: [...required, ...v.more]
            },
            annotations: {
              readOnlyHint: method === 'get',
              destructiveHint: v.destructive ?? op['x-mcp-destructive'] === true,
              idempotentHint:
                v.idempotent ?? (op['x-mcp-idempotent'] === true || method === 'get'),
              openWorldHint: false
            }
          },
          op: op.operationId,
          path,
          query,
          header,
          types,
          shapes,
          more: v.more
        });
      }
    }
  }
  return out;
}

const ME_TOOLS = buildMeTools();
const ME_TOOL_OF = new Map([...ME_TOOLS, ...TOOLS].map((t) => [t.tool.name, t]));

/* ---------- answers ---------- */

const isObject = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);

/** Returns a JSON answer; no CORS header, never cached. */
function reply(status, value, extra = {}) {
  const body = value === undefined ? null : JSON.stringify(value) + '\n';
  const type = body === null ? {} : JSON_TYPE;
  return new Response(body, {
    status,
    headers: { ...type, 'Cache-Control': 'no-store', ...SECURITY, ...extra }
  });
}

/** Returns a JSON-RPC error answer; `id` is left out when the request had none. */
function fail(status, code, message, id, data, extra) {
  const error = data === undefined ? { code, message } : { code, message, data };
  const msg = id === undefined ? { jsonrpc: '2.0', error } : { jsonrpc: '2.0', id, error };
  return reply(status, msg, extra);
}

const ok = (id, result) => reply(200, { jsonrpc: '2.0', id, result });

/** Returns the `tools/call` result of a REST body. */
function toolResult(body, isError) {
  const result = {
    content: [{ type: 'text', text: JSON.stringify(body) }],
    structuredContent: body
  };
  if (isError) result.isError = true;
  return result;
}

const envelope = (status, code, message) => ({
  status,
  body: { format: 'daggerheart-loot/api-error', version: 1, error: { code, message } }
});

/* ---------- tools/call ---------- */

/** Returns the message of the 400 envelope that names the first bad argument, or null. An
 *  argument is checked by its parameter's schema type: a JSON integer or a string. */
function checkArguments(entry, args) {
  for (const name of [...entry.path, ...entry.query]) {
    const required = entry.tool.inputSchema.required.includes(name);
    const integer = entry.types[name] === 'integer';
    if (args[name] === undefined || args[name] === null) {
      if (required)
        return `The field ${name} is required. Send it as ${integer ? 'an integer' : 'a string'}.`;
      continue;
    }
    if (integer ? !Number.isInteger(args[name]) : typeof args[name] !== 'string') {
      return `The field ${name} must be ${integer ? 'an integer' : 'a string'}.`;
    }
  }
  if (entry.file && typeof args[entry.file] !== 'string') {
    return `The field ${entry.file} is required. Send the file's text as a string.`;
  }
  return null;
}

async function callTool(params, env, id) {
  const entry = isObject(params) && typeof params.name === 'string' && TOOL_OF.get(params.name);
  if (!entry)
    return { error: fail(200, -32602, 'The tool does not exist. Use tools/list.', id) };
  const args = params.arguments === undefined ? {} : params.arguments;
  if (!isObject(args)) {
    return { error: fail(200, -32602, 'The field arguments must be an object.', id) };
  }
  const message = checkArguments(entry, args);
  if (message !== null) {
    return { result: toolResult(envelope(400, 'bad_request', message).body, true) };
  }
  const param = entry.path.length ? args[entry.path[0]] : '';
  /* An integer argument reaches the operation as the string a REST query carries. */
  const query = Object.fromEntries(
    entry.query
      .filter((k) => args[k] !== undefined && args[k] !== null)
      .map((k) => [k, String(args[k])])
  );
  const file = entry.file ? args[entry.file] : undefined;
  const body = Object.fromEntries(
    Object.entries(args).filter(
      ([k]) => !entry.path.includes(k) && !entry.query.includes(k) && k !== entry.file
    )
  );
  try {
    const got = await runOperation(serviceOf(env), entry.op, { param, query, body, file });
    return { result: toolResult(got.body, false) };
  } catch (e) {
    if (e instanceof ApiError) {
      return { result: toolResult(envelope(e.status, e.code, e.message).body, true) };
    }
    return {
      result: toolResult(
        envelope(503, 'unavailable', 'The API could not answer. Try again later.').body,
        true
      )
    };
  }
}

/** Returns the error result of an ApiError: its envelope holds the error's extra fields. */
function errorResult(e) {
  const body = envelope(e.status, e.code, e.message).body;
  Object.assign(body.error, e.extra ?? {});
  return toolResult(body, true);
}

/** Calls an account tool or, on `/mcp/me`, a public one. A token that PostgREST refuses
 *  during the call answers `{ unauthorized }`, which the endpoint sends as HTTP 401. */
async function callMeTool(params, env, id, auth) {
  const entry =
    isObject(params) && typeof params.name === 'string' && ME_TOOL_OF.get(params.name);
  if (!entry)
    return { error: fail(200, -32602, 'The tool does not exist. Use tools/list.', id) };
  if (!entry.more) return callTool(params, env, id);
  const args = params.arguments === undefined ? {} : params.arguments;
  if (!isObject(args)) {
    return { error: fail(200, -32602, 'The field arguments must be an object.', id) };
  }
  const message = checkArguments(entry, args);
  if (message !== null) {
    return { result: toolResult(envelope(400, 'bad_request', message).body, true) };
  }
  for (const name of entry.more) {
    if (args[name] === undefined || args[name] === null) {
      return {
        result: toolResult(
          envelope(400, 'bad_request', `The field ${name} is required.`).body,
          true
        )
      };
    }
  }
  /* `*` writes over any revision on the three saves only, as REST's `If-Match: *`. */
  const star = STAR_OPS.has(entry.op) && args[entry.header] === '*';
  if (
    entry.header &&
    args[entry.header] !== undefined &&
    !star &&
    !REV.test(String(args[entry.header]))
  ) {
    return {
      result: toolResult(
        envelope(
          400,
          'bad_request',
          `The field ${entry.header} must be a rev that an answer gave.`
        ).body,
        true
      )
    };
  }
  /* A uuid matches in any case; a share token is case-sensitive. */
  const paramsOf = Object.fromEntries(
    entry.path.map((k) => [
      k,
      entry.shapes[k] ? String(args[k]) : String(args[k]).toLowerCase()
    ])
  );
  /* A path argument reaches a PostgREST filter: only its shape passes, as the REST route. */
  if (!entry.path.every((k) => (entry.shapes[k] ?? UUID).test(paramsOf[k]))) {
    return {
      result: toolResult(envelope(404, 'not_found', 'The id does not exist.').body, true)
    };
  }
  const query = Object.fromEntries(
    entry.query
      .filter((k) => args[k] !== undefined && args[k] !== null)
      .map((k) => [k, String(args[k])])
  );
  const body = Object.fromEntries(
    Object.entries(args).filter(
      ([k]) => !entry.path.includes(k) && !entry.query.includes(k) && k !== entry.header
    )
  );
  const ifMatch =
    entry.header && args[entry.header] != null ? String(args[entry.header]) : null;
  try {
    /* A save without `rev` and without `overwrite` creates, as REST's If-None-Match: *. */
    const got = await runMe(meContext(env, auth, 'mcp/me'), entry.op, {
      params: paramsOf,
      query,
      body,
      ifMatch,
      ifNoneMatch: ifMatch === null && body.overwrite !== true
    });
    return { result: toolResult(got.status === 204 ? { status: 204 } : got.body, false) };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { unauthorized: e };
    if (e instanceof ApiError) return { result: errorResult(e) };
    return {
      result: toolResult(
        envelope(503, 'unavailable', 'The API could not answer. Try again later.').body,
        true
      )
    };
  }
}

/** Returns the HTTP 401 or 403 of a refused token on `/mcp/me`, as a JSON-RPC error. */
function refusedToken(e, id) {
  return fail(e.status, -32000, e.message, id, undefined, e.headers ?? {});
}

/* ---------- the eras ---------- */

/** Returns the decoded `Mcp-Name` header value, or null when it does not decode. */
function nameOf(value) {
  const m = /^=\?base64\?(.*)\?=$/.exec(value);
  if (!m) return value;
  try {
    const bin = atob(m[1]);
    return new TextDecoder('utf-8', { fatal: true }).decode(
      Uint8Array.from(bin, (c) => c.charCodeAt(0))
    );
  } catch {
    return null;
  }
}

const modernMeta = () => ({ [META_SERVER]: SERVER_INFO });
const modern = (result) => ({ ...result, resultType: 'complete', _meta: modernMeta() });

/** The tools an endpoint lists and calls: `/mcp`'s public tools, or `/mcp/me`'s account tools
 *  then the public ones, with the token of the request. */
function endpointOf(auth) {
  return auth === null
    ? { tools: TOOLS, instructions: INSTRUCTIONS, call: (p, env, id) => callTool(p, env, id) }
    : {
        tools: [...ME_TOOLS, ...TOOLS],
        instructions: ME_INSTRUCTIONS,
        call: (p, env, id) => callMeTool(p, env, id, auth)
      };
}

/** Returns the answer of a call: a JSON-RPC error, the HTTP 401 of a refused token, or `wrap`
 *  of the result. */
function called(got, id, wrap) {
  if (got.error) return got.error;
  if (got.unauthorized) return refusedToken(got.unauthorized, id);
  return ok(id, wrap(got.result));
}

async function serveModern(request, msg, env, auth) {
  const { id, method, params } = msg;
  const at = endpointOf(auth);
  const requested = params._meta[META_VERSION];
  if (requested !== MODERN) {
    return fail(400, -32022, 'The protocol version is not supported.', id, {
      supported: SUPPORTED,
      requested
    });
  }
  const headers = request.headers;
  const wrong =
    headers.get('MCP-Protocol-Version') !== MODERN ||
    headers.get('Mcp-Method') !== method ||
    (method === 'tools/call' &&
      (typeof params.name !== 'string' ||
        nameOf(headers.get('Mcp-Name') ?? '') !== params.name));
  if (wrong) {
    return fail(
      400,
      -32020,
      'The MCP-Protocol-Version, Mcp-Method or Mcp-Name header is missing or differs from the message.',
      id
    );
  }
  if (method === 'server/discover') {
    return ok(
      id,
      modern({
        supportedVersions: SUPPORTED,
        capabilities: { tools: {} },
        instructions: at.instructions,
        ttlMs: TTL_MS,
        cacheScope: 'public'
      })
    );
  }
  if (method === 'tools/list') {
    return ok(
      id,
      modern({ tools: at.tools.map((t) => t.tool), ttlMs: TTL_MS, cacheScope: 'public' })
    );
  }
  if (method === 'tools/call') {
    return called(await at.call(params, env, id), id, modern);
  }
  return fail(404, -32601, 'The method does not exist.', id);
}

async function serveLegacy(request, msg, env, auth) {
  const { id, method, params } = msg;
  const at = endpointOf(auth);
  const header = request.headers.get('MCP-Protocol-Version');
  if (header !== null && !LEGACY.includes(header)) {
    return fail(400, -32600, 'The protocol version is not supported.', id, {
      supported: LEGACY
    });
  }
  if (method === 'initialize') {
    const asked = isObject(params) ? params.protocolVersion : undefined;
    return ok(id, {
      protocolVersion: LEGACY.includes(asked) ? asked : LEGACY[0],
      capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER_INFO,
      instructions: at.instructions
    });
  }
  if (method === 'ping') return ok(id, {});
  if (method === 'tools/list') return ok(id, { tools: at.tools.map((t) => t.tool) });
  if (method === 'tools/call') {
    return called(await at.call(params, env, id), id, (r) => r);
  }
  return fail(200, -32601, 'The method does not exist.', id);
}

/* ---------- the entry ---------- */

async function dispatch(request, env, url) {
  const me = url.pathname === '/mcp/me';
  if (url.pathname !== '/mcp' && !me) {
    drop(request.body);
    return reply(404, undefined);
  }
  if (request.headers.has('Origin')) {
    drop(request.body);
    return fail(403, -32000, 'A request with an Origin header is refused.');
  }
  if (request.method !== 'POST') {
    drop(request.body);
    return reply(405, undefined, { Allow: 'POST' });
  }
  /* The account endpoint refuses a request without a connected app's token before it reads
     the body, `initialize` included, so a client meets the 401 and its WWW-Authenticate. */
  let auth = null;
  if (me) {
    try {
      auth = tokenOf(request, env, 'mcp/me');
    } catch (e) {
      drop(request.body);
      if (e instanceof ApiError) return refusedToken(e);
      throw e;
    }
  }
  const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') {
    drop(request.body);
    return fail(415, -32600, 'The body must be application/json.');
  }
  const got = await readText(request, BODY_MAX);
  if (got.fail) return fail(413, -32600, `The body is past ${String(BODY_MAX)} bytes.`);
  let msg;
  try {
    msg = JSON.parse(got.value);
  } catch {
    return fail(400, -32700, 'The body is not valid JSON.', null);
  }
  if (!isObject(msg) || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return fail(400, -32600, 'The body must be one JSON-RPC 2.0 request.', null);
  }
  if (!Object.hasOwn(msg, 'id')) return reply(202, undefined);
  const meta = isObject(msg.params) && isObject(msg.params._meta) ? msg.params._meta : null;
  const isModern =
    msg.method !== 'initialize' && meta !== null && Object.hasOwn(meta, META_VERSION);
  return isModern ? serveModern(request, msg, env, auth) : serveLegacy(request, msg, env, auth);
}

/**
 * Returns the answer for any request under `/mcp`: `POST /mcp` is the public endpoint and
 * `POST /mcp/me` the account endpoint; every other path answers 404 with no body.
 */
export async function handleMcp(request, env, url) {
  try {
    return await dispatch(request, env, url);
  } catch {
    return fail(503, -32603, 'The endpoint could not answer. Try again later.', null);
  }
}
