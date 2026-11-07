Verdict: approve
Reviewed: cf472814
Scope: whole-app

# Review - S3 verification, whole app (57)

Method: `dist-test/` of `cf472814` (it passed `assertBuilt`), served by `tests/app/lib.js` `fresh()`, headless
Chrome with reduced motion, signed in with `?as=gm1..gm4`, read-only probes through stdin. axe-core 4 with
`color-contrast` on (`lib.js` `axe`). Screenshots are in
`C:\Users\Ignat\AppData\Local\Temp\claude\97bbd0b98c47ced0\33951b0e-389b-4f3e-901a-6827167c86d6\scratchpad\`
(prefix `s3v-`); each one named below was read before its finding was written.

## Part 1 - the S3 fixes, measured again

| Finding (source) | Result | Measurement |
|---|---|---|
| Focus after a navigation, P B1 (4 cases) and S B3 (5 cases) | fixed | All 9 at 360 and 1180, by keyboard (Enter) and by click: focus `#main` (36 of 36). Roll result name to `/i/ci1`, «На главную» on `/s/abc123`, «Открыть таблицы» on a signed-out `/lists/<uuid>`, «показать в таблице», a `/lists` card, a `/homebrew` row, «Новый предмет», the editor crumb «Мои предметы», a source link to `/tables/homebrew/f_src-hb` |
| O 4, the editor save | not a defect | The save replaces the address (`/homebrew/new` to `/homebrew/hb_new...`), keeps the editor, and keeps the focus on «Сохранить» at 360 and 1180 (see Nit 1) |
| One scrim, P B2, S B8 | fixed | Record dialog, filter sheet, picker sheet, crop dialog: `rgba(6, 4, 12, 0.78) / none` at 360, 740, 768, 1000, 1180 |
| Crop dialog shape, S B7 | fixed | 360x640: 0-345 x 114-640, corners 14/14/0/0, no shadow; 768x1024, 1000x720, 1180x720: 560 wide, centered, 14 px corners, plate shadow (`s3v-crop-ru-360x640.png`, `s3v-crop-ru-1180x720.png`) |
| One «Ещё», P B3, S R6 | fixed up to 600 px | 57x40 RU, 61x40 EN, 6 px padding, 8 px radius on `/tables/*`, `/search`, the roll pages, `/lists`, `/lists/<uuid>`, `/homebrew` at 360 and 600. From 761 px no head «Ещё» draws on `/tables/*`, `/search`, `/lists` or `/homebrew` (pin and help are head buttons). 601-760: see Deviations |
| Import and «Выбрать», O 1, S B4 | fixed | 1920: `/lists` (10 lists) box 233-953, import 1062-1224, «Выбрать» 1232-1307; `/homebrew` box 233-953, import 1088-1250, «Выбрать» 1260-1335; 3 lists (no box): the row end (1598-1673). 1180: the same order. Import 40 px tall on both pages (`s3v-lists-tools-1920.png`, `s3v-hb-tools-1920.png`) |
| Bar pinned, S B1 | fixed | Bar bottom = window bottom at 360x640, 768x1024, 1000x720, 1180x720, 1920x1080, at scroll 0 and at the page end; the footer's last line ends above the bar top (462 < 502 at 360; 971 < 1011 at 1920) |
| Toast clears the bar | fixed | «Скрыто от игроков: 2» 26 px above the bar at all five sizes (360: toast 414-476, bar 502) |
| Toast clears the dialog dock at 360, S B2 | fixed from 481 px of height | 360x640: toast 445-489, dock 515-640; 600x800: 605-649 against 675. Under 481 px: Risk 2 |
| «Новый предмет» plus, S B5 | fixed | Plus icon at 360, 600, 768, 1180, RU and EN; 40 px up to 600, 46 px from 761 |
| Roll pill height, S B6 | fixed | 37 px with a 20.8 px line height at 768 and 1180, as the group chips (37); 40-41 px at 360 and 600 |
| Add-to-list gutter in the dialog, S B9 | fixed | 360x640: popover 16-329 in a 0-345 card (`s3v-dialog-atl-360.png`); 600x800: 16-569 in 0-585 |
| Shadow, A3 | fixed | Menu and popover `rgba(0, 0, 0, 0.85) 0px 10px 34px -14px` = `--shadow` |
| Empty owner list, A4 | fixed | `#/lists/...0102` as gm1 at 360: the sub, «Заметки», «Ещё», «Добавить свой предмет», no sentence, RU and EN (`s3v-empty-list-ru.png`) |
| No check on picker group chips, A5 | fixed | `/tables/eq_weapon` and `/tables/core_item` at 360: the pressed chip draws no icon; the tab uses `aria-current=page`; axe clean |
| Row tick, A7 | fixed | List selection mode: the input 17x17 at 360, 640, 768, 1180; axe clean at all four |
| Editor name ellipsis, A7 / S R5 | fixed | `#hb-name` with a 120-character name: `text-overflow: ellipsis` at 360, 768, 1180 (scrollWidth 927 against 273, 681, 655) |

## Part 2 - regression sweep

- The focus rule against a page that places its own focus: the 1180 mode pill keeps the focus on the lit pill; the 360
  mode link keeps it; a request toast's «Открыть» (keyboard) lands on `h2#reqpanel-h` at 360 and 1180; the list page's
  «Печать» to `/p/fp0000000001` gives `#main`; «Назад» on `/p/` gives `#main`; a row press opens the record dialog
  with the focus on «Закрыть»; Escape returns it to the row; a name link inside the dialog gives `#main`; a filter chip
  press keeps the focus on the chip; a header job link keeps it. Back and Forward give `#main` (see Nit 4).
- Toast over a sheet's foot (price sheet, «Убрать цену (3)», 7000 ms undo toast): 360x640 toast 487-549, foot 575-640;
  360x520 367-429 against 455; 360x460 307-369 against 395; at 768x1024 and 1180x720 the sheet is centered and the
  toast sits 26 px off the window bottom, under the sheet. RU and EN (`s3v-sheet-toast-ru.png`).
- Crop dialog by keyboard, RU and EN, at 360x640, 740x360, 768x1024, 1000x720, 1180x720: the stage takes the focus
  after the decode; arrows and «+» move and zoom the frame; Tab order «Меньше», the range, «Больше», «Готово»,
  «Отмена»; Escape closes it and returns the focus to «Выбрать файл»; axe clean at 360 and 1180.
- Overlays with axe, RU and EN, 360x640 and 1180x720 (19 overlay kinds on 9 routes, 62 opens): record dialog, its
  «Ещё», its add-to-list; table picker sheet; tables, search and lists head «Ещё»; supplements menu; roll result «Ещё»
  and add-to-list; account menu; `/lists` card «Ещё»; list «Ещё»; list filter sheet; list bar «Ещё»; homebrew bulk
  move; editor preview; crop dialog; print dock «Ещё». axe: zero violations in every open. EN: no Cyrillic in any
  overlay's text or `aria-label`, except the fixture list names («Лавка кузнеца», «Трофеи», «Пустой список»), which
  are data. No sideways scroll with any overlay open. The price sheet was measured (toast, foot) but not run through
  axe.
- The 768 and 1000 matrix cells (RU): `/lists`, `/lists/<uuid>`, `/s/<token>`, `/homebrew` Items and Sets,
  `/tables/eq_weapon`, `/search`, `/roll/std`, `/account`, `/p/<id>`. Pin and help are head buttons; the primary ends
  the head row; «Выбрать» is the last control of the tool row on `/tables/*`, `/s/` and `/lists/<uuid>` at both widths;
  the import is the last control before «Выбрать» on `/lists` and Items, 40 px tall; the Sets tab's head «Новый
  предмет» at 1000 is the hidden reserve (`visibility: hidden`, PW-2b). No departure that the specs do not name.
- Limits: `/lists` with 50 lists at 360 and 1180: «50 списков из 50»; «Новый список» toasts the limit (360: 408-497)
  above the bar (523); at the page end the footer ends above the bar. `/homebrew?items=100` with all ticked: 100 rows,
  «100 предметов из 100», bar 523-640 at 360, no sideways scroll.
- Error paths with the fixed bar: `setFault(true)` and «Скрыть от игроков (1)»: «Не сохранено» and «Повторить» at
  193-233 (360) and 185-209 (1180), clear of the bar; the undo toast above the bar. A stale tab (`playRemove` of the
  ticked, focused row): Risk 3.

## Blockers

None.

## Risks

1. Not blocking, `local`. Two «Ещё» menus at 360 px reach the edge of the window or the sheet; every sibling menu keeps
   the 16 px gutter. The record dialog's dock «Ещё»: menu 106-345 under a button that ends at 329, in a 0-345 card
   (`s3v-menu-record-360.png`). The owner list page's «Ещё»: menu 125-345, its offset parent is `body`
   (`s3v-menu-list-360.png`). The `/tables` head «Ещё» (109-329, `s3v-menu-tables-360.png`), the `/search` and `/lists`
   head «Ещё», the roll result «Ещё», the bar «Ещё» and the dialog's add-to-list popover (16-329) keep it. Same class
   as S B9, which S3 fixed for the popover only. Cause: `app/src/components/RecordModal.svelte:272-278` insets
   `.cardpick .dropmenu` but not the dock's `.recmenu`; `app/src/components/MoreMenu.svelte:109-113` makes the wrap
   static up to 760 px, and `ListPage.svelte` `.lhead-acts` (line 2678) gives the menu no positioned row. Request: inset
   the dock menu 16 px as the popover (`right: 16px`), and make `.lhead-acts` (or `.lhead`) `position: relative` up to
   760 px, as `TablesPage` `.pickrow` does. On a phone with overlay scrollbars the edge is the screen edge.
2. Not blocking, `local`. Under 481 px of height the dialog's toast covers the record dialog's dock: 740x360 toast
   290-334 over the dock 244-344; 360x460 toast 390-434 over 344-444 («Печать» and «Ещё», 4000 ms, an undo 7000 ms).
   The handoff names it (Deviation 3), but FEATURES.md "Chrome" and DESIGN.md "Toast" say "inside a modal up to 760 px,
   26 px above the record dialog's dock" with no height exception, and `docs/specs/DEBT.md` has no entry. Cause:
   `app/src/components/Toast.svelte:235` (`min-height: 481px`). Request: either lift the dialog copy by `--dock-h` at
   every height, as the sheet rule at `Toast.svelte:243-247` does (the dock sits at the scroll's end, so the toast then
   clears it where it shows), or name the exception in FEATURES.md and DESIGN.md and add a DEBT.md entry.
3. Not blocking, `deferred-scope`, not caused by S3. A stale tab: another device removes the ticked row that holds the
   focus (`playRemove`); the bar reads «Выбрано 0 позиций» and the focus falls to `body` at 360 and 1180. Rule 20 covers
   a control that removes itself; a remote removal has no rule. Recommended: a DEBT.md entry for `57-debt`.

## Nits

1. `local`. FEATURES.md rule 20 lists "the editor's save that opens the item page" as a `#main` case. The save
   replaces the address and keeps the editor mounted (`App.svelte` `{#key app.navigations}` comment), so the focus
   stays on «Сохранить» (measured at 360 and 1180). Remove the case from the sentence, or say "keeps «Сохранить»".
2. `local`. The `/lists` tool group spaces its controls 8 px (count to import, import to «Выбрать»: 1224 to 1232 at
   1920, 1007 to 1015 at 1180); «Мои предметы» spaces them 10 px (1250 to 1260, 1033 to 1043). The order and the place
   now match; the gap is the last difference (`ListsPage.svelte` `.end`).
3. `deferred-scope`, not caused by S3. An in-app navigation keeps the old scroll offset, cut to the new page's
   height: from `/tables/core_item` at y 1139 (360x720) a record link opens `/i/ci13` at y 190 (its maximum) and a
   header job opens `/search` at y 39. No spec line says where a new page opens. With the new rule the focus sits on
   `#main` above the viewport (`preventScroll`). A question for the owner, not a defect against the specs.
4. `deferred-scope`. After Back the focus is on `#main` and the scroll is restored (1139 at 360, 929 at 1180); the first
   Tab goes to the first control of `main` and scrolls to y 0. Before S3 the focus was on `body`, and Tab started at
   the top of the document, so this is no regression. A later improvement: on Back, return the focus to the row that
   was opened.
5. `deferred-scope`, not caused by S3. The crop dialog at 740x360 needs a scroll inside it to reach «Готово» (the
   button ends at 451 in a 360 px window; the stage is `min(100%, 70dvh)`, `CropDialog.svelte:365`). DESIGN.md
   "Sheet" says it keeps the window's height "which its square stage needs on a landscape phone"; the stage still
   overflows there. At 1000x720 and 1180x720 the dialog fills the window from 0 to 720 with its corners on the window
   edges, unlike the sheet's `min(85dvh, 640px)` cap; the departure is named.

## Deviations

1. Up to 600 px the compact «Ещё» padding applies to every `MoreMenu` caller: accepted (one look, measured above).
2. 601-760 px «Ещё» heights: accepted, but the handoff names two of three. Measured at 640 and 700: 40 px in the
   picker rows (`/tables/*`, `/homebrew`), 32 px in the heads with no picker (`/search`, `/lists`, `/lists/<uuid>`),
   28 px on the roll pages, where «Ещё» sits in the results line beside «Настроить» (28 px). The third is a different
   row (`s3v-more-__roll_std-640.png`); no action.
3. The record dialog's toast clears the dock only from 481 px of height: not accepted as written (Risk 2: the specs
   say otherwise and DEBT.md has no entry).
4. Prod N2 (the roll result name's `title`) in Deferred: accepted.

## Standing checks

1. Scale: checked - `/lists` at the 50-list limit at 360 and 1180 (the refusal toast above the bar, the footer clear
   at the page end), `/homebrew?items=100` all ticked at 360 and 1180, the price sheet with 3 ticked rows at 360x460 to
   1180x720. A popup taller than the window: the crop dialog at 740x360 (Nit 5). 3x the defaults not probed: S3 adds
   no collection or cap.
2. Error scenarios: checked - a faulted list write (`setFault`) with the fixed bar: «Не сохранено» and «Повторить» in
   view, the undo toast above the bar; a stale tab's remote removal (Risk 3). S3 changes no write path or stored shape.
   Not probed: the conflict answer of `apply`, a deleted record that a list names, the two-tab merge (no S3 file).
3. Consistency: checked - FEATURES.md "Consistency rules" 8, 9, 11, 20; DESIGN.md "Sheet", "Selection bar", "Toast",
   "The Check Rule", "The Whole Message Rule"; the 768 and 1000 matrix cells; the «Ещё» box at 360-1180; 19 overlay
   kinds at 360 and 1180. Departures: Risk 1, Risk 2, Nit 2.
4. RU/EN parity: checked - S3 adds no string; `listEmptyHint` and `listEmptyHintOwn` are gone in both languages
   (`i18n.test.ts` GONE); every overlay in EN at 360 and 1180 holds no Russian UI text; the crop dialog's labels in EN
   ("Zoom out", "Frame: drag it or move it with the arrow keys").

Owner rules: checked - `context.md` "Owner decisions of the 2026-11-06 session" (consistency first, the matrix and the
overlay inventory, CI-first) and the AFK defaults A1-A8 that the handoff cites: A1 option B (the tool group follows
the box) measured; A3-A5 and A7 measured fixed; A6 and A8 are DEBT.md D132-D135, present.

## Suggested next action

Approve S3. With the closeout's one fix pass, send the `local` items to the writer: Risk 1 (inset the dock «Ещё» menu
16 px and give the list head's «Ещё» a positioned row up to 760 px), Risk 2 (the toast offset at every height, or the
named exception with a DEBT.md entry), Nits 1 and 2. File Risk 3 and Nits 3-5 for `57-debt` (DEBT.md or the owner
list). Then the CI credit of the fix tip and the squash.

## Checks still needed

- CI's green run of `cf472814` (the full gate: goldens, the sweeps at 768 and 1180, the detector); this review ran no
  npm script.
- Risk 1 on a phone with overlay scrollbars (the menu then meets the screen edge at 360, not 345).
- axe on the list price sheet with its undo toast shown.
- The `apply` conflict answer, a deleted record named by a list, and the two-tab merge with the selection bar open.
- Production after the squash: the four whole-app review probes once more (signed out and in the owner's Chrome).
