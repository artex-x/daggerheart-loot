# Handoff - TASK 47

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/context.md`, then `issues/47/plan.md`, then this file. Nothing here
depends on chat history.

## Status

- Task status: **in_progress. R0a is CLOSED; R0b.1 is CLOSED and pushed,
  including one review-remediation commit; R0b.2 is CLOSED and pushed, all 20
  acceptance lines Met, no fifth divergence found; R0b.3 is CLOSED and
  pushed, all 13 acceptance lines Met, no fifth divergence found, including
  one review-remediation commit; R0b.4 is next - an ordinary queued batch,
  entry condition now met (R0b.1..R0b.3 all landed), FOUR divergences, not
  three - a fourth surfaced during R0b.1's own C3, was folded in, and the
  owner has answered it** (implementer, 2026-09-16 for R0b.2 and R0b.3; item
  4 answered by the owner via the orchestrator, 2026-09-16; the four briefs
  written by the planner, 2026-09-16).
  Last agent: implementer (R0b.3 remediation). **NEEDS_HUMAN_CONFIRMATION:
  no** for the whole of R0b - R0b.2 and R0b.3 are done, R0b.4 has every
  answer it needs. The one owner gate still outstanding in TASK 47 is R0c's
  go (Phase 7 condition 6). Branch `main`, pushed at `00eb465` (R0b.3's three
  build commits `1bb27b7`/`67c47a2`/`1aa8720` on top of R0b.2's close-out
  `98ddf52`, its own close-out `c625691`, then one remediation commit
  `00eb465` after a fix-then-continue review found two blockers in the
  batch's own art-rung finding - see "R0b.3 remediation" under
  "Verification"). R0b.3's full record: "Completed", below, and "R0b.3's own
  commands and results" plus "R0b.3 remediation" under "Verification". R0b.2's
  full record stays at `git show 98ddf52:issues/47/handoff.md`, "R0b.2's own
  commands and results" (moved out of this file per "Verification"'s own
  "latest batch only" rule); R0b.1's at `git show
  28636fe:issues/47/handoff.md`, same section name.
  R0a is `b0545ed` (C1), `30b2744` (C2),
  `47a9a15` (C3) on top of `29eae18`, with `06658fd`, `858ae58`, `530aa10`,
  `6e1269b` and `f826bcd` as its records and corrections; it was built,
  reviewed, pushed and green on CI in every job (orchestrator, 2026-09-13).
  - **R0b.2 closed clean, no remediation needed.** All 20 acceptance lines
    Met on the first pass; the batch was picked up mid-way (C1 already
    committed by a prior, interrupted run) and verified byte-for-byte against
    the brief before continuing. Line 16 - the line R0b.1 failed review on -
    was re-derived from scratch by opening each file: most of C1's
    `tests/app/states.js` citations turned out **unchanged** (C1 appended
    every new case after the existing content, before `CASES`, so lines
    54-385 did not move), but `tests/app/sweep.js`'s C2 edits did shift six
    citations (130->137, 289->316, 297->324, 304->332, 313->341, 328->356),
    plus one the brief's own audit had not named: the `qa` row's "Dropped"
    clause cited `sweep.js:289` a second time for the same address-echo
    check, also re-pointed to 316. **The two overlapping-Chrome-runs stall
    a previous attempt hit was contention, not a defect** - confirmed here
    at ~7s/page with nothing else running: `sweep.js 1180` 554.8s, `768`
    320.1s, `390` 342.2s, `360` 337.0s, all green, none near the 600s cap.
  - **What the R0b planning pass found, and why it flags.** Reading all ten
    counterpart-less suites in full against every test `COVERAGE.md` names as
    their fate shows the fates are honest about intent and silent about what
    did **not** travel. All ten get a verdict and none is dropped unaccounted
    for - but the residue is about twenty-five real placements, not one, and
    **three legacy assertions can take none of the three verdicts because the
    rewrite does not do what they assert**: the roll results lost
    `role="status" aria-live="polite"`; a referenced card lost its line breaks
    and its `daggerheart.su` link; the copy-image button no longer disappears
    when the art fails to load. Each was verified against the source. Each was
    invisible to every instrument - two of them sit inside a `<details>` that
    is closed by default, and axe does not report a *missing* live region.
    Full evidence: `plan.md`, "The fourth verdict".
  - **The tree moved under the planning pass.** It held 76 of task
    56-followup's modified paths - including `docs/specs/COVERAGE.md`, which
    R0b.1 edits - and that session committed mid-pass (`c92c8e8`, `bb55a2d`),
    so HEAD is `bb55a2d` and the tree is clean apart from `issues/47/`. Three
    peer sessions still share it; the batch's preflight verifies rather than
    assumes.
  - **`npm run check` failed on the planning-era tree for a reason belonging
    to no task here, and this is now RESOLVED** - an untracked third-party
    skill install under `.agents/` and `.claude/skills/impeccable/` that
    `.prettierignore` and `eslint.config.mjs` did not cover; `bb55a2d`
    bypassed the gate over it at the time. The install is gone as of
    `37e4812` (this session's starting HEAD) and the baseline `npm run check`
    is green - see "Blockers", "RESOLVED - the untracked skill install is
    gone", and `context.md`, "The tree state, corrected mid-session", for the
    full record. A cold session reading Status first should not read this as
    still open.
  - **The CI read: run `34755188652` on `6e1269b` is green in every job** -
    `check`, `parity (1..4)`, `golden (1..4)`, `audit`, `secrets`, `deploy`.
    The run before it, `34754984230` on `06658fd`, was red on one case and it
    was a flake - evidence in `context.md`, "`app/states` case 7 flakes on a
    loaded runner", and the case is PLACED for R0b in "Deferred".
  - **Reviewed at Opus: verdict fix-then-continue, documentation only, no code
    change requested.** Both blockers were corrected in `530aa10` and the one
    remediation cycle is **spent**. Blocker 1 was the sharp one: the arithmetic
    behind acceptance line 17 re-derived exactly, but the conclusion drawn from
    it - that the folded non-row controls "are never hidden" - was false, and
    `docs/specs/COVERAGE.md` had inherited it. Retention inside a same-shape
    run is **positional**, so `_tables_eq_weapon.txt` keeps one of four
    per-tier select-alls and one of four tier headings and elides the rest:
    rule A's blind interior holds **app chrome names, not only `data.js`
    catalogue text**, and nothing else will own those names once
    `tests/parity.js` is deleted. The same row also claimed a reorder still
    fails; it does not, when two same-signature siblings swap inside an elided
    run the file is byte-identical. Both are now stated that way in
    `COVERAGE.md`. Blocker 2 was the handoff disagreeing with `context.md` on
    line 20; fixed in the same commit.
  - **What the review verified rather than accepted** (it re-derived each from
    the artefacts): `ci.yml`'s `deploy` job, its `needs:` and the assembly
    guard are byte-identical, and `git show 9177f3b | git apply --reverse
    --check -` still exits 0; B1's fix cannot regress to passing, because
    `cells++` sits after the WANTED filter and the `!outstanding.length`
    carve-out can only be tripped by a selected `pending` state; `isHome` has
    no reader anywhere in `app/src/`, `tests/` or `docs/`; `ACCEPTED` is 10
    keys and `VISUAL_DEBT` 18 entries with no value changed or deleted and the
    `specs.js` diff entirely inside comments; the elision signature separates
    a `checked=true` row from the `checked=false` majority and cannot group a
    joined text node with a split one; `--shard` partitions disjointly and
    exhaustively and throws on `0/4`, `5/4` and malformed input.
  - **The suite's two real blind spots, stated so R0b and R0c can price them**:
    it can go green on a changed app only through a **rename** of a node
    positioned in the interior of a >5 same-signature group, or a **reorder**
    of two same-signature siblings both in that interior. Everything else
    fails - any add, remove, attribute-value change, role change, tree-shape
    change, a rename in a kept position or in any group of five or fewer, and
    via `namehash` any change to a name's tail past 64 code points.
  - **All twenty acceptance lines are now closed.** Nineteen by the
    implementer; **line 20 by the coordinator's measurement after the push**
    (`858ae58`, and `context.md`, "The golden job costs CI nothing, measured"):
    run `34753801089` on `30b2744` was green in every job, the four `golden`
    shards ran 1m43s-2m02s and were done at 11:13:51 while `deploy` started at
    11:23:51, and `check` and the longest parity shard moved +6s and +1s
    against the warrant run - noise. CI's wall clock did not grow. R0a's
    outcome, its deviations and its commits: `plan.md`, **"R0a built: three
    commits, nineteen acceptance lines closed"** (line 20 - this CI reading -
    was closed after the push and is recorded here, which is why that heading
    says nineteen). The full write-up, every command and every result, did not
    survive `plan.md`'s own 2026-09-16 compaction: it is at
    `git show fc59ce4:issues/47/plan.md`.
  - **The coordinator's mid-batch correction, carried forward**: a `npm run
    check` reading of 937s was two check runs racing on one tree (the
    coordinator's own foreground attempt collided with this session's
    backgrounded one); the gate's real cost, alone on the host, is **147s**.
    Never run `npm run check` beside a `golden` shard or a second `check`.
  - **Acceptance line 17 closed on the true numbers, not the plan's predicted
    317**: `_tables_eq_weapon.txt`'s two elided groups are 321 (checkbox) and
    318 (button) - `.fcount` (317) counts catalogue rows only; the groups also
    fold in the table's four per-tier select-all checkboxes and its "Ссылка на
    таблицу" button, which share a plain row's signature and are folded with
    them. Not a bug in rule A - read directly, not adjusted.
    **Corrected by the review: those controls are not all kept.** Retention is
    positional, so in this file's `ru :: tree` exactly one of four
    `checkbox "Выбрать все (N)"` survives, one of four `StaticText "РАНГ N"`,
    and one of four `StaticText "Выбрать все (N)"`; the rest are inside the
    elided run. So **rule A's blind interior contains app chrome names, not
    only `data.js` catalogue text** - now stated that way in
    `docs/specs/COVERAGE.md`. `_search_capped.txt` matches the plan's own
    prediction exactly (296 of 300), and has one section, which is where the
    earlier "never hidden" reading came from.
  - Next action: **the coordinator pushes and reads CI** (per their own
    instruction), then either closes R0a on a green `golden` job or returns a
    red one to this task. After that: **R0b -> R0c**, `plan.md`, "The
    finishing plan".

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

### R0b.3's own commands and results (implementer, 2026-09-16)

**R0b.2's own full command record moved out per this section's "latest batch
only" rule: `git show 98ddf52:issues/47/handoff.md`, "R0b.2's own commands
and results".**

Preflight: re-derived all four `COVERAGE.md` print line numbers by grep at
batch open (verdict row `:44`, features-map row `:85`, thin spot that stays
`:388-390`, thin spot that retired `:427-429` - none matched the brief's or
the handoff's own stale citations). Live-checked `dist/#/print/ci1-q1`:
`document.querySelectorAll('[data-act]').length === 0` - the grip is gone,
recorded as a design change (name-based `d.click`, the same fallback
`tests/parity/specs.js` already used) rather than substituted silently.
`dist/card` and the repository `card/` both hold 36 SVGs. No `chrome.exe`
before any heavy run.

Gates, foreground, one call each, nothing else running beside them:

- `npm run build` - green, ~2s, deterministic.
- `node tests/app/print.js` (direct, ahead of the gate) - red once
  (`ни одна длинная карта не отдала место под правило`), diffed against
  `index.html` directly on the same route rather than guessed at, both apps
  agreeing on this host at the time - then green. **This reading was later
  shown to be host-local, not app behaviour**: see "Remediation" below.
- `node tests/run-all.js app/print` - after C1, green, 138.1s; after C2,
  green, 120.1s; post-commit re-run at the closed tree, green, 127.6s (the
  three readings are why the recorded weight is a measurement, not the
  first number seen - `run-all.js`'s row carries 122s, the C2 standalone
  timing).
- `set -o pipefail; npm run check 2>&1 | tail -n 120` - green after C1, green
  after C2 (a stray dirty `docs/specs/COVERAGE.md` disarmed the commit gate
  between edits twice, both times cleared by re-running this same command);
  42 files/1046 tests, coverage steady at 96.61/88.58/97.10/97.34 throughout
  - unmoved, as expected (no `app/src/` touched).
- `git revert --no-commit 9177f3b` then `git revert --abort` (line 12) -
  `Auto-merging .github/workflows/ci.yml`, exit 0, clean; aborted without
  committing.
- `node tests/parity.js print` - not run: no ported assertion failed against
  `dist/` once the stale one was fixed, so the diagnostic's entry condition
  never came up.

**Acceptance lines 1-13, all Met:**

1. Preflight above, recorded, including the `[data-act]` check.
2. `tests/app/print.js` carries every `tests/print.js` group: the design
   table's thirteen rows at the stated tolerances, the 63x88/210x297 mm
   checks, the 30.8/63.7% partitions, the `hi-lo>8`/`>=3 edges>14` art-edge
   thresholds - all transposed unchanged.
3. All 23 `settle()` calls are `await d.settle()`; the `.pc-shield img`
   `waitForFunction` survives verbatim.
4. `window.LOOT` not read; `data.json`'s `items.wondrous`/`voa`/`community`
   used instead. SVG reads resolve through `CARD_DIR` (basename +
   `tests/../../card`), not a stale `__dirname/..` join.
5. `readPNG` inlined (`tests/app/print.js:39-84`); `tests/lib.js` untouched
   (`git diff --stat 98ddf52..HEAD -- tests/lib.js` empty).
6. `.pc-name` gripped by class throughout, never by tag.
7. `sheetCounts`/`cardFit`/`printMedia`/`copiedPrintLink` all four carried;
   `cardFit` loops `WIDTHS` (1100/768/375); `printMedia` uses
   `d.media('print')` with a `finally` reset.
8. `run-all.js`'s `app/print` row weight is the measured 122s first-C2-green
   run, placed between the golden shards and `app/contracts`; the legacy
   `print` row untouched; `app/print` green after each commit (above).
9. `COVERAGE.md`'s `print` row reads landed; `app/print` in the
   `tests/app/*` table and the `| Print |` features row; the geometry thin
   spot retired, the "measured, not image-compared" one kept (reworded for
   both suites); the goldens' print-state count corrected to nine, verified
   against `tests/app/inventory.js:996-1053`.
10. All four `COVERAGE.md` citations this batch used were re-derived by grep
    at batch open (preflight above), not trusted from the brief.
11. Count sentences re-derived: the `tests/app/*` intro's "six" suites
    corrected to "seven" (`app/print` added), not merely incremented.
12. No deletion, no `ci.yml`, no `VISUAL_DEBT`/`ACCEPTED` edit
    (`git diff --stat 98ddf52..HEAD -- .github/workflows/ci.yml
    tests/parity/specs.js` empty); `git revert --no-commit 9177f3b` still
    applies cleanly (above).
13. `git diff --stat 98ddf52..HEAD -- app/src` empty - no `app/src/` change
    at all, so the lighter half of the stop-and-raise condition applies; no
    `check:built` or print parity filter needed as a gate.

No fifth divergence found. The one behaviour difference from the legacy
suite's assumptions - this host never drives the long-text set's fit ladder
into hiding art - was verified identical between `index.html` and `dist/`
before being treated as host-local text-metric variance, not a divergence;
see "Remediation" for the correction to how that reading was written down.

### R0b.3 remediation (implementer, 2026-09-16, one cycle)

**Reviewed at Opus: verdict fix-then-continue, two blockers, both in the
batch's own art-rung finding; cycle spent.** Commit `00eb465`, pushed.

- **Blocker 1 - a host-local reading became a durable spec claim.** The C1
  commit message, `docs/specs/COVERAGE.md`'s `print` row and this file's own
  "Completed" bullet all stated the longest-text ladder "no longer" reaches
  the art-hiding step - a general claim, when the batch had only ever
  measured it on one host. CI run `35130947774` on `98ddf52` (this batch's
  base, green two hours before the batch) proves `tests/print.js`'s original
  art-rung assertion passes on ubuntu; CI run `35136053221` on `1aa8720`
  proves the ported `app/print` suite passes there too. `tests/app/
  inventory.js:1028`'s own `why` ("the font, then the padding, then the art
  gives way") was already correct and untouched. Fixed: `COVERAGE.md` and
  this file's "Completed" bullet now carry the measurement with its host and
  date plus the CI run that contradicts it as a general claim, instead of a
  false generalisation. `tests/app/print.js`'s font-step check
  (`shrunk > 0`) stayed - it is true everywhere - with its message corrected
  to name the font rung rather than the art rung. A new host-independent
  rung invariant rides beside it: if any card's `--pcpad` sits at its own
  floor, some card's art must be `display:none` - vacuously true where the
  floor is never reached (this host), the real check wherever it is (ubuntu
  CI). Every print `<img>` in `PrintCard.svelte` is `alt=""`, so this rung is
  invisible to the structural goldens in both directions - real numbers in a
  real browser is what this suite exists for.
- **Blocker 2 - a bound that contradicts the app's own floor.** `cardFit`'s
  `--pcpad` check asserted `>= 3`; `PrintCard.svelte`'s own black-and-white
  ladder (`pad -= 1.5` from 5.8, while `pad > 3`) bottoms at exactly `2.8`,
  pinned by `printPage.test.ts:581`. Latent, not red - ubuntu was green on
  `1aa8720` - and would have fired the moment the ladder ran deeper than this
  host's own readings. Fixed to `>= 2.8`. Two nits rode along on the
  reviewer's instruction: the text font-size floor `>= 2.2` tightened to the
  real `>= 2.6` (2.2 belongs to the separate strip-box ladder), and the
  `shrunk` check's message no longer names the art rung.

**Deferred to R0b.4** (R0b's terminal batch; not fixed here, scope held):
missing `pageerror` handler in `tests/app/print.js`; the vacuous `display`
check at (then) `:1028-1033`; `printMedia`'s dropped `width` from `main`'s
property list; the "Высокородное"/"Великородное" comment mismatch;
`run-all.js`'s `app/print` weight (122) not matching any single recorded
reading exactly; `COVERAGE.md`'s pre-existing `app/golden` "110 states"
where `tests/app/inventory.js` says 105 (pre-existing, not this batch's).

Gates: `npm run build` green (~1s); `node tests/run-all.js app/print` green,
121.7s; `set -o pipefail; npm run check 2>&1 | tail -n 120` green, coverage
unmoved (no `app/src/` touched).

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

## Next batch (implement-ready)

**R0b.1, R0b.2 and R0b.3 are all CLOSED, pushed, and green.** R0b.1's full
record is "Completed" and `git show 28636fe:issues/47/handoff.md` (its own
former "Verification" entry). R0b.2's is "Completed" and `git show
98ddf52:issues/47/handoff.md`. R0b.3's is "Completed" and "Verification",
above - **all 13 acceptance lines Met, no fifth divergence.** R0b.1's one
open caveat from its own close-out (**19 - met, and the standing guarantee
independently re-checked**) still applies going forward: the line's literal
command, `git show 9177f3b | git apply --reverse --check -`, is stale once
`ci.yml` has moved past its own starting HEAD; **use `git revert --no-commit
9177f3b` (then `git revert --abort`) instead** - R0b.2 and R0b.3 both
re-confirmed this command still applies cleanly.

### R0b.4 - IMPLEMENT-READY, entry condition met, two re-derivations at batch open

**Design: `plan.md`, "R0b.4 designed".** Entry: R0b.1..R0b.3 landed. **All four
divergences are answered restore** - items 1-3 (owner, 2026-09-16) and item 4
(owner via the orchestrator, 2026-09-16); see `context.md`. Nothing in this
batch waits on the owner. The only owner gate left in TASK 47 is R0c's go.

**Honest readiness.** Implement-ready in design, with two things that must be
re-derived rather than trusted: (a) `COVERAGE.md`'s three divergence rows -
`flows`, `noart` and `qa`, at `:39`, `:42` and `:44` on `241d55f` - are moved by
both R0b.2's C4 and R0b.3's C3; grep for `divergence`. (b) `tests/app/states.js`
case 11 and the file's case count are moved by R0b.2's eight insertions. Both
are one command each. Everything cited into `app.js`, `app/src/`, `data.js`,
`tools/capture-share-fixture.mjs` and `docs/fixtures/share/records.json` is
stable.

**Acceptance criteria.**

1. Preflight run and recorded, **including a clean four-shard golden compare
   before any component changes**, so a moved golden afterwards is this batch's.
2. `StdPanel.svelte`, `RollPanel.svelte` and `AltPanel.svelte` each emit
   `role="status" aria-live="polite"` on the results container, matching the
   six `app.js` sites.
3. `std.test.ts`, `roll.test.ts` and `alt.test.ts` each assert it - none of
   them asserts anything about that container today, and axe cannot see a
   missing live region, so the guard is written here or it does not exist.
4. `RecordCard.svelte`'s refs block restores the `\n` -> `<br>` line breaks as
   real text nodes (not `{@html}`), the `<i class="ref-s">`, and the
   `<a href target="_blank" rel="noopener">daggerheart.su</a>` **with the
   language-correct subdomain** - `r.url` in Russian, `r.url.replace('//ru.',
   '//en.')` in English, as `app.js:882-883` does.
5. `record.test.ts` asserts the link, its href in both languages, and the line
   breaks; nothing in the repository asserted any of the three before.
6. `RecordActions.svelte` gates the copy-image button on `it.img &&
   !app.artBroken(it.id)`, and its comment states both halves.
7. `record.test.ts` covers the broken-art side of that new branch beside the
   existing no-art test, and `tests/app/states.js`'s broken-art case gains the
   real-browser assertion that the button is gone.
8. `app/src/lib/share.ts` passes `{ noTier: isFrameRecord(it) }` to `eqLine`,
   importing `isFrameRecord` from `app/src/lib/label.js`.
9. `docs/fixtures/share/records.json` regenerated with `node
   tools/capture-share-fixture.mjs`, and `git diff` on it shows **only** `f33`'s
   `ru` and `en` full text losing the tier word. Anything else changing was a
   stop-and-raise. `share.test.ts`'s golden loop is green over all nine ids.
10. `tools/capture-share-fixture.mjs`'s header note no longer calls the `f33`
    diff a known outstanding divergence.
11. The five R0b.1 review nits that R0b.2 did not take (1-5; nit 6 is R0b.2's)
    are closed here, this being R0b's terminal batch, or each carries a
    recorded reason why not.
12. `COVERAGE.md`'s `flows`, `noart` and `qa` rows say which commit fixed each
    divergence and what now guards it, instead of "neither is fixed".
13. `FEATURES.md` states the restored behaviour - the referenced card's link and
    line breaks, and the copy-image gate - in the same commit as the change.
    **Nothing goes to `DEBT.md`**: all four are accidental losses, not live
    decisions kept on purpose.
14. `npm run check:built` green.
15. The parity filter run as **two** calls, `#/i/` and `#/roll/`, each prefixed
    `MSYS_NO_PATHCONV=1` in Git Bash, each printing a non-zero compared-cell
    count. **Zero cells moved**; any movement was a stop-and-raise.
16. Four golden shards compared. If any state moved, every changed line is the
    added `status` node and nothing else, the goldens were re-seeded with
    `--update` (never hand-edited), and all four compared green afterwards.
    "Copy image" still appears in `_i_ci1.txt`, `_i_f1.txt` and `_i_q1.txt`.
17. No deletion, no `ci.yml`; `git revert --no-commit 9177f3b` still applies
    cleanly. R0b ends with the one-file revert intact.
18. No fifth divergence, or one recorded beside the four and **the batch
    stopped**.

**Gate set**: `npm run build`; `npm run check` per commit, one foreground call;
`npm run check:built`; `node tests/run-all.js app/states`; the two parity
filters; the four golden shards (compare, and `--update` plus a second compare
only if a state moved).

R0c still needs **the owner's go** (Phase 7 condition 6) and is where the
one-file revert ends. R0c also inherits two named items from this planning
pass: `tests/parity/lock.js` (see "Deferred") and `golden` joining `deploy`'s
`needs:`.

## Blockers

- **ANSWERED - the owner ruled restore on all three (owner, via orchestrator,
  2026-09-16). NEEDS_HUMAN_CONFIRMATION is cleared; R0b.4 is unblocked and is
  now an ordinary queued batch, for these three.** The answers, one per
  question asked:
  1. **Restore** `role="status" aria-live="polite"` on the results container in
     `StdPanel.svelte`, `RollPanel.svelte` and `AltPanel.svelte`.
  2. **Restore both** - the `\n` -> `<br>` line breaks *and* the
     `daggerheart.su` outbound link in `RecordCard.svelte`. Dropping the
     third-party link was not deliberate.
  3. **Restore** the second half of the gate in `RecordActions.svelte`:
     `it.img && !brokenArt[it.id]`, not `it.img` alone.

  None goes to `DEBT.md`. R0b.4 keeps its own gates (`npm run check`,
  `check:built`, a parity filter over `#/i/*` and `#/roll/*`) and its entry
  condition is now R0b.1..R0b.3, not an answer. **R0b.1 does not implement any
  of them** - acceptance line 21 still holds and the five named components
  still appear in no R0b.1 commit.

  **A fourth item joined R0b.4 after this answer, and has now been put to the
  owner and answered: restore, the same as items 1-3 (owner, via
  orchestrator, 2026-09-16).** It was found during R0b.1's C3 and folded in by
  review remediation. A frame-armour record's copy text keeps a tier word the
  live app now drops - `app.js:612`'s `isFrameRecord` guard has no counterpart
  in `app/src/lib/share.ts:85`'s `eqLine(...)` call. Same class as items 1-3
  (an accidental loss, not a deliberate product change), and the fix is
  `noTier: isFrameRecord(it)` - the option `i18n.ts:117,123` already defines -
  plus regenerating `docs/fixtures/share/records.json` with
  `tools/capture-share-fixture.mjs`. It does not go to `DEBT.md` either. Full
  evidence: `plan.md`, "The fourth verdict", item 4. **All four of R0b.4's
  items are now answered; the batch waits only on R0b.2 and R0b.3.**

  The three questions as they were asked, with the line numbers on both apps
  and why each was invisible to every other instrument: `plan.md`, **"The
  fourth verdict"**. **What must not happen**: R0c deleting `app.js` and the
  ten suites while any of the four is unrecorded. After that the correct
  behaviour exists only in git history and the instrument that noticed is
  gone.

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

- **Five nits from R0b.1's review remain, recorded and NOT fixed (review
  remediation, 2026-09-16). Nit 6 is CLOSED (R0b.2's acceptance line 11,
  implementer, 2026-09-16): `tests/app/states.js:190` keys `__storageSeen` on
  `e.key === 'dhloot.lists.v2'`. Nits 1-5 are PLACED as R0b.4's acceptance
  line 11 (planner, 2026-09-16), R0b being a plan and R0b.4 its terminal
  batch.** The reasoning for the rest was, and stays, that R0b.1 is mid-plan -
  R0b.3, R0b.4 remain - so they clear on the terminal batch rather than
  costing a remediation cycle now:
  1. `app/src/components/TablesPage.svelte:395` still reads "in
     `tests/parity/driver.js`" - the only stale `parity/driver` reference
     outside `issues/`. Acceptance line 3 scoped its search to `tests/`,
     `tools/`, `docs/`, `.claude/`, so the line is still met; the comment
     itself is wrong.
  2. Acceptance line 11's fourth clause is unasserted: `tables.test.ts:791`
     proves the fold survives, the pill is not snapped back, and the address
     follows (`:813`), but nothing asserts that reset clears the address.
     Recorded as three of four clauses (see the corrected line 11 above), not
     a plain "Met".
  3. `app/src/lib/data.test.ts:170-172` is a vacuous assertion: it looks up
     each `wondrousItems` element inside the very array it was filtered from
     and compares the found row's `.roll` to itself, so it cannot fail. No
     real coverage is lost - the preceding `expect(rolls).not.toEqual(...)`
     line carries the actual claim - but a test that cannot fail belongs on
     the record in a batch whose purpose is preserving coverage.
  4. `tests/app/lib.js:2` is self-referential since C1's move: "`tests/app/
     driver.js` already knows..." now sits inside `tests/app/lib.js` itself.
     Cosmetic.
  5. `handoff.md`'s "Completed" entry for R0b.1 and its Deferred entry for the
     fourth divergence narrate the same finding twice at some length. Left
     alone rather than trimmed mid-plan.
  6. **CLOSED (R0b.2 C1, `37a1061`).** Case 7's stage one waited on
     `window.__storageSeen > 0`, but page A's `prepare()` clears
     `localStorage` on first navigation (`tests/app/lib.js:98`), and that
     clear itself fired a `storage` event on page B before A ever wrote the
     list - stage one was an environment probe ("did Chrome deliver *a*
     storage event"), not the sharper "did *this* write arrive". Fixed by
     keying `__storageSeen` on `e.key === 'dhloot.lists.v2'`
     (`tests/app/states.js:190`), making the two stages disjoint.

- **PLACED for R0b.4, now four items (planner, 2026-09-16, items 1-3;
  implementer, 2026-09-16, item 4; folded in by review remediation,
  2026-09-16).** The roll results' missing `role="status" aria-live="polite"`;
  a referenced card's lost line breaks and lost `daggerheart.su` link; the
  copy-image button that no longer disappears when the art fails to load;
  and (item 4, found during R0b.1's own C3) a frame-armour record's copy text
  keeping a tier word the live app now drops - `app.js:612`'s `isFrameRecord`
  guard (commit `106e4dd`) has no counterpart in `app/src/lib/share.ts:85`'s
  `eqLine(...)` call. Each was guarded by exactly one of the ten suites R0c
  deletes (`qa.js:138`, `flows.js:117`, `noart.js:76`) or, for item 4, by
  nothing at all until a fixture regeneration surfaced it. Full evidence,
  with line numbers on both apps: `plan.md`, "The fourth verdict" (now four
  items, not three). **The owner answered restore on items 1-3 (2026-09-16)
  and, separately, on item 4 (2026-09-16, via the orchestrator)** - R0b.4 is an
  ordinary queued batch for all four, not blocked; see "Blockers" for the
  per-item answers and `context.md`, "The owner's answer on R0b.4's four
  divergences". An earlier version of this entry said item 4 had not been put
  to the owner; that is superseded, and R0b.4's implementer confirms nothing.
  **R0b.1 did not fix any of the four** -
  acceptance line 21 confirms the five named components appear in no R0b.1
  commit, and `app/src/lib/share.ts` was likewise untouched - and R0c may
  still not delete `app.js` or those three suites while any of the four is
  unrecorded. A session-only `spawn_task` chip (`task_62e359c8`) briefly held
  item 4's finding before this fold-in; it has been withdrawn, since a chip is
  session state and this entry, `plan.md`'s "The fourth verdict", and
  `tools/capture-share-fixture.mjs`'s own comment are what actually carry it
  forward.

- **PLACED for R0b.4, six nits from R0b.3's review (reviewer, 2026-09-16).**
  All deferred, not fixed in the remediation cycle: a missing `pageerror`
  handler in `tests/app/print.js`; the vacuous `display === '' || 'none'`
  check at (then) `:1028-1033` (true of any string, so it cannot fail);
  `printMedia`'s property list for `main` dropping `width`, which
  `tests/parity/specs.js`'s own spec carried; the "Высокородное"/
  "Великородное" community-name mismatch in a code comment; `run-all.js`'s
  `app/print` weight (122) not matching any single recorded wall clock
  exactly (readings were 138.1s/120.1s/127.6s across the batch, 121.7s/127.1s
  across the remediation); and `COVERAGE.md`'s pre-existing `app/golden` row
  claiming "110 states" where `tests/app/inventory.js` says 105 - predates
  this batch, not introduced by it.

- **PLACED for R0c: the ported print specs narrowed from two languages to one,
  and R0c is where that becomes a real loss (reviewer via orchestrator,
  2026-09-16).** `tests/parity/specs.js` ran `sheetCounts`, `cardFit`,
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

- **PLACED for R0c: `tests/parity/lock.js` is a live hook dependency R0c's
  outline does not name (planner, 2026-09-16).** It is imported by
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

- **PLACED for R0c: `golden` must join `deploy`'s `needs:` list (implementer,
  2026-09-13).** R0a gave the structural goldens their own four-shard CI job
  (`ci.yml`, `golden`, mirroring `parity`), but `deploy`'s `needs:` -
  `[check, audit, secrets, parity]` - is untouched, on the coordinator's own
  instruction: B13 fenced `deploy` off while `git revert 9177f3b` is the
  safety net, and R0c already owns that job's rewrite (N3, N5, dropping
  `parity`). Until R0c adds `golden` there, a red `golden` job does **not**
  block a publish - the same "a check quietly stops checking" class R0a exists
  to close, now open on the other side of the workflow. R0c's own step list
  needs this line, not a rediscovery.

- **PLACED for R0c: B13's reviewer nits N2, N3, N5, N6 and N8** (reviewer,
  2026-09-12; N1, N4 and N7 were closed by B14 `a7f8787`). N2 and N8 live in
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
  not simply picked up:
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
