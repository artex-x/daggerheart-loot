// The MCP endpoint end to end through the worker's fetch handler: the same stub ASSETS and
// stub Supabase as api.test.mjs. Each case of both protocol eras is pinned byte for byte by
// docs/fixtures/mcp/<case>.json ({ request, answer }); UPDATE_MCP_FIXTURES=1 writes them.
// `npm run check` runs it as part of the stage test:preview (tools/check/lib.mjs).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { renderApiData } from '../../tools/api-data.mjs';
import { clearCache } from './rest.mjs';

const { default: worker } = await import('../worker.mjs');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API_FIXTURES = join(ROOT, 'docs', 'fixtures', 'api', 'v1');
const FIXTURES = join(ROOT, 'docs', 'fixtures', 'mcp');
const CATALOG = JSON.parse(readFileSync(join(API_FIXTURES, 'catalog.json'), 'utf8'));
const OPENAPI = JSON.parse(readFileSync(join(ROOT, 'preview', 'api', 'openapi.json'), 'utf8'));
const UPDATE = process.env.UPDATE_MCP_FIXTURES === '1';

const SITE = 'https://daggerheart-loot.pages.dev/';
const HOST = 'https://daggerheart-loot.pages.dev';
const SUPA = 'https://test-project.supabase.co';
const HID = '0b8f2c1e-1234-4abc-8def-0123456789ab';
const HB = 'hb_abcdefghijklmnop';
const TOKEN = 'A'.repeat(20) + 'b_c-' + 'z'.repeat(19);

const FILES = renderApiData(CATALOG.loot, CATALOG.audit, CATALOG.versions);
const NAMES = {
  format: 'daggerheart-loot/names',
  version: 1,
  items: Object.fromEntries(
    [...Object.values(CATALOG.loot.items).flat(), ...CATALOG.loot.eq].map((r) => [
      r.id,
      [r.ru, r.en]
    ])
  ),
  sets: {},
  tables: {}
};

const state = { assetFails: false, rpc: () => ({ status: 200, body: null }) };

const json = (v, status = 200) =>
  new Response(typeof v === 'string' ? v : JSON.stringify(v), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const ENV = {
  SITE,
  PAGES_HOST: 'daggerheart-loot.pages.dev',
  SUPABASE_URL: SUPA,
  SUPABASE_KEY: 'sb_publishable_test',
  ASSETS: {
    async fetch(url) {
      const path = String(url).slice(SITE.length);
      if (state.assetFails) throw new Error('assets down');
      if (path === 'names.json') return json(NAMES);
      const body = FILES.get(path);
      return body === undefined ? new Response('missing', { status: 404 }) : json(body);
    }
  }
};

const realFetch = globalThis.fetch;
const realRandom = Math.random;

beforeEach(() => {
  clearCache();
  state.assetFails = false;
  state.rpc = () => ({ status: 200, body: null });
  globalThis.fetch = async (url, init) => {
    assert.ok(String(url).startsWith(SUPA + '/rest/v1/rpc/'), 'only Supabase RPCs: ' + url);
    const r = state.rpc(
      String(url).slice((SUPA + '/rest/v1/rpc/').length),
      JSON.parse(init.body)
    );
    return json(r.body, r.status ?? 200);
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
  Math.random = realRandom;
});

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const META = {
  'io.modelcontextprotocol/protocolVersion': '2026-07-28',
  'io.modelcontextprotocol/clientCapabilities': {},
  'io.modelcontextprotocol/clientInfo': { name: 'test', version: '1' }
};
const LEGACY = { ...JSON_HEADERS, 'MCP-Protocol-Version': '2025-06-18' };
const modernHeaders = (method, name) => ({
  ...JSON_HEADERS,
  'MCP-Protocol-Version': '2026-07-28',
  'Mcp-Method': method,
  ...(name ? { 'Mcp-Name': name } : {})
});
const rpc = (id, method, params) => ({ jsonrpc: '2.0', id, method, params });
const modernRpc = (id, method, params = {}) => rpc(id, method, { ...params, _meta: META });

/** Sends one POST /mcp and returns the response. */
const mcp = (body, headers = JSON_HEADERS, path = '/mcp') =>
  worker.fetch(
    new Request(HOST + path, {
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body)
    }),
    ENV
  );

const PINNED = ['content-type', 'cache-control', 'allow'];

/** Sends a request, compares { request, answer } with fixtures/<name>.json byte for byte and
 *  returns the response and its parsed body. */
async function pin(name, body, headers = JSON_HEADERS, init = {}) {
  const res =
    init.method === undefined
      ? await mcp(body, headers)
      : await worker.fetch(new Request(HOST + '/mcp', { ...init, headers }), ENV);
  const text = await res.text();
  const parsed = text === '' ? null : JSON.parse(text);
  const record = {
    request: {
      method: init.method ?? 'POST',
      headers,
      body:
        typeof body === 'string' && body.length > 200 ? `[${String(body.length)} bytes]` : body
    },
    answer: {
      status: res.status,
      headers: Object.fromEntries(
        PINNED.filter((h) => res.headers.has(h)).map((h) => [h, res.headers.get(h)])
      ),
      body: parsed
    }
  };
  const out = JSON.stringify(record, null, 2) + '\n';
  const file = join(FIXTURES, name + '.json');
  if (UPDATE) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, out);
  }
  assert.ok(
    existsSync(file),
    `The fixture ${name}.json is missing. Run with UPDATE_MCP_FIXTURES=1.`
  );
  assert.equal(out, readFileSync(file, 'utf8'), `${name}.json differs from the answer`);
  assert.equal(res.headers.get('access-control-allow-origin'), null, name);
  assert.equal(res.headers.get('access-control-allow-credentials'), null, name);
  assert.equal(res.headers.get('mcp-session-id'), null, name);
  assert.notEqual(res.status, 401, name);
  return { res, body: parsed };
}

const LISTS_FILE = JSON.stringify({
  format: 'daggerheart-loot/lists',
  version: 1,
  lists: [{ name: 'Loot', entries: [{ id: 'ci1' }, { id: 'nope' }] }]
});

const toolsOfOpenApi = () =>
  Object.values(OPENAPI.paths)
    .flatMap((ops) => Object.values(ops))
    .filter((op) => op['x-mcp-tool'] && !op.security)
    .map((op) => op['x-mcp-tool']);

/* ---------- the legacy era ---------- */

describe('the legacy era', () => {
  it('answers initialize for each legacy version, with no session id', async () => {
    for (const version of ['2025-03-26', '2025-06-18', '2025-11-25']) {
      const { body } = await pin(
        `initialize-${version}`,
        rpc(1, 'initialize', {
          protocolVersion: version,
          capabilities: {},
          clientInfo: { name: 'test', version: '1' }
        })
      );
      assert.equal(body.result.protocolVersion, version);
      assert.equal(body.result.serverInfo.name, 'daggerheart-loot');
      assert.equal(body.result.serverInfo.version, OPENAPI.info.version);
      assert.equal(body.result.instructions, OPENAPI.info['x-mcp-instructions']);
      assert.ok(!('resultType' in body.result));
    }
  });

  it('answers a version it does not know with the newest legacy one', async () => {
    const res = await mcp(rpc(1, 'initialize', { protocolVersion: '2099-01-01' }));
    assert.equal((await res.json()).result.protocolVersion, '2025-11-25');
  });

  it('answers 202 with no body to a notification', async () => {
    const { res } = await pin('notification-initialized', {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    });
    assert.equal(res.status, 202);
  });

  it('lists the tools, with and without the version header', async () => {
    const { body } = await pin('tools-list-legacy', rpc(2, 'tools/list'), LEGACY);
    assert.deepEqual(
      body.result.tools.map((t) => t.name),
      toolsOfOpenApi()
    );
    assert.ok(!('resultType' in body.result) && !('ttlMs' in body.result));
    const bare = await pin('tools-list-legacy-no-header', rpc(2, 'tools/list'));
    assert.deepEqual(bare.body.result, body.result);
  });

  it('answers ping, and -32601 with status 200 for another method', async () => {
    assert.deepEqual(await (await mcp(rpc(3, 'ping'), LEGACY)).json(), {
      jsonrpc: '2.0',
      id: 3,
      result: {}
    });
    const res = await mcp(rpc(4, 'resources/list'), LEGACY);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).error.code, -32601);
  });

  it('refuses a version header outside the legacy three', async () => {
    const res = await mcp(rpc(5, 'tools/list'), {
      ...JSON_HEADERS,
      'MCP-Protocol-Version': '1999'
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, -32600);
    assert.deepEqual(body.error.data.supported, ['2025-11-25', '2025-06-18', '2025-03-26']);
  });

  it('runs a tool and returns the REST answer', async () => {
    const { body } = await pin(
      'tools-call-legacy-roll',
      rpc(6, 'tools/call', { name: 'roll', arguments: { section: 'std', total: 3 } }),
      LEGACY
    );
    assert.equal(body.result.isError, undefined);
    assert.equal(body.result.structuredContent.section, 'std');
    assert.equal(body.result.structuredContent.results.length, 4);
    assert.ok(!('resultType' in body.result));
  });
});

/* ---------- the modern era ---------- */

describe('the modern era', () => {
  it('answers server/discover', async () => {
    const { body } = await pin(
      'server-discover',
      modernRpc(1, 'server/discover'),
      modernHeaders('server/discover')
    );
    assert.deepEqual(body.result.supportedVersions, [
      '2026-07-28',
      '2025-11-25',
      '2025-06-18',
      '2025-03-26'
    ]);
    assert.equal(body.result.resultType, 'complete');
    assert.equal(body.result.ttlMs, 3600000);
    assert.equal(body.result.cacheScope, 'public');
    assert.equal(body.result.instructions, OPENAPI.info['x-mcp-instructions']);
  });

  it('lists the tools with a ttl', async () => {
    const { body } = await pin(
      'tools-list-2026-07-28',
      modernRpc(2, 'tools/list'),
      modernHeaders('tools/list')
    );
    assert.deepEqual(
      body.result.tools.map((t) => t.name),
      toolsOfOpenApi()
    );
    assert.equal(body.result.resultType, 'complete');
    assert.equal(body.result.cacheScope, 'public');
    assert.deepEqual(body.result._meta, {
      'io.modelcontextprotocol/serverInfo': {
        name: 'daggerheart-loot',
        version: OPENAPI.info.version
      }
    });
  });

  it('reads a record and decodes a base64 Mcp-Name', async () => {
    const call = modernRpc(3, 'tools/call', { name: 'get_record', arguments: { id: 'ci1' } });
    const { body } = await pin(
      'tools-call-get-record',
      call,
      modernHeaders('tools/call', 'get_record')
    );
    assert.equal(body.result.structuredContent.id, 'ci1');
    assert.equal(body.result.resultType, 'complete');
    const encoded = `=?base64?${Buffer.from('get_record').toString('base64')}?=`;
    const again = await mcp(call, modernHeaders('tools/call', encoded));
    assert.equal(again.status, 200);
  });

  it('answers an operation error as an isError result', async () => {
    const { res, body } = await pin(
      'tools-call-error',
      modernRpc(4, 'tools/call', { name: 'get_record', arguments: { id: 'zzzz' } }),
      modernHeaders('tools/call', 'get_record')
    );
    assert.equal(res.status, 200);
    assert.equal(body.result.isError, true);
    assert.equal(body.result.structuredContent.error.code, 'not_found');
  });

  it('refuses an unsupported version, also a legacy one', async () => {
    const { body } = await pin(
      'unsupported-version',
      rpc(5, 'tools/list', {
        _meta: { ...META, 'io.modelcontextprotocol/protocolVersion': '2025-11-25' }
      }),
      modernHeaders('tools/list')
    );
    assert.equal(body.error.code, -32022);
    assert.equal(body.error.data.requested, '2025-11-25');
  });

  it('refuses a missing or different header', async () => {
    const { body } = await pin(
      'header-mismatch',
      modernRpc(6, 'tools/list'),
      modernHeaders('tools/call')
    );
    assert.equal(body.error.code, -32020);
    for (const headers of [
      JSON_HEADERS,
      { ...JSON_HEADERS, 'Mcp-Method': 'tools/list' },
      { ...modernHeaders('tools/list'), 'MCP-Protocol-Version': '2025-06-18' },
      modernHeaders('tools/call', 'roll')
    ]) {
      const call =
        headers['Mcp-Method'] === 'tools/call'
          ? modernRpc(7, 'tools/call', { name: 'get_record', arguments: { id: 'ci1' } })
          : modernRpc(7, 'tools/list');
      const res = await mcp(call, headers);
      assert.equal(res.status, 400);
      assert.equal((await res.json()).error.code, -32020);
    }
  });

  it('answers 404 with -32601 for another method', async () => {
    const { res, body } = await pin(
      'method-not-found',
      modernRpc(8, 'resources/list'),
      modernHeaders('resources/list')
    );
    assert.equal(res.status, 404);
    assert.equal(body.error.code, -32601);
  });
});

/* ---------- tools/call in both eras ---------- */

describe('tools/call', () => {
  const calls = (name, args) => [
    [rpc(1, 'tools/call', { name, arguments: args }), LEGACY],
    [modernRpc(1, 'tools/call', { name, arguments: args }), modernHeaders('tools/call', name)]
  ];

  it('lists exactly the x-mcp-tool operations without security, each property described', async () => {
    const res = await mcp(rpc(1, 'tools/list'), LEGACY);
    const { tools } = (await res.json()).result;
    assert.deepEqual(
      tools.map((t) => t.name),
      [
        'list_rolls',
        'roll',
        'list_tables',
        'get_table',
        'search_catalog',
        'get_record',
        'get_homebrew_item',
        'get_shared_list',
        'check_file'
      ]
    );
    for (const t of tools) {
      assert.equal(t.inputSchema.type, 'object');
      for (const [name, prop] of Object.entries(t.inputSchema.properties)) {
        assert.equal(typeof prop.description, 'string', `${t.name}.${name}`);
      }
      assert.equal(t.annotations.readOnlyHint, true);
      assert.equal(t.annotations.destructiveHint, false);
      assert.equal(t.annotations.idempotentHint, t.name !== 'roll');
      assert.ok(t.description.includes('\n\n'));
    }
    const search = tools.find((t) => t.name === 'search_catalog');
    assert.deepEqual(search.inputSchema.required, []);
    assert.deepEqual(Object.keys(search.inputSchema.properties), [
      'q',
      'kind',
      'source',
      'table',
      'tier',
      'rarity',
      'limit'
    ]);
    assert.equal(search.inputSchema.properties.limit.type, 'integer');
    const file = tools.find((t) => t.name === 'check_file');
    assert.deepEqual(file.inputSchema.required, ['file']);
    assert.deepEqual(Object.keys(file.inputSchema.properties), ['file']);
    assert.equal(file.inputSchema.properties.file.type, 'string');
    assert.match(file.description, /65536/);
    const roll = tools.find((t) => t.name === 'roll');
    assert.deepEqual(roll.inputSchema.required, ['section']);
    assert.ok(
      'dice' in roll.inputSchema.properties && 'section' in roll.inputSchema.properties
    );
  });

  it('returns the bytes and the value of the REST answer for every tool', async () => {
    state.rpc = (name) =>
      name === 'get_homebrew_item'
        ? {
            body: {
              hid: HID,
              mine: false,
              revision: '3',
              item: {
                id: HB,
                src: 'homebrew',
                kind: 'item',
                en: 'Lantern',
                ru: 'Фонарь',
                ende: 'It **glows**.',
                rud: 'Он **светится**.'
              },
              related: [],
              updated_at: '2026-11-12T10:00:00Z'
            }
          }
        : {
            body: {
              audience: 'player',
              revision: 5,
              updated_at: '2026-11-12T10:00:00Z',
              topic_key: 'topic',
              list: { name: 'Loot', money_mode: 'bag', player_note: 'Players see this.' },
              entries: [
                {
                  id: 'e1',
                  item_key: 'ci1',
                  source: 'official',
                  position: 0,
                  quantity: 2,
                  price_coins: null,
                  player_note: '',
                  snapshot: null
                }
              ]
            }
          };
    const cases = [
      ['list_rolls', {}, '/api/v1/rolls'],
      ['roll', { section: 'std', total: 3 }, '/api/v1/rolls/std', { total: 3 }],
      ['list_tables', {}, '/api/v1/tables'],
      ['get_table', { table: 'wondrous_environments' }, '/api/v1/tables/wondrous_environments'],
      ['get_table', { table: 'eq_weapon', part: '1' }, '/api/v1/tables/eq_weapon?part=1'],
      [
        'get_table',
        { table: 'eq_weapon', part: '2', filter: 'f_burden-2' },
        '/api/v1/tables/eq_weapon?part=2&filter=f_burden-2'
      ],
      ['search_catalog', { q: 'bedroll' }, '/api/v1/records?q=bedroll'],
      [
        'search_catalog',
        { kind: 'weapon', tier: '1', limit: 3 },
        '/api/v1/records?kind=weapon&tier=1&limit=3'
      ],
      ['check_file', { file: LISTS_FILE }, '/api/v1/file-checks', LISTS_FILE],
      ['get_record', { id: 'ci1' }, '/api/v1/records/ci1'],
      ['get_homebrew_item', { uuid: HID }, `/api/v1/homebrew-items/${HID}`],
      ['get_shared_list', { token: TOKEN }, `/api/v1/shared-lists/${TOKEN}`]
    ];
    for (const [name, args, path, body] of cases) {
      const rest = await worker.fetch(
        body === undefined
          ? new Request(HOST + path)
          : new Request(HOST + path, {
              method: 'POST',
              headers: JSON_HEADERS,
              body: typeof body === 'string' ? body : JSON.stringify(body)
            }),
        ENV
      );
      assert.equal(rest.status, 200, path);
      const restText = await rest.text();
      for (const [msg, headers] of calls(name, args)) {
        const { result } = await (await mcp(msg, headers)).json();
        assert.equal(result.isError, undefined, name);
        assert.equal(result.content[0].type, 'text');
        assert.equal(result.content[0].text + '\n', restText, name);
        assert.deepEqual(result.structuredContent, JSON.parse(restText), name);
      }
    }
  });

  it('answers a missing or non-string argument as a 400 bad_request isError result', async () => {
    const { body } = await pin(
      'tools-call-bad-argument',
      modernRpc(9, 'tools/call', { name: 'get_record', arguments: {} }),
      modernHeaders('tools/call', 'get_record')
    );
    assert.equal(body.result.isError, true);
    assert.equal(body.result.structuredContent.error.code, 'bad_request');
    assert.match(body.result.structuredContent.error.message, /id/);
    for (const args of [{ id: 12 }, { id: null }, { id: ['ci1'] }]) {
      const [msg, headers] = calls('get_record', args)[0];
      const { result } = await (await mcp(msg, headers)).json();
      assert.equal(result.isError, true, JSON.stringify(args));
      assert.equal(result.structuredContent.error.code, 'bad_request');
    }
    const [msg, headers] = calls('get_table', { table: 'core_item', part: 4 })[0];
    const part = (await (await mcp(msg, headers)).json()).result;
    assert.match(part.structuredContent.error.message, /part/);
  });

  it('searches the catalog and checks a file, and pins both answers', async () => {
    const search = await pin(
      'tools-call-search',
      modernRpc(10, 'tools/call', {
        name: 'search_catalog',
        arguments: { q: 'bedroll', limit: 5 }
      }),
      modernHeaders('tools/call', 'search_catalog')
    );
    assert.equal(search.body.result.isError, undefined);
    assert.equal(search.body.result.structuredContent.rows[0].id, 'ci1');
    const checked = await pin(
      'tools-call-check-file',
      modernRpc(11, 'tools/call', { name: 'check_file', arguments: { file: LISTS_FILE } }),
      modernHeaders('tools/call', 'check_file')
    );
    assert.equal(checked.body.result.structuredContent.ok, true);
    assert.equal(checked.body.result.structuredContent.counts.skipped, 1);
  });

  it('takes limit as a JSON integer only, and a facet as a string', async () => {
    for (const args of [
      { q: 'ring', limit: '5' },
      { q: 'ring', limit: 5.5 }
    ]) {
      const [msg, headers] = calls('search_catalog', args)[0];
      const { result } = await (await mcp(msg, headers)).json();
      assert.equal(result.isError, true, JSON.stringify(args));
      assert.equal(result.structuredContent.error.code, 'bad_request');
      assert.match(result.structuredContent.error.message, /limit/);
    }
    const [msg, headers] = calls('search_catalog', { kind: 4 })[0];
    const { result } = await (await mcp(msg, headers)).json();
    assert.match(result.structuredContent.error.message, /kind/);
    const none = calls('search_catalog', {})[0];
    const refused = (await (await mcp(none[0], none[1])).json()).result;
    assert.equal(refused.isError, true);
    assert.match(refused.structuredContent.error.message, /\bq\b/);
  });

  it('requires file as a string, and answers a file past 32768 bytes as a too_large result', async () => {
    for (const args of [{}, { file: 5 }, { file: { format: 'x' } }, { file: null }]) {
      const [msg, headers] = calls('check_file', args)[0];
      const { result } = await (await mcp(msg, headers)).json();
      assert.equal(result.isError, true, JSON.stringify(args));
      assert.equal(result.structuredContent.error.code, 'bad_request');
      assert.match(result.structuredContent.error.message, /file/);
    }
    const [msg, headers] = calls('check_file', { file: ' '.repeat(32769) })[0];
    const { result } = await (await mcp(msg, headers)).json();
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent.error.code, 'too_large');
    const rest = await worker.fetch(
      new Request(HOST + '/api/v1/file-checks', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: ' '.repeat(32769)
      }),
      ENV
    );
    assert.equal(JSON.stringify(result.structuredContent) + '\n', await rest.text());
    /* The cap is on the UTF-8 bytes: 20000 two-byte characters pass 32768 bytes. */
    const [wide, wideHeaders] = calls('check_file', { file: 'я'.repeat(20000) })[0];
    const wideResult = (await (await mcp(wide, wideHeaders)).json()).result;
    assert.equal(wideResult.structuredContent.error.code, 'too_large');
    const [edge, edgeHeaders] = calls('check_file', { file: ' '.repeat(32768) })[0];
    const edgeResult = (await (await mcp(edge, edgeHeaders)).json()).result;
    assert.equal(edgeResult.isError, undefined);
    assert.equal(edgeResult.structuredContent.reason, 'not_json');
  });

  it('answers an unknown tool and arguments that are not an object as -32602, status 200', async () => {
    for (const [msg, headers] of [
      ...calls('nope', {}),
      ...calls('get_record', ['ci1']),
      ...calls('get_record', 'ci1')
    ]) {
      const res = await mcp(msg, headers);
      assert.equal(res.status, 200);
      assert.equal((await res.json()).error.code, -32602);
    }
  });

  it('reads absent arguments as an empty object', async () => {
    const res = await mcp(rpc(1, 'tools/call', { name: 'list_rolls' }), LEGACY);
    assert.equal((await res.json()).result.structuredContent.sections.length, 12);
  });

  it('answers a failed read as an isError result with the 503 envelope', async () => {
    state.assetFails = true;
    const [msg, headers] = calls('list_rolls', {})[0];
    const { result } = await (await mcp(msg, headers)).json();
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent.error.code, 'unavailable');
  });
});

/* ---------- the transport checks ---------- */

describe('the transport checks', () => {
  it('refuses any request that carries Origin with 403', async () => {
    const { res, body } = await pin('origin-403', rpc(1, 'tools/list'), {
      ...LEGACY,
      Origin: 'https://example.org'
    });
    assert.equal(res.status, 403);
    assert.ok(!('id' in body));
    assert.equal(body.error.code, -32000);
    for (const method of ['GET', 'OPTIONS']) {
      const r = await worker.fetch(
        new Request(HOST + '/mcp', { method, headers: { Origin: 'https://example.org' } }),
        ENV
      );
      assert.equal(r.status, 403, method);
    }
  });

  it('answers 405 with Allow: POST to every other method, with no body', async () => {
    const { res } = await pin('get-405', undefined, {}, { method: 'GET' });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'POST');
    for (const method of ['HEAD', 'PUT', 'DELETE', 'OPTIONS']) {
      const r = await worker.fetch(new Request(HOST + '/mcp', { method }), ENV);
      assert.equal(r.status, 405, method);
      assert.equal(r.headers.get('allow'), 'POST');
      assert.equal(await r.text(), '');
    }
  });

  it('answers 415 to another media type', async () => {
    const res = await mcp('{}', { 'Content-Type': 'text/plain' });
    assert.equal(res.status, 415);
    assert.equal((await res.json()).error.code, -32600);
  });

  it('answers 413 past 65536 bytes, before any parse', async () => {
    const big =
      '{"jsonrpc":"2.0","id":1,"method":"ping","params":{"pad":"' + 'x'.repeat(65536) + '"}}';
    const { res, body } = await pin('too-large', big);
    assert.equal(res.status, 413);
    assert.equal(body.error.code, -32600);
    const edge = '{"jsonrpc":"2.0","id":1,"method":"ping","params":{"pad":"x"}}';
    const exact = edge.replace('"x"', '"' + 'x'.repeat(65536 - edge.length + 1) + '"');
    assert.equal(exact.length, 65536);
    assert.equal((await mcp(exact)).status, 200);
  });

  it('answers 400 to a body that is not a JSON-RPC 2.0 request', async () => {
    const parse = await mcp('{nope');
    assert.equal(parse.status, 400);
    assert.deepEqual(await parse.json(), {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'The body is not valid JSON.' }
    });
    for (const body of [
      '[]',
      '[{"jsonrpc":"2.0","id":1,"method":"ping"}]',
      '"x"',
      '1',
      'null',
      '{"id":1,"method":"ping"}',
      '{"jsonrpc":"1.0","id":1,"method":"ping"}',
      '{"jsonrpc":"2.0","id":1,"method":5}'
    ]) {
      const res = await mcp(body);
      assert.equal(res.status, 400, body);
      const answer = await res.json();
      assert.equal(answer.error.code, -32600, body);
      assert.equal(answer.id, null, body);
    }
  });

  it('answers 404 with no body to every path but /mcp', async () => {
    for (const path of ['/mcp/', '/mcp/me', '/mcp/me/x', '/mcp/x']) {
      const res = await mcp(rpc(1, 'tools/list'), LEGACY, path);
      assert.equal(res.status, 404, path);
      assert.equal(await res.text(), '', path);
      assert.equal(res.headers.get('access-control-allow-origin'), null);
    }
  });

  it('never reads Authorization, a session id or Last-Event-ID', async () => {
    const msg = rpc(1, 'tools/call', { name: 'get_record', arguments: { id: 'ci1' } });
    const plain = await mcp(msg, LEGACY);
    const withAuth = await mcp(msg, {
      ...LEGACY,
      Authorization: 'Bearer abc',
      'Mcp-Session-Id': 'x',
      'Last-Event-ID': '5'
    });
    assert.equal(withAuth.status, 200);
    assert.equal(await withAuth.text(), await plain.text());
    assert.equal(withAuth.headers.get('mcp-session-id'), null);
  });

  it('carries the security headers and never CORS', async () => {
    const res = await mcp(rpc(1, 'ping'), LEGACY);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(res.headers.get('access-control-allow-origin'), null);
    assert.equal(res.headers.get('access-control-allow-methods'), null);
  });

  it('keeps the host guard first', async () => {
    const res = await worker.fetch(
      new Request('https://abc123.daggerheart-loot.pages.dev/mcp', { method: 'POST' }),
      ENV
    );
    assert.equal(res.status, 301);
    assert.equal(res.headers.get('location'), HOST + '/mcp');
  });
});
