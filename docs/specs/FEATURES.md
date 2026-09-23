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

- 16 tables (`TABLE_IDS`), each with its own search box and a list/grid switch.
- Search covers all 1236 records: names, descriptions and stat lines, both
  languages at once; `#/search` shows the first 300 matches - the cap is that
  page's alone, a table's own box is not capped. Once a query exceeds 300
  hits, a "300 из <n>" line - the same shown-of-total wording the table
  filter strip's own count already uses - says so above the rows (P7, paid
  off); under the cap nothing is said, because the count on screen already
  is the whole answer.
- Search folds case, `ё`/`е`, typographic apostrophes (U+2019, U+02BC), Latin
  diacritics (`ä`/`ö` etc., NFD-stripped - Cyrillic is excluded so `й` never
  merges into `и`) and the Unicode minus sign (U+2212 -> `-`) on both the
  query and the catalogue, so `плетеная` finds "Плетёная", a query typed with
  the typographic apostrophe autocorrect produces (`keeper’s staff` -> the
  now-ASCII "Keeper's Staff", O2/B11) still finds it, `zweihander` finds
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
  two books**: 370 weapons, 119 secondary, 94 armour. The `src` facet is how you
  narrow to Core and Hope & Fear (239 / 73 / 69). Frame, Vault of Ages,
  The Dragon's Vault, Wondrous and Dread equipment appears there too.
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
  undo, delete with undo (P5). A drag lands in a gap between two rows, not on
  a row: the pointer resolves to the nearest gap, and both rows beside it
  light, because "after 3" and "before 4" are one place. On the row above the
  gap, the highlight is drawn on that row's own last visible line, so a row
  whose note box is open shows it there rather than losing it under the note;
  the row below the gap is marked on its own first line, unaffected either
  way. The drop zone is the rows' own extent plus one measured row gap at
  each end. The list accepts a release at every moment the highlight is
  shown, including while the pointer crosses a row's own controls (grip,
  inputs, note) on the way through. Leaving the zone, releasing outside it,
  and Escape all cancel the drag and change nothing. Dragging near a
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
  and its cancel; a search box appears from the eighth list; the menu opens on
  the side of the toggle button with room in the clipping box it sits in - the
  record modal's own card where there is one, the window everywhere else -
  re-measured from the toggle itself (not whichever button happens to render
  first) whenever it opens or grows, so it neither spills past the modal's
  edge nor drags the card's own scroll position along with it (DEBT.md D6,
  paid off). Escape closes it and returns focus to the toggle, the same as
  any other disclosure on the page.
- Optional quantity and price per entry; both travel into copied text.
- Prices display as book units (default) or coins; the mode is per list and
  rides in the link.
- Batch actions over a selection within a list: set prices, clear prices, shift
  all by a percentage, suggest prices from tier or rarity, copy, remove. The
  batch bar shows the selection total beside "Выбрано N". "Скопировать" copies
  the ticked entries in list order with each taken count and unit price after
  the name, and ends with the total line. "Удалить (N)" removes by the taken
  count: an entry taken whole leaves the list, an entry taken in part keeps
  the rest of its quantity (a rest of 1 stores no quantity). N stays the
  number of ticked rows, the toast reads "Убрано из списка (N)" for a partial
  removal too, and one "Вернуть" restores every row it touched, in place.
- A selection on a list page - the own list and the shared page - carries a
  taken count per ticked entry. Ticking takes the whole quantity. A ticked
  entry with a quantity over 1 draws a "Сколько" field in a strip right under
  its row, which narrows the count to 1..quantity; an emptied field puts its
  value back on commit. The count lives in memory only and clears with its
  tick, on "clear selection", and on a navigation. The total is the sum of
  price x taken count over the priced ticked entries, in coins, read once in
  the list's money mode: `Итого: 1 мешок 1 горсть`. Unpriced ticked entries
  add nothing and are counted after it: `(без цены: 1)`. With no priced
  entry ticked, no total is drawn. The rounded total can differ from the sum
  of the rounded row prices. A table or search selection has no taken count
  and no total.
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
- Import: paste a link or a payload to take a copy of someone else's list -
  either link form, plain or packed.
- A shared link (`#/l/<payload>`) that is nobody's own list draws the shared
  page: the name, the shared-list line with the count as one text node, one
  "Сохранить себе" / "Save to my lists" button, drawn whatever the selection,
  that saves the whole list as a new list of one's own - entries, quantity,
  price, every note the link carries and the money mode - and opens it, the
  list's own notes, and the rows; taking some rows, or all of them after
  "select all", into a new or an existing list is the selection bar's
  add-to-list control, which carries the taken count as the quantity (none
  for a count of 1), the price and a row's public note but never the GM's
  note. The bar shows the selection total beside "Выбрано N", and its
  "Скопировать" carries each taken count and unit price and ends with the
  total line. A payload that cannot be decoded
  draws "Предмет не найден", the bad-link line and a "На главную" button to
  `#/roll/std`. A **packed** link (`#/l/~<payload>`) that cannot be expanded
  draws the same bad-link page without replacing the address - the live
  shape sent the reader to `#/l/zzzz` instead, which cost a slow unpack
  resolving after the reader had already moved on the shared list they had
  since left for (`DEBT.md` D2, paid off; R10/Q4 settled).
- Two open tabs merge rather than overwrite (`STATE.md`).
- A storage notice at the top of the index and of a list page: when storage
  refuses, a plain warning that cannot be dismissed; otherwise a folded "lists
  live in this browser only" disclosure whose cross is remembered in
  `dhloot.warn.v1`; unfolding is not remembered - the notice comes back folded
  after a language switch, as the live re-render left it; on the index it
  survives a create and a delete, where the live whole-page re-render
  re-folded it - the rewrite's deliberate deviation, invisible to the old
  parity harness because every one of its states started folded (deleted at
  R0c, issue 47). The dismiss cross is a sibling control positioned over the
  disclosure's corner, not nested inside the `<summary>` that opens and
  closes it (`DEBT.md` D3, paid off) - the two presses no longer have to
  fight over the same click.

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
  share stub's subtitle are paths too, and are held to the same rule. The
  section leaf is not generalised past this set - a table earns one only when
  it is sectioned by a value the record itself carries, or, for Vault of
  Ages, by the book's own tiers; extending the rule to every table was
  rejected.
- The `.badge src` chip on a record card, a table row, a Search result, a list
  row, or a modal card is a tag, not a path: one leaf naming the book, the
  community, or the setting - never a breadcrumb. It carries no path segment
  because every place it is drawn already shows the surrounding context (a
  table, a section, a list of results).
- `#/i/<id>` for an id the data does not know draws "Предмет не найден", the
  sub line and a "На главную" button to `#/roll/std` (the live
  `renderItemPage` shape) and keeps the plain tab title, the same as any
  other route with nothing of its own to name. A record that is found, a
  section, and an owned list each title the tab with their own name ahead of
  the app's - `<name> — <docTitle>` (`DEBT.md` D5/O3, paid off; the live app
  wrote the name and then overwrote it with the plain title on the very same
  render, on both `#/i/<id>` and every other route that could have named
  itself). When `data.js` itself did not load, every page draws the "data did
  not load" line in place of its content (`NoData.svelte`) - the rewrite's
  own state; the live app threw on a missing `window.LOOT` and drew nothing.
- Copy name, copy link, share, copy image, copy text. Copied text goes to the
  clipboard as both `text/html` (name in `<b>`) and `text/plain`; Markdown
  asterisks are deliberately not used.
- Copying the image has three outcomes, each with its own toast. A canvas
  that cannot be read back at all (a `file://` document's own picture always
  taints it) falls back to copying the record's text instead, worded to say
  so (`DEBT.md` D10, paid off). A picture the canvas can produce but the
  clipboard refuses falls back to downloading it as a PNG file, saved or
  failed each with their own wording (D14/D15, paid off) - distinct from the
  clipboard's own generic "could not copy".
- Sharing a record attaches its picture where there is one and the share
  sheet can take a file, and always carries the full share text (stats and
  description included), not just the name (D22, paid off).
- Copying every option of a roll toasts its own wording, not the generic
  text-copied message (D13, paid off).
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
- A record that belongs to a set (`Record_.set`, two members so far - Ember
  and Spark, The Dragon's Vault) draws a set line naming every member in
  catalogue order, the record itself inert and the rest linked. A set's
  shared bonus (`LOOT.sets[key]`) is drawn under the set line on every
  member and travels into copied text (the set block's body), the print card
  (the last text line, `<name> (<Set>: <members>): <text>`), the share stub
  and `catalog.csv`; a set with no bonus copies its line alone, with no blank
  line after it. The set is derived by grouping at load, never stored as a
  sibling list, and a set of one is not a set. No set filter and no set page
  exist yet.
- A record with no artwork falls back to `_none.webp` and hides the image
  button; so does a record whose file fails to load, and the app remembers that
  for the session.
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
- A card printed from a list shows the list's count after its name as ` ×N`
  (a space, U+00D7, the number), only for a count over 1 - the same suffix
  the list's copied text puts after the name (`qtySuffix` in `share.ts`). The
  count rides in the address as `*<n>` per id (`ROUTES.md`), so it survives a
  reload and the copied set link. Only the list page's print button writes
  it; the record, table and search print links carry none. The counter sits
  in a `nowrap` span, so it wraps with the name's last word, never alone.
- Fitting is measured in the browser after render: rules text steps its font
  down, then the top padding, then the stat values, and text width is measured
  with a `Range` because `text-overflow` hides overflow from `scrollWidth`.
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
  demoted to `<h3>` (`DEBT.md` D8, paid off).
- The black-and-white choice (`printBW`) and the sheet size (`printCompact`)
  are session memory on `AppState` - they survive leaving the print page and
  coming back - matching the live app's own `S.printBW` rather than resetting
  on every fresh entry, which is what the page-local `$state` this replaced
  did (`DEBT.md` D21, paid off). Neither is written to storage.
- A missing picture (a partial deploy, a cold cache, a `file://` copy short
  one file) falls back to the same drawn glyph a record with no art gets,
  the same way `RecordCard` does - reached from a print sheet opened
  directly at a shared `#/print/...` address, where nothing has already
  caught the failure (`DEBT.md` R6, paid off).
- An open record dialog and an action toast both stay hidden under print
  media, the way the live app's `#modal`/`#toast` rules did unconditionally -
  neither had an equivalent rule in the rewrite (`DEBT.md` D20, paid off).
- The card's own name (`.pc-name`) is not part of `fit()`'s shrink ladder -
  P16, inspected rather than assumed (owner decision Q2, "look first, then
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

## Chrome

- Language switch, tab bar, skip link, starting-section pin (eight sections
  pin as their own hash; `#/tables` pins as whichever table is on screen;
  never a record or a list).
- Focusing the skip link moves focus straight to `#main` and never touches
  the address bar - the browser's own fragment jump would also route the
  hash through the app's own parser, which reads `#main` as unknown and
  would clear the person's selection navigating them home (P1). While
  focused it is a gold plate pinned over the page's top-left corner, matching
  the live app rather than a grey chip that pushed the header down while
  focused (`DEBT.md` D19, paid off).
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
- Under `prefers-reduced-motion: reduce` every transition and animation stops
  moving - a blanket kill (`tokens.css`), not the live app's own two named
  exceptions. A deliberate improvement over parity: `DEBT.md`, D1, paid off.
- Every focusable control gets the same gold keyboard-focus ring, at the
  control's own border-radius where a component sets one and `--r-sm`
  otherwise (a scoped rule always outranks the unscoped global one - `.seg
  button`'s 999px is untouched) - a global rule (`tokens.css`) rather than
  the live app's closed list of 18 selectors at an 8px radius, with
  everything outside that list falling back to the browser's own outline.
- Self-hosted fonts were considered and dropped: the app declares `Inter,
  -apple-system, 'Segoe UI', Roboto, ...` with no `@font-face` (`tokens.
  css`), so glyphs depend on the machine. The five weights in use (650, 680,
  620, 560, 540) render as authored only with a variable font, and the print
  card needs a real italic - both argue for self-hosting, but the owner
  decided against it.
  Broader coverage was the owner's call: `DEBT.md`, D18, paid off.
