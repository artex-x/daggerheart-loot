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
const { readPNG } = require('./lib.js');

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
 * How much of the screen differs, as a percentage of sampled pixels.
 *
 * Every second pixel, by brightness rather than by channel: antialiasing and
 * subpixel text move colour around by a little everywhere, and a strict
 * comparison would report that as a difference on every run.
 */
function pixelDiff(a, b) {
  const w = Math.min(a.w, b.w);
  const h = Math.min(a.h, b.h);
  let differ = 0;
  let seen = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (Math.abs(a.lum(x, y) - b.lum(x, y)) > 12) differ++;
      seen++;
    }
  }
  /* Pages of different heights differ below the shorter one by definition. */
  const missed = Math.abs(a.h - b.h) / Math.max(a.h, b.h);
  return seen ? (100 * differ) / seen + 100 * missed : 100;
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
      const shots = {};
      for (const target of ['legacy', 'next']) {
        await pages[target].open(route);
        const png = await pages[target].shot();
        fs.writeFileSync(path.join(SHOTS, `${route.replace(/\W+/g, '_')}-${target}.png`), png);
        shots[target] = readPNG(png);
      }
      const pct = pixelDiff(shots.legacy, shots.next);
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
