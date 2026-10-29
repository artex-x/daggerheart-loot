# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (the second plan review is applied; batch 1 may
  start after its mock step; mock 1 is approved)
- Last agent: planner (second plan review pass)
- NEEDS_HUMAN_CONFIRMATION: yes, for batch P only (QP.1, QP.6, QP.7, QP.8 at mock P);
  batches 1 and 1b do not wait
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `9112c4ed` (the merge of `main` `c8243ba6`)
- Pushed: no

## Completed
- Batch name/id: second plan review applied (`reviews/plan-1-3.md`), and the
  device shares (owner, 2026-10-29, `context.md` "Devices during play")
- What shipped:
  - B1-B3, R1-R4, N1-N7 of `reviews/plan-1-3.md`, each in the section the
    `plan.md` Status line names: the 1b readers, counts, link-card meta and
    gates; the batch 2 selftest, `tests/db/` with `check:db`, and `derived`;
    the light print well's values from the mock step; the first-screen check's
    real components, number-field read, 240/270 target, scroll reset, zero
    matches and longest names; one place per list control; the word list and
    the kept forms; the stale question text; the page ground line; the 1b
    contract set and error scenarios; the measure script in
    `issues/57/mocks/measure.mjs`; the EN label pairs.
  - Batch 1 gains the `PRODUCT.md` rewrite ("Users", "Operating Context",
    "Positioning") and The Phone-First Rule beside The First-Screen Rule.
  - Gate total recomputed: about 541-718 min (9.0-12.0 h).
- Files changed: `issues/57/plan.md`, `handoff.md`, `context.md` (the
  orchestrator's owner directions), `reviews.md`, `reviews/plan-1-3.md`
  (`reviews/plan-1-2-2.md`, the same text, removed).
- Previous sha (batch diff base): `dae889dc`
- Deviations and rationale:
  - R4: `cancelled` is kept everywhere (American, and GitHub's API value);
    `smoulder` and the sub-package lock files are kept forms (orchestrator's
    choice of the review's recommendation).
  - B3: the `tests/db/` comments are respelled and the batch runs `check:db`
    (the review's recommendation).
- Review: required (trigger: public contract changes in batches 1b and 2),
  report `issues/57/reviews/plan-1-3.md` (fix-then-continue, applied; no
  further look)

## Verification
- Commands run (exact): none beyond reads; plan documents only.
- Results: `plan.md` Status, "Plan review findings applied:
  reviews/plan-1-3.md".
- Gates: none (plan documents only).

## Next batch (implement-ready)
- Name: batch 1 - Foundation (mock 1 approved)
- Objective: the font, the ten-step ramp, the tokens, the neutral pressed
  `Seg`, the kind-glyph art well on screen, the linear page ground, the share
  cards, the First-Screen Rule and its check, The Phone-First Rule, the
  `PRODUCT.md` device shares, and the batch 1 DESIGN.md rules, print
  unchanged.
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
- None for batch 1. Batch P (print, after 1b; `plan.md` section 15) waits for
  the owner's answers to QP.1, QP.6, QP.7 and QP.8 at mock P (QP.2-QP.5 answered) (NEEDS_HUMAN_CONFIRMATION for
  batch P only; recommended options in section 13).

## Deferred
- R5 of `reviews/plan-1-3.md` (deferred-scope): `review.prompt.md` names a
  third look `<name>-2.md`, while `agent-guard.mjs` reads only
  `plan-<batch>-<n>.md`; aligning the prompt is a prompt change with its own
  review.
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.

## Notes
- Mocks path: `issues/57/mocks/<N>/` (batch mocks), `mocks/<N>/built/` (built
  screenshots). Mock-affecting findings for the units (orchestrator): R1 (mock
  1b, the node's per-kind outline beside the glyph, and the node's paper and
  ink values written into the 1b line), R2 (the 240/270 target: mocks 3, 5,
  6, 7, 8, 9), R3 (mock 3: one place for «Выбрать», the search and the view
  switch; mock 6: one count), N7 (the EN label pairs in each `index.html`).
- Screenshot findings: the mocks' first-screen offsets, `plan.md` section 14.
- Cleanup performed / retained artifacts: `issues/57/mocks/measure.mjs` is
  the measure script (N6); the closeout deletes it with the task directory.
- Print audit (planner, 2026-10-29): `audit.md`, "Print audit (2026-10-29)",
  PR1-PR12; evidence in `C:\Users\Ignat\.dhloot\notes\57\print-evidence\`
  (real Chrome print PDFs and 300 dpi rasters of both sheets, both layouts,
  RU and EN; the catalog fit measure and three trials; the `/p/` first
  screen); the scripts in `issues/57/mocks/P/tools/` (absolute paths to this
  worktree; uncommitted until the orchestrator commits the mocks).
- Mock P (2026-10-29, owner: drawn now): `issues/57/mocks/P/index.html`, from
  the pre-batch-1 build of `13ffd5e4` in the detached worktree
  `C:\Users\Ignat\.dhloot\notes\57\p-build` (node_modules is a junction to the
  main checkout's; remove the worktree with `git worktree remove` when batch P
  no longer needs it). PDFs in
  `C:\Users\Ignat\.dhloot\notes\57\print-evidence\mockp\`. Overpass is not
  drawn: its two files need the owner's yes to download; `mockp.cjs proposed
  overpass <out>` adds it once they are in
  `C:\Users\Ignat\.dhloot\notes\57\fonts\overpass\`.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none; the
  rules land with batches 1, 1b, 2 and 10.
