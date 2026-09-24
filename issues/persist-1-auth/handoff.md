# Handoff - TASK persist-1-auth
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (planned; `B1.1` implement-ready, not started)
- Last agent: orchestrator (recorded the answers; committed and pushed the plan)
- NEEDS_HUMAN_CONFIRMATION: no - the human confirmed `plan.md` section 4
  A, B and C as proposed (2026-09-24). Durable text is placed in `B1.1`'s
  acceptance lines.
- Branch: `claude/jolly-allen-ipojqp` (cloud session; the release branch)
- Base / starting commit: `76497c4` (`main`)
- Pushed: the planning commit (under question A); see `git log`

## Completed
- Batch name/id: none (planning pass 1)
- What shipped: `plan.md`, this file, a refresh of `context.md`
- Files changed: `issues/persist-1-auth/plan.md`, `handoff.md`, `context.md`
- Previous sha (batch diff base): `76497c4`
- Deviations and rationale: `CloudPort` is `{ auth }` in R1 and grows per
  release (the roadmap names six members; `CLAUDE.md` forbids an export
  before its use; the roadmap already grows the seed per release). The
  types live in `ports/types.ts`, not a new `cloud.ts`. R1 gains a fifth
  batch `B1.5` for roadmap decisions 39 and 41. All in `plan.md` section 3.
- Review: not applicable (planning)

## Verification
- Commands run (exact): none (no code written; gate timings are
  `context.md`'s from session 2 of 2026-09-24)
- Results: -
- Gates: -

## Next batch (implement-ready)
- Name: `B1.1` - fake cloud and test build (layer 2)
- Objective: `dist-test/` built by `vite build --mode test` with an
  in-memory `CloudPort` fake seeded with `gm1` and `gm2`, selected by
  `?as=<user>`; every `tests/app/` suite drives it; `dist/` provably free of
  the fake; `COVERAGE.md` four-layer table; README cloud facts.
- In scope: `plan.md` section 6 (files, steps 0-21, acceptance).
- Out of scope: any reader of `env.cloud` (UI, `AppState`), `@supabase/*`,
  migrations, new golden states, the roadmap's text.
- Files expected: `plan.md` section 6, "Files".
- Steps: `plan.md` section 6, steps 0-21, in order; step 0 is the
  `e1d7a4b` cherry-pick (question B, confirmed).
- Acceptance criteria: `plan.md` section 6, "Acceptance criteria" (ten
  lines; the four golden shards must report "unchanged").
- Verification commands, one foreground call each: `rtk npm run check`
  (timeout 600000); `npm run check:built`; `node tests/run-all.js
  app/print,app/contracts,app/states,app/typo,app/hues,stub`; `node
  tests/app/golden.js --shard=1/4` .. `--shard=4/4`. Record each wall clock
  in this file's Verification and in `context.md`'s cost table.
- Risks / do-nots: `plan.md` section 6, "Do-nots" and "Risks".
- Fallback (optional): a second Rollup entry for the test build if the
  dynamic-import branch survives in `dist/` (`plan.md` section 6).
- Review: required (harness every later golden trusts; `edit-guard.mjs`
  and `selftest.mjs`; `ci.yml`).
- Estimated gate cost: ~19 min on this host (`check` x2 222 s, filter
  group ~290 s, goldens ~600 s, `check:built` re-measured).

## Blockers
- None. The human opens a new cloud session with the `E2E_*` environment
  variables set; that session dispatches `B1.1`.

## Deferred
- To `B1.2`: the fake's `linkError` option; `AppState.user`.
- To closeout: roadmap compaction (section 15 step 20, section 18 conflict
  3 and verdict table, decision 25); `docs/DECISIONS.md` entries for A-C once
  confirmed; removal of the `E2E_USER_PASSWORD` secret after `B1.3`.
- Carried from R0 and placed: `plan.md` section 9.

## Notes
- Mocks path: none (`B1.1` has no UI; `B1.2` and `B1.4` produce theirs).
- Screenshot findings: none (no issue, no screenshots).
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none;
  `plan.md` section 4 lists the proposals and their intended homes
  (`CLAUDE.md` "Source and commit conventions"; `.claude/README.md` "Cloud
  sessions"; `docs/DECISIONS.md` 2026-09-24 cloud and E2E entries).
