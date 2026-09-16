# Shared task context - TASK 59

## Goal
- Fix the failed GitHub Actions run at https://github.com/artex-x/daggerheart-loot/actions/runs/34852971236/job/104005270943 and prevent Pages deployment when the structural-golden gate fails.
- The human observed that the site deployed even though every golden shard failed and asked to adjust that behavior.

## GitHub issue / run
- URL: https://github.com/artex-x/daggerheart-loot/actions/runs/34852971236
- Captured: 2026-09-14 via one `gh run view` fetch plus one concise status query.
- Workflow: `check`, push to `main`, commit `7a66309785385ab888571bd16009da45f529c080`.
- Overall conclusion: failure.
- Job facts: `check`, `audit`, `secrets`, and all four `parity` shards passed; all four `golden` shards failed; `deploy` nevertheless passed.
- Deployment fact: `.github/workflows/ci.yml` currently declares `needs: [check, audit, secrets, parity]`, omitting `golden`.
- Golden evidence: the failures are structural snapshot mismatches after the task-59 frame-roll data change, including table/search rows whose displayed roll ordinals or ordering changed. Shard 4 alone reported 14 failed sections; the other three shards also concluded failure.
- Decisions already settled: deployment must not proceed when the golden matrix fails.

## Screenshot / attachment findings
- No screenshot is needed. The Actions job metadata and failed logs are available directly.

## Key paths
- Workflow: `.github/workflows/ci.yml`
- Golden runner: `tests/app/golden.js`
- Golden inventory/snapshots: `tests/app/inventory.js`, `tests/app/snapshots/`
- Prior task-59 implementation evidence: `issues/59/handoff.md`, commits `f450082`, `3144379`, `7a66309`
- Relevant spec: `docs/specs/COVERAGE.md`; `docs/parity.md` if golden regeneration affects visual-test procedure.
- Mocks: none expected.

## Command costs

| Command | Wall clock | Fits one foreground call? |
|---|---|---|
| `npm run check` | a few minutes | yes (600s cap) |
| `npm run check:built` | a few minutes | yes (600s cap) |
| `node tests/app/golden.js --update` | about 1000s unsharded in CI precedent | no |
| one `node tests/app/golden.js --shard=N/4` | about 90-105s in the cited CI run | yes |
| `node tests/run-all.js parity` | about 867s unsharded | no |

## Measuring the live app against the rewrite
- Not a parity investigation unless the planner finds unintended UI output. The current failure is against committed structural snapshots of `dist/`.

## Which machine is authoritative
- GitHub Actions is authoritative for the cited workflow/job conclusions.
- Local structural captures should be deterministic, but snapshot changes must be reviewed as intended output rather than accepted mechanically.

## Reasons already disproved
- The linked job `104005270943` (`check`) did not fail; it passed. The workflow is red because the four separate `golden` jobs failed.
- Deployment was not gated by all quality jobs: `golden` is absent from `deploy.needs`.
- The workflow did not cancel after a first golden failure because the matrix intentionally has `fail-fast: false`.

## Constraints
- Reopen the previously completed task state; do not treat the old terminal handoff as an active plan.
- Preserve unrelated untracked `.claude/settings.local.json` and `issues/tg-preview-refresh/`.
- One writer at a time. Re-read HEAD before and after writer dispatch.
- Use `rtk`; on this Windows host, set `CLAUDE_CONFIG_DIR` for git/gh commands and wrap PowerShell built-ins through `rtk powershell`.
- Do not run multiple golden shards or other heavy browser checks concurrently in this shared tree.
- Current branch/base at evidence capture: `main` at `7a66309785385ab888571bd16009da45f529c080`, matching `origin/main`.

## Do not re-fetch unless
- Human provides new information.
- A later run must be checked after a pushed fix.
- `context.md` is missing a fact needed for implementation.
