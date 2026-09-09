# Shared task context - TASK <id>

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
-

## GitHub issue (if any)
- URL:
- Captured or last verified:
- Title:
- Summary (facts only):
- Decisions already settled:
- Open questions:

## Screenshot / attachment findings
-

## Key paths
- Specs:
- Code hot paths:
- Mocks:

## Command costs

What each check costs in wall clock, and whether it fits one foreground call
(the Bash tool caps at 600s). Fill this in once per task; every worker
otherwise rediscovers it. Never let two heavy runs overlap.

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | | |
| `npm run check:built` | | |
| `node tests/parity.js "<filter>"` | | |
| `node tests/run-all.js parity` | | |

## Measuring the live app against the rewrite

Use `node tools/probe.mjs <route> <selector>` rather than writing the script
again. It launches with the parity harness's own args, loads both `index.html`
and `dist/index.html`, and prints computed styles and rects side by side. A
number taken any other way is not comparable to the harness's.

## Which machine is authoritative
- For recorded numbers (parity debt, timings):
- What a difference on another machine means:

## Reasons already disproved

Causes a previous session wrote down and a later one refuted. Keeping the list
stops the next session re-deriving them from the same evidence.

- 

## Constraints
- Contracts / parity / i18n notes:

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan