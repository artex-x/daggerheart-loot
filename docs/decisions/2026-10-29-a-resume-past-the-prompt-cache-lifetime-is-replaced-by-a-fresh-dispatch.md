# 2026-10-29 - A resume past the prompt-cache lifetime is replaced by a fresh dispatch

- Task: `resume-cache-rule` (owner, 2026-10-29, chat).
- Decision: The orchestrator never resumes a long-running agent whose prompt cache has expired. It spawns a fresh agent with a brief that names the files to read. An unknown age counts as expired. The one exception is reasoning that a brief cannot carry (a half-applied edit): the orchestrator states the cost in chat first. The rule lives in `.claude/prompts/orchestrate.prompt.md`, "Resume, do not replace".
- Rejected: always resume, because the agent holds the context (a 400-640k-token transcript replayed past the lifetime costs more than a fresh agent that reads a brief; observed 2026-10-29 with task 57's mock agents resumed after more than an hour).
- Consequence: when a task notification for an agent arrives, the orchestrator runs `date -u +%H:%M` once and states "<agent> ended its turn at HH:MM" in chat. That line is the age that a later resume checks; with no such line, the age is unknown and counts as expired.
