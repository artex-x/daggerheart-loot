---
name: orchestrate
description: Kick off or continue orchestrated task work for a TASK id - planner, implementer, optional reviewer, add-source, refresh-artwork. Manual only.
disable-model-invocation: true
argument-hint: "TASK: <id> GOAL: <goal, or continue>"
---

Follow `.claude/prompts/orchestrate.prompt.md` exactly, with the `TASK:` and
`GOAL:` from the arguments. Read `CLAUDE.md` first. The prompt is the single
source and is read on invocation; nothing of it is copied here.
