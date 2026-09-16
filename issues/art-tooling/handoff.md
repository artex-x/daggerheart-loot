# Handoff - TASK art-tooling
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `art/to-fix-refresh` in worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`
- Base / starting commit: `e2ada3f` (tree clean at dispatch). Re-read
  `git log --oneline -3 origin/main` before committing: a peer session and a
  CI bot both push there. At planning time `origin/main` was
  `e2ada3f` / `c3b2b88` / `7672f50`.

## Completed
- Batch name/id: planning pass (no implementation batch has run)
- What shipped: `issues/art-tooling/context.md` and
  `issues/art-tooling/plan.md`, plus this file. No production code.
- Files changed: `issues/art-tooling/{context,plan,handoff}.md` only
- Commit(s): none yet
- Deviations and rationale: none

## Verification
- Commands run (exact): `git log --oneline -3 origin/main`;
  `git ls-files tools/tg-preview`; `git ls-files issues/dh-image-polish`;
  `git show --stat --oneline 8e7fed1 ce0c414 37ecc8d`. Read-only throughout;
  `tools/tg-preview/run.mjs` was never invoked, with or without `--dry-run`.
- Results: the facts in `context.md`, "Measured by the planner". Nothing in
  the working tree was modified outside `issues/art-tooling/`.
- Gates: none applicable to a planning pass. For the batches below the gates
  are `node --test` on the touched tool suite plus one foreground
  `npm run check`; **`npm run check:built` is not required by any batch** -
  nothing in this task alters what a screen draws.

## Next batch (implement-ready)

- **Name:** B1 - Machine-readable stale list in `tools/tg-preview/`
- **Objective:** `node tools/tg-preview/run.mjs --dry-run --stale-list <path>`
  writes the exact stale stub-URL set as sorted JSON, so proving which
  previews a change invalidated becomes a diff of two files instead of a
  scratch program.
- **In scope:** `parseArgs`; stale-list emission on `runRefresh`'s two
  dry-run-reachable exits; the `run.mjs` writer; eight tests; two
  documentation edits.
- **Out of scope:** the live send path, `--apply`, `state.json`,
  `previews.yml`, and anything under `tools/art-refresh/` (B2 creates it).
- **Files expected:** `tools/tg-preview/lib.mjs`,
  `tools/tg-preview/lib.test.mjs`, `tools/tg-preview/run.mjs`,
  `docs/tg-preview.md`, `docs/specs/COVERAGE.md`.
- **Steps:** `plan.md` section 5.1, steps 1-8. They are written to be followed
  literally; the two load-bearing subtleties are that `parseArgs` validates
  `--stale-list` *after* the argv loop (so flag order does not matter), and
  that the emission happens at **both** the `todo.length === 0` early return
  and the `if (dryRun)` branch (so an empty stale list is written rather than
  being ambiguous by absence).
- **Acceptance criteria:** `plan.md` section 5.1, "Acceptance criteria" - the
  test count, the logged-count match, byte-identical repeat runs, a `lib.mjs`
  diff confined to three sites, `state.json` untouched, both docs updated, and
  no dependency added anywhere.
- **Verification commands:**
  ```text
  node --test tools/tg-preview/lib.test.mjs
  node tools/tg-preview/run.mjs --dry-run --no-verify --stale-list <scratchpad>/stale-b1.json
  set -o pipefail; npm run check 2>&1 | tail -n 120
  ```
  The check is one foreground call with the Bash tool's `timeout` at 600000
  (`.claude/README.md`, "Run a long check"). `npm run check:built` is not
  required.
- **Risks / do-nots:** never invoke `run.mjs` without `--dry-run`; write the
  stale list only into the session scratchpad, never into the repository; do
  not read or add anything touching `.env`; do not reuse `--result` for this
  payload (its shape belongs to `--apply`); do not reformat `lib.mjs`, since
  `tools/` is both prettier-ignored and eslint-ignored and a stray reformat
  produces a diff no gate asked for.
- **Fallback (optional):** if a reviewer objects to emitting from two sites,
  the single-site alternative is to drop the `todo.length === 0` early return's
  call and document that an absent file means "nothing stale". Rejected in the
  plan because absence would then be ambiguous with a failed run, but it is a
  one-line retreat if needed.

## Blockers
- None. The three owner-visible calls are decided in `plan.md` section 3 with
  their reasons; an implementer can start B1 immediately.

## Deferred
- B2 - `tools/art-refresh/`: outline and settled API surface in `plan.md`
  section 5.2. Expand to implement-ready detail when B1 lands.
- B3 - prompt slimming, runbook cross-links and the `.claude/README.md`
  record: outline in `plan.md` section 5.3. Last, because the prompt must name
  the tool's final flags.
- A `--stale-list` equivalent on the live send path: no caller.
- Any acceptance-ledger schema: no producer. `--map <file>` is the escape
  hatch instead.
- `issues/dh-image-polish/refresh_artwork.py` is deleted by **B2**, not by
  this pass, and B2's acceptance criteria carry that deletion and the
  `.claude/README.md` candidate-39 amendment as their own lines.

## Notes
- Mocks path: none. This task has no visual surface.
- Screenshot findings: none.
- Cleanup performed / retained artifacts: nothing created outside
  `issues/art-tooling/`. No scratchpad artefacts from this pass are worth
  retaining.
- Session end partial progress (if any): none - the planning pass is complete.
- The one fact most likely to be re-derived by a later session, so it is here
  as well as in `context.md`: `tools/**` is outside the vitest coverage
  thresholds (`vite.config.mts` has `root: 'app'`, `coverage.include: src/**`),
  outside `eslint .` (`eslint.config.mjs` ignores `tools/**`) and outside
  `prettier --check` (`.prettierignore` lists `tools/`). The house obligation
  for a new `tools/` file is a `node --test` suite wired into
  `npm run check` and a paragraph in `docs/specs/COVERAGE.md`, not a coverage
  percentage.
