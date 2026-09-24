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
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  checks,
  runChecks,
  dirReader,
  UNKNOWN_PATH,
  NOT_FOUND_MARKER
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

const GOOD = {
  'index.html': {
    type: 'text/html',
    body:
      '<!doctype html><meta name="robots" content="noindex, nofollow">' +
      '<div id="app"></div><script type="module" crossorigin src="./assets/index-a1B2.js"></script>'
  },
  'assets/index-a1B2.js': { type: 'application/javascript', body: 'x'.repeat(30000) },
  'data.js': { type: 'application/javascript', body: 'window.LOOT = {}' },
  'data.json': { type: 'application/json', body: '{}' },
  'catalog.csv': { type: 'text/csv', body: 'id\n' },
  'llms.txt': { type: 'text/plain', body: 'ok' },
  'robots.txt': { type: 'text/plain', body: 'User-agent: *\nAllow: /' },
  'i/w1.html': { type: 'text/html', body: '<meta property="og:image" content="og/1.jpg">' },
  'i/en/w1.html': { type: 'text/html', body: '<meta property="og:image" content="og/1.jpg">' },
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
    assert.deepEqual(bad, ['the stub i/en/w1.html has lost its preview image (og:image)']);
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
    assert.equal(list.length, 46);
    const paths = [
      ...new Set(list.map((c) => (typeof c.path === 'function' ? '<entry>' : c.path)))
    ].sort();
    assert.deepEqual(paths, [
      '',
      '<entry>',
      'card/die-d12-bw.svg',
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
      'og/_share.jpg',
      'og/_share_en.jpg',
      'pages/en/install.html',
      'pages/en/privacy.html',
      'pages/en/terms.html',
      'pages/install.html',
      'pages/privacy.html',
      'pages/terms.html',
      'robots.txt',
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
