# 2026-10-29 - A run outside main replays the deploy's steps before its first secret

- Task: `deploy-replay-ci` (owner approved the job, 2026-10-28; planner,
  2026-10-29).
- Decision: `ci.yml`'s job `deploy-replay` runs on every run outside `main`
  and holds `deploy`'s steps before the first step that reads a secret, with
  no secret, environment or permissions block. Both jobs call one copy of
  the collect shell, `tools/collect-site.sh` (`collect`, `guard`,
  `old-host`); `tests/derived.js` keeps the step lists equal, and
  `REQUIRED_JOBS` in `.claude/hooks/ci-credit.mjs` requires the job.
- Rejected: a copy of the inline shell in the new job (about 120 duplicated
  lines); YAML anchors on the steps (`tests/derived.js` resolves no alias);
  the steps in `check` (its build is unconfigured); a run on `main` too,
  with `migrate-prod` waiting on it (`deploy` runs the same steps there); a
  cut after the mirror check (the budget and the `preview/` install also
  fail only on `main`).
- Accepted trade-off: an owner push straight to `main` gets no replay.
