# Handoff - TASK phase-8
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: **done**. Phase-8 is complete and this pass retires the
  task directory. HEAD entering this pass was `9d0f139` (docs, citing
  B12d's own sha) = `origin/main`, one commit past **B12d** (`bb20a0d`),
  B12's fourth and terminal piece. `rtk npm run check` was green on B12d
  (all suites, coverage thresholds 97.04/89.02/98.04/97.83); `npm run
  check:built`, the three named browser suites, `sweep.js 1180` and two
  golden probes were all green too - see "Verification" for every batch's
  exact commands and results, preserved in full.
- Last agent: orchestrator (2026-09-18) - closeout and retirement per
  `.claude/skills/handoff/SKILL.md`, "Retirement", and
  `.claude/prompts/orchestrate.prompt.md`, "Task closeout and cleanup",
  step 6. B12d (the last implementer batch) shipped in the prior commit,
  `bb20a0d`.
- Branch: `main`.
- Base / starting commit: `e7ce2ad` (the planning pass that designed B12
  as four consecutive pieces); the task itself opened from issue 47's
  closeout, `d5e3e5a`.
- Review: B1-B11 were each reviewed (`context.md`, "Review and nit policy
  for this task"); B12a-B12d were not, by the owner's explicit decision,
  2026-09-18 - B12 is itself the remediation stage for the eleven prior
  reviews, so reviewing it would open a second-order review -> remediate
  loop with no natural floor.
- No deviation in scope in this closeout pass. One structural defect fixed
  first, per the dispatch: `nits.md`'s `## Outstanding - B12's scope`
  heading held both the census (fully resolved, a verdict for all 103 live
  rows) and the eleven per-batch detail tables below it - 54 of their 102
  rows carried no inline resolution marker at all, so a reader opening
  "Outstanding" saw what looked like unresolved work, though every one of
  those rows **is** resolved per the census. Fixed by retitling, not by
  editing any row's content: `## Outstanding` now holds no rows (a short
  note pointing at the census); the census got its own `## Census, ...`
  heading, staying positionally where it was, as the index; the eleven
  detail tables moved under a new `## Review findings, by batch - detail
  behind the census, all resolved` heading, with a note explaining that an
  absent inline marker is not an open item. No verdict was re-litigated -
  a spot sample of detail rows against the census found no mismatch.
- NEEDS_HUMAN_CONFIRMATION: no. One check nothing in this repository can
  perform stays owed - see "Blockers", carried forward unchanged from
  B12d.
- Next batch: **none**. Phase-8 is retired; see "Next batch
  (implement-ready)" below.

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
  (RecordCard's own die-result badge folded in). Second deviation
  (B5-N7): the plan's step 1 named `subLabelOf(table)`; the shipped code
  uses `SUB_LABEL[table]` instead (`label.ts:204`) - the right call, since
  `subLabelOf` falls back to `'tables'` and would render "Wondrous Loot -
  Таблицы", failing `label.test.ts:158`, but unrecorded here until now. CI
  caught a real regression this batch's local gates missed (`craft.js`'s
  stub-staleness probe broke on multi-line descriptions) - fixed same-day
  in `571b041`. All four golden shards green throughout.
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
- **B9 review remediation** - `0686bb6`. Two blockers: `eslint.config.mjs:24-25`'s
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
  B9-BL-1, B9-BL-2 and the six record corrections marked `done 0686bb6`
  and moved out of "Outstanding". No deviation.
- **B10 review remediation** - `bfea223`. Two
  blockers: this handoff's own "B10's own verification" recorded
  `git grep -c "let open = \$state<Record_" -- app/src` as "no matches
  (acceptance line 1)" - the command does not reproduce that. It actually
  returns `app/src/components/RecordHost.svelte:2` (the host's own
  declaration at `:42` and its header comment quoting the same text at
  `:3`); `git grep -l` for the same pattern returns `RecordHost.svelte`
  alone, so the acceptance line's *intent* - no page owns its own `open`
  state any more - is met, but the recorded command output was false. The
  line is corrected in place (B10-B1). And the batch's one behaviour change
  - `RecordHost.svelte:44-49`'s close-on-navigation effect, newly on six of
  the eight pages it now runs on - shipped with zero coverage; every
  existing modal-close test closed the modal via the close button or the
  backdrop, never via a navigation. Added one jsdom test,
  `app/src/components/record.test.ts` ("closes on a real navigation, but a
  filter pick or a list mutation would not (RecordHost, C6)"): opens the
  record modal on `#/i/q1`, drives a real `router.navigate()`-shaped
  navigation (the `app.navigations`-bumping kind, not a `replace()`-shaped
  address rewrite), asserts the dialog is gone. Proved to bite: the
  effect's body was temporarily swapped for a no-op, the new test failed on
  exactly that assertion, then reverted (`git diff --stat --
  app/src/components/RecordHost.svelte` empty afterward) (B10-B2). Plus
  B10-N6: one sentence added to `docs/specs/FEATURES.md` near line 229 -
  a real navigation closes the modal, a filter pick (`replace()`-shaped)
  does not. `nits.md` updated: B10-B1, B10-B2 and B10-N6 marked
  `done bfea223` and moved out of "Outstanding"; B10-N1..B10-N5 stay there
  for B12. No deviation.
- **B11 - equipment apostrophes (O2)** - `78b13f0`. Normalised U+2019 to
  the ASCII apostrophe in the `en`/`ende` fields of `eq` records in
  `data.js`: 28 records, 30 field values, 34
  individual characters (some records share one upgrade-chain description
  text across several ids; two records, `q157` and `q350`, had both `en`
  and `ende` change). Verified by parsing the old and new `data.js` and
  diffing every field of every `eq` record: exactly those 30 fields moved,
  `items`/`alt`/`refs` are byte-identical, no id renumbered. Checked
  `docs/fixtures/share/records.json` and `llms.txt` for a U+2019 that would
  need a matching public-contract update per `CLAUDE.md` - neither carries
  one (a whole-object walk of the fixture, and a line scan of `llms.txt`),
  so no public-contract file changed; the plan's own "possibly the share
  fixture" clause did not fire. `node tools/build.js` regenerated
  `data.json`/`catalog.csv`/`i/` from the fixed source. Exactly the six
  predicted goldens moved (`_search_searched`, `_search_a_row_ticked`,
  `_tables_eq_armor`, `_tables_eq_secondary`, `_tables_eq_weapon`,
  `_tables_eq_weapon_panel_open`); all four golden shards (112 states) green
  without `--update` confirm nothing else did. No deviation.
- **B12a - the census, the three routed findings, and the record rows** -
  `e52f5de`. Census: verdict recorded for
  all 103 live rows in `nits.md` (`### Census, 2026-09-18, at e7ce2ad`),
  folding in the eight verdicts the planning pass already established plus
  one found during the sweep (`B5-N15`, already done by B9's own
  translation commit `0f0c73b`, moved to `## Done`). Landed, each proved to
  bite: `B11-BL-1` (`search.test.ts` re-points the apostrophe case at the
  query side - deleting `search.ts:71` fails the case, restoring it passes
  again, `git diff --stat -- app/src/lib/search.ts` empty afterward);
  `B11-BL-2` (`tests/dataint.js`'s text-hygiene loop gained the U+2019/U+02BC
  assertion over all four fields - proved against a fabricated record, never
  against the tree's own `data.js`); `B11-R1` (`tests/app/lib.js` gained a
  fail-closed stale-`dist/` guard, both the byte half against `data.js`/
  `data.json`/`catalog.csv` and the mtime half against `dist/assets/app.js`,
  plus one sentence in `COVERAGE.md`'s B8.1 gate-rule paragraph - all six
  proof results below). `B7-N3` (the unused `allow` parameter deleted from
  `tests/app/lib.js`'s `axe()` - `sweep.js:432` was the only caller and
  passed nothing). Thirteen record/spec rows landed as their own doc edits
  (`B4-9`, `B5-R2`, `B5-N1`, `B5-N2`, `B5-N4`, `B5-N7`, `B8-R5`, `B8-N3`,
  `B9-N10`, `B11-N1`, `B11-N4`, `B11-N5`, `B2-5` - see `nits.md`'s census
  for what each changed). Fourteen rows closed with no change (decision
  already made, or already done by an earlier batch): `B4-8`, `B4-10`,
  `B5-R3`, `B7-N5`, `B7-N6`, `B7-N7`, `B7-N8`, `B7-N14`, `B8-N5`, `B8-N8`,
  `B8.1-R1`-`B8.1-R6`, `B8.1-N4`, `B9-R1`, `B9-R3`. Five rows moved to
  `nits.md`'s "Deferred out of phase-8" with reasons (`B6-R1`, `B6-R5`,
  `B8-N7`, `B6-N4`, `B8-N6` - the DEBT.md entries for the first three land
  in `B12b`, which opens `app/src`). Deviation: none in scope; one
  discrepancy recorded (`plan.md`'s B12a step 7 undercounts the Deferred
  table by one row - see "Status").
- **B12b - production source (`app/src/**`), and the three new `DEBT.md`
  entries** - `607b252`. Review: not run
  (owner's decision, 2026-09-18 - see "Status"). Twenty-five rows landed as
  real edits, one closed with no change: `B5-N5` (`badge.test.ts`'s third
  case now ends `expectNoA11yViolations`), `B5-N6` (header count corrected
  to eleven), `B5-N8` (`whereFrom` pinned for Equipment), `B5-N9`
  (`alt.test.ts` asserts every non-top rarity bumps), `B5-N13`
  (`RecordModal.svelte` regains the toast-from-modal comment), `B5-N10/11/12`
  (three re-export comments reworded to their true reasons; `RARITIES` kept
  - confirmed real callers), `B6-R3` (`app.svelte.ts`'s `go()` only sets
  `#expectHash` when the hash actually changes, proved to bite), `B6-R4`
  (`ListPage.svelte` gained a `visibilitychange` flush beside `pagehide`,
  sharing `flushUrlSync`'s no-double-flush guard, proved to bite), `B6-N3`
  (`StorageNotice.svelte`'s comment now says two writes, not one), `B6-N5`
  (`storage.ts`'s comment corrected - `watch()` does no merge), `B7-N9`
  (`TablesPage.svelte`'s cast removed via narrowing before `untrack`),
  `B7-N10` (`SectionHead.svelte` uses a lookup, not a widening
  concatenation or an untested ternary branch), `B7-N11` (`tables.test.ts`
  moved to a role-level assertion), `B7-N12` (`shell.test.ts` pins the
  negative for a shared list's title), `B8-R3` (measured `toBlob` on this
  host - 640x640, five runs, 1032-1074ms - kept the 2000ms watchdog with
  the number recorded; `RecordActions.svelte` now logs which cause
  internally, no user-facing or `dict.ts` change), `B8-R4` (`ports.test.ts`
  gained a jsdom test on `download`; `vite.config.mts`'s exclusion comment
  now attributes the `states.js` claim to `pngOf` alone), `B8-N1`
  (`tokens.css` states D1's rejected-alternative reason inline instead of
  citing the deleted register entry), `B8-N2` (`imgFailed` reworded in both
  languages to "could not save"; `record.test.ts` updated; zero golden
  hits, confirmed before editing), `B10-N1` (`RecordHost.svelte`'s header
  comment regains the `app.hash`-rejection reasoning), `B10-N2`/`B10-N3`
  (`extra`/`index` narrowed to what every caller actually passes), `B10-N4`
  (`ListPage.svelte` gained the nested-host invariant as a comment, not the
  structural move), `B10-N5` (the StdPanel/AltPanel/RollPanel extraction
  rejection written once, pointed at from the other two), `B2-4`
  (`app.test.ts`'s comment reworded to drop the dead `TAB_LIST`
  identifier). Closed with no change: `B1-N9` - the union third argument
  touches ten-odd call sites across `SearchPage.svelte`, `TablesPage.svelte`
  (twice) and `search.test.ts` (eight), past the plan's own
  six-call-site/no-type-gymnastics budget; a doc clause on `matches` records
  the risk instead. `B5-R3` was already closed by B12a's census - confirmed
  on arrival, no further action, per `plan.md`'s own note. Plus three new
  `docs/specs/DEBT.md` entries, `D24`-`D26` (for `B6-R1`, `B6-R5`, `B8-N7`,
  deferred out of phase-8 by B12a), under a new heading - `D1`-`D23` are all
  paid off and the three existing headings are migration-framed. No row
  moved rendered output: the two user-visible string changes (`B8-N2`'s
  `imgFailed`) were checked against `tests/app/snapshots/` first and found
  zero hits, so both stayed check-gated in this piece rather than moving to
  `B12d`. No deviation.
- **B12c - harness, tooling and CI** -
  `639f7eb`. Review: not run (owner's
  decision, 2026-09-18 - see "Status"). All 21 live rows landed as real
  edits (`B4-R1`-`B4-R4`, `B4-1`-`B4-7`, `B5-R1`, `B5-N3`, `B5-N14`,
  `B6-N2`, `B8.1-N1`, `B9-R2`, `B9-N3`, `B9-N5`, `B9-N6`, `B9-N11`); `B4-10`
  and `B5-N15` needed no edit - already closed/already-done by B12a's own
  census, confirmed on arrival. **`B4-3`'s original B4 acceptance line
  ("the deploy log shows the stub-count line") stays recorded as unmet at
  B4** - GHA runs `bash -e`, not `-x`, so the step echoed its own source
  with `$stub_count` unexpanded and printed nothing on success; the
  `1091 = 1091` B4's record cited came from a local replay, never from CI.
  This piece adds the missing `echo`, which is a new instrument, not a
  retroactive proof that B4's line was ever met - see "Verification" for
  what the deploy log now actually shows. `B4-4`'s guard now reads
  `_site/catalog.csv` instead of the repo-root copy, so the collect step's
  own copy is what gets exercised (previously a byte-truncated `_site`
  copy could pass silently). `check-site.lib.mjs`'s `dirReader`/
  `fetchReader` jsdoc comments were narrowed/reworded rather than the
  retry behaviour changed (`B4-R1`, `B4-R3`); `check-site.test.mjs` now
  asserts `checks()`'s exact count (21) and exact sorted path set
  (`B4-R2`); `golden.js` dropped four unexported-and-unused symbols
  (`KEEP_KEYS`, `sigOf`, `lineFor`, `controlLine`) and `golden.test.mjs`
  gained three new node:test cases - a `serializeTree` test pinning rule
  A's elision-summary line and rule B's `namelen`/`namehash` suffix
  together (`B4-1`), a 12-child interleaved checkbox/button case proving
  `elisionOf` groups across the whole list rather than by consecutive run
  (`B4-2`), and a `slugOf` uniqueness assertion over the whole `STATES`
  inventory (`B6-N2`) - plus a fourth, a source-text call-site count for
  `golden.js`'s three `await d.addressSettled()` calls (`B8.1-N1`).
  `tests/derived.js` gained two local 404.html gates (noindex, the
  `id="app-404"` marker - `B4-5`) and an assertion that `404.html` still
  contains `SITE`'s own pathname (`B4-R4`); `.prettierignore`'s shared
  `app/index.html`/`404.html` comment now gives `404.html` its own clause
  (`B4-6`); the `check` job's bare `fetch-depth: 0` was dropped -
  `git diff --exit-code` needs no history (`B4-7`). `tests/craft.js` gained
  an assertion pinning O6's one-`<p>`-per-source-line rendering against
  record `w6` (`B5-R1`); `vite.config.mts`'s threshold comment moved to sit
  above `Button.svelte` and now names three exceptions, not one (`B5-N3`);
  `tests/run-all.js`'s weight comment dropped "the reviewer re-ran the
  packer" and `Badge.svelte`'s comment now states the real reason
  (an earlier deliberate wait for a third copy, not a missed deadline -
  `B5-N14`). `tests/contracts.js` wired to `./ok.js`, deleting its own
  inline fail counter (`B9-N3`). `B9-R2`/`B9-N5` landed as one edit across
  `eslint.config.mjs`'s four code-rule turn-offs: `no-regex-spaces` fixed
  at all 5 measured sites (`{2}`/`{4}` quantifiers replacing literal
  double-space runs), `@typescript-eslint/no-extraneous-class`'s two
  constructor-only classes rewritten as plain constructor functions,
  `no-useless-assignment`'s one dead initialiser dropped, and
  `preserve-caught-error` narrowed from a directory-wide off to three
  inline `eslint-disable-next-line` comments at its exact pre-existing
  sites - a *new* catch/rethrow in `tests/`/`tools/` is still caught now.
  `eslint.config.mjs`'s block comment reworded to the durable per-rule
  reasons instead of citing this batch's own retracted `git diff -w --stat`
  acceptance line (`B9-N6`); `@typescript-eslint/no-require-imports`
  narrowed to `files: ['tests/**/*.js', 'tools/**/*.js']` (`B9-N11`).
  `npx eslint .` clean throughout. No row moved rendered output or changed
  a public contract. No deviation.
- **B12d - the browser-gated rows and the three measurements this phase
  owes** - `bb20a0d`. Review: not run
  (owner's decision, 2026-09-18 - see `context.md`, "Review and nit policy
  for this task"). All 15 live rows landed as real edits (`B6-N1`, `B7-N1`,
  `B7-N2`, `B7-R1`, `B7-R2`, `B7-R4`, `B7-N4`, `B7-N13`, `B7-N15`, `B8-R6`,
  `B8-N4`, `B8.1-N2`, `B8.1-N3`, `B11-N2`, `B11-N3`), one commit: the
  coupled rows shipped together (`B7-N1`'s `app/src/lib/help.ts:544`
  straightened to ASCII `"Players' link"`, `B11-N2`'s
  `tests/app/inventory.js:150-151` value and false "curly apostrophe"
  comment moved with it, `B11-N3` being the coupling itself) - checked
  first against `tests/app/snapshots/` for the curly form (zero hits), so
  no golden was at risk before the edit landed, and two `--only=` probes
  confirmed it after. `tests/app/contracts.js`'s stale "28 fixtures" count
  corrected to 30 (`B6-N1`); `states.js` gained case 25 (real-Chromium
  coverage that the storage-notice dismiss button stays hit-testable while
  `<details>` is folded, `B7-N2`) and case 23's dead `.card.scrollTop`
  assertion (always 0 since `.card` became `overflow: clip`) replaced with
  a `.seldrop > .btn` count pinning the toggle AddToList.svelte's own
  selector actually finds (`B7-R2`); two dead LABELS keys deleted
  (`selected`, `importPh`, ru and en, zero readers confirmed first,
  `B7-N4`); `driver.js`'s `click()` doc comment gained its two unresolved
  ranking edges and "for a checkbox, always `tick()`" (`B7-N13`);
  `dict.ts`'s English `droppedItems` now uses an em dash, matching
  `noLists` (`B7-N15`, checked against snapshots first, zero hits - the
  string carries `%n` and is never rendered literally in a golden);
  `print.js`'s D20 block gained two comments naming the seed-persistence
  and toast-flake hazards rather than "fixing" either away, since neither
  has a cheap real fix (`B8-R6`); `states.js:390`'s stale "before B12"
  citation corrected to "before B8" (`B8-N4`); `states.js` case 24's
  comment re-pointed at `driver.js`'s own current `prepare()` reasoning
  instead of the retired parity-era one (`B8.1-N2`); `contracts.js` gained
  an `await d.addressSettled()` before the owned-list hash read, with a
  comment (`B8.1-N3`). `Shell.svelte`'s P10 comment corrected from "fixed"
  to `position: sticky` (`B7-R1`), and the three owed measurements were
  taken for real (numbers below, "Verification"): `sweep.js 1180` (English
  axe path exercised - clean, both languages); the scroll-to-bottom
  position of `.selbarwrap` against `.foot` at 1180 and 375, with a
  selection open (confirms the bar rests above the footer with a ~20px
  gap, never overlapping it, and that a selection pushes the footer down
  by exactly the bar's own height); and the 44x44 hit-target overlap of
  `.note-x::after`/`.warn-x::after` against their editable neighbours -
  both reproduce (7px into the note textarea, 2px above the notice box),
  so `docs/specs/DEBT.md` gained `D27` with the measurement, per the
  plan's own instruction: no redesign, no shrink below 44px, routed to the
  UI/UX ticket. One check nothing in this repository can perform - whether
  `.card-media`'s focus ring draws inside `.card` at both `.full` and
  `.compact` - stays owed, recorded under "Blockers" as an owner/human
  action, not silently closed. `nits.md`'s "Outstanding" table is empty:
  every row this piece did not land was already `done`/`closed`/Deferred
  by B12a-B12c. No deviation.

## Verification

Latest pass (B12d, sha in "Completed" above); earlier passes' exact
commands/results are in git history per "Completed" above, and the B9-
remediation, B10 and B10-remediation runs are preserved below.

### B12d's own verification

**The three measurements this phase owes, exact commands and results:**

1. **`node tests/app/sweep.js 1180`** (English axe path exercised - no
   `--only`/lang argument means both `ru` and `en`, per `sweep.js`'s own
   header comment; CI splits this same width into two shard rows for
   balance, but the single-process run here drives both languages,
   English included) - `npm run build` first (dist/ had gone stale after
   the `app/src` edits below), then: `page sweep (dist/): clean at 1180
   (ru, en)`. Green, including axe on English - this specific command had
   never been run as its own gate before (only the per-language CI shard
   rows and other widths had).
2. **The scroll-to-bottom position of `.selbarwrap` against `.foot`, with
   a selection, at 1180 and 375** - a scratch probe (session scratchpad,
   not committed) against `dist/` using `tests/app/lib.js`'s own `fresh()`:
   opened `#/tables/core_item`, ticked one row, `window.scrollTo(0,
   document.body.scrollHeight)`, read both elements' `getBoundingClientRect()`
   after a 150ms settle.
   - At 1180: page height with no selection **5885px**, with one **5938px**
     - a **53px** difference, exactly `.selbarwrap`'s own measured height
     (`h: 53`) at that width. At max scroll, `.selbarwrap`'s bottom
     (704.09-757.09) sits **above** `.foot`'s top (777.09-900.09) with a
     ~20px gap - it rests above the footer, it does not overlap it.
   - At 375: the same shape - `.selbarwrap` wraps to more lines (`h: 137`,
     top 480.31-bottom 617.31) and still sits above `.foot` (top 637.31),
     a ~20px gap.
   - Both widths confirm `Shell.svelte`'s corrected comment (`B7-R1`): the
     bar is `position: sticky`, not fixed; opening a selection pushes the
     footer down in flow by exactly the bar's own height; at maximum
     scroll the bar rests above the footer rather than overlapping it.
3. **`B7-R4`'s 44x44 hit-target overlap** - a second scratch probe, same
   method: computed each button's own extended `::after` rect from its
   `getBoundingClientRect()` (centred on the button, 44x44, matching the
   CSS `left:50%;top:50%;transform:translate(-50%,-50%)` shape) and
   compared it against the neighbour's own rect, at 1180x900.
   - `.note-x::after` (`ListPage.svelte`, the note clear button, on a list
     seeded with a list-level note so `<details class="lnote">` opens by
     default) extends **7px** into the note `<textarea>` immediately below
     it.
   - `.warn-x::after` (`StorageNotice.svelte`, the notice dismiss button,
     on `#/lists` with no seed) extends **2px** above `.warn`'s own top
     edge.
   - Both overlaps **reproduce** (smaller than B7-R4's own CSS-only
     estimate of ~12px/~3px, but real). Per the plan's own instruction:
     not redesigned, not shrunk below 44px. `docs/specs/DEBT.md` gained
     `D27` with this measurement, routed to the UI/UX ticket for the real
     fix.

**The coupled rows, string-vs-snapshot check before editing** (per the
plan's own rule, "A user-visible string is a golden question before it is
an edit"): `git grep -F 'Players’' -- tests/app/snapshots` (via a small
node script walking the snapshot files for the exact U+2019 string) -
**zero hits** in all 112 golden files before either `help.ts:544` or
`inventory.js:150-151` was touched, so the row was check-gated and stayed
in this piece rather than moving to a re-record. `app/src/lib/help.test.ts`
pinned the old curly form directly (`toEqual(['Players’ link', ...])`) -
found by the full gate, not by the pre-check - and updated to the ASCII
value in the same commit, since it is the one place beyond `help.ts` itself
that names the string literally.

**Full gate run, in order:**

- `npm run build` (after the `app/src` edits: `help.ts`, `dict.ts`,
  `Shell.svelte`) - green, 251 modules, `dist/assets/app.js` 313.68 kB.
- `rtk npm run check` - first attempt caught two things the pre-check
  passes had not: `tests/app/states.js` needed `npx prettier --write`
  (one reflow, the replaced `scrollTop`/`toggleCount` block), and
  `app/src/lib/help.test.ts:149` failed on the now-straightened
  `Players' link` (`AssertionError: expected [ 'Players\' link', ... ] to
  deeply equal [ 'Players’ link', ... ]`) - fixed in place, both in the
  same pass, no other file touched. Second run: green - `format:check`,
  `lint`, `typecheck` (551 files, 0 errors/warnings), `node --check
  tools/check-site.mjs`, `npm run data`, `node tests/derived.js`, `node
  .claude/hooks/selftest.mjs` (430/430), every `node --test` suite
  (`tools/tg-preview/lib.test.mjs` 110/110, `tools/artwork/lib.test.mjs`
  26/26, `tools/check-site.test.mjs` 10/10, `tests/app/golden.test.mjs`
  21/21), `npm run test` - 45 test files / **1138** tests passed
  (unchanged from B12c - this piece added no vitest test beyond the one
  string fix), coverage 97.04% statements / 89.02% branches / 98.04%
  functions / 97.83% lines, unchanged.
- `npm run build` again (the check's own `npm run data` step can touch
  `data.json`/`catalog.csv` mtimes even when content is unchanged) - green.
- `npm run check:built` (`npm run build && npm run smoke && npm run
  budget`) - green: build 251 modules; smoke "the built page opens from a
  folder"; budget 91.4 kB within the 120 kB gzip budget.
- `node tests/run-all.js app/states,app/print,app/contracts` - all three
  green: `app/contracts` 263.3s, `app/print` 178.8s, `app/states` 118.7s
  (includes the new case 25 and the replaced case 23 assertion).
- `node tests/app/sweep.js 1180` - green, both languages (measurement 1
  above).
- `MSYS_NO_PATHCONV=1 node tests/app/golden.js --only="#/lists"` - 21
  states compared, `structural snapshots (dist/): unchanged`.
- `MSYS_NO_PATHCONV=1 node tests/app/golden.js --only="#/l/"` - 6 states
  compared, `structural snapshots (dist/): unchanged`. Two probes, per the
  gate list, both covering the routes the coupled string change and the
  new case 25 touch; neither moved, so all four golden shards were not
  required (`COVERAGE.md`'s B8.1 gate rule).
- `git status --short` (final, before staging): `app/src/components/
  Shell.svelte`, `app/src/lib/dict.ts`, `app/src/lib/help.test.ts`,
  `app/src/lib/help.ts`, `docs/specs/DEBT.md`, `tests/app/contracts.js`,
  `tests/app/driver.js`, `tests/app/inventory.js`, `tests/app/print.js`,
  `tests/app/states.js` modified - exactly the files "Completed" above
  names; `.claude/agents/reviewer.md` (unstaged, foreign), `issues/56/`
  (untracked, foreign) and `remediate` (untracked, foreign, 0 bytes)
  untouched and unstaged, per "preserve unrelated working-tree changes" -
  staged explicitly by path, not `git add -A`.
- Push: `git push origin main` (`bb20a0d`) - `git rev-parse HEAD
  origin/main` both `bb20a0d` afterward.

### B12c's own verification

- `npx eslint .` (before wiring the check-gate) - clean, no output, after
  all four rule turn-offs were replaced (`no-regex-spaces`/
  `no-extraneous-class`/`no-useless-assignment` fixed at every measured
  site; `preserve-caught-error` narrowed to three inline
  `eslint-disable-next-line` comments). The first attempt at the three
  inline disables put the directive on its own multi-line comment block,
  five lines above the `throw new Error(` it was meant to cover -
  `eslint-disable-next-line` only covers the *literal* next line, and a
  multi-line `//` comment block is not the statement below it, so the
  directive landed on a comment line (an "unused directive" warning) while
  the real violation still fired three lines later. Fixed by moving the
  directive comment to be the last line immediately before the `throw`,
  with the explanation above it; re-run clean.
- `npx prettier --check .` - 3 files flagged (`tests/app/golden.test.mjs`,
  `tests/craft.js`, `tests/derived.js`), `npx prettier --write` on those
  three, re-checked clean.
- `node --test tests/app/golden.test.mjs` - 21/21 passed, including the
  three new cases (`serializeTree`, the interleaved-signature `elisionOf`
  case, `slugOf` uniqueness) and the `addressSettled()` call-site count.
- `node --test tools/check-site.test.mjs` - 10/10 passed, including the
  rewritten "checks() shape" case (exact count 21, exact sorted path set).
- `node tools/build.js` then `npm run build` (dist/ was stale from before
  this piece's edits) then `node tests/run-all.js
  contracts,derived,dataint,craft,stub` - all five green (`stub` failed
  once first, on B11-R1's own stale-`dist/` guard, correctly - `npm run
  build` had not run yet after the data regeneration; green on the retry).
- `rtk npm run check` (bare, foreground) - green, twice (the second run
  after the `addressSettled()` call-site test was added, which touched a
  covered path and had to re-arm the gate): format:check, lint, typecheck
  (551 files, 0 errors/warnings), `node --check tools/check-site.mjs`,
  `npm run data`, `node tests/derived.js` (including the two new 404.html
  assertions and the SITE-pathname assertion), `node
  .claude/hooks/selftest.mjs` (430/430), every `node --test` suite
  (`tools/tg-preview/lib.test.mjs` 110/110, `tools/artwork/lib.test.mjs`
  26/26, `tools/check-site.test.mjs` 10/10, `tests/app/golden.test.mjs`
  21/21), `npm run test` - 45 test files / **1138** tests passed
  (unchanged from B12b - this piece added no vitest tests), coverage
  97.04% statements / 89.02% branches / 98.04% functions / 97.83% lines,
  unchanged from B12b.
- `git status --short` (final, before staging): exactly the 21 files
  listed in "Completed" above modified; `.claude/agents/reviewer.md`
  (unstaged, foreign), `issues/56/` (untracked, foreign) untouched and
  unstaged, per "preserve unrelated working-tree changes" - staged
  explicitly by path, not `git add -A`.
- Push: `git push origin main` - `git rev-parse HEAD origin/main` both
  `639f7eb` afterward.
- **CI watch, the piece's own required instrument**: `gh run watch
  35364353967 --exit-status` on push `97dc875..639f7eb` - **every job
  green**: `secrets` (8s), `browser (1)` (5m44s), `browser (2)`, `browser
  (3)` (5m34s), `browser (4)` (3m44s), `audit` (23s), `check` (2m6s),
  `deploy` (53s). `gh run view 35364353967 --json conclusion,status` -
  `{"conclusion":"success","status":"completed"}`.
- **What the deploy log actually shows for the stub-count line** (the one
  instrument that can see B4-3's `echo` and B4-4's `_site/catalog.csv`
  read land, per this piece's own gate requirement): `gh run view
  35364353967 --job 105664973141 --log`, step "Nothing private slipped in,
  and nothing public left out", prints
  `stub count: 1091, catalog.csv data rows: 1091` - a real number from a
  real CI run, not the local replay B4's own record cited. **B4's original
  acceptance line ("the deploy log shows the stub-count line") stays
  recorded as unmet at B4** in this file's "Completed" entry for B4 (not
  edited here) - this run proves the *new* instrument this piece added,
  not a retroactive satisfaction of B4's own line.

### B12b's own verification

**Proof obligations for the two behaviour fixes, exact results, in order
run** (every other row is a comment, a type narrowing, a test addition or a
doc clause - no behaviour to prove in the failing direction, per this
task's review-declined policy):

- `B6-R3` (`app/src/state/app.test.ts`, "does not swallow a later
  Back/Forward landing on go()'s own unchanged target"): a purpose-built
  `quirkyRouter` double (announces only on an actual hash change, unlike
  `memoryRouter`'s unconditional announce) drives `go('#/lists')` twice
  (the second a no-op address-wise) then fires a genuine hashchange for the
  same address. `npx vitest run app/src/state/app.test.ts` green with the
  `hash !== this.env.router.hash()` guard in place (70/70). Reverted the
  guard to the unconditional `this.#expectHash = hash;` - re-run:
  **1 failed**, `expected 2 to be 3` on exactly the new case (the
  Back/Forward-equivalent `fire()` call was swallowed as a false echo).
  Restored the guard - re-run: green again (70/70). `git diff --stat --
  app/src/state/app.svelte.ts` after restoring shows only the intended
  guard + comment.
- `B6-R4` (`app/src/components/listPage.test.ts`, "flushes a pending edit
  on visibilitychange, once, even if pagehide also fires"): types into a
  list's note field (inside the 150ms debounce window), stubs
  `document.visibilityState` to `'hidden'` and dispatches
  `visibilitychange`, asserts `router.replace` fired synchronously with the
  new value, then dispatches `pagehide` and asserts `replace` was **not**
  called a second time. `npx vitest run
  app/src/components/listPage.test.ts` green with the listener in place
  (59/59). Removed the `visibilitychange` listener (kept `pagehide`) -
  re-run: **1 failed**, `expected "replace" to be called 1 times, but got 0
  times` on exactly the new assertion. Restored the listener - re-run:
  green again (59/59).

**Individually verified test files, before the full gate** (each run
green in isolation as the edit landed): `app/src/lib/alt.test.ts`,
`app/src/lib/label.test.ts`, `app/src/components/badge.test.ts`,
`app/src/components/tables.test.ts`, `app/src/components/shell.test.ts`,
`app/src/components/record.test.ts`, `app/src/ports/ports.test.ts`
(the new `download` test).

**`B8-R3`'s measurement**, a real browser (Claude Browser pane, a
throwaway `python -m http.server` over the repo's own `img/` so the canvas
is not tainted the way `file://` would taint it): loaded `img/f95.webp`
(640x640, 98 KB, the largest catalogue art file by bytes), drew it to a
canvas, ran `canvas.toBlob(..., 'image/png')` five times with
`performance.now()` around each call - `1074.1, 1051.9, 1040.3, 1032.6,
1045.2` ms. `image.ts`'s watchdog comment now records this and the
decision to keep 2000ms (roughly double the worst measured run) rather
than raise it.

**Full gate run:**

- `rtk npm run check` - green (after the concurrent-session contention
  below cleared): `format:check`, `lint`, `typecheck` (551 files, 0
  errors/warnings), `node --check tools/check-site.mjs`, `npm run data`,
  `node tests/derived.js`, `node .claude/hooks/selftest.mjs` (430/430,
  once the other session's in-flight edit settled - see "Notes"), every
  `node --test` suite (`tools/tg-preview/lib.test.mjs`,
  `tools/artwork/lib.test.mjs`, `tools/check-site.test.mjs`,
  `tests/app/golden.test.mjs` 17/17), `npm run test` - 45 test files /
  **1138** tests passed (+7 over B12a's 1131: the two proof-of-bite cases
  plus five coverage-only additions), coverage 97.04% statements / 89.02%
  branches / 98.04% functions / 97.83% lines, every `perFile` threshold
  met including `SectionHead.svelte` (a `Record<2\|3,'h2'\|'h3'>` lookup
  chosen over a ternary specifically to avoid a new, permanently
  half-covered branch - see `nits.md`, `B7-N10`).
- `npm run check:built` - **not run**, per this piece's own gate rule: no
  `.svelte` template change and no CSS declaration landed (every `.svelte`
  edit was a `<script>` change, a type narrowing, or an HTML comment; the
  one `tokens.css` edit changed a comment, not a declaration).
- `node tests/app/golden.js --only=<sub>` probes - **not run**: the
  string-vs-snapshot grep for `B8-N2`'s changed strings found zero hits in
  `tests/app/snapshots/`, so no row moved to `B12d`.
- `git status --short` (final, before staging): every file listed in
  "Completed" above modified; `.claude/agents/reviewer.md` (unstaged,
  foreign), `issues/56/` (untracked, foreign) and `remediate` (an empty,
  untracked file from the same foreign session, 0 bytes) untouched and
  unstaged, per "preserve unrelated working-tree changes" - `remediate` is
  new since this task's own preflight and is not this piece's to explain or
  remove.
- Push: `git push origin main` after the sha-citation follow-up
  (`24297a8`), so both commits landed in one push per this task's own
  convention; `git rev-parse HEAD origin/main` confirmed both equal
  `24297a8` afterward.

**A tree-contention note, not a defect in this piece's own changes**: a
second, concurrent session was actively editing `.claude/hooks/bash-guard.mjs`,
`check-observer.mjs` and `selftest.mjs` (plus `.claude/README.md` and three
`.claude/prompts/*.md` files) while this piece's gate ran - confirmed by
file mtimes moving forward between consecutive `npm run check` attempts
(16:55-17:01) and by `.claude/hooks/selftest.mjs`'s own pass count changing
between runs (420 -> 430) with no edit from this session. Two runs failed
transiently on that account: once on a stale self-test assertion
(`#119 canonical check`), once on a formatting warning in
`.claude/hooks/selftest.mjs` itself - neither file is this piece's to fix
(out of scope, and actively being edited elsewhere), so neither was
touched; a third attempt, after the other session's edit settled, passed
clean. This is exactly the hazard `CLAUDE.md`'s "one session at a time"
rule names - recorded for the orchestrator, not resolved here.

### B12a's own verification

**The three proof obligations, exact results, in order run:**

- `B11-BL-1` (`app/src/lib/search.test.ts`): `npx vitest run
  app/src/lib/search.test.ts` green with the fix in place (25/25). Deleted
  `app/src/lib/search.ts:71` (the `.replace(/[’ʼ]/g, "'")` line) - re-run:
  **1 failed / 24 passed**, `AssertionError: expected [] to include 'q80'`
  on exactly the new case. Restored the line - re-run: green again (25/25).
  `git diff --stat -- app/src/lib/search.ts` after restoring: empty.
- `B11-BL-2` (`tests/dataint.js`): `node tests/dataint.js` green
  ("data: every invariant holds") with the new assertion in place. Proved
  to bite against a fabricated record (`{ id: 'zzTEST', en: 'Keeper’s
  Staff', ... }`) run through the same `ok()`/`failed()` harness from
  `tests/ok.js`, never against the tree's own `data.js`: `FAIL zzTEST.en:
  typographic apostrophe`, `failed()` returned `1`.
- `B11-R1` (`tests/app/lib.js`), all six results, in order:
  1. **Silent** (correct tree): `npm run build` (251 modules, `dist/data.js`
     661.33 kB, `dist/assets/app.js` 313.40 kB), then `node tests/run-all.js
     app/typo` - `ok app/typo dist/: fonts and scale 79.4s`, no guard
     message.
  2. **mtime-fires**: `touch app/src/lib/search.ts`, re-run `app/typo` -
     `FAIL app/typo dist/: fonts and scale 0.4s`, log: `dist/ is stale
     (mtime check, dist/assets/app.js) - run npm run build first`.
  3. **mtime-restored**: `npm run build`, re-run `app/typo` - green,
     `79.7s`.
  4. **byte-fires**: `printf 'X' >> dist/data.js` (Bash, not the Edit tool -
     `dist/` is build output the Edit-tool guard blocks writes to), re-run
     `app/typo` - `FAIL`, log: `dist/ is stale (byte check, data.js) - run
     npm run build first`.
  5. **byte-restored**: `npm run build`, re-run `app/typo` - green, `79.8s`.
  6. **Final green**: one more `app/typo` run with nothing further changed -
     `ok app/typo dist/: fonts and scale 79.3s`.
  `COVERAGE.md`'s B8.1 gate-rule paragraph gained the one sentence
  (narrowing 3's placement, per the planner's decision).

**Full gate run, after all three proofs and the record/spec edits:**

- `rtk npm run check` - green: format:check, lint, typecheck, `node --check
  tools/check-site.mjs`, `npm run data`, `node tests/derived.js`, `node
  .claude/hooks/selftest.mjs`, every `node --test` suite including
  `golden.test.mjs` 17/17, `npm run test`.
- `node tests/run-all.js contracts,derived,dataint,craft,stub` - all five
  green (the dispatch's verification list named
  `contracts,derived,dataint,craft,stub`; run as one pooled call).
- `npm run build` - green, as the final rebuild after the byte-half proof
  (see above); `dist/` left in a correct, non-stale state.
- `node tests/run-all.js app/typo` - green (the final green of the six
  proof results above; not re-run a second time beyond that).
- `git status --short` (final): `app/src/lib/search.test.ts`,
  `tests/app/lib.js`, `tests/dataint.js`, `docs/specs/{COVERAGE,FEATURES,
  META}.md`, `.claude/README.md`, `issues/phase-8/{nits,handoff,context,
  plan}.md` modified; `app/src/lib/search.ts` unmodified (restored);
  `dist/` untracked as always (gitignored, rebuilt); `.claude/agents/
  reviewer.md` (unstaged, another session's) and `issues/56/` (untracked,
  another task's) untouched and unstaged, per "preserve unrelated
  working-tree changes."
- Push: `git push origin main` after the sha-citation follow-up
  (`4786ea9`), so both commits landed in one push per this task's own
  convention (B9/B10/B11 all followed it); `git rev-parse HEAD
  origin/main` confirmed both equal `4786ea9` afterward.

### B11's own verification

- `node -e '...'` (a scratch script, not committed): parsed old (`git show
  6dee769:data.js`) and new `data.js` as JSON and diffed every field of
  every `eq` record - exactly 30 fields differ, all `en`/`ende`, in 28
  records; `items`/`alt`/`refs` byte-identical (`JSON.stringify` equal); no
  id renumbered (same length, same id at each index).
- Char-level count: old `data.js` held 34 U+2019 code points, all inside
  `eq` `en`/`ende` field values (verified by walking the parsed tree and
  independently by scanning raw-text positions); new `data.js` holds 0.
- `docs/fixtures/share/records.json` - a whole-object walk for U+2019 in
  every string field - no match. `llms.txt` - a full-file scan for U+2019 -
  no match. Neither needed the `CONTRACTS.md`/`tests/contracts.js`/
  `llms.txt` update the dispatch's contingency described.
- `node tools/build.js` - `data.json` 646 KB, `catalog.csv` 575 KB, 1091
  `i/*.html` stubs written; `git diff --stat -- catalog.csv data.json` - 28
  rows changed in `catalog.csv` (one per affected record), `data.json`'s
  one line changed - consistent with the 28-record scope.
- `npm run build` (needed before a golden run reflects the new data - the
  golden driver compares against `dist/`, and `npm run check`'s own
  `npm run data` step does not run `vite build`) - green, `dist/data.js`
  661.33 kB.
- `rtk npm run check` - green: format:check, lint, typecheck,
  `node --check tools/check-site.mjs`, `npm run data`, `node
  tests/derived.js`, `node .claude/hooks/selftest.mjs`, `node --test
  tools/tg-preview/lib.test.mjs`, `node --test tools/artwork/lib.test.mjs`,
  `node --test tools/check-site.test.mjs`, `node --test
  tests/app/golden.test.mjs` 17/17, `npm run test` - 45 test files / 1132
  tests passed, coverage 97.04% statements / 89.05% branches / 98.04%
  functions / 97.82% lines, unchanged from B10 review remediation's run.
- `node tests/run-all.js dataint,derived,craft,stub` - all four green
  (`stub` 3.8s, `dataint` 1.8s, `derived` 0.6s, `craft` 0.4s).
- `node tests/app/golden.js --only=search --update` then `--only=eq_
  --update` (after `npm run build` refreshed `dist/`) - captured 9 and 8
  states respectively; `git status` afterward showed exactly the six
  predicted files modified (`_search_searched`, `_search_a_row_ticked`,
  `_tables_eq_armor`, `_tables_eq_secondary`, `_tables_eq_weapon`,
  `_tables_eq_weapon_panel_open`) - spot-checked with `git diff`:
  `_search_a_row_ticked.txt`/`_search_searched.txt` show "Monett's Cloak"
  losing its U+2019 in the rendered name and "Bladefare Armor"'s
  `namehash` changing (its `ende` text moved, inside the elided interior so
  only the hash, not the visible text, differs there).
- `node tests/app/golden.js --only=search` and `--only=eq_` (no
  `--update`, re-run after the record) - both green, no further movement.
- `npm run check:built` (`npm run build && npm run smoke && npm run
  budget`) - green: build 251 modules, `dist/assets/app.js` 313.40 kB
  (gzip 93.96 kB); smoke "the built page opens from a folder"; budget
  91.3 kB within the 120 kB gzip budget.
- `node tests/app/golden.js --shard=1/4` - 28 states, unchanged.
- `node tests/app/golden.js --shard=2/4` - 28 states, unchanged.
- `node tests/app/golden.js --shard=3/4` - 28 states, unchanged.
- `node tests/app/golden.js --shard=4/4` - 28 states, unchanged.
  112 states total across all four shards; combined with the two `--only=`
  probes above, exactly six golden files carry a working-tree modification
  (`git status --short tests/app/snapshots/`) - the six predicted, no more.
- `git status --short` (final) - `data.js`, `data.json`, `catalog.csv` and
  the six goldens modified; `i/` untracked as always;
  `.claude/agents/reviewer.md` (unstaged, another session's) and
  `issues/56/` (untracked, another task's) untouched, per "preserve
  unrelated working-tree changes."
- Push: `git push origin main` - `git rev-parse HEAD origin/main` confirmed
  to agree after the push.

### B10 review remediation's own verification (preserved, not re-run this pass)

- `git grep -c "let open = \$state<Record_" -- app/src` (re-run for real,
  B10-B1) - `app/src/components/RecordHost.svelte:2`, not "no matches" as
  B10's own handoff wrongly recorded (corrected in place below, under
  "B10's own verification"). Two hits, both in that one file: the header
  comment quoting the pattern (`:3`) and the host's own declaration
  (`:42`). `git grep -l` for the same pattern - `RecordHost.svelte` alone.
  Acceptance line 1's intent (no *page* owns its own `open` any more) is
  met.
- New test proved to bite (B10-B2): `app/src/components/RecordHost.svelte`'s
  close-on-navigation effect body was temporarily swapped for a no-op; the
  new `record.test.ts` test ("closes on a real navigation, but a filter
  pick or a list mutation would not (RecordHost, C6)") then failed, on
  exactly the dialog-still-present assertion it exists to guard; reverted,
  `git diff --stat -- app/src/components/RecordHost.svelte` empty
  afterward.
- `rtk npm run check` (format:check, lint, typecheck, `node --check
  tools/check-site.mjs`, `npm run data`, `node tests/derived.js`, `node
  .claude/hooks/selftest.mjs`, `node --test tools/tg-preview/lib.test.mjs`,
  `node --test tools/artwork/lib.test.mjs`, `node --test
  tools/check-site.test.mjs`, `node --test tests/app/golden.test.mjs`
  17/17, `npm run test`) - green: 45 test files / **1132** tests passed (+1,
  the new test), coverage 97.04% statements / 89.05% branches / 98.04%
  functions / 97.82% lines, unchanged.
- No golden shard, `check:built`, or browser suite is implicated by this
  pass (one test file, one spec sentence, task documents - no rendered
  output touched) and none was re-run, per the dispatch's own gate list.
- Push: `git push origin main` - `git rev-parse HEAD origin/main` confirmed
  to agree after the push.

### B9 review remediation's own verification (preserved, not re-run this pass)

- `npx eslint .claude/hooks/tree-key.mjs` (pre-fix, sanity check) - "File
  ignored because of a matching ignore pattern", confirming B9-BL-1 before
  changing it.
- `npx eslint .claude` (post-fix) - exactly nine files linted
  (`bash-guard`, `check-observer`, `edit-followup`, `edit-guard`, `lib`,
  `selftest`, `session-start`, `session-stop`, `tree-key`), 0 errors / 0
  warnings each; `.claude/worktrees/` not among them.
- `npx eslint .` (whole repo, post both fixes) - clean, no output.
- `rtk npm run check` - green: 45 test files / 1131 tests passed; coverage
  97.04% statements / 89.05% branches / 98.04% functions / 97.82% lines,
  unchanged from B10's own run.
- `node tests/run-all.js app/states` - green, 125.8s (the one-token
  `page` deletion in `tests/app/states.js:154`). The rest of the browser
  suites and the four golden shards were untouched by that pass - not
  re-run, per that pass's own gate list.
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
- `git grep -c "let open = \$state<Record_" -- app/src` -
  **correction (B10 review remediation): this line was wrong as recorded.**
  The command actually returns `app/src/components/RecordHost.svelte:2`, not
  "no matches" - two hits, both in that one file: line 3 (the header comment
  quoting the pattern) and line 42 (the host's own `let open =
  $state<Record_ | null>(null)` declaration). `git grep -l` for the same
  pattern returns only `RecordHost.svelte`. The acceptance line's intent -
  no *page* owns its own `open` state any more - is met; the command as
  literally written is not the falsifiable proof of it the handoff claimed.
  See "B10 review remediation" below for the fix.
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

None. Phase-8 is complete and this task directory is retired in this pass.
`nits.md`'s `## Outstanding` heading holds no rows (see "Status"); every
batch B1-B12d shipped (see "Completed"). This section used to carry B12d's
implement-ready brief; it is collapsed now that B12d has shipped and is
recorded there instead, per `.claude/skills/handoff/SKILL.md`, "Collapse
actions", "a shipped batch's implement-ready brief collapses to its outcome
and commit." A future phase-8-adjacent need opens its own task rather than
reopening this one - `.claude/skills/handoff/SKILL.md`, "Retirement":
"Never retire a directory the human still calls active" (and, symmetrically,
never un-retire one either).

## Blockers

**One check nothing in this repository can perform - an owed owner/human
action, not silently closed.** Confirming `.card-media`'s focus ring is
drawn *inside* `.card` at both `.full` and `.compact` needs a human eye or
a screenshot: `focusWalk` (`tests/app/sweep.js`) reads computed style,
which still reports a ring an ancestor clips; goldens read structure, not
paint; axe checks neither. This is B8's own `BL-1` finding (`nits.md`,
"From B8's review") - the fix (`.card-media:focus-visible { outline-offset:
-2px }`, restored `480c380`) was made by reasoning about `.card`'s
`overflow: clip`, not by any instrument seeing it, and B12a/b/c/d have
found no new instrument since. **What to look at**: `#/i/ci1` (`.full`
layout, the record page) and any tables/search page's tile row (`.compact`
layout, e.g. `#/tables/core_item`), at any width - Tab to the card's own
picture/media control (`.card-media`, a real `<button>`) and confirm the
gold focus ring paints entirely inside the card's own border, not clipped
on any side. This is the fourth phase-8 finding of the class "a check that
stayed green while measuring nothing" (context.md, "Review and nit policy
for this task") - recording it here rather than inventing a fourth false
verification is the point.

B12d itself shipped with no deviation in scope - see "Completed" and
"Verification". `rtk npm run check` is green (twice - the second run after
the Prettier reflow and the `help.test.ts` fix were applied). `npm run
check:built`, the three named browser suites, `sweep.js 1180` and both
golden probes are all green too - see "Verification".

## Deferred

- **Five register rows this planning pass moves out of B12's scope**, each
  with a reason the owner can overrule in one line - full table in
  `nits.md`, "Deferred out of phase-8, with reasons": `B6-R1` (the `.bad`
  second-corruption backup - the consistent-storage ticket already owns
  ".bad-key recovery beyond a notice"), `B6-R5` (telling a damaged link
  apart from one whose items are all gone - a new user-visible outcome, so
  a `dict.ts` pair, a spec sentence and possibly an `inventory.js` state
  plus a seeded golden), `B8-N7` (smooth scroll under `reduce` - there is no
  `matchMedia` anywhere in `app/src` today, so the boundary-respecting fix
  needs a new port surface), `B6-N4` (product copy, the owner's voice) and
  `B8-N6` (a policy edit to a rule the owner approved under Q5). The first
  three are live defects and got `docs/specs/DEBT.md` entries (`D24`-`D26`)
  in **B12b**, so they survive this task directory's retirement; the last
  two are taste and policy and get none.
- **A sixth row, found and measured by B12d itself**: `B7-R4`'s 44x44
  overlap (`.note-x::after` into the note textarea, `.warn-x::after` above
  the notice box) reproduced when measured - 7px and 2px respectively at
  1180x900. Not redesigned and not shrunk below 44px, per the plan's own
  instruction; `docs/specs/DEBT.md` gained `D27` with the measurement,
  routed to the UI/UX ticket for the real fix.
- **One check nothing in this repository can perform, still owed** - see
  "Blockers" above for the full record (route, widths, and why no
  instrument here can see it).
- See `context.md`, "Deferred to the two excluded tickets, and to tasks of
  their own" (the consistent-storage-layer ticket, the UI/UX-redesign
  ticket, and several costed tasks of their own) - moved there from
  `plan.md` at this pass's retirement.
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
  task has checked. A measurement helper for `B8-R3` (an HTML page timing
  `canvas.toBlob`) was written to and read from the session scratchpad, not
  the repository, and a throwaway `python -m http.server` over the repo's
  own `img/` was stopped before this piece's gate ran - neither is in the
  tree. **New this pass**: B12d's own two measurement scripts (the
  scroll-to-bottom probe and the 44x44 overlap probe, both `node` scripts
  against `dist/` using `tests/app/lib.js`'s `fresh()`) were likewise
  written to and read from the session scratchpad, not the repository -
  neither is in the tree; their exact numbers are recorded in
  "Verification" instead of the scripts themselves.
- **New this pass**: two more foreign, untracked/unstaged items are now
  present alongside the two already recorded (`.claude/agents/reviewer.md`,
  `issues/56/`) - a second session was actively editing
  `.claude/hooks/{bash-guard,check-observer,selftest}.mjs`,
  `.claude/README.md` and three `.claude/prompts/*.md` files concurrently
  with this piece's own work (see "Verification"'s tree-contention note),
  and an empty, untracked `remediate` file (0 bytes) appeared in the repo
  root partway through this session, before this piece's own edits began.
  None of the five is this piece's to explain, fix, or stage - all are
  preserved untouched and unstaged, per "preserve unrelated working-tree
  changes, do not revert foreign work." Flagging the hooks contention for
  the orchestrator: `CLAUDE.md`'s "one session at a time per working tree"
  rule exists exactly because a second session's edits can make the first
  session's gate results look like a bug in its own work, which is what
  happened here (see "Verification").
- **Retirement pass (2026-09-18, orchestrator) - cleanup performed and
  artifacts retained, per `orchestrate.prompt.md` step 7.** Last commit
  touching this directory before this pass began: `9d0f139` (`git log
  --oneline -3 -- issues/phase-8/`); its own pre-retirement text is there
  and in every sha this file's "Completed" section names.
  - **Removed**: this task's own `plan.md`, in the same commit as the
    citation retargeting below (`bash-guard.mjs`'s retirement guard denies
    the deletion otherwise). One internal citation to it, in `nits.md:541`,
    used a `git show <sha>^:...` parent form the guard's `SHA_CITE_RE`
    cannot parse (it has no rule for a caret before the colon); rewritten
    to cite the plain parent sha (`d882707`) directly, rather than left to
    block the deletion.
  - **Durable content relocated, first** (`plan.md`'s own content, judged
    section by section against `.claude/skills/handoff/SKILL.md`,
    "Never drop"/"Always drop"):
    - `.claude/README.md` gained a second worked example of the
      batch-sizing seams (alongside issue 47's), the B12 four-piece split
      and its three seam criteria - the "batch-sizing criteria and the
      four-piece seam reasoning" this dispatch asked to judge.
    - `issues/phase-8/context.md` gained three sections: "The first plan's
      B2-B20 shape, and the merge to B2-B11" (the owner-decision history
      `.claude/README.md`'s "too small" bullet cites as its worked
      example); "Findings dropped without a batch, with reasons" (the
      rejected-options table, ~27 rows, moved verbatim - a rejected-
      options list is exactly what `SKILL.md`'s "Never drop" names); and
      "Deferred to the two excluded tickets, and to tasks of their own"
      (what the consistent-storage-layer ticket and the UI/UX-redesign
      ticket inherit, plus the standalone costed tasks - PF4 image
      derivatives, splitting `ListPage.svelte`, decomposing `AppState`,
      and the rest).
    - **Judged and left to die with `plan.md`, not moved**: "Verified
      facts that change what the reports proposed" (12 of its 13 items
      were already duplicated in `context.md`'s "Planner findings"
      section verbatim - D7's opacity cause, the `#/search` golden count,
      the stale-`CLAUDE.md`-injection retraction (twice), `dhloot.prefs.v1`
      holding `{ view }` only, D16, D8's real location, P4(b)/D6, the
      cross-report identities; the remaining item, B1's `hayFor` design
      improvement, already had its correct home named in `plan.md` itself,
      `handoff.md`'s own B1 entry); "Architecture and constraints that
      hold for every batch" (restates `CLAUDE.md`'s own standing rules
      with no phase-8-specific content); "Owner decisions - settled" (a
      pointer to `context.md`'s own "Settled owner decisions" table,
      already there); the per-batch "Gate cost, both shapes" table (a
      pre-batch time *estimate*, since superseded by every batch's own
      real measured numbers in this file's "Verification" section - the
      one reusable number in it, `sweep1180-ru`'s ~372s, is preserved via
      the citation retarget below, not by copying the table).
  - **Citations retargeted** (a fixed-string search for this task's own
    `plan.md` path outside `issues/phase-8/` was 6 hits before this pass,
    across 4 files; 0 after):
    `.claude/README.md:309,319` (the `sweep1180-ru` cost-table row and the
    CI-job-fixed-cost paragraph) and `.github/workflows/ci.yml:92`,
    `tests/run-all.js:27,138` all now cite `issues/phase-8/handoff.md`,
    "B3" (which already carries the real measured numbers, 371.9s(ru)/
    172.7s(en)); `.claude/README.md:332` (the "twenty batches merged to
    eleven" fact) now cites `issues/phase-8/context.md`'s new section by
    name; `docs/specs/DEBT.md:99` (`D24`'s cross-reference) now cites
    `issues/phase-8/context.md`. Within `issues/phase-8/` itself,
    `handoff.md`'s and `nits.md`'s remaining bare "`plan.md`" mentions
    (no `issues/phase-8/` prefix, ~20 across the two files) are left as
    provenance pointers, per this dispatch's own instruction - they do
    not block the guard and `context.md`/`handoff.md`/`nits.md` all
    survive retirement, unlike `plan.md`. Two of `handoff.md`'s own
    pointers (in "Deferred", above) were retargeted anyway, to the exact
    sections that now hold the content they pointed at, since the correct
    target was already in hand.
  - **Retained, not retired**: `issues/phase-8/context.md`,
    `issues/phase-8/handoff.md` (this file), `issues/phase-8/nits.md` and
    `issues/phase-8/critique/*.md` (the seven read-only sweep reports) -
    this dispatch retires `plan.md` alone, not the directory. `nits.md`
    also had a structural fix this pass (see "Status") but no content
    removed - every row it held stays, just correctly headed.
  - **Retained, foreign, confirmed untouched and unstaged one more time**:
    `.claude/agents/reviewer.md` (modified, another session's - the owner
    is tracking it separately), `issues/56/` (untracked, another task's),
    `remediate` (untracked, 0 bytes, origin unknown - the owner is raising
    it with its author separately; not this task's to delete). `git status
    --porcelain` before this pass's own first edit and again just before
    its commit both show only these three foreign paths beside this pass's
    own changes.
  - Nothing else was found or removed: no scratch files, probe branches,
    or manually-built `_site/` anywhere in the tree at any point this pass
    checked - consistent with every prior batch's own note here.
- Session end partial progress: none. `main` is at a committed, pushed,
  gate-verified boundary once this pass's retirement commit lands (see
  "Status" and "Completed"). Phase-8 is fully shipped and retired; no
  further session should open `issues/phase-8/` as an active task.
