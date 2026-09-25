# Handoff - TASK persistent-storage
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (programme roadmap; R0 closed 2026-09-24, R1
  closed 2026-09-25, R2 next)
- Last agent: implementer (R1 closeout, 2026-09-25)
- NEEDS_HUMAN_CONFIRMATION: no (decisions 1-41 answered, `plan.md` section 16)
- Branch: R1's `claude/compassionate-cannon-v13iq1`; the orchestrator
  squash-merges it onto `main`, and R2 starts from that `main`
- Base / starting commit: `12557fe1`
- Pushed: R1's closeout commit is on its branch; its sha is in the R1
  closeout summary

## Completed
- Release R0 `persist-0-foundation` (batches `B0.1`, `B0.2`, each reviewed
  and remediated once): HTTP-only ES-module build, a registered service
  worker caching `img/`, `img/thumb/` and hashed `assets/` only, the
  no-backend and `file://` laws superseded, policy pages `privacy` and
  `terms`, the DPCGL notice folded in the footer, `supabase/` with
  `config.toml` as code and the `config:diff`/`config:push`/`db:push`
  wrappers, layer 3 `check:db`, the persistence-era guards, the CI `db`
  job, cloud-session tooling.
- Release R1 `persist-1-auth` (batches `B1.1`-`B1.6`, reviewed; one commit
  per batch on its branch): the fake cloud and the test build, Google and
  Discord sign-in, `#/account` (linking, sign out everywhere, delete
  account), the hosted E2E and the CI `e2e` job, account preferences
  (`user_prefs`), CI migration deploys, the nightly encrypted backup, the
  rule 2n allowlist with agent writes to the test project. Its task
  directory was retired in its closeout commit; the release record is
  `plan.md` section 16, "R1 closeout record"; what R2 inherits is
  `plan.md` section 17, "Carried from R1".

## Verification
- R1: CI run 36131497583 (`57cf401`) green in every job; details in
  `plan.md` section 16, "R1 closeout record".

## Next batch (implement-ready)
- Name: R2 `persist-2-lists` - open `issues/persist-2-lists/` and run a
  planner refresh of `B2.1` (schema, RLS, RPCs, the six-role matrix, the
  seed gains lists and shares) to implement-ready. Roadmap: `plan.md`
  sections 5, 8, 12, 14 (R2 outlines), 16 (decisions 12, 19, 29-31 and
  the limits amendment in `context.md`) and 17 ("Carried from R1").
- Before R2's first migration merges: the R1 closeout record's pending
  owner and orchestrator items (merge, `migrate-prod`, dashboards, backup
  run, restore drill).

## Blockers
- None for R2's planning.

## Deferred
- The owner's R0 device checks (install prompt, no preload warning after
  the upgrade): `plan.md` section 17.
- Mockups for `B2.2`, `B2.3`, `B3.1`, `B4.2`, `B5.1`, `B6.1`, `B7.2`,
  `B8.1`, `B9.1` are produced by each batch's planner refresh (`plan.md`
  section 12, last paragraph).
- `B2.2` may split at `ListPage.svelte` after the refresh reads it.
- Ideas the owner set aside for after v1: `plan.md` section 17.

## Notes
- Mocks path: none this pass.
- Screenshot findings: none (no issue, no screenshots).
- Cleanup performed / retained artifacts: R1 closeout compacted `plan.md`
  sections 9, 12, 14, 15, 16, 17 and 18; the pre-compaction text is `git
  show 57cf401:issues/persistent-storage/plan.md`.
- Session end partial progress (if any): none.
