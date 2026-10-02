# 2026-10-02 - The account re-read fetches only the lists whose revision moved

- Task: `persist-7g-read-scale` (planner, 2026-10-01; the owner's target of 3x the defaults).
- Decision: `ListRepository.list(known)` takes the revision the caller holds per list. With
  `known`, the port reads `id,revision` of every list, then the full rows of the changed lists by
  `in('id', ...)`, and answers the others in `kept`; an id in neither is gone. More than 50
  changed lists (`CHANGED_LISTS_MAX`) read every list in full; a page load reads every list. Both
  reads order by `updated_at` desc, then `id`, and keep the two limit reads beside their first
  request. The owner's pending requests are read in keyset pages of 1000 by `id` (`READ_PAGE`,
  `supabase/config.toml` `max_rows`), a fresh query per page.
- Rejected: lazy snapshots or entries for the open list only (the index, the requests panel, the
  add menu and the frozen copies need every list at once); a `get_lists(p_known)` RPC (a
  migration and a function for what two PostgREST reads do); `.range()` paging of the embedded
  read (it still sends every entry); offset pages for the requests (a row deleted between two
  pages skips another).
- Accepted trade-off: the first read of each page load still carries every entry, about 1.8 MB
  catalog-only at the defaults and 11-16 MB at three times them (estimates).
