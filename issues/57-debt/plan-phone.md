# Plan - phone overlays, focus and the visual leftovers (task 57-debt, steps 2 and 3)

This file plans steps 2 and 3 of `plan.md` as three batches, PH1 to PH3, from one triage pass over `docs/specs/DEBT.md` D122 to D141 and the step 2 and step 3 lists. It holds the measured state, each decision, the batches with their gates, and the items that stay with the owner. The owner was AFK (2026-11-10): every default is the recommended option and is logged in `C:\Users\Ignat\.dhloot\notes\57\afk-decisions-57-debt-2026-11-10.md`, items 8 to 28.

## Status

- Planned 2026-11-10 (planner, triage pass, "Order of work" item 6). Not started. Start gate: none (D, E, D7, step 1 and VW1 are on `main` and merged into `claude/57-debt`).
- Plan review: not required (no trigger fired). No migration, no SECURITY DEFINER function, no public contract file (`CONTRACTS.md`, `docs/fixtures/`, `tests/contracts.js`, `llms.txt`), no stored row or `localStorage` key, no new write or sync protocol. D130 changes a subtitle word that `CONTRACTS.md` calls "plain text, never parsed", and the `i/*.html` stubs are generated, not tracked.
- Batch reviews (the orchestrator's): PH1, PH2 and PH3 each change UI ("visual parity / new or changed UI"); PH1 with the mobile probes of step 2.
- Writer tier: `sonnet` for all three (pro profile; no batch meets writer test 2; no `Open design question:` line).
- NEEDS_HUMAN_CONFIRMATION: no. D131 and D134 stay with the owner and block nothing.

## 1. Measured state (2026-11-10)

Measured on `dist-test/` of `claude/57-debt` (the VW1 tree, `211aae24`; no `app/` change since), Chrome for Testing, fonts loaded. Probe scripts and shots: `issues/57-debt/mocks/phone/` (copied from the planner's scratch).

| Item | Window | Now | Prototype or cause |
|---|---|---|---|
| D132 «Ещё», ci1 dialog | 1000x720, 1180x720, 1920x950 | menu 264 px (243 signed in) opens down, ends at the card bottom; the card's `scrollTop` goes 0 to 42 / 30 / 30 (22 / 10 / 10 signed in); the picture top moves 180 to 138 at 1000 | cause: `MoreMenu` calls `box.scrollIntoView({ block: 'nearest' })` and the first item takes focus without `preventScroll`; the card grows its `scrollHeight` 408 to 450 to hold the menu |
| D132 «В список», 12 lists | 1000x720, 1180x720, 1180x600, 1920x950 | popover 340 px with the search box opens up and the card crops 215 px of its top at every size; the search field at -21, -27, -87 and 88 px (inside the window at 1920 but under the card's clip) | cause: `.dropmenu` is absolute inside `.modal-card` (`overflow: auto`); `up` is chosen by the card, not the window |
| D132 «В список», 0-3 lists | same | 85 px (signed out) or 214 px opens down, no crop, `scrollTop` 0 | - |
| D123 list «Ещё» | 360x640 | page scroll 0 to 87 on open (task 57 figure) | cause: the same `scrollIntoView` in `MoreMenu` |
| D122 header focus | 320, 360, 1180 | scroll 1500 to 1199 (task 57 figure) | cause: `:root { scroll-padding-top: var(--sticky-h) }` (`tokens.css`): a control inside the sticky header sits in the padding band, so the browser scrolls to show it below the band |
| D141 filter column | 1920x950, 1180x720, 1000x720 | top 243.8 / 243.8 / 287.6, cap 857 / 627 / 627, content 1376; the last section ends at 1607 / 1607 / 1651 | cap = window - real top - 16: the last section ends at 919 / 689 / 689 after the column's own scroll |
| D141 editor preview, 3000-character item (`hb_longtextaaaaaaaa` as gm4) | 1180x720, 1920x950, 1000x720 | top 156, cap 574 / 804 / 574 (`100vh - 146px`), content 1784 / 1784 / 2066; the bottom at 730 / 960 / 730: 10 px under the fold at page top; stuck top 130 after a scroll | the same cap rule as the column: bottom at window - 16 |
| D141 editor preview, empty draft (gm1) | 1180x720 | 562 px, bottom 718, no inner scroll | - |
| D126 dialog dock, ci1 | 600x500, 760x560, 700x481 | the picture 553x415 / 713x535 / 653x490; the dock bottom at 663 / 788 / 736, out of view | picture capped at `45dvh`, width by 4:3, centered: 300x225 / 336x252 / 289x216; the dock bottom at 500 / 560 / 481 (in view) |
| D126 control | 360x640, 390x844 | picture 313x235, 343x257; dock in view | unchanged by the cap |
| D126 control | 740x360 | dock joins the scroll (D136's band) | picture 216x162; the name rises from 654 to 296 |
| D133 `/s/` bar, one ticked | 360x640 RU and EN, 320x568 EN | 214.4 px, four rows («Все» and «Снять выделение»; «В список» alone; «Печать», «Скопировать текст»; «Сообщить владельцу» alone) | «Скопировать текст» and «Сообщить владельцу» in one «Ещё», «В список» not full width: 118.4 px, one action row («В список» 113-118, «Печать» 89-92, «Ещё» 89-92 px) |
| D133 | 320x568 RU | 232.6 px | 136.6 px (the count line wraps) |
| D129 `/s/` first entry | 360x640 RU and EN | 308.2 px: header to 110, `h1` 136-173, sub 177-201 (+10), «Сохранить себе» 211-254 (+10), the find row 264-304 (+4) | 256 needs 52 px; the vertical gaps above the first entry add up to 50 px (26 + 4 + 10 + 10), so only a move of «Сохранить себе» reaches it |
| D125 tabs | 320x568 RU | right edge 313.2, body 305 | three tabs: 13 px to 11 px of side padding under 341 px gives back 12 px |
| D127 stat columns | 1440 and 1920, eq_weapon and eq_armor, 60 rows, RU and EN | see section 3 | see section 3 |

## 2. Triage: where each item goes

| Item | Batch | Decision (AFK default where marked) |
|---|---|---|
| D122 header focus scrolls the page | PH1 | header controls get a negative `scroll-margin-top` equal to `--sticky-h`: a CSS fix that also covers Tab (default 10) |
| D123 closed «Ещё» leaves the page scrolled | PH1 | the overlay rule below: opening a menu never scrolls the page (default 9) |
| D124 toast covers an open «Ещё» | PH1 | the toast lifts above an open overlay that reaches its band (default 9) |
| D126 dialog dock out of view at 500-760 x 481-560 | PH1 | the dialog's picture is capped at `45dvh` up to 760 px (default 11) |
| D132 dialog «Ещё» and «В список» | PH1 | one overlay rule for `Menu` and the add-to-list popover: top layer, placed by the window, no scroll, focus with `preventScroll` (default 9; the owner's default of 2026-11-07) |
| D136 dialog toast covers the dock under 481 px | PH1 | the dialog toast lifts above the dock while the dock is in view (default 12) |
| D141 filter column and editor preview | PH1 | fix A (no `overscroll-behavior: contain` on the column) and fix B (the cap follows the real top), one watcher for both columns (default 13) |
| D125 RU tabs at 320 px | PH1 | 11 px side padding under 341 px (default 14) |
| D140 crop dialog at 740x360 | PH1 | two columns under 481 px of height from 600 px of width (default 15) |
| Step 2: the toast's `role` and `aria-live` | PH1 | the live region is present before the text: `role` and `aria-live` always set (default 16) |
| Step 2: the D141 sweep | PH1 | a probe in the batch's scratch, then a states case for what it finds |
| D137 remote removal of the focused ticked row | PH2 | focus to the row now at the same index, else the last row, else the bar's clear control (default 17) |
| D138 in-app navigation keeps the old offset | PH2 | a `go()` navigation opens the new page at y 0; Back, Forward and reload keep the browser's restore (default 17) |
| D139 Back puts the focus on `#main` | PH2 | after Back the focus goes to the row of the record that was left, with `preventScroll` (default 17) |
| Step 2: Escape (The Escape Rule) | PH2 | built: Escape closes the open layer, then clears the ticks, then leaves the selection mode; folds an open «Настроить» (default 17) |
| Step 2: inputs under 16 px at 360 px | PH2 | 16 px up to 600 px on the five fields (default 18; `RollSelect.svelte` already states the iOS rule) |
| Task 57 note 15 (9b-N13) | PH2 | the row controls' inset follows the tick column in the selection mode (default 18) |
| D127 stat columns | PH3 | built from the measured prototype (section 3) as the mock; the armor regression is decided there (default 19) |
| D133 `/s/` bar | PH3 | fold «Скопировать текст» and «Сообщить владельцу» into «Ещё» up to 760 px (default 20) |
| D130 and the `/s/` «1» | PH3 | «№ N» / "No. N" on the record page, the Worker card and `/s/` rows (default 21) |
| D135 signed-out list lead | PH3 | drop «Войдите в него.» / "Sign in to that account." (default 22) |
| D128 roll part select cuts a long name | PH3 | the chosen part shows on up to two lines, as VW1's picker does (default 23) |
| D129 target exceptions and `/s/` 308 px | PH3 | an accepted design: a decision file replaces the DEBT row (default 24) |
| D131 compact color print shortfall | none | stays in DEBT; it rides on the owner's Russian copy table (step D6): a shorter RU text of `voa4_t4i` and `voa4_a3` that the owner signs (default 25) |
| D134 four sign-in prompt shapes | none | stays in DEBT, owner first: one shape changes four page layouts, and the owner accepted A6 "keep" on 2026-11-10 (default 26) |
| Step 3: monospace labels (`.ordiv i`, `.altcol`, `HelpButton`, `.steps-l`) | none | done before this pass: all four use `--ui` (grep 2026-11-10); `--mono` is left only on values and code |
| Step 3: capitals outside the rule, `404.html` | none | done: DESIGN.md "Notes" (checked 2026-11-06) names both as inside the rule or a kept exception |
| Step 3: EN `<title>`, manifest, wordmark, Worker cards | none | no defect measured: a look for the owner (default 27) |
| Step 4: `typo.js` Whole Message step at 360 | PH3 | it is D128's proof; the note and price switches stay on the step 4 list |
| Step 4: `HomebrewTabs` CSS, `EQ_DT`, `RollPage` per mode, `review.prompt.md` naming, P5 | none | step 4 issue list; a prompt change is writer test 2 and is not folded into a UI batch |
| Bundle budget | PH1, PH2, PH3 | a batch past 273 kB raises `tools/bundle-budget.mjs` and `.claude/README.md` to its rounded-up total in the same commit, under 300 (default 28) |

## 3. The step 3 mock: a measured prototype (D127)

The owner is AFK, so the mock is the DOM prototype of `mocks/phone/probe.cjs` on the shipped rows. Shots: `mocks/phone/d127-eq_weapon-ru-1440.png`, `d127-eq_weapon-en-1440.png`, `d127-eq_armor-ru-1440.png`, `d127-eq_armor-en-1440.png`. The prototype takes the stat parts out of the sentence into one cell per part, right-aligned, each column as wide as its widest value, with a 16 px gap.

| Table, language | Columns | Stats width | Text column | Rows (sum of 60) | Cut descriptions |
|---|---|---|---|---|---|
| eq_weapon RU 1440 / 1920 | 5 in every row, one edge set | 504 px | 1033 to 515 / 1080 to 562 | 4791 to 4705 / 4791 to 4696 | 0 to 0 |
| eq_weapon EN 1440 / 1920 | 5, one edge set | 430 px | 1033 to 589 / 1080 to 636 | 4791 to 4595 / 4771 to 4589 | 0 to 0 |
| eq_armor RU 1440 / 1920 | 2, one edge set | 164 px | 1033 to 856 / 1080 to 903 | 5366 to 4786 | **2 to 4** |
| eq_armor EN 1440 / 1920 | 2, one edge set | 184 px | 1033 to 837 / 1080 to 884 | 5366 to 4728 | 1 to 2 / 1 to 1 |

The armor regression, named: the stat sentence held one line of the row, and the description keeps its 3-line clamp in a narrower column, so two more RU descriptions are cut at 1440 and 1920. **Decision** (default 19): on a row that draws stat columns, the description's clamp is 4 lines from 1440 px. The description takes the line the sentence freed: no row is taller than before by more than the line-height step (1.55 against 1.4), and the cut count is not above the "before" figure. Rejected: columns on weapons only (two stat forms on sibling tables); accepting the two cuts (fails the rule's own check, case 106's clamp share).

Departures from DESIGN.md, each named in DESIGN.md in PH3:

1. The Stat Columns Rule draft says "labeled in both languages": there is no header row. Each cell is the part's own text, as the sentence wrote it («Пороги 7/15», «Броня 4», «Сила», «Ближняя»), in the page's language. A header row would be a new element over cards that are not a grid.
2. The Row Text Rule's 3-line clamp from 1000 px becomes 4 lines on stat-column rows from 1440 px (the decision above).
3. The DOM order stays: name, stats, description. The cells are placed to the right by the grid, so a screen reader reads the stats before the description, as it does now, while the eye reads them last. DESIGN.md "Notes" already names one such order exception (the header from 761 px).
4. The cells are top-aligned with the name line, not centered in the row.
5. The draft's "trait, range, damage and burden" omits the weapon class (Physical or Magic, `EQ_CLS`): the class is the first column, because the sentence names it first and a column of its own keeps the edges equal.

## 4. Batches and their gates

Each batch is one commit on `claude/57-debt` and one push. Fixed cost per batch, from `.claude/README.md` "Batch size and the fixed cost of a run" (2026-11-05 and 2026-11-10 figures): `check:fast` 564-840 s for component changes (about 12-14 min), `npm run build:test` about 2 min, the batch's own states shards in the background one at a time (319-807 s each), golden re-seeds by `--update --only=<id>` or CI's text by the CI credit, and one CI run (about 15 min). One fix cycle is about 30 min more.

| Batch | Content | Gates | Estimate |
|---|---|---|---|
| PH1 | Overlays, the record dialog, the sticky columns, the short windows | `check:fast`; `build:test`; the D141 sweep probe; states shards holding cases 3, 23, 90, 108, 118 and the new cases 119-123; golden re-seeds of states with a menu or popover open; CI | 60-95 min |
| PH2 | Focus, Escape, navigation scroll, list-page inputs and inset | `check:fast`; `build:test`; states shards holding cases 13, 116 and the new cases 124-127; golden re-seeds of the list page states the inputs change; CI | 55-90 min |
| PH3 | Stat columns, the shared page, the roll number, the roll part select | `check:fast`; `build:test`; states shards holding case 106 and the new cases 128-130; `node tests/app/typo.js`; golden re-seeds of `/i/*`, `/s/*`, the signed-out list page and `/tables/eq_*`; `node tests/run-all.js app/contracts` (the stub subtitle); CI | 70-105 min |

Total: 185-290 min, against 270-370 min in `plan.md` "Gate cost" for steps 2 and 3 as two steps plus the step 3 owner wait.

Split criteria:

- PH1 | PH2: a review that cannot be held in one pass (`plan.prompt.md`, "Batch size preference"). PH1 changes where every overlay draws at every width and needs the mobile probes at five windows; PH2 changes the focus and scroll rules of navigation and selection on another set of probes. Together they are about 30 source files and two independent rule families.
- PH2 | PH3: a different route and filter set (`CLAUDE.md`, "Task and session protocol"). PH3's gates are `/tables/eq_*` at 1440 and 1920 px (outside the sweep widths), the typo sweep, and the re-seed of every `/i/*` golden for «№»; PH2's gates are the selection and navigation cases on `/tables/core_item`, `/search`, `/lists`, `/lists/<uuid>`, `/homebrew` and `/roll/std`.
- Not split: D125 and D140 ride in PH1 (two CSS rules each; their proof is the same short-window probe set and states shards); D130, D135 and D128 ride in PH3 (strings and one select, on PH3's golden and typo gates).

Order: PH1, PH2, PH3. PH3 is last so that the owner can look at the D127 shots before it ships if the owner is back.

---

## PH1 - Overlays, the record dialog and the sticky columns (implement-ready)

### Objective

No overlay moves or crops the page or the dialog: `Menu` and the add-to-list popover open by the window's room in the top layer, take focus without a scroll, and the toast stays clear of them and of the dialog's dock. The sticky filter column and the editor preview fit the window at every scroll. Three short-window layouts are fixed: the dialog dock (D126), the RU tabs at 320 px (D125) and the crop dialog at 740x360 (D140). The toast is a live region before its text arrives.

### In scope / out of scope

- In: D122, D123, D124, D126, D132 (both overlays), D136, D141 (column and preview), D125, D140, the toast live region, the D141 sweep. Delete each paid DEBT row (D122-D126, D132, D136, D140, D141) in this commit.
- Out: PH2 and PH3 items; a bottom sheet for menus (Option B of step 2, rejected by task 57); `Sheet.svelte`'s own scroll (an overlay where containing the scroll is right); the item picker and the mode row's `scrollIntoView` (they scroll a list inside their own sheet, not the page).

### Files

| File | Change |
|---|---|
| `app/src/components/overlay.ts` (new) | `openOverlay(box, control)`: top layer, window placement, follow on scroll and resize, the toast clearance; returns a cleanup. Header comment cites FEATURES.md "Chrome", the overlay rule |
| `app/src/components/stickyTop.ts` (new) | `watchStickyTop(el)`: writes `--real-top` on `el` from its own top, once per frame on scroll and resize; returns a cleanup |
| `app/src/components/Menu.svelte` | use `openOverlay`; focus the first item with `preventScroll`; Escape returns the focus with `preventScroll` when the control is in the window; drop `place`, `flip`, `UP_SHARE`, `UP_MAX` and the `.menu.up` rule; popover UA resets |
| `app/src/components/MoreMenu.svelte` | drop `underMore`, the `scrollIntoView` effect, `MENU_GAP`, the `flip` and `up` props, the `position: static` rule up to 760 px; `close()` focuses with `preventScroll` |
| `app/src/components/AccountMenu.svelte` | Escape and close focus with `preventScroll` |
| `app/src/components/AddToList.svelte` | the placement effect uses `openOverlay` on `.dropmenu` (re-run on `shown.length`, `newListFor`, `showSearch`); drop `up`, the clip measure and `scrollIntoView`; the new-list field and the search box focus with `preventScroll` |
| `app/src/components/RecordCard.svelte`, `RecordModal.svelte`, `PickRow.svelte`, `ListPage.svelte`, `PrintPage.svelte`, `SelBar.svelte`, `HomebrewBulk.svelte`, every other caller that passes `flip` or `up` | drop the props and the `.dropmenu.up`, `.recmenu`, `.cardpick .dropmenu` placement rules (`git grep -n -E "flip|\\bup\\b|\\.dropmenu|\\.recmenu" -- app/src/components/*.svelte` first) |
| `app/src/components/RecordModal.svelte` | D126: the picture cap; D136: `watchStickyTop`-style clearance of the dock under 481 px (step 7) |
| `app/src/components/Toast.svelte` | `bottom` takes `max(<current>, var(--overlay-clear, 0px), var(--dock-clear, 0px))`; `role` and `aria-live` always set |
| `app/src/components/Shell.svelte` | D122: `.topbar :is(a, button, input, select, [tabindex]) { scroll-margin-top: calc(-1 * var(--sticky-h, 0px)) }` |
| `app/src/components/FilterPanel.svelte` | D141 A and B |
| `app/src/components/HomebrewEditor.svelte` | `.preview`: `top: var(--anchor-top)`, the cap of D141 B, `100dvh` |
| `app/src/components/TabBar.svelte` | D125 |
| `app/src/components/CropDialog.svelte` | D140 |
| `tools/bundle-budget.mjs`, `.claude/README.md` ("273 kB" lines) | only if the build passes 273 kB: the rounded-up total |
| Tests | `accountMenu.test.ts` (the `Menu` box: focus with `preventScroll`, Escape), `overlay.test.ts` (new, jsdom: the fallback path and the cleanup), `stickyTop.test.ts` (new), the component tests that assert a `scrollIntoView` call on a menu (`git grep -n "scrollIntoView" -- app/src/components/*.test.ts`: `homebrewPage.test.ts` near line 729, `tables.test.ts` near lines 1599-1713; invert to "not called" for a menu, keep the item picker and mode row ones), `toast` tests (role always set), `tests/app/states.js`, `tests/app/inventory.js` (a state per new case below), `docs/specs/COVERAGE.md` |
| Specs | FEATURES.md "Records" (the two places become the overlay rule), "Chrome" (the overlay rule, the toast clearance, the live region), "Homebrew" (the preview cap), "Tables and search" (the column cap); DESIGN.md "Menu", "Toast", "Sheet" (crop dialog), "The Hidden Header Rule" (the header focus); DEBT.md (delete the paid rows) |

### Behavior now and proposed, per device

| Item | Now | Proposed |
|---|---|---|
| A menu or popover in the record dialog (761 px and wider) | it opens inside the card; «Ещё» scrolls the card 10-42 px and cuts the picture; «В список» with 8+ lists opens up and the card crops its top by 215 px (the search box hidden) | it draws in the top layer at the control's edge, outside the card's clip; the card never scrolls; with no room on either side it takes the larger side and scrolls inside itself |
| A page menu (every width) | `scrollIntoView` moves the page to show it (D123: scroll 87 at 360) | the page never moves; the menu opens down, else up, else the larger side with an inner scroll; it follows its control while the page scrolls |
| A phone (up to 760 px), dock menus in the dialog | they open up inside the 16 px gutter (the `.recmenu` and `.dropmenu` rules) | the same place, from the window rule: up from the dock, clamped to 16 px from each window edge |
| The toast with an open overlay (every width) | at 360 px it covers 4829 px² (RU) of a roll result's «Ещё» | its bottom rises to 8 px above the overlay's top when the overlay reaches into the bottom 80 px of the window |
| A header control's focus (every width; the header hides up to 760 px) | `focus()` or Tab scrolls the page up 301 px (320), 342 px (360), 385 px (1180) | the page stays; the shown header holds the control |
| The dialog at 500-760 x 481-560 (a landscape tablet or a narrow desktop window) | the picture fills the card; the dock is out of view | the picture is at most `45dvh` tall, its width by 4:3, centered; the dock is in view at scroll 0. Phones in portrait are unchanged (313x235 at 360x640) |
| The dialog under 481 px of height (a landscape phone) | the toast covers the dock for 4-7 s | the toast's bottom rises above the dock's top while the dock is in view |
| The filter column from 1000 px | at page top the last section is 168 px under the fold; the wheel stops at the column's end | the column fits the window at every scroll; the wheel passes to the page at the column's ends |
| The editor preview from 800 px | 10 px under the fold at page top with a long item; a hardcoded 130/146 px and `100vh` | the same cap rule; `--anchor-top`, `100dvh` |
| The RU tabs at 320 px with classic scrollbars (a desktop window) | 8.2 px past the body | inside the body |
| The crop dialog at 740x360 (a landscape phone) | «Готово» at 451 px, a scroll in the dialog | the stage left, the zoom and the buttons right; «Готово» in the window |
| A screen reader and a toast | `role` and `aria-live` arrive with the text: the first message can be missed | the region exists before the text |

### Standing checks

1. **Scale.** States table:

| State | What the screen shows | Proof |
|---|---|---|
| empty: an account with no lists, «В список» | 85 px popover, down, no scroll | new case 120 (b) |
| one, many: 2, 8 (the search threshold `LIST_SEARCH_AT`), 12 lists | 214 px down at 1180x720; 340 px with the search box: up when the room below is short, top layer, the search field inside the window, card `scrollTop` 0 | case 120 (a) at 1000x720, 1180x720, 1920x950 |
| at the limit: 50 lists (`limit_defaults`), one past it, 150 (3x) | the popover's height is capped by the room of the chosen side (`max-height`) and its list scrolls inside; at the limit «Новый список» shows the refusal line as today; 150 lists read the same cap | case 120 (c) with the fake's raised limit if the fake has the switch, else `unchanged` (step 1 leftover: the fake has no switch, so the 3x row is read by the cap rule only) |
| the longest list name (120 code points, `LONG_LIST_NAME`) | the row wraps inside the popover's `max-width: min(320px, 90vw)` | `unchanged` (existing state `LONG_NAME_SPECS`) |
| 360x640 | dock menus open up from the dock inside 16 px gutters; the toast above an open menu | case 118 (gutters, kept), case 108 (f) (no overlap) |
| 360x640, keyboard open (the popover's search box focused) | the overlay re-places on `visualViewport` resize: it takes the room above the field within `visualViewport.height`; at 360x640 with a 260 px keyboard the room is about 380 px and the 340 px popover fits up or is capped | case 120 (d) emulates the keyboard by `page.setViewport` height 380 while the field is focused: the field stays inside the window |
| 1180x720 | the dialog menus outside the card's clip, `scrollTop` 0 | case 119 |
| the filter column, 1920x950, 1180x720, 1000x720 | the column's bottom at or above window - 16 at page scroll 0 and after any scroll; the last section reachable by the column's scroll | case 121 |
| the editor preview, 3000-character item, 1180x720, 1920x950 | the same | case 121 (b) |
| sticky regions taller than the window | the column and the preview are capped to the window; the dialog card keeps `max-height: 88vh` | case 121 |

Row order and the place of the primary action do not change. Heights at 360 px: «Ещё» 264 px, the 12-list popover 340 px, the account menu unchanged.

2. **Error scenarios.** No read or write path changes. Loading: an overlay opened while the account loads keeps today's «Загружаем...» line inside the popover. A failed write from the popover (create list): the error toast lifts above the still-open popover (`--overlay-clear`); data as today. Offline, a conflict, a deleted record, a stale tab: unchanged; a stale tab keeps the previous bundle's placement until reload. A revert: CSS and component code only, no stored data.
3. **Consistency.** Rules followed: 5 (toasts: wording unchanged), 6 (load states inside the popover unchanged), 16 (the toast's width rule), 20 (the focus returns to the control). Every overlay family now opens by one rule (FEATURES.md "Chrome"), where the record dialog had two places and the page had `scrollIntoView`: the departure from FEATURES.md "Records" is replaced by the new rule. The filter column and the editor preview share one cap rule. The phone dock menus keep their 16 px gutters (case 118). `Sheet` keeps `overscroll-behavior: contain` (an overlay).
4. **RU/EN parity.** No new or changed string. Every case runs RU and EN.

### Steps

1. Write `overlay.ts`:
   - `openOverlay(box: HTMLElement, control: HTMLElement): () => void`.
   - If `typeof box.showPopover !== 'function'` (jsdom), return a no-op cleanup: the box keeps its CSS `position: absolute` place (the same fallback `Toast` uses).
   - Set `box.popover = 'manual'` if it has no `popover` attribute, then `box.showPopover()`.
   - `place()`: read `control.getBoundingClientRect()` and the viewport `vv = window.visualViewport` (fall back to `innerWidth`/`innerHeight`, offset 0). The top inset is 8 px, plus the header's bottom when the page header is shown and the overlay is not inside `dialog[open]` (read `document.querySelector('header.topbar')`'s rect, ignore it when its bottom is 0 or less). The bottom inset is 8 px plus `--selbar-h` and `--pdock-h` when the control is not inside those bars. `below = vvBottom - bottomInset - (rect.bottom + 8)`, `above = rect.top - 8 - topInset`. Let `h = box.scrollHeight`. Down when `h <= below`; else up when `h <= above`; else the larger side. Set `box.style.maxHeight` to the chosen room, `top` (down: `rect.bottom + 8`; up: `rect.top - 8 - min(h, room)`), and `left` so that the box's right edge is the control's right edge, clamped to `[16, vw - 16 - box.offsetWidth]` (case 118's gutter). Set `box.dataset.side = 'down' | 'up'` for tests and the animation.
   - The toast clearance: when the box's bottom is below `vvBottom - 80`, write `--overlay-clear: <vvBottom - boxTop + 8>px` on `document.documentElement`; else remove it.
   - Run `place()` once now; again on `scroll` (window, capture, passive), `resize`, `visualViewport` `resize` and `scroll`, and a `ResizeObserver` on the box; batch to one call per frame with `requestAnimationFrame`.
   - Cleanup: remove the listeners and the observer, `hidePopover()` when `:popover-open`, remove `--overlay-clear` when this box wrote it.
2. `Menu.svelte`: in the mount effect call `openOverlay(menu, control)` and return its cleanup; then `items()[0]?.focus({ preventScroll: true })`. Escape: `control.focus({ preventScroll: inWindow(control) })` with a local `inWindow` (rect inside `0..innerHeight`). Style: `position: fixed; inset: auto; margin: 0; overflow-y: auto; overscroll-behavior: contain` (an overlay), keep the border, radius, background, padding, shadow, `min-width`, `max-width`, `z-index`; reset the popover UA `color` and `border` as `Toast` does. The animation keeps `translateY(10px)` for down and uses `translateY(-10px)` for `[data-side='up']`. Remove `place`, `flip`, the constants and `.menu.up`.
3. `MoreMenu.svelte`, `AccountMenu.svelte`, `AddToList.svelte`: as the Files table says. In `AddToList` the effect keeps its `void shown.length; void newListFor;` reads, waits `tick()`, then calls `openOverlay(menu, btn)` (the cleanup on the effect's return). Keep `.dropmenu`'s look; move its placement to the helper; keep `class:long`.
4. Remove the `flip` and `up` props from every caller and the placement CSS they fed (search first, as in the Files table). Keep `.cardpick` layout rules that are not placement.
5. `Toast.svelte`: `.toast.page { bottom: max(calc(26px + var(--selbar-h, 0px) + var(--ebar-h, 0px) + var(--pdock-h, 0px)), var(--overlay-clear, 0px)) }`, the same `max()` around each other `bottom` rule of the file (the dialog copy adds `var(--dock-clear, 0px)`). Set `role` and `aria-live` from `inDialog` and the mode only, never `undefined`: `role={toast?.mode === 'err' ? 'alert' : 'status'}` and `aria-live` to match. Update the file's header comment (the reason for the old `undefined` is gone: an idle popover is `display: none` and leaves the accessibility tree). Fix the component tests and every `.toast[role]` selector in `tests/app/states.js` that means "a shown toast" (case 32's `roles` count near line 1895, the dialog-toast wait near line 10563, and case 108's waits): read `.toast:popover-open` instead, because the idle element now carries a role too.
6. `Shell.svelte`: add the `scroll-margin-top` rule above, with a one-line comment citing `tokens.css` `scroll-padding-top`. Check the editor bar and the print dock: if either is `position: sticky` at the bottom and case 122 (b) shows a scroll on its focus, add `scroll-margin-bottom: calc(-1 * var(--ebar-h, 0px))` (or `--pdock-h`) to its controls; if neither scrolls, add nothing.
7. `RecordModal.svelte`:
   - D126: inside `@media (max-width: 760px)` add `.modal-card :global(.card.dossier .card-media) { max-height: 45dvh; width: auto; max-width: 100%; justify-self: center; }` (the probe's rule; the media keeps `aspect-ratio: 4 / 3`).
   - D136: under `(max-width: 760px) and (max-height: 480px)`, watch the dock: on the card's `scroll` and on `resize`, write `--dock-clear: <innerHeight - dockTop + 8>px` on the dialog while the dock's top is inside the window, else remove it. Put this in the existing `watchBarHeight` effect's neighbor as its own effect.
8. `stickyTop.ts` and D141: `watchStickyTop(el)` writes `--real-top: <max(0, el.getBoundingClientRect().top)>px` on `el` once per frame on window scroll and resize, and once at start. `FilterPanel.svelte`: call it on `column`; remove `overscroll-behavior: contain`; `max-height: calc(100dvh - max(var(--anchor-top), var(--real-top, var(--anchor-top))) - var(--selbar-h, 0px) - 16px)`. `HomebrewEditor.svelte` `.preview`: `top: var(--anchor-top)`, `max-height: calc(100dvh - max(var(--anchor-top), var(--real-top, var(--anchor-top))) - 16px)`, call `watchStickyTop` on the preview element from 800 px (the effect runs at every width; the CSS applies the cap only from 800 px).
9. `TabBar.svelte`: `@media (max-width: 340px) { a { padding-inline: 11px; } }` with a one-line reason (the RU bar at 320 px with a classic scrollbar, measured 2026-11-10).
10. `CropDialog.svelte`: `@media (max-height: 480px) and (min-width: 600px)`: `.box { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: 16px; align-items: start; }`, `.stage { grid-column: 1; grid-row: 1 / span 6; width: min(calc(100dvh - 32px - env(safe-area-inset-bottom)), 45vw); margin: 0; }`, every other child of `.box` `grid-column: 2`. Fix DESIGN.md "Sheet"'s crop sentence.
11. The D141 sweep: write a probe in the batch's scratch (start from `mocks/phone/probe2.cjs`): for the filter column, the editor preview, the dialog «Ещё» and «В список», every `MoreMenu` caller, `HelpBox`, `SharePanel`, `RequestsPanel`, the print dock and the editor bar, at 360x640, 768x1024, 1000x720, 1180x720 and 1920x950, at scroll 0 and after a scroll, read (a) the bottom against the window, (b) the last child reachable by its own scroll, (c) for an overlay, an ancestor clip and any ancestor scroll on open. Each failure found becomes a row of case 123 and a fix in this batch when it is the same rule; a different family becomes a DEBT.md row in this commit.
12. `tests/app/states.js`: add cases 119-123 (below) and their `inventory.js` states; update cases 3, 23 and the case near line 2431 ("lies outside .modal-card"): a menu or popover in the dialog now lies inside the window with a 16 px gutter, not inside the card; update case 90 (the add-to-list up rule near the page top) to the window rule; keep case 118's gutter probe. Run `npm run build:test`, the shards that hold the changed and new cases in the background one at a time, and `node tests/app/golden.js --update --only=<id>` for each state with an open menu or popover whose golden changes (or take CI's text, "CI credit").
13. Specs, COVERAGE.md and DEBT.md as the Files table says; `npm run build` and the bundle figure; if past 273 kB, raise the budget (default 28).
14. `rtk npm run check:fast` (Bash timeout 600000), `npm run lint:typed`, `npm run lint:untyped`; commit; push.

### New states cases

- 119 (the dialog menu stays put): `#/tables/core_item`, press «Первоклассный Спальный Мешок», at 1000x720, 1180x720 and 1920x950, signed out and as gm1, RU and EN: open «Ещё»; the card's `scrollTop` is 0 before and after, the menu is inside the window with 16 px gutters, the picture's top unchanged; Escape returns the focus to «Ещё» and the `scrollTop` stays 0.
- 120 (the popover in the dialog): the same record as gm4 with 0, 2 and 12 lists (`TWELVE_SPECS` shape): (a) the 12-list popover's search field is inside the window, the card's `scrollTop` is 0 at 1000x720, 1180x720, 1920x950; (b) 0 lists: down, 85 px; (d) at 360x640 with the field focused and the viewport cut to 380 px, the field stays inside the window.
- 121 (the sticky columns fit): `#/tables/eq_weapon` at 1920x950, 1180x720 and 1000x720: at page scroll 0 and at 400, the column's bottom is at or above `innerHeight - 16`, and after the column's own scroll to its end the last section's bottom is inside the window; a wheel at the column's end moves the page (`scrollY` grows). (b) `#/homebrew/hb_longtextaaaaaaaa as gm4` at 1180x720 and 1920x950: the preview the same. (c) at 360x640 the filter sheet is unchanged (it opens as a `Sheet`).
- 122 (the header focus keeps the place): a long page (`#/tables/core_item`) scrolled to 1500 at 320, 360 and 1180 px: focus the first header link and the account control; `scrollY` is unchanged. (b) the editor bar's and the print dock's first control at mid scroll: `scrollY` unchanged.
- 123 (short windows): (a) the dialog dock of ci1 at 600x500, 760x560 and 700x481: the dock's bottom at or inside the window at scroll 0; at 360x640 the picture is 313x235 (unchanged); (b) D136: at 740x360 and 360x460 press the first «Ещё» item of an open record: the toast's bottom is at or above the dock's top, or the dock is out of view; (c) D125: at 320x568 RU on `#/search` and `#/roll/std`, `nav.tabs`' right edge is at or inside `document.body`'s right edge; (d) D140: at 740x360 RU and EN the crop dialog's «Готово» is inside the window and the dialog does not scroll; (e) the sweep's findings.
- Case 108 (f): no overlap between the toast and an open menu at 360 px, RU and EN (the case the DEBT row names).

### Acceptance

- Each new case 119-123 and case 108 (f) fails on the VW1 build and passes after (the writer records the failing run of the new cases against `dist-test/` before the fix in the handoff).
- D122: case 122 reads the same `scrollY` at 320, 360 and 1180 px.
- D123: on `LIST_A ~ noted as gm4` at 360x640, RU and EN, «Ещё» opens with `scrollY` 0, and after Escape and after a tap outside «Ещё» is not under the header.
- D124: case 108 (f) passes.
- D126, D136, D125, D140: case 123 (a)-(d).
- D132: cases 119 and 120.
- D141: case 121 (a)-(c); the sweep's report is in the handoff, each finding fixed or filed.
- The toast is a live region before its text: a component test reads `role` and `aria-live` on the idle element; states case 32's count is updated with its reason.
- No new first-screen exception (case 83 unchanged); the target-size sweep clean at 360, 390, 768 and 1180 (CI's `app/sweep`).
- No `scrollIntoView` call is left on a `Menu` or the add-to-list popover (`git grep -n scrollIntoView -- app/src/components/MoreMenu.svelte app/src/components/AddToList.svelte app/src/components/Menu.svelte` is empty).
- The Step 1 review nits from AFK item 7 that touch this batch's files: none (they are tooling files); they stay with the next tooling commit.
- DEBT.md rows D122, D123, D124, D125, D126, D132, D136, D140 and D141 are deleted; FEATURES.md and DESIGN.md carry the overlay rule, the toast clearance, the column cap and the live region.
- Bundle: the figure is in the handoff; a raise, when needed, is in this commit.
- `check:fast`, both lints and CI green.

### Risks and do-nots

- The top layer stacks in show order: a menu opened inside the dialog after the dialog's toast draws above it, and a toast raised while a menu is open draws above the menu but lifted clear of it. Keep the toast's `popover="manual"` as it is.
- `popover` UA styles (`inset: 0`, `margin: auto`, Canvas colors, a border, `overflow: auto`) must be reset in `Menu` and `.dropmenu`, as `Toast` does.
- Do not make page menus `position: fixed` without the follow-on-scroll listener: the menu would stay while its control scrolls away.
- Do not change `Sheet.svelte`, `ItemPicker.svelte` or `ModeRow.svelte` scrolling.
- The Tab order is the DOM order and stays: the box keeps its DOM place after its control.
- Settled, do not reopen: no bottom sheet for menus (task 57); one fix for both overlays (owner default, 2026-11-07).

### Fallback

If a target browser in the suites lacks `showPopover` (none of the CI browsers does), `openOverlay` still places the box by the window with `position: fixed` and no top layer; only the clip escape is lost, and case 120 (a) would fail on that browser. Record it; do not branch the CSS per browser.

---

## PH2 - Focus, Escape, navigation scroll and the list-page fields

### Objective

The focus and the scroll land where the reader expects after a navigation, a Back, a remote removal and an Escape; the list page's fields stop the iOS zoom; the list rows' controls follow the tick column.

### Files

`app/src/state/app.svelte.ts` (an `arrival: 'go' | 'history'` field set in `go()` and in the router listener), `app/src/ports/types.ts` and `app/src/ports/scroll.ts` (`ScrollPort.top(): void`, `window.scrollTo({ top: 0, behavior: 'instant' })` then `settle()`; every fake of the port: `git grep -n -E "ScrollPort|scroll:\\s*\\{" -- app/src`), `app/src/components/Shell.svelte` (the arrival effect: `top()` after a `go`; the row-key map for Back), `app/src/components/RecordModal.svelte` (`data-record={it.id}` on the dialog, read by Shell), `ListPage.svelte`, `HomebrewPage.svelte`, `TableRows.svelte` (D137 focus keeper), `SelectionBar.svelte` (Escape), `RollPanel.svelte` or the component that owns «Настроить» (Escape folds it), `PickQty.svelte`, `AddToList.svelte` (field font sizes), `ListPage.svelte` (`.rnote`, `.lrow-ctl` inset), tests, `tests/app/states.js`, `inventory.js`, FEATURES.md ("Chrome" for navigation and Escape, "Consistency rules" rule 20, "Lists"), DESIGN.md (The Escape Rule moves out of "Proposed rules" to its home, FEATURES.md "Chrome"; "Number field" and the input sizes), COVERAGE.md, DEBT.md (delete D137, D138, D139).

### Behavior now and proposed, per device

| Item | Now | Proposed (every width unless stated) |
|---|---|---|
| D138: a link or a job opens another page | the old offset, cut to the new page's height (`/i/ci13` at y 190 from 1139) | y 0; Back, Forward and reload keep the browser's restore; a record dialog opening is not a navigation and keeps the page |
| D139: Back to a catalog | the focus on `#main` above the viewport; the first Tab scrolls to y 0 | the focus on the row of the record that was left (`[data-row="<id>"] .row-main`, `preventScroll`), the scroll restored; with no such row, `#main` as now |
| D137: another device removes the focused ticked row | the focus falls to `body`; «Выбрано 0 позиций» | the focus goes to the row now at the same index, else the last row, else the bar's clear control; the count follows |
| Escape in a selection (catalog, `/search`, `/lists/<uuid>`, `/homebrew`, `/s/`) | nothing | the first Escape closes an open menu, sheet or dialog only; with none open it clears the ticks («Выбрано: 0», focus kept); the next Escape leaves the selection mode where the page has one, the focus on «Выбрать»; a search box with text clears first |
| Escape with «Настроить» open (`/tables/core_item`, `/roll/std`) | nothing | it folds, the focus on «Настроить» |
| Fields at 360 px (a phone): the new-list name 13 px, the row position and price 13 px, the note 14 px, «Кол-во» 15 px | iOS zooms the page on focus | 16 px up to 600 px |
| 9b-N13: the list page in the selection mode, up to 759 px of the rows' container | the notes and controls keep a 146 px inset while the text moves right by the tick column | the inset is the text column's left edge in both modes |

### Standing checks

1. **Scale.** States table:

| State | Shows | Proof |
|---|---|---|
| empty: a list with no rows, Escape in the mode | the mode ends; focus on «Выбрать» | case 125 |
| one: one ticked row removed remotely | the bar's clear control takes the focus | case 124 (b) |
| many: 7 rows (`SEVEN_SPECS`), the third removed | the focus on the new third row | case 124 (a) |
| at the limit: 100 entries (`limit_defaults`), 300 (3x) | the same index rule; no scroll jump (`preventScroll`) | `unchanged` order; the 3x row is read by the rule only (the fake has no raised-limit switch: step 1 leftover) |
| the longest list name, the longest record name | no layout change | `unchanged` |
| 360 px and 1180 px | every case at both widths | cases 124-127 |
| 360 px with the keyboard open: the new-list field at 16 px | the field's row keeps one line in the popover; the row position and price fields keep their 40 px column (3 digits at 16 px mono, about 29 px) | case 127 at 360x640 and 360x380 |

2. **Error scenarios.** No write path. A failed read on the page Back returns to: the row is absent, the focus goes to `#main`. A remote removal during a write conflict: the store's rows decide the index after the merge. A stale tab: the old bundle keeps the old offset. A revert: no stored data; the row-key map lives in memory only (a reload loses it, and the browser's own restore still runs).
3. **Consistency.** Rule 20 gains the remote-removal line; the Escape Rule's draft check becomes its home text in FEATURES.md "Chrome"; the selection bar's clear control and Escape do the same thing on every selection page (sibling pages: catalog, `/search`, `/lists/<uuid>`, `/homebrew`, `/s/`); the focus after a navigation (case 116) stays the rule for a `go`, and Back gets its own line.
4. **RU/EN parity.** No new string. Cases run RU and EN.

### Steps (outline; each names its edit)

1. `arrival` in `AppState`: `'go'` in `go()` before `navigations++`, `'history'` in the router listener branch. Unit tests in `app.test.ts`.
2. `ScrollPort.top()` and its fakes; Shell's arrival effect calls `app.env.scroll.top()` before `settle()` when `app.arrival === 'go'`.
3. Shell keeps `rowOf = new Map<string, string>()`: in the navigation effect, before the new page draws (`$effect.pre` on `app.navigations` when `arrival === 'go'`), store `lastFocus?.closest('[data-row]')?.getAttribute('data-row') ?? document.querySelector('dialog[open][data-record]')?.getAttribute('data-record')` under the hash being left (keep the previous hash in a local). On a `'history'` arrival, after `tick()` and the existing settle, focus `[data-row="<id>"] .row-main` (or its first focusable) with `preventScroll` when it exists.
4. D137: in `TableRows.svelte` and `ListPage.svelte` (the list rows), note the focused row's index on `focusin`; in an effect on the shown rows, when `document.activeElement === document.body` and the noted key is gone, focus the tick (`.selbox input`) of the row at that index, else the last row's, else the bar's clear control (`.selbarwrap` clear button).
5. Escape: `SelectionBar.svelte` adds `<svelte:window onkeydown>`: on Escape with no `[role="menu"]`, `dialog[open]` or open `.dropmenu`, and the focus not in a text field holding text, call the page's clear; the pages that have a mode pass a second handler for the next Escape at 0 ticks. «Настроить»: the owning component folds on Escape when it is open and the focus is inside it or on its button.
6. Fields: `font-size: 16px` up to 600 px on the five fields named above, each with a one-line reason citing the `RollSelect.svelte` comment.
7. 9b-N13: `.lrows` sets `--lrow-text: 146px`; in the selection mode `calc(146px + <the tick column's width>)`; `.rnote` and `.lrow-ctl` use `padding-left: var(--lrow-text)`.
8. States cases 124-127, specs, COVERAGE.md, DEBT.md; `check:fast`, both lints; commit; push.

### New states cases

- 124 (the focus after a remote removal): `LIST_A` with `SEVEN_SPECS`, in the selection mode, tick and focus row 3, play `playRemove`; (a) the focus on the new row 3's tick; (b) a one-row list: the focus on the bar's clear control. At 360 and 1180 px.
- 125 (Escape): `/tables/core_item`, `/search`, `/lists`, `/lists/<uuid>` at 360 and 1180 px: two ticks, Escape, «Выбрано: 0» and the focus kept; with the filter sheet open the first Escape closes only the sheet; on `/lists/<uuid>` a second Escape leaves the mode with the focus on «Выбрать»; `/tables/core_item` and `/roll/std` with «Настроить» open: Escape folds it.
- 126 (the new page opens at the top): `/tables/core_item` at y 1139 (360x720) and 929 (1180x720): follow a record's page link: `scrollY` 0 on `/i/ci13`; a header job to `/search`: `scrollY` 0; Back: the old offset restored and the focus on row ci13 (D139).
- 127 (fields at 16 px): at 360x640 the computed `font-size` of the five fields is 16 px; at 1180 unchanged; the row position column keeps 40 px; in the selection mode at 360 and 768 px the `.lrow-ctl` content's left edge equals `.rt`'s left within 1 px (9b-N13).

### Acceptance

- Cases 124-127 fail on the PH1 build and pass after.
- D137, D138, D139 rows deleted from DEBT.md; FEATURES.md "Chrome" holds the new-page and Back lines and the Escape rule; rule 20 holds the remote-removal line; DESIGN.md "Proposed rules" loses The Escape Rule row.
- Case 116 still passes (the focus after a navigation).
- The 9b-N13 inset: case 127's edge reads.
- The five fields at 16 px up to 600 px; the typo and sweep suites clean on CI.
- Bundle figure in the handoff; a raise in this commit when needed.
- `check:fast`, both lints and CI green.

### Risks

- `scrollTo` before the new page draws would scroll the old page: call it after `tick()` in the arrival effect, before `settle()`.
- A `go()` that keeps the page (none known: a filter pick is `replace()`) would jump to the top: case 126 includes a filter chip press on `/tables/core_item` with `scrollY` kept.
- `ScrollPort` is an interface change: update every implementation in the same commit.

---

## PH3 - Stat columns, the shared page and the roll number

### Objective

From 1440 px a weapon or armor row draws its stats in aligned columns (D127, section 3). The shared page's selection bar fits a phone (D133). The roll number reads «№ N» / "No. N" everywhere (D130, the `/s/` rows). The signed-out list lead says no instruction (D135). A long chosen part of the roll select shows whole (D128). D129 becomes a recorded decision.

### Files

`app/src/lib/i18n.ts` (`eqCells(it, lang, labels): string[]`: fixed slots, weapon 5 (class, trait, range, damage, burden), armor 2 (thresholds, score), an empty string for a missing part; `i18n.test.ts`), `RowMain.svelte` (a `cols` prop: the stat parts as `.sc` spans with the `·` separators kept as visually hidden text), `TableRows.svelte` and `TablesPage.svelte` (`statCols` on `/tables/eq_weapon`, `eq_armor`, `eq_secondary` if it draws weapons; the grid), `SelBar.svelte` (a `MoreMenu` up to 760 px on `/s/` holding «Скопировать текст» and «Сообщить владельцу» with its sending and sent labels; «В список» not full width there), `SharedListPage.svelte` (`numLabeled` on its rows), `RecordPage.svelte` (`t.rowNo.replace('%n', ...)` in place of `t.rollNo + ' ' + n`; drop `rollNo` from `dict.ts` when nothing else reads it), `tools/share-card.mjs` (the same «№ %n» / "No. %n"), `dict.ts` (`listGoneSignedOutSub` in RU and EN), `RollSelect.svelte` (`.pv`: up to two lines, no ellipsis), `tests/app/typo.js` (the Whole Message step at 360 too), `tests/app/states.js`, `inventory.js`, goldens, `docs/decisions/` (new: D129 accepted), FEATURES.md ("Tables and search" stat columns, "Lists" lead, "Records" meta line, "Shared lists" bar), DESIGN.md (The Stat Columns Rule moves from "Proposed rules" to "Components" with the five departures of section 3; The Row Text Rule's 4-line exception; The Phone-First Rule's `/s/` fold; The Whole Message Rule no longer names the roll select cut), DEBT.md (delete D127, D128, D129, D130, D133, D135), COVERAGE.md.

### Behavior now and proposed, per device

| Item | Now | Proposed |
|---|---|---|
| `/tables/eq_weapon`, `eq_armor` from 1440 px (a wide desktop) | the stats as a sentence above the description; 64-74% of the text column empty | the stats in columns at the row's right, one edge set per table; the description in the free width left of them, up to 4 lines; below 1440 px, on `/search`, the list page and `/s/` the sentence stays |
| `/s/` selecting up to 760 px (a phone) | a 214 px bar of four rows | a 118 px bar: «В список», «Печать», «Ещё» (copy and notify) on one row; from 761 px unchanged |
| The roll number on `/i/<id>` and the link card | «номер 1» / "roll 1" | «№ 1» / "No. 1", as `/search` writes it |
| `/s/` rows | «1» | «№ 1» / "No. 1" |
| The signed-out list page lead | «...где их создали. Войдите в него.» | «Списки открываются только в аккаунте, где их создали.» / "A list opens only in the account where it was made." |
| The roll part select at 360 and 390 px RU | «Проклятые предметы» cut by 31 px with an ellipsis | the whole name on up to two lines |
| D129 | a DEBT row | a decision: the craft-line link targets and the `/s/` 308 px first entry are kept (measured: 52 px needed, 50 px of gaps) |

### Standing checks

1. **Scale.** Rows: empty table (a filter with no match: unchanged message), one row (one edge set trivially), many (all weapons of a table, 60+), the longest values (the widest cell per column: RU weapons 85/94/97/79/87 px, EN 56/75/70/80/87; armor RU 93/56, EN 115/53), a missing part (an empty cell keeps its column), the longest record name and description (4-line clamp). 360 and 1180 px: the sentence stays (unchanged; goldens). `/s/`: one ticked, all ticked, 0 ticked (actions disabled, as now); 100 entries (the bar does not depend on the count). The `/s/` bar is the sticky region at 360: 118 px; its «Ещё» menu opens up by PH1's rule.
2. **Error scenarios.** `/s/` notify inside «Ещё»: sending shows «Отправляем...» on the item, a failure keeps today's error toast and the item enabled for a retry, «Отправлено» after success disables it; the `sentLine` under the bar is unchanged. No stored shape. A stale tab keeps the old bar. A revert: no stored data. The Worker card: the old Worker keeps «номер» until CI deploys it.
3. **Consistency.** One term for the roll number on every page (rule 4, one name); the `/s/` bar folds its rare actions like the owner's list page (DESIGN.md The Phone-First Rule); the stat columns follow The Row Text Rule's intent (the text takes the free width) with the 4-line departure named.
4. **RU/EN parity.** Changed strings: `listGoneSignedOutSub` both languages; «№ %n» / "No. %n" reused; no plural change.

### Acceptance

- D127: a states case 128 at 1440 and 1920 px on `#/tables/eq_weapon` and `eq_armor`, RU and EN: the column right edges are equal within 1 px in every row (one edge set), the cut-description count is at or under the figures of section 3's "before" (weapons 0; armor RU 2, EN 1), no row taller than its "before" height plus 4 px; case 106's clamp share not higher.
- D133: case 129 at 360x640 and 320x568, RU and EN, `#/s/player-token-1 ~ selecting`: the bar is at most 137 px (the owner's page), every action reachable (copy and notify inside «Ещё»).
- D130: `/i/ci1`'s meta line reads «№ 1» / "No. 1"; `node tools/build.js` regenerates the stubs; `node tests/run-all.js app/contracts` passes (the stub subtitle equals the heading line); the `/s/` rows read «№ N».
- D135: the signed-out list page golden re-seeded, one line changed in each language.
- D128: case 130 at 360 and 390 px RU and EN: every option of the three picker pages draws with `scrollWidth` equal to `clientWidth`; case 89's first result stays within 256 px; `typo.js` runs the Whole Message step at 360.
- D129: the decision file exists (`node tools/decisions.js` rebuilds the index) and the DEBT row is gone; `TARGET_ALLOW` and `FIRST_SCREEN` keep their entries with a comment citing the decision.
- The DEBT rows of D127, D128, D129, D130, D133 and D135 deleted; DESIGN.md "Proposed rules" loses The Stat Columns Rule row.
- The goldens that change are listed in the handoff, each diff read.
- Bundle figure; raise when needed.
- `check:fast`, both lints and CI green.

### Steps (outline)

1. `eqCells` and its unit test.
2. The grid from 1440 px on `.rows.statcols` (`TableRows`): `.rows { display: grid; grid-template-columns: [sel] auto [art] 60px [text] minmax(0, 1fr) [s1] auto ... [sN] auto [end] auto; column-gap: 0; }` with N from the table (5 or 2), `.row { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; }`, `.row-main { display: grid; grid-column: art / end; grid-template-columns: subgrid; grid-template-rows: auto 1fr; column-gap: 12px; }`, `.rt` and `.rstats` `display: contents`, `.rh` and the description in `[text]` rows 1 and 2, each `.sc` in its `[s<i>]` column spanning both rows, `align-self: start`, right-aligned, tabular figures, a 16 px gap on its left; the separators `.vh`. The `.selbox` sits in `[sel]` when ticks show.
3. The 4-line clamp on `.statcols` rows from 1440 px.
4. The `/s/` fold in `SelBar.svelte` (`token !== null && app.band === 'narrow'`), with the owner page's `bulkmore` pattern (`ListPage.svelte`, `{#if narrow}`).
5. The «№» changes, `numLabeled` on `/s/`, `share-card.mjs`, D135, D128.
6. The decision file for D129 from `.claude/templates/decision.template.md`.
7. Cases 128-130, `typo.js`, goldens, specs, DEBT.md, COVERAGE.md; `check:fast`, both lints; commit; push.

### Risks

- The subgrid chain passes through three levels; a level that keeps `display: flex` breaks the alignment silently: case 128's edge read is the guard. Fallback: the prototype's method, per-column widths measured once per render into `--sc-<i>` on `.rows` by an effect in `TableRows` (the edge set was 1 in the prototype).
- The accessible name of an eq row keeps its text (the separators stay as hidden text): the structural goldens of `/tables/eq_*` should not change at 1180; if they do, read each diff.
- The owner may reject the stat columns on return: they are one CSS block and one prop, revertible in one commit without the other PH3 items.

---

## 5. Owner items, not in a batch

- D131 (two RU compact color cards under the 3.7cqw floor): rides on the D6 Russian copy table; the owner signs a shorter RU text for `voa4_t4i` and `voa4_a3`, and `tests/app/print.js` proves it. Recommendation: include both records in the D6 table; trade-off: two cards stay smaller until the owner signs.
- D134 (four sign-in prompt shapes): recommendation: one `SignInPrompt` shape (the `/lists` plate with the glyph, the lead and «Войти») on the four routes; trade-off: four first screens change. Owner's call (A6 kept them on 2026-11-06 and 2026-11-10).
- The D127 shots (`mocks/phone/d127-*-1440.png`): the owner looks before PH3 ships if back in time.
- The EN `<title>`, the manifest name, the `en/index.html` wordmark and the Worker card images: a look only.
