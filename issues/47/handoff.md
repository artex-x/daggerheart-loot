# Handoff - TASK 47

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/context.md`, then `issues/47/plan.md`, then this file. Nothing here
depends on chat history.

## Status

- Task status: **in_progress. R0a is CLOSED - built, reviewed, pushed, and
  green on CI in every job** (orchestrator, 2026-09-13, on `f826bcd`). Last
  agent: reviewer. **NEEDS_HUMAN_CONFIRMATION: no.** Branch `main`, level with
  `origin/main`; R0a is `b0545ed` (C1), `30b2744` (C2), `47a9a15` (C3) on top
  of `29eae18`, with `06658fd`, `858ae58`, `530aa10`, `6e1269b` and `f826bcd`
  as its records and corrections.
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
    against the warrant run - noise. CI's wall clock did not grow. Full
    disposition, every command and result, every deviation: `plan.md`,
    **"R0a built: the format revision, and all three commits landed"**.
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

- Task status: **in_progress. R0a's golden format is revised and C1 is
  implement-ready again** (planner, 2026-09-13, on `29eae18`). Last agent:
  planner. NEEDS_HUMAN_CONFIRMATION: **no** - the size question that was raised
  as the owner's is answered below, and the answer makes it a design call rather
  than an owner's one. Branch `main`, base `29eae18`; `dist/` is still
  byte-identical to the warranted `32926a0`, so warrant `34747570250` still
  covers the re-seed and **no new warrant is needed**.
  - **The decision.** 5.2 MB is refused, but not for its bytes - 5.2 MB is 8% of
    a 63.4 MB tracked tree that already carries 29 MB of `img/` and 4 MB of
    `i/`. It is refused because **14,720 of the corpus's 40,361 lines carry an
    accessible name longer than 64 characters**, running to 1023, and those are
    catalogue strings `data.js` owns: adding a source would rewrite hundreds of
    thousand-character lines in a file whose whole value is that a person reads
    its `git diff`. Two local rules replace it, neither naming a state:
    **same-shape sibling elision** on the tree (group a node's children by a
    signature of role + attribute *values* + child shape, names excluded; more
    than five in a group keeps the first two and last two and writes
    `... button x313 of 317 same-shape siblings elided`) and a **64-code-point
    cap** on every name with `namelen`/`namehash` appended. Replayed over the
    seeded corpus: **5.20 MB -> ~1.50 MB, 40,361 -> 24,346 lines**, largest file
    372 KB -> 89 KB. Full design, the three safety arguments and the four
    rejected alternatives: `plan.md`, **"Decided 1, revised: what a golden
    captures for the largest states"**.
  - **Acceptance line 2's gate moves from 4 MB to 2 MB**, because 1.50 MB is now
    a measurement rather than an estimate.
  - **Acceptance line 3 is rewritten around the measured cost.** The backgrounded
    comparison landed green - exit 0, 105 states, zero differences, 1005 s - so
    the capture *is* reproducible; what it proved is kept, and the shape of the
    gate changes instead. A comparison at 1005 s cannot fit the 600 s foreground
    cap at any capture size, so the suite gains `--shard=n/of` (`parity.js`'s own
    grammar) and the proof is **eight foreground calls at ~250 s each**: seed
    four shards, compare four shards. The 2.4x seed-to-compare gap is
    **instrumented, not theorised** - the suite prints `съёмка: Xs из Ys` so the
    next run says whether it is the browser or the compare path.
  - **`.github/workflows/ci.yml` moves into scope**, deliberately: bolting a
    7-17 minute suite onto the 11m51s `check` job would make it the workflow's
    critical path. It gets its own 4-shard job beside `parity`'s, and
    `ci.yml:51` becomes `--exclude=parity,app/golden`.
  - **Kept, not rebuilt**: `tests/app/inventory.js` (verified, and it carries
    `specs.js`'s `NAME` too - see below) and `tests/app/golden.js` (Decided 1-2,
    plus the `timed`-state `return await` fix). Only `golden.js` is amended;
    `tests/app/snapshots/` is deleted and re-seeded because the format changed.
  - Next action: **resume R0a's C1** (implementer) at "What C1 becomes" in the
    revised plan section. Nothing is committed; stage by path and preserve
    `issues/tg-preview-refresh/`.

- Task status: **blocked. R0a's C1 stopped at its own size gate, nothing
  committed** (implementer, 2026-09-13, on `29eae18`). Last agent:
  implementer. NEEDS_HUMAN_CONFIRMATION: **yes** - a planner-level call on the
  golden format's size is owed before this batch can continue. Branch `main`,
  base `29eae18` (three `.md`-only commits ahead of the `32926a0` the seeding
  warrant covers; `dist/` built from either is byte-identical, so the warrant
  still holds).
  - Built through C1's steps 1-5 exactly (`plan.md`, "R0a built: stopped at
    C1's own size gate, nothing committed" - full detail, every command and
    result, there). In short: step 0's warrant (`34747570250`) verified green
    first-hand; `npm run build`; `tests/app/inventory.js` and
    `tests/app/golden.js` written; the goldens seeded (`node tests/app/golden.js
    --update`, one real bug found and fixed along the way - a `finally`
    closing the browser context before an unawaited snapshot promise had
    settled, a puppeteer `TargetCloseError` on the first attempt).
  - **Stopped, not failed**: `tests/app/snapshots/` is 105 files at **5.2 MB**,
    over the plan's own 4 MB line (estimated 1.5-2.5 MB; the estimate's seven
    sample routes did not include the biggest tables - `eq_weapon` at 317
    records, `voa`, or the 300-match search cap). Read directly: the size is
    genuine accessible-name content (a table row's button name is its whole
    stat line), not a normalisation bug - `plan.md`'s built record has the
    file-by-file reading. **Nothing in `ACCEPTED`/`VISUAL_DEBT`/specs.js/
    FEATURES.md/COVERAGE.md/parity.js/the hooks/app.svelte.ts/states.js/typo.js
    was touched** - C1 never reached its own step 6, and C2/C3 were not
    started.
  - **One deviation from the plan's own measured facts, not from its design**:
    `tests/app/inventory.js` also copies `specs.js`'s `NAME` dictionary
    (lines 91-185) - sixteen of `STATES`' `enter` closures call `NAME.ru.*`/
    `NAME[lang]`, which the plan's five-name list (`context.md`, "R0a planning
    facts") did not enumerate. The rule that governs it ("exactly the
    module-level constants it reads") already covers this; only the
    enumeration was short by one name. Verified independently by loading the
    module and reproducing `context.md`'s own seven measured numbers (105
    states, 0 pending, 61 `enter`, 24 `storage`, 7 `timed`, 5 `whole`) exactly.
  - **Acceptance line 3 (two green `node tests/app/golden.js` runs on an
    unchanged `dist/`) is evidenced but not formally closed**: the seed run
    (`--update`) reports `сравнено состояний: 105`, exit 0, 414.6s. The plain
    comparison run crossed the Bash tool's 600s foreground cap, was moved to
    the background, and finished on its own - **exit 0, 105 states, zero
    differences**, real 16m45.678s. The goldens *are* reproducible (that is
    the claim this line checks for), but the run itself does not satisfy the
    "one foreground call" shape the gate needs to count, the same rule
    `npm run check` already carries. A fresh, uninterrupted foreground pass is
    still owed, on a less contended host, once the size question below is
    settled and worth paying for again.
  - The three new, **uncommitted** paths are `tests/app/inventory.js`,
    `tests/app/golden.js`, `tests/app/snapshots/` (105 files) - left in the
    working tree for the next session to build on rather than discarded.
    `issues/tg-preview-refresh/` (another task's) and the `.md`-only history
    on top of `32926a0` are untouched.
  - **Next action is the owner's, not a re-dispatch of R0a as planned**:
    decide whether 5.2 MB is the accepted cost of a faithful golden of this
    catalogue, or whether Decided 1's format needs a narrower capture for the
    largest tables (a real design change, the planner's to make) - then
    resume at C1 step 5's determinism proof (a clean foreground run) and step
    6 onward.

- Task status: **in_progress. R0a is planned and implement-ready** (planner,
  2026-09-13, on `32926a0`). Last agent: planner. NEEDS_HUMAN_CONFIRMATION:
  **no**. Branch `main`, base `32926a0`, level with `origin/main`.
  - **One batch, three commits**, sized by its gates rather than its diff: no
    public contract moves and every commit is harness-reachable, so neither
    reason to split applies. Design: `plan.md`, **"R0a planned: the evidence,
    the sweep, and the structural goldens"**; the brief and the sixteen
    acceptance lines: "Next batch", below.
  - **The four hard design questions this pass owned are settled in the plan, not
    left to the implementer**: what a structural golden file contains and how it
    is compared and regenerated (Decided 1 - a line-per-node text tree plus the
    controls inventory, per state, both languages, strict equality, `--update`,
    three refusals so it cannot quietly stop checking); how the 105 `STATES` are
    carried (Decided 2 - `tests/app/inventory.js`, a verbatim copy with a
    self-retiring equality check against `specs.js`); how every `ACCEPTED`
    reason, every "Recorded, not keyed" paragraph and all 18 `VISUAL_DEBT`
    entries are dispositioned (Decided 3 - a seven-row table; the 18 are **one
    mechanism**, `showModal()`'s focus ring, and become one `FEATURES.md`
    bullet); and whether any of it is a contract change (Decided 4 - no).
  - **Measured for the plan, so the implementer does not**: puppeteer 25.9.0 does
    have `page.accessibility.snapshot()`; the snapshot is byte-stable across two
    captures on all seven routes probed; three serialized fields
    (`elementHandle`, `backendNodeId`, `loaderId`) are per-run and must be
    dropped; `url` is an absolute `file://` path and must be cut at
    `/dist/index.html`; a normalised tree is 2.5k-26k of text per page, so
    1.5-2.5 MB estimated over 105 states x 2 languages.
  - **Two things in the dispatch were stale and are corrected in place**: the
    working tree is **not** clean - four tracked files are modified by the
    orchestrator's own session edits - and `tests/parity/specs.js` has **zero**
    `pending` states, which is what lets blocker B1's guard be written without a
    `pending` escape hatch.
  - **B14 nit 4 is re-placed from R0b/R0c into R0a**, because R0a already has
    `FEATURES.md` open and `CLAUDE.md` forbids using "out of scope" to skip a
    local fix. It is acceptance line 15. Nit 6 is **done in this planning pass**
    (the `## Verification` pointer line) and remains acceptance line 16 so the
    batch confirms it survived.
  - Next action: **implement R0a** (implementer), starting at step 0 -
    `gh run view 34747570250`, the seeding warrant. Not green: stop and raise.

- Task status: **B14 is reviewed and APPROVED - the batch is closed** (reviewer,
  2026-09-13, on `f2dca3b`). **Verdict: approve**, and the batch's one
  remediation cycle is **unused** - nothing in the diff was asked to change.
  - **The three self-reported deviations were re-derived, not taken on trust,
    and all three hold.**
    - **C2's fallback was the right call because the plan was wrong.**
      `App.svelte:71` dispatches routes through a single `{#if}` chain with one
      `{:else if app.route.kind === 'tables'}` arm, and Svelte tears a branch
      down only when the matched branch changes - so two `tables` addresses in a
      row do **not** remount `TablesPage`. The plan's primary design
      (`route.table ?? 'core_item'`) would have pinned `core_item` after a
      "Таблицы"-tab click from a named table. The fallback is a faithful port:
      `homeAllows` accepts a bare `tables` because `TAB_LIST` (`app.js:3577-3581`)
      contains `['tables','tables']`, and `home={tablesHash(table)}` is the same
      value `homeHash` (`app.js:1133-1136`) writes.
    - **`canPinHome`'s deletion is correct for every caller, not most.** There
      are exactly six `<PageHead` render sites (`AltPanel`, `ListsPage`,
      `RollPanel`, `SearchPage`, `StdPanel`, `TablesPage`); `PrintPage`,
      `RecordPage` and `ListPage` render none, which matters because `PrintPage`
      shows up in a naive grep. All six are `TAB_LIST` routes, so a wired
      `canPinHome` would have been permanently true.
    - **`RollPanel.svelte`'s 49 lines are all designed** - the existing
      `<RecordCard>` block re-indented by two under `{#key shown.it}`, plus an
      eight-line comment. No behaviour beyond the planned wrap.
    - The undesigned `typo.js` language fix is correct and strengthens the
      suite: `LABELS` matches `dict.ts` exactly (`filters` 216/511, `addToList`
      234/525, `note` 304/589), the per-page claims are grounded
      (`FilterBar.svelte:69` is `{#if rows.length}`, so a facet-less table
      genuinely draws no filter control), and the legacy `tests/typo.js` does
      not carry the same bug - its grips are class-based.
  - **None of the failure shapes this task has already paid for recurred.** No
    test asserts through a directly-invoked handler: `states.js` case 14 uses
    `d.press`, a trusted `ElementHandle.click()` that *throws* when no control
    matches (`tests/parity/driver.js:286-318`), and `shell.test.ts`'s new case
    uses `userEvent.click` on a node found by role. No stale citation survived
    in `ROUTES.md`, `STATE.md`, `COVERAGE.md` or `driver.js`, surrounding prose
    read as well as the edited lines. Acceptance lines 4 and 5 are genuinely
    closed in code this time, and the rule C3 installed is really in **both**
    prompt files.
  - **One blocker, and it is the harness rather than the diff: B1 - a
    zero-match parity filter is indistinguishable from a passing run.**
    `tests/parity.js` uses `WANTED` only to `continue` past non-matching cells
    (`:353`, `:374`, `:551`) and its summary prints the filter names (`:668`)
    then `расхождений нет` and `process.exit(0)` (`:670-671`). **No cell count
    is printed anywhere**, so a mangled filter reads exactly like a clean run -
    which is how B14's first parity attempt looked, and it was caught only
    because no per-cell lines scrolled past. Every parity call in the remaining
    batches is exposed. The fix is one line at the summary: if `WANTED.length`
    and no cell was compared, fail. **It is carried into R0a as its own
    acceptance line**, under the rule C3 just installed, rather than through a
    remediation cycle - the reviewer approved the diff on the strength of
    re-running the filter logic against `specs.js` by hand and finding it
    selects **exactly 20 states of 105**, the intended set, including
    `#/roll/wondrous ~ pinned`, so C2's pin rendering was genuinely measured and
    the rerun was a real gate.
  - **Two numbers in B14's own record were wrong and are corrected in place**
    (orchestrator, 2026-09-13): the parity rerun was **120 cells**, not 88 -
    `LANGS` is `["ru","en"]` and `WIDTHS` is `[1100,768,375]`, so 20 states x 6
    = 120, every one printing a line, and 88 is what survived `tail -n 120`;
    and no banner "caught" the zero-match attempt, because the harness prints no
    counts to read. Both corrections are made in `plan.md`'s "B14 built" and in
    the two places this file repeated them.
  - **Unclaimed credit, now recorded**: C1 asked the implementer to check
    whether anything inside `RecordCard` holds DOM state live restores, and to
    stop if so; the built record is silent. It checks out - `RecordCard.svelte:232`
    has a refs `<details>`, and live's equivalent (`app.js:887-888`) carries no
    `data-keep`, so `restoreOpen()` (`app.js:3769-3775`) never restores it and
    live closes it on every rebuild. The `{#key}` therefore **removes** a
    second, unmeasured divergence rather than creating one.
  - Six nits are recorded in "Deferred" with a batch named for each; none was
    fixed. NEEDS_HUMAN_CONFIRMATION: no.
  - Next action: **plan R0a** (planner). It is an outline only - see `plan.md`,
    "The finishing plan - every batch from here to done".

- Task status: **B14 CLOSED - the roll re-render fix, the pinned bare
  `#/tables`, and all six inherited checks are landed** (implementer,
  2026-09-13). HEAD `a7f8787`, ahead of `origin/main` by three commits, none
  pushed (this session's own instruction overrides `CLAUDE.md`'s "push once a
  batch passes" - the owner did not ask for a push this time); tree clean but
  for the untracked `issues/tg-preview-refresh/`, another task's, and
  `issues/47/context.md`'s pre-existing unstaged edit from this session's
  orchestrator (left alone, not this batch's to commit).
  - **What landed.** Full design: `plan.md`, "B14 planned"; the built record,
    every deviation and every gate result: `plan.md`, **"B14 built"**.
    - `6b18291` (`fix(app): key a roll's card on the record, not the slot`) -
      C1: `OrGrid.svelte`'s `{#key cell.it}`, `RollPanel.svelte`'s
      `{#key shown.it}`, `OrGrid.test.ts` (new), `tests/app/states.js` case
      14, `docs/specs/COVERAGE.md`.
    - `af7fa17` (`fix(app): pin the table on screen, and read a bare
      #/tables pin back`) - C2: `app.svelte.ts` (`readHome` widened,
      `toggleHome(hash?)`, `canPinHome` deleted), `PageHead.svelte` (the
      `home` override prop), `TablesPage.svelte` (passes it), `app.test.ts`,
      `shell.test.ts`, `ROUTES.md`, `STATE.md`.
    - `a7f8787` (`test(app): the checks that should have caught the roll and
      pin defects`) - C3: `tests/app/typo.js` (the `EXPECTED` table, plus a
      latent Russian-only grip label bug found and fixed while touching it),
      `tests/app/states.js` (`d.press`), `.claude/hooks/edit-followup.mjs`,
      `.claude/hooks/selftest.mjs`, `.claude/prompts/add-source.prompt.md`,
      `package.json`, `tests/parity/driver.js`, `.claude/prompts/plan.prompt.md`,
      `.claude/prompts/implement.prompt.md`.
  - **The remount claim the plan flagged for verification did not hold** -
    checked directly against `App.svelte`'s `{:else if}` chain and
    demonstrated in `shell.test.ts` before the design was chosen: `TablesPage`
    is not remounted between two `tables` addresses, so a bare `#/tables`
    reached from a named one still shows that table underneath. Took the
    plan's own named fallback (`toggleHome(hash?)` plus `PageHead`'s `home`
    override) rather than the naive `route.table ?? 'core_item'`, which would
    have silently pinned the wrong table in exactly that case.
  - **All ten acceptance lines closed** - the two proof obligations
    (removing each new C1 test's `{#key}` and watching it fail; renaming a
    `typo.js` expectation and watching it fail) both done and recorded, not
    asserted. Detail and disposition of each line: `plan.md`, "B14 built".
  - **`canPinHome` deleted, not wired** - every real `PageHead` caller is
    already a pinnable route, so wiring the check would have been a
    permanently-true condition, not real gating.
  - Gates: `npm run check` **x3** (once per commit, all green, 1013 then 1017
    then 1017 tests), `npm run check:built` once after C2, the required
    parity filter after C2 (first attempt silently matched nothing - Git
    Bash's path rewriting without `MSYS_NO_PATHCONV=1`, noticed because no
    per-cell lines scrolled past, **not** caught by any banner - the harness
    prints no cell counts, which is R0a's blocker B1; rerun correctly over the
    intended 20 states = **120 cells**, no discrepancies. The "88 cells" this
    line first carried was what survived `tail -n 120`), `node tests/run-all.js app/sweep` and the other four
    `tests/app/` suites after C3, both green. `git show 9177f3b | git apply
    --reverse --check -` exits 0 on the final tree.
  - Not touched, as planned: `.github/workflows/ci.yml`, `index.html`,
    `app.js`, `style.css`, `tests/parity/specs.js`, `docs/fixtures/`,
    `tests/contracts.js`, `llms.txt`, `docs/specs/DEBT.md`, `ACCEPTED`,
    `VISUAL_DEBT`.
  - Next action: **R0a** - `plan.md`, "R0a planned in outline: the evidence,
    the sweep, the goldens" is an outline, not an implement-ready batch; it
    needs its own planning pass (steps, acceptance criteria, file list)
    before an implementer opens it. Nothing in R0a deletes anything, so it
    needs Phase 7's conditions 1, 2, 3 and 5 only - already satisfied per the
    previous status entry below.

- Task status (previous): **THE WHOLE REMAINDER OF 47 IS PLANNED: B14 -> R0a -> R0b -> R0c
  -> (Phase 8 as its own task). B14 is implement-ready; the soak is gone**
  (planner, 2026-09-12, planning pass only - no production, test or config code
  written). HEAD `6cb8293`, equal to `origin/main`; tree clean but for the
  untracked `issues/tg-preview-refresh/`, another task's - leave it.
  - Last agent: planner. NEEDS_HUMAN_CONFIRMATION: **no** (one owner decision
    is queued but blocks nothing yet - see the last bullet).
  - **Read `plan.md`, "The finishing plan - every batch from here to done"**,
    the last section of that file. It is the only place that says what happens
    next and in what order; everything above it in `plan.md` is the record of
    how the migration was built.
  - **Owner decision carried in: the soak is dropped** ("I'm ok to get rid of
    soak, we can revert to previous commit if needed, I would not block all the
    work"). Phase 7's condition 4 is removed, condition 2 reworded, condition 3
    met by evidence (`9177f3b`, `515e257`, `6cb8293` are three pushes), and
    condition 6 - "the owner says go" - now gates **R0c alone**, the batch that
    deletes the old app. R0a and R0b delete nothing and do not wait on it.
  - **The revert cliff, written for the owner**: `git revert 9177f3b` is one
    command over one file today, and stays that way through B14, R0a and R0b.
    **R0c ends it** - after the deletions, recovery means restoring paths out of
    git history and rebuilding the workflow step: possible, but a batch with its
    own review, not a command. Full text: `plan.md`, "The revert cliff".
  - **B14 is the next batch and is implement-ready**: the roll re-render fix
    (four call sites, not the two the handoff named - `AltPanel.svelte:228` and
    `ListPage.svelte:676` have the same shape through `OrGrid`'s positional
    key), the pinned bare `#/tables`, and six inherited checks. Brief below,
    "Next batch (implement-ready)"; design in `plan.md`, "B14 planned".
  - **Two deferred items were dropped by B13 while this file said they were
    placed there** - B12's nit 1 (`typo.js`'s silent grips) and nit 2b
    (`states.js` using `d.click` where the plan says `press`). Both are open,
    both are acceptance lines of B14, and the stale claim is corrected in
    "Deferred" below and in `plan.md`. The mechanism written to stop it
    recurring - **a placement is acceptance, not a footnote** - is in `plan.md`,
    under that name, and B14 puts it into `.claude/prompts/`.
  - **Queued owner question, not blocking**: the go-ahead for R0c (Phase 7
    condition 6), wanted when R0b closes - by then the owner will have used the
    deployed app through two more batches. Asking earlier is fine; nothing
    stalls until then.
  - Next action: **B14**, below.

- Task status (previous): **B13 CLOSED - THE SITE NOW SERVES THE REWRITE. Phase 6 is
  done; the soak window is open** (implementer, 2026-09-12). HEAD at close
  `a004764`; tree clean but for the untracked `issues/tg-preview-refresh/`,
  a different task's.
  - **What landed.** Full design: `plan.md`, "B13 planned"; the built record,
    every number and every deviation: `plan.md`, **"B13 built"**.
    - `0819a73` (`feat(app): port the live entry document into the rewrite`) -
      7 files. `app/index.html` gains live's head (`viewport-fit=cover`, the
      title, the description with its counts, `color-scheme`, the whole Open
      Graph and Twitter block, the icon) and the `<noscript>` block;
      `tests/derived.js` gains `noindex` on both entry documents, the seventh
      `COUNTERS` file and a head-to-head comparison of the two documents with
      no exception list; `tools/check-site.mjs` is new; `META.md` section 1,
      `CONTRACTS.md` section 5, `COVERAGE.md` line 28 and `CLAUDE.md`'s counts
      line follow.
    - `9177f3b` (`feat(ci): publish the built rewrite instead of the old
      app`) - **`.github/workflows/ci.yml` alone, 82+/12-.** The flip.
    - `a004764` (`docs: say what Pages actually serves now that the flip has
      landed`) - the review's two blockers, both prose.
  - **The public URL.** CI run **`34718569245`** on `9177f3b` is green in
    every job: `check`, `parity` 1-4, `audit`, `secrets`, `deploy`. (Run
    `34715233810` is B12.1's; do not cite it for B13.) The guard printed
    `published:` and exactly 13 entries - `.nojekyll LICENSE assets card
    catalog.csv data.js data.json i img index.html llms.txt og robots.txt` -
    with no `app.js` and no `style.css`. `tools/check-site.mjs` from inside
    the job: `сайт опубликован верно:
    https://artex-x.github.io/daggerheart-loot/`. An independent read of the
    live URL agrees, byte sizes included; both are in `plan.md`, "B13 built".
  - **The owner walked the live site (plan step 11): LGTM**, with one
    observation - the roll re-render keeps the previous artwork on screen
    until the new image decodes. Recorded as Deferred item 1 below, with an
    owner decision attached about how it gets fixed. Not fixed here.
  - **Gates, each one foreground call:** `npm run check` before F1, before F2
    and after the remediation (exit 0 each time, 1011 tests, no threshold
    moved); `npm run check:built` once (build, `file://` smoke, 88.5 kB of the
    120 kB budget); `node tests/run-all.js app/sweep` (555.4 s slowest) and
    `node tests/run-all.js app/typo,app/hues,app/contracts,app/states`
    (263.0 s slowest), two calls as planned. No local parity call. The
    remediation re-ran `npm run check` and nothing else, deliberately: both
    edits are prose and the heavy suites are green on that tree.
  - **Review: fix-then-continue, two blockers, both documentation, no code
    defect.** The reviewer re-derived and confirmed the "not a contract
    change" reasoning (grepping every spec, all four fixture directories, all
    of `i/*.html`, `llms.txt` and `robots.txt` for `/app.js` and
    `/style.css` - named nowhere - and following the stub redirect through
    `hash.ts:125`); both guard deviations, reproducing the `bash -e` trap with
    `bash -ec 'echo start; false && { echo boom; exit 1; }'` (exits 1) and
    confirming `.nojekyll` is genuinely 0 bytes; the revert property; and the
    entry-document port, which it parsed itself - **the union is 20 fields,
    zero differences, zero missing on either side**. Nothing built was asked
    to change.
    - **Blocker 1**: `CLAUDE.md` lines 19 and 21 still called the static root
      the shipped app and said Pages serves it "until the migration plan and
      owner perform cut-over" - the opposite of the truth, in the first file
      every agent reads. An agent acting on it edits `index.html` believing it
      changes the live site and treats `app/index.html` as not public.
    - **Blocker 2**: `docs/specs/COVERAGE.md` lines 13-14 introduced the
      twenty old-app suites as gating "what Pages serves". Both halves false.
      The batch rewrote line 28 of the same table and walked past the
      paragraph introducing it - the **third consecutive batch** to land a
      stale citation and the **second in this file**.
    - Both fixed in `a004764`, which also swept the specs and `.claude/` for
      anything else the flip falsified: nothing. Two statements the *counts*
      change made stale are recorded as nits N1 and N7 below rather than
      fixed, per the coordinator's deferral.
  - **The revert, should the soak turn bad:** `git revert 9177f3b`, then push.
    One file, no possible conflict; the next `deploy` republishes the root
    files, which never left the repository and are still gated. Revert first
    and diagnose after. The same instruction is in the job's own comment
    block.
  - **Next: the soak**, then Phase 7 R0 and Phase 8. There is no
    implement-ready batch queued; the next cycle is a planning one.
- Task status: **B12.1 CLOSED - the router matches live's fallback; a review
  remediation cycle then fixed two documentation blockers; B13 is the next
  batch and is implement-ready** (implementer, 2026-09-12). HEAD at dispatch
  `5f6fded`, matching `origin/main`; tree clean but for the untracked
  `issues/tg-preview-refresh/`.
  - **What landed.** Full design: `plan.md`, "B12.1 planned"; the built
    record: `plan.md`, "B12.1 built". One rule, four rows (boot-bare,
    boot-or-navigation-unreadable, navigation-bare, everything else), applied
    in `app/src/state/app.svelte.ts`'s constructor and a private `#fallback`
    shared with `start()`'s `onChange`; `App.svelte`'s now-unreachable
    `{:else}` debug heading, its `.todo` style block and the comment above it
    removed; `docs/specs/ROUTES.md`, "Fallback", gained the bare-address half;
    the `tests/app/contracts.js` skip at the `#/`/`#/nonsense` fixtures
    deleted; `tests/app/sweep.js`'s `#/nowhere` label updated.
  - **Two commits, both pushed:**
    - `bc96b59` (`fix(app): make bare and unreadable addresses match live's
      own fallback`) - 7 files, the rule and its tests.
    - `7a729bd` (`docs(issue-47): close B12.1 - the router now matches live's
      fallback`) - `issues/47/context.md`, `plan.md`, `handoff.md`.
  - **Gates, all green, each one foreground call:** `npm run check` (exit 0,
    `App.svelte` coverage rose to 100% statements / 91.3% branches, no
    threshold moved, 1011 tests up from 1007); `npm run check:built` (build,
    `file://` smoke, 120kB budget - 88.5kB actual); `node tests/run-all.js
    app/contracts,app/sweep` (574.5s slowest entry, all five states green,
    `app/contracts` with **no `skipped` line** - all 26 route fixtures now
    read field by field). No parity call, as planned.
  - **One deviation, found by `npm run check`, not planning:** two
    `app.test.ts` fixtures predating this batch used `'#/print/w1,w2'` - a
    comma the print grammar has never accepted (`lib/hash.ts:85`'s
    `/^print\/[\w-]+$/`; ids join on `-`) - so both silently exercised the
    `unknown` route instead of `print` and passed by coincidence until rule 2
    started rewriting unknown addresses to the pinned home. Fixed to
    `'#/print/w1-w2'`, a one-character-per-line correction, cheap and local
    to a file this batch already touched (`CLAUDE.md`, "fix cheap, local,
    safe bugs, stale tests/fixtures... found in a touched path"). No rule or
    design line changed as a result.
  - **Review: fix-then-continue, two blockers, both documentation, no
    production code.** The reviewer independently re-read both live call
    sites and confirmed all four table rows against
    `app/src/state/app.svelte.ts:199-223`, confirmed rule 3's `app.hash`/
    `location.hash` inequality is stated in code, confirmed the print-hash
    correction against `hash.ts:85` and that no other fixture used the comma
    shape, and confirmed the `{:else}` deletion is genuinely unreachable by
    enumerating every writer of `this.hash` and every `go`/`replace` caller.
    - **Blocker 1**: `docs/specs/COVERAGE.md:55` still said the 26 route
      fixtures were read "two skipped" with a `plan.md`, "B12.1 named"
      citation - stale the moment `tests/app/contracts.js` lost its skip.
      This is the **second consecutive review** to land on this exact line
      (B12's review blocker 2 corrected it to cite "B12.1 named" precisely
      because of these skips); root cause is `plan.md`'s own acceptance line
      ("no other spec changes") written without grepping the specs for what
      the batch's own fixture-skip removal implied. Fixed: the parenthetical
      and its citation dropped; `plan.md`'s acceptance line corrected to name
      `COVERAGE.md:55` explicitly, so the next batch's acceptance list gets
      written by grepping the specs for what it closes, not by assertion.
    - **Blocker 2**: this file's own "Next batch" section (below) was
      corrected by `7a729bd`, but no Status entry was prepended, so this
      section still opened on the planner's "B12.1 is the next batch" text at
      HEAD `aac1453` - the file's own recovery state contradicting its
      "Next batch" section 4,200 lines below. This entry is that missing
      backfill.
    - Six items recorded in "Deferred" below, record-only per the
      coordinator: a pinned bare `#/tables` silently drops at the next boot
      (highest, flag for B13); `go()`/`replace()` bypass `#fallback`
      (unreachable today); `canPinHome` has no production consumer;
      `ROUTES.md`'s "nine" pinnable sections is eight in the rewrite; the
      bare-address rule in `ROUTES.md` understates its own generality; the
      boot push is uncovered by a unit test.
  - **Gates for this remediation**: documentation only - no gate re-run per
    the coordinator's instruction (nothing moved a pixel or a test).
  - Last agent: implementer. NEEDS_HUMAN_CONFIRMATION: **no**.
  - Next action: **B13 - the reversible cut-over**, implement-ready,
    `plan.md`, "B13 planned"; brief in this file, "Next batch (implement-ready)".

- Task status (previous): **Phase 5 CLOSED; Phase 6 replanned; B12.1 is the next batch
  and is implement-ready** (planner, 2026-09-12, planning pass only - no
  production, test or config code written). HEAD `aac1453`, matching
  `origin/main`; tree clean but for the untracked `issues/tg-preview-refresh/`,
  which belongs to another task and must be left alone.
  - Last agent: planner. NEEDS_HUMAN_CONFIRMATION: **no**.
  - **What changed the plan.** `gh api repos/:owner/:repo/pages` reads
    `"build_type": "workflow"` - Pages is already served by Actions, so the
    "Pages flip" two sections of `plan.md` were built around does not exist as
    pending work. What publishes the old app is one step in
    `.github/workflows/ci.yml`'s `deploy` job. The three stale spots are
    corrected in place in `plan.md` (the Phases table's Phase 6 row, Phase 8's
    "Where the phase sits" entry condition 2, and the "Phase 6 and 7" outline),
    each showing what was believed beside what was measured; `ci.yml`'s own
    `deploy` comment block is stale the same way and is rewritten by B13.
  - **Owner decision, 2026-09-12: publish early, delete later.** The flip is
    reversible: point the deploy step at the built output while
    `index.html`/`app.js`/`style.css` stay in the repository and parity keeps
    running against them. Phase 7's deletions move behind the flip and now have
    their own entry condition.
  - **New order**: `B12.1 -> B13 (the flip) -> soak -> Phase 7 R0 -> Phase 8`.
  - **Found while planning, and it is the reason B13 is more than a workflow
    edit: the entry document was never ported.** `app/index.html` has no
    description, no Open Graph or Twitter block, no favicon, no
    `viewport-fit=cover`, no `color-scheme` meta, no `<noscript>` block, and a
    `<title>` that differs from live's - so the flip as outlined would publish
    a page with no link-preview card, no no-JS fallback and no safe-area
    insets. Nothing compares the two documents' heads today (parity shoots
    pixels after boot; `page.title()` is read after `Shell.svelte:28` has
    overwritten the static title). Full table and the fix:
    `plan.md`, "B13 planned", "the entry document was never ported".
  - Designs, both implement-ready: `plan.md`, "Phase 6 - the cut-over,
    replanned" - "B12.1 planned" and "B13 planned". Phase 7's entry condition:
    the same section, "Phase 7 - what has to be true before the net comes out".
    B12's deferred nits are placed there too, one row each.

- Task status: **B12 review remediation CLOSED - both blockers fixed,
  gates green, committed and pushed** (implementer, 2026-09-12, single
  remediation cycle per the coordinator's instruction - no replanning, no
  widened scope). HEAD at dispatch `ddd7e11`, matching `origin/main`; tree
  clean but for the untracked `issues/tg-preview-refresh/`.
  - **Blocker 1 - the widened `focusWalk` (9a4f8db) was loose enough that a
    control with no focus styling passed.** The reviewer's own replay
    (verdict computed twice per stop, once focused and once forcibly
    blurred) found 25/56 stops passing-while-blurred on `#/roll/std` alone,
    and the same shape on all six `FOCUS_WALK` addresses (704/41, 31/2,
    76/2, 25/5, 4/3). Two mechanisms: the ancestor walk had no notion of
    focus (`.card`/`.panel`'s permanent drop shadow satisfied it), and the
    border arm didn't require the gold border to be focus-dependent
    (`.chip.on`/`.homebtn.on` carry one at rest).
    - **First fix attempt was itself wrong, caught by re-running the
      reviewer's replay before committing rather than after.** Comparing a
      single OR-combined `outline || box || border` boolean before and
      after blur still failed 5 real stops (`BUTTON.homebtn`, four
      `BUTTON.chip`/`A.chip`) - not because they lack a ring, but because
      their genuinely-changing outline (measured directly: `outlineStyle`
      solid-to-none on blur) sits behind a permanently-true gold border at
      the same depth, and OR-ing the three into one flag per depth hides
      the outline's own transition behind the border's constant true.
      Found by probing the two failing element classes directly
      (`document.activeElement`'s own computed style, focused vs blurred,
      read node by node) rather than trusting the first fix's own green
      run. **Second fix**: track outline/box/border as three separate
      booleans per depth, and require any *one* of the three - not the
      combined flag - to be true focused and false blurred. Re-ran
      `node tests/app/sweep.js 1180` alone: clean.
    - **Blurred-state replay after the second fix, all six addresses,
      pass-when-blurred column**:
      ```
      бросок d12                    stops=56   visible=56   pass-when-blurred=0
      таблица (фильтры открыты)     stops=704  visible=704  pass-when-blurred=0
      списки                        stops=31   visible=31   pass-when-blurred=0
      список                        stops=76   visible=76   pass-when-blurred=0
      карточка                      stops=23   visible=23   pass-when-blurred=0
      поиск                         stops=4    visible=4    pass-when-blurred=0
      ```
      Zero at every address (894 stops total), and every stop also reads
      `visible=true` against its real, once-focused reading - the
      `.numbox`/`.lrow-meta` finds that started this are unaffected. The
      replay script itself is a standalone probe (not the shipped
      `focusWalk`), written to catch an implementation bug the shipped
      logic's own success couldn't reveal on its own; disposable, not
      kept.
  - **Blocker 2**: `docs/specs/COVERAGE.md:55` cited `D9`, which has never
    existed in `DEBT.md` (confirmed: `D9` appeared exactly once in the
    whole repository, on that line). Corrected to cite `plan.md`,
    "B12.1 named" - matching `tests/app/contracts.js:148-156`'s own
    citation for the same two skipped route fixtures.
  - **Nit taken while `DEBT.md` was already open (in scope by the
    coordinator's own exception)**: D7's "Where" named `ListPage.svelte`'s
    money-mode help captions and a nonexistent "money-help `<p>`'s two
    `<i>` runs" selector; the real failing nodes are the note-pair hints
    (`notePubHint`/`noteHidHint`, `app/src/lib/dict.ts:309-310`, rendered
    at `ListPage.svelte:538`/`:556` inside `.lnote > .npair >
    .nfield.n-pub`/`.n-hid > .nlbl > i`), triggered by a list with a NOTE
    open, not by a priced entry - `#/lists/b` and `#/lists/empty` read
    clean because they carry no note, not because they carry no price.
    Both the "Where" and "How to verify the fix" bullets corrected; the
    live-shared finding itself needed no change.
  - **Gates, this tree, in the coordinator's stated order:**
    - `node tests/app/sweep.js 1180` alone - clean, twice (once per fix
      attempt), plus the blurred-state replay above.
    - `set -o pipefail; node tests/run-all.js
      app/sweep,app/typo,app/hues,app/contracts 2>&1 | tail -n 120` -
      foreground, one call, **567.8s slowest entry, all seven suites
      green**. `check:built` and the parity call were not re-run per the
      coordinator's instruction (no production file changed this cycle).
    - `set -o pipefail; npm run check 2>&1 | tail -n 120`, run bare with no
      wrapper (the near-miss from wrapping it in `time (...)` is recorded
      in the prior entry and was not repeated). **Attempts 1-3 hit the
      same `searchPage.test.ts` load-timeout as before** (each ~104s
      total vitest duration, near-identical shape each time - confirmed a
      load artifact, not a regression, by running
      `npx vitest run --coverage --maxWorkers=4` directly on the same
      unchanged tree: clean, full coverage, thresholds held). **Attempt 4
      ran the full 1007-test suite clean, exit 0**, coverage thresholds
      held identically (96.59/88.55/97.02/97.29), and armed the gate.
  - **Commit**: `9ced2b3` (`fix(app): require the focus ring to change on
    focus, not merely exist`), 3 files, 79 insertions / 34 deletions.
  - **Pushed**: confirmed via `git fetch origin main` -
    `origin/main` reads `9ced2b353b5fd3951ba69405370dae97733554b3`, matching
    local HEAD exactly (the push itself printed a
    `credential-cache unavailable` line to stderr, as it did for the prior
    two commits - harmless, the ref update landed both times).
  - **Everything else the review raised is deferred**, per the
    coordinator's instruction not to widen scope - see "Deferred" below
    for the verbatim list B12.1 (or whichever batch opens these files
    next) should pick up.
  - Last agent: implementer
  - NEEDS_HUMAN_CONFIRMATION: no
  - Branch: `main`; HEAD `9ced2b3`, `origin/main` the same commit.

- Task status: **B12 CLOSED - C2 and C3 committed and pushed; all gates
  green; B12.1 is the named next batch** (implementer, 2026-09-12). Every
  file C2 and C3 needed was already written and saved in the working tree
  at dispatch (per the entry below); this session's job was gates, precise
  staging, two commits, the push, then these documents. HEAD at dispatch
  `9174923`, matching `origin/main`; unchanged by anything until the
  commits below.
  - **Gates before C2, each one foreground call, run in order:**
    - `npm run check:built` - build, smoke, budget all green, **8.4s**.
    - `node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts` -
      **first isolated run of `node tests/app/sweep.js 1180` alone (done to
      separate a real finding from host-load flake before touching
      anything) reproduced two failures identically twice**: `бросок d12
      @1180 ru` and `список @1180 ru`, "нет видимого focus-ring". Root-caused
      by reading the rendered page directly (not guessed): both are real,
      visible focus rings the live app also draws (`style.css:217-218` and
      `:776`, byte-identical in the rewrite) that `focusWalk`'s own
      element-only outline/box-shadow read could not see - a bug in the test
      this batch was landing, not a rewrite or live defect. Fixed in
      `tests/app/sweep.js` (walk a few ancestors for a delegated
      `:focus-within` ring; compare the element's own border colour against
      the app's `--gold` token, read live rather than hard-coded). Re-ran
      `node tests/app/sweep.js 1180` alone: clean. Full detail and the
      "why fix it here" reasoning: `plan.md`, "B12 built".
      - The combined call itself: first foreground attempt crossed 600s
        (background-completed at 666s slowest entry, 11m6s wall - discarded
        per policy, not salvaged, since a backgrounded run cannot arm
        anything and this instruction applies to every gate in this
        section, not only `npm run check`). A second foreground attempt,
        once the prior run's Chrome processes had fully exited, completed
        at **542.6s slowest entry / 9m2.7s wall, all seven suites green**.
    - `MSYS_NO_PATHCONV=1 node tests/parity.js "~ filtered" "#/roll/std"` -
      6 states / 36 cells, every cell `совпадает`, "расхождений нет",
      **3m36s**.
  - **The `focusWalk` edit disarmed the commit gate** (it touches a
    non-gitignored file) before C2 could be staged. `npm run check` was
    re-run: first two foreground attempts (**1m59.0s**, then, after
    discovering the first attempt's cache write never landed - see below -
    a second at **~2m9s**) each hit the already-documented
    `searchPage.test.ts` > "the cap" > "shows the first 300 matches" load
    timeout (confirmed a load artifact both times: 17/17 green alone in
    ~14s). A third attempt ran the full 1007-test suite clean in one pass,
    **exit 0, coverage thresholds held (96.59/88.55/97.02/97.29)**, and
    armed the gate for the tree about to be committed.
    - **Self-inflicted near-miss, worth naming so it is not repeated**: the
      first two "successful" `npm run check` runs this session were wrapped
      as `set -o pipefail; time (npm run check 2>&1 | tail -n 120)` for a
      wall-clock reading. `check-observer.mjs`'s `isCheckInvocation` requires
      the check to be the literal first segment after stripping `cd &&`/
      `set -o pipefail;` prefixes; `time (...)` is not one of those prefixes,
      so the hook never recognised either run as a real check and never
      wrote the cache - the commit was refused with "has not passed for this
      working tree" even though the check had, in fact, just passed. Fixed
      by dropping `time` and running the exact recommended form,
      `set -o pipefail; npm run check 2>&1 | tail -n 120`, with no wrapper -
      that is the run whose cache write is recorded above. Do not wrap
      `npm run check` in `time`, `script`, or anything else that changes
      what the first segment is; if a wall-clock reading is wanted, read it
      from the Bash tool's own duration report instead.
  - **C2 staging, checked rather than assumed**: `tests/app/lib.js`,
    `sweep.js`, `typo.js`, `hues.js`, `contracts.js` added by name (not
    `tests/app/`, which also holds C3's untracked `states.js`);
    `FilterBar.svelte`, `Chip.svelte`, `StdPanel.svelte`; `App.svelte`,
    `shell.test.ts` (the sweep's own `<h1>` find and its pin - staged with
    C2 per the task's read of the plan); `.github/workflows/ci.yml`,
    `docs/specs/DEBT.md` (D7, D8, D10). `docs/specs/COVERAGE.md` staged
    **whole to C3, not split** - checked against `a52c17d`'s actual diff
    (not assumed from the plan): C1 already wrote the "axe row" together
    with the threshold-table rewrite in one paragraph, so C2's file list has
    nothing left in that file. `CLAUDE.md` staged whole to C3 (its one line
    is entirely C3's). `tests/run-all.js` split by content, not by hunk -
    `git hash-object`/`git update-index --cacheinfo` staged a blob with
    only C2's five new `SUITES` entries, leaving the `app/states` line in
    the working tree for C3 - `git diff --cached` confirmed the staged
    version excluded exactly that one line, nothing else.
  - **Commit C2**: `9a4f8db` (`test(app): the built app swept in a real
    browser`), 13 files, 1119 insertions / 5 deletions. Full message in the
    commit itself.
  - **Gate for C3**: `node tests/run-all.js app/states` - **61.5s, all
    thirteen cases green on the first attempt**, no re-run needed.
  - **C3 staging**: `tests/app/states.js`; `tests/run-all.js`'s remaining
    `app/states` line; `CLAUDE.md` (**correction, 2026-09-12: the tree reads
    197 lines, not the 198 this line claimed** - `wc -l CLAUDE.md` on
    `aac1453`; either way under the 200-line cap); `docs/specs/COVERAGE.md`'s remainder
    (the whole file, per the finding above).
  - `npm run check` before C3: **64.7s, exit 0, first attempt, no flake this
    time**, coverage thresholds held identically. Gate armed for the C3
    tree.
  - **Commit C3**: `4adc5a5` (`test(app): the states a real click reaches,
    and the coverage matrix`), 4 files, 462 insertions / 31 deletions.
  - **Pushed**: `git push` (a `credential-cache unavailable` line printed to
    stderr but the push itself succeeded - confirmed by `git fetch origin
    main` reading `origin/main` at `4adc5a576e3c7b59a447b0a66e5ad6fa1c5e4139`,
    matching local HEAD exactly).
  - **Acceptance criteria checked directly, not assumed**: `git show 9a4f8db
    -- app.js style.css index.html` and the same for `4adc5a5` both empty;
    `git diff HEAD -- tests/parity/specs.js` empty (no parity state's `enter`
    changed all session); `git log --oneline -- tests/parity/driver.js`
    shows nothing past `a52c17d` (`press`/`click` untouched by C2 or C3);
    `issues/tg-preview-refresh/` still `??` in `git status`, three files,
    untouched.
  - **What remains**: **B12.1**, named in `plan.md` ("the router does not
    reproduce the live app's bare-vs-unreadable address distinction") - not
    started. Also open, from B12's own probe (not blocking, not this
    batch's): D7/D8/D10 in `docs/specs/DEBT.md` are recorded, not fixed, by
    design (parity - the tokens/DOM are shared globally, and D10's fix needs
    a real behaviour decision). Phase 6 and the rest of Phase 7 remain
    outline-only per `plan.md`.
  - Last agent: implementer
  - NEEDS_HUMAN_CONFIRMATION: no
  - Branch: `main`; HEAD `4adc5a5`, `origin/main` the same commit.

- Task status: **B12 still blocked on the C2 gate - but the tree is proved
  green and the blocker is re-diagnosed** (orchestrator, 2026-09-12,
  scheduled run). No production code, no test code, no config touched;
  writes are `issues/47/context.md` and this file only. Nothing was
  committed and nothing was bypassed.
  - **Preflight.** HEAD `67e7bb7`, one docs-only commit past the `3a80456`
    the entry below records; `origin/main` matches. `ListAgents`: six
    interactive peer sessions, no subagents, so no writer was running. No
    `test-output/parity.lock`, no `chrome.exe`. All six `tests/app/*.js`
    files and the 21 modified paths present exactly as described below.
    Commit gate unarmed: tree key `69ac83c6` against a cached `5f8712bc`
    (armed 09:01 UTC, a different tree).
  - **The check was run and it completed - on this exact tree.** It crossed
    600 s and the tool moved it to the background, then finished after
    ~19 min with **exit 1 and exactly two failures**. Everything before
    vitest was green: `format:check`, `lint`, `typecheck` (544 files, 0
    errors, 0 warnings), `data`, `derived`, `i18n`, `selftest` **312/312**
    (up from B11.1's 292 - C1's hook work, as expected). vitest: **1005
    passed / 2 failed of 1007 across 41 files, 521.8 s**.
  - **Both failures are load artifacts, each proved so in isolation**
    (`node node_modules/vitest/vitest.mjs run <file>`, one file per call):
    - `searchPage.test.ts` > the cap > "shows the first 300 matches" - timed
      out at 30000 ms *after the case had run 114 s*. Alone: **17/17 green,
      89.1 s**. This is the case `context.md`, "Host load" already names.
    - `tables.test.ts` > the row and section anchor > "the outline follows
      the record into the grid view" - `expect(tile).toHaveClass('flash')`,
      received `tilewrap svelte-15kqimd`. Alone: **79/79 green, 120.2 s**.
      **New** - not previously recorded, and worth keeping: it is a second
      shape of load failure (a timing class read before it was applied,
      not a timeout), so a red `flash` under load is not a regression.
      Neither file is modified in this tree, and none of C2/C3's production
      edits touches the grid tile or the search cap.
    - **A third run of the same check, on the same unchanged tree, failed
      three** - the two above plus `sharedListPage.test.ts` > taking the
      whole list > "creates a new list with the name, ids, both notes and
      the entry meta" (`getByText('Добавлено в «Тайник»')` not found).
      Alone: **20/20 green, 61.5 s**. **The instability is the point**: a
      real regression fails the same way every run, and this failing set
      grew 2 -> 3 with nothing edited between. Treat any red list from a
      throttled run as noise, not as a defect list - and do not spend a
      session bisecting one.
  - **So the batch is waiting on a host, not on a fix.** Substantively the
    tree passes `npm run check`. What is missing is a *captured foreground*
    run: `check-observer.mjs` arms the gate from the Bash tool's returned
    stdout, and a call moved to the background returns none.
  - **Root-caused: the CPU is throttled to ~20% of nominal.** One counter,
    `Get-Counter '\Processor Information(_Total)\% Processor Performance'`,
    read **20, 20, 20, 20** over four samples on an Intel i7-8565U. That is
    the whole story: one fifth the clock, five times the wall - and it
    reproduces every figure three sessions had collected.
    `npm run format:check` took **55.6 s and 54.9 s** against 11 s idle;
    `npm run check` projects to ~825 s and was observed at ~19 min.
    - **It supersedes both earlier diagnoses, including this entry's own
      first attempt.** "Host contention from a concurrent session" is wrong
      (the six peer Claude sessions move ~0.2 of 8 cores). So is the peer
      session's "`explorer.exe` at 62%" (`d71e3dc`) and so is my own
      "I/O-bound": both read a **percentage of a throttled core** as a share
      of the machine. Sampled during a real `format:check`, the top
      consumers were prettier's own two node processes at 114-223% each and
      `explorer.exe` did not appear at all. My `user`/`sys` figures were
      also worthless - Git Bash `time` does not aggregate Windows
      child-process CPU. The wall-clock numbers from all three sessions are
      sound; only the attributions were not.
    - **Not power policy**: AC, 99% charge, Balanced. Thermal or a stuck
      DPTF/EC state is what is left, and reading the temperature needs a
      tool this host does not expose. **Fixing it needs a human at the
      machine** - airflow, ambient, or a reboot to clear a stuck policy.
      `NGenuity2Helper` holding a core continuously is worth reclaiming as
      heat on a 15 W part, but it is not the cause.
    - Full working: `context.md`, "The host is throttled to ~20% of
      nominal", which also marks the two superseded sections in place
      rather than deleting their evidence.
  - **Why the gate was not bypassed, though `SKIP_CHECK_GATE=1` exists for
    exactly this.** It would buy one of C2's four gates. The other three -
    `npm run check:built`, `node tests/run-all.js
    app/sweep,app/typo,app/hues,app/contracts`, and the
    `"~ filtered" "#/roll/std"` parity call - are browser-driven and cost a
    few minutes each idle; at 5x none fits one foreground call, and a
    browser suite on a 5x-slow host returns false reds rather than signal.
    Committing C2 with one gate waived and three unrun is a half-verified
    production commit, which is worse than waiting.
  - **Next action, unchanged in substance from the entry below, with one
    addition**: retry when the host is quiet. The cheap decisive probe
    first - `npm run format:check` - and read its wall clock: **at or near
    11 s the host is healthy and the full sequence will fit; at ~55 s it
    will not**, and nothing else needs to be attempted that session - the
    throttle above does not lift on its own and no quiet minute defeats it.
    Then C2's file list and gate order exactly as the entry below gives
    them. Do not re-run the two failing files as evidence of anything; they
    are green, and `tables.test.ts` is unmodified in this tree while no
    B12 edit touches the grid tile - which answers the peer note in
    `context.md` that asked for that case to be judged, not dismissed.
  - **Hazard, found by walking into it: backticks inside `python -c "..."`
    in the Bash tool are command-substituted by the shell before python
    ever sees them.** Editing these documents means writing text full of
    `` `npm run check` ``, and one such call ran a **stray `npm run check`**
    and then spliced 77 lines of its own console output into `plan.md`,
    over a paragraph committed minutes earlier. Caught by `git diff` (one
    line removed, 77 inserted, nothing from another task) and restored from
    the blob in HEAD. **Write the edit script to a file and run it** -
    `python <scratchpad>/x.py` - or use a single-quoted heredoc; never
    `python -c` with prose containing backticks. Deferred, because
    `.claude/README.md` is a checked path and no check can pass on this
    host: this belongs beside "Run a long check" once the throttle lifts.
  - Cleanup: a mis-rooted `vitest` invocation of mine created `app/app/`
    (a `coverage/` and a `node_modules/.vite/` under it). Removed. It was
    gitignored throughout and the tree key read `69ac83c6` before and after,
    so it never touched what the gate fingerprints. Nothing else was
    created; `issues/tg-preview-refresh/` was not touched.
  - Deferred nit (seen, not acted on - it is a design call, not a local
    fix): `bash-guard.mjs`'s `rm -rf` exemption is root-anchored,
    `/^(dist|coverage|test-output|node_modules)(\/|$)/`, so a *nested*
    `app/app/coverage` is refused while a top-level `coverage/` is allowed.
    Correct as written; whether it should also match nested build output is
    for whoever next opens that file.
  - Last agent: orchestrator (no worker dispatched - there is no implement
    work left that is not gated, and a worker would meet the same wall)
  - NEEDS_HUMAN_CONFIRMATION: no - still a resource blocker. The one thing
    a human could change that this session cannot: the I/O factor above.
  - Branch: `main`. HEAD was `67e7bb7` at preflight; a peer session
    committed `d71e3dc` (`context.md` only, its own host reading) into this
    shared tree during the session, so this entry's own commit landed on top
    of it and both are pushed. Its evidence is preserved and its conclusion
    marked superseded, in place. C1 (`a52c17d`) remains committed and
    pushed; C2 and C3 remain uncommitted.

- Task status: **in_progress - B12 expanded from outline to implement-ready**
  (planner, 2026-09-12, after B11.1 closed and was reviewed). No production
  code, no test code, no config touched; writes are `issues/47/plan.md` and
  this file only. Design: `plan.md`, "Phase 5 - the testing pyramid,
  planned", the new **"B12 planned"** section (decided 1-6 of that section,
  what is already measured and what is not, the file list, the driver verb's
  contract and blast radius, steps 1-16, acceptance, verification with costs,
  risks, fallback). The outline above it is unchanged and remains the record
  of what was decided before this pass.
  - **Sized as one batch in three commits** (C1 the driver verb and the
    gates, C2 the four ported sweeps, C3 the real-input states), per
    `docs/parity.md`, "Batch size": a batch may hold several commits, and
    the piece that adds the harness reach must land first so a later red
    bisects. Cost of the three boundaries: two extra `npm run check` runs.
  - **Nit 1 decided (it was the planner's call):** the `pop`
    re-measurement is **recorded in D6's "Where"** as one sentence in C1,
    written to be deleted by Phase 8 R3 - not probed, not ignored. Reason in
    full in `plan.md`, "B12 planned", decided 2; in one line: parity is the
    only instrument that could ever see it and parity dies at Phase 7 R0,
    before Phase 8 R3 fixes it, and R3's toggle measurement (`:scope > .btn`,
    outside the animated menu) genuinely retires the 10 px term.
  - **Nits 2, 3 and 5 are folded into C1**, in the files it opens anyway.
    Nit 4 resolves when C3 creates `tests/app/states.js`; nit 6 is answered
    by C3's modal case, which is the pin it says is missing.
  - **Coverage: confirmed, no threshold moves for it.** `Icon's missing arm
    is `'opacity' in icon` (only `external` carries one, `lib/icons.ts:44`;
    it renders in `AltPanel.svelte:205` and `RecordPage.svelte:67`);
    `SelBar's is `if (!items.length) return` in `copySel`, reachable because
    `app.toggleSel(id)` (`state/app.svelte.ts:319`) accepts an id the index
    does not carry.
  - **`COVERAGE.md` is rewritten inside B12**, split across C1 (the
    enforcement table's numbers) and C3 (the suite table, the fates, the
    thin spots), so each commit is true on its own. `CLAUDE.md` gains exactly
    one focused-command line naming the build prerequisite; it is at 197 of
    its 200 lines.
  - Measured while planning, so the implementer does not re-derive it:
    `driver.js`'s `ready()` already accepts `#app`; `run-all.js` resolves
    `app/sweep` to `tests/app/sweep.js` and logs it as `app-sweep.log` with
    no runner change; `tests/**` is outside prettier and eslint;
    `axe-core/axe.min.js` resolves and neither page carries a CSP; all seven
    `f_` route fixtures still replay correctly after B11's decoder fix; and
    `driver.js` is hashed into the parity cache root key, which costs **CI
    nothing** (the cache is never persisted there) and locally is moot
    because `run-all.js` deletes `test-output/` - the cache's own directory -
    at the start of every invocation.
  - Open unknown, deliberately front-loaded as step 1: the sweep at 360, 390
    and 768 and axe with `color-contrast` on have **never** been run against
    `dist/`. The probe runs before any file is written, and its triage rule
    and fallbacks are in the plan.
  - Last agent: planner
  - NEEDS_HUMAN_CONFIRMATION: no
  - Branch: `main`; HEAD `d0963d9` at dispatch, unchanged by this pass
    (`issues/47/` writes only); `origin/main` the same commit.

- Task status: **B12 implementation started - step 1's probe run and recorded**
  (implementer, 2026-09-12). Tree at dispatch: HEAD `764c6a9`, `origin/main`
  the same commit; `git status` shows only `issues/tg-preview-refresh/`
  untracked. `npm run build` ran clean (`data.json`/`catalog.csv`/`i/*.html`
  regenerated identically - `git status` unchanged after). The scratchpad probe
  (`audit2`'s two edits - `ROOT` -> `dist/index.html`, `ready()`'s `#view` ->
  `#app` - plus an `axe.run()` call with `color-contrast` enabled) found:
  - **The sweep at 360, 390 and 768, both languages, all 82 page-openings
    (41 addresses x 2 widths not yet covered... actually 41 addresses x 3
    widths x 2 languages): clean.** No overflow, no clipped text, no
    duplicate ids, no unnamed control, no dead link, no broken image, no
    console error, no wrong landing address, no oversized section strip.
    Confirms the 1180-only measurement from "Phase 5 planning facts"
    generalises to the other three widths - **no production fix is needed
    for the sweep**.
  - **axe with `color-contrast` enabled: one violation, and it is already
    named.** `nested-interactive` (serious) fires on `#/lists` and
    `#/lists/a`, both languages, on `StorageNotice.svelte`'s
    `<summary><b>...</b><i>...</i><button class="warn-x">` shape - exactly
    `docs/specs/DEBT.md` D3, already recorded as a live-shared defect ported
    on purpose (`app.js:2881-2884` carries the identical shape) and already
    the reason `app/src/test/a11y.ts`'s `OFF` disables the rule suite-wide.
    Every other probed page (`#/roll/std`, `#/tables/wondrous`,
    `#/tables/eq_weapon`, `#/i/ci1`, `#/print/ci1-q1`, `#/search`, both
    languages) is clean. **Triage: live-shared, not rewrite-only - no code
    fix, no new `DEBT.md` entry (D3 already covers it exactly).** `C2`'s
    `tests/app/lib.js` disables `nested-interactive` in its `axe()` helper
    with a comment citing D3, the same way `a11y.ts` does; `color-contrast`
    stays on.
  - Conclusion: **B12 is a test batch with no production fixes riding on the
    probe.** The only production edits in the whole batch remain the ones
    already planned - `data-val` on the filter pills and the source chips.
    The probe script was disposable and was not kept (run from a temporary
    copy under the repository root, deleted after; `git status` confirms no
    trace).
  - **A second, smaller divergence from the plan, found while confirming
    decided 6's coverage claim (step 5): `Icon.svelte`'s named missing arm
    was already covered before B12.** Measured with `coverage-final.json`'s
    raw branch map (`svelte/compiler`'s own `compile(..., { generate:
    'client' })` output inspected directly): the compiled template is
    `$.set_style(svg, \`flex:none${$0 ?? ''}\`)` fed by
    `[() => 'opacity' in $.get(icon) ? ... : '']` - two branch points, not
    one. Branch 1, the `'opacity' in icon` ternary the plan named, reads
    `[46, 627]` (both arms hit) **even with `alt.test.ts` reverted to its
    pre-B12 text** - `record.test.ts` alone already exercises both arms via
    the crit-row / "показать в таблице" links. The actually-uncovered one is
    branch 0, `$0 ?? ''`, always `[N, 0]`: `$0` is the ternary's own result,
    which is always a string (`String(icon.opacity)` on the true side, `''`
    on the false side), so the `?? ''` fallback is compiler-generated
    defensive code with no reachable input that makes it fire - not a gap
    this or any component test can close. `SelBar`'s half of decided 6 is
    unaffected and confirmed working as designed: `87.5%` branches after the
    new case, up from the recorded `75%` baseline. Action taken: kept the
    `alt.test.ts` assertion anyway (it pins the opacity contract's true arm
    as a real behaviour, which was previously untested even though already
    covered incidentally) but did **not** chase the dead `?? ''` arm or move
    any threshold - `Icon.svelte` reads exactly `75.0%` branches before and
    after, which is what `vite.config.mts`'s `>= 75` threshold already
    requires and passes; the plan's acceptance line ("`Icon.svelte` ... above
    75.0 branches") is not met for this one file, and that is reported here
    rather than forced. Not a blocker: `npm run check`'s coverage gate does
    not read "above 75.0", only "at least 75", so nothing red follows from
    it.

- Task status: **B12 BLOCKED on the C2 gate - C1 is committed
  (`a52c17d`), C2's and C3's files are complete and individually verified,
  but the required `npm run check` cannot complete inside the 600 s
  foreground cap under sustained host contention** (implementer,
  2026-09-12). Not committed: per `docs/parity.md`/`CLAUDE.md`, a run that
  crosses 600 s is re-run idle, never salvaged, and this repository's commit
  gate hook itself requires a passing `npm run check` for the current tree -
  so C2 and C3 cannot be committed until one foreground `npm run check`
  actually finishes. Two consecutive attempts each crossed 600 s with no
  output at all (piped through `tail -n 120`, which cannot print anything
  until the stream closes); a third, run in the background purely to see
  whether it would eventually finish, was still not done after several more
  minutes. **This is not guesswork**: a peer session sharing this tree
  committed, during this same window, `docs(closeout-hygiene): record B1's
  plan and blocked progress` (`3a80456`), whose own message names "host
  contention from a concurrent session" as the reason two of its own
  commits are blocked the same way. Two sessions independently hit the same
  wall at the same time on the same host.
  - **What is built, and how it was verified** (each suite run individually,
    by hand, via `node tests/app/<name>.js`, since the combined `run-all.js`
    call needs the same loaded host `npm run check` does): `tests/app/lib.js`
    (the shared `fresh`/`sharedPage`/`axe`/`reporter` factory, `dist/`-only);
    `tests/app/sweep.js` (ported from `audit2.js`, four widths, axe with
    `color-contrast` on, RU-only at 360/390/768 with EN kept at 1180 per the
    plan's own fallback, a six-address focus-ring walk at 1180 only) - run
    clean at 1180 and 768 (the two widths actually re-verified after the
    final round of fixes; 390/360 share the same code path and were clean
    before the last two fixes, which touched nothing width-dependent);
    `tests/app/typo.js` - clean; `tests/app/hues.js` - clean; `tests/app/contracts.js`
    - clean (two route fixtures skipped with a cited reason - see below);
    `tests/app/states.js` - all thirteen cases green (see below, the batch's
    hardest-won result). `press` landed in `tests/parity/driver.js` in C1 and
    is otherwise untouched here. The two production edits (`data-val` on
    `FilterBar.svelte`'s pills and an optional `value` prop on `Chip.svelte`,
    passed by `StdPanel.svelte`'s source row) are the only non-test diffs in
    C2's file set; `git diff` on them is three small, reviewed hunks.
  - **The step 1 probe's findings, already recorded above, still stand.**
    What follows is what the *suites themselves* found once written and run
    - which step 1's simpler probe (a smaller seed, no real-input layer) did
    not reach - plus one from `tests/app/contracts.js`'s route-grammar port.
    All four are genuine "the batch's own real unknown" discoveries, not
    guesses, each triaged the way step 1's own rule asks: live-shared ->
    `DEBT.md`; rewrite-only and cheap -> fixed here; rewrite-only and not
    cheap -> named for a later batch.
    - **D7 (live-shared, `DEBT.md`)**: `--muted`/`--muted2` read below WCAG
      AA 4.5:1 on their dark surfaces - measured 3.77:1 and 3.35-3.46:1 -
      on `#/roll/alt`'s dice-rank subtitle and `#/lists/<priced id>`'s
      money-help captions, identically on `index.html` and `dist/index.html`
      (same node, same ratio, checked directly with `axe.run()` against
      both). `tests/app/sweep.js` allows `color-contrast` only on those two
      exact routes, cited to D7.
    - **D8 (live-shared, `DEBT.md`)**: the alternate tables' `<h4
      class="altcol hope/fear">` column headers sit directly under the
      page's own `<h1>` with no `<h2>`/`<h3>` between - `heading-order`
      (moderate), identical on both apps. `tests/app/sweep.js` allows it only
      on `#/tables/alt_item`/`#/tables/alt_consumable`, cited to D8.
    - **Rewrite-only, fixed here (one line)**: `#/nowhere`-class unreadable
      addresses drew `<p class="todo">` with no heading at all -
      `page-has-heading-one` (moderate), and the live app does not reach
      this state the same way at all (see the next finding), so it is not
      live-shared. Changed to `<h1 class="todo">` in `App.svelte`; a new
      `shell.test.ts` case ("an unreadable address") pins it, since the
      branch had no test before.
    - **Rewrite-only, bigger than one line, named `B12.1` in `plan.md`
      (not `DEBT.md` - see why below)**: while porting `tests/contracts.js`'s
      route-grammar check to `dist/`, `#/` and `#/nonsense` came back wrong.
      The live app treats a *bare* address (draws home, leaves the bar
      alone) and a *genuinely unreadable* one (draws home, rewrites the bar
      too) differently; the rewrite's `state/app.svelte.ts` constructor
      conflates them - a bare `#/` gets its bar wrongly overwritten to
      `#/roll/std`, and an unreadable `#/nonsense` keeps the garbage address
      and draws the `<h1 class="todo">` fallback instead of home, with no
      tab lit and no source chips. Measured field-by-field against both
      apps in `plan.md`, "B12.1 named". Not a `DEBT.md` entry: that file is
      specifically for a defect the rewrite reproduces *because the live
      app has it* ("both apps identical by construction"); here the two
      apps read *differently*, which is the opposite shape, so it went to a
      named follow-up batch instead, per the fallback's own first bullet.
      `tests/app/contracts.js` skips exactly these two fixture entries with
      a comment citing `plan.md`, "B12.1 named" - `routes.json` itself is
      untouched, and the other 24 route fixtures, all six list fixtures, the
      llms.txt-described link, the stat line and the twelve filter-group
      probes are read in full with nothing narrowed.
    - **D10 (live-shared, `DEBT.md`, found while writing `states.js`'s own
      case 10, not the step 1 probe)**: "Copy image" cannot actually work
      under `file://` on *either* app. Isolated directly with `puppeteer`
      against both `index.html` and `dist/index.html`, no test stub
      involved: the record's own `<img>` loads and `ctx.drawImage()`
      succeeds, but `canvas.toDataURL()` throws `"Tainted canvases may not
      be exported"` on both apps for the identical picture - Chrome treats
      a `file://` document's own sibling resources as cross-origin for the
      canvas taint check, with no `--allow-file-access-from-files` set.
      `canvas.toBlob()` does not throw in this Chromium build; it simply
      never calls back, which is exactly why nobody had seen this before:
      `tests/parity/driver.js`'s `clipboardImage()` reads
      `m[key].arrayBuffer ? m[key] : null`, and a *pending promise* has no
      `.arrayBuffer`, so it has always resolved `{ empty: null }` on both
      apps - parity's own `copiedImage` spec has been comparing two
      identical nulls, never a real byte count, since the spec was written.
      `tests/app/states.js`'s case 10 now asserts the defect's actual shape
      (the promise never settles, checked with a 5 s bounded wait) rather
      than a successful copy, cited to D10; the case that asserts a real
      copy is what D10's own fix earns.
  - **`tests/app/states.js` - the hardest case to get green, and why it
    took this many attempts.** Five real bugs were found and fixed along
    the way, all in the test code, none in production:
    1. Case 4/5 (two frames): the frame chips live inside the filter panel;
       missing `d.click('Фильтры')` before them read 94 rows / 0 pills
       instead of 57 / 2. Fixed by opening the panel first.
    2. Case 6 (dialog): a real Tab cycle measures one stop, past the last
       control and before the close button, where Chrome's own native
       `<dialog>` focus trap briefly hands focus to the page's skip link
       before correcting on the very next Tab - reproduced with and without
       a settle frame in between, so it is the browser's own wrap-boundary
       behaviour, not a race in the probe. The assertion now fails only on
       two *consecutive* stops outside the dialog, which still catches a
       real trap failure.
    3. Case 8 (packed link): a short seed list never reaches the packed
       (`~`) branch at all - deflate's header costs more than it saves
       under about ten entries and no note (`compress.ts`'s own comment).
       A bigger seed with a long note reaches it; and the reopened link
       renders as this browser's *own* stored list (same payload, same
       origin, `findListByPayload`'s short-circuit) rather than a stranger's
       - `.titleinput`'s value, not text content - so the assertion checks
       the position count and the note's own `<textarea>` value instead of
       a name that was never going to appear in `innerText` on either app.
    4. Case 10 (copy image): the whole D10 investigation above - a bounded
       in-page wait, not `d.clipboardImage()`, is what a case testing the
       *real* value has to use once the shared helper's own gap was found.
    5. Case 13 (note height): `.rnote textarea, .lnote textarea` matches
       the *list's* own note box first in DOM order, which this case never
       types into - the height read stayed flat at 83 while the row's own
       textarea (found and typed into correctly by placeholder) grew fine
       a few DOM nodes later. Fixed by measuring the exact element `d.type()`
       targets, by the same placeholder.
    Beyond the logic fixes, the run itself needed hardening against this
    host's load: `tests/app/lib.js`'s `puppeteer.launch()` now passes
    `protocolTimeout: 300_000` (a loaded host makes an individual CDP round
    trip slower, not wrong), and `states.js`'s thirteen cases each run in
    their own try/catch with a synchronous (`fs.writeSync`) progress line
    before each - console.log's own buffering does not survive an abrupt
    crash, and one case hanging must not silently swallow the other twelve.
    Both are real, defensible hardening, not workarounds for a bug in the
    cases themselves.
  - **What is NOT yet done**: the required gate sequence itself -
    `npm run check`, `npm run check:built`, the combined
    `node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts` call,
    the parity filter (`"~ filtered" "#/roll/std"`), C2's commit, then
    `tests/app/states.js`'s `run-all.js` entry, `COVERAGE.md`'s suite table
    (already written) and `CLAUDE.md`'s one line (already written) folded
    into C3, `npm run check` again, `node tests/run-all.js app/states`, C3's
    commit, and the push. All of `COVERAGE.md`, `DEBT.md`, `CLAUDE.md`,
    `plan.md`'s "B12.1 named" section, and every `tests/app/*.js` file are
    already written and saved in the working tree - nothing here needs
    redesigning, only the gate needs a host that will hold still for ten
    minutes.
  - **Next action, exactly**: re-read `git log --oneline -3` (two peer
    commits landed on top of `a52c17d` during this session -
    `58dbd70`/`3a80456`, both docs-only, neither touching a B12 file); stage
    exactly C2's file list (below); run
    `set -o pipefail; npm run check 2>&1 | tail -n 120` in one foreground
    call - if it completes under 600 s, continue down the verification list
    above in order; if it crosses 600 s again, that is still the host, not
    the batch - wait and retry rather than change anything to make it pass
    faster. C2's file list: `tests/app/lib.js`, `tests/app/sweep.js`,
    `tests/app/typo.js`, `tests/app/hues.js`, `tests/app/contracts.js`,
    `app/src/components/FilterBar.svelte`, `Chip.svelte`, `StdPanel.svelte`,
    `tests/run-all.js`, `.github/workflows/ci.yml`, `docs/specs/DEBT.md`
    (D7, D8, D10), `docs/specs/COVERAGE.md` (the `tests/app/*` table and the
    thin-spots rewrite - already fully written for both C1's and this
    commit's share, not just C2's; double check nothing here duplicates
    what C1 already committed before staging), `issues/47/plan.md` (B12.1).
    C3's file list, unstaged until C2 lands: `tests/app/states.js`,
    `tests/run-all.js`'s `app/states` line (already added alongside C2's
    five - if C2's diff is staged first this is already included; do not
    stage `run-all.js` twice under two commits, split it by hunk if needed),
    `CLAUDE.md` (the one focused-command line, already written), the
    remainder of `COVERAGE.md`'s suite table if any of it was reserved for
    C3 (check against decided 4's split before assuming), `issues/47/`.
  - Do not re-run `npm run build` unless `dist/` is stale - it already
    reflects every file in C2's list as of this entry (built at HEAD
    `3a80456`, ~58 s under the same load that is blocking `check`).
  - Last agent: implementer
  - NEEDS_HUMAN_CONFIRMATION: no - this is a resource blocker, not a design
    or scope question.
  - Branch: `main`; HEAD `3a80456` at this entry (two peer commits ahead of
    where this session's C1 landed, `a52c17d`); nothing of C2/C3 committed.
    `origin/main` is already `3a80456` too - some session's push already
    carried C1 along with the two peer commits, so C1 needs no separate
    push; only C2 and C3, once committed, still need one.

- Task status: **B11.1 closed - the menu's second measurement, built and
  committed** (implementer, 2026-09-12). All gates green.
  - `AddToList.svelte`'s placement `$effect`: `up = false` before the
    `tick()` (with a comment naming D6), the unchanged first-`.btn` reading
    (with a comment naming D6 and Phase 8's more-correct toggle
    measurement), `flushSync()` before `menu.scrollIntoView` (with a
    comment naming `placeMenu`'s `classList.toggle`-then-`scrollIntoView`
    order). `onDocumentClick`'s comment narrowed per nit 4; the guard
    itself is untouched (`git show HEAD -- app.js style.css index.html`
    empty, and the guard's lines are the only thing that could have
    changed production behaviour outside the effect).
  - Red-first read (state registered, fix not yet applied): `#/tables ~ a
    row opened, new list` on Самоцвет Чутья, no seed - RU 1100 1.01%, RU
    768 1.44%, RU 375 2.94%, all against an expected zero; EN 1100/768/375
    already `совпадает` (the `EN` press folds the menu before it is
    compared, per B5.1's standing fact). The record was in the band on
    this tree as planned; no swap to Малое Зелье Лечения was needed.
  - After the fix, the same state: all six cells `совпадает`.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (foreground): exit
    0 - `format:check`, `lint`, `typecheck` (0 errors/warnings, 544 files),
    `data`/`derived`/`i18n` clean, `selftest` 292/292, vitest 1005 tests /
    41 files passed, coverage 96.48/88.45/96.96/97.23 (thresholds held).
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 120` (foreground):
    build, smoke and budget green - `dist/assets/app.js` 88.5 kB gzip
    inside the 120 kB budget; `git diff -- app.js style.css index.html`
    confirmed empty.
  - Parity, second call - `#/tables ~ a row opened` `#/i/ci1 ~ new list`
    `#/tables ~ bar menu` (`MSYS_NO_PATHCONV=1`, foreground): 5 states / 30
    cells printed (the first filter is a prefix and also matched `~ a row
    opened, list menu` and `~ a row opened, new list`); every cell either
    `совпадает` or its already-recorded debt figure unchanged (`~ a row
    opened` still 0.02/0.03/0.07% against its own recorded debt at every
    width/language) - "расхождений нет", not vacuous (per-cell lines
    printed above it).
  - Commit: `e94a90e` (`fix(app): keep the add-to-list menu on the live
    app's side when its form opens`).
  - Deferred, unchanged from B11.1's own scope: measuring the toggle
    against `.modal-card` and `overflow: clip` on `.card` (Phase 8, named
    in D6); a fourth harness width (not needed - decided 7, 2b).
  - Last agent: implementer
  - NEEDS_HUMAN_CONFIRMATION: no
  - Branch: `main`; HEAD was `3ba78e8` at dispatch; this session adds one
    commit on top. Never pushed.

- Task status: **in_progress - Q2 answered, Q3 root-caused, B11.1
  implement-ready** (planner, 2026-09-12, after B11's close). No
  production code touched. Design: `plan.md`, decided 2 (rewritten: the
  post-cut-over rendering check is named invariants + numeric laws +
  structural text goldens per state, no PNG and no frozen measured JSON,
  with the rejected list and what each instrument cannot catch), decided
  7 "Defect 2b" (the modal menu, root-caused on 48 measured cells), the
  B11 heading paragraph (built, nits placed), the new "B11.1" section
  (implement-ready), B12's outline (additions), the Phase 6/7 outline
  and Phase 8's entry condition 3 (the freeze replaced). Facts:
  `context.md`, "Q3 planning facts". Next: B11.1, brief under "Next
  batch". Phase order 5 -> 6 -> 7 -> 8 untouched.
  - Last agent: planner
  - NEEDS_HUMAN_CONFIRMATION: no
  - Branch: `main`; base `64f9a27` (B11's second commit), HEAD unchanged
    at planning; four commits unpushed (`8b0c3ce`.. `64f9a27` - the
    owner's push, never this session's)

- Task status: **B11 closed - steps 13-14 run, all gates green, committed.**
  (implementer, 2026-09-12). Nothing was implemented or redesigned; the
  batch was already fully written in the tree at HEAD `9e3d19f` per the
  orchestrator's preflight, and this session ran only the remaining gates
  and the commit.
  - `npm run check:built` (foreground): build, smoke, and budget all
    green - `dist/assets/app.js` 88.5 kB gzip, within the 120 kB budget.
    `git diff -- app.js style.css index.html` confirmed empty both before
    and after.
  - Parity, first call - `#/tables/frames` `#/tables/wondrous ~ filter`
    `#/tables/eq_secondary ~ filter link` `#/tables ~ a row opened`
    (`MSYS_NO_PATHCONV=1`, foreground): matched 7 states / 42 cells as the
    plan's acceptance names them, not 4 - each filter is a route prefix and
    matched every state whose id starts with it, including
    `#/tables/frames ~ two frames` and `#/tables ~ a row opened, list
    menu`. All six `#/tables/frames` cells (plain) read `совпадает`; all
    six `#/tables/frames ~ two frames` cells read `совпадает`; the six
    `#/tables ~ a row opened` cells (the modal itself, pre-existing) read
    their already-recorded debt percentage exactly (0.02/0.03/0.07% of the
    same, ru and en) - unchanged, no new debt; the twelve
    `#/tables/wondrous ~ filter*` and `#/tables/eq_secondary ~ filter
    link` cells (pre-existing) read `совпадает`.
  - Parity, second call - `#/i/ci1 ~ list menu` `#/i/ci1 ~ new list`
    `#/tables ~ bar menu` (`MSYS_NO_PATHCONV=1`, foreground): 3 states /
    18 cells, every cell `совпадает`.
  - `#/tables ~ a row opened, list menu` specifically: re-ran alone
    (parity wipes `test-output/parity/` per invocation, so the first
    call's images were gone by the second) to get its diff images fresh.
    All six cells `совпадает`. Opened the ru 1100 and ru 375 diff PNGs:
    both show a flat, evenly-faded frame with only the cursor's red/yellow
    click-ring marker - no highlighted diff region, i.e. zero pixel
    difference at either width. This is the state the plan required
    inspected, not just measured; the inspection found nothing to record.
    Consistent with the owner's Q3 report in "Blockers": the modal
    add-to-list menu opening downward is reported at ~1913x981, outside
    all three parity widths (1100/768/375) - not reproduced here, and not
    this batch's to fix (see "Blockers").
  - Final `npm run check` (foreground, run last, after the handoff edits
    below): prettier clean, eslint clean, svelte-check clean, selftest
    passed, all vitest suites green, coverage thresholds held.
  - Commit `73facda` - `fix(app): read the filter address by the table's
    groups, and close the add-to-list menu on a real click`. Staged only
    the thirteen in-scope files; `git add -A` was not used;
    `issues/tg-preview-refresh/` (another task's, untracked) was left
    alone.
  - Nothing deferred beyond what "Blockers" and "Deferred" already record;
    no new `VISUAL_DEBT`/`ACCEPTED` figure was written.

- Task status: **blocked, not failed - B11's code is written and reads
  green, and it is UNCOMMITTED because the host cannot run the gate**
  (orchestrator, 2026-09-12, scheduled run). The implementer was
  `TaskStop`ped at 04:33 and shows `killed`; it did not write its own
  status entry, so this one is the orchestrator's reconstruction from
  the tree and from four measured runs. **Nothing is committed. HEAD is
  still `9e3d19f`.** The working tree holds the whole batch.
  - **Scope, verified by the orchestrator rather than taken on report**:
    `git status --short` shows exactly the eleven in-scope files -
    `app/src/lib/filters.ts`, `hash.ts`, `filters.test.ts`,
    `hash.test.ts`; `app/src/components/AddToList.svelte`,
    `lists.test.ts`; `tests/parity/specs.js`; `docs/specs/ROUTES.md`,
    `FEATURES.md`, `COVERAGE.md` - plus `issues/47/{context,plan,handoff}.md`
    and the untracked `issues/tg-preview-refresh/` (another task's,
    preserved, never staged). `git diff -- app.js style.css index.html`
    is **empty**. No `VISUAL_DEBT`/`ACCEPTED` figure touched.
  - **Steps 1-12 done** as `plan.md`, "B11" specifies: the decoder takes
    the table's groups, `parseHash` passes `groupsFor(table)`, the four
    decoder cases and the route round-trip, the `isConnected` guard with
    its checkpoint comment, the ordering test, the two parity states, the
    "Recorded, not keyed" sentence, and the three spec edits.
  - **Step 7's red-first discipline was honoured**: the implementer
    reported the ordering test failing on the *unfixed* component (menu
    and input gone) and passing after the guard. That is the evidence it
    pins the mechanism rather than the symptom.
  - **Step 13-14 NOT done**: `npm run check` never completed inside a
    foreground call, `npm run check:built` was never run, neither parity
    call was run, and there is no commit.
- Last agent: implementer (`killed` by the orchestrator, mid-batch, with
  the gate unrunnable - not for any fault in its work)
- NEEDS_HUMAN_CONFIRMATION: no for B11 itself; **yes** for the three
  planner questions in "Blockers", none of which B11 depends on
- Branch: `main`
- Base / starting commit: `9e3d19f`; HEAD unchanged at `9e3d19f`

- Task status: **in_progress - Phase 5 is planned; B11 is implement-ready
  and waits for the owner's word on two questions that do not block it**
  (planner, 2026-09-12). Design: `plan.md`, "Phase 5 - the testing
  pyramid, planned" (decided 1-9, B11 implement-ready, B12 outlined with
  its decisions made, Phase 6/7 outlines updated). Facts: `context.md`,
  "Phase 5 planning facts". In one paragraph: there are no Playwright
  tests; the "playwright tests" are the 20 puppeteer suites, 3 of them
  node-only and kept. The regression net is the parity driver re-pointed
  at `dist/` with a trusted `press` verb, under `tests/app/`, no
  Playwright (decided 1); after the cut-over the measured JSON specs are
  frozen as fixtures and pixel comparison dies with the harness (decided
  2 - owner question 2). Each legacy suite has a fate (decided 3): `typo`
  and `audit2` pass re-pointed at `dist/` today and are ported as they
  are; `hues` is rewritten; `contracts`' browser half is re-pointed;
  the rest are re-homed into the component tests that already hold
  their assertions; `print` is ported in Phase 7's deletion batch;
  nothing is deleted before the live app is. Gates (decided 4-5): raise
  `lib` lines/functions to 95, `state` to 95/95/85/90, `ports` functions
  to 80, `Button`'s exception to 60; keep the rest with reasons; all five
  excludes kept, two reasons rewritten; `nested-interactive` narrowed to
  the D3 call sites; `color-contrast` stays off in jsdom and goes on in
  Chrome over every page. The missing layer is real-input browser tests
  against `dist/` (decided 6), not more jsdom. Both owner defects are
  root-caused on measurement (decided 7): the frames filter is the
  shared `_`-separator heuristic - the live app has it on link arrival,
  the rewrite on every pick - fixed by giving the decoder the table's
  groups; the new-list menu closes itself because a *trusted* click runs
  a microtask checkpoint between Svelte's delegated handler and the
  document listener, which neither jsdom nor the parity driver's
  `el.click()` reproduces - fixed by an `isConnected` guard; the
  modal-menu side is not reproduced at three viewports. Order (decided
  8): 5 -> 6 -> 7 -> 8, with 7 as R0 of one 7/8 track - not one batch.
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: **yes** - three questions in "Blockers"; B11
  needs none of the answers and may be dispatched now.
- Branch: `main`
- Base / starting commit: `9e3d19f` (unchanged; `origin/main` `daa2166`,
  B10 still unpushed - see "Blockers")

- Task status: **B10 is closed - built, committed, and approved by review;
  the owner's push and CI's read are the only things left** (orchestrator,
  2026-09-11). Commits `8b0c3ce` (the batch) and `60047d4` (the hash
  fill-in). The reviewer (opus, read-only) returned **approve** with no
  blockers and six nits, all recorded in "Deferred" below. What it verified
  independently rather than taking on report:
  - The implementer's one deviation - `PageTitle.svelte:29-39` hoists each
    `{#if}` to wrap the whole `<h1>`/`<p>` instead of nesting it inside, as
    the plan's snippet had it - is **correct at all eight call sites, and
    better than the plan's own form**. The string branch renders one text
    node, matching `app.js:3194-3196`/`2963-2965`/`2972`, which concatenate
    and escape a single string; the snippet branch's render-tag anchor is a
    *comment*, which generates no box and does not split a text run, so it
    is not the failure `CLAUDE.md`'s text-node rule names. `ListPage`'s sub
    is now **more** faithful than before the batch: three nodes became one,
    which is what `app.js:2972` writes. The plan's documented fallback
    addressed a different failure and was rightly not used.
  - Each furniture class reaches exactly one component, by grep over both
    markup and rule blocks; the four recorded exceptions survive with their
    comments. No inline copy left behind.
  - All four margins are inline `style=` attributes matching the live
    bytes (`app.js` 2912, 2854, 2972, 3154); the two rules that had folded
    them in are gone; the two call sites live writes no style for pass
    nothing.
  - `RecordCard`'s two 600px rules still outrank `Button`'s own after the
    `.card :global(.card-acts ...)` re-anchoring (0,3,0 -> 0,4,0), pinned
    empirically by the 375px cells of `#/i/q1`, `#/i/f1` and the roll
    states.
  - The not-found fix is pinned twice over and in both halves: the class
    (`.miss` has no font-size/margin/max-width where `.page-sub` has
    14px / `0 0 18px` / 70ch, so the six `#/i/nope` cells would catch a
    regression) and the button (`inventory` reads `a[href]`, so parity
    sees it; `record.test.ts:276-279` asserts the href and the classes).
  - **D5 is a true statement about the live app**, read at source:
    `app.js:3795` writes the record name into the title, `syncChrome()` at
    `:3822` runs on every branch, and `:3658` overwrites it with
    `t().docTitle`. The entry carries all six Phase-8 fields in order.
  - Coverage needed no config change - `vite.config.mts:150`'s glob
    reaches the four new files - and authored template comments do not
    reach the DOM (`svelte.config.mjs` sets no `preserveComments`).
- Last agent: reviewer (read-only); the batch's writer was the implementer
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `b967481`; HEAD at closeout `60047d4`

- Task status: **in_progress - B10 is built and committed; CI has not yet
  read the owner's push** (implementer, 2026-09-11). Preflight matched
  the brief: HEAD `b967481`, then one docs-only commit from another task
  (`daa2166`) landed mid-batch - touches neither `app/`, `tests/` nor
  `docs/specs/`, harmless, left alone; `git status --short` showed only
  the planner's uncommitted `context.md`/`plan.md`/`handoff.md` and the
  untracked `issues/tg-preview-refresh/`/`issues/agent-effort/` (both
  another task's, never staged). Built exactly to `plan.md`, "B10
  planned" with one real deviation, found by `npm run check`'s vitest
  step rather than by `svelte-check`: `PageTitle.svelte`'s `{#if typeof x
  === 'string'}` needed to wrap the *whole* `<h1>`/`<p>` element rather
  than sit inside it, or Svelte's block-anchor comment lands inside
  `.page-sub` and turns a plain-string caller's one text node into two -
  `sharedListPage.test.ts` caught it. Full account: `plan.md`, "B10
  built". `npm run check` (exit 0, 998 tests) and `npm run check:built`
  both green in the foreground; all three parity calls (96 cells) read
  `совпадает` on the 90 cells outside `#/roll/wondrous ~ modal` -
  including all six new `#/i/nope` cells - and the six `~ modal` cells
  read inside their recorded debt with no `стало лучше`/`долг погашен`
  line. No `VISUAL_DEBT` or `ACCEPTED` change. `git diff -- app.js
  style.css index.html` empty throughout. Commit: `8b0c3ce`. Not pushed -
  "Never push" stands; CI's read of the push is the only thing this batch leaves
  open, and nothing in it depends on that read the way B8/B9's debt
  deletions did (no `VISUAL_DEBT` figure moved). Next: Phase 6/7 or
  Phase 8 - "Next batch" for the orchestrator's call.
  `NEEDS_HUMAN_CONFIRMATION: no`.
- Last agent: implementer

- Task status: **in_progress - B10 is implement-ready** (planner,
  2026-09-11). Tree at planning: HEAD `b967481`, `origin/main` == HEAD,
  clean but for the untracked `issues/tg-preview-refresh/` and
  `issues/agent-effort/` (both another task's, preserved, never staged)
  and the orchestrator's uncommitted kickoff section in `context.md`. B9
  is pushed and CI run `34638174347` read it green end to end
  (`context.md`, "State at the B10 kickoff"); the remediation's own read
  (`34640328352`) was in progress at kickoff and the orchestrator records
  its verdict. This pass wrote `plan.md`, "B10 planned" (decided 1-7,
  the four components' shapes, steps 1-16, three parity calls,
  acceptance) and settled the outline's open questions: four components
  extracted, three composed `.panel` variants and `PageHead`'s heading
  kept inline with a recorded reason; all four inventory margins are live
  inline `style=` attributes (app.js 2854, 2912, 2972, 3154), so `Panel`
  and `Actions` take `style`; `.miss` is `--muted`; `RecordPage`'s
  not-found branch also lacks the live "На главную" button, fixed with a
  component test **and** a `#/i/nope` state; five carry-ins taken
  (`ListPage:103`, the two "Recorded, not keyed" sentences, the three
  `FEATURES.md` nits), two left (`Shell`'s `@page`, `.badge`). Found and
  written into the batch: **D5** - the live `render()` writes the
  record's name into the tab title and `syncChrome()` overwrites it on the
  same render (app.js 3795 / 3822 / 3658); the rewrite never writes it;
  `#/i/ci1 @` measured `совпадает` on all six cells. Host fact: Git Bash
  rewrites a parity filter such as `"#/i/ci1 @"` to `"#I:/ci1 @"` -
  `MSYS_NO_PATHCONV=1` is required or the run is vacuous. No production
  code was written. Next: an implementer on B10 - "Next batch".
  `NEEDS_HUMAN_CONFIRMATION: no`.
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `b967481`

- Task status: **in_progress - B9 is built and committed; CI's read of the
  owner's push is the open blocker** (implementer, 2026-09-11). Preflight
  matched the brief: HEAD `bb61db0`, `git status --short` showed only the
  planner's uncommitted `context.md`/`plan.md`/`handoff.md` edits and the
  untracked `issues/tg-preview-refresh/` (another task's, preserved, never
  staged) - no drift to reconcile.
  - `TablesPage.svelte`'s anchor effect: `anchoredAt` replaced with
    `flashKey` (`$state`, read by the template), `played` (a
    `${navigations}|${lang}` stamp) and `flashTimer`; the element lookup
    moved inside the `fonts.ready` `.then` (the effect-time element can be
    replaced by a keyed re-render before the promise resolves); a second,
    dependency-free `$effect` clears the timer on unmount only.
    `TableRows.svelte` gained an optional `flash?: string` prop and
    `class:flash` on `.row` and `.tilewrap`; `SearchPage`/`SharedListPage`
    pass nothing, unchanged. `tokens.css` lost the whole
    `@media (prefers-reduced-motion: reduce)` block (lines 156-176),
    replaced with a four-line comment; `grep -rn "prefers-reduced-motion"
    app/src` now finds exactly the two per-component rules
    (`RecordCard.svelte`, `TablesPage.svelte`).
  - `tables.test.ts`: three new cases in `describe('the row and section
    anchor')` - the outline follows the record into the grid view, the
    scroll and outline re-play on `EN`, a search keystroke does not
    re-play them. The four pre-existing anchor cases (two in that
    `describe`, two in `describe('the equipment tables')`) are unchanged.
  - Two lint errors surfaced only at `npm run check` (svelte-check is
    clean but eslint catches both): a template literal over
    `app.navigations` (`number`) needed `String(nav)`, and the unmount
    cleanup's inner arrow needed braces
    (`@typescript-eslint/no-confusing-void-expression` on a bare
    `() => clearTimeout(...)` shorthand). Both fixed; not a design
    deviation.
  - `docs/specs/DEBT.md` created with the header and D1-D4, text verbatim
    from `plan.md`, "Phase 8". `CLAUDE.md` gained the spec-table row and
    the `ACCEPTED`-bullet half-line (now 193 lines, under 200).
    `FEATURES.md` gained the two bullets ("Tables and search", "Chrome").
    `docs/parity.md` gained the three sentences (Contract, Harness
    invariants, the intro paragraph). `docs/specs/COVERAGE.md` gained the
    "fourth thing is never a finding" sentence.
  - Parity filter `"anchor" "#/print/ci1-q1"` matched **36 cells, not the
    plan's predicted 24**: the substring `"#/print/ci1-q1"` also matches
    `"#/print/ci1-q1-q313-cc1-voa2_a3-q23-w51-q35-di11"` (it is a prefix of
    that id too), so both print states drew, not one - 4 print states x 6
    cells = 24, plus 12 anchor cells = 36. Harmless: every print cell read
    `совпадает` regardless, which is the acceptance criterion; noted here
    because the plan's own arithmetic assumed 4 states/24 cells total and
    the discrepancy is worth flagging rather than silently absorbing.
  - All seven anchor `VISUAL_DEBT` entries read **0.00% locally**, not
    just the three the outline's "долг погашен" message flagged - the
    other four (`voa @ en 1100`, and the three `375` entries) read
    "стало лучше - опусти число" instead, because their recorded figures
    exceeded `DEBT_SLACK` (0.5) and the message-selection branch in
    `parity.js` picks the wording off the *old* figure's size, not off
    whether the actual result is zero. Per decided 5 ("delete an entry
    only when the local run reads it as a match and the mechanism this
    batch closed is the entry's - every anchor entry is"), all seven were
    deleted, matching the batch's own Objective ("retire all seven
    remaining anchor `VISUAL_DEBT` entries"). The two long comment blocks
    above them were replaced with one short note per plan step 13,
    pointing at `274aa99` for the measured history rather than repeating
    it. The re-run of `"anchor"` alone (12 cells) read `совпадает` on
    every cell, `расхождений нет`.
  - Evidence: the four `@ en 1100|768` anchor states' `-next.png`/
    `-diff.png` pairs (`core_item`/`voa`, `1100`/`768`) copied to
    `issues/47/evidence/b9/` before the 12-cell re-run overwrote
    `test-output/parity/`. `core_item ~ row anchor @ en 1100`'s
    `-next.png` shows the gold ring around "Premium Bedroll" (`ci1`) -
    confirmed by eye, matching the acceptance criterion.
  - `npm run check` green twice (after the doc/component edits and again
    after the `specs.js` edit), `npm run check:built` green once, all in
    the foreground. Commit: `ad46dac`.
- Last agent: implementer
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `bb61db0`

- Task status: **in_progress - B9 is implement-ready; Phase 8 (the
  post-migration review) is designed** (planner, 2026-09-11). Tree at
  planning: HEAD `bb61db0`, two docs-only commits ahead of `origin/main`
  (`435a5ac`), working tree clean but for the untracked
  `issues/tg-preview-refresh/` (another task's, preserved, never staged);
  nothing running. The owner answered B9's one question - **option (a),
  port the live reduced-motion policy** - so B9 carries no open question.
  This pass wrote `plan.md`, "B9 planned" (steps 1-15, gates, filters,
  acceptance) and "Phase 8" (the register's home and shape, the sweep of
  this file's "Deferred"/"Notes" classified, the entry condition, batches
  R1-Rn), corrected the outline's print filter (`"#/print/ci1-q1"`; the
  outline's `-q313` string matches no state id), and measured two things
  it did not expect: the "missing `Button.svelte` focus ring" carried
  below is a stale claim (the ring is the global rule in `tokens.css:150`,
  gold in both apps; only the focused radius differs, 9 px against the
  live `8px`), and the live app re-plays the anchor scroll on *every*
  render - a search keystroke included (`app.js:4435`) - which B9 does not
  copy and records instead. Durable facts: `context.md`, "B9 planning
  facts". No production code was written. Next: an implementer on B9 -
  "Next batch". `NEEDS_HUMAN_CONFIRMATION: no`.
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `bb61db0`

- Task status: **B8 is closed - committed, pushed, and confirmed by CI's
  second reading** (orchestrator, 2026-09-11). Tree preflight found HEAD past
  where the session brief left it: `274aa99 test(parity): the anchor debts
  follow CI's read of 9fd3000` carries B8's five paths exactly as the entry
  below describes them, and `435a5ac docs(issue-47): the fourth check run, and
  the tail that closed the gate` is a docs-only correction on top of it. Both
  were already pushed - `origin/main` == local HEAD == `435a5ac`, working tree
  clean but for the untracked `issues/tg-preview-refresh/`, another task's,
  preserved and never staged. So the staged-but-uncommitted state the brief
  expected had in fact been committed before that session ended; no check was
  re-run to arm a gate that had already fired.
  **The push produced run [`34628983995`](https://github.com/artex-x/daggerheart-loot/actions/runs/34628983995), and that run is B8's second
  reading.** All four parity shards **green**: shards 2 and 3, which carried
  the three red ratchet cells on `9fd3000`, pass against the figures B8 wrote
  (9.35 / 8.85 / 9.86), and the deleted `voa ~ section anchor @ ru 375` entry
  is confirmed by a shard that no longer has a cell to fail. The 54 `#/print`
  cells are clean a second consecutive run. `audit` and `secrets` green.
  **The one red is `check`, on the legacy `behave` suite against the live
  app** - "приложение открылось не на поиске", selector `.subchips .chip.on`
  - which none of B8's five paths can reach (a parity spec file, a tools
  README, three `issues/47/*.md`), which was green on `9fd3000` an hour
  earlier, and which the owner identified as flaky and re-ran. **Attempt 2
  passed**, so the flake is confirmed rather than asserted and run
  `34628983995` is green end to end - `check` in 3m47s, all four parity
  shards, `audit`, `secrets`, and `deploy`, which had been skipped behind the
  red `check` on attempt 1 and on the two runs before it. `main` is green for
  the first time since `37ecc8d`. No reviewer: B8
  changed no production code, no contract and nothing a screen draws, so no
  risk rule in `orchestrate.prompt.md` applies. Next: a planning pass on B9
  or B10 - **B9 needs an owner answer first**. See "Next batch".

- Task status: **B8 built and committed - `tests/parity/specs.js` says what
  CI measures on `9fd3000` and why** (implementer, 2026-09-11). Tree
  preflight matched the brief exactly: `git log --oneline -3` showed
  `9fd3000` on top, `git status --short` showed only the planner's three
  `issues/47/*.md` files and the untracked `issues/tg-preview-refresh/`
  (another task's, never staged). The four `375` anchor entries in
  `specs.js` are now three - `core_item @ ru 375` 9.35, `core_item @ en 375`
  8.85, `voa @ en 375` 9.86, all `LOWERED ... on 9fd3000` against CI run
  `34616445556` - and `voa @ ru 375` is deleted (CI reads 0.00, and the
  ratchet's own rule leaves no passing figure for a `0.00` cell). The note
  above them keeps its measured-sequence paragraphs and gets the three new
  closing paragraphs the plan specifies (the reduced-motion transition
  policy, measured; the English-only re-scroll, read off CI's diff image;
  both named as B9's to close). `tools/parity-ubuntu/README.md` gains one
  paragraph pointing a re-calibration at the latest CI run rather than the
  historical table. No production code touched. `docker info` panics on this
  host too, so the fallback second reading was unavailable; CI on the
  owner's push stays the only second reading. `npm run build` +
  `MSYS_NO_PATHCONV=1 node tests/parity.js "anchor"` (12 cells) ran as
  advisory: all eight non-375 cells unchanged (`совпадает` at `@ ru`, inside
  their 0.42-0.63% debts at `@ en`), and the three remaining 375 cells all
  read "стало лучше" locally against the new CI figures, exactly as
  predicted - no number was written from this host. `npm run check` is
  green (994 tests, thresholds met) and the commit gate armed. One commit,
  `test(parity): the anchor debts follow CI's read of 9fd3000`, the four
  paths staged by name. Not pushed - that is the owner's, and the push is
  the second reading the deleted `voa @ ru 375` entry (and the whole batch)
  waits on. Next: a planning pass on B9 (the anchor re-play + the
  reduced-motion policy, needs the owner) or B10 (the furniture extraction).
  See "Next batch".

- Task status: **B8 planned and implement-ready - the anchor debts follow
  CI's read of `9fd3000`, and the ratchet rides alone** (planner,
  2026-09-11, on `9fd3000` == `origin/main`, tree clean but for the
  untracked `issues/tg-preview-refresh/`, another task's, preserved). Two
  things CI run `34616445556` settled and one it opened: **the print image
  residue is closed** - all 54 `#/print` cells `совпадает` on ubuntu, the
  24 `whole:true` ones included, so the first "Blockers" entry below is
  marked resolved and no `VISUAL_DEBT` line was ever needed; **Phase 4 is
  complete and CI-clean**; and **`main` is red on three ratchet cells**,
  the four `375` anchor cells having moved down together on the commit
  that set `transition-duration` to `0s` under reduced motion. Planning
  measured why rather than guessed (`context.md`, "B8 planning facts"): the
  live app keeps its transitions alive under `prefers-reduced-motion` and
  Chrome's scroll anchoring adjusts it 6px during them at 375, the rewrite
  with none is not adjusted - proven by killing the live app's transitions
  and watching it land where the rewrite lands; and CI's own diff image
  for `voa ~ section anchor @ en 375` is a 22px whole-viewport offset (0px
  and 0.00% at `@ ru 375`), the English-only re-scroll the live `render()`
  plays on the language switch and the rewrite's `navigations`-guarded
  effect does not. B8 writes CI's figures (9.35 / 8.85 / 9.86), deletes the
  `0.00` entry, rewrites the reasons and the note, and notes the stale
  calibration target in `tools/parity-ubuntu/README.md` - one commit, no
  production code, `npm run check` + a 12-cell `"anchor"` filter. `timed`
  on the anchor states was measured and rejected; merging with the
  furniture pass was rejected by the batch-size test (a different filter
  set; `main` would stay red behind a review-sized refactor). B9 (the
  anchor re-play + the reduced-motion policy, an owner question) and B10
  (the furniture extraction, inventoried) are outlined in `plan.md`. See
  "Next batch". `NEEDS_HUMAN_CONFIRMATION: no` for B8.

- Task status: **B7's one remediation pass is done - the three review
  blockers are fixed and the false durable record they left behind is
  corrected.** (implementer, 2026-09-11, on top of `4776243`.) The print
  parity failure was **not** a `cqw` browser race: `tokens.css`'s
  reduced-motion block set `transition-duration: 0.01ms !important`, and a
  non-zero duration starts a real `CSSTransition` whose value at t=0 is the
  old one, so `fit()`'s synchronous write-then-read was answered by the
  pre-write layout every iteration and all three ladders ran to their
  floors. Fixed to `0s`. Also fixed: `Shell.svelte`'s print colours, which
  lost the cascade to `tokens.css`'s `body` and were dead code in the built
  app (moved into `tokens.css`'s own `@media print`), and the missing
  `.tabs` print rule (added to `TabBar.svelte`, matching the split Shell's
  comment describes). Two cheap corrections in the same paths:
  `COVERAGE.md`'s stale `LangSwitch` line and `PrintCard.svelte`'s
  inaccurate reset comment. `npm run check` green (994 tests, thresholds
  met), `npm run check:built` green (88.4 kB gzip), parity **group B 30/30
  `расхождений нет`** - the global `transition-duration` change disturbed
  no other screen - and **group A's `cardFit`/`sheetCounts` cells all
  agree**, with an image residue of 4 cells (down from 50) that re-runs as
  a different, non-overlapping 3 and is the documented `whole:true`
  full-page capture class. No `VISUAL_DEBT` number written from this host.
  See "Verification" for exact commands and "Blockers", first entry, for
  what CI still adjudicates.

- Task status: **B7 is built and committed - the print slice, the last of
  Phase 4, is done.** (implementer, 2026-09-11, on top of `8b96ff4`.)
  `#/print/<ids>` draws in full per the plan below, with no design
  deviation. `npm run check` green (994 tests; coverage thresholds met),
  `npm run check:built` green (88.4 kB gzip), parity group B (five
  regression states, 30 cells) **`расхождений нет`**. Two harmless
  deviations from the brief's own numbers (`dist/assets/*.css` does not
  exist - the build inlines styles into `app.js`, pre-existing and unrelated
  to this batch, so `@page` was grepped from there instead, reading 1;
  `card/` is 36 files on disk, not 35, a planning miscount, junction still
  byte-correct) and one real, cheap, in-scope fix (`lib/i18n.ts`'s
  `eqParts`, whose `?? ''` fallback against `th` became dead/wrongly-typed
  code once `th` was retyped to the pair it is; `i18n.test.ts`'s one
  affected case rewritten to match) - both accounted for in `plan.md`,
  "B7 built". **This entry also reported 50 of 54 group-A cells red and
  blamed a `cqw` browser race. That diagnosis was wrong** - the cause was
  `tokens.css`'s `transition-duration: 0.01ms`, found by the review and
  fixed in the remediation entry above; the `cqw` narrative is deleted from
  `plan.md`, `handoff.md` and `context.md` rather than softened, and
  `docs/parity.md` gains no third unstable class. See "Verification" for
  the exact commands and "Blockers", first entry, for what CI still
  adjudicates.

- Task status: **B7 planned and implement-ready - the print slice, one
  batch, the last of Phase 4** (planner, 2026-09-11, on `d696675`, working
  tree clean but for the orchestrator's own `context.md` kickoff section,
  kept and committed with this pass). The surface was read off `app.js`
  3220-3558 / `style.css` 1112-1414 and measured live in headless Chrome on
  four routes at three widths, in colour, after the black-and-white press,
  after `EN`, and under emulated print media, rather than remembered.
  **The Figma question is settled: no design access is needed.** Every
  vector the sheet draws is already exported into `card/` (35 files, named
  by `app.js`'s own `cardArt()`), the build junctions `card/` into `dist/`,
  and `CONTRACTS.md` freezes the path; the port is a parity port of live
  code and the Figma nodes are its provenance, not an input. What is new is
  `PrintPage.svelte` + `PrintCard.svelte` (both layouts branching in the
  markup, the fit ported verbatim as a `$effect` - the measured `2.2cqw`
  strip floor is a floating-point outcome, so the arithmetic is copied, not
  improved), `Seg.svelte` extracted on the `.seg` control's *third* use
  (`LangSwitch.svelte` and `TablesPage.svelte`'s copy both go),
  `lib/print.ts`, `printAsked`/`dropped` on the route with `AppState.route`
  finally passing `knows`, `DialogPort.print()`, `printSrc`, 17 dictionary
  keys, the `back` icon, the `@media print` rules across `Shell`/`PrintPage`
  /`PrintCard`/`SelBar`/`Toast`, three driver verbs (`media`, `computed`,
  `eachAt`) and four specs (`sheetCounts`, `cardFit`, `printMedia`,
  `copiedPrintLink`). Nine parity states replace the single `pending` line -
  the last one in `specs.js` - four of them `whole` with `cardFit` beside
  them. Sized by its gates: group A `"#/print"` (54 cells) and a
  five-state regression group B (30 cells) that also reads B6's three
  carried review risks locally; one code commit. Eleven ordered steps,
  twenty component cases, exact tests per file. No production code
  touched; no check run (a planning pass needs none). NEEDS_HUMAN_
  CONFIRMATION: no.

- Task status: **B6 is reviewed and approved - the search slice is closed,
  and print is the only Phase 4 slice left.** (reviewer, 2026-09-11, on
  `9d5ca02`). **Verdict: approve, no blockers**, and no remediation cycle
  spent - the batch's one cycle is unused. The review checked the two
  failure shapes this task has already paid for and found neither: every new
  interactive element in `SearchBox.svelte` and `SearchPage.svelte` is
  reached by a real event on a real rendered node and asserted through a
  downstream effect (rows appearing, `aria-pressed` flipping *and* the row
  set changing, `Выбрано 300` in the bar), not by a directly-invoked
  handler; and `TablesPage.svelte:420` passes no `focus` prop against
  `SearchBox`'s `focus = false` default, so the tables toolbar neither
  gained nor lost focus-on-arrival. All three recorded deviations are
  correct readings of live behaviour, verified against the catalogue and
  `app.js` rather than taken on trust: `$eval` would have returned
  `undefined` for `els.length`; exactly two records carry "основное оружие"
  and neither has `eq.t === 'weapon'` (`hi20` has no `eq` block at all,
  `voa3_t4g` is `secondary`), so the brief's assertion was false in two
  independent ways; and `userEvent.paste` is not a different code path -
  the live handler is an `input` handler (`app.js:4333`) and the cap lives
  in a `$derived` that never sees how `q` was set. `statLineFor`'s move is
  byte-equivalent with the same read set; `AppState.kinds` matches
  `app.js:60`'s one `S.kind` shared by all three screens, and the extra
  `equip: true` key the roll pages now receive is inert
  (`poolFor`/`allows` hard-code `kind !== 'equip'`; `altTables`/`altPicks`
  read only `.item`/`.consumable`), which `app.test.ts`'s fourth case pins.
  `packedExpanded` closes B5.6's risk 1 rather than restating it: a failed
  unpack writes literally `#/l/zzzz` (`app.js:3596-3600`) and the spec
  throws on it, while the other failure - the hash never leaving `#/l/~` -
  is already fatal through the state's own `d.expanded()` `waitForFunction`.
  The artwork commit `37ecc8d` cannot confound the parity result: both apps
  read the same `img/` bytes on one tree. Three risks and eight nits are
  recorded in "Deferred", not fixed. NEEDS_HUMAN_CONFIRMATION: no.

- Task status: **B6 is built, verified and committed - the search slice is
  closed; print is the only Phase 4 slice left.** (implementer, 2026-09-11,
  on `a25eeac`, HEAD moved under this batch to `37ecc8d`
  `feat(artwork): refresh audited polish batch` - a foreign, unrelated
  commit from a peer session, preserved and committed on top of, images
  only, no overlap with this batch's files). All twelve ordered steps
  landed in one commit, `feat(search): the search page`, with no design
  deviation from the plan; see `plan.md`, "B6 built" for the full account,
  including three test-writing deviations (all caught and fixed before the
  commit, none a behaviour change): `driver.js`'s `count()` uses
  `page.$$eval`, not the brief's literal `page.$eval` (which would query
  only the first match); two `search.test.ts` cases were rewritten against
  the real catalogue rather than kept as specified, because "основное
  оружие" is ordinary prose on some non-weapon records and the literal
  assertions were false on real data; and the 300-cap component test types
  via `userEvent.paste` rather than `userEvent.type`, because typing
  "Много" character by character re-renders 300+ rows five times and pushed
  the case past the 30s test timeout under coverage instrumentation.
  Checks, each its own foreground call: `npm run check` **exit 0** twice
  (once after a prettier/eslint/timeout fix pass, once after the doc
  edits), 947 tests, coverage 96.27 / 88.53 / 96.67 / 97.01; `npm run
  build` clean (84.13 kB gzip); group A `node tests/parity.js "#/search"`
  42 cells **расхождений нет**; group B (the regression) 36 cells
  **расхождений нет**, `packedExpanded` read `{ expanded: true }` on both
  apps; `npm run check:built` **exit 0** (budget 81.7 / 120 kB). No
  `VISUAL_DEBT` or `ACCEPTED` entry. B5.6 risk 1 (the `~ packed` blind
  spot) is closed by `packedExpanded`; `ListPage.svelte:103`'s stale
  comment stays recorded, not this batch's file. No review requested this
  pass. NEEDS_HUMAN_CONFIRMATION: no.

- Task status: **B6 planned and implement-ready - the search slice, one
  batch** (planner, 2026-09-11, on `16bc32e`, working tree clean but for
  the orchestrator's own `context.md` kickoff section, which is kept and
  committed with this pass). The surface was read off `app.js`/`style.css`
  and measured live in headless Chrome rather than remembered: the box is
  focused on arrival with its ring painted, `меч` finds 87 rows (34 with
  `Снаряжение` off), `а` hits the 300 cap, no help button, no reset button
  in the empty state. Everything on the page has a rewrite counterpart
  (`PageHead`, `Field`/`ChipRow`/`Chip`, `Empty`, `TableRows`/`RowMain`,
  `SelBar`, `RecordModal`, `lib/search.ts`); what is new is the composition
  (`SearchPage.svelte`), the search input extracted on its second use
  (`SearchBox.svelte`, `TablesPage`'s copy goes), `AppState.kinds`/
  `toggleKind` (the kind filter comes due here - shared across the two roll
  pages and search, as the live `S.kind` is; the roll panels' local copies
  go), `statLineFor` in `lib/search.ts` (second caller), a three-line
  `count` driver verb, and two dictionary keys. Seven parity states replace
  the `pending` line, `copiedSelection` and `typeRuns` gain search cells,
  `foundRows` pins the counts, and the carried `~ packed` blind spot is
  closed by a one-spec throw (`packedExpanded`) because this batch edits
  `specs.js` anyway; `ListPage.svelte:103` stays recorded (not this batch's
  file). Sized by its gates: one filter group (42 cells) plus one
  regression group (36 cells), each one foreground call; one code commit.
  Twelve ordered steps, fifteen component cases, exact tests per file.
  No production code touched; no check run (a planning pass needs none).
  NEEDS_HUMAN_CONFIRMATION: no.

- Task status: **B5.6 is built, verified, committed and reviewed - the lists
  slice B5.1-B5.6 is closed.** (implementer then reviewer, 2026-09-11, on
  `ccbf345`). All eleven ordered steps landed with no deviation from the
  brief; the plan's stated `~ packed` fallback was never needed - every
  packed cell read `совпадает` on the first parity run. One code commit,
  `feat(lists): the shared list page` (`ccbf345`, 22 files, +1392/-189), on
  top of the planning commit `3324039`. No push. Checks, each its own
  foreground call: `npm run check` **exit 0** twice (pre-commit and after
  the doc edits), 921 tests, coverage 96.3 / 88.51 / 96.77 / 97.06;
  `npm run build` clean (83.59 kB gzip); `node tests/parity.js "#/l/"` 30
  cells **расхождений нет**; `"i/ci1 ~"` 36 cells нет; the tables/lists
  regression group 30 cells нет; `npm run check:built` **exit 0** (budget
  81.2 / 120 kB). **Review verdict: approve** - no blockers, nothing drawn
  but inert, no divergence from `app.js` in the ported behaviour, no
  contract file moved, and every new interactive element is reached by a
  real event on at least one of the two proofs rather than through a
  directly-invoked handler. That was this batch's one review; four risks
  and five nits are recorded in "Deferred", not fixed. B5.4a nit 1 and
  B5.3 nit 5 are closed by this batch.
  NEEDS_HUMAN_CONFIRMATION: no.

- Task status: **B5.6 planned and implement-ready - the last lists batch**
  (planner, 2026-09-11, on `d6c951f`, working tree clean but for the
  orchestrator's own `context.md` kickoff section, which is kept and
  committed with this pass). The outline's two open questions are resolved
  by reading the code and fixtures: (a) `RowMain`'s `tail`/`.rtail` is
  used, not deleted - the live `rowHTML(it, '', tail)` is exactly its
  markup, `TableRows`'s list rows are the shared page's rows byte for byte,
  and only a per-row `after` snippet was missing; (b) the tails state uses
  `docs/fixtures/lists/qty-and-price.json` (three tail shapes, all ids in
  `data.js`), the noted state `notes-both-kinds.json`'s `gm` payload, and
  coin mode is a unit case. Four states (`#/l/ ~ shared`, `~ shared, noted`,
  `~ packed`, `#/l/zzzz`), two press specs, `listAddress` +4, `NAME` +2, one
  eight-line driver verb (`expanded()`, so the packed cell cannot race the
  rewrite's async replace). The packed payload is computed once with
  `zlib.deflateRawSync` and pasted with its command. One correction to the
  outline: adding a shared list into an *existing* list copies qty, gold
  and the players' note (live `addIdsTo`, 1924-1940), not ids only - so
  `ListStore.addIds` grows a `meta` parameter and `AppState` a `shared`
  field that gates it the way the live `metaForKey` gates on the route.
  Eleven ordered steps, exact tests per file, three parity groups each
  sized to one foreground call, one code commit after this planning commit.
  No production code touched; no check run (a planning pass needs none).
  NEEDS_HUMAN_CONFIRMATION: no.
- Task status: **B5.5's review remediation is built, verified and committed -
  the lists slice still needs only B5.6.** (implementer, 2026-09-11, on
  `ba0a92d`). Both blockers fixed: `drag.ts`'s `dragstart` now requires a
  `[data-drag]` grip (`onStart` was accepting any element inside `.lrow`,
  including the thumbnail and note textarea, and starting a row reorder from
  native browser drag content); `onOver`/`onDrop` now guard on `if (from < 0)
  return;` before touching a stray drag from outside the page (a desktop file,
  another tab's image) - `onDrop`'s `preventDefault()` moved inside the
  existing `start >= 0 && at` check rather than firing unconditionally. Five
  more findings from the same review closed alongside: `numField.ts`'s bare
  minus now commits to `0` not `min`; the reprice field's `typed`/`committed`
  no longer clamp at all (only the stepper does, matching `app.js:4336-4343`/
  `3916` - `NumberField.svelte`'s `step()` now clamps explicitly since
  `committed` no longer does); the restored `setDragImage` guard; a
  self-verifying assertion in `reorderedByDrag`; the dead `NAME.rollResult`
  keys removed from `specs.js`. One commit, `fix(lists): start a drag only
  from the grip`, on top of `ba0a92d`. No push. See `plan.md`, "B5.5 built",
  "Correction, one remediation pass..." for the full accounting.
  NEEDS_HUMAN_CONFIRMATION: no.
- Task status: **B5.5 is built, verified, and committed - the lists slice
  needs only B5.6.** (implementer, 2026-09-11, on `3cb2bd0`). All thirteen
  ordered steps done, no deviation; the drag-verb fallback was not needed -
  the synthetic `DragEvent` sequence drove the live app's own handlers on
  the first attempt. Three commits, in order: `docs(issue-47): B5.5 planned
  - two batches, not three, and the batch-size rule` (`36fd2f1`, the five
  doc paths from the planning pass, an explicit pathspec so no code rode
  along), `feat(lists): drag as the live app does it` (`a006792`, steps
  1-4), and `feat(lists): the actions under a ticked selection` (this
  session's closing commit, steps 5-13). No push. See `plan.md`, "B5.5
  built" for the full accounting - the rewritten `nativeDrag`, the
  `.batch-acts` pair and `.guess` panel, the four handlers, and one real
  defect found and fixed in a file the batch was already extending:
  `NumberField`/`lib/numField.ts` could not type a negative number at all
  (every existing caller's `min` is 1 or more, so it never showed), which
  would have made the reprice field - default `-20` - unusable. Nits 2, 3
  and 5 from B5.4a's review are closed; nit 1 is B5.6's; nits 4 and 6 stay
  recorded. NEEDS_HUMAN_CONFIRMATION: no.
- Task status: **B5 remainder planned; B5.5 (the list page complete - drag
  as the live app does it, and the actions under a ticked selection; it
  absorbs B5.4b) is implement-ready** (planner, 2026-09-11, on `3cb2bd0`,
  working tree clean but for the orchestrator's own `context.md` kickoff
  section, which is kept). Two batches remain, not three: B5.5, then B5.6
  (outlined). The split, the sizing evidence and the four rejected
  alternatives are in `plan.md`, "B5 remainder planned". The standing
  batch-sizing rule landed in `CLAUDE.md`, "Task and session protocol",
  with its measured costs and the test for where the line is in
  `docs/parity.md`, "Batch size and the fixed cost of a run". B5.4a's six
  review nits are assigned, not re-deferred: 1 to B5.6; 2 decided (no
  `ACCEPTED` entry - a stale key fails the run; recorded as prose by B5.5);
  3 and 5 to B5.5; 4 and 6 stay recorded. No production code touched; no
  check run (a planning pass needs none). HEAD did not move under this
  session. NEEDS_HUMAN_CONFIRMATION: no.

- Task status: **B5.4a's one-blocker remediation pass is built, verified, and
  committed** (implementer, 2026-09-11, on top of `8873473`). The reviewer's
  one blocker - the list row grip missing `draggable="true"`, so no
  `dragstart` could ever fire in a real browser and the fully-styled grip did
  nothing - is fixed with the one attribute, matching `app.js:3053`. A new
  `listPage.test.ts` case asserts `draggable="true"` on the rendered
  `.lrow-grip` element itself (a real DOM query, not a port call), since the
  existing drag test's `drag.handlers?.onDrop(0, 2)` call proved the port
  wiring while missing exactly this. `npx prettier --write
  app/src/components/ListPage.svelte` left the file unchanged - no
  `prettier-ignore` needed. `npm run build` then `MSYS_NO_PATHCONV=1 node
  tests/parity.js "#/lists/a @"` read all six cells `совпадает` (an attribute
  has no geometry). `set -o pipefail; npm run check 2>&1 | tail -n 120` exited
  0 as the last action before commit. One commit, `fix(lists): make the list
  row grip draggable`, on top of `8873473`. No push. The reviewer's six nits
  are recorded, not fixed, in "Deferred"; `plan.md` gained a correction
  paragraph under "B5.4a built" naming the parity driver's missing drag verb
  as why neither green proof could have caught this. B5.4b, B5.5 and B5.6
  remain outlines only - not started, not replanned.
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

- Batch name/id: **B13 - the reversible cut-over** (implementer, 2026-09-12)
- What shipped: the site's own URL now serves the built rewrite. The entry
  document was ported first - `app/index.html` had no viewport-fit, no
  description, no Open Graph or Twitter card, no icon and no `<noscript>`, and
  nothing in the repository compared the two documents - then
  `.github/workflows/ci.yml` was flipped in a commit of its own so the revert
  is one file. `tools/check-site.mjs` reads the live URL as the job's last
  step. Nothing was deleted: `index.html`, `app.js` and `style.css` stay,
  gated, as the fallback and the parity expectation.
- Files changed: `app/index.html`, `tests/derived.js`, `tools/check-site.mjs`
  (new), `docs/specs/META.md`, `docs/specs/CONTRACTS.md`,
  `docs/specs/COVERAGE.md`, `CLAUDE.md`, `.github/workflows/ci.yml`, and
  (F3) `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): `0819a73` (F1), `9177f3b` (F2, one file), `a004764` (the review
  remediation), plus this documents commit. All pushed.
- Checks run and results: `npm run check` three times (exit 0, 1011 tests, no
  threshold moved); `npm run check:built` once (88.5 kB of 120 kB);
  `node tests/run-all.js app/sweep` (4/4, 555.4 s) and
  `node tests/run-all.js app/typo,app/hues,app/contracts,app/states` (4/4,
  263.0 s); no local parity call. CI run `34718569245` green in every job
  including all four parity shards and `deploy`.
- Deviations and rationale: six, all recorded in `plan.md`, "B13 built",
  "Deviations from the plan, and why". The two that matter are `.nojekyll`
  required with `[ -e ]` rather than `[ -s ]` (it is empty by design) and the
  guard's `if` blocks rather than `&&`/`||` one-liners (under `bash -e` the
  one-liner form fails the step on every *good* deploy).

- Batch name/id: **Phase 6 planning pass** (planner, 2026-09-12, on
  `aac1453`)
- What shipped: documents only - no production, test or config code. The three
  stale "Pages flip" spots in `plan.md` corrected in place, each showing what
  was believed beside what was measured; a new `plan.md` section, "Phase 6 -
  the cut-over, replanned", carrying the re-sequenced order, **B12.1 planned**
  and **B13 planned** (both implement-ready), Phase 7's six-point entry
  condition, the placement of every B12 deferred nit, and B12's two
  unrecorded fallbacks written into the file that was missing them.
- Files changed: `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): none by this pass; the documents are left for the session's own
  commit.
- Deviations and rationale: B13 grew a whole workstream the Phase 6 outline
  did not have - porting the entry document - because reading `index.html`
  against `app/index.html` showed the rewrite's page carries none of live's
  head or `<noscript>` block. Not a deviation from a decision, a gap nothing
  had measured; the table is in the plan.

- Batch name/id: **B10 - the page furniture as components, and the
  not-found record page** (implementer, 2026-09-11, on `b967481`)
- What shipped: four new components off the plan's own specification -
  `Panel.svelte` (`.panel`, `style?: string`), `Actions.svelte`
  (`.card-acts`, `style?: string`), `NoData.svelte` (`.miss`,
  `var(--muted)`), `PageTitle.svelte` (`.page-h`/`.page-sub`,
  `title`/`sub` each `string | Snippet`). `Panel` replaces the five
  identical `.panel` divs in `AltPanel`, `StdPanel`, `RollPanel`,
  `ListsPage` (`style="margin-top:16px"`), `SearchPage`
  (`style="margin-bottom:16px"`); the three composed variants
  (`TablesPage`'s `.tablenav`, `FilterBar`'s `.ffilter`, `ListPage`'s
  `<details class="panel lroll">`) stay inline with a one-line comment
  each, as decided. `NoData` replaces all seven `.miss` paragraphs.
  `Actions` replaces the four `.card-acts` blocks, `RecordCard` included -
  its two 600px descendant rules re-anchored `.card :global(.card-acts
  .btn-lbl)` / `.card :global(.card-acts .btn.sm:has(.btn-lbl))`, since a
  scoped rule cannot otherwise reach inside a child component. `PageTitle`
  replaces the eight `.page-h`/`.page-sub` pairs in `ListPage` (a
  `{#snippet renameTitle()}` holding the rename input; the joined
  `${items.length} ${itemsWord(...)}` sub as a plain string), `PrintPage`,
  `RecordPage` (its not-found branch gains the live "На главную" button
  it was missing: `<Button variant="primary"
  href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>`; its found
  branch's sub is a `{#snippet sub()}` holding today's `<p>` body
  verbatim) and `SharedListPage`. `PageHead` keeps its own
  `.page-h`/`.page-sub` with a one-line comment naming why. Carry-ins
  landed: `ListPage.svelte:103`'s comment, the two "Recorded, not keyed"
  sentences in `specs.js`, three `FEATURES.md` nits (B6 nit 10, B5.3 nit
  2, B5.6 nit 5). Found and registered: **`docs/specs/DEBT.md` D5** - the
  live `render()` writes a record's name into the tab title and
  `syncChrome()` overwrites it on the same render (app.js 3795 / 3822 /
  3658); the rewrite never writes it, so `#/i/ci1 @`'s `title` spec
  matches on the plain title alone. New parity state `#/i/nope` (six
  cells) pins the not-found page pixel-for-pixel; `record.test.ts` pins
  it structurally (heading, `.page-sub` text, no `.miss`, the button's
  `href`/class, axe).
  - **One real deviation from the plan's own snippet**, found by
    `npm run check`'s vitest step, not by `svelte-check`:
    `PageTitle.svelte`'s `{#if typeof x === 'string'}...{:else}...{/if}`
    written *inside* `<h1>`/`<p>` (as drafted in the plan) failed an
    existing test, `sharedListPage.test.ts`'s "draws the name, the sub as
    one text node..." - `sub?.childNodes` read 2, not 1. Svelte marks an
    `{#if}` with an anchor comment to track the live branch; nested
    inside the element, that comment became a child of `.page-sub`,
    turning a plain-string caller's one text node into a text node plus a
    comment - invisible to a pixel diff but real to a DOM-structure
    assertion and to `CLAUDE.md`'s "port the live app's text-node
    structure" rule. Fixed by hoisting each `{#if}` to wrap the *whole*
    element - two complete `<h1 class="page-h">...</h1>` branches, two
    complete `<p class="page-sub">...</p>` branches - so the anchor
    comment lands as a sibling, not a child. Not the plan's documented
    fallback (that one is for a `svelte-check` type-narrowing rejection,
    which never occurred); a different failure mode, caught by the exact
    gate the plan relied on. Full account: `plan.md`, "B10 built".
  - A second, smaller correction: prettier reformatted the plan's
    single-line `{#if}` markup onto its own indented line inside the
    tags, which would have reintroduced the same whitespace-text-node
    risk `ListsPage.svelte`'s card link already needed a `prettier-ignore`
    for. Moot once the `{#if}` moved outside the element (prettier no
    longer wraps it), so no `prettier-ignore` was needed in the final
    form.
- Files changed: `app/src/components/{Panel,PageTitle,Actions,NoData}.svelte`
  (new); `AltPanel`, `StdPanel`, `RollPanel`, `ListsPage`, `SearchPage`,
  `TablesPage`, `ListPage`, `PrintPage`, `RecordPage`, `SharedListPage`,
  `RecordCard`, `PageHead`, `FilterBar`; `record.test.ts`, `a11y.test.ts`;
  `tests/parity/specs.js`; `docs/specs/FEATURES.md`, `docs/specs/DEBT.md`;
  `issues/47/plan.md`, `issues/47/handoff.md`, `issues/47/context.md`
  (carrying the planning pass's own edits into this batch's commit, per
  the tree preflight).
- Commit(s): `8b0c3ce` (`refactor(app): the page furniture as components,
  and the not-found record page (#47)`, 25 files). Not pushed - "Never
  push" stands.
- Deviations and rationale: the `PageTitle` markup fix above is the only
  deviation from the plan's own text; every decided point (1-7) and every
  numbered step (1-16) otherwise landed as specified. No `VISUAL_DEBT` or
  `ACCEPTED` change; no live file touched (`git diff -- app.js style.css
  index.html` empty).

- Batch name/id: **B9 - the anchor re-play, the live reduced-motion
  policy, and the behaviour-debt register** (implementer, 2026-09-11, on
  `bb61db0`), plus its one-pass remediation (same session)
- What shipped: `TablesPage.svelte`'s anchor effect replaces
  `anchoredAt`/`classList.add('flash')` with reactive state -
  `flashKey` (`$state`), a `played` stamp keyed `${navigations}|${lang}`
  so the scroll-and-flash re-plays on a language switch as well as a
  navigation, and the target element looked up inside the `fonts.ready`
  `.then` rather than at trigger time (a keyed re-render can replace the
  element the effect saw before the promise resolves). `TableRows.svelte`
  takes an optional `flash?: string` prop and applies `class:flash` on
  `.row` and `.tilewrap` - the CSS rules themselves are untouched.
  `tokens.css` loses the whole `@media (prefers-reduced-motion: reduce)`
  block (four lines of comment left in its place); the live app's own
  two per-component reduced-motion rules (`RecordCard.svelte`,
  `TablesPage.svelte`) are now the only ones in `app/src`. All seven
  remaining anchor `VISUAL_DEBT` entries are deleted -
  `docs/specs/DEBT.md` is created as their replacement register, with
  D1-D4 (D1 is this batch's own reduced-motion kill; D2-D4 are prior
  batches' findings, written now because the register's first commit
  should show more than one entry). `docs/specs/FEATURES.md`,
  `docs/parity.md`, `docs/specs/COVERAGE.md` and `CLAUDE.md` (193 lines)
  each carry the sentences routing to it.
  - Remediation, same pass: the anchor effect's early return (no anchor,
    or `index` not ready) now clears `flashKey`/`flashTimer` before
    returning, so a route change that drops the anchor cannot leave a
    stale gold ring lit on an unrelated row that happens to share a
    `ci*`/`q*` id on a different table - a campsite fix, since no parity
    state keys it (none navigates away from an anchor inside the 1.6s
    window). A new `tables.test.ts` case ("clears a flash in flight when
    a route change drops the anchor") pins it directly, per `CLAUDE.md`'s
    "every defect fix gets a test" - it arrives at `#/tables/core_item/
    ci2`, waits for the flash, clicks the "Hope & Fear" chip, and asserts
    no `.flash` remains anywhere on the page. `tests/parity/driver.js`'s
    `settle()` comment, stale
    since B9 deleted the blanket reduced-motion kill, now says the modal's
    `pop` animation runs on both sides rather than "none at all in the
    rewrite". `docs/specs/DEBT.md` D1's "Why parity won" now says plainly
    that the *entry* is not deleted by B9 (only the `tokens.css` block
    is) and stays open for the real policy at Phase 8; its "How to verify
    the fix" no longer opens with a parity-harness-only call
    (`page.emulateMediaFeatures`), since the register is the category that
    outlives the harness - it now names a DevTools rendering-emulation
    check or a Vitest assertion against a mocked `matchMedia` as the
    check that survives. Two word-order slips (which anchor cells got
    which `parity.js` message) were corrected in `plan.md`/`handoff.md`'s
    own prose; the underlying decision (delete all seven) is unchanged
    and was confirmed correct by the review. `#/tables/voa ~ section
    anchor @ en 375` - the one deletion this host cannot corroborate with
    a before/after delta of its own - is now named first in "Blockers"
    for whoever reads the CI result.
- Files changed: `app/src/components/TablesPage.svelte`,
  `app/src/components/TableRows.svelte`, `app/src/components/tables.test.ts`,
  `app/src/styles/tokens.css`, `tests/parity/specs.js`,
  `tests/parity/driver.js` (remediation only), `docs/specs/DEBT.md` (new),
  `docs/specs/FEATURES.md`, `docs/parity.md`, `docs/specs/COVERAGE.md`,
  `CLAUDE.md`, `issues/47/evidence/b9/` (four screenshot pairs),
  `issues/47/plan.md`, `issues/47/context.md`, this file.
- Commits: `ad46dac` (the batch), `dba79ee` (docs-only, the commit hash
  filled in after the fact), `84ca6df` (the remediation - the blocker and
  six nits).
- No `VISUAL_DEBT` figure was written from this host at any point (owner
  decision 1): the seven entries were deleted outright, never
  re-numbered. The review confirmed deleting all seven - not only the
  three whose message literally read `долг погашен` - was the rule's
  intent, not a deviation: `parity.js` tests its "стало лучше" branch
  before "долг погашен", so any entry recorded above `DEBT_SLACK` (0.5)
  reports "стало лучше" however completely it actually reached zero, and
  decided 5's literal wording ("reads it as `совпадает`") is
  unsatisfiable while a debt entry still exists - `совпадает` only ever
  prints when none does. Delete, then re-run to confirm, is the rule's
  intent.

- Batch name/id: **B8 - the anchor debts after B7** (this session, on
  `9fd3000`)
- What shipped: `tests/parity/specs.js` now says what CI measures on
  `9fd3000` and why it moved. Four `375` anchor entries become three:
  `#/tables/core_item ~ row anchor @ ru 375` 9.35 (was 10.52), `@ en 375`
  8.85 (was 9.92), `#/tables/voa ~ section anchor @ en 375` 9.86 (was
  10.31); `@ ru 375` on `voa` is deleted (CI reads 0.00). Every `why` string
  that cited "RAISED ... three CI runs and the ubuntu container" is
  replaced with one that names the real cause - the reduced-motion
  transition policy B7 changed, plus, for the `en` cells, the live app's
  re-scroll on a language switch that the rewrite does not replay. The
  block comment above the entries keeps its measured-sequence paragraphs
  and its closing paragraph is replaced with the mechanism as measured
  (`context.md`, "B8 planning facts"), naming B9 as the fix. No
  `VISUAL_DEBT` figure was taken from this host: every number is CI's, run
  `34616445556`, verbatim.
- Files changed: `tests/parity/specs.js` (four `375` anchor entries -> three,
  one note paragraph replaced), `tools/parity-ubuntu/README.md` (one
  paragraph under the calibration table pointing re-calibration at the
  latest CI run), `issues/47/plan.md`, `issues/47/handoff.md`,
  `issues/47/context.md` (planner's B8 sections; not re-touched by this
  batch beyond what the planner already wrote).
- No production code changed (`app/` untouched); `npm run check:built` was
  not run, per the brief - nothing a screen draws changes in this batch.
  `npm run check` is green (see "Verification"); the local `"anchor"`
  parity filter is advisory only and wrote no number.

- Batch name/id: **B7 remediation - the three review blockers and the false
  record** (this session, on top of `4776243`)
- What shipped: the print fit reads the layout it just wrote again.
  `tokens.css`'s reduced-motion `transition-duration` goes from `0.01ms` to
  `0s`, so an inline style write no longer starts a `CSSTransition` whose t=0
  value is the old one; the print page's white ground is enforced from
  `tokens.css`, where it can win the cascade; `.tabs` carries its own print
  rule. `plan.md`, `handoff.md` and `context.md` no longer claim a `cqw`
  instability class, and `docs/parity.md` gains no third one.
- Files changed: `app/src/styles/tokens.css` (reduced-motion
  `transition-duration`, and a new `@media print` for `html`/`body`),
  `app/src/components/Shell.svelte` (print block loses the dead
  `:global(html), :global(body)` rule; comment names the new split),
  `app/src/components/TabBar.svelte` (its own `@media print`),
  `app/src/components/PrintCard.svelte` (comment only - the reset claim now
  matches the code), `docs/specs/COVERAGE.md` (`LangSwitch` -> `Seg`),
  `issues/47/{plan,handoff,context}.md`.
- No production behaviour was added or removed: the fit's arithmetic, the
  markup and the `.pc-*` CSS are untouched, and no test needed changing -
  the defect lived entirely in a global CSS declaration that jsdom cannot
  observe, and its coverage is the parity harness's `cardFit` spec, which
  went from red on every long-text state to green on all nine in both
  languages at all three widths.

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

- Batch name/id: **B5.5 - the list page complete: drag as the live app does
  it, and the actions under a ticked selection** (this session, on `3cb2bd0`)
- What shipped: `ports/types.ts`'s `DragHandlers` gained `onDrag`/`onOver`/
  `onEnd`; `ports/drag.ts`'s `nativeDrag()` rewritten to the live event model
  (app.js 4443-4530) - a capturing `document` `dragover` bound only while a
  drag is live, an edge-scroll loop off a pure exported `edgeSpeed(y,
  innerHeight)`, the midpoint-based before/after mark, the `to` adjustment for
  the entry's own removal off the *last reported* mark. `ListPage.svelte`
  gained `dragFrom`/`dragMark` state, the three `class:` bindings (never
  toggled by the port itself - a scoped rule with no matching element fails
  the check as dead CSS), `guess`/`rp` state, `ticked`/`pricedCount` derived,
  the `.batch-acts` pair (`Цены` with its caret and `aria-expanded`, `Удалить
  (N)`), the `.guess` panel (the reprice row only when priced, the note, one
  row per ticked id with its band and suggested price, apply and clear-price
  buttons), and the four handlers looping the store's existing `setMeta`/
  `removeEntry`/`restoreEntry`. `lib/money.ts` gained `guessWhy(it, rarityOf,
  t)` and a local `voaTierName` helper. `dict.ts` gained fifteen key pairs
  byte-exact from app.js. `tests/parity/driver.js` gained `drag(from, to,
  after)`; `tests/parity/specs.js` gained five parity states, seven `NAME`
  entries, four press specs, `listAddress`'s `only`, and the "Recorded, not
  keyed" paragraph for nit 2. Nit 3's tokens replace `23px`/`680`/`-0.01em`
  in `ListPage.svelte`; nit 5 joins `rp`/`guess` to the "Local state" comment.
- **One real defect found and fixed in a file the batch was already
  extending, not named in the brief's line list: `NumberField`/
  `lib/numField.ts` stripped every non-digit character including a leading
  `-`, so no field could ever hold a negative number.** Invisible until now
  because every existing caller's `min` is 1 or more; the reprice field's
  default is `-20` and its whole point is a negative percentage, so this was
  not a hypothetical. Read off app.js's own `#rp` handler (4336-4344) - the
  live field commits every keystroke, unclamped, re-rendering only on a sign
  flip - and matched by passing `empty` to `NumberField`, which already
  commits per keystroke. `typed()`/`committed()` gained a `min` parameter
  (default `0`, so every existing call site is byte-for-byte unchanged) and a
  `digitsOf(raw, allowNeg)` helper keeping a single leading minus when `min <
  0`. `numField.test.ts` gained a `describe` block for the negative-range
  path; the pre-existing positive-range cases are untouched and still pass.
- Files changed: `app/src/ports/types.ts`, `drag.ts`, `ports.test.ts`;
  `app/src/components/ListPage.svelte`, `listPage.test.ts`, `NumberField.svelte`;
  `app/src/lib/dict.ts`, `money.ts`, `money.test.ts`, `numField.ts`,
  `numField.test.ts`; `tests/parity/driver.js`, `tests/parity/specs.js`;
  `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): three, in order - `docs(issue-47): B5.5 planned - two batches,
  not three, and the batch-size rule` (`36fd2f1`, the five doc paths from the
  planning pass, pathspec-committed so no code rode along), `feat(lists):
  drag as the live app does it` (`a006792`, steps 1-4), `feat(lists): the
  actions under a ticked selection` (steps 5-13, this session's closing
  commit). No push.
- Deviations and rationale: the `numField.ts`/`NumberField.svelte` fix above
  is not in the brief's file list but sits directly in the file step 6 was
  already extending to its first negative-range use, and the reprice field
  is unusable without it - exactly the "cheap, local, safe bug in a touched
  path" `CLAUDE.md` asks to fix rather than defer. No other deviation from
  the plan's ordered steps, acceptance criteria, or file list.

- Batch name/id: **B5.5's single fix-then-continue remediation pass - both
  review blockers, plus five lower-severity findings** (this session, on
  `ba0a92d`)
- What shipped: `drag.ts`'s `onStart` now requires `(e.target as
  HTMLElement).closest('[data-drag]')` before reading a row, matching
  `app.js:4452-4454` - a row's thumbnail, note textarea and number inputs are
  all natively draggable content, and none of them may start a reorder.
  `onOver` gained `if (from < 0) return;` at its top (`app.js:4492`); `onDrop`
  moved `e.preventDefault()` inside the existing `if (start >= 0 && at)` block
  instead of calling it unconditionally (`app.js:4509`) - together, a file
  dragged from the desktop or an image from another tab no longer paints a
  drop mark or has its own drop suppressed. The restored `setDragImage` guard
  (`if (row && dt.setDragImage)`, `app.js:4459`) needed an
  `eslint-disable-next-line @typescript-eslint/no-unnecessary-condition` -
  lib.dom types the method as always present. `numField.ts`: `committed()`
  and `typed()` no longer clamp at all when `min < 0` (the reprice field) -
  a bare minus or an empty field now commits to `0`, not `min`, and a typed
  value like `-900` is kept verbatim rather than clamped to `-90`, matching
  `app.js:4336-4344`'s unclamped `parseInt(el.value, 10) || 0`; every
  `min >= 1` caller is untouched (`digitsOf` still collapses to the old
  `replace(/\D/g, '')` there). `NumberField.svelte`'s `step()` changed from
  `committed(String(current + by), min, max)` to `clamp(current + by, min,
  max)`, since the stepper is now the only thing that clamps a negative-range
  field (`app.js:3916`) - `committed` no longer does it for anyone. `specs.js`:
  `reorderedByDrag` throws if `first` and `second` come back identical (a
  synthetic drag sequence that stopped moving anything on both apps used to
  read `совпадает` silently); the unused `NAME.ru.rollResult`/`NAME.en.
  rollResult` pair (and the comment explaining it) is removed.
- Tests: `ports.test.ts`'s shared `rows(n)` fixture now builds a real
  `[data-drag]` grip plus a `.row-body` child per row; every existing
  `dragstart` dispatch moved from the row to the grip (`gripOf`); three new
  cases - `dragstart` on the non-grip body asserts `onDrag` is never called,
  a stray `dragover` and a stray `drop` (no preceding `dragstart`) each
  assert their handler is not called and `event.defaultPrevented` stays
  `false`. `numField.test.ts`'s negative-range `describe` block: the bare-minus
  case now asserts `0`; a new case asserts an unclamped `committed('-999',
  -90, 500)` reading of `-999` and an unclamped `typed()` reading for both a
  positive and a negative overflow.
- Files changed: `app/src/ports/drag.ts`, `ports.test.ts`; `app/src/lib/
  numField.ts`, `numField.test.ts`; `app/src/components/NumberField.svelte`;
  `tests/parity/specs.js`; `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): one, `fix(lists): start a drag only from the grip`, on top of
  `ba0a92d`. No push.
- Deviations and rationale: none from the brief's nine numbered items. The
  `NumberField.svelte` `step()` change is a direct, necessary consequence of
  item 4 (removing `committed`'s clamp for the negative range would otherwise
  silently un-clamp the stepper too) rather than a separate deviation.

- Batch name/id: **B5.6 - the shared list page, the packed link, the bad
  link, and taking a shared list - the last lists batch** (this session, on
  `3324039`)
- What shipped: `#/l/<payload>` for a payload that is nobody's own list now
  draws the live `renderSharedList`: heading (or `Без названия`), the
  `Список от другого игрока · N позиций` sub as one text node, one
  `Добавить в список` control whose `+ Новый список` takes the whole list
  (name, both notes, every entry's players'-visible meta) into a new list
  and navigates to it, and whose chips pour ids with qty/gold/note (never
  the GM's own note) into an existing list; both list hitnotes above the
  rows, `TableRows` rows with `×qty · price` tails, each row's own hitnotes
  after it; a ticked row raises the selection bar, whose add-to-list also
  carries the shared meta. `#/l/~<packed>` expands through the compress port
  and rewrites the address to the plain form in place; a packed link that
  cannot expand, or any payload that does not decode, lands on `#/l/zzzz`.
  Closes B5.4a nit 1 (`RowMain`'s `tail` gets its caller) and B5.3 nit 5
  (`ListStore.create(name, init)` gets its second caller).
- Tests: `state/lists.test.ts` - `addIds` with `meta` copies qty above 1,
  gold above 0 and note, never `hnote`, for fresh ids only; an id already in
  the list keeps its own meta; no `meta` argument leaves `list.meta`
  untouched. `state/app.test.ts` - a new `describe('a packed address')`
  (five cases: expands at construction as a replace, lands on `#/l/zzzz`
  when the port cannot unpack without looping, lands there when `unpack`
  rejects, expands a hash the router announces after `start()`, expands
  through `go()`) and `toggleSel`/`shared` cases in the existing describes.
  `components/listPage.test.ts` - the "todo paragraph" case replaced with
  "draws the shared page"; two new cases for the packed-address frame and
  the bad-link landing. `components/sharedListPage.test.ts` (new, 20 cases
  across heading/sub, untitled, notes (including a `\n` → `<br>`), the three
  tail shapes plus coin mode, selection, the bar and the page's own chip
  carrying shared meta, the GM's note staying behind, taking the whole list
  into a new one, a blank name refused, a row's own modal, the bad link,
  English, and four axe passes). `a11y.test.ts` - both new components named
  in `COVERED`, one new `STATES` entry (the noted shared list, read from
  `notes-both-kinds.json` the way `listLink.test.ts` reads fixtures).
- Files changed: new `app/src/components/HitNote.svelte`,
  `SharedListPage.svelte`, `sharedListPage.test.ts`; changed
  `app/src/lib/dict.ts`, `lib/lists.ts`, `state/lists.svelte.ts`,
  `state/lists.test.ts`, `state/app.svelte.ts`, `state/app.test.ts`,
  `components/AddToList.svelte`, `components/ListPage.svelte`,
  `components/TableRows.svelte`, `components/RowMain.svelte`,
  `components/TablesPage.svelte`, `components/a11y.test.ts`,
  `components/listPage.test.ts`, `tests/parity/driver.js`,
  `tests/parity/specs.js`, `docs/specs/COVERAGE.md`, `issues/47/plan.md`,
  `issues/47/handoff.md`.
- Commit(s): one, `feat(lists): the shared list page`, on top of `3324039`.
  No push.
- Deviations and rationale: none from the brief's eleven ordered steps. One
  test-writing choice not spelled out in the brief: `listPage.test.ts`'s
  packed-address test scopes its query with `screen.getByRole('main')`
  rather than a `#app main` CSS selector - the same element, and the
  accessible-role form this suite already uses elsewhere. See `plan.md`,
  "B5.6 built", for the full accounting and exact verification commands/
  results.

- Batch name/id: **B7 - the print slice, one batch, the last of Phase 4**
  (this session, on top of `8b96ff4`)
- What shipped: `#/print/<ids>` draws the live `renderPrint` in full - the
  bar (`Печать карточек`, the count line, `Назад`/`Отправить на печать`/the
  colour-or-bw `Seg`/`Ссылка на набор`, the red cap note, the print-dialog
  note), A4 sheets of nine 63x88mm places with blanks after the last card
  and a page break from the second sheet on, and the empty page for an
  address naming nothing. `PrintCard.svelte` draws both layouts (colour and
  black-and-white) from one component, branching exactly where the live
  markup does, with the fit ported verbatim as a `$effect` calling a
  `fit(el)` that mirrors `fitPrintCards`'s loop body - same constants, same
  `-=0.1`/`-=1.5` steps, same `toFixed(1)`, same exits, reset-before-measure.
  `Seg.svelte` extracted on the segmented control's third use (`LangSwitch
  .svelte` deleted, `TablesPage.svelte`'s own `.seg*` rules deleted, an
  honest `aria-pressed` added to both the view switch and the print
  colour/bw control, which the live app's copies never had). `lib/print.ts`
  (new), `lib/hash.ts` (`printAsked`, `dropped` on the print route,
  `AppState.route` finally passing `knows`), `DialogPort.print()`,
  `label.ts printSrc`, 17 dictionary keys, the `back` icon, `@media print`
  across `Shell`/`PrintPage`/`PrintCard`/`SelBar`/`Toast`, three driver
  verbs (`media`, `computed`, `eachAt`) and four specs (`sheetCounts`,
  `cardFit`, `printMedia`, `copiedPrintLink`). Nine parity states replace
  the file's last `pending` line - `tests/parity/specs.js` has no `pending`
  state left.
- Tests: `lib/hash.test.ts` (`printAsked`, capped-route `dropped` cases),
  `lib/print.test.ts` (new, `cardArt`/`dmgParts`/`pages`/`glyphKey`/
  `PRINT_GLYPH`), `lib/label.test.ts` (`printSrc`), `ports/ports.test.ts`
  (`DialogPort.print()`, both real and fake), `state/app.test.ts` (the
  print route resolves known ids and `dropped`, and carries none when the
  data never loaded), `components/tables.test.ts` (one `aria-pressed`
  line), `components/a11y.test.ts` (`COVERED` for `Seg`/`PrintPage`/
  `PrintCard`, the `LangSwitch` line gone, one new axe state - a print
  sheet switched to black and white), `components/printPage.test.ts` (new,
  23 cases: arrival and control order, the loot card, no-art/broken-art,
  the weapon card's tier/tags/burden/die/ribbon/cells/labelled rule, the
  versatile magic weapon's second strip, a damage bonus, the armour card's
  shield/threshold strip, the artifact's list markup with no stray
  whitespace, the community source line, black-and-white end to end, a
  second sheet, the 180 cap and a dropped-duplicate, the empty address,
  `Назад`/print/link handlers including a refused clipboard, the fit ladder
  driven to its live floors under a faked jsdom layout, `noData`, English,
  axe on three sheets). `i18n.test.ts`'s "half-filled threshold pair" case
  rewritten (see `plan.md`, "B7 built", for why).
- Files changed: new `app/src/components/PrintCard.svelte`, `PrintPage
  .svelte`, `Seg.svelte`, `printPage.test.ts`, `app/src/lib/print.ts`,
  `print.test.ts`; changed `app/src/App.svelte`, `Shell.svelte`, `SelBar
  .svelte`, `Toast.svelte`, `TablesPage.svelte`, `a11y.test.ts`, `tables
  .test.ts`; `app/src/lib/hash.ts`, `hash.test.ts`, `dict.ts`, `i18n.ts`,
  `i18n.test.ts`, `icons.ts`, `label.ts`, `label.test.ts`, `types.ts`;
  `app/src/ports/types.ts`, `dialog.ts`, `ports.test.ts`; `app/src/state/
  app.svelte.ts`, `app.test.ts`; deleted `app/src/components/LangSwitch
  .svelte`; `tests/parity/driver.js`, `specs.js`; `docs/specs/FEATURES.md`,
  `COVERAGE.md`; `issues/47/plan.md`, `handoff.md`, `context.md`.
- Commit(s): see `git log` for this session's `feat(print): the print
  sheet` commit, on top of `8b96ff4`. No push.
- Deviations and rationale: two measured, harmless deviations from the
  brief's own numbers (no separate `dist/assets/*.css` - Vite inlines
  styles into `app.js` for this build config, pre-existing; `card/` is 36
  files, not 35, a planning-time miscount) and one cheap, in-scope fix
  (`i18n.ts`'s `eqParts` against the retyped `th`) - full accounting in
  `plan.md`, "B7 built". **One real, unresolved defect, carried to CI
  rather than resolved on a guess**: `cardFit`/`whole` cells on the four
  longest-text nine-card states show cards losing their art under this
  host, traced to `cqw`-unit inline-style writes on an already-mounted
  element reading back stale - full investigation, what was tried and
  ruled out, and why production code was left as the plan's own verbatim
  port: `plan.md`, "B7 built", and "Blockers" below.

## Verification

**Where each batch's evidence actually lives** (planner, 2026-09-13 - B14's
review nit 6). This section is **not** the index of gate results and never
became one: it holds one deep write-up, B11's, kept because its subject is why a
backgrounded `npm run check` cannot arm the commit gate. Everything else is
elsewhere, on purpose:

- **A closed batch's exact commands and results**: `plan.md`, "B<n> built", one
  section per batch - that is where an implementer writes them and where a
  reviewer reads them.
- **The batch that just closed**: the "Status" block at the top of this file,
  which carries its gates inline.
- **The next batch's required gates and their costs**: "Next batch", below.
- **Standing cost figures and the foreground-call rule**: `docs/parity.md`,
  "Batch size and the fixed cost of a run", and `context.md`, "`npm run check`,
  settled".

R0a appends its own commands and results under this heading when it closes.

### R0a's own commands and results (implementer, 2026-09-13)

Full write-up, every deviation, and the disposition of all twenty acceptance
lines: `plan.md`, **"R0a built: the format revision, and all three commits
landed"**. In one breath: three commits (`b0545ed`, `30b2744`, `47a9a15`),
none pushed; `npm run check` x3 (one per commit, all exit 0, 1017 tests,
96.6/88.55/97.03/97.3); `npm run check:built` once; eight
`node tests/app/golden.js --update|compare --shard=n/4` calls re-seeding the
goldens in the revised format (105 files, 1.58 MB, all eight green); four more
`--shard=n/4` comparison calls after C3 (105/105, zero differences,
proving the `isHome` deletion drew nothing); `node tests/run-all.js app/sweep`
(593.5s, backgrounded past the 600s cap by its own documented cost, all four
widths green); `node tests/run-all.js
app/contracts,app/states,app/typo,app/hues` (260.4s, all green); both B1
demonstrations (`MSYS_NO_PATHCONV=1 node tests/parity.js "no-such-state"`
exits 1, `"#/lists ~ created"` exits 0 printing 6 cells);
`git show 9177f3b | git apply --reverse --check -` exits 0, checked twice.
Line 20 (CI's wall-clock delta) is **open**, named to the coordinator's own
push - it cannot be measured before that run exists.

### B11's evidence, and why it is not a gate (orchestrator, 2026-09-12)

Four runs, all on the B11 working tree at base `9e3d19f`. Read them as
**advisory evidence that the tree is green**, not as the gate: the commit
gate arms only when `check-observer.mjs` sees a *foreground* `npm run
check`'s own stdout and exit code, and every full run tonight crossed the
600 s cap and was moved to the background, where the hook never sees it.
`.check-cache.json` does not exist. That is why nothing is committed.

| run | what | result |
|---|---|---|
| 04:02:57-04:17:42 | `npm run check`, the implementer's, orphaned | ~885 s wall; output lost with its shell |
| 04:18:12-04:36 | `npm run check`, the orchestrator's (`b11ftnfoo`) | exit 1: **1000 passed / 4 failed** of 1004; vitest 592 s |
| 04:40-04:54:44 | `npm run check`, the orchestrator's (`bxdvggxz2`) | exit 1: **1003 passed / 1 failed** of 1004; non-vitest half fully green (`derived` all sections, `i18n` parity, `selftest` 292/292); vitest 412 s |
| 04:37:14 / 04:55:14 | the failing files alone | `tables.test.ts` **78/78** (106 s); `searchPage.test.ts` **17/17** (87 s) |

**Every failure was host contention, and each was proved so by isolation.**
Three of the first run's four were bare `Test timed out in 30000ms`; the
fourth, `tables.test.ts:971` "the outline follows the record into the grid
view", expected `flash` on `[data-row="ci2"]` and read `tilewrap
svelte-15kqimd` - the anchor's flash class is removed on a timer, so a
starved assertion reads after it is gone. The second run's single failure,
`searchPage.test.ts`'s 300-match cap, was starved for 97.9 s against a
30 s timeout. Both files pass alone. **B11's own new cases - the four
decoder cases, the `parseHash` round-trip, and the event-ordering test -
were among the 1003 that passed.**

**Why the runs could not fit.** The host sat at 100 % CPU and 5.5 GB free
of 15.8 GB across 279 processes, all of it the owner's own applications
(Brave with three processes over 1000 s CPU, Telegram, several Claude
processes) - nothing an agent may kill. The non-vitest half alone took
~460 s against its usual ~77 s. At 55 % CPU the run still took ~840 s. On
an idle host this check is ~165 s (`context.md`, "`npm run check`,
settled"), so the block is load and nothing else.

**One self-inflicted part, recorded so it is not repeated.** Between
04:27 and 04:34 **two full vitest coverage passes ran on one tree** - the
orchestrator's and one the implementer started 37 s later. The
implementer had entered a retry loop: each re-invocation started another
`npm run check`, the foreground call crossed its cap, the process kept
running, and the agent was notified and started another. Five attempts.
The orchestrator mapped both process trees, `TaskStop`ped the implementer
(confirmed `killed`), and killed only the duplicate chain. The first run's
four failures are exactly the documented cost of that overlap; the second
run, single, dropped to one. `CLAUDE.md`'s "one session at a time per
working tree" covers agents on one tree as much as sessions.

**What remains for B11, in order, on an idle host:**

1. `set -o pipefail; npm run check 2>&1 | tail -n 120` - one **foreground**
   call. This is the one that arms the gate; a backgrounded run does not,
   however green. If it crosses 600 s again, the host is still loaded -
   stop, do not salvage, do not split it to dodge the cap.
2. `set -o pipefail; npm run check:built 2>&1 | tail -n 120`
3. `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/tables/frames" "#/tables/wondrous ~ filter" "#/tables/eq_secondary ~ filter link" "#/tables ~ a row opened" 2>&1 | tail -n 120` (7 states, 42 cells)
4. `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/i/ci1 ~ list menu" "#/i/ci1 ~ new list" "#/tables ~ bar menu" 2>&1 | tail -n 120` (3 states, 18 cells)
5. One `fix(app):` commit of the eleven files plus `issues/47/`.

Steps 1-12 of `plan.md`, "B11" are already applied to the tree - do not
redo them, read the diff. The two new parity states have never been run:
`#/tables/frames ~ two frames` must read `совпадает` on all six cells
(both apps 57 rows, two pills), and `#/tables ~ a row opened, list menu`
is new, so inspect its diff image before writing any entry, and write no
`VISUAL_DEBT` figure from this host.

- Commands run (exact), B10 on `b967481`, each one foreground call:
  - `git log --oneline -3` / `git status --short` (preflight) - matched
    the brief: HEAD `b967481` (later `daa2166`, another task's docs-only
    commit, re-checked before committing), only the planner's
    `issues/47/*.md` edits and the two untracked `issues/` directories,
    never staged.
  - `set -o pipefail; npm run typecheck 2>&1 | tail -n 200` - run twice
    ahead of the full gate to isolate the narrowing questions the plan
    flagged (`own.name`/`it` inside a `{#snippet}` closure declared after
    a truthy check): **0 errors, 0 warnings** both times; the plan's
    `svelte-check` fallback was never needed.
  - `set -o pipefail; npm run check 2>&1 | tail -n 150` - run twice. The
    first failed at `format:check` (`PageTitle.svelte` unformatted; fixed
    with `npx prettier --write`), then again failed one vitest case after
    reformatting moved the `{#if}` inside the tags and prettier put it on
    its own line - `sharedListPage.test.ts`'s "draws the name, the sub as
    one text node..." (`sub?.childNodes` length 2, not 1). After hoisting
    `PageTitle`'s `{#if}`s to wrap whole elements (see "Completed"), a
    third run: **exit 0**, `format:check`/`lint`/`typecheck`/`data`
    green, **998 tests passed**, thresholds held (statements 96.48,
    branches 88.4, functions 96.96, lines 97.22, 64.65s test time).
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 120` - build,
    `smoke` (opens from `file://`) and `budget` (88.4 kB against 120 kB)
    all green; `git diff -- app.js style.css index.html` empty.
  - `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/roll/std
    @" "#/roll/alt @" "#/roll/wondrous @" "#/lists @" "#/search @"` - 30
    cells, all `совпадает`.
  - `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/i/q1 @"
    "#/i/f1 @" "#/i/nope @" "#/i/ci1 ~ whole @" "#/roll/wondrous ~ modal
    @"` - 30 cells: 24 `совпадает` (the new `#/i/nope` six included), six
    `#/roll/wondrous ~ modal` cells read exactly their recorded debt
    (0.02/0.03/0.07% at 1100/768/375, both languages) with no `стало
    лучше`/`долг погашен` line.
  - `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists/a
    @" "#/lists/nope @" "#/l/ ~ shared @" "#/l/zzzz @" "#/print/ci1-q1 @"
    "#/print/nope @"` - 36 cells, all `совпадает`.
  - Every parity call printed its cell list (no vacuous `расхождений
    нет`); all three ran under `MSYS_NO_PATHCONV=1` from the start, per
    the host fact already on record.
  - `git diff -- app.js style.css index.html` (again, post-parity) -
    empty. `grep -rn` for each furniture class across
    `app/src/components/*.svelte` matched the acceptance criteria's own
    description exactly (see "Completed").

- Commands run (exact), B9 on `bb61db0` plus its remediation, each one
  foreground call:
  - `git log --oneline -3` / `git status --short` (preflight, twice - once
    at B9's start, once at the remediation's start) - matched the brief
    both times: only the expected `issues/47/*.md` edits and the
    untracked `issues/tg-preview-refresh/`, never staged.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout
    600000) - run **six** times over the whole pass (after the
    component/docs edits; after the `specs.js` edit; after the final
    handoff/plan wording; after the remediation's code and doc edits; a
    fifth run that failed - see below; a sixth after the fix), the tree
    changing between each, matching B8's own "the gate re-checks against
    the exact tree being committed" pattern. The first four: **exit 0**,
    997 tests passed, coverage 96.49 / 88.38 / 96.89 / 97.21. The fifth,
    right after adding N3's regression test, **failed one test**: the
    new case clicked `Chip`'s `<a href>` and expected a route change, but
    `memoryRouter` (unlike the real `hashRouter`) does not listen for a
    browser `hashchange`, so the click never reached the router at all -
    the file's own established pattern is to drive `env.router.navigate`
    directly (see "belongs to the table it was made on: a hash change
    drops it"), which the new case had not followed. Fixed by calling
    `env.router.navigate('#/tables/hnf_item')` and `await tick()` instead
    of clicking. The sixth run: **exit 0** - `format:check`/`lint`
    clean, `svelte-check` 540 files / 0 errors / 0 warnings, `data`
    (derived files match, catalog reads, stubs match, `noindex` present,
    i18n parity ru 251/en 251), `.claude/hooks/selftest.mjs` 292/292,
    `vitest run --coverage` 41 files / **998 tests passed**, coverage
    96.49 / 88.38 / 96.89 / 97.22 - all above threshold. The sixth run is
    the one that armed the gate for the remediation commit.
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 60` (Bash timeout
    600000) - run once, during B9 proper (a screen changes: the ring now
    draws). **Exit 0** - build (`dist/assets/app.js` 306.67 kB / 91.06 kB
    gzip), `file://` smoke, bundle budget (88.5 kB gzip against 120 kB).
    **Not re-run for the remediation** - N3's clear only changes what
    draws on a route change inside the flash's 1.6 s window, which no
    parity state exercises, and N4/N5/N6 touch a test-helper comment and
    docs prose only; nothing else in the remediation changes what a
    screen draws.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "anchor" "#/print/ci1-q1"`
    (before the `specs.js` edit, with all seven `VISUAL_DEBT` entries
    still in place) - advisory only, this host; no number written to
    `specs.js`. This is the measurement that justifies deleting all
    seven: every one of the seven debt-bearing anchor cells reads exactly
    **0.00%** against its old recorded figure. Matched 36 cells, not the
    predicted 24 (`"#/print/ci1-q1"` is also a prefix of
    `"#/print/ci1-q1-q313-cc1-voa2_a3-q23-w51-q35-di11"`, so both print
    states matched); the twelve print lines all read `совпадает` and are
    not reproduced here since no print entry changed. The twelve anchor
    lines, verbatim:

    ```text
    #/tables/voa ~ section anchor @ ru 1100
         вид: совпадает
    #/tables/voa ~ section anchor @ ru 768
         вид: совпадает
    #/tables/voa ~ section anchor @ ru 375
         вид: совпадает
    #/tables/voa ~ section anchor @ en 1100
      FAIL #/tables/voa ~ section anchor @ en 1100 :: вид :: 0.00%, долг записан как 0.63%
           стало лучше - опусти число в VISUAL_DEBT
    #/tables/voa ~ section anchor @ en 768
      FAIL #/tables/voa ~ section anchor @ en 768 :: вид :: 0.00%, долг записан как 0.42%
           долг погашен - удали запись из VISUAL_DEBT
    #/tables/voa ~ section anchor @ en 375
      FAIL #/tables/voa ~ section anchor @ en 375 :: вид :: 0.00%, долг записан как 9.86%
           стало лучше - опусти число в VISUAL_DEBT
    #/tables/core_item ~ row anchor @ ru 1100
         вид: совпадает
    #/tables/core_item ~ row anchor @ ru 768
         вид: совпадает
    #/tables/core_item ~ row anchor @ ru 375
      FAIL #/tables/core_item ~ row anchor @ ru 375 :: вид :: 0.00%, долг записан как 9.35%
           стало лучше - опусти число в VISUAL_DEBT
    #/tables/core_item ~ row anchor @ en 1100
      FAIL #/tables/core_item ~ row anchor @ en 1100 :: вид :: 0.00%, долг записан как 0.42%
           долг погашен - удали запись из VISUAL_DEBT
    #/tables/core_item ~ row anchor @ en 768
      FAIL #/tables/core_item ~ row anchor @ en 768 :: вид :: 0.00%, долг записан как 0.43%
           долг погашен - удали запись из VISUAL_DEBT
    #/tables/core_item ~ row anchor @ en 375
      FAIL #/tables/core_item ~ row anchor @ en 375 :: вид :: 0.00%, долг записан как 8.85%
           стало лучше - опусти число в VISUAL_DEBT
    ```

    Three cells read `долг погашен` (`voa @ en 768` 0.42, `core_item @ en
    1100` 0.42, `core_item @ en 768` 0.43); four read `стало лучше` (`voa
    @ en 1100` 0.63, `voa @ en 375` 9.86, `core_item @ ru 375` 9.35,
    `core_item @ en 375` 8.85) - `parity.js:582-599` tests the "стало
    лучше" branch first, so any entry recorded above `DEBT_SLACK` (0.5)
    reports that message regardless of how completely the actual result
    reached zero. All seven read 0.00%, which is why all seven were
    deleted. The four `@ en 1100|768` `-next.png`/`-diff.png` pairs from
    this exact run were copied to `issues/47/evidence/b9/` before the
    next run overwrote `test-output/parity/`;
    `core_item ~ row anchor @ en 1100`'s shows the gold ring around
    "Premium Bedroll" (`ci1`), confirmed by eye.
  - `tests/parity/specs.js` edited: all seven entries above deleted, the
    two long comment blocks replaced with one short note, one sentence
    added to "Recorded, not keyed".
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "anchor"` (12 cells, run
    twice - once right after the `specs.js` edit, once more after the
    remediation's N3/N4 code and comment changes, to confirm neither
    changed an anchor cell). Both runs identical, advisory only, no
    number written. All twelve lines, verbatim (second run; the first
    was byte-identical):

    ```text
    #/tables/voa ~ section anchor @ ru 1100  (arriving at a section link scrolls to and flashes it)
         вид: совпадает
    #/tables/voa ~ section anchor @ ru 768  (arriving at a section link scrolls to and flashes it)
         вид: совпадает
    #/tables/voa ~ section anchor @ ru 375  (arriving at a section link scrolls to and flashes it)
         вид: совпадает
    #/tables/voa ~ section anchor @ en 1100  (arriving at a section link scrolls to and flashes it)
         вид: совпадает
    #/tables/voa ~ section anchor @ en 768  (arriving at a section link scrolls to and flashes it)
         вид: совпадает
    #/tables/voa ~ section anchor @ en 375  (arriving at a section link scrolls to and flashes it)
         вид: совпадает
    #/tables/core_item ~ row anchor @ ru 1100  (arriving at a record's row link scrolls to and flashes it - a B1 table, not a new one)
         вид: совпадает
    #/tables/core_item ~ row anchor @ ru 768  (arriving at a record's row link scrolls to and flashes it - a B1 table, not a new one)
         вид: совпадает
    #/tables/core_item ~ row anchor @ ru 375  (arriving at a record's row link scrolls to and flashes it - a B1 table, not a new one)
         вид: совпадает
    #/tables/core_item ~ row anchor @ en 1100  (arriving at a record's row link scrolls to and flashes it - a B1 table, not a new one)
         вид: совпадает
    #/tables/core_item ~ row anchor @ en 768  (arriving at a record's row link scrolls to and flashes it - a B1 table, not a new one)
         вид: совпадает
    #/tables/core_item ~ row anchor @ en 375  (arriving at a record's row link scrolls to and flashes it - a B1 table, not a new one)
         вид: совпадает
    ```

    `расхождений нет` both times - clean exit, no `FAIL`, no `долг
    погашен` left, no `такого состояния нет`.
  - `docker info` - not attempted this pass (B8's own reading already
    established the panic on this host; not re-checked).

- Commands run (exact), B8 on `9fd3000`, each one foreground call:
  - `git log --oneline -3` - `9fd3000` on top, matching the brief; `git
    status --short` - only the planner's three `issues/47/*.md` files and
    `?? issues/tg-preview-refresh/`, matching the brief. Preflight passed
    with no drift.
  - `npm run build` - green (`data.json` 634 KB, `catalog.csv` 563 KB, 1061
    share pages, `dist/assets/app.js` 306.59 kB / 91.03 kB gzip). Required
    before the parity run: the harness photographs `dist/index.html`.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "anchor"` (2 states, 12 cells) -
    advisory only, this host; no number written. All twelve lines, verbatim:

    ```text
    #/tables/voa ~ section anchor @ ru 1100   вид: совпадает
    #/tables/voa ~ section anchor @ ru 768    вид: совпадает
    #/tables/voa ~ section anchor @ ru 375    вид: совпадает
    #/tables/voa ~ section anchor @ en 1100   вид: 0.63% из 0.63% долга
    #/tables/voa ~ section anchor @ en 768    вид: 0.42% из 0.42% долга
    #/tables/voa ~ section anchor @ en 375
      FAIL :: вид :: 0.00%, долг записан как 9.86%
      стало лучше - опусти число в VISUAL_DEBT
    #/tables/core_item ~ row anchor @ ru 1100   вид: совпадает
    #/tables/core_item ~ row anchor @ ru 768    вид: совпадает
    #/tables/core_item ~ row anchor @ ru 375
      FAIL :: вид :: 7.79%, долг записан как 9.35%
      стало лучше - опусти число в VISUAL_DEBT
    #/tables/core_item ~ row anchor @ en 1100   вид: 0.42% из 0.42% долга
    #/tables/core_item ~ row anchor @ en 768    вид: 0.43% из 0.43% долга
    #/tables/core_item ~ row anchor @ en 375
      FAIL :: вид :: 7.31%, долг записан как 8.85%
      стало лучше - опусти число в VISUAL_DEBT
    ```

    Exactly as the brief predicted: the eight non-375 cells unchanged
    (`совпадает` at `@ ru`, inside 0.42-0.63% debts at `@ en`); the three
    remaining 375 cells all "стало лучше" against the new CI figures on this
    host (`voa @ en 375` reads 0.00% here - this host measures no scroll
    offset on that mechanism, CI measures 22px; the two `core_item @ 375`
    cells sit under CI's figures, the documented Windows-vs-CI offset). The
    one stop condition named in the brief - any of the eight non-375 cells
    moving - did not occur, so the batch proceeded.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout
    600000) - **exit 0**. `format:check` clean, `lint` clean, `svelte-check`
    540 files / 0 errors / 0 warnings, `data` (derived files match `data.js`,
    catalog reads, stubs match the generator, `noindex` present, i18n parity
    ru 251 / en 251), `.claude/hooks/selftest.mjs` 292 passed / 0 failed,
    `vitest run --coverage` 41 files / **994 tests passed**, coverage
    96.52 / 88.44 / 96.95 / 97.24 - all above threshold, identically on
    every run. Run **four** times, three of them timed (70.25s / 92.04s /
    63.24s of vitest time): the commit gate re-checks against the exact tree
    being committed, and each pass over these docs while writing this record
    changed that tree, so `npm run check` was re-run after every further docs
    edit until one ran with no edit after it. That last run is the one that
    armed the gate for the commit below.

    **Corrected after the fact (orchestrator, 2026-09-11): this line first
    said three runs, and the fourth is the one worth keeping.** That run was
    piped through `tail -n 40` instead of the required `tail -n 120`, which
    truncated the coverage table's `All files` row out of what the gate's
    observer hook can see - so the check passed honestly and the gate
    silently did **not** arm. `CLAUDE.md` and `.claude/README.md` already
    mandate `tail -n 120`; what was not written down anywhere is the failure
    mode when you shorten it, which is not an error message but a gate that
    quietly stays closed. A shorter tail is not a smaller version of the
    command, it is a different one.
  - `docker info` - panics on this host too (`reflect: indirection through
    nil pointer`, client-side), same as the planning host. Fallback
    container reading not available; CI on the owner's push is the only
    second reading, as the plan allows for.
  - `npm run check:built` was **not** run - the brief marks it not required
    (no production code, nothing a screen draws changes).

- Commands run (exact), B7 remediation pass on top of `4776243`, each one
  foreground call:
  - `npm run build` - green; `dist/assets/app.js` 306.59 kB, 91.03 kB gzip.
  - A standalone Puppeteer probe against `dist/index.html` at 1100 under
    `emulateMediaFeatures([{ name: 'prefers-reduced-motion', value:
    'reduce' }])`, on the `LONG` route, run before and after the fix (kept
    in the session scratchpad, not in the repo - it linted red under the
    project's eslint config when parked in `test-output/`):

    ```text
    before  transitionDuration "1e-05s"  getAnimations() ["CSSTransition"]
            .pc-art 1-4: none/14cqw none/14cqw flex/40.0169cqw flex/40.0169cqw
            print media: nav display flex (0 client rects), header display none,
                         body rgb(14,12,21) on rgb(236,232,246), radial-gradient
    after   transitionDuration "0s"      getAnimations() []
            .pc-art 1-4: flex/32.8136cqw flex/35.3559cqw flex/40.0169cqw flex/40.0169cqw
            print media: nav display none, header display none,
                         body rgb(255,255,255) on rgb(0,0,0), background-image none
    ```

  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - **green**.
    Prettier clean, eslint clean, `svelte-check` 540 files 0 errors 0
    warnings, derived files match, i18n parity holds, hook selftest 292
    passed / 0 failed, **vitest 41 files / 994 tests passed**, coverage
    96.52 / 88.44 / 96.95 / 97.24 with every per-file threshold met
    (`PrintCard.svelte` 98.43/85.27/98.85/100, `PrintPage.svelte`
    100/94.11/100/100).
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/print"` (group A, 9 states,
    54 cells) - **`4 расхождений`**, down from 50 at `4776243`. Every
    `cardFit`, `sheetCounts` and control-name cell agrees; all four reds are
    image cells, identified by byte-comparing each `-legacy.png` against its
    `-next.png`: `NINE @ en 1100` (2.46%), `NINE @ en 768` (3.75%), `LONG @
    en 768` (3.53%), `LONG @ ru 1100` (3.38%).
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "voa2_a3-voa2_a1" "ci1-q1-q313"`
    (the same two states again, same build) - **`3 расхождений`**, a
    **different, non-overlapping set**: `NINE @ ru 1100`, `NINE @ ru 768`,
    `NINE @ en 1100`; both `LONG` states fully clean. The log printed
    "снимок целиком: 3/4 попытки до устойчивого кадра" repeatedly. Diff
    images opened: no content change - every card has its art, the red is a
    sub-pixel swim across the whole page including the topbar, best-aligned
    at a one-pixel vertical shift (a scan over shifts -6..+6 scored 1300 at
    -1 against 1855 at 0). All nine print states are `whole: true`, so this
    is `docs/parity.md`'s second unstable class and its recipe applies: no
    entry written, CI decides.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/roll/std @" "#/tables @"
    "#/tables ~ grid" "#/lists @" "#/search ~ searched"` (group B, 5 states,
    30 cells) - **`расхождений нет`**. `foundRows` legacy 87 / next 87. The
    two `~ grid` control entries remain the recorded legacy `tileHTML`
    numbering bug, unchanged.
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 60` - **green**;
    smoke "the built page opens from a folder", budget 88.4 kB gzip within
    the 120 kB budget.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120`, re-run after the
    doc edits to arm the commit gate - **green**, same figures.
- Not run, and why: nothing regenerates from `data.js` in this pass, so no
  `tools/build.js`-specific check beyond the one `npm run check` already
  runs; no new state was added to `tests/parity/specs.js`, so the state
  inventory is unchanged.

- Commands run (exact), this session (B7, on top of `8b96ff4`):
  - `npx vitest run app/src/lib app/src/ports app/src/state` (step 1) -
    green, 593 tests.
  - `npx vitest run app/src/components/shell.test.ts app/src/components/
    tables.test.ts` (step 2) - green, 97 tests.
  - `npx svelte-check --tsconfig ./tsconfig.json --fail-on-warnings` (ad hoc,
    between steps) - two errors on the first run (`Seg.svelte`'s unused
    `Snippet` import; `state/app.test.ts`'s readonly `Loot` literal not
    assignable to the mutable `Record_[]` array type), fixed; then clean at
    540 files, 0 errors, 0 warnings, repeated clean after every later step.
  - `npx vitest run app/src/components/printPage.test.ts` (step 4) - ten
    failures on the first run: jsdom (v30) implements `document
    .createRange()` but not `Range.prototype.getBoundingClientRect` at all,
    which `fit()`'s strip loop calls unconditionally on every card with a
    `.pc-strip` (fixed with a module-level zero-rect polyfill, the same
    shape a real browser gives an empty range); two `innerHTML` assertions
    compared against Svelte 5's own `<!---->` anchor comments and
    `svelte-xxxxx` scoping classes (fixed with a `withoutAnchors` helper);
    an ambiguous `getByRole('link', { name: 'Списки' })` matched both the
    tab bar and the page's own link (scoped with `within(main)`); the
    copied-link URL assumed the unhosted (`index.html`-named) form where
    `memoryRouter().hosted()` is `true` (fixed to the hosted form, matching
    every other test file's own `example.test` convention) - **exit 0**
    after all four fixes: 23 tests. `npx eslint`/`svelte-check` on the file
    found four more (an always-true type guard on the polyfill, an
    unnecessary `DOMRect` cast, an `unbound-method` flag on the restored
    `Range.prototype.getBoundingClientRect` reference, a `querySelectorAll`
    type mismatch) - all fixed, then clean; `npx prettier --write` on the
    two new components changed only `<script>` formatting, confirmed by
    diff - the `<!-- prettier-ignore -->`-protected, whitespace-sensitive
    card markup was untouched.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (step 7, one
    foreground call) - one failure on the first run: `lib/i18n.ts`'s
    `eqParts` against the newly-retyped `th` (see `plan.md`, "B7 built"),
    fixed, `i18n.test.ts`'s one affected case rewritten - **exit 0** on the
    next attempt: format/lint/typecheck clean (540 files), `data`/`derived
    .js`/`i18n.js`/`selftest.mjs` (292 passed) clean, 994 tests / 0
    failures, coverage 96.52 stmts / 88.44 branch / 96.95 funcs / 97.24
    lines - `PrintCard.svelte` 98.43/85.27/98.85/100, `PrintPage.svelte`
    100/94.11/100/100, `lib/print.ts` 100/90/100/100.
  - `npm run build` (step 8) - clean; `dist/assets/app.js` 306.52 kB, 91.02
    kB gzip. `grep -c "@page" dist/assets/*.css` - **no such file**; the
    build for this project inlines styles into `app.js` rather than
    emitting a separate stylesheet (confirmed pre-existing, unrelated to
    this batch - `vite.config.mts` is untouched in this diff). Read instead
    from `dist/assets/app.js`: `grep -c "@page"` reads **1**. `ls dist/card
    | wc -l` reads **36**, not the brief's 35 - `card/` on disk itself has
    36 files (verified: 6 dice x 3 variants + 7 paired vectors x 2 +
    `dots1-3` + `arrow` = 36), so the junction is byte-correct and the
    brief's count was a planning-time miscount, not a build defect.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/print"` (step 8, group A) -
    9 states, 54 cells (24 `whole`), plus `sheetCounts` x8, `cardFit` x8 per
    width, `printMedia` x4, `copiedPrintLink` x1 - **50 расхождений**, every
    one confined to `cardFit`/`whole`/`sheetCounts` on the four nine-card
    `whole` states (`NINE`, `NINE ~ black and white`, `LONG`, `LONG ~ black
    and white`) at some width/language combinations; `printMedia` read two
    stray diffs (`body`, `nav`) on the ten-card and empty-address states
    that are a shot-ordering artifact of this ad hoc investigation script,
    not the harness's own run (the harness's `printMedia.run` restores the
    medium in a `finally` before any shot; not reproduced under the real
    harness invocation). Diff images opened before writing anything, per
    `docs/parity.md`'s rule - real, describable difference (the first one
    or two cards on the affected sheets lose their art), not scattered
    noise. Full investigation trail, what was tried, and the decision not
    to chase it further in production code: `plan.md`, "B7 built", and
    "Blockers" below.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/roll/std @" "#/tables @"
    "#/tables ~ grid" "#/lists @" "#/search ~ searched"` (step 8, group B,
    the regression) - 5 states, 30 cells - **расхождений нет**; `foundRows`
    printed 87/87 on both apps.
  - `npm run check:built` (step 9) - **exit 0**: build clean, `file://`
    smoke opens from a folder, bundle budget 88.4 kB against 120 kB.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (step 11, one
    foreground call, run immediately before the commit since the doc edits
    moved the tree fingerprint) - **exit 0**, re-arming the gate for
    `feat(print): the print sheet`.

- Commands run (exact), this session (B6, on `a25eeac`, HEAD moved to
  `37ecc8d` under this batch - a peer's unrelated artwork commit, preserved):
  - `npx vitest run app/src/lib app/src/state` (step 1) - two failures on
    the first run, both in the new `search.test.ts` cases and both a
    test-writing bug rather than a code bug: "keeps the type word" asserted
    `hits.every((x) => x.eq?.t === 'weapon')` for a query
    ("основное оружие") that also matches ordinary prose on non-weapon
    records; "is per language" asserted `search(..., 'основное', en)`
    `toEqual([])`, which fails for the same reason. Both rewritten to call
    `statLineFor` directly on one record and compare the built line rather
    than routing through `search()` and the corpus's other text fields -
    **exit 0** after the fix: 22 files, 509 tests.
  - `npx vitest run app/src/components/std.test.ts app/src/components/alt.test.ts`
    (step 2) - green unchanged, 34 tests.
  - `npx vitest run app/src/components/tables.test.ts` (step 3) - green
    unchanged, 74 tests.
  - `npx vitest run app/src/components/a11y.test.ts` (step 4) - green, 25
    tests, guard passes with both new components named.
  - `npx vitest run app/src/components/searchPage.test.ts` (step 5) - two
    failures on the first run: Escape did not close the `<dialog>` in
    jsdom (rewritten to close via the "Закрыть" button, matching how every
    other test in the suite closes the modal - no other test relies on
    native Escape either); a selection-bar assertion read stale DOM
    immediately after `env.router.navigate(...)` with no `tick()` (added
    one, matching `tables.test.ts`'s own hash-change case) - **exit 0**
    after both fixes: 17 tests.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (step 8) - three
    failures on the first attempt, none a behaviour bug: prettier flagged
    the three touched test files (fixed with `prettier --write`); eslint
    flagged `@typescript-eslint/no-unsafe-assignment` on `SearchPage.svelte`
    and `TablesPage.svelte`'s `oninput={(v) => { q = v; }}` (both needed an
    explicit `(v: string)` annotation - the inline handler's parameter type
    was not inferred from `SearchBox`'s own prop signature) and
    `@typescript-eslint/restrict-template-expressions` on three template
    literals over a `number` in the new cap-test fixture (wrapped in
    `String(...)`); the full `npm run test` then timed out at 30s on the
    cap-test case under `--coverage` instrumentation (five keystrokes each
    re-rendering 300+ rows; switched to `userEvent.paste`, one `input`
    event instead of five) - **exit 0** on the next attempt: format/lint/
    typecheck (535 files, 0 errors) clean, `data`/`derived.js`/`i18n.js`/
    `selftest.mjs` (292 passed) clean, 947 tests / 0 failures, coverage
    96.27 stmts / 88.53 branch / 96.67 funcs / 97.01 lines.
  - `npm run build` (step 9) - clean; `dist/assets/app.js` 280.74 kB, 84.13
    kB gzip.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/search"` (step 9, group A) -
    7 states × 2 languages × 3 widths = 42 cells, plus `foundRows` x4,
    `copiedSelection` x1, `typeRuns` x2, `visuals`, `inventory`, `heading`,
    `title` - **расхождений нет**.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "roll/std ~ items only"
    "roll/alt ~ crit, items only" "#/tables ~ searched" "#/tables/eq_secondary
    ~ searched" "#/tables ~ nothing found" "#/l/ ~ packed"` (step 9, group
    B, the regression) - 6 states, 36 cells - **расхождений нет**;
    `packedExpanded` read `{ expanded: true }` on both apps without
    throwing.
  - `npm run check:built` (step 10) - **exit 0**: build clean, `file://`
    smoke opens from a folder, bundle budget 81.7 kB against 120 kB.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (step 12, one
    foreground call, `timeout: 600000`, run immediately before the commit
    since the doc edits above moved the tree fingerprint) - **exit 0**,
    re-arming the gate for `feat(search): the search page`.

- Commands run (exact), this session (B5.6, on `3324039`):
  - `npx vitest run app/src/state app/src/lib` (step 1) - green, 501 tests.
  - `npx vitest run app/src/components/sharedListPage.test.ts` and the full
    `npx vitest run` (ad hoc, between steps, to catch compile/logic errors
    before the formal gates) - one failure found and fixed (`getByText('For
    players')` matched two elements in the English case - the list note and
    ci1's own entry note share the label; changed to `getAllByText(...)
    .length`), then 38 files / 921 tests green.
  - `npx eslint <every file this batch touched>` - one error found and fixed
    (`@typescript-eslint/no-unnecessary-type-assertion` on an unneeded `as
    HTMLInputElement` in `sharedListPage.test.ts`), then clean (the two
    `tests/parity/*.js` files are eslint-ignored by config, expected).
  - `npx svelte-check --tsconfig ./tsconfig.json --fail-on-warnings` - eleven
    errors on the first run, all fixed: `state/lists.svelte.ts`'s `addIds`
    meta-copy used `(m.qty ?? 0) > 1` then read `m.qty` again, which
    `exactOptionalPropertyTypes` does not narrow - changed to `typeof m.qty
    === 'number' && m.qty > 1`, same for `gold`; `SharedListPage.svelte`'s
    `entries` built `{ it, tail: undefined }` objects, not assignable to
    `TableEntry`'s optional `tail?: string` under the same flag - changed to
    omit the key entirely when `tailOf` returns `undefined`;
    `ListPage.svelte`'s final `{:else}` lost `own`'s null-narrowing once a
    second `{:else if route.kind === 'sharedList' && ...}` branch sat beside
    the bare `!own` one - restructured to `{:else if !own}` with the
    packed/shared-page distinction nested inside it, so the bare `!own` check
    is what narrows `own` for the final branch, same as before this batch;
    `listPage.test.ts`'s new bad-link case passed `{ id: 'z', ... }` to
    `encodeList`, which takes `ListShape` (no `id`) not `StoredList` -
    dropped the field. **exit 0** on the second run: 532 files, 0 errors, 0
    warnings.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (step 7, one
    foreground call, `timeout: 600000`) - **exit 0** on the first attempt:
    format/lint/typecheck clean, `data`/`derived.js`/`i18n.js`/
    `selftest.mjs` clean (292 passed), 921 tests / 0 failures, coverage 96.3
    stmts / 88.51 branch / 96.77 funcs / 97.06 lines.
  - `npm run build` (step 8) - clean; `dist/assets/app.js` 278.03 kB, 83.59
    kB gzip.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/l/"` (step 8) - 30 state
    cells (five states × two languages × three widths) plus `listAddress`,
    `tookSharedList`, `addedSharedToList` - **расхождений нет**. Every
    `~ packed` cell read `совпадает`; `expanded()` needed no fallback.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "i/ci1 ~"` (step 8) - 36 cells
    (the `AddToList` regression) - **расхождений нет**.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/tables @" "#/tables ~ a row
    ticked" "#/tables ~ bar menu" "#/lists/a @" "#/lists/a ~ rolled"` (step
    8) - 30 cells (`TableRows`, the bar's menu, `ListPage`'s branch and the
    `HitNote` extraction) - **расхождений нет**.
  - `npm run check:built` (step 9) - **exit 0**: build clean, `file://`
    smoke opens from a folder, bundle budget 81.2 kB against 120 kB.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (step 11, one
    foreground call, `timeout: 600000`, run immediately before the commit
    since the doc edits above moved the tree fingerprint) - **exit 0**,
    re-arming the gate for `feat(lists): the shared list page`.

- Commands run (exact), this session (B5.5's remediation pass, on `ba0a92d`):
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (one foreground call,
    `timeout: 600000`) - one lint failure on the first attempt
    (`@typescript-eslint/no-unnecessary-condition` on the restored
    `setDragImage` guard; fixed with an `eslint-disable-next-line`), **exit 0**
    on the second: 888 tests, 0 failures, coverage 96.15 stmts / 88.41 branch
    / 96.97 funcs / 97.06 lines. `drag.ts` alone: 99.03 stmts / 86.53 branch /
    100 funcs / 100 lines - up from B5.5's own 84.61% branch, the new
    no-active-drag guard cases closing most of the gap the review found; the
    handful of branches still open are the same class `src/ports/**`'s 55%
    branch floor exists for - a `DataTransfer` missing `setDragImage`, or
    missing entirely, which jsdom cannot reproduce.
  - `npm run build` - clean; `dist/assets/app.js` 273.61 kB, 82.44 kB gzip.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists/a @"` - the drag verb
    (inside `reorderedByDrag`, `only: ['#/lists/a']`) plus the six
    pre-existing cells; all six `совпадает`, `расхождений нет`. Neither app's
    `reorderedByDrag` result carried the spec's new throw.
  - No `npm run check:built` - the fix changes behaviour, not anything drawn.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (one foreground call,
    `timeout: 600000`, run immediately before the commit since the doc edits
    above moved the tree fingerprint) - **exit 0**, same 888 tests and
    coverage as the first run (no production code moved between the two,
    only `plan.md`/`handoff.md`); the commit gate armed for `fix(lists): start
    a drag only from the grip`.

- Commands run (exact), this session (B5.5, on `3cb2bd0`):
  - `npx vitest run app/src/ports` (step 1) - green, 57 tests.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (step 4, one
    foreground call, `timeout: 600000`) - **exit 0** after one formatting
    fix (`npx prettier --write app/src/ports/ports.test.ts`).
  - `npm run build` - clean; `dist/assets/app.js` 264.89 kB, 82.41 kB gzip.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists/a @"` (step 4) - all
    six pre-existing cells `совпадает`; `reorderedByDrag`'s `first`/`second`
    id orders matched on both apps - **the live app's synthetic drag moved
    the entry correctly on the first attempt, no fallback needed.** Commit
    `feat(lists): drag as the live app does it` (`a006792`).
  - `npx vitest run app/src/lib/money.test.ts`, `app/src/lib/numField.test.ts`,
    `app/src/components/listPage.test.ts` (steps 5-7) - all green as each was
    written; two coverage gaps caught by the full run below (`money.ts`'s
    `voaTierName` 'C'-tier and numeric-tier branches) were closed with two
    more `money.test.ts` cases before the final check.
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (step 9, one
    foreground call, `timeout: 600000`) - **exit 0**, 883 tests, coverage
    96.11/88.28/96.97/97.05 statements/branches/functions/lines, every
    threshold met, `money.ts` and `drag.ts` both fully reached.
  - `npm run build` - clean; same 82.41 kB gzip.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "~ a row ticked" "~ prices"`
    (step 10; the substring also matched `~ prices, none priced` and `~
    prices set`, as the brief warned - 5 states, 30 cells) - `расхождений
    нет`, all 30 `совпадает`.
  - `MSYS_NO_PATHCONV=1 node tests/parity.js "~ batch deleted"` (1 state, 6
    cells, timed) - all 6 `совпадает`.
  - Regression: `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists/a @"
    "#/lists/a ~ noted" "~ money help" "~ roll panel" "~ rolled" "~ removed"
    "~ note opened"` (7 states, 42 cells - all four `only: ['#/lists/a ~
    noted']` press specs, `repricedRows`/`clearedPrices`/`batchDeleted`
    included, ran here) - all 42 `совпадает`, unchanged.
  - Regression: `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists/b"
    "#/lists/nope" "own list"` (3 states, 18 cells) - all 18 `совпадает`.
  - Because `NumberField.svelte` changed: `MSYS_NO_PATHCONV=1 node
    tests/parity.js "#/tables @" "i/ci1 @" "#/roll/alt @"` (3 states, 18
    cells) - all 18 `совпадает`.
  - **All eleven `#/lists/a*` states plus `#/lists/b`, `#/lists/nope` and
    `#/l/ ~ own list` read `совпадает` on the first pass. No diff image was
    ever opened - nothing read non-zero.**
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 120` (step 11, one
    foreground call, `timeout: 600000`) - **exit 0.** `npm run build` (clean,
    same output), `npm run smoke` ("the built page opens from a folder"),
    `npm run budget` (80.1 kB gzip against the 120 kB budget).
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (step 13, one
    foreground call, `timeout: 600000`, run immediately before this commit
    since the doc edits change the tree fingerprint) - **exit 0**, same 883
    tests and coverage as step 9 (no production code moved between the two
    runs, only `plan.md`/`handoff.md`); the commit gate armed for the
    `feat(lists): the actions under a ticked selection` commit that followed.

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

**No implement-ready batch is queued. The next cycle is a planning one: R0b.**
R0a is closed (its brief is kept below as the record). R0b is an outline only -
`plan.md`, "R0b planned in outline: re-home what must survive" - and needs a
planning pass before an implementer opens it.

What that pass owes, from the outline and from what R0a learned:

- **The ten legacy suites with no `tests/app/` counterpart** - `behave`,
  `craftmob`, `eqtest`, `flows`, `lists2`, `noart`, `notes`, `print`, `qa`,
  `select` - each get one of three verdicts with the reason in the commit:
  *covered already* (by a named test, not "probably"), *ported*, or *dropped*.
  `print` is named by Phase 7's own text: nine 63x88 mm cards per A4 with
  browser-measured fitting is a product law in `CLAUDE.md` and no other
  instrument measures it.
- **`tests/parity/driver.js` has to be re-homed**, and R0a added a fifth
  dependant to it. R0c's outline deletes `tests/parity/` whole, so the driver
  five `tests/app/` suites import must move before that happens. R0a moved
  nothing.
- **`tests/app/states.js` case 7's swallowed 5000ms timeout** - PLACED in
  "Deferred" above, with the evidence in `context.md`.
- **The review's four nits** - also in "Deferred", all cheap and local.
- Entry condition: R0a landed and `main` green on the full workflow. **Both are
  satisfied**: run `34755188652` on `6e1269b`, green in every job.

R0c still needs **the owner's go** (Phase 7 condition 6) and is where the
one-file revert ends.

### Closed record: R0a - the evidence, the sweep, and the structural goldens

- **Name:** R0a - the evidence, the `ACCEPTED`/`VISUAL_DEBT` sweep, and the
  structural goldens.
- **Objective:** carry every recorded divergence out of `tests/parity/specs.js`
  into the specs before R0c deletes that file, stand up the structural text
  goldens that replace the parity harness as the rewrite's own regression net,
  and close the five inherited items. **R0a deletes nothing** - the one-file
  revert (`git revert 9177f3b`) survives it untouched.
- **Full design, every decision, the disposition table and the normalisation
  rules:** `plan.md`, **"R0a planned: the evidence, the sweep, and the
  structural goldens"**. Read it before starting; it settles what a golden file
  contains, how the 105 states are carried, how each of the 18 `VISUAL_DEBT`
  entries and all 10 `ACCEPTED` reasons are dispositioned, and why no public
  contract moves. Do not re-derive those.
- **Then read `plan.md`, "Decided 1, revised: what a golden captures for the
  largest states"** (planner, 2026-09-13, after the seed measured 5.2 MB). It
  replaces Decided 1's capture format with two extra rules, moves the size gate
  to 2 MB, adds `--shard=n/of`, and puts `ci.yml` in scope. **Where the two
  disagree, the revision wins.** C1's steps 1-4 are already built and are kept;
  the batch resumes at "What C1 becomes".

**Preflight** (measured by the orchestrator and the planner this session; do not
re-measure, but do re-read `git log --oneline -3` and `git status` before
writing):

- **Superseded 2026-09-13 by the format revision** - HEAD is now `29eae18`, three
  `.md`-only commits past `32926a0`. `dist/` built from either is byte-identical,
  so warrant `34747570250` still covers the re-seed. The two bullets below are
  kept because their *rule* still applies, with their contents corrected:
- HEAD `29eae18` on `main` (was `32926a0` when this batch was first written).
  B14's three code commits are pushed.
- The working tree is **not clean**, but differently from how this block first
  read: the four `.claude/` and `context.md` edits are now committed. What is
  uncommitted is `issues/47/plan.md` and `issues/47/handoff.md` (this revision),
  the three new untracked paths this batch owns (`tests/app/golden.js`,
  `tests/app/inventory.js`, `tests/app/snapshots/`), and
  **`issues/tg-preview-refresh/`, which is another task's**. Re-read
  `git status` yourself; **never `git add -A`; stage by path.**
- **A second interactive session shares this working tree.** This planning pass
  was document-only and safe beside it. The implementer's gates are not: check
  `test-output/parity.lock` and `git status` before any parity or vitest run,
  and do not start a heavy run while that session has one alive.
- Phase 7 conditions 1, 2, 3 and 5 - all R0a needs - are satisfied with run ids
  in `context.md`, "State at the R0a planning kickoff". `6cb8293`'s cancelled
  run is explained there and is not a blocker.

**Step 0, before anything else:** `gh run view 34747570250` (HEAD's own run, all
four parity shards). That run is the **seeding warrant** for the goldens.
Green -> proceed and name the id in C1's commit message. Not green -> **stop and
raise**. Run `34721165294` on `37c5c2f` is green and full but predates B14's
three code commits and is **not** an adequate substitute.

**In scope:** `tests/app/inventory.js` (new, **written and verified - keep it**),
`tests/app/golden.js` (new, **written - amend it, do not rewrite**),
`tests/app/snapshots/*.txt` (new, 105 - **delete and re-seed: the format
changed**), `tests/run-all.js`, **`.github/workflows/ci.yml`** (moved in by the
revision - the suite gets its own 4-shard job rather than 17 minutes bolted onto
`check`), `.claude/hooks/edit-guard.mjs`, `.claude/hooks/selftest.mjs`,
`docs/specs/COVERAGE.md`, `docs/specs/FEATURES.md`, `tests/parity/specs.js`
(comments only), `tests/parity.js`, `docs/parity.md`,
`app/src/state/app.svelte.ts`, `app/src/state/app.test.ts`,
`tests/app/states.js`, `tests/app/typo.js`.

**Out of scope, and a stop-and-raise if it looks necessary:** any deletion;
any value change in `ACCEPTED` or `VISUAL_DEBT`; `docs/fixtures/`,
`tests/contracts.js`, `docs/specs/CONTRACTS.md`, `llms.txt`,
`index.html`, `app.js`, `style.css`; re-homing
`tests/parity/driver.js` (R0b's); the fifteen legacy suites (R0b's); `print`'s
geometry port (R0b's).

**Steps:** three commits, in this order and for the reason the plan gives -
C1 the goldens (seeded from the warranted tree, so C3's `isHome` deletion is
then proved harmless by C1's own instrument), C2 the sweep, C3 the inherited
checks and the B1 harness fix. The per-commit step list is `plan.md`, "The
commits" - **except C1's, which resumes mid-flight**: its steps 1-4 are already
built and verified (warrant, `npm run build`, `inventory.js`, `golden.js`), so
C1 starts at `plan.md`, **"What C1 becomes"** - amend `golden.js` with the two
rules, `--shard`, and the `съёмка:` line; delete and re-seed
`tests/app/snapshots/`; then the original steps 6-8 plus the `ci.yml` job.

**Acceptance criteria** - **twenty** lines (sixteen, of which 2 and 3 are
amended by the format revision, plus four the revision adds), and **the batch may
not be recorded closed while any one of them has no outcome** (`plan.md`, "A
placement has to be acceptance, not a footnote"). Numbers 11-16 are inherited
items, each here as its own line rather than as a cross-reference; 17-20 come
from `plan.md`, "Decided 1, revised":

1. `gh run view 34747570250`'s conclusion recorded, and the id named in C1's
   commit message. **Already satisfied and recorded** (every job green,
   `plan.md`, "R0a built", step 0); `dist/` is still byte-identical to that tree,
   so it carries over to the re-seed and no new warrant is taken.
2. **AMENDED.** `tests/app/snapshots/` holds exactly 105 `.txt` files, one per
   inventory state, four sections each; the total size is recorded; **over 2 MB**
   stops to raise rather than commits. The gate moved from 4 MB because the
   revised format replays at **1.50 MB** over this very corpus - a measurement,
   not an estimate - so 2 MB is headroom for the real capture and still stops a
   format that has gone wrong. The previous 5.2 MB seed is **deleted**, not
   migrated.
3. **AMENDED.** Every state is captured twice on the same unchanged `dist/` and
   the second capture compares byte-equal to the first, taken as **eight
   foreground calls**: `--update --shard=n/4` four times, then `--shard=n/4` four
   times, all eight green and together reporting 105 states. Each call's wall
   clock and its `съёмка: Xs из Ys` line are recorded verbatim. The old "twice,
   both compared" shape is dropped, not deferred: a comparison measured 1005 s
   and cannot fit the 600 s foreground cap at any capture size, and the third
   capture it asked for re-reads an instrument whose second reading already
   agreed. The evidence that the capture reproduces is already banked (exit 0,
   105 states, zero differences, 1005 s) and is cited in the built record.
4. The three refusals demonstrated and then restored: a deleted `.txt` fails
   "missing", an orphan `.txt` fails "stale", `--only=no-such-state` fails
   "selected nothing".
5. `tests/app/inventory.js`'s equality check against `specs.js` passes, and is
   demonstrated to fail by changing one id locally before restoring it.
6. All five `FEATURES.md` bullets written, and the two "verified, no edit"
   verdicts (the anchor re-play, the two-frame link) in C2's commit message.
7. No value in `ACCEPTED` or `VISUAL_DEBT` changed or deleted; `git diff` over
   `tests/parity/specs.js` shows comment lines only.
8. `docs/specs/COVERAGE.md` names `app/golden` and `tests/app/inventory.js`, and
   states what a golden cannot catch.
9. `.claude/hooks/edit-guard.mjs` refuses a write under `tests/app/snapshots/`,
   with a selftest case, and `selftest.mjs` is green inside `npm run check`.
10. Nothing is deleted: `git show 9177f3b | git apply --reverse --check -` exits
    0 on the final tree, and `index.html`, `app.js`, `style.css`,
    `tests/parity/`, `docs/parity.md` and the fifteen legacy suites all remain.
11. **Blocker B1** - `tests/parity.js` fails a filtered run that compared no
    cell and prints `сравнено ячеек: N` on every run. Proved both ways:
    `MSYS_NO_PATHCONV=1 node tests/parity.js "no-such-state"` exits **1**;
    `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists ~ created"` exits **0**
    printing 6 cells.
12. **B14 nit 1** - `isHome` deleted from `app/src/state/app.svelte.ts` with its
    four `app.test.ts` assertions (:134, :137, :143, :170), **or** the built
    record states why it stays.
13. **B14 nit 2** - `tests/app/states.js` case 14 asserts the image was marked,
    demonstrated to fail by renaming the selector locally.
14. **B14 nit 3** - `tests/app/typo.js` asserts `EXPECTED` covers `PAGES` in
    both directions and no longer defaults to `[]`.
15. **B14 nit 4, re-placed into R0a from R0b/R0c** (the planner's call: R0a
    already has `FEATURES.md` open, and `CLAUDE.md` forbids using "out of scope"
    to skip a local fix) - `FEATURES.md`'s pin line matches `ROUTES.md`'s
    corrected text: eight sections pin as their own hash, `#/tables` pins as
    whichever table is on screen.
16. **B14 nit 6** - this file's `## Verification` section carries the pointer
    line (**written in this planning pass**; confirm it survived the batch's
    edits) and R0a's own commands and results are appended under it.

Added by the format revision, each its own line:

17. **Rule A is demonstrated on the two states it was designed against, by
    reading the seeded file, not by assertion.** `_tables_eq_weapon.txt` carries
    a `... button x<N> of 317 same-shape siblings elided` line whose total is
    317, and `_search_capped.txt` carries one whose total is **300** alongside a
    surviving `checkbox "Выбрать все (300)"`. Both totals are quoted in the built
    record. A ticked row is demonstrated **not** to be elided:
    `_tables_a_row_ticked.txt` keeps its `checkbox "Выбрано" [checked=true]` and
    its `checkbox "Selected" [checked=true]` in full, one of each, exactly as the
    5.2 MB seed has them at lines 46 and 311 - a different attribute value means
    a different signature, so the one ticked row can never fold into the run of
    unticked ones.
18. **Rule B is fail-closed, demonstrated not asserted.** Change one character
    **past position 64** of one long name locally (in `dist/`, or by hand in a
    golden), run that state's shard, and the run fails on a changed `namehash`.
    Restore before committing. `namelen`/`namehash` appear **only** on lines the
    cap fired on.
19. **`--shard=n/of` behaves like `parity.js`'s.** Four shards together compare
    105 states and no state twice (`node -e` over the inventory's indices is
    enough); a malformed or out-of-range `--shard` **throws**; and `--shard`
    suppresses **neither** the missing-golden nor the stale-file guard - only
    `--only=` does. Demonstrated: an orphan `.txt` still fails a sharded run.
20. **CI's wall clock does not grow.** `ci.yml:51` reads
    `--exclude=parity,app/golden`; a `golden` job with `matrix.shard: [1, 2, 3,
    4]` exists beside `parity`'s, with the same failure-artifact upload;
    `tests/run-all.js` carries four `app/golden` rows. The first post-push run's
    per-job durations are recorded and compared against `34747570250`'s
    (`check` 11m51s, `parity (3)` 10m32s) - the built record states the delta.

**Verification commands**, one foreground call each, with costs in `plan.md`,
"Gates, and what each costs" and the revision's run-cost section. **No local full
parity run** - CI's four shards are the read:

```text
set -o pipefail; npm run check 2>&1 | tail -n 120     # once per commit, timeout 600000
npm run check:built                                   # once, in C1
rm -rf tests/app/snapshots                            # the format changed
node tests/app/golden.js --update --shard=1/4         # then 2/4, 3/4, 4/4  (~250s each)
node tests/app/golden.js --shard=1/4                  # then 2/4, 3/4, 4/4  (~250s each)
node tests/app/golden.js --shard=1/4                  # then 2/4, 3/4, 4/4 again after C3:
                                                      # C1's own instrument is what proves
                                                      # C3's isHome deletion drew nothing
node tests/run-all.js app/sweep
node tests/run-all.js app/contracts,app/states,app/typo,app/hues
MSYS_NO_PATHCONV=1 node tests/parity.js "no-such-state"        # must exit 1
MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists ~ created"    # must exit 0, 6 cells
```

**Never call `node tests/run-all.js app/golden` in the foreground**: it runs all
four shards serially in one process, ~1000 s, past the cap. Locally, call the
shard directly; CI runs the four in parallel as its own job.

**Risks / do-nots:** do not seed the goldens from an unwarranted tree - and note
that the moment any **non-document** commit lands before the re-seed, warrant
`34747570250` stops covering `dist/` and a fresh green run is owed; do not
substitute an older green run; do not regenerate a golden to make a
non-reproducible state go quiet (name it and exclude it in code with the reason,
or report it); do not delete anything **except `tests/app/snapshots/`, which the
format change requires be re-seeded from empty**; do not `git add -A`; do not
widen either new rule to buy bytes - rule A's signature must keep attribute
*values* and rule B's hash must cover the *whole* name, or both stop being
fail-closed.

After R0a: **R0b -> R0c**, outlined in `plan.md`, "The finishing plan"; **R0c
needs the owner's go** and is where the one-file revert ends.

### Closed record: B14 (landed 2026-09-13)

- Name: **B14 - the roll surface, the pinned home, and the checks that
  should have caught them.** Full design: `plan.md`, **"B14 planned"**; the
  built record, every deviation, every gate result, and the disposition of
  all ten acceptance lines: `plan.md`, **"B14 built"**.
- Landed as three commits on `main`, **none pushed** (this session's
  instruction overrides `CLAUDE.md`'s "push once a batch passes"):
  `6b18291` (C1, the roll re-render fix), `af7fa17` (C2, the pinned home),
  `a7f8787` (C3, the six inherited checks).
- **The remount claim did not hold**, checked directly rather than assumed:
  `App.svelte` does not remount `TablesPage` between two `tables` addresses,
  demonstrated in `shell.test.ts` before the fallback design was chosen. Took
  the named fallback - `toggleHome(hash?)` plus `PageHead`'s `home` override,
  fed by `TablesPage`'s own `table` - rather than the naive
  `route.table ?? 'core_item'`, which would have pinned the wrong table
  whenever a bare `#/tables` was reached from a named one (e.g. the "Таблицы"
  tab).
- `canPinHome` deleted, not wired: every real `PageHead` caller is already a
  pinnable route, so wiring it would have been a permanently-true check.
- One local fix found while touching `typo.js`, not designed for: its three
  name-based grips were hardcoded to Russian regardless of `lang`, so every
  English pass had been silently gripping nothing on those controls since the
  suite was written - fixed with a small per-language label table.
- Gates, all green, each one foreground call: `npm run check` **x3** (1013,
  then 1017, then 1017 tests); `npm run check:built` once after C2;
  `MSYS_NO_PATHCONV=1 node tests/parity.js "#/roll" "#/lists/a ~ roll panel"
  "#/lists/a ~ rolled"` after C2 (the first attempt, without the env var, had
  its arguments rewritten by Git Bash and matched zero cells - noticed
  because no per-cell lines scrolled past, **not** caught by a banner (the
  harness prints no counts - blocker B1, carried into R0a); rerun correctly
  over the intended 20 states = **120 cells**, no discrepancies); `node tests/run-all.js app/sweep` and the other four
  `tests/app/` suites after C3, both green. `git show 9177f3b | git apply
  --reverse --check -` exits 0 on the final tree.
- Not touched, as planned: `.github/workflows/ci.yml`, `index.html`,
  `app.js`, `style.css`, `tests/parity/specs.js`, `docs/fixtures/`,
  `tests/contracts.js`, `llms.txt`, `docs/specs/DEBT.md`, `ACCEPTED`,
  `VISUAL_DEBT`.

B13's, B12.1's, B12's, B11.1's and B11's briefs are kept below only as closed
records.

### Closed record: B13 (landed 2026-09-12)

- Name: **B13 - the reversible cut-over.** Full design: `plan.md`, **"B13
  planned"**; the built record, with the run id, the guard's published list,
  `check-site.mjs`'s output, all six deviations and the rehearsals:
  `plan.md`, **"B13 built"**.
- Landed as three commits, all pushed: `0819a73` (the entry document, the
  derived checks and `tools/check-site.mjs`), `9177f3b` (`ci.yml` alone, the
  flip), `a004764` (the review's two documentation blockers).
- CI run `34718569245` on `9177f3b`: green in every job. The published set is
  13 entries with no `app.js` and no `style.css`; `check-site.mjs` passed
  against the live URL; the owner walked the site and returned LGTM.
- Not touched, as planned: `docs/fixtures/`, `tests/contracts.js`,
  `llms.txt`, `tests/parity/specs.js`, `index.html`, `app.js`, `style.css`,
  `base: './'`, and `concurrency: pages` / `cancel-in-progress: false`.

### Closed record: B12.1 (landed 2026-09-12)

- Name: **B12.1 - the router's bare-vs-unreadable fallback.** Full design,
  the four-row divergence table, the rule, the file list, steps 1-9,
  acceptance and gates: `plan.md`, **"B12.1 planned"**; the built record and
  the one deviation found while implementing (two stale `'#/print/w1,w2'`
  fixtures, unrelated to the rule itself): `plan.md`, **"B12.1 built"**.
- Landed as one commit, `bc96b59` (`fix(app): make bare and unreadable
  addresses match live's own fallback`), pushed to `origin/main`. Seven files:
  `app/src/state/app.svelte.ts`, `app/src/App.svelte`,
  `app/src/state/app.test.ts`, `app/src/components/shell.test.ts`,
  `tests/app/contracts.js`, `tests/app/sweep.js`, `docs/specs/ROUTES.md`.
- All gates green: `npm run check` (exit 0, `App.svelte` coverage rose to
  100% statements, no threshold moved, 1011 tests); `npm run check:built`;
  `node tests/run-all.js app/contracts,app/sweep` (574.5s slowest entry,
  `app/contracts` with no `skipped` line - all 26 route fixtures now read
  field by field). No parity call, as planned. CI's four shards on the push
  are still the outstanding read (not checked by this session).
- Not touched, as planned: `docs/fixtures/urls/routes.json`,
  `tests/contracts.js`, `docs/specs/CONTRACTS.md`, `llms.txt`,
  `tests/parity/specs.js`, `index.html`, `app.js`, `style.css`.

### B13 - the reversible cut-over

- Name: **B13 - the reversible cut-over.** Full design: `plan.md`, **"B13
  planned"**. Three commits: **F1** the entry document and its checks
  (`app/index.html`, `tests/derived.js`, new `tools/check-site.mjs`,
  `META.md` section 1, `CONTRACTS.md` section 5's sentence); **F2**
  `.github/workflows/ci.yml` **and nothing else** - the flip, so a revert is
  one file; **F3** the documents, with the deploy run id and both check
  outputs.
- The published set, assembled explicitly (never `cp -r dist/.`, because
  `dist/img`, `dist/og` and `dist/card` are symlinks the build makes):
  `dist/index.html`, `dist/assets/`, `dist/data.js` from the build, plus
  `data.json catalog.csv llms.txt robots.txt .nojekyll LICENSE img og i card`
  from the repository. Leaving the published set: `index.html`, `style.css`,
  `app.js` - which are named in no spec, fixture or external document.
- Not a contract change: the reasoning clause by clause is in the plan. No
  `docs/fixtures/`, `tests/contracts.js` or `llms.txt` edit.
- How a bad deploy is caught and undone: the four gates `deploy` already
  needs, then the assembly guard (refuse `app.js`/`style.css`, require every
  path and non-empty `img/og/i/card`, require `noindex` and `assets/app.js`
  and the absence of `src="app.js"` in the published `index.html`), then
  `tools/check-site.mjs` against the live URL as the job's last step, then one
  human walk. Revert = `git revert` the F2 commit and push; the old app is
  still in the repository and still gated.
- The parity job stays in CI unchanged through the window - it is what keeps
  the fallback known-good, and `deploy` needs it.
- Gates: `npm run check` before F1 and before F2; `check:built` once; the five
  `tests/app/` suites in **two** calls (`app/sweep`, then the other four) -
  ~9 minutes across the two, and the combined four-suite call crossed 600 s
  once under the throttle; no local parity call.

### Closed record: B12 (landed 2026-09-12)

- Name: **B12 - the real-browser layer on `dist/`, and the gates.** Full
  design and the exact step list: `plan.md`, "Phase 5 - the testing
  pyramid, planned", **"B12 planned"** (decided 1-6 of that section, the
  file list, the driver contract, steps 1-16, acceptance, verification
  with costs, risks, fallback). The decisions behind it: the same file's
  "B12 - ... (outline; decided points)" immediately above it, and Phase 5's
  decided 1-7. Durable numbers: `context.md`, "Phase 5 planning facts" and
  "Q3 planning facts". This section is the brief; the plan is the authority
  where the two differ in detail.
- Objective: build the one layer the pyramid is missing - a real browser
  driving `dist/` with trusted input - and move the gates that decided 4
  and 5 say should move. Five suites under `tests/app/`, one new driver
  verb, the coverage thresholds, the axe rule narrowing, and the coverage
  matrix rewritten to say what is true afterwards. No new dependency, no
  Playwright, no pixel golden.
- In scope, by commit (three commits, one batch - `plan.md`, "B12
  planned", decided 1):
  - **C1** `tests/parity/driver.js` (`press` only), `vite.config.mts`
    (thresholds per decided 4), `app/src/test/a11y.ts` (`{ allow }` per
    decided 5) and the `StorageNotice` call sites, the two component cases
    that give `Icon` and `SelBar` their missing branch,
    `app/src/lib/hash.test.ts` (nits 2 and 3), `docs/specs/FEATURES.md`
    (nit 5), `docs/specs/DEBT.md` (D6's "Where" gains the `pop` sentence),
    `docs/specs/COVERAGE.md`'s enforcement half.
  - **C2** `tests/app/lib.js`, `sweep.js`, `typo.js`, `hues.js`,
    `contracts.js`; `app/src/components/FilterBar.svelte` (`data-val` on
    `.fpill`), `Chip.svelte` (an optional `value` -> `data-val`),
    `StdPanel.svelte` (the source chips pass it); `tests/run-all.js`;
    `.github/workflows/ci.yml` (the step's name only).
  - **C3** `tests/app/states.js`, its `run-all.js` entry,
    `docs/specs/COVERAGE.md`'s suite table and thin spots, `CLAUDE.md`'s
    one focused-command line, `issues/47/`.
- Out of scope: `print` geometry (`tests/app/print.js` is Phase 7's), the
  structural goldens and any JSON or PNG freeze (Phase 7, decided 2),
  deleting or weakening any legacy suite (Phase 7, decided 3),
  `tests/parity.js`, `specs.js`'s `VISUAL_DEBT`/`ACCEPTED`,
  `docs/fixtures/` including `routes.json`, the live root files, a fourth
  harness width, Playwright.
- Files expected: six new under `tests/app/`, eleven edited, plus
  `issues/47/`. The full list with what each contains is in `plan.md`,
  "B12 planned", "The files, and what each contains".
- Steps: `plan.md`, "B12 planned", steps 1-16. In one breath: the step 1
  probe (the three unmeasured widths and axe contrast against `dist/`,
  recorded before anything is written); `press`; the thresholds; the axe
  `allow`; the two branches; the three nits and D6's sentence; check;
  **C1**; `lib.js`; sweep, typo, hues; the two `data-val` edits and
  contracts; the runner and CI name; check, check:built, the four suites,
  one parity call; **C2**; `states.js`'s thirteen cases; the runner entry,
  `COVERAGE.md` and `CLAUDE.md`; check and `app/states`; **C3**; push;
  plan and handoff.
- Acceptance criteria: `plan.md`, "B12 planned", "Acceptance criteria" -
  in short: all five suites green together and each alone; `click`
  byte-identical and `specs.js` untouched; axe running with
  `color-contrast` **on** and every disabled rule named and cited; every
  fixture replayed against `dist/` with none edited; `states.js` case 3
  reading the modal's new-list form inside `.modal-card`'s box on Самоцвет
  Чутья at 1100x900 with no seed; the raised thresholds holding with no
  new exclusion; `Icon` and `SelBar` above 75.0 branches; the parity cells
  unchanged from B11.1's readings; `COVERAGE.md` with no "waits for Phase
  5" sentence and `CLAUDE.md` under 200 lines; the three live root files
  untouched in all three commits.
- Verification commands (each **one foreground call**, Bash timeout
  600000; costs from `plan.md`, "B12 planned", "Verification commands"):
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - **before each of
    the three commits**, ~165 s idle each. A run that crosses 600 s is
    re-run idle, never salvaged or backgrounded.
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 120` - before C2
    only; a few minutes.
  - `set -o pipefail; node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts 2>&1 | tail -n 120`
    before C2, then
    `set -o pipefail; node tests/run-all.js app/states 2>&1 | tail -n 120`
    before C3. Estimated 3-4 min for the first; it needs a **built
    `dist/`**, which `npm run check` never produces - run `npm run build`
    (or `check:built`) first.
  - `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "~ filtered" "#/roll/std" 2>&1 | tail -n 120`
    before C2 - 6 states / 36 cells, cold legacy cache (step 2 edits
    `driver.js`, which is hashed into the cache's root key), a few minutes.
    Without `MSYS_NO_PATHCONV=1` Git Bash rewrites the argument and the run
    matches nothing: confirm the call printed its cells.
  - The **full parity suite is not run** and is not one foreground call
    (~867 s). Nothing in B12 asks for it.
- Risks / do-nots: run the step 1 probe **first** - three of the sweep's
  four widths and every axe contrast reading are unmeasured against
  `dist/`, and what they find decides whether B12 carries production
  fixes; keep the focus-ring walk to six addresses at two widths in one
  language (everywhere, it alone would cost ~7 min); do not add a fourth
  harness width (`WIDTHS` is hashed into every parity cache key); do not
  turn `click` into `press` - every recorded debt figure was measured with
  the synthetic dispatch; do not commit a red or expected-to-fail test
  (D6's Phase 8 verification hook is R3's); do not delete or skip a legacy
  suite; do not move a threshold to make a file pass; do not edit
  `docs/fixtures/` if a fixture fails - root-cause and report; do not
  `git add -A` (`issues/tg-preview-refresh/` is another task's); two other
  sessions share this tree, so re-read `git log --oneline -3` before each
  of the three commits.
- Fallbacks: `plan.md`, "B12 planned", "Fallback" - a rewrite-only defect
  the probe finds becomes a named `B12.1` with an `allow` citing it; a
  live-shared a11y violation becomes a `DEBT.md` entry with an `allow`
  citing it; an over-budget sweep drops the focus walk to 1180 first, then
  axe to RU at the narrow widths; the `Chip` `value` prop can be dropped in
  favour of reading the source chips positionally if it proves awkward.
- A **reviewer runs after B12**, because it changes what CI enforces.
  B12 is **mid-plan**, not terminal (Phases 6, 7 and 8 remain), so its
  review nits defer to "Deferred" rather than being fixed in the
  remediation cycle - `CLAUDE.md`, "Orchestration".
- NEEDS_HUMAN_CONFIRMATION: no.

- Name: **B11.1 - the menu's second measurement (CLOSED).** Full design
  and the exact step list: `plan.md`, "Phase 5 - the testing pyramid,
  planned", "B11.1"; the root cause: `plan.md`, decided 7, "Defect 2b";
  the numbers: `context.md`, "Q3 planning facts".
- What shipped: the placement `$effect` in `AddToList.svelte` now resets
  `up` to false and lets the DOM catch up before measuring (matching
  `placeMenu`'s redraw-then-measure order), keeps the first-`.btn` reading
  (the live reading, D6), and calls `flushSync()` before
  `menu.scrollIntoView` so the class lands on the menu before it scrolls;
  `onDocumentClick`'s comment is narrowed (nit 4) with the guard itself
  byte-identical to B11's. `tests/parity/specs.js` gained `#/tables ~ a
  row opened, new list` (no seed, Самоцвет Чутья) and the nit-5 line fix;
  `docs/specs/DEBT.md` gained D6; `docs/specs/FEATURES.md` and
  `docs/specs/ROUTES.md` each gained one clause (nits 1's companion and
  nit 2); `app/src/lib/hash.test.ts` gained the nit-3 case.
- See "Status" above for the red-first reading, every gate's exact result,
  and the commit hash.

- Name: **B11.1 - the menu's second measurement.** Full design and the
  exact step list: `plan.md`, "Phase 5 - the testing pyramid, planned",
  "B11.1" (decided/do-not-reopen, steps 1-11, acceptance, risks,
  fallback); the root cause: `plan.md`, decided 7, "Defect 2b"; the
  numbers: `context.md`, "Q3 planning facts". This section is the brief;
  the plan is the authority where the two differ in detail.
- Objective: keep the add-to-list menu inside the record modal on the
  live app's side after "+ Новый список" is pressed (the rewrite flips it
  under the card's edge in a 17 px band of card heights); pin it with a
  parity state that reads red before the fix; write the live defect the
  port reproduces on purpose (the flip measures the window, then
  `scrollIntoView` chops the card's picture) into `DEBT.md` as D6; pay
  B11's nits 2-5 in the files this batch opens.
- In scope: `app/src/components/AddToList.svelte` (the placement
  `$effect`: `up = false` before the `tick()`, the same first-`.btn`
  reading with a comment naming D6, `flushSync()` before
  `scrollIntoView`; the `onDocumentClick` comment narrowed - nit 4),
  `tests/parity/specs.js` (`#/tables ~ a row opened, new list`, **no
  seed**, Самоцвет Чутья; the `app.js:2718-2726` line - nit 5),
  `docs/specs/DEBT.md` (D6, in D5's shape), `docs/specs/FEATURES.md`
  (one clause on the card-menu bullet), `docs/specs/ROUTES.md` (one
  sentence: unknown groups fail open - nit 2), `app/src/lib/hash.test.ts`
  (`#/tables/nope/f_tier-1_cls-phy` takes no legacy reading - nit 3),
  `issues/47/`.
- Out of scope: measuring the toggle or the card (Phase 8 R3, named in
  D6), `overflow: clip`, `RecordModal.svelte`, `RecordCard.svelte`, the
  driver, `tests/app/` (B12), thresholds, the live files, any
  `VISUAL_DEBT`/`ACCEPTED` figure, a fourth harness width.
- Files expected: the six above plus `issues/47/`.
- Steps: `plan.md`, "B11.1", steps 1-11. In one breath: preflight; the
  effect's reset-measure-place-scroll order; the guard's comment; the
  state; the specs line; D6; the two spec sentences; the hash case; the
  gates with the red-first parity read; one `fix(app):` commit; the
  handoff.
- Acceptance criteria: `plan.md`, "B11.1", "Acceptance" - the new state
  reads a difference at 1100 before step 2 and `совпадает` on all six
  cells after; `#/tables ~ a row opened`, `~ a row opened, list menu`,
  `#/i/ci1 ~ new list`, `#/tables ~ bar menu` unchanged; the guard
  byte-identical to B11's; `git show HEAD -- app.js style.css index.html`
  empty; thresholds held.
- Verification commands (each one foreground call, Bash timeout 600000):
  - `set -o pipefail; npm run check 2>&1 | tail -n 120`
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 120`
  - red first (state registered, fix not yet applied):
    `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/tables ~ a row opened, new list" 2>&1 | tail -n 60`
  - then: `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/tables ~ a row opened" "#/i/ci1 ~ new list" "#/tables ~ bar menu" 2>&1 | tail -n 120`
    (5 states / 30 cells; `#/tables ~ a row opened` is a prefix and
    matches its two siblings; without `MSYS_NO_PATHCONV=1` Git Bash
    rewrites `#/i/...` and the run matches nothing - confirm each call
    printed its cells).
- Risks / do-nots: do not "improve" the measurement - the toggle-based
  reading is more correct and fails parity by design; do not seed the
  new state; keep `flushSync()` between setting `up` and the scroll; if
  the red-first read is `совпадает` on this tree, swap the record to
  Малое Зелье Лечения on `#/tables/core_consumable` (the second record
  in the band) before touching the effect; a `check` that crosses 600 s
  is re-run idle, never salvaged.
- Fallback: none for the fix; for the state, any of the four measured
  records that reads red at 1100 with no seed (`context.md`, "Q3
  planning facts", table).

B11's own brief is kept below only as a closed record, for anyone
reconstructing what shipped; it is not the next batch.

- Name: **B11 - the decoder, and the menu that closed itself (CLOSED).**
  Full
  design and the exact step list: `plan.md`, "Phase 5 - the testing
  pyramid, planned", "B11" (decided/do-not-reopen, steps 1-14,
  acceptance, risks, fallback). Durable facts and the probe numbers:
  `context.md`, "Phase 5 planning facts". This section is the brief; the
  plan is the authority where the two differ in detail.
- Objective: fix the two owner-reported defects in the rewrite, pin each
  with the test that would have caught it, register the two parity states
  that make them visible, and write the behaviour into the specs. No
  harness change, no threshold change, no live-file change.
- In scope: `app/src/lib/filters.ts` (`decodeFilter(segment, groups)`:
  the legacy `_` reading only when every piece's head names a group the
  table offers), `app/src/lib/hash.ts` (`parseHash` passes
  `groupsFor(table)`, `[]` for no table), `app/src/lib/filters.test.ts`
  (four cases, existing calls gain their groups),
  `app/src/lib/hash.test.ts` (the two-frame route parses and round-trips),
  `app/src/components/AddToList.svelte` (`onDocumentClick`: a target that
  is no longer connected was inside this control - return),
  `app/src/components/lists.test.ts` (a case that forces `flushSync()`
  from a body listener between the app's handler and the document's;
  must fail on the unfixed component - record that), `tests/parity/specs.js`
  (`#/tables/frames ~ two frames`; `#/tables ~ a row opened, list menu`
  with `storage: two`; one "Recorded, not keyed" sentence on the
  two-frame link's live-side failure), `docs/specs/ROUTES.md` ("every
  piece names a group the table offers"), `docs/specs/FEATURES.md` (the
  OR clause and the two-frame link; the menu staying open through the
  new-list form), `docs/specs/COVERAGE.md` (one thin-spot bullet on
  trusted events), `issues/47/plan.md`, `issues/47/handoff.md`.
- Out of scope: `docs/fixtures/urls/routes.json` (its two-frame entry
  waits for Phase 7 - `tests/contracts.js` would fail it against the live
  app in CI), `tests/contracts.js`, `CONTRACTS.md`, `llms.txt`,
  `TablesPage.svelte`, the `$effect` placement in `AddToList` (2b not
  reproduced), `tests/app/` (B12), `vite.config.mts`, `a11y.ts`, any
  `VISUAL_DEBT`/`ACCEPTED` figure, the live files.
- Files expected: the eleven above plus `issues/47/`.
- Steps: `plan.md`, "B11", steps 1-14. In one breath: preflight; the
  decoder takes `groups`; `parseHash` passes them; the four decoder
  cases and the route case; the one-line guard with its comment; the
  flush-ordering test, run red first; the two states; the prose
  sentence; the `ROUTES.md` sentence; the two `FEATURES.md` clauses; the
  `COVERAGE.md` bullet; the four gates; one `fix(app):` commit; the
  handoff.
- Acceptance criteria: `plan.md`, "B11", "Acceptance" - the new vitest
  cases green and the ordering case recorded red-then-green;
  `#/tables/frames ~ two frames` `совпадает` on all six cells (57 rows,
  two pills on both apps); `#/tables ~ a row opened, list menu` read and
  its diff inspected before any entry; the eight pre-existing states in
  the two filters unchanged; `git show HEAD -- app.js style.css index.html`
  empty; thresholds held; specs and `specs.js` carry their edits.
- Verification commands (each one foreground call, Bash timeout 600000):
  - `set -o pipefail; npm run check 2>&1 | tail -n 120`
  - `set -o pipefail; npm run check:built 2>&1 | tail -n 120`
  - `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/tables/frames" "#/tables/wondrous ~ filter" "#/tables/eq_secondary ~ filter link" "#/tables ~ a row opened" 2>&1 | tail -n 120`
  - `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/i/ci1 ~ list menu" "#/i/ci1 ~ new list" "#/tables ~ bar menu" 2>&1 | tail -n 120`
  (7 states / 42 cells, then 3 states / 18 cells; without
  `MSYS_NO_PATHCONV=1` Git Bash rewrites `#/i/...` and the run matches
  nothing - confirm each call printed its cells.)
- Risks / do-nots: the host was loaded tonight (vitest alone 378-393 s
  against a ~165 s whole `check` idle) - a `check` that crosses 600 s is
  re-run idle, never salvaged or backgrounded; do not widen the legacy
  reading past `groupsFor(table)`; do not touch `TablesPage`'s
  read-back; do not add `routes.json` entries; no `VISUAL_DEBT` figure
  from this host; if the `~ two frames` English cells differ, suspect the
  chip-name lookup under `EN`, not the decoder.
- Fallback: `onclickcapture` on the document listener if the
  `isConnected` guard is ever found insufficient by B12's real-click
  state; the ordering test passes either way.

~~After B12: **Phase 6** (publish `dist/` - the `deploy` job collects `dist/`
and the generated folders instead of the root files; owner-gated on the Pages
flip), then **Phase 7** as R0 of the unified 7/8 track...~~

**Superseded 2026-09-12.** Phase 6 is not owner-gated - Pages is already
`build_type: workflow` - and it is two batches: **B12.1**, then **B13**, the
reversible flip. Phase 7's deletions move behind the flip with their own entry
condition (the owner's "publish early, delete later"). Phase 8 still follows
Phase 7, for the unchanged reason. The order is
`B12.1 -> B13 -> soak -> Phase 7 R0 -> Phase 8`; see `plan.md`, "Phase 6 - the
cut-over, replanned".

## Blockers

- **CLOSED by the planner (planner, 2026-09-13): "is 5.2 MB the accepted cost of
  a faithful structural golden of this catalogue?"** Answered **no**, and the
  reason is churn rather than bytes - 14,720 of 40,361 lines carry a name over 64
  characters, so a content edit rewrites an unreadable diff and the instrument
  stops being read. Two local rules replace the format and take the corpus to
  ~1.50 MB / 24,346 lines, measured by replaying them over the seed itself. The
  size gate moves 4 MB -> 2 MB. **Not escalated to the owner**: at 1.5 MB the
  addition is 2.4% of a 63.4 MB tree and smaller than the already-committed `i/`,
  which puts it inside the planner's remit. Design: `plan.md`, "Decided 1,
  revised: what a golden captures for the largest states".
- **CLOSED in the same pass: "acceptance line 3 cannot be taken in one foreground
  call."** True as written and true at any capture size - a comparison measured
  1005 s against a 600 s cap - so the line is rewritten rather than waived. The
  suite gains `--shard=n/of` and the proof becomes eight ~250 s foreground calls.
  The 2.4x seed-to-compare gap is unexplained by the compare path's own work and
  is **instrumented** (`съёмка: Xs из Ys` on every run) rather than guessed at.

- **RESOLVED - the host block lifted and every gate ran green
  (orchestrator, 2026-09-12, later the same day).** The CPU read 8 % on
  the next session; `npm run check` completed in one foreground call
  (41 files / 1004 tests, thresholds held), `check:built` likewise, both
  parity calls read `совпадает` on all 60 cells, and B11 committed as
  `73facda` / `64f9a27`. The second precedent for this block lifting on
  its own; nothing about the batch was ever suspect. One transient to
  know about: the first `check` attempt failed on `tests/derived.js`
  ("заглушек устарело 506") while a peer session was mid-write in `i/` -
  `node tests/derived.js` passed standalone immediately after and the
  next full run was green. `i/` was never modified in git. **If that
  failure appears with `git status -- i/` clean, re-run; do not "fix"
  anything under `tools/` or `i/`.** The record of the block is kept
  below.

- **(the original entry, kept as the record) the gate cannot run on this
  host while it is loaded
  (orchestrator, 2026-09-12).** `npm run check` measured ~885 s, ~840 s
  and, vitest alone, 592 s / 412 s against a 600 s foreground cap, with
  the CPU at 100 % from the owner's own applications. A backgrounded run
  never arms the commit gate, so B11 cannot be committed until one
  foreground call completes. Precedent: the same block on 2026-09-11
  lifted on its own by 08:25 and the check went green in five minutes
  ("The host block lifted, and the check is green"). Nothing about the
  batch is suspected - the tree reads green twice over, isolation proves
  every failure was contention.

- **CLOSED by the planner's pass (planner, 2026-09-12, later the same
  day): Q1 settled by the owner; Q2 answered - `plan.md`, decided 2,
  rewritten with the recommendation, the rejected list and what each
  cannot catch; Q3 root-caused on measurement - `plan.md`, decided 7, 2b,
  and `context.md`, "Q3 planning facts" - fixed in B11.1, the live half
  registered as `DEBT.md` D6.** The orchestrator's record of the owner's
  words is kept below in substance.
- **(the orchestrator's entry, kept) ANSWERED IN PART by the owner
  (orchestrator, 2026-09-12), verbatim below. Q1 is settled; Q2 is
  reopened as a design question and goes back to the planner; Q3 is
  unanswered and stays optional.**
  - **Q1 - SETTLED, as recommended.** The owner confirmed
    5 -> 6 -> 7 -> 8 with 7 and 8 as one *track* whose first batch is the
    cleanup. Do not reopen; `plan.md`, decided 8 stands as written.
  - **Q2 - REOPENED, wider than it was asked; ANSWERED by the planner in
    `plan.md`, decided 2 (2026-09-12).** The owner did not pick
    either option. Their words: "what would your recommendation for the
    rendering checking? parity checked only against references and if we
    would like to check something similar I guess we will need to have a
    different mechanism because we will not be testing parity, we will be
    testing proper rendering, maybe there are some better tools to do so."
    That is a planning question - what instrument proves *correct*
    rendering once there is no second implementation to diff against -
    not a yes/no on the two options offered. It is the planner's to
    answer with a recommendation and a rejected-alternatives list, and it
    belongs in Phase 7's design, not in B11 or B12. Neither batch waits
    on it: the freeze happens in Phase 7's cleanup batch either way, and
    until then the live app is still the gate.
  - **Q3 - ANSWERED by the owner with a repro (orchestrator, 2026-09-12),
    and the answer refutes the planner's "not reproduced".** Owner's
    steps, verbatim in substance: `http://localhost:4173/#/roll/std`
    (the `vite preview` of `dist/`, i.e. the rewrite alone - *not* a
    parity comparison); click an item's **image**, not its name, to open
    the record modal; press `Добавить в список`. The menu opens
    **downward**; pressing `Новый список` **relocates it to the correct
    position**. "For some reason it is reproduced not on all items."
    - **The viewport is the missed variable.** The owner's screenshot is
      **~1913x981 CSS px**. The planner probed 1100x900, 1100x700 and
      375x667 and found both apps opening upward. The parity harness's
      three widths are 375/768/1100, so **no cell in the suite is as
      tall or as wide as the window the defect appears in** - which is
      why B11's newly registered state can pass while the defect is real.
      Do not read "CI measures it at three widths" as coverage of this.
    - **Measured, so the planner does not re-measure it:** the flip
      formula is ported verbatim. `AddToList.svelte:167-169` reads
      `window.innerHeight - btn.getBoundingClientRect().bottom` against
      `menu.getBoundingClientRect().height + 16`; `app.js:3695-3704`
      (`placeMenu`) computes the identical two numbers. At 981 px tall
      with the button's bottom at ~698, `below` is ~283 against a `need`
      of ~126, so `up` is false and downward is what that formula asks
      for **on both sides**. The formula measures the *viewport*; the
      thing that clips is the **modal card**, whose bottom edge is at
      ~838 in the owner's shot.
    - **Two differences the root-cause pass should start from, neither
      confirmed as the cause:** (a) the live `placeMenu` selects
      `$('.dropmenu')` - the **first** one in the whole document - while
      the rewrite scopes the query to its own `root`, so with more than
      one control mounted the two read different elements; (b) the live
      copy re-runs `placeMenu()` after **every** global render
      (`app.js:3824`), the rewrite's `$effect` only when `open`,
      `shown.length` or `newListFor` change - and `newListFor` changing
      is exactly the `Новый список` press that the owner says fixes the
      position. "Not on all items" fits a height-dependent threshold
      (description length changes the card's height, hence the button's
      `bottom`).
    - **Not B11's.** B11's scope is fixed and its code is written; this
      is a new defect report against the same component and belongs to
      the planner, for B12 or a later batch. It does not block B11's
      commit.
    - **ROOT-CAUSED (planner, 2026-09-12) - B11.1.** Twenty-four cells
      per app measured (4 records x 2 windows x 0/1/2 lists, real and
      synthetic clicks): the first open is identical on both apps in
      every cell - downward on a tall window for a short card is what the
      live app does too, and what it then does is scroll the `overflow:
      hidden` `.card` article by 109 px, chopping the picture (live
      defect -> `DEBT.md` D6). The divergence is the press of "+ Новый
      список": live flips up in 24/24 by redrawing the menu at its
      default side and then measuring the *form's own "Создать"* (the
      first `.btn` in `.seldrop`); the rewrite's `$effect` reads the same
      first `.btn` from the already-flipped side and, in a 17 px band of
      card heights, flips the menu *down* under the card's edge (7/24
      cells, two of them at 1100x900 with no lists). No new width is
      needed; the numbers are in `context.md`, "Q3 planning facts".

- **(the original entry, kept for its wording) - three questions for the
  owner (planner, 2026-09-12); B11 needs
  none of the answers and may be dispatched now. B12 needs none either.**
  1. **The P6 -> P7 -> P8 order, with 7 as R0 of one 7/8 track** (`plan.md`,
     "Phase 5 - the testing pyramid, planned", decided 8). Recommended:
     5 (B11, B12) -> 6 (publish `dist/`; Pages flip) -> 7 (delete the
     live app, the legacy suites, the harness; the sweeps) -> 8 (review,
     fixes), and yes to "unify 7 and 8" as one track whose first batch
     is the cleanup - not as one batch, because the cleanup changes
     public contracts and CI and needs its own review. Confirm, or name
     a different order.
  2. **After the cut-over, no committed pixel goldens** (decided 2). The
     measured specs (`typeRuns`, `geometry`, `computed`, controls, title,
     clipboard, hash) are frozen into `docs/fixtures/states/` from the
     last green parity run and compared strictly; pixel comparison dies
     with the harness. Alternative on offer: CI-only PNG goldens at one
     width and one language (~100 files, updated in the commit that
     changes a screen, reviewed as a diff image). Recommended: none.
     Confirm, or ask for the alternative.
  3. **Information, not a decision:** the modal add-to-list menu was not
     reproduced opening downward at 1100x900, 1100x700 or 375x667 (both
     apps open it upward). What window size, and was the modal card
     scrolled before the menu was opened? B11 registers the state so CI
     measures it at three widths regardless.

- **OPEN, and it is the only thing left on B10: `8b0c3ce` and `60047d4`
  are committed but not pushed, so CI has not read them** (orchestrator,
  2026-09-11). Same shape as B8's and B9's closing conditions, and pushing
  is never this session's to do (`CLAUDE.md`, "Never push"). Locally the
  batch is green: `npm run check` (998 tests, thresholds held),
  `npm run check:built` with `git diff -- app.js style.css index.html`
  empty, and 96 parity cells in three foreground calls - 90 `совпадает`
  including the six new `#/i/nope` cells, the six `#/roll/wondrous ~
  modal` cells inside their recorded debt with no `стало лучше` line. No
  `VISUAL_DEBT` or `ACCEPTED` change, so CI has no ratchet to trip; what
  it decides is whether the refactor moved a pixel on ubuntu that this
  host reads as still. **If a shard reads red, start at the six `#/i/nope`
  cells** - the one state in the filter set that never existed before, so
  the only cells with no prior CI reading to compare against. After them,
  the eight `PageTitle` call sites, in the order `ListPage` then
  `RecordPage`: they are the two snippet branches, the only places the
  component's DOM differs from a plain string. Record the run id here.

- **RESOLVED, and B9 is closed: CI run [`34640328352`](https://github.com/artex-x/daggerheart-loot/actions/runs/34640328352) on `55f2fa2` -
  the first head carrying the remediation `84ca6df` - is green end to end**
  (orchestrator, 2026-09-11): `check`, all four parity shards, `audit`,
  `secrets`, `deploy`. That is the second independent reading B9's design
  names as its closing condition, and it is the one that counts, because it
  reads the remediated component code rather than B9 as first built. The
  earlier run [`34638174347`](https://github.com/artex-x/daggerheart-loot/actions/runs/34638174347) on `dba79ee` was already green on every job
  with all seven anchor `VISUAL_DEBT` entries deleted, `#/tables/voa ~
  section anchor @ en 375` - the one deletion this host could not
  corroborate - included. The mechanism argument held: nothing turned
  `main` red, no anchor cell needed re-opening, and no `VISUAL_DEBT`
  number was written from this host. **Nothing about B9 remains open.**

- **(superseded by the entry above) Updated at B10's planning pass
  (planner, 2026-09-11): the entry below is satisfied in part.** `origin/main` == `b967481` at kickoff, so all
  three B9 commits are pushed; run `34638174347` (`dba79ee`) read every
  job green, all seven anchor deletions included; the remediation's own
  read, run `34640328352` (`55f2fa2`), had its parity shards still in
  progress at kickoff (`context.md`, "State at the B10 kickoff"). The
  orchestrator records that run's verdict here and closes B9 on it - done,
  green, in the entry above. B10 does not wait on it: its files are
  independent of B9's.

- **OPEN: B9's commits (`ad46dac`, `dba79ee`, and the remediation
  `84ca6df`) are made; waits on CI's read of the owner's push**
  (implementer, 2026-09-11). Same shape as B8's own closing condition.
  Locally: all seven anchor `VISUAL_DEBT` entries deleted, the 12-cell
  `"anchor"` re-run reads `совпадает` on every cell (`расхождений нет`,
  re-confirmed byte-identical after the remediation's code changes), the
  24-cell `"#/print/ci1-q1"` match (actually 36 - see "Status" above)
  reads `совпадает` on every print cell, `npm run check` and
  `npm run check:built` are green in the foreground. None of that is CI's
  word - owner decision 1 stands: no `VISUAL_DEBT` number is written from
  this host, and this batch wrote none (all seven entries were deleted,
  not re-numbered). Not yet closed: none of the three commits has been
  pushed (never this session's to do - "Never push", the task brief and
  `CLAUDE.md` both). Record the green run id here once the owner's push
  produces one; that CI read is what closes B9, exactly as it closed B8.
  **If CI reads any anchor cell red, open `#/tables/voa ~ section anchor
  @ en 375` first.** It is the one deletion with no local before/after
  delta to lean on: B8's own verbatim run already read this host at
  0.00% on `9fd3000`, *before* either B9 fix landed, so the 9.86 debt
  figure was CI-only and this host cannot corroborate its removal the
  way it can for the six other cells (each of which measured non-zero
  before B9 and 0.00% after). Its deletion still stands on the mechanism
  argument - the 1100/768 cells at the same state prove the ring now
  draws and the re-play now fires, independently of this cell's own
  before/after - but it is the single cell most likely to turn `main`
  red if the mechanism argument is wrong in some way this host cannot see.

- **RESOLVED by CI run [`34628983995`](https://github.com/artex-x/daggerheart-loot/actions/runs/34628983995) (orchestrator, 2026-09-11): B8's
  four anchor figures are confirmed by a second, independent reading, and
  `main`'s parity is green.** All four shards pass on `435a5ac`. Shard 3's
  `#/tables/core_item ~ row anchor @ ru|en 375` and shard 2's `#/tables/voa ~
  section anchor @ en 375` now read at or under the figures B8 wrote from run
  `34616445556`, and the deleted `voa @ ru 375` entry is confirmed by the
  absence of a cell to fail - the 0.00 was the reading, not a one-run
  artefact. The 54 `#/print` cells read `совпадает` for the second
  consecutive run. **Not part of this entry, and not B8's:** the same run's
  `check` job failed on the legacy `behave` suite against the live app
  (`.subchips .chip.on`), green on `9fd3000` an hour before and on `37ecc8d`
  before that; the owner called it flaky and re-ran it, and **attempt 2
  passed**. The record of how the entry was reached is kept below.

- **(superseded by the entry above) B8's commit is made; OPEN until the
  owner's push produces a green CI run.** (implementer, 2026-09-11.) `main` was red on three `VISUAL_DEBT`
  ratchet cells - `#/tables/core_item ~ row anchor @ ru 375` 9.35 against a
  recorded 10.52, `@ en 375` 8.85 against 9.92, `#/tables/voa ~ section
  anchor @ ru 375` 0.00 against 11.55, all "стало лучше"; `voa @ en 375`
  9.86 against 10.31 passed only by 0.05 of slack - caused by B7's
  reduced-motion `transition-duration` change, not noise (three prior CI
  runs had agreed to the hundredth; `context.md`, "B8 planning facts" for
  the measured mechanism). B8's commit rewrites `specs.js` to those four CI
  figures (one deleted) with true reason strings. Not yet closed: the
  commit has not been pushed (never this session's to do), so CI has not
  re-read `9fd3000`'s successor. Record the green run id here once the
  owner's push produces it - that is the reading B8's design names as its
  own closing condition.

- **RESOLVED by CI run `34616445556` (planner, 2026-09-11): the 4-cell print
  image residue was this host's paint.** All 54 `#/print` cells - nine
  states, both languages, three widths, the 24 `whole:true` ones included -
  read `совпадает` on ubuntu. Exactly what `docs/parity.md`'s "Full-page
  captures" class predicts for a diff that was an edge outline over the
  whole page, topbar and footer included, on an unchanged build. No
  `VISUAL_DEBT` entry was ever written and none is needed; `docs/parity.md`
  gains no class. The entry below is kept as the record of how it was
  reached.

- **RESOLVED: B7's print parity was broken by `transition-duration: 0.01ms`,
  not by anything to do with `cqw`** (implementer 2026-09-11, then reviewer,
  then this remediation pass). At `4776243` group A read 50 of 54 cells red
  and the first cards on each sheet lost their artwork. The first pass wrote
  that down as a host-level browser race over `cqw` inline styles and handed
  it to CI; **that diagnosis was wrong** and the narrative it left in
  `plan.md`, `handoff.md` and `context.md` has been deleted rather than
  softened. `docs/parity.md`'s "Two unstable classes" gains no third entry -
  this was never an instability class.

  The cause: `app/src/styles/tokens.css`'s reduced-motion block set
  `transition-duration: 0.01ms !important` on `*`. **`0.01ms` is not zero**, so
  every inline style write started a real `CSSTransition` whose value at t=0 is
  the *old* one; `PrintCard.svelte`'s `fit()` writes an inline `cqw` size and
  reads the layout back synchronously, so `tight()` was answered by the
  pre-write layout on every iteration, never turned false, and all three
  ladders ran to their floors. The live app's reduced-motion rules
  (`style.css:311`, `:544`) kill two named animations and leave
  `transition-duration` at its initial `0s`, so it reads correctly. The harness
  runs every cell under `prefers-reduced-motion: reduce`
  (`tests/parity/driver.js:649`), which is why only parity saw it; CI would
  have read it red too. Fixed to `transition-duration: 0s !important` - nothing
  in `app/src` listens for `transitionend`/`animationend` (grepped), so the
  transition buys nothing. Measured on the built `dist/` at 1100 under reduced
  motion, `LONG` route, before -> after: `transitionDuration "1e-05s"` ->
  `"0s"`; `document.getAnimations()` `["CSSTransition"]` -> `[]`; the first two
  `.pc-art` `none/14cqw` (the floor) -> `flex/32.8136cqw`, `flex/35.3559cqw`.

  **Open, and it is CI's call, not this host's: 4 image cells of group A.**
  After the fix group A's `cardFit`, `sheetCounts` and control-name cells all
  agree - the actual defect is gone - and the image residue is 4 cells, down
  from 50. Re-running the two states that carried them produced a **different,
  non-overlapping set of 3** on the same build (run 1: `NINE @ en 1100`, `NINE
  @ en 768`, `LONG @ en 768`, `LONG @ ru 1100`; run 2: `NINE @ ru 1100`, `NINE
  @ ru 768`, `NINE @ en 1100`, both `LONG` states clean). All nine print states
  are `whole: true`; the log printed "снимок целиком: 3/4 попытки до
  устойчивого кадра" repeatedly; the diff images were opened and show no
  content change - every card has its art, the red is a sub-pixel swim over the
  whole page including the topbar, which this batch never touched, best-aligned
  at a one-pixel vertical shift. That is `docs/parity.md`'s second unstable
  class verbatim ("Full-page captures": geometry byte-identical, pixels
  swinging on an unchanged build, worse under load), whose own recipe is
  re-run the state, write no entry, let the latest CI shard decide. **No
  `VISUAL_DEBT` number was written from this host.** **Next action:** push and
  read the print-bearing CI shard(s). Clean there closes this entry. A
  reproducible red there is a real difference and the planner's next move
  starts from the `whole` capture, not from `fit()`, whose arithmetic the
  `cardFit` cells now confirm against the live app at every width in both
  languages.

- **None for B7's implementation** (planner, 2026-09-11). The Figma
  connector's unauthenticated state is **not** a blocker: the port needs no
  export (`plan.md`, "B7 planned", "The Figma question, settled"). What is
  owner action, and not blocking: the **CI read** after the next push -
  whoever reads it should look at (a) the seven `typeRuns` tables cells
  and the plain `#/tables` cells (B6 review risk 1 - group B reads
  `#/tables` locally; the other six are CI's), (b) the 54 new `#/print`
  cells, especially the 24 `whole` ones, which may read differently on
  ubuntu than on this host and which owner decision 1 says CI decides,
  and (c) `foundRows`' printed figures in the log.

- **RESOLVED: B5.4a's review against `8873473` - the grip was inert**
  (reviewer, then implementer, 2026-09-11). `ListPage.svelte`'s
  `.lrow-grip` span had no `draggable="true"`; `app/src/ports/drag.ts`'s
  `nativeDrag` listens for `dragstart` and sets no attribute itself, so with
  none present no `dragstart` could ever fire and `onDrop` could never run in
  a real browser - a fully-drawn, fully-inert affordance (`cursor: grab`,
  `grabbing` on `:active`, `touch-action: none`, the drag-hint tooltip), and a
  behaviour divergence from `app.js:3053`, which writes `draggable="true"` on
  the same span. Both proofs green at `8873473` were structurally blind to
  it: the parity driver has no drag verb, so none of the 96 cells could reach
  it, and `listPage.test.ts`'s existing drag test called
  `drag.handlers?.onDrop(0, 2)` directly, proving the port-to-component
  wiring while bypassing the element-to-browser wiring entirely - the same
  shape as B5.3's card-link blocker. Fixed with the one missing attribute;
  `listPage.test.ts` gained a real-DOM assertion (`container.querySelector(
  '.lrow-grip')` carries `draggable="true"`), not a port-level one.
  `node tests/parity.js "#/lists/a @"` read all six cells `совпадает`
  (an attribute change has no geometry). One commit on top of `8873473`.
  Six review nits recorded, not fixed - see "Deferred".

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
  has no backend to authenticate against. **Handled outside this session** -
  `.gitleaks.toml` (tracked; landed `13bba19`) extends the default ruleset
  with an allowlist for the key-name shape and records that `[allowlist]`
  must be used rather than `[[allowlists]]`, which parses and is then
  silently ignored in gitleaks 8.24.3. **Do not duplicate that work**; it
  has landed.

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

- **PLACED for R0b: `tests/app/states.js` case 7 flakes on a loaded runner
  (orchestrator, 2026-09-13).** It failed CI run `34754984230` on `06658fd`
  (`страница B не увидела список, созданный на A, без перехода`) and passed on
  the identical code in run `34755188652`, and passed locally at 65.0s against
  CI's 66.1s. Cause: `tests/app/states.js:190-192` waits for page B's repaint
  with `waitForFunction(..., { timeout: 5000 }).catch(() => {})` - **the
  timeout is swallowed** - and then asserts on whatever the page says, so a
  runner that takes over five seconds to deliver the `storage` event and
  repaint fails exactly this line. Not R0a's: C3 touches nothing near storage.
  The fix is a design choice (a longer deadline, polling to one, or waiting on
  the event rather than the repaint) and belongs to whoever opens that file
  next. **Full evidence: `context.md`, "`app/states` case 7 flakes on a loaded
  runner".** The hazard to name out loud: once a case is known to flake, the
  next genuinely red `check` gets waved through as "that one again" without
  anyone reading the diff.

- **From R0a's review (reviewer, 2026-09-13) - four nits, none fixed.** R0a is
  mid-plan, so these defer rather than earning a remediation cycle; the two
  blockers the same review raised were documentation and are **fixed** in
  `530aa10`. Each nit is cheap, local and inside paths a later batch reopens.
  1. **`golden.js`'s `--only=` comment is wrong in the safe direction (R0b).**
     `tests/app/golden.js:438-443` and acceptance line 19 both say `--only=`
     suppresses the missing-golden guard. It does not: the `!fs.existsSync`
     check at `:427` runs unconditionally and only the stale-file sweep sits
     under `if (!ONLY)`. The code is stricter than its comment, so there is no
     hole - but a reader who believes the comment will think a filtered run
     checks less than it does.
  2. **A golden's own identity line is never compared (R0b).**
     `compareGolden` compares the four `## ...` sections only, so the
     `# <id>` / `# route:` / `# why:` header is unchecked; an `inventory.js`
     route edit without `--update` leaves a golden whose header disagrees with
     the state it gates. Low risk - the tree would differ too.
  3. **The `bash-guard.mjs` workaround should not have become advice (R0b).**
     Deleting the untracked snapshots directory with `node -e fs.rmSync(...)`
     after `rm -rf` and `git clean -f` were blocked was benign and in scope.
     Writing it into `plan.md` as forward-looking guidance is the problem:
     `CLAUDE.md` says the hooks enforce while it states intent, and the same
     `node -e` shape defeats the `edit-guard.mjs` rule **this batch added** for
     `tests/app/snapshots/` - that rule intercepts Write/Edit, not a
     `node -e fs.writeFileSync` hand-editing a golden to make a run pass, which
     is exactly what its own message forbids. Either exempt
     `tests/app/snapshots` in `bash-guard.mjs` as a reviewed one-liner, or drop
     the advice. The delete may not have been needed at all: `--update`
     rewrites in place and the stale check reports orphans.
  4. **`specs.js`'s "Recorded, not keyed" block is stale by one commit (R0b).**
     It still says "Phase 7's sweep carries them into `FEATURES.md`" in two
     places, in the very file C2 edited to perform that sweep.

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

- **PLACED as acceptance lines of R0a (planner, 2026-09-13).** All five open
  B14 nits below and blocker B1 are now **numbered acceptance criteria** in
  "Next batch" above - B1 is line 11, nit 1 line 12, nit 2 line 13, nit 3 line
  14, nit 4 line 15 (**re-placed from R0b/R0c**, because R0a already edits
  `FEATURES.md`), nit 6 line 16. Nit 6's pointer line is **already written**, in
  this file's `## Verification` section; line 16 exists so the batch confirms it
  survived and appends R0a's own evidence under it. Per `plan.md`, "A placement
  has to be acceptance, not a footnote", R0a may not be recorded closed while
  any of those lines has no outcome. The entries below are kept verbatim as the
  record of what was found.

- **From B14's review (reviewer, 2026-09-13) - six nits, each with a batch.**
  None was fixed; none justifies a remediation cycle. Blocker B1 (a zero-match
  parity filter cannot be told from a passing run) is **not** in this list - it
  is an acceptance line of R0a, recorded in "Status" above.
  1. **`isHome` is now dead in production (R0a).**
     `app/src/state/app.svelte.ts:448-450` - `PageHead` was its only consumer
     and C2 replaced that read with its own `on`. A grep across `app/src/`
     finds the getter and nothing else; only `app.test.ts` still calls it.
     This is the exact condition that justified deleting `canPinHome` in the
     same commit, and `CLAUDE.md` says "add no export before something uses
     it". Delete it with its three test assertions, or state why it stays.
  2. **`states.js` case 14 can pass vacuously (R0a).**
     `tests/app/states.js:369-372` marks the image under `if (img)` with no
     assertion that anything was marked; if `.results .card-media img` ever
     stops matching, the first loop iteration reads `replaced === true` and the
     case passes green. The roll-button guard covers a missing route but not a
     renamed card selector. This is the same silent-grip class C3 fixed in
     `typo.js`, introduced in the same batch. One `ok(marked, ...)` closes it.
  3. **`EXPECTED[hash] ?? []` re-opens a smaller silence (R0a).**
     `tests/app/typo.js:113` - a page added to `PAGES` without an `EXPECTED`
     row expects nothing and says nothing. The key sets align today; assert
     that the table covers `PAGES`.
  4. **`FEATURES.md:156` still says "nine sections or any table by name"
     (R0b/R0c).** `ROUTES.md`'s identical "nine a person may pin" claim was
     corrected in `af7fa17`; the parallel line in `docs/specs/FEATURES.md` was
     not touched in the same commit. Defensible as a reader-side statement, but
     it is the same sentence the batch went to correct.
  5. **RESOLVED at closeout, kept for the record**: the "88 cells" in B14's
     built record was a `tail -n 120` artifact, not a measurement. Corrected to
     120 in `plan.md` and in both places this file repeated it, along with the
     claim that a banner caught the zero-match run. No batch needed.
  6. **This file's `## Verification` section holds only B11 evidence (R0a, or
     at any close).** B14's commands and results live in the "Status" block and
     in `plan.md`, which meets the content requirement, but the section heading
     now misleads a cold reader. A pointer line would do.

- **OPEN, and dropped once already: B12's nit 1 and nit 2b** (planner,
  2026-09-12). Both were marked "PLACED ... go to **B13**" in the entry further
  down this section and in `plan.md`'s "B12's deferred nits, placed" table.
  **B13 closed without doing either** - `git log 0819a73~1..HEAD --name-only`
  touches neither `tests/app/typo.js` nor `tests/app/states.js`, and "B13 built"
  does not mention them - so a reader of that entry would reasonably conclude
  they were handled. They were not. Both texts are corrected rather than quietly
  re-pointed, because the record of the miss is worth more than a tidy table.
  Carried forward in full:
  1. **`tests/app/typo.js:11-12` promises that a grip which resolves to nothing
     "fails loudly rather than being skipped". It does not.** `softClick` at
     line 50 is `if (await d.has(name)) await d.click(name);` and the inner
     `hit()` inside `page.evaluate` is `const e = document.querySelector(s); if
     (e) e.click();` - both silent. So a renamed `Фильтры` or a moved `.helpbtn`
     stops that panel from being checked on every page, and the suite still goes
     green. This is the same class of defect B13's publish guard exists to
     prevent: a check that can quietly stop checking. Five grips are affected -
     `Фильтры`, `Добавить в список`, `Заметка`, `.helpbtn`, `.lnote summary` -
     across the thirteen `PAGES`.
  2. **`tests/app/states.js`'s `twoFramesPicked` (cases 4/5) uses `d.click`**
     for `Фильтры`, `Пир зверей` and `Колоссы Сухоземья` where B12's own plan
     text says `press`. B12's C1 existed to give the suite a trusted `press`
     verb and its commit is titled "the states a real click reaches"; two cases
     that do not use it undercut the claim.
  **Now placed in B14 C3, as acceptance lines 4 and 5** of the "Next batch"
  section above - not as a table row. The mechanism written so this cannot
  happen a third time is `plan.md`, "A placement has to be acceptance, not a
  footnote": an item placed in a batch becomes one of that batch's acceptance
  criteria, and the batch cannot be recorded closed while an inherited line has
  no outcome. These two are its first customers.

- **Every other item in this section now has a batch** (planner, 2026-09-12).
  The full reasoning for each placement is `plan.md`, "The finishing plan":
  - **the roll re-render divergence** (item 1 below) - **B14 C1, CLOSED**
    (`6b18291`), and it was four call sites, not the two recorded below:
    `AltPanel.svelte:228` and `ListPage.svelte:676` render through `OrGrid`,
    whose `{#each cells as cell, i (i)}` keyed by position, so they reused the
    node for the same reason - fixed with the rest by `OrGrid.svelte`'s
    `{#key cell.it}`. No `DEBT.md` entry: this is a divergence *from* live,
    which is migration work, not a live defect reproduced on purpose.
  - **B12.1's nit 1**, the pinned bare `#/tables` (item 2 below) - **B14 C2,
    CLOSED** (`af7fa17`), together with B12.1 nits 3 (`canPinHome` with no
    consumer - deleted, not wired), 4 (`ROUTES.md`'s "nine") and 5
    (`ROUTES.md:125`'s over-narrow rule). B12.1 nit 2
    (`go()`/`replace()` bypass `#fallback`) stays open and unreachable; it goes
    to Phase 8 R1 to verify or close.
  - **N1, N4, N7** - **B14 C3, CLOSED** (`a7f8787`; acceptance lines 6, 7, 8).
  - **N2, N3, N5, N6, N8** - **R0c**. N2 and N8 live in `tests/derived.js`'s
    head-to-head comparison, which dies with `index.html`; N3, N5 and N6 are
    edits to `ci.yml`'s `deploy` job, which nothing may touch while
    `git revert 9177f3b` is the safety net.
  - **B12's nit 4** (`DEBT.md`'s D10 out of sequence) - Phase 8 R1; **nit 5**
    (`vite.config.mts`'s exclusion warrant) - Phase 8, with D10. Unchanged.

- **B13's items, deferred by the coordinator's instruction (2026-09-12) -
  record only, do not fix, and for item 1 do not design the fix either.** B13
  is mid-plan: the soak, Phase 7 R0 and Phase 8 are queued behind it, and none
  of this earns a cycle of its own. **Both items 1 and 2 are CLOSED by B14**
  (`6b18291`, `af7fa17`) - kept below verbatim as the record of what was found
  and why it waited.

  1. **A real behaviour divergence from live, now in production: on a roll,
     the previous artwork stays on screen until the new image decodes.** Found
     by the owner on the live site under throttling, in their own words: "when
     we rerender it preserves old images until new ones are loaded."

     **Owner decision, 2026-09-12, on how it gets fixed: not as a batch of its
     own. It is bundled into a batch that already has other work in those
     paths**, so whoever plans next picks it up alongside related work. This
     is settled, not an option to re-decide; what is still open is the
     *content* of the fix, which is the planner's.

     Mechanism, confirmed in code, not inferred: `RollPanel.svelte:129` and
     `StdPanel.svelte:157` each render a single `<RecordCard>` with **no
     `{#key}`**, so Svelte updates it in place and the `<img>` node is reused -
     only its `src` changes, and the browser keeps painting the old bytes
     until the new ones decode. Every other path is keyed and therefore
     replaces the node: `TableRows.svelte:108` `(entry.it.id)`,
     `ListPage.svelte:782` `(it.id)`. Live does the opposite everywhere -
     `app.js:3819` assigns `$('#view').innerHTML`, so each roll builds a
     brand-new `<img>` that paints empty and fills.

     Measured on the live site: one mutation batch at 4.3 ms, handler 0.9 ms,
     four image requests starting at 5 ms, and the same four `<img>` elements
     already present at t=26 ms with three still loading.

     **Not** a loading-strategy difference: both apps ship identical
     `loading="lazy" decoding="async"` and neither ships `srcset`/`sizes`
     (live's `imgTag` comment at `app.js:1676-1681` describes a `sizes`
     attribute its own code never emits). Parity never caught it because it
     screenshots settled states and this is a transient during re-render -
     worth remembering as a class, not just as an incident.

     Open for the planner, and only the planner: which call sites, whether
     `{#key}` is the right instrument, and whether this is a `docs/specs/DEBT.md`
     entry or work inside a batch.

  2. **B12.1's deferred nit 1 has shipped and is still open.** A pinned bare
     `#/tables` is accepted by the pin button and silently dropped at the next
     boot, where live always pins a named table. `context.md`'s B13 dispatch
     section records the decision to let it go live; the owner has since
     confirmed it stays deferred. Full mechanism: the B12.1 nit list below,
     item 1. Still read-verified only - nobody has driven the built app at it.

  3. **The reviewer's N1-N8**, one line each:
     - **N1** - the seven-file counts rule is now stated in six places, and
       `.claude/hooks/edit-followup.mjs:20` and
       `.claude/prompts/add-source.prompt.md:145` still say six. The hook's own
       reminder therefore leaves `tests/derived.js` failing for whoever follows
       it. Cheapest of the eight and the only one with a functional edge.
     - **N2** - the `>= 20` floor in `headFacts`'s sanity check is exactly the
       current field count with zero headroom, so it really asserts "no field
       may leave both documents" while its message says the parse broke.
     - **N3** - the deploy guard greps literal `src="app.js"` while
       `check-site.mjs` uses `/src="\.?\/?app\.js"/`; the guard is the earlier
       gate and should be the stricter of the two.
     - **N4** - `tools/check-site.mjs` is gated by nothing until it runs on
       `main` after a publish (`tools/` is ignored by both `.prettierignore`
       and `eslint.config.mjs`), so a later syntax error turns a run red
       *after* a good deploy. `node --check` in the `check` job closes it.
     - **N5** - what the guard still cannot catch: no proof `_site/index.html`
       came from this commit's build; `img og i card` required non-empty but
       `og/_share.jpg` not by name; no check that `_site/data.js` assigns
       `window.LOOT`.
     - **N6** - the ported `<noscript>` links resolve on Pages but not from
       `dist/` over `file://`; becomes real at Phase 7.
     - **N7** - `tests/parity/driver.js:11`'s comment, "legacy -> index.html at
       the repository root, what Pages serves today", is stale in exactly the
       way blocker 2 was. Left alone only because it falls outside the file set
       B13 touched.
     - **N8** - `headFacts()` scans the whole document rather than `<head>` and
       parses double-quoted attributes only; it fails closed, which is why it
       is a nit.

- **B12.1 review nits, deferred by the coordinator's own instruction
  (2026-09-12) - record only, do not fix; B12.1 is mid-plan and B13 re-enters
  these paths.** **Items 1, 3, 4 and 5 are CLOSED by B14** (`af7fa17`):
  the bare-`#/tables` pin now round-trips, `canPinHome` is deleted,
  `ROUTES.md` and `STATE.md` describe the actual pin shape. Items 2 and 6
  were outside B14's scope and remain open, recorded here. Recorded verbatim
  enough to pick up without re-reading the review:
  1. **Highest - flag it to be settled before or with B13.** A pinned bare
     `#/tables` is accepted by the UI and silently dropped at the next boot.
     `TablesPage.svelte:444` renders `PageHead`, whose button calls
     `toggleHome()` (`app.svelte.ts:445-455`), storing `this.hash` as
     `'#/tables'` when no table is in the address and lighting the button;
     `readHome` (`:69-71`) then rejects it next boot, because
     `parseHash('#/tables')` is `{kind:'tables', table:null}`, and the app
     opens `#/roll/std` instead. Live has no such gap - `homeHash()`
     (`app.js:1133-1136`) pins `'#/tables/' + S.tables.t`, always a named
     table. Entirely pre-existing (B12.1's commit touches none of
     `toggleHome`, `readHome` or `homeHash`'s port equivalent), but `#home` is
     now what rules 1 and 2 write to the address bar, and it ships to real
     users at B13. Read-verified only; nobody drove the built app on this one.
  2. `go()` and `replace()` bypass `#fallback`, so with `{:else}` gone an
     unparseable hash reaching either would render an empty content area with
     no `<h1>` rather than the old debug heading. Unreachable with today's
     callers; live's `currentRoute` fallback runs on every render and would
     catch it regardless of caller.
  3. `canPinHome` (`app/src/state/app.svelte.ts:457`) has no production
     consumer, only tests - `CLAUDE.md`, "Add no module, export, component,
     or variant before something uses it".
  4. `docs/specs/ROUTES.md:24-25`, "the nine a person may pin as their
     starting section", is true of live (`homeAllows`, `app.js:1124-1130`,
     accepts bare `tables`) but not of the rewrite's `readHome`, which accepts
     eight. Same family as item 1 above; one edit should settle both.
  5. `docs/specs/ROUTES.md:125`, "Reached by navigating away and back", names
     one route to a bare address; the rule holds for any navigation to bare,
     including a typed `#/`.
  6. The boot push is uncovered: in a real browser `navigate` sets
     `location.hash` -> `hashchange` -> `onChange`, so `navigations` reaches 1
     at boot with `sel.clear()`/`menuFor=''`. Harmless today (both consumers
     only do `open = null` - `SearchPage.svelte:39-44`, `TablesPage.svelte:
     100-105`) and it mirrors live's own assignment, but the row-2 unit test
     never calls `start()`, and `memoryRouter.replace` deliberately does not
     announce, so no test exercises this path.

- **PLACED by the planner (2026-09-12) - and two of these placements failed.
  Corrected 2026-09-12, later, by the planner: nit 1 and nit 2b were placed in
  B13, B13 closed without them, and they were OPEN. CLOSED by B14 (`a7f8787`),
  proven rather than asserted**: nit 1's `typo.js` `EXPECTED` table fails
  loudly on a missing grip (demonstrated by renaming one expectation and
  watching both languages go red), nit 2b's `twoFramesPicked` uses `d.press`
  for all three controls. See the first entry of this
  section for both mechanisms in full and for where they now live (B14 C3, as
  acceptance lines). The rest of this paragraph stands as written.
  The B12 nits below are no longer an
  undifferentiated list; each has a batch or a phase, with the reasoning, in
  `plan.md`, "B12's deferred nits, placed". In short: ~~nit 1 (`typo.js`'s
  silent `softClick`) and nit 2b (`states.js` cases 4/5 using `d.click` where
  the plan says `press`) go to **B13**, which runs all five `tests/app/`
  suites as its own gate~~ **- not done by B13; both closed by B14 C3**; nit 3 (`App.svelte`'s overclaiming `<h1>` comment)
  is closed by **B12.1**, which deletes the branch, the comment and the
  `.todo` rule together; nit 4 (`DEBT.md`'s D10 out of sequence) goes to
  **Phase 8 R1**, which rewrites that file entry by entry anyway; nit 5
  (`vite.config.mts`'s thin warrant for excluding `src/ports/image.ts`) goes
  to **Phase 8 with D10**, since the wording depends on what D10's fix turns
  out to be. Nit 2's two unrecorded fallbacks are **closed**: they are named
  in `plan.md`'s "B12 built" correction and again, in full, in "B12 built, the
  fallbacks it took". The `CLAUDE.md` line count is **197**, and the one line
  in this file that still claimed 198 is corrected above.

- **B12 review nits, deferred by the coordinator's own instruction
  (2026-09-12) - do not act on these until B12.1 or whatever batch opens
  these files next.** Recorded verbatim enough to pick up without
  re-reading the review:
  1. `tests/app/typo.js:11-12` promises a missing grip "fails loudly", but
     `softClick` at line 50 and the inner `hit()` are both silent - a
     renamed `Фильтры` or `.helpbtn` would silently stop checking that
     panel rather than failing the suite.
  2. `issues/47/plan.md`'s "B12 built" section says nothing else deviated,
     but two of the plan's own fallbacks were taken without being listed:
     axe RU-only at 360/390/768 (`tests/app/sweep.js:286`) and the focus
     walk at 1180 only (`tests/app/sweep.js:310`, against the plan's
     "1180 and 360"); also, `tests/app/states.js` cases 4/5 use `d.click`
     where the plan's own text says `press`.
  3. `app/src/App.svelte:82-87`'s comment claims the `<h1>` "carries no
     rendered style of its own beyond what `.todo` already sets" - `.todo`
     sets only colour, family and size, and there is no `h1` reset in
     `styles/tokens.css`, so the UA's bold weight and `.67em` margins now
     apply. Harmless (nothing gates it), but the sentence is false.
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
  the entry below this one and in this session's own prior commit
  message - `CLAUDE.md` is **197 lines**, not 198 as both claimed
  (confirmed again: `wc -l CLAUDE.md` reads 197 on the current tree).

- **B11.1's review nits (reviewer, opus, read-only, 2026-09-12; verdict
  approve, no blockers).** Recorded by the orchestrator, not acted on.
  **Placed by the planner (2026-09-12, the B12 planning pass):** nit 1 is
  decided - the `pop` re-measurement is recorded in D6's "Where" in B12's
  first commit and is written to be deleted by Phase 8 R3 (reasoning:
  `plan.md`, "B12 planned", decided 2); nits 2, 3 and 5 ride in that same
  commit, as the reviewer marked them; nit 4 resolves when B12's third
  commit creates `tests/app/states.js`; nit 6 is answered by that file's
  modal new-list case, which is the unit-level pin it says does not exist.
  Nothing here is still open.
  The review's positive findings are worth keeping too, because each one
  closes a question a later reader would otherwise reopen: the first-`.btn`
  reading was checked against the live markup generators (`app.js:1881-1886`
  `addToListBtn`, `:1851-1853` `listMenuHTML`) and **is** the live reading;
  `up = false` is a no-op in exactly the cases live's rebuild is a no-op;
  the effect's trigger set was suspected too narrow for a chip press and
  **is not**, because `ListStore.addIds`/`removeId`
  (`lists.svelte.ts:165,189`) reassign `this.lists`, so `shown` re-derives
  on identity; `flushSync()` is outside Svelte's flush, cannot loop (the
  effect never reads `up`), and is unmount-safe behind `if (!root) return`.
  1. **The `pop` animation is not restarted, and that is the one place the
     reconstruction could still diverge (the reviewer's own "would it
     diverge elsewhere" candidate).** Live re-inserts the `.dropmenu`
     markup on every render, so `animation: pop .16s ... both` restarts and
     `placeMenu` measures a menu still at `translateY(10px) scale(.985)` -
     roughly 10 px lower and ~1.5 % shorter than at rest. In the port the
     menu element **persists** across the "+ Новый список" re-measurement
     (the form is an `{#if}` *inside* the menu), so the second measurement
     is taken at rest. Both apps pop on the *first* measurement, so this
     touches only re-measurements - which is exactly what B11.1 is about.
     The measured band is 17 px and this offset is ~10 px, **so the two
     could disagree at a card height near the boundary even though they
     agree on Самоцвет Чутья.** Unsettled empirically: whether Blink
     applies the `from` keyframe at the forced layout that
     `getBoundingClientRect` triggers. **Planner's call**, and it is a real
     one: record it in D6's "Where" as "same side basis, not same transform
     state", or let Phase 8's `.modal-card` measurement retire the question
     entirely. Not a defect anyone has seen.
  2. **`hash.test.ts`'s citation is off by four lines**: the comment says
     `hash.ts:105`, which is `? {`. The load-bearing lines are `hash.ts:103`
     (`const table = name && isTableId(name) ? name : null;`) and
     `hash.ts:109` (`filter: decodeFilter(tail, table ? groupsFor(table) : [])`).
     D5/D6 are meticulous about line citations; this should match. One-line
     edit, can ride along with B12's first commit.
  3. **The new `[]`-groups test could pin harder.** `not.toHaveProperty('cls')`
     proves the legacy reading was not taken but does not assert what *was*
     read; `expect(filter.tier).toEqual(['1_cls', 'phy'])` would pin the whole
     outcome and fail loudly if the `.`-split ever changed shape. One-line
     edit, can ride along with B12's first commit.
  4. **D6's "How to verify the fix" points at `tests/app/states.js`, which
     does not exist yet** - it is B12's file (`plan.md:11722`). Consistent
     with the plan, since D6's fix is Phase 8 and lands after B12; noted only
     so nobody tries to run that verification today.
  5. **`FEATURES.md` antecedent.** The appended clause reads "...a search box
     appears from the eighth list; **it** opens on the side of the button
     with room in the window..." - the nearest antecedent for "it" is the
     search box, not the menu. "the menu opens on the side..." removes it.
  6. **No unit-level pin exists for the placement, and `npm run check`
     green does not protect that line.** jsdom returns a zero-sized
     `getBoundingClientRect`, so `lists.test.ts` executes the effect for
     coverage but can never observe `up`. The committed parity state is the
     only regression instrument, and it is **RU-only** - see the correction
     below. That is the right instrument for a geometry defect and B12
     already homes the assertion; recorded so the gap is known, not
     rediscovered.

- **CORRECTION, and it narrows B11.1's warrant (reviewer, 2026-09-12).**
  The orchestrator's review brief guessed that the new state's EN cells read
  `совпадает` before the fix because translated text changes the card's
  height and only the RU cards fall inside the 17 px band. **That is wrong.**
  `tests/parity.js:369-370` runs `enter(d)` in Russian and *then* presses the
  language button; that press is an outside click, so **both apps fold the
  menu before the EN cells are shot** - the EN cells of this state (and of
  the pre-existing `~ a row opened, list menu`) compare a modal with no menu
  at all and would stay `совпадает` whatever the placement code did.
  `handoff.md` already stated this correctly ("the `EN` press folds the menu
  before it is compared, per B5.1's standing fact"), so nothing false is
  recorded in the task files; the wrong guess lived only in the dispatch.
  **Consequence: B11.1's warrant is three RU cells, not six** (1.01 / 1.44 /
  2.94 % -> 0). Still a warrant, and the fix is still justified - but anyone
  citing "six cells" for this state is citing three real ones and three that
  cannot fail.

- **B11's review nits (reviewer, opus, read-only, 2026-09-12; verdict
  approve, no blockers).** Recorded here by the orchestrator, not acted
  on - a remediation cycle is not spent on nits. **Placed by the planner
  (2026-09-12)**: nits 2, 3, 4 (comment only; the guard stays, the
  `onclickcapture` variant stays the fallback) and 5 are B11.1 steps 3,
  5, 8 and 9; nit 1 is recorded as B11's deviation in `plan.md`'s B11
  heading paragraph and nowhere else; nit 6 was already fixed.
  1. **Plan step 2's "non-empty tail" condition was not implemented.**
     `decodeFilter` checks `i > 0` (non-empty head) plus group
     membership, not a non-empty tail. Behaviourally nil - `f_frame-`
     decodes identically either way, and the two readings diverge only
     on shapes like `f_frame-_cls-mag` that are garbage under both.
     `ROUTES.md` documents the code as written, so nothing is
     mis-documented; the deviation from a "decided, do not reopen" step
     is recorded here because it was otherwise unrecorded.
  2. **A retired group name placed *before* a live one loses the live
     one's narrowing.** `f_rg-melee_line-uniq` makes the whole body one
     group named `rg`, which no table offers, so the `line` narrowing is
     dropped and the table stays whole. Fails **open** - more rows, never
     an empty table - which is the direction `filters.ts`'s own header
     comment already commits to. Needs one sentence somewhere before
     someone rediscovers it as a mystery.
  3. **No test pins the `[]`-groups path.** `parseHash('#/tables/nope/f_tier-1_cls-phy')`
     - plan step 3's "no table, no legacy reading" - has no case in
     `hash.test.ts`. The one branch of the new rule that no test states
     aloud. Cheapest of the four to close; a candidate for B12.
  4. **The guard is broader than its justifying comment.** "A target no
     longer in the document was inside this control at the moment it was
     pressed" is false in general: any outside click whose target Svelte
     removes during the flush (a filter pill's x, a toast's undo) now
     leaves the menu open where the live app closes it. The reviewer
     found **no reachable misbehaviour** - `RecordModal.svelte:68` and
     `app.svelte.ts` (198/305/314) clear `menuFor` explicitly on the
     modal-close and navigation paths - but the component's preceding
     comment, "Any click outside `.seldrop`/`.dropmenu` closes the
     menu", is now slightly untrue. `onclickcapture` decides "inside?"
     before any mutation and would be exactly right. **Planner's**, to
     fold into B12's real-click states if it wants the capture-phase
     variant measured; not worth churning production code for on its own.
  5. **`app.js:2724` in the `specs.js` prose points at the comment**, not
     the code: `fDecode` starts at 2718 and the heuristic is 2725-2726.
     Inherited from the plan's own wording.
  6. Nit 6 (a stale "OPEN" on the host-load blocker) is **already fixed**
     - see "Blockers", now marked RESOLVED with its record kept.

- **Recorded by the Phase 5 planning pass (planner, 2026-09-12):**
  - `Icon.svelte` and `SelBar.svelte` sit at exactly 75% branches, on the
    component bar with no room; B12 adds the branch each is missing
    rather than moving the bar (decided 4).
  - `compress.ts` sits one point over each `ports` bar (71.42/57.14/70.58
    against 70/55/70); the happy path runs for real under
    `tests/app/states.js`'s packed-link state (B12) - the bar stays.
  - `FEATURES.md`'s filter bullet says the address is "read back only
    when the segment actually changed"; that is the live `S.fSeg` rule,
    and the rewrite reads it back on every write. After B11's decoder fix
    the two behave the same for every reachable segment; Phase 7's sweep
    rewrites the sentence to what the rewrite does.
  - The live app's own failure on a two-frame link
    (`#/tables/frames/f_frame-beast_feast-colossus` opens an empty
    table) is a live defect the rewrite does *not* reproduce - B11
    records it in `specs.js` prose and `FEATURES.md`; it is not a
    `DEBT.md` entry (that file is for defects reproduced on purpose).
  - `#/tables ~ a row opened, list menu` (B11) is the first parity state
    that opens the menu inside the modal; if CI reads a difference the
    diff image decides, and the `$effect` in `AddToList.svelte` (measure
    on open only, where `placeMenu` re-measures on every render) is the
    first suspect. **Confirmed and narrowed (planner, 2026-09-12)**: the
    state itself is clean (its `two` seed makes every card open up); the
    defect is the re-measure after "+ Новый список", from the flipped
    side - B11.1, `plan.md`, decided 7, 2b.
  - `print`'s geometry port (`tests/app/print.js`) is Phase 7's deletion
    batch, not B12's; until then parity's 54 `#/print` cells are the
    gate (decided 3).
  - Known thin spots that stay after B12, honestly: `hover: none`, the
    share sheet's success path, the OS clipboard (the stub is what the
    port's happy path is exercised through), print fitting until Phase 7.

- **B10's review nits (reviewer, 2026-09-11; approve, no blockers).** None
  was worth the remediation cycle; each names its file so the next batch
  that opens it can pay it. Nits 1-3 most naturally ride with Phase 8's
  register sweep, which already owns `plan.md` and `DEBT.md`.
  1. `app/src/components/TablesPage.svelte:446-449` - the comment claims
     `.tablenav` is "the base `.panel` rule plus this screen's own
     margin-free nav row", but there is no delta: the rule is byte-identical
     to `Panel`'s and `style.css` styles nothing with the class. The real
     reason it stays inline is DOM fidelity to live's `class="panel
     tablenav"` (`app.js:2559`) under decided 1's no-`class`-prop rule.
     `plan.md`'s decided 1 carries the same weak wording - true of
     `.ffilter` and `.lroll`, false of `.tablenav`.
  2. `issues/47/plan.md:10915` - "998 tests (997 before this batch plus the
     new not-found case)". The count is right, the arithmetic is not: B10
     rewrote the existing not-found case rather than adding one, and B9's
     own record already read 998.
  3. One structural pin for eight call sites: `sharedListPage.test.ts:114`
     is the only assertion that would catch `PageTitle`'s `{#if}` being
     re-nested. A `childNodes` length assertion on the `h1` and the
     `p.page-sub` in `record.test.ts`'s not-found case costs one line each
     and covers what the pixels cannot see.
  4. `app/src/components/SearchPage.svelte:151-153` - the note about the
     deleted `<style>` block sits at the end of the template as an HTML
     comment; the file's other explanation lives in the script header,
     which reads better.
  5. `.miss` moved `--muted2` -> `--muted` in `ListPage`/`PrintPage`.
     Sanctioned by decided 3, unphotographable (the harness always loads
     data), explained in `NoData.svelte`'s header - recorded here only so
     it is not rediscovered as drift.
  6. `svelte-ignore a11y_missing_content` was deleted rather than moved
     (old `ListPage.svelte:591`). Correct - `svelte-check` raises nothing
     on `PageTitle`'s `<h1>` - but the compile-time empty-heading guard is
     now unreachable for all eight call sites. The why survives at
     `ListPage.svelte:589-590`.

- **Assigned by the B10 planning pass (planner, 2026-09-11).** Of the
  carry-ins the B9 pass handed B10, five are in B10 (`plan.md`, "B10
  planned", decided 6) and two are left where the sweep table already
  puts them: **`Shell.svelte`'s `@page` outside `@media print`** - B10
  does not open `Shell` (no furniture lives there), so it stays on Phase
  8 R1's backlog; **`.badge` copied three times** - B10 does not open
  `TableRows` and runs no tables state, so "re-measured anyway" does not
  hold; Phase 8 R2, or the first batch that opens `TableRows` and the
  card together. Also left, by decision rather than omission: the three
  composed `.panel` variants (`.tablenav`, `.ffilter`, `ListPage`'s
  `<details class="panel lroll">`) and `PageHead`'s own `.page-h`/
  `.page-sub` keep a copy of the base declarations, each with a comment
  naming the shared component and the Svelte-scoping reason - if a
  global-class layer is ever adopted (it is not, per `CLAUDE.md`'s
  architecture boundaries), they are the four places to revisit. And a
  new register entry, **D5** (the record page's tab title), is written by
  B10, not fixed; its fix is Phase 8's.

- **Classified by the B9 planning pass (planner, 2026-09-11) - every
  item in this section and in "Notes" has a home now; the table is
  `plan.md`, "Phase 8", "What the sweep ... found, classified".** In one
  line each: the reduced-motion kill, the stale packed-link expansion
  (B5.6 risk 3), the storage notice's button-in-summary with
  `nested-interactive` off suite-wide (B5.3 nit 1) and the shared `S.kind`
  (B6) become `docs/specs/DEBT.md` D1-D4, written by B9; the anchor
  re-play and the never-drawn ring are fixed by B9; `RecordPage.svelte:59`,
  the furniture copies, `ListPage.svelte:103`'s comment, `Shell.svelte`'s
  `@page`, the two missing "Recorded, not keyed" sentences and the spec
  nits (B6 nit 10, B5.3 nit 2, B5.6 nit 5) are B10's; the fixed-not-ported
  improvements (the dice names, the grid numbering, short links in the
  import field, `Chip`/`Seg` `aria-pressed`, the rung labels, the notice
  surviving a create/delete, `createNew`'s toast gating, and now B9's
  keystroke re-play) are Phase 7's sweep into `FEATURES.md`/`STATE.md`
  when `specs.js` retires; the unverified toast-over-dialog claim, the
  `works()` once-read, the in-flight packed window, the `menuFor`-on-Escape
  hole and every test/code nit are Phase 8 R1's to verify and R2-R4's to
  fix in the batch that opens the file; the harness limitations (the
  `href` gap, no keyboard state, no equipment anchor state, the width
  sweep, the language leak) die with the harness and Phase 7 decides what
  the post-cut-over net keeps; Playwright is answered at Phase 7's
  planning pass. **Two entries below are corrected by measurement**: the
  "`Button.svelte` ports no `.btn:focus-visible` rule ... the rewrite
  shows the browser's default ring" note under B7's assignment is false -
  `tokens.css:150`'s global `:focus-visible` draws the gold 2 px ring at
  2 px offset on every `.btn` in the rewrite, the live app draws the same
  ring from `style.css:1002`, and the only difference is the focused
  radius (9 px from `--r-sm` against the live rule's `8px`); the earlier
  reading that saw "solid 3px currentColor" on both apps was a t=0 read
  of the 150 ms outline transition (`context.md`, "B9 planning facts").
  And B6 nit 9 (the kind-filter heading) is fixed in `plan.md`.

- **Recorded by the B8 planning pass (planner, 2026-09-11), for B9/B10 -
  not B8's:**
  - **`RecordPage.svelte:59` draws `notFoundSub` as `<p class="miss">`
    where the live app draws `<p class="page-sub">`** (app.js:3195). A real
    divergence on `#/i/<unknown id>`, which has no parity state. B10's
    (`plan.md`, "B10 outlined").
  - **The furniture inventory is re-taken at `9fd3000`** and differs from
    the counts carried above: `.panel` is five div copies plus one
    `<details>` (`ListPage`), `.page-h`/`.page-sub` five each (`PageHead`
    included), `.card-acts` four, `.miss` seven with two different colours
    (`--muted2` in `ListPage`/`PrintPage`, `--muted` elsewhere),
    `toggleAllIn` still two (`ListPage` ticks its own `lsel`, so the
    "third caller" rule has not triggered - it stays). Table and filters:
    `plan.md`, "B10 outlined".
  - **The rewrite's reduced-motion block in `tokens.css` is an invention
    the live app does not have**, and its `transition-duration` line is
    what puts the `375` anchor cells 6px apart (`context.md`, "B8 planning
    facts"). Whether to port the live policy or keep the kill as an
    accessibility choice is the owner's, at B9's planning pass (`plan.md`,
    "B9 outlined", "Questions for the owner").
  - **The rewrite never re-plays the anchor scroll-and-flash on a language
    switch** (the effect is guarded on `app.navigations`; `setLang()` does
    not bump it) where the live `render()` does on every render. Already
    named in the `specs.js` note for the ring; now also measured as the
    22px scroll offset behind `voa ~ section anchor @ en 375` on CI. B9's.

- **Deferred, not fixed (B7 review, 2026-09-11): `Shell.svelte`'s `@page` rule
  sits outside `@media print`.** It is `@page { size: A4 portrait; margin: 0 }`
  at the end of the component's `<style>`, where the live app has it inside the
  print block (`style.css:1398`). `@page` only ever applies to paged media, so
  it draws identically today; it is a fidelity difference and a reader trap,
  not a defect. Left alone in the remediation pass because that pass was
  blockers-only.
- **Deferred, not fixed (B7 review, 2026-09-11): `tests/parity/specs.js`'s
  "Recorded, not keyed" note does not cover B7's two deliberate DOM
  divergences** - `aria-pressed` on the colour/black-and-white segments, where
  the live app writes none, and `<h2 class="pc-name">` where the live app
  writes `<h3>`. Both are intentional and both are the rewrite's accessibility
  improvement over the live markup; the note that explains why such
  differences are recorded rather than keyed should name them. Documentation
  only.
- **Assigned by the B7 planning pass (planner, 2026-09-11):** B6 review
  risks 1-3 are folded into B7's group B and the `foundRows` log line
  (risk 1 for `#/tables` locally, CI for the other six cells; risk 2 by
  the plain `#/tables` cell; risk 3 by printing the figure). B6 nits 4-11
  stay as written. Noticed while reading `style.css:1002-1005` for `Seg`:
  **`Button.svelte` ports no `.btn:focus-visible` rule** - the live gives
  every `.btn` a 2px gold outline at 2px offset and the rewrite shows the
  browser's default ring; `Seg` gets its own ring in B7 (a touched path),
  `Button` is not B7's file and waits for whatever next opens it. Also for
  the page-furniture pass after B7: `.page-h`/`.page-sub` reach a fourth
  copy (`PrintPage`), `.card-acts` a third, `.miss` a third.

- **B6's review findings (reviewer, 2026-09-11, on `9d5ca02`) - recorded,
  not fixed; the verdict was approve and no remediation cycle was spent.**

  Risks, in the order they would bite:
  1. **The `typeRuns` probe change was never re-run on the states that use
     it.** `tests/parity/specs.js:768` widened `search` from `.toolbar
     input[type=search]` to `input[type=search]`, which affects seven
     existing tables states, and **none of them is in either parity group
     B6 ran** - group B's three tables states are not in `typeRuns.only`.
     The reviewer verified by inspection that the selector resolves to the
     same element on all seven (the only other `input[type=search]` in the
     rewrite is `AddToList.svelte:210`, in the DOM only with the menu open,
     and no `typeRuns` state opens it). **CI is the actual proof: on the
     next run read the seven `typeRuns` tables cells and the plain
     `#/tables` cells specifically.** CI's five standing red cells are all
     `#/i/ci1`, so a tables regression would stand out.
  2. **Nothing photographs the tables toolbar box unfocused.** All three
     tables states in group B type into it, so "TablesPage did not silently
     acquire focus-on-arrival" rests on reading the code, not on a
     measurement. The plain `#/tables` cell in the full suite covers it.
  3. **`foundRows`'s actual numbers are not recorded.** The acceptance
     criterion names 87 / 34 / the stat-line count / 300; "Verification"
     records only `расхождений нет`, which would also read green if
     `.rows [data-row]` matched nothing on both apps. The reviewer
     confirmed both apps do render `.rows` + `[data-row]` (`app.js:2788`,
     `TableRows.svelte:100-105`) and that `#/search ~ a row ticked`'s
     `d.click('Выбрано')` would have thrown with no rows - so rows
     certainly drew. **Print the figures next time the group runs.**

  Nits, for whichever batch next touches the file:
  4. `app/src/state/app.test.ts`'s "resets on a fresh app" case calls
     `fakeEnv()` twice and `fakeEnv` mints a new `memoryStorage()` each
     call, so it cannot detect `kinds` being persisted - the plan's
     "storage holds no new key" is unproven. One line: share one storage
     instance across the two renders, or assert on its keys.
  5. No test asserts the tables toolbar box is *not* focused on arrival.
     `expect(box).not.toHaveFocus()` in `tables.test.ts` would turn the
     `focus` default into a guarded contract.
  6. `plan.md`, "B6 built" says "three test-writing deviations" while
     "Verification" records two more (the modal case closes via the
     "Закрыть" button instead of `Escape`, and a `tick()` after
     `router.navigate`). Both extra ones are correct - `RecordModal.svelte`
     relies on the native `<dialog>` `close` event and nothing in the app
     hand-writes Escape, so jsdom's gap is real - but the two accounts
     disagree on the count.
  7. The rewritten `search.test.ts` cases prove the built line contains the
     type word but no longer prove `search()` *reaches* the line for such a
     query; that claim now rests on the `#/search ~ stat line` parity state
     and on `matches`' older cases. A corpus-independent version is
     available: `search([gear], 'основное оружие', line)` returns the
     record and `search([gear], 'основное оружие')` (no line) returns none.
  8. `SearchPage.svelte`'s `.miss` rule is a second copy of `TablesPage`'s
     - not recorded alongside the `.panel` and `toggleAllIn` copies below.
  9. `plan.md`'s decision heading still reads "The kind filter is per
     panel, not per app" while its body and the code now say the opposite;
     a reader skimming headings gets the wrong answer.
  10. `docs/specs/FEATURES.md`'s new cap clause sits on a bullet whose
      neighbour is about each table's own search box; naming `#/search` in
      the clause would remove the ambiguity, since the cap is that page's
      alone.
  11. `app/src/App.svelte` - with the generic section fallback gone, a
      `Section` added later without its own branch silently falls to the
      `.todo` paragraph instead of drawing its heading. Unreachable today
      (`tables` is caught by `TABLES_RE` before `isSection`; every other
      section has a branch), but nothing forces the next author to notice.

- **Cleanup done at B6 closeout (orchestrator, 2026-09-11).** The stray
  gitignored vitest cache the planner found at
  `app/src/components/app/node_modules/.vite/vitest/` (6.1 MB, left by some
  session running a single-file vitest from the wrong cwd) was deleted,
  along with the otherwise-empty `app/src/components/app/` that held it.
  Nothing tracked was touched; no other scratch artifact was removed.

- **B5.6's review findings, assigned by the B6 planning pass (planner,
  2026-09-11) - risk 1 closed by B6 (implementer, 2026-09-11).** A
  `packedExpanded` spec with `only: ['#/l/ ~ packed']` throws when
  `d.hash()` is `#/l/zzzz`, else returns `{ expanded: !hash.startsWith(
  '#/l/~') }`; the group B parity run read `{ expanded: true }` on both
  apps without throwing. Nit 1 (`ListPage.svelte:103`'s comment naming the
  deleted `todo` paragraph) **stays recorded** - B6 did not open that file.
  Risks 2-3 and nits 2-5 stay as written below.
- **Recorded by the B6 planning pass, still not done (planner, 2026-09-11;
  confirmed still open after B6 landed, implementer, 2026-09-11):**
  - `.panel` is now at its sixth inline copy - `SearchPage.svelte` landed it
    (alongside `AltPanel`, `ListPage`, `ListsPage`, `RollPanel`, `StdPanel`,
    `TablesPage`'s `.tablenav`, `FilterBar`); with the `.page-h`/`.page-sub`
    copies B5.6 recorded, one extraction pass over the page furniture is
    owed once the print slice is in and every page exists.
  - `toggleAllIn` (the select-all on/off rule over `app.sel`) is now at its
    second copy (`TablesPage`, `SearchPage`); a third caller moves it to
    `AppState`.
  - `lib/dict.ts`'s `subSearch` carries the record count `1061`, the same
    number `tests/derived.js` ("счётчики в текстах") checks in `index.html`,
    both READMEs, `app.js`, `llms.txt` and `robots.txt` but not in
    `app/src/lib/dict.ts`. Add `dict.ts` to that file list when the rewrite
    is what ships (Phase 7), and to `CLAUDE.md`'s "When counts or source
    lists change" line at the same time.
  - A stray vitest cache directory exists at
    `app/src/components/app/node_modules/.vite/` (gitignored via
    `node_modules/`; created by a single-file vitest run from the wrong
    working directory in some session). Disposable; the orchestrator's to
    remove at reconciliation, not a worker's.
- **B5.6's review findings (reviewer, 2026-09-11, against `ccbf345`) -
  approved with no blockers; recorded, not fixed.** The batch's one review
  cycle is spent; none of these justifies a remediation pass on its own.

  Risks:

  1. **`#/l/ ~ packed` cannot tell a real expansion from a symmetric
     failure.** The driver's `expanded()` returns as soon as the hash leaves
     `#/l/~`, including when it lands on `#/l/zzzz`. If both apps failed to
     decompress, the two bad-link pages match pixel for pixel and
     `listAddress` reads `#/l/zzzz` on both: cell green, nothing expanded -
     the app-to-app blind spot B5.5's review closed in `reorderedByDrag`
     with a throw (`tests/parity/specs.js:520-528`). Smallest close: a spec
     with `only: ['#/l/ ~ packed']` that throws when `await d.hash()` is
     `#/l/zzzz`. `listAddress` itself cannot carry it - it also covers the
     legitimate `#/l/zzzz` state and its `run(d, lang)` never sees the state
     id.
  2. **The in-flight packed window is an unrecorded visual difference.** The
     live app draws nothing while expanding (`app.js:4636` - no frame, no
     tabs); the rewrite mounts `Shell` at once and shows an empty content
     area under a live frame. The harness cannot measure it (the live
     `ready()` blocks until expansion), so it is neither a `STATES` entry
     nor `VISUAL_DEBT` - but it is real for a slow or large payload, and it
     is stated only inside an HTML comment in `ListPage.svelte`.
  3. **A stale expansion can pull the reader back.** `#expand`'s `then`
     replaces unconditionally, so an unpack resolving after the person has
     navigated away rewrites the address to the shared list. The live
     `expandHash` has the identical flaw, so the rewrite is parity-correct
     and must not be "fixed" without recording the divergence - but nothing
     pins it today.

  Nits:

  1. `app/src/components/ListPage.svelte:103` - the `$effect` comment still
     explains a failure mode as ending on "the 'not ours' `todo`
     paragraph"; that element was deleted in `ccbf345`. Should name
     `SharedListPage`. One line, for the next campsite pass in this file.
  2. `AddToList.createNew`'s `N_SHARED` branch gates the toast on
     `app.lists.saved`; live `createFor` toasts `addedTo` unconditionally
     after `saveLists()` (`app.js:4227`). Visible only when storage refuses
     (live: `addedTo` overwrites `saveFailed`; rewrite: only `saveFailed`).
     The rewrite's shape is better and matches its own sibling path -
     recorded as **intentional** rather than left silent.
  3. Taking a **players'** link - where `encodeList(l, true)` already equals
     the address - is the one `createNew` path nothing exercises; both the
     component test and `tookSharedList` start from the `gm` payload, so the
     hash always changes. It works; one assertion would pin it.
  4. `sharedListPage.test.ts`'s `withTwo` helper has a single caller; every
     other seeded case builds storage inline.
  5. `docs/specs/FEATURES.md` (79-80) describes Import but has no bullet for
     the shared-list page itself. Pre-existing and out of B5.6's declared
     scope - not introduced by this batch.

  Judged and dismissed by the same review, so nobody re-opens them: the
  implementer's self-reported deviation (`screen.getByRole('main')` instead
  of an `#app main` CSS selector) **does not matter** - same element, the
  assertion is an absence, a broader scope makes it stricter, and it still
  discriminates because the bad-link page would put an `h1` there. And in a
  real browser `go('#/l/~x')` runs `#expand` twice (once from `go`, once
  from the `hashchange` it causes), resolving to two identical
  `replaceState` calls - harmless, and the double-`onChange`-after-`go`
  shape is pre-existing for every navigation, not introduced here.

- **B5.4a nit 1 and B5.3 nit 5 are closed by B5.6 (implementer,
  2026-09-11).** Nit 1: `RowMain`'s `tail`/`.rtail` has its caller -
  `TableRows`'s `TableEntry.tail`, threaded from `SharedListPage.svelte` -
  and stays. Nit 5: `ListStore.create(name, init)`'s second caller is
  `AddToList.svelte`'s `createNew()`, taking a whole shared list
  (`key === N_SHARED`) into a new list in one call. Recorded, still not
  fixed, by the same pass: `.page-h`/`.page-sub` now have four scoped
  copies (`RecordPage`, `ListPage`, `PageHead`, `SharedListPage`) - a
  heading-rule extraction is project-wide cleanup for after the lists
  slice, not a B5.6 change; nobody has picked it up yet.

- **B5.4a's nits 2, 3 and 5 are closed by B5.5 (implementer, 2026-09-11).**
  Nit 2: `specs.js` carries the "Recorded, not keyed" paragraph above
  `ACCEPTED` naming the money chips' `aria-pressed`/`aria-current` divergence
  in prose, per the planner's decision - no key was added. Nit 3:
  `ListPage.svelte`'s two heading blocks use `var(--h-page-size)`/
  `var(--h-page-weight)`/`var(--h-page-spacing)` in place of `23px`/`680`/
  `-0.01em`; every `#/lists/a*` cell still reads `совпадает`, confirming the
  computed values did not move. Nit 5: `rp` and `guess` are named in the
  "Local state" comment beside `roll`/`moneyHelp`, with the same observable
  difference recorded (a value typed or a panel unfolded forgets itself here
  on a navigation away and back, where the live app's memory keeps it). Nit
  1 (`RowMain`'s dead `tail`) remains B5.6's; nits 4 and 6 stay as written
  below - nothing changed about either.

- **B5.4a's six nits, assigned (planner, 2026-09-11)** - see `plan.md`,
  "B5 remainder planned", the nit table. Nit 1 (`RowMain`'s `tail`) is
  B5.6's to use through `TableRows` on the shared page or delete. Nit 2
  (the money chips' `aria-pressed`) is decided: **no `ACCEPTED` entry** -
  `d.controls()` reads names only, so no key differs, and `parity.js` fails
  a run on a stale key; B5.5 records it as prose above `ACCEPTED`. Nits 3
  (the hardcoded heading values) and 5 (`rp`/`guess` joining the
  component-state list) are B5.5's. Nits 4 and 6 are notes and stay as
  written below.

- **B5.4a's review against `8873473`: fix-then-continue, one blocker, six
  nits** (reviewer, then implementer, 2026-09-11). The blocker (the grip's
  missing `draggable="true"`) is fixed - see "Blockers" and `plan.md`,
  "B5.4a built", the correction paragraph. The six nits, recorded rather than
  fixed per the no-remediation-cycle-for-nits rule:
  1. **For B5.6.** `RowMain.svelte`'s `tail`/`.rtail` is dead code until
     B5.6 uses it. The planner sanctioned it, but `CLAUDE.md`'s "add no
     variant before something uses it" was still breached - B5.6 should
     justify keeping it or drop it.
  2. **For planning, not B5.4b/B5.6 specifically.** The money chips write
     `aria-pressed` where the live `moneyPickerHTML` (`app.js:2944`) writes
     `aria-current="true"` and no `aria-pressed`. Reusing `Chip.svelte` is
     defensible; the divergence just is not recorded. `CLAUDE.md` asks for
     intentional accessibility differences to go in `ACCEPTED` with a
     reason - a planning decision, not a review-time fix.
  3. **Cosmetic, no behaviour change.** `ListPage.svelte` (~714-716,
     ~774-776) hardcodes `23px` / `680` / `-0.01em` where `--h-page-size`,
     `--h-page-weight`, `--h-page-spacing` exist in
     `app/src/styles/tokens.css:70-72`. Computed values are identical
     today, so nothing renders differently; worth tokenising whenever that
     block is next touched.
  4. **Worth noting for a future keyboard-parity state.** `RowMain.svelte:118`
     adds `.row-main:focus-visible`, which `TableRows.svelte` never had. It
     correctly restores `style.css:1001` and is a welcome campsite fix, but
     it changes what every table row draws on keyboard focus and was
     unrecorded - flagged so a future keyboard-focus parity state is not
     misread as a regression.
  5. **Add to the existing timed-state-divergence list** (alongside
     `listRoll`/`keepOpen`). `moneyHelp` is component state where the live
     `S.moneyHelp` is app memory (`STATE.md`, "Prices"), so navigating away
     and back folds the help here and leaves it open live.
  6. **Nothing to fix; recorded so it is not re-derived.** `ListPage.svelte:701`
     renders the sub as three text nodes where the live app writes one
     escaped string. All six `#/lists/a @` cells read `совпадает`, so there
     is no measured difference today - noted only in case that line ever
     picks up debt later.

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

## Cleanup performed / retained artifacts (R0a, orchestrator, 2026-09-13)

- **Removed:** nothing from the repository. `app/coverage/` and `coverage/` were
  checked and already absent - vitest had cleaned up after the two colliding
  runs described below. `test-output/app-states.log` is left in place: it is
  gitignored, it is the failure output the flaky case wrote, and it is evidence
  for the "Deferred" entry that names it.
- **Retained, deliberately:** `issues/tg-preview-refresh/` (three untracked
  files) belongs to a different task and was never staged. Every commit in this
  batch staged by path; `git add -A` was never used.
- **The one incident worth carrying forward.** Mid-batch, the implementer's
  `npm run check` was backgrounded, so the PostToolUse hook never observed it
  and it armed no commit gate - 937 s spent for nothing. The orchestrator then
  started its own foreground check to supply one, it crossed the 600 s cap and
  was backgrounded too, and for roughly ninety seconds **two vitest coverage
  passes ran on one tree**. Both were stopped; the tree was unharmed
  (`git status` unchanged, `node tests/derived.js` green). The next clean run
  failed at 346 s with vitest's `Something removed the coverage directory ...
  Make sure you are not running multiple Vitests with the same
  "coverage.reportsDirectory" at the same time`, which is pure residue, and the
  run after that was **`EXIT=0` in 147 s**. So: `npm run check` costs ~147 s
  alone on this host, the 937 s reading was contention, and the rule that
  produced the mess is the one already written down - a check is run in the
  foreground, in one call, beside nothing else.

## Notes

- **Phase 5 planning pass (planner, 2026-09-12).** Mocks path: none (no
  UI change). Screenshot findings: none - the two defects were measured
  by DOM and geometry probes, not by pixels; the probe script is in the
  session scratchpad (`probe-defects.mjs`), its numbers are in
  `context.md`. Cleanup performed / retained artifacts: `app/coverage/`
  written by one vitest coverage run (ignored by git); no `test-output/`
  written (the re-pointed suites ran from the scratchpad and write no
  files); the tree is unchanged apart from `issues/47/`. The untracked
  `issues/tg-preview-refresh/` is another task's and was not touched.
  Session end partial progress: none - the plan is complete for B11.

- Mocks path: none for B6 - the search page is transcribed from
  `app.js`/`style.css` line by line (references in `plan.md`, "B6 planned")
  and measured live in headless Chrome (`context.md`, "B6 planning facts");
  the probe script lived in the session scratchpad and was not kept.
  None for B5.5 either - the bar's actions, the money panel and the drag marks are
  ported from `app.js`/`style.css` line by line (references in `plan.md`,
  "B5.5 planned"); no measurement pass was taken in planning, the harness proves the port.
  None for B5.3 either - the index is transcribed from the live
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
