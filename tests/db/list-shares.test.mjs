/*
  list_shares and its functions over six roles: no token, a player link, a
  GM link, the owner, another signed-in user, and a stopped link. A link's
  token reads the list's projection as anon; a player link shows no GM
  note; only the owner makes or stops a link, and never by a direct
  write; another user saves a copy that keeps only the notes its
  link shows; a stopped link reads as no link. docs/specs/FEATURES.md,
  "Lists".
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect } from './roles.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const LA = id(1001);
const E1 = id(1101);
const E2 = id(1102);
const COPY = id(2002);
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

/* A's list LA with both notes and two entries, the second first in order,
   each with both notes; B signed up and owns nothing. */
const world = async (tx) => {
  await tx`insert into auth.users (id) values (${A}), (${B})`;
  await tx`insert into public.lists (id, owner_id, name, money_mode, player_note, gm_note)
    values (${LA}, ${A}, 'Shop', 'coin', 'for players', 'for the GM')`;
  await tx`insert into public.list_entries
    (id, list_id, item_key, position, quantity, price_coins, player_note, gm_note) values
    (${E1}, ${LA}, 'ci1', 1, 2, 150, 'p1', 'g1'),
    (${E2}, ${LA}, 'q1', 0, 1, null, 'p2', 'g2')`;
};
/* The world plus A's active share of `audience`; `tokens.player` or
   `tokens.gm` holds its token after setup. */
const tokens = {};
const shareIds = {};
const withShare =
  (...audiences) =>
  async (tx) => {
    await world(tx);
    for (const audience of audiences) {
      const [s] = await tx`insert into public.list_shares (list_id, audience)
        values (${LA}, ${audience}) returning id, token`;
      tokens[audience] = s.token;
      shareIds[audience] = s.id;
    }
  };
const asA = (setup, fn) => asRole(sql, { role: 'authenticated', sub: A, setup }, fn);
const asB = (setup, fn) => asRole(sql, { role: 'authenticated', sub: B, setup }, fn);
const asAnon = (setup, fn) => asRole(sql, { role: 'anon', setup }, fn);
const shared = async (tx, token) => {
  const [r] = await tx`select public.get_shared_list(${token}) as v`;
  return r.v;
};
const byCode = (code, text) => (err) => {
  assert.equal(err.code, code, err.message);
  if (text) assert.match(err.message, text);
  return true;
};

describe('list_shares grants', () => {
  it('grants authenticated select only, anon nothing, service_role select and delete', async () => {
    const privs = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];
    const rows = await sql`
      select r.role, p.priv
      from unnest(array['anon', 'authenticated', 'service_role']) as r(role)
      cross join unnest(${privs}::text[]) as p(priv)
      where has_table_privilege(r.role, 'public.list_shares', p.priv)
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
  });

  it('pins EXECUTE on each function for anon, authenticated and service_role', async () => {
    const rows = await sql`
      select p.oid::regprocedure::text as fn,
        has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
        has_function_privilege('service_role', p.oid, 'EXECUTE') as service,
        p.prosecdef, p.proconfig
      from pg_proc p
      where p.pronamespace = 'public'::regnamespace
        and p.proname in ('create_list_share', 'revoke_list_share', 'get_shared_list',
          'clone_shared_list')
      order by 1`;
    const pinned = (anon) => ({
      anon,
      authed: true,
      service: false,
      prosecdef: true,
      proconfig: ['search_path=public, pg_temp']
    });
    assert.deepEqual(Object.fromEntries(rows.map(({ fn, ...r }) => [fn, r])), {
      'clone_shared_list(text,uuid)': pinned(false),
      'create_list_share(uuid,text)': pinned(false),
      'get_shared_list(text)': pinned(true),
      'revoke_list_share(uuid)': pinned(false)
    });
  });

  it('makes a 43-character base64url token by default, a fresh one per share', async () => {
    const [player, gm] = await asA(withShare('player', 'gm'), () => [tokens.player, tokens.gm]);
    assert.match(player, TOKEN_RE);
    assert.match(gm, TOKEN_RE);
    assert.notEqual(player, gm);
  });
});

describe('no token', () => {
  for (const token of [null, 'nonsense', 'x'.repeat(43)]) {
    it(`answers null for ${JSON.stringify(token)} as anon and as authenticated`, async () => {
      assert.equal(await asAnon(withShare('player'), (tx) => shared(tx, token)), null);
      assert.equal(await asB(withShare('player'), (tx) => shared(tx, token)), null);
    });
  }

  it('refuses anon a read of list_shares', async () => {
    await assert.rejects(
      asAnon(withShare('player'), (tx) => tx`select id from public.list_shares`),
      /permission denied/
    );
  });

  it('refuses anon every function but get_shared_list()', async () => {
    for (const call of [
      (tx) => tx`select public.create_list_share(${LA}, 'player')`,
      (tx) => tx`select public.clone_shared_list(${tokens.player}, ${COPY})`
    ]) {
      await assert.rejects(asAnon(withShare('player'), call), /permission denied/);
    }
  });
});

describe('a player link', () => {
  it('reads the projection as anon, with no GM note anywhere, in order', async () => {
    const v = await asAnon(withShare('player'), (tx) => shared(tx, tokens.player));
    assert.equal(v.audience, 'player');
    assert.equal(typeof v.revision, 'number');
    assert.match(v.topic_key, /^[0-9a-f-]{36}$/);
    assert.deepEqual(v.list, { name: 'Shop', money_mode: 'coin', player_note: 'for players' });
    assert.deepEqual(v.entries, [
      {
        id: E2,
        item_key: 'q1',
        source: 'official',
        snapshot: null,
        position: 0,
        quantity: 1,
        price_coins: null,
        player_note: 'p2'
      },
      {
        id: E1,
        item_key: 'ci1',
        source: 'official',
        snapshot: null,
        position: 1,
        quantity: 2,
        price_coins: 150,
        player_note: 'p1'
      }
    ]);
  });

  it("carries the list's revision and updated_at, and the share's topic key", async () => {
    const out = await asA(withShare('player'), async (tx) => {
      const v = await shared(tx, tokens.player);
      const [l] = await tx`select revision::int as r, to_jsonb(updated_at) #>> '{}' as u
        from public.lists where id = ${LA}`;
      const [s] =
        await tx`select topic_key from public.list_shares where id = ${shareIds.player}`;
      return { v, revision: l.r, updated: l.u, topic: s.topic_key };
    });
    assert.equal(out.v.revision, out.revision);
    assert.equal(typeof out.v.updated_at, 'string');
    assert.equal(out.v.updated_at, out.updated);
    assert.equal(out.v.topic_key, out.topic);
  });
});

describe('a GM link', () => {
  it('reads both notes on the list and on every entry', async () => {
    const v = await asAnon(withShare('gm'), (tx) => shared(tx, tokens.gm));
    assert.equal(v.audience, 'gm');
    assert.deepEqual(v.list, {
      name: 'Shop',
      money_mode: 'coin',
      player_note: 'for players',
      gm_note: 'for the GM'
    });
    assert.deepEqual(
      v.entries.map((e) => [e.player_note, e.gm_note]),
      [
        ['p2', 'g2'],
        ['p1', 'g1']
      ]
    );
  });

  it('reads an empty list as no entries', async () => {
    const setup = async (tx) => {
      await withShare('gm')(tx);
      await tx`delete from public.list_entries`;
    };
    const v = await asAnon(setup, (tx) => shared(tx, tokens.gm));
    assert.deepEqual(v.entries, []);
  });
});

describe('the owner', () => {
  it('reads both shares with their tokens', async () => {
    const rows = await asA(
      withShare('player', 'gm'),
      (tx) => tx`select audience, token from public.list_shares order by audience`
    );
    assert.deepEqual(
      rows.map((r) => [r.audience, r.token]),
      [
        ['gm', tokens.gm],
        ['player', tokens.player]
      ]
    );
  });

  it('gets the same share from a second create of one audience', async () => {
    const [first, second, count] = await asA(world, async (tx) => {
      const [a] = await tx`select * from public.create_list_share(${LA}, 'player')`;
      const [b] = await tx`select * from public.create_list_share(${LA}, 'player')`;
      const [n] = await tx`select count(*)::int as n from public.list_shares`;
      return [a, b, n.n];
    });
    assert.match(first.token, TOKEN_RE);
    assert.deepEqual(second, first);
    assert.equal(count, 1);
  });

  it('refuses an unknown audience', async () => {
    await assert.rejects(
      asA(world, (tx) => tx`select * from public.create_list_share(${LA}, 'everyone')`),
      byCode('22023', /unknown audience/)
    );
  });

  it('stops a link, twice without error', async () => {
    const reads = await asA(withShare('player'), async (tx) => {
      await tx`select public.revoke_list_share(${shareIds.player})`;
      await tx`select public.revoke_list_share(${shareIds.player})`;
      return shared(tx, tokens.player);
    });
    assert.equal(reads, null);
  });

  it('reads a stopped share with its revoked_at', async () => {
    const rows = await asA(withShare('player'), async (tx) => {
      await tx`select public.revoke_list_share(${shareIds.player})`;
      return tx`select id, revoked_at from public.list_shares`;
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, shareIds.player);
    assert.notEqual(rows[0].revoked_at, null);
  });

  it('makes a new link after stopping the old one: a new token and topic key', async () => {
    const out = await asA(withShare('player'), async (tx) => {
      const [before] =
        await tx`select topic_key from public.list_shares where id = ${shareIds.player}`;
      await tx`select public.revoke_list_share(${shareIds.player})`;
      const [s] = await tx`select * from public.create_list_share(${LA}, 'player')`;
      const [after] = await tx`select topic_key from public.list_shares where id = ${s.id}`;
      return { s, topicChanged: before.topic_key !== after.topic_key };
    });
    assert.notEqual(out.s.id, shareIds.player);
    assert.notEqual(out.s.token, tokens.player);
    assert.match(out.s.token, TOKEN_RE);
    assert.equal(out.topicChanged, true);
  });

  it('may not insert, update or delete a share directly', async () => {
    for (const write of [
      (tx) => tx`insert into public.list_shares (list_id, audience) values (${LA}, 'player')`,
      (tx) => tx`update public.list_shares set revoked_at = null`,
      (tx) => tx`delete from public.list_shares`
    ]) {
      await assert.rejects(asA(withShare('player'), write), /permission denied/);
    }
  });

  it('loses its shares with the list', async () => {
    const left = await asA(withShare('player', 'gm'), async (tx) => {
      await tx`delete from public.lists where id = ${LA}`;
      await tx.unsafe('reset role');
      return shared(tx, tokens.gm);
    });
    assert.equal(left, null);
  });
});

describe('another signed-in user', () => {
  it("sees no share of A's list", async () => {
    const rows = await asB(
      withShare('player', 'gm'),
      (tx) => tx`select id from public.list_shares`
    );
    assert.deepEqual([...rows], []);
  });

  it('cannot make or stop a share of it', async () => {
    for (const call of [
      (tx) => tx`select * from public.create_list_share(${LA}, 'player')`,
      (tx) => tx`select public.revoke_list_share(${shareIds.player})`
    ]) {
      await assert.rejects(asB(withShare('player'), call), byCode('42501', /not the owner/));
    }
  });

  it('reads a GM link read-only: the notes, and no write to the list', async () => {
    const out = await asB(withShare('gm'), async (tx) => ({
      gm: (await shared(tx, tokens.gm)).list.gm_note,
      updated: [...(await tx`update public.lists set name = 'x' where id = ${LA} returning id`)]
    }));
    assert.deepEqual(out, { gm: 'for the GM', updated: [] });
  });

  const copyOf = (audience) =>
    asB(withShare(audience), async (tx) => {
      const [r] = await tx`select public.clone_shared_list(${tokens[audience]}, ${COPY}) as id`;
      const [again] =
        await tx`select public.clone_shared_list(${tokens[audience]}, ${COPY}) as id`;
      const lists = await tx`select id, owner_id, name, money_mode, player_note, gm_note
        from public.lists`;
      const entries = await tx`select id, item_key, position, quantity, price_coins,
          player_note, gm_note
        from public.list_entries order by position`;
      return { id: r.id, again: again.id, lists: [...lists], entries: [...entries] };
    });

  it("saves a player link's copy without GM notes, entries with new ids", async () => {
    const out = await copyOf('player');
    assert.equal(out.id, COPY);
    assert.equal(out.again, COPY);
    assert.deepEqual(out.lists, [
      {
        id: COPY,
        owner_id: B,
        name: 'Shop',
        money_mode: 'coin',
        player_note: 'for players',
        gm_note: ''
      }
    ]);
    assert.deepEqual(
      out.entries.map(({ id: entryId, ...e }) => {
        assert.ok(entryId !== E1 && entryId !== E2);
        return e;
      }),
      [
        {
          item_key: 'q1',
          position: 0,
          quantity: 1,
          price_coins: null,
          player_note: 'p2',
          gm_note: ''
        },
        {
          item_key: 'ci1',
          position: 1,
          quantity: 2,
          price_coins: 150,
          player_note: 'p1',
          gm_note: ''
        }
      ]
    );
  });

  it("saves a GM link's copy with the GM notes", async () => {
    const out = await copyOf('gm');
    assert.equal(out.lists[0].gm_note, 'for the GM');
    assert.deepEqual(
      out.entries.map((e) => e.gm_note),
      ['g2', 'g1']
    );
  });

  it("counts the copy against B's list limit", async () => {
    const setup = async (tx) => {
      await withShare('player')(tx);
      await tx`insert into public.lists (id, owner_id)
        select gen_random_uuid(), ${B} from generate_series(1, 50)`;
    };
    await assert.rejects(
      asB(setup, (tx) => tx`select public.clone_shared_list(${tokens.player}, ${COPY})`),
      (err) => err.message === 'limit: lists_per_owner' && err.detail === '50'
    );
  });

  it("counts the copy's entries against B's entry limit", async () => {
    const setup = async (tx) => {
      await withShare('player')(tx);
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${B}, 'entries_per_list', 1)`;
    };
    await assert.rejects(
      asB(setup, (tx) => tx`select public.clone_shared_list(${tokens.player}, ${COPY})`),
      (err) => err.message === 'limit: entries_per_list' && err.detail === '1'
    );
  });

  it("is refused a copy under the id of A's list", async () => {
    await assert.rejects(
      asB(
        withShare('player'),
        (tx) => tx`select public.clone_shared_list(${tokens.player}, ${LA})`
      ),
      byCode('42501', /belongs to another list/)
    );
  });

  it('is refused a copy when signed out', async () => {
    await assert.rejects(
      asRole(
        sql,
        { role: 'authenticated', setup: withShare('player') },
        (tx) => tx`select public.clone_shared_list(${tokens.player}, ${COPY})`
      ),
      byCode('28000', /not signed in/)
    );
  });
});

describe('a stopped link', () => {
  const stopped = async (tx) => {
    await withShare('player')(tx);
    await tx`update public.list_shares set revoked_at = now()`;
  };

  it('reads null and copies nothing', async () => {
    assert.equal(await asAnon(stopped, (tx) => shared(tx, tokens.player)), null);
    await assert.rejects(
      asB(stopped, (tx) => tx`select public.clone_shared_list(${tokens.player}, ${COPY})`),
      byCode('22023', /unknown link/)
    );
  });
});
