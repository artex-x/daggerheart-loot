// The account API's homebrew operations (docs/specs/CONTRACTS.md section 6, "Account API")
// through the worker's fetch handler, over the stub Supabase of me-fake.mjs. Shapes and checks
// are compared with the app's own functions (lib/homebrew.ts, lib/homebrewForm.ts,
// lib/homebrewFile.ts); the answers CONTRACTS.md pins are compared byte for byte with
// docs/fixtures/api/v1/me-homebrew-*.json and docs/fixtures/mcp/me-homebrew-*.json.
// `npm run check` runs it in the stage test:preview.
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import openapi from './openapi.json' with { type: 'json' };
import {
  API_FIXTURES,
  CATALOG,
  ENV,
  GM,
  HOST,
  MCP_FIXTURES,
  OTHER,
  SITE,
  fakeSupabase,
  mint,
  pinned
} from './me-fake.mjs';
import { clearCache } from './rest.mjs';
import { dict } from '../../app/src/lib/dict.ts';
import { copyContentOf, keyFrom } from '../../app/src/lib/homebrew.ts';
import { problemText } from '../../app/src/lib/homebrewForm.ts';
import { parseHomebrew } from '../../app/src/lib/homebrewFile.ts';

const { default: worker } = await import('../worker.mjs');

const TOKEN = mint({ exp: 4102444800 });
const id = (prefix, n) => `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`;
const I = (n) => id('11110000', n);
const B = (n) => id('22220000', n);
const C = (n) => id('33330000', n);
const L = (n) => id('aaaaaaaa', n);
const E = (n) => id('eeeeeeee', n);
const K = (n) => 'hb_' + 'abcdefghijklmnop'.slice(0, 15) + 'qrstuvwxyz'[n];
/* The key an id makes: its last 10 bytes. */
const keyOf = (uuid) =>
  keyFrom(
    Uint8Array.from({ length: 10 }, (_, i) =>
      parseInt(uuid.replace(/-/g, '').slice(12 + i * 2, 14 + i * 2), 16)
    )
  );

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

const AT = '2026-11-14T09:00:00.000Z';
function seedItem(over = {}, user = GM) {
  const row = {
    id: I(1),
    key: K(1),
    book_id: null,
    content: { kind: 'item', en: 'Lantern', ru: 'Фонарь' },
    art: null,
    revision: 1,
    created_at: AT,
    updated_at: AT,
    ...over,
    owner_id: user
  };
  fake.state.db.items.push(row);
  return row;
}
function seedBook(over = {}, user = GM) {
  const row = {
    id: B(1),
    key: K(5),
    content: { en: 'Grimoire', ru: 'Гримуар' },
    revision: 1,
    created_at: AT,
    updated_at: AT,
    ...over,
    owner_id: user
  };
  fake.state.db.books.push(row);
  return row;
}
function seedCard(over = {}, user = GM) {
  const row = {
    id: C(1),
    key: K(7),
    kind: 'set',
    book_id: null,
    content: { en: 'Kit', ende: 'A bonus.' },
    revision: 1,
    created_at: AT,
    updated_at: AT,
    ...over,
    owner_id: user
  };
  fake.state.db.cards.push(row);
  return row;
}

const me = (path, { method = 'GET', body, rev, none, token = TOKEN, headers = {} } = {}) =>
  worker.fetch(
    new Request(HOST + '/api/v1/me' + path, {
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(body === undefined || body instanceof Uint8Array
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...(rev === undefined ? {} : { 'If-Match': rev === '*' ? '*' : `"${String(rev)}"` }),
        ...(none ? { 'If-None-Match': '*' } : {}),
        ...headers
      },
      ...(body === undefined
        ? {}
        : { body: body instanceof Uint8Array ? body : JSON.stringify(body) })
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
const writes = () =>
  fake.state.calls.filter(
    (c) =>
      c.method !== 'GET' &&
      !['rpc/my_limit', 'rpc/get_homebrew_items', 'rpc/get_homebrew_item'].includes(c.path)
  );
const item = (iid) => fake.state.db.items.find((x) => x.id === iid);
const pair = (p) => ({ ru: problemText(p, dict('ru')), en: problemText(p, dict('en')) });

/** A WebP file's first bytes with a VP8L header of `side` x `side`, padded to `size`. */
function webp(side, size = 120) {
  const b = new Uint8Array(size);
  const put = (at, s) => [...s].forEach((c, i) => (b[at + i] = c.charCodeAt(0)));
  const view = new DataView(b.buffer);
  put(0, 'RIFF');
  view.setUint32(4, size - 8, true);
  put(8, 'WEBP');
  put(12, 'VP8L');
  view.setUint32(16, size - 20, true);
  b[20] = 0x2f;
  view.setUint32(21, (side - 1) | ((side - 1) << 14), true);
  return b;
}
const BOUNDARY = 'pictureboundary';
function multipart(parts) {
  const enc = new TextEncoder();
  const chunks = [];
  for (const [name, bytes, type = 'image/webp'] of parts) {
    chunks.push(
      enc.encode(
        `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${name}"; filename="${name}.webp"\r\nContent-Type: ${type}\r\n\r\n`
      ),
      bytes,
      enc.encode('\r\n')
    );
  }
  chunks.push(enc.encode(`--${BOUNDARY}--\r\n`));
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}
const upload = (iid, parts) =>
  me(`/homebrew-items/${iid}/picture`, {
    method: 'PUT',
    body: multipart(parts),
    headers: { 'Content-Type': `multipart/form-data; boundary=${BOUNDARY}` }
  });

describe('GET /me/homebrew-items', () => {
  it('answers the heads with their links, paged', async () => {
    seedItem();
    seedItem({ id: I(2), key: K(2) });
    seedItem({ id: I(3), key: K(3) });
    const body = await fixture('me-homebrew-items', await me('/homebrew-items?limit=2'));
    assert.deepEqual(
      body.items.map((h) => [h.id, h.key, h.rev, h.link]),
      [
        [I(1), K(1), '1', SITE + 'h/' + I(1)],
        [I(2), K(2), '1', SITE + 'h/' + I(2)]
      ]
    );
    assert.deepEqual(body.limits, { items: 100 });
    const two = (await read(await me('/homebrew-items?limit=2&cursor=' + body.next))).body;
    assert.deepEqual(
      two.items.map((h) => h.id),
      [I(3)]
    );
    assert.equal(two.next, null);
  });

  it('adds the records of up to 10 own ids, and refuses 11 or a foreign id', async () => {
    for (let n = 1; n <= 11; n++)
      seedItem({ id: I(n), key: `hb_${'a'.repeat(14)}${'bcdefghijklm'[n]}a` });
    seedItem({ id: I(20), key: K(9) }, OTHER);
    const ten = Array.from({ length: 10 }, (_, n) => I(n + 1)).join(',');
    const ok = await read(await me('/homebrew-items?ids=' + ten));
    assert.equal(ok.status, 200);
    assert.equal(ok.body.records.length, 10);
    assert.ok(ok.body.records.every((r) => r.format === 'daggerheart-loot/record'));
    const eleven = await read(await me('/homebrew-items?ids=' + ten + ',' + I(11)));
    assert.equal(eleven.status, 400);
    const foreign = await read(await me('/homebrew-items?ids=' + I(1) + ',' + I(20)));
    assert.equal(foreign.status, 400);
  });
});

describe('GET /me/homebrew-items/{id}', () => {
  it('answers the record the read API answers for the same id', async () => {
    seedItem({ content: { kind: 'item', en: 'Lantern', ru: 'Фонарь', craft: ['ci2'] } });
    const body = await fixture('me-homebrew-item', await me('/homebrew-items/' + I(1)));
    const t0 = await (
      await worker.fetch(new Request(HOST + '/api/v1/homebrew-items/' + I(1)), ENV)
    ).json();
    assert.deepEqual(body.record, t0);
    assert.equal(body.link, t0.link.ru);
    assert.equal(body.rev, '1');
  });
});

describe('PUT /me/homebrew-items/{id}', () => {
  const lamp = { kind: 'item', en: 'Lamp', ru: 'Лампа' };

  it('creates by If-None-Match: 201, an equal row 200, another row 412', async () => {
    const made = await read(
      await me('/homebrew-items/' + I(1), {
        method: 'PUT',
        none: true,
        body: { content: lamp }
      })
    );
    assert.equal(made.status, 201);
    assert.equal(made.body.key, keyOf(I(1)));
    assert.equal(made.headers.get('ETag'), '"1"');
    const again = await me('/homebrew-items/' + I(1), {
      method: 'PUT',
      none: true,
      body: { content: lamp }
    });
    assert.equal(again.status, 200);
    const other = await read(
      await me('/homebrew-items/' + I(1), {
        method: 'PUT',
        none: true,
        body: { content: { ...lamp, en: 'Other' } }
      })
    );
    assert.equal(other.status, 412);
    assert.equal(other.body.error.rev, '1');
    assert.equal(fake.state.db.items.length, 1);
  });

  it('refuses a held key and another account id with 409', async () => {
    seedItem();
    seedItem({ id: I(9), key: K(9) }, OTHER);
    const dup = await read(
      await me('/homebrew-items/' + I(2), {
        method: 'PUT',
        none: true,
        body: { key: K(1), content: lamp }
      })
    );
    assert.equal(dup.status, 409);
    const theirs = await read(
      await me('/homebrew-items/' + I(9), {
        method: 'PUT',
        none: true,
        body: { content: lamp }
      })
    );
    assert.equal(theirs.status, 409);
    assert.equal(item(I(9)).content.en, 'Lantern');
  });

  it('replaces by If-Match: 200, a stale rev 412 with the current ETag, a gone row 404', async () => {
    seedItem();
    const ok = await read(
      await me('/homebrew-items/' + I(1), { method: 'PUT', rev: 1, body: { content: lamp } })
    );
    assert.equal(ok.status, 200);
    assert.equal(ok.body.rev, '2');
    const stale = await read(
      await me('/homebrew-items/' + I(1), {
        method: 'PUT',
        rev: 1,
        body: { content: { ...lamp, en: 'Again' } }
      })
    );
    assert.equal(stale.status, 412);
    assert.equal(stale.headers.get('ETag'), '"2"');
    assert.equal(item(I(1)).content.en, 'Lamp');
    const gone = await me('/homebrew-items/' + I(2), {
      method: 'PUT',
      rev: 1,
      body: { content: lamp }
    });
    assert.equal(gone.status, 404);
  });

  it('writes over any revision with If-Match: *, and answers 428 with neither header', async () => {
    seedItem({ revision: 7 });
    const star = await read(
      await me('/homebrew-items/' + I(1), { method: 'PUT', rev: '*', body: { content: lamp } })
    );
    assert.equal(star.status, 200);
    assert.equal(item(I(1)).content.en, 'Lamp');
    const none = await read(
      await me('/homebrew-items/' + I(1), { method: 'PUT', body: { content: lamp } })
    );
    assert.equal(none.status, 428);
  });

  it('creates under a new id after the row is gone («Сохранить как новый»)', async () => {
    seedItem();
    assert.equal(
      (await me('/homebrew-items/' + I(1), { method: 'DELETE', rev: 1 })).status,
      204
    );
    const made = await me('/homebrew-items/' + I(2), {
      method: 'PUT',
      none: true,
      body: { content: lamp }
    });
    assert.equal(made.status, 201);
    assert.deepEqual(
      fake.state.db.items.map((x) => x.id),
      [I(2)]
    );
  });

  it('writes the editor source and section fields', async () => {
    seedBook({ content: { en: 'Grimoire', sections: [{ key: K(6), en: 'Rings' }] } });
    seedItem();
    const ok = await read(
      await me('/homebrew-items/' + I(1), {
        method: 'PUT',
        rev: 1,
        body: { book: B(1), content: { ...lamp, section: K(6) } }
      })
    );
    assert.equal(ok.status, 200);
    assert.equal(ok.body.book, B(1));
    assert.equal(item(I(1)).content.section, K(6));
    const noSection = await read(
      await me('/homebrew-items/' + I(1), {
        method: 'PUT',
        rev: 2,
        body: { book: B(1), content: { ...lamp, section: K(8) } }
      })
    );
    assert.equal(noSection.status, 422);
  });

  it('checks craft links and the upgrade line as the editor does, with the text pair', async () => {
    const bad = await read(
      await me('/homebrew-items/' + I(1), {
        method: 'PUT',
        none: true,
        body: { content: { ...lamp, craft: ['not an id!'] } }
      })
    );
    assert.equal(bad.status, 422);
    assert.equal(bad.body.error.code, 'invalid_content');
    const p = { path: 'craft.0', rule: 'pattern' };
    assert.deepEqual(bad.body.error.problems, [{ ...p, text: pair(p) }]);
    const self = await read(
      await me('/homebrew-items/' + I(1), {
        method: 'PUT',
        none: true,
        body: { content: { ...lamp, craft_from: [keyOf(I(1))] } }
      })
    );
    assert.equal(self.body.error.problems[0].rule, 'self');
    seedItem({
      id: I(5),
      key: K(5),
      content: { kind: 'equip', en: 'Sword', eq: { t: 'weapon', tier: 1 } }
    });
    const armor = {
      kind: 'equip',
      en: 'Mail',
      eq: { t: 'armor', tier: 1, as: 3, th: [5, 10], line: K(5) }
    };
    const own = await read(
      await me('/homebrew-items/' + I(1), {
        method: 'PUT',
        none: true,
        body: { content: armor }
      })
    );
    assert.equal(own.status, 422);
    assert.equal(own.body.error.problems[0].path, 'eq.line');
    const catalog = await read(
      await me('/homebrew-items/' + I(1), {
        method: 'PUT',
        none: true,
        body: { content: { ...armor, eq: { ...armor.eq, line: 'q1' } } }
      })
    );
    assert.equal(catalog.status, 422);
    const fine = await me('/homebrew-items/' + I(1), {
      method: 'PUT',
      none: true,
      body: { content: { ...lamp, craft: ['ci2'], craft_from: [K(5)] } }
    });
    assert.equal(fine.status, 201);
    assert.equal(writes().filter((c) => c.path === 'homebrew_items').length, 1);
  });
});

describe('DELETE /me/homebrew-items/{id}', () => {
  it('answers 428 without a rev, 204, 204 when gone, 412 when moved', async () => {
    seedItem({ revision: 3 });
    fake.seedList({ id: L(1) }, [
      { id: E(1), item_key: K(1), source: 'homebrew', hb_item: I(1) }
    ]);
    assert.equal((await me('/homebrew-items/' + I(1), { method: 'DELETE' })).status, 428);
    const moved = await read(await me('/homebrew-items/' + I(1), { method: 'DELETE', rev: 2 }));
    assert.equal(moved.status, 412);
    assert.equal(moved.body.error.rev, '3');
    assert.equal(
      (await me('/homebrew-items/' + I(1), { method: 'DELETE', rev: 3 })).status,
      204
    );
    assert.equal(fake.state.db.entries.length, 0);
    assert.equal(
      (await me('/homebrew-items/' + I(1), { method: 'DELETE', rev: 3 })).status,
      204
    );
  });
});

describe('POST /me/homebrew-items/delete', () => {
  it('needs confirm, deletes every item or none, and refuses 101 ids', async () => {
    seedItem();
    seedItem({ id: I(2), key: K(2) });
    const ask = await read(
      await me('/homebrew-items/delete', { method: 'POST', body: { ids: [I(1), I(2)] } })
    );
    assert.equal(ask.status, 409);
    assert.equal(ask.body.error.code, 'confirm_required');
    assert.equal(ask.body.error.confirm, 2);
    fake.state.fail = (name) =>
      name === 'delete_homebrew_items'
        ? new Response(JSON.stringify({ code: '57014', message: 'timeout' }), { status: 500 })
        : undefined;
    const failed = await me('/homebrew-items/delete', {
      method: 'POST',
      body: { ids: [I(1), I(2)], confirm: 2 }
    });
    assert.equal(failed.status, 503);
    assert.equal(fake.state.db.items.length, 2);
    fake.state.fail = () => undefined;
    const done = await read(
      await me('/homebrew-items/delete', {
        method: 'POST',
        body: { ids: [I(1), I(2)], confirm: 2 }
      })
    );
    assert.deepEqual(
      done.body.results.map((r) => r.result),
      ['ok', 'ok']
    );
    assert.equal(fake.state.db.items.length, 0);
    const many = Array.from({ length: 101 }, (_, n) => I(n + 1));
    const big = await me('/homebrew-items/delete', {
      method: 'POST',
      body: { ids: many, confirm: 101 }
    });
    assert.equal(big.status, 400);
  });
});

describe('POST /me/homebrew-items/move', () => {
  it('moves every item or none, and a stale rev is 412', async () => {
    seedBook({ content: { en: 'Grimoire', sections: [{ key: K(6), en: 'Rings' }] } });
    seedItem();
    seedItem({ id: I(2), key: K(2), revision: 4 });
    const stale = await read(
      await me('/homebrew-items/move', {
        method: 'POST',
        body: {
          items: [
            { id: I(1), rev: '1' },
            { id: I(2), rev: '3' }
          ],
          source: B(1),
          section: K(6)
        }
      })
    );
    assert.equal(stale.status, 412);
    assert.equal(item(I(1)).book_id, null);
    const ok = await read(
      await me('/homebrew-items/move', {
        method: 'POST',
        body: {
          items: [
            { id: I(1), rev: '1' },
            { id: I(2), rev: '4' }
          ],
          source: B(1),
          section: K(6)
        }
      })
    );
    assert.equal(ok.status, 200);
    assert.deepEqual(
      ok.body.results.map((r) => [r.id, r.result, r.rev]),
      [
        [I(1), 'ok', '2'],
        [I(2), 'ok', '5']
      ]
    );
    assert.equal(item(I(2)).content.section, K(6));
  });
});

describe('PUT /me/homebrew-items/{id}/picture', () => {
  it('uploads the two WebP files and names them on the item', async () => {
    seedItem();
    const res = await read(
      await upload(I(1), [
        ['full', webp(640)],
        ['thumb', webp(160)]
      ])
    );
    assert.equal(res.status, 200);
    assert.match(res.body.art, /^p\/[0-9a-f]{32}\.webp$/);
    assert.ok(fake.state.storage.has(res.body.art));
    assert.ok(fake.state.storage.has('t/' + res.body.art.slice(2)));
    assert.equal(item(I(1)).art, res.body.art);
    assert.ok(res.body.record.image.full.endsWith(res.body.art));
  });

  it('refuses a file that is not WebP, a wrong size, another media type, a missing part', async () => {
    seedItem();
    const notWebp = new Uint8Array(120).fill(7);
    assert.equal(
      (
        await upload(I(1), [
          ['full', notWebp],
          ['thumb', webp(160)]
        ])
      ).status,
      400
    );
    assert.equal(
      (
        await upload(I(1), [
          ['full', webp(320)],
          ['thumb', webp(160)]
        ])
      ).status,
      400
    );
    assert.equal(
      (
        await upload(I(1), [
          ['full', webp(640), 'image/png'],
          ['thumb', webp(160)]
        ])
      ).status,
      400
    );
    assert.equal((await upload(I(1), [['full', webp(640)]])).status, 400);
    assert.equal(fake.state.storage.size, 0);
  });

  it('answers 413 for a part past 204800 bytes and a body past 413696 bytes before any parse', async () => {
    seedItem();
    const part = await read(
      await upload(I(1), [
        ['full', webp(640, 204801)],
        ['thumb', webp(160)]
      ])
    );
    assert.equal(part.status, 413);
    const huge = await me(`/homebrew-items/${I(1)}/picture`, {
      method: 'PUT',
      body: new Uint8Array(10),
      headers: {
        'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
        'Content-Length': '413697'
      }
    });
    assert.equal(huge.status, 413);
    assert.equal(fake.state.calls.length, 0);
  });

  it('answers 409 limit_reached when the picture room is full', async () => {
    seedItem();
    fake.state.artRoom = false;
    const res = await read(
      await upload(I(1), [
        ['full', webp(640)],
        ['thumb', webp(160)]
      ])
    );
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'limit_reached');
    assert.equal(res.body.error.limit, 'homebrew_art');
    assert.equal(item(I(1)).art, null);
  });

  it('takes the picture of another own item or a catalog record', async () => {
    fake.state.storage.set('p/' + 'a'.repeat(32) + '.webp', { owner: GM, bytes: webp(640) });
    fake.state.storage.set('t/' + 'a'.repeat(32) + '.webp', { owner: GM, bytes: webp(160) });
    seedItem({ art: 'p/' + 'a'.repeat(32) + '.webp' });
    seedItem({ id: I(2), key: K(2) });
    const own = await read(
      await me(`/homebrew-items/${I(2)}/picture`, { method: 'PUT', body: { from: I(1) } })
    );
    assert.equal(own.status, 200);
    assert.equal(item(I(2)).art, item(I(1)).art);
    const cat = await read(
      await me(`/homebrew-items/${I(2)}/picture`, { method: 'PUT', body: { from: 'ci1' } })
    );
    assert.equal(cat.status, 200);
    assert.equal(item(I(2)).art, 'ci1.webp');
  });
});

describe('DELETE /me/homebrew-items/{id}/picture', () => {
  it('names no picture any more', async () => {
    seedItem({ art: 'ci1.webp' });
    const res = await read(await me(`/homebrew-items/${I(1)}/picture`, { method: 'DELETE' }));
    assert.equal(res.status, 200);
    assert.equal(res.body.art, null);
    assert.equal(item(I(1)).art, null);
  });
});

describe('homebrew sources', () => {
  const book = (over = {}) => ({ en: 'Grimoire', ...over });

  it('creates, renames and lists a source', async () => {
    const made = await read(
      await me('/homebrew-sources/' + B(1), {
        method: 'PUT',
        none: true,
        body: { content: book() }
      })
    );
    assert.equal(made.status, 201);
    assert.equal(made.body.key, keyOf(B(1)));
    const renamed = await read(
      await me('/homebrew-sources/' + B(1), {
        method: 'PUT',
        rev: 1,
        body: { content: book({ en: 'Codex' }) }
      })
    );
    assert.equal(renamed.status, 200);
    assert.equal(renamed.body.content.en, 'Codex');
    const list = await fixture('me-homebrew-sources', await me('/homebrew-sources'));
    assert.deepEqual(
      list.sources.map((s) => s.id),
      [B(1)]
    );
    assert.deepEqual(list.limits, { sources: 20 });
  });

  it('adds, renames and deletes a section', async () => {
    seedBook();
    const sec = (en) => ({ key: K(6), en });
    const add = await me('/homebrew-sources/' + B(1), {
      method: 'PUT',
      rev: 1,
      body: { content: book({ sections: [sec('Rings')] }) }
    });
    assert.equal(add.status, 200);
    const rename = await me('/homebrew-sources/' + B(1), {
      method: 'PUT',
      rev: 2,
      body: { content: book({ sections: [sec('Bands')] }) }
    });
    assert.equal(rename.status, 200);
    const drop = await me('/homebrew-sources/' + B(1), {
      method: 'PUT',
      rev: 3,
      body: { content: book() }
    });
    assert.equal(drop.status, 200);
    assert.equal(fake.state.db.books[0].content.sections, undefined);
  });

  it('refuses a held name, a held section name and a section past 30 with 422', async () => {
    seedBook();
    const held = await read(
      await me('/homebrew-sources/' + B(2), {
        method: 'PUT',
        none: true,
        body: { content: { en: 'grimoire' } }
      })
    );
    assert.equal(held.status, 422);
    assert.equal(held.body.error.problems[0].rule, 'duplicate');
    assert.equal(
      held.body.error.problems[0].text.en,
      dict('en').hbSourceTaken.replace('%s', 'grimoire')
    );
    const home = await me('/homebrew-sources/' + B(2), {
      method: 'PUT',
      none: true,
      body: { content: { ru: 'Хоумбрю' } }
    });
    assert.equal(home.status, 422);
    const twin = await me('/homebrew-sources/' + B(1), {
      method: 'PUT',
      rev: 1,
      body: {
        content: book({
          sections: [
            { key: K(6), en: 'Rings' },
            { key: K(8), en: 'rings' }
          ]
        })
      }
    });
    assert.equal(twin.status, 422);
    const sections = Array.from({ length: 31 }, (_, n) => ({
      key: 'hb_' + 'q'.repeat(14) + 'abcdefghijklmnopqrstuvwxyz234567'[n] + 'a',
      en: 'S' + String(n)
    }));
    const full = await read(
      await me('/homebrew-sources/' + B(1), {
        method: 'PUT',
        rev: 1,
        body: { content: book({ sections }) }
      })
    );
    assert.equal(full.status, 422);
    assert.equal(full.body.error.problems[0].rule, 'many');
    assert.equal(writes().length, 0);
  });

  it('deletes a source; its items move to the default source', async () => {
    seedBook({ content: { en: 'Grimoire', sections: [{ key: K(6), en: 'Rings' }] } });
    seedItem({ book_id: B(1), content: { kind: 'item', en: 'Ring', section: K(6) } });
    assert.equal((await me('/homebrew-sources/' + B(1), { method: 'DELETE' })).status, 428);
    assert.equal(
      (await me('/homebrew-sources/' + B(1), { method: 'DELETE', rev: 1 })).status,
      204
    );
    assert.equal(item(I(1)).book_id, null);
    const after = (await read(await me('/homebrew-items/' + I(1)))).body;
    assert.equal(after.book, null);
    assert.equal(after.record.book, undefined);
  });
});

describe('homebrew cards', () => {
  it('creates a set card and a rule card, edits and deletes one', async () => {
    const set = await read(
      await me('/homebrew-cards/' + C(1), {
        method: 'PUT',
        none: true,
        body: { kind: 'set', content: { en: 'Kit', ende: 'Bonus.' } }
      })
    );
    assert.equal(set.status, 201);
    const ref = await read(
      await me('/homebrew-cards/' + C(2), {
        method: 'PUT',
        none: true,
        body: {
          kind: 'ref',
          content: { en: 'Rule', ende: 'Text.', url: 'https://example.org/r' }
        }
      })
    );
    assert.equal(ref.status, 201);
    assert.equal(ref.body.kind, 'ref');
    const edit = await read(
      await me('/homebrew-cards/' + C(1), {
        method: 'PUT',
        rev: 1,
        body: { content: { en: 'Kit 2', ende: 'Bonus.' } }
      })
    );
    assert.equal(edit.status, 200);
    const list = await fixture('me-homebrew-cards', await me('/homebrew-cards'));
    assert.deepEqual(
      list.cards.map((c) => [c.id, c.kind]),
      [
        [C(1), 'set'],
        [C(2), 'ref']
      ]
    );
    assert.equal(
      (await me('/homebrew-cards/' + C(2), { method: 'DELETE', rev: 1 })).status,
      204
    );
    assert.equal(fake.state.db.cards.length, 1);
  });

  it('refuses a kind change, a card without text, past 100 items and past 3 rule cards', async () => {
    seedCard();
    const kind = await me('/homebrew-cards/' + C(1), {
      method: 'PUT',
      rev: 1,
      body: { kind: 'ref', content: { en: 'Kit', ende: 'x' } }
    });
    assert.equal(kind.status, 400);
    const blank = await read(
      await me('/homebrew-cards/' + C(2), {
        method: 'PUT',
        none: true,
        body: { kind: 'set', content: { en: 'Empty' } }
      })
    );
    assert.equal(blank.status, 422);
    const many = Array.from({ length: 101 }, (_, n) => 'r' + String(n));
    const full = await read(
      await me('/homebrew-cards/' + C(1), {
        method: 'PUT',
        rev: 1,
        body: { content: { en: 'Kit', ende: 'x', items: many } }
      })
    );
    assert.equal(full.status, 422);
    assert.equal(full.body.error.problems[0].rule, 'many');
    for (let n = 3; n <= 5; n++) {
      seedCard({
        id: C(n),
        key: K(n),
        kind: 'ref',
        content: { en: 'R' + n, ende: 'x', items: ['ci1'] }
      });
    }
    const refs = await read(
      await me('/homebrew-cards/' + C(6), {
        method: 'PUT',
        none: true,
        body: { kind: 'ref', content: { en: 'R6', ende: 'x', items: ['ci1'] } }
      })
    );
    assert.equal(refs.status, 422);
    assert.equal(refs.body.error.problems[0].path, 'items.0');
    assert.equal(writes().length, 0);
  });
});

describe('POST /me/homebrew-cards/{id}/members', () => {
  it('adds an own item by its set and a catalog record by the card items, and removes them', async () => {
    seedCard();
    seedItem();
    const own = await read(
      await me(`/homebrew-cards/${C(1)}/members`, { method: 'POST', body: { record_id: I(1) } })
    );
    assert.equal(own.status, 200);
    assert.deepEqual(own.body.member, { record_id: I(1), row: 'item', rev: '2' });
    assert.equal(item(I(1)).content.set, K(7));
    const cat = await read(
      await me(`/homebrew-cards/${C(1)}/members`, {
        method: 'POST',
        body: { record_id: 'ci1' }
      })
    );
    assert.deepEqual(cat.body.content.items, ['ci1']);
    const off = await me(`/homebrew-cards/${C(1)}/members/delete`, {
      method: 'POST',
      body: { record_id: 'ci1' }
    });
    assert.equal(off.status, 200);
    assert.equal(fake.state.db.cards[0].content.items, undefined);
    await me(`/homebrew-cards/${C(1)}/members/delete`, {
      method: 'POST',
      body: { record_id: K(1) }
    });
    assert.equal(item(I(1)).content.set, undefined);
  });

  it('asks before it takes a record from another own set; with move the old card goes first', async () => {
    seedCard({ id: C(1), key: K(7), content: { en: 'Old kit', ende: 'x', items: ['ci1'] } });
    seedCard({ id: C(2), key: K(8), content: { en: 'New kit', ende: 'y' } });
    const ask = await read(
      await me(`/homebrew-cards/${C(2)}/members`, {
        method: 'POST',
        body: { record_id: 'ci1' }
      })
    );
    assert.equal(ask.status, 409);
    assert.equal(ask.body.error.code, 'conflict');
    assert.equal(ask.body.error.set, K(7));
    assert.match(ask.body.error.message, /Old kit/);
    const moved = await me(`/homebrew-cards/${C(2)}/members`, {
      method: 'POST',
      body: { record_id: 'ci1', move: true }
    });
    assert.equal(moved.status, 200);
    const order = fake.state.calls
      .filter((c) => c.method === 'PATCH' && c.path === 'homebrew_cards')
      .map((c) => c.query.match(/id=eq\.([^&]+)/)[1]);
    assert.deepEqual(order, [C(1), C(2)]);
    assert.equal(fake.state.db.cards[0].content.items, undefined);
    assert.deepEqual(fake.state.db.cards[1].content.items, ['ci1']);
  });

  it('answers 503 with the first write applied when the second fails, and a retry converges', async () => {
    seedCard({ id: C(1), key: K(7), content: { en: 'Old kit', ende: 'x', items: ['ci1'] } });
    seedCard({ id: C(2), key: K(8), content: { en: 'New kit', ende: 'y' } });
    let patches = 0;
    fake.state.fail = (name, _body, method) =>
      name === 'homebrew_cards' && method === 'PATCH' && ++patches === 2
        ? new Response('{}', { status: 500 })
        : undefined;
    const half = await read(
      await me(`/homebrew-cards/${C(2)}/members`, {
        method: 'POST',
        body: { record_id: 'ci1', move: true }
      })
    );
    assert.equal(half.status, 503);
    assert.match(half.body.error.message, /left the set Old kit/);
    assert.equal(fake.state.db.cards[0].content.items, undefined);
    fake.state.fail = () => undefined;
    const retry = await me(`/homebrew-cards/${C(2)}/members`, {
      method: 'POST',
      body: { record_id: 'ci1' }
    });
    assert.equal(retry.status, 200);
    assert.deepEqual(fake.state.db.cards[1].content.items, ['ci1']);
  });
});

describe('GET /me/homebrew/file', () => {
  it("answers the app's file, which the import parser reads back", async () => {
    seedBook();
    seedCard();
    seedItem({ book_id: B(1), content: { kind: 'item', en: 'Lantern', set: K(7) } });
    const realNow = Date.now;
    Date.now = () => Date.UTC(2026, 10, 14, 12);
    let res;
    try {
      res = await me('/homebrew/file');
    } finally {
      Date.now = realNow;
    }
    const body = await fixture('me-homebrew-file', res);
    assert.equal(body.file.format, 'daggerheart-loot/homebrew');
    assert.equal(body.next, null);
    const back = parseHomebrew(JSON.stringify(body.file), {
      catalogHas: () => true,
      catalogSet: () => false,
      catalogRef: () => false,
      ownItem: () => false,
      ownCard: () => null,
      lineMembers: () => []
    });
    assert.equal(back.ok, true);
    assert.equal(back.file.items.length, 1);
    assert.equal(back.file.cards.length, 1);
  });

  it('pages at 32768 bytes of file by whole items', async () => {
    for (let n = 1; n <= 12; n++) {
      seedItem({
        id: I(n),
        key: `hb_${'bcdefghijklmn'.slice(0, 13)}${'abcdefghijklmnop'[n]}aa`,
        created_at: `2026-11-14T09:00:${String(n).padStart(2, '0')}.000Z`,
        content: { kind: 'item', en: 'Item ' + n, ende: 'x'.repeat(2900) }
      });
    }
    const one = (await read(await me('/homebrew/file'))).body;
    assert.ok(one.next);
    assert.ok(new TextEncoder().encode(JSON.stringify(one.file, null, 2)).length <= 32768);
    const two = (await read(await me('/homebrew/file?cursor=' + one.next))).body;
    assert.equal(one.file.items.length + two.file.items.length, 12);
    assert.equal(two.next, null);
  });
});

describe('POST /me/imports (homebrew)', () => {
  const FILE = {
    format: 'daggerheart-loot/homebrew',
    version: 2,
    books: [{ key: K(5), en: 'Grimoire', sections: [{ key: K(6), en: 'Rings' }] }],
    cards: [],
    items: [
      { key: K(1), kind: 'item', en: 'Ring', book: K(5), section: K(6) },
      { key: K(2), kind: 'item', en: 'Loose' }
    ]
  };
  const IMPORT = id('cccccccc', 1);
  const post = async (body) =>
    read(
      await me('/imports', { method: 'POST', body: { file: JSON.stringify(FILE), ...body } })
    );

  it('answers a dry run with its targets and writes nothing', async () => {
    const dry = await fixture(
      'me-homebrew-import-dry',
      await me('/imports', {
        method: 'POST',
        body: { file: JSON.stringify(FILE), import_id: IMPORT, dry_run: true }
      })
    );
    assert.deepEqual(dry.would_create, { sources: 1, cards: 0, items: 2 });
    assert.deepEqual(dry.targets, [
      { source: K(5), target: 'new' },
      { source: '', target: 'home' }
    ]);
    assert.equal(writes().length, 0);
  });

  it('adds; update needs expect_overwrites and then rewrites the held items', async () => {
    const add = await post({ import_id: IMPORT });
    assert.equal(add.status, 200);
    assert.equal(add.body.created.items_created, 2);
    assert.equal(fake.state.db.items.length, 2);
    FILE.items[1].en = 'Loose 2';
    const UPDATE = id('cccccccc', 2);
    const ask = await post({ import_id: UPDATE, mode: 'update' });
    assert.equal(ask.status, 409);
    assert.equal(ask.body.error.code, 'confirm_required');
    const held = fake.state.db.items.find((x) => x.content.en === 'Loose');
    assert.ok(held);
    const done = await post({ import_id: UPDATE, mode: 'update', expect_overwrites: 2 });
    assert.equal(done.status, 200);
    assert.equal(done.body.created.items_updated, 2);
    assert.equal(held.content.en, 'Loose 2');
    FILE.items[1].en = 'Loose';
  });

  it('makes one new source for a custom target, also on a second apply of the same import_id', async () => {
    const targets = { [K(5)]: { custom: 'My rings', lang: 'en' } };
    const first = await post({ import_id: IMPORT, targets });
    assert.equal(first.status, 200);
    assert.equal(first.body.created.books_created, 1);
    const again = await post({ import_id: IMPORT, targets });
    assert.equal(again.status, 200);
    assert.equal(again.body.created.books_created, 0);
    assert.equal(again.body.created.items_created, 0);
    assert.equal(fake.state.db.books.length, 1);
    assert.equal(fake.state.db.books[0].content.en, 'My rings');
    assert.equal(fake.state.db.items.length, 2);
  });

  it('puts the items into a held target source', async () => {
    seedBook({ id: B(2), key: K(8), content: { en: 'Mine' } });
    const done = await post({ import_id: IMPORT, targets: { [K(5)]: { held: B(2) } } });
    assert.equal(done.status, 200);
    const ring = fake.state.db.items.find((x) => x.content.en === 'Ring');
    assert.equal(ring.book_id, B(2));
    /* The file's section key the account does not hold is its derived key, as in the app. */
    assert.deepEqual(
      fake.state.db.books[0].content.sections.map((s) => s.en),
      ['Rings']
    );
    assert.equal(ring.content.section, fake.state.db.books[0].content.sections[0].key);
  });
});

describe('POST /me/homebrew-items/copies', () => {
  it('copies a catalog record into the default source', async () => {
    const res = await read(
      await me('/homebrew-items/copies', { method: 'POST', body: { from: 'ci1', id: I(1) } })
    );
    assert.equal(res.status, 201);
    assert.equal(res.body.key, keyOf(I(1)));
    assert.equal(res.body.book, null);
    assert.equal(res.body.picture, 'copied');
    assert.equal(item(I(1)).art, 'ci1.webp');
    const again = await me('/homebrew-items/copies', {
      method: 'POST',
      body: { from: 'ci1', id: I(1) }
    });
    assert.equal(again.status, 200);
    assert.equal(fake.state.db.items.length, 1);
  });

  it("copies another account's item with its picture and relinks the lists in one call", async () => {
    const art = 'p/' + 'b'.repeat(32) + '.webp';
    fake.state.storage.set(art, { owner: OTHER, bytes: webp(640) });
    fake.state.storage.set('t/' + art.slice(2), { owner: OTHER, bytes: webp(160) });
    seedItem(
      { id: I(9), key: K(9), art, content: { kind: 'item', en: 'Bee', ru: 'Пчела' } },
      OTHER
    );
    fake.seedList({ id: L(1) }, [
      { id: E(1), item_key: K(9), source: 'homebrew', hb_item: I(9), quantity: 3 }
    ]);
    fake.seedList({ id: L(2) }, [
      { id: E(2), item_key: K(9), source: 'homebrew', hb_item: I(9) }
    ]);
    const res = await read(
      await me('/homebrew-items/copies', { method: 'POST', body: { from: I(9), id: I(1) } })
    );
    assert.equal(res.status, 201);
    assert.equal(res.body.picture, 'copied');
    assert.match(item(I(1)).art, /^p\/[0-9a-f]{32}\.webp$/);
    assert.notEqual(item(I(1)).art, art);
    assert.equal(fake.state.storage.get(item(I(1)).art).owner, GM);
    assert.deepEqual(res.body.relinked, [L(1), L(2)]);
    assert.equal(fake.state.calls.filter((c) => c.path === 'rpc/apply_list_writes').length, 1);
    const e1 = fake.state.db.entries.find((e) => e.id === E(1));
    assert.deepEqual([e1.hb_item, e1.quantity], [I(1), 3]);
    const retry = await read(
      await me('/homebrew-items/copies', { method: 'POST', body: { from: I(9), id: I(1) } })
    );
    assert.equal(retry.status, 200);
    assert.equal(retry.body.picture, 'kept');
    assert.equal(fake.state.db.items.filter((x) => x.owner_id === GM).length, 1);
  });

  it('refuses an own item with 409', async () => {
    seedItem();
    const res = await me('/homebrew-items/copies', { method: 'POST', body: { from: I(1) } });
    assert.equal(res.status, 409);
  });
});

describe('POST /me/lists/{id}/entries with new_item', () => {
  it('makes the item and the entry; a retry makes neither twice', async () => {
    fake.seedList({ id: L(1) }, [{ id: E(1), item_key: 'ci1' }]);
    const body = { new_item: { id: I(1), name: 'Torch', description: 'Bright.' } };
    const res = await read(await me(`/lists/${L(1)}/entries`, { method: 'POST', body }));
    assert.equal(res.status, 200);
    assert.deepEqual(item(I(1)).content, { kind: 'item', ru: 'Torch', rud: 'Bright.' });
    assert.equal(res.body.entries.length, 2);
    assert.equal(res.body.entries[1].record_id, I(1));
    const again = await read(await me(`/lists/${L(1)}/entries`, { method: 'POST', body }));
    assert.equal(again.status, 200);
    assert.equal(again.body.entries.length, 2);
    assert.equal(fake.state.db.items.length, 1);
  });

  it('writes nothing at the entry limit', async () => {
    fake.state.db.limits.entries_per_list = 1;
    fake.seedList({ id: L(1) }, [{ id: E(1), item_key: 'ci1' }]);
    const res = await read(
      await me(`/lists/${L(1)}/entries`, {
        method: 'POST',
        body: { new_item: { id: I(1), name: 'Torch' } }
      })
    );
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'limit_reached');
    assert.equal(fake.state.db.items.length, 0);
  });
});

describe('/mcp/me homebrew tools', () => {
  const ACCOUNT = Object.entries(openapi.paths)
    .filter(
      ([p]) => p.startsWith('/api/v1/me/homebrew') || p === '/api/v1/me/lists/{list_id}/entries'
    )
    .flatMap(([, o]) => Object.values(o))
    .filter((op) => op['x-mcp-tool'])
    .flatMap((op) => [op['x-mcp-tool'], ...(op['x-mcp-also'] ?? []).map((v) => v.name)]);
  const HOMEBREW_TOOLS = ACCOUNT.filter(
    (n) => n !== 'add_to_list' && n !== 'update_list_entries'
  );
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

  it('lists every homebrew tool, no picture upload, the deletes destructive', async () => {
    const res = await mcp(rpc(1, 'tools/list'));
    const tools = new Map((await res.json()).result.tools.map((t) => [t.name, t]));
    for (const name of HOMEBREW_TOOLS) assert.ok(tools.has(name), name);
    assert.equal(HOMEBREW_TOOLS.length, 19);
    assert.deepEqual(Object.keys(tools.get('set_item_picture').inputSchema.properties), [
      'item_id',
      'from'
    ]);
    for (const name of [
      'delete_homebrew_item',
      'delete_homebrew_items',
      'delete_homebrew_source',
      'delete_homebrew_card',
      'clear_item_picture'
    ]) {
      assert.equal(tools.get(name).annotations.destructiveHint, true, name);
      assert.match(tools.get(name).description, /\bask/i, name);
    }
    assert.equal(tools.get('save_item_copy').annotations.idempotentHint, false);
    assert.equal(tools.get('add_new_item_to_list').annotations.idempotentHint, false);
    assert.ok(tools.get('add_new_item_to_list').inputSchema.required.includes('new_item'));
    assert.ok(!('entries' in tools.get('add_new_item_to_list').inputSchema.properties));
    assert.ok(!('new_item' in tools.get('add_to_list').inputSchema.properties));
  });

  it('calls each homebrew tool on its operation', async () => {
    seedBook();
    seedCard();
    seedItem();
    seedItem({ id: I(2), key: K(2) });
    fake.seedList({ id: L(1) }, []);
    const lamp = { kind: 'item', en: 'Lamp' };
    const cases = [
      ['list_my_homebrew_items', {}, 'daggerheart-loot/api-my-homebrew-items'],
      ['get_my_homebrew_item', { item_id: I(1) }, 'daggerheart-loot/api-my-item'],
      ['save_homebrew_item', { item_id: I(3), content: lamp }, 'daggerheart-loot/api-my-item'],
      [
        'move_homebrew_items',
        { items: [{ id: I(3), rev: '1' }], source: B(1) },
        'daggerheart-loot/api-my-results'
      ],
      ['set_item_picture', { item_id: I(1), from: 'ci1' }, 'daggerheart-loot/api-my-item'],
      ['clear_item_picture', { item_id: I(1) }, 'daggerheart-loot/api-my-item'],
      ['save_item_copy', { from: 'ci2', id: I(4) }, 'daggerheart-loot/api-my-item'],
      ['list_my_sources', {}, 'daggerheart-loot/api-my-sources'],
      [
        'save_homebrew_source',
        { source_id: B(2), content: { en: 'Codex' } },
        'daggerheart-loot/api-my-source'
      ],
      ['list_my_cards', {}, 'daggerheart-loot/api-my-cards'],
      [
        'save_homebrew_card',
        { card_id: C(2), kind: 'ref', content: { en: 'Rule', ende: 'x' } },
        'daggerheart-loot/api-my-card'
      ],
      ['add_card_member', { card_id: C(1), record_id: 'ci3' }, 'daggerheart-loot/api-my-card'],
      [
        'remove_card_member',
        { card_id: C(1), record_id: 'ci3' },
        'daggerheart-loot/api-my-card'
      ],
      ['export_homebrew', {}, 'daggerheart-loot/api-my-homebrew-file'],
      [
        'add_new_item_to_list',
        { list_id: L(1), new_item: { id: I(6), name: 'Torch' } },
        'daggerheart-loot/api-my-list'
      ],
      ['delete_homebrew_card', { card_id: C(2), rev: '1' }, null],
      ['delete_homebrew_source', { source_id: B(2), rev: '1' }, null],
      ['delete_homebrew_item', { item_id: I(2), rev: '1' }, null],
      ['delete_homebrew_items', { ids: [I(3)] }, 'daggerheart-loot/api-my-results']
    ];
    assert.deepEqual(cases.map((c) => c[0]).sort(), [...HOMEBREW_TOOLS].sort());
    for (const [name, args, format] of cases) {
      const result = await callTool(name, args);
      assert.equal(result.isError, undefined, name + ': ' + JSON.stringify(result));
      if (format) assert.equal(result.structuredContent.format, format, name);
      else assert.deepEqual(result.structuredContent, { status: 204 }, name);
    }
    const over = await callTool('save_homebrew_item', {
      item_id: I(4),
      overwrite: true,
      content: { kind: 'item', en: 'Lamp 2' }
    });
    assert.equal(over.isError, undefined);
    const text = JSON.stringify(
      await (
        await mcp(
          rpc(7, 'tools/call', { name: 'get_my_homebrew_item', arguments: { item_id: I(4) } })
        )
      ).json(),
      null,
      2
    );
    pinned(join(MCP_FIXTURES, 'me-homebrew-tools-call.json'), wrap(text));
  });
});

/** An answer of `bytes` bytes, past a read cap. */
const bigAnswer = (bytes) =>
  new Response('["' + 'x'.repeat(bytes) + '"]', {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
const callMe = async (name, args) =>
  (
    await (
      await worker.fetch(
        new Request(HOST + '/mcp/me', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + TOKEN,
            'Content-Type': 'application/json',
            'MCP-Protocol-Version': '2025-06-18'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: { name, arguments: args }
          })
        }),
        ENV
      )
    ).json()
  ).result;

describe('the homebrew file at scale', () => {
  it('pages 300 small items with at most 20 Supabase calls a page, each item once', async () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz234567';
    for (let n = 0; n < 300; n++) {
      seedItem({
        id: I(n + 1),
        key: `hb_${'bcdefghijklm'}${letters[n % 32]}${letters[Math.floor(n / 32)]}aa`,
        created_at: `2026-11-14T09:${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}.000Z`,
        content: { kind: 'item', en: 'Item ' + n }
      });
    }
    const seen = [];
    let cursor = null;
    let pages = 0;
    do {
      const before = fake.state.calls.length;
      const page = (
        await read(await me('/homebrew/file' + (cursor ? '?cursor=' + cursor : '')))
      ).body;
      assert.ok(
        fake.state.calls.length - before <= 20,
        'calls ' + (fake.state.calls.length - before)
      );
      assert.ok(new TextEncoder().encode(JSON.stringify(page.file, null, 2)).length <= 32768);
      seen.push(...page.file.items.map((x) => x.key));
      cursor = page.next;
      pages++;
    } while (cursor && pages < 10);
    assert.equal(cursor, null);
    assert.equal(seen.length, 300);
    assert.equal(new Set(seen).size, 300);
  });

  it('answers a cursor whose item is gone with the first-page hint', async () => {
    seedItem();
    const res = await read(await me('/homebrew/file?cursor=' + btoa(I(9))));
    assert.equal(res.status, 400);
    assert.match(res.body.error.message, /The item of the cursor is gone/);
  });
});

describe('account reads past their cap', () => {
  const pastCap = (table, test) => (name, _body, method, q) =>
    name === table && method === 'GET' && test(q) ? bigAnswer(262145) : undefined;

  it('answers a card save 422 when the other cards pass the read cap, and writes nothing', async () => {
    fake.state.fail = pastCap('homebrew_cards', (q) => (q.get('id') ?? '').startsWith('neq.'));
    const res = await read(
      await me('/homebrew-cards/' + C(1), {
        method: 'PUT',
        none: true,
        body: { kind: 'set', content: { en: 'Kit', ende: 'Bonus.' } }
      })
    );
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'answer_too_large');
    assert.equal(fake.state.db.cards.length, 0);
  });

  it('answers a card member change 422 when the other cards pass the read cap', async () => {
    seedCard();
    fake.state.fail = pastCap('homebrew_cards', (q) => (q.get('id') ?? '').startsWith('neq.'));
    const res = await read(
      await me(`/homebrew-cards/${C(1)}/members`, {
        method: 'POST',
        body: { record_id: 'ci1' }
      })
    );
    assert.equal(res.status, 422);
    assert.equal(fake.state.db.cards[0].content.items, undefined);
  });

  it('answers a source save 422 when the other sources pass the read cap', async () => {
    fake.state.fail = (name, _b, method) =>
      name === 'homebrew_books' && method === 'GET' ? bigAnswer(70000) : undefined;
    const res = await read(
      await me('/homebrew-sources/' + B(1), {
        method: 'PUT',
        none: true,
        body: { content: { en: 'Grimoire' } }
      })
    );
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'answer_too_large');
    assert.equal(fake.state.db.books.length, 0);
  });

  for (const table of ['homebrew_books', 'homebrew_items', 'homebrew_cards']) {
    it(`answers a homebrew import 422 when ${table} passes the read cap`, async () => {
      fake.state.fail = pastCap(table, () => true);
      const file = {
        format: 'daggerheart-loot/homebrew',
        version: 2,
        books: [],
        cards: [],
        items: [{ key: K(1), kind: 'item', en: 'Ring' }]
      };
      const res = await read(
        await me('/imports', { method: 'POST', body: { file: JSON.stringify(file) } })
      );
      assert.equal(res.status, 422);
      assert.match(res.body.error.message, /in the app/);
      assert.equal(writes().length, 0);
    });
  }

  it('reads the other cards as names and members only, and still refuses a held name', async () => {
    seedCard({ content: { en: 'Kit', ende: 'A long bonus.', items: ['ci1'] } });
    const res = await read(
      await me('/homebrew-cards/' + C(2), {
        method: 'PUT',
        none: true,
        body: { kind: 'set', content: { en: 'kit', ende: 'Other.' } }
      })
    );
    assert.equal(res.status, 422);
    assert.equal(res.body.error.problems[0].rule, 'duplicate');
    const read0 = fake.state.calls.find(
      (c) => c.path === 'homebrew_cards' && c.query.includes('id=neq.')
    );
    assert.match(
      decodeURIComponent(read0.query),
      /en:content->>en,ru:content->>ru,items:content->items/
    );
  });
});

describe('a section the item already stores', () => {
  it('saves the read content back after its source is deleted', async () => {
    seedBook({ content: { en: 'Grimoire', sections: [{ key: K(6), en: 'Rings' }] } });
    seedItem({ book_id: B(1), content: { kind: 'item', en: 'Ring', section: K(6) } });
    assert.equal(
      (await me('/homebrew-sources/' + B(1), { method: 'DELETE', rev: 1 })).status,
      204
    );
    const got = (await read(await me('/homebrew-items/' + I(1)))).body;
    const res = await me('/homebrew-items/' + I(1), {
      method: 'PUT',
      rev: got.rev,
      body: { book: got.book, content: { ...got.content, en: 'Ring 2' } }
    });
    assert.equal(res.status, 200);
    assert.equal(item(I(1)).content.en, 'Ring 2');
    const moved = await me('/homebrew-items/' + I(1), {
      method: 'PUT',
      rev: '2',
      body: { book: null, content: { ...got.content, section: K(8) } }
    });
    assert.equal(moved.status, 422);
  });
});

describe('a copy id that is not this copy', () => {
  it('answers 409 for an id of an unrelated own item, and relinks nothing', async () => {
    seedItem({ id: I(1), key: K(1), content: { kind: 'item', en: 'Mine' } });
    seedItem(
      { id: I(9), key: K(9), art: 'ci2.webp', content: { kind: 'item', en: 'Bee' } },
      OTHER
    );
    fake.seedList({ id: L(1) }, [
      { id: E(1), item_key: K(9), source: 'homebrew', hb_item: I(9) }
    ]);
    const res = await read(
      await me('/homebrew-items/copies', { method: 'POST', body: { from: I(9), id: I(1) } })
    );
    assert.equal(res.status, 409);
    assert.match(res.body.error.message, /another own item/);
    assert.equal(fake.state.db.entries[0].hb_item, I(9));
    assert.equal(item(I(1)).art, null);
    assert.equal(writes().length, 0);
  });

  it("answers 409 for an id of another account's item", async () => {
    seedItem({ id: I(9), key: K(9), content: { kind: 'item', en: 'Bee' } }, OTHER);
    const res = await read(
      await me('/homebrew-items/copies', { method: 'POST', body: { from: 'ci1', id: I(9) } })
    );
    assert.equal(res.status, 409);
    assert.match(res.body.error.message, /another account/);
    assert.equal(fake.state.db.items.length, 1);
  });

  it('stores a copied .jpg picture with its own media type', async () => {
    const art = 'p/' + 'c'.repeat(32) + '.jpg';
    fake.state.storage.set(art, { owner: OTHER, bytes: new Uint8Array(40) });
    fake.state.storage.set('t/' + art.slice(2), { owner: OTHER, bytes: new Uint8Array(20) });
    seedItem({ id: I(9), key: K(9), art, content: { kind: 'item', en: 'Bee' } }, OTHER);
    const res = await read(
      await me('/homebrew-items/copies', { method: 'POST', body: { from: I(9), id: I(1) } })
    );
    assert.equal(res.body.picture, 'copied');
    const uploads = fake.state.calls.filter(
      (c) => c.method === 'POST' && c.path.startsWith('/storage/v1/object/homebrew-art/')
    );
    assert.equal(uploads.length, 2);
    for (const u of uploads) assert.equal(u.headers.get('Content-Type'), 'image/jpeg');
  });
});

describe('the picture body', () => {
  it('reads a part whose filename comes before its name', async () => {
    seedItem();
    const enc = new TextEncoder();
    const part = (name, bytes) => [
      enc.encode(
        `--${BOUNDARY}\r\nContent-Disposition: form-data; filename="${name}.webp"; name="${name}"\r\nContent-Type: image/webp\r\n\r\n`
      ),
      bytes,
      enc.encode('\r\n')
    ];
    const chunks = [
      ...part('full', webp(640)),
      ...part('thumb', webp(160)),
      enc.encode(`--${BOUNDARY}--\r\n`)
    ];
    const body = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let at = 0;
    for (const c of chunks) {
      body.set(c, at);
      at += c.length;
    }
    const res = await me(`/homebrew-items/${I(1)}/picture`, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': `multipart/form-data; boundary=${BOUNDARY}` }
    });
    assert.equal(res.status, 200);
  });

  it('answers a Storage refusal of the token 401, not limit_reached', async () => {
    seedItem();
    fake.state.fail = (name, _b, method) =>
      name === 'storage' && method === 'POST'
        ? new Response(
            JSON.stringify({
              statusCode: '403',
              error: 'Unauthorized',
              message: 'jwt expired'
            }),
            { status: 400 }
          )
        : undefined;
    const res = await read(
      await upload(I(1), [
        ['full', webp(640)],
        ['thumb', webp(160)]
      ])
    );
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'invalid_token');
  });
});

describe('a member move with a stale rev or an ended connection', () => {
  const twoSets = () => {
    seedCard({ id: C(1), key: K(7), content: { en: 'Old kit', ende: 'x', items: ['ci1'] } });
    seedCard({ id: C(2), key: K(8), revision: 3, content: { en: 'New kit', ende: 'y' } });
  };

  it('answers 412 before the first write when If-Match is stale', async () => {
    twoSets();
    const res = await read(
      await me(`/homebrew-cards/${C(2)}/members`, {
        method: 'POST',
        rev: 2,
        body: { record_id: 'ci1', move: true }
      })
    );
    assert.equal(res.status, 412);
    assert.deepEqual(fake.state.db.cards[0].content.items, ['ci1']);
    assert.equal(writes().length, 0);
  });

  it('answers 401 when the connection ends between the two writes', async () => {
    twoSets();
    let patches = 0;
    fake.state.fail = (name, _b, method) =>
      name === 'homebrew_cards' && method === 'PATCH' && ++patches === 2
        ? new Response(
            JSON.stringify({
              code: '42501',
              message: 'api_client_guard: the session of this token has ended'
            }),
            { status: 403 }
          )
        : undefined;
    const res = await read(
      await me(`/homebrew-cards/${C(2)}/members`, {
        method: 'POST',
        body: { record_id: 'ci1', move: true }
      })
    );
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'invalid_token');
  });
});

describe('the save modes', () => {
  const lamp = { kind: 'item', en: 'Lamp' };

  it('refuses overwrite with a rev: 400 "Send rev or overwrite, not both."', async () => {
    seedItem({ revision: 3 });
    const res = await read(
      await me('/homebrew-items/' + I(1), {
        method: 'PUT',
        rev: 2,
        body: { overwrite: true, content: lamp }
      })
    );
    assert.equal(res.status, 400);
    assert.equal(res.body.error.message, 'Send rev or overwrite, not both.');
    assert.equal(item(I(1)).content.en, 'Lantern');
  });

  it('takes rev "*" on the MCP saves as any revision', async () => {
    seedItem({ revision: 5 });
    const result = await callMe('save_homebrew_item', {
      item_id: I(1),
      rev: '*',
      content: lamp
    });
    assert.equal(result.isError, undefined, JSON.stringify(result));
    assert.equal(item(I(1)).content.en, 'Lamp');
    const list = await callMe('save_homebrew_item', {
      item_id: I(1),
      rev: '6',
      overwrite: true,
      content: lamp
    });
    assert.equal(list.isError, true);
  });

  it('says that the change is saved when the item answer is past its cap', async () => {
    seedItem();
    fake.state.fail = (name) => (name === 'get_homebrew_item' ? bigAnswer(70000) : undefined);
    const res = await read(
      await me('/homebrew-items/' + I(1), { method: 'PUT', rev: 1, body: { content: lamp } })
    );
    assert.equal(res.status, 422);
    assert.match(res.body.error.message, /The change is saved/);
    assert.equal(item(I(1)).content.en, 'Lamp');
    const plain = await read(await me('/homebrew-items/' + I(1)));
    assert.doesNotMatch(plain.body.error.message, /saved/);
  });

  it('documents the ask before an overwrite and the add_to_list answers', () => {
    const ops = Object.values(openapi.paths).flatMap((o) => Object.values(o));
    for (const id of ['saveHomebrewItem', 'saveHomebrewSource', 'saveHomebrewCard']) {
      const op = ops.find((o) => o.operationId === id);
      assert.match(op.description, /ask before you send overwrite/, id);
    }
    const add = ops.find((o) => o.operationId === 'addToList');
    for (const s of ['409', '412', '422']) assert.ok(add.responses[s], s);
  });
});

describe('homebrew paths the stub reaches', () => {
  it("answers 404 for a picture from another account's item", async () => {
    seedItem();
    seedItem({ id: I(9), key: K(9), art: 'ci2.webp' }, OTHER);
    const res = await me(`/homebrew-items/${I(1)}/picture`, {
      method: 'PUT',
      body: { from: I(9) }
    });
    assert.equal(res.status, 404);
  });

  it('answers a copy 503 when the relink fails, and a retry relinks once', async () => {
    seedItem({ id: I(9), key: K(9), content: { kind: 'item', en: 'Bee' } }, OTHER);
    fake.seedList({ id: L(1) }, [
      { id: E(1), item_key: K(9), source: 'homebrew', hb_item: I(9) }
    ]);
    fake.state.fail = (name) =>
      name === 'apply_list_writes' ? new Response('{}', { status: 500 }) : undefined;
    const failed = await me('/homebrew-items/copies', {
      method: 'POST',
      body: { from: I(9), id: I(1) }
    });
    assert.equal(failed.status, 503);
    fake.state.fail = () => undefined;
    const retry = await read(
      await me('/homebrew-items/copies', { method: 'POST', body: { from: I(9), id: I(1) } })
    );
    assert.equal(retry.status, 200);
    assert.deepEqual(retry.body.relinked, [L(1)]);
    assert.equal(fake.state.calls.filter((c) => c.path === 'rpc/apply_list_writes').length, 2);
    assert.equal(fake.state.db.entries[0].hb_item, I(1));
  });

  it('adds the entry on a retry after a failed add, with no second item', async () => {
    fake.seedList({ id: L(1) }, []);
    fake.state.fail = (name) =>
      name === 'apply_list_writes' ? new Response('{}', { status: 500 }) : undefined;
    const body = { new_item: { id: I(1), name: 'Torch' } };
    const failed = await me(`/lists/${L(1)}/entries`, { method: 'POST', body });
    assert.equal(failed.status, 503);
    fake.state.fail = () => undefined;
    const retry = await read(await me(`/lists/${L(1)}/entries`, { method: 'POST', body }));
    assert.equal(retry.status, 200);
    assert.equal(retry.body.entries.length, 1);
    assert.equal(fake.state.db.items.length, 1);
  });

  for (const rid of ['q313', 'q23']) {
    it(`copies the catalog record ${rid} as copyContentOf does, but for the language pair`, async () => {
      const api = await (
        await worker.fetch(new Request(HOST + '/api/v1/records/' + rid), ENV)
      ).json();
      const res = await read(
        await me('/homebrew-items/copies', { method: 'POST', body: { from: rid, id: I(1) } })
      );
      assert.equal(res.status, 201);
      const data = CATALOG.loot.eq.find((r) => r.id === rid);
      const want = copyContentOf(data, api.craft.from);
      const strip = ({ en: _a, ru: _b, ende: _c, rud: _d, ...rest }) => rest;
      assert.deepEqual(strip(item(I(1)).content), strip(want));
    });
  }

  it('converges a retry of an update import with the same import_id and count', async () => {
    seedItem({ key: K(1), content: { kind: 'item', en: 'Old' } });
    const file = {
      format: 'daggerheart-loot/homebrew',
      version: 2,
      books: [],
      cards: [],
      items: [
        { key: K(1), kind: 'item', en: 'New' },
        { key: K(2), kind: 'item', en: 'Added' }
      ]
    };
    const post = (extra) =>
      me('/imports', {
        method: 'POST',
        body: {
          file: JSON.stringify(file),
          mode: 'update',
          import_id: id('cccccccc', 3),
          ...extra
        }
      });
    const first = await read(await post({ expect_overwrites: 1 }));
    assert.equal(first.status, 200);
    const again = await read(await post({ expect_overwrites: 1 }));
    assert.equal(again.status, 200, JSON.stringify(again.body));
    assert.equal(fake.state.db.items.length, 2);
  });
});

/** The fixture of one MCP call: the request and the answer body, as docs/fixtures/mcp/ holds
 *  them. */
function wrap(answerText) {
  return (
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
          body: rpc7
        },
        answer: { status: 200, body: JSON.parse(answerText) }
      },
      null,
      2
    ) + '\n'
  );
}
const rpc7 = {
  jsonrpc: '2.0',
  id: 7,
  method: 'tools/call',
  params: { name: 'get_my_homebrew_item', arguments: { item_id: I(4) } }
};
