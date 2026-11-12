/*
  The MCP adapter (`POST /mcp`, docs/specs/CONTRACTS.md section 6): a hand-written
  Streamable HTTP server over the same service as the REST adapter (rest.mjs). It answers one
  JSON message per request, never a stream, and keeps no session. It speaks both eras of the
  protocol: the legacy one (`initialize`, `2025-03-26` to `2025-11-25`) and the modern one
  (`2026-07-28`: per-request `_meta`, `server/discover`, header checks).

  The tools are the operations of openapi.json that carry `x-mcp-tool` and no `security`; a
  call runs `runOperation` and returns the REST answer. The endpoint sends no CORS header,
  answers 403 to any request that carries `Origin`, and never reads `Authorization`,
  `Mcp-Session-Id` or `Last-Event-ID`. It stores nothing.
*/
import openapi from './openapi.json' with { type: 'json' };
import { drop, readText } from './read.mjs';
import { SECURITY, runOperation, serviceOf } from './rest.mjs';
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

/* ---------- the tools ---------- */

const resolve = (ref) =>
  ref
    .split('/')
    .slice(1)
    .reduce((o, k) => o[k], openapi);

/** Returns the tools of openapi.json in document order: `{ tool, op, path, query }`, where
 *  `tool` is the `tools/list` entry, `op` the operationId and `path` and `query` the names of
 *  the path and query parameters. */
function buildTools() {
  const out = [];
  for (const ops of Object.values(openapi.paths)) {
    for (const op of Object.values(ops)) {
      if (!op['x-mcp-tool'] || op.security) continue;
      const properties = {};
      const required = [];
      const path = [];
      const query = [];
      for (const p of op.parameters ?? []) {
        properties[p.name] = { ...p.schema, description: p.description };
        if (p.required) required.push(p.name);
        (p.in === 'path' ? path : query).push(p.name);
      }
      const schema = op.requestBody?.content?.['application/json']?.schema;
      const body = schema?.$ref ? resolve(schema.$ref) : schema;
      for (const [name, prop] of Object.entries(body?.properties ?? {})) {
        properties[name] = prop;
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
        query
      });
    }
  }
  return out;
}

const TOOLS = buildTools();
const TOOL_OF = new Map(TOOLS.map((t) => [t.tool.name, t]));

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

/** Returns the 400 envelope that names the first bad argument, or null. */
function checkArguments(entry, args) {
  for (const name of [...entry.path, ...entry.query]) {
    const required = entry.tool.inputSchema.required.includes(name);
    if (args[name] === undefined || args[name] === null) {
      if (required) return `The field ${name} is required. Send it as a string.`;
      continue;
    }
    if (typeof args[name] !== 'string') return `The field ${name} must be a string.`;
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
  const part = entry.query.includes('part') && typeof args.part === 'string' ? args.part : null;
  const body = Object.fromEntries(
    Object.entries(args).filter(([k]) => !entry.path.includes(k) && !entry.query.includes(k))
  );
  try {
    const got = await runOperation(serviceOf(env), entry.op, { param, part, body });
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

async function serveModern(request, msg, env) {
  const { id, method, params } = msg;
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
        instructions: INSTRUCTIONS,
        ttlMs: TTL_MS,
        cacheScope: 'public'
      })
    );
  }
  if (method === 'tools/list') {
    return ok(
      id,
      modern({ tools: TOOLS.map((t) => t.tool), ttlMs: TTL_MS, cacheScope: 'public' })
    );
  }
  if (method === 'tools/call') {
    const got = await callTool(params, env, id);
    return got.error ?? ok(id, modern(got.result));
  }
  return fail(404, -32601, 'The method does not exist.', id);
}

async function serveLegacy(request, msg, env) {
  const { id, method, params } = msg;
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
      instructions: INSTRUCTIONS
    });
  }
  if (method === 'ping') return ok(id, {});
  if (method === 'tools/list') return ok(id, { tools: TOOLS.map((t) => t.tool) });
  if (method === 'tools/call') {
    const got = await callTool(params, env, id);
    return got.error ?? ok(id, got.result);
  }
  return fail(200, -32601, 'The method does not exist.', id);
}

/* ---------- the entry ---------- */

async function dispatch(request, env, url) {
  if (url.pathname !== '/mcp') {
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
  return isModern ? serveModern(request, msg, env) : serveLegacy(request, msg, env);
}

/**
 * Returns the answer for any request under `/mcp`: `POST /mcp` is the endpoint, every other
 * path (`/mcp/me` included, which the account tier reserves, docs/specs/CONTRACTS.md section 5) answers 404 with no body.
 */
export async function handleMcp(request, env, url) {
  try {
    return await dispatch(request, env, url);
  } catch {
    return fail(503, -32603, 'The endpoint could not answer. Try again later.', null);
  }
}
