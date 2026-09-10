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
 *
 * One run per tree: writes test-output/parity.lock while it runs and
 * refuses to start over a live one; .claude/hooks/bash-guard.mjs reads
 * the same lock to keep vitest and a second parity off this tree
 * meanwhile. See tests/parity/lock.js.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const { makeDriver, prepare } = require('./parity/driver.js');
const lock = require('./parity/lock.js');
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
const CACHE_DIR = path.join(ROOT, 'test-output', '.parity-cache');

let fail = 0;
const outstanding = [];
const stale = [];

/* `--no-cache` turns the legacy screenshot cache off for this run - both
   reading and writing - so it reproduces a cold run exactly rather than
   quietly warming the cache while pretending not to use it. Everything else
   in argv is a state-name filter, same as before. */
const NO_CACHE = process.argv.includes('--no-cache');

/* `--shard=2/4` runs every fourth state starting at the second, so CI can
   split one 867s run across a job matrix instead of gating every push on it
   whole. Shards partition by index, not by cost, so they are uneven by a
   state or two rather than by wall clock - close enough at four shards, and
   simpler than carrying a weight per state. */
const shardArg = process.argv.find((a) => a.startsWith('--shard='));
const SHARD = shardArg
  ? (() => {
      const m = /^--shard=(\d+)\/(\d+)$/.exec(shardArg);
      const n = m && Number(m[1]);
      const of = m && Number(m[2]);
      if (!n || !of || n < 1 || n > of) {
        throw new Error(`--shard must look like --shard=1/4 (got "${shardArg}")`);
      }
      return { n: n - 1, of };
    })()
  : null;

/* Substrings of the states to run, for paying one debt at a time:
   `node tests/parity.js modal 375`. Empty means all of them. */
const WANTED = process.argv
  .slice(2)
  .filter((a) => a !== '--no-cache' && !a.startsWith('--shard='));

/**
 * Content-addressed cache for the legacy side's screenshots.
 *
 * The static root is frozen by policy (CLAUDE.md forbids touching index.html,
 * app.js and style.css because they are the expectation), so a screenshot of
 * it taken for a given route/enter/viewport is the same PNG every time until
 * one of those inputs changes. Re-shooting it on every run is pure waste - it
 * is one of two page opens per state per language - so it is cached, keyed on
 * a hash of everything that can change the resulting pixels.
 *
 * Only screenshots are cached, not the "look"/"press" spec JSON: those are
 * governed by tests/parity/specs.js, which changes far more often than the
 * frozen app does (part 1 of this batch is about to edit it), and a cache
 * keyed only on the app's own files would silently serve stale JSON across
 * such an edit. Screenshots have no such dependency - what a spec's `run`
 * does with a page afterwards cannot change what the page looked like - so
 * caching only them keeps the guarantee the design asks for: a hit is
 * byte-identical to what an uncached run would have written, so it cannot
 * mask a difference.
 *
 * driver.js *is* hashed in, alongside the app's own files: `ready()`'s wait
 * heuristics, `settle()`'s animation wait and `shot()`'s screenshot options
 * all affect the bytes of the PNG a run produces, unlike specs.js.
 *
 * This file is hashed in too. `arrive()` below - open, enter, language click -
 * decides what actually ends up on the legacy page before it is shot, so an
 * edit to it (the frozen-scrollY anchor fix left for later, for instance)
 * changes the bytes a cached entry stands for exactly as much as an edit to
 * driver.js does. Leaving parity.js out of the key would mean a hit could
 * mask exactly the kind of difference the cache promises never to mask. The
 * cost is that any edit to this file invalidates the whole cache - correct,
 * and cheap next to silently serving stale legacy PNGs.
 */
const CACHE = (() => {
  const hashFile = (h, at) => {
    h.update(path.relative(ROOT, at));
    h.update(fs.readFileSync(at));
  };
  const hashDir = (h, dir) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir).sort()) {
      const at = path.join(dir, name);
      if (fs.statSync(at).isDirectory()) hashDir(h, at);
      else hashFile(h, at);
    }
  };

  /* Everything that can change what a legacy screenshot looks like: the
     frozen root files, the assets they load, and the harness code that
     decides when a page has settled and how it is shot. */
  const rootHash = () => {
    const h = crypto.createHash('sha256');
    for (const f of ['index.html', 'app.js', 'style.css', 'data.js']) {
      hashFile(h, path.join(ROOT, f));
    }
    for (const dir of ['img', 'og', 'card']) hashDir(h, path.join(ROOT, dir));
    hashFile(h, path.join(__dirname, 'parity', 'driver.js'));
    hashFile(h, path.join(__dirname, 'parity.js'));
    return h.digest('hex');
  };

  const ROOT_HASH = NO_CACHE ? null : rootHash();

  /* One key per state x language: everything about *what* was shot, on top of
     the root hash's *what it would look like*. `enter`'s source text stands
     in for "what was pressed to get there" - two states with the same id
     never differ, but the function is defined inline in specs.js and has no
     other identity to hash. */
  const keyFor = (state, lang) =>
    crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          root: ROOT_HASH,
          id: state.id,
          route: state.route,
          enter: state.enter ? state.enter.toString() : null,
          whole: !!state.whole,
          lang,
          widths: WIDTHS,
          storage: state.storage ?? null
        })
      )
      .digest('hex');

  const dirFor = (key) => path.join(CACHE_DIR, key);

  return {
    enabled: !NO_CACHE,
    keyFor,
    read(key, width) {
      if (NO_CACHE) return null;
      const at = path.join(dirFor(key), `${String(width)}.png`);
      return fs.existsSync(at) ? fs.readFileSync(at) : null;
    },
    write(key, width, buf) {
      if (NO_CACHE) return;
      const dir = dirFor(key);
      fs.mkdirSync(dir, { recursive: true });
      const at = path.join(dir, `${String(width)}.png`);
      /* Write to a temp name in the same directory, then rename onto the
         final path. A run killed mid-write (the failure mode that orphaned
         this batch's predecessor) must never leave a truncated PNG that a
         content-addressed cache would then trust forever - rename is atomic,
         a direct write is not. */
      const tmp = path.join(dir, `.${String(width)}.${String(process.pid)}.tmp`);
      fs.writeFileSync(tmp, buf);
      fs.renameSync(tmp, at);
    }
  };
})();

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

  /* Before the wipe, not after: the wipe is the thing a second run must
     not do to a live one. See tests/parity/lock.js. */
  const held = lock.acquire(ROOT, process.argv.slice(2));
  if (!held.ok) {
    console.log(
      `паритет уже идёт в другом процессе (${lock.describe(held.held)}) - дождись его или удали test-output/parity.lock, если тот процесс мёртв`
    );
    process.exit(1);
  }
  process.on('exit', () => lock.release(ROOT));

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

  for (const [stateIdx, state] of STATES.entries()) {
    lock.touch(ROOT); /* Heartbeat: a full run outlives a fixed TTL, a crashed one must not. */
    if (SHARD && stateIdx % SHARD.of !== SHARD.n) continue;
    const { id, route, why, pending, enter, whole, storage } = state;
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
        if (storage) await d.seed(storage);
        await d.open(route);
        if (enter) await enter(d);
        if (lang !== 'ru') await d.click(lang.toUpperCase());
      };

      const wanted = WIDTHS.map((s) => `${id} @ ${lang} ${String(s.w)}`).some(
        (full) => !WANTED.length || WANTED.some((w) => full.includes(w))
      );
      if (!wanted) continue;

      const mine = SPECS.filter((s) => !s.only || s.only.includes(id));
      const looks = mine.filter((s) => !s.presses && !s.perWidth);
      const presses = mine.filter((s) => s.presses);
      /* `perWidth` specs measure a control rather than a page, so they cannot
         read the widest layout and call it done - the row-width defect only
         showed at 375. They run inside the width sweep below, once per size,
         on both targets. */
      const measured = mine.filter((s) => s.perWidth);

      /* The specs read the widest layout: they are about content and controls,
         which the breakpoints do not change, and running them six times would
         triple the run for six identical answers. The pixels are what varies
         with width, so that is what the widths are for. */
      const shots = {};
      const seenLooks = { legacy: {}, next: {} };
      const perWidth = { legacy: {}, next: {} };
      let broke = null;

      const cacheKey = CACHE.keyFor(state, lang);

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
             them off disk anyway, and nothing is held while the next is made.
             The legacy side checks the cache first - a hit is the exact bytes
             an uncached shot would have produced, so skipping the viewport
             switch, the settle wait and the screenshot itself cannot change
             the verdict, only how long it takes to reach it.
             A state that carries a `measured` spec cannot take that shortcut:
             the cache stands in for the viewport switch too, and a `perWidth`
             spec has to read the page actually sized to that width, not the
             1100 layout the cached path leaves it at. So caching is off for
             the handful of states typeRuns names, on both sides. */
          for (const size of WIDTHS) {
            const at = path.join(SHOTS, `${slugOf(id, lang, size.w)}-${target}.png`);
            const cached =
              target === 'legacy' && !measured.length ? CACHE.read(cacheKey, size.w) : null;
            if (cached) {
              fs.writeFileSync(at, cached);
            } else {
              await d.viewport(size.w, size.h);
              await d.settle();
              if (measured.length) {
                perWidth[target][size.w] = {};
                for (const spec of measured) {
                  try {
                    perWidth[target][size.w][spec.name] = await spec.run(d, lang);
                  } catch (e) {
                    perWidth[target][size.w][spec.name] = { error: String(e.message || e) };
                  }
                }
              }
              const buf = await d.shot(whole);
              fs.writeFileSync(at, buf);
              if (target === 'legacy' && !measured.length) CACHE.write(cacheKey, size.w, buf);
            }
            shots[target][size.w] = at;
          }
        });
        if (broke) break;
      }

      if (!broke) {
        for (const spec of looks) {
          diff(`${id} @ ${lang}`, spec.name, seenLooks.legacy[spec.name], seenLooks.next[spec.name]);
        }

        /* Keyed with the width in the route, unlike `looks` above: a
           `perWidth` spec answers a different question at each size, so
           `#/tables/community @ ru 375 :: ... :: rowText` and its 1100
           counterpart are two separate fields, not one read three times. */
        for (const size of WIDTHS) {
          for (const spec of measured) {
            diff(
              `${id} @ ${lang} ${String(size.w)}`,
              spec.name,
              perWidth.legacy[size.w]?.[spec.name],
              perWidth.next[size.w]?.[spec.name]
            );
          }
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
        } else if (pct <= JITTER && debt.pct > JITTER) {
          /* DEBT_SLACK alone left a hole: an entry recorded at, say, 0.13
             sits inside half a percent of 0.00 forever, so a state that has
             actually reached zero never has to say so - it passes silently,
             which is the same failure this whole batch is about, on the debt
             table instead of the screen. A paid-off entry has to fail until
             somebody deletes it. */
          fail++;
          console.log(
            `  FAIL ${full} :: вид :: ${pct.toFixed(2)}%, долг записан как ${String(debt.pct)}%`
          );
          console.log('       долг погашен - удали запись из VISUAL_DEBT');
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
  if (SHARD) console.log(`шард ${String(SHARD.n + 1)}/${String(SHARD.of)} - это не полный прогон`);
  console.log(fail ? `\n${fail} расхождений` : '\nрасхождений нет');
  process.exit(fail ? 1 : 0);
})();
