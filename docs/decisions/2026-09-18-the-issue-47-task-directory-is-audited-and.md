# 2026-09-18 - The issue 47 task directory is audited and retired in this task

- Task: `workflow-hygiene`.
- Decision: the issue 47 task directory (the Svelte migration backlog) is
  read in full, its durable content placed in permanent homes, and the
  directory deleted - overriding the 2026-09-17 ruling in its own handoff to
  keep it permanently. No directory is exempt from the new model.
- Rejected: keeping the 2026-09-17 ruling - it predates this task's model,
  under which every directory whose work has shipped is retired.
- Evidence: the closed records (`sweep.md`, the closing record in
  `handoff.md`) stay reachable through one history pointer,
  `git show 92d6a4b:issues/47/<file>` - `92d6a4b` is the last commit on
  `main` before this task's own commit.
