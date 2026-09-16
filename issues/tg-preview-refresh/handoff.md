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
| Base | `8b96ff4`; the branch is 11 commits ahead of it and **101 behind `origin/main`** (`5a36c4a` at planning time) |
| Commits | `cce10cb` -> `5a959ca` -> `a4c9066` -> `0ab04eb` -> `2a4b78b` -> `5b2a68e` -> `359e0d4` -> `0f33aa2` -> `df76f13` -> `9694782` -> `4a042c7` |

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
   `7c6e37ebec07ef8482f8208c1da2e4b7ca0441de`, still untracked. B6 commits
   it **by path, byte-for-byte**. It is never edited, regenerated,
   reformatted or deleted; never `git add -A`.
3. **The merge onto `origin/main` has exactly one conflict**, `package.json`'s
   `"check"` line, measured with the read-only three-argument
   `git merge-tree` (git 2.33 has no `--write-tree`). Re-measure if
   `origin/main` has moved past `5a36c4a`.
4. **After the merge the dry run is *not* `nothing to refresh`, and that is
   correct.** `main` changed `og:description` on the 94 frame stubs and the
   root and added 30 records since the state was written; expect ~125-135
   stale of 1092. That is CI's first backlog, not a lost state.
5. **`npm run check` on the merged tree is a new measurement** - it now
   carries issue 47's cut-over. One foreground call, timeout 600000; the
   `searchPage.test.ts` timeout is the known load flake, re-run once.
6. **Pushing and merging into `main` are the owner's** (`CLAUDE.md`). B6 ends
   with four local commits and no push; the owner's merge push is what turns
   the CI job on (`plan.md` section 3.10 - the first real run is automatic).

**O2 is done; pass 6 has planned B6**, the next code batch - see "Next
batch". Nothing else is in flight in this worktree.

## Status
- Task status: **in_progress - B5 shipped, O2 (the owner's local reindex)
  complete 2026-09-14, pass 6 planned; B6 is implement-ready and not
  started.**
- Last agent: **planner (2026-09-16, pass 6).** No production code touched;
  no Telegram contact; `.env` not read; `state.json` not edited (one
  structural `node -e` read of its header and count, and one
  `git hash-object`, both recorded in `context.md`).
- NEEDS_HUMAN_CONFIRMATION: **no.** Every pass-6 fork has a repository- or
  evidence-picked winner (`plan.md` section 11). Two things the owner should
  know, neither a decision: the first real CI run fires automatically on the
  merge push, and its first backlog is ~130 URLs because `main`'s content
  changed after the local reindex.
- Branch: `automation/tg-preview-refresh`, worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`.
- Base / starting commit for the next batch: **`4a042c7`** (`git log -1` to
  confirm). `origin/main` was `5a36c4a` at planning time; **fetch and
  re-read it** before merging.
- Working tree at the time of writing: `M issues/tg-preview-refresh/context.md`
  (the orchestrator's new section plus the planner's appended facts), the
  planner's rewrites of `plan.md` and this file, and the owner's untracked
  `tools/tg-preview/state.json`. Nothing else.

## Completed

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
- **Gates for B6:** `npm run check` **twice** (after the merge, before the
  merge commit; after the code, before its commit), each
  `set -o pipefail; npm run check 2>&1 | tail -n 120` with Bash timeout
  600000; `node --test tools/tg-preview/lib.test.mjs` (83 -> 84);
  `node tools/tg-preview/run.mjs --dry-run` (count recorded, expected
  non-zero after the merge); `npx prettier --check
  .github/workflows/previews.yml`. Not `check:built`, not parity, not
  golden - re-confirmed on the merged tree in `plan.md` section 8: B6's own
  edits touch nothing a screen draws; `main`'s already-gated changes ride in
  with the merge and get their `check:built`/golden on the owner's merge
  push.

## Next batch (implement-ready)

- **Name: B6 - onto `main`, and the fail-safe CI job.** Full text:
  `plan.md` section 10c. Read sections 3.5 and 3.10 first; they are the
  reasoning this batch executes. Four commits, in order, two gated checks.
- **Objective:** merge `origin/main` (one conflict), commit the owner's
  finished `state.json` unchanged, and make `previews.yml` red only when the
  next run cannot fix it: a `timeout 50m` around `node` mapped to green, a
  four-hourly `schedule:`, the secrets skip guard removed, `--budget-minutes
  40`, a bash-array argument list. Two local fixes ride along (the `--mode
  full` warning visible on a dry run; its test assertion tightened) plus an
  atomic `--result` write and a dry-run summary line in `run.mjs`.
- **In scope:** `.github/workflows/previews.yml`;
  `tools/tg-preview/{lib,lib.test,run}.mjs`; `tools/tg-preview/state.json`
  (staged only); `docs/tg-preview.md`; `package.json` (the resolved line);
  the merge's own changes; `issues/tg-preview-refresh/{context,plan,handoff}.md`.
- **Out of scope:** `client.mjs`, `live.mjs`, `manifest.mjs`, `login.mjs`,
  `tools/tg-preview/package*.json`, `ci.yml`, `docs/specs/**` and `README*`
  beyond the merge, `CLAUDE.md`, every public contract, anything under
  `app/**`, `data.js`, `i/`, `og/`, `tests/**`. No new input, no kill
  switch, no `continue-on-error`, no exit-code change.
- **Files expected:** the eight named above plus the merge.
- **Steps:** `plan.md` section 10c, steps 1-22. In brief: (1-2) commit the
  pass-6 docs; (3-10) fetch, `git merge --no-edit origin/main`, resolve
  `package.json` to the union line, read the four auto-merged hunks, dry
  run (expect ~125-135 stale of 1092 - record it), **check #1**, merge
  commit; (11-15) verify the state file by hash, header and `--cached
  --stat`, commit it alone; (16-22) move the warning, tighten and add the
  tests, the two `run.mjs` changes, the workflow per section 6, Prettier +
  `bash -n` + the `timeout` mapping proof, the runbook edits, **check #2**,
  commit `ci(tg-preview): make the previews job fail-safe and schedule it`.
- **Acceptance criteria:** `plan.md` section 10c, verbatim. Load-bearing:
  `git log --oneline -5` shows the four commits in order over `4a042c7`;
  `git rev-parse HEAD:tools/tg-preview/state.json` is `7c6e37eb...`; the
  state commit names one file; `previews.yml` has one `cron:`, no `Secrets
  present`, no `continue-on-error`, `budget-minutes 40`, `timeout
  --kill-after=30s 50m`, the `event_name != 'workflow_run'` condition, and
  passes `prettier --check`; 84 tests pass including the dry-run warning
  case; the post-merge and final dry-run counts match and are recorded;
  both checks green; `git status --porcelain` empty; `.env` never staged.
- **Verification commands:**
  ```text
  node --test tools/tg-preview/lib.test.mjs
  node tools/tg-preview/run.mjs --dry-run
  node tools/tg-preview/run.mjs --dry-run --mode full
  git hash-object tools/tg-preview/state.json
  npx prettier --check .github/workflows/previews.yml
  code=0; timeout 1s sleep 5 || code=$?; echo "$code"        # 124
  set -o pipefail; npm run check 2>&1 | tail -n 120          # Bash timeout 600000; twice
  git status --porcelain
  ```
- **Risks / do-nots:** never run `run.mjs` without `--dry-run`; never read
  `.env`; never edit, regenerate, format or delete `state.json` (hash
  mismatch = stop); no rebase, no squash, state file in its own commit; do
  not "fix" the post-merge stale count; no `continue-on-error`, input, kill
  switch, connect retry or shorter cron; no exit-code change; no `npm ci`
  unless the merged lockfile changed; a check failure in a file this task
  never touched is `main`'s tree meeting this host - record it, do not
  patch `app/**`/`tests/**`, stop before the merge commit.
- **Fallback:** if the dry run cannot build the manifest on the merged tree
  (`page` no longer `require()`-able), `git merge --abort` after step 8 and
  report - `manifest.mjs`'s issue-47 seam is a planning decision.

**After B6:** O3 - the owner merges into `main`, dispatches a dry run while
`check` runs, reads the automatic run's summary and the `[skip ci]` state
commit, leaves the schedule to drain the backlog, and pastes one `f<n>` link
to read the new description prefix (`plan.md` section 9, steps I-J). Their
report is B2's input. Do not start B2 speculatively.

## Blockers
- **None for B6.** No owner decision is pending; the secrets exist; the
  worktree is quiet (no peer writer at planning time - re-check with
  `ListAgents` before the merge).
- **Merging into `main` is the owner's**, and it is also the only way to
  exercise `workflow_run`/`schedule`; nothing before that can prove them.

## Deferred
- **B4 review nits still open:** 1 (`attempt()` transport retries can
  re-invoke `cx.press` inside one budget decrement - absorbed by the
  under-shoot), 4 (`incoming` applies `limit` before `!m.out`, ~185 not
  200), 6 (`m.url === null` strict; unreachable through `plain()`). Nits 2
  (B5), 3 and 5 (B6) are done or in flight.
- **Reviewer's remaining R1 items:** 6 (unused `urls()` export), 7
  (`--apply`'s needless `buildFromTree()`). Item 5 folds into B6.
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
  the design gets to prove itself on - about 130 URLs, three runs, half a
  day.
- **The measurement that would sharpen this next** is the first automatic
  run's log: `phase 1: pressed N` with `N > 0` means the local reindex's old
  button messages for now-stale frame URLs were pressed without a send, and
  the pasted `i/f1.html` description then tells whether a press-only
  recovery refreshes metadata (the phase-1 assumption, `plan.md` section
  3.4). It is the one place the design could still be wrong in a way that
  writes a false entry, and the check costs one paste.
- Cleanup performed / retained artifacts: a read-only `merge-tree.txt` in
  the planner's scratchpad (outside the repository); nothing in the tree.
  `.env` was not read. `tools/tg-preview/state.json` was not edited, staged
  or deleted.
- Session end partial progress: none - pass 6 is a complete planning pass;
  `plan.md`, `handoff.md` and `context.md` are consistent with each other
  and with the tree at `4a042c7`.
