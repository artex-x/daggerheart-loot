# 2026-10-22 - Anonymous reads have no rate limit; the owner watches the usage

- Task: `persist-review` (owner, 2026-10-22, "accept" in the persistence review).
- Decision: the reads that `anon` executes (`get_shared_list` in its three forms,
  `get_homebrew_item`, the two preview reads) keep no rate limit and no bound on the bytes of
  an answer; only `create_purchase_request` has one. A caller who holds a share link or an item
  id can repeat them and spend the free plan's 5 GB of uncached egress and the `anon` role's
  database time. The owner reads the usage dashboard monthly (`docs/specs/META.md`, section 3).
- Rejected: a task of its own (`anon-read-budget`: a warning row in the nightly usage report
  when a day's REST count passes a bound, then a projection that answers records only for the
  entries the caller names, in pages; size L, a migration, a definer and a contract change):
  the owner chose to accept the cost.
- Evidence: one `get_shared_list(text)` read at three times the limits answered 24.4 MB in
  1330 ms on the local stack (2026-10-22); a list of 100 of the longest records at the defaults
  is est. 8 MB an answer, so about 640 calls pass 5 GB. Gateway compression is not measured.
- Accepted trade-off: one hostile caller can spend the month's egress or make other `anon`
  readers queue toward the 3 s statement timeout; the dashboard shows it after the fact.
