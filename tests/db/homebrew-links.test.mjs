/*
  Live links by item id (20261007130000_homebrew_links.sql): the conversion
  of stored references and frozen copies - own-held keys link, one copy with
  no own holder is deleted, two stop the migration - and its reversal;
  get_homebrew_item() for anyone with the id, with mine, an md5 revision and
  the related items (at most 1000), the latest edit time beside them,
  never an owner, a source id or another time;
  get_homebrew_items() for a signed-in caller, at most 1000 ids; the change
  log list_notices - one row per list and item, refreshed by an edit, turned
  into deleted by a delete, read and hidden only by the list's owner, read
  only through mark_list_read(), which also caps a request's expiry, one
  notice message per list owner per transaction and none for a read; a
  share's projection of another account's item with that account's source
  and cards; the triggers at 300 linking lists. Every seed runs in a
  transaction that rolls back, but for the message cases, which commit and
  delete their rows. docs/specs/META.md, section 3;
  docs/decisions/2026-10-07-an-item-is-read-by-its-id-by-anyone-a-list-holds-a-live-link.md;
  docs/decisions/2026-10-07-a-lists-change-log-shares-the-requests-view-and-clean-up.md.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asRole, commitAs, connect, messagesTo, realtimePartition } from './roles.mjs';

const SUPABASE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'supabase'
);
const NAME = '20261007130000_homebrew_links.sql';
const UP = readFileSync(path.join(SUPABASE, 'migrations', NAME), 'utf8');
const DOWN = readFileSync(path.join(SUPABASE, 'reversals', NAME), 'utf8');

const A = '00000000-0000-4000-8000-0000000000aa';
const B = '00000000-0000-4000-8000-0000000000bb';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const BA = id(11001);
const CS = id(11011);
const CR = id(11012);
const I0 = id(11100);
const I1 = id(11101);
const I2 = id(11102);
const I3 = id(11103);
const I4 = id(11104);
const I5 = id(11105);
const IB = id(11106);
const LA = id(11201);
const LB = id(11202);
const LB2 = id(11203);
const ALDER = 'hb_alderworkshopaaa';
const BLADES = 'hb_sectbladesaaaaaa';
const SET = 'hb_aldersetaaaaaaaa';
const RULE = 'hb_alderrulecardaaa';
const LINE = 'hb_alderlineaaaaaaa';
const K = {
  main: 'hb_mainitemaaaaaaaa',
  craft: 'hb_crafttargetaaaaa',
  from: 'hb_frommainaaaaaaaa',
  set: 'hb_setmateaaaaaaaaa',
  line: 'hb_linemateaaaaaaaa',
  other: 'hb_otheritemaaaaaaa'
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

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

/* The call inside a savepoint, so the transaction reads on after a refusal; answers the
   error, or null. */
const refused = (tx, fn) =>
  tx
    .savepoint((sp) => fn(sp))
    .then(
      () => null,
      (err) => err
    );

/* A's source BA with a section, A's set card CS and rule card CR, A's main item I0
   (in BA, naming CS, CR, I1 in craft and a catalog key in craft_from, on the line
   LINE), I1 (its craft), I2 (names I0 in craft_from), I3 (in the set), I4 (on the
   line), I5 (unrelated); B's item IB under I1's key. A's list LA links I0; B's lists
   LB and LB2 link I0 by its id. */
const world = async (tx) => {
  await tx`insert into auth.users (id) values (${A}), (${B})`;
  await tx`insert into public.homebrew_books (id, owner_id, key, content) values
    (${BA}, ${A}, ${ALDER}, ${tx.json({
      ru: 'Мастерская Ольхи',
      sections: [{ key: BLADES, ru: 'Клинки' }]
    })})`;
  await tx`insert into public.homebrew_cards (id, owner_id, key, kind, content) values
    (${CS}, ${A}, ${SET}, 'set', ${tx.json({ ru: 'Комплект' })}),
    (${CR}, ${A}, ${RULE}, 'ref', ${tx.json({ en: 'Brand' })})`;
  const armor = (tier, line) => ({ t: 'armor', tier, as: 3, th: [6, 12], line });
  await tx`insert into public.homebrew_items (id, owner_id, key, book_id, content) values
    (${I0}, ${A}, ${K.main}, ${BA}, ${tx.json({
      kind: 'equip',
      en: 'Main',
      section: BLADES,
      eq: armor(1, LINE),
      set: SET,
      refs: [RULE],
      craft: [K.craft],
      craft_from: ['q1']
    })}),
    (${I1}, ${A}, ${K.craft}, null, ${tx.json({ kind: 'item', en: 'Craft target' })}),
    (${I2}, ${A}, ${K.from}, null, ${tx.json({ kind: 'item', en: 'From main', craft_from: [K.main] })}),
    (${I3}, ${A}, ${K.set}, null, ${tx.json({ kind: 'item', ru: 'Сосед', set: SET, tier: 2 })}),
    (${I4}, ${A}, ${K.line}, null, ${tx.json({ kind: 'equip', en: 'Line mate', eq: armor(2, LINE) })}),
    (${I5}, ${A}, ${K.other}, null, ${tx.json({ kind: 'item', en: 'Other' })}),
    (${IB}, ${B}, ${K.craft}, null, ${tx.json({ kind: 'item', en: 'B craft' })})`;
  await tx`insert into public.lists (id, owner_id, name) values
    (${LA}, ${A}, 'A'), (${LB}, ${B}, 'B'), (${LB2}, ${B}, 'B2')`;
  await tx`insert into public.list_entries (id, list_id, item_key, source, hb_item, position)
    values (${id(11301)}, ${LA}, ${K.main}, 'homebrew', null, 0),
      (${id(11302)}, ${LB}, ${K.main}, 'homebrew', ${I0}, 0),
      (${id(11303)}, ${LB2}, ${K.main}, 'homebrew', ${I0}, 0)`;
};

const itemOf = async (tx, hid) => {
  const [{ v }] = await tx`select public.get_homebrew_item(${hid}::uuid) as v`;
  return v;
};
const as = (role, sub, fn) => asRole(sql, { role, sub, setup: world }, fn);
const notices = async (tx) =>
  (
    await tx`select list_id, item_key, hid, kind, name, read_at is null as unread
      from public.list_notices order by list_id, item_key`
  ).map((r) => ({ ...r }));

/* Every key and every string in `v`, walked. */
function walk(v, keys = [], strings = []) {
  if (Array.isArray(v)) for (const x of v) walk(x, keys, strings);
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      keys.push(k);
      walk(x, keys, strings);
    }
  } else if (typeof v === 'string') strings.push(v);
  return { keys, strings };
}

describe('the conversion of stored rows', () => {
  /* The schema before the migration (its reversal applied), A's items X and Y, A's
     list holding a reference to X, a frozen copy of Y and `orphans` frozen copies of
     keys nobody holds, and B's list holding a frozen copy of B's own key. */
  const before = async (tx, orphans) => {
    await tx.unsafe(DOWN);
    await tx`insert into auth.users (id) values (${A}), (${B})`;
    await tx`insert into public.homebrew_items (id, owner_id, key, content) values
      (${I0}, ${A}, ${K.main}, ${tx.json({ kind: 'item', en: 'X' })}),
      (${I1}, ${A}, ${K.craft}, ${tx.json({ kind: 'item', en: 'Y' })}),
      (${IB}, ${B}, ${K.other}, ${tx.json({ kind: 'item', en: 'Z' })})`;
    await tx`insert into public.lists (id, owner_id) values (${LA}, ${A}), (${LB}, ${B})`;
    const frozen = async (key, en) => {
      const [{ v }] = await tx`select public.homebrew_snapshot_of(${key},
        ${tx.json({ kind: 'item', en })}, null, null) as v`;
      return v;
    };
    await tx`insert into public.list_entries (id, list_id, item_key, source, snapshot, position)
      values (${id(11401)}, ${LA}, ${K.main}, 'homebrew', null, 0),
        (${id(11402)}, ${LA}, ${K.craft}, 'homebrew', ${tx.json(await frozen(K.craft, 'Old Y'))}, 1),
        (${id(11403)}, ${LB}, ${K.other}, 'homebrew', ${tx.json(await frozen(K.other, 'Old Z'))}, 0),
        (${id(11404)}, ${LA}, 'ci1', 'official', null, 2)`;
    // A live pending request, an expired one and a decided one, on A's list.
    const [{ sid }] = await tx`insert into public.list_shares (list_id, audience)
      values (${LA}, 'player') returning id as sid`;
    await tx`insert into public.purchase_requests
        (id, list_id, share_id, audience, status, created_at, expires_at, decided_at)
      values (${id(11501)}, ${LA}, ${sid}, 'player', 'pending', now() - interval '30 minutes',
          now() + interval '30 minutes', null),
        (${id(11502)}, ${LA}, ${sid}, 'player', 'pending', now() - interval '70 minutes',
          now() - interval '10 minutes', null),
        (${id(11503)}, ${LA}, ${sid}, 'player', 'declined', now() - interval '30 minutes',
          now() + interval '30 minutes', now() - interval '20 minutes')`;
    for (let n = 0; n < orphans; n++) {
      const key = `hb_orphan${'abcdefg'[n]}aaaaaaaaa`;
      await tx`insert into public.list_entries (id, list_id, item_key, source, snapshot, position)
        values (${id(11410 + n)}, ${LA}, ${key}, 'homebrew',
          ${tx.json(await frozen(key, 'Gone'))}, ${10 + n})`;
    }
  };

  it('links references and own-held frozen copies, deletes the one copy with no holder and leaves no homebrew row unlinked', async () => {
    const out = await rolledBack(async (tx) => {
      await before(tx, 1);
      await tx.unsafe(UP);
      return (
        await tx`select id, item_key, source, hb_item from public.list_entries
          where id = any(${[id(11401), id(11402), id(11403), id(11404), id(11410)]}::uuid[])
          order by id`
      ).map((r) => ({ ...r }));
    });
    assert.deepEqual(out, [
      { id: id(11401), item_key: K.main, source: 'homebrew', hb_item: I0 },
      { id: id(11402), item_key: K.craft, source: 'homebrew', hb_item: I1 },
      { id: id(11403), item_key: K.other, source: 'homebrew', hb_item: IB },
      { id: id(11404), item_key: 'ci1', source: 'official', hb_item: null }
    ]);
  });

  it('moves a live pending request to 30 days after its creation, and keeps an expired and a decided one', async () => {
    const out = await rolledBack(async (tx) => {
      await before(tx, 1);
      const was = await tx`select id, expires_at from public.purchase_requests order by id`;
      await tx.unsafe(UP);
      const now =
        await tx`select id, expires_at, expires_at = created_at + interval '30 days' as month,
          read_at from public.purchase_requests order by id`;
      return { was: was.map((r) => ({ ...r })), now: now.map((r) => ({ ...r })) };
    });
    const [live, expired, decided] = out.now;
    assert.equal(live?.month, true);
    assert.equal(live?.read_at, null);
    assert.deepEqual(expired?.expires_at, out.was[1]?.expires_at);
    assert.deepEqual(decided?.expires_at, out.was[2]?.expires_at);
  });

  it('keeps the snapshot column, null in every row, and refuses a snapshot', async () => {
    const out = await rolledBack(async (tx) => {
      await before(tx, 1);
      await tx.unsafe(UP);
      const [{ held }] =
        await tx`select count(*) filter (where snapshot is not null)::int as held
        from public.list_entries`;
      const err = await refused(
        tx,
        (sp) => sp`update public.list_entries
        set snapshot = ${sp.json({ id: K.craft })} where id = ${id(11402)}`
      );
      return { held, err };
    });
    assert.equal(out.held, 0);
    assert.equal(out.err?.code, '23514');
    assert.match(out.err.message, /list_entries_snapshot_null/);
  });

  it('stops on two copies with no holder and changes nothing', async () => {
    const out = await rolledBack(async (tx) => {
      await before(tx, 2);
      const err = await refused(tx, (sp) => sp.unsafe(UP));
      const [{ n, frozen }] = await tx`select count(*)::int as n,
          count(*) filter (where snapshot is not null)::int as frozen
        from public.list_entries where list_id in (${LA}, ${LB})`;
      return { err, n, frozen };
    });
    assert.equal(out.err?.code, 'P0001');
    assert.match(out.err.message, /^homebrew_links: 2 frozen copies have no own holder/);
    assert.deepEqual({ n: out.n, frozen: out.frozen }, { n: 6, frozen: 4 });
  });

  it("reverses to a frozen copy of another account's item, a reference to an own one and a 1-hour request", async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      const [{ sid }] = await tx`insert into public.list_shares (list_id, audience)
        values (${LB}, 'player') returning id as sid`;
      await tx`insert into public.purchase_requests (id, list_id, share_id, audience, created_at, expires_at)
        values (${id(11501)}, ${LB}, ${sid}, 'player', now() - interval '10 minutes',
          now() - interval '10 minutes' + interval '30 days')`;
      await tx.unsafe(DOWN);
      const entries = (
        await tx`select list_id, item_key, snapshot is null as reference, snapshot ->> 'en' as en,
            snapshot #>> '{book,key}' as book, snapshot #> '{cards,sets}' ? ${SET} as set_card
          from public.list_entries order by list_id`
      ).map((r) => ({ ...r }));
      const [{ hour }] = await tx`select expires_at = created_at + interval '1 hour' as hour
        from public.purchase_requests where id = ${id(11501)}`;
      return { entries, hour };
    });
    assert.deepEqual(out.entries, [
      { list_id: LA, item_key: K.main, reference: true, en: null, book: null, set_card: null },
      {
        list_id: LB,
        item_key: K.main,
        reference: false,
        en: 'Main',
        book: ALDER,
        set_card: true
      },
      {
        list_id: LB2,
        item_key: K.main,
        reference: false,
        en: 'Main',
        book: ALDER,
        set_card: true
      }
    ]);
    assert.equal(out.hour, true);
  });
});

describe('get_homebrew_item()', () => {
  it('reads any item signed out, with its record, its related items and mine false', async () => {
    const v = await as('anon', undefined, (tx) => itemOf(tx, I0));
    assert.equal(v.hid, I0);
    assert.equal(v.mine, false);
    assert.match(v.revision, /^[0-9a-f]{32}$/);
    assert.equal(v.item.id, K.main);
    assert.equal(v.item.book.key, ALDER);
    assert.equal(v.item.book.section.key, BLADES);
    assert.deepEqual(Object.keys(v.item.cards.sets), [SET]);
    assert.deepEqual(Object.keys(v.item.cards.refs), [RULE]);
    assert.deepEqual(
      v.related.map((r) => r.key).sort(),
      [K.craft, K.from, K.line, K.set].sort()
    );
    const line = v.related.find((r) => r.key === K.line);
    assert.deepEqual(line, {
      hid: I4,
      key: K.line,
      kind: 'equip',
      en: 'Line mate',
      ru: 'Line mate',
      eq: { t: 'armor', tier: 2, line: LINE }
    });
    assert.deepEqual(
      v.related.find((r) => r.key === K.set),
      {
        hid: I3,
        key: K.set,
        kind: 'item',
        en: 'Сосед',
        ru: 'Сосед',
        tier: 2,
        set: SET
      }
    );
    assert.deepEqual(v.related.find((r) => r.key === K.from).craft_from, [K.main]);
  });

  it('answers a valid record and never an owner, a source id, another time or another uuid', async () => {
    const out = await as('anon', undefined, async (tx) => {
      const v = await itemOf(tx, I0);
      await tx.unsafe('reset role');
      const [{ ok }] =
        await tx`select public.homebrew_snapshot_valid(${tx.json(v.item)}) as ok`;
      return { v, ok };
    });
    assert.equal(out.ok, true);
    assert.deepEqual(Object.keys(out.v).sort(), [
      'hid',
      'item',
      'mine',
      'related',
      'revision',
      'updated_at'
    ]);
    const { updated_at: _time, ...inner } = out.v;
    const { keys, strings } = walk(inner);
    for (const k of ['owner_id', 'book_id', 'created_at', 'updated_at']) {
      assert.ok(!keys.includes(k), k);
    }
    assert.deepEqual(
      [...new Set(strings.filter((s) => UUID.test(s)))].sort(),
      [I0, I1, I2, I3, I4].sort()
    );
  });

  it('answers the latest edit of the item, its source and its named cards as updated_at, outside the revision', async () => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      // Times set by hand: the touch triggers would write now(). The deferred
      // broadcasts of the seed fire first, and the rollback turns the triggers on.
      await tx`set constraints all immediate`;
      for (const table of ['homebrew_items', 'homebrew_books', 'homebrew_cards']) {
        await tx.unsafe(`alter table public.${table} disable trigger user`);
      }
      const at = (table, rowId, ago) =>
        tx`update ${tx(table)} set updated_at = now() - ${ago}::interval where id = ${rowId}`;
      await at('homebrew_items', I0, '3 days');
      await at('homebrew_books', BA, '2 days');
      await at('homebrew_cards', CS, '1 day');
      await at('homebrew_cards', CR, '5 days');
      await at('homebrew_items', I5, '1 hour');
      const read = async () => {
        const [{ v, card, book }] = await tx`select public.get_homebrew_item(${I0}::uuid) as v,
            now() - interval '1 day' as card, now() - interval '2 days' as book`;
        return { at: Date.parse(v.updated_at), revision: v.revision, card, book };
      };
      const first = await read();
      await at('homebrew_cards', CS, '10 days');
      const second = await read();
      return { first, second };
    });
    assert.equal(out.first.at, out.first.card.getTime());
    assert.equal(out.second.at, out.second.book.getTime());
    assert.equal(out.second.revision, out.first.revision);
  });

  it('answers mine for the author only, and null for an unknown or a null id', async () => {
    const mine = await as('authenticated', A, (tx) => itemOf(tx, I0));
    const theirs = await as('authenticated', B, (tx) => itemOf(tx, I0));
    const unknown = await as('anon', undefined, (tx) => itemOf(tx, id(11999)));
    const none = await as('anon', undefined, async (tx) => {
      const [{ v }] = await tx`select public.get_homebrew_item(null) as v`;
      return v;
    });
    assert.equal(mine.mine, true);
    assert.equal(theirs.mine, false);
    assert.equal(unknown, null);
    assert.equal(none, null);
  });

  it('keeps the revision for an unchanged read, and moves it with a related item, not with an unrelated one', async () => {
    const out = await as('authenticated', A, async (tx) => {
      const first = (await itemOf(tx, I0)).revision;
      const again = (await itemOf(tx, I0)).revision;
      await tx`update public.homebrew_items set content = ${tx.json({ kind: 'item', en: 'Other 2' })}
        where id = ${I5}`;
      const unrelated = (await itemOf(tx, I0)).revision;
      await tx`update public.homebrew_items
        set content = ${tx.json({ kind: 'item', ru: 'Сосед 2', set: SET })} where id = ${I3}`;
      return { first, again, unrelated, related: (await itemOf(tx, I0)).revision };
    });
    assert.equal(out.again, out.first);
    assert.equal(out.unrelated, out.first);
    assert.notEqual(out.related, out.first);
  });

  it('answers at most 1000 related items', async () => {
    const n = await as('authenticated', A, async (tx) => {
      await tx.unsafe('reset role');
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${A}, 'homebrew_items_per_owner', null)`;
      await tx`insert into public.homebrew_items (id, owner_id, key, content)
        select gen_random_uuid(), ${A},
          'hb_s' || lpad(translate(g::text, '0123456789', 'abcdefghij'), 15, 'a'),
          jsonb_build_object('kind', 'item', 'en', 'Member ' || g, 'set', ${SET}::text)
        from generate_series(1, 1001) as g`;
      return (await itemOf(tx, I0)).related.length;
    });
    assert.equal(n, 1000);
  });
});

describe('get_homebrew_items()', () => {
  it('answers each id that exists, in order, as its record, to a signed-in caller', async () => {
    const out = await as('authenticated', B, async (tx) => {
      const [{ v }] = await tx`select public.get_homebrew_items(
        ${[I3, id(11999), I0, I3]}::uuid[]) as v`;
      const [{ record }] =
        await tx`select public.get_homebrew_item(${I0}::uuid) -> 'item' as record`;
      return { v, record };
    });
    assert.deepEqual(
      out.v.map((r) => r.hid),
      [I3, I0]
    );
    assert.deepEqual(out.v[1].item, out.record);
    assert.deepEqual(Object.keys(out.v[0]).sort(), ['hid', 'item']);
  });

  it('takes 1000 ids and refuses 1001', async () => {
    const ids = (n) => Array.from({ length: n }, (_, i) => id(20000 + i));
    const out = await as('authenticated', B, async (tx) => ({
      many: (await tx`select public.get_homebrew_items(${ids(1000)}::uuid[]) as v`)[0].v,
      over: await refused(
        tx,
        (sp) => sp`select public.get_homebrew_items(${ids(1001)}::uuid[])`
      )
    }));
    assert.deepEqual(out.many, []);
    assert.equal(out.over?.code, '22023');
  });

  it('refuses anon', async () => {
    await assert.rejects(
      as('anon', undefined, (tx) => tx`select public.get_homebrew_items(${[I0]}::uuid[])`),
      (err) => err.code === '42501'
    );
  });
});

describe('the projection of a link to another account', () => {
  it("fills the snapshot from the item owner's source and cards, with the hid beside it", async () => {
    const entry = await as('authenticated', B, async (tx) => {
      const [{ token }] = await tx`select token from public.create_list_share(${LB}, 'player')`;
      const [{ v }] = await tx`select public.get_shared_list(${token}) as v`;
      return v.entries[0];
    });
    assert.equal(entry.hid, I0);
    assert.equal(entry.snapshot.id, K.main);
    assert.equal(entry.snapshot.book.key, ALDER);
    assert.deepEqual(Object.keys(entry.snapshot.cards.sets), [SET]);
  });

  it("leaves a GM-only link out of a players' answer with its hid; the author's edit still bumps the list and writes the notice", async () => {
    const out = await as('authenticated', B, async (tx) => {
      await tx`update public.list_entries set gm_only = true where list_id = ${LB}`;
      const [{ token: player }] =
        await tx`select token from public.create_list_share(${LB}, 'player')`;
      const [{ token: gm }] = await tx`select token from public.create_list_share(${LB}, 'gm')`;
      const [{ v: players }] = await tx`select public.get_shared_list(${player}) as v`;
      const [{ v: gms }] = await tx`select public.get_shared_list(${gm}) as v`;
      await tx.unsafe('reset role');
      await tx`delete from public.list_notices`;
      await tx`update public.homebrew_items set content = ${tx.json({
        kind: 'item',
        en: 'Main 2'
      })} where id = ${I0}`;
      const [{ v: after }] = await tx`select public.get_shared_list(${player}) as v`;
      return { players, gms, after, notices: await notices(tx) };
    });
    assert.deepEqual(out.players.entries, []);
    assert.equal(walk(out.players).strings.includes(I0), false);
    assert.deepEqual(
      out.gms.entries.map((e) => [e.hid, e.gm_only]),
      [[I0, true]]
    );
    assert.ok(out.after.revision > out.players.revision);
    assert.deepEqual(
      out.notices.map((n) => [n.list_id, n.kind]),
      [
        [LB, 'changed'],
        [LB2, 'changed']
      ]
    );
  });
});

describe('the notices', () => {
  it('writes one changed notice per list of another owner on an edit, and none for the author', async () => {
    const rows = await as('authenticated', A, async (tx) => {
      await tx`update public.homebrew_items set content = ${tx.json({
        kind: 'item',
        en: 'Main 2',
        ru: 'Главный'
      })} where id = ${I0}`;
      await tx.unsafe('reset role');
      return notices(tx);
    });
    assert.deepEqual(rows, [
      {
        list_id: LB,
        item_key: K.main,
        hid: I0,
        kind: 'changed',
        name: { en: 'Main 2', ru: 'Главный' },
        unread: true
      },
      {
        list_id: LB2,
        item_key: K.main,
        hid: I0,
        kind: 'changed',
        name: { en: 'Main 2', ru: 'Главный' },
        unread: true
      }
    ]);
  });

  it('refreshes a read notice on the next change and makes it unread again, in one row', async () => {
    const out = await as('authenticated', A, async (tx) => {
      await tx.unsafe('reset role');
      await tx`insert into public.list_notices (list_id, item_key, hid, kind, name, created_at, read_at)
        values (${LB}, ${K.main}, ${I0}, 'changed', ${tx.json({ en: 'Old', ru: 'Old' })},
          now() - interval '3 days', now() - interval '2 days')`;
      await tx`update public.homebrew_cards set content = ${tx.json({ ru: 'Комплект 2' })}
        where id = ${CS}`;
      return (
        await tx`select count(*)::int as n, bool_and(created_at = now()) as fresh,
            bool_and(read_at is null) as unread
          from public.list_notices where list_id = ${LB}`
      ).map((r) => ({ ...r }))[0];
    });
    assert.deepEqual(out, { n: 1, fresh: true, unread: true });
  });

  it('turns the notice into deleted with the names on a delete, with no hid, and the cascade removes the entry', async () => {
    const out = await as('authenticated', A, async (tx) => {
      await tx`update public.homebrew_books set content = ${tx.json({ ru: 'Мастерская 2' })}
        where id = ${BA}`;
      await tx`delete from public.homebrew_items where id = ${I0}`;
      await tx.unsafe('reset role');
      return {
        rows: await notices(tx),
        entries: (await tx`select list_id from public.list_entries order by list_id`).map(
          (r) => r.list_id
        )
      };
    });
    assert.deepEqual(
      out.rows.map((r) => [r.list_id, r.kind, r.hid, r.name]),
      [
        [LB, 'deleted', null, { en: 'Main', ru: 'Main' }],
        [LB2, 'deleted', null, { en: 'Main', ru: 'Main' }]
      ]
    );
    assert.deepEqual(out.entries, []);
  });

  it("lets the list's owner read and delete its notices, never insert or update them, and nobody else see them", async () => {
    const edit = async (tx) => {
      await world(tx);
      await tx`update public.homebrew_items set content = ${tx.json({ kind: 'item', en: 'x' })}
        where id = ${I0}`;
    };
    const owner = await asRole(
      sql,
      { role: 'authenticated', sub: B, setup: edit },
      async (tx) => ({
        seen: (await tx`select list_id from public.list_notices`).length,
        insert: await refused(
          tx,
          (sp) => sp`insert into public.list_notices (list_id, item_key, kind, name)
          values (${LB}, 'ci1', 'changed', ${sp.json({ en: 'x' })})`
        ),
        update: await refused(
          tx,
          (sp) => sp`update public.list_notices set read_at = now() + interval '9 days'`
        ),
        deleted: (await tx`delete from public.list_notices where list_id = ${LB} returning id`)
          .length
      })
    );
    assert.equal(owner.seen, 2);
    assert.equal(owner.insert?.code, '42501');
    assert.equal(owner.update?.code, '42501');
    assert.equal(owner.deleted, 1);
    const author = await asRole(
      sql,
      { role: 'authenticated', sub: A, setup: edit },
      async (tx) => ({
        seen: (await tx`select id from public.list_notices`).length,
        deleted: (await tx`delete from public.list_notices returning id`).length
      })
    );
    assert.deepEqual(author, { seen: 0, deleted: 0 });
    await assert.rejects(
      asRole(
        sql,
        { role: 'anon', setup: edit },
        (tx) => tx`select id from public.list_notices`
      ),
      /permission denied/
    );
  });
});

describe('mark_list_read()', () => {
  /* The world, an edit (notices on LB and LB2), an old read notice on LB, and on LB a
     player share with three requests: unread and 20 days from expiry, unread and 10
     minutes from expiry, read an hour ago. */
  const seeded = async (tx) => {
    await world(tx);
    await tx`update public.homebrew_items set content = ${tx.json({ kind: 'item', en: 'x' })}
      where id = ${I0}`;
    await tx`insert into public.list_notices (list_id, item_key, kind, name, created_at, read_at)
      values (${LB}, 'hb_readbeforeaaaaaa', 'changed', ${tx.json({ en: 'r' })},
        now() - interval '2 days', now() - interval '1 day')`;
    const [{ sid }] = await tx`insert into public.list_shares (list_id, audience)
      values (${LB}, 'player') returning id as sid`;
    await tx`insert into public.purchase_requests (id, list_id, share_id, audience, created_at, expires_at, read_at)
      values (${id(11601)}, ${LB}, ${sid}, 'player', now() - interval '10 days', now() + interval '20 days', null),
        (${id(11602)}, ${LB}, ${sid}, 'player', now() - interval '30 days', now() + interval '10 minutes', null),
        (${id(11603)}, ${LB}, ${sid}, 'player', now() - interval '1 day', now() + interval '20 days',
          now() - interval '1 hour')`;
  };

  it('reads the unread rows of the list now, caps each unread request at 1 hour, and keeps the rest', async () => {
    const out = await asRole(
      sql,
      { role: 'authenticated', sub: B, setup: seeded },
      async (tx) => {
        await tx`select public.mark_list_read(${LB})`;
        await tx.unsafe('reset role');
        return {
          notices: (
            await tx`select list_id, item_key, read_at = now() as now, read_at < now() as earlier
            from public.list_notices order by list_id, item_key`
          ).map((r) => ({ ...r })),
          requests: (
            await tx`select id, read_at = now() as now, expires_at - now() as left
            from public.purchase_requests order by id`
          ).map((r) => ({ id: r.id, now: r.now, left: r.left }))
        };
      }
    );
    assert.deepEqual(out.notices, [
      { list_id: LB, item_key: K.main, now: true, earlier: false },
      { list_id: LB, item_key: 'hb_readbeforeaaaaaa', now: false, earlier: true },
      { list_id: LB2, item_key: K.main, now: null, earlier: null }
    ]);
    assert.deepEqual(
      out.requests.map((r) => [r.id, r.now]),
      [
        [id(11601), true],
        [id(11602), true],
        [id(11603), false]
      ]
    );
    assert.equal(out.requests[0].left, '01:00:00');
    assert.equal(out.requests[1].left, '00:10:00');
  });

  it('refuses another owner, a caller with no user id and anon', async () => {
    for (const [role, sub, code] of [
      ['authenticated', A, '42501'],
      ['authenticated', undefined, '42501'],
      ['anon', undefined, '42501']
    ]) {
      await assert.rejects(
        asRole(
          sql,
          { role, sub, setup: seeded },
          (tx) => tx`select public.mark_list_read(${LB})`
        ),
        (err) => err.code === code,
        `${role} ${sub ?? 'no user'}`
      );
    }
  });
});

describe('the notice messages', () => {
  before(async () => {
    await realtimePartition(sql);
  });

  it('commits one notice message per list owner per transaction, and none for a read', async () => {
    const a = crypto.randomUUID();
    const b = crypto.randomUUID();
    const item = crypto.randomUUID();
    const lists = [crypto.randomUUID(), crypto.randomUUID()];
    await sql.begin(async (tx) => {
      await tx`insert into auth.users (id) values (${a}), (${b})`;
      await tx`insert into public.homebrew_items (id, owner_id, key, content)
        values (${item}, ${a}, ${K.main}, ${tx.json({ kind: 'item', en: 'Main' })})`;
      await tx`insert into public.lists (id, owner_id) values (${lists[0]}, ${b}), (${lists[1]}, ${b})`;
      await tx`insert into public.list_entries (id, list_id, item_key, source, hb_item, position)
        values (${crypto.randomUUID()}, ${lists[0]}, ${K.main}, 'homebrew', ${item}, 0),
          (${crypto.randomUUID()}, ${lists[1]}, ${K.main}, 'homebrew', ${item}, 0)`;
    });
    const events = async () =>
      (await messagesTo(sql, `owner:${b}`))
        .filter((m) => m.event === 'notice' || m.event === 'request')
        .map((m) => m.event);
    try {
      await commitAs(
        sql,
        { role: 'authenticated', sub: a },
        (tx) =>
          tx`update public.homebrew_items set content = ${tx.json({ kind: 'item', en: 'Main 2' })}
          where id = ${item}`
      );
      assert.deepEqual(await events(), ['notice']);
      await commitAs(sql, { role: 'authenticated', sub: b }, async (tx) => {
        await tx`select public.mark_list_read(${lists[0]})`;
        await tx`select public.mark_list_read(${lists[1]})`;
      });
      assert.deepEqual(await events(), ['notice']);
      const [{ payload }] = (await messagesTo(sql, `owner:${b}`)).filter(
        (m) => m.event === 'notice'
      );
      assert.ok(lists.includes(payload.list), JSON.stringify(payload));
    } finally {
      await sql`delete from auth.users where id in (${a}, ${b})`;
    }
  });
});

describe('the triggers at 300 linking lists', () => {
  it('bump and notify 300 lists of other owners in under 1 s for each write of the author', async (t) => {
    const out = await rolledBack(async (tx) => {
      await world(tx);
      await tx`insert into auth.users (id)
        select ('00000000-0000-4000-8001-' || lpad(g::text, 12, '0'))::uuid
        from generate_series(1, 300) as g`;
      await tx`insert into public.lists (id, owner_id)
        select ('00000000-0000-4000-8002-' || lpad(g::text, 12, '0'))::uuid,
          ('00000000-0000-4000-8001-' || lpad(g::text, 12, '0'))::uuid
        from generate_series(1, 300) as g`;
      await tx`insert into public.list_entries (id, list_id, item_key, source, hb_item, position)
        select gen_random_uuid(), ('00000000-0000-4000-8002-' || lpad(g::text, 12, '0'))::uuid,
          ${K.main}, 'homebrew', ${I0}::uuid, 0
        from generate_series(1, 300) as g`;
      const timed = async (fn) => {
        const start = performance.now();
        await fn();
        return Math.round(performance.now() - start);
      };
      const ms = {
        item: await timed(
          () => tx`update public.homebrew_items set content = jsonb_set(content, '{en}', '"Main 2"')
            where id = ${I0}`
        ),
        source: await timed(
          () => tx`update public.homebrew_books set content = ${tx.json({ ru: 'Мастерская 2' })}
            where id = ${BA}`
        ),
        card: await timed(
          () => tx`update public.homebrew_cards set content = ${tx.json({ ru: 'Комплект 2' })}
            where id = ${CS}`
        )
      };
      const [{ n }] = await tx`select count(*)::int as n from public.list_notices
        where kind = 'changed'`;
      ms.delete = await timed(() => tx`delete from public.homebrew_items where id = ${I0}`);
      const [{ d }] = await tx`select count(*)::int as d from public.list_notices
        where kind = 'deleted'`;
      return { ms, n, d };
    });
    t.diagnostic(`300 linking lists, ms: ${JSON.stringify(out.ms)}`);
    assert.equal(out.n, 302);
    assert.equal(out.d, 302);
    for (const [write, ms] of Object.entries(out.ms))
      assert.ok(ms < 1000, `${write}: ${ms} ms`);
  });
});
