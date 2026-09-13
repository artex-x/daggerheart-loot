# Handoff - TASK tg-preview-refresh

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/tg-preview-refresh/context.md` (in full - start with "The owner's
question about `photo changed`", which carries everything pass 5 was given
and everything pass 5 measured), then `plan.md` (its "Revision history"
block first - there are now **five** passes), then this file.

## Start here - a session that has none of this in context

**This work is not in the main checkout.** It lives in a worktree the owner
authorised on 2026-09-11:

| | |
|---|---|
| Worktree | `E:/dev/daggerheart-loot-wt/tg-preview-refresh` |
| Branch | `automation/tg-preview-refresh` |
| Base | `8b96ff4`, the main checkout's local HEAD at the time |
| Commits | `cce10cb` -> `5a959ca` -> `a4c9066` -> `0ab04eb` -> `2a4b78b` -> `5b2a68e` -> `359e0d4` -> `0f33aa2` |

The task-directory copies **in that worktree** are authoritative. The copy
under `E:/dev/daggerheart-loot` is a stale snapshot - do not read it as
current.

Establish state before acting; do not assume this file is the newest thing
that happened:

```
git log --oneline -5
git status --porcelain
```

Six facts a fresh session will not infer, in descending order of how much
damage getting them wrong does:

1. **`.env` in this worktree holds a live Telegram user session.**
   **No agent runs `run.mjs` without `--dry-run`, ever.** `@WebpageBot` has
   its own attempt quota, one run of 115 presses spent it and earned a
   ~54-minute lockout, and the owner needs every attempt for a 1062-URL
   reindex. Do not read, print or copy `.env`; `bash-guard` denies it and
   that is correct.
2. **The owner's reindex is IN FLIGHT in this worktree, and
   `tools/tg-preview/state.json` is their live data.** It was retired and
   restarted cold per `context.md` decision 7, and as of 2026-09-13 it holds
   **195 of 1062** URLs, untracked. **Do not read, edit, stage, commit or
   delete it.** Stage by path; never `git add -A`. A peer interactive
   session (`tg-preview-refresh-59`) is the owner's, running the chunks; it
   is not a stray agent to clean up.
3. **`npm run check` contends with that reindex over git, not over content.**
   `npm run check` runs `npm run data`, which regenerates `i/*.html` and
   `data.json` to byte-identical output, so a chunk mid-flight is not
   corrupted by it. The index is the shared resource: ask before gating and
   committing if a chunk may be running.
4. **`origin/main` moves under this branch.** Merge onto the current
   `origin/main`, not onto the base this branch was cut from. Re-read
   `git log --oneline -3 origin/main` rather than trusting a sha in a doc.
5. **Pushing and merging are the owner's** (`CLAUDE.md`). Merging should
   still wait for issue 47's B7 to land in the main checkout.
6. **Parity is confirmed not required** for this task, and an
   `app/src/components/searchPage.test.ts` timeout in `npm run check` is a
   known load flake on this host - this task touches nothing under `app/**`.
   Re-run it once; do not diagnose it as a regression.

**B4 is done. Pass 5 has planned B5**, the next code batch - see "Next
batch". The owner's own O2 (the reindex) continues in parallel and is not
blocked by it.

## Status
- Task status: **in_progress - B4 shipped; pass 5 planned; B5 is
  implement-ready. O2 (the owner's reindex) is in flight at 195/1062.**
- Last agent: **planner (2026-09-13, pass 5).** No production code written.
  Files written: `issues/tg-preview-refresh/{plan,handoff,context}.md`. No
  Telegram contact; `.env` not read; `tools/tg-preview/state.json` not read,
  edited or staged. One read-only `curl -sI` against the public site
  (`og/_share.jpg`, `og/w76.jpg`, `og/cc19.jpg`) for the `Last-Modified` /
  `ETag` measurement now in `context.md`.
- NEEDS_HUMAN_CONFIRMATION: **no.** Pass 4's one question is closed - the
  owner retired the untrustworthy state and restarted (`context.md`
  decision 7), and the restart is in flight. Pass 5 raises none: B5
  invalidates no recorded URL and needs no pause, restart or re-press. See
  `plan.md` section 11.
- Branch: `automation/tg-preview-refresh`, worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`.
- Base / starting commit for B5: **`0f33aa2`** (`git log -1` to confirm; HEAD
  can move under this file).
- Working tree at the time of writing: clean apart from the owner's
  untracked `tools/tg-preview/state.json` and this pass's own edits to the
  task directory (`context.md` was already modified by the orchestrator;
  pass 5 appended a "do not re-measure" block to it).

## Completed

### Pass 5 (planner, 2026-09-13) - the two questions answered

- **Q1: is `photo changed` telling the truth, and is its name honest?**
  Verdict: **arithmetically true, dishonestly named.** It is a photo-**id**
  delta, and three unrelated mechanisms set it - genuinely different bytes,
  Telegram's re-encode minting a new id for identical bytes, and a
  `WebPagePending` match whose `photoBefore` is `null` (a code-level fact,
  `matchButtons` does not filter on `pending`). So `changed` means "the
  press did something observable", never "the picture differs". The counter
  drives nothing; only the vocabulary is wrong. Outcome: **B5** renames it,
  adds the `unseen` bucket the classifier currently mislabels as `same`,
  makes `pressed P` count attempts, and says once in `docs/tg-preview.md`
  what a new id does and does not prove. `plan.md` section 3.4, "What the
  photo counter measures".
- **Q2: should the tool acquire a pre-press staleness test?** Verdict:
  **no.** The tool already has one - `stale()` over the content fingerprint
  - and it is exact; what it cannot do is help a **first** reindex, which
  starts from an empty state by construction. Every candidate that could
  see image staleness during a first reindex fails in the forbidden
  direction: a false "already current" leaves a URL stale *and* records it
  as refreshed, which is the lie passes 3 and 4 removed, made permanent and
  silent. Rejections and the measurement behind each are in `plan.md`
  section 3.9. The saving is unmeasured and probably near zero; `plan.md`
  section 9 step G.7 is a **one-press, no-code** experiment that would
  settle it, and it is optional.
- Files written: `issues/tg-preview-refresh/plan.md` (pass-5 revision:
  revision history, 3.4's new subsection, new 3.9, section 7's pass-5
  paragraph, section 8 re-confirmed, section 9's revised G.5 and new G.7,
  the batch list, new section 10b, section 11 closed, sections 12 and 13),
  `handoff.md` (this file), `context.md` (one appended block of measured
  facts so they are not re-derived).
- Commits: none by the planner. Pass 5's files are committed by whoever
  commits B5, or by the orchestrator, staged by path.

### B4 - bound presses per run and stop on @WebpageBot's attempt throttle

- **Status: shipped, reviewed, remediated.** Commits `359e0d4` (the batch)
  and `0f33aa2` (the one docs blocker from its review: step F's expected
  outcome for the state-retirement restart).
- What shipped: `PRESS_LIMIT = 50`; `botThrottle()`; `--press-limit`; a
  run-scoped press budget spanning both phases; the pre-send and
  button-wait-round throttle checks; the `--mode full` warning; and the docs
  and specs those name. 82/82 `lib.test.mjs` cases. `npm run check` green.
- Review verdict: no code defect - `lib.mjs` implements section 3.4's
  confirmation rule correctly and asymmetrically. Six nits recorded under
  Deferred; pass 5 promotes **nit 2** into B5 (it is the same sentence being
  made honest) and leaves the rest.

## Verification
- **Pass 5 (planner)** - no gates run; no production code touched. The two
  measurements it made, both read-only and both recorded in `context.md`:
  - `curl -sI https://artex-x.github.io/daggerheart-loot/og/{_share,w76,cc19}.jpg`
    - all three return the identical `last-modified: Sun, 13 Sep 2026
    08:36:03 GMT` and an `etag` of `"<deploy-stamp>-<content-length>"`. The
    origin exposes no per-file publication time.
  - `grep` over the installed teleproto 1.229.0's
    `tl/generated/api.d.ts` - `Api.Photo` carries `date: int` (line 3072)
    and `Api.WebPage` carries `title`, `description`, `hash` and `photo`.
    None of them is read by `client.mjs`'s `plain()` today, and B5 does not
    start reading them.
- **B4**, for the record: `node --test tools/tg-preview/lib.test.mjs` -
  `tests 82, pass 82, fail 0`; `node tools/tg-preview/run.mjs --dry-run` -
  `1062 urls stale, 1062 ready, up to 107 messages, 1062 presses (press
  budget 50)`, exit 0; `--dry-run --press-limit ten` - threw, non-zero;
  `set -o pipefail; npm run check 2>&1 | tail -n 120` - green on the second
  run (first hit the known `searchPage.test.ts` load flake), vitest 947/947.
- Gates for B5: `npm run check` (one foreground call) plus `node --test
  tools/tg-preview/lib.test.mjs`. Not `check:built`, not parity - confirmed,
  not assumed (`plan.md` section 8).

## Next batch (implement-ready)

- **Name: B5 - say what the photo counter actually measures.** Full text:
  `plan.md` section 10b. Read `plan.md` section 3.4's "What the photo counter
  measures" and section 3.9 first; they are the reasoning this batch
  executes, and section 3.9 is specifically the instruction **not** to add a
  pre-press test.
- **Objective:** make the run's telemetry say what it measures, so a correct
  run stops reading like a broken one. **No behaviour change** - the
  confirmation rule, the press budget, the throttle rule, the state schema
  and every exit code are untouched.
- **In scope:** `tools/tg-preview/lib.mjs`, `tools/tg-preview/lib.test.mjs`,
  `tools/tg-preview/run.mjs`, `docs/tg-preview.md`,
  `issues/tg-preview-refresh/{context,plan,handoff}.md` (stage `context.md`
  as the planner left it).
- **Out of scope:** `tools/tg-preview/client.mjs` (deliberately - no new TL
  field is read), `manifest.mjs`, `live.mjs`, `login.mjs`, `package*.json`,
  `.github/workflows/**`, `docs/specs/META.md` and `docs/specs/COVERAGE.md`
  (`plan.md` section 7 says why neither moves), `README*`, `CLAUDE.md`,
  every public contract, and anything under `app/src/**`, `data.js`, `i/`,
  `og/`, `tests/parity/**`.
- **Files expected:** the six above.
- **Steps:** `plan.md` section 10b, steps 1-8, in order. In brief:
  1. `pressGroup`'s classifier gains four buckets - `unseen` (byIds did not
     return the pressed message), `none` (no photo), `newId`, `sameId` -
     with confirmation unchanged in effect (`p.answered || delta ===
     'newId'`).
  2. The same rename in `baseResult()`, the local counter, `photoTotals` and
     `addPhoto`.
  3. `pressedCount` becomes **attempts**, derived from the run-scoped
     `pressBudget` delta across the group, so a throttle-refused press is
     counted (B4 review nit 2).
  4. The phase-1 and per-batch log lines print
     `(photo id new N, same N, none N, unseen N)`.
  5. `run.mjs`'s summary and `$GITHUB_STEP_SUMMARY` line likewise.
  6. Tests: carry the rename through the three shape assertions and one
     title; add the `unseen` case and the throttle-counted-as-an-attempt
     case.
  7. `docs/tg-preview.md`: the vocabulary, one paragraph on what a new photo
     id does and does not prove, `unseen` named once, step G.5 replaced and
     step G.7 added from `plan.md` section 9, and the
     `BOT_RESPONSE_TIMEOUT` sentence reworded.
  8. Gates, stage by path, commit `fix(tg-preview): name the photo counter
     after what it measures`.
- **Acceptance criteria:** `plan.md` section 10b, verbatim. The load-bearing
  ones: no test asserts a different `confirmed` set than before the batch;
  a throttle-refused press is in `result.pressed` and in no `writeState`
  call; `unseen` confirms nothing on an unanswered press and un-confirms
  nothing on an answered one; `grep -n "changed" tools/tg-preview/lib.mjs
  tools/tg-preview/run.mjs` finds no counter, key or log word; `git status`
  shows `tools/tg-preview/state.json` untracked, unmodified and unstaged.
- **Verification commands:**
  ```text
  node --test tools/tg-preview/lib.test.mjs
  node tools/tg-preview/run.mjs --dry-run
  set -o pipefail; npm run check 2>&1 | tail -n 120        # Bash timeout 600000
  git status --porcelain
  ```
- **Risks / do-nots:** never run `run.mjs` without `--dry-run`; do not read,
  edit, stage, commit or delete `tools/tg-preview/state.json`; do not change
  the confirmation rule while renaming it, and do not let `unseen` become a
  confirmation; do not make `matchButtons` skip a `WebPagePending` message
  (that is *why* `photoBefore` is often null, and pressing a pending webpage
  is exactly right); do not add a pre-press test, a threshold, an image
  decoder or a new TL field (`plan.md` section 3.9); do not touch
  `client.mjs`, `previews.yml` or the specs; never `git add -A`.
- **Fallback:** none needed. If the rename turns out to touch more test
  assertions than `plan.md` section 10b step 6 predicts, carry them through
  mechanically and record the count in the handoff - the shape change is
  additive (one extra key) and behaviour-neutral by construction.

**After B5:** nothing implement-ready follows. B2 (tuning from the first
real run) stays an outline until O2 produces evidence - F.1's counts,
whether 50 presses complete cleanly, any throttle `N`, F.4's already-posted
regression result, the per-chunk photo ratios, and now G.7's one-press
result. Do not start B2 speculatively.

## Blockers
- **None.** B5 is implement-ready and needs no owner decision.
- **One coordination point, not a blocker:** the owner's reindex runs in
  this worktree. Before B5's `npm run check` and commit, confirm no chunk is
  in flight (see "Start here" fact 3). Nothing in B5 invalidates the 195
  recorded URLs; the owner can pick the new code up at any chunk boundary or
  not at all.
- Merging this branch into `main` still waits for issue 47's B7 to land in
  the main checkout (orchestrator's ordering, unchanged).

## Deferred
- **B4 review nits, minus the one B5 takes.** Nit 2 (a throttled press is
  excluded from `pressed P`) is **in B5**. Still deferred:
  1. `attempt()`'s transport retries can re-invoke `cx.press` inside one
     budget decrement, so attempts can undercount by up to 3 per press under
     network failure. Absorbed by the default under-shoot (50 vs an observed
     115). B2.
  3. The `--mode full` warning sits after `client()`, so
     `--dry-run --mode full` - the invocation "Operations" recommends -
     never shows it. A real papercut, a different subject from B5. B2.
  4. `client.mjs`'s `incoming` applies `limit` before filtering `!m.out`, so
     the effective recovery window is ~185 incoming, not 200.
  5. The `--mode full` warning test asserts `l.includes('2')`, which a
     longer message could satisfy incidentally.
  6. `matchButtons` uses `m.url === null` strictly, so a `url: undefined`
     message would be dropped from `summary`. Cannot occur through
     `plain()`, which coerces to `null`.
- **Reviewer's remaining R1 items** (`plan.md` section 13) - still B2:
  5 (`$LIMIT`/`$args` quoting in `previews.yml`), 6 (unused `urls()`
  export), 7 (`--apply`'s needless `buildFromTree()` call).
- **`photo.date` as a pre-press skip**, if a per-image publication time ever
  exists. The TL field is there; the origin's is not (measured - see
  Verification). Revisit at issue 47's cut-over. `plan.md` section 3.9.
- **A persisted press ledger** so a run refuses to start inside a cooldown
  the bot named. Needs a schema change and a model of a window measured
  once. B2.
- **An evidence class per URL in the state** (schema v2, `answered` /
  `photo-changed`) so a future ambiguous set can be named and re-verified
  instead of the whole file being retired. Narrowed by pass 5: it is **not**
  a staleness test, and if a re-download always mints a new id it
  degenerates to "always confirmed". `plan.md` sections 3.9 and 13.
- **Tune `PRESS_LIMIT`'s default** from O2's numbers, and consider deriving
  `--limit` from it so the two flags cannot be paired wrongly.
- One pointer line in `CLAUDE.md` and
  `.claude/prompts/refresh-artwork.prompt.md` - orchestrator's call.
- Issue 47 cut-over checklist: keep `page()` importable or repoint
  `manifest.mjs`; decide whether `og/` stays a source asset.
- Other messengers: not this task.

## Notes
- Mocks path: none (tooling and CI; no UI).
- Screenshot findings: none.
- **What changed in the model of the problem this pass, in one paragraph:**
  the tool's photo counter was being read as a picture delta and is a
  file-**id** delta, set by three different things - new bytes, Telegram's
  re-encode of identical bytes, and a webpage that had no photo yet when the
  button was matched. That makes `changed 10, same 0` on every batch the
  expected shape rather than a symptom, and it makes any photo-id-based
  "was this press needed?" test impossible in principle. The laziness the
  owner asked for already exists, as the fingerprint comparison in
  `stale()`; it simply cannot apply to a first reindex, which by
  construction has no record of what Telegram holds. So pass 5 buys nothing
  new and spends its effort on making the run legible - and on writing down,
  with the measurement behind each, why the four tempting alternatives do
  not pay.
- **The one measurement that would sharpen all of this** is `plan.md`
  section 9 step G.7: one press on a URL this reindex already confirmed and
  whose bytes have not changed since. `new` means a re-download always mints
  a new id; `same` means the 195/195 the owner is reading is literal. One
  press, no code, optional, and the answer is B2's input either way.
- Cleanup performed / retained artifacts: none. `.env` was not read.
  `tools/tg-preview/state.json` was not read, edited, staged or deleted at
  any point in this pass.
- Session end partial progress: none - pass 5 is a complete planning pass;
  `plan.md`, `handoff.md` and `context.md` are consistent with each other.
