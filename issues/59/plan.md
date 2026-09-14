# Plan - TASK 59

## Status

- Task status: done; B3 is implemented and committed, with push/CI follow-up requiring separate authorization.
- Starting commit: `7a66309785385ab888571bd16009da45f529c080` on `main`.
- NEEDS_HUMAN_CONFIRMATION: no - repository evidence settles the implementation. Push/CI verification remains a separate post-implementation authorization.

## Current state and objective

Task 59's data correction shipped in `f450082`, routing documentation followed
in `3144379`, and `7a66309` closed the task. Actions run 34852971236 exposed two
omissions: all four structural-golden shards failed because B1 refreshed only
`_i_f1.txt`, and Pages still deployed because `.github/workflows/ci.yml` omits
`golden` from `deploy.needs`.

The objective is to reconcile the committed structural snapshots with the
approved frame-roll behaviour and make a failed golden matrix block Pages.
GitHub Actions is authoritative for the cited facts in `context.md`; do not
re-fetch that run before implementation.

## Evidence and approach

- `ci.yml` defines the four-shard `golden` matrix but `deploy.needs` currently
  names only `check`, `audit`, `secrets`, and `parity`.
- `tests/app/golden.js` is the only permitted snapshot writer and supports
  disjoint `--shard=N/4` selection. `tests/app/inventory.js` owns 105 states in
  both languages and `tests/app/snapshots/` contains 105 files.
- `docs/specs/COVERAGE.md` explains rule A's positional same-shape elision.
  Removing frame number badges can therefore change which first/last row names
  and hashes remain visible in equipment/search/table snapshots.
- The `f450082` diff removed 94 frame `roll` fields but updated only the direct
  f1 record snapshot. Read-only local comparisons reproduced stale retained-row
  output in frame-bearing equipment, frames, and search states; no new app
  defect was found.
- `npm run check` already runs `tests/derived.js`. A dependency-free assertion
  there is the smallest durable guard for the deployment dependency list; its
  ownership must be added to the `derived` row in `COVERAGE.md`.

No UI, parity, route, public fixture, or contract change is involved.

## Scope and settled decisions

In scope:

- change `deploy.needs` to `[check, audit, secrets, parity, golden]`;
- add a focused, fail-closed `tests/derived.js` assertion that isolates the
  top-level deploy job, reads its inline `needs` list, and requires `golden`;
- document that assertion in `docs/specs/COVERAGE.md`;
- regenerate all four golden shards sequentially from one fresh build and keep
  only reviewed frame-roll/elision fallout;
- update task state and commit one coherent batch.

Out of scope: production/data/generated code, golden runner/inventory changes,
parity, contracts/fixtures, workflow restructuring, a YAML dependency, and the
deferred `app/src/lib/data.ts` wording nit.

Settled decisions:

1. Preserve the existing four deploy dependencies and append `golden`. Do not
   add `always()` or another condition that bypasses failed dependencies.
2. Keep the static guard inside `tests/derived.js`; it must reject a missing
   deploy block or unparseable inline needs list instead of accepting another
   mention of `golden` elsewhere in the workflow.
3. Use the golden runner only. Run local shards 1 through 4 one at a time;
   never use the unsharded updater or parallel local shards.
4. Review the full snapshot diff. Expected changes are absent frame ordinal
   prefixes/badges and deterministic rule A/rule B retained text/hash fallout.
   Changed roles, controls, headings, routes, counts, or unrelated labels are
   blockers, not baselines to bless.
5. Workflow, guard, coverage note, and reviewed snapshots form one commit.

## Batches

### B1 - Correct frame rolls and enforce pool invariants (complete)

Shipped in `f450082`.

### B2 - Publish host-aware Claude/Codex routing (complete)

Shipped in `3144379`; closeout followed in `7a66309`.

### B3 - Reconcile structural goldens and gate Pages (complete)

Objective: make the approved task-59 output the structural baseline and ensure
a future golden failure prevents deployment.

Expected files:

- `.github/workflows/ci.yml`
- `tests/derived.js`
- `docs/specs/COVERAGE.md`
- only runner-changed `tests/app/snapshots/*.txt`
- `issues/59/plan.md` and `issues/59/handoff.md`

Ordered steps:

1. Re-read task state, HEAD, and status. Preserve unrelated
   `.claude/settings.local.json` and `issues/tg-preview-refresh/`.
2. Append `golden` to the existing deploy needs list without changing the
   push/main condition, permissions, environment, or deploy steps.
3. Add the fail-closed `tests/derived.js` assertion above, with a failure
   message naming `deploy.needs`; update the `derived` coverage description.
4. Run `npm run build` once and confirm it creates no tracked production or
   generated diff.
5. Run four separate foreground updater calls, in order:
   `node tests/app/golden.js --shard=1/4 --update` through shard 4/4. Do not
   start the next shard until the previous exits.
6. Inspect `git diff -- tests/app/snapshots` in full. Stop and diagnose any
   change outside the settled frame-number/elision boundary; never hand-edit a
   snapshot.
7. Run all four shard comparisons sequentially (the same commands without
   `--update`), then `node tests/derived.js`, `npm run check`,
   `npm run check:built`, and `git diff --check`.
8. Record the exact changed snapshot inventory, diff-review conclusion, and
   check results in plan/handoff; commit the coherent B3 scope with a
   Conventional Commit as the configured author.
9. Do not push as part of implementation unless separately authorized. After
   an authorized push, inspect one new Actions run: all golden shards must pass
   and the graph must show deploy waiting on `golden`. Do not manufacture a red
   main-branch run merely to prove skip semantics.

Acceptance criteria:

- `deploy.needs` contains `check`, `audit`, `secrets`, `parity`, and `golden`,
  with no bypass condition.
- Removing `golden` from that list would fail the guard already included by
  `npm run check`, and `COVERAGE.md` records its owner.
- all 105 states have runner-produced snapshots and all four sequential compare
  shards pass against one build.
- every committed snapshot change is attributable only to the approved frame
  roll removal and deterministic elision consequences; no unrelated structural
  drift is accepted.
- `npm run check`, `npm run check:built`, and `git diff --check` pass.
- no out-of-scope or unrelated untracked path changes.
- the deferred `app/src/lib/data.ts` terminology nit remains in handoff.

Risks / do-nots:

- Update mode writes a baseline; the complete diff review and second compare
  pass are mandatory.
- Rule A may replace retained first/last siblings after a number disappears;
  judge the underlying accessible shape, not only the snapshot filename.
- Do not run heavy checks concurrently, re-fetch the cited run, hand-edit
  snapshots, or push without separate authorization.

Fallback: if the deploy block and inline needs list cannot be isolated clearly,
keep a tiny pure parser helper in `tests/derived.js`. Do not add a YAML package
or a new suite for this single invariant.

## B3 outcome

- `deploy.needs` retains `check`, `audit`, `secrets`, and `parity`, and adds
  `golden` without a bypass condition. `tests/derived.js` independently
  isolates the top-level deploy job, requires a parseable inline needs list,
  and fails if that list omits `golden`; the `derived` row in
  `docs/specs/COVERAGE.md` owns the invariant.
- One fresh `npm run build` produced no tracked production/generated drift.
  Golden updater shards 1/4 through 4/4 ran sequentially, then all four
  sequential comparison shards passed against that baseline.
- Reviewed runner-produced snapshot inventory: `_search_a_row_ticked.txt`,
  `_search_kind_off.txt`, `_search_searched.txt`, `_search_stat_line.txt`,
  `_tables_eq_armor.txt`, `_tables_eq_secondary.txt`,
  `_tables_eq_secondary_filter_link.txt`, `_tables_eq_secondary_searched.txt`,
  `_tables_eq_weapon.txt`, `_tables_eq_weapon_filtered.txt`,
  `_tables_eq_weapon_panel_open.txt`, `_tables_frames.txt`, and
  `_tables_frames_two_frames.txt`. Every change is approved frame ordinal
  removal or rule-A positional retention/hash fallout; no structural
  role/control/heading/route/count/unrelated-label drift was accepted.
- `node tests/derived.js`, `npm run check`, `npm run check:built`, and
  `git diff --check` passed. The Bash pipe wrapper was unavailable on this
  Windows host (`CreateInstance: E_ACCESSDENIED`), so the required check ran
  as the plan's direct `rtk npm run check` foreground fallback.

## Verification strategy

One build, four sequential updater calls, full diff review, four sequential
compare calls, the focused derived check, then both repository gates. Parity is
not required because B3 changes no product behaviour.

## Deferred

- Correct the stale `app/src/lib/data.ts` roll-table wording in a later
  production-code batch.
