# Handoff - TASK persist-8-media
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: blocked - planned, refreshed 2026-10-07, plan review
  findings and the owner's answers applied the same day; waits for R7h and
  R9 to close and the owner's step 1 (`plan.md` 9.2)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q8-9 = A (the database
  deletes picture files; no Edge Function; reverses Q8-1 B) and Q8-10 = a
  (a weekly full copy, 8 downloads at a time, a manual run any night) on
  2026-10-07 (`plan.md` 9.0). R9's Q9-8 = B: `B8.1` builds on R9's
  `get_homebrew_item` body (`plan.md` 2.4).
- Branch: `claude/r7h-homebrew-replan-275175` (planning only; no code; an
  R7h implementer works in the same worktree)
- Base / starting commit: `ac23ce36` plus R7h `B7h.1`'s and R9's uncommitted
  files
- Pushed: no

## Completed
- Batch name/id: planning pass 2 (2026-10-07, mode B with a design
  correction) against R7h's plan at `ac23ce36` and R9's refresh of
  2026-10-07.
- What shipped: `plan.md` (rewritten: sections 2, 3.1, 3.3, 3.6, 7.3 new or
  changed), `context.md`, `mocks/index.html`, new mocks m46-m48. No
  production code.
- Files changed: `issues/persist-8-media/**` only.
- Previous sha (batch diff base): not applicable (no task commit yet).
- Deviations and rationale:
  - The browser no longer deletes files; the database does (the lifecycle
    law of R7h `B7h.1`). The Edge Function `delete-account` is not built
    (Q8-9 A, owner 2026-10-07).
  - Picture names are `p/<32 hex>.<ext>` and `t/<32 hex>.<ext>`, random,
    with no account id: R7h's read functions never answer an `owner_id`,
    and a content hash in one namespace allows pre-upload poisoning.
  - `img` travels beside the item in the three read functions, not inside
    the projection a previous bundle validates.
  - The backup reads the public addresses: no secret key for it.
  - The seed and every golden move from `B8.1` to `B8.2` (R7h's
    plan-B7h.1-23 rule: the seed changes with its goldens).
  - R9's Q9-8 = B (owner); Q9-6, Q9-7, Q9-9 and Q9-10 are assumed at their recommended answers
    (`plan.md` 2.4 names the effect of every other answer).
- Review: required (trigger: a migration with a storage bucket, a policy and
  SECURITY DEFINER functions; possible loss of stored data - the database
  deletes files, and the reversal drops `homebrew_items.art`; a new write
  protocol - an upload before the row write); plan review before `B8.1`,
  report `issues/persist-8-media/reviews/plan-B8.1.md` (fix-then-continue),
  every finding applied once (`plan.md` Status; register `reviews.md`); no
  second look.
- Batch name/id (follow-up): the plan review's remediation (2026-10-07):
  plan-B8.1-1 to -19 applied; -2 with the recommended fix (a lock per name
  and `homebrew_art_released`); -3 as owner question Q8-10.

## Verification
- Commands run (exact): `npx prettier --check issues/persist-8-media`; the
  mock generator (planner's scratchpad, `gen-r8-mocks.mjs`) for m46-m48.
- Results: "All matched files use Prettier code style!" - pass 1 after
  `prettier --write` of the four new mock files; the remediation pass after
  `prettier --write` of m48 (its privacy paragraph changed).
- Gates: none (planning).

## Next batch (implement-ready)
- Name: `B8.1` - storage, schema, the database's file deletion, ports,
  backup (`plan.md` 7.3), after R9's closeout and the owner's step 1 (the
  four hosted reads before the start, the Vault secrets before the test
  push). Q8-9 = A and Q8-10 = a are answered.
- Objective: the bucket and its insert policy with the room, `homebrew_items.art`
  with its owner check, the lock per name and `homebrew_art_released`, the
  two picture triggers and `art_delete` (which never refuses a write)
  through `pg_net` and Vault, the files block of `lifecycle_cleanup()`,
  `img` beside the item in `get_homebrew_item`, `get_homebrew_items` and
  `get_shared_list`, the usage watch, the homebrew port's `uploadArt` and
  `copyArt`, the fake, contract case Q, layer 3, the weekly backup copy.
- In scope: `plan.md` 3.1-3.4, 3.6, 3.8's backup, 3.9, the decision file.
- Out of scope: every screen and string, `MediaPort`, `Env.media` and
  `cropRect`, the seed and the goldens, the export change, privacy text
  (`B8.2`).
- Files expected: `plan.md` 7.3, "Files".
- Steps: `plan.md` 7.3, steps 0-12.
- Acceptance criteria: `plan.md` 7.3, "Acceptance", with the four standing
  checks.
- Verification commands: step 1's probe, `npm run check:db` (PowerShell
  tool), `rtk npm run check` (timeout 600000), `npm run build:test`, `npm
  run check:built`; after the approve and the owner's step 1 `npm run
  db:push -- --project test`, `npm run e2e`.
- Risks / do-nots: `plan.md` 7.3, "Do not"; section 10.
- Fallback (optional): if step 1 finds `pg_net` or Vault unusable locally,
  `postgres` without `rolbypassrls`, or a foreign key from
  `storage.objects` to `auth.users`, stop: the planner revisits Q8-9.

## Blockers
- R7h (`B7h.3` writes the three read functions and `lifecycle_cleanup()`'s
  B7h.3 body that `B8.1` extends) and R9 close first (owner's order).
- Owner step 1 (`plan.md` 9.2): the four read-only answers on the test
  project (`pg_net` installed and its version, the available version,
  `rolbypassrls`, the foreign keys on `storage.objects`) before `B8.1`
  starts; the test project's secret key and the two Vault secrets before
  its test push and E2E. Step 2 (production, the same reads) before the
  release push; steps 3-5 as listed.

## Deferred
- Pictures for sources and cards; pictures in the data zip; a WebP encoder
  for Safari (`plan.md` section 10).

## Notes
- Mocks path: `issues/persist-8-media/mocks/index.html` (current: m40-m42,
  m46-m48; m43-m45 superseded, kept for Q8-9 B).
- Screenshot findings: none (no issue screenshots).
- Cleanup performed / retained artifacts: the mock generator lives in the
  planner's scratchpad, not in the repository.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none;
  `B8.1` writes the decision file, `META.md` 3 and `.claude/README.md`.
