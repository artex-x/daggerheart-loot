# Context - TASK roll-per-line

## Goal

1. Give each distinct item the same roll chance. An upgrade line (an item with tier rungs) is one roll row, its head. The
   other tiers open from the card (the dialog or the record page), whose tier row lists them.
2. Make `vh` (Escape the Veiled Halls) one flat list of 15 with no rooms.
3. (B2, owner request 2026-11-07) Cut the lore text of the 26 `lr` records to rule text.

## Problem

- `items.arazo` has 78 rows: 17 lines of 4 rows and 10 single items. `items.ph` has 93 rows: 16 lines of 4 and 29 single items.
- `RollPanel.svelte` draws `rows[n - 1]` and takes its range from `rows.length`. It does not read `roll`. So a line has 4/78 chance
  (4/93 in `ph`), a single item 1/78 (1/93).
- Only `arazo` and `ph` have lines inside a roll pool. Campaign frames have lines but are not a roll pool (no row has `roll`).
- `vh` ships (in `new-items`) with a room per record, a room picker on the roll page, a random pick in the three-row room and
  per-room roll numbers. The owner wants one list.

## Facts (checked 2026-11-07 on `main` 49528e95 and `claude/new-items` e3c18ad0)

- Pools after the change: `arazo` 78 -> 27 (17 heads + 10 items), `ph` 93 -> 45 (16 heads + 29 items, the 4 armors among them),
  `vh` 15 (one pool), `lr` 26 (unchanged). The old plan's 49 for `ph` double-counted the armors.
- In every roll pool the rolls ascend in table order today; ids stay.
- The roll result is `RecordCard variant="face"`. The tier ladder draws on `variant="full"` only (the dialog opened by
  «Открыть карточку», the record page). `FEATURES.md` "Rolling": a result draws no ladder (owner, 2026-11-04). The first plan said
  the result card shows the ladder; that was wrong.
- The share card and the stubs already print «Tier N» for a record without `roll` and «Roll N» for a head. `RecordPage` does the
  same. `label.ts` and `share-card.mjs` `tableOf` return `arazo`, `ph`, `lr`, `vh` before the `eq && !roll` line.
- `L.eq` holds only `core` and `hnf` records and `tests/dataint.js` pins it. Do not move rungs there.
- `TableRows.svelte` prints `entry.n ?? it.roll` as a number badge on every table row, the equipment tables and search included.
  So 38 goldens change (the exact list is in `plan.md`, "States and goldens"). In tile view a rung tile draws its tier («Ранг N»), not nothing.
- The `ARAZO` and `PH` help text says each version has its own number so equipment rolls more often; the `VH` help text describes the
  four rooms. All three change.
- `catalog.csv`, `catalog-index.csv` and `names.json` (generated, not committed) carry `room` and `rooms` since `new-items`.
  `CONTRACTS.md` says any other change than a new last column is a new file name (`version` 2 for `names.json`). Decision D4.
- `docs/decisions/2026-10-07-arazos-artifacts-source-...` rejected "roll numbers on the 27 base records only" (the owner then accepted more
  rolls on the scaling pieces); `2026-10-08-arazos-artifacts-rebalanced-...` set rolls 1-78 on purpose; the `new-items` decision of
  2026-11-07 set `ph` rolls equal to ids and rejected a flat `vh` roll. B1 supersedes in part or amends each.
- Task 57-debt batch VW1 (`issues/57-debt/plan-views.md`) rebuilds the roll mode row and sheet. Independent of this task; shared goldens and
  specs are listed in `plan.md`, "Interplay".

## Settled decisions (owner)

- 2026-11-05: one roll row per item. Task id `roll-per-line`. (Owner rule; home `docs/specs/FEATURES.md` "Rolling" and
  `.claude/prompts/add-source.prompt.md`; written by B1.)
- 2026-11-05: the task runs after `new-items` and fixes `arazo` and `ph` together. `new-items` is not changed.
- 2026-11-07 (owner, chat): `vh` becomes a single flat list with no rooms breakout. This task owns it: remove the room sections, the room
  picker on the roll page, the random pick in the three-row room, `app/src/lib/rooms.ts`, the `room` column of `catalog.csv`, the `rooms`
  entry of `names.json` where nothing else reads them; make the `vh` roll one pool over its 15 records; amend the B1 decision files;
  re-seed the `vh` tables and roll goldens. Plan it with the per-line roll work.

## Owner answers of 2026-11-07 (chat, each the recommended option; settled)

- D1: the public roll ranges shrink (`arazo` 1-27, `ph` 1-45); a roll shows the head (Tier 1).
- D2: the other tiers open from «Открыть карточку»; the result face keeps no ladder (the 2026-11-04 rule stands).
- D3 and D5: the `room` field is deleted from the 15 `vh` records (the map goes to the decision file); old `f_room-*` links and the room
  anchors open the whole `vh` table, with no redirect.
- D4: the `room` column and the `rooms` key leave the generated files with no new file name and no `version` 2; the `CONTRACTS.md` sentence
  changes in B1.
- D6 (one batch, two parts) stays the planner's default; the plan review of 2026-11-07 (`reviews/plan-B1.md`) kept it.

What D1-D5 mean in `plan.md`, "Decisions": D2 costs a player who wants Tier 3 two presses (open the card, press the rung); D4 departs from the
`CONTRACTS.md` sentence "any other change is a new file name", and step 9 of B1 rewrites that sentence; D5 is proved by a retired-group case in `routes.json`.

## Owner request of 2026-11-07 (chat; the `lr` trim, batch B2)

- Shrink the lore text of the 26 `lr` records (source `lr`, ids `lr1`-`lr26`) to properties only. Evidence (owner): `lr` descriptions average 344 characters against 147
  for the other 1567 records. Measured on `f278eeee`: `lr` 344 EN / 374 RU; other `L.items` records 171 EN; `voa` 319, `dv` 228.
- Default rule (the owner may change it): keep every sentence that states a rule (a number, a trait, a move, a condition, a limit); drop sentences that only describe appearance, history
  or world flavor; keep at least one sentence per record; the Russian follows the English; the removed text stays in git. Sample: `lr1` Anklebiter becomes "Sitting in Anklebiter as part
  of a Short Rest clears 1 Stress." with the matching Russian sentence.
- Batch B2 in `plan.md`, after B1 (`data.js` is one line, so B1 and B2 conflict if they overlap). The planner's run of the rule: 21 records change, 5 stay (`lr3`, `lr6`, `lr9`, `lr12`, `lr16`);
  EN average 344 to 225, RU 374 to 247; the longest kept text is `lr6` 431 EN and `lr20` 510 RU.
- Facts for B2: `lr6`, `lr8`, `lr20` point at rule cards (`lr-deed`, `lr-recipes`, `lr-fruitcake`) that hold the rules; the cards stay. The trim removes `lr23` from the «меч» search results
  (its only match was in the dropped paragraph). Goldens that print `lr` text: `_roll_lr`, `_tables_lr`, five `_search_*` states (see `plan.md`, T6). No spec names an `lr` text.
