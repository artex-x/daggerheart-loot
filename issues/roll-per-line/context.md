# Context - TASK roll-per-line

## Goal

Give each distinct item the same roll chance. An upgrade line (an item with tier rungs) is one roll row,
its head. The tier selector on the result card (`RecordCard.svelte`, "ladder") reaches the other tiers.

## Problem

- `items.arazo` has 78 rows: 17 lines of 4 rows (68 rows) and 10 single items.
- A roll draws `rows[n - 1]` (`RollPanel.svelte:66`) and the range is `rows.length` (`RollPanel.svelte:50`).
  The `roll` field is not read when drawing. So a line has 4/78 chance, a single item 1/78.
- The planned source `ph` (branch `claude/new-items`, `issues/new-items/plan.md`) would repeat this:
  64 rungs in 93 rows.
- Only `arazo` has lines inside a roll pool. Campaign frames have lines but are not a roll pool.

## Facts checked at `b6f153a5`

- The result card already shows the tier ladder for a record with `eq.line` (`RecordCard.svelte:164`).
- A rung opened from the ladder swaps the record in the modal (`RecordModal.svelte`).
- `tableOf` (`label.ts:213`) sends every `arazo` record to the `arazo` table before it reads `roll`.
- `L.eq` holds only `core` and `hnf` records and `tests/dataint.js` pins it. Do not move rungs there.
- Rungs read `!it.roll` as "equipment-table record" in `tools/share-card.mjs:271` and `:308`.
  `tools/derived.js:122` and `RecordPage.svelte:51` also read `roll`.
- `docs/decisions/2026-10-08-arazos-artifacts-rebalanced-to-core-bands.md` set rolls 1-78 on purpose.
  This task supersedes the rolls part.

## Settled decisions (owner)

- 2026-11-05: one roll row per item. Task id `roll-per-line`.
- 2026-11-05: the task runs after `new-items` and fixes `arazo` and `ph` together. `new-items` is not changed.
- 2026-11-07 (owner, chat): `vh` (Escape the Veiled Halls) becomes a single flat list with no rooms breakout. This
  task owns it. `new-items` B1 ships `vh` with its room sections, its room picker on the roll page and its random d3
  room (`app/src/lib/rooms.ts`, the `room` column of `catalog.csv`, the `rooms` entry of `names.json`); this task
  removes them where nothing else reads them, makes the `vh` roll one pool over its 15 records, amends the B1
  decision files, and re-seeds the `vh` tables and roll goldens. Plan it with the per-line roll work: both change
  how a roll pool is built.
- Taken as the default by the planner (owner may veto): the public roll ranges shrink (`arazo` 1-78 to 1-27,
  `ph` 1-93 to 1-49), and the result shows the head (Tier 1). A random tier is a different feature.
