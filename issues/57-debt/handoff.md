# Handoff - TASK 57-debt
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- 2026-11-11: PH1, PH2 and PH3 are on `main` (squash `bf0b1e17`) and merged into `claude/57-debt` (`5141e030`, clean). Steps D, E (with E2), D7, 1 and VW1 are on `main` since 2026-11-10. D6 waits for the owner's table.
- SP1 (D134, one `SignInPrompt` plate on the signed-out page-level prompts) is planned in `plan-sp1.md` (planner, 2026-11-11): implement-ready, not started. The owner took the recommended option on 2026-11-11. Scope decided there: six routes (`/lists`, `/lists/<uuid>`, `/homebrew` with its editor, `/tables/homebrew`, `/p/<id>`), no «Открыть таблицы» on the signed-out list route, that route headed «Мои списки» with the tab title to match. It folds in the three PH3 review nits (the decision file's line 3, the NBSP in `tables.test.ts`, one unwrapped `FEATURES.md` line).
- Plan review: not required (no trigger fired); `plan.md` Status says so, and SP1 adds no migration, contract file, stored key or write protocol. Batch review: required for SP1 (trigger: visual parity / new or changed UI).
- Writer tier: `sonnet` for SP1 (no `Open design question:` line).
- NEEDS_HUMAN_CONFIRMATION: no. D131 stays with the owner (`plan-phone.md` section 5) and blocks nothing; `ai-mcp` is postponed.
- Carried from PH1-PH3 (still true on this branch): the owner may reject the stat columns (one CSS block in `TablesPage.svelte`, the `cols` prop of `RowMain`/`TableRows` and the `statCols` line revert them alone). `node tests/app/typo.js` fails only the two font-origin checks (`ru`/`en: a font from outside /assets/`; `dist-test/index.html` preloads `../node_modules/@fontsource-variable/...`), not compared with the old tree. The PH2 review's optional `noted` clear on focusout stays undone on purpose (a removal can fire focusout).
- Bundle: 275.0 of 276 kB unconfigured; configured limit 333 (PH3). A batch past a limit raises `tools/bundle-budget.mjs` and `.claude/README.md` to its rounded-up total in the same commit.
- AFK defaults of the 2026-11-10 pass: items 8-28 of `C:\Users\Ignat\.dhloot\notes\57\afk-decisions-57-debt-2026-11-10.md`.
- Branch: `claude/57-debt` (worktree `.claude/worktrees/57-debt`). Plans: `plan.md` (steps), `plan-views.md` (VW1, done), `plan-phone.md` (PH1-PH3, done), `plan-sp1.md` (SP1).

## Completed (shipped to production; each `main` run green through `deploy` and `migrate-prod`)
- Task 57, the redesign: S2 `02a50c39`, S3 `f883e6fc`, closeout `49528e95`.
- Task `new-items` (ph, lr, vh sources): `62070925`.
- Task `roll-per-line` (one roll row per upgrade line, `vh` one flat list, the `lr` trim): `06f848fc`. Its first `main` run failed in
  `e2e` ("contract: live: no owner message named the list, its revision and this port's tab"; a hosted realtime check, no `supabase/`
  or cloud code changed); one rerun of the failed `e2e` passed and `deploy` ran. `main` is merged back (`342c91c4`). The main checkout
  sits on `claude/roll-per-line`, clean: switch to `main` before a squash and back after.
- 57-debt steps D (D1, D2, D4, D5), E and E2, D7, 1 and VW1: on `main` (`a68e40f5`, `95c770d6`, `b96e0640`, `89e4c348`, `25493a0d`).
- 57-debt PH1-PH3 (overlays and sticky columns, focus and navigation scroll, stat columns / the shared bar / the roll number): on `main` as the squash `bf0b1e17`.

## Next batch (implement-ready)
- Name: SP1 - one sign-in plate on the page-level prompts (D134) plus the three PH3 nits. The full batch (objective, scope, files, behavior per device and route, states case 131, goldens, standing checks, steps, acceptance, risks) is `plan-sp1.md`.
- Steps in short: (1) the nits; (2) `dict.ts`: add `listSignInLead`, delete `listGoneSignedOut` and `listGoneSignedOutSub`; (3) `SignInPrompt.svelte`: the default form is the `Empty` plate, `compact` and `boxed` stay; (4) unwrap `ListsPage` and `TablesPage`, rewrite the signed-out branches of `ListPage.gone()` and `PrintPage`; (5) `Shell.svelte` title for a signed-out `storedList`; (6) unit tests; (7) inventory state `#/homebrew/new`, case 131, additions to case 111, three sweep rows; (8) specs, DESIGN.md, COVERAGE.md, delete D134, the decision file, `node tools/decisions.js`; (9) gates and goldens (two goldens change, one is new, the rest stay byte-identical); (10) handoff, commit, push.
- Verification commands: `plan-sp1.md`, "Verification". The bundle limits are 276 kB unconfigured and 333 kB configured; print the figure with one decimal.
- After SP1: push, CI, the batch review (UI change), then step 5 (Impeccable `polish` and `harden` on the pages PH1-PH3 and SP1 touched, the detector re-run) or `readme-screens` (Order of work 2).
- Deviations: none yet.
- Pushed: no. Previous sha: `5141e030`.

## Order of work
1. Steps D, E, D7, 1 and VW1: done (on `main`). D3: the owner keeps `lr1` and `lr25` trimmed. D6 waits for the owner's table (add
   `voa4_t4i` and `voa4_a3` to it for D131).
2. `readme-screens` B1 (branch `claude/readme-screens`, worktree `.claude/worktrees/haiku-workflow-integration-cf5a13`, plan
   `issues/readme-screens/plan.md`, owner accepted Q1-Q4): `npm run screens` makes 8 README screenshots. Merge `main` first. Do NOT
   commit the images before the owner looks at them: stop and show the eight files (`SendUserFile`).
3. PH1-PH3: done (on `main`). SP1 (`plan-sp1.md`) next. Then steps 4 (the issue list) and 5 (Impeccable `polish` and `harden` on the
   pages PH1-PH3 and SP1 touched, the detector re-run).
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
- D134: decided on 2026-11-11 (one shape); SP1 builds it. Nothing to ask. The two scope additions (`/homebrew/new` and `/p/<id>`) and the dropped «Открыть таблицы» are named in the report; either reverts alone.
- The D127 stat-column shots (`issues/57-debt/mocks/phone/d127-*-1440.png`), now that PH3 shipped.
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
