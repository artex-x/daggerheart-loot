# Handoff - TASK 70
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (refreshed against R7h `31c1400f`; the second plan look `reviews/plan-B1-2.md` (fix-then-continue) is applied; risk 5 owner accepted 2026-10-07; B1 is next)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: claude/task-planners-mockups-079cc9
- Base / starting commit: d997f4f0 (plan); B1 starts from a base that holds R7h's task commit `31c1400f`
- Pushed: no

## Completed
- Batch name/id: planning pass 4 (no implementation batch yet)
- What shipped: pass 2 applied the owner's answers and the mock feedback; pass 3 applied every finding of `reviews/plan-B1.md`. Pass 4 refreshed the plan against R7h (`31c1400f`), which rewrote every function B1 redefines: the migration timestamp moves to `20261008120000`; all five bodies come from `20261007130000_homebrew_links.sql`; the players' answer must also drop the GM-only entry's `hid`; R7h's `relink` keeps the mark; `CONTRACTS.md` section 1 gets one clause; the import follows R7h's `importPlan`/`withCopies`; two new risks (`#/h/` related rows, a later redefinition of the projection). `plan.md` Status lists each moved line.
- Files changed: `issues/70/plan.md`, `issues/70/handoff.md`, `issues/70/context.md`, all uncommitted.
- Previous sha (batch diff base): d997f4f0
- Deviations and rationale: the decision file is planned for B1, not written now - it records the batch that establishes the boundary.
- Review: required (trigger: a migration and SECURITY DEFINER functions; the down migration loses every stored GM-only mark; B3's public contract change). `reviews/plan-B1.md` (fix-then-continue) is applied; the R7h refresh moved reviewed lines in sections 5, 6, 8, 10 and 11, so the reviewer takes a second look on them before B1.

## Verification
- Commands run (exact): none; planning only. R7h facts read with `git show 31c1400f:<path>` and `git diff d997f4f0 31c1400f`.
- Results: -
- Gates: none

## Next batch (implement-ready)
- Name: B1 `gm-only-schema` (plan review findings applied: `plan.md` Status, `reviews/plan-B1.md` and `reviews/plan-B1-2.md`)
- Objective: store the GM-only mark per entry; the players' link and its purchase requests never see a GM-only entry or its linked item's `hid`; the GM's link, the clone, the relink and the import call carry it; the client data paths and the fake cloud mirror the database. No screen change.
- In scope: `plan.md` section 11, B1 "Base", "Files" and steps 1-15.
- Out of scope: every `.svelte` file, `dict.ts`, `tests/app/`, the lists file's schema, validator and export (B3); `get_homebrew_item`; the `snapshot` column (R9's D91).
- Files expected: `plan.md` section 11, B1 "Files".
- Steps: `plan.md` section 11, B1 steps 1-15.
- Acceptance criteria: `plan.md` section 11, B1 "Acceptance".
- Verification commands: `rtk npm run check` (one call, Bash timeout 600000; or the form `.claude/README.md`, "Run a long check", names once R7h's `B7h.4t` is on the base); `npm run check:db` (PowerShell); after the batch review approves: the test push through `tools/supabase/migrate-test.mjs` (`db:push --project test` only where IPv6 works; `plan.md` B1 Verification step 3), then `npm run e2e`.
- Risks / do-nots: copy each redefined body from its newest migration (`20261007130000_homebrew_links.sql` at `31c1400f`); no policy for non-owners on `list_entries`; the column is `gm_only`, never `hidden`; no production push.
- Fallback (optional): none planned.

## Blockers
- R7h must be on the B1 base (it is not on `main` yet).
- None from the plan review: `reviews/plan-B1-2.md` is applied once; no further look.

## Deferred
- A hidden list note, per-player visibility: not asked for.

## Notes
- Mocks path: `issues/70/mocks/index.html`, revision 2 (thumbnails inlined as data URIs, so the static preview draws them). R7h did not change the screens they show.
- Screenshot findings: the issue has none. The mock's 360 px frames apply the row's existing CSS rules as written; they were not compared with a screenshot of the running app.
- Cleanup performed / retained artifacts: none.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none yet; B1 writes the decision file, FEATURES.md and CONTRACTS.md section 1.
- Approved visual constraints (owner, 2026-10-06): the toggle in `.lrow-acts` between note and remove, `eye`/`eyeOff`, the `.lrow-note.on` look when pressed; a GM-only row with a dashed `--line2` border, `--bg2` ground and the art at 45%, on the owner page and the GM's link; no visible text marker anywhere (the item's button carries visually hidden «Только для мастера»); no sub count and no owner-line count at N = 0; the share hint text of `plan.md` section 4.
- TASK 71 overlap: `plan.md` section 9. Run the two implementations one after the other.
- Cross-task: R8 plans to redefine `get_shared_list`; whichever of R8 and task 70 lands second copies the other's body (`plan.md` section 10, risk 6).
