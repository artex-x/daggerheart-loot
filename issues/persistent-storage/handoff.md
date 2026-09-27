# Handoff - TASK persistent-storage
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (programme roadmap; R0 closed 2026-09-24, R1
  closed 2026-09-25, R2 and R5 closed 2026-09-26, R5b, the process task
  `process-guards` and R11 closed 2026-09-27; R3 next)
- Last agent: implementer (2026-09-27: the R11 closeout)
- NEEDS_HUMAN_CONFIRMATION: no (decisions 1-41 answered, `plan.md` section 16)
- Branch: `main`
- Base / starting commit: `d679d285` (R5 live)
- Pushed: R5 yes (2026-09-26; the sha is in `plan.md` section 16, "R5
  closeout record"); R5b yes (`d0acbe13`, "R5b closeout record");
  `process-guards` yes (`0559e62c` on `origin/main` holds it); R11 at its
  closeout push

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
- Release R5b `persist-5b-account-menu` (batch `B5b.1`, one review fix
  cycle, closed 2026-09-27): the account menu, the Display section of
  `#/account`, nine tabs from the cutoff, the signed-out move banner. Its
  task directory was retired in its closeout commit. Record: `plan.md`
  section 16, "R5b closeout record"; what later releases inherit:
  `plan.md` section 17, "Carried from R5b".
- Release R11 `persist-usage-monitoring` (batch `B11.1`, one review fix
  cycle, closed 2026-09-27): the nightly `usage.yml` report with its
  forecast, thresholds, `usage_snapshots` history and keep-alive call. Its
  task directory was retired in its closeout commit. Record: `plan.md`
  section 9's R11 row; what later releases and the owner inherit:
  `plan.md` section 17, "Carried from R11".

## Verification
- R5b: the gates of its closeout amend are in the R5b closeout summary;
  the gates before it are in `plan.md` section 16, "R5b closeout record".
- Plans made ahead: R3, R4, R6 and R7 are on `main` under
  `issues/<task id>/` with their decision files; every owner question in
  them is answered. `process-guards` closed 2026-09-27 (Q1 answered A,
  gate credit); its record is `plan.md` section 9's row and section 12.
- R11: the gates of its closeout amend are in the R11 closeout summary.

## Next batch (implement-ready)
- R3 (`persist-3-realtime`): its planner refresh, with a `Plan review:`
  line, then the plan review before `B3.1` (`plan.md` section 17,
  "Carried from `process-guards`"); `B3.1` also carries R11's usage-report
  acceptance line (`plan.md` section 14).

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
- Cleanup performed / retained artifacts: R5b closeout compacted `plan.md`
  sections 9, 12, 14 and 17 for R5b; the last pushed pre-compaction commit
  of this directory is `d679d285`.
- Session end partial progress (if any): none.
