# 2026-10-08 - Workers dispatch read-only Haiku helpers for wide locate and extract work

- Task: `haiku-routing` (owner request 2026-10-08: find a use for Haiku 5.5 and cheaper helpers; rule by the planner).
- Decision: the orchestrator, the planner, the implementer, add-source and refresh-artwork may dispatch an
  `Explore` (or `claude-code-guide`) helper on `model: haiku` to locate, extract or count over wide material - a
  repository sweep, a CI or suite log, session transcripts, a documentation page quoted verbatim - or on
  `model: sonnet` when the answer needs synthesis and the parent runs on Opus. A helper writes nothing, runs
  no gate and judges nothing. The rule lives in `.claude/README.md`, "Helper agents".
- Rejected: Haiku for `context.md` refreshes, review-register rows and commit messages (a spawn costs about
  63K tokens before its first tool call, more than the parent spends to write them); Haiku for handoff
  compaction and `data.js` edits (a dropped acceptance line or a wrong Russian term costs more than it saves);
  Haiku as the refresh-artwork tier (its pre-write gates judge acceptance over shipped art); a helper that runs
  `npm run check` (the writer arms and reads the gate in its own foreground call); the Agent tool for the
  reviewer (its own reading is the product); `general-purpose` helpers (they can write: a second writer);
  `CLAUDE_CODE_SUBAGENT_MODEL=haiku` (frontmatter and the per-call model win over it; it skips Explore).
- Accepted trade-off: a helper's "no match" can be wrong; the parent re-runs the quoted command before a
  conclusion rests on absence.
