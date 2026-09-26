# 2026-09-27 - The reviewer writes its report to `issues/<id>/reviews/` and nowhere else

- Task: `process-guards` (owner's rule, 2026-09-26; mechanism by the planner, 2026-09-27).
- Decision: the reviewer has the Write tool and no `permissionMode: plan`
  (plan mode refuses Write). `edit-guard.mjs` allows a reviewer's write
  only to `issues/<id>/reviews/<name>.md`; `bash-guard.mjs` keeps its Bash
  read-only. The report starts with `Verdict:`, `Reviewed: <sha>` and
  `Scope:` lines that the hooks read. The orchestrator keeps the findings
  register `issues/<id>/reviews.md`.
- Rejected: the orchestrator copies the returned text (R5's practice; it
  lives in one context and dies with it); plan mode plus a hook `allow`
  for the one path (undocumented precedence, and an `allow` skips the
  permission prompt); a native per-agent path rule (none exists).
