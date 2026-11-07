You are the orchestrator. Follow .claude/prompts/orchestrate.prompt.md. GOAL: finish the remaining tasks below, in
order, each released to production when it is done (squash onto `main` after a green CI run of its tip, watch the `main`
run through `deploy`, merge `main` back). The owner may be AFK: take the recommended option, log each default in
`C:\Users\Ignat\.dhloot\notes\57\` (the files `afk-decisions-*.md`), stop only for a critical case.

## State at the end of the 2026-11-07 session

Shipped to production (each `main` run green through `deploy` and `migrate-prod`):

- Task 57, the redesign: S2 `02a50c39`, S3 `f883e6fc`, closeout `49528e95`.
- Task `new-items` (Pistolheart ph, The Last Round Table lr, Escape the Veiled Halls vh): `62070925`.
- Task `roll-per-line` (one roll row per upgrade line, `vh` one flat list, the `lr` trim): `06f848fc`. The first `main` run
  failed in `e2e` ("contract: live: no owner message named the list, its revision and this port's tab", a hosted
  realtime check; no `supabase/` or cloud code changed); one rerun of the failed `e2e` passed and `deploy` and
  `migrate-prod` ran. `main` is merged back into `claude/roll-per-line` (`342c91c4`). The main checkout sits on
  `claude/roll-per-line` and is clean: switch to `main` before any squash and back after.
- Gate facts learned: the CI credit accepts a rerun only of a failed `e2e`; a flaky `check` job needs a new run on a new
  commit (an empty commit with the same tree worked). `homebrew.timed.test.ts` failed three times on loaded runners
  (16.7, 17.4, 16.96 ms against 16 ms): widen its bound in the debt plan, step 1.

Open, in this order:

0. **Quick data fix (owner finding 2026-11-07)**: `ph76` bolds only half of its cost: EN "**Mark a Hit Point** and a Stress",
   RU «**Отметьте Рану** и Стресс». Every other cost bolds the whole phrase. Bold the whole cost in both languages:
   "**Mark a Hit Point and a Stress**" / «**Отметьте Рану и Стресс**». Use the data-edit approach (one script keyed by
   id, assertions that only `ende` and `rud` of `ph76` change, `data.js` is one line), then `node tools/desc-style.mjs`,
   `node tools/build.js`, re-seed any golden that prints `ph76`'s text (`git grep -l "Hit Point" tests/app/snapshots`),
   `check:fast` and both lints. A scan of all 1593 records found no other split cost.
1. **`readme-screens` B1** (branch `claude/readme-screens`, worktree `.claude/worktrees/haiku-workflow-integration-cf5a13`,
   base `62070925`, two docs commits, not pushed). The plan is implement-ready (`issues/readme-screens/plan.md`, owner
   accepted Q1-Q4 on 2026-11-07). One command makes 8 README screenshots and both READMEs show them. Run it as one
   implementer batch (sonnet, routine). Do NOT commit the images before the owner looks at them: stop after
   `npm run screens` and show the eight files (`SendUserFile`), then commit on the owner's yes. Merge `main` first
   (`62070925` is old); `gm5` homebrew picture fallback is in the plan.
2. **`57-debt`** (branch `claude/57-debt`, worktree `.claude/worktrees/57-debt`; plan `issues/57-debt/plan.md`, views plan
   `plan-views.md`). Optional, the owner keeps it optional, but it is the main backlog. One triage pass first (planner,
   opus, medium effort) that folds in: `docs/specs/DEBT.md` D122-D140; batch VW1 (one picker row up to 760 px on `/roll`,
   `/tables`, `/homebrew`, from `plan-views.md`, included as an implementation step); and these new items:
   - `check:fast` runs prettier, svelte-check and vitest only: no eslint. Two `lint:typed` errors reached CI on
     2026-11-07. Plan adding `lint:untyped` and `lint:typed` to `tools/check/fast.mjs` (or an equivalent gate) with its
     cost; until then every writer runs `npm run lint:typed` and `npm run lint:untyped` before a push
     (`.claude/README.md`, "The fast pre-check").
   - CI flakes: `homebrew.timed.test.ts` (bound 50 ms, measured 56-58 ms), the e2e import `IMPORT_MS` 6000 ms (7350 ms
     seen), `facets.timed.test.ts`; decide a margin from several CI readings.
   - A GitHub run stayed `in_progress` with every job finished (run 42360480441), so `gh run watch` hung: note how to
     handle it (`gh run view <id> --json jobs`).
   - Stale `why` texts "seven supplements" at `tests/app/inventory.js` ~3331 and ~3335 (the second sits in a golden
     header: a re-seed); the comment count at `tests/app/states.js` if any.
   - Owner request 2026-11-07 (N6, N7): unify the view selector. The planner recommended option D (one picker row
     up to 760 px on all three pages, pills from 761 px): that is batch VW1.
   Then run the batches by the plan's order (step 1 tooling first; VW1 after step 1 and before step 2).
3. **`persistent-storage` closeout audit.** The directory `issues/persistent-storage/` still says "R3 next" (September 30)
   but the log shows R10 shipped (`e02364d3`) after the persistence review (`0b73fd5c`). Audit it against `/handoff`'s
   durable list (`.claude/skills/handoff/SKILL.md`): move what qualifies to its home, delete the directory in a closeout
   commit, push. Check `git log main --grep persist` for any release still open before you delete.
4. **`ai-mcp`** (`issues/ai-mcp/context.md`, no plan yet). Its dependency is done (Cloudflare Pages `d0fd98bc`, path
   addresses `1ace55e7`). A remote `/mcp` endpoint changes a product-law sentence in `CLAUDE.md` (no other backend):
   NEEDS_HUMAN_CONFIRMATION: yes before any plan beyond the open design questions. Dispatch a planner (opus) for the
   plan, ask the owner the product-law question first.
5. **Inventory (read-only, one haiku or the orchestrator)**: branches and worktrees merged into `main`
   (`git branch --merged main`, `git worktree list`; about 50 worktrees under `.claude/worktrees/`, many from agents),
   the stale remote branches (`claude/task-58-implementation-plan-b14224`, `claude/task-planners-mockups-079cc9`,
   `claude/kind-curie-nxag95`, `claude/jolly-allen-ipojqp`, `claude/keen-noether-mpa4jq`, and the shipped
   `claude/57`, `claude/new-items`, `claude/57-fold`, `claude/nice-boyd-509586` which equals `main`). Report the list;
   delete NOTHING (a branch or a worktree) without the owner's yes: deleting waits for the owner.

## Pending from the owner (ask at the start, do not block on them)

- The owner's review of the shipped work on production (the redesign, `ph`/`lr`/`vh`, `roll-per-line`).
- The owner's answers on the AFK defaults logged in `C:\Users\Ignat\.dhloot\notes\57\afk-decisions-2026-11-06.md`
  and `afk-decisions-new-items-2026-11-07.md` (A1-A10, N1-N11): the supplements picker from 761 px, one scrim without
  blur, one shadow, import and «Выбрать» next to the search box, the empty owner list text removed, the `lr` trim rule
  (`lr1` loses "cannot move on its own"; `lr25` loses who she is; `lr-trim.diff` is in the scratchpad of the last
  session; the removed text is `git show 1af46a61:data.js`).
- The leftover test data in the owner's account: the list "ZZ review wave 4 (delete me)" and the homebrew item "ZZ
  review wave 4 item" (the delete may still wait on a browser confirm dialog in the owner's Chrome).

## Rules that bit in this session

- One session at a time per working tree, per local Supabase stack, per hosted test project. One writer per tree.
- A guard refusing a write: stop, return the text, never repeat it through the shell (the reviewer's own report writes
  were refused twice; the orchestrator wrote them).
- The agent guard needs a `- Plan review:` line in `plan.md` Status before any implementer dispatch.
- CI-first: the writer runs `check:fast`, the golden re-seeds, the affected tests and BOTH lints; CI and one fix pass
  find the rest. Every vitest run uses `VITEST_MAX_WORKERS=2`, one heavy command at a time, foreground, Bash timeout
  600000.
- No commit message carries an attribution line. Stage files by name. Conventional Commits. Never amend a pushed
  commit, never force-push. `data.js` is one line: two branches that edit it conflict.
- Read the usage at each wake (`orchestrate.prompt.md`, "Usage guards"); create the usage tick when a subagent
  starts. The weekly window (all models) resets on 2026-11-10 at 21:00 UTC; the weekly guard is 95% (the owner raised
  it to 98% for the 2026-11-07 session only).
- Stop and report only for: deleting a branch or a worktree, NEEDS_HUMAN_CONFIRMATION: yes, a fable dispatch, an effort
  exception, a gate still red after the one fix cycle, a replan, a product-law change (the print card stays 63x88 mm).
