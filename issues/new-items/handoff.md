# Handoff - TASK new-items
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (planned and implement-ready; all B0 translations done; B1, all three sources in one batch, waits for task 57 and for the lr and vh pictures)
- Last agent: orchestrator (2026-11-05)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `claude/new-items` (worktree `.claude/worktrees/new-items`; renamed from `claude/pistolheart`, nothing was pushed)
- Base / starting commit: b6f153a5 (`main`, task 57 wave 2b)
- Pushed: no

## Completed
- B0-ph (`8a88092`): ph draft translated, reviewed (`reviews/B0-ph.md`), fix pass applied.
- B0-lr and B0-vh: both drafts translated, reviewed (`reviews/B0-lr.md`, `reviews/B0-vh.md`, both fix-then-continue) and fixed; no second review. Notes: `lr-translation-notes.md`, `vh-translation-notes.md`.
- Kits for lr and vh built outside the repository; drafts copied here (`lr-draft.json`, `vh-draft.json`).
- Files changed: `issues/new-items/` only.
- Previous sha (batch diff base): b6f153a5
- Deviations and rationale: the task grew from one source to three (owner, 2026-11-05).
- Review: not required for repository code (none yet).

## Verification
- Commands run (exact): draft generators and text checks in the session scratchpad (each English text against its PDF text); a name and id collision check against `data.js`.
- Results: ph 93, lr 26 and vh 15 records, 0 text misses beyond listed typo fixes, 0 collisions.
- Gates: none.

## Next batch (implement-ready)
- B0 is done for ph, lr and vh. Next is B1.
- Name: B1 - add the three sources ph, lr and vh in one batch (after task 57)
- Objective: 134 records, 7 references, 86 pictures, three sources wired in the app, tools, tests and docs; the shared section mechanism built once.
- In scope: `plan.md`, "Design", "Touchpoints", "B1 order of work", "Checks that B0 left for B1".
- Out of scope: lr and vh, review, closeout, any redesign of tables or filters, new roll modes.
- Files expected: about 150 (45 pictures x 3 files, `data.js`, derived files, app, tests, goldens, specs).
- Acceptance criteria: every record of `context.md`, "Goal" is in `data.js` with Russian text; the seven refs render with their product link; 86 pictures installed with no `unsourced`; `dataint` reports 1593 records; roll (incl. the vh room picker), tables, search, share stub and print card work for `ph`, `lr` and `vh`; `check:fast` green.
- UI pass (owner, 2026-11-05): `plan.md`, "UI verification at every width": tables, roll, the supplements menu and panel, search, record, list and print at 360-1440 in both languages; findings listed here with route, width, language and number; screenshots in `mocks/`. The pass runs once, at ten supplements; V1 only if a local fix is not enough.
- Verification commands: `node tests/run-all.js dataint,derived,contracts`, `rtk npm run check:fast` (Bash timeout 600000); then `npm run build:test`, the browser suite and `node tests/app/sweep.js <width>` for 360, 390, 768, 1180.
- Risks / do-nots: `plan.md`, "Do-nots". Start only when task 57 is closed.
- Fallback: a flat `ph` table if the volume sections cost more than about 10 files.
- Then: R1 (reviewer, one remediation commit), V1 only if needed, then B3 closeout.

## Blockers
- Task 57 is not closed (waves 2b done, batch 9a pending).
- lr and vh pictures are not generated (the owner is generating them; B1 counts them before the ingest).

## Deferred
- B1 decides whether vh6's English "an experience" is capitalized (the corpus capitalizes Experience; B0 may not change English).

## Notes
- Start prompt for B1 (paste into a new session):

  TASK: new-items. Read CLAUDE.md, then `issues/new-items/context.md`, `plan.md`, `handoff.md`. Check the start gate: `issues/57/` must be gone from `main`; if not, stop and say so. Then in `.claude/worktrees/new-items` run `git merge main`, refresh the touchpoint list as the plan says, and run `.claude/prompts/add-source.prompt.md` for batch B1 (source ph) only. Commit, push the branch, stop.

- One prompt for the whole task (owner, 2026-11-05; the owner generates the lr and vh pictures while it runs):

  TASK: new-items. Work in `.claude/worktrees/new-items` (branch `claude/new-items`). Read CLAUDE.md, then `issues/new-items/context.md`, `plan.md`, `handoff.md`. Start gate: `issues/57/` must be gone from `main`; if not, stop and say so. Run the task as the orchestrator (`.claude/prompts/orchestrate.prompt.md`) and spawn subagents for the work. The owner settled the lr questions on 2026-11-05 (no record for the Mournguard Mark Badge and the letters; one roll pool of 26): record them in the decision file. Order: (1) `git merge main`, refresh the touchpoints, read `docs/DECISIONS.md` for task 57 decisions; (2) B1, all three sources in one batch per `plan.md` (build the shared mechanism with ph first, then lr and vh, the checks B0 left, the UI verification pass at ten supplements); before the ingest of lr and vh count the pictures: `Last Round Table\images` must hold 26 and `Escape the Veiled Halls\images` 15 (the badge picture is not needed); if they are not there, stop, report which are missing, and wait for me; push; (3) R1 reviewer, one remediation commit, push, green CI; (4) V1 only if the UI pass needs more than a local fix; (5) B3 closeout with `/handoff`, squash after green CI. Stop for the human only on a critical case. Report after each batch.

- Durable items written to their homes this batch (file, section): none.
