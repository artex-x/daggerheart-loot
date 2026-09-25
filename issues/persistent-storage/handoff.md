# Handoff - TASK persistent-storage
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (programme roadmap; R0 closed 2026-09-24, R1
  closed 2026-09-25, R2 closed 2026-09-26, R5 next)
- Last agent: implementer (R2 closeout, 2026-09-26)
- NEEDS_HUMAN_CONFIRMATION: no (decisions 1-41 answered, `plan.md` section 16)
- Branch: `main`; R2's one commit is local until the owner approves its push
- Base / starting commit: `cd1b3b15` (R2's base)
- Pushed: R2 not yet; the pushed sha goes into the R2 closeout summary

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
- Release R2 `persist-2-lists` (batches `B2.0`-`B2.3`, one local commit on
  `main`): the test-migration fix and the `production` Environment, the
  lists schema with count limits and share links, account lists in the
  app, share links `#/s/<token>` and "Save a copy". Its task directory was
  retired in its closeout commit. Record: `plan.md` section 16, "R2
  closeout record"; what R5 and R3 inherit: `plan.md` section 17,
  "Carried from R2".

## Verification
- R2: the gates of its closeout amend are in the R2 closeout summary; the
  gates before it are in `plan.md` section 16, "R2 closeout record".

## Next batch (implement-ready)
- Owner: approve and push R2's commit, then Environment steps 3-4 and the
  post-push checks (`plan.md` section 16, "R2 closeout record", Pending).
- Orchestrator: integrate the plans made ahead onto `main`
  (`context.md`, "Plans made ahead, 2026-09-25"), then R5
  `persist-5-migration`: a planner refresh of `B5.1` against R2 as shipped
  and "Carried from R2".

## Blockers
- R2's push waits on the owner's approval.

## Deferred
- The owner's R0 device checks (install prompt, no preload warning after
  the upgrade): `plan.md` section 17.
- Mockups for `B3.1`, `B4.2`, `B5.1`, `B6.1`, `B7.2`, `B8.1`, `B9.1` are
  produced by each batch's planner refresh (`plan.md` section 12, last
  paragraph).
- Ideas the owner set aside for after v1: `plan.md` section 17.

## Notes
- Mocks path: none this pass.
- Screenshot findings: none (no issue, no screenshots).
- Cleanup performed / retained artifacts: R2 closeout compacted `plan.md`
  sections 5, 9, 10, 12, 14, 16 and 17; the last pushed pre-compaction
  commit of this directory is `ad80634d` (R2's own earlier amends were
  never pushed).
- Session end partial progress (if any): none.
