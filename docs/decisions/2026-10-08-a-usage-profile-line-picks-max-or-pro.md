# 2026-10-08 - A usage-profile line picks Max or Pro routing; review tier follows the writer

- Task: `haiku-routing` (owner request 2026-10-08: balance tokens, speed and quality; the owner moves from Max 5x to Pro).
- Decision: one `Usage profile: max|pro` line in `.claude/prompts/orchestrate.prompt.md`, "Model selection",
  picks a column of its routing table. Both columns: a next-batch refresh plans on Sonnet unless its outline
  has an open design question, meets writer test 2 or follows a replan; a batch review runs on its writer's
  tier, and on Opus for a plan review, a second look or the uncertainty trigger. `pro` also: the implementer
  goes to Opus on writer test 2 only, a test-1 batch returns to the planner, a new plan for routine work runs
  on Sonnet, and Fable is not offered. The frontmatter keeps its Opus defaults.
- Rejected: a frontmatter swap per plan (five files, read only at session start); `CLAUDE_CODE_SUBAGENT_MODEL`
  or its `_FORCE` form (a default below the frontmatter, or one tier for every role); the profile in
  `~/.claude/CLAUDE.md` (a cloud session does not read it); a Haiku role tier (Haiku 5.5 is documented for
  classification, extraction and routing); a hook that enforces the table (the tests are judgement, a hook
  sees only the model string); Sonnet frontmatter for the planner and the reviewer (a missed `model` would
  then cost a defect, not tokens).
- Accepted trade-off: on `pro`, a visual-judgement batch and a remediation run on Sonnet with a Sonnet review;
  goldens, sweeps and the one remediation cycle bound the risk.
