# Handoff - TASK 57-debt
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned, not started (written 2026-11-07, end of the session that shipped task 57, `new-items` and `roll-per-line`).
- Last agent: orchestrator (2026-11-07)
- NEEDS_HUMAN_CONFIRMATION: no for steps D, E, 1, V, 2, 3; yes for `ai-mcp` (product law)
- Branch: `claude/57-debt` (worktree `.claude/worktrees/57-debt`, pushed). Merge `main` into it first.
- Plan: `plan.md` (steps D, E, 1, V, 2-5; "Step D", "Step E", "Step E2" hold the details), `plan-views.md` (batch VW1).
- Plan review: not required (no trigger fired) for D, E and VW1.

## Completed (shipped to production; each `main` run green through `deploy` and `migrate-prod`)
- Task 57, the redesign: S2 `02a50c39`, S3 `f883e6fc`, closeout `49528e95`.
- Task `new-items` (ph, lr, vh sources): `62070925`.
- Task `roll-per-line` (one roll row per upgrade line, `vh` one flat list, the `lr` trim): `06f848fc`. Its first `main` run failed in
  `e2e` ("contract: live: no owner message named the list, its revision and this port's tab"; a hosted realtime check, no `supabase/`
  or cloud code changed); one rerun of the failed `e2e` passed and `deploy` ran. `main` is merged back (`342c91c4`). The main checkout
  sits on `claude/roll-per-line`, clean: switch to `main` before a squash and back after.

## Next batch (implement-ready)
- Name: D (catalog data fixes), then E (share link and Windows). Then, in the order below, the rest.
- In scope: `plan.md` "Step D" (D1-D6) and "Step E", "Step E2".
- Out of scope: everything under steps 1-5 and VW1 until D and E are on `main`.
- Files expected: D: `data.js` (one script, one line), `tests/craft.js`, `tests/derived.js` counts, goldens that print the records,
  `tests/app/inventory.js`. E: `app/src/ports/share.ts`, `app/src/components/RecordActions.svelte`, their tests, `FEATURES.md`.
- Steps: see `plan.md`.
- Acceptance criteria: each step's "Acceptance" lines in `plan.md`.
- Verification commands: `node tools/desc-style.mjs`, `node tools/build.js`, `node tests/run-all.js dataint,derived,contracts,craft`,
  `rtk npm run check:fast` (Bash timeout 600000), `npm run lint:typed`, `npm run lint:untyped` (check:fast does NOT run eslint).
- Risks / do-nots: `data.js` is one line (two branches that edit it conflict); never hand-edit it; D6 shows the owner a before and after
  table first.

## Order of work
1. Step D, catalog data fixes: D1 `ph76` bold the whole cost; D2 `lr2` `craft: ["lr3"]` (the `craft` pin 33 to 34, no rule card);
   D3 owner decides on the `lr1` and `lr25` trim losses; D4 stale "seven supplements" `why` texts; D5 `lr20` self-contained (default,
   drop the card `lr-fruitcake`, rule cards 7 to 6, counts follow); D6 Russian copy edit of the 21 trimmed `lr` records (table first).
2. Step E: the share link. `app/src/ports/share.ts` line 42 sends `{ files, text }` only when a picture is attached, so `url` and
   `title` are dropped by the app. Default: the link is the last line of the shared `text` (no link: the site address), once. E2
   (Windows shows only the picture): on a desktop (fine pointer, no touch) share without the file and keep the picture in «Ещё».
3. `readme-screens` B1 (branch `claude/readme-screens`, worktree `.claude/worktrees/haiku-workflow-integration-cf5a13`, plan
   `issues/readme-screens/plan.md`, owner accepted Q1-Q4): `npm run screens` makes 8 README screenshots. Merge `main` first. Do NOT
   commit the images before the owner looks at them: stop and show the eight files (`SendUserFile`).
4. Step 1, tooling and CI: add `lint:untyped` and `lint:typed` to `tools/check/fast.mjs`; widen the timing bounds from the CI readings
   (`homebrew.timed.test.ts` failed at 16.7, 17.4 and 16.96 ms against 16 ms and at 56-58 ms against 50 ms; `facets.timed.test.ts`; the
   e2e import `IMPORT_MS` 6000 ms with 7350 ms seen); note a GitHub run that stays `in_progress` with every job finished (run
   42360480441; `gh run view <id> --json jobs`; the watcher hangs).
5. Batch VW1 (`plan-views.md`): one picker row up to 760 px on `/roll`, `/tables`, `/homebrew`; after step 1.
6. Steps 2 and 3 (phone overlays and scroll; visual leftovers, mock first), with `docs/specs/DEBT.md` D122-D140. Default for D132 (the
   record dialog's «Ещё» scrolls the card, and the «В список» popover is cropped at the card's top, owner screenshot 2026-11-07):
   both overlays render on top and never move the card (focus the first item with `preventScroll`, choose up or down by the
   window, let them extend past the card edge: top layer or a portal into the dialog); one fix for both, see `DEBT.md` D132. One
   triage pass first (planner, opus, medium effort) folds the new rows and steps D, E and VW1 into batches by shared component and
   filter, sized by their gates. Then steps 4 and 5.
7. `persistent-storage` closeout audit: `issues/persistent-storage/` says "R3 next" (September 30) but R10 shipped (`e02364d3`) after the
   persistence review (`0b73fd5c`). Audit against `/handoff`'s durable list, move what qualifies, delete the directory in a closeout
   commit; check `git log main --grep persist` for an open release first.
8. `ai-mcp` (`issues/ai-mcp/context.md`, no plan): a remote `/mcp` endpoint changes a product-law sentence in `CLAUDE.md` (no other
   backend): ask the owner first, then a planner (opus). Its dependency is done (Cloudflare Pages `d0fd98bc`, path addresses `1ace55e7`).
9. Inventory (read-only): branches and worktrees merged into `main` (`git branch --merged main`, `git worktree list`, about 50 worktrees)
   and the stale remote branches (`claude/task-58-implementation-plan-b14224`, `claude/task-planners-mockups-079cc9`,
   `claude/kind-curie-nxag95`, `claude/jolly-allen-ipojqp`, `claude/keen-noether-mpa4jq`, and the shipped `claude/57`,
   `claude/new-items`, `claude/57-fold`, `claude/nice-boyd-509586`). Report; delete NOTHING without the owner's yes.

## Pending from the owner (ask at the start, do not block on them)
- Review of the shipped work on production (the redesign, `ph`/`lr`/`vh`, `roll-per-line`).
- Answers on the AFK defaults in `C:\Users\Ignat\.dhloot\notes\57\afk-decisions-2026-11-06.md` and `afk-decisions-new-items-2026-11-07.md`
  (A1-A10, N1-N11): the supplements picker from 761 px, one scrim without blur, one shadow, import and «Выбрать» next to the search box,
  the empty owner list text removed, the `lr` trim rule.
- Step D: D3, D5 (option A or keep the card), the D6 table. Step E: a phone share (Telegram and one more) and a Windows share (Edge and
  Chrome) on production.
- Leftover test data in the owner's account: the list "ZZ review wave 4 (delete me)" and the homebrew item "ZZ review wave 4 item" (the
  delete may wait on a browser confirm dialog in the owner's Chrome).

## Blockers
- None.

## Deferred
- Applying the `lr` trim rule to other sources (Vault of Ages averages 319 characters per description, `dv` 228): a separate owner decision.
- The `lr` trim notes of `lr1` and `lr25` (step D3).

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
