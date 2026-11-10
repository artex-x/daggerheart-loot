/* Runs the suites and prints a summary.

     node tests/run-all.js                 all suites, in parallel
     node tests/run-all.js derived,craft   just those two
     node tests/run-all.js --jobs 1        one at a time, for debugging
     node tests/run-all.js --exclude=app/golden   everything but that one suite
     node tests/run-all.js --shard=2/4     one balanced quarter of the pool
     node tests/run-all.js --shard=2/5 --list   the rows of that shard, run nothing

   Needs NODE_PATH and LD_LIBRARY_PATH for puppeteer.

   The suites are independent, so they run in a pool the width of the machine
   and the output is buffered per suite, so a line still belongs to the suite
   that printed it. The order of the summary is fixed by the list below rather
   than by who finished first, so two runs of the same set read the same.

   Slowest first: with the long ones started early, the tail of the run is
   short jobs filling the gaps instead of one straggler holding the pool.

   The suites that drove the live app (`index.html`/`app.js`/`style.css`) and
   the parity harness that compared it against `dist/` are gone;
   `docs/specs/COVERAGE.md`'s per-suite table says where each one's
   assertions went. What is left runs against `dist-test/` (the test build,
   `npm run build:test`) alone, plus a handful of fs-only data/contract
   checks.

   `--shard` is what ci.yml's `browser` matrix
   uses instead of a single `check`-job step plus a separate `golden` job -
   see the weight comment below. */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const HERE = __dirname;

/* Weight column: CI seconds, not a local guess. Measured on GitHub's
   ubuntu-latest runners in run 42821823209 (the green `main` run of
   2026-11-10; each suite prints `ok  <name> <what> <secs>s`), one reading
   per row. The four `app/states` rows took 755.8, 504.9, 807.0 and 675.0 s
   there, and the job's longest shard lasted about 14 min. A
   local run is advisory, the same doctrine
   `.claude/README.md` states for every other cost table in this repository.
   These numbers are the input to `--shard`'s bin packer below, so an entry
   that is off by multiples mis-packs a shard, not just a sort order. The
   slowest suite step passed 360 s on runs 36229149582 and 36230695846
   (2026-09-26), so ci.yml's `browser` matrix went from four shards to five
   (roadmap, "the shard trigger").

   `app/states` runs as four rows of interleaved cases (its own
   `--shard=n/4`), since one serial row passed the job's 30-minute limit at
   97 cases. Inside a shard the rows run four at a time, so a shard lasts as
   long as its longest row: splitting the longest row is the lever, not the
   weights (docs/decisions/2026-11-05-app-states-runs-as-four-interleaved-rows.md).

   `app/sweep`'s 1180 row is split into a `ru` and an `en` row: axe runs
   both languages there, plus the RU-only focus walk, which made the unsplit
   row the longest in the table.

   `app/golden`'s four rows keep their own weight and continue to mean "every
   fourth state" (`tests/app/golden.js`'s own `--shard=n/4`, a split of its
   own, apart from this file's); under `--shard` they join the pool like any
   other row (`--exclude=app/golden`, still supported below, is for a local
   run that wants to skip them). */
const SUITES = [
  ['app/sweep', 'dist-test/: page sweep 768', 826.6, ['768']],
  ['app/states', 'dist-test/: real input 3/4', 807.0, ['--shard=3/4']],
  ['app/states', 'dist-test/: real input 1/4', 755.8, ['--shard=1/4']],
  ['app/sweep', 'dist-test/: page sweep 390', 726.7, ['390']],
  ['app/sweep', 'dist-test/: page sweep 360', 724.9, ['360']],
  ['app/states', 'dist-test/: real input 4/4', 675.0, ['--shard=4/4']],
  ['app/contracts', 'dist-test/: contracts and fixtures', 647.5],
  ['app/states', 'dist-test/: real input 2/4', 504.9, ['--shard=2/4']],
  ['app/print', 'dist-test/: card printing', 492.2],
  ['app/sweep', 'dist-test/: page sweep 1180 ru', 455.1, ['1180', 'ru']],
  ['app/sweep', 'dist-test/: page sweep 1180 en', 453.6, ['1180', 'en']],
  ['app/golden', 'dist-test/: structural snapshots 2/4', 407.4, ['--shard=2/4']],
  ['app/golden', 'dist-test/: structural snapshots 1/4', 383.8, ['--shard=1/4']],
  ['app/golden', 'dist-test/: structural snapshots 3/4', 373.7, ['--shard=3/4']],
  ['app/golden', 'dist-test/: structural snapshots 4/4', 336.1, ['--shard=4/4']],
  ['app/typo', 'dist-test/: fonts and scale', 240.7],
  ['app/hues', 'dist-test/: label colors', 89.2],
  ['stub', 'stub pages i/', 7.0],
  ['derived', 'derived files and catalog', 2.3],
  ['dataint', 'data.js invariants', 0.6],
  ['craft', 'upgrade chains', 0.2],
  ['contracts', 'contracts and golden fixtures', 0.1]
];

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`Runs the suites and prints a summary.

  node tests/run-all.js                        all suites, in parallel
  node tests/run-all.js derived,craft          just those two
  node tests/run-all.js --jobs 1               one at a time, for debugging
  node tests/run-all.js --exclude=app/golden   everything but that one suite
  node tests/run-all.js --shard=2/4            one balanced quarter of the pool
  node tests/run-all.js --shard=2/5 --list     the rows of that shard and their
                                               weights; runs nothing
  node tests/run-all.js --help, -h             this message

Suites: ${SUITES.map((s) => s[0])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ')}

app/golden, app/states and app/sweep run as several rows; named bare, each
selects all its rows and takes past the Bash tool's 600s foreground cap - see
.claude/README.md, "Batch size and the fixed cost of a run". Run one row with
node tests/app/golden.js --shard=n/4, node tests/app/states.js --shard=n/4 or
node tests/app/sweep.js <width> [ru|en], one call each.

--shard=n/m (1-indexed) packs the whole queue longest-first over the weight
column into m bins and runs only bin n - disjoint and exhaustive across
n=1..m, the same contract tests/app/golden.js's own --shard=n/of promises for
its states. ci.yml's browser matrix runs it once per shard.`);
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
   `browser` matrix is five calls of this.

   Five separate `node` processes, one per matrix job, each sort and pack
   this same array independently and have to agree on the result without
   talking to each other - which they do only because `Array.prototype.sort`
   is a stable sort and this table may hold exact ties (it had two before the
   2026-11-10 refresh): a
   stable sort keeps tied rows in their original SUITES order on every
   process, so "lightest bin first" breaks the tie identically everywhere. An
   unstable sort could let one process assign a tied suite to a different bin
   than another, and the five `--shard` calls would silently stop being
   disjoint and exhaustive. Load-bearing and otherwise invisible - nothing
   else in this file depends on sort stability. */
const SHARD = require('./app/shard.js').shardOf(args);
if (SHARD) {
  const bins = Array.from({ length: SHARD.of }, () => ({ items: [], total: 0 }));
  const byWeight = queue.slice().sort((a, b) => b[2] - a[2]);
  for (const suite of byWeight) {
    let lightest = 0;
    for (let i = 1; i < bins.length; i++)
      if (bins[i].total < bins[lightest].total) lightest = i;
    bins[lightest].items.push(suite);
    bins[lightest].total += suite[2];
  }
  const mine = new Set(bins[SHARD.n].items);
  queue = queue.filter((s) => mine.has(s));
}
const shardName = SHARD ? SHARD.n + 1 + '/' + SHARD.of : '';
/* Report key: several rows share one suite name (app/sweep, app/golden,
   app/states) */
const keyOf = (s) => s[0] + (s[3] ? ':' + s[3].join('-') : '');
if (args.includes('--list')) {
  for (const s of queue) console.log(keyOf(s) + ' ' + s[2]);
  console.log('sum ' + queue.reduce((t, s) => t + s[2], 0).toFixed(1));
  process.exit(0);
}
/* The build's outputs are not committed (docs/specs/CONTRACTS.md sections 4
   and 5): derived, contracts and the app/* suites (through tests/app/serve.js
   and tests/app/print.js) read data.json or catalog.csv, and
   derived/dataint/craft/stub read i/*.html. A clean checkout has none of
   them, so build once here rather than lose the suites to ENOENT. */
const NEEDS_I = ['derived', 'dataint', 'craft', 'stub'];
const missing = queue.length
  ? ['data.json', 'catalog.csv']
      .concat(queue.some((s) => NEEDS_I.indexOf(s[0]) >= 0) ? ['i/'] : [])
      .find((f) => !fs.existsSync(path.join(HERE, '..', f)))
  : undefined;
if (missing) {
  console.log(missing + ' is missing - running node tools/build.js first');
  const built = spawnSync(process.execPath, [path.join(HERE, '..', 'tools', 'build.js')], {
    stdio: 'inherit'
  });
  if (built.status !== 0) {
    console.log('node tools/build.js failed, so the suites that read its output cannot run');
    process.exit(1);
  }
}
/* The key tells two runs of one suite apart with a colon, which is fine on
   screen and not fine in a file name: GitHub's artifact upload refuses a colon
   outright, because NTFS does, and one bad name fails the whole upload - which
   is exactly the log somebody needed to read. */
const fileOf = (s) => keyOf(s).replace(/[^\w.-]+/g, '-');
if (!queue.length) {
  if (SHARD) {
    console.log('shard ' + shardName + ' is empty: fewer suites than bins');
  } else {
    console.log('no such suites: ' + only.join(', '));
  }
  process.exit(1);
}
/* A job cancelled by its timeout prints no summary; this line still names
   the rows that ran in it. */
if (SHARD) console.log('shard ' + shardName + ': ' + queue.map(keyOf).join(', '));

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
   neighbor waits for it, otherwise two identical runs would print a
   different report and could not be compared. */
let printed = 0;
function flush() {
  while (printed < queue.length && done[keyOf(queue[printed])]) {
    const [name, what] = queue[printed];
    const r = done[keyOf(queue[printed])];
    console.log(
      (r.ok ? '  ok  ' : 'FAIL  ') + name.padEnd(14) + what.padEnd(40) + r.secs + 's'
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
