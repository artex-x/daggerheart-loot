# Features, and the state each one needs

Written from the code as it stands, so a rewrite has something to be measured
against. Route grammar is in `ROUTES.md`, storage in `STATE.md`, frozen formats
in `CONTRACTS.md`.

## Rolling

Six modes. Each keeps its own input in memory only.

| Mode | Input | Produces | State |
|---|---|---|---|
| Core rules | 1-60, or Nd12 for N in 1..5 | up to 4 records: item and consumable, from each picked source | `std {n, src{core,hnf}}` |
| Alternate tables | rarity + Hope die + Fear die | 4 records | `alt {rarity, hope, fear}` |
| Wondrous | 1-119 | 1 | `wond {n}` |
| Dread | 1-29 | 1 | `dread {n}` |
| Vault of Ages | section + roll within it | 1 | `voa {k, n}` |
| Communities | community + 1-10 | 1 | `comm {c, n}` |

- The source switch on Core rules cannot be emptied - unticking the last one is
  refused.
- Rarity on Core rules only sets the dice count, so there is no rarity picker;
  each button is labelled with the count and the rarities it covers.
- The roll button uses a real die where the range is one, and reads
  "Random 1-N" where it is not (119, 29, a list of arbitrary length).
- Other is two browsable tables, not a rolling mode: Starting items
  (`other_starting`) holds the non-rollable starting inventory as a plain
  list, and Frame items (`other_frames`) holds campaign-frame equipment
  sectioned by setting, with no roll number.
- The consumable/item kind filter is one toggle shared by Core rules, the
  alternate tables and search (`AppState.kinds`, memory only) - switching
  consumables off on one switches them off everywhere, not per page.
- A critical success in the alternate tables - the two dice showing the same
  face - hands over the whole rarity rather than a row: a link into each table
  that is switched on, at that rarity, plus a button that steps the rarity up
  one. There is no such button on legendary. With both kinds on the two links
  name their tables apart; with one on the label stays general.
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

- 15 tables (`TABLE_IDS`), each with its own search box and a list/grid switch.
- Search covers all 1091 records: names, descriptions and stat lines, both
  languages at once; `#/search` shows the first 300 matches - the cap is that
  page's alone, a table's own box is not capped.
- Search folds case, `ё`/`е`, typographic apostrophes (U+2019, U+02BC), Latin
  diacritics (`ä`/`ö` etc., NFD-stripped - Cyrillic is excluded so `й` never
  merges into `и`) and the Unicode minus sign (U+2212 -> `-`) on both the
  query and the catalogue, so `плетеная` finds "Плетёная", `soldier's` finds
  "Soldier's", `zweihander` finds "Zweihänder" and `-1` finds a "−1" penalty;
  still a substring match, not fuzzy.
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
  two books**: 317 weapons, 108 secondary, 90 armour. The `src` facet is how you
  narrow to Core and Hope & Fear (239 / 73 / 69). Frame, Vault of Ages, Wondrous
  and Dread equipment appears there too.
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
  undo, delete.
- Add from a table or search selection, or from an item card. The card menu stays
  open so one item can go into several lists, and through the new-list form
  and its cancel; a search box appears from the eighth list; the menu opens on
  the side of the button with room in the window, re-measured from its default
  side whenever it opens or grows (DEBT.md D6 records what that gets wrong
  inside the modal).
- Optional quantity and price per entry; both travel into copied text.
- Prices display as book units (default) or coins; the mode is per list and
  rides in the link.
- Batch actions over a selection within a list: set prices, clear prices, shift
  all by a percentage, suggest prices from tier or rarity, remove.
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
- Import: paste a link or a payload to take a copy of someone else's list -
  either link form, plain or packed.
- A shared link (`#/l/<payload>`) that is nobody's own list draws the shared
  page: the name, the shared-list line with the count as one text node, one
  add-to-list control that takes the whole list into a new or an existing
  list (quantity, price and a row's public note travel; the GM's note never
  does), the list's own notes, and the rows; a payload that cannot be decoded
  draws "Предмет не найден", the bad-link line and a "На главную" button to
  `#/roll/std`.
- Two open tabs merge rather than overwrite (`STATE.md`).
- A storage notice at the top of the index and of a list page: when storage
  refuses, a plain warning that cannot be dismissed; otherwise a folded "lists
  live in this browser only" disclosure whose cross is remembered in
  `dhloot.warn.v1`; unfolding is not remembered - the notice comes back folded
  after a language switch, as the live re-render left it; on the index it
  survives a create and a delete, where the live whole-page re-render
  re-folded it - the rewrite's deliberate deviation, invisible to the old
  parity harness because every one of its states started folded (deleted at
  R0c, issue 47).

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
  share stub's subtitle are paths too, and are held to the same rule.
- The `.badge src` chip on a record card, a table row, a Search result, a list
  row, or a modal card is a tag, not a path: one leaf naming the book, the
  community, or the setting - never a breadcrumb. It carries no path segment
  because every place it is drawn already shows the surrounding context (a
  table, a section, a list of results).
- `#/i/<id>` for an id the data does not know draws "Предмет не найден", the
  sub line and a "На главную" button to `#/roll/std` (the live
  `renderItemPage` shape). The tab title on a record page is the app's name
  alone, on both apps - `DEBT.md` D5. When `data.js` itself did not load,
  every page draws the "data did not load" line in place of its content
  (`NoData.svelte`) - the rewrite's own state; the live app threw on a
  missing `window.LOOT` and drew nothing.
- Copy name, copy link, share, copy image, copy text. Copied text goes to the
  clipboard as both `text/html` (name in `<b>`) and `text/plain`; Markdown
  asterisks are deliberately not used.
- Consumables get a "(consumable)" suffix outside the app, where the badge is
  not visible.
- A compact card's art zooms slightly on hover, guarded by `@media
  (hover:hover)` so no touch device triggers it on tap; a full-page record's
  art never zooms.
- Upgrade chains render both directions; the reverse is computed at load. That
  is `craft` - one thing made from another - and it is not the tier ladder
  below.
- Equipment that belongs to an upgrade **line** carries a tier ladder: one rung
  per tier of that line, in tier order, the rung you are on marked and inert
  and the others opening that tier's record over whatever is on screen. A line
  of one is not a ladder and is not drawn. Each rung is named for the piece it
  leads to, because its own content is a bare digit.
- A campaign-frame record (`isFrameRecord`) prints no tier word and no tier
  ladder anywhere it appears, and its source label gives where it comes from
  rather than its book - even when the record carries ordinary equipment
  metadata (a tier, thresholds, armour score) that an equivalent record in
  the equipment tables does print. Whether that is correct is an open
  question, not a settled one: `DEBT.md` D11, which carries the `f33`/`q313`
  comparison and records that no reason for the suppression is written down
  anywhere.
- Referenced Core cards render as a collapsed block and travel with the item
  into copies and shares. Each block links out to `daggerheart.su` for the
  full card, the subdomain matching the language on screen (`ru.` in Russian,
  `en.` in English), and its text keeps the source's own line breaks.
- A record with no artwork falls back to `_none.webp` and hides the image
  button; so does a record whose file fails to load, and the app remembers that
  for the session.
- The record modal is a native `<dialog>` opened with `showModal()`, so it is
  modal, the page behind it is inert, and focus moves into it on open and
  returns to the opener on close - a deliberate improvement over the live
  app, whose card the keyboard never actually enters. The one visible
  consequence is that the modal's close button carries a focus ring the live
  app's does not.

## Print

- `#/print/<ids>`, nine cards to an A4 page at 63x88 mm, up to 180 cards.
- Reached from an item page, a list, or a table selection; the address is
  shareable and independent of where it came from.
- Colour and black-and-white are two different cards, not one with a switch.
- Fitting is measured in the browser after render: rules text steps its font
  down, then the top padding, then the stat values, and text width is measured
  with a `Range` because `text-overflow` hides overflow from `scrollWidth`.
- An address naming nothing the catalogue knows draws the heading, the "nothing
  to print" note and a link back to the lists - no bar, no sheet.
- More than 180 known ids prints the first 180 and a red note counting how many
  did not make it onto a sheet, telling the reader to split the set in two.
- `Назад` steps back in browser history; with nowhere to step back to it goes to
  `#/lists` instead.
- A card's own name is drawn as `<h2 class="pc-name">`, a heading-level fix:
  the live app's `printCardHTML` wrote `<h3>` there. `docs/specs/DEBT.md` D8
  (the alternate-tables page jumping `<h1>` to `<h4>`) is a different screen
  and is unaffected.

## Chrome

- Language switch, tab bar, skip link, starting-section pin (eight sections
  pin as their own hash; `#/tables` pins as whichever table is on screen;
  never a record or a list).
- Chips and segmented switches expose their on/off state as `aria-pressed` -
  the money chips and the two view switches (tables list/grid, print colour/
  black-and-white) gained it in the rewrite, where the live app wrote
  nothing for the money chips and `aria-current="true"` for the menu chips.
- Help panels under a `?` per section, folded by default, fold state remembered
  for the session only.
- Toasts with an undo action for destructive things.
- No tab is lit on a record, a list page or a print sheet - the live
  `renderTabs` compared against the raw route string, and none of those three
  route kinds was ever that string.
- Under `prefers-reduced-motion: reduce` the card's entrance and the section
  outline's fade are off (the outline is static); every other transition and
  animation runs. Ported from the live app and owed a real policy:
  `DEBT.md`, D1.
