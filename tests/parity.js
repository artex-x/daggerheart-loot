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
  LANGS,
  WIDTHS,
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

/** The file name a state's screenshots and diff are written under. */
const slugOf = (id, lang, width) => `${id} @ ${lang} ${String(width)}`.replace(/\W+/g, '_');

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

  for (const [id, debt] of Object.entries(VISUAL_DEBT)) {
    if (!debt.why || debt.why.length < 10) {
      console.log(`  FAIL VISUAL_DEBT[${id}] без причины`);
      fail++;
    }
  }

  /* A debt against a state nobody visits is an excuse that can never come due. */
  const everyState = new Set(
    STATES.filter((s) => !s.pending).flatMap((s) =>
      LANGS.flatMap((lang) => WIDTHS.map((size) => `${s.id} @ ${lang} ${String(size.w)}`))
    )
  );
  for (const id of Object.keys(VISUAL_DEBT)) {
    if (!everyState.has(id)) {
      console.log(`  FAIL VISUAL_DEBT[${id}] - такого состояния нет в STATES`);
      fail++;
    }
  }

  fs.rmSync(SHOTS, { recursive: true, force: true });
  fs.mkdirSync(SHOTS, { recursive: true });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  /* One page at a time, not two kept open.
   *
   * Both apps loaded at once, each holding a record page's artwork, was enough
   * to have Chrome killed part-way through a screenshot on a two-core machine -
   * and a browser that dies mid-run reports every state after it as a failure
   * of the port. It also makes the isolation total: a state cannot inherit
   * anything, because the page it ran in no longer exists. */
  const pressed = new Set();
  const seen = new Map();

  const withPage = async (target, fn) => {
    const p = await browser.newPage();
    await prepare(p);
    const d = makeDriver(p, target);
    try {
      return await fn(d);
    } finally {
      for (const n of d.pressed) pressed.add(n);
      for (const [route, names] of d.seen) {
        const at = seen.get(route) ?? new Set();
        for (const n of names) at.add(n);
        seen.set(route, at);
      }
      await p.close();
    }
  };

  for (const state of STATES) {
    const { id, route, why, pending, enter, whole } = state;
    if (pending) {
      if (!WANTED.length || WANTED.some((w) => id.includes(w))) {
        console.log(`${id}  (${why})`);
        outstanding.push(`${id} - ${pending}`);
      }
      continue;
    }

    for (const lang of LANGS) {
      /* One arrival per language, and the widths swept inside it. The
         breakpoints are CSS and need no reload; the language is a press, and
         pressing it after `enter` rather than before keeps every `enter` step
         written in one language - the names it grips are Russian. */
      const arrive = async (d) => {
        await d.open(route);
        if (enter) await enter(d);
        if (lang !== 'ru') await d.click(lang.toUpperCase());
      };

      const wanted = WIDTHS.map((s) => `${id} @ ${lang} ${String(s.w)}`).some(
        (full) => !WANTED.length || WANTED.some((w) => full.includes(w))
      );
      if (!wanted) continue;

      const mine = SPECS.filter((s) => !s.only || s.only.includes(id));
      const looks = mine.filter((s) => !s.presses);
      const presses = mine.filter((s) => s.presses);

      /* The specs read the widest layout: they are about content and controls,
         which the breakpoints do not change, and running them six times would
         triple the run for six identical answers. The pixels are what varies
         with width, so that is what the widths are for. */
      const shots = {};
      const seenLooks = { legacy: {}, next: {} };
      let broke = null;

      for (const target of ['legacy', 'next']) {
        shots[target] = {};
        // eslint-disable-next-line no-await-in-loop
        await withPage(target, async (d) => {
          try {
            await d.viewport(WIDTHS[0].w, WIDTHS[0].h);
            await arrive(d);
          } catch (e) {
            broke = `${target}: ${String(e.message || e)}`;
            return;
          }

          for (const spec of looks) {
            try {
              seenLooks[target][spec.name] = await spec.run(d, lang);
            } catch (e) {
              /* A control the rewrite does not have yet makes the spec throw
                 on one side only. That is a difference, reported as one. */
              seenLooks[target][spec.name] = { error: String(e.message || e) };
            }
          }

          /* What this route offers, for the coverage report. Off the live app
             only: it is the one that has everything. */
          if (target === 'legacy') d.note(route, await d.controls());

          /* Written as they are taken rather than collected: the diff reads
             them off disk anyway, and nothing is held while the next is made. */
          for (const size of WIDTHS) {
            await d.viewport(size.w, size.h);
            await d.settle();
            const at = path.join(SHOTS, `${slugOf(id, lang, size.w)}-${target}.png`);
            fs.writeFileSync(at, await d.shot(whole));
            shots[target][size.w] = at;
          }
        });
        if (broke) break;
      }

      if (!broke) {
        for (const spec of looks) {
          diff(`${id} @ ${lang}`, spec.name, seenLooks.legacy[spec.name], seenLooks.next[spec.name]);
        }

        for (const spec of presses) {
          const got = {};
          for (const target of ['legacy', 'next']) {
            // eslint-disable-next-line no-await-in-loop
            await withPage(target, async (d) => {
              try {
                await d.viewport(WIDTHS[0].w, WIDTHS[0].h);
                await arrive(d);
                got[target] = await spec.run(d, lang);
              } catch (e) {
                got[target] = { error: String(e.message || e) };
              }
            });
          }
          diff(`${id} @ ${lang}`, spec.name, got.legacy, got.next);
        }
      }

      for (const size of WIDTHS) {
        const full = `${id} @ ${lang} ${String(size.w)}`;
        if (WANTED.length && !WANTED.some((w) => full.includes(w))) continue;
        console.log(`${full}  (${why})`);

        if (broke) {
          /* Not reaching the state at all is the loudest kind of difference,
             and silently scoring 100% would read as a styling problem. */
          fail++;
          console.log(`  FAIL ${full} :: вид :: состояние недостижимо - ${broke}`);
          continue;
        }

        const slug = slugOf(id, lang, size.w);
        const pct = pixelDiff(
          fs.readFileSync(shots.legacy[size.w]),
          fs.readFileSync(shots.next[size.w]),
          path.join(SHOTS, `${slug}-diff.png`)
        );
        const debt = VISUAL_DEBT[full];

        if (!debt) {
          if (pct > JITTER) {
            fail++;
            console.log(`  FAIL ${full} :: вид :: ${pct.toFixed(2)}% отличий, ожидался ноль`);
            console.log(`       ${slug}-diff.png; если это осознанно - запиши в VISUAL_DEBT`);
          } else {
            console.log('       вид: совпадает');
          }
        } else if (pct > debt.pct + JITTER) {
          fail++;
          console.log(`  FAIL ${full} :: вид :: ${pct.toFixed(2)}% против долга ${String(debt.pct)}%`);
          console.log(`       стало хуже; ${slug}-diff.png`);
        } else if (pct < debt.pct - DEBT_SLACK) {
          fail++;
          console.log(
            `  FAIL ${full} :: вид :: ${pct.toFixed(2)}%, долг записан как ${String(debt.pct)}%`
          );
          console.log('       стало лучше - опусти число в VISUAL_DEBT');
        } else {
          console.log(`       вид: ${pct.toFixed(2)}% из ${String(debt.pct)}% долга`);
        }
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

  /* How much of the app the states actually exercise.
   *
   * A control that is only ever seen is compared as a name in a list, and in
   * no other way - whatever it does is unported until something presses it. So
   * this is the number to drive down, and it is measured rather than felt.
   * Chrome that repeats on every route is counted once and named separately:
   * pressing the same tab from twelve routes proves nothing twelve times. */
  {
    const chrome = new Set([
      'RU',
      'EN',
      'ЛутDaggerheart',
      'daggerheart.com',
      'Wondrous',
      'Dread',
      'Vault of Ages',
      /* Russian */
      'К содержимому',
      'Обычные правила',
      'Альт. таблицы',
      'Сообщества',
      'Таблицы',
      'Списки',
      'Поиск',
      /* and the same frame in English, which is a separate set of names */
      'Skip to content',
      'Standard rules',
      'Alt. tables',
      'Communities',
      'Tables',
      'Lists',
      'Search'
    ]);
    const missed = new Map();
    let total = 0;
    for (const [route, names] of seen) {
      const left = [...names].filter((n) => !chrome.has(n) && !pressed.has(n));
      total += names.size;
      if (left.length) missed.set(route, left);
    }
    if (total) {
      const untouched = [...missed.values()].reduce((n, l) => n + l.length, 0);
      console.log(
        `\nнажато ${String(pressed.size)} из ${String(total)} названий; не нажато ${String(untouched)} (не считая общей рамки):`
      );
      for (const [route, left] of missed) console.log(`  ${route}: ${left.join(', ')}`);
    }
  }

  if (WANTED.length) console.log(`\nтолько состояния: ${WANTED.join(', ')} - это не полный прогон`);
  console.log(fail ? `\n${fail} расхождений` : '\nрасхождений нет');
  process.exit(fail ? 1 : 0);
})();
