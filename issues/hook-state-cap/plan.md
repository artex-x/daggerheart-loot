# Plan - TASK hook-state-cap

Design for the silent session-state loss in `.claude/hooks/lib.mjs`. Every
measurement is in `context.md`; this file does not repeat it, it decides on it.

## 1. Objective and current state

`saveState()` (`lib.mjs:312-326`) keeps the 5 most recently active sessions by
`at` (seconds) and, on a tie, keeps the earliest-inserted, so the session
that just wrote can be the one discarded. Consumers (`session-stop.mjs:79`
via `getWrote()`, `once()` in `session-stop.mjs:175`, `edit-followup.mjs:53`,
`bash-guard.mjs:521`) are all advisory and fail open, so a dropped entry costs
a missing Stop sentence or a duplicate reminder, silently.

Two distinct failures share the mechanism:

1. **The writer is evicted by its own write** when the tail of the ranking is
   tied at second granularity (the CI failure; deterministic probe in
   `context.md`). This is a correctness bug regardless of cap size.
2. **A live session is evicted by other sessions' activity** when more than
   five sessions write between its last hook activity and its Stop. On this
   host the cap of 5 is below the observed peak of 15 concurrent sessions.
   Note on the live file: holding exactly 5 entries proves saturation, not
   loss - the oldest of the five is 71 hours old, so over that window only
   five sessions wrote at all. Loss happens on burst days (the 15-peer day),
   not on quiet ones. Both are real; the second is the one the cap's *shape*
   has to answer.

Objective: no session ever loses its own record through its own write; a
session loses its record to other sessions only after more of them have been
active than this host has ever run at once, and that condition is written
down where the next debugger will read it.

## 2. Existing behaviour and code paths

- `lib.mjs`: `statePath()`, `nowSeconds()`, `loadState()` (any failure ->
  `{ sessions: {} }`), `saveState(state)` (prune to 5, fail open),
  `sessionEntry()`, `once(sessionId, key)`, `recordWrite(sessionId, rel)`,
  `getWrote(sessionId)`. `stateDir()` honours `LOOT_HOOK_STATE_DIR`, read at
  call time, so the selftest can swap directories per block.
- Readers of `at` and of the unit it carries: the comparator in
  `saveState()`; `recordWrite()` copies `entry.at` into `wrote[path]`;
  `session-stop.mjs:130` multiplies `wrote[p] * 1000` to compare against
  `handoff.md`'s `mtimeMs`. The `at` in `.check-cache.json` and in
  `test-output/parity.lock` (selftest `#86`, `#89`) are different files and
  unaffected.
- State file shape `{ sessions: { <id>: { at, seen[], wrote{} } } }` is read
  directly by selftest `#44` (`selftest.mjs:1058-1063`) and by
  `budgetDiagnostics()` through `getWrote()`. The shape does not change.
- `selftest.mjs`: 357 assertions, named cases `#1-#130`, `main()` at
  `:1804` runs blocks in order; `testTaskBudget()` (`:1533`) already isolates
  its own state directory and must keep doing so (`config-audit` conclusion,
  not reopened). Its comment block at `:1559-1579` describes the prune as
  unfixed production behaviour and points at `config-audit`'s handoff; it goes
  stale with this fix and is updated in the same batch.

## 3. Design

### 3.1 The change, in one paragraph

`saveState(state, keepId)` reserves a slot for the session being written
before ranking the rest, and the cap rises from 5 to 64. `once()` and
`recordWrite()` pass their `sessionId` as `keepId`. `at` stays in seconds;
the comparator and tie-break are left as they are; nothing warns. The
selftest gains four cases (`#131-#134`) that pin the writer's survival at
saturation through `recordWrite()`, through `once()`, and end to end through
`session-stop.mjs`, plus one that pins recency-ranked eviction and the exact
cap. `.claude/README.md` records the cap and the loss condition.

### 3.2 Reference shape for `saveState()` (implementer follows this)

```js
// The MAX_SESSIONS most recently active sessions survive a save, and the
// session being written always does: it is reserved first and the rest
// are ranked after it. Without the reservation, a tail of sessions tied at
// second granularity evicted the writer itself (config-audit B3, 2026-09-16).
// 64: this host has run 15 concurrent sessions on one tree
// (orchestrate.prompt.md, 2026-09-10); an entry is lost only when 63 other
// sessions write between this session's last hook call and its Stop.
export const MAX_SESSIONS = 64;

function saveState(state, keepId) {
  try {
    const sessions = state.sessions || {};
    const kept = keepId && sessions[keepId] ? [keepId] : [];
    const others = Object.keys(sessions)
      .filter((id) => id !== keepId)
      .sort((a, b) => (sessions[b].at || 0) - (sessions[a].at || 0));
    for (const id of others) {
      if (kept.length >= MAX_SESSIONS) break;
      kept.push(id);
    }
    const pruned = {};
    for (const id of kept) pruned[id] = sessions[id];
    const dir = stateDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(statePath(), JSON.stringify({ sessions: pruned }));
  } catch {
    // fail open: a lost write costs one duplicate reminder or one missing
    // Stop sentence, never a block. guard() swallows a throw anyway, and
    // speaking on a failed save would fire on every edit of every session
    // whenever the file is unwritable - the noisy guard nobody reads.
  }
}
```

Both call sites in `once()` (`:347`, `:351`) and the one in `recordWrite()`
(`:362`) become `saveState(state, sessionId)`. The result holds at most
`MAX_SESSIONS` entries; the writer counts as one of them.

### 3.3 What bounds the file

The cap bounds the entry count; each entry is bounded by what a session can
do: `wrote` holds one key per distinct repo-relative path written (the live
file's largest holds 23, about 1.5 KB), `seen` one key per reminder group plus
one per distinct Stop state. Worst case observed x 64 is roughly 100-130 KB,
parsed and rewritten synchronously on each `Edit`/`Write` PostToolUse and on
each matching `once()`; that is about a millisecond. No TTL is needed to bound
growth (4.2). No migration: existing entries keep their shape and unit, and
the file simply fills from 5 toward 64 over time.

## 4. Decisions, with rejected alternatives

### 4.1 Always retain the entry being written - adopted

This is the surgical fix for failure 1 and the only retention the code can
*guarantee*: the writer is the one session whose liveness is known at save
time. It makes the tie-break question moot for the writer (4.3) and removes
the selftest's dependence on session count even without isolation.

Rejected: fixing the comparator alone (reverse insertion order on ties). After
a reload, key order is whatever the previous save wrote (ranked by `at`),
not creation order, so "newest-inserted wins" is not the same as "newest
session wins" and the tie-break carries no reliable information either way.
Only the reservation is correct by construction.

### 4.2 Cap rises to 64; no TTL - adopted

The ranking is by last activity, so under a recency cap the entries evicted
first are always the least recently active: dead sessions leave before live
ones without any age rule. A TTL adds nothing to correctness here - it cannot
protect a live session from a burst (the cap does that) and it only removes
entries the ranking already puts at the tail. What it would add is a second
mechanism to test and a new silent-loss path: a session resumed after the TTL
(`claude --resume` days later) would Stop with its writes forgotten, which is
the very failure class this task closes.

Why 64 and not 16 or 32: the loss condition is "N-1 other sessions write
between my last hook call and my Stop", and the risky session is an
interactive one that idles through an orchestrator burst. 15 concurrent peers
have been recorded; 64 lets a session idle through four such bursts. The
cost is unmeasurable (3.3). If the human prefers another number it is a
one-constant change; nothing else in the design depends on it.

Rejected: TTL only (no cap) - unbounded under a session-id spray; and the
resume problem above. Rejected: TTL plus cap - both mechanisms, same resume
problem, no gain over cap alone under recency ranking.

### 4.3 `at` stays at second granularity; tie-break untouched - adopted

With the writer reserved, a tie matters only when the *entire tail* of the
ranking is tied, which needs 64 sessions all active in the same second - a
selftest-shaped burst, never this workload. In real use, the entries at the
eviction end are hours or days older than any tied group at the top.

Changing the unit costs more than it buys: `wrote[path]` inherits `entry.at`
and `session-stop.mjs:130` scales it by 1000 against `mtimeMs`; the live file
already holds second values; a mixed-unit file would rank old entries as
ancient (harmless) but break the staleness comparison for new ones (not
harmless) until a migration ran. Rejected.

### 4.4 No `warn` when an entry is dropped - adopted

A drop under the cap is by design (dead sessions leaving), so warning on it is
noise; a drop of a *live* entry is indistinguishable at save time, and by the
time that session Stops its entry is gone, so the Stop hook cannot tell "I
never wrote" from "I was evicted" - `sessionEntry()` is created lazily by
`once()`/`recordWrite()`, and read-only sessions legitimately have no entry.
There is no reliable signal to warn on, and a Stop hook that warns on an
unreliable one gets ignored. Silence is answered instead by (a) a cap far
above observed concurrency, (b) selftest cases that fail loudly if the
reservation or the cap regresses, and (c) the loss condition written into
`.claude/README.md` next to the `activeTask()` tie note, so the next CI-only
mystery starts from the record rather than from three wrong root causes.

Rejected: a `dropped` counter in the file - nothing reads it; a record of an
intention, not a mechanism (plan.prompt.md's own rule).

### 4.5 `testTaskBudget()` isolation stays

Not reopened. The block keeps its own state directory: it makes `#126-#130`
independent of suite ordering and of whatever the rest of the file does to
the shared state, and `budgetDiagnostics()` reads against the same
directory. Only its comment changes, from "unfixed production behaviour, see
config-audit's Deferred" to a short pointer at this task and the cases that
pin the fix.

### 4.6 `saveState()` stays fail-open - adopted, comment corrected

The catch comment understates the cost now that `getWrote()` feeds the
uncommitted-work, untracked-candidates, staleness and budget sentences: a
lost write can also cost one missing Stop sentence. That is still the right
contract. `guard()` swallows a throw anyway, so failing closed is not on
offer; the only alternative is to *speak* on a failed save, which on an
unwritable state file would fire on every edit in every session - the noisy
guard that gets ignored. The comment is rewritten to name the true cost and
point here. Rejected: `speak` on save failure.

### 4.7 Out of scope, recorded (see Deferred, section 7)

Read-modify-write races between concurrent sessions and the torn-read wipe
(`loadState()` on a half-written file returns `{ sessions: {} }`, and the
next save then contains only the writer). Unmeasured; a different mechanism
(atomic rename, or a single re-read on parse failure); platform risk on
Windows for rename-over-open-file. Not part of the smallest fix.

## 5. Contracts and behaviour that stay stable

- State file path, shape, key names and the second unit of `at`/`wrote`.
- Every hook still exits 0 on every path; `session-stop.mjs` still never
  emits a `decision` key; `saveState()` still never throws.
- `LOOT_HOOK_STATE_DIR` / `LOOT_HOOK_ROOT` overrides; `testTaskBudget()`'s
  private state directory.
- No public product contract, spec, fixture or `dist/` output is touched;
  `npm run check:built` is not required.

## 6. Batches and status

| Batch | Scope | Gate | Status |
|---|---|---|---|
| B1 | `lib.mjs` reservation + cap 64; call sites; selftest `#131-#134`; `testTaskBudget()` comment; README row and limitation bullet | `npm run check` (one foreground call) | next |
| B2 | Closeout per `.claude/skills/handoff/SKILL.md`: handoff status `done`, retire `plan.md` after retargeting citations, context refresh | none (`.md`-only) | pending |

One implementation batch: everything shares one file pair, one gate, one
review pass. Splitting the test cases from the fix would ship a green suite
that proves nothing, and splitting the README from the code would leave the
loss condition unrecorded at exactly the commit that defines it.

## 7. B1 - implement-ready

### Objective

Make the session being written survive every save, raise the cap to 64, pin
both in the selftest, and record the cap and its loss condition.

### In scope

- `.claude/hooks/lib.mjs`: `MAX_SESSIONS` export, `saveState(state, keepId)`
  per 3.2, three call sites, corrected catch comment.
- `.claude/hooks/selftest.mjs`: new block `testStateCap()` with cases
  `#131-#134`, called from `main()` after `testTaskBudget()` and before
  `testFailOpen()`; header comment `#1-#130` -> `#1-#134`; `testTaskBudget()`
  comment at `:1559-1579` rewritten (4.5).
- `.claude/README.md`: `.hook-state.json` row in the runtime-files table
  (line 130); one bullet in "Known limitations" beside the `activeTask()` tie
  note (after line 280).

### Out of scope

- Any change to `at`'s unit, the comparator, `loadState()`, `getWrote()`,
  `sessionEntry()`, or any hook's messages.
- Atomic writes or race handling (Deferred).
- `testTaskBudget()`'s isolation (stays); `issues/config-audit/*` (closed;
  its Deferred line may keep pointing here).
- `CLAUDE.md`: no new standing rule is warranted by one fix.

### Steps

1. `lib.mjs`: add `export const MAX_SESSIONS = 64;` immediately above
   `saveState()` with the comment from 3.2; replace the body of `saveState()`
   with 3.2; change the three `saveState(state)` calls to
   `saveState(state, sessionId)`. Keep `nowSeconds()`, `loadState()`,
   `sessionEntry()`, `getWrote()` byte-identical.
2. `selftest.mjs`: add `async function testStateCap()` before
   `testFailOpen()`. Pattern: `const { recordWrite, getWrote, once,
   MAX_SESSIONS } = await import(pathToFileUrlHref('lib.mjs'))`; create
   `capState = fs.mkdtempSync(path.join(os.tmpdir(), 'loot-hooks-cap-state-'))`;
   save and set `process.env.LOOT_HOOK_STATE_DIR = capState` inside a
   `try`, restore the previous value and `fs.rmSync(capState, { recursive:
   true, force: true })` in `finally` - exactly the shape `testTaskBudget()`
   uses. Helper: `readCapState()` reads and parses
   `path.join(capState, '.hook-state.json')`.
   - `#131 writer survives its own write at saturation` (the probe from
     `context.md`, at scale): `recordWrite(\`other-${i}\`, 'app/src/lib/x.ts')`
     for `i = 1 .. MAX_SESSIONS + 8`, then `recordWrite('s-cap-writer',
     'app/src/lib/x.ts')`. Assert `Object.keys(getWrote('s-cap-writer'))`
     equals `['app/src/lib/x.ts']`; assert the file has exactly
     `MAX_SESSIONS` sessions and contains `s-cap-writer`. Do not assert which
     `other-*` survived: under a full tie that is unspecified (4.3), and a
     test that pins it would certify an accident.
   - `#132 eviction is by least-recent at, and the cap is exact`: overwrite
     the file with `MAX_SESSIONS` hand-made entries `e-1 .. e-N` where
     `e-i = { at: 1000000 + i, seen: [], wrote: {} }` (all far older than
     now; `e-1` oldest). `recordWrite('s-cap-new', 'app/src/lib/x.ts')`.
     Assert: `e-1` absent; `e-2` and `e-N` present; `s-cap-new` present;
     session count equals `MAX_SESSIONS`.
   - `#133 once() keeps the writer at a tied saturation` (the Stop hook's
     dedupe path, which is what actually lost `s-stop-budget`): overwrite the
     file with `MAX_SESSIONS` entries whose `at` is the current
     `Math.floor(Date.now() / 1000)`, so every other entry ties with the
     writer. Assert `once('s-cap-once', 'k') === true` then
     `once('s-cap-once', 'k') === false`. Under the old code the second call
     returned `true` because the entry had been pruned between the calls.
   - `#134 end to end: session-stop.mjs reads the retained entry`: with the
     file still saturated by `#133`'s tied entries,
     `recordWrite('s-cap-stop', 'app/src/lib/x.ts')`, then
     `runHook('session-stop.mjs', { session_id: 's-cap-stop', cwd:
     scratchRoot, hook_event_name: 'Stop', stop_hook_active: false }, {
     state: capState })`. Precondition assertion first (the `#128` pattern):
     `gitSh(['status', '--porcelain'])` contains `app/src/lib/x.ts` - it is
     left modified by `dirtyBaseline()` at the end of `testCommitGateAsync()`
     and nothing between there and this block commits it; if that ever
     changes the precondition names it instead of `#134` failing mutely.
     Assert `systemMessage(result).includes('app/src/lib/x.ts')` and that the
     result carries no `decision` key.
   - Every `check()` gets a `detail` argument (the parsed session-id list,
     or `systemMessage(result)`), so a failure explains itself on CI.
3. `selftest.mjs:1559-1579`: replace the comment with a short one: this
   block keeps a private state directory so `#126-#130` depend on nothing the
   rest of the suite does to the shared state; the production prune that once
   evicted `s-stop-budget` on CI (`config-audit` B3, 2026-09-16) is fixed in
   `lib.mjs` `saveState()` (writer reserved, cap `MAX_SESSIONS`) and pinned by
   `#131-#134` (`hook-state-cap`). Update the header comment at `:8-9` to
   `#1-#134`.
4. `.claude/README.md:130`: row text becomes "Per-session dedupe markers and
   the set of paths each session wrote. Holds the 64 most recently active
   sessions; the session being written is always kept." Add after the
   `activeTask()` bullet (ends line 280): "`saveState()` (`lib.mjs`) keeps
   the 64 most recently active sessions and always the one being written. A
   session loses its record - and its Stop hook goes silent - only when 63
   other sessions have written after its last hook call. Before
   `hook-state-cap` (2026-09-16) the cap was 5 and a tie at second
   granularity evicted the writer itself; the loss was silent and cost
   `config-audit` B3 four remediation cycles."
5. Focused run: `node .claude/hooks/selftest.mjs` -> `N passed, 0 failed`
   with N > 357; record N in the handoff. Run it three times (the
   `config-audit` cycle-4 practice) - the cases are deterministic and must
   not flicker.
6. Pre-flight, then the gate: `Get-CimInstance Win32_Process` filtered to
   `golden.js`/`parity.js`/`run-all.js`/`vitest` -> 0 matches;
   `git status --porcelain -uall` -> only this task's files. Then one
   foreground call, Bash timeout 600000:
   `set -o pipefail; npm run check 2>&1 | tail -n 120`.
7. Stage by name (blanket staging is denied with 2+ dirty paths):
   `git add .claude/hooks/lib.mjs .claude/hooks/selftest.mjs .claude/README.md
   issues/hook-state-cap/plan.md issues/hook-state-cap/handoff.md`. Commit
   as `artex-x <artex-x@users.noreply.github.com>`, no attribution trailer:
   `fix(hooks): keep the writing session through the state prune, cap 64`.
   Push `main`.

### Acceptance criteria

- `node .claude/hooks/selftest.mjs` passes with `#131`, `#132`, `#133`,
  `#134` present and green; the count is recorded in the handoff.
- Reverting only the `saveState()` change (keep the tests) makes `#131`,
  `#133` and `#134` fail - the implementer confirms this once, locally, by
  temporarily restoring the old prune body, and records the result. A test
  that cannot fail is not coverage.
- `#126-#130` still run against their own state directory; their assertions
  are untouched.
- `.hook-state.json` shape unchanged; `#44` untouched and green.
- `.claude/README.md` row and bullet present; the selftest header says
  `#1-#134`; the `testTaskBudget()` comment no longer describes the prune as
  unfixed.
- `npm run check` passes in one foreground call; commit pushed.

### Verification commands

```text
node .claude/hooks/selftest.mjs
set -o pipefail; npm run check 2>&1 | tail -n 120     # Bash timeout 600000
git log --oneline -1
git status --porcelain -uall
```

### Risks / do-nots

- Do not change `at`'s unit, the comparator, or `loadState()` (4.3, 4.7).
- Do not remove or weaken `testTaskBudget()`'s isolation (4.5).
- Do not add a warn, a counter, or a TTL (4.2, 4.4).
- Do not pin which tied `other-*` entries survive in `#131`.
- Do not run the gate while another session's check or parity run is alive;
  one session per working tree.
- The hook config may be snapshotted at session start on some hosts
  (README, "Hooks"): the session that edits `lib.mjs` may or may not run the
  new code itself. Verification is the selftest, not the live hook.

### Fallback

None needed. If `MAX_SESSIONS = 64` is judged too large by the human, change
the constant only; every case reads it from the export.

## 8. B2 - closeout (outline)

After B1 is pushed: `/handoff`. Handoff `Status` -> `done`; `Completed`
collapses B1 to outcome plus commit; `git grep -n "issues/hook-state-cap/plan\.md"`
and retarget every citation (B1 introduces none: the `lib.mjs` comments are
self-contained, and the README bullet names the task, not this file); keep
`context.md` and `handoff.md`. Acceptance: no tracked line cites `issues/hook-state-cap/plan.md`;
`bash-guard.mjs` allows the deletion; `docs(hook-state-cap): ...` commit
pushed.

## 9. Deferred

- **Torn read wipes the file.** `loadState()` returns `{ sessions: {} }` on
  a parse failure and the next `saveState()` then writes only the writer.
  With 15 concurrent sessions each calling hooks per tool call this is
  possible, unmeasured, and would present as the same symptom this task
  fixes. Candidate fixes: write to `.hook-state.json.<pid>.tmp` and
  `renameSync` (Windows rename-over-open-file risk needs a probe first), or
  re-read once on parse failure. Its own task if it is ever observed; the
  selftest's `#131-#134` would not catch it.
- **Read-modify-write race** between two sessions saving at once: last
  writer wins and one `recordWrite` is lost. Same fail-open cost as a failed
  save; same candidate fix as above.
- `wrote[path]` and `at` in seconds: `session-stop.mjs:130` compares a
  second-resolution write against a millisecond mtime; an edit and a
  `handoff.md` save inside the same second can read as "not stale". Cosmetic
  today; if it is ever changed, both sides move together (4.3).
