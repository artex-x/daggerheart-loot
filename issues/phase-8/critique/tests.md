# phase-8 critique: the test suites and the CI's shape

Read-only review. Nothing here was run against this tree: every number below
comes from GitHub Actions job/step timestamps and the `tests/run-all.js`
summary that CI printed, not from a local execution.

**Evidence base.** Run `35214847899` (push to main, all green,
2026-09-17 11:16:49Z - 11:29:07Z, 738s wall) is the primary measurement;
run `35208323705` (10:01:57Z - 10:14:36Z) is the control. Per-step times are
`gh run view <id> --json jobs`; per-suite times are the run-all summary in the
check job's log. Local weights quoted in brackets are
`tests/run-all.js:41-58`, measured on the Windows host.

---

## 0. The measurements, before any finding

### 0.1 Jobs, run 35214847899

| job | wall | fixed cost (provision, checkout, setup-node, npm ci, build) | useful work |
|---|---|---|---|
| `check` | 689s | 14s setup + 2s build + 1s smoke + 0s budget = 17s | 89s `npm run check` + **582s** `run-all --exclude=app/golden` |
| `golden (1)` | 128s | 22s | 106s |
| `golden (2)` | 126s | 24s | 102s |
| `golden (3)` | 121s | 23s | 98s |
| `golden (4)` | 115s | 21s | 94s |
| `audit` | 17s | ~10s | ~7s `npm audit` |
| `secrets` | 8s | - | 8s gitleaks |
| `deploy` | 40s | 11s npm ci + 2s build | collect + verify + publish |

Control run 35208323705: `check` 633s (`npm run check` 53s, run-all 562s),
goldens 106/101/98/94s, deploy 41s. The shape is stable; only
`npm run check` itself varies (53-89s).

**Per-job fixed cost is ~20s** (checkout 3-4s, setup-node 1-2s, `npm ci`
8-10s with the cache warm, `npm run build` 1.9s, provisioning 1-2s). That
number is the single most useful one in this document: *an extra CI job is
worth adding whenever it removes more than 20s from the critical path.*

### 0.2 Inside `npm run check` (89s of the 689s check job)

| link | seconds |
|---|---|
| `prettier --check .` | 4.6 |
| `eslint .` | 14.0 |
| `svelte-check` | 5.8 |
| `node --check` check-site + `npm run data` + `derived.js` + hook selftest + two `node --test` suites | 8.1 |
| `vitest run --coverage` (42 files, 1053 tests) | 55.5 |

vitest's own report: `Duration 54.65s (transform 5.51s, setup 5.43s, import
14.94s, tests 90.30s, environment 38.41s)`.

### 0.3 Inside `run-all --exclude=app/golden` (582s of the 689s check job)

CI seconds, then the local weight the scheduler uses:

| suite | CI | weight | ratio |
|---|---|---|---|
| `app/sweep 1180` | **550.5** | 370 | 1.5x |
| `app/sweep 390` | 326.6 | 320 | 1.0x |
| `app/sweep 360` | 325.0 | 320 | 1.0x |
| `app/sweep 768` | 318.8 | 320 | 1.0x |
| `app/contracts` | **256.4** | 120 | **2.1x** |
| `app/print` | 159.7 | 176 | 0.9x |
| `app/states` | 102.7 | 90 | 1.1x |
| `app/typo` | 78.1 | 40 | **2.0x** |
| `app/hues` | **66.9** | 12 | **5.6x** |
| `stub` | 1.6 | 5 | |
| `dataint` | 0.3 | 14 | |
| `derived` | 0.3 | 8 | |
| `craft` | 0.1 | 7 | |
| `contracts` | 0.0 | 30 | |

Sum = **2187 CPU-seconds**, run 4-wide (the summary line reads "за 581с (в 4
потока)"), so `os.cpus().length` is 4 on `ubuntu-latest` and
`run-all.js:63`'s cap of 8 never binds. Efficiency 2187/581 = **3.76x of a
theoretical 4x** - the pool is near-saturated and packed almost perfectly.
The residual 34s of slack is scheduling, not overhead.

Goldens: 400 CPU-seconds total, and `tests/app/golden.js:429` is a plain
sequential `for (const state of wanted)` - **each golden job uses 1 of its
runner's 4 vCPUs**.

### 0.4 The critical path to `deploy`

`deploy` needs `[check, audit, secrets, golden]`. In run 35214847899 those
four finished at 11:28:22 / 11:17:10 / 11:17:00 / 11:19:01. `check` owns
the last **561s alone**; the golden matrix sits finished and idle for
**9 minutes 21 seconds** before `deploy` may start.

**The owner's premise needs correcting before the question can be answered.**
`check` is not "about 11.5 minutes of a long `&&` chain". The `&&` chain is
**89s, 13% of the job**. The other 84% is one step: the browser suites. Any
effort aimed at `format:check`/`lint`/`typecheck`/vitest is aimed at the
wrong 13%.

---

## Worth doing, ranked

### T1 - The four golden shards are not the waste; `check` owning all 2187 CPU-seconds of browser work is

`.github/workflows/ci.yml:46-47` (check step 9) and `:67-98` (golden matrix)

**Problem.** The workflow allocates 5 runners x 4 vCPUs = 20 vCPUs and puts
85% of the work on 4 of them. `check` runs 2187 CPU-seconds 4-wide (581s
wall); the golden matrix runs 400 CPU-seconds 1-wide across four runners
(128s wall) and then waits 9m21s.

**Answering "fewer shards, or none?" with the numbers.**

- **One golden job instead of four**: 22s fixed + 400s sequential = **422s**.
  `check` is 689s, so 422s still hides underneath it: **wall clock is
  unchanged at 738s**. It saves 3 x 22s = 66s of billed runner time and
  gives up `fail-fast: false` independence plus the headroom - at 422s a
  single job is already 61% of `check`, so a 1.6x growth of
  `tests/app/inventory.js` would make it the critical path.
- **Per-shard fixed cost vs useful work**: 22s against ~100s, i.e. 22%. It
  does *not* exceed the useful work, so the shards are not "pure waste" by
  the brief's own test. What is true is narrower and worse: **90s of billed
  runner time buys 0s of wall clock**, because the shards are not on the
  critical path at all.

So neither removing nor keeping the golden sharding moves the number the
owner cares about. The lever is to give those runners the browser work that
is currently stuck behind one job.

**Smallest fix** (no new harness, no framework change):

1. Give `tests/run-all.js` a `--shard=n/m` that partitions its `queue` by
   longest-processing-time-first over the existing weight column - the same
   flag and the same disjoint-and-exhaustive contract
   `tests/app/golden.js:35-48` already implements.
2. Drop `--exclude=app/golden` so the four golden rows join the pool.
3. Replace `check`'s step 9 and the whole `golden:` job with one `browser:`
   matrix of 4, each running `node tests/run-all.js --shard=N/4`.
4. `check` keeps only the `&&` chain plus build/smoke/budget.
5. `deploy.needs` becomes `[check, audit, secrets, browser]`; this also
   requires editing `tests/derived.js:540`, which hard-codes
   `names.includes('golden')`.

**Projected wall clock.** Work to distribute is 2187 + 400 = 2587
CPU-seconds; each job runs it 4-wide, so the floor is
`max(2587 / 16, longest single task) + 20s`. Today the longest single task
is `app/sweep 1180` at 550.5s (see T2), so without T2 the floor is 570s and
the total becomes ~610s: **-17%**. With T2 applied the longest task is
`app/sweep 390` at 326.6s and a packing falls out naturally:

| job | contents (CI seconds) | wall |
|---|---|---|
| 1 | sweep390 327, sweep1180-ru ~275, golden1 106, typo 78 | ~327 |
| 2 | sweep360 325, sweep1180-en ~275, golden2 102, hues 67 | ~325 |
| 3 | sweep768 319, app/contracts 256, golden3 98, states 103 | ~319 |
| 4 | app/print 160, golden4 94, the five fs suites 2.3 | ~160 |

Critical path = 20s + 327s = 347s, `check` = ~106s, `deploy` = 40s.
**Total ~390s against today's 738s: -47%, 12m18s -> ~6m30s.**

**The honest cost.** Billed runner time goes *up*: today
689+128+126+121+115+17+8+40 = 1244 job-seconds (~21 runner-minutes); after,
~1382 job-seconds (~23 runner-minutes), +10%. That is the trade - 10% more
billed minutes for 47% less wall clock. On a public repo it is free; state
it anyway so nobody is surprised.

**Effort/value.** Effort: one flag in `run-all.js` (~30 lines), a matrix
rewrite in `ci.yml`, one line in `tests/derived.js`. Value: highest in this
document. No coverage is lost - the same 18 rows run, the same 110 goldens
run, only the runner they sit on changes.

**Prerequisite:** T5 (the weights). An LPT packer keyed on a weight column
that is 5.6x wrong for `app/hues` will mis-pack.

---

### T2 - `app/sweep 1180` is 550.5s in one process, and floors every arrangement

`tests/app/sweep.js:230-390`, `tests/run-all.js:41`

**Problem.** 550.5s is 25% of all browser work and it is a single
single-threaded process. No amount of sharding gets the wall clock below it.
Its three siblings average 323.5s; the 227s delta is exactly the work only
1180 does: axe with `color-contrast` over 50 addresses in **both** languages
(`sweep.js:356` - the other widths run axe in RU only) plus the focus-ring
walk (`sweep.js:380-389`).

Solving 100b + 100a + F = 550.5 against 96b + 48a = 323 gives
50a + F = 214s: axe's English pass and the focus walk together account for
the whole excess, whichever way they divide.

**Smallest fix.** `sweep.js:13-14` already parses widths from argv; add an
optional language argument the same way, and split the one `run-all.js` row
into a `['1180', 'ru']` row and a `['1180', 'en']` twin (the focus walk
stays on the RU row, `sweep.js:380`). 18 rows become 19. This is the shape
`run-all.js:29-39`'s own comment already argues for - the widths are four
tasks rather than one long one, and at 1180 the same is true of the two
languages.

**Effort/value.** Effort: ~10 lines. Value: on its own, only ~20s (the pool
is CPU-bound at 4 either way). **Combined with T1 it is worth 223s of
critical path** - it is what takes the projected total from 610s to 390s.
Do not do T2 without T1; do not do T1 without T2.

**Coverage lost:** none. Same addresses, same widths, same languages, same
axe configuration; only the process boundary moves.

---

### T3 - `tests/app/contracts.js` opens ~70 browser contexts to check ~70 fixtures

`tests/app/contracts.js:33, 56, 68, 78, 100, 119, 129, 195`

**Problem.** The suite costs 256.4s in CI against a local weight of 120.
It calls `fresh()` (a new browser context, a fresh `file://` navigation and
a re-parse of the 661 KB `data.js`) **once per fixture**: 6 list fixtures
x3, 28 route fixtures, 12 + 6 filter probes in `rowsAt`, plus five one-offs
- about 70 contexts, ~3.7s each.

The file is inconsistent with itself: the stat-line section
(`contracts.js:169-182`) already reuses **one** context per language across
all its ids, and `tests/app/sweep.js` walks 48 addresses in a single
context at ~1.2s per address. `tests/app/golden.js` establishes the floor
cost of a context at 400s/220 = ~1.8s.

**Smallest fix.** In the two sections that seed no storage - the
address-grammar loop (`:128-164`) and `rowsAt` (`:194-199`) - hoist
`fresh()` out of the loop and reuse one context, clearing storage between
opens. Leave the list-fixture sections alone; they seed per-fixture storage
and a shared context would leak.

**Estimated saving**: 46 contexts x ~1.8s = ~83s, taking the suite from
256s to ~175s. Flagged as an estimate: it is derived from golden.js's
measured per-context floor, not from a run of the changed code.

**Effort/value.** Effort: ~20 lines. Value: 83s of billed time and a much
faster local `run-all.js app/contracts`. Under T1's packing it does not move
the critical path (job 3's floor is sweep768 at 319s), so this is an
iteration-speed and billed-minutes win, not a wall-clock one. Be honest
about that when prioritising.

---

### T4 - The derived-files gate cannot fail in the pipeline that runs it

`package.json:23`, `tests/derived.js:19-22`

**Problem.** `npm run check` is, in order,
`... && npm run data && node tests/derived.js && ...`.
`npm run data` regenerates `data.json`, `catalog.csv` and `i/*.html`, and
`tests/derived.js:21-22` then rebuilds them in memory and compares them to
disk with the message "устарел - запусти node tools/build.js". It is
comparing the generator against a file the generator wrote 0.1s earlier
(measured: the build finished 11:17:32.6, the whole block ended
11:17:40.4). **That assertion cannot fail here.** Its own header comment
states the failure it exists to catch - edit the data, forget to rebuild,
and they diverge silently - and the pipeline it lives in performs the
forgotten rebuild before the check looks.

`data.json` and `catalog.csv` are tracked (`git ls-files` confirms), and
nothing anywhere runs `git diff --exit-code`: no such string exists in
`.github/`, `.claude/hooks/`, `package.json` or `tools/`. So a commit that
edits `data.js` without running `tools/build.js` is green in CI while the
committed artefacts are stale.

`docs/specs/COVERAGE.md:55` records this as live coverage - "`data.json` /
`catalog.csv` / `i/*.html` rebuilt and compared byte for byte" - which is
mechanically true and operationally empty.

**Blast radius is limited but real.** `deploy` rebuilds before publishing
(`ci.yml:178-179`, then the copy at `:199`), so the *site* is correct. What
drifts is the repository copy - and `catalog.csv` is the agent-facing
artefact.

**Smallest fix.** One step in `ci.yml`'s check job, after `npm run check`:
`git diff --exit-code -- data.json catalog.csv`. CI-only on purpose:
locally the tree is legitimately dirty between editing `data.js` and
committing, so putting it in `package.json`'s `check` would fail every
honest data change. Reordering `derived.js` before `npm run data` does not
work either - `i/` has been untracked since `f53f44d`, so on a clean
checkout `derived.js` would fail for the wrong reason.

**Effort/value.** Effort: 2 lines. Value: high - this is a gate that reads
as protection and is not one, and the spec records it as coverage.

---

### T5 - `run-all.js`'s weight table is a local measurement scheduling a CI pool, and three rows are >2x wrong

`tests/run-all.js:29-59`

**Problem.** The comment is candid that the numbers are past measurements
kept only for start order, but that order is what packs the pool. Against
CI: `app/hues` is weighted 12 and costs **66.9s** (5.6x), so it is
scheduled 17th of 18 and can become the straggler; `app/typo` 40 vs 78.1s;
`app/contracts` 120 vs 256.4s. In the other direction `contracts` is
weighted 30 and costs 0.0s, and the four golden rows are weighted 250-265
against 94-106s in CI - that last one is a genuine host difference, since
the goldens really are slow on the Windows host (`.claude/README.md:239`).

Measured cost of the mis-ordering today: wall 581s against an ideal
2187/4 = 547s, i.e. **34s**. Small on its own - but T1 turns this column
into the input of a bin-packer, at which point a 5.6x error is a mis-packed
shard.

**Smallest fix.** Update the column to the CI seconds in section 0.3, keep
the local numbers where they are needed (`.claude/README.md`'s per-gate
table), and say in the comment which host each set came from and on what
date - the repository's existing doctrine that a local run is advisory
applies to weights too.

**Effort/value.** Effort: one table. Value: 34s today; a prerequisite for T1.

---

### T6 - The instrument that replaced visual parity has no test of its own

`tests/app/golden.js` (489 lines, **no `module.exports`**)

**Problem.** `docs/specs/COVERAGE.md:85` documents at length what the
structural goldens are blind to - rule A's elision of same-signature
siblings, rule B's 64-code-point name truncation, the positional retention
of first-two and last-two. All of that is implemented by private functions
in `golden.js` (`collapse`, `normUrl`, `clean`, the `bySig` retention at
`:171-179`, `namelen`/`namehash`, `sectionsOf`, `headerOf`,
`compareGolden`) that **nothing imports and nothing tests**.
`tests/app/lib.js:169`, `driver.js:745` and `inventory.js:1060` all export;
`golden.js` alone does not.

The only thing standing behind the normaliser is that the 110 snapshots do
not change. A bug that elides *more* than rule A says - an off-by-one in
`idxs.slice(0, 2)` / `idxs.slice(-2)`, say - would be committed together
with the re-seeded goldens it produced, and every later run would pass while
seeing less. That is the failure mode a golden suite is most vulnerable to,
and COVERAGE.md's five-layer enforcement table does not reach it.

**Smallest fix.** Add `module.exports` for the pure half and one
`node --test` case beside the two `tools/*/lib.test.mjs` suites already in
`npm run check` (six steps there cost 8.1s combined, so the marginal cost is
under a second): synthetic trees exercising rule A at 5 and 6 siblings,
rule B at 63/64/65 code points, rule 3's joined-versus-split text node,
`normUrl` on a `file://` url and on a real outbound one, and
`sectionsOf`/`headerOf` round-tripping.

**Effort/value.** Effort: an export line plus ~120 lines of test. Value:
high. **No coverage is lost and none of the 110 snapshots is touched** -
this only adds a guard under the code that produces them.

---

### T7 - Russian in test code: 560 lines, and the vitest pyramid is already clean

`CLAUDE.md:139`: "Source, identifiers, tests, and developer docs are
English. Product text may be Russian."

**Inventory.** Every Cyrillic-bearing line in `tests/**` and
`app/src/**/*.test.ts`, classified by whether the Cyrillic sits in a
comment, in an assertion or log message, or elsewhere (product text, seed
data, selectors):

| | comments | messages | product text etc. |
|---|---|---|---|
| `tests/*.js` + `tests/app/*.js` | **160** | **377** | 233 |
| `app/src/**/*.test.ts` | 23 | **0** | 1465 |

The 377 message strings, by file: `tests/app/print.js` 132,
`tests/derived.js` 75, `tests/dataint.js` 63, `tests/app/states.js` 61,
`tests/app/sweep.js` 13, `tests/app/hues.js` 9, `tests/app/golden.js` 6,
`tests/app/contracts.js` 6, `tests/craft.js` 4, `tests/app/typo.js` 3,
`tests/run-all.js` 2, and one each in `driver.js`, `stub.js`, `lib.js`.

The 160 comment lines: `tests/derived.js` 127, `run-all.js` 11, `craft.js`
6, `dataint.js` 5, `inventory.js` 4, and two or fewer in four more.

**The split the brief asks for is clean, with two traps.**

*Legitimately Russian, must stay*: the 1465 lines in the vitest suites, and
`tests/app/inventory.js:79-103`'s accessible-name table - that file's 137
Cyrillic lines are entries like `copyName: 'Скопировать название'` keyed by
English identifiers, which is exactly the right pattern and should be the
model for the rest.

*Must become English*: the 377 messages. `tests/derived.js:125` -
`ok(key in shareFacts, 'из головы app/index.html пропал ' + key)` - is
representative.

*Trap 1*: a Russian literal on an `ok(...)` line is not always a message.
`tests/app/contracts.js:81` reads
`ok(/повреждена|damaged/i.test(seenCut), '...')` - that regex is product
text and must not be touched. `tests/app/print.js:266-292` is full of the
same. A blind substitution breaks these, so the 377 need a per-line read
even though each line's fix is trivial.

*Trap 2*: many messages embed product text -
`'имя на карте другое: ' + parts.name`. Only the prefix moves.

*The comments are a different job.* `tests/derived.js` is 544 lines of
which 127 are Russian "why" prose, and CLAUDE.md's own rule is that
comments explain why. A lossy translation of an argument is worse than the
Russian original, so this half needs judgement per site, not a batch.

**Batching.** Not one batch - four, sized by gate rather than by diff:
(1) `tests/derived.js` alone, 202 lines, gate `npm run check` (~165s local);
(2) `tests/app/print.js`, 134 lines, gate `run-all.js app/print` (160s);
(3) `tests/dataint.js` + `tests/app/states.js`, 130 lines, gates `dataint`
and `app/states` (103s); (4) the remaining ten files, ~90 lines, gate
`run-all.js` minus the sweeps.

**Effort/value.** Effort: medium-high, four sessions. Value: medium. The
sharpest argument for doing it is that `tests/derived.js` is *already mixed*
- its newest block, the `deploy.needs` check at `:529-541`, is written in
English. A file half in each language is the worst state to leave it in,
and it will keep drifting that way one commit at a time.

---

### T8 - The golden job uploads a `test-output/` that is never written

`.github/workflows/ci.yml:89-98`

**Problem.** `test-output/` is created and filled by `tests/run-all.js:90`
and by nothing else - `tests/app/golden.js` writes only to
`tests/app/snapshots/`. The `golden` job runs `node tests/app/golden.js`
directly, so its failure artifact contains `dist/` and nothing else, and
`if-no-files-found: ignore` makes the absence silent. A red shard's actual
diff exists only in the job log, which is the "a CI run is gone by the time
anyone looks" problem `ci.yml:49-51` says the artifact solves.

**Smallest fix.** T1 dissolves this - under T1 the goldens run through
`run-all.js` and get their logs for free. If T1 is deferred, drop
`test-output/` from that job's `path:` so it stops advertising a log that
does not exist.

**Effort/value.** Effort: one line, or free under T1. Value: low-medium; it
matters exactly once, on the day a shard goes red.

---

### T9 - `expect(pills).toContain('Двуручное×')` and its three siblings

`app/src/components/tables.test.ts:765-766`

**Problem.** The assertion reads a filter pill's `textContent`, which
concatenates the label with the dismiss glyph, so the expected value carries
a `×` that is part of no label. The file already *explains* this at
`:762-763` ("`title`, not text, is its accessible name") - which is the
tell: an assertion that needs a comment to be read is asserting on the wrong
thing, and the clean value sits on the same node.

**Smallest fix.** Read `title` instead of `textContent`:

    const pills = [...container.querySelectorAll('.fpill')]
      .map((p) => p.getAttribute('title'));
    expect(pills).toContain('Двуручное');

Two lines, and it moves the assertion onto the accessible name a screen
reader actually reads.

**Siblings, and there are fewer than the framing suggests.** I looked for
the whole family. The `·`-separated expectations in `label.test.ts:82-222`
and `money.test.ts:168-251` are *not* siblings: they assert the return value
of `whereFrom` / `guessWhy` / `printSrc`, whose entire job is to compose
that string, so producing that exact text is the contract. The genuine
siblings are three:

- `app/src/components/record.test.ts:395, 406, 412` -
  `sub?.childNodes[0]?.textContent?.trim()`. Here the positional index is
  **load-bearing**: it isolates the first text node from the badges that
  follow, which is CLAUDE.md's "port the live app's text-node structure, not
  only its rendered string". The defect is that nothing says so. Fix: one
  comment, not a rewrite.
- `app/src/components/printPage.test.ts:341` - `spans?.[1]?.textContent`,
  positional with no comment at all.
- `app/src/components/listPage.test.ts:733` - `expect(text).not.toContain
  ('×2')` alongside `not.toContain('750')`. A negative assertion on a
  three-digit substring passes for the wrong reason the moment any other
  number appears. Weak, but a unit-level proof is cited two lines above, so
  it is a nit.

**Effort/value.** Effort: four edits, well under an hour. Value:
readability only - none of these is currently wrong. Do them in whichever
batch next touches those files.

---

### T10 - `tools/check-site.mjs` is gated by `node --check`, and `ci.yml` re-implements it in bash

`package.json:23`, `.github/workflows/ci.yml:232-265`, `tools/check-site.mjs`

**Problem.** Two halves of one problem.

`npm run check` includes `node --check tools/check-site.mjs` - a **syntax**
check. The file is the only thing in the repository that reads the live URL,
it runs exactly once per deploy against a URL no test can supply, and none
of COVERAGE.md's five enforcement layers reaches it.

Meanwhile `ci.yml:232-265` re-implements eight of its assertions in bash
against `_site`: `og:image` in `i/w1.html`, the 20000-byte bundle floor,
`noindex`, `assets/app.js`, `div id="app"`, the old-`app.js` regex,
`window.LOOT`. The comment says so outright ("the same by-name checks
tools/check-site.mjs makes"). Two implementations of one contract, in two
languages, with nothing keeping them in step - and the JS one is the one
that is never executed in a test.

**Smallest fix.** Not a rewrite: extract the assertion list from
`check-site.mjs` into an exported array of `{path, test, message}` and have
both the live check and a `node --test` case drive it, the way
`tools/tg-preview/lib.test.mjs` already separates pure logic from the live
client. The bash block can then shrink to the same list read off disk.

**Effort/value.** Effort: medium (~100 lines moved). Value: medium. Worth
recording now, worth doing when something next touches the deploy job.

---

### T11 - `tools/**` is outside every coverage gate, and COVERAGE.md does not say so

`vite.config.mts`, coverage `include: ['src/**/*.ts', 'src/**/*.svelte']`
under `root: 'app'`

**Problem.** COVERAGE.md:151 claims layer one is "Coverage `include` covers
everything that ships - a whole directory left out of the measurement". The
include is `app/src/**` only. `tools/` ships its output - `data.json`,
`catalog.csv` and `i/*.html` are all published by `deploy` - and is measured
by nothing: `tools/build.js`, `tools/build-share-pages.js` (188 lines),
`tools/derived.js`, `tools/bundle-budget.mjs`, `tools/smoke-file-url.mjs`,
`tools/check-site.mjs` and `tools/capture-share-fixture.mjs` (194 lines)
carry no threshold and no `perFile` rule. The two `tools/*/lib.test.mjs`
suites run under `node --test` with no coverage measurement at all, so a new
file in `tools/tg-preview/` or `tools/artwork/` is not *required* to be
reached - precisely the gap `perFile: true` exists to close inside
`app/src`.

Partly mitigated: `tests/derived.js` byte-compares `build.js`'s and
`build-share-pages.js`'s output (subject to T4), and `smoke-file-url.mjs`
and `bundle-budget.mjs` run on every CI build. `capture-share-fixture.mjs`
is the unmitigated one - it *produces* `docs/fixtures/share/records.json`,
the evidence `share.test.ts:69`'s golden is held to, so if it drifts, the
fixtures captured after the drift are wrong and the golden agrees with them.

**Smallest fix.** Not new thresholds - a paragraph in COVERAGE.md's "Known
thin spots" naming the boundary, so the enforcement table stops
over-claiming. A threshold for `tools/**` would mean a second coverage
runner and is not worth it.

**Effort/value.** Effort: one paragraph. Value: a spec-accuracy fix, which
is the cheap kind.

---

## Noticed, not worth it

**T12 - stale comment.** `tests/app/sweep.js:92` says the focus walk runs
"at 1180 and 360"; `sweep.js:380` runs it at 1180 only, and the comment at
`:376-379` says "at 1180 alone". Two comments in one file disagree.
One-line deletion, free in whichever batch touches the file.

**T13 - vitest spends 38.4s of 54.7s constructing jsdom.** The reported
split is `environment 38.41s, import 14.94s, tests 90.30s` over 42 files at
4 vCPUs - 0.9s of jsdom per file, and 1.65x effective parallelism. Halving
it would save ~27s on a path that T1 shortens to ~106s anyway, and the
fixes (`isolate: false`, environment globs) trade determinism for seconds
on a job that is no longer the critical path once T1 lands. Leave it.

**T14 - `derived`, `craft`, `dataint` and `stub` run twice per check job**
- once inside `npm run check` (`derived` only) and once inside `run-all`.
Total CI cost of the four in run-all: **2.3 seconds**. Both copies are
equally toothless against a stale artefact (T4). Not worth a change; noted
so nobody rediscovers it later as a saving.

**T15 - the five fs-only rows in `run-all.js` cost 2.3s combined**
(`contracts` 0.0, `dataint` 0.3, `derived` 0.3, `craft` 0.1, `stub` 1.6).
They are the only home those four suites have outside `npm run check`, so
the rows earn their place at zero cost. Keep all five.

**T16 - axe runs RU-only at 360/390/768** (`sweep.js:356`). The code argues
the case (contrast and heading order are a function of tokens and DOM
order, not of which language occupies a node) and the argument is sound.
`COVERAGE.md:79` states the split as a fact rather than as a gap; a
one-clause addition to "Known thin spots" would close the bookkeeping. Very
low value; mentioned only because the brief asked for gaps not already
recorded.

**T17 - `npm audit --audit-level=high` is its own 17s job** whose fixed
cost is ~10s of that 17s. It is genuinely a shard whose fixed cost
approaches its useful work - but it is 17s off the critical path, and
folding it into `check` would put it *on* the critical path. Leave it.

---

## Is the 18-row `SUITES` shape still right now that parity is gone?

Mostly yes, with one change and one qualification.

- **`app/golden` x4: keep.** In CI those four rows are excluded
  (`ci.yml:47`) and only the matrix runs them, so today the rows exist for
  local runs - where the weights (250-265s each, ~1000s unsharded) and
  `.claude/README.md:239` ("never as one bare `node tests/app/golden.js`
  call") still hold. Under T1 they stop being excluded and become the
  packer's input, which is the first time their granularity earns anything
  in CI.
- **`app/sweep` x4 -> x5.** See T2. The width split was right and remains
  right; the 1180 row has since grown a second language and a focus walk
  and is now 1.7x its siblings.
- **The five fs rows: keep** (T15).
- **The qualification** is CLAUDE.md's own batch-size rule, whose arithmetic
  T1 changes. `.claude/README.md:238` says "`app/sweep` as a whole is past
  the [600s] cap and must run width by width". That is a statement about a
  *local* foreground call and stays true. But a CI job's fixed cost is ~20s
  against gates of 100-550s, so the CI side of that reasoning - merge work
  that shares a gate, because the gate's fixed cost dominates - is simply
  false for CI jobs and true only for local ones. Worth one sentence in that
  section so the two are not confused: **a local gate's fixed cost is
  minutes; a CI job's is twenty seconds.**

---

## Recommendation

**Do T1 and T2 together, with T5 as their prerequisite.** That is the whole
answer to the owner's question, and it is not the answer the question
expected: *keep the sharding, and stop sharding the wrong thing.* The four
golden shards cost 90s of billed time and save nothing - but removing them
saves nothing either, because they are not on the critical path. What is on
the critical path is one job holding 2187 CPU-seconds of browser work, 550
of them inside a single process. Fixing both takes the workflow from 738s
to roughly 390s, for about ten percent more billed runner minutes.

**Then T4 and T6**, which are correctness rather than speed and are the two
cheapest high-value items here: a gate that cannot fail, and the goldens'
own normaliser with nothing underneath it.

**T3, T8, T9, T11 and T12** are campsite work for whichever batch next
touches those files. **T7** is a real standing-rule violation and a real
four-session cost; schedule it deliberately rather than attaching it to
something else.

**Verdict on the suites themselves:** they are in good shape. 1053 vitest
tests across 42 files, 110 structural goldens, seven real-Chrome suites and
a coverage gate with per-file and per-directory thresholds is a strong
instrument set, and `docs/specs/COVERAGE.md` is unusually honest about its
own blind spots. Nothing here argues for a new harness or a new framework.
The findings are four: one badly distributed workload, one gate with no
teeth, one untested normaliser, and a language rule the `tests/` tree never
got.
