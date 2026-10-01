# Handoff - TASK persist-7g-read-scale
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: blocked (planned; the plan review's fix-then-continue is
  applied; waits for R7e and R7f to close)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no (the owner answered Q1 = C, 1048576 bytes,
  and Q2 = drop F6, on 2026-10-01; `plan.md` section 7)
- Branch: main (no commit yet; R7g starts after R7f's closeout)
- Base / starting commit: `bb37a572` at planning; the dispatch refresh
  re-reads `HEAD`
- Pushed: no

## Completed
- Batch name/id: none (planning, 2026-10-01).
- What shipped: `context.md`, `plan.md`, `handoff.md`.
- Files changed: `issues/persist-7g-read-scale/` only.
- Previous sha (batch diff base): -
- Deviations and rationale: the scope follows the owner's inputs of
  2026-10-01 (design target 3x defaults; Q1 = C; Q2 = drop F6); the
  decision files are written by `B7g.1`, not now, because R7c's implementer
  may rebuild `docs/DECISIONS.md` meanwhile.
- Review: required (trigger: a migration with an anon-executable function
  overload, a SECURITY DEFINER trigger function and a new limit; a sync
  protocol change), report issues/persist-7g-read-scale/reviews/plan-B7g.1.md
  (fix-then-continue, applied once: `plan.md` Status; register
  `reviews.md`)

## Verification
- Commands run (exact): none (planning only; no build, check or browser run).
- Results: -
- Gates: -

## Next batch (implement-ready)
- Name: `B7g.1` - revision-keyed reads, paged requests, `p_since`, the byte
  limit (`plan.md` section 6 is the authority).
- Objective: a re-read of the account fetches only lists whose revision
  moved; every pending request is read past 1000; a shared page's re-read
  of an unchanged list answers `unchanged`; a list's frozen copies hold at
  most 1048576 bytes together (`snapshot_bytes_per_list`, overridable).
- In scope: `plan.md` section 6, "Files".
- Out of scope: `ListPage.svelte`, the write buffer, `apply_list_writes`,
  F6, homebrew reads, the first read's size, D74.
- Files expected: the migration and its reversal; `tests/db/{list-shares,harness,homebrew,limits,lists}.test.mjs`;
  `app/src/ports/{types,supabase,lazy-cloud,fake-cloud,cloud.contract}.ts`
  and tests; `app/src/state/{cloudLists,sharedView}.svelte.ts` and tests;
  `app/src/lib/{cloudLists,dict}.ts` and `lib/cloudLists.test.ts`;
  `tests/e2e/contract.mjs`; `docs/specs/{FEATURES,META,COVERAGE,DEBT}.md`,
  `.claude/README.md`, `docs/decisions/` and `docs/DECISIONS.md`.
- Steps: `plan.md` section 6, steps 1-13 (step 1 is the dispatch refresh
  against section 8; step 13 records the count of lists past the limit).
- Acceptance criteria: `plan.md` section 6, "Acceptance criteria", and each
  row of its States and Error tables.
- Verification commands:
  ```text
  rtk npm run check
  npm run check:built
  node tests/run-all.js app/states
  npm run check:db                       (PowerShell tool; last)
  -- after the batch review approves, in this order:
  npm run db:push -- --project test --yes
  npm run e2e
  ```
- Risks / do-nots: `plan.md` section 6, "Risks and do-nots" (keep
  `get_shared_list(text)`; no default on `p_since`; a fresh query builder
  per page; keep R7f's limit reads).
- Fallback (optional): the `get_lists(p_known)` RPC in place of the
  two-step read, if the plan review rejects it (`plan.md` section 4.1).

## Blockers
- R7e and R7f must close first (owner's order); then the dispatch refresh
  (`plan.md` section 8).

## Deferred
- D74 (written by `B7g.1` under the next free D number at dispatch): the
  shared page's after-commit re-read.
- Plan review N6 (pre-existing, not needed for `B7g.1`): `CloudLists.#pull`
  has no guard against an older read that answers after a newer one; its
  changed rows replace newer objects until the next read. Cheap guard: skip
  a changed row whose `revision` is below `#read[id].rev`. Owner: a later
  release or `debt-cleanup`; at closeout it is named to the owner.
- F6: dropped by the owner (Q2); no batch and no `DEBT.md` entry.
- For `persist-review`'s scale re-run (owner, 2026-10-01): the owner's
  pending-requests read is re-sent whole after every new request (an
  owner-topic `request` message) and on the 300 s safety re-read - up to
  about 4 MB at the defaults (500 requests of up to 100 lines, est) and up
  to 4500 requests of 300 lines at 3x; a link holder can send 5 requests a
  minute per link. R7g's closeout passes this line to `persist-review`.
- Not placed (owner): F11 homebrew read size, F13 the `57014` handling.

## Notes
- Mocks path: none (the only drawn change is one toast text).
- Screenshot findings: none (no issue screenshots; the report is text).
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none
  yet; `B7g.1` writes the decisions D1-D3 (`plan.md` section 9), D74, the
  specs and the runbook paragraph.
