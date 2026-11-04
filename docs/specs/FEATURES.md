# Features, and the state each one needs

Written from the code as it stands, so a rewrite has something to be measured
against. Route grammar is in `ROUTES.md`, storage in `STATE.md`, frozen formats
in `CONTRACTS.md`.

## Rolling

Nine modes. Each keeps its own input in memory only. A mode starts at its
first row on every visit: a switch between two modes carries no number
across.

| Mode | Input | Produces | State |
|---|---|---|---|
| Core rules | 1-60, or Nd12 for N in 1..5 | up to 4 records: item and consumable, from each picked source | `std {n, src{core,hnf}}` |
| Alternate tables | rarity + Hope die + Fear die | 4 records | `alt {rarity, hope, fear}` |
| Wondrous Environments | 1-119 | 1 | `wond {n}` |
| Dread GM Toolbox | 1-29 | 1 | `dread {n}` |
| Vault of Ages | section + roll within it | 1 | `voa {k, n}` |
| The Dragon's Vault | 1-145 | 1 | `dv {n}` |
| Arazo's Artifacts | 1-78 | 1 | `arazo {n}` |
| Community items | community + 1-10 | 1 | `comm {c, n}` |
| Many Worlds Tavern | realm + a roll inside it (1-11 to 1-21) | 1 | `mwt {r, n}` |

- The nine roll pages share one layout (`RollPage`). Up to 760 px the `h1` and
  the lead are read, not drawn; the roll controls sit under the mode row; one
  results line holds «Бросок N» / "Roll N", «Настроить» / "Set up" and «Ещё».
  «Настроить» opens the settings over the results: the manual entry and, on the
  two own modes, the source and type rows. «Ещё» holds «Скопировать все варианты»
  (where the roll is a choice), the pin and the help. From 761 px the head holds
  the `h1`, the labeled pin and help, and the lead; a 320 px pane holds the roll
  controls and the settings, and the results line beside it holds «Бросок N» and
  the copy button. «Бросок N» reads the two faces on the alternate tables, the
  Hope die first; the line carries no instruction.
- A result is the card face, `RecordCard variant="face"`. A result is the tall face -
  the picture 4:3 fading into the plate, the roll number over its top right - only
  while the whole roll sits on one line: one result, at most 380 px wide, or two side
  by side, in a results column of at least 641 px. Otherwise each result is the row
  face: the picture 96 px beside the text, no number (the results line names the
  roll). Up to 600 px that is every roll; from 761 px a four-result roll and every
  roll in a results column under 641 px (owner, 2026-11-04). A result draws no
  relation line, no set line and no tier ladder, and no «Core» badge; another book
  keeps its badge. Under the plate sits a row of «В список», «Поделиться» and
  «Ещё», which holds the copies. A roll is page memory, so a sign-in from the row's
  «В список» returns to the record's own page, with the menu open there.
- The five dice of Core rules are plain buttons, none gold and none lit: a die is
  an action, not a choice. Each names the rarities it covers: up to 760 px two
  rows, three over two, with the count over the rarities; from 761 px a list under
  the group label «Бросить». The other modes have one gold roll button.
- A choice among parts is a native select with the name over the value: Vault of
  Ages, Community items and Many Worlds Tavern at every width, the rarity on the
  alternate tables up to 760 px. From 761 px the rarity is a row of neutral chips
  with no tier line.
- The source and type chips toggle; a row with every chip on draws each neutral
  pressed, and a row narrowed draws the chips left on in gold. The closed
  «Настроить» is lit while a row is narrowed and names the value left on
  («Расходники»); with two rows narrowed it reads «Настроить · 2».
- A help button carries its panel's name: «Где какая редкость» / "Where each
  rarity is" on Core rules, which holds the book's four placement lines and nothing
  else, «Об этих таблицах» / "About these tables", «Об этой таблице» / "About
  this table" on Wondrous Environments, «Об этих предметах» / "About these items"
  on Community items, and «Об этой книге» / "About this book" on the rest.
- The source switch on Core rules cannot be emptied - unticking the last one is
  refused.
- Rarity on Core rules only sets the dice count, so there is no rarity picker;
  each button is labeled with the count and the rarities it covers. Core
  rules spans four rarity bands (common, uncommon, rare, legendary); the
  alternate tables have a fifth, `very_rare`, that Core rolls never reach -
  intentional, per the Core book, not a gap.
- The roll button uses a real die where the range is one, and reads
  «Бросить 1-N» / "Roll 1-N" where it is not (119, 29, a list of arbitrary length).
- Other is two browsable tables, not a rolling mode: Starting items
  (`other_starting`) holds the non-rollable starting inventory as a plain
  list, and Frame items (`other_frames`) holds campaign-frame equipment
  sectioned by setting, with no roll number.
- Other's navigation subchips are the short `Стартовые`/`Сеттинги`
  (`Starting`/`Frames`) while each page's own heading stays descriptive: the
  descriptive wording measured 293 px on a 360 px viewport against the
  subchip's 260 px cap. Shrinking type, reducing spacing, wrapping,
  truncating, horizontal scroll and any other layout change were rejected -
  the short wording is the fix. The catalog head is measured, not the old
  strip: below 761 px the picker row is at most 64 px tall; from 761 px the
  group chips and the tabs together are at most 140 px below 1000 px (the seven
  supplement tabs take two lines: 130 px at 768, 2026-10-30), 180 px from 1000 to
  1139 px in Russian (the chips and the reserved tab row take two lines each:
  about 173 px at 1050, and the rows start at about 330.5 px at 1050x720, past the
  288 px first-screen limit) and 110 px from 1140 px (`tests/app/sweep.js`,
  at 500, 600, 700, 768, 1050 and the run widths, as gm2, the seventh group chip
  drawn). The reserved tab row holds the tabs of every group but the homebrew
  one: that group's source tabs hold the GM's own text, so `/tables/homebrew`
  alone may draw a taller row.
- The nine roll sections share the header's roll job «Бросок» / "Roll" and draw
  the mode row under the header ("Chrome";
  `docs/decisions/2026-10-29-the-header-has-three-jobs-and-a-mode-row.md`). The
  seven supplement modes (Wondrous Environments to Many Worlds Tavern) are the
  items of its «Дополнения» / "Supplements" menu, in table order, each a link to
  its section; the open one is checked and the current page, and the menu
  button shows its name. The name is the source's product name
  (`docs/decisions/2026-10-21-source-names-follow-the-source-product.md`). The
  roll pages draw no supplements panel. The catalog's tabs draw each book by
  its full name at every width; below 761 px the books are in the picker's
  sheet.
- The consumable/item kind filter is one toggle shared by Core rules and the
  alternate tables (`AppState.kinds`, memory only) - switching consumables off
  on one switches them off on the other, not per page. Search keeps its own
  kinds (`AppState.searchKinds`): a search narrowed to equipment leaves the
  roll pages' loot kinds on.
- A critical success in the alternate tables - the two dice showing the same
  face - hands over the whole rarity rather than a row: a link into each table
  that is switched on, at that rarity, plus a button that steps the rarity up
  one. There is no such button on legendary. With both kinds on the two links
  name their tables apart; with one on the label stays general. The table
  links open the table in a new tab, in the path form of the language on
  screen: a way into the tables, not an address to hand over.
- Each card on the alternate tables says which die found it, and its number
  badge is the face that die showed rather than the row the record has in the
  book it was printed in.
- Vault of Ages sections, communities and Many Worlds Tavern realms are
  different lengths, so changing the part resets the roll to 1: a number from
  one part would point past the end of another. One panel draws the three
  pickers (`PickerRollPanel.svelte`). A realm is a fixed chip: with no
  `mwt` rows (a `data.js` from before the source, held in the HTTP cache) the
  page says that the data did not load, as every roll page does with no rows.
- Many Worlds Tavern is six card sets, one per realm, in release order:
  Sporopolis (20), Wagerwood (20), Warrin' Warrens (21), Godsvale (20), Hornet
  Hold (11) and The Drome (17). 11, 17 and 21 cards are not a die, so on those
  three the button picks at random. Hornet Hold and The Drome print no card
  number: their decks run weapons, armor, items, then consumables, each by
  name
  (`docs/decisions/2026-10-21-unnumbered-many-worlds-tavern-realms-order-by-kind-then-name.md`).
  A record's badge, the equipment table's row badge
  and the print card name its realm («Спорополис»), as a frame record names
  its frame; the equipment `src` chip reads "Many Worlds Tavern", one value
  for the six realms. The printed rarity is not shipped, and the domain cards
  of the sets are not loot.
- The number field accepts digits only, clamps to the range, and keeps the caret
  where the person put it. On the list page an empty field means "no roll yet";
  on roll pages it waits for `change`.
- On the alternate tables each number field and each stepper names its own
  die - "Hope Die: Roll result" / "Hope Die: One lower" / "Hope Die: One
  higher", and the same for Fear - where the live app named both fields the
  same string and all four steppers the same two strings, so a screen reader
  could not tell which die was being changed. A deliberate accessibility
  improvement, not a drift.
- A hidden status region on every roll mode names the rolled records
  (`role="status"`), so a re-roll is read out without moving focus off the
  controls. The results themselves are no live region: a menu opens inside them.

## Tables and search

- 19 tables (`TABLE_IDS`), each with its own search box and a list/grid switch;
  the nineteenth, `homebrew`, has its group chip signed in only.
- The navigation has two levels. The group chips are Core, Hope & Fear, the
  alternate tables, «Дополнения» / "Supplements", Equipment, Other and, signed
  in, Homebrew (`TABLE_NAV`), a group labeled «Группа» / "Group" for
  assistive technology. Under them the book or section of the group are
  underlined tabs, a group labeled by the group's name; the current tab is
  gold text on a gold underline (`aria-current="page"`). «Дополнения» opens
  Wondrous Environments and is lit on each supplement table; its tabs are the
  seven books by their own names, in `SUPPLEMENTS` order. A record's path
  (`whereFrom`, the stubs under `i/`) keeps the book and never says
  «Дополнения». Below 761 px both levels are the table picker's bottom sheet:
  the picker button, named «Таблица: <name>» / "Table: <name>", reads the
  tab's caption, or the book over «Предметы» / «Расходники» on two lines where
  the caption names no book (`pickerParts`, its name `pickerLabel`); the sheet holds the group chips and
  the chosen group's tables, three taps to another group's table.
  The view switch («Список» / «Сетка», "List" / "Grid") changes the view
  until the page reloads; the default is the Display section's «Таблицы» row
  ("Account"), and the switch carries no note (owner, 2026-10-29).
- The list head (`docs/decisions/2026-10-30-list-pages-share-one-head-and-one-selection-bar.md`).
  The page name «Таблицы» is the `h1` at every width; below 761 px it is read,
  not drawn, and the head is the picker row: the picker, the view switch and
  «··· Ещё» / "··· More" (the three-dot icon and the word), whose menu holds
  «Ссылка на таблицу» (not on `homebrew`), the pin and «Об этих данных». That item
  opens and folds the panel under the head; while it is open the item draws a check
  for its icon (the pin item's mark) and reads `aria-expanded="true"`, and the panel
  starts with «Закрыть», which folds it and returns the focus to «Ещё». The roll pages'
  help item and panel up to 760 px behave the same way. From
  761 px the head is the `h1`, the labeled pin, «Об этих данных» and the two
  navigation levels. The head draws the same rows on every table of a band: the
  title row, the group chips, the second-level tabs, the toolbar and the list start
  at the same place (owner, 2026-11-04). From 1000 px the group chips sit beside the
  title and wrap inside their own box, and the tabs take the next row; from 761 px
  to 999 px both levels take their own rows under the title. The tab row keeps the
  height of the tallest group's tabs on every table, a table with no tabs included
  (`docs/decisions/2026-11-04-the-table-head-is-set-by-the-band-not-the-table.md`). The search row follows: the search first (placeholder
  «Поиск» / "Search", named by the long `searchPh`, at least 140 px at 360),
  «Фильтры» below 1000 px (plain at no pick, «Фильтры · N» lit while a value
  is picked: a gold label on a 45% gold border), from 761 px the view switch,
  the «Свои предметы» switch and «Ссылка на таблицу», then «Выбрать» last.
- A long table paints before all of it is built: the first 60 rows of the page draw in
  the first task and 60 more in each task after it; rows that arrive later (a filter
  cleared) and an anchored table draw at once. The counts, «Все» and the selection read
  the data, not the drawn rows (`docs/decisions/2026-11-04-a-long-table-draws-its-rows-over-several-tasks.md`).
- The count line, «<chosen values> · Показано N из M» / "<chosen values> · N of
  M shown", draws only while a filter or a query narrows the view: under the
  search row below 761 px, the values left and the count right with no
  separator; in the row from 761 px. From 1000 px the row draws the count
  alone, because the filter column shows the picks. The values are the chosen
  values in text, joined with a comma («Ранг 1, Вплотную»), cut to one line
  with an ellipsis; the count is never cut (owner, 2026-10-29). A query alone
  draws the count alone.
- «Об этих данных» / "About this data" (owner, 2026-10-29) opens three data notes:
  the sources and the translation credit, the tier in Wondrous Environments,
  and class against damage. Its button carries the panel's name.
- The selection mode (`AppState.selecting`, memory only): the catalog draws no
  tick column until «Выбрать» / "Select" is pressed. Then the ticks and the
  selection bar show, «Выбрать» hides and the focus moves to the bar's «Все».
  The bar's «Все» is the one select-all control of the catalog; to tick one
  section, pick its filter value, then «Все» (owner, 2026-10-30). Ticks that arrive
  with the page (a sign-in that returns with them) open the mode. «Снять
  выделение» clears the ticks, leaves the mode, also with zero ticks, and
  returns the focus to «Выбрать» (rule 20). `/search` has the same mode and
  bar, with no strip. The shared page keeps its ticks and its «Выбрать все (N)»
  strip until its batch.
- A row reads its name, then its tags after it, then the stat line, then the
  description; the text holds at 70 characters a line and a separator never
  starts a line. A row hides the tags that repeat what the page already says
  (`rowTags.ts`): the kind tag on a one-kind table or under one picked kind,
  the tier in the stat line and the tier tag under a tier heading or one
  picked tier, the source tag on a one-book table or under one picked book,
  and the «Core» source tag on every row: the default book is unmarked; a row
  from another book keeps its name. A row draws no relation line. A ticked row or tile is lit and neutral: the `--surface2`
  ground, the `--muted2` border and the checked box, never gold. A search
  marks the matched words of a name with `<mark>`, on a row and on a grid
  tile (`Marked`): a lit ground and an underline, not color alone; a stem
  match is not marked.
- The grid draws two columns up to 600 px. A tile is the art, the name and a
  second line: the stat line for equipment, else the other-language name
  (English first in English). Its roll number is a neutral badge; a table of
  more than one kind labels the tile with a kind badge, one pill: a long label
  wraps inside its border; a one-kind table draws none.
- The empty state is a dashed plate with the kind glyph, «Ничего не найдено» /
  "Nothing found", one cause sentence that names the query, the chosen values
  or both («Нет совпадений с «%q» среди фильтров: %v.»), and the primary
  «Сбросить фильтры» / "Reset the filters" while a filter is chosen.
- Search covers all 1459 records: names, descriptions and stat lines, both
  languages at once; `#/search` shows the first 300 matches - the cap is that
  page's alone, a table's own box is not capped. A signed-in author's own items
  rank with the catalog's matches, the catalog's record first on a tie, and the
  300 cap counts both. While the account holds items the intro adds «И N ваших
  предметов.» / "And N items of your own." after the catalog count, whatever
  the kind picked.
- **The `#/search` head** (`docs/decisions/2026-11-04-search-and-account-follow-the-list-head-and-the-error-page.md`).
  Up to 760 px one row holds the visible `h1` «Поиск» and «Ещё», whose menu
  holds the pin; the intro is read, not drawn (no picker fills the row, so the
  heading stays visible). From 761 px the page head: the `h1`, the intro and
  the labeled pin, no help. The search row follows: the search (placeholder
  «Поиск», named by `searchPh`, focused on arrival, at least 140 px from 360 px
  and 112 px at 320, where «Фильтры · 1» takes the room),
  «Фильтры» up to 760 px and «Выбрать» last, one line at every width.
- **The kinds of search**: «Все», «Предметы», «Расходники», «Снаряжение». From
  761 px they are a chip row under the search row, then the «Свои предметы»
  switch; up to 760 px «Фильтры» opens the sheet (`FilterPanel`) with the row
  «Тип» and, while the account holds an item, the switch as its first row. «Все»
  is the neutral pressed default; a picked kind is gold. A press from «Все»
  picks that kind alone, a press on another adds or removes it, and the last
  pick off returns to «Все» (`pickKinds`). The count line, «<picked kinds> ·
  Показано N из M», draws while a kind is picked or the matches pass 300: up
  to 760 px on its own line under the search row, from 761 px at the end of the
  kind row, where a long line takes a line of its own. M counts the matches
  over all kinds, N the rows drawn.
- **A search row** draws the roll number as «№ 89» / "No. 89" in its number
  box: no table is named on this page. A table row keeps the bare number.
- **The start state** of `#/search` (no query): the plate with the item glyph,
  «Что ищем?» / "What are you looking for?", one sentence (search reads names
  and descriptions in both languages at once) and three example queries as
  chips («зелье», «меч», «лечения зелья»; "potion", "sword", "healing
  potions"), each of which finds a record. A press fills the box and the box
  keeps the focus.
- **Nothing found** on `#/search`: the plate, «Ничего не найдено», one cause
  naming the query («Нет совпадений с «%q» в названиях и описаниях.»), or the
  query and the picked kinds, and one primary: «Сбросить фильтры» while a kind
  is picked (the focus then goes to «Фильтры» or the first chip), else «Очистить
  поиск» / "Clear the search" (the focus goes to the box).
- Search folds case, `ё`/`е`, typographic apostrophes (U+2019, U+02BC), Latin
  diacritics (`ä`/`ö` etc., NFD-stripped - Cyrillic is excluded so `й` never
  merges into `и`) and the Unicode minus sign (U+2212 -> `-`) on both the
  query and the catalog, so `плетеная` finds "Плетёная", a query typed with
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
- Every section heading is an `h2` with «Ссылка на раздел» / "Link to this
  section", a labeled button 28 px tall; sections are addressable.
- A row or section link (`#/tables/<table>/<key>` - what a record's "show in
  table" link produces; a section's copy-link button copies the same address
  as its preview link, below) scrolls to its target
  and outlines it in gold for 1.6 s. The scroll and the outline re-play on a
  language switch. A search keystroke, a tick or a view switch does not
  re-play them - the live app re-rendered and re-scrolled on each, a defect
  not reproduced.
- The three copy buttons of a catalog table - the table link, the filter link
  and a block's link - copy its preview link
  `https://daggerheart-loot.pages.dev[/en]/tables/<table>[/<tail>]`, with no
  `v` (`<site>[en/]#/tables/...` in a build with no preview host);
  `homebrew` draws none of the three: its address opens only the reader's own
  items (rule 17). The
  card: the table's name in the stub's words («Core · Предметы»), «N
  позиций» / "N items" of the table, a community or frame block's label and
  count («Сообщество: Великородное. 10 позиций»), a realm block's label and
  count («Мир: Воюющие Норы. 21 позиция»), the `comm`, `frame` and `realm`
  filter labels with no count on a filter, and the site picture. A table card
  keeps its old count in a message until the link is sent again.
- **The three equipment tables hold equipment from every source, not only the
  two books**: 458 weapons, 135 secondary, 114 armor. The `src` facet is how you
  narrow to Core and Hope & Fear (239 / 73 / 69). Frame, Vault of Ages,
  The Dragon's Vault, Arazo's Artifacts, Many Worlds Tavern, Wondrous
  Environments and Dread GM Toolbox equipment appears there too.
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
  last, no count, labeled «Источник» / "Source"; past 12 chips the row draws the first 10, the chosen one
  and «и ещё N» / «свернуть», closed when the page mounts, page memory; rule
  12), one always on, and the table shows that source only: its
  sections in order under their own names, then «Без раздела» for its items
  with no section; «Хоумбрю» has one heading «Хоумбрю». A chip is the `src`
  filter with one value (`f_src-<key>`, `f_src-hb`); `src` takes one value
  on this table, and two sources' values do not combine (`ROUTES.md`,
  "Homebrew"). The bare address picks the first chip and is kept; an anchor
  picks its source's chip and is kept; an address with a second `src` value,
  a value that names no held source or a `sect` value that is not a section
  of the chosen source is rewritten once to the chosen chip. A chip keeps `kind` and drops `sect`,
  keeps the ticks and the selection mode. Facets: `kind` and
  `sect` of the shown source's items, by the offer rule below (a section
  labeled by its name); no `src` row. Every facet write, «Сбросить» included,
  keeps the chosen chip. The page hands out no link: no «Ссылка на таблицу», no
  «Ссылка на фильтры» and no section copy button (rule 17). What the chips drop with two or more sources (owner accepted
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
  own item, the plate «Своих предметов пока нет» with the item glyph and a primary
  «Новый предмет»; a build with no sign-in
  configured, the not-found page with the address kept. A pin may hold it.
- **The «Свои предметы» switch** / "Own items": on `#/search` (after the
  kind chips from 761 px, the first row of the kind sheet below it) and on the equipment tables (in the
  search row after the view switch from 761 px, the first row of the filter
  sheet below it), drawn only while the account holds an item. It is
  a labeled switch (`role="switch"`, Space toggles it, the gold focus ring).
  It is on by default; off, it removes the own records and their `src` values
  from those pages for the visit. A record dialog, a list, `#/i/<key>`,
  `#/tables/homebrew` and the relation lines of a catalog card or row still
  draw them. It is memory only (`STATE.md`).
- The catalog's filters (`FilterPanel`) are a column beside the rows from
  1000 px, sticky under the header and scrolling inside itself, and a bottom
  sheet below it; the Items tab of «Мои предметы» draws them too ("Homebrew");
  the shared list page keeps the strip and its pills ("Lists") until its batch. Where a table has
  nothing to filter by, there is neither. A row offers only values the drawn
  rows answer and shows only when it can narrow; a picked value stays offered
  (owner, 2026-10-08). On `#/tables/homebrew` the drawn rows are the chosen
  source's. Each row starts with «Все» / "All", the neutral pressed default
  while the row has no pick; a press on it clears the row. A picked value is
  gold. The head reads «Фильтры · N» («Фильтры» at no pick), then «Сбросить»
  and, where the address carries the filter, «Ссылка на фильтры» once a value
  is picked. The sheet adds «Закрыть» to its head and a foot with «Сбросить»
  and «Показать N» (the shown count); Escape, «Закрыть» and a press on the
  scrim close it, and it has no grab handle. A filter link that arrives opens
  no sheet: the count line states the picks.
  Values in a row combine with *or*; a link naming two frames presses both.
- A row of more than 12 values (a source of many sections on `#/tables/homebrew`,
  the equipment `src` row of an author with many sources, the Items tab's rows)
  draws its first 10 values, then every picked value after them, then the fold
  «и ещё N» / "and N more" (N the values not drawn), which opens to every value
  and «свернуть» / "show less" (rule 12, one button both ways, `aria-expanded`).
  The open rows are page memory of the column or strip, closed when it mounts. A row of 12
  values or fewer draws whole; no catalog row has more than 11 (2026-10-20).
- In the catalog, «Сбросить» moves the focus to the first row's «Все» in the
  column, or to the sheet's «Закрыть»; the empty state's «Сбросить фильтры»
  moves it to the first «Все», or to «Фильтры» below 1000 px, else `#main`
  (rule 20). On the shared page and the Items tab, dropping a pill moves the
  focus to the pill now in its place, else the one before it, else «Фильтры»,
  else `#main` when the strip left; «Сбросить всё» moves it to «Фильтры».
- Filter state lives in the address (`STATE.md`), written with `replaceState` on
  every change, and read back only when the segment actually changed; on a
  share link too.
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
- In a one-record menu a press on a pressed chip removes the record with «Убрано из
  «%s»» / "Removed from «%s»" and «Вернуть» / "Undo". A list whose entries this tab
  has not read draws its chip busy (dimmed, announced busy, a second press does
  nothing, the focus stays) until they are read, so the undo writes back the
  quantity, price and notes the read held; a failed read toasts «Не получилось
  загрузить списки аккаунта.» / "Could not load the lists in your account." and
  removes nothing. A menu closed during the read
  still removes and toasts.
- Signed out (sign-in configured, no session) the reader holds no list: the menu
  draws «+ Новый список» / "+ New list" alone, with no label and no empty line, and the chip opens
  the sign-in prompt in its place.
- The index, from the eighth account list, draws a name filter («Найти список») under
  the create panel: it matches the list name, folded as search folds, keeps the
  group's order, lives in memory only and starts empty on every visit; a
  create clears it; no match draws «Ничего не найдено». The
  index draws the first 24 cards (`LIST_PAGE`) of what the filter leaves, then
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
  schema (`schema/import-v3.json`, «схеме import-v3» / "import-v3 schema") and
  `llms.txt`, relative, in a new tab. A refused file and the per-list errors
  draw in the error look (rule 19: the danger border and text, no fill). The
  toggle and «Отмена» fold the field and forget the file, and the focus returns
  to the toggle. A file of more than 5 MB is refused before it is read; a file
  that starts with a zip's signature is read as the data zip ("Account and
  browser lists", "Exports"), anything else as UTF-8 text. A zip of more than 10
  MB is refused before it is read, «Архив больше 10 МБ.»; a zip's chosen data
  file of more than 5 MB reads «Файл больше 5 МБ.». The import reads versions 1,
  2 and 3. A version 3 entry keeps its «Только для мастера» mark, on its link
  or on its fixed copy's link; `gm_only` in a version 1 or 2 file is an
  unknown field. A homebrew entry of a version 2 or 3 file imports as a link
  to the own item when the account holds its key, else when it holds the
  key's derived key (the homebrew file import's rule, "Homebrew"); any other
  with a snapshot becomes a new own item in «Хоумбрю» under the derived key,
  made from it, its `hb_` relations taking derived keys too, and the entry
  links it; one without a snapshot is skipped (`CONTRACTS.md` section 4). One
  copy is made per distinct key and snapshot: a later entry of the same key
  with another snapshot gets a new key, and cards likewise. The copies count against the
  item and card limits and `import_homebrew`'s 1000 rows; past either the
  import is refused whole and nothing is written. A homebrew entry is never
  skipped as unknown; its snapshot is optional, and one that is present is
  checked whole. Its own refusals read «snapshot: не копия предмета - сверьте
  поля с описанием в llms.txt» and «id «...»: не ключ своего предмета - hb_ и
  16 знаков a-z, 2-7». While the account's own items load, a version 2 or 3
  file with a homebrew entry, with or without a snapshot, draws «Ваши
  предметы ещё загружаются - это может занять минуту. Повторите чуть позже.»
  in place of the preview,
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
  skips draw at once. A zip's `homebrew.json` draws one line, «Сначала
  импортируйте файл homebrew.json из архива на странице «Мои предметы»: тогда
  списки свяжутся с этими предметами, а не с копиями.» (the order of "Moving to
  another account"); its other
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
- An entry's price field reads «Цена» / "Price". In a mode that converts, a
  priced row draws a small «?» after the label, outside it («Подсказка:
  Цена», rule 15 (c)); open, a line under the row's fields shows the price in
  book units («7 мешков 5 горстей») and follows a typed price. The open «?»
  are page memory, closed when the page opens; coin mode and an unpriced row
  draw no «?».
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
  «Выбрано: N» / "N selected". The bar is a region named «Выбранные записи» /
  "Selected records": it sits after the footer, outside every other
  landmark, pinned to the bottom of the screen. It is one shape on the
  catalog, `/search` and the shared page (`SelectionBar`): «Все» (a tri-state
  box named «Выбрать все», its label always visible, ticking every row the
  page draws, all sections), the summary, the actions («В список» / "Add to list",
  «Печать», «Скопировать текст», the shared page's send line), then «Снять
  выделение» last. Below 761 px the box, the summary and the clear are one
  row and the actions the next. With zero ticks in the catalog's selection
  mode it reads «Выбрано: 0», the actions are off and «Снять выделение» stays
  on. A neutral look: no gold.
- A typed quantity is held to 99, and a negative one to none; the field then shows the held value.
- A list has its own roll button, folded by default and opened on its
  summary; the row numbers match it. An empty roll field means no roll has
  been made yet, not zero. The panel, a row's own note box and the list note
  each keep the person's own fold/unfold across a language switch - the live
  `data-keep` opt-ins - rather than resetting to the data's own default the
  way every other re-render does.
- Two notes per list and per entry: «Для игроков» goes into the copied text
  and the players' share link, «Только для мастера» only into the GM's link.
  Each note is formatted text ("Records", "Formatted
  text") in a box of rule 18 (bold, italic, both lists, «Просмотр», the «?»),
  named by its label and described by its line, at most 4000 characters with
  no counter. A stored list or entry note is read the same way, with no
  migration.
  The rolled entry, `#/s/` and the clipboard draw it formatted, the
  link card plain. On `#/s/`
  the list's notes draw above the rows, and an entry's notes inside
  its row's border, under its main line and above its take line, as the
  owner's list page draws them. On the shared page only, the tick column and
  its divider run the full height of the row, through the notes and the take
  line, and a press anywhere in the column ticks the row; the checkbox stays
  level with the main line.
- A list page keeps the address it opened at, `/lists/<id>`: no edit
  rewrites it.
- Every other address the app copies - a table, a filter, a section anchor,
  a print sheet - is `<site>...` in Russian and `<site>en/...` in English,
  the path form the bar shows, so a messenger builds its preview in that
  language (`CONTRACTS.md` section 1).
### Account and browser lists

A build with sign-in configured keeps a signed-in reader's lists in the
account (`docs/specs/META.md` section 3). Browser lists, their move into the
account and the `#/l/` link left the app at R10; the browser keeps what an older
build stored, unread (`STATE.md`, "localStorage keys"). In every build a `#/l/`
address, plain or packed, draws the not-found page (the error page «Страницы по этому
адресу нет», the address in code and «На главную», "Chrome"), the address kept and the
payload never read. A build with no sign-in
configured has no lists: `#/lists` and `#/lists/<id>` draw the not-found page, the
address kept, and no add-to-list control is drawn.

- **Where a list is made**: signed in, every list made on the index, in the
  add-to-list menu or by "Сохранить себе" on a shared page is an account list.
  Signed out, each of those places draws the sign-in prompt instead: one line
  and one «Войти», never a provider button. On the index the create panel is
  the prompt («Войдите, чтобы создавать списки: ...»); in the menu the
  new-list slot is (no list chip is drawn; «Отмена» folds it back to
  «+ Новый список»; «Войти» takes the focus); on a shared page «Сохранить
  себе» reads pressed and opens the prompt under it, and a second press folds
  it. While the session is still unknown none of them is drawn, so a
  signed-in reader never sees a prompt flash. Every prompt that answers a press
  behaves the same way: the menu's slot, the selection bar's «Печать», and the
  boxed prompt under a pressed control (the shared page's «Сохранить себе», the
  record's «Печать» and «Сохранить себе») give «Войти» the focus and offer
  «Отмена», which closes the prompt and returns the focus to the control that had
  it. A page-level prompt (`#/lists`, «Мои предметы», `#/p/<id>`) leaves the focus
  where it is and has no «Отмена».
- **The return after sign-in**: «Войти» opens `#/account` and remembers the
  page and the started action; the account page's sign-in carries both
  through the provider redirect (`STATE.md`, `dhloot.auth.return`). Back on
  the page, once the account's lists are read, the action finishes by itself:
  the add-to-list menu reopens (the selection bar's with the same rows ticked
  and their taken counts; a menu started in the record dialog reopens on the
  record's page `#/i/<id>`); a shared list is saved into the account and opened. Leaving
  `#/account` any other way forgets it, and so does a navigation or a
  sign-out before the action finishes.
- **The index**: the heading «Мои списки» / "My lists" (the menu item's
  name; the header has no Lists job). Signed in, the create
  panel, then the group «Ваш аккаунт» / "Your account" - the count «3 списка
  из 50» / "3 lists of 50" (the limit from `my_limit()`, an override's own
  number; «3 списка» when the limit read failed; with a known limit «0
  списков из 50» too), which ends «· Не сохранено» in the danger color and
  «Повторить» while a write fails, announced with the save that ends it (the
  list page keeps its permanent status); the selection strip, then the
  account lists, newest
  edit first, each card with its pick box, the meta line «N позиций · изменён
  N назад» / "N items · edited N ago" under its name (`I18N.md`) and one
  «Удалить»; «Загружаем...» while the first read runs; «Не получилось
  загрузить списки аккаунта.» and a small «Повторить» when it fails; «В
  аккаунте пока нет списков - создайте первый выше.» under the count when
  there are none. A create at the account's list limit writes nothing and
  toasts the limit text («Достигнут предел списков в аккаунте: 50. ...»), the
  draft kept: in the index and in the add-to-list menu's new list. Signed out,
  the create panel is the prompt and no group is drawn.
- **An account list's page**, after the account's first read, draws «Загружаем...»
  (small, no heading) until its entries are read, and «Список не загрузился» / "The
  list did not load", «Не получилось загрузить списки аккаунта.» / "Could not load
  the lists in your account." and a primary «Повторить» / "Retry" when that read
  fails; «Повторить» reads them again. It
  counts every stored entry under the title
  against the entry limit, also one whose record it has not read, «10 позиций
  из 100 · Сохранено» («10 позиций · Сохранено»
  when the limit read failed); the name stops at 200 characters and each
  note at 4000 (`maxlength`, no counter). It keeps its address
  `#/lists/<uuid>`, draws «Поделиться» / "Share" first in its actions, «Скачать JSON» / "Download JSON" after
  «Скопировать текст», and says its save status
  after the count: «Сохраняем...», «Сохранено», or
  «Не сохранено» in the danger color and «Повторить». Only the failure and
  the save that ends it («Сохранено») are announced (a permanently mounted,
  visually hidden status region); the next save empties the region. Every
  edit shows at once and waits in one buffer; two seconds after the last
  edit the buffer is sent as one request, in order, and repeated edits of
  one field go as one write (ten presses of «+» send the final quantity
  once); making and deleting a list go through the same buffer. The buffer
  is sent at once when the tab is hidden or closed, on sign-out (which
  waits for it 5 s at most), before «Поделиться» reads the links, before
  «Сохранить себе» on a shared page makes its copy. «Сохраняем...»
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
  refused, with the toast, and the account is read again. The exception is
  a send of more than one edit that the database stops at its statement
  timeout: it is split in half at once, with no wait and no «Не сохранено»
  (the stopped statement changed nothing); a single edit stopped so keeps
  the three counted failures. A lost network, a
  server that does not answer or a database that is restarting is waited
  out, never split.
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
  or after it fails, such a row draws the entry's key as its name and
  «Предмет не загружен» / "Item not loaded" under it, with its tick, position,
  quantity, price, notes, eye and cross working, and the next read asks
  again; a catalog id the data no longer holds draws the same. The count, the
  position box and the roll count such a row; «Печать» leaves it out and
  toasts «Не напечатано предметов: N - они не загружены.». Another account's
  item joins the list page, the
  share page, the index's count and thumbs, the requests panel and the print
  sheet, and never search, tables or `#/i/`. The entry is decided by the
  key: an own key links the own item, another homebrew key links the item of
  the record the page holds (the open share's first, then the account's
  lists), and a key with neither is not written. While the account's items
  are still read, no homebrew entry is written, and «В список» says
  «Ваши предметы ещё загружаются - это может занять минуту. Повторите чуть позже.», or «Не
  получилось загрузить ваши предметы.» after a failed read. «Сохранить себе»
  on another user's link copies its links. An undo of a removed entry, from
  the row's cross, «Удалить (N)» or the record's list menu, writes back the
  same link; a link whose item was deleted meanwhile is refused as any
  write. «Печать» stores an own item and another account's linked item of an
  account list in the set it opens at `#/p/`, with the item's path as its
  source line.
- **«Свой предмет»** / "Own item"
  (`docs/decisions/2026-09-30-a-list-page-makes-a-plain-homebrew-item-in-one-press.md`,
  `docs/decisions/2026-10-01-the-quick-item-opens-under-a-lists-entries.md`):
  on an account list, a row «Свой предмет» after the last entry (pressed
  and expanded while open, folded on another list; on a window of 600 px
  and more it adds the gray hint «название и описание, остальное потом в
  редакторе») opens «Свой предмет в этот список» under it: «Название» *
  (focused; at most 120 characters), «Описание» (at most 3000, with the
  counter «N / 3000» past 2500; a box of rule 18 with bold, italic, both
  lists and «Просмотр»), «Добавить в список», «Отмена» and the note
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
  предмет можно создать здесь же, кнопкой ниже.».
- **Share links**: «Поделиться» reads pressed and expanded and opens a panel
  under the actions with two rows, «Ссылка для игроков» and «Ссылка для
  мастера», both ready on open: the panel reads the list's links (stopped
  ones too) and makes a link only for an audience that never had one, the
  players' first. An active row shows its link as the in-app address
  `#/s/<token>` (a named difference: the visible link opens the list in
  place, the copied one carries the card) and two buttons: «Скопировать»
  copies the preview link `https://daggerheart-loot.pages.dev/s/<token>?v=<v>`
  (`/en/s/` in English; `<site>[en/]#/s/<token>` in a build with no preview
  host), and toasts «Ссылка для игроков
  скопирована - заметок и позиций «Только для мастера» в ней нет» / "Players'
  link copied - it carries no "GM only" notes or items" or «Ссылка для мастера
  скопирована - в ней есть заметки и позиции «Только для мастера»» / "GM's
  link copied - it carries the "GM only" notes and items"; «Удалить ссылку» stops the link
  after the browser's confirm «Удалить ссылку? Те, у кого она есть, больше не
  откроют список. Отменить удаление нельзя.» and toasts «Ссылка удалена: по
  ней список больше не откроется.»; «Отмена» changes nothing. A row whose
  links are all deleted says «Ссылка удалена» and
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
  disabled while its change runs. An empty list can be shared.
- **The list card** of a share link's preview link: the list name (or «Без
  названия» / "Untitled"), «N позиций» / "N items" of the entries that the
  link's audience sees - a players' link counts the entries without «Только
  для мастера», a GM link every entry, as the GM page draws them - then `. `
  and the start of the players' note, fit to 480 bytes, and the site picture;
  a GM link's title adds « · Ссылка для мастера» / " · GM's link". A GM note,
  an entry note, an item name and a price never appear on a card, and a
  players' card never counts a GM-only entry. The link's `v` is a version of
  the name, the players' note and that count, made at the press, so the
  players' and the GM link of one list carry their own `v`. A messenger keeps
  the card it got after an edit or a revoke.
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
  into. The selection's «Скопировать текст», «Печать», the list roll, its numbers
  and the counts keep every entry.
- **The shared page `#/s/<token>`** draws the list as the link's audience sees
  it, read-only for everyone, the owner included: the name, today's
  «Список от другого игрока · N позиций», «Обновлено N назад» / "Updated N
  ago" under them (`I18N.md`), «Сохранить себе», the notes the link shows (a
  GM link adds the «Только для мастера» notes) and the rows, with the
  selection bar: taking some rows, or all of them after «Выбрать все», into a
  new or an existing list is the bar's add-to-list control, which carries the
  taken count as the quantity (none for a count of 1), the price and a row's
  players' note, never the GM's note; the bar shows the selection summary and
  the total, its «Скопировать текст» carries each taken count and unit price and
  ends with the total line, and its «Печать» stores each taken count. An
  entry the data no longer knows is dropped and counted in one toast
  («Пропущено позиций, которых больше нет в данных: 2»); a list whose every
  entry has left the data opens with no rows and the same toast. A ticked entry the list no longer holds
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
  between the two, once that list's entries are read (the page reads them; after a
  failed read the line draws without the count). «Сохранить себе» saves a
  copy into the account with only the notes the link shows (a player link's
  copy has no GM note) and opens it; signed out it opens the sign-in prompt
  under it, and after the sign-in the copy is made by itself; a refusal
  toasts the limit text or «Не получилось сохранить список себе. Проверьте
  соединение и попробуйте ещё раз.». A stopped, deleted, unknown or empty token, and every token in a
  build with no sign-in, draws «Список больше не доступен» / «Владелец удалил
  эту ссылку или список.» and «На главную», the address kept, never the home
  page; a read that failed draws «Список не загрузился» / «Проверьте
  соединение и нажмите «Повторить».» and «Повторить». While the first read
  runs the page draws «Загружаем...» with no heading (the heading is the
  list's name). When a drawn link stops (a revoke, a deleted list), the page
  draws the gone page and the status says «Список больше не доступен» once; a
  first read that finds nothing, also right after another token, says
  nothing. A re-read names the revision the page shows, and a list still at
  that revision answers with nothing to download or draw. A re-read also
  names the linked items' records the page holds by their hash, so an
  unchanged record is not downloaded again; an answer older than the one
  drawn is dropped.
  A players' link never holds an entry its owner marked «Только для мастера»
  / "GM only": the server leaves the entry out with its linked item's id, and
  numbers the rest from 0, so the count, the rows and the selection know only
  the rest; a GM's link holds every entry with its mark and draws a GM-only
  entry in the GM-only row look. «Сохранить себе» from
  a GM's link keeps the mark on each copied entry; a players' link's copy has
  no such entry.
  From 8 drawn entries (`LIST_SEARCH_AT`), or once a query or a filter value
  is set, one block sits between the notes and the rows: the tables' search
  box («Поиск по названию или описанию...», matched as a table's box, never
  over the list notes) and the table filter strip and panel ("Tables and
  search"). Once drawn the block stays until another list opens: dropping the
  last pill, clearing the query or a re-read that shrinks the list never
  removes it. The strip is drawn only while a row can narrow, so a list of
  alike entries shows the search box alone. The rows are Тип / Type
  («Предметы», «Расходники», «Оружие», «Вторичное», «Броня»), Источник /
  Source (the books in book order, «Предметы сообществ», the frames, then
  «Хоумбрю» and each own or linked source by name), Ранг / Tier, Класс,
  Характеристика, Дистанция, Хват and Линейка. A row offers only the values
  the entries the page draws answer, so a players' link never offers a
  GM-only entry's value, and is drawn only with two values or more, or one
  value some entry lacks; a row never narrows by the picks in another row,
  and no chip carries a count. The filter lives in the address,
  `#/s/<token>/f_<filter>` (`ROUTES.md`), written in place; a filter link
  opens the panel. While a value is picked the strip draws the copy-link
  button: it copies the preview link
  `https://daggerheart-loot.pages.dev[/en]/s/<token>/f_<filter>?v=<v>`, with
  the share panel's `v` of that token's card (`<site>[en/]#/s/...` in a build
  with no preview host), and toasts
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
  «Войти», which returns to that address; nothing while the session is
  unknown; «Загружаем...» while the session's account read runs;
  the heading «Список не загрузился», «Не получилось
  загрузить списки аккаунта.» and a primary «Повторить» when the read failed
  (never «Список не найден», which would call a list missing that may exist);
  today's not-found page («Список не найден» and «Мои списки») for an id the
  account does not hold, a local id an older build made among them.
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
  and fetches the heads of the lists whose revision moved (every list's head when
  more than 50 did). A page load reads each list's head with its entries' record
  ids, row ids, links and positions, and no note, quantity, price or GM-only flag;
  a list's entries are read whole when the tab first needs them (its page, the
  add-to-list menu's remove, the owner's players' link count, a download), fifty
  lists a request; a re-read reads a changed list whole only when the tab holds its
  entries, one request after its head. The owner's homebrew re-read does the
  same per table (sources, items, cards), and also fetches every row this
  tab wrote since its last read, so the row gets the database's times; every
  read of the pending purchase requests fetches each request's head with no
  lines (the index counts read them), and the lines only of the open account
  list's requests that the page does not hold. A list is marked read only
  when the page holds the lines of each of its pending requests. A read that
  answers after a newer read of the same store is dropped. A requests or
  homebrew read asked for while one of the same store runs is made once more
  when it ends. A shared page
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
  «Список больше не доступен». While «Запрос отправлен» holds, a plain muted
  line under the actions says what was sent and how long it waits: «Запрос
  (2 позиции · 7 шт.) ждёт ответа владельца до 30 дней. Если владелец его
  примет, взятое спишут из этого списка.» / "The request (2 items · 7 pcs)
  waits up to 30 days for the owner's answer. If the owner applies it, what
  you took comes off this list." (the pieces only when they differ from the
  entries; not a live region, not a warning; not while flow b's question or
  the print prompt holds the row). When the owner applies or declines a
  request this page load sent, while the page stays open, a plain toast says
  it: «Владелец принял ваш запрос.», «Владелец принял ваш запрос частично:
  взял не всё.» or «Владелец отклонил ваш запрос.» / "The owner applied your
  request.", "The owner applied part of your request.", "The owner declined
  your request.". If that request is the one «Запрос отправлен» holds, the
  line becomes «Владелец принял запрос.», «Владелец принял запрос частично.»
  or «Владелец отклонил запрос.», and the button stays disabled until the
  ticks or counts change. The words are the owner's own: «принять» /
  «отклонить», "apply" / "decline", with «Владелец» / "The owner" as the
  subject, because the sender does not own the list. After an apply the line
  usually goes at once: the apply's revision re-read lowers the stock, the
  taken counts clamp and the sent mark ends; the toast still says it. After a
  decline the line keeps its text. A hidden tab runs the toast unseen; a
  reload, a closed tab, an offline tab or a down feed at the decision misses
  it (Realtime does not replay), and an expiry says nothing. Another reader's
  request says nothing. An applied request reaches an open page as a lowered
  or removed entry, as any owner edit. Nothing of a request is kept in the
  browser: the sent ids live in the page's memory, the newest 20.
- **Purchase requests: flow b**: after an add from a `#/s/` page's selection
  bar (never a card's own menu), signed in and not the owner, `notifyGm`
  decides: «Спрашивать» replaces the bar's actions with «Сообщить владельцу
  списка, что вы взяли эти предметы?», «Сообщить», «Не сообщать» and
  «Запомнить ответ», the ticks kept, and the question takes the focus; after an
  answer the focus returns to «В список». «Сообщить» sends every
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
  color above the stock; «нет в списке» for an item the list no longer
  holds; the line sum at the price when it was sent, or «-») and the total.
  A request draws its first 5 lines, then a bare fold button «и ещё N
  позиций» / "and N more items", which draws the rest and reads «свернуть» /
  "show less", one button both ways, so the focus stays on it. The panel
  draws the first 3 pending requests, then one fold button «и ещё N
  запросов» / "and N more requests" that draws the rest the same way; the
  heading still counts every pending request and notice. At the limits (10 requests of
  100 lines) and at three times them the panel draws 15 lines and 4 fold
  buttons, so «Принять» of the first request stays within one screen of the
  panel head. While the first read, or the lines of the opened list, run, the
  panel's place holds «Загружаем...» (small); when that read failed, «Не
  получилось загрузить запросы.» / "Could not load the requests." and a
  small «Повторить»; a later failure keeps what is drawn. After «Принять»,
  «Принять доступное» or «Отклонить» the focus moves by rule 20.
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
  owner's Realtime topic, or on the 45 s poll on the lists pages and the
  shown-again signal while it is down. On every page an arrival after the
  page's first requests read (never a request this tab decided) shows the
  gold action toast «Новый запрос по списку «%s»» / "New request for the
  list "%s"", for two or more on one list «Новых запросов по списку «%s»:
  N», on two or more lists «Новых запросов: N», 7000 ms; an arrival while
  it shows or waits adds to its count and restarts its time. Its button
  reads «Показать» / "Show" on that list's page and «Открыть» / "Open"
  elsewhere: it opens the list and moves the focus to «Новое в списке (N)»
  once drawn, or to the main landmark when the read settles with no panel
  (the request decided elsewhere or expired); with several lists it opens
  `#/lists` and the focus goes to the main landmark. Unsaved edits that
  refuse the move leave the page as it is. A hidden tab holds the toast
  and shows it when the tab is shown again. The press marks nothing read.
  The tab title counts the unread requests that have not expired, on every
  page: «(2) Мои списки - Генератор лута Daggerheart»; a read request
  leaves the count, while the index card counts pending ones. The prefix is
  a count before the page's name and changes no word of it, so it is not a
  rule 4 departure. Another tab or device keeps its count until its next
  requests read, at most 5 minutes with a live feed (a read mark sends no
  message). A change-log notice has no toast: its hidden status on the list's page says
  «Предмет в списке изменился» once per arrival. A request's age, its time to
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
  on the 45 s clock or when the tab is shown again. A list is marked read
  only after a heads read of the page has answered. An apply or a decline is
  a read too. On the
  index an account card with pending requests says «2 запроса ждут ответа»
  in gold under its meta line, in its link's name too, and its unread
  notices after them, «2 запроса ждут ответа · 1 изменение», or alone «2
  изменения». An apply cannot be undone. A decision also goes to the
  request's own link while it is active, as the request's random id, its
  status and whether the apply took less than asked, so the sending page can
  say it ("Purchase requests: the send").
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
  the account's whole homebrew file ("Homebrew"), always `homebrew-v2`. A download that writes own
  items waits for them: while they load, or after their read failed, it toasts
  «Ваши предметы ещё загружаются - это может занять минуту. Повторите чуть позже.» and downloads
  nothing. A download first reads the entries of the lists this tab has not
  read; the index's «Скачать JSON (N)» is disabled while it runs, and a failed
  read toasts «Не получилось. Проверьте соединение и попробуйте ещё раз.» and
  downloads nothing. An export has no toast of its own, and a failed download toasts «Не
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
  в аккаунте.» alone, or after the bounds text. A list with more than a hundred
  entries imports only into an account whose entry limit holds it: the account's
  limit refuses it, not the file.
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

## Records

- Card in a modal from a table row, or a full page at `#/i/<id>`.
- The picture goes one step deeper than where it is drawn. On a roll result and on a
  list's roll hit it is the button «Открыть карточку» / "Open card", which opens the
  record dialog over the page; in the dialog it is the link «Открыть страницу» / "Open
  page" to the record's page; on the record page and in the editor's preview it is a
  picture only, no control.
- **The item page and the dialog.** `#/i/<id>`, `#/h/<uuid>` and the record dialog
  draw one dossier: no plate, the picture beside the text from 761 px and above
  it, cropped to 4:3, up to 760 px; the art file is not touched. The name is drawn
  once, the page's `h1` under the badge row, with the path line under it; in the
  dialog it is an `h2` with no path line and no «показать в таблице». The path line
  gives the source and the number, so the page's badge row draws neither; the dialog
  draws both as badges. The action
  row is the same at every width, in this order: «В список» / "Add to list" (the
  one gold primary, on a line of its own up to 760 px), «Поделиться», «Печать»,
  «Изменить» (the author only) and «Ещё». «Ещё» is a menu of «Скопировать текст»,
  «Скопировать название», «Скопировать изображение» (with a picture only),
  «Скопировать ссылку» (with a link only) and «Сохранить себе» with its second
  line; a pressed item and Escape return the focus to «Ещё», and in the dialog
  Escape closes only the menu. The menu opens down on a page; in the dialog it
  opens up where the room is only above, so from the dock.
- A roll result has the add control, «Поделиться» and «Ещё» under its plate, and no
  «Печать»; the copies are in «Ещё», without «Сохранить себе». The add menu opens
  down, and up where the window has no room below.
- An own homebrew item opens at `#/i/<key>` for its author only; any other
  reader, signed out included, gets the not-found page, and «Загружаем...»
  draws until the session and the author's items are known. Its path reads
  «Хоумбрю · <source> · <section>», its tag in the dialog and on a row
  «<source> (HB)» (the Latin mark in both languages) or «Хоумбрю», with «показать в таблице» to its row on
  `#/tables/homebrew`, and the action row adds «Изменить» (to
  `#/homebrew/<key>`) after «Печать». Its link is its preview link:
  «Скопировать ссылку» copies it and «Поделиться» carries it, in the language
  on screen (`https://daggerheart-loot.pages.dev/h/<uuid>?v=<v>`, `/en/h/` in
  English; `CONTRACTS.md` section 5), and a build with no preview host hands
  out the item address `<site>[en/]#/h/<uuid>`. While
  the author's items fail to load, the page keeps the heading «Не получилось
  загрузить ваши предметы» over the alert «Не получилось загрузить ваши
  предметы.» and a primary «Повторить», not the not-found page.
- **The item page `#/h/<uuid>`** draws one homebrew item for everyone, signed
  out too, in the record page's shape, with the author's relation lines: the
  item's own record and the author's related items (made from, upgrades to,
  the set, the upgrade line) as `get_homebrew_item` answers them, which win a
  key the reader also holds, so the reader and the author see the same
  «Получается из», «Улучшается до», «Комплект» and set bonus. A relation, a
  tier rung and a list row link to this address; «Скопировать ссылку» and
  «Поделиться» of an own or a linked item hand out its preview link (above). A rung or
  a relation of the author's item opens its own page; a catalog record opens
  over the page. A reader's line under the heading starts with «Предмет
  другого игрока» / "Another player's item", then the path; the action row
  offers «В список», «Поделиться», «Печать» and «Ещё» with «Сохранить себе», and no
  «Изменить» and no «показать в таблице»; a reader's «Печать» makes a set and
  opens `#/p/<id>`, and signed out it shows the sign-in prompt ("Print"). The author sees the own record's controls: «Печать»,
  «Изменить», «показать в таблице», and no «Предмет другого игрока». The page
  opens once the session is known, so the author never sees a reader's
  controls; a sign-in or a sign-out reads it again. While it reads it says
  «Загружаем...»; a failed read titles the page «Предмет не загрузился» with
  «Проверьте соединение и нажмите «Повторить».» and a primary «Повторить» (the
  `#/s/` failure's shape); a malformed id (read with no request), an unknown
  id, an item deleted meanwhile, and a build with no sign-in configured draw
  the record page's not-found page, the address kept. The page re-reads
  every 45 s, signed out too, and when the tab is shown again; it has no
  Realtime topic, so an author's edit shows within 45 s. A re-read that fails
  keeps what is shown, an unchanged one redraws nothing, and an older answer
  that arrives after a newer one is dropped. «Обновлено N назад» / "Updated N
  ago" under the heading, for a reader and for the author, names the latest
  edit of the item, its source and its named cards, and moves with the 45 s
  clock; an answer with no edit time draws no line. A visually hidden status
  says «Предмет обновлён» / "The item was updated" once per re-read that
  meets a new revision of the drawn item, and «Предмета по этому адресу нет» once when a
  drawn item goes; a first read that finds nothing says nothing.
- **«Сохранить себе» / "Save to My items"**, an item of «Ещё», on another account's item - on
  `#/h/` and in the record modal of a list row that links it - and on a
  catalog record - on `#/i/<id>` and in its record modal - makes an ordinary
  own item in «Хоумбрю» (no source, no section) from what the reader sees,
  one more at each press, each under a new key
  (`docs/decisions/2026-10-21-each-save-to-my-items-press-makes-a-new-copy.md`).
  A copy of another account's item drops the `hb_` keys of the author's other
  items in its relations and keeps catalog ids; its rule cards are copied
  under their derived keys, or named when the reader holds a card of the
  card's key or of its derived key, so a second press names the cards the
  first copied; it leaves out its set. A copy of a catalog record keeps its
  names, texts, loot tier, stat block (a record with one copies as
  equipment, with no record tier), `craft`, the records made into it as
  `craft_from`, upgrade line and rule cards, all as catalog keys and ids,
  and leaves out its table and card-set placement (`roll`, `recall`,
  `frame`, `starting`, `community`, `realm`) and its set, so a copy never
  joins its original's set line (owner, 2026-10-22,
  `docs/decisions/2026-10-22-a-save-to-my-items-copy-leaves-out-its.md`); a
  copy made before keeps its set. The copy keeps the source's name in each language; when an own
  item holds that name, it takes the smallest free number from 2, «Меч (2)»,
  «Меч (3)», "Sword (2)", each language on its own; a long base is cut so
  the name fits 120 characters, and a «(N)» in the source's name is not
  read. The copy no longer changes with the original. The item's
  second line, named by its `aria-describedby`, says, while one of the
  reader's account lists links another account's item, «Копия попадёт в
  «Хоумбрю», а строки ваших списков с этим предметом будут вести на неё.»,
  and signed out «Сначала вход в аккаунт» / "Signs you in first"; otherwise
  the item has no second line. The press relinks in place every such row
  to the copy, each keeping its position, quantity, price, both notes and
  the «Только для мастера» mark, and toasts «Предмет «%s» сохранён в «Мои
  предметы», строки ваших списков ведут на копию», else «Предмет «%s»
  сохранён в «Мои предметы»», with the copy's name, each with «Изменить» to
  the copy's `#/homebrew/<key>` in a new tab; each relinked row's key
  becomes the copy's. A catalog record's list rows stay on the record, and
  its record modal stays open. The press closes the menu; the item is
  disabled only while a copy is written.
  The item draws signed out, and signed in once the reader's items are
  read. A pending purchase request line of a relinked row's old key draws the
  raw key and reads short. Signed out the press opens a boxed sign-in prompt
  under the row, «Войдите, и копия предмета сохранится в «Мои предметы».»;
  the sign-in returns to the page (from a modal, to the item's or the
  record's own address) and one copy is made once the reader's items are
  read; a failed read of them says «Не получилось загрузить ваши предметы.»
  and writes nothing. While the reader's items or lists load it toasts
  «Ваши предметы ещё загружаются - это может занять минуту. Повторите чуть позже.» and writes
  nothing. A limit says its text; no answer says «Не получилось сохранить
  предмет себе. Проверьте соединение и попробуйте ещё раз.»; any other
  refusal «Сервер не принял копию: данные в аккаунте изменились. Нажмите
  «Сохранить себе» ещё раз.». The account's read after the write decides: a
  lost answer whose copy landed is a save. A lost answer whose copy is not
  found keeps the key in this tab's memory for that reader and source, and
  the next press of the source sends it again: the server skips a key it
  holds, so a retry never writes a second copy, and it never replaces a
  picture the landed copy holds. A file copied for a retry that then finds a picture
  is named by no row; the hourly clean-up deletes it, as any unnamed own file. A limit or a refusal drops
  the kept key; after a reload, the next press takes a new key. The copy
  takes the source's picture by the copy's row id, never in its content: a
  catalog picture is named as it is, and an own file of the author is copied
  to a file of the reader's under a new name, so the author's delete never
  removes it. The picture is written before the rows are relinked, so a tab
  closed in the middle leaves the rows on the author's item, and the next
  press makes another copy and relinks them to it. A failed picture write
  appends «Картинку скопировать не получилось - копия сохранена без неё.» to
  the toast, and the copy and the relink still land.
- A tag and a table path are two different things, and a record draws each in
  its own place. The line under a record page's heading is the record's
  complete table path - the group, its sub-table, and, for the two tables
  sectioned by a value the record itself carries (`other_frames` by `frame`,
  `community` by `community`), the record's own section leaf: a community
  record reads `Предметы сообществ · Великородное` / `Community items · Highborne`, and a
  Vault of Ages artifact or cursed object carries that word in the same line
  (`Vault of Ages · Артефакт` / `Vault of Ages · Artifact`, `· Проклятый
  предмет` / `· Cursed object`). The print card's source line and a generated
  share stub's subtitle are paths too, and are held to the same rule: a Many Worlds Tavern card prints
  `Many Worlds Tavern · Спорополис` / `Many Worlds Tavern · Sporopolis`. An
  equipment record's stub subtitle follows the path with its stat line,
  which drops the equipment type on the `eq_*` tables (the path names it)
  and the tier wherever the path already names it (a record with no roll
  number, and an artifact). The
  section leaf is not generalised past this set - a table earns one only when
  it is sectioned by a value the record itself carries, or, for Vault of
  Ages, by the book's own tiers; extending the rule to every table was
  rejected.
- The `.badge src` chip on a compact card, a table row, a Search result, a list
  row, or a modal card is a tag, not a path: one leaf naming the book, the
  community, or the setting - never a breadcrumb. It carries no path segment
  because every place it is drawn already shows the surrounding context (a
  table, a section, a list of results).
- Every weapon's stat line - record card, table row, copied text, share
  stub - names its class, secondary weapons too; the print card's class tag
  says the same (`docs/DECISIONS.md`, 2026-09-24).
- `#/i/<id>` for an id the data does not know draws the not-found page of the
  item routes: the title «Предмета по этому адресу нет» / "No item at this
  address", a sentence that names the address in `<code>` (cut at 80 characters
  with `...`), the primary «Найти предмет» to `#/search` and «Открыть таблицы»
  to `#/tables`. It keeps the plain tab title, the same as any
  other route with nothing of its own to name. A record that is found, a
  section, and an account list each title the tab with their own name ahead of
  the app's - `<name> - <docTitle>` (the live app wrote the name and then
  overwrote it with the plain title on the very same render, on both
  `#/i/<id>` and every other route that could have named itself). When
  `data.js` itself did not load, every page draws the "data did not load"
  line in place of its content (`NoData.svelte`) - the rewrite's own state;
  the live app threw on a missing `window.LOOT` and drew nothing.
- **Formatted text**: every long text field (a catalog record's, set's and
  rule card's text; a homebrew item's description, a set bonus and a rule
  card's text; a list's and an entry's two notes) is one line-based Markdown subset, read by one parser
  (`app/src/lib/markup.ts`). Each source line is one block, never joined: a
  paragraph; a bulleted item (`- `); a numbered item (1 to 3 digits, `. `),
  consecutive items one list that starts at the first number; a table, a `|`
  line above a separator line (`|---|---|`), then its `|` rows, a short row
  padded and a long one cut to the head. Inline: `**bold**`, `*italic*`,
  `***both***`; an unmatched `*` stays text; `_` is never a marker; `\` before
  an ASCII punctuation character writes it literally. No links, headings,
  images, code, quotes, raw HTML, nested lists or underline. The card draws
  real elements (a list, a numbered list, a table no wider than the card),
  the row one clamped run (`• `, `N. `, cells joined by ` | `), print real
  lists and a table inside the text block, the clipboard flat HTML; the stub,
  `catalog.csv`, the link cards and search read the plain text. The catalog
  text follows the catalog style below; no label is found by a colon any
  more. The catalog's die and rank results (`w6`, `dv14`, `di8`) stay
  bulleted lists, not tables (owner, 2026-10-14). Text written before 2026-10-15 is read the same way: a pair of `*`
  draws italics or bold, a `\` before ASCII punctuation is hidden, a line
  that starts "1. " is a numbered list, and a `|` line above a separator line
  is a table (`CONTRACTS.md` section 4, "Formatted text"). Homebrew authors
  type it in the box of rule 18 ("Consistency rules").
- **Catalog style**: every catalog record, set bonus and rule card text
  follows the SRD 2.0 card style; `tools/desc-style.mjs` writes it from the
  plain text and `tests/dataint.js` holds it ("catalog style"); for homebrew
  text it is advice, never enforced.

  | # | What | EN | RU |
  |---|---|---|---|
  | S1 | A feature or property name at a line head, Recall Cost included; a rule card's adversary feature (`<Name> - Passive:`) and a beastform or transformation feature. Stat lines stay plain | `***Reliable:*** +1 ...`, `***Recall Cost:*** 2` | `***Надёжное:*** ...`, `***Стоимость Призыва:*** 2` |
  | S2 | A cost the user pays by choice for an effect: an option ("can"), a price ("to", "for", "by"), an order with its effect - bold from the verb to the resource, the number inside | `you can **spend a Hope** to`, `**Mark a Stress** and clear a HP` | `вы можете **потратить Надежду**, чтобы`, `**Отметьте Стресс** и` |
  | S3 | A consequence, a penalty, another payer's cost, or a reference to a cost | `the target must mark a Stress`, `When you would spend a Hope` | `цель должна отметить Стресс`, `Когда вы должны отметить Стресс` |
  | S4 | A condition, core or defined by a feature, capitalized: the word only | `temporarily *Vulnerable*`, `*Restrain* the target` | `временно *Уязвимой*`, `*Обездвижить* цель` |
  | S5 | Dice and named rolls | `roll a d6`, `make a Spellcast Roll (15)` | `бросьте d6`, `Бросок Заклинания (15)` |
  | S6 | Ranges, damage types, numbers, difficulties | `within Very Close range`, `d8+2 phy` | `в пределах Близкой дистанции` |

  The feature-defined conditions are an allowlist in the tool
  (`FEATURE_CONDITIONS`, with each term's Russian forms); a lowercase form
  stays plain. A choice no rule makes is an override with its reason, and a
  record whose EN and RU really differ is a shape exception with its reason.
  Sources: SRD 2.0 PDF (`DH_SRD_2_2026_08_25.pdf`) p. 36, 16 and 97 (S1),
  218 and 97 (S2), 21 and 77 (S3), 52, 10, 29 and 83 (S4), 97 (S6); the SRD
  bolds dice and named rolls (p. 23, 9), bolds an adversary's stat heads
  (p. 97, "ATK:", "Experience:") and keeps loot costs plain (pp. 75-83); the
  catalog does otherwise (`docs/decisions/`, "Catalog text follows the SRD
  card style for names, costs and conditions").
- Copy name, copy link, share, copy image, copy text. Copied text goes to the
  clipboard as both `text/html` (name in `<b>`) and `text/plain`; Markdown
  asterisks are deliberately not used. Copy link and share carry a catalog
  record's link in the language on screen, extensionless and versioned -
  `<site>i/<id>?v=<v>` in Russian, `<site>i/en/<id>?v=<v>` in English, `<v>`
  the card version from the build's map, no `?v` when the map lacks the
  record (owner, 2026-10-28; `CONTRACTS.md` section 5) - and a homebrew
  item's preview link. That
  link's card - the name, the subtitle, the description, the picture and the
  stub's craft and set lines folded with «и ещё N», catalog names from
  `names.json` - draws at any set size; `v` is a version of the record, made
  at the press, so a changed item is a new URL to a messenger's cache. A
  re-shared link keeps the old set or craft line in a messenger's cache when
  only a related item changed.
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
- A compact card's and a roll card face's art zooms slightly on hover, guarded by `@media
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
- A campaign-frame record with equipment metadata (a tier, thresholds, armor
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
  catalog order, the record itself inert and the rest linked. A set's
  shared bonus (`LOOT.sets[key]`) is drawn under the set line on every
  member and travels into copied text (the set block's body), the print card
  (the last text line, `<name> (<Set>: <members>): <text>`), the share stub
  and `catalog.csv`. The set name leads the bonus in bold italic, as a feature
  name (catalog style S1), on the card, the print card (the name only) and the
  copied HTML; the plain-text copy, the share stub and `catalog.csv` keep it
  plain; a set with no bonus copies its line alone, with no blank
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
  HB», titled and named «<name> (HB)», with the ordinary border; on the card, the three
  relation lines draw the name with the badge «Хоумбрю» / "Homebrew" instead of the suffix. Each line
  and the ladder draw every catalog record, the record itself and three
  homebrew records - catalog records in their order, then homebrew ones by
  name, the ladder in tier order - then «и ещё N» (`aria-expanded`), which
  opens the rest and reads «свернуть»; a card opens closed. Only the full record
  card - the record page, `/h/`, the dialog and the editor's preview - draws the
  relation lines, the set line with its bonus and the tier ladder; a roll result, a
  list's roll result, a row and a tile draw none (owner, 2026-11-04,
  `docs/decisions/2026-11-04-relations-and-the-core-tag-draw-on-the-full-card-only.md`).
  The dialog draws the source badge, «Core» included; a roll result draws no «Core»
  badge. A badge stays on its name's line. Copied text
  writes one «Улучшается до» block per catalog target and per homebrew
  target up to three, each homebrew name with «(HB)», then one bodiless
  «Улучшается до: и ещё N» / "Upgrades to: and N more" line for the rest, so
  a copy has a bound; the print card's set label folds as the card does and
  keeps the printed record. Another account's linked item draws its own rung
  on its line's ladder and the bonus of its author's set card it names, also
  when no other member of the set is the reader's.
- A row - in a table, a search, a shared list or a list page - and the lists
  index strip draw the 160 px thumbnail `img/thumb/<asset>`; tiles, cards,
  the record page, print and copy-image draw the 640 px file. An own
  homebrew item's picture («Картинка» in the editor) draws on every one of
  these surfaces, the Items tab, `#/h/<uuid>` for every reader and every
  list that links the item, `#/s/` too: its 160 px file `t/<name>` on a
  row and its 640 px file `p/<name>` elsewhere, both public files of the
  Supabase bucket (`META.md` section 3); a picture chosen from the catalog
  draws as the catalog's. A list row of another account's item draws the
  author's current picture.
- A record with no artwork shows the glyph of its kind on the dark art well
  on every screen surface (card, row, tile, list cover, editor thumbnail:
  armor a shield, a weapon swords, a consumable a flask, any other item a
  gem), and hides the image button; so does a record whose picture or
  thumbnail fails to load, and the app remembers that for the session, so a
  failed thumbnail also shows the glyph on the record's card. While a
  picture loads, the glyph shows under it. The color print card draws it
  too, on a light well ("Print").
  Without a connection, a thumbnail the service worker never cached is
  answered with the cached 640 px picture when there is one, so
  the row draws that picture and nothing is remembered as failed
  (`META.md` section 9).
- The record modal is a native `<dialog>` opened with `showModal()`, so it is
  modal, the page behind it is inert, and focus moves to its labeled «Закрыть» on
  open, also when the card scrolls, and returns to the opener on close. From 761 px it
  is a centered card up to 980 px wide, «Закрыть» staying in view while the card
  scrolls. Up to 760 px it is a bottom sheet with a sticky head and a sticky action
  dock of two columns, the last control spanning both when the count is odd; in a
  window shorter than 481 px the dock joins the scroll, because it would take almost
  half of the height.
- The modal leaves the address bar as it is (owner, 2026-10-28): opening and
  closing it writes nothing, and its copy button hands out the record's link
  while the bar shows the page under it (rule 17 of "Consistency rules").
- A real navigation to a different address closes an open modal; a filter
  pick or a list mutation, which rewrite the address in place rather than
  navigating to it, do not. The modal also closes when its record leaves the
  page's index: a «Сохранить себе» from a list row's modal moves the row's
  key, a removal of the list's row of another account's item from the
  modal's add-to-list menu drops its record (the undo toast stays), and on
  `#/s/<token>` the GM's removal of a row of their own item drops its record
  (a catalog record stays in the index, so its modal stays). A page that has
  no index yet keeps the modal.

## Homebrew

A signed-in GM makes items that are not in the books: «Мои предметы» /
"My items". Homebrew items live in the account only
(`docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md`).

- **`#/homebrew` and its tabs**: the list head of the catalog ("Tables and
  search"), on every tab. Up to 760 px, once the items are read, the heading
  «Мои предметы» and its lead line are read, not drawn; one row holds the tab
  picker (named «Мои предметы: Предметы» / "My items: Items"), on the Items tab
  «Новый предмет» with no plus icon, and «Ещё» («Импорт из файла» and the pin).
  The picker opens a sheet with the four tabs, their counts and the limit
  counter; a tab press closes it. From 761 px the head holds the heading, the
  labeled pin, the tab links with their counts and, on the Items tab, «Новый
  предмет» with the plus icon, then the lead line (search finds the items with
  the catalog, they appear in the tables and go into lists). Signed out, while
  the items load and on a failed read the head draws the heading «Мои предметы»
  at every width, with no tabs, no import and no pin: up to 760 px the heading is
  visible there, and from 761 px the lead line stays. The pin draws only when the
  page is ready, at every width: a launch page that a signed-out visitor cannot use
  would end at a sign-in wall at every launch (owner, 2026-11-04). The pin pins
  `#/homebrew` from any tab, one pin for the page (pressed: «Открывается при
  запуске», the toast «Приложение будет открываться на этом разделе»; a second
  press unpins it). The page has no help panel (owner, Q6.1, 2026-10-29): each
  fact sits where it applies. The tabs «Предметы», «Источники», «Комплекты»,
  «Карты правил» / "Items", "Sources", "Sets", "Rule cards" are links to
  `#/homebrew`, `#/homebrew/sources`, `#/homebrew/sets` and `#/homebrew/rules`,
  the current one marked (`aria-current="page"`), each with its count: the own
  items, the sources, the set cards and the rule cards. From 761 px «Импорт из
  файла» is a toggle with a caret at the right end of each tab's first tool
  row; the panel opens under the head, above the tab's body, at every width. A
  tab press keeps the import panel open with its file, and keeps the ticks of
  the Items tab, so items ticked there move into a source made on the Sources
  tab; a source chip press on `#/tables/homebrew` keeps them too; every other
  navigation clears the ticks. On the Sources, Sets and Rules tabs the create
  button is the first control under the head.
- **The Items tab** (`#/homebrew`, `#/homebrew/f_<filter>` with a filter): the
  primary «Новый предмет» (to `#/homebrew/new`) is in the head. The tool row:
  from the eighth own item, or when a filter value is in force, the search box
  with the placeholder «Поиск» and the name «Найти предмет» / "Find an item"
  (either language of the name holds the query as search folds it; page
  memory, empty each time the tab opens) and, up to 999 px, «Фильтры · N», lit
  while a value is in force; from 761 px the limit counter «3 предмета из 100» /
  "3 items of 100" (every item, not the matches; the limit from the database,
  an override's own number; «3 предмета» when the limit read failed; red at the
  limit), the count «Показано 7 из 12» while a filter or a query narrows the
  list, and «Импорт из файла»; «Выбрать» last, while a row is drawn and the mode
  is off. With no item the row holds the import alone, and up to 760 px there
  is no row. Up to 760 px the count line under the row names the chosen values
  and «Показано N из M» while the list is narrowed, and the limit line draws red
  at the limit; the limit counter is otherwise in the picker's sheet. The filter
  is the catalog's: a column from 1000 px and a sheet below it, with the rows
  «Тип» (Предметы, Расходники, Снаряжение), «Источник» («Хоумбрю», then each
  source by name) and «Раздел» (the sections of the picked sources, every
  source's with none picked; two sections of one name each take their source's
  name in brackets), by the offer rule over the search's matches, and no link
  button. No pill row draws at any width. The box and the filter, once drawn,
  stay until the tab is left (the shared page's latch). The picked values are
  the address (`ROUTES.md`, "Homebrew"): a pick rewrites it in place, and Back,
  Forward and a reload keep the filter; a filter the page did not write (a
  filter address, Back from the editor, a press on «Предметы») opens the sheet
  below 1000 px; a tab press clears the filter, and so do the editor's own
  ways back - the breadcrumb, the delete and the not-found page - which open
  the bare `#/homebrew`, where the browser's Back keeps it. The sheet is page
  memory. A picked value no row offers (a section of a source no longer picked,
  a source a re-read removed, another account's key) leaves force: no narrowing;
  the address keeps it until the next pick, which writes only the values in
  force. Then the items as table rows under one heading per source and section:
  each named source by its creation, its sections in the author's order, then
  its items with no section under the source name, «Хоумбрю» / "Homebrew" last,
  empty headings and headings with no match left out, the items by name. Under
  a filter of one source a heading drops the source name. Group headings stay
  at every width. A row draws the tags the page does not already say, and an
  own item whose two names are equal and written in the other language than the
  interface draws a small language tag («EN» / «RU»). No match draws «Ничего не
  найдено» with the cause line and, while a value is in force, «Сбросить
  фильтры». A row opens the editor. The ticks draw only in the selection mode:
  «Выбрать» opens it and the focus moves to the bar's «Все»; «Снять выделение»
  leaves it and returns the focus to «Выбрать». The one selection bar holds
  «Все», «В список», «Печать», then from 761 px «Скопировать текст», «Переместить
  (N)» ("The bulk move"), «Скачать JSON (N)» ("Downloads") and «Удалить (N)»; up
  to 760 px these four are the items of the bar's «Ещё», which opens upward.
  «Все» and the actions act on the drawn rows only, and a tick the search or
  the filter hides is dropped, so a delete or a move never touches a row out of
  sight. «Удалить (N)» asks
  «Удалить предметы (N)? Они пропадут и из ваших списков. Если эти предметы
  есть в списках других игроков, строки пропадут и там - с количеством, ценой
  и заметками; владельцы списков увидят, что предметы удалены. Отменить
  удаление нельзя.». The delete sends one request per 50 ticked items, in
  order, each of which deletes all of its items or none: while it runs the
  bar's move and delete are disabled, focus waits on «Все», the status region
  says «Удаляем предметы (40)...» once, and a second press sends nothing; then
  the toast «Удалено предметов: N» and the ticks cleared, or «Не получилось
  удалить. Проверьте соединение и попробуйте ещё раз.» (assertive; after an
  earlier request deleted rows, «Удалено предметов: N. » comes first with that
  count) with every row not yet deleted and its tick kept for a second press,
  which deletes the rest, and focus on «Все», or on «Выбрать», else `#main`,
  when the bar left (rule 20). No items: the plate «Своих предметов пока нет»
  with the sentence «Свой предмет ищется вместе с книгами, виден в «Таблицах» и
  попадает в списки.» and no button (the head holds the primary).
  Signed out: the head and the
  sign-in prompt «Войдите, чтобы создавать свои предметы.». A failed read: «Не
  получилось загрузить ваши предметы.» and a small «Повторить». A pin may hold
  the page; with no sign-in configured the route draws the not-found page and
  keeps the address, as `#/tables/homebrew`. A stored `#/homebrew` pin opens the
  page at start, signed out with its sign-in prompt (owner, 2026-10-19).
- **The Sources tab** (`#/homebrew/sources`): «Новый источник» with the plus
  icon first, which opens the field «Новый источник» in its place, then the
  count («2 источника из 20» with the source limit known, «0 источников из 20»
  too; «2 источника» with none, nothing at 0; from 761 px with «Импорт из файла»
  at the row's right end), then the named sources by
  creation and the default source «Хоумбрю» last. The create button and the
  count share a row. From the eighth named
  source the search box «Найти источник» / "Find a source" sits under that
  row (either language of the name holds the query as search folds
  it; page memory, empty each time the tab opens): it draws the named sources
  it matches and «Хоумбрю» when its name matches, an open name field always;
  no match draws «Ничего не найдено» with the count kept. The default source holds every item
  with no named source; its row shows the count and «Скачать JSON». A named
  source shows its name in the language on screen (the other language when
  it has none), «N предметов · M разделов из 30» (the sections only from
  one), «Разделы» and «Ещё» with «Переименовать», «Скачать JSON», a separator and
  «Удалить». While a source holds an item, its name links to its items on
  `#/tables/homebrew` through the `src` filter (`f_src-<key>`; «Хоумбрю»
  `f_src-hb`), its sections included, which picks its source chip; an empty
  source's name, «Хоумбрю» included, is plain text, since its address would
  open another source's chip. «Разделы» opens its sections, each with its count,
  «Переименовать» and «Удалить» (past 20 sections the first 20, then «и ещё
  N» / «свернуть», page memory; an open rename field always drawn; rule 12),
  then «Без раздела» with its count, then «Новый раздел» with the plus icon. A name typed in a source field is lost
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
  its place), beside it the count: the tab's own kind, then every card against
  the shared card limit («1 комплект · 2 карты из 100», «1 карта правил · 2 карты
  из 100»; with no limit known «1 комплект · 2 карты»), from 761 px with «Импорт
  из файла» at the row's right end; then from the eighth card of the kind the
  search box «Найти комплект» / «Найти карту правил» ("Find a set" / "Find a
  rule card"; the name or the subtitle in either language holds the query), then
  the cards by name. A card is a
  fold named by the card, closed by default: its head shows «N предметов»
  (the own items that name it and the book items it holds) with its source,
  «Изменить» and «Удалить».
  `#/homebrew/sets/<key>` and `#/homebrew/rules/<key>` open that card's fold
  and scroll to it; an unknown key or a key of the other kind opens nothing
  and keeps the address; a press on a fold does not write the address. An
  empty tab draws the plate «Комплектов пока нет» with «Комплект - предметы с общим
  бонусом: бонус виден на карточке каждого из них.», or «Карт правил пока нет» with
  «Карта правил - правило, на которое ссылается предмет: заклинание, черта,
  противник.», and no button; a query
  with no match «Ничего не найдено». Open, a card shows its text (a set's
  bonus; a rule card's subtitle in italics, its text and its link), then the
  field «Добавить предмет» / "Add an item" (an item picker over the own and
  book items that are not members, ranked as search ranks them, with their
  meta; on the Sets tab not a book item of a book set; «Найти предмет»),
  then its members by name, own and book items in one list, each a link to
  the item's address, a book item with its book's name after it, with
  «Убрать» / "Remove" (past 20 members the first 20, then «и ещё N» /
  «свернуть», page memory; rule 12). An own item's add or «Убрать» writes the item; a book
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
  «<item>»»; after «Убрать» the toast carries «Вернуть» (7000 ms), which adds
  the member back from the account as read at that press (an item another
  device moved into another set asks the move question; a card deleted
  meanwhile does nothing); an item changed on another device reads the items again and
  toasts «Предмет изменили на другом устройстве. Данные обновлены -
  повторите.», a deleted one «Этот предмет удалили на другом устройстве.», a
  limit its text, a lost network «Не получилось сохранить. ...»; an item
  whose write is in flight is not offered. «Изменить» opens the card form in
  place of the card's row; one form is open at a time, and an open form
  stays while the query hides its card. A changed card form asks before a
  navigation and on a closed browser tab, as the editor's guard does. A card delete
  toasts «Комплект «%s» удалён» / «Карта правил «%s» удалена». Each card form, inline or on a tab,
  opens with «Язык текста». The set form
  holds «Название комплекта» and «Бонус комплекта»; the rule card form
  «Название карты», «Подзаголовок» (optional), «Текст карты» and «Ссылка»
  (optional; empty, or `https://` in Latin characters with no spaces); on the
  tabs both hold «Источник» with the caption «Без источника карта лежит в
  «Хоумбрю».». The bonus and the card text are boxes of rule 18 with «Просмотр»
  (the bonus: bold, italic and a list; the card text: all five). The name stops at 80 characters, the subtitle at 60, the
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
  buttons and keeps the typed text; when no problem is in the shown
  language, the press switches to the language of the first one and focuses
  its field. A name is checked in each language it changed (every language
  of a new card). A card another device deleted closes
  its edit form and toasts «Эту карту удалили на другом устройстве.». A
  save writes both languages, one it did not change as the account holds it
  at the press, and the form names how many items show the change. Deleting a
  card asks, N counting own and book items, «Удалить карту правил «%s»? Она указана в N предметах - там она
  пропадёт. Отменить удаление нельзя.» or «Удалить комплект «%s»? Он указан
  в N предметах - там пропадут его название и бонус. Отменить удаление
  нельзя.», the short form («Удалить карту правил «%s»? Отменить удаление
  нельзя.») for a card no
  item names; the items keep its key and draw nothing for it, and an editor
  save keeps that key.
- **The editor** (`#/homebrew/new`, `#/homebrew/<key>`): the form beside a
  live full card of the item from 800 px; 761-799 px the card under the form; up
  to 760 px the card is in the sheet «Предпросмотр». An item with no name yet
  reads «Новый предмет» on it. While the items load the page draws the heading
  «Мои предметы» and «Загружаем...». The heading row is a breadcrumb: the link
  «Мои предметы» (the way back at every width, under the guard), then the item's
  name, or «Новый предмет», as the `h1`, cut to one line up to 760 px and to
  three lines from 761 px with the whole name in `title`; the line under it is
  the item's path, with the tier of chosen equipment. Optional fields carry the
  word «необязательно» / "optional" after the caption; required ones carry no
  mark, and the controls keep `required` and `aria-required`. The fields stand
  in three headed groups: «Предмет» / "Item" («Вид» (item, consumable,
  equipment), for equipment «Тип снаряжения», «Язык текста», «Название» (at most
  120 characters), «Описание» (at most 3000, a counter past 2500; a box of rule
  18 with all five buttons and no «Просмотр»: the card is the preview, live on
  every input; in the print view, a warning after its counter, below; typing it
  rebuilds no relation of the card, which no relation line draws), «Картинка»
  (below), and for loot and consumables «Ранг» («Без ранга», 1-4)); for
  equipment «Характеристики» / "Stats" («Ранг» (1-4, no default), for weapons
  «Класс», «Характеристика», «Дистанция», «Урон», «Тип урона» («Физический»,
  «Магический», «Оба» / "Physical", "Magic", "Both"), «Хват» and the disclosure
  «Второй набор характеристик», for armor «Показатель брони» and «Пороги
  урона»); «Где лежит» / "Where it goes" («Источник» (with «+ Новый
  источник...», which makes the source at once and selects it) and the caption
  «Без источника предмет лежит в «Хоумбрю».», for a named source «Раздел» (with
  «+ Новый раздел...»; a source change resets it)). From 1000 px the short
  choices of the last two groups pair in two columns.
  «Характеристика» and the second set's offer the six traits, «Характеристика
  Заклинателя» and «Любая» / "Any" (`any`, the weapon takes any trait, as the
  catalog's mw47 does; owner, 2026-10-21).
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
  second set. A field of the editor draws no «?» (owner, Q6.2, 2026-10-29).
  «Второй набор характеристик» is a button that shows and hides the set (the
  fields stay in the form while hidden; a save problem inside it opens it); a
  second press on a pressed choice of the set unpresses it (a pressed choice of
  the main stats stays pressed), and «Очистить второй набор», drawn while the
  set holds a value, empties the set and its lines, keeps the rest of the form
  and focuses the set's
  button. The card follows «Вид» and «Тип снаряжения» at once: the type's badge
  and glyph draw with no tier. It draws no stat block until a tier is chosen: a
  tier is never shown that the author did not choose. The card of a saved item has
  «В список»: it adds the stored item as a link, so unsaved
  edits reach the list with «Сохранить»; a new item has none before its
  first save. The type and the weapon values stay in the form while another
  kind or type is chosen.
- **The print view**: above the card, «Показать карточку» / "Show the card"
  with «На экране» / "On screen" (pressed at each mount) and «На печати» /
  "In print". «На печати» draws the print card ("Print") at the preview
  column's width, at most 420 px (the column is 340 px from 800 px and 420 px
  from 1100 px; under 800 px the content width): the cell is 63x88 mm or 44x63
  mm times a scale cut to two decimals, and the card multiplies every `mm` and
  `pt` value of its stylesheet by it (the rest is in `cqw`), never a transform,
  so the fit and the clip verdict are the print page's. It keeps the set line
  and the text language of the form, in place of the screen card and its
  «В список». The print bar's two switches sit beside the view
  switch and are its visit pick: a pick here is the print page's, and the
  reverse; the editor draws no note about the default. The switches wrap and
  speak the interface language. While the print card still cuts off text
  after its fit, a warning box (rule 19) after the «Описание» counter reads
  «Текст не помещается на карточку при печати: его конец не напечатается.
  Можно сократить название или описание.», for the layout on screen; the
  card and the warning follow the typed text 150 ms after the typing stops.
  «На экране» removes it. The editor does not print, and the warning blocks
  no save. The set and rule card forms have no print view: a set's bonus is
  checked in a member's print view (owner, 2026-10-14;
  `docs/decisions/2026-10-15-the-editor-previews-the-print-with-the-print.md`,
  its size superseded by
  `docs/decisions/2026-10-21-the-editor-draws-the-print-card-at-the.md`).
  The warning box and the conflict and gone banners are said once by the
  form's status region when they appear (rule 19).
- **Relations**: the fold «Связи» / "Relations" closes the form, its summary
  «Связи · N» for the N relations the item names. It is closed for an item
  with no relation and open for one with any; a save problem inside it or an
  open card form opens it. For equipment, «Линия улучшений» («Уникальный» by
  default, «В линии», «Новая линия»): «В линии» picks equipment of the same
  type in an upgrade line, catalog or own, and draws the line's lowest rung
  with «линия из N рангов»; «Новая линия» starts a line at this item, which
  other own items of the type can join. The caption under the choice reads
  «Одно снаряжение на рангах 1-4: карточка рисует лесенку рангов.». Every
  relation is optional and draws no «?». «Улучшается до» and «Получается из»
  hold up to 8 items each, catalog or own; the item itself is never offered.
  «Комплект» is a select of the catalog's sets and the own ones («<name>
  (HB)»), with «+ Новый комплект...», which opens the set form in its place
  and selects the set it makes; a chosen set draws «Бонус комплекта: <text>»
  under the select, in the language of the text boxes. «Карты правил, до 3» /
  "Rule cards, up to 3" holds up to 3 cards, the
  catalog's and the own ones, with «Новая карта правил» and the plus icon,
  which opens the
  rule card form and adds the card it makes. A card made here goes into the
  item's source and is written at once («Комплект «%s» создан» / «Карта
  правил «%s» создана»). An item picker finds items as search does
  ("Tables and search"), the best matches first; the card picker finds cards
  by name or subtitle as one substring; both match both languages and list
  at most 8 matches, then «Ещё N - уточните запрос», or «Ничего не найдено».
  These lists, the picture picker's and a card's «Добавить предмет» list open
  under the field, or above it when the list does not fit under it and the
  room above is larger (the visible window less the on-screen keyboard and
  the sticky top bar), no higher than that room; a resize, a pan of the visible window or a page scroll places the
  open list again. ArrowDown
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
  an armor score 0-12; thresholds two whole numbers 1-99, the second larger;
  the second set all four fields or none, and its lines name «Очистить второй
  набор»; a set emptied by any path takes its lines along. «В линии» with no
  line reads «Выберите предмет из линии или нажмите «Уникальный».», a line of
  another equipment type «В этой линии снаряжение другого типа: выберите
  другую линию или нажмите «Уникальный».», and a save while the set or rule
  card form is open «Создайте комплект кнопкой «Создать комплект» или
  нажмите «Отмена».» / «Создайте карту кнопкой «Создать карту» или нажмите
  «Отмена».». A source another tab deleted reads «Этот источник удалили -
  выберите другой.».
- **«Картинка» / "Picture"**: a 96 px
  square, then «Выбрать файл» and «Выбрать из предметов», or, with a
  picture, «Заменить», «Обрезать заново» (while the chosen file is held in
  memory) and «Убрать картинку»; the line under it reads «Квадрат 640x640 из
  файла PNG, JPEG или WebP до 20 МБ. Картинка загрузится при сохранении.». A
  file over 20 MB is refused at once («Файл больше 20 МБ - выберите файл
  поменьше.»). Otherwise the dialog «Обрезать картинку» opens (a lazy chunk;
  a failed load draws «Не получилось загрузить окно обрезки. ...» with
  «Повторить», the file kept) and decodes the file: one it cannot open, a
  short side under 160 px or a long side over 8000 px closes it with «Не
  получилось открыть картинку. ...», «Картинка меньше 160 пикселей ...» or
  «Картинка больше 8000 пикселей ...» under the field. The dialog shows a
  square frame over the picture; a drag, the arrow keys on the focused stage
  (2 % of the square, 10 % with Shift), + and - and the range «Масштаб» (from
  the short side to 4x) move and zoom it; it opens centered at the smallest
  zoom. «Готово» renders the 640 px square and the 160 px square of the same
  part, WebP at qualities 0.85 to 0.55 until the 640 px file is at most
  200 KB, JPEG where the browser cannot encode WebP (Safari); none fits says
  «Не получилось сжать картинку до 200 КБ - выберите другую.». «Отмена»,
  Escape and the backdrop keep the field as it was. The dialog keeps its
  keys from the form: Enter and Ctrl+S inside it save nothing. «Выбрать из
  предметов» opens a picker («Предмет с картинкой») over the catalog's
  pictures and the author's own items with a picture, never the item itself
  or another account's item; a pick names the same picture, with no upload.
  To replace a picture by another item's, the author removes it first. The
  form and the preview card draw the choice at once; nothing uploads before
  «Сохранить», and the guard counts a chosen file, a picked picture and a
  removal as edits. The save uploads the 640 px file, then the 160 px file
  («Загружаем картинку...» under the buttons), then writes the row; a
  text-only edit sends no picture, so a picture another tab set stays. A
  lost upload says «Не получилось загрузить картинку. Проверьте соединение и
  попробуйте ещё раз. Правки остались в форме.» and
  keeps the form, and the next press sends the same names; the picture
  limit, the item limit plus 5 (105 at the defaults), says «Не сохранено.
  Достигнут предел картинок: N. ...». A row write refused because the file
  is gone takes a new name and uploads once more when the form holds the
  cropped file, and otherwise says «Картинка не сохранилась: файла уже нет.
  Выберите картинку заново.» under the field with every other edit kept;
  «Сохранить как новый» after another device's delete names the loaded
  picture, so a deleted own file is refused that way and a catalog picture
  saves. The browser never deletes a file: the database deletes a file no
  item names (`META.md` section 3).
- **Saving**: «Сохранить», Ctrl+S or Cmd+S, or Enter in any one-line field
  of the form saves. From 761 px the button row reads «Сохранить» and, on a
  stored item, «Удалить». Up to 760 px it is a bar stuck to the bottom of the
  window: «Сохранить», «Предпросмотр» (opens a sheet with the view switch, the
  print switches and the card; the focus returns to it) and, on a stored item,
  «Ещё», which opens upward with «Удалить»; a window shorter than 481 px leaves
  the bar in the flow. The way back is the breadcrumb and never reads «Отмена»,
  which would say that a save is undone. A refusal line under the buttons redraws in the
  language on screen after a switch. A new item's save replaces the address with
  `#/homebrew/<key>` and keeps the form and the focus; an edit writes over
  the revision the form loaded. A create toasts «Предмет «%s» создан», an
  edit «Сохранено: «%s»». The limit
  draws «Не сохранено. Достигнут предел своих предметов: N. ...» under the
  buttons, a lost network «Не получилось сохранить. Проверьте соединение и
  попробуйте ещё раз. Правки остались в форме.» (rule 2); both keep the form. An
  item changed on another device draws «Этот предмет изменили на другом
  устройстве, пока форма была открыта. Ваши правки не сохранены.» with
  «Сохранить мою версию» (danger; reads the account again, then writes over it;
  a language the author did not change keeps the other device's write) and the
  primary «Показать новую версию» (asks «Ваши правки пропадут. Показать новую версию?» while the form is
  dirty, then reloads; a read that fails keeps the form and says «Не
  получилось сохранить: ...»); «Сохранить» is disabled while the banner shows, so
  no plain press overwrites the other device. An item deleted on another device draws «Этот
  предмет удалили на другом устройстве.» with «Сохранить как новый» (a new
  key; the address moves) and «К моим предметам». A read that removes the
  item under a dirty form keeps the typed text and draws that banner; a
  clean form reloads when a read brings a newer row, and draws «Предмет не
  найден» when the row is gone. A press sent again after a lost answer
  never makes a second item or source.
- **Language**: one switch per form, «Язык текста» / "Text language" with
  «RU» and «EN» (the codes of the app's language switch), picks which
  language the name, the subtitle and the text boxes show; the labels stay
  in the language on screen, and each box carries `lang`. A language with
  no name, subtitle or text reads «EN - пусто» / "EN - empty" on its
  button. The form opens on the item's own language: the language on
  screen for a new item or one named in both, else the one language that
  names it. The card beside the item form draws the shown language. Its
  links open in the language on screen. A save
  writes both languages in one write (one revision); a language the author
  did not change is written as the row holds it, a changed one trimmed. The
  summary names a problem of the hidden language with its code («Описание
  (EN) - ...»), and a press on it switches the language and focuses the
  field. «Свой предмет» on a list writes the language on screen only.
  Source and section names keep the one-language rename of "The Sources tab".
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
  and «Отменить удаление нельзя.» (rule 3); while the account's lists are
  not read (loading or a failed read), the question adds «Если предмет есть
  в ваших списках, он пропадёт и из них.» in place of the count;
  the other items keep its key and draw nothing for it; the item leaves the
  account, its entries leave every list that links it, the page goes to `#/homebrew`
  and toasts «Предмет «%s» удалён». A failed delete draws «Не получилось
  удалить. Проверьте соединение и попробуйте ещё раз.». The editor names
  how many account lists hold the item.
- **Where an item is used**: an own item goes into the account's lists as a
  link and draws live there, on their share links too; «Свой предмет»
  on a list page makes one in one press ("Lists"). A lists file never carries an
  own key. A
  list another user saved from a share link, or added the item to from one,
  links the item too and draws it live, with its source and the author's set
  and rule cards it names. Search ranks own items with the catalog's, and the tables
  draw them on `#/tables/homebrew` and, for equipment, in the equipment table
  of its type ("Tables and search"). On the author's own card (`#/i/<key>`,
  the record modal of an own item, `#/h/<id>` as the author) the name of an
  own set before its bonus links to the set's fold on the Sets tab, and each
  own rule card ends with «Открыть в «Мои предметы»» / "Open in "My items""
  to its fold on the Rules tab; a reader's card draws neither. «Сохранить
  себе» makes one more own copy at each press, of another account's item or
  of a catalog record, with one control, write and toast; a copy keeps the
  source's name or takes the next free number per language (owner,
  2026-10-20 and 2026-10-21; "Records").
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
  of «Импорт из файла», "Lists"); the file row holds the links «Формат файла»
  (`schema/homebrew-v2.json`) and `llms.txt`, and one line under it says what
  fits: «Подходит файл из «Скачать JSON», архив из «Скачать мои данные» или файл
  по описанию в llms.txt.». The field still takes a `homebrew-v1` file. «Обновить»
  with a version 1 file keeps a held card's book items; a version 2 file
  states them, so a card without `items` loses the held ones
  (`docs/decisions/2026-10-21-on-a-homebrew-v2-file-states-each-cards.md`). A key the
  account holds stays; any other `hb_` key of a source, a section, a card or
  an item becomes the account's derived key (a section's key stays while its
  source keeps its own), every `hb_` reference of the file following, also one
  to an object the file does not hold; the preview, the held-key question, the
  notes and the rows read that file, and a note names the file's key. So the
  same file chosen again finds its keys held
  (`docs/decisions/2026-10-10-a-key-the-account-does-not-hold-becomes-a-derived-key.md`).
  A file whose derived key equals another of its keys draws the error report. A
  zip's `lists.json` draws «Затем импортируйте файл lists.json из архива на
  странице «Мои списки».» (the second step of "Moving to another account"). A
  file the app refuses whole says why in one alert line (not
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
  reads «В «<name>» будет больше 30 разделов - выберите другой источник.»; a
  press with such a row or a refused custom name sends nothing, opens the
  fold when the row is past it, and focuses that row's select or name field.
  Past 20 rows the rest fold behind «и ещё N источников» / «свернуть». With
  the item limit read, a file whose new items pass it draws «Импорт не
  поместится: в аккаунте 4 предмета из 4, файл добавит 3 предмета. Удалите
  свои предметы или разделите файл.» over «Импортировать (N)», which is
  disabled and described by the line; with no limit read the server's
  refusal says it. When any key is held, «Пропустить» (default) or
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
  нельзя.»; when a file card of a held card's key and kind leaves out at least
  one of the held card's book items, the confirm gives the number of those
  cards before the last sentence: «Книжные предметы уберутся из карт: N.» /
  "Book items are removed from cards: N.". Notes under the rows name a relation that names nothing anywhere
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
- **The bulk move** (m24): «Переместить (N)» in the bar (from 761 px a button
  with a caret, up to 760 px an item of «Ещё») opens a sheet at every width:
  «Источник» («Хоумбрю», then the named sources by creation) and, for a named
  source, «Раздел» («Без раздела», then its sections; a source change resets
  it), then «Отмена» and «Переместить». Closing the sheet returns the focus to
  what opened it. It sends only the ticked items whose place differs, in
  one call with the revision of each; none differs: the button is disabled
  with «Отмеченные предметы уже здесь.». While it runs it reads
  «Перемещаем...». Success toasts «Перемещено предметов: N», clears the
  selection, closes the sheet and moves focus to «Выбрать», else `#main` (rule 20);
  every item keeps its key, so list links stay live. A source or section deleted on another device draws
  «Этого источника больше нет - его удалили на другом устройстве. Выберите
  другой источник.» / the section's twin under the selects; an item changed
  on another device toasts «Предметы изменили на другом устройстве. Данные
  обновлены - повторите.», a lost network «Не получилось переместить.
  Проверьте соединение и попробуйте ещё раз.», a refusal (a timeout
  included) «Сервер не принял перемещение. Обновите страницу и попробуйте
  ещё раз.». Every answer reads the items again; a failure keeps the
  selection and the sheet, and a retry sends the revisions of that read.
- **Downloads**: «Скачать JSON» on a source's row downloads that source, its
  items and the own cards that belong to it or that its items name, as
  `<source name>.json` (the name in the language on screen, the lists' rule
  for unsafe characters; «Хоумбрю.json» for the default source);
  «Скачать JSON (N)» in the bar downloads the ticked items, their sources
  and the cards they name as `daggerheart-loot-homebrew-<YYYY-MM-DD>.json`.
  Each is a `homebrew-v2` file (`CONTRACTS.md` section 4), whose items keep
  only a section their source holds. While the items load, or after their
  read failed, a download toasts «Ваши предметы ещё загружаются - это может
  занять минуту. Повторите чуть позже.»; a failed download or a chunk that did not load toasts «Не
  получилось. Проверьте соединение и попробуйте ещё раз.».
- **Moving to another account**: the zip of «Скачать мои данные (ZIP)» loads
  back in two presses, its `homebrew.json` on «Мои предметы» first, then its
  `lists.json` on «Мои списки», so the lists link the moved items, not new copies
  (`docs/decisions/2026-10-02-a-lists-file-is-version-2-only-when-it-holds-homebrew.md`).

## Print

- Every print needs an account (owner, 2026-10-08). Three controls print, each
  «Печать» with the print icon and the same hint: the action row (the record
  page, the record modal and `#/h/`, for its author and for a reader), the
  selection bar (tables, search, «Мои предметы», `#/s/` with the taken
  counts) and the list toolbar (with the list's counts). Signed in, a
  press stores the cards and their counts as a print set in the reader's
  account and opens its address `#/p/<id>`; the control is disabled while the
  set is made and while the session is unknown, and a build with no sign-in
  configured draws none. Signed out, the press shows the sign-in prompt in the
  control's slot - boxed under the action row and the list toolbar, compact with
  «Отмена» in place of the selection bar's action row - with «Войдите, чтобы
  печатать карточки.», so the reader learns why before leaving the page, as
  «Сохранить себе» says it. After the sign-in the app makes the set of the
  cards that press saw and opens it (`STATE.md`, the auth return). A press
  stores the record the page draws: on `#/h/<uuid>` the open item, on `#/s/`
  the share's record, on an account list's page the list's linked record, and
  elsewhere the reader's index (an own item before another account's of one
  key), so a key the reader also holds never swaps in the reader's own item.
- A set holds references: a catalog id, or a homebrew item's id, and a count
  over 1. A reader sees each card as it is when the set is read: a catalog
  card as the reader's own index draws it, a homebrew card as its author last
  saved it, with its picture. A homebrew card whose item was deleted is left
  out and counted in a red note under the bar, «Удалены автором и не попали
  на лист: N.» (`<p class="printnote warnnote">`). The same sheet pressed
  again by one account opens the same set. A set ends 90 days after it was
  last opened, and with its maker's account
  (`docs/decisions/2026-10-08-a-print-set-holds-references-and-lives-90.md`).
- `#/p/<id>` reads the set once when it opens (no live re-read; a reload reads
  it again). Each state keeps the heading «Печать карточек»: while the session
  is not known, the heading alone; when the data did not load, «Данные не
  загрузились. Обновите страницу.» under it; signed out, the sub «Войдите,
  чтобы печатать карточки.» and one «Войти», which returns here;
  while it reads, «Загружаем...»; an unknown, expired or malformed id
  (a malformed one signed out too, with no read), «Набор не найден: ссылку не
  открывали 90 дней, или в адресе ошибка.» and «На главную»; a set with no
  card left, «Печатать нечего: в наборе не осталось карточек.», the deleted
  note and «На главную». A failed read replaces the page with the error page
  «Набор не загрузился» / "The set did not load", «Не получилось загрузить
  карточки.» and the primary «Повторить», which reads the set again from the
  address (rule 6). A build with no sign-in configured draws the not-found
  page. The unknown and expired set keep the heading «Печать карточек» and the
  sub: `docs/fixtures/urls/routes.json` names them, so the error page there
  waits for a contract change.
  «Ссылка на набор» copies the set's preview link
  `https://daggerheart-loot.pages.dev[/en]/p/<id>`, with no `v`
  (`<site>[en/]#/p/<id>` in a build with no preview host). The link opens in
  the browser, not in the installed app, and a reader may need to sign in
  there. Its card is generic - «Печать карточек», «Войдите, чтобы печатать
  карточки.» and the site picture - and shows nothing of the set.
- Every address under `#/print/` - the long print links retired on 2026-10-08
  - draws the error page «Такие ссылки на печать больше не открываются.» with
  «Попросите у отправителя новую ссылку вида /p/ или войдите и соберите
  карточки сами.» and the primary «На главную», the address kept and nothing
  read from it
  (`docs/decisions/2026-10-08-every-print-is-a-stored-set-long-print.md`).
- Nine cards to an A4 page at 63x88 mm, or sixteen at 44x63 mm on the opt-in
  compact sheet; up to 180 cards either way. The cap is a render bound, not
  an address bound: the browser stalls on a couple of hundred cards, each
  fitted after render (owner, 2026-10-08). A press of more than 180 records
  stores the first 180 and says «Карточек за один раз: не больше 180. Не
  попали на лист: N. Разделите набор на части.» as a toast, after a sign-in
  too: the cut is the maker's, so a reader of a handed-on link never sees it.
- On screen, when the page column is narrower than the A4 sheet (a window
  under about 840 px), the sheets are drawn scaled down to the column's width
  (`sheetScale`, a transform under `@media screen`), so the page never scrolls
  sideways; the bar keeps its size. The layout stays the paper one in every
  window: the fit divides the scale out of the sizes it reads, so it writes
  the same values as in a wide window, and print media draws the sheets at
  full size (owner, 2026-10-22;
  `docs/decisions/2026-10-22-the-print-sheet-scales-to-a-phone-screen-by-a.md`).
- Color and black-and-white are two different cards, not one with a switch.
- The vectors whose color and black-and-white files share one geometry - the
  tier banner, the threshold box, both ribbons and the six dice - are drawn
  inline from the exported files' paths (`lib/cardVectors.ts`) and painted by
  CSS per layout (`styles/card-vectors.css`, each value copied from its file);
  the shield and the two burden marks, whose files differ in shape, and the
  dots and the arrow stay `<img>` of their files. Every file under `card/`
  stays published as it is (`CONTRACTS.md` section 5); the browser suite
  compares each drawn vector with its file, pixel by pixel (owner,
  2026-10-20;
  `docs/decisions/2026-10-21-the-print-card-recolours-its-exported-vectors-with.md`).
- The card text is formatted text ("Records", "Formatted text"): bold and
  italic in black, lists as lists, and a table as a real table across the
  text block with fixed columns, 0.2 mm black cell borders in both layouts and
  words broken anywhere, so it is never wider than the card. The fit ladder
  below measures a table with the rest of the text, and clips what still does
  not fit. A set bonus's label leads the first paragraph of its text: its set
  name in bold italic, the member list in italics.
- A card that still cuts off text after the last rung is counted: the bar
  draws «Текст не помещается на карточки при печати: N. Конец текста на них
  не напечатается.» in the warning box (rule 19) after the red deleted note
  and before the gray note, hidden in print media with the bar; it blocks
  nothing. The count reads the text box down and across, the name and the
  bottom line across and the content box down. The bar's status region says
  the box once when it appears (rule 19). A long homebrew source line
  wraps, right-aligned, beside «Daggerheart», which keeps its one line; the
  fit ladder then shrinks the text for the taller bottom. The
  editor's print view draws the same card with the same fit ("Homebrew").
- An artifact weapon (`eq.tier: 'A'`) prints as a loot artifact card does: the
  tag `Артефакт`, then its class tag, no tier band, and its damage strip.
- A card printed from a list shows the list's count after its name as ` ×N`
  (a space, U+00D7, the number), only for a count over 1 - the same suffix
  the list's copied text puts after the name (`qtySuffix` in `share.ts`). The
  count is stored in the set, so it survives a reload and the copied set
  link. The list page's print button stores the list's counts, and the
  shared page's selection bar stores the taken counts; the record, table and
  search print controls store none. The counter sits
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
  value, the modifier, the threshold numbers and the armor score; 600 for
  the strip values; 500 for labels, captions and tags; 400 italic for the
  source line. Text on the white of a card is `#000`; the black-and-white
  kind tag is white on `#000`, and its threshold frame is `#000`.
- A strip value has no clipping box: a printed sheet in Inter lost the tops
  of its capitals to the old one. Labels print in capitals tracked 0.06em
  (not the label beside a modifier, which the fit shrinks) with 0.25em under
  them; values print as the data writes them, and the one-word damage type
  starts with a capital (`Маг`, `Phy`). The die value has 0.12em after its `d`.
- The strip keeps its ribbon and has five cells: the die; the modifier, with
  no label, against the die and on its center; then the damage type, trait
  and range as label-over-value blocks centered in the band between the
  ribbon's ornament lines, each inside the ribbon's dividers. The strip is
  `max(14cqw, 20pt)` tall - the design's 8.8 mm on the standard card,
  7.05 mm on the compact one - and a wrapped value raises it (11.3 mm on the
  compact card for `Хар. Заклинателя`).
- A weapon's ribbon and die art follow its class, magic or physical, on both
  strips of a two-strip weapon; the damage box names each strip's damage
  type (`docs/DECISIONS.md`, "The print card frame follows the weapon's
  class").
- The die value, and the color card's armor and burden labels over the
  picture, carry their halo as a vector stroke (`-webkit-text-stroke` with
  `paint-order: stroke fill`): a blurred `text-shadow` printed as a raster
  patch. A compact black-and-white sheet holds no raster image.
- The threshold diamonds are at least 1.3 mm tall and sit 0.6 mm clear of
  the frame; each caption fits its cell. Each arrow grows from its box's
  right notch, the same size on both sheets (tip 4.27 pt past the notch, at
  least 1.3 mm wide): in color a dark arrow in a gold rim that continues
  the frame, in black and white a solid black arrow. CSS draws it at
  `card/arrow.svg`'s 7:12 proportion; the image stays in the markup,
  hidden. The burden label sits under its mark.
- In black and white the rules text first grows, in 0.1cqw steps from its
  3.5cqw default to at most 5cqw (8.9 pt), while it still fits its box: the
  space a color card gives its picture is blank paper there (issue 61). Text
  that does not fit at 3.5cqw takes the shrink ladder unchanged. Color never
  grows - the picture owns that space and the ladder gives it up last.
  Measured on the Windows host on 2026-09-23: a two-line card was 54-67% blank
  and reaches the cap; the longest texts land at 3.6-4.3cqw. A one-line card
  stays more than half blank at any size under the name's 5.8cqw; a 4x4 sheet
  (44x63 mm) was measured as the same composition at 70% - the same blank
  share at 4.3 pt - and rejected as a replacement for the 3x3 sheet
  (`DECISIONS.md`).
- Two independent switches: color or black-and-white, standard or compact;
  every combination prints. The compact card is the same card at 70% - every
  dimension is `cqw` - so the ladders run unchanged: compact color text is
  4.3 pt by default and 3.2 pt at the floor, and the compact black-and-white
  card reads at 6.2 pt where the grow rung reaches its cap. A size change
  fits every card again at its new size. Measured 2026-09-23
  (`DECISIONS.md`).
- The compact subtitle says 44×63 mm and sixteen to a sheet; the print
  control's hint keeps "nine to an A4 sheet" - it names the default.
- A set with no card the build knows draws the heading, the "nothing to
  print" note and «На главную» - no bar, no sheet.
- `Назад` steps back in browser history; with nowhere to step back to it goes
  home, not to `#/lists`: the reader of a handed-over link may have no lists.
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
- An own homebrew item's picture prints on the color card from its 640 px
  file, as a catalog picture does; the black-and-white card draws no
  picture.
- A color card of a record with no picture, or with a picture that fails to
  load (a partial deploy, a cold cache, a sheet opened directly at a `#/p/`
  address), draws the glyph of its kind in dark ink (`#3a3350`) on a light
  well (`#ebe7f0`) in the art block, on the standard and the compact sheet,
  on the `/p/` sheet on screen and in the editor's print preview; the screen
  keeps the dark well. Black and white has no art block. A departure from
  Figma node `714-42387`, which leaves that area as blank paper (owner,
  2026-10-29).
- An open record dialog and an action toast both stay hidden under print
  media, the way the live app's `#modal`/`#toast` rules did unconditionally -
  neither had an equivalent rule in the rewrite.
- The card's own name (`.pc-name`) is not part of `fit()`'s shrink ladder -
  inspected rather than assumed (owner decision, "look first, then
  shrink"). The four longest names (`cm26`, `f60`, `hi62`, `ci81`), measured
  on the Windows host on 2026-09-22 as the distinct line tops of a `Range`
  over the name: in Russian cm26, f60 and hi62 wrap to three lines and ci81
  to two, three with a ` ×99` counter; in English all four wrap to two. An
  earlier claim that all four render at one line came from a
  `getClientRects()` check on the block, which can never report more than
  one line. `fit()` already takes the name's height from the rules text, so
  the cap is three lines (owner decision, 2026-09-22), not a shrink step.
  `tests/app/print.js` pins it for both sheets (bare and each at `×99`), both
  languages and both
  layouts. No deviation from Figma nodes `714-42387`/`3773-90792` was
  needed.

## Account

`#/account`, drawn by `AccountPage.svelte` in a build with sign-in
configured (the two `VITE_SUPABASE_*` values, `docs/specs/META.md` section
3). Sign-in is optional: everything else works without it. The page is titled
«Аккаунт» / "Account" (the tab reads `Аккаунт - <docTitle>`), and each section
is a panel headed by an `h2`. Signed out it is one column at 70ch; signed in it
is one column below 1000 px and two columns from 1000 px (up to 1100 px wide):
the left holds «Отображение на всех устройствах» and «Способы входа», the right
«Ваши данные», «Выход» and «Удаление аккаунта». The DOM order is left then
right, so the tab order and the reading order agree
(`docs/decisions/2026-11-04-search-and-account-follow-the-list-head-and-the-error-page.md`).

- **Unknown session**: the title and the loading line «Загружаем...», while the
  cloud has not answered.
- **Signed out**: the lead «Войдите, чтобы ваши данные были доступны на всех
  устройствах. Всё остальное работает и без входа.» and one panel, «Войти»:
  «Войти через Google» and «Войти через Discord» (each with the provider's
  own logo), then the consent line linking the terms and privacy pages of
  the language on screen.
- **Signed in**, no subtitle (the section headings name what the page
  holds), then, in this order: «Отображение на всех устройствах» (below); «Способы входа» - a row
  for Google, then Discord: a connected one shows its identity's email once and,
  while two or more are connected, «Отключить»; the row of the provider the
  session signed in with carries the neutral badge «Сейчас» / "Current"; a
  missing one says «не подключён» and offers «Подключить <provider>»; with
  exactly one connected, a hint says it cannot be disconnected until another is
  connected. While the identities are unread or failed, and for a session whose
  provider no row names (an email link), the panel draws the session's line
  above the rows: the email in bold, then the provider's logo and «через
  <provider>». No «Вы вошли как» panel is drawn. «Ваши данные» / "Your data" -
  the one sentence «Списки и свои предметы одним архивом ZIP.» / "Your lists and
  items in one ZIP archive." (the two import panels give the order, the
  archive's `homebrew.json` on «Мои предметы» first, then its `lists.json` on
  «Мои списки», and the 1000 limit), then, only
  while the account holds an item with a picture, «Картинок в архиве нет:
  после переноса добавьте их заново.» (the files never carry a picture), and «Скачать
  мои данные (ZIP)» ("Account
  and browser lists", "Exports"), disabled until the account's lists are
  read and while its zip is built, with «Не получилось загрузить списки
  аккаунта.» and «Повторить» when the read failed; «Выход» - «Выйти» and «Выйти на
  всех устройствах» with no note («Выйти на всех устройствах» also ends the
  session on the reader's other devices at their next token refresh);
  «Удаление аккаунта» - the hint «Аккаунт и все связанные с ним данные будут
  удалены навсегда.» and «Удалить аккаунт...», which opens an inline
  confirmation: «Будут удалены:» / "This deletes:" and a list of what goes -
  the number of lists, while the lists are read; one line of own items,
  sources, sets and rule cards, while the own items are read, a count of zero
  left out; then «Ссылки на списки и запросы на покупку.» - a count the page
  never read is never drawn, and the page reads nothing again to draw it; then
  the word «удалить» / "delete" typed (trimmed, any case, in the interface
  language at the moment of typing) enables «Удалить навсегда», the one
  filled danger button (`danger-fill`), which reads «Удаляем...» / "Deleting..."
  while the delete runs; «Отмена» folds it, forgets the word and returns the
  focus to «Удалить аккаунт...». The list can undercount when another device
  wrote since the last read; it never overcounts.
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
  Deletion first removes the account's purchase requests in bounded calls
  (`delete_account_requests()`, 200 a call), then the account on the server
  (`delete_account()`), then this browser's session. A failed step keeps
  the session and shows the error toast; a later press finishes the delete.
- The texts describe what an account is for in general terms, true in
  every release (`I18N.md`, "Rules").
- A build with no sign-in configured draws the not-found page («Страницы по
  этому адресу нет», "Chrome") on `#/account`, keeps the address, and draws no
  account control.
- Signed in, the language, starting section, and the default tables view
  and print layout follow the account on every device (`STATE.md`,
  "Account preferences"). The page first draws this browser's values and
  switches once the account answers.
- **The Display section** «Отображение на всех устройствах» / "Display on all
  your devices", signed in only and first, is the place the tables view and
  print layout defaults are set; a switch on the tables or print page changes
  only that visit ("Tables and search", "Print"), and this page says nothing
  about it. The language row and the header RU/EN switch are one setting, and so
  are the starting-section select and the pin ("Chrome"). The section has no
  lead line and no hint: five rows with six controls, each saving the account
  row, every segmented control neutral: «Язык» (the RU/EN switch); «Раздел при
  запуске» / "Section on start" (a select over the twelve sections and «Мои
  предметы» last, which pins `#/homebrew`; choosing
  «Таблицы» pins `#/tables/core_item`, the table a bare `#/tables` opens
  on, never the bare address (`STATE.md`, "localStorage keys"); a pinned
  table, or an older bare `#/tables` pin, shows as «Таблицы» and keeps its
  address until another section is chosen; an old section name shows as
  the section it opens; a refused write says the save-failed error toast
  and the select shows the section kept); «Вид таблиц по умолчанию» / "Default
  table view" («Список» / «Сетка»); «Печать по умолчанию» / "Default print", two
  small segmented controls that wrap inside 360 px: the color («Цветная» /
  «Чёрно-белая») and the card size («Обычная» / «Компактная», named «Размер
  карты»); «Когда беру из чужого списка» / "When I take from someone else's
  list", a select at every width («Спрашивать» / «Сообщать владельцу» / «Не
  сообщать», "Ask" / "Notify the owner" / "Don't notify"), no hint: the remembered answer of
  flow b ("Account and browser lists", "Purchase requests: flow b"), kept in
  the account only and «Спрашивать» by default. The page's account actions
  do not disable these controls.

## Chrome

- Language switch, the three jobs, skip link, starting-section pin (eleven sections
  pin as their own hash; `#/tables` pins as whichever table is on screen;
  «Мои предметы» pins `#/homebrew` from any tab once its items are read; never a
  record or a list).
- Focusing the skip link moves focus straight to `#main` and never touches
  the address bar - the browser's own fragment jump would add `#main` to the
  address and a history entry. While
  focused it is a gold plate pinned over the page's top-left corner, matching
  the live app rather than a gray chip that pushed the header down while
  focused.
- Chips and segmented switches expose their on/off state as `aria-pressed` -
  the money chips and the two view switches (tables list/grid, print color/
  black-and-white) gained it in the rewrite, where the live app wrote
  nothing for the money chips and `aria-current="true"` for the menu chips.
- Help panels behind «Справка» / "Help" per section, or the panel's own name,
  folded by default, fold state remembered for the session only. From 761 px the
  button beside the H1 shows its label after a `?`; up to 760 px it is a round `?`
  button with the same name until its page's batch moves it. On the roll pages
  and the catalog it is an item of «Ещё» up to 760 px, and there the `h1` is read,
  not drawn; `/homebrew` has no help, and its `h1` is read, not drawn, once its
  items are read. The editor's heading is the breadcrumb row.
- The pin beside the H1 reads «Открывать при запуске» / "Open on start" with
  the home icon; pinned it reads «Открывается при запуске» / "Opens on start"
  with the check of the neutral pressed state (`Seg`), never a gold fill. From
  761 px it is a labeled button; up to 760 px a round button with the same
  name until its page's batch moves it into «Ещё»; on the roll pages, the
  catalog, `/homebrew` and `/search` it is an item of «Ещё».
- **The error page** (`ErrorPage`, DESIGN.md "Error page"): every page-level
  failure draws its cause as the `h1`, one sentence and its actions with the
  primary first, no icon and no plate; a status region says the title once
  after the page arrives. The pages: the not-found page of an address this
  build reads but draws nothing for (an old list link, `#/account`, `#/lists`,
  `#/lists/<id>`, `#/p/<id>`, `#/homebrew` and `#/tables/homebrew` with no sign-in;
  «Страницы по этому адресу нет» / "No page at this address", the address in
  code cut at 80 characters, «На главную» and «Открыть таблицы»); the retired
  print link; a failed `#/p/` read; the editor's missing item («Предмет не
  найден», «К моим предметам»); a page that threw («Что-то пошло не так на этой
  странице.», the message, «Обновить страницу»); and the record pages of
  "Records": the not-found page and a failed read (an item lost while its
  page is open is said once, by that page's own region).
- A removal the app can write back (an entry, its notes, a reprice) toasts with
  an undo, «Вернуть»; a server delete that cannot be undone (an
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
  An error toast or a toast with an action keeps its place for its time: a
  later plain toast waits and shows when it ends - its timer, its close or its
  action - for its own 1600 ms (one waits; a newer plain toast takes its
  place); a later error or action toast replaces it at once (owner,
  2026-10-08). The new-request toast ("Purchase requests: the owner") is
  the lowest: an action toast whose button («Открыть» / «Показать») moves
  to a page of the app and never takes focus; it waits behind any other
  toast, a plain one too, and displaces nothing; any later toast, a plain
  one too, replaces it when it shows, and a later plain toast that has to
  wait takes the waiting slot from it; it is then dropped (the title count
  keeps it). Pressed inside the record dialog, its button closes the
  dialog first. With its button gone and no control taking the focus, the
  focus goes to the main landmark. When a later toast replaces a link or a
  move toast that held the focus, the focus returns to the element it came
  from, else to the main landmark (inside the record dialog, its close
  button).
- The toast is a plate: `--surface` with a 1px `--muted2` border, `--txt`
  text, the Float shadow and `--r` corners, at most the window's width less
  16 px a side, 26 px off the bottom; its action button is `--surface2` with a
  `--line2` border. The error toast takes the Alarm Red fill (`--danger`) with
  dark ink (`--ink-on-gold`, about 5.6:1). No toast is gold.
- The footer carries the full DPCGL license notice (`dict.ts`'s
  `footBefore`, `footLink`, `footAfter`, the text `tests/derived.js` pins)
  on every page, folded in a native `<details>`: its `<summary>` is one line,
  «Daggerheart © Darrington Press - DPCGL - Источники и лицензия» /
  "Daggerheart © Darrington Press - DPCGL - Sources and license"
  (`footSummary`). A click or Enter opens it; the summary takes the global
  focus ring. DPCGL clause 4.1 asks for the notice in the shared material
  and sets no visibility rule (checked against the license of 2025-07-30).
- A footer nav row above the license notice links the site's static pages
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
  visible at every width. Signed in it is a menu button, 38px tall (44px at
  600px and below): the email's first letter in a circle (the icon when there
  is no email), then a chevron, named «Аккаунт: <email>» / "Account: <email>",
  with `aria-haspopup="menu"` and `aria-expanded`. Either one carries the gold
  ring on the account pages - `#/account`, `#/lists`, `#/lists/<uuid>`,
  `#/homebrew` with its tabs and the editor - where no job is lit; only on
  `#/account` it carries `aria-current="page"`. The button also carries the
  ring while its menu is open. A build with no sign-in draws no control at
  all.
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
- The brand is the vault-die mark and the wordmark «Лут» in Russian, «Loot» in
  English, over «DAGGERHEART»; the wordmark follows the language in the header
  only (the tab title, the manifest and `en/index.html` keep their names).
- The header draws three jobs in every build, each a link with its icon before
  its label: «Бросок» / "Roll" (the die), «Таблицы» / "Tables" (the table) and
  «Поиск» / "Search" (the magnifier). «Бросок» opens the last roll section of
  the tab, else the pinned start section when it is a roll section, else
  `#/roll/std`. The lit job carries `aria-current="page"`, gold text and the
  gold underline: «Бросок» on the nine roll sections, «Таблицы» on every table,
  «Поиск» on search. No job is lit on a record, an item, a print sheet, a share
  link, the lists, a list page, the account page or «Мои предметы».
  `#/lists` is reached from the account menu (`ROUTES.md`, "Sections"). The
  three jobs hold one row at 360 px in both languages; a label never gives way
  to an icon.
- From 761 px the brand, the jobs, the language switch and the account control
  share one row and the sticky header is 63 px tall; up to 760 px the jobs take
  a second row and the header is 111 px at 360 px in both languages (measured
  2026-10-30 in the built app, 313 px of row with a classic scrollbar).
- Up to 760 px the whole header leaves on a scroll down and returns on a scroll
  up, on every page, past a 10 px dead zone. It stays at the top of the page, on a
  short page, after a navigation and while a menu, a sheet, a dialog, a text field
  or a drag owns the page; a keyboard focus inside it brings it back. A focused control and
  a linked target stop clear of its full height, so a Tab never lands under it.
- The nine roll sections draw the mode row under the sticky header; it
  scrolls with the page. It holds three controls: «Обычные правила» /
  "Standard rules", «Альтернативные таблицы» / "Alternate tables" (the page
  headings' words) and the menu button «Дополнения ▾» / "Supplements ▾", which
  on a supplement page shows that supplement's name. The lit control takes
  the current place's gold fill and `aria-current="page"`; each carries
  `data-section`, the section's canonical key. At 600 px and below the
  controls share the row, 40 px tall, and a long name takes two lines: the
  row is 53 px at 360 and 1180 px in both languages (measured 2026-10-30).
- The supplements menu «Дополнения» / "Supplements" opens under its button
  with a muted caption and the seven supplements, 44 px items, the open one
  checked with `aria-current="page"`; it is 367 px tall. Its keys and its
  closing are the account menu's (one `Menu.svelte`), and a navigation closes
  it.
- Under `prefers-reduced-motion: reduce` every transition and animation stops
  moving and waits out no delay - a blanket kill (`tokens.css`), not the live
  app's own two named exceptions - including the table page's scroll to a
  linked row or section, which jumps instead of easing (`Env.motion`: a
  call-site `behavior` is out of CSS's reach), and the header's slide, which
  then appears at once.
- Every focusable control gets the same gold keyboard-focus ring, at the
  control's own border-radius where a component sets one and `--r-sm`
  otherwise (a scoped rule always outranks the unscoped global one - `.seg
  button`'s 999px is untouched) - a global rule (`tokens.css`) rather than
  the live app's closed list of 18 selectors at an 8px radius, with
  everything outside that list falling back to the browser's own outline.
  Broader coverage was the owner's call.
- The UI face is self-hosted: Source Sans 3 from
  `@fontsource-variable/source-sans-3` (variable, upright and italic, with
  Cyrillic), imported in `main.ts` and served from the build's own
  `/assets/`, so the app draws the same glyphs on a machine without the face
  installed. The weights in use (540 to 680) render as authored on the
  variable face. `font-display: swap` draws the system stack until a file
  arrives; no font comes from another origin. The print card keeps its own
  local stack (`--print-ui`, Inter first) until the print batch decides its
  face (owner, 2026-10-23;
  `docs/decisions/2026-10-29-the-ui-font-is-source-sans-3-self-hosted.md`).

### Consistency rules

The signed-in pages follow one set of rules; a new screen or string follows
them too, and a departure is named here
(`docs/decisions/2026-10-02-the-signed-in-pages-follow-one-set-of.md`).
Each rule keeps its number: a review cites it by number.

- **1. Counters**: a limited collection shows «N <plural> из M» / "N
  <plural> of M" in one place: the account group of `#/lists` («3 списка из
  50»), an account list's sub («10 позиций из 100 · Сохранено»), the Items
  tab's «3 предмета из 100» (the tool row from 761 px, the picker's sheet up to
  760 px), the Sources tab's «2 источника из 20», the Sets
  tab's «1 комплект · 2 карты из 100», the Rules tab's «1 карта правил · 2
  карты из 100» and a source's row («4 раздела из 30»). The limit comes
  from `my_limit()`, read with the account's first read, and again only after
  a limit read that failed; a refusal's own limit replaces it; a limit raised
  while the page is open shows after the next page load. With no limit known
  the plural shows alone («3
  списка»). With a known limit the count shows at zero too («0 списков из
  50»); a count inside a row shows from one. The heading never repeats in
  the count. A counter sits at the head of the collection it counts: above
  its strip, or in its fold's summary (owner, 2026-10-02).
- **2. Failures**: a failed account read or write says «Не получилось
  <глагол>. Проверьте соединение и попробуйте ещё раз.» / "Could not <verb>.
  Check the connection and try again."; a load line says «Не получилось
  загрузить <что>.» / "Could not load <what>." with «Повторить». Clipboard
  and browser storage failures are outside this rule. Departure: the account
  page's «Не получилось. Проверьте соединение и попробуйте ещё раз.» / "That
  did not work. ..." (`accountFailed`) has no verb: one line serves the
  sign-out, the disconnect and the deletion ("Account").
- **3. Delete confirms**: a delete that cannot be undone ends its confirm
  with «Отменить удаление нельзя.» / "This cannot be undone.", after its
  consequence sentence («Его 3 предмета останутся в «Хоумбрю».»). Departure:
  the account delete asks for the typed word instead of the browser's
  confirm; its hint says «будут удалены навсегда» (owner, 2026-10-22), and its
  confirm lists what goes («Будут удалены:») and ends in the one filled danger
  button.
- **4. One name**: the menu item, the page heading and the tab name a page
  the same way: `#/lists` is «Мои списки» / "My lists" in the menu, the heading,
  the tab title, the start-section option and the buttons to it; `/roll/alt` is
  «Альтернативные таблицы» / "Alternate tables" in the lit mode chip, the heading,
  the tab title and the start-section option.
  The lit control of the mode row reads its page's heading. Departures: the job
  «Бросок» / "Roll" names a group of nine roll pages and has no heading of its
  own; the menu button «Дополнения» / "Supplements" names the seven supplement
  pages as one group and shows the open supplement's name; and on Arazo's
  Artifacts the button and the menu read «Arazo's Artifacts», the heading the
  book's full title.
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
  («Список не загрузился» / "The list did not load"), small everywhere else:
  the requests panel's slot on an account list's page, and an account list's
  address while the account or the list's entries are read (no heading: the
  list's name is the heading, as on `#/s/`). A failed `#/p/` read is the
  primary kind: the error page «Набор не загрузился».
- **7. Headings**: a page with a fixed heading draws it in every state,
  loading and failed included. Departure: an error page (`ErrorPage`, "Chrome")
  draws its cause as the `h1` («Страницы по этому адресу нет», «Набор не
  загрузился», «Что-то пошло не так на этой странице.»), and the page's name
  stays in the tab title; a page draws exactly one `h1`.
- **8. Create**: a button that opens a create form reads «Новый <noun>» /
  "New <noun>" with the plus icon («Новый предмет», «Новый источник»,
  «Новый раздел», «Новый комплект», «Новая карта правил»); the form's
  submit reads «Создать» / "Create" (a card form «Создать комплект» /
  «Создать карту»); a select option reads «+ Новый <noun>...». Departures:
  the add-to-list chip «+ Новый список», because a chip has no icon; and
  the row «Свой предмет» / "Own item" after an account list's entries (plus
  icon), whose panel's submit reads «Добавить в список» / "Add to list", because
  the short «В список» says nothing on a submit:
  one press makes the item and adds it to the list
  (`docs/decisions/2026-09-30-a-list-page-makes-a-plain-homebrew-item-in-one-press.md`);
  and the homebrew import's «Куда» option «Новый источник «<name>»», which
  names the source the press makes from the file, so it carries the name and
  no «+» (its custom option is the rule's «+ Новый источник...»).
- **9. The primary action** is the first control under the lead, before any
  management panel. Departures: the Items tab of «Мои предметы» draws its
  primary in the head; the import is the last control of each tab's tool row
  or an item of «Ещё»; on the other tabs the create button is the
  first control under the tab row; an account list's page makes an own
  item from the row after its entries; the print bar of `#/p/<id>` puts
  «Назад» before «Отправить на печать», the way back first (owner,
  2026-10-22).
- **10. Undo**: a removal the app can write back offers «Вернуть» / "Undo"
  in its toast (a member's «Убрать» on the Sets and Rules tabs too); a server
  delete that cannot be undone asks the browser's confirm first and offers no
  undo. The homebrew import's «Обновить» asks
  too and ends «Отменить нельзя.» / "This cannot be undone.", not the
  delete confirms' words, since nothing is deleted.
- **11. Cancel and close**: «Отмена» / "Cancel" discards what was typed;
  «Закрыть» / "Close" folds a panel and keeps what it holds; a read-only
  panel or dialog says «Закрыть». A toggle with a caret folds its panel the
  same way: the homebrew import's toggle drops the file as «Отмена» does,
  the bulk move's sheet says «Отмена», which discards the chosen place.
- **12. Folds**: a fold that names a group keeps its name and turns its
  caret («Решённые в этот раз (2)», a card's fold on the Sets tab «Комплект
  Ольхи»); a fold that shows
  the rest of a cut list reads «и ещё N ...» / "and N more ..." closed and
  «свернуть» / "show less" open, one button both ways, so the focus stays
  on it (`FoldButton`). The source chips of `#/tables/homebrew` (past 12), a
  source's sections and a card's members (past 20) fold too.
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
  (owner, 2026-10-02) (the markup of the formatted text boxes that keep it, rule
  18, and the list page's fields). The item and card forms have none (owner,
  Q6.2 and Q6-1): a fact of the site they must state is a caption of (d). The «?» is a button named «Подсказка: <label>» / "Help:
  <label>" with `aria-expanded`; the hint is closed when the form opens. A
  self-explanatory field has no «?».
  (d) A line always visible under a field holds only what the person must
  know before typing or pressing: a limit («До 8 предметов.»), a format
  («Например: ...»), fields that go together, a fact of the site («Без источника
  предмет лежит в «Хоумбрю».»), or what a press does at once («Комплект создаётся
  сразу...»); one short line.
  (e) A capped text follows rule 13.
  (f) An error under a field states the fix («Два целых числа от 1 до
  99.»); the summary at the top of a form names the field first («Пороги
  урона - ...»).
  Departures: the list page's heading input (the heading is its label); a
  row's position box and the add-to-list menu's new-list box (an
  `aria-label` in a row or a menu with no room for a caption); the search
  boxes (a search is no form field); the second set draws no hint, and a save
  names the fix in each field's line («Заполните все четыре поля или оставьте
  набор пустым»).
  (g) A row label that says its condition needs no question hint: the
  account's «Когда беру из чужого списка» replaced the select's hint, and
  «Вид таблиц по умолчанию» and «Печать по умолчанию» replaced the Display
  section's lead line.
- **16. Long names**: a name of any allowed length wraps inside its box at
  360 px (`overflow-wrap: anywhere` on the list card, the page heading, the
  toast, the chip, the filter pill, the source and card rows and their count
  lines, the path line under a heading, the source tag, the set and craft
  lines of a card, and the form fields, whose grids take `minmax(0, 1fr)`, so a
  select's long option never widens them); nothing scrolls sideways. A toast takes up to the window's width less 16 px a side,
  so a long one stays a few lines high at the bottom of the window.
  Departure: an account list's name is an `<input>` inside its `h1` (rule 15),
  one line that scrolls inside its box (owner, 2026-10-22); the `h1` also
  holds the name as visually hidden text. Departure: the catalog's count line
  cuts to one line with an ellipsis and its table picker to two lines, the full
  text still read (owner, 2026-10-29); a source tab wraps inside its box.
- **17. Handed-out links** (owner, 2026-10-14), on every page: a control
  that copies or sends a link hands out the preview host's link with its own
  card - an item, a shared list, a print set, a catalog table; a catalog
  record keeps its record path, `i/<id>?v=<v>`, whose app document carries the record's card. Excluded, each with its reason: a
  homebrew copy with no id (nothing to link); `#/tables/homebrew`, which draws
  no table, filter or section link (each reader sees only their own items); the
  Items tab's filter (its values are one account's keys; the address is the link).
  Departure: the share panel shows the path `/s/<token>` and copies the
  preview link.
  A page-level copy hands out the address bar, `?v` included (owner,
  2026-10-28; `ROUTES.md`, "Path form"); a part of a page with its own copy
  button and the record modal (the bar shows the page under it) may differ.
  This rule binds every page, not only the signed-in pages of the lead.
- **18. Formatted text boxes**: every box of formatted text ("Records",
  "Formatted text") is one control: the toolbar «Оформление: <поле>» /
  "Formatting: <field>" (one tab stop, the arrow keys move), the box, and a
  «?» on the label with the markup and the catalog style in three lines and
  "Markup counts toward the N characters.". Departure: the editor's «Описание»
  and the card forms' boxes have no «?» (owner, Q6.2 and Q6-1). The buttons, by `aria-label`: «Жирный», «Курсив»
  (Ctrl+B / Cmd+B and Ctrl+I / Cmd+I in the box), «Список», «Нумерованный
  список», «Таблица» (wide fields only); each wraps or unwraps the
  selection, or prefixes the selected lines, and an edit past the cap does
  nothing and says «Достигнут предел в N знаков: правка не поместилась.» /
  "The field is at its limit of N characters: the edit did not fit." under
  the box (`role="alert"`, the danger text) until the text changes. Bold on an italic span and Italic on a bold span, the selection
  inside or around the stars, make `***...***`, and a second press restores
  the text; a selection that touches unequal or unrelated stars at one end
  gets no edit. «Просмотр» / "Preview" (pressed) draws the text in place of the
  box, the format buttons disabled, only where no rendered view sits beside
  the field (owner, 2026-10-14): the card forms, «Свой предмет» and the list
  notes; the item form's card is its preview.
- **19. Warnings**: a line that tells about a risk and blocks nothing is a
  warning: the warning box (`NoticeBox`), a fact and an option in
  its words, never «Ошибка». The box is no live region: a box that appears
  while the page is open (the editor's clip warning, conflict and gone
  banners, the print bar's clip count) is said once by the
  page's status region (`StatusRegion`), mounted before it; a box drawn with
  the page needs none. The error look (`--danger`,
  `role="alert"`) is for a refusal (owner, 2026-10-14): the editor's summary
  «Не сохранено: ...» and both imports' refused-file boxes take it, the danger
  border and text with no fill. Departure: the print
  page's red deleted note keeps the error look: its cards are not on the sheet.
- **20. Focus after a control removes itself**: when a press removes the
  pressed control, focus moves to the control that now holds its place in the
  same group, else the nearest one before it, else the group's lead control,
  else `#main`; no heading takes a `tabindex`. The cases: «Выйти» - the header's
  «Войти», or the account button when the sign-out is refused; a filter pill -
  the pill now at its place, the one before it, «Фильтры», `#main` when the
  strip left; «Сбросить всё», in the strip or in an empty state - «Фильтры»;
  the catalog's «Сбросить» - the first «Все» of the column, or the sheet's
  «Закрыть»; its empty state's «Сбросить фильтры» - the first «Все», else
  «Фильтры», else `#main`; «Снять выделение» - «Выбрать», else `#main`;
  «Удалить (N)» on `#/lists` - «Выбрать все», or «Новый список» with no card
  left; a card's own «Удалить» - the next card's, the previous card's, «Новый
  список»; the homebrew «Удалить (N)» and a move - «Все» while ticks remain, then
  «Выбрать», else `#main`; a closed move, preview or tabs sheet - what opened it;
  «Импорт из файла» closed - the toggle in view, else «Ещё»; «Принять», «Принять
  доступное» and «Отклонить» - the first button of the request now at their
  place, of the one before it, the panel head, `#main`; a load line's
  «Повторить» when it leaves - the group's lead control («Новый список» on
  `#/lists`, the panel head in the requests panel), else `#main`; on the
  homebrew tabs a source's «Удалить» - the next row's «Ещё», the one before,
  «Новый источник»; a section's «Удалить» - the next row's «Удалить», the one
  before, that source's «Новый раздел»; a card's «Удалить» - the next card's, the previous card's, the
  tab's create button; a member's «Убрать» - the next member's «Убрать», the
  one before, the card's «Добавить предмет»; a name field or a card form that
  closes, sent or cancelled - the button that opened it
  (`docs/decisions/2026-10-21-focus-moves-to-the-control-that-takes-the.md`).
  Departure: the requests panel's head «Новое в списке (N)» has
  `tabindex="-1"`, a target for focus from script only («Скрыть» on the
  decided fold, the fallback after an answer or «Повторить», the
  new-request toast's «Открыть» / «Показать», "Lists"): it names the panel,
  not the page (owner, 2026-10-22).
