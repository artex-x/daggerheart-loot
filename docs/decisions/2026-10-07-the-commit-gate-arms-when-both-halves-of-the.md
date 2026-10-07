# 2026-10-07 - The commit gate arms when both halves of the check pass on one tree

- Task: `persist-7h-homebrew-page` (owner, 2026-10-07: two foreground calls, each under 600 s; partition by the planner).
- Decision: `npm run check:1` runs every stage of `STAGES` except vitest, and `npm run check:2` runs
  vitest. Each half records its pass for its tree key by its own exit (`gate-credit.mjs`,
  `.check-<n>-pass.json`); the second record on the same key writes `.check-cache.json` with
  `by: "halves"`. `check-observer.mjs` only reads the records. `npm run check` stays the full chain,
  arms alone and is what CI runs. The fast pre-check `npm run check:fast` arms nothing.
- Rejected: one call with the stage cache (a cold run still crosses 600 s, and a subagent loses the
  verdict of a moved run); three or more parts (a fixed cost per call; vitest is one stage); vitest
  shards with merged blob reports (the next step when vitest alone nears 600 s on an idle host);
  arming by the observer (it cannot see a run that the harness moved to the background).
- Amends "A green check arms the commit gate by its own exit, not a host-wide lock" (2026-09-27): a half records its pass by its exit, and two records on one key arm the gate.
- Accepted trade-off: two calls instead of one. In a batch that changes the hooks, `check:1` runs the
  selftest uncached and can pass 600 s; its exit still records the half, and the `gate credit:` line
  in the background output is the evidence. If `check:1` passes 600 s on an idle host, the selftest is
  the next stage to split out.
