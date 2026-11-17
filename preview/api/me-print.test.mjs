// The account API's print sets (docs/specs/CONTRACTS.md section 6, "Account API") through the
// worker's fetch handler, over the stub Supabase of me-fake.mjs, whose `create_print_set`
// stands in for 20261014120100_print_sets.sql. A list's set is checked against the app's own
// builder (`lib/printSet.ts` `printSetEntries`). The answer is compared byte for byte with
// docs/fixtures/api/v1/me-print-set.json. `npm run check` runs it in the stage test:preview.
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  API_FIXTURES,
  CATALOG,
  ENV,
  HOST,
  OTHER,
  SITE,
  fakeSupabase,
  mint,
  pinned
} from './me-fake.mjs';
import { clearCache } from './rest.mjs';
import { buildIndex } from '../../app/src/lib/data.ts';
import { printSetEntries } from '../../app/src/lib/printSet.ts';

const { default: worker } = await import('../worker.mjs');

const TOKEN = mint();
const INDEX = buildIndex(CATALOG.loot);
const CATALOG_IDS = [...INDEX.byId.keys()].filter((x) => /^[a-z0-9_]{1,32}$/.test(x));
const id = (prefix, n) => `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;
const L = (n) => id('aaaaaaaa', n);
const E = (n) => id('eeeeeeee', n);
const HID = id('bbbbbbbb', 1);

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

const print = (body) =>
  worker.fetch(
    new Request(HOST + '/api/v1/me/print-sets', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }),
    ENV
  );
const read = async (res) => ({ status: res.status, body: await res.json() });
const sent = () =>
  fake.state.calls
    .filter((c) => c.path === 'rpc/create_print_set')
    .map((c) => c.body.p_entries);

describe('POST /me/print-sets', () => {
  it('stores the cards and answers the print page; the same sheet answers the same id', async () => {
    const res = await print({
      cards: [{ id: 'ci1', count: 3 }, { id: HID.toUpperCase() }, { id: 'ci2', count: 1 }]
    });
    const text = await res.text();
    pinned(join(API_FIXTURES, 'me-print-set.json'), text);
    const body = JSON.parse(text);
    assert.equal(res.status, 201);
    assert.equal(body.link, `${SITE}p/${body.id}`);
    assert.equal(body.link_en, `${SITE}en/p/${body.id}`);
    assert.deepEqual(sent()[0], [{ k: 'ci1', q: 3 }, { h: HID }, { k: 'ci2' }]);
    const again = await read(
      await print({ cards: [{ id: 'ci1', count: 3 }, { id: HID }, { id: 'ci2' }] })
    );
    assert.equal(again.body.id, body.id);
    assert.equal(fake.state.db.prints.length, 1);
  });

  it('takes 1 and 180 cards, refuses 181, an unknown catalog id and a card twice', async () => {
    /* The pinned catalog is small: the first card is a record, the rest homebrew items. */
    const cards = (n) =>
      Array.from({ length: n }, (_, i) => ({
        id: i ? id('bbbbbbbb', 100 + i) : CATALOG_IDS[0]
      }));
    assert.equal((await print({ cards: cards(1) })).status, 201);
    const full = await read(await print({ cards: cards(180) }));
    assert.deepEqual([full.status, full.body.cards], [201, 180]);
    assert.equal((await print({ cards: cards(181) })).status, 400);
    const unknown = await read(await print({ cards: [{ id: 'no_such_record' }] }));
    assert.deepEqual([unknown.status, unknown.body.error.code], [400, 'bad_request']);
    assert.equal((await print({ cards: [{ id: 'ci1' }, { id: 'ci1' }] })).status, 400);
    assert.equal((await print({ cards: [{ id: 'ci1', count: 100 }] })).status, 400);
    assert.equal((await print({})).status, 400);
    assert.equal((await print({ cards: cards(1), list_id: L(1) })).status, 400);
    assert.equal(sent().length, 2);
  });

  it("builds a list's set as «Печать» builds it", async () => {
    fake.state.db.items.push({ id: HID, owner_id: OTHER, key: 'hb_abcdefghijklmnop' });
    fake.seedList({ id: L(1), name: 'Shop' }, [
      { id: E(1), item_key: 'ci2', quantity: 4, position: 1 },
      { id: E(2), item_key: 'ci1', quantity: 1, position: 0 },
      {
        id: E(3),
        item_key: 'hb_abcdefghijklmnop',
        source: 'homebrew',
        hb_item: HID,
        quantity: 2,
        position: 2
      },
      { id: E(4), item_key: 'gone_record', quantity: 1, position: 3 }
    ]);
    const r = await read(await print({ list_id: L(1) }));
    assert.equal(r.status, 201);
    assert.deepEqual([r.body.cards, r.body.cut, r.body.skipped], [3, 0, 1]);
    const app = printSetEntries(
      [{ id: 'ci1' }, { id: 'ci2' }, { id: 'hb_abcdefghijklmnop', src: 'homebrew', hid: HID }],
      { ci1: 1, ci2: 4, hb_abcdefghijklmnop: 2 }
    );
    assert.deepEqual(sent()[0], app.entries);
    fake.seedList({ id: L(2) }, [], OTHER);
    assert.equal((await print({ list_id: L(2) })).status, 404);
    fake.seedList({ id: L(3) });
    assert.equal((await print({ list_id: L(3) })).status, 400);
  });

  it('answers 409 limit_reached at the set limit', async () => {
    fake.state.db.limits.print_sets_per_owner = 1;
    assert.equal((await print({ cards: [{ id: 'ci1' }] })).status, 201);
    const r = await read(await print({ cards: [{ id: 'ci2' }] }));
    assert.deepEqual(
      [r.status, r.body.error.code, r.body.error.limit],
      [409, 'limit_reached', 'print_sets_per_owner']
    );
  });

  it('is the MCP tool create_print_set', async () => {
    const res = await worker.fetch(
      new Request(HOST + '/mcp/me', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
          'MCP-Protocol-Version': '2025-06-18'
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
      }),
      ENV
    );
    const tool = (await res.json()).result.tools.find((t) => t.name === 'create_print_set');
    assert.equal(tool.annotations.idempotentHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
    assert.deepEqual(Object.keys(tool.inputSchema.properties), ['cards', 'list_id']);
    const call = await worker.fetch(
      new Request(HOST + '/mcp/me', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + TOKEN,
          'Content-Type': 'application/json',
          'MCP-Protocol-Version': '2025-06-18'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: { name: 'create_print_set', arguments: { cards: [{ id: 'ci1' }] } }
        })
      }),
      ENV
    );
    const result = (await call.json()).result.structuredContent;
    assert.equal(result.format, 'daggerheart-loot/api-print-set');
    assert.ok(!JSON.stringify(result).includes(TOKEN));
  });
});
