# Handoff - TASK tg-preview-refresh

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/tg-preview-refresh/context.md` (in full), then `plan.md` (its
"Revision history" block first - there are now four passes), then this file.

## Start here - a session that has none of this in context

**This work is not in the main checkout.** It lives in a worktree the owner
authorised on 2026-09-11:

| | |
|---|---|
| Worktree | `E:/dev/daggerheart-loot-wt/tg-preview-refresh` |
| Branch | `automation/tg-preview-refresh` |
| Base | `8b96ff4`, the main checkout's local HEAD at the time |
| Commits | `cce10cb` -> `5a959ca` -> `a4c9066` -> `0ab04eb` -> `2a4b78b` -> `5b2a68e` |

The task-directory copies **in that worktree** are authoritative. The copy
under `E:/dev/daggerheart-loot` is a snapshot taken before the worktree
existed and is stale by several batches - do not read it as current.

Establish state before acting; do not assume this file is the newest thing
that happened:

```
git log --oneline -5
git status --porcelain
```

Five facts a fresh session will not infer, in descending order of how much
damage getting them wrong does:

1. **`.env` in this worktree holds a live Telegram user session** for a
   days-old account. **No agent runs `run.mjs` without `--dry-run`, ever.**
   `@WebpageBot` has its own attempt quota, one run of 115 presses spent it
   and earned a ~54-minute lockout, and the owner needs every attempt for a
   1062-URL reindex. Do not read, print or copy `.env`; `bash-guard` denies
   it and that is correct. B4 (below) bounds this in code now
   (`--press-limit`), but the rule for agents is unconditional regardless.
2. **`tools/tg-preview/state.json` is gone from the working tree as of
   2026-09-12 (B4's session).** Earlier handoffs describe it holding 115
   URLs (87 `photo changed`, 28 unverifiable `same`); by the time B4's
   implementer checked (`git status --porcelain`, before any edit), the
   file did not exist at all - not even untracked. No agent in this session
   read, edited, committed or deleted it; this is a plain observation of
   the tree as found, consistent with the owner already having performed
   the plan's retirement step (section 3.4, "What the 115 entries are
   worth"; section 9 step E.0: move it to a backup outside the repo). If a
   future session finds it back, treat step E.0 as still not done and do
   not assume why it reappeared or disappeared.
3. **`origin/main` moved during the session that began this work** - from
   `37ecc8d` to `9fd3000`, pushed by a peer session on the same machine.
   Nothing here is affected (this branch never pushes), but **merge onto
   the current `origin/main`**, not onto the base this branch was cut from.
   Re-read `git log --oneline -3 origin/main` rather than trusting that sha.
4. **Nobody pushes.** Pushing and merging are the owner's, per `CLAUDE.md`.
   Merging should still wait for issue 47's B7 to land in the main checkout.
5. **Parity is confirmed not required** for this task, and a
   `app/src/components/searchPage.test.ts` timeout in `npm run check` is a
   known load flake on this host - this task touches nothing under `app/**`.
   Re-run it; do not diagnose it as a regression. B4's implementer hit this
   flake once and the re-run was green (947/947); see Verification.

**B4 is done** (commit below). The next batch is **O2** - the owner's own
operations, not a code batch; no agent can perform it. See "Next batch".

## Status
- Task status: **in_progress - B4 implemented and committed; O2 (the
  owner's operations) is next and is not a code batch.**
- Last agent: implementer (2026-09-12) - implemented B4 exactly as
  `plan.md` section 10a specifies. No deviation from scope. No Telegram
  contact of any kind: every `run.mjs` invocation used `--dry-run`, `.env`
  was not read, and `tools/tg-preview/state.json` was not read, edited,
  committed or deleted (it was already absent from the tree before this
  session's first command - see "Start here" fact 2).
- NEEDS_HUMAN_CONFIRMATION: **carried forward, unchanged by B4.** See
  `plan.md` section 11: retire the (now-backed-up, per fact 2) state and
  restart the reindex, or keep whatever the owner already did and accept
  that up to 28 URLs may stay stale? This still gates O2's first step only,
  not B4, and B4 does not resolve it either way.
- Branch: `automation/tg-preview-refresh`, worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`.
- Base / starting commit for B4: `5b2a68e`. HEAD after B4: see the commit
  below (`git log -1` for the sha; this session could not know it in
  advance of making it).
- Working tree at the time of writing: clean after the commit, aside from
  whatever the owner's own untracked files are (none known to this
  session - `tools/tg-preview/state.json` was absent throughout).

## Completed
- Batch name/id: **B4 - bound presses per run and stop on @WebpageBot's
  attempt throttle.**
- What shipped, matching `plan.md` section 10a steps 1-7 exactly:
  1. `tools/tg-preview/lib.mjs`: `PRESS_LIMIT = 50` (with the why-comment);
     `botThrottle(text)` (module-private `THROTTLE_MATCH`, pure, returns
     `null` or `{ seconds }`); `parseArgs` gained `--press-limit` (default
     `PRESS_LIMIT`, same numeric guard as `--limit`/`--max-wait`/
     `--budget-minutes`); `runRefresh` gained one run-scoped `pressBudget`
     spanning both phases - `pressOne` refuses and returns `{ stopped:
     'press budget reached' }` at zero, else decrements unconditionally
     before attempting; a throttle in a press's callback answer stops the
     run via the same `{ stopped }` path (never reaches `pressedList`,
     never grants confirmation); phase 2 refuses to send a batch when fewer
     than `PER_MESSAGE` presses remain (`'press budget too low for another
     batch'`, checked before every send, never trims); each button-wait
     round checks the bot's summary for a throttle and breaks the wait
     immediately on a match instead of exhausting `BUTTON_WAIT_ROUNDS`; a
     new check after `client()` and before phase 1 logs one warning when
     `mode === 'full'` and the press budget is below the stale count; the
     dry-run counts line gained ` (press budget <N>)`; every new stop sets
     `exitCode` 0. Also corrected two stale "free" -> "cheaper" comments/
     test titles left over from pass 3 (plan.md's own pass-4 correction),
     since they sat directly in the code this batch touched.
  2. `tools/tg-preview/lib.test.mjs`: a `botThrottle` suite (5 cases); the
     `--press-limit` parseArgs cases (default, parses, throws); 9 new
     `runRefresh` cases covering every item in section 3.7's pass-4 list
     (throttled press not recorded/green; summary throttle stops without
     pressing and without burning wait rounds, proven via a new
     `incomingCalls` counter added to the fake client; press budget stops
     mid-phase-1 with confirmed-so-far recorded; press budget stops phase 2
     before a send with an empty `sent` array; phase 1 and phase 2 proven to
     share one budget; `--press-limit 0` sends/presses nothing and exits
     green; the `--mode full` warning fires and does not fire; the dry-run
     line names the budget). All 68 pre-existing cases still pass unchanged
     bar the two "free"->"cheaper" title/comment fixes. 82/82 total.
  3. `docs/specs/META.md` section 7: one sentence on the bot's own attempt
     quota, after the existing "Update with content" sentence.
  4. `docs/specs/COVERAGE.md`: the `lib.test.mjs` paragraph extended with
     `botThrottle` and the press budget.
  5. `docs/tg-preview.md`: Operations (`--press-limit` documented next to
     `--limit`; the `--mode full` bullet now says it is a single pass, not
     the chunking mode, and that the tool warns; the CI-red bullet names
     the throttle as another green stop); "Rate limiting and resumability"
     gained a new "A third limit" paragraph (the 115/3213s data point, why
     the throttle stops rather than waits) and the phase-1 paragraph's
     heading/text changed "free" to "cheaper, not free"; the now-stale
     40-minutes-arithmetic framing got one corrective sentence pointing at
     the new paragraph rather than being left to contradict it; setup steps
     E, F and G replaced verbatim-in-substance by `plan.md` section 9
     (E gained step 0, the state retirement; F is now the 50-press
     calibration chunk, not the cc12/cc24/cc38 residue check, which is done
     per `context.md`; G is the ~22-run spaced cadence with the `--mode
     full` warning); "Coverage" names `botThrottle` and the press budget.
     Also fixed one now-stale cross-reference in the phase-1 paragraph that
     pointed at the old (now repurposed) step F's residue-check framing,
     since it sat in the same paragraph already being corrected.
  6. `grep -in "free|--limit|mode full" docs/tg-preview.md` run and every
     hit read by hand: no sentence implies presses are free or that
     `--mode full` is the chunking mode (one hit, "not a free one", is the
     correction itself).
- Files changed: `tools/tg-preview/lib.mjs`, `tools/tg-preview/lib.test.mjs`,
  `docs/tg-preview.md`, `docs/specs/META.md`, `docs/specs/COVERAGE.md`,
  `issues/tg-preview-refresh/{context,plan,handoff}.md`. `context.md` staged
  exactly as the orchestrator/planner left it - not edited by this batch.
- Commit: one commit, `fix(tg-preview): bound presses per run and stop on
  @WebpageBot's attempt throttle`, authored `artex-x
  <artex-x@users.noreply.github.com>`, no AI attribution trailer. Staged by
  path (never `git add -A`): the six files above. Run `git log -1` (or
  `git log --oneline -3`) for its sha - see "Status" above for why this file
  cannot print it.
- Deviations from `plan.md` section 10a: **none in behaviour.** Two small,
  in-scope cleanups beyond the letter of the steps, both inside files the
  batch was already touching and both named above: the "free"->"cheaper"
  wording pass-3 left behind (lib.mjs comment, one test title, and the
  tg-preview.md phase-1 heading/paragraph - the plan's own pass-4 text names
  this correction, section 3.4/9(d), so this is completing it rather than
  inventing it) and fixing the phase-1 paragraph's dangling reference to the
  old step F. Also added an `incomingCalls` counter to the test file's fake
  client (additive, does not change any existing test's behaviour) to prove
  the summary-throttle test does not burn wait rounds, since the acceptance
  criterion names "proving" that and a call count is the only way to show it
  from outside.

## Verification
- Commands run (exact), in order:
  - `node --test tools/tg-preview/lib.test.mjs` - `tests 82, pass 82, fail 0`
    (68 pre-existing + 14 new; two pre-existing test titles reworded,
    behaviour unchanged).
  - `node tools/tg-preview/run.mjs --dry-run` - printed
    `1062 urls stale, 1062 ready, up to 107 messages, 1062 presses (press
    budget 50)` plus the first three batches and exited 0. No env vars set;
    no Telegram contact.
  - `node tools/tg-preview/run.mjs --dry-run --press-limit ten` - threw
    `--press-limit must be a number, got ten`, exit code 1 (non-zero, per
    the acceptance criterion).
  - `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout
    600000) - **first run**: `lib.test.mjs` 82/82 green; vitest failed one
    test, `src/components/searchPage.test.ts > the cap > shows the first
    300 matches...`, `Test timed out in 30000ms` - this is the documented
    load flake (handoff fact 5 / `context.md`), not a regression; nothing
    in this batch touches `app/src/**`. **Re-run, same command**: green in
    full - `lib.test.mjs` 82/82, vitest `947/947` (39/39 files), coverage
    thresholds met (96.27% stmts / 88.53% branch / 96.67% funcs / 97.01%
    lines, all above whatever floor `npm run test` enforces).
  - `git status --porcelain` before committing - confirmed no change to
    `previews.yml`, `package*.json`, `run.mjs`, `client.mjs`, `i/`, `og/`,
    `data.js`; `tools/tg-preview/state.json` absent throughout, never
    created, read, or touched by any command above.
  - `git log --oneline -3` re-checked immediately before staging/committing
    - HEAD still `5b2a68e`, unmoved since dispatch.
- Results: all acceptance criteria in `plan.md` section 10a met - see
  "Completed" above for the line-by-line mapping; the dry-run line ends
  `(press budget 50)` exactly; the throttled-press, budget-too-low-for-batch,
  and shared-budget tests each assert on the fake client's `sent`/
  `pressedCalls` arrays and on `deps.written`, not just on returned booleans.
- Gates: `npm run check` green (after the known flake's one re-run). No
  `check:built`, no parity run - correctly out of scope per section 10a's
  gate line; nothing under `app/src/**`, `data.js`, `i/`, `og/` or
  `tests/parity/**` changed.

## Next batch

- **Name: O2 - the owner's operations, restarted from step E.0.** Not a
  code batch; no agent can perform it (needs the owner's Telegram account
  and hands). `plan.md` section 9 as revised in pass 4, carried into
  `docs/tg-preview.md` by B4: E.0 (confirm/retire any untrustworthy state -
  see "Start here" fact 2, it already appears absent) -> E.1/E.2 (dry runs,
  now printing the press budget) -> F (the 50-press calibration chunk,
  `--limit 5 --press-limit 50`) -> G (~22 spaced chunks, incremental mode
  only) -> H-J (secrets, first CI run, rotation).
- **What B4 changed that O2 should use:** `--press-limit` exists now and
  defaults to 50; a chunk that hits the bot's throttle reports `stopped: bot
  throttled: retry in <N>s` and stops green instead of silently
  mis-recording a refused press as confirmed; `--mode full` now warns
  instead of silently re-pressing the previous chunk, so step G's runbook
  no longer needs the owner to avoid it by memory alone.
- **What the orchestrator collects from O2** (B2's only input, per
  `plan.md`'s batch list): F.1's counts, whether 50 presses complete
  cleanly, the `N` of any throttle stop, F.4's already-posted regression
  result, and the per-chunk `photo changed`/`same` ratio.
- **No implement-ready code batch follows directly.** B2 (tuning from the
  first real run) is an outline only until O2 produces evidence - see
  `plan.md`'s batch list and section 13. Do not start B2 speculatively.

## Blockers
- **None for B4 - it shipped.** No blockers introduced by it.
- **One owner decision still gates O2's step E.0, carried forward
  unchanged:** confirm the state file was retired as the plan recommends
  (backed up outside the repository, not deleted) or, if it is genuinely
  gone already, treat that as done and proceed. Either way, up to 28 URLs
  from the earlier run may stay stale until re-pressed or re-fingerprinted.
  Reasoning: `plan.md` section 3.4, "What the 115 entries are worth". This
  is the owner's call; no agent resolves it.
- Merging this branch into `main` still waits for issue 47's B7 to land in
  the main checkout (orchestrator's ordering, unchanged).
- O2 needs B4 present in the tree the owner runs from before step F - it now
  is, at the commit this handoff describes.

## Deferred
- **Reviewer's remaining R1 items** (`plan.md` section 13) - still B2:
  5 (`$LIMIT`/`$args` quoting in `previews.yml`), 6 (unused `urls()`
  export), 7 (`--apply`'s needless `buildFromTree()` call).
- **A persisted press ledger** so a run refuses to start inside a cooldown
  the bot named, instead of the runbook asking the owner to keep an hour
  between chunks by hand. Needs a schema change and a model of a window
  measured once. B2.
- **An evidence class per URL in the state** (`answered` / `photo-changed`)
  so a future ambiguous set can be named and re-verified instead of the
  whole file being retired. This is the schema-v2 item, widened; it is what
  would have made this session's owner decision a two-line command.
- **Tune `PRESS_LIMIT`'s default** from O2's numbers, and consider deriving
  `--limit` from it so the two flags cannot be paired wrongly.
- Photo id in the state (schema v2) - `plan.md` 3.4, "Considered and not
  taken".
- One pointer line in `CLAUDE.md` and
  `.claude/prompts/refresh-artwork.prompt.md` - orchestrator's call.
- Issue 47 cut-over checklist: keep `page()` importable or repoint
  `manifest.mjs`; decide whether `og/` stays a source asset.
- Other messengers: not this task.

## Notes
- Mocks path: none (tooling and CI; no UI).
- Screenshot findings: none.
- **What changed in the model of the problem this pass, in one paragraph:**
  the tool had two axes, sends and presses, each bounded by Telegram's own
  flood control, and phase 1 was justified by presses being *free*. There is
  a third limit - `@WebpageBot`'s own attempt quota - it binds first, it
  ignores which method an attempt used, and presses are therefore the
  scarce resource rather than the free one. Everything in pass 4 follows
  from that: a budget that spans both phases, a refusal the tool can
  recognise, a runbook measured in runs rather than minutes, and a state
  file whose entries must all have been written by a tool that could tell
  the two apart.
- **`RECOVER_SCAN` stays 200**, re-examined and kept for a new reason: the
  press budget, not the scan window, now bounds phase 1, and a button older
  than the window costs a re-send *plus* a press. `plan.md` section 3.4,
  "Why `RECOVER_SCAN` stays 200".
- **The CI-red rules do not change.** A bot throttle is a Telegram-side
  stop: green, with the backlog recorded. `docs/tg-preview.md` gains it as
  a named example and nothing else in that paragraph moves.
- Cleanup performed / retained artifacts: none beyond B4's own files.
  `.env` (gitignored, the owner's session) was not read at all.
  `tools/tg-preview/state.json` was absent from the tree for this entire
  session - not created, read, or touched - see "Start here" fact 2 for
  what is and is not known about why.
- Session end partial progress: none - B4 is complete, committed, and
  gated green; this file and `plan.md` were updated in the same commit.
