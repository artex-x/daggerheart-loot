# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (plan refreshed against `main`; plan review next,
  then the batch mocks)
- Last agent: planner (restart step 2, refresh)
- NEEDS_HUMAN_CONFIRMATION: yes - `plan.md` section 13: Q1 (download the
  Source Sans 3 TTF faces for the share cards) blocks batch 1 step 9; Q2-Q4
  have recommended defaults
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `9112c4ed` (the merge of `main` `c8243ba6`)
- Pushed: no (CI of `9112c4ed` is running; the orchestrator pushes)

## Completed
- Batch name/id: planner refresh against `main` (restart step 2)
- What shipped:
  - `audit.md`: "Re-check against main (2026-10-29)": no row fixed; ten rows
    changed and still open; N1-N5 new (the `HitNote` side-tab, a test
    `<img>`, 128 detector advisories, a stale `TabBar` comment, the share
    cards).
  - `plan.md` rewritten: ten batches, foundations first (1 foundation, 2
    shell), the owner's merges (old 5+6 is 6; old 9a+10 is 9, with the
    component evidence), the share cards and the Clarity Rule in batch 1, the
    audit-to-DESIGN.md-rule table, the Impeccable exception inventory E1-E10,
    the DEBT placements (D121 batch 2, D116 batch 8), a mock step and a "mock
    depends on" line per batch, the mock schedule (two units), the gate cost,
    the four standing checks, a new plan review line.
  - The old plan review (`reviews/plan-1.md`) is recorded as history in
    `plan.md` Status; its applied line left Status, so a new plan review is
    required before batch 1.
- Files changed: `issues/57/plan.md`, `handoff.md`, `audit.md`, `context.md`.
- Previous sha (batch diff base): `9112c4ed`
- Deviations and rationale:
  - Batch 9 is old 9a + 10, not 9b + 10: 10 of the shared page's 15
    components are the list page's, and four design decisions are shared
    (`plan.md` section 7).
  - The pin and «Справка» labels (C37, A27 icons) moved to batch 2, because
    `PageHead` and `HelpButton` are shared chrome; each panel's removal stays
    in its batch.
  - The icon-and-label centre rule moved from old 9a to batch 1, because batch
    1 adds a check icon to `Chip`, `Seg` and `Button`.
  - The share card EN subtitle takes P7's "armor" in batch 1, so the cards are
    rendered once.
- Review: plan review required before batch 1 (trigger: public contract
  change in batch 2); report `reviews/plan-1-2.md` or the name the reviewer
  takes

## Verification
- Commands run (exact): `git log --first-parent 0b73fd5c..origin/main`;
  `git diff --stat 0b73fd5c origin/main -- app/src docs/specs DESIGN.md`;
  `git grep -i impeccable`; `impeccable detect --json app/src` (exit 2, 130
  findings: 2 warnings, 128 advisories); `rtk grep` over `dict.ts`,
  `TabBar.svelte`, `Shell.svelte`, the list pages, `inventory.js`, `typo.js`,
  `tools/artwork/`, `sw.js`, `bundle-budget.mjs`.
- Results: as in `audit.md`, "Re-check against main", and `plan.md` sections
  0, 5, 6 and 10 ("Facts checked").
- Gates: none (plan documents only).

## Next batch (implement-ready)
- Name: batch 1 - Foundation, after the plan review and the mock step
  (`plan.md` sections 9 and 10)
- Objective: the font, the ten-step ramp, the tokens, the neutral pressed
  default, the kind-glyph art well, the share cards and the batch 1 DESIGN.md
  rules, print unchanged.
- In scope: `plan.md` section 10, "In scope".
- Out of scope: navigation, layouts, labels, help panels, print layouts, P7
  in the app (batch 2).
- Files expected: `plan.md` section 10, "Files expected".
- Steps: `plan.md` section 10, steps 1-12.
- Acceptance criteria: `plan.md` section 10.
- Verification commands: `rtk npm run check:fast`; `node tests/run-all.js
  app/print,app/typo,app/hues,stub`; `npm run check:built`; `npm run
  lint:untyped`; `npm run lint:typed`; `node --test
  tools/artwork/lib.test.mjs`; `node tools/artwork/cards.mjs --check`; `npx
  prettier --file-info` on the three E3 paths; `impeccable detect --json
  app/src`; push and CI credit.
- Risks / do-nots: print output must not change (`--print-ui`); the art is
  fixed; no help panel goes without the owner's yes; `package-lock.json` is
  written by `npm install`; a budget raise past 270 / 350 kB stops for the
  owner; no font download before Q1 is answered.
- Fallback (optional): woff2 files under `app/public/fonts/` if the
  fontsource package lacks the Cyrillic italic; Q1's alternative (keep Inter on
  the share cards) if the owner refuses the download.

## Blockers
- The plan review (required before batch 1).
- The owner's confirmation of `mocks/1/` (the mock step).
- Q1 for batch 1 step 9 only.

## Deferred
- A print font change: optional, its own batch, owner's yes.
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.
- `llms.txt` spelling (Q3).

## Notes
- Mocks path: `issues/57/mocks/direction/index.html` (R by surface); batch
  mocks go to `issues/57/mocks/<N>/`, built screenshots to
  `issues/57/mocks/<N>/built/`; the schedule is `plan.md` section 9.
- Screenshot findings: none new (no live build in this pass).
- Cleanup performed / retained artifacts: the detector output stays in this
  session's scratchpad (`detect-app.json`), not committed.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none; the
  DESIGN.md, `FEATURES.md`, `docs/artwork.md` and decision-file writes are
  acceptance lines of batches 1, 2 and 10.
