# 2026-09-18 - Durable knowledge is written to its home the batch that makes it, never parked

- Task: `workflow-hygiene`.
- Decision: a durable fact, decision, or defect is written to its permanent
  home in the batch that establishes it, never left in a task document for
  closeout to move. Homes: behaviour -> `docs/specs/`; hook/harness/host
  facts and rationale -> `.claude/README.md`; every other decision ->
  `docs/DECISIONS.md`; a defect kept on purpose or work owed ->
  `docs/specs/DEBT.md`; an idea nobody owns -> dropped, named to the human at
  closeout so they can file it.
- Rejected: parking durable content in the task directory until closeout -
  the audit would then have to reconstruct what was durable from narrative
  written once already, which is exactly how content survives as a citation
  into a directory that is about to be deleted.
