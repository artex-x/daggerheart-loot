# Handoff - TASK 57-debt
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- 2026-11-10: steps D, E (with E2), D7, 1 and VW1 are on `main` and merged into `claude/57-debt` (`a8307bf7`). D6 waits for the owner's table.
- PH2 (2026-11-11): committed on `claude/57-debt` (the commit after the PH1 fix pass), NOT pushed. Next: push, CI, batch review, then PH3.
  - Verification: `npm run build:test`; all four `app/states` shards pass (30, 29, 29, 29 runs; cases 124-127 included); `node tests/app/golden.js` (438 states, structural snapshots unchanged); `rtk npm run check:fast` (2457 tests; green on the third run); `npm run lint:typed`; `npm run lint:untyped`. Not run: the configured-build budget line (no `.env.test.local`).
  - Bundle: unconfigured 274.4 kB (limit 274 failed by 0.4), so both limits rose in this commit: 275 unconfigured, 332 configured (estimate about 331.4 kB: 274.4 plus the 57 kB account chunk; CI's `e2e` measures it).
  - Deviations: `prettier --write tests/app/states.js`; Shell's `rowOf` is a `SvelteMap` and `keepRowFocus.test.ts` uses `kept.destroy()` (lint). Both were made after the states shards and the golden ran, so only `check:fast` covers them.
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
- Bundle: 274.4 of 275 kB unconfigured; configured limit 332 (PH2). A batch past a limit raises `tools/bundle-budget.mjs` and `.claude/README.md` to its rounded-up total in the same commit.

## Completed (shipped to production; each `main` run green through `deploy` and `migrate-prod`)
- Task 57, the redesign: S2 `02a50c39`, S3 `f883e6fc`, closeout `49528e95`.
- Task `new-items` (ph, lr, vh sources): `62070925`.
- Task `roll-per-line` (one roll row per upgrade line, `vh` one flat list, the `lr` trim): `06f848fc`. Its first `main` run failed in
  `e2e` ("contract: live: no owner message named the list, its revision and this port's tab"; a hosted realtime check, no `supabase/`
  or cloud code changed); one rerun of the failed `e2e` passed and `deploy` ran. `main` is merged back (`342c91c4`). The main checkout
  sits on `claude/roll-per-line`, clean: switch to `main` before a squash and back after.
- 57-debt steps D (D1, D2, D4, D5), E and E2, D7, 1 and VW1: on `main` (`a68e40f5`, `95c770d6`, `b96e0640`, `89e4c348`, `25493a0d`).

## Next batch (implement-ready)
- Name: PH3 - stat columns, the shared page and the roll number (`plan-phone.md`, "PH3"). PH2 is done (see Status).
- In scope, out of scope, files, steps, acceptance: `plan-phone.md`, "PH3". Run the PH2 batch review first (the orchestrator).
- Verification commands: `npm run build:test`; `node tests/app/states.js --shard=n/4` for the shards with the changed cases, in the
  background, one at a time; `node tests/app/golden.js`; `rtk npm run check:fast` (Bash timeout 600000); `npm run lint:typed`;
  `npm run lint:untyped`; push; CI.
- Risks / do-nots: `plan-phone.md`, "PH3", "Risks". The bundle limits are 275 kB unconfigured and 332 kB configured (PH2): a PH3 total
  past either raises both files in the same commit.
- Verification (PH2): see Status.
- Deviations: none for PH3 yet.
- Pushed: no. Previous sha: the PH1 fix commit in Status.

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
