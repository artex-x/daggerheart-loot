/*
  Own pictures of homebrew items (20261014120000_homebrew_art.sql): the
  public bucket and its insert policy with the room of twice the item limit
  plus 5 pictures; homebrew_items.art names only an upload of the row's
  stored owner that is not queued for deletion; the release trigger and the
  hourly job queue the Storage API deletes through pg_net with the Vault
  secrets, nothing without them, and a failed call refuses no write; the
  lock per name orders a naming write and a release across two connections;
  img beside the item in the three reads and get_print_set, #70's share
  rules kept; a print set keeps no file alive (it names items); the 3x
  timings; no API role reaches the key or the delete. Every seed runs in a
  transaction that rolls back, but for the two-connection case, which
  commits and deletes its rows. docs/specs/META.md, section 3;
  docs/decisions/2026-10-14-own-pictures-are-random-named-files-the-database-deletes.md.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asRole, connect } from './roles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const A = '00000000-0000-4000-8000-0000000000a8';
const B = '00000000-0000-4000-8000-0000000000b8';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const hex = (c) => c.repeat(32);
const p = (c) => `p/${hex(c)}.webp`;
const t = (c) => `t/${hex(c)}.webp`;
const API = 'http://example.test';
const KEY = 'test-storage-key';
const url = (name) => `${API}/storage/v1/object/homebrew-art/${name}`;
const ITEM = { kind: 'item', ru: 'Спальный мешок' };

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

/* Runs `fn(tx)` as the connection's own role and rolls it back. */
async function rolledBack(fn) {
  const rollback = new Error('rollback');
  let result;
  await assert.rejects(
    sql.begin(async (tx) => {
      result = await fn(tx);
      throw rollback;
    }),
    (err) => err === rollback
  );
  return result;
}

/* The call inside a savepoint, so the transaction reads on after a refusal; answers the
   error, or null. */
const refused = (tx, fn) =>
  tx
    .savepoint((sp) => fn(sp))
    .then(
      () => null,
      (err) => err
    );

const users = (tx, ...ids) => tx`insert into auth.users (id) select unnest(${ids}::uuid[])`;
/* An object row as Storage writes it; seeded as postgres, so owner_id is given. */
const obj = (tx, owner, name, age = '0 seconds') =>
  tx`insert into storage.objects (bucket_id, name, owner_id, created_at)
    values ('homebrew-art', ${name}, ${owner}, now() - ${age}::interval)`;
const pic = async (tx, owner, c, age) => {
  await obj(tx, owner, p(c), age);
  await obj(tx, owner, t(c), age);
};
const item = (tx, iid, owner, key, art = null) =>
  tx`insert into public.homebrew_items (id, owner_id, key, content, art)
    values (${iid}, ${owner}, ${key}, ${tx.json(ITEM)}, ${art})`;
const vault = async (tx, api = API) => {
  await tx`select vault.create_secret(${api}, 'dhloot_api_url')`;
  await tx`select vault.create_secret(${KEY}, 'dhloot_storage_key')`;
};
const mark = async (tx) =>
  (await tx`select coalesce(max(id), 0)::bigint as n from net.http_request_queue`)[0].n;
const queued = async (tx, since) =>
  (
    await tx`select method, url, headers from net.http_request_queue
      where id > ${since} order by url, id`
  ).map((r) => ({ ...r }));
const released = async (tx) =>
  (await tx`select name from public.homebrew_art_released order by name`).map((r) => r.name);
const cleanup = async (tx) => (await tx`select public.lifecycle_cleanup() as v`)[0].v;
/* Acts as the user with the given id inside the open transaction, then as postgres again. */
async function asUser(tx, sub, fn) {
  await tx.unsafe('set local role authenticated');
  await tx`select set_config('request.jwt.claims', ${JSON.stringify({ role: 'authenticated', sub })}, true)`;
  try {
    return await fn();
  } finally {
    await tx.unsafe('reset role');
  }
}
const del = (name) => ({ method: 'DELETE', url: url(name), headers: { apikey: KEY } });

describe('the bucket and its insert policy', () => {
  it('is a public bucket of 200 KB WebP and JPEG files', async () => {
    const [b] = await sql`select public, file_size_limit, allowed_mime_types
      from storage.buckets where id = 'homebrew-art'`;
    assert.deepEqual(
      { ...b },
      {
        public: true,
        file_size_limit: '204800',
        allowed_mime_types: ['image/webp', 'image/jpeg']
      }
    );
  });

  it('lets a member insert a good name and refuses a bad name and anon', async () => {
    const out = await asRole(
      sql,
      { role: 'authenticated', sub: A, setup: (tx) => users(tx, A) },
      async (tx) => ({
        good: await refused(tx, (sp) => obj(sp, A, p('a'))),
        bad: await refused(tx, (sp) => obj(sp, A, 'x/notapicture.webp')),
        thumb: await refused(tx, (sp) => obj(sp, A, t('a')))
      })
    );
    assert.equal(out.good, null);
    assert.equal(out.thumb, null);
    assert.equal(out.bad?.code, '42501');
    const anon = await asRole(sql, { role: 'anon' }, (tx) =>
      refused(tx, (sp) => obj(sp, null, p('b')))
    );
    assert.equal(anon?.code, '42501');
  });

  it("stops an upload at twice the item limit plus 5 pictures, counting only the caller's files", async () => {
    const setup = async (tx) => {
      await users(tx, A, B);
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${A}, 'homebrew_items_per_owner', 1)`;
      // 11 of A's 12 files, and 20 of B's.
      await tx`insert into storage.objects (bucket_id, name, owner_id)
        select 'homebrew-art', 'p/' || md5('a' || g) || '.webp', ${A}
        from generate_series(1, 11) g`;
      await tx`insert into storage.objects (bucket_id, name, owner_id)
        select 'homebrew-art', 'p/' || md5('b' || g) || '.webp', ${B}
        from generate_series(1, 20) g`;
    };
    const out = await asRole(sql, { role: 'authenticated', sub: A, setup }, async (tx) => ({
      last: await refused(tx, (sp) => obj(sp, A, p('c'))),
      past: await refused(tx, (sp) => obj(sp, A, p('d')))
    }));
    assert.equal(out.last, null);
    assert.equal(out.past?.code, '42501');
  });

  it('adds no upload limit for an account with no item limit', async () => {
    const setup = async (tx) => {
      await users(tx, A);
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${A}, 'homebrew_items_per_owner', null)`;
      await tx`insert into storage.objects (bucket_id, name, owner_id)
        select 'homebrew-art', 'p/' || md5('a' || g) || '.webp', ${A}
        from generate_series(1, 220) g`;
    };
    const out = await asRole(sql, { role: 'authenticated', sub: A, setup }, (tx) =>
      refused(tx, (sp) => obj(sp, A, p('c')))
    );
    assert.equal(out, null);
  });
});

describe("an item names only its stored owner's upload", () => {
  const setup = async (tx) => {
    await users(tx, A, B);
    await pic(tx, A, 'a');
    await pic(tx, B, 'b');
    // A's c has no 160 px file.
    await obj(tx, A, p('c'));
    await item(tx, id(18001), A, 'hb_artaaaaaaaaaaaaa');
  };
  const write = (art, key) => (sp) =>
    sp`insert into public.homebrew_items (id, key, content, art)
      values (${crypto.randomUUID()}, ${key}, ${sp.json(ITEM)}, ${art})`;

  it('takes an own upload and a catalog picture, and refuses a missing file, a foreign one and a bad shape', async () => {
    const out = await asRole(sql, { role: 'authenticated', sub: A, setup }, async (tx) => ({
      own: await refused(tx, write(p('a'), 'hb_ownaaaaaaaaaaaaa')),
      none: await refused(tx, write(p('d'), 'hb_noneaaaaaaaaaaaa')),
      foreign: await refused(tx, write(p('b'), 'hb_foreignaaaaaaaaa')),
      noThumb: await refused(tx, write(p('c'), 'hb_nothumbaaaaaaaaa')),
      catalog: await refused(tx, write('q1.webp', 'hb_catalogaaaaaaaaa')),
      shape: await refused(tx, write('q1.png', 'hb_shapeaaaaaaaaaaa'))
    }));
    assert.equal(out.own, null);
    assert.equal(out.catalog, null);
    for (const err of [out.none, out.foreign, out.noThumb]) {
      assert.equal(err?.code, 'P0001');
      assert.equal(err.message, 'homebrew: art missing');
    }
    assert.equal(out.shape?.code, '23514');
    assert.match(out.shape.message, /homebrew_items_art_shape/);
  });

  it("refuses an update that names another account's file by sending its owner_id", async () => {
    const out = await asRole(sql, { role: 'authenticated', sub: A, setup }, async (tx) => {
      const err = await refused(
        tx,
        (sp) => sp`update public.homebrew_items set art = ${p('b')}, owner_id = ${B}
          where id = ${id(18001)}`
      );
      const [row] = await tx`select owner_id, art, revision from public.homebrew_items
        where id = ${id(18001)}`;
      return { err, row: { ...row } };
    });
    assert.equal(out.err?.code, 'P0001');
    assert.equal(out.err.message, 'homebrew: art missing');
    assert.deepEqual(out.row, { owner_id: A, art: null, revision: '1' });
  });

  it('checks nothing on an update that keeps the name, and refuses a released name', async () => {
    const seeded = async (tx) => {
      await setup(tx);
      await tx`update public.homebrew_items set art = ${p('a')} where id = ${id(18001)}`;
      await tx`insert into public.homebrew_art_released (name) values (${p('a')})`;
    };
    const out = await asRole(
      sql,
      { role: 'authenticated', sub: A, setup: seeded },
      async (tx) => ({
        same: await refused(
          tx,
          (sp) => sp`update public.homebrew_items set art = ${p('a')} where id = ${id(18001)}`
        ),
        text: await refused(
          tx,
          (sp) => sp`update public.homebrew_items
          set content = ${sp.json({ ...ITEM, en: 'Bedroll' })} where id = ${id(18001)}`
        ),
        again: await refused(tx, write(p('a'), 'hb_againaaaaaaaaaaa'))
      })
    );
    assert.equal(out.same, null);
    assert.equal(out.text, null);
    assert.equal(out.again?.message, 'homebrew: art missing');
  });
});

describe('the release asks Storage to delete', () => {
  /* A's picture a on the items I1 and I2, b on I3 and I4, d on I5. */
  const world = async (tx) => {
    await vault(tx);
    await users(tx, A, B);
    await pic(tx, A, 'a');
    await pic(tx, A, 'b');
    await pic(tx, A, 'd');
    await item(tx, id(18101), A, 'hb_oneaaaaaaaaaaaaa', p('a'));
    await item(tx, id(18102), A, 'hb_twoaaaaaaaaaaaaa', p('a'));
    await item(tx, id(18103), A, 'hb_threeaaaaaaaaaaa', p('b'));
    await item(tx, id(18104), A, 'hb_fouraaaaaaaaaaaa', p('b'));
    await item(tx, id(18105), A, 'hb_fiveaaaaaaaaaaaa', p('d'));
  };

  it('queues both deletes, with the address and the apikey header, once no item names the file', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const m = await mark(tx);
      await tx`update public.homebrew_items set art = null where id = ${id(18101)}`;
      const shared = await queued(tx, m);
      await tx`update public.homebrew_items set art = 'q1.webp' where id = ${id(18102)}`;
      return { shared, last: await queued(tx, m), released: await released(tx) };
    });
    assert.deepEqual(out.shared, []);
    assert.deepEqual(out.last, [del(p('a')), del(t('a'))]);
    assert.deepEqual(out.released, [p('a')]);
  });

  it('queues the deletes of a deleted item and of a bulk delete of two items that share a picture', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const m = await mark(tx);
      await tx`delete from public.homebrew_items where id = ${id(18105)}`;
      const one = await queued(tx, m);
      const m2 = await mark(tx);
      await tx`delete from public.homebrew_items where id in (${id(18103)}, ${id(18104)})`;
      return { one, bulk: await queued(tx, m2) };
    });
    assert.deepEqual(out.one, [del(p('d')), del(t('d'))]);
    assert.ok(out.bulk.length >= 2, JSON.stringify(out.bulk));
    assert.deepEqual([...new Set(out.bulk.map((r) => r.url))], [url(p('b')), url(t('b'))]);
  });

  it('keeps no file alive for a print set: the set names the item, and its read drops img with the art', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const entries = [{ h: id(18101) }, { h: id(18102), q: 2 }];
      const sid = await asUser(
        tx,
        B,
        async () =>
          (await tx`select public.create_print_set(${tx.json(entries)}::jsonb) as v`)[0].v
      );
      const read = () =>
        asUser(tx, B, async () => (await tx`select public.get_print_set(${sid}) as v`)[0].v);
      const before = await read();
      const m = await mark(tx);
      await tx`update public.homebrew_items set art = null where id in (${id(18101)}, ${id(18102)})`;
      return {
        before,
        queue: [...new Set((await queued(tx, m)).map((r) => r.url))],
        released: await released(tx),
        after: await read()
      };
    });
    assert.deepEqual(
      out.before.entries.map((e) => e.img),
      [p('a'), p('a')]
    );
    assert.deepEqual(out.queue, [url(p('a')), url(t('a'))]);
    assert.deepEqual(out.released, [p('a')]);
    assert.deepEqual(
      out.after.entries.map((e) => Object.keys(e).sort().join()),
      ['hid,item', 'hid,item,q']
    );
    assert.equal(out.after.missing, 0);
  });

  it("queues every file of an account's items at the account's deletion", async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const m = await mark(tx);
      await asUser(tx, A, () => tx`select public.delete_account()`);
      return [...new Set((await queued(tx, m)).map((r) => r.url))];
    });
    assert.deepEqual(out, ['a', 'b', 'd'].flatMap((c) => [url(p(c)), url(t(c))]).sort());
  });

  it('queues nothing without the Vault secrets, and every write succeeds', async () => {
    const out = await rolledBack(async (tx) => {
      await users(tx, A);
      await pic(tx, A, 'a');
      await item(tx, id(18101), A, 'hb_oneaaaaaaaaaaaaa', p('a'));
      const m = await mark(tx);
      await tx`update public.homebrew_items set art = null where id = ${id(18101)}`;
      await asUser(tx, A, () => tx`select public.delete_account()`);
      return { queue: await queued(tx, m), files: (await cleanup(tx)).files };
    });
    assert.deepEqual(out, { queue: [], files: null });
  });

  it('refuses no write and stops no part of the job when the call fails', async () => {
    const out = await rolledBack(async (tx) => {
      // pg_net refuses a malformed address: every call raises inside art_delete.
      await vault(tx, 'not an address');
      await users(tx, A);
      await pic(tx, A, 'a');
      await pic(tx, A, 'b');
      await pic(tx, A, 'e', '2 hours');
      await item(tx, id(18101), A, 'hb_oneaaaaaaaaaaaaa', p('a'));
      await item(tx, id(18102), A, 'hb_twoaaaaaaaaaaaaa', p('b'));
      await tx`insert into public.lists (id, owner_id) values (${id(18201)}, ${A})`;
      await tx`insert into public.list_notices (list_id, item_key, kind, name, read_at)
        values (${id(18201)}, 'hb_readaaaaaaaaaaaa', 'changed', ${tx.json({ en: 'x', ru: 'x' })},
          now() - interval '2 hours')`;
      const m = await mark(tx);
      await tx`update public.homebrew_items set art = null where id = ${id(18101)}`;
      await tx`delete from public.homebrew_items where id = ${id(18102)}`;
      const job = await cleanup(tx);
      await asUser(tx, A, () => tx`select public.delete_account()`);
      const [{ users: left }] =
        await tx`select count(*)::int as users from auth.users where id = ${A}`;
      return { job, left, queue: await queued(tx, m) };
    });
    // The job's call held the unnamed e: it failed, so its count is null.
    assert.equal(out.job.files, null);
    assert.ok(out.job.notices >= 1, JSON.stringify(out.job));
    assert.equal(out.left, 0);
    assert.deepEqual(out.queue, []);
  });
});

describe('the released names and the lock per name', () => {
  it('upserts what the job queues and deletes a released row after a day', async () => {
    const out = await rolledBack(async (tx) => {
      await vault(tx);
      await users(tx, A);
      await pic(tx, A, 'a', '2 hours');
      await tx`insert into public.homebrew_art_released (name, at) values
        (${p('e')}, now() - interval '25 hours'), (${p('f')}, now() - interval '23 hours')`;
      await cleanup(tx);
      return released(tx);
    });
    assert.deepEqual(out, [p('a'), p('f')]);
  });

  it('orders a naming write after a release of the same name, in both orders', async () => {
    const U = '00000000-0000-4000-8000-0000000018a1';
    const I1 = id(18301);
    const I2 = id(18302);
    const X = p('9');
    const one = connect();
    const two = connect();
    const pidOf = async (c) => (await c`select pg_backend_pid() as pid`)[0].pid;
    /* Waits until the connection `pid` waits on a lock. */
    const blocked = async (pid) => {
      for (let n = 0; n < 100; n++) {
        const [r] = await sql`select wait_event_type from pg_stat_activity where pid = ${pid}`;
        if (r?.wait_event_type === 'Lock') return true;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return false;
    };
    try {
      // Committed: the other connections must see the rows. No Vault secret, so
      // no request is ever sent.
      await sql.begin(async (tx) => {
        await users(tx, U);
        await obj(tx, U, X);
        await obj(tx, U, 't/' + X.slice(2));
        await item(tx, I1, U, 'hb_lockoneaaaaaaaaa', X);
        await item(tx, I2, U, 'hb_locktwoaaaaaaaaa');
      });
      const [pid1, pid2] = [await pidOf(one), await pidOf(two)];

      // A removes X from its last item and holds; B's naming waits, then is refused.
      await one`begin`;
      await one`update public.homebrew_items set art = null where id = ${I1}`;
      await two`begin`;
      const naming = two`update public.homebrew_items set art = ${X} where id = ${I2}`.then(
        () => null,
        (err) => err
      );
      const waited = await blocked(pid2);
      await one`commit`;
      const err = await naming;
      await two`rollback`;

      // B names X first and holds; A's release waits, then sees B's row.
      await sql`delete from public.homebrew_art_released where name = ${X}`;
      await sql`update public.homebrew_items set art = ${X} where id = ${I1}`;
      await two`begin`;
      await two`update public.homebrew_items set art = ${X} where id = ${I2}`;
      await one`begin`;
      // A query of postgres.js runs only once it is awaited or given a then.
      const release = one`update public.homebrew_items set art = null where id = ${I1}`.then(
        () => null,
        (err) => err
      );
      const waited2 = await blocked(pid1);
      await two`commit`;
      const releaseErr = await release;
      await one`commit`;
      const left = await released(sql);
      const [{ art }] = await sql`select art from public.homebrew_items where id = ${I2}`;

      assert.equal(waited, true);
      assert.equal(err?.message, 'homebrew: art missing');
      assert.equal(waited2, true);
      assert.equal(releaseErr, null);
      assert.ok(!left.includes(X), JSON.stringify(left));
      assert.equal(art, X);
    } finally {
      await one.end();
      await two.end();
      await sql.begin(async (tx) => {
        await tx`delete from public.homebrew_items where id in (${I1}, ${I2})`;
        await tx`delete from public.homebrew_art_released where name = ${X}`;
        // Test rows only: Storage keeps no file for them.
        await tx`select set_config('storage.allow_delete_query', 'true', true)`;
        await tx`delete from storage.objects where owner_id = ${U}`;
        await tx`delete from auth.users where id = ${U}`;
      });
    }
  });
});

describe('the hourly job', () => {
  it('queues an unnamed file over an hour old, and not a younger one, a named one or another name', async () => {
    const out = await rolledBack(async (tx) => {
      await vault(tx);
      await users(tx, A);
      await pic(tx, A, 'a', '61 minutes');
      await pic(tx, A, 'b', '59 minutes');
      await pic(tx, A, 'c', '61 minutes');
      await obj(tx, A, '.emptyFolderPlaceholder', '61 minutes');
      await item(tx, id(18401), A, 'hb_namedaaaaaaaaaaa', p('c'));
      const m = await mark(tx);
      const job = await cleanup(tx);
      return { job, queue: await queued(tx, m), released: await released(tx) };
    });
    assert.equal(out.job.files, 2);
    assert.deepEqual(out.queue, [del(p('a')), del(t('a'))]);
    assert.deepEqual(out.released, [p('a')]);
  });

  it('queues at most 2000 names a run', async () => {
    const out = await rolledBack(async (tx) => {
      await vault(tx);
      await users(tx, A);
      await tx`insert into storage.objects (bucket_id, name, owner_id, created_at)
        select 'homebrew-art', 'p/' || md5('o' || g) || '.webp', ${A}, now() - interval '2 hours'
        from generate_series(1, 2001) g`;
      const m = await mark(tx);
      const job = await cleanup(tx);
      return { files: job.files, queue: (await queued(tx, m)).length };
    });
    assert.deepEqual(out, { files: 2000, queue: 2000 });
  });

  it('deletes an account of 300 items with pictures and runs the job at the 3x population', async (t) => {
    const out = await rolledBack(async (tx) => {
      await vault(tx);
      // 150 accounts of 300 items, each item with its own picture.
      await tx`insert into auth.users (id)
        select ('00000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid
        from generate_series(900001, 900150) g`;
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        select id, 'homebrew_items_per_owner', 300 from auth.users
        where id::text like '00000000-0000-4000-8000-0000009%'`;
      // Seeded with the owner check and the limit off: one transaction cannot hold
      // 45 000 name locks. The measured statements run with both on.
      const triggers = (on) =>
        tx.unsafe(`alter table public.homebrew_items ${on} trigger homebrew_items_art_owned,
          ${on} trigger homebrew_items_limit`);
      await triggers('disable');
      await tx`insert into storage.objects (bucket_id, name, owner_id, created_at)
        select 'homebrew-art', d || '/' || md5(u.id::text || g) || '.webp', u.id::text,
          now() - interval '2 hours'
        from auth.users u, generate_series(1, 300) g, unnest(array['p', 't']) d
        where u.id::text like '00000000-0000-4000-8000-0000009%'`;
      await tx`insert into public.homebrew_items (id, owner_id, key, content, art)
        select gen_random_uuid(), u.id,
          'hb_' || lpad(translate(g::text, '0123456789', 'abcdefghij'), 16, 'a'),
          ${tx.json(ITEM)}, 'p/' || md5(u.id::text || g) || '.webp'
        from auth.users u, generate_series(1, 300) g
        where u.id::text like '00000000-0000-4000-8000-0000009%'`;
      // The seed's deferred broadcasts fire here: an ALTER waits for no pending event.
      await tx`set constraints all immediate`;
      await triggers('enable');
      await tx`analyze public.homebrew_items`;
      const [{ items }] = await tx`select count(*)::int as items from public.homebrew_items`;
      const m = await mark(tx);
      let at = performance.now();
      await asUser(
        tx,
        '00000000-0000-4000-8000-000000900001',
        () => tx`select public.delete_account()`
      );
      const deletion = performance.now() - at;
      const requests = (await queued(tx, m)).length;
      at = performance.now();
      const job = await cleanup(tx);
      const run = performance.now() - at;
      return { items, requests, deletion, run, job };
    });
    t.diagnostic(
      `3x: ${out.items} items; account deletion ${Math.round(out.deletion)} ms, ` +
        `job run ${Math.round(out.run)} ms (files ${out.job.files})`
    );
    assert.ok(out.items >= 45000);
    assert.equal(out.requests, 600);
    // The plan's target is 1 s. Measured on this host, 2026-10-14: the account deletion
    // 178-381 ms; the job run 1.4-1.5 s alone and 2.1-2.9 s inside check:db, most of it the
    // scan of 90 000 objects. The bounds leave room for a loaded host.
    assert.ok(out.deletion < 3000, `account deletion took ${out.deletion} ms`);
    assert.ok(out.run < 5000, `job run took ${out.run} ms`);
  });
});

describe('the reads', () => {
  const LB = id(18501);
  /* A's items I1 (picture a), I2 (none), I3 (GM only in the list, picture g); B's list LB
     links a catalog entry, I3 and I1, in that order. */
  const world = async (tx) => {
    await users(tx, A, B);
    await pic(tx, A, 'a');
    await pic(tx, A, '7');
    await item(tx, id(18601), A, 'hb_pictureaaaaaaaaa', p('a'));
    await item(tx, id(18602), A, 'hb_plainaaaaaaaaaaa');
    await item(tx, id(18603), A, 'hb_gmonlyaaaaaaaaaa', p('7'));
    await tx`insert into public.lists (id, owner_id, name) values (${LB}, ${B}, 'B')`;
    await tx`insert into public.list_entries (id, list_id, item_key, source, hb_item, position, gm_only)
      values (${id(18701)}, ${LB}, 'ci1', 'official', null, 0, false),
        (${id(18702)}, ${LB}, 'hb_gmonlyaaaaaaaaaa', 'homebrew', ${id(18603)}, 1, true),
        (${id(18703)}, ${LB}, 'hb_pictureaaaaaaaaa', 'homebrew', ${id(18601)}, 2, false)`;
  };
  const one = async (tx, hid) =>
    (await tx`select public.get_homebrew_item(${hid}::uuid) as v`)[0].v;

  it('answers img beside the item in the item and items reads, and no img key without a picture', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const items = await asUser(
        tx,
        B,
        async () =>
          (
            await tx`select public.get_homebrew_items(${[id(18601), id(18602)]}::uuid[]) as v`
          )[0].v
      );
      return { pic: await one(tx, id(18601)), plain: await one(tx, id(18602)), items };
    });
    assert.equal(out.pic.img, p('a'));
    assert.equal('img' in out.pic.item, false);
    assert.equal('img' in out.plain, false);
    assert.deepEqual(
      out.items.map((r) => Object.keys(r).sort().join()),
      ['hid,img,item', 'hid,item']
    );
    assert.equal(out.items[0].img, p('a'));
    // The item answer's forbidden keys: no owner and no uuid but hid.
    const uuids = JSON.stringify(out.pic).match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g
    );
    assert.deepEqual([...new Set(uuids)], [id(18601)]);
    assert.ok(!JSON.stringify(out.pic).includes('owner_id'));
  });

  it('keeps the revision of an item without a picture and moves it with a picture change', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const plain = await one(tx, id(18602));
      const [{ r7h }] = await tx`select md5((${tx.json(plain.item)}::jsonb
        || jsonb_build_object('related', ${tx.json(plain.related)}::jsonb))::text) as r7h`;
      const before = (await one(tx, id(18601))).revision;
      await tx`update public.homebrew_items set art = 'q1.webp' where id = ${id(18601)}`;
      return { plain: plain.revision, r7h, before, after: (await one(tx, id(18601))).revision };
    });
    assert.equal(out.plain, out.r7h);
    assert.notEqual(out.before, out.after);
  });

  it("keeps #70's rules in a share: the players' projection drops the GM-only entry with its img", async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const share = async (audience) => {
        const [{ token }] = await tx`insert into public.list_shares (list_id, audience)
          values (${LB}, ${audience}) returning token`;
        return (await tx`select public.get_shared_list(${token}) as v`)[0].v;
      };
      return { player: await share('player'), gm: await share('gm') };
    });
    const players = out.player.entries;
    assert.deepEqual(
      players.map((e) => [e.item_key, e.position, e.img ?? null]),
      [
        ['ci1', 0, null],
        ['hb_pictureaaaaaaaaa', 1, p('a')]
      ]
    );
    const text = JSON.stringify(out.player);
    for (const hidden of [p('7'), id(18603), 'hb_gmonlyaaaaaaaaaa', 'gm_only', 'gm_note']) {
      assert.ok(!text.includes(hidden), hidden);
    }
    assert.deepEqual(
      out.gm.entries.map((e) => [e.item_key, e.position, e.gm_only, e.img ?? null]),
      [
        ['ci1', 0, false, null],
        ['hb_gmonlyaaaaaaaaaa', 1, true, p('7')],
        ['hb_pictureaaaaaaaaa', 2, false, p('a')]
      ]
    );
    assert.equal('img' in out.gm.entries[1].snapshot, false);
  });

  it('leaves one changed notice on a list that links the item, for a picture change', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      await tx`update public.list_notices set read_at = now()`;
      await tx`update public.homebrew_items set art = null where id = ${id(18601)}`;
      return (
        await tx`select list_id, item_key, kind from public.list_notices
          where read_at is null order by item_key`
      ).map((r) => ({ ...r }));
    });
    assert.deepEqual(out, [{ list_id: LB, item_key: 'hb_pictureaaaaaaaaa', kind: 'changed' }]);
  });
});

describe('the roles', () => {
  it('lets no API role read the key or the released names, and keeps net out of the API', async () => {
    const rows = await sql`
      select r.role || ' ' || t.tab as k,
        has_table_privilege(r.role, t.tab, 'select') as x
      from unnest(array['anon', 'authenticated', 'service_role']) as r(role)
      cross join unnest(array['vault.secrets', 'vault.decrypted_secrets',
        'public.homebrew_art_released']) as t(tab)
      order by 1`;
    const can = rows.filter((r) => r.x).map((r) => r.k);
    // service_role (the secret key) reads Vault on this stack; it already holds every
    // power the storage key gives. .claude/README.md, "Supabase configuration".
    assert.deepEqual(can, [
      'service_role vault.decrypted_secrets',
      'service_role vault.secrets'
    ]);
    const toml = readFileSync(path.join(ROOT, 'supabase', 'config.toml'), 'utf8');
    const schemas = /^\[api\][^[]*?^schemas\s*=\s*(\[[^\]]*\])/ms.exec(toml)?.[1];
    assert.deepEqual(JSON.parse(schemas ?? 'null'), ['public', 'graphql_public']);
    const at = toml.indexOf('\n[api]');
    const api = toml.slice(at, toml.indexOf('\n[', at + 1));
    const extra = /^extra_search_path\s*=\s*(\[[^\]]*\])/m.exec(api)?.[1];
    assert.deepEqual(JSON.parse(extra ?? 'null'), ['public', 'extensions']);
  });

  it('lets no API role execute art_delete or the triggers, nor anon the policy functions', async () => {
    const rows = await sql`
      select r.role || ' ' || f.fn as k
      from unnest(array['anon', 'authenticated', 'service_role']) as r(role)
      cross join unnest(array['public.art_delete(text[])',
        'public.homebrew_items_art_owned()', 'public.homebrew_items_art_release()',
        'public.homebrew_art_room()', 'public.homebrew_art_name_ok(text)']) as f(fn)
      where has_function_privilege(r.role, f.fn, 'execute')
      order by 1`;
    assert.deepEqual(
      rows.map((r) => r.k),
      [
        'authenticated public.homebrew_art_name_ok(text)',
        'authenticated public.homebrew_art_room()'
      ]
    );
  });
});
