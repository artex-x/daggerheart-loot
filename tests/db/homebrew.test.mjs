/*
  The author's homebrew: homebrew_books (sources with sections) and
  homebrew_items, each row its owner's. The validators accept and refuse
  every case of docs/fixtures/homebrew/ as app/src/lib/homebrew.ts does, and
  homebrew_snapshot_of() writes each snapshot case, with its cards, as
  recordOf() does. The cards themselves are homebrew-cards.test.mjs's. A key
  is pinned after insert; the count limits refuse the 21st source and the
  101st item; my_limit() reads the caller's own limit. A list entry is an
  official record, a reference to an item the list's owner holds, or a
  frozen copy with a valid snapshot of its own key; an edit bumps the lists
  that refer, a delete takes the owner's references. A share projects a
  reference from the live item; a copy freezes it for another user. One
  homebrew message per owner per committed transaction.
  docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md;
  docs/decisions/2026-09-30-a-frozen-copy-embeds-its-source-a-reference-must-exist.md.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asRole, commitAs, connect, messagesTo, realtimePartition } from './roles.mjs';

const FIXTURES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'docs',
  'fixtures',
  'homebrew'
);
const fixture = (name) => JSON.parse(readFileSync(path.join(FIXTURES, name), 'utf8'));
const ITEMS = fixture('items.json');
const BOOKS = fixture('books.json');
const SNAPSHOTS = fixture('snapshots.json');

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const BA = id(8001);
const BB = id(8002);
const IA = id(8101);
const IP = id(8102);
const IB = id(8103);
const LA = id(8201);
const LA2 = id(8202);
const LB = id(8203);
const ALDER = 'hb_alderworkshopaaa';
const BLADES = 'hb_sectbladesaaaaaa';
const AXE = 'hb_emberaxeaaaaaaaa';
const POTION = 'hb_smithpotionaaaaa';
const MISSING = 'hb_nosuchitemaaaaaa';
const PRIVS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];

const BOOK = {
  ru: 'Мастерская Ольхи',
  en: 'Alder Workshop',
  sections: [
    { key: 'hb_sectpistolsaaaaa', ru: 'Пистоли', en: 'Pistols' },
    { key: BLADES, ru: 'Холодное оружие', en: 'Blades' }
  ]
};
const AXE_CONTENT = {
  kind: 'equip',
  ru: 'Топор Тлеющих Углей',
  en: 'Ember Axe',
  section: BLADES,
  eq: {
    t: 'weapon',
    tier: 2,
    cls: 'mag',
    tr: 'spellcast',
    rg: 'melee',
    dmg: 'd10+2',
    dt: 'mag',
    bu: 2
  }
};
const POTION_CONTENT = { kind: 'consumable', ru: 'Настой кузнеца' };
const POTION_SNAPSHOT = {
  ...POTION_CONTENT,
  id: POTION,
  src: 'homebrew',
  en: 'Настой кузнеца',
  ende: '',
  rud: ''
};

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const users = (tx) => tx`insert into auth.users (id) values (${A}), (${B})`;
/* A's source BA with the axe IA in it and the potion IP in none; B's source BB with an
   item IB under A's axe key; A's list LA refers to the axe and holds a frozen potion, A's
   list LA2 holds only a frozen axe; B's list LB holds a frozen axe. */
const world = async (tx) => {
  await users(tx);
  await tx`insert into public.homebrew_books (id, owner_id, key, content) values
    (${BA}, ${A}, ${ALDER}, ${tx.json(BOOK)}),
    (${BB}, ${B}, ${ALDER}, ${tx.json({ en: 'B' })})`;
  await tx`insert into public.homebrew_items (id, owner_id, key, book_id, content) values
    (${IA}, ${A}, ${AXE}, ${BA}, ${tx.json(AXE_CONTENT)}),
    (${IP}, ${A}, ${POTION}, null, ${tx.json(POTION_CONTENT)}),
    (${IB}, ${B}, ${AXE}, ${BB}, ${tx.json({ kind: 'item', en: 'B axe' })})`;
  await tx`insert into public.lists (id, owner_id, name) values
    (${LA}, ${A}, 'A'), (${LA2}, ${A}, 'A2'), (${LB}, ${B}, 'B')`;
  const frozenAxe = await snapshotOf(tx, AXE, AXE_CONTENT, { ...BOOK, key: ALDER });
  await tx`insert into public.list_entries (id, list_id, item_key, source, snapshot, position)
    values
      (${id(8301)}, ${LA}, ${AXE}, 'homebrew', null, 0),
      (${id(8302)}, ${LA}, ${POTION}, 'homebrew', ${tx.json(POTION_SNAPSHOT)}, 1),
      (${id(8303)}, ${LA2}, ${AXE}, 'homebrew', ${tx.json(frozenAxe)}, 0),
      (${id(8304)}, ${LB}, ${AXE}, 'homebrew', ${tx.json(frozenAxe)}, 0)`;
};
const snapshotOf = async (tx, key, content, book) => {
  const [{ v }] = await tx`select public.homebrew_snapshot_of(${key}, ${tx.json(content)},
    ${book === null ? null : tx.json(book)}::jsonb, null) as v`;
  return v;
};
const asA = (setup, fn) => asRole(sql, { role: 'authenticated', sub: A, setup }, fn);
/* Reads as the connection's own role, which row level security does not bind, then acts
   as `role` again. */
const unbound = async (tx, fn, role = 'authenticated') => {
  await tx.unsafe('reset role');
  const out = await fn(tx);
  await tx.unsafe(`set local role ${role}`);
  return out;
};
/* The call inside a savepoint, so the transaction reads on after a refusal; answers the
   error, or null. */
const refused = (tx, fn) =>
  tx
    .savepoint((sp) => fn(sp))
    .then(
      () => null,
      (err) => err
    );
const byCode = (code, text) => (err) => {
  assert.ok(err, `expected ${code}, got no error`);
  assert.equal(err.code, code, err.message);
  if (text) assert.match(err.message, text);
  return true;
};
const revisions = async (tx) =>
  Object.fromEntries(
    (await tx`select id, revision::int as r from public.lists`).map((r) => [r.id, r.r])
  );

describe('homebrew grants and functions', () => {
  for (const table of ['homebrew_books', 'homebrew_cards', 'homebrew_items']) {
    it(`grants ${table} to authenticated in full, to service_role select and delete, anon nothing, with row level security on`, async () => {
      const rows = await sql`
        select r.role, p.priv
        from unnest(array['anon', 'authenticated', 'service_role']) as r(role)
        cross join unnest(${PRIVS}::text[]) as p(priv)
        where has_table_privilege(r.role, ${'public.' + table}, p.priv)
        order by r.role, p.priv`;
      const held = rows.map((r) => `${r.role}: ${r.priv}`);
      assert.deepEqual(
        held.filter((h) => !h.startsWith('service_role')),
        [
          'authenticated: DELETE',
          'authenticated: INSERT',
          'authenticated: SELECT',
          'authenticated: UPDATE'
        ]
      );
      assert.ok(held.includes('service_role: SELECT') && held.includes('service_role: DELETE'));
      assert.ok(
        !held.includes('service_role: INSERT') && !held.includes('service_role: UPDATE')
      );
      const [r] =
        await sql`select relrowsecurity from pg_class where oid = ${'public.' + table}::regclass`;
      assert.equal(r.relrowsecurity, true);
    });
  }

  it('pins the definer, the search path and EXECUTE per role of every new or re-created function', async () => {
    const rows = await sql`
      select p.oid::regprocedure::text as fn,
        has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
        has_function_privilege('service_role', p.oid, 'EXECUTE') as service,
        p.prosecdef, p.proconfig
      from pg_proc p
      where p.pronamespace = 'public'::regnamespace
        and (p.proname like 'homebrew\\_%' or p.proname in ('list_entries_reference_exists',
          'my_limit', 'get_shared_list', 'clone_shared_list'))
      order by 1`;
    const pin = (prosecdef, anon, authed) => ({
      anon,
      authed,
      /* No new function grants service_role anything (as effective_limit()). */
      service: false,
      prosecdef,
      proconfig: ['search_path=public, pg_temp']
    });
    const validator = pin(false, false, true);
    assert.deepEqual(Object.fromEntries(rows.map(({ fn, ...r }) => [fn, r])), {
      'clone_shared_list(text,uuid)': pin(true, false, true),
      'get_shared_list(text)': pin(true, true, true),
      'homebrew_book_valid(jsonb)': validator,
      'homebrew_books_before_update()': pin(false, false, false),
      'homebrew_books_limit()': pin(true, false, false),
      'homebrew_books_touch()': pin(true, false, false),
      'homebrew_broadcast()': pin(true, false, false),
      'homebrew_card_valid(text,jsonb)': validator,
      'homebrew_cards_before_update()': pin(false, false, false),
      'homebrew_cards_limit()': pin(true, false, false),
      'homebrew_cards_touch()': pin(true, false, false),
      'homebrew_content_valid(jsonb)': validator,
      'homebrew_ids_ok(jsonb,text,integer)': validator,
      'homebrew_items_before_delete()': pin(true, false, false),
      'homebrew_items_before_update()': pin(false, false, false),
      'homebrew_items_limit()': pin(true, false, false),
      'homebrew_items_touch()': pin(true, false, false),
      'homebrew_key_ok(text)': validator,
      'homebrew_names_ok(jsonb,integer)': validator,
      'homebrew_snapshot_of(text,jsonb,jsonb,jsonb)': validator,
      'homebrew_snapshot_valid(jsonb)': validator,
      'homebrew_text_ok(jsonb,text,integer)': validator,
      'list_entries_reference_exists()': pin(true, false, false),
      'my_limit(text)': pin(true, false, true)
    });
  });

  it('refuses anon a read of the three tables and my_limit()', async () => {
    for (const call of [
      (tx) => tx`select id from public.homebrew_books`,
      (tx) => tx`select id from public.homebrew_cards`,
      (tx) => tx`select id from public.homebrew_items`,
      (tx) => tx`select public.my_limit('homebrew_items_per_owner')`
    ]) {
      await assert.rejects(
        asRole(sql, { role: 'anon', setup: world }, call),
        /permission denied/
      );
    }
  });
});

describe('the validators over docs/fixtures/homebrew/', () => {
  const check = async (fn, value) => {
    const [{ ok }] = await sql.unsafe(`select public.${fn}($1::text::jsonb) as ok`, [
      JSON.stringify(value)
    ]);
    return ok;
  };

  for (const [file, fn, cases] of [
    ['items.json', 'homebrew_content_valid', ITEMS],
    ['books.json', 'homebrew_book_valid', BOOKS]
  ]) {
    it(`accepts every valid case of ${file} and refuses every invalid one`, async () => {
      const wrong = [];
      for (const c of cases.valid)
        if ((await check(fn, c.content)) !== true) wrong.push(c.name);
      for (const c of cases.invalid) {
        if ((await check(fn, c.content)) !== false) wrong.push(c.name);
      }
      assert.deepEqual(wrong, []);
    });
  }

  it('writes every snapshot case as its snapshot, valid, and refuses every invalid one', async () => {
    const wrong = [];
    for (const c of SNAPSHOTS.valid) {
      const [{ same, ok }] = await sql.unsafe(
        `select public.homebrew_snapshot_of($1, $2::text::jsonb, $3::text::jsonb,
             $5::text::jsonb) = $4::text::jsonb as same,
           public.homebrew_snapshot_valid($4::text::jsonb) as ok`,
        [
          c.key,
          JSON.stringify(c.content),
          c.book === null ? null : JSON.stringify(c.book),
          JSON.stringify(c.snapshot),
          c.cards === undefined ? null : JSON.stringify(c.cards)
        ]
      );
      if (!same || !ok) wrong.push(c.name);
    }
    for (const c of SNAPSHOTS.invalid) {
      if ((await check('homebrew_snapshot_valid', c.snapshot)) !== false) wrong.push(c.name);
    }
    assert.deepEqual(wrong, []);
  });

  it('keeps the R7 maximal snapshot under 32768 bytes and takes it as a frozen entry', async () => {
    const max = SNAPSHOTS.valid.find((c) => c.key === 'hb_maximalitemaaaaa');
    const out = await asA(world, async (tx) => {
      const [{ n }] = await tx`select octet_length(${tx.json(max.snapshot)}::jsonb::text) as n`;
      await tx`insert into public.list_entries (id, list_id, item_key, source, snapshot, position)
        values (${id(8310)}, ${LA}, ${max.key}, 'homebrew', ${tx.json(max.snapshot)}, 5)`;
      return n;
    });
    assert.ok(out > 25000 && out < 32768, String(out));
  });

  it('takes only the key shape', async () => {
    const rows = await sql`select k, public.homebrew_key_ok(k) as ok
      from unnest(array['hb_aaaaaaaaaaaaaaaa', 'hb_2345672345672345', 'hb_aaaaaaaaaaaaaaa',
        'hb_aaaaaaaaaaaaaaaaa', 'hb_AAAAAAAAAAAAAAAA', 'hb_aaaaaaaaaaaaaaa1', 'ci1', null])
        as t(k)`;
    assert.deepEqual(
      rows.map((r) => r.ok),
      [true, true, false, false, false, false, false, false]
    );
  });

  it('refuses a name holding U+0007 by the check of the table', async () => {
    await assert.rejects(
      asA(
        users,
        (tx) => tx`insert into public.homebrew_items (id, owner_id, key, content)
          values (${IA}, ${A}, ${AXE}, ${tx.json({ kind: 'item', ru: 'Колокол\u0007' })})`
      ),
      byCode('23514', /homebrew_items_content_check/)
    );
  });
});

describe('the rows', () => {
  it("reads, changes and deletes only the caller's rows, and refuses an item in B's source", async () => {
    const out = await asA(world, async (tx) => ({
      books: (await tx`select key from public.homebrew_books`).map((r) => r.key),
      items: (await tx`select id from public.homebrew_items order by id`).map((r) => r.id),
      updated: (
        await tx`update public.homebrew_items set content = ${tx.json({ kind: 'item', ru: 'x' })}
          where id = ${IB} returning id`
      ).length,
      deleted: (await tx`delete from public.homebrew_books where id = ${BB} returning id`)
        .length,
      err: await refused(
        tx,
        (sp) => sp`insert into public.homebrew_items (id, owner_id, key, book_id, content)
          values (${id(8110)}, ${A}, 'hb_otheraaaaaaaaaaa', ${BB}, ${sp.json({ kind: 'item', ru: 'x' })})`
      ),
      moved: await refused(
        tx,
        (sp) => sp`update public.homebrew_items set book_id = ${BB} where id = ${IA}`
      )
    }));
    assert.deepEqual(out.books, [ALDER]);
    assert.deepEqual(out.items, [IA, IP]);
    assert.equal(out.updated, 0);
    assert.equal(out.deleted, 0);
    byCode('42501', /row-level security/)(out.err);
    byCode('42501', /row-level security/)(out.moved);
  });

  it('refuses a repeated key per owner and takes one key for two owners', async () => {
    const out = await asA(world, async (tx) =>
      refused(
        tx,
        (sp) => sp`insert into public.homebrew_items (id, owner_id, key, content)
          values (${id(8111)}, ${A}, ${POTION}, ${sp.json(POTION_CONTENT)})`
      )
    );
    byCode('23505', /homebrew_items_owner_id_key_key/)(out);
    /* The world already holds the axe key for A and for B. */
  });

  it('pins the id, the owner, the key and the creation time, and moves the revision and the edit time', async () => {
    /* Written a day ago: now() is one value for the whole transaction. */
    const aged = async (tx) => {
      await users(tx);
      await tx`insert into public.homebrew_books (id, owner_id, key, content, created_at, updated_at)
        values (${BA}, ${A}, ${ALDER}, ${tx.json(BOOK)}, now() - interval '2 days',
          now() - interval '1 day')`;
      await tx`insert into public.homebrew_items (id, owner_id, key, content, created_at, updated_at)
        values (${IP}, ${A}, ${POTION}, ${tx.json(POTION_CONTENT)}, now() - interval '2 days',
          now() - interval '1 day')`;
    };
    const out = await asA(aged, async (tx) => {
      const [was] = await tx`select * from public.homebrew_items where id = ${IP}`;
      const [bookWas] = await tx`select * from public.homebrew_books where id = ${BA}`;
      await tx`update public.homebrew_items set id = ${id(8199)}, owner_id = ${B},
        key = 'hb_changedaaaaaaaaa', created_at = now(), revision = 40,
        content = ${tx.json({ kind: 'item', ru: 'Другое' })} where id = ${IP}`;
      await tx`update public.homebrew_books set key = 'hb_changedaaaaaaaaa', revision = 40
        where id = ${BA}`;
      const [now] = await unbound(
        tx,
        (u) => u`select * from public.homebrew_items where id = ${IP}`
      );
      const [bookNow] = await tx`select * from public.homebrew_books where id = ${BA}`;
      return { was, now, bookWas, bookNow };
    });
    for (const [was, now] of [
      [out.was, out.now],
      [out.bookWas, out.bookNow]
    ]) {
      assert.equal(now.id, was.id);
      assert.equal(now.owner_id, was.owner_id);
      assert.equal(now.key, was.key);
      assert.deepEqual(now.created_at, was.created_at);
      assert.equal(Number(now.revision), Number(was.revision) + 1);
      assert.ok(now.updated_at > was.updated_at);
    }
    assert.deepEqual(out.now.content, { kind: 'item', ru: 'Другое' });
  });

  const many = (tx, table, owner, n, from = 0) =>
    table === 'homebrew_books'
      ? tx`insert into public.homebrew_books (id, owner_id, key, content)
          select gen_random_uuid(), ${owner},
            'hb_' || lpad(translate((g + ${from}::int)::text, '0123456789', 'abcdefghij'), 16, 'a'),
            '{"ru": "Источник"}'::jsonb
          from generate_series(1, ${n}::int) as g`
      : tx`insert into public.homebrew_items (id, owner_id, key, content)
          select gen_random_uuid(), ${owner},
            'hb_' || lpad(translate((g + ${from}::int)::text, '0123456789', 'abcdefghij'), 16, 'a'),
            '{"kind": "item", "ru": "Предмет"}'::jsonb
          from generate_series(1, ${n}::int) as g`;

  for (const [table, key, limit] of [
    ['homebrew_books', 'homebrew_books_per_owner', 20],
    ['homebrew_items', 'homebrew_items_per_owner', 100]
  ]) {
    it(`refuses the ${limit + 1}th row of ${table} with the limit, and follows an override`, async () => {
      const out = await asA(users, async (tx) => {
        await many(tx, table, A, limit);
        const err = await refused(tx, (sp) => many(sp, table, A, 1, 1000));
        await unbound(
          tx,
          (u) =>
            u`insert into public.user_limit_overrides (user_id, key, value) values (${A}, ${key}, ${limit + 5})`
        );
        const raised = await refused(tx, (sp) => many(sp, table, A, 5, 2000));
        const over = await refused(tx, (sp) => many(sp, table, A, 1, 3000));
        await unbound(
          tx,
          (u) =>
            u`update public.user_limit_overrides set value = null where user_id = ${A} and key = ${key}`
        );
        const unlimited = await refused(tx, (sp) => many(sp, table, A, 10, 4000));
        return { err, raised, over, unlimited };
      });
      byCode('P0001', new RegExp(`^limit: ${key}$`))(out.err);
      assert.equal(out.err.detail, String(limit));
      assert.equal(out.raised, null);
      byCode('P0001')(out.over);
      assert.equal(out.over.detail, String(limit + 5));
      assert.equal(out.unlimited, null);
    });
  }

  it("reads the caller's own limit, an override, no limit, and refuses no user and an unknown key", async () => {
    const limitOf = (tx, key = 'homebrew_items_per_owner') =>
      tx`select public.my_limit(${key}) as v`.then(([r]) => r.v);
    const out = await asA(users, async (tx) => {
      const plain = await limitOf(tx);
      const books = await limitOf(tx, 'homebrew_books_per_owner');
      await unbound(
        tx,
        (u) => u`insert into public.user_limit_overrides (user_id, key, value)
          values (${A}, 'homebrew_items_per_owner', 250)`
      );
      const raised = await limitOf(tx);
      await unbound(tx, (u) => u`update public.user_limit_overrides set value = null`);
      const none = await limitOf(tx);
      const unknown = await refused(tx, (sp) => limitOf(sp, 'no_such_key'));
      return { plain, books, raised, none, unknown };
    });
    assert.deepEqual([out.plain, out.books, out.raised, out.none], [100, 20, 250, null]);
    byCode('22023', /unknown limit key/)(out.unknown);
    await assert.rejects(
      asRole(sql, { role: 'authenticated', setup: users }, (tx) => limitOf(tx)),
      byCode('28000', /^my_limit: not signed in$/)
    );
  });
});

describe('references and frozen copies', () => {
  const insert = (tx, key, snapshot = null, source = 'homebrew', list = LA) =>
    refused(
      tx,
      (
        sp
      ) => sp`insert into public.list_entries (id, list_id, item_key, source, snapshot, position)
        values (gen_random_uuid(), ${list}, ${key}, ${source},
          ${snapshot === null ? null : sp.json(snapshot)}::jsonb, 9)`
    );

  it("takes a reference to the owner's key, and refuses a key it lacks and B's key", async () => {
    const out = await asA(world, async (tx) => {
      await tx`delete from public.list_entries where list_id = ${LA}`;
      return {
        own: await insert(tx, AXE),
        missing: await insert(tx, MISSING),
        other: await unbound(
          tx,
          (u) => u`insert into public.homebrew_items (id, owner_id, key, content)
            values (${id(8120)}, ${B}, 'hb_onlybaaaaaaaaaaa', ${u.json({ kind: 'item', en: 'x' })})`
        ).then(() => insert(tx, 'hb_onlybaaaaaaaaaaa'))
      };
    });
    assert.equal(out.own, null);
    byCode('23503', /^list_entries: no homebrew item hb_nosuchitemaaaaaa$/)(out.missing);
    byCode('23503')(out.other);
  });

  it('answers 23503 to a reference A lacks through apply_list_writes, beside a write that lands', async () => {
    const out = await asA(world, async (tx) => {
      const entry = (entryId, key, position) => ({
        id: entryId,
        item_key: key,
        source: 'homebrew',
        snapshot: null,
        position,
        quantity: 1,
        price_coins: null,
        player_note: '',
        gm_note: ''
      });
      const [{ r }] = await tx`select public.apply_list_writes(${tx.json([
        { op: 'add', list_id: LA2, entries: [entry(id(8320), MISSING, 5)] },
        { op: 'add', list_id: LA2, entries: [entry(id(8321), POTION, 6)] }
      ])}::jsonb) as r`;
      return r;
    });
    assert.equal(out[0].ok, false);
    assert.equal(out[0].code, '23503');
    assert.deepEqual(out[1], { ok: true });
  });

  it('takes a frozen copy under any key, and refuses a snapshot on an official entry, an invalid one and one of another key', async () => {
    const out = await asA(world, async (tx) => {
      const frozenOther = { ...POTION_SNAPSHOT, id: MISSING };
      return {
        frozen: await insert(tx, MISSING, frozenOther),
        official: await insert(tx, 'q1', POTION_SNAPSHOT, 'official'),
        invalid: await insert(tx, 'hb_otheraaaaaaaaaaa', {
          id: 'hb_otheraaaaaaaaaaa',
          src: 'homebrew'
        }),
        mismatched: await insert(tx, 'hb_otheraaaaaaaaaaa', POTION_SNAPSHOT)
      };
    });
    assert.equal(out.frozen, null);
    byCode('23514', /list_entries_snapshot_source/)(out.official);
    byCode('23514', /list_entries_snapshot_valid/)(out.invalid);
    byCode('23514', /list_entries_snapshot_valid/)(out.mismatched);
  });

  it('bumps each list holding a reference once on an item edit, and no list holding only a frozen copy', async () => {
    const out = await asA(world, async (tx) => {
      const was = await unbound(tx, revisions);
      await tx`update public.homebrew_items set content = ${tx.json({ ...AXE_CONTENT, rud: 'Новое' })}
        where id = ${IA}`;
      const edited = await unbound(tx, revisions);
      await tx`update public.homebrew_items set content = ${tx.json({ ...POTION_CONTENT, rud: 'Новое' })}
        where id = ${IP}`;
      return { was, edited, frozenOnly: await unbound(tx, revisions) };
    });
    assert.equal(out.edited[LA], out.was[LA] + 1);
    assert.equal(out.edited[LA2], out.was[LA2]);
    assert.equal(out.edited[LB], out.was[LB]);
    assert.deepEqual(out.frozenOnly, out.edited);
  });

  it('bumps the lists referring to its items on a source rename, and on its delete moves the items to no source', async () => {
    const out = await asA(world, async (tx) => {
      const was = await unbound(tx, revisions);
      await tx`update public.homebrew_books set content = ${tx.json({ ...BOOK, ru: 'Мастерская II' })}
        where id = ${BA}`;
      const renamed = await unbound(tx, revisions);
      const [before] =
        await tx`select revision::int as r from public.homebrew_items where id = ${IA}`;
      await tx`delete from public.homebrew_books where id = ${BA}`;
      const [item] =
        await tx`select book_id, revision::int as r from public.homebrew_items where id = ${IA}`;
      return { was, renamed, before: before.r, item, deleted: await unbound(tx, revisions) };
    });
    assert.equal(out.renamed[LA], out.was[LA] + 1);
    assert.equal(out.renamed[LA2], out.was[LA2]);
    assert.deepEqual(out.item, { book_id: null, r: out.before + 1 });
    assert.equal(out.deleted[LA], out.renamed[LA] + 1);
  });

  it("removes the owner's references with an item and keeps every frozen copy", async () => {
    const out = await asA(world, async (tx) => {
      const was = await unbound(tx, revisions);
      await tx`delete from public.homebrew_items where id = ${IA}`;
      return {
        was,
        entries: await unbound(
          tx,
          (u) => u`select list_id, item_key, snapshot is null as reference
            from public.list_entries order by list_id, position`
        ),
        now: await unbound(tx, revisions)
      };
    });
    assert.deepEqual(
      out.entries.map((e) => [e.list_id, e.item_key, e.reference]),
      [
        [LA, POTION, false],
        [LA2, AXE, false],
        [LB, AXE, false]
      ]
    );
    assert.equal(out.now[LA], out.was[LA] + 1);
  });

  const shareOf = async (tx, list) => {
    const [s] = await tx`select token from public.create_list_share(${list}, 'player')`;
    return s.token;
  };
  const projected = async (tx, token) => {
    const [{ v }] = await tx`select public.get_shared_list(${token}) as v`;
    return v.entries.map((e) => [e.item_key, e.snapshot]);
  };

  it('projects a reference from the live item, its source and its section, and shows an edit in the next read', async () => {
    const out = await asA(world, async (tx) => {
      const token = await shareOf(tx, LA);
      const first = await projected(tx, token);
      await tx`update public.homebrew_books set content = ${tx.json({ ...BOOK, en: 'Workshop II' })}
        where id = ${BA}`;
      return { first, second: await projected(tx, token) };
    });
    const [axe, potion] = out.first;
    assert.equal(axe[0], AXE);
    assert.deepEqual(axe[1], {
      kind: 'equip',
      ru: 'Топор Тлеющих Углей',
      en: 'Ember Axe',
      ende: '',
      rud: '',
      eq: AXE_CONTENT.eq,
      id: AXE,
      src: 'homebrew',
      book: {
        key: ALDER,
        en: 'Alder Workshop',
        ru: 'Мастерская Ольхи',
        section: { key: BLADES, en: 'Blades', ru: 'Холодное оружие' }
      }
    });
    assert.deepEqual(potion, [POTION, POTION_SNAPSHOT]);
    assert.equal(out.second[0][1].book.en, 'Workshop II');
  });

  it('freezes the references in a copy by B, keeps them in a copy by A, and keeps a frozen entry frozen for both', async () => {
    let token;
    const shared = async (tx) => {
      await world(tx);
      const [s] = await tx`insert into public.list_shares (list_id, audience)
        values (${LA}, 'player') returning token`;
      token = s.token;
    };
    const copyOf = (as) =>
      asRole(sql, { role: 'authenticated', sub: as, setup: shared }, async (tx) => {
        const copy = id(as === A ? 8401 : 8402);
        await tx`select public.clone_shared_list(${token}, ${copy})`;
        return (
          await tx`select item_key, source, snapshot from public.list_entries
            where list_id = ${copy} order by position`
        ).map((e) => ({ ...e }));
      });
    const byA = await copyOf(A);
    /* The owner copies its own share holding a frozen entry: the frozen entry stays
       frozen with its snapshot, the reference stays a reference. */
    assert.deepEqual(byA, [
      { item_key: AXE, source: 'homebrew', snapshot: null },
      { item_key: POTION, source: 'homebrew', snapshot: POTION_SNAPSHOT }
    ]);
    const byB = await copyOf(B);
    assert.equal(byB[0].item_key, AXE);
    assert.equal(byB[0].snapshot.id, AXE);
    assert.equal(byB[0].snapshot.book.key, ALDER);
    assert.deepEqual(byB[1], {
      item_key: POTION,
      source: 'homebrew',
      snapshot: POTION_SNAPSHOT
    });
  });

  it("removes A's sources, items and references with A's user, in either order", async () => {
    for (const first of ['user', 'source']) {
      const left = await asA(world, async (tx) =>
        unbound(tx, async (u) => {
          if (first === 'source') await u`delete from public.homebrew_books where id = ${BA}`;
          await u`delete from auth.users where id = ${A}`;
          const [c] = await u`select
            (select count(*)::int from public.homebrew_books where owner_id = ${A}) as books,
            (select count(*)::int from public.homebrew_items where owner_id = ${A}) as items,
            (select count(*)::int from public.lists where owner_id = ${A}) as lists,
            (select count(*)::int from public.list_entries where list_id = ${LB}) as frozen`;
          return { ...c };
        })
      );
      assert.deepEqual(left, { books: 0, items: 0, lists: 0, frozen: 1 }, first);
    }
  });
});

describe('the homebrew messages', () => {
  before(async () => {
    await realtimePartition(sql);
  });

  it('commits one homebrew message per owner per transaction with the tab, and none when rolled back', async () => {
    const a = crypto.randomUUID();
    await sql`insert into auth.users (id) values (${a})`;
    const topic = `owner:${a}`;
    const homebrew = async () =>
      (await messagesTo(sql, topic))
        .filter((m) => m.event === 'homebrew')
        .map((m) => m.payload);
    try {
      await commitAs(sql, { role: 'authenticated', sub: a }, async (tx) => {
        await tx`select set_config('request.headers', '{"x-dhloot-tab":"tab-1"}', true)`;
        await tx`insert into public.homebrew_books (id, owner_id, key, content)
          values (gen_random_uuid(), ${a}, ${ALDER}, ${tx.json({ ru: 'Источник' })})`;
        await tx`insert into public.homebrew_items (id, owner_id, key, content)
          values (gen_random_uuid(), ${a}, ${AXE}, ${tx.json({ kind: 'item', ru: 'Топор' })}),
            (gen_random_uuid(), ${a}, ${POTION}, ${tx.json(POTION_CONTENT)})`;
      });
      assert.deepEqual(await homebrew(), [{ by: 'tab-1' }]);
      await assert.rejects(
        commitAs(sql, { role: 'authenticated', sub: a }, async (tx) => {
          await tx`update public.homebrew_items set content = ${tx.json({ kind: 'item', ru: 'x' })}`;
          throw new Error('rolled back');
        }),
        /rolled back/
      );
      await commitAs(sql, { role: 'authenticated', sub: a }, async (tx) => {
        await tx`delete from public.homebrew_items where key = ${POTION}`;
      });
      assert.deepEqual(await homebrew(), [{ by: 'tab-1' }, { by: null }]);
    } finally {
      await sql`delete from auth.users where id = ${a}`;
    }
  });
});
