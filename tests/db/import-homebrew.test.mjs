/*
  import_homebrew() and move_homebrew_items(): a homebrew-v1 file's sources,
  cards and items written in one call, every row or none, and a selection of
  items moved to a source and a section in one call, every item or none. Both
  run as the caller, so row level security, the table checks and the count
  limits apply as to a plain write. A held key is skipped or, with the update
  flag, rewritten; a held source only gains sections, and its names change only
  with `names`. A source is read under a share lock, so no row lands in a source
  or section changed meanwhile. A move names each item's revision: a stale one
  rolls back all.
  docs/decisions/2026-10-02-homebrew-import-and-the-bulk-move-are-one-call-each.md.
*/
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asRole, commitAs, connect, messagesTo, realtimePartition } from './roles.mjs';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const id = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';
/* A key from a number: `hb_` and 16 base32 characters, `a` padded. */
const key = (prefix, n) => {
  let tail = '';
  let v = n;
  do {
    tail = BASE32[v % 32] + tail;
    v = Math.floor(v / 32);
  } while (v > 0);
  return 'hb_' + (prefix + tail.padStart(16 - prefix.length, 'a')).slice(0, 16);
};

const ALDER = 'hb_alderworkshopaaa';
const PISTOLS = 'hb_sectpistolsaaaaa';
const BLADES = 'hb_sectbladesaaaaaa';
const SET = 'hb_embersetaaaaaaaa';
const RULE = 'hb_reloadruleaaaaaa';
const FLINT = 'hb_flintlockpistola';
const ROLL = 'hb_bedrollaaaaaaaaa';
const RING = 'hb_ringaaaaaaaaaaaa';

let sql;
before(() => {
  sql = connect();
});
after(async () => {
  await sql.end();
});

const users = (tx) => tx`insert into auth.users (id) values (${A}), (${B})`;
const asA = (setup, fn) => asRole(sql, { role: 'authenticated', sub: A, setup }, fn);
/* postgres.js serialises a jsonb parameter itself (see list-writes.test.mjs). */
const json = (tx, v) => (v === null ? null : tx.json(v));
const importAs = async (tx, books, cards, items, update = false) => {
  const [{ v }] = await tx`select public.import_homebrew(${json(tx, books)}::jsonb,
    ${json(tx, cards)}::jsonb, ${json(tx, items)}::jsonb, ${update}::boolean) as v`;
  return v;
};
const moveAs = async (tx, items, book, section) => {
  const [{ n }] = await tx`select public.move_homebrew_items(${json(tx, items)}::jsonb,
    ${book}::uuid, ${section}::text) as n`;
  return n;
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
/* Reads as the connection's own role, which row level security does not bind, then acts
   as A again. */
const unbound = async (tx, fn) => {
  await tx.unsafe('reset role');
  const out = await fn(tx);
  await tx.unsafe('set local role authenticated');
  return out;
};
const rows = async (tx) => ({
  books: [
    ...(await tx`select id, owner_id, key, content, revision::int as revision
      from public.homebrew_books order by owner_id, key`)
  ].map((r) => ({ ...r })),
  cards: [
    ...(await tx`select id, owner_id, key, kind, book_id, content, revision::int as revision
      from public.homebrew_cards order by owner_id, key`)
  ].map((r) => ({ ...r })),
  items: [
    ...(await tx`select id, owner_id, key, book_id, content, revision::int as revision
      from public.homebrew_items order by owner_id, key`)
  ].map((r) => ({ ...r }))
});
const counts = (o = {}) => ({
  books_created: 0,
  cards_created: 0,
  cards_updated: 0,
  cards_skipped: 0,
  items_created: 0,
  items_updated: 0,
  items_skipped: 0,
  ...o
});

const BOOK = {
  id: id(9001),
  key: ALDER,
  names: true,
  content: {
    ru: 'Мастерская Ольхи',
    en: 'Alder Workshop',
    sections: [
      { key: PISTOLS, ru: 'Пистоли', en: 'Pistols' },
      { key: BLADES, ru: 'Холодное оружие', en: 'Blades' }
    ]
  }
};
const CARDS = [
  {
    id: id(9101),
    key: SET,
    kind: 'set',
    book: ALDER,
    content: { ru: 'Тлеющая пара', rud: 'Оба пистоля: +1 к урону.' }
  },
  {
    id: id(9102),
    key: RULE,
    kind: 'ref',
    book: null,
    content: { ru: 'Перезарядка', rusub: 'Свойство оружия', rud: 'Действие: перезарядить.' }
  }
];
const FLINT_CONTENT = {
  kind: 'equip',
  ru: 'Кремнёвый пистоль',
  section: PISTOLS,
  set: SET,
  refs: [RULE],
  eq: {
    t: 'weapon',
    tier: 1,
    cls: 'phy',
    tr: 'finesse',
    rg: 'far',
    dmg: 'd8+1',
    dt: 'phy',
    bu: 1
  }
};
const ITEMS = [
  { id: id(9201), key: FLINT, book: ALDER, content: FLINT_CONTENT },
  { id: id(9202), key: RING, book: ALDER, content: { kind: 'item', en: 'Ring', set: SET } },
  {
    id: id(9203),
    key: ROLL,
    book: null,
    content: { kind: 'item', ru: 'Скатка', craft_from: ['ci1', 'dv34'] }
  }
];
const plainItems = (n, from = 0, extra = {}) =>
  Array.from({ length: n }, (_, i) => ({
    id: id(20000 + from + i),
    key: key('it', from + i),
    book: null,
    content: { kind: 'item', ru: 'Предмет ' + String(from + i), ...extra }
  }));

describe('import_homebrew and move_homebrew_items grants and shape', () => {
  it('pins EXECUTE for authenticated only, security invoker and the search path', async () => {
    const found = await sql`
      select p.oid::regprocedure::text as fn,
        has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authed,
        has_function_privilege('service_role', p.oid, 'EXECUTE') as service,
        p.prosecdef, p.proconfig
      from pg_proc p
      where p.pronamespace = 'public'::regnamespace
        and p.proname in ('import_homebrew', 'move_homebrew_items')`;
    const pin = {
      anon: false,
      authed: true,
      service: false,
      prosecdef: false,
      proconfig: ['search_path=public, pg_temp']
    };
    assert.deepEqual(Object.fromEntries(found.map(({ fn, ...r }) => [fn, r])), {
      'import_homebrew(jsonb,jsonb,jsonb,boolean)': pin,
      'move_homebrew_items(jsonb,uuid,text)': pin
    });
  });

  it('refuses anon both calls', async () => {
    for (const call of [
      (tx) => importAs(tx, [], [], []),
      (tx) => moveAs(tx, [{ id: id(1), revision: 1 }], null, null)
    ]) {
      await assert.rejects(
        asRole(sql, { role: 'anon', setup: users }, call),
        byCode('42501', /permission denied/)
      );
    }
  });

  it('refuses a caller with no user id with 28000', async () => {
    await assert.rejects(
      asRole(sql, { role: 'authenticated', setup: users }, (tx) => importAs(tx, [], [], [])),
      byCode('28000', /^import_homebrew: not signed in$/)
    );
    await assert.rejects(
      asRole(sql, { role: 'authenticated', setup: users }, (tx) =>
        moveAs(tx, [{ id: id(1), revision: 1 }], null, null)
      ),
      byCode('28000', /^move_homebrew_items: not signed in$/)
    );
  });

  const twice = [ITEMS[0], { ...ITEMS[1], key: FLINT }];
  const malformed = [
    ['SQL null sources', [null, [], [], false]],
    ['an object for the cards', [[], {}, [], false]],
    ['a null update flag', [[], [], [], null]],
    [
      '101 sources',
      [
        Array.from({ length: 101 }, (_, i) => ({
          id: id(30000 + i),
          key: key('bk', i),
          names: false,
          content: { ru: 'И' + String(i) }
        })),
        [],
        [],
        false
      ]
    ],
    [
      '1001 cards',
      [
        [],
        Array.from({ length: 1001 }, (_, i) => ({
          id: id(40000 + i),
          key: key('cd', i),
          kind: 'set',
          book: null,
          content: { ru: 'К' }
        })),
        [],
        false
      ]
    ],
    ['1001 items', [[], [], plainItems(1001), false]],
    ['an item key twice', [[], [], twice, false]],
    ['a row that is not an object', [[], [], [1], false]]
  ];
  for (const [what, [books, cards, items, update]] of malformed) {
    it(`refuses ${what} with 22023, writing nothing`, async () => {
      const out = await asA(users, async (tx) => ({
        err: await refused(tx, (sp) => importAs(sp, books, cards, items, update)),
        rows: await unbound(tx, rows)
      }));
      byCode('22023', /^import_homebrew: /)(out.err);
      assert.deepEqual(out.rows, { books: [], cards: [], items: [] });
    });
  }
});

describe('an import, as A', () => {
  it('writes the sources, the cards and the items with their sources, and answers the counts', async () => {
    const out = await asA(users, async (tx) => ({
      n: await importAs(tx, [BOOK], CARDS, ITEMS),
      rows: await unbound(tx, rows)
    }));
    assert.deepEqual(out.n, counts({ books_created: 1, cards_created: 2, items_created: 3 }));
    const [book] = out.rows.books;
    assert.deepEqual(
      { id: book.id, owner_id: book.owner_id, key: book.key, content: book.content },
      { id: BOOK.id, owner_id: A, key: ALDER, content: BOOK.content }
    );
    assert.deepEqual(
      out.rows.cards.map((c) => [c.key, c.kind, c.book_id, c.content]),
      [
        [SET, 'set', BOOK.id, CARDS[0].content],
        [RULE, 'ref', null, CARDS[1].content]
      ]
    );
    assert.deepEqual(
      out.rows.items.map((i) => [i.key, i.book_id, i.content]),
      [
        [ROLL, null, ITEMS[2].content],
        [FLINT, BOOK.id, FLINT_CONTENT],
        [RING, BOOK.id, ITEMS[1].content]
      ]
    );
  });

  it('skips every held key by default and changes no row, a retry of the same rows included', async () => {
    const out = await asA(users, async (tx) => {
      await importAs(tx, [BOOK], CARDS, ITEMS);
      const once = await unbound(tx, rows);
      const n = await importAs(tx, [BOOK], CARDS, ITEMS);
      return { once, n, twice: await unbound(tx, rows) };
    });
    assert.deepEqual(out.n, counts({ cards_skipped: 2, items_skipped: 3 }));
    assert.deepEqual(out.twice, out.once);
  });

  it('rewrites the held items and cards whole with the update flag, and merges the source', async () => {
    const edited = {
      ...BOOK,
      id: id(9901),
      content: {
        en: 'Alder Workshop II',
        sections: [
          { key: BLADES, ru: 'Клинки' },
          { key: 'hb_sectarmouraaaaaa', ru: 'Доспехи' }
        ]
      }
    };
    const newFlint = { kind: 'item', ru: 'Пистоль без ствола' };
    const out = await asA(users, async (tx) => {
      await importAs(tx, [BOOK], CARDS, ITEMS);
      const n = await importAs(
        tx,
        [edited],
        [{ ...CARDS[0], id: id(9902), content: { ru: 'Пара', rud: 'Новый бонус.' } }, CARDS[1]],
        [{ ...ITEMS[0], id: id(9903), book: null, content: newFlint }, ITEMS[1], ITEMS[2]],
        true
      );
      return { n, rows: await unbound(tx, rows) };
    });
    assert.deepEqual(
      out.n,
      counts({ cards_updated: 1, cards_skipped: 1, items_updated: 1, items_skipped: 2 })
    );
    const [book] = out.rows.books;
    assert.equal(book.id, BOOK.id);
    assert.deepEqual(book.content, {
      ru: 'Мастерская Ольхи',
      en: 'Alder Workshop II',
      sections: [...BOOK.content.sections, { key: 'hb_sectarmouraaaaaa', ru: 'Доспехи' }]
    });
    assert.equal(book.revision, 2);
    const flint = out.rows.items.find((i) => i.key === FLINT);
    assert.deepEqual([flint.id, flint.book_id, flint.content], [id(9201), null, newFlint]);
    assert.equal(flint.revision, 2);
    const set = out.rows.cards.find((c) => c.key === SET);
    assert.deepEqual(
      [set.id, set.content, set.revision],
      [id(9101), { ru: 'Пара', rud: 'Новый бонус.' }, 2]
    );
    for (const r of [...out.rows.items, ...out.rows.cards].filter(
      (r) => r.key !== FLINT && r.key !== SET
    )) {
      assert.equal(r.revision, 1, r.key + ' was written though it did not change');
    }
  });

  it("keeps a held source's names without `names`, and merges its sections without the update flag", async () => {
    const out = await asA(users, async (tx) => {
      await importAs(tx, [BOOK], [], []);
      const renamed = {
        ...BOOK,
        names: false,
        content: { en: 'Other', sections: [{ key: 'hb_sectarmouraaaaaa', en: 'Armour' }] }
      };
      await importAs(tx, [renamed], [], [], true);
      const kept = (await unbound(tx, rows)).books[0].content;
      await importAs(
        tx,
        [
          {
            ...BOOK,
            content: { en: 'Skipped', sections: [{ key: 'hb_secttoolsaaaaaaa', en: 'Tools' }] }
          }
        ],
        [],
        []
      );
      return { kept, after: (await unbound(tx, rows)).books[0].content };
    });
    assert.deepEqual(out.kept, {
      ...BOOK.content,
      sections: [...BOOK.content.sections, { key: 'hb_sectarmouraaaaaa', en: 'Armour' }]
    });
    assert.deepEqual(out.after, {
      ...BOOK.content,
      sections: [...out.kept.sections, { key: 'hb_secttoolsaaaaaaa', en: 'Tools' }]
    });
  });

  it('refuses a merge past 30 sections by the check of the table, writing nothing', async () => {
    const sections = (n, from) =>
      Array.from({ length: n }, (_, i) => ({ key: key('sc', from + i), ru: 'Р' + (from + i) }));
    const out = await asA(users, async (tx) => {
      await importAs(
        tx,
        [{ ...BOOK, content: { ru: 'М', sections: sections(20, 0) } }],
        [],
        []
      );
      const was = await unbound(tx, rows);
      const err = await refused(tx, (sp) =>
        importAs(
          sp,
          [{ ...BOOK, content: { ru: 'М', sections: sections(11, 20) } }],
          [],
          plainItems(1)
        )
      );
      return { was, err, now: await unbound(tx, rows) };
    });
    byCode('23514', /homebrew_books_content_check/)(out.err);
    assert.deepEqual(out.now, out.was);
  });

  it('skips a held card of another kind under the update flag', async () => {
    const out = await asA(users, async (tx) => {
      await importAs(tx, [BOOK], CARDS, []);
      const n = await importAs(
        tx,
        [],
        [{ ...CARDS[1], kind: 'set', content: { ru: 'X' } }],
        [],
        true
      );
      return { n, card: (await unbound(tx, rows)).cards.find((c) => c.key === RULE) };
    });
    assert.deepEqual(out.n, counts({ cards_skipped: 1 }));
    assert.deepEqual([out.card.kind, out.card.content], ['ref', CARDS[1].content]);
  });

  const unknown = [
    [
      'a card of an unknown source',
      [[], [{ ...CARDS[1], book: 'hb_nosuchsourceaaaa' }], []],
      /^import_homebrew: no source hb_nosuchsourceaaaa$/
    ],
    [
      'an item of an unknown source',
      [[BOOK], [], [{ ...ITEMS[2], book: 'hb_nosuchsourceaaaa' }]],
      /^import_homebrew: no source hb_nosuchsourceaaaa$/
    ],
    [
      'a section its source lacks',
      [
        [BOOK],
        [],
        [{ ...ITEMS[0], content: { ...FLINT_CONTENT, section: 'hb_sectnoneaaaaaaaa' } }]
      ],
      /^import_homebrew: no section hb_sectnoneaaaaaaaa$/
    ],
    [
      'a section with no source',
      [[], [], [{ ...ITEMS[2], content: { ...ITEMS[2].content, section: PISTOLS } }]],
      /^import_homebrew: a section with no source$/
    ]
  ];
  for (const [what, [books, cards, items], text] of unknown) {
    it(`refuses ${what} with 22023, writing nothing`, async () => {
      const out = await asA(users, async (tx) => ({
        err: await refused(tx, (sp) => importAs(sp, books, cards, items)),
        rows: await unbound(tx, rows)
      }));
      byCode('22023', text)(out.err);
      assert.deepEqual(out.rows, { books: [], cards: [], items: [] });
    });
  }

  it('refuses 101 new items at the default limit, writing no source either', async () => {
    const out = await asA(users, async (tx) => ({
      err: await refused(tx, (sp) => importAs(sp, [BOOK], [], plainItems(101))),
      rows: await unbound(tx, rows)
    }));
    byCode('P0001', /^limit: homebrew_items_per_owner$/)(out.err);
    assert.equal(out.err.detail, '100');
    assert.deepEqual(out.rows, { books: [], cards: [], items: [] });
  });

  it('imports 300 items in one call under an override of 300', async () => {
    const raised = async (tx) => {
      await users(tx);
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${A}, 'homebrew_items_per_owner', 300)`;
    };
    const out = await asA(raised, async (tx) => ({
      n: await importAs(tx, [], [], plainItems(300)),
      rows: await unbound(tx, rows)
    }));
    assert.deepEqual(out.n, counts({ items_created: 300 }));
    assert.equal(out.rows.items.length, 300);
  });

  it('refuses a carriage return in a name by the check of the table', async () => {
    const out = await asA(users, async (tx) => ({
      err: await refused(tx, (sp) =>
        importAs(sp, [], [], [{ ...ITEMS[2], content: { kind: 'item', ru: 'Две\r\nстроки' } }])
      ),
      rows: await unbound(tx, rows)
    }));
    byCode('23514', /homebrew_items_content_check/)(out.err);
    assert.deepEqual(out.rows.items, []);
  });

  it("takes a key B holds as A's own, and leaves B's row", async () => {
    const bHolds = async (tx) => {
      await users(tx);
      await tx`insert into public.homebrew_items (id, owner_id, key, content)
        values (${id(9500)}, ${B}, ${ROLL}, ${tx.json({ kind: 'item', en: 'B roll' })})`;
    };
    const out = await asA(bHolds, async (tx) => ({
      n: await importAs(tx, [], [], [ITEMS[2]], true),
      rows: await unbound(tx, rows)
    }));
    assert.deepEqual(out.n, counts({ items_created: 1 }));
    assert.deepEqual(
      out.rows.items.map((i) => [i.owner_id, i.key, i.content, i.revision]),
      [
        [A, ROLL, ITEMS[2].content, 1],
        [B, ROLL, { kind: 'item', en: 'B roll' }, 1]
      ].sort((x, y) => x[0].localeCompare(y[0]))
    );
  });
});

describe('a move, as A', () => {
  /* A's source with two sections, a second source, and three items: two in the first
     source's pistols, one in the default source. */
  const world = async (tx) => {
    await users(tx);
    await tx`insert into public.homebrew_books (id, owner_id, key, content) values
      (${BOOK.id}, ${A}, ${ALDER}, ${tx.json(BOOK.content)}),
      (${id(9002)}, ${A}, 'hb_secondsourceaaaa', ${tx.json({ ru: 'Второй' })}),
      (${id(9003)}, ${B}, 'hb_bsourceaaaaaaaaa', ${tx.json({ ru: 'Чужой' })})`;
    await tx`insert into public.homebrew_items (id, owner_id, key, book_id, content) values
      (${id(9201)}, ${A}, ${FLINT}, ${BOOK.id}, ${tx.json({ kind: 'item', ru: 'П1', section: PISTOLS })}),
      (${id(9202)}, ${A}, ${RING}, ${BOOK.id}, ${tx.json({ kind: 'item', ru: 'П2', section: PISTOLS })}),
      (${id(9203)}, ${A}, ${ROLL}, null, ${tx.json({ kind: 'item', ru: 'Скатка' })}),
      (${id(9204)}, ${B}, 'hb_bitemaaaaaaaaaaa', null, ${tx.json({ kind: 'item', ru: 'Чужой' })})`;
  };
  const items = async (tx) =>
    (await unbound(tx, rows)).items
      .filter((i) => i.owner_id === A)
      .map((i) => [i.key, i.book_id, i.content.section ?? null, i.revision]);
  const all = [
    { id: id(9201), revision: 1 },
    { id: id(9202), revision: 1 },
    { id: id(9203), revision: 1 }
  ];

  it('sets the source and the section of every item, and answers the count', async () => {
    const out = await asA(world, async (tx) => ({
      n: await moveAs(tx, all, BOOK.id, BLADES),
      items: await items(tx)
    }));
    assert.equal(out.n, 3);
    assert.deepEqual(out.items, [
      [ROLL, BOOK.id, BLADES, 2],
      [FLINT, BOOK.id, BLADES, 2],
      [RING, BOOK.id, BLADES, 2]
    ]);
  });

  it('clears the section in another source and in the default one', async () => {
    const out = await asA(world, async (tx) => {
      await moveAs(tx, [all[0]], id(9002), null);
      await moveAs(tx, [all[1]], null, null);
      return items(tx);
    });
    assert.deepEqual(out, [
      [ROLL, null, null, 1],
      [FLINT, id(9002), null, 2],
      [RING, null, null, 2]
    ]);
  });

  it('rolls back every item when one revision is stale', async () => {
    const out = await asA(world, async (tx) => {
      const was = await items(tx);
      const err = await refused(tx, (sp) =>
        moveAs(sp, [all[0], { id: id(9202), revision: 7 }], null, null)
      );
      return { was, err, now: await items(tx) };
    });
    byCode('P0001', new RegExp('^move_homebrew_items: conflict ' + id(9202) + '$'))(out.err);
    assert.deepEqual(out.now, out.was);
  });

  it("answers a conflict for B's item", async () => {
    const out = await asA(world, async (tx) =>
      refused(tx, (sp) => moveAs(sp, [{ id: id(9204), revision: 1 }], null, null))
    );
    byCode('P0001', /^move_homebrew_items: conflict /)(out);
  });

  const gone = [
    ['a deleted source', [id(9999), null], /^move_homebrew_items: no source$/],
    ["B's source", [id(9003), null], /^move_homebrew_items: no source$/],
    [
      'a section the source lacks',
      [BOOK.id, 'hb_sectnoneaaaaaaaa'],
      /^move_homebrew_items: no section$/
    ]
  ];
  for (const [what, [book, section], text] of gone) {
    it(`refuses ${what} with P0002, moving nothing`, async () => {
      const out = await asA(world, async (tx) => {
        const was = await items(tx);
        const err = await refused(tx, (sp) => moveAs(sp, all, book, section));
        return { was, err, now: await items(tx) };
      });
      byCode('P0002', text)(out.err);
      assert.deepEqual(out.now, out.was);
    });
  }

  const malformed = [
    ['a section with no source', [all, null, PISTOLS]],
    ['an item twice', [[all[0], all[0]], null, null]],
    ['no item', [[], null, null]],
    ['SQL null', [null, null, null]],
    [
      '1001 items',
      [Array.from({ length: 1001 }, (_, i) => ({ id: id(50000 + i), revision: 1 })), null, null]
    ]
  ];
  for (const [what, [list, book, section]] of malformed) {
    it(`refuses ${what} with 22023`, async () => {
      const out = await asA(world, async (tx) =>
        refused(tx, (sp) => moveAs(sp, list, book, section))
      );
      byCode('22023', /^move_homebrew_items: /)(out);
    });
  }

  it('moves 300 items in one call', async () => {
    const many = async (tx) => {
      await world(tx);
      await tx`insert into public.user_limit_overrides (user_id, key, value)
        values (${A}, 'homebrew_items_per_owner', 400)`;
      await tx`insert into public.homebrew_items (id, owner_id, key, content)
        select ('00000000-0000-4000-8000-' || lpad((60000 + n)::text, 12, '0'))::uuid, ${A},
          'hb_many' || translate(lpad(n::text, 12, '0'), '0189', 'abcd'), jsonb_build_object('kind', 'item', 'ru', 'М' || n)
        from generate_series(0, 299) as n`;
    };
    const out = await asA(many, async (tx) => {
      const list = Array.from({ length: 300 }, (_, i) => ({ id: id(60000 + i), revision: 1 }));
      return {
        n: await moveAs(tx, list, BOOK.id, PISTOLS),
        moved: (await items(tx)).filter((i) => i[1] === BOOK.id && i[2] === PISTOLS).length
      };
    });
    assert.deepEqual(out, { n: 300, moved: 302 });
  });
});

/* Two connections: another tab's section change, held open, against an import into that
   section. A lock timeout makes the wait observable without a race: the import's share
   lock on the source waits for the change (55P03 at the timeout), then finds the section
   gone and writes nothing. A plain read would see the old section and insert the item. */
describe('the source lock of an import', () => {
  it('waits for a section change made meanwhile, then refuses the section gone, leaving no orphan', async () => {
    const a = crypto.randomUUID();
    const bookId = crypto.randomUUID();
    await sql`insert into auth.users (id) values (${a})`;
    await sql`insert into public.homebrew_books (id, owner_id, key, content)
      values (${bookId}, ${a}, ${ALDER}, ${sql.json(BOOK.content)})`;
    const other = connect();
    const claims = JSON.stringify({ role: 'authenticated', sub: a });
    let release = () => undefined;
    const held = new Promise((r) => {
      release = r;
    });
    let changed = () => undefined;
    const isChanged = new Promise((r) => {
      changed = r;
    });
    const item = {
      id: crypto.randomUUID(),
      key: FLINT,
      book: ALDER,
      content: { kind: 'item', ru: 'Пистоль', section: PISTOLS }
    };
    const importing = () =>
      commitAs(sql, { role: 'authenticated', sub: a }, async (tx) => {
        await tx`set local lock_timeout = '300ms'`;
        return importAs(tx, [], [], [item]);
      }).then(
        () => null,
        (err) => err
      );
    try {
      const editor = other.begin(async (tx) => {
        await tx.unsafe('set local role authenticated');
        await tx`select set_config('request.jwt.claims', ${claims}, true)`;
        await tx`update public.homebrew_books
          set content = ${tx.json({ ru: 'М', sections: [BOOK.content.sections[1]] })}
          where id = ${bookId}`;
        changed();
        await held;
      });
      await isChanged;
      byCode('55P03')(await importing());
      release();
      await editor;
      byCode('22023', /^import_homebrew: no section hb_sectpistolsaaaaa$/)(await importing());
      const [{ n }] = await sql`select count(*)::int as n from public.homebrew_items
        where owner_id = ${a}`;
      assert.equal(n, 0);
    } finally {
      release();
      await other.end();
      await sql`delete from auth.users where id = ${a}`;
    }
  });
});

describe('the homebrew messages of an import', () => {
  before(async () => {
    await realtimePartition(sql);
  });

  it('commits one homebrew message per call, and none when refused', async () => {
    const a = crypto.randomUUID();
    await sql`insert into auth.users (id) values (${a})`;
    const topic = `owner:${a}`;
    const homebrew = async () =>
      (await messagesTo(sql, topic)).filter((m) => m.event === 'homebrew').length;
    try {
      const was = await homebrew();
      await assert.rejects(
        commitAs(sql, { role: 'authenticated', sub: a }, (tx) =>
          importAs(tx, [BOOK], [], [{ ...ITEMS[2], book: 'hb_nosuchsourceaaaa' }])
        ),
        byCode('22023')
      );
      assert.equal(await homebrew(), was);
      await commitAs(sql, { role: 'authenticated', sub: a }, (tx) =>
        importAs(tx, [{ ...BOOK, id: crypto.randomUUID() }], [], [])
      );
      assert.equal(await homebrew(), was + 1);
    } finally {
      await sql`delete from auth.users where id = ${a}`;
    }
  });
});

/* The worst cases at the call's ceilings, each committed (the deferred broadcasts run at
   commit) and asserted under the 8 s statement timeout on the local stack. */
describe('the worst cases', () => {
  const LIMIT_MS = 8000;
  const timed = async (fn) => {
    const start = performance.now();
    const out = await fn();
    return { out, ms: performance.now() - start };
  };
  const big = (n, tag) =>
    Array.from({ length: n }, (_, i) => ({
      id: crypto.randomUUID(),
      key: key('wc', i),
      book: null,
      content: { kind: 'item', ru: tag + ' ' + String(i), rud: 'Описание. '.repeat(20) }
    }));

  it('imports 1000 items, then updates them with 300 referenced from lists, then moves 300', async () => {
    const a = crypto.randomUUID();
    await sql`insert into auth.users (id) values (${a})`;
    await sql`insert into public.user_limit_overrides (user_id, key, value)
      values (${a}, 'homebrew_items_per_owner', 1000)`;
    const as = (fn) => commitAs(sql, { role: 'authenticated', sub: a }, fn);
    try {
      const first = big(1000, 'Предмет');
      const created = await timed(() => as((tx) => importAs(tx, [], [], first)));
      assert.equal(created.out.items_created, 1000);
      console.log(`first import of 1000 items: ${Math.round(created.ms)} ms`);
      assert.ok(created.ms < LIMIT_MS, `${Math.round(created.ms)} ms`);

      const lists = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
      await sql`insert into public.lists (id, owner_id, name)
        select l, ${a}, 'L' from unnest(${lists}::uuid[]) as l`;
      for (let l = 0; l < 3; l++) {
        const keys = first.slice(l * 100, l * 100 + 100).map((r) => r.key);
        await sql`insert into public.list_entries (id, list_id, item_key, source, position)
          select gen_random_uuid(), ${lists[l]}, k, 'homebrew', p - 1
          from unnest(${keys}::text[]) with ordinality as t(k, p)`;
      }
      const updated = await timed(() =>
        as((tx) =>
          importAs(
            tx,
            [],
            [],
            big(1000, 'Новый').map((r, i) => ({ ...r, id: first[i].id })),
            true
          )
        )
      );
      assert.equal(updated.out.items_updated, 1000);
      console.log(`update import of 1000 items, 300 referenced: ${Math.round(updated.ms)} ms`);
      assert.ok(updated.ms < LIMIT_MS, `${Math.round(updated.ms)} ms`);

      const held = await sql`select id, revision::int as revision from public.homebrew_items
        where owner_id = ${a} and key = any(${first.slice(0, 300).map((r) => r.key)})`;
      const [book] = await sql`insert into public.homebrew_books (id, owner_id, key, content)
        values (${crypto.randomUUID()}, ${a}, ${ALDER}, ${sql.json(BOOK.content)}) returning id`;
      const moved = await timed(() =>
        as((tx) =>
          moveAs(
            tx,
            held.map((r) => ({ id: r.id, revision: r.revision })),
            book.id,
            PISTOLS
          )
        )
      );
      assert.equal(moved.out, 300);
      console.log(`move of 300 referenced items: ${Math.round(moved.ms)} ms`);
      assert.ok(moved.ms < LIMIT_MS, `${Math.round(moved.ms)} ms`);
    } finally {
      await sql`delete from auth.users where id = ${a}`;
    }
  });
});
