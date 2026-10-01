# 2026-10-01 - Plans and reviews run four standing checks without the owner asking

- Amended by "Scale is designed for three times the default limits; nothing past that" (2026-10-01): the scale check stops at 3x the default.
- Task: `quality-checklists` (owner's rule, 2026-10-01; checklist by the planner, 2026-10-01).
- Decision: every plan, plan review and batch review answers four checks per batch, or says why
  one does not apply: scale (empty to an override value, 360 px and 1180 px), error scenarios
  (failed read or write, offline, conflict, deleted record, stale tab, revert), consistency
  (`docs/specs/FEATURES.md`, "Consistency rules", and the sibling pages) and RU/EN parity. Text:
  `.claude/prompts/plan.prompt.md`, "Standing checks"; `review.prompt.md`, section I.
- Rejected: the owner asks per task (each ask found what the plan missed); a hook that denies a
  report without the section (no omission seen yet; the orchestrator returns it); new UI as a
  plan-review trigger (every feature plan pays a review; the batch review covers new UI); a
  separate checklist file (one more file to read).
- Evidence: on 2026-10-01 the passes the owner asked for found 15 consistency mismatches and 7 scale
  fixes; a plan review's data-loss check found unasked that an app-only revert drops relation keys.
- Accepted trade-off: longer plans and reports; a batch with no screen, write path or stored
  shape answers all four in one line.
