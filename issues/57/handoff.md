# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (the owner's mock answers and the First-Screen
  Rule are in the plan; a second plan-review look on the changed parts is
  next; mock 1 is approved)
- Last agent: planner (mock answers pass)
- NEEDS_HUMAN_CONFIRMATION: no for batch 1; Q1b.1 (the black-and-white
  card) is asked at mock 1b and blocks batch 1b only
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `9112c4ed` (the merge of `main` `c8243ba6`)
- Pushed: the orchestrator records the sha of this pass

## Completed
- Batch name/id: mock answers and First-Screen Rule (planner pass after
  `reviews/plan-1-2.md`)
- What shipped:
  - Batch 1b added (owner): the kind glyph replaces the no-picture placeholder
    everywhere, print included; `img/_none.webp`, `img/thumb/_none.webp` and
    `og/_none.jpg` are deleted; every reader is named; a link card of a
    no-picture record takes the site share card of its language. Split from
    batch 1 by its public contract and print change. The Plan review line names
    the new trigger.
  - The linear page ground replaces the radial washes in batch 1, the share
    cards included.
  - C1 and C38 renamed («Об этих данных», «Где какая редкость»), not removed;
    Q1.1, R3, R7, Q3.2, Q6.1, Q6.2, Q8.1, Q9.1 answered.
  - First-Screen Rule (section 14): batch 1 writes the rule and adds a
    `data-primary` mark per page and a `tests/app/states.js` case with a
    `FIRST_SCREEN` table; each batch asserts its routes; batch 10 asserts all.
    The nine mocks' main states are measured at 360x640 and 1180x720 (RU and
    EN), with a recommended fix for each failure.
  - Gate total recomputed: about 525-707 min (8.8-11.8 h).
- Files changed: `issues/57/plan.md`, `handoff.md`, `context.md` (the
  orchestrator's answers).
- Previous sha (batch diff base): the plan review pass, `69cc77e4`
- Deviations and rationale:
  - Black-and-white: no card draws a picture today (`{#if !bw}`), so the
    owner's "black-and-white included" has no art area to change; Q1b.1 asks,
    with no change recommended.
  - First-screen fixes for `/homebrew` and the catalog at 360 make the H1 a
    picker of the sibling tabs or tables; the four-tab row is the named
    alternative at about 45%.
  - The roller at 360 hides its H1 visually (the lit mode control shows the
    name); the estimate is at the limit (about 254).
- Review: a second plan-review look on the changed parts (orchestrator)

## Verification
- Commands run (exact): `git grep -n -E "_none"` over the repository (the
  readers of batch 1b); a puppeteer script over `mocks/<N>/state.html` at
  360x640 and 1180x720, RU and EN (`measure.mjs` in this session's
  scratchpad).
- Results: `plan.md` section 14 (the measured table) and section 7, batch 1b.
- Gates: none (plan documents only).

## Next batch (implement-ready)
- Name: batch 1 - Foundation (mock 1 approved), after the plan-review look
- Objective: the font, the ten-step ramp, the tokens, the neutral pressed
  `Seg`, the kind-glyph art well on screen, the linear page ground, the share
  cards, the First-Screen Rule and its check, and the batch 1 DESIGN.md rules,
  print unchanged.
- In scope: `plan.md` section 10, "In scope".
- Out of scope: the print glyph and the placeholder files (batch 1b),
  navigation, layouts, labels, help panels, print layouts, P7 and the spelling
  sweep (batch 2).
- Files expected: `plan.md` section 10, "Files expected".
- Steps: `plan.md` section 10, steps 1-12 (with 10a).
- Acceptance criteria: `plan.md` section 10.
- Verification commands: `rtk npm run check:fast`; `node tests/run-all.js
  app/print,app/typo,app/hues,stub,app/states`; `npm run check:built`; `npm
  run lint:untyped`; `npm run lint:typed`; `node --test
  tools/artwork/lib.test.mjs`; `node tools/artwork/cards.mjs --check`; `npx
  prettier --file-info` on the three E3 paths; `impeccable detect --json
  --no-inline-ignores app/src`; `git grep -n impeccable-disable -- app/src`;
  push and CI credit.
- Risks / do-nots: print output must not change in batch 1 (`--print-ui`;
  the print glyph is batch 1b); the art is fixed; no help panel goes without
  the owner's yes; `package-lock.json` is written by `npm install`; a budget
  raise past 270 / 350 kB stops for the owner; download only the three Q1
  files.
- Fallback (optional): woff2 files under `app/public/fonts/` if the
  fontsource package lacks the Cyrillic italic.

## Blockers
- The second plan-review look (orchestrator).
- Batch 1b only: Q1b.1 at mock 1b.

## Deferred
- A print font change: optional, its own batch, owner's yes.
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.

## Notes
- Mocks path: `issues/57/mocks/<N>/` (batch mocks), `mocks/<N>/built/` (built
  screenshots); the re-renders that the first-screen table asks for are
  `mocks/3/`, `5/`, `6/`, `7/`, `8/`, `9/`; mock 1b is new (`plan.md` section
  9).
- Screenshot findings: the mocks' first-screen offsets, `plan.md` section 14.
- Cleanup performed / retained artifacts: `measure.mjs`, `explore.mjs`,
  `explore2.mjs` and `bodykids.mjs` stay in this session's scratchpad.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none; the
  rules land with batches 1, 1b, 2 and 10.
