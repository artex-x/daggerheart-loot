# 2026-09-30 - The list_entries touch and limit triggers run once per statement

- Amends "`import-v1` bounds are the import call's ceilings, not the default limits" (2026-09-30): the row estimate under the 8 s timeout.
- Task: `e2e-import-slowdown` (the owner's answer to Q1, 2026-09-30).
- Decision: `list_entries_touch()` and `list_entries_limit()` run as five statement triggers with transition tables
  (`20260930121000_list_entries_statement_triggers.sql`): a statement bumps each list it touched once, the list an
  entry left included, and checks the entry limit once per list that gained rows. A list's `revision` grows by one
  per statement that touches it, not by one per entry row.
- Rejected: the row triggers with a wider e2e bound (the import stays quadratic in the entries per list, and a slow
  host minute reaches a user's 8 s timeout); a `dhloot.import` setting that skips the row triggers inside
  `import_lists()` (a second code path; `apply_list_writes`, the move and `reorder_list` stay quadratic); a larger
  compute add-on (cost; production runs the same code).
- Evidence: the test project, 2026-09-30, in transactions that rolled back: 50x100 took 2297-3519 ms of server time
  with the row triggers and 211-316 ms with the statement triggers; 1000x5 took 1739 ms plus 749 ms at commit, then
  785 ms plus 316 ms.
- Accepted trade-off: revision numbers no longer count entry rows; a large reorder's transition tables may spill to temp files;
  e2e case L logs the 5 MB import's time and asserts only its success (the owner: the swapping host reaches any bound).
