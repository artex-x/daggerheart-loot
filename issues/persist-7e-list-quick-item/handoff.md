# Handoff - TASK persist-7e-list-quick-item
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (planned; `B7e.1` implement-ready, dispatches after R7c's closeout is pushed)
- Last agent: planner (2026-10-01, the refresh before dispatch: F5 added, the standing checks answered)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: R7c's pushed closeout commit (not yet made; HEAD
  is `bb37a572`, R7c's unpushed task commit, with `B7c.4` in the working
  tree)
- Pushed: no

## Completed
- Batch name/id: none.
- What shipped: nothing.
- Files changed: `issues/persist-7e-list-quick-item/` (`context.md`,
  `plan.md`, `handoff.md`, `mocks/`, `consistency-audit.md`).
- Previous sha (batch diff base): none.
- Deviations and rationale: none.
- Review: not run; plan review not required (no trigger fired).

## Verification
- Commands run (exact): none (planning only).
- Results: -
- Gates: none.

## Next batch (implement-ready)
- Name: `B7e.1` - «+ Свой предмет» as a row after the entries; «Изменить» on
  the success toast; a row's note box drawn only when open or filled (F5).
- Objective: `plan.md` section 3 (owner's answers `E1` = e01, `E2` = 1A;
  F5 from the scale challenge's "Placement").
- In scope: `ListPage.svelte`, `QuickItem.svelte`, `Toast.svelte`,
  `state/app.svelte.ts`, two `dict.ts` keys, `FEATURES.md`, `COVERAGE.md`,
  the tests, inventory states, two sweep pages and one states case of
  `plan.md` 6, one decision file.
- Out of scope: `quickAdded`'s text and «Закрыть» (R7f); the list-full
  pre-check and the orphan item (F9, R7f); price and quantity; browser
  lists' look; any toast with no action; row paging (F5's paging half).
- First step: re-read the files of `plan.md` 6, "Re-check at dispatch", at
  R7c's pushed commit (`dict.ts`, `FEATURES.md`, `COVERAGE.md`,
  `inventory.js` and the snapshots, `sweep.js`, `states.js`,
  `fake-cloud-seed.ts`, `RowMain.svelte`, `docs/decisions/`) and record any
  moved anchor here.
- Files expected: `plan.md` 6, "Files".
- Steps: `plan.md` 6, steps 1-14.
- Acceptance criteria: `plan.md` 6, "Acceptance" (F5 is its own lines).
- Verification commands: `rtk npm run check` (timeout 600000);
  `npm run check:built`; `node tests/run-all.js app/states`;
  `node tests/app/golden.js --only=#/lists/` and `--only=#/l/` (compare),
  then `node tests/app/golden.js --only=4000-8000 --update` after the
  compares are read; `node tests/app/sweep.js 360`; `node tests/app/sweep.js
  1180 ru`; `node tests/app/sweep.js 1180 en`; `npm run e2e`. About 46
  minutes, plus a closeout of about 10.
- Risks / do-nots: pause only toasts with an action; keep the undo focus
  rule; a link action takes no focus; keep `boxHidden` unchanged; the clear
  cross's undo writes through the store, never an event on a textarea that
  may be gone; stage by path.
- Fallback (optional): none.

## Blockers
- R7c must close and push first (one session per working tree; R7e starts
  from R7c's pushed commit).

## Deferred
- The consistency audit's findings: R7f `persist-7f-consistency`.
- F9 (the quick item's orphan item at a full list, «из M» counters): R7f.
  R7f's refresh re-reads `QuickItem.svelte` and `ListPage.svelte` after
  R7e.
- F5's paging half («Показать ещё» for list rows past about 1400 entries):
  not placed by the owner. Question for the owner, with a recommendation:
  put it in R7g `persist-7g-read-scale` beside F6 (both act only at an
  override, on `ListPage.svelte`, and share the override seed); else R7e's
  closeout writes it to `docs/specs/DEBT.md`.

## Notes
- Mocks path: `issues/persist-7e-list-quick-item/mocks/index.html`; approved:
  `e01-add-row.html` and `e02-edit-link.html` frame 1A.
- Screenshot findings: none.
- Cleanup performed / retained artifacts: at closeout `consistency-audit.md`
  moves to R7f's directory if R7f has not taken it yet (R7f's `context.md`
  cites it here).
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none.
