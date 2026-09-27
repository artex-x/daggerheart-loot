# Handoff - TASK persist-usage-monitoring
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned, not started; dispatch after `process-guards` `B2`
  lands and the plan review approves
- Last agent: planner (refresh, pass 2, 2026-09-27)
- NEEDS_HUMAN_CONFIRMATION: no - Q1-Q3 answered as recommended on
  2026-09-26 (`plan.md`, section 10); the Log Query look adds an owner
  check after the first run (`plan.md`, section 9, step 7), not a question
- Branch: refreshed on `worktree-agent-a739573d9a05f0ce9`, for a
  cherry-pick onto `main`; the release itself is a local release on `main`
- Base / starting commit: `d343cc95` (`process-guards` `B1`, local)
- Pushed: no

## Completed
- Batch name/id: planning pass 2 (mode B refresh), 2026-09-27.
- What shipped: `plan.md` rebased on `d343cc95` - Status with the `Plan
  review: required before B11.1` line; section 3 re-read (ten migrations,
  six `public` tables, three workflows, `derived.js` by function name,
  the `check:db` stack's excluded services); 4.2 (MAU and Storage sources
  detected, `near_limits` above 100 %, every table listed); 4.3 rewritten
  as the reviewer's schema statement (grants incl. `service_role`, RLS,
  writer, readers, what can be lost); 4.10 (the secret pin over every
  workflow); section 6 (secrets paragraph, Security Advisor 3 info);
  section 7 (2026-09-27 costs, rules 1 and 6 order); `B11.1` steps 11-16
  and acceptance reordered for rule 6; section 9 steps 7-8; section 12
  (the Log Query answer); section 13 (refresh log). `context.md`: the
  `get_shared_list` fact closed, Logs Query and the local-stack probe
  added.
- Files changed: `issues/persist-usage-monitoring/{context,plan,handoff}.md`.
- Previous sha (batch diff base): `d343cc95`
- Deviations and rationale: the migration stamp is the current UTC
  minute, not "the next free minute" (it must also sort after another
  branch's version on the test project, or `db push` refuses);
  `service_role` joins the revoke (the local stack leaves it three
  privileges on a new table). No decision file changed.
- Review: not required for the refresh itself; the plan review before
  `B11.1` is required (`plan.md`, Status).

## Verification
- Commands run (exact): `git merge --ff-only d343cc95` (the worktree was
  created at `d0acbe13`); a read-only `psql` probe of the local stack
  (`to_regclass` and `information_schema.columns`, no lock held, no
  write).
- Results: fast-forward clean; probe facts in `context.md`.
- Gates: planning only; no `npm run check` (no code changed).

## Next batch (implement-ready)
- Name: `B11.1` - free-plan usage report.
- Objective, scope, files, steps, acceptance, verification, risks:
  `plan.md`, section 8 (the authority; not repeated here).
- Out of scope: Realtime rows (R3), egress bytes estimate, app changes.
- Verification commands: `node tests/derived.js`; `rtk npm run check`
  (Bash timeout 600000); `npm run check:db` (PowerShell, timeout
  600000); after the batch review's approve only: `node
  --env-file=.env.test.local tools/supabase/db-push.mjs --project test
  --yes`, `npm run e2e`, `node --env-file=.env.test.local
  tools/supabase/usage.mjs --project test`.
- Fallback: none (Q3 answered; the token can be removed later with no
  code change).

## Blockers
- `process-guards` `B2` lands first (roadmap order; it adds rules 1 and 6).
- The plan review `reviews/plan-B11.1.md` must read `Verdict: approve`.

## Deferred
- Egress bytes estimate from `analytics/endpoints/logs` (unverified log
  schema; needs "Logs: Read"; counts against Log Query).
- Storage GB-hours (the quota is time-weighted; the report reads the
  current size).
- The Log Query spike of 2026-09-25/26: no repository tool reads logs;
  the owner reads the per-day figures on the organization's usage page
  (`plan.md`, section 12). At closeout, name it to the owner and drop it.

## Notes
- Mocks path: none (no UI).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none;
  the platform facts go to `.claude/README.md` "Usage monitoring" in
  `B11.1` and live in `context.md` until then.
