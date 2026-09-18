# Handoff - TASK phase-8
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress. HEAD is `d882707 docs(phase-8): record the orchestrator's session cleanup and retained evidence`
  (= `origin/main`), two docs-only commits past B8.1's own review remediation
  (`0e7450b`, `d882707`). `main`'s `npm run check`, all four golden shards,
  and the full browser suite are all green as of `6b841f5`. B1-B8.1 are on
  `main` in full, including every review remediation cycle - see "Completed".
- Last agent: implementer (2026-09-18, this compaction -
  `docs(phase-8): compact task state`, `.md`-only, no production code, no
  `npm run check` per the dispatch).
- Branch: `main`.
- Base / starting commit: `d882707` (= `origin/main`).
- Review: standing policy for this task (`context.md`, "Review and nit
  policy") - every phase-8 batch gets a reviewer regardless of the standard
  triggers; nits are logged immediately to `issues/phase-8/nits.md` and
  cleared in B12, not folded into whichever batch is next.
- Next batch: **B9** - language and format (`tests/`/`tools/`), per
  `plan.md`. B9 re-derives every line number and Cyrillic-line count from
  HEAD (`d882707`) before starting - `tests/app/{driver,golden}.js`,
  `tests/app/golden.test.mjs` and `docs/specs/COVERAGE.md` all moved in
  B8.1 and its review remediation.

## Completed

One line per shipped batch: name, outcome, commit(s), deviation if any.
Full narrative, exact gate commands/results and measured-number tables for
every batch before B8.1 are preserved in git history - `git show <sha>` for
the commit, or `git show d882707:issues/phase-8/handoff.md` for this file's
pre-compaction text.

- **B1 - search normalisation (O1, PF2)** - `e7c7b50`. `foldQuery()`
  (case fold, `ё`->`е`, typographic apostrophes) plus a per-record memoised
  haystack in `search.ts`; folded once per language in `SearchPage`/
  `TablesPage`. Both `--only` golden probes green without `--update`.
- **B2 - hooks, ignore rules, truth fixes, `CLAUDE.md`, batch-size forcing
  function** - `44b1761`. Closed the commit-gate hooks livelock and two
  `bash-guard` holes; ~20 spec/doc truth fixes; `CLAUDE.md`'s remaining Q7
  edits plus the batch-size rule (171/200 lines, not the predicted 168 -
  recorded as unmet, not forced). C9 (`ignoreVoidReturningFunctions`) tried
  and reverted - see commit. `npm run check` and
  `node tests/run-all.js contracts,derived` both green.
- **B2 review remediation** - `c8cc38e`. Fixed three blockers (a false
  `CONTRACTS.md` claim; the count-bearing array renamed
  `COUNT_BEARING_FILES` everywhere it's cited; a false `COVERAGE.md` DC9
  claim about `Button.svelte`), B1's nits N1-N6/N8, and owner-approved N7
  (search now folds Latin diacritics and the Unicode minus sign). `npm run
  check` green; two `--only` golden probes green without `--update`.
- **B3 - CI shape (T1, T2, T5, T3, T8)** - `3bc605d`. `--shard=n/m` packing
  in `run-all.js`; CI's browser suites moved to a 4-way matrix, the
  standalone `golden:` job deleted; `sweep.js` splits the 1180px width by
  language. Deviation: also renamed `deploy.needs`'s `golden` to `browser`
  despite the dispatch scoping that to B4 - the plan's own step required it
  and leaving it undone breaks `deploy`; flagged for confirmation. Measured
  on CI run `35232880507`: wall clock 738s -> 436s (-41%), billed
  runner-seconds +27% (not the projected +10%); the 1180 split measured
  371.9s(ru)/172.7s(en), making `sweep1180-ru` the new critical-path floor.
- **B4 - deploy and gate correctness, `404.html` (DP1-DP7, T4/DP4, T6,
  T10/DP9, R8)** - `0a3d9fb`, `446e45b`. Job timeouts; `deploy`'s
  `contents: read`; the stale-generated-data guard; a stub-count check;
  push-to-main-only concurrency grouping; gitleaks pinned to a SHA;
  `check-site.mjs` split into an injectable-reader lib plus a thin CLI;
  `golden.js` exports its DOM-free half; `404.html` added (owner-approved).
  Deviation: `404.html` uses root-anchored links, not the plan's relative
  example - a relative link breaks from a nested bad path under Pages.
  Verified live and via the PR probe (`probe/dp4-stale-data`, PR #66,
  closed after use).
- **B5 - single sources: lib, generator, components** (A1, A3, A4, A5, A7,
  A9, A11, O5, O6, H5, C1/A2, C5, H6, H7, C2, C7, C8, D7) - `112bd07`,
  `571b041`. Dedup pass across `label.ts`/`listLink.ts`/`roll.ts`/`std.ts`/
  `print.ts`/`types.ts`/`frames.ts`; `build-share-pages.js` per-line
  description rendering plus an `EQ_*` export guard; clipboard/toast call
  sites collapsed onto `AppState.copied`/`say`; `Badge.svelte`/
  `NumRow.svelte` extracted; D7 (opacity, not palette) fixed and deleted.
  Deviation: `Badge.svelte` carries eleven variants, not the plan's nine
  (RecordCard's own die-result badge folded in). CI caught a real
  regression this batch's local gates missed (`craft.js`'s stub-staleness
  probe broke on multi-line descriptions) - fixed same-day in `571b041`.
  All four golden shards green throughout.
- **B6 - router, state and lists** (P1, D19, D5/O3, P11, R7, S1, S2,
  S3/D2, S6, R5, R4, DC1, R9, R10, R1, R2, S4, S5, S7, R3/P9, PF3, D23,
  D12, A6, P5) - `370fec2` (shell/router/state), `11066f0` (lists/two-tab).
  Skip-link and focus-ring fixes; router fallback plus a `<svelte:boundary>`
  catch-all; a stale-hash double-navigate fix; failed shared-list expansion
  keeps the address instead of overwriting it (Q4); `#/l/` and unknown-table
  handling widened (Q3); table-view persistence restored (Q1); list-storage
  corruption distinguished from absent, backed up once; cross-tab sync also
  on `visibilitychange`/`pageshow`; note re-seed, stale-`#deleted` and
  dropped/clamped-import fixes; debounced URL sync flushed on
  destroy/pagehide (a real `flushUrlSync`-vs-`del()` staleness bug found and
  fixed); delete gained an undo toast (P5). Deviation: D5/O3 (per-route
  document titles) was implemented, verified, then reverted here - it moved
  14 golden cells outside this batch's two authorised states; it landed for
  real in B7 instead, once that batch's re-record could absorb it.
- **B7 - accessible names, product text, structure - the re-record** (P2,
  P3, P6, P7, P13, P14, P15, pill name, D11, P4/D6, P8, P10, P12, D3, D8) -
  `e80a793` (code/docs), `dba6755` (golden `--update`). Real accessible
  names on row checkboxes/record modal/list fields; pill `×` hidden from
  the accessible name; search's shown-of-total line; add-to-list menu
  Escape/placement fixes; `SelBar` moved before `<footer>`; three new 44x44
  hit targets; storage-notice dismiss button moved out of `<summary>`
  (first attempt hid it while folded in real Chromium, caught and fixed);
  correct heading levels on the alt tables; frame equipment's tier now
  prints (D11/Q6); an editorial pass on `dict.ts` plus `README.ru.md`; D5/O3
  landed for real. 107 of 112 golden states moved across twelve identified
  categories, all spot-checked; the other 5 have no route to name. Two bugs
  found and fixed beyond the dispatch: `driver.js`'s name lookup mis-ranked
  a row's own checkbox ahead of its open button once both had similar names
  (split into `click()`/`tick()`); the storage-notice fix's first shape hid
  the dismiss cross while folded (fixed; the missing permanent regression
  coverage is `B7-N2` in `nits.md`).
- **B7 remediation** - `6b50945`. Fixed a stale `f7` share-statline fixture
  that broke CI's `app/contracts` (`35318680003`), a stale `noTier` doc
  comment, two stale `COVERAGE.md` claims, and added a frame-record
  tier-ladder test. `npm run check` and `node tests/run-all.js
  app/contracts` (252.1s) both green.
- **B8 - record actions, print, motion, focus** (D10, D13, D14, D15, D22,
  P16, R6, D20, D21, D1, D18) - `3c0fff8`. Tainted-canvas detection with a
  text-then-download copy-image fallback; roll-copy toasts; share sends
  text plus an image file when art exists; P16's print-name inspection
  (`cm26-f60-hi62-ci81`, both languages/layouts) found every card fits at
  one line - no shrink needed, pinning assertion added; broken print-art
  fallback; print-media rules for the modal/toasts; black-and-white print
  mode moved to memory-only state; a blanket `prefers-reduced-motion:
  reduce` CSS kill added (D1, Q5); five redundant focus-ring overrides
  deleted (D18). Deviation: a leftover P16-measurement viewport broke three
  unrelated print-media checks, fixed same commit.
- **B8 remediation** - `480c380`. Restored one of the five deleted
  focus-ring overrides (`RecordCard.svelte`'s `.card-media` - genuinely
  needed, `.card`'s `overflow: clip` clips the global rule's ring; the
  other four stayed deleted as real no-ops); restructured `copyImage()` for
  Safari's user-gesture invariant (the clipboard call must receive the
  still-pending PNG promise, not an awaited blob - `clipboard.ts`'s own
  comment and the `fakeClipboard.writeImage` test double were both
  corrected to match); fixed two stale spec/test claims.
- **B8.1 - the harness lost its settle instrument** (the three timed
  owned-list goldens) - `d267a0a`. Root cause: B8's blanket reduced-motion
  CSS kill collapsed the toast's real ~200ms fade to 0.01ms, so
  `driver.js`'s `settle()` started returning ~47ms before `ListPage`'s
  150ms debounced URL write landed - wrong on `#/lists/a ~ removed`/
  `~ prices set`/`~ batch deleted` (`ru` only). Full mechanism and the
  measured timing table: `context.md`, "A deterministic B8 regression" -
  not to be re-derived. Fix: a new `addressSettled()` wait in `driver.js`
  before every golden capture, plus a `golden.test.mjs` coupling test tying
  it to `ListPage`'s real debounce (proved to bite: temporarily changed the
  debounce, watched it fail, reverted). **Settled decisions, not to be
  reopened without the owner** (full reasoning in the commit and
  `context.md`): do not re-record the three goldens (their payloads are
  correct, the untouched seed is wrong); do not flush the URL synchronously
  in production to satisfy a harness timing; do not give the three states a
  per-state settle step - the capture-level wait covers the class; `timed:
  true` stays (correlated, not causal - the real predicate is "the `enter`
  step mutates the list"); keep the driver's reduced-motion emulation (it
  now exercises D1's real behaviour, and dropping it costs CI's
  `sweep1180-ru`, 371.9s, real minutes); keep `settle()`'s animation wait
  even though currently inert (the right instrument if the emulation is
  ever scoped down). All four golden shards green without `--update`.
- **B8.1 follow-up** - `dc7ed71`. Fixed an unrelated `app/states` case-10
  regression this batch's own A6 gate surfaced (untouched by B8.1's diff):
  the driver's clipboard `write` mock resolved without awaiting a
  promise-valued `ClipboardItem` entry, so a tainted-canvas rejection never
  propagated. `node tests/run-all.js app/states` and `npm run check` green.
- **B8.1 review remediation** - `6b841f5`. Tightened `COVERAGE.md`'s B8.1
  gate rule to require all four golden shards, not one - a single-shard
  proof would have missed this exact bug (one failure per shard across
  shards 2/3/4); fixed four doc-comment nits (NIT-1..4, NIT-4's regex fix
  proved against three refactor shapes) and one record correction (NIT-9);
  the rest of the review (R-1..R-6, NIT-5..NIT-8) persisted to
  `issues/phase-8/nits.md`, "From B8.1's review", for B12.

## Verification

Latest batch only (B8.1 review remediation, `6b841f5`); earlier batches'
exact commands/results are in git history per "Completed" above.

- `node --test tests/app/golden.test.mjs` - green, 17/17, including the new
  bound-and-count coupling case.
- NIT-4 refactor-case proof: three temporary edits to `ListPage.svelte`
  (a split call, the literal replaced by a named constant, a spurious
  second `setTimeout`), each run standalone against
  `node --test tests/app/golden.test.mjs` - each FAILED with a distinct,
  correct message; each reverted by hand (`git checkout`/`restore` refused
  by `bash-guard.mjs` while `issues/56/` sits in the tree) and confirmed
  byte-identical by diff against a pre-edit backup copy.
- `rtk npm run check` (Bash timeout 600000, foreground, no pipe) - green,
  run twice: `format:check`, `lint`, `typecheck` (svelte-check clean),
  `npm run data`, `node tests/derived.js`, `.claude/hooks/selftest.mjs`,
  every `node --test` suite including the updated `golden.test.mjs` and
  `tools/check-site.test.mjs`, `npm run test` (45 files, 1131/1131 tests,
  coverage 96.77/89.05/97.21/97.42 - thresholds green, unchanged since no
  `app/src/**` file moved).
- No golden shard or browser-suite re-run - this batch touches no
  production file and no golden capture path beyond doc comments and a
  test-file regex; the dispatch's own gate list is `npm run check` alone,
  and the reviewer confirmed no golden should move.
- `git diff --stat -uall` before commit - exactly the six files this batch
  touched; `issues/56/` untouched.
- Gates: `npm run check` (full, x2).
- Push: `git push origin main` (`41ce6d7..6b841f5`); `git rev-parse HEAD
  origin/main` agree.

## Next batch (implement-ready)

- **B9 - language and format, `tests/` and `tools/`** (H1, T7, H13, H16,
  H15, T12, H11). Objective, files, the four-commit split, acceptance and
  gates: `plan.md`, "B9".
- **B9 re-derives every line number and Cyrillic-line count from HEAD
  (`d882707`) before starting** - do not reuse any count recorded against
  an earlier commit. `tests/app/{driver,golden}.js`, `tests/app/
  golden.test.mjs` and `docs/specs/COVERAGE.md` all moved in B8.1 and its
  own review remediation, on top of B8.1's earlier edits to the first
  three.
- Nothing outstanding blocks B9: `main` is fully green, B8.1's own review
  is closed (one remediation cycle, spent).
- **Do not fold B8's or B8.1's remaining review nits into B9** - route them
  through `issues/phase-8/nits.md`, the same way B4-B8.1's were. B12 is
  where the whole outstanding table clears.

## Blockers

None currently. Both blockers this task has recorded are resolved:
`main`'s three timed owned-list goldens (fixed in B8.1, `d267a0a`) and the
driver's clipboard `write` mock (fixed in B8.1's follow-up, `dc7ed71`).
`main`'s `npm run check`, all four golden shards, and the full browser
suite are green as of `6b841f5`.

## Deferred

- See `plan.md`, "Deferred to the two excluded tickets, and to tasks of
  their own" (the consistent-storage-layer ticket, the UI/UX-redesign
  ticket, and several costed tasks of their own).
- `issues/56/context.md:38` and `issues/59/context.md:25` cite the deleted
  `docs/parity.md` (DC14) - other tasks' files; this task's orchestrator
  passes it on, untouched.
- C9's real fix (an eslint rule change that actually clears the three
  `{@render}` disables, or accepting them as permanent) is not re-opened -
  recorded as attempted-and-reverted in B2; do not retry the same option
  without reading that record first.

## Notes

- Mocks path: none.
- Screenshot findings: none.
- Cleanup performed / retained artifacts: last pre-collapse commit for this
  file is `d882707` (`git log --oneline -3 -- issues/phase-8/`); the full
  pre-compaction text of this file is there. No scratch files, probe
  branches, or manually-built `_site/` remain in the tree at any point this
  task has checked. `.claude/agents/reviewer.md` (an unstaged tools-
  frontmatter edit from another session) and `issues/56/` (an untracked
  directory, another task's) have been present throughout this task's
  sessions and are preserved untouched and unstaged, per "preserve
  unrelated working-tree changes, do not revert foreign work." Normal
  `npm run data`/`npm run build` outputs (`i/`, `dist/`) are gitignored or
  untracked as usual and regenerate on demand.
- Session end partial progress: none - `main` is at a committed, pushed,
  gate-verified boundary (`d882707`), and this compaction is itself a
  single `.md`-only, gate-exempt commit.
