# Handoff - TASK persist-9-item-share
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: blocked - waiting for R7h to close and for the
  orchestrator's routing of the `updated_at` migration (`plan.md` 3.9); the
  owner answered Q9-6 to Q9-10 on 2026-10-07; the plan review before `B9.1`
  is done (fix-then-continue, findings applied)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `claude/r7h-homebrew-replan-275175` (planning only; R7h is
  implemented in the same worktree)
- Base / starting commit: `ac23ce36`
- Pushed: no

## Completed
- Batch name/id: planning pass 2 (2026-10-07, refresh against R7h).
- What shipped: `plan.md` rewritten (the 2026-10-02 design superseded by
  R7h W1; `B9.1`, and `B9.0` only if R7h does not carry `updated_at`),
  `context.md` refreshed, mocks m37-m39 and a new `mocks/index.html`; the
  owner's answers of 2026-10-07 applied (`plan.md` section 9). No
  production code.
- Files changed: `issues/persist-9-item-share/**` only.
- Previous sha (batch diff base): not applicable (no task commit yet).
- Deviations and rationale: the share tokens, `homebrew_shares`, contract
  case P and the share panel are not built (R7h W1); the old `B9.1`
  (schema) and `B9.2` (screens) became one screen-only batch; Q9-8 B's
  `updated_at` key is recommended into R7h B7h.3 (`plan.md` 3.9, R1), else
  R9 gets the schema batch `B9.0` (7.3) and a new plan-review line.
- Review: plan review required before `B9.1` (trigger: a public contract
  change - `#/print/s/<token>/<ids>` and `#/print/h/<uuid>`); report
  `issues/persist-9-item-share/reviews/plan-B9.1.md`, verdict
  fix-then-continue; findings 1-17 applied once (`plan.md` Status, "Plan
  review findings applied"); 18 is R7h's (recorded in R7h's `context.md`
  by the orchestrator). No second look follows.

## Verification
- Commands run (exact): `npx prettier --check issues/persist-9-item-share`
  (after the owner's answers were applied, 2026-10-07).
- Results: "All matched files use Prettier code style!" (exit 0).
- Gates: none.

## Next batch (implement-ready)
- Name: `B9.1` - the print routes, the print wait, the item page and the
  shared page (`plan.md` 7.2), after R7h's closeout (and after `B9.0` if
  the orchestrator places the `updated_at` migration in R9); the plan
  review's findings are applied.
- Objective: a homebrew item of another account prints from an address that
  survives a reload; no print or shared page flashes an empty state while it
  reads; a reader gets «Печать» on `#/h/`; `#/h/` re-reads every 45 s and
  draws «Обновлено N назад»; `#/h/` and `#/s/` announce what changes while
  they are open.
- In scope: `plan.md` section 3 (except 3.9's database half), D65, D70; for
  each detail R7h B7h.4 did not ship, Q9-9 (a)-(g).
- Out of scope: any database change; R7h's pages beyond `plan.md` 3.6.
- Files expected: `plan.md` 7.2, "Files to edit".
- Steps: `plan.md` 7.2, steps 1-12 (step 1 refreshes the R7h names and
  assumptions (a)-(e) of 3.0 and stops if the item view has no per-view
  index, `refresh()` or retry, or if `recordFor` does not find a linked
  foreign item on every route, or if `get_homebrew_item` does not answer
  `updated_at`).
- Acceptance criteria: `plan.md` 7.2, "Acceptance".
- Verification commands: `rtk npm run check` (timeout 600000),
  `npm run build:test`, `npm run check:built`,
  `node tests/run-all.js app/states`, `node tests/run-all.js app/contracts`,
  `node tests/run-all.js app/print`, the golden re-seed of the new states,
  `node tests/app/golden.js --shard=n/4` (n = 1-4, one per call),
  `node tests/app/sweep.js 360`, `rtk npm run check` again. About 62 min.
- Risks / do-nots: `plan.md` 7.2, "Do not"; section 10.
- Fallback (optional): if R7h does not carry `updated_at`, the planner
  expands `B9.0` (`plan.md` 7.3; about 25 min) and writes its required
  plan-review line (a migration that replaces a definer function `anon`
  executes; the answer reveals the edit time) before it runs.

## Blockers
- Orchestrator: route the `updated_at` key of Q9-8 B (`plan.md` 3.9).
  Recommended R1: R7h B7h.3 answers it (not yet committed) and B7h.4's
  privacy text names the edit time; else R9 `B9.0`.
- R7h closes first (owner R1); `B9.1` reads its item page, item view and
  seed.
- Owner's Q9-9 A: the orchestrator carries Q9-9 (a)-(g) to R7h `B7h.4`'s
  acceptance (3.8's strings may go with them).
- Roadmap: the orchestrator adds the owner's later "print snapshots"
  release (`plan.md` section 10) when it updates R9's rows.

## Deferred
- One shared component for the visually hidden status regions (`.said`,
  `.lsaid`, `.rsaid`, the item page's) - a `debt-cleanup` candidate, named
  to the owner.
- plan-B9.1-17: a print note for own items that a `#/print/<ids>` address
  handed to another GM drops silently. Reason: a new user-visible state and
  string outside D70, and the owner accepted the silent drop as Q9-2 A's
  trade-off (Q9-10 A keeps it); `unknownHb` makes it cheap later. A
  `persist-review` candidate, named to the owner (`plan.md` section 10).

## Notes
- Mocks path: `issues/persist-9-item-share/mocks/index.html` (m37-m39 new;
  m30-m36 superseded, kept for the record).
- Screenshot findings: none (no issue screenshots); R7h's m03 is the base
  of `#/h/`.
- Cleanup performed / retained artifacts: the 2026-10-02 plan is in git at
  `ac23ce36` (`git show ac23ce36:issues/persist-9-item-share/plan.md`).
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none;
  `B9.1` writes the decision file and the specs (`plan.md` 7.2 step 11).
