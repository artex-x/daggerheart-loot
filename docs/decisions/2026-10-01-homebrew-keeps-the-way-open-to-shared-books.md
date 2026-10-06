# 2026-10-01 - Homebrew keeps the way open to shared books without building them

- Amended by "An item is read by its id by anyone; a list holds a live link" (2026-10-07): items are readable by id, `list_entries.hb_item` is the anticipated `item_owner`; books stay owner-only and subscriptions stay open.
- Task: `persist-7-homebrew` (owner's item 13, 2026-09-28; planner, passes 2-4; written at R7's closeout).
- Decision: a later release may make a source a book that its author shares and keeps editing,
  that other users subscribe to and see everywhere (roll tables included), and whose unsubscribe
  keeps list entries valid; a catalog source may become such a book. R7-R7d build none of it and
  keep these shapes: `homebrew_items.book_id` names a `homebrew_books` row; sections are a book's
  subcategories, as communities split the community book; keys are per-owner `hb_` keys of 80
  random bits, so a subscribed item resolves by book and key; row level security is owner-only,
  so visibility arrives as a `homebrew_subscriptions` table and a `select` policy; the file format
  uses the catalog's field names. Cost later: one migration; `owner_id` on the row shapes and an
  `editable` flag in the store; `list_entries.item_owner` and a projection change; `roll` on the
  content with a roll panel per book; a projection that embeds a subscriber's snapshot, or an
  entry that freezes on unsubscribe.
- Rejected: subscriptions in R7-R7d (the owner: very long term, outside this work); `owner_id`
  on the row shapes and `list_entries.item_owner` now (no reader before subscriptions; additive).
