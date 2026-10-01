# 2026-09-27 - A plan that changes schema, contracts, stored data or sync is reviewed first

- Amended by "A plan review's fix-then-continue is applied once, with no second look" (2026-10-01): a fix-then-continue report counts once the plan names it as applied.
- Task: `process-guards` (owner's rule, 2026-09-26; mechanism by the planner, 2026-09-27).
- Decision: a plan that adds a migration or a SECURITY DEFINER function,
  changes a public contract, can lose stored data, or adds a write or sync
  protocol gets a reviewer's approve before its first implement batch.
  The planner writes `- Plan review: required before <batch> (trigger:
  ...)` or `- Plan review: not required (no trigger fired)` in `plan.md`;
  `.claude/hooks/agent-guard.mjs` denies an implementer dispatch while the
  line is missing, or while a required review has no approving report.
- Rejected: prose only (held by hand through R5; nothing checks at the
  dispatch); a review of every plan (a UI-only plan pays for nothing); the
  planner's own check (no second reader).
