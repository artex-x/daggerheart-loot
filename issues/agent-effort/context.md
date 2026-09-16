# Shared task context - TASK agent-effort

Orchestrator maintains this file. Task id chosen by the orchestrator (the human
named none); rename if the owner prefers another.

## Goal

The orchestrator selects a **model** per dispatch but has no lever for
**reasoning effort**, and `.claude/prompts/orchestrate.prompt.md:193` tells it
to "set effort explicitly when you need high" as though it did. Establish what
actually governs a dispatched worker's effort on this host, then correct the
prompt - and, if effort belongs in agent frontmatter beside `model`, put it
there.

The owner's question, which started this: "if I run orchestrator on high will
high be propagated everywhere, or does the orchestrator select effort in
addition to model?"

## Measured before dispatch (orchestrator, 2026-09-11) - do not re-derive

- **The `Agent` tool exposes no effort parameter on this host.** Its whole
  input schema is `description`, `prompt`, `subagent_type`, `model`,
  `isolation`, `run_in_background`. So per-dispatch effort selection does not
  exist, and `orchestrate.prompt.md:193` describes a lever the orchestrator
  does not have.
- **The documented lever is agent frontmatter.** The `Agent` tool's own
  contract states that each agent type's *model, reasoning effort, and tools*
  come from its definition (`.claude/agents/*.md` frontmatter or the SDK
  `agents` field).
- **No agent in this repo declares it.** All five (`planner`, `implementer`,
  `reviewer`, `add-source`, `refresh-artwork`) carry `name`, `description` and
  `model` only; `reviewer.md` adds `permissionMode: plan`. So every worker is
  running at whatever the unstated fallback is.
- **The fallback is undocumented in anything readable here.** The *model*
  fallback is stated ("inherits from the parent unless a default subagent model
  is configured"); effort's is not stated at all. **Unverified either way - do
  not assume propagation and do not assume isolation.**
- **The instrument already exists and the repo found it without noticing.**
  `.claude/improvements.md`, "Finding 4", records - verified against the docs -
  that hook input carries `effort`, alongside `agent_id` and `agent_type`.
  `lib.mjs`'s `readInput()` parses stdin JSON generically, so those fields are
  already reachable with no plumbing change, and `selftest.mjs` already
  synthesizes `agent_id`/`agent_type` in its fixtures (lines 226-227, 256-257),
  so the repo already treats them as real fields.
- **Where an instrument would go.** `settings.json` wires `PreToolUse` on
  `Bash` (`bash-guard.mjs`) and on `Edit|MultiEdit|Write|NotebookEdit`
  (`edit-guard.mjs`), plus `PostToolUse` on the same matchers. Every dispatched
  worker runs Bash within a few tool calls, so a `PreToolUse(Bash)` hook sees
  every worker of every tier.
- **No hook logs `effort` today.** The only hits in `.claude/hooks/` are
  `selftest.mjs`'s fixtures and one unrelated "best effort" comment.

## Why it is worth settling rather than shrugging at

Both directions cost something, and nothing announces which one is true:

- **If effort propagates from the session**, then an orchestrator run on high
  silently runs every Sonnet implementer, every reviewer and every throwaway
  probe on high too. That is the same failure `orchestrate.prompt.md` already
  documents for `model: inherit` ("an implementer dispatched from an Opus
  session silently runs on Opus ... the fastest way to exhaust the 5-hour
  window"), except invisible. This session dispatched seven agents.
- **If it does not**, the owner sets high for a hard planning pass and the
  planner quietly runs at the default anyway - the escalation the model tier
  was chosen to complement never happens.

Related, and already recorded: the 5-hour window is not machine-readable from
here (`orchestrate.prompt.md`, "Session ending"; `improvements.md` Finding 4),
so the cost of guessing wrong cannot be observed after the fact either.

## Key paths
- `.claude/prompts/orchestrate.prompt.md` - line 193 and the "Model selection
  (orchestrator only)" section that contains it; the `model: inherit` warning
  in the same section is the precedent for how this repo writes such a rule
- `.claude/agents/*.md` - the five frontmatter blocks
- `.claude/hooks/lib.mjs` (`readInput`), `.claude/hooks/bash-guard.mjs`,
  `.claude/hooks/selftest.mjs`, `.claude/settings.json`
- `.claude/README.md` - the hook candidate table; `.claude/improvements.md`
  Finding 4

## Constraints
- A measurement that changes a hook must not weaken `bash-guard.mjs`'s deny
  rules or `selftest.mjs`'s 292 assertions; say how the instrument is removed
  again, or why it earns a permanent place.
- Frontmatter keys are host-specific. `disallowedTools` was already sketched
  and held as **unverified** for this host (`README.md`, candidate row 36) - an
  effort key deserves the same scepticism and the same probe-before-adopt
  treatment.
- This repo's standing rule: a rule is added only after a repeated mistake, and
  prose that failed three times was replaced by a hook, not a fourth paragraph.

## Do not re-fetch unless
- The host's `Agent` tool schema changes (re-read it, do not assume)

## Extended during planning (planner, 2026-09-11) - do not re-derive

Docs read 2026-09-11 (`code.claude.com/docs/en/hooks`, `/sub-agents`,
`/model-config`, `/settings`). Docs are not this host; each row says which.

- **Hook-input `effort` is an object, not a string**: `{ level }`, with
  `level` one of `low`, `medium`, `high`, `xhigh`, `max` - "the effort level
  in effect when the hook runs". If the set level is unsupported by the model,
  `level` reports the level actually run. Present for `PreToolUse`,
  `PostToolUse`, `Stop`, `SubagentStop` when the model supports effort.
  `improvements.md` Finding 4 lists the field but not its shape. (docs)
- **The same level reaches the Bash tool as `$CLAUDE_EFFORT`** - docs say
  "available to hook commands and the Bash tool". **Measured on this host**:
  from inside this planner subagent, the Bash tool printed
  `CLAUDE_EFFORT=[high]`; the PowerShell tool printed nothing for the same
  variable (`$env:CLAUDE_EFFORT` empty) - the instrument must be the Bash
  tool. `CLAUDE_CODE_EFFORT_LEVEL` is unset here. So **no hook edit is needed
  to take a reading**: a probe worker's own `echo "$CLAUDE_EFFORT"` is the
  instrument.
- **The parent session of this dispatch runs at `high`**: `get_session self`
  (host tool `mcp__ccd_session_mgmt__get_session`) returned `model:
  claude-opus-5, effort: high` - the field exists and is machine-readable
  from the orchestrator, which gives the protocol a control beside the UI.
  A worker reading `high` under a parent at `high` proves nothing on its own:
  the model default effort is also `high` (below), so only a contrast
  (session at `low`, worker reads `low` or `high`) decides.
- **Subagent frontmatter has a documented `effort` key**: "Effort level when
  this subagent is active. Overrides the session effort level. Default:
  inherits from session." Values `low`..`max`; "Frontmatter effort applies
  when that skill or subagent is active, overriding the session level but not
  the environment variable"; a `maxEffortLevel` or organisation cap still
  limits it. **Unverified on this host** - candidate row 36's standing for
  `disallowedTools` applies; the plan's probe P4 settles it. (docs)
- **Documented default is propagation**: "Default: inherits from session".
  The measurement confirms or refutes it for this host; the plan's rule
  drafts cover both. (docs)
- **Model default effort is `high`** on every model that supports effort
  (Opus 4.7: `xhigh`). Sonnet 5 / Opus 5 / Fable 5.x support all five
  levels; Opus 4.6 / Sonnet 4.6 lack `xhigh`; an unsupported level falls back
  to the highest supported at or below it. Contrast levels must therefore be
  `low` vs `high`, never `xhigh`/`max`. (docs)
- **How session effort is set**: `/effort <level>` (applies to the next
  request in the turn), the `/model` slider, `--effort` at launch,
  `CLAUDE_CODE_EFFORT_LEVEL`, or `effortLevel`/`modelSettings` in settings;
  the desktop app exposes it as the session's effort control. (docs)
- **Agent files are watched**: "Claude Code detects the change within a few
  seconds and the next delegation uses the updated definition, with no
  restart needed" (three restart cases; none is ours - `.claude/agents/`
  existed at session start). **Unverified on this host**; the plan repeats a
  negative key probe from a fresh session before concluding. (docs)
- **`set_session_effort` exists on this host** (`mcp__ccd_session_mgmt__
  set_session_effort`, levels `low`..`max`) but targets *another CCD session*
  "from its next turn on" and is "refused for this session - a session must
  not silently re-price its own turns". Subagents are not sessions. So it is
  **not** a per-dispatch lever and **not** a self lever; the orchestrator
  cannot change the effort its own workers would inherit. Only the human (UI
  or `/effort`) can.
- **The `Agent` tool schema is unchanged** from the section above: no
  `effort` parameter.

## Tree facts at planning (2026-09-11)

- HEAD `b967481`. Untracked: `issues/agent-effort/`, `issues/tg-preview-refresh/`
  (another task's - never touch). **Also modified, tracked:**
  `issues/47/context.md` (+29 lines, "State at the B10 kickoff") - another
  live session's write on this tree. Never stage or touch it from this task.
- `node .claude/hooks/selftest.mjs`: `292 passed, 0 failed` at planning.
- `orchestrate.prompt.md` 313 lines, `CLAUDE.md` 193 (its own cap is 200),
  `.claude/README.md` 301 (candidate table ends at row 37).
- `CLAUDE.md:190` also states the wrong lever ("Orchestrator selects
  models/effort"); it sits inside the `setup-claude-agents` marker block and
  has been hand-edited before.

## Phase M readings (orchestrator, 2026-09-11)

Recorded as taken. Decision rule is pre-registered in `plan.md` section 3; do
not reinterpret it after the fact.

| Step | Who | Session level (E) | Reading |
|---|---|---|---|
| C0 | main session, own Bash tool | E0 = `high` | `effort=[high]` |
| P1 | `implementer` probe, no `model` argument | E0 = `high` | `effort=[high] session=[a914c09e-3554-4ea8-b12d-ff90134c912f]` |

**P1 proves nothing on its own, by the plan's own rule**: model default effort
is `high`, so a `high` worker under a `high` session is consistent with both
propagation and isolation. The contrast at E1 is what decides it, and only the
human can set session effort (`set_session_effort` refuses its own session and
targets sessions, not subagents).

One fact P1 adds for free: **a subagent reports the parent's session id**
(`a914c09e-...` is this main session's). So `CLAUDE_CODE_SESSION_ID` cannot
distinguish a worker from its parent in a log, which matters to any future
instrument that tries to attribute a row to an agent - `agent_id`/`agent_type`
in hook input remain the only discriminators named so far.

### P2 at E1 - the contrast, and the verdict it gives

| Step | Who | Session level | Reading |
|---|---|---|---|
| C1 | main session, own Bash tool | E1 = `low` | `effort=[low]` |
| C1b | `get_session self` | E1 = `low` | `"effort": "low"` |
| P2 | `implementer` probe, no `model` argument | E1 = `low` | `effort=[low] session=[a914c09e-...]` |

Against P1 (`high` under E0 = `high`), this is the plan's pre-registered
**PROPAGATES** pattern for the first two steps: the worker's level moved with
the session's. P3 (back at E0) completes the W1=E0 / W2=E1 / W3=E0 shape.

**So the session's effort reaches dispatched workers.** An orchestrator run at
`high` runs its Sonnet implementers at `high` too - the same silent escalation
`orchestrate.prompt.md` already documents for `model: inherit`, and invisible
in exactly the same way. It also means the meantime rule written at planning
("assume every worker runs at `high`") was right for the wrong reason: workers
run at the *session's* level, whatever that is.

### P4 is blocked by the permission classifier (orchestrator, 2026-09-11)

P4 - add a scratch `effort:` line to `.claude/agents/implementer.md`, probe,
revert - is the test of whether the documented frontmatter key is honoured on
this host. **Both routes were refused**: `sed -i` via Bash and the `Edit` tool,
each "Blocked by classifier" on writing to `.claude/agents/`. Not worked
around, by design - the denial names config as the protected thing, and the
task exists to make config honest, not to edit it behind a guard.

Consequence: the key stays **unverified**, B1 takes a branch that does not
declare `effort` in frontmatter, and `plan.md`'s Q1 (which value each of the
five agents would carry) stays moot until either the owner approves the one
scratch edit or a permission rule allows writes to `.claude/agents/`.

### P3 at E0 - the pattern closes: PROPAGATES

| Step | Who | Session level | Reading |
|---|---|---|---|
| C2 | main session, own Bash tool | E0 = `high` (restored) | `effort=[high]` |
| P3 | `implementer` probe, no `model` argument | E0 = `high` | `effort=[high] session=[a914c09e-...]` |

Full sequence, W1 / W2 / W3 = `high` / `low` / `high` against controls
`high` / `low` / `high`. That is the plan's pre-registered **PROPAGATES**
verdict exactly - the worker's level tracked the session's in both directions,
so the reading is not a one-way artefact and not the model default (a default
cannot follow a flip).

**Verdict: PROPAGATES. Recorded 2026-09-11, three probes plus three controls.**

The residual the plan named - that a probe's report could echo the session
rather than describe the worker - is **not closed**, because P4 (the
frontmatter override, the reading that would separate the two) is blocked by
the permission classifier. It is a narrow residual: `$CLAUDE_EFFORT` is read
inside the worker's own Bash tool, and the level moved with the session in both
directions. But it is open, and B1's wording should not claim more than three
probes measured.

B1 may now be dispatched on the **PROPAGATES + key-unverified** branch of
`plan.md` section 6.

### P4 - the frontmatter key, measured and reverted (orchestrator, 2026-09-11)

The owner approved the scratch edit, so P4 ran. Design note: the plan's
contrast value is whatever the session is **not**, and the session was back at
`high` by then, so the scratch line was `effort: low` - a worker reading `low`
could then only have come from the key.

| Step | Frontmatter | Session level | Reading |
|---|---|---|---|
| P4 | `.claude/agents/implementer.md` carried `effort: low` | `high` | `effort=[high]` |

The worker followed the **session**, not the frontmatter.

**Verdict: NOT HONOURED - provisional, one confound named.** By the plan's own
rule a negative is repeated once **from a fresh session** before it counts, and
that rule earns its keep here: agent definitions are plausibly read once at
session start, in which case a mid-session edit to `implementer.md` could not
have been seen no matter what the host does with the key. So this is a clean
reading of a possibly-stale definition, not proof the key is ignored. The
repeat costs one probe in any later session that starts after a frontmatter
edit; until someone runs it, the key stays **unverified**, exactly as
`disallowedTools` does at README candidate row 36.

**Revert confirmed**: `git status --short .claude/` and `git diff --stat
.claude/` both empty; `implementer.md` is byte-identical to `b967481`. Nothing
was committed, and no hook or setting was touched at any point in Phase M.

**What P4 does settle**, regardless of the confound: the residual left open
after P3 - that a probe's report might echo the session rather than describe
the worker - is now the *only* reading consistent with all four probes, since
P4's worker reported the session's level while its own definition said
otherwise. That is weak evidence and is recorded as such; it does not change
B1's branch.

**Phase M is complete.** B1 is dispatchable on the **PROPAGATES +
key-unverified** branch of `plan.md` section 6, and `plan.md`'s Q1 (which value
each agent would declare) stays moot until the fresh-session repeat.
