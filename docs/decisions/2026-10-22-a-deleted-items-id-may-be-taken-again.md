# 2026-10-22 - A deleted item's id may be taken again by another account

- Task: `persist-review` (owner, 2026-10-22, "accept" in the persistence review).
- Decision: the client makes every homebrew item id (`crypto.randomUUID()` in `homebrewCreate`,
  `app/src/ports/supabase.ts`, an upsert on `id`), and the insert policy checks the owner and
  the source only, so a delete frees the id. Anyone who saw it can then create an item with it:
  an old `#/h/` link and the author's print sets (`get_print_set` joins a held id with no owner)
  draw that account's item (`docs/specs/META.md`, section 3).
- Rejected: a table of deleted ids that an insert trigger refuses, with a retention (a
  migration, its reversal and a SECURITY DEFINER trigger, size M), because anyone can already
  send a new link with any content, so the gain is only trust in an old link; ids made by the
  database (it breaks the idempotent create on a lost answer).
- Accepted trade-off: a reader of an old item link or print set may see another account's item
  under the deleted item's address.
