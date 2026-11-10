# Handoff - TASK 57-debt
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- 2026-11-10: steps D, E (with E2), D7, 1 and VW1 are on `main` and merged into `claude/57-debt` (`a8307bf7`). D6 waits for the owner's table.
- Steps 2 and 3 are planned (triage pass, planner, 2026-11-10) as three batches in `plan-phone.md`: PH1 (overlays, the record dialog, the sticky
  columns, short windows), PH2 (focus, Escape, navigation scroll, list-page fields), PH3 (stat columns, the shared page, the roll number). None is started.
- Plan review: not required (no trigger fired); `plan.md` Status says so. Batch reviews: each of PH1-PH3 changes UI.
- Writer tier: `sonnet` for PH1-PH3 (pro profile; no writer test 2; no open design question).
- NEEDS_HUMAN_CONFIRMATION: no for PH1-PH3; D131 and D134 stay with the owner (`plan-phone.md` section 5) and block nothing; `ai-mcp` is postponed.
- AFK defaults of this pass: items 8-28 of `C:\Users\Ignat\.dhloot\notes\57\afk-decisions-57-debt-2026-11-10.md`.
- Branch: `claude/57-debt` (worktree `.claude/worktrees/57-debt`). Plans: `plan.md` (steps), `plan-views.md` (VW1, done), `plan-phone.md` (PH1-PH3).
- Bundle: 272.4 of 273 kB (VW1). A batch past 273 kB raises `tools/bundle-budget.mjs` and `.claude/README.md` to its rounded-up total in the same commit.

## Completed (shipped to production; each `main` run green through `deploy` and `migrate-prod`)
- Task 57, the redesign: S2 `02a50c39`, S3 `f883e6fc`, closeout `49528e95`.
- Task `new-items` (ph, lr, vh sources): `62070925`.
- Task `roll-per-line` (one roll row per upgrade line, `vh` one flat list, the `lr` trim): `06f848fc`. Its first `main` run failed in
  `e2e` ("contract: live: no owner message named the list, its revision and this port's tab"; a hosted realtime check, no `supabase/`
  or cloud code changed); one rerun of the failed `e2e` passed and `deploy` ran. `main` is merged back (`342c91c4`). The main checkout
  sits on `claude/roll-per-line`, clean: switch to `main` before a squash and back after.
- 57-debt steps D (D1, D2, D4, D5), E and E2, D7, 1 and VW1: on `main` (`a68e40f5`, `95c770d6`, `b96e0640`, `89e4c348`, `25493a0d`).

## Next batch (implement-ready)
- Name: PH1 - overlays, the record dialog and the sticky columns (`plan-phone.md`, "PH1").
- In scope: D122, D123, D124, D125, D126, D132 (the «Ещё» menu and the «В список» popover), D136, D140, D141 (the filter column and the
  editor preview), the toast live region, the D141 sweep.
- Out of scope: PH2 and PH3 items; `Sheet`, `ItemPicker` and `ModeRow` scrolling; a bottom sheet for menus.
- Files expected: new `app/src/components/overlay.ts` and `stickyTop.ts`; `Menu`, `MoreMenu`, `AccountMenu`, `AddToList`, `RecordModal`,
  `Toast`, `Shell`, `FilterPanel`, `HomebrewEditor`, `TabBar`, `CropDialog` and the callers that pass `flip` or `up`; their tests;
  `tests/app/states.js` (cases 119-123, 108 (f), and cases 3, 23, 32, 90 updated), `inventory.js`; FEATURES.md, DESIGN.md, DEBT.md,
  COVERAGE.md; the bundle budget only if passed.
- Steps: `plan-phone.md`, "PH1", "Steps" 1-14.
- Acceptance criteria: `plan-phone.md`, "PH1", "Acceptance" (each new case fails on the VW1 build first; the paid DEBT rows deleted).
- Verification commands: `npm run build:test`; the probe `issues/57-debt/mocks/phone/probe2.cjs` as the sweep's start; `node tests/app/states.js
  --shard=n/4` for the shards with the changed cases, in the background, one at a time; `node tests/app/golden.js --update --only=<id>` per
  changed golden (or CI's text); `rtk npm run check:fast` (Bash timeout 600000); `npm run lint:typed`; `npm run lint:untyped`; push; CI.
- Risks / do-nots: reset the popover UA styles in `Menu` and `.dropmenu` as `Toast` does; a fixed overlay must follow its control on
  scroll; keep the DOM order (the Tab order); every caller's `flip` and `up` go in the same commit.

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
