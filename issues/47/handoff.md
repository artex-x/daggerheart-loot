# Handoff - TASK 47

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/context.md`, then `issues/47/plan.md`, then this file. Nothing here
depends on chat history.

## Status

- Task status: in_progress
- Last agent: implementer
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `4976cb4` (planning session). B3.5's own commit is
  `a58dd97`; this session's remediation commit is on top of it - see `git log`
  for its hash.

Phase 4 is in progress. B1, B2, B3 and now **B3.5 are built**. The batch order
ahead is **B3.6 -> B4**; B4 (the three equipment tables) is unchanged and still
follows, with both of its early checks intact - see "Deferred".

**B3.6 is one batch in three parts**, merged at the owner's request on the
standing "prefer larger coherent batches" policy: **part 0** makes the parity
suite quick enough to run repeatedly, **part 1** greens the red CI run, and
**part 2** builds the instrument that would have caught B3.5's defects.
Both are about whether the harness's verdict can be believed and both edit
`tests/parity/*`. Part 1 first - part 2's acceptance criterion is that its new
spec fails on the fixes part 1 and B3.5 made, which needs those fixes to exist.
Part 1 is a coherent commit boundary on its own if the batch is interrupted.

B4 was offered as a merge target too and is deliberately **not** folded in:
B4's own acceptance includes a clean parity run and new `VISUAL_DEBT` entries,
so building it while the debt table and the instrument are both being replaced
would make every number unattributable - the same confounding that hid three
defects behind an "antialiasing" reason for three batches.

Why these batches were inserted: a human manually reviewed `#/tables/community`
at full width and reported two rendering defects the parity harness was
reporting as clean. The orchestrator confirmed both by measurement and found a
third. All three had been absorbed by `VISUAL_DEBT` entries whose stated reason
is antialiasing. `issues/47/context.md` carries the measurements, the method
and the simulated scores; `plan.md`'s "B3.5 planned" and "B3.6 planned"
sections carry the design. Do not re-measure and do not re-run parity to
confirm the diagnosis - the implementer produces the real numbers.

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

## Verification

- Commands run (exact), previous session:
  - `npm run check` - passes: format, lint, typecheck (0 errors), data build,
    `derived`, `i18n`, and the full Vitest suite (657 tests, all thresholds
    met).
  - `npm run check:built` - passes: build, `file://` smoke, bundle budget
    (56.8 kB gzip against a 120 kB budget).
  - `node tests/parity.js "tables"` - passes clean (`расхождений нет`).
- Commands run, this session (B3.5, in order):
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
- Gates for the next batch: `npm run check`, `npm run check:built`,
  `node tests/parity.js "tables"` while working (or a narrower filter matching
  B3.6's own `only` list), `node tests/run-all.js parity` before the commit.
  That last command was **already red going into B3.6, for reasons B3.6 did
  not cause** - greening it is now B3.6 part 1's whole job, so the gate and
  the batch are the same thing. See "Blockers".

## Next batch (implement-ready)

- **Name:** B3.6 - a parity harness you can trust. Three parts, one batch.

### Part 0 - make the harness quick enough to use

- **Objective:** cut the parity suite's wall clock before part 1 runs it a
  dozen times. It is 867s on CI and ~9 min for the `tables` filter alone, and
  that cost is why workers push runs into the background and lose them, why a
  filtered run gets treated as the gate, and therefore why CI stayed red for
  eight runs unnoticed. Full design in `plan.md`, "B3.6 planned, part 0";
  reasoning in `.claude/improvements.md`, "Finding 5".

- **In scope:** a `testTimeout` that matches what the tests actually do
  (`vite.config.mts` sets none, so vitest uses 5000ms while the a11y specs
  legitimately take 5-13s - one `npm run check` this session produced 66
  failures, 50 of them `Test timed out in 5000ms`, on a suite that passes
  clean alone; three sessions have now written this off as "contention");
  content-addressed caching of the **legacy** screenshots (the
  static root is frozen by policy, so they are recomputed identically every
  run - key on a hash of `index.html`, `app.js`, `style.css`, `data.js`, the
  referenced assets, the state's own definition and the viewport list; expect
  ~half the wall clock), plus sharding the CI run across a 4-way job matrix.

- **Out of scope:** local parallelism. It can change timing, and the B3 handoff
  already records spurious 5000ms timeouts from overlapping browser work. Part
  2 exists to make measurements trustworthy; do not destabilise the instrument
  in the same batch.

- **Acceptance:** cold and warm runs give identical verdicts and identical
  percentages for every state; `--no-cache` reproduces the cold run; touching
  `style.css` provably invalidates the cache; CI green and faster.

- **Why it is safe before part 1:** caching returns the same bytes or re-shoots,
  so it cannot change a pixel. The instrument is unchanged while part 1 uses it.

### Part 1 - the red CI run

- **Objective:** make `node tests/run-all.js parity` green, on CI, honestly.
  `.github/workflows/ci.yml` runs `npm run test:legacy` = `node
  tests/run-all.js` **unfiltered**, so the full parity suite gates every push
  and pull request, and `main` has been red for eight consecutive runs since
  2026-09-03. Nobody noticed because sessions only ever ran the filtered
  `tables` subset locally. Full design in `plan.md`, "B3.6 planned, part 1";
  the failing states, both machines' numbers and the method are in
  `context.md` under "CI is red". Do not re-run to rediscover the list.

- **Two owner decisions, settled - do not re-open:**
  1. **CI (ubuntu) is the authoritative machine for `VISUAL_DEBT` numbers.** A
     local Windows run is advisory. Local-only drift may not be written into
     the table as if it were the baseline.
  2. **Diagnose every failing state and fix root causes; re-baseline only what
     is genuinely machine variance.** Not "green it now, diagnose later" - that
     risks writing another absorbing excuse of the kind B3.5 just removed.

- **In scope:** the complete failing-state list (the CI log is capped at about
  a dozen lines - use an unfiltered local run or the `failure-output` artifact
  from run `34019148841`); a per-state diagnosis with a named cause; the fixes
  those diagnoses call for; `#/i/f1`'s missing `ACCEPTED` entry for the
  add-to-list gap that every other record-card route already has; the platform
  rule written into `docs/parity.md`'s "Machine variance"; and a recorded
  decision on whether CI keeps the unfiltered suite as a blocking gate (~867s).

- **Start with `#/i/ci1 ~ whole`.** Largest overshoot (up to 1.4pp), over on
  both machines, and a whole-page state where one missing element shifts the
  footer and costs a lot of pixels at once. Expect B3.5's pattern: separate
  "noise" reasons that each turn out to be one CSS declaration.

- **Acceptance:** every failing state diagnosed and named, not one left as
  "antialiasing"; the suite clean locally with stated reasoning for why it will
  be clean on ubuntu; `npm run check` and `npm run check:built` pass; any
  raised debt entry says out loud that it was raised and why. **CI green on the
  resulting commit is the criterion that matters and cannot be verified from
  the working tree - it needs the owner to push. Say so rather than declaring
  victory locally.**

### Part 2 - the instrument that would have caught them

- **Objective:** add the measurement that would have failed loudly on all
  three of B3.5's defects instead of silently absorbing them - computed
  typography and a measured text/element advance on four named controls, run
  at every width, not only the widest - plus the `DEBT_SLACK` ratchet fix that
  B3.5 had to work around by hand. Full design in `plan.md`, "B3.6 planned"
  (`#### What to build` through `#### Fallback, considered and not chosen`);
  this section is the condensed, implement-ready version of the same plan,
  plus what B3.5 learned that touches it.

- **Read `plan.md`'s "B3.5 built" section first**, specifically the paragraph
  on the frozen-scrollY mechanism `#/tables/voa ~ section anchor @ ru 375`
  exposed. B3.6's four probes do not read a screenshot's scrollY - a probe is
  `getBoundingClientRect()`/`textContent` on a live element, not a pixel
  count - so the mechanism most likely does not apply to this batch's `only`
  list. It is flagged here as a thing to keep in mind, not a known defect in
  this batch's own design; do not go looking for it without a reason.

- **In scope** (unchanged from `plan.md`):
  - `tests/parity/driver.js`: one new method, `typeAt(probes)` - see
    `plan.md`'s exact shape (`font`, `family`, `text`, `advance`, `width` per
    probe, `null` for an absent element).
  - `tests/parity/specs.js`: one new spec, `typeRuns`, `perWidth: true`, over
    four probes - `.toolbar input[type=search]`, `[data-row] .rt`,
    `[data-row] .rt b`, `.ffilter .field .lbl` - scoped to the `only` list
    `plan.md` names (`#/tables`, `#/tables/hnf_consumable`, `#/tables/dread`,
    `#/tables/wondrous ~ panel open`, `#/tables/community ~ panel open`,
    `#/tables/community`, `#/tables/voa`).
  - `tests/parity.js`: split `looks` from a new `measured` (`perWidth`) list;
    run `measured` specs inside the existing per-width loop, after
    `d.settle()`; diff once per width with `<id> @ <lang> <width>` as the key.
  - `tests/parity.js`: the ratchet fix -
    `pct <= JITTER && debt.pct > JITTER` fails, asking for the entry to be
    deleted - closing exactly the hole B3.5 had to work around by reading run
    output instead of trusting a red run.
  - `docs/specs/COVERAGE.md`: "The look" describes three instruments now, not
    two; the geometry exception is amended, not contradicted; the "can only
    ratchet towards zero" line becomes true rather than aspirational.

- **Out of scope** (unchanged from `plan.md`):
  - `#/i/*`, `#/roll/*` and the equipment tables' probes - deliberately
    deferred, named in "Deferred" below.
  - Region-diff scoring (`plan.md`'s "Fallback, considered and not chosen").
  - B4's equipment tables.
  - **The four pre-existing full-suite failures under "Blockers" below.**
    They are not this batch's defects and none of them are tables states, but
    B3.6's own ratchet fix and its own acceptance criterion
    (`node tests/run-all.js parity` passes) will hit them regardless, because
    they already fail that same command today. Read "Blockers" before
    assuming a red full run means this batch broke something.

- **Files expected:** `tests/parity/driver.js`, `tests/parity/specs.js`,
  `tests/parity.js`, `docs/specs/COVERAGE.md`, `issues/47/plan.md`,
  `issues/47/handoff.md`.

- **Steps:** follow `plan.md`'s "B3.6 planned" `#### What to build`, items 1-5,
  in order - the driver method, the spec, the per-width wiring, the ratchet
  fix, then `COVERAGE.md`. Determinism notes and the exact `only` list are in
  the same section (`#### Determinism`, `#### Which states`).

- **Acceptance criteria** (from `plan.md`, plus one addition):
  - `node tests/run-all.js parity` passes **once the four pre-existing
    failures under "Blockers" are resolved or explicitly excluded from this
    batch's own claim of done** - decide which at the start of this batch and
    record the decision here; do not let it sit ambiguous through the whole
    batch. (Resolving them is not required to be B3.6's own work - they
    predate B3.6 as much as they predate B3.5 - but *something* has to give
    the run a clean exit before this batch can claim its own acceptance
    criterion.)
  - The instrument is proved to fail: each of B3.5's three fixes reverted
    locally, one at a time, working tree restored after each - a filtered run
    reports a `FAIL` naming the field (`... :: typeAt :: search`, `::
    filterLabel`, `:: rowText` at 375). Exact output goes in the handoff.
  - The per-width wiring runs `typeRuns` at 1100, 768 and 375, width visible in
    the state name.
  - The ratchet change fails at least one genuinely stale entry (record which)
    and every stale entry it finds elsewhere in `VISUAL_DEBT` is deleted, with
    the run output as evidence - the same standard B3.5 held itself to by
    hand.
  - `COVERAGE.md`'s "The look" describes three instruments, the geometry
    exception, and a debt statement that is true.

- **Verification commands:**
  ```text
  npm run check
  npm run check:built
  node tests/parity.js "tables"
  node tests/run-all.js parity
  ```
  Same shape as B3.5's. Do not run `npx vitest run --coverage` and
  `node tests/parity.js`/`node tests/run-all.js parity` concurrently - see
  Notes; check for lingering `chrome.exe` before trusting a `npm run check`
  timeout as real.

- **Risks / do-nots** (from `plan.md`, unchanged):
  - Do not widen the rounding to make a probe agree - an unexplained sub-pixel
    difference is an `ACCEPTED` entry with a measured reason, not a wider
    tolerance.
  - Do not add probes for controls that are not built.
  - Do not let the `only` list grow past the tables states named above.
  - Do not delete a `VISUAL_DEBT` entry the ratchet change surfaces without
    opening the diff image first - the new failure says the number is stale,
    not that the screen is exact.
  - Do not assume a red `node tests/run-all.js parity` means this batch broke
    something before checking it against the four states named in "Blockers".

- **Fallback (optional):** a region diff, considered and rejected in
  `plan.md`'s "B3.6 planned" - worth revisiting only if the probe approach
  needs more than a handful of selectors.

## Blockers

- **New: `node tests/run-all.js parity` (the unfiltered suite) fails on four
  states, discovered while running B3.5's own gate. Confirmed pre-existing,
  not caused by B3.5, not caused by B3.6 either - but both batches list that
  command as an acceptance criterion, so the next session that wants a truly
  clean full run has to deal with this first.** The failures:
  - `#/roll/wondrous ~ modal @ ru 768` (8.73% measured against an 8.57% debt)
    and `@ ru 375` (13.90% against 13.55%).
  - `#/roll/wondrous ~ help @ ru 768` (0.92% against 0.73%), `@ ru 375` (0.64%
    against 0.52%), `@ en 375` (0.95% against 0.79%).
  - `#/i/ci1 ~ whole @ ru 768` (5.61% against 5.39%), `@ ru 375` (7.64% against
    7.28%), `@ en 768` (5.40% against 5.22%), `@ en 375` (7.69% against 7.01%).
  - `#/i/f1` (both languages): a `the controls on the page :: controls`
    mismatch - the live app's control inventory includes `Добавить в список`/
    `Add to list`, the rewrite's does not, and this state's `ACCEPTED` entry
    for that gap was never written (every other record-card route has one).
    Also a small pixel drift with **no** `VISUAL_DEBT` entry at all: `@ ru
    1100` 0.60%, `@ ru 768` 0.11%, `@ en 1100` 0.44%, `@ en 768` 0.10% -
    plausibly the same missing-control gap shifting the layout, not measured
    further.
  - All eleven cells are "стало хуже" (worse than the recorded debt) or a bare
    inventory mismatch - not the "got better, forgot to lower the number"
    shape B3.5's own deletions were.
  - **Correction (this remediation pass): the cause is not machine drift.**
    The "recorded on a machine that renders slightly differently" hypothesis
    offered above is ruled out, not just unlikely - see `context.md`'s
    "Correction: the CI failures are stale baselines, not machine drift"
    section for the full evidence. The control: the same Windows machine's
    `#/tables ~ a row opened` and `#/tables ~ help` reproduce their own
    recorded numbers to the hundredth, so this machine does not render
    differently from whatever recorded the debt table. What actually
    happened is that `117af2e` (2026-09-02) recorded the numbers, then
    `9fa9ad5` (2026-09-03) changed `RecordCard`/`RecordModal`/`AltPanel`/
    `RollPanel`/`StdPanel` - the components `#/i/ci1 ~ whole` and
    `#/roll/wondrous ~ modal` draw - without touching `specs.js`, and
    `e5985ff` (2026-09-03) changed `PageHead`/`help.ts` - what `~ help`
    draws - touching `specs.js` but not these entries. B3.6 part 1's branch
    to expect is "recorded before a component change, never re-baselined,"
    named with the commit - not "rendering noise" and not "another machine."
  - `#/i/f1` is a separate, simpler case: `2970c03` (B3) added the state with
    no `ACCEPTED` entry and no debt entry for the missing add-to-list
    control, so **this state has never passed**, on any machine, since it
    was added - not a regression, an omission every other record-card route
    has already had covered.
  - **Confirmed pre-existing, not B3.5's:** `git stash push -u`, rebuild
    `dist/`, re-run the same four filters (`"wondrous ~ modal"`,
    `"wondrous ~ help"`, `"ci1 ~ whole"`, `"i/f1"`) against the unmodified
    tree - identical failures, identical numbers. `git stash pop`, rebuild,
    confirmed B3.5's own three fixes are back and the `"tables"` filter is
    still clean. The scratch stash left no trace; nothing from it was
    committed.
  - **Owned by B3.6 part 1**, which is the next batch. It runs each failing
    state down with the standalone-script method `context.md` and B3.5's own
    section-anchor investigation used, decides per state whether the cause
    needs fixing or the number is genuine cross-platform variance, and adds
    `#/i/f1`'s missing `ACCEPTED` entry. See "Next batch" and `plan.md`,
    "B3.6 planned, part 1".
  - **The local list above is not the whole story.** CI failed at `4976cb4` on
    a partly different set - `#/roll/wondrous ~ help @ en 768` fails on ubuntu
    and passes on Windows, `#/i/f1` and `~ modal` the reverse - and
    `run-all.js` caps its CI output at about a dozen lines, so even the ubuntu
    list may be incomplete. `context.md`'s "CI is red" section has both lists
    and the run id. Two of the CI failures (`#/tables/wondrous @ en 768` and
    `@ en 375`) are **already fixed** by B3.5.
- Owner-side, unchanged: Pages source is still not switched to `dist/`.

## Deferred

- **This remediation pass's own nits, from the B3.5 reviewer, recorded but not
  fixed - do not fold any of these into a future batch without re-reading
  them first, they are small and easy to lose:**
  - `#/tables/voa ~ section anchor @ ru 375`'s raised entry: the entry's own
    `why` does not itself say the number went up - only the block comment
    above `VISUAL_DEBT` does. A reader of the entry alone cannot tell it was
    raised rather than just recorded.
  - `VISUAL_DEBT`'s own doc comment (`tests/parity/specs.js`, above line 676)
    still says an entry "may go up in one case" - it now needs a second
    clause, or a generalisation, since this remediation pass's `core_item`
    fix keeps the entry's *reason* accurate without raising its number at
    all, which is a second way an entry legitimately changes without either
    ratcheting down or being the one documented raise case.
  - `#/tables/voa ~ section anchor @ en 375` is recorded at 8.84% but
    currently measures 8.90% (passes, inside `JITTER` of the recorded value)
    while its sibling (`@ ru 375`) was raised to its exact measured value.
    Inconsistent treatment of two entries with the same cause - worth
    reconciling, not urgent since both currently pass.
  - `plan.md`'s "What every remaining `VISUAL_DEBT` entry is" (around line 64
    and 104) still calls the 375px row/section anchor debt "cause 6" and
    still promises a rewrite of that section; the actual correction landed
    as a new "B3.5 built" section instead, appended rather than folded back
    into the original "cause" enumeration. The document now has two places
    describing the same debt with different framing.
  - `docs/specs/COVERAGE.md:159-160` still states debt "can only ratchet
    towards zero" - not true today, per the same `DEBT_SLACK`-silence gap
    B3.5 and this pass both had to work around by hand. B3.6 part 2's own
    plan already carries the fix (`plan.md:1572`) but it has not landed.
  - The handoff's "Cleanup performed / retained artifacts" note (B3.5, this
    file) says `dist/` "is committed at its final, correct state" - `dist/`
    is gitignored (`.gitignore:30`) and was never committed. The sentence
    should have said "built," not "committed."
  - `docs/parity.md`'s new "whole-page percentage" rule (in the `Contract`
    list) is a seven-line paragraph sitting among one-line bullets -
    stylistically inconsistent with the rest of the section, worth trimming
    or moving to its own subsection later.
- **`.selbox:has(:focus-visible)` (`style.css:1013`) has no port in
  `TableRows.svelte`.** The live app draws an inset focus ring because the
  row clips an outside one; the rewrite leans on `tokens.css`'s universal
  `:focus-visible` at `outline-offset: 2px` instead, which is a visible
  difference the moment a row checkbox is reached by keyboard. No current
  state exercises keyboard focus on a row checkbox, so parity cannot see the
  gap yet. Pre-existing before this remediation pass, but sits in the same
  rule family (`TableRows.svelte`'s `.selbox`) this pass and B3.5 both
  edited, so it is worth a line here rather than staying purely tribal
  knowledge.
- **The 600px overrides for `.selx`, `.selacts`, `.seldrop`, `.dropmenu`, the
  `.lrow*` family, `.npair` and `.batch-acts` belong to components that do
  not exist yet.** They must be ported together with their base rules when
  those components are built, not piecemeal - the exact mistake `.selbox`'s
  missing override was, four times over, per B3.5's `CLAUDE.md` line.
- **B4 - the equipment tables, their facets and tier sections.** Unchanged and
  still the batch after B3.6: `eq_weapon`, `eq_secondary`, `eq_armor`.
  `docs/specs/ROUTES.md`'s filter-grammar table and `lib/filters.ts`'s
  `EQ_GROUPS`/`EQ_TABLE` already describe the groups (`tier`, `src`, `cls`,
  `trait`, `range`, `burden`, `line`) - frozen, no change expected.
  `lib/data.ts`'s `equipFacets` already answers every value a record has for
  those groups; `facets.ts` needs an `eqFacetRows` (or similar) the way B2/B3
  added the plain-table rows, off `eqFacets(kind)` in `app.js` (2575-2620ish -
  re-read it fresh rather than trusting that range). Its **two early checks are
  preserved verbatim**:
  1. **The bare-number pill rule (`fChosen`'s `/^\d+$/` test) is B4's for
     real this time.** B3 confirmed `voa`'s tier facet never hits it -
     `voaSectionName` produces `"Ранг 2"`, not a bare digit - but the
     *equipment* tables' tier facet (`eqFacets`) really does carry bare
     `"1"`-`"4"` values, which is exactly the case `FilterBar.svelte`'s
     existing rule was written for and has been untested since B2. Confirm it
     still does the right thing once a numeric-valued facet actually exists.
  2. **Whether the equipment tables need tier sections in addition to facets.**
     The batch's own name suggests yes - re-read `renderEquipTable` in `app.js`
     before assuming the facet bar is the whole body. B1-B3 all found the real
     shape only by reading the function, never by trusting a summary of it.
- **Extending B3.6's probes past the tables states** - `#/i/*`, `#/roll/*`, and
  the equipment tables once B4 lands. Deliberately not attempted in B3.6: a
  spec that starts reporting on every surface at once is a batch whose size
  nobody can predict.
- **Playwright.** Still worth a decision before building anything; the parity
  harness already drives both apps in a real browser.
- **`Panel.svelte`.** Still unscheduled - `.ffilter` and `.tablenav`.
  `TableRows`/`SectionHead` are not `.panel` copies.
- **`noData` and `storageOff`.** Untouched, waiting on the lists slice.
- **The legacy grid-numbering bug** (`list.map(tileHTML)` passing the array
  index as the tile's number) - worth reporting to the repository owner, still
  deliberately not reproduced; recorded in `ACCEPTED`.
- **The shared `S.kind`.** Batch C's.
- **Resolved: why the row/section anchor's flash-outline antialiasing shows in
  English but not Russian at 1100/768.** The planning hypothesis was right,
  confirmed rather than just left standing: all four English entries
  (`core_item ~ row anchor @ en 1100|768`, `voa ~ section anchor @ en
  1100|768`) measured exactly their old recorded value after B3.5's three
  fixes, unchanged. The Russian cells at those two widths still carry no
  entry at all and still print `совпадает`. Nothing moved them, which is
  itself the confirmation - the search box is genuinely out of the fold in an
  anchor state, and these four entries are genuinely about the outline alone.

## Notes

- Mocks path: none. B3.5 and B3.6 introduce no new UI; every value is already
  in `style.css` and `app.js`.

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
  - **New:** do not assume a red `node tests/run-all.js parity` means whatever
    batch is running broke something - four states (`#/roll/wondrous ~
    modal`, `#/roll/wondrous ~ help`, `#/i/ci1 ~ whole`, `#/i/f1`) were already
    failing before B3.5 touched anything; see "Blockers".

- **Session gotchas.** New this session (B3.5's own, appended at the end),
  then B3's, then carried further back:

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
    B3.6 fixes the check; until then, delete small paid-off entries by reading
    the run output.
  - **A whole-page percentage cannot see a control-sized defect.** A wrong font
    size on one line of a 1100x900 screen scores about 0.09%, which is under
    `JITTER`. This is the root cause of the whole audit and it is being written
    into `docs/parity.md` by B3.5.
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
  and is committed at its final, correct state (all three fixes present, none
  reverted).

- Session end partial progress: none - B3.5 is complete and committed. B3.6 is
  fully designed and implement-ready in two parts; see "Next batch". The
  full-suite/CI blocker under "Blockers" is unresolved by design: it is B3.6
  part 1's scope, and the owner asked for it to be executed in a separate
  session.
