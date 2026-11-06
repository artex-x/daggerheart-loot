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

## Phone overlays and scroll (the follow-up task of task 57)

All figures are at 360x640 unless stated. Task 57 measured each one and built no fix: the
four share one cause family (a menu, a focus return or a toast that moves or covers the page
under the hide-and-show header), and one batch with mobile probes fixes them together.

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

### D125 - `/search` at 320x568 scrolls sideways after the kind sheet closes

- **Where**: `app/src/components/SearchPage.svelte`, `Shell.svelte` (the header's job links).
- **What**: in Russian at 320x568, after a kind is picked in the sheet and the sheet closes,
  `scrollWidth` is 313 against a `clientWidth` of 305; hiding one element at a time points at
  the header's job links (measured in the batch 7 remediation, not probed again).
- **Why deferred**: found by a probe outside its batch's routes; 320 px is the narrowest
  width a page is built for, and no device class of the users is that narrow.
- **How to verify the fix**: `tests/app/states.js` case 93 at 320x568 RU reads no sideways
  scroll after the sheet closes, as it does before the sheet opens.

### D126 - the record dialog's dock is out of view on a short wide window

- **Where**: `app/src/components/RecordCard.svelte` (the dialog's sticky dock inside
  `.card-body`).
- **What**: from 500 to 760 px wide and 481 to 560 px tall, a 4:3 picture can fill the card,
  so «В список» and the dock are not in view until a scroll. No phone portrait reaches the band.
- **Why deferred**: sticky holds only inside `.card-body`; the fix is a layout change of the
  dialog in that band.
- **How to verify the fix**: a states case at 600x500 and 760x560 opens the dialog of a
  record with a picture: the dock's bottom is inside the viewport at scroll 0.

## Visual leftovers (the follow-up task of task 57, mock first)

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
