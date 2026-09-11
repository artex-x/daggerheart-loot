# Orchestration improvements

Status, updated 2026-09-09. Finding 1 (long-running checks) shipped in the prompts at
60172d3 and is now also a hook (issue 65). Finding 2 (model defaults) shipped at
60172d3. Finding 3 (shared context) shipped in the template at 60172d3. **Finding 4
(the usage nudge) was built, measured, and withdrawn at 79e26c9: the five-hour window
is not readable on this host. Do not rebuild it.** Findings 5 and 6 (the parity
harness, the vitest timeout) belong to issue 47; 5a and 5b shipped at f7308a9.
Finding 1's "do not design around resumption being available" is withdrawn 2026-09-11:
`SendMessage` resumes a subagent on this host - `.claude/README.md`,
"Resuming a worker". Finding 4's hook-input `effort` is an object `{ level }`,
and the same level reaches a worker's Bash tool as `$CLAUDE_EFFORT`
(`issues/agent-effort/`, 2026-09-11).

Findings from the 2026-09-09 session (TASK 47, batches B3.5 and the B3.6
planning), and an implement-ready plan. Written for whoever picks up the
orchestration wiring next; unrelated to the migration backlog, which stays in
`issues/47/`.

Everything below is grounded in what actually happened in one session. Where a
claim depends on a Claude Code capability, the source is named and the parts
that still need a live test are marked.

## What the session cost, and where it went

| Worker | Model | Tokens | Tools | Wall clock | Outcome |
|---|---|---|---|---|---|
| planner | Opus | 179k | 46 | 13 min | complete, good |
| implementer #1 (B3.5) | Sonnet | 170k | 87 | 17 min | **stopped early**, nothing committed |
| implementer #2 (B3.5, cold restart) | Sonnet | 319k | 169 | 81 min | complete |
| reviewer (B3.5) | Opus | 244k | 175 | 21 min | complete; found 2 blockers + a wrong diagnosis |
| implementer #3 (fix-pass) | Sonnet | 212k | 114 | 41 min | **stopped early**, left work uncommitted |

Roughly 1.12M subagent tokens. The 5-hour window was exhausted mid-session.

## Finding 1 - workers abandon long-running commands, and cannot be resumed

**The single largest waste.** Two of three implementers stopped and handed
control back because a command they launched was still running:

- #1 launched `node tests/parity.js "tables"` in the background, then returned.
- #3 launched `npm run check`, set up a monitor, then returned.

Both times the agent's shell died with it, so the command's result was lost
even though the command itself had finished. #1's replacement was a **cold**
agent that re-read every file and re-ran the parity run: 319k tokens to finish
work a resumed agent would have completed for a fraction of that.

`SendMessage` was **not available in this session**, so a stopped worker could
not be resumed at all. Checked afterwards: the documentation is explicit that
it "doesn't require agent teams to be enabled", needs no setting or flag, and
that general-purpose and custom subagents return an agent id precisely so they
can be resumed with full history. So its absence here is a gap in this
desktop-app build, not something to configure - it was not in the tool list and
`ToolSearch` found no deferred tool by that name. Worth trying the same
orchestration from an interactive `claude` terminal session. Either way, do not
design around resumption being available.

Root cause is structural, not a model failure. The Bash tool's foreground
timeout is 600s max. The commands in question:

| Command | Duration | Fits in 600s? |
|---|---|---|
| `node tests/parity.js "tables"` | ~9 min (540s) | barely |
| `node tests/run-all.js parity` (full) | ~867s on CI | **no** |
| `npm run check` | several min | yes |

So a worker that wants a full parity run has no foreground option and is pushed
into a background pattern its prompt never taught it to survive.

**Fixes, in order of value:**

1. **Make the runs shorter** - see Finding 5. This dissolves the problem rather
   than working around it.
2. **Teach the worker prompts the pattern.** Add to
   `.claude/prompts/implementer.prompt.md` and the `implementer` agent:
   > A long check is run in the **foreground** with an explicit timeout
   > (`timeout: 600000`), not in the background. If a command cannot fit in ten
   > minutes, split it with a filter and run the parts in sequence. Never end
   > your turn with a check still running: either it has finished and you have
   > read its result, or you stop and say in the handoff exactly which command
   > was left unrun. Returning control with work uncommitted and a command
   > in flight loses both.
3. **Orchestrator rule:** before dispatching, state which checks the batch
   needs and whether each fits in one foreground call. If the full parity suite
   is required, say so and expect to run it yourself after the worker commits.

## Finding 2 - `model: inherit` silently defeats the documented default tiers

`.claude/agents/implementer.md` says "Default tier: economy (Sonnet)" but sets
`model: inherit`. `inherit` means *the session model*, so an implementer
dispatched without an explicit `model` runs on **Opus** - the opposite of the
documented default, and the fastest way to burn the 5-hour window. The same
applies to `reviewer` and `add-source`.

It worked this session only because the orchestrator passed `model` explicitly
every time. That is a rule enforced by memory, which is the kind that fails.

**Fix:** set the frontmatter to the intended default and let the orchestrator
raise it explicitly.

| Agent | Now | Change to |
|---|---|---|
| `implementer` | `model: inherit` | `model: sonnet` |
| `add-source` | `model: inherit` | `model: sonnet` |
| `reviewer` | `model: inherit` | `model: sonnet` |
| `planner` | `model: opus` | unchanged - correct |

Then amend `.claude/prompts/orchestrate.prompt.md`: escalation is an explicit
`model` argument per dispatch, and the reason is announced in chat. The
existing "Agents must not choose models" rule stays true and becomes enforceable
by the file rather than by the orchestrator remembering.

**Model selection was otherwise sound.** Opus for the planner and reviewer
earned its cost: the reviewer found two real blockers plus the fact that the
whole "machine drift" diagnosis was wrong, which changed the next batch's plan.
Sonnet handled the implementer work correctly - its two early stops were prompt
gaps, not capability gaps.

## Finding 3 - shared context worked, and should carry more

`issues/47/context.md` was created this session and did its job: the planner,
three implementers and the reviewer all read it and none re-fetched the issue.
Worth adding to it as standing sections, because each was re-derived by hand at
least once this session:

1. **A repo command table** - what each check costs in wall clock, and whether
   it fits one foreground call. Every worker rediscovered that a parity run
   takes nine minutes.
2. **The measurement method**, once, as a named recipe rather than prose
   repeated in three prompts: harness launch args
   (`--no-sandbox --disable-dev-shm-usage --disable-gpu`), both `index.html`
   and `dist/index.html`, read computed styles and `getBoundingClientRect()`
   through `page.evaluate`. Better still, commit it as
   `tools/probe.mjs <route> <selector>` so nobody writes it a fourth time.
3. **A "disproved reasons" list.** Three `VISUAL_DEBT` causes were withdrawn
   this session. Without a written record the next session re-derives them from
   the same diff images.
4. **Which machine is authoritative** for any recorded number.

`.claude/templates/context.template.md` should grow headings for 1, 2 and 4.

## Finding 4 - a 5-hour-window wrap-up nudge is buildable, with one indirection

**Verified against the docs.** Hooks receive no usage data at all: the hook
input is `session_id`, `prompt_id`, `transcript_path`, `cwd`,
`permission_mode`, `effort`, `hook_event_name`, `agent_id`, `agent_type`. No
tokens, no cost, no rate limits.

The **statusLine** command does receive it:

- `rate_limits.five_hour.used_percentage` - 0 to 100
- `rate_limits.five_hour.resets_at` - Unix epoch seconds
- also `seven_day` and `spend_limit`, plus `cost.*` and `context_window.*`

Caveats from the docs, all of which the script must handle:

- `rate_limits` appears **only for Claude.ai Pro and Max subscribers**, and
  only after the first API response in the session.
- Each window may be independently absent; a window is dropped once its
  `resets_at` passes. Use `jq -r '.rate_limits.five_hour.used_percentage // empty'`.

So the design is **statusline writes, hook reads**:

1. A statusLine script prints the status line as normal and *also* side-writes
   the five-hour figures to a small file, e.g. `.claude/.usage.json`.
2. A hook reads that file and, past a threshold, returns `additionalContext`
   asking for a clean wrap-up.

One documented detail makes or breaks this, and it happens to describe our exact
situation:

> The event-driven triggers can go quiet when the main session is idle, for
> example **while a coordinator waits on background subagents**. To keep
> time-based or externally-sourced segments current during idle periods, set
> `refreshInterval` to also re-run the command on a fixed timer.

Without `refreshInterval` the usage file goes stale for exactly the 20-80
minutes a worker is running - which is when the nudge matters. Set it to 30s.

### Prior art, and what it changed

Checked before trusting our own design, weighting by stars - a repository with
one star is not evidence of anything.

| Repository | Stars | What it is |
|---|---|---|
| [ryoppippi/ccusage](https://github.com/ryoppippi/ccusage) | 18,453 | reads local usage data from agent CLIs; beta statusline mode. Retrospective analytics for a human |
| [Maciek-roboblog/Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) | 8,687 | real-time usage monitor with predictions and warnings, for a human |
| [Astro-Han/claude-pace](https://github.com/Astro-Han/claude-pace) | 229 | statusline + rate-limit tracker, reads `rate_limits` from stdin |
| others found (`cc-usage-monitor`, `claude-code-statusline`, `claude-usage-monitor`, `CustomStatusline`, `claude-handoff`, `claude-code-handoff`, `memory-toolkit`) | 1-54 | below the bar; not used as evidence |

Two conclusions:

1. **Nobody credible steers the agent.** Every one of these is a display for a
   person. claude-pace's README is explicit that it "does not inject context,
   warnings, or hooks into Claude itself", and ccusage is a reporting utility
   with no capability to redirect behaviour on a threshold. So the nudge half
   of this design has no prior art to copy - a reason to keep it simple and
   fail silent, not a reason to doubt it.
2. **The data source is confirmed.** claude-pace takes the same route we do -
   `rate_limits` from statusline stdin, no network calls. It also names a
   version floor we did not know: **`rate_limits` needs Claude Code 2.1.80+**,
   and it shows `--` below that. Worth stating rather than rediscovering.

**And one real correction, borrowed.** claude-pace refuses to cache quota at
all: "a cached account-level snapshot cannot be proven to belong to the current
provider/account". That is a fair objection to our `.usage.json`, and one a
hook cannot dodge by reading live data, because hooks are given none. So the
snapshot now carries the `session_id` that produced it, and the guard discards
a file written by any other session - closing the account/provider mismatch
that the ten-minute staleness check did not cover.

### Built, and tested end to end

`.claude/statusline.mjs`, `.claude/usage-guard.mjs`, wired in
`.claude/settings.json` with `refreshInterval: 30000`.

**Written in Node, not bash + jq, and that was not a style choice.** The first
version was a shell script; `jq` is not installed on this Windows box, so the
guard's defensive `command -v jq || exit 0` made it exit silently every time -
a guard that can never fire, failing in exactly the way it was designed not to.
Node is guaranteed present in a Node project and parses stdin JSON without
shell-quoting hazards.

Verified by feeding both scripts real-shaped payloads:

| Case | Result |
|---|---|
| `rate_limits` present, 84% | status line renders amber, `.usage.json` written, guard emits the "finish" nudge |
| same window, second call | silent - one warning per threshold per window |
| 92% | guard emits the "stop and write the handoff" message |
| `rate_limits` absent (non-Pro/Max, or below 2.1.80) | status line still renders, guard silent |
| `.usage.json` older than 10 minutes | guard silent - a stale number is not evidence |
| `.usage.json` from a different `session_id` | guard silent |
| `.usage.json` missing | guard silent |

Thresholds: **75%** "finish this batch, start no other", **90%** "stop and
write the handoff". `.claude/.gitignore` keeps `.usage.json` and the marker out
of the repo.


**`SubagentStop` is the right event** - it is precisely "a worker just
finished", which is the moment the orchestrator decides whether to dispatch
another. Two things to confirm by test before relying on it, because the docs
enumerate `additionalContext` for `UserPromptSubmit` and the tool-use events
explicitly but describe it only as available across "most events":

1. that `SubagentStop` honours `additionalContext` (or `systemMessage`);
2. that hooks fire for the **main session** when a subagent stops, not inside
   the subagent's own context, where the nudge would be useless.

Test: a hook that echoes a fixed sentinel string, one throwaway subagent, and a
look at whether the sentinel reaches the orchestrator's context. If it does
not, fall back to `UserPromptSubmit` (documented) plus a `PostToolUse` variant
throttled to fire at most once every few minutes.

Thresholds worth two levels rather than one: **75%** "finish this batch, do not
start another", **90%** "stop now, write the handoff".

## Finding 5 - the parity harness is the bottleneck, and it is fixable

`node tests/run-all.js parity` takes **867s on CI** and ~9 min locally for the
`tables` filter alone. It is the reason workers reach for background execution
(Finding 1), the reason a full run gets skipped in favour of a filter, and
therefore the direct cause of CI having been red for eight runs without anyone
noticing.

Two structural facts, read off `tests/parity.js`:

1. **The whole run is sequential.** `for state -> for lang -> for target -> for
   width`, with `no-await-in-loop` disabled at the two hot spots. One page at a
   time.
2. **The `legacy` side is re-shot on every single run**, even though the static
   root is frozen by policy - CLAUDE.md forbids touching `index.html`, `app.js`
   and `style.css`, because they *are* the expectation.

### 5a. Cache the legacy screenshots - biggest win, lowest risk

Content-address them. Key each cached PNG on a hash of everything that can
change it: `index.html`, `app.js`, `style.css`, `data.js`, the referenced
assets, plus the state's own `id`/`route`/`enter` source and the viewport list.
Cache hit means the file is byte-identical to what the run would have produced,
so this cannot mask a difference. Miss re-shoots and re-stores.

Expected saving is close to **half the wall clock** - the legacy side is one of
two page opens per state per language, plus two more per press spec.

Safety: a `--no-cache` flag, the hash manifest written next to the cache, and
CI naturally cold on a fresh runner unless the cache is deliberately restored.
Store under `test-output/` or a gitignored `.cache/`, never in the repo.

### 5b. Shard the CI run - safe, no determinism risk

Split `STATES` across a job matrix (4 shards ≈ 220s each) and fail the gate if
any shard fails. Costs runner minutes, not correctness, and it removes the
excuse for treating a filtered local run as the gate.

### 5c. Parallelise locally - measure before adopting

A pool of 2-4 pages in one browser would cut the rest. **Approach with care:**
this repo has already been bitten by CPU contention producing spurious
timeouts - the B3 handoff documents five bogus `Test timed out in 5000ms`
failures from a vitest run overlapping a parity run's browsers. Screenshot
determinism under load is exactly what must not regress.

Do it behind a flag, default off, and adopt only after a run at the chosen
concurrency reproduces every recorded number exactly - the same evidence bar
the reviewer used to rule out machine drift.

### 5d. Cheap wins worth checking while in there

- The nonvisual specs already run once at `WIDTHS[0]` rather than per width -
  good, and the comment says so. Keep that.
- Press specs re-open a page per target per spec. If several press specs share
  a state, one arrival could serve them.

## Finding 6 - the test suite's timeout is set below the work, and one timeout cascades

Diagnosed this session after `npm run check` produced **66 failures** on a tree
whose only uncommitted changes were `tests/parity/specs.js` and markdown -
neither of which vitest even loads (`include: ['src/**/*.test.ts']`, rooted at
`app/`).

Two mechanisms, and both need fixing:

1. **`vite.config.mts`'s `test` block sets no `testTimeout`**, so vitest uses
   its 5000ms default - while the a11y specs legitimately take 5-13 seconds
   each, because axe over a full page in jsdom is slow. The timeout is simply
   below the work.
2. **A timed-out test leaves `axe.run()` in flight, and axe holds a global
   lock**, so every later a11y test dies with `Axe is already running`. One
   timeout becomes a cascade. That is why the failure count swings with load
   rather than staying put: 53 alone, 66 during a `check`, 92 with a single
   puppeteer probe running alongside.

Proof it is nothing else: `npx vitest run --root app --testTimeout=30000
src/components/a11y.test.ts` passes **17 of 17**, where the same file fails
wholesale at the default.

Three sessions have now written occurrences of this off as "contention" in a
handoff. It is not contention, it is a config value, and the practical effect
is that `npm run check` cannot be trusted while anything else runs on the
machine - which trains everyone to re-run a red gate until it goes green. That
habit is how the red CI run in B3.6 part 1 went unexamined for eight builds.

Scoped into **B3.6 part 0**. Measure the slowest tests and set the value from
what the work costs, rather than picking a round number; consider scoping the
larger timeout to the a11y specs so a genuinely hung test still fails; and fix
the axe lock so a single timeout stops taking the rest of the file with it.

## Suggested batching

**Fold 5a and 5b into B3.6 as part 0**, before part 1's diagnosis work. The
reasoning: part 1 will run the suite many times, so halving it pays for itself
immediately, and 5a cannot change a pixel, so it does not compromise the
instrument while it is being used to diagnose. Keep **5c out** of B3.6 - it can
change timing, and B3.6 part 2 is about making measurements trustworthy.

**Findings 1, 2 and 3 are a separate, small wiring batch** and do not belong to
issue 47 at all: they touch `.claude/agents/*`, `.claude/prompts/*` and
`.claude/templates/*`. Do them first - they are minutes of work and they change
how every later batch runs.

**Finding 4 is its own batch**, gated on the `SubagentStop` test above. It has
a real prerequisite (a Pro or Max subscription for `rate_limits` to appear at
all) and should degrade silently when the field is absent.
