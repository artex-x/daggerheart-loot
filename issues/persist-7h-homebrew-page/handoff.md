# Handoff - TASK persist-7h-homebrew-page
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (owner answered plan.md section 7.4 on 2026-10-03; next: the planner pass)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: R7d's closing commit (not yet made; HEAD at planning was `d82e3e1f`, R7d `B7d.1`)
- Pushed: no

## Completed
- Batch name/id: none. The planner wrote `context.md`, `plan.md` and mock m01.
- What shipped: nothing.
- Files changed: `issues/persist-7h-homebrew-page/` only.
- Previous sha (batch diff base): -
- Deviations and rationale: -
- Review: plan review not required (no trigger fired; `plan.md` Status); a
  batch review is recommended for `B7h.1`.

## Verification
- Commands run (exact): none (planning only).
- Results: the switch mock m01 renders in the Browser pane.
- Gates: none.

## Next batch (implement-ready)
- Name: `B7h.1` - the homebrew page fixes (`plan.md` section 3).
- Objective: the «?» off «Ранг» and «Урон» with rule 15's principle; the
  `#/homebrew` search from the eighth item and the counter at the head of
  the rows (rule 1); the 300-item measurement, paging only if slow; the
  «Карты» search; the «Хоумбрю» chip replaced by the switch «Свои
  предметы» on `#/search` and in the equipment tables.
- In scope: `plan.md` 2.1-2.6.
- Out of scope: anything of R7d (import, export, move, zip); a search on
  `#/tables/homebrew`; a stored switch or query.
- Files expected: `plan.md` section 3, "Files to create" and "Files to
  edit"; refresh both against the tree after R7d's closeout.
- Steps: `plan.md` section 3, steps 1-7.
- Acceptance criteria: C1-C7.
- Verification commands: `rtk npm run check` (Bash, timeout 600000);
  `npm run build:test`; `npm run check:built`; `node tests/run-all.js
  app/states`; `node tests/run-all.js app/contracts`; `node
  tests/app/golden.js --shard=n/4` (four calls, compare, then a re-seed of
  the named states; a `--only` starting with `#/` needs
  `MSYS_NO_PATHCONV=1`); `node tests/app/sweep.js 360`; `rtk npm run check`
  again after the re-seed.
- Risks / do-nots: memory only for the switch and the query; keep the other
  editor hints; reduced motion is forced in the browser suite.
- Fallback (optional): if 2.4's thresholds fail, the fold of 100 rows with
  «Показать ещё», then measure again.

## Blockers
- None. Next: a planner pass re-plans the widened release (W1-W5) with the answers in `plan.md` section 7.4.
- R7d must close first (owner's release order).

## Deferred
- None.

## Notes
- Mocks path: `issues/persist-7h-homebrew-page/mocks/index.html` (m01).
- Screenshot findings: none from the owner.
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none.
