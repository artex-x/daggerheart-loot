# 2026-10-14 - A link preview reads a lean projection

- Task: `link-previews` (owner, chat, 2026-10-14).
- Decision: the preview host reads `get_item_preview(uuid, text)` and `get_shared_list_preview(text)`
  (`supabase/migrations/20261014120200_link_previews.sql`), `anon` reads that return only what a card draws, with the names ordered by the
  database's ICU collation and cut at the card's 1200-byte line in the database, so a card's CPU does not grow with the set or the list; an answer
  stays at most 32768 bytes (`/h/`) and 4096 bytes (`/s/`). The byte bounds `ITEM_MAX` 65536 and `LIST_MAX` 8192 in `preview/worker.mjs` stay as
  defence in depth.
- Rejected: a byte bound on `get_homebrew_item` with a site-card fallback (a large set's item loses its name, and a count-heavy answer under the
  bound can still pass 10 ms: 640 small rows cost twice 36 big rows of the same size); a partial parse that stops after `item` (jsonb's key order
  is not a contract); a change of `get_homebrew_item` (the `#/h/` page draws its full `related`).
- Accepted trade-off: two more `anon` functions; the related predicate exists twice, in `get_homebrew_item` and `get_item_preview`, held equal by
  `tests/db/link-previews.test.mjs`; the names' order is the database's ICU collation, which can differ from the Workers runtime for an exotic name.
