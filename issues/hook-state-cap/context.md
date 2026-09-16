# Context - TASK hook-state-cap

## What this task is

`.claude/hooks/lib.mjs`'s session-state store silently discards sessions.
Found 2026-09-16 while remediating `config-audit` B3, where it cost four
remediation cycles and three wrong root causes before diagnostic output on a
real CI failure exposed it. That task is closed; this one is the production
half it deliberately did not touch.

## Measured facts (do not re-measure)

- **The prune.** `saveState()` (`.claude/hooks/lib.mjs`, ~line 312) keeps only
  the 5 most recently active sessions: `Object.keys(sessions).sort((a,b) =>
  (sessions[b].at||0) - (sessions[a].at||0))`, then `ids.slice(0, 5)`.
  `at` comes from `nowSeconds()` - **second** granularity.
- **Tie-break runs backwards.** When `at` ties, the comparator returns 0 and
  `Array.prototype.sort`'s stability preserves `Object.keys` insertion order,
  so the *earliest-created* entries take the five slots and the just-written
  session is discarded. Measured on this Windows host 2026-09-16, standalone
  probe against `lib.mjs` with a throwaway `LOOT_HOOK_STATE_DIR`: eight
  `recordWrite()` calls for `other-1..other-8` then one for `s-stop-budget`,
  all inside one second, produced `sessions kept:
  other-1,other-2,other-3,other-4,other-5` and
  `getWrote('s-stop-budget')` empty. Deterministic, not a race.
- **The cap is binding in real use.** Live `.claude/.hook-state.json` on this
  host holds exactly 5 sessions - at the cap - with 5 distinct `at` values
  spread over hours (`1789300477` to `1789556087`) and `wrote` maps of 1 to 23
  paths. So in ordinary use ties are rare and eviction works as designed; what
  bites is the cap itself against observed concurrency. This machine runs many
  concurrent Claude sessions on one tree (3 peers visible 2026-09-16; 15 peers,
  6 interactive, recorded 2026-09-10 in `.claude/prompts/orchestrate.prompt.md`).
  Every session beyond the 5 most recently active loses its recorded writes.
- **Consumers, all advisory, all fail-open.** `session-stop.mjs:79` `getWrote()`
  feeds three sentence families (uncommitted work, handoff staleness, and the
  task-document size budget added by `config-audit` B3);
  `session-stop.mjs:175`, `edit-followup.mjs:49,53` and `bash-guard.mjs:521`
  use `recordWrite`/`once`. `saveState()`'s own catch comment states the
  intended tolerance: "a lost write costs one duplicate reminder, never more."
- **Failure mode is silence.** A pruned entry produces no error and no warning;
  the Stop hook simply does not say what the session left uncommitted. That is
  what made it survive this long, and why `npm run check` did not catch it.

## Constraints and open design questions (the planner's to settle)

- This is shared production behaviour on every hook invocation. `npm run check`
  runs `selftest.mjs` (357 assertions, `#1-#130` named cases) and covers hooks
  heavily, so new cases are expected with any change.
- Do not re-open `config-audit`'s conclusions: `testTaskBudget()` already works
  around this with its own state directory, and that workaround should keep
  working whatever is decided here.
- Genuinely open, with trade-offs: whether the cap rises, becomes a TTL, or
  both; whether `at` moves to millisecond granularity (and what else reads it);
  whether the entry being written is always retained regardless of prune;
  and what bounds the file's growth if the cap rises.

## Key paths

- `.claude/hooks/lib.mjs` - `saveState()`, `loadState()`, `sessionEntry()`,
  `once()`, `recordWrite()`, `getWrote()`, `nowSeconds()`, `statePath()`
- `.claude/hooks/session-stop.mjs`, `edit-followup.mjs`, `bash-guard.mjs`
- `.claude/hooks/selftest.mjs`, `.claude/README.md` ("Hooks", candidates table)
- Prior record: `issues/config-audit/handoff.md`, Deferred
