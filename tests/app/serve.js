/* A built directory, checked and served. Two callers, two directories:
 * tests/app/lib.js drives `dist-test/` (the test build, fake cloud on) and
 * tools/smoke-http.mjs drives `dist/` (what is published) - so the guard and
 * the server take the directory rather than guarding one at require time. */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { builtDataScript } = require('../../tools/data-script.js');

const ROOT = path.join(__dirname, '..', '..');

/* The command that rebuilds each directory, for the guard's messages. */
const BUILD_OF = { dist: 'npm run build', 'dist-test': 'npm run build:test' };

/* `npm run check`'s `npm run data` step regenerates data.json/catalog.csv/i/
   and never runs vite build - so a build can lag the tree arbitrarily. A
   golden --update run against a lagging build re-records the OLD render, and
   the next verification run prints "unchanged", having measured nothing - the
   same failure class as a lost settle instrument (COVERAGE.md, "The gate
   rule for 'no golden moved'"). Fail closed, both halves, no escape hatch:
   an env-var bypass is a guard that gets waved through, which
   .claude/README.md already records as worse than no guard. */

/* Byte half: the three files `npm run data` actually regenerates, against
   their copies in the build (~1.3 MB, milliseconds). A copy the build did not
   emit is dropped from the comparison rather than treated as a mismatch.
   llms.txt is deliberately excluded - it is not one of the three files
   `npm run data` writes. The built data.js is the source plus the card
   version map (tools/data-script.js), so a stale map fails here too. */
const BYTE_FILES = ['data.js', 'data.json', 'catalog.csv'];
const expectedBytes = (f) =>
  f === 'data.js' ? builtDataScript(ROOT) : fs.readFileSync(path.join(ROOT, f));

/* Mtime half: newest mtime under app/src/ - excluding every *.test.ts file
   and the whole app/src/test/ directory, neither of which is bundled -
   plus app/public/ (copied verbatim), app/index.html, vite.config.mts and
   app/svelte.config.mjs and the card tools, against the build's index.html, which every build
   rewrites. Safe on CI: checkout sets source mtimes ahead of the build. */
/* The card tools write the built i/ and en/ documents (vite.config.mts appDocuments). */
const CARD_TOOLS = ['share-card.mjs', 'build-share-pages.js', 'app-documents.js'];

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

/** Exits the process, in one sentence, when `dir` is not built or is older
 *  than the tree. `label` is how the message names it (`dist/`). */
function assertBuilt(dir, label) {
  const build = BUILD_OF[path.basename(dir)] ?? 'npm run build';
  const html = path.join(dir, 'index.html');
  if (!fs.existsSync(html)) {
    console.log(label + 'index.html is not built - run ' + build + ' first');
    process.exit(1);
  }
  for (const f of BYTE_FILES) {
    /* The root files are build output too (not committed), so a fresh
       checkout lacks them until node tools/build.js runs. */
    const source = f === 'data.js' ? 'card-versions.json' : f;
    if (!fs.existsSync(path.join(ROOT, source))) {
      console.log(label + ' is stale (' + source + ' is not built) - run ' + build + ' first');
      process.exit(1);
    }
    const copy = path.join(dir, f);
    if (!fs.existsSync(copy)) continue;
    if (!expectedBytes(f).equals(fs.readFileSync(copy))) {
      const what = f === 'data.js' ? 'data.js or card-versions.json' : f;
      console.log(label + ' is stale (byte check, ' + what + ') - run ' + build + ' first');
      process.exit(1);
    }
  }
  const sourceNewest = Math.max(
    newestMtimeUnder(path.join(ROOT, 'app', 'src')),
    newestMtimeUnder(path.join(ROOT, 'app', 'public')),
    fs.statSync(path.join(ROOT, 'app', 'index.html')).mtimeMs,
    fs.statSync(path.join(ROOT, 'vite.config.mts')).mtimeMs,
    fs.statSync(path.join(ROOT, 'app', 'svelte.config.mjs')).mtimeMs,
    ...CARD_TOOLS.map((f) => fs.statSync(path.join(ROOT, 'tools', f)).mtimeMs)
  );
  if (sourceNewest > fs.statSync(html).mtimeMs) {
    console.log(
      label + ' is stale (mtime check, ' + label + 'index.html) - run ' + build + ' first'
    );
    process.exit(1);
  }
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

/* Which path answers the app document. This server stands in for the host, so it
   reads the host's own sources rather than a list of its own: a rule of
   preview/public/_redirects, a card family of preview/public/_routes.json (the
   worker's paths), and the built record and English-root documents under `i/` and
   `en/` (docs/specs/CONTRACTS.md sections 1 and 5). */
const PUBLIC = path.join(ROOT, 'preview', 'public');

/** Returns a matcher of one host pattern: an exact path, or a prefix before a final `*`. */
function patternOf(from) {
  if (!from.endsWith('*')) return (p) => (p === from ? '' : null);
  const head = from.slice(0, -1);
  return (p) => (p.startsWith(head) ? p.slice(head.length) : null);
}

/** The `_redirects` rules in file order: `{ match, to, status }`. */
function readRedirects() {
  return fs
    .readFileSync(path.join(PUBLIC, '_redirects'), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [from = '', to = '', status = '302'] = l.split(/\s+/);
      return { match: patternOf(from), to, status: Number(status) };
    });
}

const CARD_ROUTES = JSON.parse(
  fs.readFileSync(path.join(PUBLIC, '_routes.json'), 'utf8')
).include.map(patternOf);

/** How the host answers a path no file holds: `{ status, location }` for a redirect,
 *  `{ status: 200, doc }` for the app document at `doc` (a path under the root), or
 *  null for a miss. A card family stands in for the worker with the plain document. */
function appAnswer(pathname) {
  for (const rule of readRedirects()) {
    const splat = rule.match(pathname);
    if (splat === null) continue;
    const to = rule.to.replace(':splat', splat);
    return rule.status === 200
      ? { status: 200, doc: to }
      : { status: rule.status, location: to };
  }
  if (CARD_ROUTES.some((m) => m(pathname) !== null)) {
    return { status: 200, doc: pathname.startsWith('/en/') ? '/en/' : '/' };
  }
  return null;
}

const isFile = (file) => fs.existsSync(file) && fs.statSync(file).isFile();

/** A static server over `dir` on a free port of 127.0.0.1: files, `<path>.html` for an
 *  extensionless path and a 308 to the slash form of a folder (as Pages answers), the
 *  app document at the paths the host answers with it, no listing, 404 for anything
 *  else. Port 0, never a fixed one: run-all.js runs the suites in parallel, and each
 *  process gets its own port, so its own origin and storage. */
function serveDist(dir) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const pathname = decodeURIComponent(url.pathname);
    let rel = pathname;
    if (rel.endsWith('/')) rel += 'index.html';
    let file = path.join(dir, rel);
    const inside = file.startsWith(dir + path.sep);
    if (inside && !isFile(file) && isFile(file + '.html')) file += '.html';
    else if (inside && !rel.endsWith('/index.html') && isFile(path.join(file, 'index.html'))) {
      res.writeHead(308, { location: pathname + '/' + url.search }).end();
      return;
    }
    /* Before the extension check: a route path can carry a dot
       (`/tables/eq_weapon/f_tier-2.cls-mag`). */
    if (!isFile(file)) {
      const app = appAnswer(pathname);
      if (app && app.location) {
        res.writeHead(app.status, { location: app.location }).end();
        return;
      }
      if (app) file = path.join(dir, app.doc, 'index.html');
    }
    const type = TYPES[path.extname(file)];
    if (!file.startsWith(dir + path.sep) || !type || !isFile(file)) {
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

module.exports = { assertBuilt, serveDist };
