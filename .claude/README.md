# Claude / Codex agent wiring

| Agent | Prompt | Default model frontmatter |
|-------|--------|---------------------------|
| planner | prompts/plan.prompt.md | fable (opus when Fable access is unavailable) |
| implementer | prompts/implement.prompt.md | sonnet |
| reviewer | prompts/review.prompt.md | opus |
| add-source | prompts/add-source.prompt.md | sonnet |
| refresh-artwork | prompts/refresh-artwork.prompt.md | sonnet |

Orchestrator: prompts/orchestrate.prompt.md

Each agent's frontmatter carries its real default tier, so a dispatch that names
no model still runs where it should. Never use `model: inherit` for a worker -
inherit means the session model, so a worker dispatched from a strong session
silently runs at that tier instead of its documented one. The orchestrator raises
a tier with an explicit `model` argument per dispatch; see the model selection
section of prompts/orchestrate.prompt.md.

The orchestrator owns final reconciliation and cleanup: wait for workers, align context/plan/handoff, preserve evidence and unrelated work, and remove only clearly disposable task-scoped scratch artifacts.

Per-task disk state under issues/<id>/:
- context.md - shared facts (issue summary, constraints); avoid re-fetch
- plan.md / handoff.md - design + execution (see templates/)
- mocks/ - optional

Kickoff:
  Follow .claude/prompts/orchestrate.prompt.md
  TASK: <id>
  GOAL: <feature or add source items...>
