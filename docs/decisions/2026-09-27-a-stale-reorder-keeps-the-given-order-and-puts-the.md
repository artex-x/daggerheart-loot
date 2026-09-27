# 2026-09-27 - A stale reorder keeps the given order and puts the other entries after it

- Task: `persist-3-realtime` (planner, 2026-09-27).
- Decision: `reorder_list(p_list, p_entries)` ignores an id that is not
  an entry of the list and a null, counts a repeated id once, and puts
  the entries it was not given after the given ones in their `(position,
  id)` order; it refuses only a caller who is not the owner and a null
  order. The fake and the contract follow. The last write wins per entry.
- Rejected: refusing and re-reading (a refused reorder snapped the order
  back with a toast for a change that lost nothing); a client re-read before each reorder (a
  round trip per drag, and still racy).
