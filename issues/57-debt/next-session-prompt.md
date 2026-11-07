You are the orchestrator. Follow .claude/prompts/orchestrate.prompt.md. GOAL: finish the remaining tasks below, in
order, each released to production when it is done (squash onto `main` after a green CI run of its tip, watch the `main`
run through `deploy`, merge `main` back). The owner may be AFK: take the recommended option, log each default in
`C:\Users\Ignat\.dhloot\notes\57\` (the files `afk-decisions-*.md`), stop only for a critical case.

## State at the end of the 2026-11-07 session

Shipped to production (each `main` run green through `deploy` and `migrate-prod`):

- Task 57, the redesign: S2 `02a50c39`, S3 `f883e6fc`, closeout `49528e95`.
- Task `new-items` (Pistolheart ph, The Last Round Table lr, Escape the Veiled Halls vh): `62070925`.
- Task `roll-per-line` (one roll row per upgrade line, `vh` one flat list, the `lr` trim): `06f848fc`. Its first `main` run
  failed in `e2e` ("contract: live: no owner message named the list, its revision and this port's tab", a hosted realtime
  check; no `supabase/` or cloud code changed); one rerun of the failed `e2e` passed and `deploy` and `migrate-prod` ran.
  `main` is merged back into `claude/roll-per-line` (`342c91c4`). The main checkout sits on `claude/roll-per-line` and is
  clean: switch to `main` before any squash and back after.
- Gate facts learned: the CI credit accepts a rerun only of a failed `e2e`; a flaky `check` job needs a new run on a new
  commit (an empty commit with the same tree worked). `homebrew.timed.test.ts` failed three times on loaded runners
  (16.7, 17.4, 16.96 ms against 16 ms; 56-58 ms against 50 ms in the other case): widen its bound in debt step 1.
  `check:fast` runs prettier, svelte-check and vitest only, NOT eslint: run `npm run lint:typed` and `npm run lint:untyped`
  before every push (two `lint:typed` errors reached CI).

## Order of work

The debt plan is `issues/57-debt/plan.md` (branch `claude/57-debt`, worktree `.claude/worktrees/57-debt`, pushed). Merge
`main` into that branch first. Its order is: D, E, 1, V (VW1), 2, 3 (4 and 5 ride on them). Do the work in this order:

1. **Debt step D: catalog data fixes** (`plan.md` "Step D"; small, data only; the owner saw these on production).
   Method: one script keyed by id with assertions (only the named fields of the named records change; `data.js` is one line),
   then `node tools/desc-style.mjs`, `node tools/build.js`, `node tests/run-all.js dataint,derived,contracts,craft`, the golden
   re-seed of the states that print these records (`git grep -l` over `tests/app/snapshots`), `check:fast` and both lints.
   - D1 `ph76` bolds half of its cost: EN "**Mark a Hit Point** and a Stress", RU «**Отметьте Рану** и Стресс». Bold the whole
     cost in both languages ("**Mark a Hit Point and a Stress**" / «**Отметьте Рану и Стресс**»). A scan of all 1593 records
     found no other split cost.
   - D2 `lr2` (Alewife Almanac) summons the Witch's Skillet (`lr3`) and links nothing: add `craft: ["lr3"]` to `lr2`, like the
     potion recipes (`ci18`, `ci19`, `ci24`, `ci51`); the `craft` suite pin goes from 33 chains to 34; no rule card. The
     "Upgrades to" label stretch is the one every recipe has.
   - D3 owner notes on the `lr` trim: `lr1` lost "cannot move on its own" and "stays animated outside the Tower"; `lr25` lost who
     she is. The owner decides whether to restore either (`git show 1af46a61:data.js` holds the removed text).
   - D4 stale "seven supplements" `why` texts at `tests/app/inventory.js` (the second sits in a golden header: a re-seed).
   - D5 `lr20` (Longfire Fruitcake) is not readable alone: its move ends "applying the following results:" and the four results and
     the Impaired line live only in the rule card `lr-fruitcake`. Default: put the move, the four outcomes, the Impaired line and
     the light line into the description in both languages and drop the card (rule cards 7 to 6: update the counts that
     `tests/derived.js` `COUNT_BEARING_FILES` names, the READMEs, `llms.txt`, `CONTRACTS.md`); the print card may shrink its text
     (the owner accepts it; check `app/print`). The scan of all records found no other dangling lead; the records that depend on a
     rule card (`lr6`, `lr8`, `ph66`, `ph77`, `ph79`-`ph84`, `ph85`-`ph93`) read complete without it.
   - D6 Russian copy edit of the 21 trimmed `lr` records (the owner finds «Встречается в буханках примерно по 4,5 кг...» stiff;
     proposal for `lr20`: «Продаётся буханками примерно по 4,5 кг, заранее нарезанными на 5 ломтей. Фруктовый Кекс Долгого Огня
     не плесневеет, не сохнет и не черствеет. Одного ломтя хватает, чтобы заменить дневной рацион.»). Show the owner a before and
     after table of every changed RU sentence FIRST; apply only what the owner signs. EN is the book's text and stays.
2. **Debt step E: the share button carries the link, and Windows** (`plan.md` "Step E" and "Step E2"; a small code batch with unit
   tests). The cause is in the app: `app/src/ports/share.ts` line 42 sends `{ files, text }` only when a picture is attached, so
   `url` and `title` never leave the app; the link is lost on the phone and on Windows. Default: the link is the last line of the
   shared `text` whenever the record has a link (a build with no preview host: the site address), once (no duplicate where a
   target shows both). Also check the other share buttons: the roll result row, the dialog dock, the list «Поделиться», the share
   panel, the own homebrew item (preview link `/h/<uuid>?v=<v>`). E2 (Windows: the owner sees only the picture): if the Windows
   share sheet still shows only the picture after the port fix, on a desktop (fine pointer, no touch) share without the file
   (link and text) and keep the picture in «Ещё» («Копировать картинку»); the port decides the environment, with a unit test per
   environment. The owner tries one phone share (Telegram and one more) and one Windows share (Edge and Chrome) on production;
   the open choice is option 2 or a split button «Поделиться» / «Поделиться картинкой».
3. **`readme-screens` B1** (branch `claude/readme-screens`, worktree `.claude/worktrees/haiku-workflow-integration-cf5a13`, base
   `62070925`, two docs commits, not pushed; plan `issues/readme-screens/plan.md`, the owner accepted Q1-Q4 on 2026-11-07). One
   command makes 8 README screenshots and both READMEs show them. Run it as one implementer batch (sonnet, routine). Merge `main`
   first. Do NOT commit the images before the owner looks at them: stop after `npm run screens` and show the eight files
   (`SendUserFile`), then commit on the owner's yes. The `gm5` homebrew picture fallback is in the plan.
4. **Debt step 1: tooling and CI** (`plan.md`; its own small task, a reviewer for the hooks change): add `lint:untyped` and
   `lint:typed` to `tools/check/fast.mjs` (or an equivalent gate) with its cost; widen the timing bounds from the CI readings
   (`homebrew.timed.test.ts`, `facets.timed.test.ts`, the e2e import `IMPORT_MS` 6000 ms with 7350 ms seen); note how to handle
   a GitHub run that stays `in_progress` with every job finished (run 42360480441: `gh run view <id> --json jobs`; the watcher
   hangs); the rest of the step 1 list.
5. **Batch VW1** (`plan-views.md`, owner request 2026-11-07, N6 and N7): one picker row up to 760 px on `/roll`, `/tables` and
   `/homebrew`, pills from 761 px; after step 1 and before step 2.
6. **Debt steps 2 and 3** (phone overlays and scroll; visual leftovers, mock first), with `docs/specs/DEBT.md` D122-D140 and
   the rows added by the 2026-11-07 session; then 4 and 5. One triage pass first (planner, opus, medium effort) folds the new
   rows and steps D, E and VW1 into the batches by shared component and filter, sized by their gates (`CLAUDE.md`).
7. **`persistent-storage` closeout audit.** `issues/persistent-storage/` still says "R3 next" (September 30) but the log shows R10
   shipped (`e02364d3`) after the persistence review (`0b73fd5c`). Audit it against `/handoff`'s durable list
   (`.claude/skills/handoff/SKILL.md`): move what qualifies to its home, delete the directory in a closeout commit, push. Check
   `git log main --grep persist` for any release still open before you delete.
8. **`ai-mcp`** (`issues/ai-mcp/context.md`, no plan yet). Its dependency is done (Cloudflare Pages `d0fd98bc`, path addresses
   `1ace55e7`). A remote `/mcp` endpoint changes a product-law sentence in `CLAUDE.md` (no other backend):
   NEEDS_HUMAN_CONFIRMATION: yes before any plan beyond the open design questions. Dispatch a planner (opus), ask the owner the
   product-law question first.
9. **Inventory (read-only, one haiku or the orchestrator)**: branches and worktrees merged into `main` (`git branch --merged
   main`, `git worktree list`; about 50 worktrees under `.claude/worktrees/`, many from agents) and the stale remote branches
   (`claude/task-58-implementation-plan-b14224`, `claude/task-planners-mockups-079cc9`, `claude/kind-curie-nxag95`,
   `claude/jolly-allen-ipojqp`, `claude/keen-noether-mpa4jq`, and the shipped `claude/57`, `claude/new-items`, `claude/57-fold`,
   `claude/nice-boyd-509586` which equals `main`). Report the list; delete NOTHING (a branch or a worktree) without the owner's
   yes: deleting waits for the owner.

## Pending from the owner (ask at the start, do not block on them)

- The owner's review of the shipped work on production (the redesign, `ph`/`lr`/`vh`, `roll-per-line`).
- The owner's answers on the AFK defaults logged in `C:\Users\Ignat\.dhloot\notes\57\afk-decisions-2026-11-06.md` and
  `afk-decisions-new-items-2026-11-07.md` (A1-A10, N1-N11): the supplements picker from 761 px, one scrim without blur, one
  shadow, import and «Выбрать» next to the search box, the empty owner list text removed, the `lr` trim rule.
- Step D choices: D3 (restore `lr1` or `lr25` text), D5 (option A, self-contained `lr20`, or keep the card), the D6 before and
  after table.
- Step E: the phone and Windows share tests on production.
- The leftover test data in the owner's account: the list "ZZ review wave 4 (delete me)" and the homebrew item "ZZ review wave 4
  item" (the delete may still wait on a browser confirm dialog in the owner's Chrome).

## Rules that bit in this session

- One session at a time per working tree, per local Supabase stack, per hosted test project. One writer per tree.
- A guard refusing a write: stop, return the text, never repeat it through the shell (the reviewer's own report writes were
  refused twice; the orchestrator wrote them).
- The agent guard needs a `- Plan review:` line in `plan.md` Status before any implementer dispatch.
- CI-first: the writer runs `check:fast`, the golden re-seeds, the affected tests and BOTH lints; CI and one fix pass find the
  rest. Every vitest run uses `VITEST_MAX_WORKERS=2`, one heavy command at a time, foreground, Bash timeout 600000.
- No commit message carries an attribution line. Stage files by name. Conventional Commits. Never amend a pushed commit, never
  force-push. `data.js` is one line: two branches that edit it conflict.
- Read the usage at each wake (`orchestrate.prompt.md`, "Usage guards"); create the usage tick when a subagent starts, and delete
  duplicates (two ticks double the wakes). The weekly window (all models) resets on 2026-11-10 at 21:00 UTC; the weekly guard is
  95% (the owner raised it to 98% for the 2026-11-07 session only).
- Stop and report only for: deleting a branch or a worktree, NEEDS_HUMAN_CONFIRMATION: yes, a fable dispatch, an effort
  exception, a gate still red after the one fix cycle, a replan, a product-law change (the print card stays 63x88 mm).
