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

## Tables and search

- 14 tables (`TABLE_DEFS`), each with its own search box and a list/grid switch.
- Search covers all 1061 records: names, descriptions and stat lines, both
  languages at once.
- Every heading has a copy-link button; sections are addressable.
- **The three equipment tables hold equipment from every source, not only the
  two books**: 317 weapons, 108 secondary, 90 armour. The `src` facet is how you
  narrow to Core and Hope & Fear (239 / 73 / 69). Frame, Vault of Ages, Wondrous
  and Dread equipment appears there too.
- The filter panel is one component across all tables; where a table has nothing
  to filter by, there is no panel. Nothing is selected by default and an empty
  row means "any". Chosen values show as pills outside the panel, with a reset
  and a copy-link button, so they are reachable while the panel is folded.
- Filter state lives in the address (`STATE.md`), written with `replaceState` on
  every change, and read back only when the segment actually changed.

## Lists

- Create, rename, reorder (drag handle or by typing a position), remove with
  undo, delete.
- Add from a table or search selection, or from an item card. The card menu stays
  open so one item can go into several lists; a search box appears from the
  eighth list.
- Optional quantity and price per entry; both travel into copied text.
- Prices display as book units (default) or coins; the mode is per list and
  rides in the link.
- Batch actions over a selection within a list: set prices, clear prices, shift
  all by a percentage, suggest prices from tier or rarity, remove.
- A list has its own roll button; the row numbers match it.
- Two notes per list and per entry - see `CONTRACTS.md` for how they encode and
  which link carries which.
- The address bar always holds the player link and is refreshed on every edit.
- Import: paste a link or a payload to take a copy of someone else's list.
- Two open tabs merge rather than overwrite (`STATE.md`).

## Records

- Card in a modal from a table row, or a full page at `#/i/<id>`.
- Copy name, copy link, share, copy image, copy text. Copied text goes to the
  clipboard as both `text/html` (name in `<b>`) and `text/plain`; Markdown
  asterisks are deliberately not used.
- Consumables get a "(consumable)" suffix outside the app, where the badge is
  not visible.
- Upgrade chains render both directions; the reverse is computed at load. That
  is `craft` - one thing made from another - and it is not the tier ladder
  below.
- Equipment that belongs to an upgrade **line** carries a tier ladder: one rung
  per tier of that line, in tier order, the rung you are on marked and inert
  and the others opening that tier's record over whatever is on screen. A line
  of one is not a ladder and is not drawn. Each rung is named for the piece it
  leads to, because its own content is a bare digit.
- Referenced Core cards render as a collapsed block and travel with the item
  into copies and shares.
- A record with no artwork falls back to `_none.webp` and hides the image
  button; so does a record whose file fails to load, and the app remembers that
  for the session.

## Print

- `#/print/<ids>`, nine cards to an A4 page at 63x88 mm, up to 180 cards.
- Reached from an item page, a list, or a table selection; the address is
  shareable and independent of where it came from.
- Colour and black-and-white are two different cards, not one with a switch.
- Fitting is measured in the browser after render: rules text steps its font
  down, then the top padding, then the stat values, and text width is measured
  with a `Range` because `text-overflow` hides overflow from `scrollWidth`.

## Chrome

- Language switch, tab bar, skip link, starting-section pin (nine sections or
  any table by name; not a record or a list).
- Storage warning when `localStorage` is unavailable, dismissible and
  remembered.
- Help panels under a `?` per section, folded by default, fold state remembered
  for the session only.
- Toasts with an undo action for destructive things.
