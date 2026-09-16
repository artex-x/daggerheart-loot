# Handoff - TASK 47

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/context.md`, then `issues/47/plan.md`, then this file. Nothing here
depends on chat history.

## Status

- Task status: **R0b is CLOSED; R0c is implement-ready and its owner gate is
  satisfied** (planner, 2026-09-16). The owner said go for R0c on 2026-09-16
  (`context.md`, decision 11, verbatim) with two rulings: R0c carries a
  divergence sweep over everything it deletes, and what the sweep finds
  **does not block** the deletion - it is recorded and becomes Phase 8 work.
  That was the last owner gate anywhere in TASK 47.
- Last agent: planner (R0c design). Design: `plan.md`, **"R0c designed: the
  sweep, the deletions, and the cliff"** (the last section). Brief with
  numbered acceptance: "Next batch", below.
- NEEDS_HUMAN_CONFIRMATION: **no**. Every fork was decided from the tree;
  the one owner action left is filing the Phase 8 issue at closeout, which
  nothing in R0c waits on.
- Branch `main`, HEAD `a6b4a94`, `origin/main` at the same commit, nothing
  unpushed. HEAD is two commits above what R0b.4 recorded (`17bb75f`) and
  both are foreign to this task and preserved: `0969ae9` (D11 filed into
  `docs/specs/DEBT.md`, `FEATURES.md` +4) and `a6b4a94` (`img/q244.webp`,
  `og/q244.jpg`, image bytes only - no golden reads image bytes, so nothing
  in R0c's gates sees it). Working tree: ` M issues/47/context.md`
  (the orchestrator's uncommitted decision 11 and the condition-2 read -
  commit it with C0, do not overwrite it) and the untracked `issues/56/`
  and `work/`, which belong to other tasks.
- **What this planning pass found that the R0c outline did not know**, each
  verified from the files (full list with line numbers: `plan.md`, "What the
  tree says now, and where the outline was already stale"):
  - `ci.yml` was rewritten by issue 56 during R0b (`99bbb7c`, `8dae1b9`):
    `golden` is already in `deploy.needs`, `parity` is already out of it and
    gated on `workflow_dispatch`, and `tests/derived.js:522-532` asserts
    `golden`. Two inherited R0c lines close as done-by-peer.
  - Four suites the outline called "data-only and unaffected" read the files
    R0c deletes and run inside `npm run check` or `run-all`: `tests/i18n.js`
    (parses `app.js`'s `T`), `tests/derived.js` (three `app.js` reads, two
    `index.html` reads), `tests/craft.js` (JSDOM-renders `index.html` +
    `app.js`), `tests/contracts.js` (requires `tests/lib.js`). Deleting
    without re-pointing them reddens the gate.
  - `tools/capture-share-fixture.mjs` drives the root `index.html` with
    `data-copy-*` grips; `tools/probe.mjs` and `tools/parity-ubuntu/` exist
    only to compare the two apps.
  - `app/src/lib/dice.ts`'s claim that `derived` checks `DIE_ART` against
    `card/*.svg` is false today - `derived.js` parses `app.js`'s shape only.
  - `CLAUDE.md`'s counts sentence enumerates seven files; `derived.js`'s
    `COUNTERS` list now has eleven (peers added four) and nine after R0c.
  - Phase 7 condition 2's second `check-site.mjs` read is taken and green on
    `a6b4a94` (orchestrator, `context.md`); the by-name references are listed
    in `plan.md`, fact 11, for the implementer to re-derive from the file.
- Next action: **the orchestrator dispatches the sweep (C0, read-only,
  reviewer role, output `issues/47/sweep.md`)**, then the implementer for
  C0's records and C1-C4 in order. Whether R0c is reviewed is the
  orchestrator's call; the plan recommends a review of C1+C3 (the deletion
  and the workflow) in one pass.

## Completed

One line per shipped batch, newest first: name, outcome, commit(s), deviation
if any. After `plan.md`'s own 2026-09-16 compaction, that file carries each
batch's **outcome, deviations and commits** in its per-phase tables - "Phase
4's batches, as built", "Phase 5's batches, as built", "Phase 6's batches, as
built", and R0a's under "R0a built: three commits, nineteen acceptance lines
closed". It no longer carries a batch's full built record: **every step, every
gate's own numbers and every rejected alternative is at `git show
fc59ce4:issues/47/plan.md`**, the last pre-compaction commit. The code and its
specs are the rest of the record.

- **R0b.4 - all five restored (a fifth found on review), R0b closed**
  (implementer, 2026-09-16, remediated same date). Six build commits, then
  one remediation cycle after a fix-then-continue review found two blockers
  and seven nits. Build: `a375b20` C1 (the roll results' live region),
  `66972a0` C2 (the referenced card and the copy-image gate), `cf96e6f` C3
  (the frame-armour tier word), `95fa624` C4 (five of R0b.1's and R0b.3's
  inherited nits, `COVERAGE.md`, `FEATURES.md`), `acef2a8` (a bug this
  batch's own C2 introduced, found by its own goldens and fixed before they
  were re-seeded - a closed referenced card's link was hit-testable in a
  real browser), `4ca28a6` (the goldens re-seeded, 17 `#/roll/*` states, all
  traced to the added `status` node). **Blocker 1 - a genuine fifth
  divergence, `app/src/lib/search.ts` missing the same `noTier` C3 gave
  three other production call sites; owner answered restore, same
  reasoning as items 1-4.** Full record: "R0b.4's own commands and results"
  and "R0b.4 review remediation" under "Verification", below. All 18
  acceptance lines Met. **R0b is now CLOSED.** Deviation: the four-shard
  golden compare that acceptance line 1 wanted *before* any component
  change ran *after* instead - see "Verification" for what stands in for
  it.
- **R0b.3 - the print sheet ported to `dist/`, plus the four print parity
  specs** (implementer, 2026-09-16). Three commits: `1bb27b7` (C1,
  `tests/print.js`'s thirty-one groups transposed onto `fresh()`/
  `tests/app/driver.js` as `tests/app/print.js`, `run-all.js`'s `app/print`
  row), `67c47a2` (C2, `sheetCounts`/`cardFit`/`printMedia`/`copiedPrintLink`
  from `tests/parity/specs.js` folded in, `app/print`'s weight re-measured),
  `1aa8720` (C3, `docs/specs/COVERAGE.md` re-derived and flipped to landed),
  plus one remediation commit `00eb465` (below). Pushed at `00eb465`. All 13
  acceptance lines Met; no fifth divergence.
  **Preflight finding, not a divergence**: `dist/` renders no `[data-act]`
  anywhere - checked live before transposing - so the colour/black-and-white
  toggle and the "back" control are gripped by name (`d.click('Чёрно-белая'`
  style)) instead, the same fallback `tests/parity/specs.js` already used for
  the same buttons; `#selBar` is `.selbarwrap`, the substitution
  `tests/app/states.js`'s case 16 already made. **Reviewed at Opus: verdict
  fix-then-continue, two blockers, one remediation cycle, both in the batch's
  own art-rung finding.** Blocker 1: the C1 commit message and this file's
  own prose over-generalised a host-local reading into a durable spec claim
  - the longest-text set's fit ladder only fails to reach the art-hiding step
  **on this Windows host, 2026-09-16**; ubuntu CI reaches it on the same
  route (`print` suite, CI run `35130947774`, green on `98ddf52` before this
  batch existed) - `CLAUDE.md`'s "a local run is advisory" rule applies
  exactly here. `COVERAGE.md` and this file corrected to carry the host and
  the CI run rather than a general claim; `tests/app/print.js` gained a
  host-independent rung invariant beside the font-step check (if some card's
  `--pcpad` sits at its own floor, some card's art must be hidden -
  vacuously true where the floor is never reached, the real check where it
  is). Blocker 2: `cardFit`'s `--pcpad` bound was `>= 3`, one step short of
  the black-and-white ladder's real floor `2.8` (`PrintCard.svelte`'s
  `pad -= 1.5` steps 5.8 -> 4.3 -> 2.8, pinned by `printPage.test.ts:581`) -
  latent on the local run, would have fired once the ladder ran deeper on
  ubuntu. Fixed to `>= 2.8`. Two nits rode along: the text font-size floor
  `>= 2.2` tightened to the real `>= 2.6` (2.2 is the strip box's separate
  floor), and the font-step check's message corrected to name what it now
  asserts. Full command record: "R0b.3's own commands and results" under
  "Verification".
- **R0b.2 - every real-browser placement the ten-verdict audit found**
  (implementer, 2026-09-16). Four commits: `37a1061` (C1, eight new
  `tests/app/states.js` cases - real history Back/Forward, the narrow-width
  selection bar, a real HTML5 drag reorder, a folded `<details>` surviving a
  select-all re-render, tile geometry with art blocked, the storage notice
  at 320, a button keeping focus, the money-help/pressed-picker read - plus
  the note-field group folded into case 13 and R0b.1 review nit 6 closed;
  landed by a prior, interrupted run and verified byte-for-byte against the
  brief before this run continued), `97083dd` (C2, `tests/app/sweep.js`'s
  four craft-heavy pages and craft-block reads, `tests/app/hues.js`'s
  `.rstats` one-tone and selected-tile-fill reads), `c2f7931` (C3, new
  `tests/stub.js` for the share stub's no-sideways-scroll and its
  `run-all.js` row), `28636fe` (C4, `docs/specs/COVERAGE.md` re-pointed and
  every "queued for R0b.2" clause flipped to landed). Pushed at `28636fe`.
  All 20 acceptance lines Met; no deviation; no fifth divergence found.
  Full command record: "R0b.2's own commands and results" under
  "Verification".
- **R0b.1 - the harness move, the case-7 flake, R0a's four nits, the jsdom
  placements, and the ten verdicts in `COVERAGE.md`** (implementer,
  2026-09-16). Four commits: `1402bea` (C1, `git mv tests/parity/driver.js
  tests/app/driver.js` with its three code importers and five prose
  references, no edit inside the driver), `1807334` (C2, case 7's swallowed
  5000 ms wait replaced by a two-stage wait with `STORAGE_WAIT_MS = 30_000`
  and two distinct failure messages, plus R0a's four review nits), `4aa8252`
  (C3, nine jsdom `it()`s across `data.test.ts`, `tables.test.ts`,
  `record.test.ts`, `listPage.test.ts`; `w118` into
  `docs/fixtures/share/records.json`; `tests/derived.js`'s og-head facts and
  its `scrollbar-gutter: stable` pin; `smoke-file-url.mjs`'s `defer` check),
  `92c239b` (C4, `COVERAGE.md`'s Fate column with all ten verdicts and three
  new thin spots). Merged with fourteen unrelated peer commits at `a2429bd`
  (clean, no file overlap) and pushed; reviewed at Opus, verdict
  fix-then-continue with both blockers documentation, remediated in
  `6b4c838` (stale citations re-pointed, the fourth divergence folded in) -
  the one remediation cycle is **spent**. **Deviation:** regenerating the
  share fixture surfaced a real, previously-invisible divergence - `f33`, a
  frame-armour record, loses "Ранг 1"/"Tier 1" against the live app because
  `app.js`'s `eqLine()` gained an `isFrameRecord` guard in `106e4dd`
  (pre-session) that `app/src/lib/share.ts` was never given. Not fixed: the
  other eight fixture entries were kept byte-identical, only `w118` was
  added, and the finding became R0b.4's item 4.
- **R0a - the evidence, the `ACCEPTED`/`VISUAL_DEBT` sweep, and the
  structural goldens** (implementer, 2026-09-13). `b0545ed` (C1), `30b2744`
  (C2), `47a9a15` (C3) on top of `29eae18`, with `06658fd`, `858ae58`,
  `530aa10`, `6e1269b` and `f826bcd` as its records and corrections; pushed
  and green on CI in every job (run `34755188652` on `6e1269b`: `check`,
  `parity 1..4`, `golden 1..4`, `audit`, `secrets`, `deploy`). Reviewed at
  Opus: fix-then-continue, documentation only, both blockers fixed in
  `530aa10`, cycle spent. **Deviation:** the first seed measured 5.2 MB and
  the capture format was revised mid-batch - two local rules take the corpus
  to ~1.50 MB / 24,346 lines, the size gate moves 4 MB -> 2 MB, the suite
  gains `--shard=n/of`, and `ci.yml` came into scope (`plan.md`, "Decided 1,
  revised"). All twenty acceptance lines closed; line 20 (CI's wall-clock
  delta) closed after the push by measurement, not assertion.
- **B14 - the roll surface, the pinned home, and the checks that should have
  caught them** (2026-09-13). `6b18291` (C1, the roll re-render fix),
  `af7fa17` (C2, the pinned home), `a7f8787` (C3, the six inherited checks).
  **Deviation:** the remount claim did not hold - checked in `shell.test.ts`
  rather than assumed - so the batch took the named fallback
  (`toggleHome(hash?)` plus `PageHead`'s `home` override) rather than
  `route.table ?? 'core_item'`, which would have pinned the wrong table
  whenever a bare `#/tables` was reached from a named one; `canPinHome` was
  deleted rather than wired; and `typo.js`'s three name-based grips were
  found hardcoded to Russian, so every English pass had been gripping
  nothing on those controls since the suite was written.
- **B13 - the reversible cut-over** (2026-09-12). `0819a73` (the entry
  document, the derived checks, `tools/check-site.mjs`), `9177f3b` (`ci.yml`
  **alone** - the flip, so the revert is one file), `a004764` (the review's
  two documentation blockers). CI run `34718569245` on `9177f3b` green in
  every job; the published set is 13 entries with no `app.js` and no
  `style.css`; `check-site.mjs` passed against the live URL and the owner
  walked the site and returned LGTM. The site now serves the rewrite.
- **B12.1 - the router's bare-vs-unreadable fallback** (2026-09-12). One
  commit, `bc96b59`, pushed. **Deviation:** two stale `'#/print/w1,w2'`
  fixtures found while implementing, unrelated to the rule itself.
- **B12 - the real-browser layer on `dist/`, and the gates** (2026-09-12).
  `a52c17d` (C1), `9a4f8db` (C2), `4adc5a5` (C3), remediation `9ced2b3`.
  **Deviation:** the first isolated `tests/app/sweep.js 1180` run reproduced
  two failures twice over - both real, visible focus rings the live app also
  draws, invisible to `focusWalk`'s element-only outline/box-shadow read: a
  bug in the test the batch was landing, fixed in the batch.
- **B11.1 - the menu's second measurement** (2026-09-12). `e94a90e` (hash
  filled in afterwards by `64e094d`). Red-first read on `#/tables ~ a row
  opened, new list`: RU 1100/768/375 at 1.01/1.44/2.94% against an expected
  zero, EN already `совпадает` because the `EN` press folds the menu before
  the cells are shot - so the warrant is three real cells, not six.
- **B11 - the filter decoder read by the table's groups, and the menu closed
  on a real click** (2026-09-12). `73facda` (hash filled in afterwards by
  `64f9a27`).
- **B10 - the page furniture as components, and the not-found record page**
  (2026-09-11). `8b0c3ce`, with `60047d4` filling in the hash. Reviewed and
  approved, no blockers.
- **B9 - the anchor re-play and the live reduced-motion policy**
  (2026-09-11). `ad46dac`, `dba79ee`, remediation `84ca6df`; closed by CI run
  `34640328352` on `55f2fa2`, green end to end, with all seven anchor
  `VISUAL_DEBT` entries deleted rather than re-numbered.
- **B8 - the anchor debts after B7** (2026-09-11). `274aa99`; closed by CI
  run `34628983995` on `435a5ac`, which confirmed all four anchor figures
  from a second, independent reading.
- **B7 - the print slice, the last of Phase 4** (2026-09-11). `4776243`,
  remediation `ee73d2e` (the three review blockers - the print fit now reads
  the layout it just wrote). **Deviation:** two measured, harmless departures
  from the brief's own numbers (no separate `dist/assets/*.css` - Vite
  inlines styles into `app.js` for this build config; `card/` is 36 files,
  not 35, a planning-time miscount) plus one cheap in-scope `i18n.ts` fix.
  The one real defect it carried to CI rather than guessing at - cards losing
  their art on the four longest-text nine-card states - was later root-caused
  to `transition-duration: 0.01ms` and resolved.
- **B6 - the search page** (2026-09-11). `9d5ca02`. Reviewed and approved.
- **B5.6 - the shared list page** (2026-09-11). `ccbf345`, on top of
  `3324039`. **Deviation:** none from the brief's eleven steps.
- **B5.5 - the list page complete: drag as the live app does it, and the
  actions under a ticked selection** (2026-09-11). `36fd2f1` (the planning
  documents, pathspec-committed so no code rode along), `a006792` (steps
  1-4), `ba0a92d` (steps 5-13); remediation `d6c951f` (a drag starts only
  from the grip). **Deviation:** a `numField.ts`/`NumberField.svelte` fix
  outside the brief's file list, in the file step 6 was already extending to
  its first negative-range use - the reprice field is unusable without it.
- **B5.4a - the list page** (2026-09-10). `8873473`, with `fe38973` making
  the row grip draggable, plus a one-blocker remediation pass (the grip was
  inert).
- **B5.3 - the lists index, the storage notice, `noData`** (2026-09-10).
  `ba8f4b1`, with `e82cd24` matching live's GM-payload list card link and a
  `fix(lists)` fix-then-continue commit for the review's one blocker.
  **Deviation:** two in-path fixes the brief's line list did not name (axe's
  `nested-interactive` firing on the notice's dismiss button inside its own
  `<summary>`, accommodated in `a11y.ts`'s `OFF` map; and `npm run check`'s
  own `prettier --write` pass reformatting `ListsPage.svelte`'s hand-glued
  whitespace-avoidance markup back into a real bug, fixed with the
  `<!-- prettier-ignore -->` device `TableRows.svelte` already carries). The
  batch first **stopped uncommitted** on `#/lists ~ notice unfolded @ en`
  reading 5.88/6.40/9.05% against an expected zero - live's `<details>`
  re-folds on a language switch because `#view`'s `innerHTML` is rebuilt
  while the rewrite's Svelte-owned element persists - and that was closed by
  the close-out batch rather than by a design call inside the pass.
- **B5.2 - green CI, the two unstable classes, and the selection bar**
  (2026-09-10). Part 0 `f167e62` (the five CI-red cells deleted, timed states
  re-arrive per width, the whole-page capture waits for itself), part 1
  `ff741ad` (the selection bar). Closed by CI run `34492619641`, green on
  every job - the first green run on `main` since `34448283081`.
- **B5.1 - the list store, the toast, and the add-to-list row** (2026-09-10).
  `fe0043b`, fix-then-continue `d1c1367` (the reviewer's two blockers in
  `tests/parity/specs.js`). **Deviation:** a defect the design's own
  acceptance criteria surfaced rather than the plan predicting it - the
  outcome row is `plan.md`, "Phase 4's batches, as built"; the full accounting
  is at `git show fc59ce4:issues/47/plan.md`, "B5.1 built".
- **B4 - the equipment tables, their facets and tier sections** (2026-09-09).
  `fde9cdc`. Reviewed: approve, no blockers. **Deviation:** two things found
  and fixed inside the touched path that the brief's line list did not name.
- **B3.6 - the harness made quick enough to use, the red CI run, and the
  instrument that would have caught them** (2026-09-09). Three parts; part 2
  is `958f182` and the ubuntu container is `1d368e2`. Closed by CI run
  `34404013490` on `958f182`, `success` on every job - the first green run on
  `main` since 2026-09-03, and each parity shard finished in 4-5 minutes
  against the old 867s single job. **Deviation:** part 2's new ratchet caught
  a false positive on its first run, and B3.5's own rule caught the ratchet.
- **B3.5 - the absorbed parity debt** (2026-09-09). See `git log` for the
  B3.5 commit and its fix-then-continue remediation. **Deviation:** the
  instrument found a real `filterLabel` defect on its first clean run, and 29
  of the 49 `VISUAL_DEBT` entries it deleted turned out to be silent passes
  below `DEBT_SLACK` rather than real debt.
- **B3 - sectioned bodies and section anchors** (2026-09-08). See `git log`
  for B3. B1, B2 and the Phase 1-2 scaffolding predate this file's own record
  and live in `git log` and, in full, at `git show fc59ce4:issues/47/plan.md`.

## Verification

This section holds the **latest batch only**, in full, plus the one deep
write-up that is not a batch record at all (why a backgrounded `npm run check`
cannot arm the commit gate). Everything else lives where an implementer writes
it and a reviewer reads it:

- **A closed batch's outcome, deviations and commits**: `plan.md`'s per-phase
  tables - "Phase 4's batches, as built", "Phase 5's batches, as built",
  "Phase 6's batches, as built". Its **exact commands and results** did not
  survive that file's own 2026-09-16 compaction; they are at
  `git show fc59ce4:issues/47/plan.md`, one section per batch.
- **Standing cost figures and the foreground-call rule**: `docs/parity.md`,
  "Batch size and the fixed cost of a run", and `context.md`, "`npm run
  check`, settled".

### R0c preflight (implementer, 2026-09-17)

- Re-read `git log --oneline -3` before starting: `7a33c22` (Alistair's Torch
  art), `a6b4a94` (Whip art), `0969ae9` (D11 filed). Matches the dispatch's
  tree-state note exactly; `git diff --stat a6b4a94 7a33c22 -- app.js
  index.html style.css app/` empty, so the plan's and the sweep's fixed row
  counts hold. No `chrome.exe` running. `git status --short`: ` M
  issues/47/context.md`, ` M issues/47/handoff.md`, ` M issues/47/plan.md`
  (the orchestrator's/planner's pending writes), `?? issues/47/sweep.md`
  (this batch's C0 input), `?? issues/56/`, `?? work/` (other tasks' work,
  left untouched throughout).
- **`tools/check-site.mjs`'s by-name references, read from the file itself**
  (not from `plan.md`'s fact 11, per the standing rule): the root path must
  answer 200, content-type html, contain `<meta name="robots"
  content="noindex`, contain `assets/app.js`, contain `<div id="app"`, and
  **not** match `src="\.?/?app\.js"` (the flip-took assertion); `assets/app.js`
  must answer 200 and exceed 20,000 bytes; `data.js` must answer 200 and its
  body must start with `window.LOOT`; `data.json`, `catalog.csv`, `llms.txt`,
  `robots.txt` must each answer 200; `i/w1.html` must answer 200 and contain
  `og:image`; `img/_none.webp`, `og/_share.jpg`, `card/die-d12-bw.svg` must
  each answer 200. This list is what acceptance 30's C3 guard is checked
  against.

### R0c's own commands and results (implementer, 2026-09-17)

### R0b.4's own commands and results (implementer, 2026-09-16)

**R0b.3's own full command record (build and remediation) moved out per this
section's "latest batch only" rule: `git show
00eb465:issues/47/handoff.md`, "R0b.3's own commands and results" and "R0b.3
remediation".**

**Preflight.** HEAD `7157211`, clean, matching the dispatch. Re-derived
`COVERAGE.md`'s three divergence rows by grep (`flows` `:42`, `noart` `:45`,
`qa` `:47` at that HEAD - moved from the brief's `:39`/`:42`/`:44` by R0b.2's
and R0b.3's own edits, as warned). Re-derived `tests/app/states.js` case 11
(`brokenArtPath`, `:334`) and its assertions. No `chrome.exe` before any
heavy run, throughout.

**Deviation from the brief, recorded honestly: the clean four-shard golden
compare did not run before any component change.** The brief's own
acceptance line 1 asked for it "so a moved golden afterwards is provably
yours." This implementer read every file first, then went straight to
editing five components in one pass, and only ran the first golden compare
*after* C1-C4 were already committed. What stands in for it: CI run
`35136053221` (cited in the dispatch as green on ubuntu in every job,
`golden` included) is the last known-clean reading, and every one of the 17
states that then moved was read in full (not just the tool's three-line
context window - see "the fifth divergence that wasn't", below) and traced
line for line to one cause. The outcome is the same as the missed step would
have produced; the process gap is still worth naming so the next session
does not read this as the step having run.

**C1 - the roll results' live region (`a375b20`).**
`StdPanel.svelte:150`, `RollPanel.svelte:128`, `AltPanel.svelte:192` each
gained `role="status" aria-live="polite"` on the `.results` container,
matching `app.js:2235, 2292, 2325, 2341, 2368, 2391`. `std.test.ts`,
`roll.test.ts` and `alt.test.ts` each gained one `it()` asserting `role` and
`aria-live` - none of the three asserted anything about that container
before.

**C2 - the referenced card and the copy-image gate (`66972a0`).**
`RecordCard.svelte`'s refs block: the `\n` -> `<br>` line breaks now split
into real text nodes (`{#each text.split('\n')}...{#if j>0}<br />{/if}...`,
not `{@html}`), `<span class="ref-s">` became `<i class="ref-s">`, and each
card now links to `daggerheart.su` with the language-correct subdomain
(`r.url` in Russian, `r.url.replace('//ru.', '//en.')` in English -
`app.js:882-883`). `RecordActions.svelte:105`'s copy-image gate became
`it.img && !app.artBroken(it.id)`, matching live's `hasImage(it)`
(`app.js:1684`, `:2047`). `record.test.ts` gained: a test asserting the split
text nodes (filtering Svelte 5's own empty comment anchors, which are not
what CLAUDE.md's text-node rule is about - the anchors are comments, not
split text), a test asserting the href in both languages, and a test
asserting the copy-image button disappears once `ci1`'s real `<img>` fires
`error`. `tests/app/states.js` case 11 gained
`ok(!(await d.has('Скопировать изображение')), ...)` beside its existing
`Скопировать текст` assertion.

**C3 - the frame-armour tier word (`cf96e6f`).** `share.ts`'s `statLine()`
now calls `eqLine(it, lang, labels, { noTier: isFrameRecord(it) })`,
importing `isFrameRecord` from `./label.js`. `node
tools/capture-share-fixture.mjs` regenerated `docs/fixtures/share/
records.json`; `git diff` on it showed **only** `f33`'s `ru`/`en` full text
losing "Ранг 1"/"Tier 1" - confirmed, no stop-and-raise. The tool's header
note no longer calls that diff outstanding.

**A fix this batch's own goldens found, not a fifth divergence
(`acef2a8`).** Comparing shard 1 in compare mode after C1-C3 showed one
extra kind of movement beyond the added `status` node: `#/roll/wondrous ~
pinned`'s `controls` section gained a `daggerheart.su` entry. That state
renders `w1`'s full card by default (Wondrous roll #1, no press needed) -
one of the five ref-carrying records the plan's own risk read had
(correctly, for `#/i/*`) said no registered state reaches. Read the full
tree, not just the tool's three-line window (`FULL_DIFF` debug instrument
added to `golden.js` locally, used, then fully reverted - `git diff --stat
tests/app/golden.js` empty before this was committed): live's link measured
`offsetParent: false, display: none` when the `<details>` is closed
(`index.html#/i/w1`); the rewrite's link measured `offsetParent: true` for
the same state, because its own `display: inline-block` (an author rule)
beats the browser's native closed-`<details>` default, and the rewrite was
missing live's explicit `.refs details:not([open])>*:not(summary)
{display:none}` (`style.css:400`). Ported it. This is a bug in this batch's
*own* new code, found and fixed inside the batch, not an accidental loss
between the shipped apps - it does not count as a fifth item under
acceptance line 18. `record.test.ts`'s jsdom assertions never moved (jsdom
never enforced either the native default or the missing rule).

**C4 - the inherited nits and the specs (`95fa624`).** See "Deferred",
below, for the nit-by-nit outcome. `COVERAGE.md`'s `flows`, `noart` and `qa`
rows now name this batch and what guards each divergence instead of
"neither is fixed"; the `app/golden` row's stale "110 states" corrected to
105. `FEATURES.md`'s referenced-card line states the link and its
subdomain and the line breaks; its copy-image line already stated the
restored behaviour correctly (the *code* had drifted from the *spec*, not
the reverse), so no change was needed there.

**Goldens re-seeded (`4ca28a6`).** All four shards `--update`d after the
`acef2a8` fix landed, then all four compared again, clean. 17 `#/roll/*`
states moved (`_roll_alt`, `_roll_alt_crit`, `_roll_alt_crit_items_only`,
`_roll_alt_legendary_crit`, `_roll_community`, `_roll_community_second`,
`_roll_dread`, `_roll_std`, `_roll_std_help`, `_roll_std_items_only`,
`_roll_std_one_source`, `_roll_voa`, `_roll_voa_artifacts`, `_roll_wondrous`,
`_roll_wondrous_help`, `_roll_wondrous_pinned`, `_roll_wondrous_stepped`),
every one of them reading, once the wrapping `status ""` node and its
knock-on rule-A elision-boundary shifts are accounted for, byte-identical to
before - verified on the two largest movers (`_roll_dread`, `_roll_std ~
help`) by dumping the real unelided tree and diffing every line, not
trusting the tool's own three-line window. Zero `#/i/*` states moved (`git
status --short tests/app/snapshots/ | grep -c _i_` = 0), and "Copy image"
still appears in `_i_ci1.txt`, `_i_f1.txt`, `_i_q1.txt`.

**Gates, foreground, one call each:**

- `npm run build` - green, ~1-2s each of the several times it ran.
- `set -o pipefail; npm run check 2>&1 | tail -n 120` - green four times
  across the batch (once per commit whose tree differed from the last
  armed key), 42 files / 1051 tests, coverage 96.61/88.6/97.11/97.34
  throughout (was 96.61/88.58/97.10/97.34 at R0b.3's close - the branch
  figure moved a hundredth from the new gates, not a regression). One
  false alarm: a `tail -n 30`/`tail -n 40` run cut the coverage table above
  its `All files` row, so `check-observer.mjs` never saw that line and the
  commit gate refused the next commit even though the run itself was
  green - re-run with `tail -n 120` (the documented figure) armed it.
  Recorded so the next session does not mistake it for a real gate defect.
- `npm run check:built` - green (`npm run build`, `npm run smoke` - "the
  built page opens from a folder", `npm run budget` - 89.0 kB against the
  120 kB budget).
- `node tests/run-all.js app/states` - green, 106.8s (case 11's new
  assertion included).
- `MSYS_NO_PATHCONV=1 node tests/parity.js "#/i/"` - green, **78 cells
  compared**, `расхождений нет`.
- `MSYS_NO_PATHCONV=1 node tests/parity.js "#/roll/"` - green, **108 cells
  compared**, `расхождений нет`. ("ещё не перенесено (8)" lists a
  pre-existing `#/roll/alt` controls thin spot, unrelated to this batch and
  not newly introduced by it.)
- Four golden shards, compare mode, twice (before and after the `--update`
  re-seed) - see above. `съёмка` (capture) wall clocks: ~99-129s per shard
  run, eight runs total.

**Acceptance, all 18 Met:**

1. Met, with the process deviation recorded above.
2-10, 12-17. Met as designed - see C1-C4 above for 2-10 and 12-13; 14-15 and
   16-17 are the gate results above (16: 17 states moved, all traced to the
   `status` node once the `acef2a8` fix landed; "Copy image" still present
   in the three named files; 17: no deletion, no `ci.yml` touched,
   `git revert --no-commit 9177f3b` still applies cleanly, checked and
   aborted without committing).
11. Met - all five of R0b.1's remaining nits closed; see "Deferred".
18. **Corrected in review remediation: a fifth divergence was found and is
    now fixed.** `app/src/lib/search.ts:31-33`'s `statLineFor` called
    `eqLine(it, lang, labels)` with no `noTier` - the fourth production
    call site missing the guard C3 gave `RecordCard.svelte`, `RowMain.svelte`
    and `share.ts`, and the one `plan.md`'s own C3 enumeration never named
    (it named two sites, `PrintCard.svelte:34` and `TableRows.svelte:84`,
    that apply `isFrameRecord` inline and never called `eqLine` at all - see
    "R0b.4 review remediation" for the correction). A search for "ранг 1" /
    "tier 1" returned 92 frame-armour records in the rewrite and none in the
    live app (`app.js:2854`'s `matches()` searches `eqLine(it)`, and
    `app.js:612`'s guard is baked into `eqParts` itself, so every live
    consumer drops the word). **The owner answered restore** (via the
    orchestrator, 2026-09-16), the same reasoning as items 1-4 - an
    accidental loss, not a deliberate product change, so it does not go to
    `docs/specs/DEBT.md` either. Fixed in the remediation cycle; see "R0b.4
    review remediation" for the commit. The `acef2a8` fix (the closed
    referenced-card link staying hit-testable) is a separate thing and does
    **not** count as this line's item - it was a bug in this batch's own
    new code, found and closed inside the same batch that introduced it,
    not an accidental loss the original migration made.

### R0b.4 review remediation (implementer, 2026-09-16, one cycle)

**Reviewed: verdict fix-then-continue, two blockers and seven nits, cycle
spent.** Three commits, top of `main` at `17bb75f`: `676629d` (B1),
`ed557de` (B2), `17bb75f` (nits 1-6; nit 7 folded into B1). CI run
`35148554330` (cited by the review) was green in every job at `4f6cab3` -
`check`, all four `golden` shards, `audit`, `secrets` - which also retired
a risk the review raised: `tests/app/print.js`'s `1165px` assertion
(the R0b.4 nit that added `main`'s `width` to `printMedia`'s property list)
holds on ubuntu, so the constant is portable, not host-local.

- **Blocker 1 - a real fifth divergence, `app/src/lib/search.ts:31-33`
  missing `noTier`.** Fixed in `676629d`: see "R0b.4's own commands and
  results", acceptance line 18, above, for the full account (what it broke,
  the owner's answer, the fix, the test, and `plan.md`'s corrected C3
  enumeration - the wrong site list that let it through in the first
  place).
- **Blocker 2 - `context.md` and `COVERAGE.md`'s `flows` row both carried a
  false "no instrument can see this" claim, and the batch's own
  hittable-link bug is the proof.** Fixed in `ed557de`: `context.md`'s
  refs-card claim was scoped to `#/i/*` states (true) and wrongly
  generalised to every state (false - `#/roll/wondrous` and `#/roll/
  wondrous ~ pinned` both render `w1`'s refs card by default), moved to
  "Reasons already disproved" with the correction. `COVERAGE.md`'s `flows`
  row corrected to say the goldens' `controls` section *is* a guard for the
  closed-`<details>` hiding rule (`d.controls()` filters on `offsetParent`
  - that is how `acef2a8` was actually found), while the `<br>` breaks and
  the link's own text remain a real blind spot.
- **Nits 1-6, all taken (`17bb75f`).** "the deleted qa.js" -> "the qa.js
  R0c deletes" in the three panel test files' comments (`qa.js` still
  exists; only R0c removes it); `tests/app/lib.js`'s missing-`dist/` guard
  comment still read "five suites", missed by C4's own fix to a different
  sentence in the same file - corrected to seven; `std.test.ts` gained its
  own `expectNoA11yViolations` call (it was the only one of the three panel
  files with none, and `a11y.test.ts` names it as `StdPanel.svelte`'s axe
  home); all three panels' live-region tests now grip `.results` via
  `container.querySelector` rather than `screen.getByRole('status')`
  (`Toast.svelte` can carry that role too), and `roll.test.ts`/
  `alt.test.ts` reordered so their own axe test(s) stay last; the
  referenced-card link test gained `target="_blank"`/`rel="noopener"` and
  an `<i>`-not-`<span>` check for the sub-text; `FEATURES.md` gained the
  roll results' live-region line and a campaign-frame tier-suppression
  line naming `isFrameRecord` and pointing at `docs/specs/DEBT.md` as an
  open question - **not** written as deliberate, per the orchestrator's
  correction mid-cycle (the owner's counter-example: `f33` and `q313` are
  statistically identical armour, tier 1, one table prints the tier and
  the other hides it - the mechanism is documented, no reason is). Nit 7
  (the wrong `plan.md` enumeration) is B1's own fix.

**Gates, foreground, one call each:**

- `npm run build` - green, ~1-5s each of several runs.
- `set -o pipefail; npm run check 2>&1 | tail -n 150` - green three times
  (once per commit), 42 files, 1053 tests (up from 1051: the new
  `search.test.ts` case and `std.test.ts`'s new axe test), coverage
  unmoved at 96.61/88.6/97.11/97.34 throughout.
- Four golden shards, compare mode: **zero movement**, all four read
  `структурные образцы (dist/): без изменений` - `git status --short
  tests/app/snapshots/` empty afterwards. Wall clocks: 132.9s, 128.1s,
  119.7s, 122.7s (28, 28, 27, 27 states).
- No parity run: `#/i/` and `#/roll/` were both clean at `4f6cab3` and B1
  touches search text only, which no parity state types (the brief's own
  reasoning, confirmed - search is reached through `#/search`, outside
  both filters).

Pushed at `17bb75f`.

### R0a's result lines (implementer, 2026-09-13)

Full write-up and the disposition of all twenty acceptance lines: `plan.md`,
**"R0a built: the format revision, and all three commits landed"**. In one
breath: three commits (`b0545ed`, `30b2744`, `47a9a15`); `npm run check` x3,
one per commit, all exit 0, 1017 tests, 96.6/88.55/97.03/97.3; `npm run
check:built` once; eight `node tests/app/golden.js --update|compare
--shard=n/4` calls re-seeding the goldens in the revised format (105 files,
1.58 MB, all eight green); four more `--shard=n/4` comparison calls after C3
(105/105, zero differences, proving the `isHome` deletion drew nothing);
`node tests/run-all.js app/sweep` (593.5s, backgrounded past the 600s cap by
its own documented cost, all four widths green); `node tests/run-all.js
app/contracts,app/states,app/typo,app/hues` (260.4s, all green); both B1
demonstrations (`MSYS_NO_PATHCONV=1 node tests/parity.js "no-such-state"`
exits 1, `"#/lists ~ created"` exits 0 printing 6 cells); `git show 9177f3b |
git apply --reverse --check -` exit 0, checked twice. Acceptance line 20 (CI's
wall-clock delta) was closed after the push: run `34753801089` on `30b2744`
green in every job, the four `golden` shards 1m43s-2m02s and done at 11:13:51
while `deploy` started at 11:23:51, `check` and the longest parity shard
moving +6s and +1s against the warrant run - noise. CI's wall clock did not
grow.

### Why a backgrounded `npm run check` is not a gate (orchestrator, 2026-09-12)

The conclusion, kept because it is the reason a green run can still leave a
batch uncommittable: **the commit gate arms only when `check-observer.mjs`
sees a *foreground* `npm run check`'s own stdout and exit code.** A run the
agent backgrounds - or that the harness moves to the background at the 600s
cap - is invisible to the hook however honestly it passes, and
`.check-cache.json` is never written. Two implementers in a row stalled on
exactly this, each waiting for a result the gate could never accept. The
standing rule: run `npm run check` as **one foreground call**, unchained and
unredirected, piped to `tail`; if it crosses the cap the host is loaded - stop,
do not salvage, do not split it to dodge the cap, do not reach for
`SKIP_CHECK_GATE=1`.

The measured facts behind it, none of them re-derivable without re-running on
the same host conditions:

- **The gate fits, with room.** At `720266d`, clean tree, timed stage by stage
  in one foreground call each: `format:check` 11s, `lint` 30s, `typecheck`
  12s, `data` 4s, `derived.js` 1s, `i18n.js` 0s, `selftest.mjs` 19s, `vitest
  run --coverage` 88s - **165s against a 600s cap**. The whole thing as one
  command: exit 0, 33 files, 683 tests, 96.47/89.94/96.13/96.7, and
  `.claude/.check-cache.json` picked it up (`1b74ffa56fc2ecb7`). Measured
  again alone on the host during R0a: **147s**. A 937s reading was two check
  runs racing on one tree, not the gate's cost.
- **Under load it does not fit.** B11's four runs on the tree at `9e3d19f`:
  ~885s (orphaned, output lost with its shell); exit 1 with 1000/1004 passed,
  vitest 592s; exit 1 with 1003/1004, vitest 412s; the two failing files alone
  passed (`tables.test.ts` 78/78 in 106s, `searchPage.test.ts` 17/17 in 87s).
  **Every failure was host contention, proved by isolation** - three bare
  `Test timed out in 30000ms`, one anchor-flash class read after its timer
  removed it, and a 300-match cap starved for 97.9s against a 30s timeout.
  Host state: 100% CPU, 5.5 GB free of 15.8 GB, 279 processes, all the
  owner's own applications. The non-vitest half alone took ~460s against its
  usual ~77s; at 55% CPU the whole run still took ~840s.
- **Two coverage passes on one tree is self-inflicted and costly.** Between
  04:27 and 04:34 an orchestrator's run and an implementer's overlapped -
  the implementer had entered a retry loop, five attempts, each
  re-invocation starting another check. The first run's four failures are
  exactly the documented cost of that overlap; the single second run dropped
  to one. `CLAUDE.md`'s "one session at a time per working tree" covers
  agents on one tree as much as sessions. The same collision later produced
  vitest's `Something removed the coverage directory ...` - pure residue.
- **A check that reports zero coverage everywhere ran no test at all.**
  Vitest's fork-pool worker start timeout is **60s and hardcoded**
  (`START_TIMEOUT` in `vitest/dist/chunks/cli-api.*.js`; no config knob) and
  `isolate` defaults to true, so a host short of memory fails every file in
  turn. **Recognition test**: zeros down the whole coverage table, `Errors N`
  equal to the number of test files, no assertion anywhere in the output.
  Nothing ran, so nothing regressed - re-run before reading a single number.
- **The fallback, measured not guessed**: `npx vitest run --coverage
  --maxWorkers=4` cuts the peak fork count and its memory, at **171s against
  88s**. Reach for it only after the default has failed twice on the same
  tree. Nothing was changed in `vite.config.mts`, `package.json` or the gate:
  capping `maxForks` would double the check's cost on every healthy run, and
  `isolate: false` trades away the jsdom isolation the component suite rests
  on.

## Next batch

- Name: **R0c - the divergence sweep, the deletions, CI's parity job, the
  documents; task 47 closes.**
- Objective: one more deliberate read of everything the migration deletes
  (`index.html`, `app.js`, `style.css`, the legacy browser suites,
  `tests/parity.js`, `tests/parity/`) against `app/src/` for behaviour no
  surviving instrument would notice, with every finding **recorded, not
  fixed** (owner ruling 2026-09-16); then delete the static root, fourteen
  browser suites plus `tests/i18n.js`, `tests/lib.js`, the parity harness,
  `docs/parity.md`, `tools/probe.mjs` and `tools/parity-ubuntu/`; keep
  `npm run check` and every `tests/app/` suite green without them; drop the
  `parity` job and harden the deploy guard; rewrite the documents so no
  present-tense instruction names a deleted file and `CLAUDE.md` has no
  migration section; close task 47 and hand Phase 8 its inputs. Design and
  every decision with its rejected alternative: `plan.md`, "R0c designed".
- In scope: `C0` the sweep (read-only dispatch) and the homes for its
  findings; `C1` the deletions and every re-point `npm run check` needs;
  `C2` the surviving instruments (print's English pass, the `printMedia`
  null fix, N6 in the build and smoke, the share-fixture tool on `dist/`,
  `.prettierignore`/`eslint.config.mjs`, stale comments); `C3` `ci.yml`
  alone; `C4` `CLAUDE.md`, `docs/specs/*`, both READMEs, `llms.txt`/
  `robots.txt` (read), `docs/REFACTOR_PLAN.md`, `.claude/README.md`,
  prompts, templates, the small-fix skill, and the closeout of `plan.md`/
  `handoff.md`.
- Out of scope: **any template, `<style>` or statement change under
  `app/src/`** (comment re-points only - the goldens must stay
  byte-identical); `app/index.html`; fixing anything the sweep finds;
  regenerating `docs/fixtures/share/records.json` if the tool's first
  `dist/` run diffs it; a `CLAUDE.md` rule beyond the two named lines;
  Phase 8's task directory (the owner assigns the id); deleting `issues/47/`;
  renumbering `selftest.mjs`'s cases; any change to a public contract
  (`CONTRACTS.md`, `docs/fixtures/`, `llms.txt` grammar) - none is needed.
- Files expected (by commit; the full per-file detail is `plan.md`, "The
  batch: commits, files, gates"):
  - C0: `issues/47/sweep.md` (new), `docs/specs/DEBT.md` (section 3),
    `docs/specs/COVERAGE.md` (thin spots), `issues/47/handoff.md` (Phase 8
    list), `issues/47/context.md` (the orchestrator's pending edit, committed).
  - C1 deletes: `index.html`, `app.js`, `style.css`, `tests/lib.js`,
    `tests/{audit2,behave,craftmob,eqtest,flows,hues,lists2,noart,notes,print,qa,select,states,typo}.js`,
    `tests/i18n.js`, `tests/parity.js`, `tests/parity/specs.js`,
    `tests/parity/lock.js`, `docs/parity.md`, `tools/probe.mjs`,
    `tools/parity-ubuntu/` (3 files). C1 edits: `tests/contracts.js`,
    `tests/craft.js`, `tests/derived.js`, `tests/run-all.js`, `package.json`,
    `.claude/hooks/bash-guard.mjs`, `.claude/hooks/selftest.mjs`,
    `.claude/hooks/edit-followup.mjs`, `.claude/README.md` (hook rows),
    `tests/app/inventory.js`, `tests/app/driver.js`.
  - C2: `tests/app/print.js`, `tests/run-all.js` (weight), `vite.config.mts`,
    `tools/smoke-file-url.mjs`, `tools/capture-share-fixture.mjs`,
    `.prettierignore`, `eslint.config.mjs`, comment re-points in
    `tests/app/{lib,golden,sweep,hues,typo,states,contracts}.js`,
    `app/vitest-setup.ts`, `tools/artwork/lib.mjs`,
    `tools/build-share-pages.js`, and the `app/src/**` files the acceptance
    grep lists (`AltPanel`, `RecordCard`, `RecordModal`, `RowMain`,
    `a11y.test.ts`, `record.test.ts`, `roll.test.ts`, `data.test.ts`,
    `filters.test.ts`, `hash.test.ts`, `icons.ts`, `listLink.test.ts`,
    `listLink.ts`, `numField.ts`, `roll.ts`, `tokens.css`).
  - C3: `.github/workflows/ci.yml` only.
  - C4: `CLAUDE.md`, `docs/specs/{COVERAGE,DEBT,FEATURES,META,ROUTES,STATE,I18N,CONTRACTS}.md`,
    `README.md`, `README.ru.md`, `docs/REFACTOR_PLAN.md`, `docs/artwork.md`,
    `docs/tg-preview.md`, `.claude/README.md` (batch-size section),
    `.claude/prompts/{orchestrate,plan,add-source}.prompt.md`,
    `.claude/templates/context.template.md`,
    `.claude/skills/small-fix/SKILL.md`, `issues/47/plan.md`,
    `issues/47/handoff.md`.
- Steps:
  1. Preflight: `npm run format:check` (~11 s means the gates fit; ~55 s
     means wait); `git log --oneline -3`; `git status --short` (expect
     ` M issues/47/context.md` and the two foreign untracked directories;
     stage by path, never `git add -A`); no `chrome.exe`; `npm run build`;
     read `tools/check-site.mjs` and write its by-name references into this
     file's "Verification" (acceptance 9).
  2. C0: the orchestrator dispatches the sweep per `plan.md`, "The sweep";
     it writes `issues/47/sweep.md` and nothing else. The implementer then
     homes every non-`same` row (acceptance 5-8) and commits C0 together
     with the pending `context.md` edit.
  3. C1: the deletions and re-points (acceptance 10-20), one commit, the
     recovery paragraph from `plan.md` in its message; `npm run check`;
     `node tests/run-all.js contracts,craft,dataint,derived,stub`; four
     golden shards, compare mode.
  4. C2: the surviving instruments (acceptance 21-27); `npm run check`;
     `npm run check:built`; `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`;
     `node tests/app/sweep.js 360`.
  5. C3: `ci.yml` (acceptance 28-31); `npm run check`.
  6. C4: the documents (acceptance 32-40); the acceptance grep; `npm run
     check`; the closeout (acceptance 41-45); push; read CI; by-hand
     `check-site.mjs`; `/handoff` compaction if any task document passes
     150 KB.
  7. Inherited items (acceptance 46-56) are closed in whichever commit their
     line names; the closing record here says what happened to each.
- Acceptance criteria (each observable; "Met" needs the evidence named):
  1. `issues/47/sweep.md` exists with a header naming the sha it read at,
     the date and the runner; sections A-F; every row's verdict is one of
     `same` / `differs` / `absent` / `n.a.`; every `n.a.` cites a
     `FEATURES.md` bullet, `DEBT.md` entry or `COVERAGE.md` drop reason;
     a counts line per part and in total.
  2. Part A is complete: the grep in `plan.md`, "The sweep", Part A, run
     over `app.js` at the recorded sha, yields **216** lines (at `a6b4a94`)
     and every one of those line numbers appears in a Part A row's `where`
     column - checked by diffing the two lists, not by reading.
  3. Part C accounts for all **83** `style.css` lines its grep matches; Part
     D has a row for each of the **29** `data-act` names and the **14**
     `addEventListener` registrations, and names the surviving instrument
     (a `tests/app/states.js` case, a golden state, a component test) or
     `none` for each.
  4. Part E has a row for each of the **42** `SPECS` entries and for every
     `ok(` call in `tests/craft.js` sections 2-5 and in `tests/{audit2,
     contracts (browser half),hues,states,typo}.js`; Part B carries the
     three counts (live keys absent, plain values differing, HTML values
     listed for rendered comparison); Part F covers `index.html:40-81`
     including `<html lang>` on a language switch.
  5. Every `differs`/`absent` row has a home written **in C0's commit**:
     class (a) a `docs/specs/DEBT.md` section-3 entry (`D12+`, six fields,
     "Why it was recorded, not restored: owner ruling 2026-09-16", the live
     code quoted with `git show <sha>:app.js` / `:style.css` / `:index.html`
     and its line); class (b) a `docs/specs/COVERAGE.md` "Known thin spots"
     bullet; class (c) a line in this file's "Phase 8 opening inputs". No
     finding's only record is `sweep.md`.
  6. `docs/specs/DEBT.md` has a third section, "Divergences found at the
     deletion (R0c sweep), owed a decision at Phase 8", even if empty (then
     one sentence saying the sweep found nothing of class (a), with the row
     counts), and its header no longer names `VISUAL_DEBT`, `ACCEPTED`,
     `tests/parity/specs.js` or `docs/parity.md` as living things.
  7. C0's `git diff --stat -- app/src tests tools` is empty.
  8. The sweep ran a legacy suite or opened a page only to settle a single
     row, never `npm run check`, a parity filter or a golden shard; the
     `sweep.md` header says which, if any, were run.
  9. `tools/check-site.mjs`'s by-name references are listed in
     "Verification" from the file (not from `plan.md`, fact 11), and
     acceptance 30's guard list is checked against them.
  10. After C1, `git ls-files` returns nothing for each of the 24 deleted
      paths (the list under "Files expected", C1), and `tests/parity/` and
      `tools/parity-ubuntu/` do not exist.
  11. `tests/contracts.js` keeps the list-encoding pure half (every
      `docs/fixtures/lists/*.json`, including `equipment-entry.json`) and
      the docs-name check, requires neither puppeteer nor `./lib.js`, runs
      green under `node tests/contracts.js`, and keeps its `run-all.js` row.
  12. `tests/craft.js` keeps sections 1 and 6 only, requires no jsdom, runs
      green; `COVERAGE.md`'s `craft` row (C4) names where each section 2-5
      assertion went, per sweep Part E.
  13. `tests/i18n.js` is deleted; `package.json`'s `check` no longer runs
      it; `run-all.js` has no `i18n` row; `I18N.md` (C4) says key parity is
      a compile error in `app/src/lib/dict.ts` (`Dict`).
  14. `tests/derived.js`: `noindex` asserted on `app/index.html` only; the
      head-to-head loop and the `>= 20` floor are gone (N2); `headFacts`
      scans `<head>` only (N8); the absolute og facts and the icon are still
      asserted on `app/index.html`; `COUNTERS`' file list drops `index.html`
      and `app.js`; the `tierBand`/`srcWond` guard reads every
      `app/src/lib/*.ts`; the die check parses `app/src/lib/dice.ts`'s
      `DIE_ART` (`viewBox`, `body`, `faces`) for all six dice against
      `card/die-dN-bw.svg` and was **proven to fail** by a scratch edit of
      one path (recorded here); the footer citation reads `dict.ts`'s
      `footBefore`+`footLink`+`footAfter` for `ru` and `en`;
      `dice.ts:8-10`'s comment is now true.
  15. `tests/run-all.js`'s `SUITES` has exactly fifteen rows (`app/sweep` x4,
      `app/golden` x4, `app/print`, `app/contracts`, `app/states`,
      `app/typo`, `app/hues`, `contracts`, `dataint`, `derived`, `craft`,
      `stub`); its header comment no longer names parity or the live app;
      `node tests/run-all.js nosuch` exits 1.
  16. `.claude/hooks/bash-guard.mjs` has no `parityLock` import, no
      `MSG.parityLock`, no `parity` `LONG_CHECKS` family and no rule 2h;
      rule 2g (a backgrounded `npm run check`) is untouched; `selftest.mjs`
      is green with #76-#91, the lock-module import, #72's two parity lines
      and #43 removed (numbering gaps allowed); `edit-followup.mjs` has no
      `remind:baseline` group and its `remind:data` message names
      `tests/derived.js`'s `COUNTERS` list instead of enumerating files;
      `.claude/README.md`'s hook-table rows for both hooks, the "One heavy
      run at a time" paragraph and the two limitation bullets are updated,
      and decisions-table rows 11, 15 and 28 are annotated "retired at R0c
      `<C1 sha>`" rather than deleted.
  17. `tests/app/inventory.js`: the self-retiring guard and its header
      sentences are gone; the `timed` flag is explained in the header in at
      most twelve lines (from `docs/parity.md`'s "Timed states" / "Two
      unstable classes"); the seven `docs/parity.md, 'Timed states'`
      comments point at that header.
  18. `tests/app/driver.js`: `TARGETS` has only `next`; the header describes
      the driver as `tests/app/`'s, not parity's; no comment in the file
      speaks of "both apps" or `ACCEPTED` in the present tense.
  19. C1's commit message carries the recovery paragraph from `plan.md`,
      "The batch", verbatim apart from the sha.
  20. After C1: `set -o pipefail; npm run check 2>&1 | tail -n 120` exit 0
      (one foreground call, timeout 600000); `node tests/run-all.js
      contracts,craft,dataint,derived,stub` green; four golden shards
      (`node tests/app/golden.js --shard=n/4`, compare mode) read
      `без изменений`.
  21. `tests/app/print.js` runs `cardFit` (every width, the eight
      card-drawing states) and `copiedPrintLink` (`'Link to this set'`)
      in English via `fresh({ lang: 'en' })` as well as Russian; a comment
      says why `sheetCounts` and `printMedia` stay Russian-only;
      `printMedia`'s chrome loop is `ok(val && val.display === 'none', ...)`
      and a `null` read fails it (proven once by pointing one selector at
      nothing); `run-all.js`'s `app/print` weight is the new measured wall
      clock.
  22. N6: `vite.config.mts`'s `closeBundle` copies `catalog.csv`,
      `data.json` and `llms.txt` into `dist/`; `tools/smoke-file-url.mjs`
      asserts every `noscript a[href]` in `dist/index.html` resolves to a
      file under `dist/`, and was proven to fail before the copy landed;
      `npm run check:built` green; the deploy collect step's explicit list
      is unchanged (read in C3), so nothing extra is published.
  23. `tools/capture-share-fixture.mjs` drives `dist/index.html`, grips the
      two copy buttons by the accessible names `dict.ts` gives them, has a
      header saying the fixture is the rewrite's own golden last matched
      against the live app at `cf96e6f`; **its first run produces zero
      diff** (`git diff --stat docs/fixtures/share/records.json` empty),
      recorded as sweep Part E's row (iv). A non-empty diff is a
      stop-and-raise, not a regeneration.
  24. `.prettierignore` no longer lists `app.js`, `style.css`, `index.html`
      or their comment; `eslint.config.mjs` no longer lists `'app.js'` and
      its comment says what the `tests/`/`tools/` ignores mean now;
      `npm run check` green.
  25. Every hit of acceptance-grep 1 (`plan.md`, "The acceptance grep,
      defined") under `app/src/**`, `tests/**`, `tools/**`,
      `app/vitest-setup.ts` is re-pointed (to a `FEATURES.md` bullet, a
      `COVERAGE.md` row, `tests/app/<x>.js`, or `git show <C1 sha>^:<path>`)
      or deleted; lines of the form "Ported from tests/<x>.js" /
      "transposed from" / "lifted from" may stay.
  26. `tests/app/golden.js`'s and `tests/app/lib.js`'s headers describe the
      goldens and the suites on their own terms (no "this is not parity in
      miniature" framing that needs parity to exist to be read).
  27. After C2: `npm run check` and `npm run check:built` exit 0;
      `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`
      green; `node tests/app/sweep.js 360` green; golden shards re-run only
      if anything but comments changed under `app/src` or in
      `inventory.js` - and if run, `без изменений`.
  28. `ci.yml`: the `parity` job is gone; the `check` job's step runs
      `node tests/run-all.js --exclude=app/golden` under a name that does
      not say "legacy" or "live app"; `deploy.needs` is
      `[check, audit, secrets, golden]`; `tests/derived.js:522-532` still
      passes.
  29. The deploy comment block says what is published, that a bad deploy of
      the rewrite is fixed by `git revert` of the offending commit, and that
      the old app is restorable only from history (`git show <C1 sha>^ --
      index.html app.js style.css`) as a batch, not a command.
  30. The guard (N3, N5): greps `src="\.?/?app\.js"` (the regex
      `check-site.mjs` uses); `cmp dist/index.html _site/index.html` and
      `cmp dist/assets/app.js _site/assets/app.js`; `og/_share.jpg`,
      `img/_none.webp`, `card/die-d12-bw.svg` and `i/w1.html` required
      non-empty by name; `_site/data.js`'s first line starts `window.LOOT`;
      the "must not be published" loop keeps `app.js style.css` with a
      comment saying a stray root file must never reach `_site`. A reviewer
      can tick every static check `check-site.mjs` makes (acceptance 9)
      against a guard line.
  31. C3 is one file; `npm run check` green after it.
  32. `CLAUDE.md`: no "Migration and parity" section; "Project shape" says
      the static root was deleted at R0c and how to read it from history;
      "Quality gates" lists the surviving `tests/app` suites and says
      `app/sweep` and `app/golden` are not one foreground call; the spec
      table has no `docs/parity.md` row; the counts sentence names
      `tests/derived.js`'s `COUNTERS` list rather than enumerating files;
      the batch-size cite points at `.claude/README.md`, "Batch size and the
      fixed cost of a run"; one line under "Task and session protocol"
      carries the placement rule (a placed item is its own acceptance line
      in the batch that receives it; a batch is not closed while an
      inherited line has no outcome); one line carries the golden/DEBT rule
      (a new state gets an `inventory.js` entry and a re-seeded golden in
      the same change; a defect kept on purpose gets a `DEBT.md` entry in
      the same change); `wc -l CLAUDE.md` <= 170.
  33. `docs/specs/COVERAGE.md`: the intro's counts re-derived by listing
      `tests/*.js` and `tests/app/*.js`; the old-app suite table kept as a
      record under a heading naming `<C1 sha>`; "Features to suites"
      re-pointed to surviving homes; "The rewrite against the app it
      replaces" and "The look" replaced by at most twenty lines of history
      and pointers (`30b2744`, `DEBT.md`, the goldens, how to resurrect the
      harness from history); "What is enforced" edited; "Known thin spots"
      loses the `tests/parity.js` bullets, gains the sweep's class-(b)
      findings; the `craft`, `contracts`, `i18n`, `derived` and `parity`
      rows updated; the one resolving sentence for `app.js:N` citations is
      in the history paragraph.
  34. `docs/specs/DEBT.md`'s header carries the resolving sentence ("the
      live sources were deleted at R0c (`<C1 sha>`); `git show <C1
      sha>^:app.js` reads them at their final state; a line citation with no
      other hash refers to that state"), and one existing citation was
      verified before commit: `git show bb61db0:app.js` around lines
      3589-3603 matches D2's quote (the command and result recorded here).
  35. `FEATURES.md` (seven lines), `META.md` (sections 1 and 4),
      `ROUTES.md:7`, `STATE.md:62`, `I18N.md:8-11`, `CONTRACTS.md:11` point
      at `app/src/...` (or `tests/contracts.js`'s pure half) as the
      implementation, and "the live app" appears only in past tense or as a
      `DEBT.md` cross-reference.
  36. `README.md` and `README.ru.md`: "Running and developing" says the
      site is the built rewrite (`npm run build`, `file://` still works),
      the tree listing has no root code files and lists `app/`, the `tests/`
      line's count is re-derived, the suites table lists the surviving
      suites and `tests/app/*`, the licence line reads `app/`, `tools/`,
      `tests/`; both READMEs say the same; `tests/derived.js`'s counts and
      licence-cite checks pass.
  37. `llms.txt` and `robots.txt` were re-read; the read is recorded here
      with "no change" or the change made.
  38. `docs/REFACTOR_PLAN.md` says the migration closed at R0c (`<C4 sha>`,
      date) and points at `DEBT.md`, `COVERAGE.md` and "the Phase 8 issue";
      `docs/artwork.md:162` and `docs/tg-preview.md:551` re-pointed.
  39. `.claude/README.md` gains "Batch size and the fixed cost of a run"
      (the parity rows replaced by `run-all app/*`, the golden shards and
      `sweep` per width); `.claude/prompts/orchestrate.prompt.md`'s cost
      table, `plan.prompt.md:82`, `add-source.prompt.md:39,84,158`,
      `.claude/templates/context.template.md:34-39` and
      `.claude/skills/small-fix/SKILL.md` steps 1 and 5 (the gate becomes
      `check`, `check:built`, the golden shard(s) whose states render the
      touched component, `--update` only when the change is intended) no
      longer name a deleted path.
  40. Acceptance-grep 1 and 2 (`plan.md`, "The acceptance grep, defined")
      return only the allowed residue; their output is pasted under
      "Verification".
  41. Pushed; the CI run is green in `check`, `golden (1..4)`, `audit`,
      `secrets`, `deploy`, and its `check-site.mjs` step passed; run id, job
      wall clocks and the guard's `published:` listing recorded here, with
      one sentence on what the run proves less than the runs before it.
  42. `node tools/check-site.mjs https://artex-x.github.io/daggerheart-loot/`
      run by hand after the deploy: `сайт опубликован верно`, recorded.
  43. `plan.md`: "What 'task 47 is done' means" points 1-6 each carry their
      evidence; Phases table row 7 reads done; `plan.md` line 8 already
      corrected by the planner (verify it still reads "closes at R0c").
  44. `handoff.md`: Status `done` with the date; a "Phase 8 opening inputs"
      section (the register with its entry count, the goldens, the backlog,
      `context.md`'s open-items list, the sweep's class-(c) lines, the
      Playwright decision plus the lost heavy-run lock, the recommendation to
      keep `issues/47/`); "Deferred" ends with no item whose only record is
      this file; the four "closes by deletion at R0c" items from
      `context.md`, "What Phase 8 inherits" are recorded closed.
  45. `/handoff` compaction run if any of the three task documents passes
      150 KB after the closeout; sizes recorded.
  46. Inherited - **`golden` in `deploy.needs`** (R0a, 2026-09-13): closed
      by peer `99bbb7c`, verified by reading `ci.yml` and
      `tests/derived.js:522-532`; recorded as done-by-peer.
  47. Inherited - **`parity` out of `deploy.needs`**: closed by peer
      `8dae1b9`; the job itself deleted by acceptance 28.
  48. Inherited - **`tests/parity/lock.js` and its two hook dependents**
      (planner, 2026-09-16): deleted, not re-homed (acceptance 16); the
      lost collision guard named in the Phase 8 inputs (acceptance 44).
  49. Inherited - **the print specs narrowed to one language** (R0b.3
      review): closed by the English pass (acceptance 21).
  50. Inherited - **`printMedia`'s null-passes-green chrome loop** (R0b.3
      review): closed (acceptance 21).
  51. Inherited - **B13 nits N2 and N8** (`tests/derived.js`): N2 closed by
      deletion of the head-to-head, N8 by the `<head>` slice (acceptance 14).
  52. Inherited - **B13 nits N3, N5, N6**: N3 and N5 by acceptance 30, N6 by
      acceptance 22.
  53. Inherited - **`readPNG` retires with `tests/lib.js`** (R0b.1): closed
      by acceptance 10 (`tests/app/print.js` inlined it in R0b.3).
  54. Inherited - **`COVERAGE.md`'s suite count moves**: closed by
      acceptance 33's re-derived counts.
  55. Inherited - **`plan.md` line 8 correction** ("What 'task 47 is done'
      means"): done by the planner in this pass; acceptance 43 verifies.
  56. Inherited - **the second read of `check-site.mjs`**: acceptance 9.
- Verification commands (each one foreground call, in this order per
  commit; costs from `context.md`, "Command costs"):
  - probe: `npm run format:check` (~11 s healthy).
  - `npm run build` (before any `tests/app/` run; `npm run check` never builds).
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - Bash timeout
    600000; ~147-165 s idle. Once per commit whose tree differs from the
    last armed key (a `.md`-only commit needs none).
  - C1: `node tests/run-all.js contracts,craft,dataint,derived,stub`;
    `node tests/app/golden.js --shard=1/4` .. `4/4` (compare; ~250 s each).
  - C2: `npm run check:built` (a few minutes);
    `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`
    (~260 s pooled); `node tests/app/sweep.js 360` (~337 s; not `run-all
    app/sweep`, which is 593.5 s and past the cap).
  - C4: the two acceptance greps; then push, `gh run view <id>`, and
    `node tools/check-site.mjs https://artex-x.github.io/daggerheart-loot/`.
  - Never: `node tests/parity.js` (deleted after C1); a backgrounded check;
    two heavy runs at once.
- Risks / do-nots:
  - A finding is homed, never fixed; `app/src` changes are comments only;
    a moved golden in C1/C2 is this batch's mistake - find it, never
    `--update`.
  - A non-empty share-fixture diff on the tool's first `dist/` run is a
    divergence: record it (home (a)) and leave the fixture.
  - Do not delete `tests/contracts.js` or `tests/craft.js` whole; do not
    rename `tests/contracts.js`.
  - Do not touch `deploy.needs` (already right) or the collect step's list.
  - Do not renumber `selftest.mjs` cases; do not widen a hook to make a
    delete convenient.
  - `derived.js`'s die check failing on real data is a shipped-art defect:
    stop and raise, do not loosen the check.
  - The first CI run after R0c proves less than the runs before it (no
    parity); read the job list before calling it green.
  - Stage by path; `issues/56/` and `work/` are not this task's; commit the
    orchestrator's pending `context.md` edit with C0, unchanged.
- Fallback: if the sweep cannot finish Parts A-F in one dispatch, split it
  A+B+F / C+D / E and merge under one header - the pre-committed row counts
  (216 / 83 / 29+14 / 42) make a partial merge visible. If `npm run check`
  crosses the 600 s cap, the host is throttled: wait for the probe to read
  ~11 s and re-run; never salvage a backgrounded run.

## Phase 8 opening inputs (started at C0; C4 completes the rest)

C0 writes the sweep's class-(c) findings here - "anything else": a refactor
observation, a doubt about whether *live* was right, a harness-ergonomics
note, or a C2 implementation note. Full detail: `issues/47/sweep.md`, read at
`7a33c22`. C4 folds in the rest per `plan.md`, "Closeout, and what Phase 8 is
handed": the register's final count, the goldens, the backlog, the Playwright
decision plus the lost heavy-run lock, `context.md`'s open-items list, and the
recommendation to keep `issues/47/`.

**The sweep's class-(c) findings (34 rows, three groups):**

1. **Part A's 19 rows collapse to two repeated observations, not 19 findings**
   (`sweep.md`, "Part A - attributes, links, breaks", the closing note). The
   rewrite drops the live app's `id`/`data-*` grips on nine controls (they
   existed for `restoreFocus`, `restoreOpen` and the delegated `data-act`
   dispatcher, none of which the rewrite has - the money-picker input, the
   new-list input, the number field, the two "keep one" chips' `data-last`,
   the tables/search-page search inputs, the lists-index name/import inputs,
   the list-rename input, the list-row position input's `data-pos`), and it
   *adds* `aria-pressed`, `aria-current` or `aria-label` on eight controls
   where live had none (the rung step button's `aria-label`, the two
   table-nav chip trails' `aria-current`, the tables list/grid switch's
   `aria-pressed`, the print colour/black-and-white switch's `aria-pressed`,
   the tab bar's `aria-current`). Neither class loses behaviour, but both
   change what a future instrument can grip - worth knowing before Phase 8
   writes a new one.
2. **Part F's five markup-shape differences**, each a Phase 8 judgement call
   rather than a defect: the skip link's text is in the template instead of
   runtime-filled, so its old `id="skip"` grip is gone; the RU/EN language
   buttons gain `type="button"`, which live's lack; the main landmark's id
   moved from `view` to `main` (the skip link moved with it; `#view` appears
   in no spec, fixture or route grammar, so nothing else needs to know); the
   hidden selection bar is absent from the DOM rather than present-with-
   `hidden` when nothing is ticked; and the record dialog is a native
   `<dialog>` (real inertness, UA Escape handling) rather than live's
   hand-rolled `<div id="modal">` - a structural improvement, not a
   regression, but a DOM shape a future structural-golden reader should know
   changed on purpose.
3. **Part E's eight rows are two small groups.** Four dictionary keys
   (`voaRecall`, `guessPrice`, `pcTh`, `printFoot`) are dead code on *both*
   apps - no `t().key` call site in `app.js`, no reader in `dict.ts` either -
   so nothing is owed there. Four are `tools/capture-share-fixture.mjs`
   re-point notes for C2, already reflected in the plan and repeated here so
   they are not lost: the tool's target must move from the root `index.html`
   to `dist/index.html`; its readiness wait polls `#view` having children,
   which `dist/` never renders (`<div id="app">`, no `#view` anywhere) - **a
   naive re-point hangs rather than fails**, and `tests/app/lib.js`/
   `driver.js` already have a working readiness wait to borrow instead; its
   two grips (`[data-copy-name]`, `[data-copy-full]`) must become
   accessible-name lookups (`t.copyName`, `t.copyText`); and its first run
   after the re-point must produce a zero diff against
   `docs/fixtures/share/records.json` - a non-empty diff is a *fresh*
   divergence, not the already-known `f33` one, and is a stop-and-raise, not
   a regeneration.

## Blockers

- **CLOSED - all four of R0b.4's divergences restored and landed
  (implementer, 2026-09-16).** The owner ruled restore on all four (three via
  the orchestrator 2026-09-16, the fourth - the frame-armour tier word, found
  during R0b.1's own C3 - separately, same date); R0b.4 built and shipped all
  four (`a375b20`, `66972a0`, `cf96e6f`; full evidence for what each one was
  and why every other instrument missed it: `plan.md`, "The fourth verdict").
  Kept as a one-line record rather than deleted: **this is what closed R0b**,
  and R0c's own stop condition needed all four accounted for before deleting
  `app.js` and the ten suites that were the only place some of them were
  written down - which is now moot, since nothing is deleted yet and the
  correct behaviour lives in `app/src/` itself.

- **Every remaining entry below describes the parity harness and closes by
  deletion at R0c** (acceptance 10) - the width sweep, the Windows-vs-CI
  cell disagreement, `tools/parity-ubuntu`'s build command, and the
  language leak between states. Kept until the deletion lands, then removed
  by the closeout (acceptance 44).

- **The parity harness's width sweep is not a state, and it still needs a
  decision.** It looks at one document at 1100, 768 and 375 without
  re-arriving, and a browser moves a scrolled document on reflow to hold the
  reading position - by picking an element out of the DOM, which the two apps
  do not share. That is what the four 375 anchor cells were, measured rather
  than assumed - the `document.fonts`, `window.scrollY` and `.flash` probe
  numbers behind that finding moved to `context.md` in the 2026-09-16
  compaction (its section of measurements migrated during that pass), and the
  full B3.6 part 1 write-up is at `git show fc59ce4:issues/47/plan.md`,
  "B3.6 built, part 1". Fixing it means re-arriving
  per width, which changes how every state in the suite is measured;
  `overflow-anchor: none` on both sides was tried and shuffles the figures
  without removing them. It is also why B4 added no equipment anchor state
  (see "Deferred").

- **A local Windows run fails cells that CI passes, by design.** Owner
  decision 1 makes ubuntu authoritative; a development host disagrees with the
  table on a handful of cells, and a full local run reports them as improved
  and fails them. Written into `docs/parity.md`, "Machine variance". **Do not
  edit a recorded number off a local run.** `tools/parity-ubuntu/` reproduces
  CI to the hundredth on layout states and **not** on timed ones - it reported
  a fading toast as 0.00%, which looks exactly like a defect that got fixed.

- **`tools/parity-ubuntu`'s documented build command does not work as
  committed.** `docker build -t dh-parity:ubuntu24 tools/parity-ubuntu` fails
  on `COPY package.json package-lock.json ./`: that build context holds
  neither file, they are at the repository root. Copying both in (untracked)
  lets the image build cleanly. The real fix - a Dockerfile that copies from a
  repo-root build context, which changes the README's own command - has never
  been attempted. Separately, once the image did build, `docker run --rm -v
  "$PWD:/work:ro" ...` did not finish copying `/work` into `/app` inside a 60s
  wait on this host and was killed rather than pursued; possibly
  Windows/Docker-Desktop volume-mount performance on a repository this size
  (`img/`, `og/`, 1061 share pages), not diagnosed further.

- **Language leaks between states through `localStorage`.** `file://` is one
  origin, so a state that ran at `en` can leave the next state's `@ ru`
  screenshots in English. Both apps read the same storage so no verdict is
  wrong, but a person reading a `_ru_` screenshot will find English in it.
  Noted, not fixed.

- **Resolved blockers, kept only as one line each so nobody re-opens them.**
  The untracked third-party skill install that reddened `npm run check` is
  gone as of `37e4812` and the baseline is green (42 files / 1035 tests,
  96.61/88.58/97.10/97.34, 95.64s). The 2026-09-11 and 2026-09-12 host blocks
  both lifted on their own and every gate then ran green. B8's, B9's, B10's
  and B12.1's "committed but CI has not read them" entries are all satisfied:
  `8b0c3ce`, `60047d4` and `84ca6df` are ancestors of the pushed `main` and
  later runs (`34640328352`, `34718569245`, `34753801089`, `34755188652`) read
  heads above them green in every job. B7's print-parity break was
  `transition-duration: 0.01ms`; B5.3's `~ notice unfolded @ en` and B5.4a's
  inert grip were fixed in their own remediation passes; B5.2 part 0 closed
  the five CI-red `#/i/ci1` cells and gave both unstable classes a mechanism
  (`timed: true` per-width re-arrival, and a whole-page capture that waits for
  two consecutive agreeing shots plus a `geometry` probe); B9 drew the
  rewrite's anchor flash and deleted all seven anchor debt entries. The
  reasoning behind each decision, and the alternatives rejected on the way,
  is in `docs/parity.md`, "Two unstable classes" / "Machine variance", with
  the batch's outcome row under `plan.md`'s "Phase 4's batches, as built" -
  and, for the full argument that `plan.md`'s own compaction dropped, at
  `git show fc59ce4:issues/47/plan.md`.

## Deferred

Open items only. An item placed in a batch becomes one of that batch's
acceptance criteria and the batch cannot be recorded closed while an inherited
line has no outcome - `plan.md`, "A placement has to be acceptance, not a
footnote". Closed placements are not repeated here: the case-7 flake and R0a's
four review nits were R0b.1's acceptance lines 5-9 and are all `Met`; B14's
six review nits and blocker B1 were R0a's lines 11-16 and are all closed; B12's
nits 1 and 2b were closed by B14 C3 (`a7f8787`), proven by renaming an
expectation and watching both languages go red; B12.1's nits 1, 3, 4 and 5 and
B13's N1, N4 and N7 were closed by B14 (`af7fa17`, `a7f8787`); B11's and
B11.1's nits were closed by B11.1 and B12.

- **CLOSED - R0b.1's remaining five nits, all taken by R0b.4 (implementer,
  2026-09-16).** Nit 6 was R0b.2's (`37a1061`); nits 1-5 cleared in R0b.4 C4
  (`95fa624`) except nit 2, which was reworded rather than fixed (it is a
  literal gap in what a prior line asserted, corrected in the same commit by
  adding the missing assertion): `TablesPage.svelte`'s stale `tests/parity/
  driver.js` comment corrected; `tables.test.ts`'s reset-from-the-strip test
  now also asserts the address clears; `data.test.ts`'s vacuous self-lookup
  loop removed; `tests/app/lib.js`'s self-referential comment reworded. **C4's
  own fix was incomplete and review remediation finished it**: C4 dropped
  the stale "five" from the file's opening paragraph but missed a second
  "five" fourteen lines down (`tests/app/lib.js`, the missing-`dist/` guard's
  own comment) - fixed to "seven" in the remediation commit. Nit 5 (this
  file's own narration duplication) is addressed by this very closing pass
  replacing the
  duplication with pointers.

- **CLOSED - all four R0b.4 divergences restored (implementer, 2026-09-16).**
  See "Blockers" and "Completed" for the commits and full evidence.

- **CLOSED - five of R0b.3's six review nits, taken by R0b.4 (implementer,
  2026-09-16).** `tests/app/print.js` gained a `pageerror` listener and a
  closing assertion; `printMedia`'s `main` property list gained `width` with
  a measured `1165px` assertion; the "Высокородное"/"Великородное" comment
  now names the record's real community; `run-all.js`'s `app/print` weight
  moved to 132 (measured this batch); `COVERAGE.md`'s `app/golden` row's
  stale "110 states" corrected to 105. **Left deferred, with a reason**: the
  `a.style.display === '' || a.style.display === 'none'` check
  (`tests/app/print.js`, the `.pc-art` loop) is tautological given
  `PrintCard.svelte`'s own implementation - it only ever writes one of those
  two values to that property, so the check cannot fail regardless of
  whether the art-hiding *decision* was correct for that card. A real fix
  would correlate each card's own `--pcpad` floor (read a few lines above,
  in `box2`) against its own `.pc-art` display, across both colour modes and
  all three `WIDTHS` - more than a local one-line fix, and a wrong
  correlation (the two arrays are read by different selectors and are not
  guaranteed aligned 1:1 in every state) risks a flaky or actively wrong
  assertion. Left for whoever next touches `tests/app/print.js`'s fitting
  assertions.

- **PLACED for R0c -> acceptance lines 49 (the English pass) and 50 (the
  `printMedia` null): the ported print specs narrowed from two languages to one,
  and R0c is where that becomes a real loss (reviewer via orchestrator,
  2026-09-16).** Decided by the planner 2026-09-16: add the English pass, do
  not accept the narrowing (`plan.md`, "R0c designed", "Decisions"). `tests/parity/specs.js` ran `sheetCounts`, `cardFit`,
  `printMedia` and `copiedPrintLink` at **`ru` and `en`** - `arrive()` presses
  EN - and `copiedPrintLink` gripped the button through `NAME[lang].printLink`.
  R0b.3's ported forms run **Russian only**, gripping `d.click('Ссылка на
  набор')`. **Print fitting is text-length dependent** - it is the one surface
  where a language changes the geometry - so after R0c an English-only fit
  regression would be measured nowhere. The structural goldens cannot stand in:
  every print `<img>` in `PrintCard.svelte` is `alt=""` (`:153,161,167,186,202,
  251`), so a hidden `.pc-art` is invisible to `page.accessibility.snapshot()`,
  and the goldens never read inline styles. **Nothing is lost yet** - the
  legacy specs still run both languages until R0c deletes them, which is why
  this is R0c's decision and not R0b.4's: it is outside every path R0b.4 opens
  (`.claude/prompts/orchestrate.prompt.md`, "Nits: defer mid-plan, clear on the
  terminal batch"). R0c's step list needs the choice made, not rediscovered:
  give `tests/app/print.js` an English pass over at least `cardFit` and
  `copiedPrintLink` before the deletion, or accept the narrowing with a
  recorded reason in `COVERAGE.md`'s thin spots.
  A second, smaller one from the same review: `printMedia`'s chrome loop is
  `ok(!val || val.display === 'none', ...)` and `d.computed()` returns `null`
  for no match (`tests/app/driver.js:660-679`, whose own comment says null
  exists to "fail loudly rather than silently compare nothing to nothing"). As
  a parity spec a `null` against a real value was a diff; standalone, a renamed
  or deleted `.printbar`/`a.skip`/`header`/`nav`/`footer` now passes green.

- **PLACED for R0c -> acceptance lines 48 (delete, not re-home), 53
  (`readPNG`), 54 (the suite count): `tests/parity/lock.js` is a live hook
  dependency R0c's outline does not name (planner, 2026-09-16).** It is imported by
  `tests/parity.js:33`, **`.claude/hooks/bash-guard.mjs:31`** and
  **`.claude/hooks/selftest.mjs:769`**, while R0c's outline deletes
  `tests/parity/` whole naming only `specs.js` and `driver.js` - so the
  directory delete takes two hooks with it. **Deliberately not moved in R0b**:
  after R0c nothing writes `test-output/parity.lock` (only `parity.js` does),
  so the mechanism is dead and re-homing it now is work R0c would undo. R0c's
  step list needs the decision, not a rediscovery: delete the module with its
  `bash-guard.mjs` parity-lock rule and its `selftest.mjs` case, or re-home it
  if heavy-run locking is still wanted for `run-all`/`golden`.
  Two smaller R0c inheritances from the same pass: `readPNG` (`tests/lib.js:36`,
  one consumer) retires with `tests/lib.js` once R0b.3 inlines it; and
  `COVERAGE.md`'s suite count moves as R0b.2 and R0b.3 each add a suite.

- **CLOSED BY A PEER, recorded by R0c acceptance line 46: `golden` must join
  `deploy`'s `needs:` list (implementer, 2026-09-13).** Done by issue 59's
  `99bbb7c` ("ci: gate Pages on structural goldens") and pinned by
  `tests/derived.js:522-532`; issue 56's `8dae1b9` then removed `parity`
  from `needs:` (acceptance 47). Both verified by the planner reading
  `ci.yml` at `a6b4a94`, 2026-09-16. The rest of this entry is history: R0a gave the structural goldens their own four-shard CI job
  (`ci.yml`, `golden`, mirroring `parity`), but `deploy`'s `needs:` -
  `[check, audit, secrets, parity]` - is untouched, on the coordinator's own
  instruction: B13 fenced `deploy` off while `git revert 9177f3b` is the
  safety net, and R0c already owns that job's rewrite (N3, N5, dropping
  `parity`). Until R0c adds `golden` there, a red `golden` job does **not**
  block a publish - the same "a check quietly stops checking" class R0a exists
  to close, now open on the other side of the workflow. R0c's own step list
  needs this line, not a rediscovery.

- **PLACED for R0c -> acceptance lines 51 (N2, N8) and 52 (N3, N5, N6):
  B13's reviewer nits N2, N3, N5, N6 and N8** (reviewer, 2026-09-12; N1, N4
  and N7 were closed by B14 `a7f8787`). N2 and N8 live in
  `tests/derived.js`'s head-to-head comparison, which dies with `index.html`;
  N3, N5 and N6 are edits to `ci.yml`'s `deploy` job, which nothing may touch
  while `git revert 9177f3b` is the safety net.
     - **N2** - the `>= 20` floor in `headFacts`'s sanity check is exactly the
       current field count with zero headroom, so it really asserts "no field
       may leave both documents" while its message says the parse broke.
     - **N3** - the deploy guard greps literal `src="app.js"` while
       `check-site.mjs` uses `/src="\.?\/?app\.js"/`; the guard is the earlier
       gate and should be the stricter of the two.
     - **N5** - what the guard still cannot catch: no proof `_site/index.html`
       came from this commit's build; `img og i card` required non-empty but
       `og/_share.jpg` not by name; no check that `_site/data.js` assigns
       `window.LOOT`.
     - **N6** - the ported `<noscript>` links resolve on Pages but not from
       `dist/` over `file://`; becomes real at Phase 7.
     - **N8** - `headFacts()` scans the whole document rather than `<head>` and
       parses double-quoted attributes only; it fails closed, which is why it
       is a nit.

- **OPEN from B12.1's review - items 2 and 6** (reviewer, 2026-09-12; items 1,
  3, 4 and 5 were closed by B14, `af7fa17`). Both were outside B14's scope;
  item 2 goes to Phase 8 R1 to verify or close.
  2. `go()` and `replace()` bypass `#fallback`, so with `{:else}` gone an
     unparseable hash reaching either would render an empty content area with
     no `<h1>` rather than the old debug heading. Unreachable with today's
     callers; live's `currentRoute` fallback runs on every render and would
     catch it regardless of caller.
  6. The boot push is uncovered: in a real browser `navigate` sets
     `location.hash` -> `hashchange` -> `onChange`, so `navigations` reaches 1
     at boot with `sel.clear()`/`menuFor=''`. Harmless today (both consumers
     only do `open = null` - `SearchPage.svelte:39-44`, `TablesPage.svelte:
     100-105`) and it mirrors live's own assignment, but the row-2 unit test
     never calls `start()`, and `memoryRouter.replace` deliberately does not
     announce, so no test exercises this path.

- **OPEN from B12's review - nits 4 and 5** (reviewer, 2026-09-12). Nit 4 goes
  to **Phase 8 R1**, which rewrites `DEBT.md` entry by entry anyway; nit 5
  goes to **Phase 8 with D10**, since the wording depends on what D10's fix
  turns out to be.
  4. `docs/specs/DEBT.md` now reads D7, D10, D8, D4 in file order - D10 was
     inserted mid-sequence rather than appended, so the numbering no
     longer reads in order top to bottom.
  5. `vite.config.mts:127-131`'s exclusion comment says
     `src/ports/image.ts` "is exercised for real by states.js's copy-image
     case" - the case does drive it, but D10 establishes the path cannot
     actually complete under `file://` on either app, so the exclusion's
     warrant is thinner than the comment reads; worth tightening once
     D10 itself is picked up.
  Also fixed while in the handoff, not deferred: the plain factual slip in

- **Unscheduled, no batch yet** - each recorded once, with the reason it is
  not simply picked up. **Disposition settled 2026-09-16** (`context.md`,
  "What Phase 8 inherits, and what closed instead"): `Panel.svelte` and
  Playwright go to Phase 8 (R0c acceptance 44 writes them into the handover);
  the shared `S.kind` is `DEBT.md` D4 and the two B3.5 nits are closed; the
  equipment anchor state, the probes past tables and `.selbox:has(...)` close
  by deletion at R0c (acceptance 44); the grid-numbering bug has been in
  `FEATURES.md` since `30b2744`. The list stays as written until the closeout
  removes it:
  - **An equipment anchor parity state** (`#/tables/eq_weapon/t2`, or the
    `#/tables/eq_weapon/q1` row anchor that `#/i/q1`'s "show in table" link
    produces). It can only add 375 cells whose difference is the harness's own
    width sweep - a known, unfixed cause that would need `VISUAL_DEBT` entries
    taken from CI. The equipment-specific facts (section ids `sec-t1`-`sec-t4`,
    a `q*` row target) are pinned by component tests and the anchor mechanism
    already has two states. Revisit once the width-sweep decision lands.
  - **Extending B3.6's probes past the tables states** - `#/i/*`, `#/roll/*`
    and the equipment tables. Deliberately not attempted: a spec that starts
    reporting on every surface at once is a batch whose size nobody can
    predict.
  - **Playwright.** Still worth a decision before building anything; the
    parity harness already drives both apps in a real browser. Ask first.
  - **`Panel.svelte`** - `.ffilter` and `.tablenav`. `TableRows`/`SectionHead`
    are not `.panel` copies.
  - **The legacy grid-numbering bug** (`list.map(tileHTML)` passing the array
    index as the tile's number) - worth reporting to the repository owner,
    still deliberately not reproduced; recorded in `ACCEPTED`.
  - **The shared `S.kind`.** Batch C's.
  - **Two documentation nits from B3.5's review.** As recorded, `plan.md`'s
    "What every remaining `VISUAL_DEBT` entry is" still called the 375px
    row/section anchor debt "cause 6" and still promised a rewrite of that
    section, which landed as "B3.5 built" instead - two places describing the
    same debt with different framing. **That section is gone as of the
    2026-09-16 compaction**; its successor is `plan.md`, "What the
    `VISUAL_DEBT` entries turned out to be, and the correction that cost four
    batches". Whether the "cause 6" framing survived into it has not been
    re-checked - read it before acting, and close this nit if the compaction
    already settled it. And `docs/parity.md`'s "whole-page percentage" rule is
    a seven-line paragraph among one-line bullets, worth trimming or moving to
    its own subsection.
  - **`.selbox:has(:focus-visible)` cannot be pixel-verified** - closed into
    B4 on the reasoning that the live app has it, but no parity state reaches
    a row checkbox by keyboard and the driver has no key press. That
    instrument gap is recorded rather than invented around.

## Notes

- **Mocks path: none, for any batch so far.** Every ported surface is
  transcribed from `app.js`/`style.css` line by line (the line-by-line
  references were in `plan.md`'s per-batch planning briefs, which its
  2026-09-16 compaction dropped - they are at
  `git show fc59ce4:issues/47/plan.md`, "B<n> planned") and measured in
  headless Chrome; the live app at the state
  in question is the mock. The probe scripts lived in session scratchpads and
  were not kept; their numbers are in `context.md` under each batch's
  "planning facts".

- **Screenshot findings**: two screenshots of `#/tables/community` at ~1100px,
  from the human, 2026-09-09. (1) the search box "is using a different font" -
  confirmed, 14px against 15.5px. (2) the `любое` hint "is too close to the
  main text" - confirmed, the separating space was missing from the DOM and
  the `<i>` started 4.3px left of where the live app puts it. A third defect
  found while confirming those two (`.selbox`'s missing mobile override) makes
  three, **all fixed in B3.5**. The original measurements are in `context.md`;
  the real post-fix numbers did not survive `plan.md`'s 2026-09-16 compaction
  and are at `git show fc59ce4:issues/47/plan.md`, "B3.5 built" - do not
  re-take either.

- **What not to start yet**, carried forward and still true:
  - Do not start Playwright. Ask first.
  - Do not translate the legacy Russian comments in `app.js`/`style.css`.
  - Do not chase the help-panel debt without opening the diff image first.
    (The old companion instruction about the search-placeholder and
    description-reflow debts is **resolved rather than superseded**: both were
    B3.5's own defects, and B3.5 fixed and deleted them.)
  - Do not assume a red local `node tests/run-all.js parity` means whatever
    batch is running broke something: since B3.6 part 1 the table follows CI,
    so a Windows run fails a handful of cells by design - see "Blockers".

- **Session gotchas**, standing and still true - B5.1's own first, then
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
    guessed, in B3.5 - see `git show fc59ce4:issues/47/plan.md`, "B3.5 built"
    (that section did not survive `plan.md`'s own compaction). Distinct from the
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

- **Deferred, decided by the owner (B3.6/B4 session, 2026-09-09):**
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

- **Session end partial progress: none.** R0b.1 closed at a committed, pushed
  boundary (`a2429bd` plus the review-remediation commit); no half-batch, no
  uncommitted production code, no run left in flight.

## Cleanup performed / retained artifacts

Merged from the three per-cycle sections this file used to carry (R0a
2026-09-13, R0b planning 2026-09-16, R0b.1 2026-09-16). Current state:

- **The last pre-collapse commit is `fc59ce4`** ("docs(issue-47): record
  R0b.1 closeout cleanup"). Git history holds this file's full
  pre-compaction text - every superseded status snapshot, every shipped
  batch's design brief, every resolved blocker's full narrative - at that
  commit and before it. Nothing summarised here was deleted anywhere else.
- **Removed: nothing from the repository**, in any of the three cycles. No
  scratch file was created by R0b.1 at all: `git status` reported a clean tree
  at kickoff, after each of its four commits, after the review, after the
  remediation commit and at closeout.
- **Retained, deliberately, and none of it this task's to touch:**
  `issues/tg-preview-refresh/` (a different task's untracked directory, never
  staged). `app/coverage/` is regenerated by every `npm run check` and is
  git-ignored. `test-output/` is absent - no parity run was made, and the
  driver-move proof wipes and releases its own lock. The untracked `.agents/`
  and `.claude/skills/impeccable/` install that was retained at the R0b
  planning pass - because deleting it would have turned a visible blocker into
  a silent one and destroyed another session's install - is gone as of
  `37e4812`, removed by whoever installed it.
- **Every commit staged by path; `git add -A` was never used.** Peer sessions
  own most of what appears in this tree.
- **The task directory is NOT retired**, and R0b/R0c must not retire it.
  `CLAUDE.md` names issue 47 as the live migration backlog by instruction, and
  R0b.2, R0b.3, R0b.4 and R0c all remain. `plan.md` stays, so the retirement
  sweep `bash-guard.mjs` gates on is not due.
- **The 2026-09-16 compaction, and the citation sweep it did force**
  (orchestrator). All three documents were compacted in one commit per
  `.claude/skills/handoff/SKILL.md`: `plan.md` 1031 KB -> 117 KB,
  `handoff.md` 556 KB -> 76 KB, `context.md` 243 KB -> 65 KB, all three from
  over the 300 KB collapse line to under the 150 KB warning line. Collapsing
  `plan.md`'s per-batch headings broke every citation that named one, so a
  sweep was run over `issues/47/*.md`, `docs/` and `.claude/`: citations whose
  fact survived were re-pointed at the surviving heading, citations whose fact
  moved to `context.md` were re-pointed there, and the rest now name
  `git show fc59ce4:issues/47/plan.md` with the old heading, which is honest
  and re-derivable. One tracked file outside the task directory was repaired
  the same way - `docs/parity.md`'s batch-splitting rule cited "B5 remainder
  planned" and now cites "The batches, and why three rather than one", a
  current and better worked example. A scripted re-check found no dangling
  heading citation left.
- **One thing withdrawn rather than deleted:** the `spawn_task` chip
  `task_62e359c8` ("Fix share.ts frame-armour tier text divergence") was
  withdrawn *after* the finding it carried was written into `plan.md` ("The
  fourth verdict", item 4), the R0b.4 batch row, `docs/specs/COVERAGE.md`'s
  `flows` row and a note in `tools/capture-share-fixture.mjs`. The chip was
  session state; the records that replaced it are not. Order mattered: record
  first, withdraw second.
- **The one incident worth carrying forward** (R0a): an implementer's
  backgrounded `npm run check` armed no commit gate - 937s spent for nothing -
  the orchestrator started its own foreground check to supply one, that
  crossed the 600s cap and was backgrounded too, and for roughly ninety
  seconds two vitest coverage passes ran on one tree. Both were stopped, the
  tree was unharmed, and the run after the residue cleared was `EXIT=0` in
  **147s**. The rule that would have prevented it is the one already written
  down: a check is run in the foreground, in one call, beside nothing else.
