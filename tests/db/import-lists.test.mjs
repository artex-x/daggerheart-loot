/*
  import_lists(): a lists file imported as new lists of the caller, in one
  transaction - every list or none. It runs as the caller, so row level
  security, the table checks and the count limits apply as to a plain
  write; a list id already the caller's is a retry that adds only missing
  entries, another owner's id refuses the call; `source` and `snapshot`
  pass through. The deferred broadcast trigger sends one owner message per
  list at commit, and none for a refused call. docs/specs/CONTRACTS.md
  section 4; docs/decisions/2026-09-26-an-import-is-one-import-lists-transaction.md.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, commitAs, connect, messagesTo, realtimePartition } from './roles.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const LB = id(6002);
const EB = id(6201);

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const users = (tx) => tx`insert into auth.users (id) values (${A}), (${B})`;
/* B's list LB with EB. */
const world = async (tx) => {
  await users(tx);
  await tx`insert into public.lists (id, owner_id, name, player_note, gm_note)
    values (${LB}, ${B}, 'B', 'bp', 'bg')`;
  await tx`insert into public.list_entries (id, list_id, item_key, position, quantity)
    values (${EB}, ${LB}, 'ci1', 0, 2)`;
};
const asA = (setup, fn) => asRole(sql, { role: 'authenticated', sub: A, setup }, fn);
/* postgres.js serialises a jsonb parameter itself (see list-writes.test.mjs). */
const importAs = async (tx, lists) => {
  const [{ n }] = await tx`select public.import_lists(${
    lists === null ? null : tx.json(lists)
  }::jsonb) as n`;
  return n;
};
/* The call inside a savepoint, so the transaction reads on after a refusal; answers the
   error, or null. */
const refused = (tx, lists) =>
  tx
    .savepoint((sp) => importAs(sp, lists))
    .then(
      () => null,
      (err) => err
    );
const list = (listId, name = 'L', entries = [], extra = {}) => ({
  list: { id: listId, name, money_mode: 'bag', player_note: '', gm_note: '', ...extra },
  entries
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
const entries = (n, from = 0) =>
  Array.from({ length: n }, (_, i) => entry(id(10000 + from + i), 'k' + String(i), i));
/* Reads as the connection's own role, which row level security does not bind, then acts
   as A again. */
const unbound = async (tx, fn) => {
  await tx.unsafe('reset role');
  const out = await fn(tx);
  await tx.unsafe('set local role authenticated');
  return out;
};
const rows = async (tx) => ({
  lists: [
    ...(await tx`select id, owner_id, name, money_mode, player_note, gm_note,
        revision::int as revision
      from public.lists order by id`)
  ].map((r) => ({ ...r })),
  entries: [
    ...(await tx`select id, list_id, item_key, source, snapshot, position, quantity,
        price_coins, player_note, gm_note
      from public.list_entries order by list_id, position, id`)
  ].map((r) => ({ ...r }))
});
const byCode = (code, text) => (err) => {
  assert.equal(err.code, code, err.message);
  if (text) assert.match(err.message, text);
  return true;
};
const L1 = id(7001);
const L2 = id(7002);
const TWO = [
  list(
    L1,
    'Импорт',
    [
      entry(id(7101), 'ci1', 0, {
        quantity: 2,
        price_coins: 150,
        player_note: 'a',
        gm_note: 'b'
      }),
      entry(id(7102), 'q1', 1),
      entry(id(7103), 'q313', 2)
    ],
    { money_mode: 'coin', player_note: 'p', gm_note: 'g' }
  ),
  list(L2, 'Пустой')
];

describe('import_lists grants and shape', () => {
  it('pins EXECUTE for authenticated only, security invoker and the search path', async () => {
    const found = await sql`
      select p.oid::regprocedure::text as fn,
        has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
        has_function_privilege('service_role', p.oid, 'EXECUTE') as service,
        p.prosecdef, p.proconfig
      from pg_proc p
      where p.pronamespace = 'public'::regnamespace and p.proname = 'import_lists'`;
    assert.deepEqual(Object.fromEntries(found.map(({ fn, ...r }) => [fn, r])), {
      'import_lists(jsonb)': {
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
      asRole(sql, { role: 'anon', setup: users }, (tx) => importAs(tx, [])),
      byCode('42501', /permission denied/)
    );
  });

  it('refuses a caller with no user id with 28000', async () => {
    await assert.rejects(
      asRole(sql, { role: 'authenticated', setup: users }, (tx) => importAs(tx, [])),
      byCode('28000', /^import_lists: not signed in$/)
    );
  });

  const malformed = [
    ['SQL null', null, /^import_lists: not a list of at most 50 lists$/],
    ['the object {}', {}, /^import_lists: not a list of at most 50 lists$/],
    [
      '51 lists',
      Array.from({ length: 51 }, (_, i) => list(id(8000 + i))),
      /^import_lists: not a list of at most 50 lists$/
    ],
    ['a list that is not an object', [1], /^import_lists: invalid list$/],
    ['a list with no list object', [{ entries: [] }], /^import_lists: invalid list$/],
    [
      'entries that are not an array',
      [{ list: list(L1).list, entries: {} }],
      /^import_lists: invalid list$/
    ],
    /* The bound fires before the insert: the limit trigger would answer P0001. */
    ['5001 entries', [list(L1), list(L2, 'L', entries(5001))], /^import_lists: invalid list$/]
  ];
  for (const [what, lists, text] of malformed) {
    it(`refuses ${what} with 22023`, async () => {
      await assert.rejects(
        asA(users, (tx) => importAs(tx, lists)),
        byCode('22023', text)
      );
    });
  }
});

describe('an import, as A', () => {
  it('inserts every list with its entries in order and answers the count', async () => {
    const out = await asA(users, async (tx) => ({
      n: await importAs(tx, TWO),
      rows: await unbound(tx, rows)
    }));
    assert.equal(out.n, 2);
    assert.deepEqual(
      out.rows.lists.map(({ revision: _r, ...l }) => l),
      [
        {
          id: L1,
          owner_id: A,
          name: 'Импорт',
          money_mode: 'coin',
          player_note: 'p',
          gm_note: 'g'
        },
        { id: L2, owner_id: A, name: 'Пустой', money_mode: 'bag', player_note: '', gm_note: '' }
      ]
    );
    assert.deepEqual(
      out.rows.entries,
      TWO[0].entries.map((e) => ({ ...e, list_id: L1 }))
    );
    assert.deepEqual(
      out.rows.entries.map((e) => [e.position, e.source, e.snapshot]),
      [
        [0, 'official', null],
        [1, 'official', null],
        [2, 'official', null]
      ]
    );
  });

  it('answers 0 to the same call again and changes no row', async () => {
    const out = await asA(users, async (tx) => {
      await importAs(tx, TWO);
      const once = await unbound(tx, rows);
      const n = await importAs(tx, TWO);
      return { once, n, twice: await unbound(tx, rows) };
    });
    assert.equal(out.n, 0);
    assert.deepEqual(out.twice, out.once);
  });

  it("refuses a list id B owns with 42501, inserting nothing and leaving B's rows", async () => {
    const out = await asA(world, async (tx) => {
      const was = await unbound(tx, rows);
      const err = await refused(tx, [list(L1), list(LB, 'mine', [entry(id(7200), 'q1', 1)])]);
      return { was, err, now: await unbound(tx, rows) };
    });
    byCode('42501', /^import_lists: the id belongs to another list$/)(out.err);
    assert.deepEqual(out.now, out.was);
    assert.equal(out.now.lists.filter((l) => l.owner_id === A).length, 0);
  });

  it('refuses a second list of 101 entries with the limit, and the first list is not there', async () => {
    const out = await asA(users, async (tx) => ({
      err: await refused(tx, [list(L1), list(L2, 'L', entries(101))]),
      rows: await unbound(tx, rows)
    }));
    byCode('P0001', /^limit: entries_per_list$/)(out.err);
    assert.equal(out.err.detail, '100');
    assert.deepEqual(out.rows, { lists: [], entries: [] });
  });

  it('refuses two lists for an owner of 49 with the lists limit, inserting none', async () => {
    const fortyNine = async (tx) => {
      await users(tx);
      await tx`insert into public.lists (id, owner_id, name)
        select ('00000000-0000-4000-8000-' || lpad((5000 + n)::text, 12, '0'))::uuid, ${A},
          'L' || n
        from generate_series(1, 49) as n`;
    };
    const out = await asA(fortyNine, async (tx) => ({
      err: await refused(tx, [list(L1), list(L2)]),
      count: (await unbound(tx, rows)).lists.length
    }));
    byCode('P0001', /^limit: lists_per_owner$/)(out.err);
    assert.equal(out.err.detail, '50');
    assert.equal(out.count, 49);
  });

  it("applies the owner's entries override: four entries over a limit of 3 refuse", async () => {
    const lowered = async (tx) => {
      await users(tx);
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${A}, 'entries_per_list', 3)`;
    };
    const out = await asA(lowered, async (tx) => ({
      err: await refused(tx, [list(L1, 'L', entries(4))]),
      rows: await unbound(tx, rows)
    }));
    byCode('P0001', /^limit: entries_per_list$/)(out.err);
    assert.equal(out.err.detail, '3');
    assert.deepEqual(out.rows, { lists: [], entries: [] });
  });

  const tableRefusals = [
    [
      'quantity 0',
      [list(L1), list(L2, 'L', [entry(id(7101), 'ci1', 0, { quantity: 0 })])],
      '23514'
    ],
    [
      'one record twice in a list',
      [list(L1, 'L', [entry(id(7101), 'ci1', 0), entry(id(7102), 'ci1', 1)])],
      '23505'
    ],
    [
      'a homebrew entry with no snapshot',
      [list(L1, 'L', [entry(id(7101), 'hb_x1', 0, { source: 'homebrew' })])],
      '23514'
    ]
  ];
  for (const [what, lists, code] of tableRefusals) {
    it(`refuses ${what} with ${code}, inserting nothing`, async () => {
      const out = await asA(users, async (tx) => ({
        err: await refused(tx, lists),
        rows: await unbound(tx, rows)
      }));
      byCode(code)(out.err);
      assert.deepEqual(out.rows, { lists: [], entries: [] });
    });
  }

  it('passes a homebrew entry and its snapshot through', async () => {
    const hb = entry(id(7101), 'hb_x1', 0, {
      source: 'homebrew',
      snapshot: { name: 'X', gold: 20 },
      price_coins: 20
    });
    const out = await asA(users, async (tx) => ({
      n: await importAs(tx, [list(L1, 'L', [hb])]),
      rows: await unbound(tx, rows)
    }));
    assert.equal(out.n, 1);
    assert.deepEqual(out.rows.entries, [{ ...hb, list_id: L1 }]);
  });
});

describe('the owner messages of an import', () => {
  before(async () => {
    await realtimePartition(sql);
  });

  it('commits one owner message per list with its final revision, and none when refused', async () => {
    const a = crypto.randomUUID();
    const b = crypto.randomUUID();
    const mine = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
    const theirs = crypto.randomUUID();
    await sql`insert into auth.users (id) values (${a}), (${b})`;
    await sql`insert into public.lists (id, owner_id) values (${theirs}, ${b})`;
    try {
      const topic = `owner:${a}`;
      const before = (await messagesTo(sql, topic)).length;
      await assert.rejects(
        commitAs(sql, { role: 'authenticated', sub: a }, (tx) =>
          importAs(tx, [list(mine[0]), list(theirs)])
        ),
        byCode('42501')
      );
      assert.equal((await messagesTo(sql, topic)).length, before);
      const n = await commitAs(sql, { role: 'authenticated', sub: a }, (tx) =>
        importAs(tx, [
          list(mine[0], 'A', [entry(crypto.randomUUID(), 'ci1', 0)]),
          list(mine[1], 'B'),
          list(mine[2], 'C', [
            entry(crypto.randomUUID(), 'q1', 0),
            entry(crypto.randomUUID(), 'q2', 1)
          ])
        ])
      );
      assert.equal(n, 3);
      const revisions = await sql`select id, revision::int as revision from public.lists
        where owner_id = ${a}`;
      const want = mine.map((l) => ({
        event: 'list',
        payload: { list: l, revision: revisions.find((r) => r.id === l).revision, by: null }
      }));
      const sent = (await messagesTo(sql, topic)).slice(before);
      const key = (m) => m.payload.list;
      assert.deepEqual(
        [...sent].sort((x, y) => key(x).localeCompare(key(y))),
        [...want].sort((x, y) => key(x).localeCompare(key(y)))
      );
    } finally {
      await sql`delete from auth.users where id in (${a}, ${b})`;
    }
  });
});
