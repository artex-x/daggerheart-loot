# Handoff - TASK 59

## Status
- Task status: done
- Last agent: reviewer
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `7a66309785385ab888571bd16009da45f529c080`

## Completed
- Batch name/id: B3 - Reconcile structural goldens and gate Pages.
- What shipped: `deploy.needs` now requires `golden`; a fail-closed
  `tests/derived.js` assertion verifies the isolated top-level inline list;
  `docs/specs/COVERAGE.md` records ownership; and runner-generated structural
  goldens now match the approved frame-roll output.
- Files changed: `.github/workflows/ci.yml`, `tests/derived.js`,
  `docs/specs/COVERAGE.md`, task state, and these runner-produced snapshots:
  `_search_a_row_ticked.txt`, `_search_kind_off.txt`, `_search_searched.txt`,
  `_search_stat_line.txt`, `_tables_eq_armor.txt`, `_tables_eq_secondary.txt`,
  `_tables_eq_secondary_filter_link.txt`, `_tables_eq_secondary_searched.txt`,
  `_tables_eq_weapon.txt`, `_tables_eq_weapon_filtered.txt`,
  `_tables_eq_weapon_panel_open.txt`, `_tables_frames.txt`, and
  `_tables_frames_two_frames.txt`.
- Commit(s): terminal amended B3 commit, `ci: gate Pages on structural goldens`.
- Deviations and rationale: The mandated Bash pipe wrapper for `npm run check`
  could not create a Bash instance on this Windows host (`E_ACCESSDENIED`), so
  the approved direct `rtk npm run check` foreground fallback was used. No
  product/data/parity/contracts/generated-source change, snapshot hand edit,
  or push occurred.

## Verification
- Commands run (exact): `rtk npm run build`; `rtk node
  tests/app/golden.js --shard=1/4 --update` through `--shard=4/4`, separately
  and in order; full `git diff -- tests/app/snapshots` review; `rtk node
  tests/app/golden.js --shard=1/4` through `--shard=4/4`, separately and in
  order; `rtk node tests/derived.js`; `rtk npm run check`; `rtk npm run
  check:built`; `rtk git diff --check`.
- Results: The single initial build made no tracked production/generated diff.
  All four updater shards and all four comparison shards exited cleanly. The
  focused derived guard, `npm run check`, `check:built` folder smoke, and the
  120 kB gzip budget passed; `git diff --check` passed. The complete snapshot
  diff is confined to frame-bearing equipment/frame/search states: removed
  frame ordinal prefixes and deterministic rule-A retained-row/hash fallout,
  with no changed role, control, heading, route, count, or unrelated label.
- Gates: repository gates passed; terminal reviewer verdict: approved, with no
  blockers. This docs-only remediation is additionally checked by Markdown
  inspection and `git diff --check` before amendment.

## Next batch (implement-ready)
- Name: Post-push CI verification (authorized only after push approval).
- Objective: Confirm the new Actions graph waits for the four passing golden
  shards before Pages deploys.
- In scope: one newly pushed B3 Actions run and its job graph.
- Out of scope: manufacturing a failing main-branch run or changing code.
- Files expected: none.
- Steps: After explicit push authorization, push the amended commit, then
  inspect one resulting Actions run for passing golden shards and deploy
  depending on `golden`.
- Acceptance criteria: all golden shards pass and deploy waits on `golden`.
- Verification commands: authorized `git push`; one Actions run inspection.
- Risks / do-nots: do not push, force-push, or manufacture a red main run
  without separate authorization.
- Fallback (optional): report a failed or missing dependency graph; do not
  bypass it locally.

## Blockers
- None for the completed local batch. Push and CI inspection require separate
  authorization.

## Deferred
- Reviewer nit: `app/src/lib/data.ts` still calls all embedded equipment
  roll-table members; correct that wording in a later production-code batch.

## Notes
- Mocks path: none; no UI or layout change.
- Screenshot findings: no screenshot was required; captured Actions facts in
  `context.md` were sufficient.
- Cleanup performed / retained artifacts: preserved unrelated untracked
  `.claude/settings.local.json` and `issues/tg-preview-refresh/`.
- Session end partial progress (if any): no process remains; local B3 is done,
  with only the separately authorized post-push verification available.
