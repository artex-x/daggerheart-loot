# 2026-09-24 - Kept defects live in `docs/specs/DEBT.md`, grouped by the task that owes them

- Task: `debt-cleanup` (the register's own rule since issue 47, 2026-09-11,
  restated with this task's regrouping).
- Decision: a live defect kept on purpose is an entry in `docs/specs/DEBT.md`
  (Where / What / Why deferred / How to verify), written in the batch that
  defers it and deleted by the batch that pays it. Sections are the tasks
  that owe the entries. A kept design goes here, not there; a refactor idea
  with no user-visible defect is named to the human and dropped.
- Rejected: a section of `FEATURES.md` (it says what the app does; "this is
  wrong" in it reads as behaviour); a task directory (retires with the task);
  one GitHub issue per entry (not in the tree, needs `gh`, cannot carry a
  measurement verbatim); the READMEs (a reader's document).
