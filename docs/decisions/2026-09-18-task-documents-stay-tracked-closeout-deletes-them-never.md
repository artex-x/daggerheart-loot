# 2026-09-18 - Task documents stay tracked; closeout deletes them, never pushed

- Task: `workflow-hygiene` (find the commit with `git log --grep=workflow-hygiene`).
- Decision: `issues/<id>/` stays tracked in git while a task is open. The
  closeout amend runs `git rm -r issues/<id>` before the task's one push, so
  a task's documents never reach the remote - only its permanent-home writes
  and its commit do.
- Rejected: gitignoring `issues/` instead - the deletion path stops being
  guardable (`bash-guard.mjs` denies `rm -r` inside the repo; rule 2i sees a
  glob as a literal token), a worktree or a remote agent at the task's commit
  would not see the documents, and the issue 47 task directory was tracked by
  an owner ruling (later overridden) that would have become an exception
  inside an exception.
- Evidence: pre-amend commits stay in the local reflog only
  (`gc.reflogExpireUnreachable`, 30 days by default), so the closeout audit
  is the only thing that preserves a decision or a measurement made mid-task.
