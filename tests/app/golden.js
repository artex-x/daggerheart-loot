/* Structural text goldens: one file per state in tests/app/inventory.js,
 * both languages inside it, an accessibility-tree snapshot plus the control
 * inventory `tests/app/lib.js`'s driver already knows how to read.
 *
 * It compares dist/ against nothing but its own last committed shape. "Is
 * anything missing or renamed since the commit that seeded this file?" is a
 * question a pixel diff answers by accident and a text diff answers on
 * purpose - a renamed button or a dropped landmark is a line in `git diff`,
 * not a percentage. See issue 47, plan.md, "R0a planned: the evidence, the
 * sweep, and the structural goldens", Decided 1-2, for the format and the
 * normalisation rules, and "Decided 1, revised: what a golden captures for
 * the largest states" for rule A, rule B and sharding - this file implements
 * both exactly and does not repeat the reasoning.
 *
 * Usage:
 *   node tests/app/golden.js                 compare every state, unchanged
 *   node tests/app/golden.js --update        (re)write every selected file
 *   node tests/app/golden.js --only=<sub>     narrow to matching state ids
 *   node tests/app/golden.js --shard=2/4      every fourth state, offset 2
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { STATES } = require('./inventory.js');

const DIR = path.join(__dirname, 'snapshots');
const WIDTH = 1100;
const HEIGHT = 900;

const UPDATE = process.argv.includes('--update');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice('--only='.length) : null;

/* `--shard=2/4` runs every fourth state starting at the second - the
 * `stateIdx % of !== n` interleave (ported from the deleted parity harness,
 * issue 47), which spreads the ~7s `#/tables*` arrivals evenly instead of
 * piling them into one shard. */
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

/** The file name a state's golden is written under - `parity.js:208`'s own
 *  rule, so a state id and its golden's basename always agree by eye. */
const slugOf = (id) => id.replace(/\W+/g, '_');

/* ---------- normalisation (plan.md, "R0a planned", Decided 1) ---------- */

/* Kept, in this fixed order, after role and name. elementHandle,
 * backendNodeId and loaderId are poison - a per-run function/id/uuid that
 * fails a golden's own second run - and are dropped by construction: nothing
 * below ever reads them off the node. */
const KEEP_KEYS = [
  'value',
  'description',
  'keyshortcuts',
  'roledescription',
  'valuetext',
  'url',
  'disabled',
  'expanded',
  'focused',
  'modal',
  'multiline',
  'multiselectable',
  'readonly',
  'required',
  'selected',
  'checked',
  'pressed',
  'level',
  'valuemin',
  'valuemax',
  'autocomplete',
  'haspopup',
  'invalid',
  'orientation'
];

const collapse = (s) => (s || '').replace(/\s+/g, ' ');

/** Cuts a `file://.../dist/index.html#...` url down to the hash a golden can
 *  survive a clone with. A url with no such substring - a real outbound link
 *  like daggerheart.com - is content worth seeing change, and is kept whole. */
function normUrl(u) {
  const marker = '/dist/index.html';
  const i = u.lastIndexOf(marker);
  return i < 0 ? u : u.slice(i + marker.length);
}

/**
 * Turns a raw `accessibility.snapshot()` node into `{role, name, attrs,
 * children}`, recursively - `attrs` is an ordered `[key, value]` list in
 * `KEEP_KEYS`'s fixed order, `url` already cut to its hash.
 *
 * Rule 3 (Decided 1, unchanged) runs here, first, as a tree transform: a
 * StaticText child that is the only child, has no children of its own, and
 * whose name equals its parent's is dropped - the exact shape of a joined
 * text node, kept apart from the split-text-node signal two or more
 * StaticText children carry (`CLAUDE.md`, "port the live app's text-node
 * structure"). Order matters (Decided 1, revised): a signature (below) is
 * computed on this already-cleaned tree, never on the raw one - computing it
 * first would group a joined text node with a split one.
 */
function clean(node) {
  const name = collapse(node.name);
  const attrs = [];
  for (const k of KEEP_KEYS) {
    if (node[k] === undefined) continue;
    const v = k === 'url' && typeof node[k] === 'string' ? normUrl(node[k]) : node[k];
    attrs.push([k, String(v)]);
  }
  let rawChildren = node.children || [];
  if (
    rawChildren.length === 1 &&
    rawChildren[0].role === 'StaticText' &&
    !(rawChildren[0].children && rawChildren[0].children.length) &&
    collapse(rawChildren[0].name) === name
  ) {
    rawChildren = [];
  }
  return { role: node.role, name, attrs, children: rawChildren.map(clean) };
}

/* ---------- rule A: same-shape sibling elision (Decided 1, revised) ---------- */

/** Names are excluded at every depth; attribute VALUES are not - two rows
 *  differ in their signature the moment anything but their text differs, so
 *  a row doing something different is never folded into a run of rows that
 *  are not. Computed on the already-`clean`ed tree. */
function sigOf(n) {
  const attrStr = n.attrs.map(([k, v]) => `${k}=${v}`).join(',');
  const kids = n.children.map(sigOf).join(',');
  return n.role + '|' + attrStr + '|(' + kids + ')';
}

/**
 * Groups `children` by `sigOf` **across the whole list, not by consecutive
 * run** (a table row is a `checkbox` and a `button` at the same depth with
 * no wrapper, so the sequence alternates and run-detection would see runs of
 * one). A signature occurring 5 times or fewer is emitted whole; otherwise
 * the first two and the last two occurrences are kept in their original
 * positions, and one summary line is written at the position of the first
 * occurrence that is not kept - once per signature per parent.
 *
 * Returns `{ keep, summaryAt }`: `keep[i]` is false for an elided index;
 * `summaryAt` maps an index to `{ role, total }` for the one line to print
 * there, immediately before that index's node (or in its place, since an
 * elided node prints nothing of its own).
 */
function elisionOf(children) {
  const sigs = children.map(sigOf);
  const bySig = new Map();
  sigs.forEach((sig, i) => {
    if (!bySig.has(sig)) bySig.set(sig, []);
    bySig.get(sig).push(i);
  });

  const keep = new Array(children.length).fill(true);
  const summaryAt = new Map();
  for (const [sig, idxs] of bySig) {
    if (idxs.length <= 5) continue;
    const keepIdx = new Set([...idxs.slice(0, 2), ...idxs.slice(-2)]);
    let firstElided = null;
    for (const idx of idxs) {
      if (keepIdx.has(idx)) continue;
      keep[idx] = false;
      if (firstElided === null) firstElided = idx;
    }
    summaryAt.set(firstElided, { role: sig.slice(0, sig.indexOf('|')), total: idxs.length });
  }
  return { keep, summaryAt };
}

/* ---------- rule B: a cap on every accessible name (Decided 1, revised) ---------- */

/**
 * `namelen`/`namehash` are appended after Decided 1's fixed key order, and
 * appear only when the cap fires, so an uncapped line is byte-identical to
 * what rule B does not touch. The hash is over the *whole* collapsed name,
 * which is what makes the rule fail-closed - truncating past position 64
 * changes it. Code points, not UTF-16 units, so a surrogate pair never
 * splits.
 */
function capName(name) {
  const cps = [...name];
  if (cps.length <= 64) return { text: name, capped: false };
  return {
    text: cps.slice(0, 64).join('') + '...',
    capped: true,
    namelen: cps.length,
    namehash: crypto.createHash('sha1').update(name, 'utf8').digest('hex').slice(0, 8)
  };
}

/** One node's own line, both rules already applied: the name capped (rule
 *  B), the attrs in fixed order with `namelen`/`namehash` appended only when
 *  the cap fired. */
function lineFor(n, depth) {
  const cap = capName(n.name);
  const parts = n.attrs.map(([k, v]) => `${k}=${v}`);
  if (cap.capped) parts.push(`namelen=${String(cap.namelen)}`, `namehash=${cap.namehash}`);
  const bracket = parts.length ? ` [${parts.join(' ')}]` : '';
  return '  '.repeat(depth) + n.role + ' "' + cap.text + '"' + bracket;
}

/** A `## <lang> :: controls` entry, rule B applied - bare text, matching
 *  that section's existing no-quotes shape, with the same bracket suffix
 *  the tree lines carry when the cap fires. */
function controlLine(name) {
  const cap = capName(name);
  if (!cap.capped) return cap.text;
  return `${cap.text} [namelen=${String(cap.namelen)} namehash=${cap.namehash}]`;
}

/** Depth-first: this node's own line, then rule A's grouping over its
 *  (already-cleaned) children. */
function serializeTree(n, depth, out) {
  out.push(lineFor(n, depth));
  if (!n.children.length) return;
  const { keep, summaryAt } = elisionOf(n.children);
  n.children.forEach((child, i) => {
    if (summaryAt.has(i)) {
      const { role, total } = summaryAt.get(i);
      out.push('  '.repeat(depth + 1) + `... ${role} x${String(total - 4)} of ${String(total)} same-shape siblings elided`);
    }
    if (!keep[i]) return;
    serializeTree(child, depth + 1, out);
  });
}

/* ---------- comparison ---------- */

/** The lines before the first `## ` heading - `render()`'s `# <id>`,
 *  `# route:` and `# why:` lines. `sectionsOf` only ever collects lines
 *  after a `## ` heading, so without this the header is never compared and
 *  an `inventory.js` route/why edit made without `--update` leaves a golden
 *  whose header silently disagrees with the state it gates. */
function headerOf(text) {
  const out = [];
  for (const line of text.split('\n')) {
    if (/^## /.test(line)) break;
    out.push(line);
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  return out;
}

function sectionsOf(text) {
  const out = {};
  let cur = null;
  for (const line of text.split('\n')) {
    const m = /^## (.+)$/.exec(line);
    if (m) {
      cur = m[1];
      out[cur] = [];
      continue;
    }
    if (cur) out[cur].push(line);
  }
  for (const k of Object.keys(out)) {
    while (out[k].length && out[k][out[k].length - 1] === '') out[k].pop();
  }
  return out;
}

const SECTIONS = ['ru :: tree', 'ru :: controls', 'en :: tree', 'en :: controls'];

/** Strict string equality per section. One failure per section, not per
 *  line - a renamed heading must not print four hundred lines - naming the
 *  1-based line number of the first difference and two lines of context on
 *  each side, which is what a session actually needs to find the
 *  regression without opening the file. `ok` is taken as a parameter (not a
 *  module-level closure) so this function has no dependency on lib.js/
 *  puppeteer and can run under `node --test` against plain strings. */
function compareGolden(id, wantText, gotText, ok) {
  const wantHeader = headerOf(wantText);
  const gotHeader = headerOf(gotText);
  if (wantHeader.join('\n') !== gotHeader.join('\n')) {
    ok(
      false,
      `${id} :: header: diverges\n` +
        `       want: ${JSON.stringify(wantHeader)}\n` +
        `       got:  ${JSON.stringify(gotHeader)}`
    );
  }
  const want = sectionsOf(wantText);
  const got = sectionsOf(gotText);
  for (const name of SECTIONS) {
    const w = want[name] || [];
    const g = got[name] || [];
    if (w.join('\n') === g.join('\n')) continue;
    const max = Math.max(w.length, g.length);
    let at = max;
    for (let i = 0; i < max; i++) {
      if (w[i] !== g[i]) {
        at = i;
        break;
      }
    }
    const ctx = (arr) => arr.slice(Math.max(0, at - 2), at + 1);
    ok(
      false,
      `${id} :: ${name}: diverges starting at line ${at + 1}\n` +
        `       want: ${JSON.stringify(ctx(w))}\n` +
        `       got:  ${JSON.stringify(ctx(g))}`
    );
  }
}

/* ---------- exports ----------
 * Only the pure, DOM/browser-free half: normalisation, rule A/B, the
 * header/section split and the comparison itself. `golden.test.mjs` runs
 * these under `node --test` against plain strings - no dist/, no puppeteer.
 * `require('./lib.js')` (which checks dist/ exists and requires puppeteer)
 * is deliberately kept out of this module's top level so requiring golden.js
 * for its pure half never trips either. */
module.exports = {
  KEEP_KEYS,
  collapse,
  normUrl,
  clean,
  sigOf,
  elisionOf,
  capName,
  lineFor,
  controlLine,
  serializeTree,
  headerOf,
  sectionsOf,
  compareGolden,
  slugOf
};

/* ---------- main (require.main only - this is where lib.js/puppeteer come in) ---------- */

if (require.main === module) {
  const { fresh, reporter, closeBrowser } = require('./lib.js');
  const rep = reporter();
  const { ok } = rep;

  /* ---------- arrival (plan.md, "R0a planned", Decided 2) ---------- */

  const captureLang = async (page, d) => {
    const snap = await page.accessibility.snapshot();
    const tree = [];
    serializeTree(clean(snap), 0, tree);
    const controls = (await d.controls()).map(controlLine);
    return { tree, controls };
  };

  /** Polls for the toast a `timed` state's `enter` raised. Since B8's D1
   *  (the blanket reduced-motion kill) the toast's own entrance transition is
   *  one of the stays this app turns off too, so under the driver's emulated
   *  reduced motion it is up within a frame of the click that raised it -
   *  which makes this poll cheap, not wrong: it is still the assertion in
   *  place of the coin flip a fixed pause would be, for a machine slow enough
   *  that even that frame is not guaranteed. */
  const waitForToast = async (page, id, lang) => {
    const start = Date.now();
    for (;;) {
      const up = await page.evaluate(() => {
        const t = document.querySelector('.toast');
        return !!t && getComputedStyle(t).display !== 'none';
      });
      if (up) return;
      if (Date.now() - start > 2000) {
        throw new Error(`${id} @ ${lang}: the toast never appeared`);
      }
      await new Promise((r) => setTimeout(r, 40));
    }
  };

  const render = (state, ru, en) => {
    const lines = [
      '# ' + state.id,
      '# route: ' + state.route,
      '# why: ' + state.why,
      '',
      '## ru :: tree',
      ...ru.tree,
      '',
      '## ru :: controls',
      ...ru.controls,
      '',
      '## en :: tree',
      ...en.tree,
      '',
      '## en :: controls',
      ...en.controls,
      ''
    ];
    return lines.join('\n');
  };

  /** One state, both languages. Ordinary states: one arrival, seed, open,
   *  enter, snapshot ru, press EN, snapshot en - a snapshot is a read and does
   *  not perturb the page, so nothing forces a second arrival. `timed` states
   *  arrive fresh per language instead: their toast lives 1600ms and a
   *  50-120ms snapshot ahead of the EN press would eat into that window for a
   *  state that already has to press one control more to reach English. */
  const captureState = async (state) => {
    if (!state.timed) {
      const { ctx, page, d } = await fresh({ width: WIDTH, height: HEIGHT, storage: state.storage });
      try {
        await d.open(state.route);
        if (state.enter) await state.enter(d);
        await d.addressSettled();
        const ru = await captureLang(page, d);
        await d.click('EN');
        await d.addressSettled();
        const en = await captureLang(page, d);
        return render(state, ru, en);
      } finally {
        await ctx.close();
      }
    }

    const oneLang = async (lang) => {
      const { ctx, page, d } = await fresh({ width: WIDTH, height: HEIGHT, storage: state.storage });
      try {
        await d.open(state.route);
        if (state.enter) await state.enter(d);
        if (lang !== 'ru') await d.click('EN');
        await waitForToast(page, state.id, lang);
        /* `addressSettled()` runs unconditionally here too (see the ordinary
         * branch above), not gated on the route: the harness cannot know in
         * general which `enter` mutated a list, and a state with no pending
         * sync pays one quiet window (URL_DEBOUNCE_MS + 100ms, ~250ms - or up
         * to ~430ms if a sync lands mid-window) and returns, against the
         * shortest toast lifetime of 1600ms. It comes after `waitForToast`,
         * not before: the toast is what this state exists to capture, so the
         * address wait has to stay inside the toast's own window rather than
         * push the capture past it. */
        await d.addressSettled();
        return await captureLang(page, d);
      } finally {
        await ctx.close();
      }
    };
    const ru = await oneLang('ru');
    const en = await oneLang('en');
    return render(state, ru, en);
  };

  (async () => {
    fs.mkdirSync(DIR, { recursive: true });

    /* --shard partitions the *whole* inventory by index, disjointly and
     * exhaustively (parity.js's own contract); --only= then narrows further,
     * within whichever slice --shard already picked. Combining both is legal -
     * CI never does, local debugging might. */
    const wanted = STATES.filter(
      (s, i) => (!SHARD || i % SHARD.of === SHARD.n) && (!ONLY || s.id.includes(ONLY))
    );
    if (ONLY && !wanted.length) {
      console.log(`--only=${ONLY} matched nothing`);
      process.exit(1);
    }

    const runStart = Date.now();
    let captureMs = 0;
    let compared = 0;
    for (const state of wanted) {
      const file = path.join(DIR, slugOf(state.id) + '.txt');
      const t0 = Date.now();
      let text;
      try {
        text = await captureState(state);
      } catch (e) {
        captureMs += Date.now() - t0;
        ok(false, `${state.id}: capture failed - ${e.message || e}`);
        continue;
      }
      captureMs += Date.now() - t0;

      if (UPDATE) {
        fs.writeFileSync(file, text);
        compared++;
        continue;
      }

      if (!fs.existsSync(file)) {
        ok(false, `${state.id}: no golden file (${slugOf(state.id)}.txt) - node tests/app/golden.js --update`);
        continue;
      }
      compareGolden(state.id, fs.readFileSync(file, 'utf8'), text, ok);
      compared++;
    }

    /* Only the stale-file sweep below is suppressed by --only=: it walks the
     * whole snapshots directory against the whole inventory, and a filtered
     * run would flag every file outside the filter as an orphan it is not.
     * The missing-golden check above (:427) runs unconditionally - it is not
     * suppressed by --only= at all, and simply sees fewer states because
     * `wanted` is already filtered; a golden absent for a state this call
     * did process still fails.
     * --shard suppresses neither: the missing check is per state and only
     * ever sees the states this shard actually processed, and the stale check
     * below reads the *whole* inventory regardless of --shard, which every
     * shard knows in full - so a stale file is caught no matter which shard
     * happens to run. */
    if (!ONLY) {
      const haveFiles = new Set(fs.readdirSync(DIR).filter((f) => f.endsWith('.txt')));
      const wantFiles = new Set(STATES.map((s) => slugOf(s.id) + '.txt'));
      for (const f of haveFiles) {
        if (!wantFiles.has(f)) ok(false, `${f}: stale golden - this state no longer exists in inventory.js`);
      }
    }

    await closeBrowser();
    const totalS = (Date.now() - runStart) / 1000;
    console.log(`capture: ${(captureMs / 1000).toFixed(1)}s of ${totalS.toFixed(1)}s`);
    console.log(
      `states compared: ${String(compared)}` +
        (ONLY ? ` (not a full run - --only=${ONLY})` : '') +
        (SHARD ? ` (shard ${String(SHARD.n + 1)}/${String(SHARD.of)})` : '')
    );
    console.log(rep.failed ? `${rep.failed} FAILED` : 'structural snapshots (dist/): unchanged');
    process.exit(rep.failed ? 1 : 0);
  })();
}
