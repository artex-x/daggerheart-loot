# Handoff - TASK art-tooling
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress
- Last agent: planner (plan revision r2 - ingest scope)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `tooling/art-refresh` in worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`
- Base / starting commit for the next batch: `db52655`, tree clean.
  `origin/main` re-read by the planner at r2: `2ce3b08` / `80809c8` /
  `e2ada3f`. The two commits ahead of the merge base are a peer session's fix
  for the Linux-only `.claude/hooks/selftest.mjs` failure. This branch was
  deliberately **not** rebased onto them and `.claude/hooks/**` is not touched
  by any batch here. A peer session and a CI bot both push to `main`; re-read
  `git log --oneline -3 origin/main` before committing.

## Completed

### B1 - machine-readable stale list (shipped)
- `tools/tg-preview/lib.mjs` / `run.mjs` / `lib.test.mjs`: `--stale-list
  <path>`, dry-run only, emitted from both dry-run-reachable exits, sorted
  `stale`/`notLive`, no `urls` key, no timestamp. `docs/tg-preview.md` and
  `docs/specs/COVERAGE.md` document it.
- Commits: `fde756c` (planning docs), `977b8a7` (B1 code + docs),
  `db52655` (B1 handoff record).
- Verified: `node --test tools/tg-preview/lib.test.mjs` -> 104/104 (96 + 8);
  a real `--dry-run --no-verify --stale-list` run wrote `stale.length === 143`
  matching the logged `143 urls stale`; a repeat run produced a byte-identical
  file; the `lib.mjs` diff is confined to `FLAGS`, `parseArgs`, the `deps`
  destructure and the two dry-run exits; `state.json` unchanged and unstaged;
  one foreground `npm run check` green (vitest 1035/1035, 42 files, no
  threshold failures). `npm run check:built` not required, confirmed against
  the file list.

### Planner pass r2 - the ingest question (this pass, no code)
- The owner asked whether the artwork tooling should serve new-item ingest as
  well as replacement. **Yes.** `plan.md` section 0 carries the revision
  history; the five decisions are settled in sections 3.4, 3.6, 3.7 and 3.8.
- Renames made now, before the directory exists and at zero cost:
  `tools/art-refresh/` -> **`tools/artwork/`**, `docs/art-refresh.md` ->
  **`docs/artwork.md`**. Agent and prompt filenames are unchanged.
- B2 and B3 are both rewritten to implement-ready form (`plan.md` 5.2, 5.3).
- Files written this pass: `issues/art-tooling/plan.md`,
  `issues/art-tooling/handoff.md`, `issues/art-tooling/context.md`.

## Verification
- Planner pass r2 ran no gates: it wrote only `issues/art-tooling/*.md`.
- Measurements taken this pass and recorded in `context.md` so nobody
  re-derives them: 1091 records all carrying `img`; 875 distinct assets; 72
  shared assets; 876 `img/*.webp` (875 used + `_none.webp`); 877 `og/*.jpg`
  (875 + `_none.jpg` + `_share.jpg`); `q24.webp` serves `q24`/`q70`/`q138`/
  `q205`, all four with `eq.line === 'q24'`. `tests/dataint.js` guards `img/`
  orphans, duplicate bytes and one-line-only sharing, and has **no `og/`
  orphan check**. `npm run check` does not run `tests/dataint.js`. `tests/`
  and `tools/` are both prettier-ignored and eslint-ignored.
- B1's gate results are above and stand.

## Next batch

- **Name:** B2 - `tools/artwork/`, the replacement path end to end
- **Status:** **implement-ready** - `plan.md` section 5.2 has the objective,
  scope, exact file list, eleven ordered steps, per-line acceptance criteria,
  verification commands, risks/do-nots and a named fallback.
- **Objective:** one tested tool performing everything `art-to-fix` re-derived
  by hand for a replacement - inventory, mapping, conversion, atomic install,
  byte verification, and the preview-staleness proof over B1's `--stale-list`
  files.
- **Shape:** a sibling npm project modelled on `tools/tg-preview/` - its own
  `package.json` + lockfile carrying `sharp`, root `package.json` gaining one
  `check` step and **no dependency**. Pure `lib.mjs` (`normalizeName`,
  `indexRecords`, `planInstall`, `affectedStubUrls`, `staleDelta`) with a
  `node --test` suite; impure `run.mjs` with the verbs `plan`, `install`,
  `verify`, `verify-previews` and the only `await import('sharp')` in the
  repository.
- **Gates:** `node --test tools/artwork/lib.test.mjs`;
  `node --test tools/tg-preview/lib.test.mjs`; one foreground
  `set -o pipefail; npm run check 2>&1 | tail -n 120` with Bash
  `timeout: 600000`. **`npm run check:built` is not required** - no file this
  batch touches alters what a screen draws.
- **Hard do-nots:** never run `install`/`verify` against the repository's own
  `img/`/`og/` (use a scratch tree); never invoke
  `tools/tg-preview/run.mjs` without `--dry-run`; do not touch
  `.claude/hooks/**`; do not edit either prompt or `tests/dataint.js` (B3);
  do not reformat anything under `tools/` or `tests/`.
- **Fallback if `sharp` will not install:** land `lib.mjs`, its suite, the
  `plan` and `verify-previews` verbs, the `check` step and every
  documentation change; defer `install`/`verify` with the exact `npm install`
  failure recorded. Do not switch toolchains.

## Blockers
- None. Nothing here needs an owner decision before an implementer starts.
  The one judgment deliberately left to a future task - whether
  `tests/dataint.js` should join `npm run check` - is recorded in `plan.md`
  section 8 with its measured cost, and B2/B3 do not depend on it.

## Deferred
- **B3** - the ingest verb (`planIngest`, the `ingest` verb with its inverted
  destination precondition), the missing `og/` orphan check in
  `tests/dataint.js` and its negative test, `docs/artwork.md`'s ingest
  section, the art edits to `add-source.prompt.md`, and the Phase 4/5
  slimming of `refresh-artwork.prompt.md`. Implement-ready in `plan.md`
  section 5.3, with an intra-batch seam named (stop after the runbook's
  ingest section; take the two prompts as B3b) if it will not close in one
  pass.
- Moving `node tests/dataint.js` into `npm run check`: `plan.md` section 8.
- A `--stale-list` equivalent on the live send path: no caller.
- Any acceptance-ledger schema: no producer; `--map`'s `assign` key is the
  escape hatch.
- `issues/dh-image-polish/refresh_artwork.py` is deleted by **B2**, whose
  acceptance criteria carry that deletion and the `.claude/README.md`
  candidate-39 amendment as their own lines.

## Notes
- Mocks path: none. This task has no visual surface.
- Screenshot findings: none.
- Cleanup performed / retained artifacts: this pass wrote only the three
  `issues/art-tooling/*.md` files. B1's `stale-b1*.json` proof files lived
  only in the session scratchpad and were never in the repository.
- Session end partial progress: none. B1 is committed at a coherent boundary;
  r2 is a documents-only pass.
- The facts most likely to be re-derived by a later session, so they are here
  as well as in `context.md`:
  - `tools/**` and `tests/**` are outside the vitest coverage thresholds
    (`vite.config.mts` has `root: 'app'`), outside `eslint .`
    (`eslint.config.mjs` ignores both) and outside `prettier --check`
    (`.prettierignore` lists both). The house obligation for a new `tools/`
    file is a `node --test` suite wired into `npm run check` plus a paragraph
    in `docs/specs/COVERAGE.md`, not a coverage percentage.
  - `npm run check` does **not** run `tests/dataint.js`. The artwork
    invariants it holds are reached only by `node tests/run-all.js dataint`,
    which is why B3 makes both prompts name that command.
  - A record may legitimately ship with `img: ''`; it renders `_none.webp`
    and `tests/noart.js` pins that path. Ingest must report it, not fail on it.
