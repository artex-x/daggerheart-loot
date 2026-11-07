# Plan - TASK roll-per-line

Facts: `context.md`. Branch `claude/roll-per-line`. Refreshed 2026-11-07 against `main` at `49528e95` (task 57 closed)
and `claude/new-items` at `e3c18ad0` (the code this task edits: it adds `ph`, `lr`, `vh` and the section descriptor).
The first plan (2026-11-05) was written against `b6f153a5`; this refresh replaces it. Symbols, not line numbers, are
the address of an edit: line numbers drift (the numbers below are `new-items` at `e3c18ad0` unless a column says `main`).

## Status

- State: planned, implement-ready after the start gate. Nothing implemented.
- Plan review: required before B1 (trigger: public contract change - the `room` filter group of `vh`, the `room`
  column of `catalog.csv` and `catalog-index.csv`, the `rooms` key of `names.json`, the roll range of three routes)
- NEEDS_HUMAN_CONFIRMATION: no (no product law changes; the open owner decisions D2 to D5 have a default and are vetoable)
- Next batch: B1 (one batch, two parts: A `vh` is one flat list, B one roll row per item).

## Start gate

Start B1 only when task `new-items` is closed: `issues/new-items/` is deleted and its squash is on `main`.
Both tasks edit `data.js`, `tests/dataint.js`, `tests/derived.js`, the roll goldens and the same specs; and Part A
removes code that only `new-items` adds. Do not merge `main` into this branch before the gate opens.

At the start, in a fresh worktree from `main`:

1. Merge `main` into `claude/roll-per-line` (`docs/decisions/2026-10-22-a-task-branch-takes-main-by-a-merge.md`).
2. Re-run the symbol list of "Code references" with `git grep -n` on the merged tree. If `new-items` changed after
   `e3c18ad0` (a review fix), the list is the truth and this plan is only the guide.
3. List the pools that hold a line:
   `node -e "global.window={};require('./data.js');const L=window.LOOT;for(const [k,v] of Object.entries(L.items)){const l=v.filter(x=>x.eq&&x.eq.line);if(l.length){const r=l.filter(x=>x.eq.line!==x.id).length;console.log(k,v.length,'line rows',l.length,'rungs',r,'pool',v.length-r)}}"`.
   Expected: `frames 94 56 42 52` (not a roll pool: no row has `roll`), `arazo 78 68 51 27`, `ph 93 64 48 45`. Any other
   rolled table in the list gets the same treatment; `lr` and `vh` print nothing.
4. Run the golden scan of "States and goldens" (the file list is the acceptance list, not a guess).

## What changed since the 2026-11-05 plan

| Item | Old plan | Now |
|---|---|---|
| `ph` pool | 49 (16 heads + 4 armor + 29 items) | **45**. The 4 armors are inside the 29 single items; the old sum counted them twice. Measured on `e3c18ad0`. |
| Tier ladder on the roll result | "the result card already shows it" | **False.** A roll result is `RecordCard variant="face"`; the ladder draws on `full` only (`FEATURES.md`, "Rolling"; owner 2026-11-04). The other tiers open from «Открыть карточку» (the dialog, a full card). Decision D2. |
| Pool rule | `rows.filter(roll != null)` | `rows.filter(not a rung)`. Fixtures in `sections.test.ts` rows carry no `roll`; a `roll != null` filter would empty them. `dataint` still pins `roll` against pool membership. |
| Where the rule runs | `App.svelte`, per caller | `RollPanel.svelte`, once: both `ROLL_TABLE` and `PickerRollPanel` go through it. |
| Help text | "no new text" | Five paragraphs change in both languages (`ARAZO`, `PH`, `VH` in `help.ts`); the Arazo and Pistolheart text says each version has its own number. |
| Goldens | "re-seed `_roll_arazo*`, `_tables_arazo*`, the `ph` ones" | About 42 changed, 1 new, 2 deleted: the equipment tables and search print the roll number of arazo and ph rows too. |
| `vh` | not in scope | Part A: a flat list of 15, no rooms (owner, 2026-11-07). |
| Decisions to supersede | the 2026-10-08 Arazo rebalance | also the 2026-10-07 Arazo source decision (it rejected base-only rolls on purpose) and the `new-items` decisions of 2026-11-07. |
| Plan review | not required | **Required**: public contract change (below). |

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
| Row number | `app/src/components/TableRows.svelte`: `rollNum = entry.n ?? it.roll` | - | 173 | none: a rung row draws no number badge (`RowMain.svelte` `{#if num}`) |
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
| Preview host | `preview/worker.mjs`: `ROOM_LABEL` import, `roomLabel`, `SECTIONED.vh`; `preview/worker.test.mjs`: names fixture `rooms`, the `f_room-basement-library` case | - | 24, 531, 546; 82, 1690 | Part A |
| Review tool | `tools/artwork/review/review.mjs`: `if (record.roll)` badge | - | 144 | none |
| Data pins | `tests/dataint.js`: the `room` rule (before `text hygiene`), the `table numbering` block (`ROLL_POOLS`, `ROLLED`, `vh` branch) | 243-290 | 79-82, 262-345 | Both parts |
| Data pins | `tests/derived.js`: block `Arazo's Artifacts`; block `Pistolheart, The Last Round Table and Escape the Veiled Halls`; the `realm,volume,room` head check; the `vhRow` check | 2457 | 2457-2490, 2594, 2598-2675 | Both parts |
| Route fixtures | `docs/fixtures/urls/routes.json`: the `f_room-laboratory` case, the `why` of the `pistolheart` roll | - | 363, 132 | Part A: delete the case. Part B: reword `why` |
| Browser suites | `tests/app/inventory.js`; `tests/app/states.js` (route list with `.pick select`); `tests/app/sweep.js` (anchor `laboratory`); `tests/app/contracts.js` (`PROBE` `['vh','room-library']`) | - | 960-1010, 1393; 6565; 175; 370 | Part A |
| Unit tests | `sections.test.ts` (`vh` fixture, `describe('Escape the Veiled Halls')`, the no-data list, the axe case), `facets.test.ts`, `hash.test.ts`, `help.test.ts`, `i18n.test.ts`, `label.test.ts`, `sectionProps.test.ts`, `roll.test.ts` | - | see `git grep -n -E "room\|Veiled"` in each | Both parts |

Specs and docs to edit (grep each for `room`, `1-78`, `1-93`, `Veiled`): `docs/specs/FEATURES.md` ("Rolling": the mode table, the picker bullet,
the Pistolheart and Veiled Halls bullet, the result bullet that says a result draws no ladder; "Tables and search": the
preview-card sentence that names a room), `ROUTES.md` (roll table rows for the three routes, the anchor example `library` on `vh`, the filter
table row `vh`, the value list `room ...`), `CONTRACTS.md` (rows `aa`, `ph`, `vh` of the id table; the `catalog.csv`
bullets; the `names.json` bullet; the byte measures), `STATE.md` (roll inputs `vh {r, n}`), `COVERAGE.md` (rows for
`roll.test.ts`, `dataint`, the golden state count: the text says 411, `STATES` holds 436), `README.md` and `README.ru.md`
(the mode table; the `vh` id paragraph), `llms.txt` (the column lists, the `vh` row, the roll route line, the filter keys,
the homebrew "never carries" list), `.claude/prompts/add-source.prompt.md` (the `roll` field line).

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
every `eq.line` has at most one rolled record and it is the head. The two copies of `isRung` carry a comment that names each other.

### Verified in code

- Share card and stubs: `tableOf` returns the source table for `arazo` and `ph` before it reads `roll`. A rung without `roll`
  prints «Tier N» in `where()` and `subtitle()` sets `noTier`, so the tier shows once. A head prints «Roll N» and its tier in the stat line.
- The saved roll number is page memory (`STATE.md`, "Roll inputs"); no port stores it. `NumberField` clamps to `max`. Nothing to migrate.
- `ListPage.svelte` has its own roll over a list's rows (`hitRow = rows[roll - 1]`). It does not read a source table. Not touched.
- Three other readers of `roll` as a signal: `RecordCard` (badge), `RecordPage` (path line), `review.mjs` (badge). A rung shows
  none of them, which is the wanted result.
- `catalog.csv` `roll`: a rung prints an empty cell. A consumer that read `roll` of a rung as its place in the book gets an empty cell; `README.md` says what the column means.

## Decisions (planner defaults; the owner may veto each)

- D1 (carried from 2026-11-05; owner may veto): the public roll ranges shrink (`arazo` 1-78 to 1-27, `ph` 1-93 to 1-45) and a
  roll shows the head (Tier 1). A random tier is a different feature.
- D2 (new; owner may veto): the other tiers of a rolled line open from «Открыть карточку» / "Open card" (the dialog, a full card
  with its «Ранг» / "Tier" row) and from the name link (the record page). The result face keeps drawing no ladder (owner
  2026-11-04). The help text says so. Alternative: draw the ladder on the result face of a line head. Rejected as the default: it
  reverses the 2026-11-04 rule and adds a row to the face, which the First-Screen Rule counts. Cost of D2: a player who wants
  Tier 3 needs two presses (open the card, press the rung), where the old build could roll it directly.
- D3 (new; owner may veto): the `room` field is deleted from the 15 `vh` records; the room map is kept in the decision file.
  Alternative: keep an unused field. Rejected: dead data, and `dataint` would have to pin it.
- D4 (new; owner may veto; conflicts with the text of `CONTRACTS.md`): the `room` column leaves `catalog.csv` and
  `catalog-index.csv`, and the `rooms` key leaves `names.json`, with no new file name and no `version` 2. The spec says "any other
  change is a new file name" and "any other change is `version` 2". Reason for the exception: both were added on 2026-11-07 as the
  last column and a new key, they are generated at build and not committed, no reader of `room` is known, and a reader by header name is
  unaffected. Accepted trade-off: a position-based reader of the last column breaks. The decision file records the exception.
  Alternatives: keep `room` as an empty column and an empty `rooms` object (no break, dead surface); publish new file names (the owner
  asked for removal, and a new name is more churn than the column is worth).
- D5 (new; owner may veto): `f_room-*` and the anchors `basement`, `dressing`, `laboratory`, `library` stop being addresses. An old link
  opens the whole `vh` table (unknown groups fail open, `ROUTES.md` "Filter grammar"); an anchor scrolls to nothing. No redirect.
- D6: one batch, two parts, one commit (the batch-size section).

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

Split fallback (only if the plan review or the owner vetoes D4): Part A becomes B1 and Part B becomes B2. Part B is then
independent of every `vh` file.

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
5. Help text (both languages, ASCII hyphens as the neighbours): see "Help text".
6. Pins, Part A and B together. `tests/dataint.js`: delete the `room` rule; in `table numbering` delete the `vh` branch (the generic branch now
   holds it) and make the generic branch push `rows.filter((x) => !isRung(x))`; add `isRung` (comment: the twin of `roll.ts`); add
   "every `eq.line` has at most one rolled record, and it is the head" and "in each pool the rolls ascend in table order". Keep the
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
   the whole-table axe case in `roll.test.ts`; add one if absent). `data.test.ts`: `rollPools` drops the `vh` branch and the rungs. `facets.test.ts`,
   `hash.test.ts`, `help.test.ts`, `i18n.test.ts`, `label.test.ts`, `sectionProps.test.ts`: remove the room cases; `i18n.test.ts` loses `roomF`,
   the `rooms` of `names.json` and the `f_room-*` address cases; `help.test.ts` loses the «Лаборатория - 3» checks and gains the new counts (27,
   45, 15). End each component test that you touch with `expectNoA11yViolations` where it already does.
8. Browser suites. `inventory.js`: delete `#/roll/vh ~ laboratory` and `#/tables/vh ~ library picked`; add `#/tables/vh` (why: "a plain body with
   a kind row, 15 rows in book order", the twin of `#/tables/lr`); reword the `why` of `#/roll/arazo`, `#/roll/ph`, `#/roll/vh` and `#/roll/vh ~ help`.
   `states.js`: remove `'#/roll/escape_the_veiled_halls'` from the route list that reads `.pick select`. `sweep.js`: remove the anchor `laboratory`.
   `tests/app/contracts.js`: remove `['vh', 'room-library']` and fix the count in the comment above `PROBE` (read it from the array).
   `docs/fixtures/urls/routes.json`: delete the `f_room-laboratory` case and reword the `pistolheart` roll `why` (no "93").
9. Specs and docs (same commit). `FEATURES.md`, "Rolling": the mode table (`1-27`, `1-45`, `1-15`, `vh {n}`); the picker bullet (three pickers; "a realm is a fixed
   chip"); the Pistolheart and Veiled Halls bullet; add the rule bullet "One roll row per item: an upgrade line is rolled once, at its
   head; its other tiers open from the card, whose «Ранг» row lists them. A rung has no `roll`." Departure line in the result bullet that says a result draws no
   ladder. `ROUTES.md`, `CONTRACTS.md` (id rows; the `catalog.csv`, `catalog-index.csv` and `names.json` bullets, with the D4 exception stated, the new byte
   measures read from `tests/derived.js`), `STATE.md`, `COVERAGE.md` (state count from `STATES.length`, the new pins), `README.md`, `README.ru.md`,
   `llms.txt`, `.claude/prompts/add-source.prompt.md` (the `roll` line: "an upgrade line is one roll row; give rungs no `roll`").
10. Decisions. Write the two files named under "Create" from `.claude/templates/decision.template.md`: (1) "One roll row per item: an upgrade line is rolled at its head" -
    Supersedes in part: "Arazo's Artifacts: source arazo, ids aa1-aa51, tier formulas as lines" (2026-10-07, the rejected base-only rolls), "Arazo's Artifacts rebalanced
    to Core bands: every piece a line, ids aa1-aa78" (2026-10-08, the rolls), "Pistolheart, The Last Round Table and Escape the Veiled Halls are sources ph, lr and vh" (2026-11-07, the
    `ph` roll equal to the id). Rejected: weights; moving rungs; a random tier. (2) "Escape the Veiled Halls is one flat list with no rooms" - Amends the same 2026-11-07 file
    (its rejected "flat vh roll 1-15" is adopted; `room`, the room roll and the d3 are gone) and "A table sectioned by a record property reads one descriptor" (2026-11-07; `vh` leaves
    `SECTION_PROP`, which keeps `mwt` and `ph`). It records the D4 exception, D5, and the room map. Write the mirror line (`Superseded in part by` / `Amended by`) into each older file, then run `node tools/decisions.js`.
11. Goldens, last. Merge `main` again first if it moved. `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to 4, one at a time, in the background.
    Read `git diff --stat tests/app/snapshots`: the changed set must equal the scan list in "States and goldens". A file outside that list is a defect to read, not to re-seed.
12. Gates: `node tests/run-all.js dataint,derived,contracts` (the CSV and `names.json` pins), `rtk npm run check:fast` (Bash timeout 600000; in the background if it passes 600 s), the focused browser
    run for the shard that holds the changed `states.js` list (`node tests/run-all.js app/states`, background), push, CI (the credit arms the squash).
13. Reviewer (Opus; triggers: public contract change, data change). One remediation commit.
14. Closeout (`/handoff`): audit this directory against the durable list, delete it, squash onto `main` after a green CI run.

### Help text (both languages; keep the other paragraphs and the link parts)

| Key | Paragraph | Russian | English |
|---|---|---|---|
| `ARAZO` | 1 | В таблице 27 позиций - 10 предметов и 17 единиц снаряжения (оружие и броня), в порядке книги. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно. | The table holds 27 entries - 10 items and 17 pieces of equipment (weapons and armor), in the book's own order. No die covers that range, so the button picks an entry at random. |
| `ARAZO` | 3, sentence 2 | Бросок даёт базовую версию; остальные три открываются из карточки, в ряду «Ранг». | A roll gives the base version; open the card to reach the other three in its "Tier" row. |
| `PH` | 1 | В таблице 45 позиций из трёх томов - 18 предметов, 7 расходников, 16 видов оружия и 4 брони, в порядке книг. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно. | The table holds 45 entries from three volumes - 18 items, 7 consumables, 16 weapons and 4 armors, in the books' own order. No die covers that range, so the button picks an entry at random. |
| `PH` | 2, sentence 2 | Бросок даёт базовую версию; остальные открываются из карточки, в ряду «Ранг». | A roll gives the base version; open the card to reach the others in its "Tier" row. |
| `VH` | 1 | В разделе 15 позиций приключения - 7 предметов и 8 расходников, в порядке книги. Кости на такой диапазон не бывает, поэтому кнопка выбирает позицию случайно. | This section holds the adventure's 15 entries - 7 items and 8 consumables, in the book's own order. No die covers that range, so the button picks an entry at random. |

In `ARAZO` and `PH` the sentence "У каждой версии свой номер, поэтому ... выпадает чаще предметов" / "Each version has its own number, so ... come up more
often than items" is replaced by the sentence above, not kept.

### Standing checks

1. Scale. No collection with a limit is drawn: a roll pool has no `limit_defaults` row, so the "at the limit, one past it, 3x" rows are not applicable. The pool sizes are
   data (45 at most). States, with the proof:

| State | What the screen shows | Proof |
|---|---|---|
| Empty (no rows: a `data.js` held in the HTTP cache from before the source) | the page, then «Данные не загрузились. Обновите страницу.»; for `vh` no picker | `sections.test.ts` no-data tests (`vh` now in the whole-table case) |
| One | not applicable: no pool of one | - |
| Many | `arazo` «Бросить 1-27», `ph` «Бросить 1-45», `vh` «Бросить 1-15»; the button names a range, not a die (15, 27 and 45 are not dice, `REAL_DICE`); the field label «Результат броска (1-N)» | `components/roll.test.ts` real-data blocks; goldens `_roll_arazo`, `_roll_ph`, `_roll_vh` |
| A number past the new max (78 on `arazo`, 93 on `ph`, 50 on `vh`) | clamps to the max | `components/roll.test.ts` |
| A rung id opened by link, list, search or share | the record page of the rung; its line reads «Tier N», no «Roll N» | `record.test.ts` (add one rung case), share-card test in `tests/derived.js` |
| Longest text | the three help paragraphs are within a line of the old ones; the `~ help` goldens at 1100 and the help-box check in `states.js` (`#/roll/arazo ~ help`) hold | goldens, `states.js` |
| Table pages `arazo`, `ph`, the equipment tables, search | a head and a single item draw their number badge; a rung draws none; row order and row count unchanged (78, 93, 15) | goldens, `tables.test.ts` (add one rung-row case) |
| 360 px and 1180 px | `vh` loses its picker row, so its first result sits higher than before; the rule (256 px for the roll pages) holds with more room | `states.js` first-screen case at 360 and `sweep.js` |

   Row order, primary action, folds and popups: unchanged on the other pages; the `vh` roll page has the same shape as `lr` and `dv` (no new popup, no sticky region).
2. Error scenarios. No write path and no stored shape (rolls are page memory; lists, shares and print sets hold record ids, which do not change). Loading and failed
   read: the existing no-data page. Offline: the cached `data.js` and bundle pair; see stale tab. A deleted record that a list names: unchanged. Conflict: not
   applicable. Stale tab (old bundle, new `data.js`): the old `vh` picker finds no `room`, so each room is empty and the page says the data did not load; the
   recovery is a reload; nothing is stored. The old `arazo` and `ph` panels draw all rows and still work. New bundle with an old cached `data.js`: `arazo` and `ph`
   pools are the 27 and 45 non-rung rows (the filter is structural), `vh` is the 15 rows in table order; numbers on cards are the old ones until the data refreshes.
   Revert: the previous frontend with the new data behaves as the stale tab. A path that loses stored data: none (no `localStorage` key changes). An old
   `f_room-*` link: the whole `vh` table (D5).
3. Consistency. `FEATURES.md`, "Consistency rules": rule 4 (the name of `vh` in the pill, menu, heading and tab does not change), rule 6 (the no-data line is the shared one),
   rule 7 (the roll page draws its `h1` in every state); rules 1, 2, 3, 5 and 8 on are not applicable (no counter, failure, delete, toast or create). Siblings: `vh`
   joins `lr`, `dv` and `arazo` as a whole-table roll; its table page joins `lr` as a kind-row table with no sections; a head and a single item show «Roll N» and a rung shows
   «Tier N» on the record page, in the share stub and in the table row (no badge). The departure from the first plan: none.
4. RU/EN parity. No new dictionary key; four dictionary lines go (`roomLabel`, `roomF`, both languages; `i18n.test.ts` checks the key sets agree). Five help paragraphs change in
   both languages with the same facts (27 / 45 / 15 entries, the base-version sentence, the card's «Ранг» / "Tier" row). No plural. ASCII hyphens. `README.ru.md` mirrors `README.md`.

### States and goldens (the count)

- `STATES` in `tests/app/inventory.js`: 436 on `e3c18ad0`; after B1 **435** (`vh`: -2 deleted, +1 added). `COVERAGE.md` says 411 (stale); write the real number.
- Deleted goldens (2): `_roll_vh_laboratory`, `_tables_vh_library_picked`. New golden (1): `_tables_vh` (both languages inside the file).
- Changed goldens, expected (about 42): `_roll_arazo`, `_roll_arazo_help`, `_roll_ph`, `_roll_ph_help`, `_roll_vh`, `_roll_vh_help` (6); `_tables_arazo`, `_tables_ph`, `_tables_ph_table_picker` (3);
  the equipment tables `_tables_eq_weapon` and its 16 variants, `_tables_eq_armor`, `_tables_eq_secondary`, `_tables_eq_secondary_searched` (20); `_search_*` that
  print an arazo or ph row (9 to 10). A scan of `e3c18ad0` finds 36 files with a numbered arazo, ph or vh row; `_tables_voa`, `_tables_voa_section_anchor` and
  `_search_words_in_any_order` are probably name clashes with another book. The compare run fixes the list.
- Unchanged and checked: `_roll_lr`, `_tables_lr`, `_i_lr6_ref_open`, `_roll_mwt*`, `_tables_mwt*`.
- Every diff in these files must be: a roll number gone from a rung row, a new number on a head, the help text, the «1-N» range, or the `vh` picker. Anything else is a defect.

### Acceptance (each line has its proof)

Part A - `vh`:
- A1. `#/roll/escape_the_veiled_halls` draws no room picker, no «Комната» / "Room", one button «Бросить 1-15» / "Roll 1-15" and the field label «Результат броска (1-15)»; typing `9` draws `vh9` (`components/roll.test.ts`, golden `_roll_vh`).
- A2. `#/tables/escape_the_veiled_halls` draws 15 rows with no section headings and a kind row only; `f_room-library` opens the whole table; `f_kind-consumable` narrows to 8 (`tests/app/contracts.js`, `tests/contracts.js`, golden `_tables_vh`, `hash.test.ts`).
- A3. No record has `room`; `vh1`-`vh15` carry `roll` 1-15; `rooms.ts` and every identifier `ROOM_ORDER`, `roomName`, `roomLabel`, `roomF`, `Room` are gone (`git grep` in the review; `dataint`, `derived`).
- A4. `catalog.csv` and `catalog-index.csv` end with `realm,volume`; `names.json` has no `rooms`; the byte budgets still hold and `CONTRACTS.md` shows the new measures and the D4 exception (`tests/derived.js`).
- A5. `docs/fixtures/urls/routes.json` has no `room` case; `llms.txt`, `README.md`, `README.ru.md`, `ROUTES.md`, `STATE.md`, `FEATURES.md` name `vh` as a flat list of 15 (read in review).
- A6. The preview host answers `/tables/escape_the_veiled_halls` and `.../f_room-basement` with the table card and no room name (`preview/worker.test.mjs`).
- A7. The two older `new-items` decision files carry an `Amended by` pointer, the new file an `Amends` line; `node tools/decisions.js` is clean (`tests/derived.js` registry check).
- A8. State count 435; the three golden changes of the count above (inventory and goldens agree, `golden.js` green).
Part B - per line:
- B1. `rollPool` keeps order, drops rungs, leaves a table without lines unchanged (`lib/roll.test.ts`).
- B2. `arazo` rolls 1-27 and `ph` rolls 1-45; every result is a head or a single item; the last is `aa78` and `ph93`; a typed `28` / `46` clamps (`components/roll.test.ts`).
- B3. In `data.js` no rung has `roll`; every `eq.line` has one rolled record and it is the head; pool rolls cover 1..N in table order (`dataint`, `derived`, `data.test.ts`).
- B4. A rung's record page reads «Tier N» with no «Roll N»; its share stub reads the same; a head reads «Roll N» (`record.test.ts`, `tests/derived.js` share-card checks).
- B5. A table row of a rung draws no number badge; a head's badge is its new roll; the equipment tables and search follow (`tables.test.ts`, goldens).
- B6. The Arazo and Pistolheart help text no longer says that each version has its own number, and says how to reach the other tiers (`help.test.ts`, goldens `_roll_arazo_help`, `_roll_ph_help`).
- B7. `FEATURES.md` "Rolling" holds the rule; `.claude/prompts/add-source.prompt.md` holds the `roll` line; the 2026-10-07, 2026-10-08 and 2026-11-07 decisions carry `Superseded in part by` pointers (owner rule tag written).
- B8. The changed golden set equals the scan list; no golden outside it changed (`git diff --name-only tests/app/snapshots`).

### Risks, do-nots, settled decisions not to reopen

- Do not renumber ids. Do not move rungs to `L.eq`. Do not infer tier from stats. Do not hand-edit `data.js`, `data.json`, `catalog.csv`, `names.json`, `i/` or a golden.
- Do not add `rollPool` calls in `App.svelte`: `RollPanel` is the one place. Do not filter by `roll != null` in code.
- Do not keep `room` "for later". Do not add a redirect for `f_room-*`.
- Do not widen the scope into the roll pages' head, the mode row or the supplements picker (VW1 owns them).
- The `new-items` file `docs/decisions/2026-11-07-the-supplements-books-are-the-table-picker-at-every-width.md` is not amended: it does not mention rooms.

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

## Do-nots (summary)

Ids stay. Rungs stay in their tables. One rule for every source. The data decides which rows roll, the code only drops rungs.
