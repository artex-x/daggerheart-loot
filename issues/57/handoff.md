# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (plan review `reviews/plan-1-2.md` applied; the
  batch mocks are being drawn; batch 1 waits for the owner's yes on `mocks/1/`)
- Last agent: planner (plan review fix pass)
- NEEDS_HUMAN_CONFIRMATION: no for the plan; the batch-mock questions of
  `plan.md` section 13 (Q1.1, R3, R7, Q3.1, Q3.2, Q5.1, Q6.1, Q6.2, Q8.1,
  Q9.1) are asked at each mock
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `9112c4ed` (the merge of `main` `c8243ba6`)
- Pushed: the orchestrator records the sha of this pass

## Completed
- Batch name/id: plan review fix pass (`reviews/plan-1-2.md`, Reviewed:
  `deaa7989`)
- What shipped:
  - Every finding applied once (B1-B3, R1-R9, N1-N17; N14 applied too);
    `plan.md` Status lists each with its section and change.
  - The owner's answers: Q1-Q4 answered; E5 kept (B1); the whole
    American-spelling sweep in batch 2, no batch 2b (B3), with its file set,
    kept forms, word list, decision file, `I18N.md` rule, `llms.txt` contract
    set and hook selftest; batch 2 gate cost and the plan total recomputed
    (about 466-631 min).
  - Mock-unit findings folded in: the share card's gold rule goes, the
    `swords` glyph check, C30 as a batch 7 question, one page ground (the
    `tokens.css` washes), the `/lists` panel, the editor «?» buttons, the list
    page «?» buttons, the `FEATURES.md` "Lists" gold selection line, the
    position field and drag grip kept, R's `.rl.sel` side-tab, the item sheet
    bar.
  - `reviews.md`: the plan-1-2 rows read `fixed plan`.
- Files changed: `issues/57/plan.md`, `handoff.md`, `reviews.md`.
- Previous sha (batch diff base): `deaa7989`
- Deviations and rationale:
  - N14 (deferred-scope) is applied, not deferred: the homes are a plan
    sentence (detector exceptions in DESIGN.md "Notes", repository exceptions
    in `.claude/README.md`) and agree with the owner's Q4 answer.
  - The page ground is decided in the plan (keep `tokens.css`), with a
    batch 1 fallback to unit B's linear ground if the detector flags the app.
- Review: plan review `reviews/plan-1-2.md`, fix-then-continue, applied once;
  no second look

## Verification
- Commands run (exact): `impeccable detect --json --no-config
  app/src/styles/tokens.css` and the same on
  `issues/57/mocks/direction/shared/base.css` (both `[]`); `git grep -c -i -E
  "<word list>"` over the repository (about 1330 lines in 529 files outside
  `issues/` and `schema/`; about 475 in goldens).
- Results: as in `plan.md` section 7 (batch 2) and section 10 ("One page
  ground").
- Gates: none (plan documents only).

## Next batch (implement-ready)
- Name: batch 1 - Foundation, after the owner confirms `mocks/1/` (`plan.md`
  sections 9 and 10)
- Objective: the font, the ten-step ramp, the tokens, the neutral pressed
  `Seg`, the kind-glyph art well, the share cards and the batch 1 DESIGN.md
  rules, print unchanged.
- In scope: `plan.md` section 10, "In scope".
- Out of scope: navigation, layouts, labels, help panels, print layouts, the
  `Chip` and `Button` variants (batches 3 and later), P7 and the spelling
  sweep (batch 2).
- Files expected: `plan.md` section 10, "Files expected".
- Steps: `plan.md` section 10, steps 1-12.
- Acceptance criteria: `plan.md` section 10.
- Verification commands: `rtk npm run check:fast`; `node tests/run-all.js
  app/print,app/typo,app/hues,stub`; `npm run check:built`; `npm run
  lint:untyped`; `npm run lint:typed`; `node --test
  tools/artwork/lib.test.mjs`; `node tools/artwork/cards.mjs --check`; `npx
  prettier --file-info` on the three E3 paths; `impeccable detect --json
  --no-inline-ignores app/src`; `git grep -n impeccable-disable -- app/src`;
  push and CI credit.
- Risks / do-nots: print output must not change (`--print-ui`); the art is
  fixed; no help panel goes without the owner's yes; `package-lock.json` is
  written by `npm install`; a budget raise past 270 / 350 kB stops for the
  owner; download only the three Q1 files.
- Fallback (optional): woff2 files under `app/public/fonts/` if the
  fontsource package lacks the Cyrillic italic; unit B's linear page ground if
  the detector flags `radial-halo` on the app.

## Blockers
- The owner's confirmation of `mocks/1/` (and Q1.1, the card text).

## Deferred
- A print font change: optional, its own batch, owner's yes.
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.

## Notes
- Mocks path: `issues/57/mocks/direction/index.html` (R by surface); batch
  mocks in `issues/57/mocks/<N>/`, built screenshots in
  `issues/57/mocks/<N>/built/`; the schedule and the re-render after mocks 2,
  3 and 4 are `plan.md` section 9.
- Screenshot findings: none new (no live build in this pass).
- Cleanup performed / retained artifacts: the detector output stays in the
  planner's scratchpad, not committed.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch (file, section): none; the
  DESIGN.md, `FEATURES.md`, `I18N.md`, `docs/artwork.md`, `.claude/README.md`
  and decision-file writes are acceptance lines of batches 1, 2 and 10.
