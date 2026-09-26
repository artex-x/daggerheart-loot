# 2026-09-27 - A green check arms the commit gate by its own exit, not a host-wide lock

- Task: `process-guards` (owner, 2026-09-27, from the two answers the planner offered; mechanism by the planner).
- Decision: `npm run check` and `npm run check:db` arm their commit gate
  themselves (`.claude/hooks/gate-credit.mjs`): a first step records the
  tree key, a last step, reached only when every step exited 0, arms the
  gate when the key did not change. A run moved to the background at the
  600 s cap, a terminal run and a cloud run over the output cap all count.
  Rule 2g denies a backgrounded check only in a subagent. At most two
  heavy agents run at once, an orchestrator rule.
- Rejected: a host-wide heavy-run lock (it guards shared data, not shared
  CPU; a wait inside the call crosses the 600 s cap, a deny makes the
  agent poll; every heavy entry point needs a writer with stale-lock
  recovery); Stop-time reconciliation and a longer-lived observer (no hook
  receives the exit code on this host).
- Accepted trade-off: two sessions still slow each other.
