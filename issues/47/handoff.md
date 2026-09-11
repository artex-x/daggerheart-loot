# Handoff - TASK 47

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/context.md`, then `issues/47/plan.md`, then this file. Nothing here
depends on chat history.

## Status

- Task status: **B5.4a is built, verified, and committed** (implementer,
  2026-09-11). Resumed at step 11 as directed, on `f38b900` with the 43
  uncommitted paths from steps 1-9 unchanged and step 10 already green.
  `npm run build` then all six step-11 parity filter groups, each its own
  foreground call, none merged: `"#/lists/a @"` (6 cells), `"~ noted" "~
  money help"` (12 cells), `"~ roll panel" "~ rolled" "~ removed" "~ note
  opened"` (24 cells), `"#/lists/b" "#/lists/nope" "own list"` (18 cells),
  the regressions `"#/lists @" "#/lists ~"` (36 cells) and `"i/ci1 ~"` (36
  cells) - **every cell in every group read `совпадает` on the first pass;
  no port fix was needed, nothing was re-run.** `npm run check:built` exited
  0 (build, `smoke-file-url.mjs`, `bundle-budget.mjs` at 77.3 kB gzip against
  the 120 kB budget). `plan.md` gained "B5.4a built"; this file and
  `context.md` updated. A final `set -o pipefail; npm run check 2>&1 | tail
  -n 120` re-armed the gate after the doc edits (exit 0, 37 files, 854
  tests, 0 failures, coverage 96.24/88.87/96.86/96.86). One commit,
  `feat(lists): the list page`, on top of `f38b900`. No push. HEAD did not
  move under this session; no other session was active (no
  `test-output/parity.lock`, lock absent throughout). B5.4b, B5.5 and B5.6
  remain outlines only - not started, not replanned, per this batch's
  explicit scope.
- Task status: in_progress - **step 10 is done and green; the host block is
  gone** (orchestrator, 2026-09-11, 08:25-08:30). One reading before anything
  heavy, as the amended brief asks: RAM free 7.44 GB of 15.82 GB, 251
  processes, no `chrome.exe`, no `test-output/parity.lock`. On that host
  `set -o pipefail; npm run check 2>&1 | tail -n 120` exited 0 in one
  foreground call - 37 test files, 854 tests, 0 failures, coverage 96.24
  stmts / 88.87 branch / 96.86 funcs / 96.86 lines, every threshold met,
  vitest 78.8s. No fork-pool loss, no zero rows: **the five failed attempts
  were host load, exactly as diagnosed, and nothing in the batch's code was
  ever wrong.** `.claude/.check-cache.json` armed at key `2ab9c1a7...`.
  HEAD is still `f38b900`; the 43 uncommitted paths are unchanged and are
  still B5.4a's declared scope. **Resume at step 11** (the parity loop).
  Note for whoever commits: step 13's doc edits change the tree fingerprint
  and therefore disarm the gate, so the last action before `git commit` is
  one more foreground `npm run check`.
- Task status: in_progress - **B5.4a's code is written and uncommitted; the
  batch is blocked on the host, not on the work** (orchestrator, 2026-09-11,
  scheduled run). Steps 0-9 are done: step 0 is committed as `f38b900`
  (`test(parity): no legacy cache for timed states`) and steps 1-9 sit in the
  working tree as 43 uncommitted paths - five new components
  (`ListPage.svelte` 1419 lines, `RowMain`, `HelpBox`, `HelpButton`,
  `StorageNotice`), `listPage.test.ts`, the route in `App.svelte`, and the
  dict/lib/state/ports/harness edits the brief lists. Everything uncommitted
  is in B5.4a's declared scope; there is no foreign work in the tree to
  preserve. **Resume at step 10.**
  **No genuine test failure has been found**: `npx vitest run` gave 26 files /
  469 tests / 0 failures, and the one failure a later run produced
  (`listPage.test.ts > a row's note > clears the box on the cross...`,
  14745ms) passes in isolation - 35/35. What blocks the batch is that the
  host cannot complete a run: `RAM free 0.35 GB of 15.82 GB, CPU 100%, 424
  processes on 8 cores`, so vitest's fork pool loses 11-13 test files to its
  hardcoded 60s worker `START_TIMEOUT` and every lost file reads 0% coverage,
  which `npm run check` reports as a coverage regression. Five `npm run check`
  attempts across two sessions (1437s, 630s, 813s, and two this morning) have
  all exceeded the Bash tool's 600000ms ceiling, and a call that outlives it is
  moved to the background where `check-observer.mjs` has no stdout to
  attribute - so the commit gate cannot arm, by construction, however well the
  run goes. `--maxWorkers=4` made it worse here (1067s against 437s).
  **Do not re-run `npm run check` on a loaded host hoping for a different
  answer, and do not dispatch a worker into this wall** - that is what cost
  the previous session roughly two hours. The measurements are in
  `context.md`, "The B5.4a tree passes; the host cannot prove it".
  Nothing was committed this run and nothing was reverted.
- **A peer session is working this same batch, observed live at 06:31**
  (orchestrator, 2026-09-11). `test-output/parity.lock` appeared during this
  run: `{"pid":276576,"startedAt":...,"argv":["#/lists/a @"]}`, pid confirmed
  alive (`Get-Process -Id 276576` - node, started 06:20:21). That filter is
  **step 11's first parity run**, so another session is past step 10 and into
  verification on this tree. Two consequences, and they are not optional:
  1. The "Resume at step 10" line in the entry above is this session's
     reading at 06:25 and may already be stale - **check the lock and
     `git log --oneline -3` before believing it.** If that peer commits,
     B5.4a may be closed by the time this is read.
  2. **Nothing heavy may be started while that lock is live** - `bash-guard.mjs`
     blocks it, and a vitest pass beside a live parity run produces spurious
     timeouts anyway. This session's own 06:19 `listPage.test.ts` run
     (211s for 35 tests) overlapped the peer's parity start at 06:20, so treat
     its wall clock as contended.
  This session did not touch the lock, did not commit, and did not dispatch a
  worker - precisely because a second writer was already on the tree.
- Last agent: orchestrator (2026-09-11, scheduled run: measured only - four
  test runs, one host reading, `context.md` and this Status. No production
  code, no commit, no dispatch.)
- Task status: in_progress - **B5.4 planned (planner, 2026-09-10): 4a is
  implement-ready, 4b outlined**, and `#/tables ~ selection copied @ en 1100`
  is diagnosed as a stale legacy-cache hit (the diff is the toast alone; the
  legacy PNG is byte-identical to a cache entry written under the full
  suite's load, and the "isolated" re-run copied it rather than shooting
  it) - fixed by 4a's step 0 in the harness, no `VISUAL_DEBT` line. HEAD
  moved to `13bba19` (the gitleaks allowlist) during planning; no
  application source changed. No production code written. See "Next
  batch", `plan.md` "B5.4 planned", `context.md` "B5.4 planning facts".
- Last agent: planner (2026-09-10, B5.4 planning; read-only puppeteer probe
  of the live list page at three widths; wrote `plan.md`, `handoff.md`,
  `context.md` only).
- Task status: in_progress - **B5.3's fix-then-continue remediation pass is
  built and committed.** The reviewer's one blocker against `ba8f4b1` (the
  list card's `href` rendered the players' payload where the live app
  renders the GM one - see "Blockers") is fixed, the two facts in `context.md`
  and `plan.md` that stated the wrong live behaviour are corrected, and
  `listsPage.test.ts`'s two href assertions now use a list carrying an
  `hnote` so they can tell the two payload flavours apart. `npm run check`
  exits 0 on the first attempt (782 tests, no worker-fork crash this run);
  `npm run build` clean; `node tests/parity.js "#/lists"` reads all 36 cells
  `совпадает`; `npm run check:built` exits 0. The five nits and the parity-
  coverage gap the blocker exposed are recorded in "Deferred", not fixed, per
  this pass's explicit blockers-only scope. B5.4-B5.6 remain outlines only;
  picking the next batch is the orchestrator's.
- Task status (B4-B5.3, prior sessions): B4 built (`fde9cdc`, reviewed);
  B5.1 built (`fe0043b`) with its fix-then-continue pass (`d1c1367`);
  B5.2 part 0 built
  (tests and docs, no production code) - `f167e62`, on top of the planning
  commit `2f3659d`. **B5.2 part 1 (the selection bar) is now built too** -
  `ff741ad`, on top of `4210ee3`, **reviewed: approve, no blockers**
  (four nits in "Deferred"). All local acceptance criteria met, three parity
  filters clean (102 cells), `npm run check` and `npm run check:built` both
  exit 0. **Part 0 is closed by CI: run `34492619641` on `4210ee3` is green on
  every job, `deploy` included.** Part 1 (`ff741ad`) is unpushed and unread;
  see "Blockers". **B5.3 (the lists index, the storage notice where the
  live app draws it, `noData`) is built, closed out, and committed as one
  batch.** All ten original ordered steps plus the close-out's three are
  done; `node tests/parity.js "#/lists"` reads all 36 cells `совпадает`,
  both languages, including the three English `~ notice unfolded` cells
  that were 5.88/6.40/9.05% before the close-out. `npm run check` and `npm
  run check:built` both exit 0 (782 tests, thresholds met). The blocker -
  the storage notice's open state surviving a language switch where the
  live app's does not - is resolved: `ListsPage.svelte` wraps the
  `<details class="warn">` in `{#key app.lang}` … `{/key}`, per the
  planner's decision (path 1, language change only; paths 2 and 3 rejected
  on mechanics). See `plan.md`, "B5.3 built", "Close-out decision",
  "Close-out run" for the complete accounting, and `git log` for the
  `feat(lists): the lists index` commit.
- Last agent: implementer (2026-09-10, B5.3 fix-then-continue remediation:
  one blocker only, per the orchestrator's explicit scope - no replanning,
  no B5.4, one commit. `ListsPage.svelte:181`'s card link changed from
  `encodeList(l, true)` to `encodeList(l, false)`, matching the live app's
  own `listHash(l)` one-argument call (app.js:2894/1534). `context.md` and
  `plan.md`'s two facts that stated the players' payload were corrected with
  the verified line numbers. `listsPage.test.ts`'s two `href` assertions
  fixed to `encodeList(listA/B, false)`; `listA` gained an `hnote` and a new
  inequality assertion so the test can actually distinguish the two payload
  flavours, which are byte-identical without one. Five review nits and the
  parity-coverage gap the blocker exposed recorded in "Deferred", not fixed.
  `npm run check` exit 0 (no re-run needed), `npm run build` clean, `node
  tests/parity.js "#/lists"` all 36 cells `совпадает`, `npm run check:built`
  exit 0. One commit on top of `ba8f4b1`. No push.)
  Before it: implementer (2026-09-10, B5.3 close-out: applied path 1 -
  `{#key app.lang}` around `ListsPage.svelte`'s `<details class="warn">`
  with a comment naming the mechanism, one `listsPage.test.ts` case, one
  `FEATURES.md` clause. `npm run check` needed one re-run on the documented
  worker-fork crash, otherwise no deviation. `node tests/parity.js
  "#/lists"` - `расхождений нет`, all 36 cells. One commit, `feat(lists):
  the lists index`, on top of `91d7899`, containing the whole B5.3 batch.
  No push.)
  Before it: planner (2026-09-10, B5.3 close-out: decided the `~ notice
  unfolded @ en` blocker - path 1, language change only; paths 2 and 3
  rejected on mechanics, not preference. Wrote the close-out brief into
  "Next batch", the decision with its rejected alternatives into `plan.md`,
  "B5.3 built", "Close-out decision", the standing rule into `plan.md`,
  "Working rules during the migration", and the durable facts into
  `context.md`, "B5.3 close-out facts". No production code, no test, no
  commit; the uncommitted B5.3 tree is the implementer's.)
  Before it: implementer (2026-09-10: B5.3 built to this point, not
  committed - see "Completed" and `plan.md`, "B5.3 built". Two real findings
  along the way, both fixed: axe's `nested-interactive` rule on the storage
  notice's live-app-inherited button-in-`<summary>` shape, accommodated in
  `app/src/test/a11y.ts`'s `OFF` map; and a `prettier --write` run
  reformatting `ListsPage.svelte`'s whitespace-sensitive card markup back
  into a real defect, fixed with the same `<!-- prettier-ignore -->` device
  `TableRows.svelte` already uses. The blocker itself - the storage
  notice's open state surviving a language switch where the live app's does
  not - was found by the harness, not guessed, and is reported rather than
  resolved unilaterally, per this task's own explicit stop condition.)
  Before it: planner (2026-09-10: B5.3 planned - `plan.md`, "B5.3
  planned"; `context.md`, "B5.3 planning facts"; the brief in "Next batch".
  Measured the live `#/lists` at three widths with a read-only probe rather
  than guessed; found and recorded three things by reading - the live
  restore field refuses the app's own short links, `confirm()` blocks the
  parity driver, and the rewrite has never had a `::placeholder` rule. No
  production code written.)
  Before it: reviewer (2026-09-10, opus, against `ff741ad`: **approve**, no
  blockers, four nits recorded in "Deferred"; its press-spec language sweep
  came back clean across all eight `presses` specs and both `looks` specs).
  Before it: implementer (2026-09-10: B5.2 part 1 built - `app.sel` lifted
  onto `AppState`, `SelBar.svelte` renders between the footer and the toast,
  the invented `.dropmenu.up` rule deleted, `RecordModal` folds a stale
  `menuFor` on every close path, `shareSelection` added with no skip set; a
  one-line correction to the harness's own written design found and fixed
  while running it - see `plan.md`, "B5.2 built, part 1")
- NEEDS_HUMAN_CONFIRMATION: no - the `~ notice unfolded @ en` decision was
  made in planning (path 1, language change only; `plan.md`, "B5.3 built",
  "Close-out decision") and is now built, verified, and committed.
- Branch: `main`
- Base / starting commit: `ccb80cb`. B3.5 is `a58dd97` plus its remediation
  `fb8cb0d`; B3.6 is complete in all three parts - part 0 `f7308a9`, part 1
  `38cfbbb`, part 2 `958f182`; the container tooling is `1d368e2`. B4 is
  `fde9cdc`. B5.1 is `fe0043b`; its fix-then-continue pass is `d1c1367`; the
  full unfiltered parity run against `fe0043b` is recorded under "Blockers"
  at `541d529`. Planning for B5.2 (both parts) is `2f3659d`. Part 0 is
  `f167e62`, then a docs-only commit `4210ee3`, both on top of `2f3659d`. Part
  1 is `ff741ad`. Planning for B5.3 is `91d7899`; B5.3 in full, including its
  close-out, is this session's `feat(lists): the lists index` commit on top
  of `91d7899` - see `git log` for its sha - re-read `git log --oneline -3`
  before starting the next batch, other sessions share this tree.

Phase 4's B1-B3.6, B4 and B5.1 are all built. B4 was the last body shape the
tables slice needed (`plan.md`, "the tables surface, and how it splits"), so
every table in `TABLE_DEFS` now draws a real body and `TablesPage.svelte`
carries no placeholder branch. The lists slice is planned as six batches
(`plan.md`, "B5 planned") and **B5.1 and B5.2 (both parts) are built**: the
list store, the toast, the add-to-list row on the card, CI-green tests and
docs, and now the selection bar - ticking any row on a table raises "Выбрано
N" with a cross, an add-to-list control, a print link and a copy button, all
at the bottom of the window. What is left of Phase 4 is B5.4-B5.6, the search
slice and the print slice. **B5.3 (the lists index, the storage notice where
the live app draws it, and `noData`) is built, closed out, and committed** -
the notice now re-folds on a language switch, and `node tests/parity.js
"#/lists"` reads clean on all 36 cells. B5.4-B5.6, search and print remain
outlines only; picking the next batch is the orchestrator's.

B4 was offered as a merge target for B3.6 and was deliberately not folded in:
its acceptance includes a clean parity run and possibly new `VISUAL_DEBT`
entries, and building it while the debt table and the instrument were being
replaced would have made every number unattributable. That work is done; B4
starts on a settled table and a finished instrument.

Why B3.5 and B3.6 were inserted ahead of it: a human review of
`#/tables/community` found two defects the harness reported as clean, the
orchestrator confirmed both by measurement and found a third, and all three
sat inside `VISUAL_DEBT` entries whose reason said antialiasing. `context.md`
carries the measurements; `plan.md`'s "B3.5 built" and "B3.6 built" sections
carry what was done about it. Do not re-measure any of it.

## Completed

- Batch name/id: **B3 - sectioned bodies and section anchors** (previous
  session)
- What shipped: `voa`, `frames`, `community`, `alt_item` and `alt_consumable`
  draw in full; `TablesPage.svelte`'s `KNOWN` covers eleven of the fourteen
  tables. The row/section anchor (`#/tables/<table>/<key>`) is wired up for the
  first time on every table built so far, not only B3's five - it had been
  parsed and ignored since Phase 4. `label.ts`'s `srcLabel` frame case names
  the campaign rather than its raw id.
- Files changed: new `app/src/lib/frames.ts`, `app/src/lib/frames.test.ts`,
  `app/src/components/TableRows.svelte`, `app/src/components/SectionHead.svelte`;
  changed `app/src/lib/data.ts`, `label.ts`, `alt.ts`, `facets.ts`, `dict.ts`,
  `app/src/components/TablesPage.svelte`, `tables.test.ts`, `a11y.test.ts`,
  `tests/parity/specs.js`, `issues/47/plan.md`.
- Commit(s): see `git log` for B3; this planning session has committed nothing.
- Deviations and rationale: `TableSection.svelte` was not built.
  `TableRows.svelte` and `SectionHead.svelte` were built instead -
  eslint-plugin-svelte flags every `{@render}` of a locally declared
  `{#snippet}` as `@typescript-eslint/no-confusing-void-expression`, confirmed
  with a two-line reproduction, so the row/tile markup became a real component
  (five call sites) rather than a snippet. `facetRows` grew a fourth parameter,
  `lang`, because `frameName`/`communityName` need the `Lang` and not only the
  `Dict`. Both are written up in full in `plan.md`, "B3 built".

**Correction, against B3's own account (previous session).** B3's handoff and
`plan.md` both recorded the tables screens as matching within six documented
noise causes. Three of those causes were defects, not noise. `plan.md`'s "What
every remaining `VISUAL_DEBT` entry is" now carries that correction inline;
causes 5 and 6 are marked withdrawn. Nothing about B3's *shipped behaviour* is
in question - the sectioned bodies and anchors are correct; the two CSS defects
predate B3 (B1 for the search box, B1 for `.selbox`) and the third is B2's.

- Batch name/id: **B3.5 - the absorbed parity debt** (this session)
- What shipped: the three measured defects are fixed - `TablesPage.svelte` no
  longer writes an invented `font-size: 14px` on the toolbar search box and its
  `:focus` rule carries the live app's 3px gold glow; `FilterBar.svelte` emits
  the space before the `любое` hint as `{' '}` so Svelte's whitespace trimming
  cannot drop it; `TableRows.svelte` carries `.selbox { width: 38px }` under
  its existing `@media (max-width: 600px)` block. `tables.test.ts` asserts the
  label text both with and without a value picked. `#/tables/community ~ panel
  open` is a new state in `tests/parity/specs.js`, the exact screen the human's
  screenshots were taken from. `VISUAL_DEBT` is re-baselined against a real run
  - 49 entries deleted, one entry (`voa ~ section anchor @ ru 375`) raised with
  a newly-found, verified reason, one sibling entry (`@ en 375`) given the same
  corrected reason at its old value. `docs/parity.md` carries the denominator
  rule; `CLAUDE.md` carries the `@media`-porting line, still under 200 lines.
  Full accounting - every number, what survived and why, the focus-glow test,
  the `.selbox` specificity confirmation, and the section-anchor root cause -
  is in `plan.md`, "B3.5 built".
- Files changed: `app/src/components/TablesPage.svelte`, `FilterBar.svelte`,
  `TableRows.svelte`, `tables.test.ts`; `tests/parity/specs.js`;
  `docs/parity.md`; `CLAUDE.md`; `issues/47/plan.md`, `issues/47/handoff.md`,
  `issues/47/context.md` (untracked, now committed with the batch).
- Commit(s): see `git log` for this session's B3.5 commit.
- Deviations and rationale: none from the handed-off spec. One thing the spec
  did not anticipate: the `.selbox` fix, while it collapsed nearly every 375px
  table-body debt to zero as predicted, also **moved**
  `#/tables/voa ~ section anchor @ ru 375` the wrong way (9.52% -> 10.05%,
  reproduced twice) - not predicted in `plan.md`'s "Expected outcome" table,
  which only anticipated the 375px anchor entries "collapsing" the same way the
  table-body ones did. Root-caused rather than papered over: the harness
  scrolls to an anchor once, at 1100 width, and reuses that scrollY unadjusted
  through the 768 and 375 screenshots, so a target deep in a long table (`tA`,
  Vault of Ages' artifact tier) is exposed to however much the rows above it
  reflow differently between the two apps before that frozen scrollY is
  reinterpreted at a narrower width. Confirmed by reverting just the `.selbox`
  fix in a scratch copy, rebuilding `dist/`, and re-running the one state: the
  old 9.52% came back exactly. Recorded at the real 10.05% with a reason naming
  the mechanism, not papered over with a vague one. Full writeup in `plan.md`.
- A second thing discovered, not anticipated, and **not this batch's to
  fix**: the full-suite gate (`node tests/run-all.js parity`) fails on four
  states this batch never touches, confirmed pre-existing via `git stash` - see
  "Blockers".

- Batch name/id: **B3.5 remediation - fix-then-continue blockers** (this
  session, on top of `a58dd97`)
- What shipped: two review blockers only, per the orchestrator's explicit
  scope (no replanning, no B3.6, no B4, one commit).
  - **Blocker 1**, six stale `#/tables ~ a row ticked` entries sitting inside
    `DEBT_SLACK` (silent pass): confirmed by a filtered run
    (`node tests/parity.js "a row ticked"`) and lowered to the measured
    values - `ru 1100` 1.19->1.1, `ru 768` 1.52->1.39, `ru 375` 4.59->4.3,
    `en 1100` 1.0->0.94, `en 768` 1.32->1.23, `en 375` 4.51->4.29. All six
    match the numbers the orchestrator had already measured; nothing moved
    between that measurement and this run.
  - **Blocker 2**, `#/tables/core_item ~ row anchor @ ru|en 375`'s disproved
    reason: a standalone script replicated the harness's own arrival
    sequence (`prepare()`'s reduced-motion, open at 1100, resize through 768
    to 375 with no further navigation) and read `window.scrollY` plus
    `[data-row="ci1"]`'s `getBoundingClientRect()` at every step, in both
    apps. Result: legacy and next match to the pixel at 1100 and 768 -
    same scrollY, same document height, same row rect - so neither the
    "wraps a word earlier" reason nor the frozen-scrollY-in-the-harness
    mechanism voa has applies here; both are ruled out by measurement, not
    assertion. The two apps only split at 375, where `next`'s scrollY lands
    about 13px further down than `legacy`'s. Root cause: `TablesPage.svelte`'s
    row/section-anchor effect defers `target.scrollIntoView(...)` behind
    `document.fonts.ready`, unlike `app.js`'s synchronous call inside
    `render()`; in this environment that resolves only after the harness has
    already stepped past the 768px screenshot, so the rewrite's one and only
    scroll computes its target against the 375px layout's
    `[data-row]` `scroll-margin-top` (132px, `TableRows.svelte`'s
    `max-width:600px` override) instead of the 118px `legacy` scrolled
    against once, at 1100px, and never revisited - a 14px constant gap that
    accounts for essentially all of the measured ~13px. **A real,
    reproducible defect in the port** (confirmed twice per language, same
    result both times), not rendering noise - the block comment and both
    entries' `why` were rewritten to name it; the `pct` values were updated
    to what this session actually measured (`ru 375` stays 8.85, matching;
    `en 375` moves from 8.51 to 7.92, since 8.51 no longer passes
    `DEBT_SLACK` against this session's repeatable 7.92 measurement -
    lowering it is the same "read the run output, don't guess" standard
    B3.5 held itself to). The underlying bug (the effect racing the
    harness's own resize sweep) is not fixed here - out of this pass's
    scope, worth a real fix later: the effect should not let a viewport
    resize outrace its own `fonts.ready`-deferred scroll.
  - **Also fixed:** `issues/47/context.md`'s "Correction" section (already
    present in the working tree, uncommitted, before this pass started) is
    included in this commit since it is exactly what "note the new final
    section" in this pass's own instructions pointed at.
  - **Not fixed, flagged for the next session:** while confirming Blocker 2,
    `#/tables/core_item ~ row anchor @ en 768` measured `0.00%` against its
    recorded `0.43%` debt, four times in a row (once alone, three times in a
    tight loop) - a silent `DEBT_SLACK` pass, the same shape as Blocker 1's
    six entries. This contradicts this pass's own instructions, which stated
    the reviewer had already checked "the four 1100/768 anchor entries" and
    found them reproducing their recorded numbers exactly. Left untouched
    because it is not one of the two named blockers and this pass's scope is
    explicitly "two blockers only, one commit" - but it is real on this
    machine, right now, and worth a second look before it is assumed stale
    or assumed accurate. Possibly related to Blocker 2's own finding: the
    `fonts.ready`-gated scroll's timing is inherently race-prone, and 768 is
    close to wherever that race resolves in this environment.
  - **Handoff and context corrected, not the plan:** `plan.md` was read but
    not edited - none of this pass's fixes are a plan-level design change,
    and the task explicitly excludes replanning.
- Files changed: `tests/parity/specs.js` (the two blockers);
  `issues/47/context.md` (pre-existing uncommitted "Correction" section,
  included); `issues/47/handoff.md` (Blockers correction, Deferred nits, this
  entry).
- Commit(s): see `git log` for this session's remediation commit, on top of
  `a58dd97`.
- Deviations and rationale: none from the two named blockers. The `en 375`
  `pct` change (8.51 -> 7.92) was not explicitly pre-computed in the task
  brief (which cited 8.47 from a different session's measurement) - this
  session's own repeated, stable measurement is what got recorded, per
  `docs/parity.md`'s own rule to measure rather than copy a prior number.

- Batch name/id: **B3.6 part 0 - make the harness quick enough to use** (this
  session)
- What shipped: a content-addressed cache for the legacy screenshots in
  `tests/parity.js` with `--no-cache` and `--shard=N/M`; `--exclude=parity` in
  `tests/run-all.js`; parity moved out of CI's pooled run into its own 4-way
  sharded job with `deploy` gated on it; and the axe global-lock fix in
  `app/src/test/a11y.ts` (`expectNoA11yViolations` clears axe's `_running`
  flag) with `a11y.test.ts` as its regression test. `testTimeout: 30_000`
  already existed - only its comment changed. Full accounting, including the
  two review defects fixed before evidence was taken and the failed speed
  claim, is in `plan.md`, "B3.6 built, part 0".
- Files changed: `tests/parity.js`, `tests/run-all.js`,
  `.github/workflows/ci.yml`, `vite.config.mts`, `app/src/test/a11y.ts`, new
  `app/src/test/a11y.test.ts`, `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): see `git log` for this session's part 0 commit.
- Deviations and rationale: **the objective was met, the justification was
  not.** `plan.md` predicted "close to half the wall clock"; measurement gives
  ~10%, because only the per-width screenshot is cacheable - the legacy page is
  still opened and `arrive()`d for every state, since `looks` and `controls`
  read it. The cache is correct (three runs byte-identical) but small; the
  shard is what makes CI affordable. Recorded rather than presented as a win.
  Whether the cache earns its complexity is a fair question for review.
- Process note, worth more than the batch: **three agents were spent on this
  one part.** Two ended a turn with a check still running and lost its output;
  the orchestrator then misread a stop notification as a death, killed the
  run, and dispatched a duplicate against the same tree. Both failure modes are
  now rules in `.claude/prompts/` (`001aa43`), and the usage guard that was
  supposed to catch the third was removed as unworkable (`79e26c9`) - the
  five-hour window is not machine-readable outside a terminal session, so the
  human calls time.

- Batch name/id: **B3.6 part 1 - the red CI run** (this session)
- What shipped:
  - **The complete failing list, off CI rather than off a local run.** The
    `failure-output` artifact of run `34361836525` (commit `79e26c9`) carries
    the whole ubuntu `parity.log` plus every screenshot and diff image; it
    failed **22** cells, not the dozen `gh run view --log-failed` prints.
    Every one is diagnosed with a named cause in `plan.md`, "B3.6 built,
    part 1"; none is left as "antialiasing".
  - **One real defect, worth eighteen debt entries.** `PageHead.svelte`'s
    `.helpbox` had dropped the `animation: pop .2s ... both` line style.css
    gives it. An element that animates a transform is painted through its own
    layer and the layer rounds text differently, which is why the panel's
    geometry measured identical in both apps to three decimals while single
    lines came out a pixel apart. With the line ported, **all eighteen help
    cells measure 0.00%** - `#/roll/std ~ help`, `#/roll/wondrous ~ help` and
    `#/tables ~ help`, both languages, all three widths. `helpNoise` and its
    entries are deleted.
  - **A harness race closed.** `tests/parity/driver.js`'s `ready()` now waits
    for `document.fonts.ready`, the promise `TablesPage.svelte`'s anchor
    effect defers its scroll behind, so the width sweep cannot start while
    that scroll is outstanding. `#/tables/core_item ~ row anchor @ en 375` has
    produced 7.92% on three consecutive runs where it used to alternate
    7.92/8.47 - the blocker part 0 handed to part 1.
  - **`#/i/f1` finally has its entries.** Two `ACCEPTED` control-list lines
    (the add-to-list gap every other record route already had, missed by
    `2970c03`) and four `VISUAL_DEBT` cells for the row peeking above the
    fold.
  - **Re-baselined to CI, per owner decision 1:** the six `#/i/ci1 ~ whole`
    cells and `#/tables ~ a row ticked @ en 375`. Each `why` says it was
    raised and why. `#/roll/wondrous ~ modal` was left alone - it reproduces
    its recorded numbers exactly on CI and only Windows disagrees.
  - **The platform rule** is in `docs/parity.md`, "Machine variance": CI is
    the baseline, a local run is advisory, how to read CI's numbers without
    pushing, and how to tell variance from a defect (size, and whether both
    machines agree). `VISUAL_DEBT`'s own doc comment now lists the three ways
    a figure legitimately goes up instead of one.
  - **Item 5 settled and recorded:** the unfiltered suite stays a blocking
    gate, sharded four ways by part 0. No workflow change.
- Files changed: `app/src/components/PageHead.svelte`,
  `app/src/components/TablesPage.svelte`, `tests/parity/driver.js`,
  `tests/parity/specs.js`, `docs/parity.md`, `issues/47/plan.md`,
  `issues/47/handoff.md`.
- Commit(s): see `git log` for this session's part 1 commit, on top of
  `f7308a9`.
- Deviations and rationale:
  - **A defect was found and deliberately left unfixed: the rewrite's anchor
    flash has never been visible.** The four 1100/768 anchor entries said "the
    flash outline's own antialiasing"; the ring is not rasterised differently,
    it is absent. `classList.add('flash')` on an element a keyed `{#each}`
    owns is dropped by the next render. The fix will move the `@ ru` cells
    that currently pass by accident, so it needs the whole anchor set
    re-measured at once - see "Next batch" and `plan.md`.
  - **The synchronous scroll was tried and reverted.** app.js scrolls inside
    `render()`, so matching it looked like the faithful port; measured, this
    component's first layout is 8px short of its final one, and the sync
    version took `#/tables/core_item ~ row anchor` from exact to 6-8% at 1100
    and 768. Recorded in the effect's comment so the next session does not
    re-try it.
  - **A harness re-scroll on every width change was tried twice and
    reverted.** Replaying the page's own `scrollIntoView` after each resize
    made 768 worse in both variants (holding the node: the live app rebuilds
    its DOM on a language switch, so only the rewrite re-scrolled; holding a
    selector and re-querying: 768 went from exact to 8-9% anyway). The width
    sweep's remaining cost is recorded as debt rather than papered over.

- Batch name/id: **B3.6 part 2 - the instrument that would have caught them**
  (this session)
- What shipped: `typeAt` in `tests/parity/driver.js`; a `typeRuns` spec
  (`perWidth: true`) over the search box, a row's text and title, and a filter
  label; a `looks`/`measured` split in `tests/parity.js` with `measured` run
  inside the width sweep; the `DEBT_SLACK` ratchet, so a paid-off entry fails
  instead of passing silently; `docs/specs/COVERAGE.md` on three instruments.
  Also the four anchor cells re-baselined to CI, and one defect the instrument
  itself found. Full accounting in `plan.md`, "B3.6 built, part 2".
- Files changed: `tests/parity.js`, `tests/parity/driver.js`,
  `tests/parity/specs.js`, `docs/specs/COVERAGE.md`,
  `app/src/components/FilterBar.svelte`, `docs/parity.md`,
  `tools/parity-ubuntu/README.md`, `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): see `git log` for this session's part 2 commit.
- **The instrument found a real defect on its first clean run.** `filterLabel`
  differed in English by 0.1px of text advance, with identical font, family,
  string and element width - and a pixel verdict of `вид: совпадает`, 0.00%.
  Cause: B3.5's `{' '}` fix emitted two text nodes where `app.js` emits one,
  and an advance rounds per node. Fixed by moving the space inside the label's
  own expression, which Svelte cannot trim and which emits one node. This is
  the batch's thesis demonstrated on its first run: the page percentage called
  the screen identical while the type was measurably different.
- **The ratchet's first catch was false, and B3.5's rule caught it.** In the
  container, `#/roll/wondrous ~ pinned @ ru|en 375` measured 0.00% against
  3.64/3.82 and were reported stale. They are not: the host measures 3.52/3.76
  and CI passes them. The difference is a toast that fades before the slower
  container photographs it. Entries kept. Never delete an entry a ratchet
  surfaces without opening the diff first.
- Deviations and rationale: `app/src/components/FilterBar.svelte` was edited,
  outside part 2's stated scope of the harness. It is the fix for what the
  instrument found, it is one line, and `ACCEPTED` - the alternative the plan
  allowed - would have cost three keys and a paragraph to excuse a difference
  the line removes outright.

- Batch name/id: **B4 - the equipment tables, their facets and tier sections**
  (this session)
- What shipped: `#/tables/eq_weapon`, `#/tables/eq_secondary` and
  `#/tables/eq_armor` draw in full - the facet strip and panel (up to seven
  rows), four tier sections keyed `t1`-`t4` and labelled "Ранг n"/"Tier n",
  and the shared empty state. `dict.ts` gained the six equipment row labels;
  `label.ts` gained `srcName` with `srcLabel`'s five book cases delegating to
  it; `facets.ts` gained `EQ_SRC` and `eqFacetRows`, dispatched from the top
  of `facetRows`; `FilterBar.svelte`'s bare-number pill rule now tests
  `v.label` (the burden row's fix); `TableRows.svelte` carries
  `.selbox:has(:focus-visible)`; `TablesPage.svelte` lost `KNOWN`/`known`/
  `.todo` (every `TableId` draws a real body now) and gained `eqKind`, the
  equipment `rows`/`facPassed` branches, `bodyKind 'eq'`, `eqSections`, and a
  shared `statLine` used by both `matches` callbacks without `noType` (the
  search fix - typing the type word now keeps every weapon, matching
  app.js). Full accounting, including what matched the design and the one
  thing it did not anticipate, is in `plan.md`, "B4 built".
- **One real defect found and fixed, outside the brief's line list but inside
  the same touched path: `data.ts`'s `allEquip` concatenated `eq` and the
  roll-table records in the wrong order.** `equipOfKind`/`equipFacets` had no
  caller before B4, so nothing had ever looked at `allEquip`'s order - app.js's
  own `ALL_EQ = EQ.concat(...Object.values(DATA))` puts `eq` first; `data.ts`
  had `[...all, ...eq]`, `eq` last. The first `node tests/parity.js "eq_"` run
  caught it immediately: a bare `#/tables/eq_weapon` opened on `beast_feast`'s
  frame weapons instead of Core's, 0.95-2.46% on every cell of all three
  bare-route states. Fixed by swapping the concat order; a new `data.test.ts`
  case reproduces `ALL_EQ`'s construction directly off `data.json` and pins
  the id order so a future change is caught by a unit test rather than a
  parity screenshot. Confirmed no other caller of `allEquip` depends on order.
- Files changed: `app/src/lib/dict.ts`, `label.ts`, `label.test.ts`,
  `facets.ts`, `facets.test.ts`, `data.ts`, `data.test.ts`,
  `app/src/components/FilterBar.svelte`, `TablesPage.svelte`,
  `TableRows.svelte`, `tables.test.ts`, `a11y.test.ts`, `tests/parity/specs.js`,
  `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): **`fde9cdc`** - `feat(tables): the equipment tables, their facets
  and tier sections`, all sixteen paths in one commit (the fourteen above plus
  `issues/47/context.md`). Committed by the orchestrator, not by an
  implementer: two implementers in a row lost their turns waiting on
  background checks, and the batch was already code-complete and verified.
  See "Notes" for what that cost and the rule it earned.
- Deviations and rationale: the `allEquip` order fix (above) was not named in
  the brief's line list, but it sits directly in the lines B4 rewrites
  (`equipOfKind`, `equipFacets`, both first called by this batch) and is
  exactly the kind of "cheap, local, safe bug in a touched path" `CLAUDE.md`
  says to fix rather than defer. No other deviation from the brief.

- Batch name/id: **B5.1 - the list store, the toast, and the add-to-list row
  on the card** (this session)
- What shipped: `ListStore` (`app/src/state/lists.svelte.ts`) reads v2, migrates
  v1 once and leaves it untouched, saves merged with whatever storage holds
  now, and reloads on another tab's write; `AppState` grew `lists`, `menuFor`
  (cleared on `go()` and on the router's own `onChange`, not on `replace()`),
  and `say`/`hideToast`/`toast` with the live app's three durations
  (1600/2600/7000ms). `Toast.svelte` (new) is a `popover="manual"` element in
  `Shell.svelte`, in the top layer above `RecordModal`'s dialog and its own
  inertness. `AddToList.svelte` (new) is the button-then-menu control off
  `addToListBtn`/`listMenuHTML`: newest list first, the search box past eight
  lists, the inline new-list form, `placeMenu`'s flip-and-scroll, and the
  live app's own outside-click rule. `Button.svelte` grew `on`, `ghost`,
  `caret` (moved out of `FilterBar.svelte`, its first use) and `sameTab`.
  `RecordCard.svelte` grew the `pick` snippet and `.cardpick`;
  `RecordPage.svelte` and `RecordModal.svelte` render it
  (`AddToList` + the print link); `TablesPage.svelte`, `RollPanel.svelte`,
  `StdPanel.svelte`, `AltPanel.svelte` and `PageHead.svelte` all route their
  local `say` through `app.say` and lost their own `.said`/`sr-only` regions -
  `PageHead` now toasts `homeSet`/`homeReset` on a successful pin, matching
  `#/roll/wondrous ~ pinned`. `tests/parity/driver.js` gained `seed`/`storage`;
  `tests/parity.js`'s `arrive()` seeds before opening and `keyFor` hashes the
  seed; `tests/parity/specs.js` gained the four new `#/i/ci1` states, un-pended
  `~ toast`, added `listMembership`, and rewrote `VISUAL_DEBT`/`ACCEPTED` per
  what was actually measured (below).
- **Two things not in the brief's line list, fixed anyway because the touched
  path already owned them:**
  - `RollPanel.svelte`, `StdPanel.svelte` and `AltPanel.svelte` were not named
    in "Files expected" or "How it is built", but B5's own "Decided in
    planning" section says the toast "replaces the `said` live regions the
    pages invented" - plural, not the four files literally spelled out
    elsewhere. Left alone, `#/roll/wondrous ~ pinned` (Wondrous is `RollPanel`)
    could not have raised a real toast at all, which the acceptance criteria
    require. All three now route through `app.say`, including `StdPanel`'s
    `keepOneSource`/`keepOneKind` refusals and `AltPanel`'s `keepOneKind`,
    which previously wrote straight to local `said` state with no error flag.
  - Every `say(ok ? successMsg : t.copyFailed)` call site (`RecordActions`,
    `TablesPage`'s three copy-link functions, `StdPanel`/`AltPanel`'s
    `copyRoll`) needed a second argument once `say` could raise a real error
    toast - app.js's own `copyText`/`copyRich` always toast a failure with
    `role=alert` via a boolean second argument to `toast()`, which a
    text-only `said` region had no way to represent and so nobody had ported.
    Fixed by widening every `say` signature to `(msg, error?)` and passing
    `!ok` (or `true` for a refusal) at each site.
- **A defect the design's own acceptance criteria surfaced, not the plan
  itself: app.js's success toast always overwrites a just-shown failure
  toast, so a real live-app storage refusal is never actually seen.**
  `addIdsTo` calls `saveLists()` (which toasts `saveFailed` internally on a
  throw) and then unconditionally toasts `addedTo` right after, on the same
  synchronous pass - the second call always wins the single toast slot. Since
  this batch's acceptance criteria explicitly require "a refusing storage
  keeps the session and toasts `saveFailed`," `AddToList.svelte`'s `pick()`
  and `createNew()` check `save()`'s return value before showing the success
  toast on top of it - a deliberate, reasoned departure from copying app.js's
  literal call order rather than a parity gap: no parity state exercises a
  real storage failure, so nothing the harness compares moves either way.
- Files changed: `app/src/lib/dict.ts`, `icons.ts`; new `app/src/state/
  lists.svelte.ts`, `lists.test.ts`; `app/src/state/app.svelte.ts`,
  `app.test.ts`; new `app/src/components/Toast.svelte`, `AddToList.svelte`,
  `lists.test.ts`; `app/src/components/Button.svelte`, `button.test.ts`,
  `FilterBar.svelte`, `RecordCard.svelte`, `RecordPage.svelte`,
  `RecordModal.svelte`, `RollPanel.svelte`, `StdPanel.svelte`,
  `AltPanel.svelte`, `TablesPage.svelte`, `PageHead.svelte`, `Shell.svelte`,
  `shell.test.ts`, `a11y.test.ts`; `tests/parity/driver.js`, `tests/parity.js`,
  `tests/parity/specs.js`; `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): see `git log` for this session's B5.1 commit.
- Deviations and rationale: the three findings above (`RollPanel`/`StdPanel`/
  `AltPanel` in scope, every `say` call site widened to carry `error`, and the
  success-toast-over-failure fix); otherwise matches the brief. See
  `plan.md`, "B5.1 built" for the full accounting including the jsdom
  Popover-API gap and the outside-click null-prop race, both found and fixed
  while getting `npm run check` green.

- Batch name/id: **B5.1 fix-then-continue pass - blockers only** (this
  session, on top of `541d529`)
- What shipped: the reviewer's two blockers in `tests/parity/specs.js`, plus
  the three findings the full unfiltered run against `fe0043b` surfaced
  (`handoff.md`, "Blockers"). No replanning, no B5.2, one commit, per the
  orchestrator's explicit scope.
  - **Reviewer blocker B1, three stale excuses in `tests/parity/specs.js`:**
    - The six `#/roll/wondrous ~ pinned` entries and their block comment
      ("the rewrite has no toast yet") are **deleted**. `PageHead` has raised
      the toast since B5.1; the full unfiltered run already read all six at
      0.00% against debt 1.36-3.82, which is exactly the criterion B5.1's own
      brief set for deleting them. Confirmed again by this pass's own
      `node tests/parity.js "pinned"`: `расхождений нет`, all six
      `совпадает`.
    - The `listRow` helper and its four-line comment are **deleted** - no
      call site remained anywhere in the file (confirmed by grep before
      deleting).
    - `#/i/ci1 ~ toast @ en 375`'s `why` was a comma-spliced fragment ("the
      rewrite's toast still up, the live app's already faded - a timed
      state, not a difference"), not a sentence. Rewritten to "The rewrite's
      toast was still up while the live app's had already faded - a timed
      state, not a real difference."
  - **Reviewer blocker B2:** `PageHead.svelte:44`'s refused-pin toast said
    `t.copyFailed` where `app.js:4171` says `saveFailed` (B5.1 had already
    added the `saveFailed` key to `dict.ts` but the call site was never
    switched to it). Fixed to `say(t.saveFailed, true)`. This broke
    `roll.test.ts`'s "says nothing was saved when the browser refuses" test,
    which had asserted the old, wrong `copyFailed` text
    ("Не удалось скопировать") - updated to assert `saveFailed`'s text
    ("Не удалось сохранить: браузер блокирует локальное хранилище"). Checked
    every other `copyFailed` assertion in the suite
    (`tables.test.ts`, `alt.test.ts`, `record.test.ts`) - all four are real
    clipboard-copy-failure tests, unrelated to the pin/save path, untouched.
  - **`#/i/ci1 ~ whole @ ru 768` - 7.31% in the full run, expected zero, no
    entry.** Opened the diff image (`test-output/parity/
    _i_ci1_whole_ru_768-diff.png`) before writing anything, per this task's
    own instruction and `docs/parity.md`'s rule: it shows no visible content
    difference - not the picker row, not any other geometry change. Three
    consecutive `node tests/parity.js "ci1 ~ whole"` runs this session read
    `ru 768` and `en 768` at `совпадает` (0.00%) every time, while the
    sibling `@ 1100` cells (already-recorded `VISUAL_DEBT` entries) kept
    fluctuating between ~1.4-1.7% and their recorded 4.88-5.53%, on an
    unchanged build - the same instability class already documented for
    1100, just one that this host's quiet, filtered runs did not reproduce
    and the full suite's heavier concurrent run did. Recorded as debt at the
    full-run's 7.31% (the worst reading taken, not this pass's own 0.00%,
    per `VISUAL_DEBT`'s own "a figure only moves down once it is shown to
    hold" rule) with a reason naming the instability and asking CI to
    confirm - the same shape as the 1100 siblings, not a new defect.
  - **`#/i/ci1 ~ toast @ en 768` - 0.86% in the full run, expected zero, no
    entry.** Reproduced exactly at 0.86% by this pass's own
    `node tests/parity.js "pinned" "i/ci1"` run. Recorded plainly as a toast
    whose fade races the screenshot, the same class as the already-recorded
    `en 375` entry, with the reason stating the class is B5.2's to solve - no
    investigation beyond that, per the owner's explicit instruction not to
    chase the timed-toast problem in this pass.
  - **Nit taken:** `docs/specs/COVERAGE.md`'s suite-ownership table listed a
    bare `lists.test.ts` under "stated behaviour", but three files now share
    that name (`lib/`, `state/`, `components/`). Disambiguated the existing
    row to `lib/lists.test.ts` and added the two missing rows -
    `state/lists.test.ts` (held to `loadLists`..`storageWorks`/`createList`,
    app.js 1149-1330: the v1-to-v2 migration, merge-on-save, a refused
    write) and `components/lists.test.ts` (held to `listMenuHTML`/
    `addToListBtn`/`listMemberFor`'s live behaviour: the button, the menu, a
    chip's tick, the new-list form, the toast).
  - **Not touched, per the task's explicit scope:** the `menuFor`-after-
    modal-close divergence, the `!important` guard on the toast's hide, the
    unverified "announced above the dialog" claim, the `stop()` timer, the
    duplicated `knows` closure, the three anchor cells measuring better than
    recorded debt (pre-existing since B4), and the `#/i/ci1 ~ whole @ ru|en
    1100` cells' own instability (pre-existing, unchanged, still "CI to
    confirm" exactly as B5.1 left them) - all left for the orchestrator to
    record in Deferred, or already there.
- Files changed: `tests/parity/specs.js`, `app/src/components/
  PageHead.svelte`, `app/src/components/roll.test.ts`, `docs/specs/
  COVERAGE.md`, `issues/47/handoff.md`.
- Commit(s): see `git log` for this session's fix-then-continue commit, on
  top of `541d529`.
- Deviations and rationale: none from the five named items. The
  `roll.test.ts` fix is not in the task's line list but is the direct,
  necessary consequence of blocker B2's one-word fix - the touched path's
  own existing test asserted the text the fix removes, so leaving it broken
  was not an option.

- Batch name/id: **B5.2 part 0 - green CI, and the two unstable classes
  named** (this session, on top of `2f3659d`)
- What shipped: exactly the brief's scope, no production code, nothing under
  `app/`.
  - **The five entries CI failed at an exact 0.00% on two runs are deleted**,
    not lowered - `#/i/ci1 ~ whole @ ru 1100 / en 1100 / ru 768` and
    `#/i/ci1 ~ toast @ en 375 / en 768` in `tests/parity/specs.js`, along with
    the three block comments that described the instability they carried.
    Owner decision 1 leaves no figure but 0.00, and 0.00 is deletion by the
    ratchet's own rule.
  - **The timed class gets a mechanism, not a tolerance.** `#/i/ci1 ~ toast`
    and `#/roll/wondrous ~ pinned` gained `timed: true`, each with a one-line
    comment naming the reason. `tests/parity.js` now shares a `shootWidth(d,
    size)` closure between the ordinary width sweep and a timed state's own
    per-width re-arrival: a timed state's first page shoots only `WIDTHS[0]`
    (looks/controls/the 1100 shot untouched), then one further `withPage` per
    remaining width - `viewport`, `arrive` (open, seed, enter, language press),
    `shootWidth` - with the legacy screenshot cache still consulted per width
    before a page opens. `keyFor` now hashes `timed` so a future toggle
    invalidates the right cache entries.
  - **The whole-page class gets a mechanism too.** `driver.js`'s `shot(whole)`
    retakes a full-page capture until two in a row are `Buffer.equals()`,
    capped at four, logging one line naming the count only past the baseline
    two captures. A new `rectsAt(probes)` method (same selector policy as
    `typeAt`, `document.fonts.ready` first) backs a `geometry` spec
    (`perWidth`, `only: ['#/i/ci1 ~ whole']`) recording `.card`/`.cardpick`/
    `.foot` rects and `docHeight` at every width, appended to `SPECS`.
  - **Docs**: `docs/parity.md` gained `timed` in "Register the state first"
    and a "Two unstable classes" subsection under "Machine variance" with the
    recipe for a local red on each, plus two lines in "Harness invariants".
    `docs/specs/COVERAGE.md`'s "Three conditions the harness controls"
    became five clauses. The `STATES` doc comment in `specs.js` gained a
    `timed` line.
- **No deviation from the brief.** The `shootWidth` extraction and the
  `shot(whole)` retry counter are how the design's own "one page at a time is
  preserved" and "a page that has stopped moving is not a state" were made
  concrete in code; nothing outside the brief's scope, file list, or ordered
  steps was touched. No `VISUAL_DEBT` number was written from this host, per
  the brief's explicit prohibition.
- Files changed: `tests/parity/specs.js`, `tests/parity.js`,
  `tests/parity/driver.js`, `docs/parity.md`, `docs/specs/COVERAGE.md`,
  `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): see `git log` for this session's `fix(parity): ...` commit, on
  top of `2f3659d`.

- Batch name/id: **B5.2 part 1 - the selection bar** (this session, on top of
  `4210ee3`)
- What shipped: `app.sel` (a `SvelteSet<string>`) and `clearSel()` lifted onto
  `AppState`, cleared wherever `menuFor` already is and untouched by
  `replace()`; `TablesPage.svelte`'s local `sel` removed entirely.
  `lib/share.ts` gained `shareSelection` (no `skip` set, unlike `shareRoll`).
  `SelBar.svelte` (new) renders the count, the cross, the bar's own
  `AddToList`, a print link and a copy button, styled off `style.css`'s
  `.selbarwrap`/`.selbar`/`.selcount`/`.selx`/`.selacts` and their 600px
  overrides, read from source rather than guessed. `Shell.svelte` renders it
  between the footer and the toast. `AddToList.svelte`'s invented
  `.dropmenu.up` rule is deleted - style.css has no base rule for it, only
  `.cardpick .dropmenu.up`, so the bar's menu now opens upward by the base
  rule alone, as the live app's does. `RecordModal.svelte` folds a stale
  `app.menuFor` before every close path tells its parent to close, through a
  single `handleClose()` wrapper on the dialog's native `close` event (the
  close button, the backdrop and Escape all end there). `dict.ts` gained
  `clearSel`/`copySel`/`selCopied`. The harness's `driver.js` gained `nth` on
  `click()`; `specs.js` gained `NAME.copySel`/`clearSel`/`selected`, two states
  (`~ bar menu`, `~ selection copied` - the latter `timed: true`), two press
  specs (`copiedSelection`, `barMembership`), and deleted the six `selBar`
  debt entries plus the two stale `~ a row ticked … :: controls` `ACCEPTED`
  lines. Full accounting, every value read from `style.css` rather than
  guessed, and the one correction found while running the harness (a press
  spec's own commands run in whatever language `arrive()` left the page in,
  unlike a state's `enter`) are in `plan.md`, "B5.2 built, part 1".
- Files changed: `app/src/state/app.svelte.ts`, `app/src/state/app.test.ts`,
  new `app/src/components/SelBar.svelte`, `app/src/components/Shell.svelte`,
  `app/src/components/TablesPage.svelte`, `app/src/components/AddToList.svelte`,
  `app/src/components/RecordModal.svelte`, `app/src/components/record.test.ts`,
  `app/src/components/tables.test.ts`, `app/src/components/a11y.test.ts`,
  `app/src/lib/dict.ts`, `app/src/lib/share.ts`, `app/src/lib/share.test.ts`,
  `tests/parity/driver.js`, `tests/parity/specs.js`, `docs/specs/COVERAGE.md`,
  `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): see `git log` for this session's `feat(lists): ...` commit, on
  top of `4210ee3`.
- Deviations and rationale: none from the brief's scope, in-scope file list,
  ordered steps, or acceptance criteria. The `NAME.selected` addition and
  `copiedSelection`'s switch to `NAME[lang].selected` is a one-line correction
  to how the written design said to reach a state the design itself specified
  correctly - not a change to scope, and written up in full in `plan.md`.

- Batch name/id: **B5.3 - the lists index, the storage notice, `noData`**
  (this session, on top of `91d7899`). **Implemented in full; not
  committed** - see "Blockers".
- What shipped: `#/lists` draws the head with its four-paragraph help, the
  storage notice in both live forms (a plain undismissable warning when
  storage refuses; a folded "lists live in this browser only" disclosure
  otherwise, its cross remembered in `dhloot.warn.v1`), the panel with the
  create and restore rows, a card per list (a known-record badge, up to six
  thumbnails or "Список пуст", "Поделиться" copying the short players'
  link, "Удалить" behind a `DialogPort`), and the "no lists yet" empty
  state. `Shell.svelte`'s invented `storageOff` paragraph and dictionary key
  are gone. `ListStore` gained `remove` and `create(name, init)`; `AppState`
  gained `warnHidden`/`hideWarn()`. `Empty.svelte` (new) is the shared
  `.empty` box, its second real use, both inline copies removed.
  `ports/dialog.ts` (new) wraps `window.confirm`. Eighteen dictionary keys
  landed, the `lists` help entry, and the global `input::placeholder` rule
  in `tokens.css`. The driver gained `summary` in `click()`'s selector and a
  dialog auto-accept; the specs gained a seed, six states and three press
  specs. Full accounting, every measured number, the two things found and
  fixed along the way, and the one blocker found and reported rather than
  resolved: `plan.md`, "B5.3 built".
- **Two things found and fixed inside the touched path, neither in the
  brief's line list:** axe's `nested-interactive` rule fires on the storage
  notice's dismiss button sitting inside its own `<summary>` - app.js's own
  markup, unavoidable given `<details>` hides every child but the first
  `<summary>` while closed - accommodated in `app/src/test/a11y.ts`'s `OFF`
  map alongside `color-contrast`. And `npm run check`'s own first `prettier
  --write` pass (needed to clear an unrelated formatting failure)
  reformatted `ListsPage.svelte`'s hand-glued whitespace-avoidance markup
  back into a real bug - fixed with the `<!-- prettier-ignore -->` device
  `TableRows.svelte` already carries for the identical reason.
- **One blocker, found by the harness, reported rather than resolved:**
  `#/lists ~ notice unfolded @ en 1100/768/375` read 5.88/6.40/9.05% against
  an expected zero; the Russian cells of the same state are exact, and every
  other `#/lists` state and cell reads `совпадает`. Root cause, confirmed by
  reading `storageWarning()`/`hideWarn` in app.js: the live app's `<details>`
  carries no `open` state tracked in JS, so pressing `EN` - which rebuilds
  `#view`'s `innerHTML` from scratch - silently re-folds it; the rewrite's
  Svelte-owned `<details>` persists across the same language switch because
  nothing recreates the element. This is exactly the divergence `plan.md`'s
  own "Decided in planning" already reasoned about and accepted **on the
  stated assumption that it would be invisible to every state** - an
  assumption this state's own English cells disprove. Not one of the six
  causes the plan named to check first, and not an implementer's design
  call to re-open alone - see "Blockers" for the three unchosen paths
  forward.
- Files changed: `app/src/lib/dict.ts`, `help.ts`, `help.test.ts`;
  `app/src/styles/tokens.css`; new `app/src/ports/dialog.ts`;
  `app/src/ports/types.ts`, `index.ts`, `ports.test.ts`;
  `app/src/state/lists.svelte.ts`, `lists.test.ts`, `app.svelte.ts`,
  `app.test.ts`; `app/src/components/Button.svelte`, `button.test.ts`; new
  `app/src/components/Empty.svelte`; `app/src/components/TablesPage.svelte`;
  new `app/src/components/ListsPage.svelte`, `listsPage.test.ts`;
  `app/src/App.svelte`; `app/src/components/Shell.svelte`, `shell.test.ts`,
  `a11y.test.ts`; `app/src/test/a11y.ts`; `tests/parity/driver.js`,
  `tests/parity/specs.js`; `docs/specs/FEATURES.md`, `docs/specs/
  COVERAGE.md`; `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): **none.** Working tree left uncommitted, per this task's own
  explicit stop condition - the acceptance criterion "every `#/lists` cell
  at 0.00%" is not met, for a reason outside the six the plan named to
  check, and deciding how to close it is not this pass's call. The
  pre-existing uncommitted change to `issues/47/context.md` (present before
  this session started) was left exactly as found.
- Deviations and rationale: none from the brief's scope, in-scope file
  list, or ordered steps. The two in-path fixes above are cheap, local, and
  inside the touched path, per `CLAUDE.md`. The one substantive departure
  from "done" is the blocker itself, which is a stop rather than a design
  choice made in this pass - full reasoning in `plan.md`, "B5.3 built".

- Batch name/id: **B5.3 close-out - the notice re-folds on a language
  switch** (this session, on top of `91d7899`). **Implemented; closes B5.3
  as one commit.**
- What shipped: `ListsPage.svelte`'s `{:else if !app.warnHidden}` branch
  wraps the `<details class="warn">` … `</details>` in `{#key app.lang}` …
  `{/key}`, with a comment naming the mechanism (`restoreOpen`, app.js
  3769) - the live `render()` builds the notice fresh on a language switch
  and only re-applies a person's fold/unfold to `[data-keep]` elements,
  which this is not. The `<summary>`'s glued children and the `<p>` are
  untouched; `npx prettier --write` made no change, so no
  `<!-- prettier-ignore -->` was needed. `listsPage.test.ts` gained one case
  in `describe('the head and the panel')`: unfold, press `EN`, assert the
  fresh `details.warn` is closed and `'more'` (English `readMore`) is
  present, ending in `expectNoA11yViolations`. `docs/specs/FEATURES.md`'s
  Lists storage-notice bullet gained the one clause on unfolding not being
  remembered across a language switch. Full accounting: `plan.md`, "B5.3
  built", "Close-out decision", "Close-out run".
- **No deviation from the brief.** `npm run check` needed one re-run on the
  documented worker-fork host-load crash (`Test Files 34 passed (36)`,
  `Tests 687 passed (782)`, two unhandled errors) - re-run per the brief's
  own instruction, not salvaged; the second attempt was exit 0.
- Files changed: `app/src/components/ListsPage.svelte`,
  `app/src/components/listsPage.test.ts`, `docs/specs/FEATURES.md`,
  `issues/47/plan.md`, `issues/47/handoff.md`; `issues/47/context.md` goes
  into the same commit as it stood (untouched by this pass).
- Commit(s): one commit, `feat(lists): the lists index`, authored `artex-x
  <artex-x@users.noreply.github.com>`, on top of `91d7899`, containing the
  whole B5.3 batch (the 26 paths B5.3 already held plus the five above) -
  see `git log` for its sha. No push.
- Deviations and rationale: none from the brief's scope, file list, or
  ordered steps.

- Batch name/id: **B5.3 fix-then-continue - one blocker, remediation only**
  (this session, on top of `ba8f4b1`).
- What shipped: the reviewer's one blocker against `ba8f4b1`, plus the two
  recorded facts that stated the live behaviour incorrectly and the coverage
  gap that let it through, per the orchestrator's explicit blockers-only
  scope. No replanning, no B5.4, one commit.
  - **The blocker**: `ListsPage.svelte:181`'s card link called
    `encodeList(l, true)` (the players' payload); the live app's own
    `listCardHTML` (app.js:2894) calls `listHash(l)` with one argument, so
    `listHash`'s `forPlayers` (app.js:1534) goes undefined, falsy, and
    `encodeListRaw(l, false)` keeps any `hnote`. Only `goToList`
    (app.js:1539-1540) passes `true`. Fixed to `encodeList(l, false)` to
    match live - a port, per `CLAUDE.md`'s first migration law; the
    reviewer's "keep the safer players' link as a deliberate deviation"
    alternative was ruled out by the task rather than chosen here. After
    navigation `syncListUrl` (app.js:1599-1606) still `replaceState`s to the
    players' form regardless, so the address bar converges - what the fix
    changes is the rendered `href` attribute, the hover status bar and the
    history entry, for any list carrying a GM-only note.
  - **The two facts**: `context.md`'s "The card link is the players'
    payload" and `plan.md`'s "A card" both stated `listHash(l, true)`/
    `encodeList(l, true)`; both corrected to name the bug, cite app.js:2894
    (the call) and app.js:1534 (the signature) - verified by reading the
    file directly rather than copied from the task brief, which cited
    2895/1554 (a small, immaterial citation drift, noted rather than
    silently overridden) - and to note the `syncListUrl` convergence nuance.
  - **The coverage gap**: `listsPage.test.ts`'s two `toHaveAttribute('href',
    ...)` assertions pinned `encodeList(listA/B, true)`, the wrong value;
    fixed to `false`. Simply flipping the boolean would leave the test
    unable to ever catch this again, since the two payload flavours are
    byte-identical for a list with no `hnote` - exactly why 36/36 parity
    cells and the whole unit suite passed with the bug in place. `listA`
    gained `hnote: 'только для мастера'` and the test now asserts
    `encodeList(listA, false)` and `encodeList(listA, true)` are unequal
    immediately before the href assertions, so the test proves it can tell
    the two flavours apart rather than merely executing a line that would
    pass either way.
  - **Not fixed, deferred**: a parity spec that reads `a.listcard-main`'s
    `href`, seeded with an `hnote`-carrying list, is the only thing that
    would have caught this from the outside - no parity spec reads any
    `href` today, and adding one is a harness change beyond this pass's
    scope. Recorded in "Deferred".
  - **Also recorded, not fixed**: the reviewer's five nits (the
    suite-wide `nested-interactive` a11y override, `FEATURES.md:79` reading
    narrower than the code, `.badge` inline in a third component, the
    once-read `works` flag, `ListStore.create`'s wider-than-needed `init`)
    and the review verdict itself (reviewer, opus, against `ba8f4b1`,
    fix-then-continue, one blocker, five nits) - both in "Deferred".
- Files changed: `app/src/components/ListsPage.svelte`,
  `app/src/components/listsPage.test.ts`, `issues/47/context.md`,
  `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): one commit, `fix(lists): ...`, authored `artex-x
  <artex-x@users.noreply.github.com>`, on top of `ba8f4b1` - see `git log`
  for its sha. No push.
- Deviations and rationale: none from the task's scope, file list, or
  ordered steps. The app.js line-number citations (2894/1534) differ from
  the task brief's (2895/1554); both are corrected to the verified figures
  since the whole point of citing them is that "the next reader can check
  rather than trust."

- Batch name/id: **B5.4a - the list page (complete but for the live drag
  semantics)** (this session, resuming a tree two prior sessions had
  already written steps 1-9 into and proved step 10 on).
- What shipped: verification and close-out only - no production code
  changed in this session; steps 1-9's five new components (`ListPage.svelte`,
  `RowMain.svelte`, `HelpBox.svelte`, `HelpButton.svelte`,
  `StorageNotice.svelte`), `listPage.test.ts`, the `App.svelte` route, and
  the dict/lib/state/ports/harness edits are committed exactly as the
  previous sessions left them. Step 11's parity loop (six filter groups, ten
  new states across 96 cells, plus 72 regression cells) read `совпадает`
  everywhere on the first pass - no diff was ever opened because none went
  non-zero. `npm run check:built` exited 0. Full accounting in `plan.md`,
  "B5.4a built".
- Files changed: none beyond what steps 1-9 already staged (see "Files
  expected" in "Next batch" below for the full list); this session's own
  edits are `issues/47/plan.md`, `issues/47/handoff.md`,
  `issues/47/context.md`.
- Commit(s): one commit, `feat(lists): the list page`, authored `artex-x
  <artex-x@users.noreply.github.com>`, on top of `f38b900` - see `git log`
  for its sha. No push.
- Deviations and rationale: none from the plan's ordered steps, acceptance
  criteria, or file list.

## Verification

- Commands run (exact), this session (B5.4a, resuming at step 11 on
  `f38b900`):
  - `npm run build` - clean; `dist/assets/app.js` 263.46 kB, 79.59 kB gzip.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists/a @"` (1 state, 6
    cells) - `расхождений нет`, all 6 `совпадает`.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "~ noted" "~ money help"` (2
    states, 12 cells) - all 12 `совпадает`.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "~ roll panel" "~ rolled" "~
    removed" "~ note opened"` (4 states, one timed, 24 cells) - all 24
    `совпадает`.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists/b" "#/lists/nope" "own
    list"` (3 states, 18 cells) - all 18 `совпадает`.
  - Regression: `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists @" "#/lists
    ~"` (6 states, 36 cells) - all 36 `совпадает`, unchanged from B5.3's own
    reading.
  - Regression: `MSYS_NO_PATHCONV=1 node tests/parity.js "i/ci1 ~"` (6
    states, 36 cells) - all 36 `совпадает`, unchanged.
  - **Ten new states, 96 cells, all `совпадает` on the first pass; 72
    regression cells, all `совпадает`. No diff image was opened - nothing
    ever read non-zero.**
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 120` - one
    foreground call, `timeout: 600000`. **Exit 0.** `npm run build` (clean,
    same output as above), `npm run smoke` ("the built page opens from a
    folder"), `npm run budget` (77.3 kB gzip against the 120 kB budget).
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground
    call, `timeout: 600000`, run immediately before `git commit` per the
    brief (the doc edits in this same batch change the tree fingerprint and
    disarm the cache step 10 armed). See the exact result recorded once the
    call completes, below/in Status.

- Commands run (exact), this session (B5.3 fix-then-continue remediation,
  against `ba8f4b1`):
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground
    call, `timeout: 600000`. **Exit 0 on the first attempt** - no worker-fork
    crash this run. format/lint/typecheck (523 files, 0/0)/data/derived/
    i18n/selftest (292 passed) all clean; `vitest run --coverage`: **782
    tests, 36/36 files passing**, 96.89/90.09/96.93/97.15
    statements/branches/functions/lines, every threshold met -
    `ListsPage.svelte` itself at 98.78/92.85/100/97.67.
  - `npm run build` - clean; `dist/assets/app.js` 223.59 kB, 69.23 kB gzip
    (unchanged from B5.3's own reading - a one-word value change, not a new
    branch).
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists"` (6 states, 36 cells,
    one timed) - **`расхождений нет`**, all 36 cells `совпадает`. This run is
    a regression guard, not proof of the fix: no parity spec reads any
    `href` attribute, so the card-link payload flavour is invisible to pixel
    comparison whenever no list carries an `hnote` - see "Deferred", the
    parity-coverage-gap entry.
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 120` - one
    foreground call, `timeout: 600000`. **Exit 0.** `npm run build` (clean,
    same output as above), `npm run smoke` ("the built page opens from a
    folder"), `npm run budget` (67.2 kB gzip against the 120 kB budget).
  - **The corrected test actually distinguishes the two payload flavours**:
    `listsPage.test.ts` now seeds `listA` with `hnote: 'только для мастера'`
    and asserts `expect(encodeList(listA, false)).not.toBe(encodeList(listA,
    true))` immediately before the two `toHaveAttribute('href', ...)`
    assertions - so the suite would fail if the two flavours ever collapsed
    back to being byte-identical for this fixture, which is exactly the
    condition that let the original bug through 36/36 parity cells and the
    whole unit suite unnoticed.

- Commands run (exact), this session (B5.3 close-out):
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground
    call, `timeout: 600000` - **two attempts**:
    1. Hit the documented worker-fork host-load crash: `Worker exited
       unexpectedly`, `Test Files 34 passed (36)`, `Tests 687 passed
       (782)`, two unhandled errors, several components reading
       artificially low coverage because their files never ran under the
       dead worker. Not a code defect; re-run per the brief's own
       instruction not to salvage a run that goes over under load.
    2. **Exit 0.** format/lint/typecheck (523 files, 0/0)/data/derived/
       i18n/selftest (292 passed) all clean; `vitest run --coverage`:
       **782 tests, 36/36 files passing**, 96.89/90.09/96.93/97.15
       statements/branches/functions/lines, every threshold met.
  - `npx prettier --write app/src/components/ListsPage.svelte` before the
    check - unchanged; the glued `<summary>` survives formatting, so no
    `<!-- prettier-ignore -->` was added.
  - `npm run test -- listsPage` - 20/20 passed (the run's own per-file
    coverage errors are the filter's own artifact, not a gate failure).
  - `npm run build` - clean; `dist/assets/app.js` 223.59 kB, 69.23 kB gzip.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists"` (6 states, 36
    cells, one timed) - **`расхождений нет`**, all 36 cells `совпадает`,
    including the three `~ notice unfolded @ en` cells that read
    5.88/6.40/9.05% before this pass. **Supersedes the "3 расхождения"
    line in the B5.3 entry below**, which is kept as the historical record
    of the blocker as found.
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 120` - one
    foreground call, `timeout: 600000` - **exit 0**: build, `file://`
    smoke, bundle budget (67.2 kB gzip against 120 kB).
  - **No `VISUAL_DEBT` or `ACCEPTED` entry was written** - the three cells
    are now exact, not excused.
  - `"nothing found" "#/tables ~"` (10 states, 60 cells) and `"i/ci1 ~"`
    (6 states, 36 cells) were **not re-run**, per the brief - banked from
    B5.3's own run below; nothing outside `ListsPage.svelte` renders the
    keyed block.
  - `git log --oneline -3` and `git status --porcelain`, checked before
    starting and again immediately before staging: HEAD stayed at
    `91d7899` throughout; only the five files named in "Completed" (close-
    out) changed, plus the pre-existing 26 B5.3 paths.

- Commands run (exact), this session (B5.3):
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground call
    each time, `timeout: 600000`, needed **six attempts** on this loaded host
    (19 peer sessions, measured 1.3 GB free of 16 GB at the time):
    1. `format:check` failed on six files this batch touched
       (whitespace/wrapping only) - fixed with `npx prettier --write` on
       those six.
    2. `lint` failed - one `@typescript-eslint/no-confusing-void-expression`
       on `ListsPage.svelte`'s delete button - fixed with braces, matching
       `AddToList.svelte`'s own convention.
    3. `svelte-check` crashed the process with a V8 out-of-memory error - a
       host-load crash, not a code defect; re-run per the brief's own
       instruction not to salvage a run that goes over under load.
    4. `typecheck` passed (523 files, 0/0); `vitest run --coverage` crashed a
       worker fork (`ERR_IPC_CHANNEL_CLOSED`), leaving many components read
       as 0% because their tests never ran under the dead worker - the same
       documented memory-pressure signature, not a defect; re-run.
    5. Everything passed except one real failure this run surfaced:
       `listsPage.test.ts`'s "draws two cards..." case, off by a literal
       space (`'Клад дракона1 '`). Traced to attempt 1's own `prettier
       --write` reformatting `ListsPage.svelte`'s hand-glued
       whitespace-avoidance markup onto separate lines, reintroducing the
       exact whitespace text node the glueing exists to prevent -
       `TableRows.svelte` already carries a `<!-- prettier-ignore -->`
       comment for this identical failure mode. Fixed the same way,
       confirmed stable (`prettier --write` again, diffed, no change), the
       single test re-run alone (19/19) before the next full attempt.
    6. **Exit 0.** format/lint/typecheck (523 files, 0 errors, 0
       warnings)/data/derived (`производные файлы: всё сходится`)/i18n
       (`переводы: паритет соблюдён`)/selftest (292 passed) all clean;
       `vitest run --coverage`: **781 tests, all files passing**,
       96.89/90.09/96.93/97.15 statements/branches/functions/lines, every
       per-file and overall threshold met.
  - `npm run build` - clean; `dist/assets/app.js` 223.39 kB, 69.15 kB gzip.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists"` (6 states, 36 cells,
    one timed) - **3 расхождения**, all `#/lists ~ notice unfolded @ en
    1100/768/375` (5.88/6.40/9.05%), all diagnosed in "Completed" and
    "Blockers"; the other 33 cells `совпадает`. Run once; the diff images
    were read before anything was written, per `docs/parity.md`'s own rule,
    and the cause is structural (a language switch, not a rendering
    fluke) so a second run was not expected to, and would not, change it.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "nothing found" "#/tables ~"`
    (10 states, 60 cells - the `Empty` extraction and the placeholder rule)
    - `расхождений нет`.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "i/ci1 ~"` (6 states, 36 cells
    - the `pickq` and new-list placeholders) - `расхождений нет`, including
    three `снимок целиком` retries on `~ whole`'s already-known
    instability, not a new one.
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 120` - exit 0:
    build, `file://` smoke (`the built page opens from a folder`), bundle
    budget (67.1 kB gzip against 120 kB).
  - **No `VISUAL_DEBT` or `ACCEPTED` entry was written.** Writing one for
    the failing state would be exactly the design call "Blockers" reports
    rather than makes.
  - `git log --oneline -3` and `git status --porcelain`, checked repeatedly
    (before starting, before each `npm run check` retry, and again at the
    end): HEAD stayed at `91d7899` throughout - no peer session touched this
    tree while this batch ran. The pre-existing uncommitted change to
    `issues/47/context.md` was left exactly as found.

- Commands run (exact), this session (B5.2 part 1):
  - `npm run lint` - exit 0. `npm run typecheck` - `svelte-check`, 519 files, 0
    errors, 0 warnings.
  - `npm run format:check` - four newly-written/edited files needed
    `prettier --write` (whitespace/wrapping only); `npx prettier --write` on
    those four, then a clean re-run.
  - `npx vitest run app/src/state/app.test.ts app/src/lib/share.test.ts
    app/src/components/tables.test.ts app/src/components/record.test.ts
    app/src/components/a11y.test.ts app/src/components/lists.test.ts
    app/src/components/shell.test.ts` - first run: **2 failed of 228** -
    `tables.test.ts` queried the print link by its `title` text
    (`getByRole('link', { name: <the long title> })`), which is not how
    testing-library computes an accessible name when the element also has
    visible text content (`lists.test.ts`'s own existing test already queries
    the same live-app print link by `'Печать'` and checks `title` as a
    separate attribute - the harness's own `NAME_FN` is the one that
    deliberately prefers `title`, for its own reasons, not testing-library);
    and `record.test.ts` was missing the `Element.prototype.scrollIntoView`
    stub `lists.test.ts`/`a11y.test.ts` already carry, which the tier-ladder
    modal's own `AddToList` control now needs too. Both fixed; clean re-run:
    **228 passed**.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground call,
    `timeout: 600000`: **exit 0** - format/lint/typecheck/data/derived/i18n/
    selftest all pass, `.claude/hooks/selftest.mjs` 292 passed, `vitest run
    --coverage` **751 tests**, 96.74/90/96.84/97.1 statements/branches/
    functions/lines, every threshold met.
  - `npm run build` - clean; `dist/assets/app.js` 204.84 kB, 63.78 kB gzip.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "a row ticked" "bar menu"
    "selection copied"` (3 states, 18 cells, one timed) - first run: **1
    расхождение**, `copiedSelection`'s own `run()` throwing "no control named
    Выбрано (nth 1)" on both apps identically in English - see `plan.md`,
    "B5.2 built, part 1" for the root cause (a press spec's commands run
    against whatever language `arrive()` already switched to, unlike a
    state's own `enter`) and the fix (`NAME[lang].selected`). Re-run: **
    расхождений нет**, every cell `совпадает`.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/tables ~"` (8 states, 48
    cells - the full filter, not merged with the one above) - **расхождений
    нет**: the three new/changed states read `совпадает` at every cell; the
    five untouched states (`~ grid`, `~ searched`, `~ nothing found`, `~ a row
    opened`, `~ help`) matched their pre-existing recorded numbers exactly
    (`~ a row opened`'s six cells at 0.02-0.07%, the close button's own focus
    ring, unrelated to this batch) or read `совпадает`.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "i/ci1 ~"` (6 states, 36 cells -
    the card's own add-to-list states, run specifically to prove the
    `.dropmenu.up` deletion did not regress the card) - **расхождений нет**,
    every cell `совпадает`.
  - `npm run check:built` - **exit 0**: build, `file://` smoke, bundle budget
    (61.9 kB gzip against 120 kB).
  - **No `VISUAL_DEBT` number was written from this host.** Every cell either
    matched a pre-existing entry or read `совпадает`; no diff image was
    opened because none was needed.
  - `git log --oneline -3` and `git status --porcelain`, checked twice (once
    before starting, once immediately before committing): HEAD stayed at
    `4210ee3` on `f167e62`/`2f3659d` throughout - no peer session touched this
    tree while this batch ran. Only the files named in "Completed" above were
    modified.
  - Note on the shell: `"#/tables ~"` and similar arguments starting with `/`
    are rewritten by Git Bash's own path conversion (into something like
    `#C:/Program Files/Git/tables ~`) unless the call carries
    `MSYS_NO_PATHCONV=1` - worth carrying forward, since the first attempt at
    the `"#/tables ~"` filter silently ran zero states because of it.

- Commands run (exact), this session (B5.2 part 0):
  - `npm run build` - clean; `dist/assets/app.js` 201.70 kB, gzip 63.09 kB.
  - `node tests/parity.js "i/ci1 ~ toast" "pinned"` (12 cells, the two timed
    states) - **run twice, `расхождений нет` both times**, every cell
    `совпадает` in both languages at every width. The second run exercises
    the per-width cache path for the timed states (the cache key now hashes
    `timed`, so this batch's edit invalidated it once and only once).
  - `node tests/parity.js "ci1 ~ whole"` (6 cells) - one console line,
    `снимок целиком: 3 попытки до устойчивого кадра`, then every cell
    `совпадает`; `geometry` produced no `FAIL` line at any width - silent, as
    the acceptance criteria require.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground
    call, `timeout: 600000`: **exit 0**, format/lint/typecheck/data/derived/
    i18n/selftest all pass, `svelte-check` 518 files/0 errors/0 warnings,
    `vitest run --coverage` 732 tests, 96.67/89.64/96.57/97.01 statements/
    branches/functions/lines, every threshold met. As the brief notes,
    `.prettierignore` and `eslint.config.mjs` both skip `tests/`, so this run
    does not prove the harness edits' own style - matched by hand against the
    surrounding code instead, and proven correct by the parity filters above
    and below.
  - `node tests/parity.js "i/ci1"` (7 states, 42 cells - the full record-route
    family, including the four B5.1 list states) - **`расхождений нет`**,
    every cell `совпадает`.
  - **No cell read non-zero on this host at any point in this batch.** No
    `VISUAL_DEBT` number was written, per scope.
  - `git status --porcelain` before committing: only the six files the brief
    named as expected were modified; `git log --oneline -3` re-read
    immediately beforehand still showed HEAD at `2f3659d` - no peer session
    moved this tree while this batch ran.
  - `npm run check:built` was not run, per the brief: nothing under `app/`
    changed and `dist/` is unaffected by this batch's edits.
  - **Breadth check, orchestrator, after the commit at `f167e62`:**
    `node tests/parity.js "tables/community" "roll/std ~ one source"` -
    **`расхождений нет`**, all 18 cells `совпадает`. The point of it was the
    refactor rather than the mechanisms: the shared `shootWidth` closure is on
    the path of *every* state, and these three states are untouched by this
    batch, use the ordinary sweep, and exercise the warm legacy cache. Only
    three states in the suite carry `whole` or `timed`
    (`#/i/ci1 ~ whole`, `#/i/ci1 ~ toast`, `#/roll/wondrous ~ pinned`) and the
    implementer ran all three; this covers the other path.

- Commands run (exact), this session (B5.1 fix-then-continue pass):
  - `npm run check 2>&1 | tail -n 120` - first run: **1 failed of 732**,
    `roll.test.ts`'s "says nothing was saved when the browser refuses" test,
    which asserted the pre-fix `copyFailed` text against `PageHead.svelte`'s
    now-corrected `saveFailed` call. Fixed the test's expectation (see
    "Completed"). Clean re-run: **exit 0** - format/lint/typecheck/data/
    derived/i18n/selftest all pass, `svelte-check` 518 files/0 errors/0
    warnings, `vitest run --coverage` 732 tests, 96.67%/89.64%/96.57%/97.01%
    statements/branches/functions/lines, every threshold met. Both runs used
    the plain form (no `set -o pipefail` prefix), per the task's explicit
    instruction that the hook accepting it is not yet built.
  - `node tests/parity.js "pinned" "i/ci1"` - **3 расхождения**, all
    accounted for and none new:
    - All six `#/roll/wondrous ~ pinned` cells: `совпадает` - confirms the
      deletion criterion. A follow-up `node tests/parity.js "pinned"` alone
      (run to get the literal text the task's own acceptance line names)
      printed **`расхождений нет`**.
    - `#/i/ci1 ~ whole @ ru 1100` (1.43% against recorded 5.53%) and
      `@ en 1100` (1.70% against recorded 4.88%) - the pre-existing,
      already-documented instability on this cell family, untouched by this
      pass, reproducing the same "стало лучше" shape it already carries.
    - `#/i/ci1 ~ whole @ ru 768` - **0.00%** this run, against the 7.31%
      just recorded from the full run's own reading (see "Completed" for the
      diff-image check and the three prior runs that also read 0.00%). Left
      at 7.31% rather than lowered, matching how the 1100 siblings are
      already handled and per `VISUAL_DEBT`'s own rule that a figure moves
      down only once shown to hold, not off a single quiet run.
    - `#/i/ci1 ~ toast @ en 768` read exactly its newly-recorded 0.86% and
      `@ en 375` exactly its existing 2.78% - both pass within debt, printed
      as `вид: X% из Y% долга` rather than as failures; the tool's own exit
      code counts only the three cells above as расхождения, all of them
      the pre-existing/already-accounted-for instability, none the toast
      entries.
  - Both parity commands were run as their own foreground call, unchained
    and unredirected, exactly as instructed.

- Commands run (exact), this session (B5.1):
  - `npm run check 2>&1 | tail -n 120` - **first attempt exceeded the 600s
    foreground cap and was moved to the background** (this host measured
    slower than context.md's 165s baseline this session); the background run
    itself finished at exit 0 and was read from its own captured output, not
    treated as the gate-arming call. Every subsequent call was run to
    completion in the foreground as the brief requires.
  - `npm run lint` - first real run: **5 errors**, `@typescript-eslint/
    no-unsafe-member-access`/`no-unsafe-assignment` on `JSON.parse(...)[0]`
    in `components/lists.test.ts` (three call sites). Fixed with a typed
    `readLists(storage): StoredList[]` helper. Clean re-run: **exit 0**.
  - `npm run typecheck` - first real run: **11 errors**, all
    `exactOptionalPropertyTypes` violations from passing `{ error }` where
    `error: boolean | undefined` into an opt-in `error?: boolean` object
    property (`AppState.say`'s `opts`, the `Toast`/`ToastAction` interfaces,
    every `say` wrapper's own call to `app.say`, and one test's `said` array
    type), plus one `Array.prototype.map(liftNotes)` type mismatch
    (`StoredList` lacks `LegacyList`'s index signature) and one unused
    `menuEl` binding in `AddToList.svelte`. All eleven fixed - the `error`/
    `action` properties widened to `T | undefined` everywhere they are
    optional and might be assigned one, `liftNotes` called through a small
    cast with a comment naming the exact mismatch, `menuEl` removed since
    the placement effect already queries `.dropmenu` off `root`. Clean
    re-run: **exit 0**, 518 files, 0 errors, 0 warnings.
  - `npm run test` (`vitest run --coverage`) - first real run: **7 failed of
    730**. In order, found and fixed:
    - `AddToList.svelte`'s outside-click handler throwing
      `Cannot read properties of null (reading 'id')` when a modal closes
      (three `roll.test.ts`/`alt.test.ts` failures) - the null-prop race in
      "Completed" above, fixed with the `try`/`catch`.
    - `Element.prototype.scrollIntoView is not a function` (four
      `lists.test.ts` failures) - jsdom does not implement it; stubbed with
      `Element.prototype.scrollIntoView = vi.fn()` at the top of
      `lists.test.ts` and `a11y.test.ts`, the existing pattern
      `tables.test.ts` already uses per-test.
    - Re-run: **3 failed** - `shell.test.ts`'s `getByRole('alert')` and
      `getByRole('status')` not finding the toast despite it being in the
      DOM with the right `role`/text (`screen.debug` confirmed this); traced
      to jsdom's own `[popover]:not(:popover-open){display:none}` default
      stylesheet rule, which it applies without implementing
      `showPopover`/`hidePopover`/`:popover-open` matching, so the element
      was permanently `display:none` in every test. Fixed in `Toast.svelte`'s
      effect: when `showPopover` is not a function, set `el.style.display`
      directly, which wins over the UA rule the way any inline style does.
      One of the three failures was a second, independent bug in the new
      test itself - `#/roll/std` is `DEFAULT_HOME`, so its pin button starts
      already pinned and the button named "Открывать этот раздел при
      запуске" never existed; moved that assertion to `#/roll/wondrous`,
      which is not the default and is the actual route `#/roll/wondrous ~
      pinned` exercises.
    - Re-run: **1 failed** - `state/lists.test.ts`'s `create()` test asserted
      `toBe` (reference equality) on `store.lists[0]`, but `lists` is
      `$state` and Svelte 5 wraps a stored object in a reactive proxy, so
      the reference is not the one `create()` handed back. Changed to
      `toEqual`.
    - Clean re-run: **exit 0**, 730 tests. Coverage then failed its own gate:
      `Toast.svelte` (80.64%/63.33% stmts/branches) and `Button.svelte`
      (83.33%/66.66%/75% stmts/branches/funcs) both under their per-file
      thresholds - the `showPopover`-present branch and the anchor form's
      caret were each exercised by nothing. Added one test to each: `shell.
      test.ts` stubs `showPopover`/`hidePopover`/`matches` directly on the
      toast element to exercise the branch a real browser takes and jsdom
      cannot; `button.test.ts` renders the href form with `caret: true`.
      Final clean run: **exit 0**, 732 tests, 96.67%/89.64%/96.57%/97.01%
      statements/branches/functions/lines, all thresholds met.
  - Final gate-arming call, exactly as the brief writes it,
    `npm run check 2>&1 | tail -n 120`, one foreground call: **exit 0**, 732
    tests, thresholds met.
  - `npm run build` - clean; `dist/assets/app.js` 201.70 kB, 63.09 kB gzip.
  - `node tests/parity.js "i/ci1"` (7 states) - first run: **3 расхождения**,
    all on states the design predicted would go to zero and one it did not
    predict at all (`#/i/ci1 ~ toast @ en 375`, still `pending` at the start
    of this batch) - every one of the four new list states was already
    `совпадает` (0.00%) on this first run, in both languages, at every
    width. Investigated and recorded as `VISUAL_DEBT` rather than chased
    further - see "Blockers" for what each one is and why. Re-run twice more
    while measuring `#/i/ci1 ~ whole @ 1100`'s stability (below); the four
    new list states and `listMembership` stayed at `совпадает` across every
    run.
  - `node tests/parity.js "i/q1" "i/f1" "wondrous ~ modal" "a row opened"
    "pinned"` (6 states) - first run: **22 расхождения**, all of them the
    ratchet's own "стало лучше - опусти число" shape (every recorded debt
    figure measuring far better than what was recorded pre-B5.1) except
    `#/roll/wondrous ~ pinned @ ru 375`, which read inside its slack. `#/i/q1`
    and `#/i/f1` themselves were exact on every cell. Re-run once more to
    check stability: `#/i/q1 ~ another tier`, `#/roll/wondrous ~ modal` and
    `#/tables ~ a row opened` reproduced their 0.02/0.03/0.07 figures exactly,
    both languages, both runs - recorded as measured. `#/roll/wondrous ~
    pinned` did not reproduce (five of six cells flipped between ~0% and
    their recorded figure across the two runs) - left exactly as recorded,
    per the brief's own instruction for a state that does not read 0.00% on
    all six.
  - `npm run check:built` - **exit 0**: build, `file://` smoke, bundle budget
    (61.3 kB gzip against 120 kB).
  - `docker build -t dh-parity:ubuntu24 tools/parity-ubuntu` - **fails as
    committed**: `COPY package.json package-lock.json ./` with a build
    context of `tools/parity-ubuntu` finds neither file there - they live at
    the repository root. Copying both in temporarily (not committed) let the
    image build; `docker run --rm -v "$PWD:/work:ro" ...` then did not
    finish its own `cp -a /work/. /app/` inside a 60s probe on this host and
    was killed rather than pursued further - Windows volume-mount
    performance through Docker Desktop, not investigated past that. Not
    fixed here: the Dockerfile/README are B3.6's, out of this batch's scope,
    and the gap is recorded in "Blockers" for whoever picks it up. `node
    tests/parity.js "tables"` and the unfiltered suite are the
    orchestrator's, per the brief.

- Commands run (exact), this session (B4):
  - `npm run check` - first attempt **exit 1** on one lint error
    (`@typescript-eslint/no-unnecessary-type-assertion` on the `EQ_LINE` cast
    in `facets.ts` - `EQ_LINE`'s declared type is already `Record<string,
    Pair>`, so `Object.keys(EQ_LINE) as (keyof typeof EQ_LINE)[]` changes
    nothing; removed). Typecheck then failed twice more on real type errors
    (`build[g]()` possibly undefined; `facets.test.ts`'s loop variables typed
    `string` rather than `TableId`), both fixed. Clean re-run: **exit 0**,
    format/lint/typecheck/data/derived/i18n/selftest all pass, 682 tests
    (later 683 with the `data.test.ts` addition), coverage 96.47%
    statements / 89.94% branches / 96.13% functions / 96.7% lines - all above
    threshold.
  - One `npm run check` re-run mid-session hit the documented
    vitest-pool-runner timeout on four unrelated test files (`money.ts`,
    `lists.ts`, `listLink.ts`, `hash.ts`, `search.ts`, `tables.ts`, `dice.ts`
    reported low/zero coverage because their suites never started) with zero
    `chrome.exe` running - the same "one flaky timeout, re-run before
    investigating" gotcha `handoff.md` already names for B3.5. A clean re-run
    immediately after passed the same way as the first: 683 tests, thresholds
    met.
  - `npm run build` - clean.
  - `node tests/parity.js "eq_"` - **first run: 21 расхождений**, every
    bare-route state (`eq_weapon`/`eq_secondary`/`eq_armor`) and
    `eq_secondary ~ searched` failing 0.95-2.46% at every width, both
    languages; the five other new states (`~ panel open`, `~ filtered`,
    `~ filter link`, `~ nothing found`) were already clean. Root-caused to
    `data.ts`'s `allEquip` order (see "Completed") rather than accepted as
    debt - the diff images showed a different first screenful, not noise.
    After the one-line fix in `data.ts`: **`расхождений нет`**, every one of
    the eight states at 0.00% in both languages at all three widths; the two
    off-screen specs (`filteredAddress`, `copiedFilterLink` on
    `#/tables/eq_weapon ~ filtered`) matched too. Exact per-state percentages
    are in `plan.md`, "B4 built".
  - `npm run check:built` - **exit 0**: build, `file://` smoke
    ("the built page opens from a folder"), bundle budget (57.4 kB gzip
    against the 120 kB budget).
  - `node tests/parity.js "tables"` (full, all 34 states in the filter,
    run in the background per the brief - over the 600s foreground cap with
    B4's eight new states added) - **7 расхождений, all pre-existing and
    unrelated to B4.** Every failing cell is one of two anchor states neither
    B4 built nor touched:
    `#/tables/voa ~ section anchor @ ru 375` (9.97% vs. debt 11.55%),
    `@ en 768` (0.00% vs. debt 0.42%), `@ en 375` (8.90% vs. debt 10.31%), and
    `#/tables/core_item ~ row anchor @ ru 375` (8.84% vs. debt 10.52%),
    `@ en 1100` (0.00% vs. debt 0.42%), `@ en 768` (0.00% vs. debt 0.43%),
    `@ en 375` (7.91% vs. debt 9.92%) - every one measuring **better** than
    its recorded debt, the `DEBT_SLACK` ratchet's "стало лучше - опусти
    число" shape, not a regression. These are exactly the states
    "Blockers" already names as fragile on this machine - the anchor-flash
    defect and the harness's frozen-scrollY-across-the-width-sweep
    limitation, both pre-existing and explicitly not B4's to fix per the
    brief's own scope. Confirmed unrelated to this batch by reading the
    diff rather than by `git stash` (blocked by the permission classifier
    this session): `eqKind` is falsy for both `voa` and `core_item` (neither
    is an equipment table), so every branch B4 added
    (`eqKind`/`rows`/`facPassed`/`bodyKind 'eq'`/`eqSections`) is dead code
    on these two tables' render path, and the one piece of shared code
    (`statLine`) is only invoked when a query is typed - neither anchor
    state types one. No code this batch touched executes differently for
    these two tables than before the batch. **Not re-baselined**, per owner
    decision 1 and the brief's own instruction not to touch anything outside
    B4's states - left for the orchestrator, same as B3's unfiltered-gate
    findings were.
  - Every other one of the 34 states in the "tables" filter - including all
    eight of B4's own - measured `совпадает`/`0.00%`.

- **The commit's own check evidence is the 00:11 run, and later attempts could
  not reproduce it - said plainly rather than rounded up.** The passing
  `npm run check` recorded against this tree (683 tests, thresholds met) is the
  implementer's, run after the last production edit; every code and test file
  in the commit was last written at 23:51 and only `issues/47/*.md` changed
  afterwards, which is why the commit gate accepted the commit. The
  orchestrator then ran `npm run check` twice more, at 03:03 and 03:49, and
  **both failed to run any test at all**: `Test Files no tests`, `Errors 33`,
  every file reporting
  `[vitest-pool]: Failed to start forks worker ... Timeout waiting for worker
  to respond`, and a coverage table reading 0% for everything. That is the
  vitest fork pool failing to spawn, not a coverage regression - no test
  asserted anything, so nothing could have regressed. Machine state at the
  time: 2.9 GB free of 16 GB, 372 processes, five peer sessions live, zero
  `chrome.exe` and zero stray vitest workers. The documented "one flaky
  timeout, re-run before investigating" gotcha is the same failure in a milder
  form; on a loaded host it takes the whole suite.
- **`npm run check` fit one foreground tool call and stalled two implementers
  in a row.** Both are true, and the second is not caused by the first. The
  gate hook reads the Bash tool's own captured stdout, so a run that is
  backgrounded - by the agent, or by the harness moving it there at the cap -
  is invisible to it however honestly it passes; each implementer started the
  check in the background and then spent its turns waiting for a result the
  gate could never accept. That part stands. The diagnosis written beside it -
  that the suite had outgrown the 600s cap - is **withdrawn, measured**; see
  the bullets that follow.

- **The `npm run check` question, settled (orchestrator, 2026-09-10). It fits,
  with room.** At `720266d`, tree clean, timed stage by stage in one
  foreground call each: `format:check` 11s, `lint` 30s, `typecheck` 12s,
  `data` 4s, `derived.js` 1s, `i18n.js` 0s, `selftest.mjs` 19s,
  `vitest run --coverage` 88s - **165s in total against a 600s cap.** Then the
  whole thing as one command, `npm run check 2>&1 | tail -n 120`: **exit 0,
  33 files, 683 tests, 96.47/89.94/96.13/96.7, every threshold met**, and
  `.claude/.check-cache.json` picked it up (`1b74ffa56fc2ecb7`), so the commit
  gate is armed for this tree exactly as `.claude/README.md` documents. The
  host was not idle while this ran: 1.0 GB free of 16 GB, 383 processes, 20
  node processes (all MCP servers - no stray vitest worker, no `chrome.exe`).
- **What the B4 session actually hit was the fork pool failing to boot, not a
  suite that had grown.** Vitest's worker start timeout is **60s and
  hardcoded** - `START_TIMEOUT` in `vitest/dist/chunks/cli-api.*.js`, read this
  session; there is no config knob for it - and `isolate` defaults to true, so
  the forks pool spawns a fresh child per test file. On a host too short of
  memory to boot a child within 60s, all 33 files fail one after another,
  which is precisely the recorded signature: `Test Files no tests`,
  `Errors 33`, `Failed to start forks worker ... Timeout waiting for worker to
  respond`, and a coverage table of zeros. The ~345s was 33 doomed 60s waits
  overlapped across the pool - the suite never ran at all.
- **Recognition test**, so this is never investigated as a coverage regression
  again: zeros across the whole coverage table, `Errors N` equal to the number
  of test files, and no test assertion anywhere in the output. Nothing ran, so
  nothing can have regressed. Re-run before reading a single number.
- **The fallback, if it repeats on a loaded host** - measured, not guessed:
  `npx vitest run --coverage --maxWorkers=4` cuts the peak fork count and the
  memory that goes with it, at a real cost - **171s against 88s**, because
  fewer forks is less parallelism, not less work. Reach for it only after the
  default has failed twice on the same tree. It is a fallback, not an
  improvement to adopt.
- **Nothing is changed in `vite.config.mts`, `package.json` or the gate.** A
  cap on `maxForks` would double the check's cost on every healthy run to
  insure against a host condition; `isolate: false` would cut the spawn count
  but trades jsdom isolation between files for it, which is the property the
  component suite rests on; and the gate has no defect - it accepted this
  session's run on the first try. The smallest change that preserves behaviour
  here is none.
- **The standing rule this leaves:** run `npm run check` as one foreground
  call, unchained and unredirected, piped to `tail`. If it fails without
  running a test, that is the host, and the answer is to re-run it - not to
  background it, not to redirect it to a file, and not to reach for
  `SKIP_CHECK_GATE=1`.

- Commands run (exact), this session (B3.6 part 2):
  - The revert proof, scripted: each of B3.5's three fixes reverted alone,
    `npm run build`, `node tests/parity.js "community ~ panel open"`, restored
    after each. `:: search` failed at 1100/768/375; `:: filterLabel` failed in
    all six cells; `:: rowText` and `:: rowTitle` failed **at 375 only** - the
    case for `perWidth`, since that defect does not exist at 1100.
  - `node tests/parity.js "community ~ panel open"` clean tree - **3
    расхождений**, all `filterLabel` in English (advance 105.9 vs 106).
  - The same after the one-line fix - **`расхождений нет`**.
  - `node tests/parity.js "pinned"` on the host - 3.52% and 3.76% against
    3.64/3.82, passing, which is what proved the container's 0.00% wrong.
  - `npm run check` - **exit 0**; 96.43% statements, 90.02% branches, 95.91%
    functions, 96.65% lines. An earlier attempt failed on
    `ENOENT app/coverage/.tmp/coverage-1.json` while another session's vitest
    ran in the same tree; alone, it passes.
  - `npm run check:built` - **exit 0**, 56.8 kB gzip against 120 kB.
  - A full-suite container run was **lost**: started with `docker run --rm` and
    no redirect, so the container was removed on exit and `docker logs` had
    nothing left. See gotchas.
- **Not run: a clean full local suite.** Since part 1 the table follows CI, so a
  development host disagrees with it by design on a handful of cells. CI is the
  gate; the container covers layout states only. See "Blockers".


- Commands run (exact), this session (B3.6 part 1):
  - `gh run download 34361836525 -n failure-output` into a scratch directory
    outside the repository - 205 MB, the ubuntu `parity.log` plus 810 PNGs.
    **22 FAIL lines**, against the dozen `gh run view 34361836525
    --log-failed` prints. The extra ten: `#/tables ~ help @ en 768` and
    `@ en 375`, both `voa ~ section anchor @ 375` cells, both `core_item ~ row
    anchor @ 375` cells, and `#/i/f1`'s four (two inventory, two pixel).
  - `npm run build` - clean, five times across the session.
  - `node tests/parity.js "ci1 ~ whole" "wondrous ~ help" "i/f1" "a row
    ticked" "tables ~ help" "section anchor" "row anchor" "wondrous ~ modal"`
    - the baseline before any fix: 16 расхождений, matching what the CI
    artifact says except where the two machines differ.
  - `node tests/parity.js "~ help" "ci1 ~ whole" "a row ticked" "i/f1"
    "wondrous ~ modal"` after the `.helpbox` fix - **all eighteen help cells
    0.00%**; `ci1 ~ whole`, `a row ticked`, `modal` and `f1` unmoved, which is
    what says the fix is confined to the panel.
  - `node tests/parity.js "section anchor" "row anchor"` - run three times
    across the session after the `ready()` change, `расхождений нет` each
    time, same numbers to the hundredth (`row anchor @ en 375` 7.92 three
    times where it used to alternate 7.92/8.47).
  - `npm run check` - **exit 0**; 96.43% statements, 90.02% branches, 95.92%
    functions, 96.65% lines.
  - `npm run check:built` - **exit 0**: build, `file://` smoke, bundle budget
    (56.8 kB gzip against 120 kB).
  - `node tests/run-all.js parity` (full, unfiltered) - **three attempts, no
    clean result, and the reason is not this batch.** A second agent was
    rewriting `img/`, `og/`, `data.js` and `i/*.html` in the same working tree
    and deleting `test-output/` under the run; see "Blockers". Attempt 1 died
    at 153s, attempt 2 at 286s and attempt 3 at 44s, each with `ENOENT` on a
    screenshot path because the output directory had been removed mid-run.
    Attempt 2 got through **130 of the ~264 cells** before it died and its
    failures are exactly the six this batch predicts and no others:
    `#/roll/wondrous ~ modal @ ru 768` (8.73 against 8.57) and `@ ru 375`
    (13.90 against 13.55), which pass on CI and fail only here, plus five of
    the six re-baselined `#/i/ci1 ~ whole` cells reported as *improved*
    (5.37 against 5.87, 5.61 against 6.14, 7.64 against 8.49, 5.40 against
    5.91, 7.69 against 8.37) because the table now follows CI and this machine
    reads lower. Everything else in those 130 cells passed, including all
    twelve `~ help` cells it reached. **Re-run this gate on a quiet tree
    before trusting it.**
- Standalone probes, all with the harness's own launch args
  (`--no-sandbox --disable-dev-shm-usage --disable-gpu`) and its
  `prefers-reduced-motion: reduce`, both apps, kept outside the repository:
  - `document.fonts` in both apps: `size` **0**, `status` `loaded` before the
    first paint, `ready` settling ~400ms in. This is what disproves the
    face-swap reason the anchor effect's comment carried.
  - the help panel at 768: box rect, padding, border, margin, and every
    paragraph's rect, computed `font`, `line-height` and per-line client
    rects - **identical to three decimals in both apps** before the fix, which
    is what makes the pixel difference a paint difference rather than a layout
    one.
  - the width sweep: `window.scrollY` 368/368/374 for the live app against
    368/368/387 for the rewrite at 1100/768/375, one `scrollIntoView` each, at
    1100, against the same 118px `scroll-margin-top`.
  - `.flash` presence: live app yes on arrival, no after 1.6s, **yes again
    after the EN click**; rewrite no at every step.
  - pixel decomposition of the CI screenshots (pixelmatch with the harness's
    own settings, `diffMask`, banded by row): `#/i/ci1 ~ whole @ ru 1100` is
    0.49% the missing row, ~1.7% the footer it holds down and 3.62% the 38px
    band the shorter page runs out at; reinserting those 38px leaves
    **zero** changed pixels below the row.
- Results: the batch's own fixes are clean and reproducible under focused
  runs; `npm run check` and `npm run check:built` pass. The unfiltered gate
  has no clean result and could not get one while a second agent shared the
  tree - reported rather than worked around. **CI green is the criterion that
  matters and it is not verified either** - it needs the owner to push. Read
  the run against the resulting commit before treating part 1 as done.

- Commands run (exact), the part 0 session, all by the orchestrator
  after the workers lost theirs:
  - `node tests/parity.js tables --no-cache` (empty cache) - 12m39s, exit 1 on
    the one pre-existing failure below.
  - `node tests/parity.js tables` - 12m22s, exit 1, same.
  - `node tests/parity.js tables` again (warm, 44 cache keys) - 11m22s, exit 1,
    same. **`diff` of all three logs is byte-identical**, which is part 0's
    acceptance criterion.
  - Invalidation: appended a comment to `style.css`, ran `node tests/parity.js
    dread`, watched the key count go 44 -> 48, restored the file from a byte
    copy - `git diff` clean afterwards.
  - `node tests/parity.js dread --no-cache` on a clear machine - 48 keys
    before, 48 after, proving the flag writes nothing.
  - `npm run check` - **exit 0**; 96.43% statements, 90.02% branches, 95.92%
    functions, 96.65% lines.
  - `npm run check:built` - **not run, deliberately**: part 0 changes nothing a
    screen draws (harness, CI workflow, a test helper, a config comment).
- The one failure, in every run: `#/tables/core_item ~ row anchor @ en 375`
  at **8.47% against its recorded 7.92%**. Pre-existing, not part 0's, and
  see "Blockers" - it is a race, not a drift.

- Commands run (exact), the B3 session:
  - `npm run check` - passes: format, lint, typecheck (0 errors), data build,
    `derived`, `i18n`, and the full Vitest suite (657 tests, all thresholds
    met).
  - `npm run check:built` - passes: build, `file://` smoke, bundle budget
    (56.8 kB gzip against a 120 kB budget).
  - `node tests/parity.js "tables"` - passes clean (`расхождений нет`).
- Commands run, the B3.5 session, in order:
  - `node tests/parity.js "tables"` (twice - once to recover the numbers the
    predecessor agent's background run had produced but not logged, once after
    the `VISUAL_DEBT` rewrite) - both **`расхождений нет`**, second run's exact
    per-state percentages are in `plan.md`, "B3.5 built".
  - A scratch experiment: `.selbox`'s media rule commented out,
    `npm run build`, `node tests/parity.js "section anchor"` - reproduced the
    old 9.52%/8.84% exactly; restored, rebuilt, re-confirmed 10.05%/8.90%.
  - A second scratch experiment: the focus-glow `box-shadow` line removed,
    `npm run build`, `node tests/parity.js "searched"` - identical numbers with
    and without it; restored, rebuilt.
  - `npm run check` - **exit 1 on the first run** (one Vitest test,
    `sections.test.ts`'s "opens on the first tier", timed out at 5000ms; zero
    `chrome.exe` processes were running at the time, so it was not the
    documented vitest-vs-parity contention). Isolated re-run of that one file
    passed in 8.37s. Re-ran the full `npm run check` clean: **exit 0**, 658
    tests passing, coverage thresholds met (96.43% statements / 90.02%
    branches / 95.92% functions / 96.65% lines).
  - `npm run check:built` - **exit 0**: build, `file://` smoke, bundle budget
    (56.8 kB gzip against 120 kB).
  - `node tests/run-all.js parity` (full, unfiltered) - **exit 1**, but every
    failing state is one of the four in "Blockers", none of them touched by
    this batch. Confirmed pre-existing with `git stash`: identical failures,
    identical numbers, against the unmodified tree.
- Results: the `tables`-filtered gate this batch owns is clean, twice, before
  and after the root-cause experiment. The unfiltered gate is red for reasons
  proven unrelated to this batch - see "Blockers" for the exact states and the
  proof.
- Gates for the next batch (B5.1): `npm run check 2>&1 | tail -n 120` (one
  foreground call, ~165s), `npm run build`, `node tests/parity.js "i/ci1"`
  (7 states) and `node tests/parity.js "i/q1" "i/f1" "wondrous ~ modal"
  "a row opened" "pinned"` (6 states) - each its own foreground call - then
  `npm run check:built`. `node tests/parity.js "tables"` and the unfiltered
  `node tests/run-all.js parity` are the orchestrator's. What is left of a
  full run's redness on a Windows machine is the documented per-platform
  tolerance, cell by cell, in "Blockers".

## Next batch

**B5.4a is closed** (this session) - built, verified, and committed as
`feat(lists): the list page` on top of `f38b900`. The brief that stood here
(implement-ready, steps 0-13) is retired to `plan.md`, "B5.4a built". Do not
reopen it.

What is left of the lists slice: **B5.4b (drag as the live app does it -
outlined, not planned, in `plan.md`, "B5.4b outlined"), B5.5 (the batch
bar's actions under a ticked selection) and B5.6 (the shared page, packed-
link expansion, taking a shared list)** - all three unplanned. Picking and
planning the next of them is the orchestrator's / planner's call, not this
session's; this batch's own instructions were explicit not to start any of
the three.

- **NEEDS_HUMAN_CONFIRMATION: no.**

## Blockers

- **RESOLVED in planning (planner, 2026-09-10): `#/tables ~ selection copied
  @ en 1100` is a stale legacy-cache hit, not a defect and not a debt.** The
  diff image (opened first) is red only over the toast: the legacy shot has
  none, the rewrite's has it. The legacy PNG is byte-identical to
  `test-output/.parity-cache/a6515261…/1100.png`, written 21:50:41 during
  the full suite under its load - after the 1600ms toast had gone - and the
  22:05 "isolated" run wrote all three English legacy files within 35ms of
  each other, i.e. copied them from the cache rather than shooting them, so
  the two measurements share one capture. `tests/parity.js` turns the cache
  off for `measured` states and not for `timed` ones (414, 459-460,
  476-477). Fix: B5.4a step 0 (`&& !timed` on the three guards, a doc
  sentence), its own commit; then `node tests/parity.js "selection copied"`
  is expected at six `совпадает`, and a residue on `@ en 1100` alone would be
  the documented timed class for CI to read. Full evidence and the rejected
  alternatives: `plan.md`, "B5.4 planned", "Decided in planning", first
  bullet. The measurement record below stands as taken.
- **The full unfiltered suite on `e82cd24`: five failing cells, 1848.8s, 8
  workers** (orchestrator, 2026-09-10, `node tests/run-all.js parity`, run in
  the foreground and read from its own output, not from an exit status).
  **None of the five is a `#/lists` cell** - B5.3's own six states are clean
  at 36/36, measured three times.

  ```text
  FAIL #/tables ~ selection copied @ en 1100 :: 0.74% отличий, ожидался ноль
  FAIL #/tables/voa ~ section anchor @ ru 375 :: 10.03%, долг записан как 11.55%
  FAIL #/tables/voa ~ section anchor @ en 375 :: 8.90%,  долг записан как 10.31%
  FAIL #/tables/core_item ~ row anchor @ ru 375 :: 8.84%, долг записан как 10.52%
  FAIL #/tables/core_item ~ row anchor @ en 375 :: 8.47%, долг записан как 9.92%
  ```

  - **The four anchor cells are the documented machine-variance class and
    need no action.** All four `VISUAL_DEBT` entries say so in their own
    `why`: each was RAISED from a development machine's figure to "what CI
    measures", reproduced by three CI runs and the ubuntu container
    (`tests/parity/specs.js` 1197-1213). A local Windows run reads lower and
    the ratchet therefore fails them as improved - owner decision 1 working
    as intended, written into `docs/parity.md`, "Machine variance". **Do not
    edit these numbers off a local run.**
  - **`#/tables ~ selection copied @ en 1100` is new and is not explained by
    that class.** It is a B5.2 part 1 state, not B5.3's, and no `#/lists` or
    `ListsPage` code renders on its path. Measured twice: 0.74% under the
    full suite, then **0.74% again in an isolated six-cell run**
    (`node tests/parity.js "selection copied"`), with all five sibling cells
    - `ru 1100/768/375` and `en 768/375` - reading `совпадает` both times.
    Reproducing identically under load and alone rules out suite load as the
    cause. Two facts that bound it and are not a diagnosis: this state has
    never been through a full unfiltered suite (the last one ran on
    `fe0043b`, before the selection bar existed) and CI has never read it
    either (`ff741ad` is unpushed), so "expected zero" is a value it was
    given, not one any full run or CI has ever confirmed; and B5.3's own
    verification run of `"nothing found" "#/tables ~"` covered this state and
    read it clean. **Root-causing it is a planning question, deliberately not
    settled by the orchestrator** - the diff image has not been opened and no
    `VISUAL_DEBT` entry has been written. Next session: hand it to the
    planner with these measurements rather than re-measuring them.

- **RESOLVED (implementer, 2026-09-10) - B5.3 fix-then-continue: the list
  card's link rendered the GM payload, not the players' one.** Found by the
  reviewer against `ba8f4b1`: `ListsPage.svelte:181` called
  `encodeList(l, true)`, but the live app's `listCardHTML` (app.js:2894) calls
  `listHash(l)` with **one argument** - `listHash(l, forPlayers)` (app.js:1534)
  then has `forPlayers` undefined, falsy, so `encodeListRaw(l, false)` keeps
  any `hnote` on the card's own `href`. Only `goToList` (app.js:1539-1540)
  passes `true`. Fixed to match live: `encodeList(l, false)`. Not a design
  call - `CLAUDE.md`'s first migration law is to reproduce the shipped app's
  rendered behaviour, and the "keep the safer players' link" alternative the
  reviewer offered was explicitly ruled out by the task, not chosen here.
  `context.md` ("The card link renders the GM payload...") and `plan.md`
  ("A card") both carried the wrong claim and are corrected in the same
  commit, with the app.js line numbers this pass verified by reading
  (2894/1534, not the review's 2895/1554 - a minor citation drift, re-checked
  against the file rather than copied). `listsPage.test.ts`'s two
  `toHaveAttribute('href', ...)` assertions pinned the old, wrong value;
  fixed to `encodeList(listA/B, false)`, and `listA` now carries an `hnote` so
  the two payload flavours actually diverge (`expect(encodeList(listA,
  false)).not.toBe(encodeList(listA, true))` proves it) - without that, the
  two flavours are byte-identical for any list with no `hnote`, which is
  exactly why 36/36 parity cells and the whole unit suite passed with the bug
  in place. See "Verification" for the commands and results, and "Deferred"
  for the parity-coverage gap this pass deliberately left open (no `href` is
  read by any parity spec) and the five nits the review also raised.

- **RESOLVED (implementer, 2026-09-10) - B5.3's `~ notice unfolded @ en`
  cells: the notice re-folds on a language switch.** Path 1, language change
  only, built exactly as decided: `{#key app.lang}` around the `<details>`
  in `ListsPage.svelte` with a comment naming the mechanism, one new
  `listsPage.test.ts` case, one clause in `FEATURES.md`. `node
  tests/parity.js "#/lists"` now reads all 36 cells `совпадает`, including
  the three that were `5.88%/6.40%/9.05%` before this fix. Closed by this
  session's `feat(lists): the lists index` commit - see `git log`. Full
  verification: "Verification" below and `plan.md`, "B5.3 built", "Close-out
  decision", "Close-out run". What follows is the original diagnosis, kept
  as the record - it was confirmed, not re-derived. `node tests/parity.js
  "#/lists"` read 33 of 36 cells at `совпадает`; `#/lists ~ notice unfolded
  @ en 1100/768/375` read 5.88%/6.40%/9.05% against an expected zero
  (Russian cells of the same state are exact). Diff images opened first, per
  `docs/parity.md`'s rule: `-legacy.png` shows the storage notice **folded**,
  `-next.png` shows it still **open** with the `<p>` body text visible and
  the page correspondingly taller.

  **Root cause, confirmed by reading source, not guessed.** `storageWarning()`
  (app.js 2872-2886) and `hideWarn`/`warnHidden` (2865-2871) never track the
  disclosure's open/closed state in JS - it is transient, native `<details>`
  DOM state, read by nobody. `arrive()`'s own sequence presses `EN` *after*
  `enter()` has already opened the disclosure in Russian; pressing `EN` on
  the live app calls its `render()`, which rebuilds `#view`'s `innerHTML`
  from scratch, and a freshly-built `<details>` with no `open` attribute
  starts closed - the earlier click's effect is silently discarded. The
  rewrite's `<details>` is a persistent Svelte-owned element nothing
  recreates on a language change, so its `open` property survives exactly
  as the person left it.

  **This is not a new defect - it is `plan.md`'s own "Decided in planning"
  section, already reasoned about, on an assumption this state disproves.**
  Verbatim: *"The disclosure keeps its open state across a create. Live
  folds it as a side effect of replacing `innerHTML`; the rewrite's
  `<details>` persists. Invisible to every state (each starts folded),
  kinder to a person, recorded rather than reproduced."* That reasoning
  covered a *create*; it did not anticipate that a *language switch* is the
  same class of live-app re-render, and `#/lists ~ notice unfolded` - the
  very state the plan wrote to prove the disclosure opens - is exactly where
  a language switch after the press makes the assumption visible instead of
  invisible. Not one of the plan's own six named first-look causes (all
  either ruled out by the other 33 passing cells, or simply inapplicable to
  a state-persistence question).

  **Three paths, as the implementer reported them - since decided: 1 taken
  (language change only; navigation already remounts the page, create and
  delete stay as "Decided in planning" has them), 2 rejected on mechanics
  (`ACCEPTED` is read only by the spec `diff()`, so a pixel cell could only
  be excused by a Windows `VISUAL_DEBT` figure, which owner decision 1
  forbids), 3 rejected (a ten-line harness change that would blind the
  suite to a divergence a person reaches in two clicks):**
  1. Make the rewrite's disclosure re-fold on a language switch (a
     production change beyond B5.3's line list, and its own open design
     question: only on a language change, matching what actually triggered
     this failure, or on every navigation, matching what the live app's
     `render()` implies more broadly - which would also touch B5.4's list
     page once it exists).
  2. Accept the kinder rewrite behaviour and add an `ACCEPTED` line naming
     it - directly contradicts this batch's own written acceptance
     criterion ("no `VISUAL_DEBT` or `ACCEPTED` entry expected... none names
     `#/lists`") and needs the owner's sign-off to override a criterion
     rather than an implementer's judgement call.
  3. Change what `~ notice unfolded` compares so it does not span a language
     switch after the press - not obviously possible in the current
     one-state-many-widths-and-languages model without a new harness
     mechanism.

  Everything else about B5.3 is done and verified - see "Completed" and
  `plan.md`, "B5.3 built" for the full accounting. **Closed**: the close-out
  batch (below, retired brief) applied path 1 and B5.3 is now one commit -
  see `git log` for `feat(lists): the lists index`.

- **RESOLVED, measured: CI has read the selection bar and the lists index,
  and its parity is green.** Someone pushed this machine's work through
  `e82cd24` (`git reflog show origin/main` records "update by push"; not the
  orchestrator, which never pushes). Run **`34521343531`** on `e82cd24`:
  `check` **success**, all four `parity` shards **success**, `audit`
  **success**. That is CI's authoritative word on B5.2 part 1 and on B5.3 -
  the condition both were waiting on. `deploy` is **skipped**, behind the one
  failing job below.

- **CI run `34521343531` fails one job: `secrets`, on three false
  positives - and B5.3's own commits are the cause.** gitleaks' default
  `generic-api-key` rule flags `const WARN_KEY = 'dhloot.warn.v1'`
  (`app/src/state/app.svelte.ts:32`, commit `ba8f4b1`), its test copy, and
  `plan.md:4343` quoting it: the string clears the rule's 3.5 entropy
  threshold by 0.02. These are localStorage key names, public by
  construction and already written down in `docs/specs/STATE.md`; the app
  has no backend to authenticate against. **Already being handled outside
  this session** - an untracked `.gitleaks.toml` sits in the working tree,
  written by another session, extending the default ruleset with an
  allowlist for the key-name shape and recording that `[allowlist]` must be
  used rather than `[[allowlists]]`, which parses and is then silently
  ignored in gitleaks 8.24.3. The orchestrator left it untouched and
  uncommitted. **Do not duplicate that work**; check whether it has landed
  before writing anything about gitleaks.

- **Superseded, kept for the shape of it: "CI has not yet read this
  session's B5.2 part 1 commit."** Three filtered
  parity runs from this host are clean (`a row ticked`/`bar menu`/`selection
  copied`, `#/tables ~`, `i/ci1 ~` - see "Verification"), `npm run check` and
  `npm run check:built` both exit 0, and no `VISUAL_DEBT` number was written -
  but per owner decision 1, CI is the authoritative machine and a local run is
  advisory. The orchestrator's CI read of this commit (and of the still-open
  read on part 0's `f167e62`, below) is what actually closes B5.2 in full.

- **The full unfiltered suite on `fe0043b`: 12 failing cells** (orchestrator,
  2026-09-10, `node tests/run-all.js parity`, 1826s, 8 workers). Read the
  output, not the exit status - the run was invoked as `... > file 2>&1; echo
  "EXIT $?"`, so the harness reported the `echo`'s 0 while the suite failed.
  The same class of mistake this session documented, committed by the
  orchestrator an hour after writing the rule down.
  - **Resolved, fix-then-continue pass:** the six `#/roll/wondrous ~ pinned`
    cells and their block comment are deleted -
    `node tests/parity.js "pinned"` now reports `расхождений нет`.
  - **Resolved, fix-then-continue pass:** `#/i/ci1 ~ whole @ ru 768` has a
    `VISUAL_DEBT` entry, at the full run's 7.31% (the diff image was opened
    first and shows no visible content difference - not the picker row).
    Same instability class as the already-recorded 1100 siblings; CI to
    confirm.
  - **Resolved, fix-then-continue pass:** `#/i/ci1 ~ toast @ en 768` has a
    `VISUAL_DEBT` entry at 0.86%, recorded plainly as a toast-fade race and
    assigned to B5.2, not chased further. `@ en 375` was already recorded and
    is unchanged in value; only its `why` was rewritten into a full sentence
    (reviewer blocker B1).
  - Three anchor cells (`voa ~ section anchor @ ru|en 375`,
    `core_item ~ row anchor @ ru 375`) measuring better than recorded debt -
    pre-existing since B4, unrelated to B5.1, still the orchestrator's.

- **RESOLVED, measured: CI is green. B5.2 part 0 did what it was for.** The
  owner pushed through `4210ee3`; run **`34492619641`** completed `success`
  on **every job** - `check`, `audit`, `secrets`, all four `parity` shards and
  `deploy`, read by the orchestrator on 2026-09-10. That is the first green
  run on `main` since `34448283081`, and `deploy` ran for the first time since
  the five cells went red. Part 0 is closed. What follows is the record of
  what was wrong and why it was fixed the way it was; it is history, not work.
  **Still open, and the only thing outstanding on this task: `ff741ad` (part 1,
  the selection bar) and `6084846` are not pushed, so CI has not read the
  selection bar.** Same shape, same closing condition - a run id recorded
  here.

- **The history: CI was red on five cells, two runs (`34482875625` on
  `a404a52`, `34485537392` on `b6a2fcd`).** All five were B5.1 entries written off Windows
  readings with "CI to confirm" in their `why`
  (`#/i/ci1 ~ whole @ ru 1100 / ru 768 / en 1100`, `#/i/ci1 ~ toast @ en 768 /
  en 375`); CI read every one at 0.00%, so the ratchet failed them as
  improved. `deploy` was skipped on every push while they stood. **This
  session (B5.2 part 0) deleted all five**, per owner decision 1 - no figure
  exists to lower to but zero, and the Windows one is forbidden as a
  baseline. `context.md`, "CI is red again", carries the run ids and the
  passing siblings; `plan.md`, "B5.2 built, part 0", the reasoning and the
  reduction commands. Closed by run `34492619641` above.

- **The timed-state class - decided: per-width re-arrival, not a slack.**
  The owner assigned this to B5.2's planning on 2026-09-10 with two candidates
  on the table; the planner chose **re-arrive per width** (`timed: true` on a
  state; `#/i/ci1 ~ toast` and `#/roll/wondrous ~ pinned` carry it; any later
  state whose `enter` raises a toast carries it too). The mechanism is the
  width sweep itself - three shots and an `EN` press against one 1600ms clock,
  with the legacy side possibly from a cache written on another clock - and
  the fix is to stop sweeping a clock rather than to tolerate the result. The
  slack class is rejected on the record: it would have to be as wide as the
  toast (0.9-2.8% of the fold), which is the size of defect the toast state
  exists to catch, and the owner has already rejected widening the gate.
  **Built in part 0, this session** - `#/i/ci1 ~ toast` and
  `#/roll/wondrous ~ pinned` both carry `timed: true` and both read
  `совпадает` at every cell, both languages, both filtered runs this session
  made. The reasoning is `plan.md`, "B5.2 built, part 0" / "planned, part 0",
  "Decided in planning".

- **The whole-page class - decided: a stable-capture re-shoot plus a
  `geometry` probe.** `#/i/ci1 ~ whole` swung 0.00-7.31% locally on an
  unchanged build with byte-identical geometry (B5.1's own probe), worst
  under the full suite's load, and reads an exact 0.00% on CI. Two mechanisms,
  one symptom, confirmed; the fix for this one is the harness's own invariant
  applied to the capture - `shot(whole)` captures until two consecutive
  full-page captures agree (cap four, one console line on retry) - and a
  `perWidth` `geometry` spec on the one `whole` state that records the
  document height and the `.card`/`.cardpick`/`.foot` rects on both apps, so
  a local non-zero cell is diagnosed by reading a line rather than by writing
  a scratch probe. **What a person does on a local red after this** is written
  into `docs/parity.md` by part 0 ("Two unstable classes"): `geometry`
  agreeing → this host's paint, re-run the one state, write nothing, CI
  decides; disagreeing → a layout difference, named by field. The trade was
  taken deliberately: those cells were already red locally under their
  Windows figures (1.43 against 5.53 fails as `стало лучше`), so deletion
  changes the message, not the colour, on a noisy host. **Built in part 0,
  this session** - `node tests/parity.js "ci1 ~ whole"` needed one retry
  (`3 попытки до устойчивого кадра`, logged once) and then read every one of
  the six cells `совпадает`, `geometry` silent throughout; the noise is gone
  on this host, as expected.
- **`tools/parity-ubuntu`'s documented build command does not work as
  committed.** `docker build -t dh-parity:ubuntu24 tools/parity-ubuntu` fails
  on `COPY package.json package-lock.json ./`: that build context
  (`tools/parity-ubuntu`) holds neither file, they are at the repository
  root. Copying both in (untracked, not committed) lets the image build
  cleanly. Not a regression from this batch - the Dockerfile is B3.6's and
  this is the first session since to actually run the documented command
  fresh rather than reusing an already-built image. Whoever next needs the
  container should either add a `COPY ../../package.json` two directories up
  (context would need to move to the repo root, which changes the README's
  own command) or have the Dockerfile copy from a path relative to a
  repo-root build context - a real fix, not attempted here since it is
  outside this batch's file list. Separately, once the image did build, `docker
  run --rm -v "$PWD:/work:ro" ... sh -c '...'` did not finish copying `/work`
  into `/app` inside a 60s wait on this host and was killed rather than
  pursued further - possibly Windows/Docker-Desktop volume-mount performance
  on a repository this size (`img/`, `og/`, 1061 share pages), not diagnosed
  further. The three modal states' `VISUAL_DEBT` figures (below, and in
  `plan.md`, "B5.1 built") are Windows-measured, not container- or
  CI-confirmed, as a result.
- **Resolved, B5.2 part 0.** `#/roll/wondrous ~ pinned` used to alternate
  between its recorded figures and 0.00% on this host - the timed-state class
  named above. With `timed: true` on it, this session's two consecutive
  `node tests/parity.js "pinned"` runs both read all six cells `совпадает`,
  both languages, every width. No entry was ever written for it in
  `VISUAL_DEBT` (its debt lived only as the six deleted `~ toast`-shaped
  entries' sibling instability, never its own), so there is nothing left to
  delete here - just the confirmation that the mechanism works on the state
  it was named for.

- **Resolved: CI is green, and B3.6 part 1's "CI green is unverified" is
  closed.** The owner pushed through `bc91e63`; run `34404013490` on `958f182`
  (B3.6 part 2) completed **`success` on every job** - `check`, `audit`,
  `secrets`, all four `parity` shards and `deploy` - read by the orchestrator
  on 2026-09-09. That is the first green run on `main` since 2026-09-03, and it
  is the criterion part 1 said could only be reached by a push. Part 0's shard
  also did what it claimed: each parity shard finished in 4-5 minutes against
  the old 867s single job. Nothing in part 1's red-run prediction had to be
  used: no `~ help` cell, no `#/i/ci1 ~ whole` cell and none of the four 375
  anchor cells needed touching, because the run passed as recorded.
  Consequences for B4:
  - The debt table as it stands is CI-true. Do not re-baseline anything
    outside B4's own states.
  - `#/tables/voa ~ section anchor @ en 375`, left at 8.84 pending a CI
    measurement, now has one - run `34404013490` passed it at that figure.
    It is reconciled by that run, not by a local reading. Removed from
    "Deferred" on this basis.

- **A local Windows run fails cells that CI passes, by design.** Four
  `#/i/ci1 ~ whole` cells sit at the CI figure, more than `DEBT_SLACK` above
  what this machine reads, so a full local run reports them as improved and
  fails them; the two `#/roll/wondrous ~ modal` cells that pass exactly on CI
  fail here for the mirror reason. This is owner decision 1 working as
  intended and is written into `docs/parity.md`, "Machine variance". **Do not
  edit those numbers off a local run.** `tools/parity-ubuntu/` reproduces CI to
  the hundredth on layout states and not on timed ones. (Written before B5.1;
  the `~ whole` figures it refers to were since overwritten with Windows
  readings and are deleted by B5.2 part 0, which also gives both unstable
  classes a mechanism - see the three items at the top of this list. The
  principle stands.)
  - **The B4 session's `node tests/parity.js "tables"` hit the same shape on
    seven cells**, all `#/tables/voa ~ section anchor` and
    `#/tables/core_item ~ row anchor`, all measuring *better* than their
    recorded debt (three of the seven at an exact 0.00% against a
    0.42-0.43% debt - the same "`en 768`/`en 1100` measures 0.00% four times
    in a row" pattern the B3.5 remediation session already flagged and
    deliberately left alone, now reproduced). Confirmed unrelated to B4 by
    reading the diff: `eqKind` is falsy for both tables, so none of B4's new
    branches execute on their render path. Not re-baselined - see
    `handoff.md`, "Verification", for the full cell list. Worth a real look
    before the next full-suite run: either these three genuinely reproduce
    0.00% on Windows now (worth lowering, on CI's word, not this machine's),
    or the harness's anchor-scroll timing has drifted further since B3.6
    part 1 wired `ready()` to `document.fonts.ready`.

- **The rewrite's anchor flash has never been drawn** - found by B3.6 part 1,
  deliberately not fixed by it. `TablesPage.svelte` adds `flash` with
  `target.classList.add(...)` and the rows are a keyed `{#each}`, so the next
  render replaces the element and the class goes with it. Separately, the live
  app re-plays the flash on a language switch and the rewrite's effect is
  guarded on `app.navigations`, so it does not. Together they are the whole of
  the four 1100/768 anchor debt cells. The fix is reactive state rather than a
  class added behind Svelte's back, and it will move the `@ ru` cells that
  currently pass by accident - both apps show no ring there - so it needs the
  whole anchor set re-measured in one go. A batch, not a footnote, and not
  B4's.

- **The parity harness's width sweep is not a state.** It looks at one
  document at 1100, 768 and 375 without re-arriving, and a browser moves a
  scrolled document on reflow to hold the reading position - by picking an
  element out of the DOM, which the two apps do not share. That is what the
  four 375 anchor cells are, measured rather than assumed (`plan.md`, "B3.6
  built, part 1"). Fixing it means re-arriving per width, which changes how
  every state in the suite is measured; `overflow-anchor: none` on both sides
  was tried and shuffles the figures without removing them. Worth its own
  decision; it is also why B4 adds no equipment anchor state (see Deferred).

- **Language leaks between states through `localStorage`.** `file://` is one
  origin, so a state that ran at `en` can leave the next state's `@ ru`
  screenshots in English. Both apps read the same storage so no verdict is
  wrong, but a person reading a `_ru_` screenshot will find English in it.
  Noted, not fixed.

- Owner-side, unchanged: Pages source is still not switched to `dist/`.

## Deferred

- **B5.3's review: fix-then-continue, one blocker, five nits** (reviewer,
  opus, against `ba8f4b1`, 2026-09-10). The blocker (the card link's payload
  flavour) is fixed - see "Blockers". The five nits, recorded rather than
  fixed per the no-remediation-cycle-for-nits rule:
  1. `app/src/test/a11y.ts`'s `OFF` map disables axe's `nested-interactive`
     rule **suite-wide** to accommodate the storage notice's one ported shape
     (a `<button>` inside its own `<summary>`, live app's own markup,
     unavoidable given `<details>` hides every child but the first `summary`
     while closed). A per-call rule override on `expectNoA11yViolations` for
     just that one component's assertions would keep the rule live
     everywhere else instead of turning it off globally.
  2. `docs/specs/FEATURES.md:79`'s Lists storage-notice bullet reads narrower
     than the code: the rewrite's notice survives a create and a delete where
     the live `render()` re-folds it on every re-render, and `plan.md`'s
     "Close-out decision" already argues that deviation deliberately (kinder
     to a person, invisible to every state that starts folded) - the spec
     should carry that clause alongside the language-switch one it already
     has.
  3. `.badge`/`.badge.num` is now inline in a **third** component
     (`ListsPage.svelte`, after `RecordCard.svelte` and `TableRows.svelte`),
     against the campsite rule's "extract on the second use." Already
     recorded above ("`.badge` is now copied three times") as `Badge.svelte`'s
     future extraction point; this is the same finding, from the review.
  4. `ListsPage.svelte:37`'s `works` reads `app.env.storage.works()` once, via
     `untrack`, at creation - the live `storageWarning()` re-probes on every
     render, so a storage quota failure that occurs mid-session swaps the
     live app's notice live and does not swap the port's. Cosmetic: nobody
     has reported hitting a quota failure while the page is open, and the
     initial read is correct.
  5. `ListStore.create(name, init)` lets `init` override `ids` and `meta`,
     wider than its one caller (`ListsPage.svelte`'s `restore()`) needs -
     `restore` is the only place that ever passes `init` at all.

- **The parity-coverage gap the card-link blocker exposed.** No parity spec
  reads any `href` attribute today, so the GM-payload/players-payload bug was
  invisible to all 36 `#/lists` cells and to CI - a pixel comparison cannot
  see an attribute two apps render identically in most cases and differently
  only when a list carries an `hnote`, which no seeded `#/lists` list does.
  Not fixed here - adding a parity state or a new seed is a harness change
  beyond this blockers-only pass. **What would have caught it:** a parity
  spec that reads `a.listcard-main`'s `href`, seeded with a list carrying an
  `hnote`, comparing the two apps' attribute values directly rather than
  their rendered pixels.

- **For the repository owner, found while planning B5.3 (2026-09-10):** the
  live "Восстановить из ссылки" field refuses the app's own short links.
  `importList` (app.js 4257-4270) matches `/#\/l\/([A-Za-z0-9_-]+)/` - no
  `~` - and `decodeList` `atob`s whatever it gets, so a packed link, which is
  exactly what "Поделиться" copies, fails as "Ссылка повреждена". Opening the
  same link in the address bar works (`expandHash` unpacks it). B5.3 fixes it
  in the rewrite rather than reproducing it (`plan.md`, "B5.3 planned",
  "Decided") - the precedent is the grid-numbering bug in `ACCEPTED`. Worth
  a one-line fix in app.js (`unpackPayload` before `decodeList`, `~` in the
  class) if the live app gets another release before cut-over.
- **The rewrite has no `::placeholder` rule and never had one** - measured
  on `#/tables`: live `rgb(138,131,163)` at opacity 0.7 (style.css:727),
  rewrite Chrome's default `rgb(117,117,117)` at 1. Under `JITTER` on every
  state because a placeholder is a twentieth of a percent of a page; the
  class B3.6 documented. B5.3 ports the rule globally in `tokens.css`; if
  the placeholder colour is ever worth a `typeRuns`-style probe, `color` and
  `opacity` of `::placeholder` on the toolbar search box is the field.
- **`.badge` is now copied three times** (the card, the rows, and B5.3's
  list cards). A `Badge.svelte` is the rule's answer; deferred because the
  extraction touches the card and the rows, which sit under thirty-odd parity
  states, for a two-rule gain. Take it in a batch that already re-measures
  them.
- **`StorageNotice.svelte`** is B5.4's to extract on the notice's second
  use (the list page draws the same `storageWarning()`); B5.3 writes it
  inline in `ListsPage.svelte` and puts only the `warnHidden` flag on
  `AppState`. **Planned into B5.4a** (with three more second-use
  extractions the list page forces: `RowMain`, `HelpButton`, `HelpBox`).
- **B5.4b - drag as the live app does it** (marks, drag image, edge
  autoscroll, a synthetic-drag driver verb and a `reorderedByDrag` spec):
  outlined in `plan.md`, "B5.4b outlined"; 4a binds the existing index-based
  `nativeDrag` port so nothing on screen is inert meanwhile.

- **B5.2 part 1's review: approved, no blockers** (reviewer, opus, against
  `ff741ad`, 2026-09-10). The sweep the batch was reviewed for came back
  clean: **all eight `presses: true` specs and both `looks` specs in
  `tests/parity/specs.js` take their control names through `NAME[lang]`** -
  only `#/i/ci1 ~ selection copied`'s own spec had the literal, and the
  implementer had already fixed it. The Russian literals that remain are
  either seeded list names (`Клад дракона`, user data, identical in both
  languages) or inside a state's `enter`, which `arrive()` runs *before* the
  language press and so is correct by construction.
  - Worth keeping, because it lowers the residual risk of this whole class:
    **the failure is loud, not silent.** `driver.js` throws
    `` `${target}: no control named "${name}"` `` and `target` differs between
    the two sides, so the error strings differ and the run reports a
    разница - which is how it was caught. The silent variant would be a spec
    calling `d.has()` with a Russian literal; no spec does that today. If one
    is ever written, that is the shape to catch in review.
  - Four nits, recorded rather than fixed - the review rules keep a
    remediation cycle for blockers, and none of these is one. The first two
    are the ones worth taking as campsite work in the next batch that touches
    those files:
    1. `SelBar.svelte:98-99` gives `.selbar` `padding-left/right:
       env(safe-area-inset-*)`. In `style.css` the `.selbar{padding:10px 0}`
       shorthand (807) comes *after* `.wrap` (52-53) at equal specificity, so
       the live element's computed left/right padding is `0`. Every other
       `--wrap` composition in the rewrite carries only `width` and
       `margin-inline`. Invisible to the harness (`env()` is 0 without a
       display cutout) and divergent only on a notched device. The batch
       followed the plan, which asked for "`.wrap`'s four properties"; the
       plan was one property pair too generous.
    2. `RecordCard.svelte:636` still calls the `AddToList` base rule "the
       future selection bar's". The batch fixed the twin comment in
       `AddToList.svelte` and left this one stale.
    3. `SelBar.svelte` measures 75% branches against a threshold of exactly 75
       (`vite.config.mts:150-155`) - no margin for the next edit to that file.
    4. `tables.test.ts` re-assigns `Element.prototype.scrollIntoView = vi.fn()`
       inside five separate `it` bodies; `record.test.ts` does it once at
       module scope, which is the shape to copy.

- **B5.1's review findings the fix-pass deliberately did not take** (reviewer,
  opus, against `fe0043b`; verdict fix-then-continue, its two blockers fixed
  in `d1c1367`). Each is real, none is urgent, and the first two are the ones
  most likely to bite:
  - **`app.menuFor` is left stale when a modal closes with the menu open.**
    *Built in B5.2 part 1* (this session): `RecordModal.svelte` folds
    `app.menuFor` before every close path calls its parent's `onclose`, via a
    single `handleClose()` wrapper on the dialog's native `close` event, with
    two tests (button and backdrop) in `record.test.ts` - see `plan.md`, "B5.2
    built, part 1". The rest of the finding, for the record:
    `AddToList.svelte`'s outside-click handler catches the null-prop race and
    returns early, so the live app's own rule - clear `S.menuFor` *before*
    `closeModal()` - never runs. Reopening that record's modal shows the menu
    already open with `aria-expanded="true"`. Live has the same hole on the
    Escape path, so it is a small divergence rather than a new class of bug,
    and nothing covers it. The reviewer's suggested shape:
    `if (!root?.isConnected) return;` before reading `key`, so a torn-down
    instance bows out while a live one still closes.
  - **The toast's hide dropped a guard the live app paid for.** `style.css:608`
    records defect #10 by name: `.toast.act`'s `display:inline-flex` beat
    `display:none` at equal specificity and left an empty gold plate on screen,
    fixed there with `[hidden]{display:none !important}`. The rewrite hides
    through the UA rule `[popover]:not(:popover-open){display:none}`, which an
    author style outranks - so `.toast.act { display: inline-flex }` would
    defeat it. It is safe today only because Svelte runs render effects before
    user `$effect`s, so the class is gone before `hidePopover()`. One refactor
    from reintroducing a defect this project already paid for, and untested.
  - **"The toast is announced above the dialog's inertness" is asserted, never
    verified.** It is the stated reason for `popover="manual"` over a plain
    fixed element. Parity proves it *paints* above the backdrop; nothing proves
    a screen reader hears an `aria-live` region in the top layer while a modal
    dialog is open. If it is false, the `sr-only` region B5.1 deleted from
    `RecordModal.svelte` was load-bearing. B5.1 deleted the belt and kept only
    the braces.
  - `AppState.stop()` clears the router and the list watch but not
    `#toastTimer`, so a pending `hideToast()` outlives a stopped app.
  - `ListStore.load()` ignores `storage.set`'s return during the v1 migration
    where `app.js:1149-1160` returns `[]` on a throw - arguably better, but an
    undocumented divergence in a data path with no test either way.
  - `AddToList.toggle()` folds `newListFor` where `app.js:4234` does not;
    reachable only by close-then-reopen.
  - `pick()` and `createNew()` each define an identical `knows` closure
    (`AddToList.svelte:77`, `:104`).
  - The multi-id branches (`t.addTo` as the label, `': ' + fresh.length` on the
    toast) got their first caller in B5.2 part 1 (the bar's `AddToList`, with
    two or more ticked ids) and are now exercised by `tables.test.ts`'s "the
    selection bar" tests and `barMembership`/`copiedSelection` in
    `tests/parity/specs.js`.
  - `shell.test.ts`'s "calls showPopover/hidePopover when the browser has them"
    stops one step short of its own title: it never asserts `el.style.display`
    was left alone, which is the half that proves the jsdom fallback did not
    fire.
- **Three anchor cells still measuring better than their recorded debt** -
  `#/tables/voa ~ section anchor @ ru|en 375`, `#/tables/core_item ~ row anchor
  @ ru 375`. Pre-existing since B4, unrelated to B5.1, and still nobody's
  batch. They are the frozen-scrollY-across-the-width-sweep limitation.


- **B4's review: approve, no blockers** (reviewer, this session, against
  `fde9cdc`). It verified rather than read: the `allEquip` order against
  `data.json` (`[...eq, ...all]` gives Палаш first, matching `app.js:936`),
  the pool counts 317/108/90, all four `matches` call sites in `app.js`, the
  facet group order and `src` presence filter against real data, and the tier
  sections against `renderEquipTable`. It confirmed the "dead code on
  `voa`/`core_item`" reasoning holds structurally: `noUncheckedIndexedAccess`
  makes `eqKind` genuinely `EquipKind | undefined`, so every added branch is
  `eqKind ? ... : <previous expression>`. It judged the 00:11 check sufficient
  evidence for this commit and explicitly did not want a local re-run - the
  03:03/03:49 runs are non-evidence, not counter-evidence.

- **Three risks the review raised, none blocking, all worth knowing before
  someone leans on the wrong guard:**
  - `#/tables/eq_secondary ~ searched` guards the `noType` fix **in Russian
    only**. `enter` runs before the language click by design, so the query
    stays `вторичное`; in English no record's text contains that substring, so
    the three `@ en` cells render the empty state in both apps. They compare
    honestly at 0.00%, but the type-word path is guarded by the RU pixels plus
    `tables.test.ts`'s `основное` case, not by six cells.
  - `upgradeLine`'s order changed as a side effect of the `allEquip` fix. The
    change is an improvement - it now matches `app.js`'s `BY_LINE`, built from
    the same expression - but `data.test.ts` pins `equipOfKind`, not the
    ladder. A future flip would be caught on weapons and pass silently on the
    tier ladder in `RecordCard`.
  - `facets.test.ts`'s "never offers motherboard" case is **vacuous**: its
    fixture index holds no `motherboard` record, so the assertion cannot fail
    whatever the presence filter does. The real-data fact is true and was
    checked against real data; this test does not establish it.

- **B4 review nits, recorded not fixed** (no remediation cycle was spent, per
  the orchestration rule that nits do not earn one):
  - `app/src/lib/facets.ts:79` - `eqFacetRows` is exported with no consumer
    outside its own module; `facetRows` is its only caller. `CLAUDE.md`'s "add
    no export before something uses it" says module-private. The only nit with
    a standing-rule basis.
  - `facets.ts:137` - `if (!row) throw` is unreachable: `EQ_GROUPS` is
    exhaustive and typed and `build` covers every key. Defensive dead code in
    a pure module.
  - `data.test.ts` builds its expected order with the same `[...eq, ...all]`
    shape as the implementation. It does pin the order, but a concrete
    first-id assertion (`Палаш`) would be independent of the implementation
    rather than a restatement of it.
  - The axe sweep covers the weapons panel with a tier pressed, but not the
    equipment empty state (which grows its own reset button) nor the
    `eq_armor` three-row panel.

- **The one check B4 still owes, and nobody here can run it: CI on
  `fde9cdc`.** Owner decision 1 makes ubuntu authoritative, and the eight new
  states' 0.00% and the "no new `VISUAL_DEBT`" claim are Windows-local
  measurements. When the owner next pushes, read the four parity shards on
  that commit and reconcile the eight `eq_` states against that run. If a cell
  comes back non-zero, the entry is recorded from CI's figure, not from this
  host.

- **The 600px overrides for `.selx`, `.selacts`, `.seldrop`, `.dropmenu`, the
  `.lrow*` family, `.npair` and `.batch-acts` belong to components that do
  not exist yet** - the selection bar, the add-to-list menu, list rows, notes
  and batch actions. They must be ported together with their base rules when
  those components are built, not piecemeal: porting an override without its
  base rule is the mistake `CLAUDE.md`'s `@media` line forbids, mirrored.
  Re-confirmed as not B4's during B4 planning.
- **Closed into B4:** `.selbox:has(:focus-visible)` (`style.css:1013`) - three
  lines in a rule family the equipment rows draw, and the live app has it, so
  porting it can only reduce a difference. It cannot be pixel-verified: no
  state reaches a row checkbox by keyboard and the driver has no key press.
  That instrument gap is recorded here rather than invented around.
- **An equipment anchor parity state** (`#/tables/eq_weapon/t2`, or the
  `#/tables/eq_weapon/q1` row anchor `#/i/q1`'s "show in table" link produces).
  Not added in B4: it can only add 375 cells whose difference is the harness's
  own width sweep - a known, unfixed, not-B4 cause that would need
  `VISUAL_DEBT` entries taken from CI. The equipment-specific fact (section
  ids `sec-t1`-`sec-t4`, a `q*` row target) is pinned by component tests, and
  the anchor mechanism already has two states. Revisit once the width-sweep
  decision lands.
- **Extending B3.6's probes past the tables states** - `#/i/*`, `#/roll/*`,
  and the equipment tables now that B4 builds them. Deliberately not attempted
  in B3.6 and deliberately not B4's: a spec that starts reporting on every
  surface at once is a batch whose size nobody can predict.
- `app/src/components/TablesPage.svelte`'s anchor effect and `TableRows.svelte`
  need the flash to be reactive state - see Blockers.
- The harness's width sweep needs a decision - see Blockers.
- `tests/parity/driver.js`'s `prepare()` clears storage per page, but
  `file://` shares one origin, so the language leaks between states. Harmless
  to verdicts, confusing to a person reading screenshots.
- **Nits from the B3.5 reviewer still open** (the rest of that list was closed
  by B3.6: the `VISUAL_DEBT` doc comment by part 1, `COVERAGE.md`'s ratchet
  claim by part 2, and the four 375 anchor entries, `voa @ en 375` included,
  re-baselined to CI with a `why` that says so):
  - `plan.md`'s "What every remaining `VISUAL_DEBT` entry is" (around line 64
    and 104) still calls the 375px row/section anchor debt "cause 6" and still
    promises a rewrite of that section; the correction landed as "B3.5 built"
    instead. Two places describe the same debt with different framing.
  - `docs/parity.md`'s "whole-page percentage" rule is a seven-line paragraph
    among one-line bullets - worth trimming or moving to its own subsection.
- **Playwright.** Still worth a decision before building anything; the parity
  harness already drives both apps in a real browser.
- **`Panel.svelte`.** Still unscheduled - `.ffilter` and `.tablenav`.
  `TableRows`/`SectionHead` are not `.panel` copies.
- **`noData` and `storageOff`.** Planned in **B5.3** (the lists index):
  `storageOff` and `Shell`'s paragraph go and the live `storageWarning()`
  lands on the page; `noData` stays as the rewrite's documented state and the
  lists page draws it too - see `plan.md`, "B5.3 planned", "Decided".
- **The 600px overrides above are now assigned**: `.seldrop`/`.dropmenu`
  **built in B5.1** (with the menu), `.selx`/`.selacts` to B5.2 (with the
  bar), `.lrow*` and `.npair` to B5.4, `.batch-acts` to B5.5 - each with its
  base rule.
- **Resolved in B5.1: a toast over a native `<dialog>`.** `popover="manual"`
  puts the toast in the top layer, visible and announced while the record
  modal is open; it measured pixel-identical to the live app on every state
  this batch built, so the plain-fixed-element fallback was not needed.
- **The legacy grid-numbering bug** (`list.map(tileHTML)` passing the array
  index as the tile's number) - worth reporting to the repository owner, still
  deliberately not reproduced; recorded in `ACCEPTED`.
- **The shared `S.kind`.** Batch C's.

## Notes

- Mocks path: none for B5.3 either - the index is transcribed from the live
  DOM and measured (`context.md`, "B5.3 planning facts"); the probe scripts
  lived in the session scratchpad and were not kept. B3.5, B3.6 and B4 introduce no new UI; every value B4
  draws is already in `style.css` and `app.js`, and the tier body reuses B3's
  markup. B5.1 likewise: the menu, the card row and the toast are ported from
  `app.js`/`style.css` line by line (references in `plan.md`, "B5.1 planned"),
  and the live app at `#/i/ci1` with two lists seeded is the mock.

- Screenshot findings: two screenshots of `#/tables/community` at ~1100px, from
  the human, 2026-09-09. (1) the search box "is using a different font" -
  confirmed, 14px against 15.5px, **fixed in B3.5**. (2) the `любое` hint "is
  too close to the main text" - confirmed, the separating space was missing
  from the DOM, the `<i>` started 4.3px left of where the live app puts it,
  **fixed in B3.5**. A third defect the orchestrator found while confirming
  these two (`.selbox`'s missing mobile override) is **also fixed in B3.5**.
  The full original measurements are in `issues/47/context.md`; the real,
  post-fix numbers are in `plan.md`, "B3.5 built" - do not re-take either.

- **What not to start yet**, carried forward and all still true:
  - Do not touch Phase 7. `index.html`, `app.js` and `style.css` are the parity
    harness's expectation.
  - Do not point Pages at `dist/`. Needs the owner to switch Settings -> Pages
    -> Source first.
  - Do not start Playwright. Ask first.
  - Do not implement the equipment facets outside B4.
  - Do not translate the legacy Russian comments in `app.js`/`style.css`.
  - The old instruction "do not chase the help-panel, search-placeholder or
    description-reflow debts without opening the diff image first" is now
    **fully resolved rather than superseded**: the search-placeholder and
    description-reflow debts were B3.5's defects, and B3.5 fixed and deleted
    them. The help-panel debt stands as written, unchanged, and is still worth
    the same caution.
  - Do not assume a red local `node tests/run-all.js parity` means whatever
    batch is running broke something: since B3.6 part 1 the table follows CI,
    so a Windows run fails a handful of cells by design; see "Blockers".

- **Session gotchas.** New this session (B5.1's own, appended first), then
  B3.5's, then B3's, then carried further back:

  - **jsdom implements `[popover]:not(:popover-open){display:none}` from its
    own default stylesheet but neither `showPopover`/`hidePopover` nor
    `:popover-open` matching.** An element with `popover="manual"` that is
    never shown via the (nonexistent) API is permanently `display:none` in
    every component test - findable by `getByText`, invisible to `getByRole`.
    The fix, matching the "browser fallback" a `typeof el.showPopover ===
    'function'` guard already anticipates: when the function does not exist,
    toggle `el.style.display` directly, which wins over the UA stylesheet
    rule the way any inline style does.
  - **A raw `<svelte:document>` (or `<svelte:window>`) handler can outlive
    the reactive prop it reads by a few microseconds.** A native click event
    still bubbling through the document sees a parent's state change
    immediately (reads are live), but the child component's own effects -
    including the one that would otherwise have torn down its listener -
    have not necessarily run yet. Reading a prop derived from something the
    parent just set to `null` (`key={it.id}` where `it` just became `null`)
    throws inside that raw handler even though nothing about the component
    tree looks wrong a moment later. A `try`/`catch` around the one read is
    the practical fix; there is nothing left to do once it throws, since the
    element is on its way out anyway.
  - **`$state` wraps a stored object in a reactive proxy - `toBe` (reference
    equality) on something read back out of it fails even when nothing is
    wrong.** `store.list = [x, ...]; store.list[0] === x` is `false` in
    Svelte 5; use `toEqual` for content, not `toBe` for identity, on
    anything that passed through a `$state` array or object.
  - **`tools/parity-ubuntu`'s documented `docker build` command does not
    work as committed** - its build context (`tools/parity-ubuntu`) holds
    neither `package.json` nor `package-lock.json`, which the Dockerfile
    `COPY`s from `./`. Not diagnosed further than confirming the gap; see
    "Blockers".
  - **`docker run --rm` without a redirect loses everything.** A full-suite
    container run ended, the container was removed, and `docker logs` had
    nothing left to read - the same loss as a dead shell, by another route.
    Always redirect a container run's stdout to a file on the host.
  - **The ubuntu container reproduces CI only for layout.** It matched CI to
    the hundredth on the four anchor cells and reported 0.00% on a state whose
    difference is a toast that fades before the slower machine photographs it.
    Silent, and it looks exactly like a defect that got fixed.
    `tools/parity-ubuntu/` and `docs/parity.md` carry the recognition test.
  - **Python's `write_text` converts LF to CRLF on Windows.** A read-modify-
    write round trip leaves every line changed, `git diff` shows nothing
    (git normalises) and `git status` still says modified. Write bytes, or
    pass `newline='
'`.
  - **Use a quoted heredoc (`<<'EOF'`) for anything containing backticks.**
    An unquoted one ran `npm ci` from inside a comment being written into a
    Dockerfile, deleting `node_modules` while another session was four minutes
    into `npm run check`.
  - **A stopped agent is not a dead agent, and its background run is not
    stopped either.** A task notification fires when an agent ends a *turn*.
    `ListAgents` gives the real status (`running` / `killed` / `completed`).
    This session read a notification as a death, killed the run the agent was
    waiting on, dispatched a replacement, and had two writers on one tree
    before noticing. Later, a *stopped* agent's own background parity run was
    still going twelve minutes into an unrelated run, sharing
    `test-output/parity/` and writing cache keys. Check `ListAgents` and
    `tasklist` for `node tests/parity.js` before trusting any measurement.
    Now a rule in `.claude/prompts/orchestrate.prompt.md`.
  - **Two parity runs share one output directory.** `test-output/parity/` is
    wiped and rewritten per run, so overlapping runs clobber each other's
    screenshots and each other's cache-key counts. Verdicts survived it once
    here, but do not assume that twice.
  - **Withdrawn, and it was false from the day it was written: `npm run check`
    does not check markdown at all.** This entry used to say that
    `prettier --check .` covers markdown and that editing a doc mid-run risks
    a torn read. `.prettierignore` has carried `*.md` since `5ab5880`
    (2026-08-30, Phase 1), with its reason beside it - markdown here is
    wrapped by hand because a line break carries meaning in the specs, and the
    licence line is pinned by `tests/derived.js`. `prettier --file-info`
    returns `"ignored": true` for this file, for `docs/specs/COVERAGE.md` and
    for `CLAUDE.md` alike. An `issues/**` edit can neither fail a check nor be
    corrupted by one. The false version cost real caution for months,
    including two deferred edits by the orchestrator on 2026-09-10 - it is
    left here as a withdrawal rather than deleted silently, because a gotcha
    that was believed is worth one line saying it should not be.
  - **`npx prettier --check <file>.md` prints "All matched files use Prettier
    code style!" while matching zero files.** A success message from an empty
    set is indistinguishable from a verified one. Do not cite it as evidence
    that a doc edit is well-formed; there is nothing to be well-formed
    against.
  - **The real reason not to edit a doc mid-run is a second writer**, not a
    formatter: an agent holding `handoff.md` and an orchestrator writing to it
    is a genuine conflict. Check `ListAgents` before writing a file a worker
    was dispatched to update.
  - **The five-hour usage window is not machine-readable outside a terminal
    session.** It reaches only the `statusLine` command, which the desktop app
    never invokes - measured: a probe recorded zero invocations while hooks
    fired nine times. It is in no transcript, nowhere under `~/.claude`, and
    in no CLI. The guard built for it was removed (`79e26c9`). Do not infer
    budget, and do not read silence as permission to continue.

  - **A literal leading space at the start of a Svelte `{#if}` or `{#each}`
    block is dropped by the compiler.** Ported markup of the shape `' <tag>'`
    inside a block has this bug; emit the space as `{' '}`, which is a text
    node the compiler cannot trim. Not `&nbsp;` (different advance, different
    break opportunity) and not a space inside the tag (an italic space is not
    the same advance). Worth grepping for whenever a batch ports inline markup
    out of an `app.js` string template. This stays here rather than in
    `CLAUDE.md` on purpose - CLAUDE.md's bar is a *repeated* mistake and this
    is the first instance. If B4 or a later batch hits a second one, promote it
    to CLAUDE.md's "Migration and parity" then.
  - **`VISUAL_DEBT` is only half-ratcheted below 0.5%.** `DEBT_SLACK = 0.5`, and
    the "it got better, lower the number" check is
    `pct < debt.pct - DEBT_SLACK`, so an entry recorded at 0.13 that now
    measures 0.00 passes in silence. `docs/specs/COVERAGE.md`'s claim that debt
    "can only ratchet towards zero" is therefore not true today for the small
    entries, and `context.md`'s "getting better than a recorded number fails
    too" holds only above the slack. **Confirmed the hard way in B3.5**: 29 of
    the 49 entries it deleted were exactly this shape - a silent pass the run
    never flagged, found only by reading every printed percentage by hand.
    **Fixed by B3.6 part 2's ratchet**: a cell at or under `JITTER` that still
    carries an entry now fails, asking for the entry to be deleted. Open the
    diff before deleting - the container reported a fading toast as 0.00%.
  - **A whole-page percentage cannot see a control-sized defect.** A wrong font
    size on one line of a 1100x900 screen scores about 0.09%, which is under
    `JITTER`. This is the root cause of the whole audit and it is in
    `docs/parity.md`, "Contract".
  - A locally declared `{#snippet}` rendered with `{@render}` in the same file
    trips `@typescript-eslint/no-confusing-void-expression`, every time.
    Reproduced with a two-line component. The fix is the codebase's convention:
    pass a `Snippet<T>` prop down, or extract a real component.
  - A community record's or a frame-equipment record's own source badge carries
    the same string as its section heading, so `screen.getByText('Пир зверей')`
    finds two matches once a section has real rows. Assert the heading via
    `.tsec-head .lbl`.
  - `Element.prototype.scrollIntoView` does not exist in this jsdom setup - an
    actual `TypeError`, not a no-op. `vi.spyOn` cannot be used; assign
    `Element.prototype.scrollIntoView = vi.fn()` directly.
  - **jsdom does not apply a Svelte component's scoped `<style>`**, so the
    component suite cannot assert a `font-size` or a `width` at all. That is
    why B3.5's only new component test is the label's text, and why the two CSS
    fixes are carried by parity. Do not reach for a source-text assertion on a
    style block instead - it tests the source, not the behaviour.
  - `npx vitest run --coverage` and `node tests/parity.js` fight over the CPU
    exactly the way CLAUDE.md's stray-`chrome.exe` gotcha describes - five
    spurious `Test timed out in 5000ms` failures, none real. Do not run them
    concurrently; check for lingering `chrome.exe` before trusting a timeout.
  - A pressed a11y state needs a fixture that actually produces the shape being
    tested - the `voa` fixture needed a second row of a different kind before
    its filter panel drew two fields.
  - **A parity run wipes `test-output/parity/` on every invocation**, including
    a single-state filtered one. Copy anything worth keeping before running a
    narrower filter.
  - A large or unexplained `VISUAL_DEBT` percentage is worth a standalone
    puppeteer script before a reason gets written down - launch with the
    harness's own `args: ['--no-sandbox', '--disable-dev-shm-usage',
    '--disable-gpu']` (omitting them makes results non-deterministic, GPU path
    against the harness's software one), navigate both `index.html` and
    `dist/index.html` to the same route, and read `window.scrollY` /
    `getBoundingClientRect()` / computed styles via `page.evaluate`. This is
    the technique that found B3's two real bugs and all three of B3.5's.
  - A standalone reproduction script that omits those launch args can look
    flaky when the real bug is not. Chase determinism in the reproduction
    before concluding a bug is non-deterministic.
  - **A parity screenshot loop does not re-scroll between widths.**
    `tests/parity.js`'s `arrive()` scrolls to a route's anchor once, at
    `WIDTHS[0]` (1100) - the 768 and 375 screenshots that follow only resize
    the viewport and `settle()`. A state that scrolls deep into a long,
    reflow-sensitive table (an anchor near the bottom of `voa`, not near the
    top of a short table like `core_item`) can show a large, real, but
    harness-specific mismatch at narrow widths that has nothing to do with
    word-wrap - the frozen scrollY from the wide layout lands on a different
    stretch of a much taller narrow-layout document. Root-caused, not
    guessed, in B3.5 - see `plan.md`, "B3.5 built". Distinct from the
    font-loading race B3 already fixed: that one was about *when* the scroll
    fires within one width, this one is about screenshotting three widths off
    one scroll.
  - **To test whether a fix actually caused a specific parity number to move
    (rather than assuming it from reading the CSS), revert just that fix in a
    scratch edit, `npm run build`, re-run the one filtered state, then restore
    and rebuild.** Two independent uses in B3.5: proved the `.selbox` fix
    caused `voa ~ section anchor @ ru 375`'s regression (reverting it
    reproduced the old number exactly, twice), and proved the restored focus
    glow moved nothing (removing it changed no number on the one state that
    exercises `:focus`). Faster and more certain than reasoning about it.
  - **The same technique with `git stash push -u` / `git stash pop` around a
    full rebuild is how to tell a pre-existing failure from a caused one**,
    across more than one file at once. Used in B3.5 to confirm four full-suite
    failures (`#/roll/wondrous ~ modal`/`~ help`, `#/i/ci1 ~ whole`, `#/i/f1`)
    were identical on the unmodified tree - see "Blockers". Rebuild `dist/`
    both before and after; a stale build makes the "before" comparison lie.
  - **A `npm run check` that reports zero coverage everywhere ran no test at
    all.** Vitest's fork-pool worker start timeout is 60s and hardcoded, and
    `isolate: true` spawns one child per test file, so a host short of memory
    fails every file in turn: `Test Files no tests`, `Errors 33`, `Failed to
    start forks worker`, zeros down the whole coverage table. Nothing ran, so
    nothing regressed - re-run it. Measured and written up in "Verification",
    "The `npm run check` question, settled"; the check itself is 165s on this
    host, so it fits one foreground call and the gate accepts it.
  - **`npm run check`'s Vitest pass can time out on a single test with zero
    `chrome.exe` processes running** - not only the documented
    vitest-vs-parity contention. Seen once in B3.5 (`sections.test.ts`, 5000ms
    timeout, no parity run anywhere nearby); the same file in isolation passed
    in 8.37s immediately after, and a clean re-run of the full `npm run check`
    passed. Treat one `Test timed out` line as reason to re-run before reason
    to investigate, whether or not `chrome.exe` is the obvious suspect.

- Cleanup performed / retained artifacts: B3.5 used two scratch puppeteer
  probes (a `.selbox`-specificity check, a section-anchor `scrollY`/`docHeight`
  probe) and one `git stash` round-trip, all outside the repository or reverted
  before the commit; nothing was left in the working tree or committed from
  them. `dist/` was rebuilt several times over the course of the investigation
  and was left built at its final, correct state (all three fixes present,
  none reverted) - built, not committed: `dist/` is gitignored.

- Session end partial progress (this session, B5.1): none - the batch is
  complete and committed, `npm run check` and `npm run check:built` both
  exit 0 on the committed tree, and the two filtered parity runs the brief
  asks for both ran to completion (their results and the three open findings
  are in "Verification" and "Blockers"). `node tests/parity.js "tables"` and
  the unfiltered suite were not run - explicitly the orchestrator's, per the
  brief.

- Session end partial progress (B3.6/B4 session): none - B3.6 and B4 are both
  complete and committed; the tree is at a coherent boundary. B4's own gate
  results are in "Verification"; the CI result for B3.6 part 2 is recorded
  under "Blockers": run `34404013490` on `958f182` is green on every job,
  which closes B3.6 part 1's last open criterion.

- **Deferred, decided by the owner this session:**
  - **B3.7, shipping self-hosted fonts, was considered and dropped.** The app
    declares `"Inter", -apple-system, "Segoe UI", Roboto, ... sans-serif` with
    no `@font-face` and no font files, so glyphs depend on the machine. The
    weights in use (`650`, `680`, `620`, `560`, `540`) only render as authored
    with a variable font, and `style.css:1394` needs a real italic for the
    print card. It would remove cross-platform variance at the root, but it
    edits the frozen static root, invalidates every recorded `VISUAL_DEBT`
    number at once, and risks the browser-measured print fitting. Owner's
    call: not now, and not worth the attention it was taking.
  - **A `ubuntu:24.04` container for authoritative parity numbers** was
    first prepared and not built, then built in B3.6 as `tools/parity-ubuntu/`
    (`1d368e2`). It reproduces CI to the hundredth on layout states and not on
    timed ones; `docs/parity.md`, "Machine variance", carries the recognition
    test.
  - **Making the usage guard autonomous** (summing `message.usage` from the
    session transcript, which exists in every surface). Rejected for now
    because it measures this session's spend rather than the account's window,
    so its thresholds would have to be re-derived rather than carried over.
