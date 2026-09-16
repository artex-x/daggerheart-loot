# Handoff - TASK tg-preview-refresh

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/tg-preview-refresh/context.md` (in full - end with "The local reindex
finished; the goal is now CI" and "Added by the planner, pass 6", which carry
everything pass 6 was given and everything it measured), then `plan.md` (its
"Revision history" block first - there are now **six** passes), then this
file.

## Start here - a session that has none of this in context

**This work is not in the main checkout.** It lives in a worktree the owner
authorised on 2026-09-11:

| | |
|---|---|
| Worktree | `E:/dev/daggerheart-loot-wt/tg-preview-refresh` |
| Branch | `automation/tg-preview-refresh` |
| Base | `8b96ff4`; **`origin/main` is merged in** as of B6 (`1106355`, merged 2026-09-16) |
| Commits | `cce10cb` -> `5a959ca` -> `a4c9066` -> `0ab04eb` -> `2a4b78b` -> `5b2a68e` -> `359e0d4` -> `0f33aa2` -> `df76f13` -> `9694782` -> `4a042c7` -> `97e0209` -> `3f6231c` (merge) -> `54b84b3` -> `f5e5d69` |

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
   **No agent runs `run.mjs` without `--dry-run`, ever.** Do not read,
   print or copy `.env`; `bash-guard` denies it and that is correct.
2. **`tools/tg-preview/state.json` is the owner's finished reindex** - 1062
   complete entries, `updatedAt 2026-09-14T20:04:16.406Z`, blob hash
   `7c6e37ebec07ef8482f8208c1da2e4b7ca0441de`. **B6 committed it unchanged**
   (`54b84b3`, one file); `git rev-parse HEAD:tools/tg-preview/state.json`
   still returns that hash. It is never edited, regenerated, reformatted or
   deleted; never `git add -A`.
3. **The merge is done** (`3f6231c`, `origin/main` at `1106355`), with the
   one predicted conflict - `package.json`'s `"check"` line - resolved as the
   union.
4. **The dry run on the merged tree is *not* `nothing to refresh`, and that
   is correct.** Measured: `125 urls stale, 125 ready, up to 13 messages,
   125 presses (press budget 50)` of 1092. That is CI's first backlog, not a
   lost state.
5. **The CI job is live the moment `main` has it.** `previews.yml` now has a
   four-hourly `schedule:`, so the owner's merge push both fires the first
   `workflow_run` run and arms the cron.
6. **Pushing and merging into `main` are the owner's** (`CLAUDE.md`). B6 ended
   with four local commits and no push; the owner's merge push is what turns
   the CI job on (`plan.md` section 3.10 - the first real run is automatic).

**B6 is shipped. The next action is O3, the owner's** - see "Next batch".
Nothing else is in flight in this worktree.

## Status
- Task status: **in_progress - B6 shipped 2026-09-16 (four commits, both
  gates green, nothing pushed). Waiting on O3, the owner's merge into `main`
  and first-run watch (`plan.md` section 9, steps I-J).**
- Last agent: **implementer (2026-09-16, B6).** No Telegram contact of any
  kind; every `run.mjs` invocation carried `--dry-run`; `.env` not read;
  `state.json` committed byte-for-byte and never edited.
- NEEDS_HUMAN_CONFIRMATION: **no.** Two things the owner should know, neither
  a decision: the first real CI run fires automatically on the merge push,
  and its first backlog is 125 URLs because `main`'s content changed after
  the local reindex.
- Branch: `automation/tg-preview-refresh`, worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`. **Not pushed.**
- Base / starting commit for the next batch: the `ci(tg-preview)` commit at
  the tip of this branch (`git log -1`), on top of `origin/main` `1106355`.
- Working tree after B6: **clean** (`git status --porcelain` empty).

## Completed

### B6 - onto `main`, and the fail-safe CI job

- **Status: shipped 2026-09-16.** Four commits, in the order section 10c
  requires, on top of `4a042c7`:

  | # | sha | what |
  |---|---|---|
  | 1 | `97e0209` | `docs(tg-preview): pass 6 - CI fail-safety, the merge, and the committed state` - the three task files, gate-exempt |
  | 2 | `3f6231c` | `Merge remote-tracking branch 'origin/main'` - **`origin/main` = `1106355`**, not the `5a36c4a` the plan named |
  | 3 | `54b84b3` | `chore(tg-preview): record the first full reindex` - `tools/tg-preview/state.json` alone, 1069 insertions |
  | 4 | `f5e5d69` | `ci(tg-preview): make the previews job fail-safe and schedule it` - the workflow, the two folded-in fixes, the atomic `--result` write, the dry-run summary line, the runbook, and this file |

  A fifth, docs-only commit on this gate-exempt file records commit 4's own
  sha, the way `4a042c7` recorded B5's - section 10c could not name a sha
  that did not exist when its commit was written.

- **`origin/main` had moved** two commits past the plan's `5a36c4a`, to
  `1106355 docs(config-audit): record B3 completion, gates, and the pending
  closeout` (via `7cc259d feat(hooks): deny RTK-bypassing readers, warn past
  the task-state budget`). Step 3's re-measurement was therefore run:
  `git merge-tree 8b96ff4 HEAD origin/main` reported the same five
  `changed in both` files and **exactly one** conflict hunk, still
  `package.json`'s `"check"` line. Resolved as the union the plan specifies
  (`node --check tools/check-site.mjs` after `typecheck`, `node --test
  tools/tg-preview/lib.test.mjs` before `npm run test`, `"previews"` kept).
  The real merge produced that one conflict and nothing else.
- **The four auto-merged files were read and left as git produced them:**
  `tools/tg-preview` appears once in each README's layout table, the
  `lib.test.mjs` paragraph in `docs/specs/COVERAGE.md` is intact and
  unduplicated, `docs/specs/META.md` section 7 is intact. No fix needed.
- **No `npm ci`**: `git diff --cached --stat -- package-lock.json .nvmrc` was
  empty after the merge.
- **`state.json` is byte-identical to the owner's file.**
  `git hash-object` = `7c6e37ebec07ef8482f8208c1da2e4b7ca0441de` before
  staging and after the commit (`git rev-parse HEAD:tools/tg-preview/state.json`
  returns the same). Structural read:
  `1 https://artex-x.github.io/daggerheart-loot/ 1062
  2026-09-14T20:04:16.406Z true`. No `state.json.tmp` sibling at any point;
  `git diff --cached --name-only` named one file and never `.env`.
- **The post-merge backlog, recorded, not fixed:**
  `125 urls stale, 125 ready, up to 13 messages, 125 presses (press budget
  50)`, with `buildFromTree()` reporting **1092 urls, 0 missing**. Inside the
  plan's predicted 125-135 of 1092. All 125 are `ready`, so `main`'s tip was
  already deployed. The same count came back on the final tree.
  Pre-merge the same command read `nothing to refresh`.
- **The manifest still builds through `main`'s changed
  `tools/build-share-pages.js`** - the issue-47 seam in `manifest.mjs` holds;
  the fallback in section 10c was not needed.
- **Code changes, exactly the four the batch allows:** the `--mode full`
  warning moved above the dry-run branch in `lib.mjs` (so
  `--dry-run --mode full` now prints it first - verified live); its test
  assertion tightened to `press budget of 2` and one new case added (a dry
  run under `--mode full` logs the warning with a client factory that throws
  if loaded); `writeResult` made atomic (tmp + `renameSync`); a dry-run job
  summary line in `run.mjs` behind `GITHUB_STEP_SUMMARY`.
- **`previews.yml`:** `schedule: - cron: '23 */4 * * *'` with its why-comment;
  the job `if:` now `github.event_name != 'workflow_run' || ...`; the
  `Secrets present?` step and all four `steps.cfg.outputs.skip` conditions
  deleted (the record step is `always() && env.DRY_RUN != 'true'`); the
  argument list is a bash array; `--budget-minutes 45` -> `40`; `node` wrapped
  in `timeout --kill-after=30s 50m` with the `code=0; ... || code=$?` capture
  and the `case` mapping `124`/`137` to a notice, a summary line and green.
  No `continue-on-error`, no new input, no kill switch, no exit-code change.
- **`docs/tg-preview.md`:** the A-G "already done" paragraph, H marked done,
  I replaced by section 9's six-point first-run procedure, J replaced
  (pause/stop/rotate, plus GitHub's 60-day rule), "What CI does after a
  deploy" gained the schedule, the three clocks and the red-means list, and
  the Operations bullets now say a missing secret is red, a 50-minute wall is
  green, and a CI dry run writes its counts to the job summary. The
  `notice|skip|45|secrets are not|exits 0` sweep leaves no sentence
  describing the skip guard, the 45-minute budget or "exits 0 with a notice".

### Pass 6 (planner, 2026-09-16) - the five questions answered

- **Q1 - merge ordering.** Its own committed boundary, after the pass-6
  docs commit and before the code. Merge, not rebase (eleven shas are cited
  across the task docs). One textual conflict, measured: `package.json`'s
  `"check"` line, resolved as the union (`main`'s
  `node --check tools/check-site.mjs` after `typecheck`, ours
  `node --test tools/tg-preview/lib.test.mjs` before `npm run test`). The
  other four shared files auto-merge; the implementer reads the merged
  hunks once. The root lockfile did not change on `main`, so no `npm ci`.
  `plan.md` section 3.10.
- **Q2 - what "fail-safe" means.** **Red means the next run will not fix
  it.** Exit codes in `lib.mjs`/`run.mjs` do not change (0 for every
  Telegram-side stop, 2 dead/missing credential, 1 crash). The workflow
  wraps `node` in coreutils `timeout --kill-after=30s 50m`, captures the
  code under `bash -e` with `|| code=$?`, maps `124`/`137` to green with a
  `::notice::` and one `$GITHUB_STEP_SUMMARY` line, re-raises everything
  else. No `continue-on-error` (it would erase exit 2's red too). The
  `Secrets present?` skip guard goes: the secrets are configured, and a
  missing one is now an honest red with the variable named. `plan.md`
  section 3.5, the table.
- **Q3 - eventual consistency without a push.** `schedule: '23 */4 * * *'`.
  An idle run makes no Telegram contact (`nothing to refresh` returns before
  the live check and the client) and costs about a minute; four hours is
  four times the one measured cooldown; a 130-URL backlog drains in ~3 runs.
  The job `if:` must admit it (`github.event_name != 'workflow_run' || ...
  conclusion == 'success'`). `concurrency` unchanged. Three nested clocks:
  `--budget-minutes 40` < `timeout 50m` < `timeout-minutes: 60`, so the
  record step keeps `always()` but never depends on surviving a cancelled
  job. One forced code change: the `--result` write becomes atomic, because
  a `KILL` can now land mid-write. `plan.md` section 3.5.
- **Q4 - the finished `state.json`.** Its own commit, after the merge and
  before the code, message `chore(tg-preview): record the first full
  reindex`, staged by path. Verified before staging by hash
  (`7c6e37eb...`), a header/count read that prints no entry, no `.tmp`
  sibling, one file in `--cached --stat`. The post-merge stale count is
  recorded, not "fixed". The tree key already includes untracked files, so
  the commit needs no check of its own. `plan.md` section 3.10.
- **Q5 - what can be verified before `main`.** Locally: Prettier parses the
  YAML inside `npm run check` (`.prettierignore` does not exclude
  `.github/`; no `actionlint`/PyYAML/`yaml` on this host); `bash -n` per
  `run:` block; the `timeout` exit mapping by hand; the moved warning by
  test; the manifest and backlog by dry run; the state by hash. Only
  `main` proves the triggers, the input defaults per event, the secrets,
  the push and the summary rendering. The first-run procedure is
  `plan.md` section 9, steps I and J, and the first real run is automatic
  on the merge push - the dry-run window is while `check` runs. `plan.md`
  sections 3.10 and 9.
- **Folded in:** R1 deferred item 5 (`$LIMIT` quoting - a bash array), B4
  review nit 3 (the `--mode full` warning moves above the dry-run branch)
  and nit 5 (the `includes('2')` assertion, same line). Also the dry-run
  summary line in `run.mjs`, because step I tells the owner to read a
  summary that is empty today.
- **Files written:** `issues/tg-preview-refresh/plan.md` (pass-6 revision:
  revision history, 3.5 revised, new 3.10, section 4's tree, section 6
  revised, section 7's pass-6 paragraph, section 8 re-confirmed on the
  merged tree, section 9 H-J revised, the batch list with O2 done and B6/O3
  added, new section 10c, sections 11-13), `handoff.md` (this file),
  `context.md` (one appended block of measured facts).
- **Commits:** none by the planner. The implementer commits the pass-6 task
  docs first, on their own (section 10c, commit 1).

### B5 - say what the photo counter actually measures

- **Status: shipped.** Docs commit `df76f13`; batch commit `9694782`
  (`fix(tg-preview): name the photo counter after what it measures`); the
  handoff/gate record at `4a042c7`. Four photo buckets
  (`newId`/`sameId`/`none`/`unseen`), `pressed P` as attempts, the same
  vocabulary through `run.mjs` and `docs/tg-preview.md`. 83/83
  `lib.test.mjs`; `npm run check` green (vitest 947/947). Full spec in
  `plan.md` section 10b; the exact gate lines are in that commit's handoff
  and are not repeated here.

### B4 - bound presses per run and stop on @WebpageBot's attempt throttle

- **Status: shipped, reviewed, remediated.** `359e0d4` and `0f33aa2`.
  `PRESS_LIMIT = 50`, `botThrottle()`, `--press-limit`, the run-scoped press
  budget, the throttle checks, the `--mode full` warning. 82/82 then.

### O2 - the owner's local reindex

- **Status: done, 2026-09-14.** `state.json` complete at 1062; `nothing to
  refresh` on the tree it was written against (`4a042c7`, measured by the
  orchestrator 2026-09-16). Per-chunk numbers were not captured in this
  directory (Deferred).

### Earlier

B1 (`cce10cb`), R1 (`5a959ca`), R2 (`a4c9066`), B3 (`2a4b78b`), O1 - see
`plan.md` section 10 and the git log.

## Verification
- **Pass 6 (planner)** - no gates run; no production code touched. Read-only
  measurements, all recorded in `context.md` "Added by the planner, pass 6":
  - `git merge-tree 8b96ff4 HEAD origin/main` -> 5 `changed in both`,
    **1** conflict hunk (`package.json`, `"check"`).
  - `git diff --stat HEAD...origin/main -- data.js og i index.html
    tools/build-share-pages.js` -> 157 files: 30 new records with new
    `og/*.jpg`, `f1`-`f94` and `index.html` with a changed
    `og:description`, `tools/build-share-pages.js` with a provenance prefix
    for frame and `starting` records. `package-lock.json`, `.nvmrc`,
    `tools/derived.js` unchanged; `tests/derived.js` changed on `main` only.
  - `git hash-object tools/tg-preview/state.json` ->
    `7c6e37ebec07ef8482f8208c1da2e4b7ca0441de`; header read -> `1
    https://artex-x.github.io/daggerheart-loot/ 1062
    2026-09-14T20:04:16.406Z true`; no `state.json.tmp`.
  - `timeout 1s sleep 5` -> exit 124 in Git Bash; `python -c "import yaml"`
    fails; no `actionlint`; no `yaml`/`js-yaml` in `node_modules/`;
    `format:check` is `prettier --check .` and `.prettierignore` does not
    list `.github/`.
  - `.claude/hooks/tree-key.mjs` fingerprints with `git add -A` into a
    throwaway index (untracked files included); `bash-guard.mjs` `isExempt`
    covers `issues/**` and non-README `.md`.
- **B6 (implementer, 2026-09-16) - commands run and their real results:**
  - `git fetch origin main`; `git log --oneline -1 origin/main` ->
    **`1106355`** (moved past the plan's `5a36c4a`).
  - `git merge-tree 8b96ff4 HEAD origin/main` -> 5 `changed in both`,
    `grep -c "^+<<<<<<<"` = **1**, the hunk being `package.json`'s `"check"`.
  - `git merge --no-edit origin/main` -> `CONFLICT (content): Merge conflict
    in package.json` and nothing else; resolved, `git add package.json`, no
    remaining `UU`/`AA` entries.
  - `git diff --cached --stat -- package-lock.json .nvmrc` -> empty, so no
    `npm ci`.
  - `node --test tools/tg-preview/lib.test.mjs` on the merged tree ->
    **83 pass, 0 fail**.
  - `node tools/tg-preview/run.mjs --dry-run` on the merged tree ->
    `125 urls stale, 125 ready, up to 13 messages, 125 presses (press budget
    50)`, exit 0, nothing written.
  - `node -e` over `buildFromTree()` -> **`1092 0`** (urls, missing).
  - **Check #1** (merged tree, before the merge commit), one foreground call,
    `set -o pipefail; npm run check 2>&1 | tail -n 120`, Bash timeout 600000
    -> **green**: `node --test` 83/83, vitest **42 files / 1035 tests
    passed**, coverage 96.61 / 88.58 / 97.1 / 97.34. No flake, no re-run
    needed. `npm run data` inside it left no unstaged drift in `i/`,
    `data.json` or `catalog.csv` (`git status --porcelain` showed only the
    staged merge plus the untracked `state.json`).
  - `git hash-object tools/tg-preview/state.json` ->
    `7c6e37ebec07ef8482f8208c1da2e4b7ca0441de` before staging;
    `git rev-parse HEAD:tools/tg-preview/state.json` -> the same after the
    commit. `git diff --cached --stat` named one file, 1069 insertions.
  - `npx prettier --write` then `--check .github/workflows/previews.yml` ->
    `All files formatted correctly` (this is the local YAML parse; there is
    no actionlint/PyYAML/`yaml` on this host).
  - Both `run:` blocks copied to the scratchpad and `bash -n`'d -> clean.
  - The exit mapping exercised by hand in Git Bash under `bash -e`:
    `timeout --kill-after=30s 1s sleep 5` -> code **124**, mapped to a notice
    and **step exit 0**; a child exiting 2 -> re-raised, **step exit 2**; the
    `[ ... ] && args+=(...)` lines do **not** abort under `-e` and the array
    expands to `--mode full --budget-minutes 40 --dry-run --limit 7` with the
    inputs set. Bare `timeout 1s sleep 5` -> 124.
  - `node --test tools/tg-preview/lib.test.mjs` after the code ->
    **84 pass, 0 fail**.
  - `node tools/tg-preview/run.mjs --dry-run` on the final tree -> the same
    `125 urls stale, ...` line, exit 0, `state.json` untouched.
  - `node tools/tg-preview/run.mjs --dry-run --mode full` -> the
    `--mode full cannot finish 1092 stale url(s) with a press budget of 50`
    warning **before** the counts line.
  - **Check #2** (final tree), same single foreground form -> **green**:
    `node --test` 84/84, vitest **42 files / 1035 tests passed**, identical
    coverage numbers.
  - `git status --porcelain` after commit 4 -> empty.
- **Not run, and why - re-confirmed on the merged tree, not assumed:**
  `npm run check:built`, parity and the new `golden` job are **not required**.
  B6's own edits are `.github/workflows/previews.yml`, three
  `tools/tg-preview/*.mjs`, `docs/tg-preview.md`, `package.json`'s `"check"`
  line and `state.json` - none of them is loaded by the app, reaches `dist/`,
  or changes what any screen draws (`app/**`, `data.js`, `styles`, `i/`,
  `og/` are untouched by this batch). `main`'s own changes ride in through
  the merge already gated on `main`, and get `check:built`/`golden` again on
  the owner's merge push.

## Next action (the owner's, not an agent's)

- **Name: O3 - merge into `main` and watch the first run.** Full text:
  `plan.md` section 9, steps I and J; the same words are in
  `docs/tg-preview.md` so the owner needs no task directory.
- **Why it cannot be an agent's:** pushing and merging into `main` are the
  owner's (`CLAUDE.md`), and merging is also the only way to exercise
  `workflow_run`, `schedule`, the input defaults per event, the secrets, the
  `[skip ci]` push and the summary rendering - none of it reachable from a
  branch (`plan.md` section 3.10, "What can be verified before the owner
  merges").
- **What happens, in order:** the merge push runs `check`, `deploy`
  publishes, and `previews` fires on `workflow_run` **by itself**; while
  `check` is still running the owner can dispatch a dry run and read
  `dry run: N url(s) stale ...` in its job summary - expect **125**; the
  automatic run then does one chunk (50 presses) and stops green with a
  `[skip ci]` state commit by `github-actions[bot]`; the four-hourly schedule
  drains the rest in about three runs.
- **The one spot-check worth doing:** paste
  `https://artex-x.github.io/daggerheart-loot/i/f1.html` into Saved Messages
  after a run confirms it - the description should now start with
  `Прочее · Сеттинги · Пир зверей.` Old text on a URL the run recorded as
  refreshed would mean a press-only phase-1 recovery does **not** refresh
  metadata; report it (the fallback is `RECOVER_SCAN = 0`).
- **What the owner's report feeds:** B2. `phase 1: pressed N` with `N > 0`,
  the `pressed P (photo id ...)` lines from clean CI runs, any throttle `N`,
  and step F.4's regression result are the numbers that would move
  `PRESS_LIMIT`, the cron cadence, or section 3.9's closed question. Do not
  start B2 speculatively.

## Blockers
- **None.** B6 shipped with both gates green; no owner decision is pending;
  the secrets exist; the worktree was quiet throughout (`ListAgents` before
  the merge: one idle peer in the main checkout, no writer here).
- **Merging into `main` is the owner's**, and it is also the only way to
  exercise `workflow_run`/`schedule`; nothing before that can prove them.
  That is O3, not a blocker on any agent's work.

## Deferred
- **B4 review nits still open:** 1 (`attempt()` transport retries can
  re-invoke `cx.press` inside one budget decrement - absorbed by the
  under-shoot), 4 (`incoming` applies `limit` before `!m.out`, ~185 not
  200), 6 (`m.url === null` strict; unreachable through `plain()`). Nits 2
  (B5), 3 and 5 (B6) are **done**.
- **Reviewer's remaining R1 items:** 6 (unused `urls()` export), 7
  (`--apply`'s needless `buildFromTree()`). Item 5 landed in B6.
- **A `press_limit` workflow input**, or deriving `--limit` from the press
  budget - when CI's `pressed P` lines justify moving the default.
- **A connect retry around `client()`** - only if transient connect
  failures produce red runs more than rarely.
- **O2's per-chunk numbers** - not captured here; if the owner still has
  the terminal output, B2 wants `pressed P` per run, any throttle `N`, F.4's
  regression result and G.7's one-press answer.
- **A persisted press ledger**, **an evidence class per URL (schema v2)**,
  **`photo.date` as a pre-press skip**, **tuning `PRESS_LIMIT`'s default** -
  unchanged from pass 5, all B2 and all wanting numbers first.
- One pointer line in `CLAUDE.md` and
  `.claude/prompts/refresh-artwork.prompt.md` - orchestrator's call.
- Issue 47 cut-over checklist: `page()` stays `require()`-able on `main`
  today (measured); if the stub generator ever moves into the Vite build,
  `manifest.mjs`'s two `require()`s move with it.
- Other messengers: not this task.

## Notes
- Mocks path: none (tooling and CI; no UI).
- Screenshot findings: none.
- **What changed in the model of the problem this pass, in one paragraph:**
  the local reindex is finished, so the tool's remaining job is to keep
  Telegram current after each deploy without anyone watching. That turns
  "did the run finish?" into the wrong question and "will the next run pick
  it up?" into the right one - which is what the owner said in their own
  words. So the workflow stops treating the wall clock as a failure, stops
  waiting for a push to retry, and stops skipping quietly when a secret is
  missing; the only reds left are the ones a human must act on. The state
  file the owner produced is the thing that makes CI incremental, and
  `main`'s own content changes since it was written are the first backlog
  the design gets to prove itself on - **125 URLs** as measured on the merged
  tree, three runs, half a day.
- **The measurement that would sharpen this next** is the first automatic
  run's log: `phase 1: pressed N` with `N > 0` means the local reindex's old
  button messages for now-stale frame URLs were pressed without a send, and
  the pasted `i/f1.html` description then tells whether a press-only
  recovery refreshes metadata (the phase-1 assumption, `plan.md` section
  3.4). It is the one place the design could still be wrong in a way that
  writes a false entry, and the check costs one paste.
- Cleanup performed / retained artifacts: the implementer's scratchpad holds
  a read-only `merge-tree.txt` and three throwaway shell files used for
  `bash -n` and the `timeout` proof, all outside the repository; nothing was
  left in the tree (`git status --porcelain` empty). `.env` was not read.
  `tools/tg-preview/state.json` was committed unchanged and never edited,
  regenerated or deleted; no `state.json.tmp` was created.
- **Deviations from `plan.md` section 10c, both recorded above:** (1)
  `origin/main` had moved to `1106355`, so step 3's re-measurement path was
  taken - the conflict was still exactly one, still `package.json`'s
  `"check"` line, so the resolution is the one the plan specifies; (2) the
  acceptance criterion `grep -c "budget-minutes 40"` reads **2**, not 1,
  because the comment block the plan dictates verbatim also names
  `--budget-minutes 40`. Everything else matched the plan as written.
- Session end partial progress: none - B6 is complete and committed;
  `plan.md`, `handoff.md` and `context.md` are consistent with each other and
  with the tree at the branch tip.
