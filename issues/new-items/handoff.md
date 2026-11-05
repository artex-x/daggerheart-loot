# Handoff - TASK new-items
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (planned and implement-ready; all B0 translations done; B1 waits for task 57, B2 waits for art)
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
- Name: B1 - add the Pistolheart source (after task 57)
- Objective: 93 records, 4 references, 45 pictures, the source wired in the app, tools, tests and docs; the pattern B2 copies.
- In scope: `plan.md`, "Design", "Touchpoints", "B1 and B2 order of work".
- Out of scope: lr and vh, review, closeout, any redesign of tables or filters, new roll modes.
- Files expected: about 150 (45 pictures x 3 files, `data.js`, derived files, app, tests, goldens, specs).
- Acceptance criteria: every ph record of `context.md` is in `data.js` with Russian text; four refs render with a DriveThruRPG link; 45 pictures installed with no `unsourced`; `dataint` reports 1552 records; roll, tables, search, share stub and print card work for `ph`; `check:fast` green.
- UI pass (owner, 2026-11-05): `plan.md`, "UI verification at every width": tables, roll, the supplements menu and panel, search, record, list and print at 360-1440 in both languages; findings listed here with route, width, language and number; screenshots in `mocks/`. B2's pass decides; V1 only if a local fix is not enough.
- Verification commands: `node tests/run-all.js dataint,derived,contracts`, `rtk npm run check:fast` (Bash timeout 600000); then `npm run build:test`, the browser suite and `node tests/app/sweep.js <width>` for 360, 390, 768, 1180.
- Risks / do-nots: `plan.md`, "Do-nots". Start only when task 57 is closed.
- Fallback: a flat `ph` table if the volume sections cost more than about 10 files.
- Then: R1 (reviewer), then B2 when the lr and vh pictures are accepted (1593 records), then B3 closeout.

## Blockers
- Task 57 is not closed (waves 2b done, batch 9a pending).
- lr and vh pictures are not generated.

## Deferred
- Owner confirmations still open: no record for the Mournguard Mark Badge and the four letters (lr); one pool of 26 for lr.
- B2 decides whether vh6's English "an experience" is capitalized (the corpus capitalizes Experience; B0 may not change English).

## Notes
- Start prompt for B1 (paste into a new session):

  TASK: new-items. Read CLAUDE.md, then `issues/new-items/context.md`, `plan.md`, `handoff.md`. Check the start gate: `issues/57/` must be gone from `main`; if not, stop and say so. Then in `.claude/worktrees/new-items` run `git merge main`, refresh the touchpoint list as the plan says, and run `.claude/prompts/add-source.prompt.md` for batch B1 (source ph) only. Commit, push the branch, stop.

- Start prompt for the rest (new session, after B1 is merged to the branch and the art is ready):

  TASK: new-items. Same reading. Run R1 on B1, apply one remediation commit, then B2 (sources lr and vh, as `plan.md` says), then B3 closeout with `/handoff`. Report after each batch.

- Durable items written to their homes this batch (file, section): none.
