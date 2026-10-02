# 2026-10-02 - A shared page re-read names its revision; an unchanged list answers unchanged

- Task: `persist-7g-read-scale` (planner, 2026-10-01).
- Decision: `get_shared_list(p_token text, p_since bigint)`, security invoker, calls
  `get_shared_list(text)` and answers `{"unchanged": true}` when the projection's revision is at
  most `p_since`, else the projection (null for a link that opens nothing). `SharedView.refresh()`
  sends the shown revision while the page is ready; `open()` and a refresh after a failed first
  read send none. `get_shared_list(text)` keeps its body, grants and callers; neither function
  has a default, so PostgREST picks one by the argument names.
- Rejected: a default `p_since` on the one function (a later `create or replace` of the
  one-argument form makes two candidates, `PGRST203`); a security definer wrapper that reads the
  revision first (one more anon-executable definer function and an Advisor warning for
  milliseconds of database work); entries changed since a revision (no tombstones; a projection
  contract change).
- Accepted trade-off: a migration that changes the projection without a revision bump (a new
  `get_shared_list(text)` or `homebrew_snapshot_of` body) leaves an open shared page on the old
  projection until the list's revision moves or the page reloads.
