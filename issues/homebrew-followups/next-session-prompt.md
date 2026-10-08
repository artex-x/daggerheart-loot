Follow .claude/prompts/orchestrate.prompt.md. The owner is away; stop only for
a decision that is the owner's, with options and a recommendation (use the
AskUserQuestion Q&A form, recommended option first).

0. First, finish task #71 (one batch, B1, terminal). Worktree
   `E:\dev\daggerheart-loot\.claude\worktrees\task-71-list-filters`,
   branch `claude/task-71-list-filters`, HEAD `ba7eae2e` (plan commit) on
   main `fe2903b7`. The batch is implemented, reviewed
   (`issues/71/reviews/B1.md`, fix-then-continue) and remediated
   (B1-1 to B1-8 applied), all UNCOMMITTED in the worktree (53 paths,
   8 new untracked goldens under `tests/app/snapshots/`). Not yet done,
   in order (dispatch one implementer, opus, with
   `issues/71/handoff.md` as its brief):
   - B1-8 handoff Verification text;
   - `rtk npm run check:1`, `rtk npm run check:2`, `rtk npm run
     check:built`, `node tests/run-all.js app/states` (it has a new
     32 px pill measurement in case 5), `node tests/app/sweep.js 360`
     (the golden compare already passed; padding does not move the
     accessibility tree);
   - commit `feat(lists): filter and search on the shared list page`,
     footer `Task: 71` and `Refs #71`, explicit paths;
   - no second review is needed; closeout per /handoff (retire
     `issues/71/`; three dropped rejected alternatives are named in the
     handoff for the owner), rebase on origin/main, push, CI green
     through deploy.
   Then commit the follow-ups plan (item 1 below) - it is staged in its
   worktree; move the session there first so the commit gate judges that
   tree.

Then deliver these releases in order, each as its own release: planned or
refreshed, plan-reviewed when a trigger fires, implemented batch by batch,
batch-reviewed with one remediation cycle, closed out per /handoff, rebased
on origin/main, pushed, and CI green through migrate-prod and deploy. Stop
before `persist-review` (do not start it).

1. `homebrew-followups` (owner feedback on R7h). Worktree
   `E:\dev\daggerheart-loot\.claude\worktrees\homebrew-followups`, branch
   `claude/homebrew-followups`. Its plan is complete and plan-reviewed
   (`reviews/plan-B2.md`, findings applied); owner answers are in its
   `context.md`. Commit the plan files first (they may be staged, not yet
   committed), then rebase on origin/main (it must hold #71: B1 builds on
   #71's `listFacetRows`). Batches: B1 (offer-only filters on every page,
   one-notice panel, Arazo GM notes removed, aa11 «Волшебное Зеркало»), B2
   (official items in own sets and rule cards, Q1 = A, migration and
   `homebrew-v2`).
2. R9 `persist-9-item-share` ("links"): plan in
   `issues/persist-9-item-share/` on main (refreshed, plan-reviewed,
   owner-answered on 2026-10-07). R7h, #70 and the follow-ups shipped since;
   refresh it only where a migration body, contract, security path or
   settled decision it builds on changed (owner rule: no refresh for small
   drift). #70 risk 6: its `get_shared_list` copy must keep `(v_gm or not
   e.gm_only)`, its migrations sort after the newest on main, and
   `#/print/s/<token>/<ids>` reads through `get_shared_list`, never an item
   by id. R7h D93 (drop the null-only `list_entries.snapshot`) belongs to R9.
3. R8 `persist-8-media` ("images"): plan in `issues/persist-8-media/` on
   main, same refresh rule. R8 also redefines `get_shared_list` (adds
   `img`): copy the newest body and keep the GM-only filter.
4. `print-snapshots` and 5. `debt-cleanup`: roadmap rows in
   `issues/persistent-storage/plan.md`; plan each from scratch (planner,
   then plan review when a trigger fires). `print-snapshots` is already
   planned: worktree `.claude/worktrees/print-snapshots`, branch
   `claude/print-snapshots`, commit `5ba2ec57` (unpushed), owner answers
   of 2026-10-08 in its `context.md` (all printing needs sign-in; every
   print is a stored set at `#/p/<id>`; old `#/print/...` links stop
   working - an owner-approved contract break; 90 days after last open;
   180-card cap). It still needs its plan review before B1. IMPORTANT for
   R9 (item 2): R9's refresh must drop its print scope first - the
   routes `#/print/s/<token>/<ids>` and `#/print/h/<uuid>` and everything
   listed in `issues/print-snapshots/plan.md` section 2.5 and its handoff
   Blockers; print-snapshots takes over the print page states, the
   reader's «Печать» on `#/h/` and D70's closure. That is a significant
   change, so R9 does get a refresh and a second plan look.

Standing facts (measured 2026-10-07/08, this host):
- Gates: `rtk npm run check:fast` first, then `rtk npm run check:1` and
  `rtk npm run check:2`, one foreground call each (Bash timeout 600000); a
  half moved to the background arms the gate by its exit - wait for the
  notification, never poll. `check:db` through the PowerShell tool after
  `rdctl start`, with Rancher's `win32\bin` first on PATH; never plain
  `npx supabase start`. Stop the stack and Rancher at the end of each batch.
- The hosted test push: `db-push.mjs` fails here (no IPv6). Use
  `node --env-file=.env.test.local --input-type=module -e "process.env.SUPABASE_DB_URL=process.env.SUPABASE_DB_URL_TEST; await import('./tools/supabase/migrate-test.mjs');"`
  after the batch review approves, then `npm run e2e`.
- Before a release push with a migration: dispatch `gh workflow run
  backup.yml`, wait for success. The restore drill runs from the main
  checkout (production's schema), not from a branch with new migrations.
- One implementer at a time; planners and reviewers may run beside it. A
  `cd` into another checkout moves the whole session - use `git -C` and
  absolute paths while agents run. A reviewer in one worktree cannot write
  into a sibling worktree; save its returned report yourself.
- Bundle budgets: 222 kB unconfigured, 282 kB configured
  (`tools/bundle-budget.mjs`); measure the configured build before a push.
- No attribution trailer in commits; never bypass a hook.
- Host memory (2026-10-08): about 9-10 GB of RAM was held by no visible
  process after 27 h uptime; a reboot clears it. Run one browser suite on
  the host at a time - another session's pooled browser run (about 50
  Chrome processes) plus ours exhausted memory. Before a heavy run, check
  for other `tests/app`, `vitest` or `run-all` node processes and wait.
- After this file's releases, the owner's later items: close GitHub issues
  #70 and #71 when the owner has checked them (the commits say `Refs`).
