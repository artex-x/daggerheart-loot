# Claude / Codex agent wiring

| Agent | Prompt | Default model frontmatter |
|-------|--------|---------------------------|
| planner | prompts/plan.prompt.md | opus |
| implementer | prompts/implement.prompt.md | inherit (orchestrator sets tier) |
| reviewer | prompts/review.prompt.md | inherit |
| add-source | prompts/add-source.prompt.md | inherit |

Orchestrator: prompts/orchestrate.prompt.md

The orchestrator owns final reconciliation and cleanup: wait for workers, align context/plan/handoff, preserve evidence and unrelated work, and remove only clearly disposable task-scoped scratch artifacts.

Per-task disk state under issues/<id>/:
- context.md - shared facts (issue summary, constraints); avoid re-fetch
- plan.md / handoff.md - design + execution (see templates/)
- mocks/ - optional

Kickoff:
  Follow .claude/prompts/orchestrate.prompt.md
  TASK: <id>
  GOAL: <feature or add source items...>
