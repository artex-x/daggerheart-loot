# 2026-10-22 - A bulk delete of own items is one invoker call

- Superseded in part by "A bulk delete of own items goes in chunks of 50" (2026-10-22): the page sends one call per 50 ids, not one call.
- Task: `persist-review` (owner, I11 "Implement now" and P37, 2026-10-22; planner, 2026-10-22).
- Decision: «Удалить (N)» on `#/homebrew` sends one `delete_homebrew_items(uuid[])` call
  (security invoker, `authenticated` only, at most 1000 ids), which deletes the caller's named
  items in one statement, all or none, and answers the count; a failure keeps every row and
  every tick. The editor's single delete keeps the table delete.
- Rejected: a PostgREST `delete ... in.(ids)` filter (300 ids put about 11 KB in the address);
  a definer function (the owner's delete policy already allows it); one request per item (about
  a minute at 300, and a stop halfway on a lost network).
- Consequences: a print set names items by id with no foreign key, so a deleted item becomes
  `missing` in each print set that names it (`get_print_set`), as with a per-item delete;
  Realtime sends one message per list topic and one per owner topic when the one transaction
  commits, not N messages.
