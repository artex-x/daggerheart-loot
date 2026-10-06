/*
  The author's set cards and rule cards (homebrew_cards) and the relation keys
  of an item. homebrew_card_valid() accepts and refuses every case of
  docs/fixtures/homebrew/cards.json as app/src/lib/homebrew.ts does; the table
  refuses an item that names itself; a record with its cards stays under
  131072 bytes. A card is its owner's, its key and kind pinned, its count
  limited; its writes bump every list that links an item naming it; a
  share's projection and get_homebrew_items() embed it.
  docs/decisions/2026-10-07-an-item-is-read-by-its-id-by-anyone-a-list-holds-a-live-link.md.
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
const CARDS = fixture('cards.json');
const SNAPSHOTS = fixture('snapshots.json');

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const BA = id(9001);
const BB = id(9002);
const CS = id(9011);
const CR = id(9012);
const CB = id(9013);
const IA = id(9021);
const IP = id(9022);
const LA = id(9031);
const LA2 = id(9032);
const LA3 = id(9033);
const LB = id(9034);
const ALDER = 'hb_alderworkshopaaa';
const SET = 'hb_aldersetaaaaaaaa';
const RULE = 'hb_alderrulecardaaa';
const LATER = 'hb_laterrulecardaaa';
const BUCKLE = 'hb_alderbuckleaaaaa';
const POTION = 'hb_smithpotionaaaaa';

const SET_CARD = { ru: 'Комплект Ольхи', rud: 'Два предмета: +1 к Уклонению.' };
const RULE_CARD = {
  en: 'Alder Brand',
  ende: 'Once per rest: reroll one damage die.',
  url: 'https://example.test/alder-brand'
};
const BUCKLE_CONTENT = {
  kind: 'item',
  ru: 'Пряжка Ольхи',
  set: SET,
  refs: [RULE, 'slow', LATER],
  craft: ['ci1'],
  craft_from: ['q1']
};
const POTION_CONTENT = { kind: 'consumable', ru: 'Настой кузнеца' };

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const users = (tx) => tx`insert into auth.users (id) values (${A}), (${B})`;
/* A's source BA with the set card CS in it, A's rule card CR in none; B's card CB under A's
   set key. A's buckle IA names CS, CR, a catalog rule card and a card not made yet; A's
   potion IP names none. A's list LA links the buckle (sent by key), LA2 the potion, LA3
   nothing; B's list LB links A's buckle by its id. */
const world = async (tx) => {
  await users(tx);
  await tx`insert into public.homebrew_books (id, owner_id, key, content) values
    (${BA}, ${A}, ${ALDER}, ${tx.json({ ru: 'Мастерская Ольхи' })}),
    (${BB}, ${B}, ${ALDER}, ${tx.json({ en: 'B' })})`;
  await tx`insert into public.homebrew_cards (id, owner_id, key, kind, book_id, content) values
    (${CS}, ${A}, ${SET}, 'set', ${BA}, ${tx.json(SET_CARD)}),
    (${CR}, ${A}, ${RULE}, 'ref', null, ${tx.json(RULE_CARD)}),
    (${CB}, ${B}, ${SET}, 'set', ${BB}, ${tx.json({ en: 'B set' })})`;
  await tx`insert into public.homebrew_items (id, owner_id, key, content) values
    (${IA}, ${A}, ${BUCKLE}, ${tx.json(BUCKLE_CONTENT)}),
    (${IP}, ${A}, ${POTION}, ${tx.json(POTION_CONTENT)})`;
  await tx`insert into public.lists (id, owner_id, name) values
    (${LA}, ${A}, 'A'), (${LA2}, ${A}, 'A2'), (${LA3}, ${A}, 'A3'), (${LB}, ${B}, 'B')`;
  await tx`insert into public.list_entries (id, list_id, item_key, source, hb_item, position)
    values
      (${id(9041)}, ${LA}, ${BUCKLE}, 'homebrew', null, 0),
      (${id(9042)}, ${LA2}, ${POTION}, 'homebrew', null, 0),
      (${id(9043)}, ${LB}, ${BUCKLE}, 'homebrew', ${IA}, 0)`;
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

describe('the card validator over docs/fixtures/homebrew/cards.json', () => {
  it('accepts every valid case and refuses every invalid one', async () => {
    const wrong = [];
    for (const [cases, want] of [
      [CARDS.valid, true],
      [CARDS.invalid, false]
    ]) {
      for (const c of cases) {
        const [{ ok }] = await sql.unsafe(
          'select public.homebrew_card_valid($1, $2::text::jsonb) as ok',
          [String(c.kind), JSON.stringify(c.content)]
        );
        if (ok !== want) wrong.push(c.name);
      }
    }
    assert.deepEqual(wrong, []);
  });

  it('refuses a card the validator refuses by the check of the table', async () => {
    await assert.rejects(
      asA(
        users,
        (tx) => tx`insert into public.homebrew_cards (id, owner_id, key, kind, content)
          values (${CR}, ${A}, ${RULE}, 'ref', ${tx.json({ en: 'x', url: 'http://a' })})`
      ),
      byCode('23514', /homebrew_cards_content_check/)
    );
    await assert.rejects(
      asA(
        users,
        (tx) => tx`insert into public.homebrew_cards (id, owner_id, key, kind, content)
          values (${CR}, ${A}, ${RULE}, 'deck', ${tx.json({ en: 'x' })})`
      ),
      byCode('23514')
    );
  });
});

describe('the relation keys', () => {
  it('refuses an item that names itself in craft or craft_from, on insert and on update', async () => {
    const out = await asA(world, async (tx) => ({
      craft: await refused(
        tx,
        (sp) => sp`insert into public.homebrew_items (id, owner_id, key, content)
          values (${id(9025)}, ${A}, 'hb_selfaaaaaaaaaaaa',
            ${sp.json({ kind: 'item', ru: 'Сама', craft: ['hb_selfaaaaaaaaaaaa'] })})`
      ),
      from: await refused(
        tx,
        (sp) => sp`update public.homebrew_items
          set content = ${sp.json({ ...POTION_CONTENT, craft_from: ['q1', POTION] })}
          where id = ${IP}`
      ),
      line: await refused(
        tx,
        (sp) => sp`insert into public.homebrew_items (id, owner_id, key, content)
          values (${id(9026)}, ${A}, 'hb_mailaaaaaaaaaaaa', ${sp.json({
            kind: 'equip',
            en: 'Mail',
            eq: { t: 'armor', tier: 1, as: 3, th: [6, 12], line: 'hb_mailaaaaaaaaaaaa' }
          })})`
      )
    }));
    byCode('23514', /homebrew_items_relations_not_self/)(out.craft);
    byCode('23514', /homebrew_items_relations_not_self/)(out.from);
    assert.equal(out.line, null);
  });

  it('keeps the maximal snapshot with its cards over 75000 and under 131072 bytes', async () => {
    const max = SNAPSHOTS.valid.find((c) => c.key === 'hb_maximalcardsaaaa');
    const [{ n }] = await sql`select octet_length(${sql.json(max.snapshot)}::jsonb::text) as n`;
    assert.ok(n > 75000 && n < 131072, String(n));
  });
});

describe('the card rows', () => {
  it("reads, changes and deletes only the caller's cards, and refuses a card in B's source", async () => {
    const out = await asA(world, async (tx) => ({
      cards: (await tx`select id from public.homebrew_cards order by id`).map((r) => r.id),
      updated: (
        await tx`update public.homebrew_cards set content = ${tx.json({ en: 'x' })}
          where id = ${CB} returning id`
      ).length,
      deleted: (await tx`delete from public.homebrew_cards where id = ${CB} returning id`)
        .length,
      inserted: await refused(
        tx,
        (sp) => sp`insert into public.homebrew_cards (id, owner_id, key, kind, book_id, content)
          values (${id(9014)}, ${A}, 'hb_othercardaaaaaaa', 'set', ${BB}, ${sp.json({ en: 'x' })})`
      ),
      moved: await refused(
        tx,
        (sp) => sp`update public.homebrew_cards set book_id = ${BB} where id = ${CS}`
      ),
      b: await unbound(tx, (u) => u`select content from public.homebrew_cards where id = ${CB}`)
    }));
    assert.deepEqual(out.cards, [CS, CR]);
    assert.equal(out.updated, 0);
    assert.equal(out.deleted, 0);
    byCode('42501', /row-level security/)(out.inserted);
    byCode('42501', /row-level security/)(out.moved);
    assert.deepEqual(out.b[0].content, { en: 'B set' });
  });

  it('refuses a repeated key per owner', async () => {
    const out = await asA(world, async (tx) =>
      refused(
        tx,
        (sp) => sp`insert into public.homebrew_cards (id, owner_id, key, kind, content)
          values (${id(9015)}, ${A}, ${RULE}, 'ref', ${sp.json(RULE_CARD)})`
      )
    );
    byCode('23505', /homebrew_cards_owner_id_key_key/)(out);
  });

  it('pins the id, the owner, the key, the kind and the creation time, and moves the revision and the edit time', async () => {
    const aged = async (tx) => {
      await users(tx);
      await tx`insert into public.homebrew_cards (id, owner_id, key, kind, content, created_at,
          updated_at)
        values (${CR}, ${A}, ${RULE}, 'ref', ${tx.json(RULE_CARD)}, now() - interval '2 days',
          now() - interval '1 day')`;
    };
    const out = await asA(aged, async (tx) => {
      const [was] = await tx`select * from public.homebrew_cards where id = ${CR}`;
      await tx`update public.homebrew_cards set id = ${id(9099)}, owner_id = ${B},
        key = 'hb_changedaaaaaaaaa', kind = 'set', created_at = now(), revision = 40,
        content = ${tx.json({ en: 'Brand II' })} where id = ${CR}`;
      const [now] = await unbound(
        tx,
        (u) => u`select * from public.homebrew_cards where id = ${CR}`
      );
      return { was, now };
    });
    assert.equal(out.now.id, out.was.id);
    assert.equal(out.now.owner_id, out.was.owner_id);
    assert.equal(out.now.key, out.was.key);
    assert.equal(out.now.kind, 'ref');
    assert.deepEqual(out.now.created_at, out.was.created_at);
    assert.equal(Number(out.now.revision), Number(out.was.revision) + 1);
    assert.ok(out.now.updated_at > out.was.updated_at);
    assert.deepEqual(out.now.content, { en: 'Brand II' });
  });

  const many = (tx, owner, n, from = 0) =>
    tx`insert into public.homebrew_cards (id, owner_id, key, kind, content)
      select gen_random_uuid(), ${owner},
        'hb_' || lpad(translate((g + ${from}::int)::text, '0123456789', 'abcdefghij'), 16, 'a'),
        'set', '{"ru": "Комплект"}'::jsonb
      from generate_series(1, ${n}::int) as g`;

  it('refuses the 101st card with the limit, and follows an override', async () => {
    const key = 'homebrew_cards_per_owner';
    const out = await asA(users, async (tx) => {
      await many(tx, A, 100);
      const err = await refused(tx, (sp) => many(sp, A, 1, 1000));
      await unbound(
        tx,
        (u) =>
          u`insert into public.user_limit_overrides (user_id, key, value) values (${A}, ${key}, 105)`
      );
      const raised = await refused(tx, (sp) => many(sp, A, 5, 2000));
      const over = await refused(tx, (sp) => many(sp, A, 1, 3000));
      return { err, raised, over };
    });
    byCode('P0001', /^limit: homebrew_cards_per_owner$/)(out.err);
    assert.equal(out.err.detail, '100');
    assert.equal(out.raised, null);
    byCode('P0001')(out.over);
    assert.equal(out.over.detail, '105');
  });

  it('bumps each list linking an item naming a card once on its insert, update and delete, of any owner, and no other list', async () => {
    const out = await asA(world, async (tx) => {
      const was = await unbound(tx, revisions);
      await tx`insert into public.homebrew_cards (id, owner_id, key, kind, content)
        values (${id(9016)}, ${A}, ${LATER}, 'ref', ${tx.json({ en: 'Later' })})`;
      const inserted = await unbound(tx, revisions);
      await tx`update public.homebrew_cards set content = ${tx.json({ ...SET_CARD, en: 'Set' })}
        where id = ${CS}`;
      const updated = await unbound(tx, revisions);
      await tx`delete from public.homebrew_cards where id = ${CR}`;
      const deleted = await unbound(tx, revisions);
      await tx`insert into public.homebrew_cards (id, owner_id, key, kind, content)
        values (${id(9017)}, ${A}, 'hb_unnamedcardaaaaa', 'set', ${tx.json({ en: 'None' })})`;
      return { was, inserted, updated, deleted, unnamed: await unbound(tx, revisions) };
    });
    for (const [now, then] of [
      [out.inserted, out.was],
      [out.updated, out.inserted],
      [out.deleted, out.updated]
    ]) {
      assert.equal(now[LA], then[LA] + 1);
      assert.equal(now[LB], then[LB] + 1);
      for (const other of [LA2, LA3]) assert.equal(now[other], then[other]);
    }
    assert.deepEqual(out.unnamed, out.deleted);
  });

  it("moves a deleted source's cards to no source, one revision up", async () => {
    const out = await asA(world, async (tx) => {
      await tx`delete from public.homebrew_books where id = ${BA}`;
      const [c] =
        await tx`select book_id, revision::int as r from public.homebrew_cards where id = ${CS}`;
      return c;
    });
    assert.deepEqual({ ...out }, { book_id: null, r: 2 });
  });

  const shareOf = async (tx, list) => {
    const [s] = await tx`select token from public.create_list_share(${list}, 'player')`;
    return s.token;
  };
  const projected = async (tx, token) => {
    const [{ v }] = await tx`select public.get_shared_list(${token}) as v`;
    return v.entries[0].snapshot;
  };

  it('projects the own cards the item names, leaves out a catalog key and an unnamed card, and drops a deleted card', async () => {
    const out = await asA(world, async (tx) => {
      await tx`insert into public.homebrew_cards (id, owner_id, key, kind, content)
        values (${id(9017)}, ${A}, 'hb_unnamedcardaaaaa', 'ref', ${tx.json({ en: 'None' })})`;
      const token = await shareOf(tx, LA);
      const first = await projected(tx, token);
      await tx`delete from public.homebrew_cards where id = ${CR}`;
      return { first, second: await projected(tx, token) };
    });
    assert.deepEqual(out.first.cards, {
      sets: {
        [SET]: {
          en: SET_CARD.ru,
          ru: SET_CARD.ru,
          ende: SET_CARD.rud,
          rud: SET_CARD.rud
        }
      },
      refs: {
        [RULE]: {
          en: RULE_CARD.en,
          ru: RULE_CARD.en,
          ensub: '',
          rusub: '',
          ende: RULE_CARD.ende,
          rud: RULE_CARD.ende,
          url: RULE_CARD.url
        }
      }
    });
    assert.deepEqual(out.first.refs, [RULE, 'slow', LATER]);
    assert.deepEqual(Object.keys(out.second.cards), ['sets']);
  });

  it('links the item in a copy by B, whose read embeds the named cards', async () => {
    let token;
    const shared = async (tx) => {
      await world(tx);
      const [s] = await tx`insert into public.list_shares (list_id, audience)
        values (${LA}, 'player') returning token`;
      token = s.token;
    };
    const copy = await asRole(
      sql,
      { role: 'authenticated', sub: B, setup: shared },
      async (tx) => {
        await tx`select public.clone_shared_list(${token}, ${id(9060)})`;
        const [e] =
          await tx`select hb_item from public.list_entries where list_id = ${id(9060)}`;
        const [{ v }] =
          await tx`select public.get_homebrew_items(array[${e.hb_item}]::uuid[]) as v`;
        return { hbItem: e.hb_item, item: v[0].item };
      }
    );
    assert.equal(copy.hbItem, IA);
    assert.deepEqual(Object.keys(copy.item.cards.sets), [SET]);
    assert.deepEqual(Object.keys(copy.item.cards.refs), [RULE]);
  });

  it("removes A's cards with A's user", async () => {
    const left = await asA(world, async (tx) =>
      unbound(tx, async (u) => {
        await u`delete from auth.users where id = ${A}`;
        const [c] = await u`select
          (select count(*)::int from public.homebrew_cards where owner_id = ${A}) as mine,
          (select count(*)::int from public.homebrew_cards where owner_id = ${B}) as theirs`;
        return { ...c };
      })
    );
    assert.deepEqual(left, { mine: 0, theirs: 1 });
  });
});

describe('the card messages', () => {
  before(async () => {
    await realtimePartition(sql);
  });

  it('commits one homebrew message per owner per transaction for card writes', async () => {
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
        await tx`insert into public.homebrew_cards (id, owner_id, key, kind, content)
          values (gen_random_uuid(), ${a}, ${SET}, 'set', ${tx.json(SET_CARD)}),
            (gen_random_uuid(), ${a}, ${RULE}, 'ref', ${tx.json(RULE_CARD)})`;
        await tx`update public.homebrew_cards set content = ${tx.json({ en: 'Set' })}
          where key = ${SET}`;
      });
      assert.deepEqual(await homebrew(), [{ by: 'tab-1' }]);
      await commitAs(sql, { role: 'authenticated', sub: a }, async (tx) => {
        await tx`delete from public.homebrew_cards where key = ${RULE}`;
      });
      assert.deepEqual(await homebrew(), [{ by: 'tab-1' }, { by: null }]);
    } finally {
      await sql`delete from auth.users where id = ${a}`;
    }
  });
});
