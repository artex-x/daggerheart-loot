# Features, and the state each one needs

Written from the code as it stands, so a rewrite has something to be measured
against. Route grammar is in `ROUTES.md`, storage in `STATE.md`, frozen formats
in `CONTRACTS.md`.

## Rolling

Seven modes. Each keeps its own input in memory only.

| Mode | Input | Produces | State |
|---|---|---|---|
| Core rules | 1-60, or Nd12 for N in 1..5 | up to 4 records: item and consumable, from each picked source | `std {n, src{core,hnf}}` |
| Alternate tables | rarity + Hope die + Fear die | 4 records | `alt {rarity, hope, fear}` |
| Wondrous | 1-119 | 1 | `wond {n}` |
| Dread | 1-29 | 1 | `dread {n}` |
| Vault of Ages | section + roll within it | 1 | `voa {k, n}` |
| The Dragon's Vault | 1-145 | 1 | `dv {n}` |
| Communities | community + 1-10 | 1 | `comm {c, n}` |

- The source switch on Core rules cannot be emptied - unticking the last one is
  refused.
- Rarity on Core rules only sets the dice count, so there is no rarity picker;
  each button is labelled with the count and the rarities it covers. Core
  rules spans four rarity bands (common, uncommon, rare, legendary); the
  alternate tables have a fifth, `very_rare`, that Core rolls never reach -
  intentional, per the Core book, not a gap.
- The roll button uses a real die where the range is one, and reads
  "Random 1-N" where it is not (119, 29, a list of arbitrary length).
- Other is two browsable tables, not a rolling mode: Starting items
  (`other_starting`) holds the non-rollable starting inventory as a plain
  list, and Frame items (`other_frames`) holds campaign-frame equipment
  sectioned by setting, with no roll number.
- Other's navigation subchips are the short `Стартовые`/`Сеттинги`
  (`Starting`/`Frames`) while each page's own heading stays descriptive: the
  descriptive wording measured 293 px on a 360 px viewport against the
  subchip's 260 px cap. Shrinking type, reducing spacing, wrapping,
  truncating, horizontal scroll and any other layout change were rejected -
  the short wording is the fix.
- The consumable/item kind filter is one toggle shared by Core rules, the
  alternate tables and search (`AppState.kinds`, memory only) - switching
  consumables off on one switches them off everywhere, not per page.
- A critical success in the alternate tables - the two dice showing the same
  face - hands over the whole rarity rather than a row: a link into each table
  that is switched on, at that rarity, plus a button that steps the rarity up
  one. There is no such button on legendary. With both kinds on the two links
  name their tables apart; with one on the label stays general. The table
  links open the app at the site root in a new tab, in both languages: a way
  into the tables, not an address to hand over.
- Each card on the alternate tables says which die found it, and its number
  badge is the face that die showed rather than the row the record has in the
  book it was printed in.
- Vault of Ages sections are different lengths, so changing section resets the
  roll: a number from one section would point past the end of another.
- The number field accepts digits only, clamps to the range, and keeps the caret
  where the person put it. On the list page an empty field means "no roll yet";
  on roll pages it waits for `change`.
- On the alternate tables each number field and each stepper names its own
  die - "Hope Die: Roll result" / "Hope Die: One lower" / "Hope Die: One
  higher", and the same for Fear - where the live app named both fields the
  same string and all four steppers the same two strings, so a screen reader
  could not tell which die was being changed. A deliberate accessibility
  improvement, not a drift.
- The results container on every roll mode is an announced live region
  (`role="status" aria-live="polite"`), so a re-roll is read out without
  moving focus off the controls.

## Tables and search

- 16 tables (`TABLE_IDS`), each with its own search box and a list/grid switch.
- Search covers all 1272 records: names, descriptions and stat lines, both
  languages at once; `#/search` shows the first 300 matches - the cap is that
  page's alone, a table's own box is not capped. Once a query exceeds 300
  hits, a "300 из <n>" line - the same shown-of-total wording the table
  filter strip's own count already uses - says so above the rows; under the
  cap nothing is said, because the count on screen already
  is the whole answer.
- Search folds case, `ё`/`е`, typographic apostrophes (U+2019, U+02BC), Latin
  diacritics (`ä`/`ö` etc., NFD-stripped - Cyrillic is excluded so `й` never
  merges into `и`) and the Unicode minus sign (U+2212 -> `-`) on both the
  query and the catalogue, so `плетеная` finds "Плетёная", a query typed with
  the typographic apostrophe autocorrect produces (`keeper’s staff` -> the
  now-ASCII "Keeper's Staff") still finds it, `zweihander` finds
  "Zweihänder" and `-1` finds a "−1" penalty; still a substring match, not
  fuzzy.
- Starting inventory is searchable, opens on direct record pages, and is
  browsable under Other's Starting items table (`other_starting`); it remains
  held in the non-rollable `starting` collection. Its source and class context
  belong in the record description rather than in a new roll table. The
  accepted source-image hashes are
  recorded in `docs/provenance/starting-items-artwork.json`.
- Every heading has a copy-link button; sections are addressable.
- A row or section link (`#/tables/<table>/<key>` - what a record's "show in
  table" link and a section's copy-link button produce) scrolls to its target
  and outlines it in gold for 1.6 s. The scroll and the outline re-play on a
  language switch. A search keystroke, a tick or a view switch does not
  re-play them - the live app re-rendered and re-scrolled on each, a defect
  not reproduced.
- **The three equipment tables hold equipment from every source, not only the
  two books**: 381 weapons, 123 secondary, 100 armour. The `src` facet is how you
  narrow to Core and Hope & Fear (239 / 73 / 69). Frame, Vault of Ages,
  The Dragon's Vault, Wondrous and Dread equipment appears there too.
- An equipment table is sectioned by tier, `Ранг 1` to `Ранг 4`, then
  `Артефакты` (key `tA`) for equipment the book prints in its Artifacts
  section (`eq.tier: 'A'`); a section with no rows is not drawn. The stat
  line, copied text and the stub page read `Артефакт` / `Artifact` where the
  rank goes; the tier facet offers an `A` chip, `Артефакты` / `Artifacts`
  (the section's label, as on the `voa` table), only on a table whose kind has
  such a record; the suggested price is the legendary item band.
- The filter panel is one component across all tables; where a table has nothing
  to filter by, there is no panel. Nothing is selected by default and an empty
  row means "any". Chosen values show as pills outside the panel, with a reset
  and a copy-link button, so they are reachable while the panel is folded.
  Values in a row combine with *or*; a link naming two frames opens both.
- Filter state lives in the address (`STATE.md`), written with `replaceState` on
  every change, and read back only when the segment actually changed.
- A grid tile shows that record's own roll number. The live app passed the
  array index as the number (`list.map(tileHTML)`), so every tile past the
  first in a plain table showed its position instead of its roll - a live
  defect the rewrite does not reproduce.

## Lists

- Create, rename, reorder (drag handle or by typing a position), remove with
  undo, delete with undo. A drag lands in a gap between two rows, not on
  a row: the pointer resolves to the nearest gap, and both rows beside it
  light, because "after 3" and "before 4" are one place. On the row above the
  gap, the highlight is drawn on that row's own last visible line, so a row
  whose note box is open shows it there rather than losing it under the note;
  the row below the gap is marked on its own first line, unaffected either
  way. The drop zone is the rows' own extent plus one measured row gap at
  each end. The list accepts a release at every moment the highlight is
  shown, including while the pointer crosses a row's own controls (grip,
  inputs, note) on the way through. Leaving the zone, releasing outside it,
  and Escape all cancel the drag and change nothing, including a release
  over the list's own note, which the drag refuses rather than inserting
  into. A drag whose own row another tab removes is void: its marks clear,
  the release changes nothing, and the next drag, a text drag into a note
  included, works as usual. A drop moves the entry the drag started with.
  Dragging near a
  viewport edge auto-scrolls: a 120px band at either edge, up to 22px per
  frame, driven off `requestAnimationFrame` (`app/src/ports/drag.ts`) -
  untested by any suite (no test drags near a viewport edge);
  `docs/specs/COVERAGE.md` names the gap, this line the constants.
- A completed reorder is announced in a visually hidden live region, by
  either path (drag or a typed position); a move that changes nothing stays
  silent. The drop mark itself appears at once on both of its halves, with no
  fade. The drag grip is drawn only where an input device can hover - on a
  device whose every pointer is coarse and cannot hover, HTML5 drag never
  starts from a touch, so the position field is the one reorder control left,
  and it works everywhere.
- Add from a table or search selection, or from an item card. The card menu stays
  open so one item can go into several lists, and through the new-list form
  and its cancel. From the eighth list (`LIST_SEARCH_AT`) it draws a search
  box, folded as search folds (case, `ё` as `е`); only the chips scroll, so
  the label, the search and «+ Новый список» (or the open form) stay in view.
  «+ Новый список» starts the form with the trimmed query as the name, and a
  create clears the query. A one-record menu puts the lists holding the
  record first, newest first in each group, in the order taken when it
  opens: a pressed chip keeps its place until the menu opens again, and a
  list that appears while it is open (created here or in another tab)
  joins the first group. A selection's menu
  stays newest first. The menu opens on
  the side of the toggle button with room in the tightest clipping box it
  sits in - the record card, the record modal's own card, the window -
  re-measured from the toggle itself (not whichever button happens to render
  first) whenever it opens or grows, so it neither spills past the modal's
  edge nor drags the card's own scroll position along with it. Escape closes
  it and returns focus to the toggle, the same as any other disclosure on
  the page.
- The index, from the eighth list in all (account and browser lists
  together), draws a name filter («Найти список») under the create panel: it
  matches the list name in both groups, folded as search folds, keeps each
  group's order, lives in memory only and starts empty on every visit; a
  create clears it; no match in either group draws «Ничего не найдено». The
  index draws the first 24 cards (`LIST_PAGE`) of what the filter leaves,
  the account lists first, then the browser lists, as one sequence, then
  «Показать ещё (N)» / "Show more (N)", N still hidden; each press draws 24
  more and moves focus to the first card it revealed, and the button goes
  when none remain. Any edit to the query folds the result back to 24. The
  drawn count is session memory (`AppState.listsShown`): a return from a
  list page shows the same cards, a reload starts at 24. A new card goes
  first in its group and pushes the last drawn card under the button.
- Optional quantity and price per entry; both travel into copied text. The
  price is the price of one unit: after a count over 1 the copied line reads
  "×2 — по 7 мешков 5 горстей" / "×2 — 7 bags 5 handfuls each", in the
  selection copy and in "Скопировать текст" alike.
- Prices display as book units (default) or coins; the mode is per list and
  rides in the link.
- Batch actions over a selection within a list: set prices, clear prices, shift
  all by a percentage, suggest prices from tier or rarity, copy, remove. The
  batch bar's select-all box keeps the name "Выбрать все"; it shows the mixed
  state while some but not all rows are ticked, and its visible label is
  dropped while anything is ticked. A ticked row takes the gold selected style
  of a ticked table row. The batch bar shows the selection summary and the
  total. "Скопировать" copies
  the ticked entries in list order with each taken count and unit price after
  the name, and ends with the total line. "Удалить (N)" removes by the taken
  count: an entry taken whole leaves the list, an entry taken in part keeps
  the rest of its quantity (a rest of 1 stores no quantity). N stays the
  number of ticked rows, the toast reads "Убрано из списка (N)" for a partial
  removal too, and one "Вернуть" restores every row it touched, in place.
- A selection on a list page - the own list and the shared page - carries a
  taken count per ticked entry. Ticking takes the whole quantity. A ticked
  entry with a quantity over 1 draws a take line inside its row, under the
  art: "Взять [2] из 5 = 1 мешок" / "Take [2] of 5 = 1 bag", the line sum
  (price x taken count) only for a priced entry. The field narrows the count
  to 1..quantity; an emptied field puts its value back on commit. The count lives in memory only and clears with its
  tick, on "clear selection", and on a navigation. The total is the sum of
  price x taken count over the priced ticked entries, in coins, read once in
  the list's money mode: `Итого: 1 мешок 1 горсть`. Unpriced ticked entries
  add nothing and are counted after it: `(без цены: 1)`. With no priced
  entry ticked, no total is drawn. The rounded total can differ from the sum
  of the rounded row prices. The summary on a list page names entries and
  pieces apart: "Выбрано 4 позиции · 9 шт." / "Selected 4 items · 9 pcs",
  the pieces part only when the taken pieces differ from the entries. The
  verb agrees with the count: "Выбрана 1 позиция" / "Выбрано 4 позиции". Summary
  and total sit in one `aria-live="polite"` region at 13.5px, the count and
  the total's value at weight 650, so a changed count is announced. The
  region is mounted while nothing is ticked, so the first tick is announced
  too. A table
  or search selection has no taken count and no total, and its bar reads
  "Выбрано N".
- A typed quantity is held to 99, the most a list link carries, and a
  negative one to none; the field then shows the held value.
- A list has its own roll button, folded by default and opened on its
  summary; the row numbers match it. An empty roll field means no roll has
  been made yet, not zero. The panel, a row's own note box and the list note
  each keep the person's own fold/unfold across a language switch - the live
  `data-keep` opt-ins - rather than resetting to the data's own default the
  way every other re-render does.
- Two notes per list and per entry - see `CONTRACTS.md` for how they encode and
  which link carries which.
- The address bar always holds the player link and is refreshed on every edit
  - opening the page, and after every writer on it.
- Every other address the app copies - a list's players link, a table, a
  filter, a section anchor, a print sheet - is `<site>#/...` in Russian and
  `<site>en/#/...` in English, so a messenger builds its preview in that
  language (`CONTRACTS.md` section 3).
- A shared link (`#/l/<payload>`) that is nobody's own list draws the shared
  page: the name, the shared-list line with the count as one text node, one
  "Сохранить себе" / "Save to my lists" button, drawn whatever the selection,
  that saves the whole list as a new list of one's own - entries, quantity,
  price, every note the link carries and the money mode - and opens it, the
  list's own notes, and the rows; taking some rows, or all of them after
  "select all", into a new or an existing list is the selection bar's
  add-to-list control, which carries the taken count as the quantity (none
  for a count of 1), the price and a row's public note but never the GM's
  note. The bar shows the selection summary and the total, its
  "Скопировать" carries each taken count and unit price and ends with the
  total line, and its "Печать" writes each taken count into the print
  address. An entry the data no longer knows is dropped and counted in one
  toast ("Пропущено позиций, которых больше нет в данных: 2") on this page. A
  link whose every entry has left the data opens as that list with no entries
  and the same toast, never as a damaged link; saving it creates the empty
  copy and opens it. Under the actions (and under the sign-in prompt when it
  is open) a line in the muted colour says «Ссылки вида #/l/ перестанут
  открываться 26 октября 2026 года. Сохраните список себе, чтобы не потерять
  его.» (`LEGACY_WRITE_UNTIL`); the bad-link page and a browser list's own
  page do not draw it. A link
  written before the checksum that names no entry is still damaged; an
  empty list's own link opens it. A payload that cannot be
  decoded draws "Предмет не найден", the bad-link line and a "На главную"
  button to `#/roll/std`. A **packed** link (`#/l/~<payload>`) that cannot be expanded
  draws the same bad-link page without replacing the address - the live
  shape sent the reader to `#/l/zzzz` instead, which cost a slow unpack
  resolving after the reader had already moved on the shared list they had
  since left for.
- Two open tabs merge rather than overwrite (`STATE.md`).
- A storage notice at the head of the index's browser group and at the top
  of a browser list's page (never on an account list's page): when storage
  refuses, a plain warning that cannot be dismissed; otherwise a folded "lists
  live in this browser only" disclosure whose cross is remembered in
  `dhloot.warn.v1`; unfolding is not remembered - the notice comes back folded
  after a language switch, as the live re-render left it; on the index it
  survives a create and a delete, where the live whole-page re-render
  re-folded it - the rewrite's deliberate deviation, invisible to the old
  parity harness because every one of its states started folded (deleted at
  R0c, issue 47). The dismiss cross is a sibling control positioned over the
  disclosure's corner; its 44x44 target yields to the summary where the two
  overlap, so a tap on the summary's row unfolds the notice rather than
  dismissing it. It is not nested inside the `<summary>` that opens and
  closes it - the two presses no longer have to fight over the same click.

### Account lists

A build with sign-in configured keeps a signed-in reader's lists in the
account (`docs/specs/META.md` section 3); browser lists stay as they are until
the legacy write cutoff, and no control offers to move one yet.

- **Where a list is made**: signed in, every list made on the index, in the
  add-to-list menu or by "Сохранить себе" on a shared page is an account list.
  Signed out, each of those places draws the sign-in prompt instead: one line
  and one «Войти», never a provider button. On the index the create panel is
  the prompt («Войдите, чтобы создавать списки: ...»); in the menu the
  new-list slot is (the chips stay pickable; «Отмена» folds it back to
  «+ Новый список»; «Войти» takes the focus); on a shared page «Сохранить
  себе» reads pressed and opens the prompt under it, and a second press folds
  it. While the session is still unknown none of them is drawn, so a
  signed-in reader never sees a prompt flash. A build with no sign-in
  configured makes browser lists as before.
- **The return after sign-in**: «Войти» opens `#/account` and remembers the
  page and the started action; the account page's sign-in carries both
  through the provider redirect (`STATE.md`, `dhloot.auth.return`). Back on
  the page, once the account's lists are read, the action finishes by itself:
  the add-to-list menu reopens (the selection bar's with the same rows ticked
  and their taken counts; a menu started in the record dialog reopens on the
  record's page `#/i/<id>`), with the new list's name in its form when one was
  typed; a shared list is saved into the account and opened. Leaving
  `#/account` any other way forgets it, and so does a navigation or a
  sign-out before the action finishes.
- **The index**: signed in, the create panel, then the group «Ваш аккаунт» /
  "Your account" - the account lists, newest edit first, each card with
  «изменён N назад» / "edited N ago" under its name (`I18N.md`) and one
  «Удалить»; «Загружаем...» while the first read runs; «Не получилось
  загрузить списки аккаунта.» and «Повторить» when it fails; «В аккаунте пока
  нет списков - создайте первый выше.» when there are none. Then «Этот
  браузер» / "This browser" with the storage notice at its head and today's
  cards. Signed out, the browser group has no heading and is drawn only when
  there are browser lists or storage is broken or unreadable; with no sign-in
  configured it is always drawn.
- **An account list's page** keeps its address `#/lists/<uuid>` (no `#/l/`
  rewrite), draws «Поделиться» / "Share" first in its actions in place of
  "Ссылка игрокам"/"Ссылка себе", no storage notice, and says its save status
  after the count: «Сохраняем...», «Сохранено», or
  «Не сохранено» in the danger colour and «Повторить». Only the failure and
  the save that ends it («Сохранено») are announced (a permanently mounted,
  visually hidden status region); the next save empties the region. Every
  edit shows at once; the writes go one at a time, in order, and a queued
  edit of one field is sent once. A write with no network stays queued and is
  sent again every 15 s, when the tab is shown again, and on «Повторить»; a
  reload while «Не сохранено» loses it. A limit or another refusal drops that
  write, toasts, and shows the list from the account again.
- **Share links**: «Поделиться» reads pressed and expanded and opens a panel
  under the actions with two rows, «Ссылка для игроков» and «Ссылка для
  мастера», both ready on open: the panel reads the list's links (stopped
  ones too) and makes a link only for an audience that never had one, the
  players' first. An active row shows its link as the in-app address
  `#/s/<token>` and two buttons: «Скопировать» copies `<site>#/s/<token>`, or
  `<site>en/#/s/<token>` in English, and toasts «Ссылка для игроков
  скопирована - заметок мастера в ней нет» or «Ссылка для мастера
  скопирована - в ней есть заметки мастера»; «Удалить ссылку» stops the link
  at once, asks nothing and toasts «Ссылка удалена: по ней список больше не
  откроется.». A row whose links are all deleted says «Ссылка удалена» and
  offers «Создать ссылку» alone, which makes a new link and toasts «Ссылка
  создана.»; the next open does not make one by itself. Replacing a link is
  delete, then create. Under the rows a hint says what the two buttons do and
  that the GM's link shows the «Только для мастера» notes. «Загружаем...»
  while the links are read; «Не получилось загрузить ссылки.» and «Повторить»
  when the read, or a link it had to make, failed; a failed change toasts «Не
  получилось изменить ссылку. Проверьте сеть и попробуйте ещё раз.», keeps
  the row, and reloads the panel when it was refused. A row's buttons are
  disabled while its change runs. An empty list can be shared. No account
  list's page or panel writes or copies a `#/l/` address.
- **The shared page `#/s/<token>`** draws the list as the link's audience sees
  it, read-only for everyone, the owner included: the name, today's
  «Список от другого игрока · N позиций», «Обновлено N назад» / "Updated N
  ago" under them (`I18N.md`), «Сохранить себе», the notes the link shows (a
  GM link adds the «Только для мастера» notes) and the rows, with the
  selection bar as on a `#/l/` page. It reads the list again when the tab is
  shown again and every 45 s, signed in or not; the relative time moves with
  the same clock. The owner, signed in, sees «Это ваш список.» and «Открыть
  для правки» to `#/lists/<uuid>` above the title. «Сохранить себе» saves a
  copy into the account with only the notes the link shows (a player link's
  copy has no GM note) and opens it; signed out it opens the sign-in prompt
  under it, and after the sign-in the copy is made by itself; a refusal
  toasts the limit text or «Не получилось сохранить список себе. Попробуйте
  ещё раз.». A stopped, deleted, unknown or empty token, and every token in a
  build with no sign-in, draws «Список больше не доступен» / «Владелец удалил
  эту ссылку или список.» and «На главную», the address kept, never the home
  page; a read that failed draws «Список не загрузился» / «Проверьте сеть и
  нажмите «Повторить».» and «Повторить». Nothing is drawn while the first
  read runs.
- **Not found**: an account address signed out draws «Список не найден», «Если
  это список из вашего аккаунта, войдите, чтобы открыть его.» and one
  «Войти», which returns to that address; nothing while the session or the
  first read is pending; «Не получилось загрузить списки аккаунта.» and
  «Повторить» when the read failed; today's not-found page for an id the
  account does not hold.
- **Delete** asks through the browser's confirm «Удалить список «%s»? Ссылки
  для игроков и мастера перестанут работать. Отменить удаление нельзя.»; the
  toast has no «Вернуть». On the list page it returns to `#/lists`.
- **Sign-out** on an account list's page replaces the address with `#/lists`;
  no account list stays on screen.
- **Two devices**: the index and an account list's page read the account again
  when the tab is shown again and every 45 s while no write is queued, and a
  shared page `#/s/<token>` reads its list again on the same signals; the
  last write wins per entry and there is no conflict dialog. A read that
  finds nothing new redraws nothing. «изменён N назад» and «Обновлено N
  назад» move with the same 45 s clock while the page stays open.
- **Limits**: the 51st list and the 101st entry of a list (the defaults;
  `limits:set` changes them per user) are refused with the error toast
  «Достигнут предел списков в аккаунте: 50. Нужно больше - напишите на
  daggerheart.loot@gmail.com.» / «Достигнут предел позиций в списке: 100. ...»,
  the number the database applied.

## Records

- Card in a modal from a table row, or a full page at `#/i/<id>`.
- A tag and a table path are two different things, and a record draws each in
  its own place. The line under a record page's heading is the record's
  complete table path - the group, its sub-table, and, for the two tables
  sectioned by a value the record itself carries (`other_frames` by `frame`,
  `community` by `community`), the record's own section leaf: a community
  record reads `Сообщества · Великородное` / `Communities · Highborne`, and a
  Vault of Ages artifact or cursed object carries that word in the same line
  (`Vault of Ages · Артефакт` / `Vault of Ages · Artifact`, `· Проклятый
  предмет` / `· Cursed object`). The print card's source line and a generated
  share stub's subtitle are paths too, and are held to the same rule. An
  equipment record's stub subtitle follows the path with its stat line,
  which drops the equipment type on the `eq_*` tables (the path names it)
  and the tier wherever the path already names it (a record with no roll
  number, and an artifact). The
  section leaf is not generalised past this set - a table earns one only when
  it is sectioned by a value the record itself carries, or, for Vault of
  Ages, by the book's own tiers; extending the rule to every table was
  rejected.
- The `.badge src` chip on a record card, a table row, a Search result, a list
  row, or a modal card is a tag, not a path: one leaf naming the book, the
  community, or the setting - never a breadcrumb. It carries no path segment
  because every place it is drawn already shows the surrounding context (a
  table, a section, a list of results).
- Every weapon's stat line - record card, table row, copied text, share
  stub - names its class, secondary weapons too; the print card's class tag
  says the same (`docs/DECISIONS.md`, 2026-09-24).
- `#/i/<id>` for an id the data does not know draws "Предмет не найден", the
  sub line and a "На главную" button to `#/roll/std` (the live
  `renderItemPage` shape) and keeps the plain tab title, the same as any
  other route with nothing of its own to name. A record that is found, a
  section, and an owned list each title the tab with their own name ahead of
  the app's - `<name> — <docTitle>` (the live app wrote the name and then
  overwrote it with the plain title on the very same render, on both
  `#/i/<id>` and every other route that could have named itself). When `data.js` itself did not load, every page draws the "data did
  not load" line in place of its content (`NoData.svelte`) - the rewrite's
  own state; the live app threw on a missing `window.LOOT` and drew nothing.
- Copy name, copy link, share, copy image, copy text. Copied text goes to the
  clipboard as both `text/html` (name in `<b>`) and `text/plain`; Markdown
  asterisks are deliberately not used. Copy link and share carry the
  record's stub in the language on screen - `i/<id>.html` in Russian,
  `i/en/<id>.html` in English.
- Copying the image has three outcomes, each with its own toast. A canvas
  that cannot be read back at all (the retired `file://` build's own picture
  always tainted it) falls back to copying the record's text instead, worded to say
  so. A picture the canvas can produce but the
  clipboard refuses falls back to downloading it as a PNG file, saved or
  failed each with their own wording - distinct from the clipboard's own
  generic "could not copy".
- Sharing a record attaches its picture where there is one and the share
  sheet can take a file, and always carries the full share text (stats and
  description included), not just the name.
- Copying every option of a roll toasts its own wording, not the generic
  text-copied message.
- Consumables get a "(consumable)" suffix outside the app, where the badge is
  not visible.
- A compact card's art zooms slightly on hover, guarded by `@media
  (hover:hover)` so no touch device triggers it on tap; a full-page record's
  art never zooms.
- Upgrade chains render both directions; the reverse is computed at load. That
  is `craft` - one thing made from another - and it is not the tier ladder
  below. A chain may run through a record, which then draws both lines:
  Frostwyrd (Awakened) is made from Dormant and upgrades to Exalted. The card
  and the table row draw "Made from" first, then "Upgrades to", so the lines
  follow the chain; "Made from" has a left arrow and "Upgrades to" a right
  arrow. The share stub keeps the same order. The copied text of a chain
  record carries only what the next rung adds: the lines of the target's
  description that its own description does not already carry.
- Equipment that belongs to an upgrade **line** carries a tier ladder: one rung
  per tier of that line, in tier order, the rung you are on marked and inert
  and the others opening that tier's record over whatever is on screen. A line
  of one is not a ladder and is not drawn. Each rung is named for the piece it
  leads to, because its own content is a bare digit.
- A campaign-frame record with equipment metadata (a tier, thresholds, armour
  score) prints its tier word and its tier ladder exactly as an equivalent
  `eq` record does - `f33` "Quilted Clothing"
  and `q313` "Gambeson Armor" now agree, where the live app printed one and
  hid the other with no stated reason. Its source label still names the frame
  itself, the same tag any other book's own equipment gets (`isFrameRecord`
  now only answers "which table" and "what does the source line say", never
  "what does this hide").
- Referenced cards - a Core card, an adversary stat block, or one feature
  printed on another page (an ancestry feature, an adversary feature) - render
  as a collapsed block and travel with the item into copies and shares. Each
  block links out to the `daggerheart.su` page that prints it, the subdomain
  matching the language on screen (`ru.` in Russian, `en.` in English), and
  its text keeps the source's own line breaks.
- A record that belongs to a set (`Record_.set`; two sets so far - Ember
  and Spark, The Dragon's Vault; Saint's Ensemble, three members, Vault of
  Ages Volume 4) draws a set line naming every member in
  catalogue order, the record itself inert and the rest linked. A set's
  shared bonus (`LOOT.sets[key]`) is drawn under the set line on every
  member and travels into copied text (the set block's body), the print card
  (the last text line, `<name> (<Set>: <members>): <text>`), the share stub
  and `catalog.csv`; a set with no bonus copies its line alone, with no blank
  line after it. The set is derived by grouping at load, never stored as a
  sibling list, and a set of one is not a set. No set filter and no set page
  exist yet (`docs/DECISIONS.md`, 2026-09-23, "The second set").
- A row - in a table, a search, a shared list or a list page - and the lists
  index strip draw the 160 px thumbnail `img/thumb/<asset>`; tiles, cards,
  the record page, print and copy-image draw the 640 px file.
- A record with no artwork falls back to `_none.webp` at the size the site
  draws, and hides the image button; so does a record whose picture or
  thumbnail fails to load, and the app remembers that for the session, so a
  failed thumbnail also shows the placeholder on the record's card.
  Without a connection, a thumbnail the service worker never cached is
  answered with the cached 640 px picture when there is one, so
  the row draws that picture and nothing is remembered as failed
  (`META.md` section 9).
- The record modal is a native `<dialog>` opened with `showModal()`, so it is
  modal, the page behind it is inert, and focus moves into it on open and
  returns to the opener on close - a deliberate improvement over the live
  app, whose card the keyboard never actually enters. The one visible
  consequence is that the modal's close button carries a focus ring the live
  app's does not.
- A real navigation to a different address closes an open modal; a filter
  pick or a list mutation, which rewrite the address in place rather than
  navigating to it, do not.

## Print

- `#/print/<ids>`, nine cards to an A4 page at 63x88 mm, or sixteen at 44x63 mm
  on the opt-in compact sheet; up to 180 cards either way.
- Reached from an item page, a list, or a table selection; the address is
  shareable and independent of where it came from.
- Colour and black-and-white are two different cards, not one with a switch.
- An artifact weapon (`eq.tier: 'A'`) prints as a loot artifact card does: the
  tag `Артефакт`, then its class tag, no tier band, and its damage strip.
- A card printed from a list shows the list's count after its name as ` ×N`
  (a space, U+00D7, the number), only for a count over 1 - the same suffix
  the list's copied text puts after the name (`qtySuffix` in `share.ts`). The
  count rides in the address as `*<n>` per id (`ROUTES.md`), so it survives a
  reload and the copied set link. The list page's print button writes the
  list's counts, and the shared page's selection bar writes the taken counts;
  the record, table and search print links carry none. The counter sits
  in a `nowrap` span, so it wraps with the name's last word, never alone.
- Fitting is measured in the browser after render. The damage strip goes
  first: each value first tries one line, shrinking in 0.1cqw steps from its
  computed size down to the 4.5 pt label floor; a value that still does not
  fit wraps and shrinks the same way down to no less than 2.2cqw, until its
  widest line fits its cell in at most two lines (width measured with a
  `Range`), and a value on two lines gets 1.2 leading; then the damage-type
  label beside a modifier shrinks the same way until it fits its box; then
  a strip whose tallest block is taller than the ribbon's inner band grows
  until the band holds it. The rules text then steps its font down, then
  the top padding.
- Small text has a paper floor in every view, written `max(<design>cqw,
  <floor>)` so a field already over it keeps its Figma size: labels 4.5 pt,
  values and numbers 5 pt, the tier word 4 pt (`DECISIONS.md`, "Print card
  small text keeps the ribbon and gets one paper floor in every view").
  Named shortfalls, set by the ribbon's cells on the compact sheet: a Russian
  value kept on one line (`Проворность` and `Очень далеко` 4.8 pt), the
  English `DAMAGE` beside a modifier (3.1-3.7 pt), and the d4 value (4.5 pt,
  the triangle is narrow). Measured 2026-09-23 on the Windows host (Segoe
  UI).
- Weights: 900 for the name and the tier number only; 700 for the die
  value, the modifier, the threshold numbers and the armour score; 600 for
  the strip values; 500 for labels, captions and tags; 400 italic for the
  source line. Text on the white of a card is `#000`; the black-and-white
  kind tag is white on `#000`, and its threshold frame is `#000`.
- A strip value has no clipping box: a printed sheet in Inter lost the tops
  of its capitals to the old one. Labels print in capitals tracked 0.06em
  (not the label beside a modifier, which the fit shrinks) with 0.25em under
  them; values print as the data writes them, and the one-word damage type
  starts with a capital (`Маг`, `Phy`). The die value has 0.12em after its `d`.
- The strip keeps its ribbon and has five cells: the die; the modifier, with
  no label, against the die and on its centre; then the damage type, trait
  and range as label-over-value blocks centred in the band between the
  ribbon's ornament lines, each inside the ribbon's dividers. The strip is
  `max(14cqw, 20pt)` tall - the design's 8.8 mm on the standard card,
  7.05 mm on the compact one - and a wrapped value raises it (11.3 mm on the
  compact card for `Хар. Заклинателя`).
- A weapon's ribbon and die art follow its class, magic or physical, on both
  strips of a two-strip weapon; the damage box names each strip's damage
  type (`docs/DECISIONS.md`, "The print card frame follows the weapon's
  class").
- The die value, and the colour card's armour and burden labels over the
  picture, carry their halo as a vector stroke (`-webkit-text-stroke` with
  `paint-order: stroke fill`): a blurred `text-shadow` printed as a raster
  patch. A compact black-and-white sheet holds no raster image.
- The threshold diamonds are at least 1.3 mm tall and sit 0.6 mm clear of
  the frame; each caption fits its cell. Each arrow grows from its box's
  right notch, the same size on both sheets (tip 4.27 pt past the notch, at
  least 1.3 mm wide): in colour a dark arrow in a gold rim that continues
  the frame, in black and white a solid black arrow. CSS draws it at
  `card/arrow.svg`'s 7:12 proportion; the image stays in the markup,
  hidden. The burden label sits under its mark.
- In black and white the rules text first grows, in 0.1cqw steps from its
  3.5cqw default to at most 5cqw (8.9 pt), while it still fits its box: the
  space a colour card gives its picture is blank paper there (issue 61). Text
  that does not fit at 3.5cqw takes the shrink ladder unchanged. Colour never
  grows - the picture owns that space and the ladder gives it up last.
  Measured on the Windows host on 2026-09-23: a two-line card was 54-67% blank
  and reaches the cap; the longest texts land at 3.6-4.3cqw. A one-line card
  stays more than half blank at any size under the name's 5.8cqw; a 4x4 sheet
  (44x63 mm) was measured as the same composition at 70% - the same blank
  share at 4.3 pt - and rejected as a replacement for the 3x3 sheet
  (`DECISIONS.md`).
- Two independent switches: colour or black-and-white, standard or compact;
  every combination prints. The compact card is the same card at 70% - every
  dimension is `cqw` - so the ladders run unchanged: compact colour text is
  4.3 pt by default and 3.2 pt at the floor, and the compact black-and-white
  card reads at 6.2 pt where the grow rung reaches its cap. A size change
  fits every card again at its new size. Measured 2026-09-23
  (`DECISIONS.md`).
- The compact subtitle says 44×63 mm and sixteen to a sheet; the print link's
  title keeps "nine to an A4 sheet" - it names the default.
- An address naming nothing the catalogue knows draws the heading, the "nothing
  to print" note and a link back to the lists - no bar, no sheet.
- More than 180 known ids prints the first 180 and a red note counting how many
  did not make it onto a sheet, telling the reader to split the set in two.
- `Назад` steps back in browser history; with nowhere to step back to it goes to
  `#/lists` instead.
- A card's own name is drawn as `<h2 class="pc-name">`, a heading-level fix:
  the live app's `printCardHTML` wrote `<h3>` there - unrelated to the
  alternate-tables page's own heading jump, `<h1>` straight to `<h4>`, fixed
  separately: each rarity section is now an `<h2>` (`SectionHead`'s own
  `heading` prop, only passed here) and the Hope/Fear column pair under it
  demoted to `<h3>`.
- The black-and-white choice (`printBW`) and the sheet size (`printCompact`)
  are remembered in this browser (`dhloot.prefs.v1`, for every reader) and,
  signed in, in the account (`STATE.md`, "Account preferences"): they
  survive leaving the print page, a reload and, signed in, a new device.
- A missing picture (a partial deploy, a cold cache) falls back to the same drawn glyph a record with no art gets,
  the same way `RecordCard` does - reached from a print sheet opened
  directly at a shared `#/print/...` address, where nothing has already
  caught the failure.
- An open record dialog and an action toast both stay hidden under print
  media, the way the live app's `#modal`/`#toast` rules did unconditionally -
  neither had an equivalent rule in the rewrite.
- The card's own name (`.pc-name`) is not part of `fit()`'s shrink ladder -
  inspected rather than assumed (owner decision, "look first, then
  shrink"). The four longest names (`#/print/cm26-f60-hi62-ci81`), measured
  on the Windows host on 2026-09-22 as the distinct line tops of a `Range`
  over the name: in Russian cm26, f60 and hi62 wrap to three lines and ci81
  to two, three with a ` ×99` counter; in English all four wrap to two. An
  earlier claim that all four render at one line came from a
  `getClientRects()` check on the block, which can never report more than
  one line. `fit()` already takes the name's height from the rules text, so
  the cap is three lines (owner decision, 2026-09-22), not a shrink step.
  `tests/app/print.js` pins it for both routes (bare and
  `#/print/cm26*99-f60*99-hi62*99-ci81*99`), both languages and both
  layouts. No deviation from Figma nodes `714-42387`/`3773-90792` was
  needed.

## Account

`#/account`, drawn by `AccountPage.svelte` in a build with sign-in
configured (the two `VITE_SUPABASE_*` values, `docs/specs/META.md` section
3). Sign-in is optional: everything else works without it. The page is one
column at 70ch, titled «Аккаунт» / "Account" (the tab reads `Аккаунт —
<docTitle>`), and each section is a panel headed by an `h2`.

- **Unknown session**: only the title, while the cloud has not answered.
- **Signed out**: the lead «Войдите, чтобы ваши данные были доступны на всех
  устройствах. Всё остальное работает и без входа.» and one panel, «Войти»:
  «Войти через Google» and «Войти через Discord» (each with the provider's
  own logo), then the consent line linking the terms and privacy pages of
  the language on screen.
- **Signed in**, in this order: «Вы вошли как» (the email in bold, then the
  first provider's logo and «через <provider>»; the provider alone when an
  account has no email); «Способы входа» - a row for Google, then Discord:
  a connected one shows its identity's email and, while two or more are
  connected, «Отключить»; a missing one says «не подключён» and offers
  «Подключить <provider>»; with exactly one connected, a hint says it cannot
  be disconnected until another is connected; «Выход» - «Выйти» and «Выйти на
  всех устройствах», which also ends the session on the reader's other
  devices at their next token refresh; «Удаление аккаунта» - the hint
  «Аккаунт и все связанные с ним данные будут удалены навсегда.» and
  «Удалить аккаунт...», which opens an inline confirmation: the word
  «удалить» / "delete" typed (trimmed, any case) enables «Удалить навсегда»;
  «Отмена» folds it and forgets the word.
- An identity email of any length wraps; it is never cut short.
- Every action disables the page's buttons while it runs. Sign-in and
  Connect say «Переходим в <provider>...» on the pressed button, record
  where to come back to (`STATE.md`, `dhloot.auth.return`) and leave for the
  provider - the page itself, or, when a sign-in prompt's «Войти» led here,
  the prompt's page and the action it started ("Lists", "Account lists"); the buttons stay disabled and the pressed one keeps its text
  until the page is gone, and a return with the browser's Back button
  enables them again. The return lands on `?auth-callback=1`, which is read
  before the app mounts and replaced by the page the reader left
  (`ROUTES.md`, "Account").
- When the connected providers cannot be read, «Способы входа» says «Не
  получилось. Попробуйте ещё раз.» (`role="alert"`) in place of the rows,
  and offers no Connect.
- A Connect refused because that provider account already belongs to
  another account says «Этот аккаунт <provider> уже подключён к другому
  пользователю.» in that provider's row (`role="alert"`), whether the
  refusal came back from the call or from the provider's redirect; it
  clears on the next action. Any other refusal - a cancelled consent, a
  failed sign-out, disconnect or deletion - is the error toast «Не
  получилось. Попробуйте ещё раз.».
- Sign-out and deletion stay on `#/account`, which becomes the signed-out
  page, with the toast «Вы вышли из аккаунта.» or «Аккаунт удалён.».
  Deletion removes the account on the server (`delete_account()`, a
  migration in `supabase/migrations/`), then this browser's session.
- The texts describe what an account is for in general terms, true in
  every release (`I18N.md`, "Rules").
- A build with no sign-in configured draws the not-found page on
  `#/account`, keeps the address, and draws no account control.
- Signed in, the language, starting section, tables view and print layout
  follow the account on every device (`STATE.md`, "Account preferences").
  The controls stay where they are; the page first draws this browser's
  values and switches once the account answers. There is no settings page.

## Chrome

- Language switch, tab bar, skip link, starting-section pin (eight sections
  pin as their own hash; `#/tables` pins as whichever table is on screen;
  never a record or a list).
- Focusing the skip link moves focus straight to `#main` and never touches
  the address bar - the browser's own fragment jump would also route the
  hash through the app's own parser, which reads `#main` as unknown and
  would clear the person's selection navigating them home. While
  focused it is a gold plate pinned over the page's top-left corner, matching
  the live app rather than a grey chip that pushed the header down while
  focused.
- Chips and segmented switches expose their on/off state as `aria-pressed` -
  the money chips and the two view switches (tables list/grid, print colour/
  black-and-white) gained it in the rewrite, where the live app wrote
  nothing for the money chips and `aria-current="true"` for the menu chips.
- Help panels under a `?` per section, folded by default, fold state remembered
  for the session only.
- Toasts with an undo action for destructive things. A toast that offers an
  undo moves focus to its button, so the keyboard reaches it within the
  7000 ms it lasts; a toast with no action never takes focus. When the toast
  goes with focus still in it, focus returns to the element it came from, or
  to the main landmark when that element left with the action (a removed
  row). While a record dialog is open the toast is drawn inside it, so it
  takes focus and answers a click there; with the element focus came from
  gone, focus returns to the dialog's close button. Closing the dialog while
  an undo is on offer leaves the toast on the page for the rest of its time.
- The footer carries the full DPCGL licence notice (`dict.ts`'s
  `footBefore`, `footLink`, `footAfter`, the text `tests/derived.js` pins)
  on every page, folded in a native `<details>`: its `<summary>` is one line,
  «Daggerheart © Darrington Press - DPCGL - Источники и лицензия» /
  "Daggerheart © Darrington Press - DPCGL - Sources and licence"
  (`footSummary`). A click or Enter opens it; the summary takes the global
  focus ring. DPCGL clause 4.1 asks for the notice in the shared material
  and sets no visibility rule (checked against the licence of 2025-07-30).
- A footer nav row above the licence notice links the site's static pages
  (`META.md` section 9, "Static pages"), on every page, in this order:
  «Установить как приложение» / "Install as an app",
  «Конфиденциальность» / "Privacy" and «Условия использования» / "Terms of
  use". Every link opens the copy of the page in the language on screen:
  `pages/<id>.html` in Russian, `pages/en/<id>.html` in English
  (`AppState.pagesDir`). The install link is left out inside the
  installed app (`display-mode: standalone`, or iOS
  `navigator.standalone`), where the step is done; the two policy links
  are always drawn.
- Each site page links back to the app at its top and its bottom and
  returns to the screen the reader left (`META.md` section 9, "Static
  pages").
- The account control sits 8px after the language switch, in a build with
  sign-in configured only, and only once the session is known (a signed-in
  reader never sees «Войти» flash). It is a link to `#/account` on
  `Seg`'s track: signed out, the person icon and «Войти» / "Sign in", the
  label visually hidden below 420px (it stays the name); signed in, a 38px
  circle (44px at 600px and below) with the email's first letter
  (the icon when there is no email), named «Аккаунт: <email>» / "Account:
  <email>". On `#/account` it carries `aria-current="page"` and the gold
  ring. A build with no sign-in draws no control at all.
- No tab is lit on a record, a list page, a print sheet or the account page -
  the live `renderTabs` compared against the raw route string, and none of
  those route kinds was ever that string.
- Under `prefers-reduced-motion: reduce` every transition and animation stops
  moving and waits out no delay - a blanket kill (`tokens.css`), not the live
  app's own two named exceptions - including the table page's scroll to a
  linked row or section, which jumps instead of easing (`Env.motion`: a
  call-site `behavior` is out of CSS's reach).
- Every focusable control gets the same gold keyboard-focus ring, at the
  control's own border-radius where a component sets one and `--r-sm`
  otherwise (a scoped rule always outranks the unscoped global one - `.seg
  button`'s 999px is untouched) - a global rule (`tokens.css`) rather than
  the live app's closed list of 18 selectors at an 8px radius, with
  everything outside that list falling back to the browser's own outline.
  Broader coverage was the owner's call.
- Self-hosted fonts were considered and dropped: the app declares `Inter,
  -apple-system, 'Segoe UI', Roboto, ...` with no `@font-face` (`tokens.
  css`), so glyphs depend on the machine. The five weights in use (650, 680,
  620, 560, 540) render as authored only with a variable font, and the print
  card needs a real italic - both argue for self-hosting, but the owner
  decided against it.
