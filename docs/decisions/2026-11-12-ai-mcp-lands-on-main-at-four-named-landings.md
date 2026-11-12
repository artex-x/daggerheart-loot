# 2026-11-12 - ai-mcp lands on main at four named landings

- Task: `ai-mcp` (planner, 2026-11-12; owner AFK, recommended option taken).
- Decision: landing 1 was B0 and B1 (`aeb68c0e`). Landing 2 is B2a alone, because production's `std` roll ran at 7.5-17.5 ms
  of CPU against the 10 ms limit and the fix and the MCP endpoint can be measured only on the deployed worker.
  Landing 3 is B3 and B2b together, after their reviews. The closeout squash carries B5a and B5b.
- Decision: if B3's planner pass or its plan review slips, the planner decides whether B2b waits or lands alone as landing 3.
- Decision: each landing follows the steps of "ai-mcp lands on main in two squashes" (an approving batch review,
  a green CI run of the tip, the squash, the merge-back with `check:fast` and CI, no force-push).
- Rejected: B2a waiting for the closeout (the CPU defect stays live and B3's caps have no reading);
  a squash per batch (B2b alone gains nothing over landing with B3, and each landing costs about 23 min).
- Amends "ai-mcp lands on main in two squashes" (2026-11-12): four landings, not two squashes.
