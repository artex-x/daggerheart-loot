/* Runs the suites and prints a summary.

     node tests/run-all.js                 all suites, in parallel
     node tests/run-all.js derived,craft   just those two
     node tests/run-all.js --jobs 1        one at a time, for debugging
     node tests/run-all.js --exclude=app/golden   everything but that one suite
     node tests/run-all.js --shard=2/4     one balanced quarter of the pool

   Needs NODE_PATH and LD_LIBRARY_PATH for puppeteer.

   The suites are independent, so they run in a pool the width of the machine
   and the output is buffered per suite, so a line still belongs to the suite
   that printed it. The order of the summary is fixed by the list below rather
   than by who finished first, so two runs of the same set read the same.

   Slowest first: with the long ones started early, the tail of the run is
   short jobs filling the gaps instead of one straggler holding the pool.

   R0c (2026-09-17) deleted the fourteen suites that drove the live app
   (`index.html`/`app.js`/`style.css`) and the parity harness that compared it
   against `dist/`; `docs/specs/COVERAGE.md`'s per-suite table says where each
   one's assertions went. What is left runs against `dist/` alone, plus a
   handful of fs-only data/contract checks.

   `--shard` (added issues/phase-8, B3) is what ci.yml's `browser` matrix
   uses instead of a single `check`-job step plus a separate `golden` job -
   see the weight comment below and issues/phase-8/handoff.md, "B3". */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const HERE = __dirname;

/* Weight column: CI seconds, not a local guess. Measured on GitHub's
   ubuntu-latest runners, run 35214847899, 2026-09-17
   (issues/phase-8/critique/tests.md, section 0.3) - a local run is advisory,
   the same doctrine `.claude/README.md` states for every other cost table in
   this repository. These numbers are the input to `--shard`'s bin packer
   below, so an entry that is off by multiples mis-packs a shard, not just a
   sort order (issues/phase-8/critique/tests.md, "T5").

   `app/sweep`'s 1180 row is split into a `ru` and an `en` row: at 550.5s
   measured it was 25% of all browser work and 1.7x its narrower siblings -
   axe running both languages there, plus the RU-only focus walk, account
   for the whole excess (`tests.md`, "T2"). The two halves below are kept at
   an even ~275s split rather than the two rows' real measured weights
   (371.9s ru, 172.7s en - issues/phase-8's B3 review, re-measured after this
   comment was first written): re-running the packer with the corrected
   numbers still produces the same four bins, because each CI runner is
   itself a 4-way pool, so wall clock is max(longest row, total/4) and the
   bin sums this packer minimises never bind at this table's scale.
   Correcting the split buys documentation accuracy, not a faster `browser`
   matrix - not worth invalidating the shard proof this table already has.

   `app/golden`'s four rows keep their own weight and continue to mean "every
   fourth state" (`tests/app/golden.js`'s own `--shard=n/4`); they used to be
   excluded from every CI run of this file and driven by a separate `golden`
   job instead (`--exclude=app/golden`, still supported below for a local run
   that wants to skip them) - under `--shard` they join the pool like any
   other row, which is the first time their granularity earns anything in CI. */
const SUITES = [
  ['app/sweep', 'dist/: page sweep 390', 326.6, ['390']],
  ['app/sweep', 'dist/: page sweep 360', 325.0, ['360']],
  ['app/sweep', 'dist/: page sweep 768', 318.8, ['768']],
  ['app/sweep', 'dist/: page sweep 1180 ru', 275, ['1180', 'ru']],
  ['app/sweep', 'dist/: page sweep 1180 en', 275, ['1180', 'en']],
  ['app/contracts', 'dist/: contracts and fixtures', 256.4],
  ['app/print', 'dist/: card printing', 159.7],
  ['app/golden', 'dist/: structural snapshots 1/4', 106, ['--shard=1/4']],
  ['app/states', 'dist/: real input', 102.7],
  ['app/golden', 'dist/: structural snapshots 2/4', 102, ['--shard=2/4']],
  ['app/golden', 'dist/: structural snapshots 3/4', 98, ['--shard=3/4']],
  ['app/golden', 'dist/: structural snapshots 4/4', 94, ['--shard=4/4']],
  ['app/typo', 'dist/: fonts and scale', 78.1],
  ['app/hues', 'dist/: label colours', 66.9],
  ['stub', 'stub pages i/', 1.6],
  ['dataint', 'data.js invariants', 0.3],
  ['derived', 'derived files and catalog', 0.3],
  ['craft', 'upgrade chains', 0.1],
  ['contracts', 'contracts and golden fixtures', 0]
];

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`Runs the suites and prints a summary.

  node tests/run-all.js                        all suites, in parallel
  node tests/run-all.js derived,craft          just those two
  node tests/run-all.js --jobs 1               one at a time, for debugging
  node tests/run-all.js --exclude=app/golden   everything but that one suite
  node tests/run-all.js --shard=2/4            one balanced quarter of the pool
  node tests/run-all.js --help, -h             this message

Suites: ${SUITES.map((s) => s[0])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ')}

app/golden and app/sweep are unsharded/all-widths when named bare and each
takes past the Bash tool's 600s foreground cap - see .claude/README.md,
"Batch size and the fixed cost of a run". Run app/golden with
node tests/app/golden.js --shard=n/4 and app/sweep with
node tests/app/sweep.js <width> [ru|en], one call each.

--shard=n/m (1-indexed) packs the whole queue longest-first over the weight
column into m bins and runs only bin n - disjoint and exhaustive across
n=1..m, the same contract tests/app/golden.js's own --shard=n/of promises for
its states. This is what ci.yml's browser matrix runs, four times.`);
  process.exit(0);
}
const jobsArg = args.indexOf('--jobs');
const JOBS =
  jobsArg >= 0
    ? Math.max(1, +args[jobsArg + 1] || 1)
    : Math.max(1, Math.min(os.cpus().length, 8));
/* `--exclude=<suite>` pulls a suite out of this run without touching the
   include list. CI no longer passes this for `app/golden` - its four rows
   sit in SUITES like every other suite now and ride the --shard pool below
   (see the weight comment above); the flag stays for a local run that wants
   to skip something slow on this host. */
const excludeArg = args.find((a) => a.startsWith('--exclude='));
const exclude = excludeArg
  ? excludeArg.slice('--exclude='.length).split(',').filter(Boolean)
  : [];
const only = args
  .filter((a, i) => a[0] !== '-' && !(jobsArg >= 0 && i === jobsArg + 1))
  .join(',')
  .split(',')
  .filter(Boolean);
let queue = SUITES.filter(
  (s) => (!only.length || only.indexOf(s[0]) >= 0) && exclude.indexOf(s[0]) < 0
);

/* `--shard=n/m`: a longest-first greedy pack (LPT list scheduling) of `queue`
   over the weight column into `m` bins, keeping only bin `n`. Disjoint and
   exhaustive by construction - every suite lands in exactly one bin - the
   same promise tests/app/golden.js's own --shard=n/of makes for its states,
   generalised here from one suite's states to the whole pool. ci.yml's
   `browser` matrix is four calls of this (issues/phase-8/handoff.md, "B3").

   Four separate `node` processes, one per matrix job, each sort and pack
   this same array independently and have to agree on the result without
   talking to each other - which they do only because `Array.prototype.sort`
   is a stable sort and this table currently has two exact ties (the
   `app/sweep` 1180 rows at 275/275, `dataint`/`derived` at 0.3/0.3): a
   stable sort keeps tied rows in their original SUITES order on every
   process, so "lightest bin first" breaks the tie identically everywhere. An
   unstable sort could let one process assign a tied suite to a different bin
   than another, and the four `--shard` calls would silently stop being
   disjoint and exhaustive. Load-bearing and otherwise invisible - nothing
   else in this file depends on sort stability. */
const shardArg = args.find((a) => a.startsWith('--shard='));
if (shardArg) {
  const m = /^--shard=(\d+)\/(\d+)$/.exec(shardArg);
  const n = m && Number(m[1]);
  const of = m && Number(m[2]);
  if (!n || !of || n < 1 || n > of) {
    throw new Error(`--shard must look like --shard=1/4 (got "${shardArg}")`);
  }
  const bins = Array.from({ length: of }, () => ({ items: [], total: 0 }));
  const byWeight = queue.slice().sort((a, b) => b[2] - a[2]);
  for (const suite of byWeight) {
    let lightest = 0;
    for (let i = 1; i < bins.length; i++)
      if (bins[i].total < bins[lightest].total) lightest = i;
    bins[lightest].items.push(suite);
    bins[lightest].total += suite[2];
  }
  const mine = new Set(bins[n - 1].items);
  queue = queue.filter((s) => mine.has(s));
}
/* derived/dataint/craft/stub all read i/*.html, which f53f44d untracked: a
   cold clone that has not run `node tools/build.js` (or `npm run build`) has
   no i/ directory at all, and each of those four suites used to fail with a
   raw ENOENT stack and no hint. One preflight here, the entry point all four
   go through, replaces four separate crashes with one actionable message. */
const NEEDS_I = ['derived', 'dataint', 'craft', 'stub'];
if (
  queue.some((s) => NEEDS_I.indexOf(s[0]) >= 0) &&
  !fs.existsSync(path.join(HERE, '..', 'i'))
) {
  console.log(
    'i/ is missing - it is generated, not committed. Run `node tools/build.js` (or `npm run build`) first.'
  );
  process.exit(1);
}
/* Report key: several rows share one suite name (app/sweep, app/golden) */
const keyOf = (s) => s[0] + (s[3] ? ':' + s[3].join('-') : '');
/* The key tells two runs of one suite apart with a colon, which is fine on
   screen and not fine in a file name: GitHub's artifact upload refuses a colon
   outright, because NTFS does, and one bad name fails the whole upload - which
   is exactly the log somebody needed to read. */
const fileOf = (s) => keyOf(s).replace(/[^\w.-]+/g, '-');
if (!queue.length) {
  if (shardArg) {
    console.log('shard ' + shardArg + ' is empty: fewer suites than bins');
  } else {
    console.log('no such suites: ' + only.join(', '));
  }
  process.exit(1);
}

/* Every suite's whole output goes to a file, not just the dozen lines the
   summary shows. On a machine you are sitting at the difference hardly matters;
   in CI it is everything, because the run is gone by the time anyone looks and
   twelve grepped lines rarely say why. The directory is what CI uploads. */
const OUT_DIR = path.join(HERE, '..', 'test-output');
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const done = {}; // name -> { ok, secs, out }
let next = 0,
  running = 0,
  bad = 0;
const t0 = Date.now();

/* Printed strictly in list order: a suite that finished ahead of its
   neighbour waits for it, otherwise two identical runs would print a
   different report and could not be compared. */
let printed = 0;
function flush() {
  while (printed < queue.length && done[keyOf(queue[printed])]) {
    const [name, what] = queue[printed];
    const r = done[keyOf(queue[printed])];
    console.log(
      (r.ok ? '  ok  ' : 'FAIL  ') + name.padEnd(10) + what.padEnd(34) + r.secs + 's'
    );
    if (!r.ok) {
      r.out
        .split('\n')
        .filter((l) => /FAIL|Error/.test(l))
        .slice(0, 12)
        .forEach((l) => console.log('        ' + l.trim()));
      console.log('        full output: test-output/' + fileOf(queue[printed]) + '.log');
    }
    printed++;
  }
}

function start() {
  while (running < JOBS && next < queue.length) {
    const suite = queue[next++],
      name = suite[0],
      key = keyOf(suite);
    running++;
    const started = Date.now();
    let out = '';
    const p = spawn(process.execPath, [path.join(HERE, name + '.js')].concat(suite[3] || []), {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    p.stdout.on('data', (d) => {
      out += d;
    });
    p.stderr.on('data', (d) => {
      out += d;
    });
    p.on('close', function (code) {
      if (code) bad++;
      fs.writeFileSync(path.join(OUT_DIR, fileOf(suite) + '.log'), out);
      done[key] = { ok: !code, secs: ((Date.now() - started) / 1000).toFixed(1), out: out };
      running--;
      flush();
      start();
      if (!running && next >= queue.length) finish();
    });
  }
}

function finish() {
  console.log(
    '\n' +
      (bad ? bad + ' suites failed' : 'all suites passed') +
      ' in ' +
      ((Date.now() - t0) / 1000).toFixed(0) +
      's' +
      (JOBS > 1 ? ' (' + JOBS + ' at a time)' : '')
  );
  process.exit(bad ? 1 : 0);
}

start();
