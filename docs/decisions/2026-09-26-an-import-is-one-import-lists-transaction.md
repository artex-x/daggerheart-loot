# 2026-09-26 - An import is one `import_lists()` transaction: every list or none

- Task: `persist-6-import-export` (planner, 2026-09-26; the owner chose
  all or nothing on 2026-09-26).
- Decision: the client validates the file, then sends every list and entry
  with client-made ids to `public.import_lists(p_lists jsonb)`, a
  `security definer` function for `authenticated` only. The table checks
  and the limit triggers run inside it, so a refusal (a count limit, a bad
  value, another owner's id) unwinds the whole call; `on conflict (id) do
  nothing` makes a retry idempotent. The store neither queues an import
  nor draws it optimistically: one press, one answer, one re-read.
- Rejected: one `create()` per list through the write queue (a refusal
  mid-way leaves a partial set to sort out by hand); importing what fits
  and naming the rest (a second report and a skipping retry); server-made
  ids (a retry after a lost answer duplicates every list).
