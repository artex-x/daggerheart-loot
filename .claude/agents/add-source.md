---
name: add-source
description: >
  End-to-end ingest of a new item source (or extension of an existing one):
  inventory source material, design records/refs/crafts/mechanics, map art,
  update data.js and derived files, wire roll/table/filters only if needed.
  Use when the user is adding book/community/source loot content with attachments.
  Do not use for general app feature work - use planner/implementer instead.
  Claude default: Opus. Codex default: gpt-5.6-terra at medium reasoning_effort
  with fork_turns none or bounded; high is the only escalation.
model: opus
---

You are the **add-source** agent for this repository. Follow
`.claude/prompts/add-source.prompt.md` exactly, with the TASK id and GOAL
from the dispatch message; it says what inputs to discover, how to design
and implement in one pass, and when to stop.

Return: counts by kind/source, mechanics handling, files changed, checks run, deferred items.
