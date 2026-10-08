# 2026-10-08 - A GM-only entry is dropped by the share projection

- Task: `70` (GitHub issue #70; the owner approved the design 2026-10-06 and accepted the item reach 2026-10-07).
- Decision: `list_entries.gm_only` marks an entry «Только для мастера». `get_shared_list(text)` leaves it out of a
  players' answer with its `hid` and record and numbers the rest from 0; a GM's answer writes `gm_only` on each entry.
  `clone_shared_list` copies the mark; `create_purchase_request` through a players' link answers `stale` for it. Every
  later redefinition of these three keeps the audience filter and the renumbered position, or the players' link shows
  the entries again. A lists file is version 3 only when a list of the file holds a GM-only entry.
- Rejected: a client filter or CSS (the entry still reaches the player); a column policy (non-owners never select
  `list_entries`); a table of hidden ids (a join for one boolean); a «Скрытые» group (breaks the order and `position`);
  a checkbox or a text marker in the row and a file without the mark (the owner); a file always version 3 (breaks both
  data-zip pins); dropping from `get_homebrew_item`'s `related` each item a GM-only entry links (couples the item read
  to lists, no single answer for an item GM-only in one list only, and the item stays readable by its id).
- Accepted trade-off: the mark hides the entry, not the item: a related row's `hid` opens the item's page, a player's
  own link made while the entry was shown keeps its «Автор изменил ...» notices, a players' copy made before the mark
  keeps the entry, and the players' revision moves on a GM-only edit or an edit of an item only it links.
