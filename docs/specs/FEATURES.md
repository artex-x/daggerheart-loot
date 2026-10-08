# Features, and the state each one needs

Written from the code as it stands, so a rewrite has something to be measured
against. Route grammar is in `ROUTES.md`, storage in `STATE.md`, frozen formats
in `CONTRACTS.md`.

## Rolling

Seven modes. Each keeps its own input in memory only. A mode starts at its
first row on every visit: a switch between two modes carries no number
across.

| Mode | Input | Produces | State |
|---|---|---|---|
| Core rules | 1-60, or Nd12 for N in 1..5 | up to 4 records: item and consumable, from each picked source | `std {n, src{core,hnf}}` |
| Alternate tables | rarity + Hope die + Fear die | 4 records | `alt {rarity, hope, fear}` |
| Wondrous | 1-119 | 1 | `wond {n}` |
| Dread | 1-29 | 1 | `dread {n}` |
| Vault of Ages | section + roll within it | 1 | `voa {k, n}` |
| The Dragon's Vault | 1-145 | 1 | `dv {n}` |
| Arazo's Artifacts | 1-78 | 1 | `arazo {n}` |
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
  the short wording is the fix. A strip under 500 px wide has a 300 px cap:
  eleven group chips (twelve signed in, with Homebrew) wrap to six rows. At
  360 px a strip with subchips measures 298 px, signed in or out, and a
  strip without them 256 px (measured 2026-10-07). No group label is short
  enough to put three chips on one row, so a shorter label is no fix here.
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

- 18 tables (`TABLE_IDS`), each with its own search box and a list/grid switch;
  the eighteenth, `homebrew`, has its group chip signed in only.
  The switch changes the view until the page reloads; the default is the
  Display section's «Таблицы» row ("Account"). While the view differs from
  the default, a build with sign-in draws the note «Только до перезагрузки.
  Чтобы сохранить, измените в настройках аккаунта.» under the toolbar, its
  last words a link to `#/account`.
- Search covers all 1350 records: names, descriptions and stat lines, both
  languages at once; `#/search` shows the first 300 matches - the cap is that
  page's alone, a table's own box is not capped. Once a query exceeds 300
  hits, a "300 из <n>" line - the same shown-of-total wording the table
  filter strip's own count already uses - says so above the rows; under the
  cap nothing is said, because the count on screen already
  is the whole answer. A signed-in author's own items rank with the
  catalog's matches, the catalog's record first on a tie, and the 300 cap
  counts both. While the account holds items the
  intro adds «И N ваших предметов.» / "And N items of your own." after the
  catalog count, whatever the chip below.
- Search folds case, `ё`/`е`, typographic apostrophes (U+2019, U+02BC), Latin
  diacritics (`ä`/`ö` etc., NFD-stripped - Cyrillic is excluded so `й` never
  merges into `и`) and the Unicode minus sign (U+2212 -> `-`) on both the
  query and the catalogue, so `плетеная` finds "Плетёная", a query typed with
  the typographic apostrophe autocorrect produces (`keeper’s staff` -> the
  now-ASCII "Keeper's Staff") still finds it, `zweihander` finds
  "Zweihänder" and `-1` finds a "−1" penalty. A query is words in any
  order: each word must appear in the record's name, description or stat
  line, in either language, as typed or in another form of the same word by
  its Snowball stem (`мечи` finds «Меч», `potions` finds "Potion"; «зелёный»
  does not answer `зелье`; `allies` finds "ally" and `enemies` finds
  "enemy", although the English stem is not a prefix of either). A word
  that is its own stem is matched as typed, so `move` does not reach
  "moving" while `moves` does. A phrase in quotes (`"ring of"`, `«ring of»`)
  matches as typed, in one field. No near misses: `лук` does not offer
  «клык». `#/search` ranks its hits - names before descriptions, a word
  start before a match inside a word - and a table keeps its own order.
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
  two books**: 437 weapons, 127 secondary, 108 armour. The `src` facet is how you
  narrow to Core and Hope & Fear (239 / 73 / 69). Frame, Vault of Ages,
  The Dragon's Vault, Arazo's Artifacts, Wondrous and Dread equipment appears there too.
- An equipment table is sectioned by tier, `Ранг 1` to `Ранг 4`, then
  `Артефакты` (key `tA`) for equipment the book prints in its Artifacts
  section (`eq.tier: 'A'`); a section with no rows is not drawn. The stat
  line, copied text and the stub page read `Артефакт` / `Artifact` where the
  rank goes; the tier facet offers an `A` chip, `Артефакты` / `Artifacts`
  (the section's label, as on the `voa` table), only on a table whose kind has
  such a record; the suggested price is the legendary item band.
- A signed-in author's own equipment joins the equipment table of its type,
  in its tier section after the books' records. The `src` facet then offers
  `hb` («Хоумбрю», own items with no source) and each own source after the
  books, sources by name.
- **`#/tables/homebrew`**: the author's own items. With items in one
  source, one section per source and section in the `#/homebrew` order
  («Мастерская Ольхи · Холодное оружие», then the source's items outside its
  sections under the source name, the items with no source under «Хоумбрю»
  last), the rows by name. With items in two or more sources, one source chip
  per source as the table nav's second row (sources by creation, «Хоумбрю»
  last, no count), one always on, and the table shows that source only: its
  sections in order under their own names, then «Без раздела» for its items
  with no section; «Хоумбрю» has one heading «Хоумбрю». A chip is the `src`
  filter with one value (`f_src-<key>`, `f_src-hb`); `src` takes one value
  on this table, and two sources' values do not combine (`ROUTES.md`,
  "Homebrew"). The bare address picks the first chip and is kept; an anchor
  picks its source's chip and is kept; an address with a second `src` value,
  a value that names no held source or a `sect` value that is not a section
  of the chosen source is rewritten once to the chosen chip. A chip keeps `kind` and drops `sect`,
  keeps the ticks and does not open a folded filter panel. Facets: `kind` and
  `sect` of the shown source's items, by the offer rule below (a section
  labelled by its name); no `src` row. Every facet write, «Сбросить все» included,
  keeps the chosen chip. «Ссылка на таблицу» copies the chosen chip's address
  (the bare address with one source), «Ссылка на фильтры» the filter with the
  chip. What the chips drop with two or more sources (owner accepted
  2026-10-07, option A): one table of every own item (the bare address, its
  grid view, its search box and a `kind` pick across all sources), a union of
  sources (`f_src-a-b` draws `a` only), a union of two sources' sections, and
  «Ничего не найдено» for an unknown `src` (it draws the first chip). The
  Items tab of «Мои предметы» lists and searches every own item, and
  `#/search` merges the own items with the catalog. A section anchor is the
  section's key, a source anchor its key (the source's items outside its
  sections), `hb` the items with no source; a row anchor that arrives with
  the page plays once the own items load. Signed out the page
  draws the sign-in prompt «Войдите, чтобы видеть свои предметы в таблицах.»
  and no toolbar; while the session or the items load, «Загружаем...»; a
  failed read, «Не получилось загрузить ваши предметы.» and «Повторить»; no
  own item, «Своих предметов пока нет.» and «Новый предмет»; a build with no sign-in
  configured, the not-found page with the address kept. A pin may hold it.
- **The «Свои предметы» switch** / "Own items": on `#/search` (under the
  kind row, apart from the filter chips) and in the equipment tables' toolbar
  (after the view switch), drawn only while the account holds an item. It is
  a labelled switch (`role="switch"`, Space toggles it, the gold focus ring).
  It is on by default; off, it removes the own records and their `src` values
  from those pages for the visit. The kind row's «Нужен хотя бы один тип»
  applies to the three kinds only. A record dialog, a list, `#/i/<key>`,
  `#/tables/homebrew` and the relation lines of a catalog card or row still
  draw them. It is memory only (`STATE.md`).
- The filter panel is one component across all tables and the shared list page
  ("Lists"); where a table has nothing to filter by, there is no panel. A row offers only values
  the drawn rows answer and shows only when it can narrow; a picked value stays offered as a pill
  (owner, 2026-10-08). On `#/tables/homebrew` the drawn rows are the chosen source's. Nothing is selected by default and an empty
  row means "any". Chosen values show as pills outside the panel, with a reset
  and a copy-link button, so they are reachable while the panel is folded.
  Values in a row combine with *or*; a link naming two frames opens both.
- Filter state lives in the address (`STATE.md`), written with `replaceState` on
  every change, and read back only when the segment actually changed; on a
  share link too; on `#/l/` it is page memory.
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
- A card of the index names its list and, under the name, a meta line in the
  edit time's type: the count of the entries the data still knows in words,
  «9 позиций» / "9 items", and on an account list the edit time after it,
  «9 позиций · изменён 3 дня назад». No gold badge: that look is a roll
  number's. An account card's link name is the name, the count, the edit time
  and any pending requests.
- Signed in, with the account lists read, each account card carries a pick
  box in its top right corner, outside the card's link: a 32 px box with a
  44 px target, named «Выбрать: <name>» / "Select: <name>"; a ticked card
  takes a gold border. Browser cards have none. Over the account cards sits
  the selection strip the list page draws over its rows: «Выбрать все» /
  "Select all" (mixed while some are ticked; its visible text dropped while
  anything is ticked), the polite summary «Выбрано N», and while N > 0
  «Скачать JSON (N)» and «Удалить (N)»; at 640 px or less the two actions take
  their own line, half the width each. «Выбрать все» ticks the drawn cards
  only, and the ticks are always a subset of the drawn cards: a search, a
  fold back to 24, a delete or a re-read that removes a card, or a sign-out
  drops the ticks that leave the view, and a card that comes back is not
  ticked. The ticks are page memory and start empty on every visit.
  «Скачать JSON (N)» downloads the ticked lists as one lists file ("Account
  and browser lists", "Exports") and keeps the ticks. «Удалить (N)» asks the
  browser's confirm «Удалить списки (2): «Пустой список», «Трофеи»? Ссылки для
  игроков и мастера на них перестанут работать. Отменить удаление нельзя.»,
  naming the first five lists, then «и ещё N»; «Отмена» changes nothing and
  keeps the ticks. On yes the lists go at once through the write buffer, as
  one delete does, the ticks clear, and the toast «Удалено списков: 2» has no
  «Вернуть». A removal the server refuses draws that list again with one
  «Изменение не сохранилось...» toast; the others stay deleted.
- Signed in, with the account lists read, the «Новый список» panel has «Импорт
  из файла» / "Import from file" under the name row, a toggle that opens the
  field «Импорт из файла JSON» / "Import from a JSON file" in the same panel:
  «Выбрать файл...», the chosen file's name, and a hint that links the published
  schema (`schema/import-v1.json`) and `llms.txt`, relative, in a new tab. The
  toggle and «Отмена» fold the field and forget the file, and the focus returns
  to the toggle. A file of more than 5 MB is refused before it is read; a file
  that starts with a zip's signature is read as the data zip ("Account and
  browser lists", "Exports"), anything else as UTF-8 text. A zip of more than 10
  MB is refused before it is read, «Архив больше 10 МБ.»; a zip's chosen data
  file of more than 5 MB reads «Файл больше 5 МБ.». The import reads versions 1,
  2 and 3. A version 3 entry keeps its «Только для мастера» mark, on its link
  or on its fixed copy's link; `gm_only` in a version 1 or 2 file is an
  unknown field. A homebrew entry of a version 2 or 3 file imports as a link
  to the own item when the account holds its key; any other with a snapshot
  becomes a new own item in «Хоумбрю», made from it, and the entry links it;
  one without a snapshot is skipped (`CONTRACTS.md` section 4). One copy is made
  per distinct key and snapshot: a later entry of the same key with another
  snapshot gets a new key, and cards likewise. The copies count against the
  item and card limits and `import_homebrew`'s 1000 rows; past either the
  import is refused whole and nothing is written. A homebrew entry is never
  skipped as unknown; its snapshot is optional, and one that is present is
  checked whole. Its own refusals read «snapshot: не копия предмета - сверьте
  поля с описанием в llms.txt» and «id «...»: не ключ своего предмета - hb_ и
  16 знаков a-z, 2-7». While the account's own items load, a version 2 or 3
  file with a homebrew entry, with or without a snapshot, draws «Ваши
  предметы ещё загружаются - повторите через секунду.» in place of the preview,
  and the preview once they are read. When the account lacks some of its own
  items, the preview says «Своих предметов, которых нет в аккаунте: 2 - они
  станут вашими копиями в «Мои предметы».». A snapshot without a text the schema requires
  (the record's four, a set card's four, a rule card's seven) is refused as not
  a copy. A file the app refuses whole says why in one alert line: not JSON, not
  a lists file, another version or none, no lists, not a data archive, a zip
  with no `lists.json`, with two at one depth, or compressed by another program.
  A file with field errors draws «В файле ошибки - ничего не импортировано.
  Исправьте их и выберите файл снова.», the file's own errors in the alert box,
  then one block per list with errors, headed «N. <name>» (cut to 40
  characters), each line naming the entry's position and record where it has
  one, the field, the reason and the JSON path; at most ten lines a list, then
  «...и ещё N в этом списке», and past 50 errors «...и ещё N ошибок». A clean
  file draws the preview «Списков: 2, позиций: 3.» with «Пропущено позиций: 2.»
  when entries were skipped, and a report grouped by list when a list has a skip
  or a name the account holds: an unknown id, a repeated id and an own item
  without a snapshot that the account does not hold («пропущена - этого своего
  предмета нет в аккаунте: сначала импортируйте файл предметов на странице «Мои
  предметы»») are skipped and named with their positions, and a name the account
  holds is allowed and noted («...появится второй»). A skipped entry is no first
  entry: a later entry of its key is read as if the skipped one were absent.
  The report draws the first 20 list blocks, then «и ещё N списков» /
  «свернуть» (rule 12); the skips are grouped by list once, so 1000 lists of
  skips draw at once. A zip's `homebrew.json` draws one line, «Файл
  homebrew.json из архива импортируется на странице «Мои предметы».»; its other
  files are named under the preview (the first five, then «и ещё N»), and its
  lists import. «Импортировать (N)» and «Отмена» are disabled while the import
  runs; success folds the field, draws the new lists first and toasts
  «Импортировано списков: N»; a limit toasts the limit text, a statement timeout
  «Файл слишком большой для одного импорта: разделите его на несколько.», a
  refusal by the server «Сервер не принял файл: данные в аккаунте изменились.
  Нажмите «Импортировать» ещё раз.» (an own item a link names was deleted
  after the preview; the account's items are read again), anything else «Не
  получилось. Проверьте соединение и попробуйте ещё раз.», and the preview stays
  for another press, which sends the same ids, unless an own item that a kept
  entry without a snapshot links went, and the file was read again; the copies
  a failed lists call left in the account are held keys then, and the retry
  links them. A kept entry without a snapshot whose item goes reads the file
  again, with new ids: after the server refuses such a link, the entry becomes
  a skip and the next press imports the rest. A skipped entry whose item comes
  later stays skipped: choose the file again.
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
  art: "Взять [Мин|2|Макс] из 5 = 1 мешок" / "Take [Min|2|Max] of 5 = 1 bag",
  the line sum (price x taken count) only for a priced entry. The count
  field sits between «Мин» and «Макс» / "Min" and "Max" in one joined
  control: «Мин» sets the count to 1, «Макс» to the whole quantity, and each
  is disabled at its end. At 600 px or less the control is 36 px tall and
  each end at least 44 px wide. The field narrows the count to
  1..quantity; an emptied field puts its value back on commit. The count lives in memory only and clears with its
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
  "Выбрано N". The bar is a region named «Выбранные записи» / "Selected
  records": it sits after the footer, outside every other landmark.
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
  - opening the page, and after every writer on it. A read-only browser list
  (after the cutoff, or while the move is due) keeps the address it opened at.
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
  page do not draw it. From 8 entries the page draws the share link's search
  box and filter ("The shared page `#/s/<token>`" below) as page memory: the
  address stays as it opened, no copy-link button is drawn, and a reload or
  another list starts unfiltered. A link
  written before the checksum that names no entry is still damaged; an
  empty list's own link opens it. A payload that cannot be
  decoded draws "Предмет не найден", the bad-link line and a "На главную"
  button to `#/roll/std`. A **packed** link (`#/l/~<payload>`) that cannot be expanded
  draws the same bad-link page without replacing the address - the live
  shape sent the reader to `#/l/zzzz` instead, which cost a slow unpack
  resolving after the reader had already moved on the shared list they had
  since left for.
- Two open tabs merge rather than overwrite (`STATE.md`); after the cutoff a
  browser list is written only by the move and by a delete.
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
  In a build with sign-in configured, while no account owns this browser's
  lists, the unfolded notice adds «Войдите до 26 октября 2026 года - и они
  перенесутся в аккаунт. После этой даты приложение перестанет их
  показывать.», the words of the move banner ("Account and browser lists").
  After the cutoff the notice is «Списки в этом браузере только для чтения
  с 26 октября 2026 года.», not dismissable and drawn even after a dismissal,
  with «Войдите - они перенесутся в аккаунт, и их снова можно будет
  править. Скопировать текст и напечатать можно и так.» while no account owns
  the lists.

### Account and browser lists

A build with sign-in configured keeps a signed-in reader's lists in the
account (`docs/specs/META.md` section 3). A signed-in reader's browser lists
move into the account by themselves, with no press (below). From 2026-10-26
(`LEGACY_WRITE_UNTIL`, 00:00 UTC) browser lists are read-only and `#/l/` links
stop opening. A build with no sign-in configured moves nothing and keeps its
browser lists writable after the date.

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
- **The index**: the heading «Мои списки» / "My lists" (the menu item's
  name; the tab bar keeps «Списки» until the cutoff). Signed in, the create
  panel, then the group «Ваш аккаунт» / "Your account" - the count «3 списка
  из 50» / "3 lists of 50" (the limit from `my_limit()`, an override's own
  number; «3 списка» when the limit read failed; with a known limit «0
  списков из 50» too), the selection strip, then the account lists, newest
  edit first, each card with its pick box, the meta line «N позиций · изменён
  N назад» / "N items · edited N ago" under its name (`I18N.md`) and one
  «Удалить»; «Загружаем...» while the first read runs; «Не получилось
  загрузить списки аккаунта.» and a small «Повторить» when it fails; «В
  аккаунте пока нет списков - создайте первый выше.» under the count when
  there are none. Then «Этот
  браузер» / "This browser" with the storage notice at its head and today's
  cards. Signed out, the browser group has no heading and is drawn only when
  there are browser lists or storage is broken or unreadable; with no sign-in
  configured it is always drawn.
- **An account list's page** counts its entries under the title against the
  entry limit, «10 позиций из 100 · Сохранено» («10 позиций · Сохранено»
  when the limit read failed); the name stops at 200 characters and each
  note at 4000 (`maxlength`, no counter). It keeps its address
  `#/lists/<uuid>` (no `#/l/`
  rewrite), draws «Поделиться» / "Share" first in its actions in place of
  "Ссылка игрокам"/"Ссылка себе", «Скачать JSON» / "Download JSON" after
  «Скопировать текст», no storage notice, and says its save status
  after the count: «Сохраняем...», «Сохранено», or
  «Не сохранено» in the danger colour and «Повторить». Only the failure and
  the save that ends it («Сохранено») are announced (a permanently mounted,
  visually hidden status region); the next save empties the region. Every
  edit shows at once and waits in one buffer; two seconds after the last
  edit the buffer is sent as one request, in order, and repeated edits of
  one field go as one write (ten presses of «+» send the final quantity
  once); making and deleting a list go through the same buffer. The buffer
  is sent at once when the tab is hidden or closed, on sign-out (which
  waits for it 5 s at most), before «Поделиться» reads the links, before
  «Сохранить себе» on a shared page makes its copy, and before the move. «Сохраняем...»
  shows from the first buffered edit until the send lands. A write with no
  network, or with a lapsed session, stays in the buffer and is sent again
  every 15 s, when the tab is shown again, after the next edit's quiet
  window, and on «Повторить»; a reload while «Не сохранено» loses it. A
  send with no answer in 20 s counts as no network: «Не сохранено», and it
  is sent again. When
  the tab is hidden or closed, the buffer is sent at once as one request
  that outlives the page; an edit made while an earlier send is still on
  its way, a buffer of more than 60 000 bytes, or, after a split, every
  edit past the first capped request, may be lost when the tab closes (only
  that first request goes at a close); a sign-out in another tab drops this tab's unsent edits. A limit
  or another refusal drops that write, toasts, and shows the list from the
  account again. An edit to a list or an entry that was deleted meanwhile,
  on another device or in another tab, is dropped with no toast, together
  with that list's or that entry's other waiting edits, and the account is
  read again; the page of a deleted list then says «Список не найден». A
  send that the server fails three times in a row, at
  least 15 s apart, is split in half, and each half is sent on its own; a
  single edit that the server still fails three times is dropped as
  refused, with the toast, and the account is read again. A lost network, a
  server that does not answer or a database that is restarting is waited
  out, never split. An old `#/l/` link saved over the entry limit makes no
  list, and the toast names the limit.
- **Own items in lists** (`docs/decisions/2026-10-07-an-item-is-read-by-its-id-by-anyone-a-list-holds-a-live-link.md`):
  an account list holds catalog records and homebrew items, all drawn as any
  row. A catalog record is written as before. A homebrew entry is a live link
  to one item by its id (`hb_item`), the account's own or another
  account's: it draws the item as it is now, in the list, on its share links
  and in their projection; an own item offers «Изменить» in its modal. An
  edit of the item, its source or a card it names moves the `updated_at` of
  every list that links it, so the index says «изменён только что» and sorts
  that list first; a delete of the item removes its entry from every list. A
  list reads the items of other accounts it links in one call per read
  (`get_homebrew_items`, at most 1000 ids a call); until that read answers,
  or after it fails, such a row draws as a record the page does not know, and
  the next read asks again. Another account's item joins the list page, the
  share page, the index's count and thumbs, the requests panel and the print
  sheet, and never search, tables or `#/i/`. The entry is decided by the
  key: an own key links the own item, another homebrew key links the item of
  the record the page holds (the open share's first, then the account's
  lists), and a key with neither is not written. While the account's items
  are still read, no homebrew entry is written, and «Добавить в список» says
  «Ваши предметы ещё загружаются - повторите через секунду.», or «Не
  получилось загрузить ваши предметы.» after a failed read. «Сохранить себе»
  on another user's link copies its links. An undo of a removed entry, from
  the row's cross, «Удалить (N)» or the record's list menu, writes back the
  same link; a link whose item was deleted meanwhile is refused as any
  write. `#/print/` prints an own item and another account's linked item of
  an account list, with the item's path as its source line.
- **«Свой предмет»** / "Own item"
  (`docs/decisions/2026-09-30-a-list-page-makes-a-plain-homebrew-item-in-one-press.md`,
  `docs/decisions/2026-10-01-the-quick-item-opens-under-a-lists-entries.md`):
  on an account list, a row «Свой предмет» after the last entry (pressed
  and expanded while open, folded on another list; on a window of 600 px
  and more it adds the grey hint «название и описание, остальное потом в
  редакторе») opens «Свой предмет в этот список» under it: «Название» *
  (focused; at most 120 characters), «Описание» (at most 3000, with the
  counter «N / 3000» past 2500), «Добавить в список», «Отмена» and the note
  «Предмет сохранится в «Мои предметы», в «Хоумбрю». Вид, источник и
  остальное можно задать потом в редакторе.». «Добавить в список» (or Enter
  in the name) makes a plain item in «Хоумбрю», awaited, then adds it to the
  list through the buffer as a link (last, right above the row), clears
  the fields, focuses the name and toasts «Предмет «%s» создан и добавлен в список»
  with «Изменить», which opens the item's editor in a new tab. No name draws «Введите
  название.» under the field; the item limit and a lost network («Не
  получилось создать предмет. Проверьте соединение - текст остался в
  форме.») draw under the buttons; each keeps the text. At a full list (its
  entries at the entry limit the account read) a press writes nothing and
  draws the entry limit text under the buttons, so no item is made that the
  list would refuse; with no limit known the press writes as before. A press
  sent again after a lost answer makes no second item. Escape and «Отмена»
  close the panel, drop the typed text and focus the row. An empty account list draws the row under its hint, which adds «Свой
  предмет можно создать здесь же, кнопкой ниже.». A browser list has no row.
- **Share links**: «Поделиться» reads pressed and expanded and opens a panel
  under the actions with two rows, «Ссылка для игроков» and «Ссылка для
  мастера», both ready on open: the panel reads the list's links (stopped
  ones too) and makes a link only for an audience that never had one, the
  players' first. An active row shows its link as the in-app address
  `#/s/<token>` and two buttons: «Скопировать» copies `<site>#/s/<token>`, or
  `<site>en/#/s/<token>` in English, and toasts «Ссылка для игроков
  скопирована - заметок и позиций «Только для мастера» в ней нет» / "Players'
  link copied - it carries no "GM only" notes or items" or «Ссылка для мастера
  скопирована - в ней есть заметки и позиции «Только для мастера»» / "GM's
  link copied - it carries the "GM only" notes and items"; «Удалить ссылку» stops the link
  at once, asks nothing and toasts «Ссылка удалена: по ней список больше не
  откроется.». A row whose links are all deleted says «Ссылка удалена» and
  offers «Создать ссылку» alone, which makes a new link and toasts «Ссылка
  создана.»; the next open does not make one by itself. Replacing a link is
  delete, then create. Under the rows a hint says what the two buttons do,
  that the players' link hides the «Только для мастера» notes and items and
  that the GM's link shows them. «Загружаем...»
  while the links are read; «Не получилось загрузить ссылки.» and a small
  «Повторить» when the read, or a link it had to make, failed; a failed change
  toasts «Не получилось изменить ссылку. Проверьте соединение и попробуйте ещё
  раз.», keeps
  the row, and reloads the panel when it was refused. A row's buttons are
  disabled while its change runs. An empty list can be shared. No account
  list's page or panel writes or copies a `#/l/` address.
- **«Только для мастера» / "GM only" entries**
  (`docs/decisions/2026-10-08-a-gm-only-entry-is-dropped-by-the-share-projection.md`):
  each row of an account list's page draws an eye between «Заметка» and
  «Убрать из списка», named «Только для мастера: <name>» with `aria-pressed`
  and the title «Только для мастера»; pressed, it draws the crossed eye in the
  note button's pressed look. A press marks or clears the entry through the
  write buffer, with no toast. A GM-only row has a dashed border, the
  recessed ground and its art at 45%, on the owner's page and on the GM's
  link; no text on screen marks it, and the row's button names the state
  after the name for a screen reader («Брошюра по Истории Искусства, Только
  для мастера ...»). While any entry is GM-only the sub adds the count between
  the entry count and the save status, «10 позиций из 100 · только для
  мастера: 2 · Сохранено»; at none the sub is unchanged. The selection bar
  draws «Скрыть от игроков (N)» while any ticked entry is shown to players,
  else «Показать игрокам (N)», before «Удалить (N)»; a press keeps the ticks
  and toasts «Скрыто от игроков: N» / «Показано игрокам: N» for the entries
  it changed, with «Вернуть», which puts back only those. «Скопировать
  текст» is the players' text: it leaves GM-only entries out as it leaves out
  the GM notes, and a shown entry still names a GM-only record it upgrades
  into. The selection's «Скопировать», «Печать», the list roll, its numbers
  and the counts keep every entry. A browser list has no eye and no bar
  action.
- **The shared page `#/s/<token>`** draws the list as the link's audience sees
  it, read-only for everyone, the owner included: the name, today's
  «Список от другого игрока · N позиций», «Обновлено N назад» / "Updated N
  ago" under them (`I18N.md`), «Сохранить себе», the notes the link shows (a
  GM link adds the «Только для мастера» notes) and the rows, with the
  selection bar as on a `#/l/` page. A ticked entry the list no longer holds
  leaves the selection when the page draws the list again. While the share's Realtime topic is
  joined it draws an owner's edit within about a second; it also reads the
  list again when the tab is shown again, every 45 s while Realtime is not
  joined, and every 5 minutes while it is, signed in or not; a failed first
  read is read again on the same signals, with no press. A visually hidden
  status says «Список обновлён» / "The list was updated" once per change of
  what the page draws, and nothing for a change the link does not show (a GM
  note on a players' link). The relative time moves with the 45 s clock and
  after each read that changed the list. The owner, signed in, sees «Это ваш список.» and «Открыть
  для правки» to `#/lists/<uuid>` above the title; on a players' link, while
  the list holds GM-only entries, the line adds «Только для мастера: N - по
  этой ссылке их не видно.» / "GM only: N - this link does not show them."
  between the two, once the account's lists are read. «Сохранить себе» saves a
  copy into the account with only the notes the link shows (a player link's
  copy has no GM note) and opens it; signed out it opens the sign-in prompt
  under it, and after the sign-in the copy is made by itself; a refusal
  toasts the limit text or «Не получилось сохранить список себе. Проверьте
  соединение и попробуйте ещё раз.». A stopped, deleted, unknown or empty token, and every token in a
  build with no sign-in, draws «Список больше не доступен» / «Владелец удалил
  эту ссылку или список.» and «На главную», the address kept, never the home
  page; a read that failed draws «Список не загрузился» / «Проверьте
  соединение и нажмите «Повторить».» and «Повторить». Nothing is drawn while the first
  read runs. A re-read names the revision the page shows, and a list still at
  that revision answers with nothing to download or draw.
  A players' link never holds an entry its owner marked «Только для мастера»
  / "GM only": the server leaves the entry out with its linked item's id, and
  numbers the rest from 0, so the count, the rows and the selection know only
  the rest; a GM's link holds every entry with its mark and draws a GM-only
  entry in the GM-only row look. «Сохранить себе» from
  a GM's link keeps the mark on each copied entry; a players' link's copy has
  no such entry.
  From 8 drawn entries (`LIST_SEARCH_AT`), or once a query or a filter value
  is set, one block sits between the notes and the rows: the tables' search
  box («Поиск по названию или описанию…», matched as a table's box, never
  over the list notes) and the table filter strip and panel ("Tables and
  search"). Once drawn the block stays until another list opens: dropping the
  last pill, clearing the query or a re-read that shrinks the list never
  removes it. The strip is drawn only while a row can narrow, so a list of
  alike entries shows the search box alone. The rows are Тип / Type
  («Предметы», «Расходники», «Оружие», «Вторичное», «Броня»), Источник /
  Source (the books in book order, «Сообщества», the frames, then
  «Хоумбрю» and each own or linked source by name), Ранг / Tier, Класс,
  Характеристика, Дистанция, Хват and Линейка. A row offers only the values
  the entries the page draws answer, so a players' link never offers a
  GM-only entry's value, and is drawn only with two values or more, or one
  value some entry lacks; a row never narrows by the picks in another row,
  and no chip carries a count. The filter lives in the address,
  `#/s/<token>/f_<filter>` (`ROUTES.md`), written in place; a filter link
  opens the panel. While a value is picked the strip draws the copy-link
  button: it copies `<site>#/s/...` or `<site>en/#/s/...` and toasts
  «Ссылка на фильтры скопирована» / "Filter link copied"; on a GM's link
  it toasts «Ссылка на фильтры скопирована - это ссылка для мастера: в ней
  есть заметки и позиции «Только для мастера»» / "Filter link copied - it is
  the GM's link: it carries the "GM only" notes and items". A value no drawn
  entry answers (an old link, an entry the owner removed) draws no pill and
  narrows nothing, where a table empties; the address keeps it until the
  next change of the filter, it applies again if an answering entry comes
  back first, and the copied link holds only the values in force. No match
  draws «Ничего не найдено» and, while a value is in force, «Сбросить всё».
  A ticked entry the filter hides stays ticked and counted; «Выбрать все (N)»
  ticks the drawn rows only. The sub keeps the whole count. The owner's list
  page `#/lists/<id>` has no filter.
- **Not found**: an account address signed out draws «Список не найден», «Если
  это список из вашего аккаунта, войдите, чтобы открыть его.» and one
  «Войти», which returns to that address; nothing while the session or the
  first read is pending; the heading «Список не загрузился», «Не получилось
  загрузить списки аккаунта.» and a primary «Повторить» when the read failed
  (never «Список не найден», which would call a list missing that may exist);
  today's not-found page for an id the account does not hold.
- **Delete** asks through the browser's confirm «Удалить список «%s»? Ссылки
  для игроков и мастера перестанут работать. Отменить удаление нельзя.»; the
  toast has no «Вернуть». On the list page it returns to `#/lists`.
- **Sign-out** on an account list's page replaces the address with `#/lists`;
  no account list stays on screen.
- **Two devices**: signed in, every page joins the owner's Realtime topic from
  the account's first read until sign-out; the owner's other tabs and devices
  then redraw a change within about a second, once no write of theirs is
  buffered or in flight, and a tab's own writes cause no re-read. Every page
  also reads the account again when the tab is shown again and every 5
  minutes while the owner's topic is joined; the index and an account list's
  page read it every 45 s while Realtime is not joined. Each read waits until
  no write is buffered or in flight. A re-read asks for each list's revision
  and fetches the lists whose revision moved (every list when more than 50
  did); a page load reads every list. A shared page
  `#/s/<token>` reads its list again on the same signals. The last write wins per entry and there is no conflict
  dialog. A reorder made
  on a device with an old entry set keeps the given order and puts the
  other entries after it; nothing is refused. A read that
  finds nothing new redraws nothing. «изменён N назад» and «Обновлено N
  назад» move with the same 45 s clock while the page stays open.
- **Purchase requests: the send**: on a `#/s/` page every reader but the
  list's owner, signed in or not, has «Сообщить владельцу» / "Notify the
  owner" last in the selection bar's actions, on its own line at 600 px or
  less. It sends the owner a request for the ticked entries with their taken
  counts; while it runs it reads «Отправляем...» and is disabled. Success
  keeps the selection and its counts, toasts «Запрос отправлен владельцу
  списка.», and the button reads «Запрос отправлен» / "Request sent",
  disabled while the ticked entries and counts are the ones sent; a changed
  tick or count enables it again, and «Снять выделение» or leaving the page
  ends it.
  Refusals toast an error and keep the selection: «Слишком много запросов по
  этой ссылке: подождите минуту.» (5 a minute per link), «У владельца уже 10
  запросов без ответа. Попробуйте позже.» (the pending cap, with its number),
  «Список изменился. Проверьте выбор и отправьте снова.» (an entry the list no
  longer holds, or, through a players' link, one marked «Только для мастера»;
  the page reads the list again), «Не получилось отправить.
  Проверьте соединение и попробуйте ещё раз.» (no answer in 20 s; a second press sends the same
  request again, which the server stores once), the line limit as «В
  запросе может быть не больше 100 позиций, а отмечено 101. Снимите лишние
  отметки и отправьте ещё раз.» (the limit the server applied and the count
  sent; the reader cannot read the owner's limit, so no line warns before
  the send, and no text asks the reader to write to the address), and
  «Сервер не принял запрос.»; a stopped or deleted link draws
  «Список больше не доступен». The requester sees no answer from the owner:
  the toast is the only answer, and an applied request reaches an open page
  as a lowered or removed entry, as any owner edit. Nothing of a request is kept in the
  browser.
- **Purchase requests: flow b**: after an add from a `#/s/` page's selection
  bar (never a card's own menu), signed in and not the owner, `notifyGm`
  decides: «Спрашивать» replaces the bar's actions with «Сообщить владельцу
  списка, что вы взяли эти предметы?», «Сообщить», «Не сообщать» and
  «Запомнить ответ», the ticks kept, and the question takes the focus; after an
  answer the focus returns to «Добавить в список». «Сообщить» sends every
  ticked entry with its taken count, one the reader's list already held
  included, and the toast becomes «Добавлено в «...». Владелец получил
  запрос.»; «Запомнить ответ» saves the answer as «Сообщать владельцу» or «Не
  сообщать». «Сообщать владельцу» sends with no question; «Не сообщать» sends
  nothing. An add of a selection already sent asks nothing and sends
  nothing. Clearing the selection or leaving the page drops an unanswered
  question.
- **Purchase requests: the owner**: an account list's page draws «Новое в
  списке (N)» / "New in this list (N)" after the actions (and an open share
  panel), before the money row, while a pending request that has not
  expired, a decision of this page load, or a notice of the list's change
  log exists; N counts the pending requests and every notice, read or not
  (the change log below). Each request, newest first, names its link, its age and, once
  it is read, the time to expiry («По ссылке для игроков · 10 минут назад ·
  истечёт через 50 минут»), its lines («×3 из 5», the count over the stock now, in the danger
  colour above the stock; «нет в списке» for an item the list no longer
  holds; the line sum at the price when it was sent, or «-») and the total.
  A request draws its first 5 lines, then a bare fold button «и ещё N
  позиций» / "and N more items", which draws the rest and reads «свернуть» /
  "show less", one button both ways, so the focus stays on it. The panel
  draws the first 3 pending requests, then one fold button «и ещё N
  запросов» / "and N more requests" that draws the rest the same way; the
  heading still counts every pending request and notice. At the limits (10 requests of
  100 lines) and at three times them the panel draws 15 lines and 4 fold
  buttons, so «Принять» of the first request stays within one screen of the
  panel head.
  «Принять» sends the write buffer first (a write that waits for the network
  stops it with «Не получилось ответить на запрос. Проверьте соединение и попробуйте ещё
  раз.»),
  takes the counts in one transaction, deletes an entry taken to zero, reads
  the lists again (once the write buffer drains, when an edit waits) and
  toasts «Запрос принят». A request above the stock
  changes nothing and draws «Не хватает: ... - просят 9, есть 5. Ничего не
  списано.» with «Принять доступное», which takes what is there («Запрос
  принят: списано N шт.»), or only «Отклонить» when nothing is there.
  «Отклонить» changes no entry («Запрос отклонён»). A folded «Решённые в этот
  раз (N)» lists this page load's decisions, each with the items it asked
  for and the asked count («Зелье ×9»). «Скрыть» / "Hide" at the end of the
  fold's row forgets them for the list until the next page load; the focus
  moves to «Новое в списке (N)», or to the page's main when the panel goes
  because nothing is pending. «Этот запрос уже решён на другом
  устройстве.» and «Этот запрос истёк: прошёл час после того, как его открыли,
  или 30 дней без ответа.» are refusals; a decision this tab sent with no
  answer that comes back decided, and a request that is gone (its list
  deleted, or removed by the hourly clean-up once it expired, `META.md`
  section 3), are read again with no toast. A new request arrives with no reload through the
  owner's Realtime topic, or on the 45 s poll and the shown-again signal
  while it is down, and a hidden status, on an account list's page before any
  request, says «Новый запрос» once per arrival. A request's age, its time to
  expiry and whether it has expired move with the 45 s clock and when the tab
  is shown again, and an expired one stays drawn until then. A request
  expires 30 days after it was sent while nobody reads it; when the panel
  draws every pending request, none behind «и ещё N запросов», and one of
  them is unread, in a visible tab, the page marks the list's unread
  requests read (`mark_list_read`), and each then expires within the hour:
  a new request reads «только что», then «только что · истечёт через 60
  минут». A background tab and a folded panel mark nothing, so no request
  starts its last hour unseen; the press on «и ещё N запросов» marks the
  list. A failed mark leaves the requests unread, and the page marks again
  on the 45 s clock or when the tab is shown again. An apply or a decline is
  a read too. On the
  index an account card with pending requests says «2 запроса ждут ответа»
  in gold under its meta line, in its link's name too, and its unread
  notices after them, «2 запроса ждут ответа · 1 изменение», or alone «2
  изменения». An apply cannot be undone.
- **The change log**: when the author of another account's item a list links
  changes it (its text, its source or a card it names) or deletes it, the
  list's owner finds a notice in the same panel, after the requests, newest
  first: «Автор изменил «%s».» with «Открыть» to its `#/h/` page, or «Автор
  удалил «%s» - строка убрана из списка.» (the row left with its quantity,
  price and notes). One notice per list and item: a later change replaces
  it. The panel draws the first 3, then «и ещё N изменений» / "and N more
  changes", the requests' fold. Each notice has «Скрыть» («Скрыть изменение
  «%s»»); from two notices «Скрыть изменения» after them hides the notices
  the panel holds (one notice, one hide button: owner, 2026-10-08), so one that arrived after the last read stays; the focus moves as
  the requests' «Скрыть» moves it. A notice that was unread when this page
  load first held it is marked «новое» until the page is left. The panel
  reads its list's notices whole; the list is marked read (the requests' rule
  above) only when the panel draws every pending request and every notice,
  one of them unread, in a visible tab. A notice expires 1 hour after it is
  read, or 30 days after it was made while unread, and the hourly clean-up
  deletes it (`META.md` section 3). A new notice arrives through the owner's
  Realtime topic (`notice`), the 45 s poll and the shown-again signal, and the
  hidden status says «Предмет в списке изменился». A failed hide says «Не
  получилось скрыть изменения. Проверьте соединение и попробуйте ещё раз.»
  and the notice returns on the next read.
- **Exports**: an account's lists leave it only as the reader's own file.
  «Скачать JSON (N)» on the index's strip and «Скачать JSON» on an account
  list's page download a lists file of the ticked lists in the index's order or
  of the one list, both notes of every list and entry included: `<name>.json`
  for one list, else `daggerheart-loot-lists-<YYYY-MM-DD>.json` (the local day).
  The file is `import-v1`, `import-v2` when it holds a homebrew entry, or
  `import-v3` when it holds an entry marked «Только для мастера»: the mark
  travels as `"gm_only": true`. A homebrew entry is written with the live
  item as its snapshot, the own one or another account's as the last read
  answered it (`CONTRACTS.md` section 4). «Скачать мои данные (ZIP)» on
  `#/account` downloads `daggerheart-loot-data-<YYYY-MM-DD>.zip`, a store-only
  zip whose root holds `lists.json`, the same lists file of every account list,
  and, when the account holds a source, a card or an own item, `homebrew.json`,
  the account's whole homebrew file ("Homebrew"): `homebrew-v1`, or
  `homebrew-v2` when a card holds book items. A download that writes own
  items waits for them: while they load, or after their read failed, it toasts
  «Ваши предметы ещё загружаются - повторите через секунду.» and downloads
  nothing. An export has no toast of its own, and a failed download toasts «Не
  получилось. Проверьте соединение и попробуйте ещё раз.». A file past the
  import's bounds - more than 1000 lists, or more than 5000 entries in one list
  - still downloads whole, and one toast says «Этот файл нельзя импортировать
  целиком.» with «В нём больше 1000 списков: экспортируйте их частями.» and «В
  списках «Склад» позиций больше 5000: разделите такие списки.» as they apply. A
  lists file of more than 5 MB in UTF-8, alone or as the zip's `lists.json`,
  adds «Он больше 5 МБ: экспортируйте списки частями.» after the first sentence;
  the zip's `homebrew.json` of more than 5 MB says «Файл homebrew.json больше 5
  МБ: скачайте источники по одному на странице «Мои предметы».». The import
  refuses either file past 5 MB, so the toast says it at download time, before
  an account delete. A homebrew entry whose item neither the account nor the
  last read of linked items holds (deleted on another device before the lists
  were read again) is left out, and the toast counts it, «%n свой предмет не попал в файл: его больше нет
  в аккаунте.» alone, or after the bounds text. A list moved from this browser
  with more than a hundred entries imports only into an account whose entry
  limit holds it: the account's limit refuses it, not the file.
- **Import**: «Импорт из файла» ("Lists") adds the file's lists to the
  account as new lists, every list and entry with a new id, all or nothing in
  one call: a refused call leaves the account as it was. The write buffer is
  sent first, and the index is read again without «Загружаем...»; no card is
  drawn before the call answers. A list name the account holds imports as a
  second list, and the same file imported twice makes two copies. A lost
  answer whose lists the next read finds counts as done. The import counts
  against the account's limits, with no exemption. The entries the preview
  skips are not sent; the rest of the file imports.
- **Limits**: the 51st list and the 101st entry of a list (the defaults;
  `limits:set` changes them per user) are refused with the error toast
  «Достигнут предел списков в аккаунте: 50. Нужно больше - напишите на
  daggerheart.loot@gmail.com.» / «Достигнут предел позиций в списке: 100. ...»,
  the number the database applied. An override lifts its limit on every
  path that counts it: an edit, a saved copy of a shared list, an import and
  a purchase request. Ceilings of one call stay whatever the override: an
  import takes at most 1000 lists and 5000 entries of one list, a write at
  most 5000 entries of one list, and a purchase request's lines at most 32
  KiB of JSON (about 900 lines of catalog ids, about 700 of homebrew keys
  of 19 characters, about 360 of 64 characters). One import is also bounded
  by the hosted statement timeout of 8 s, which counts only the database's
  work: on the test project 50 lists of 100 entries take about 320-450 ms
  of it, 100 lists of 100 entries about 810 ms, and 1000 lists of 5
  entries about 1660 ms plus 380 ms at commit (2026-09-30); a host minute
  that swaps can multiply that several times. A call that still reaches
  the timeout answers «Файл слишком большой для одного импорта: разделите
  его на несколько.», and the export does not warn before it. A purchase request holds at most 100
  lines, a list at most 10 pending requests (both defaults `limits:set`
  changes per owner), a link sends at most 5 a minute; a request expires an
  hour after it is read or 30 days after it is sent, and the hourly clean-up
  deletes it in the hour after that. An unread request counts against the 10
  pending. Homebrew counts 100 own items, 100 cards and 20 sources per account
  (`homebrew_items_per_owner`, `homebrew_cards_per_owner`,
  `homebrew_books_per_owner`; "Homebrew"). Every surface is designed for up to 3x every default in this bullet and
  nothing past that (`docs/decisions/`, 2026-10-01, "Scale is designed for
  three times the default limits; nothing past that").
- **The move**: when a signed-in reader's page has read the account and this
  browser holds lists, each list moves into the account as it is - entries,
  quantities, prices, both notes, the list notes and the money mode, every
  entry id kept, whether or not the catalog knows it - through one request
  per list, exempt from the count limits (the limits bind again from the next
  ordinary write). The account is then read back, and a list leaves the
  browser only when its account copy matches what was sent and its stored
  text did not change meanwhile. The move waits for the catalog: a page whose
  `data.js` did not load moves nothing. Two guards, for a shared computer:
  the move runs only for the first account whose page loaded with browser
  lists (another account sees them untouched, and no notice), and a one-time
  notice between the header and the page, on every page, names the moved
  lists: «Списки из этого браузера перенесены в ваш аккаунт: «Клад дракона»,
  «Лавка в порту».», until «Скрыть»; it is drawn only for the account that
  owns them. When a damaged copy of the lists (`dhloot.lists.v2.bad`) is
  present, the notice adds «В этом браузере осталась повреждённая копия
  списков: её не получилось прочитать и перенести. Если в ней было что-то
  важное, напишите на daggerheart.loot@gmail.com.»; the copy itself is never
  moved or deleted. The open page of a moved list, at its `#/lists/<id>` or
  its own `#/l/` address, follows it to the account list's address, and a
  bookmark of `#/lists/<id>` opens the account list. A second move of the
  same list, from a second device, a copy brought back from storage or an
  answer that was lost, answers the account row the first move made: no
  second row, and the copy leaves the browser. A move whose row is deleted
  meanwhile fails, and the next load moves the list again.
- **The banner**: signed out, before the cutoff, while this browser holds
  lists that no account owns (`dhloot.migrated.v1` names no owner), every
  page but `#/account` draws a slim banner in the moved-lists notice's place
  between the header and the page: «Ваши списки хранятся только в этом
  браузере. Войдите до 26 октября 2026 года - и они перенесутся в аккаунт.
  После этой даты приложение перестанет их показывать.» / "Your lists are
  stored only in this browser. Sign in before 26 October 2026 and they
  move to your account. After that date the app stops showing them.", the
  date from `LEGACY_WRITE_UNTIL`, then «Войти» (named «Войти и перенести
  списки» / "Sign in and move the lists"), which opens `#/account` and
  returns to the page after the sign-in, where the move runs, and «Скрыть»
  (named «Скрыть напоминание» / "Dismiss the reminder"), which hides it
  until the next page load. Nothing is drawn while the session is unknown,
  signed in, after the cutoff, or in a build with no sign-in.
- **The move's status** stands in the storage notice's slot on `#/lists` and
  on a browser list's page: «Переносим списки в аккаунт...» while it runs;
  «Не все списки перенесены: нет связи. Попробуем при следующем открытии.»
  when the network stopped it (what moved has left the browser, the rest
  waits); «Не перенесён: «Клад дракона». Сервер не принял список. Напишите на
  daggerheart.loot@gmail.com.» for a list the server refused, tried again on
  the next page load; «Не перенесён: «Клад дракона». Копия в аккаунте не
  совпала со списком. Напишите на daggerheart.loot@gmail.com.» for a held
  list, whose account copy did not match - it stays in the browser for good
  and is not sent again; «Удалить» takes it away. A move stopped by the
  network runs again when the tab is shown again, on the 45 s clock on any
  page, and on «Повторить», with no reload.
- **Read-only**: after the cutoff, in a build with sign-in configured, a
  browser list's page has a read-only title, no link buttons and no address
  rewrite; the money chips are disabled; the list and entry notes, the
  positions, quantities and prices are read-only, with no clear cross, no
  drag grip and no remove cross; the selection bar keeps the tick and its
  «Скопировать», not «Цены» or «Удалить (N)»; copy text, print and the roll
  panel work. «Удалить» stays, with the confirm and no «Вернуть». On
  `#/lists` a browser card links `#/lists/<id>` and has «Удалить» alone; the
  add-to-list menu offers the account lists alone, and signed out only the
  prompt. A `#/l/` address, plain, packed or this browser's own, draws «Ссылки
  такого вида перестали открываться 26 октября 2026 года.», «Попросите у
  отправителя новую ссылку или войдите, чтобы собрать список.» and «Списки»
  to `#/lists`, the address kept and the payload never decoded; a waiting
  «Сохранить себе» of an old link is dropped. An account list and the `#/s/`
  page do not change. While the lists move, and while the move waits for the
  network, a signed-in reader's browser lists are read-only and cannot be
  deleted; they are editable again once the move has ended. A list that
  changed while it moved stays in the browser, named in the status, and is
  not sent again. «Сохранить себе» on a `#/s/` page is disabled while the move
  runs, and a remembered one runs after it.

## Records

- Card in a modal from a table row, or a full page at `#/i/<id>`.
- An own homebrew item opens at `#/i/<key>` for its author only; any other
  reader, signed out included, gets «Предмет не найден», and «Загружаем...»
  draws until the session and the author's items are known. Its path reads
  «Хоумбрю · <source> · <section>», its tag «<source> (HB)» (the Latin mark
  in both languages) or «Хоумбрю», with «показать в таблице» to its row on
  `#/tables/homebrew`, and the pick row adds «Изменить» (to
  `#/homebrew/<key>`) after the print link. Its link is its item address
  `#/h/<uuid>`: «Скопировать ссылку» copies it and «Отправить» carries it, in
  the language on screen (`<site>#/h/<uuid>`, `<site>en/#/h/<uuid>`). While
  the author's items fail to load, the page says «Не получилось загрузить
  ваши предметы.» with «Повторить», not «Предмет не найден».
- **The item page `#/h/<uuid>`** draws one homebrew item for everyone, signed
  out too, in the record page's shape, with the author's relation lines: the
  item's own record and the author's related items (made from, upgrades to,
  the set, the upgrade line) as `get_homebrew_item` answers them, which win a
  key the reader also holds, so the reader and the author see the same
  «Получается из», «Улучшается до», «Комплект» and set bonus. Every homebrew
  link the app writes is this address: a relation, a tier rung, a list row,
  «Скопировать ссылку» and «Отправить» of an own or a linked item. A rung or
  a relation of the author's item opens its own page; a catalog record opens
  over the page. A reader's line under the heading starts with «Предмет
  другого игрока» / "Another player's item", then the path; the pick row
  offers «Добавить в список» and «Сохранить себе», and no «Печать», no
  «Изменить» and no «показать в таблице» (print routes of another account's
  item come with R9). The author sees the own record's controls: «Печать»,
  «Изменить», «показать в таблице», and no «Предмет другого игрока». The page
  opens once the session is known, so the author never sees a reader's
  controls; a sign-in or a sign-out reads it again. While it reads it says
  «Загружаем...»; a failed read titles the page «Предмет не загрузился» with
  «Проверьте соединение и нажмите «Повторить».» and a primary «Повторить» (the
  `#/s/` failure's shape); a malformed id (read with no request), an unknown
  id, an item deleted meanwhile, and a build with no sign-in configured draw
  the record page's «Предмет не найден», the address kept. The page re-reads
  on the shown-again signal only (a 45 s re-read comes with R9); a re-read
  that fails keeps what is shown.
- **«Сохранить себе» / "Save to my items"** on another account's item - on
  `#/h/` and in the record modal of a list row that links it - makes an
  ordinary own item in «Хоумбрю» (no source, no section) from what the reader
  sees, under the item's own key: the `hb_` keys of the author's other items
  in its relations are dropped, catalog ids stay, and its set and rule cards
  are copied under their keys, or named when the reader holds a card of that
  key (`docs/decisions/2026-10-07-a-saved-copy-of-another-accounts-item-keeps-its-key.md`).
  The copy no longer changes with the original. A line under the row says
  «Копия попадёт в «Хоумбрю» и больше не будет меняться вместе с
  оригиналом.», or, while one of the reader's account lists links the item,
  «Копия попадёт в «Хоумбрю», а строки ваших списков с этим предметом будут
  вести на неё.»: the press relinks in place every such row to the copy,
  each keeping its position, quantity, price, both notes and the «Только для
  мастера» mark, and toasts
  «Предмет «%s» сохранён в «Мои предметы», строки ваших списков ведут на
  копию», else «Предмет «%s» сохранён в «Мои предметы»», each with
  «Изменить» to `#/homebrew/<key>` in a new tab. Then the button reads
  «Сохранено», disabled, and no second copy is made; a reader who already
  holds the key sees it so from the start. Signed out the press opens a
  boxed sign-in prompt under the row, «Войдите, и копия предмета
  сохранится в «Мои предметы».»; the sign-in returns to the item's page (from
  a modal too) and the copy is made once the reader's items are read. While
  the reader's items load it toasts «Ваши предметы ещё загружаются -
  повторите через секунду.» and writes nothing. A limit says its text; no
  answer says «Не получилось сохранить предмет себе. Проверьте соединение и
  попробуйте ещё раз.»; any other refusal «Сервер не принял копию: данные в
  аккаунте изменились. Нажмите «Сохранить себе» ещё раз.». The account's read
  after the write decides: a lost answer whose copy landed is a save.
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
  `i/en/<id>.html` in English - and a homebrew item's `#/h/<uuid>` address.
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
- Upgrade chains render both directions; the reverse is computed at load.
  That is `craft` - one thing made from another - and it is not the tier
  ladder below. `craft` is a list: a record that upgrades into several draws
  them comma-joined in one "Upgrades to" line, in the list's order, and a
  record made from several draws them in one "Made from" line; the copied
  text carries one "Upgrades to" block per target. A chain may run through a
  record, which then draws both lines:
  Frostwyrd (Awakened) is made from Dormant and upgrades to Exalted. The card
  and the table row draw "Made from" first, then "Upgrades to", so the lines
  follow the chain; "Made from" has a left arrow and "Upgrades to" a right
  arrow. The share stub keeps the same order. The copied text of a chain
  record carries only what the next rung adds: the lines of the target's
  description that its own description does not already carry.
- The catalog also links Grindletooth Venom to Improved Grindletooth Venom;
  Unstable Arcane Shard through Improved to Major; Health and Stamina Potions
  from Minor through the standard version to Major; each of the six trait
  potions to its Major version; and Alconite Crystal to Superior Alconite
  Crystal. These use the same `craft` relationships and draw in both languages.
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
- **Own relations on a card**
  (`docs/decisions/2026-09-30-hb-marks-homebrew-a-relation-shows-only-to-its-author.md`):
  signed in, a card's «Получается из», «Улучшается до», set line and tier
  ladder also draw the author's own items that name the record, and an own
  item's card draws its own relations; nobody else sees them, another
  account's item in a list adds nothing to a catalog card, and the «Свои предметы» switch does not
  hide them. The account's own set and rule cards also draw on the book items
  they hold (`items`): the set line, the bonus linked to the Sets tab, the
  rule card after the book's with «Открыть в «Мои предметы»». Under an own
  set every member past the third folds, catalog records included, the
  catalog ones in catalog order, then the own ones by name; the record page,
  print and the copied text alike. A homebrew name reads «<name> (HB)» and a homebrew rung «<tier>
  HB», titled and named «<name> (HB)», with the ordinary border. Each line
  and the ladder draw every catalog record, the record itself and three
  homebrew records - catalog records in their order, then homebrew ones by
  name, the ladder in tier order - then «и ещё N» (`aria-expanded`), which
  opens the rest and reads «свернуть»; a card opens closed. A row draws its
  catalog names, the first homebrew name and «и ещё N» as text. Copied text
  writes one «Улучшается до» block per catalog target and per homebrew
  target up to three, each homebrew name with «(HB)», then one bodiless
  «Улучшается до: и ещё N» / "Upgrades to: and N more" line for the rest, so
  a copy has a bound; the print card's set label folds as the card does and
  keeps the printed record. Another account's linked item draws its own rung
  on its line's ladder and the bonus of its author's set card it names, also
  when no other member of the set is the reader's.
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

## Homebrew

A signed-in GM makes items that are not in the books: «Мои предметы» /
"My items". Homebrew items live in the account only
(`docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md`).

- **`#/homebrew` and its tabs**: the heading «Мои предметы» with
  its lead line (search finds the items with the catalog, they appear in the
  tables and go into lists), then «Импорт из файла» ("Import"), shared by the
  four tabs, then the tab row «Предметы», «Источники», «Комплекты», «Карты
  правил» / "Items", "Sources", "Sets", "Rule cards": links to `#/homebrew`,
  `#/homebrew/sources`, `#/homebrew/sets` and `#/homebrew/rules`, the current
  one pressed (`aria-current="page"`, the tables' group chips pattern). A tab
  press keeps the import panel open with its file, and keeps the ticks of the
  Items tab, so items ticked there move into a source made on the Sources tab;
  a source chip press on `#/tables/homebrew` keeps them too; every other
  navigation clears the ticks. Each tab's create button is the
  first control under the tab row.
- **The Items tab** (`#/homebrew`): «Новый предмет» (to `#/homebrew/new`), then
  from the eighth own item the search box «Найти предмет» / "Find an item"
  (either language of the name holds the query as search folds it; page
  memory, empty each time the tab opens), then the count «3 предмета из 100» /
  "3 items of 100" (every item, not the matches; the limit from the database,
  an override's own number; «3 предмета» when the limit read failed), then the
  items as table rows under one heading per source and section: each named
  source by its creation, its sections in the author's order, then its items
  with no section under the source name, «Хоумбрю» / "Homebrew" last, empty
  headings and headings with no match left out, the items by name. A query
  with no match draws «Ничего не найдено» with the count kept and no strip. A
  row opens the editor; its tick feeds the selection bar (add to a list,
  print, copy) and the strip above the rows; «Выбрать все» and the strip act
  on the drawn rows only, and a tick the search hides is dropped. The strip:
  «Переместить (N)» ("The bulk move"), «Скачать JSON (N)» ("Downloads") and
  «Удалить (N)», which asks
  «Удалить предметы (N)? Они пропадут и из ваших списков. Если эти предметы
  есть в списках других игроков, строки пропадут и там - с количеством, ценой
  и заметками; владельцы списков увидят, что предметы удалены. Отменить
  удаление нельзя.». The delete sends one request per item and stops at the first
  failure: while it runs the button is disabled, a status line under the strip
  counts «Удаляем предметы: 12 из 40» up, and a second press sends nothing; then
  the toast «Удалено предметов: N», or «Не получилось удалить. Проверьте
  соединение и попробуйте ещё раз.». No items: «Своих предметов пока нет -
  создайте первый выше или импортируйте файл.». Signed out: the heading and the
  sign-in prompt «Войдите, чтобы создавать свои предметы.». A failed read: «Не
  получилось загрузить ваши предметы.» and a small «Повторить». With no sign-in
  configured the route draws the not-found page and keeps the address. The page
  cannot be pinned.
- **The Sources tab** (`#/homebrew/sources`): «Новый источник» with the plus
  icon first, which opens the field «Новый источник» in its place, then the
  count («2 источника из 20» with the source limit known, «0 источников из 20»
  too; «2 источника» with none, nothing at 0), then the named sources by
  creation and the default source «Хоумбрю» last. It has no search (20
  sources by default, one line each). The default source holds every item
  with no named source; its row shows the count and «Скачать JSON». A named
  source shows its name in the language on screen (the other language when
  it has none), «N предметов · M разделов из 30» (the sections only from
  one), «Разделы», «Переименовать», «Скачать JSON» and
  «Удалить». While a source holds an item, its name links to its items on
  `#/tables/homebrew` through the `src` filter (`f_src-<key>`; «Хоумбрю»
  `f_src-hb`), its sections included, which picks its source chip; an empty
  source's name, «Хоумбрю» included, is plain text, since its address would
  open another source's chip. «Разделы» opens its sections, each with its count,
  «Переименовать» and «Удалить», then «Без раздела» with its count, then
  «Новый раздел» with the plus icon. A name typed in a source field is lost
  on a tab press with no question. A name field (at most 80
  characters) sends on Enter or its button and cancels on Escape or
  «Отмена». It refuses an
  empty name («Введите название источника.» / «Введите название
  раздела.»), a name another source holds, or «Хоумбрю» / "Homebrew",
  compared without case in both languages («Источник «%s» уже есть.»), a
  section name the source holds («Раздел «%s» уже есть в этом
  источнике.»), a 31st section («В источнике уже 30 разделов - это
  предел.»), the source limit, a source changed on another device
  («Источник изменили на другом устройстве. Данные обновлены - повторите.»)
  and a lost network («Не получилось создать. ...» / «Не получилось
  сохранить. ...»). A create toasts «Источник «%s» создан» / «Раздел «%s»
  создан»; a rename is silent. A refusal draws under the field and keeps the typed name. A rename
  writes the language that names the source or section - the one language
  that names it, else the language on screen - and keeps the other one: an
  English-only source renamed in the Russian interface stays English. Deleting a source
  asks «Удалить источник «%s»? Его N предметов останутся в «Хоумбрю».
  Отменить удаление нельзя.», and its items move to «Хоумбрю»; deleting a
  section asks «Удалить раздел «%s»? Его N предметов останутся в источнике
  без раздела. Отменить удаление нельзя.», and its items draw with no
  section. An empty source or section asks the short form («Удалить
  источник «%s»? Отменить удаление нельзя.»). A delete toasts «Источник «%s»
  удалён» / «Раздел «%s» удалён».
- **Cards**: the Sets tab (`#/homebrew/sets`) and the Rules tab
  (`#/homebrew/rules`). Each draws its create button first («Новый комплект»
  / «Новая карта правил», with the plus icon, which opens the card form in
  its place), then from the eighth card of the kind the search box «Найти
  комплект» / «Найти карту правил» ("Find a set" / "Find a rule card"; the
  name or the subtitle in either language holds the query), then the count:
  the tab's own kind, then every card against the shared card limit («1
  комплект · 2 карты из 100», «1 карта правил · 2 карты из 100»; with no
  limit known «1 комплект · 2 карты»), then the cards by name. A card is a
  fold named by the card, closed by default: its head shows «N предметов»
  (the own items that name it and the book items it holds) with its source,
  «Изменить» and «Удалить».
  `#/homebrew/sets/<key>` and `#/homebrew/rules/<key>` open that card's fold
  and scroll to it; an unknown key or a key of the other kind opens nothing
  and keeps the address; a press on a fold does not write the address. An
  empty tab reads «Комплектов пока нет.» / «Карт правил пока нет.», a query
  with no match «Ничего не найдено». Open, a card shows its text (a set's
  bonus; a rule card's subtitle in italics, its text and its link), then the
  field «Добавить предмет» / "Add an item" (an item picker over the own and
  book items that are not members, ranked as search ranks them, with their
  meta; on the Sets tab not a book item of a book set; «Найти предмет»),
  then its members by name, own and book items in one list, each a link to
  the item's address, a book item with its book's name after it, with
  «Убрать» / "Remove". An own item's add or «Убрать» writes the item; a book
  item's writes the card's `items` (at most 100: the 101st is refused «В
  карте уже 100 предметов из книг - это предел.»), and while it is in flight
  the card's picker offers nothing and its «Убрать» buttons are disabled. A
  book item in another own set asks the move question below; a yes writes
  that card, then this one, holding this card for both writes; a failed
  second write toasts its own failure text and leaves the item in no own
  set, and a second add puts it in the set. A book item counts toward the three rule cards
  with its book's own; a book id the catalog lacks reads «Предмета больше
  нет» with «Убрать». A card write that another device changed or deleted
  toasts the card's texts below. A book item alone in its own set draws no
  set line and no bonus, as an own item alone. **Only the account that owns
  the card sees it on a book item, on every page it opens, its own share
  links included; other readers of a share link, `#/h/` and another account
  see the book's item** (owner, 2026-10-08,
  `docs/decisions/2026-10-08-an-own-card-holds-book-items-the-owner-sees-them.md`). An add on a set writes
  the item's set; an item in another set first asks «Предмет «%i» уйдёт из
  комплекта «%s». Перенести его?», and a no writes nothing. An add on a rule
  card adds it to the item's rule cards; an item with three is refused «У
  предмета «%s» уже три карты правил.» and nothing is written. «Убрать»
  drops the set or the card from the item. A member write toasts «Сохранено:
  «<item>»»; an item changed on another device reads the items again and
  toasts «Предмет изменили на другом устройстве. Данные обновлены -
  повторите.», a deleted one «Этот предмет удалили на другом устройстве.», a
  limit its text, a lost network «Не получилось сохранить. ...»; an item
  whose write is in flight is not offered. «Изменить» opens the card form in
  place of the card's row; one form is open at a time, and an open form
  stays while the query hides its card. A changed card form asks before a
  navigation and on a closed browser tab, as the editor's guard does. A card delete
  toasts «Комплект «%s» удалён» / «Карта правил «%s» удалена». The set form
  holds «Название комплекта» * and «Бонус комплекта» *; the rule card form
  «Название карты» *, «Подзаголовок», «Текст карты» * and «Ссылка» (empty,
  or `https://` in Latin characters with no spaces); on the tabs both hold
  «Источник». The name stops at 80 characters, the subtitle at 60, the
  text or bonus at 1500 (with the counter «N / 1500» past 1250) and the link
  at 300. An edit saved toasts «Сохранено: «%s»». A form sends on its button
  or Enter in a one-line field and
  cancels on Escape or «Отмена». It refuses an empty name («Введите
  название.»), an empty bonus or text («Введите бонус комплекта.» /
  «Введите текст карты.»), a name another own card of the kind holds,
  compared without case («Комплект «%s» уже есть.» / «Карта правил «%s» уже
  есть.»), another link («Ссылка должна начинаться с https:// и состоять из
  латиницы без пробелов.»), the card limit, a card changed on another
  device («Карту изменили на другом устройстве. Данные обновлены -
  повторите.») and a lost network; a refusal draws under its field or the
  buttons and keeps the typed text. A card another device deleted closes
  its edit form and toasts «Эту карту удалили на другом устройстве.». An
  edit writes the language on screen, keeps the other one as the account
  holds it at the press and names how many items show the change. Deleting a
  card asks, N counting own and book items, «Удалить карту правил «%s»? Она указана в N предметах - там она
  пропадёт. Отменить удаление нельзя.» or «Удалить комплект «%s»? Он указан
  в N предметах - там пропадут его название и бонус. Отменить удаление
  нельзя.», the short form («Удалить карту правил «%s»? Отменить удаление
  нельзя.») for a card no
  item names; the items keep its key and draw nothing for it, and an editor
  save keeps that key.
- **The editor** (`#/homebrew/new`, `#/homebrew/<key>`): the form beside a
  live full card of the item from 800 px, the card under the form below; an
  item with no name yet reads «Новый предмет» on it. While the items load
  the page draws the heading «Мои предметы» and «Загружаем...».
  The heading is the item's name, or «Новый предмет»; the line under it is
  the item's path, with the tier of chosen equipment. The legend «* -
  обязательное поле. Остальное можно заполнить позже.» heads the form. The
  fields: «Вид» (item, consumable, equipment), for equipment «Тип
  снаряжения», «Источник» (with «+ Новый источник...», which makes the
  source at once and selects it), for a named source «Раздел» (with «+
  Новый раздел...»; a source change resets it), «Название» * (at most 120
  characters), «Описание» (at most 3000, a counter past 2500), for loot and
  consumables «Ранг» («Без ранга», 1-4), for equipment «Ранг» * (1-4, no
  default), for weapons «Класс», «Характеристика», «Дистанция», «Урон»,
  «Тип урона», «Хват», each *, and the disclosure «Второй набор
  характеристик», for armour «Показатель брони» * and «Пороги урона» *.
  «Артефакт» and «Проклятый предмет» are Vault of Ages categories: a new
  item cannot take them, and an item stored with one shows it after 4,
  pressed, until a saved change of the tier drops it; the store and the
  import keep accepting both
  (`docs/decisions/2026-10-02-the-homebrew-editor-offers-no-tier-and-tiers.md`).
  «Пороги урона» is the caption of two boxes, each with its own label:
  «Порог Ощутимого урона» / "Major threshold" and «Порог Тяжёлого урона» /
  "Severe threshold" (the terms of `ru.daggerheart.su/rule/damage-threshold`,
  checked 2026-10-02; the app writes ё, as in its «Тяжёлый урон»); a Severe
  threshold not above the Major one reads
  «Порог Тяжёлого урона должен быть больше порога Ощутимого урона.». «Урон»
  is a die select «Кость урона» («Кость», d4-d20) and «Бонус к урону»
  (empty for none), each with its own label, in the main stats and in the
  second set. Among the main fields only «Источник» carries a «?» (rule 15 of
  "Consistency rules"): «Подсказка: <поле>» opens a hint under the label -
  what a source is. «Второй набор характеристик» is
  a button that shows and hides the set (the fields stay in the form while
  hidden; a save problem inside it opens it), with its own «?», whose hint reads «Для оружия, которое по
  своему свойству переходит на другие характеристики - например,
  «Универсальное». Заполните все четыре поля или оставьте набор пустым.
  Когда набор действует, напишите в описании; на печатной карте он идёт
  второй полосой урона.»; a second press on a pressed choice of the set
  unpresses it (a pressed choice of the main stats stays pressed), and
  «Очистить второй набор», drawn while the set holds a value, empties the
  set and its lines, keeps the rest of the form and focuses the set's
  button. The card draws no stat block until a tier is chosen: a tier is
  never shown that the author did not choose. The card of a saved item has
  «Добавить в список»: it adds the stored item as a link, so unsaved
  edits reach the list with «Сохранить»; a new item has none before its
  first save. The type and the weapon values stay in the form while another
  kind or type is chosen.
- **Relations**: the fold «Связи» / "Relations" closes the form, its summary
  «Связи · N» for the N relations the item names. It is closed for an item
  with no relation and open for one with any; a save problem inside it or an
  open card form opens it. For equipment, «Линия улучшений» («Уникальный» by
  default, «В линии», «Новая линия»): «В линии» picks equipment of the same
  type in an upgrade line, catalog or own, and draws the line's lowest rung
  with «линия из N рангов»; «Новая линия» starts a line at this item, which
  other own items of the type can join, and shows no note under the
  choice; its «?» explains it.
  «Линия улучшений», «Улучшается до», «Получается из», «Комплект» and
  «Карты правил» each carry a «?» whose hint says what the relation does
  and how it differs from its neighbour (a line is rungs of one item; a
  craft link is another item made from this one). «Улучшается до» and «Получается из»
  hold up to 8 items each, catalog or own; the item itself is never offered.
  «Комплект» is a select of the catalog's sets and the own ones («<name>
  (HB)»), with «+ Новый комплект...», which opens the set form in its place
  and selects the set it makes. «Карты правил» holds up to 3 cards, the
  catalog's and the own ones, with «Новая карта правил» and the plus icon,
  which opens the
  rule card form and adds the card it makes. A card made here goes into the
  item's source and is written at once («Комплект «%s» создан» / «Карта
  правил «%s» создана»). An item picker finds items as search does
  ("Tables and search"), the best matches first; the card picker finds cards
  by name or subtitle as one substring; both match both languages and list
  at most 8 matches, then «Ещё N - уточните запрос», or «Ничего не найдено». ArrowDown
  and ArrowUp move, Enter or a click picks, Escape closes, Backspace in an
  empty field removes the last chosen one, and a full list reads «Уже 8 -
  больше нельзя». A chosen item or card the account no longer holds reads
  «Предмета больше нет» / «Карты больше нет» and is kept until removed. The
  card draws the draft's relations: its rung on the line's ladder, both
  craft lines, its set with the bonus and its rule cards; an own rule card
  links to its address as written, with the host as the text, and an empty
  address draws no link. The card marks and folds the relations as
  "Records" says.
- **Checks**: the form checks on «Сохранить» only, with the database's own
  rules. A failed save sends nothing and focuses the summary «Не сохранено:
  исправьте N полей.», which lists each field once with its problem; a
  press on one focuses the field. Each field draws its line under it,
  `aria-invalid` and `aria-describedby` on a text field; the line goes on
  the field's next change. Damage is `d4`-`d20` with an optional `+1`..`+99`;
  an armour score 0-12; thresholds two whole numbers 1-99, the second larger;
  the second set all four fields or none, and its lines name «Очистить второй
  набор»; a set emptied by any path takes its lines along. «В линии» with no
  line reads «Выберите предмет из линии или нажмите «Уникальный».», a line of
  another equipment type «В этой линии снаряжение другого типа: выберите
  другую линию или нажмите «Уникальный».», and a save while the set or rule
  card form is open «Создайте комплект кнопкой «Создать комплект» или
  нажмите «Отмена».» / «Создайте карту кнопкой «Создать карту» или нажмите
  «Отмена».». A source another tab deleted reads «Этот источник удалили -
  выберите другой.».
- **Saving**: «Сохранить», Ctrl+S or Cmd+S, or Enter in any one-line field
  of the form saves. A new item's save replaces the address with
  `#/homebrew/<key>` and keeps the form and the focus; an edit writes over
  the revision the form loaded. A create toasts «Предмет «%s» создан», an
  edit «Сохранено: «%s»». The limit
  draws «Не сохранено. Достигнут предел своих предметов: N. ...» under the
  buttons, a lost network «Не получилось сохранить: нет связи. Правки
  остались в форме - нажмите «Сохранить» ещё раз.»; both keep the form. An
  item changed on another device draws «Этот предмет изменили на другом
  устройстве, пока форма была открыта. Ваши правки не сохранены.» with
  «Сохранить мою версию» (writes over it) and «Показать новую версию»
  (asks «Ваши правки пропадут. Показать новую версию?» while the form is
  dirty, then reloads; a read that fails keeps the form and says «Не
  получилось сохранить: ...»). An item deleted on another device draws «Этот
  предмет удалили на другом устройстве.» with «Сохранить как новый» (a new
  key; the address moves) and «К моим предметам». A read that removes the
  item under a dirty form keeps the typed text and draws that banner; a
  clean form reloads when a read brings a newer row, and draws «Предмет не
  найден» when the row is gone. A press sent again after a lost answer
  never makes a second item or source.
- **Language**: the name and the description edit the item's own language:
  the language on screen for a new item or one named in both, else the one
  language that names it. The other language is written back unchanged.
  The labels follow the language on screen.
- **The guard**: while the form differs from what it loaded, a link, Back,
  Forward and every in-app navigation ask «Изменения не сохранены. Уйти со
  страницы?» (a no keeps the page and its address), and closing the tab
  gets the browser's own prompt. After a save or a delete nothing asks.
  While a delete reads the lists again, the form stays as it was.
- **Delete**: «Удалить» asks «Удалить предмет «%s»?», or «Предмет «%s» есть
  в N списках. Удалить его и убрать из списков?» while account lists hold it;
  «Предмет «%s» указан в N предметах. Удалить его?» while other own items
  name it in a craft link or a line, and «Предмет «%s» есть в N списках и
  указан в M предметах. Удалить его и убрать из списков?» for both; each then
  adds «Если предмет есть в списках других игроков, строка пропадёт и там - с
  количеством, ценой и заметками; владельцы списков увидят, что он удалён.»
  and «Отменить удаление нельзя.» (rule 3);
  the other items keep its key and draw nothing for it; the item leaves the
  account, its entries leave every list that links it, the page goes to `#/homebrew`
  and toasts «Предмет «%s» удалён». A failed delete draws «Не получилось
  удалить. Проверьте соединение и попробуйте ещё раз.». The editor names
  how many account lists hold the item.
- **Where an item is used**: an own item goes into the account's lists as a
  link and draws live there, on their share links too; «Свой предмет»
  on a list page makes one in one press ("Lists"). A browser list never holds
  one: «Добавить в список» into it says «Свой предмет нельзя добавить в этот
  список.», and a `#/l/` link and a lists file never carry an own key. A
  list another user saved from a share link, or added the item to from one,
  links the item too and draws it live, with its source and the author's set
  and rule cards it names. Search ranks own items with the catalog's, and the tables
  draw them on `#/tables/homebrew` and, for equipment, in the equipment table
  of its type ("Tables and search"). On the author's own card (`#/i/<key>`,
  the record modal of an own item, `#/h/<id>` as the author) the name of an
  own set before its bonus links to the set's fold on the Sets tab, and each
  own rule card ends with «Открыть в «Мои предметы»» / "Open in "My items""
  to its fold on the Rules tab; a reader's card draws neither.
- **What a delete removes**: the item and its entry in every list that links
  it, the author's and other users' alike, also with the author's account.
  A card delete removes the card. The items keep its key and draw nothing for
  it, and every list that links those items, and its share links, shows them
  without it.
- **Limits**: 100 own items, 100 cards (sets and rule cards) and 20 sources
  per account (the defaults;
  `limits:set` changes them per user, and «из M» shows the number the
  database applies), 30 sections per source. The item limit refuses a save
  with «Достигнут предел своих предметов: N. Нужно больше - напишите на
  daggerheart.loot@gmail.com.», the source limit with «Достигнут предел
  источников: N. ...», the card limit with «Достигнут предел карт
  (комплектов и карт правил): N. ...».
- Another tab's or device's homebrew write arrives as the owner topic's
  `homebrew` message and reads the items again once; this tab's own is
  ignored. While the topic is down a homebrew page (`#/homebrew`, the editor,
  an own `#/i/<key>` and `#/tables/homebrew`) reads again every 45 s,
  and after a failed first read on every tick.
- **Import** (m15): «Импорт из файла» / "Import from file", a
  toggle with a caret above the tab row, opens the field «Импорт предметов из
  файла JSON» in a panel under the row; its
  code loads on the first open as its own chunk, with «Загружаем...» meanwhile
  and «Не получилось загрузить импорт.» with a small «Повторить» after a failed
  load. The field takes a `homebrew-v1` or `homebrew-v2` file or the data zip's
  `homebrew.json` (the file field, the 5 MB bound, the zip and the text rules
  of «Импорт из файла», "Lists"); its hint links `schema/homebrew-v1.json`,
  `schema/homebrew-v2.json` and `llms.txt`. «Обновить» with a version 1 file
  keeps a held card's book items; a version 2 file states them. A
  zip's `lists.json` draws «Файл lists.json из архива импортируется на странице
  «Мои списки».». A file the app refuses whole says why in one alert line (not
  JSON, not an items file, another version or none, nothing in it, not a data
  archive, a zip with no `homebrew.json`, with two at one depth, or compressed
  by another program); a file with errors draws «В файле ошибки - ничего не
  импортировано...» and one line per error with its object («Предмет 3,
  «Мушкет»»), the field, the reason and the path (`items[2].eq.dmg`), the first
  50, then «...и ещё N ошибок». A clean file draws «Источников: 1, разделов: 2,
  карт: 2, предметов: 3.», then «Новые с тем же названием, что у ваших:
  <names>.» for the new keys whose name an own item has: the key is the only
  identity, a name never matches. Then «Куда положить предметы»: one row
  per source of the file, then «Без источника» for the items and cards with
  none, each row's name and size the label of its select. The options: «В
  «Хоумбрю»», «В «<source>»» for each held source by creation, the row's own
  «Новый источник «<name>»» (« 2», « 3», ... when the name is held), on «Без
  источника» «В «<name>» (новый)» for each source the file makes, and «+ Новый
  источник...», which shows «Название нового источника» (at most 80; an empty or
  held name is refused on the press). Default: the source of the same key, then
  one of the same name (either language, no case), then the new source; «Без
  источника» goes to «Хоумбрю». A line under the row says what the press does
  (the source is created with N sections; the key matches; a source of the name
  exists with another key; N sections are added; «Хоумбрю» has no sections).
  Sections join by key, then by name, else are added; a merge past 30 sections
  reads «В «<name>» будет больше 30 разделов - выберите другой источник.» and
  the press sends nothing. Past 20 rows the rest fold behind «и ещё N
  источников» / «свернуть». When any key is held, «Пропустить» (default) or
  «Обновить» for the held items, cards and sources; under it one line per
  kind that has held keys names them in file order: «Предметы. Уже есть -
  останутся как есть: <names>.» («заменятся из файла:» with «Обновить»),
  then «Карты. ...» and «Источники. ...»; a held card of the other kind is
  left out (the notes name it as skipped). A line of names draws the first
  10, then «и ещё N» / «свернуть», the same button both ways; a long name
  wraps. Then a line that says what each choice does (a file whose only held keys are sources: «Названия существующих
  источников останутся как есть; новые разделы добавятся.» or «...заменятся
  данными из файла; ...»); «Обновить» asks «Обновить существующие предметы и
  карты (N)? Их текст и характеристики заменятся данными из файла. Отменить
  нельзя.». Notes under the rows name a relation that names nothing anywhere
  (kept, draws nothing) and a held card of the other kind (skipped), the first
  ten. «Импортировать (N)» (the file's items and cards) sends one call, every
  row or none; its ids and keys are made once per file, so a retry sends the
  same rows. Success toasts «Импортировано предметов: N» with «, обновлено: N»,
  «, пропущено: N», «, новых источников: N», «, новых карт: N» when not zero,
  folds the panel and reads the items again; a limit toasts its text, a
  statement timeout «Файл слишком большой для одного импорта: разделите его на
  несколько.», a refusal «Сервер не принял файл. Обновите страницу и выберите
  файл снова.», a lost network «Не получилось импортировать. Проверьте
  соединение и попробуйте ещё раз.»; the preview stays. Both buttons and the
  toggle are disabled while the call runs; «Отмена» folds the panel, drops the
  file and focuses the toggle. A retry after a lost answer ends with the same
  account (held keys then), only the counts differ.
- **The bulk move** (m24): «Переместить (N)», a toggle with a caret first in
  the strip (the list page's «Цены» is the sibling; the owner's «Переместить...»
  takes the caret for the ellipsis), opens a panel in the strip: «Источник»
  («Хоумбрю», then the named sources by creation) and, for a named source,
  «Раздел» («Без раздела», then its sections; a source change resets it),
  then «Переместить». It sends only the ticked items whose place differs, in
  one call with the revision of each; none differs: the button is disabled
  with «Отмеченные предметы уже здесь.». While it runs it reads
  «Перемещаем...». Success toasts «Перемещено предметов: N», clears the
  selection and closes the panel; every item keeps its key, so list
  links stay live. A source or section deleted on another device draws
  «Этого источника больше нет - его удалили на другом устройстве. Выберите
  другой источник.» / the section's twin under the selects; an item changed
  on another device toasts «Предметы изменили на другом устройстве. Данные
  обновлены - повторите.», a lost network «Не получилось переместить.
  Проверьте соединение и попробуйте ещё раз.», a refusal (a timeout
  included) «Сервер не принял перемещение. Обновите страницу и попробуйте
  ещё раз.». Every answer reads the items again; a failure keeps the
  selection and the panel, and a retry sends the revisions of that read.
- **Downloads**: «Скачать JSON» on a source's row downloads that source, its
  items and the own cards that belong to it or that its items name, as
  `<source name>.json` (the name in the language on screen, the lists' rule
  for unsafe characters; «Хоумбрю.json» for the default source);
  «Скачать JSON (N)» in the strip downloads the ticked items, their sources
  and the cards they name as `daggerheart-loot-homebrew-<YYYY-MM-DD>.json`.
  Each is a `homebrew-v1` file, or `homebrew-v2` when a card it writes holds
  book items (`CONTRACTS.md` section 4), whose items keep
  only a section their source holds. While the items load, or after their
  read failed, a download toasts «Ваши предметы ещё загружаются - повторите
  через секунду.»; a failed download or a chunk that did not load toasts «Не
  получилось. Проверьте соединение и попробуйте ещё раз.».
- **Moving to another account**: the zip of «Скачать мои данные (ZIP)» loads
  back in two presses, its `homebrew.json` on «Мои предметы» first, then its
  `lists.json` on «Мои списки», so the lists link the moved items, not new copies
  (`docs/decisions/2026-10-02-a-lists-file-is-version-2-only-when-it-holds-homebrew.md`).

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
  have defaults set in the Display section and kept in the account and in
  `dhloot.prefs.v1` (`STATE.md`, "Account preferences"). The two switches
  in the print bar change the layout for this visit: the pick survives
  leaving the print page and coming back, and a reload draws the default.
  While either switch differs from its default, a build with sign-in draws
  the same note as the tables toolbar under the bar, with its link to
  `#/account`; the bar never prints, so neither does the note.
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
- **Signed in**, the subtitle «Отображение, способы входа, выход и ваши
  данные.» / "Display, sign-in methods, signing out and your data.", then,
  in this order: «Отображение» (below); «Вы вошли как» (the email in bold, then the
  first provider's logo and «через <provider>»; the provider alone when an
  account has no email); «Способы входа» - a row for Google, then Discord:
  a connected one shows its identity's email and, while two or more are
  connected, «Отключить»; a missing one says «не подключён» and offers
  «Подключить <provider>»; with exactly one connected, a hint says it cannot
  be disconnected until another is connected; «Ваши данные» / "Your data" -
  the hint «Всё, что хранится в аккаунте, одним архивом ZIP: файл lists.json
  со списками и, если есть свои предметы, homebrew.json с ними, их
  источниками и картами. Чтобы перенести всё в другой аккаунт, импортируйте
  архив сначала на странице «Мои предметы», затем на странице «Мои списки»:
  за один раз - до 1000 списков и до 1000 своих предметов.» and «Скачать
  мои данные (ZIP)» ("Account
  and browser lists", "Exports"), disabled until the account's lists are
  read and while its zip is built, with «Не получилось загрузить списки
  аккаунта.» and «Повторить» when the read failed; «Выход» - «Выйти» and «Выйти на
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
  the prompt's page and the action it started ("Lists", "Account and browser lists"); the buttons stay disabled and the pressed one keeps its text
  until the page is gone, and a return with the browser's Back button
  enables them again. The return lands on `?auth-callback=1`, which is read
  before the app mounts and replaced by the page the reader left
  (`ROUTES.md`, "Account").
- When the connected providers cannot be read, «Способы входа» says «Не
  получилось. Проверьте соединение и попробуйте ещё раз.» (`role="alert"`) in place of the rows,
  and offers no Connect.
- A Connect refused because that provider account already belongs to
  another account says «Этот аккаунт <provider> уже подключён к другому
  пользователю.» in that provider's row (`role="alert"`), whether the
  refusal came back from the call or from the provider's redirect; it
  clears on the next action. Any other refusal - a cancelled consent, a
  failed sign-out, disconnect or deletion - is the error toast «Не
  получилось. Проверьте соединение и попробуйте ещё раз.».
- Sign-out and deletion stay on `#/account`, which becomes the signed-out
  page, with the toast «Вы вышли из аккаунта.» or «Аккаунт удалён.».
  Deletion removes the account on the server (`delete_account()`, a
  migration in `supabase/migrations/`), then this browser's session.
- The texts describe what an account is for in general terms, true in
  every release (`I18N.md`, "Rules").
- A build with no sign-in configured draws the not-found page on
  `#/account`, keeps the address, and draws no account control.
- Signed in, the language, starting section, and the default tables view
  and print layout follow the account on every device (`STATE.md`,
  "Account preferences"). The page first draws this browser's values and
  switches once the account answers.
- **The Display section** «Отображение» / "Display", signed in only and
  first, is the place the tables view and print layout defaults are set;
  a switch on the tables or print page changes only that visit ("Tables
  and search", "Print"). The language row and the header RU/EN switch are
  one setting, and so are the starting-section select and the pin
  ("Chrome"). The section opens with the lead line «Эти настройки действуют
  на всех ваших устройствах. Вид таблиц и печать, выбранные на их
  страницах, сохраняются только до перезагрузки.» / "These settings apply
  on all your devices. A tables view or a print layout picked on its own
  page is kept only until the page reloads.", then five rows with six
  controls, each saving the account row: «Язык» (the RU/EN switch); «Раздел при
  запуске» / "Section on start" (a select over the eleven sections; choosing
  «Таблицы» pins `#/tables/core_item`, the table a bare `#/tables` opens
  on, never the bare address (`STATE.md`, "localStorage keys"); a pinned
  table, or an older bare `#/tables` pin, shows as «Таблицы» and keeps its
  address until another section is chosen; an old section name shows as
  the section it opens; a refused write says the save-failed error toast
  and the select shows the section kept); «Таблицы» («Списком» / «Сеткой»); «Печать»
  («Цветная» / «Чёрно-белая») and the checkbox «Компактный лист» /
  "Compact sheet"; «Добавление из чужого списка» / "Adding from someone
  else's list", a select at every width («Спрашивать» / «Сообщать владельцу»
  / «Не сообщать», "Ask" / "Notify the owner" / "Don't notify") with the hint
  «Когда вы добавляете предметы из чужого списка в свой, сообщить об этом
  его владельцу?» / "When you add items from someone else's list to yours,
  notify its owner?" on a line of its own under it: the remembered answer of
  flow b ("Account and browser lists", "Purchase requests: flow b"), kept in
  the account only and «Спрашивать» by default. The page's account actions
  do not disable these controls.

## Chrome

- Language switch, tab bar, skip link, starting-section pin (ten sections
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
- A removal the app can write back (an entry, its notes, a reprice, a
  browser list) toasts with an undo, «Вернуть»; a server delete that cannot be undone (an
  account list, an own item, a source, a section, a card) asks the browser's
  confirm first and its toast offers none. A toast that offers an
  undo moves focus to its button, so the keyboard reaches it within the
  7000 ms it lasts; a toast with no action never takes focus. When the toast
  goes with focus still in it, focus returns to the element it came from, or
  to the main landmark when that element left with the action (a removed
  row). While a record dialog is open the toast is drawn inside it, so it
  takes focus and answers a click there; with the element focus came from
  gone, focus returns to the dialog's close button. Closing the dialog while
  an undo is on offer leaves the toast on the page for the rest of its time.
  A language switch while a toast is up redraws its text and its button in
  the new language, keeps its time left and moves no focus. A toast whose
  action is a link («Изменить» after «Свой предмет») lasts 7000 ms too,
  never takes focus and opens its page in a new tab; a toast with an action
  pauses its clock while the pointer is over it or the person has moved
  focus into it, and runs on with the time it had left; the focus an undo
  toast takes itself does not pause it. A toast with no action never pauses.
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
  reader never sees «Войти» flash), on `Seg`'s track. Signed out it is a
  link to `#/account`: the person icon and «Войти» / "Sign in", the label
  visually hidden below 420px (it stays the name). Signed in it is a menu
  button: a 38px circle (44px at 600px and below) with the email's first
  letter (the icon when there is no email), named «Аккаунт: <email>» /
  "Account: <email>", with `aria-haspopup="menu"` and `aria-expanded`. On
  `#/account` either one carries `aria-current="page"` and the gold ring;
  the button also carries the ring while its menu is open. A build with no
  sign-in draws no control at all.
- The account menu «Меню аккаунта» / "Account menu" opens under the
  signed-in control, right-aligned, and holds, in this order, «Аккаунт» /
  "Account" (`#/account`), «Мои списки» / "My lists" (`#/lists`), «Мои
  предметы» / "My items" (`#/homebrew`) and, after a rule, «Выйти» / "Sign
  out", which signs out as the account page's
  «Выйти» does and says «Вы вышли из аккаунта.» (from an account list's
  page the address becomes `#/lists`). The first item takes the focus; Up
  and Down move with wrap-around, Home and End go to the ends. Escape
  closes it and returns the focus to the control; a choice, a click outside
  the menu and the control, focus moving elsewhere, a navigation or a
  change of user close it. A second press on the control closes it. An
  item is 44px tall at 600px and below.
- The tab bar draws the eleven sections; from the legacy write cutoff
  (2026-10-26, `legacyWritable`) a build with sign-in draws ten, without
  «Списки»: `#/lists` is then reached from the account menu (`ROUTES.md`,
  "Sections"). A build with no sign-in keeps eleven.
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

### Consistency rules

The signed-in pages follow one set of rules; a new screen or string follows
them too, and a departure is named here
(`docs/decisions/2026-10-02-the-signed-in-pages-follow-one-set-of.md`).
Each rule keeps its number: a review cites it by number.

- **1. Counters**: a limited collection shows «N <plural> из M» / "N
  <plural> of M" in one place: the account group of `#/lists` («3 списка из
  50»), an account list's sub («10 позиций из 100 · Сохранено»), the Items
  tab's «3 предмета из 100», the Sources tab's «2 источника из 20», the Sets
  tab's «1 комплект · 2 карты из 100», the Rules tab's «1 карта правил · 2
  карты из 100» and a source's row («4 раздела из 30»). The limit comes
  from `my_limit()`; with no limit known the plural shows alone («3
  списка»). With a known limit the count shows at zero too («0 списков из
  50»); a count inside a row shows from one. The heading never repeats in
  the count. A counter sits at the head of the collection it counts: above
  its strip, or in its fold's summary (owner, 2026-10-02).
- **2. Failures**: a failed account read or write says «Не получилось
  <глагол>. Проверьте соединение и попробуйте ещё раз.» / "Could not <verb>.
  Check the connection and try again."; a load line says «Не получилось
  загрузить <что>.» / "Could not load <what>." with «Повторить». Clipboard
  and browser storage failures are outside this rule.
- **3. Delete confirms**: a delete that cannot be undone ends its confirm
  with «Отменить удаление нельзя.» / "This cannot be undone.", after its
  consequence sentence («Его 3 предмета останутся в «Хоумбрю».»).
- **4. One name**: the menu item, the page heading and the tab name a page
  the same way. Departure until 2026-10-26: the tab bar, the pin label and
  the window title of `#/lists` say «Списки» / "Lists" for the page headed
  «Мои списки» / "My lists".
- **5. Toasts**: a create says «<Что> «%s» создан(а)» / "<What> "%s"
  created", an update «Сохранено: «%s»» / "Saved: "%s"", a delete «<Что>
  «%s» удалён(а)» / "<What> "%s" deleted"; a rename is silent. A bulk write
  says «<Причастие> предметов: N» / "Items <verb>: N" («Удалено предметов:
  N», «Импортировано предметов: N», «Перемещено предметов: N»), an import
  adding its other counts after a comma when not zero. Departure: «Сохранить
  себе» of an item says «Предмет «%s» сохранён в «Мои предметы»» (and the
  relinked form), not «создан»: the toast repeats the word of the button the
  reader pressed. Departures for «Только для мастера» entries (owner,
  2026-10-06): the row's eye has no toast, as an entry field (the note
  button, the quantity); the bar's bulk toasts say «Скрыто от игроков: N» /
  «Показано игрокам: N», the bar's verbs, not «<Причастие> предметов: N».
- **6. Load states**: one `LoadState`: «Загружаем...» / "Loading..."
  (`role="status"`); a failure line (`role="alert"`) with «Повторить» /
  "Retry": primary where the failure replaces the page and its title says so
  («Список не загрузился» / "The list did not load"), small everywhere else.
- **7. Headings**: a page with a fixed heading draws it in every state,
  loading and failed included.
- **8. Create**: a button that opens a create form reads «Новый <noun>» /
  "New <noun>" with the plus icon («Новый предмет», «Новый источник»,
  «Новый раздел», «Новый комплект», «Новая карта правил»); the form's
  submit reads «Создать» / "Create" (a card form «Создать комплект» /
  «Создать карту»); a select option reads «+ Новый <noun>...». Departures:
  the add-to-list chip «+ Новый список», because a chip has no icon; and
  the row «Свой предмет» / "Own item" after an account list's entries (plus
  icon), whose panel's submit reads «Добавить в список» / "Add to list":
  one press makes the item and adds it to the list
  (`docs/decisions/2026-09-30-a-list-page-makes-a-plain-homebrew-item-in-one-press.md`);
  and the homebrew import's «Куда» option «Новый источник «<name>»», which
  names the source the press makes from the file, so it carries the name and
  no «+» (its custom option is the rule's «+ Новый источник...»).
- **9. The primary action** is the first control under the lead, before any
  management panel. Departures: «Мои предметы» draws «Импорт из файла» above
  its tab row, shared by the four tabs; each tab's create button is the
  first control under the tab row; an account list's page makes an own
  item from the row after its entries.
- **10. Undo**: a removal the app can write back offers «Вернуть» / "Undo"
  in its toast; a server delete that cannot be undone asks the browser's
  confirm first and offers no undo. The homebrew import's «Обновить» asks
  too and ends «Отменить нельзя.» / "This cannot be undone.", not the
  delete confirms' words, since nothing is deleted.
- **11. Cancel and close**: «Отмена» / "Cancel" discards what was typed;
  «Закрыть» / "Close" folds a panel and keeps what it holds; a read-only
  panel or dialog says «Закрыть». A toggle with a caret folds its panel the
  same way: the homebrew import's toggle drops the file as «Отмена» does,
  the bulk move's keeps the chosen place, as the list page's «Цены».
- **12. Folds**: a fold that names a group keeps its name and turns its
  caret («Решённые в этот раз (2)», a card's fold on the Sets tab «Комплект
  Ольхи»); a fold that shows
  the rest of a cut list reads «и ещё N ...» / "and N more ..." closed and
  «свернуть» / "show less" open, one button both ways, so the focus stays
  on it.
- **13. Capped text**: a field takes no more than the database keeps
  (`maxlength` from the validator's constant); a form's multi-line box shows
  «N / M» past five sixths of its cap. `maxlength` counts UTF-16 units and
  the database code points, so a text of astral characters stops early,
  never past the cap. Departure: the list notes stop at 4000 with no
  counter.
- **14. Text**: every string has RU and EN with the same facts and both
  plural sets; ASCII punctuation (` - `, not an em dash); «ёлочки» in
  Russian, straight quotes in English.
- **15. Labels and help** (owner, 2026-10-02):
  (a) every field of a form has a visible label that names the thing in the
  game's own term, as `daggerheart.su` writes it («Порог Ощутимого урона»,
  «Характеристика»); a placeholder is an example, never the label; no help
  lives only in a hover `title`.
  (b) A field with several inputs labels each input («Порог Ощутимого
  урона» and «Порог Тяжёлого урона» under «Пороги урона»; «Кость урона» and
  «Бонус к урону» under «Урон»).
  (c) A «?» next to the label shows a hint of one to three sentences under
  the label; it explains what the site does with the field or a constraint
  of the site, never a basic game term: a player knows the Daggerheart rules
  (owner, 2026-10-02) («Линия улучшений», «Второй набор характеристик»,
  «Источник»). The «?» is a button named «Подсказка: <label>» / "Help:
  <label>" with `aria-expanded`; the hint is closed when the form opens. A
  self-explanatory field has no «?».
  (d) A line always visible under a field holds only what the person must
  know before typing or pressing: a limit («До 8 предметов.»), a format
  («Необязательно. Например: ...»), fields that go together, or what a
  press does at once («Комплект создаётся сразу...»); one short line.
  (e) A capped text follows rule 13.
  (f) An error under a field states the fix («Два целых числа от 1 до
  99.»); the summary at the top of a form names the field first («Пороги
  урона - ...»).
  Departures: the list page's heading input (the heading is its label); a
  row's position box and the add-to-list menu's new-list box (an
  `aria-label` in a row or a menu with no room for a caption); the search
  boxes (a search is no form field); the list row's «Золото» «?» glyph
  (hover only; `DEBT.md` D79); the list notes' two boxes, whose visible
  label is not tied to the box, so the name is the placeholder (`DEBT.md`
  D74); the second set's «Заполните все четыре поля или
  оставьте набор пустым» stays behind its «?» (owner, 2026-10-02), and a
  save names the fix in each field's line; the bulk move's «Источник» has
  no «?» (its one select explains itself).
- **16. Long names**: a name of any allowed length wraps inside its box at
  360 px (`overflow-wrap: anywhere` on the list card, the page heading, the
  toast, the chip, the filter pill and the source and card rows); nothing
  scrolls sideways.
