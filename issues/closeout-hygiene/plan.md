# Plan - TASK closeout-hygiene

Status: one batch (B1), in progress and blocked - see `handoff.md`.
Read `issues/closeout-hygiene/context.md` first; it carries the measured
evidence, the gate arithmetic and the tree state this plan builds on.

## 1. Objective

Closeout is a checklist an agent can skip without anything noticing. Make the
part that is mechanical deterministic, make the part that is judgment
reviewable, and sharpen the prose that owns the rest.

Three pieces, settled with the human and not reopened here (a dedicated
cleanup agent was considered and rejected - reasons in `context.md`):

- **A** - the hooks surface what is there. They never delete.
- **B** - the reviewer gets a named nit category for prose that narrates a
  session instead of explaining the code.
- **C** - `orchestrate.prompt.md` steps 5-7 get sharper, and keep the job.

Non-goals: no cleanup agent, no new agent role, no new remediation cycle, no
new `CLAUDE.md` rule, no deletion performed by any hook, no sweep of the repo
for narrative prose outside the paths a batch touches.

## 2. Evidence, corrected

`context.md` records "nine references across seven hook files". The measured
count is **ten citation sites across nine files** (`git grep -n
"issues/65/plan\.md"`, tracked files, this tree):

| File:line | Current text (tail) |
|---|---|
| `.claude/hooks/bash-guard.mjs:2` | `See issues/65/plan.md section 4, hook 2, for the full specification -` |
| `.claude/hooks/check-observer.mjs:4` | `See issues/65/plan.md section 4, hook 3.` |
| `.claude/hooks/edit-followup.mjs:4` | `See issues/65/plan.md section 4, hook 5.` |
| `.claude/hooks/edit-guard.mjs:2` | `See issues/65/plan.md section 4, hook 4.` |
| `.claude/hooks/lib.mjs:3` | `Contract every hook script follows (see issues/65/plan.md section 4):` |
| `.claude/hooks/lib.mjs:131` | `See issues/65/plan.md section 4, hook 2a.` |
| `.claude/hooks/selftest.mjs:7` | `See issues/65/plan.md section 7 and issues/hooks-guardrails/plan.md` |
| `.claude/hooks/session-start.mjs:2` | `see issues/65/plan.md section 4, hook 1.` |
| `.claude/hooks/session-stop.mjs:3` | `See issues/65/plan.md section 4, hook 6.` |
| `.claude/hooks/tree-key.mjs:3` | `See issues/65/plan.md section 4, hook 2e for the full rationale.` |

`issues/65/plan.md` does not exist. Every one of these points at nothing.

Two further `selftest.mjs` occurrences (`:130`, `:1448`) are **not** citations:
they write and stage `issues/65/plan.md` inside the throwaway scratch repo as a
gate-exempt path fixture. Leave them exactly as they are.

Live citations that must **not** be touched: `issues/47/plan.md` from
`docs/REFACTOR_PLAN.md`, `docs/parity.md`, `docs/specs/COVERAGE.md` (issue 47
is the live migration backlog by `CLAUDE.md`'s own instruction);
`issues/hooks-guardrails/plan.md` from `check-observer.mjs:58` and
`.claude/README.md` row 31; `issues/agent-effort/plan.md` from
`.claude/README.md` row 38. All three plan files exist.

## 3. Design

### 3.1 A1 - the Stop hook names this session's untracked writes

**Where: extend `.claude/hooks/session-stop.mjs`. Not a new hook.**
It already reads the one input this needs (`getWrote(session_id)`), already
runs `git status --porcelain -uall`, already holds the per-session dedupe, and
already owns the moment. A second `Stop` script would re-parse the same stdin,
re-spawn the same git call and speak in a second message the human has to
reconcile with the first. The repo's own shape agrees: `bash-guard.mjs` carries
seven rule families in one script rather than seven scripts.

**Candidate set.** A path is named when all three hold:

1. this session wrote it (`getWrote`), and
2. `git status --porcelain -uall` reports it with the `??` code (untracked),
   and
3. it is not excluded.

Ignored files never appear: the status call passes no `--ignored`, so
`.check-cache.json`, `.check-index` and `.hook-state.json` are already out.

**Exclusions**, matched against `pathKey(rel)` (folded), so a literal cannot
match on one platform only:

- anything under `docs/` - closeout step 6 sends durable knowledge there, so a
  new untracked file in `docs/` is a spec being written, never scratch;
- the task-document set in **any** issue directory:
  `issues/<id>/context.md`, `issues/<id>/plan.md`, `issues/<id>/handoff.md`,
  and anything under `issues/<id>/mocks/`.

Why the document set rather than "the active `issues/<id>/`", which is what the
brief suggested: the one recorded scratch artifact, `issues/dh-image-polish/
refresh_artwork.py`, lives **inside** an issue directory, and that directory was
the active one while the script was being written. Excluding the whole active
directory blinds the rule to the only measured instance of the thing it exists
to catch. Excluding the three document names plus `mocks/` keeps a planner's own
fresh `plan.md` out of the message - which is the noise the active-directory
exclusion was reaching for - and keeps the scratch script in. It also needs no
`activeTask()` call, so the rule has one fewer guessed input.

**Message.** Candidates are removed from the existing uncommitted list and get
their own sentence, so no path appears twice and each carries the right ask:

```text
Untracked, and written by this session: <up to 8, comma-separated>[, +N more].
Each is either part of the change (commit it) or task scratch (delete it, or
record in the handoff why it is kept) - closeout step 5. This hook deletes
nothing.
```

The wording is deliberately not "delete candidates": a new source file the
session has not staged yet lands in this list too, and for that file the first
branch is the right one. The hook states a fact and hands back the decision.

Consequence to accept: an untracked file that used to be named by the
"uncommitted work" sentence is now named by this one instead. Same path, same
stop, different ask. Case #52's path is tracked-and-modified, so it is
unaffected.

**Dedupe.** The existing key hashes `uncommitted + staleness`. It must also
hash the candidate list, or a session whose only change is a new scratch file
speaks once and then goes quiet about it while the list changes underneath.
The early return grows the third term.

### 3.2 A2 - deny removing an `issues/<id>/plan.md` that tracked files still cite

**Where: `.claude/hooks/bash-guard.mjs`, a new rule family.** The sites
considered and why they lose:

- **`edit-guard.mjs`** (`PreToolUse(Edit|MultiEdit|Write|NotebookEdit)`) cannot
  see this at all. No Edit-family tool deletes a file; `tool_input.file_path`
  on a Write is a file being created or overwritten. The event never fires for
  a retirement. Rejected on input, not on preference.
- **`session-stop.mjs`** could scan for orphans retroactively, but it would fire
  on history rather than on an action: every session after a bad retirement gets
  the same warning until someone repairs it, which is the wallpaper the repo
  warns about (candidate rows 21, 22, 23), and it arrives after the file is
  gone, when the content it pointed at is only recoverable from git history.
- **`selftest.mjs`** can assert the rule but cannot be the rule: it runs inside
  `npm run check`, and a `.md`-only retirement commit is gate-exempt, so the
  check need never run between the deletion and the commit. A selftest-only
  guard is a guard that is skipped exactly when it matters.
- **`bash-guard.mjs`** sees the exact moment (`rm issues/65/plan.md`,
  `git rm issues/65/plan.md`), already segments and unwraps the command, already
  has `relPath`/`pathKey`, and can name the citing files while the file still
  exists. This is the only site with both the input and the timing.

**Deny, not warn.** The failure mode is that a retirement looks complete on its
own - nothing breaks, the check still passes, and the orphans are found months
later by someone reading a comment that points at nothing. A `speak` at
`PreToolUse` is acknowledged and stepped past; that is the thing being guarded
against. The deny is false-positive-free in the shape that matters: repairing
the citations first makes the rule silent, and repairing them first is what
closeout step 6 already requires ("Once nothing in `plan.md` is still
referenced, delete it"). The escape is the same one every other block in this
family offers - the human runs the command in their own terminal, where no hook
intercepts. `SKIP_CHECK_GATE=1` is not an escape here and must not be wired to
one; it belongs to the commit gate.

**Trigger.** For each segment (after `segmentInfo`, so `echo`/`grep` and the
wrappers are already handled):

- `program === 'rm'`, or `program === 'git'` with `gitSubcommand(...) === 'rm'`;
- take the non-flag tokens, map each through `relPath(token, cwd)` then
  `pathKey`, and keep those matching `/^issues\/[^/]+\/plan\.md$/`.

**Lookup.** For each matched target, `git(['grep', '-n', '--fixed-strings',
'--', target])` from `repoRoot()`. `git()` returns `null` on a non-zero exit,
which covers both "no matches" (`git grep` exits 1) and "git unavailable" - both
mean no deny, which is the correct fail-open in both cases. Do not try to
distinguish them. Drop any hit whose own path is the target file.

**Message** (name the count and up to four citing files with line numbers):

```text
Blocked: <target> is still cited by <N> tracked line(s): <file:line, ...>.
Retiring a plan.md leaves those pointing at nothing. Closeout step 6: move the
durable content to its permanent home (.claude/README.md for tooling
rationale, docs/specs/ for behaviour), update every citation, and remove the
file in that same commit.
```

**Order.** A new `evaluateOrphanPlan(segList, cwd)`, called from the entry point
after `evaluateBlocklist` and before `evaluateBlanketStage`. First deny wins, so
`rm -rf issues/65` is still caught earlier by the `rm -rf`-inside-the-repo rule
with its own message; that is a shadow, not a gap - the deletion is stopped
either way.

**Known gaps, to be recorded in `.claude/README.md` beside the existing list:**
a deletion through `git clean`, through `node -e "fs.rmSync(...)"`, through an
unexpanded glob (`rm issues/65/*` reaches the hook as the literal token), or
from the human's own terminal is invisible to this rule, as is a citation in an
untracked file (`git grep` searches tracked files).

### 3.3 A3 - repair the ten orphans in this batch

**This task repairs them.** Three reasons, in order of weight:

1. A rule against orphan citations that ships alongside ten live orphans has
   failed its first test, and the next agent reads the orphans, not the rule.
2. `CLAUDE.md`'s campsite rule: these are stale docs in paths this batch is
   already editing. "Out of scope" is explicitly not available as a reason to
   leave them.
3. The repair is the worked example of closeout step 6 that piece C is about to
   describe, performed once so the prose has something true to point at.

The replacement target is `.claude/README.md`, "Hooks" - the permanent home
that already carries the per-script table, the sanitiser's known limits, the
settled facts and the candidate table. Not `issues/65/handoff.md`: closeout step
7 says a completed task directory is history, not instructions.

| Site | Repair |
|---|---|
| `bash-guard.mjs:1-6` | Rewrite the header: `eight rule families` (it is seven today and the new one makes eight), and `See .claude/README.md, "Hooks", for what each family blocks and for the sanitiser's known limits.` Drop `this file follows it literally, including the sanitiser/segmenter and the exact trap table` - its referent is gone. |
| `check-observer.mjs:4` | `See .claude/README.md, "Hooks".` |
| `edit-followup.mjs:4` | `See .claude/README.md, "Hooks".` |
| `edit-guard.mjs:2` | `See .claude/README.md, "Hooks".` |
| `lib.mjs:3` | `Contract every hook script follows (see .claude/README.md, "Hooks"):` - the three numbered points follow in place, so nothing is lost. |
| `lib.mjs:131` | Delete the dead pointer sentence. A live pointer already stands two lines below it (`the known gaps are listed in .claude/README.md`); prefer deleting a dead citation to retargeting it when a live one is already adjacent. |
| `selftest.mjs:7` | Keep the live `issues/hooks-guardrails/plan.md` citation, drop the dead one: `See .claude/README.md, "Hooks", and issues/hooks-guardrails/plan.md section 5, for the case list this file implements.` |
| `session-start.mjs:2` | `see .claude/README.md, "Hooks".` |
| `session-stop.mjs:3` | `See .claude/README.md, "Hooks".` |
| `tree-key.mjs:3` | `See .claude/README.md, "Hooks", for the commit gate's rationale.` |

Note for whoever retires `issues/hooks-guardrails/plan.md` or
`issues/agent-effort/plan.md` later: the A2 rule will deny until
`check-observer.mjs:58` and `.claude/README.md` rows 31 and 38 are repaired.
That is the rule working, and the README row says so.

### 3.4 B - the review clause

**Where: `.claude/prompts/review.prompt.md` only.** A new `### G` under "What
to verify", and one clause in the Nits line of the output format.
`.claude/agents/reviewer.md` is not touched: it already says "Follow
`.claude/prompts/review.prompt.md` exactly", and a second copy of the rule is a
second copy to keep true.

It lands inside the machinery that exists. Narration is never a blocker - it
breaks nothing - so it is always a nit: `local` when it sits in a path this
batch touched, which is where the orchestrator's single remediation cycle on a
terminal batch already sends `local` nits, and `deferred-scope` otherwise,
filed in handoff Deferred. No new cycle, no new agent, no commit outside the
batch.

**The line between a fact that earns its keep and a retelling that does not.**
The test, and it is the whole clause: *strike the sentence's subject and ask
whether it still answers "why is the code like this?"* If the load is carried by
what was measured and what that forces, it stays. If the load is carried by who
did it, how many of them, and on what date, it is narration.

Earns its keep:

- a measurement with a consequence - `the check is ~165 s and the tool's default
  timeout is 120 s, so the call needs timeout 600000`;
- a rejected alternative and the reason, so nobody re-derives it;
- a defect the code reproduces or works around on purpose, with the symptom
  that identifies it;
- a date **attached to a measurement**, because it tells a reader when the
  number stopped being trustworthy - `measured 2026-09-10 on this host`;
- a count used as evidence for a threshold - `three of five workers made this
  mistake, so prose was exhausted` is the argument for a deny.

Does not:

- what happened in a session, with no consequence for the reader: which agent,
  which hour, what the orchestrator decided;
- a date on an opinion rather than on a measurement;
- the file's fix history when the earlier attempts are not live traps - "first
  A, then B, now C";
- a count as decoration rather than as evidence.

**The self-application problem, stated rather than dodged.**
`orchestrate.prompt.md` is the densest example of dated, agent-naming prose in
the repository, and almost all of it survives this test: "Happened 2026-09-10
with the `npm run check` question - the orchestrator measured, decided and wrote
the verdict itself. It held up - that is the trap" is a failure mode with the
reason it is hard to see, and the date says when it was last observed. A rule
that deletes its own load-bearing evidence is a bad rule, and the clause says so
in one line, because a reviewer reading the clause will look straight at that
prompt. Two guards keep it honest: the test above, and scope - the reviewer
reviews **the prose this batch touched**, never the repository at large.
`CLAUDE.md` sends project-wide cleanup to the handoff, not to a review.

### 3.5 C - closeout steps 5-7

Edited in place in `.claude/prompts/orchestrate.prompt.md`. The step keeps its
owner; nothing is delegated to an agent.

- **Step 5** gains its input: the `Stop` hook names the untracked paths this
  session wrote, and that list is a candidate set, not a verdict - the session
  that watched the files appear is the one that can tell scratch from evidence.
  Keeps "record what was removed or deliberately retained in `handoff.md`".
- **Step 6** gains the reference rule: before retiring `plan.md`, run
  `git grep -n "issues/<id>/plan\.md"`; move durable content to its permanent
  home first, retarget or delete every tracked citation, and remove the file in
  **that same commit**. Plus the trap this very task walks into: the retirement
  is `.md`-only and gate-exempt, but a repair that touches a non-exempt file
  (`.claude/hooks/*.mjs`, `README.md`, `README.ru.md`, or any code) puts the
  whole commit behind a passing `npm run check`. Plus one line saying the hook
  denies the deletion while a citation stands, so the order is not optional.
- **Step 7** gains the closing condition: closeout is not finished until what
  steps 5 and 6 did is written into the handoff's
  `Cleanup performed / retained artifacts` field. That field already exists in
  the template and is the only durable record of a decision to keep something.

**No `CLAUDE.md` change.** The file is capped at 200 lines and takes a rule only
after a repeated mistake; this is one recorded instance, the closeout prose
already owns the procedure, and a hook now enforces the mechanical half. This
also removes the only path that overlaps issue 47's in-flight B12, so nothing in
this batch can collide with its one dirty line.

## 4. Batch B1 - implement-ready (the whole task, one batch)

### Objective

Ship A, B and C: two hook rules with their selftest cases and README rows, ten
citation repairs, the review clause, and the sharpened closeout steps.

### Why one batch

`.md` work is gate-exempt and commits on any tree; the `.mjs` work needs one
passing `npm run check` for the whole tree. That is one check either way -
`docs/parity.md`'s batch-size test sizes a batch by its gates, and splitting
would buy a second check run and nothing else. One batch, three commits, **one**
check run, in the order below.

### In scope

- `.claude/hooks/session-stop.mjs` - the candidate rule (3.1)
- `.claude/hooks/bash-guard.mjs` - `evaluateOrphanPlan` + `MSG` entry + header
  rewrite (3.2, 3.3)
- `.claude/hooks/selftest.mjs` - new cases, scratch fixture, header repair
- `.claude/hooks/{check-observer,edit-followup,edit-guard,lib,session-start,
  tree-key}.mjs` - citation repairs only (3.3)
- `.claude/README.md` - hook table rows, known-limitation bullets, candidate
  rows 39 and 40
- `.claude/prompts/review.prompt.md` - section G and the Nits clause (3.4)
- `.claude/prompts/orchestrate.prompt.md` - steps 5, 6, 7 (3.5)

### Out of scope

`CLAUDE.md`. `.claude/agents/reviewer.md`. `.claude/prompts/implement.prompt.md`
(see Deferred). Any deletion of any `plan.md`, including
`issues/hooks-guardrails/plan.md` and `issues/agent-effort/plan.md` - whether
those retire is the human's call, and this batch only builds the guard. Any
`issues/47/**` path, any `app/**`, `tests/**` or `docs/**` path. The two
`selftest.mjs` scratch fixtures at `:130` and `:1448`.

### Ordered steps

1. **`session-stop.mjs`.** Keep the `dirty` map as it is and build a second
   `Map` from the same loop, filled only when `row.startsWith('??')`, keyed by
   `pathKey(raw)` and valued by git's own spelling. Add
   `isTaskDocument(key)` - `/^issues\/[^/]+\/(context|plan|handoff)\.md$/` or
   `/^issues\/[^/]+\/mocks\//` - and `isExcluded(key)`, which also returns true
   for `key.startsWith('docs/')`. Build `candidates` from `writtenPaths` via the
   untracked map, minus excluded; subtract those keys from `uncommitted`. Extend
   the early return to `!uncommitted.length && !candidates.length && !staleness`,
   add the sentence from 3.1 to `parts`, and add the candidate list to the
   `dedupeKey` hash input. Cap the display at 8 with `+N more`, as the existing
   sentence does.
2. **`bash-guard.mjs`.** Add `MSG.orphanPlan(target, hits)` returning the text
   in 3.2. Add `evaluateOrphanPlan(segList, cwd)` per 3.2, call it from the
   entry point between `evaluateBlocklist` and `evaluateBlanketStage`, returning
   `deny(event, ...)`. Rewrite the file header per the 3.3 table, including
   `eight rule families`.
3. **Citation repairs** in the remaining six files, exactly per the 3.3 table.
   Change nothing else in them.
4. **`selftest.mjs`.** In `setupScratch`, add one committed citing file -
   `writeFile('tools/cites-plan.js', '// See issues/65/plan.md section 4.\n')`,
   before `git add -A`; it stays clean, so no dirty-path count moves. Add the
   cases below, numbered from **#102** (the current maximum is #101), in two
   places: the orphan cases in a new
   `// ---------- bash-guard.mjs: rule 2i, orphan plan citation (#102-#107) ----------`
   section with its own `testOrphanPlan()` registered in `main()` after
   `testBashSilentCases()`, and the Stop cases appended inside the existing
   `testSessionStop()`. Repair the file header per 3.3.

   | # | Case | Expect |
   |---|---|---|
   | 102 | `rm issues/65/plan.md`, citing file committed | deny; reason contains `tools/cites-plan.js` and the target |
   | 103 | `git rm issues/65/plan.md`, same state | deny |
   | 104 | same as 102 after rewriting `tools/cites-plan.js` to drop the citation (restore it afterwards) | silent |
   | 105 | `rm issues/65/handoff.md` | silent - the rule is scoped to `plan.md` |
   | 106 | `rm app/src/lib/x.ts` | silent |
   | 107 | `echo rm issues/65/plan.md` | silent - `READERS` already covers it, asserted so a future `segmentInfo` change cannot quietly break it |
   | 108 | session wrote `tools/scratch-tmp.js`, left untracked | `systemMessage` names it |
   | 109 | same session also wrote `issues/99/plan.md` and `docs/specs/NEW.md`, both untracked | neither name appears in the message |
   | 110 | candidate written through `edit-followup.mjs` with a mixed-case path (`tools/ScratchTmp.js`) | named with that spelling - the win32 record/match lesson, mirroring #60 |
   | 111 | second Stop with unchanged state | silent |

   Case 104 must restore the citing file's content before the next case, the
   way `dirtyBaseline()` restores the tree elsewhere. Cases 108-111 create
   their own untracked files; remove them at the end of `testSessionStop()` so
   `testFailOpen()` sees the tree it expects.
5. **`.claude/README.md`.** Extend the `PreToolUse|Bash` row's description with
   the new block; extend the `Stop` row with the untracked-writes sentence; add
   the four known gaps from 3.2 to the limitations list; add candidate rows 39
   (Stop names this session's untracked writes - **adopt**) and 40 (deny
   removing a cited `plan.md` - **adopt**), each carrying the rejected sites
   from 3.1 and 3.2 so nobody re-derives them, and row 40 noting that retiring
   `hooks-guardrails` or `agent-effort` will need rows 31 and 38 repaired first.
6. **`review.prompt.md`.** Add `### G. Prose that narrates the session` after
   `F`, carrying the test, the two lists, the self-application line and the
   scope line from 3.4. Extend the Nits line of the output format with: this
   category is never a blocker.
7. **`orchestrate.prompt.md`.** Rewrite steps 5, 6 and 7 per 3.5. Keep the
   numbering and the surrounding steps untouched.
8. **One check**, foreground, Bash timeout 600000:
   `set -o pipefail; npm run check 2>&1 | tail -n 120`.
9. **Three commits, with no file edited between them** - `treeKey()` is
   content-only and excludes `HEAD`, so one passing check covers all three:
   - `docs(agents): a review clause for session narration, and sharper closeout steps`
     -> `review.prompt.md`, `orchestrate.prompt.md`
   - `feat(hooks): name this session's untracked writes, and refuse to orphan a plan citation`
     -> `session-stop.mjs`, `bash-guard.mjs`, `selftest.mjs`, `.claude/README.md`
   - `docs(hooks): point the header comments at the README, not a retired plan`
     -> the six remaining `.mjs` files
   Stage by name. Never `git add -A`: this tree carries issue 47's B12.
10. Push the branch once the three commits are in.

### Acceptance criteria

- `node .claude/hooks/selftest.mjs` reports 0 failed, with cases #102-#111
  present and passing.
- `git grep -n "issues/65/plan\.md"` returns exactly the two `selftest.mjs`
  scratch fixtures at `:130` and `:1448`, and nothing else.
- `git grep -n "issues/47/plan\.md"` still returns its three `docs/` hits,
  unchanged.
- `npm run check` passes, recorded with its exact command and result.
- `git status` shows every issue-47 B12 path still modified and unstaged, and
  `issues/tg-preview-refresh/` and `tests/app/` still untracked.
- `CLAUDE.md` is unchanged by this batch and still carries B12's added line.
- `.claude/README.md` documents both new behaviours and both candidate rows.

### Verification commands

```text
set -o pipefail; npm run check 2>&1 | tail -n 120     # Bash timeout 600000
node .claude/hooks/selftest.mjs                        # seconds, for iteration
git grep -n "issues/65/plan\.md"
git status --porcelain -uall
```

`npm run check:built` is not required: nothing here alters what a screen draws.
No parity filter is implicated.

### Risks and do-nots

- **The check runs on a tree carrying issue 47's B12.** If it fails on a B12
  path, do not fix another task's code and do not use `SKIP_CHECK_GATE=1` - that
  is for a check that cannot run, not one that fails. Commit the first
  (gate-exempt) commit, leave the rest staged-by-name or uncommitted, and report
  the failure with the failing output.
- **A live parity lock blocks `npm run check`.** If it denies, wait rather than
  deleting the lock, unless the deny says the pid is not alive.
- **Hook config may be snapshotted at session start**, so an edited hook may or
  may not affect the session that edited it. The selftest is the verification,
  not live behaviour.
- **Do not make any hook delete anything.** Warn or deny only.
- Do not touch the two `selftest.mjs` scratch fixtures, and do not retire any
  `plan.md` in this batch.
- Do not edit `CLAUDE.md`.

### Fallback

If the A2 deny proves too blunt in use, it downgrades to `speak(event, ...)` by
changing one call site and one selftest assertion; the trigger, the lookup and
the message are unchanged. Record the downgrade in `.claude/README.md` row 40
rather than deleting the row.

## 5. Batches and status

| Batch | Scope | Status |
|---|---|---|
| B1 | A (3.1-3.3), B (3.4), C (3.5) - one batch, three commits, one check | in progress, blocked - all edits complete and verified (selftest 312/0); commit 1/3 landed and pushed (`58dbd70`); commits 2-3 blocked on a clean `npm run check` under host contention from a concurrent session - see `handoff.md` |

## 6. Deferred

- A matching "do not write it in the first place" line in
  `.claude/prompts/implement.prompt.md`. Prevention is cheaper than review, but
  it is a second copy of an unmeasured rule; add it if the nit recurs.
- Whether `issues/agent-effort/`, `issues/dh-image-polish/` and
  `issues/hooks-guardrails/` retire, and whether
  `issues/dh-image-polish/refresh_artwork.py` is scratch or evidence. The
  human's call, on the directories' own closeout.
- The two dated lines outside `.claude/` (`tests/parity/lock.js:5`,
  `tools/parity-ubuntu/README.md:27`). Neither path is touched here; they are
  exactly what the new review clause is for, on whatever batch next touches
  them.
- The read-only closeout auditor (reviewer-shaped, reports a delete list the
  orchestrator executes) stays the fallback if the checklist keeps being
  skipped. Not built, not needed yet.

## 7. Decisions taken

| Decision | Why | Reversible by |
|---|---|---|
| Extend `session-stop.mjs`, no new Stop hook | same inputs, same moment, one message | - |
| Exclude issue-directory **documents**, not the whole active directory | the one recorded scratch artifact lives inside an issue directory | one predicate |
| `bash-guard.mjs` owns the orphan rule | the only site with both the input and the timing | - |
| Deny rather than warn | a retirement looks complete on its own; a warn is stepped past | one call site (see Fallback) |
| Repair the ten citations in this batch | a rule shipping beside ten live orphans has failed its first test | - |
| Review clause in the prompt only | `reviewer.md` already delegates to it | - |
| No `CLAUDE.md` rule | 200-line cap, one recorded instance, prose plus hook already own it; also keeps this batch off B12's only shared path | - |
