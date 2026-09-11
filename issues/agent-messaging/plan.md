# Plan - TASK agent-messaging

`SendMessage` works on this host. `.claude/prompts/orchestrate.prompt.md`
says it does not, in three places, and each of them tells the orchestrator
to ask the human instead of resuming a worker. This plan decides what the
agent flow is now that a finished worker can be resumed with its context
intact, evaluates the owner's proposal to route review feedback straight to
the implementer, and makes one batch implement-ready. Local-only task id; no
GitHub issue. Read `context.md` first (the measured capability table is
there and is not re-probed here), then this file, then `handoff.md`.

Planner pass 2026-09-11. One question for the owner: section 8, Q1. The
batch is written so that "yes" needs no replanning and "no" is the named
fallback.

**Status (2026-09-11): B1 implemented and committed.** The owner accepted
the recommendation in section 3 (relay stays; resume the batch's own
implementer for fix-passes) - see `context.md`, "The owner's answer on Q1".
The fallback in section 7 was not taken. See `handoff.md` for the commit,
gate results, and the one recorded deviation (line count).

## 1. Objective and current state

- Three places in `orchestrate.prompt.md` (lines 86-90, 160-166, 181-183)
  record that `SendMessage` is disabled on the Windows desktop app and
  route around it by asking the human. `context.md` measured the opposite
  on 2026-09-11: main -> own subagent resumes with context intact (the B9
  remediation, commit `84ca6df`); subagent -> main works after a
  `ToolSearch` load; sibling -> sibling is **unproven**.
- The conclusions those sections reach (verify status before acting; wait
  with a live run; prefer resuming to replacing) were re-proved by the same
  measurement. Only the premise about the host is false.
- `.claude/improvements.md`, Finding 1 (2026-09-09), is the origin of the
  claim: "do not design around resumption being available". It is a dated
  status document and needs one withdrawal line, not a rewrite.
- No production code, no public contract, no spec. Every file the batch
  touches is markdown; the commit gate exempts all of them (`isExempt` in
  `bash-guard.mjs`: `issues/**` and every `.md` except the two root
  READMEs). `selftest.mjs` exercises the eight hook scripts and nothing
  here changes a hook script, so it covers nothing in this batch.

## 2. Evidence the design rests on

From `context.md` (measured, not re-probed): the three-row capability
table; `SendMessage` absent from a subagent's default tool list (needs
`ToolSearch select:SendMessage`); `ListAgents` built in for subagents and
listing parent, self and peers.

From the tool contracts as this host prints them (read this session, not
measured):

- `SendMessage`: "names keep working after an agent completes (a send
  resumes it from its transcript)". Parameters are `to`, `message`,
  `summary`, `notify_when_idle`. **There is no `model` argument**, so a
  resume cannot change an agent's tier.
- `SendMessage`: "if you are a subagent, your send goes out under your
  parent session's address, and any reply is delivered to the parent
  session's conversation, not to you". So two subagents cannot hold a
  conversation on this host even if sibling delivery worked; what exists is
  one-way dispatch, and every reply lands in the orchestrator.
- `SendMessage`: `notify_when_idle` is for sessions on this machine, "from
  the main conversation only" - a cross-session feature, not a subagent one.
  Nothing here uses it.
- `Agent`: "Use SendMessage with the agent's ID or name to continue a
  previously spawned agent with its context intact; a new Agent call starts
  fresh." A resumed agent's reply arrives as the same task notification a
  first turn does.
- `TaskStop` accepts a named background agent by name.

From the repository:

- `.claude/agents/reviewer.md` carries `permissionMode: plan`. Whether plan
  mode blocks `SendMessage` is unknown and nothing may depend on it.
- `.claude/README.md` candidate table: rows 19 and 29 reject hooks whose
  matcher or input is unverified on this host (`agent_type` strings; `Agent`
  vs `Task` as the dispatch tool name). The standing bar for a new hook is a
  repeated recorded failure (row 29, "has not been given a chance to fail").
- The commit gate is exempt for this batch (section 1), so `npm run check`
  is neither required nor able to see the change (`.claude/README.md`,
  "What the check does not cover: markdown").

## 3. Question 1 - reviewer -> implementer directly, or relayed?

**Recommendation: keep the relay, and make it cheaper by resuming the
batch's own implementer with the filtered blockers instead of dispatching a
cold fix-pass agent.** That is exactly what the B9 remediation did on
2026-09-11 and it is the measured win: the implementer kept every B9 fact,
re-derived nothing, and produced `84ca6df`. The relay message is short - the
verdict, the blockers quoted, the points already settled and not to be
re-litigated, HEAD, the gates - and it costs the orchestrator one send.

Why not direct (the owner's proposal), each reason sufficient on its own:

1. **It is not available.** Sibling -> sibling is unproven (`context.md`),
   and even if it delivers, the implementer's reply lands in the
   orchestrator's conversation, not the reviewer's. The reviewer cannot see
   whether its blocker was fixed; the orchestrator sees it regardless. A
   direct send removes the filter but not the hop.
2. **The filter did real work this session.** The orchestrator told the
   implementer that the reviewer's third-deviation concern was already
   resolved and not to be re-litigated (`context.md`, "Constraints"). A
   reviewer that speaks straight to the implementer sends that concern
   again, and a Sonnet implementer following its prompt ("follow the plan
   tightly") re-litigates it.
3. **"Max one remediation cycle" needs an enforcer.** Review -> fix ->
   review has no natural stopping point; the orchestrator is the only party
   that sees all three roles and counts cycles. Nothing else can.
4. **A read-only reviewer that resumes a writer writes by proxy.** The
   reviewer's `permissionMode: plan` is the repository's statement that it
   does not change the tree. A send that makes a writer act is a write
   with one indirection. Not acceptable under any gate short of the
   orchestrator's, which is the relay.
5. **One writer per branch has to be checked by someone who can see the
   whole agent list and the tree.** The reviewer runs after the implementer
   finished, but the orchestrator may have resumed that implementer for a
   lost check, or a peer session may hold the tree. The orchestrator does
   the `ListAgents` and `git log` preflight before every dispatch; the
   reviewer does not and should not.
6. **It would be the first rule telling a subagent to send.** `SendMessage`
   needs a `ToolSearch` load in a subagent, the reviewer would need the
   implementer's exact name, and both are new prose for a role that runs
   rarely. Every sentence of it is a place to fail, for a loop the design
   does not want.

Rejected alternatives, so nobody re-derives them:

- **Reviewer writes its findings into `handoff.md` for the implementer to
  read.** A write from a read-only role; the same proxy problem in a file.
- **Orchestrator forwards the review verbatim.** Cheaper than filtering,
  loses the one thing the relay is for (reason 2). Quote the blockers
  verbatim; drop nits into the handoff's Deferred; add the settled list.
- **Reviewer and implementer "talk it out".** Not possible on this host:
  subagent replies land in the parent. Recorded in the prompt so it is not
  proposed again.
- **Reviewer sends to `main` mid-turn.** Its final report reaches the
  orchestrator anyway; a mid-turn send adds a tool load for nothing.

One thing the capability does buy the review path: **when a second look is
warranted after remediation, resume the same reviewer.** It holds the batch,
the diff and its own findings; a cold re-review re-reads everything the
first one read. The rule "do not auto-review again unless contracts/UI
still changed and risk rules still match" stands unchanged - this only
says who reviews when one is due.

## 4. Question 2 - what resuming changes elsewhere

| Rule (orchestrate.prompt.md) | Verdict | What changes |
|---|---|---|
| "Wait with it", bullet 1 - something is running: wait | still right, same reason | nothing |
| "Wait with it", bullet 2 - nothing running: result is gone, re-run in the foreground, resume the worker | still right; now actionable | says how: `SendMessage` to the worker's name with the one instruction |
| "Wait with it", bullet 3 - if this host cannot resume it, ask the human | **obsolete** | deleted; nothing replaces it. Asking the human is no longer cheaper than anything |
| "Third occurrence" and "And that did not work" paragraphs | obsolete as narrative - the hook shipped (`b6a2fcd`, rows 27/28) and the README candidate table holds the history | collapsed to three lines pointing at rule 2g/2h and the README |
| "While nothing is running, a foreground check of your own" | still right, better reason | unchanged text: it now hands the *resumed* worker its next action instead of a shrug, which was already the sentence |
| "Went quiet", preamble - the human can resume it, the orchestrator cannot | **premise false**, conclusion right | premise corrected in one sentence; the 2026-09-09 duplicate-agent story kept as one sentence (it is the rule's origin) |
| "Went quiet" items 1, 3, 5 - `ListAgents` first; `TaskStop` then inspect then dispatch; say "stopped" not "died" | still right, same reason | nothing |
| "Went quiet" item 2 - never dispatch a replacement for an agent that shows `running` | still right, now broader | gains "or resume a finished writer": both are two writers on one tree |
| "Went quiet" item 4 - prefer resuming to replacing; if only the human can, ask | conclusion right, premise false | becomes the pointer to the new "Resume, do not replace" subsection |
| Replace-vs-resume | new, was implicit | resume is the default; replace only when the agent shows `killed` or the send fails, when its transcript is the problem, or when the tier must change (no `model` on a resume) |
| One long-lived worker per batch vs dispatch-and-forget | new | **one worker per batch, resumed within it** - for a lost check, the review's blockers, an uncommitted change at closeout, a question the orchestrator can answer. **Not across batches**: `plan.md`/`handoff.md` are the memory between batches by design, a worker kept alive lets them rot (the `Stop` hook already warns about stale handoffs), and every resume replays the whole transcript, so cost grows with age |
| "After review", fix-then-continue - dispatch a writer ONCE for blockers | still right, cheaper | "resume the batch's writer ONCE" with the relay message; a cold fix-pass is the fallback when "Resume, do not replace" says spawn |
| "After review", replan - dispatch planner ONCE, then writer ONCE | still right, cheaper | resume the planner if `ListAgents` lists it, else dispatch; then resume the writer |
| "After review", no auto re-review | still right | adds: when a second look is due, resume the same reviewer |
| Closeout step 4 - send exactly one writer to verify and commit | still right | "resume the batch's writer, or dispatch exactly one" |
| Model selection | still right | one sentence in the new subsection: escalation is a fresh dispatch because a resume carries no `model` |
| Session ending, "Do not do the planner's job", "Your writers are not the only writers" | untouched by the premise | not edited for content; see section 6 for length |

`implement.prompt.md` step 7's last sentence ("If you must stop first, name
the command and its task id") gains one clause: the orchestrator can resume
you with your context intact, so say exactly where you stopped. That makes
the worker's early ending useful to the resume instead of to a cold reader.
No other worker prompt changes: no worker needs to send anything (its final
message is its report), and a rule nobody uses is a rule that rots.

## 5. Question 3 - guardrails, and whether any wants a hook

The rules, each one sentence in the prompt:

- **A resume is a dispatch.** It gets the spawn's preflight: `ListAgents`
  shows no other writer `running`; `git log --oneline -3` re-read and HEAD
  named in the message. Resuming a finished writer while another is live is
  the same violation as spawning one.
- **Only the orchestrator resumes a writer.** The reviewer returns findings
  and sends nothing to anyone (review prompt and agent file say so).
- **Nothing depends on sibling -> sibling.** Recorded as unproven in the
  README's facts, with the two-agent measurement named as the thing that
  would settle it.
- **A subagent that is told to send must be told to load the tool first.**
  No rule in this batch tells a subagent to send, so the sentence lives
  in the README's facts, not in a prompt. If a later rule adds a subagent
  send, it copies that sentence.

Does any of it want a hook? Written in the README's candidate-table voice
so the rows can move there when the batch ships:

| # | Candidate | Event | Verdict | Reason |
|---|---|---|---|---|
| 35 | Deny `SendMessage` to a writer while another writer is live | `PreToolUse(SendMessage)` | **reject** | The input does not exist in a hook: liveness and role come from `ListAgents`, which a hook cannot call - it gets stdin JSON and nothing else. The matcher is unverified on this host (`tool_name` for `SendMessage` has never reached a hook here; #19/#29-shaped). Zero recorded failures; the standing bar is a repeated one. The prompt's "a resume is a dispatch" sentence owns it. |
| 36 | Deny the reviewer any `SendMessage` (write-by-proxy) | agent frontmatter `disallowedTools`, not a hook | **reject for now**, sketched | The cheaper instrument exists (row 19's argument): one frontmatter line in `reviewer.md`. But `disallowedTools` is unverified as a key this host honours, `SendMessage` is not in a subagent's default tool list so sending needs a deliberate `ToolSearch` load - a guard against habit and haste has no habit to guard here - and the failure has never been recorded. If a reviewer ever sends: add `disallowedTools: SendMessage` (or the key the host documents) under `permissionMode: plan` in `.claude/agents/reviewer.md`, and verify with a probe that the reviewer's `ToolSearch select:SendMessage` then returns nothing. |
| 37 | Warn on a second implementer dispatch for the same task while a completed one is listed | `PreToolUse(Agent)` | **reject** | The dispatch tool is `Agent` here and `Task` in the reference - the unverified matcher row 29 already rejects - and the hook cannot see the agent list. "Resume, do not replace" is a preference, and a wrong warning on a legitimate fresh dispatch (tier change, killed agent) is the one thing a guard must not do. |

So: no hook, one frontmatter sketch held until a failure, and the rules stay
sentences - short ones, in a section the orchestrator reads at the moment it
acts (the "went quiet" list and "After review"), not a fourth paragraph in a
dispatch.

## 6. Question 4 - length

`orchestrate.prompt.md` is 310 lines. The corrected sections shrink as they
are corrected: the two "did not work" paragraphs (13 lines) become three,
the "went quiet" preamble drops four, bullet 3 is deleted, the section's
opening paragraph loses two. The new "Resume, do not replace" subsection is
16 lines and carries only rules; the facts and the why go to
`.claude/README.md`, which is where "Run a long check" already keeps its
reasoning while the prompts quote one line. The planner's count of the
verbatim blocks: 310 - 2 (opening) - 2 (bullets) - 8 (the two paragraphs)
- 5 (preamble) + 1 (item 2) - 1 (item 4) + 16 (subsection) - 3 (planner's
job) + 7 (after review) = about 303.

War stories, judged one by one:

- "Do not do the planner's job", the `npm run check` story (lines 55-63):
  earns its place as the only record of the rule's origin, but nine lines
  is too many for it - trimmed to four in this batch since the file is
  open and the owner asked.
- "Your writers are not the only writers": kept whole. README row 29 names
  it as the prose that has not yet been given a chance to fail; shortening
  it would change the experiment.
- "Session ending", the usage paragraph: kept whole. It is what stops the
  usage guard being rebuilt (Finding 4), and it is one paragraph.
- The 2026-09-09 duplicate-agent story: one sentence, kept.
- The 2026-09-10 "eleven typecheck errors" sentence: kept; it is the
  evidence for running your own foreground check.

Acceptance: the file is **not longer than 310 lines** after the batch, and
the target is under 300. `CLAUDE.md` is untouched at 193: its Orchestration
section ("reviewer (optional) -> high-risk batches; max one remediation
cycle") is already true under this design and nothing new is a standing law.

## 7. B1 - correct the premise, keep the relay, resume the worker (implement-ready)

### Objective

One commit, markdown only, that replaces the false host claim with the
measured capability in every file that carries it, writes the resume rules
into the orchestrator's procedure, states in the review prompt and agent
file that the reviewer sends nothing, records the facts and the three
rejected candidates in the README, withdraws Finding 1's design advice, and
leaves `orchestrate.prompt.md` no longer than it is now.

### Preconditions - do not start otherwise

1. `git status --porcelain` shows nothing outside `issues/agent-messaging/`
   and `issues/tg-preview-refresh/` (another task's; never touch it).
2. `wc -l .claude/prompts/orchestrate.prompt.md` prints 310 and
   `wc -l CLAUDE.md` prints 193.
3. `ListAgents` shows no other writer `running` on this tree.

### Files

Edit:

- `.claude/prompts/orchestrate.prompt.md` - the three corrections, the
  new subsection, "After review", closeout step 4, the planner's-job trim
- `.claude/prompts/review.prompt.md` - one sentence at the end
- `.claude/agents/reviewer.md` - item 6
- `.claude/prompts/implement.prompt.md` - step 7, one clause
- `.claude/README.md` - new section "Resuming a worker"; candidate rows
  35-37
- `.claude/improvements.md` - one line in the status header
- `issues/agent-messaging/plan.md`, `handoff.md`, `context.md` - status

Create: nothing. Do not touch `CLAUDE.md`, `.claude/settings.json`, any
hook script, `issues/47/`, `issues/tg-preview-refresh/`.

### Settled constraints - do not reopen

- Review returns to the orchestrator only. The reviewer sends nothing.
- Max one remediation cycle; the orchestrator counts it.
- Resume is the default within a batch; a new batch is a new worker.
- Only the orchestrator resumes a writer; a resume gets a dispatch's preflight.
- Sibling -> sibling stays unproven and unused.
- No hook. Rows 35-37 land in the README as written in section 5.
- The canonical check invocation is quoted exactly as
  `set -o pipefail; npm run check 2>&1 | tail -n 120` with Bash
  `timeout: 600000` wherever it appears; no second form.
- Product text conventions: ASCII punctuation; English.

### Ordered steps

1. **`orchestrate.prompt.md`, "A worker waiting on a background check: wait
   with it."** Keep the heading, the verify paragraph and bullet 1
   unchanged. Replace bullet 2 and bullet 3 (the lines from "- **Nothing is
   running" through "two writers on one tree.") with:

   ```text
   - **Nothing is running: the result is gone**, whether or not the command
     finished. Resume the worker - `SendMessage` to its name, see "Resume, do
     not replace" - with one instruction: re-run the check in the foreground,
     one call, `set -o pipefail; npm run check 2>&1 | tail -n 120` with the
     Bash timeout at 600000, then commit or report. It holds the context a
     fresh agent would re-derive at full cost.
   ```

   Then delete the two paragraphs from "Third occurrence of this shape"
   through "`.claude/README.md` says why each part matters." and put in
   their place:

   ```text
   Prose failed at this three times; `bash-guard.mjs` now denies a backgrounded
   `npm run check` (rule 2g) and a heavy run beside a live parity run (2h) -
   `.claude/README.md`, "Run a long check". Name the checks in the dispatch,
   say they fit one foreground call, and do not write a fourth paragraph.
   ```

   Keep "While nothing is running, a foreground `npm run check` of your own
   ..." and everything after it in the section unchanged.

   Also replace the section's opening paragraph (under "## Long-running
   checks", from "A worker that ends its turn" to "cost more than the batch
   itself.") with:

   ```text
   A worker that ends its turn with a check still running loses it: the shell
   dies with the agent and the result with it. A cold replacement re-reads
   everything - twice in one session, costing more than the batch itself.
   ```

2. **"A worker that went quiet is not a worker that died."** Replace the
   two paragraphs between the heading and "Verify, then act:" with:

   ```text
   A task notification fires when an agent **ends a turn**, not when it exits.
   Its `completed` status describes that turn. The agent is still listed,
   still holds its context, and `SendMessage` to its name resumes it from its
   transcript (measured 2026-09-11; `.claude/README.md`, "Resuming a worker").
   Once, 2026-09-09, the orchestrator read such a notification as termination,
   killed the worker's parity run, dispatched a cold replacement, and found
   both agents `running` on one tree. Verify, then act:
   ```

   Item 2 becomes:

   ```text
   2. **Never dispatch a replacement - or resume a finished writer - while
      another writer shows `running`.** Either is two writers on one tree,
      which the rule above forbids.
   ```

   Item 4 becomes:

   ```text
   4. **Resume, do not replace** - the subsection below says when each is
      right. Do not spend a fresh agent to avoid one message.
   ```

   Items 1, 3 and 5 are unchanged.

3. **New subsection, directly after item 5 of the list above and before
   "## Model selection".** Verbatim, 16 lines including the heading and a
   blank line before it:

   ```text
   ### Resume, do not replace

   A resume is a dispatch: it makes the agent live again, so it gets the
   spawn's preflight - `ListAgents` shows no other writer `running`, HEAD
   re-read and named. Only the orchestrator resumes a writer; the reviewer
   returns findings and sends nothing. Within a batch, resume its own
   implementer for a lost check, the review's blockers, an uncommitted change
   at closeout, or a question you can answer - one message per occasion: the
   next action, HEAD, what is settled, the gates. Spawn instead when the agent
   shows `killed` or the send fails, when its transcript is the problem (it
   reasoned from a corpse or holds a refuted belief), or when the tier must
   change - a resume carries no `model`. A new batch is a new worker: the
   handoff is the memory between batches by design, and every resume replays
   the whole transcript. Sibling sends are unmeasured and unused; a subagent's
   reply lands here, so two subagents cannot converse. Facts and evidence:
   `.claude/README.md`, "Resuming a worker".
   ```

4. **"## Do not do the planner's job."** Replace the paragraph beginning
   "A GOAL of the shape" (lines 55-63) with:

   ```text
   A GOAL of the shape "figure out what to do about X" is a planning dispatch,
   not an invitation to settle X inline. Happened 2026-09-10 with the
   `npm run check` question: the orchestrator measured, decided and wrote the
   verdict itself. It held up - that is the trap: nothing reviews the
   orchestrator's reasoning and no `plan.md` carries it. Measure the symptom
   if routing needs it; let the planner answer.
   ```

5. **"## After review (max one remediation cycle)."** Replace the section
   body (everything from "Review returns to the orchestrator only" to
   "do not burn a cycle on nits alone") with:

   ```text
   Review returns to the orchestrator only: the reviewer messages nobody, and
   you count the one cycle.

   - **approve** -> continue to next batch or finish
   - **fix-then-continue** -> resume the batch's writer ONCE with the blockers
     only - quoted, with what is already settled, HEAD and the gates; a cold
     fix-pass is the fallback when "Resume, do not replace" says spawn. Do not
     replan; do not send nits
   - **replan** -> resume the planner ONCE (dispatch it if not listed) to
     revise the affected batch, then the writer ONCE
   - After that single remediation, do not auto-review again unless
     contracts/UI still changed and risk rules still match; when a second
     look is due, resume the same reviewer - it holds the batch
   - If still blocked after one remediation cycle -> stop and ask the human
   - Record nits in handoff Deferred; do not burn a cycle on nits alone
   ```

6. **Closeout step 4.** Replace "send exactly one writer to verify and
   commit the coherent change" with "resume the batch's writer - or dispatch
   exactly one - to verify and commit the coherent change".

7. **`review.prompt.md`**, last paragraph. After "Return findings to the
   orchestrator for a separate implementer or add-source fix-pass." add the
   sentence: "Do not message the implementer or any other agent: the
   orchestrator filters blockers from nits, counts the one remediation cycle,
   and is the only role that resumes a writer."

8. **`.claude/agents/reviewer.md`**, item 6, becomes: "Do not implement
   fixes and do not message any other agent; return findings to the
   orchestrator, which relays blockers and owns the one remediation cycle".

9. **`implement.prompt.md`**, step 7, last sentence becomes: "If you must
   stop first, name the command and its task id in your final message - the
   orchestrator can resume you with your context intact, so say exactly
   where you stopped."

10. **`.claude/README.md`.** Insert a section between the "Kickoff" block
    and "## Hooks":

    ```text
    ## Resuming a worker

    A subagent that ended its turn is still listed and still holds its
    context; `SendMessage` to its name resumes it from its transcript, and
    its reply arrives as an ordinary task notification. Measured 2026-09-11
    on the Windows desktop app - the host `improvements.md` Finding 1 and
    the orchestrate prompt (until this change) recorded as unable to do it:

    | Direction | Status | Evidence |
    |---|---|---|
    | main session -> its own subagent | works, context intact | the issue 47 B9 implementer, resumed with the review's blocker after its turn had ended, kept every fact and produced `84ca6df` |
    | subagent -> main session | works | a probe loaded `SendMessage` via `ToolSearch` and delivered a line that arrived as `<agent-message from="...">` |
    | subagent -> sibling subagent | **unproven** | only one subagent was alive; the probe's reported sibling id was its own. Settle it with two live subagents before designing on it |

    Facts that bound the rules in `prompts/orchestrate.prompt.md`, "Resume,
    do not replace":

    - `SendMessage` is not in a subagent's default tool list here; a subagent
      must `ToolSearch select:SendMessage` first. No prompt currently tells a
      subagent to send; one that does must say this. `ListAgents` is built in
      and lists the parent, the subagent itself and every peer session.
    - A send carries no `model`; a resumed agent keeps its tier. Escalation is
      a fresh dispatch.
    - A subagent's send goes out under its parent session's address and any
      reply lands in the parent's conversation, so two subagents cannot hold a
      conversation on this host; one-way dispatch is what exists.
    - Resuming a finished writer while another writer is live is two writers
      on one tree - the same violation as spawning one. The orchestrator does
      the `ListAgents` and HEAD preflight before a resume as before a spawn.
    - Whether the reviewer's `permissionMode: plan` blocks `SendMessage` is
      unknown; the review prompt forbids the send in prose (candidate 36).
    ```

    Append rows 35, 36 and 37 to the candidate table exactly as written in
    section 5 of this plan.

11. **`.claude/improvements.md`**, status header (the paragraph beginning
    "Status, updated 2026-09-09"). Append one sentence: "Finding 1's 'do not
    design around resumption being available' is withdrawn 2026-09-11:
    `SendMessage` resumes a subagent on this host - `.claude/README.md`,
    'Resuming a worker'." Change nothing else in that file.

12. **Read the whole of `orchestrate.prompt.md` once, top to bottom**, and
    fix any sentence the edits above left contradicting them (a pointer to a
    deleted paragraph, a "the human resumes" that survived). Then run the
    acceptance greps below.

13. **Update this task's `plan.md` (status line at the top), `handoff.md`
    (Completed, Verification, Status done) and `context.md` (one line under
    "Do not re-fetch unless" is enough).** Commit by name:
    `git add .claude/prompts/orchestrate.prompt.md .claude/prompts/review.prompt.md .claude/prompts/implement.prompt.md .claude/agents/reviewer.md .claude/README.md .claude/improvements.md issues/agent-messaging/`
    then `git commit -m "docs(agents): a finished worker is resumed, not replaced, and review still returns to the orchestrator"`.
    Never `git add -A`; `issues/tg-preview-refresh/` is untracked and not
    yours.

### Acceptance criteria

- `grep -rn "cannot resume\|is disabled\|not exposed on every host\|only the human can resume\|human's to do\|resumable only from the human" .claude/prompts .claude/agents .claude/README.md` returns nothing.
- `grep -rn "SendMessage" .claude CLAUDE.md` - every hit outside
  `improvements.md`'s historical Finding 1 body describes the measured
  capability or the reviewer's prohibition; none says the tool is absent.
- `grep -n "Resume, do not replace" .claude/prompts/orchestrate.prompt.md`
  finds the heading and at least two pointers to it.
- `wc -l .claude/prompts/orchestrate.prompt.md` prints **310 or fewer**.
  Record the number. The planner's count of the verbatim blocks lands at
  about 300; if the file comes out between 311 and 315, record it as a
  deviation and do not cut content the plan keeps - if above 315, stop and
  report which block ran long.
- `wc -l CLAUDE.md` still prints 193; `git diff --stat` lists no file
  outside the seven named above plus `issues/agent-messaging/`.
- `review.prompt.md` and `reviewer.md` each contain one sentence forbidding
  the reviewer to message any agent; `implement.prompt.md` step 7 contains
  "resume you".
- README candidate table ends at row 37; the "Resuming a worker" section
  sits before "## Hooks".
- Every quoted check invocation in touched text is exactly
  `set -o pipefail; npm run check 2>&1 | tail -n 120`.

### Verification commands

Markdown only, so the commit gate exempts every path and `npm run check`
neither sees nor can fail on this change (`.claude/README.md`, "What the
check does not cover: markdown"). `selftest.mjs` covers the hook scripts,
none of which change. The gates are the acceptance greps and counts above,
plus:

- `git status --porcelain` before and after: only the named files and
  `issues/agent-messaging/`; `issues/tg-preview-refresh/` untouched.
- `git diff --stat` matches the file list.
- If, and only if, a non-`.md` file ends up touched (it should not), run
  `set -o pipefail; npm run check 2>&1 | tail -n 120` with Bash timeout
  600000 before committing.

### Risks and do-nots

- Do not add a rule telling any worker to send. Nothing uses one.
- Do not edit a hook script, `settings.json`, or the reviewer's
  `permissionMode`. Row 36 is a sketch, not a change.
- Do not rewrite the untouched war stories (writers, usage) - row 29 and
  Finding 4 depend on them as they stand.
- Do not let the file grow. Use the verbatim blocks as written; the
  acceptance criterion says what to do if the count still comes out high.
- Do not re-probe the capability. The table is measured; copy it.

### Fallback (only if the owner answers Q1 "route it directly")

Steps 5, 7 and 8 change; nothing else does. "fix-then-continue" would read:
the reviewer, having loaded `SendMessage` via `ToolSearch`, sends its
blockers to the implementer by name ONCE, then ends its turn with the same
report to the orchestrator; the orchestrator still counts the cycle,
still does the one-writer preflight *before dispatching the reviewer* (since
the reviewer's send is the resume), and still decides re-review. The review
prompt gains the `ToolSearch` sentence and the implementer's name is passed
in the reviewer's dispatch. Sibling delivery must first be measured with two
live subagents, and the plan records that a read-only role now writes by
proxy under the orchestrator's pre-dispatch gate. The planner recommends
against it for the six reasons in section 3.

## 8. Question for the owner

**Q1.** The proposal was to route reviewer feedback to the implementer
directly. The recommendation is **no**: keep the relay through the
orchestrator and make it cheap by resuming the batch's own implementer with
the filtered blockers (section 3, six reasons; the B9 remediation is the
measured instance). Accept the recommendation, or overrule it and take the
fallback in section 7? Everything else in the batch is the same either way.

## 9. Deferred

- Measure sibling -> sibling with two live subagents when a session has two
  for another reason. Record the result in the README table; design on it
  only after.
- Row 36 (`disallowedTools` on the reviewer) on the first recorded reviewer
  send.
- If `orchestrate.prompt.md` grows again, move the origin stories that
  remain (writers, usage) into a README "Facts settled" list and leave one
  pointer each; not this batch, because row 29 is watching one of them.
- Closeout: the capability table in `context.md` is duplicated into the
  README by step 10; `context.md` stays per the closeout rule, `plan.md` is
  deleted once the README rows are in place and nothing references it.
