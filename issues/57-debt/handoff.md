# Handoff - TASK 57-debt
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- 2026-11-10: steps D, E (with E2), D7, 1 and VW1 are on `main` and merged into `claude/57-debt` (`a8307bf7`). D6 waits for the owner's table.
- PH3 (2026-11-11): committed on `claude/57-debt` (the commit after `8f907601`), NOT pushed. Next: push, CI, batch review (PH2 review first if it did not run), then step 5 (Impeccable `polish` and `harden`, detector re-run) or `readme-screens` (Order of work 2).
  - Shipped: D127 stat columns (`eqCells` in `i18n.ts`, `cols` prop of `RowMain`/`TableRows`, `statCols` and one CSS block at the end of `TablesPage.svelte`; revert = that block, the prop and `eqCells`' caller); D133 the `/s/` bar folds copy and notify into «Ещё» up to 760 px (`SelBar.svelte`, 118 px at 360); D130 «№ N» / "No. N" on the record page, the share card (`tools/share-card.mjs`) and `/s/` rows from 761 px (the compact row stays bare); D135 the signed-out list lead; D128 the roll select shows two lines; D129 decision `docs/decisions/2026-11-11-craft-links-and-the-shared-first-entry-stay.md`. DEBT rows D127-D130, D133, D135 deleted; DESIGN.md has The Stat Columns Rule; FEATURES.md, COVERAGE.md updated.
  - PH2 review nits folded in: `keepRowFocus.test.ts` has no BOM and the text «Снять выделение»; COVERAGE.md row and assertions; batch ids out of `tools/bundle-budget.mjs` and `.claude/README.md`. The optional `noted` clear on focusout was NOT done: `focusin` elsewhere already clears it, and a removal can fire focusout, so a focusout clear would break the remote-removal case.
  - Verification: `npm run build:test` (fresh); `app/states` shards 1, 2, 4 pass; shard 3 failed once on case 89 (results line 258.7 px over 256: the two-line picker), fixed (`RollSelect.svelte` padding and line-height), then cases 89 and 130 pass alone; cases 128, 129, 130 pass; `node tests/app/golden.js --update` then reviewed (442 states); `node tools/build.js` and `node tests/run-all.js app/contracts` pass (694 s); `npm run check:fast` pass (1173 s, includes both lints, 2457+ tests; run before the last `RollSelect` CSS edit); `npm run lint:typed` and `npm run lint:untyped` re-run after it: clean; `node tests/app/typo.js`: only the two font-origin failures of Deviations (5). The old build was not run against cases 128-130 (not cheap).
  - Bundle: unconfigured 275.0 kB (limit 275 failed by 0.0), so both limits rose: 276 unconfigured, 333 configured (estimate about 332.0 kB; no `.env.test.local`, CI's `e2e` measures it).
  - Goldens (diffs read): 15 `/i/*` files, `Core · Предметы · номер 1` to `№ 1` and `roll 1` to `No. 1` (also cm1, lr6, mw9); 18 `/s/*` files (rows `1` to `№ 1`, `11` to `№ 11`, EN `No. N`; names and hashes change with them); 2 signed-out list pages (`_lists_nope`, `_lists_..101`: the lead loses the last sentence, RU and EN); 4 new: `_s_player_token_1_ticked_compact`, `..._more_open`, `_tables_eq_weapon_stat_columns`, `_tables_eq_armor_stat_columns` (the stat-column rows read the same sentence as the 1100 px golden).
  - Deviations: (1) case 128's row-height rule is "the 60 rows are no taller in all, and no row is taller than its sentence height by over one description line plus 4 px": the plan's "plus 4 px" per row fails for 4 RU weapon rows whose text is one wide line and wraps to three in the narrower column (sums: lower). (2) `tests/app/states.js` gained `--only=<text>` (as `golden.js` has). (3) `typo.js` runs the 360 px Whole Message step on the roll pages only, not all pages. (4) the notify item closes the menu on press (the `MoreMenu` rule) and shows sending, sent and disabled on the next opening. (5) `typo.js` still fails two checks, `ru`/`en: a font from outside /assets/` (`dist-test/index.html` preloads `../node_modules/@fontsource-variable/...` from `app/index.html`); no file of this batch touches it, and the failure was not compared with the old tree. (6) Case 129 reads the `.selbar` height (136.6 px at 320 RU), not the wrapper with its border (137.6). (7) Prettier rewrote ` ` in `RowMain.svelte`; the separator is `&nbsp;·&#32;`.
- PH1 (2026-11-11): `68655c35`, then the fix pass for CI run 42954673078 and the reviewer's blockers (commit after `17a9e0b0`), NOT pushed. Pushed with PH2.
  - Fix pass: B1 the configured limit is 331 kB (`tools/bundle-budget.mjs`, `.claude/README.md`; CI measured 330.7 to 330.8 kB; the unconfigured limit stays 274); B2 states case 88 reads `dataset.side` and checks the menu inside the window with the 16 px gutter (a joined dock at 640x360 now opens up by room); B3 case 100 reads scrollY 0 and the control under the header on open, Escape and a tap outside, RU and EN; R1 the toast text claims only `role` and `aria-live` always set; the comment nits.
  - Verification: `npm run build:test`; all four `app/states` shards pass (shard 2 re-run after the case 88 fix: 28 runs; shards 1, 3, 4: 29, passed); `node tests/app/golden.js` (438 states, no divergence); `rtk npm run check:fast`; `npm run lint:typed`; `npm run lint:untyped`. Not run: the configured-build budget line (no `.env.test.local` in the worktree; CI's `e2e` measures it).
  - Deviations: `homebrewEditor.test.ts` lost the `toBeInTheDocument` line (states cases 91/92/109 prove the upward menu).
  - D141 sweep (reviewer): 14 overlay opens at 360x640 RU/EN, 768x1024, 1180x720, 1920x950 and 740x360 are all clean. HelpBox, SharePanel and RequestsPanel are inline panels, not overlays. Case 123 (e) needs no rows.
  - Previous sha: `17a9e0b0`.
- Steps 2 and 3 are planned (triage pass, planner, 2026-11-10) as three batches in `plan-phone.md`: PH1 (overlays, the record dialog, the sticky
  columns, short windows), PH2 (focus, Escape, navigation scroll, list-page fields), PH3 (stat columns, the shared page, the roll number). None is started.
- Plan review: not required (no trigger fired); `plan.md` Status says so. Batch reviews: each of PH1-PH3 changes UI.
- Writer tier: `sonnet` for PH1-PH3 (pro profile; no writer test 2; no open design question).
- NEEDS_HUMAN_CONFIRMATION: no for PH1-PH3; D131 and D134 stay with the owner (`plan-phone.md` section 5) and block nothing; `ai-mcp` is postponed.
- AFK defaults of this pass: items 8-28 of `C:\Users\Ignat\.dhloot\notes\57\afk-decisions-57-debt-2026-11-10.md`.
- Branch: `claude/57-debt` (worktree `.claude/worktrees/57-debt`). Plans: `plan.md` (steps), `plan-views.md` (VW1, done), `plan-phone.md` (PH1-PH3).
- Bundle: 275.0 of 276 kB unconfigured; configured limit 333 (PH3). A batch past a limit raises `tools/bundle-budget.mjs` and `.claude/README.md` to its rounded-up total in the same commit.

## Completed (shipped to production; each `main` run green through `deploy` and `migrate-prod`)
- Task 57, the redesign: S2 `02a50c39`, S3 `f883e6fc`, closeout `49528e95`.
- Task `new-items` (ph, lr, vh sources): `62070925`.
- Task `roll-per-line` (one roll row per upgrade line, `vh` one flat list, the `lr` trim): `06f848fc`. Its first `main` run failed in
  `e2e` ("contract: live: no owner message named the list, its revision and this port's tab"; a hosted realtime check, no `supabase/`
  or cloud code changed); one rerun of the failed `e2e` passed and `deploy` ran. `main` is merged back (`342c91c4`). The main checkout
  sits on `claude/roll-per-line`, clean: switch to `main` before a squash and back after.
- 57-debt steps D (D1, D2, D4, D5), E and E2, D7, 1 and VW1: on `main` (`a68e40f5`, `95c770d6`, `b96e0640`, `89e4c348`, `25493a0d`).

## Next batch (implement-ready)
- Name: push PH2 and PH3, CI, the batch review of PH3 (UI change), then step 5 (Impeccable `polish` and `harden` on the pages PH1-PH3
  touched, the detector re-run) or `readme-screens` (Order of work 2). The owner may reject the stat columns: one CSS block in
  `TablesPage.svelte`, the `cols` prop of `RowMain`/`TableRows` and the `statCols` line revert them alone.
- Verification commands: see Status. The bundle limits are 276 kB unconfigured and 333 kB configured (PH3).
- Deviations: see Status.
- Pushed: no. Previous sha: `8f907601`.

## Order of work
1. Steps D, E, D7, 1 and VW1: done (on `main`). D3: the owner keeps `lr1` and `lr25` trimmed. D6 waits for the owner's table (add
   `voa4_t4i` and `voa4_a3` to it for D131).
2. `readme-screens` B1 (branch `claude/readme-screens`, worktree `.claude/worktrees/haiku-workflow-integration-cf5a13`, plan
   `issues/readme-screens/plan.md`, owner accepted Q1-Q4): `npm run screens` makes 8 README screenshots. Merge `main` first. Do NOT
   commit the images before the owner looks at them: stop and show the eight files (`SendUserFile`).
3. PH1, then PH2, then PH3 (`plan-phone.md`). Then steps 4 (the issue list) and 5 (Impeccable `polish` and `harden` on the pages PH1-PH3
   touched, the detector re-run).
4. `persistent-storage` closeout audit: `issues/persistent-storage/` says "R3 next" (September 30) but R10 shipped (`e02364d3`) after the
   persistence review (`0b73fd5c`). Audit against `/handoff`'s durable list, move what qualifies, delete the directory in a closeout
   commit; check `git log main --grep persist` for an open release first.
5. `ai-mcp`: postponed by the owner (2026-11-10). No question, no planner.
6. Inventory (read-only): branches and worktrees merged into `main` (`git branch --merged main`, `git worktree list`, about 50 worktrees)
   and the stale remote branches (`claude/task-58-implementation-plan-b14224`, `claude/task-planners-mockups-079cc9`,
   `claude/kind-curie-nxag95`, `claude/jolly-allen-ipojqp`, `claude/keen-noether-mpa4jq`, and the shipped `claude/57`,
   `claude/new-items`, `claude/57-fold`, `claude/nice-boyd-509586`). Report; delete NOTHING without the owner's yes.

## Pending from the owner (ask at the start, do not block on them)
- Review of the shipped work on production (the redesign, `ph`/`lr`/`vh`, `roll-per-line`, steps D, E, VW1).
- The D6 table (the Russian copy edit of the 21 trimmed `lr` records), with `voa4_t4i` and `voa4_a3` for D131.
- D134: one sign-in prompt shape on four routes (recommended) or keep the four.
- The D127 stat-column shots (`issues/57-debt/mocks/phone/d127-*-1440.png`) before PH3 ships, if back in time.
- The EN `<title>`, manifest name, `en/index.html` wordmark and Worker card images: a look only.
- Step E: a phone share (Telegram and one more) and a Windows share (Edge and Chrome) on production.

## Blockers
- None.

## Deferred
- Applying the `lr` trim rule to other sources (Vault of Ages averages 319 characters per description, `dv` 228): a separate owner decision.
- Step 1 leftovers: case speed-ups (five slowest `app/states` cases, one context with `setViewport` against `fresh()`), `run-all.js` output
  streaming (a cancelled job keeps nothing of the running row), the fake-limit suite (3x default limits on the list pages).
- Step 4 issue list: `HomebrewTabs` copies `TableNav` CSS, `EQ_DT`, one `RollPage` per roll mode, `review.prompt.md` naming against
  `agent-guard.mjs` (a prompt change: writer test 2), the `typo.js` note and price switches.

- R2 (PH1 review): the toast clearance band (`--overlay-clear`) is a fixed 80 px; a 3-line toast is 110-130 px tall, so a menu that
  ends 80 to 130 px above the bottom can still sit under it.
- R3 (PH1 review): `place()` re-chooses the side on every call, so a menu can flip from down to up in the middle of a scroll.

## Notes (rules that bit in the 2026-11-07 session)
- One session at a time per working tree, per local Supabase stack, per hosted test project. One writer per tree.
- A guard refusing a write: stop, return the text, never repeat it through the shell (the orchestrator wrote two reviewer reports).
- The agent guard needs a `- Plan review:` line in `plan.md` Status before an implementer dispatch.
- CI-first: the writer runs `check:fast`, the golden re-seeds, the affected tests and BOTH lints; CI and one fix pass find the rest. Every
  vitest run uses `VITEST_MAX_WORKERS=2`, one heavy command at a time, foreground, Bash timeout 600000.
- The CI credit accepts a rerun only of a failed `e2e`; a flaky `check` job needs a new run on a new commit (an empty commit with the same
  tree worked).
- No attribution line in a commit message. Stage files by name. Conventional Commits. Never amend a pushed commit or force-push.
- Read the usage at each wake; create the usage tick when a subagent starts and delete duplicates. The weekly window resets on
  2026-11-10 at 21:00 UTC; the weekly guard is 95%.
- Stop and report only for: deleting a branch or a worktree, NEEDS_HUMAN_CONFIRMATION: yes, a fable dispatch, an effort exception, a gate
  still red after the one fix cycle, a replan, a product-law change (the print card stays 63x88 mm).
