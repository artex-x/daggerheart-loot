---
name: handoff
description: Closeout and task-state compaction for issues/<id>/ - end the session at a committed boundary and keep context.md, plan.md and handoff.md inside their size budgets. Manual only; the Stop hook names this file when a task document is over budget.
disable-model-invocation: true
argument-hint: "<task-id> [close | compact]"
---

# Handoff: closeout and compaction

Applies to the active task's `issues/<id>/` set (`context.md`, `plan.md`,
`handoff.md`). Any agent may follow this file by reading it; the slash command
is the human's. `CLAUDE.md`, "Task and session protocol", points here.

## Closeout - the human said stop, handoff, or the session is ending

1. Start no new work.
2. Leave production code at a coherent committed boundary; never commit a
   half-batch. A check that is running is waited for in this turn, not
   abandoned.
3. Update `plan.md` and `handoff.md` (headings from
   `.claude/templates/handoff.template.md`): decisions, deviations, partial
   progress, exact commands and results, blockers, and the exact next action.
4. Change `CLAUDE.md` only for a new standing rule or a recurring mistake.
5. Push the branch if the batch's commits passed their gates.
6. Compact (below) any task document the Stop hook named, before ending.

## The budget

150 KB per file is the warning line; 300 KB is the collapse line. Measured by
`.claude/hooks/session-stop.mjs` on the active task's three documents, for the
session that wrote into that directory; it warns, never blocks, once per
session per state. Why these numbers: every worker reads the three files at
dispatch (`CLAUDE.md`, "Start here"), and at roughly four bytes per token a
150 KB file is ~37k tokens - a fifth of a worker's context spent before it has
read a line of code. Measured on 2026-09-15: issue 47's `plan.md` was 1,031 KB,
57.7% of it pre-implementation briefs for batches that had already shipped;
its `handoff.md` 523 KB, an append log under snapshot headings, 96% of its
Status section superseded snapshots.

## Never drop

- decisions and their reasons, and the approaches rejected on the way
- blockers, open questions, and any `NEEDS_HUMAN_CONFIRMATION` state
- the current batch and the next batch, implement-ready
- validation status: exact commands, exact results, run ids, commit hashes
- a measured fact that cannot be re-derived from the repository or git history
  (a wall clock, a parity cell, a probe's outcome, a host quirk). It moves to
  `context.md` or to its permanent home; it is never deleted. Three of issue
  47's worst hours were spent re-deriving facts a previous session had
  measured - that is the argument for keeping everything, and this list is
  its answer: what is kept is the measurement, not the prose around it.

## Always drop

- file contents and diffs: the commit holds them
- command output beyond its result line (exit status, count, run id)
- anything cheaply re-derivable from the repo or git history (a file list, a
  line number, a function body, what a test asserts)
- a completed batch's design brief, steps and narrative, once collapsed to its
  outcome plus commit: the code and its specs are the record
- superseded status snapshots: `Status` is replaced, never appended

## Collapse actions, per file

- `handoff.md`: one `Status` (the current one). Under `Completed`, one line
  per shipped batch: name, outcome, commit(s), deviation if any.
  `Verification` holds the latest batch only, with exact commands and
  results. `Blockers`, `Deferred` and `Notes` are current state, not history.
- `plan.md`: keep the design, the decisions and rejected alternatives, and the
  batch list with status. A shipped batch's implement-ready brief collapses to
  its outcome and commit. Never collapse the next batch.
- `context.md`: facts, constraints, decisions, disproved reasons. Narrative
  moves to the plan's outcome lines; a measurement stays.

Before collapsing, run `git log --oneline -3 -- issues/<id>/` and name the
last pre-collapse commit in the handoff's `Cleanup performed / retained
artifacts` line; history keeps the full text. Compact in its own commit
(`docs(<id>): compact task state`), `.md`-only and gate-exempt.

## Retirement

`.claude/prompts/orchestrate.prompt.md`, "Task closeout and cleanup", step 6:
durable knowledge goes to `docs/specs/` or `.claude/README.md` first; run
`git grep -n "issues/<id>/plan\.md"` and retarget every citation before
deleting `plan.md` (`bash-guard.mjs` denies the deletion while one stands);
keep `context.md` and `handoff.md`, status `done`.
