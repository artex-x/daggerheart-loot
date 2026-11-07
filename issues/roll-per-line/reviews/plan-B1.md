Verdict: fix-then-continue
Reviewed: f278eeee8ce4da43dc1e1d0b53bb98e8623e6788
Scope: plan before B1

<!-- Written by the orchestrator from the reviewer's hand-back: the write guard refused the reviewer's own write. -->

# Review - plan before B1 (roll-per-line)

The design holds. The pool rule (`rollPool` drops rungs by `eq.line`), the data facts and the reader sweep are correct on
this tree. Two acceptance problems block a clean start: the task documents still say "blocked, decisions open", and step 8
deletes the only tests that prove D5 and A2. The planner can apply every finding below without design work.

Facts recounted on `f278eeee` (main merged at `62070925`):

- Pools: `arazo` 78 rows, 68 line rows, 51 rungs, pool 27. `ph` 93, 64, 48, pool 45. `lr` 26. `vh` 15. `frames` 94/56/42
  (no `roll`).
- The 4 `ph` armors (`ph72`-`ph75`, tiers 1-4, `eq.line: ""`) are singles. `isRung` treats `""` as no line.
- The pool by kind is `ph` 10+3 weapons, 3 secondary, 4 armor, 18 items, 7 consumables, and `arazo` 14+1+2 equipment and 10
  items. The pool by volume is 9/14/22.
- The roll maps of the plan "Facts" match. Spot checks: 7=`aa19` «Лук из Эльфийских Волос», 27=`aa78` «Ларец Зерана»,
  14=`ph53` «Разделочный Нож», 45=`ph93` «Инфузия Доблести», `vh9` «Зелье Внимательности», `vh15` «Легендарное Зелье
  Предвидения».
- In every pool except the room-split `vh`, `roll === index + 1` already holds. Every line's head is its first row, at tier 1.
- `data.js` round-trips as `window.LOOT=` + JSON + `;\n`. `STATES` is 436 and there are 436 goldens.
- Readers of `roll` (`git grep -n "\.roll\b"`): `RecordCard` badge, `RecordPage` path, `TableRows` `rollNum`, `label.ts` and
  `share-card.mjs` `tableOf`, share-card `where`/`subtitle`, `tools/derived.js` CSV, `review.mjs`, and the pins. Readers of
  `rows.length` as a range: `RollPanel` only (`ListPage` rolls its own rows). No sort reads `roll`. Print, og images and search
  ignore it.
- Nothing stored or public keys on a roll number. `STATE.md` "Roll inputs" is memory only. Lists, shares, print sets and pins
  hold ids or section hashes. `docs/fixtures/` names no `aa`/`ph`/`vh` id.

## Blockers

1. The task documents say the task is blocked and D2-D5 are open; an implementer stops.
   - `handoff.md:4` says "blocked (start gate: `new-items` is not on `main`)". `handoff.md:9` says "`main` is not merged yet".
     `handoff.md:34-37` lists the start gate and "Open owner decisions D2 ... D5" as blockers.
   - `plan.md:13` says "the open owner decisions D2 to D5 have a default and are vetoable". `plan.md:139-159` has the heading
     "Decisions (planner defaults; the owner may veto each)", and each D says "owner may veto". `plan.md:16-31` "Start gate"
     still orders the first merge.
   - The gate is open: `issues/new-items/` is gone and `f278eeee` merged `main` at `62070925`. The owner answers of 2026-11-07
     (`context.md`) settle D1-D5.
   - Changes: commit `context.md`. In `plan.md` Status and "Decisions", mark D1-D5 "owner, 2026-11-07, settled" and drop "may
     veto". Mark Start gate step 1 done at `f278eeee`; keep steps 2-4 as the re-run on the merged tree. In `handoff.md`, set the
     status to ready, set Base to `f278eeee`, and leave the plan review as the only blocker. Drop "Owner may veto" from the
     planner-defaults section of `context.md`, or delete it; the owner-answers section replaces it.
2. Acceptance A2 and decision D5 have no remaining proof: step 8 deletes it.
   - A2 (`plan.md:319`): "`f_room-library` opens the whole table; `f_kind-consumable` narrows to 8 (`tests/app/contracts.js`,
     `tests/contracts.js`, ...)". Step 8 (`plan.md:239-240`) removes `['vh', 'room-library']` from `PROBE`
     (`tests/app/contracts.js:370`) and deletes the `f_room-laboratory` case (`docs/fixtures/urls/routes.json:363-376`). With both
     gone, no suite opens `f_room-*` or `f_kind-consumable` on `vh`; `tests/contracts.js` reads neither `room` nor `vh`.
   - Changes: (a) in `PROBE`, replace the entry with `['vh', 'kind-consumable']`, not a deletion. (b) Keep the fixture case and
     rewrite it as the retired-group case: hash `#/tables/escape_the_veiled_halls/f_room-laboratory`, why "a retired room filter:
     the group is unknown, so the table stays whole"; `resolves` gets `rows: 15`, `count: "15"` and `picked: []` (take the exact
     `picked` and `count` from the run); `hash.test.ts` and `tests/app/contracts.js` replay it, so D5 has a contract-file proof.
     (c) In A2's proof list, replace `tests/contracts.js` with "`routes.json` via `hash.test.ts` and `tests/app/contracts.js`".
     (d) In `ROUTES.md` "Filter grammar", add one sentence: `room` on `vh` is a retired group (2026-11-07) and fails open as an
     unknown group; this is part of the contract-change set of D5. (e) Fix the count in the comment at
     `tests/app/contracts.js:372`: it says "33 opens (22 probes, 11 whole tables)"; the array has 22 probes over 12 tables, so
     34; after (a) it stays 34.

## Risks

1. The golden list is not exact, so B8 cannot be checked. `plan.md:308-311` gives "about 42" and "9 to 10" search goldens. B8
   (`plan.md:334`) compares against "the scan list", while `plan.md:311` says "the compare run fixes the list", which is
   circular. A scan of `f278eeee` that compared each numbered row with its new roll, and counted the range strings and the room
   strings, finds exactly 38 changed files, plus 2 deleted and 1 new:
   - Roll (6): `_roll_arazo`, `_roll_arazo_help`, `_roll_ph`, `_roll_ph_help`, `_roll_vh`, `_roll_vh_help`.
   - Tables (3): `_tables_arazo`, `_tables_ph`, `_tables_ph_table_picker`.
   - Equipment (20): `_tables_eq_armor`, `_tables_eq_secondary`, `_tables_eq_secondary_searched`, `_tables_eq_weapon`, and its
     variants `_a_row_opened`, `_a_row_opened_actions_menu`, `_as_gm1`, `_data_notes_from_more`, `_filter_sheet`,
     `_filter_sheet_as_gm1`, `_filter_sheet_two_filters`, `_filtered`, `_grid_searched`, `_header_hidden`, `_mid_band`,
     `_more_menu`, `_own_items_hidden_as_gm1`, `_selecting`, `_table_picker`, `_two_filters`.
   - Search (9): `_search_a_row_ticked`, `_search_capped`, `_search_filter_sheet_as_gm1`, `_search_kind_picked`,
     `_search_own_items_as_gm1`, `_search_own_items_hidden_as_gm1`, `_search_searched`, `_search_selecting`, `_search_stat_line`.
   - `_search_words_in_any_order`, `_tables_voa` and `_tables_voa_section_anchor` are confirmed name clashes (their row is the
     Vault of Ages «Фляга Путника» No. 29, not `aa57`); they stay unchanged. The `vh` rows in the search goldens are
     `vh1`-`vh4`, whose roll stays 1-4.
   - Change: put this list into "States and goldens" and B8, and replace "about 42". Caveat: the scan reads only the rows a
     golden keeps; if removing the number moves a folded run's window (`COVERAGE.md`, `app/golden`, rule A), a listed file can
     show more rows, but no unlisted file should change.
2. In tile view, a rung shows «Ранг N», not "no badge". `TableRows.svelte:212` reads `n = rollNum ? String(rollNum) : hide?.tier ?
   '' : tileTier(it)`, so a rung tile without `roll` draws «Ранг 2» / "Tier 2", the same as a Core weapon tile.
   `_tables_eq_weapon_grid_searched` holds `aa12`-`aa14` tiles. Three places say "no badge" or forbid the new diff: the "Table
   pages" row of the States table (`plan.md:286`), B5 (`plan.md:331`), and the diff vocabulary (`plan.md:313`). Change: "In list
   view a rung row draws no number; in tile view a rung tile draws its tier («Ранг N» / "Tier N") unless the page hides the
   tier"; add "a rung tile's tier badge" to the vocabulary at `plan.md:313`.
3. B4 cites a share-stub check that does not exist, and an existing test breaks without a plan line. `tests/derived.js` has no
   stub path-line check. The `tests/app/contracts.js` check "a share stub names the path its record page does" (`:300-343`)
   takes the first record of each table only: `aa1` and `ph1`, both heads. `app/src/components/record.test.ts:1276-1281`
   expects `#/i/ph38` to read 'Pistolheart · Том 2 · номер 38'; `ph38` is a rung, so after B1 it reads «... · Ранг 2». Change B4's
   proof and step 7: rewrite that test as the rung case ('Pistolheart · Том 2 · Ранг 2', no «номер»); add a head case (`ph37`
   reads «Pistolheart · Том 2 · номер 10»); in `tests/app/contracts.js`, add one rung id per lined pool (`aa20`, `ph38`) to the
   `firstOf` ids of the stub-path check.
4. The help text contradicts the table page (consistency), and one Russian phrase is wrong. "В таблице 27 позиций" / "The table
   holds 27 entries" (ARAZO 1) and "В таблице 45 позиций" (PH 1) sit beside a table page that draws 78 and 93 rows; the routes
   fixture count says "93", and `names.json` `tables` says 78 and 93. «4 брони» is not correct Russian; the four records are
   «Доспех», «Латы», «Грудная Клетка» and «Пыльник». Proposed rows for the help-text table (`plan.md:264-268`):
   - ARAZO 1 RU: «Бросок выбирает из 27 позиций - 10 предметов и 17 единиц снаряжения (оружие и броня), в порядке книги. Кости
     на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно.»
   - ARAZO 1 EN: "A roll picks from 27 entries - 10 items and 17 pieces of equipment (weapons and armor), in the book's own order.
     No die covers that range, so the button picks an entry at random."
   - PH 1 RU: «Бросок выбирает из 45 позиций трёх томов - 18 предметов, 7 расходников, 16 единиц оружия и 4 доспеха, в порядке
     книг. ...»
   - PH 1 EN: "A roll picks from 45 entries over three volumes - 18 items, 7 consumables, 16 weapons and 4 armors, in the books'
     own order. ..."
   - `VH` and `LR` keep «В таблице/В разделе», because their table and pool are the same size. Name this as the reason for the
     departure from the `LR` sibling.
5. The `vh` first-screen check at 360 px goes away, but the States table still claims it. The only 256 px assertion for `vh` is
   `tests/app/states.js:6589`, inside the `.pick select` route loop (`:6562-6603`) that step 8 removes the route from.
   `FIRST_SCREEN` (`states.js:5612`) has no `#/roll/vh` entry, so the "360 px and 1180 px" row (`plan.md:287`) has no proof.
   Change: add `{ state: '#/roll/vh', shipped: true }` to `FIRST_SCREEN` (at 360x640 its default limit `0.4 * vh` is the same 256
   px). The word-break check in that loop also loses `vh`. VW1 edits `states.js`, so merge it by hand, as text ("Interplay").
6. Two error scenarios and one reader are not named (no data loss). Stale tab, old bundle with new `data.js`, on
   `#/tables/escape_the_veiled_halls`: the old `propSections` (`TablesPage.svelte:455-465`) drops every row whose `room` matches
   no section, so the body is empty; the recovery is a reload; nothing is stored. List and share pages: `ListPage` and
   `SharedListPage` rows go through `TableRows`, so a stored rung in a list loses its number badge, and a head's badge changes
   (`aa19` 19 -> 7); no golden shows it, because the seeded lists hold no `aa`/`ph` row. Change: add the first to Standing check 2
   (`plan.md:290-296`) and the second to the States table.

## Nits

1. `local`: `plan.md:249` and `:250` quote the 2026-11-07 decision as "Pistolheart, The Last Round Table and Escape the Veiled
   Halls are sources ph, lr and vh". The file's title is "Pistolheart, The Last Round Table and Veiled Halls are sources ph, lr
   and vh", and `tools/decisions.js` validates pointer titles.
2. `local`: B3 (`plan.md:329`) "every `eq.line` has one rolled record" contradicts step 6 (`plan.md:221`), "at most one":
   `frames` and `L.eq` lines have none. Write "every line inside a roll pool has exactly one rolled record, its head; every other
   line has none".
3. `local`: `data.test.ts`: add a negative case "a roll on a rung is refused" next to "rejects missing members, outside rolls,
   duplicates, and gaps" (`data.test.ts:103`).
4. `local`: Plan line 137 says "`README.md` says what the column means"; it does not. `README.md:441` and `README.ru.md:455`
   (`roll`: "number in its own table"): add "empty on an upgrade line's rungs". `llms.txt:65-74`: add the same sentence for the
   `roll` column. `README.md:226-227` and `README.ru.md:231-233` say the `ph` "id number [is] the roll": name that sentence in
   step 9, next to the `vh` sentence in the same paragraph.
5. `local`: Comments that the touched paths make false; fix them in B1: `App.svelte:15-19` and `:135` ("four sections");
   `RollPanel.svelte:5-13` ("five sections", it names three whole tables of six); `PickerRollPanel.svelte:4-10`;
   `components/roll.test.ts:210-211` (rungs roll as own rows) and `:455` ("three whole-table rolls");
   `tests/app/inventory.js:966-967`; `tests/dataint.js:70-71` (the `vol` comment names the room); `sectionProps.ts:3-6`.
6. `local`: `routes.json:156` ("a room, then a roll inside it") and `:351` ("a table sectioned by room") keep the word room.
   Add them to step 8.
7. `local`: Add `preview/worker.test.mjs:1660-1662` (the room-anchor card `/tables/escape_the_veiled_halls/laboratory`) to the
   "Preview host" row of "Code references". Make A6 exact: the anchor returns title «Escape the Veiled Halls» and description
   «15 позиций»; `/tables/vh/f_room-basement-library` returns the description «Открыть в генераторе лута» (`TEXT.open`; no
   labeled group is left).
8. `local`: `handoff.md:28` folds "In scope", "Out of scope", "Files expected", "Steps" and "Acceptance criteria" of the template
   into one pointer bullet. Give each template field its own line; each can still point to the plan.

## Deviations

- The handoff records that the 2026-11-05 plan is replaced by this refresh (`plan.md`, "What changed since the 2026-11-05
  plan"). Accepted. Each change in that table matches the code on `f278eeee`: the `ph` pool is 45, the result face is
  `variant="face"` with no ladder, the pool rule is structural, and it runs once in `RollPanel`.
- D4 departs from the text of `CONTRACTS.md` section 4 ("any other change is a new file name" / "`version` 2"). The owner settled
  it on 2026-11-07. The same-commit set in step 9 rewrites that sentence and the byte measures (183817 and 110056 bytes today),
  and `tests/derived.js:2592` (the `realm,volume,room` head) changes with it. Accepted, with Blocker 2(d) for the address half.

## Standing checks

1. Scale: checked. `RollPanel.svelte` (`max`, `NumberField` clamp, `empty`) and `roll.ts` `REAL_DICE` (15, 27 and 45 are not dice);
   pools recounted: 27, 45 and 15. The States table was read against `TableRows.svelte`, `RowMain.svelte`, `FIRST_SCREEN` and
   `ROLL_FIT`. No collection with a limit is drawn. Gaps: the tile badge (Risk 2) and the 360 px proof for `vh` (Risk 5).
2. Error scenarios: checked. `STATE.md` "Roll inputs" (memory only), the list, share and print shapes (ids only), and both
   stale-tab directions against `PickerRollPanel`, `sections.ts` and `TablesPage` `propSections`. The preview worker's `has()`
   (`worker.mjs:67`) accepts a missing `rooms`, so the deploy order is safe. No write path and no stored data are lost. The
   unnamed scenarios are in Risk 6.
3. Consistency: checked. `FEATURES.md` "Consistency rules" 1-8 and the siblings `lr`/`dv` (whole-table roll) and `#/tables/lr`
   (kind row, no sections). A head shows «номер N» and a rung shows «Ранг N» on the record page and in the stub
   (`RecordPage.svelte:51-53`, `share-card.mjs:329,340`). The departure is the help-text count against the table page (Risk 4).
4. RU/EN parity: checked. The five help paragraphs in `help.ts` (ARAZO 1 and 3, PH 1 and 2, VH 1) and the proposed RU/EN pairs.
   The facts agree (27/45/15, the base version, the «Ранг»/"Tier" row, which is `dict.ts` `tier`). No plural, ASCII punctuation,
   and `README.ru.md` mirrors `README.md`. `roomLabel` and `roomF` leave both language blocks of `dict.ts` and `share-card.mjs`
   `TEXT`. Defect: «4 брони» (Risk 4).

Owner rules: checked. "One roll row per item; a rung has no `roll`" (owner, 2026-11-05): homes `FEATURES.md` "Rolling" (two
lines) and `.claude/prompts/add-source.prompt.md:73` (the `roll` field line), both written in B1 (step 9, B7). "`vh` is one
flat list" (owner, 2026-11-07): home is the new decision file plus `FEATURES.md`. The D1-D5 owner answers exist only in the
uncommitted `context.md` (Blocker 1).

## Suggested next action

The planner applies Blockers 1-2, Risks 1-6 and the `local` nits as written, then adds `- Plan review findings applied:` to
`plan.md` Status and commits `context.md`, `plan.md` and `handoff.md`. The implementer then runs B1 with no second plan look.
Batch sizing stands: D6 is owner-settled. The two parts share the seed, `RollPanel`, both pool builders and the shared goldens,
and a split would cost one more CI run and about 45 min.

Interplay with 57-debt VW1 (`issues/57-debt/plan-views.md`, planned at `3c0c89b3`, not implemented) is consistent. VW1 lists
"Out: the vh rooms (task roll-per-line)" and names the shared roll goldens. The second task to land re-seeds them after the
merge.

## Checks still needed

- None could run here: the reviewer cannot run npm scripts or the browser suites.
- In B1: `node tests/run-all.js dataint,derived,contracts`, `rtk npm run check:fast`, `npm run build:test`, the four `golden.js
  --update` shards with the changed set compared against the 38-file list, and `node tests/run-all.js app/states`.
- `app/contracts` replays the rewritten `routes.json` case and the `vh` `PROBE` entry. The plan's local gates do not run it (555
  s), so CI's `browser` matrix must show it green before the squash. Take the real `picked` and `count` of the retired-room case
  from that run, or from `hash.test.ts`.
