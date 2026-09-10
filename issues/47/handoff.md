# Handoff - TASK 47

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/context.md`, then `issues/47/plan.md`, then this file. Nothing here
depends on chat history.

## Status

- Task status: in_progress - B4 built and committed (`fde9cdc`, reviewed);
  B5.1 is `fe0043b`; **the B5.1 fix-then-continue pass (blockers only) is
  built and committed this session, on top of `541d529`**; B5.2 is next, not
  yet planned in detail (see "Next batch")
- Last agent: implementer (2026-09-10: the B5.1 fix-then-continue pass - the
  reviewer's two blockers in `tests/parity/specs.js` and `PageHead.svelte`,
  plus the three findings the full parity run surfaced)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `ccb80cb`. B3.5 is `a58dd97` plus its remediation
  `fb8cb0d`; **B3.6 is complete in all three parts** - part 0 `f7308a9`,
  part 1 `38cfbbb`, part 2 `958f182`; the container tooling is `1d368e2`.
  B4 is `fde9cdc`. **B5.1 is `fe0043b`**, committed by the orchestrator after
  the implementer reached its usage limit with the tree staged, its checks
  green and the gate armed - see "Verification". The full unfiltered parity
  run against `fe0043b` is recorded in `handoff.md`, "Blockers", at
  `541d529`. **This session's fix-then-continue pass is the next commit after
  `541d529`** - see "Completed" and "Verification" below.

Phase 4's B1-B3.6, B4 and B5.1 are all built. B4 was the last body shape the
tables slice needed (`plan.md`, "the tables surface, and how it splits"), so
every table in `TABLE_DEFS` now draws a real body and `TablesPage.svelte`
carries no placeholder branch. The lists slice is planned as six batches
(`plan.md`, "B5 planned") and **B5.1 is the first of them, built**: the list
store, the toast and the add-to-list row on the card. What is left of Phase 4
is B5.2-B5.6, the search slice and the print slice - none implement-ready
yet; see "Next batch".

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

## Verification

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

B5.1 is built this session - see "Completed" and "Verification". Its brief
used to sit here and is retired: the design is `plan.md`, "B5.1 planned", and
what was built - including the two real bugs found while getting `npm run
check` green and the three measured, unstable parity findings - is "B5.1
built". The lists slice is planned as six batches in `plan.md`, "B5 planned:
the lists slice, and how it splits"; **B5.2 (the selection bar) is next, and
it is not implement-ready yet** - only the one-paragraph sketch in "B5
planned"'s table exists. A planner needs to read that sketch plus app.js's
`renderSelBar`/`selIds`/`selCount` (3706-3721) and the `S.sel` clearing rule,
then write B5.2 a proper brief the way B5.1 got one, before an implementer
picks it up. Do not treat the paragraph in "B5 planned" as sufficient on its
own - it names the surface, not the file-by-file design.

<details>
<summary>B5.1's retired brief (implemented; kept for the record, not for reuse)</summary>

- **Name:** B5.1 - the list store, the toast, and the add-to-list row on the
  card.

- **Objective:** a person can put a record into a list from its card - the
  page at `#/i/<id>` and the record modal - and take it out again, and the app
  remembers it in `dhloot.lists.v2` the way the live app does (`loadLists`/
  `saveLists`/`mergeLists`, app.js 1149-1204: v1 migrated once and left
  untouched, saves merged by id, another tab's write taken over). The row under
  every full card draws (`listPicker`, app.js 1893: the add-to-list button with
  its menu, and the print link). The app has a toast (`showToast`, app.js
  983-1006). With that, every `listRow` entry in `VISUAL_DEBT` and every
  `addToList` and record-route `controls` line in `ACCEPTED` is **deleted**,
  and `#/i/ci1 ~ toast` stops being `pending`. Full design: `plan.md`, "B5.1
  planned"; the settled decisions: "B5 planned", "Decided in planning".

- **Read first, in this order:** `plan.md` "B5 planned" (the split, the
  harness addition, the decisions), then "B5.1 planned" (what the live app does,
  read off app.js with line numbers; how it is built, file by file). The live
  functions to read yourself before writing a line: `listMenuHTML` (1831),
  `addToListBtn` (1879), `applyAddTo`/`addIdsTo`/`afterListChange` (1907-1948),
  `placeMenu` (3695), the outside-click check at the top of the document click
  handler (3865-3869), the `menu`/`newListFor`/`cancelNew`/`createFor` branches
  (4198-4235), `showToast` (983), `loadLists`..`storageWorks` (1149-1204),
  `createList` (1320), and the `storage`/`hashchange` listeners (4621-4633).
  Styles: `.seldrop`..`.picker-new input:focus` (style.css 430-457), `.cardpick`
  (439-443), `.dropmenu.long`/`.pickq`/`.pickchips`/`.picker-none` (978-986),
  `.toast*` (602-613, 989-994, `toastIn` 614), `.btn.on`/`.btn.primary.on`
  (792-794), `.btn.ghost` (250), `.caret` (945-947), the 600px `.dropmenu`
  override (828).

- **In scope:**
  - `app/src/lib/dict.ts`: seventeen keys, both languages, copied character
    for character - `addToList`, `addTo`, `inLists`, `newList`, `listNamePh`,
    `create`, `cancel`, `findList`, `addedTo`, `removedFrom`, `nameFirst`,
    `untitled`, `saveFailed`, `print`, `printHint`, `homeSet`, `homeReset`
    (app.js 109-164 and 199-200; 295-348 and 380-381).
  - `app/src/lib/icons.ts`: `plus` (`M11 5h2v14h-2zM5 11h14v2H5z`, 15) and
    `print` (app.js 1044, 15).
  - `app/src/state/lists.svelte.ts` (new): `ListStore` - `lists` state,
    `load()` (v2, else v1 through `keepLists`+`liftNotes` written to v2, v1
    untouched, parse failure `[]`), `save()` (merge with what storage holds
    now via `mergeLists`, `say(t.saveFailed, true)` on a refused write, the
    lists stay in memory), `get`, `create(name)` (`'l' + Date.now().toString(36)`
    + four base-36 chars off `env.random`, trimmed name or `t.untitled`,
    `unshift`, `created: Date.now()`, save), `addIds(list, ids, knows)`
    returning the fresh ids, `removeId`, `watch()` (reload on the v2 key).
    `lib/lists.ts`'s `keepLists`/`liftNotes`/`mergeLists` finally get a caller.
  - `app/src/state/app.svelte.ts`: `readonly lists`, `menuFor` (cleared
    wherever `navigations` bumps), `toast`/`say(msg, { error?, action? })`/
    `hideToast()` with the 1600/2600/7000ms timers; `start()`/`stop()` wire
    `watch()`.
  - `app/src/components/Toast.svelte` (new): one element, `popover="manual"`,
    `status`/polite or `alert`/assertive, `.toast[.err|.act]`, `.toast-act`,
    `toastIn`, the popover UA-style resets. Rendered by `Shell.svelte` after
    the footer.
  - `app/src/components/AddToList.svelte` (new): props `app`, `key`, `ids`,
    `primary?`; the `.seldrop` with the menu **before** the `Button`; the
    five-part menu (`plan.md`, "The menu"); chips are `Chip` with
    `label={(inList ? '✓ ' : '') + l.name}`; the tail is a `Chip` reading
    `'+ ' + t.newList` or the inline form; outside-click and hash-change
    closing; `placeMenu`'s flip and `scrollIntoView`; the 600px `.dropmenu`
    override with the base rule.
  - `app/src/components/Button.svelte`: `on`, `ghost`, `caret` (the `<i>` and
    its two rules move here from `FilterBar.svelte`, which passes `caret`),
    `sameTab` on the `href` form.
  - `app/src/components/RecordCard.svelte`: `pick?: Snippet` after
    `.card-acts` inside `.cardpick`; `.cardpick` and the two
    `.cardpick :global(.dropmenu)` placement rules.
  - `RecordPage.svelte`, `RecordModal.svelte`: the `pick` snippet (`AddToList`
    primary, then `Button size="sm" href={printHash([it.id])} sameTab
    title={t.printHint}` with the print icon and `t.print`); `say` ->
    `app.say`; the `.said` paragraph and the `sr-only` region deleted.
    `TablesPage.svelte`, `PageHead.svelte`: `say` -> `app.say`; `PageHead` says
    `homeSet`/`homeReset` on a successful pin.
  - `tests/parity/driver.js`: `seed(entries)` (an `evaluateOnNewDocument`
    registered after `prepare()`'s, `try`-wrapped like it) and `storage(key)`.
    `tests/parity.js`: `arrive()` calls `d.seed(state.storage)` before
    `d.open()` when set; `keyFor` hashes `storage`.
  - `tests/parity/specs.js`: the three seeds, four new `#/i/ci1` states
    (`~ list menu`, `~ in a list`, `~ many lists`, `~ new list` - the table in
    `plan.md`, "Parity states"), `~ toast` un-pended, the `listMembership`
    press spec (it reopens the menu when the chip is not on screen - in
    English the language click has folded it), and the deletions: every
    `listRow(...)` entry,
    the six `~ pinned` entries (once they measure zero - see Verification),
    the six `addToList` and twelve record-route/modal `controls` lines in
    `ACCEPTED`. The three modal states are re-baselined with a reason naming
    only the close button's focus ring.
  - Tests: `state/lists.test.ts` (new), `state/app.test.ts`,
    `components/lists.test.ts` (new), `shell.test.ts`, `button.test.ts`, the
    `said` assertions in `record.test.ts`/`tables.test.ts`/`roll.test.ts`/
    `std.test.ts`, `test/a11y.test.ts` (a pressed state with two lists seeded;
    `COVERED` gains `Toast.svelte` and `AddToList.svelte`). The case list is
    `plan.md`, "What B5.1 leaves behind".

- **Out of scope:** the selection bar and `sel` on `AppState` (B5.2);
  `#/lists`, the storage warning, `Shell`'s `storageOff` paragraph and
  `noData` (B5.3); the list page, batch actions, the shared page, import
  (B5.4-B5.6); `deleteList` and writes to the `deleted` set; `meta` travelling
  with an add; a separate `ListMenu.svelte`; `Panel.svelte`; a `typeRuns`
  probe on the menu; any change to `docs/specs/*`, `docs/fixtures/`,
  `CONTRACTS.md` or `llms.txt` - none is needed, and if one turns out to be,
  stop and say so.

- **Files expected:** `app/src/lib/dict.ts`, `app/src/lib/icons.ts`,
  `app/src/state/lists.svelte.ts`, `app/src/state/lists.test.ts`,
  `app/src/state/app.svelte.ts`, `app/src/state/app.test.ts`,
  `app/src/components/Toast.svelte`, `app/src/components/AddToList.svelte`,
  `app/src/components/Button.svelte`, `app/src/components/button.test.ts`,
  `app/src/components/FilterBar.svelte`, `app/src/components/RecordCard.svelte`,
  `app/src/components/RecordPage.svelte`, `app/src/components/RecordModal.svelte`,
  `app/src/components/TablesPage.svelte`, `app/src/components/PageHead.svelte`,
  `app/src/components/Shell.svelte`, `app/src/components/shell.test.ts`,
  `app/src/components/lists.test.ts`, `app/src/components/record.test.ts`,
  `app/src/components/tables.test.ts`, `app/src/components/roll.test.ts`,
  `app/src/components/std.test.ts`, `app/src/test/a11y.test.ts`,
  `tests/parity/driver.js`, `tests/parity.js`, `tests/parity/specs.js`,
  `issues/47/plan.md`, `issues/47/handoff.md`.

- **Steps:** `plan.md`, "B5.1 planned", "Ordered steps" 1-12 - dict and
  icons, the store and `AppState`, `Button`, `Toast`, `AddToList`, the card
  and the pages, the tests, the harness, then the checks in the order given
  there.

- **Acceptance criteria:** `plan.md`, "B5.1 planned", "Acceptance criteria" -
  in one line each: the row on every full card and in every modal; the menu
  opens before the button, newest list first, and closes on a second press,
  an outside click or a hash change; a chip adds (merged) and ticks and
  toasts, a lit chip removes and toasts, a refusing storage keeps the session
  and toasts `saveFailed`; the search box from the eighth list; the new-list
  form with its blank-name refusal; v1 read once and left alone; another tab's
  write taken over; the toast in the top layer with the three durations;
  `~ pinned` toasts; **every new `#/i/ci1` cell and every record-route cell at
  0.00%**, the `listRow` entries deleted, the three modal states at new,
  smaller, explained numbers; `listMembership` matching; no stale `ACCEPTED`
  line; `npm run check` and `npm run check:built` exit 0.

- **Verification commands:**

  ```text
  npm run check 2>&1 | tail -n 120
  npm run build
  node tests/parity.js "i/ci1"
  node tests/parity.js "i/q1" "i/f1" "wondrous ~ modal" "a row opened" "pinned"
  npm run check:built
  ```

  Wall clock, so each fits its call: `npm run check` is ~165s measured
  (`context.md`, "npm run check, settled") - run it exactly as written, one
  foreground call, unchained, unredirected, piped to `tail`; if it reports
  zeros down the coverage table with `Errors` equal to the file count, no test
  ran - re-run it, do not background it. `npm run check:built` is a build, a
  `file://` smoke and a bundle budget, a couple of minutes. The two parity
  filters are **7 states** (`#/i/ci1`, `~ whole`, `~ toast`, and the four new
  ones) and **6 states** (`#/i/q1`, `#/i/q1 ~ another tier`, `#/i/f1`,
  `#/roll/wondrous ~ modal`, `#/tables ~ a row opened`, `#/roll/wondrous ~
  pinned`) - each about a third of B4's 26-state "tables" run, so each fits
  one foreground call with room; do not merge them into one call, the
  whole-page and modal states are the heavy ones. `node tests/parity.js
  "tables"` and the unfiltered `node tests/run-all.js parity` are the
  orchestrator's. Never run a vitest coverage pass concurrently with a parity
  run, and check for a lingering `chrome.exe` before trusting a vitest timeout.

  Numbers: a new `#/i/ci1` cell or a record-route cell that is not 0.00% is
  a diff image opened and a value measured before anything is written (the
  two places to look first are named in `plan.md`, "Parity states"). The
  three modal states' new figures come from `tools/parity-ubuntu/` (docker;
  the README has the command - redirect its output) when it is available,
  and otherwise go in as the Windows figure with a reason that says "Windows,
  advisory, CI to confirm" and a line in Blockers listing the eighteen cells.
  The six `~ pinned` cells are timed: on this host they may match or may
  catch one side's toast expiring; delete the entries only if all six read
  0.00% here, otherwise leave them as they are with a note in the handoff
  that CI decides - never write a Windows number over them.

- **Risks / do-nots:** `plan.md`, "B5.1 planned", "Risks and do-nots", and in
  particular: the menu is drawn before the button; `+ Новый список` is a
  plain chip, not dashed; the English cells of a menu state show the menu
  closed because the language click is an outside click - do not "fix" that;
  the toast's timers live in `AppState`, not the component; the popover is
  hidden through `hidePopover()` in an effect, not `{#if}`; no `Date.now()`
  reaches a screen a parity state photographs; no Windows number is written
  as though it were CI's; grep the diff for `' <` at the start of an
  `{#if}`/`{#each}` block (the `✓ `/`+ ` prefixes are string expressions,
  which is why they are written that way); one commit, `feat(lists): ...`,
  authored as `artex-x`, no push.

- **Fallback (optional):** if the top-layer toast cannot be made to measure
  identical on `#/i/ci1 ~ toast @ ru 1100` after its computed `inset`,
  `margin`, `padding`, `border` and `width` have been compared against the
  live `.toast`, drop `popover` and render it as a plain `{#if}` fixed
  element; then a toast raised from inside the record modal sits under the
  dialog's backdrop and is not announced - write that into "Blockers" for
  B5.2 with the second answer already considered in `plan.md` (a `Toast`
  rendered inside the dialog). Not needed: `popover` measured pixel-identical
  on every state this batch built.

</details>

## Blockers

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

- **Owner decision, 2026-09-10: the timed-state problem is B5.2's research.**
  `#/i/ci1 ~ toast` and `#/roll/wondrous ~ pinned` cannot photograph a toast
  deterministically - the width sweep takes three shots against a 1600ms
  toast, on each side independently, and the legacy side may come from the
  screenshot cache - so each cell is a coin flip and the ratchet fails it in
  both directions. The two candidate answers already on the table: name timed
  states as a class in `docs/parity.md` with a slack the runner honours, or
  re-arrive per width for them. **Do not settle this in a fix-pass.** B5.2 is
  planned extensively in its own session; this is part of its brief.

- **A second unstable class, distinct from the toast and worth naming in the
  same research.** `#/i/ci1 ~ whole` fluctuates on this host with an unchanged
  build - `@ ru|en 1100` carry entries reading "unstable on this host - paint
  noise, geometry identical", and B5.1's fix-pass had to add `@ ru 768` at
  7.31 after the full suite caught it, having itself read 0.00% on three
  consecutive local runs. It recorded the **worst** reading rather than its own
  best, which is the honest choice and has a consequence to expect: the
  ratchet fails a cell that measures better than its debt by more than
  `DEBT_SLACK`, so these entries will flap red locally until CI settles them.
  Timed toasts and paint-noise whole-page shots are two different mechanisms
  with one symptom; a fix for one does not fix the other.


- **`#/i/ci1 ~ whole @ 1100` needs a CI reading before its `VISUAL_DEBT`
  figure can be trusted - this machine gave two different answers on an
  unchanged tree.** `ru` read 1.43% then 5.53%; `en` read 4.88% then 0.00%,
  across two consecutive `node tests/parity.js "i/ci1"` runs this session,
  nothing else touched in between. A standalone probe
  (`getBoundingClientRect` on `.card`, `.cardpick` and `.foot`, both apps,
  both languages, with and without the English switch) found every rect
  byte-identical to the fraction in every configuration, which rules out a
  layout defect and leaves paint - the same class `docs/parity.md` names for
  the help panel, just larger and, on this host, genuinely unstable rather
  than a fixed small number. 768 and 375 are exact zero on every run and are
  not part of this. Recorded at the worse of the two runs per cell
  (`VISUAL_DEBT`, `#/i/ci1 ~ whole @ ru|en 1100`) with a reason naming the
  instability; read CI's own number for these two cells before trusting
  either the recorded figure or a future local re-run.
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
- **`#/roll/wondrous ~ pinned` still does not read all-six-zero on this
  host**, so its six `VISUAL_DEBT` entries are untouched, exactly as
  recorded before this batch, per the brief's own instruction. `ru 375` reads
  stably around 3.5% (its recorded figure is 3.64%, inside `DEBT_SLACK`);
  `en 375` alternates between ~3.8% (matching its recorded figure) and 0.00%
  between runs - the documented timed-state class (a toast that may or may
  not have faded by the time the screenshot is taken), not a new finding.
  CI decides this entry, as it already did before B5.1.

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
  the hundredth on layout states and not on timed ones.
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

- **B5.1's review findings the fix-pass deliberately did not take** (reviewer,
  opus, against `fe0043b`; verdict fix-then-continue, its two blockers fixed
  in `d1c1367`). Each is real, none is urgent, and the first two are the ones
  most likely to bite:
  - **`app.menuFor` is left stale when a modal closes with the menu open.**
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
    toast) have no caller until B5.2 and so no test.
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
- **`noData` and `storageOff`.** Untouched; assigned to **B5.3** (the lists
  index), where the live app's `storageWarning()` lands and `Shell`'s invented
  paragraph goes - see `plan.md`, "B5 planned". B5.1 does not touch either.
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

- Mocks path: none. B3.5, B3.6 and B4 introduce no new UI; every value B4
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
