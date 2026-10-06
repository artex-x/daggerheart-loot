# Handoff - TASK persist-9-item-share
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: planned; waiting for R7d and R7h to close and for the plan
  review before `B9.1`
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: main (planning only; no code)
- Base / starting commit: `d82e3e1f` plus R7d's uncommitted working tree
- Pushed: no

## Completed
- Batch name/id: planning pass 1 (2026-10-02)
- What shipped: `context.md`, `plan.md`, `mocks/` (index, m30-m36). No
  production code.
- Files changed: `issues/persist-9-item-share/**` only.
- Previous sha (batch diff base): not applicable (no task commit yet).
- Deviations and rationale: the roadmap's `clone_shared_homebrew` and
  `add_shared_homebrew_to_list` RPCs are replaced by existing calls
  (`import_homebrew`, the write buffer's frozen-copy add); the roadmap's
  `#/print/list/<id>` is replaced by `#/print/h/<token>` (owner's Q9-2 A, 2026-10-02); the
  roadmap's single batch `B9.1` is split by the schema batch rule (plan 7).
- Review: required (trigger: migration with definer functions, `anon`
  execute, public contract, new write protocol); plan review before `B9.1`.

## Verification
- Commands run (exact): none (planning). Mock sizes measured by the
  generator: every page under 88 000 URL-encoded characters; m30 and m41
  opened in the Browser pane.
- Results: not applicable.
- Gates: none.

## Next batch (implement-ready)
- Name: `B9.1` - the item link in the database, the port and the fake
  (`plan.md` 7.3), after the plan review.
- Objective: `homebrew_shares`, `create_homebrew_share`,
  `revoke_homebrew_share`, `get_shared_homebrew`, the touch and broadcast
  triggers, the port, the fake, contract case P, layer 3 cases.
- In scope: `plan.md` 3.1, 3.2, 7.3.
- Out of scope: every screen, route and string (`B9.2`).
- Files expected: `plan.md` 7.3, "Files".
- Steps: `plan.md` 7.3, steps 1-8.
- Acceptance criteria: `plan.md` 7.3, "Acceptance".
- Verification commands: `npm run check:db` (PowerShell tool),
  `rtk npm run check` (timeout 600000), `npm run build:test`,
  `npm run check:built`; after the approve
  `npm run db:push -- --project test`, `npm run e2e`.
- Risks / do-nots: `plan.md` 7.3, "Do not"; section 10.
- Fallback (optional): none.

## Blockers
- Blocked by the rework merged into R7h (`issues/persist-7h-homebrew-page/plan.md` section 7) (owner feedback 2026-10-02: share items by id, live add with a change log or a fixed copy, no snapshots). Do not dispatch before that task decides.
- None of the owner's: Q9-1 to Q9-5 answered 2026-10-02 (`plan.md` section 9).
- R7d and R7h close first (owner's order); refresh the B9.2 file and golden
  lists then.

## Deferred
- `#/print/<ids>` handed to another GM drops own items silently;
  `#/s/`'s blank first read versus rule 6 - both `persist-review` candidates
  (`plan.md` section 10).

## Notes
- Mocks path: `issues/persist-9-item-share/mocks/index.html`.
- Screenshot findings: none (no issue screenshots).
- Cleanup performed / retained artifacts: the mock generator lives in the
  planner's scratchpad, not in the repository.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none;
  each batch writes its own (`plan.md` 7.3 step 7, 7.4).
