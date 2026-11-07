# Plan - TASK roll-per-line

Facts: `context.md`. Branch `claude/roll-per-line`. Refreshed 2026-11-07 against `main` at `49528e95` (task 57 closed)
and `claude/new-items` at `e3c18ad0` (the code this task edits: it adds `ph`, `lr`, `vh` and the section descriptor).
Plan review of B1 done 2026-11-07 on `f278eeee` (main merged at `62070925`): `reviews/plan-B1.md`, findings applied below.
The first plan (2026-11-05) was written against `b6f153a5`; this refresh replaces it. Symbols, not line numbers, are
the address of an edit: line numbers drift (the numbers below are `new-items` at `e3c18ad0` unless a column says `main`).

## Status

- State: B1 implemented 2026-11-07 (one commit, Parts A and B; handoff "Completed"); B2 (the `lr` trim) is next, then the B1 review.
- Plan review: required before B1 (trigger: public contract change - the `room` filter group of `vh`, the `room`
  column of `catalog.csv` and `catalog-index.csv`, the `rooms` key of `names.json`, the roll range of three routes) - done 2026-11-07, reviews/plan-B1.md (fix-then-continue)
- Plan review findings applied: reviews/plan-B1.md
  - Blocker 1, Status, "Start gate", "Decisions", `context.md`, `handoff.md`: D1-D5 settled (owner, 2026-11-07), "may veto" dropped, start gate step 1 done at `f278eeee`, handoff ready.
  - Blocker 2, step 8, step 9, A2: `PROBE` entry becomes `['vh', 'kind-consumable']`; the `f_room-laboratory` case becomes the retired-group case; `ROUTES.md` "Filter grammar" gets one sentence; A2's proof names `routes.json` via `hash.test.ts` and `tests/app/contracts.js`; the `PROBE` comment reads 34.
  - Risk 1, "States and goldens", B8: the exact list of 38 changed, 2 deleted, 1 new goldens replaces "about 42".
  - Risk 2, "Code references", "Standing checks", B5, "States and goldens": a rung tile draws its tier in tile view; "a rung tile's tier badge" joins the diff vocabulary.
  - Risk 3, step 7, step 8, B4: `record.test.ts` rung case and head case; `aa20` and `ph38` join the stub-path check.
  - Risk 4, "Help text": `ARAZO` 1 and `PH` 1 read «Бросок выбирает из N позиций» / "A roll picks from N entries" (the table page draws 78 and 93 rows); «4 брони» becomes «4 доспеха»; `VH` keeps «В разделе».
  - Risk 5, step 8, "Standing checks": `#/roll/vh` joins `FIRST_SCREEN`.
  - Risk 6, "Standing checks" 2 and the States table: the stale-tab case on `#/tables/escape_the_veiled_halls` and the stored list rung/head badge.
  - Nit 1, step 10: the decision title reads "Veiled Halls".
  - Nit 2, B3: "every line inside a roll pool has exactly one rolled record, its head".
  - Nit 3, step 7: `data.test.ts` negative case "a roll on a rung is refused".
  - Nit 4, step 9: `README.md:441`, `README.ru.md:455`, `llms.txt:65-74` `roll` text; the `ph` id sentence at `README.md:226-227`, `README.ru.md:231-233`.
  - Nit 5, step 4a: the stale comments of the touched paths.
  - Nit 6, step 8: `routes.json` `why` texts at `:156` and `:351`.
  - Nit 7, "Code references" (Preview host), A6: the `worker.test.mjs:1660-1662` room-anchor card and exact A6 strings.
  - Nit 8, `handoff.md`: each template field has its own line.
- Plan review: not required for B2 (no trigger fired: the text of 26 records; no contract, no stored shape)
- NEEDS_HUMAN_CONFIRMATION: no (no product law changes; D1-D5 are settled by the owner; B2's rule is the owner's default and the owner may change it)
- Next batch: B2 (the `lr` trim); then the code review of B1 and B2 together.

## Start gate

Opened 2026-11-07: `issues/new-items/` is deleted, its squash is on `main` (`62070925`) and `f278eeee` merged `main` into
this branch. Both tasks edit `data.js`, `tests/dataint.js`, `tests/derived.js`, the roll goldens and the same specs; Part A
removes code that only `new-items` adds.

1. Merge `main` into `claude/roll-per-line` (`docs/decisions/2026-10-22-a-task-branch-takes-main-by-a-merge.md`). **Done at `f278eeee`.**
   If `main` moved since, merge it again before step 1 of B1.
2. Re-run the symbol list of "Code references" with `git grep -n` on the merged tree. If `new-items` changed after
   `e3c18ad0` (a review fix), the list is the truth and this plan is only the guide.
3. List the pools that hold a line:
   `node -e "global.window={};require('./data.js');const L=window.LOOT;for(const [k,v] of Object.entries(L.items)){const l=v.filter(x=>x.eq&&x.eq.line);if(l.length){const r=l.filter(x=>x.eq.line!==x.id).length;console.log(k,v.length,'line rows',l.length,'rungs',r,'pool',v.length-r)}}"`.
   Expected: `frames 94 56 42 52` (not a roll pool: no row has `roll`), `arazo 78 68 51 27`, `ph 93 64 48 45`. Any other
   rolled table in the list gets the same treatment; `lr` and `vh` print nothing. (The plan review recounted the same
   numbers on `f278eeee`.)
4. Compare the golden list of "States and goldens" with a scan of the merged tree (the file list is the acceptance list, not a guess).

## What changed since the 2026-11-05 plan

| Item | Old plan | Now |
|---|---|---|
| `ph` pool | 49 (16 heads + 4 armor + 29 items) | **45**. The 4 armors are inside the 29 single items; the old sum counted them twice. Measured on `e3c18ad0`. |
| Tier ladder on the roll result | "the result card already shows it" | **False.** A roll result is `RecordCard variant="face"`; the ladder draws on `full` only (`FEATURES.md`, "Rolling"; owner 2026-11-04). The other tiers open from «Открыть карточку» (the dialog, a full card). Decision D2. |
| Pool rule | `rows.filter(roll != null)` | `rows.filter(not a rung)`. Fixtures in `sections.test.ts` rows carry no `roll`; a `roll != null` filter would empty them. `dataint` still pins `roll` against pool membership. |
| Where the rule runs | `App.svelte`, per caller | `RollPanel.svelte`, once: both `ROLL_TABLE` and `PickerRollPanel` go through it. |
| Help text | "no new text" | Five paragraphs change in both languages (`ARAZO`, `PH`, `VH` in `help.ts`); the Arazo and Pistolheart text says each version has its own number. |
| Goldens | "re-seed `_roll_arazo*`, `_tables_arazo*`, the `ph` ones" | **38 changed, 1 new, 2 deleted** (exact list in "States and goldens"): the equipment tables and search print the roll number of arazo and ph rows too. |
| `vh` | not in scope | Part A: a flat list of 15, no rooms (owner, 2026-11-07). |
| Decisions to supersede | the 2026-10-08 Arazo rebalance | also the 2026-10-07 Arazo source decision (it rejected base-only rolls on purpose) and the `new-items` decisions of 2026-11-07. |
| Plan review | not required | **Required** (public contract change); done 2026-11-07, `reviews/plan-B1.md`, findings applied. |
| `lr` text | not in scope | Batch B2 (owner request 2026-11-07): the lore of the 26 `lr` records is cut to rule text. |

## Facts

### Data (from `data.js` at `e3c18ad0`)

| Pool | Rows | Line rows | Heads | Rungs | Single items | Roll range now | Roll range after |
|---|---|---|---|---|---|---|---|
| `arazo` | 78 | 68 (17 lines of 4) | 17 | 51 | 10 | 1-78 | **1-27** |
| `ph` | 93 | 64 (16 lines of 4) | 16 | 48 | 29 | 1-93 | **1-45** |
| `lr` | 26 | 0 | 0 | 0 | 26 | 1-26 | 1-26 (unchanged) |
| `vh` | 15 | 0 | 0 | 0 | 15 | d4, d4, d3, d4 by room | **1-15**, one pool |
| `frames` | 94 | 56 | 14 | 42 | 38 | none (not a roll pool) | none |

- Every head is the first row of its line and has tier 1; every rung's `img` is its head's. A head's id is its line's name (`eq.line`).
- New pools, in table order. Arazo: 14 weapons, 1 secondary, 2 armors, 10 items. Pistolheart: 13 weapons, 3 secondary,
  4 armors, 18 items, 7 consumables; by volume 9 / 14 / 22 (the table page still draws 36 / 35 / 22 rows).
  `vh`: 7 items, 8 consumables, `vh1`-`vh15`; `vh2` crafts `vh6`, `vh8` crafts `vh15`.
- Arazo roll to id: 1=aa1 2=aa5 3=aa9 4=aa10 5=aa11 6=aa15 7=aa19 8=aa23 9=aa24 10=aa28 11=aa29 12=aa33 13=aa37 14=aa41
  15=aa42 16=aa43 17=aa47 18=aa51 19=aa52 20=aa56 21=aa57 22=aa58 23=aa62 24=aa66 25=aa70 26=aa74 27=aa78.
- Pistolheart roll to id: 1=ph1 2=ph5 3=ph9 4=ph13 5=ph17 6=ph21 7=ph25 8=ph29 9=ph33 10=ph37 11=ph41 12=ph45 13=ph49
  14=ph53 15=ph57 16=ph61, then 17=ph65 up to 45=ph93 (roll = id number - 48).
- In every pool the rolls already ascend in table order, so `rows[n - 1]` after the filter is the row whose roll is `n`.
- Nothing in `sets` or `refs` names an `aa` or `ph` id. Ids do not change. `L.eq` holds only `core` and `hnf` records.
- The `room` of the 15 `vh` records is the only data the flat list deletes: `vh1`-`vh4` The Basement, `vh5`-`vh8` The Dressing
  Room, `vh9`-`vh11` The Laboratory, `vh12`-`vh15` The Library (the book rolls d4, d4, d3, d4). The decision file records
  this line so history keeps it.

### Code references

| Concern | File and symbol | `main` | `new-items` | Edit |
|---|---|---|---|---|
| Draw and range | `app/src/components/RollPanel.svelte`: `const max = $derived(rows.length)`, `const result = $derived(rows[n - 1] ?? null)` | 47, 63 | same file, unchanged | Part B: derive `pool = rollPool(rows)`; `max` and `result` read `pool` |
| Pool wiring | `app/src/App.svelte`: `ROLL_TABLE`, `PICKER_ROLL`, `interface PickerRoll` | 20, 34 | 20-60 | Part A: `'roll/vh': { table: 'vh' }` into `ROLL_TABLE`; drop the `vh` entry of `PICKER_ROLL` and `'vh'` from `PickerRoll.section`; fix the head comment |
| Picker | `app/src/components/PickerRollPanel.svelte`: `Props.section`, head comment | - | 20 | Part A: `'voa' \| 'community' \| 'mwt'`; comment names three sections |
| Roll helpers | `app/src/lib/roll.ts`: `pick`, `hasRealDie`, `rollLabel` | 84-101 | same | Part B: add `isRung`, `rollPool`; `REAL_DICE` has no 15, 27 or 45, so the label reads «Бросить 1-N», no change |
| Table of a record | `app/src/lib/label.ts`: `tableOf` | 209 | 216 | none: `arazo`, `ph`, `lr`, `vh` return before `if (it.eq && !it.roll)` |
| Table of a record (stubs) | `tools/share-card.mjs`: `tableOf`, `where`, `subtitle` | 265, 286, 305 | 295, 316, 337 | Part A: drop the `vh` `room` bit in `where`, `roomF` in `TEXT`, `ROOM_LABEL`, `LABEL_GROUPS.vh`. Part B: none (a rung without `roll` already prints «Tier N» once; a head prints «Roll N» and its tier in the stat line) |
| Record page line | `app/src/components/RecordPage.svelte`: `where` | 46 | 46 | none: `if (it.roll) ... else if (it.eq && it.eq.tier !== 'A')` already handles a rung |
| Roll badge | `app/src/components/RecordCard.svelte`: `{#if it.roll && !sub}` | - | 292 | none: a rung shows no number |
| Row number | `app/src/components/TableRows.svelte`: `rollNum = entry.n ?? it.roll`; the tile badge `n = rollNum ? String(rollNum) : hide?.tier ? '' : tileTier(it)` (`:212`) | - | 173, 212 | none: in list view a rung row draws no number badge (`RowMain.svelte` `{#if num}`); in tile view a rung tile draws its tier («Ранг N» / "Tier N") unless the page hides the tier, like a Core weapon tile |
| Index | `app/src/lib/data.ts`: `Index.rows` comment ("a roll is a number within one roll pool"), `plainFacets` (`room`) | 46 | 46, 258 | Part A: drop `room` from `plainFacets`. Part B: add one sentence to the `rows` comment: a rung is in `rows` but not in the pool |
| Real-data guard | `app/src/lib/data.test.ts`: `rollPools`, `expectRollPools` | 41 | 41 | Both parts: the `vh` branch goes; a line's rungs leave the pool |
| Descriptor | `app/src/lib/sectionProps.ts`: `SectionProp.group`, `SECTION_PROP.vh`, the `rooms.js` import | - | 30, 59 | Part A: remove `vh`, `'room'`, the import |
| Rooms | `app/src/lib/rooms.ts` | - | whole file | Part A: delete |
| Record type | `app/src/lib/types.ts`: `import type { Room }`, `room?: Room` | - | 6, 186 | Part A: remove both |
| Filter groups | `app/src/lib/filters.ts`: `PLAIN_GROUPS.vh` | - | 47 | Part A: `['kind']` |
| Dictionary | `app/src/lib/dict.ts`: `roomLabel`, `roomF` | - | 194, 309, 1302, 1388 | Part A: remove four lines |
| Help | `app/src/lib/help.ts`: `ARAZO`, `PH`, `VH` | 287 | 287, 455, 535 | Both parts: see "Help text" |
| Section comments | `app/src/lib/sections.ts` head and `sectionParts`; `label.ts` `whereFrom` comment; `TablesPage.svelte` comment on `SECTION_PROP` | - | 1-12, 92, 242, 396 | Part A: drop the word `room` |
| Catalog files | `tools/derived.js`: `CSV_HEAD`, `catalogRow` (`roll`, `room`), `namesJson` (`rooms`), `require('../app/src/lib/rooms.ts')` | 122 (`roll`) | 14, 78, 128, 143, 295 | Part A: remove the `room` column, `rooms` and the require. Part B: none (`roll: x.roll == null ? '' : x.roll` already prints an empty cell for a rung) |
| Preview host | `preview/worker.mjs`: `ROOM_LABEL` import, `roomLabel`, `SECTIONED.vh`; `preview/worker.test.mjs`: names fixture `rooms`, the room-anchor card `/tables/escape_the_veiled_halls/laboratory` (`:1660-1662`), the `f_room-basement-library` case | - | 24, 531, 546; 82, 1660, 1690 | Part A |
| Review tool | `tools/artwork/review/review.mjs`: `if (record.roll)` badge | - | 144 | none |
| Data pins | `tests/dataint.js`: the `room` rule (before `text hygiene`), the `table numbering` block (`ROLL_POOLS`, `ROLLED`, `vh` branch) | 243-290 | 79-82, 262-345 | Both parts |
| Data pins | `tests/derived.js`: block `Arazo's Artifacts`; block `Pistolheart, The Last Round Table and Escape the Veiled Halls`; the `realm,volume,room` head check; the `vhRow` check | 2457 | 2457-2490, 2594, 2598-2675 | Both parts |
| Route fixtures | `docs/fixtures/urls/routes.json`: the `f_room-laboratory` case, the `why` of the `vh` roll (`:156`, "a room, then a roll inside it"), the `why` of the `vh` table (`:351`, "a table sectioned by room"), the `why` of the `pistolheart` roll | - | 363, 156, 351, 132 | Part A: rewrite the `f_room-laboratory` case as the retired-group case (D5; step 8) and reword the two `vh` `why` texts. Part B: reword the `pistolheart` `why` |
| Browser suites | `tests/app/inventory.js`; `tests/app/states.js` (route list with `.pick select`; `FIRST_SCREEN` at `:5612`); `tests/app/sweep.js` (anchor `laboratory`); `tests/app/contracts.js` (`PROBE` `['vh','room-library']`, the comment above it, the stub-path check `firstOf`) | - | 960-1010, 1393; 6565, 5612; 175; 370-372, 300-343 | Part A (and B for the stub-path ids) |
| Unit tests | `sections.test.ts` (`vh` fixture, `describe('Escape the Veiled Halls')`, the no-data list, the axe case), `facets.test.ts`, `hash.test.ts`, `help.test.ts`, `i18n.test.ts`, `label.test.ts`, `sectionProps.test.ts`, `roll.test.ts`, `record.test.ts` (`#/i/ph38`, `:1276-1281`), `data.test.ts`, `tables.test.ts` | - | see `git grep -n -E "room\|Veiled"` in each | Both parts |
| Comments the change makes false | `App.svelte:15-19` and `:135` ("four sections"); `RollPanel.svelte:5-13` ("five sections"); `PickerRollPanel.svelte:4-10`; `components/roll.test.ts:210-211` (rungs roll as own rows) and `:455` ("three whole-table rolls"); `tests/app/inventory.js:966-967`; `tests/dataint.js:70-71` (the `vol` comment names the room); `sectionProps.ts:3-6`; the comment above `PROBE` | - | as listed | Both parts (step 4a) |

Specs and docs to edit (grep each for `room`, `1-78`, `1-93`, `Veiled`): `docs/specs/FEATURES.md` ("Rolling": the mode table, the picker bullet,
the Pistolheart and Veiled Halls bullet, the result bullet that says a result draws no ladder; "Tables and search": the
preview-card sentence that names a room), `ROUTES.md` (roll table rows for the three routes, the anchor example `library` on `vh`, the filter
table row `vh`, the value list `room ...`; in "Filter grammar" one sentence: `room` on `vh` is a retired group (2026-11-07) and fails open as an unknown group, part of the contract-change set of D5), `CONTRACTS.md` (rows `aa`, `ph`, `vh` of the id table; the `catalog.csv`
bullets; the `names.json` bullet; the byte measures), `STATE.md` (roll inputs `vh {r, n}`), `COVERAGE.md` (rows for
`roll.test.ts`, `dataint`, the golden state count: the text says 411, `STATES` holds 436), `README.md` and `README.ru.md`
(the mode table; the `vh` id paragraph and the `ph` sentence in the same paragraph that calls the id number the roll,
`README.md:226-227`, `README.ru.md:231-233`; the `roll` column line, `README.md:441`, `README.ru.md:455`), `llms.txt` (the column lists
and the `roll` column text at `:65-74`, the `vh` row, the roll route line, the filter keys, the homebrew "never carries" list), `.claude/prompts/add-source.prompt.md` (the `roll` field line).

## Design (decided)

A roll pool holds one row per item. An upgrade line is one item: its head is the only rolled record. A rung keeps its place
in its table (the table page, search, the ladder and every link keep working) but has no `roll`. `vh` is one pool of 15.

| Option | Verdict |
|---|---|
| A: rungs stay in the table without `roll`; one structural pool rule in code | **Recommended.** One small function; the table page, search and the ladder keep every rung. |
| B: move rungs out of the table | Rejected: `L.eq` is `core` and `hnf` only (`tests/dataint.js` pins it); the table page loses rungs. |
| C: weights (a line rolls 4 times as likely) | Rejected: that is the defect. |
| D: keep rolls on rungs, filter by `roll` in code | Rejected: two sources of truth; `dataint` could not tell a missing roll from a rung. |

Pool rule (code): `isRung(it) = !!it.eq?.line && it.eq.line !== it.id`; `rollPool(rows) = rows.filter((it) => !isRung(it))`.
Pool rule (data, `dataint`): the pool of a table is its rows that are not rungs; `ROLLED.has(x) === (x.roll != null)` stays;
every line inside a roll pool has exactly one rolled record, its head; every other line (`frames`, `L.eq`) has none. The two copies of `isRung` carry a comment that names each other.

### Verified in code

- Share card and stubs: `tableOf` returns the source table for `arazo` and `ph` before it reads `roll`. A rung without `roll`
  prints «Tier N» in `where()` and `subtitle()` sets `noTier`, so the tier shows once. A head prints «Roll N» and its tier in the stat line.
- The saved roll number is page memory (`STATE.md`, "Roll inputs"); no port stores it. `NumberField` clamps to `max`. Nothing to migrate.
- `ListPage.svelte` has its own roll over a list's rows (`hitRow = rows[roll - 1]`). It does not read a source table. Not touched.
- Three other readers of `roll` as a signal: `RecordCard` (badge), `RecordPage` (path line), `review.mjs` (badge). A rung shows
  none of them, which is the wanted result.
- `catalog.csv` `roll`: a rung prints an empty cell. A consumer that read `roll` of a rung as its place in the book gets an empty cell. `README.md:441` and `README.ru.md:455` say "number in its own table"; step 9 adds "empty on an upgrade line's rungs" there and in `llms.txt:65-74`.
- Tile view: a rung tile draws its tier (`TableRows.svelte:212`), not nothing. List view draws no number on a rung.
- Stored lists and shares hold ids: a rung in a list loses its number badge and a head's badge changes (`aa19`: 19 to 7). No golden shows it, because the seeded lists hold no `aa` or `ph` row.

## Decisions (D1-D5 settled by the owner, 2026-11-07; D6 the planner's, kept)

- D1 (owner, 2026-11-07, settled; carried from 2026-11-05): the public roll ranges shrink (`arazo` 1-78 to 1-27, `ph` 1-93 to 1-45) and a
  roll shows the head (Tier 1). A random tier is a different feature.
- D2 (owner, 2026-11-07, settled): the other tiers of a rolled line open from «Открыть карточку» / "Open card" (the dialog, a full card
  with its «Ранг» / "Tier" row) and from the name link (the record page). The result face keeps drawing no ladder (owner
  2026-11-04). The help text says so. Rejected alternative: draw the ladder on the result face of a line head; it
  reverses the 2026-11-04 rule and adds a row to the face, which the First-Screen Rule counts. Cost of D2: a player who wants
  Tier 3 needs two presses (open the card, press the rung), where the old build could roll it directly.
- D3 (owner, 2026-11-07, settled): the `room` field is deleted from the 15 `vh` records; the room map is kept in the decision file.
  Rejected alternative: keep an unused field (dead data, and `dataint` would have to pin it).
- D4 (owner, 2026-11-07, settled; departs from the text of `CONTRACTS.md`): the `room` column leaves `catalog.csv` and
  `catalog-index.csv`, and the `rooms` key leaves `names.json`, with no new file name and no `version` 2. The spec says "any other
  change is a new file name" and "any other change is `version` 2"; step 9 rewrites that sentence. Reason for the exception: both were added on 2026-11-07 as the
  last column and a new key, they are generated at build and not committed, no reader of `room` is known, and a reader by header name is
  unaffected. Accepted trade-off: a position-based reader of the last column breaks. The decision file records the exception.
  Rejected alternatives: keep `room` as an empty column and an empty `rooms` object (no break, dead surface); publish new file names (a new name is more churn than the column is worth).
- D5 (owner, 2026-11-07, settled): `f_room-*` and the anchors `basement`, `dressing`, `laboratory`, `library` stop being addresses. An old link
  opens the whole `vh` table (unknown groups fail open, `ROUTES.md` "Filter grammar"); an anchor scrolls to nothing. No redirect.
  A contract file proves it: the `routes.json` retired-group case (step 8).
- D6 (planner default, kept by the owner 2026-11-07): B1 is one batch, two parts, one commit (the batch-size section).
- D7 (owner request, chat 2026-11-07; the trim rule is a default and the owner may change it): B2 trims the lore of the 26 `lr` records (below).

Owner rule tag (`plan.prompt.md`, "Owner rules"): "an upgrade line is one roll row; give a rung no `roll`" - home `docs/specs/FEATURES.md`,
"Rolling" (two lines) and `.claude/prompts/add-source.prompt.md` (one line, in the field list) - written by B1.

## Batch B1 - `vh` is one flat list, and one roll row per item

Open design question: none.

### Why one batch (the criterion, and the cost)

`CLAUDE.md`, "Task and session protocol": merge work that shares a component, a seed and a filter set. Both parts edit the same
roll wiring (`App.svelte` `ROLL_TABLE`, `RollPanel`), the same seed (`data.js`, one script), the same two pool builders
(`tests/dataint.js` `table numbering`, `data.test.ts` `rollPools`) and the same four specs. The parts differ in route and filter set
and each changes a public contract, so a split is allowed by the rule, not required by it. A split would pay the pool-builder
edit twice and one more gate run.

Gate cost of B1 (`.claude/README.md`, "Batch size and the fixed cost of a run"): one `rtk npm run check:fast` (680-840 s, because
`dict.ts`, `types.ts` and `label.ts` reach the component suites; past 600 s run it in the background), one `npm run build:test` and
four golden shards (100-290 s each), the focused `app/states` shard that holds the changed route list, one push and one CI run
(about 15 min, 80 runner-minutes), one review and one remediation commit. A split into Part A and Part B would add about 45 min of
wall time and one more CI run, for no gain, because the parts share the seed and the goldens.

No split fallback: D4 is settled and the plan review kept the batch whole (the parts share the seed, `RollPanel`, both pool
builders and the shared goldens; a split would cost one more CI run and about 45 min). B2 is the `lr` trim, not a part of B1.

### In scope

Part A (`vh`): data, the flat roll page and table page, every `room` and `rooms` reader, the three contract files, the specs.
Part B (per line): `rollPool`, the data of `arazo` and `ph`, the pins, five help paragraphs, the specs, the goldens.
Decisions and rule writes: below.

### Out of scope

A random tier on a roll; a ladder on the result face; moving rungs to `L.eq`; renumbering ids; `lr`; any other source; the
roll pages' head and mode row (task 57-debt batch VW1); weights.

### Files

Create: `docs/decisions/<date>-one-roll-row-per-item-an-upgrade-line-is-rolled-at-its-head.md`, `docs/decisions/<date>-escape-the-veiled-halls-is-one-flat-list-with-no-rooms.md`,
the golden `tests/app/snapshots/_tables_vh.txt` (by `golden.js --update`, never by hand).
Delete: `app/src/lib/rooms.ts`, the goldens `_roll_vh_laboratory.txt` and `_tables_vh_library_picked.txt`.
Edit: the files of "Code references" and "Specs and docs"; `data.js` (by script only); the older decision files named below.

### Steps (ordered)

1. Data script (a `node` one-off in the scratchpad, not committed): load `data.js`, mutate `L`, write the exact
   `window.LOOT=` + JSON + `;\n` form the file has. For `L.items.vh`: delete `room` on each record and set `roll` to the 1-based index.
   For `arazo` and `ph`: delete `roll` on every rung (`eq.line` set and not the record's id); set `roll` of the rest to 1..N in table order.
   Check against the two roll maps in "Facts". Run `node tools/build.js`; search `i/` for `undefined`.
2. Part A code: `git rm app/src/lib/rooms.ts`; edit `sectionProps.ts`, `types.ts`, `data.ts` (`plainFacets`), `filters.ts`, `dict.ts`, `sections.ts`,
   `label.ts` (comment), `TablesPage.svelte` (comment), `PickerRollPanel.svelte`, `App.svelte` as in "Code references".
   The `vh` page then goes through `RollPanel` with `section="vh"`; `helpFor('vh')` is unchanged in key.
3. Part A tools: `tools/derived.js`, `tools/share-card.mjs`, `preview/worker.mjs`, `preview/worker.test.mjs` as in the table.
   Deploy order: the worker reads `names[s.counts]` through `has()`, which accepts a missing object, so an old worker with a new
   `names.json` still answers.
4. Part B code: in `roll.ts` add `isRung` and `rollPool` (pure, with a doc comment: "Returns the rows a roll draws from: a table's rows
   without the rungs of its upgrade lines"). In `RollPanel.svelte` derive `pool` and read it in `max`, `result` and `roll()`; update the head
   comment ("The rows are a prop..."): the panel drops a line's rungs itself, so a caller passes the whole table.
4a. Comments that the touched paths make false (fix them here; a comment cites only what resolves from a clean checkout): `App.svelte:15-19` and
   `:135` ("four sections": the picker sections are three); `RollPanel.svelte:5-13` ("five sections": it names three whole tables of six);
   `PickerRollPanel.svelte:4-10`; `components/roll.test.ts:210-211` (rungs roll as own rows) and `:455` ("three whole-table rolls");
   `tests/app/inventory.js:966-967`; `tests/dataint.js:70-71` (the `vol` comment names the room); `sectionProps.ts:3-6`; the comment above `PROBE`
   (step 8).
5. Help text (both languages, ASCII hyphens as the neighbours): see "Help text".
6. Pins, Part A and B together. `tests/dataint.js`: delete the `room` rule; in `table numbering` delete the `vh` branch (the generic branch now
   holds it) and make the generic branch push `rows.filter((x) => !isRung(x))`; add `isRung` (comment: the twin of `roll.ts`); add
   "every line inside a roll pool has exactly one rolled record, its head; every other line has none" and "in each pool the rolls ascend in table order". Keep the
   `ROLLED.has(x) === (x.roll != null)` pin. `tests/derived.js`: Arazo block (78 rows with ids `aa1`-`aa78`; pool 27, rolls 1..27 on heads
   and items; no `roll` on the 51 rungs); `ph` block (93 rows; pool 45; 48 rungs without `roll`); `vh` block (`vh1`-`vh15`, `roll` = id number, no
   `room` on any record, the two `craft` pairs); the CSV head check (`realm,volume`); the `vhRow` check (replace by `vh9` having an empty
   `volume` and no `room` column); the `names.json` check if it names `rooms`.
7. Unit tests. `roll.test.ts` (lib): `rollPool` keeps order, drops rungs, leaves a table without lines unchanged. `components/roll.test.ts`: Arazo block
   (button «Бросить 1-27»; typed `7` draws «Лук из Эльфийских Волос», the head; typed `28` clamps to `27` and draws «Ларец Зерана»; no
   rung is reachable: all 27 headings are in the pool); a `ph` block (button «Бросить 1-45»; `14` draws «Разделочный Нож»; `45` draws
   «Инфузия Доблести»); a `vh` block over the real data (button «Бросить 1-15»; no `combobox`, no «Комната»; `9` draws «Зелье
   Внимательности»; `15` draws «Легендарное Зелье Предвидения»; the same in English). `sections.test.ts`: delete the `vh` fixture and the three room tests; move
   `#/roll/vh` from the picker no-data list to the whole-table no-data test; delete the axe case with a room picked (the `vh` page is covered by
   the whole-table axe case in `roll.test.ts`; add one if absent). `data.test.ts`: `rollPools` drops the `vh` branch and the rungs; add the negative case
   "a roll on a rung is refused" next to "rejects missing members, outside rolls, duplicates, and gaps" (`data.test.ts:103`). `record.test.ts`: rewrite the case at
   `:1276-1281` (`#/i/ph38`, today 'Pistolheart · Том 2 · номер 38') as the rung case ('Pistolheart · Том 2 · Ранг 2', no «номер»), and add a head case
   (`#/i/ph37` reads 'Pistolheart · Том 2 · номер 10'). `tables.test.ts`: one rung-row case in list view (the row draws no number) and one in tile view (the tile draws «Ранг N»). `facets.test.ts`,
   `hash.test.ts`, `help.test.ts`, `i18n.test.ts`, `label.test.ts`, `sectionProps.test.ts`: remove the room cases; `i18n.test.ts` loses `roomF`,
   the `rooms` of `names.json` and the `f_room-*` address cases; `help.test.ts` loses the «Лаборатория - 3» checks and gains the new counts (27,
   45, 15). End each component test that you touch with `expectNoA11yViolations` where it already does.
8. Browser suites. `inventory.js`: delete `#/roll/vh ~ laboratory` and `#/tables/vh ~ library picked`; add `#/tables/vh` (why: "a plain body with
   a kind row, 15 rows in book order", the twin of `#/tables/lr`); reword the `why` of `#/roll/arazo`, `#/roll/ph`, `#/roll/vh` and `#/roll/vh ~ help`.
   `states.js`: remove `'#/roll/escape_the_veiled_halls'` from the route list that reads `.pick select` (`:6562-6603`); its 256 px assertion (`:6589`) and its
   word-break check leave with it, so add `{ state: '#/roll/vh', shipped: true }` to `FIRST_SCREEN` (`:5612`; at 360x640 its default limit `0.4 * vh` is the same 256 px).
   Task 57-debt VW1 also edits `states.js`: merge by hand, as text ("Interplay"). `sweep.js`: remove the anchor `laboratory`.
   `tests/app/contracts.js`: in `PROBE` (`:370`) replace `['vh', 'room-library']` with `['vh', 'kind-consumable']` (not a deletion; it narrows 15 to 8); the comment above it
   (`:372`) says "33 opens (22 probes, 11 whole tables)" and the array holds 22 probes over 12 tables, so write "34 opens (22 probes, 12 whole tables)"; in the stub-path check
   "a share stub names the path its record page does" (`:300-343`) add one rung id per lined pool (`aa20`, `ph38`) to the `firstOf` ids.
   `docs/fixtures/urls/routes.json`: rewrite the `f_room-laboratory` case (`:363-376`) as the retired-group case: hash `#/tables/escape_the_veiled_halls/f_room-laboratory`,
   `why` "a retired room filter: the group is unknown, so the table stays whole", `resolves` with `rows: 15`, `count: "15"` and `picked: []` (take the exact `picked` and `count` from the run:
   `hash.test.ts` and `tests/app/contracts.js` replay the fixture). Reword the `why` at `:156` ("a room, then a roll inside it": "Escape the Veiled Halls, one pool of 15") and at
   `:351` ("a table sectioned by room": "a plain table with a kind row, 15 rows") and the `pistolheart` roll `why` (no "93": "Pistolheart, one pool of 45").
9. Specs and docs (same commit). `FEATURES.md`, "Rolling": the mode table (`1-27`, `1-45`, `1-15`, `vh {n}`); the picker bullet (three pickers; "a realm is a fixed
   chip"); the Pistolheart and Veiled Halls bullet; add the rule bullet "One roll row per item: an upgrade line is rolled once, at its
   head; its other tiers open from the card, whose «Ранг» row lists them. A rung has no `roll`." Departure line in the result bullet that says a result draws no
   ladder. `ROUTES.md` (the mode table, the filter table, the anchor example, and in "Filter grammar" the sentence: `room` on `vh` is a retired group (2026-11-07) and fails open as an unknown group),
   `CONTRACTS.md` (id rows; the `catalog.csv`, `catalog-index.csv` and `names.json` bullets, with the D4 exception stated and the sentence "any other change is a new file name" / "`version` 2" rewritten,
   the new byte measures read from `tests/derived.js`: 183817 and 110056 bytes today, and the `realm,volume,room` head check at `tests/derived.js:2592`), `STATE.md`,
   `COVERAGE.md` (state count from `STATES.length`, the new pins), `README.md` and `README.ru.md` (the mode table; the `vh` id sentence and, in the same paragraph, the `ph` sentence that calls the id number
   the roll, `README.md:226-227`, `README.ru.md:231-233`; the `roll` column line `README.md:441`, `README.ru.md:455`: add "empty on an upgrade line's rungs"),
   `llms.txt` (the `roll` column text, `:65-74`: the same sentence; the `vh` row; the filter keys), `.claude/prompts/add-source.prompt.md` (the `roll` line: "an upgrade line is one roll row; give rungs no `roll`").
10. Decisions. Write the two files named under "Create" from `.claude/templates/decision.template.md`: (1) "One roll row per item: an upgrade line is rolled at its head" -
    Supersedes in part: "Arazo's Artifacts: source arazo, ids aa1-aa51, tier formulas as lines" (2026-10-07, the rejected base-only rolls), "Arazo's Artifacts rebalanced
    to Core bands: every piece a line, ids aa1-aa78" (2026-10-08, the rolls), "Pistolheart, The Last Round Table and Veiled Halls are sources ph, lr and vh" (2026-11-07, the
    `ph` roll equal to the id; the pointer title is the file's own, `tools/decisions.js` validates it). Rejected: weights; moving rungs; a random tier. (2) "Escape the Veiled Halls is one flat list with no rooms" - Amends the same 2026-11-07 file,
    "Pistolheart, The Last Round Table and Veiled Halls are sources ph, lr and vh"
    (its rejected "flat vh roll 1-15" is adopted; `room`, the room roll and the d3 are gone) and "A table sectioned by a record property reads one descriptor" (2026-11-07; `vh` leaves
    `SECTION_PROP`, which keeps `mwt` and `ph`). It records the D4 exception, D5, and the room map. Write the mirror line (`Superseded in part by` / `Amended by`) into each older file, then run `node tools/decisions.js`.
11. Goldens, last. Merge `main` again first if it moved. `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to 4, one at a time, in the background.
    Read `git diff --stat tests/app/snapshots`: the changed set must equal the 38-file list in "States and goldens" (plus the 2 deleted and 1 new). A file outside that list is a defect to read, not to re-seed.
12. Gates: `node tests/run-all.js dataint,derived,contracts` (the CSV and `names.json` pins), `rtk npm run check:fast` (Bash timeout 600000; in the background if it passes 600 s), the focused browser
    run for the shard that holds the changed `states.js` list (`node tests/run-all.js app/states`, background), push, CI (the credit arms the squash).
    `app/contracts` replays the rewritten `routes.json` case and the `PROBE` entry for `vh`; it takes about 555 s and the local gates do not run it, so CI's `browser` matrix must show it green before the squash.
    Take the real `picked` and `count` of the retired-group case from `hash.test.ts` (or that CI run).
13. Reviewer (Opus; triggers: public contract change, data change). One remediation commit.
14. Closeout (`/handoff`): audit this directory against the durable list, delete it, squash onto `main` after a green CI run.

### Help text (both languages; keep the other paragraphs and the link parts)

| Key | Paragraph | Russian | English |
|---|---|---|---|
| `ARAZO` | 1 | Бросок выбирает из 27 позиций - 10 предметов и 17 единиц снаряжения (оружие и броня), в порядке книги. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно. | A roll picks from 27 entries - 10 items and 17 pieces of equipment (weapons and armor), in the book's own order. No die covers that range, so the button picks an entry at random. |
| `ARAZO` | 3, sentence 2 | Бросок даёт базовую версию; остальные три открываются из карточки, в ряду «Ранг». | A roll gives the base version; open the card to reach the other three in its "Tier" row. |
| `PH` | 1 | Бросок выбирает из 45 позиций трёх томов - 18 предметов, 7 расходников, 16 единиц оружия и 4 доспеха, в порядке книг. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно. | A roll picks from 45 entries over three volumes - 18 items, 7 consumables, 16 weapons and 4 armors, in the books' own order. No die covers that range, so the button picks an entry at random. |
| `PH` | 2, sentence 2 | Бросок даёт базовую версию; остальные открываются из карточки, в ряду «Ранг». | A roll gives the base version; open the card to reach the others in its "Tier" row. |
| `VH` | 1 | В разделе 15 позиций приключения - 7 предметов и 8 расходников, в порядке книги. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно. | This section holds the adventure's 15 entries - 7 items and 8 consumables, in the book's own order. No die covers that range, so the button picks an entry at random. |

In `ARAZO` and `PH` the sentence "У каждой версии свой номер, поэтому ... выпадает чаще предметов" / "Each version has its own number, so ... come up more
often than items" is replaced by the sentence above, not kept.

Why `ARAZO` 1 and `PH` 1 say «Бросок выбирает из N позиций» / "A roll picks from N entries" and not «В таблице N позиций» / "The table holds N entries": the table
page of `arazo` and `ph` still draws 78 and 93 rows (rungs stay in the table; the routes fixture count says "93", `names.json` `tables` says 78 and 93), so a pool count
phrased as the table's size contradicts the table page. `VH` (here) and `LR` keep «В разделе» / «В таблице», because their table and their pool are the same size; this is
the one departure from the `LR` sibling. The four `ph` armors are «Доспех», «Латы», «Грудная Клетка» and «Пыльник»: «4 доспеха» is the plural of the common noun.

### Standing checks

1. Scale. No collection with a limit is drawn: a roll pool has no `limit_defaults` row, so the "at the limit, one past it, 3x" rows are not applicable. The pool sizes are
   data (45 at most). States, with the proof:

| State | What the screen shows | Proof |
|---|---|---|
| Empty (no rows: a `data.js` held in the HTTP cache from before the source) | the page, then «Данные не загрузились. Обновите страницу.»; for `vh` no picker | `sections.test.ts` no-data tests (`vh` now in the whole-table case) |
| One | not applicable: no pool of one | - |
| Many | `arazo` «Бросить 1-27», `ph` «Бросить 1-45», `vh` «Бросить 1-15»; the button names a range, not a die (15, 27 and 45 are not dice, `REAL_DICE`); the field label «Результат броска (1-N)» | `components/roll.test.ts` real-data blocks; goldens `_roll_arazo`, `_roll_ph`, `_roll_vh` |
| A number past the new max (78 on `arazo`, 93 on `ph`, 50 on `vh`) | clamps to the max | `components/roll.test.ts` |
| A rung id opened by link, list, search or share | the record page of the rung; its line reads «Ранг N» / "Tier N", no «номер» / "Roll N" | `record.test.ts` (rung case `ph38`, head case `ph37`), the stub-path check of `tests/app/contracts.js` (`aa20`, `ph38`), share-card test in `tests/derived.js` |
| Longest text | the three help paragraphs are within a line of the old ones; the `~ help` goldens at 1100 and the help-box check in `states.js` (`#/roll/arazo ~ help`) hold | goldens, `states.js` |
| Table pages `arazo`, `ph`, the equipment tables, search | a head and a single item draw their number badge; in list view a rung row draws no number; in tile view a rung tile draws its tier («Ранг N» / "Tier N") unless the page hides the tier; row order and row count unchanged (78, 93, 15) | goldens (the 38-file list), `tables.test.ts` (one rung-row case in list view, one in tile view) |
| A list or a share that holds a rung or a head | the rung loses its number badge; a head's badge changes (`aa19`: 19 to 7); ids and row order unchanged | no golden: the seeded lists hold no `aa` or `ph` row; `TableRows` is the one drawer, covered by `tables.test.ts` |
| 360 px and 1180 px | `vh` loses its picker row, so its first result sits higher than before; the rule (256 px for the roll pages) holds with more room | the new `FIRST_SCREEN` entry `{ state: '#/roll/vh', shipped: true }` (`states.js`, 360x640, limit `0.4 * vh` = 256 px) and `sweep.js` |

   Row order, primary action, folds and popups: unchanged on the other pages; the `vh` roll page has the same shape as `lr` and `dv` (no new popup, no sticky region).
2. Error scenarios. No write path and no stored shape (rolls are page memory; lists, shares and print sets hold record ids, which do not change). Loading and failed
   read: the existing no-data page. Offline: the cached `data.js` and bundle pair; see stale tab. A deleted record that a list names: unchanged. Conflict: not
   applicable. Stale tab (old bundle, new `data.js`): the old `vh` picker finds no `room`, so each room is empty and the page says the data did not load; the
   recovery is a reload; nothing is stored. The same old bundle on `#/tables/escape_the_veiled_halls`: the old `propSections` (`TablesPage.svelte:455-465`) drops every row whose
   `room` matches no section, so the body is empty; the recovery is a reload; nothing is stored. The old `arazo` and `ph` panels draw all rows and still work. New bundle with an old cached `data.js`: `arazo` and `ph`
   pools are the 27 and 45 non-rung rows (the filter is structural), `vh` is the 15 rows in table order; numbers on cards are the old ones until the data refreshes.
   Revert: the previous frontend with the new data behaves as the stale tab. A path that loses stored data: none (no `localStorage` key changes). An old
   `f_room-*` link: the whole `vh` table (D5).
3. Consistency. `FEATURES.md`, "Consistency rules": rule 4 (the name of `vh` in the pill, menu, heading and tab does not change), rule 6 (the no-data line is the shared one),
   rule 7 (the roll page draws its `h1` in every state); rules 1, 2, 3, 5 and 8 on are not applicable (no counter, failure, delete, toast or create). Siblings: `vh`
   joins `lr`, `dv` and `arazo` as a whole-table roll; its table page joins `lr` as a kind-row table with no sections; a head and a single item show «Roll N» and a rung shows
   «Ранг N» / "Tier N" on the record page (`RecordPage.svelte:51-53`), in the share stub (`share-card.mjs:329,340`) and in a tile; a list row draws no number. Departure: the help text counts
   the pool, not the table (`ARAZO` 1, `PH` 1; "Help text"). The departure from the first plan: none.
4. RU/EN parity. No new dictionary key; four dictionary lines go (`roomLabel`, `roomF`, both languages; `i18n.test.ts` checks the key sets agree). Five help paragraphs change in
   both languages with the same facts (27 / 45 / 15 entries, the base-version sentence, the card's «Ранг» / "Tier" row). No plural. ASCII hyphens. `README.ru.md` mirrors `README.md`.

### States and goldens (the count)

- `STATES` in `tests/app/inventory.js`: 436 on `e3c18ad0`; after B1 **435** (`vh`: -2 deleted, +1 added). `COVERAGE.md` says 411 (stale); write the real number.
- Deleted goldens (2): `_roll_vh_laboratory`, `_tables_vh_library_picked`. New golden (1): `_tables_vh` (both languages inside the file).
- Changed goldens, exactly **38** (the plan review's scan of `f278eeee` compared each numbered row with its new roll and counted the range and room strings):
  - Roll (6): `_roll_arazo`, `_roll_arazo_help`, `_roll_ph`, `_roll_ph_help`, `_roll_vh`, `_roll_vh_help`.
  - Tables (3): `_tables_arazo`, `_tables_ph`, `_tables_ph_table_picker`.
  - Equipment (20): `_tables_eq_armor`, `_tables_eq_secondary`, `_tables_eq_secondary_searched`, `_tables_eq_weapon`, and the variants of `_tables_eq_weapon`: `_a_row_opened`,
    `_a_row_opened_actions_menu`, `_as_gm1`, `_data_notes_from_more`, `_filter_sheet`, `_filter_sheet_as_gm1`, `_filter_sheet_two_filters`, `_filtered`, `_grid_searched`,
    `_header_hidden`, `_mid_band`, `_more_menu`, `_own_items_hidden_as_gm1`, `_selecting`, `_table_picker`, `_two_filters`.
  - Search (9): `_search_a_row_ticked`, `_search_capped`, `_search_filter_sheet_as_gm1`, `_search_kind_picked`, `_search_own_items_as_gm1`, `_search_own_items_hidden_as_gm1`,
    `_search_searched`, `_search_selecting`, `_search_stat_line`.
  - Confirmed name clashes, unchanged: `_search_words_in_any_order`, `_tables_voa`, `_tables_voa_section_anchor` (their row is the Vault of Ages «Фляга Путника» No. 29, not `aa57`).
    The `vh` rows in the search goldens are `vh1`-`vh4`, whose roll stays 1-4.
  - Caveat: the scan reads only the rows a golden keeps. If removing a number moves a folded run's window (`COVERAGE.md`, `app/golden`, rule A), a listed file can show more rows; no unlisted file should change.
- Unchanged by B1 and checked: `_i_lr6_ref_open`, `_roll_mwt*`, `_tables_mwt*`. (`_roll_lr` and `_tables_lr` are unchanged by B1 and re-seeded by B2.)
- Every diff in these files must be: a roll number gone from a rung row, a new number on a head, a rung tile's tier badge, the help text, the «1-N» range, or the `vh` picker. Anything else is a defect.

### Acceptance (each line has its proof)

Part A - `vh`:
- A1. `#/roll/escape_the_veiled_halls` draws no room picker, no «Комната» / "Room", one button «Бросить 1-15» / "Roll 1-15" and the field label «Результат броска (1-15)»; typing `9` draws `vh9` (`components/roll.test.ts`, golden `_roll_vh`).
- A2. `#/tables/escape_the_veiled_halls` draws 15 rows with no section headings and a kind row only; the retired `f_room-laboratory` opens the whole table (the `routes.json` case, rows 15, nothing picked); `f_kind-consumable` narrows to 8 (`tests/app/contracts.js` `PROBE` entry `['vh', 'kind-consumable']`; `routes.json` via `hash.test.ts` and `tests/app/contracts.js`; golden `_tables_vh`).
- A3. No record has `room`; `vh1`-`vh15` carry `roll` 1-15; `rooms.ts` and every identifier `ROOM_ORDER`, `roomName`, `roomLabel`, `roomF`, `Room` are gone (`git grep` in the review; `dataint`, `derived`).
- A4. `catalog.csv` and `catalog-index.csv` end with `realm,volume`; `names.json` has no `rooms`; the byte budgets still hold and `CONTRACTS.md` shows the new measures and the D4 exception (`tests/derived.js`).
- A5. `docs/fixtures/urls/routes.json` has no live `room` case (the one `f_room-laboratory` case is the retired-group case of A2) and no `why` that says "room"; `llms.txt`, `README.md`, `README.ru.md`, `ROUTES.md`, `STATE.md`, `FEATURES.md` name `vh` as a flat list of 15 (read in review).
- A6. The preview host answers `/tables/escape_the_veiled_halls` and the anchor `/tables/escape_the_veiled_halls/laboratory` with title «Escape the Veiled Halls» and description «15 позиций»;
  `/tables/vh/f_room-basement-library` returns the description «Открыть в генераторе лута» (`TEXT.open`; no labeled group is left) (`preview/worker.test.mjs`).
- A7. The two older `new-items` decision files carry an `Amended by` pointer, the new file an `Amends` line; `node tools/decisions.js` is clean (`tests/derived.js` registry check).
- A8. State count 435; the three golden changes of the count above (inventory and goldens agree, `golden.js` green).
Part B - per line:
- B1. `rollPool` keeps order, drops rungs, leaves a table without lines unchanged (`lib/roll.test.ts`).
- B2. `arazo` rolls 1-27 and `ph` rolls 1-45; every result is a head or a single item; the last is `aa78` and `ph93`; a typed `28` / `46` clamps (`components/roll.test.ts`).
- B3. In `data.js` no rung has `roll`; every line inside a roll pool has exactly one rolled record, its head, and every other line has none; pool rolls cover 1..N in table order; a roll on a rung is refused (`dataint`, `derived`, `data.test.ts` including the negative case).
- B4. A rung's record page reads «Ранг N» / "Tier N" with no «Roll N» / «номер»: `record.test.ts` holds the rung case (`ph38`: 'Pistolheart · Том 2 · Ранг 2') and the head case (`ph37`: 'Pistolheart · Том 2 · номер 10');
  the share stub names the same path: `tests/app/contracts.js`, check "a share stub names the path its record page does", takes `aa20` and `ph38` besides the heads `aa1` and `ph1`; `tests/derived.js` share-card checks.
- B5. In list view a rung row draws no number; in tile view a rung tile draws its tier («Ранг N» / "Tier N") unless the page hides the tier; a head's badge is its new roll; the equipment tables and search follow (`tables.test.ts` list and tile cases, goldens).
- B6. The Arazo and Pistolheart help text no longer says that each version has its own number, and says how to reach the other tiers (`help.test.ts`, goldens `_roll_arazo_help`, `_roll_ph_help`).
- B7. `FEATURES.md` "Rolling" holds the rule; `.claude/prompts/add-source.prompt.md` holds the `roll` line; the 2026-10-07, 2026-10-08 and 2026-11-07 decisions carry `Superseded in part by` pointers (owner rule tag written).
- B8. The changed golden set equals the 38-file list of "States and goldens", plus the 2 deleted and 1 new; no golden outside it changed (`git diff --name-only tests/app/snapshots`).
- B9. `#/roll/vh` is a `FIRST_SCREEN` entry at 360x640 (limit 256 px) and passes (`tests/app/states.js`).
- B10. The retired-group case is in `routes.json` and replays green in `hash.test.ts` and, on CI, `tests/app/contracts.js`; `PROBE` holds `['vh', 'kind-consumable']` and its comment reads 34 opens (22 probes, 12 whole tables).
- B11. The comments of step 4a no longer say "four sections", "five sections", "three whole-table rolls", or that rungs roll as their own rows or name the room (`git grep` in the review).

### Risks, do-nots, settled decisions not to reopen

- Do not renumber ids. Do not move rungs to `L.eq`. Do not infer tier from stats. Do not hand-edit `data.js`, `data.json`, `catalog.csv`, `names.json`, `i/` or a golden.
- Do not add `rollPool` calls in `App.svelte`: `RollPanel` is the one place. Do not filter by `roll != null` in code.
- Do not keep `room` "for later". Do not add a redirect for `f_room-*`.
- Do not widen the scope into the roll pages' head, the mode row or the supplements picker (VW1 owns them).
- The `new-items` file `docs/decisions/2026-11-07-the-supplements-books-are-the-table-picker-at-every-width.md` is not amended: it does not mention rooms.

## Batch B2 - the `lr` records keep rules, not lore

Open design question: none. The trim rule below is the owner's default (chat 2026-11-07); if the owner changes the rule, only the "Records" table is re-derived.

Evidence (owner, 2026-11-07): the descriptions of `lr` average 344 characters against 147 for the other 1567 records. Measured here on `f278eeee`: `lr` 344 (EN) and
374 (RU) characters over 26 records; the other `L.items` records average 171 (EN), `voa` 319 and `dv` 228.

### Why a separate batch (the criterion, and the cost)

No criterion of `CLAUDE.md`, "Task and session protocol" splits it from B1: it shares the seed (`data.js`) and, in part, the goldens. The owner asked for it as its own batch (N9),
and it is content only, so one commit reverts the trim without touching B1. Order is forced: `data.js` is one line (`wc -l` says 1), so B1 and B2 edit the same line and any merge
of the two conflicts. **B2 starts only when B1's commit is on this branch**, and it is implemented before B1's review is dispatched, so the reviewer reads one tree and B2 needs no review of its own
(no trigger fires). Folding B2 into B1 as step 1b would save one CI run (about 15 min) and one golden pass over five shared search goldens; the split costs that and keeps B1 free of a content decision the
owner may still change.

Gate cost of B2 (`.claude/README.md`, "Batch size and the fixed cost of a run"): `node tests/run-all.js dataint,derived` plus `node tools/desc-style.mjs` (a few minutes), one `node tools/build.js`,
`rtk npm run check:fast` (215-310 s; `data.js` reaches `data.test.ts` only), one `npm run build:test`, `golden.js --update --only=<id>` for the eight states of T6 (about 1 min each shard start),
then the four golden shards once in compare mode (100-290 s each), one push and one CI run (about 15 min). About 40 min of wall time and about 1 weekly point.

### The rule (default; the owner may change it)

1. Keep every sentence that states a rule: a number, a trait, a move, a condition, a limit. A feature paragraph (it opens with `***Name - Type:***`) stays whole, as the book prints it.
2. Drop every sentence that only describes appearance, history or world flavor.
3. Keep at least one sentence per record. A record that is already rules only (`lr3`, `lr9`, `lr12`, `lr16`) is untouched; so is `lr6`, where each sentence states a condition.
4. The Russian text follows the English: the same paragraphs and sentences stay, none is re-translated. The one new text is `lr23` (below); it uses the term forms already in the record («Стресс», «Ход Отдыха») per the
   `daggerheart-ru-terms` conventions of the B0 texts.
5. The removed text stays in git (`git show <the B1 tip>:data.js`). Nothing moves to a new field or file.

### Method (the `daggerheart-data-edit` approach: reversible, with a patch you can show)

`data.js` is one line, so `git diff` of it is useless for review. The implementer writes a scratchpad `node` script (not committed) that:

1. loads `data.js`, reads the "Records" table below as a map `id -> kept paragraphs` (and, for `lr21`, kept sentences; for `lr23`, the replacement text), and asserts the input: 26 records `lr1`-`lr26`, EN and RU with the same paragraph count;
2. writes `ende` and `rud` of the 26 records and nothing else, in the exact `window.LOOT=` + JSON + `;\n` form;
3. asserts the output: 1593 records in all, every id and every other field of every record unchanged, `ende` and `rud` of the other records identical, EN and RU markup shape equal per record;
4. writes two scratchpad files: `lr-trim.diff` (a per-record unified diff, one hunk per dropped paragraph, EN then RU: the patch to show the owner) and `lr-trim-undo.json` (`id -> {ende, rud}` before the trim: the reverse). The commit body names `git show <B1 tip>:data.js` as the permanent copy.

Then `node tools/desc-style.mjs` (must print "0 texts differ in EN and RU shape with no exception" and "0 texts in 0 records change"), `node tools/build.js`, and the pins below.
The planner ran this rule on a copy of `data.js` and both tools stayed clean; the lengths below are from that run.

### Records (26; the implementer applies the keep column; "P" is a paragraph, a line between newlines)

| Id | Name | Kind | EN / RU now | Keep | EN / RU after |
|---|---|---|---|---|---|
| lr1 | Anklebiter | item | 459 / 507 | P3 "Sitting in Anklebiter ... clears 1 Stress." Drop P1 (the chair) and P2 (Sitizens, the Tower) | 62 / 75 |
| lr2 | Alewife Almanac | item | 344 / 405 | P2 (the charm summons a Witch's Skillet), P3 (the move). Drop P1 (the binding) | 237 / 290 |
| lr3 | Witch's Skillet | equip | 84 / 96 | all (Double Duty) | 84 / 96 |
| lr4 | Blessed Horseshoe | item | 252 / 284 | P2 (Retail Therapy). Drop P1 (brass, the mark) | 172 / 214 |
| lr5 | Black Ledger | item | 250 / 300 | P2 (Tally). Drop P1 (leather, pages) | 155 / 181 |
| lr6 | Deed to the Last Round Table | item | 431 / 433 | all: P1 binds the table while the owner means to give shelter (a condition); P2 ties control to the Mood Swings and says when the owner may ask (a condition) | 431 / 433 |
| lr7 | Hymnal of Saint Bungus | item | 464 / 524 | P2 (Cups Up), P3 (Draw Down the Day). Drop P1 (stains, songs) | 288 / 329 |
| lr8 | Last Round Recipes | item | 326 / 350 | P2 (Brewing). Drop P1 (the old book) | 169 / 207 |
| lr9 | Loathsome Lute | equip | 252 / 247 | all (Malicious, Feedback) | 252 / 247 |
| lr10 | Noggin' Boots | item | 211 / 255 | P2 (Pumped Up). Drop P1 (leather, smell) | 112 / 153 |
| lr11 | Oiled Longcoat | item | 277 / 296 | P2 (Traveller's Companion). Drop P1 (wool, lining) | 111 / 121 |
| lr12 | Paddle of Rising Ferment | equip | 238 / 227 | all (Rising Ferment) | 238 / 227 |
| lr13 | Rose Lantern | item | 380 / 399 | P2 (Love is in the Air, whole). Drop P1 (copper rose) | 226 / 246 |
| lr14 | Wolfhorn Hunting Charm | item | 286 / 321 | P2 (Stalker's Stance). Drop P1 (horn, carvings) | 147 / 179 |
| lr15 | Apocalypse Ale | consumable | 538 / 511 | P2 (Heavy Drinker), P3 (the glasses limit and the Strength Reaction). Drop P1 (barleywine) | 429 / 425 |
| lr16 | Backstage Pass | consumable | 152 / 184 | all (Poof) | 152 / 184 |
| lr17 | Blessed Kegs of the Blazing Barrel | consumable | 297 / 321 | P2 (The Freshmaker). Drop P1 (oak, hoops, wax) | 149 / 146 |
| lr18 | Enzymatic Disabler | consumable | 317 / 349 | P2 (Goop Off). Drop P1 (the vial) | 257 / 272 |
| lr19 | Gravedraught Ale | consumable | 326 / 352 | P2 (Cold One). Drop P1 (blue ale) | 235 / 253 |
| lr20 | Longfire Fruitcake | consumable | 581 / 696 | P2 (10 lb, 5 slices, never spoils, a day's rations), P3 (the move; its results are the rule card `lr-fruitcake`), P4 (light for 1 hour). Drop P1 (brick-dense cake) | 430 / 510 |
| lr21 | Ironwood Coal | consumable | 440 / 478 | P1 sentence 2 (burns hotter and longer, works as flint and steel) and P2 (a day of burn, twice the heat, 1 Copper (Handful) per pound). Drop P1 sentence 1 (veined coal) | 374 / 404 |
| lr22 | Pocket Sand Pouch | consumable | 259 / 287 | P2 (Not In The Face). Drop P1 (the mixture) | 144 / 170 |
| lr23 | Saint Bungus Honey Butter Soap | consumable | 541 / 587 | Drop P1 (the bars, the smell). Replace P2 (its first sentence is flavor around the rest trigger) with the text below | 110 / 135 |
| lr24 | Screaming Siren Rum | consumable | 345 / 347 | P2 (Way Hay, whole). Drop P1 (spiced rum) | 289 / 291 |
| lr25 | Sacred Mother Jar | consumable | 598 / 633 | P2 (contact with Doppelcrock; contents die when removed), P3 (Burden of Proof). Drop P1 (the jar and its yeast) | 394 / 415 |
| lr26 | Scroll of Reaping | consumable | 304 / 323 | P2 (Umbral Binding). Drop P1 (vellum, red ink) | 204 / 215 |

Totals: 21 records change, 5 stay (`lr3`, `lr6`, `lr9`, `lr12`, `lr16`). The EN average goes from 344 to 225 characters, the RU average from 374 to 247. The longest text after the trim: `lr6` 431 (EN) and `lr20` 510 (RU).

Exact texts that are not a plain cut:

- `lr1` EN: `Sitting in Anklebiter as part of a Short Rest clears 1 Stress.` RU: `Если сидеть в Лодыжкогрызе во время короткого отдыха, вы очищаете 1 Стресс.`
- `lr23` EN: `***Rub a Dub - Rest Move:*** When used as part of a rest, you clear 1d4 Stress. Each bar of soap lasts 1 bath.`
  RU: `***Тру-Тру-Тру - Ход Отдыха:*** Если использовать его во время отдыха, вы очищаете 1d4 Стресса. Одного куска мыла хватает на 1 купание.`
  (The old EN wrote "stress" in lower case; the catalog writes "Stress", as `lr1` and `lr5` do.)
- `lr21` EN keeps `Ironwood coal burns hotter and longer than normal coal, and can act like flint and steel, igniting itself with any sharp blow.` as the first paragraph; RU keeps `Уголь Железного Дерева горит жарче и дольше обычного угля и может служить как кремень и огниво, воспламеняясь от любого резкого удара.`

Known side effect: `lr23` leaves the «меч» search, which it matched only through «отмечены печатью» in the dropped paragraph. `lr11` and `lr24` still match through «отмечайте» and «отмечаете» in their kept moves. No other query of the golden states loses or gains an `lr` hit (checked as whole words and as stems of five letters or more for «кольцо», «вторичное», «кинжал», «двуручное», «лечения зелья», «топор», «спальный мешок», «узоролист», over the Russian name and description; the query words of the golden states are Russian).

### Files

Edit: `data.js` (by script only), `tests/derived.js` (the `lr` block after `:2640`), `tests/app/inventory.js` (two `why` counts, T6), the 2026-11-07 source decision (one pointer), `.claude/prompts/add-source.prompt.md` (T8, only if the owner confirms).
Create: `docs/decisions/<date>-the-last-round-table-records-keep-rule-text-and-lose-lore.md`.
Re-seeded by `golden.js --update --only=<id>` (never by hand): the eight goldens of T6. Not touched: any component, spec, fixture or contract file.

### Steps (ordered)

1. Check that B1's commit is on the branch (`git log --oneline -5`) and `git status` is clean. If `main` moved, merge it first.
2. Write the script above and run it; read `lr-trim.diff` and compare the EN and RU lengths with the "Records" table (a difference is a defect in the script or the table, not a reason to improvise).
3. `node tools/desc-style.mjs`; `node tools/build.js`; search `i/lr*.html` and `i/en/lr*.html` for `undefined`.
4. Pins in `tests/derived.js`, `lr` block: `lr1` has the two exact sentences above; `lr23` has the two exact texts above; no `lr` record has `ende` longer than 450 or `rud` longer than 520 characters, and none is empty
   (the ceiling is the longest kept text, 431 and 510, rounded up; it guards a wholesale revert of the trim, not flavor in a short text; drop it if the owner changes the rule).
5. Decision file from `.claude/templates/decision.template.md`: title "The Last Round Table records keep rule text and lose lore". Task `roll-per-line` (owner request, 2026-11-07). Decision: the 26 `lr` records keep rule sentences only (the rule above); the removed text stays in git at B1's tip.
   Rejected: keep the lore (the `lr` descriptions average 344 characters against 147 for the other records); rewrite or summarize the lore (it invents text the book does not print); move the lore to a `lore` field or a file (dead data that nothing reads).
   `Amends "Pistolheart, The Last Round Table and Veiled Halls are sources ph, lr and vh" (2026-11-07): the 26 lr records carry rule text only.` Write the mirror line `Amended by` into that older file (B1 already added its own pointers there), then `node tools/decisions.js`.
6. Goldens: `npm run build:test`, then `node tests/app/golden.js --update --only=<id>` for each state of T6, then the four shards once in compare mode (`node tests/app/golden.js --shard=n/4`, one at a time, in the background).
   Read `git diff --stat tests/app/snapshots`: the set must equal T6.
7. Gates: `node tests/run-all.js dataint,derived`, `rtk npm run check:fast` (Bash timeout 600000), commit (Conventional Commits, e.g. `feat(data): cut the Last Round Table records to rule text`), push, CI.
8. Hand the diff table and `lr-trim.diff` to the orchestrator for the owner; the reviewer of B1 reads B2's commit too.

### Standing checks

1. Scale. No collection with a limit changes. States: empty, one, many, at the limit and 3x are `unchanged` (the pool is 26 and no row count moves). Longest text: the longest `lr` text falls from 598 / 696 to 431 / 510 characters,
   so no row, face or dialog gets taller; the shortest becomes `lr1` at 62 / 75 (a one-line description; `lr3` is 84 / 96 today, so the state exists). Proof at 360 px and 1180 px: the goldens `_roll_lr` (a face with the one-line `lr1`) and `_tables_lr` (26 rows),
   and the existing `ROLL_FIT` and sweep cases, which only get more room. Row order, primary action, folds, popups, sticky regions: unchanged.
2. Error scenarios. No write path and no stored shape (lists, shares and print sets hold ids, and the ids do not change). Loading, failed read, offline: the existing no-data page. Stale tab or a cached `data.js` from before B2: the tab shows the long text until it reloads; nothing is stored or lost.
   A list or share that holds an `lr` record shows the shorter text. A user note on an `lr` record is the user's own text and is untouched. A shared search link for «меч» opens with one row fewer (`lr23`). Revert: `git revert` of the B2 commit restores the text; nothing stored depends on it.
   Conflict and deleted record: not applicable. A path that loses stored data: none.
3. Consistency. `FEATURES.md`, "Records", "Catalog style" (the feature name `***Name - Type:***`, bold costs, italic conditions) holds: `node tools/desc-style.mjs` is clean. Departure: `lr` records now carry rules only, while the other sources keep their descriptive sentences
   (`voa` averages 319 characters, `dv` 228). The owner asked for `lr` only; applying the rule to another source is a separate owner decision (Deferred). The page heads, counters, toasts and buttons: not applicable (no screen changes).
4. RU/EN parity. Every kept text keeps both languages with the same paragraphs and sentences; the Russian is the old Russian, cut in step with the English (`dataint` checks the markup shape per record). The one new text, `lr23`, has both languages with the same facts (rest, 1d4 Stress, 1 bath), ASCII hyphens, no plural change.

### Acceptance (each line has its proof)

- T1. Each of the 26 records holds the text of the "Records" table, EN and RU (the script's assertions; `lr1` and `lr23` pinned in `tests/derived.js`).
- T2. `dataint` still reports 1593 records; `lr1`-`lr26` keep ids, `roll` 1-26, `img` and every field except `ende` and `rud`; no other record changed (the script's assertions; `dataint`, `derived`).
- T3. EN and RU have the same paragraph count and markup shape per `lr` record; `node tools/desc-style.mjs` is clean (dataint "catalog style", the tool's own output).
- T4. No `lr` record has `ende` over 450 or `rud` over 520 characters, and none is empty (`tests/derived.js`).
- T5. `node tools/build.js` regenerates the derived files and share stubs, and the stub first-line check passes (`tests/derived.js`, share stub checks).
- T6. The changed golden set is exactly eight files: `_roll_lr`, `_tables_lr`, `_search_a_row_ticked`, `_search_capped`, `_search_filter_sheet_as_gm1`, `_search_searched`, `_search_selecting` (lr rows, and the `lr23` row gone from the «меч» results), and `_search_kind_picked`
  (its `why` count). The `why` strings of `#/search ~ searched` ("139 rows") and `#/search ~ kind picked` ("из 139") in `tests/app/inventory.js` are already stale (the golden of the second prints «Показано 91 из 145»); write the counts that the run shows (a stale line in a touched path).
  Unchanged and checked: `_i_lr6_ref_open` (`lr6` is whole), every `_tables_eq_*` golden (it shows only `lr3`, `lr9`, `lr12`), `_search_stat_line` (`lr9`, `lr12`), every B1 golden not named here. Every diff is shorter `lr` text, the missing `lr23` row, or a count.
  Search goldens that B1 already re-seeded (`_search_a_row_ticked`, `_search_capped`, `_search_filter_sheet_as_gm1`, `_search_kind_picked`, `_search_searched`, `_search_selecting`) are re-seeded again on top of B1's tree; they must not lose B1's changes.
- T7. The decision file exists, `node tools/decisions.js` is clean, and the 2026-11-07 source decision carries `Amended by "The Last Round Table records keep rule text and lose lore"` (`tests/derived.js` registry check).
- T8. Only if the owner confirms the rule is general: `.claude/prompts/add-source.prompt.md:119` ("Lore is a product question: raise it, do not ship it silently") gains a clause: "`lr` ships rule sentences only (owner, 2026-11-07)". Otherwise the decision file alone records the rule.
- T9. The four standing checks above are answered in the handoff's Completed block.

### Risks, do-nots, settled decisions not to reopen

- Do not start B2 before B1 is on the branch: `data.js` is one line, so the two edits conflict wherever they meet. Do not hand-edit `data.js`. Do not re-translate or reword the Russian; cut it. Do not touch the rule cards (`lr-deed`, `lr-recipes`, `lr-fruitcake`): they hold the rules the three records point at.
- Do not widen the rule to another source in this batch. Do not add a `lore` field or file. Do not renumber ids or change `roll`.
- If the owner changes the rule, re-derive the "Records" table first; the script, pins and goldens follow from it.

## Interplay with 57-debt batch VW1 (`issues/57-debt/plan-views.md`, worktree `.claude/worktrees/57-debt`)

VW1 changes `ModeRow`, `RollPage`, `Shell`, `TableNav` (narrow), `HomebrewTabs`, `TablesPage`, `HomebrewPage`: up to 760 px the mode row becomes a picker row and a
sheet; from 761 px «Дополнения» opens that sheet (its button gets `haspopup=dialog`; the roll goldens at 1100 print `haspopup=menu` today). B1 edits none of those
components (it edits only a comment in `TablesPage.svelte`).

- Order: **no fixed order.** Both start after `new-items` ships. Take the one that is ready; the second one merges `main` first.
- Shared files, and how to merge them: specs (`FEATURES.md` "Rolling", `ROUTES.md`, `STATE.md`, `COVERAGE.md`, `DESIGN.md`) and `tests/app/inventory.js`, `states.js`, `sweep.js`, `typo.js`
  by hand, as text. The one nearby hunk is the `states.js` case that reads `.reshead .morewrap` (VW1 calls it case 89; find the case by `git grep -n -F "pick select" tests/app/states.js`): VW1 rewrites the `.reshead` lines, B1 removes one route from the `.pick select` list about 40 lines below.
- Shared goldens: `_roll_arazo`, `_roll_arazo_help`, `_roll_ph`, `_roll_ph_help`, `_roll_vh`, `_roll_vh_help` (and, if VW1 changes the pill's `haspopup`, every other supplement roll golden). Never
  merge a golden by text. The second task re-seeds after the merge, in its last step before the push, and reads each diff: B1's lines are numbers, help text and the `vh` picker; VW1's are the
  `haspopup` value and the mode row.
- VW1's first-screen figures: the `vh` page drops its picker row in B1, so its primary only moves up. The VW1 limit for the ten supplements (at most 253 px at 360x640) is met either way.
- VW1's plan says "Out: the vh rooms (task roll-per-line)": consistent with this plan. VW1's section 5 already names the shared roll goldens.

## Deferred

- A "roll a random tier" option for a line head (D1, different feature).
- `COVERAGE.md` rows named "Eight roll modes" and `FEATURES.md` rule 4's "seven supplement pages" are stale (twelve modes, ten supplements). Fixed in the lines B1 touches; the rest goes to the closeout note to the owner.
- The `lr` trim rule for another source (`voa` averages 319 characters, `dv` 228): an owner decision, not planned. The owner asked for `lr` only.

## Do-nots (summary)

Ids stay. Rungs stay in their tables. One rule for every source. The data decides which rows roll, the code only drops rungs.
