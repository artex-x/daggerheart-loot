# Handoff - TASK persist-1-auth
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (`B1.1` implemented, review pending)
- Last agent: implementer (`B1.1`)
- NEEDS_HUMAN_CONFIRMATION: no - but one `B1.1` acceptance line waits on
  the human's own instruction (Blockers).
- Branch: `claude/kind-curie-nxag95` (cloud session 3; the release branch,
  supersedes `claude/jolly-allen-ipojqp`)
- Base / starting commit: `76497c4` (`main`); plan commit `dedafaf`
- Pushed: yes - one commit per batch under question A; see `git log`

## Completed
- Batch name/id: `B1.1` - fake cloud and test build (layer 2)
- What shipped: `e1d7a4b` cherry-picked as its own commit (author and
  message kept) before any R1 edit; then `AuthPort`/`CloudPort` in
  `ports/types.ts`, `Env.cloud` (null in `browserEnv`/`fakeEnv`); the fake
  cloud, its seed (`gm1`, `gm2`) and `cloud.contract.ts` with its vitest run;
  `vite build --mode test` -> `dist-test/` (`build:test`), `main.ts` loading
  the fake behind `VITE_CLOUD_FAKE`; `tools/no-fake-in-prod.mjs` in
  `check:built` and CI `check`; `tests/app/serve.js` (server and stale-build
  guard) with `lib.js` on `dist-test/` and `smoke-http.mjs` on `dist/`;
  driver `open(route, { as })`, golden `# as:` header and naming test,
  states case 35; CI `browser` on the test build; ignores and `edit-guard`
  for `dist-test/` with selftest `#34a`; `COVERAGE.md` "Test layers";
  `.claude/README.md` "Cloud sessions" (session 2 results, measured table,
  proxy quirk, secrets, branch rule, owner step (e)); orchestrate cost-table
  row; both READMEs; `docs/DECISIONS.md` entries for questions A and C,
  superseding (folded) the two 2026-09-24 entries.
- Files changed: see `git show --stat HEAD`.
- Previous sha (batch diff base): `3b5e4d6` (the `e1d7a4b` cherry-pick;
  `dedafaf` is the plan commit before it)
- Deviations and rationale:
  - `main.ts` registers the worker and requests storage before the cloud is
    chosen, and mounts with `{ ...env, cloud }`; `browserEnv()` takes no
    argument (plan step 2 had `browserEnv(cloud)`). Root cause: with the
    plan's snippet the test build linked the manifest after `load` (probe:
    manifest link absent at `load` on `dist-test/` 4/4, present on `dist/`
    4/4, CPU throttled x20), and states case 28 failed under the pooled run
    with `manifest-location-changed`. After the change the link is present
    at `load` on both builds and case 28 passes pooled.
  - `tools/capture-share-fixture.mjs` also served `dist/` through `lib.js`;
    it now uses `serve.js` over `dist/` like `smoke-http.mjs` (not in the
    plan's file list; `lib.js` no longer serves `dist/`).
  - `tests/run-all.js` labels say `dist-test/:`, its header names the test
    build, and its summary columns are wider (labels ran together).
  - `app/states` prints "all 34 cases passed": the count is runs (4 and 5
    share one), so thirty-five numbered cases; the plan's "35 cases passed"
    counted cases.
  - `CLAUDE.md` is not edited (Blockers).
- Review: required (trigger: harness, hook edit, CI) - verdict pending.

## Verification
- Commands run (exact), this host, 2026-09-24, one foreground call each:
  - `rtk npm run check` - PASS, 130 s (vitest 47 files, 1384 tests;
    selftest 646 passed; `fake-cloud.ts`, `cloud.contract.ts` over the
    ports bar, `fake-cloud-seed.ts` 100%)
  - `rtk npm run check:built` - PASS, 8 s (both builds, smoke on `dist/`,
    budget 100.8 kB, marker guard: `dist/` none, `dist-test/`
    `fake-cloud-*.js`)
  - `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub`
    - PASS, 346 s (first run before the `main.ts` fix: case 28 FAIL
    `manifest-location-changed`; `app/states` alone then passed, 135 s)
  - `node tests/app/golden.js --shard=1/4` .. `--shard=4/4` - each
    "structural snapshots (dist-test/): unchanged", 136 s, 139 s, 136 s,
    132 s (38+38+37+37 states); `tests/app/snapshots/` untouched
- Marker probe: a scratch copy of `tools/no-fake-in-prod.mjs`, `dist/assets`
  and `dist-test/assets` with the marker renamed (`sed
  s/dhloot-fake-cloud/dhloot-fake-cl0ud/`) in `dist-test/` exits 1 "carries
  no ... was the marker renamed?"; the fake chunk copied into the scratch
  `dist/assets` exits 1 "dist/ carries the fake cloud".
- Gates: all green; CI runs at this push.

## Next batch (implement-ready)
- Name: `B1.2` - needs planner refresh (`plan.md` section 7 outline; the
  mockups are its planner's).

## Blockers
- Question A's `CLAUDE.md` "Source and commit conventions" last bullet is
  not written: an edit to `CLAUDE.md` needs the human's own instruction,
  not an agent's dispatch. Text ready in `plan.md` section 4A ("A cloud
  session pushes its branch after every green commit ..."). Until then the
  bullet still reads "one push ... fast-forwards `main`", which
  `.claude/README.md` and `docs/DECISIONS.md` now supersede.

## Deferred
- Optional `session-stop.mjs` cloud warning ("N commits on this branch are
  not on `origin/<branch>`") - question A, not in `B1.1`.
- Header comments in `tests/app/contracts.js`, `print.js`, `sweep.js`,
  `typo.js` and `COVERAGE.md`'s per-suite rows still say `dist/` where the
  suites now drive `dist-test/`; only result lines changed (plan scope).
- To `B1.2`: the fake's `linkError` option; `AppState.user`.
- To closeout: roadmap compaction (section 15 step 20, section 18 conflict
  3 and verdict table, decision 25); removal of the `E2E_USER_PASSWORD`
  secret after `B1.3`.
- Carried from R0 and placed: `plan.md` section 9.

## Notes
- Mocks path: none (`B1.1` has no UI).
- Screenshot findings: none.
- Cleanup performed / retained artifacts: `dist-test/` is gitignored build
  output; scratch probes lived in the session scratchpad.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section):
  `docs/specs/COVERAGE.md` "Test layers"; `.claude/README.md` "Cloud
  sessions"; `docs/DECISIONS.md` 2026-09-24 entries for questions A and C;
  `.claude/prompts/orchestrate.prompt.md` cost table.
