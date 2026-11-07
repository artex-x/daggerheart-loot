# DEBT.md - defects kept on purpose, owed to a named task

A live defect the app ships on purpose, with the task that owes its fix. Each
entry reads **Where** / **What** / **Why deferred** / **How to verify the
fix**, is written in the batch that decides to defer it, and is deleted by
the batch that pays it. Sections are the tasks that owe the entries; a
section with no entry left is deleted. A kept design is a decision
(`docs/decisions/`), not an entry; a refactor question with no
user-visible defect does not belong here. Why this file is the home:
`docs/DECISIONS.md`, "Kept defects live in `docs/specs/DEBT.md`, grouped by
the task that owes them".

## Phone overlays and scroll (task `57-debt`)

All figures are at 360x640 unless stated. Task 57 measured each one and built no fix. D122
to D124 share one cause family (a menu, a focus return or a toast that moves or covers the
page under the hide-and-show header), and one batch with mobile probes fixes them together.
D125 is a sideways overflow and D126 is a dialog layout; the same batch takes them. D136
and D140 are two more short-window layouts; D137 to D139 are focus and scroll rules.

### D122 - a focus on a header control moves the page up

- **Where**: `app/src/components/Shell.svelte` and `Menu.svelte`, the focus calls of the
  header's controls.
- **What**: a `focus()` on a header control scrolls the page up: from scroll 1500 to 1199 at
  320 px, to 1115 at 1180 px, and from 900 to 558 at 360 px (measured 2026-11-03). The upward
  move shows the hidden header, so the hide is not harmed, but the reader loses the place.
- **Why deferred**: `{ preventScroll: true }` fits only a control always in view, and `Menu`
  also serves controls that scroll away; the fix needs its own probe set.
- **How to verify the fix**: a `tests/app/states.js` case that scrolls a long page to 1500 px
  at 320, 360 and 1180 px, moves the focus to a header control, and reads the same `scrollY`.

### D123 - a closed «Ещё» leaves the page scrolled under the shown header

- **Where**: `app/src/components/ListPage.svelte` (the list «Ещё»), `PrintPage.svelte` (the
  dock «Ещё»), `MoreMenu.svelte`.
- **What**: on `LIST_A ~ noted as gm4`, RU, the list «Ещё» sits at top 136.4 at scroll 0; its
  menu opens with the page at scroll 87 and «Ещё» at 49.4, under the shown header (0 to
  110.4). Escape returns the page to scroll 0; a tap outside leaves scroll 87 with «Ещё»
  covered, so the next press lands on the job row (measured 2026-11-06). On `/p/` with the dock
  «Ещё» open the page sits about 24 px down and the header covers part of the crumb row.
- **Why deferred**: the same family as D122; a `preventScroll` focus return cannot cure the
  tap path, where no focus returns.
- **How to verify the fix**: the probe above (open «Ещё», close by Escape, then by a tap
  outside, read `scrollY` and the top of «Ещё») in RU and EN: «Ещё» is not under the header
  after either close.

### D124 - a toast covers the end of an open «Ещё»

- **Where**: `app/src/components/Toast.svelte` and every `Menu` that opens up to 760 px.
- **What**: at 360 px a 4000 ms toast's top is at 570 px while the last item of a roll
  result's open «Ещё» ends at 625 px: 4829 px² of overlap in RU, 3405 px² in EN, for the
  toast's whole time (7000 or 10000 ms for an action, an error or a long toast). It also covers
  the end of the add-to-list popover. A second save by touch waits for the toast.
- **Why deferred**: task 57 decided no bottom sheet for these menus; placing the toast above
  an open menu needs the menu's geometry in the toast's rule.
- **How to verify the fix**: `tests/app/states.js` case 108 (f) asserts no overlap between the
  toast and an open menu at 360 px, RU and EN.

### D125 - the Russian header tabs are wider than the page at 320 px with a classic scrollbar

- **Where**: `app/src/components/TabBar.svelte` (`nav.tabs`, the header's job links).
- **What**: in Russian at a 320 px window the tab bar is 297.2 px wide and ends at 313.2 px,
  while `scrollbar-gutter: stable` leaves the body 305 px. The bar reaches 8.2 px into the
  gutter on every route, before and after the `/search` kind sheet; English ends at 289.
  Where the scrollbar takes width (a desktop window with classic scrollbars), the page
  scrolls 8 px sideways. A phone's overlay scrollbar takes no width (measured 2026-11-06).
- **Why deferred**: only a desktop window narrowed to 320 px with classic scrollbars shows
  it; a 320 px phone draws the bar inside the page.
- **How to verify the fix**: at 320x568 RU on `#/search` and `#/roll/std`, the right edge
  of `nav.tabs` is not past `document.body`'s right edge (305 px).

### D126 - the record dialog's dock is out of view on a short wide window

- **Where**: `app/src/components/RecordCard.svelte` (the dialog's sticky dock inside
  `.card-body`).
- **What**: from 500 to 760 px wide and 481 to 560 px tall, a 4:3 picture can fill the card,
  so «В список» and the dock are not in view until a scroll. No phone portrait reaches the band.
- **Why deferred**: sticky holds only inside `.card-body`; the fix is a layout change of the
  dialog in that band.
- **How to verify the fix**: a states case at 600x500 and 760x560 opens the dialog of a
  record with a picture: the dock's bottom is inside the viewport at scroll 0.

### D132 - the record dialog's «Ещё» scrolls the dossier on a short wide window

- **Where**: `app/src/components/Menu.svelte` (`place`, the `flip` rule), in `RecordModal`.
- **What**: at 1000x720 and 1180x720, for a short record, the 264 px menu fits neither under
  «Ещё» nor above it inside the card, so it stays down and the focus on its first item scrolls
  the card about 30 px: the picture's top and the badge row are cut (measured 2026-11-06 on
  production, signed out).
- **Why deferred**: FEATURES.md "Records" names only the two places; a menu with room in
  neither needs a third rule (open outside the card, or grow the card), a layout decision.
- **How to verify the fix**: a states case opens `#/tables/core_item/ci1` at 1000x720 and
  1180x720, opens «Ещё» and reads the card's `scrollTop` unchanged and the menu inside the
  window.
- **Same class, owner-seen 2026-11-07 (screenshot)**: the add-to-list popover «В список» in the
  record dialog (`AddToList.svelte`, its `placeMenu` and `up` rule) opens upward inside the card
  on a short card, and the card's edge crops its top: the search field and the first rows are
  cut. Fix both overlays together, not one rule each: the menu and the popover render in the
  top layer or a portal outside the card's clip, are placed by the window, take focus with
  `preventScroll`, and never scroll or move the card. Add the popover case to the states case
  (open «В список» on the same record at 1000x720 and 1180x720: its search field is in the
  window and the card's `scrollTop` is unchanged).

### D133 - the shared page's selection bar takes a third of a phone

- **Where**: `app/src/components/SelBar.svelte` on `/s/<token>` up to 760 px.
- **What**: at 360x640 the bar is 212 px tall: «Все», then «В список» on its own line,
  «Печать» and «Скопировать текст», then «Сообщить владельцу» on its own line; the
  add-to-list popover above it reaches up to 324 px. The owner's list page folds its rare
  actions into «Ещё» and stays at 137 px (measured 2026-11-06).
- **Why deferred**: DESIGN.md folds only the owner's page; which actions of the player's page
  fold is a layout decision for the owner (The Phone-First Rule).
- **How to verify the fix**: at 360x640, RU and EN, `#/s/player-token-1 ~ selecting` draws a
  bar no taller than the owner's page's (137 px), every action still reachable.

### D136 - the record dialog's toast covers the dock under 481 px of height

- **Where**: `app/src/components/Toast.svelte` (the `min-height: 481px` rule of the dialog
  copy), `RecordModal.svelte` (the dock that joins the scroll).
- **What**: under 481 px of window height the dock moves with the card, and the dialog's toast
  keeps its 26 px off the window bottom: at 740x360 the toast (290 to 334 px) covers the dock
  (244 to 344 px), and at 360x460 it covers 344 to 444 px, with «Печать» and «Ещё» under it for
  4000 ms (7000 ms for an undo; measured 2026-11-07).
- **Why deferred**: the dock is not at a fixed place there, so a lift by `--dock-h` would
  float the toast above empty card; a short phone in landscape is the only window it shows in.
- **How to verify the fix**: a states case at 740x360 and 360x460 presses the first «Ещё» item
  of an open record and reads the toast's bottom at or above the dock's top, or the dock out of
  view.

### D137 - another device removes the ticked row that holds the focus

- **Where**: `app/src/components/ListPage.svelte` and `HomebrewPage.svelte`, the selection mode
  with a live list (`playRemove` in the fake cloud).
- **What**: while a row is ticked and focused, another device removes it; the bar reads
  «Выбрано 0 позиций» and the focus falls to `body` at 360 and 1180 px (measured 2026-11-07).
  FEATURES.md "Consistency rules", rule 20, covers a control that removes itself, not a
  removal by a remote write.
- **Why deferred**: it needs a new rule for the place of the focus after a remote removal.
- **How to verify the fix**: a states case ticks and focuses a row, plays the remote removal,
  and reads the focus on a control of the list (the next row or the bar's clear control).

### D138 - an in-app navigation keeps the old scroll offset

- **Where**: `app/src/App.svelte` (the page swap), `app/src/ports/`'s scroll handling.
- **What**: the new page opens at the old offset, cut to its own height: from
  `/tables/core_item` at y 1139 (360x720) a record link opens `/i/ci13` at y 190, its
  maximum, and a header job opens `/search` at y 39. With the focus on `#main` above the
  viewport (`preventScroll`), the reader lands in the middle or at the end of the page
  (measured 2026-11-07). No spec line says where a new page opens.
- **Why deferred**: the place of a new page (top, or the restored offset on Back only) is the
  owner's decision.
- **How to verify the fix**: a states case scrolls `/tables/core_item` to 1139 and follows a
  record link, then reads `scrollY` 0 (or the spec's value) on the new page.

### D139 - after Back the focus is on `#main` while the scroll is restored

- **Where**: `app/src/App.svelte` (the focus after a navigation), `ports/` history handling.
- **What**: after Back the focus is on `#main` and the scroll returns to 1139 at 360 px (929 at
  1180 px); the first Tab goes to the first control of `main` and scrolls the page to y 0
  (measured 2026-11-07). Before commit `f883e6fc` the focus was on `body` and Tab started at the
  top of the document, so it is no regression.
- **Why deferred**: the better place is the row that opened the page, which needs the row's
  key kept across the navigation.
- **How to verify the fix**: a states case opens a record from a catalog row, presses Back, and
  reads the focus on that row with `scrollY` unchanged.

### D140 - the crop dialog needs a scroll to reach «Готово» at 740x360

- **Where**: `app/src/components/CropDialog.svelte` (the stage `min(100%, 70dvh)`).
- **What**: at 740x360 «Готово» ends at 451 px in a 360 px window, so the dialog scrolls
  inside itself to reach it. DESIGN.md "Sheet" says the dialog keeps the window's height "which
  its square stage needs on a landscape phone"; the stage still overflows there (measured
  2026-11-07). At 360x640, 768x1024, 1000x720 and 1180x720 the buttons are in view.
- **Why deferred**: a landscape phone is the only window it shows in; the fix is a layout
  choice (a smaller stage, or the buttons beside it).
- **How to verify the fix**: at 740x360 RU and EN the crop dialog's «Готово» is inside the
  window with no scroll in the dialog.

### D141 - the filter column's last section is below the fold until the page scrolls

- **Where**: `app/src/components/FilterPanel.svelte` (`.fcol`: `position: sticky`, `top: var(--anchor-top)`,
  `max-height: calc(100dvh - var(--anchor-top) - var(--selbar-h, 0px) - 16px)`, `overflow: auto`,
  `overscroll-behavior: contain`), on `/tables/*`, `/search` and the lists' filters from 1000 px.
- **What**: owner-seen 2026-11-07 (screenshot, `#/tables/eq_weapon`, RU, about 1920x950). The cap fits the
  window only when the column is stuck. At page top the column starts at about 247 px, not at the sticky top
  of about 79 px, so its bottom is about 168 px below the fold; scrolled to its end, the inner scroll still
  hides the last section («Улучшаемое» / «Уникальное»), and `overscroll-behavior: contain` stops the wheel from
  passing to the page, so the reader must move the pointer off the column to scroll the page.
- **Why deferred**: not yet planned; two fixes, a layout choice.
- **Default fix (owner may change)**: A, remove `overscroll-behavior: contain` on the desktop column so the wheel
  continues to the page at the ends (the column then sticks and shows its full height); and B, make the cap
  follow the column's real top while it is unstuck (a measured custom property such as `--fcol-top`, updated on
  scroll and resize, `max-height: calc(100dvh - max(var(--anchor-top), var(--fcol-top)) - ...)`), so the last
  section is in the window at scroll 0 with no page scroll. Check the phone sheet (it is not this column) is unchanged.
- **How to verify the fix**: a states case opens `#/tables/eq_weapon` at 1920x950 and 1180x720, scrolls the
  column to its end and reads the last section's bottom inside the window at page scroll 0; the column's bottom
  never extends past the window while the page scrolls.

## Copy and prompt leftovers (task `57-debt`, owner first)

### D134 - four shapes of the sign-in prompt on sibling pages

- **Where**: `ListsPage.svelte` (the empty plate with the glyph), `HomebrewPage.svelte` and
  the `/tables/homebrew` page (a bare line and «Войти»), `ListPage.svelte` signed out (the
  error page with two actions).
- **What**: signed out, `/lists`, `/homebrew`, `/tables/homebrew` and `/lists/<uuid>` draw
  the same prompt in four shapes; each is named in FEATURES.md, none with a reason for the
  difference (production review, 2026-11-06).
- **Why deferred**: one shape changes four page layouts and their first screens; the owner
  picks the shape (AFK default A6, 2026-11-06).
- **How to verify the fix**: one `SignInPrompt` shape on the four routes at 360 and 1180 px,
  RU and EN; case 83's rows for them unchanged or lower.

### D135 - the signed-out list page repeats its heading as an instruction

- **Where**: `app/src/lib/dict.ts` (the lead of the signed-out `/lists/<uuid>` page),
  FEATURES.md "Lists".
- **What**: the lead ends «Войдите в него.», which repeats the heading «Войдите, чтобы
  открыть список» and the «Войти» button (DESIGN.md, "The Clarity Rule").
- **Why deferred**: the sentence is FEATURES.md text, so its removal is a spec change for
  the owner (AFK default A8, 2026-11-06).
- **How to verify the fix**: the lead holds no instruction in RU and EN; the golden of the
  signed-out list page re-seeded, one line.

## Visual leftovers (task `57-debt`, mock first)

### D127 - a wide table row with a short description stays half empty

- **Where**: `app/src/components/TableRows.svelte`, `RowMain.svelte` on `/tables/eq_*`.
- **What**: from 1440 px a weapon or armor row draws its stats as a sentence, so a row with a
  short description leaves most of its width empty (a 1440 px `/search` row was 54% empty
  before The Row Text Rule, measured 2026-11-05).
- **Why deferred**: the owner asked for tabular stat columns "later", with a mock first
  (2026-11-05); DESIGN.md "Proposed rules", The Stat Columns Rule, holds the draft.
- **How to verify the fix**: the Stat Columns Rule's check: a states case at 1440 and 1920 px
  on `#/tables/eq_weapon` and `eq_armor`, the column edges equal within 1 px in every row, the
  labels in RU and EN, case 106's clamp share not higher.

### D128 - a roll page's picker cuts a long chosen part on a phone

- **Where**: `app/src/components/RollPanel.svelte` and `RollSelect.svelte` (`.rp-ctrl` up to
  760 px).
- **What**: the picker and the roll button keep one line, so a long chosen part is cut with
  an ellipsis: «Проклятые предметы» needs 31 px more at 360 px and 1 px at 390 px, «Оплот
  Шершней» 3 px at 360 px, in Russian; English is not cut (measured 2026-11-06). The select
  shows the whole name. DESIGN.md "The Whole Message Rule" names the cut.
- **Why deferred**: a narrower frame (12 and 8 px of padding, a 6 px gap) gives back about
  8 px, which cures two of the three cuts and not the 31 px one; a shorter roll label needs the
  owner (The Same Label Rule).
- **How to verify the fix**: at 360 and 390 px, RU and EN, every option of the three picker
  pages draws with `scrollWidth` equal to `clientWidth`, and case 89's first result stays
  within 256 px.

### D129 - two target exceptions and a raised first-screen figure

- **Where**: `tests/app/sweep.js` `TARGET_ALLOW` (`.craft a`, the relation fold), DESIGN.md
  "The Phone-First Rule" and "The First-Screen Rule".
- **What**: the links of a craft or relation line («Улучшается до», «Получается из») count
  as links in a sentence and are under 24 px; from 601 px the fold «и ещё N» keeps the line's
  height. `/s/<token>` at 360x640 starts its first entry at 309 px, past the 256 px rule
  (286, then 302, then 309 as the controls grew); no spacing fold was tried.
- **Why deferred**: a 24 px box on those lines comes closer than 2 px to a badge on the line
  above; the `/s/` head needs its own layout pass.
- **How to verify the fix**: `TARGET_ALLOW` holds neither entry and `sweep.js` is clean at
  360, 390, 768 and 1180 px; the `/s/` `FIRST_SCREEN` rows assert 256 px with no exception.

### D130 - the record page names the roll number with two terms

- **Where**: `app/src/lib/dict.ts` `rollNo`, `tools/share-card.mjs`, the generated share
  stubs `i/*.html`.
- **What**: the item page's meta line reads «номер 1» in Russian and "roll 1" in English,
  where `/search` writes «№ 89» and "No. 89".
- **Why deferred**: the word is copied into about 1000 generated share stubs; the change
  rewrites them and needs its own plan review.
- **How to verify the fix**: «№» and "No." in both places; `node tools/build.js` regenerates
  the stubs; `app/contracts` (the stub subtitle equals the heading line) passes.

### D131 - two compact color print cards print their rules text under the floor

- **Where**: `app/src/components/PrintCard.svelte` (`SHORTFALL`), on the RU compact color
  sheet.
- **What**: `voa4_t4i` and `voa4_a3` print their rules text at 3.4cqw (4.2 pt), under the
  compact floor of 3.7cqw, so their burden and tier marks clear the tags and the name
  (`FEATURES.md`, "Print").
- **Why deferred**: at the floor the text overruns the card, and a smaller mark or a cut text
  changes the Figma layout.
- **How to verify the fix**: `tests/app/print.js` on the RU compact color
  sheet reads no `.pc-text` under 3.7cqw and no mark over a tag or the name.
