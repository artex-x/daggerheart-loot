# Plan - TASK hooks-guardrails

Deterministic guardrails for three recorded failures on issue 47 where written
instruction has demonstrably stopped working. Local-only task id; no GitHub
issue. Read `context.md` first, then this file, then `handoff.md`.

Revision 2026-09-10 (second planner pass): the owner's three decisions are
folded in. The former B1 (backgrounded check) and B2 (parity lockfile) are now
**one batch and one commit**, section 5. Section 4 records what the bundle
costs and why the ordering changed, so nobody later reads it as the planner's
preference.

Revision 2026-09-10 (third planner pass): a fourth failure - a worker
re-running a long command because the first run's result cannot be read back -
is measured in section 2d, decided in section 3 (rows 30-34) and folded into
B1 (section 4, "The third instrument folds in too"). One decision needs the
owner: section 10, Q1.

## 1. Objective and current state

Four failures. The first three are measured in `context.md`, the fourth in
section 2d:

1. A worker backgrounds `npm run check` and loses it (three times, the third
   with three paragraphs of dispatch warning against it).
2. Two heavy runs overlap on one tree (`test-output/parity/` is wiped per run;
   a vitest coverage pass beside a live parity run produces spurious 5000ms
   timeouts). Fifteen peer sessions shared this tree on 2026-09-10.
3. HEAD moves under a session (`ce0c414` landed on `main` while an
   implementer held 27 uncommitted paths). `SessionStart` reports HEAD once.
4. A worker re-runs `npm run check` to learn what the first run already knew:
   the recommended pipe reports `tail`'s exit status, so a failed check comes
   back with no exit line and reads as a pass; a file redirect carries the
   status but hides the run from the gate; and a call with no `timeout` is
   moved to the background by the host at 120 s. Twelve status-motivated
   re-runs across five sessions, three of them today (section 2d).

Owner decisions (`context.md`, "Decisions taken by the repository owner"):
the deny for failure 1 is approved as written; the lockfile for failure 2 is
bundled into the same batch; the one `CLAUDE.md` line is approved. Failure 3
stays a rejected candidate (row 29).

Nothing here can be committed until issue 47's B5.1 lands: `.claude/hooks/*.mjs`
is a covered path for the commit gate, the tree fails typecheck on B5.1's
uncommitted work, and B5.1 holds `tests/parity.js`, which the lockfile edits.
This plan writes nothing outside `issues/hooks-guardrails/`.

## 2. Evidence gathered in planning (2026-09-10)

### 2a. The recorded shapes of the backgrounded check

Found in the session transcripts under
`~/.claude/projects/E--dev-daggerheart-loot/`, `tool_use` inputs with
`"run_in_background":true`:

| Session | Command | `timeout` |
|---|---|---|
| `8b379761` | `npm run check 2>&1 \| tail -20` | 300000 |
| `8b379761` | `npm run check 2>&1 \| grep -E "Test Files\|Tests \|FAIL\|ERROR\|error" ; echo CHECK_EXIT=$?` newline `npm run check:built 2>&1 \| tail -15` | 300000 |
| `8ba57351` | `cd E:/dev/daggerheart-loot && npm run check > "<scratchpad>/check3.log" 2>&1` (and `check4.log`, `check5.log` - three launches) | - |

Two consequences for the design:

- The match must be **per segment** after the shared sanitiser/segmenter, not
  first-segment-only as `check-observer.mjs`'s attribution rule is. The
  recorded shapes are piped, `;`/newline-chained, `cd <repo> &&`-prefixed and
  file-redirected.
- Every recorded launch carried an explicit `timeout` (300000), which means
  the workers knew the Bash tool's **default timeout (120000 ms) is shorter
  than the check (~165 s)**. That is the likeliest reason a worker reaches
  for `run_in_background`, and nothing told them the number to set. The
  replacement command in the block message names the timeout.

Parity and vitest are backgrounded far more often than `npm run check`
(sixteen distinct launches across six sessions), almost always
file-redirected. Those are not the recorded failure and cannot be blocked on
the "forbids nothing that works" argument - see section 3, rejected
extensions.

### 2b. What is verified and what is assumed about `run_in_background`

- **Measured, first planning session:** `PreToolUse(Bash)` fires for a
  `run_in_background: true` call on this host. Probe: a backgrounded
  `cd /nonexistent-hooks-probe-dir && node tests/parity.js`. The long-check
  reminder came back as `PreToolUse:Bash hook additional context`, and the
  command died on the `cd` with exit 1 before anything ran.
- **Assumed, not measured:** that `tool_input.run_in_background` is present in
  that payload. No existing hook has an observable behaviour that depends on
  the flag at `PreToolUse`, and the transcripts record no hook payloads.
  Supporting evidence: the hooks reference defines `tool_input` as the tool's
  input object, and the transcripts' `tool_use` inputs carry
  `run_in_background` and `timeout` alongside `command`.
- **Why the design survives the gap:** an absent field makes the rule inert,
  never a false block. The rule fires only on `run_in_background === true`
  (strict boolean, as `check-observer.mjs` already does). That is the
  asymmetry candidate #19 lacks. Section 5 measures the field as probe A and
  keeps the rule only on a positive.

### 2c. Facts that shape the lockfile

- `tests/parity.js` is **currently modified in the working tree** by the issue
  47 implementer (B5.1). `git status` on 2026-09-10 shows it among 27
  uncommitted paths.
- `tests/parity.js` wipes and recreates `test-output/parity/` (line ~289)
  after the `dist/` check and the `VISUAL_DEBT` validation; it exits via
  `process.exit` (lines ~266 and ~597) and installs no signal handlers.
  `process.on('exit')` fires on `process.exit()` but not on a signal or a
  crash, so a killed run leaves whatever it was writing - including a lock.
- `tests/parity.js` **hashes itself into the legacy screenshot cache key**
  (line ~138, by design): any edit to it makes the next parity run cold.
  CI's unfiltered run is ~867 s; a cold local full run is longer.
- `tests/run-all.js` runs `parity` as a suite in a pool beside the other
  puppeteer suites, and `fs.rmSync`s all of `test-output/` at start. CI runs
  `run-all.js --exclude=parity` and parity as a **four-shard matrix, one
  `ubuntu-latest` runner per shard** - separate filesystems, so shards never
  share a lock. `tools/parity-ubuntu/` writes its own `test-output/` inside
  the container.
- `tests/**` is ignored by eslint (`eslint.config.*`), by prettier
  (`.prettierignore`) and by vitest coverage (`vite.config.mts` includes
  `src/**` only). A new `tests/parity/lock.js` needs no coverage number; the
  hook selftest is what reaches it. `.claude/hooks/*.mjs` **are**
  prettier-checked.
- Node is v24.15.0: `process.kill(pid, 0)` works on Windows (ESRCH for a
  missing pid, EPERM for one we cannot open); an ESM `.mjs` can
  `await import()` a CommonJS file and read `module.exports` as `.default`.
- `.claude/hooks/selftest.mjs` reports **198** cases and its labels already
  reach `#63` (`#59 -am cluster`, `#60 mixed-case`, `#61-#63 pathKey`). The
  first plan's `#59-#70` numbering collided; new groups start at `#64`.
- `CLAUDE.md` is 194 lines; the limit is 200. `.claude/prompts/orchestrate.prompt.md`
  lines 97-102 end with "the next lever is deterministic ... a planning
  decision, not an orchestrator one", which goes stale when this ships.
- The main session on this host is notified when a background command exits,
  so a backgrounded run is lost only when the launcher is a subagent whose
  turn ends. The commit gate cannot see it in either case.

### 2d. Retrieval failures (third pass, 2026-09-10)

Source: every Bash `tool_use` paired with its `tool_result` across the 15
session and 26 subagent transcripts under
`~/.claude/projects/E--dev-daggerheart-loot/` - 3,094 calls, 3,093 with a
result. The extractor and classifier lived in this session's scratchpad and
are not kept; the numbers below are what they printed. The anchor fact was
re-verified on this host's Git Bash 4.4.23: `false | tail -n 2` exits 0,
exits 1 under `set -o pipefail`, and `PIPESTATUS[0]` carries the real status.

Measured on the Bash tool itself, three separate calls:

| Call | What the model sees |
|---|---|
| `false \| tail -n 2` | `(Bash completed with no output)` - reads as a pass |
| `set -o pipefail; false \| tail -n 2` | `Exit code 1` |
| `set -o pipefail && (echo "line of output"; exit 3) \| tail -n 2` | `Exit code 3`, then the output |

The tool prefixes `Exit code N` to a result only when the command's status is
non-zero, and a piped check's status is `tail`'s. So the recommended
invocation shows a failed check as a coverage table with no exit line.

The shapes, with what the evidence actually shows:

| # | Shape | Evidence | Verdict |
|---|---|---|---|
| R1 | **Re-run to learn the status.** A piped `npm run check` is followed by a status-only run (`>/dev/null 2>&1; echo $?`), a file-redirected one (`> log 2>&1; echo EXIT:$?`), or both. | `452267b3` (2026-09-03): seq 166 piped, 167 status-only, then "`npm run check` passes"; seq 252 status-only, 253 grep, 254 tail - three runs for one question; six status-only runs in that session. `eaf37c2b` main (09-09): 188 and 189 piped, 190 status-only. `c9264e71` a5eba (09-09): 21 piped, 22 `echo $?` in a fresh call, 23 file-redirected. `f1284991` aebc (**today**, issue 47 B5.1): 135 piped and passed, 136 file-redirected "Exit code of last check run", 137 piped again for the gate. `c9264e71` a7638 (09-09, issue 65): five file-redirected checks, the commit blocked by the gate twice (seq 29, 31), then the piped form. Twelve status-motivated extra runs across five sessions, about thirty minutes of wall clock. | Real; the reported failure, with the mechanism above. Instrument: row 30. |
| R2 | **`$?` in a fresh call.** A worker asks the next call for the previous call's status. | `844216a7` a098b seq 41 (`echo "EXIT:$?"` printed 0, correct by luck); `c9264e71` a5eba seq 22 (printed 0, then a re-run). Two occurrences, both inside R1. | Real, subsumed by R1: once the call carries its own status there is nothing to ask. One README sentence; no hook (row 33). |
| R3 | **The host moves a timed-out foreground call to the background.** The tool never kills a command; at its `timeout` it prints `Command did not complete within its Ns timeout and was moved to the background (ID: ...)`, and to a subagent adds `it is terminated when you give your final response and no notification can follow`. | 27 such results. `npm run check` with the **default** timeout: `8ba57351` afff seq 57 (09-09) - moved at 120 s; the worker then spent eight calls polling an empty output file ("waiting for npm run check notification", `echo idle`) and ended its turn. Rule 2g does not see it: nothing set `run_in_background`. Every other check call since the check outgrew 120 s carried an explicit timeout - 296 calls set one, 72 at the 600000 maximum - which is workers routing around a number nothing documented. No result of the shape "Command timed out" exists: the host does not time out, it backgrounds. | Real, one occurrence, deterministic mechanism, same consequence as failure 1. Row 31: the prose for this door does not exist yet and B1 writes it in five places; the deny is sketched for when that fails. |
| R4 | **Output over the cap.** A result over about 30,000 characters is not shown; the tool saves it to `tool-results/<id>.txt` and names the path (largest shown 29,787 characters; smallest persisted 29.8 KB). | 75 persisted results. `npm run check` never hit it (`tail -n 120` to `250` stays under). Parity is the producer: its diff lines carry a page's whole text, so `tail -n` cannot bound bytes - `8ba57351` afff seq 13 `tail -80` persisted (30.2 KB), seq 14 `head -20` persisted (30 KB), then the file was read: one extra ~9 min run. `c7fcc1f5` (09-03) re-sized `tail` (-300/-400/-500/-450/-30) across seven `parity "tables"` runs, with edits between most. In about twenty heavy cases the worker grepped the persisted file, which works. | Real, bounded, parity-only, and the retrieval path exists. One clause in the reminder and one README sentence; no hook (row 34). |
| R5 | **Backgrounded run, output only in a task file.** | 135 `run_in_background: true` launches: 69 sleep/poll loops (43 in `8ba57351` - the orchestrator waiting on parity), 35 parity, 11 vitest, 8 check, 3 run-all. Parity and vitest are file-redirected and grepped afterwards; from a main session that works and the host notifies on exit. The check is failure 1. | Not a new failure. The check: rule 2g. The rest: leave alone; the orchestrate prompt owns the waiting. |
| R6 | **A check that outlives the 600 s maximum.** | `844216a7` four times (09-09 and 09-10), `f1284991` aebc seq 84 (today), `c9264e71` `npm test` at 300 s: moved to the background at 590-600 s. That is the README's fork-pool stall, not a retrieval failure, and no timeout value fixes it - 600000 is the tool's maximum. | Leave alone; section 9 records it so nobody raises the timeout hint past the maximum. |
| R7 | **The result is a file the worker then greps.** | For parity: routine and working. For the check: R1's file-redirected half, and the issue 65 worker's five runs before the gate taught it. | Covered by row 30: after the prefix there is no status a file gets you that the pipe does not. |

Also measured: the only reads of `.claude/.check-cache.json` after a check
are in `c9264e71` - issue 65 verifying the hook it was building. No worker
outside that session asked whether the gate armed, so "the observer speaks
its verdict" (row 32) has no evidence behind it.

## 3. Verdicts

Written in the README's candidate-table voice, so the rows can move into
`.claude/README.md` when the batch ships. #27 replaces the existing open row.

| # | Candidate | Event | Verdict | Reason |
|---|---|---|---|---|
| 27 | Block `npm run check` launched with `run_in_background` | `PreToolUse(Bash)` | **adopt** | Three workers on issue 47 backgrounded the check, the third with three paragraphs of dispatch warning against it; prose is exhausted. False-positive-free: `check-observer.mjs` refuses a backgrounded run by design, so one can never satisfy the gate, and blocking it forbids nothing that works. Scoped to the gate-feeding check only - `check:built`, parity and run-all can legitimately run detached from a main session, and the reminder already covers them. Matched per segment, because the recorded shapes were piped, chained, `cd`-prefixed and file-redirected. The message names the replacement in one line, including the Bash timeout: the default 120 s is shorter than the check, which is the likeliest reason a worker backgrounds it. Measured 2026-09-10: `PreToolUse(Bash)` fires for a backgrounded call. Measured <date, probe A>: `tool_input.run_in_background` is present there. |
| 28 | Block a heavy run while a parity run is alive, via a lockfile `tests/parity.js` writes | `PreToolUse(Bash)` | **adopt** (bundled with #27 by owner decision, 2026-09-10) | #15's deferred alternative. The input problem #15 rejected on is gone: the run itself writes the lock, so the hook stats one file instead of enumerating processes, and a human's terminal run is seen too. The stale-lock false positive is closed by liveness (`process.kill(pid, 0)`, no `tasklist`) plus a heartbeat TTL - a dead pid or a stale heartbeat is ignored, so the rule can only fire on a run that is actually alive, and a second heavy run beside it produces garbage, so the block forbids nothing that works. `parity.js` also refuses to start over a live lock, which covers parity-vs-parity with no hook in the loop. Fifteen peers on one tree make the overlap a matter of when. Known gaps, recorded: the vitest-alive side is invisible (`npm run check` writes no lock); a container run (`tools/parity-ubuntu/`) is invisible; on Windows a crashed run's pid can be reused inside the TTL, which the message answers with "delete the lock". The planner recommended shipping this after #27 (one measured collision behind it against #27's three; it edits a file another batch holds); the owner bundled them - section 4. |
| 29 | Report HEAD moving under a session | `PreToolUse(Bash)` on `git commit`, or `Stop` | **reject for now** | Nothing collided in the recorded case; the prose that owns it ("Your writers are not the only writers", `3541a23`/`e5a26a2`) is one day old and has not been given a chance to fail, and the standing bar is a repeated mistake. Not `PreToolUse(Task)`: the dispatch tool is `Agent` on this host and `Task` in the reference, an unverified matcher (#19-shaped). Not `UserPromptSubmit`: #22. If the prose fails once, the cheapest deterministic form needs no unverified input: `session-start.mjs` records the HEAD sha in the session's `.hook-state.json` entry; `bash-guard.mjs`, on a `git commit` segment it already parses, compares `git rev-parse HEAD` against it and speaks (never denies) "HEAD moved since this session started: X -> Y, N commits not yours - `git log --oneline X..Y`; your commit lands on top, record Y as the base in the handoff"; `check-observer.mjs` refreshes the stored sha after the session's own commit. |
| 30 | Accept a leading `set -o pipefail` in the observer's attribution rule, and make the canonical invocation carry it | `PostToolUse(Bash)` (attribution only) | **adopt** (pending the owner: section 10, Q1) | The recommended pipe reports `tail`'s status, so a failed check comes back with no exit line and reads as a pass; twelve check runs across five sessions were spent learning the status a second way (section 2d, R1). With the prefix the tool prints `Exit code 1` on a failed check, `check-observer.mjs` sees `exit_code: 1` and refuses to arm, and the worker reads one line. Forgery: `set -o pipefail` writes nothing to stdout, so the check stays the only stdout producer; the strip removes exactly the tokens `set -o pipefail` plus one `;` or `&&` at the start, on either side of the `cd` strip, and nothing else, after which every existing refusal applies unchanged. `set -o pipefail; echo "All files"` (first segment is `echo`), `set -o pipefail; npm run check > o.txt 2>&1; grep "All files" o.txt` (a `;` survives), `set -o pipefail; true; npm run check ...` (same), `set -eo pipefail; ...` and `set -x; ...` (not stripped, the separator survives) are all still refused. A forger gains nothing: omitting the prefix is today's state, and with it the exit code only tightens the gate. Measured 2026-09-10 on the Bash tool (section 2d). |
| 31 | Deny a foreground `npm run check` with no `timeout` (rule 2g, second trigger) | `PreToolUse(Bash)` | **reject for now**, sketched | The tool moves a call that outlives its timeout to the background instead of killing it, the default is 120 s, and the check is ~165 s healthy, so a check call without a `timeout` cannot finish in the foreground on this host and is lost exactly as a backgrounded one is - measured once (`8ba57351` afff seq 57). But the number was undocumented until now: B1 puts it in the 2g deny message, the 2f reminder, the README, `CLAUDE.md` and the implement prompt, and the deny message arrives at the exact moment a worker retries in the foreground. That prose has not been given a chance to fail, which is the standing bar (row 29). And the deny has a failure mode of its own: it must fire on an *absent* field, so a host that stops passing `tool_input.timeout` to hooks would deny every foreground check - loud and diagnosable, but the one thing a guard must not do. Sketched verbatim in section 5, "Row 31, when it is needed"; probe A0 measures the field now so the decision is a copy-paste later. |
| 32 | The observer speaks its verdict (armed / not armed and why) | `PostToolUse(Bash)` | **reject** | Tempting and cheap. But the only recorded reads of `.check-cache.json` are issue 65 verifying its own hook, and once the exit code is the check's (row 30) the worker has the status. No evidence; the observer stays silent by design. |
| 33 | Speak on `echo $?` as the first command of a call | `PreToolUse(Bash)` | **reject** | Two occurrences, both inside R1; row 30 removes the reason to ask. One README sentence instead. |
| 34 | A hook for a result over the output cap | any | **reject** | The size is unknowable before the run, and the tool already persists the full output and names the file. The failure is re-running instead of reading it: the reminder gains one clause and the README one sentence. Parity's one-line-per-page diff text is the producer; shortening it is a `tests/` change with diagnostic cost, not this task's. |

Rejected extensions, so nobody re-derives them:

- **Block a file-redirected foreground `npm run check`.** Not the recorded
  failure; sometimes the right way to read a long failure log; documented.
- **Block backgrounded `check:built`, parity, run-all, vitest.** They do not
  feed the gate, so a backgrounded run from a main session can legitimately
  work. The reminder covers them and gains the timeout hint.
- **Consume the long-check `once` marker inside the deny.** A side effect in
  a deny path for one saved sentence. The foreground retry gets the reminder
  once, which is correct.
- **Enumerate processes for the lock's liveness** (`tasklist`, `ps`). #15's
  reason stands: 200-500 ms on a tool path and cannot tell a harness
  Chromium from the human's browser. `kill(pid, 0)` is microseconds.
- **Duplicate the liveness predicate in the hook** instead of importing the
  shared module. Two definitions of "live" drift; the campsite rule extracts
  on the second use. The hook imports the module inside a try so a broken or
  missing file fails open (section 5, step 4).
- **Require the prefix** (refuse the plain pipe). A human at a terminal
  types `npm run check`; the markers-plus-`All files` path stays for that.
  The prefix is the canonical agent form, not the only accepted one.
- **Strip other `set` forms** (`set -eo pipefail`, `set -o pipefail -x`).
  Harmless too, but exactness is the whole safety argument; one token
  sequence, documented, or nothing.
- **Extend row 31 to a timeout below the check's cost** (say under 300000)
  or to parity, vitest, `check:built`, run-all. An explicit number is a
  choice; the other families do not feed the gate and the main session is
  notified when a backgrounded one exits. The reminder carries the hint.

## 4. Why one batch, and what the bundle costs

The planner's first pass split the work: B1 (the deny) first, B2 (the
lockfile) after B1 shipped and after B5.1 landed. The owner bundled them on
2026-09-10. That is settled input; this section exists so the record keeps the
argument, not to re-open it.

Why the split was proposed:

- **Evidence asymmetry.** #27 has three recorded failures with prose already
  exhausted; #28 has one measured collision. Shipping them apart would have
  let the deny land on its own evidence and the lock wait for a second
  collision or the owner's call. The owner made the call.
- **File ownership.** The lock edits `tests/parity.js`, which B5.1 holds. The
  deny touches only `.claude/` and docs and was blocked on B5.1 for the
  commit gate alone.

What the bundle costs, and where each cost lands:

1. **The batch is gated on B5.1 twice over.** The commit gate needs a passing
   `npm run check` for the whole tree (B5.1's uncommitted work fails
   typecheck), and now the batch also needs `tests/parity.js` free. Before
   the bundle, the deny could have started the moment the tree typechecked;
   now it waits for `tests/parity.js` too. Recorded in the preconditions.
2. **One commit means the two guardrails stand or fall together.** A review
   objection to the lock's liveness test blocks the deny from landing; a
   revert of a misfiring lock rule takes the deny out with it unless someone
   does a partial revert by hand. Recorded in the commit step and in the
   handoff's fallback: probe A's measured-absent branch drops rule 2g before
   the commit, never after.
3. **Two live probes in one session**, each with a written fork. The session
   that implements this is longer and has more places to stop.
4. **The `tests/parity.js` edit makes the next parity run cold** (section
   2c). That cost was coming with the lock whenever it shipped; bundling
   moves it to the first parity run after this commit, which is whichever
   issue 47 batch follows B5.1. Recorded here and in the handoff's deferred
   list so that batch is not surprised.
5. **The selftest diff is larger** and carries two instruments' no-fire
   cases. A guard that blocks legitimate work is worse than no guard, and
   there are now two in one commit - which is why section 5 keeps every
   no-fire case in one named list and makes the list an acceptance criterion.

**The third instrument folds in too.** Row 30 touches `check-observer.mjs`,
`bash-guard.mjs` (two message strings), `selftest.mjs`, the README, both
prompts and the one `CLAUDE.md` line - the files rule 2g touches and none
that rule 2h touches. It cannot ship after B1: rule 2g's deny message and the
2f reminder both quote the recommended invocation, so a B1 without it would
ship a deny that teaches the form that hides the exit code, and the follow-up
commit would edit the same message strings, the same README paragraph and the
same `CLAUDE.md` line again. It cannot usefully ship before B1 either:
`.claude/hooks/*.mjs` is a covered path, so its commit waits on B5.1 exactly
as B1 does, and a B0 would buy nothing but the double edit. So B1 carries
three instruments. What that costs: the review couples one more thing - a
forgery objection to the strip now blocks 2g and 2h. The mitigation is in the
fallback: the strip is one line plus its ten cases, and dropping it before the
commit reverts the invocation strings to the plain form with no other change.

## 5. B1 - the guardrails around a long check (implement-ready)

### Objective

One commit that adds two deterministic guards to `bash-guard.mjs`, both for
a heavy run a session cannot see, and one relaxation to `check-observer.mjs`
so the recommended check call shows its own exit status:

- **Rule 2g, backgrounded check.** Deny a Bash call whose
  `tool_input.run_in_background` is `true` and whose command contains an
  `npm run check` invocation in any segment. One-line message naming the
  foreground replacement and the Bash timeout. The long-check reminder
  gains the same timeout hint.
- **Rule 2h, live parity lock.** `tests/parity.js` writes
  `test-output/parity.lock` while it runs, heartbeats it per state and
  removes it on exit; it refuses to start over a live lock. `bash-guard.mjs`
  denies a heavy run (`npm run check`, `check:built`, `check:fast`, `npm
  test`, vitest, `npm run build`, parity, run-all) while a lock is live.
  "Live" is one shared definition: pid answers `kill(pid, 0)` and the
  heartbeat is under 15 minutes old.
- **The prefix.** `check-observer.mjs`'s attribution rule accepts a leading
  `set -o pipefail` followed by `;` or `&&`, on either side of the `cd`
  strip, and nothing else. The canonical invocation becomes
  `set -o pipefail; npm run check 2>&1 | tail -n 120` with Bash
  `timeout: 600000`, and every place that quotes the invocation quotes
  exactly that string: the 2g deny, the 2f reminder, the README, the
  implement prompt, the orchestrate prompt, `CLAUDE.md`.

Selftest proves both denies on their recorded shapes and proves no fire on
foreground, other families, absent or non-boolean flag, readers, dead-pid
lock, stale-heartbeat lock, malformed lock, no lock; and proves the prefix is
accepted in its four legitimate shapes and refused in its six forgery shapes.
Durable text lands in the README (the one home for why each part of the
invocation matters), both prompts, `docs/parity.md` and one `CLAUDE.md`
line. Three live probes measure what the selftest cannot.

### Preconditions - do not start otherwise

1. `issues/47/handoff.md` records B5.1 as **committed**, with its sha.
2. `git status --porcelain` shows **no** modified or untracked path under
   `app/` or `tests/` that this batch did not create. In particular
   `tests/parity.js` is not listed. One writer per tree; the hooks are a
   covered path and the commit needs a passing `npm run check` for the whole
   tree.
3. `node .claude/hooks/selftest.mjs` passes on the untouched tree and reports
   **198 passed** before any edit, so a later failure is attributable.
4. `wc -l CLAUDE.md` prints 194.

If any of the four fails: stop, record which in the handoff, do not edit.

### Files

Create:

- `tests/parity/lock.js` - the lock module (CommonJS, like its siblings)

Edit:

- `.claude/hooks/lib.mjs` - export `CHECK_INVOCATION_RE`
- `.claude/hooks/check-observer.mjs` - import it, delete the local copy,
  accept the `set -o pipefail` prefix in `isCheckInvocation`
- `.claude/hooks/bash-guard.mjs` - two messages, rules 2g and 2h, the lock
  module import, the reminder hint
- `.claude/hooks/selftest.mjs` - three case groups, one helper set, two
  extended assertions, header comment range
- `tests/parity.js` - require the lock, acquire before the wipe, heartbeat
  per state, release on exit, header comment
- `.claude/README.md` - hook table row, long-check paragraph, a new "one
  heavy run" paragraph, known-limitations bullets, facts list, candidate
  rows #27-#29
- `.claude/prompts/orchestrate.prompt.md` - the stale sentence
- `.claude/prompts/implement.prompt.md` - step 7's invocation
- `docs/parity.md` - "Before a run"
- `CLAUDE.md` - one line under Quality gates
- `issues/hooks-guardrails/plan.md`, `handoff.md`, `context.md` - status

No change to `.claude/settings.json`: both rules live inside the
already-registered `bash-guard.mjs`. No change to `tests/run-all.js`,
`tests/parity/specs.js`, `tests/parity/driver.js`, or anything under `app/`.

### Settled design constraints - do not reopen

- Rule 2g fires on `run_in_background === true` only (strict boolean), for
  the gate-feeding `npm run check` only, per segment.
- Rule 2h reads one file, parses one small JSON, calls `kill(pid, 0)` once.
  No process enumeration. Any read, parse or import failure is allow.
- The lock lives at `test-output/parity.lock` (gitignored via
  `test-output/`), beside - not inside - `test-output/parity/`, which the
  runner wipes.
- One definition of "live", in `tests/parity/lock.js`, used by both sides.
- Both denies return before the long-check reminder, so the `once` marker is
  not consumed by a deny; the foreground retry gets the reminder once.
- Messages are one line each. The deny message is the whole value of a deny.
- `parity.js` output stays in the file's language (Russian product text);
  hook messages, code, comments and docs are English.
- The canonical invocation is the one string
  `set -o pipefail; npm run check 2>&1 | tail -n 120` with Bash
  `timeout: 600000`. Every place that quotes it quotes exactly that; only
  the README paragraph "Run a long check" explains it. No second form
  circulates.
- The observer strips exactly `set -o pipefail` followed by one `;` or
  `&&`, at the start, in a loop with the `cd` strip. Nothing else is
  stripped; the plain pipe stays accepted.
- Row 31 does not ship. Its sketch is copied, not adapted, when the owner
  says so.

### Ordered steps

1. **Share the check regex.** In `lib.mjs`, next to the sanitiser exports:

   ```js
   /** `npm run check` and nothing else: `check:built` never runs the suite
    * and `check:fast` skips half of it, so neither may satisfy the gate, and
    * neither is the backgrounded run bash-guard blocks. */
   export const CHECK_INVOCATION_RE = /^npm\s+run\s+(?:-s\s+)?check(?![:\w-])/;
   ```

   In `check-observer.mjs`, delete the local `CHECK_RE` and its comment,
   import `CHECK_INVOCATION_RE` from `./lib.mjs`, and use it in
   `isCheckInvocation`. Second real use, both inline copies removed.

   In the same function, replace the two-iteration `cd` strip with:

   ```js
     // `cd <dir> &&` and `set -o pipefail;` are habit and hygiene, not output
     // producers: neither writes to stdout, so the check is still the only
     // thing that can have produced what this hook reads. Exactly those
     // tokens, at the start, in either order; `set -eo pipefail`, `set -x` or
     // anything else between them and the check leaves a separator behind
     // and is refused by the test below.
     for (let i = 0; i < 3; i++) {
       s = s.replace(/^cd(\s+[^\s;&|]+)?\s*&&\s*/i, '');
       s = s.replace(/^set -o pipefail\s*(?:;|&&)\s*/, '');
     }
   ```

   and add to the doc comment above `isCheckInvocation`, after the `cd`
   sentence: "A leading `set -o pipefail;` is accepted for the same reason
   and is the recommended prefix: without it the pipeline's status is
   `tail`'s, the Bash tool prints no exit line for a failed check, and a
   worker re-runs the check to learn what it already ran - measured twelve
   times across five sessions, `issues/hooks-guardrails/plan.md` section
   2d. With it `exit_code` is the check's and the non-zero test below
   refuses to arm. Accepting the prefix cannot weaken the gate: a forger who
   omits it is where the gate stood before." Nothing else in the function
   changes; `sanitize` has already collapsed whitespace, so the regex needs
   no `\s+` between the tokens.

2. **Create `tests/parity/lock.js`.** Full text; the implementer copies it:

   ```js
   /* One parity run per tree at a time.
    *
    * tests/parity.js wipes test-output/parity/ when it starts, and a vitest
    * coverage pass beside a live parity run throws spurious 5000ms timeouts
    * (measured on issue 47, 2026-09-10). The run itself writes this lock, so
    * the PreToolUse hook in .claude/hooks/bash-guard.mjs can stat one file
    * instead of enumerating processes, and a run started from a human's
    * terminal is seen too.
    *
    * A lock is live only while its pid still answers `kill(pid, 0)` and its
    * heartbeat is younger than LOCK_TTL_MS. A killed run leaves a lock with
    * a dead pid, ignored by construction; a hung run stops heartbeating and
    * is ignored after the TTL. Both sides fail open: a missing or malformed
    * lock is no lock. Shared by parity.js (CommonJS) and bash-guard.mjs (ESM,
    * via import()), so the two agree on what "live" means. */
   const fs = require('fs');
   const path = require('path');

   /* parity.js touches the lock once per state, so a long full run never
      outlives the TTL, while a crashed run's lock stops counting fifteen
      minutes after its last heartbeat - the window in which a reused pid
      could read as alive on Windows. */
   const LOCK_TTL_MS = 15 * 60 * 1000;

   const lockPath = (root) => path.join(root, 'test-output', 'parity.lock');

   function readLock(root) {
     try {
       const parsed = JSON.parse(fs.readFileSync(lockPath(root), 'utf8'));
       if (!parsed || typeof parsed !== 'object') return null;
       if (!Number.isInteger(parsed.pid) || parsed.pid <= 0) return null;
       if (!Number.isFinite(parsed.at)) return null;
       return parsed;
     } catch {
       return null;
     }
   }

   function pidAlive(pid) {
     try {
       process.kill(pid, 0);
       return true;
     } catch (e) {
       return Boolean(e) && e.code === 'EPERM';
     }
   }

   function isLive(lock, now = Date.now()) {
     if (!lock) return false;
     if (now - lock.at >= LOCK_TTL_MS) return false;
     return pidAlive(lock.pid);
   }

   function describe(lock) {
     const started = new Date(Number.isFinite(lock.startedAt) ? lock.startedAt : lock.at);
     const filter =
       Array.isArray(lock.argv) && lock.argv.length ? lock.argv.join(' ') : 'all states';
     return `pid ${String(lock.pid)}, started ${started.toISOString()}, ${filter}`;
   }

   function write(root, lock) {
     fs.mkdirSync(path.dirname(lockPath(root)), { recursive: true });
     fs.writeFileSync(lockPath(root), JSON.stringify(lock));
   }

   /* Returns { ok: true } after writing our lock, or { ok: false, held } when
      a live one is already there. A dead or stale lock is overwritten. */
   function acquire(root, argv, now = Date.now()) {
     const held = readLock(root);
     if (isLive(held, now)) return { ok: false, held };
     write(root, { pid: process.pid, startedAt: now, at: now, argv });
     return { ok: true };
   }

   function touch(root, now = Date.now()) {
     const lock = readLock(root);
     if (!lock || lock.pid !== process.pid) return;
     write(root, { ...lock, at: now });
   }

   /* Only our own lock: a run that outlived a TTL and was overwritten must
      not delete its successor's lock on the way out. */
   function release(root) {
     try {
       const lock = readLock(root);
       if (lock && lock.pid === process.pid) fs.unlinkSync(lockPath(root));
     } catch {
       /* nothing to release, or already gone */
     }
   }

   module.exports = { LOCK_TTL_MS, lockPath, readLock, isLive, describe, acquire, touch, release };
   ```

3. **Wire the runner.** In `tests/parity.js`:

   - After `const { makeDriver, prepare } = require('./parity/driver.js');`
     add `const lock = require('./parity/lock.js');`.
   - Directly **before** `fs.rmSync(SHOTS, { recursive: true, force: true });`
     (after the `VISUAL_DEBT` validation loops) insert:

     ```js
     /* Before the wipe, not after: the wipe is the thing a second run must
        not do to a live one. See tests/parity/lock.js. */
     const held = lock.acquire(ROOT, process.argv.slice(2));
     if (!held.ok) {
       console.log(
         `паритет уже идёт в другом процессе (${lock.describe(held.held)}) - дождись его или удали test-output/parity.lock, если тот процесс мёртв`
       );
       process.exit(1);
     }
     process.on('exit', () => lock.release(ROOT));
     ```

   - As the first statement inside `for (const [stateIdx, state] of
     STATES.entries()) {` add `lock.touch(ROOT);` with the comment
     `/* Heartbeat: a full run outlives a fixed TTL, a crashed one must not. */`.
   - Header comment: after the "Needs a build" paragraph add one paragraph:
     "One run per tree: writes test-output/parity.lock while it runs and
     refuses to start over a live one; .claude/hooks/bash-guard.mjs reads
     the same lock to keep vitest and a second parity off this tree
     meanwhile. See tests/parity/lock.js."

   The `dist/` check stays before the acquire, so a build-less invocation
   fails fast without writing a lock.

4. **`bash-guard.mjs`.** In order:

   a. Imports. Add `CHECK_INVOCATION_RE` to the `./lib.mjs` import list.
      After the imports add the lock module, fail-open:

      ```js
      // The lock module is test code shared with tests/parity.js, so the two
      // sides agree on what "live" means. Imported inside a try: a missing or
      // broken module means no rule, never a crashed hook.
      let parityLock = null;
      try {
        parityLock = (await import(new URL('../../tests/parity/lock.js', import.meta.url).href))
          .default;
      } catch {
        // fail open
      }
      ```

   b. Messages. Add to `MSG`:

      ```js
      backgroundCheck:
        "Blocked: a backgrounded `npm run check` can never satisfy the commit gate - there is no stdout to attribute, and a turn that ends with it running loses the result. Run it in the foreground in this turn, Bash timeout 600000: `set -o pipefail; npm run check 2>&1 | tail -n 120` (the prefix makes the exit code the check's).",
      parityLock: (cmd, holder) =>
        `Blocked: a parity run is alive on this tree (${holder}), and \`${cmd}\` beside it corrupts both - test-output/parity/ is wiped per run, and vitest next to a live parity run throws spurious 5000ms timeouts. Wait for it to finish; if no parity run is actually alive (a crashed run whose pid was reused), delete test-output/parity.lock.`
      ```

      One line each. Do not add a second sentence to either.

   c. Rule 2g, after the commit gate section and before the long-check
      reminder:

      ```js
      // ---------- 2g: a backgrounded npm run check (deny) ----------
      //
      // check-observer.mjs refuses a run_in_background launch by design (no
      // stdout to attribute), so such a run can never satisfy the commit gate,
      // and a worker whose turn ends with it running loses the result. Three
      // workers on issue 47 did exactly this with the dispatch warning against
      // it. Blocking it forbids nothing that works. Only the gate-feeding check:
      // the other long checks can legitimately run detached from a main session.
      // Per segment, not first-segment: the recorded shapes were piped, chained,
      // `cd`-prefixed and file-redirected. Strict boolean, as the observer: an
      // absent field must make this rule inert, never a false block.

      function evaluateBackgroundCheck(segList, toolInput) {
        if (!toolInput || toolInput.run_in_background !== true) return null;
        for (const segment of segList) {
          const info = segmentInfo(segment);
          if (!info) continue;
          if (CHECK_INVOCATION_RE.test(info.tokens.join(' '))) {
            return { id: 'background-check', message: MSG.backgroundCheck };
          }
        }
        return null;
      }
      ```

   d. Rule 2h, directly after 2g. `LONG_CHECKS` must be declared above it
      (move the `LONG_CHECKS` const up from section 2f if needed; do not
      duplicate it):

      ```js
      // ---------- 2h: a heavy run beside a live parity run (deny) ----------
      //
      // tests/parity.js writes test-output/parity.lock while it runs (see
      // tests/parity/lock.js). Two heavy runs on one tree corrupt each other:
      // test-output/parity/ is wiped per run, and a vitest coverage pass beside
      // a live parity run threw spurious 5000ms timeouts on issue 47. Fifteen
      // sessions shared this tree on 2026-09-10. Liveness is the module's, not
      // ours: a dead pid or a stale heartbeat is no lock, so this cannot fire
      // on a crashed run's leftovers. One stat, one parse, one kill(0).

      const HEAVY_RUNS = [
        ...LONG_CHECKS.map((s) => s.re),
        CHECK_INVOCATION_RE,
        /^npm (?:run )?test\b/,
        /^(?:npx )?vitest\b/,
        // dist/ is parity's candidate side; rebuilding it mid-run changes
        // what later states measure.
        /^npm run build\b/,
        /^(?:npx )?vite build\b/
      ];

      function evaluateParityLock(segList) {
        if (!parityLock) return null;
        let heavy = null;
        for (const segment of segList) {
          const info = segmentInfo(segment);
          if (!info) continue;
          const joined = info.tokens.join(' ');
          if (HEAVY_RUNS.some((re) => re.test(joined))) {
            heavy = joined;
            break;
          }
        }
        if (!heavy) return null;
        const lock = parityLock.readLock(repoRoot());
        if (!parityLock.isLive(lock)) return null;
        return { id: 'parity-lock', message: MSG.parityLock(heavy, parityLock.describe(lock)) };
      }
      ```

   e. Entry point. After the commit gate block and before `evaluateLongCheck`:

      ```js
      const background = evaluateBackgroundCheck(segList, input.tool_input);
      if (background) return deny(event, background.message);

      const parity = evaluateParityLock(segList);
      if (parity) return deny(event, parity.message);
      ```

   f. Reminder hint. In `evaluateLongCheck`, change the message to (keep
      "stay in this turn" - selftest #29 asserts it):

      ```text
      `<cmd>` takes <cost> here. Run it as `set -o pipefail; <cmd> 2>&1 | tail -n 120` with the Bash timeout set to 600000 - the default 120000 is shorter than the run, and the tool moves a call that outlives its timeout to the background - and stay in this turn until it finishes: a turn that ends with a check still running loses the result. Do not redirect it to a file; the commit gate only trusts output it can see. If the result comes back persisted as too large, grep the file it names rather than running it again.
      ```

   g. `<cmd>` in the template above is `joined`, so for parity it reads
      `set -o pipefail; node tests/parity.js modal 2>&1 | tail -n 120` - the
      prefix is harmless there and the persisted-file clause is the one that
      matters for parity. Keep "stay in this turn" verbatim (selftest #29).

   h. Update the file's header comment: "five rule families" becomes
      "seven"; `segmentInfo` already skips `READERS` and unwraps
      `env`/`command`/`nohup`/`time`/`xargs`, so `echo npm run check` never
      matches and `nohup npm run check` does.

   i. Run `npx prettier --write .claude/hooks/*.mjs` - the hooks are
      prettier-checked; `tests/` is not.

5. **Selftest - the one named list.** Add two functions after
   `testLongCheck()` in `main()`: `testBackgroundCheck()` then
   `testParityLock()` (async; it imports the lock module). Extend the header
   comment's range (`#1-#58` becomes `#1-#101`). Add helpers near
   `bashPayload`:

   ```js
   const scratchLockPath = () => path.join(scratchRoot, 'test-output', 'parity.lock');
   function writeLock(contents) {
     fs.mkdirSync(path.dirname(scratchLockPath()), { recursive: true });
     fs.writeFileSync(scratchLockPath(), typeof contents === 'string' ? contents : JSON.stringify(contents));
   }
   function removeLock() {
     fs.rmSync(scratchLockPath(), { force: true });
   }
   /** A pid that has certainly exited: a child that ran and returned. The
    * reuse window between its exit and the assertion is milliseconds. */
   function deadPid() {
     return spawnSync(process.execPath, ['-e', '0']).pid;
   }
   const lockDeny = (result) => denyReason(result).includes('parity run is alive');
   ```

   `SELFTEST_CASES` - every case below is in the batch; each `check(...)`
   counts toward the total. Labels follow the file's `#N` style.

   **Rule 2g, session `s-bgcheck`** (`bashPayload(cmd, { run_in_background: true, session_id })` unless stated):

   - `#64 background check: plain` - `npm run check` denied; reason includes
     `set -o pipefail; npm run check 2>&1 | tail -n 120` and `600000`.
   - `#65 background check: recorded shape, piped` -
     `npm run check 2>&1 | tail -20` denied.
   - `#66 background check: recorded shape, cd-prefixed and file-redirected` -
     `cd E:/dev/daggerheart-loot && npm run check > "C:/Users/x/scratchpad/check3.log" 2>&1` denied.
   - `#67 background check: recorded shape, chained` -
     `npm run check 2>&1 | grep -E "Test Files|Tests |FAIL" ; echo CHECK_EXIT=$?\nnpm run check:built 2>&1 | tail -15` denied.
   - `#68 background check: -s, env prefix, nohup` - each of `npm run -s check`,
     `SKIP_CHECK_GATE=1 npm run check`, `nohup npm run check` denied (the
     bypass belongs to the gate, not this rule).
   - `#69 background check: foreground is not denied` - `npm run check` with
     `run_in_background: false` is not a deny (it may speak; assert `!isDeny`).
   - `#70 background check: absent field is inert` - a hand-built payload
     whose `tool_input` is `{ command: 'npm run check' }` with no
     `run_in_background` key is not a deny.
   - `#71 background check: non-boolean flag is inert` -
     `tool_input.run_in_background` set to the string `'true'` is not a deny.
   - `#72 background check: other families are not denied` - each of
     `npm run check:built`, `npm run check:fast`, `node tests/parity.js tables`,
     `node tests/run-all.js parity`, `npx vitest run --coverage` backgrounded
     is not a deny.
   - `#73 background check: readers and quoted mentions are not denied` -
     each of `echo npm run check`, `grep -r "npm run check" .claude`,
     `git log --grep "npm run check"`, `cat notes.txt` backgrounded is not
     a deny.
   - `#74 background check: deny wins over the reminder` - fresh session id,
     backgrounded plain case returns deny JSON with no `systemMessage`.
   - `#75 background check: the reminder still fires on the foreground retry` -
     in `s-bgcheck`, after `#64`'s deny, foreground `npm run check` returns
     a `systemMessage` containing `stay in this turn` and `600000`.
   - Extend `#29 long-check: first fire` with two more `check` calls: the
     message includes `600000`, and it includes
     `set -o pipefail; npm run check 2>&1 | tail -n 120`.
   - Extend `#49e piped to tail (the recommended invocation)`'s label to
     `(the plain pipe, still accepted)`; the command stays.

   **Rule 2h, session `s-lock`, foreground unless stated.** Live lock =
   `{ pid: process.pid, startedAt: Date.now(), at: Date.now(), argv: ['modal 375'] }`
   (the selftest's own pid is alive by definition). `removeLock()` in a
   `finally` around the group.

   - `#76 lock: live lock denies npm run check` - reason includes
     `parity run is alive`, `String(process.pid)`, `modal 375` and
     `parity.lock`.
   - `#77 lock: live lock denies each heavy family` - each of
     `node tests/parity.js modal`, `node tests/run-all.js parity`, `npm test`,
     `npm run test`, `npx vitest run --coverage`, `vitest run`,
     `npm run check:built`, `npm run check:fast`, `npm run build`,
     `cd E:/dev/daggerheart-loot && npm run check 2>&1 | tail -n 120` is a
     `lockDeny`.
   - `#78 lock: live lock leaves other work alone` - each of `git status`,
     `npm run lint`, `node tests/derived.js`, `echo npm test`,
     `cat test-output/parity.lock`, `grep -r vitest app/`, `npm run dev`
     is not a `lockDeny` (assert on the reason text, not on `isDeny`, since
     the commit gate or another rule may deny for its own reason).
   - `#79 lock: dead pid is ignored` - lock with `pid: deadPid()`, fresh
     heartbeat; `npm run check` is not a `lockDeny`.
   - `#80 lock: stale heartbeat is ignored` - lock with `pid: process.pid`
     and `at: Date.now() - 16 * 60 * 1000`; `npm run check` is not a
     `lockDeny`.
   - `#81 lock: malformed lock is ignored` - file contents `not json`;
     `node tests/parity.js x` is not a `lockDeny`.
   - `#82 lock: lock without a usable pid is ignored` - each of `{}`,
     `{ "pid": "12", "at": <now> }`, `{ "pid": 0, "at": <now> }` is not a
     `lockDeny`.
   - `#83 lock: no lock file` - after `removeLock()`, `npm test` is not a
     `lockDeny`.
   - `#84 lock: deny wins over the reminder` - fresh session id, live lock,
     `node tests/parity.js x` returns deny JSON with no `systemMessage`.
   - `#85 lock: backgrounded check under a live lock is still denied` - live
     lock, `npm run check` with `run_in_background: true` is a deny (either
     message; assert `isDeny`).

   **Lock module, imported directly** (`const lockMod = (await import(new
   URL('../../tests/parity/lock.js', import.meta.url).href)).default;`, root
   = `scratchRoot`, `removeLock()` before and after):

   - `#86 lock module: acquire on a clean tree` - returns `{ ok: true }`; the
     file exists; parsed `pid === process.pid`; `startedAt === at`;
     `argv` round-trips.
   - `#87 lock module: acquire over a live lock refuses` - with a live lock
     present, `acquire` returns `ok: false` and `held.pid` equals the
     holder's pid; the file is unchanged.
   - `#88 lock module: acquire over a dead-pid lock overwrites` - lock with
     `deadPid()`; `acquire` returns `ok: true`; the file now carries
     `process.pid`.
   - `#89 lock module: touch advances at and keeps startedAt` - acquire with
     `now = 1000`, touch with `now = 5000`; parsed `at === 5000`,
     `startedAt === 1000`.
   - `#90 lock module: release removes only our own lock` - after acquire,
     `release` removes the file; with a lock carrying `deadPid()` written
     by hand, `release` leaves it in place.
   - `#91 lock module: readLock with no test-output/ directory` - after
     `fs.rmSync(path.join(scratchRoot, 'test-output'), { recursive: true, force: true })`,
     `readLock(scratchRoot)` returns `null` without throwing, and `acquire`
     then succeeds (it creates the directory).

   **Attribution prefix, observer** - ten more rows in `attributionCases`
   inside `testCheckObserver()`, each `[label, command, response,
   shouldCache]`, `passingResponse` unless stated. The four accepts and the
   six refusals are the whole of what row 30 promises:

   - `#92 pipefail prefix, semicolon` -
     `set -o pipefail; npm run check 2>&1 | tail -n 120` - cache written.
   - `#93 pipefail prefix, &&` -
     `set -o pipefail && npm run check 2>&1 | tail -n 120` - cache written.
   - `#94 cd then pipefail` -
     `cd "E:/dev/daggerheart-loot" && set -o pipefail; npm run check 2>&1 | tail -n 120` -
     cache written.
   - `#95 pipefail then cd` -
     `set -o pipefail; cd /repo && npm run check 2>&1 | tail -n 120` - cache
     written.
   - `#96 pipefail then echo (forgery)` - `set -o pipefail; echo "All files"` -
     no cache.
   - `#97 pipefail, redirect, grep (forgery)` -
     `set -o pipefail; npm run check > o.txt 2>&1; grep "All files" o.txt` -
     no cache.
   - `#98 pipefail, something between, check` -
     `set -o pipefail; true; npm run check 2>&1 | tail -n 120` - no cache.
   - `#99 other set forms are not stripped` - each of
     `set -eo pipefail; npm run check 2>&1 | tail -n 120` and
     `set -x; npm run check 2>&1 | tail -n 120` - no cache (two `check`
     calls under one label suffix `a`/`b`).
   - `#100 pipefail, check:built` -
     `set -o pipefail; npm run check:built 2>&1 | tail -n 120` - no cache.
   - `#101 pipefail carries the status` -
     `set -o pipefail; npm run check 2>&1 | tail -n 120` with response
     `{ exit_code: 1, stdout: 'All files | 96 |\n', stderr: '', interrupted: false }`
     (no failure marker) - no cache. Beside `#92`, which arms on the same
     stdout with `exit_code: 0`, this is the case that shows the prefix
     tightens the gate rather than loosening it.

   `ALL_SCRIPTS` (the fail-open contract) is unchanged: `lock.js` is not a
   hook. Expected total: 198 plus the new `check(...)` calls. **Record the
   exact number the script prints in the handoff.**

6. **Durable text.**

   - `.claude/README.md` hook table, `bash-guard.mjs` row: add "a
     backgrounded `npm run check`, and a heavy run (`npm run check`,
     `check:built`, `npm test`/vitest, `npm run build`, parity, run-all)
     while `test-output/parity.lock` is live" to the block list.
   - README hook table, `bash-guard.mjs` row: nothing further for row 30
     (it is the observer's rule); `check-observer.mjs` row: "What it does"
     gains "accepts a leading `cd <dir> &&` and `set -o pipefail;`".
   - README "Run a long check" paragraph: **replace it whole** with the text
     below. It is the one home for why each part of the invocation matters;
     every other place quotes the invocation and points here.

     > **Run a long check so the gate can see it pass, and so you can read
     > the result.** `check-observer.mjs` reads the Bash tool's own captured
     > stdout, and only trusts stdout it can attribute to the check: the
     > command must start with the check invocation (a leading `cd <dir> &&`
     > and a leading `set -o pipefail;` are fine - neither writes to stdout),
     > must not chain anything after it (`&&`, `;`, `||`), and must not
     > redirect stdout to a file. A pipe is fine and is the way to keep a
     > huge log out of the transcript, but `All files` sits near the *top*
     > of the coverage table, so size the tail generously. The one
     > invocation, in one foreground call with the Bash tool's `timeout` set
     > to 600000:
     >
     > ```text
     > set -o pipefail; npm run check 2>&1 | tail -n 120
     > ```
     >
     > Each part is load-bearing (all measured 2026-09-10 on this host):
     >
     > - **The prefix is how you learn whether it passed.** A pipeline's
     >   status is its last command's, so without the prefix a failed check
     >   exits 0 through `tail`, the tool prints no exit line, and the
     >   result reads as a pass. With it the tool prints `Exit code 1` as
     >   the first line of a failed run, and the hook sees `exit_code: 1`
     >   and refuses to arm. Twelve check runs across five sessions were
     >   spent re-running the check to learn its status a second way. Do
     >   not ask a later call for `$?`: each call is a fresh shell, and
     >   `$?` there is always 0.
     > - **The timeout is how the call survives.** The tool never kills a
     >   command; when it outlives its `timeout` it is moved to the
     >   background (`Command did not complete within its 120s timeout and
     >   was moved to the background`), and for a subagent that is a lost
     >   run. The default is 120 s and the check is ~165 s (stage by stage:
     >   format 11s, lint 30s, typecheck 12s, data 4s, derived 1s, i18n 0s,
     >   selftest 19s, vitest with coverage 88s), so a check call without a
     >   timeout cannot finish in the foreground. 600000 is the tool's
     >   maximum; a check that outlives even that is the fork-pool stall
     >   below, not a timeout problem.
     > - **The tail keeps the result under the tool's cap.** A result over
     >   about 30,000 characters is not shown; the tool saves it to
     >   `tool-results/<id>.txt` and names the path. `npm run check` piped
     >   to `tail -n 120` stays under. Parity does not: its diff lines carry
     >   a page's whole text, so `tail -n` cannot bound the bytes - grep the
     >   file the tool names instead of running it again.
     >
     > `npm run check > out.txt 2>&1` then reading the file does **not**
     > satisfy the gate, however genuinely the run passed - the hook never
     > saw the output - and after the prefix there is no status a file gets
     > you that the pipe does not. Nor does a run started with
     > `run_in_background`: `check-observer.mjs` returns early on it by
     > design, because there is no stdout to attribute yet. Backgrounding
     > cost three worker runs on issue 47 and is now blocked at
     > `PreToolUse` (candidate 27).
   - README, new paragraph after "Run a long check", titled in the same bold
     style: **One heavy run at a time.** `tests/parity.js` writes
     `test-output/parity.lock` (`pid`, `startedAt`, heartbeat `at`, `argv`)
     while it runs, touches it once per state, removes it on exit, and
     refuses to start over a live one. `bash-guard.mjs` reads the same lock
     through `tests/parity/lock.js` and blocks the heavy runs listed in the
     table beside it. A lock is live only while its pid answers
     `kill(pid, 0)` and the heartbeat is under fifteen minutes old, so a
     killed run's lock is ignored on its own; if a block names a run that is
     not actually alive, delete `test-output/parity.lock`.
   - README "Known limitations" list, three new bullets: the vitest-alive
     side is invisible (`npm run check` writes no lock); a container parity
     run (`tools/parity-ubuntu/`) writes its own `test-output/` and is
     invisible; on Windows a crashed run's pid can be reused inside the TTL
     and reads as alive until the heartbeat expires - the message says to
     delete the lock.
   - README "Facts settled" list: add, dated, these measurements -
     `PreToolUse(Bash)` fires on a backgrounded call (2026-09-10);
     `tool_input.run_in_background` and `tool_input.timeout` are present
     there (probe A0's date, with the payload's key list); a live lock
     denies and a dead-pid lock does not, on this host (probe B's date); on
     the Bash tool, `false | tail -n 2` comes back as `(Bash completed with
     no output)` and `set -o pipefail; false | tail -n 2` as `Exit code 1`
     (2026-09-10); a command that outlives its `timeout` is moved to the
     background, not killed - 27 recorded results (2026-09-10); a result
     over about 30,000 characters is persisted to `tool-results/<id>.txt`,
     largest shown 29,787, smallest persisted 29.8 KB (2026-09-10).
   - README candidate table: replace row 27 with the adopt row from section
     3 (fill in probe A's date); append rows 28-34 verbatim from section 3,
     row 30 with Q1's answer folded into its verdict cell.
   - `.claude/prompts/implement.prompt.md`, step 7: replace "Pipe a long run
     to `tail` (`npm run check 2>&1 | tail -n 120`) and stay in the turn
     until it finishes" with "Run it as `set -o pipefail; npm run check 2>&1
     | tail -n 120` with the Bash timeout set to 600000 and stay in the turn
     until it finishes". The rest of the step is unchanged.
   - `.claude/prompts/orchestrate.prompt.md`, the paragraph beginning
     "**And that did not work.**": replace its last sentence ("Prose has
     now failed at this three times; the next lever is deterministic ...
     not an orchestrator one.") with: "Prose failed at this three times;
     `bash-guard.mjs` now blocks a backgrounded `npm run check` (candidate
     27) and any heavy run beside a live parity run (candidate 28). The
     foreground check is `set -o pipefail; npm run check 2>&1 | tail -n 120`
     with `timeout: 600000`; `.claude/README.md` says why each part
     matters." Keep the history above it; add no paragraph.
   - `docs/parity.md`, "Before a run", after the "Every parity invocation
     clears `test-output/parity/`" paragraph, add: "One parity run per tree.
     `tests/parity.js` writes `test-output/parity.lock` while it runs and
     removes it on exit. A second parity run refuses to start over a live
     lock, and `bash-guard.mjs` blocks `npm run check`, `npm test`/vitest,
     `npm run build`, `check:built` and `run-all` beside one. A lock is live
     only while its pid answers and its heartbeat is under fifteen minutes
     old, so a killed run's lock is ignored by itself; if the block names a
     run that is not alive, delete `test-output/parity.lock`. CI shards run
     on separate runners and never share a lock; parallel local shards
     share one tree and now refuse each other, which they always should
     have."
   - `CLAUDE.md`, Quality gates, directly after the `npm run check` code
     block (which stays `npm run check` - it is what a human types):

     ```text
     Agents: one foreground call, `set -o pipefail; npm run check 2>&1 | tail -n 120`, Bash timeout 600000 - see `.claude/README.md`, "Run a long check".
     ```

     One physical line (the file already has 21 lines over 80 characters,
     the longest 143); `wc -l CLAUDE.md` prints 195. Markdown is in
     `.prettierignore`, so the length is not a format:check problem.

7. **Probe A0 - the payload's shape.** Before probe A, and before
   anything is deleted on a negative: a scratch edit that echoes the
   `tool_input` the hook actually receives. In `evaluateLongCheck`, append
   ` [probe: ${JSON.stringify(Object.keys(toolInput))} timeout=${JSON.stringify(toolInput.timeout)} bg=${JSON.stringify(toolInput.run_in_background)}]`
   to the reminder message (pass `input.tool_input` in as a third
   argument for the probe only). Then, with a **fresh session id** and no
   `run_in_background`, run foreground
   `cd /nonexistent-hooks-probe-dir && npm run check` twice: once with
   `timeout: 600000`, once with no timeout. Both exit 1 on the `cd` and
   run nothing; the reminder fires on the first (once per session per
   family - use two fresh session ids, or read the marker) and shows the
   keys. Record, in the README facts list and the handoff: the key list, and
   whether `timeout` arrives as a number when set and as absent when not.
   **Revert the scratch edit** before continuing; `git diff
   .claude/hooks/bash-guard.mjs` must show no `probe:` text. If the old
   reminder text appears instead (no `probe:`), the hook is snapshotted in
   this session: stop and report, as probe A's fork says.

8. **Probe A - the field.** With the selftest green, run from the
   implementer session with `run_in_background: true`:

   ```text
   cd /nonexistent-hooks-probe-dir && npm run check
   ```

   - **Denied with `MSG.backgroundCheck`:** `tool_input.run_in_background`
     reaches `PreToolUse` on this host. Record "Measured <date>" in the README
     facts list, row 27, and the handoff. The rule stays.
   - **Not denied (`Command running in background ...`):** the `cd` fails and
     nothing runs. Before concluding the field is absent, rule out a
     snapshotted hook: run foreground `git stash drop` (denied by 2b
     regardless of edits) to show hooks run at all, then foreground
     `npm run check 2>&1 | tail -n 5` in a **fresh session id** expecting the
     *new* reminder text with `600000` (this is a real 165 s run; it is also
     the gate run if nothing changes afterwards). If the new reminder text
     appears, the edited script is live and the field is genuinely absent:
     remove rule 2g, `MSG.backgroundCheck` and cases `#64-#75`; keep steps 1,
     4f, the `#29` extension, rule 2h and the docs; record row 27 as
     **reject - measured absent** with the date; report. If the old reminder
     text appears, the hook is snapshotted in this session: stop, report, and
     ask for the probe to be repeated from a fresh session before anything is
     removed. Do not delete a rule on an ambiguous negative.

9. **Probe B - the lock, live and stale.** Selftest green, no parity run
   alive, `test-output/parity.lock` absent. Three commands, in order:

   1. Hold a lock from a real process, `run_in_background: true` (not a
      check, so 2g does not apply):

      ```text
      node -e "const l=require('./tests/parity/lock.js'); l.acquire(process.cwd(), ['probe']); setTimeout(()=>{}, 180000)"
      ```

      Read the pid from `test-output/parity.lock`.
   2. Foreground `node tests/parity.js --nonexistent-probe-filter`.
      **Expected: denied** with `MSG.parityLock` naming that pid and
      `probe`. Then foreground `npm run lint` - **expected: allowed** (not
      a heavy run). Record both.
   3. Kill the holder: `taskkill //PID <pid> //F` (Git Bash; `taskkill /PID
      <pid> /F` from PowerShell). Confirm `test-output/parity.lock` still
      exists with the dead pid - that is the crashed-run state. Foreground
      `node tests/parity.js --nonexistent-probe-filter` again. **Expected:
      not denied by the hook** (the reminder may speak). The runner then
      either stops at the `dist/` check (no build) or acquires, matches no
      state, and exits 0; either way, afterwards `test-output/parity.lock`
      is absent (released) or carries the dead pid - delete it by hand if it
      remains. Record the result.

   Forks:

   - Step 2 **not denied** with the holder alive: run
     `node -e "const l=require('./tests/parity/lock.js'); console.log(l.isLive(l.readLock(process.cwd())))"`.
     If it prints `true`, the module sees the live lock and the hook does
     not: check the import path in step 4a, then the snapshotted-hook test
     from probe A. If it prints `false`, `kill(pid, 0)` misbehaves on this
     host for a live pid - but selftest `#76` uses `process.pid` and passed,
     so this is a contradiction: stop and report with both outputs. Do not
     delete rule 2h on an ambiguous negative; an inert lock rule is
     harmless, and the record needs the measurement.
   - Step 3 **denied** with the holder dead: the false positive that will
     actually happen. Check whether the pid was reused
     (`tasklist //FI "PID eq <pid>"` from Git Bash) - if it was, that is
     the recorded Windows gap, and the message's delete instruction is the
     answer; note it and continue. If the pid is not in use and the hook
     still denies, `pidAlive` is wrong on this host: stop and report.

10. **Gate and commit.** `set -o pipefail; npm run check 2>&1 | tail -n 120`
   in the foreground, Bash timeout 600000 - the new canonical form, which
   the edited observer must accept: afterwards `cat .claude/.check-cache.json`
   shows a fresh `at` (this one read is the batch verifying its own rule,
   as issue 65 did). Confirm the selftest line in the output shows the new
   count and `0 failed`. Then stage by name and commit in one:

   ```text
   git add .claude/hooks/lib.mjs .claude/hooks/check-observer.mjs .claude/hooks/bash-guard.mjs .claude/hooks/selftest.mjs .claude/README.md .claude/prompts/orchestrate.prompt.md .claude/prompts/implement.prompt.md CLAUDE.md tests/parity.js tests/parity/lock.js docs/parity.md issues/hooks-guardrails/plan.md issues/hooks-guardrails/handoff.md issues/hooks-guardrails/context.md
   git commit -m "feat(hooks): the check call shows its status, cannot be lost, runs alone"
   ```

   Author per CLAUDE.md; no attribution trailer; never push. If probe A's
   measured-absent branch was taken, the subject becomes
   `feat(hooks): block a heavy run beside a live parity run` and the body
   says rule 2g was measured absent.

### Row 31, when it is needed (not in this batch)

Copied, not adapted, on the first recorded check lost to the default timeout
after this batch ships. Requires probe A0 to have shown `timeout` arriving
as a number when set and absent when not; if a host does not pass it, this
rule denies every foreground check, which is the one thing it must not do.

- `MSG.checkNoTimeout`, one line:

  ```text
  Blocked: `npm run check` takes ~165 s here and the Bash tool's default timeout is 120 s, after which the tool moves the call to the background and the commit gate never sees it. Repeat it in this turn with `timeout: 600000`: `set -o pipefail; npm run check 2>&1 | tail -n 120`.
  ```

- In `evaluateBackgroundCheck`: `const backgrounded = toolInput.run_in_background === true;`
  `const noTimeout = toolInput.timeout === undefined || toolInput.timeout === null;`
  return early unless one holds; on a check segment return the background
  message when `backgrounded`, else the no-timeout one. A non-number,
  non-null `timeout` (a string) counts as present: unknown host shape,
  inert rule.
- `bashPayload` gains `timeout: extra.timeout === null ? undefined : (extra.timeout ?? 600000)`
  spread only when defined, so every existing foreground check case carries
  a timeout and the absent-key cases build it with `timeout: null`.
- Cases: plain absent - denied, reason includes `timeout: 600000`;
  recorded shape `npm run check 2>&1 | tail -100` absent - denied; explicit
  600000 and explicit 120000 - not denied; `check:built`, parity, vitest
  absent - not denied; `echo npm run check` absent - not denied; string
  `'600000'` - not denied; absent and backgrounded - the background
  message wins; fresh session - deny JSON with no `systemMessage`.
- Probe: foreground `cd /nonexistent-hooks-probe-dir && npm run check`
  with no timeout - denied; with `timeout: 600000` - not denied. Both
  denied means the field is not passed: do not ship.
- README: candidate row 31 becomes adopt with the date and the occurrence
  that earned it; known limitation: "assumes `tool_input.timeout` reaches
  the hook; a host that stops passing it denies every foreground check -
  delete the trigger".

### Acceptance criteria

- Preconditions 1-4 were met and are recorded.
- `node .claude/hooks/selftest.mjs` passes with every case in
  `SELFTEST_CASES` present; the count is recorded.
- `bash-guard.mjs` denies the three recorded backgrounded shapes and the
  plain form when `run_in_background === true`, and denies none of:
  foreground, absent flag, string flag, `check:built`/`check:fast`/parity/
  run-all/vitest backgrounded, readers, quoted mentions.
- `bash-guard.mjs` denies every family in `#77` under a live lock and
  denies none of `#78`'s commands for the lock's reason; it does not fire
  on a dead-pid, stale-heartbeat, malformed, pid-less or absent lock.
- `tests/parity.js` refuses to start over a live lock, writes a lock before
  wiping `test-output/parity/`, heartbeats per state and releases on
  `process.exit` (proven at module level by `#86-#91`; end-to-end by probe
  B step 3's "released or dead").
- Both deny messages are one line; the background one contains
  `npm run check 2>&1 | tail -n 120` and `600000`; the lock one contains
  the pid, the start time, the filter and `parity.lock`.
- The long-check reminder contains `600000`,
  `set -o pipefail; npm run check 2>&1 | tail -n 120` and "persisted".
- `check-observer.mjs` arms on `#92-#95` and refuses `#96-#101`; the plain
  pipe (`#49e`) still arms. The strip is the one regex in step 1, nothing
  wider.
- Every quoted invocation in the tree is the one string: `grep -rn "npm run
  check 2>&1" .claude CLAUDE.md docs` shows only lines carrying
  `set -o pipefail;` before it, plus selftest cases that deliberately test
  the plain or forged forms.
- `check-observer.mjs` and `bash-guard.mjs` share one regex from `lib.mjs`;
  `bash-guard.mjs` and `tests/parity.js` share one liveness definition from
  `tests/parity/lock.js`.
- README hook table, long-check paragraph, "One heavy run" paragraph,
  known-limitations bullets, facts list and candidate rows 27-29 are
  updated; orchestrate prompt sentence replaced; `docs/parity.md` "Before a
  run" updated; `CLAUDE.md` has the one line and `wc -l` prints 195.
- Probe A0's key list, probe A and probe B results recorded as measured,
  with their forks followed; `git diff .claude/hooks/bash-guard.mjs` shows
  no `probe:` text.
- `npm run check` passes for the whole tree; **one commit**, staged by name.

### Verification commands

```text
node .claude/hooks/selftest.mjs
npx prettier --check .claude/hooks
set -o pipefail; npm run check 2>&1 | tail -n 120
wc -l CLAUDE.md
grep -rn "npm run check 2>&1" .claude CLAUDE.md docs
git status --porcelain
```

Plus probe A0 (two foreground calls that fail on `cd`, a scratch edit
reverted), probe A (backgrounded, harmless by construction) and probe B
(three commands, writes only the gitignored `test-output/parity.lock`).

### Risks and do-nots

- Do not extend rule 2g to other command families; do not match
  `run_in_background` loosely - strict `=== true`.
- Do not add process enumeration to rule 2h; do not make the hook's import
  of `lock.js` static (a missing file must fail open).
- Do not touch `.claude/settings.json`, `tests/run-all.js`,
  `tests/parity/specs.js`, `tests/parity/driver.js`, or `app/`.
- Do not consume the `once` marker inside a deny.
- Do not start while `git status` shows another writer's paths; do not
  stage by glob (`git add -A` is blocked with 2+ dirty paths anyway).
- Do not delete rule 2g or 2h on an ambiguous probe negative; follow the
  written forks.
- The hook is re-read per invocation on this host but may be snapshotted
  elsewhere; the selftest is the proof, the probes are the measurement.
- Known sanitiser limits apply unchanged: a check hidden in `bash -lc '...'`
  is erased with the quoted span and is not caught. Record, do not fix.
- `tests/run-all.js` wipes all of `test-output/` at start, lock included.
  It only starts when no lock is live (or from a human terminal), so the
  wipe cannot hit a live agent-started run through the hook path; a human
  terminal `run-all` beside an agent's parity run remains the human's call.
  Record, do not fix.
- The edit to `tests/parity.js` makes the next parity run cold (section 4,
  cost 4). Tell the issue 47 handoff reader in this task's handoff.
- Do not widen the prefix strip past the one regex, and do not make the
  prefix required. Do not ship row 31 in this batch.
- The invocation string appears in eight places after this batch (two hook
  messages, README, both prompts, `CLAUDE.md`, two selftest labels). Change
  it in all of them or none; the grep in the acceptance list is the check.

### Fallback

Probe A's measured-absent branch (step 8): rule 2h, the shared regex, the
reminder hint and the docs ship; rule 2g and its cases are removed before the
commit and row 27 records the measurement. There is no second deterministic
instrument for failure 1 without the field. There is no fallback for rule
2h: probe B's negatives all end in "stop and report".

If the owner answers Q1 with no, or a review objects to the strip: delete the
one `set -o pipefail` line from step 1's loop, cases `#92-#101` and the
`#29`/`#49e` extensions, and put the plain form
`npm run check 2>&1 | tail -n 120` back in every quoted place; the README
paragraph keeps its three facts but says the exit line is unavailable through
the pipe and names `PIPESTATUS[0]` as the manual read. Rules 2g and 2h are
untouched by that revert.

## 6. Non-goals

- No hook for failure 3 (row 29). No `PreToolUse(Task|Agent)` matcher.
- No change to the commit gate, the attribution rule, or the reminder's
  once-per-session behaviour.
- No process enumeration anywhere (#15's reason stands).
- No lock written by `npm run check`, vitest or `run-all.js`; the
  vitest-alive side stays invisible until a parity-beside-check collision is
  recorded, at which point the next instrument is a lock-holding wrapper for
  `npm run check` that keeps the command string `npm run check` so the
  gate's stdout attribution still holds.
- No change to `.claude/settings.json`, `app/`, or the parity specs/driver.
- No deny on a file-redirected check; no observer that speaks; no hook on
  `echo $?`; no hook for the output cap; no change to parity's diff line
  format (rows 32-34, section 3).
- Row 31 (the no-timeout deny) is sketched, not shipped.

## 7. Batches and status

| Batch | Scope | Status |
|---|---|---|
| B1 | Rule 2g (backgrounded check) + rule 2h (live parity lock) + `tests/parity/lock.js` + runner wiring + the observer's `set -o pipefail` prefix + the one canonical invocation in every quoted place + reminder timeout and persisted-file hints + shared regex + selftest `#64-#101` + README/prompts/parity.md/CLAUDE.md text + probes A0, A and B; one commit | **planned - implement-ready, blocked on issue 47 B5.1 landing and on Q1 (section 10)** |

There is no B2. The former B2 is inside B1 by owner decision (section 4).

## 8. Risks, assumptions, dependencies

- Assumption A1: `tool_input.run_in_background` is present at `PreToolUse`
  (section 2b). Probe A measures it; the fork is written.
- Assumption A2: `process.kill(pid, 0)` on this Windows host returns for a
  live pid and throws ESRCH for a dead one. Selftest `#76`/`#79` prove it
  in-process; probe B proves it across processes.
- Dependency D1: issue 47 B5.1 committed before any edit - for the commit
  gate and for `tests/parity.js`.
- Risk R1: an implementer starting on a tree with B5.1's uncommitted paths
  would fail the gate or sweep foreign work. Preconditions and the
  blanket-staging rule stand in the way; the handoff says stop.
- Risk R2: a second session running `npm run check` beside this batch's gate
  run. The one-writer rule is the only protection until rule 2h ships -
  and rule 2h does not see a check beside a check.
- Risk R3: Windows pid reuse inside the 15-minute heartbeat window after a
  crash reads as a live lock. Bounded by the TTL, answered by the message.
- Risk R4: the bundle's review couples three instruments (section 4, cost 2
  and "The third instrument folds in too"); the strip's revert is written.
- Assumption A3: the Bash tool's shell honours `set -o pipefail` on every
  host this repo is worked on. Measured here (Git Bash 4.4); bash 3.2+
  everywhere else. A host whose tool shell is not bash would print a
  `set: Illegal option` on stderr and run the check anyway - the observer
  would still see the check's stdout and the markers, so the gate does not
  break, only the exit line does.
- Risk R5: a deny message that names an invocation the gate refuses is the
  bug the observer's comment records from issue 65. The strip and the
  messages land in one commit, and `#92` plus the gate run in step 10 are
  the proof.

## 9. Deferred

- Candidate 29's sketched HEAD-moved notice, on the first recorded failure
  of the orchestrate prompt's "Your writers are not the only writers".
- A lock-holding wrapper for `npm run check`, on the first recorded
  parity-beside-check collision (section 6).
- `node tests/run-all.js` (~15 min) exceeds the Bash tool's 600000 maximum,
  so "stay in this turn" cannot be obeyed for it. Not this task's failure;
  noted for whoever next touches the reminder table.
- The `bash -lc '...'` sanitiser gap, unchanged.
- The cold parity run after this commit lands on the next issue 47 batch
  that runs parity (section 4, cost 4).
- Row 31, the no-timeout deny, on the first check lost to the default
  timeout after this batch's prose has had its chance.
- A check that outlives the tool's 600 s maximum (section 2d, R6): six
  recorded, the last one today. That is the README's fork-pool stall; no
  timeout hint can address it and nobody should try by raising the number.
- Parity's one-line-per-page diff text is what pushes its results over the
  tool's cap (R4). Shortening it is a `tests/parity.js` change with
  diagnostic cost; not this task's.

## 10. Decisions taken, and the question open

**Q1 - relax the gate's attribution rule to accept `set -o pipefail`?**
(`NEEDS_HUMAN_CONFIRMATION: yes` rests on this alone.) The owner named a
relaxation of the attribution rule as their call. Options:

- **A (recommended): accept the exact prefix**, as row 30 and step 1
  specify - the tokens `set -o pipefail` plus one `;` or `&&`, at the
  start, either side of the `cd` strip, nothing else - and make
  `set -o pipefail; npm run check 2>&1 | tail -n 120` the one invocation
  everywhere it is quoted. What it buys: a failed check comes back with
  `Exit code 1` as its first line, the observer refuses to arm on
  `exit_code: 1` regardless of markers or tail size, and the twelve
  recorded re-runs have no reason to happen. What it risks: nothing the
  selftest does not pin - the six forgery shapes in `#96-#101` are refused
  because the strip leaves every other separator in place, and a forger who
  omits the prefix is where the gate stands today.
- **B: refuse it, keep the plain pipe.** The worker then reads the status
  from the output (the coverage table, `npm error` lines) or types
  `npm run check 2>&1 | tail -n 120; exit ${PIPESTATUS[0]}` - which the
  attribution rule also refuses (a `;`), so the honest B is "read the
  markers", and the line a worker meets would say: "the exit code you see
  is `tail`'s; a failed check shows `npm error` in the last lines".
  Twelve re-runs say that line is not read.
- **C: accept the prefix and also require it** (refuse the plain pipe). Cleaner
  gate, but a human at a terminal types `npm run check` and the
  markers-plus-`All files` path is what serves them. Rejected in section 3.

Recommendation: A.

Decisions taken in this pass, recorded so the owner can strike any of them;
none needs confirmation:

- **Row 31 is rejected for now, sketched verbatim.** One occurrence; the
  prose for the timeout did not exist and B1 writes it in five places, one
  of them a deny message delivered at the exact retry; and the deny's own
  failure mode (an absent field denies every check) needs probe A0's
  measurement first. The sketch is in section 5.
- **The `CLAUDE.md` code block stays `npm run check`**; the approved one
  line carries the agent invocation and points at the README. A human types
  the block; an agent copies the line.
- **The README paragraph is the one home.** Every other place quotes the
  invocation string and nothing else; the acceptance grep enforces it.
- **Probe A0 is a scratch edit, reverted.** It measures both fields' shape
  in one shot and settles row 31's precondition for later; it is not a hook
  change.
- **Commit subject:** `feat(hooks): the check call shows its status, cannot
  be lost, runs alone`.

- **`npm run build` and `vite build` are in rule 2h's heavy list** beyond
  the outline's families. `dist/` is parity's candidate side; rebuilding it
  mid-run changes what later states measure, and a build while parity runs
  is never legitimate work. `npm run dev` is not listed - it does not touch
  `dist/`.
- **Heartbeat plus a 15-minute TTL** instead of the outline's fixed 45
  minutes. A fixed TTL had to be long enough for a cold full run and was
  therefore long enough for a reused pid to be a nuisance; one `touch` per
  state resolves both.
- **The liveness predicate lives in `tests/parity/lock.js`** and the hook
  imports it inside a try. The duplicate-predicate alternative is rejected
  in section 3.
- **Selftest labels start at `#64`**, not `#59`; the file already uses
  `#59-#63`.
- **The lock records `process.argv.slice(2)` whole** (filters and flags),
  so the deny message can name what is running.
