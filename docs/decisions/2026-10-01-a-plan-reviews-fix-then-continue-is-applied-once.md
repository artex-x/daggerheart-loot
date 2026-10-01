# 2026-10-01 - A plan review's fix-then-continue is applied once, with no second look

- Task: `plan-review-one-cycle` (owner's rule, 2026-10-01; mechanism by the planner, 2026-10-01).
- Decision: a plan review gets one remediation cycle. On `fix-then-continue` the planner applies
  every finding once and writes `- Plan review findings applied: reviews/plan-<batch>.md` in
  `plan.md` Status; the orchestrator checks that change against the report and dispatches the
  implementer. `replan` keeps a second look; after `fix-then-continue` a second look runs only on
  request. `.claude/hooks/agent-guard.mjs` reads the newest report: an approve, or a
  `fix-then-continue` that an applied line names, allows the implementer dispatch.
- Rejected: a second look after every verdict (a reviewer pass for line-sized fixes); the
  planner's word with no hook check (nothing checks at the dispatch); any approving report wins
  (a later `replan` of the same batch would pass); the applied line alone (a `replan` would pass).
- Accepted trade-off: nobody verifies that a fix was applied correctly; a bad fix surfaces as an
  implementer deviation and the batch review judges it. Evidence: on 2026-10-01 the `B7c.1`
  second look found a blocker that the first fix introduced (a failing contracts route crashed
  `tools/build.js`).
- Amends "A plan that changes schema, contracts, stored data or sync is reviewed first" (2026-09-27): a fix-then-continue report counts once the plan names it as applied.
