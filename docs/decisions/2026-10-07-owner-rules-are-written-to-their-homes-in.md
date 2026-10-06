# 2026-10-07 - Owner rules are written to their homes in the batch that hears them

- Task: `persist-7h-homebrew-page` (owner, 2026-10-03, W5; planner, 2026-10-06, the homes and the budgets).
- Decision: a reusable rule the owner states is written into its existing
  home in the batch that hears it: `docs/specs/FEATURES.md` "Consistency
  rules" or the other `docs/specs/` file that owns it, `DESIGN.md`, `.claude/README.md`, `docs/decisions/` or a role's
  prompt; `CLAUDE.md` only under its own repeated-mistake rule. Only a
  rule that changes later work is written, in one to three lines; each
  home has a budget, and a rule past it replaces or merges an older one
  (`.claude/README.md`, "Owner insights"). The orchestrator tags the home
  in `context.md`, the planner places the write in a batch, the reviewer
  checks it in every review, and the closeout audit checks it is written.
- Rejected: a separate insights file (nobody reads it at dispatch, and it grows with no limit); `CLAUDE.md` for every rule (its 200-line budget, read by every session).
