# 2026-10-08 - An own set or rule card holds book items; only its account sees them

- Task: `homebrew-followups` (owner, 2026-10-08, question Q1 answered A).
- Decision: an own card stores catalog ids in `content.items` (1-100 unique, never an `hb_` key; an own item
  still names the card itself). Only the account's own index applies them (`withRecords`, `ownSetOf`,
  `ownRefsOf`): the record page and dialog, rows, search, print, copied text and the account's own share
  links; a book set wins over an own set. The export writes `homebrew-v2` only when a card holds `items`;
  `homebrew_cards_touch` skips an update of `items` alone, which changes no linked item's record.
- Rejected: B, the share projection carries the GM's card on a book item (a second definer change, more
  notices; it can follow with no data change); C, an own copy joins the set (two items of one name); a member
  table (a table, policies and export for one list); the members on the item (a book record is never written).
- Accepted trade-off: players on a share link do not see the bonus; a frontend revert drops `items` on its
  next card text edit; the down migration strips them (recovery: a `homebrew-v2` export before it, imported
  after the up; the previous bundle refuses version 2); a v1 «Обновить» keeps held items, so a v1 file cannot
  remove them, and in one tab it can drop an item another tab added meanwhile; `get_homebrew_item`'s
  `updated_at` moves on a book-items edit; a card update that changes nothing bumps no list.
- Amends "A homebrew item carries the whole catalog shape; sources and cards are rows" (2026-09-30): a card row also holds book items.
