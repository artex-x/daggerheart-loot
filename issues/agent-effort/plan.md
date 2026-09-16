# Plan - TASK agent-effort

Settle what governs a dispatched worker's reasoning effort on this host, then
correct the rule that misdescribes it. Read `CLAUDE.md`, then `context.md`
(the established and unverified facts live there and are not repeated here
except where the design turns on them), then this file, then `handoff.md`.

## 1. Objective and current state

The owner asked: "if I run orchestrator on high will high be propagated
everywhere, or does the orchestrator select effort in addition to model?"

What is settled now (all in `context.md`):

- The orchestrator does **not** select effort: the `Agent` tool has no
  effort parameter, and `set_session_effort` refuses the calling session and
  cannot address a subagent. `orchestrate.prompt.md:193` ("set effort
  explicitly when you need high") and `CLAUDE.md:190` ("selects
  models/effort") describe a lever that does not exist.
- The docs say a subagent **inherits the session's effort** unless its
  frontmatter declares `effort`. That is the documented answer to the first
  half of the owner's question: yes, high propagates everywhere. This repo
  has been wrong about this host before (`SendMessage`, `Task` vs `Agent`),
  so the plan measures it rather than citing it.
- The instrument needs no hook edit: `$CLAUDE_EFFORT` in a worker's Bash
  tool reports the level in effect, measured live from this planner (`high`,
  under a parent at `high`). That reading is **not** evidence either way -
  the model default is also `high`. The decisive reading is a worker
  dispatched while the session is at `low`.

Non-goals: no change to `bash-guard.mjs`'s rules or any hook (a fallback
instrument is specified in section 3.4 for the case the env var is empty in
some worker, and it is reverted in the same phase); no new hook; no model
routing in this file; no edit to `issues/47/` or `issues/tg-preview-refresh/`.

## 2. Evidence gathered in planning

See `context.md`, "Extended during planning". The facts the design turns on:

| Fact | Status | Bears on |
|---|---|---|
| `$CLAUDE_EFFORT` reaches the Bash tool inside a subagent | **measured here** | the instrument (3.1) |
| PowerShell tool does not carry it | measured here | probes must use Bash |
| `get_session self` reports the session's `effort` | measured here | the control reading (3.2) |
| model default effort is `high` | docs | why one `high` reading proves nothing; contrast must be `low` vs `high` |
| frontmatter `effort` key, "overrides the session level" | docs, **unverified here** | probe P4 (3.3); adopt only on a positive |
| agent files reloaded within seconds | docs, unverified here | a negative P4 is repeated from a fresh session |
| `set_session_effort` refuses self, targets sessions not subagents | measured (tool contract) | the meantime rule (section 7) and the noK branches |

## 3. The measurement

### 3.1 Instrument

The probe's own command. Each probe (and the main session, for its control
row) runs, in the **Bash** tool:

```text
echo "effort=[$CLAUDE_EFFORT] session=[$CLAUDE_CODE_SESSION_ID]"
```

Output goes nowhere but the probe's reply and the orchestrator's transcript;
the orchestrator copies each line into `context.md` (section 3.6) as it
arrives. Nothing is written to the tree, nothing is registered, nothing has
to be removed. Compared with the hook route the dispatch note sketched: same
value per the docs ("the level in effect"), zero exposure of the deny rules
and the 292 assertions, and the reading is the worker's own report of the
level it runs under rather than a side channel.

### 3.2 Protocol

Actors: the **human** flips the session's effort (desktop control or
`/effort <level>`); the **orchestrator** dispatches probes, runs the control
readings and records rows. No implementer is involved; the tree is not
changed except by P4's one scratch line, reverted inside the phase.

Probe dispatch, identical every time except where a step says otherwise:
`subagent_type: implementer` (the real worker under test, carrying this
repo's `model: sonnet` frontmatter; a `general-purpose` probe would measure
a definition this repo does not use), **no `model` argument**, foreground,
this prompt verbatim:

```text
Measurement probe for TASK agent-effort. This is not a batch. Do not read
CLAUDE.md, any issues/ file, or any other file. Run exactly one command with
the Bash tool (not PowerShell):
echo "effort=[$CLAUDE_EFFORT] session=[$CLAUDE_CODE_SESSION_ID]"
Reply with that line verbatim and nothing else, then stop.
```

A probe writes nothing, so it is not a writer and the two-writers rule does
not apply; `ListAgents` preflight still runs as for any dispatch.

Levels: E0 = the session's current level (`high` at planning); E1 = `low` if
E0 is not `low`, else `high`. Never `xhigh` or `max` (aliasing on models
that lack them would fake a reading).

| Step | Who | Action | Row recorded |
|---|---|---|---|
| C0 | orchestrator | `get_session self`; then the echo in its own Bash tool. The two must agree. | M0 = level at E0 |
| P1 | orchestrator | dispatch the probe | W1 |
| F1 | human | set the session to E1 | - |
| C1 | orchestrator | **in a new turn**: `get_session self` and the echo. If the echo still shows E0, wait one more turn and repeat once. | M1 |
| P2 | orchestrator | dispatch the probe | W2 |
| F2 | human | set the session back to E0 | - |
| C2 | orchestrator | as C1 | M2 |
| P3 | orchestrator | dispatch the probe | W3 |
| S6 | human + orchestrator | only if P1-P3 read PROPAGATES: human sets E1; orchestrator confirms with the echo, then `SendMessage` to P3's agent: "Run the same echo again and reply with the line." Human restores E0 afterwards and the orchestrator confirms. | W3' |
| P4 | orchestrator | key probe, section 3.3 | W4 |

Every row is `{step, at, level read, get_session effort, agent id or "main"}`.

### 3.3 P4 - the frontmatter key

With the session at E0 and after P1-P3: add one line to
`.claude/agents/implementer.md`, directly under `model: sonnet`:

```yaml
effort: <K>
```

where K = `low` if W1 was `high`, else `high` - the key's value must differ
from what a plain implementer read. Wait ten seconds (the watcher), dispatch
the probe unchanged, record W4. Then **remove the line with the Edit tool**
(`git checkout --`/`git restore` are blocked by `bash-guard.mjs` by design)
and confirm `git diff --quiet .claude/agents/implementer.md` exits 0.

Do not dispatch any real implementer while the line is in place.

If W4 equals K: the key is honoured on this host. If W4 does not: the
negative is ambiguous (the definition may have been snapshotted). Repeat
once from a **fresh session** started with the line already in the file;
same probe; then revert. A second negative is the finding.

### 3.4 Fallback instrument (only if a probe's echo prints `effort=[]`)

A worker whose Bash tool lacks the variable cannot report by 3.1. Then, and
only then, the hook route: in `.claude/hooks/bash-guard.mjs`, inside
`guard(() => {`, directly after `const input = readInput();`:

```js
  // TASK agent-effort probe - remove before any commit
  try {
    appendFileSync(
      path.join(stateDir(), '.effort-log.jsonl'),
      JSON.stringify({
        at: new Date().toISOString(),
        session_id: input.session_id,
        agent_id: input.agent_id,
        agent_type: input.agent_type,
        effort: input.effort,
        keys: Object.keys(input)
      }) + '\n'
    );
  } catch {}
```

with `appendFileSync` imported from `node:fs`, `path` from `node:path`, and
`stateDir` added to the `./lib.mjs` import list. It sits before every rule
and inside its own `try`, so no deny path changes and a failed write is
silent; the selftest's spawns point `LOOT_HOOK_STATE_DIR` at a scratch
directory, so the log lands there, not in the tree, and no assertion reads
the state directory's file list - the 292 stay green (verify:
`node .claude/hooks/selftest.mjs` prints `292 passed, 0 failed` with the
line in place). Hook scripts are re-read per invocation on this host
(`.claude/README.md`, "Hook config may be snapshotted"), so it is live at
once. Rows carry `effort` as the documented `{ level }` object; the protocol
of 3.2 is unchanged, reading `level` from rows whose `agent_id` is the
probe's. Removal, inside the same phase: delete the inserted block and the
three import additions with the Edit tool, `git diff --quiet
.claude/hooks/bash-guard.mjs` exits 0, `rm .claude/.effort-log.jsonl` (a
named file, not `-rf`), selftest green again. It is never committed.

### 3.5 Decision rules - fixed before the data

Preconditions, or the run is void and repeated: M0, M1, M2 each equal the
`get_session self` level taken beside them, and M0 = M2 != M1 (the control
must move with the UI, and move back).

| Reading | Verdict |
|---|---|
| W1 = E0, W2 = E1, W3 = E0 | **PROPAGATES** - the worker follows the session |
| W1 = W2 = W3 = C, one constant, while M moved | **DOES NOT PROPAGATE** - the worker runs at C regardless (expected C = `high`, the model default); record C |
| any probe prints `effort=[]` | switch to 3.4 for that probe type; the run so far stands |
| any other pattern (mixed, a probe that ran no echo, a control that did not move) | **INCONCLUSIVE** - repeat the whole sequence once; a second inconclusive is recorded as such and B1 takes its "unmeasured" branch |
| W3' = E1 (S6) | effort is read **live**: a running or resumed worker follows a mid-run change |
| W3' = E0 (S6) | effort is **fixed at dispatch** |
| W4 = K | **KEY HONOURED** |
| W4 != K twice (second from a fresh session) | **KEY NOT HONOURED** here - reject-for-now, as row 36 |

The residual, stated so nobody claims more than the data: a PROPAGATES
reading shows the *reported* level follows the session. A KEY HONOURED
reading (W4 = K != session) shows the report is per-agent, not an echo of
the session, and closes that gap. PROPAGATES with KEY NOT HONOURED leaves
it open; the rule text for that branch says "reported".

### 3.6 Where the rows go

`context.md`, a new section "Measured (Phase M, <date>)": the table of rows,
the verdicts by the rules above, and nothing interpretive beyond them. The
orchestrator maintains `context.md`; B1 reads the verdicts from there. The
handoff's Verification section repeats the verdict line.

## 4. No permanent instrument

The instrument of 3.1 never enters the tree. The fallback of 3.4 is reverted
inside Phase M and never committed. No hook is added:

- The README's bar is a repeated mistake, and "prose that failed three times
  was replaced by a hook". There is no mistake here to guard - nothing has
  ever fired on effort - and an observe-only hook would be the first in the
  repo whose only output is a file nobody reads (row 32 rejected the
  observer even *speaking* for want of readers).
- Re-measurement costs one echo from any worker. That is cheaper than any
  hook and needs no removal.
- B1 records this as candidate row 38 (**reject**) so nobody rebuilds it.

## 5. Sequencing

**Phase M** (measurement; orchestrator + human; not a batch) then **B1** (one
implementer batch). Not two implementer batches, and not one batch with a
pause:

- Phase M changes nothing that survives it (P4's scratch line is reverted in
  the phase) and needs actors an implementer is not: only the human can set
  the session's effort, and the probes are dispatches. There is nothing for
  an implementer to install first, because the instrument is the probe's own
  echo.
- B1's gates are the same whichever branch it takes (markdown only; the
  commit gate exempts every touched path), so the batch-size test merges all
  the correction into one batch. Splitting the rule edit from the README
  facts and the frontmatter lines would be splitting for its own sake.
- A pause-and-resume inside B1 would idle a worker across the human's UI
  actions for no gain: a cold B1 reads the same verdicts from `context.md`.

## 6. B1 - correct the rule to the measured facts (implement-ready)

### Objective

Replace the wrong effort rule everywhere it lives with the branch that the
Phase M verdicts select; record the measured facts where this repo keeps
them; declare `effort` in agent frontmatter if and only if the key was
measured as honoured; commit once.

### Preconditions - do not start otherwise

- `context.md` carries "Measured (Phase M, <date>)" with a verdict for
  propagation (PROPAGATES / DOES NOT PROPAGATE / INCONCLUSIVE), for S6 when
  taken (LIVE / FIXED AT DISPATCH), and for the key (HONOURED / NOT
  HONOURED). Missing verdict: stop and report.
- If the key is HONOURED, the values question (section 10, Q1) is answered
  in `context.md` or the handoff. Missing answer: stop and report.
- `git diff --quiet .claude/agents .claude/hooks` exits 0 (Phase M cleaned
  up). `ListAgents` shows no other writer running. HEAD re-read and named.
- `issues/47/context.md` may be modified by another session and
  `issues/tg-preview-refresh/` untracked: preserve, never stage.

### In scope

`.claude/prompts/orchestrate.prompt.md` (the "Model selection (orchestrator
only)" section), `CLAUDE.md:190`, `.claude/agents/*.md` (K branches only),
`.claude/README.md` (agent table, facts list, candidate row 38, one
"Resuming a worker" bullet), `.claude/improvements.md` (one sentence in the
status header), `issues/agent-effort/plan.md` and `handoff.md`.

### Out of scope

Any hook script or `settings.json`; any prompt section other than the one
named; model routing; `issues/47/`, `issues/tg-preview-refresh/`.

### Branch selection

| Propagation | Key | Branch |
|---|---|---|
| PROPAGATES | HONOURED | **P+K** |
| PROPAGATES | NOT HONOURED | **P+noK** |
| DOES NOT PROPAGATE | HONOURED | **N+K** |
| DOES NOT PROPAGATE | NOT HONOURED | **N+noK** |
| INCONCLUSIVE | any | **U** (key result still applied if HONOURED, as K's frontmatter step) |

### Step 1 - `orchestrate.prompt.md:193`

Replace the single line
`Effort/high reasoning is controlled by the session UI - set effort explicitly when you need "high".`
with the branch's paragraph, verbatim, `<date>` filled from `context.md`.
Wrap at the file's existing width.

**P+K:**

```text
Effort has no dispatch argument. A worker whose frontmatter declares no
`effort` runs at the **session's** level - measured <date>: a session at
`high` dispatched an implementer that read `high`, at `low` it read `low` -
so an orchestrator run on high runs every worker on high: the `model:
inherit` failure again, invisible. Each agent file therefore declares
`effort` beside `model`, and the file is the only lever. To run one worker
at another level, edit its `effort:` line before the dispatch, restore it
after the worker finishes (not before - see "Resuming a worker" for whether
a running worker follows a change), and say so in chat. In doubt, a worker's
`echo "$CLAUDE_EFFORT"` in its Bash tool is the reading.
```

**P+noK:**

```text
Effort has no dispatch argument and, on this host, no frontmatter lever
(the documented `effort` key was probed <date> and not honoured). Every
worker runs at the **session's** level - measured <date>: at `high` an
implementer read `high`, at `low` it read `low` - so an orchestrator run on
high runs every worker on high, and only the human can change it (the
session control or `/effort`; `set_session_effort` refuses its own
session). Before a dispatch that needs a different level, ask for the
level in chat, wait for it, dispatch, and ask for it back once the worker
finishes. In doubt, a worker's `echo "$CLAUDE_EFFORT"` in its Bash tool is
the reading.
```

**N+K:**

```text
Effort has no dispatch argument, and the session's level does not reach
workers - measured <date>: with the session at `low` an implementer read
`high`, the model default. Raising the session raises only your own
reasoning. Each agent file therefore declares `effort` beside `model` so
the file says what runs, and the file is the only lever: to run one worker
at another level, edit its `effort:` line before the dispatch, restore it
after the worker finishes, and say so in chat. In doubt, a worker's
`echo "$CLAUDE_EFFORT"` in its Bash tool is the reading.
```

**N+noK:**

```text
Effort has no dispatch argument, the session's level does not reach
workers, and this host honours no frontmatter `effort` key - measured
<date>: with the session at `low` an implementer read `high`, the model
default, and an implementer declaring `effort: low` read `high` too. Every
worker runs at `high`. There is no lever for worker effort here: choose
the model only. "Sonnet + high" is what a plain dispatch already is.
```

**U:**

```text
Effort has no dispatch argument, and whether the session's level reaches a
worker is **unmeasured** on this host (Phase M of `issues/agent-effort/`
was inconclusive <date>; the docs say it does). Assume the worst for cost:
an orchestrator on high may be running every worker on high. Do not write
an effort into a dispatch decision as if it changed anything. In doubt, a
worker's `echo "$CLAUDE_EFFORT"` in its Bash tool is the reading.
```

### Step 2 - the same section's dispatch guidance

Edit these existing lines in "Raise per dispatch when" and the cheat-sheet;
leave the model guidance untouched.

- `Plan: already fable; medium effort suits routine batches, high when design/UI/ mechanics are non-trivial. On Fable, lower effort often beats a prior model's highest, so reach for high because the design is hard - not out of habit. Opus is the fallback floor, not a downgrade to choose per dispatch`
  - K branches: keep the sentence but change "medium effort suits routine batches, high when" to "the file's `effort` suits routine batches; edit it to `high` when", and keep the rest.
  - P+noK: change to "ask for the session at `high` when"; keep the rest.
  - N+noK, U: delete the effort clause: "Plan: already fable. On Fable, ... Opus is the fallback floor, not a downgrade to choose per dispatch".
- `Implement: opus only if a prior implement failed on this batch or risk is high; sonnet + high for large careful batches`
  - K: `; for a large careful batch set implementer.md's effort to high for that dispatch`
  - P+noK: `; for a large careful batch ask for the session at high`
  - N+noK, U: drop `; sonnet + high for large careful batches`.
- `Refresh-artwork: ... large mechanical conversion batches use sonnet + high` - same three treatments.
- Cheat-sheet: add one line after `frontier: ...`, before the blank line:
  - K: `Effort on the Claude side is the agent file's line, not a dispatch choice.`
  - P+noK: `Effort on the Claude side is the session's level, set by the human.`
  - N+noK: `Effort on the Claude side is high for every worker; not selectable here.`
  - U: `Effort on the Claude side is unmeasured; the Codex column's levels do not apply to a Claude worker.`
- `Agents must not choose models.` -> `Agents must not choose models or effort.`

### Step 3 - `CLAUDE.md:190`

Replace `Orchestrator selects models/effort and maintains` with, on one line:

- K: `Orchestrator selects models per dispatch and effort by agent frontmatter, and maintains`
- P+noK: `Orchestrator selects models; effort is the session's, set by the human. It maintains`
- N+noK: `Orchestrator selects models; worker effort is not selectable on this host. It maintains`
- U: `Orchestrator selects models, not effort (see the orchestrate prompt), and maintains`

The line sits inside the `setup-claude-agents` marker block and has been
hand-edited before; edit in place. `wc -l CLAUDE.md` must stay 193.

### Step 4 - agent frontmatter (K branches only)

Add `effort: <value>` directly under the `model:` line in each of the five
files, values from the Q1 answer (section 10). Proposed set A, read off the
prompt's own tier language: `planner: medium`, `implementer: medium`,
`add-source: high`, `refresh-artwork: medium`, `reviewer: high`. Set B:
`high` in all five (reproduces the measured status quo; no behaviour
change). Whichever set: the descriptions that say "Default tier: economy" /
"economy-high" now match the file. No other frontmatter change; the
`reviewer.md` `permissionMode: plan` line stays.

### Step 5 - `.claude/README.md`

- Agent table: K branches add a column `Default effort frontmatter` with
  the five values; noK/U branches add one sentence under the table:
  "Effort: see the orchestrate prompt's model selection section - <one
  clause per branch, from Step 1>."
- After "Facts settled during implementation (`hooks-guardrails`,
  2026-09-10)", add "Facts settled during measurement (`agent-effort`,
  <date>)" with, as list items: `$CLAUDE_EFFORT` in the Bash tool (not
  PowerShell) reports a worker's level; hook input `effort` is `{ level }`
  (docs, unmeasured here unless 3.4 ran); the propagation verdict with the
  W1-W3 readings; the S6 verdict if taken; the key verdict with W4; the
  model default `high` and the `low`/`high` contrast rule;
  `set_session_effort` refuses self and targets sessions.
- Candidate table, new row 38: `Log effort from a hook | PreToolUse(Bash) |
  **reject** | The Bash tool's $CLAUDE_EFFORT is the same value with no
  edit (measured <date>); an observe-only hook would be the first here,
  guards no recorded mistake, and re-measurement is one echo from any
  worker. Fallback sketched in issues/agent-effort/plan.md 3.4, reverted
  if used.`
- "Resuming a worker" bullet `A send carries no model; a resumed agent
  keeps its tier.` - append per S6: `It reads the current session effort
  (measured <date>)` or `It keeps the effort it was dispatched at (measured
  <date>)`; if S6 was not taken, append nothing.

### Step 6 - `.claude/improvements.md`

One sentence at the end of the status header paragraph: "Finding 4's
hook-input `effort` is an object `{ level }`, and the same level reaches a
worker's Bash tool as `$CLAUDE_EFFORT` (`issues/agent-effort/`, <date>)."

### Step 7 - task files, gates, commit

Update `plan.md` section 9 (status) and `handoff.md` per the template. Run
the verification commands. Stage every touched file **by name** (never
`-A`); never stage `issues/47/context.md` or `issues/tg-preview-refresh/`.
One commit, Conventional Commits, author per `CLAUDE.md`, no attribution
trailer, never push. Suggested subject:
`docs(agents): effort is <the branch's one-line fact>, not a dispatch choice`.

### Acceptance criteria

- `grep -n "set effort explicitly" .claude/prompts/orchestrate.prompt.md`
  prints nothing.
- `grep -rn "sonnet + high" .claude/prompts CLAUDE.md` prints nothing
  (every branch rewrites or deletes it).
- `grep -n "models/effort" CLAUDE.md` prints nothing; `wc -l CLAUDE.md` = 193.
- `orchestrate.prompt.md` <= 320 lines (313 now; the branch paragraphs add
  at most seven net). Record the count.
- K branches: `grep -c "^effort:" .claude/agents/*.md` shows 1 per file;
  noK/U: 0 per file.
- README: row 38 present, no row 39; the facts list present with a date; the
  agent table matches the frontmatter.
- `git status --porcelain` after the commit shows only
  `issues/tg-preview-refresh/` (untracked) and, if still there,
  ` M issues/47/context.md`.

### Verification commands

Every touched path is markdown; `.prettierignore` carries `*.md` and the
commit gate exempts `issues/**` and `.md` outside the two root READMEs, so
`npm run check` is not required and would prove nothing about these files.
Run:

```text
git diff --quiet .claude/hooks .claude/settings.json   # must exit 0: no hook touched
node .claude/hooks/selftest.mjs                        # 292 passed, 0 failed - only if 3.4 ever ran; proves the revert
grep -n "set effort explicitly" .claude/prompts/orchestrate.prompt.md
grep -rn "sonnet + high" .claude/prompts CLAUDE.md
grep -n "models/effort" CLAUDE.md
wc -l CLAUDE.md .claude/prompts/orchestrate.prompt.md
grep -c "^effort:" .claude/agents/*.md
grep -n "^| 3[89]" .claude/README.md
git status --porcelain
```

If any non-markdown file turns out touched, the fallback gate is
`set -o pipefail; npm run check 2>&1 | tail -n 120`, Bash timeout 600000,
one foreground call.

### Risks / do-nots

- Do not reopen the measurement inside B1; the verdicts in `context.md` are
  the input. A doubt about them is a report, not a re-run.
- Do not add an effort key on a NOT HONOURED or U-with-no-key verdict: a key
  the host ignores makes the file lie, which is the exact failure the
  `model: inherit` rule exists to stop.
- Do not use `git checkout --` or `git restore` on anything; both are
  blocked. Edit back by hand.
- Do not touch `issues/47/context.md` or `issues/tg-preview-refresh/`.
- Do not write model or effort routing decisions into `plan.md`/`handoff.md`
  beyond what this plan already carries as branch text.

### Fallback

None needed: every outcome has its text above. If a branch's paragraph
reads wrong against the rows (for instance C != `high` in the N branches),
substitute the measured value in the paragraph and record the substitution
in the handoff; do not replan.

## 7. Meantime - what the orchestrator does until Phase M is read

Until the rows exist: assume every worker runs at `high` - it is the model
default, and the only reading so far (a planner under a parent at `high`)
is consistent with it - and put no effort into a dispatch decision, since
there is no argument that carries one. Do not lower the session to save on
workers: it is unmeasured whether that reaches them, and it certainly
reaches the orchestrator.

## 8. Contracts and behaviour that stay stable

No public contract, route, fixture, spec, or production file is touched.
`bash-guard.mjs`'s deny rules and `selftest.mjs`'s 292 assertions are
untouched on the main path and proven untouched by `git diff --quiet` on
the fallback path.

## 9. Batches and status

| Batch | Scope | Actor | Status |
|---|---|---|---|
| Phase M | sections 3.1-3.6: C0, P1, F1, C1, P2, F2, C2, P3, S6 (if PROPAGATES), P4 (+ fresh-session repeat on a negative); rows and verdicts into `context.md`; tree clean after | orchestrator + human | **done** - PROPAGATES; key unverified (provisional, one confound named); S6 not taken |
| B1 | section 6, branch P+noK | implementer | **done**, committed - see `handoff.md` |

Phase M's cost: four probes of one echo each, one resume, two or three UI
flips, a scratch line reverted. Nothing is committed in Phase M.

## 10. Decisions taken, and the question open

Taken here, not to reopen:

- The instrument is the env var, not a hook (section 3.1, 4).
- No permanent hook; row 38 records why (section 4).
- One implementer batch after a non-batch measurement phase (section 5).
- Contrast levels are `low` and `high` only (section 3.2).
- P4 edits `implementer.md`, not a new probe agent file: the type is already
  in the dispatch list, so the only unverified thing is the watcher, and
  the fresh-session repeat covers that.
- Frontmatter `effort` is adopted only on a measured HONOURED verdict.

Open, for the owner (does not block Phase M; blocks B1 only in K branches):

**Q1.** If the key is honoured, which set does the frontmatter carry?
(A) the prompt's own tiers - `planner: medium`, `implementer: medium`,
`add-source: high`, `refresh-artwork: medium`, `reviewer: high` - which
makes "economy-mid" real for the first time and lowers per-run cost with
some quality risk on implementers; or (B) `high` in all five, which changes
nothing measured and only makes the files describe it. Recommendation: A,
because it is what the prompt already claims to be doing and the reviewer
plus one remediation cycle exist to catch a thrashing implementer; the
owner may also name any other five values. The orchestrator owns tiers per
`CLAUDE.md`; the planner is not choosing them, only recording the two
coherent sets.

## 11. Deferred

- Whether `permissionMode: plan` interacts with `effort` - untested, no
  reason to think so.
- Skill frontmatter `effort` (docs mention it) - no skill here declares it;
  out of scope.
- A `SubagentStop` hook reading `effort.level` for per-worker accounting -
  same objection as row 38; only if a recorded mistake ever needs it.
