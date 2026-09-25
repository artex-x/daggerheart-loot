# 2026-09-17 - Nits are processed immediately, per batch, not deferred to a terminal pass

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: nits are cleared in the batch that finds them, against the
  standing "defer mid-plan" rule (`orchestrate.prompt.md`, "Nits") - owner
  instruction. Reviewers still list nits fully; they are acted on.
- Rejected: deferring to the terminal batch as usual - that rule's premise
  ("a later batch re-enters those paths") fails once batches are merged by
  area and do not overlap, so a deferred nit has nothing to ride and arrives
  as a pile instead. `orchestrate.prompt.md`'s "Nits" section now names this
  as the standing exception.
