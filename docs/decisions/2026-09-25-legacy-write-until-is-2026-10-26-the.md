# 2026-09-25 - `LEGACY_WRITE_UNTIL` is 2026-10-26; the migration release moves directly after lists

- Task: `persist-2-lists` (owner, 2026-09-25, against the planner's "set
  it at R5's closeout").
- Decision: `LEGACY_WRITE_UNTIL` is Monday 2026-10-26, written into
  `app/src/lib/legacy.ts` by R5 and named by R2's `llms.txt` and shared
  page from the day R2 ships. To make it reachable, R5
  `persist-5-migration` ships directly after R2, and R3 (Realtime) and R4
  (purchase requests) follow R5. Safety rule: if R5 is not live on
  production by 2026-10-12, the owner moves the date later (a one-line
  commit and a deploy). Amends "The `#/l/` link decoder retires at the
  legacy write cutoff" (2026-09-24): the date is fixed, not derived from
  R5's live date; the rest of that entry stands.
- Rejected: the derived rule, first Monday at least 30 days after R5 is
  live (the planner's recommendation; a date set now names a release with
  no ship date) - the owner wants one month from now and no longer;
  keeping R3 and R4 ahead of R5 (the date would not be reachable).
- Amends "The `#/l/` link decoder retires at the legacy write cutoff" (2026-09-24): the date is fixed, not derived.
