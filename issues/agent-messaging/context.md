# Shared task context - TASK agent-messaging

Orchestrator maintains this file so later steps do not re-measure the same
capability. Task id chosen by the orchestrator (the human named no id); rename
it if the owner prefers another.

## Goal

`SendMessage` works on this host. The standing rules in
`.claude/prompts/orchestrate.prompt.md` say it does not, and were written when
it did not. Decide what the agent flow should be now that an agent can be
resumed instead of replaced - specifically whether review feedback should reach
the implementer directly, as the owner proposed, and what else the capability
changes - then update the prompt files that encode the old constraint.

## GitHub issue (if any)
- URL: none. Owner request in session `daggerheart-loot-7a`, 2026-09-11.
- Decisions already settled: none. The whole design is open.
- Open questions: see "Constraints", below - the loop and gate questions are
  the substance of this task.

## Measured capability (orchestrator, 2026-09-11) - do not re-probe

Measured on the Windows 11 desktop app, the host the old rule names.

| direction | status | evidence |
|---|---|---|
| main session -> its own subagent | **works, context intact** | The B9 implementer (`a99b03dc35a04a1d3`) was resumed with the reviewer's blocker after its turn had ended. It kept every B9 fact and needed no re-derivation; result was commit `84ca6df`. |
| subagent -> main session | **works** | A `general-purpose` probe loaded `SendMessage` via `ToolSearch` and delivered a line into the main conversation, which arrived wrapped as `<agent-message from="...">`. |
| subagent -> sibling subagent | **UNPROVEN** | The probe reported a sibling, but the id it reported (`ae2d6cc4d12af78d3`) is its own. Only one subagent was alive. Nobody may design on this until it is measured with two. |

Also measured: `SendMessage` is **not** in a subagent's default tool list on
this host - the probe had to load it with `ToolSearch` (`select:SendMessage`)
first. `ListAgents` **is** built in, and from inside a subagent it returns the
parent session, the subagent itself, and all peer sessions on the machine.

Mechanics that matter to the design, from the tool's own contract: a send to an
agent by name or id **resumes it from its transcript**, so "message" and
"revive a finished worker" are the same act; and a subagent's send "goes out
under your parent session's address, and any reply is delivered to the parent
session's conversation, not to you" - so a subagent cannot receive a reply to
its own send.

## What the old rule says, and where

`.claude/prompts/orchestrate.prompt.md` encodes the disproved claim in three
places, all of which currently instruct the orchestrator to ask the human
instead of resuming a worker:

- "A worker waiting on a background check: wait with it", third bullet - "**If
  this host cannot resume it, ask the human.** Measured 2026-09-10 on the
  Windows desktop app: `SendMessage` is disabled for the main session and for
  subagents alike".
- "A worker that went quiet is not a worker that died", the paragraph after the
  heading - same claim, same date.
- The same section's item 4, "Prefer resuming to replacing ... If only the
  human can resume it, ask".

The **conclusions** in those sections are still right and were re-proved this
session (prefer resuming to replacing; a live agent holds context a cold one
re-derives at full cost). Only the premise about the host is false.

## Reasons already disproved

- "`SendMessage` is disabled on the Windows desktop app for the main session
  and for subagents alike" (recorded 2026-09-10). **False as of 2026-09-11**,
  both halves, by the table above. Whether the host changed or the original
  probe was wrong is not known and does not matter.

## Constraints

The design has to answer these, and they are the reason this is a planning
task rather than an edit:

- **Review returns to the orchestrator only** and **max one remediation
  cycle** are current standing rules with a stated purpose: the orchestrator
  filters blockers from nits and stops review->fix->review loops. A direct
  reviewer -> implementer channel removes that filter and has no natural
  stopping condition. This session's own remediation shows the filter doing
  real work: the orchestrator told the implementer that the reviewer's
  third-deviation concern was already resolved and not to be re-litigated.
- **One writer on this branch at a time.** Resuming a finished implementer
  while another writer is live is the same violation as spawning one; a
  messaging rule has to say who checks.
- A reviewer is **read-only**. A reviewer that can resume a writer has, in
  effect, gained write access through a proxy. Say plainly whether that is
  acceptable and under what gate.
- The tool contract above means a subagent cannot hold a conversation - its
  reply lands in the parent's conversation. So "reviewer and implementer talk
  it out" is not available on this host even if sibling sends work; what is
  available is one-way dispatch.

## Planner facts (2026-09-11), read from contracts and code - not probed

- `SendMessage`'s parameters are `to`, `message`, `summary`,
  `notify_when_idle`. No `model`: a resumed agent keeps its tier, so
  escalation is a fresh dispatch. `notify_when_idle` is cross-session and
  main-conversation only; nothing in this design uses it.
- `TaskStop` accepts a named background agent by name.
- Commit gate: `isExempt` (`bash-guard.mjs` ~line 246) exempts `issues/**`
  and every `.md` except the two root READMEs. B1 touches only `.md`
  files, so `npm run check` is neither required nor able to see it.
- `selftest.mjs` runs the eight hook scripts in `ALL_SCRIPTS` against a
  scratch repo; it covers no prompt, agent or README text.
- The claim's only carrier outside `orchestrate.prompt.md` is
  `.claude/improvements.md` Finding 1 (2026-09-09, "do not design around
  resumption being available"). `issues/47/` carries none.
- `.claude/agents/reviewer.md` has `permissionMode: plan`; whether that
  blocks `SendMessage` is unknown and unused.

## Do not re-fetch unless
- The host's capability changes (re-probe, do not assume)
- A second subagent is available to settle the sibling-to-sibling row
- B1 is implemented and committed (2026-09-11); see `handoff.md` for the commit and gate results - do not re-plan or re-open Q1

## The owner's answer on Q1 (orchestrator, 2026-09-11)

The planner's `NEEDS_HUMAN_CONFIRMATION` question, put to the owner and
answered the same session. **The owner accepted the recommendation: keep review
feedback orchestrator-relayed, and make the fix-pass cheap by resuming the
batch's own implementer rather than dispatching a cold one.** The fallback in
`plan.md` section 7 - direct reviewer -> implementer - is **not** taken, and
the two-subagent sibling measurement it would have required is therefore not
needed.

The owner's original proposal was direct reviewer -> implementer routing; they
overruled themselves on the evidence, chiefly that direct routing is not
actually available on this host (sibling delivery unproven; a subagent's reply
lands in the parent's conversation regardless), so it would drop the
blocker/nit filter without dropping the hop. B1 is unblocked and unchanged.
