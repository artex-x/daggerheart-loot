/* What "the published site is correct" actually means, as data rather than
 * as two hand-written implementations that can drift from each other.
 *
 * `checks()` returns one array of `{ path, test(body, meta), message }`
 * descriptors. Nothing here knows how to fetch a path - that is an injected
 * `read(path)` reader, resolving to `{ status, type, body }` - so the exact
 * same list runs against a live URL (`fetchReader`, used by check-site.mjs
 * after a deploy) and against a local `_site/` build (`dirReader`, used by
 * ci.yml's guard step before the deploy even starts). Before this file
 * existed, ci.yml's guard step re-implemented a subset of these assertions
 * as hand-written `grep`/`wc` lines that had already drifted from
 * check-site.mjs once.
 *
 * English throughout: this is a tool, not product text (docs/specs/META.md
 * section 6). The rest of tests/ still prints Russian and moves to English
 * in a later batch - this file is not that batch, it is a new one.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** A path with no plausible collision, used to prove the 404 fallback -
 *  GitHub Pages serves /404.html, with a 404 status, for any path that does
 *  not exist. `dirReader` emulates that exact rule locally so this same
 *  check runs before a deploy has happened at all. */
export const UNKNOWN_PATH = 'this-path-does-not-exist-9f2c.html';

/** The 404 page's own marker (404.html carries `<div id="app-404">`,
 *  matching the convention `<div id="app">` already sets in index.html). */
export const NOT_FOUND_MARKER = 'id="app-404"';

export function checks() {
  const status200 = (name) => ({
    test: (body, meta) => meta.status === 200,
    message: (meta) => `${name} returned ${meta.status}, not 200`
  });

  return [
    { path: '', ...status200('root') },
    {
      path: '',
      test: (body, meta) => /html/i.test(meta.type),
      message: (meta) => `root was served as "${meta.type}", not html`
    },
    {
      path: '',
      test: (body) => /<meta\s+name="robots"\s+content="noindex/i.test(body),
      message: 'the published page has no noindex - docs/specs/META.md section 1'
    },
    {
      path: '',
      test: (body) => body.includes('assets/app.js'),
      message: 'the published page does not reference assets/app.js'
    },
    {
      path: '',
      test: (body) => /<div\s+id="app"/.test(body),
      message: 'the published page has no <div id="app">'
    },
    /* The assertion that the cut-over to the new app actually took: the old
     * app's entry script must be gone, not merely joined by the new one. */
    {
      path: '',
      test: (body) => !/src="\.?\/?app\.js"/.test(body),
      message: 'the published page mixes both apps - src="app.js" is still there'
    },

    { path: 'assets/app.js', ...status200('assets/app.js') },
    {
      path: 'assets/app.js',
      test: (body) => body.length > 20000,
      message: (meta) => `assets/app.js is only ${meta.body.length} bytes - not a real build`
    },

    { path: 'data.js', ...status200('data.js') },
    {
      path: 'data.js',
      test: (body) => body.startsWith('window.LOOT'),
      message: 'data.js no longer starts by assigning window.LOOT'
    },

    ...['data.json', 'catalog.csv', 'llms.txt', 'robots.txt'].map((f) => ({
      path: f,
      ...status200(f)
    })),

    /* The stub is what a messenger fetches for a link preview. */
    { path: 'i/w1.html', ...status200('i/w1.html') },
    {
      path: 'i/w1.html',
      test: (body) => body.includes('og:image'),
      message: 'the stub i/w1.html has lost its preview image (og:image)'
    },

    /* One probe per symlinked folder: img/, og/ and card/ are links the
     * build makes, and a broken link is served as a 404 rather than as an
     * error. The row thumbnails ride the img/ link. */
    ...['img/_none.webp', 'img/thumb/_none.webp', 'og/_share.jpg', 'card/die-d12-bw.svg'].map(
      (f) => ({
        path: f,
        ...status200(f)
      })
    ),

    /* The installable app (docs/specs/META.md section 9): build outputs
     * copied from app/public/, published by name. */
    { path: 'manifest.webmanifest', ...status200('manifest.webmanifest') },
    {
      path: 'manifest.webmanifest',
      test: (body) => {
        try {
          return JSON.parse(body).start_url === './';
        } catch {
          return false;
        }
      },
      message: 'manifest.webmanifest does not parse as JSON with start_url "./"'
    },
    { path: 'sw.js', ...status200('sw.js') },
    {
      path: 'sw.js',
      test: (body) => body.includes('dhloot-shell'),
      message: 'sw.js is not the service worker - no dhloot-shell cache in it'
    },
    { path: 'icons/icon-192.png', ...status200('icons/icon-192.png') },

    /* The generated site pages (docs/specs/META.md section 9, "Static
     * pages"): a plain URL outside the app, kept out of search results too. */
    { path: 'pages/install.html', ...status200('pages/install.html') },
    {
      path: 'pages/install.html',
      test: (body) =>
        /<meta\s+name="robots"\s+content="noindex/i.test(body) &&
        body.includes('id="app-page"'),
      message: 'pages/install.html lost its noindex or its id="app-page" marker'
    },

    /* The 404 fallback, owner-approved: a hosted record link truncated by a
     * chat client, or a stub for a record a data change dropped, has to
     * land somewhere better than GitHub's own generic 404 - with no
     * `404.html` every wrong path got GitHub's generic 404 (verified live
     * on `i/zzzz.html`), no link back in either language. See
     * `docs/specs/DEBT.md`. */
    {
      path: UNKNOWN_PATH,
      test: (body, meta) => meta.status === 404,
      message: (meta) =>
        `an unknown path returned ${meta.status}, not 404 - the 404 fallback is not being served`
    },
    {
      path: UNKNOWN_PATH,
      test: (body) => body.includes(NOT_FOUND_MARKER),
      message: 'the 404 response body is not the bilingual way-home page (404.html)'
    }
  ];
}

/** Runs `list` (default: the whole `checks()`) against `read`, caching one
 *  read per distinct path - several checks share a path (root, for
 *  instance), and re-reading it once per check would be wasteful for a
 *  network reader and pointless for a filesystem one. Returns the list of
 *  failure messages, empty when everything held. */
export async function runChecks(read, list = checks()) {
  const cache = new Map();
  const get = async (path) => {
    if (!cache.has(path)) cache.set(path, await read(path));
    return cache.get(path);
  };
  const bad = [];
  for (const c of list) {
    const meta = await get(c.path);
    if (!c.test(meta.body, meta)) {
      bad.push(typeof c.message === 'function' ? c.message(meta) : c.message);
    }
  }
  return bad;
}

/** The live-URL reader: plain `fetch`, no dependency, so it can run in a job
 *  that has not necessarily installed anything. `AbortSignal.timeout` gives
 *  every request a hard ceiling so one stalled CDN socket cannot hang this
 *  step indefinitely (the existing catch below already
 *  treats an abort as a retry) - it bounds a single request, not the whole
 *  retry loop below: `checks()`'s 17 distinct paths, `TRIES=6` and
 *  `WAIT_MS=10_000` between attempts add up to a worst case of roughly
 *  17 x 15s x 6 + 5 x 10s, about 26 minutes, if every request on every try
 *  stalls to its own ceiling - past `deploy`'s own 10-minute job timeout.
 *  That worst case needs every request to fail
 *  identically on every attempt, unlike the few-seconds-of-stale-CDN read
 *  this retry loop actually exists for; the job timeout is still what bounds
 *  it in the end. */
export function fetchReader(root, timeoutMs = 15_000) {
  return async (path) => {
    const url = root + path;
    const res = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs)
    });
    const body = await res.text();
    return { url, status: res.status, type: res.headers.get('content-type') || '', body };
  };
}

/** The local-`_site/`-build reader, used before a deploy exists at all
 *  (ci.yml's guard step). Emulates only the one Pages rule this file's
 *  checks depend on: a path that is not on disk is served as 404.html's
 *  content with a 404 status - not GitHub Pages' missing-path behaviour in
 *  general, which measurably diverges from this locally (an extensionless
 *  path is 200 live but 404 here; a directory path throws `EISDIR`; a
 *  case-insensitive filesystem 200s where Pages 404s). None of that matters
 *  to `checks()` above: every path it asserts against is an exact file,
 *  never one of those three shapes, so the one rule this reader does
 *  emulate is the only one any check here relies on. This is what makes the
 *  404-fallback checks above meaningful against a plain directory, not only
 *  against the live site. */
export function dirReader(dir) {
  return async (path) => {
    const rel = path === '' ? 'index.html' : path;
    const full = join(dir, rel);
    if (existsSync(full)) {
      return { url: full, status: 200, type: typeOf(rel), body: readFileSync(full, 'utf8') };
    }
    const fallback = join(dir, '404.html');
    if (existsSync(fallback)) {
      return {
        url: full,
        status: 404,
        type: typeOf('404.html'),
        body: readFileSync(fallback, 'utf8')
      };
    }
    return { url: full, status: 404, type: '', body: '' };
  };
}

function typeOf(rel) {
  if (rel.endsWith('.html')) return 'text/html';
  if (rel.endsWith('.js')) return 'application/javascript';
  if (rel.endsWith('.json')) return 'application/json';
  if (rel.endsWith('.csv')) return 'text/csv';
  if (rel.endsWith('.txt')) return 'text/plain';
  if (rel.endsWith('.svg')) return 'image/svg+xml';
  if (rel.endsWith('.webmanifest')) return 'application/manifest+json';
  if (rel.endsWith('.png')) return 'image/png';
  return '';
}
