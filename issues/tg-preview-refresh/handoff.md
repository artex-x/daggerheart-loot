# Handoff - TASK tg-preview-refresh

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/tg-preview-refresh/context.md` (in full - end with "The local reindex
finished; the goal is now CI", "Added by the planner, pass 6" and "Added by
the planner, pass 7"), then `plan.md` (its "Revision history" block first -
there are now **seven** passes; section 3.11 is pass 7's reasoning and
section 10d is the batch), then this file.

## Start here - a session that has none of this in context

**This work is not in the main checkout.** It lives in a worktree the owner
authorised on 2026-09-11:

| | |
|---|---|
| Worktree | `E:/dev/daggerheart-loot-wt/tg-preview-refresh` |
| Branch | `automation/tg-preview-refresh` |
| Base | `8b96ff4`; `origin/main` merged in at `1106355` by B6 (`3f6231c`) |
| Commits | `cce10cb` -> `5a959ca` -> `a4c9066` -> `0ab04eb` -> `2a4b78b` -> `5b2a68e` -> `359e0d4` -> `0f33aa2` -> `df76f13` -> `9694782` -> `4a042c7` -> `97e0209` -> `3f6231c` (merge) -> `54b84b3` -> `f5e5d69` -> `72d8de0` |

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
3. **B6 is shipped and reviewed approve; the review found five risks.** Two
   of them are holes in the exit-code contract the owner asked for (a false
   red on failed Telegram reads, a false green on a dead account). **B7**
   closes them and is implement-ready below. It is the next batch.
4. **B7 lands before the owner merges.** The recommended order is B7 ->
   O3, not the other way round (`plan.md` 3.11, last subsection). If the
   owner has already merged, B7 still lands unchanged as a follow-up.
5. **`origin/main` moved one commit since B6**, to `3504bf7` (a hooks fix,
   none of this task's files). B7 does **not** re-merge; the owner's merge
   takes it.
6. **Pushing and merging into `main` are the owner's** (`CLAUDE.md`).
   Nothing on this branch is pushed. The owner's merge push is what turns
   the CI job on, and it fires the first real run automatically.

## Status
- Task status: **in_progress - B6 shipped and reviewed approve
  (2026-09-16); pass-7 planning done; B7 implement-ready and not started.**
  O3 (the owner's merge and first-run watch) follows B7.
- Last agent: **planner (2026-09-16, pass 7).** No production code touched;
  no gates run; no Telegram contact; `.env` not read; `state.json` not
  touched (tree clean before and after; only `git fetch origin main` was
  run, which is read-only).
- NEEDS_HUMAN_CONFIRMATION: **no.** One thing the owner should know, not
  decide: the recommended order is now B7, then merge. Nothing in B7 needs
  their input.
- Branch: `automation/tg-preview-refresh`, worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`. **Not pushed.**
- Base / starting commit for B7: `72d8de0` (the branch tip), which is B6's
  record commit on top of `f5e5d69`.
- Working tree after pass 7: the three task files modified, nothing else
  (`git status --porcelain` shows only `issues/tg-preview-refresh/`).

## Completed

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
- **Not run for B7, and why - stated from the file list, not assumed:**
  `npm run check:built`, parity and `golden` are **not required**. B7
  touches five `tools/tg-preview/*.mjs`, `previews.yml`, `.gitignore`,
  `docs/tg-preview.md` and this directory; it *reads* `app/index.html` and
  changes nothing under `app/**`, `data.js`, `i/`, `og/`, `tests/**` or
  `dist/`, and nothing a screen draws. Gates for B7: `node --test
  tools/tg-preview/lib.test.mjs`, `node tools/tg-preview/run.mjs --dry-run`,
  the four scratch-file proofs in 10d step 15, and **one** `npm run check`
  in one foreground call.

## Next batch (implement-ready)
- Name: **B7 - make the exit codes true in both directions** (`plan.md`
  section 10d; design in 3.4 pass-7 note, 3.5 pass-7 table, 3.11, 5.2
  pass-7 note, 6 pass-7, 7, 8, 9 I.6/J).
- Objective: close the B6 review's R1-R5 and the nits on the same files so
  that before the first CI run a failed Telegram read is a green resumable
  stop, a dead account (five more classes) is exit 2 and a revoked session
  is exit 2 as documented, a corrupt `state.json` is a stop and never an
  empty state, the record step's fetch names its refspec, and the root URL
  is fingerprinted from `app/index.html`. One code commit, one check.
- In scope: `tools/tg-preview/lib.mjs`, `lib.test.mjs`, `run.mjs`,
  `client.mjs` (the guard only), `manifest.mjs` (root HTML source only);
  `.github/workflows/previews.yml` (two fetch lines, one message);
  `.gitignore` (one line); `docs/tg-preview.md` (I.6, J, two Operations
  paragraphs, one Coverage clause); the three task files.
- Out of scope: `live.mjs`, `login.mjs`, `tools/tg-preview/package*.json`,
  `ci.yml`, `state.json`, `README*`, `docs/specs/*`, `CLAUDE.md`, `app/**`
  (read only), `index.html`, public contracts; `npm audit` on the cron; a
  connect retry; a run counter; a state shape check; `continue-on-error`;
  any new flag, input or exit code; the merge of `origin/main`.
- Files expected: the five `.mjs` files above, `previews.yml`, `.gitignore`,
  `docs/tg-preview.md`, `issues/tg-preview-refresh/{context,plan,handoff}.md`.
- Steps: section 10d, steps 1-16 - commit 1 is the pass-7 task docs
  (gate-exempt); commit 2 is: `FATAL_ERRORS` + the reason string (3); the
  connect classified once (4); `read()` (5); the five call sites with their
  `stopped` prefixes `recovery scan: ` / `button poll: ` / `refetch: ` and
  `closeQuietly()` (6); `record()` writes `site` (7); `client.mjs` loses
  `isUserAuthorized()` (8); `manifest.mjs` reads `app/index.html` (9);
  `run.mjs`: `readState` throws on a corrupt file, `--apply` takes `site`
  from the result, `::error::` on exit 2 (10); the tests - five fatal
  names, three opt-in fake scripts, seven new cases, two extended, the root
  test on `app/index.html`, 96 passing (11); the workflow's two refspecs and
  the `else` message, Prettier, `bash -n` (12); `.gitignore` (13); the
  runbook (14); the gates and the four scratch-file proofs (15); stage by
  path and commit
  `fix(tg-preview): resumable reads, red on a dead account, stop on a corrupt state`
  (16).
- Acceptance criteria: section 10d's list - 96 tests; the four `cx.incoming`
  / `cx.byIds` sites all inside `read(...)`; the five names present and
  "credential is dead" gone; `isUserAuthorized` gone; `existsSync` gone and
  `buildFromTree` called once in `run.mjs`; `'app', 'index.html'` in
  `manifest.mjs`; two explicit refspecs and no "every url counts as stale"
  in the workflow; `state.json.tmp` ignored; the dry run's stale count equal
  to B6's; the scratch-file proofs (corrupt -> exit 1, absent -> 1092,
  `--apply` on a scratch copy keeps 1062 keys, on a corrupt copy exits 1,
  without `site` exits 1); the state hash unchanged; I.6 rewritten; the
  deferred items placed here (R1 item 7, the four nits) each done; tree
  clean; `npm run check` green once.
- Verification commands: section 10d's block - `node --test
  tools/tg-preview/lib.test.mjs`; `node tools/tg-preview/run.mjs --dry-run`;
  the `--state "$SCRATCH/corrupt.json"` / `absent.json` dry runs with
  `--no-verify`; the two `--apply` runs against `"$SCRATCH/s.json"`;
  `git hash-object tools/tg-preview/state.json`; `npx prettier --check
  .github/workflows/previews.yml`; `set -o pipefail; npm run check 2>&1 |
  tail -n 120` (Bash timeout 600000, once); `git status --porcelain`.
- Risks / do-nots: never run `run.mjs` without `--dry-run` except the two
  `--apply` proofs, and those only with `--state` in the scratchpad; never
  read `.env`; never stage or touch `state.json` (hash is the proof); do not
  change the fake client's defaults; do not add a retry, counter, shape
  check, flag, input, exit code or `continue-on-error`; do not flip the
  catch-all to red; do not touch `og/`, `index.html`, `app/index.html`,
  `ci.yml`; do not merge `origin/main`; a changed **stale** count after the
  `manifest.mjs` change is a stop, not a reason to edit either HTML file.
- Fallback (optional): if removing the guard leaves no RPC before
  `getEntity` that surfaces the session error (it does today), replace it
  with a bare `await client.invoke(new Api.updates.GetState())` - never a
  plain `Error`.

## Blockers
- **None.** B7 needs no owner decision, no Telegram contact and no merge;
  every gate runs locally. The worktree was quiet during planning (the
  tree was clean; only task files are modified now).
- **O3 (the owner's merge) is after B7 by recommendation, not by
  dependency.** If the owner merges first, B7 lands unchanged as a
  follow-up; the first reds and greens must then be read against `plan.md`
  3.5's corrected table.

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
  (`--apply`'s `buildFromTree()`) is **in B7**.
- **A connect retry around `client()`** - only if transient connect
  failures produce red runs more than rarely. B7 classifies the connect
  error's exit code; it does not retry.
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
- Cleanup performed / retained artifacts: none created; the planner wrote
  only the three task files. `.env` was not read. `state.json` was not
  touched (`git status` clean for `tools/`).
- Session end partial progress: none - pass 7 is complete; `plan.md`,
  `handoff.md` and `context.md` are consistent with each other and with the
  tree at `72d8de0`.
