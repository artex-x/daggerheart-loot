# Wave 3 at wide windows - 1440, 1920, 2560 and 3840 px

This brief says what the wave 3 batches (9a, 8, 9b, P, 10) need for wide windows, and what they
take from batch W (`plan-wide.md`, in progress), which sets the wide rule for waves 1 and 2. It
changes no production code and no other task file. The orchestrator folds its lines into
`plan.md` section 7, `plan-9a.md` and the later refreshes. Owner input: `context.md`, "Phone
feedback", item 7 (2026-11-04, screenshots at 1762 and 1919 px), and the 4K extension (owner,
via the orchestrator, 2026-11-04: 3840 px, and 2560 px for 4K at 150%).

## Assumed W rule (until `plan-wide.md` lands)

- Up to about 1440 px: one centered column, `--wrap: min(1180px, 100% - 32px)`, as today.
- Above about 1440 px: a wider column, or a second column on some pages. The column has a cap and
  stays centered at 2560 and 3840 px (the orchestrator's 4K default: a capped centered column).
- The One Width Rule stays: the header, `main`, the footer and the selection bar take one width.
- W adds a 1920 px pass to the tests: `tests/app/` cases, `sweep.js`, the per-batch `shoot.js`,
  `FIRST_SCREEN` and the goldens.

Every line below that depends on a W number names it as a dependency (section 4). If W chooses
otherwise, the orchestrator reconciles with that section.

## Facts read from the code and the mocks (2026-11-04, `3ea2e10b`)

1. `--wrap` is `min(1180px, 100% - 32px)` (`tokens.css`). `Shell.svelte` (header, `main`, footer)
   and `SelectionBar.svelte` take `width: var(--wrap)`, so the selection bar follows any W change.
2. The `viewport` port has three bands: `narrow` (up to 760), `mid`, `wide` (from 1000 px).
   9a reads `app.band === 'narrow'` (the compact row), passes `band="mid"` to `FilterPanel`
   (the sheet at every width) and `SelBar` reads `app.band !== 'narrow'`. All three are safe
   if W adds a fourth band. `FilterPanel`'s own `band === 'wide'` check is the catalog's, so W owns it.
3. `RowMain`'s text has `max-width: 70ch`. `Sheet` is `min(100%, 560px)`. `SearchBox` is
   `width: 100%` of its row, so a wider column makes a wider box.
4. `/lists` cards are `repeat(auto-fill, minmax(280px, 1fr))`: 3 a row at 1180 px, 5 in a
   1600 px column, 13 in an uncapped 3840 px column.
5. The print sheet is `210mm` (about 794 px), `margin: 0 auto`, and `sheetScale` never goes
   above 1. A wider column only adds space beside the sheet. `@media print` does not read the
   window width, so W cannot change a printed card.
6. Mock 9 at 1180 px (`mocks/9/list__1180__ru.png`): the rows column is about 796 px, the side
   column about 330 px. In a row, the text cell is about 295 px; the controls (quantity, price,
   «Заметка», «Ещё») take about 362 px at the row end.
7. Mock 9 row arithmetic for a column of width C (9b's layout): the text cell is about C - 854 px.
   The 70ch text (about 525 px) fills it up to C of about 1380 px. Above that, the slack between
   the text and the quantity column is about C - 1380 px: 220 px at C = 1600, 500 px at C = 1880
   (an uncapped 1920 window), 1150 px at C = 2528 (an uncapped 2560 window).
8. No wave 3 mock draws a width above 1180 px. `mocks/measure.mjs` measures 360x640 and 1180x720.
9. Goldens shoot at 1100 px (`golden.js` `WIDTH`). `sweep.js` runs 360, 390, 768, 1180.
   `shoot.js` is per batch, in `mocks/<N>/built/`, at 360x640 and 1180x720.

## 1. Each batch at 1440, 1920, 2560 and 3840 px

At 1440 px the assumed W column is still 1180 px, so every wave 3 surface draws as at 1180.
"Holds at 3840" below means: under a capped centered column, the surface at 3840 (and at 2560
for 4K at 150%) is its look at the cap with wider margins. No brief needs a 3840 variant under
that rule. If W makes the column grow without a cap, or adds columns, the last column says what
breaks.

| Batch | Surface | 1440 | 1920 | 2560 / 3840 (capped) | Needs a wide variant? | If W grows the column at 4K |
|---|---|---|---|---|---|---|
| 9a | compact row (`CompactRow`, up to 760 px) | not drawn | not drawn | not drawn | no change: the row is the narrow band only | no change |
| 9a | full row from 761 px (ticks only in the mode, neutral `.sel`) | as 1180 | the row grows with the column; text holds at 70ch | as the cap | no: the row is 9b's to lay out; 9a changes no wide geometry | 9b's row problem (fact 7) |
| 9a | `ListFind` search row (from 8 entries) | as 1180 | the box grows to the column | as the cap | derived: the box takes W's search-row maximum, the same as `/search` (dependency W6) | the box stretches past any useful width without W6 |
| 9a | the filter sheet (`FilterPanel band="mid"`) | sheet | sheet, 560 px | sheet | no change: a sheet at every width is 9a's decision G15 | no change |
| 9a | list «Ещё», row «Ещё», price sheet `Sheet` | anchored | anchored | anchored | no change: menus and sheets are not column-wide | no change |
| 9a, 8 | selection bar (`SelectionBar` via `pageBar`) | 1180 | W's column | W's column | derived: `--wrap` (fact 1) | the bar spans the screen with the column |
| 9a | `/s/` lead line, the `h1` (three lines from 761) | as 1180 | holds | holds | no change | no change |
| 8 | `/lists` head row («Мои списки», «Ещё», «Новый список») | as 1180 | the primary sits at the column end | as the cap | derived: W's head rule (dependency W5) | the primary drifts 3000 px from the `h1` |
| 8 | `/lists` card grid | 3 a row | 4-5 a row (by W's column) | as the cap | derived: auto-fill holds; W's tile rule decides a column cap (W7) | 13 a row: holds, but no card count cap |
| 8 | list card inside (thumbs, «Новое в списке (3)», «Ещё») | holds | holds | holds | no change: the card is 280 px or more in every column | no change |
| 8 | lists import panel, `/lists/<uuid>` not found (`ErrorPage`) | holds | the text keeps its measure | holds | derived: W's measure rule (W4); `ErrorPage` is wave 2's | text lines grow without W4 |
| 8 | add-to-list menu (item page, dialog) | holds | holds | holds | no change: a menu anchored to its button; the dialog is wave 2's | no change |
| 9b | list page: rows column and the side column (from 1000 px) | as mock 9 | slack 220 px at C = 1600 (fact 7) | as the cap | **yes: a drawn mock** (M-9b below) | **breaks**: 500-1150 px of slack between the name and the quantity |
| 9b | `/s/` with the side column | as mock 9 | as the list page | as the cap | yes, in the same mock (M-9b) | breaks the same way |
| 9b | note switch, share, roll, price and requests panels | in the side column | the same fixed width | the same | no change: the side column keeps its width at every width from 1000 px | no change |
| 9b | A1 at 640-900 px | not in range | not in range | not in range | no change | no change |
| P | `/p/` bar (back, `h1`, the primary, the two switches, «Ещё») | as 1180 | left edge at the column | as the cap | derived: the One Width Rule | the bar sits at the far left of a 3800 px column |
| P | the 63x88 and 44x63 sheets (screen preview) | one sheet, centered, scale 1 | one sheet, centered | one sheet, centered | no change under option A (Q-W3): the preview is paper at true size | holds: more empty space, nothing breaks |
| P | the printed sheets (`@media print`) | - | - | - | no change: print does not read the window (fact 5) | no change |
| P | the editor's print preview (`PrintPreview`) | capped by `PREVIEW_MAX_PX` | the same | the same | no change | no change |
| P | notes under the sheets (hint, the sub line) | 62ch | 62ch | 62ch | no change | no change |
| 10 | DESIGN.md "Notes", detector, `design.json`, re-audit, closeout | - | - | - | no screen; the re-audit and the blind review add the wide widths (section 3) | the re-audit then covers 3840 too |
| - | `/homebrew`, the editor, the catalog, the item pages | - | - | - | W's (waves 1-2). Wave 3 touches `HomebrewPage`, `TablesPage`, `SearchPage` only for `SelMode` (9a G16), which moves no byte | - |

Summary: one surface needs a drawn mock (9b's list page and `/s/` with the side column). The
others follow W's rule and need no drawing. Under a capped column, nothing needs a 3840 variant.

## 2. Mock briefs

### M-9b - the list page and `/s/` with the side column at wide windows (a mock pass draws it)

- Who: a mock pass (planner or mock unit), after W lands and before 9b's refresh. It runs no gate,
  so it can run while 9a or 8 is in work. The owner confirms it; with the owner away, the
  recommended option is logged in the AFK decisions file.
- Start from `mocks/9/` (`state.html`, `r.css`, `u.css`, `states.js`), states `list`,
  `shared-player` and `list-requests-open`. Add a `width` to the mock's state loader. Do not
  redraw the 360 or 1180 states.
- Draw at window widths 1440, 1920 and 2560, RU and EN. Draw 3840 only if W does not cap the
  column. Draw 1440 once to prove it equals 1180.
- Show: the column at W's width and gutter, the side column (about 330 px, as mock 9), the rows
  column, one row with a long text and one with a short text, the selection bar in the mode, the
  header's left edge over the first word of the page.
- Measure with `mocks/measure.mjs`, its `VIEWS` extended by 1920x1080 (and W's wide viewport if it
  differs). Write the slack between the end of the text and the quantity field into the
  `index.html`.
- Options to draw:
  - A (recommended): the rows column takes the rest of W's column, the side column keeps its
    width, the row's text keeps 70ch. Holds while the slack is at most about 240 px, that is a
    column of up to about 1620 px. One rule for every width, and the table header («Кол-во»,
    «Цена») keeps the controls in columns. Accepted trade-off: up to 240 px of empty row.
  - B (only if W's cap is wider than about 1620 px, or W grows the column): the rows column takes
    a `max-width` (about 1100 px), and the side column sits right after it; the space at the
    column end stays empty. Accepted trade-off: the page loses the column's right edge, a named
    departure from the One Width Rule.
- Must match W: the `--wrap` formula and gutter, the head rule (where «Поделиться», «Печать» and
  «Ещё» sit), the measure rule, the selection bar span.
- Run Impeccable `critique` with the Clarity Rule on it before the owner sees it (`plan.md`
  section 9).

### Surfaces the implementer derives from W's rule (no drawing)

| Surface | Batch | Derive from | Evidence |
|---|---|---|---|
| `ListFind` search row | 9a | W's search-row maximum (W6), as `/search` | `mocks/9a/built/` at 1920 |
| selection bar on both list pages and `/lists` | 9a, 8 | `--wrap` (fact 1) | the same set |
| `/lists` head, card grid, import panel | 8 | W's head rule (W5), tile rule (W7), measure rule (W4) | `mocks/8/built/` at 1920 |
| `/p/` bar and sheets | P | the One Width Rule; option A of Q-W3 | `mocks/P/built/` at 1920, screen resolution |

If the owner picks option B of Q-W3 (two sheets in a row), `/p/` needs a drawn mock: start from
`mocks/P/state.html` state `page-proposed`, draw 1920 and 2560 with 9 and 16 cards and with 20
sheets, and show «Лист N из M» over each sheet.

## 3. Acceptance lines each batch gains

Case numbers: a new browser case takes the next free number at its batch's dispatch, and the
handoff names it (the convention of `plan-9a.md`, "Dispatch preflight"). Today 7b holds 95-97 and
9a reads 98-100; W's cases come before 9a's if W runs first (Q-W1). The lines below prefer a wide
step inside an existing case to a new number. Each line is its own acceptance line in its batch.

Batch 9a:

- 9a-W1: at 1440 and 1920 px (and W's wide viewport), `/lists/<uuid>` and `/s/` draw the full row;
  `CompactRow` does not mount (`listPage.test.ts` with the fake viewport at the widest band; a 1920
  step in the compact-row case, 98 by today's count).
- 9a-W2: at 1920 px the `ListFind` search box is no wider than `/search`'s box at the same width
  (a geometry step in the search-and-filter case, 99 by today's count). Depends on W6.
- 9a-W3: the list filter stays a sheet at every band, a new W band included (`listFind.test.ts`).
- 9a-W4: no wave 3 code tests `band === 'wide'` for its own layout; it tests `!== 'narrow'` or uses
  CSS from 761 or 1000 px, so a fourth band changes nothing (review line).
- 9a-W5: on both pages in the mode, the selection bar's left edge equals `main`'s at 1920 px (a step
  in the bar case, 100 by today's count, or W's sweep check if W adds one for every bar).
- 9a-W6: the `FIRST_SCREEN` list rows stay `shipped: 360`; they are logged at 1180 px and at W's wide
  viewport. If W changes the `shipped` grammar, 9a uses W's form.
- 9a-W7: the screenshot set adds `LIST_A ~ many as gm4` and `#/s/player-token-1` at 1920 px, RU and
  EN; `mocks/9a/built/shoot.js` takes W's size list.

Batch 8:

- 8-W1: at 1920 px `/lists` draws the card grid by W's tile rule (W7), and every card keeps 280 px
  or more (sweep at W's width; a 1920 golden of `#/lists as gm1`, RU and EN, if W adds a 1920
  golden family).
- 8-W2: the head row follows W's head rule (W5): «Новый список» is the head's primary in the place W
  sets; the count and «Выбрать» stay in the collection head (section 14, "One place for each list
  control").
- 8-W3: the import panel's text and the not-found page keep W's measure at 1920 px (W4).
- 8-W4: the selection bar on `/lists` spans `--wrap` at 1920 px, as on the other pages.
- 8-W5: `#/lists as gm1` is asserted at W's wide viewport in `FIRST_SCREEN` (if W adds one).
- 8-W6: at the limit, 50 lists, and at 3x, 150, the grid keeps list order at 1920 px; no row of
  cards is cut (`listsPage.test.ts` order case; the sweep).
- 8-W7: the screenshot set adds `/lists`, its selection mode and the import panel at 1920 px, RU
  and EN.

Batch 9b:

- 9b-W1: the mock M-9b is drawn, critiqued and confirmed (or the AFK default logged) before 9b's
  implementer starts.
- 9b-W2: from 1000 px the side column keeps its width at 1440, 1920 and 2560 px, and the rows
  column takes the rest (option A), or option B as M-9b settles. A geometry step in 9b's states
  case asserts, at 1920 px in RU and EN, that the slack between the text and the quantity field is
  at most the figure M-9b writes (about 240 px).
- 9b-W3: `/s/` (player and GM links) follows the same rule at 1920 px.
- 9b-W4: the `FIRST_SCREEN` rows `LIST_A as gm4` and `#/s/player-token-1` move to `shipped: true`
  and pass at W's wide viewport too.
- 9b-W5: a 1920 px golden of `LIST_A as gm4` and of `#/s/player-token-1`, RU and EN, if W adds a
  1920 golden family.
- 9b-W6: the screenshot set adds `list`, `list-prices`, `shared-player` and `list-requests` at 1920
  and 2560 px, RU and EN.
- 9b-W7: DESIGN.md "Layout" names the list page's side column at wide widths in W's words.

Batch P:

- P-W1: at 1440, 1920 and 2560 px the `/p/` bar's left edge equals `main`'s; the sheets draw at scale
  1, one in a row, centered in the column (option A of Q-W3); `sheetScale` is unchanged
  (`printPage.test.ts`; sweep at W's width).
- P-W2: the printed output does not depend on the window: `tests/app/print.js` passes unchanged
  after W, and the catalog measure gives the same figures from a 1920 px window as from 1180 px
  (one run, RU, the standard colour layout).
- P-W3: the `/p/` row of `FIRST_SCREEN` passes at W's wide viewport too.
- P-W4: the notes under the sheets keep 62ch at 1920 px.
- P-W5: the editor's print preview draws the same card at 1920 px as at 1180 px.
- P-W6: the screen screenshot set adds `/p/` at 1920 px, RU and EN; the print-resolution set does
  not change.

Batch 10:

- 10-W1: DESIGN.md "Layout" and `.impeccable/design.json` hold W's wide rule; DESIGN.md "Notes" names
  each wide departure that a wave 3 batch kept.
- 10-W2: the `FIRST_SCREEN` table has no logged row at any viewport, W's wide one included.
- 10-W3: the re-audit capture adds 1920 and 2560 px (3840 if W does not cap the column).
- 10-W4: the brief of the whole-app blind review (`plan.md` section 16, step 1) checks 1920 and 2560
  px in RU and EN, and 3840 px; at 2560 px it looks at the list art at a device pixel ratio of 1.5
  (4K at 150%), which no other width checks.
- 10-W5: any wide item that W or a wave 3 batch deferred is closed, or named at closeout.

### Gate cost and batch sizing

| Batch | Added local work | Minutes |
|---|---|---|
| 9a | the fake-viewport unit cases, one 1920 shoot pair, no new golden | 3-5 |
| 8 | two goldens in the same re-seed, the 1920 shoot set | 3-5 |
| 9b | two to four goldens in the same re-seed, the geometry step, the 1920 and 2560 shoot set | 5-8 |
| P | one catalog measure run from a 1920 window, the 1920 shoot pair | 5-7 |
| 10 | the re-audit capture at two or three more widths | 5-10 |
| mock M-9b | no gate; a mock session of 30-45 min, outside the gate total | - |

Total: about 21-35 minutes of local gates across wave 3. CI: the sweep's extra width and the wide
cases are W's cost; wave 3 pays it on each of its about 10 CI runs (an estimate of 1.5-3 minutes
of wall time a run, not measured).

Sizing (`CLAUDE.md`, "Size a batch by its gates"): every line shares its batch's component, seed,
filter set and golden re-seed, so each line merges into its batch. No new batch and no split. A
separate "wave 3 wide" batch was weighed and rejected: it would re-seed the list goldens a third
time and cost 45-60 minutes for a few geometry steps.

## 4. Decisions W must make first

Exact decisions, in the order the wave 3 lines read them:

- W1. The column function above 1440 px: the formula, the cap value in px, and the gutter. 9b's
  option A holds only while the column is at most about 1620 px (fact 7).
- W2. 4K: a capped centered column, a growing column, or more columns. This brief assumes a cap; a
  grow or more columns makes M-9b draw 3840 and makes Q-W3's option B worth a second look.
- W3. The One Width Rule: whether the header, `main`, the footer and the selection bar keep one
  width above 1440 px, or the header and the bar keep 1180 px.
- W4. A measure rule: the longest line of a paragraph, a panel's text and a sub line in a wide column
  (today 62ch and RowMain's 70ch).
- W5. The head rule at wide widths: where a page's primary action sits (the column end, or beside
  the `h1`), for `/lists` «Новый список» and the list page's action row.
- W6. The search row's maximum width (the catalog, `/search`), which `ListFind` takes.
- W7. The tile and card grid rule: auto-fill without a cap, or a cap on columns. `/lists` follows.
- W8. A second column: which pages get one, and whether the list page's 1000 px side column (9b)
  counts as it, or the catalog's 250 px filter column grows.
- W9. The band: a fourth `viewport` band, or CSS only. The Two Breakpoints Rule says "do not add
  another system breakpoint", so W amends DESIGN.md in either case.
- W10. The test grammar: the widths `sweep.js` adds, the wide `FIRST_SCREEN` viewport (1920x1080?)
  and how `shipped` names it, a 1920 golden family and its naming, `shoot.js` sizes, the
  `measure.mjs` views, and W's case number range.
- W11. The order: W before 9a, or after wave 3 (Q-W1).

## 5. Standing checks

1. Scale. No collection, cap or record changes. At wide widths: 50 lists (3x 150) draw in W's grid
   in list order; 100 entries (3x 300) keep their row heights; 180 print cards (20 sheets) stay one
   sheet a row. The longest list name sits in the 330 px side column at every width from 1000 px,
   so its wrap does not change. Each row of the earlier tables is unchanged at 360 and 1180 px;
   the new rows are 1440, 1920, 2560 and W's cap. No sticky region grows with the width.
2. Error scenarios. No write path and no stored shape changes. Loading, a failed read or write,
   offline, a conflict, a deleted record, a stale tab (the old bundle draws the 1180 column) and a
   revert are as each batch's brief says. A resize across a W band while a field has the focus
   unmounts nothing if W uses CSS; with a fourth band, only `narrow` mounts or unmounts wave 3
   parts (9a-W4), so nothing new is lost.
3. Consistency. The rules followed: the One Width Rule (W's form), section 14's one place for each
   list control, the selection bar on every page, the First-Screen Rule. Named difference: the list
   pages keep the filter as a sheet at wide widths while the catalog draws a column (9a G15; the
   side column holds the list's own panels).
4. RU/EN parity. No new string. Every wide geometry step and screenshot runs in RU and EN; RU is the
   longer one in the side column and the bar.

## 6. Owner questions (each with a default; none blocks 9a or 8)

- Q-W1. Order: W before 9a (recommended), or after wave 3. W changes `--wrap`, which every page
  reads; after wave 3 it would re-seed wave 3's goldens again. Trade-off: 9a starts later by W's run.
- Q-W2. 9b at wide widths: option A, the rows take the rest of the column (recommended while W's cap
  is at most about 1620 px), or option B, a capped rows column. A keeps one right edge; B holds at
  any cap. M-9b draws both.
- Q-W3. `/p/` at wide widths: option A, one sheet a row at true size (recommended), or B, two sheets
  a row when the column holds two at scale 1 (about 1606 px). A changes nothing in the print fit or
  its tests; B shortens a 20-sheet preview but needs a mock and depends on W's cap.
