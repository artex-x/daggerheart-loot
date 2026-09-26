# Shared task context - TASK persist-3-realtime

## Goal
Release R3: live updates on shared pages (and, if cheap, on the owner's
own account list across devices) through Supabase Realtime. Batch `B3.1`
in the roadmap; it may split.

Owner, 2026-09-25: Realtime does not replace polling. Realtime is the
primary path; polling (R2's 45 s poll and refetch on focus) stays as the
plan B whenever Realtime is not available - channel refused, not
connected, blocked by a network, errored, or a platform limit hit.

This session plans ahead while R2's last batch (`B2.3`, share links and
the poll) is still being built. Planning only, no production code.

## Sources (read, do not re-fetch)
- Roadmap `issues/persistent-storage/plan.md`: section 5 (architecture),
  section 9 (order: R2, R5, R3, R4), sections 12 and 14 (`B3.1`), section
  16 (decision 3 and any Realtime decision), section 17 (risk: Broadcast
  from the database with `realtime.send` and a `private: true` channel with
  a `realtime.messages` policy for `anon` are planned from documentation,
  not measured; the 45 s poll is the fallback).
- R2's task `issues/persist-2-lists/`: `context.md`, `plan.md` section 4.4
  and 11 (`B2.3`: share tokens, `topic_key` per share, the poll, the shared
  page), `reviews.md` (R3 "two devices" reorder refusal, R4 queue timeout -
  deferred to the Realtime release).
- B2.1 SQL: `supabase/migrations/20260925130100_lists.sql`,
  `20260925130200_list_shares.sql` (`topic_key`, `revision`).
- `docs/decisions/` (one file per decision).

## State (2026-09-25)
- `main` holds R2's task commit locally, not pushed; `B2.3` is being built
  in the same tree (share panel, `#/s/<token>`, the poll, `SharedView`).
  Rotate was dropped by the owner: a link is deleted, then a new one is
  created.
- R3 ships after R5 (deadline-driven), so this plan has time for a refresh
  once R2 closes.

## Constraints for this planning pass
- Write only inside `issues/persist-3-realtime/`. Do not edit the roadmap
  `plan.md`, `docs/decisions/`, `docs/DECISIONS.md`, specs or code. Draft
  decisions under `issues/persist-3-realtime/decisions-draft/` in the
  template's shape.
- Do not run the local Supabase stack or touch the test project or
  production. Reading files, git history and public Supabase documentation
  (web) only.
- Mark every step that depends on `B2.3`'s final code for a refresh after
  R2 closes.

Superseded for planning pass 1 by the orchestrator (2026-09-25): the
planner may also edit the roadmap's R3 rows and add decision files under
`docs/decisions/`; it did both (no `decisions-draft/` directory exists).

## Facts gathered in planning pass 1 (2026-09-25)
- Supabase documentation, read 2026-09-25, with URLs: `plan.md` section 4
  (quotas, `realtime.send` signature and its `private` default `true`,
  RLS on `realtime.messages`, policy caching, "Allow public access", the
  24-hour anon connection, two open platform reports).
- `tests/db/run.mjs` excludes `realtime` (and `kong`) today; the layer 3
  schema snapshots cover `public` only, so a policy on `realtime.messages`
  is invisible to the reversibility gate until `B3.1` extends it.
- `list_entries_touch` updates `lists` once per entry row: a row trigger
  on `lists` would broadcast N times for one reorder (`plan.md` 5.3).
- `B2.3` in the main tree (read 2026-09-25, uncommitted): `ShareRepository`
  on `CloudPort.shares`; `SharedView` in `app/src/state/sharedView.svelte.ts`;
  the 45 s interval also moves the clock `now`; rotate removed from the
  shares migration (revoke, then create).
- `@supabase/supabase-js` and `realtime-js` 2.117.1 are installed in the
  main tree; the worktree has no `node_modules`.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
