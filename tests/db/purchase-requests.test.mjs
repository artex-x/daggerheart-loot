/*
  Purchase requests: any holder of an active share link sends one through
  create_purchase_request(), the only writer, whose bounds are all inside
  it - the token, the client's id and its replay, the lines, the line
  limit, the stale item, the rate, the pending cap - and whose
  housekeeping runs only when it inserts; the owner alone reads, applies
  (stock by item, in id order, short or clamped, an entry taken whole
  deleted and the positions renumbered) or declines; two sends at the cap
  and two applies on one list run in order; a line whose entry is deleted
  while the send waits keeps a null price; each send and decision nudges
  the owner's topic, with the tab only on a decision, and no share topic.
  docs/specs/FEATURES.md, "Account and browser lists";
  docs/decisions/2026-09-26-purchase-requests-are-written-only-by-a-bounded.md.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, commitAs, connect, realtimePartition } from './roles.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const LA = id(4001);
const LA2 = id(4002);
const LB = id(4003);
const E_CI1 = id(4101);
const E_Q1 = id(4102);
const E_CC1 = id(4103);
const E_BCI1 = id(4104);
const SP = id(4201);
const SG = id(4202);
const SS = id(4203);
const SB = id(4204);
const TP = 'P'.repeat(43);
const TG = 'G'.repeat(43);
const TS = 'S'.repeat(43);
const TB = 'B'.repeat(43);
const uuid = () => crypto.randomUUID();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let sql;
before(async () => {
  sql = connect();
  await realtimePartition(sql);
});
after(async () => {
  await sql.end();
});

/* A's list LA: ci1 (2, 150 coins), q1 (1, no price), cc1 (5, 20 coins) at
   positions 0-2, an active player share, an active GM share and a stopped
   one; A's empty LA2; B's LB with its own ci1 and a player share. */
const world = async (tx) => {
  await tx`insert into auth.users (id) values (${A}), (${B})`;
  await tx`insert into public.lists (id, owner_id, name) values
    (${LA}, ${A}, 'Shop'), (${LA2}, ${A}, 'Empty'), (${LB}, ${B}, 'Other')`;
  await tx`insert into public.list_entries (id, list_id, item_key, position, quantity, price_coins)
    values (${E_CI1}, ${LA}, 'ci1', 0, 2, 150), (${E_Q1}, ${LA}, 'q1', 1, 1, null),
      (${E_CC1}, ${LA}, 'cc1', 2, 5, 20), (${E_BCI1}, ${LB}, 'ci1', 0, 3, 99)`;
  await tx`insert into public.list_shares (id, list_id, audience, token, revoked_at) values
    (${SP}, ${LA}, 'player', ${TP}, null), (${SG}, ${LA}, 'gm', ${TG}, null),
    (${SS}, ${LA}, 'player', ${TS}, now()), (${SB}, ${LB}, 'player', ${TB}, null)`;
};
/* The world, then `more(tx)`. */
const worldAnd = (more) => async (tx) => {
  await world(tx);
  await more(tx);
};
const overrideOf = (key, value) => (tx) =>
  tx`insert into public.user_limit_overrides (user_id, key, value) values (${A}, ${key}, ${value})`;

/* Inserts a request row as the connection's own role, times relative to
   now(): `age` before it was made, `expiresIn` after now, `decidedAgo`
   before now or null; `lines` as [item, qty, price]. */
async function putRequest(
  tx,
  {
    rid = uuid(),
    list = LA,
    share = SP,
    audience = 'player',
    status = 'pending',
    age = '0 seconds',
    expiresIn = '1 hour',
    decidedAgo = null,
    lines = [['ci1', 1, 150]]
  } = {}
) {
  await tx`insert into public.purchase_requests
    (id, list_id, share_id, audience, status, created_at, expires_at, decided_at)
    values (${rid}, ${list}, ${share}, ${audience}, ${status}, now() - ${age}::interval,
      now() + ${expiresIn}::interval, now() - ${decidedAgo}::interval)`;
  for (const [item, qty, price] of lines) {
    await tx`insert into public.purchase_request_lines (request_id, item_key, quantity, price_coins)
      values (${rid}, ${item}, ${qty}, ${price})`;
  }
  return rid;
}

const asA = (setup, fn) => asRole(sql, { role: 'authenticated', sub: A, setup }, fn);
const asB = (setup, fn) => asRole(sql, { role: 'authenticated', sub: B, setup }, fn);
const asAnon = (setup, fn) => asRole(sql, { role: 'anon', setup }, fn);

/* Sends `lines` through `token` as the transaction's role; answers the row. */
const send = async (tx, token, lines, rid = uuid()) => {
  const [r] =
    await tx`select public.create_purchase_request(${rid}::uuid, ${token}::text, ${lines === undefined ? null : tx.json(lines)}::jsonb) as v`;
  return r;
};
const apply = async (tx, rid, clamp) => {
  const [r] =
    clamp === undefined
      ? await tx`select public.apply_purchase_request(${rid}::uuid) as v`
      : await tx`select public.apply_purchase_request(${rid}::uuid, ${clamp}) as v`;
  return r.v;
};
const decline = (tx, rid) => tx`select public.decline_purchase_request(${rid}::uuid)`;

/* Runs `fn(sp)` in a savepoint and answers the error it threw; fails when
   it threw none. The transaction goes on after it. */
async function refusal(tx, fn) {
  try {
    await tx.savepoint(fn);
  } catch (err) {
    return err;
  }
  assert.fail('the call was not refused');
}
const expectError = (err, code, message, detail) => {
  assert.equal(err.code, code, err.message);
  assert.equal(err.message, message);
  if (detail !== undefined) assert.equal(err.detail, detail);
};
/* Counts as the connection's own role, after the case's role. */
const countOf = async (tx, table) => {
  await tx.unsafe('reset role');
  const [r] = await tx`select count(*)::int as n from ${tx(table)}`;
  return r.n;
};
const entriesOf = async (tx, list) => {
  await tx.unsafe('reset role');
  return [
    ...(await tx`select item_key, quantity, position from public.list_entries
      where list_id = ${list} order by position, item_key`)
  ];
};
const ONE = [{ item: 'ci1', qty: 1 }];

describe('grants', () => {
  for (const table of ['public.purchase_requests', 'public.purchase_request_lines']) {
    it(`pins ${table}: authenticated select, service_role its five, anon nothing`, async () => {
      const privs = [
        'SELECT',
        'INSERT',
        'UPDATE',
        'DELETE',
        'TRUNCATE',
        'REFERENCES',
        'TRIGGER'
      ];
      const rows = await sql`
        select r.role, p.priv
        from unnest(array['anon', 'authenticated', 'service_role']) as r(role)
        cross join unnest(${privs}::text[]) as p(priv)
        where has_table_privilege(r.role, ${table}::regclass, p.priv)
        order by r.role, p.priv`;
      assert.deepEqual(
        rows.map((r) => `${r.role}: ${r.priv}`),
        [
          'authenticated: SELECT',
          'service_role: DELETE',
          'service_role: REFERENCES',
          'service_role: SELECT',
          'service_role: TRIGGER',
          'service_role: TRUNCATE'
        ]
      );
      const [r] = await sql`select relrowsecurity from pg_class where oid = ${table}::regclass`;
      assert.equal(r.relrowsecurity, true);
    });
  }

  it('refuses the owner a direct insert', async () => {
    await assert.rejects(
      asA(
        world,
        (
          tx
        ) => tx`insert into public.purchase_requests (id, list_id, share_id, audience, expires_at)
          values (${uuid()}, ${LA}, ${SP}, 'player', now())`
      ),
      (err) => err.code === '42501'
    );
  });

  it('pins each function: definer, search_path, EXECUTE and its result', async () => {
    const rows = await sql`
      select p.oid::regprocedure::text as fn,
        has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
        has_function_privilege('service_role', p.oid, 'EXECUTE') as service,
        p.prosecdef, p.proconfig, pg_get_function_result(p.oid) as returns
      from pg_proc p
      where p.pronamespace = 'public'::regnamespace
        and p.proname in ('create_purchase_request', 'apply_purchase_request',
          'decline_purchase_request', 'purchase_requests_broadcast')
      order by 1`;
    const pinned = (anon, authed, returns) => ({
      anon,
      authed,
      service: false,
      prosecdef: true,
      proconfig: ['search_path=public, pg_temp'],
      returns
    });
    assert.deepEqual(Object.fromEntries(rows.map(({ fn, ...r }) => [fn, r])), {
      'apply_purchase_request(uuid,boolean)': pinned(false, true, 'jsonb'),
      'create_purchase_request(uuid,text,jsonb)': pinned(true, true, 'void'),
      'decline_purchase_request(uuid)': pinned(false, true, 'void'),
      'purchase_requests_broadcast()': pinned(false, false, 'trigger')
    });
  });
});

describe('a send', () => {
  it('stores a request through a player and a GM token as anon, with the audience, the hour and the prices', async () => {
    const p = uuid();
    const g = uuid();
    const out = await asAnon(world, async (tx) => {
      const r = await send(
        tx,
        TP,
        [
          { item: 'ci1', qty: 1 },
          { item: 'q1', qty: 1 }
        ],
        p
      );
      await send(tx, TG, [{ item: 'cc1', qty: 3 }], g);
      await tx.unsafe('reset role');
      const reqs = await tx`select id, list_id, share_id, audience, status, decided_at,
          (expires_at - created_at) = interval '1 hour' as hour
        from public.purchase_requests order by audience`;
      const lines =
        await tx`select request_id, item_key, quantity, price_coins, applied_quantity
        from public.purchase_request_lines order by item_key`;
      return { v: r.v, reqs: [...reqs], lines: [...lines] };
    });
    assert.ok(out.v === null || out.v === '', `the send answered ${JSON.stringify(out.v)}`);
    assert.deepEqual(out.reqs, [
      {
        id: g,
        list_id: LA,
        share_id: SG,
        audience: 'gm',
        status: 'pending',
        decided_at: null,
        hour: true
      },
      {
        id: p,
        list_id: LA,
        share_id: SP,
        audience: 'player',
        status: 'pending',
        decided_at: null,
        hour: true
      }
    ]);
    assert.deepEqual(out.lines, [
      { request_id: g, item_key: 'cc1', quantity: 3, price_coins: 20, applied_quantity: null },
      { request_id: p, item_key: 'ci1', quantity: 1, price_coins: 150, applied_quantity: null },
      { request_id: p, item_key: 'q1', quantity: 1, price_coins: null, applied_quantity: null }
    ]);
  });

  it("stores a request another signed-in user sends through A's link", async () => {
    const n = await asB(world, async (tx) => {
      await send(tx, TP, ONE);
      return countOf(tx, 'purchase_requests');
    });
    assert.equal(n, 1);
  });

  it('ignores extra keys in a line: the price and the audience are read, not taken', async () => {
    const out = await asAnon(world, async (tx) => {
      await send(tx, TP, [{ item: 'ci1', qty: 1, price: 1, entry: E_Q1, audience: 'gm' }]);
      await tx.unsafe('reset role');
      const [r] = await tx`select r.audience, l.price_coins from public.purchase_requests r
        join public.purchase_request_lines l on l.request_id = r.id`;
      return r;
    });
    assert.deepEqual({ ...out }, { audience: 'player', price_coins: 150 });
  });
});

describe('a replay', () => {
  it('answers success for the same id and token again, and inserts no row and no line', async () => {
    const rid = uuid();
    const out = await asAnon(world, async (tx) => {
      await send(tx, TP, ONE, rid);
      await send(tx, TP, [{ item: 'cc1', qty: 2 }], rid);
      return [
        await countOf(tx, 'purchase_requests'),
        await countOf(tx, 'purchase_request_lines')
      ];
    });
    assert.deepEqual(out, [1, 1]);
  });

  it('passes the rate after five sends, and a sixth new send does not', async () => {
    const out = await asAnon(world, async (tx) => {
      const ids = [1, 2, 3, 4, 5].map(() => uuid());
      for (const rid of ids) await send(tx, TP, ONE, rid);
      await send(tx, TP, ONE, ids[4]);
      const err = await refusal(tx, (sp) => send(sp, TP, ONE));
      return { err, n: await countOf(tx, 'purchase_requests') };
    });
    expectError(out.err, 'P0001', 'limit: request_rate', '5');
    assert.equal(out.n, 5);
  });

  it('passes at the pending cap, and a new send does not', async () => {
    const out = await asAnon(
      worldAnd(overrideOf('pending_requests_per_list', 1)),
      async (tx) => {
        const rid = uuid();
        await send(tx, TP, ONE, rid);
        await send(tx, TP, ONE, rid);
        return refusal(tx, (sp) => send(sp, TP, ONE));
      }
    );
    expectError(out, 'P0001', 'limit: pending_requests_per_list', '1');
  });

  it("refuses the id on another share of the list and on B's share with the generic answer", async () => {
    const out = await asAnon(world, async (tx) => {
      const rid = uuid();
      await send(tx, TP, ONE, rid);
      const errs = [
        await refusal(tx, (sp) => send(sp, TG, ONE, rid)),
        await refusal(tx, (sp) => send(sp, TB, ONE, rid))
      ];
      await tx.unsafe('reset role');
      const rows = await tx`select id, share_id from public.purchase_requests`;
      return { errs, rows: [...rows], rid };
    });
    for (const err of out.errs) expectError(err, 'P0002', 'request: unknown link');
    assert.deepEqual(out.rows, [{ id: out.rid, share_id: SP }]);
  });

  it('refuses a null id with a valid token as a bad id', async () => {
    await assert.rejects(
      asAnon(world, (tx) => send(tx, TP, ONE, null)),
      (err) => {
        expectError(err, '22023', 'request: bad id');
        return true;
      }
    );
  });
});

describe('a token', () => {
  for (const [name, token] of [
    ['null', null],
    ['malformed', 'nonsense'],
    ['unknown', 'x'.repeat(43)],
    ['stopped', TS]
  ]) {
    it(`refuses a ${name} token with the one answer, also with a null id`, async () => {
      const errs = await asAnon(world, async (tx) => [
        await refusal(tx, (sp) => send(sp, token, ONE)),
        await refusal(tx, (sp) => send(sp, token, ONE, null))
      ]);
      for (const err of errs) expectError(err, 'P0002', 'request: unknown link');
    });
  }
});

describe('the lines', () => {
  const bad = [
    ['an object', { item: 'ci1', qty: 1 }],
    ['a string', 'ci1'],
    ['null', undefined],
    ['empty', []],
    ['a non-object element', [1]],
    ['no item', [{ qty: 1 }]],
    ['a number item', [{ item: 5, qty: 1 }]],
    ['a malformed item', [{ item: 'c i', qty: 1 }]],
    ['qty 0', [{ item: 'ci1', qty: 0 }]],
    ['qty 100', [{ item: 'ci1', qty: 100 }]],
    ['qty 1.5', [{ item: 'ci1', qty: 1.5 }]],
    ['qty "2"', [{ item: 'ci1', qty: '2' }]],
    [
      'a repeated item',
      [
        { item: 'ci1', qty: 1 },
        { item: 'ci1', qty: 1 }
      ]
    ],
    ['a body over 32768 bytes', [{ item: 'ci1', qty: 1, pad: 'x'.repeat(33000) }]]
  ];
  for (const [name, lines] of bad) {
    it(`refuses ${name} as bad lines`, async () => {
      await assert.rejects(
        asAnon(world, (tx) => send(tx, TP, lines)),
        (err) => {
          expectError(err, '22023', 'request: bad lines');
          return true;
        }
      );
    });
  }

  it('refuses an item the list does not hold as stale', async () => {
    await assert.rejects(
      asAnon(world, (tx) =>
        send(tx, TP, [
          { item: 'ci1', qty: 1 },
          { item: 'zz9', qty: 1 }
        ])
      ),
      (err) => {
        expectError(err, '22023', 'request: stale');
        return true;
      }
    );
  });

  const three = [
    { item: 'ci1', qty: 1 },
    { item: 'q1', qty: 1 },
    { item: 'cc1', qty: 1 }
  ];

  it("refuses more lines than the owner's request_lines override, with the value", async () => {
    await assert.rejects(
      asAnon(worldAnd(overrideOf('request_lines', 2)), (tx) => send(tx, TP, three)),
      (err) => {
        expectError(err, 'P0001', 'limit: request_lines', '2');
        return true;
      }
    );
  });

  it('allows them under a null override', async () => {
    const n = await asAnon(worldAnd(overrideOf('request_lines', null)), async (tx) => {
      await send(tx, TP, three);
      return countOf(tx, 'purchase_request_lines');
    });
    assert.equal(n, 3);
  });
});

describe('the rate', () => {
  it('passes five sends on one share and refuses the sixth; the other share still sends', async () => {
    const out = await asAnon(world, async (tx) => {
      for (let i = 0; i < 5; i++) await send(tx, TP, ONE);
      const err = await refusal(tx, (sp) => send(sp, TP, ONE));
      await send(tx, TG, ONE);
      return { err, n: await countOf(tx, 'purchase_requests') };
    });
    expectError(out.err, 'P0001', 'limit: request_rate', '5');
    assert.equal(out.n, 6);
  });

  it('does not count five requests 61 seconds old', async () => {
    const setup = worldAnd(async (tx) => {
      for (let i = 0; i < 5; i++) await putRequest(tx, { age: '61 seconds' });
    });
    const n = await asAnon(setup, async (tx) => {
      for (let i = 0; i < 5; i++) await send(tx, TP, ONE);
      return countOf(tx, 'purchase_requests');
    });
    assert.equal(n, 10);
  });
});

describe('the pending cap', () => {
  const pending = (n) => async (tx) => {
    for (let i = 0; i < n; i++) await putRequest(tx, { age: '2 minutes' });
  };

  it('refuses the eleventh pending request with the value', async () => {
    await assert.rejects(
      asAnon(worldAnd(pending(10)), (tx) => send(tx, TP, ONE)),
      (err) => {
        expectError(err, 'P0001', 'limit: pending_requests_per_list', '10');
        return true;
      }
    );
  });

  it('does not count an expired pending request or a decided one', async () => {
    const setup = worldAnd(async (tx) => {
      await pending(9)(tx);
      await putRequest(tx, { age: '2 hours', expiresIn: '-1 hour' });
      await putRequest(tx, { status: 'applied', age: '2 minutes', decidedAgo: '1 minute' });
    });
    const n = await asAnon(setup, async (tx) => {
      await send(tx, TP, ONE);
      return countOf(tx, 'purchase_requests');
    });
    assert.equal(n, 12);
  });

  it('lets one more through under an override of 11', async () => {
    const setup = worldAnd(async (tx) => {
      await pending(10)(tx);
      await overrideOf('pending_requests_per_list', 11)(tx);
    });
    const n = await asAnon(setup, async (tx) => {
      await send(tx, TP, ONE);
      return countOf(tx, 'purchase_requests');
    });
    assert.equal(n, 11);
  });
});

describe('the housekeeping', () => {
  it('deletes, on a successful send only, rows of any list decided or expired more than 24 hours ago', async () => {
    const old = { decided: uuid(), expired: uuid(), other: uuid() };
    const recent = uuid();
    const setup = worldAnd(async (tx) => {
      await putRequest(tx, {
        rid: old.decided,
        status: 'applied',
        age: '26 hours',
        expiresIn: '-25 hours',
        decidedAgo: '25 hours'
      });
      await putRequest(tx, { rid: old.expired, age: '26 hours', expiresIn: '-25 hours' });
      await putRequest(tx, {
        rid: old.other,
        list: LB,
        share: SB,
        status: 'declined',
        age: '26 hours',
        expiresIn: '-25 hours',
        decidedAgo: '25 hours',
        lines: [['ci1', 1, 99]]
      });
      await putRequest(tx, {
        rid: recent,
        status: 'declined',
        age: '24 hours',
        expiresIn: '-23 hours',
        decidedAgo: '23 hours'
      });
    });
    const out = await asAnon(setup, async (tx) => {
      const err = await refusal(tx, (sp) => send(sp, TP, []));
      const afterRefusal = await countOf(tx, 'purchase_requests');
      await tx.unsafe('set local role anon');
      const fresh = uuid();
      await send(tx, TP, ONE, fresh);
      await tx.unsafe('reset role');
      const ids = await tx`select id from public.purchase_requests order by created_at`;
      const lines = await tx`select count(*)::int as n from public.purchase_request_lines
        where request_id in (${old.decided}, ${old.expired}, ${old.other})`;
      return { err, afterRefusal, ids: ids.map((r) => r.id), fresh, lines: lines[0].n };
    });
    expectError(out.err, '22023', 'request: bad lines');
    assert.equal(out.afterRefusal, 4);
    assert.deepEqual(out.ids, [recent, out.fresh]);
    assert.equal(out.lines, 0);
  });
});

describe('the concurrency at the pending cap', () => {
  it('lets one of two concurrent sends through and refuses the other, which waits on the list lock', async () => {
    const a = uuid();
    const list = uuid();
    const token = 'C'.repeat(40) + String(Math.floor(Math.random() * 900) + 100);
    await sql.begin(async (tx) => {
      await tx`insert into auth.users (id) values (${a})`;
      await tx`insert into public.lists (id, owner_id) values (${list}, ${a})`;
      await tx`insert into public.list_entries (id, list_id, item_key, position)
        values (${uuid()}, ${list}, 'ci1', 0)`;
      await tx`insert into public.list_shares (list_id, audience, token)
        values (${list}, 'player', ${token})`;
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${a}, 'pending_requests_per_list', 1)`;
    });
    const c1 = connect();
    const c2 = connect();
    try {
      const [{ pid }] = await c2`select pg_backend_pid() as pid`;
      let second;
      await c1.begin(async (tx) => {
        await tx`select public.create_purchase_request(${uuid()}, ${token}, ${tx.json(ONE)}::jsonb)`;
        second = c2
          .begin(
            (t2) =>
              t2`select public.create_purchase_request(${uuid()}, ${token}, ${t2.json(ONE)}::jsonb)`
          )
          .then(
            () => null,
            (err) => err
          );
        assert.deepEqual(await waitOf(pid), {
          wait_event_type: 'Lock',
          wait_event: 'advisory'
        });
      });
      const err = await second;
      assert.ok(err, 'the second send was not refused');
      expectError(err, 'P0001', 'limit: pending_requests_per_list', '1');
      const [{ n }] =
        await sql`select count(*)::int as n from public.purchase_requests where list_id = ${list}`;
      assert.equal(n, 1);
    } finally {
      await c1.end();
      await c2.end();
      await sql`delete from auth.users where id = ${a}`;
    }
  });
});

/* Answers the wait of backend `pid` once it waits on a lock, at most 10 s;
   the last wait read otherwise. */
async function waitOf(pid) {
  const until = Date.now() + 10000;
  for (;;) {
    const [w] = await sql`select wait_event_type, wait_event from pg_stat_activity
      where pid = ${pid}`;
    if (w?.wait_event_type === 'Lock' || Date.now() > until) return w && { ...w };
    await pause(50);
  }
}

describe('the owner', () => {
  const withRequest = worldAnd((tx) =>
    putRequest(tx, {
      lines: [
        ['ci1', 1, 150],
        ['q1', 1, null]
      ]
    })
  );

  it("selects the list's requests and lines; B selects none; anon is refused", async () => {
    const mine = await asA(withRequest, async (tx) => [
      (await tx`select id from public.purchase_requests`).length,
      (await tx`select item_key from public.purchase_request_lines`).length
    ]);
    assert.deepEqual(mine, [1, 2]);
    const theirs = await asB(withRequest, async (tx) => [
      (await tx`select id from public.purchase_requests`).length,
      (await tx`select item_key from public.purchase_request_lines`).length
    ]);
    assert.deepEqual(theirs, [0, 0]);
    for (const table of ['purchase_requests', 'purchase_request_lines']) {
      await assert.rejects(
        asAnon(withRequest, (tx) => tx`select 1 from ${tx(table)}`),
        /permission denied/
      );
    }
  });
});

describe('an apply', () => {
  it('lowers the entries, deletes one taken whole and renumbers the positions', async () => {
    const rid = uuid();
    const setup = worldAnd((tx) =>
      putRequest(tx, {
        rid,
        lines: [
          ['ci1', 1, 150],
          ['q1', 1, null]
        ]
      })
    );
    const out = await asA(setup, async (tx) => {
      const v = await apply(tx, rid);
      const entries = await entriesOf(tx, LA);
      const [req] = await tx`select status, decided_at is not null as decided
        from public.purchase_requests where id = ${rid}`;
      const lines =
        await tx`select item_key, applied_quantity from public.purchase_request_lines
        where request_id = ${rid} order by item_key`;
      return { v, entries, req: { ...req }, lines: [...lines] };
    });
    assert.deepEqual(out.v, { applied: true, taken: 2 });
    assert.deepEqual(out.entries, [
      { item_key: 'ci1', quantity: 1, position: 0 },
      { item_key: 'cc1', quantity: 5, position: 1 }
    ]);
    assert.deepEqual(out.req, { status: 'applied', decided: true });
    assert.deepEqual(out.lines, [
      { item_key: 'ci1', applied_quantity: 1 },
      { item_key: 'q1', applied_quantity: 1 }
    ]);
  });

  it('answers short over stock and changes no row', async () => {
    const rid = uuid();
    const setup = worldAnd((tx) =>
      putRequest(tx, {
        rid,
        lines: [
          ['ci1', 3, 150],
          ['cc1', 1, 20],
          ['zz1', 1, null]
        ]
      })
    );
    const out = await asA(setup, async (tx) => {
      const read = async () => {
        const entries = await entriesOf(tx, LA);
        const [req] = await tx`select status, decided_at from public.purchase_requests`;
        const lines = await tx`select applied_quantity from public.purchase_request_lines`;
        return { entries, req: { ...req }, lines: lines.map((l) => l.applied_quantity) };
      };
      const before = await read();
      await tx.unsafe('set local role authenticated');
      const v = await apply(tx, rid);
      return { v, before, after: await read() };
    });
    assert.deepEqual(out.v, {
      short: [
        { item: 'ci1', want: 3, have: 2 },
        { item: 'zz1', want: 1, have: 0 }
      ]
    });
    assert.deepEqual(out.after, out.before);
  });

  it('takes what is there with clamp, 0 for an item the list no longer holds', async () => {
    const rid = uuid();
    const setup = worldAnd((tx) =>
      putRequest(tx, {
        rid,
        lines: [
          ['ci1', 3, 150],
          ['cc1', 1, 20],
          ['zz1', 1, null]
        ]
      })
    );
    const out = await asA(setup, async (tx) => {
      const v = await apply(tx, rid, true);
      const entries = await entriesOf(tx, LA);
      const lines =
        await tx`select item_key, applied_quantity from public.purchase_request_lines
        order by item_key`;
      return { v, entries, lines: [...lines] };
    });
    assert.deepEqual(out.v, { applied: true, taken: 3 });
    assert.deepEqual(out.entries, [
      { item_key: 'q1', quantity: 1, position: 0 },
      { item_key: 'cc1', quantity: 4, position: 1 }
    ]);
    assert.deepEqual(out.lines, [
      { item_key: 'cc1', applied_quantity: 1 },
      { item_key: 'ci1', applied_quantity: 2 },
      { item_key: 'zz1', applied_quantity: 0 }
    ]);
  });

  it('answers short with clamp when nothing is there, and changes nothing', async () => {
    const rid = uuid();
    const setup = worldAnd((tx) =>
      putRequest(tx, {
        rid,
        lines: [
          ['zz1', 1, null],
          ['zz2', 2, null]
        ]
      })
    );
    const out = await asA(setup, async (tx) => {
      const v = await apply(tx, rid, true);
      await tx.unsafe('reset role');
      const [req] = await tx`select status from public.purchase_requests`;
      return { v, status: req.status, entries: await entriesOf(tx, LA) };
    });
    assert.deepEqual(out.v, {
      short: [
        { item: 'zz1', want: 1, have: 0 },
        { item: 'zz2', want: 2, have: 0 }
      ]
    });
    assert.equal(out.status, 'pending');
    assert.equal(out.entries.length, 3);
  });

  it("finds an entry re-added under a new id, and never touches B's entry of the same item", async () => {
    const rid = uuid();
    const setup = worldAnd((tx) => putRequest(tx, { rid, lines: [['ci1', 1, 150]] }));
    const out = await asA(setup, async (tx) => {
      await tx`delete from public.list_entries where id = ${E_CI1}`;
      await tx`insert into public.list_entries (id, list_id, item_key, position, quantity)
        values (${uuid()}, ${LA}, 'ci1', 0, 2)`;
      const v = await apply(tx, rid);
      await tx.unsafe('reset role');
      const rows = await tx`select list_id, quantity from public.list_entries
        where item_key = 'ci1' order by list_id`;
      return { v, rows: rows.map((r) => [r.list_id, r.quantity]) };
    });
    assert.deepEqual(out.v, { applied: true, taken: 1 });
    assert.deepEqual(out.rows, [
      [LA, 1],
      [LB, 3]
    ]);
  });

  it('does not touch an entry the owner moved to another list, and reads it as short', async () => {
    const rid = uuid();
    const setup = worldAnd((tx) => putRequest(tx, { rid, lines: [['cc1', 1, 20]] }));
    const out = await asA(setup, async (tx) => {
      await tx`update public.list_entries set list_id = ${LA2} where id = ${E_CC1}`;
      const v = await apply(tx, rid);
      return { v, moved: await entriesOf(tx, LA2) };
    });
    assert.deepEqual(out.v, { short: [{ item: 'cc1', want: 1, have: 0 }] });
    assert.deepEqual(out.moved, [{ item_key: 'cc1', quantity: 5, position: 2 }]);
  });
});

describe('a decision refused', () => {
  const one = (more = {}) => {
    const rid = uuid();
    return { rid, setup: worldAnd((tx) => putRequest(tx, { rid, ...more })) };
  };

  it('refuses B an apply and a decline', async () => {
    const { rid, setup } = one();
    for (const call of [(tx) => apply(tx, rid), (tx) => decline(tx, rid)]) {
      await assert.rejects(asB(setup, call), (err) => err.code === '42501');
    }
  });

  it('refuses anon an apply and a decline', async () => {
    const { rid, setup } = one();
    for (const call of [(tx) => apply(tx, rid), (tx) => decline(tx, rid)]) {
      await assert.rejects(asAnon(setup, call), (err) => {
        assert.equal(err.code, '42501');
        assert.match(err.message, /permission denied/);
        return true;
      });
    }
  });

  it('refuses a second decision as decided', async () => {
    const { rid, setup } = one();
    const errs = await asA(setup, async (tx) => {
      await apply(tx, rid);
      return [
        await refusal(tx, (sp) => apply(sp, rid)),
        await refusal(tx, (sp) => decline(sp, rid))
      ];
    });
    for (const err of errs) expectError(err, '22023', 'request: decided');
  });

  it('refuses a decision past expires_at as expired', async () => {
    const { rid, setup } = one({ age: '2 hours', expiresIn: '-1 hour' });
    const errs = await asA(setup, async (tx) => [
      await refusal(tx, (sp) => apply(sp, rid)),
      await refusal(tx, (sp) => decline(sp, rid))
    ]);
    for (const err of errs) expectError(err, '22023', 'request: expired');
  });
});

describe('a decline', () => {
  it('sets declined and changes no entry', async () => {
    const rid = uuid();
    const setup = worldAnd((tx) => putRequest(tx, { rid, lines: [['q1', 1, null]] }));
    const out = await asA(setup, async (tx) => {
      await decline(tx, rid);
      const [req] = await tx`select status, decided_at is not null as decided
        from public.purchase_requests`;
      return { req: { ...req }, entries: await entriesOf(tx, LA) };
    });
    assert.deepEqual(out.req, { status: 'declined', decided: true });
    assert.deepEqual(out.entries, [
      { item_key: 'ci1', quantity: 2, position: 0 },
      { item_key: 'q1', quantity: 1, position: 1 },
      { item_key: 'cc1', quantity: 5, position: 2 }
    ]);
  });
});

describe('a list delete', () => {
  it('deletes its requests and their lines', async () => {
    const setup = worldAnd((tx) => putRequest(tx));
    const out = await asA(setup, async (tx) => {
      await tx`delete from public.lists where id = ${LA}`;
      return [
        await countOf(tx, 'purchase_requests'),
        await countOf(tx, 'purchase_request_lines')
      ];
    });
    assert.deepEqual(out, [0, 0]);
  });
});

/* Commits a world for one case - A's list with ci1 (2) and q1 (1), a player
   and a GM share, B's own empty list - runs `fn`, then deletes it. */
async function withWorld(fn) {
  const a = uuid();
  const b = uuid();
  const list = uuid();
  const tokens = {
    player: uuid().replaceAll('-', '') + 'p'.repeat(11),
    gm: uuid().replaceAll('-', '') + 'g'.repeat(11)
  };
  const topic = { player: uuid(), gm: uuid() };
  await sql.begin(async (tx) => {
    await tx`insert into auth.users (id) values (${a}), (${b})`;
    await tx`insert into public.lists (id, owner_id) values (${list}, ${a}), (${uuid()}, ${b})`;
    await tx`insert into public.list_entries (id, list_id, item_key, position, quantity) values
      (${uuid()}, ${list}, 'ci1', 0, 2), (${uuid()}, ${list}, 'q1', 1, 1)`;
    await tx`insert into public.list_shares (list_id, audience, token, topic_key) values
      (${list}, 'player', ${tokens.player}, ${topic.player}),
      (${list}, 'gm', ${tokens.gm}, ${topic.gm})`;
  });
  try {
    await fn({ a, b, list, tokens, topic });
  } finally {
    await sql`delete from auth.users where id in (${a}, ${b})`;
  }
}

/* The rows sent to `topic`, oldest first, without Realtime's message id. */
async function rowsOf(topic) {
  const rows = await sql`
    select event, payload - 'id' as payload from realtime.messages
    where topic = ${topic} order by inserted_at, id`;
  return rows.map((r) => ({ event: r.event, payload: r.payload }));
}
const requestRows = async (topic) => (await rowsOf(topic)).filter((r) => r.event === 'request');
const shareRequestRows = async () => {
  const [{ n }] = await sql`select count(*)::int as n from realtime.messages
    where event = 'request' and topic like 'share:%'`;
  return n;
};
const withHeaders = async (tx, headers) => {
  if (headers) await tx`select set_config('request.headers', ${headers}, true)`;
};

describe('the owner topic', () => {
  it('gets { list, by: null } for each send, also when the send carries a tab header', async () => {
    await withWorld(async ({ a, b, list, tokens }) => {
      const t = `owner:${a}`;
      const before = (await requestRows(t)).length;
      const shares = await shareRequestRows();
      for (const headers of [null, '{"x-dhloot-tab":"tab-9"}']) {
        await commitAs(sql, { role: 'anon' }, async (tx) => {
          await withHeaders(tx, headers);
          await send(tx, tokens.player, ONE);
        });
      }
      assert.deepEqual((await requestRows(t)).slice(before), [
        { event: 'request', payload: { list, by: null } },
        { event: 'request', payload: { list, by: null } }
      ]);
      assert.equal(await shareRequestRows(), shares);
      assert.deepEqual(await requestRows(`owner:${b}`), []);
    });
  });

  it("gets { list, by } for a decision, by from the tab header or null for a malformed one, and R3's list row for an apply", async () => {
    await withWorld(async ({ a, list, tokens, topic }) => {
      const t = `owner:${a}`;
      const ids = [uuid(), uuid()];
      for (const rid of ids) {
        await commitAs(sql, { role: 'anon' }, (tx) => send(tx, tokens.gm, ONE, rid));
      }
      const before = { request: (await requestRows(t)).length, all: (await rowsOf(t)).length };
      const shares = await shareRequestRows();
      const shareRows = (await rowsOf(`share:${topic.player}`)).length;
      const v = await commitAs(sql, { role: 'authenticated', sub: a }, async (tx) => {
        await withHeaders(tx, '{"x-dhloot-tab":"tab-1"}');
        return apply(tx, ids[0]);
      });
      assert.deepEqual(v, { applied: true, taken: 1 });
      await commitAs(sql, { role: 'authenticated', sub: a }, async (tx) => {
        await withHeaders(tx, '{"x-dhloot-tab":"bad tab!"}');
        await decline(tx, ids[1]);
      });
      assert.deepEqual((await requestRows(t)).slice(before.request), [
        { event: 'request', payload: { list, by: 'tab-1' } },
        { event: 'request', payload: { list, by: null } }
      ]);
      const listRows = (await rowsOf(t)).slice(before.all).filter((r) => r.event === 'list');
      assert.equal(listRows.length, 1);
      assert.equal(listRows[0].payload.list, list);
      assert.equal(listRows[0].payload.by, 'tab-1');
      assert.equal(await shareRequestRows(), shares);
      // The apply lowered an entry: R3's own revision message, not a request.
      assert.deepEqual(
        (await rowsOf(`share:${topic.player}`)).slice(shareRows).map((r) => r.event),
        ['revision']
      );
    });
  });
});

describe('a line whose entry is gone', () => {
  it('keeps the line with a null price when its entry is deleted between the stale check and the insert', async () => {
    await withWorld(async ({ list, tokens }) => {
      await sql`update public.list_entries set price_coins = 150
        where list_id = ${list} and item_key = 'ci1'`;
      await sql`update public.list_entries set price_coins = 20
        where list_id = ${list} and item_key = 'q1'`;
      const rid = uuid();
      const c1 = connect();
      const c2 = connect();
      try {
        const [{ pid }] = await c1`select pg_backend_pid() as pid`;
        let sent;
        await c2.begin(async (t2) => {
          await t2`select 1 from public.list_shares where token = ${tokens.player} for update`;
          sent = commitAs(c1, { role: 'anon' }, (tx) =>
            send(
              tx,
              tokens.player,
              [
                { item: 'ci1', qty: 1 },
                { item: 'q1', qty: 1 }
              ],
              rid
            )
          ).then(
            () => null,
            (err) => err
          );
          // The send passed the stale check and waits in the request insert's
          // foreign key check on the share row.
          assert.equal((await waitOf(pid))?.wait_event_type, 'Lock');
          await t2`delete from public.list_entries where list_id = ${list} and item_key = 'ci1'`;
        });
        const err = await sent;
        assert.equal(err, null, err?.message);
        const lines = await sql`select item_key, price_coins from public.purchase_request_lines
          where request_id = ${rid} order by item_key`;
        assert.deepEqual(
          lines.map((l) => [l.item_key, l.price_coins]),
          [
            ['ci1', null],
            ['q1', 20]
          ]
        );
      } finally {
        await c1.end();
        await c2.end();
      }
    });
  });
});

describe('two applies on one list', () => {
  it('run in order on the list lock, and both succeed', async () => {
    await withWorld(async ({ a, list, tokens }) => {
      const x = uuid();
      const y = uuid();
      await commitAs(sql, { role: 'anon' }, (tx) =>
        send(tx, tokens.player, [{ item: 'ci1', qty: 2 }], x)
      );
      await commitAs(sql, { role: 'anon' }, (tx) =>
        send(tx, tokens.gm, [{ item: 'q1', qty: 1 }], y)
      );
      const c1 = connect();
      const c2 = connect();
      try {
        const [{ pid }] = await c2`select pg_backend_pid() as pid`;
        let second;
        const first = await commitAs(c1, { role: 'authenticated', sub: a }, async (tx) => {
          const v = await apply(tx, x);
          second = commitAs(c2, { role: 'authenticated', sub: a }, (t2) => apply(t2, y)).then(
            (v2) => ({ v: v2 }),
            (err) => ({ err })
          );
          const w = await waitOf(pid);
          assert.equal(
            w?.wait_event_type,
            'Lock',
            `the second apply waits on ${JSON.stringify(w)}`
          );
          // It waits on the list row, before it locks any entry.
          const held = await sql`select relation::regclass::text as rel from pg_locks
            where pid = ${pid} and locktype = 'tuple'`;
          assert.deepEqual(
            held.map((r) => r.rel),
            ['lists']
          );
          return v;
        });
        const out = await second;
        assert.equal(out.err, undefined, out.err?.message);
        assert.deepEqual(first, { applied: true, taken: 2 });
        assert.deepEqual(out.v, { applied: true, taken: 1 });
        const [{ n }] =
          await sql`select count(*)::int as n from public.list_entries where list_id = ${list}`;
        assert.equal(n, 0);
      } finally {
        await c1.end();
        await c2.end();
      }
    });
  });
});
