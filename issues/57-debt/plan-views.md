# Plan - one control for the view or mode (task 57-debt, step V)

This file plans one consistent control to choose the page you are in on the roll pages (`/roll/*`), the tables (`/tables/*`) and «Мои предметы» (`/homebrew*`). It holds the measured current state, the options, one recommendation and one implement-ready batch, `VW1`. "View" here means the sibling page (a roll mode, a table, a homebrew tab), not the list or grid switch of the tables; the owner's two screenshots compared the roll pills and the tables' book picker.

## Status

- Planned 2026-11-07 (planner). Not started. Start gate: task `new-items` batch V1 is on `main` (the ten supplements and the supplements picker tab from 761 px).
- Plan review: not required (no trigger fired). No migration, no stored data, no write path, no public contract change: the routes, the `data-section` keys and `routes.json` stay.
- `issues/57-debt/plan.md` Status has no `- Plan review:` line yet. `agent-guard.mjs` denies an implementer dispatch until it has one; the orchestrator adds `- Plan review: not required (no trigger fired)` there.
- NEEDS_HUMAN_CONFIRMATION: no. The recommendation changes no product law.

## 1. Measured current state

Measured 2026-11-07 on the shipped test build (`.claude/worktrees/57/dist-test`, the tree of `main` 49528e95), Chrome for Testing, reduced motion, fonts loaded, scroll 0. "Primary" is the top of `[data-primary]` (The First-Screen Rule). `/homebrew` signed in as `gm3`. Russian and English give the same figures where one figure shows.

| Width | `/roll/*` | `/tables/*` | `/homebrew` (Items) |
|---|---|---|---|
| 360x640 | The mode row under the header, outside `main`: three pills, 40 px tall, in a 49.5 px row at 110.4 px («Обычные правила», «Альтернативные таблицы», «Дополнения ▾», a `Menu` of the supplements). «Ещё» (pin, help, copy) is in the results line with «Бросок N» and «Настроить». Primary: std 322.7 (exception 325), alt 253.9, dv, voa, community, mwt 249.9 (rule 256). | The picker row in `main` at 136.4 px, 42 px tall: the picker «Core / Предметы ▾» (two lines, 14 px, 81-83 px wide), «Список / Сетка», «Ещё». The picker opens a bottom `Sheet` (group chips, then the group's tables). Primary 230.4. | The picker row at 136.4 px, 40 px tall: the picker «Предметы ▾» (one line, body face, a larger face than the tables' picker), «Новый предмет», «Ещё». A `Sheet` with the four tabs, their counts and the limit. Primary 242.4. |
| 768x1024 | The head: `h1` «Бросок», the pin, the help on row one; the three pills on row two at 135.8 px (36.8 px). Primary std 269, dv 220.6. | The head: `h1`, pin, help; the group chips on row two (36.8 px); the reserved tab slot 83 px (two lines of tabs). Primary 333.6 (new-items V1: 291 at 768x720). | The head: `h1`, pin, «Новый предмет»; the four pills on row two at 145 px. Primary 286.2. |
| 1000x720 | One head row: the pills follow the `h1` (446 px wide RU, 357 EN). Primary std 214.2, dv 173.8. | One head row; the chips wrap to two lines in RU (80.6 px), one line in EN; tab slot 40 px. Primary 287.6 RU (rule 288), 243.8 EN. | One head row; the pills wrap to two lines in RU (80.6 px). Primary 266 RU, 231.4 EN. |
| 1180x720 | As at 1000. Primary 214.2, dv 173.8. | One head row, chips one line; tab slot 40 px. Primary 243.8. | One head row. Primary 231.4. |

Other facts:

- At 320x568 RU the roll results line of `/roll/alt` takes two lines (86 px), so its primary is 341.1; the homebrew picker row wraps to two lines (86 px; primary 374.6). 320 px is not a First-Screen width.
- The two picker buttons are two copies with different faces (`TableNav.svelte` `--t-small`, `HomebrewTabs.svelte` `--t-body`), and `.pickrow` is two copies (`TablesPage.svelte` gap 4, no wrap; `HomebrewPage.svelte` gap 6, wrap). This is the first item of this plan's step 4.
- After new-items there are 12 roll modes (`SUPPLEMENTS` holds ten) and 22 tables; from 761 px the tables' supplements are one lit picker tab that opens the picker's `Sheet` (`docs/decisions/2026-11-07-the-supplements-books-are-the-table-picker-at-every-width.md`).

## 2. Options

Taps count from the page to another sibling page. "Room" is the width left to the picker's name at 360 px.

| | A. One picker at every width | B. Pills and an overflow menu at every width | C. A mixed rule by count (pills where all fit one row) | D. The tables' shape on all three: the picker row up to 760 px, the head pills from 761 px (recommended) | E. One scrolling pill strip | F. A bottom bar or a rail |
|---|---|---|---|---|---|---|
| First screen 360x640 | as D | tables about 325 (two rows of seven group chips and a tab row), homebrew about 290 (four pills with counts take two rows): fails 256 | unchanged (this is today's behavior) | roll std 319.2, alt 250.4, the supplements 246.4; tables 212.4; homebrew 224.4 (prototype, below) | fits | fits |
| First screen 768x1024 / 1000x720 / 1180x720 | shorter heads: tables about 194 at 1180 and about 197 at 1000; roll about 222 at 768; homebrew about 222 at 1000 | unchanged | unchanged | unchanged | - | - |
| Head Order Rule (pills hold still) | broken: the picker's width follows the current name, so the pin and the help move on a switch, unless the picker reserves the longest name («Альтернативные таблицы», "Escape the Veiled Halls") as an empty gap | kept | kept | kept from 761 px; up to 760 px the picker takes the free width (`flex: 1`), so «Ещё» holds still at the right end | broken: the visible pills change with the width and the language | - |
| Phone-First Rule (thumb) | 40 px picker, 44 px sheet rows | 40 px pills | as today | 40 px picker, 44 px sheet rows, 40 px «Ещё» | 40 px | 40 px |
| Keyboard and screen reader | one button «Таблица: ...» / «Режим броска: ...» with `aria-haspopup="dialog"`; a modal sheet of links with `aria-current` | links with `aria-current`; a `Menu` for the overflow | two models | one model per band: the picker and its sheet up to 760 px, links from 761 px; the one overflow pill per page opens the same sheet | a scrolled-out pill is focusable but not seen | a second navigation model |
| Taps (phone) | 2; tables 3 to another group | 1 to a pill, 2 to the overflow | roll 1 or 2, tables 2 or 3, homebrew 2 | roll 2 (today std and alt take 1), tables 2 or 3, homebrew 2 | 1 | 1 |
| Taps (desktop) | 2; tables 3 to another group (today 1 or 2) | 1 or 2 | as today | as today: roll 1, a supplement 2; tables 1, a supplement 2; homebrew 1 | - | - |
| RU/EN parity | widths differ by language: the reserved gap is set by the longer language | the RU chips wrap sooner | as today | one new string pair | hidden pills differ by language | - |
| Scale | 22 tables in one sheet | ten supplements in a menu | - | 12 modes in one sheet; the sheet body scrolls at 640 px tall (below) | - | - |
| Consistency with the owner's ask | one shape, but it removes the desktop pills the owner approved on 2026-11-05 (The Head Order Rule) | not the shape the owner picked ("I like the tables option more") | not consistent: the owner asked to unify | one shape per band on all three pages, and the shape the owner picked | rejected 2026-10-29 | rejected 2026-10-29 |

Variants of D that the prototype ruled out:

- The picker row holds the picker, «Настроить» and «Ещё», as the tables' row holds a tool: «Настроить» lit is up to 139 px («Настроить · 2»), so at 360 px the picker has about 92 px for its name and «Альтернативные» needs 106 px; the word breaks inside. Rejected.
- The picker row at the tables' place, 26 px under the header: the roll controls go down by 14.5 px, and std reaches about 337 px (exception 325) and the supplements about 260 px (rule 256). Rejected; the tables and «Мои предметы» move up to the roll's place instead.

The prototype (a script that changes the shipped DOM in the browser and measures; screenshots in the planner's scratchpad only): the mode row hidden, `main` 8 px top padding, a 40 px picker row (the picker and «Ещё»), then 4 px (6 px from 601 px) to the page's first row; the results line keeps «Бросок N» and «Настроить».

| Route | 360x640 now -> D | 320x568 now -> D | 760x720 now -> D |
|---|---|---|---|
| `/roll/std` | 322.7 -> 319.2 | 363.9 -> 360.4 | 307 -> 297.2 |
| `/roll/alt` | 253.9 -> 250.4 | RU 341.1 -> 291.6 (the results line is one line again), EN 295.1 -> 291.6 | 245 -> 235.2 |
| `/roll/dv`, `voa`, `community` | 249.9 -> 246.4 | 291.1-307.4 -> 287.6-298.5 | 241 -> 231.2 |
| `/tables/core_item`, `/tables/wondrous` | 230.4 -> 212.4 | 271.6 -> 253.6 | 225.2 -> 207.2 |
| `/homebrew` | 242.4 -> 224.4 | EN 283.6 -> 265.6 | 237.2 -> 219.2 |

Russian and English give the same figures at 360 and 760. No page scrolls sideways.

## 3. Recommendation

Take D: the tables' shape on all three pages, the picker row up to 760 px and the head pills from 761 px. Reason: it is the shape the owner picked, it improves the first screen on every page at every phone width, and it keeps The Head Order Rule from 761 px. Trade-off accepted: on a phone, a switch between Core rules and the alternate tables takes two taps, not one.

Current behavior, then proposed, by device:

- Phone and small tablet (up to 760 px), roll pages. Now: three pills under the header; «Ещё» sits in the results line. Proposed: one picker row 8 px under the header, as on the tables: the picker that names the mode («Обычные правила ▾»), then «Ещё» at the right end. The picker opens a bottom sheet titled «Бросок» with «Обычные правила», «Альтернативные таблицы», the caption «Дополнения» and the ten supplements, the open one marked. The results line keeps «Бросок N» and «Настроить».
- Phone and small tablet, tables and «Мои предметы». Now: the picker row 26 px under the header; the homebrew picker draws a larger face than the tables' picker. Proposed: the same row 8 px under the header (18 px higher), and one picker face, the tables' (14 px, up to two lines), on all three pages.
- Desktop and large tablet (from 761 px). Now: the roll pills, the tables' chips and tabs, the homebrew pills; the roll's «Дополнения ▾» opens a drop-down menu. Proposed: the same pills; the roll's «Дополнения ▾» opens the roll's sheet, as the tables' supplements tab (new-items V1) opens the tables' sheet. One overflow control, one popup shape, on every page.

Departures from the direction (memory "mocks are direction"):

- The orchestrator's AFK default N6 recommended pills everywhere (option A of that note, B here). Departure: the owner's later answer N7 picked the tables' shape, and B fails the First-Screen Rule on the tables and «Мои предметы» at 360 px.
- N7 reads "the tables option" for both pages. The tables' option is a picker on the phone and pills on the desktop, so D applies it at both bands; it does not replace the desktop pills with a picker (A).
- The tables' picker row holds a tool (the view switch); the roll's row holds none, because «Настроить» in the row breaks «Альтернативные» at 360 px (above).
- The tables and «Мои предметы» move their picker row 18 px up to the roll's place, because the roll pages cannot move down without failing the rule.

## 4. Batch VW1 - one picker row and one picker sheet on the roll pages, the tables and «Мои предметы»

No open design question. A routine implement batch: every file, place and string is named below.

### Objective

Up to 760 px the roll pages draw the picker row of the tables, the three picker rows share one place and one face, and from 761 px the roll's «Дополнения ▾» opens the roll's sheet in place of the `Menu`. Extract the shared picker button, picker row and sheet list on their third and second real use.

### In scope / out of scope

- In: `ModeRow`, `RollPage`, `Shell`, `TableNav` (the narrow picker only), `HomebrewTabs`, `TablesPage`, `HomebrewPage`, three new shared components, their tests, the specs, a decision, the goldens.
- Out: the tables' desktop supplements tab (new-items V1 owns it; keep its look and code), the list or grid switch, the search page, the roll controls and results, the vh rooms (task roll-per-line).

### Files

| File | Change |
|---|---|
| `app/src/components/PickerButton.svelte` (new) | The picker button, moved from `TableNav.svelte` (`.picker`, `.picker-t`, `.picker-book`): props `label` (the accessible name), `name`, optional `book`, optional `section` (written to `data-section`), `onclick`, bindable `el`. `aria-haspopup="dialog"`, 40 px tall, the chevron, two lines at most, `--t-small` at `--h-page-weight`. |
| `app/src/components/PickRow.svelte` (new) | The row, from `TablesPage.svelte`'s `.pickrow`: a `div class="pickrow"` with `children`; `display: flex`, `align-items: center`, `gap: 4px`, no wrap, `margin-bottom: 6px` (4 px up to 600 px); `:global(.btn.sm)` 40 px tall, `flex: none`; `:global(.morewrap)` `flex: none`; and `:global(#main:has(> .pickrow)) { padding-top: 8px; }` with a comment that cites DESIGN.md, "The Head Order Rule". |
| `app/src/components/SheetLinks.svelte` (new) | The sheet's link list, from `HomebrewTabs.svelte`'s `.sheetlinks`: props `links: readonly { href: string; label: string; count?: number; current: boolean }[]`, optional `caption`, `onpick`. One 44 px row per link, the current one gold with `aria-current="page"`; the caption is the menu's `.cap` look (`--t-label`, capitals, `--muted2`) and `aria-hidden`; the list is a `role="group"` named by the caption where one is given. |
| `app/src/components/ModeRow.svelte` | Up to 760 px (`app.band === 'narrow'`): `nav.modes` holds `PickerButton` (label `t.rollPick` with the mode's name, `section` the lit section) and its `Sheet` (title `t.jobRoll`, label as the button): `SheetLinks` with std and alt, then `SheetLinks` with `caption={t.grpSupplements}` and the ten `SUPPLEMENTS`. From 761 px: the pills as today; the «Дополнения ▾» button opens the same `Sheet` (`aria-haspopup="dialog"`; drop `aria-controls`); remove `Menu`, `.cap`, `.item`, `.mark`, `closeOnFocusOut` and the open state's `app.navigations` effect where the `Sheet` makes it dead. Keep `data-section`, `aria-current` on the pills and on the button, and the `pressed` focus logic: after a pick the new page focuses the picker up to 760 px and the lit pill or the button from 761 px. The current row scrolls into view when the sheet opens (`block: 'nearest'`). |
| `app/src/components/RollPage.svelte` | Up to 760 px: before `{#if empty}`, `<PickRow>` holds `<ModeRow {app} />` and the `MoreMenu` (copy, pin, help) moved from `.reshead`; `.reshead` holds `h2` and «Настроить». The help box's «Закрыть» returns the focus to `.pickrow .morewrap > .btn`. Remove `:global(#main:has(> .rp:not(.two)))`. From 761 px `PageHead` and `nav={modes}` are unchanged. |
| `app/src/components/Shell.svelte` | Remove the `{#if modeOf(app.section) && app.band === 'narrow'} <ModeRow {app} /> {/if}` block, its comment and the `ModeRow` import; keep `modeOf` only if another use remains. Update the comment at the focus code that names `ModeRow`. |
| `app/src/components/TableNav.svelte` | The narrow picker uses `PickerButton`; delete the moved CSS. V1's desktop tab keeps its own markup. |
| `app/src/components/HomebrewTabs.svelte` | The narrow picker uses `PickerButton` (the tables' face); the sheet uses `SheetLinks` with counts; delete the moved CSS and update the head comment ("The picker rules are `TableNav.svelte`'s"). |
| `app/src/components/TablesPage.svelte`, `HomebrewPage.svelte` | The narrow `.pickrow` div becomes `<PickRow>`; delete their `.pickrow` CSS (keep the tables' `.seg.small` padding rule as a `:global` under the row, or move it into `PickRow` only if the view switch is its one caller: keep it in `TablesPage`). |
| `app/src/lib/dict.ts` | `rollPick: 'Режим броска: %s'` / `'Roll mode: %s'`, beside `tablePick`. |
| Tests | `modeRow.test.ts` (rewrite), `tableNav.test.ts`, `homebrewTabs.test.ts`, `a11y.test.ts`, the page tests that query `.pickrow` or `.reshead`; `tests/app/states.js` cases 83, 86, 89, 97, 109, 112, 116 and the `nav.modes` reader near the case-112 helper; `tests/app/sweep.js` and `tests/app/typo.js` where they name `nav.modes`, `.mode`, `supmenu` or `supplements-menu` (run `git grep -n -E "nav\.modes|supmenu|supplements-menu|\.reshead|pickrow"` first); `tests/app/inventory.js`. |
| Specs | DESIGN.md, FEATURES.md, ROUTES.md, STATE.md, COVERAGE.md (below); a new file under `docs/decisions/`, then `node tools/decisions.js`. |

### Behavior and UI constraints

- Up to 760 px the picker row is the first row of `main` on the 12 roll pages, the 22 tables and the four homebrew tabs: 8 px under the header, 40 px tall (42 px on the tables, where the view switch sets it), 4 px (6 px from 601 px) above the page's first row. Order: the picker, the page's own tools, «Ещё» last. The picker takes the free width; nothing in the row moves on a switch.
- The roll picker's text is the mode's name (`SECTION_LABEL`), one or two lines, no book line. Its accessible name is «Режим броска: <name>» / "Roll mode: <name>".
- The roll sheet: title «Бросок» / "Roll", «Закрыть», then std and alt, the caption «Дополнения» / "Supplements", the ten supplements in `SUPPLEMENTS` order. A press closes the sheet and opens the mode; Escape and «Закрыть» close it and return the focus to the button that opened it (rule 20). From 761 px the sheet is centered (`Sheet`'s own rule).
- On a no-data roll page (`empty`) the picker row draws the picker and «Ещё»; «Настроить» does not draw (the results line is not drawn).
- From 761 px nothing moves: the head, the pills, their widths and the lit pill's reserved width stay.
- Do not change the tables' group chips, tabs, the V1 supplements tab, the view switch or the homebrew pills from 761 px.

### Standing checks

1. Scale. States:

| State | What the screen shows | Proof |
|---|---|---|
| One mode lit, 360x640, RU and EN, each of the 12 roll pages | the picker row at 118.4 px; primary std at most 322, the others at most 253 (prototype 319.2, 250.4, 246.4) | case 83 (rule and std exception), case 89 (new assertions) |
| The roll sheet open, 360x640 | 12 rows of 44 px and a caption: the body scrolls (the sheet is at most 544 px tall at 640, the content about 613 px); the open row is in view | case 109 (targets), new inventory state `#/roll/vault_of_ages ~ picker sheet` at 360 |
| The roll sheet open, 1100 (golden width) | the same list in the centered sheet | the supplements-menu inventory entry, renamed `~ supplements sheet` |
| The longest names at 360 and 320 | «Альтернативные таблицы» and "Escape the Veiled Halls" on at most two lines, no word cut (the row has 252 px for the name at 360 and 227 px at 320) | case 89 |
| The lit «Настроить · 2» at 320 RU | the results line is one line | case 89 |
| Tables and homebrew at 360 | the picker row at 118.4 px; primary 212.4 and 224.4 | case 83, case 91, case 96 |
| Homebrew at 320 RU | the picker row is one line (it wraps today) | case 91 |
| No data on a roll page | the picker row with the picker and «Ещё» | a `rollPage` or `app` unit test |
| 1180x720 | unchanged: the pills in the head, primary 214.2 | case 83, case 112 |
| empty / many / limit / 3x | not applicable: the mode list is code (12), not a limited collection; the tables' and homebrew sheets keep their content | unchanged |

No sticky region changes; no on-screen keyboard opens over the sheet (it holds no field).

2. Error scenarios: not applicable - no write path, no stored shape; the one failed read is the no-data roll page, which keeps the picker row. A stale tab keeps its old mode row until it reloads; a revert brings the mode row back; nothing is stored, so no data is kept or dropped.
3. Consistency: follows rule 4 (one name: the picker reads the page's name as the lit pill does), rule 11 («Закрыть» folds the sheet) and rule 20 (focus returns to the opener), and `docs/decisions/2026-10-30-list-pages-share-one-head-and-one-selection-bar.md` (the roll pages now take the list head's picker row). Sibling axes: the head row is one shape on the three pages; the sheet's close label and title rule (the page's name) match the tables' and «Мои предметы»'; the primary action keeps its place (the dice or «Бросить» on the roll, «Новый предмет» on the Items tab). Departure, named in FEATURES.md: the roll picker row holds no tool, because «Настроить» belongs to the results line.
4. RU/EN parity: one new pair, «Режим броска: %s» / "Roll mode: %s"; the title and the caption reuse `jobRoll` and `grpSupplements`. ASCII punctuation; no plurals.

### Steps

1. Merge `main` into `claude/57-debt` after new-items V1 lands; read `TableNav.svelte` as V1 left it.
2. Create `PickerButton.svelte`, `PickRow.svelte` and `SheetLinks.svelte` from the code named in "Files". Move CSS; do not restyle, except the homebrew picker's face, which takes the tables'.
3. Switch `TableNav`, `HomebrewTabs`, `TablesPage` and `HomebrewPage` to them. Run their unit tests.
4. Add `rollPick` in both languages in `dict.ts`.
5. Rewrite `ModeRow.svelte` and edit `RollPage.svelte` and `Shell.svelte` as in "Files".
6. Update the unit tests; end each component test with `expectNoA11yViolations`, the sheet open and closed.
7. Update `tests/app/states.js`, `sweep.js`, `typo.js` and `inventory.js` (the new picker-sheet state at 360 and the renamed supplements entry). Run `npm run build:test`, then `node tests/app/states.js --shard=n/4` in the background for the shards that hold cases 83, 89, 91, 96, 109, 112 and 116 (the suite has no case filter; CI runs every shard), and re-seed the changed goldens with `node tests/app/golden.js --update --only=<id>`.
8. Write the specs and the decision; run `node tools/decisions.js`.
9. `rtk npm run check:fast` (Bash timeout 600000), commit, push; CI is the full gate.

### Acceptance (each with its test)

- At 360x640 and 760x720, RU and EN, every roll page draws one picker row 8 px under the header with the picker first and «Ещё» last, and no `nav.modes` outside `main` (case 89).
- `/roll/std` primary at 360x640 is at most 322 px; `/roll/alt` and the ten supplements at most 253 px; `/tables/*` at most 215 px; `/homebrew` at most 227 px (case 83; DESIGN.md takes the measured figures).
- The roll results line holds `h2` and «Настроить» on one line at 760, 390, 360 and 320 px, «Настроить · 2» lit included (case 89).
- The roll picker opens a dialog titled «Бросок» / "Roll" with 12 links in order, the current one `aria-current="page"`; a link opens the mode and the new page focuses the picker; Escape returns the focus to the picker (`modeRow.test.ts`, case 116).
- From 761 px the three pills draw as before and «Дополнения ▾» opens the same dialog; `routes.json` still reads the lit mode from `nav.modes [aria-current="page"]` (`modeRow.test.ts`, `tests/app/contracts.js` unchanged and green).
- The three picker buttons have one face and one height at 360 (case 91 for homebrew, case 96 for tables, case 89 for roll); the homebrew picker row is one line at 320 RU (case 91).
- Every target in the row and the sheet is at least 40 px (rows 44 px) at 360 (case 109, sweep at 360 and 390).
- From 761 px the head of each page is unchanged (case 112, case 96, the goldens at 1100 except the supplements entry).
- A no-data roll page draws the picker and «Ещё» (unit test).
- axe is clean on the picker closed and open on the three pages (`modeRow.test.ts`, `tableNav.test.ts`, `homebrewTabs.test.ts`, `tests/app/states.js` axe on the new state).
- Inherited from `plan.md` step 4: "The tab and picker CSS copied into `HomebrewTabs` from `TableNav`" is paid: no picker CSS is left in either file (code read in review).
- The specs, the decision and COVERAGE.md rows below are in the same commit.

Goldens expected to change: the `#/roll/*` entries at width 360 (if any), the supplements entry (now a sheet), the new picker-sheet state; the tables' and homebrew entries at 360 only if their tree changes (the class names are not in the tree, so expect no change). Any other diff is a defect: read it before a re-seed.

### Specs to change

- DESIGN.md, "Layout": "the mode row on the nine roll pages up to 760px (53px, scrolling with the page)" becomes the picker row of the roll pages, the tables and «Мои предметы», 8 px under the header.
- DESIGN.md, "The Head Order Rule": up to 760 px "the mode row or the picker row names the page" becomes "the picker row names the page: the picker, the page's tools, «Ещё» last"; add that from 761 px a pill row's overflow (the roll's «Дополнения», the tables' supplements tab) opens the page's picker sheet.
- DESIGN.md, "The Roll Page Rule": up to 760 px the picker row (picker, «Ещё»), the controls, the results line («Бросок N», «Настроить»).
- DESIGN.md, "The Two Breakpoints Rule": the catalog's "the picker row, the sheet and «··· Ещё»" applies to the roll pages and «Мои предметы» too.
- DESIGN.md, "Chips" ("Sibling pills": delete "Up to 600px the roll's three share the mode row, 40px tall, and a long name takes two lines") and "Navigation" (replace the "Mode row" bullet with a "Picker row" bullet; the "List head" bullet names the shared face). "The First-Screen Rule": record the new `/roll/std` figure beside its 325 px exception.
- FEATURES.md, "Rolling": the first bullet (narrow layout), the bullet on the roll sections' mode row and the supplements menu (now the sheet; ten supplements), "A mode switch keeps the keyboard focus on the lit control" (the picker up to 760 px). "Tables and search" and "Homebrew": the picker row's place. "Consistency rules", rule 4: the picker reads the page's name too; the roll-row departure.
- ROUTES.md (the mode-row sentence near line 87), STATE.md (the supplements menu's open state becomes the roll sheet's).
- COVERAGE.md: rewrite the `components/modeRow.test.ts` row; add rows for `PickerButton`, `PickRow` and `SheetLinks` (reached by the page and tab tests); update the `app/states` rows of cases 89 and 109.
- `docs/decisions/2026-11-xx-the-roll-modes-are-a-picker-row-up-to-760-px.md` (template `.claude/templates/decision.template.md`): context (owner, 2026-11-07, N6 and N7), decision (D), alternatives (A, B, C, E, F, the two D variants above), consequences (two taps between std and alt on a phone), status; it amends `2026-10-29-the-header-has-three-jobs-and-a-mode-row.md`.

### Risks and do-nots

- `Sheet` focuses «Закрыть» on open; keep that. Scroll the current row into view, do not focus it.
- Do not put `aria-current` on the narrow picker (the tables' picker has none); keep it on the desktop pills and the desktop button.
- Do not change `main`'s 26 px padding for other pages; the 8 px rule binds only `#main:has(> .pickrow)`. Check that the tables' and homebrew pages render `.pickrow` as a direct child of `#main`; if a wrapper sits between, put the rule on that wrapper.
- `ModeRow` remounts on each mode (one `RollPage` instance per mode, plan.md step 4); the `pressed` focus logic must cover the narrow picker.

### Fallback

If the 8 px row fails a measured rule on a page not listed here, keep that page's row at its old place and name it in DESIGN.md; do not move the roll row down.

### Gate cost

One batch: one `check:fast` (about 680-840 s, because `dict.ts` changes), one push and one CI run (about 15 min), the golden re-seeds of the changed entries (about 100-290 s per shard touched), and the focused `states.js` cases locally in the background. About 120-160 min with the implementer's time. No split: the three pages share the three new components and one seed (the band rule), so the test of "Batch size" merges them; the desktop popup change is in the same component (`ModeRow`) and the same sheet.

## 5. Order and owner decisions

- After new-items V1 lands on `main` (it adds the ten supplements and the tables' supplements tab that VW1 matches). Merge `main` first.
- Independent of roll-per-line: that task changes `data.js`, `App.svelte`'s roll pools and the Arazo and ph goldens, not `RollPage`'s head or `ModeRow`. Either order works; the second task to land re-seeds the `_roll_arazo*` and `ph` goldens it shares with the first.
- In 57-debt: after step 1 (tooling) and before step 2 (phone overlays), because step 2 measures the roll page's «Ещё» and toasts, and VW1 moves that «Ещё» to the picker row.
- Owner decisions still open: none required. The owner may want to see the 360 px look before the build; the prototype screenshots are a basis for a mock if the orchestrator asks.
