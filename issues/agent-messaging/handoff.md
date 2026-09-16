# Handoff - TASK agent-messaging

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/agent-messaging/context.md`, then `plan.md`, then this file.

## Status
- Task status: **done**
- Last agent: implementer (2026-09-11)
- NEEDS_HUMAN_CONFIRMATION: **no** - Q1 was answered by the owner before this
  batch started (`context.md`, "The owner's answer on Q1"): relay stays,
  fix-passes resume the batch's own implementer, the direct
  reviewer -> implementer fallback (`plan.md` section 7, "Fallback") was
  **not** implemented.
- Branch: `main`
- Base / starting commit: `55f2fa2`

## Completed
- Batch name/id: **B1 - correct the premise, keep the relay, resume the
  worker** (`plan.md` section 7, the only batch)
- What shipped: the false host claim ("`SendMessage` is disabled for the
  main session and for subagents alike") replaced everywhere it lived with
  the measured capability; a new "Resume, do not replace" subsection in
  `orchestrate.prompt.md`; the "went quiet" and "wait with it" sections
  corrected to resume via `SendMessage` instead of asking the human;
  "After review" updated so fix-then-continue resumes the batch's writer
  and a second look resumes the same reviewer; closeout step 4 updated the
  same way; the review prompt and reviewer agent file each gained one
  sentence forbidding the reviewer to message any other agent; the
  implement prompt's step 7 gained the "resume you" clause; a new
  "Resuming a worker" section (capability table + bounding facts) added to
  `.claude/README.md` between "Kickoff" and "## Hooks"; candidate rows
  35-37 (all rejected/sketched, no hook) appended to the README's
  candidate table; `.claude/improvements.md`'s status header gained one
  withdrawal sentence for Finding 1's "do not design around resumption
  being available" (the historical Finding 1 body text at line 47 is left
  as written - it is the session record, not a live claim).
- Files changed: `.claude/prompts/orchestrate.prompt.md`,
  `.claude/prompts/review.prompt.md`, `.claude/agents/reviewer.md`,
  `.claude/prompts/implement.prompt.md`, `.claude/README.md`,
  `.claude/improvements.md`, `issues/agent-messaging/plan.md`,
  `issues/agent-messaging/handoff.md`, `issues/agent-messaging/context.md`.
  Nothing outside this list. `issues/tg-preview-refresh/` (untracked,
  another task's) was left untouched and unstaged throughout.
- Commit(s): `02bd1af` - `docs(agents): a finished worker is resumed, not
  replaced, and review still returns to the orchestrator`, staged by name
  (never `git add -A`).
- Deviations and rationale:
  1. **`orchestrate.prompt.md` is 313 lines, not <=310.** The plan's
     acceptance criterion names a deviation band of 311-315 and says to
     record it rather than cut content the plan keeps if it lands there.
     313 is inside that band. Every verbatim block in `plan.md` section 7
     was used as written; no war story or kept section was trimmed beyond
     what the plan specified to make room. The planner's own estimate
     ("about 303" / "about 300") undercounted by roughly ten lines against
     the verbatim blocks actually specified - not investigated further
     since the plan pre-authorized this exact outcome.
  2. No other deviation. All twelve ordered steps in `plan.md` section 7
     ran as written, with verbatim replacement text used exactly as
     supplied.

## Verification
- Commands run (exact):
  - `git status --porcelain` (before and after: only `issues/agent-messaging/`
    and `issues/tg-preview-refresh/` untracked; no other dirty paths)
  - `wc -l .claude/prompts/orchestrate.prompt.md .claude/README.md CLAUDE.md .claude/improvements.md .claude/prompts/review.prompt.md .claude/prompts/implement.prompt.md .claude/agents/reviewer.md`
  - `ListAgents` (preflight - confirmed no other writer `running` on this
    tree; the one subagent listed was this implementer itself, the same
    self-report shape `context.md` already recorded for the sibling probe)
  - `grep -rn "cannot resume\|is disabled\|not exposed on every host\|only the human can resume\|human's to do\|resumable only from the human" .claude/prompts .claude/agents .claude/README.md`
  - `grep -rn "SendMessage" .claude CLAUDE.md`
  - `grep -n "Resume, do not replace" .claude/prompts/orchestrate.prompt.md`
  - `grep -n "Do not message" .claude/prompts/review.prompt.md`
  - `grep -n "do not message" .claude/agents/reviewer.md`
  - `grep -n "resume you" .claude/prompts/implement.prompt.md`
  - `grep -n "^| 3[5-9]" .claude/README.md`
  - `grep -n "^## Resuming a worker\|^## Hooks" .claude/README.md`
  - `grep -rn "npm run check 2>&1 | tail" .claude/prompts .claude/README.md CLAUDE.md`
  - `git diff --stat`
- Results:
  - Negative grep for the false claim: **empty** (pass)
  - `SendMessage` hits: every one outside `.claude/improvements.md` line 47
    (the historical Finding 1 body, left as written per the plan) states
    the measured capability, a bounding fact, or the reviewer's
    prohibition/candidate rows; none says the tool is absent
  - `Resume, do not replace`: the heading (line 166) plus two pointers
    (item 4 at line 161-162, and the "After review" fix-then-continue
    bullet at line 269) - three hits total, satisfying "heading + at least
    two pointers"
  - `orchestrate.prompt.md`: **313 lines** (deviation, recorded above -
    inside the plan's 311-315 band)
  - `CLAUDE.md`: **193 lines**, unchanged
  - `review.prompt.md` line 75 and `reviewer.md` line 19 each carry one
    sentence forbidding the reviewer to message any other agent
  - `implement.prompt.md` line 75 carries "resume you"
  - README candidate table ends at row 37; no row 38+
  - `## Resuming a worker` at README line 32, before `## Hooks` at line 64
  - Every quoted check invocation across the touched prompts, README, and
    `CLAUDE.md` reads exactly `set -o pipefail; npm run check 2>&1 | tail -n 120`
    - no second form found
  - `git diff --stat`: exactly the six `.claude/*` files named above;
    `issues/agent-messaging/` and `issues/tg-preview-refresh/` do not
    appear in `diff --stat` because both are untracked (expected - the
    task directory's changes are staged and committed by name, not shown
    by `diff --stat` against the prior tracked tree)
- Gates: `npm run check` not run and not required - every file this batch
  touched is markdown, `.prettierignore` has carried `*.md` since `5ab5880`,
  and the commit gate's `isExempt` (`bash-guard.mjs`) exempts `issues/**`
  and every `.md` file except the two root READMEs
  (`.claude/README.md`, "What the check does not cover: markdown"). No
  non-`.md` file was touched, so the fallback check in `plan.md`'s
  verification commands was not triggered. `selftest.mjs` was not run for
  the same reason - it exercises the eight hook scripts, none of which
  changed.

## Next batch (implement-ready)
- None. Task complete and closed out (below).

## Blockers
- None.

## Closeout (2026-09-11, resumed implementer)

Resumed under "Resume, do not replace" for an uncommitted change at
closeout, per the coordinator's message. Two items:

1. **Homed the rationale for declining direct reviewer -> implementer
   routing.** It survived nowhere once `plan.md` section 3 was gone except
   as a rule with no reason attached. Added one bullet to
   `.claude/README.md`, "Resuming a worker" (between the one-way-dispatch
   fact and the two-writers fact): direct routing drops the orchestrator's
   blocker/nit filter without dropping the hop (the reply still lands in
   the parent's conversation, not the reviewer's), and the filter has a
   measured save - the B9 remediation, where the implementer was told the
   reviewer's third-deviation concern was already resolved and not to
   re-litigate it.
2. **Retired the task directory.** `issues/agent-messaging/plan.md`
   deleted (`git rm`) - nothing outside the task directory referenced it,
   and the two things it specified for permanent homes (the README rows
   and the "Resuming a worker" section, and now the routing rationale
   above) are in place. `context.md` and `handoff.md` (this file) kept.

Gates re-run after both edits, unchanged from B1:
- Negative grep (`cannot resume|is disabled|not exposed on every host|only the human can resume|human's to do|resumable only from the human`) - **empty**
- `wc -l .claude/prompts/orchestrate.prompt.md` - **313** (deviation accepted by the coordinator; not trimmed)
- `wc -l CLAUDE.md` - **193**, unchanged
- `git diff --stat` against the prior commit - only `.claude/README.md` (the new bullet) and the `git rm` of `issues/agent-messaging/plan.md`

Commit: `88ef6fb` - `docs(agent-messaging): home the routing rationale and
retire the task directory`, one commit on top of `fb4c7db`, staged by name,
no `git add -A`, not pushed.

## Deferred
- Measure sibling -> sibling `SendMessage` delivery with two live
  subagents, when a session has two anyway for another reason. Record the
  result as a new README table row before designing on it.
- README candidate row 36 (`disallowedTools: SendMessage` on the reviewer)
  on the first recorded reviewer send; verify the key is honoured with a
  probe first.
- Moving the remaining `orchestrate.prompt.md` origin stories (writers,
  usage) into a README "Facts settled" list, if the file grows again - not
  this batch; README candidate row 29 is watching "Your writers are not
  the only writers" as written.

## Notes
- Mocks path: none (no UI, markdown only)
- Screenshot findings: none
- Cleanup performed / retained artifacts: `issues/agent-messaging/plan.md`
  removed at closeout - its content is homed (README rows 35-37, the
  "Resuming a worker" section, and the routing rationale added above).
  `context.md` and `handoff.md` kept, per `CLAUDE.md`'s closeout step 6.
  `issues/tg-preview-refresh/` (another task's untracked directory) was
  preserved and never staged throughout.
- Session end partial progress (if any): none - the batch and its
  closeout completed and committed in full.
