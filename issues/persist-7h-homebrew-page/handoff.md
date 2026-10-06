# Handoff - TASK persist-7h-homebrew-page
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (plan review fix-then-continue applied 2026-10-06; next: `B7h.1`)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no (the owner answered Q1 and Q2 on 2026-10-06, `plan.md` 8.1)
- Branch: `claude/r7h-homebrew-replan-275175` (planning); the release branch is the orchestrator's choice
- Base / starting commit: `70fe5598` (on `d997f4f0`, origin/main; R7d closed and live)
- Pushed: no

## Completed
- Batch name/id: none. The planner re-planned the release: `plan.md`
  sections 2-9 (six batches), mocks m02-m05, `context.md` refreshed, and a
  Status note in the R9 and R8 plans.
- What shipped: nothing.
- Files changed: `issues/persist-7h-homebrew-page/`,
  `issues/persist-9-item-share/plan.md`, `issues/persist-8-media/plan.md`.
- Previous sha (batch diff base): -
- Deviations and rationale: the 2026-10-02 single batch `B7h.1` is gone;
  its items 2.1-2.6 are kept and placed in `B7h.5` (2.1-2.5) and `B7h.6`
  (2.6), as the owner's R2 moves the search and the counter onto the tabs.
- Review: plan review `reviews/plan-B7h.1.md` (fix-then-continue, reviewed
  `438b3315`); every finding 1-26 applied once (`plan.md` Status, "Plan
  review findings applied"); findings 19 and 26 placed in `B7h.1` and
  `B7h.4`; finding 9 became owner question Q1. Owner input of 2026-10-06
  (change-log expiry 1 hour after read, or 30 days after creation) applied.
  Owner answers of 2026-10-06: Q1 - conversion rule 3 and the fixed-copy
  branch dropped, any frozen copy the list owner does not hold is deleted
  after an assert of at most one (production counts in `context.md`); Q2 =
  B - purchase requests expire 1 hour after read, or 30 days after
  creation. No second plan review.

## Verification
- Commands run (exact): `npx prettier --check .` (result in the commit
  report).
- Results: planning only; the mocks open from `mocks/index.html`.
- Gates: none.

## Next batch (implement-ready)
- Name: `B7h.1` - W2: the scheduled clean-up in the database (`plan.md`
  section 3).
- Objective: `public.lifecycle_cleanup()` deletes lifecycle rows past their
  retention, `pg_cron` runs it hourly, `create_purchase_request` loses its
  write-time delete, the usage report warns on overdue rows and on a
  failed or missing run, `restore:drill` and `restore:prod` pause the job,
  and the law is a decision file.
- In scope: `plan.md` 2.7 and section 3.
- Out of scope: the change log (B7h.3), every screen and string.
- Files expected: `plan.md` section 3, "Files to create" and "Files to
  edit".
- Steps: `plan.md` section 3, steps 1-9 (step 1 probes `pg_cron` on the
  local stack and stops if it cannot be created; step 5's usage and
  restore edits come before step 6's `check:db`). Gates about 24 minutes.
- Acceptance criteria: `plan.md` section 3, "Acceptance".
- Verification commands: `npm run check:db` (PowerShell tool);
  `rtk npm run check` (Bash, timeout 600000); after the batch review
  approves: `npm run db:push -- --project test`, then `npm run e2e`.
- Risks / do-nots: no execute for `anon`, `authenticated` or
  `service_role` on the function; every test seed in a rolled-back
  transaction; never delete inside a retention or the newest share row of
  an audience; no production push.
- Fallback (optional): if `pg_cron` cannot be created locally or on the
  test project, stop and report; option C of 2.7 (a step of `usage.yml`)
  needs the planner.

## Blockers
- None.

## Deferred
- To the owner, not `DEBT.md`: an author-side count of other players'
  lists that link an item before a delete; live updates on `#/h/` through
  a topic (`plan.md` section 9).

## Notes
- Mocks path: `issues/persist-7h-homebrew-page/mocks/index.html` (m01-m05).
- Screenshot findings: 01 (author) and 02 (reader of a frozen copy) differ
  in «Получается из» and the set members; W1's acceptance line closes it.
  The «(НВ)» look is the Latin «(HB)»: `hbTag` is `'%s (HB)'` in both
  languages of `lib/dict.ts` (checked 2026-10-06); no change.
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none
  (the decision files are written by the batches that establish them).
