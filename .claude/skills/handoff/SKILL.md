---
name: handoff
description: Closeout, retirement and compaction for issues/<id>/ - finish a task by auditing its directory against the durable list, moving what qualifies, deleting the directory in the task's commit and pushing once; keep the three documents inside their size budgets while the task is open.
disable-model-invocation: true
argument-hint: "<task-id> [close | compact]"
---

# Handoff: closeout, retirement and compaction

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
5. Amend the task's commit with the task documents (`git commit --amend`),
   green on its gates.
6. Push only when the task is finished (below) - not at every session's end.

## Finishing a task

1. Start no new work; code at a committed (amended) boundary.
2. Audit every file in the directory against the durable list (below). For
   each qualifying item: grep the candidate home for a distinctive phrase
   first (it may already be there), then write it there, self-contained.
3. `git grep -n "issues/<id>" -- ':!issues/'`. Unslashed and scoped outside
   all of `issues/`, matching the boundary `bash-guard.mjs` rule 2i checks -
   a bare-name citation with no trailing slash (`(issues/<id>, ...)`) is the
   dominant real shape and a slashed pattern misses it. Read each hit: a
   sibling id that merely starts with this one (`issues/<id>-2`) is not a
   real citation - the hook applies an identifier-boundary test a plain
   `git grep` does not. Repair every real hit: state the fact where it is
   cited, retarget to the permanent home, or - for a history-only pointer to
   a deleted file - qualify it as `git show <sha>:<path>`. The handoff's
   Deferred list: a defect goes to `DEBT.md`;
   an idea is named to the human in the closeout summary; then it drops.
4. `git rm -r issues/<id>`; `git commit --amend`. Rule 2i denies while a
   citation stands; that is the rule working - repair, do not bypass.
5. `git push`. Once. Record the sha in the closeout summary.

## What is durable

Exactly these classes, nothing else:

1. **Decision** - still in force, with the alternatives rejected and the
   reason. Not already recorded in a permanent file (grep a distinctive
   phrase first).
2. **Fact** - measured, not re-derivable from the repository or git history
   (a wall clock, a probe outcome, a count used as evidence for a threshold),
   whose subject still exists in the repository today.
3. **Defect or owed work** - a defect knowingly kept, or work explicitly
   deferred and never closed. A defect -> `DEBT.md`; an idea -> named to the
   human, then dropped.
4. **Quirk** - a host or tool behaviour with the symptom that identifies it.

Homes: behaviour -> the spec that owns it; hook/harness/host ->
`.claude/README.md` (a "Facts settled" list, a "Known limitations" bullet, a
candidates row, or the section that owns the tool); other decisions ->
`docs/DECISIONS.md`; defects -> `docs/specs/DEBT.md`.

## Not durable

Never durable: narrative, batch briefs, file lists, diffs, command output
beyond its result line, status snapshots, anything re-derivable.

## The budget

150 KB per file is the warning line; 300 KB is the collapse line. Measured by
`.claude/hooks/session-stop.mjs` on the active task's three documents, for the
session that wrote into that directory; it warns, never blocks, once per
session per state. Why these numbers: every worker reads the three files at
dispatch (`CLAUDE.md`, "Start here"), and at roughly four bytes per token a
150 KB file is ~37k tokens - a fifth of a worker's context spent before it has
read a line of code. Issue 47's `plan.md` reached 1,031 KB before compaction
existed.

## Never drop (while the task is open)

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
artifacts` line; history keeps the full text. Compaction is folded into the
task's next amend, `.md`-only and gate-exempt.
