# Handoff - TASK persist-7b-homebrew-catalog
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned, not started - moved from `persist-7-homebrew` at
  R7's closeout (2026-10-01). R7b is next; R7c and R7d are planned here
  until each gets its own directory (`plan.md` 7.5).
- Last agent: planner (2026-10-01, R7's closeout, planner part)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: R7's commit "feat(persist): add homebrew items,
  their pages, editor and list entries", after R7's closeout amend and push.
- Pushed: no

## Completed
- Batch name/id: none.
- What shipped: nothing in this task. The plan, the context and the mocks
  moved from R7's directory.
- Files changed: none outside this directory.
- Previous sha (batch diff base): -
- Deviations and rationale: -
- Review: not run - no batch has run. The plan review is required before
  `B7b.1` (`plan.md` Status).

## Verification
- Commands run (exact): none (documents only).
- Results: -
- Gates: -

## Next batch (implement-ready)
- Name: `B7b.1` - tables, search, filters, chip. Not implement-ready: an
  outline (`plan.md` 7.2).
- Objective: the next step is a planner refresh (mode B) against the `main`
  that holds R7. It expands `B7b.1` to implement-ready steps, with every
  inherited acceptance line of 7.2 as its own line. Then the plan review
  runs (`Scope: plan before B7b.1`), then the implementer.
- In scope: `plan.md` 4.6 (the R7b column), 4.2 (`srcOf`, `tableOf`), 4.10
  (the entry points and the `#/homebrew` lead), 4.14 F4 (the `sect` facet
  and anchors), section 3 rows G2, G4-G8, G30, G34, G40.
- Out of scope: relations and cards (R7c); files (R7d); the roll pages.
- Files expected: the refresh names them.
- Steps: the refresh writes them.
- Acceptance criteria: `plan.md` 7.2, the table row and the inherited lines.
- Verification commands: `plan.md` 7.2 gates - `npm run check` (twice),
  `npm run check:built`, `node tests/run-all.js app/states`, `node
  tests/run-all.js app/contracts`, the golden compare then re-seed per
  shard, `node tests/app/sweep.js 360`.
- Risks / do-nots: `plan.md` section 12; a public contract change (a table
  id) updates `ROUTES.md`, `CONTRACTS.md` section 1, `routes.json`,
  `tests/contracts.js` and `llms.txt` in the same commit.
- Fallback (optional): -

## Blockers
- R7's closeout and push come first: this task starts from the `main` that
  holds R7.

## Deferred
- Ideas not placed in R7b-R7d (`plan.md` section 12): books shared with
  other users (D7); a Trash; art (R8); item links (R9); a set filter or
  page; `recall` on a homebrew record; a source cover; bulk moves between
  sources; price and quantity in the quick item panel. `DEBT.md` D64 and
  D66 stay with the owner.

## Notes
- Mocks path: `issues/persist-7b-homebrew-catalog/mocks/index.html`
  (m01-m22, approved 2026-09-30); the overrides table is `plan.md` section 8.
- Screenshot findings: no issue screenshots (no GitHub issue).
- Cleanup performed / retained artifacts: the mocks moved from R7's
  directory; m01, m03, m14, m18, m19 and m22 draw R7's shipped screens and
  stay for the index's links.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): D7
  `docs/decisions/2026-10-01-homebrew-keeps-the-way-open-to-shared-books.md`
  (new); D2
  `docs/decisions/2026-09-30-hb-marks-homebrew-a-relation-shows-only-to-its-author.md`
  (the owner's marker answer); `docs/DECISIONS.md` (rebuilt); the roadmap
  `issues/persistent-storage/plan.md` (R7's planned changes to sections 3,
  5, 6, 9, 12, 14, 16 and 17).
