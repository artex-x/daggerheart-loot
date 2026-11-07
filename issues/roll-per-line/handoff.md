# Handoff - TASK roll-per-line

## Status
- Task status: in progress (B1 implemented and committed 2026-11-07; B2 next; the code review of B1 and B2 after B2)
- Last agent: implementer (B1, 2026-11-07)
- NEEDS_HUMAN_CONFIRMATION: no
- Plan review: required before B1 (trigger: public contract change) - done 2026-11-07, `reviews/plan-B1.md` (fix-then-continue, applied). B2: not required (no trigger fired).
- Branch: `claude/roll-per-line`
- Base / starting commit: `f278eeee` (`main` merged at `62070925`; `origin/main` had not moved on 2026-11-07)
- Pushed: yes (B1 commit; the orchestrator waits on CI)

## Completed
- Batch name/id: B1 - `vh` is one flat list, and one roll row per item (one commit, Parts A and B, D6).
- What shipped: Part A - the `room` field left the 15 `vh` records, `vh` rolls 1-15 as a whole table through `RollPanel` (`ROLL_TABLE`), `rooms.ts`, the room picker, the `room` filter group, `roomLabel`/`roomF`, the `room` column of `catalog.csv` and `catalog-index.csv`, the `rooms` key of `names.json`, the share-card and preview-host room code are gone. Part B - `roll.ts` `isRung` and `rollPool`, read once in `RollPanel`; `arazo` rolls 1-27, `ph` 1-45, no rung has `roll`; five help paragraphs (RU and EN); pins in `tests/dataint.js` (rung pool, one rolled head per pooled line, ascending rolls) and `tests/derived.js`; specs, READMEs, `llms.txt`, `add-source.prompt.md`; two decision files and five mirror pointers.
- Files changed: `data.js` (script only), `app/src/` (App, RollPanel, PickerRollPanel, TablesPage comment, roll, sectionProps, sections, label comment, data, filters, dict, help, types; `rooms.ts` deleted) and their tests, `tools/derived.js`, `tools/share-card.mjs`, `preview/worker.mjs` and its test, `tests/dataint.js`, `tests/derived.js`, `tests/app/{inventory,states,sweep,contracts}.js`, 38 goldens changed, 2 deleted, 1 new, `docs/fixtures/urls/routes.json`, `docs/specs/{FEATURES,ROUTES,STATE,CONTRACTS,COVERAGE}.md`, `README.md`, `README.ru.md`, `llms.txt`, `.claude/prompts/add-source.prompt.md`, `docs/decisions/` (2 new, 4 amended), `docs/DECISIONS.md`, `issues/roll-per-line/plan.md`, this file.
- Previous sha (batch diff base): `8cb51b0c`
- Deviations and rationale:
  - `CONTRACTS.md` byte measures read from the build, not `tests/derived.js`: `catalog-index.csv` 181825 bytes, `names.json` 109969 bytes.
  - Two older decision files went past the 15-line body limit with the new pointer (`tests/derived.js` registry check); their `Rejected` lines were reflowed onto fewer lines, no word changed except "the catalog capitalizes Experience" to "Experience is capitalized" in the 2026-11-07 source file.
  - `tables.test.ts` rung case does not assert 78 rows: the table page draws its rows over several tasks (`docs/decisions/2026-11-04-a-long-table-draws-its-rows-over-several-tasks.md`), so the first render holds 60; the case checks `aa19` and `aa20` directly.
  - `FEATURES.md` "Nine modes" became "Twelve modes" and `COVERAGE.md` "Eight roll modes" became "Twelve roll modes" (stale counts in touched lines, handoff Deferred).
  - Defaults taken (owner AFK): the `#/roll/arazo ~ help` `why` also names the card route (its golden is in the list anyway); `llms.txt` Arazo and Pistolheart rows gain one sentence each on the 1-27 and 1-45 roll; `preview/worker.test.mjs` fixture gains `tables.vh {n: 15}` so the A6 card reads «15 позиций».
- Review: required (triggers: public contract change, data change); runs after B2 so one review reads both commits.

### B1 acceptance
| Line | Outcome | Proof |
|---|---|---|
| A1 | done | `components/roll.test.ts` vh block (no combobox, no «Комната», «Бросить 1-15», «Результат броска (1-15)», `9` draws «Зелье Внимательности», English twin); golden `_roll_vh` |
| A2 | done (CI replays `tests/app/contracts.js`) | `routes.json` retired-group case (rows 15, `picked: []`, count "15") green in `hash.test.ts`; `PROBE` `['vh', 'kind-consumable']`; golden `_tables_vh` (no section heading) |
| A3 | done | `git grep` for `room`, `ROOM_`, `roomName`, `roomLabel`, `roomF` finds only the retired-case strings and comments; `dataint`, `derived` (`vh` rolls 1-15, no `room`) |
| A4 | done | CSV head check `realm,volume`, `!('room' in idx)`, `names` has no `rooms` (`i18n.test.ts`); budgets hold; `CONTRACTS.md` measures and the D4 exception |
| A5 | done | `routes.json` `why` texts reworded, no live room case; docs edited (read in review) |
| A6 | done | `preview/worker.test.mjs`: both paths draw «Escape the Veiled Halls» / «15 позиций»; `/tables/vh/f_room-basement-library` draws «Открыть в генераторе лута»; 181 pass |
| A7 | done | 2 new files, pointers in 4 older files, `node tools/decisions.js` 322 decisions, `derived` registry check green |
| A8 | done | `STATES` 435; golden shards updated, `golden.test.mjs` green in `check:fast` |
| B1 | done | `lib/roll.test.ts` `rollPool` (order kept, rungs dropped, table without lines unchanged) |
| B2 | done | `components/roll.test.ts`: «Бросить 1-27», `7` draws the head, `28` clamps to 27 «Ларец Зерана», no rung reached over 1-27; «Бросить 1-45», `14` «Разделочный Нож», `46` clamps to 45 «Инфузия Доблести» |
| B3 | done | `dataint` (pool without rungs, one rolled head per pooled line, ascending rolls), `derived` (51 and 48 rungs without roll), `data.test.ts` negative case "refuses a roll on a rung" |
| B4 | done (CI replays the stub check) | `record.test.ts` `ph38` 'Pistolheart · Том 2 · Ранг 2', `ph37` '... · номер 10'; `tests/app/contracts.js` `firstOf` takes `aa20`, `ph38` |
| B5 | done | `tables.test.ts` (head `aa19` row 7, rung `aa20` row no number; tile «Ранг 2» and 7, axe); goldens |
| B6 | done | `help.test.ts` (27, 45, the «Ранг» / "Tier" row sentence, no "own number"); goldens `_roll_arazo_help`, `_roll_ph_help` |
| B7 | done | `FEATURES.md` "Rolling" rule bullet; `add-source.prompt.md` `roll` line; `Superseded in part by` in the 2026-10-07, 2026-10-08 and 2026-11-07 files |
| B8 | done | changed set equals the 38-file list; deleted `_roll_vh_laboratory`, `_tables_vh_library_picked`; new `_tables_vh`; no other golden changed |
| B9 | done | `states.js` case 83 (`--shard=73/108`): `#/roll/vh` 360x640 top 250 / 256 pass (ru, en), 1180x720 174 / 288 |
| B10 | done (CI replays `tests/app/contracts.js`) | retired-group case green in `hash.test.ts`; `PROBE` and its comment "34 opens (22 probes, 12 whole tables)" |
| B11 | done | the step 4a comments rewritten (App, RollPanel, PickerRollPanel, roll.test, inventory, dataint, sectionProps, sections, PROBE) |

Standing checks: scale, error scenarios, consistency and RU/EN parity are answered in `plan.md`, "Batch B1", "Standing checks"; the implementation follows them with no departure (help text in both languages with the same counts; four dictionary lines removed in both).

## Verification
- Commands run (exact) and results:
  - `node C:/.../scratchpad/b1-data.js` - arazo pool 27, ph pool 45, roll maps equal the plan's "Facts"; `node tools/build.js` - 1593 stubs.
  - `node --test preview/worker.test.mjs` - 181 pass.
  - `node tests/run-all.js dataint,derived,contracts` - all suites passed.
  - `npx vitest run` on the 12 touched test files - 836 pass after one fix pass (a heading query, the 60-row first render, the routes case).
  - `rtk npm run check:fast` - run 1 failed at the golden test (`_tables_vh.txt` not seeded yet); run 2 failed on `homebrew.timed.test.ts` (57.8 ms against its 50 ms bound; it failed alone once at 56.4 ms and passed on the next run; B1 changes nothing it reads but `data.js` roll fields); run 3 PASS in 1094 s, 107 files, 4652 tests, budget passed, "gate credit: armed".
  - `npm run build:test` - built.
  - `node tests/app/golden.js --update --shard=n/4`, n = 1 to 4 - shard 1 reported the 2 stale goldens (deleted with `git rm`), shards 2-4 exit 0.
  - `node tests/app/states.js --shard=73/108` (case 83, first screen) - pass; `--shard=79/108` (case 89, roll page layout) - pass.
- CI must still show: the `browser` matrix with `app/contracts` (the `routes.json` replay, the `PROBE` entry for `vh`, the stub-path check with `aa20` and `ph38`), the rest of `app/states`, `app/sweep`, `e2e`.

## Next batch (implement-ready)
- Name: B2 - the `lr` records keep rules, not lore (`plan.md`, "Batch B2").
- Objective: cut the lore text of the 26 `lr` records to rule text, per the "Records" table.
- In scope / Out of scope / Files / Steps / Acceptance: `plan.md`, "Batch B2" (T1-T9).
- Verification commands: `plan.md`, "Batch B2", steps 3, 6 and 7.
- Risks / do-nots: `plan.md`, "Batch B2", "Risks, do-nots". The search goldens B1 re-seeded are re-seeded again on top of B1's tree.
- After B2: the reviewer reads B1 and B2 together; one remediation commit.

## Blockers
- None.

## Deferred
- A "roll a random tier" option (a different feature).
- `FEATURES.md` rule 4 ("seven supplement pages") is stale (ten supplements): not in a line B1 touched; report at closeout.
- The `lr` trim rule for another source (`voa` averages 319 characters, `dv` 228): an owner decision.
- `homebrew.timed.test.ts` "300 cards in under 50 ms" ran 56-58 ms twice on this host on 2026-11-07 and passed once; a bound near its measure, not a B1 defect: report at closeout.

## Notes
- Mocks path: none.
- Interplay with 57-debt VW1: shared goldens `_roll_arazo*`, `_roll_ph*`, `_roll_vh*` are re-seeded by the second task after merging `main`.
- Cleanup performed / retained artifacts: the data script stays in the session scratchpad only.
- Session end partial progress (if any): none
- Durable items written to their homes this batch (file, section): the owner rule in `docs/specs/FEATURES.md` "Rolling" and `.claude/prompts/add-source.prompt.md`; the D4 exception in `docs/specs/CONTRACTS.md` section 4; the retired `room` group in `docs/specs/ROUTES.md` "Filter grammar"; two decisions under `docs/decisions/`.
