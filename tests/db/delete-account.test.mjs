/*
  delete_account(): the one way a signed-in user removes their account.
  It runs as its owner (security definer, a fixed search_path), only a
  signed-in user may call it, and it removes the caller and nobody else.
  docs/specs/FEATURES.md, "Account".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect } from './roles.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const FN = 'public.delete_account()';

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const twoUsers = (tx) => tx`insert into auth.users (id) values (${A}), (${B})`;

describe('delete_account()', () => {
  it('runs as its owner with a fixed search_path', async () => {
    const [r] = await sql`
      select p.prosecdef, p.proconfig
      from pg_proc p where p.oid = ${FN}::regprocedure`;
    assert.equal(r.prosecdef, true);
    assert.deepEqual(r.proconfig, ['search_path=public, pg_temp']);
  });

  it('is executable by authenticated, and by neither anon nor PUBLIC', async () => {
    const [r] = await sql`
      select
        has_function_privilege('anon', ${FN}::regprocedure, 'EXECUTE') as anon,
        has_function_privilege('authenticated', ${FN}::regprocedure, 'EXECUTE') as authed,
        exists (
          select 1 from pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
          where p.oid = ${FN}::regprocedure and a.grantee = 0 and a.privilege_type = 'EXECUTE'
        ) as public_grant`;
    assert.deepEqual(r, { anon: false, authed: true, public_grant: false });
  });

  it("removes the caller's user and keeps everyone else's", async () => {
    const left = await asRole(
      sql,
      { role: 'authenticated', sub: A, setup: twoUsers },
      async (tx) => {
        await tx`select public.delete_account()`;
        await tx.unsafe('reset role');
        const rows = await tx`select id from auth.users where id in (${A}, ${B}) order by id`;
        return rows.map((r) => r.id);
      }
    );
    assert.deepEqual(left, [B]);
  });

  it('refuses an authenticated call with no user id', async () => {
    await assert.rejects(
      asRole(
        sql,
        { role: 'authenticated', setup: twoUsers },
        (tx) => tx`select public.delete_account()`
      ),
      /delete_account: not signed in/
    );
  });

  it('refuses anon', async () => {
    await assert.rejects(
      asRole(
        sql,
        { role: 'anon', sub: A, setup: twoUsers },
        (tx) => tx`select public.delete_account()`
      ),
      /permission denied/
    );
  });
});

describe('delete_account_requests()', () => {
  const PRUNE = 'public.delete_account_requests()';
  /* A: two lists, 250 requests of one line each on the first, one list and its share with no
     request on the second, an entry, an item and a print set; B: one request. */
  const seed = async (tx) => {
    await twoUsers(tx);
    await tx`insert into public.lists (id, owner_id, name)
      select gen_random_uuid(), ${A}, 'Список ' || g from generate_series(1, 2) g`;
    await tx`insert into public.lists (id, owner_id, name) values (gen_random_uuid(), ${B}, 'B')`;
    await tx`insert into public.list_entries (id, list_id, item_key, position)
      select gen_random_uuid(), l.id, 'k1', 0 from public.lists l`;
    await tx`insert into public.list_shares (list_id, audience)
      select l.id, 'player' from public.lists l`;
    await tx`insert into public.purchase_requests (id, list_id, share_id, audience, expires_at)
      select gen_random_uuid(), s.list_id, s.id, 'player', now() + interval '30 days'
      from public.list_shares s join public.lists l on l.id = s.list_id,
        generate_series(1, 250) g
      where l.owner_id = ${A} and l.name = 'Список 1'`;
    await tx`insert into public.purchase_requests (id, list_id, share_id, audience, expires_at)
      select gen_random_uuid(), s.list_id, s.id, 'player', now() + interval '30 days'
      from public.list_shares s join public.lists l on l.id = s.list_id where l.owner_id = ${B}`;
    await tx`insert into public.purchase_request_lines (request_id, item_key, quantity, price_coins)
      select r.id, 'k1', 1, 100 from public.purchase_requests r`;
    await tx`insert into public.homebrew_books (id, owner_id, key, content)
      values (gen_random_uuid(), ${A}, 'hb_srcaaaaaaaaaaaab', '{"ru": "Источник"}')`;
    await tx`insert into public.homebrew_items (id, owner_id, key, book_id, content)
      select gen_random_uuid(), ${A}, 'hb_aaaaaaaaaaaaaaab', b.id, '{"kind": "item", "ru": "П"}'
      from public.homebrew_books b where b.owner_id = ${A}`;
    await tx`insert into public.print_sets (owner_id, entries, digest)
      values (${A}, '[{"k": "ci1"}]'::jsonb, md5('a'))`;
  };
  /* The counts of one owner's rows, read as the connection's own role. */
  const countsOf = async (tx, owner) => {
    const [r] = await tx`select
      (select count(*) from public.lists where owner_id = ${owner})::int as lists,
      (select count(*) from public.list_entries e join public.lists l on l.id = e.list_id
        where l.owner_id = ${owner})::int as entries,
      (select count(*) from public.list_shares s join public.lists l on l.id = s.list_id
        where l.owner_id = ${owner})::int as shares,
      (select count(*) from public.homebrew_items where owner_id = ${owner})::int as items,
      (select count(*) from public.print_sets where owner_id = ${owner})::int as prints,
      (select count(*) from public.purchase_requests r join public.lists l on l.id = r.list_id
        where l.owner_id = ${owner})::int as requests,
      (select count(*) from public.purchase_request_lines p
        join public.purchase_requests r on r.id = p.request_id
        join public.lists l on l.id = r.list_id where l.owner_id = ${owner})::int as lines`;
    return r;
  };

  it('runs as its owner with a fixed search_path', async () => {
    const [r] = await sql`
      select p.prosecdef, p.proconfig, p.prorettype::regtype::text as returns
      from pg_proc p where p.oid = ${PRUNE}::regprocedure`;
    assert.deepEqual(r, {
      prosecdef: true,
      proconfig: ['search_path=public, pg_temp'],
      returns: 'integer'
    });
  });

  it('is executable by authenticated, and by neither anon nor PUBLIC', async () => {
    const [r] = await sql`
      select
        has_function_privilege('anon', ${PRUNE}::regprocedure, 'EXECUTE') as anon,
        has_function_privilege('authenticated', ${PRUNE}::regprocedure, 'EXECUTE') as authed,
        exists (
          select 1 from pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
          where p.oid = ${PRUNE}::regprocedure and a.grantee = 0 and a.privilege_type = 'EXECUTE'
        ) as public_grant`;
    assert.deepEqual(r, { anon: false, authed: true, public_grant: false });
  });

  it("deletes at most 200 of the caller's requests a call with their lines, and only those", async () => {
    const out = await asRole(
      sql,
      { role: 'authenticated', sub: A, setup: seed },
      async (tx) => {
        const answers = [];
        for (let i = 0; i < 4; i++) {
          const [{ n }] = await tx`select public.delete_account_requests() as n`;
          answers.push(n);
          if (n === 0) break;
        }
        await tx.unsafe('reset role');
        return { answers, a: await countsOf(tx, A), b: await countsOf(tx, B) };
      }
    );
    assert.deepEqual(out.answers, [200, 50, 0]);
    assert.deepEqual(out.a, {
      lists: 2,
      entries: 2,
      shares: 2,
      items: 1,
      prints: 1,
      requests: 0,
      lines: 0
    });
    assert.deepEqual(out.b, {
      lists: 1,
      entries: 1,
      shares: 1,
      items: 0,
      prints: 0,
      requests: 1,
      lines: 1
    });
  });

  it('refuses an authenticated call with no user id', async () => {
    await assert.rejects(
      asRole(
        sql,
        { role: 'authenticated', setup: seed },
        (tx) => tx`select public.delete_account_requests()`
      ),
      (err) =>
        err.code === '28000' && /delete_account_requests: not signed in/.test(err.message)
    );
  });

  it('refuses anon', async () => {
    await assert.rejects(
      asRole(
        sql,
        { role: 'anon', sub: A, setup: seed },
        (tx) => tx`select public.delete_account_requests()`
      ),
      /permission denied/
    );
  });
});

describe('the account at three times every default limit', () => {
  const BIG = '00000000-0000-4000-8000-0000000003aa';
  /* 60 sources, 300 items, 300 cards, 150 lists of 300 entries, 30 pending requests of 300
     lines per list and 3000 print sets, seeded through their triggers (34-44 s on this
     host); at the defaults the request lines are 1/27 and the entries 1/9 of it. The first
     case measures each call of the delete under half the hosted `authenticated` timeout of
     8 s (docs/decisions/2026-10-16-an-account-delete-removes-its-purchase-requests.md); the
     second times the owner's reads the app makes on a signed-in load under the same bound. */
  const seed = async (tx) => {
    await tx`insert into auth.users (id) values (${BIG})`;
    await tx`insert into public.user_limit_overrides (user_id, key, value)
      select ${BIG}, d.key, d.value * 3 from public.limit_defaults d`;
    await tx`insert into public.homebrew_books (id, owner_id, key, content)
      select gen_random_uuid(), ${BIG},
        'hb_src' || lpad(translate(g::text, '0123456789', 'abcdefghij'), 13, 'a'),
        jsonb_build_object('ru', 'Источник ' || g)
      from generate_series(1, 60) g`;
    await tx`insert into public.homebrew_items (id, owner_id, key, book_id, content, art)
      select gen_random_uuid(), ${BIG},
        'hb_' || lpad(translate(g::text, '0123456789', 'abcdefghij'), 16, 'a'),
        (select b.id from public.homebrew_books b where b.owner_id = ${BIG}
          order by b.key offset (g % 60) limit 1),
        jsonb_build_object('kind', 'item', 'ru', 'Предмет ' || g), 'art_' || g || '.webp'
      from generate_series(1, 300) g`;
    await tx`insert into public.homebrew_cards (id, owner_id, key, kind, content)
      select gen_random_uuid(), ${BIG},
        'hb_set' || lpad(translate(g::text, '0123456789', 'abcdefghij'), 13, 'a'), 'set',
        jsonb_build_object('ru', 'Комплект ' || g)
      from generate_series(1, 300) g`;
    await tx`insert into public.lists (id, owner_id, name)
      select gen_random_uuid(), ${BIG}, 'Список ' || g from generate_series(1, 150) g`;
    await tx`insert into public.list_entries (id, list_id, item_key, position)
      select gen_random_uuid(), l.id, 'k' || g, g - 1
      from public.lists l, generate_series(1, 300) g where l.owner_id = ${BIG}`;
    await tx`insert into public.list_shares (list_id, audience)
      select l.id, 'player' from public.lists l where l.owner_id = ${BIG}`;
    await tx`insert into public.purchase_requests (id, list_id, share_id, audience, expires_at)
      select gen_random_uuid(), s.list_id, s.id, 'player', now() + interval '30 days'
      from public.list_shares s join public.lists l on l.id = s.list_id, generate_series(1, 30) g
      where l.owner_id = ${BIG}`;
    await tx`insert into public.purchase_request_lines (request_id, item_key, quantity, price_coins)
      select r.id, 'k' || g, 1, 100
      from public.purchase_requests r join public.lists l on l.id = r.list_id,
        generate_series(1, 300) g
      where l.owner_id = ${BIG}`;
    await tx`insert into public.print_sets (owner_id, entries, digest)
      select ${BIG}, '[{"k": "ci1"}]'::jsonb, md5(g::text) from generate_series(1, 3000) g`;
  };

  const SEEDED = [
    'auth.users',
    'public.homebrew_books',
    'public.homebrew_items',
    'public.homebrew_cards',
    'public.lists',
    'public.list_entries',
    'public.list_shares',
    'public.purchase_requests',
    'public.purchase_request_lines',
    'public.print_sets'
  ];
  const reltuples = async () => {
    const rows = await sql`select relname, reltuples::bigint as n from pg_class
      where relname in ('purchase_request_lines', 'list_entries') and relkind = 'r'
      order by relname`;
    return rows.map((r) => `${r.relname} ${r.n}`).join(', ');
  };

  it('removes every row of the account in bounded calls, each within a 4 s statement timeout', async () => {
    let seeded = 0;
    const calls = [];
    let deleted = 0;
    let left;
    try {
      left = await asRole(
        sql,
        {
          role: 'authenticated',
          sub: BIG,
          setup: async (tx) => {
            const t0 = performance.now();
            await seed(tx);
            seeded = Math.round(performance.now() - t0);
            /* A hosted database keeps statistics (autovacuum's analyze); a fresh seed has
               none, and then the homebrew_items cascade took 9.0 s (2026-10-16). */
            await tx.unsafe(`analyze ${SEEDED.join(', ')}`);
          }
        },
        async (tx) => {
          const [{ ids }] = await tx`select coalesce(array_agg(id), '{}') as ids
            from public.lists where owner_id = ${BIG}`;
          await tx.unsafe(`set local statement_timeout = '4s'`);
          try {
            for (let i = 0; i < 100; i++) {
              const t0 = performance.now();
              const [{ n }] = await tx`select public.delete_account_requests() as n`;
              calls.push(Math.round(performance.now() - t0));
              if (n === 0) break;
            }
            const t0 = performance.now();
            await tx`select public.delete_account()`;
            deleted = Math.round(performance.now() - t0);
          } finally {
            console.log(
              `delete-account: 3x seed ${seeded} ms, ${calls.length} calls, slowest ${Math.max(0, ...calls)} ms, delete ${deleted} ms`
            );
          }
          await tx.unsafe('reset role');
          const [n] = await tx`select
            (select count(*) from auth.users where id = ${BIG})::int
            + (select count(*) from public.lists where owner_id = ${BIG})::int
            + (select count(*) from public.homebrew_items where owner_id = ${BIG})::int
            + (select count(*) from public.print_sets where owner_id = ${BIG})::int
            + (select count(*) from public.purchase_requests where list_id = any(${ids}))::int
            + (select count(*) from public.purchase_request_lines p
                join public.purchase_requests r on r.id = p.request_id
                where r.list_id = any(${ids}))::int as rows`;
          return n.rows;
        }
      );
    } finally {
      /* The first analyze may write pg_class.reltuples in place with the seeded rows counted,
         and that outlives the rollback while the column statistics do not; a second analyze
         outside the transaction leaves the next case the real row counts, on a failure too. */
      const before = await reltuples();
      await sql.unsafe(`analyze ${SEEDED.join(', ')}`);
      console.log(
        `delete-account: reltuples after the rollback ${before}; after analyze ${await reltuples()}`
      );
    }
    assert.equal(left, 0);
  });

  /* The reads as PostgREST builds them, each one statement with its conversion to text:
     every pending head (the upper bound of the keyset pages), one list's 30 requests with
     their lines, and every list with its entries, a tenth of them with both notes at 4000
     characters (docs/decisions/2026-10-22-the-owners-requests-read-takes-every-head-and-the-open-lists-lines.md). */
  it("reads the owner's request heads, one list's request lines and every list whole, each within 4 s", async () => {
    const median = (xs) => [...xs].sort((a, b) => a - b)[1];
    const serverTime = async (tx, query) => {
      const [r] = await tx.unsafe(`explain (analyze, format json) select (${query})::text`);
      const plan = r['QUERY PLAN'];
      return (typeof plan === 'string' ? JSON.parse(plan) : plan)[0]['Execution Time'];
    };
    let out;
    try {
      out = await asRole(
        sql,
        {
          role: 'authenticated',
          sub: BIG,
          setup: async (tx) => {
            await seed(tx);
            await tx`update public.list_entries e
              set player_note = repeat('n', 4000), gm_note = repeat('g', 4000)
              from public.lists l
              where l.id = e.list_id and l.owner_id = ${BIG} and e.position % 10 = 0`;
            await tx.unsafe(`analyze ${SEEDED.join(', ')}`);
          }
        },
        async (tx) => {
          const [one] = await tx`select l.id from public.lists l order by l.id limit 1`;
          const ids = (
            await tx`select id from public.purchase_requests
              where list_id = ${one.id} and status = 'pending' order by id`
          ).map((r) => `'${r.id}'`);
          const reads = {
            heads: `select coalesce(json_agg(t), '[]') from (select id, list_id, audience,
              created_at, expires_at, read_at from public.purchase_requests
              where status = 'pending' order by id) t`,
            lines: `select coalesce(json_agg(t), '[]') from (select r.id, r.list_id, r.audience,
              r.created_at, r.expires_at, r.read_at,
              (select coalesce(json_agg(x), '[]') from (select item_key, quantity, price_coins,
                applied_quantity from public.purchase_request_lines
                where request_id = r.id) x) as purchase_request_lines
              from public.purchase_requests r
              where r.status = 'pending' and r.id = any(array[${ids.join(', ')}]::uuid[])
              order by r.id) t`,
            lists: `select coalesce(json_agg(t), '[]') from (select l.id, l.name, l.money_mode,
              l.player_note, l.gm_note, l.created_at, l.updated_at, l.revision,
              l.legacy_fingerprint,
              (select coalesce(json_agg(x), '[]') from (select id, item_key, source, hb_item,
                position, quantity, price_coins, player_note, gm_note, gm_only
                from public.list_entries where list_id = l.id) x) as list_entries
              from public.lists l order by l.updated_at desc, l.id) t`
          };
          const [counts] = await tx`select
            (select count(*) from public.purchase_requests where status = 'pending')::int
              as heads,
            (select count(*) from public.purchase_request_lines p
              join public.purchase_requests r on r.id = p.request_id
              where r.list_id = ${one.id})::int as lines,
            (select count(*) from public.lists)::int as lists`;
          const times = { heads: [], lines: [], lists: [] };
          for (let run = 0; run < 3; run++) {
            for (const [name, query] of Object.entries(reads)) {
              times[name].push(await serverTime(tx, query));
            }
          }
          return { counts, requests: ids.length, times };
        }
      );
    } finally {
      await sql.unsafe(`analyze ${SEEDED.join(', ')}`);
    }
    const m = Object.fromEntries(
      Object.entries(out.times).map(([name, xs]) => [name, Math.round(median(xs))])
    );
    console.log(
      `owner-reads: 3x heads ${m.heads} ms, one list's lines ${m.lines} ms, every list ${m.lists} ms`
    );
    assert.equal(out.counts.heads, 4500);
    assert.equal(out.requests, 30);
    assert.equal(out.counts.lines, 30 * 300);
    assert.equal(out.counts.lists, 150);
    assert.ok(m.heads < 4000, `the heads read's median took ${m.heads} ms`);
    assert.ok(m.lines < 4000, `one list's lines read's median took ${m.lines} ms`);
    assert.ok(m.lists < 4000, `every list's read's median took ${m.lists} ms`);
  });
});
