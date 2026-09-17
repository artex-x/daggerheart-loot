# Handoff - TASK phase-8
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (B1 `e7c7b50`, B2 `44b1761` committed; B3
  committed this pass; B4 next)
- Last agent: implementer (2026-09-17)
- NEEDS_HUMAN_CONFIRMATION: no - all eight questions and the two further
  decisions are settled (`context.md`, "Settled owner decisions"); the plan
  is written as decided.
- Branch: `main`
- Base / starting commit: `f53f44d`; HEAD after this batch: see "Completed",
  B3's commit(s) below.

## Completed

### B1 - search normalisation (O1 + PF2)
- What shipped: `foldQuery()` in `app/src/lib/search.ts` (case fold,
  `ё`/`Ё` as `е`, U+2019/U+02BC as `'`) on both the query and the catalogue;
  `hayFor(statLine)` memoises a per-record array of folded fields by id (an
  array, not one joined string, so the cached and field-by-field fallback
  paths agree on every query by construction); `matches()`/`search()` take
  an optional `hay`; `SearchPage`/`TablesPage` fold once per language. One
  `FEATURES.md` bullet.
- Files changed: `app/src/lib/search.ts`, `app/src/lib/search.test.ts`
  (three new tests), `app/src/components/SearchPage.svelte`,
  `app/src/components/TablesPage.svelte` (no template change in either),
  `docs/specs/FEATURES.md`.
- Commit(s): `e7c7b50 fix(search): fold ё and typographic apostrophes, cache
  the haystack` - pushed.
- Deviations and rationale: the plan's joined-string haystack was rejected
  for a field-boundary false match; `data.ts`/`Index` untouched (the plan's
  own fallback). Before/after on real data: `плетеная сеть` 0 -> 1 (`ci8`);
  `keeper's` 3 -> 4 (adds `q80`). The `ё` half is the owner's low
  priority; the apostrophe half breaks English search and is the same line.

### B2 - hooks, ignore rules, truth fixes, `CLAUDE.md`, and the batch-size forcing function
- What shipped, by the plan's 27 steps:
  - **Steps 1-9 (hooks and ignores)**: `.gitignore` gained `.claude/worktrees/`
    and `work/`, both with the fingerprint reason; `.claude/.gitignore`
    gained `settings.local.json`; `.prettierignore`'s worktrees comment now
    points at `.gitignore` as the superset. `isExempt` moved to `lib.mjs`,
    exported, and used by both `bash-guard.mjs` (the commit gate) and
    `tree-key.mjs` (the fingerprint, which now drops every exempt row
    before hashing) - this closes the exact livelock the dispatch named:
    editing a handoff/plan no longer changes the fingerprint an armed cache
    is checked against. `citingLines()` now skips a `git show <sha>:`- or
    `HEAD:`-qualified citation; `MSG.orphanPlan` gained the way-out
    sentence. `git restore --staged --worktree` (or a `-W` cluster) now
    denies even with `--staged` present. `rm -r` without `-f` now denies
    the same as `rm -rf` (the exempt list gained `i`, the generated share
    stubs). `LONG_CHECKS` gained rows for an unsharded `golden.js`/`sweep.js`
    call and the `check` cost was tightened to the README's own measured
    `~165s`. `tests/run-all.js` gained `--help`/`-h` (prints usage, exits 0)
    and an i/-missing preflight after `queue` is built (`derived`, `dataint`,
    `craft`, `stub` need `i/`; one message replaces four separate crashes);
    its stale `--exclude=parity` comment was re-pointed at `app/golden`/
    `ci.yml`. `tests/derived.js`'s `catalog.csv` read is now guarded the
    same `existsSync` shape as its neighbours. The README's Hooks row for
    `edit-guard.mjs` now names `tests/app/snapshots/**`. Five new selftest
    cases (see "Verification").
  - **Steps 10-15 (`CLAUDE.md` and the forcing function)**: verified on disk
    before editing, matching the dispatch's correction exactly - `:24`,
    `:36`, `:97` were real, the other six of Q7's nine were already in the
    tree. `:36` "parity run" -> "browser suite run"; `:24` rewritten to
    "Prefer the smallest change that fixes the defect..."; `:97`'s `COUNTERS`
    mispointer corrected to name `tests/derived.js:451-453` (the actual nine-
    file array; `COUNTERS` itself is the counter-regex array at `:439`, a
    separate DC12 fix). One new line after the batch-size paragraph: "A plan
    names the criterion behind every split...". `.claude/prompts/
    plan.prompt.md` gained the required-outputs bullet. `.claude/README.md`
    gained the scar sentence after "Too small". `CLAUDE.md` is 171 lines by
    `wc -l` (not the plan's predicted 168 - see "Deviations").
  - **Steps 16-27 (truth fixes)**: `README.md`/`README.ru.md` drop the false
    "height of note fields" (`dhloot.prefs.v1` row); `COVERAGE.md` re-points
    four "Known thin spots" bullets at surviving homes, deletes the
    `craftmob` duplicate, adds `tools/**` and the axe RU-only gap as
    documented boundaries, adds a `NoData.svelte` thin spot (DC13), fixes
    the `derived` row's overclaim (T4 - the check compares the generator
    against its own fresh output, not a commit) and its `COUNTERS`
    mispointer, names the fourteen deleted browser suites at the
    resurrection command, fixes the DC7 `sweep.md` sha-as-ref claim, and
    gains a new "Whitespace text nodes are content" heading (C3) that the
    trimmed `prettier-ignore` comments (below) point at. `ROUTES.md`:
    `TABLE_DEFS`->`TABLE_IDS`, `TAB_LIST`->`SECTIONS`, the `frames` alias
    documented (DC3, DC4); `FEATURES.md:55` same rename. `I18N.md`: the
    dictionary-shape sentence corrected (DC5) and three sentences added on
    the share stubs' deliberate Russian-only design (O4). `META.md`
    section 6 rewritten to the dispatch's exact wording (DC6). `DEBT.md`:
    D16 deleted (fact 6 - both apps' idle toast is `display: none`, so
    there is no live-region divergence to record); D4 and D17 deleted with
    their "kept" sentences moved to `FEATURES.md` "Rolling"/"Records"; D8's
    file corrected to `TablesPage.svelte:539`; DC8's dangling "The harness"
    reference repointed to the `app/golden` row; the DC7 sha-as-ref fix
    applied here too. `CONTRACTS.md` section 4 documents the `data.json`
    empty-description omission. `llms.txt` corrects the "empty page" claim -
    the `<noscript>` block already carries the data links. The false
    "derived.js will fail"/"derived.js catches a forgotten rebuild" claim
    (T4) corrected in place, still Russian where required, in
    `README.md`/`README.ru.md`/`tools/build.js`/`tests/derived.js`/
    `.claude/hooks/edit-followup.mjs` (whose selftest case #40b now checks
    for the file-list pointer instead of the retired word "COUNTERS").
    `vite.config.mts`/`.gitignore` (H3/DC10) and `tests/run-all.js` (H4,
    folded into step 7 above) no longer claim a live root app. `i18n.ts:11`
    corrected (H5 - a second, unguarded copy exists in
    `build-share-pages.js`). `tools/tg-preview/{lib,client,manifest}.mjs`
    each gained one line naming the retirement commit for their `plan.md
    section N` citations (H2, verified: `1a06122` exists and its parent
    holds the file); `manifest.mjs`'s two stale comment blocks collapsed to
    one fact (H9). `tests/app/inventory.js`'s seven `per width` comments ->
    `per language` (H8). `tests/stub.js:6`'s bare citation gained a verb
    (H15). `tests/app/sweep.js:92`'s stale "1180 and 360" corrected to
    "1180 alone" (T12), matching `:376-379`. `types.ts`'s `tier` field
    gained a comment separating it from `eq.tier` (A8). `PrintCard.svelte`'s
    `fit()` doc comment gained the `container-type: size` linearity clause
    (PF7). `.prettierignore`'s `app/index.html` line is now marked
    permanent with its actual reason (a ~60-line indent/self-closing-slash
    diff for no behaviour change), replacing the deferred "not this batch"
    wording. `eslint.config.mjs`'s H11 comment corrected (tests/app/ is not
    legacy code; it is simply outside every tsconfig, same as the rest of
    tests/**); C9 was attempted (see "Deviations" - not kept). `git mv`
    (via a temporary name) renamed `Chip.test.ts`/`OrGrid.test.ts` to
    `chip.test.ts`/`orGrid.test.ts` (H12, owner-approved); the one stale
    reference to the old name in `tests/app/states.js:455` corrected too.
    H13's four non-ASCII marks fixed (`tools/derived.js:31`,
    `tools/build.js:26`, `app/src/state/app.test.ts:225`; `tools/build.js:11`
    was already fixed as a side effect of the T4 rewrite there). H10:
    deleted `brokenImage` (+ its `ports/index.ts` re-export); dropped
    `export` on `NO_ART`, `REAL_DICE`, `moneyWord`, `fromBase64Url`,
    `FakeClipboard` (each verified used only inside its own file). C4/T9:
    `tables.test.ts`'s pill comment and assertion switched to the
    `childNodes` idiom (`toContainEqual(['label', '×'])`);
    `listsPage.test.ts`'s comment corrected (jsdom and Chrome actually
    agree on the space; `textContent` pins a different thing). The
    "positional on purpose" comment added at `record.test.ts:395,406,412`
    and `printPage.test.ts:341`. The four `prettier-ignore` blocks
    (`TableRows.svelte`, `ListsPage.svelte`, `PrintCard.svelte`,
    `FilterBar.svelte`) cut to one explanatory line pointing at
    `COVERAGE.md`'s new heading, each still followed by its own exact
    `<!-- prettier-ignore -->` line (see "Deviations" - the first attempt
    merged the two and silently broke the directive).
- Files changed: see the file list in `plan.md`, "B2", plus
  `.claude/hooks/selftest.mjs` (five new cases, two existing fragments
  updated for the TL6 message-text change), `tests/app/states.js` (one
  stale-name fix beside the H12 rename), `.claude/README.md`'s Hooks-table
  `rm`/`restore` row.
- Commit(s): `44b1761 fix(phase-8): hooks livelock, ignore rules, truth
  fixes, CLAUDE.md, batch-size rule (B2)` - pushed. (This line was added in
  a second, doc-only commit after `git log` revealed the hash - proof by
  use of this same batch's TL2 fix: editing `handoff.md` after `44b1761`
  did not require re-running `npm run check`, and the commit gate stayed
  silent.)
- Deviations and rationale:
  - **C9 (eslint `ignoreVoidReturningFunctions`) did not work and was not
    kept.** Added the option, ran `npm run lint`: it cleared none of the
    three sites, and removing `PrintCard.svelte`'s file-wide disable to
    test it exposed thirteen other pre-existing violations the disable had
    also been hiding - a wider effect than intended for zero gain. Per the
    plan's own fallback ("leave the survivor... do not chase the rule"),
    all three original `eslint-disable` comments are restored unchanged;
    `eslint.config.mjs` keeps a comment recording the attempt and result so
    nobody retries it without reading this first. `npm run lint` is clean.
  - **The first attempt at trimming the four `prettier-ignore` comments
    broke the directive.** Folding the one-line explanation into the same
    HTML comment as `prettier-ignore` (e.g. `<!-- prettier-ignore:
    whatever -->`) stopped Prettier from recognising it - `prettier --check`
    immediately reformatted three of the four files. Fixed by keeping the
    explanation as its own comment line immediately before a separate,
    exact `<!-- prettier-ignore -->` line; `prettier --check` on all four
    files is clean again. Recorded here because the failure mode is
    invisible without running Prettier - a reviewer reading the diff alone
    would not catch it.
  - **`wc -l CLAUDE.md` is 171, not the plan's predicted 168.** The file's
    committed form has no trailing newline (`git show HEAD:CLAUDE.md | wc -l`
    = 167, one less than a straight line count, because `wc -l` counts
    newlines and the last line has none); the `:24` rewrite needed three
    lines to stay within this file's manual wrap width, not one, and the
    forcing-function line adds a fourth. 171 is comfortably under
    `CLAUDE.md`'s own 200-line cap, which is the binding rule; the specific
    "168 or less" acceptance line does not hold and is recorded as not met,
    rather than forced by cutting content elsewhere.
  - **DC7's fix applied to `DEBT.md:391` too, not only `COVERAGE.md:377`
    named in the plan.** Same false claim ("`issues/47/sweep.md`, read at
    `7a33c22`" - the sha does not resolve as a git ref for a file first
    committed later), same one-word fix ("written while HEAD was"), same
    file class (a spec already in scope). Campsite rule, not scope creep.
  - **D8's location is `TablesPage.svelte:539`, not the plan's `:538`** -
    verified against the file (`<h4 class="altcol {col.key}">` is on line
    539 today); used the verified number.
  - **D8's "Why parity won" clause and this batch's own new COVERAGE.md
    section both cited `CLAUDE.md`, "Migration and parity", which does not
    exist any more** (retired at `config-audit`, confirmed by `git grep`
    finding it only in `issues/47/*` and `issues/config-audit/*` history).
    Neither citation was in the plan's literal text for those two edits,
    but both are inside files this step touches for a directly related
    reason, so both were corrected in place (D8 -> past tense, no live
    citation; the new heading -> points at `FilterBar.svelte:58-66`'s
    comment instead, which documents the same real hazard).
- Verification commands and results:
  - `set -o pipefail; npm run check 2>&1 | tail -n 150` (Bash timeout
    600000) - green: `format:check`, `lint`, `typecheck` (545 files, 0
    errors), `node --check tools/check-site.mjs`, `npm run data`,
    `node tests/derived.js`, `node .claude/hooks/selftest.mjs` (329 passed,
    0 failed - 324 prior + 5 new: TL2's `#27b`, TL3's `TL3a`/`TL3b`, TL5's
    case, TL6's combined case; two existing fragments, `#13a`/`#13b`,
    updated from "rm -rf" to "rm -r" to match the new message text),
    `node --test tools/tg-preview/lib.test.mjs` (110 passed),
    `node --test tools/artwork/lib.test.mjs` (26 passed), `npm run test`
    (42 test files, 1056 tests, coverage thresholds green). One
    `prettier --write` needed on `bash-guard.mjs`/`edit-followup.mjs`
    (quote-style only) before the gate went green; re-ran after.
  - `node tests/run-all.js contracts,derived` - both green.
  - `node tests/run-all.js --help` - exits 0 in 0.1s, lists every suite and
    the golden/sweep per-shard/per-width guidance.
  - `mv i i.bak && node tests/run-all.js stub` - exits 1 with "i/ is
    missing - it is generated, not committed. Run `node tools/build.js`
    (or `npm run build`) first."; `mv i.bak i` restored it (verified 1091
    files back).
  - `git status --porcelain -uall` - `work/` no longer listed.
  - `git grep -n -e TABLE_DEFS -e TAB_LIST -- docs` - empty.
  - `git grep -n 'per width' -- tests/app/inventory.js` - empty.
  - `git grep -n 'derived.js will fail' -- .claude` - empty.
  - `git grep -n brokenImage -- app` - empty.
  - `wc -l CLAUDE.md` - 171 (see "Deviations"; under the 200-line cap).
  - `npm run lint` - clean, all three `no-confusing-void-expression`
    disables left in place (see "Deviations").
  - `git grep -c -P '[\x00-\x08]' -- issues/phase-8` - no output (zero
    matches; the three task documents stay clean of control bytes).
  - Gates: `npm run check` (full); `node tests/run-all.js contracts,derived`;
    `node .claude/hooks/selftest.mjs` (also inside `npm run check`).

### B3 - CI shape (T1, T2, T5, T3, T8)
- What shipped, by the plan's four steps:
  - **T5** (`tests/run-all.js`): the weight column is now CI seconds from
    `issues/phase-8/critique/tests.md`, section 0.3 (run `35214847899`,
    2026-09-17), not the old order-only local guess. The comment names the
    host/run/date and restates the advisory-local doctrine. `app/sweep`'s
    1180 row is split into `ru`/`en` at ~275s each - an even split of the
    single 550.5s measurement, not a fresh one; flagged in the comment as an
    estimate to correct after this lands.
  - **T2** (`tests/app/sweep.js`): a trailing `ru`/`en` argument narrows
    `LANGS` (default both, unchanged for a bare call); the focus walk gate
    moved from `width === 1180` to `width === 1180 && LANGS.includes('ru')`
    so the `en` row does not repeat it. `run-all.js`'s two 1180 rows pass
    `['1180','ru']`/`['1180','en']`; `keyOf`'s existing `s[3].join('-')`
    already makes `app/sweep:1180-ru` a distinct, filename-safe key with no
    change needed there.
  - **T1** (`tests/run-all.js`, `.github/workflows/ci.yml`): a `--shard=n/m`
    flag - longest-first greedy pack (LPT list scheduling) of `queue` over
    the weight column into `m` bins, keeping only bin `n`; disjoint and
    exhaustive by construction (each of the 19 rows is pushed into exactly
    one bin during the single pass over the weight-sorted list, so the union
    of all `m` bins' membership is `queue` with no gap and no overlap -
    verified by inspection of that loop, not by an extra dry-run). `ci.yml`:
    `check` keeps only the `&&` chain, build, smoke, budget, and its failure
    artifact dropped `test-output/` (no longer produced there); the `golden:`
    job is deleted; a new `browser:` matrix of 4 runs `npm run build` then
    `node tests/run-all.js --shard=N/4`, uploading `test-output/` + `dist/`
    on failure (dissolves T8's dangling-artifact problem, since goldens now
    run through `run-all.js` and get real logs for free).
  - **T3** (`tests/app/contracts.js`): `fresh()` hoisted out of the
    28-fixture address-grammar loop and the 18-call `rowsAt` helper (6
    `whole` + 12 `PROBE`), each now one reused context. Storage-clearing
    between opens needs no new code: `driver.js`'s `d.open` always does a
    full `page.goto('about:blank')` + `page.goto(url)` round trip
    (`driver.js:151-153`), and `prepare()`'s `evaluateOnNewDocument` (which
    clears `localStorage` before every new document) is registered once per
    page and fires on every subsequent navigation, not just the first - so
    reusing the page already gives every fixture/probe the same clean slate
    a fresh context would.
- **The trap the dispatch named, and how it was resolved.**
  `tests/derived.js`'s `deploy.needs` assertion hard-coded `golden`; deleting
  that job and renaming it to `browser` needed the assertion updated to
  `names.includes('browser')` (one word) or it would fail for a reason
  unrelated to the diff. Updated, and its neighbouring comment now names
  `browser` as the sharded matrix that runs `tests/run-all.js` (goldens
  included) and notes it replaced the old `golden` job.
- **Deviation from this batch's own dispatch, recorded because it changes a
  file the dispatch said not to touch.** The dispatch's "Scope" section said
  "Do not touch the deploy job's `needs:` list or its guard step; that is
  B4's" - but `plan.md`'s B3 step 3 (written the same day, more specific)
  explicitly assigns exactly this edit to B3: "`deploy.needs` becomes
  `[check, audit, secrets, browser]`; this also requires editing
  `tests/derived.js:540`". The two sources conflict. Resolved in favour of
  the plan and mechanical necessity: deleting the `golden` job while leaving
  `deploy.needs: [check, audit, secrets, golden]` unchanged would reference a
  job that no longer exists, which does not degrade gracefully - it leaves
  the workflow permanently unable to run `deploy` (and likely fails to
  schedule at all). The one-line rename in `ci.yml`'s `deploy:` block is the
  full extent of the deviation; B4's actual scope in the plan - DP1
  (timeout-minutes), DP3 (`contents: read`), DP4/T4 (the `git diff`
  guard step), DP2 (stub count), DP6 (concurrency), DP7 (`.nojekyll`
  comment), T10/DP9 (`check-site` refactor), the 404.html addition to the
  guard step and the collect list - is untouched here. Flagging this for the
  human/orchestrator to confirm the resolution was correct; nothing else in
  the guard step or `needs:` list beyond the one rename was touched.
- **Campsite fix beyond the plan's literal file list.**
  `docs/specs/COVERAGE.md:20` claimed "eighteen `run-all.js` rows (`app/sweep`
  and `app/golden` each split four ways)" - T2 makes that false (19 rows,
  `app/sweep` now five ways). One-sentence correction, same file class and
  same immediate cause as this batch's own change (precedent: B2's DC7 fix
  applied beyond the plan's literal citation for the same reason).
- **Left untouched:** `issues/phase-8/context.md` carries an unstaged
  addition (a "Review and nit policy" section) present in the working tree
  before this batch started and not part of B3 - not authored by this pass,
  not committed with it, per CLAUDE.md "Preserve unrelated working-tree
  changes. Commit only the coherent task scope."
- Files changed: `tests/run-all.js`, `tests/app/sweep.js`,
  `.github/workflows/ci.yml`, `tests/derived.js`, `tests/app/contracts.js`,
  `.claude/README.md` (the local-vs-CI fixed-cost sentence),
  `docs/specs/COVERAGE.md` (campsite count fix).
- Commit(s): `3bc605d fix(phase-8): shard the browser suites across CI runners
  instead of one job (B3)` - pushed.
- Verification commands and results:
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout
    600000) - green: `format:check`, `lint`, `typecheck`, `npm run data`,
    `node tests/derived.js` (the renamed `browser` assertion passes against
    the new `ci.yml`), `node .claude/hooks/selftest.mjs`, the two
    `node --test` suites, `npm run test` (42 files, 1056 tests, coverage
    96.63%/88.63%/97.12%/97.36% - thresholds green).
  - `npm run build` - green, 1.15s (`npm run check` does not build `dist/`;
    needed once before the local shard gate below).
  - `node tests/run-all.js --shard=4/4` (Bash timeout 400000, not
    backgrounded) - green, "все наборы прошли за 384с (в 8 потока)" (this
    Windows host's `os.cpus()` gives it 8 pool slots, not CI's 4, so the
    three items this shard drew - `app/sweep 1180 ru` 383.8s,
    `app/sweep 1180 en` 184.9s, `app/golden 4/4` 104.4s - ran fully
    concurrently and wall clock is the slowest one alone, not their sum;
    CI's real per-shard wall is what the pushed run below measures).
  - Disjoint/exhaustive was **not** re-verified by running all four shards
    locally (~650-700s combined for no new information) - it follows from
    the packing loop's structure (each of the 19 rows is pushed to exactly
    one bin in a single pass) and is what the pushed CI run's four `browser`
    job logs prove in practice.
- Push and CI: `git push origin main` (`1b5bd19..3bc605d`); `gh run list
  --branch main --limit 3` found run `35232880507`; watched with `gh run
  watch 35232880507 --exit-status` (green); per-job durations read with
  `gh run view 35232880507 --json jobs --jq '.jobs[] | {name, startedAt,
  completedAt}'`; each shard's own suite membership and per-suite seconds
  read from its job log (`gh run view 35232880507 --job <id> --log`,
  grepped for the `run-all.js` summary lines).

  **Measured job durations** (`createdAt` 14:20:17Z, `deploy` `completedAt`
  14:27:33Z):

  | job | wall | contents (CI seconds, this run) |
  |---|---|---|
  | `check` | 1m47s | the `&&` chain + build/smoke/budget only |
  | `browser (1)` | 5m45s | sweep390 325.1, golden1 109.7, states 102.5, golden3 103.6, stub 2.2, dataint 0.3, derived 0.3, craft 0.1, contracts 0.0 |
  | `browser (2)` | 5m46s | sweep360 321.4, print 155.6, golden2 105.2, hues 69.8 |
  | `browser (3)` | 5m31s | sweep768 312.3, contracts(app) 246.5, typo 78.8 |
  | `browser (4)` | 6m31s | sweep1180-ru 371.9, sweep1180-en 172.7, golden4 95.6 |
  | `audit` | 20s | |
  | `secrets` | 7s | |
  | `deploy` | 36s | (started 5s after `browser (4)`, the last dependency) |

  All 19 rows are accounted for exactly once across the four shards (9 + 4 +
  3 + 3 = 19), confirming disjoint-and-exhaustive on the real pool, not just
  by construction.

  **Wall clock: 738s -> 436s, -41%** (push at 14:20:17Z, `deploy` done
  14:27:33Z) - a real win, but **short of the ~390s projection, by about
  12%**, for a traceable reason: `tests.md`'s packing table assumed the
  split 1180 row would land near ~275s per language (an even halving of the
  single 550.5s measurement). It did not - `sweep1180-ru` measured 371.9s
  here, `sweep1180-en` 172.7s (they still sum close to the original 550.5s,
  544.6s), because axe's English pass and the RU-only focus walk are not
  actually half the excess each; the RU side is the heavier one. Since RU
  also carries the focus walk, `sweep1180-ru` (371.9s) is now the single
  longest row in the whole suite, ahead of `sweep390` (325.1s) - it is the
  new critical-path floor, not the item `tests.md` designed the packing
  around. `run-all.js`'s weight table already says the split is "an even
  split of that one measurement rather than a fresh one - re-measure and
  correct after this lands"; this run is that re-measurement, and the two
  numbers to put in that comment on a future pass are 371.9/172.7, not
  275/275.
  - **Billed runner-seconds: 1244 -> 1583, +27%**, not the projected +10%
    (~1382s). Sum: old `check 689 + golden 128+126+121+115 + audit 17 +
    secrets 8 + deploy 40` from `tests.md`'s baseline run vs new `check 107 +
    browser 345+346+331+391 + audit 20 + secrets 7 + deploy 36` here. The
    gap is that each `browser` shard now pays a full `npm run build` (~2s)
    plus its own ~20s fixed cost against far more assigned work per shard
    (325-391s, vs the old `golden` shards' 115-128s) - four jobs doing what
    was one `check` step's 582s of work plus four small `golden` jobs, not
    four jobs sized like the old `golden` ones. This is the honest number,
    not the projected one: more billed time than `tests.md` estimated, for
    less wall-clock-per-billed-second improvement than hoped, but still a
    real 41% wall-clock cut on a public repo where billed minutes are free.
  - `check`'s own `npm run check` step passed inside this same run, which is
    the live proof that `tests/derived.js`'s renamed `browser` assertion
    holds against the real `ci.yml` - `deploy` would not have run otherwise
    (`deploy.needs` includes `check`).

## Blockers
- None. B4 (deploy) follows; it must not run beside another heavy CI push in
  this working tree.

## Deferred
- See `plan.md`, "Deferred to the two excluded tickets, and to tasks of
  their own".
- `issues/56/context.md:38` and `issues/59/context.md:25` cite the deleted
  `docs/parity.md` (DC14) - other tasks' files; the orchestrator passes it
  on. Untouched this pass.
- C9's real fix (a rule change that actually clears the three
  `{@render}` disables, or accepting them as permanent) is not re-opened
  here - recorded as attempted-and-reverted above; a future session should
  not retry the same option without reading that note first.

## Next batch (implement-ready)
- Name: B4 - deploy and gate correctness, and `404.html` (DP1-DP7, T4/DP4,
  T6, T10/DP9, R8)
- Objective: the deploy job actually guards what it claims to (timeouts,
  permissions, a stale-artefact gate that can fail, a re-run path that is
  understood before it is needed) and a bad/truncated share link's worst
  case - an unknown Pages path - lands on a bilingual way-home page instead
  of GitHub's generic 404.
- Files: `.github/workflows/ci.yml`, `tools/check-site.mjs` ->
  `tools/check-site.lib.mjs` + `tools/check-site.test.mjs`, `package.json`
  (`check` gains the two `node --test` files), `tests/app/golden.js` (exports
  under `require.main`) + `tests/app/golden.test.mjs`, `404.html` (new,
  tracked at the repo root), `docs/specs/META.md`.
- Steps: `plan.md`, "B4", steps 1-11, in that order. Step 1 (DP1) adds
  `timeout-minutes: 30` to the `check` **and `browser`** jobs - `browser` is
  the job name B3 created this pass, already live on `main`.
- Note for whoever picks this up: B3's dispatch said not to touch the deploy
  job's `needs:` list, but B3 already changed it mechanically (`golden` ->
  `browser`, forced by deleting the `golden` job) - see B3's "Deviations"
  above. B4's own plan steps do not otherwise touch `needs:`; if that
  changes, treat it as new scope, not as inherited from B3.
- Acceptance: a deliberately stale `catalog.csv` pushed to a branch turns
  `check` red at the new step and green after `node tools/build.js`; `node
  --test tools/check-site.test.mjs` fails on each broken fake; the deploy
  log shows the stub-count line; the re-run time is in the handoff; the
  published site answers `https://artex-x.github.io/daggerheart-loot/nope.html`
  with 404 and the bilingual way-home page, `noindex` present, and
  `check-site.mjs` proves it on the deploy (its own acceptance line).
- Gates: `npm run check`; push; `gh run watch`; the PR probe (a deliberately
  stale `catalog.csv` on a branch); the re-run measurement (`gh run rerun
  <latest green run id> --job <deploy job id>`).
- Risks / do-nots: ends in a live CI watch, a deliberately-red PR probe, and
  a `gh run rerun` timing; none of it should share a run with another heavy
  push in this working tree. Do not touch B5's files.

## Notes
- Mocks path: none (no new UI element).
- Screenshot findings: none (no attachments).
- Cleanup performed / retained artifacts (B2): `i/` was renamed to `i.bak`
  and back during the run-all.js preflight test; verified restored (1091
  files). No other scratch artifacts.
- Cleanup performed / retained artifacts (B3): none - `npm run build`'s
  `dist/` is the normal build output and is already gitignored.
- Session end partial progress (if any): none - B3 is a committed boundary.
