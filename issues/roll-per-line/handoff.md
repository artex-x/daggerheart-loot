# Handoff - TASK roll-per-line

## Status
- Task status: ready (plan reviewed and the findings applied 2026-11-07; B1 implement-ready; nothing implemented)
- Last agent: planner (plan review applied, B2 added, 2026-11-07)
- NEEDS_HUMAN_CONFIRMATION: no
- Plan review: required before B1 (trigger: public contract change - `room` filter group, `room` column of `catalog.csv` and `catalog-index.csv`, `rooms` key of `names.json`, roll range of three routes) - done 2026-11-07, `reviews/plan-B1.md` (fix-then-continue, every finding applied; `plan.md` Status carries the "Plan review findings applied" line). B2: not required (no trigger fired).
- Branch: `claude/roll-per-line`
- Base / starting commit: `f278eeee` (`main` merged at `62070925`; `new-items` is on `main`)
- Pushed: no

## Completed
- Batch name/id: none implemented. Planning: the 2026-11-07 refresh, the B1 plan review, and this pass.
- What shipped: nothing. This pass applied the plan review (Blockers 1-2, Risks 1-6, nits 1-8), settled D1-D5 (owner, 2026-11-07), and added batch B2 (the `lr` trim, owner request N9).
- Files changed: `issues/roll-per-line/plan.md`, `handoff.md`, `context.md`, `reviews/plan-B1.md`
- Previous sha (batch diff base): `f278eeee`
- Deviations and rationale: the 2026-11-05 plan stays replaced (`plan.md`, "What changed since the 2026-11-05 plan"). D4 departs from the `CONTRACTS.md` sentence on new file names; the owner settled it and B1 step 9 rewrites the sentence.
- Review: required (trigger: public contract change), report `issues/roll-per-line/reviews/plan-B1.md` - done, fix-then-continue, applied. The code review of B1 is still to run after B1 (triggers: public contract change, data change); B2 is implemented before it, so one review reads both.

## Verification
- Commands run (exact): the planner's reads of `data.js`, the goldens and the specs with `git grep`; `node tools/desc-style.mjs` (current tree and a scratchpad copy of `data.js` with the B2 trim: both print "0 texts differ in EN and RU shape with no exception" and "0 texts in 0 records change"); node scripts over `data.js` (lengths, paragraph and markup shape of the B2 keep map, search-term check).
- Results: B2 map: 21 `lr` records change, 5 stay; EN average 344 to 225, RU 374 to 247; EN and RU markup shape equal for all 26; `lr23` leaves the «меч» search. Pool counts of the plan review (27, 45, 15) were recounted by the reviewer on `f278eeee`.
- Gates: none run (no code changed; plan documents only).

## Next batch (implement-ready)
- Name: B1 - `vh` is one flat list, and one roll row per item (one commit, two parts)
- Objective: Part A removes the `vh` rooms (data, room picker, `rooms.ts`, the `room` filter, the `room` column, the `rooms` key) and makes `vh` a whole-table roll of 15. Part B gives each distinct item one roll row: `rollPool` drops a line's rungs, the data of `arazo` and `ph` loses `roll` on rungs and renumbers heads and items (27 and 45).
- In scope: `plan.md`, "Batch B1", "In scope" (Part A, Part B, decisions and rule writes).
- Out of scope: `plan.md`, "Batch B1", "Out of scope" (a random tier, a ladder on the result face, moving rungs to `L.eq`, renumbering ids, `lr` (that is B2), other sources, the roll pages' head and mode row (57-debt VW1), weights).
- Files expected: `plan.md`, "Batch B1", "Files" and the "Code references" table (create 2 decision files and the golden `_tables_vh`; delete `rooms.ts` and 2 goldens; edit the rest).
- Steps: `plan.md`, "Batch B1", "Steps (ordered)" 1 to 14, including 4a (stale comments), the help-text table and the roll maps in "Facts". Start: the "Start gate" steps 2-4 on the merged tree (step 1 is done at `f278eeee`; merge `main` again only if it moved).
- Acceptance criteria: `plan.md`, "Batch B1", "Acceptance": A1-A8, B1-B11. The changed golden set is the exact 38-file list of "States and goldens" (plus 2 deleted, 1 new).
- Verification commands: `node tests/run-all.js dataint,derived,contracts`; `rtk npm run check:fast` (Bash timeout 600000, background if past 600 s); `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to 4, one at a time; `node tests/run-all.js app/states` in the background; push; CI (its `browser` matrix must show `app/contracts` green before the squash).
- Risks / do-nots: ids stay; rungs stay in their tables; no hand edit of `data.js`, generated files or goldens; one `rollPool` call, in `RollPanel`; the pool filter is structural, not `roll != null` (the `sections.test.ts` fixtures have no `roll`); no redirect for `f_room-*`; the changed golden set must equal the 38-file list; VW1 also edits `states.js` and `inventory.js` (merge by hand as text).
- Fallback (optional): none. D4 is settled; the plan review kept the batch whole.
- After B1: B2 - the `lr` records keep rules, not lore (`plan.md`, "Batch B2"). Start only when B1's commit is on the branch (`data.js` is one line). Owner request N9; the rule is the owner's default and may change. One data script, eight goldens, one decision file, about 1 weekly point.

## Blockers
- None. (Plan review of B1 is done; D1-D5 are settled; the start gate is open.)

## Deferred
- A "roll a random tier" option (a different feature).
- Stale counts in `COVERAGE.md` ("411 states", "Eight roll modes") and `FEATURES.md` rule 4 ("seven supplement pages"): fix the lines B1 touches, report the rest at closeout.
- The `lr` trim rule for another source (`voa` averages 319 characters, `dv` 228): an owner decision.

## Notes
- Mocks path: none (the `vh` roll page becomes the whole-table page already drawn for `lr`; golden `_roll_lr` is the reference).
- Screenshot findings: none taken; the evidence is the golden text of `_roll_arazo`, `_tables_arazo`, `_tables_eq_weapon` (the number badge) and the code.
- Interplay with 57-debt VW1: no fixed order; shared goldens `_roll_arazo*`, `_roll_ph*`, `_roll_vh*` are re-seeded by the second task after merging `main` (`plan.md`, "Interplay").
- Cleanup performed / retained artifacts: scratch scripts and a trimmed `data.js` copy in the planner's scratchpad only; nothing retained in the repository outside `issues/roll-per-line/`.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none yet (B1 writes the owner rule to `FEATURES.md` "Rolling" and `add-source.prompt.md`, and two decisions; B2 writes one decision and, if the owner confirms, one clause in `add-source.prompt.md`).
