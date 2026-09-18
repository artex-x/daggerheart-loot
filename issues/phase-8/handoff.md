# Handoff - TASK phase-8
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress. HEAD is the B9 review remediation commit (two
  blockers, six record corrections), one commit past `506a6ba` (B10's docs
  commit) - see "Completed" for its sha. `rtk npm run check` and `node
  tests/run-all.js app/states` are green on it - see "Verification". B1-B10
  plus this remediation are on `main` locally in full. Pushed to
  `origin/main` - see "Verification", "Push".
- Last agent: implementer (2026-09-18, B9 review remediation, one commit).
- Branch: `main`.
- Base / starting commit: `506a6ba`.
- Review: standing policy for this task (`context.md`, "Review and nit
  policy") - every phase-8 batch gets a reviewer regardless of the standard
  triggers; nits are logged immediately to `issues/phase-8/nits.md` and
  cleared in B12, not folded into whichever batch is next. B10 has not been
  reviewed yet. B9's review remediation is this pass - see "Completed" and
  `issues/phase-8/nits.md`, "From B9's review".
- No open deviations. Every fix in this pass matched the dispatch exactly;
  the record corrections routed to "Status"/"Notes" wording were checked
  against the current file and found already superseded by B10's own
  routine Status rewrite, so no separate edit was made there - see
  "Completed".
- Next batch: **B11** - equipment apostrophes (O2), per `plan.md`. Last
  batch before closeout (B12 clears the outstanding nits table).

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
- **B9 - language and format, `tests/` and `tools/`** (H1, T7, H13, H16,
  H15, T12, H11) - `0f0c73b`, `0baf86a`, `6b3f0eb`, `d660ce7`, `5602ca9`
  (five commits: the plan's four-commit split, plus a coordinator-directed
  fifth). Every (a) message and (c) comment in `tests/` and `tools/`
  (excluding `tests/app/snapshots/`) translated to English; (b) product
  literals (page labels, list/item names, button grips, book-vocabulary
  regexes, seed/typed test data) kept byte-for-byte - see "Verification"
  for the full per-file acceptance-grep breakdown. Commit 1: the four
  fs-only node suites plus `tools/build.js`/`derived.js`; extracted the
  four-copy `ok`/fail-counter helper to `tests/ok.js` (H16) for the three
  files it was free to touch (`derived.js`, `dataint.js`, `craft.js` -
  `tests/contracts.js` was already 0-Cyrillic and outside the Files list,
  left alone). H13 (em dash in English prose) and H15 (`tests/stub.js`'s
  dangling citation) were found already resolved by an earlier batch -
  verified, not re-done. Commit 2: the seven small browser suites plus
  `inventory.js`'s one real comment (the other two Cyrillic-bearing
  comments there already read as English prose quoting a product term,
  untouched); `golden.js`'s `compareGolden()` diff wording moved from
  "было"/"стало" to "want"/"got", with `golden.test.mjs`'s two assertions
  on that exact wording updated in the same commit. T12 (`sweep.js`'s
  stale "at 1180 and 360" comment) was likewise already fixed by an
  earlier batch. Commit 3: `print.js` and `states.js`, the two files
  where a Russian product string and a Russian message share a line -
  read per site; `print.js`'s SPEC object keys and `states.js`'s CASES
  array descriptions are developer-facing test vocabulary that happened
  to be Russian, not UI strings, so they were translated too. A few
  comments keep a Russian product name beside its English gloss rather
  than guessing a canonical translation not otherwise present in the file
  (`Показатель Брони`, `Призрачный Клинок`, `Самоцвет Чутья`, `Кольцо
  Тишины`). Commit 4 (H11): `.prettierignore` drops `tests/`/`tools/`;
  `eslint.config.mjs` un-ignores them plus `.claude/hooks/**` (keeping the
  rest of `.claude/`, including `.claude/worktrees/`, ignored) with a
  `disableTypeChecked` + node-globals block and targeted rule turn-offs
  for real pre-existing patterns a format-only commit could not fix
  without a hand edit (see the commit message for each rule and why); then
  `npx prettier --write tests tools` (plus `eslint.config.mjs` itself), no
  hand edits to any test/tool file. **Correction (B9 review remediation):
  the ignore-pattern pair committed here (`'.claude/**'` +
  `'!.claude/hooks/**'`) never actually un-ignored the hooks - `.claude/**`
  prunes the directory before the negation can apply, so the nine hook
  files stayed lint-dead until fixed in this pass's remediation, below.
  `d660ce7`'s own commit message repeats the same overstatement and, being
  history, cannot be corrected - this note is the correction of record.**
  Commit 5 (`5602ca9`, coordinator-
  directed): `tools/build-share-pages.js`'s last 2 Cyrillic comment lines
  translated - the module-load guard, and a second, previously-missed
  redundant comment beside an already-English one explaining the same
  newline-stripping fact; no other line in the file touched. Two
  deviations recorded, not silently resolved - reviewed and settled by
  the coordinator (see "Status"): (1) `tools/build-share-pages.js` was
  outside the plan's Files list but is translated anyway, since commit 4
  had already made it a touched path and the acceptance line covers the
  whole tree; (2) commit 4's `git diff -w --stat` acceptance line stays
  recorded as unmet - the coordinator independently confirmed the cause
  (these files were never Prettier-formatted before B9) and asked for a
  mechanical substitute proof instead of an eyeballed one; see
  "Verification".
- **B10 - the record-modal host (C6)** - `56dabbc`. `RecordHost.svelte`
  extracted; all eight `let open = $state<Record_ | null>(null)` sites
  (`AltPanel`, `ListPage`, `RecordPage`, `RollPanel`, `SearchPage`,
  `SharedListPage`, `StdPanel`, `TablesPage`) replaced with it; no deviation.
- **B9 review remediation** - (sha recorded in the follow-up docs commit,
  below, to avoid a commit citing its own hash inside its own tree). Two
  blockers: `eslint.config.mjs:24-25`'s
  `'.claude/**'` + `'!.claude/hooks/**'` ignore pair never actually
  un-ignored the hooks (`.claude/**` prunes the directory before the
  negation applies), fixed to `'.claude/*'` + `'!.claude/hooks'` -
  `npx eslint .claude` now lints exactly the nine hook files and nothing
  else, `.claude/worktrees/` still pruned; and
  `@typescript-eslint/no-unused-vars: 'off'` re-armed as `'error'` with
  `{ argsIgnorePattern: '^_', varsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_' }`, plus the one real finding it was
  hiding outside the `^_`/destructure-drop idiom (`tests/app/states.js:154`'s
  dead `page` destructure in `twoFramesPicked`) fixed by deleting it. Six
  record corrections: `plan.md`'s and `handoff.md`'s B9 entries no longer
  claim the hooks widening as already-done (`d660ce7`'s commit message
  still does and, being history, was left with a correcting note instead);
  the acceptance-grep table gained its missing `tests/app/typo.js` row (9
  lines); the commit-4 verification bullet's "141 across 15 files"
  restated as "259 findings across 34 files" with the full per-rule
  breakdown; `tools/build-share-pages.js:150`'s comment duplicating line
  149's fact deleted. The three remaining record corrections (stale
  `d882707`/`5602ca9` wording in B9's own Status/Notes text) were checked
  against the current file and found already superseded by B10's own
  routine Status rewrite - verified, not re-done. `nits.md` updated:
  B9-BL-1, B9-BL-2 and the six record corrections marked done (sha in the
  follow-up docs commit) and moved out of "Outstanding". No deviation.

## Verification

Latest pass (B9 review remediation); earlier batches' exact
commands/results are in git history per "Completed" above, and B10's own
run is preserved below.

- `npx eslint .claude/hooks/tree-key.mjs` (pre-fix, sanity check) - "File
  ignored because of a matching ignore pattern", confirming B9-BL-1 before
  changing it.
- `npx eslint .claude` (post-fix) - exactly nine files linted
  (`bash-guard`, `check-observer`, `edit-followup`, `edit-guard`, `lib`,
  `selftest`, `session-start`, `session-stop`, `tree-key`), 0 errors / 0
  warnings each; `.claude/worktrees/` not among them.
- `npx eslint .` (whole repo, post both fixes) - clean, no output.
- `rtk npm run check` (format:check, lint, typecheck, `node --check
  tools/check-site.mjs`, `npm run data`, `node tests/derived.js`, `node
  .claude/hooks/selftest.mjs`, `node --test tools/tg-preview/lib.test.mjs`,
  `node --test tools/artwork/lib.test.mjs`, `node --test
  tools/check-site.test.mjs`, `node --test tests/app/golden.test.mjs`
  17/17, `npm run test`) - green: 45 test files / 1131 tests passed;
  coverage 97.04% statements / 89.05% branches / 98.04% functions / 97.82%
  lines, unchanged from B10's own run.
- `node tests/run-all.js app/states` - green, 125.8s (the one-token
  `page` deletion in `tests/app/states.js:154`). The rest of the browser
  suites and the four golden shards are untouched by this pass - not
  re-run, per the dispatch's own gate list.
- Push: `git push origin main` - `git rev-parse HEAD origin/main` confirmed
  to agree after the push.

### B10's own verification (preserved, not re-run this pass)

- `npm run check` - green: 45 test files / 1131 tests passed; coverage
  97.04% statements / 89.05% branches / 98.04% functions / 97.82% lines,
  every `perFile` threshold met (`RecordHost.svelte` included, not printed
  by the text reporter's own full-coverage-row omission - confirmed
  present with real hit counts in `coverage-final.json` directly).
- `npm run check:built` (`npm run build && npm run smoke && npm run
  budget`) - green: build 251 modules, `dist/assets/app.js` 313.40 kB
  (gzip 93.96 kB); smoke "the built page opens from a folder"; budget
  91.3 kB within the 120 kB gzip budget.
- `node tests/app/golden.js --shard=1/4` - 28 states compared, structural
  snapshots (`dist/`) unchanged.
- `node tests/app/golden.js --shard=2/4` - 28 states compared, unchanged.
- `node tests/app/golden.js --shard=3/4` - 28 states compared, unchanged.
- `node tests/app/golden.js --shard=4/4` - 28 states compared, unchanged.
  112 states total across all four shards, none moved, no `--update` run.
- `git grep -c "let open = \$state<Record_" -- app/src` - no matches
  (acceptance line 1).
- Push: `git push origin main` - `git rev-parse HEAD origin/main` confirmed
  to agree after the push.

### B9's own verification (preserved, not re-run this batch)

`0f0c73b`..`5602ca9`; commands/results below are B9's, kept for reference.

- Commit 1: `node tests/derived.js`, `node tests/dataint.js`,
  `node tests/craft.js`, `node tests/stub.js` run directly - all green;
  `node tests/run-all.js derived,dataint,craft,stub` green (pooled);
  `rtk npm run check` green.
- Commit 2: `node --test tests/app/golden.test.mjs` green, 17/17 (including
  the two updated `compareGolden` wording assertions);
  `node tests/run-all.js app/typo,app/hues,app/contracts` green;
  `node tests/app/sweep.js 390` green;
  `node tests/app/golden.js --only="#/i/ci1"` green, no golden movement;
  `rtk npm run check` green.
- Commit 3: `node tests/run-all.js app/print,app/contracts,app/states,
  app/typo,app/hues,stub,derived,dataint,craft` - all nine green;
  `node tests/app/sweep.js 390` green; `node tests/app/golden.js
  --shard=2/4` - 28 states compared, no movement; `rtk npm run check`
  green.
- Commit 4: `npx eslint .` clean (zero errors, down from **259 findings
  across 34 files** before the config's rule turn-offs and the `.claude/**`
  ignore widening - not "141 across 15 files", which was only the
  non-`no-console` subset (259 - 118) and undercounted the file span; full
  breakdown: 118 `no-console` / 67 `explicit-module-boundary-types` / 60
  `no-require-imports` / 5 `no-regex-spaces` / 3 `no-unused-vars` / 3
  `preserve-caught-error` / 2 `no-extraneous-class` / 1 `no-useless-
  assignment`); `npx prettier --check .`
  clean; `rtk npm run check` green (format:check, lint, typecheck, data,
  every `node --test` suite including `golden.test.mjs`, `npm run test`
  45 files / 1131 tests / coverage unchanged at 96.77/89.05/97.21/97.42).
  **Re-run for real after the format commit** (not assumed carried over
  from commit 3's pre-format state): `node tests/run-all.js app/print,
  app/contracts,app/states,app/typo,app/hues,stub,derived,dataint,craft` -
  all nine green; `node tests/app/sweep.js 390` green; `node
  tests/app/golden.js --shard=2/4` - 28 states, no movement.
- Commit 5 (`5602ca9`): `node -c tools/build-share-pages.js`,
  `npx prettier --check tools/build-share-pages.js`,
  `npx eslint tools/build-share-pages.js`, and
  `node tools/build-share-pages.js` (regenerates all 1091 `i/*.html`
  stubs) all clean. `rtk npm run check` green (full run, below). The
  pooled browser subset / `sweep.js 390` / `golden.js --shard=2/4` were
  **not** re-run for this commit - it touches one file this batch's own
  gate list never runs a browser suite against (`build-share-pages.js` is
  exercised by `tests/derived.js`'s stub-drift check, part of `npm run
  check`'s `node tests/derived.js` step, and by `node
  tools/build-share-pages.js` itself, both green above); the commit-4
  green run stands for everything else, per the coordinator's instruction
  not to imply a re-run that did not happen.

### Acceptance grep (run after commit 5, the final state)

`git grep -c -P '\p{Cyrillic}'`-equivalent (a small node script walking
`git ls-files 'tests/*' 'tools/*'` excluding `tests/app/snapshots/`,
testing `/\p{Script=Cyrillic}/u` per line) over the whole tree: **14
files, 395 lines**, every one (b) - a product literal, or a comment/why-
string quoting one in an otherwise-English sentence. Full per-file
breakdown, so a reviewer can check any given line number without
re-deriving the classification:

| File | Lines (count) | What they are |
|---|---|---|
| `tests/app/contracts.js` | 94,108,111-113,118,120,124,129,132,140 (11) | A fabricated list's name, notes, item names and a price, asserted/embedded verbatim in the llms.txt-description round-trip test - the payload must match real product text to prove the encoding, not just the encoder. |
| `tests/app/driver.js` | 249-250,689 (3) | Two comments quoting the literal accessible name/UI hint word a selector or assertion has to match exactly. |
| `tests/app/golden.test.mjs` | 46-47,56,58-59,64-65,137,140,160-161 (11) | `'Печать'` (a real button label, "Print") used as realistic fixture data to test `clean()`'s joined/split-text-node logic - the specific string is representative product text, not a message about the test. |
| `tests/app/hues.js` | 171-172 (2) | Two button grips (`'Сеткой'`, `'Палаш'`) - literal control names the driver presses. |
| `tests/app/inventory.js` | 141 lines (78-123, 176-177, 188, 212, 214, 226-227, seed/LABELS/STORAGE, plus every `d.click`/`d.type`/`d.press`/`d.tick` argument and every `why:` field's quoted UI text throughout) | The plan's "138 label/seed lines" (accessible-name lookup table, list/seed data, search terms, button grips) plus 3 comments: 2 already read as English prose quoting a product/item name (`Самоцвет Чутья`, the `'Клад дракона'` example, `"меч"`), 1 keeps the Russian tier-step words beside their translated gloss. |
| `tests/app/print.js` | 23 lines (17,160-161,289-294,319,344,349,372,482,484,603,614,1097-1098,1148,1346,1521,1534,1537,1557) | Button grips, regexes asserting real book/product vocabulary printed on the card, list/seed names, and two comments quoting a product label/name with an English gloss. |
| `tests/app/states.js` | 58 lines (50-51,55,63-65,73,77-80,101,106-108,137,156-158,183,231,259,265-266,268,292,327,335,340,355,364,375,402,423,448,455,467,472,484,487,491,499,525-526,541,552,560,635,650,663,685,758,789,815,849,906,911,942) | Button/control grips, list/seed names, seeded note/typed filler text (line-count math only, content is arbitrary), a toast-text match, search terms, and comments naming a specific item/list. |
| `tests/app/sweep.js` | 47 lines (48-49,53-69,73-80,82,84-86,93-94,103,106,108,110-111,119,122,125-128,261,303,458) | The plan's "~53 selectors and page labels" - the `PAGES`/`FOCUS_WALK` route-label arrays, seed data, one button grip, one payload example, and the `/^таблица/` regex matching those same labels. |
| `tests/app/typo.js` | 51,54,57,59,60,65,106,107,108 (9) | Seed list/note/shop names and the `LABELS` table (`Фильтры`/`Добавить в список`/`Заметка`), plus one English comment quoting `"Заметка"`. |
| `tests/craft.js` | 47,67,98,110 (4) | Regexes asserting real product/book text (a source-book typo term, a stale-sentence phrase, a craft-line string) and one comment quoting a product label. |
| `tests/dataint.js` | 74,262-269,279,314,318-332 (23) | The `HEADERS`/`HEADWORDS` arrays (real book table-header words), the `а-яё`/`А-ЯЁ` Cyrillic character-class regexes (structural, operate on Russian text by definition), and one comment quoting a real example title. |
| `tests/derived.js` | 348,467,474,477,484,492,495,499,512,548,553,594-595,658,681,685-691,795 (22) | Regexes/literals asserting real product/book text (category words, tier labels, the Recall Cost label, the versatile-weapon marker, the step-word array, the README.ru.md-matching regex and the counter word fragments it pairs with) plus four comments quoting a specific product term for clarity. |
| `tools/build-share-pages.js` | 33-71,76,78-79,96-97,105,107,129,131,169,174,207 (40, was 41 before commit 5's 2-line fix, net -1 since one comment line merged) | The `COMMUNITY_RU`/`FRAME_LABEL`/`EQ_TYPE`/`TRAIT`/`RANGE`/`EQ_DT`/`EQ_CLS`/`EQ_BURDEN` vocabulary tables and the label fragments built from them - hygiene.md's "published stub text", i.e. exactly what gets written into every `i/<id>.html`; plus the site's own published name/CTA in two `<meta>`/`<title>` strings. |
| `tools/capture-share-fixture.mjs` | 45 (1) | A product label pair used as fixture data. |

### Substitute proof for commit 4's unmet `git diff -w --stat` acceptance line

Per the coordinator's instruction: a mechanical reproduction, not an
eyeballed spot-check.

1. `git archive 6b3f0eb` (commit 3's tree, pre-format) extracted into the
   session scratchpad, outside the working tree.
2. This repo's own installed Prettier run against it from the real repo
   (so plugin resolution and `.prettierrc` are the real ones, not
   defaults): `node_modules/.bin/prettier --config <repo>/.prettierrc
   --write <scratch>/tests <scratch>/tools`. Same file list reformatted,
   same set left `(unchanged)` (`tests/app/lib.js`, `tests/stub.js`,
   `tools/artwork/package.json`, `tools/tg-preview/manifest.mjs`, etc.) as
   the real commit 4 run.
3. `git archive d660ce7 tests tools` (the actual commit 4 output)
   extracted into a second scratch directory.
4. `diff -rq` between the two directories, both directions (`tests/` and
   `tools/` separately): **zero output** - no file listed as differing, no
   file listed as present on only one side.
5. File-set check: `find tests tools -type f | sort` in each directory -
   **154 files in both, identical listing** (`diff` of the two listings is
   empty).

**Result: byte-for-byte identical.** Commit 4 is exactly commit 3's tree
plus `npx prettier --write tests tools` and nothing else - there are no
additional lint-fix edits layered into any test/tool file, because every
one of commit 4's real, pre-existing lint findings (the `no-require-
imports`, `explicit-module-boundary-types`, `no-regex-spaces`, `preserve-
caught-error`, `no-extraneous-class`, `no-unused-vars`, `no-useless-
assignment` findings enumerated in the `d660ce7` commit message) was
resolved by a rule turn-off in `eslint.config.mjs`, not by editing a
file. There is no enumerated list of "lint fixes distinct from Prettier's
output" to write here, because there are none - this is a stronger result
than the coordinator's own hypothesis (which expected some).

The acceptance line stays recorded as **unmet**, not restated as met: `git
diff -w --stat` genuinely is not empty for commit 4 (spot-checked earlier
and reconfirmed by this reproduction - the non-empty diff is 100% Prettier
reflow, corroborated two independent ways now), because these files were
never Prettier-formatted before B9 and `git diff -w` cannot collapse a
line that Prettier split across several back to "no change", regardless
of language content. The byte-for-byte reproduction above is what actually
proves the commit's real contract ("no hand edits, Prettier + config
only"); the diff-size line was simply the wrong instrument for a
first-ever Prettier run on these files.

### Gates and push

- `npm run check`: green x5 (once per B9 commit, including `5602ca9`).
- `git diff -w --stat` for commit 4: confirmed still not empty; see above
  for the substitute proof and why the line is recorded unmet rather than
  forced.
- Push: `git push origin main` - see the sha this handoff records as HEAD
  above for what was pushed; `git rev-parse HEAD origin/main` confirmed to
  agree after the push (recorded here, not assumed, per this task's
  standing rule against unverified verification claims).

## Next batch (implement-ready)

- **B11 - equipment apostrophes (O2)**, last, owner-settled yes (Q8).
  Design, files, gates: `plan.md`, "B11". Rewrites `data.js` (`en`/`ende`
  of `eq` records, U+2019 -> `'`), regenerates `data.json`, `catalog.csv`,
  `i/` (untracked), possibly `docs/fixtures/share/records.json`, and
  re-records six named goldens - the one batch in this plan authorised to
  move a golden. Placed last on purpose so it never shares a diff with a
  code change.
- Nothing outstanding blocks B11: B10 shipped with no deviation, and B9's
  review remediation (this pass) shipped both blockers and all six record
  corrections with no deviation of its own.
- **Do not fold B8's, B8.1's, or B9's outstanding review nits (the rows
  still in `issues/phase-8/nits.md`, "Outstanding") into B11** - B12 is
  where the whole outstanding table clears. B10 has not been reviewed yet;
  when it is, its nits go there too.

## Blockers

None. B9's review remediation shipped both blockers and all six record
corrections with no deviation. `rtk npm run check` and `node
tests/run-all.js app/states` are green, confirmed for real, not assumed,
and the branch is pushed.

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
  gate-verified boundary (sha in the follow-up docs commit).
