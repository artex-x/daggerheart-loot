/* A built directory, checked and served. Two callers, two directories:
 * tests/app/lib.js drives `dist-test/` (the test build, fake cloud on) and
 * tools/smoke-http.mjs drives `dist/` (what is published) - so the guard and
 * the server take the directory rather than guarding one at require time. */
const fs = require('fs');
const http = require('http');
const path = require('path');

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
   `npm run data` writes. */
const BYTE_FILES = ['data.js', 'data.json', 'catalog.csv'];

/* Mtime half: newest mtime under app/src/ - excluding every *.test.ts file
   and the whole app/src/test/ directory, neither of which is bundled -
   plus app/public/ (copied verbatim), app/index.html, vite.config.mts and
   app/svelte.config.mjs, against the build's index.html, which every build
   rewrites. Safe on CI: checkout sets source mtimes ahead of the build. */
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
    const copy = path.join(dir, f);
    if (!fs.existsSync(copy)) continue;
    if (!fs.readFileSync(path.join(ROOT, f)).equals(fs.readFileSync(copy))) {
      console.log(label + ' is stale (byte check, ' + f + ') - run ' + build + ' first');
      process.exit(1);
    }
  }
  const sourceNewest = Math.max(
    newestMtimeUnder(path.join(ROOT, 'app', 'src')),
    newestMtimeUnder(path.join(ROOT, 'app', 'public')),
    fs.statSync(path.join(ROOT, 'app', 'index.html')).mtimeMs,
    fs.statSync(path.join(ROOT, 'vite.config.mts')).mtimeMs,
    fs.statSync(path.join(ROOT, 'app', 'svelte.config.mjs')).mtimeMs
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

/** A static server over `dir` on a free port of 127.0.0.1: files only, no
 *  listing, 404 for anything else. Port 0, never a fixed one: run-all.js runs
 *  the suites in parallel, and each process gets its own port, so its own
 *  origin and storage. */
function serveDist(dir) {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(dir, rel);
    const type = TYPES[path.extname(file)];
    if (!file.startsWith(dir + path.sep) || !type || !fs.existsSync(file)) {
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
