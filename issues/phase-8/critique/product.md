# Phase 8 - product critique of the shipped app

Read-only pass over `app/src/**`, `tests/app/snapshots/` (the 110 structural
goldens are accessibility trees, so several findings below are quoted straight
out of them) and the deployed `https://artex-x.github.io/daggerheart-loot/`.
Scope: user-facing behaviour and polish that is **not** already in
`docs/specs/DEBT.md` D1-D23. No entry below re-litigates one of those.

Ranked by user impact per unit of effort. "Moves goldens" means the named
snapshot files under `tests/app/snapshots/` have to be re-recorded; where it
says none, the change is invisible to them.

## Worth doing

### P1 - the skip link throws the reader off the page they were on

- **Where**: `app/src/components/Shell.svelte:32` `<a class="skip" href="#main">`,
  against `app/src/state/app.svelte.ts:229-234` (`#fallback`) and
  `app/src/lib/hash.ts:116` (`return { kind: 'unknown' }`).
- **What a user experiences**: the skip link is the first control on every
  page - every golden's second line is `link "К содержимому" [url=#main]`.
  Activating it assigns `location.hash = '#main'`; `hashchange` fires,
  `parseHash('#main')` strips to `main`, matches no route and returns
  `unknown`, so `#fallback` runs `router.replace(this.#home)` and returns the
  pinned section. `navigations++` then clears `sel` and `menuFor`. From
  `#/tables/eq_weapon`, `#/lists/<id>`, `#/i/<id>` or a shared
  `#/l/<payload>`, pressing "skip to content" lands you on `#/roll/std`.
  Back recovers it, because the link's own history entry was pushed before
  `replaceState` overwrote it - so the damage is recoverable but total.
- **Why it matters**: it is the one affordance in the app that exists purely
  for keyboard and screen-reader users, and for them it is a trapdoor. It is
  also the cheapest fix on this list.
- **Smallest fix**: `main` already carries `id="main" tabindex="-1"`
  (`Shell.svelte:61`), so the link only has to stop being a fragment
  navigation: an `onclick` that calls `preventDefault()` and focuses `#main`
  directly, keeping the `href` for semantics. (Alternative, if the hash must
  stay: make `#fallback` return `this.hash` unchanged for a fragment that is
  not a route. That silently weakens the unknown-address rule, so the Shell
  fix is better.)
- **Effort/value**: ~5 lines plus a `shell.test.ts` case. Highest value here.
- **Goldens**: none - no rendered attribute changes.

### P2 - every row checkbox in every table is called "Выбрано"

- **Where**: `app/src/components/TableRows.svelte:122` and `:154`,
  `aria-label={t.selected}`.
- **What a user experiences**: `tests/app/snapshots/_tables_a_row_ticked.txt:46-52`
  shows the result - sixty consecutive `checkbox "Выбрано"` nodes, so alike
  that the snapshot writer elides them as "same-shape siblings". A screen
  reader walking the form controls of `#/tables/eq_weapon` hears "Выбрано,
  флажок" 317 times with nothing to tell one row from another. The word is
  also the wrong part of speech for a control that is mostly not checked, and
  it is the same string as the selection bar's count prefix
  (`StaticText "Выбрано 1"`, same file, line 60).
- **Why it matters**: the record's name is already rendered one node away; the
  label throws it away.
- **Smallest fix**: name it off `nameOf(it, lang)` - already imported at
  `TableRows.svelte:24`. While there, settle the term: the list page names the
  same control `t.pickRow` ("Выбрать позицию" / "Select entry",
  `ListPage.svelte:804`), so the two screens disagree about what ticking a row
  is called.
- **Effort/value**: one line; high value.
- **Goldens**: every `_tables_*` and `_l_shared*` snapshot with rows.

### P3 - the record modal is announced as "Закрыть"

- **Where**: `app/src/components/RecordModal.svelte:79`
  `<dialog aria-label={app.t.close}>`; the close button inside it carries the
  identical name at `:92`.
- **What a user experiences**: `tests/app/snapshots/_roll_wondrous_modal.txt:7`
  reads `dialog "Закрыть" [modal=true]` (and `:57` `dialog "Close"`). Opening
  a record card announces "Закрыть, диалог" - the name describes the button in
  the corner, not the thing the dialog contains, and then that button
  announces itself with the same word.
- **Why it matters**: the native dialog is a deliberate a11y improvement over
  the live app (`FEATURES.md`, "Records"); its accessible name undoes part of
  that.
- **Smallest fix**: name the dialog for the record - `aria-label` off
  `nameOf(it, app.lang)`, or `aria-labelledby` pointing at the card's own name
  node.
- **Effort/value**: one line; high value.
- **Goldens**: `_roll_wondrous_modal`, `_tables_a_row_opened`,
  `_tables_a_row_opened_list_menu`, `_tables_a_row_opened_new_list`,
  `_i_q1_another_tier` - five files.

### P4 - the add-to-list menu cannot be entered by Tab and cannot be closed by Escape

- **Where**: `app/src/components/AddToList.svelte:232-290` - the `.dropmenu`
  block is rendered before the toggle `<Button>` in the DOM; no `keydown`
  handler exists in the component, and `App.svelte` has no global one either.
- **What a user experiences**: pressing the toggle opens the menu; pressing Tab
  moves past it to the next control, because the menu sits earlier in the
  document. Shift+Tab is the only way in, which nobody guesses. Once in,
  Escape does nothing outside a modal; inside the record modal Escape closes
  the whole dialog and the record with it, rather than just the menu.
- **Why it matters**: "add this to a list" is the app's main verb, and this
  menu is its only entry point from a card, the selection bar and the shared
  page.
- **Smallest fix**: two independent halves, take either or both.
  (a) `onkeydown` on the `.seldrop` root: Escape clears `app.menuFor` and
  `newListFor`, refocuses the toggle, and stops propagation so the surrounding
  dialog does not also close. No goldens move.
  (b) Put `.dropmenu` after the `<Button>` in the DOM. `.seldrop` is
  `position: relative` and `.dropmenu` is absolutely positioned, so the paint
  is identical - but tree order changes, so `_i_ci1_list_menu`,
  `_i_ci1_new_list`, `_i_ci1_many_lists`, `_tables_bar_menu`,
  `_tables_a_row_opened_list_menu` and `_tables_a_row_opened_new_list`
  re-record. Focusing the first chip on open is the no-golden alternative.
- **Effort/value**: small for (a); high value.

### P5 - deleting a list is confirmed, then silent, and cannot be undone

- **Where**: `app/src/components/ListsPage.svelte:72-75` and
  `app/src/components/ListPage.svelte:210-216` - `dialog.confirm(...)` then
  `store.remove(l.id)`, no toast; `app/src/state/lists.svelte.ts:142-146`
  records the id in `#deleted` for good.
- **What a user experiences**: the card vanishes and nothing says so. The
  inconsistency is the finding: removing one row from a list toasts with an
  undo (`ListPage.svelte:292-306`), a batch delete toasts with an undo
  (`:440-458`), clearing a note toasts with an undo (`:253-272`), repricing
  and clearing prices both toast with an undo - but deleting the entire list,
  the only irreversible action in the app, toasts nothing at all. Removing a
  record through the add-to-list menu's tick chip (`AddToList.svelte:81-84`)
  is the other half: it toasts `removedFrom` with no undo, where the same
  removal from the list page has one.
- **Why it matters**: `META.md` section 3 is explicit that a lost list is lost
  - there is no server to recover it from - and the one action that loses one
  has the weakest feedback in the app.
- **Smallest fix**: a toast after `store.remove` (a new dict key pair; there is
  none for "list deleted" today). The fuller fix - a 7 s undo that un-sets
  `#deleted[id]` and splices the list back at its index - is still small and
  stays inside `ListStore`, but it touches the two-tab merge contract in
  `STATE.md`, so it needs the owner's word.
- **Goldens**: none (no delete state is photographed).

### P6 - three text inputs are named by their example value, not by their caption

- **Where**: `app/src/components/ListsPage.svelte:114-119` and `:127`;
  `app/src/components/AddToList.svelte:265-273`. The captions above them come
  from `Field.svelte:24`, which renders `<span class="lbl">` - not a
  `<label>`, and with no `for`/`id` pair.
- **What a user experiences**: `tests/app/snapshots/_lists.txt:31-36`:
  `StaticText "НОВЫЙ СПИСОК"`, then `textbox "Например: клад дракона"`;
  `StaticText "ВОССТАНОВИТЬ ИЗ ССЫЛКИ"`, then `textbox "Ссылка на список"`.
  The accessible name of the create-a-list field is an example of what to type
  into it. `_i_ci1_new_list.txt:40` is the same shape inside the menu.
- **Smallest fix**: an `aria-label` off `t.newList` / `t.importList` /
  `t.newList` on the three inputs. Making `Field` emit a real `<label>` fixes
  the class of problem but reaches every panel on every roll page; not worth it
  unless the planner wants it.
- **Goldens**: `_lists`, `_lists_created`, `_lists_two_lists`,
  `_lists_notice_*`, `_i_ci1_new_list`, `_tables_a_row_opened_new_list`.

### P7 - search caps at 300 results and never says so

- **Where**: `app/src/components/SearchPage.svelte:53-59`, `.slice(0, 300)`.
- **What a user experiences**: a broad query - a single letter, a common word -
  returns exactly 300 rows and stops. Nothing on screen distinguishes "these
  are all the matches" from "these are the first 300 of 900". The cap is
  documented in `FEATURES.md`, which the reader has not read.
- **Why it matters**: the app already has this exact affordance one screen over
  - the filter strip prints the shown-of-total count off `t.outOf`
  (`FilterBar.svelte:103-105`) - so search is the one place the same truncation
  is hidden.
- **Smallest fix**: keep the unsliced length, and when it exceeds 300 render
  the same shown-of-total line where the filter strip puts it. No new
  dictionary key needed.
- **Goldens**: none - there is no `#/search` snapshot.

### P8 - a shared list has no "select all", so printing one means ticking every row

- **Where**: `app/src/components/SharedListPage.svelte:96-117` passes no
  `ontoggleall` to `TableRows`, so the guard at `TableRows.svelte:91` drops the
  "Выбрать все (N)" row that every other table draws.
- **What a user experiences**: `tests/app/snapshots/_l_shared.txt:24-33` - the
  page's whole action row is one "Добавить в список" button. A GM handed a
  twenty-item list who wants the cards printed has to tick twenty checkboxes
  one by one to raise the selection bar, or import the list into their own
  first. There is no Print and no Copy-text on the page itself, though both
  exist on a list of one's own (`ListPage.svelte:604-616`).
- **Smallest fix**: pass `ontoggleall`. The `toggleAllIn` function is already
  duplicated verbatim in `TablesPage.svelte:211-217` and
  `SearchPage.svelte:70-76`; this is its third use, which is exactly where the
  deferred note already says it moves to `AppState`.
- **Goldens**: `_l_shared`, `_l_shared_noted` (one checkbox row added).

### P9 - an old share link silently loses the entries the data no longer knows

- **Where**: `app/src/lib/listLink.ts:148-160` - the loop skips any id the
  `knows` predicate rejects, and returns null only when nothing survives.
  `ListPage.svelte:64-66` names it: "dropping an unknown entry silently, as the
  live app does".
- **What a user experiences**: paste a link written before a record was
  renumbered and the list opens with fewer rows and no sign of it. The header
  count (`SharedListPage.svelte:64-66`) counts what survived, so it agrees with
  the rows and confirms the wrong number. Only a payload where every id is
  unknown produces the "Предмет не найден" page. The checksum (`stamp`,
  `:67-75`) protects against truncation, which is the failure the format
  worried about; this is the one it does not cover.
- **Smallest fix**: return the dropped count from `decodeList` alongside the
  ids, and toast it once on the shared page and on restore. The encoding does
  not change, so `docs/fixtures/lists` and `tests/contracts.js` are untouched
  and `CONTRACTS.md` needs nothing.
- **Goldens**: none, unless a new state is registered.

### P10 - the selection bar sits after the footer in reading and tab order

- **Where**: `app/src/components/Shell.svelte:67-77` renders `<footer>`, then
  `<SelBar>`, then `<Toast>`.
- **What a user experiences**: `tests/app/snapshots/_tables_a_row_ticked.txt:56-64`
  - `contentinfo` with the 444-character licence notice, then "Выбрано 1",
  "Снять выделение", "Добавить в список", "Печать", "Скопировать". Tick a row
  halfway down a 317-row table and the actions you just raised are behind every
  remaining row and the whole footer.
- **Why it matters**: the bar exists to act on the thing just ticked; for a
  keyboard user it is the furthest control on the page.
- **Smallest fix**: this one needs a decision rather than a patch. Moving
  `<SelBar>` above `<footer>` costs nothing visually (it is
  `position: sticky; bottom: 0`) but changes where it sticks relative to the
  footer - worth measuring before committing. Leaving the DOM alone and giving
  the bar a labelled region plus a documented keyboard route is the
  conservative half.
- **Goldens**: every ticked-row tree, `_tables_selection_copied` and
  `_tables_bar_menu`, if the element moves.

### P11 - on a phone the current tab can be off-screen with no scrollbar

- **Where**: `app/src/components/TabBar.svelte:59-68` - at 640px and below,
  `flex-wrap: nowrap; overflow-x: auto`, with `scrollbar-width: none` and the
  webkit scrollbar hidden.
- **What a user experiences**: nine tabs on a 375px screen. Opening `#/lists`
  or `#/search` directly - which is what a shared link or a bookmark does -
  leaves the bar scrolled to the left, so the gold-underlined current tab is
  past the right edge with no scrollbar hinting that more exists. The
  component's own comment records that sections "simply vanished" before the
  scroll was added; this is the remaining half of that problem.
- **Smallest fix**: an effect keyed on `current` that scrolls the lit link into
  view along the inline axis only.
- **Goldens**: none (scroll position is not in the tree).

### P12 - two crosses are 20-26px targets while every sibling control is 44px

- **Where**: `ListPage.svelte:1127-1131` sizes `.note-x` at 20x20 with no
  600px override, and `StorageNotice.svelte:107-111` sizes `.warn-x` at 26x26,
  likewise.
- **Contrast with**: `PageHead.svelte:136-144` gives its 26px home button a
  44x44 `::after` target, with a comment explaining why;
  `HelpButton.svelte:69` is 44x44; `ListPage.svelte:1682-1685` grows
  `.lrow-acts button` to 44x38 at 600px and below; `SelBar.svelte:141-145`
  grows its cross to 32x32.
- **What a user experiences**: on a phone, "clear this note" and "dismiss the
  storage notice" are the two smallest targets in the app, both
  destructive-ish, both beside a textarea people are actively poking at.
- **Smallest fix**: the same transparent `::after` the home button already
  uses, copied onto `.note-x` and `.warn-x`.
- **Goldens**: none.

### P13 - three Russian words for "campaign frame", on three screens

- **Where**: `app/src/lib/dict.ts:61` `srcFrame` is "Фрейм" (the badge on a
  card, a row, a list entry), `:220` `frameF` is "Сеттинг" (the filter row
  label on `#/tables/other_frames`), `:189` `subFrames` is "Сеттинги" (the
  table's own sub-tab).
- **What a user experiences**: filter by "Сеттинг", land on rows badged
  "Фрейм", under a tab called "Сеттинги". English is consistent throughout
  (Frame / Frame / Frames), so this is Russian-only drift.
- **Smallest fix**: pick one word and use it in all three keys.
- **Goldens**: `_tables_other_frames*`, `_tables_frames`, plus any tree where a
  frame record's badge appears.

### P14 - quote and dash typography drifts inside each language

- **Where**: `app/src/lib/dict.ts`. English toasts use two quote styles for the
  same thing: `addedTo` and `removedFrom` use straight quotes, `listCreated`
  and `removedItem` use curly ones - a user who creates a list and then removes
  an item sees the same list name quoted two ways within a minute. Russian
  mixes the em dash (`noLists`, `subTables`, `subSearch`, `localOnly`) with a
  hyphen standing in for one (`rollHint`, `uniqueHint`, `printSub`, `guessWhy`,
  `repriceHint`); `rollLabel` (`app/src/lib/roll.ts:94`) and the two `Field`
  captions use an en dash for the range.
- **Why it matters**: small, but it is the kind of thing a reader notices
  without being able to name, and one pass fixes it for good.
- **Smallest fix**: one editorial pass over `dict.ts`. `CLAUDE.md`'s rule
  ("Product text may be Russian; otherwise use ASCII punctuation") reads as an
  argument for straight quotes on the English side, which settles the first
  half by itself.
- **Careful**: `roll.test.ts` pins `rollLabel`'s en dash character for
  character, and `tests/derived.js` pins `footBefore` verbatim. Neither should
  change.
- **Goldens**: any tree where the string lands in an accessible name.

### P15 - two hand-written Russian numerals disagree with their nouns

- **Where**: `app/index.html`'s `<noscript>` block - "catalog.csv - 1091
  записи" should be "1091 запись"; `dict.ts:199-200` `subSearch`, "Поиск по
  всем 1091 позиции сразу", pairs plural "всем" with singular "позиции".
- **Why it matters**: `I18N.md` makes computed Russian plurals a standing rule
  (`moneyWord`, `itemsWord`); these two are the hand-written numerals that
  escaped it, and both sit on first-contact surfaces - the `<noscript>` block
  is what a reader without JavaScript sees, and `subSearch` is the line under
  the Search heading.
- **Smallest fix**: reword each. One line each.
- **Goldens**: `subSearch` appears in the search page head; check before
  re-recording.

### P16 - print: the card name is the one block with no fitting ladder

- **Where**: `app/src/components/PrintCard.svelte:455-460` sets `.pc-name` at a
  fixed 5.8cqw, uppercase - no clamp, no ellipsis, no shrink. `fit()`
  (`:81-134`) steps down the stat-strip values, then the rules-text font, then
  the top padding, then the font again, and computes the art band from
  `box.offsetTop` - that is, from wherever the name left it.
- **What a user experiences**: unknown, and that is the finding - nothing
  measures it. `tests/app/print.js` reads `.pc-name`'s text (`:257`), its
  colour (`:537`) and its left edge (`:581`), never its height or line count.
  The worst real cases exist: `cm26` "Стрелы и Болты с Метеоритными
  Наконечниками" (43 characters, uppercase, on a 63 mm card), `f59`/`f60` (41),
  `ci81` (39), and in English `hi62` (41), `hi61` (39). Every record has
  artwork (0 of 1091 without `img` in `data.js`), so "missing art" on a print
  sheet is only a load failure, not a data case.
- **Smallest fix**: look first. Open `#/print/cm26-f60-hi62-ci81` in both
  languages and both layouts and read the sheet. If the name genuinely eats the
  card, the fix is the ladder shape the file already uses - shrink `.pc-name`
  while it exceeds two lines, before the text ladder runs. If it fits, add one
  assertion to `tests/app/print.js` pinning `cm26`'s line count so this stays
  answered.
- **Effort/value**: half an hour of looking; the fix may be zero lines.

## Noticed, not worth it

- **Two rarity vocabularies.** Core rules offers four bands
  (`app/src/lib/std.ts:15-20`: common, uncommon, rare, legendary - the golden
  reads "4d12 РЕДКАЯ / ЛЕГЕНДАРНАЯ"), the alternate tables offer five,
  including `veryRare`. If the Core book really prints four, this is correct
  and the only thing owed is one sentence in `FEATURES.md` so nobody
  rediscovers it as a bug. Worth confirming against the book, not worth
  changing on suspicion.
- **Search is the only section with no help panel.** `help.ts:610-619` holds
  eight keys; `SearchPage.svelte:79` passes `help={null}`. Every other tab has
  a `?`.
- **The roll results live region reads out everything.** `StdPanel.svelte:150`
  wraps up to four full cards in one `role="status"`, so a re-roll announces
  every badge, the whole description and every button label of all four.
  `FEATURES.md` records the live region as deliberate; a short visually-hidden
  summary would be kinder but is a design change, not a fix.
- **The money picker hides until a price exists.** `ListPage.svelte:620` draws
  it only when some row is priced - so "show prices in coins" is
  undiscoverable until the person has typed a price into a field labelled
  "Золото", which is always coins. Related: that column header stays
  "Золото"/"Gold" while the values read "3 мешка"/"3 bags".
- **`t.selected` does double duty** as the row checkbox's name and as the
  selection bar's count prefix ("Выбрано" / "Выбрано 1"). Folded into P2.
- **The undo toast lasts 7000 ms** (`app.svelte.ts:270`) and its button is only
  reachable by tabbing through the rest of the page - it is a
  `popover="manual"` element at the end of the document. A keyboard user
  realistically cannot use undo. Fixing it properly means moving focus into the
  toast, which is intrusive; not worth it as a small change.
- **A shared list with an empty name** falls back to `t.untitled`
  (`SharedListPage.svelte:86`) - correct, no action.

## Noted, out of scope

- Making list deletion genuinely undoable means the store keeping a tombstone
  the two-tab merge can un-set (`STATE.md`, "Two tabs") - that is the
  consistent-storage rework already ticketed, not a Phase 8 fix.
- A real focus-management pass across the selection bar, the menus and the
  toast actions is a UX project; P4 and P10 above are its cheap edges only.
