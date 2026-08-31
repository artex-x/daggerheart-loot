/* The rewrite against the app it replaces, on the same script.
 *
 * Every spec in tests/parity/specs.js is run twice - once on index.html at the
 * repository root, once on the built dist/ - and the two answers are compared.
 * There is no expected value written down anywhere: the live app is the
 * expectation. That is the only definition of "ported correctly" that does not
 * rely on somebody having remembered what the old screen did, and remembering
 * is exactly what failed when the record page shipped without "copy image".
 *
 * Three kinds of finding:
 *   FAIL        - the two apps disagree and nothing says they should
 *   outstanding - a route the rewrite has not reached, or an accepted difference
 *   stale       - an accepted difference that is no longer a difference
 *
 * Needs a build: node tools/build.js && vite build. Without dist/ it says so
 * and stops rather than reporting every route as broken.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { makeDriver, prepare } = require('./parity/driver.js');
const { SPECS, ROUTES, ACCEPTED, PIXEL_BUDGET } = require('./parity/specs.js');
/* v7 ships as an ES module with a default export; this file is CommonJS. */
const pixelmatch = require('pixelmatch').default ?? require('pixelmatch');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist', 'index.html');
const SHOTS = path.join(ROOT, 'test-output', 'parity');

let fail = 0;
const outstanding = [];
const stale = [];

const show = (v) => {
  const s = JSON.stringify(v);
  return s === undefined ? 'undefined' : s.length > 140 ? s.slice(0, 137) + '...' : s;
};

/** Compares two observations field by field, so a report names what differed. */
function diff(route, spec, was, now) {
  const keys = [...new Set([...Object.keys(was), ...Object.keys(now)])].sort();
  for (const k of keys) {
    const key = `${route} :: ${spec} :: ${k}`;
    const same = JSON.stringify(was[k]) === JSON.stringify(now[k]);
    const excuse = ACCEPTED[key];

    if (same && excuse) {
      stale.push(key);
      continue;
    }
    if (same) continue;
    if (excuse) {
      outstanding.push(`${key} - ${excuse}`);
      continue;
    }

    fail++;
    console.log(`  FAIL ${key}`);
    console.log(`       было:  ${show(was[k])}`);
    console.log(`       стало: ${show(now[k])}`);
  }
}

/**
 * How much of the screen differs, and a picture of where.
 *
 * pixelmatch rather than a hand-rolled comparison: it does the perceptual
 * colour distance and the antialiasing detection properly, which is the
 * difference between a number that tracks real change and one that drifts with
 * font rendering. The diff image is the point - a percentage says how bad, the
 * picture says what.
 *
 * Pages of different heights are compared over the taller of the two, so a
 * screen that grew does not score well by having less to disagree about.
 */
function pixelDiff(aBuf, bBuf, outPath) {
  const a = PNG.sync.read(aBuf);
  const b = PNG.sync.read(bBuf);
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);

  /* On to a common canvas, so mismatched sizes are a difference rather than a
     crash. Anything outside a picture stays transparent and reads as changed. */
  const pad = (src) => {
    const out = new PNG({ width, height });
    PNG.bitblt(src, out, 0, 0, Math.min(src.width, width), Math.min(src.height, height), 0, 0);
    return out;
  };
  const A = pad(a);
  const B = pad(b);
  const diff = new PNG({ width, height });

  const changed = pixelmatch(A.data, B.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: false
  });
  fs.writeFileSync(outPath, PNG.sync.write(diff));
  return (100 * changed) / (width * height);
}

(async () => {
  if (!fs.existsSync(DIST)) {
    console.log('dist/index.html не собран - сначала vite build');
    process.exit(1);
  }

  /* The build emits the application, not the artwork: img/, og/, card/ and i/
     are served from the repository root today and have to be laid alongside
     dist/ at the cut-over (Phase 6). Until that is wired up, link them here -
     otherwise every screenshot is dominated by a picture that failed to load
     and the number measures the harness rather than the port. */
  for (const dir of ['img', 'og', 'card']) {
    const at = path.join(ROOT, 'dist', dir);
    if (!fs.existsSync(at)) fs.symlinkSync(path.join(ROOT, dir), at, 'dir');
  }

  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const pages = {};
  for (const target of ['legacy', 'next']) {
    const p = await browser.newPage();
    await p.setViewport({ width: 1100, height: 900 });
    await prepare(p);
    pages[target] = makeDriver(p, target);
  }

  for (const { route, why, pending } of ROUTES) {
    console.log(`${route}  (${why})`);
    if (pending) {
      outstanding.push(`${route} - ${pending}`);
      continue;
    }

    for (const spec of SPECS) {
      if (spec.only && !spec.only.includes(route)) continue;

      const seen = {};
      for (const target of ['legacy', 'next']) {
        const d = pages[target];
        await d.open(route);
        try {
          seen[target] = await spec.run(d);
        } catch (e) {
          /* A control the rewrite does not have yet makes the spec throw on one
             side only. That is a difference, and it is reported as one. */
          seen[target] = { error: String(e.message || e) };
        }
      }
      diff(route, spec.name, seen.legacy, seen.next);
    }

    /* The look, as a number and as two pictures to compare by eye. */
    const budget = PIXEL_BUDGET[route];
    if (budget !== undefined) {
      const slug = route.replace(/\W+/g, '_');
      const shots = {};
      for (const target of ['legacy', 'next']) {
        await pages[target].open(route);
        const png = await pages[target].shot();
        fs.writeFileSync(path.join(SHOTS, `${slug}-${target}.png`), png);
        shots[target] = png;
      }
      const pct = pixelDiff(shots.legacy, shots.next, path.join(SHOTS, `${slug}-diff.png`));
      if (pct > budget) {
        fail++;
        console.log(`  FAIL ${route} :: the look :: ${pct.toFixed(1)}% differs, budget ${String(budget)}%`);
        console.log('       снимки в test-output/parity/');
      } else {
        console.log(`       вид: ${pct.toFixed(1)}% из ${String(budget)}%`);
      }
    }
  }

  await browser.close();

  if (outstanding.length) {
    console.log(`\nещё не перенесено (${outstanding.length}):`);
    for (const o of outstanding) console.log('  - ' + o);
  }
  if (stale.length) {
    fail += stale.length;
    console.log('\nразличий больше нет, убери из ACCEPTED:');
    for (const s of stale) console.log('  - ' + s);
  }

  console.log(fail ? `\n${fail} расхождений` : '\nрасхождений нет');
  process.exit(fail ? 1 : 0);
})();
