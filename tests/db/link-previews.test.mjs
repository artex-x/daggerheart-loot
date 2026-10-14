/*
  The preview host's two card reads (20261014120200_link_previews.sql):
  get_item_preview() answers the item keys a card draws, its own set card,
  its picture and three lines of related names, ordered by the database's ICU
  collation and cut at 1200 bytes, from exactly get_homebrew_item()'s related
  rows; get_shared_list_preview() answers the audience, the name, the start of
  the players' note and the count that the audience sees, null exactly when
  get_shared_list() is null. Neither shows more than those reads. Every seed
  runs in a transaction that rolls back. docs/specs/META.md, section 3;
  docs/decisions/2026-10-14-a-link-preview-reads-a-lean-projection.md.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, connect } from './roles.mjs';

const A = '00000000-0000-4000-8000-0000000005aa';
const B = '00000000-0000-4000-8000-0000000005bb';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const BA = id(51001);
const CS = id(51011);
const I0 = id(51100);
const LA = id(51201);
const SRC = 'hb_previewsrcaaaaaa';
const SECTION = 'hb_previewsectaaaaa';
const SET = 'hb_previewsetaaaaaa';
const LINE = 'hb_previewlineaaaaa';
const MAIN = 'hb_previewmainaaaaa';
/* A 16-letter key tail from a number, as homebrew_key_ok() takes it. */
const key = (prefix, n) =>
  'hb_' +
  prefix +
  String(n)
    .replace(/\d/g, (d) => 'abcdefghij'[d])
    .padStart(16 - prefix.length, 'a');

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

/* The answer of `fn(tx)` as anon over the seed `setup`. */
const asAnon = (setup, fn) => asRole(sql, { role: 'anon', setup }, fn);
const preview = async (tx, hid, lang) => {
  const [{ v }] = await tx`select public.get_item_preview(${hid}::uuid, ${lang}) as v`;
  return v;
};
const full = async (tx, hid) => {
  const [{ v }] = await tx`select public.get_homebrew_item(${hid}::uuid) as v`;
  return v;
};
const bytesOf = async (tx, v) => {
  const [{ n }] = await tx`select octet_length(${tx.json(v)}::jsonb::text)::int as n`;
  return n;
};

/* A's source with a section, A's set card, A's main item I0 (in the source, an armor on
   LINE, in SET, with the picture q1.webp, crafting into one own item and the catalog
   ci1, made from one own item and the catalog q1), and its relations both ways: an
   item that names I0 in craft_from, one that names it in craft, two set mates, a line
   mate and an unrelated item. */
const OWN = {
  into: key('into', 1),
  from: key('from', 1),
  nameInto: key('nint', 1),
  nameFrom: key('nfro', 1),
  setA: key('seta', 1),
  setB: key('setb', 1),
  line: key('line', 1),
  other: key('othr', 1)
};
const world = async (tx) => {
  await tx`insert into auth.users (id) values (${A}), (${B})`;
  await tx`insert into public.homebrew_books (id, owner_id, key, content) values
    (${BA}, ${A}, ${SRC}, ${tx.json({ ru: 'Мастерская', en: 'Workshop', sections: [{ key: SECTION, ru: 'Клинки', en: 'Blades' }] })})`;
  await tx`insert into public.homebrew_cards (id, owner_id, key, kind, content) values
    (${CS}, ${A}, ${SET}, 'set', ${tx.json({ ru: 'Комплект', en: 'Set', rud: 'Бонус.', ende: 'Bonus.' })})`;
  const armor = (tier) => ({ t: 'armor', tier, as: 3, th: [6, 12], line: LINE });
  await tx`insert into public.homebrew_items (id, owner_id, key, book_id, content, art) values
    (${I0}, ${A}, ${MAIN}, ${BA}, ${tx.json({
      kind: 'equip',
      ru: 'Главный',
      en: 'Main',
      rud: 'Текст.',
      ende: 'Text.',
      section: SECTION,
      eq: armor(1),
      set: SET,
      craft: [OWN.into, 'ci1'],
      craft_from: [OWN.from, 'q1']
    })}, 'q1.webp')`;
  const rows = [
    [OWN.into, { kind: 'item', ru: 'Цель', en: 'Target' }],
    [OWN.from, { kind: 'item', ru: 'Исход', en: 'Source' }],
    [OWN.nameInto, { kind: 'item', ru: 'Потомок', en: 'Heir', craft_from: [MAIN] }],
    [OWN.nameFrom, { kind: 'item', ru: 'Предок', en: 'Elder', craft: [MAIN] }],
    [OWN.setA, { kind: 'item', ru: 'Сосед', en: 'Mate', set: SET }],
    [OWN.setB, { kind: 'item', en: 'English mate', set: SET }],
    [OWN.line, { kind: 'equip', en: 'Line mate', eq: armor(2) }],
    [OWN.other, { kind: 'item', en: 'Other' }]
  ];
  for (const [i, [k, content]] of rows.entries())
    await tx`insert into public.homebrew_items (id, owner_id, key, content)
      values (${id(51110 + i)}, ${A}, ${k}, ${tx.json(content)})`;
};

/* The lines derived from get_homebrew_item()'s related rows: the own keys of each line. */
function linesOf(answer) {
  const it = answer.item;
  const rel = answer.related;
  const has = (a, k) => Array.isArray(a) && a.includes(k);
  const keys = (f) => new Set(rel.filter(f).map((r) => r.key));
  const set = keys((r) => typeof it.set === 'string' && it.set && r.set === it.set);
  if (typeof it.set === 'string' && it.set) set.add(it.id);
  return {
    from: keys((r) => has(it.craft_from, r.key) || has(r.craft, it.id)),
    into: keys((r) => has(it.craft, r.key) || has(r.craft_from, it.id)),
    set
  };
}

describe('the grants', () => {
  it('lets anon and authenticated execute both reads', async () => {
    const rows = await sql`
      select r.role, f.fn, has_function_privilege(r.role, f.fn, 'EXECUTE') as ok
      from (values ('anon'), ('authenticated')) as r(role),
        (values ('public.get_item_preview(uuid,text)'),
          ('public.get_shared_list_preview(text)')) as f(fn)`;
    assert.deepEqual(
      rows.filter((r) => !r.ok).map((r) => r.role + ' ' + r.fn),
      []
    );
  });

  it('has the ICU collations the order of the names needs', async () => {
    const rows = await sql`select collname from pg_collation
      where collname in ('ru-x-icu', 'en-x-icu') order by collname`;
    assert.deepEqual(
      rows.map((r) => r.collname),
      ['en-x-icu', 'ru-x-icu']
    );
  });
});

describe('get_item_preview()', () => {
  it('answers null for a null and an unknown id', async () => {
    const out = await asAnon(world, async (tx) => ({
      none: (await tx`select public.get_item_preview(null, 'ru') as v`)[0].v,
      unknown: await preview(tx, id(51999), 'en')
    }));
    assert.equal(out.none, null);
    assert.equal(out.unknown, null);
  });

  it('refuses a language other than ru or en, null included', async () => {
    for (const lang of ['de', null]) {
      await assert.rejects(
        asAnon(world, (tx) => preview(tx, I0, lang)),
        (err) => err.code === '22023' && /p_lang is ru or en/.test(err.message)
      );
    }
  });

  it("answers the drawn keys of get_homebrew_item()'s item, its img and its set card, and nothing else", async () => {
    const out = await asAnon(world, async (tx) => ({
      ru: await preview(tx, I0, 'ru'),
      en: await preview(tx, I0, 'en'),
      full: await full(tx, I0)
    }));
    for (const lang of ['ru', 'en']) {
      const v = out[lang];
      assert.deepEqual(Object.keys(v).sort(), ['hid', 'img', 'item', 'lines', 'set_card']);
      assert.equal(v.hid, I0);
      assert.equal(v.img, out.full.img);
      assert.equal(v.img, 'q1.webp');
      const drawn = ['en', 'ru', 'ende', 'rud', 'eq', 'book', 'set', 'craft', 'craft_from'];
      assert.deepEqual(
        Object.keys(v.item).sort(),
        drawn.filter((k) => k in out.full.item).sort()
      );
      for (const k of Object.keys(v.item)) assert.deepEqual(v.item[k], out.full.item[k], k);
      assert.deepEqual(v.item.book.section, { key: SECTION, ru: 'Клинки', en: 'Blades' });
      const card = out.full.item.cards.sets[SET];
      assert.deepEqual(v.set_card, {
        en: card.en,
        ru: card.ru,
        ende: card.ende,
        rud: card.rud
      });
      assert.deepEqual(Object.keys(v.lines).sort(), ['from', 'into', 'set']);
    }
  });

  it("counts each line as derived from get_homebrew_item()'s related rows, with related names only", async () => {
    const out = await asAnon(world, async (tx) => ({
      ru: await preview(tx, I0, 'ru'),
      en: await preview(tx, I0, 'en'),
      full: await full(tx, I0)
    }));
    const want = linesOf(out.full);
    assert.deepEqual(Object.fromEntries(Object.entries(want).map(([k, s]) => [k, s.size])), {
      from: 2,
      into: 2,
      set: 3
    });
    for (const lang of ['ru', 'en']) {
      const allowed = new Set([...out.full.related.map((r) => r[lang]), out.full.item[lang]]);
      for (const line of ['from', 'into', 'set']) {
        const l = out[lang].lines[line];
        assert.equal(l.n, want[line].size, lang + ' ' + line);
        assert.equal(l.names.length, l.n, lang + ' ' + line);
        for (const name of l.names) assert.ok(allowed.has(name), name);
      }
    }
    const sorted = (a, lang) => [...a].sort((x, y) => x.localeCompare(y, lang));
    assert.deepEqual(
      out.ru.lines.set.names,
      sorted(['Главный', 'Сосед', 'English mate'], 'ru')
    );
    assert.deepEqual(out.en.lines.into.names, ['Heir', 'Target']);
  });

  it('answers empty lines and no set card for an item with no relation', async () => {
    const out = await asAnon(world, (tx) => preview(tx, id(51117), 'en'));
    assert.deepEqual(out.lines, {
      from: { n: 0, names: [] },
      into: { n: 0, names: [] },
      set: { n: 0, names: [] }
    });
    assert.deepEqual(Object.keys(out).sort(), ['hid', 'item', 'lines']);
  });

  it("orders each line's names as localeCompare does in ru and en", async () => {
    const names = [
      ['ёж', 'yak'],
      ['Ель', 'Elm'],
      ['еда', 'eat'],
      ['Ёлка', 'éclair'],
      ['Яблоко', 'Zeta'],
      ['Zeta', 'alpha'],
      ['alpha', 'Alpha2'],
      ['10 мечей', '10 swords'],
      ['2 меча', '2 swords'],
      ['жук', 'beetle']
    ];
    const setup = async (tx) => {
      await world(tx);
      for (const [i, [ru, en]] of names.entries())
        await tx`insert into public.homebrew_items (id, owner_id, key, content) values
          (${id(51300 + i)}, ${A}, ${key('ordr', i)}, ${tx.json({ kind: 'item', ru, en, set: SET })})`;
    };
    const out = await asAnon(setup, async (tx) => ({
      ru: await preview(tx, I0, 'ru'),
      en: await preview(tx, I0, 'en')
    }));
    const own = {
      ru: ['Главный', 'Сосед', 'English mate'],
      en: ['Main', 'Mate', 'English mate']
    };
    for (const [lang, col] of [
      ['ru', 0],
      ['en', 1]
    ]) {
      const all = [...names.map((n) => n[col]), ...own[lang]];
      assert.deepEqual(
        out[lang].lines.set.names,
        [...all].sort((a, b) => a.localeCompare(b, lang)),
        lang
      );
    }
  });

  /* `count` set mates of A at the validators' maxima - 120-character names of 'Я' and of
     '"' - the first 50 also naming I0 in craft, the next 50 in craft_from; I0 with two
     3000-character texts and a set card with two 1500-character texts. */
  const heavy = (count) => async (tx) => {
    await world(tx);
    await tx`insert into public.user_limit_overrides (user_id, key, value)
      values (${A}, 'homebrew_items_per_owner', null)`;
    await tx`update public.homebrew_cards set content = ${tx.json({
      ru: 'Б'.repeat(80),
      en: '"'.repeat(80),
      rud: 'Ж'.repeat(1500),
      ende: '"'.repeat(1500)
    })} where id = ${CS}`;
    await tx`update public.homebrew_items set content = content || ${tx.json({
      ru: 'Я'.repeat(120),
      en: '"'.repeat(120),
      rud: 'Ж'.repeat(3000),
      ende: '"'.repeat(3000)
    })}::jsonb where id = ${I0}`;
    await tx`insert into public.homebrew_items (id, owner_id, key, content)
      select gen_random_uuid(), ${A},
        'hb_m' || lpad(translate(g::text, '0123456789', 'abcdefghij'), 15, 'a'),
        jsonb_build_object('kind', 'item', 'ru', repeat('Я', 120), 'en', repeat('"', 120),
          'set', ${SET}::text)
        || case when g <= 50 then jsonb_build_object('craft', jsonb_build_array(${MAIN}::text))
           when g <= 100 then jsonb_build_object('craft_from', jsonb_build_array(${MAIN}::text))
           else '{}'::jsonb end
      from generate_series(1, ${count}::int) as g`;
  };

  for (const count of [300, 1000]) {
    it(`stays at or under 32768 bytes with ${count} related rows at the maxima, each line cut at 1200 bytes with n kept`, async (t) => {
      const out = await asAnon(heavy(count), async (tx) => {
        const ru = await preview(tx, I0, 'ru');
        const en = await preview(tx, I0, 'en');
        const all = await full(tx, I0);
        return {
          ru,
          en,
          want: linesOf(all),
          related: all.related.length,
          sizes: {
            ru: await bytesOf(tx, ru),
            en: await bytesOf(tx, en),
            full: await bytesOf(tx, all)
          }
        };
      });
      t.diagnostic(
        `${count} related rows: get_item_preview ru ${out.sizes.ru} bytes, en ${out.sizes.en} bytes; get_homebrew_item ${out.sizes.full} bytes`
      );
      for (const lang of ['ru', 'en']) {
        assert.ok(out.sizes[lang] <= 32768, `${lang} ${out.sizes[lang]}`);
        for (const line of ['from', 'into', 'set']) {
          const l = out[lang].lines[line];
          assert.equal(l.n, out.want[line].size, lang + ' ' + line);
          assert.ok(l.names.length < l.n, lang + ' ' + line);
          const used = l.names.reduce((s, n) => s + Buffer.byteLength(n) + 2, 0);
          assert.ok(used <= 1200 && used > 1200 - 244, `${lang} ${line} ${used}`);
        }
      }
      // the world's seven related items join the set mates, up to the read's cap
      assert.equal(out.related, Math.min(count + 7, 1000));
    });
  }

  it("answers the same for another owner's item as anon and as a third account", async () => {
    const anon = await asAnon(world, (tx) => preview(tx, I0, 'ru'));
    const third = await asRole(sql, { role: 'authenticated', sub: B, setup: world }, (tx) =>
      preview(tx, I0, 'ru')
    );
    const owner = await asRole(sql, { role: 'authenticated', sub: A, setup: world }, (tx) =>
      preview(tx, I0, 'ru')
    );
    assert.deepEqual(third, anon);
    assert.deepEqual(owner, anon);
  });
});

describe('get_shared_list_preview()', () => {
  const tokens = {};
  /* A's list LA with a 200-character name, both notes, the entries `entries` (the
     second and the fifth GM-only, each with notes and a price), and a players' and a GM
     share; B owns nothing. */
  const listWorld =
    ({ entries = 6, name = 'Лавка', note = 'для игроков', limit = false } = {}) =>
    async (tx) => {
      await tx`insert into auth.users (id) values (${A}), (${B})`;
      if (limit)
        await tx`insert into public.user_limit_overrides (user_id, key, value)
          values (${A}, 'entries_per_list', null)`;
      await tx`insert into public.lists (id, owner_id, name, money_mode, player_note, gm_note)
        values (${LA}, ${A}, ${name}, 'coin', ${note}, 'MARK_gm_note')`;
      await tx`insert into public.list_entries
        (id, list_id, item_key, position, quantity, price_coins, player_note, gm_note, gm_only)
        select gen_random_uuid(), ${LA}, 'k' || g, g, 2, 98765, 'MARK_entry_p', 'MARK_entry_g',
          g in (2, 5)
        from generate_series(1, ${entries}::int) as g`;
      for (const audience of ['player', 'gm']) {
        const [s] = await tx`insert into public.list_shares (list_id, audience)
          values (${LA}, ${audience}) returning token`;
        tokens[audience] = s.token;
      }
    };
  const both = async (tx, token) => {
    const [{ p, s }] = await tx`select public.get_shared_list_preview(${token}) as p,
      public.get_shared_list(${token}) as s`;
    return { p, s };
  };

  it('answers null exactly when get_shared_list() does: a null, a 42-character, a malformed, an unknown and a revoked token', async () => {
    const out = await asAnon(listWorld(), async (tx) => {
      const cases = {
        null: await both(tx, null),
        short: await both(tx, 'A'.repeat(42)),
        malformed: await both(tx, 'A'.repeat(42) + '!'),
        unknown: await both(tx, 'A'.repeat(43)),
        live: await both(tx, tokens.player)
      };
      await tx.unsafe('reset role');
      await tx`update public.list_shares set revoked_at = now() where token = ${tokens.player}`;
      await tx.unsafe('set local role anon');
      cases.revoked = await both(tx, tokens.player);
      return cases;
    });
    for (const [name, { p, s }] of Object.entries(out)) {
      assert.equal(p === null, s === null, name);
      assert.equal(p === null, name !== 'live', name);
    }
  });

  it("answers the players' name, note and count on a players' token, and every entry on a GM token", async () => {
    const out = await asAnon(listWorld(), async (tx) => ({
      player: await both(tx, tokens.player),
      gm: await both(tx, tokens.gm)
    }));
    const { p, s } = out.player;
    assert.deepEqual(Object.keys(p).sort(), ['audience', 'n', 'name', 'note']);
    assert.equal(p.audience, 'player');
    assert.equal(p.name, s.list.name);
    assert.equal(p.note, s.list.player_note);
    assert.equal(p.n, s.entries.length);
    assert.equal(p.n, 4);
    assert.equal(out.gm.p.audience, 'gm');
    assert.equal(out.gm.p.n, out.gm.s.entries.length);
    assert.equal(out.gm.p.n, 6);
    assert.ok(out.gm.p.n > p.n);
    for (const audience of ['player', 'gm']) {
      const text = JSON.stringify(out[audience].p);
      assert.doesNotMatch(text, /MARK|98765/, audience);
    }
  });

  it("cuts the players' note to its first 1000 characters", async () => {
    const note = 'Ж'.repeat(999) + 'ЯZ' + 'x'.repeat(2000);
    const out = await asAnon(listWorld({ note }), (tx) => both(tx, tokens.player));
    assert.equal(out.p.note, out.s.list.player_note.slice(0, 1000));
    assert.equal(out.p.note, 'Ж'.repeat(999) + 'Я');
  });

  it('stays at or under 4096 bytes with 300 entries and the longest name and note', async (t) => {
    const out = await asAnon(
      listWorld({ entries: 300, name: '"'.repeat(200), note: '"'.repeat(4000), limit: true }),
      async (tx) => {
        const r = await both(tx, tokens.gm);
        return { ...r, bytes: await bytesOf(tx, r.p), full: await bytesOf(tx, r.s) };
      }
    );
    t.diagnostic(
      `300 entries: get_shared_list_preview ${out.bytes} bytes; get_shared_list ${out.full} bytes`
    );
    assert.equal(out.p.n, 300);
    assert.ok(out.bytes <= 4096, String(out.bytes));
  });
});
