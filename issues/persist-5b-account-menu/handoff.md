# Handoff - TASK persist-5b-account-menu
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned; R5 (`persist-5-migration`) closed 2026-09-26 and
  was pushed; next the section 9 refresh (`plan.md`), with the facts R5's
  closeout checked in `plan.md` section 3
- Last agent: planner (2026-09-26, the R5 refresh copied R5's plan
  sections 4.9 and 9b here)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main` (a local release: one commit, amended per batch, pushed
  once at closeout)
- Base / starting commit: `main` after R5's push (not yet made)
- Pushed: no

## Completed
- Batch name/id: planning (no production code)
- What shipped: `plan.md`, this file, `context.md`, `mocks/b53-account-menu.html`
  and `mocks/mock.css` (copied from R5's mocks; the title names `B5b.1`)
- Files changed: `issues/persist-5b-account-menu/` only
- Previous sha (batch diff base): `d879c9a4`
- Deviations and rationale: the batch is renamed `B5.3` -> `B5b.1` (its own
  task); the states case is 50 (R2 took 43-46, R5 took 47-49); the tab
  check moves here from R5's read-only case, because the tab leaves in
  this release, not in R5
- Review: not required (planning only)

## Verification
- Commands run (exact): none (planning files only)
- Results: -
- Gates: other (no code changed)

## Next batch (implement-ready)
- Name: the section 9 refresh (planner), then `B5b.1` (`plan.md` section 6)
- Objective: the account menu, the Display section of `#/account`, the
  Lists tab gone after the cutoff
- In scope: `plan.md` section 6
- Out of scope: «Мои предметы» (R7), routes, the move (R5)
- Files expected: `plan.md` section 6, "Files"
- Steps: `plan.md` section 6, steps 1-9
- Acceptance criteria: `plan.md` section 6, "Acceptance"
- Verification commands: `plan.md` section 7
- Risks / do-nots: `plan.md` section 6 and the bundle risk in section 7
- Fallback (optional): none

## Blockers
- None. R5 is on `main` (the roadmap's R5 closeout record names the sha
  and the CI run).

## Deferred
- To R7: «Мои предметы» in the menu.
- To R10: the `tab` of `#/lists` in `routes.json` set to `null`.

## Notes
- Mocks path: `issues/persist-5b-account-menu/mocks/` (`b53-account-menu.html`
  on `mock.css`; open from disk)
- Screenshot findings: none (no issue; the mock is composed from the
  current components)
- Cleanup performed / retained artifacts: none
- Session end partial progress (if any): none
- Durable items written to their homes this batch (file, section): none
  (the decision file exists since 2026-09-26)
