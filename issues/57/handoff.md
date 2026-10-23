# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: plan review `reviews/plan-1.md` (fix-then-continue) applied;
  waiting for R10 and `cloudflare-pages` to ship, then the batch 1 dispatch
  refresh
- Last agent: planner (plan-review fix cycle)
- NEEDS_HUMAN_CONFIRMATION: no (Q1, the bundle budget, answered: raise it;
  `plan.md` section 11)
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `0b73fd5c`
- Pushed: yes, at `69f2178` (the S2 refresh); this fix cycle is not
  committed (the orchestrator commits it)

## Completed
- S1 - critique (phase 1): `audit.md`, triage in `context.md`.
- S2 - direction and mocks (phase 2), `b0a80ca`; S2 refresh after the owner
  chose R, `69f2178`.
- Batch name/id: plan-review fix cycle (`reviews/plan-1.md`, Reviewed:
  `69f21784`)
- What shipped:
  - All findings applied (B1-B6, R1-R7, N1-N8); `plan.md` Status lists each
    with its section and change.
  - Batch 7 is a public contract change (`routes.json` `tab`), with its
    same-commit set, its contracts gates and a batch review.
  - Batch 1: the family name from the package, the `document.fonts` check,
    the art well on every screen reader of `artSrc` through a new
    `ArtWell.svelte` and `kindGlyph`, the Numerals Rule, the `FEATURES.md`
    font bullet, the font decision file, the bundle-budget step, the three
    switches that move, the icon families, and a dispatch refresh that
    re-checks the review's "Next action" list. P7 moved to batch 7.
  - Batch 9 split into 9a (`#/lists/<uuid>`) and 9b (`#/lists`, the
    add-to-list menu).
  - The owner's order: every batch after R10 and `cloudflare-pages`; each
    dispatch merges `main` first.
- Files changed: `issues/57/plan.md`, `handoff.md`, `context.md`.
- Previous sha (batch diff base): `69f2178`
- Deviations and rationale:
  - N1 asked for the trigger "owner request"; the line uses the dispatch's
    trigger "public contract change in batch 7", which the plan prompt
    lists as a trigger.
  - B6: decision 2026-10-22 already allows a raise to the measured total
    under 270 kB; the plan still names Q1 to the owner, as the dispatch
    asked, with that rule as the default.
- Review: plan review `reviews/plan-1.md`, fix-then-continue, applied once;
  no second look

## Verification
- Commands run (exact): `git grep` and `rtk grep` over `app/src`,
  `docs/specs`, `tests`, `llms.txt`, `DESIGN.md` and
  `tools/artwork/review/index.html` for the readers that the findings name;
  `ls node_modules/@fontsource-variable/` (not installed).
- Results: `llms.txt` names no tab bar; `routes.json` is read by
  `hash.test.ts`, `tests/app/contracts.js`, `CONTRACTS.md`, `COVERAGE.md`
  and `ROUTES.md`; the `Seg` callers that batch 1 moves are `Shell`,
  `TablesPage` and `PrintSwitches`; `it.eq.t` is `weapon`, `secondary` or
  `armor`.
- Gates: none (plan documents only).

## Next batch (implement-ready)
- Name: wait for R10 and `cloudflare-pages`, then the batch 1 dispatch
  refresh, then batch 1 - Foundation
- Objective: the refresh re-checks the plan review's list (`plan.md`
  section 8, "Dispatch refresh", items 1-8) and updates section 8; then
  batch 1 ships the font, the ten-step ramp, the tokens, the neutral
  pressed state, the kind glyphs and the art well.
- In scope: `plan.md`, section 8.
- Out of scope: layouts, navigation, labels, help panels, print layouts,
  P7 (batch 7).
- Files expected: `plan.md`, section 8, "Files expected".
- Steps: `plan.md`, section 8, "Dispatch refresh" 1-8, then steps 1-10.
- Acceptance criteria: `plan.md`, section 8.
- Verification commands: `rtk npm run check:fast`; `node tests/run-all.js
  app/print,app/typo,app/hues,stub`; `npm run check:built` (it runs the
  budget); push and CI credit.
- Risks / do-nots: print output must not change (`--print-ui`); the art is
  fixed; a help panel is not removed without the owner's yes;
  `package-lock.json` is written by `npm install`, never by hand; a budget
  raise past 270 / 350 kB stops for the owner.
- Fallback (optional): woff2 files under `app/public/fonts/` if the
  fontsource package lacks the Cyrillic italic.

## Blockers
- R10 and `cloudflare-pages` have not shipped; no batch starts before both
  (owner, 2026-10-23).
- The owner's screen notes on the R states arrive before batch 1.
- None from Q1: the owner answered it (raise the budget, 2026-10-23).

## Deferred
- `verify` rows (C12, C34, C44, A9, A15, D8, D14): a live check in the batch
  that takes each (`plan.md`, section 7).
- A print font change: optional, its own batch, owner's yes.
- The link-preview card images keep Inter (`tools/artwork/fonts/`).
- The EN `<title>`, manifest name and `en/index.html` wordmark: the owner's
  answer covers the header only.
- `.impeccable/design.json` is older than DESIGN.md (detector `CONTEXT_STALE`);
  batch 11 regenerates it.

## Notes
- Mocks path: `issues/57/mocks/direction/index.html` (R first, by surface;
  then A, B, C and the font specimen). A state opens live at
  `R/state.html?s=<state>&lang=en`.
- Screenshot findings: C55 and C11 are a capture artefact - every record has
  an image file (`context.md`, "Reasons already disproved").
- Cleanup performed / retained artifacts: `render-r.js`, `placement.cjs`,
  `quant.js` and `crop.js` stay in the S2 session's scratchpad; the copied
  fonts stay in `C:\Users\Ignat\.dhloot\notes\57\fonts\`.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none;
  the DESIGN.md, `FEATURES.md` and decision-file writes are acceptance lines
  of batches 1 and 7 (`plan.md`, sections 5-8).
