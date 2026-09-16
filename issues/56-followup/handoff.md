# Handoff - TASK 56-followup
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (**reopened** on 2026-09-16 after the human tested
  the published site and rejected half of B1's provenance policy)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `8dae1b9`. B1/B1r landed at `106e4dd`, `33d0b26`,
  `2d2e983`, `c92c8e8`, `bb55a2d`, all pushed. **HEAD moves under this task**:
  a second session commits to the same working tree for `issues/config-audit`
  and `issues/47`. Re-read HEAD and `git status` before starting B2.

## Completed
- Batch name/id: B1 (Split Other into real subtables) and B1r (its twelve-
  finding remediation). Both done, committed, pushed.
- What shipped: canonical `other_starting` / `other_frames` routes under the
  Other group, `frames` kept as a read alias, the 29/95 split, frame-first
  backlinks, stored-home normalisation, the 1091 counter fix, the `f95`
  `Сетевой Узел` correction, frame-tier suppression on direct surfaces, and
  full Other breadcrumbs on every provenance surface. That last item is the
  one the human has now partly reversed - see "Next batch".
- Files changed: 68 files in `c92c8e8`; `plan.md` + `handoff.md` in `bb55a2d`.
- Commit(s): `106e4dd feat(catalog): split other tables and clarify
  provenance`, `33d0b26 test(contracts): align frame tier fixture`,
  `2d2e983 fix(app): resolve task 56 typecheck regressions`,
  `c92c8e8 fix(app): repair Other provenance and the specs the split left
  stale`, `bb55a2d docs(56-followup): record the B1r commit and why the gate
  was bypassed`.
- Deviations and rationale: this planner pass wrote no production code. It
  reopened the task, recorded the two-abstraction design, and marked which of
  B1's settled provenance lines are void.

### B1r closeout: why `c92c8e8` used `SKIP_CHECK_GATE=1` (do not lose this)
`npm run check` could not pass on that tree for a cause entirely outside the
batch: the concurrent `issues/config-audit` session's untracked skill install
(`.agents/`, `.claude/skills/impeccable/`, `.impeccable/`) fails `format:check`
in 16 files and fails `lint` outright (`live-browser-dom.js was not found by
the project service`). None of those files was in the commit. Every stage of
the gate was run with the foreign paths excluded and all passed: prettier over
the twelve changed paths; `npx eslint app/src`; `npm run typecheck` (545 files,
0 errors); `npm run data` + `node tests/derived.js`; `node tests/i18n.js` (ru
251 / en 251, parity held); `node .claude/hooks/selftest.mjs` (317/0);
`npm run test` (42 files, 1026 tests, 96.59% statements);
`npm run check:built` (88.9 kB against the 120 kB budget); all four
`tests/app/golden.js` shards, update then compare, zero diffs.

**Resolved 2026-09-16, after this planner pass was dispatched.** The owner
decided the impeccable skill was not being adopted now, so the whole untracked
install (`.agents/`, `.claude/skills/impeccable/`, `.claude/agents/
impeccable-*.md`, `.codex/`, `.impeccable/`, and the matching hooks in the
ignored `.claude/settings.local.json`) was moved out of the tree - moved, not
deleted, to this session's scratchpad, since git could not have restored it.
`npm run check` then passed end to end: 42 files, 1026 tests, exit 0. **B2 has
a green gate and must not use `SKIP_CHECK_GATE=1`.**

### Still owed from B1r
- `node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts,app/states`
  last reported **2 of 7 failed**: `app/sweep` at 768 and 390, both
  `TimeoutError: Navigation timeout of 30000 ms exceeded` from Puppeteer
  (`tests/parity/driver.js:154`), not assertion failures. `app/sweep 1180`,
  `app/sweep 360`, `app/contracts`, `app/states`, `app/typo` and `app/hues`
  passed in the same run, and `contracts`/`audit2` (also full-page Puppeteer,
  including at 360 px) passed cleanly earlier. Reads as headless-Chrome
  resource contention with the concurrent session, but it is unverified.
  **B2 runs this suite anyway**, so a clean pass there discharges it.

## Verification
- Commands run (exact), this planner pass: read `CLAUDE.md`,
  `issues/56-followup/{context,plan,handoff}.md`, `docs/specs/{FEATURES,
  I18N,CONTRACTS,COVERAGE}.md`, `docs/parity.md`, `app/src/lib/label.ts`,
  `app/src/lib/frames.ts`, `app/src/lib/types.ts`, `app/src/lib/dict.ts`,
  `app/src/components/{RecordPage,RecordCard,RowMain,TableRows}.svelte`,
  `app.js` (590-1000, 2420-2480, 3200-3250, 3390-3450),
  `tools/build-share-pages.js`, `tests/parity/specs.js`,
  `tests/app/inventory.js`; ripgrep over `whereFrom|srcLabel|printSrc|
  isFrameRecord` and `badge src`; read-only `node -e` audits of `data.json`;
  grep audits of `tests/app/snapshots/`.
- Results (verified, not assumed - B2 may rely on these):
  - There are exactly **five** `.badge src` sites:
    `RecordCard.svelte:136`, `RowMain.svelte:98`, and `app.js` `2029`
    (`cardHTML`), `2821` (`rowHTML`), `3093` (`listRowHTML`). Grid tiles carry
    no source badge.
  - The 29 unframed starting records are **21 `src: 'core'` and 8
    `src: 'hnf'`**, so a starter's source book is real information.
  - `tableOf` already returns `'community'`, and the `community` table's group
    entry is already `Сообщества` / `Communities`. The `#/i/cm1` defect is the
    early return above it, not the routing.
  - `tools/build-share-pages.js` `provenance()` returns a breadcrumb only for
    frame and starting records and `''` for everything else; `subtitle()` then
    uses the historical `Предмет · Core · №12` form, whose middle field is a
    source leaf. Nothing in it needs to change under the new rule.
  - No file under `docs/fixtures/`, no line of `tests/contracts.js` and no line
    of `llms.txt` pins a provenance or badge string. B2 crosses no contract.
  - **Two divergences found in source** (both now in B2's scope): `app.js`'s
    `whereFrom` returns `srcLabel` for every non-frame non-starting record, so
    the fallback badge reads `Core` where the shipped rewrite reads
    `Core · Предметы`; and `RecordPage.svelte` omits the
    `· Артефакт` / `· Проклятый предмет` segment that `app.js:3237` prints, on
    11 VoA records (`voa2_a1`...). No golden or parity state opens either
    shape, which is why nothing caught them.
  - The goldens fold a row's badge into the row `button`'s accessible name and
    record it as `namelen`/`namehash`, which is why a few characters of badge
    text move ~95 of 108 snapshots.
- Gates: none run in this planner-only pass. B1/B1r's evidence is recorded
  above; B2's own gate list is below.

## Next batch (implement-ready)
- Name: **B2 - Separate the tag from the table path**
  (`issues/56-followup/plan.md`, "Batch B2", is the full specification; this is
  the summary, and the plan wins on any detail).
- Objective: make `.badge src` a one-word leaf tag again in both renderers,
  complete the table path at the top of a record page for the two shapes where
  it is short, and leave every other provenance surface byte-identical.
- In scope: `app/src/lib/label.ts` (`whereFrom`, `printSrc`, header comment);
  the five badge sites; `RecordPage.svelte`'s subtitle; the mirrored changes in
  `app.js` including `renderItemPage`; the tests that pin these strings; two
  new golden states; `FEATURES.md`, `COVERAGE.md`; regenerated goldens.
- Out of scope, each a recorded decision rather than an omission:
  `tools/build-share-pages.js` and every `i/*.html`; `data.js` and its
  generated outputs; `CONTRACTS.md`, `docs/fixtures/`, `tests/contracts.js`,
  `llms.txt`; `ROUTES.md`, `STATE.md`, `I18N.md`; routes, filters, sections,
  the `frames` alias, home normalisation, counters, the `f95` translation; the
  frame-tier suppression policy; `dict.ts`; `PrintCard.svelte`;
  `TableRows.svelte`.
- Files expected: `app/src/lib/label.ts`; `app/src/components/RecordCard.svelte`,
  `RowMain.svelte`, `RecordPage.svelte`; `app.js`; `app/src/lib/label.test.ts`;
  `app/src/components/{tables,record,searchPage}.test.ts`;
  `tests/app/inventory.js`; `tests/parity/specs.js`;
  `docs/specs/FEATURES.md`; `docs/specs/COVERAGE.md`;
  `tests/app/snapshots/*.txt` (generator output only);
  `issues/56-followup/{plan,handoff}.md`.
- Steps: the fifteen ordered steps in `plan.md`, "Batch B2 / Ordered
  implementation steps". The two that carry the whole design:
  1. `whereFrom` loses `if (it.src === 'community') return srcLabel(...)` and
     appends its third segment when `it.frame || it.community` (not when
     `isFrameRecord(it)`). Nothing else in it changes, so its output moves for
     the 90 community records and for nobody else.
  2. The five `.badge src` sites call `srcLabel` instead of `whereFrom`.
- Acceptance criteria: the full list is in `plan.md`. The load-bearing ones:
  `#/i/cm1` reads `Сообщества · Великородное` / `Communities · Highborne` in
  both renderers; no badge anywhere contains ` · `; `ci61` badges `Core`, an
  `hnf` starter badges `Hope & Fear`, `f1` badges `Пир зверей`, `f95` badges
  `Материнская Плата`; the `ci61`/`f1`/`f95` record-page paths are unchanged;
  `#/i/voa2_a1` reads `Vault of Ages · Артефакт · номер 1`; every `printSrc`
  output and every `i/*.html` byte is unchanged; no tier line moves; both
  renderers agree; `COVERAGE.md` says 110 states.
- Verification commands (the plan has the full ordered list):
  - `rtk npx vitest run --coverage=false app/src/lib/label.test.ts app/src/components/record.test.ts app/src/components/tables.test.ts app/src/components/searchPage.test.ts app/src/components/printPage.test.ts app/src/components/listPage.test.ts`
  - `rtk node tests/run-all.js i18n,derived,dataint,eqtest,qa`
  - `rtk npm run build`, then `node tests/app/golden.js --update --shard=N/4`
    for N in 1..4 **sequentially**, inspect the whole diff, then the same four
    shards without `--update`
  - `rtk node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts,app/states`
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` - **one foreground
    call, Bash timeout 600000** (`.claude/README.md`, "Run a long check")
  - `rtk npm run check:built`, `rtk git diff --check`
  - advisory: `MSYS_NO_PATHCONV=1 node tests/parity.js "#/i/"`. A nonzero new
    cell is recorded in the handoff for CI to confirm, never turned into a
    locally-invented `VISUAL_DEBT` number.
- Risks / do-nots: do not touch the share-page generator or any `i/` page; do
  not change `tableOf`/`tableIdOf`; do not widen the third path segment past
  `it.frame || it.community` (VoA sections are the book's tiers, not the
  record's); do not put a path back into any one badge "for consistency"; do
  not disturb frame-tier suppression or `eqLine`'s `noTier`; do not hand-edit
  a snapshot; do not add or remove a `dict.ts` key. Full list in `plan.md`.
- Fallback: none. The design is a revert of one half of `106e4dd` plus a
  two-line repair of `whereFrom`; there is no second approach worth carrying.

## Blockers
- **No design blocker.** The human settled both ends of the rule; the plan
  settles the middle (badge contents for frame and starting records, print card
  and share stubs as paths that do not change, and the fate of `whereFrom`'s
  community branch) and records each decision with its reason.
- **Process, carried from B1r and still live: a second session is committing
  to this same `main` working tree** for `issues/config-audit` and
  `issues/47`. Consequences for B2, none of which stop it starting:
  - `npm run check` may still be red on that session's untracked `.agents/` and
    `.claude/skills/impeccable/` files. Check first. If still red, follow
    B1r's precedent exactly: run every stage with the foreign paths excluded,
    record each result, and name the exclusion in the commit body.
  - `tests/parity/specs.js` and `tests/app/inventory.js` may be under edit for
    issue 47's R0b. Re-read both before adding the two `STATES` entries; keep
    the edit to those entries; never revert the other session's work.
  - The browser suites contend for the box. A Puppeteer navigation timeout is
    not an assertion failure - re-run it on a quieter machine rather than
    treating it as a regression, and say which it was.
- Out of band, still unanswered, flagged to the human at B1r and repeated here:
  `8dae1b9 test(issue-56): remove parity from deploy requirements` drops
  `parity` from `deploy.needs` and confines it to `workflow_dispatch`. Only
  `docs/parity.md` records it; no plan, handoff or commit body carries the
  rationale. That gap is why divergence (1) under Verification shipped.

## Deferred
- The seven unused `dict.ts` strings `tests/i18n.js` reports (`srcFrame`,
  `voaRecall`, `guessPrice`, `pcTh`, `printFoot`, `money_coin`, `money_bag`) -
  pre-existing, not this task's to decide.
- `app.js`'s `tableIdOf` still tests `it.frame`, `it.starting`, then
  `it.src === 'frame'`, where `label.ts`'s `tableOf` merged the two frame tests
  in B1r finding 12. No catalogue record reaches the difference. Fold them the
  next time either file is open for another reason.
- Whether a share stub's subtitle should carry a full table path for every
  record rather than only for Other records. Decided *not* to do in B2; it
  would cost a 1091-stub regeneration and its own contract commit.

## Notes
- Mocks path: none. B2 changes text inside existing chips and existing
  subtitle lines; no new element, no layout change. Badges get **shorter**, so
  `audit2`'s 360 px chip-row ceiling can only improve.
- Screenshot findings: the human's evidence is the published
  `#/i/cm1` (reads `Highborne`, should read `Communities · Highborne`) and the
  published source badge (reads `Core · Items`, should read `Core`). Both were
  reproduced in source rather than from the screenshot -
  `app/src/lib/label.ts:195` and `106e4dd`'s five badge sites.
- Cleanup performed / retained artifacts: nothing written outside
  `issues/56-followup/plan.md` and this file. Retained untouched: `.agents/`,
  `.claude/agents/impeccable-*.md`, `.claude/skills/impeccable/`, `.codex/`,
  `.claude/settings.local.json`, `issues/tg-preview-refresh/`, and everything
  belonging to the concurrent `issues/config-audit` and `issues/47` sessions,
  including the modified `issues/56-followup/context.md` in the working tree.
- Session end partial progress: none. This pass produced `plan.md` and
  `handoff.md` only, and left no production code uncommitted.
