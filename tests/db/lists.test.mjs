/*
  lists and list_entries: a signed-in owner's cloud lists. The owner reads
  and writes only its own lists and their entries; anon and a caller with
  no user id get nothing; every update and every entry change bumps the
  list's revision and updated_at; the checks bound each field; the limits
  refuse the 51st list and the 101st entry; reorder_list() rewrites the
  order of one list; the rows go with their user. docs/specs/FEATURES.md,
  "Lists".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect } from './roles.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const LA = id(1001);
const LB = id(2001);
const E1 = id(1101);
const E2 = id(1102);
const E3 = id(1103);
const EB = id(2101);
const PRIVS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const users = (tx) => tx`insert into auth.users (id) values (${A}), (${B})`;
/* A's list LA with the entries E1-E3 at positions 0-2, B's list LB with EB. */
const world = async (tx) => {
  await users(tx);
  await tx`insert into public.lists (id, owner_id, name) values (${LA}, ${A}, 'A'), (${LB}, ${B}, 'B')`;
  await tx`insert into public.list_entries (id, list_id, item_key, position) values
    (${E1}, ${LA}, 'ci1', 0), (${E2}, ${LA}, 'q1', 1), (${E3}, ${LA}, 'cc1', 2),
    (${EB}, ${LB}, 'ci1', 0)`;
};
const asA = (setup, fn) => asRole(sql, { role: 'authenticated', sub: A, setup }, fn);
const ids = (rows) => rows.map((r) => r.id);
const byCode = (code, text) => (err) => {
  assert.equal(err.code, code, err.message);
  if (text) assert.match(err.message, text);
  return true;
};

async function tablePrivileges(role, table) {
  const rows = await sql`
    select p.priv from unnest(${PRIVS}::text[]) as p(priv)
    where has_table_privilege(${role}, ${table}::regclass, p.priv)
    order by p.priv`;
  return rows.map((r) => r.priv);
}

describe('lists grants', () => {
  for (const table of ['public.lists', 'public.list_entries']) {
    it(`grants ${table} to authenticated in full, to anon nothing`, async () => {
      assert.deepEqual(await tablePrivileges('authenticated', table), [
        'DELETE',
        'INSERT',
        'SELECT',
        'UPDATE'
      ]);
      assert.deepEqual(await tablePrivileges('anon', table), []);
    });

    /* SELECT and DELETE are the grant migration's (the E2E admin client);
       TRUNCATE, REFERENCES and TRIGGER come from the default privileges. */
    it(`grants ${table} to service_role select and delete, never insert or update`, async () => {
      assert.deepEqual(await tablePrivileges('service_role', table), [
        'DELETE',
        'REFERENCES',
        'SELECT',
        'TRIGGER',
        'TRUNCATE'
      ]);
    });

    it(`has row level security on ${table}`, async () => {
      const [r] = await sql`select relrowsecurity from pg_class where oid = ${table}::regclass`;
      assert.equal(r.relrowsecurity, true);
    });
  }

  it('lets only authenticated execute reorder_list()', async () => {
    const [r] = await sql`
      select
        has_function_privilege('anon', 'public.reorder_list(uuid, uuid[])', 'EXECUTE') as anon,
        has_function_privilege('authenticated', 'public.reorder_list(uuid, uuid[])', 'EXECUTE') as authed,
        has_function_privilege('service_role', 'public.reorder_list(uuid, uuid[])', 'EXECUTE') as service`;
    assert.deepEqual(r, { anon: false, authed: true, service: false });
  });

  it('lets no caller execute a trigger function', async () => {
    const rows = await sql`
      select p.proname, r.role
      from pg_proc p
      cross join unnest(array['anon', 'authenticated', 'service_role']) as r(role)
      where p.pronamespace = 'public'::regnamespace
        and p.proname in ('lists_before_update', 'list_entries_touch', 'lists_limit',
          'list_entries_limit')
        and has_function_privilege(r.role, p.oid, 'EXECUTE')`;
    assert.deepEqual([...rows], []);
  });
});

describe('lists rows, as user A', () => {
  it('inserts, reads, updates and deletes its own list and entries', async () => {
    const out = await asA(users, async (tx) => {
      await tx`insert into public.lists (id, owner_id, name) values (${LA}, ${A}, 'Mine')`;
      await tx`insert into public.list_entries (id, list_id, item_key, position)
        values (${E1}, ${LA}, 'ci1', 0)`;
      await tx`update public.lists set name = 'Renamed' where id = ${LA}`;
      await tx`update public.list_entries set quantity = 3 where id = ${E1}`;
      const [list] = await tx`select name from public.lists where id = ${LA}`;
      const [entry] = await tx`select quantity from public.list_entries where id = ${E1}`;
      await tx`delete from public.list_entries where id = ${E1}`;
      const entries = ids(await tx`select id from public.list_entries`);
      await tx`delete from public.lists where id = ${LA}`;
      const lists = ids(await tx`select id from public.lists`);
      return { name: list.name, quantity: entry.quantity, entries, lists };
    });
    assert.deepEqual(out, { name: 'Renamed', quantity: 3, entries: [], lists: [] });
  });

  it("sees its own lists and entries and none of B's", async () => {
    const out = await asA(world, async (tx) => ({
      lists: ids(await tx`select id from public.lists order by id`),
      entries: ids(await tx`select id from public.list_entries order by id`)
    }));
    assert.deepEqual(out, { lists: [LA], entries: [E1, E2, E3] });
  });

  it("touches nothing when it updates or deletes B's list or entries", async () => {
    const out = await asA(world, async (tx) => [
      ...(await tx`update public.lists set name = 'x' where id = ${LB} returning id`),
      ...(await tx`delete from public.lists where id = ${LB} returning id`),
      ...(await tx`update public.list_entries set quantity = 2 where id = ${EB} returning id`),
      ...(await tx`delete from public.list_entries where id = ${EB} returning id`)
    ]);
    assert.deepEqual(out, []);
  });

  it("may not insert a list naming B, nor an entry into B's list", async () => {
    await assert.rejects(
      asA(users, (tx) => tx`insert into public.lists (id, owner_id) values (${LA}, ${B})`),
      /row-level security/
    );
    await assert.rejects(
      asA(
        world,
        (tx) => tx`insert into public.list_entries (id, list_id, item_key, position)
          values (${id(1199)}, ${LB}, 'q1', 1)`
      ),
      /row-level security/
    );
  });

  it("may not move its entry into B's list", async () => {
    await assert.rejects(
      asA(world, (tx) => tx`update public.list_entries set list_id = ${LB} where id = ${E2}`),
      /row-level security/
    );
  });
});

describe('lists rows, with no user', () => {
  it('reads nothing and inserts nothing as authenticated with no user id', async () => {
    const rows = await asRole(sql, { role: 'authenticated', setup: world }, async (tx) => [
      ...(await tx`select id from public.lists`),
      ...(await tx`select id from public.list_entries`)
    ]);
    assert.deepEqual(rows, []);
    await assert.rejects(
      asRole(
        sql,
        { role: 'authenticated', setup: users },
        (tx) => tx`insert into public.lists (id, owner_id) values (${LA}, ${A})`
      ),
      /row-level security/
    );
  });

  it('refuses anon a read of either table', async () => {
    for (const table of ['lists', 'list_entries']) {
      await assert.rejects(
        asRole(sql, { role: 'anon', setup: world }, (tx) =>
          tx.unsafe(`select id from public.${table}`)
        ),
        /permission denied/
      );
    }
  });
});

describe('lists revision and updated_at', () => {
  /* now() is the transaction's start: an old updated_at shows the update
     wrote it. */
  const oldList = async (tx) => {
    await world(tx);
    await tx`delete from public.lists where id = ${LA}`;
    await tx`insert into public.lists (id, owner_id, created_at, updated_at)
      values (${LA}, ${A}, '2000-01-01', '2000-01-01')`;
  };
  const state = async (tx) => {
    const [r] = await tx`
      select revision::int as revision, updated_at = now() as fresh
      from public.lists where id = ${LA}`;
    return r;
  };

  it('bumps by one on every update, whatever revision the update sets', async () => {
    const out = await asA(oldList, async (tx) => {
      const start = await state(tx);
      await tx`update public.lists set name = 'Renamed' where id = ${LA}`;
      const renamed = await state(tx);
      await tx`update public.lists set revision = 0 where id = ${LA}`;
      const lowered = await state(tx);
      await tx`update public.lists set revision = 9223372036854775807 where id = ${LA}`;
      const raised = await state(tx);
      return { start, renamed, lowered, raised };
    });
    assert.equal(out.start.fresh, false);
    assert.equal(out.renamed.revision, out.start.revision + 1);
    assert.equal(out.renamed.fresh, true);
    assert.equal(out.lowered.revision, out.renamed.revision + 1);
    assert.equal(out.raised.revision, out.lowered.revision + 1);
  });

  it('keeps id, owner_id and created_at, whatever an update sets', async () => {
    const after = await asA(oldList, async (tx) => {
      await tx`update public.lists
        set id = ${id(1002)}, owner_id = ${B}, created_at = now() where id = ${LA}`;
      return [...(await tx`select id, owner_id, created_at from public.lists`)];
    });
    assert.deepEqual(after, [
      { id: LA, owner_id: A, created_at: new Date('2000-01-01T00:00:00Z') }
    ]);
  });

  it('bumps the list on an entry insert, update and delete', async () => {
    const revisions = await asA(world, async (tx) => {
      const rev = async () => (await state(tx)).revision;
      const seen = [await rev()];
      await tx`insert into public.list_entries (id, list_id, item_key, position)
        values (${id(1104)}, ${LA}, 'q313', 3)`;
      seen.push(await rev());
      await tx`update public.list_entries set player_note = 'n' where id = ${E1}`;
      seen.push(await rev());
      await tx`delete from public.list_entries where id = ${E2}`;
      seen.push(await rev());
      return seen;
    });
    for (let i = 1; i < revisions.length; i++) assert.equal(revisions[i], revisions[i - 1] + 1);
  });
});

describe('list_entries checks', () => {
  const insertEntry = (fields) =>
    asA(world, (tx) => {
      const row = { id: id(1150), list_id: LA, item_key: 'q23', position: 5, ...fields };
      if (row.snapshot) row.snapshot = tx.json(row.snapshot);
      return tx`insert into public.list_entries ${tx(row)}`;
    });

  for (const [what, fields, pattern] of [
    ['quantity 0', { quantity: 0 }, /quantity/],
    ['quantity 100', { quantity: 100 }, /quantity/],
    ['price 0', { price_coins: 0 }, /price_coins/],
    ['price 100000', { price_coins: 100000 }, /price_coins/],
    ['a bad item_key', { item_key: 'no spaces' }, /item_key/],
    ['a negative position', { position: -1 }, /position/],
    ['a snapshot on an official entry', { snapshot: { n: 1 } }, /check/],
    ['no snapshot on a homebrew entry', { source: 'homebrew' }, /check/],
    ['a duplicate item_key in one list', { item_key: 'ci1' }, /duplicate key/],
    [
      'a homebrew snapshot over 16384 bytes',
      { source: 'homebrew', snapshot: { text: 'x'.repeat(16400) } },
      /list_entries_snapshot_size/
    ]
  ]) {
    it(`refuses ${what}`, async () => {
      await assert.rejects(insertEntry(fields), pattern);
    });
  }

  it('accepts the bounds: quantity 1 and 99, price 1 and 99999, a homebrew snapshot', async () => {
    const n = await asA(world, async (tx) => {
      await tx`insert into public.list_entries
        (id, list_id, item_key, position, quantity, price_coins) values
        (${id(1151)}, ${LA}, 'q23', 3, 1, 1), (${id(1152)}, ${LA}, 'w51', 4, 99, 99999)`;
      await tx`insert into public.list_entries (id, list_id, item_key, source, snapshot, position)
        values (${id(1153)}, ${LA}, 'hb1', 'homebrew', ${tx.json({ name: 'x' })}, 5)`;
      const [r] =
        await tx`select count(*)::int as n from public.list_entries where list_id = ${LA}`;
      return r.n;
    });
    assert.equal(n, 6);
  });
});

describe('lists limits', () => {
  const limitError = (key, detail) => (err) => {
    assert.equal(err.code, 'P0001', err.message);
    assert.equal(err.message, `limit: ${key}`);
    assert.equal(err.detail, detail);
    return true;
  };
  const fiftyLists = async (tx) => {
    await users(tx);
    await tx`insert into public.lists (id, owner_id)
      select gen_random_uuid(), ${A} from generate_series(1, 50)`;
  };
  const hundredEntries = async (tx) => {
    await world(tx);
    await tx`delete from public.list_entries where list_id = ${LA}`;
    await tx`insert into public.list_entries (id, list_id, item_key, position)
      select gen_random_uuid(), ${LA}, 'k' || n, n from generate_series(1, 100) as g(n)`;
  };

  it('refuses the 51st list with the limit and its value', async () => {
    await assert.rejects(
      asA(fiftyLists, (tx) => tx`insert into public.lists (id, owner_id) values (${LA}, ${A})`),
      limitError('lists_per_owner', '50')
    );
  });

  it('refuses 51 lists made by one statement', async () => {
    await assert.rejects(
      asA(
        users,
        (tx) => tx`insert into public.lists (id, owner_id)
          select gen_random_uuid(), ${A} from generate_series(1, 51)`
      ),
      limitError('lists_per_owner', '50')
    );
  });

  it("counts only the owner's own lists", async () => {
    const n = await asRole(
      sql,
      { role: 'authenticated', sub: B, setup: fiftyLists },
      async (tx) => {
        await tx`insert into public.lists (id, owner_id) values (${LB}, ${B})`;
        const [r] = await tx`select count(*)::int as n from public.lists`;
        return r.n;
      }
    );
    assert.equal(n, 1);
  });

  it('refuses the 101st entry with the limit and its value', async () => {
    await assert.rejects(
      asA(
        hundredEntries,
        (tx) => tx`insert into public.list_entries (id, list_id, item_key, position)
          values (${id(1160)}, ${LA}, 'q23', 101)`
      ),
      limitError('entries_per_list', '100')
    );
  });

  it('refuses a move that makes the 101st entry of a list', async () => {
    await assert.rejects(
      asA(hundredEntries, async (tx) => {
        await tx`insert into public.lists (id, owner_id) values (${id(1003)}, ${A})`;
        await tx`insert into public.list_entries (id, list_id, item_key, position)
          values (${id(1161)}, ${id(1003)}, 'q23', 0)`;
        await tx`update public.list_entries set list_id = ${LA} where id = ${id(1161)}`;
      }),
      limitError('entries_per_list', '100')
    );
  });
});

describe('reorder_list()', () => {
  const order = (tx) =>
    tx`select id from public.list_entries where list_id = ${LA} order by position, id`;

  it('rewrites the order and bumps the list', async () => {
    const out = await asA(world, async (tx) => {
      const [before] = await tx`select revision::int as r from public.lists where id = ${LA}`;
      await tx`select public.reorder_list(${LA}, ${[E3, E1, E2]}::uuid[])`;
      const [afterRev] = await tx`select revision::int as r from public.lists where id = ${LA}`;
      const rows = await tx`select position from public.list_entries
        where list_id = ${LA} order by position`;
      return {
        ids: ids(await order(tx)),
        positions: rows.map((r) => r.position),
        bumped: afterRev.r > before.r
      };
    });
    assert.deepEqual(out, { ids: [E3, E1, E2], positions: [0, 1, 2], bumped: true });
  });

  for (const [what, entries] of [
    ['a missing id', [E3, E1]],
    ['an extra id', [E3, E1, E2, EB]],
    ['a duplicate', [E3, E1, E1]],
    ['a null', [E3, E1, null]]
  ]) {
    it(`refuses ${what}`, async () => {
      await assert.rejects(
        asA(world, (tx) => tx`select public.reorder_list(${LA}, ${entries}::uuid[])`),
        byCode('22023', /entries do not match the list/)
      );
    });
  }

  it("refuses B's list, and a caller with no user id", async () => {
    await assert.rejects(
      asA(world, (tx) => tx`select public.reorder_list(${LB}, ${[EB]}::uuid[])`),
      byCode('42501', /not the owner/)
    );
    await assert.rejects(
      asRole(
        sql,
        { role: 'authenticated', setup: world },
        (tx) => tx`select public.reorder_list(${LA}, ${[E1, E2, E3]}::uuid[])`
      ),
      byCode('42501', /not the owner/)
    );
  });

  it('refuses anon', async () => {
    await assert.rejects(
      asRole(
        sql,
        { role: 'anon', setup: world },
        (tx) => tx`select public.reorder_list(${LA}, ${[E1, E2, E3]}::uuid[])`
      ),
      /permission denied/
    );
  });
});

describe('lists rows go with their user', () => {
  it("through delete_account(), keeping B's", async () => {
    const left = await asA(world, async (tx) => {
      await tx`select public.delete_account()`;
      await tx.unsafe('reset role');
      return {
        lists: ids(
          await tx`select id from public.lists where id in (${LA}, ${LB}) order by id`
        ),
        entries: ids(await tx`select id from public.list_entries order by id`)
      };
    });
    assert.deepEqual(left, { lists: [LB], entries: [EB] });
  });

  it('with their entries when the owner deletes a list', async () => {
    const left = await asA(world, async (tx) => {
      await tx`delete from public.lists where id = ${LA}`;
      await tx.unsafe('reset role');
      return ids(await tx`select id from public.list_entries order by id`);
    });
    assert.deepEqual(left, [EB]);
  });
});
