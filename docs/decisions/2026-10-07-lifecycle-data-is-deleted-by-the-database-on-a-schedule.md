# 2026-10-07 - Lifecycle data is deleted by the database on a schedule

- Amended by "A list's change log shares the requests' view and the database's clean-up" (2026-10-07): the clean-up deletes requests and notices once they expire.
- Task: `persist-7h-homebrew-page` (owner, 2026-10-03, W2; planner, 2026-10-06, the mechanism).
- Decision: data with a lifecycle - expiry, retention after a decision or a
  read, a stopped link - is deleted on the backend on a schedule: by
  `public.lifecycle_cleanup()`, which `pg_cron` runs hourly as
  `dhloot-lifecycle`, or by the backend workflow that owns the table
  (`usage_snapshots`, the nightly usage report). The retentions are in
  `docs/specs/META.md` section 3. A client may hide such a row by its
  clock for display, never delete or keep it; a reader's explicit delete
  is not lifecycle logic. The nightly usage report warns when rows outlive
  their retention by 2 hours, or the job's newest run failed or is older
  than 2 hours.
- Rejected: a scheduled Edge Function (it needs a scheduler and a deploy route that do not exist yet); a step of the nightly workflow (daily, and GitHub stops an idle schedule after 60 days); housekeeping at write time (rows stay while nobody writes).
- Amends "Purchase requests are written only by a bounded function any link holder calls" (2026-09-26): the 24-hour retention runs hourly in the database, not at write time.
