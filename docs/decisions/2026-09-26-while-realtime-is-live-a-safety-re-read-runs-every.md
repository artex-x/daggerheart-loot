# 2026-09-26 - While Realtime is live, a safety re-read runs every 5 minutes

- Task: `persist-3-realtime` (owner, Q3, 2026-09-26).
- Decision: while a page's feed is `live`, the page still re-reads its
  list every 5 minutes, beside the refetch on focus; the 45 s poll stays
  off while `live`.
- Rejected: no timed read while `live` (a message that is never
  delivered while the channel reports `SUBSCRIBED`, an open platform
  report of 2026-09-21, would leave the page old until the next edit,
  focus or rejoin).
- Amends "Realtime is the primary live path; the 45 s poll runs while it is down" (2026-09-25): a 5-minute re-read also runs while `live`.
