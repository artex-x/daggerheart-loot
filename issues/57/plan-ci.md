# Plan CI - the `browser (3)` timeout (TASK 57)

This file is the brief of batch CI: it gives the cause of the 30-minute
cancel of `browser (3)` in CI run 42102518161 and the one fix that makes CI
of the batch 9b tip finish. It is scratch of task 57; the durable facts go to
their homes in the batch (step S7).

## Status

- Planned 2026-11-05 (planner). Next: batch CI, then batch T's refresh.
- Open design question: none.
- Plan review: not required (no trigger fired). The batch changes no
  migration, no public contract, no stored data or key and no write or sync
  protocol.
- Batch review: required (trigger: `tests/run-all.js` changed; orchestrate
  prompt, "When to run reviewer").

## 1. Evidence

All times are CI seconds from the `run-all.js` summary line
(`ok <name> <what> <secs>s`) in each job log, read on 2026-11-05 with
`gh api --allow-escape-sequences repos/artex-x/daggerheart-loot/actions/jobs/<id>/logs`.

### The cancel

| Run | Tip | `browser (3)` | `app/states` |
|---|---|---|---|
| 42036663681 | `d8e30731` (94 cases) | success, 25.5 min | 1461.4 s, ok |
| 42083009049 | `18429aee` (97 cases) | cancelled at 30.5 min, 9 s after its failure upload | 1742.8 s, FAIL |
| 42102518161 attempt 2 | `6578a2c7` (97 cases) | cancelled at 30.3 min; the step ran 1744 s | did not finish |

The job has `timeout-minutes: 30` (`.github/workflows/ci.yml`, `browser`).
Its fixed cost is about 70 s (checkout 10 s, `npm ci` 49-50 s, `build:test`
5-6 s), so the suite step has about 1730 s. `app/states` now needs about
1745-1760 s. Every other job of run 42102518161 passed.

### The growth of `app/states`

| Run | Tip | Cases | `app/states` |
|---|---|---|---|
| 40878854331 | `daddf512` (main, 2026-10-29) | 72 | 324.4 s |
| 40887009055 | `c8243ba6` (main) | 72 | 344.5 s |
| 40996046915 | `d83384b4` (main, wave 1) | 73 | 486.1 s |
| 41757015677 | `ed7d353a` | 77 | 577.4 s |
| 41823229428 | `0a43491f` | 82 | 784.0 s |
| 41896718215 | `cd32174d` | 84 | 844.7 s |
| 41937527048 | `5566dbf0` | 88 | 1289.4 s |
| 41972009883 | `6f90ccd6` | 91 | 1341.5 s |
| 42020997138 | `17700f3c` | 94 | 1414.2 s, FAIL |
| 42036663681 | `d8e30731` | 94 | 1461.4 s |
| 42083009049 | `18429aee` | 97 | 1742.8 s, FAIL |

Cases 1-82 cost about 340 s together (about 5 s each). The 25 layout cases of
this task (83-107, "from 320 to 1180 px", "1440 px", "at 360, 320 and 1180")
added about 1420 s (about 57 s each): each one walks widths and both
languages with a `fresh()` context per cell, serially (case 101 alone opens
74 contexts, up to 3840x2160; handoff Deferred, W-N4). Batch 9b's cases
105-107 and the remediation's case 107 block at 360 added about 290 s.

### The other rows (runs 42036663681 and 42102518161)

| Row | CI s | `run-all.js` weight now |
|---|---|---|
| `app/sweep` 768 | 835.2 / 842.1 | 357.9 |
| `app/sweep` 390 | 673.7 / 666.7 | 381.6 |
| `app/sweep` 360 | 661.6 / 616.6 | 382.9 |
| `app/contracts` | 559.5 / 552.1 | 328.4 |
| `app/print` | 474.3 / 469.8 | 340.8 |
| `app/golden` 4/4 | 404.3 / 387.9 (run 42083009049) | 156 |
| `app/sweep` 1180 en | 388.9 / 384.8 | 204.4 |
| `app/sweep` 1180 ru | 390.1 / 370.9 | 223.3 |
| `app/golden` 2/4 | 367.2 / 370.0 | 151.5 |
| `app/golden` 3/4 | 360.7 / 362.0 | 158.1 |
| `app/golden` 1/4 | 356.5 / 346.5 | 157.5 |
| `app/typo` | 183.5 / 199.4 | 89.6 |
| `app/hues` | 85.8 / 85.1 | 77 |
| `stub`, `derived`, `dataint`, `craft`, `contracts` | 6.8, 2.5, 1.4, 0.2, 0.2 | 4, 1.8, 0.4, 0.2, 0.1 |
| `app/states` | 1742.8 (run 42083009049) | 179.3 |

The weights are from 2026-09-26 (runs 36229149582 and 36230695846). Every
row grew 1.1-2.4x since then; `app/states` grew 9.7x.

## 2. Cause

`app/states` is one serial process (`tests/app/states.js`, the `CASES` loop
at the end of the file) and one `run-all.js` row. Inside a shard
`run-all.js` runs the rows four at a time (`JOBS` is `min(cpus, 8)`, and the
ubuntu runner has 4 vCPU), so a shard's wall time is its longest row, not its
sum: shard 3 held `app/sweep` 768 (842 s), `app/golden` 4/4 (about 400 s) and
`app/states`, and it ended when `app/states` ended. The row passed the step's
1730 s at 97 cases.

Two consequences decide the fix:

1. No weight change and no extra shard can make a shard shorter than its
   longest row. With fresh weights and `app/states` as one row, the packer
   puts it alone in a shard, and that shard still needs 1760 + 70 s
   (simulated with the packer's own LPT rule, section 5).
2. The stale weight (179.3 s) is not the cause of the cancel, but it hides
   the row's cost from every reader of the table.

## 3. Options

Current behavior, every push: CI's `browser (3)` is cancelled at 30 min, so no
CI credit arms and the batch 9b tip cannot reach `main`. Each later layout
case adds about 57 s to the same row.

| | A. Raise `timeout-minutes` to 45 | B. Split `app/states` into four interleaved rows (recommended) | C. A sixth shard | D. Make the slow cases faster |
|---|---|---|---|---|
| Change | one line in `ci.yml` | `--shard=n/of` in `states.js` by case index (the `golden.js` rule), four rows in `run-all.js`, the weight column re-measured | `shard: [1..6]`, `--shard=.../6`, `browser (6)` in `ci-credit.mjs` `REQUIRED_JOBS`, plus B | per-case profiling, then fewer `fresh()` contexts per case (one context and `setViewport` per width), fewer 5 s negative waits |
| Push to last gate job | about 31 min, plus about 1 min per new layout case | about 15 min (the floor is `app/sweep` 768, 839 s) | about 15 min: the same floor | unknown until measured |
| Runner-minutes per run (public repository: no Actions cost) | about 72 (as today) | about 59 | about 60 (one more job's fixed cost) | unknown |
| Risk | the hang guard has a smaller margin; the row keeps growing and fails again near 45 min | interleave must stay disjoint and exhaustive; four more Chrome processes spread over the shards | edits a hook (`ci-credit.mjs`) and the required job list for no wall-clock gain | weakens what a case proves if done in a hurry; needs local runs of 20+ min |
| Files | 1 | 6 code and doc files plus one decision file | B's files plus `ci.yml` and `ci-credit.mjs` | many cases of `states.js` |

Recommended: **B**. It is the only option that removes the single long row,
so CI wall time drops from about 30 min to about 15 min and stays there while
the remaining batches add cases. The trade-off that is accepted: the shard
assignment of every row moves (for example `app/sweep` 768 goes from shard 3
to shard 1), and three helper call sites change in one review.

A is the fallback only if B cannot land today: it unblocks the one tip and
doubles every later CI wait. C gives no gain over B while `app/sweep` 768 is
the floor. D stays deferred (section 8) until the per-case times of step S2
exist.

## 4. Batch CI - implement-ready

### Objective

Make every `browser (n)` job of CI finish in about 15 min by running
`app/states` as four rows of interleaved cases, and refresh the shard weights
from CI.

### In scope

- `tests/app/shard.js` (new): one parse of `--shard=n/of` for its three
  readers.
- `tests/app/states.js`: the `--shard` filter, a per-case time line, the
  summary line, the header comment's stale case count.
- `tests/app/golden.js` and `tests/run-all.js`: use the shared parse.
- `tests/run-all.js`: four `app/states` rows, the refreshed weight column, a
  `--list` flag, a start line that names the shard's rows.
- Durable docs (step S7).
- The handoff's Deferred W-N4 (the stale `app/states` weight): closed by this
  batch.

### Out of scope

- `.github/workflows/ci.yml`: no change. `timeout-minutes: 30` stays, with a
  2x margin over the expected 15 min. The matrix stays `[1, 2, 3, 4, 5]`.
- `.claude/hooks/ci-credit.mjs`, `tests/derived.js`: no change (the job names
  and the divisor stay).
- Any change to what a case asserts. A case that fails on CI after the split
  is a batch 9b remediation defect and is routed back to it, not fixed here.
- Case speed-ups (option D) and output streaming (section 8).

### Expected files

| File | Change |
|---|---|
| `tests/app/shard.js` | new, about 20 lines |
| `tests/app/states.js` | header lines 9-10; the runner at the end (`const CASES` loop, about 20 lines) |
| `tests/app/golden.js` | lines 41-52 (the inline parse) |
| `tests/run-all.js` | lines 1-7 and 26-28 (usage comment), 35-74 (weight comment and `SUITES`), 76-101 (help), 126-163 (tie comment and shard block) |
| `docs/specs/COVERAGE.md` | "Suites", the paragraph at lines 424-432 |
| `.claude/README.md` | "Batch size and the fixed cost of a run": the CI row (line 1007), a `states.js --shard` row after line 1014, the paragraph at lines 1126-1131 |
| `docs/decisions/2026-11-05-app-states-runs-as-four-interleaved-rows.md` | new; then `node tools/decisions.js` rebuilds `docs/DECISIONS.md` |
| `issues/57/handoff.md` | W-N4 removed from Deferred; Completed and Verification lines |

### Constraints

- The split is by case index: case `i` (0-based in `CASES`) runs in piece
  `i % of`, as `golden.js` splits its states. The heavy cases 83-107 sit
  together at the end of the list, so a split by ranges would put most of
  them in the last piece. With 97 entries the pieces hold 25, 24, 24 and 24.
- The cases are independent: each opens its own `fresh()` context; no case
  reads module state that another case writes; the only file write (case 59)
  has the process id in its name; the static server takes a free port per
  process (`lib.js`, `startServer`). Four pieces can run at the same time.
- `node tests/app/states.js` with no `--shard` runs every case, as today.
- `node tests/run-all.js app/states` selects all four rows (the filter reads
  the suite name), so `CLAUDE.md`'s focused command
  `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`
  keeps its meaning.
- The weight column stays "CI seconds, not a local guess" (the file's own
  doctrine).
- No `Co-Authored-By` or other AI attribution in the commit.

### Standing checks

Not applicable - the batch changes no screen, no write path and no stored
shape: it changes how the test suites are split over CI jobs.

### Steps

S1. Create `tests/app/shard.js`. It requires nothing (no puppeteer, no
`lib.js`), so `golden.js` keeps its lazy `require('./lib.js')`.

```js
/* One parse of `--shard=n/of` for tests/run-all.js, tests/app/golden.js and
   tests/app/states.js. */

/** Returns `{ n, of }` with `n` counted from 0 for a `--shard=n/of` in
 *  `argv`, or null when there is none; throws on a malformed value. */
function shardOf(argv) {
  const arg = argv.find((a) => a.startsWith('--shard='));
  if (!arg) return null;
  const m = /^--shard=(\d+)\/(\d+)$/.exec(arg);
  const n = m && Number(m[1]);
  const of = m && Number(m[2]);
  if (!n || !of || n < 1 || n > of) {
    throw new Error(`--shard must look like --shard=1/4 (got "${arg}")`);
  }
  return { n: n - 1, of };
}

module.exports = { shardOf };
```

The message is the one both current copies throw, unchanged.

S2. `tests/app/states.js`:

1. Add `const { shardOf } = require('./shard.js');` beside the other
   requires.
2. Before the runner: `const SHARD = shardOf(process.argv);` and
   `const MINE = CASES.filter((c, i) => !SHARD || i % SHARD.of === SHARD.n);`
   with a one-line comment: the interleave spreads the layout cases at the
   end of the list over every piece, as `golden.js` spreads its states.
3. The loop runs `MINE`, not `CASES`. Around `await fn()` take
   `const t0 = Date.now();` and, after the try/catch, write
   `fs.writeSync(1, 'took: ' + label + ' ' + ((Date.now() - t0) / 1000).toFixed(1) + 's\n');`.
   The line lands in `test-output/<row>.log` and in a failure artifact; it
   is the input of option D and of the next weight refresh.
4. The pass line reads
   `'real-input states (dist-test/): all ' + MINE.length + ' runs passed' + (SHARD ? ' (shard ' + (SHARD.n + 1) + '/' + SHARD.of + ' of ' + CASES.length + ')' : '')`.
   The failed line keeps its shape.
5. Header comment, lines 9-10: replace "Ninety-two cases in ninety-one runs
   (4 and 5 share one)" by a sentence without a count that goes stale, for
   example "One run per `CASES` entry (4 and 5 share one); `--shard=n/of`
   runs every `of`-th entry, as `golden.js` does."

S3. `tests/app/golden.js`, lines 41-52: replace the inline parse with
`const SHARD = require('./shard.js').shardOf(process.argv);`. Keep the comment
at lines 37-40. Every reader of `SHARD` (`SHARD.n`, `SHARD.of`) already uses
the 0-based `n`.

S4. `tests/run-all.js`:

1. Replace the parse at lines 144-151 with
   `const SHARD = require('./app/shard.js').shardOf(args);` and use
   `bins[SHARD.n]` and `SHARD.of` in the packer. Keep `shardArg` only where a
   message prints it, or print `SHARD.n + 1 + '/' + SHARD.of`.
2. `SUITES`: replace the `app/states` row with four rows and set every
   weight from section 1, sorted slowest first (the file's own rule):

   | Row | Weight | Args |
   |---|---|---|
   | `app/sweep` 768 | 838.7 | `['768']` |
   | `app/sweep` 390 | 670.2 | `['390']` |
   | `app/sweep` 360 | 639.1 | `['360']` |
   | `app/contracts` | 555.8 | |
   | `app/print` | 472.1 | |
   | `app/states` 1/4 to 4/4, what `'dist-test/: real input n/4'` | 440 each | `['--shard=n/4']` |
   | `app/golden` 4/4 | 396.1 | `['--shard=4/4']` |
   | `app/sweep` 1180 en | 386.9 | `['1180', 'en']` |
   | `app/sweep` 1180 ru | 380.5 | `['1180', 'ru']` |
   | `app/golden` 2/4 | 368.6 | `['--shard=2/4']` |
   | `app/golden` 3/4 | 361.4 | `['--shard=3/4']` |
   | `app/golden` 1/4 | 351.5 | `['--shard=1/4']` |
   | `app/typo` | 191.5 | |
   | `app/hues` | 85.5 | |
   | `stub` | 6.8 | |
   | `derived` | 2.5 | |
   | `dataint` | 1.4 | |
   | `craft` | 0.2 | |
   | `contracts` | 0.2 | |

   The 440 s is 1760 s / 4: run 42083009049 measured 1742.8 s for 97 cases,
   and the remediation added the case 107 block at 360.
3. Weight comment (lines 35-53): name the new source - the mean of runs
   42036663681 and 42102518161, 2026-11-05; `app/golden` 4/4 and
   `app/states` from run 42083009049, because shard 3 of run 42102518161 did
   not finish. Add two sentences: `app/states` runs as four rows of
   interleaved cases (its `--shard=n/4`) since one serial row passed the job's
   30-minute limit at 97 cases; inside a shard the rows run four at a time,
   so a shard lasts as long as its longest row, and splitting the longest row
   is the lever, not the weights. Cite the decision file of S7.
4. Tie comment (lines 126-143): the ties are now the four `app/states` rows
   (440 s) and `craft`/`contracts` (0.2 s); the stable-sort argument is
   unchanged. Fix "`browser` matrix is four calls of this" to five.
5. Add `--list`: after the shard block and before the build check (line
   164), when `args.includes('--list')`, print one line per queued row,
   `keyOf(s) + ' ' + s[2]`, then the sum, and `process.exit(0)`. It builds
   nothing and starts no browser.
6. After the build check, when `SHARD` is set, print one line:
   `'shard ' + (SHARD.n + 1) + '/' + SHARD.of + ': ' + queue.map(keyOf).join(', ')`.
   The job log then names the rows of a shard that is cancelled before its
   summary (run 42102518161 printed only `app/sweep` 768).
7. Usage comment (lines 1-7, 26-28) and `--help` (lines 78-100): add `--list`;
   name `app/states` beside `app/golden` and `app/sweep` as split rows, with
   `node tests/app/states.js --shard=n/4` as the one-row call; fix "five
   times" to stay correct.

S5. Run the proofs of section 6, in order, before the commit.

S6. `rtk npm run check:fast` (Bash timeout 600000). Commit:
`test(ci): run app/states as four interleaved shard rows`, with a body that
gives the cause (one serial row of 1743 s against a 30-minute job) and the
effect (CI's longest browser job about 15 min). Push.

S7. Durable homes, in the same commit:

1. `docs/specs/COVERAGE.md`, "Suites" (lines 424-432): "nineteen
   `run-all.js` rows" becomes twenty-two, with `app/states` split four ways
   by case index, beside the `app/golden` and `app/sweep` splits.
2. `.claude/README.md`, "Batch size and the fixed cost of a run": the CI row
   (line 1007) takes the measured push-to-last-gate time of this batch's run
   (S8) and its run id; a new row after line 1014,
   `node tests/app/states.js --shard=n/4`, with the CI figure (about 440 s
   per row) and "longer" locally; the paragraph at lines 1126-1131 names the
   2026-11-05 cause (the `app/states` row passed the 30-minute job limit).
3. `docs/decisions/2026-11-05-app-states-runs-as-four-interleaved-rows.md`
   from `.claude/templates/decision.template.md`. Title: "app/states runs as
   four interleaved rows; the browser job keeps 30 minutes". Decision: the
   split, where it lives (`tests/app/shard.js`, `tests/run-all.js`
   `SUITES`), and the rule to raise `of` to 5 when one `app/states` row
   passes 600 s on CI. Rejected: a 45-minute timeout (every push waits about
   31 min, and the row grows about 57 s per layout case); a sixth shard (no
   gain while `app/sweep` 768 is the 839 s floor, and it edits
   `ci-credit.mjs`); a split by case ranges (the heavy cases sit at the end
   of the list). Then `node tools/decisions.js`.
4. `issues/57/handoff.md`: remove the W-N4 line from Deferred.

S8. After the push, read CI (the orchestrator's one background
`ci-credit.mjs` call, `.claude/README.md`, "CI credit"). Record in the
handoff each `browser (n)` job's minutes, each `app/states` row's seconds and
the four pass lines' counts.

### Acceptance

1. `tests/app/shard.js` exists and is the only parse of `--shard=` in
   `tests/` (`git grep -n "shard=(" -- tests` finds only it).
2. `node tests/run-all.js --shard=n/5 --list` for n = 1 to 5 prints 22 rows
   in all, each row once, and the bins of section 5.
3. The four `app/states` rows land in four different shards.
4. `node tests/app/states.js --shard=1/40` runs exactly cases 1, 50 and 91,
   prints a `took:` line for each and ends with
   `all 3 runs passed (shard 1/40 of 97)`.
5. `node tests/app/states.js --shard=5/4` and
   `node tests/app/golden.js --shard=5/4` throw
   `--shard must look like --shard=1/4 (got "--shard=5/4")`.
6. `node tests/run-all.js derived,contracts` passes (the matrix and divisor
   check of `tests/derived.js` still reads five).
7. On CI of the pushed tip: every `browser (n)` job passes; each
   `app/states` row is under 600 s; the longest `browser (n)` job is under
   20 min; the four pass lines' counts are 25, 24, 24 and 24 of 97.
8. If an `app/states` row's CI time differs from 440 s by more than 25 %,
   the handoff records the measured values for the next weight refresh; the
   batch does not push a second time for it while acceptance 7 holds.
9. The docs of S7 are in the commit; `docs/DECISIONS.md` is rebuilt.
10. W-N4 is closed: no Deferred line names the stale `app/states` weight.
11. A case that fails on CI (not a timeout) is named in the handoff with its
    message and routed to the batch 9b remediation; it does not block this
    batch's review.

### Risks and settled decisions

- Do not raise `timeout-minutes` in this batch. The 30-minute limit is the
  hang guard of `ci.yml`'s `check` comment; B leaves it a 2x margin.
- Do not split by case ranges and do not hand-pick cases per piece: the
  interleave needs no upkeep when a case is added.
- Contention: four more Chrome processes spread over five 4-vCPU runners.
  Each shard still runs at most four rows at a time. If a shard's job
  passes 20 min on CI, record it; the response is a weight refresh, not a
  timeout change.
- The `took:` line is not printed by `run-all.js` on a green run: it is in
  `test-output/` only, which CI uploads on failure. That is accepted.

## 5. The expected bins

The packer's LPT rule over the weights of S4, simulated 2026-11-05 (the
`--list` output of acceptance 2 must match it):

| Shard | Rows | Sum | Longest row |
|---|---|---|---|
| 1 | `app/sweep:768`, `app/golden:--shard=4/4`, `app/golden:--shard=1/4` | 1586.3 | 838.7 |
| 2 | `app/sweep:390`, `app/states:--shard=4/4`, `app/golden:--shard=3/4` | 1471.6 | 670.2 |
| 3 | `app/sweep:360`, `app/states:--shard=3/4`, `app/golden:--shard=2/4`, `stub`, `derived`, `dataint`, `craft`, `contracts` | 1458.8 | 639.1 |
| 4 | `app/contracts`, `app/states:--shard=2/4`, `app/sweep:1180-ru`, `app/hues` | 1461.8 | 555.8 |
| 5 | `app/print`, `app/states:--shard=1/4`, `app/sweep:1180-en`, `app/typo` | 1490.5 | 472.1 |

Expected job times: about 15.2, 12.4, 11.8, 10.4 and 9.0 min. For
comparison, `app/states` as one row with the same fresh weights lands alone
in a shard of 1760 s, which still passes the step's 1730 s. At 1.5 times the
current `app/states` cost (2640 s, 660 s per row) the longest job is still
`app/sweep` 768.

## 6. Proof without a 30-minute local run

The tree is idle; each command fits one foreground call.

| Command | Proves | Expected |
|---|---|---|
| `node tests/run-all.js --shard=1/5 --list` (and 2/5 to 5/5) | the packing, disjoint and exhaustive | section 5; 22 rows in all |
| `npm run build:test`, then `node tests/app/states.js --shard=1/40` | the filter, the `took:` line and the summary line in a real browser | cases 1, 50, 91; about 2-4 min |
| `node tests/app/states.js --shard=5/4`; `node tests/app/golden.js --shard=5/4` | the shared parse and its message | the error of acceptance 5, within seconds |
| `node tests/run-all.js derived,contracts` | the matrix and divisor check | pass |
| `rtk npm run check:fast` | format, lint, the commit gate | pass |
| CI of the pushed tip | the wall time and the counts | acceptance 7 |

## 7. Gate cost

One batch, one commit, one push: no split, because every change shares one
gate (a CI run of the browser matrix).

| Gate | Cost |
|---|---|
| `--list` runs, the parse checks, `derived,contracts` | under 1 min |
| `build:test` and `states.js --shard=1/40` | 3-5 min |
| `rtk npm run check:fast` | 5-15 min (tests/ and docs only) |
| CI of the tip | about 15 min |
| Batch review | one reviewer pass |

Total: about 25-35 min of gates.

## 8. Deferred

- Option D, the case speed-ups: after a run with `took:` lines (a failure
  artifact, or one local `node tests/app/states.js --shard=n/4`), name the
  five slowest cases and measure one context with `setViewport` per width
  against a `fresh()` context per cell. A later batch or its own task; not
  task 57's closeout blocker.
- Output streaming: `run-all.js` writes a row's log only when the row ends,
  so a job cancelled by its timeout uploads nothing of the running row. A
  step-level `timeout-minutes` below the job's, with `run-all.js` streaming
  each row's output to its file, would keep that evidence. Not needed while
  the longest job is about half the limit; name it to the owner at closeout.
- The `app/sweep` 768 row (839 s) is the new floor of CI wall time. Split it
  only if a push-to-gate time above 15 min starts to cost real waiting.
