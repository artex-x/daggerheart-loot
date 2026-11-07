# Handoff - TASK roll-per-line

## Status
- Task status: blocked (start gate: `new-items` is not on `main`)
- Last agent: planner (refresh of 2026-11-07)
- NEEDS_HUMAN_CONFIRMATION: no
- Plan review: required before B1 (trigger: public contract change - `room` filter group, `room` column of `catalog.csv` and `catalog-index.csv`, `rooms` key of `names.json`, roll range of three routes)
- Branch: `claude/roll-per-line`
- Base / starting commit: HEAD `04154532` (docs only); the code in `plan.md` is read from `main` `49528e95` and `claude/new-items` `e3c18ad0`. `main` is not merged yet.
- Pushed: no

## Completed
- Batch name/id: none
- What shipped: nothing; the plan was refreshed (data facts, code references, the `vh` flat list, VW1 interplay, standing checks, batch size).
- Files changed: `issues/roll-per-line/plan.md`, `handoff.md`, `context.md`
- Previous sha (batch diff base): `04154532`
- Deviations and rationale: the 2026-11-05 plan is replaced; see `plan.md`, "What changed since the 2026-11-05 plan".
- Review: required (trigger: public contract change), report `issues/roll-per-line/reviews/plan-B1.md` - not run yet

## Verification
- Commands run (exact): reads of `main` and `claude/new-items` with `git show` and `git grep`; node scripts over `data.js` of `e3c18ad0` (pool counts, line structure, roll order, name lookups); a scan of the `e3c18ad0` goldens for numbered arazo, ph and vh rows.
- Results: `arazo` pool 27, `ph` pool 45 (the first plan said 49: wrong), `vh` 15; rolls ascend in table order in every pool; 36 goldens print a numbered arazo, ph or vh row.
- Gates: none run (no code changed).

## Next batch (implement-ready)
- Name: B1 - `vh` is one flat list, and one roll row per item (one commit, two parts)
- Objective: Part A removes the `vh` rooms (data, room picker, `rooms.ts`, the `room` filter, the `room` column, the `rooms` key) and makes `vh` a whole-table roll of 15. Part B gives each distinct item one roll row: `rollPool` drops a line's rungs, the data of `arazo` and `ph` loses `roll` on rungs and renumbers heads and items (27 and 45).
- In scope / out of scope / files / steps / acceptance: `plan.md`, "Batch B1" (steps 1 to 14, acceptance A1 to A8 and B1 to B8, the help-text table, the roll maps, the golden count).
- Start gate: `new-items` closed and squashed on `main`; then merge `main`, re-run the symbol list and the pool scan (`plan.md`, "Start gate"). Do not start before the plan review of B1 is an approve, or a fix-then-continue with a `- Plan review findings applied:` line in `plan.md` Status.
- Verification commands: `node tests/run-all.js dataint,derived,contracts`; `rtk npm run check:fast` (Bash timeout 600000, background if past 600 s); `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to 4, one at a time; `node tests/run-all.js app/states` in the background; push; CI.
- Risks / do-nots: ids stay; rungs stay in their tables; no hand edit of `data.js`, generated files or goldens; one `rollPool` call, in `RollPanel`; the pool filter is structural, not `roll != null` (the `sections.test.ts` fixtures have no `roll`); no redirect for `f_room-*`; the changed golden set must equal the scan list.
- Fallback (optional): if the plan review or the owner vetoes D4 (the generated-file change), split: Part A becomes B1, Part B becomes B2. Part B touches no `vh` file.

## Blockers
- `new-items` is not on `main` (the start gate).
- Plan review of B1 not run (required).
- Open owner decisions, each with a default (vetoable): D2 (the other tiers open from «Открыть карточку», two presses), D4 (remove the generated `room` column and `rooms` key without a new file name, against the text of `CONTRACTS.md`), D3 (delete the `room` field), D5 (no redirect for `f_room-*`). D1 and D6 carry over.

## Deferred
- A "roll a random tier" option (a different feature).
- Stale counts in `COVERAGE.md` ("411 states", "Eight roll modes") and `FEATURES.md` rule 4 ("seven supplement pages"): fix the lines B1 touches, report the rest at closeout.

## Notes
- Mocks path: none (the `vh` roll page becomes the whole-table page already drawn for `lr`; golden `_roll_lr` is the reference).
- Screenshot findings: none taken; the evidence is the golden text of `_roll_arazo`, `_tables_arazo`, `_tables_eq_weapon` (the number badge) and the code.
- Interplay with 57-debt VW1: no fixed order; shared goldens `_roll_arazo*`, `_roll_ph*`, `_roll_vh*` are re-seeded by the second task after merging `main` (`plan.md`, "Interplay").
- Cleanup performed / retained artifacts: scratch scripts and a snapshot copy in the planner's scratchpad only.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none yet (B1 writes the owner rule to `FEATURES.md` "Rolling" and `add-source.prompt.md`, and two decisions).
