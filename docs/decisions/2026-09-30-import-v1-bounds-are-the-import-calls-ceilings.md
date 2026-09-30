# 2026-09-30 - `import-v1` bounds are the import call's ceilings, not the default limits

- Amends "The list file `import-v1` is a strict JSON Schema; import makes new ids" (2026-09-26): a bound may widen in place.
- Supersedes in part "Import validation is the client's; the count limits are the database's" (2026-09-26): the bounds 50 and 100.
- Task: `limits-follow-overrides` (the owner's answers to Q1 and Q2, 2026-09-30; the planner chose 1000).
- Decision: one file holds 1000 lists and 5000 entries per list, the bounds of one `import_lists()` call (raised
  from 50 lists in `20260930120000_import_lists_ceiling.sql`), widened in place in `schema/import-v1.json`. A v1
  bound may widen in place up to the call's ceiling and never narrows; the account's limits stay the database's.
- Rejected: keeping 50 lists and 100 entries (a list or an account an override let grow cannot move by file, and
  the app's own export is a file it refuses); widening in `import-v2` only (a long list stays unmovable until R7b ships); a
  total-entries bound per call (the schema cannot express it; the timeout answer ends a file too large for one
  call); validating against the account's limits in the client (a second reader of the override).
- Evidence: `tests/db/import-lists.test.mjs` on the local stack, 2026-09-30, this Windows host: run 1: 50x100 2428 ms, 1000x5 4559 ms, ratio 1.88, hosted estimate 4701 ms; run 2: 1463 ms, 2991 ms, 2.04, 5118 ms (both under 6000).
- Accepted trade-off: the hosted 8 s statement timeout bounds one import (about 9000 rows), and the export does
  not warn before it; one commit of 1000 lists sends 1000 Realtime messages, and a plan's quota may drop some (the
  owner's tabs then update on their next read (the tab shown again, or the poll once the topic is down)); reverting
  the app alone rolls back; narrowing the function is a second push (`.claude/README.md`, "Undo a deploy that carried a migration").
