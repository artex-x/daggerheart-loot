# 2026-09-30 - A homebrew item carries the whole catalog shape; sources and cards are rows

- Task: `persist-7-homebrew` (owner's scope of 2026-09-27/28 and answers of 2026-09-30; planner, passes 2-4).
- Decision: `homebrew_items.content` holds the catalog record's fields except a book's own (`roll`,
  `frame`, `starting`, `community`, `recall`; `img` waits for R8): both languages optional with one
  name, `tier`, `eq` with `alt`, `section`, and from R7c `eq.line`, `set`, `refs`, `craft` and
  `craft_from` (the one field the catalog lacks: an official record is never written), the last two
  lists of up to 8. The catalog's own `craft` becomes a list of ids too, in R7c's first batch (a
  public contract change on `data.json`): one shape everywhere. A source («Источник», code word
  `book`) is a `homebrew_books` row with its sections; a set bonus or a rule card is a
  `homebrew_cards` row (R7c). Every key is `hb_` plus 16 base32 characters, unique per owner.
- Rejected: a free-text source tag (item 13's books need an id); cards inside the source row (an
  item with no source has nowhere to put them); the catalog's `craft` kept as one id (two shapes for
  one field; the owner chose one shape on 2026-09-30); one language and a `lang` field (a later
  second language rewrites every frozen copy); `recall` (drawn nowhere).
- Amends "A homebrew item is stored as the catalog record shape in one jsonb column, under a per-owner `hb_` key" (2026-09-25): the whole shape, not seven fields.
- Amends "Frostwyrd is a two-step craft chain; every upgrade line stays at four tiers" (2026-09-19): the chain is written as one-id lists.
