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
const { SPECS, ROUTES, ACCEPTED } = require('./parity/specs.js');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist', 'index.html');

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

(async () => {
  if (!fs.existsSync(DIST)) {
    console.log('dist/index.html не собран - сначала vite build');
    process.exit(1);
  }

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
