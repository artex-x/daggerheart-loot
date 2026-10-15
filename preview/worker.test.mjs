// The preview host, end to end through its fetch handler with a fake
// `fetch`: no network, no Cloudflare runtime. `npm run check` runs it as the
// stage test:preview (tools/check/lib.mjs).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { esc, fit } from '../tools/share-card.mjs';

/* Required before the worker imports it: Node imports a .ts file of this typeless
   package with a MODULE_TYPELESS_PACKAGE_JSON warning and requires it silently
   (measured 2026-10-15, Node 24.15.0); both give the same module. */
createRequire(import.meta.url)('../app/src/lib/markup.ts');
const { default: worker } = await import('./worker.mjs');

const SITE = 'https://artex-x.github.io/daggerheart-loot/';
const HOST = 'https://daggerheart-loot.pages.dev';
const SUPA = 'https://test-project.supabase.co';
const ENV = {
  SITE,
  PAGES_HOST: 'daggerheart-loot.pages.dev',
  SUPABASE_URL: SUPA,
  SUPABASE_KEY: 'sb_publishable_test'
};
const ID = '0b8f2c1e-1234-4abc-8def-0123456789ab';
const TOKEN = 'A'.repeat(20) + 'b_c-' + 'z'.repeat(19);
const PRINT = 'Ab3_x-9Zq1W2';

let fresh = 0;
/** Returns a worker with an empty names.json copy: each import is its own module. */
async function freshWorker() {
  fresh++;
  return (await import('./worker.mjs?fresh=' + fresh)).default;
}

const NAMES = {
  format: 'daggerheart-loot/names',
  version: 1,
  items: {
    c1: ['Смола Бездны', 'Abyss Resin'],
    w1: ['Палаш', 'Broadsword'],
    s1: ['Первый', 'First'],
    s2: ['Второй', 'Second'],
    en1: ['', 'English Only']
  },
  sets: {
    'ember-spark': {
      ru: 'Пылающие близнецы',
      en: 'Blazing Twins',
      rud: 'Бонус комплекта.',
      ende: 'Set bonus.',
      members: ['s1', 's2']
    }
  },
  tables: {
    core_item: { n: 60 },
    alt_item: { n: 120 },
    eq_weapon: { n: 437 },
    community: { n: 90 },
    other_frames: { n: 95 }
  },
  communities: {
    Highborne: { ru: 'Великородное', n: 10 },
    Loreborne: { ru: 'Научное', n: 10 },
    Orderborne: { ru: 'Догматичное', n: 10 }
  },
  frames: { beast_feast: { n: 36 }, colossus: { n: 21 } }
};

/* get_item_preview's item keys: the record's drawn keys only. */
function item(over = {}) {
  return {
    ru: 'Клинок',
    en: 'Blade',
    rud: 'Описание.\nВторая строка.',
    ende: 'Text.\nLine two.',
    book: {
      key: 'hb_bbbbbbbbbbbbbbbb',
      ru: 'Мастерская',
      en: 'Workshop',
      section: { key: 'hb_cccccccccccccccc', ru: 'Оружие', en: 'Weapons' }
    },
    ...over
  };
}
const NO_LINE = { n: 0, names: [] };
/** A `get_item_preview` answer; `lines` overrides its lines one by one. */
function itemAnswer(over = {}, extra = {}, lines = {}) {
  return {
    hid: ID,
    item: item(over),
    lines: { from: NO_LINE, into: NO_LINE, set: NO_LINE, ...lines },
    ...extra
  };
}

/** A `get_shared_list_preview` answer. */
function listAnswer(over = {}) {
  return { audience: 'player', name: 'Лавка', note: '', n: 12, ...over };
}

const json = (v, status = 200, headers = {}) =>
  new Response(JSON.stringify(v), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });

let calls;
/* A Response body reads once, so each request gets a clone of the one given. */
const pick = (r, init, fallback) =>
  typeof r === 'function' ? r(init) : r ? r.clone() : fallback();
let realFetch;
let realNow;
/** Installs a fake fetch: `item`, `list` and `names` each return a Response or a promise. */
function serve({ item: itemRes, list: listRes, names: namesRes } = {}) {
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init, at: Date.now() });
    if (String(url) === SITE + 'names.json') return pick(namesRes, init, () => json(NAMES));
    if (String(url).endsWith('/rpc/get_item_preview'))
      return pick(itemRes, init, () => json(itemAnswer()));
    if (String(url).endsWith('/rpc/get_shared_list_preview'))
      return pick(listRes, init, () => json(listAnswer()));
    /* The full reads grow with a set or a list; the worker never sends them. */
    throw new Error('unexpected fetch ' + url);
  };
}
const hang = (init) =>
  new Promise((_, reject) => {
    init.signal.addEventListener('abort', () => reject(init.signal.reason));
  });

beforeEach(() => {
  calls = [];
  realFetch = globalThis.fetch;
  realNow = Date.now;
});
afterEach(() => {
  globalThis.fetch = realFetch;
  Date.now = realNow;
});

async function get(path, { method = 'GET', w = worker, host = HOST } = {}) {
  const res = await w.fetch(new Request(host + path, { method }), ENV, {});
  const body = method === 'HEAD' ? null : await res.text();
  return { res, body };
}

function meta(html, key) {
  const m = new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)">`).exec(html);
  return m ? m[1] : null;
}
const unesc = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const title = (html) => /<title>([^<]*)<\/title>/.exec(html)[1];
const h1 = (html) => /<h1>([^<]*)<\/h1>/.exec(html)[1];
const replaced = (html) => JSON.parse(/location\.replace\(("[^"]*")\)/.exec(html)[1]);
const lines = (html) =>
  [...html.matchAll(/<p class="c">([^<]*)<\/p>/g)].map((m) => unesc(m[1]));
const bytes = (s) => Buffer.byteLength(s);

function assertHeaders(res) {
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.equal(res.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(res.headers.get('Set-Cookie'), null);
}
function assertRedirect(html, target) {
  assert.equal(unesc(/http-equiv="refresh" content="0; url=([^"]*)"/.exec(html)[1]), target);
  assert.equal(replaced(html), target);
}

describe('/h/: a found homebrew item', () => {
  it('answers 200 with the card and the headers in Russian', async () => {
    serve();
    const { res, body } = await get('/h/' + ID);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'text/html; charset=utf-8');
    assertHeaders(res);
    assert.match(body, /<meta name="robots" content="noindex, nofollow">/);
    assert.equal(meta(body, 'og:title'), 'Клинок');
    assert.equal(
      unesc(meta(body, 'og:description')),
      'Хоумбрю · Мастерская · Оружие. Описание. Вторая строка.'
    );
    assert.equal(meta(body, 'og:url'), HOST + '/h/' + ID);
    assert.equal(meta(body, 'og:image'), SITE + 'og/_none.jpg');
    assert.equal(meta(body, 'og:locale'), 'ru_RU');
    assert.equal(meta(body, 'twitter:card'), 'summary');
    assertRedirect(body, SITE + '#/h/' + ID);
    assert.ok(body.length < 65536);
  });

  it('answers the English card under /en/', async () => {
    serve();
    const { body } = await get('/en/h/' + ID);
    assert.equal(meta(body, 'og:title'), 'Blade');
    assert.equal(
      unesc(meta(body, 'og:description')),
      'Homebrew · Workshop · Weapons. Text. Line two.'
    );
    assert.equal(meta(body, 'og:url'), HOST + '/en/h/' + ID);
    assert.equal(meta(body, 'og:locale'), 'en_US');
    assertRedirect(body, SITE + 'en/#/h/' + ID);
    assert.ok(!body.includes('localStorage'), 'the en/ entry document seeds the language');
  });

  it('sends one lean read with the publishable key, the uuid and the language', async () => {
    serve();
    await get('/h/' + ID);
    await get('/en/h/' + ID);
    const reads = calls.filter((c) => c.url.includes('/rpc/'));
    assert.equal(reads.length, 2);
    assert.equal(reads[0].url, SUPA + '/rest/v1/rpc/get_item_preview');
    assert.equal(reads[0].init.method, 'POST');
    assert.equal(reads[0].init.headers.apikey, 'sb_publishable_test');
    assert.deepEqual(JSON.parse(reads[0].init.body), { p_id: ID, p_lang: 'ru' });
    assert.deepEqual(JSON.parse(reads[1].init.body), { p_id: ID, p_lang: 'en' });
  });

  it('draws the stat line after the path for equipment', async () => {
    serve({
      item: json(
        itemAnswer({
          kind: 'equip',
          eq: { t: 'armor', tier: 2, th: [7, 15], as: 4 },
          book: undefined
        })
      )
    });
    const { body } = await get('/h/' + ID);
    assert.equal(
      unesc(/<p class="s">([^<]*)<\/p>/.exec(body)[1]),
      'Хоумбрю · Броня · Ранг 2 · Пороги 7/15 · Броня 4'
    );
  });
});

describe('/h/: the picture', () => {
  const cases = [
    ['a catalog basename', { img: 'q1.webp' }, SITE + 'og/q1.jpg', SITE + 'img/q1.webp'],
    [
      'an own picture',
      { img: 'p/' + 'a'.repeat(32) + '.webp' },
      SUPA + '/storage/v1/object/public/homebrew-art/p/' + 'a'.repeat(32) + '.webp',
      SUPA + '/storage/v1/object/public/homebrew-art/p/' + 'a'.repeat(32) + '.webp'
    ],
    [
      'a value of another shape',
      { img: 't/' + 'a'.repeat(32) + '.webp' },
      SITE + 'og/_none.jpg',
      SITE + 'img/_none.webp'
    ],
    ['no img key', {}, SITE + 'og/_none.jpg', SITE + 'img/_none.webp']
  ];
  for (const [name, extra, og, src] of cases) {
    it(`takes ${name}`, async () => {
      serve({ item: json(itemAnswer({}, extra)) });
      const { body } = await get('/h/' + ID);
      assert.equal(meta(body, 'og:image'), og);
      assert.equal(meta(body, 'twitter:image'), og);
      assert.equal(meta(body, 'og:image:width'), '640');
      assert.ok(body.includes(`<img src="${src}"`), body);
    });
  }
});

describe('/h/: craft and set lines', () => {
  const line = (names, n = names.length) => ({ n, names });
  it('draws the catalog names from names.json first, then the read names with the tag', async () => {
    serve({
      item: json(
        itemAnswer(
          { craft: ['c1', 'hb_rel1'], craft_from: ['w1'] },
          {},
          { from: line(['Мастер']), into: line(['Связь']) }
        )
      )
    });
    const ru = await get('/h/' + ID);
    assert.deepEqual(lines(ru.body), [
      'Получается из: Палаш, Мастер (HB)',
      'Улучшается до: Смола Бездны, Связь (HB)'
    ]);
    serve({
      item: json(
        itemAnswer(
          { craft: ['c1', 'hb_rel1'], craft_from: ['w1'] },
          {},
          { from: line(['Maker']), into: line(['Rel One']) }
        )
      )
    });
    const en = await get('/en/h/' + ID);
    assert.deepEqual(lines(en.body), [
      'Made from: Broadsword, Maker (HB)',
      'Upgrades to: Abyss Resin, Rel One (HB)'
    ]);
    assert.ok(
      unesc(meta(ru.body, 'og:description')).endsWith(
        'Палаш, Мастер (HB). Улучшается до: Смола Бездны, Связь (HB).'
      )
    );
  });

  it("keeps the read's order of the own names and sorts nothing", async () => {
    serve({ item: json(itemAnswer({}, {}, { into: line(['Яблоко', 'Арбуз', 'Банан']) })) });
    assert.deepEqual(lines((await get('/h/' + ID)).body), [
      'Улучшается до: Яблоко (HB), Арбуз (HB), Банан (HB)'
    ]);
  });

  it('draws a catalog set with its members, the read names and its bonus', async () => {
    serve({ item: json(itemAnswer({ set: 'ember-spark' }, {}, { set: line(['Клинок']) })) });
    assert.deepEqual(lines((await get('/h/' + ID)).body), [
      'Комплект: Первый, Второй, Клинок (HB)',
      'Пылающие близнецы: Бонус комплекта.'
    ]);
    serve({ item: json(itemAnswer({ set: 'ember-spark' }, {}, { set: line(['Blade']) })) });
    assert.deepEqual(lines((await get('/en/h/' + ID)).body), [
      'Set: First, Second, Blade (HB)',
      'Blazing Twins: Set bonus.'
    ]);
  });

  it('draws an own set card as the bonus line, from set_card', async () => {
    const own = {
      set_card: { ru: 'Свой', en: 'Own', rud: 'Свой бонус', ende: 'Own bonus' }
    };
    serve({
      item: json(itemAnswer({ set: 'hb_set1' }, own, { set: line(['Клинок', 'Член']) }))
    });
    assert.deepEqual(lines((await get('/h/' + ID)).body), [
      'Комплект: Клинок (HB), Член (HB)',
      'Свой: Свой бонус'
    ]);
    serve({
      item: json(itemAnswer({ set: 'hb_set1' }, own, { set: line(['Blade', 'Member']) }))
    });
    assert.deepEqual(lines((await get('/en/h/' + ID)).body), [
      'Set: Blade (HB), Member (HB)',
      'Own: Own bonus'
    ]);
  });

  it('draws formatted text as plain text: the description and both set bonuses', async () => {
    const names = {
      ...NAMES,
      sets: {
        'ember-spark': { ...NAMES.sets['ember-spark'], ende: '**Both** at *once*.' }
      }
    };
    const w = await freshWorker();
    serve({
      names: json(names),
      item: json(
        itemAnswer(
          { set: 'ember-spark', ende: '*Sharp:* +1\n- **one**' },
          {},
          { set: line(['Blade']) }
        )
      )
    });
    const catalog = await get('/en/h/' + ID, { w });
    assert.deepEqual(lines(catalog.body), [
      'Set: First, Second, Blade (HB)',
      'Blazing Twins: Both at once.'
    ]);
    assert.ok(catalog.body.includes('<p>Sharp: +1</p>\n<p>- one</p>'), catalog.body);
    assert.ok(!unesc(meta(catalog.body, 'og:description')).includes('*'));
    const own = { set_card: { ru: 'Свой', en: 'Own', rud: 'Бонус', ende: '*Own* bonus' } };
    serve({ item: json(itemAnswer({ set: 'hb_set1' }, own, { set: line(['Blade']) })) });
    assert.deepEqual(lines((await get('/en/h/' + ID, { w })).body), ['Own: Own bonus']);
  });

  it('draws the set line at two names and not at one; the own bonus stays', async () => {
    const own = { set_card: { ru: 'Свой', en: 'Own', rud: 'Бонус', ende: 'Bonus' } };
    serve({ item: json(itemAnswer({ set: 'hb_set1' }, own, { set: line(['Клинок']) })) });
    assert.deepEqual(lines((await get('/h/' + ID)).body), ['Свой: Бонус']);
    serve({ item: json(itemAnswer({ set: 'hb_set1' }, own, { set: line(['Клинок'], 2) })) });
    assert.deepEqual(lines((await get('/h/' + ID)).body), [
      'Комплект: Клинок (HB) и ещё 1',
      'Свой: Бонус'
    ]);
  });

  it("counts the rest from the read's n and the undrawn catalog names", async () => {
    const catalog = Array.from({ length: 3 }, (_, i) => 'cat' + i);
    const names = {
      ...NAMES,
      items: Object.fromEntries(catalog.map((id) => [id, ['Ж'.repeat(150), 'J'.repeat(300)]]))
    };
    const own = Array.from({ length: 9 }, (_, i) => 'Имя ' + i);
    for (const lang of ['ru', 'en']) {
      const w = await freshWorker();
      serve({
        item: json(itemAnswer({ craft: catalog }, {}, { into: line(own, 600) })),
        names: json(names)
      });
      const [drawn] = lines((await get((lang === 'ru' ? '' : '/en') + '/h/' + ID, { w })).body);
      assert.ok(bytes(esc(drawn)) <= 1200, String(bytes(esc(drawn))));
      const shown = drawn.replace(/^[^:]+: /, '').split(', ').length;
      const rest = Number((lang === 'ru' ? /и ещё (\d+)$/ : /and (\d+) more$/).exec(drawn)[1]);
      assert.equal(rest, 3 + 600 - shown, drawn);
    }
  });

  it('draws no name for a prototype key', async () => {
    serve({
      item: json(
        itemAnswer({ craft: ['toString'], craft_from: ['__proto__'], set: '__proto__' })
      )
    });
    const { body } = await get('/h/' + ID);
    assert.deepEqual(lines(body), []);
    serve({
      item: json(itemAnswer({ craft: ['constructor', 'hasOwnProperty'], set: 'constructor' }))
    });
    assert.deepEqual(lines((await get('/h/' + ID)).body), []);
  });

  it('keeps only string names and drops a null names.json entry, with no throw', async () => {
    const w = await freshWorker();
    serve({
      item: json(
        itemAnswer({ craft: ['ci1', 'c1'] }, {}, { into: { n: 3, names: [null, 5, 'Цель'] } })
      ),
      names: json({ ...NAMES, items: { ...NAMES.items, ci1: null } })
    });
    const { res, body } = await get('/h/' + ID, { w });
    assert.equal(res.status, 200);
    assert.deepEqual(lines(body), ['Улучшается до: Смола Бездны, Цель (HB) и ещё 2']);
  });
});

describe('/h/: names.json', () => {
  const withLines = () => json(itemAnswer({ craft: ['c1'] }));
  const failures = [
    ['a 404', () => new Response('nope', { status: 404 })],
    ['a non-JSON body', () => new Response('<html>', { status: 200 })],
    ['another format', () => json({ ...NAMES, format: 'x' })],
    ['another version', () => json({ ...NAMES, version: 2 })],
    ['a body past 196608 bytes', () => new Response(' '.repeat(196609), { status: 200 })]
  ];
  for (const [name, res] of failures) {
    it(`draws no line on ${name}, then fetches again`, async () => {
      const w = await freshWorker();
      serve({ item: withLines(), names: res });
      const first = await get('/h/' + ID, { w });
      assert.equal(first.res.status, 200);
      assert.deepEqual(lines(first.body), []);
      await get('/h/' + ID, { w });
      assert.equal(calls.filter((c) => c.url.endsWith('names.json')).length, 2);
    });
  }

  it('draws no line after a 2 s timeout, and the card does not wait for the 3 s read', async () => {
    const w = await freshWorker();
    serve({ item: withLines(), names: hang });
    const t0 = realNow();
    const { res, body } = await get('/h/' + ID, { w });
    const took = realNow() - t0;
    assert.equal(res.status, 200);
    assert.deepEqual(lines(body), []);
    assert.ok(took >= 1900 && took < 3000, String(took));
  });

  it('starts the item read and the names.json fetch together', { timeout: 5000 }, async () => {
    const w = await freshWorker();
    let started = 0;
    let release;
    const gate = new Promise((r) => (release = r));
    const wait = (res) => async () => {
      started++;
      if (started === 2) release();
      await gate;
      return res();
    };
    serve({ item: wait(withLines), names: wait(() => json(NAMES)) });
    const { body } = await get('/h/' + ID, { w });
    assert.equal(started, 2);
    assert.deepEqual(lines(body), ['Улучшается до: Смола Бездны']);
  });

  it('keeps a loaded copy for 10 minutes, then fetches again', async () => {
    const w = await freshWorker();
    let now = 1_000_000;
    Date.now = () => now;
    serve({ item: withLines() });
    await get('/h/' + ID, { w });
    now += 599_000;
    await get('/h/' + ID, { w });
    assert.equal(calls.filter((c) => c.url.endsWith('names.json')).length, 1);
    now += 2_000;
    await get('/h/' + ID, { w });
    assert.equal(calls.filter((c) => c.url.endsWith('names.json')).length, 2);
  });
});

describe('/h/: one language', () => {
  it("draws the one name in both languages, as the server's record fills the empty one", async () => {
    // homebrew_snapshot_of() writes the other language's name and text into an empty field
    serve({
      item: json(
        itemAnswer({
          ru: 'Только русский',
          en: 'Только русский',
          rud: 'Русский текст.',
          ende: 'Русский текст.'
        })
      )
    });
    const ru = await get('/h/' + ID);
    const en = await get('/en/h/' + ID);
    assert.equal(meta(ru.body, 'og:title'), 'Только русский');
    assert.equal(meta(en.body, 'og:title'), 'Только русский');
    assert.ok(en.body.includes('<p>Русский текст.</p>'));
  });
});

describe('/h/: the id', () => {
  it('reads an uppercase uuid lowercased, drops a stray character and ignores ?v=', async () => {
    serve();
    const clean = (await get('/h/' + ID)).body;
    for (const p of [
      '/h/' + ID.toUpperCase(),
      '/h/' + ID + '.',
      '/h/' + ID + '?v=abc',
      '/h/' + ID + ')?v=1'
    ]) {
      calls = [];
      assert.equal((await get(p)).body, clean, p);
      assert.deepEqual(JSON.parse(calls.find((c) => c.url.includes('/rpc/')).init.body), {
        p_id: ID,
        p_lang: 'ru'
      });
    }
  });

  it('changes nothing for %22, %3C and </script> after the id or in the query', async () => {
    serve();
    const clean = (await get('/h/' + ID)).body;
    for (const p of [
      '/h/' + ID + '%22%3Cscript%3E',
      '/h/' + ID + '</script><b>',
      '/h/' + ID + '"x',
      '/h/' + ID + '?v=%22%3C/script%3E&x="<b>'
    ]) {
      assert.equal((await get(p)).body, clean, p);
    }
  });

  it('answers 404 with no read for a malformed id, redirecting to the parsed run', async () => {
    serve();
    const { res, body } = await get('/h/ABC-12');
    assert.equal(res.status, 404);
    assertHeaders(res);
    assert.equal(calls.length, 0);
    assert.equal(meta(body, 'og:title'), 'Предмет не найден');
    assert.equal(
      meta(body, 'og:description'),
      'Возможно, ссылка устарела или данные были изменены.'
    );
    assert.equal(meta(body, 'og:image'), SITE + 'og/_share.jpg');
    assert.equal(meta(body, 'twitter:card'), 'summary_large_image');
    assertRedirect(body, SITE + '#/h/abc-12');
    const empty = await get('/en/h/zzz');
    assert.equal(empty.res.status, 404);
    assert.equal(meta(empty.body, 'og:title'), 'Item not found');
    assert.equal(meta(empty.body, 'og:image'), SITE + 'og/_share_en.jpg');
    assertRedirect(empty.body, SITE + 'en/');
  });

  it('answers 404 not-found for a read that answers null', async () => {
    serve({ item: json(null) });
    const ru = await get('/h/' + ID);
    assert.equal(ru.res.status, 404);
    assert.equal(meta(ru.body, 'og:title'), 'Предмет не найден');
    assertRedirect(ru.body, SITE + '#/h/' + ID);
    const en = await get('/en/h/' + ID);
    assert.equal(
      meta(en.body, 'og:description'),
      'The link may be out of date, or the data has changed.'
    );
    assertRedirect(en.body, SITE + 'en/#/h/' + ID);
  });
});

describe('/h/: a failed read', () => {
  const fails = [
    ['a 401', () => json({ message: 'bad key' }, 401)],
    ['a 404', () => json({ message: 'no function' }, 404)],
    ['a 400', () => json({ message: 'bad' }, 400)],
    ['a 500', () => json({ message: 'down' }, 500)],
    ['a non-JSON body', () => new Response('<html>paused</html>', { status: 200 })],
    ['an answer with no lines', () => json({ hid: ID, item: item() })],
    ['an answer whose item is an array', () => json({ ...itemAnswer(), item: [] })],
    [
      'a network error',
      () => {
        throw new TypeError('fetch failed');
      }
    ]
  ];
  for (const [name, res] of fails) {
    it(`answers 503 with the site's words on ${name}`, async () => {
      serve({ item: res });
      const { res: r, body } = await get('/h/' + ID);
      assert.equal(r.status, 503);
      assertHeaders(r);
      assert.equal(meta(body, 'og:title'), 'Генератор лута Daggerheart');
      assert.equal(meta(body, 'og:description'), 'Открыть в генераторе лута');
      assert.equal(title(body), 'Генератор лута Daggerheart');
      assertRedirect(body, SITE + '#/h/' + ID);
    });
  }

  it('answers 503 after a 3 s timeout', async () => {
    serve({ item: hang });
    const t0 = realNow();
    const { res } = await get('/h/' + ID);
    assert.equal(res.status, 503);
    assert.ok(realNow() - t0 >= 2900);
  });
});

describe('every answer', () => {
  it('answers HEAD with the headers of GET and no body', async () => {
    serve();
    const head = await get('/h/' + ID, { method: 'HEAD' });
    const getRes = await get('/h/' + ID);
    assert.equal(head.res.status, 200);
    assert.equal(head.res.body, null);
    for (const h of ['Content-Type', 'Cache-Control', 'X-Robots-Tag', 'Referrer-Policy'])
      assert.equal(head.res.headers.get(h), getRes.res.headers.get(h));
  });

  it('sends another path home, in its language', async () => {
    for (const [p, to] of [
      ['/', SITE],
      ['/x', SITE],
      ['/en/', SITE + 'en/'],
      ['/en', SITE + 'en/'],
      ['/h', SITE],
      ['//evil.example/x', SITE],
      ['/tables/', SITE]
    ]) {
      const { res } = await get(p);
      assert.equal(res.status, 302, p);
      assert.equal(res.headers.get('Location'), to, p);
      assertHeaders(res);
    }
  });

  it('sends a deployment host or another host to the production host, with no read', async () => {
    serve();
    for (const host of [
      'https://1a2b3c4d.daggerheart-loot.pages.dev',
      'https://main.daggerheart-loot.pages.dev',
      'https://evil.example'
    ]) {
      const { res, body } = await get('/h/' + ID + '?v=2', { host });
      assert.equal(res.status, 301);
      assert.equal(res.headers.get('Location'), HOST + '/h/' + ID + '?v=2');
      assert.equal(body, '');
    }
    const odd = await get('//evil.example/x', {
      host: 'https://1a2b.daggerheart-loot.pages.dev'
    });
    assert.equal(new URL(odd.res.headers.get('Location')).host, 'daggerheart-loot.pages.dev');
    assert.equal(calls.length, 0);
  });

  it('sends the retired probe paths home', async () => {
    for (const p of ['/probe/webp', '/probe/jpg']) {
      const { res } = await get(p);
      assert.equal(res.status, 302, p);
      assert.equal(res.headers.get('Location'), SITE, p);
    }
  });

  it("answers 503 with the site's words and the way home for a thrown error", async () => {
    serve();
    for (const [path, home] of [
      ['/h/' + ID, SITE],
      ['/en/s/' + TOKEN, SITE + 'en/']
    ]) {
      let reads = 0;
      const env = {
        ...ENV,
        get SITE() {
          reads++;
          if (reads === 1) throw new Error('boom');
          return SITE;
        }
      };
      const res = await worker.fetch(new Request(HOST + path), env, {});
      const body = await res.text();
      assert.equal(res.status, 503, path);
      assertHeaders(res);
      assert.equal(
        title(body),
        path.startsWith('/en') ? 'Daggerheart Loot Generator' : 'Генератор лута Daggerheart'
      );
      assertRedirect(body, home);
    }
  });

  it('is what public/_worker.js exports', async () => {
    const mod = await import('./public/_worker.js');
    assert.equal(mod.default, worker);
  });
});

const FIXTURE = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', 'docs', 'fixtures', 'urls', 'preview.json'),
    'utf8'
  )
);

describe('docs/fixtures/urls/preview.json, serve', () => {
  const answers = {
    item: () => json(itemAnswer()),
    null: () => json(null),
    list: () => json(listAnswer())
  };
  for (const c of FIXTURE.serve) {
    it(`${c.method ?? 'GET'} ${c.url.slice(0, 90)}: ${c.why}`, async () => {
      serve({
        item: answers[c.answer === 'item' ? 'item' : 'null'],
        list: answers[c.answer === 'list' ? 'list' : 'null']
      });
      const u = new URL(c.url);
      const res = await worker.fetch(
        new Request(c.url, { method: c.method ?? 'GET' }),
        { ...ENV, SITE: FIXTURE.site },
        {}
      );
      const body = await res.text();
      assert.equal(res.status, c.status);
      if (c.location) assert.equal(res.headers.get('Location'), c.location);
      if (c.app) assert.equal(replaced(body), c.app);
      if (c.ogUrl) assert.equal(meta(body, 'og:url'), c.ogUrl);
      const reads = calls.filter((x) => x.url.includes('/rpc/'));
      if (!c.answer) assert.equal(reads.length, 0);
      else {
        assert.equal(reads.length, 1);
        if (c.answer === 'item' || u.pathname.includes('/h/'))
          assert.equal(
            JSON.parse(reads[0].init.body).p_lang,
            u.pathname.startsWith('/en/') ? 'en' : 'ru'
          );
      }
    });
  }

  it("holds wrangler.toml's SITE and PAGES_HOST", () => {
    const toml = readFileSync(join(import.meta.dirname, 'wrangler.toml'), 'utf8');
    assert.equal(/^SITE\s*=\s*"([^"]*)"/m.exec(toml)[1], FIXTURE.site);
    assert.equal(/^PAGES_HOST\s*=\s*"([^"]*)"/m.exec(toml)[1], new URL(FIXTURE.origin).host);
    assert.equal(ENV.SITE, FIXTURE.site);
  });
});

describe('robots.txt and the routes file', () => {
  const directives = (text) =>
    text.split('\n').filter((l) => /^(User-agent|Allow|Disallow|Content-Signal):/i.test(l));
  const own = readFileSync(join(import.meta.dirname, 'public', 'robots.txt'), 'utf8');
  it("holds the site's directive lines in their order", () => {
    const site = readFileSync(join(import.meta.dirname, '..', 'robots.txt'), 'utf8');
    assert.deepEqual(directives(own), directives(site));
    assert.ok(directives(own).length > 2);
  });
  it('holds no number and no data pointer', () => {
    assert.doesNotMatch(own, /\d/);
    assert.doesNotMatch(own, /catalog(-index)?\.csv|data\.json|llms\.txt/);
  });
  it('is excluded from the worker', () => {
    const routes = JSON.parse(
      readFileSync(join(import.meta.dirname, 'public', '_routes.json'), 'utf8')
    );
    assert.deepEqual(routes, { version: 1, include: ['/*'], exclude: ['/robots.txt'] });
  });
});

describe('/h/: the worst case', () => {
  for (const lang of ['ru', 'en']) {
    it(`stays under 65536 bytes with every line at the read's most (${lang})`, async () => {
      const catalog = Array.from({ length: 8 }, (_, i) => 'cat' + i);
      const names = {
        ...NAMES,
        items: Object.fromEntries(
          catalog.map((id) => [id, ['Каталожный предмет ' + id, 'Catalog item ' + id]])
        )
      };
      /* As many 120-character names as get_item_preview sends in 1200 bytes. */
      const most = (name) => {
        const out = [];
        let used = 0;
        while (used + bytes(name) + 2 <= 1200) {
          out.push(name);
          used += bytes(name) + 2;
        }
        return { n: 1000, names: out };
      };
      const own = most(lang === 'ru' ? 'Я'.repeat(120) : '"'.repeat(120));
      const answer = itemAnswer(
        {
          ru: '"'.repeat(120),
          en: '"'.repeat(120),
          rud: 'Ж'.repeat(3000),
          ende: '&'.repeat(3000),
          set: 'hb_set1',
          craft: catalog,
          craft_from: catalog
        },
        {
          set_card: {
            ru: 'Б'.repeat(80),
            en: '&'.repeat(80),
            rud: 'Ж'.repeat(1500),
            ende: '&'.repeat(1500)
          }
        },
        { from: own, into: own, set: own }
      );
      const w = await freshWorker();
      serve({ item: json(answer), names: json(names) });
      const { body } = await get((lang === 'ru' ? '' : '/en') + '/h/' + ID, { w });
      assert.ok(bytes(body) < 65536, String(bytes(body)));
      for (const key of ['description', 'og:description', 'twitter:description'])
        assert.ok(bytes(meta(body, key)) <= 480, key);
      const drawn = [...body.matchAll(/<p class="c">([^<]*)<\/p>/g)].map((m) => m[1]);
      assert.equal(drawn.length, 4);
      for (const l of drawn) assert.ok(bytes(l) <= 1200, String(bytes(l)));
      const full = lang === 'ru' ? 'Ж'.repeat(3000) : '&amp;'.repeat(3000);
      assert.ok(body.includes('<p>' + full + '</p>'));
    });
  }
});

describe('fit', () => {
  it('never cuts inside an escaped entity', () => {
    for (let cap = 10; cap < 60; cap++) {
      const out = fit('&'.repeat(200), cap);
      assert.match(esc(out), /^(&amp;)*\.\.\.$/);
      assert.ok(bytes(esc(out)) <= cap);
    }
  });
  it('never cuts a surrogate pair', () => {
    for (let cap = 10; cap < 40; cap++) {
      const out = fit('😀'.repeat(50), cap);
      assert.doesNotMatch(
        out,
        /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/
      );
      assert.ok(bytes(esc(out)) <= cap);
    }
  });
  it('cuts at a word boundary in the last 40 characters', () => {
    assert.equal(fit('alpha beta gamma delta', 18), 'alpha beta...');
    assert.equal(fit('short', 480), 'short');
  });
});

describe('/s/: a shared list', () => {
  it('draws the name, the count and the site picture in both languages', async () => {
    serve();
    const ru = await get('/s/' + TOKEN);
    assert.equal(ru.res.status, 200);
    assertHeaders(ru.res);
    assert.equal(meta(ru.body, 'og:title'), 'Лавка');
    assert.equal(meta(ru.body, 'og:description'), '12 позиций');
    assert.equal(meta(ru.body, 'og:image'), SITE + 'og/_share.jpg');
    assert.equal(meta(ru.body, 'og:image:width'), '1200');
    assert.equal(meta(ru.body, 'twitter:card'), 'summary_large_image');
    assert.equal(meta(ru.body, 'og:url'), HOST + '/s/' + TOKEN);
    assertRedirect(ru.body, SITE + '#/s/' + TOKEN);
    const en = await get('/en/s/' + TOKEN);
    assert.equal(meta(en.body, 'og:description'), '12 items');
    assert.equal(meta(en.body, 'og:image'), SITE + 'og/_share_en.jpg');
    assertRedirect(en.body, SITE + 'en/#/s/' + TOKEN);
    const read = calls.find((c) => c.url.endsWith('/rpc/get_shared_list_preview'));
    assert.deepEqual(JSON.parse(read.init.body), { p_token: TOKEN });
    assert.ok(!calls.some((c) => c.url.endsWith('names.json')));
  });

  it('agrees the count with its word: 0, 1, 2 and 5', async () => {
    for (const [n, ru, en] of [
      [0, '0 позиций', '0 items'],
      [1, '1 позиция', '1 item'],
      [2, '2 позиции', '2 items'],
      [5, '5 позиций', '5 items']
    ]) {
      serve({ list: json(listAnswer({ n })) });
      assert.equal(meta((await get('/s/' + TOKEN)).body, 'og:description'), ru);
      assert.equal(meta((await get('/en/s/' + TOKEN)).body, 'og:description'), en);
    }
  });

  it("adds the players' note, flattened, to the description and the body", async () => {
    serve({
      list: json(listAnswer({ note: 'Первая строка\n  вторая' }))
    });
    const { body } = await get('/s/' + TOKEN);
    assert.equal(meta(body, 'og:description'), '12 позиций. Первая строка вторая');
    assert.ok(body.includes('<p>12 позиций. Первая строка вторая</p>'));
  });

  it("draws the players' note without its markup", async () => {
    serve({ list: json(listAnswer({ note: '**Лавка** *открыта*' })) });
    const { body } = await get('/s/' + TOKEN);
    assert.equal(meta(body, 'og:description'), '12 позиций. Лавка открыта');
  });

  it('gives an empty or whitespace note the count-only card', async () => {
    for (const note of ['', '   \n ', null]) {
      serve({ list: json(listAnswer({ note })) });
      assert.equal(meta((await get('/s/' + TOKEN)).body, 'og:description'), '12 позиций');
    }
  });

  it("cuts the read's 1000-character note to 480 bytes at a character boundary", async () => {
    for (const note of ['&'.repeat(1000), 'Ж'.repeat(1000)]) {
      serve({ list: json(listAnswer({ note })) });
      const { body } = await get('/s/' + TOKEN);
      const d = meta(body, 'og:description');
      assert.ok(bytes(d) <= 480, String(bytes(d)));
      assert.ok(d.endsWith('...'));
      assert.match(unesc(d), /^12 позиций\. (&+|Ж+)\.\.\.$/);
      assert.ok(body.includes('<p>' + d + '</p>'));
    }
  });

  it('draws Untitled for an empty name', async () => {
    serve({ list: json(listAnswer({ name: '' })) });
    assert.equal(meta((await get('/s/' + TOKEN)).body, 'og:title'), 'Без названия');
    assert.equal(meta((await get('/en/s/' + TOKEN)).body, 'og:title'), 'Untitled');
  });

  it("marks a GM link's title and draws the read's count for either audience", async () => {
    serve({ list: json(listAnswer({ audience: 'gm', n: 12 })) });
    const ru = await get('/s/' + TOKEN);
    for (const v of [
      meta(ru.body, 'og:title'),
      meta(ru.body, 'twitter:title'),
      unesc(title(ru.body)),
      h1(ru.body)
    ])
      assert.ok(v.startsWith('Лавка · Ссылка для мастера'), v);
    assert.equal(meta(ru.body, 'og:description'), '12 позиций');
    const en = await get('/en/s/' + TOKEN);
    assert.equal(unesc(meta(en.body, 'og:title')), "Лавка · GM's link");
    serve({ list: json(listAnswer({ audience: 'player', n: 10 })) });
    const players = await get('/s/' + TOKEN);
    assert.equal(meta(players.body, 'og:title'), 'Лавка');
    assert.equal(meta(players.body, 'og:description'), '10 позиций');
  });

  it('answers 503 for a count that is not a non-negative integer', async () => {
    for (const n of [-1, 1.5, '3', null]) {
      serve({ list: json(listAnswer({ n })) });
      const { res, body } = await get('/s/' + TOKEN);
      assert.equal(res.status, 503, String(n));
      assertRedirect(body, SITE + '#/s/' + TOKEN);
    }
    serve({ list: json([listAnswer()]) });
    assert.equal((await get('/s/' + TOKEN)).res.status, 503);
  });

  it('draws nothing of the answer but the name, the count and the note', async () => {
    serve({
      list: json(listAnswer({ audience: 'gm', note: 'PLAYER_NOTE', gm_note: 'MARK_gm' }))
    });
    for (const p of ['/s/' + TOKEN, '/en/s/' + TOKEN]) {
      const { body } = await get(p);
      assert.ok(!body.includes('MARK'), p);
      assert.ok(meta(body, 'og:description').includes('PLAYER_NOTE'));
      assert.ok(body.includes('<p>' + meta(body, 'og:description') + '</p>'));
    }
  });

  it('answers 404 shareGone for a null answer and for a malformed token, with no read', async () => {
    serve({ list: json(null) });
    const gone = await get('/s/' + TOKEN);
    assert.equal(gone.res.status, 404);
    assert.equal(meta(gone.body, 'og:title'), 'Список больше не доступен');
    assert.equal(meta(gone.body, 'og:description'), 'Владелец удалил эту ссылку или список.');
    assertRedirect(gone.body, SITE + '#/s/' + TOKEN);
    calls = [];
    const short = await get('/s/abc');
    assert.equal(short.res.status, 404);
    assert.equal(calls.length, 0);
    assertRedirect(short.body, SITE + '#/s/abc');
    const empty = await get('/en/s/');
    assert.equal(meta(empty.body, 'og:title'), 'This list is no longer available');
    assertRedirect(empty.body, SITE + 'en/');
  });

  it('answers 503 for a failed read', async () => {
    serve({ list: json({}, 500) });
    const { res, body } = await get('/s/' + TOKEN);
    assert.equal(res.status, 503);
    assertRedirect(body, SITE + '#/s/' + TOKEN);
  });
});

describe('the byte bounds', () => {
  /* `base` padded with spaces after the JSON to exactly `size` bytes. */
  const padded = (base, size) =>
    JSON.stringify(base) + ' '.repeat(size - bytes(JSON.stringify(base)));
  const unread = (body, headers) => {
    const res = new Response(body, { status: 200, headers });
    Object.defineProperty(res, 'body', {
      get() {
        return {
          getReader() {
            throw new Error('the body was read');
          },
          cancel: async () => {}
        };
      }
    });
    return res;
  };
  const stream = (chunk) => {
    const state = { pulled: 0, cancelled: false };
    const body = new ReadableStream({
      pull(c) {
        state.pulled++;
        c.enqueue(new Uint8Array(chunk).fill(32));
      },
      cancel() {
        state.cancelled = true;
      }
    });
    return { body, state };
  };

  it('draws the item card for an /h/ answer of exactly 65536 bytes', async () => {
    const body = padded(itemAnswer(), 65536);
    assert.equal(bytes(body), 65536);
    serve({
      item: new Response(body, { status: 200, headers: { 'Content-Length': '65536' } })
    });
    const r = await get('/h/' + ID);
    assert.equal(r.res.status, 200);
    assert.equal(meta(r.body, 'og:title'), 'Клинок');
  });

  it("answers 200 with the site's text past 65536 bytes, never reading a body with a length", async () => {
    serve({ item: () => unread(padded(itemAnswer(), 65537), { 'Content-Length': '65537' }) });
    const r = await get('/h/' + ID);
    assert.equal(r.res.status, 200);
    assert.equal(meta(r.body, 'og:title'), 'Генератор лута Daggerheart');
    assertRedirect(r.body, SITE + '#/h/' + ID);
  });

  it('cancels a 200000-byte /h/ stream with no length after at most five chunks', async () => {
    const { body, state } = stream(16384);
    serve({ item: () => new Response(body, { status: 200 }) });
    const r = await get('/h/' + ID);
    assert.equal(r.res.status, 200);
    assert.equal(meta(r.body, 'og:title'), 'Генератор лута Daggerheart');
    assert.ok(state.cancelled);
    assert.ok(state.pulled <= 5 + 1, String(state.pulled));
  });

  it("draws the list card at 8192 bytes and the site's text at 8193", async () => {
    const at = padded(listAnswer(), 8192);
    serve({ list: new Response(at, { status: 200, headers: { 'Content-Length': '8192' } }) });
    const ok = await get('/s/' + TOKEN);
    assert.equal(ok.res.status, 200);
    assert.equal(meta(ok.body, 'og:title'), 'Лавка');
    for (const headers of [{ 'Content-Length': '8193' }, {}]) {
      serve({ list: new Response(padded(listAnswer(), 8193), { status: 200, headers }) });
      const r = await get('/s/' + TOKEN);
      assert.equal(r.res.status, 200);
      assert.equal(meta(r.body, 'og:title'), 'Генератор лута Daggerheart');
      assertRedirect(r.body, SITE + '#/s/' + TOKEN);
    }
  });

  it('cancels a long /s/ stream after its first chunk', async () => {
    const { body, state } = stream(16384);
    serve({ list: () => new Response(body, { status: 200 }) });
    const r = await get('/s/' + TOKEN);
    assert.equal(r.res.status, 200);
    assert.ok(state.cancelled);
    assert.ok(state.pulled <= 2, String(state.pulled));
  });
});

describe('a path run past 2048 characters', () => {
  for (const [path, home] of [
    ['/h/' + 'a'.repeat(13000), SITE],
    ['/en/h/' + 'a'.repeat(13000), SITE + 'en/'],
    ['/s/' + 'A'.repeat(13000), SITE],
    ['/p/' + 'A'.repeat(13000), SITE],
    ['/en/p/' + 'A'.repeat(13000), SITE + 'en/']
  ]) {
    it(`reads ${path.slice(0, 8)}... as an empty run, with no read`, async () => {
      serve();
      const { res, body } = await get(path);
      assert.equal(res.status, 404);
      assert.equal(calls.length, 0);
      assert.ok(bytes(body) < 65536, String(bytes(body)));
      assertRedirect(body, home);
    });
  }
  it('sends a long table run home', async () => {
    const { res } = await get('/tables/' + 'a'.repeat(13000));
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('Location'), SITE);
  });
});

describe('/s/: the token and the filter', () => {
  it('keeps the filter in the redirect, never in og:url', async () => {
    serve();
    for (const [tail, kept] of [
      ['/f_range-melee', '/f_range-melee'],
      ['/f_tier-A', '/f_tier-A'],
      ['.', ''],
      ['/f_range-melee)', '/f_range-melee'],
      ['/f_range-melee%3Cb', '/f_range-melee'],
      ['/f_' + 'a'.repeat(2046), '/f_' + 'a'.repeat(2046)],
      ['/f_' + 'a'.repeat(2047), '']
    ]) {
      const { body } = await get('/s/' + TOKEN + tail);
      assertRedirect(body, SITE + '#/s/' + TOKEN + kept);
      assert.equal(meta(body, 'og:url'), HOST + '/s/' + TOKEN, tail);
    }
  });

  it('changes nothing for %22, %3C and </script> after the token, in the filter and in a query', async () => {
    serve();
    const clean = (await get('/s/' + TOKEN)).body;
    for (const p of [
      '/s/' + TOKEN + '%22%3C',
      '/s/' + TOKEN + '</script>',
      '/s/' + TOKEN + '?v=%22%3C/script%3E'
    ])
      assert.equal((await get(p)).body, clean, p);
    const filtered = (await get('/s/' + TOKEN + '/f_kind-item')).body;
    for (const p of [
      '/s/' + TOKEN + '/f_kind-item%22',
      '/s/' + TOKEN + '/f_kind-item</script>'
    ])
      assert.equal((await get(p)).body, filtered, p);
  });
});

describe('/p/: a print set', () => {
  it('draws the generic card for any 12-character id, with no read', async () => {
    serve();
    const ru = await get('/p/' + PRINT);
    assert.equal(ru.res.status, 200);
    assert.equal(calls.length, 0);
    assert.equal(meta(ru.body, 'og:title'), 'Печать карточек');
    assert.equal(meta(ru.body, 'og:description'), 'Войдите, чтобы печатать карточки.');
    assert.equal(meta(ru.body, 'og:image'), SITE + 'og/_share.jpg');
    assert.equal(meta(ru.body, 'og:url'), HOST + '/p/' + PRINT);
    assertRedirect(ru.body, SITE + '#/p/' + PRINT);
    const en = await get('/en/p/' + PRINT);
    assert.equal(meta(en.body, 'og:title'), 'Printing cards');
    assert.equal(meta(en.body, 'og:url'), HOST + '/en/p/' + PRINT);
    assertRedirect(en.body, SITE + 'en/#/p/' + PRINT);
  });

  it('answers 404 printSetGone for another length', async () => {
    const r = await get('/p/abc');
    assert.equal(r.res.status, 404);
    assert.equal(meta(r.body, 'og:title'), 'Печать карточек');
    assert.equal(
      meta(r.body, 'og:description'),
      'Набор не найден: ссылку не открывали 90 дней, или в адресе ошибка.'
    );
    assertRedirect(r.body, SITE + '#/p/abc');
    const empty = await get('/en/p/');
    assertRedirect(empty.body, SITE + 'en/');
  });

  it('changes nothing for %22, %3C and </script> after the id or in a query', async () => {
    const clean = (await get('/p/' + PRINT)).body;
    for (const p of [
      '/p/' + PRINT + '%22%3C',
      '/p/' + PRINT + '</script>',
      '/p/' + PRINT + '.?v=%22'
    ])
      assert.equal((await get(p)).body, clean, p);
  });
});

describe('/tables/: a catalog table', () => {
  async function card(path) {
    serve();
    return get(path);
  }
  it('names a table and counts its rows', async () => {
    const ru = await card('/tables/core_item');
    assert.equal(ru.res.status, 200);
    assert.equal(meta(ru.body, 'og:title'), 'Core · Предметы');
    assert.equal(meta(ru.body, 'og:description'), '60 позиций');
    assert.equal(meta(ru.body, 'og:image'), SITE + 'og/_share.jpg');
    assertRedirect(ru.body, SITE + '#/tables/core_item');
    const en = await card('/en/tables/core_item');
    assert.equal(unesc(meta(en.body, 'og:title')), 'Core · Items');
    assertRedirect(en.body, SITE + 'en/#/tables/core_item');
    assert.equal(
      meta((await card('/tables/alt_item')).body, 'og:title'),
      'Альт. таблицы · Предметы'
    );
    assert.equal(
      meta((await card('/en/tables/alt_item')).body, 'og:title'),
      'Alt. tables · Items'
    );
    const weapons = await card('/tables/eq_weapon');
    assert.equal(meta(weapons.body, 'og:title'), 'Снаряжение · Оружие');
    assert.equal(meta(weapons.body, 'og:description'), '437 позиций');
  });

  it('labels a community block and a frame block', async () => {
    const c = await card('/tables/community/Highborne');
    assert.equal(meta(c.body, 'og:title'), 'Сообщества · Великородное');
    assert.equal(meta(c.body, 'og:description'), 'Сообщество: Великородное. 10 позиций');
    assert.equal(meta(c.body, 'og:url'), HOST + '/tables/community/Highborne');
    assertRedirect(c.body, SITE + '#/tables/community/Highborne');
    assert.equal(
      meta((await card('/en/tables/community/Highborne')).body, 'og:description'),
      'Community: Highborne. 10 items'
    );
    const f = await card('/tables/other_frames/beast_feast');
    assert.equal(meta(f.body, 'og:title'), 'Прочее · Сеттинги · Пир зверей');
    assert.equal(meta(f.body, 'og:description'), 'Сеттинг: Пир зверей. 36 позиций');
  });

  it('labels a filter with no count', async () => {
    const c = await card('/tables/community/f_comm-Loreborne-Orderborne');
    assert.equal(meta(c.body, 'og:title'), 'Сообщества');
    assert.equal(meta(c.body, 'og:description'), 'Сообщество: Научное, Догматичное');
    assertRedirect(c.body, SITE + '#/tables/community/f_comm-Loreborne-Orderborne');
    assert.equal(
      meta(
        (await card('/en/tables/community/f_comm-Loreborne-Orderborne')).body,
        'og:description'
      ),
      'Community: Loreborne, Orderborne'
    );
    const alias = await card('/tables/frames/f_frame-beast_feast-colossus');
    assert.equal(meta(alias.body, 'og:title'), 'Прочее · Сеттинги');
    assert.equal(meta(alias.body, 'og:description'), 'Сеттинг: Пир зверей, Колоссы Сухоземья');
    assertRedirect(alias.body, SITE + '#/tables/frames/f_frame-beast_feast-colossus');
    const legacy = await card('/tables/other_frames/f_kind-armor_frame-colossus');
    assert.equal(meta(legacy.body, 'og:description'), 'Сеттинг: Колоссы Сухоземья');
  });

  it('draws the open line for a filter with no labelled group, and the plain card for an unlabelled anchor', async () => {
    const f = await card('/tables/eq_weapon/f_tier-1');
    assert.equal(meta(f.body, 'og:description'), 'Открыть в генераторе лута');
    assertRedirect(f.body, SITE + '#/tables/eq_weapon/f_tier-1');
    const a = await card('/tables/alt_item/rare');
    assert.equal(meta(a.body, 'og:title'), 'Альт. таблицы · Предметы');
    assert.equal(meta(a.body, 'og:description'), '120 позиций');
    assertRedirect(a.body, SITE + '#/tables/alt_item/rare');
    const unknown = await card('/tables/community/f_comm-Loreborne-Nowhere');
    assert.equal(meta(unknown.body, 'og:description'), 'Открыть в генераторе лута');
  });

  it('reads a prototype key as an unknown one', async () => {
    for (const p of ['/tables/community/constructor', '/tables/community/__proto__']) {
      const r = await card(p);
      assert.equal(meta(r.body, 'og:title'), 'Сообщества', p);
      assert.equal(meta(r.body, 'og:description'), '90 позиций', p);
    }
    for (const p of [
      '/tables/other_frames/f_frame-toString',
      '/tables/community/f_comm-constructor'
    ]) {
      const r = await card(p);
      assert.ok(!/constructor|toString|function/i.test(meta(r.body, 'og:description')), p);
      assert.equal(meta(r.body, 'og:description'), 'Открыть в генераторе лута', p);
    }
    const t = await card('/tables/constructor');
    assert.equal(t.res.status, 404);
  });

  it('reads the alias, a stray character, homebrew, an unknown table and a long tail', async () => {
    const alias = await card('/tables/frames');
    assert.equal(meta(alias.body, 'og:title'), 'Прочее · Сеттинги');
    assert.equal(meta(alias.body, 'og:url'), HOST + '/tables/frames');
    assertRedirect(alias.body, SITE + '#/tables/frames');
    assert.equal(
      (await card('/tables/core_item)')).body,
      (await card('/tables/core_item')).body
    );
    const hb = await card('/tables/homebrew/f_src-hb_aaaaaaaaaaaaaaaa');
    assert.equal(hb.res.status, 200);
    assert.equal(meta(hb.body, 'og:title'), 'Генератор лута Daggerheart');
    assertRedirect(hb.body, SITE + '#/tables/homebrew/f_src-hb_aaaaaaaaaaaaaaaa');
    const unknown = await card('/tables/nothing/x');
    assert.equal(unknown.res.status, 404);
    assertRedirect(unknown.body, SITE + '#/tables/nothing');
    const long = await card('/tables/core_item/' + 'a'.repeat(2049));
    assertRedirect(long.body, SITE + '#/tables/core_item');
  });

  it('changes nothing for %22, %3C and </script> after the table or in the tail', async () => {
    const clean = (await card('/tables/core_item')).body;
    for (const p of [
      '/tables/core_item%22%3C',
      '/tables/core_item</script>',
      '/tables/core_item?v=%22'
    ])
      assert.equal((await card(p)).body, clean, p);
    const tail = (await card('/tables/community/Highborne')).body;
    for (const p of ['/tables/community/Highborne%22', '/tables/community/Highborne</script>'])
      assert.equal((await card(p)).body, tail, p);
  });

  it("draws the site's text when names.json is unavailable", async () => {
    const w = await freshWorker();
    serve({ names: () => new Response('x', { status: 500 }) });
    const r = await get('/tables/core_item', { w });
    assert.equal(r.res.status, 200);
    assert.equal(meta(r.body, 'og:title'), 'Генератор лута Daggerheart');
    assertRedirect(r.body, SITE + '#/tables/core_item');
  });
});
