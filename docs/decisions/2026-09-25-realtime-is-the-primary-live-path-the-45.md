# 2026-09-25 - Realtime is the primary live path; the 45 s poll runs while it is down

- Task: `persist-3-realtime` (owner, 2026-09-25; planner, the state machine).
- Decision: a page with a live topic joins it as a private channel and
  moves through `connecting`, `live` and `down` (`app/src/lib/live.ts`).
  While `live` the 45 s re-read is off; while `down`, or `connecting` past
  10 s, it runs. Every join refetches once; the refetch on focus stays in
  every state. A lost channel retries after 2 s, doubled to at most 300 s,
  +/-20 %. The channel stays open in a hidden tab.
- Rejected: Realtime in place of the poll (owner: a refused, blocked or
  limited channel must still update the page); the poll always on beside
  Realtime (reads with no reason while messages arrive); closing a hidden
  tab's channel (a rejoin and a read on every return; revisit if peak
  connections pass 150).
- Amends "Realtime ships in v1, directly after lists, over polling" (2026-09-24): the poll runs only while Realtime is down.
