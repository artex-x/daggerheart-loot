# Review - CI (57)

Verdict: approve
Reviewed: 22d9a00ba0b267acb9d477e349c61f3249ec5690
Scope: batch CI

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Diff read: `git diff 0f931af2 22d9a00b` (10 files). Read only; no suite, build or
browser was run. Acceptance 7, 8 and 11 wait for CI of the tip.

## Blockers

None.

What was verified, so a later reader does not repeat it:

- Every case runs exactly once across the four pieces. `CASES` has 97 entries
  (lines 8729-8828, 100 lines, entry 62 takes four). `MINE` is
  `CASES.filter((c, i) => !SHARD || i % SHARD.of === SHARD.n)`: the index is
  the array position, not the label number, so the label gaps (7, 8, 20, 25,
  34, 38, 47, 48, 51) do not matter. The residues 0-3 partition 0..96 into 25,
  24, 24 and 24. `--shard=1/40` picks indices 0, 40 and 80, which are the
  labels 1, 50 and 91, as acceptance 4 says.
- The pieces are independent. `filter` keeps the order, so a piece runs a
  subsequence of the full run: a piece can lose a predecessor's side effect,
  never gain a new one. No case reads a predecessor's side effect: the only
  module state is `rep` (a fail counter and a dedupe set); the only
  default-context page is case 28's own `sharedPage`, which unregisters its
  worker in a `finally`; `d.download()` keeps the file in the page
  (`window.__download`), not on disk; the server listens on port 0 per
  process (`serve.js`), so each process has its own origin; each process
  launches its own browser.
- The `/tmp` question of the plan's constraint: the one disk write is case 59,
  `os.tmpdir()/dhloot-state-59-<pid>.zip`, removed in its `finally`. Two
  pieces have two pids. On CI the four pieces sit in four different shards,
  so four different runners; only a local `node tests/run-all.js app/states`
  runs them side by side, and there the pid keeps them apart.
- The packer. I re-ran the LPT rule by hand over the new `SUITES`: the bins
  are those of `plan-ci.md` section 5 to the decimal (1586.3, 1471.6, 1458.8,
  1461.8, 1490.5), with `app/states` 4/4, 3/4, 2/4 and 1/4 in shards 2, 3, 4
  and 5. The table is sorted slowest first. The two tie groups (the four 440
  rows, `craft`/`contracts` at 0.2) are kept in `SUITES` order by the stable
  sort, and "lightest bin" takes the lowest index on equal totals with a
  strict `<`, so five processes agree. The weights are the means of section 1
  (838.65, 670.2, 639.1, 555.8, 472.05, 396.1, 386.85, 380.5, 368.6, 361.35,
  351.5, 191.45, 85.45), rounded to one decimal.
- `--list` exits before the build check, before `fs.rmSync` of
  `test-output/` and before any spawn: it builds nothing and starts no
  browser. `--list` is not read as a suite name (`a[0] !== '-'`).
- Unsharded and `--shard=1/1` behavior. `run-all.js` without `--shard` skips
  the packer and the start line, as before, and now queues 22 rows.
  `states.js` without `--shard` runs all 97 entries; with `--shard=1/1` it
  runs all of them and only adds `(shard 1/1 of 97)` to the pass line.
- The bad-shard message. `shardOf` keeps the old regex, the old `!n || !of ||
  n < 1 || n > of` test and the old text, so `--shard=5/4` and `--shard=0/4`
  throw `--shard must look like --shard=1/4 (got "--shard=5/4")` in all three
  readers. `git grep` finds `--shard=` parsed only in `tests/app/shard.js`.
- `golden.js` is unchanged in behavior: the same `{ n: n - 1, of }` object at
  the same point, before its lazy `require('./lib.js')`; `shard.js` requires
  nothing.
- The report keys `app/states:--shard=n/4` are distinct, and `fileOf` turns
  them into `app-states--shard-n-4.log`, which has no colon and does not
  collide with `app-golden--shard-n-4.log`. The `took:` lines do not match the
  summary's `/FAIL|Error/` filter (no case label holds `Error`).
- `ci-credit.mjs` `REQUIRED_JOBS` still names `browser (1)` to `browser (5)`;
  `ci.yml` keeps `shard: [1, 2, 3, 4, 5]` and `--shard=${{ matrix.shard }}/5`,
  so the matrix-divisor check in `tests/derived.js` still holds. Nothing else
  reads `SUITES` or the row names. `tests/derived.js` resolves the decision
  path that the `run-all.js` comment cites, and the decision file exists.
- The commit message has no AI attribution.

## Risks

- R1 (not blocking). The interleave does not split the slow cases equally.
  The layout cases 83-107 are indices 72-96. Piece 1/4 gets seven of them
  (83, 87, 91, 95, 99, 103 and 107 with its 360 block), the other pieces six
  each, and 101 (74 contexts) and 105 both go to piece 3/4. The 440 s per
  row is 1760 s / 4, a projection, so one row can differ from it by more
  than 25 %. Acceptance 8 records the measured numbers, and the decision's
  600 s rule covers the case where a row grows too much. A row of 600 s in
  shard 5 still gives a job of about 11 min, so this is not a timeout risk.
- R2 (not blocking). The timing cases (52-54 "within 1 s", case 68's
  medians) now run beside other neighbors, for example 4/4 beside
  `app/sweep` 390 and `app/golden` 3/4. Before, the one row ran beside
  `app/sweep` 768 and `app/golden` 4/4: the same three Chrome processes on 4
  vCPU, so the load is the same. A timing failure on CI here would be
  contention, not the split. Name it under acceptance 11 if it occurs.

## Nits

- N1 (local). `tests/run-all.js`, weight comment: it says "`app/golden` 4/4
  and `app/states` are from run 42083009049". The 396.1 is the mean of 404.3
  (run 42036663681) and 387.9 (run 42083009049), and the 440 is a projection
  (1742.8 s plus an estimate for the 360 block of case 107, divided by four),
  not a measured number. Write both facts, so the comment keeps its rule
  "CI seconds, not a local guess". Example: "`app/golden` 4/4 is the mean of
  42036663681 and 42083009049; `app/states` is about 1760 s / 4, from
  1742.8 s in 42083009049 plus the 360 block of case 107, until a CI run
  measures the four rows".
- N2 (local). `.claude/README.md`, "Batch size and the fixed cost of a
  run": this batch added a row to the table. Two rows next to it are now
  wrong, and an agent can read them as a call that fits 600 s. The row
  `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`
  says "~260-290s pooled": on CI, `app/contracts` alone takes 556 s, and
  the four `app/states` rows take about 440 s each. The row
  `node tests/run-all.js <suites> --shard=n/m` says "up to ~372s for one
  bin": the new bins hold 1459-1586 s of weight, and shard 1 has a
  wall-clock floor of about 840 s. The S8 docs commit changes this table
  (the CI row), so correct these two rows in the same commit.
- N3 (local). `issues/57/handoff.md`. The batch CI entry under Completed has
  no `Review:` line (template). Status still says "not pushed" and "Pushed:
  up to `6578a2c7`", but the tip `22d9a00b` is pushed. Notes, "Durable items
  written to their homes this pass", names the 9b items, not those of this
  batch (`COVERAGE.md` "Suites", `.claude/README.md` "Batch size", the
  decision file). Correct these lines in the S8 update.
- N4 (local). `docs/specs/COVERAGE.md`, the `app/states` row of the suite
  table: "the ninety-five states". `CASES` has 97 entries. The count was
  stale before this batch, but the batch changed the same file to fix stale
  counts. Remove the count, as the `states.js` header now does.
- N5 (local, optional). `tests/app/states.js` reads `--shard` only after
  `require('./lib.js')`, and `assertBuilt` runs at that require. On a tree
  with no `dist-test/`, a bad `--shard` therefore shows the build message
  first. Nothing breaks. To fix it, put
  `const SHARD = shardOf(process.argv);` under the requires and keep `MINE`
  where it is.
- N6 (deferred-scope). The stale figures outside the batch's paths:
  - `ci.yml`, the `browser` comment: "a CI job's fixed cost is ~20 s". This
    is the figure that the batch corrected to about 70 s in `.claude/README.md`.
  - `.claude/hooks/bash-guard.mjs`, the `run-all` long-check cost: "up to
    ~380s for one --shard=n/4 row".
  - There is no long-check reminder for a bare `node tests/app/states.js`
    (about 30 min serial on CI), but `golden` and `sweep` have one.
  - The plan keeps `ci.yml` and the hooks out of scope: a hook change needs
    selftest cases. Name these items at closeout.

## Deviations

- The start line `shard n/m: <rows>` prints after the empty-queue check: accepted.
  An empty shard now exits with its own message and prints no start line, and
  the line still comes before the first spawn.
- The help text says "once per shard" and gives no count: accepted. It
  cannot go stale when the matrix changes.
- The fixed cost in `.claude/README.md` changed from "about twenty seconds" to
  about seventy: accepted. It agrees with `plan-ci.md` section 1 (10 + 49-50
  + 5-6 s), and "not ten minutes" keeps the sentence true.
- The `--list` sum line reads `sum <s>`: accepted.

## Standing checks

1. Scale: checked. The batch has no screen. The scale axis here is the case
   count: 97 entries give 25/24/24/24; each new case goes to piece
   `index % 4` with no upkeep; the decision sets `of` to 5 when one row passes
   600 s. At 1.5x the cost of `app/states`, `app/sweep` 768 is still the
   floor (`plan-ci.md` section 5). The row order is the `SUITES` order, and
   the summary follows it.
2. Error scenarios: checked. The batch has no stored data. A malformed
   `--shard` throws the old message in all three readers before a browser
   starts. A case that throws is caught per case, and its `took:` line is
   written after the `catch`. A job that its timeout cancels now prints the
   rows of the shard at the start. A hung case writes no `took:` line, but
   its `running:` line names it. Two processes cannot write the same file:
   only case 59 writes to disk, and its name holds the pid.
3. Consistency: checked. `states.js --shard=n/of` takes the grammar,
   the 0-based `n` and the `i % of` rule of `golden.js` from one parse. The
   row text `dist-test/: real input n/4` follows `structural snapshots n/4`.
   `--help`, the usage comment, `COVERAGE.md` "Suites" and the decision file
   name the same split.
4. RU/EN parity: not applicable. The batch adds or changes no product
   string. The changed text is test output and developer documents, in
   English.

Owner rules: not applicable. `context.md` tags no rule with batch CI, and
the plan names no owner statement for it. The memory rule "no
Co-Authored-By trailer" holds in the commit.

## Suggested next action

Wait for CI of `22d9a00b`: it is the proof of acceptance 7, 8 and 11. Then
write S8 in one docs commit:

- the `browser (n)` minutes, the four `app/states` row seconds and the pass
  lines in the handoff;
- the push-to-last-gate time in the `.claude/README.md` CI row;
- the local nits N1-N4 (N5 if wanted), which touch only this batch's paths;
- N6 in the handoff Deferred.

No second review is needed for the nits. Then go on to the refresh of batch T.

## Checks still needed

- CI of `22d9a00b`:
  - every `browser (n)` job passes;
  - each `app/states` row is under 600 s;
  - the longest job is under 20 min;
  - the pass lines are `all 25 runs passed (shard 1/4 of 97)` and
    `all 24 ...` for 2/4, 3/4 and 4/4;
  - the start line of each shard matches `plan-ci.md` section 5.
- For acceptance 8: the four row seconds against 440 s. Piece 1/4 (seven
  layout cases) and piece 3/4 (cases 101 and 105) are the likely outliers.
- The 9b remediation items that the handoff routes through this CI run
  (`check` coverage, `app/sweep` 360/390/768, `app/typo`, `app/print`,
  `app/states` 83/65/101/104-107, the goldens, `e2e`).
