Verdict: fix-then-continue
Reviewed: 9db714b4da8c590916e7760bcc9b87d3a12faee4
Scope: whole-app

# Review - whole app, signed in, fixture build (57)

Blind review: I read `CLAUDE.md`, `DESIGN.md`, `docs/specs/*.md` (the sections in scope), the
decisions that the specs cite, `app/src` and `tests/app/lib.js`. I did not read the plan, the
handoff, the context, earlier reviews or the mocks.

Build: the bash guard refused `npm run build:test` (reviewer, no npm script). `dist-test/` passed
`tests/app/serve.js` `assertBuilt` (byte check and mtime check against this tree), so I probed it
as built. Every probe ran through `tests/app/lib.js` (`fresh()`, one context per language, one
headless Chrome), signed in with `?as=gm1..gm4`.

Screenshots are in
`C:\Users\Ignat\AppData\Local\Temp\claude\97bbd0b98c47ced0\33951b0e-389b-4f3e-901a-6827167c86d6\scratchpad\shots\`
(`<route>-360.png`, `<route>-1180.png`, `ov-<overlay>-<width>.png`, `en-*.png`, `long-*.png`,
`scale-*.png`). Each finding names its file.

## Blockers

B1. The selection bar is sticky, not pinned to the bottom of the screen. On a short page, and at
the end of any page, it sits above the footer in the middle of the window. The page toast keeps
its fixed offset (`26px + --selbar-h`), so it then draws under the bar, over the footer. DESIGN.md
"Selection bar" says "pinned to the bottom of the screen", and "Toast" says "26px above the
selection bar while the bar shows".
- `/lists` (3 cards), one tick: the bar top is at y=496 in a 720 px window at 1180, y=678 of 1024
  at 768, y=712 of 1080 at 1920. Screenshot `ov-lists-selbar-1180.png`.
- `/homebrew` at 768 and 1920: the bar is not at the bottom (`ov-hb-selbar-768.png`).
- `/lists/<uuid>` at 1920 after «Скрыть от игроков (2)»: the bar is at y=877, the toast
  «Скрыто от игроков: 2» is under it over the footer (`ov-list-toast-1920.png`).
- At 360 the bulk move sheet opens with the bar pushed up to y=332 above it (`ov-hb-move-360.png`).
- Cause: `app/src/components/SelectionBar.svelte:97` (`position: sticky; bottom: 0`).
- Change: pin the bar to the window (`position: fixed` inside the `--wrap` column, with the page
  reserving `--selbar-h` of bottom padding), so the bar and the toast offset agree on every page
  length. Add a states case: `/lists` at 1180x720 with 3 lists, one tick, bar bottom = window
  bottom.

B2. The toast inside the record dialog covers the dialog's dock up to 760 px. At 360x640
«Ссылка скопирована» sits 26 px off the bottom over «Печать» and «Ещё» of the sticky dock (toast
y=570..614, the dock rows from y=530). An undo toast there holds 7000 ms over the controls.
Screenshot `toast-dialog-360.png`. Cause: `app/src/components/Toast.svelte:228-230` lifts only
`.toast.page` (`--selbar-h`, `--ebar-h`, `--pdock-h`); the dialog copy has no dock offset. The
same rule leaves a toast over a `Sheet`'s foot buttons (not measured, same code path). Change: give
the dialog and sheet copies a bottom offset of their dock or foot height (a `--dock-h` set by
`RecordModal` up to 760 px and by `Sheet` when it has a foot).

B3. Focus falls to `<body>` after an in-app link navigation that removes the pressed link
(FEATURES.md rule 20: "else `#main`"; the rule lists the list page's «Печать» to `#main` as one
case of the same principle). Measured with keyboard focus and Enter, at 360 and 1180:
- `/lists` card link to `/lists/<uuid>`: focus BODY.
- `/homebrew` row to the editor: focus BODY.
- «Новый предмет» to `/homebrew/new`: focus BODY.
- The editor crumb «Мои предметы» to `/homebrew`: focus BODY.
- `/homebrew/sources` source name link to `/tables/homebrew/...`: focus BODY.
The mode pills, the jobs and the homebrew tab pills keep focus (they stay mounted). Cause:
`app/src/App.svelte` moves focus only in `resetPage` (line 98-101); a route change has no focus
rule. Change: on a navigation that changes `app.route.kind` (or remounts the page), move focus
to `#main` when the active element left the DOM. Add one states case per kind above.

B4. The `/lists` import toggle is 32 px tall beside the 40 px «Выбрать» in the same count row
from 761 px. The three sibling tool rows on «Мои предметы» set it to 40 px. Screenshots
`lists-1180.png` (32 px) against `hb-items-1180.png` and `hb-sources-1180.png` (40 px). No spec
line gives a reason. Cause: `app/src/components/ListsPage.svelte:634` `.end` has no
`:global(.btn.sm) { height: 40px }`, as `HomebrewPage.svelte:586-589`,
`HomebrewSources.svelte:572-574` and `HomebrewCards.svelte:654-656` have.

B5. The Items tab's primary «Новый предмет» drops its plus icon up to 760 px; from 761 px it
carries it. `/lists` keeps the plus at both widths. FEATURES.md rule 8 ("with the plus icon") and
DESIGN.md "The Same Label Rule" give no width exception. Screenshots `hb-items-360.png` against
`lists-360.png`. Cause: `app/src/components/HomebrewPage.svelte:336` renders `newItem(false)`,
and `newItem` (line 293-301) ties the icon to the size. Change: draw the icon at both sizes.

B6. The roll mode pills are 32 px tall from 761 px; the catalog's group chips and the homebrew tab
pills are 37 px. DESIGN.md "Chips", "Sibling pills" names the three as one kind of link chip.
Screenshots `roll-std-1180.png` (pills 134x32) against `tables-weapon-1180.png` (52x37) and
`hb-items-1180.png` (96x37). Cause: `app/src/components/ModeRow.svelte:185` sets
`line-height: 1.25`; `Chip.svelte:107-119` inherits the body line height. Change: one line height
for the three, then re-seed the head goldens.

B7. The crop dialog has its own shape. Up to 760 px it is a centered card with four round corners
and a 12 px inset (321x503 at 12,69 in a 360x640 window), while every other modal at that width
is attached to the bottom with top corners only (the `Sheet`, the record dialog). From 761 px it
is 520 px wide against the sheet's 560 px. DESIGN.md "Sheet" says "every modal from 761px has one
shape"; no line names the crop dialog. Screenshots `ov-crop-360.png`, `ov-crop-1180.png` against
`ov-hb-move-360.png`, `ov-tables-record-360.png`. Cause:
`app/src/components/CropDialog.svelte:319-330`. Change: take the `Sheet` geometry (bottom up to
760 px, `min(100%, 560px)` centered from 761 px), or name the exception in DESIGN.md "Sheet" with
its reason (a square stage needs the window's height).

B8. The scrims differ: the record dialog's backdrop is `rgb(6 4 12 / 78%)` with `blur(5px)`; the
`Sheet` and the crop dialog take the same color with no blur. Same width, same page (a table
page's record dialog and its filter sheet). Cause: `RecordModal.svelte:149-152` against
`Sheet.svelte:101-103` and `CropDialog.svelte:337-339`. Change: one scrim rule for every modal.

B9. The add-to-list popover changes its inset by caller at 360: in the record dialog it spans the
whole sheet (0..345, touching both window edges, four round corners); from the selection bar and
a roll result it keeps the 16 px gutter (16..329). Screenshots `ov-record-atl-360.png` against
`ov-tables-baratl-360.png` and `ov-roll-atl-360.png`. Cause: `AddToList.svelte:718-724`
(`left: 0; right: 0` against the caller's box; the dialog's box has no gutter). Change: inset the
popover 16 px in the dialog too.

Note on B7-B9: they are blockers only under this review's rule ("a difference that no DESIGN.md
or FEATURES.md line gives a reason for is a blocker"). Each is a few lines of CSS.

## Risks

R1. The One Shadow Rule is broken by every `Menu` and the add-to-list popover:
`box-shadow: 0 16px 40px -14px rgb(0 0 0 / 85%)` is neither the Plate shadow nor the toast's Float
(`Menu.svelte:99`, `AddToList.svelte:538`). DESIGN.md "Elevation", "The One Shadow Rule": "A
second elevation step is a change to the system". Change: `var(--shadow)`, or record the menu
shadow as a third named step with the owner's yes.

R2. An instruction sentence with no spec line: the empty owner's list page draws «Пока пусто.
Откройте «Таблицы» или «Поиск», отметьте нужное галочками и нажмите «В список» - или сделайте
это прямо с карточки предмета. Свой предмет можно создать здесь же, кнопкой ниже.» (five lines
at 360, no heading, «Таблицы» and «Поиск» are not links). Screenshot `emptylist-360.png`. Code:
`ListPage.svelte:1848`, `dict.ts:378-379`, `dict.ts:586` (EN `1437-1438`, `1634`). DESIGN.md "The
Clarity Rule" calls it a defect; removing visible text needs the owner's yes. Recommendation: the
`/lists` empty plate's pattern (a heading «В списке пока ничего нет» and the two places as links),
for the owner to decide. The `/lists` empty hint «Нажмите «Новый список» - ...» (`dict.ts:322`) is
an instruction too, but FEATURES.md line 540 specifies it.

R3. axe-core 4 (wcag22aa) fails `target-size` on the owner's list page in the selection mode
from 601 px: the row tick is a 13x13 input 23 px from the position field (10 nodes at 1180). The
wrapping label is 32x112, so the press target is large and `tests/app/lib.js` `targets()` passes
it; axe measures the input. The same tick on `/tables` and `/homebrew` passes axe. Screenshot
`list-sel-1180.png`. Change: size the input to the label's 24 px floor, as the sibling pages do.

R4. Scale at 360: the shared page's selection bar is 212 px tall (33% of a 640 px window): «Все»
row, then «В список» full width, «Печать» and «Скопировать текст», «Сообщить владельцу» full width
(`ov-share-selbar-360.png`). The owner's list page folds its rare actions into «Ещё» and stays at
137 px. The add-to-list popover above it reaches y=324. Not a rule breach (DESIGN.md folds only the
owner's page), but the shared page is the player surface of The Phone-First Rule.

R5. The homebrew editor's «Название» field cuts a 120-character name with no ellipsis from 761 px
(927 px of text in a 655 px field at 1180; `long-_homebrew_hb_bedrolloaaaaaaaa-1180.png`). The
Whole Message Rule exempts the editor's name only up to 760 px. The heading above shows the whole
name, so nothing is lost, but the list name field shows an ellipsis in the same case.

R6. The `/lists` head primary and «Ещё» are 44 px up to 760 px (FEATURES.md line 509, spec'd); the
sibling «Мои предметы» head draws «Новый предмет» and «Ещё» at 40 px (`lists-360.png` against
`hb-items-360.png`). Either both pages' primaries are "a full touch target" or neither; the spec
gives the reason for one page only.

## Nits

N1. `deferred-scope`: DESIGN.md "Shapes" lists "the toast" with the 999px pill radius; DESIGN.md
"Toast", FEATURES.md "Chrome" and `Toast.svelte:219` use `--r`. Fix the "Shapes" sentence.

N2. `local`: `Menu.svelte:2-4` cites "rule 11" for the menu's keys; rule 11 is "Cancel and close".
The account menu's keys are FEATURES.md "Chrome" (the account menu paragraph).

## Deviations

Not applicable: a blind review reads no handoff, so it checks no recorded deviation.

## Surface inventory (overlays, RU)

Anchor: BOTTOM = the box's bottom edge on the window's bottom; centered; attached = under or over
its control. Corners: top/bottom. All modals share the scrim color `rgb(6 4 12 / 78%)`.

| Overlay (caller) | 360x640 | 768x1024 | 1000x720 | 1180x720 | 1920x1080 |
|---|---|---|---|---|---|
| Sheet: filters (list page, `/s/`, `/tables` below 1000) | BOTTOM, 345 wide, 14/0 | centered 560, 14/14 | centered 560 (list, `/s/`; `/tables` has the column) | same | same |
| Sheet: table picker, homebrew tab picker | BOTTOM 345x274, 14/0 | - (head pills) | - | - | - |
| Sheet: «Цены» (list bar) | via bar «Цены», BOTTOM | centered 560x346 | same | same | same |
| Sheet: bulk move (homebrew bar) | BOTTOM 345x226 (bar pushed up, B1) | centered 560x213 | same | same | same |
| Sheet: editor preview | BOTTOM 345x544 | - (column) | - | - | - |
| Record dialog | BOTTOM 345x589, 14/0, blur scrim (B8) | centered 717x374, 14/14 | centered 949 | centered 980 | centered 980 |
| Crop dialog | centered 321x503, 14/14, 12 px inset (B7) | centered 520x702 | same | same | same |
| «Ещё» menus (head, row, bar, card, dock, editor bar, roll) | attached, 220-240 wide, 14/14, items 44 px | attached, items 42 px | same | same | same |
| Supplements menu, account menu | attached 220 wide | same | same | same | same |
| Add-to-list popover | dialog: full sheet width 0..345 (B9); bar and roll: 16..329 | attached 280 wide | same | same | same |
| Selection bar | BOTTOM, 116-212 tall | not at the bottom on a short page (B1) | same | same | same |
| Toast | 26 px off the bottom; in the dialog over the dock (B2) | centered 26 px over the bar | same | same | under the bar at page end (B1) |
| Print dock | BOTTOM 345x67, «Напечатать», «Ещё» (one item) | - (print bar) | - | - | - |
| Editor bar | BOTTOM 311x65, «Сохранить», «Предпросмотр», «Ещё» («Удалить») | in flow | in flow | in flow | in flow |

Every overlay passed `targets()` (40 px up to 600 px, 44 px menu items, 24 px with spacing from
768 px) in every open state, including each selection bar, each sheet, a failed save and both
limits. Focus returned to the opener after Escape on every sheet, menu, popover and the record
dialog (keyboard-opened).

## Consistency matrix (RU; 360 / 1180)

Places: head = page head row; tool = the collection's tool or search row; menu = an «Ещё» item;
side = the list page's side plate; bar = selection bar; dock = bottom dock; - = not drawn.
"rule N" is FEATURES.md "Consistency rules".

| Row | /lists | /lists/<uuid> | /s/<token> | /homebrew Items | Sources / Sets / Rules | /tables/* | /search | roll pages | /account | /p/<id> |
|---|---|---|---|---|---|---|---|---|---|---|
| Import «Импорт из файла» | menu / tool 32 px (B4) | - | - | menu / tool 40 px | menu / tool (count line) 40 px | - | - | - | - | - |
| New or create | «+ Новый список» head 44 px / head md | «+ Добавить свой предмет» row after entries | - | «Новый предмет» head, no plus (B5) / «+ Новый предмет» head | «+ Новый источник/комплект/карта правил» first under tabs, both | - | - | - | - | - |
| «Выбрать» | tool (count row) | head row up to 999 (under 8 entries), tool from 8 | tool | tool | - | tool, last | tool, last (with results) | - | - | - |
| Search box | tool from the 8th list | tool from 8 entries | tool | tool from 8 items | - | tool | tool | - | - | - |
| «Фильтры» | - | tool (sheet) | tool (sheet) | tool (sheet up to 999, when facets exist) | - | tool below 1000 / column | tool / kind chips | - | - | - |
| Pin | menu / head | - | - | menu / head | menu / head (one pin) | menu / head | menu / head | results «Ещё» / head | - | - |
| Help | - | - | - | - | - | menu «Об этих данных» / head | - | results «Ещё» / head | - | - |
| Primary | «Новый список» | - (rows first) | «Сохранить себе» under the lead | «Новый предмет» | create button | - | - | dice or «Бросить ...» | - | «Напечатать» dock / first in print row |
| Share | - | menu / side «Поделиться ▾» | - | - | - | menu / tool «Ссылка на таблицу»; section «Ссылка на раздел» | - | per result «Поделиться» | - | dock menu / print row «Ссылка на набор» |
| Print | - | menu / side «Печать»; bar | bar | bar | - | bar | bar | - | - | (page) |
| Roll | - | menu / side «Бросить по списку» | - | - | - | - | - | page | - | - |
| Note toggle | - | «Заметки ▾» meta line / side «Заметки» | «Заметка» meta line | - | - | - | - | - | - | - |
| Counter and limit | count row «3 списка из 50» | sub «10 позиций из 100» | sub «8 позиций» | picker sheet / tool «4 предмета из 100» | count line | - | - | - | - | - |
| Save status | count row, on failure only | sub «Сохранено»; «Повторить» on failure | - | - | - | - | - | - | - | - |
| «Ещё» contents | import, pin / - | share, print, roll, prices, copy, JSON, delete / copy, JSON, delete | - | import, pin / - | import, pin / - | link, pin, help / - | pin / - | copy all, pin, help / - | - | «Ссылка на набор» / - |

Every difference in a row has its spec line except B4, B5 and R6: import place (rule 9;
FEATURES.md 506-508, 1874), «Выбрать» on the list page (FEATURES.md 674-675, 1111-1112),
search thresholds (527, 1866, catalog), «Фильтры» (201, 1869, Search Head Rule), pin and help
(FEATURES.md "Chrome", The Same Label Rule; `/lists` and `/homebrew` have no help), primaries
(rule 9), share labels (FEATURES.md 184, 203, 2514; rule 17), note toggles (FEATURES.md 997-1000,
1113), counters (rule 1), save status (FEATURES.md 524-526), «Ещё» contents (FEATURES.md 183-184,
1114-1117, 2538).

Selectors of `/roll/*` against `/tables/*`: at 360 the roll pages draw the three mode controls in
the mode row under the header (links, 40 px, «Дополнения ▾» opens a menu); the tables draw a
picker button that opens a `Sheet`, the «Список / Сетка» switch and «Ещё». At 1180 both draw
sibling pills in the head (roll: three pills with «Дополнения ▾»; tables: seven group chips, the
book as underlined tabs under the head), and the tables' view switch moves into the search row.
The structure is spec'd (DESIGN.md "Navigation", "Two-level navigation"; FEATURES.md 180-203);
the pill height is not (B6).

## Seeded defect classes

- Placement: B1, B2, B7, B9 (found).
- Wrapped, clipped or cut names: none found on `/lists`, `/lists/<uuid>` with a 120-character
  name (ellipsis up to 999 px, wraps in the side plate from 1000 px, as spec'd), `/s/`,
  `/homebrew` (gm3's 120-character item), `/tables/homebrew`, `/h/`, the 80-character source and
  the add-to-list menu, in RU and EN. One cut without ellipsis: R5.
- Text that looks like plain text but is a control: none found (the Sets and Rules card names
  are bare buttons with a caret, rule 12).
- Groups with no gap: none found (every pair of switch or chip groups under 16 px apart has a
  caption between).
- Unnamed or misnamed controls (WCAG 2.5.3): none found. The steppers' «−» and «+» are symbols
  inside «На единицу меньше» / «больше»; the list cards' names add commas to the visible words.
- Controls under the target floor: none found by `targets()` in the selection mode, every open
  sheet and menu, a failed save, both limits (50 lists, 100 items) at 360 and 1180; one axe
  `target-size` failure (R3).
- Focus on body: B3 (after an in-app navigation). After a self-removing control: none found
  (the failed and the passed «Повторить», a row removal and its undo, every overlay close).
- Instruction sentences: R2.

## Standing checks

1. Scale: checked - `/lists` at the limit of 50 lists (count red, the primary's limit toast, all
   ticked), `/homebrew?items=100` at the limit (red limit line under the search up to 760 px, all
   ticked), the list page with 10 entries, `/s/` with 8, at 360 and 1180; no control under the
   floor, no sideways scroll; the 212 px shared bar is R4. 3x the default was not probed (Checks
   still needed).
2. Error scenarios: checked - a list write offline: «Не сохранено» with «Повторить» on the meta
   line at 360 and 1180 (`savefail-360.png`), a failed retry keeps the focus on «Повторить», a
   passed retry moves it to the list «Ещё» (rule 20); the limit refusal on `/lists` toasts the
   cause; a removal toasts «Вернуть», takes the focus, and the undo restores the row. Not probed:
   conflicts, a deleted record that a list names, a stale tab (Checks still needed).
3. Consistency: checked - FEATURES.md rules 1, 8, 9, 12, 16, 17, 20, the sibling pages in the
   matrix above and the overlay inventory at five widths; departures B4-B9, R1, R6.
4. RU/EN parity: checked - 13 routes in EN at 360 and 1180 (`en-*.png`): no Russian UI string
   outside list names (data), no cut text, no control under the floor; the toasts and menus were
   read in RU only.

Owner rules: not applicable - a blind review reads no `context.md`.

## Suggested next action

Send B1-B9 and the `local` nit N2 to an implementer in one remediation batch (shared files:
`SelectionBar`, `Toast`, `App`, `ListsPage`, `HomebrewPage`, `ModeRow`, `CropDialog`,
`RecordModal`/`Sheet`, `AddToList`), with a states case each for B1, B2 and B3 and re-seeded head
goldens for B5 and B6. Ask the owner about R1 (menu shadow) and R2 (the empty list page text);
file R3-R6 and N1 in the handoff's Deferred unless the batch touches those lines.

## Checks still needed

- `npm run build:test` was refused by the bash guard; `dist-test/` passed `assertBuilt`, so the
  probes ran on a build of this tree.
- 768x1024 and 1000x720 matrix cells (overlays were measured there; the head and tool rows were
  read at 360 and 1180 only), and the overlays in EN.
- The toast over a `Sheet` foot (B2's second half) and over the editor's bar inside the preview
  sheet: inferred from `Toast.svelte`, not measured.
- Scale at 3x the defaults (150 lists, 300 items, 60 sources) and the 30-list fold.
- Conflict, deleted-record, stale-tab and two-tab paths of the list writes.
- The crop dialog by keyboard (stage arrows, Escape) at 360.
