/*
  apply_list_writes(): the account write buffer in one call. Each write
  applies in array order, in its own subtransaction, as the caller: row
  level security keeps another owner's rows unchanged and refuses a write
  into them; an update, a reorder or an add into a row that is gone or
  hidden answers P0002; a write with no id is malformed; the count limits
  refuse with the key and the value, and a
  refused create leaves no list; a refused or malformed write drops only
  itself; a class 40 error fails the whole call; a call sent twice changes
  nothing more. docs/specs/FEATURES.md, "Lists".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect } from './roles.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const L = id(6001);
const LB = id(6002);
const E1 = id(6101);
const E2 = id(6102);
const E3 = id(6103);
const E4 = id(6104);
const EB = id(6201);
const OK = { ok: true };

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const users = (tx) => tx`insert into auth.users (id) values (${A}), (${B})`;
/* A's list L with E1-E3 at positions 0-2; B's list LB with EB. */
const world = async (tx) => {
  await users(tx);
  await tx`insert into public.lists (id, owner_id, name, player_note, gm_note)
    values (${L}, ${A}, 'L', 'p', 'g'), (${LB}, ${B}, 'B', '', '')`;
  await tx`insert into public.list_entries (id, list_id, item_key, position, quantity,
      price_coins, player_note, gm_note)
    values (${E1}, ${L}, 'ci1', 0, 2, 150, 'ep', 'eg'), (${E2}, ${L}, 'q1', 1, 1, null, '', ''),
      (${E3}, ${L}, 'cc1', 2, 1, null, '', ''), (${EB}, ${LB}, 'ci1', 0, 2, null, '', '')`;
};
const asA = (setup, fn) => asRole(sql, { role: 'authenticated', sub: A, setup }, fn);
/* postgres.js serialises a jsonb parameter itself: a JSON text passed here
   would arrive as one JSON string, not as the array it holds. */
const batch = async (tx, ops) => {
  const [{ r }] = await tx`select public.apply_list_writes(${
    ops === null ? null : tx.json(ops)
  }::jsonb) as r`;
  return r;
};
const GONE = {
  ok: false,
  code: 'P0002',
  message: 'apply_list_writes: the list or entry is gone',
  details: null
};
const newList = (listId, name = 'L', extra = {}) => ({
  id: listId,
  name,
  money_mode: 'bag',
  player_note: '',
  gm_note: '',
  ...extra
});
const entry = (entryId, itemKey, position, extra = {}) => ({
  id: entryId,
  item_key: itemKey,
  source: 'official',
  snapshot: null,
  position,
  quantity: 1,
  price_coins: null,
  player_note: '',
  gm_note: '',
  ...extra
});
const listOf = async (tx, listId) => {
  const [l] = await tx`select id, owner_id, name, money_mode, player_note, gm_note,
      revision::int as revision
    from public.lists where id = ${listId}`;
  return l ? { ...l } : null;
};
const entriesOf = async (tx, listId) =>
  (
    await tx`select id, item_key, source, snapshot, position, quantity, price_coins,
        player_note, gm_note
      from public.list_entries where list_id = ${listId} order by position, id`
  ).map((e) => ({ ...e }));
/* Reads as the connection's own role, which row level security does not
   bind, then acts as A again. */
const unbound = async (tx, fn) => {
  await tx.unsafe('reset role');
  const out = await fn(tx);
  await tx.unsafe('set local role authenticated');
  return out;
};
const counts = async (tx) => {
  const [n] = await tx`select (select count(*) from public.lists)::int as lists,
    (select count(*) from public.list_entries)::int as entries`;
  return { ...n };
};
const byCode = (code, text) => (err) => {
  assert.equal(err.code, code, err.message);
  if (text) assert.match(err.message, text);
  return true;
};
/* The six writes of one mixed call: create L with E1 and E2, add E3,
   reorder, a quantity, two renames. */
const MIXED = [
  { op: 'create', list: newList(L), entries: [entry(E1, 'ci1', 0), entry(E2, 'q1', 1)] },
  { op: 'add', list_id: L, entries: [entry(E3, 'cc1', 2)] },
  { op: 'reorder', list_id: L, ids: [E3, E1, E2] },
  { op: 'update_entry', id: E3, patch: { quantity: 4 } },
  { op: 'update', id: L, patch: { name: 'a' } },
  { op: 'update', id: L, patch: { name: 'b' } }
];

describe('apply_list_writes grants and shape', () => {
  it('pins EXECUTE on apply_list_writes() for anon, authenticated and service_role', async () => {
    const rows = await sql`
      select p.oid::regprocedure::text as fn,
        has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
        has_function_privilege('service_role', p.oid, 'EXECUTE') as service,
        p.prosecdef, p.proconfig
      from pg_proc p
      where p.pronamespace = 'public'::regnamespace and p.proname = 'apply_list_writes'`;
    assert.deepEqual(Object.fromEntries(rows.map(({ fn, ...r }) => [fn, r])), {
      'apply_list_writes(jsonb)': {
        anon: false,
        authed: true,
        service: false,
        prosecdef: false,
        proconfig: ['search_path=public, pg_temp']
      }
    });
  });

  it('refuses anon', async () => {
    await assert.rejects(
      asRole(sql, { role: 'anon', setup: users }, (tx) => batch(tx, [])),
      byCode('42501', /permission denied/)
    );
  });

  it('refuses a caller with no user id with 28000', async () => {
    await assert.rejects(
      asRole(sql, { role: 'authenticated', setup: users }, (tx) => batch(tx, [])),
      byCode('28000', /^apply_list_writes: not signed in$/)
    );
  });

  const malformed = [
    ['SQL null', null, /^apply_list_writes: not a list of writes$/],
    ['the object {}', {}, /^apply_list_writes: not a list of writes$/],
    [
      '201 writes',
      Array.from({ length: 201 }, (_, i) => ({ op: 'remove', id: id(7000 + i) })),
      /^apply_list_writes: more than 200 writes$/
    ]
  ];
  for (const [what, ops, text] of malformed) {
    it(`refuses ${what} with 22023`, async () => {
      await assert.rejects(
        asA(users, (tx) => batch(tx, ops)),
        byCode('22023', text)
      );
    });
  }

  it('answers an empty array to an empty array and writes nothing', async () => {
    const out = await asA(users, async (tx) => ({
      r: await batch(tx, []),
      counts: await unbound(tx, counts)
    }));
    assert.deepEqual(out.r, []);
    assert.deepEqual(out.counts, { lists: 0, entries: 0 });
  });
});

describe('each write, as A', () => {
  it('create makes the list as A with its entries in position order', async () => {
    const out = await asA(users, async (tx) => ({
      r: await batch(tx, [
        {
          op: 'create',
          list: newList(L, 'Клад', { money_mode: 'coin', player_note: 'p', gm_note: 'g' }),
          entries: [
            entry(E2, 'hb_x1', 1, {
              source: 'homebrew',
              snapshot: { name: 'X', gold: 20 },
              quantity: 3,
              price_coins: 20,
              player_note: 'hp',
              gm_note: 'hg'
            }),
            entry(E1, 'ci1', 0, {
              quantity: 2,
              price_coins: 150,
              player_note: 'ep',
              gm_note: 'eg'
            })
          ]
        }
      ]),
      list: await listOf(tx, L),
      entries: await entriesOf(tx, L)
    }));
    assert.deepEqual(out.r, [OK]);
    assert.deepEqual(
      { ...out.list, revision: undefined },
      {
        id: L,
        owner_id: A,
        name: 'Клад',
        money_mode: 'coin',
        player_note: 'p',
        gm_note: 'g',
        revision: undefined
      }
    );
    assert.deepEqual(out.entries, [
      {
        id: E1,
        item_key: 'ci1',
        source: 'official',
        snapshot: null,
        position: 0,
        quantity: 2,
        price_coins: 150,
        player_note: 'ep',
        gm_note: 'eg'
      },
      {
        id: E2,
        item_key: 'hb_x1',
        source: 'homebrew',
        snapshot: { name: 'X', gold: 20 },
        position: 1,
        quantity: 3,
        price_coins: 20,
        player_note: 'hp',
        gm_note: 'hg'
      }
    ]);
  });

  it('update changes only the patched fields, and an empty patch keeps the revision', async () => {
    const out = await asA(world, async (tx) => {
      const before = await listOf(tx, L);
      const r = await batch(tx, [{ op: 'update', id: L, patch: { name: 'N', gm_note: 'G' } }]);
      const mid = await listOf(tx, L);
      const empty = await batch(tx, [{ op: 'update', id: L, patch: {} }]);
      return { before, r, mid, empty, end: await listOf(tx, L) };
    });
    assert.deepEqual(out.r, [OK]);
    assert.deepEqual(out.empty, [OK]);
    assert.deepEqual(out.mid, {
      ...out.before,
      name: 'N',
      gm_note: 'G',
      revision: out.before.revision + 1
    });
    assert.equal(out.end.revision, out.mid.revision);
  });

  it('add appends entries and leaves an entry whose id is already there', async () => {
    const out = await asA(world, async (tx) => ({
      r: await batch(tx, [
        {
          op: 'add',
          list_id: L,
          entries: [entry(E4, 'x1', 3), entry(E1, 'ci1', 0, { quantity: 9 })]
        }
      ]),
      entries: await entriesOf(tx, L)
    }));
    assert.deepEqual(out.r, [OK]);
    assert.deepEqual(
      out.entries.map((e) => [e.id, e.quantity]),
      [
        [E1, 2],
        [E2, 1],
        [E3, 1],
        [E4, 1]
      ]
    );
  });

  it('update_entry changes only the patched fields, price_coins set to null', async () => {
    const out = await asA(world, async (tx) => ({
      r: await batch(tx, [
        { op: 'update_entry', id: E1, patch: { price_coins: null, gm_note: 'G' } }
      ]),
      e1: (await entriesOf(tx, L))[0]
    }));
    assert.deepEqual(out.r, [OK]);
    assert.deepEqual(
      [out.e1.id, out.e1.quantity, out.e1.price_coins, out.e1.player_note, out.e1.gm_note],
      [E1, 2, null, 'ep', 'G']
    );
  });

  it('remove_entries deletes those entries and no other', async () => {
    const out = await asA(world, async (tx) => ({
      r: await batch(tx, [{ op: 'remove_entries', ids: [E1, E3] }]),
      ids: (await entriesOf(tx, L)).map((e) => e.id)
    }));
    assert.deepEqual(out.r, [OK]);
    assert.deepEqual(out.ids, [E2]);
  });

  it('reorder rewrites the positions in the given order', async () => {
    const out = await asA(world, async (tx) => ({
      r: await batch(tx, [{ op: 'reorder', list_id: L, ids: [E3, E1, E2] }]),
      order: (await entriesOf(tx, L)).map((e) => [e.id, e.position])
    }));
    assert.deepEqual(out.r, [OK]);
    assert.deepEqual(out.order, [
      [E3, 0],
      [E1, 1],
      [E2, 2]
    ]);
  });

  it('remove deletes the list and its entries', async () => {
    const out = await asA(world, async (tx) => ({
      r: await batch(tx, [{ op: 'remove', id: L }]),
      left: await unbound(tx, async (t) =>
        (await t`select id from public.lists order by id`).map((l) => l.id)
      ),
      entries: await unbound(tx, async (t) => (await entriesOf(t, L)).length)
    }));
    assert.deepEqual(out.r, [OK]);
    assert.deepEqual(out.left, [LB]);
    assert.equal(out.entries, 0);
  });

  it('applies the writes of one call in array order', async () => {
    const out = await asA(users, async (tx) => ({
      r: await batch(tx, MIXED),
      list: await listOf(tx, L),
      entries: await entriesOf(tx, L)
    }));
    assert.deepEqual(out.r, [OK, OK, OK, OK, OK, OK]);
    assert.equal(out.list.name, 'b');
    assert.deepEqual(
      out.entries.map((e) => [e.id, e.quantity]),
      [
        [E3, 4],
        [E1, 1],
        [E2, 1]
      ]
    );
  });
});

describe("B's rows, as A", () => {
  const readB = (tx) =>
    unbound(tx, async (t) => ({ list: await listOf(t, LB), entries: await entriesOf(t, LB) }));

  it("answers ok to a delete of B's list or entry and changes nothing", async () => {
    const out = await asA(world, async (tx) => {
      const before = await readB(tx);
      const r = await batch(tx, [
        { op: 'remove', id: LB },
        { op: 'remove_entries', ids: [EB] }
      ]);
      return { before, r, end: await readB(tx) };
    });
    assert.deepEqual(out.r, [OK, OK]);
    assert.equal(out.before.list.name, 'B');
    assert.equal(out.before.entries.length, 1);
    assert.deepEqual(out.end, out.before);
  });

  it("answers P0002 to an update of B's list or entry and changes nothing", async () => {
    const out = await asA(world, async (tx) => {
      const before = await readB(tx);
      const r = await batch(tx, [
        { op: 'update', id: LB, patch: { name: 'x' } },
        { op: 'update_entry', id: EB, patch: { quantity: 9 } }
      ]);
      return { before, r, end: await readB(tx) };
    });
    assert.deepEqual(out.r, [GONE, GONE]);
    assert.deepEqual(out.end, out.before);
  });

  it("answers P0002 to an add to B's list and to a reorder of it", async () => {
    const out = await asA(world, async (tx) => {
      const before = await readB(tx);
      const r = await batch(tx, [
        { op: 'add', list_id: LB, entries: [entry(id(6301), 'q1', 1)] },
        { op: 'reorder', list_id: LB, ids: [EB] }
      ]);
      return { before, r, end: await readB(tx) };
    });
    assert.deepEqual(out.r, [GONE, GONE]);
    assert.deepEqual(out.end, out.before);
  });

  it("refuses a create with the id of B's list with 42501", async () => {
    const out = await asA(world, async (tx) => {
      const before = await readB(tx);
      const r = await batch(tx, [{ op: 'create', list: newList(LB, 'mine'), entries: [] }]);
      return { before, r, end: await readB(tx) };
    });
    assert.deepEqual(out.r, [
      {
        ok: false,
        code: '42501',
        message: 'apply_list_writes: the id belongs to another list',
        details: null
      }
    ]);
    assert.deepEqual(out.end, out.before);
    assert.equal(out.end.list.owner_id, B);
  });
});

describe('a row deleted before the write', () => {
  const L2 = id(6003);

  it('answers P0002 to an update of a deleted list, and the write beside it lands', async () => {
    const out = await asA(world, async (tx) => {
      await tx`delete from public.lists where id = ${L}`;
      return {
        r: await batch(tx, [
          { op: 'update', id: L, patch: { name: 'x' } },
          { op: 'create', list: newList(L2, 'L2'), entries: [] }
        ]),
        gone: await listOf(tx, L),
        made: (await listOf(tx, L2))?.name
      };
    });
    assert.deepEqual(out.r, [GONE, OK]);
    assert.equal(out.gone, null);
    assert.equal(out.made, 'L2');
  });

  it('answers P0002 to an update_entry of a deleted entry, and the write beside it lands', async () => {
    const out = await asA(world, async (tx) => {
      await tx`delete from public.list_entries where id = ${E3}`;
      return {
        r: await batch(tx, [
          { op: 'update_entry', id: E3, patch: { quantity: 5 } },
          { op: 'update', id: L, patch: { name: 'N' } }
        ]),
        name: (await listOf(tx, L)).name,
        ids: (await entriesOf(tx, L)).map((e) => e.id)
      };
    });
    assert.deepEqual(out.r, [GONE, OK]);
    assert.equal(out.name, 'N');
    assert.deepEqual(out.ids, [E1, E2]);
  });

  it('answers P0002 to a reorder of a deleted list, and the write beside it lands', async () => {
    const out = await asA(world, async (tx) => {
      await tx`delete from public.lists where id = ${L}`;
      return {
        r: await batch(tx, [
          { op: 'reorder', list_id: L, ids: [E3, E1, E2] },
          { op: 'create', list: newList(L2, 'L2'), entries: [] }
        ]),
        made: (await listOf(tx, L2))?.name
      };
    });
    assert.deepEqual(out.r, [GONE, OK]);
    assert.equal(out.made, 'L2');
  });

  it('answers P0002 to an add into a deleted list, and the write beside it lands', async () => {
    const out = await asA(world, async (tx) => {
      await tx`delete from public.lists where id = ${L}`;
      return {
        r: await batch(tx, [
          { op: 'add', list_id: L, entries: [entry(E4, 'x1', 3)] },
          { op: 'create', list: newList(L2, 'L2'), entries: [] }
        ]),
        added: await unbound(
          tx,
          async (t) => (await t`select id from public.list_entries where id = ${E4}`).length
        ),
        made: (await listOf(tx, L2))?.name
      };
    });
    assert.deepEqual(out.r, [GONE, OK]);
    assert.equal(out.added, 0);
    assert.equal(out.made, 'L2');
  });
});

describe('the count limits', () => {
  it('refuses the 51st list with the key and the value, and applies the next write', async () => {
    const fiftyLists = async (tx) => {
      await users(tx);
      await tx`insert into public.lists (id, owner_id, name)
        select ('00000000-0000-4000-8000-' || lpad((5000 + n)::text, 12, '0'))::uuid, ${A},
          'L' || n
        from generate_series(1, 50) as n`;
    };
    const out = await asA(fiftyLists, async (tx) => ({
      r: await batch(tx, [
        { op: 'create', list: newList(id(5051)), entries: [] },
        { op: 'update', id: id(5001), patch: { name: 'renamed' } }
      ]),
      first: (await listOf(tx, id(5001))).name,
      extra: await listOf(tx, id(5051))
    }));
    assert.deepEqual(out.r, [
      { ok: false, code: 'P0001', message: 'limit: lists_per_owner', details: '50' },
      OK
    ]);
    assert.equal(out.first, 'renamed');
    assert.equal(out.extra, null);
  });

  /* A create over the entry limit is refused whole, so a saved link over
     the limit makes no empty list. */
  it('refuses a create of 101 entries whole, leaving no list and no entry', async () => {
    const entries = Array.from({ length: 101 }, (_, i) => entry(id(8001 + i), `k${i + 1}`, i));
    const out = await asA(users, async (tx) => ({
      r: await batch(tx, [{ op: 'create', list: newList(L), entries }]),
      counts: await unbound(tx, counts)
    }));
    assert.deepEqual(out.r, [
      { ok: false, code: 'P0001', message: 'limit: entries_per_list', details: '100' }
    ]);
    assert.deepEqual(out.counts, { lists: 0, entries: 0 });
  });

  it('refuses an add of the 101st entry, and the list keeps 100', async () => {
    const hundred = async (tx) => {
      await users(tx);
      await tx`insert into public.lists (id, owner_id) values (${L}, ${A})`;
      await tx`insert into public.list_entries (id, list_id, item_key, position)
        select gen_random_uuid(), ${L}, 'k' || n, n - 1 from generate_series(1, 100) as n`;
    };
    const out = await asA(hundred, async (tx) => ({
      r: await batch(tx, [{ op: 'add', list_id: L, entries: [entry(E4, 'x1', 100)] }]),
      entries: (await entriesOf(tx, L)).length
    }));
    assert.deepEqual(out.r, [
      { ok: false, code: 'P0001', message: 'limit: entries_per_list', details: '100' }
    ]);
    assert.equal(out.entries, 100);
  });
});

describe('a refusal', () => {
  it('drops only the refused write', async () => {
    const out = await asA(world, async (tx) => ({
      r: await batch(tx, [
        { op: 'update', id: L, patch: { name: 'N' } },
        { op: 'create', list: newList(LB, 'mine'), entries: [] },
        { op: 'update', id: L, patch: { player_note: 'P' } }
      ]),
      list: await listOf(tx, L)
    }));
    assert.deepEqual(
      out.r.map((x) => (x.ok ? 'ok' : x.code)),
      ['ok', '42501', 'ok']
    );
    assert.deepEqual([out.list.name, out.list.player_note], ['N', 'P']);
  });

  const malformed = [
    ['an unknown op', { op: 'x' }, '22023', /^apply_list_writes: unknown op x$/],
    [
      'an update patch with owner_id',
      { op: 'update', id: L, patch: { owner_id: B } },
      '22023',
      /^apply_list_writes: unknown field owner_id$/
    ],
    [
      'an add whose entries is an object',
      { op: 'add', list_id: L, entries: {} },
      '22023',
      /^apply_list_writes: invalid entries$/
    ],
    ['a remove whose id is not a uuid', { op: 'remove', id: 'nope' }, '22P02', null],
    [
      'an update with no id',
      { op: 'update', patch: { name: 'x' } },
      '22023',
      /^apply_list_writes: invalid id$/
    ],
    [
      'an update_entry with no id',
      { op: 'update_entry', patch: { quantity: 2 } },
      '22023',
      /^apply_list_writes: invalid id$/
    ],
    [
      'a reorder with no list_id',
      { op: 'reorder', ids: [] },
      '22023',
      /^apply_list_writes: invalid id$/
    ],
    [
      'an add with no list_id',
      { op: 'add', entries: [] },
      '22023',
      /^apply_list_writes: invalid id$/
    ]
  ];
  for (const [what, op, code, text] of malformed) {
    it(`answers ${code} to ${what} and applies the next write`, async () => {
      const out = await asA(world, async (tx) => ({
        r: await batch(tx, [op, { op: 'update', id: L, patch: { name: 'after' } }]),
        list: await listOf(tx, L)
      }));
      assert.equal(out.r.length, 2);
      assert.equal(out.r[0].ok, false);
      assert.equal(out.r[0].code, code, out.r[0].message);
      if (text) assert.match(out.r[0].message, text);
      assert.deepEqual(out.r[1], OK);
      assert.equal(out.list.name, 'after');
      assert.equal(out.list.owner_id, A);
    });
  }

  it('fails the whole call on a serialization failure', async () => {
    const boom = async (tx) => {
      await world(tx);
      await tx.unsafe(`
        create function public.test_boom() returns trigger language plpgsql as $$
        begin
          if new.name = 'boom' then
            raise exception 'test_boom' using errcode = '40001';
          end if;
          return new;
        end;
        $$;
        create trigger test_boom before update on public.lists
          for each row execute function public.test_boom();`);
    };
    let answered = null;
    await assert.rejects(
      asA(boom, async (tx) => {
        answered = await batch(tx, [
          { op: 'update', id: L, patch: { player_note: 'n' } },
          { op: 'update', id: L, patch: { name: 'boom' } }
        ]);
      }),
      byCode('40001', /test_boom/)
    );
    assert.equal(answered, null);
  });
});

describe('a retry', () => {
  it('answers ok to every write of a call sent twice and reads back the same state', async () => {
    const ops = [...MIXED, { op: 'remove_entries', ids: [E2] }];
    const out = await asA(users, async (tx) => {
      const first = await batch(tx, ops);
      const second = await batch(tx, ops);
      return {
        first,
        second,
        lists: (await tx`select id from public.lists`).map((l) => l.id),
        entries: (await entriesOf(tx, L)).map((e) => e.id)
      };
    });
    const allOk = ops.map(() => OK);
    assert.deepEqual(out.first, allOk);
    assert.deepEqual(out.second, allOk);
    assert.deepEqual(out.lists, [L]);
    assert.deepEqual(out.entries, [E3, E1]);
  });

  it('leaves no list after a create and a remove sent twice', async () => {
    const ops = [
      { op: 'create', list: newList(L), entries: [entry(E1, 'ci1', 0)] },
      { op: 'remove', id: L }
    ];
    const out = await asA(users, async (tx) => ({
      first: await batch(tx, ops),
      second: await batch(tx, ops),
      counts: await unbound(tx, counts)
    }));
    assert.deepEqual(out.first, [OK, OK]);
    assert.deepEqual(out.second, [OK, OK]);
    assert.deepEqual(out.counts, { lists: 0, entries: 0 });
  });
});
