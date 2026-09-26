# 2026-09-26 - A request the database fails three times is halved; a lone write is dropped

- Task: `persist-5-migration` (owner, 2026-09-26: the gap "a request that always fails blocks every later edit"; planner, passes 6 and 7).
- Decision: an `apply_list_writes` call answered HTTP 500 with `57014` or a SQLSTATE of class `22`,
  `23`, `42`, `P0` or `XX` (a statement timeout, a defect in the function) is a fault. `CloudLists`
  retries a faulted request as a lost network, every 15 s, and counts at most one fault per 15 s;
  the third counted fault in a row (`FAULT_LIMIT`) halves the request and sends the halves in
  order, at once; a single write that faults three times is dropped as refused, with the refusal
  toast and a re-read. Any answer that drops the head writes resets the count. A lost network, a
  lapsed session, a `PGRST*` 500, 502, 503, 504, a 404 `PGRST202`, class 40 and every other code
  (a restart answers `57P01`, `55P03`) stay `network`: they are waited out, never split. A write
  that alone fails the call is dropped after at most `3 * (ceil(log2 k) + 1)` counted faults.
- Rejected: retrying forever (every later edit waits behind a request that never lands); dropping
  the whole request after N faults (it loses the good writes beside the bad one); splitting on the
  first fault (a passing 500 could drop a good single write); every HTTP 500 outside class 40 as a
  fault (a Supabase restart answers `57P01` and `55P03` for about 30 s, and three presses of
  «Повторить» within seconds would have split a good request).
