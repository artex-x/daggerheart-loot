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
import { createService } from './service.mjs';
import { buildIndex } from '../../app/src/lib/data.ts';
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

  it('calls the index builder once for two rolls of one cached file', async () => {
    let builds = 0;
    const service = createService({
      assets: async (path) => JSON.parse(FILES.get(path)),
      text: async (path) => FILES.get(path),
      rpc: async () => ({ value: null }),
      site: { base: SITE, art: SITE },
      cache: new Map(),
      build: (data) => {
        builds += 1;
        return buildIndex(data);
      }
    });
    await service.roll('std', parseRollBody('std', { total: 3 }));
    await service.roll('std', parseRollBody('std', { total: 3 }));
    assert.equal(builds, 1);
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
      '/api/v1/records': 'GET',
      '/api/v1/records/{id}': 'GET',
      '/api/v1/homebrew-items/{uuid}': 'GET',
      '/api/v1/shared-lists/{token}': 'GET',
      '/api/v1/file-checks': 'POST'
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

/* ---------- search, filter and file checks ---------- */

const DV = JSON.parse(FILES.get('apidata/version.json')).data_version;
const SHARD_HEAD = (dv) =>
  `{"format":"daggerheart-loot/api-search-shard","version":1,"data_version":"${dv}"}`;

/** Returns the files with one stub search shard of the given record lines. */
function withShard(lines, dv = DV) {
  const files = new Map(FILES);
  files.set('apidata/search/0.txt', SHARD_HEAD(dv) + '\n' + lines.join('\n') + '\n');
  const index = JSON.parse(FILES.get('apidata/search/index.json'));
  index.shards = 1;
  files.set('apidata/search/index.json', JSON.stringify(index) + '\n');
  return files;
}
const stubLine = (i, name) => `00000${name}\t${name}\tid${String(i)}\t\t${name}\t${name}`;

const get = (query) => call('/api/v1/records?' + query);

describe('the catalog search', () => {
  it('finds a record by a Russian and an English word form, in rank order', async () => {
    const res = await get('q=' + encodeURIComponent('зелья potions'));
    assert.equal(res.status, 200);
    assertApiHeaders(res);
    assert.equal(res.headers.get('cache-control'), 'public, max-age=300');
    assert.equal(res.headers.get('etag'), `"${DV}"`);
    const body = await fixture('records-q', res);
    assert.equal(body.format, 'daggerheart-loot/api-search');
    assert.ok(body.total > 0 && body.rows.length === body.total);
    for (const row of body.rows) {
      assert.deepEqual(Object.keys(row), [
        'id',
        'name',
        'kind',
        'source',
        'table',
        'tier',
        'rarity',
        'link'
      ]);
    }
    const again = await get('q=' + encodeURIComponent('зелья potions'));
    const etag = again.headers.get('etag');
    assert.equal(
      (await get('q=' + encodeURIComponent('зелья potions') + '&limit=20')).status,
      200
    );
    const cached = await call('/api/v1/records?q=' + encodeURIComponent('зелья potions'), {
      headers: { 'If-None-Match': etag }
    });
    assert.equal(cached.status, 304);
  });

  it('gives each row the link of the record', async () => {
    const body = await (await get('q=bedroll')).json();
    assert.equal(body.rows[0].id, 'ci1');
    const record = await (await call('/api/v1/records/ci1')).json();
    assert.deepEqual(body.rows[0].link, record.link);
    assert.deepEqual(body.rows[0].name, record.name);
  });

  it('answers a facet alone in catalog order, cut to limit, with the full total', async () => {
    const res = await get('kind=weapon&tier=1&limit=1');
    const body = await fixture('records-facets', res);
    assert.equal(body.rows.length, 1);
    assert.ok(body.total > 1);
    const all = await (await get('kind=weapon&tier=1&limit=50')).json();
    const order = JSON.parse(FILES.get('api/v1/catalog/index.json')).records.map((r) => r.id);
    const ids = all.rows.map((r) => r.id);
    assert.deepEqual(
      ids,
      order.filter((id) => ids.includes(id))
    );
    assert.ok(all.rows.every((r) => r.kind === 'weapon' && r.tier === 1));
  });

  it('narrows a table facet as the table lists its records', async () => {
    const body = await (await get('table=eq_weapon&limit=50')).json();
    const rows = [];
    for (const part of ['1', '2', '3', '4', 'A']) {
      rows.push(...(await (await call('/api/v1/tables/eq_weapon?part=' + part)).json()).rows);
    }
    assert.equal(body.total, rows.length);
    assert.deepEqual(body.rows.map((r) => r.id).sort(), rows.map((r) => r.id).sort());
    assert.ok((await (await get('table=alt_item&limit=50')).json()).total > 0);
  });

  it('answers 400 naming q when nothing is asked', async () => {
    const res = await call('/api/v1/records');
    assert.equal(res.status, 400);
    const body = await fixture('error-records-q-missing', res);
    assert.equal(body.error.code, 'bad_request');
    assert.match(body.error.message, /\bq\b/);
    for (const q of ['', '%20', '%22%22']) {
      const r = await get('q=' + q);
      assert.equal(r.status, 400, q);
      assert.match((await r.json()).error.message, /\bq\b/, q);
    }
    assert.equal((await get('q=&kind=armor')).status, 200);
  });

  it('refuses each bad parameter with a 400 that names the field and never echoes it', async () => {
    const cases = [
      ['q=' + 'a'.repeat(201), 'q'],
      ['q=' + encodeURIComponent(Array(9).fill('ring').join(' ')), 'q'],
      ['q=ring&limit=0', 'limit'],
      ['q=ring&limit=51', 'limit'],
      ['q=ring&limit=x1y', 'limit'],
      ['q=ring&limit=1.5', 'limit'],
      ['kind=ZZZkind', 'kind'],
      ['tier=ZZZtier', 'tier'],
      ['rarity=ZZZrarity', 'rarity'],
      ['source=ZZZsource', 'source'],
      ['table=ZZZtable', 'table'],
      ['q=ring&kind=', 'kind']
    ];
    for (const [query, field] of cases) {
      const res = await get(query);
      assert.equal(res.status, 400, query);
      const body = await res.json();
      assert.equal(body.error.code, 'bad_request', query);
      assert.match(body.error.message, new RegExp(`\\b${field}\\b`), query);
      assert.ok(!body.error.message.includes('ZZZ'), query);
    }
    assert.equal((await get('q=' + 'a'.repeat(200))).status !== 400, true);
    assert.equal(
      (await get('q=' + encodeURIComponent(Array(8).fill('ring').join(' ')))).status,
      200
    );
    assert.equal((await get('q=ring&limit=50')).status, 200);
  });

  it('refuses a parameter given twice, on every operation that reads a query', async () => {
    for (const [path, name] of [
      ['/api/v1/records?q=ring&q=sword', 'q'],
      ['/api/v1/records?kind=armor&kind=weapon', 'kind'],
      ['/api/v1/tables/eq_weapon?part=1&part=2', 'part'],
      ['/api/v1/tables/wondrous?filter=f_kind-item&filter=f_kind-consumable', 'filter']
    ]) {
      const res = await call(path);
      assert.equal(res.status, 400, path);
      const body = await res.json();
      assert.match(body.error.message, new RegExp(`\\b${name}\\b`), path);
    }
    const missing = await call('/api/v1/tables/nope?part=1&part=2');
    assert.equal(missing.status, 404);
  });

  it('answers 400 too_broad past 300 kept lines and past 3000 anchor positions', async () => {
    const kept = (n) => withShard(Array.from({ length: n }, (_, i) => stubLine(i, 'zzz')));
    state.files = kept(300);
    const ok = await get('q=zzz');
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).total, 300);
    clearCache();
    state.files = kept(301);
    const res = await get('q=zzz');
    assert.equal(res.status, 400);
    assertApiHeaders(res);
    const body = await fixture('error-records-too-broad', res);
    assert.equal(body.error.code, 'too_broad');
    assert.match(body.error.message, /\bq\b/);

    const head = (SHARD_HEAD(DV).match(/a/g) ?? []).length;
    const line = (n) => `00000${'a'.repeat(n)}\tb\tid1\t\tb\tb`;
    clearCache();
    state.files = withShard([line(3000 - head)]);
    assert.equal((await get('q=a')).status, 200);
    clearCache();
    state.files = withShard([line(3001 - head)]);
    const broad = await get('q=a');
    assert.equal(broad.status, 400);
    assert.equal((await broad.json()).error.code, 'too_broad');
  });

  it('counts a hit in the five code characters for nothing, and a line once', async () => {
    state.files = withShard(['0000oabc	abc	id1		abc	abc']);
    assert.equal((await (await get('q=o')).json()).total, 0);
    clearCache();
    state.files = withShard(['00000boo	boo	id2		boo	boo']);
    const body = await (await get('q=o')).json();
    assert.deepEqual(
      body.rows.map((r) => r.id),
      ['id2']
    );
  });

  it('re-reads once when a shard head names another data version, then answers 503', async () => {
    const other = editedFiles();
    state.files = (path) =>
      path === 'apidata/search/0.txt' ? other.get(path) : FILES.get(path);
    const res = await get('q=ring');
    assert.equal(res.status, 503);
    assertApiHeaders(res);
    assert.equal(state.fetches.filter((p) => p === 'apidata/search/0.txt').length, 2);
    assert.equal(state.fetches.filter((p) => p === 'apidata/search/index.json').length, 2);
  });

  it('answers 503 when the index or a shard cannot be read', async () => {
    state.files = (path) => (path === 'apidata/search/0.txt' ? undefined : FILES.get(path));
    assert.equal((await get('q=ring')).status, 503);
    clearCache();
    state.files = (path) =>
      path === 'apidata/search/index.json' ? undefined : FILES.get(path);
    assert.equal((await get('q=ring')).status, 503);
  });

  it('answers 405 to another method and keeps the route out of the record path', async () => {
    const res = await call('/api/v1/records', { method: 'POST' });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'GET, HEAD, OPTIONS');
    assert.equal((await call('/api/v1/records/')).status, 404);
  });

  it('reads at most the index and the shards of one search', async () => {
    await get('q=ring');
    assert.deepEqual(
      state.fetches.filter((p) => p.startsWith('apidata/')),
      ['apidata/search/index.json', 'apidata/search/0.txt']
    );
  });
});

describe('the table filter', () => {
  it('narrows a table as the tables page does for the same segment', async () => {
    const res = await call('/api/v1/tables/eq_weapon?part=2&filter=f_burden-2');
    const body = await fixture('table-eq_weapon-2-filter', res);
    const ids = body.rows.map((r) => r.id);
    assert.ok(ids.includes('q39') && !ids.includes('q38'));
    const whole = await (await call('/api/v1/tables/eq_weapon?part=2')).json();
    assert.ok(whole.rows.length > body.rows.length);
  });

  it('never answers the facet values f, with or without a filter', async () => {
    for (const path of [
      '/api/v1/tables/eq_weapon?part=1',
      '/api/v1/tables/eq_weapon?part=1&filter=f_cls-phy',
      '/api/v1/tables/wondrous',
      '/api/v1/tables/vault_of_ages?filter=f_tier-1'
    ]) {
      const body = await (await call(path)).json();
      assert.ok(body.rows.length > 0, path);
      assert.ok(
        body.rows.every((r) => !('f' in r)),
        path
      );
    }
  });

  it('ignores a group the table does not offer, and a filter on a table with no groups', async () => {
    const whole = await (await call('/api/v1/tables/wondrous')).json();
    const same = await (await call('/api/v1/tables/wondrous?filter=f_tier-1')).json();
    assert.deepEqual(same.rows, whole.rows);
    const core = await (await call('/api/v1/tables/core_item')).json();
    const filtered = await (await call('/api/v1/tables/core_item?filter=f_kind-item')).json();
    assert.deepEqual(filtered.rows, core.rows);
  });

  it('refuses a filter without f_ or past 512 characters', async () => {
    for (const filter of ['tier-1', 'x_tier-1', 'f_' + 'a'.repeat(511)]) {
      const res = await call('/api/v1/tables/eq_weapon?part=1&filter=' + filter);
      assert.equal(res.status, 400, filter.slice(0, 20));
      assert.match((await res.json()).error.message, /\bfilter\b/);
    }
    assert.equal(
      (await call('/api/v1/tables/eq_weapon?part=1&filter=f_' + 'a'.repeat(510))).status,
      200
    );
  });
});

const LISTS = (lists, version = 1) =>
  JSON.stringify({ format: 'daggerheart-loot/lists', version, lists });
const HOMEBREW = (items, version = 2) =>
  JSON.stringify({ format: 'daggerheart-loot/homebrew', version, books: [], cards: [], items });
const check = (text, headers = {}) => post('/api/v1/file-checks', text, headers);

describe('the file check', () => {
  it('accepts a lists file and names its skips by position', async () => {
    const res = await check(
      LISTS([{ name: 'Loot', entries: [{ id: 'ci1' }, { id: 'nope' }, { id: 'ci1' }] }])
    );
    assert.equal(res.status, 200);
    assertApiHeaders(res);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(res.headers.get('etag'), null);
    const body = await fixture('file-check-lists-ok', res);
    assert.equal(body.ok, true);
    assert.deepEqual(body.counts, { lists: 1, entries: 1, skipped: 2 });
    assert.deepEqual(
      body.lines.map((l) => l.list),
      [0, 0]
    );
  });

  it('gives the error lines of a lists file in both languages, naming an entry by item id', async () => {
    const res = await check(
      LISTS([{ name: '', entries: [{ id: 'ci1', quantity: 0 }, { id: 'bad id' }] }])
    );
    const body = await fixture('file-check-lists-errors', res);
    assert.equal(body.reason, 'errors');
    assert.equal(body.message, null);
    assert.equal(body.counts, null);
    assert.match(body.lines[1].text.en, /ci1/);
    assert.ok(!body.lines[1].text.en.includes('Premium Bedroll'));
    assert.match(body.lines[1].text.ru, /Позиция 1/);
  });

  it('gives the error lines of a homebrew file, and its notes when it is good', async () => {
    const res = await check(HOMEBREW([{ key: 'x' }]));
    const body = await fixture('file-check-homebrew-errors', res);
    assert.equal(body.reason, 'errors');
    assert.ok(body.lines.every((l) => l.list === null));
    const good = await (
      await check(
        HOMEBREW([
          { key: 'hb_aaaaaaaaaaaaaaaa', en: 'Lamp', ru: 'Лампа', kind: 'item', craft: ['zzz'] }
        ])
      )
    ).json();
    assert.equal(good.ok, true);
    assert.deepEqual(good.counts, { books: 0, sections: 0, cards: 0, items: 1 });
    assert.equal(good.lines.length, 1);
    assert.equal(good.file.format, 'daggerheart-loot/homebrew');
  });

  it('knows a catalog record, set and rule card from the build, as the panel would', async () => {
    const [set] = Object.keys(CATALOG.loot.sets);
    const [ref] = Object.keys(CATALOG.loot.refs);
    const item = (extra) => ({
      key: 'hb_aaaaaaaaaaaaaaaa',
      en: 'Lamp',
      kind: 'item',
      ...extra
    });
    const known = await (
      await check(HOMEBREW([item({ craft: ['ci1'], set, refs: [ref] })]))
    ).json();
    assert.equal(known.ok, true);
    assert.deepEqual(known.lines, []);
    const unknown = await (
      await check(HOMEBREW([item({ craft: ['zzz1'], set: 'zzz2', refs: ['zzz3'] })]))
    ).json();
    assert.equal(unknown.lines.length, 3);
  });

  it('refuses a file that is not JSON, of another format, or of an unknown version', async () => {
    const empty = await (await check('')).json();
    assert.equal(empty.reason, 'not_json');
    assert.deepEqual(empty.message, {
      ru: 'Это не файл JSON.',
      en: 'This is not a JSON file.'
    });
    assert.equal((await check('{nope')).status, 200);
    const unknown = await fixture(
      'file-check-unknown-format',
      await check(JSON.stringify({ format: 'other' }))
    );
    assert.equal(unknown.reason, 'unknown_format');
    assert.deepEqual(unknown.file, { format: null, version: null });
    assert.match(unknown.message.en, /lists file/);
    assert.match(unknown.message.en, /items file/);
    const version = await (await check(LISTS([{ name: 'a', entries: [] }], 9))).json();
    assert.equal(version.reason, 'version');
    assert.deepEqual(version.file, { format: 'daggerheart-loot/lists', version: 9 });
    assert.match(version.message.en, /9/);
    const noVersion = await (
      await check(JSON.stringify({ format: 'daggerheart-loot/lists', lists: [] }))
    ).json();
    assert.equal(noVersion.reason, 'version');
    assert.equal(noVersion.file.version, null);
    const none = await (await check(LISTS([]))).json();
    assert.equal(none.reason, 'empty');
    const hbVersion = await (
      await check(JSON.stringify({ format: 'daggerheart-loot/homebrew', version: 7 }))
    ).json();
    assert.equal(hbVersion.reason, 'version');
    assert.equal(hbVersion.file.version, 7);
    const hbEmpty = await (await check(HOMEBREW([]))).json();
    assert.equal(hbEmpty.reason, 'empty');
  });

  it('skips a homebrew entry without a snapshot as unheld, because there is no account', async () => {
    const res = await check(
      LISTS([{ name: 'Mine', entries: [{ id: 'hb_aaaaaaaaaaaaaaaa', source: 'homebrew' }] }], 2)
    );
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.counts.skipped, 1);
    assert.equal(body.lines.length, 1);
    assert.ok(!body.lines[0].text.en.includes('hb_'));
  });

  it('reports the first 50 errors and counts the rest', async () => {
    const entries = Array.from({ length: 60 }, () => ({ id: 'ci1', quantity: 0 }));
    const body = await (await check(LISTS([{ name: 'Many', entries }]))).json();
    assert.equal(body.lines.length, 50);
    assert.equal(body.more, 10);
  });

  it('answers the first 50 skip lines of a good lists file and counts the rest in more', async () => {
    const entries = Array.from({ length: 60 }, (_, i) => ({ id: 'nope' + String(i) }));
    const body = await (
      await check(LISTS([{ name: 'Skips', entries: [{ id: 'ci1' }, ...entries] }]))
    ).json();
    assert.equal(body.ok, true);
    assert.equal(body.counts.skipped, 60);
    assert.equal(body.lines.length, 50);
    assert.equal(body.more, 10);
    assert.equal(body.lines[0].text.en, 'Item 2: skipped - the data has no such record');
  });

  it('answers 413 past 32768 bytes before any file is read or parsed, and accepts 32768', async () => {
    const big = await check(' '.repeat(32769));
    assert.equal(big.status, 413);
    assertApiHeaders(big);
    const body = await fixture('error-file-check-too-large', big);
    assert.equal(body.error.code, 'too_large');
    assert.deepEqual(state.fetches, []);
    const edge = await check(' '.repeat(32768));
    assert.equal(edge.status, 200);
    assert.equal((await edge.json()).reason, 'not_json');
  });

  it('reads bytes that are not UTF-8 as no JSON, as the import panel does, and never as too large', async () => {
    const bytes = (body) =>
      call('/api/v1/file-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
    const enc = (s) => [...new TextEncoder().encode(s)];
    const cp1251 = new Uint8Array([
      ...enc('{"format":"daggerheart-loot/lists","version":2,"lists":[{"name":"'),
      0xcf,
      0xf0,
      ...enc('","entries":[]}]}')
    ]);
    for (const body of [cp1251, new Uint8Array(32768).fill(0xff)]) {
      const res = await bytes(body);
      assert.equal(res.status, 200);
      const answer = await res.json();
      assert.equal(answer.reason, 'not_json');
      assert.equal(answer.message.en, 'This is not a JSON file.');
    }
  });

  it('answers 415 to another media type, 405 to GET, and reads no file for either', async () => {
    const res = await call('/api/v1/file-checks', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: '{}'
    });
    assert.equal(res.status, 415);
    assert.equal((await res.json()).error.code, 'unsupported_media_type');
    const get405 = await call('/api/v1/file-checks');
    assert.equal(get405.status, 405);
    assert.equal(get405.headers.get('allow'), 'POST, OPTIONS');
    assert.deepEqual(state.fetches, []);
  });

  it('reads the records index and the file-check data once while they are cached', async () => {
    await check(LISTS([{ name: 'a', entries: [{ id: 'ci1' }] }]));
    await check(LISTS([{ name: 'b', entries: [{ id: 'ci2' }] }]));
    assert.deepEqual(
      state.fetches.filter((p) => p.startsWith('apidata/')),
      ['apidata/records/index.json', 'apidata/file-check.json']
    );
  });

  it('re-reads once on a data version mismatch, then answers 503', async () => {
    const other = editedFiles();
    state.files = (path) =>
      path === 'apidata/file-check.json' ? other.get(path) : FILES.get(path);
    const res = await check(LISTS([{ name: 'a', entries: [{ id: 'ci1' }] }]));
    assert.equal(res.status, 503);
  });
});
