/*
  Print sets (20261014120100_print_sets.sql): create_print_set and
  get_print_set for signed-in readers only; the shape of a sheet; one row for
  the same sheet of one account, a revived expired row included; the limit of
  print_sets_per_owner with its overrides, an expired set not counted; the
  answer's order, records, img and missing count with no forbidden key; the
  90-day lifetime after the last open, which an open moves at most once a day;
  no direct table access; the account's deletion; two connections ordered by
  the per-account lock; the clean-up at the 3x population. Every seed runs in
  a transaction that rolls back, but for the two-connection cases, which
  commit and delete their users. docs/specs/META.md, section 3;
  docs/decisions/2026-10-08-a-print-set-holds-references-and-lives-90.md.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect } from './roles.mjs';

const A = '00000000-0000-4000-8000-0000000000a9';
const B = '00000000-0000-4000-8000-0000000000b9';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const I1 = id(19001);
const I2 = id(19002);
const I3 = id(19003);
const ITEM = { kind: 'item', ru: 'Спальный мешок', en: 'Bedroll' };
const PIC = `p/${'a'.repeat(32)}.webp`;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;

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

/* The call inside a savepoint, so the transaction reads on after a refusal;
   answers the error, or null. */
const refused = (tx, fn) =>
  tx
    .savepoint((sp) => fn(sp))
    .then(
      () => null,
      (err) => err
    );

const users = (tx, ...ids) => tx`insert into auth.users (id) select unnest(${ids}::uuid[])`;
const item = (tx, iid, owner, key, content = ITEM, art = null) =>
  tx`insert into public.homebrew_items (id, owner_id, key, content, art)
    values (${iid}, ${owner}, ${key}, ${tx.json(content)}, ${art})`;
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
const make = async (tx, entries) =>
  (await tx`select public.create_print_set(${tx.json(entries)}::jsonb) as v`)[0].v;
const read = async (tx, sid) => (await tx`select public.get_print_set(${sid}::text) as v`)[0].v;
/* Seeds `n` sets of `owner` opened `ago`, each with its own digest. */
const seed = (tx, owner, n, ago = '0 seconds', tag = 's') =>
  tx`insert into public.print_sets (owner_id, entries, digest, opened_at)
    select ${owner}, '[{"k": "ci1"}]'::jsonb, md5(${tag} || g), now() - ${ago}::interval
    from generate_series(1, ${n}) g`;
const openedAt = async (tx, sid) =>
  (await tx`select opened_at from public.print_sets where id = ${sid}`)[0]?.opened_at;
const age = (tx, sid, ago) =>
  tx`update public.print_sets set opened_at = now() - ${ago}::interval where id = ${sid}`;

describe('the roles', () => {
  it('lets authenticated execute both functions and anon neither', async () => {
    const rows = await sql`
      select r.role || ' ' || f.fn as k
      from unnest(array['anon', 'authenticated']) as r(role)
      cross join unnest(array['public.create_print_set(jsonb)',
        'public.get_print_set(text)']) as f(fn)
      where has_function_privilege(r.role, f.fn, 'execute')
      order by 1`;
    assert.deepEqual(
      rows.map((r) => r.k),
      [
        'authenticated public.create_print_set(jsonb)',
        'authenticated public.get_print_set(text)'
      ]
    );
    for (const call of [(tx) => make(tx, [{ k: 'ci1' }]), (tx) => read(tx, 'AAAAAAAAAAAA')]) {
      await assert.rejects(asRole(sql, { role: 'anon' }, call), (err) => err.code === '42501');
    }
  });

  it('refuses a make with no user with 28000 and answers null to a read', async () => {
    const out = await asRole(sql, { role: 'authenticated' }, async (tx) => ({
      make: await refused(tx, (sp) => make(sp, [{ k: 'ci1' }])),
      read: await read(tx, 'AAAAAAAAAAAA')
    }));
    assert.equal(out.make?.code, '28000');
    assert.equal(out.make.message, 'create_print_set: not signed in');
    assert.equal(out.read, null);
  });

  it('lets no API role select, insert, update or delete print_sets', async () => {
    const rows = await sql`
      select r.role || ' ' || p.priv as k
      from unnest(array['anon', 'authenticated']) as r(role)
      cross join unnest(array['select', 'insert', 'update', 'delete']) as p(priv)
      where has_table_privilege(r.role, 'public.print_sets', p.priv)`;
    assert.deepEqual([...rows], []);
    const err = await asRole(
      sql,
      { role: 'authenticated', sub: A, setup: (tx) => users(tx, A) },
      (tx) => refused(tx, (sp) => sp`select count(*) from public.print_sets`)
    );
    assert.equal(err?.code, '42501');
  });
});

describe('the make', () => {
  const H = (n) => id(19100 + n);
  const bad = {
    'not an array': { k: 'ci1' },
    empty: [],
    '181 elements': Array.from({ length: 181 }, (_, n) => ({ h: H(n) })),
    'an unknown key': [{ k: 'ci1', x: 1 }],
    'both k and h': [{ k: 'ci1', h: H(1) }],
    'neither k nor h': [{ q: 2 }],
    'not an object': ['ci1'],
    'a k with hb_': [{ k: 'hb_emberaxeaaaaaaaa' }],
    'an uppercase k': [{ k: 'Ci1' }],
    'a k that is a number': [{ k: 1 }],
    'an uppercase uuid': [{ h: 'ABCDEF00-0000-4000-8000-000000000001' }],
    'q 1': [{ k: 'ci1', q: 1 }],
    'q 100': [{ k: 'ci1', q: 100 }],
    'q "3"': [{ k: 'ci1', q: '3' }],
    'q 2.5': [{ k: 'ci1', q: 2.5 }],
    'a repeated k': [{ k: 'ci1' }, { k: 'ci1', q: 2 }],
    'a repeated h': [{ h: H(1) }, { h: H(1), q: 3 }],
    'more than 16384 bytes': [{ k: 'x'.repeat(16400) }]
  };

  it('refuses each malformed sheet with 22023', async () => {
    const out = await asRole(
      sql,
      { role: 'authenticated', sub: A, setup: (tx) => users(tx, A) },
      async (tx) => {
        const errs = {};
        for (const [name, entries] of Object.entries(bad)) {
          errs[name] = await refused(tx, (sp) => make(sp, entries));
        }
        return errs;
      }
    );
    for (const [name, err] of Object.entries(out)) {
      assert.equal(err?.code, '22023', name);
      assert.equal(err.message, 'print set: bad entries', name);
    }
  });

  it('answers an id, the same id for the same sheet, and a new id for another order', async () => {
    const sheet = [{ k: 'ci1', q: 3 }, { h: I1 }];
    const out = await rolledBack(async (tx) => {
      await users(tx, A);
      return asUser(tx, A, async () => {
        const first = await make(tx, sheet);
        await tx.unsafe('reset role');
        await age(tx, first, '10 days');
        const before = await openedAt(tx, first);
        await tx.unsafe('set local role authenticated');
        // The same entries with their keys in another order: jsonb sorts them.
        const again = await make(tx, [{ q: 3, k: 'ci1' }, { h: I1 }]);
        const other = await make(tx, [...sheet].reverse());
        await tx.unsafe('reset role');
        const after = await openedAt(tx, first);
        const [{ n }] = await tx`select count(*)::int as n from public.print_sets
          where owner_id = ${A}`;
        return { first, again, other, moved: after > before, n };
      });
    });
    assert.match(out.first, /^[A-Za-z0-9_-]{12}$/);
    assert.equal(out.again, out.first);
    assert.notEqual(out.other, out.first);
    assert.equal(out.moved, true);
    assert.equal(out.n, 2);
  });

  it('takes 180 entries of h with q 99', async () => {
    const sheet = Array.from({ length: 180 }, (_, n) => ({ h: H(n), q: 99 }));
    const out = await asRole(
      sql,
      { role: 'authenticated', sub: A, setup: (tx) => users(tx, A) },
      (tx) => make(tx, sheet)
    );
    assert.match(out, /^[A-Za-z0-9_-]{12}$/);
  });

  it('revives a matching row 91 days after its last open, and the read then answers it', async () => {
    const out = await rolledBack(async (tx) => {
      await users(tx, A, B);
      const first = await asUser(tx, A, () => make(tx, [{ k: 'ci2' }]));
      await age(tx, first, '91 days');
      const gone = await asUser(tx, B, () => read(tx, first));
      const again = await asUser(tx, A, () => make(tx, [{ k: 'ci2' }]));
      return { first, gone, again, set: await asUser(tx, B, () => read(tx, first)) };
    });
    assert.equal(out.gone, null);
    assert.equal(out.again, out.first);
    assert.deepEqual(out.set, { entries: [{ k: 'ci2' }], missing: 0 });
  });
});

describe('the limit', () => {
  const attempt = (setup) =>
    asRole(sql, { role: 'authenticated', sub: A, setup }, (tx) =>
      refused(tx, (sp) => make(sp, [{ k: 'ci9' }]))
    );

  it('refuses the make past 1000 live sets with the limit and its detail', async () => {
    const err = await attempt(async (tx) => {
      await users(tx, A);
      await seed(tx, A, 1000);
    });
    assert.equal(err?.code, 'P0001');
    assert.equal(err.message, 'limit: print_sets_per_owner');
    assert.equal(err.detail, '1000');
  });

  it('does not count an expired set, and takes the 1001st under an override of 3000 or null', async () => {
    const expired = await attempt(async (tx) => {
      await users(tx, A);
      await seed(tx, A, 999);
      await seed(tx, A, 1, '90 days 1 minute', 'x');
    });
    assert.equal(expired, null);
    for (const value of [3000, null]) {
      const err = await attempt(async (tx) => {
        await users(tx, A);
        await seed(tx, A, 1000);
        await tx`insert into public.user_limit_overrides (user_id, key, value)
          values (${A}, 'print_sets_per_owner', ${value})`;
      });
      assert.equal(err, null, String(value));
    }
  });
});

describe('the read', () => {
  /* A's items: I1 with a picture, I2 plain, I3 deleted after the make. */
  const world = async (tx) => {
    // No valid content holds a null today. The check goes inside the rolled-back
    // transaction (before any write: the ALTER waits for no pending trigger
    // event), so the null field proves that the answer is not stripped.
    await tx`alter table public.homebrew_items drop constraint homebrew_items_content_check`;
    await users(tx, A, B);
    await tx`insert into storage.objects (bucket_id, name, owner_id) values
      ('homebrew-art', ${PIC}, ${A}), ('homebrew-art', ${'t/' + PIC.slice(2)}, ${A})`;
    await item(tx, I1, A, 'hb_pictureaaaaaaaaa', ITEM, PIC);
    await item(tx, I2, A, 'hb_plainaaaaaaaaaaa', { kind: 'item', ru: 'Верёвка', tier: null });
    await item(tx, I3, A, 'hb_goneaaaaaaaaaaaa');
  };
  const SHEET = [{ h: I2 }, { k: 'ci1', q: 4 }, { h: I3, q: 2 }, { h: I1, q: 5 }, { k: 'ci2' }];

  it('answers the entries in order with their records, img and q, and counts a deleted item', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const sid = await asUser(tx, A, () => make(tx, SHEET));
      await tx`delete from public.homebrew_items where id = ${I3}`;
      const one = async (hid) =>
        (await tx`select public.get_homebrew_item(${hid}::uuid) as v`)[0].v.item;
      return {
        set: await asUser(tx, B, () => read(tx, sid)),
        i1: await one(I1),
        i2: await one(I2)
      };
    });
    assert.deepEqual(out.set, {
      entries: [
        { hid: I2, item: out.i2 },
        { k: 'ci1', q: 4 },
        { hid: I1, item: out.i1, img: PIC, q: 5 },
        { k: 'ci2' }
      ],
      missing: 1
    });
    // A null field of the record stays: the answer is not stripped.
    assert.equal(out.set.entries[0].item.tier, null);
    const text = JSON.stringify(out.set);
    for (const key of ['owner_id', 'digest', 'created_at', 'opened_at']) {
      assert.ok(!text.includes(key), key);
    }
    assert.deepEqual([...new Set(text.match(UUID))].sort(), [I1, I2].sort());
  });

  it("answers 180 h entries of A's items to B, none missing", async (t) => {
    const hids = Array.from({ length: 180 }, (_, n) => id(19100 + n));
    const out = await rolledBack(async (tx) => {
      await users(tx, A, B);
      // 180 items is past the default item limit of 100.
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${A}, 'homebrew_items_per_owner', null)`;
      await tx`insert into public.homebrew_items (id, owner_id, key, content)
        select ('00000000-0000-4000-8000-' || lpad((19100 + g)::text, 12, '0'))::uuid, ${A},
          'hb_readcaseaaaaaa' || chr(97 + g / 26) || chr(97 + g % 26), ${tx.json(ITEM)}
        from generate_series(0, 179) g`;
      const sid = await asUser(tx, A, () =>
        make(
          tx,
          hids.map((h) => ({ h }))
        )
      );
      const at = performance.now();
      const set = await asUser(tx, B, () => read(tx, sid));
      return { set, run: performance.now() - at };
    });
    t.diagnostic(`180 h entries, read ${Math.round(out.run)} ms`);
    assert.equal(out.set.entries.length, 180);
    assert.equal(out.set.missing, 0);
    assert.deepEqual(
      out.set.entries.map((e) => e.hid),
      hids
    );
  });

  it('answers null for null, a malformed, an unknown and an expired id', async () => {
    const out = await rolledBack(async (tx) => {
      await users(tx, A, B);
      const sid = await asUser(tx, A, () => make(tx, [{ k: 'ci1' }]));
      await age(tx, sid, '91 days');
      return asUser(tx, B, async () => ({
        null: await read(tx, null),
        short: await read(tx, 'AAAAAAAAAAA'),
        bad: await read(tx, 'AAAAAAAAAAA!'),
        unknown: await read(tx, 'AAAAAAAAAAAA'),
        expired: await read(tx, sid)
      }));
    });
    assert.deepEqual(out, { null: null, short: null, bad: null, unknown: null, expired: null });
  });

  it('lives 90 days after the last open', async () => {
    const out = await rolledBack(async (tx) => {
      await users(tx, A, B);
      const sid = await asUser(tx, A, () => make(tx, [{ k: 'ci1' }]));
      await age(tx, sid, '89 days 23 hours');
      const kept = await asUser(tx, B, () => read(tx, sid));
      await age(tx, sid, '90 days 1 minute');
      return { kept, gone: await asUser(tx, B, () => read(tx, sid)) };
    });
    assert.deepEqual(out.kept, { entries: [{ k: 'ci1' }], missing: 0 });
    assert.equal(out.gone, null);
  });

  it('moves opened_at on a read at most once a day', async () => {
    const out = await rolledBack(async (tx) => {
      await users(tx, A, B);
      const sid = await asUser(tx, A, () => make(tx, [{ k: 'ci1' }]));
      await age(tx, sid, '2 days');
      await asUser(tx, B, () => read(tx, sid));
      const [{ moved }] = await tx`select opened_at > now() - interval '1 minute' as moved
        from public.print_sets where id = ${sid}`;
      await age(tx, sid, '1 hour');
      const before = await openedAt(tx, sid);
      await asUser(tx, B, () => read(tx, sid));
      return { moved, kept: (await openedAt(tx, sid)).getTime() === before.getTime() };
    });
    assert.deepEqual(out, { moved: true, kept: true });
  });

  it("deletes an account's sets with the account", async () => {
    const out = await rolledBack(async (tx) => {
      await users(tx, A);
      await asUser(tx, A, () => make(tx, [{ k: 'ci1' }]));
      await asUser(tx, A, () => tx`select public.delete_account()`);
      const [{ n }] = await tx`select count(*)::int as n from public.print_sets
        where owner_id = ${A}`;
      return n;
    });
    assert.equal(out, 0);
  });
});

describe('two connections', () => {
  const U = '00000000-0000-4000-8000-0000000019a1';
  /* Opens a transaction on `c` as the user U. */
  const begin = async (c) => {
    await c`begin`;
    await c.unsafe('set local role authenticated');
    await c`select set_config('request.jwt.claims', ${JSON.stringify({ role: 'authenticated', sub: U })}, true)`;
  };
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
  /* Runs the two makes: `one` first and holding, `two` waiting on the lock. */
  const race = async (sheetOne, sheetTwo, live) => {
    const one = connect();
    const two = connect();
    try {
      await sql`insert into auth.users (id) values (${U})`;
      if (live) await seed(sql, U, live);
      const pid2 = await pidOf(two);
      await begin(one);
      const first = await make(one, sheetOne).then(
        (v) => v,
        (err) => err
      );
      await begin(two);
      const pending = make(two, sheetTwo).then(
        (v) => v,
        (err) => err
      );
      const waited = await blocked(pid2);
      await one`commit`;
      const second = await pending;
      await two`commit`.catch(() => two`rollback`);
      const [{ n }] = await sql`select count(*)::int as n from public.print_sets
        where owner_id = ${U}`;
      return { first, second, waited, n: n - live };
    } finally {
      await one.end();
      await two.end();
      // The cascade deletes the user's sets.
      await sql`delete from auth.users where id = ${U}`;
    }
  };

  it('makes one row for the same sheet made at once', async () => {
    const out = await race([{ k: 'ci1' }], [{ k: 'ci1' }], 0);
    assert.equal(out.waited, true);
    assert.match(out.first, /^[A-Za-z0-9_-]{12}$/);
    assert.equal(out.second, out.first);
    assert.equal(out.n, 1);
  });

  it('answers one id and one limit refusal for two sheets at 999 live sets', async () => {
    const out = await race([{ k: 'ci1' }], [{ k: 'ci2' }], 999);
    assert.equal(out.waited, true);
    assert.match(out.first, /^[A-Za-z0-9_-]{12}$/);
    assert.equal(out.second?.code, 'P0001');
    assert.equal(out.second.message, 'limit: print_sets_per_owner');
    assert.equal(out.n, 1);
  });
});

describe('the clean-up', () => {
  it('deletes 3000 expired sets of one account in one run and keeps a live one', async (t) => {
    const out = await rolledBack(async (tx) => {
      await users(tx, A);
      await seed(tx, A, 3000, '90 days 1 minute');
      await seed(tx, A, 1, '89 days', 'live');
      const at = performance.now();
      const [{ v }] = await tx`select public.lifecycle_cleanup() as v`;
      const run = performance.now() - at;
      const [{ n }] = await tx`select count(*)::int as n from public.print_sets
        where owner_id = ${A}`;
      return { deleted: v.print_sets, left: n, run };
    });
    t.diagnostic(`3x: 3000 expired sets, job run ${Math.round(out.run)} ms`);
    assert.ok(out.deleted >= 3000, String(out.deleted));
    assert.equal(out.left, 1);
  });
});
