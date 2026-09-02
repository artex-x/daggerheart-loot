/* The rewrite against the app it replaces, on the same script.
 *
 * Every spec in tests/parity/specs.js is run twice - once on index.html at the
 * repository root, once on the built dist/ - and the two answers are compared.
 * There is no expected value written down anywhere: the live app is the
 * expectation. That is the only definition of "ported correctly" that does not
 * rely on somebody having remembered what the old screen did, and remembering
 * is exactly what failed when the record page shipped without "copy image".
 *
 * What is compared is a *state*, not a route: a URL plus whatever was pressed
 * to get somewhere. A route on its own only ever reaches the first paint, in
 * the default language, at one width, above the fold - which is how a modal
 * four times too wide sat there unreported. No route draws it.
 *
 * Three kinds of finding:
 *   FAIL        - the two apps disagree and nothing says they should
 *   outstanding - a state the rewrite has not reached, or an accepted difference
 *   stale       - an accepted difference that is no longer a difference
 *
 * Needs a build: node tools/build.js && vite build. Without dist/ it says so
 * and stops rather than reporting every state as broken.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { makeDriver, prepare } = require('./parity/driver.js');
const {
  SPECS,
  STATES,
  ACCEPTED,
  VISUAL_DEBT,
  DEBT_SLACK,
  JITTER
} = require('./parity/specs.js');
/* v7 ships as an ES module with a default export; this file is CommonJS. */
const pixelmatch = require('pixelmatch').default ?? require('pixelmatch');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist', 'index.html');
const SHOTS = path.join(ROOT, 'test-output', 'parity');

let fail = 0;
const outstanding = [];
const stale = [];

/* Substrings of the states to run, for paying one debt at a time:
   `node tests/parity.js modal 375`. Empty means all of them. */
const WANTED = process.argv.slice(2);

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

  for (const [id, debt] of Object.entries(VISUAL_DEBT)) {
    if (!debt.why || debt.why.length < 10) {
      console.log(`  FAIL VISUAL_DEBT[${id}] без причины`);
      fail++;
    }
  }

  /* A debt against a state nobody visits is an excuse that can never come due. */
  for (const id of Object.keys(VISUAL_DEBT)) {
    if (!STATES.some((s) => s.id === id)) {
      console.log(`  FAIL VISUAL_DEBT[${id}] - такого состояния нет в STATES`);
      fail++;
    }
  }

  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const pages = {};
  for (const target of ['legacy', 'next']) {
    const p = await browser.newPage();
    await prepare(p);
    pages[target] = makeDriver(p, target);
  }

  for (const state of STATES) {
    const { id, route, why, pending, enter, width, height, whole } = state;
    if (WANTED.length && !WANTED.some((w) => id.includes(w))) continue;
    console.log(`${id}  (${why})`);
    if (pending) {
      outstanding.push(`${id} - ${pending}`);
      continue;
    }

    /* The size is part of the state, so it is set before the page is opened -
       a breakpoint that only runs on load would otherwise be missed. */
    for (const target of ['legacy', 'next']) {
      await pages[target].viewport(width ?? 1100, height ?? 900);
    }

    /** Opens the route and presses whatever this state is reached by. */
    const arrive = async (d) => {
      await d.open(route);
      if (enter) await enter(d);
    };

    const mine = SPECS.filter((s) => !s.only || s.only.includes(id));
    const looks = mine.filter((s) => !s.presses);
    const presses = mine.filter((s) => s.presses);

    /* One arrival for the screenshot and every spec that only looks. Loading a
       page is what this suite spends its time on, and re-loading it between two
       specs that read the same paint buys nothing. A spec that presses gets a
       page of its own, because the one after it would inherit the press. */
    const slug = id.replace(/\W+/g, '_');
    const shots = {};
    const seenLooks = { legacy: {}, next: {} };
    let broke = null;

    for (const target of ['legacy', 'next']) {
      const d = pages[target];
      try {
        await arrive(d);
      } catch (e) {
        broke = `${target}: ${String(e.message || e)}`;
        break;
      }
      const png = await d.shot(whole);
      fs.writeFileSync(path.join(SHOTS, `${slug}-${target}.png`), png);
      shots[target] = png;

      for (const spec of looks) {
        try {
          seenLooks[target][spec.name] = await spec.run(d);
        } catch (e) {
          /* A control the rewrite does not have yet makes the spec throw on one
             side only. That is a difference, and it is reported as one. */
          seenLooks[target][spec.name] = { error: String(e.message || e) };
        }
      }
    }

    if (!broke) {
      for (const spec of looks) {
        diff(id, spec.name, seenLooks.legacy[spec.name], seenLooks.next[spec.name]);
      }

      for (const spec of presses) {
        const seen = {};
        for (const target of ['legacy', 'next']) {
          const d = pages[target];
          try {
            await arrive(d);
            seen[target] = await spec.run(d);
          } catch (e) {
            seen[target] = { error: String(e.message || e) };
          }
        }
        diff(id, spec.name, seen.legacy, seen.next);
      }
    }

    /* The look. Zero unless a debt is recorded against this state, and a debt
       that is no longer owed has to be paid off in the file. */
    {
      if (broke) {
        /* Not reaching the state at all is the loudest kind of difference, and
           silently scoring 100% would read as a styling problem. */
        fail++;
        console.log(`  FAIL ${id} :: вид :: состояние недостижимо - ${broke}`);
        continue;
      }

      const pct = pixelDiff(shots.legacy, shots.next, path.join(SHOTS, `${slug}-diff.png`));
      const debt = VISUAL_DEBT[id];

      if (!debt) {
        if (pct > JITTER) {
          fail++;
          console.log(`  FAIL ${id} :: вид :: ${pct.toFixed(2)}% отличий, ожидался ноль`);
          console.log(`       ${slug}-diff.png; если это осознанно - запиши в VISUAL_DEBT`);
        } else {
          console.log('       вид: совпадает');
        }
      } else if (pct > debt.pct + JITTER) {
        fail++;
        console.log(`  FAIL ${id} :: вид :: ${pct.toFixed(2)}% против долга ${String(debt.pct)}%`);
        console.log(`       стало хуже; ${slug}-diff.png`);
      } else if (pct < debt.pct - DEBT_SLACK) {
        fail++;
        console.log(`  FAIL ${id} :: вид :: ${pct.toFixed(2)}%, долг записан как ${String(debt.pct)}%`);
        console.log('       стало лучше - опусти число в VISUAL_DEBT');
      } else {
        console.log(`       вид: ${pct.toFixed(2)}% из ${String(debt.pct)}% долга`);
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

  if (WANTED.length) console.log(`\nтолько состояния: ${WANTED.join(', ')} - это не полный прогон`);
  console.log(fail ? `\n${fail} расхождений` : '\nрасхождений нет');
  process.exit(fail ? 1 : 0);
})();
