# Handoff - TASK pistolheart
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (planned, implement-ready; waits for task 57 to close)
- Last agent: orchestrator (plan review, 2026-11-05)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `claude/pistolheart` (worktree `.claude/worktrees/pistolheart`)
- Base / starting commit: b6f153a5 (`main`, task 57 wave 2b)
- Pushed: no

## Completed
- Batch name/id: 0 - kit, plan review
- What shipped: the image kit and the 45 delivered pictures (outside the repository); `issues/pistolheart/` with `context.md`, `plan.md`, `handoff.md` and `records-draft.json` (93 records, English verified against the PDFs, Russian empty).
- Files changed: `issues/pistolheart/` only.
- Previous sha (batch diff base): b6f153a5
- Deviations and rationale: none.
- Review: not required (no repository code).

## Verification
- Commands run (exact): the draft generator and two checks in the session scratchpad (feature texts against `pdftotext` output; damage rows against the printed tier rows); `node` name and id collision check against `data.js`.
- Results: 93 records, 0 text misses, 16 of 16 lines match the printed rows, 0 collisions.
- Gates: none.

## Next batch (implement-ready)
- B0 is done (2026-11-05): `records-draft.json` carries Russian for 93 records and 4 refs; `translation-notes.md` lists terms and divergences; `reviews/B0.md` (fix-then-continue) is applied, no second review. B1 merges the text as it stands; do not re-translate.
- B1 facts from B0: the product name stays Latin "Pistolheart" in Russian (`volumes.ts` name: "Pistolheart, том N"; the Latin-script data check allows it); the Charge move is «Натиск», War Saddle keeps «Ях!»; the draft refs hold `en`, `ensub`, `ende`, `ru`, `rusub`, `rud`, `url` plus the working fields `title`, `source`, `text`, which are not shipped.
- Name: B1 - add the Pistolheart source (after task 57)
- Objective: 93 records, 4 references, 45 pictures, the source wired in the app, tools, tests and docs.
- In scope: `plan.md`, "Design" and "Touchpoints".
- Out of scope: review, closeout, any redesign of tables or filters, new roll modes.
- Files expected: about 150 (45 pictures x 3 files, `data.js`, derived files, app, tests, goldens, specs).
- Steps: `plan.md`, "B1 order of work".
- Acceptance criteria: every record of `context.md`, "Inventory" is in `data.js` with Russian text; four refs render with a DriveThruRPG link; 45 pictures installed with no `unsourced`; `dataint` reports 1552 records; roll, tables, search, share stub and print card work for `ph`; `check:fast` green.
- Verification commands: `node tests/run-all.js dataint,derived,contracts`, `rtk npm run check:fast` (Bash timeout 600000); then `npm run build:test` and the browser suite once.
- Risks / do-nots: `plan.md`, "Do-nots". Start only when task 57 is closed.
- Fallback: a flat `ph` table if the volume sections cost more than about 10 files.

## Blockers
- Task 57 is not closed (waves 2b done, batch 9a pending).

## Deferred
-

## Notes
- Start prompt (paste into a new session):

  TASK: pistolheart. Read CLAUDE.md, then `issues/pistolheart/context.md`, `plan.md`, `handoff.md`. Check the start gate: `issues/57/` must be gone from `main`; if not, stop and say so. Then in `.claude/worktrees/pistolheart` run `git merge main`, refresh the touchpoint list as the plan says, and run `.claude/prompts/add-source.prompt.md` for batch B1 only. Commit, push the branch, stop.

- Durable items written to their homes this batch (file, section): none.
