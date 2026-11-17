// The account API's purchase requests and notices (docs/specs/CONTRACTS.md section 6,
// "Account API") through the worker's fetch handler, over the stub Supabase of me-fake.mjs,
// whose request functions stand in for 20261007130000_homebrew_links.sql and
// 20261007130100_list_entry_gm_only.sql. The answers the section pins are compared byte for
// byte with docs/fixtures/api/v1/me-requests-*.json and docs/fixtures/mcp/me-requests-*.json.
// `npm run check` runs it in the stage test:preview.
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import openapi from './openapi.json' with { type: 'json' };
import {
  API_FIXTURES,
  ENV,
  GM,
  HOST,
  MCP_FIXTURES,
  OTHER,
  fakeSupabase,
  mint,
  pinned
} from './me-fake.mjs';
import { clearCache } from './rest.mjs';

const { default: worker } = await import('../worker.mjs');

const TOKEN = mint();
const id = (prefix, n) => `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;
const L = (n) => id('aaaaaaaa', n);
const E = (n) => id('eeeeeeee', n);
const Q = (n) => id('dddddddd', n);
const N = (n) => id('ffffffff', n);
const S = (n) => id('55555555', n);
const SHARE = 'S'.repeat(43);
/* The clock of every case: the worker's `expired` and the fake's expiry read it. */
const NOW = Date.UTC(2026, 10, 14, 12);
const at = (minutes) => new Date(NOW + minutes * 60000).toISOString();

let fake;
const realFetch = globalThis.fetch;
const realNow = Date.now;
beforeEach(() => {
  clearCache();
  fake = fakeSupabase();
  globalThis.fetch = fake.fetch;
  Date.now = () => NOW;
});
afterEach(() => {
  globalThis.fetch = realFetch;
  Date.now = realNow;
});

const me = (path, { method = 'GET', body, token = TOKEN } = {}) =>
  worker.fetch(
    new Request(HOST + '/api/v1/me' + path, {
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    }),
    ENV
  );
const read = async (res) => ({
  status: res.status,
  body: res.status === 204 ? null : await res.json()
});
async function fixture(name, res) {
  const text = await res.text();
  pinned(join(API_FIXTURES, name + '.json'), text);
  return { status: res.status, body: JSON.parse(text) };
}
const calls = (path) => fake.state.calls.filter((c) => c.path === path);
const entriesOf = (lid) =>
  fake.state.db.entries
    .filter((e) => e.list_id === lid)
    .sort((a, b) => a.position - b.position)
    .map((e) => [e.item_key, e.quantity, e.position]);

/** Adds a share link of `list` and a pending request through it. */
function seedShare(list, audience = 'player', n = 1) {
  fake.state.db.shares.push({
    id: S(n),
    list_id: list,
    audience,
    token: n === 1 ? SHARE : String.fromCharCode(64 + n).repeat(43),
    created_at: at(-600),
    revoked_at: null
  });
}
function seedRequest(n, list, lines, over = {}) {
  const r = {
    id: Q(n),
    list_id: list,
    share_id: S(1),
    audience: 'player',
    status: 'pending',
    created_at: at(-60 + n),
    expires_at: at(30 * 24 * 60),
    decided_at: null,
    read_at: null,
    lines: lines.map(([item_key, quantity, price_coins = null]) => ({
      item_key,
      quantity,
      price_coins,
      applied_quantity: null
    })),
    ...over
  };
  fake.state.db.requests.push(r);
  return r;
}
function seedNotice(n, list, over = {}) {
  fake.state.db.notices.push({
    id: N(n),
    list_id: list,
    item_key: 'hb_abcdefghijklmnop',
    hid: id('bbbbbbbb', n),
    kind: 'changed',
    name: { ru: 'Фонарь', en: 'Lantern' },
    created_at: at(-30 + n),
    read_at: null,
    ...over
  });
}
const market = () =>
  fake.seedList({ id: L(1), name: 'Market' }, [
    { id: E(1), item_key: 'ci1', quantity: 3, price_coins: 50 },
    { id: E(2), item_key: 'ci2', quantity: 1 },
    { id: E(3), item_key: 'ci3', quantity: 2 }
  ]);

describe('GET /me/lists/{id}/requests', () => {
  it('answers the pending requests with their lines, the notices and pages', async () => {
    market();
    fake.seedList({ id: L(2), name: 'Other' });
    seedShare(L(1));
    seedRequest(1, L(1), [
      ['ci2', 1],
      ['ci1', 2, 50]
    ]);
    seedRequest(2, L(1), [['ci3', 1]], { read_at: at(-90), expires_at: at(-30) });
    seedRequest(3, L(1), [['ci1', 1]], { status: 'applied', decided_at: at(-5) });
    seedRequest(4, L(2), [['ci1', 1]]);
    seedNotice(1, L(1), { read_at: at(-1) });
    seedNotice(2, L(1));
    seedNotice(3, L(2));
    const { body } = await fixture('me-requests-list', await me(`/lists/${L(1)}/requests`));
    assert.deepEqual(
      body.requests.map((r) => [r.id, r.expired]),
      [
        [Q(1), false],
        [Q(2), true]
      ]
    );
    assert.deepEqual(body.requests[0].lines, [
      { key: 'ci1', quantity: 2, price_coins: 50, applied_quantity: null },
      { key: 'ci2', quantity: 1, price_coins: null, applied_quantity: null }
    ]);
    assert.deepEqual(
      body.notices.map((n) => [n.id, n.read_at === null]),
      [
        [N(2), true],
        [N(1), false]
      ]
    );
    assert.equal(body.next, null);
    const first = await read(await me(`/lists/${L(1)}/requests?limit=1`));
    assert.deepEqual(
      first.body.requests.map((r) => r.id),
      [Q(1)]
    );
    assert.equal(first.body.notices.length, 2);
    const second = await read(
      await me(`/lists/${L(1)}/requests?limit=1&cursor=${first.body.next}`)
    );
    assert.deepEqual(
      second.body.requests.map((r) => r.id),
      [Q(2)]
    );
    assert.equal(second.body.notices, null);
    assert.equal(second.body.next, null);
    assert.equal(calls('list_notices').length, 2);
  });

  it("answers 404 for another account's list and 422 past the read cap", async () => {
    fake.seedList({ id: L(3) }, [], OTHER);
    assert.equal((await me(`/lists/${L(3)}/requests`)).status, 404);
    market();
    fake.state.fail = (name, _body, method) =>
      name === 'purchase_requests' && method === 'GET'
        ? new Response('x'.repeat(65537), { headers: { 'Content-Type': 'application/json' } })
        : undefined;
    const big = await read(await me(`/lists/${L(1)}/requests`));
    assert.equal(big.status, 422);
    assert.equal(big.body.error.code, 'answer_too_large');
  });

  it('answers 10 requests of 100 lines at the default limit', async () => {
    market();
    seedShare(L(1));
    const keys = Array.from({ length: 100 }, (_, i) => `hb_${String(i).padStart(16, '0')}`);
    for (let n = 1; n <= 10; n++) {
      seedRequest(
        n,
        L(1),
        keys.map((k) => [k, 99, 9999])
      );
    }
    const r = await read(await me(`/lists/${L(1)}/requests`));
    assert.equal(r.status, 200);
    assert.equal(r.body.requests.length, 10);
    assert.ok(r.body.requests.every((q) => q.lines.length === 100));
    assert.deepEqual(r.body.requests[0].lines[0], {
      key: keys[0],
      quantity: 99,
      price_coins: 9999,
      applied_quantity: null
    });
  });

  it('answers the requests and notices_more when the notices pass their cap', async () => {
    market();
    seedShare(L(1));
    seedRequest(1, L(1), [['ci1', 1]]);
    for (let n = 1; n <= 151; n++) seedNotice(n, L(1));
    const capped = await read(await me(`/lists/${L(1)}/requests`));
    assert.equal(capped.status, 200);
    assert.equal(capped.body.notices.length, 150);
    assert.equal(capped.body.notices[0].id, N(151));
    assert.equal(capped.body.notices_more, true);
    assert.equal(capped.body.requests.length, 1);
    fake.state.fail = (name, _body, method) =>
      name === 'list_notices' && method === 'GET'
        ? new Response('x'.repeat(65537), { headers: { 'Content-Type': 'application/json' } })
        : undefined;
    const big = await read(await me(`/lists/${L(1)}/requests`));
    assert.equal(big.status, 200);
    assert.deepEqual([big.body.notices, big.body.notices_more], [null, true]);
    assert.deepEqual(
      big.body.requests.map((q) => q.id),
      [Q(1)]
    );
  });
});

describe('POST /me/requests/{id}/accept', () => {
  it("changes the list's quantities as the app's accept; a retry answers the decision", async () => {
    market();
    seedShare(L(1));
    seedRequest(1, L(1), [
      ['ci1', 2, 50],
      ['ci2', 1]
    ]);
    const { status, body } = await fixture(
      'me-requests-accepted',
      await me(`/requests/${Q(1)}/accept`, { method: 'POST' })
    );
    assert.equal(status, 200);
    assert.equal(body.status, 'applied');
    assert.equal(body.taken, 3);
    /* ci2 is taken whole: its entry goes and the places close up. */
    assert.deepEqual(entriesOf(L(1)), [
      ['ci1', 1, 0],
      ['ci3', 2, 1]
    ]);
    const again = await read(
      await me(`/requests/${Q(1)}/accept`, { method: 'POST', body: {} })
    );
    assert.equal(again.status, 200);
    assert.deepEqual(again.body, body);
    assert.deepEqual(entriesOf(L(1)), [
      ['ci1', 1, 0],
      ['ci3', 2, 1]
    ]);
    assert.deepEqual(calls('rpc/apply_purchase_request').at(-1).body, {
      p_id: Q(1),
      p_clamp: false
    });
  });

  it('answers 409 short with what is available; the list stays, the request is read', async () => {
    market();
    seedShare(L(1));
    seedRequest(1, L(1), [
      ['ci1', 5],
      ['ci3', 1]
    ]);
    const { status, body } = await fixture(
      'me-requests-short',
      await me(`/requests/${Q(1)}/accept`, { method: 'POST' })
    );
    assert.equal(status, 409);
    assert.equal(body.error.code, 'short');
    assert.deepEqual(body.error.short, [{ key: 'ci1', want: 5, have: 3 }]);
    assert.deepEqual(entriesOf(L(1)), [
      ['ci1', 3, 0],
      ['ci2', 1, 1],
      ['ci3', 2, 2]
    ]);
    const [req] = fake.state.db.requests;
    assert.equal(req.status, 'pending');
    /* apply_purchase_request marks an unread request read and limits it to one more hour. */
    assert.equal(req.read_at, at(0));
    assert.equal(req.expires_at, at(60));
    assert.match(body.error.message, /now read and expires within the hour/);
  });

  it('with clamp takes what the list holds, and refuses a list that holds none', async () => {
    market();
    seedShare(L(1));
    seedRequest(1, L(1), [
      ['ci1', 5],
      ['ci3', 1]
    ]);
    const r = await read(
      await me(`/requests/${Q(1)}/accept`, { method: 'POST', body: { clamp: true } })
    );
    assert.equal(r.status, 200);
    assert.equal(r.body.taken, 4);
    assert.deepEqual(
      r.body.lines.map((l) => [l.key, l.applied_quantity]),
      [
        ['ci1', 3],
        ['ci3', 1]
      ]
    );
    assert.deepEqual(entriesOf(L(1)), [
      ['ci2', 1, 0],
      ['ci3', 1, 1]
    ]);
    /* ci1 was taken whole: the list holds none of it now. */
    seedRequest(2, L(1), [['ci1', 2]]);
    const none = await read(
      await me(`/requests/${Q(2)}/accept`, { method: 'POST', body: { clamp: true } })
    );
    assert.equal(none.status, 409);
    assert.equal(none.body.error.code, 'short');
    assert.deepEqual(none.body.error.short, [{ key: 'ci1', want: 2, have: 0 }]);
    assert.equal(
      (await me(`/requests/${Q(2)}/accept`, { method: 'POST', body: { clamp: 1 } })).status,
      400
    );
  });
});

describe('POST /me/requests/{id}/decline', () => {
  it('declines; a decided request answers its decided state', async () => {
    market();
    seedShare(L(1));
    seedRequest(1, L(1), [['ci1', 1]]);
    seedRequest(2, L(1), [['ci2', 1]]);
    seedRequest(3, L(1), [['ci3', 1]], { read_at: at(-90), expires_at: at(-30) });
    const declined = await read(await me(`/requests/${Q(1)}/decline`, { method: 'POST' }));
    assert.equal(declined.status, 200);
    assert.equal(declined.body.status, 'declined');
    assert.equal(declined.body.taken, 0);
    assert.deepEqual(entriesOf(L(1))[0], ['ci1', 3, 0]);
    const again = await read(await me(`/requests/${Q(1)}/decline`, { method: 'POST' }));
    assert.deepEqual(again, declined);
    const accept = await read(await me(`/requests/${Q(1)}/accept`, { method: 'POST' }));
    assert.equal(accept.status, 409);
    assert.deepEqual(
      [accept.body.error.code, accept.body.error.status],
      ['conflict', 'declined']
    );
    assert.equal((await me(`/requests/${Q(2)}/accept`, { method: 'POST' })).status, 200);
    const late = await read(await me(`/requests/${Q(2)}/decline`, { method: 'POST' }));
    assert.deepEqual([late.status, late.body.error.status], [409, 'applied']);
    const expired = await read(await me(`/requests/${Q(3)}/decline`, { method: 'POST' }));
    assert.deepEqual([expired.status, expired.body.error.status], [409, 'expired']);
    fake.seedList({ id: L(3) }, [{ id: E(9), item_key: 'ci1' }], OTHER);
    seedRequest(4, L(3), [['ci1', 1]]);
    assert.equal((await me(`/requests/${Q(4)}/decline`, { method: 'POST' })).status, 404);
    assert.equal((await me(`/requests/${Q(9)}/accept`, { method: 'POST' })).status, 404);
  });

  it('takes Content-Length: 0 with no Content-Type as no body', async () => {
    market();
    seedShare(L(1));
    seedRequest(1, L(1), [['ci1', 1]]);
    const res = await worker.fetch(
      new Request(HOST + `/api/v1/me/requests/${Q(1)}/decline`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Length': '0' },
        body: new Uint8Array(0)
      }),
      ENV
    );
    const r = await read(res);
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'declined');
  });
});

describe('POST /me/lists/{id}/read', () => {
  it("marks the list's notices and requests read; another account's list is 404", async () => {
    market();
    fake.seedList({ id: L(2) });
    seedShare(L(1));
    seedRequest(1, L(1), [['ci1', 1]]);
    seedNotice(1, L(1));
    seedNotice(2, L(2));
    const r = await me(`/lists/${L(1)}/read`, { method: 'POST' });
    assert.equal(r.status, 204);
    assert.equal(await r.text(), '');
    const [req] = fake.state.db.requests;
    assert.equal(req.read_at, at(0));
    assert.equal(req.expires_at, at(60));
    assert.deepEqual(
      fake.state.db.notices.map((n) => n.read_at),
      [at(0), null]
    );
    fake.seedList({ id: L(3) }, [], OTHER);
    assert.equal((await me(`/lists/${L(3)}/read`, { method: 'POST' })).status, 404);
  });
});

describe('POST /me/notices/delete', () => {
  it('takes confirm for more than one id; 101 ids are 400', async () => {
    market();
    for (const n of [1, 2, 3]) seedNotice(n, L(1));
    const ids = [N(1), N(2)];
    const ask = await read(await me('/notices/delete', { method: 'POST', body: { ids } }));
    assert.equal(ask.status, 409);
    assert.deepEqual([ask.body.error.code, ask.body.error.confirm], ['confirm_required', 2]);
    assert.equal(fake.state.db.notices.length, 3);
    const done = await read(
      await me('/notices/delete', { method: 'POST', body: { ids, confirm: 2 } })
    );
    assert.equal(done.status, 200);
    assert.deepEqual(
      done.body.results,
      ids.map((x) => ({ id: x, result: 'ok' }))
    );
    assert.deepEqual(
      fake.state.db.notices.map((n) => n.id),
      [N(3)]
    );
    const retry = await read(
      await me('/notices/delete', { method: 'POST', body: { ids, confirm: 2 } })
    );
    assert.deepEqual(retry, done);
    const one = await me('/notices/delete', { method: 'POST', body: { ids: [N(3)] } });
    assert.equal(one.status, 200);
    assert.equal(fake.state.db.notices.length, 0);
    const many = Array.from({ length: 101 }, (_, i) => N(100 + i));
    const big = await me('/notices/delete', {
      method: 'POST',
      body: { ids: many, confirm: 101 }
    });
    assert.equal(big.status, 400);
  });
});

describe('POST /me/shared-lists/{token}/requests', () => {
  const OWN = 'O'.repeat(43);
  const lines = [{ key: 'ci1', quantity: 2 }];

  it("sends a request to another reader's list; a replay by id sends nothing twice", async () => {
    fake.seedList(
      { id: L(5), name: 'Shop' },
      [{ id: E(5), item_key: 'ci1', quantity: 4, price_coins: 30 }],
      OTHER
    );
    seedShare(L(5));
    const { status, body } = await fixture(
      'me-requests-sent',
      await me(`/shared-lists/${SHARE}/requests`, { method: 'POST', body: { id: Q(7), lines } })
    );
    assert.equal(status, 201);
    assert.deepEqual(body.lines, lines);
    const again = await me(`/shared-lists/${SHARE}/requests`, {
      method: 'POST',
      body: { id: Q(7), lines }
    });
    assert.equal(again.status, 201);
    assert.equal(fake.state.db.requests.length, 1);
    const [req] = fake.state.db.requests;
    assert.deepEqual([req.list_id, req.lines[0].price_coins], [L(5), 30]);
    assert.deepEqual(calls('rpc/create_purchase_request')[0].body, {
      p_id: Q(7),
      p_token: SHARE,
      p_lines: [{ item: 'ci1', qty: 2 }]
    });
    assert.ok(!JSON.stringify(body).includes(SHARE));
  });

  it("refuses the reader's own list before the function; a stale key and an unknown link", async () => {
    market();
    fake.state.db.shares.push({
      id: S(2),
      list_id: L(1),
      audience: 'player',
      token: OWN,
      created_at: at(-1),
      revoked_at: null
    });
    const own = await read(
      await me(`/shared-lists/${OWN}/requests`, { method: 'POST', body: { lines } })
    );
    assert.deepEqual([own.status, own.body.error.code], [409, 'conflict']);
    assert.equal(calls('rpc/create_purchase_request').length, 0);
    assert.equal(fake.state.db.requests.length, 0);
    /* A stopped link of the reader's own list is an unknown link, as every stopped link. */
    fake.state.db.shares.find((s) => s.token === OWN).revoked_at = at(0);
    const stopped = await me(`/shared-lists/${OWN}/requests`, {
      method: 'POST',
      body: { lines }
    });
    assert.equal(stopped.status, 404);
    fake.seedList({ id: L(5) }, [{ id: E(5), item_key: 'ci1', gm_only: true }], OTHER);
    seedShare(L(5));
    const stale = await read(
      await me(`/shared-lists/${SHARE}/requests`, { method: 'POST', body: { lines } })
    );
    assert.deepEqual([stale.status, stale.body.error.code], [409, 'conflict']);
    const unknown = await me(`/shared-lists/${'U'.repeat(43)}/requests`, {
      method: 'POST',
      body: { lines }
    });
    assert.equal(unknown.status, 404);
    assert.equal(
      (await me(`/shared-lists/short/requests`, { method: 'POST', body: { lines } })).status,
      404
    );
    const twice = await me(`/shared-lists/${SHARE}/requests`, {
      method: 'POST',
      body: { lines: [lines[0], lines[0]] }
    });
    assert.equal(twice.status, 400);
    const zero = await me(`/shared-lists/${SHARE}/requests`, {
      method: 'POST',
      body: { lines: [{ key: 'ci1', quantity: 0 }] }
    });
    assert.equal(zero.status, 400);
  });

  it("answers the owner's limits as 409 limit_reached", async () => {
    fake.seedList({ id: L(5) }, [{ id: E(5), item_key: 'ci1', quantity: 4 }], OTHER);
    seedShare(L(5));
    for (let n = 1; n <= 5; n++) {
      assert.equal(
        (
          await me(`/shared-lists/${SHARE}/requests`, {
            method: 'POST',
            body: { id: Q(n), lines }
          })
        ).status,
        201
      );
    }
    const rate = await read(
      await me(`/shared-lists/${SHARE}/requests`, { method: 'POST', body: { id: Q(6), lines } })
    );
    assert.deepEqual(
      [rate.status, rate.body.error.code, rate.body.error.limit],
      [409, 'limit_reached', 'request_rate']
    );
  });
});

describe('GET /me/requests', () => {
  it('answers the pending heads over every list, paged, and the unread notice counts', async () => {
    market();
    fake.seedList({ id: L(2), name: 'Other' }, [{ id: E(4), item_key: 'ci1' }]);
    fake.seedList({ id: L(3) }, [{ id: E(9), item_key: 'ci1' }], OTHER);
    seedShare(L(1));
    seedRequest(1, L(2), [['ci1', 1]]);
    seedRequest(2, L(1), [['ci2', 1]], { read_at: at(-90), expires_at: at(-30) });
    seedRequest(3, L(1), [['ci1', 1]], { status: 'declined', decided_at: at(-1) });
    seedRequest(4, L(3), [['ci1', 1]]);
    seedNotice(1, L(1));
    seedNotice(2, L(1));
    seedNotice(3, L(2), { read_at: at(-1) });
    seedNotice(4, L(3));
    const { body } = await fixture('me-requests-all', await me('/requests'));
    assert.deepEqual(
      body.requests.map((r) => [r.id, r.list_id, r.expired]),
      [
        [Q(1), L(2), false],
        [Q(2), L(1), true]
      ]
    );
    assert.deepEqual(body.unread_notices, [{ list_id: L(1), count: 2 }]);
    const first = await read(await me('/requests?limit=1'));
    assert.deepEqual(
      first.body.requests.map((r) => r.id),
      [Q(1)]
    );
    const second = await read(await me('/requests?limit=1&cursor=' + first.body.next));
    assert.deepEqual(
      second.body.requests.map((r) => r.id),
      [Q(2)]
    );
    assert.equal(second.body.unread_notices, null);
    assert.equal(second.body.next, null);
    /* One read of the heads and one of the counts, whatever the number of lists. */
    assert.equal(calls('purchase_requests').length, 3);
    assert.equal(calls('lists').length, 2);
  });
});

describe('/mcp/me request tools', () => {
  const REQUEST_TOOLS = Object.entries(openapi.paths)
    .filter(([p]) => /\/requests|\/read$|\/notices\//.test(p) && p.startsWith('/api/v1/me/'))
    .flatMap(([, o]) => Object.values(o))
    .map((op) => op['x-mcp-tool']);
  const rpc = (msgId, method, params) => ({ jsonrpc: '2.0', id: msgId, method, params });
  const mcp = (body) =>
    worker.fetch(
      new Request(HOST + '/mcp/me', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
          'MCP-Protocol-Version': '2025-06-18'
        },
        body: JSON.stringify(body)
      }),
      ENV
    );
  const callTool = async (name, args) =>
    (await (await mcp(rpc(1, 'tools/call', { name, arguments: args }))).json()).result;

  it('lists the request tools: the deletes and the decisions destructive, a send not idempotent', async () => {
    const tools = new Map(
      (await (await mcp(rpc(1, 'tools/list'))).json()).result.tools.map((t) => [t.name, t])
    );
    assert.deepEqual(REQUEST_TOOLS, [
      'list_requests',
      'accept_request',
      'decline_request',
      'mark_list_read',
      'hide_notices',
      'send_request',
      'list_my_requests'
    ]);
    for (const name of REQUEST_TOOLS) assert.ok(tools.has(name), name);
    for (const name of ['hide_notices', 'accept_request', 'decline_request']) {
      assert.equal(tools.get(name).annotations.destructiveHint, true, name);
      assert.match(tools.get(name).description, /\bask/i, name);
    }
    assert.equal(tools.get('send_request').annotations.idempotentHint, false);
    assert.equal(tools.get('list_my_requests').annotations.readOnlyHint, true);
    assert.deepEqual(tools.get('send_request').inputSchema.required, ['token', 'lines']);
  });

  it('calls each request tool on its operation', async () => {
    market();
    fake.seedList({ id: L(5) }, [{ id: E(5), item_key: 'ci1', quantity: 4 }], OTHER);
    seedShare(L(5));
    seedRequest(1, L(1), [['ci1', 1]]);
    seedRequest(2, L(1), [['ci2', 1]]);
    seedNotice(1, L(1));
    seedNotice(2, L(1));
    const res = await mcp(rpc(1, 'tools/call', { name: 'list_my_requests', arguments: {} }));
    const text = await res.text();
    pinned(
      join(MCP_FIXTURES, 'me-requests-tools-call.json'),
      JSON.stringify(
        {
          request: {
            method: 'POST',
            path: '/mcp/me',
            headers: {
              'Content-Type': 'application/json',
              'MCP-Protocol-Version': '2025-06-18',
              Authorization: 'Bearer <client token>'
            },
            body: rpc(1, 'tools/call', { name: 'list_my_requests', arguments: {} })
          },
          answer: { status: res.status, body: JSON.parse(text) }
        },
        null,
        2
      ) + '\n'
    );
    const all = JSON.parse(text).result.structuredContent;
    assert.equal(all.requests.length, 2);
    const list = await callTool('list_requests', { list_id: L(1), limit: 1 });
    assert.equal(list.structuredContent.requests.length, 1);
    assert.equal(
      (await callTool('accept_request', { request_id: Q(1) })).structuredContent.status,
      'applied'
    );
    assert.equal(
      (await callTool('decline_request', { request_id: Q(2).toUpperCase() })).structuredContent
        .status,
      'declined'
    );
    assert.deepEqual((await callTool('mark_list_read', { list_id: L(1) })).structuredContent, {
      status: 204
    });
    const hidden = await callTool('hide_notices', { ids: [N(1), N(2)], confirm: 2 });
    assert.equal(hidden.structuredContent.results.length, 2);
    const sent = await callTool('send_request', {
      token: SHARE,
      id: Q(8),
      lines: [{ key: 'ci1', quantity: 1 }]
    });
    assert.equal(sent.structuredContent.id, Q(8));
    const bad = await callTool('send_request', { token: 'x&select=*', lines: [] });
    assert.equal(bad.structuredContent.error.code, 'not_found');
    assert.equal(fake.state.calls.filter((c) => c.query.includes('select=*')).length, 0);
    const missing = await callTool('accept_request', { request_id: Q(9) });
    assert.equal(missing.structuredContent.error.code, 'not_found');
    assert.equal(GM.length, 36);
  });
});
