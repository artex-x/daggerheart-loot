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

All figures are at 360x640 unless stated. D133 is the shared page's bar; D137 to D139 are focus
and scroll rules.

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
