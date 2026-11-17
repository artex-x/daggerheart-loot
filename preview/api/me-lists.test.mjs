// The account API's list operations (docs/specs/CONTRACTS.md section 6, "Account API")
// through the worker's fetch handler, over the stub Supabase of me-fake.mjs. Prices, files and
// share links are checked against the app's own functions (lib/money.ts, lib/bundle.ts,
// lib/hash.ts). The answers docs/specs/CONTRACTS.md section 6 pins are compared byte for byte
// with docs/fixtures/api/v1/me-*.json. `npm run check` runs it in the stage test:preview.
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  API_FIXTURES,
  CATALOG,
  ENV,
  GM,
  HOST,
  OTHER,
  SITE,
  fakeSupabase,
  mint,
  pinned
} from './me-fake.mjs';
import { clearCache } from './rest.mjs';
import { buildIndex } from '../../app/src/lib/data.ts';
import { parseBundle } from '../../app/src/lib/bundle.ts';
import { appUrl, cardVersion, shareHash } from '../../app/src/lib/hash.ts';
import { derivedKey } from '../../app/src/lib/homebrew.ts';
import { guessPrice, reprice } from '../../app/src/lib/money.ts';

const { default: worker } = await import('../worker.mjs');

const TOKEN = mint();
const INDEX = buildIndex(CATALOG.loot);
const CATALOG_IDS = [...INDEX.byId.keys()].filter((id) => !id.startsWith('hb_'));
const id = (prefix, n) => `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;
const L = (n) => id('aaaaaaaa', n);
const E = (n) => id('eeeeeeee', n);
const HID = id('bbbbbbbb', 1);
const HB = 'hb_abcdefghijklmnop';
const IMPORT_ID = id('cccccccc', 1);

let fake;
const realFetch = globalThis.fetch;
beforeEach(() => {
  clearCache();
  fake = fakeSupabase();
  globalThis.fetch = fake.fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const me = (path, { method = 'GET', body, rev, token = TOKEN } = {}) =>
  worker.fetch(
    new Request(HOST + '/api/v1/me' + path, {
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(rev === undefined ? {} : { 'If-Match': `"${String(rev)}"` })
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    }),
    ENV
  );
const read = async (res) => ({
  status: res.status,
  headers: res.headers,
  body: res.status === 204 ? null : await res.json()
});
async function fixture(name, res) {
  const text = await res.text();
  pinned(join(API_FIXTURES, name + '.json'), text);
  return JSON.parse(text);
}
const calls = (path) => fake.state.calls.filter((c) => c.path === path);
const writes = () =>
  fake.state.calls.filter(
    (c) => c.method !== 'GET' && !['rpc/my_limit', 'rpc/get_homebrew_items'].includes(c.path)
  );
const listOf = (lid) => fake.state.db.lists.find((l) => l.id === lid);
const entriesOf = (lid) =>
  fake.state.db.entries
    .filter((e) => e.list_id === lid)
    .sort((a, b) => a.position - b.position || (a.id < b.id ? -1 : 1));

const RECORD = {
  id: HB,
  src: 'homebrew',
  kind: 'item',
  en: 'Lantern',
  ru: 'Фонарь',
  ende: 'It **glows**.',
  rud: 'Он **светится**.'
};
const seedItem = (over = {}) =>
  fake.state.db.items.push({ id: HID, owner_id: OTHER, key: HB, record: RECORD, ...over });

describe('GET /me/lists', () => {
  it('answers the heads and the limits', async () => {
    fake.seedList({ id: L(1), name: 'Market' }, [
      { id: E(1), item_key: 'ci1' },
      { id: E(2), item_key: 'ci2' }
    ]);
    fake.seedList({ id: L(2), name: 'Empty' });
    const body = await fixture('me-lists', await me('/lists'));
    assert.deepEqual(body.limits, { lists: 50, entries: 100 });
    assert.deepEqual(
      body.lists.map((l) => [l.id, l.rev, l.entries, l.link]),
      [
        [L(1), '1', 2, SITE + 'lists/' + L(1)],
        [L(2), '1', 0, SITE + 'lists/' + L(2)]
      ]
    );
    assert.equal(body.next, null);
  });

  it('answers 422 that asks for a smaller limit past 65536 bytes of heads', async () => {
    fake.state.fail = (name, body, method) =>
      name === 'lists' && method === 'GET'
        ? new Response('x'.repeat(65537), { headers: { 'Content-Type': 'application/json' } })
        : undefined;
    const { status, body } = await read(await me('/lists'));
    assert.equal(status, 422);
    assert.equal(body.error.code, 'answer_too_large');
    assert.match(body.error.message, /smaller limit/);
  });

  it('finds a list by an upper-case uuid in the path, as /mcp/me does', async () => {
    fake.seedList({ id: L(1), name: 'Market' });
    const { status, body } = await read(await me('/lists/' + L(1).toUpperCase()));
    assert.equal(status, 200);
    assert.equal(body.id, L(1));
  });
});

describe('GET /me/lists/{id}', () => {
  it('answers the fields and the entries in list order with the ETag', async () => {
    seedItem();
    fake.seedList(
      { id: L(1), name: 'Market', player_note: 'For the party', gm_note: 'Secret' },
      [
        { id: E(1), item_key: 'ci1', position: 2, quantity: 3, price_coins: 120 },
        {
          id: E(2),
          item_key: HB,
          source: 'homebrew',
          hb_item: HID,
          position: 0,
          gm_only: true
        },
        { id: E(3), item_key: 'cc1', position: 1, player_note: 'note', gm_note: 'hidden' }
      ]
    );
    const res = await me('/lists/' + L(1));
    assert.equal(res.headers.get('etag'), '"1"');
    const body = await fixture('me-list', res);
    assert.deepEqual(
      body.entries.map((e) => [e.id, e.origin, e.record_id]),
      [
        [E(2), 'homebrew', HID],
        [E(3), 'catalog', 'cc1'],
        [E(1), 'catalog', 'ci1']
      ]
    );
  });

  it("answers 404 to another account's list", async () => {
    fake.seedList({ id: L(1), name: 'Theirs' }, [], OTHER);
    const { status, body } = await read(await me('/lists/' + L(1)));
    assert.equal(status, 404);
    assert.equal(body.error.code, 'not_found');
  });

  it('answers 422 with the app link past 65536 bytes of Supabase answer', async () => {
    fake.state.fail = (name, body, method) =>
      name === 'lists' && method === 'GET'
        ? new Response('x'.repeat(65537), { headers: { 'Content-Type': 'application/json' } })
        : undefined;
    const body = await fixture('me-error-answer-too-large', await me('/lists/' + L(1)));
    assert.equal(body.error.code, 'answer_too_large');
    assert.ok(body.error.message.endsWith(SITE + 'lists/' + L(1)));
  });
});

describe('POST /me/lists', () => {
  it('creates a list with entries (201), and the same id again answers 200', async () => {
    seedItem({ owner_id: GM });
    const body = {
      id: L(1),
      name: 'New',
      money_mode: 'coin',
      entries: [
        { id: E(1), record_id: 'ci1', quantity: 2 },
        { id: E(2), record_id: HB, price_coins: 50 },
        { id: E(3), record_id: 'ci1' }
      ]
    };
    const made = await read(await me('/lists', { method: 'POST', body }));
    assert.equal(made.status, 201);
    assert.equal(made.body.money_mode, 'coin');
    assert.deepEqual(
      made.body.entries.map((e) => [e.id, e.record_id, e.quantity, e.price_coins]),
      [
        [E(1), 'ci1', 2, null],
        [E(2), HID, 1, 50]
      ]
    );
    const again = await read(await me('/lists', { method: 'POST', body }));
    assert.equal(again.status, 200);
    assert.equal(calls('rpc/apply_list_writes').length, 1);
  });

  it("answers 409 conflict to another account's id and 409 limit_reached past the limit", async () => {
    fake.seedList({ id: L(1), name: 'Theirs' }, [], OTHER);
    const taken = await read(
      await me('/lists', { method: 'POST', body: { id: L(1), name: 'x' } })
    );
    assert.equal(taken.status, 409);
    assert.equal(taken.body.error.code, 'conflict');
    fake.seedList({ id: L(2), name: 'Mine' });
    fake.state.db.limits.lists_per_owner = 1;
    const res = await me('/lists', { method: 'POST', body: { id: L(3), name: 'One more' } });
    const body = await fixture('me-error-limit-reached', res);
    assert.equal(res.status, 409);
    assert.equal(body.error.limit, 'lists_per_owner');
  });

  it('refuses a missing name and an unknown record id before any write', async () => {
    for (const body of [
      { id: L(1) },
      { id: L(1), name: 'x', entries: [{ record_id: 'nope' }] },
      { id: L(1), name: 'x'.repeat(201) },
      { id: L(1), name: 'x', money_mode: 'gold' }
    ]) {
      assert.equal((await me('/lists', { method: 'POST', body })).status, 400);
    }
    assert.equal(writes().length, 0);
  });
});

describe('PATCH /me/lists/{id}', () => {
  beforeEach(() => fake.seedList({ id: L(1), name: 'Old', revision: 4 }));

  it('renames without If-Match through apply_list_writes', async () => {
    const { status, body } = await read(
      await me('/lists/' + L(1), { method: 'PATCH', body: { name: 'New' } })
    );
    assert.equal(status, 200);
    assert.equal(body.name, 'New');
    assert.deepEqual(calls('rpc/apply_list_writes')[0].body.p_ops, [
      { op: 'update', id: L(1), patch: { name: 'New' } }
    ]);
  });

  it('says the change is saved when the list is too large to answer after the write', async () => {
    fake.state.fail = (name, body, method) =>
      name === 'lists' && method === 'GET'
        ? new Response('x'.repeat(65537), { headers: { 'Content-Type': 'application/json' } })
        : undefined;
    const { status, body } = await read(
      await me('/lists/' + L(1), { method: 'PATCH', body: { name: 'New' } })
    );
    assert.equal(status, 422);
    assert.equal(body.error.code, 'answer_too_large');
    assert.match(body.error.message, /^The change is saved/);
    assert.equal(listOf(L(1)).name, 'New');
  });

  it('sets the money mode with a current If-Match, and a resend reads back as done', async () => {
    const ok = await read(
      await me('/lists/' + L(1), { method: 'PATCH', body: { money_mode: 'coin' }, rev: 4 })
    );
    assert.equal(ok.status, 200);
    assert.equal(ok.body.money_mode, 'coin');
    assert.equal(ok.body.rev, '5');
    assert.equal(calls('lists').filter((c) => c.method === 'PATCH').length, 1);
    const resent = await read(
      await me('/lists/' + L(1), { method: 'PATCH', body: { money_mode: 'coin' }, rev: 4 })
    );
    assert.equal(resent.status, 200);
  });

  it('answers 412 with the current ETag to a stale If-Match on the notes', async () => {
    const res = await me('/lists/' + L(1), {
      method: 'PATCH',
      body: { player_note: 'a', gm_note: 'b' },
      rev: 3
    });
    assert.equal(res.status, 412);
    assert.equal(res.headers.get('etag'), '"4"');
    const body = await fixture('me-error-precondition-failed', res);
    assert.equal(body.error.rev, '4');
    assert.equal(listOf(L(1)).player_note, '');
    const fresh = await read(
      await me('/lists/' + L(1), { method: 'PATCH', body: { player_note: 'a', gm_note: 'b' } })
    );
    assert.deepEqual([fresh.body.player_note, fresh.body.gm_note], ['a', 'b']);
  });
});

describe('DELETE /me/lists/{id}', () => {
  it('answers 428 without If-Match, 204, 204 when gone and 412 when moved', async () => {
    fake.seedList({ id: L(1), name: 'A', revision: 2 });
    fake.seedList({ id: L(2), name: 'B', revision: 7 });
    const res = await me('/lists/' + L(1), { method: 'DELETE' });
    assert.equal(res.status, 428);
    await fixture('me-error-precondition-required', res);
    assert.equal((await me('/lists/' + L(1), { method: 'DELETE', rev: 2 })).status, 204);
    assert.equal(listOf(L(1)), undefined);
    assert.equal((await me('/lists/' + L(1), { method: 'DELETE', rev: 2 })).status, 204);
    const moved = await me('/lists/' + L(2), { method: 'DELETE', rev: 6 });
    assert.equal(moved.status, 412);
    assert.ok(listOf(L(2)));
  });
});

describe('POST /me/lists/delete', () => {
  it('asks for confirm, refuses 11 ids and answers a result per id', async () => {
    fake.seedList({ id: L(1), name: 'A' });
    fake.seedList({ id: L(2), name: 'B' });
    const missing = await me('/lists/delete', { method: 'POST', body: { ids: [L(1), L(2)] } });
    assert.equal(missing.status, 409);
    const body = await fixture('me-error-confirm-required', missing);
    assert.equal(body.error.confirm, 2);
    const wrong = await me('/lists/delete', {
      method: 'POST',
      body: { ids: [L(1), L(2)], confirm: 3 }
    });
    assert.equal(wrong.status, 409);
    assert.equal(fake.state.db.lists.length, 2);
    const eleven = Array.from({ length: 11 }, (_, i) => L(i + 1));
    const over = await me('/lists/delete', {
      method: 'POST',
      body: { ids: eleven, confirm: 11 }
    });
    assert.equal(over.status, 400);
    const done = await me('/lists/delete', {
      method: 'POST',
      body: { ids: [L(1), L(3)], confirm: 2 }
    });
    const results = await fixture('me-results', done);
    assert.deepEqual(results.results, [
      { id: L(1), result: 'ok' },
      { id: L(3), result: 'ok' }
    ]);
    assert.deepEqual(
      fake.state.db.lists.map((l) => l.id),
      [L(2)]
    );
    const one = await me('/lists/delete', { method: 'POST', body: { ids: [L(2)] } });
    assert.equal(one.status, 200);
  });
});

describe('POST /me/lists/{id}/entries', () => {
  it('adds 100 entries, refuses 101, and a retry adds nothing twice', async () => {
    fake.seedList({ id: L(1), name: 'Big' });
    assert.ok(CATALOG_IDS.length >= 101);
    const entries = CATALOG_IDS.slice(0, 101).map((rid, i) => ({
      id: E(i + 1),
      record_id: rid
    }));
    const over = await me(`/lists/${L(1)}/entries`, { method: 'POST', body: { entries } });
    assert.equal(over.status, 400);
    const hundred = entries.slice(0, 100);
    const first = await read(
      await me(`/lists/${L(1)}/entries`, { method: 'POST', body: { entries: hundred } })
    );
    assert.equal(first.status, 200);
    assert.equal(first.body.entries.length, 100);
    assert.ok(first.body.results.every((r) => r.result === 'ok'));
    const again = await read(
      await me(`/lists/${L(1)}/entries`, { method: 'POST', body: { entries: hundred } })
    );
    assert.equal(again.body.entries.length, 100);
    assert.equal(calls('rpc/apply_list_writes').length, 1);
  });

  it("links a homebrew record_id's item and skips a record the list holds", async () => {
    seedItem();
    fake.seedList({ id: L(1), name: 'Mixed' }, [{ id: E(1), item_key: 'ci1' }]);
    const { body } = await read(
      await me(`/lists/${L(1)}/entries`, {
        method: 'POST',
        body: {
          entries: [
            { id: E(2), record_id: HID },
            { id: E(3), record_id: 'ci1' }
          ]
        }
      })
    );
    assert.deepEqual(body.results, [
      { id: E(2), record_id: HID, result: 'ok' },
      { id: E(1), record_id: 'ci1', result: 'skipped' }
    ]);
    const linked = body.entries.find((e) => e.id === E(2));
    assert.deepEqual([linked.origin, linked.key, linked.record_id], ['homebrew', HB, HID]);
  });

  it('answers limit when the list is full', async () => {
    fake.seedList({ id: L(1), name: 'Full' }, [{ id: E(1), item_key: 'ci1' }]);
    fake.state.db.limits.entries_per_list = 1;
    const { body } = await read(
      await me(`/lists/${L(1)}/entries`, {
        method: 'POST',
        body: { entries: [{ id: E(2), record_id: 'ci2' }] }
      })
    );
    assert.equal(body.results[0].result, 'limit');
  });
});

describe('PATCH /me/lists/{id}/entries/{entry}', () => {
  beforeEach(() => fake.seedList({ id: L(1), name: 'A' }, [{ id: E(1), item_key: 'ci1' }]));
  const patch = (entry, body) =>
    me(`/lists/${L(1)}/entries/${entry}`, { method: 'PATCH', body }).then(read);

  it('sets the quantity and the price', async () => {
    const { body } = await patch(E(1), { quantity: 4, price_coins: 250 });
    assert.deepEqual([body.entries[0].quantity, body.entries[0].price_coins], [4, 250]);
    const cleared = await patch(E(1), { price_coins: null });
    assert.equal(cleared.body.entries[0].price_coins, null);
  });

  it('sets both notes', async () => {
    const { body } = await patch(E(1), { player_note: 'p', gm_note: 'g' });
    assert.deepEqual([body.entries[0].player_note, body.entries[0].gm_note], ['p', 'g']);
  });

  it('hides the entry from the players and shows it again', async () => {
    assert.equal((await patch(E(1), { gm_only: true })).body.entries[0].gm_only, true);
    assert.equal((await patch(E(1), { gm_only: false })).body.entries[0].gm_only, false);
  });

  it('answers 404 to a gone entry and 400 to an empty or bad change', async () => {
    assert.equal((await patch(E(9), { quantity: 2 })).status, 404);
    assert.equal((await patch(E(1), {})).status, 400);
    assert.equal((await patch(E(1), { quantity: 100 })).status, 400);
  });
});

describe('DELETE /me/lists/{id}/entries/{entry}', () => {
  it('removes the entry and closes the gap; a gone entry is 204', async () => {
    fake.seedList({ id: L(1), name: 'A' }, [
      { id: E(1), item_key: 'ci1' },
      { id: E(2), item_key: 'ci2' },
      { id: E(3), item_key: 'ci3' }
    ]);
    assert.equal(
      (await me(`/lists/${L(1)}/entries/${E(2)}`, { method: 'DELETE' })).status,
      204
    );
    assert.deepEqual(
      entriesOf(L(1)).map((e) => [e.id, e.position]),
      [
        [E(1), 0],
        [E(3), 1]
      ]
    );
    assert.equal(
      (await me(`/lists/${L(1)}/entries/${E(2)}`, { method: 'DELETE' })).status,
      204
    );
  });
});

describe('PUT /me/lists/{id}/order', () => {
  it('sets the order, and another set of ids is 409 with the current order', async () => {
    fake.seedList({ id: L(1), name: 'A' }, [
      { id: E(1), item_key: 'ci1' },
      { id: E(2), item_key: 'ci2' }
    ]);
    const { body } = await read(
      await me(`/lists/${L(1)}/order`, { method: 'PUT', body: { ids: [E(2), E(1)] } })
    );
    assert.deepEqual(
      body.entries.map((e) => e.id),
      [E(2), E(1)]
    );
    const res = await me(`/lists/${L(1)}/order`, { method: 'PUT', body: { ids: [E(1)] } });
    assert.equal(res.status, 409);
    const err = await fixture('me-error-conflict-order', res);
    assert.deepEqual(err.error.order, [E(2), E(1)]);
  });
});

describe('PATCH /me/lists/{id}/entries: prices', () => {
  const app = (rid) => guessPrice(INDEX.byId.get(rid), INDEX.rarityOf);
  beforeEach(() => {
    seedItem();
    fake.state.db.items.push({
      id: id('bbbbbbbb', 2),
      owner_id: OTHER,
      key: 'hb_bbbbbbbbbbbbbbbb',
      record: {}
    });
    fake.seedList({ id: L(1), name: 'Shop', revision: 9 }, [
      { id: E(1), item_key: 'ci1', price_coins: 100 },
      { id: E(2), item_key: 'cc1' },
      { id: E(3), item_key: 'q1', price_coins: 33 },
      { id: E(4), item_key: HB, source: 'homebrew', hb_item: HID },
      {
        id: E(5),
        item_key: 'hb_bbbbbbbbbbbbbbbb',
        source: 'homebrew',
        hb_item: id('bbbbbbbb', 2)
      }
    ]);
  });
  const bulk = (body, rev) =>
    me(`/lists/${L(1)}/entries`, { method: 'PATCH', body, rev }).then(read);
  const prices = () => entriesOf(L(1)).map((e) => e.price_coins);
  const IDS = [E(1), E(2), E(3), E(4), E(5)];

  it("guess sets the app's guessed price; an entry with no guess is skipped", async () => {
    const { body } = await bulk({ ids: IDS, price: { guess: true } });
    assert.deepEqual(prices(), [
      app('ci1'),
      app('cc1'),
      app('q1'),
      guessPrice(RECORD, () => undefined),
      null
    ]);
    assert.deepEqual(
      body.results.map((r) => r.result),
      ['ok', 'ok', 'ok', 'ok', 'skipped']
    );
  });

  it('set gives every entry the price', async () => {
    await bulk({ ids: IDS, price: { set: 77 } });
    assert.deepEqual(prices(), [77, 77, 77, 77, 77]);
  });

  it('clear drops the prices; an unpriced entry is skipped', async () => {
    const { body } = await bulk({ ids: [E(1), E(2)], price: { clear: true } });
    assert.deepEqual(prices().slice(0, 2), [null, null]);
    assert.deepEqual(
      body.results.map((r) => r.result),
      ['ok', 'skipped']
    );
  });

  it("raise_percent and discount_percent shift as the app's reprice; unpriced is skipped", async () => {
    const up = await bulk({ ids: [E(1), E(2), E(3)], price: { raise_percent: 15 } }, 9);
    assert.deepEqual(prices().slice(0, 3), [reprice(100, 15), null, reprice(33, 15)]);
    assert.deepEqual(
      up.body.results.map((r) => r.result),
      ['ok', 'skipped', 'ok']
    );
    const down = await bulk({ ids: [E(1)], price: { discount_percent: 90 } }, up.body.rev);
    assert.equal(down.status, 200);
    assert.equal(prices()[0], reprice(reprice(100, 15), -90));
  });

  it('a shift without If-Match is 428 and with a stale one 412; nothing is written', async () => {
    assert.equal((await bulk({ ids: [E(1)], price: { raise_percent: 10 } })).status, 428);
    const stale = await bulk({ ids: [E(1)], price: { discount_percent: 10 } }, 8);
    assert.equal(stale.status, 412);
    assert.equal(stale.headers.get('etag'), '"9"');
    assert.deepEqual(prices()[0], 100);
    assert.equal(calls('rpc/apply_list_writes').length, 0);
  });

  it('a shift sent again with the same If-Match after a success is 412 and applies once', async () => {
    const first = await bulk({ ids: [E(1)], price: { raise_percent: 10 } }, 9);
    assert.equal(first.status, 200);
    const again = await bulk({ ids: [E(1)], price: { raise_percent: 10 } }, 9);
    assert.equal(again.status, 412);
    assert.equal(again.body.error.rev, first.body.rev);
    assert.equal(prices()[0], reprice(100, 10));
    assert.equal(calls('rpc/apply_list_writes').length, 1);
  });

  it('refuses a price with two keys, a bad percent and no field', async () => {
    for (const body of [
      { ids: [E(1)], price: { set: 1, clear: true } },
      { ids: [E(1)], price: { raise_percent: 501 } },
      { ids: [E(1)], price: { discount_percent: 91 } },
      { ids: [E(1)] },
      { ids: [] }
    ]) {
      assert.equal((await bulk(body, 9)).status, 400, JSON.stringify(body));
    }
  });
});

describe('PATCH /me/lists/{id}/entries: gm_only', () => {
  it('answers a result per id', async () => {
    fake.seedList({ id: L(1), name: 'A' }, [
      { id: E(1), item_key: 'ci1' },
      { id: E(2), item_key: 'ci2' }
    ]);
    const { body } = await read(
      await me(`/lists/${L(1)}/entries`, {
        method: 'PATCH',
        body: { ids: [E(1), E(2), E(9)], gm_only: true }
      })
    );
    assert.deepEqual(
      body.results.map((r) => [r.id, r.result]),
      [
        [E(1), 'ok'],
        [E(2), 'ok'],
        [E(9), 'gone']
      ]
    );
    assert.ok(entriesOf(L(1)).every((e) => e.gm_only));
  });
});

describe('POST /me/lists/{id}/entries/delete', () => {
  beforeEach(() =>
    fake.seedList({ id: L(1), name: 'A', revision: 3 }, [
      { id: E(1), item_key: 'ci1', quantity: 5 },
      { id: E(2), item_key: 'ci2', quantity: 2 },
      { id: E(3), item_key: 'ci3' }
    ])
  );
  const del = (body, rev) =>
    me(`/lists/${L(1)}/entries/delete`, { method: 'POST', body, rev }).then(read);

  it('takes a part of a row and removes a whole one, with confirm equal to the entries', async () => {
    const body = { entries: [{ id: E(1), quantity: 2 }, { id: E(2) }] };
    const missing = await del(body, 3);
    assert.equal(missing.status, 409);
    assert.equal(missing.body.error.confirm, 2);
    const done = await del({ ...body, confirm: 2 }, 3);
    assert.equal(done.status, 200);
    assert.deepEqual(
      entriesOf(L(1)).map((e) => [e.id, e.quantity]),
      [
        [E(1), 3],
        [E(3), 1]
      ]
    );
    assert.deepEqual(
      done.body.results.map((r) => r.result),
      ['ok', 'ok']
    );
  });

  it('a part quantity without If-Match is 428 and with a stale one 412; nothing is written', async () => {
    const body = { entries: [{ id: E(1), quantity: 1 }] };
    assert.equal((await del(body)).status, 428);
    assert.equal((await del(body, 2)).status, 412);
    assert.equal(entriesOf(L(1))[0].quantity, 5);
    assert.equal(calls('rpc/apply_list_writes').length, 0);
    const whole = await del({ entries: [{ id: E(3) }, { id: E(9) }], confirm: 2 });
    assert.equal(whole.status, 200);
    assert.deepEqual(
      whole.body.results.map((r) => r.result),
      ['ok', 'ok']
    );
  });

  it('a part quantity sent again with the same If-Match after a success is 412 and applies once', async () => {
    const body = { entries: [{ id: E(1), quantity: 2 }] };
    assert.equal((await del(body, 3)).status, 200);
    const again = await del(body, 3);
    assert.equal(again.status, 412);
    assert.equal(entriesOf(L(1))[0].quantity, 3);
    assert.equal(calls('rpc/apply_list_writes').length, 1);
  });

  it('MCP remove_from_list with a part quantity lowers the row', async () => {
    const res = await worker.fetch(
      new Request(HOST + '/mcp/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'MCP-Protocol-Version': '2025-06-18',
          Authorization: 'Bearer ' + TOKEN
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'remove_from_list',
            arguments: { list_id: L(1), entries: [{ id: E(2), quantity: 1 }], rev: '3' }
          }
        })
      }),
      ENV
    );
    const body = await res.json();
    assert.equal(body.result.isError, undefined, JSON.stringify(body));
    assert.equal(entriesOf(L(1))[1].quantity, 1);
  });
});

describe('GET /me/lists/file', () => {
  const knows = (rid) => INDEX.byId.has(rid);

  it("answers the app's file for one and ten ids that parseBundle reads back", async () => {
    seedItem();
    fake.seedList({ id: L(1), name: 'Shop', player_note: 'n' }, [
      { id: E(1), item_key: 'ci1', quantity: 2, price_coins: 10 },
      { id: E(2), item_key: HB, source: 'homebrew', hb_item: HID, gm_only: true }
    ]);
    /* The file's exported_at is the clock's: a fixed one pins the fixture. */
    const realNow = Date.now;
    Date.now = () => Date.UTC(2026, 10, 14, 12);
    let res;
    try {
      res = await me('/lists/file?ids=' + L(1), { token: mint({ exp: 4102444800 }) });
    } finally {
      Date.now = realNow;
    }
    const one = await fixture('me-lists-file', res);
    assert.equal(one.file.exported_at, '2026-11-14T12:00:00.000Z');
    assert.equal(one.file.format, 'daggerheart-loot/lists');
    assert.equal(one.file.version, 3);
    const parsed = parseBundle(JSON.stringify(one.file, null, 2) + '\n', knows);
    assert.equal(parsed.ok, true, JSON.stringify(parsed));
    assert.equal(parsed.lists[0].entries.length, 2);
    for (let n = 2; n <= 10; n++)
      fake.seedList({ id: L(n), name: 'L' + n }, [{ id: E(n * 10), item_key: 'ci2' }]);
    const ten = Array.from({ length: 10 }, (_, i) => L(i + 1)).join(',');
    const first = (await read(await me('/lists/file?ids=' + ten))).body;
    assert.equal(first.file.lists.length, 7);
    const rest = (await read(await me(`/lists/file?ids=${ten}&cursor=${first.next}`))).body;
    assert.equal(rest.file.lists.length, 3);
    assert.equal(rest.next, null);
    assert.equal(parseBundle(JSON.stringify(rest.file), knows).ok, true);
    const eleven = ten + ',' + L(11);
    assert.equal((await me('/lists/file?ids=' + eleven)).status, 400);
  });

  it('pages at 32768 bytes; a list past it is 422 with the app link', async () => {
    const note = 'x'.repeat(4000);
    for (let n = 1; n <= 6; n++) {
      fake.seedList({ id: L(n), name: 'L' + n, player_note: note, gm_note: note }, [
        { id: E(n), item_key: 'ci1', player_note: note }
      ]);
    }
    const first = (await read(await me('/lists/file'))).body;
    const size = new TextEncoder().encode(JSON.stringify(first.file, null, 2) + '\n').length;
    assert.ok(size <= 32768, String(size));
    assert.ok(first.file.lists.length >= 1 && first.file.lists.length < 6);
    assert.equal(typeof first.next, 'string');
    let seen = first.file.lists.length;
    let next = first.next;
    while (next) {
      const page = (await read(await me('/lists/file?cursor=' + next))).body;
      seen += page.file.lists.length;
      next = page.next;
    }
    assert.equal(seen, 6);
    fake.seedList(
      { id: L(9), name: 'Huge' },
      Array.from({ length: 9 }, (_, i) => ({
        id: E(100 + i),
        item_key: CATALOG_IDS[i],
        player_note: note
      }))
    );
    const big = await read(await me('/lists/file?ids=' + L(9)));
    assert.equal(big.status, 422);
    assert.ok(big.body.error.message.endsWith(SITE + 'lists/' + L(9)));
  });

  it('counts an entry with no record in skipped', async () => {
    fake.state.db.items.push({ id: HID, owner_id: OTHER, key: HB, record: {} });
    fake.seedList({ id: L(1), name: 'A' }, [
      { id: E(1), item_key: 'ci1' },
      { id: E(2), item_key: HB, source: 'homebrew', hb_item: HID }
    ]);
    const { body } = await read(await me('/lists/file?ids=' + L(1)));
    assert.deepEqual(body.skipped, [{ list_id: L(1), count: 1 }]);
    assert.equal(body.file.lists[0].entries.length, 1);
  });
});

describe('POST /me/imports (lists)', () => {
  const FILE = JSON.stringify({
    format: 'daggerheart-loot/lists',
    version: 2,
    lists: [
      {
        name: 'Imported',
        entries: [{ id: 'ci1', quantity: 2 }, { id: 'nope' }, { id: 'cc1' }]
      },
      {
        name: 'With homebrew',
        entries: [{ id: HB, source: 'homebrew', snapshot: RECORD }]
      }
    ]
  });
  const post = (body) => me('/imports', { method: 'POST', body }).then(read);

  it('a dry run reports and writes nothing', async () => {
    const res = await me('/imports', {
      method: 'POST',
      body: { file: FILE, import_id: IMPORT_ID, dry_run: true }
    });
    const body = await fixture('me-import-dry-run', res);
    assert.equal(body.check.ok, true);
    assert.deepEqual(body.would_create, { lists: 2, entries: 3, copies: 1 });
    assert.equal(writes().length, 0);
  });

  it('applies, and a second apply with the same import_id adds nothing', async () => {
    const res = await me('/imports', {
      method: 'POST',
      body: { file: FILE, import_id: IMPORT_ID }
    });
    const body = await fixture('me-import', res);
    assert.equal(body.import_id, IMPORT_ID);
    assert.deepEqual(body.created, { lists: 2 });
    assert.equal(fake.state.db.lists.length, 2);
    const copy = fake.state.db.items.find((i) => i.owner_id === GM);
    assert.equal(copy.key, derivedKey(GM, HB));
    const again = await post({ file: FILE, import_id: IMPORT_ID });
    assert.deepEqual(again.body.created, { lists: 0 });
    assert.equal(fake.state.db.lists.length, 2);
    assert.equal(fake.state.db.entries.length, 3);
    assert.equal(fake.state.db.items.length, 1);
  });

  it('a held list id adds only its missing entries', async () => {
    await post({ file: FILE, import_id: IMPORT_ID });
    const [first] = fake.state.db.lists;
    const dropped = fake.state.db.entries.find(
      (e) => e.list_id === first.id && e.item_key === 'cc1'
    );
    fake.state.db.entries = fake.state.db.entries.filter((e) => e !== dropped);
    await post({ file: FILE, import_id: IMPORT_ID });
    assert.deepEqual(
      entriesOf(first.id).map((e) => e.item_key),
      ['ci1', 'cc1']
    );
    assert.equal(fake.state.db.entries.length, 3);
  });

  it('a failed import_lists after the copies, then a retry, links the one copy', async () => {
    let failing = true;
    fake.state.fail = (name) =>
      name === 'import_lists' && failing
        ? new Response(JSON.stringify({ code: 'XX000', message: 'down' }), { status: 500 })
        : undefined;
    const failed = await post({ file: FILE, import_id: IMPORT_ID });
    assert.equal(failed.status, 503);
    assert.equal(fake.state.db.items.length, 1);
    failing = false;
    const retry = await post({ file: FILE, import_id: IMPORT_ID });
    assert.equal(retry.status, 200);
    assert.equal(fake.state.db.items.length, 1);
    const linked = fake.state.db.entries.find((e) => e.source === 'homebrew');
    assert.equal(linked.hb_item, fake.state.db.items[0].id);
  });

  it('a retry after the copies links each variant of one key to its own copy', async () => {
    const variants = JSON.stringify({
      format: 'daggerheart-loot/lists',
      version: 2,
      lists: [
        { name: 'One', entries: [{ id: HB, source: 'homebrew', snapshot: RECORD }] },
        {
          name: 'Two',
          entries: [{ id: HB, source: 'homebrew', snapshot: { ...RECORD, en: 'Lamp' } }]
        }
      ]
    });
    let failing = true;
    fake.state.fail = (name) =>
      name === 'import_lists' && failing
        ? new Response(JSON.stringify({ code: 'XX000', message: 'down' }), { status: 500 })
        : undefined;
    assert.equal((await post({ file: variants, import_id: IMPORT_ID })).status, 503);
    assert.equal(fake.state.db.items.length, 2);
    failing = false;
    assert.equal((await post({ file: variants, import_id: IMPORT_ID })).status, 200);
    const links = fake.state.db.entries.map((e) => e.hb_item).sort();
    assert.deepEqual(links, fake.state.db.items.map((i) => i.id).sort());
    assert.equal(fake.state.db.items.length, 2);
  });

  it('refuses a file past 32768 bytes, a ZIP, a homebrew file that fails its check and a bad file', async () => {
    const big = JSON.stringify({
      format: 'daggerheart-loot/lists',
      version: 1,
      lists: [{ name: 'x'.repeat(32800), entries: [] }]
    });
    assert.equal((await post({ file: big })).status, 413);
    const exact = 'x'.repeat(32769);
    assert.equal((await post({ file: exact })).status, 413);
    assert.equal((await post({ file: 'PK\u0003\u0004rest' })).status, 400);
    assert.equal(
      (await post({ file: '{"format":"daggerheart-loot/homebrew","version":2}' })).status,
      400
    );
    const broken = JSON.stringify({
      format: 'daggerheart-loot/lists',
      version: 1,
      lists: [{ entries: [] }]
    });
    assert.equal((await post({ file: broken })).status, 400);
    const dry = await post({ file: broken, dry_run: true });
    assert.equal(dry.status, 200);
    assert.equal(dry.body.check.ok, false);
    assert.equal(writes().length, 0);
  });
});

describe('share links', () => {
  beforeEach(() =>
    fake.seedList({ id: L(1), name: 'Shop', player_note: 'Come in' }, [
      { id: E(1), item_key: 'ci1' },
      { id: E(2), item_key: 'ci2', gm_only: true }
    ])
  );
  const shares = (body) =>
    me(`/lists/${L(1)}/shares`, body ? { method: 'POST', body } : {}).then(read);
  const linkOf = (token, n) =>
    appUrl({ base: SITE }, shareHash(token), 'ru', cardVersion(['Shop', 'Come in', n]));

  it('reads the links, stopped ones too, as the share panel copies them', async () => {
    const player = (await shares({ audience: 'player' })).body;
    const gm = (await shares({ audience: 'gm' })).body;
    assert.equal((await me('/share-links/' + player.id, { method: 'DELETE' })).status, 204);
    const res = await me(`/lists/${L(1)}/shares`);
    const body = await fixture('me-share-links', res);
    const tokenOf = (sid) => fake.state.db.shares.find((s) => s.id === sid).token;
    assert.deepEqual(
      body.shares.map((s) => [s.id, s.audience, s.revoked_at !== null, s.link]),
      [
        [player.id, 'player', true, linkOf(tokenOf(player.id), 1)],
        [gm.id, 'gm', false, linkOf(tokenOf(gm.id), 2)]
      ]
    );
  });

  it('answers the active link, and a new one after a revoke', async () => {
    const made = await shares({ audience: 'player' });
    assert.equal(made.status, 201);
    pinned(join(API_FIXTURES, 'me-share-link.json'), JSON.stringify(made.body) + '\n');
    const same = await shares({ audience: 'player' });
    assert.equal(same.status, 200);
    assert.equal(same.body.id, made.body.id);
    await me('/share-links/' + made.body.id, { method: 'DELETE' });
    const fresh = await shares({ audience: 'player' });
    assert.equal(fresh.status, 201);
    assert.notEqual(fresh.body.id, made.body.id);
    assert.equal((await shares({ audience: 'everyone' })).status, 400);
  });

  it("stops a link; again is 204, another account's link is 404", async () => {
    const made = (await shares({ audience: 'gm' })).body;
    assert.equal((await me('/share-links/' + made.id, { method: 'DELETE' })).status, 204);
    assert.equal((await me('/share-links/' + made.id, { method: 'DELETE' })).status, 204);
    const theirs = mint({ sub: OTHER });
    assert.equal(
      (await me('/share-links/' + made.id, { method: 'DELETE', token: theirs })).status,
      404
    );
  });

  it('replaces a link; a retry with the same replaces makes no second new one', async () => {
    const old = (await shares({ audience: 'player' })).body;
    const replaced = await shares({ audience: 'player', replaces: old.id });
    assert.equal(replaced.status, 201);
    assert.notEqual(replaced.body.id, old.id);
    assert.ok(fake.state.db.shares.find((s) => s.id === old.id).revoked_at);
    const retry = await shares({ audience: 'player', replaces: old.id });
    assert.equal(retry.status, 200);
    assert.equal(retry.body.id, replaced.body.id);
    assert.equal(fake.state.db.shares.length, 2);
    assert.equal((await shares({ audience: 'player', replaces: L(9) })).status, 404);
  });

  it('refuses replaces of a link of the other audience and stops nothing', async () => {
    const player = (await shares({ audience: 'player' })).body;
    const res = await shares({ audience: 'gm', replaces: player.id });
    assert.equal(res.status, 400);
    assert.equal(fake.state.db.shares.find((s) => s.id === player.id).revoked_at, null);
    assert.equal(calls('rpc/revoke_list_share').length, 0);
  });
});

describe('POST /me/lists/copies', () => {
  it('copies a shared list (201); the same id again is 200 and copies nothing twice', async () => {
    fake.seedList(
      { id: L(1), name: 'Theirs' },
      [
        { id: E(1), item_key: 'ci1' },
        { id: E(2), item_key: 'ci2', gm_only: true }
      ],
      OTHER
    );
    const share = (
      await read(
        await me(`/lists/${L(1)}/shares`, {
          method: 'POST',
          body: { audience: 'player' },
          token: mint({ sub: OTHER })
        })
      )
    ).body;
    const token = fake.state.db.shares.find((s) => s.id === share.id).token;
    const made = await read(
      await me('/lists/copies', { method: 'POST', body: { token, id: L(2) } })
    );
    assert.equal(made.status, 201);
    assert.deepEqual(
      made.body.entries.map((e) => e.key),
      ['ci1']
    );
    const again = await read(
      await me('/lists/copies', { method: 'POST', body: { token, id: L(2) } })
    );
    assert.equal(again.status, 200);
    assert.equal(calls('rpc/clone_shared_list').length, 1);
    const unknown = await me('/lists/copies', {
      method: 'POST',
      body: { token: 'Z'.repeat(43), id: L(3) }
    });
    assert.equal(unknown.status, 404);
    assert.equal(
      (await me('/lists/copies', { method: 'POST', body: { token: 'short' } })).status,
      400
    );
  });
});
