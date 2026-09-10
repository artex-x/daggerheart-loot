# Handoff - TASK 47

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/context.md`, then `issues/47/plan.md`, then this file. Nothing here
depends on chat history.

## Status

- Task status: in_progress - B4 built and committed; no next batch is
  implement-ready below (see "Next batch")
- Last agent: implementer (B4 built)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `ccb80cb`. B3.5 is `a58dd97` plus its remediation
  `fb8cb0d`; **B3.6 is complete in all three parts** - part 0 `f7308a9`,
  part 1 `38cfbbb`, part 2 `958f182`; the container tooling is `1d368e2`.
  **B4 is built this session** - see "Completed" for its commit sha.

Phase 4's B1-B3.6 and B4 are all built. B4 was the last body shape the tables
slice needed (`plan.md`, "the tables surface, and how it splits"), so every
table in `TABLE_DEFS` now draws a real body and `TablesPage.svelte` carries no
placeholder branch. What is left of Phase 4 is the lists, search and print
slices - none of them implement-ready yet; see "Next batch".

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
- Commit(s): see `git log` for this session's B4 commit.
- Deviations and rationale: the `allEquip` order fix (above) was not named in
  the brief's line list, but it sits directly in the lines B4 rewrites
  (`equipOfKind`, `equipFacets`, both first called by this batch) and is
  exactly the kind of "cheap, local, safe bug in a touched path" `CLAUDE.md`
  says to fix rather than defer. No other deviation from the brief.

## Verification

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
- Gates for the next batch (B4): `npm run check`, `npm run build`,
  `node tests/parity.js "eq_"` while working (fits one foreground call),
  `npm run check:built`, then `node tests/parity.js "tables"` in the
  background or by the orchestrator (over the 600s cap after B4's eight
  states), and the unfiltered `node tests/run-all.js parity` by the
  orchestrator. What is left of a full run's redness on a Windows machine is
  the documented per-platform tolerance, cell by cell, in "Blockers".

## Next batch (implement-ready)

B3.6's three parts and B4 are all built (`f7308a9`, `38cfbbb`, `958f182`, and
B4's commit - see "Completed"). Their briefs used to sit here and are
retired: B3.6's designs are `plan.md`, "B3.6 planned, part 0/1/2", and what
was actually built is "B3.6 built, part 0/1/2"; B4's design is "B4 planned"
and what was actually built - including the `allEquip` ordering defect the
design did not anticipate - is "B4 built". Nothing from any of them is work
to do.

**No next batch is implement-ready below.** B4 was the last body shape the
tables slice needed; every table in `TABLE_DEFS` now draws a real body. What
is left of Phase 4 - the lists slice, the search slice, the print slice - has
no design or brief written yet, and picking one is a planning decision, not
this session's to make unasked. Candidates and open items, all already on
record and none re-derived here:

- **The lists slice** (`#/lists`, `pending` in `tests/parity/specs.js`) - the
  selection bar, the add-to-list row/menu, list rows, notes and batch actions.
  It is also what several deferred items below are waiting on: the 600px
  overrides for `.selx`/`.selacts`/`.seldrop`/`.dropmenu`/`.lrow*`/`.npair`/
  `.batch-acts`, and `noData`/`storageOff`.
- **The search slice** (`#/search`, `pending`) - `renderSearch` reuses the row
  wholesale (`plan.md`, "Three things found while planning the tables
  slice"), and the shared-`S.kind` question (`plan.md`, "The kind filter is
  per panel, not per app") comes due here.
- **The print slice** (`#/print/ci1-q1`, `pending`).
- The **anchor-flash defect** (`Blockers`) and the **harness width-sweep
  decision** (`Blockers`) are real, found, and still open, but neither is
  scoped as a batch yet.

The former B4 brief below is historical - what was actually handed to the
implementer this session - kept for the record rather than deleted, since
`plan.md`'s "B4 built" already carries what was built against it.

- **Name:** B4 - the equipment tables, their facets and tier sections.

- **Objective:** draw `#/tables/eq_weapon`, `#/tables/eq_secondary` and
  `#/tables/eq_armor` the way `renderEquipTable` in `app.js` (2735-2761) draws
  them - the facet strip and panel with up to seven rows, four tier sections
  keyed `t1`-`t4` and labelled "Ранг n" / "Tier n", and the empty state - so
  that every table in `TABLE_DEFS` is real and `TablesPage.svelte`'s
  placeholder branch can go. Full design: `plan.md`, "B4 planned".

- **The two early checks, answered - do not re-derive:**
  1. **The bare-number pill rule is wrong in `FilterBar.svelte`.** `fChosen`
     (app.js 2604) tests the **label**; the port tests the **value**. Same
     answer on `voa` and on the equipment tier row; different on **burden**,
     whose values are `'1'`/`'2'` and whose labels are Одноручное/Двуручное -
     the live pill reads "Двуручное", the port's would read "Хват 2". Fix: test
     `v.label`. Test both pills at once; the `~ filtered` state below carries
     both branches.
  2. **The equipment tables have tier sections as well as facets.** Four
     groups `[1,2,3,4]` off `it.eq.tier`, `.tsection#sec-t<n>` at
     `margin-top:22px`, `sectionHead` plus `renderList` (select-all per tier),
     empty tiers skipped, `.fcount` total = the whole pool (317 / 108 / 90).
     It is `voa`'s tier body with a different key, label and tier list; the
     existing sectioned branch in `TablesPage.svelte` draws it unchanged.

- **In scope:**
  - `app/src/lib/dict.ts`: six missing keys, both languages - `eqClass`
    (Класс / Class), `eqDmg` (Тип урона / Damage type), `eqTrait`
    (Характеристика / Trait), `eqRange` (Дистанция / Range), `eqBurden`
    (Хват / Burden), `eqLineF` (Линейка / Line). Copied from app.js 101-103
    and 287-289.
  - `app/src/lib/label.ts`: `srcName(key, lang)` - five book keys to
    `t.srcCore`..`t.srcVoa`, otherwise `frameName(key, lang)` (which already
    falls back to the key). `srcLabel`'s five book cases delegate to it.
  - `app/src/lib/facets.ts`: `EQ_SRC` (`core`, `hnf`, `wondrous`, `dread`,
    `voa`, then `...FRAME_ORDER`); `eqFacetRows(index, kind, t, lang)` that
    walks `EQ_GROUPS[kind]` and maps each group name to its row - order taken
    from `filters.ts` by construction; the `src` row keeps only sources with a
    record of this kind in `index.allEquip` (armour offers five, the other two
    eight); `facetRows` returns `eqFacetRows` when `EQ_TABLE[table]` is set.
    Row labels and values are the table in `plan.md`, "The facet rows".
  - `app/src/components/FilterBar.svelte`: `v.value` to `v.label` in
    `chosen`; the comment names burden.
  - `app/src/components/TablesPage.svelte`: delete `KNOWN`, `known`, the
    `{#if !known}` branch, the `.todo` rule and the placeholder story in the
    header comment (every `TableId` is drawn now); the anchor effect's `ready`
    becomes `!!index`; `eqKind = $derived(EQ_TABLE[table])`; `rows` becomes
    `eqKind ? equipOfKind(index, eqKind) : index.rows.get(table) ?? []`;
    `facPassed`'s `valueOf` uses `equipFacets(it)[g]` when `eqKind` is set;
    `bodyKind` gains `'eq'` and an `eqSections` derivation (`[1,2,3,4]`,
    key `t<n>`, label `${t.tier} ${n}`, entries `filtered` where
    `it.eq?.tier === n`, empties dropped) that `activeSections` returns; both
    `matches` callbacks share one `statLine` **without** `noType` - app.js's
    `matches` searches `eqLine(it)` with the type word in it (see plan). The
    row's display keeps `noType: true`.
  - `app/src/components/TableRows.svelte`: port `style.css:1013` -
    `.selbox:has(:focus-visible){outline:2px solid var(--gold);outline-offset:-3px;border-radius:8px}`
    - beside the `.selbox` family, with the live app's reason in a comment.
  - `tests/parity/specs.js`: the three `pending` entries become real states;
    five more states; `filteredAddress.only` and `copiedFilterLink.only` gain
    `'#/tables/eq_weapon ~ filtered'`. The state table is in `plan.md`,
    "Parity states"; the `enter` steps are: `~ panel open` presses `Фильтры`;
    `~ filtered` presses `Фильтры`, `1`, `Двуручное`; `eq_secondary ~ filter
    link` is the route `#/tables/eq_secondary/f_cls-mag`; `eq_secondary ~
    searched` types `вторичное`; `eq_armor ~ nothing found` presses `Фильтры`,
    `Уникальные`, then types `zzzqqqxx123`.
  - Tests: `lib/facets.test.ts`, `lib/label.test.ts`,
    `components/tables.test.ts` (fixture gains equipment; the placeholder test
    is deleted; cases listed in `plan.md`, "What B4 leaves behind"),
    `components/a11y.test.ts` (one pressed state: `#/tables/eq_weapon`,
    `Фильтры` then `1`).

- **Out of scope:** the selection bar and add-to-list row (lists);
  `Panel.svelte`; extending `typeRuns.only` to the equipment tables (deferred
  by the orchestrator); the anchor flash (never drawn - see Blockers); the
  harness width-sweep decision; the 600px overrides for `.selx`, `.selacts`,
  `.seldrop`, `.dropmenu`, `.lrow*`, `.npair`, `.batch-acts` (their base rules
  belong to components that do not exist - see Deferred); an equipment anchor
  parity state (deferred with a reason - see Deferred); `noData`/`storageOff`;
  any change to `docs/specs/*`, `docs/fixtures/`, `CONTRACTS.md` or `llms.txt`
  - none is needed, and if one turns out to be, stop and say so.

- **Files expected:** `app/src/lib/dict.ts`, `app/src/lib/label.ts`,
  `app/src/lib/label.test.ts`, `app/src/lib/facets.ts`,
  `app/src/lib/facets.test.ts`, `app/src/components/FilterBar.svelte`,
  `app/src/components/TablesPage.svelte`, `app/src/components/TableRows.svelte`,
  `app/src/components/tables.test.ts`, `app/src/components/a11y.test.ts`,
  `tests/parity/specs.js`, `issues/47/plan.md`, `issues/47/handoff.md`.

- **Steps:** `plan.md`, "B4 planned", "Ordered steps" 1-11 - dict, label,
  facets, FilterBar, TablesPage, TableRows, the tests, the states, then the
  checks in the order given there.

- **Acceptance criteria:**
  - All fourteen tables draw a body; `TablesPage.svelte` has no `KNOWN` and no
    `.todo`.
  - On `#/tables/eq_weapon` the panel has seven fields in `EQ_GROUPS.weapon`
    order; on `eq_secondary` six with the `cls` row labelled "Тип урона"; on
    `eq_armor` three with a five-value `src` row.
  - The strip's count reads the pool (317 / 108 / 90) with nothing picked.
  - Picking tier `1` yields a pill "Ранг 1"; picking two-handed yields a pill
    "Двуручное"; the address reads `#/tables/eq_weapon/f_tier-1.burden-2`
    whichever was clicked first.
  - `#/tables/eq_weapon/f_tier-2.cls-mag` arrives with the panel open and
    both chips pressed; `#/tables/eq_armor/f_burden-2` leaves armour whole.
  - Typing `основное` on `eq_weapon` keeps every weapon.
  - `#/tables/eq_weapon/t2` flashes `#sec-t2`; a `q*` row anchor flashes its
    row.
  - Every tier of every kind draws as its own `.tsection` with its own
    select-all, in order, and an emptied tier disappears.
  - `node tests/parity.js "eq_"` reports `расхождений нет` with every cell at
    0.00% and **no new `VISUAL_DEBT` entry**. A nonzero cell is a diff image
    opened and a control measured before anything is written, and any figure
    written is CI's (owner decision 1), not this machine's.
  - `npm run check` and `npm run check:built` exit 0 with thresholds met.
  - `plan.md` gains "B4 built" (what matched the design, what did not, the
    exact per-state percentages) and the Phase 4 table gains a B4 row; this
    file's Completed / Verification / Next batch are updated.

- **Verification commands:**
  ```text
  npm run check
  npm run build
  node tests/parity.js "eq_"
  npm run check:built
  node tests/parity.js "tables"
  ```
  Wall clock, so each fits its call: `npm run check` and `npm run check:built`
  are a few minutes each and fit one foreground call (600s cap);
  `node tests/parity.js "eq_"` is eight states and fits; `node tests/parity.js
  "tables"` was ~9 min before B4 and gains eight states, so it **no longer fits
  a foreground call** - run it in the background with stdout redirected to a
  file, or hand it to the orchestrator. The unfiltered `node tests/run-all.js
  parity` is the orchestrator's. Never run a vitest coverage pass concurrently
  with a parity run, and check for a lingering `chrome.exe` before trusting a
  vitest timeout.

- **Risks / do-nots:**
  - Do not restate `EQ_GROUPS`'s order in `facets.ts`; walk it. A test asserts
    `rows.map(r => r.group)` equals `groupsFor(table)` for all three tables.
  - Do not build the `src` row from `EQ_SRC` unfiltered: armour has no
    wondrous, dread or colossus entries, and the live panel does not offer
    them. `motherboard` has no equipment of any kind and never appears.
  - Do not fix the pill rule by special-casing `tier`; test the label, which
    is what app.js does.
  - Do not port `.selbox:has(:focus-visible)` with `outline-offset: 2px`; the
    live value is `-3px` because the row clips an outside ring.
  - Do not touch `RecordCard.svelte:81`'s `noType` or the row's display
    `noType` - only the two `matches` callbacks lose it.
  - Do not add `#/tables/eq_weapon ~ filtered` to `typeRuns.only`.
  - Do not write a `VISUAL_DEBT` number off a Windows run; do not write one at
    all before the diff image has been opened and the control measured.
  - Do not re-baseline anything outside B4's own states; the CI result for
    `958f182`/`bc91e63` is the orchestrator's to record (see Blockers).
  - `d.click('1')` matches the tier chip by exact name; if the driver ever
    falls to its substring fallback here, the `~ filtered` state is gripping
    the wrong control - stop and look, do not rename.
  - Grep the diff for `' <` at the start of an `{#if}`/`{#each}` block. B4
    ports no new inline string markup so none is expected; if one appears,
    promote the leading-space rule to `CLAUDE.md`'s "Migration and parity" in
    the same commit.
  - One batch, one commit, `feat(tables): ...`, authored as `artex-x`, no
    push.

- **Fallback (optional):** none needed. If `eqSections` cannot reuse the
  existing sectioned template branch for a reason not visible from planning,
  the answer is still not a new component: `TableRows` and `SectionHead` are
  the markup, and a fourth `Section[]` derivation is the whole difference.

## Blockers

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
- **`noData` and `storageOff`.** Untouched, waiting on the lists slice.
- **The legacy grid-numbering bug** (`list.map(tileHTML)` passing the array
  index as the tile's number) - worth reporting to the repository owner, still
  deliberately not reproduced; recorded in `ACCEPTED`.
- **The shared `S.kind`.** Batch C's.

## Notes

- Mocks path: none. B3.5, B3.6 and B4 introduce no new UI; every value B4
  draws is already in `style.css` and `app.js`, and the tier body reuses B3's
  markup.

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

- **Session gotchas.** New this session (B3.5's own, appended at the end),
  then B3's, then carried further back:

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
  - **`npm run check` starts with `prettier --check .`, which covers
    markdown.** Editing `plan.md` or `handoff.md` while a check runs risks a
    torn read and a format failure blamed on the wrong change. Write the docs
    first, or after, never during.
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

- Session end partial progress: none - B3.6 and B4 are both complete and
  committed; the tree is at a coherent boundary. B4's own gate results are in
  "Verification"; the CI result for B3.6 part 2 is recorded under "Blockers":
  run `34404013490` on `958f182` is green on every job, which closes B3.6
  part 1's last open criterion.

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
