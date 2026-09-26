/*
  move_legacy_list() and lists.legacy_fingerprint: a browser list moves into
  the caller's account whole, in one call. The database hashes the canonical
  text it parses; a second call with the same text returns the first row,
  per owner, or 40001 when that row is gone before the lookup; the move
  passes the count limits while a plain insert still meets them; a text
  that is not a valid list is refused with the field named.
  docs/specs/FEATURES.md, "Lists".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { asRole, connect } from './roles.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const M1 = id(3001);
const M2 = id(3002);
const M3 = id(3003);
const MB = id(3101);
const FP_RE = /^[0-9a-f]{64}$/;
const TREASURE =
  '{"ids":["ci1","q1"],"meta":{"ci1":{"gold":150,"qty":2}},"money":"coin","name":"Клад","note":"p"}';
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const users = (tx) => tx`insert into auth.users (id) values (${A}), (${B})`;
const asA = (setup, fn) => asRole(sql, { role: 'authenticated', sub: A, setup }, fn);
const asB = (setup, fn) => asRole(sql, { role: 'authenticated', sub: B, setup }, fn);
const move = async (tx, listId, text) => {
  const [r] = await tx`select * from public.move_legacy_list(${listId}, ${text})`;
  return { id: r.id, inserted: r.inserted };
};
const listsOf = (tx) => tx`select id, owner_id, name, money_mode, player_note, gm_note,
    legacy_fingerprint
  from public.lists order by id`;
const entriesOf = (tx, listId) => tx`select item_key, position, quantity, price_coins,
    player_note, gm_note
  from public.list_entries where list_id = ${listId} order by position`;
const byCode = (code, text) => (err) => {
  assert.equal(err.code, code, err.message);
  if (text) assert.match(err.message, text);
  return true;
};
const limitError = (key, detail) => (err) => {
  assert.equal(err.code, 'P0001', err.message);
  assert.equal(err.message, `limit: ${key}`);
  assert.equal(err.detail, detail);
  return true;
};

describe('move_legacy_list grants and schema', () => {
  it('pins EXECUTE on move_legacy_list() for anon, authenticated and service_role', async () => {
    const rows = await sql`
      select p.oid::regprocedure::text as fn,
        has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
        has_function_privilege('service_role', p.oid, 'EXECUTE') as service,
        p.prosecdef, p.proconfig
      from pg_proc p
      where p.pronamespace = 'public'::regnamespace and p.proname = 'move_legacy_list'`;
    assert.deepEqual(Object.fromEntries(rows.map(({ fn, ...r }) => [fn, r])), {
      'move_legacy_list(uuid,text)': {
        anon: false,
        authed: true,
        service: false,
        prosecdef: true,
        proconfig: ['search_path=public, pg_temp']
      }
    });
  });

  it('has a nullable text legacy_fingerprint checked as 64 hex digits', async () => {
    const [col] = await sql`
      select format_type(a.atttypid, a.atttypmod) as type, a.attnotnull
      from pg_attribute a
      where a.attrelid = 'public.lists'::regclass and a.attname = 'legacy_fingerprint'
        and not a.attisdropped`;
    assert.deepEqual({ ...col }, { type: 'text', attnotnull: false });
    const checks = await sql`
      select pg_get_constraintdef(c.oid) as def from pg_constraint c
      where c.conrelid = 'public.lists'::regclass and c.contype = 'c'
        and pg_get_constraintdef(c.oid) like '%legacy_fingerprint%'`;
    assert.equal(checks.length, 1);
    assert.match(checks[0].def, /legacy_fingerprint ~ '\^\[0-9a-f\]\{64\}\$'/);
  });

  it('has a unique partial index on (owner_id, legacy_fingerprint)', async () => {
    const [ix] = await sql`
      select i.indisunique, pg_get_expr(i.indpred, i.indrelid) as pred,
        pg_get_indexdef(i.indexrelid) as def
      from pg_index i where i.indexrelid = 'public.lists_legacy_fingerprint'::regclass`;
    assert.equal(ix.indisunique, true);
    assert.match(ix.pred, /^\(?legacy_fingerprint IS NOT NULL\)?$/);
    assert.match(ix.def, /\(owner_id, legacy_fingerprint\)/);
  });

  it('refuses a plain insert of a fingerprint of 63 characters', async () => {
    await assert.rejects(
      asA(
        users,
        (tx) => tx`insert into public.lists (id, owner_id, legacy_fingerprint)
          values (${M1}, ${A}, ${'a'.repeat(63)})`
      ),
      byCode('23514')
    );
  });
});

describe('a move, as A', () => {
  it('makes the list p_id with its entries in order and the hash of the text', async () => {
    const out = await asA(users, async (tx) => ({
      moved: await move(tx, M1, TREASURE),
      lists: [...(await listsOf(tx))],
      entries: [...(await entriesOf(tx, M1))]
    }));
    assert.deepEqual(out.moved, { id: M1, inserted: true });
    assert.equal(out.lists.length, 1);
    assert.match(out.lists[0].legacy_fingerprint, FP_RE);
    assert.deepEqual(out.lists[0], {
      id: M1,
      owner_id: A,
      name: 'Клад',
      money_mode: 'coin',
      player_note: 'p',
      gm_note: '',
      legacy_fingerprint: sha256(TREASURE)
    });
    assert.deepEqual(out.entries, [
      {
        item_key: 'ci1',
        position: 0,
        quantity: 2,
        price_coins: 150,
        player_note: '',
        gm_note: ''
      },
      {
        item_key: 'q1',
        position: 1,
        quantity: 1,
        price_coins: null,
        player_note: '',
        gm_note: ''
      }
    ]);
  });

  it('carries the notes of the list and of each entry', async () => {
    const text =
      '{"hnote":"g","ids":["ci1"],"meta":{"ci1":{"hnote":"eg","note":"ep"}},"name":"N","note":"p"}';
    const out = await asA(users, async (tx) => {
      await move(tx, M1, text);
      const [l] = await listsOf(tx);
      return { list: [l.player_note, l.gm_note], entries: [...(await entriesOf(tx, M1))] };
    });
    assert.deepEqual(out.list, ['p', 'g']);
    assert.deepEqual(
      out.entries.map((e) => [e.player_note, e.gm_note]),
      [['ep', 'eg']]
    );
  });

  it('answers the first id and false for the same text again, with no new rows', async () => {
    const out = await asA(users, async (tx) => {
      await move(tx, M1, TREASURE);
      const again = await move(tx, M2, TREASURE);
      const [n] = await tx`select (select count(*) from public.lists)::int as lists,
        (select count(*) from public.list_entries)::int as entries`;
      return { again, counts: { ...n } };
    });
    assert.deepEqual(out.again, { id: M1, inserted: false });
    assert.deepEqual(out.counts, { lists: 1, entries: 2 });
  });

  it('makes another list for another text, an empty one included', async () => {
    const out = await asA(users, async (tx) => {
      await move(tx, M1, TREASURE);
      const other = await move(tx, M3, '{"ids":[],"name":""}');
      const lists = await listsOf(tx);
      return {
        other,
        rows: lists.map((l) => [l.id, l.money_mode]),
        entries: (await entriesOf(tx, M3)).length
      };
    });
    assert.deepEqual(out.other, { id: M3, inserted: true });
    assert.deepEqual(out.rows, [
      [M1, 'coin'],
      [M3, 'bag']
    ]);
    assert.equal(out.entries, 0);
  });
});

describe('a move, per owner', () => {
  /* A moved TREASURE as M1 before B signs in on another device. */
  const movedByA = async (tx) => {
    await users(tx);
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ role: 'authenticated', sub: A })}, true)`;
    await move(tx, M1, TREASURE);
  };

  it("gives B its own new row for the text A moved, and leaves A's", async () => {
    const out = await asB(movedByA, async (tx) => {
      const moved = await move(tx, MB, TREASURE);
      const mine = (await listsOf(tx)).map((l) => [l.id, l.owner_id]);
      await tx.unsafe('reset role');
      const all = await tx`select owner_id from public.lists
        where legacy_fingerprint = ${sha256(TREASURE)} order by owner_id`;
      return { moved, mine, owners: all.map((r) => r.owner_id) };
    });
    assert.deepEqual(out.moved, { id: MB, inserted: true });
    assert.deepEqual(out.mine, [[MB, B]]);
    assert.deepEqual(out.owners, [A, B]);
  });
});

describe('a move, when the conflicting row is gone', () => {
  /* The function owner, postgres, has BYPASSRLS, so no policy can hide the
     row from its lookup; a trigger switches the claims to B instead. */
  const claimsToB = `
    create function public.test_claims_to_b() returns trigger language plpgsql as $$
    begin
      perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"${B}"}', true);
      return new;
    end;
    $$;
    create trigger test_claims_to_b before insert on public.lists
      for each row execute function public.test_claims_to_b();`;

  it('answers 40001 when the conflicting row is gone before the lookup', async () => {
    let refused = null;
    const out = await asA(users, async (tx) => {
      const first = await move(tx, M1, TREASURE);
      await tx.unsafe('reset role');
      await tx.unsafe(claimsToB);
      await tx.unsafe('set local role authenticated');
      try {
        await tx.savepoint((sp) => move(sp, M2, TREASURE));
      } catch (err) {
        refused = err;
      }
      const [n] = await tx`select (select count(*) from public.list_entries)::int as entries`;
      return {
        first,
        lists: (await listsOf(tx)).map((l) => [l.id, l.owner_id]),
        entries: n.entries
      };
    });
    assert.ok(refused, 'the second move was not refused');
    assert.equal(refused.code, '40001', refused.message);
    assert.match(refused.message, /^move_legacy_list: /);
    assert.deepEqual(out.first, { id: M1, inserted: true });
    assert.deepEqual(out.lists, [[M1, A]]);
    assert.equal(out.entries, 2);
  });
});

describe('a move, with no user', () => {
  it('refuses a caller with no user id', async () => {
    await assert.rejects(
      asRole(sql, { role: 'authenticated', setup: users }, (tx) => move(tx, M1, TREASURE)),
      byCode('28000', /not signed in/)
    );
  });

  it('refuses anon', async () => {
    await assert.rejects(
      asRole(sql, { role: 'anon', setup: users }, (tx) => move(tx, M1, TREASURE)),
      /permission denied/
    );
  });
});

describe('the count limits and a move', () => {
  it('moves 55 lists, then refuses a plain insert of the 56th', async () => {
    let moved = 0;
    await assert.rejects(
      asA(users, async (tx) => {
        for (let n = 1; n <= 55; n++) {
          const r = await move(tx, id(4000 + n), `{"ids":[],"name":"L${n}"}`);
          if (r.inserted) moved++;
        }
        await tx`insert into public.lists (id, owner_id) values (${id(4100)}, ${A})`;
      }),
      limitError('lists_per_owner', '50')
    );
    assert.equal(moved, 55);
  });

  it('refuses a plain insert past the limit after a repeated move answers false', async () => {
    const fiftyLists = async (tx) => {
      await users(tx);
      await tx`insert into public.lists (id, owner_id)
        select gen_random_uuid(), ${A} from generate_series(1, 50)`;
    };
    let again = null;
    await assert.rejects(
      asA(fiftyLists, async (tx) => {
        await move(tx, M1, TREASURE);
        again = await move(tx, M2, TREASURE);
        await tx`insert into public.lists (id, owner_id) values (${id(4100)}, ${A})`;
      }),
      limitError('lists_per_owner', '50')
    );
    assert.deepEqual(again, { id: M1, inserted: false });
  });

  /* A browser list over the entry limit moves whole; a plain insert after
     it still meets the limit. */
  it('moves a list of 120 entries, then refuses a plain insert of one more', async () => {
    const ids = Array.from({ length: 120 }, (_, i) => `k${i + 1}`);
    let entries = 0;
    await assert.rejects(
      asA(users, async (tx) => {
        await move(tx, M1, JSON.stringify({ ids, name: 'Big' }));
        entries = (await entriesOf(tx, M1)).length;
        await tx`insert into public.list_entries (id, list_id, item_key, position)
          values (${id(4200)}, ${M1}, 'q1', 120)`;
      }),
      limitError('entries_per_list', '100')
    );
    assert.equal(entries, 120);
  });
});

describe('a text that is not a valid list', () => {
  const refused = [
    ['not JSON', 'not json', /not a list/],
    ['an array', '[]', /not a list/],
    ['an unknown key', '{"extra":1,"ids":[]}', /unknown key extra/],
    ['an id with a space', '{"ids":["c i1"]}', /invalid id "c i1"/],
    ['a repeated id', '{"ids":["ci1","ci1"]}', /repeated id ci1/],
    ['qty 100', '{"ids":["ci1"],"meta":{"ci1":{"qty":100}}}', /invalid qty of ci1/],
    ['gold 0', '{"ids":["ci1"],"meta":{"ci1":{"gold":0}}}', /invalid gold of ci1/],
    [
      'a meta key not in ids',
      '{"ids":["ci1"],"meta":{"q1":{"qty":2}}}',
      /meta of q1 is not in ids/
    ],
    [
      'a name of 201 characters',
      JSON.stringify({ ids: [], name: 'x'.repeat(201) }),
      /invalid name/
    ],
    ['money "gold"', '{"ids":[],"money":"gold"}', /invalid money/],
    ['a name that is not text', '{"ids":[],"name":1}', /invalid name/],
    ['a note that is not text', '{"ids":[],"note":1}', /invalid note/],
    ['a GM note that is not text', '{"hnote":1,"ids":[]}', /invalid hnote/],
    [
      'more than 5000 ids',
      JSON.stringify({ ids: Array.from({ length: 5001 }, (_, i) => `k${i}`) }),
      /more than 5000 ids/
    ],
    ['a text of more than 1048576 characters', 'x'.repeat(1048577), /too long/],
    ['meta that is not an object', '{"ids":[],"meta":[]}', /: invalid meta$/],
    [
      'an entry meta that is not an object',
      '{"ids":["ci1"],"meta":{"ci1":1}}',
      /invalid meta of ci1/
    ],
    [
      'an unknown meta key',
      '{"ids":["ci1"],"meta":{"ci1":{"x":1}}}',
      /unknown meta key x of ci1/
    ],
    [
      'a qty that is not a number',
      '{"ids":["ci1"],"meta":{"ci1":{"qty":"2"}}}',
      /invalid qty of ci1/
    ],
    [
      'an entry note that is not text',
      '{"ids":["ci1"],"meta":{"ci1":{"note":1}}}',
      /invalid note of ci1/
    ]
  ];
  for (const [what, text, field] of refused) {
    it(`refuses ${what} with 22023 and the field named`, async () => {
      await assert.rejects(
        asA(users, (tx) => move(tx, M1, text)),
        byCode('22023', field)
      );
    });
  }

  it('refuses a null list id with 22023', async () => {
    await assert.rejects(
      asA(users, (tx) => move(tx, null, TREASURE)),
      byCode('22023', /no list id/)
    );
  });
});
