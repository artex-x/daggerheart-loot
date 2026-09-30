/*
  The count limits: limit_defaults holds every key, an override raises or
  lowers one user's limit (null: no limit), effective_limit() refuses an
  unknown key, no Data API caller reads the tables or runs the function,
  and limits:set's database half performs its four modes.
  docs/DECISIONS.md, 2026-09-25, "Count limits are rows read by
  `effective_limit()`".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect } from './roles.mjs';
import { setLimit } from '../../tools/supabase/limits.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const A_EMAIL = 'limits-a@example.test';
const PRIVS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const userA = (tx) => tx`insert into auth.users (id, email) values (${A}, ${A_EMAIL})`;
const override =
  (value, key = 'lists_per_owner') =>
  async (tx) => {
    await userA(tx);
    await tx`insert into public.user_limit_overrides (user_id, key, value)
    values (${A}, ${key}, ${value})`;
  };
/* Inserts `n` lists for A as A, returning the count A then holds. */
const makeLists = (n) => async (tx) => {
  await tx`insert into public.lists (id, owner_id)
    select gen_random_uuid(), ${A} from generate_series(1, ${n}::int)`;
  const [r] = await tx`select count(*)::int as n from public.lists`;
  return r.n;
};
const asA = (setup, fn) => asRole(sql, { role: 'authenticated', sub: A, setup }, fn);
const limitError = (detail) => (err) => {
  assert.equal(err.message, 'limit: lists_per_owner');
  assert.equal(err.detail, detail);
  return true;
};

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

describe('limit tables', () => {
  it('hold the four defaults', async () => {
    const rows = await sql`select key, value from public.limit_defaults order by key`;
    assert.deepEqual(
      rows.map((r) => `${r.key}=${r.value}`),
      [
        'entries_per_list=100',
        'lists_per_owner=50',
        'pending_requests_per_list=10',
        'request_lines=100'
      ]
    );
  });

  for (const table of ['public.limit_defaults', 'public.user_limit_overrides']) {
    it(`grant ${table} to neither anon nor authenticated, with row level security on`, async () => {
      const rows = await sql`
        select r.role, p.priv
        from unnest(array['anon', 'authenticated']) as r(role)
        cross join unnest(${PRIVS}::text[]) as p(priv)
        where has_table_privilege(r.role, ${table}::regclass, p.priv)`;
      assert.deepEqual([...rows], []);
      const [r] = await sql`select relrowsecurity from pg_class where oid = ${table}::regclass`;
      assert.equal(r.relrowsecurity, true);
    });
  }

  it('refuse authenticated a read', async () => {
    await assert.rejects(
      asA(userA, (tx) => tx`select key from public.limit_defaults`),
      /permission denied/
    );
  });
});

describe('effective_limit()', () => {
  it('runs as its owner, and no Data API role may execute it', async () => {
    const [r] = await sql`
      select p.prosecdef,
        has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
        has_function_privilege('service_role', p.oid, 'EXECUTE') as service
      from pg_proc p where p.oid = 'public.effective_limit(uuid, text)'::regprocedure`;
    assert.deepEqual(r, { prosecdef: true, anon: false, authed: false, service: false });
    await assert.rejects(
      asA(userA, (tx) => tx`select public.effective_limit(${A}, 'lists_per_owner')`),
      /permission denied/
    );
  });

  it('refuses an unknown key and names it', async () => {
    await assert.rejects(sql`select public.effective_limit(${A}, 'list_per_owner')`, (err) => {
      assert.equal(err.code, '22023');
      assert.match(err.message, /unknown limit key list_per_owner/);
      return true;
    });
  });

  it('reads the default, an override, and null from an override', async () => {
    const read = (tx) => tx`select public.effective_limit(${A}, 'lists_per_owner') as v`;
    const out = await rolledBack(async (tx) => {
      await userA(tx);
      const [plain] = await read(tx);
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${A}, 'lists_per_owner', 200)`;
      const [raised] = await read(tx);
      await tx`update public.user_limit_overrides set value = null where user_id = ${A}`;
      const [none] = await read(tx);
      await tx`delete from public.user_limit_overrides where user_id = ${A}`;
      const [back] = await read(tx);
      return [plain.v, raised.v, none.v, back.v];
    });
    assert.deepEqual(out, [50, 200, null, 50]);
  });
});

describe('an override in the limit trigger', () => {
  it('raises the limit: a 51st list passes under 200', async () => {
    assert.equal(await asA(override(200), makeLists(51)), 51);
  });

  it('lowers the limit: a third list fails under 2', async () => {
    await assert.rejects(asA(override(2), makeLists(3)), limitError('2'));
  });

  it('lifts the limit when null: a 51st list passes', async () => {
    assert.equal(await asA(override(null), makeLists(51)), 51);
  });

  it('raises the entry limit: a 101st entry passes under 200', async () => {
    const entries = async (tx) => {
      const [l] = await tx`insert into public.lists (id, owner_id)
        values (gen_random_uuid(), ${A}) returning id`;
      await tx`insert into public.list_entries (id, list_id, item_key, position, quantity)
        select gen_random_uuid(), ${l.id}, 'k' || n, n, 1 from generate_series(0, 100) as n`;
      const [r] = await tx`select count(*)::int as n from public.list_entries`;
      return r.n;
    };
    assert.equal(await asA(override(200, 'entries_per_list'), entries), 101);
  });

  const entryLimitError = (detail) => (err) => {
    assert.equal(err.code, 'P0001', err.message);
    assert.equal(err.message, 'limit: entries_per_list');
    assert.equal(err.detail, detail);
    return true;
  };
  /* Makes a list of A's with `n` entries keyed `<prefix><i>`, returning its id. */
  const listOf = async (tx, n, prefix) => {
    const [l] = await tx`insert into public.lists (id, owner_id)
      values (gen_random_uuid(), ${A}) returning id`;
    await tx`insert into public.list_entries (id, list_id, item_key, position)
      select gen_random_uuid(), ${l.id}, ${prefix} || i, i from generate_series(1, ${n}::int) as i`;
    return l.id;
  };

  it('refuses one insert statement that takes a list past its entry limit, with the limit as detail', async () => {
    await assert.rejects(
      asA(userA, (tx) => listOf(tx, 101, 'k')),
      entryLimitError('100')
    );
  });

  it('refuses one update statement that moves two entries into a list of 99', async () => {
    await assert.rejects(
      asA(userA, async (tx) => {
        const full = await listOf(tx, 99, 'k');
        const other = await listOf(tx, 2, 'm');
        await tx`update public.list_entries set list_id = ${full} where list_id = ${other}`;
      }),
      entryLimitError('100')
    );
  });

  it('lets a note edit through on a list above a lowered entry limit', async () => {
    const setup = async (tx) => {
      await userA(tx);
      await listOf(tx, 5, 'k');
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${A}, 'entries_per_list', 2)`;
    };
    const notes = await asA(setup, async (tx) => {
      await tx`update public.list_entries set player_note = 'n' where item_key = 'k1'`;
      return (await tx`select player_note from public.list_entries where item_key = 'k1'`).map(
        (r) => r.player_note
      );
    });
    assert.deepEqual(notes, ['n']);
  });

  it('reads the default again once deleted', async () => {
    const setup = async (tx) => {
      await override(200)(tx);
      await tx`delete from public.user_limit_overrides where user_id = ${A}`;
    };
    await assert.rejects(asA(setup, makeLists(51)), limitError('50'));
  });
});

describe("limits:set's database half", () => {
  it('sets a value, unlimited, and the default again, by email or id', async () => {
    const out = await rolledBack(async (tx) => {
      await userA(tx);
      const key = 'lists_per_owner';
      return [
        await setLimit(tx, { user: A_EMAIL.toUpperCase(), key, mode: 'value', value: 200 }),
        await setLimit(tx, { user: A, key, mode: 'unlimited', value: null }),
        await setLimit(tx, { user: A, key, mode: 'default', value: null }),
        await setLimit(tx, { user: A, key, mode: 'value', value: 0 })
      ];
    });
    assert.deepEqual(out, [
      { userId: A, before: 'default 50', after: '200' },
      { userId: A, before: '200', after: 'unlimited' },
      { userId: A, before: 'unlimited', after: 'default 50' },
      { userId: A, before: 'default 50', after: '0' }
    ]);
  });

  it('refuses an unknown key or user, and writes nothing', async () => {
    const rows = await rolledBack(async (tx) => {
      await userA(tx);
      await assert.rejects(
        setLimit(tx, { user: A, key: 'nope', mode: 'value', value: 1 }),
        /"nope" is not in limit_defaults/
      );
      await assert.rejects(
        setLimit(tx, { user: 'nobody@example.test', key: 'lists_per_owner', mode: 'default' }),
        /0 users match/
      );
      return [...(await tx`select * from public.user_limit_overrides`)];
    });
    assert.deepEqual(rows, []);
  });
});
