# Handoff - TASK untrack-stubs
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: **done** - B1 shipped; awaiting human review before closeout
- Last agent: implementer
- NEEDS_HUMAN_CONFIRMATION: **no**
- Branch: `main`
- Base / starting commit: `d5e3e5a`

## Completed
- Batch name/id: **B1 - Untrack the generated stub pages**
- What shipped: `i/` (1091 generated share stubs) is removed from the git
  index but left on disk, ignored going forward, and every doc/spec claim that
  it is committed is corrected. No production code, test, fixture, or public
  contract value changed.
- Files changed:
  - `.gitignore` - added an `i/` entry, after the `dist/`/`coverage/`/
    `.svelte-kit/` block, with a why-comment naming the generator, the deploy
    build step, the edit-guard hook, and why `data.json`/`catalog.csv` stay
    tracked.
  - git index - `git rm -r --cached i` (1091 deletions staged; working tree
    verified to still hold 1091 files before and after).
  - `docs/specs/CONTRACTS.md` - section 5 only. The old sentence "Those four
    are committed and published as they are" is split: `img/`, `og/`, `card/`
    stay in one committed-and-published sentence; `i/<id>.html` moves into the
    same clause that already covers the entry document and `assets/` - "what
    the build emits ... and the deploy job publishes them from the build
    rather than from a committed file." Section 4 is untouched (confirmed by
    `git diff -- docs/specs/CONTRACTS.md`: only lines in section 5 changed).
  - `README.md` - the `i/*.html` file-map line gained "generated, not
    committed"; the "Derived files" section gained a paragraph: `i/` is not in
    the repository, run `node tools/build.js` (or any `npm run check`) once
    after cloning before `node tests/run-all.js`.
  - `README.ru.md` - the same two edits, mirrored in Russian, keeping the two
    READMEs aligned per `CLAUDE.md`.
  - `docs/specs/COVERAGE.md` - one clause added to the "Five `tests/*.js`
    files" bullet (the only place that names `craft`, `dataint`, `derived` and
    `stub` together): they read `i/` off disk, `i/` is generated per
    `CONTRACTS.md` section 5, and a clean checkout needs a build first outside
    `npm run check`.
  - `.github/workflows/ci.yml` - comment-only, in the block above "Collect
    what the site is made of": `i/` is not in the repository, the Build step
    above regenerates it immediately before Collect copies it, so Collect must
    never be reordered ahead of Build. Confirmed by `git diff --
    .github/workflows/ci.yml`: five inserted comment lines, no `run:` or step
    change.
  - `issues/untrack-stubs/plan.md` - B1's heading marked **done**.
- Commit(s): one commit on `main`, this batch's files plus
  `issues/untrack-stubs/{context.md,plan.md,handoff.md}` (this task's own
  planning docs, untracked at session start per the dispatch). See
  `git log -1` on `main` for the hash; `issues/56/` and `work/` (untracked,
  foreign to this task) were left alone.
- Deviations and rationale: none. Followed `plan.md`'s B1 steps and files
  list exactly; no step needed inventing.

## Verification
- Commands run (exact), in order:
  1. `git status` / `git log -1` - confirmed base `d5e3e5a`, working tree
     matched the dispatch's described state (`?? issues/56/`,
     `?? issues/untrack-stubs/`, `?? work/`, nothing else).
  2. `git ls-files | wc -l` -> **3270** (re-measured on the actual base, per
     the plan's instruction not to trust the stale 3278/3270 history alone).
  3. All six doc/spec/config edits made first (`.gitignore`, `CONTRACTS.md`
     section 5, `README.md`, `README.ru.md`, `COVERAGE.md`, `ci.yml` comment).
  4. `git rm -r --cached i` - 1091 lines of output, all `rm 'i/...'`.
  5. `ls i | wc -l` -> **1091** (working tree intact) and
     `git status --porcelain` -> 1091 `D  i/...` lines plus the six `M` files
     and the three pre-existing `??` entries - no unintended changes.
  6. `git check-ignore -v i/w1.html` -> `.gitignore:40:i/	i/w1.html`.
  7. `git diff -- docs/specs/CONTRACTS.md` -> 3 insertions / 2 deletions,
     confined to section 5's sentence; section 4 untouched.
  8. `git diff -- .github/workflows/ci.yml` -> 5 insertions, 0 deletions, all
     comment lines (`#`), no `run:`/step change.
  9. `git ls-files | wc -l` -> **2179** (3270 - 1091, matches the plan's and
     the orchestrator's pre-verified acceptance number exactly).
  10. `git ls-files i/ | wc -l` -> **0**; `git ls-files data.json catalog.csv`
      -> both still print, unchanged.
  11. One foreground call, Bash timeout 600000:
      `set -o pipefail; npm run check 2>&1 | tail -n 120`
  12. Second foreground call: `node tests/run-all.js derived,dataint,craft,stub`
- Results:
  - `npm run check` - **green**. `format:check`, `lint`, `typecheck`,
    `node --check tools/check-site.mjs`, `npm run data` (regenerated `i/`
    fresh, 1091 files, confirming the folder is both reproducible and
    ignored), `node tests/derived.js` (byte-for-byte against the freshly
    generated stubs - passes, since nothing about `build-share-pages.js`'s
    output changed), `.claude/hooks/selftest.mjs`, the two `node --test`
    suites, and `npm run test` (vitest, 42 files / 1053 tests passed,
    coverage 96.61% statements / 88.6% branches / 97.11% functions / 97.34%
    lines - all consumers of `data.json` are unaffected since it stayed
    tracked).
  - `node tests/run-all.js derived,dataint,craft,stub` - **green**, all four
    suites `ok` (dataint 0.5s, derived 0.5s, craft 0.2s, stub 3.2s), confirming
    the four suites plan.md flagged as `i/`-off-disk readers still pass
    post-untrack.
  - Post-checks: `ls i | wc -l` still **1091**; `git status` clean apart from
    the batch's own staged/modified files and the three untouched `??`
    entries.
  - `npm run check:built` - **not run**, per the plan: nothing in this batch
    changes what a screen draws, and `vite.config.mts`'s `noscriptData()` copy
    is untouched because `data.json`/`catalog.csv` stay tracked.
- Gates: `npm run check` (green), `node tests/run-all.js
  derived,dataint,craft,stub` (green). `npm run check:built` deliberately
  skipped per plan.md's "Verification commands" for B1.

## Next batch
None planned. B1 was the plan's only batch. The human said they will decide
on review before closeout; do not run `/handoff` closeout for this task.

## Blockers
None.

## Deferred
- **`data.json` and `catalog.csv` stay tracked.** Unchanged by this batch.
  Reopen only on one of the three triggers in `plan.md`, "Deferred": the seven
  `app/src/lib/*.test.ts` suites stop reading `data.json` off disk;
  `data.json` stops being one line; or its packed history cost grows past a
  few MB (433 KB as of session 2's measurement).
- `tests/run-all.js` auto-building a missing `i/` when a suite needs it - the
  B1 fallback in `plan.md`, not implemented since the README line plus
  `npm run check` already cover the documented gates.
- `docs/specs/COVERAGE.md`'s wider staleness (the "twenty" legacy suites,
  `index.html`, the deleted parity harness) - out of this batch's scope,
  belongs to issue 47's backlog per `plan.md`.
- `.github/workflows/ci.yml`'s `deploy` header comment still describes the
  pre-R0c revert model for `index.html`/`style.css`/`app.js` - same owner,
  issue 47.

## Notes
- Mocks path: none - no UI in this task.
- Screenshot findings: none.
- Cleanup performed / retained artifacts: nothing written outside
  `issues/untrack-stubs/` and the repository files named above. No scratch
  files left in the repository; the `rm` output capture lived in the session
  scratchpad, not the repo.
- Session end partial progress: none. B1 is complete, gated green, and ready
  to commit/push in this same session.
