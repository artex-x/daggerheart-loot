# Shared task context - TASK persist-3-realtime

## Goal
Release R3: live updates on shared pages and on the owner's own account
lists across devices (owner Q1, 2026-09-26: yes) through Supabase
Realtime. Batches `B3.1` (database) and `B3.2` (client).

Owner, 2026-09-25: Realtime does not replace polling. Realtime is the
primary path; polling (the 45 s poll and refetch on focus) stays as the
plan B whenever Realtime is not available - channel refused, not
connected, blocked by a network, errored, or a platform limit hit.

## Sources (read, do not re-fetch)
- Roadmap `issues/persistent-storage/plan.md`: section 5 (architecture),
  section 9 (order), sections 12 and 14 (`B3.1`, `B3.2`, R11's placed
  usage line), section 16 (decision 3), section 17 ("Carried from R5":
  the write buffer notes for R3; "Carried from process-guards": the plan
  review line and the push after approval).
- `docs/specs/DEBT.md` "Live updates": D56, D57, D59 (this release pays
  them); "Slimmer account client": D60 (reworded by `B3.2`).
- SQL: `supabase/migrations/20260925130100_lists.sql`,
  `20260925130200_list_shares.sql` (`topic_key`, `revision`),
  `20260925130600_list_writes.sql` (`apply_list_writes`).
- `docs/decisions/` (one file per decision; the two R3 files of
  2026-09-25 and R4's "Request events nudge the owner and share topics").

## State (2026-09-27)
- `origin/main` is `f6079277` (R11). R2, R5, R5b, `process-guards` and
  R11 are shipped. `display-settings` (`B1`) is in flight on `main` and
  edits `app.svelte.ts`'s preference members, `PrintPage.svelte`,
  `TablesPage.svelte`, `AccountPage.svelte`, `dict.ts`, a new
  `KeepNote.svelte` (plan section 15).
- Release slot: after `display-settings`, before R4.
- Planning pass 2 (2026-09-27) refreshed the plan against `f6079277`;
  `B3.1` is implement-ready and needs a plan review first.

## Facts gathered in planning pass 1 (2026-09-25)
- Supabase documentation, read 2026-09-25, with URLs: `plan.md` section 4
  (quotas, `realtime.send` signature and its `private` default `true`,
  RLS on `realtime.messages`, policy caching, "Allow public access", the
  24-hour anon connection, two open platform reports).
- `list_entries_touch` updates `lists` once per entry row: a row trigger
  on `lists` would broadcast N times for one reorder (`plan.md` 5.3).
- `@supabase/supabase-js` and `realtime-js` 2.117.1 are installed.

## Facts gathered in planning pass 2 (2026-09-27, at `f6079277`)
- The local stack's service list is `LOCAL_STACK_EXCLUDES` in
  `tools/supabase/lib.mjs`, shared by `tests/db/run.mjs` and the restore
  drill (`ensureStackWithAuth` in `tools/supabase/restore.mjs` drops only
  `gotrue` from it). `runningContainer(name)` is in `restore.mjs`.
- Every owner write goes through `apply_list_writes` (`security invoker`,
  one subtransaction per write, at most 200 writes); its `reorder` op
  calls `public.reorder_list(uuid, uuid[])` by name.
- `cloud.contract.ts` case G asserts a reorder that misses an entry is
  `refused`; the fake's `reorder` refuses the same way. Both run in
  `B3.1`'s gates (the contract in layer 4 after the push), so the
  tolerant reorder moves the fake and the contract into `B3.1`.
- `tests/db/roles.mjs` `asRole` always rolls back, so a deferred trigger
  never fires inside it.
- `check:db` took 403-517 s on this host before Realtime (2026-09-26/27);
  `npm run check` 400-600 s.
- The usage report's `collect()` is in `tools/supabase/usage.mjs`; the
  info rows are `INFO` in `usage-lib.mjs`.
- Backups dump `auth` and `public` rows only; `realtime.messages` rows
  are not backed up.
- `SharedListPage.svelte` has no status region.
- The plan-review line is parsed by `.claude/hooks/agent-guard.mjs`: the
  batch name after "required before" is plain text, no backticks.

## Settled after the plan review (2026-09-27)
- Owner, 2026-09-27 (review B1): a precursor commit `B3.0` on `main`,
  pushed alone before `B3.1`'s test push, makes `cloud.contract.ts` case
  G pass under the old and the tolerant `reorder_list` (the test project
  is shared; `migrate-prod` and `deploy` need `e2e`). The freeze was
  rejected.
- A session that set `request.headers` in an earlier transaction reads
  `''` after it; `''::jsonb` raises `22P02` (review B2).
- The reset sites are `resetLocal()` in `tests/db/roles.mjs`, the reset
  in `tests/db/run.mjs`, and `resetLocal()` in `tools/supabase/restore.mjs`
  (used by both restore tests and both restore scripts). CI's `db` job
  has `timeout-minutes: 20`.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
