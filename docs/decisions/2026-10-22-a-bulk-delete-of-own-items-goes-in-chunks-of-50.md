# 2026-10-22 - A bulk delete of own items goes in chunks of 50

- Supersedes in part "A bulk delete of own items is one invoker call" (2026-10-22): the page sends one call per 50 ids, not one call.
- Task: `persist-review` (owner, B8-R2 "Chunk in the client (Recommended)", 2026-10-22).
- Decision: `Homebrew.removeItems` sends `delete_homebrew_items(uuid[])` once per
  `DELETE_CHUNK` (50) ids, in order, each call all or none; the first failure stops. The rows
  of the earlier calls stay deleted; the rest keep their rows and their ticks, the toast names
  the count deleted, and a second press deletes the rest
  (`app/src/state/homebrew.svelte.ts`, `app/src/components/HomebrewPage.svelte`).
- Evidence: one call of 300 items linked from 45000 entries of another owner's lists took
  2530-2897 ms and once reached the 4 s bound (`57014` in `homebrew_links_touch`); in calls of
  50 the median is 475 ms and the worst 554 ms (local stack, 2026-10-22).
- Rejected: set-based notices in a schema batch (one `list_notices` write per statement; a
  migration, a reversal and a plan review for a cost the client can split); accepting the bound
  (a 300-item delete would fail now and then at three times the defaults).
- Accepted trade-off: a failure partway leaves a partial delete; the toast names it, and Realtime
  sends one message per call, not one per press.
