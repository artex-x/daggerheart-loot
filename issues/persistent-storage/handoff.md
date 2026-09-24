# Handoff - TASK persistent-storage
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (programme roadmap; R0 closed 2026-09-24, R1 next)
- Last agent: orchestrator
- NEEDS_HUMAN_CONFIRMATION: no (decisions 1-40 answered 2026-09-24, `plan.md` section 16)
- Branch: `claude/persistent-storage-plan-d74d73` (R0's branch; R1 starts from `main` after R0's push)
- Base / starting commit: `12557fe1`
- Pushed: see the R0 closeout summary in the session that closed it

## Completed
- Release R0 `persist-0-foundation` (batches `B0.1`, `B0.2`, each reviewed
  and remediated once): HTTP-only ES-module build, a registered service
  worker caching `img/`, `img/thumb/` and hashed `assets/` only, the
  no-backend and `file://` laws superseded, policy pages `privacy` and
  `terms`, the DPCGL notice folded in the footer, `supabase/` with
  `config.toml` as code and the `config:diff`/`config:push`/`db:push`
  wrappers, layer 3 `check:db`, the persistence-era guards, the CI `db`
  job, cloud-session tooling. Its task directory was retired in its commit;
  what R1 inherits is in `plan.md` section 17, "Carried from R0".
- Review: required and run for both R0 batches; findings closed or carried.
- closeout fix: config:diff forces JSON output

## Verification
- R0's gates are recorded in its commit message and closeout summary.

## Next batch (implement-ready)
- Name: R1 `persist-1-auth` - open `issues/persist-1-auth/` and run a
  planner refresh of `B1.1` (fake cloud and test build) to implement-ready.
  Roadmap: `plan.md` sections 5, 8, 12, 14 (R1 outlines), 15, 16
  (decisions 14-15, 20-23, 28-31, 39-40) and 17 ("Carried from R0").
- R1 includes the nightly backup workflow (decision 39) and the owner
  steps it needs (an `age` key pair; the production connection string as a
  secret).
- Before R1's first hosted write: owner closeout steps of R0 done (C1 prod
  diff clean, C2 test push, Google Branding links and Publish).

## Blockers
- None for R1's planning. Docker (Rancher, PowerShell only), gitleaks,
  the Actions variables and E2E secrets, the redirects and the contact
  address are in place (`context.md`). Cloud releases start at R1 only if
  the section 15 step 20 probe passes; otherwise R1 runs locally.

## Deferred
- The owner's R0 device checks (install prompt, no preload warning after
  the upgrade): `plan.md` section 17, "Carried from R0".
- Mockups for `B1.2`, `B1.4`, `B2.2`, `B2.3`, `B3.1`, `B4.2`, `B5.1`, `B6.1`,
  `B7.2`, `B8.1`, `B9.1` are produced by each batch's planner refresh
  (`plan.md` section 12, last paragraph).
- `B2.2` may split at `ListPage.svelte` after the refresh reads it.
- Ideas the owner set aside for after v1: `plan.md` section 17.

## Notes
- Mocks path: none this pass.
- Screenshot findings: none (no issue, no screenshots).
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section):
  `docs/DECISIONS.md`, the thirteen 2026-09-24 entries from "Running from
  a folder and offline use are nice-to-haves" to "The hosted E2E mints its
  session with the secret key, not a password".
