# 2026-10-02 - Homebrew import and the bulk move are each one all-or-nothing call

- Task: `persist-7d-homebrew-files` (R7d).
- Decision: `import_homebrew(p_books, p_cards, p_items, p_update)` writes a
  homebrew file's sources, cards and items in one transaction: a held key is
  skipped, or rewritten whole with the update flag; a held source only gains
  sections and changes its names only with `names`. `move_homebrew_items`
  moves a selection to a source and a section in one transaction, each item
  naming the revision read, and writes only `book_id` and `section`. The
  ceilings per call are 100 sources, 1000 cards and 1000 items (at least
  three times the default limits), the file's bounds too.
- Rejected: one request per item for the move (300 requests and a half-moved
  selection on a failure); a PostgREST bulk upsert (no revision check per
  row); a client that sends each item's content (it would overwrite an edit
  made on another device); file bounds at the default limits (rejected in
  docs/decisions/2026-09-30-homebrew-travels-as-its-own-file.md).
