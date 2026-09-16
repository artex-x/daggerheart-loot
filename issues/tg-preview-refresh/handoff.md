# Handoff - TASK tg-preview-refresh

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/tg-preview-refresh/context.md` (in full - end with "The local reindex
finished; the goal is now CI", "Added by the planner, pass 6" and "Added by
the planner, pass 7"), then `plan.md` (its "Revision history" block first -
there are now **seven** passes; section 3.11 is pass 7's reasoning and
section 10d is B7, which is now shipped), then this file.

## Start here - a session that has none of this in context

**This work is not in the main checkout.** It lives in a worktree the owner
authorised on 2026-09-11:

| | |
|---|---|
| Worktree | `E:/dev/daggerheart-loot-wt/tg-preview-refresh` |
| Branch | `automation/tg-preview-refresh` |
| Base | `8b96ff4`; `origin/main` merged in at `1106355` by B6 (`3f6231c`) |
| Commits | `cce10cb` -> `5a959ca` -> `a4c9066` -> `0ab04eb` -> `2a4b78b` -> `5b2a68e` -> `359e0d4` -> `0f33aa2` -> `df76f13` -> `9694782` -> `4a042c7` -> `97e0209` -> `3f6231c` (merge) -> `54b84b3` -> `f5e5d69` -> `72d8de0` -> `edde81b` -> B7's code commit |

The task-directory copies **in that worktree** are authoritative. The copy
under `E:/dev/daggerheart-loot` is a stale snapshot - do not read it as
current.

Establish state before acting; do not assume this file is the newest thing
that happened:

```
git log --oneline -5
git log --oneline -1 origin/main
git status --porcelain
```

Six facts a fresh session will not infer, in descending order of how much
damage getting them wrong does:

1. **`.env` in this worktree holds a live Telegram user session.**
   **No agent runs `run.mjs` without `--dry-run`, ever** - the two `--apply`
   proofs in B7 run only against scratch-file copies under `--state`. Do not
   read, print or copy `.env`; `bash-guard` denies it and that is correct.
2. **`tools/tg-preview/state.json` is committed** (`54b84b3`, one file) and
   is the owner's finished reindex: 1062 entries, blob hash
   `7c6e37ebec07ef8482f8208c1da2e4b7ca0441de`. It is never edited,
   regenerated, reformatted, staged or deleted; never `git add -A`.
3. **B6 and B7 are both shipped.** B7 closed the B6 review's five risks, so
   the tool's exit codes now match the contract in both directions: a failed
   Telegram read is a green resumable stop, a dead account is exit 2.
4. **The next action is O3, the owner's merge** - no agent batch is open.
   B7 landed before the merge, as `plan.md` 3.11 recommended.
5. **`origin/main` moved one commit since B6**, to `3504bf7` (a hooks fix,
   none of this task's files). B7 did **not** re-merge; the owner's merge
   takes it.
6. **Pushing and merging into `main` are the owner's** (`CLAUDE.md`).
   Nothing on this branch is pushed. The owner's merge push is what turns
   the CI job on, and it fires the first real run automatically.

## Status
- Task status: **in_progress - B6 and B7 shipped (2026-09-16). Every agent
  batch this task planned is done; the only remaining step is O3, the
  owner's merge and first-run watch.**
- Last agent: **implementer (2026-09-16, B7).** Two commits, `edde81b` (the
  pass-7 task docs) and `PENDING_SHA` (the code). No Telegram contact of any
  kind; `.env` not read; `state.json` not staged, edited or written - its
  blob hash is `7c6e37eb...` before and after, both in the tree and at HEAD.
- NEEDS_HUMAN_CONFIRMATION: **no.** One thing the owner should know, not
  decide: B7 landed first, as recommended, so the first CI runs can be read
  against `plan.md` 3.5's corrected table and the runbook's new I.6.
- Branch: `automation/tg-preview-refresh`, worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`. **Not pushed.**
- Base / starting commit for B7: `72d8de0` (B6's record commit).
- Working tree after B7: **clean** (`git status --porcelain` empty).

## Completed

### B7 - make the exit codes true in both directions

- **Status: shipped 2026-09-16.** Two commits on top of `72d8de0`, in the
  order section 10d requires:

  | # | sha | what |
  |---|---|---|
  | 1 | `edde81b` | `docs(tg-preview): pass 7 - the B6 review, and B7` - the three task files alone |
  | 2 | `PENDING_SHA` | `fix(tg-preview): resumable reads, red on a dead account, stop on a corrupt state` |

- **R1, the false red.** A `read()` helper over the existing `attempt()`
  now wraps all four Telegram reads: the recovery scan (`stopped: recovery
  scan: ...`, nothing pressed, nothing written, `record()` never runs), both
  button polls (`button poll: ...`, `break batchLoop`, the sent batch stays
  pending, the previous batch's record intact) and `pressGroup`'s post-press
  `byIds` (`refetch: ...`, every delta `unseen`, answered presses still
  confirm under the unchanged rule and are recorded). `close()` became
  `closeQuietly()` - a failed disconnect logs `warning: disconnect failed:
  ...` and does not fail the run. `read()` touches no press budget, and
  `confirmed + pending = stale` still holds (the existing case asserting it
  passes untouched).
- **R2, the false green.** Five names appended to `FATAL_ERRORS`
  (`AuthKeyDuplicatedError`, `UserDeactivatedError`, `UserDeactivatedBanError`,
  `PhoneNumberBannedError`, `YouBlockedUserError`); the fatal reason is now
  `<Class>: the account or session is unusable; a human must act`. The
  connect is classified once by `decide()` - fatal returns the
  `ready.length === 0` shape with `exitCode 2`, anything else rethrows, so a
  transport failure at connect is still exit 1 and there is no connect
  retry. `client.mjs` lost its authorization guard, so the first RPC's real
  error class reaches `decide()`. `run.mjs` prints `::error::<stopped> - see
  docs/tg-preview.md, step I.6` on exit 2.
- **R3.** `readState` returns `{}` only for `ENOENT`; a file that exists and
  does not parse throws `state file is not valid JSON: <path> (...) -
  refusing to treat it as empty`, which `main().catch` turns into exit 1.
- **R4.** Both `git fetch --depth=1 origin main` lines in `previews.yml`
  now name `+refs/heads/main:refs/remotes/origin/main`.
- **R5.** `manifest.mjs` fingerprints the root from `app/index.html`
  (`ROOT_HTML`) when `--assets` is absent; `og/` still comes from the
  repository root. The dry-run stale count is unchanged at 125, which is the
  proof the two roots' `og:` tags still agree.
- **Nits closed:** `--apply` no longer calls `buildFromTree()` - `record()`
  writes `site` into `result.json` and `--apply` reads it (and refuses a
  result without one), so the record step no longer needs `main`'s tree to
  be buildable at commit time; the workflow's `else` message now says
  `state.json could not be read from origin/main; using the checked-out
  copy`; `.gitignore` ignores `tools/tg-preview/state.json.tmp`; the docs
  and `plan.md` 3.5 no longer attach exit 2 to "a dead credential" alone;
  this file uses the template's "Next batch (implement-ready)" heading.
- **One deviation from section 10d, recorded.** Step 8 asks the replacement
  comment in `client.mjs` to name teleproto's `isUserAuthorized()`, while
  the acceptance criteria require `grep -c "isUserAuthorized"
  tools/tg-preview/client.mjs` to be **0**. Those cannot both hold
  literally. Resolved in favour of the mechanical criterion: the comment
  carries every fact the step asks for (the implementation
  `try { updates.getState() } catch { return false }`, the file
  `client/users.js`, why it swallows the class name, and that the first RPC
  throws the real error) without the identifier itself. Count is 0.
- Everything else in 10d was implemented as written; no other deviation.

### Pass 7 (planner, 2026-09-16) - the B6 review, filed and answered

- **Verdict recorded: approve**, five risks R1-R5, six nits. Every item is
  either in B7 (below) or under Deferred with its reason; `plan.md` 3.11
  gives the test each one passed - the owner's own contract, "red means the
  next run will not fix it".
- **Q1 - what goes into B7.** R1 (false red) and R2 (false green, both the
  `FATAL_ERRORS` gap and the revoked session exiting 1) because they are
  the definition's holes; R3 because it is the highest-cost latent path
  and four lines on an open file; R4 because it is two lines with no
  downside; R5 on its merits - the failure mode is the silent stale preview
  this task exists to remove, on the URL every `#/i/<id>` share resolves to,
  and the fix is one path (`--assets dist` plus a CI build rejected: a root
  `npm ci` and a Vite build six times a day to read three tags). Nits in:
  the `else` message, `state.json.tmp`, the exit-code wording, `--apply`'s
  `buildFromTree()` (result carries `site`), this file's heading. Deferred:
  `npm audit` on the cron (it *is* the contract), the catch-all's green
  default, B4 nits 1/4/6, R1 item 6, a connect retry.
- **Q2 - R1 without changing what a stop means.** A `read()` helper over
  the existing `attempt()`; it touches no press budget. Recovery scan fails
  -> green stop, nothing pressed, nothing written. Button poll fails -> the
  sent batch stays pending, previous record intact, run stops. Post-press
  `byIds` fails -> every delta `unseen`, answered presses confirm under the
  **unchanged** rule and are recorded, run stops. `close()` cannot fail the
  run. `confirmed + pending = stale` still holds. The `lib.test.mjs` cases
  that must not change are named in 3.11; the fake's defaults do not change.
- **Q3 - R2's shape.** Five names in `FATAL_ERRORS` (reviewer's four plus
  `UserDeactivatedError`), all verified present in teleproto 1.229.0; the
  connect classified once by `decide()` for the fatal row only;
  `client.mjs`'s `isUserAuthorized()` guard removed because teleproto
  implements it as `try { getState } catch { return false }` and it
  swallows the class name. Run counter rejected: needs state the tool does
  not have, fires on legitimate long stops, names no cause. The owner sees
  a red run, `stopped: <Class>: the account or session is unusable; a human
  must act` in the log and as `::error::`, and I.6 maps the class to the
  step (D.3 for a session, A-D for an account, unblock for
  `YOU_BLOCKED_USER`).
- **Q4 - the runbook.** No procedure step changes; I.6 and J are corrected
  (the code exited 1, not 2, on a revoked session; account-level classes
  were not listed; a corrupt state is a new exit-1 red). The 3.5 table is
  corrected in the same batch.
- **Q5 - ordering.** B7 before the merge: it changes what red and green
  mean in the two directions that matter, depends on no evidence from
  `main`, is one batch and one check on this task's own files, and costs
  one local batch before a switch that then runs unattended every four
  hours. If the owner merges first, nothing in B7 is invalidated.
- **Files written:** `plan.md` (pass-7 revision: revision history, section
  1's cut-over note, 3.4's pass-7 rows, 3.5's corrected table, new 3.11,
  section 4's tree notes, 5.2's pass-7 note, 6's pass-7 lines, 7's pass-7
  list, 8 re-confirmed for B7, 9's I.6/J revision, the batch list with B6
  shipped and B7 added, new **10d**, 11-13), `handoff.md` (this file),
  `context.md` (one appended block, "Added by the planner, pass 7").
- **Commits:** none by the planner. The implementer commits the pass-7 task
  docs first, on their own (section 10d, commit 1).

### B6 - onto `main`, and the fail-safe CI job

- **Status: shipped 2026-09-16, reviewed approve.** Four commits on top of
  `4a042c7`, in the order section 10c requires:

  | # | sha | what |
  |---|---|---|
  | 1 | `97e0209` | `docs(tg-preview): pass 6 - CI fail-safety, the merge, and the committed state` |
  | 2 | `3f6231c` | `Merge remote-tracking branch 'origin/main'` - `origin/main` = `1106355` |
  | 3 | `54b84b3` | `chore(tg-preview): record the first full reindex` - `state.json` alone, 1069 insertions |
  | 4 | `f5e5d69` | `ci(tg-preview): make the previews job fail-safe and schedule it` |

  plus `72d8de0`, the docs-only record of commit 4's sha and the gate
  results.
- The merge had exactly one conflict (`package.json`'s `"check"` line),
  resolved as the union; the four auto-merged files were read and left as
  git produced them; no `npm ci` (lockfile unchanged); `state.json`
  byte-identical before staging and after the commit; the post-merge dry
  run `125 urls stale, 125 ready, up to 13 messages, 125 presses (press
  budget 50)` of 1092, recorded not fixed; the manifest still builds through
  `main`'s changed stub generator.
- Code: the `--mode full` warning moved above the dry-run branch; its test
  tightened plus one case; `writeResult` atomic; a dry-run summary line
  behind `GITHUB_STEP_SUMMARY`. Workflow: `schedule: '23 */4 * * *'`, the
  job `if:` admits it, the `Secrets present?` guard deleted, a bash array,
  `--budget-minutes 40`, `timeout --kill-after=30s 50m` with the
  `code=0; ... || code=$?` capture and `124`/`137` mapped green. Runbook:
  A-G marked done, H done, I and J replaced by section 9's text, the
  schedule, the three clocks, the red-means list.
- **The review (approve) found:** R1 - `incoming` x3 and `byIds` not in
  `attempt()`, a resumable stop exits 1; R2 - `FATAL_ERRORS` omits
  `AuthKeyDuplicated`/`UserDeactivatedBan`/`PhoneNumberBanned`/
  `YouBlockedUser`, so a dead account stops green forever, and a revoked
  session exits 1 via `client.mjs`'s guard; R3 - `readState` returns `{}`
  on a parse error and `--apply` would commit the wipe; R4 - both
  `git fetch --depth=1 origin main` lines rely on the checkout's refspec;
  R5 - `manifest.mjs` fingerprints the unpublished root `index.html`. Nits:
  the `else` message contradicts the branch; `state.json.tmp` not ignored;
  docs and 3.5 attach exit 2 to a dead credential; `npm audit` six times a
  day; `--apply` calls `buildFromTree()` for `site` alone; this file's
  "Next batch" heading was renamed. All filed: B7 or Deferred.

### B5 - say what the photo counter actually measures

- **Status: shipped.** Docs `df76f13`; batch `9694782`; record `4a042c7`.
  Four photo buckets, `pressed P` as attempts. Full spec `plan.md` 10b.

### B4 - bound presses per run and stop on @WebpageBot's attempt throttle

- **Status: shipped, reviewed, remediated.** `359e0d4` and `0f33aa2`.

### O2 - the owner's local reindex

- **Status: done, 2026-09-14.** `state.json` complete at 1062. Per-chunk
  numbers not captured here (Deferred).

### Earlier

B1 (`cce10cb`), R1 (`5a959ca`), R2 (`a4c9066`), B3 (`2a4b78b`), O1 - see
`plan.md` section 10 and the git log.

## Verification
- **B7 (implementer, 2026-09-16)** - every command below was run in this
  worktree, in this order, and none of them contacted Telegram:
  - `node --test tools/tg-preview/lib.test.mjs` -> **96 pass, 0 fail**, 13
    suites (84 before B7: +5 fatal-class cases, +7 `runRefresh` cases -
    exactly section 10d's prediction).
  - `set -o pipefail; npm run check 2>&1 | tail -n 120`, one foreground
    call, Bash timeout 600000 -> **green**. `node --test` 96/96; vitest 42
    files / 1035 tests; coverage 96.61 / 88.58 / 97.1 / 97.34 - the same
    vitest and coverage numbers B6 recorded. No flake, no re-run.
  - `node tools/tg-preview/run.mjs --dry-run` -> `125 urls stale, 125
    ready, up to 13 messages, 125 presses (press budget 50)`, exit 0 -
    **identical to B6's line**, so `manifest.mjs`'s switch to
    `app/index.html` changed no fingerprint. `git status --porcelain --
    tools/tg-preview` afterwards showed only the five modified `.mjs`
    files; nothing was written.
  - R3, refresh path: `printf '{' > "$SCRATCH/corrupt.json"`;
    `--dry-run --no-verify --state "$SCRATCH/corrupt.json"` -> **exit 1**,
    `tg-preview run failed: state file is not valid JSON: ... - refusing to
    treat it as empty`. `--state "$SCRATCH/absent.json"` -> `1092 urls
    stale, 1092 ready, up to 110 messages, 1092 presses (press budget 50)`,
    **exit 0**, and no `absent.json` was created.
  - R3, apply path and the `site` change: `--apply "$SCRATCH/r.json"
    --state "$SCRATCH/s.json"` (a scratch copy of the committed state) ->
    `state updated from ...`, exit 0, `s.json` still **1062 keys**. The same
    against `corrupt.json` -> **exit 1**, `corrupt.json` unchanged (still
    one byte). A result without `site` -> **exit 1**, `result file carries
    no site: ...`.
  - `npx prettier --write` then `--check
    .github/workflows/previews.yml` -> formatted correctly, and the file's
    diff is exactly 3 lines changed (the two refspecs and the `else`
    message). Both `run:` blocks extracted to the scratchpad and `bash -n`
    clean.
  - Acceptance greps, all as specified: `cx.incoming`/`cx.byIds` in
    `lib.mjs` = **4**, all four inside `read(() => ...)`; `cx.close()` = 1
    (inside `closeQuietly`); the five new class names = 5; `credential is
    dead` = 0; `isUserAuthorized` in `client.mjs` = 0; `existsSync` in
    `run.mjs` = 0; `buildFromTree` in `run.mjs` = 2 (import + refresh path);
    `::error::` = 1; `'app', 'index.html'` in `manifest.mjs` = 1; the
    refspec in the workflow = 2; `every url counts as stale` = 0; `cron:`
    still 1; `continue-on-error` still 0; `state.json.tmp` in `.gitignore`
    = 1; `recovery scan` in `docs/tg-preview.md` = 3.
  - **`state.json` untouched:** `git hash-object tools/tg-preview/state.json`
    and `git rev-parse HEAD:tools/tg-preview/state.json` are both
    `7c6e37ebec07ef8482f8208c1da2e4b7ca0441de`, before the batch and after
    the commit. It appears in neither commit's
    `git diff --cached --name-only`, and nor does `.env`.
  - `docs/specs/COVERAGE.md` re-read and confirmed to need nothing: its
    `lib.test.mjs` paragraph already owns "the flood/fatal error table" and
    "the two-phase send-and-press loop against a fake client".
  - **Not run, from the actual file list:** `npm run check:built`, parity
    and `golden`. B7 touched five `tools/tg-preview/*.mjs`, `previews.yml`,
    `.gitignore`, `docs/tg-preview.md` and this directory; it *reads*
    `app/index.html` and changed nothing under `app/**`, `data.js`, `i/`,
    `og/`, `tests/**` or `dist/`, and nothing a screen draws.
- **Pass 7 (planner)** - no gates run; no production code touched.
  Read-only measurements, all in `context.md` "Added by the planner, pass 7":
  - `git fetch origin main` (read-only) -> `origin/main` = `3504bf7`;
    `git rev-list --count HEAD..origin/main` = **1**;
    `git diff --stat HEAD...origin/main -- tools/tg-preview .github/workflows/previews.yml docs/tg-preview.md package.json .gitignore tools/build-share-pages.js tools/derived.js app/index.html index.html data.js og i`
    -> **empty**.
  - `git status --porcelain` -> empty before planning; `git log --oneline -3`
    -> `72d8de0`, `f5e5d69`, `54b84b3`.
  - The five error classes exist in
    `tools/tg-preview/node_modules/teleproto/errors/RPCErrorList.js`
    (`PhoneNumberBannedError` line 3529, `YouBlockedUserError` 6143,
    `UserDeactivatedError` 6375, `UserDeactivatedBanError` 6385,
    `AuthKeyDuplicatedError` 6977).
  - `teleproto/client/users.js:281` - `isUserAuthorized` is
    `try { await client.api.updates.getState(); return true } catch { return false }`.
  - `teleproto/network/MTProtoSender.js:557-560, 613-617, 660-690` - a
    `-404` from the server resets the auth key (`_handleBadAuthKey`) and
    re-keys; the RPC then fails with the 401 class. Read, not measured.
  - `index.html` lines 16-23 and `app/index.html` lines 21-28: the three
    `og:` tags (`title`, `description`, `image`) are byte-identical.
  - `ci.yml` lines 222-225: `cp -r dist/index.html dist/assets dist/data.js _site/`
    then `img og i card` from the repository - the root `index.html` is not
    deployed.
  - `tools/tg-preview/live.mjs:67-76` - `liveFingerprint` errors are caught
    into `not live`; not an R1-class hole.
  - `lib.test.mjs`: 84 cases today; the fake client's `incoming` queue and
    `byIds` never throw (lines 490-505); the `decide` fatal loop lists five
    classes (254-260); the `--result` test asserts `.urls` only (966).
- **B6 (implementer, 2026-09-16)** - both `npm run check` calls green in one
  foreground call each (check #1 on the merged tree: `node --test` 83/83,
  vitest 42 files / 1035 tests, coverage 96.61 / 88.58 / 97.1 / 97.34;
  check #2 on the final tree: 84/84, the same vitest and coverage numbers);
  `run.mjs --dry-run` -> `125 urls stale, 125 ready, up to 13 messages, 125
  presses (press budget 50)` before and after the code; `--dry-run --mode
  full` prints the warning before the counts; `prettier --check` on the
  workflow passes; both `run:` blocks `bash -n` clean; the `timeout`
  mapping proven by hand (`124` -> step exit 0; a child's 2 re-raised).
  Exact lines in the `72d8de0` version of this file.
## Next batch (implement-ready)

**No agent batch is open.** Every batch this plan defined is shipped; what
remains is the owner's own step.

- Name: **O3 - the owner merges, and watches the first run** (`plan.md`
  section 10, "O3", with the procedure in section 9, steps H-J and the
  corrected I.6).
- Objective: merge `automation/tg-preview-refresh` into `main` and push.
  That push is what turns the CI job on and fires the first real run; the
  committed `state.json` (1062 entries) is what stops that run redoing the
  whole reindex.
- Preconditions, all met: the branch is at a committed boundary with a green
  `npm run check`; the three repository secrets are configured; `state.json`
  is committed and byte-identical to the owner's finished reindex.
- What the owner does: fetch and merge `origin/main` (it has moved to
  `3504bf7` plus whatever landed since - B6's merge resolved the one known
  conflict, `package.json`'s `"check"` line, as the union, so expect the
  same shape), push, then follow `docs/tg-preview.md` steps I.1-I.5 on the
  first run.
- What to expect on the first run: a backlog of ~125 URLs (the frame stubs'
  new `og:description` provenance prefix, the 30 new records and the root),
  drained at 50 presses a run over roughly three runs, i.e. about half a day
  on the four-hourly schedule.
- How to read red and green: `plan.md` 3.5's **corrected** table and the
  runbook's new I.6. A red run whose `stopped:` line is not on I.6's list is
  itself worth reporting.
- Pushing and merging are the owner's; no agent does either.

## Blockers
- **None for any agent.** Every gate B7 needed ran locally and green; no
  owner decision is outstanding.
- **O3 is blocked only on the owner**, because pushing and merging into
  `main` are theirs by `CLAUDE.md`. Nothing on this branch is pushed, so
  until they merge, the CI job does not exist on `main` and no automatic
  run can fire.

## Deferred
- **From the B6 review, deferred with reason:** `npm audit
  --audit-level=high` on the cron - a new advisory red *is* the contract
  (the process holds a full account session; `ci.yml` applies the same
  rule); recorded in `plan.md` section 12. `decide()`'s catch-all keeps its
  green default - one more `FATAL_ERRORS` name if a permanent class ever
  shows up, never a run counter.
- **B4 review nits still open:** 1 (`attempt()` transport retries can
  re-invoke `cx.press` inside one budget decrement - absorbed by the
  under-shoot; unchanged by B7's `read()`, which touches no budget), 4
  (`incoming` applies `limit` before `!m.out`, ~185 not 200), 6
  (`m.url === null` strict; unreachable through `plain()`).
- **Reviewer's remaining R1 item:** 6 (unused `urls()` export). Item 7
  (`--apply`'s `buildFromTree()`) is **done in B7**.
- **A connect retry around `client()`** - only if transient connect
  failures produce red runs more than rarely. B7 classified the connect
  error's exit code; it does not retry, so a transport failure at connect is
  still exit 1 (a crash), as section 12 accepted.
- **A `press_limit` workflow input**, or deriving `--limit` from the press
  budget - when CI's `pressed P` lines justify moving the default.
- **O2's per-chunk numbers** - not captured here; B2 wants `pressed P` per
  run, any throttle `N`, F.4's regression result and G.7's one-press answer.
- **A persisted press ledger**, **an evidence class per URL (schema v2)**,
  **`photo.date` as a pre-press skip**, **tuning `PRESS_LIMIT`'s default** -
  unchanged from pass 5, all B2 and all wanting numbers first.
- **Measuring what a live dead session actually throws** - free on
  rotation day (step J); until then the docs say "when Telegram names it".
- One pointer line in `CLAUDE.md` and
  `.claude/prompts/refresh-artwork.prompt.md` - orchestrator's call.
- The legacy root `index.html` is no longer deployed but is still tracked
  and still read by `tests/` and the parity harness; whether it stays is
  issue 47's closeout, not this task's.
- Other messengers: not this task.

## Notes
- Mocks path: none (tooling and CI; no UI).
- Screenshot findings: none.
- **What changed in the model of the problem this pass, in one paragraph:**
  B6 made the workflow's `case` honest, and the review showed the *tool*
  underneath it was not - it reported exit 1 for stops the next run would
  fix, and exit 0 for accounts no run could ever fix. The contract the
  owner wrote ("red means the next run will not fix it") is therefore only
  half implemented until the tool's own codes match it, and the first CI
  runs are the worst moment to discover that, because they are when the
  owner learns what red and green mean. B7 is small - names in a set, one
  helper over an existing retry loop, a thrown parse error, two refspecs,
  one path - and it is small precisely because B3-B6 already built the
  machinery; it just was not wired to four reads and one connect.
- **The measurement that would sharpen this next** is unchanged from pass
  6: the first automatic run's `phase 1: pressed N` and the pasted
  `i/f1.html` description (`plan.md` 9, I.3 and I.5). Pass 7 adds one: the
  first red run's `stopped:` line, read against I.6's list - if it is not
  on the list, that is the report.
- Cleanup performed / retained artifacts: B7's proofs wrote only scratchpad
  files (`corrupt.json`, `absent.json` - never created, `s.json`, `r.json`,
  `r-nosite.json`, the two extracted `run:` blocks) outside the repository;
  nothing was added to the tree. `.env` was not read. `state.json` was not
  touched.
- Session end partial progress: none - B7 is complete and committed;
  `plan.md`, `handoff.md` and `context.md` are consistent with each other
  and with the tree at B7's code commit.
