// The read API end to end through the worker's fetch handler: a stub ASSETS over
// renderApiData(<the pinned catalog>) in memory and a stub Supabase, no network. Every answer
// is compared byte for byte with docs/fixtures/api/v1/<case>.json; UPDATE_API_FIXTURES=1
// writes them. `npm run check` runs it as the stage test:preview (tools/check/lib.mjs), with
// the ts hooks that map the app's `.js` imports to their `.ts` sources.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { renderApiData } from '../../tools/api-data.mjs';
import { parseRollBody, clearCache, OPENAPI_ETAG } from './rest.mjs';
import { ROLL_MODES } from '../../app/src/lib/rollTables.ts';

const { default: worker } = await import('../worker.mjs');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURES = join(ROOT, 'docs', 'fixtures', 'api', 'v1');
const CATALOG = JSON.parse(readFileSync(join(FIXTURES, 'catalog.json'), 'utf8'));
const OPENAPI = JSON.parse(readFileSync(join(ROOT, 'preview', 'api', 'openapi.json'), 'utf8'));
const UPDATE = process.env.UPDATE_API_FIXTURES === '1';

const SITE = 'https://daggerheart-loot.pages.dev/';
const HOST = 'https://daggerheart-loot.pages.dev';
const SUPA = 'https://test-project.supabase.co';
const KEY = 'sb_publishable_test';
const HID = '0b8f2c1e-1234-4abc-8def-0123456789ab';
const HB = 'hb_abcdefghijklmnop';
const TOKEN = 'A'.repeat(20) + 'b_c-' + 'z'.repeat(19);

const FILES = renderApiData(CATALOG.loot, CATALOG.audit, CATALOG.versions);

/* An edited catalog: the text of one record differs, so every data_version differs. */
function editedFiles() {
  const loot = structuredClone(CATALOG.loot);
  loot.items.core_item[0].ende = 'An edited description.';
  return renderApiData(loot, CATALOG.audit, CATALOG.versions);
}

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

/* ---------- the stubs ---------- */

const state = {
  files: FILES,
  names: NAMES,
  assetFails: false,
  fetches: [],
  rpcCalls: [],
  rpc: () => ({ status: 200, body: null })
};

const json = (v, status = 200, headers = {}) =>
  new Response(typeof v === 'string' ? v : JSON.stringify(v), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });

const ENV = {
  SITE,
  PAGES_HOST: 'daggerheart-loot.pages.dev',
  SUPABASE_URL: SUPA,
  SUPABASE_KEY: KEY,
  ASSETS: {
    async fetch(url) {
      const path = String(url).slice(SITE.length);
      state.fetches.push(path);
      if (state.assetFails) throw new Error('assets down');
      if (path === 'names.json') return json(state.names);
      const body =
        typeof state.files === 'function' ? state.files(path) : state.files.get(path);
      return body === undefined ? new Response('missing', { status: 404 }) : json(body);
    }
  }
};

const realFetch = globalThis.fetch;
const realRandom = Math.random;

beforeEach(() => {
  clearCache();
  state.files = FILES;
  state.names = NAMES;
  state.assetFails = false;
  state.fetches = [];
  state.rpcCalls = [];
  state.rpc = () => ({ status: 200, body: null });
  globalThis.fetch = async (url, init) => {
    assert.ok(String(url).startsWith(SUPA + '/rest/v1/rpc/'), 'only Supabase RPCs: ' + url);
    const name = String(url).slice((SUPA + '/rest/v1/rpc/').length);
    const args = JSON.parse(init.body);
    state.rpcCalls.push({ name, args, headers: new Headers(init.headers) });
    const r = state.rpc(name, args);
    return json(r.body, r.status ?? 200);
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
  Math.random = realRandom;
});

/** Makes `Math.random` answer `values` in order, then 0. */
function random(...values) {
  let i = 0;
  Math.random = () => values[i++] ?? 0;
}

const call = (path, init = {}) => worker.fetch(new Request(HOST + path, init), ENV);
const post = (path, body, headers = {}) =>
  call(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });

/** Compares the body of `res` with fixtures/<name>.json byte for byte. */
async function fixture(name, res) {
  const body = await res.text();
  const file = join(FIXTURES, name + '.json');
  if (UPDATE) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
  }
  assert.ok(
    existsSync(file),
    `The fixture ${name}.json is missing. Run with UPDATE_API_FIXTURES=1.`
  );
  assert.equal(body, readFileSync(file, 'utf8'), `${name}.json differs from the answer`);
  return JSON.parse(body);
}

function assertApiHeaders(res) {
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  assert.equal(res.headers.get('access-control-allow-credentials'), null);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(
    res.headers.get('content-security-policy'),
    "default-src 'none'; frame-ancestors 'none'; sandbox"
  );
  assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(res.headers.get('vary'), null);
}

/* ---------- homebrew and list answers ---------- */

const snapshot = (over = {}) => ({
  id: HB,
  src: 'homebrew',
  kind: 'item',
  en: 'Lantern',
  ru: 'Фонарь',
  ende: 'It **glows**.',
  rud: 'Он **светится**.',
  ...over
});
const itemAnswer = (item = snapshot(), extra = {}) => ({
  hid: HID,
  mine: false,
  revision: '3',
  item,
  related: [],
  updated_at: '2026-11-12T10:00:00Z',
  ...extra
});
const entry = (over = {}) => ({
  id: 'e1',
  item_key: 'ci1',
  source: 'official',
  position: 0,
  quantity: 2,
  price_coins: null,
  player_note: '',
  snapshot: null,
  ...over
});
const listAnswer = (entries, audience = 'player') => ({
  audience,
  revision: 5,
  updated_at: '2026-11-12T10:00:00Z',
  topic_key: 'topic',
  list: {
    name: 'Loot',
    money_mode: 'bag',
    player_note: 'Players see this.',
    ...(audience === 'gm' ? { gm_note: 'Only the GM sees this.' } : {})
  },
  entries
});

/* ---------- tests ---------- */

describe('reads', () => {
  it('answers the roll sections and the tables with an ETag', async () => {
    const res = await call('/api/v1/rolls');
    assert.equal(res.status, 200);
    assertApiHeaders(res);
    assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(res.headers.get('cache-control'), 'public, max-age=300');
    const body = await fixture('rolls', res);
    assert.equal(res.headers.get('etag'), `"${body.data_version}"`);
    assert.equal(body.sections.length, 12);
    await fixture('tables', await call('/api/v1/tables'));
  });

  it('answers 304 to a matching If-None-Match', async () => {
    const first = await call('/api/v1/tables');
    const res = await call('/api/v1/tables', {
      headers: { 'If-None-Match': first.headers.get('etag') }
    });
    assert.equal(res.status, 304);
    assertApiHeaders(res);
    assert.equal(await res.text(), '');
    assert.equal(res.headers.get('etag'), first.headers.get('etag'));
  });

  it('answers HEAD with the headers of GET and no body', async () => {
    const res = await call('/api/v1/rolls', { method: 'HEAD' });
    assert.equal(res.status, 200);
    assertApiHeaders(res);
    assert.equal(await res.text(), '');
  });

  it('answers a table whole, and an equipment table by tier part', async () => {
    const whole = await fixture(
      'table-wondrous_environments',
      await call('/api/v1/tables/wondrous_environments')
    );
    assert.ok(whole.rows.length > 0 && !('part' in whole));
    assert.equal((await call('/api/v1/tables/wondrous')).status, 200);
    const part = await fixture(
      'table-eq_weapon-1',
      await call('/api/v1/tables/eq_weapon?part=1')
    );
    assert.equal(part.part, '1');
    assert.ok(part.rows.every((r) => r.part === '1'));
    const voa = await fixture(
      'table-vault_of_ages-A',
      await call('/api/v1/tables/vault_of_ages?part=A')
    );
    assert.ok(voa.rows.every((r) => r.part === 'A'));
  });

  it('answers 400 with the part list on an equipment table without part', async () => {
    const res = await call('/api/v1/tables/eq_weapon');
    assert.equal(res.status, 400);
    const body = await fixture('error-table-part-required', res);
    assert.equal(body.error.code, 'bad_request');
    assert.match(body.error.message, /part/);
    assert.match(body.error.message, /1, 2, 3, 4, A/);
  });

  it('answers 404 for an unknown table, part, record and path', async () => {
    assert.equal((await call('/api/v1/tables/zzzz')).status, 404);
    assert.equal((await call('/api/v1/tables/homebrew')).status, 404);
    assert.equal((await call('/api/v1/tables/eq_weapon?part=9')).status, 404);
    const res = await call('/api/v1/records/zzzz');
    assert.equal(res.status, 404);
    assertApiHeaders(res);
    await fixture('error-not-found', res);
  });

  it('answers a catalog record', async () => {
    const res = await call('/api/v1/records/ci1');
    const body = await fixture('record-ci1', res);
    assert.equal(body.rights.license, 'dpcgl');
    assert.equal(body.id, body.key);
    assert.equal(
      res.headers.get('etag'),
      '"' + JSON.parse(FILES.get('apidata/version.json')).data_version + '"'
    );
    const weapon = await fixture('record-q23', await call('/api/v1/records/q23'));
    assert.equal(weapon.stats.alt.range, 'melee');
    const owner = await call('/api/v1/records/ci2');
    assert.equal((await owner.json()).rights.license, 'owner');
  });

  it('answers the OpenAPI document', async () => {
    const res = await call('/api/v1/openapi.json');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), OPENAPI);
  });

  it('derives the OpenAPI ETag from the document, so an edit without a version bump revalidates', async () => {
    const res = await call('/api/v1/openapi.json');
    const etag = res.headers.get('etag');
    assert.equal(etag, `"${OPENAPI_ETAG}"`);
    assert.ok(etag.startsWith(`"${OPENAPI.info.version}-`));
    assert.notEqual(etag, `"${OPENAPI.info.version}"`);
    const again = await call('/api/v1/openapi.json', { headers: { 'If-None-Match': etag } });
    assert.equal(again.status, 304);
  });
});

describe('rolls', () => {
  it('rolls the Core mode with dice, and resolves a typed number', async () => {
    random(0.3, 0.3);
    const dice = await post('/api/v1/rolls/std', { dice: 2, sources: ['core'] });
    assert.equal(dice.headers.get('cache-control'), 'no-store');
    const body = await fixture('roll-std-dice', dice);
    assert.deepEqual(body.dice, { kind: 'nd12', count: 2, faces: [4, 4], total: 8 });
    assert.ok(body.results.length <= 4);
    const typed = await fixture(
      'roll-std-typed',
      await post('/api/v1/rolls/std', { total: 3 })
    );
    assert.deepEqual(typed.dice, { kind: 'typed', total: 3 });
    assert.equal(typed.results.length, 4);
    assert.ok(typed.results.every((r) => r.n === 3));
  });

  it('rolls the alternate tables, with and without a critical success', async () => {
    random(0.1, 0.4);
    const plain = await fixture(
      'roll-alt-plain',
      await post('/api/v1/rolls/alt', { rarity: 'common' })
    );
    assert.deepEqual(plain.dice, { kind: 'duality', hope: 2, fear: 5, crit: false });
    assert.ok(!('bump' in plain));
    assert.deepEqual(
      plain.results.map((r) => r.col),
      ['hope', 'fear', 'hope', 'fear']
    );
    random(0.3, 0.3);
    const crit = await fixture(
      'roll-alt-crit',
      await post('/api/v1/rolls/alt', { rarity: 'common' })
    );
    assert.deepEqual(crit.bump, { rarity: 'uncommon' });
    const top = await fixture(
      'roll-alt-legendary-crit',
      await post('/api/v1/rolls/alt', { rarity: 'legendary', hope: 4, fear: 4 })
    );
    assert.equal(top.dice.crit, true);
    assert.ok(!('bump' in top));
  });

  it('rolls a table, a part and a typed value', async () => {
    random(0.5);
    const table = await fixture(
      'roll-table',
      await post('/api/v1/rolls/wondrous_environments', {})
    );
    assert.equal(table.dice.kind, 'pick');
    assert.equal(table.results.length, 1);
    assert.equal(table.results[0].n, table.dice.value);
    const part = await fixture(
      'roll-part',
      await post('/api/v1/rolls/vault_of_ages', { part: '1', value: 2 })
    );
    assert.equal(part.part, '1');
    assert.equal(part.results[0].n, 2);
    assert.equal((await post('/api/v1/rolls/wondrous', { value: 1 })).status, 200);
  });

  it('answers an empty application/json body on a table roll, and any case of the media type', async () => {
    const empty = await call('/api/v1/rolls/dread_gm_toolbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert.equal(empty.status, 200);
    const mixed = await post(
      '/api/v1/rolls/dread_gm_toolbox',
      {},
      { 'Content-Type': 'Application/JSON; charset=utf-8' }
    );
    assert.equal(mixed.status, 200);
  });

  it('refuses a bad body with the field named', async () => {
    const both = await post('/api/v1/rolls/std', { dice: 1, total: 2 });
    assert.equal(both.status, 400);
    assert.match((await fixture('error-roll-std-both', both)).error.message, /dice/);
    assert.equal((await post('/api/v1/rolls/std', {})).status, 400);
    assert.equal((await post('/api/v1/rolls/alt', { rarity: 'mythic' })).status, 400);
    assert.equal((await post('/api/v1/rolls/alt', { rarity: 'rare', hope: 3 })).status, 400);
    assert.equal((await post('/api/v1/rolls/vault_of_ages', {})).status, 400);
    assert.equal((await post('/api/v1/rolls/vault_of_ages', { part: 'Q' })).status, 404);
    assert.equal((await post('/api/v1/rolls/dread', { value: 9999 })).status, 400);
    assert.equal((await post('/api/v1/rolls/std', '{nope')).status, 400);
    assert.equal((await post('/api/v1/rolls/std', '[1]')).status, 400);
  });

  it('refuses a non-JSON body before reading it, and a large body', async () => {
    const text = await call('/api/v1/rolls/std', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'dice=1'
    });
    assert.equal(text.status, 415);
    assertApiHeaders(text);
    assert.equal(
      (await fixture('error-unsupported-media-type', text)).error.code,
      'unsupported_media_type'
    );
    assert.equal((await post('/api/v1/rolls/std', { pad: 'x'.repeat(4097) })).status, 413);
    const big = await post('/api/v1/rolls/std', ' '.repeat(4097));
    assert.equal(big.status, 413);
    await fixture('error-too-large', big);
  });

  it('answers 405 before the section check, and 404 for an unknown section', async () => {
    const put = await call('/api/v1/rolls/zzzz', { method: 'PUT', body: 'text' });
    assert.equal(put.status, 405);
    assert.equal(put.headers.get('allow'), 'POST, OPTIONS');
    assert.equal((await post('/api/v1/rolls/zzzz', {})).status, 404);
    const get = await call('/api/v1/rolls/std');
    assert.equal(get.status, 405);
    await fixture('error-method-not-allowed', get);
  });

  it('gives a 2049-character run no section', async () => {
    assert.equal((await post('/api/v1/rolls/' + 'a'.repeat(2049), {})).status, 404);
    assert.equal((await call('/api/v1/records/' + 'a'.repeat(2049))).status, 404);
  });

  it('rolls every section by its id and by its old id', async () => {
    const rolls = JSON.parse(FILES.get('apidata/rolls.json'));
    for (const s of rolls.sections) {
      const body =
        s.mode === 'part'
          ? { part: s.parts[0].id }
          : s.mode === 'alt'
            ? { rarity: 'common' }
            : s.mode === 'std'
              ? { dice: 1 }
              : {};
      const res = await post('/api/v1/rolls/' + s.id, body);
      assert.equal(res.status, 200, s.id);
      for (const alias of s.ids)
        assert.equal((await post('/api/v1/rolls/' + alias, body)).status, 200, alias);
    }
  });
});

describe('homebrew items and shared lists', () => {
  it('answers a homebrew item with the neutral record', async () => {
    state.rpc = () => ({
      body: itemAnswer(snapshot({ refs: ['vicious-entangle'], set: 'ember-spark' }))
    });
    const res = await call('/api/v1/homebrew-items/' + HID.toUpperCase());
    assert.equal(res.headers.get('cache-control'), 'no-store');
    const body = await fixture('homebrew-item', res);
    assert.equal(body.id, HID);
    assert.equal(body.key, HB);
    assert.equal(body.origin, 'homebrew');
    assert.equal(body.rights.license, 'owner');
    assert.deepEqual(state.rpcCalls[0].args, { p_id: HID });
    assert.ok(body.set.members.includes(HB));
  });

  it('answers 404 for an unknown item and 404 for a bad id', async () => {
    assert.equal((await call('/api/v1/homebrew-items/' + HID)).status, 404);
    assert.equal((await call('/api/v1/homebrew-items/nope')).status, 404);
    assert.equal(state.rpcCalls.length, 1);
  });

  it('answers 422 for an answer past 65536 bytes, 503 for a failure', async () => {
    state.rpc = () => ({ body: itemAnswer(snapshot({ ende: 'x'.repeat(70000) })) });
    const big = await call('/api/v1/homebrew-items/' + HID);
    assert.equal(big.status, 422);
    assert.equal((await fixture('error-answer-too-large', big)).error.code, 'answer_too_large');
    state.rpc = () => ({ status: 500, body: { message: 'boom' } });
    const down = await call('/api/v1/homebrew-items/' + HID);
    assert.equal(down.status, 503);
    assertApiHeaders(down);
    await fixture('error-unavailable', down);
  });

  it('answers a players list and a GM list', async () => {
    const entries = [
      entry(),
      entry({
        id: 'e2',
        item_key: HB,
        source: 'homebrew',
        position: 1,
        hid: HID,
        snapshot: snapshot()
      }),
      entry({ id: 'e3', item_key: 'zzz', position: 2 })
    ];
    state.rpc = () => ({ body: listAnswer(entries) });
    const player = await fixture(
      'shared-list-player',
      await call('/api/v1/shared-lists/' + TOKEN)
    );
    assert.equal(player.entries.length, 2);
    assert.equal(player.dropped, 1);
    assert.ok(!('gm_note' in player));
    assert.equal(player.entries[1].record.key, HB);
    assert.deepEqual(state.rpcCalls[0].args, { p_token: TOKEN });
    state.rpc = () => ({
      body: listAnswer(
        entries.map((e) => ({ ...e, gm_note: 'g', gm_only: false })),
        'gm'
      )
    });
    const gm = await fixture('shared-list-gm', await call('/api/v1/shared-lists/' + TOKEN));
    assert.equal(gm.gm_note, 'Only the GM sees this.');
    assert.equal(gm.entries[0].gm_only, false);
  });

  it('answers 404 for a stopped share and for a short token', async () => {
    assert.equal((await call('/api/v1/shared-lists/' + TOKEN)).status, 404);
    assert.equal((await call('/api/v1/shared-lists/short')).status, 404);
    assert.equal(state.rpcCalls.length, 1);
  });

  it('ignores an Authorization header and never forwards it', async () => {
    state.rpc = (name) => ({
      body: name === 'get_homebrew_item' ? itemAnswer() : listAnswer([entry()])
    });
    for (const path of ['/api/v1/homebrew-items/' + HID, '/api/v1/shared-lists/' + TOKEN]) {
      const plain = await (await call(path)).text();
      clearCache();
      const authed = await (
        await call(path, { headers: { Authorization: 'Bearer secret' } })
      ).text();
      assert.equal(authed, plain);
    }
    assert.equal(state.rpcCalls.length, 4);
    for (const c of state.rpcCalls) {
      assert.equal(c.headers.get('authorization'), null);
      assert.equal(c.headers.get('apikey'), KEY);
    }
  });

  it('measures how many entries fit under the 65536-byte cap', (t) => {
    const size = (v) => Buffer.byteLength(JSON.stringify(v));
    const fit = (make, audience) => {
      let n = 1;
      while (size(listAnswer(make(n + 1), audience)) <= 65536) n++;
      return n;
    };
    const catalog = (n) =>
      Array.from({ length: n }, (_, i) =>
        entry({
          id: '5b0f3c1e-1234-4abc-8def-' + String(i).padStart(12, '0'),
          item_key: 'ci' + String(1 + (i % 60)),
          position: i
        })
      );
    const longText = {
      ende: 'x'.repeat(1500),
      rud: 'я'.repeat(1500),
      ru: 'я'.repeat(60),
      en: 'x'.repeat(60)
    };
    const homebrew = (n) =>
      Array.from({ length: n }, (_, i) => {
        const key = 'hb_' + 'a'.repeat(15) + String.fromCharCode(97 + (i % 26));
        return entry({
          id: 'e' + String(i),
          item_key: key,
          source: 'homebrew',
          position: i,
          hid: '5b0f3c1e-1234-4abc-8def-' + String(i).padStart(12, '0'),
          snapshot: snapshot({ id: key, ...longText })
        });
      });
    const counts = {
      catalogPlayers: fit(catalog, 'player'),
      catalogGm: fit(
        (n) => catalog(n).map((e) => ({ ...e, gm_note: '', gm_only: false })),
        'gm'
      ),
      homebrew: fit(homebrew, 'player')
    };
    t.diagnostic(JSON.stringify(counts));
    assert.ok(
      counts.catalogPlayers >= 300 && counts.catalogPlayers <= 600,
      'players ' + counts.catalogPlayers
    );
    assert.ok(
      counts.catalogGm >= 250 && counts.catalogGm < counts.catalogPlayers,
      'gm ' + counts.catalogGm
    );
    assert.ok(counts.homebrew >= 6 && counts.homebrew <= 16, 'homebrew ' + counts.homebrew);
  });
});

describe('CORS and routing', () => {
  it('answers a preflight on any path under /api/ with no file read', async () => {
    for (const path of [
      '/api/v1/rolls',
      '/api/v1/rolls/std',
      '/api/v1/nope',
      '/api',
      '/api/',
      '/api/v1/me/x'
    ]) {
      const res = await call(path, {
        method: 'OPTIONS',
        headers: { Origin: 'https://example.org', 'Access-Control-Request-Method': 'POST' }
      });
      assert.equal(res.status, 204, path);
      assert.equal(await res.text(), '');
      assert.equal(res.headers.get('access-control-allow-origin'), '*');
      assert.equal(res.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS');
      assert.equal(res.headers.get('access-control-allow-headers'), 'Content-Type');
      assert.equal(res.headers.get('access-control-max-age'), '86400');
      assert.equal(res.headers.get('access-control-allow-credentials'), null);
      assert.equal(res.headers.get('vary'), null);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    }
    assert.deepEqual(state.fetches, []);
    assert.deepEqual(state.rpcCalls, []);
  });

  it('carries the CORS and security headers on every answer', async () => {
    state.rpc = () => ({ body: null });
    const answers = [
      await call('/api/v1/rolls'),
      await call('/api/v1/rolls', { headers: { 'If-None-Match': '*' } }),
      await call('/api/v1/records/zzzz'),
      await call('/api/v1/rolls', { method: 'DELETE' }),
      await call('/api/v1/me/x'),
      await call('/api'),
      await call('/api/v1/nope'),
      await post('/api/v1/rolls/std', 'nope'),
      await call('/api/v1/rolls', { method: 'HEAD' })
    ];
    for (const res of answers) assertApiHeaders(res);
    assert.deepEqual(
      answers.map((r) => r.status),
      [200, 304, 404, 405, 404, 404, 404, 400, 200]
    );
    assert.equal(answers[3].headers.get('allow'), 'GET, HEAD, OPTIONS');
    await fixture('error-reserved-me', answers[4]);
  });

  it('answers a thrown error as JSON with the security headers', async () => {
    const env = {
      ...ENV,
      SUPABASE_URL: {
        toString() {
          throw new Error('boom');
        }
      }
    };
    const res = await worker.fetch(new Request(HOST + '/api/v1/rolls'), env);
    assert.equal(res.status, 503);
    assertApiHeaders(res);
    assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal((await res.json()).error.code, 'unavailable');
  });

  it('answers 503 when ASSETS fails', async () => {
    state.assetFails = true;
    const res = await call('/api/v1/rolls');
    assert.equal(res.status, 503);
    assertApiHeaders(res);
  });

  it('keeps the host guard first, with no CORS header', async () => {
    const res = await worker.fetch(
      new Request('https://abc123.daggerheart-loot.pages.dev/api/v1/rolls?x=1', {
        method: 'OPTIONS'
      }),
      ENV
    );
    assert.equal(res.status, 301);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
    assert.equal(res.headers.get('location'), HOST + '/api/v1/rolls?x=1');
  });

  it('leaves the cards and the other paths to the worker', async () => {
    assert.equal((await call('/mcp')).status, 405);
    assert.equal((await call('/api/v1/catalog/index.json')).status, 404);
  });
});

describe('two data versions', () => {
  it('re-reads a cached file once, then answers the right record', async () => {
    assert.equal((await call('/api/v1/records/ci1')).status, 200);
    const other = editedFiles();
    state.files = other;
    state.fetches = [];
    const res = await call('/api/v1/records/ci1');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.text.en, 'An edited description.');
    assert.equal(state.fetches.filter((p) => p === 'apidata/records/index.json').length, 1);
  });

  it('answers 503 at the second mismatch', async () => {
    assert.equal((await call('/api/v1/records/ci1')).status, 200);
    const other = editedFiles();
    state.files = (path) => (path.startsWith('apidata/') ? FILES.get(path) : other.get(path));
    const res = await call('/api/v1/records/ci1');
    assert.equal(res.status, 503);
    assertApiHeaders(res);
  });
});

describe('one record per line', () => {
  const chunkOf = (id) => {
    const index = JSON.parse(FILES.get('apidata/records/index.json'));
    return index.chunks.findIndex((ids) => ids.includes(id));
  };

  it('answers a record from the line that holds it', async () => {
    const res = await call('/api/v1/records/ci1');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, 'ci1');
    assert.match(body.link.ru, /\/i\/ci1\?v=[0-9a-z]+$/);
    const n = chunkOf('ci1');
    assert.deepEqual(
      state.fetches.filter((p) => p.startsWith('api/v1/catalog/')),
      [`api/v1/catalog/${String(n)}.json`]
    );
  });

  it('answers 503 after one re-read when the line holds another id', async () => {
    const n = chunkOf('ci1');
    const path = `api/v1/catalog/${String(n)}.json`;
    const lines = FILES.get(path).split('\n');
    const pos = JSON.parse(FILES.get('apidata/records/index.json')).chunks[n].indexOf('ci1');
    [lines[pos + 1], lines[pos + 2]] = [lines[pos + 2], lines[pos + 1]];
    const broken = new Map(FILES);
    broken.set(path, lines.join('\n'));
    state.files = broken;
    const res = await call('/api/v1/records/ci1');
    assert.equal(res.status, 503);
    assert.equal(state.fetches.filter((p) => p === path).length, 2);
  });

  it('builds the index of a roll file once while the isolate keeps the file', async () => {
    const first = await post('/api/v1/rolls/std', { total: 3 });
    assert.equal(first.status, 200);
    assert.equal((await post('/api/v1/rolls/std', { total: 3 })).status, 200);
    assert.equal(state.fetches.filter((p) => p === 'apidata/roll/std.json').length, 1);
    const chunkReads = state.fetches.filter((p) => p.startsWith('api/v1/catalog/')).length;
    assert.ok(chunkReads >= 2);
  });

  it('answers 503 when a roll row names a line that holds another id', async () => {
    const roll = JSON.parse(FILES.get('apidata/roll/std.json'));
    for (const rows of Object.values(roll.items)) for (const r of rows) r.l += 1;
    const broken = new Map(FILES);
    broken.set('apidata/roll/std.json', JSON.stringify(roll) + '\n');
    state.files = broken;
    const res = await post('/api/v1/rolls/std', { total: 3 });
    assert.equal(res.status, 503);
    assert.equal(state.fetches.filter((p) => p === 'apidata/roll/std.json').length, 2);
  });
});

describe('the catalog files', () => {
  it('renders the bulk catalog to its fixtures', () => {
    const paths = [...FILES.keys()].filter((p) => p.startsWith('api/v1/catalog/'));
    assert.ok(paths.includes('api/v1/catalog/index.json'));
    for (const path of paths) {
      const file = join(FIXTURES, 'catalog', path.slice('api/v1/catalog/'.length));
      if (UPDATE) {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, FILES.get(path));
      }
      assert.ok(existsSync(file), `${path}: the fixture is missing`);
      assert.equal(
        FILES.get(path),
        readFileSync(file, 'utf8'),
        `${path} differs from its fixture`
      );
    }
  });

  it('lists every record once, in the chunk that holds it', () => {
    const index = JSON.parse(FILES.get('api/v1/catalog/index.json'));
    const seen = new Set();
    for (const { id, rev, chunk } of index.records) {
      assert.ok(!seen.has(id));
      seen.add(id);
      const file = JSON.parse(FILES.get(new URL(index.chunks[chunk]).pathname.slice(1)));
      assert.ok(file.records.some((r) => r.id === id));
      assert.equal(typeof rev, 'string');
    }
    assert.equal(
      index.data_version,
      JSON.parse(FILES.get('apidata/version.json')).data_version
    );
  });
});

describe('openapi.json and the parsers', () => {
  it('lists the paths the router answers', async () => {
    const samples = {
      '/api/v1/openapi.json': 'GET',
      '/api/v1/rolls': 'GET',
      '/api/v1/rolls/{section}': 'POST',
      '/api/v1/tables': 'GET',
      '/api/v1/tables/{table}': 'GET',
      '/api/v1/records/{id}': 'GET',
      '/api/v1/homebrew-items/{uuid}': 'GET',
      '/api/v1/shared-lists/{token}': 'GET'
    };
    assert.deepEqual(Object.keys(OPENAPI.paths).sort(), Object.keys(samples).sort());
    for (const [path, ops] of Object.entries(OPENAPI.paths)) {
      const method = Object.keys(ops)[0];
      assert.equal(method.toUpperCase(), samples[path], path);
      assert.ok(ops[method].operationId && ops[method].summary.split(' ').length <= 10, path);
      assert.ok(ops[method]['x-mcp-tool'] || path.endsWith('openapi.json'), path);
      const res = await call(path.replace(/\{[a-z]+\}/, 'zzzz'), {
        method: 'OPTIONS'
      });
      assert.equal(res.status, 204);
    }
    const noFormat = Object.values(OPENAPI.paths)
      .flatMap((o) => Object.values(o))
      .flatMap((op) => op.parameters ?? []);
    assert.ok(!noFormat.some((p) => p.name === 'format'));
    assert.ok(!('securitySchemes' in (OPENAPI.components ?? {})));
  });

  it('holds every body field and enum to the parsers', () => {
    const props = OPENAPI.components.schemas.RollBody.properties;
    const mode = {
      dice: 'std',
      total: 'std',
      sources: 'std',
      rarity: 'alt',
      hope: 'alt',
      fear: 'alt',
      part: 'part',
      value: 'table'
    };
    const ok = (m, body) => parseRollBody(m, body);
    for (const v of props.sources.items.enum) ok('std', { dice: 1, sources: [v] });
    for (const v of props.kinds.items.enum) {
      ok('std', { dice: 1, kinds: [v] });
      ok('alt', { rarity: 'common', kinds: [v] });
    }
    for (const v of props.rarity.enum) ok('alt', { rarity: v });
    assert.throws(() => ok('alt', { rarity: 'zzz' }));
    assert.throws(() => ok('std', { dice: 1, sources: ['zzz'] }));
    for (const f of ['dice', 'total']) {
      const { minimum, maximum } = props[f];
      ok('std', { [f]: minimum });
      ok('std', { [f]: maximum });
      assert.throws(() => ok('std', { [f]: minimum - 1 }));
      assert.throws(() => ok('std', { [f]: maximum + 1 }));
    }
    for (const f of ['hope', 'fear']) {
      const { minimum, maximum } = props[f];
      const other = f === 'hope' ? 'fear' : 'hope';
      ok('alt', { rarity: 'rare', [f]: minimum, [other]: maximum });
      assert.throws(() => ok('alt', { rarity: 'rare', [f]: maximum + 1, [other]: 1 }));
      assert.throws(() => ok('alt', { rarity: 'rare', [f]: minimum - 1, [other]: 1 }));
    }
    ok('part', { part: 'x', value: props.value.minimum });
    assert.throws(() => ok('table', { value: props.value.minimum - 1 }));
    assert.deepEqual(Object.keys(props).sort(), [...Object.keys(mode), 'kinds'].sort());
    for (const m of Object.values(ROLL_MODES))
      assert.ok(['std', 'alt', 'table', 'part'].includes(m));
  });

  it('states the rules the contract promises', () => {
    const text = OPENAPI.info.description;
    for (const needle of [
      'Daggerheart System Reference Document 2.0',
      'Access-Control-Allow-Origin: *',
      'Access-Control-Max-Age: 86400',
      'preflight',
      '/api/v1/me/',
      'ignores an Authorization header',
      'acts on the HTTP status',
      'ignore unknown fields',
      '/api/v1/catalog/index.json',
      'at most one request per user action',
      'escapes them before display'
    ]) {
      assert.ok(text.includes(needle), needle);
    }
    assert.match(
      OPENAPI.components.schemas.Rights.description,
      /English text is SRD 2\.0 Public Game Content/
    );
    assert.match(
      OPENAPI.components.schemas.Rights.description,
      /Russian text is a third-party translation/
    );
    assert.ok(
      OPENAPI.components.schemas.CatalogIndex && OPENAPI.components.schemas.CatalogChunk
    );
  });
});
