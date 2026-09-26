# 2026-09-27 - The Supabase scripts take the local stack lock themselves

- Task: `process-guards` (owner's rule, 2026-09-26; mechanism by the planner, 2026-09-27).
- Decision: `tests/db/run.mjs` and `tools/supabase/restore-drill.mjs` take
  the host's lock file `dhloot-local-stack.lock` in the temporary
  directory through `.claude/hooks/stack-lock.mjs` before they touch the
  local stack, and release it after, also after a failure or a signal.
  The body names the task, branch, checkout, command, pid and start time;
  a lock is stale after 45 minutes or when its pid is gone. A busy stack
  ends `check:db` with `check:db: BUSY`. `bash-guard.mjs` denies a manual
  local-stack command while another checkout holds a fresh lock.
- Rejected: the by-hand protocol (each agent must remember it, and a
  failure path forgets the delete); a lock in the checkout's `.claude/`
  (the stack is per host); asking Docker which container runs (it cannot
  say whose run it is).
