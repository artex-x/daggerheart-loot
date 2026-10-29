# 2026-10-28 - The account's first read takes list heads; a list's details load when needed

- Task: `persist-10-legacy-removal` (carry P6; the planner chose PostgREST heads 2026-10-23; the owner changed D115's check, Q2 A, 2026-10-23).
- Decision: `list(known)` reads each list's columns and `list_entries(id,item_key,source,hb_item,position)`;
  `rows(ids)` reads the named lists whole in chunks of 50; `CloudLists.detail` reads a list's entries at
  its page, the menu's remove with undo, the owner's players' link count and a download, and a re-read
  reads a changed list whole only when the tab holds its entries (`app/src/ports/supabase.ts`,
  `app/src/state/cloudLists.svelte.ts`). D115's check became three conditions, the owner's choice: no
  entry note, quantity, price or GM-only flag in the first read; the head JSON at 3x at most
  6 000 000 bytes (`check:db`); 4000 ms on `#/lists` and the largest list's page.
- Rejected: an `account_heads()` RPC with counts and thumbnail keys (a migration, and the menu still needs every key); PostgREST aggregates (`db_aggregates_enabled` is a role setting for every table); lazy notes only (quantities, prices and flags stay, est. 7-9 MB at 3x); keys read at the first menu press (the menu, `listsHolding` and `relinkTargets` need every key at once).
- Evidence: 3x seed, this host, 2026-10-28, median of three at 1180 px: `#/lists` 4100 ms before, 1313 ms after; the newest list's page 4754 ms before, 1591 ms after; the lists read 45.5 MB before, 5.6 MB after over PostgREST; the heads JSON 5 269 240 bytes in SQL (127 ms; fifty lists whole 207 ms). The seed's keys are catalog ids, `official`, no `hb_item`, so the bound is not a worst case: a homebrew-only account at 3x is est. 7 MB.
- Accepted trade-off: one small row per entry in the first read; a list page waits one more round trip; the menu's remove waits for one list's read; a re-read of a changed list the tab holds whole is three requests in a row (`id,revision`, the changed heads, then `rows`), one more than before.
- Amends "The account re-read fetches only the lists whose revision moved" (2026-10-02): a page load reads heads, and a changed list is read whole only when the tab holds its entries. This reverses that file's rejection of lazy entries: heads carry every key the index, the add menu and the relink need, and the requests panel and the downloads read details first.
