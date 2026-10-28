/*
  node:test over check-site.lib.mjs's `checks()`/`runChecks()` - an in-memory
  good site and several broken ones, driven through the exact same injected-
  reader contract `fetchReader`/`dirReader` implement, so this is unit
  coverage for the assertions themselves rather than for either transport.
  `dirReader` itself is covered separately
  below against a real temp directory, since it is the one with filesystem
  logic worth proving (the GitHub-Pages-404 emulation).
*/
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  appChecks,
  checks,
  fileChecks,
  mirrorChecks,
  runChecks,
  dirReader,
  UNKNOWN_PATH,
  NOT_FOUND_MARKER,
  previewChecks,
  SCHEMA_IDS
} from './check-site.lib.mjs';

/** An in-memory site: `files` maps a request path (`''` for root) to
 *  `{ type, body }`. A miss falls back to `files['404.html']` with a 404
 *  status - the same rule `dirReader` applies to a real directory, and the
 *  one GitHub Pages itself applies to the live site. */
function memoryReader(files) {
  return async (path) => {
    const key = path === '' ? 'index.html' : path;
    if (key in files)
      return { status: 200, type: files[key].type || '', body: files[key].body };
    if ('404.html' in files) {
      return {
        status: 404,
        type: files['404.html'].type || 'text/html',
        body: files['404.html'].body
      };
    }
    return { status: 404, type: '', body: '' };
  };
}

const SITE_PAGE =
  '<meta name="robots" content="noindex, nofollow"><meta property="og:title" content="x">' +
  '<main id="app-page"></main>';
const CONTACT = '<a href="mailto:daggerheart.loot@gmail.com">mail</a>';
const stub = (link) =>
  '<meta property="og:image" content="og/1.jpg">' +
  `<meta property="og:url" content="https://daggerheart-loot.pages.dev/${link}">`;

const GOOD = {
  'index.html': {
    type: 'text/html',
    body:
      '<!doctype html><meta name="robots" content="noindex, nofollow">' +
      '<div id="app"></div><script type="module" crossorigin src="./assets/index-a1B2.js"></script>'
  },
  'assets/index-a1B2.js': { type: 'application/javascript', body: 'x'.repeat(30000) },
  'data.js': {
    type: 'application/javascript',
    body: 'window.LOOT = {}\nwindow.LOOT_V = {};\n'
  },
  'data.json': { type: 'application/json', body: '{}' },
  'catalog.csv': { type: 'text/csv', body: 'id\n' },
  'catalog-index.csv': { type: 'text/csv', body: 'id\n' },
  'names.json': {
    type: 'application/json',
    body: JSON.stringify({ format: 'daggerheart-loot/names', version: 1 })
  },
  'llms.txt': { type: 'text/plain', body: 'ok' },
  'robots.txt': { type: 'text/plain', body: 'User-agent: *\nAllow: /' },
  ...Object.fromEntries(
    Object.entries(SCHEMA_IDS).map(([f, id]) => [
      f,
      { type: 'application/json', body: JSON.stringify({ $id: id }) }
    ])
  ),
  'i/w1.html': { type: 'text/html', body: stub('i/w1') },
  'i/en/w1.html': { type: 'text/html', body: stub('i/en/w1') },
  'en/index.html': {
    type: 'text/html',
    body: '<meta name="robots" content="noindex, nofollow"><meta property="og:title" content="x">'
  },
  'img/_none.webp': { type: 'image/webp', body: 'x' },
  'img/thumb/_none.webp': { type: 'image/webp', body: 'x' },
  'og/_share.jpg': { type: 'image/jpeg', body: 'x' },
  'og/_share_en.jpg': { type: 'image/jpeg', body: 'x' },
  'card/die-d12-bw.svg': { type: 'image/svg+xml', body: '<svg></svg>' },
  'manifest.webmanifest': {
    type: 'application/manifest+json',
    body: '{"start_url":"./","scope":"./"}'
  },
  'sw.js': { type: 'application/javascript', body: "const ASSETS = 'dhloot-assets-v1';" },
  'icons/icon-192.png': { type: 'image/png', body: 'x' },
  'pages/install.html': {
    type: 'text/html',
    body:
      '<meta name="robots" content="noindex, nofollow"><meta property="og:title" content="x">' +
      '<main id="app-page"></main>'
  },
  'pages/en/install.html': { type: 'text/html', body: SITE_PAGE },
  'pages/terms.html': { type: 'text/html', body: SITE_PAGE },
  'pages/en/terms.html': { type: 'text/html', body: SITE_PAGE },
  'pages/privacy.html': { type: 'text/html', body: SITE_PAGE + CONTACT },
  'pages/en/privacy.html': { type: 'text/html', body: SITE_PAGE + CONTACT },
  '404.html': { type: 'text/html', body: `<!doctype html><div id="app-404"></div>` }
};

describe('checks() against a good site', () => {
  it('reports nothing', async () => {
    const bad = await runChecks(memoryReader(GOOD));
    assert.deepEqual(bad, []);
  });

  it('serves the 404 fallback for an unrelated unknown path too - the same rule Pages applies', async () => {
    const read = memoryReader(GOOD);
    const meta = await read('some/other/unknown/path.html');
    assert.equal(meta.status, 404);
    assert.ok(meta.body.includes(NOT_FOUND_MARKER));
  });
});

describe('checks() against broken sites', () => {
  it('catches a root that does not return 200 (no index.html - falls through to 404.html)', async () => {
    const { 'index.html': _dropped, ...withoutIndex } = GOOD;
    const bad = await runChecks(memoryReader(withoutIndex));
    assert.ok(
      bad.some((m) => /root returned 404, not 200/.test(m)),
      `expected a root-status failure, got: ${JSON.stringify(bad)}`
    );
  });

  for (const f of Object.keys(SCHEMA_IDS)) {
    it(`catches a missing ${f}, and one that names another $id`, async () => {
      const withoutSchema = Object.fromEntries(Object.entries(GOOD).filter(([k]) => k !== f));
      const missing = await runChecks(memoryReader(withoutSchema));
      assert.ok(
        missing.some((m) => m.includes(`${f} returned 404, not 200`)),
        `expected a schema-status failure, got: ${JSON.stringify(missing)}`
      );
      for (const body of [JSON.stringify({ $id: 'https://example.test/x.json' }), 'not json']) {
        const bad = await runChecks(
          memoryReader({ ...GOOD, [f]: { type: 'application/json', body } })
        );
        assert.ok(
          bad.some((m) => m.includes(`${f} names another $id`)),
          `expected an $id failure, got: ${JSON.stringify(bad)}`
        );
      }
    });
  }

  it('catches a tiny entry module that is not a real build', async () => {
    const broken = {
      ...GOOD,
      'assets/index-a1B2.js': { type: 'application/javascript', body: 'tiny' }
    };
    const bad = await runChecks(memoryReader(broken));
    assert.deepEqual(bad, ['the entry module is only 4 bytes - not a real build']);
  });

  it('catches a page whose entry is a classic script, not one hashed module', async () => {
    const broken = {
      ...GOOD,
      'index.html': {
        type: 'text/html',
        body:
          '<meta name="robots" content="noindex, nofollow"><div id="app"></div>' +
          '<script defer src="./assets/app.js"></script>'
      }
    };
    const bad = await runChecks(memoryReader(broken));
    assert.ok(
      bad.includes('the published page does not reference exactly one assets/*.js module') &&
        bad.includes('the entry module returned 404, not 200'),
      `expected an entry failure, got: ${JSON.stringify(bad)}`
    );
  });

  it('catches a worker that still carries the retired shell cache', async () => {
    const broken = {
      ...GOOD,
      'sw.js': {
        type: 'application/javascript',
        body: "const SHELL = 'dhloot-shell-v1'; const ASSETS = 'dhloot-assets-v1';"
      }
    };
    const bad = await runChecks(memoryReader(broken));
    assert.deepEqual(bad, [
      'sw.js is not the current service worker - no dhloot-assets-v1, or a shell cache'
    ]);
  });

  it('catches a privacy page that lost the contact address', async () => {
    const broken = { ...GOOD, 'pages/en/privacy.html': { type: 'text/html', body: SITE_PAGE } };
    const bad = await runChecks(memoryReader(broken));
    assert.deepEqual(bad, ['pages/en/privacy.html does not name the contact address']);
  });

  it('catches a share stub with no og:image', async () => {
    const broken = {
      ...GOOD,
      'i/w1.html': { type: 'text/html', body: '<p>no preview here</p>' }
    };
    const bad = await runChecks(memoryReader(broken));
    assert.ok(
      bad.some((m) => /i\/w1\.html has lost its preview image/.test(m)),
      `expected an og:image failure, got: ${JSON.stringify(bad)}`
    );
  });

  it('catches a manifest whose start_url is absolute', async () => {
    const broken = {
      ...GOOD,
      'manifest.webmanifest': {
        type: 'application/manifest+json',
        body: '{"start_url":"/daggerheart-loot/"}'
      }
    };
    const bad = await runChecks(memoryReader(broken));
    assert.deepEqual(bad, ['manifest.webmanifest does not parse as JSON with start_url "./"']);
  });

  it('catches a site page that lost its noindex', async () => {
    const broken = {
      ...GOOD,
      'pages/install.html': {
        type: 'text/html',
        body: '<meta property="og:title" content="x"><main id="app-page"></main>'
      }
    };
    const bad = await runChecks(memoryReader(broken));
    assert.deepEqual(bad, [
      'pages/install.html lost its noindex, its id="app-page" marker or its og:title'
    ]);
  });

  it('catches an English stub with no og:image', async () => {
    const broken = {
      ...GOOD,
      'i/en/w1.html': { type: 'text/html', body: '<p>no preview here</p>' }
    };
    const bad = await runChecks(memoryReader(broken));
    assert.deepEqual(bad, [
      'the stub i/en/w1.html has lost its preview image (og:image)',
      'the stub i/en/w1.html has an og:url that does not end with i/en/w1'
    ]);
  });

  it('catches a stub that is the app shell, or whose og:url keeps .html', async () => {
    const broken = {
      ...GOOD,
      'i/w1.html': { type: 'text/html', body: stub('i/w1') + '<div id="app"></div>' },
      'i/en/w1.html': { type: 'text/html', body: stub('i/en/w1.html') }
    };
    const bad = await runChecks(memoryReader(broken));
    assert.deepEqual(bad, [
      "the stub i/w1.html is the app shell, not the record's own page",
      'the stub i/en/w1.html has an og:url that does not end with i/en/w1'
    ]);
  });

  it('catches a data.js without the card version map', async () => {
    const broken = {
      ...GOOD,
      'data.js': { type: 'application/javascript', body: 'window.LOOT = {}' }
    };
    const bad = await runChecks(memoryReader(broken));
    assert.deepEqual(bad, ['data.js does not carry window.LOOT_V, the card version map']);
  });

  it('catches an English entry document that lost its og:title', async () => {
    const broken = {
      ...GOOD,
      'en/index.html': { type: 'text/html', body: '<meta name="robots" content="noindex">' }
    };
    const bad = await runChecks(memoryReader(broken));
    assert.deepEqual(bad, ['en/index.html lost its noindex or its og:title']);
  });

  it('catches a missing English site card and English site page', async () => {
    const {
      'og/_share_en.jpg': _card,
      'pages/en/install.html': _page,
      ...withoutEnglish
    } = GOOD;
    const bad = await runChecks(memoryReader(withoutEnglish));
    assert.ok(
      bad.some((m) => /og\/_share_en\.jpg/.test(m)) &&
        bad.some((m) => /pages\/en\/install\.html/.test(m)),
      `expected an English card and page failure, got: ${JSON.stringify(bad)}`
    );
  });

  it('catches a site with no 404 fallback at all (status is still 404, but the body is not the way-home page)', async () => {
    const { '404.html': _dropped, ...withoutFallback } = GOOD;
    const bad = await runChecks(memoryReader(withoutFallback));
    assert.ok(
      bad.some((m) => /404 response body is not the bilingual way-home page/.test(m)),
      `expected a 404-marker failure, got: ${JSON.stringify(bad)}`
    );
  });
});

describe('dirReader - the GitHub Pages missing-path emulation, against a real directory', () => {
  it('serves an existing file with status 200', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'check-site-'));
    try {
      writeFileSync(join(dir, 'index.html'), '<div id="app"></div>');
      const read = dirReader(dir);
      const meta = await read('');
      assert.equal(meta.status, 200);
      assert.equal(meta.type, 'text/html');
      assert.equal(meta.robots, '');
      assert.ok(meta.body.includes('id="app"'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('falls back to 404.html with status 404 for a path that does not exist', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'check-site-'));
    try {
      writeFileSync(join(dir, '404.html'), '<div id="app-404"></div>');
      const read = dirReader(dir);
      const meta = await read(UNKNOWN_PATH);
      assert.equal(meta.status, 404);
      assert.ok(meta.body.includes('id="app-404"'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns an empty 404 when neither the path nor 404.html exists', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'check-site-'));
    try {
      const read = dirReader(dir);
      const meta = await read(UNKNOWN_PATH);
      assert.equal(meta.status, 404);
      assert.equal(meta.body, '');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('checks() shape', () => {
  it('is the exact, named set of {path, test, message} descriptors - not just "more than a few"', () => {
    const list = checks();
    // `list.length > 10` could not catch an assertion silently vanishing in
    // a refactor, because a refactor that dropped several checks would
    // still pass it.
    // The exact count and the exact sorted distinct path set close that.
    assert.equal(list.length, 64);
    assert.equal(list.length, appChecks().length + fileChecks().length);
    const paths = [
      ...new Set(list.map((c) => (typeof c.path === 'function' ? '<entry>' : c.path)))
    ].sort();
    assert.deepEqual(paths, [
      '',
      '<entry>',
      'card/die-d12-bw.svg',
      'catalog-index.csv',
      'catalog.csv',
      'data.js',
      'data.json',
      'en/index.html',
      'i/en/w1.html',
      'i/w1.html',
      'icons/icon-192.png',
      'img/_none.webp',
      'img/thumb/_none.webp',
      'llms.txt',
      'manifest.webmanifest',
      'names.json',
      'og/_share.jpg',
      'og/_share_en.jpg',
      'pages/en/install.html',
      'pages/en/privacy.html',
      'pages/en/terms.html',
      'pages/install.html',
      'pages/privacy.html',
      'pages/terms.html',
      'robots.txt',
      'schema/homebrew-v1.json',
      'schema/homebrew-v2.json',
      'schema/import-v1.json',
      'schema/import-v2.json',
      'schema/import-v3.json',
      'sw.js',
      UNKNOWN_PATH
    ]);
    for (const c of list) {
      assert.ok(typeof c.path === 'string' || typeof c.path === 'function');
      assert.equal(typeof c.test, 'function');
      assert.ok(typeof c.message === 'string' || typeof c.message === 'function');
    }
  });
});

describe('mirrorChecks() against the old host, from a directory', () => {
  const MOVED =
    '<meta name="robots" content="noindex, nofollow"><div id="app-moved">' +
    '<a href="https://daggerheart-loot.pages.dev/">daggerheart-loot.pages.dev</a></div>';
  const UNREGISTER = 'self.registration.unregister();';
  /* The deploy's _old: the site minus assets/, data.js and the install guide, with the
     forwarding root and the unregistering worker. */
  const mirror = (over = {}) => {
    const files = Object.fromEntries(
      Object.entries(GOOD).filter(
        ([k]) =>
          !k.startsWith('assets/') &&
          k !== 'data.js' &&
          k !== 'pages/install.html' &&
          k !== 'pages/en/install.html'
      )
    );
    Object.assign(files, {
      'index.html': { type: 'text/html', body: MOVED },
      'sw.js': { type: 'application/javascript', body: UNREGISTER },
      ...over
    });
    const dir = mkdtempSync(join(tmpdir(), 'check-site-mirror-'));
    for (const [k, v] of Object.entries(files)) {
      if (v === null) continue;
      mkdirSync(dirname(join(dir, k)), { recursive: true });
      writeFileSync(join(dir, k), v.body);
    }
    return dir;
  };
  const run = async (over) => {
    const dir = mirror(over);
    try {
      return await runChecks(dirReader(dir), mirrorChecks());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it('reports nothing for the assembled mirror', async () => {
    assert.deepEqual(await run(), []);
  });

  it('catches a root that is the app, not the forwarding page', async () => {
    const bad = await run({ 'index.html': GOOD['index.html'] });
    assert.ok(bad.includes('the mirror root lost its noindex or its id="app-moved" text'));
    assert.ok(bad.includes('the mirror root loads the app; it should only forward'));
  });

  it("catches the app's worker in place of the unregistering one", async () => {
    const bad = await run({ 'sw.js': GOOD['sw.js'] });
    assert.deepEqual(bad, ["the mirror's sw.js is not the worker that unregisters itself"]);
  });

  it('catches an install guide left on the mirror', async () => {
    const bad = await run({ 'pages/install.html': GOOD['pages/install.html'] });
    assert.deepEqual(bad, ['the mirror serves pages/install.html (200), not 404']);
  });

  it('requires catalog-index.csv, as the site does', async () => {
    const bad = await run({ 'catalog-index.csv': null });
    assert.ok(bad.includes('catalog-index.csv returned 404, not 200'));
    assert.ok(
      mirrorChecks().some((c) => c.path === 'catalog-index.csv') &&
        checks().some((c) => c.path === 'catalog-index.csv')
    );
  });
});

describe('previewChecks() against the preview host', () => {
  const CARD =
    '<meta name="robots" content="noindex, nofollow"><meta property="og:title" content="x">';
  const TOKEN = 's/' + 'A'.repeat(43);
  const ITEM = 'h/00000000-0000-4000-8000-000000000000';
  /* A host that answers as the preview host does; `over` replaces one path's answer. */
  const host = (over = {}) => {
    const files = {
      'robots.txt': {
        status: 200,
        body: '# Readable data, for an agent\nUser-agent: *\nAllow: /\nContent-Signal: search=no\n'
      },
      'llms.txt': { status: 200, robots: 'noindex', body: 'ok' },
      'catalog-index.csv': { status: 200, robots: 'noindex', body: 'id\n' },
      mcp: { status: 404, body: '<div id="app-404"></div>' },
      'i/w1?v=x': { status: 200, body: stub('i/w1') },
      'manual:i/w1.html': { status: 308, location: '/i/w1', body: '' },
      'h/not-a-uuid': { status: 404, body: CARD },
      's/x': { status: 404, body: CARD },
      'p/x': { status: 404, body: CARD },
      [TOKEN]: { status: 404, body: CARD },
      [ITEM]: { status: 404, body: CARD },
      'tables/core_item': {
        status: 200,
        body: CARD + '<meta property="og:description" content="128 entries">'
      },
      ...over
    };
    return async (path, { manual = false } = {}) => {
      const f = files[(manual ? 'manual:' : '') + path];
      return {
        status: f.status,
        type: 'text/html',
        robots: f.robots ?? '',
        location: f.location ?? '',
        body: f.body
      };
    };
  };

  it('reports nothing for a host that answers every check', async () => {
    assert.deepEqual(await runChecks(host(), previewChecks()), []);
  });

  it('names the card read and the secrets when the well-formed token answers 503', async () => {
    const bad = await runChecks(
      host({ [TOKEN]: { status: 503, body: CARD } }),
      previewChecks()
    );
    assert.equal(bad.length, 1);
    assert.match(bad[0], /returned 503, not 404 - the read get_shared_list_preview failed/);
    assert.match(bad[0], /SUPABASE_URL and SUPABASE_KEY/);
  });

  it('names the item read and the secrets when the well-formed uuid answers 503', async () => {
    const bad = await runChecks(host({ [ITEM]: { status: 503, body: CARD } }), previewChecks());
    assert.equal(bad.length, 1);
    assert.match(bad[0], /returned 503, not 404 - the read get_item_preview failed/);
    assert.match(bad[0], /SUPABASE_URL and SUPABASE_KEY/);
  });

  for (const [path, answer, pattern] of [
    ['robots.txt', { status: 404, body: '' }, /robots\.txt returned 404/],
    ['robots.txt', { status: 200, body: 'nothing' }, /no User-agent line/],
    [
      'robots.txt',
      { status: 200, body: 'User-agent: *\nAllow: /\n' },
      /not the site's own file/
    ],
    ['llms.txt', { status: 200, body: 'ok' }, /llms\.txt has no X-Robots-Tag: noindex/],
    [
      'catalog-index.csv',
      { status: 200, robots: 'all', body: 'id' },
      /catalog-index\.csv has no X-Robots-Tag: noindex \(got "all"\)/
    ],
    ['mcp', { status: 200, body: '' }, /mcp returned 200, not 404 - the path is reserved/],
    ['i/w1?v=x', { status: 404, body: '' }, /i\/w1\?v=x returned 404/],
    [
      'manual:i/w1.html',
      { status: 200, body: stub('i/w1') },
      /i\/w1\.html answered 200 to "", not one 308 to \/i\/w1/
    ],
    [
      'manual:i/w1.html',
      { status: 308, location: '/i/w1.html', body: '' },
      /not one 308 to \/i\/w1/
    ],
    [
      'tables/core_item',
      { status: 200, body: CARD + '<meta property="og:description" content="a table">' },
      /names\.json was not read/
    ],
    ['h/not-a-uuid', { status: 200, body: CARD }, /h\/not-a-uuid returned 200, not 404/],
    ['s/x', { status: 404, body: '<p>no meta</p>' }, /s\/x has no noindex/],
    ['p/x', { status: 302, body: '' }, /p\/x returned 302/],
    ['tables/core_item', { status: 503, body: CARD }, /tables\/core_item returned 503/],
    ['tables/core_item', { status: 200, body: '<p></p>' }, /lost its noindex or its og:title/]
  ]) {
    it(`fails on ${path} answering ${answer.status}`, async () => {
      const bad = await runChecks(host({ [path]: answer }), previewChecks());
      assert.ok(
        bad.some((m) => pattern.test(m)),
        bad.join('; ')
      );
    });
  }

  it('is the exact set of preview paths', () => {
    const list = previewChecks();
    assert.equal(list.length, 21);
    assert.deepEqual([...new Set(list.map((c) => c.path))].sort(), [
      'catalog-index.csv',
      ITEM,
      'h/not-a-uuid',
      'i/w1.html',
      'i/w1?v=x',
      'llms.txt',
      'mcp',
      'p/x',
      'robots.txt',
      TOKEN,
      's/x',
      'tables/core_item'
    ]);
  });
});
