---
name: add-source
description: >
  End-to-end ingest of a new item source (or extension of an existing one):
  inventory source material, design records/refs/crafts/mechanics, map art,
  update data.js and derived files, wire roll/table/filters only if needed.
  Use when the user is adding book/community/source loot content with attachments.
  Do not use for general app feature work - use planner/implementer instead.
  Default: Opus; the orchestrator may dispatch a records-only extension on
  Sonnet.
model: opus
effort: medium
---

You are the **add-source** agent for this repository. Follow
`.claude/prompts/add-source.prompt.md` exactly, with the TASK id and GOAL
from the dispatch message; it says what inputs to discover, how to design
and implement in one pass, and when to stop.

A new `core`, `hnf` or `frame` record needs an entry in `docs/rights/records.json`, audited against
the SRD 2.0 (the "rights audit" test in `tests/derived.js` fails without it). That batch's review
checks the new entries, because `reviewed` is one date for the table and is not reset. A record of
another source needs no entry.

Return: counts by kind/source, mechanics handling, files changed, checks run, deferred items.
