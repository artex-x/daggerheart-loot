# 2026-10-16 - An account delete removes its purchase requests in bounded calls first

- Task: `debt-cleanup` (planner, 2026-10-15 and 2026-10-16; plan reviews before B2 and B3).
- Decision: `deleteAccount()` (`app/src/ports/supabase.ts`) calls the security definer
  `delete_account_requests()` (200 requests a call) until it answers 0, at most 100 times, then
  the unchanged `delete_account()`; `PGRST202` goes straight to it. At three times every limit
  one statement took 20-23 s; the requests alone 2.3-4.2 s; the rest 4.9-5.7 s with no
  statistics (`explain`: the `homebrew_items` cascade 9.0 s), 318 ms after `analyze`; with it,
  24 calls of at most 926 ms and a final 501-1252 ms (this host, three runs, 2026-10-16).
- Why `analyze`: autoanalyze runs once a table's changed rows pass 50 plus 10 % of its rows,
  autovacuum looks every 60 s, so a hosted table with other accounts' rows has statistics.
- Rejected: one statement; a loop in `delete_account()` (one timeout covers the call); `pg_cron`
  (the account stays usable); a new return type (a stale tab reports an unfinished delete); a
  bounded item delete (a planner effect, not row volume).
- Accepted trade-off: before autoanalyze after a bulk import the last step may pass the hosted 8 s
  (not measured): the error toast, then a later press finishes.
- Amends "A statement timeout halves a request at once" (2026-10-15): the 3x delete ships.
