# Handoff - TASK agent-effort

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/agent-effort/context.md`, then `plan.md`, then this file.

## Status
- Task status: done (B1 committed; task closed unless a fresh-session P4
  repeat is later wanted - see Deferred)
- Last agent: implementer (2026-09-11)
- NEEDS_HUMAN_CONFIRMATION: no - branch was P+noK (key unverified, not
  HONOURED), so Q1 never applied and no frontmatter change was made.
- Branch: `main`
- Base / starting commit: `b967481` (unchanged at B1 start; peer session
  `issues/47` work continued on the same tree throughout, untouched by this
  batch)

## Completed

### Planning (2026-09-11)
- What shipped: `plan.md` (design, measurement protocol with pre-registered
  decision rules, sequencing, B1 implement-ready with verbatim text for every
  outcome, the meantime rule); `context.md` extended with the docs facts and
  three readings taken during planning.
- Deviations and rationale:
  1. The dispatch note sketched a hook-side instrument. Planning found and
     measured a cheaper one: `$CLAUDE_EFFORT` in a worker's Bash tool (read
     `high` from inside this planner, under a parent `get_session self`
     reports at `high`). The hook route is kept as a specified fallback
     (`plan.md` 3.4) for a worker whose echo prints empty, and is never
     committed.
  2. The measurement is a phase run by the orchestrator and the human, not
     an implementer batch: only the human can set the session's effort,
     the probes are dispatches, and no tree change is needed first.

### Phase M - measurement (orchestrator + human, 2026-09-11)
- What happened: C0/P1 at E0=`high`, F1 to E1=`low`, C1/P2 at E1, F2 back to
  E0, C2/P3 at E0. Verdict **PROPAGATES**: W1/W2/W3 = `high`/`low`/`high`
  against controls `high`/`low`/`high`. P4 (frontmatter scratch line
  `effort: low` in `implementer.md`, session at `high`) read `high`, not the
  key's value - verdict **NOT HONOURED, provisional**: the confound (agent
  files plausibly read once at session start, so a mid-session edit may not
  have been seen) is named and not closed; the fresh-session repeat that
  would close it was not run. S6 (live-vs-fixed-at-dispatch) was not taken.
  Full rows and verdict text: `context.md`, "Phase M readings" through "P4 -
  the frontmatter key".
- Files changed: `issues/agent-effort/context.md` only (rows and verdicts
  appended). The P4 scratch line was reverted by hand (Edit tool, not
  `git checkout`); `git diff --quiet .claude/agents .claude/hooks` confirmed
  clean before B1 started.
- Commit(s): none - Phase M leaves no trace in the tree.

### B1 - correct the rule (implementer, 2026-09-11)
- Batch name/id: B1, branch **P+noK** (PROPAGATES, key unverified/provisional
  - treated as the not-honoured branch per the task's explicit instruction,
  with wording kept to "unverified" rather than a flat negative).
- What shipped: the wrong effort rule replaced at
  `.claude/prompts/orchestrate.prompt.md:193` (and its "Raise per dispatch
  when" bullets and cheat-sheet) and `CLAUDE.md:190`; facts, candidate row
  38, and a "Facts settled during measurement" section added to
  `.claude/README.md`; one sentence added to `.claude/improvements.md`
  Finding 4. No agent frontmatter was touched (P+noK takes no `effort:` key
  branch) - `.claude/agents/*.md` are unchanged from `b967481`.
- Files changed: `.claude/prompts/orchestrate.prompt.md`, `CLAUDE.md`,
  `.claude/README.md`, `.claude/improvements.md`, `issues/agent-effort/plan.md`,
  `issues/agent-effort/handoff.md`.
- Commit(s): see below (recorded after commit).
- Deviations and rationale:
  1. **Wording, not the plan's canned P+noK text.** The plan's own P+noK
     paragraph (section 6, step 1) says the key "was probed <date> and not
     honoured" - flatter than the measured strength. Per the task's explicit
     instruction (measured strength must not be overstated, and P4's
     confound is real and unclosed), the shipped paragraph instead says the
     key "stays **unverified**" and names the confound and the fresh-session
     repeat that would settle it, matching README row 36's treatment of
     `disallowedTools`. `plan.md`'s own fallback clause authorizes
     substituting wording that better fits the measured rows without
     replanning.
  2. **`orchestrate.prompt.md` line count.** The plan's acceptance criteria
     estimated the branch paragraph would add "at most seven net" lines,
     keeping the file at or under 320. The shipped paragraph needed to state
     three facts at their exact measured strength (the `Agent` tool's full
     schema, the three-probe/three-control propagation reading, and the
     unverified-key wording with its confound) plus one line the plan could
     not have anticipated (the throwaway-dispatch token-cost finding this
     session made, per the task's own instruction to record it "wherever
     the new rule lands"). Fitting all of that cost more than seven lines;
     the file is 326 lines, six over the plan's soft target. This was not
     one of the task's own listed gates (only `CLAUDE.md` carries a line-count
     gate), so it was accepted rather than cutting a required fact.
  3. **"Resuming a worker" bullet left unchanged.** Step 5 of `plan.md`
     section 6 says to append a sentence about live-vs-fixed-at-dispatch
     effort "if S6 was taken." S6 (`plan.md` 3.2) was never run in Phase M -
     `context.md` has no S6/W3' row - so nothing was appended; an earlier
     draft of this edit briefly added an unsupported claim there and was
     caught and reverted before committing.
  4. **No `agent_type` re-derivation, no re-probe.** Per the task's explicit
     instruction, Phase M was not re-run and the plan was not reopened.

## Verification

### Planning / Phase M (historical, unchanged)
- `node .claude/hooks/selftest.mjs` -> `292 passed, 0 failed`
- Bash tool: `echo "CLAUDE_EFFORT=[$CLAUDE_EFFORT]"` -> `CLAUDE_EFFORT=[high]`
  (from inside the planner subagent); `env | grep -o '^CLAUDE[A-Za-z0-9_]*'`
  lists `CLAUDE_EFFORT` and `CLAUDE_CODE_SESSION_ID`, not
  `CLAUDE_CODE_EFFORT_LEVEL` (present but empty)
- PowerShell tool: `"CLAUDE_EFFORT=[$env:CLAUDE_EFFORT]"` -> `CLAUDE_EFFORT=[]`
- `mcp__ccd_session_mgmt__get_session self` -> `model: claude-opus-5,
  effort: high`
- Docs fetched: `code.claude.com/docs/en/hooks`, `/sub-agents`,
  `/model-config`, `/settings` - facts in `context.md`
- Phase M rows and verdicts: `context.md`, "Phase M readings" through
  "P4 - the frontmatter key" (PROPAGATES; key not honoured/provisional;
  P4 reverted, confirmed by `git status --short .claude/` and
  `git diff --stat .claude/` both empty before B1 started)

### B1 (this batch)
- `git diff --quiet .claude/hooks .claude/settings.json` -> exit 0 (neither
  touched)
- `grep -n "set effort explicitly" .claude/prompts/orchestrate.prompt.md` ->
  no output
- `grep -rn "sonnet + high" .claude/prompts CLAUDE.md` -> no output
- `grep -n "models/effort" CLAUDE.md` -> no output
- `wc -l CLAUDE.md` -> `193`
- `wc -l .claude/prompts/orchestrate.prompt.md` -> `326` (over the plan's
  soft "at most seven net" estimate; see deviation 2 above - not one of the
  task's own required gates)
- `grep -c "^effort:" .claude/agents/*.md` -> `0` for all five (P+noK takes
  no frontmatter branch)
- `grep -n "^| 3[89]" .claude/README.md` -> row 38 present, no row 39
- `git status --porcelain` after the commit -> only this task's own files
  clean/committed, plus the untouched peer work (`issues/47/*` modified,
  `issues/tg-preview-refresh/` untracked) and the unrelated live `app/src/`
  Svelte changes from the issue-47 session, none of it staged by this batch
- `npm run check` was not run: every touched path is markdown/prose and the
  commit gate exempts `issues/**` and non-README `.md`, matching `plan.md`
  section 6's "Verification commands" note. `node .claude/hooks/selftest.mjs`
  was not re-run for B1: no hook or `.claude/agents/*.md` file changed
  (`git diff --quiet .claude/agents .claude/hooks` above proves it).
- Gates: all of the above pass except the `orchestrate.prompt.md` line
  count, recorded as a deviation, not a failure.

## Next batch

None. Both Phase M and B1 are complete; `issues/agent-effort/` has no more
implement-ready work. See Deferred for the one optional follow-up.

## Blockers

None. B1 shipped on the P+noK branch; Q1 (the frontmatter value set) never
applied because the key was not measured HONOURED.

## Deferred
- `plan.md` section 11.
- The fresh-session repeat of P4 (`plan.md` 3.3), not run in this task: dispatch
  a fresh session with `.claude/agents/implementer.md` already carrying a
  scratch `effort: <value different from the session's>` line, probe once,
  record W4, revert. A second negative from a fresh session would upgrade the
  README/orchestrate-prompt wording from "unverified" to "NOT HONOURED"; a
  positive would open Q1 and move the repo to a K branch. Until run, do not
  add an `effort:` key to any agent frontmatter.

## Notes
- Mocks path: none (no UI).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: none performed by this batch. The
  tree still carries a live peer session's issue-47 work throughout B1 -
  `M issues/47/context.md`, `handoff.md`, `plan.md`, and (grown since
  planning) numerous `app/src/components/*.svelte` modifications plus new
  untracked `.svelte` files - none of it staged or touched here.
  `issues/tg-preview-refresh/` likewise untouched.
- Session end partial progress: none - task complete except the deferred
  fresh-session P4 repeat.
- Meantime rule (`plan.md` section 7): no longer needed - Phase M is read and
  B1 has shipped the rule it selects (worker effort is the session's; the
  frontmatter key stays unverified, so no dispatch decision should assume it
  is settable).
