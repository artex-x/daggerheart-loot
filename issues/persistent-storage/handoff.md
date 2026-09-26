# Handoff - TASK persistent-storage
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (programme roadmap; R0 closed 2026-09-24, R1
  closed 2026-09-25, R2 and R5 closed 2026-09-26, R5b next)
- Last agent: implementer (2026-09-26: R5's closeout)
- NEEDS_HUMAN_CONFIRMATION: no (decisions 1-41 answered, `plan.md` section 16)
- Branch: `main`
- Base / starting commit: `a7169532` (the restore drill on top of R2 and
  the plans made ahead)
- Pushed: R5 yes (2026-09-26; the sha is in `plan.md` section 16, "R5
  closeout record")

## Completed
- Release R0 `persist-0-foundation` (batches `B0.1`, `B0.2`, each reviewed
  and remediated once): HTTP-only ES-module build, a registered service
  worker caching `img/`, `img/thumb/` and hashed `assets/` only, the
  no-backend and `file://` laws superseded, policy pages `privacy` and
  `terms`, the DPCGL notice folded in the footer, `supabase/` with
  `config.toml` as code and the `config:diff`/`config:push`/`db:push`
  wrappers, layer 3 `check:db`, the persistence-era guards, the CI `db`
  job, cloud-session tooling.
- Release R1 `persist-1-auth` (batches `B1.1`-`B1.6`): the fake cloud and
  the test build, Google and Discord sign-in, `#/account`, the hosted E2E
  and the CI `e2e` job, account preferences, CI migration deploys, the
  nightly encrypted backup. Record: `plan.md` section 16, "R1 closeout
  record".
- Release R2 `persist-2-lists` (batches `B2.0`-`B2.3`, live 2026-09-26): the test-migration fix and the `production` Environment, the
  lists schema with count limits and share links, account lists in the
  app, share links `#/s/<token>` and "Save a copy". Its task directory was
  retired in its closeout commit. Record: `plan.md` section 16, "R2
  closeout record"; what R5 and R3 inherit: `plan.md` section 17,
  "Carried from R2".
- Release R5 `persist-5-migration` (batches `B5.1`, `B5.2a`-`B5.2d`,
  closed 2026-09-26): the automatic move of browser lists into the
  account, the cutoff, the retired `#/l/` page, the account write buffer
  with `apply_list_writes`. Its task directory was retired in its closeout
  commit. Record: `plan.md` section 16, "R5 closeout record"; what later
  releases inherit: `plan.md` section 17, "Carried from R5".

## Verification
- R5: the gates of its closeout amend are in the R5 closeout summary; the
  gates before it are in `plan.md` section 16, "R5 closeout record".
- Plans made ahead: R5b, R11, R3, R4, R6 and R7 are on `main` under
  `issues/<task id>/` with their decision files; every owner question in
  them is answered.

## Next batch (implement-ready)
- Orchestrator: R5b `persist-5b-account-menu` - the planner's section 9
  refresh of its `plan.md` against R5 as shipped, then `B5b.1`. After R5b:
  the plan-review process task (`plan.md` section 9; its planner creates
  its directory).

## Blockers
- None.

## Deferred
- The owner's R0 device checks (install prompt, no preload warning after
  the upgrade): `plan.md` section 17.
- Mockups for `B8.1` and `B9.1` are produced by each batch's planner
  refresh (`plan.md` section 12, last paragraph); R4, R5, R6 and R7 carry
  theirs under `issues/<task id>/mocks/`.
- Ideas the owner set aside for after v1: `plan.md` section 17.

## Notes
- Mocks path: none this pass.
- Screenshot findings: none (no issue, no screenshots).
- Cleanup performed / retained artifacts: R5 closeout compacted `plan.md`
  sections 9, 12, 14 and 17; the last pushed pre-compaction commit of this
  directory is `a7169532` (R5's own earlier amends were never pushed).
- Session end partial progress (if any): none.
