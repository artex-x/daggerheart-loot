/* What every tests/app/ suite shares, and nothing else. driver.js, its
 * sibling in this directory, drives dist/ in a real browser; this file adds
 * what only matters for that - a guard that it was actually built, a page
 * factory that seeds storage before the first paint, and an axe runner.
 *
 * These suites check the rewrite against itself, with real input: does it
 * draw every address, is every control named, does axe find anything, is the
 * typography on the agreed scale. */
const fs = require('fs');
const http = require('http');
const path = require('path');
const puppeteer = require('puppeteer');
const { makeDriver, prepare } = require('./driver.js');

const ROOT = path.join(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');
const DIST_HTML = path.join(DIST, 'index.html');

/* Every suite requires this file before it does anything else, so the guard
   belongs at the top: a missing dist/ should say so once, in one sentence,
   rather than have all seven suites fail every address with a stack trace
   that is really just "the page never opened". */
if (!fs.existsSync(DIST_HTML)) {
  console.log('dist/index.html is not built - run npm run build first');
  process.exit(1);
}

/* golden.js and every other suite here
   compare captures against dist/ (golden.js's own header comment), but npm
   run check's npm run data step regenerates data.json/catalog.csv/i/ and
   never runs vite build - so dist/ can lag the tree arbitrarily. A
   --update run against a lagging dist/ re-records the OLD render, and the
   next verification run prints "unchanged", having measured nothing - the
   same failure class as a lost settle instrument (COVERAGE.md, "The
   gate rule for 'no golden moved'"). Fail closed, both halves, no escape
   hatch: an env-var bypass is a guard that gets waved through, which
   .claude/README.md already records as worse than no guard. */

/* Byte half: the three files `npm run data` actually regenerates, against
   their dist/ copies (~1.3 MB, milliseconds). Each dist/ copy is verified
   to exist before it is depended on - the deploy collect step copies
   data.json/catalog.csv from the repo root, not from dist/, so their
   presence in dist/ comes only from vite's own static asset copying and is
   not guaranteed; a file vite did not emit is dropped from the comparison
   rather than treated as a mismatch. llms.txt is deliberately excluded -
   it is not one of the three files `npm run data` writes. */
const BYTE_FILES = ['data.js', 'data.json', 'catalog.csv'];
for (const f of BYTE_FILES) {
  const distCopy = path.join(DIST, f);
  if (!fs.existsSync(distCopy)) continue;
  if (!fs.readFileSync(path.join(ROOT, f)).equals(fs.readFileSync(distCopy))) {
    console.log('dist/ is stale (byte check, ' + f + ') - run npm run build first');
    process.exit(1);
  }
}

/* Mtime half: newest mtime under app/src/ - excluding every *.test.ts file
   and the whole app/src/test/ directory, neither of which is bundled, so
   neither can make dist/ stale, and including them would demand a rebuild
   after every test edit - plus app/public/ (copied into dist/ verbatim),
   app/index.html, vite.config.mts and app/svelte.config.mjs, compared
   against dist/index.html, which every build rewrites. Safe on CI:
   ci.yml's browser job runs `npm ci` then `npm run build` before any suite,
   and checkout sets source mtimes ahead of the build, so this cannot fire
   falsely there. */
function newestMtimeUnder(dir) {
  let newest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === path.join(ROOT, 'app', 'src', 'test')) continue;
      newest = Math.max(newest, newestMtimeUnder(full));
    } else if (!entry.name.endsWith('.test.ts')) {
      newest = Math.max(newest, fs.statSync(full).mtimeMs);
    }
  }
  return newest;
}

const sourceNewest = Math.max(
  newestMtimeUnder(path.join(ROOT, 'app', 'src')),
  newestMtimeUnder(path.join(ROOT, 'app', 'public')),
  fs.statSync(path.join(ROOT, 'app', 'index.html')).mtimeMs,
  fs.statSync(path.join(ROOT, 'vite.config.mts')).mtimeMs,
  fs.statSync(path.join(ROOT, 'app', 'svelte.config.mjs')).mtimeMs
);
if (sourceNewest > fs.statSync(DIST_HTML).mtimeMs) {
  console.log('dist/ is stale (mtime check, dist/index.html) - run npm run build first');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp'
};

/** A static server over dist/ on a free port of 127.0.0.1: files only, no
 *  listing, 404 for anything else. Port 0, never a fixed one: run-all.js runs
 *  the suites in parallel, and each process gets its own port, so its own
 *  origin and storage. tools/smoke-http.mjs reuses it. */
function serveDist() {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(DIST, rel);
    const type = TYPES[path.extname(file)];
    if (!file.startsWith(DIST + path.sep) || !type || !fs.existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': type, date: new Date().toUTCString() });
    res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/* One server per process, started by the first page. */
let serverPromise = null;
let base = null;
async function startServer() {
  if (!serverPromise) {
    serverPromise = serveDist().then((server) => {
      base = 'http://127.0.0.1:' + String(server.address().port) + '/';
      return server;
    });
  }
  return serverPromise;
}

/** The served dist/ root, `http://127.0.0.1:<port>/`. Valid once a page
 *  from `fresh()` or `sharedPage()` exists. */
function baseUrl() {
  if (!base)
    throw new Error('The dist/ server is not started. Open a page through fresh() first');
  return base;
}

let browserPromise = null;
function browser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      /* This tree is shared with peer sessions (CLAUDE.md, "Task and session
         protocol"): a shared tree plus a loaded host makes a CDP round trip
         exceed puppeteer's default, so a `protocolTimeout` failure under
         load is contention, not a defect. */
      protocolTimeout: 300_000
    });
  }
  return browserPromise;
}

/** Closes the one browser this process launched, if it launched one. Call
 *  once, at the end of a suite, before process.exit. */
async function closeBrowser() {
  if (serverPromise) {
    const server = await serverPromise;
    serverPromise = null;
    base = null;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  if (!browserPromise) return;
  const b = await browserPromise;
  browserPromise = null;
  await b.close();
}

/**
 * A fresh context and driver against dist/, seeded before the first paint.
 *
 * A context rather than a bare page: two pages that share `browser.newPage()`
 * also share cookies and storage, and `tests/app/states.js`'s two-tabs case
 * needs two contexts that do not. Every other suite gets one context per
 * call and simply never opens a second.
 *
 * `prepare()` (driver.js) stubs reduced motion, the clipboard, and clears
 * localStorage, so every page opened here starts from the same known state.
 * `lang` and `storage` are seeded *after* prepare() clears storage and
 * *before* the first navigation, the same ordering `d.seed()` documents on
 * the driver.
 */
async function fresh({ width = 1180, height = 900, lang, storage } = {}) {
  await startServer();
  const b = await browser();
  const ctx = await b.createBrowserContext();
  const page = await ctx.newPage();
  await prepare(page);
  await page.evaluateOnNewDocument(
    (l, kv) => {
      try {
        if (l) localStorage.setItem('dhloot.lang.v1', l);
        if (kv) for (const k of Object.keys(kv)) localStorage.setItem(k, kv[k]);
      } catch (e) {
        void e;
      }
    },
    lang,
    storage
  );
  await page.setViewport({ width, height });
  const d = makeDriver(page, 'next');
  return { ctx, page, d };
}

/**
 * A page on the browser's own default context, not an isolated one -
 * `tests/app/states.js`'s two-tabs case needs two pages that genuinely
 * share `localStorage`, which `fresh()`'s own incognito-like context (one
 * per call, by design, so every other case never leaks into the next)
 * keeps apart. There is no `ctx` to close: close
 * the page itself when done, and leave the shared context to `closeBrowser()`.
 *
 * Order matters to the one caller of this: open the page that must observe
 * the `storage` event first, and the page that writes second, so the second
 * page's own `prepare()` clear (harmless before anything real is written)
 * does not race the first page's read of what it expects to see.
 */
async function sharedPage({ width = 1180, height = 900, lang, storage } = {}) {
  await startServer();
  const b = await browser();
  const page = await b.newPage();
  await prepare(page);
  await page.evaluateOnNewDocument(
    (l, kv) => {
      try {
        if (l) localStorage.setItem('dhloot.lang.v1', l);
        if (kv) for (const k of Object.keys(kv)) localStorage.setItem(k, kv[k]);
      } catch (e) {
        void e;
      }
    },
    lang,
    storage
  );
  await page.setViewport({ width, height });
  const d = makeDriver(page, 'next');
  return { page, d };
}

const AXE_PATH = require.resolve('axe-core/axe.min.js');

/**
 * Runs axe over the page as it stands, with `color-contrast` on - the one
 * rule `app/src/test/a11y.ts` cannot answer honestly in jsdom, and the whole
 * reason this suite exists rather than another vitest case.
 *
 * No per-call rule disabling: `#/lists`/`#/lists/a` used to need one for
 * `nested-interactive` (`StorageNotice.svelte`'s dismiss button sat inside
 * its own `<summary>`); paid off, and it turned out
 * the parameter that carried it had gone unused by
 * every caller - `app/src/test/a11y.ts`'s own comment already argues that a
 * parameter with no caller is a maintained shape for nothing, so this suite
 * does not keep one either. A future live-shared defect that needs one adds
 * it back with a caller, not ahead of one.
 *
 * Returns violations only - a suite reads `.length` for "found anything" and
 * the array itself to print what.
 */
async function axe(page) {
  await page.addScriptTag({ path: AXE_PATH });
  const rules = { 'color-contrast': { enabled: true } };
  return page.evaluate(async (r) => {
    const res = await window.axe.run(document, { rules: r });
    return res.violations;
  }, rules);
}

/**
 * One failure counter and one dedupe set, shared by every suite so the five
 * report the same way - lifted from tests/audit2.js rather than reinvented.
 * Each suite calls this once for its own tally; nothing here is shared
 * across suites, since `run-all.js` runs each in its own process.
 */
function reporter() {
  let fail = 0;
  const seen = new Set();
  return {
    ok(c, m) {
      if (!c && !seen.has(m)) {
        seen.add(m);
        fail++;
        console.log('  FAIL ' + m);
      }
    },
    get failed() {
      return fail;
    }
  };
}

module.exports = {
  DIST_HTML,
  serveDist,
  baseUrl,
  fresh,
  sharedPage,
  closeBrowser,
  axe,
  reporter
};
