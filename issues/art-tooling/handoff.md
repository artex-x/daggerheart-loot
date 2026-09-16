# Handoff - TASK art-tooling
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress
- Last agent: implementer (B1)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `tooling/art-refresh` in worktree
  `E:/dev/daggerheart-loot-wt/tg-preview-refresh`
- Base / starting commit: `e2ada3f` (tree clean at dispatch, orchestrator-
  verified). `origin/main` moved during this batch: re-read at commit time it
  was `2ce3b08` / `80809c8` / `e2ada3f` - the two new commits are the peer
  session's hook fix for the Linux `check` failure named in the dispatch
  (`.claude/hooks/selftest.mjs` #126-128). Not adopted, not touched, per the
  dispatch's instruction; this branch was not rebased onto them.

## Completed
- Batch name/id: B1 - machine-readable stale list (`plan.md` section 5.1)
- What shipped:
  - `tools/tg-preview/lib.mjs`: `--stale-list` in `FLAGS`/defaults; a
    post-loop `parseArgs` check that it requires `--dry-run`; an
    `emitStaleList(urls, notLiveUrls)` helper beside `baseResult()`, called
    from both dry-run-reachable exits (`todo.length === 0` and the `dryRun`
    branch) with sorted `stale`/`notLive` arrays and no timestamp.
  - `tools/tg-preview/run.mjs`: a `writeStaleList` dep, wired only when
    `opts.staleListPath` is set, using the same tmp-then-rename atomic write
    as `writeResult`.
  - `tools/tg-preview/lib.test.mjs`: 8 new cases (3 `parseArgs` flag-order
    cases, 1 `applyResult` no-op-payload case, 4 `runRefresh` cases for
    emit-once/`--only`/empty/non-dry-run), plus `baseDeps`'s `staleLists`
    plumbing.
  - `docs/tg-preview.md`: one bullet in "Operations" after `--no-verify`,
    naming the flag, its `--dry-run` requirement, the payload keys, and its
    purpose.
  - `docs/specs/COVERAGE.md`: extended the `tools/tg-preview/lib.test.mjs`
    paragraph with the stale-list writer's coverage.
  - Planning docs from the dispatch: `issues/art-tooling/{context,plan,
    handoff}.md` (committed first, per the dispatch's stated pattern).
- Files changed: `tools/tg-preview/lib.mjs`, `tools/tg-preview/lib.test.mjs`,
  `tools/tg-preview/run.mjs`, `docs/tg-preview.md`,
  `docs/specs/COVERAGE.md`, plus the three `issues/art-tooling/*.md` files.
- Commit(s):
  - `fde756c` - `docs(art-tooling): record planning pass for the
    artwork-tooling task` (the three issue docs, gate-exempt)
  - `977b8a7` - `feat(tg-preview): add --stale-list, a machine-readable
    dry-run stale set` (the B1 code + docs)
- Deviations and rationale: none from section 5.1's steps. Confirmed against
  the actual file list that `npm run check:built` is not required: no batch
  file touches `app/`, `data.js`, `img/`, `og/`, `i/` or `dist/`.

## Verification
- Commands run (exact), in order:
  - `node --test tools/tg-preview/lib.test.mjs` -> `tests 104`, `pass 104`,
    `fail 0` (96 existing + 8 new, matching the plan's acceptance criterion).
  - `node tools/tg-preview/run.mjs --dry-run --no-verify --stale-list
    <scratchpad>/stale-b1.json` -> logged `143 urls stale, 143 ready, ...`;
    the written file's `stale.length` is `143` (checked by parsing the JSON),
    matching the logged count exactly. `notLive.length` is `0`.
  - Ran the same command again to `<scratchpad>/stale-b1-run2.json`; `diff`
    against the first file reports the files identical - byte-identical
    repeat runs confirmed.
  - `git diff --stat tools/tg-preview/lib.mjs` / full diff, inspected: every
    hunk is in `FLAGS`, the `parseArgs` defaults/validation, the
    `runRefresh` deps destructure, or the two dry-run-reachable exits -
    nothing else changed, and no reformatting occurred (`tools/` stayed
    untouched by prettier/eslint, which don't run over it anyway).
  - `git status --porcelain tools/tg-preview/state.json` -> empty; the file
    is unchanged and was never staged.
  - Checked for a live peer run before the heavy gate: `tasklist | grep -i
    chrome.exe` -> none; no other project-specific heavy process found.
  - One foreground call: `set -o pipefail; npm run check 2>&1 | tail -n
    120` (Bash `timeout: 600000`) -> ran `format:check`, `lint`,
    `typecheck`, `node --check tools/check-site.mjs`, `npm run data`,
    `tests/derived.js`, `tests/i18n.js`, `.claude/hooks/selftest.mjs`,
    `node --test tools/tg-preview/lib.test.mjs` (104/104), then `npm run
    test` (vitest): `Test Files 42 passed (42)`, `Tests 1035 passed (1035)`,
    coverage summary printed with no threshold failures. The call completed
    with no error signalled by the tool (contrast: a later unrelated `grep`
    pipe in this session was rejected by the RTK hook and did surface an
    "Exit code 1" annotation, so the check call's silence is meaningful).
    This is the Windows worktree the dispatch says the hook issue does not
    reproduce on; consistent with that, nothing here touched
    `.claude/hooks/**`.
- Results: acceptance criteria in `plan.md` section 5.1 all met - test
  count, logged-count match, byte-identical repeat runs, confined `lib.mjs`
  diff, untouched `state.json`, both docs updated, no dependency added to
  any `package.json`.
- Gates: `node --test tools/tg-preview/lib.test.mjs` green (104/104); one
  foreground `npm run check` green. `npm run check:built` was not run - not
  required, confirmed above.

## Next batch

- **Name:** B2 - `tools/art-refresh/` (the mapping/convert/install/verify
  tool)
- **Status:** outline only, in `plan.md` section 5.2 - **not yet
  implement-ready**. Per this repo's protocol, report status and this next
  batch, then wait for confirmation before expanding it or starting it.
- **Objective:** one tested tool performing everything `art-to-fix`
  re-derived from prose: inventory, mapping, conversion, atomic install,
  byte verification, and the preview-staleness proof - the last of which
  consumes the `--stale-list` file format B1 just landed.
- **Outline location:** `plan.md` section 5.2 has the settled `lib.mjs` /
  `run.mjs` API surface, file list, and acceptance criteria; it needs
  expansion to step-by-step form (as section 5.1 had) before an implementer
  starts it.

## Blockers
- None on B1, which is complete. B2 needs its outline expanded to
  implement-ready detail (planner work) before an implementer starts it -
  see `plan.md` section 5.2 and the "Next batch" note above.

## Deferred
- B2 - `tools/art-refresh/`: outline and settled API surface in `plan.md`
  section 5.2. Expand to implement-ready detail now that B1 has landed.
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
  `issues/art-tooling/` and the code B1 shipped. The two `stale-b1*.json`
  proof files live only in the session scratchpad, never in the repository.
- Session end partial progress (if any): none - B1 is complete and committed
  at a coherent boundary (`fde756c`, `977b8a7`).
- The one fact most likely to be re-derived by a later session, so it is here
  as well as in `context.md`: `tools/**` is outside the vitest coverage
  thresholds (`vite.config.mts` has `root: 'app'`, `coverage.include: src/**`),
  outside `eslint .` (`eslint.config.mjs` ignores `tools/**`) and outside
  `prettier --check` (`.prettierignore` lists `tools/`). The house obligation
  for a new `tools/` file is a `node --test` suite wired into
  `npm run check` and a paragraph in `docs/specs/COVERAGE.md`, not a coverage
  percentage.
