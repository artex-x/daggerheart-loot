# Handoff - TASK persist-7d-homebrew-files
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: not started (planned; the directory was created at R7c's closeout)
- Last agent: implementer (R7c closeout, 2026-10-01)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: R7c's task commit (subject "feat(homebrew): relate
  own items to the catalog and to each other"); R7e, R7f and R7g ship before
  R7d, so the base moves.
- Pushed: no

## Completed
- None. R7d starts after R7e, R7f and R7g (owner, 2026-10-01).

## Verification
- None run for this task.

## Next batch (implement-ready)
- Name: `B7d.1` - refresh before dispatch.
- Objective: `import_homebrew`, `lib/homebrewFile.ts`, `lib/bundle.ts` v2, the
  two schemas and fixtures, `llms.txt` with a blind round (`plan.md` 7.4).
- Gate before it: the plan review `plan.md` Status requires (trigger: a
  migration and two public schemas). The planner refreshes the batch against
  the tree after R7e, R7f and R7g, designs the bulk-move write and its mock
  for `B7d.2`, and lists the inherited acceptance lines of 7.4 in each batch.

## Blockers
- None.

## Deferred
- Placed in this plan: the bulk move, the lazy chunk, `scale-challenge` F10,
  the 3x scale target, `B7.1-3`, `B7.2-4`, `B7.2-9` (`plan.md` Status and 7.4).
- Deferred with no release: a set filter or page, price and quantity in the
  quick item panel, a Trash for homebrew. `DEBT.md` D64, D66 and every other
  open entry go to the generic debt clean-up release between R9 and
  `persist-review`.

## Notes
- Mocks path: `issues/persist-7d-homebrew-files/mocks/index.html` (m02, m03,
  m15, m16, m17).
- Named to the owner at R7c's closeout: the bundle after R7c is 237.5 of
  242 kB configured and 178.6 of 183 kB unconfigured, 12.5 and 11.4 kB under
  the 250 and 190 ceilings, shared with R7e, R7f, R7g and R7d; the nightly
  usage report counts owners near `homebrew_items_per_owner` only, not near
  `homebrew_cards_per_owner`.
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none.
