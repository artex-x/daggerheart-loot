# Review - W (57)

Verdict: fix-then-continue
Reviewed: 8b1bc0218b06026cbf3c3044d39b2ff5d3741f84
Scope: batch W

## Blockers

- W-B1. The `NumberField` cap is not a wide-window change, and the specs and the handoff say it is. `.numbox { max-width: 240px }` applies at every width. Where the box fills its parent, it changes at or below 1212 px too:
  - 761-1212 px: `/roll/std` and every `RollPanel` page go from 282 px to 240 px.
  - Up to 760 px, with «Настроить» open: the panel spans the results column (about 296 px at 360 and about 696 px at 760), so the box drops to 240 px.
  - About 530-760 px, `/roll/alt`: each `.dieblock` (`flex: 1 1 0`) is wider than 240 px, so the two boxes no longer fill their blocks. The 136 px boxes hold only from 761 px.

  These statements are now false:
  - DESIGN.md "Layout": "every window up to 1212px draws as it did at 1180px".
  - The handoff line "Up to 1212 px nothing moves but the record page dossier".
  - The plan constraint "No change at or below 1212 px windows except the record page's dossier". No deviation records the break.

  The cap also sits under "From 1472px ... a reading surface keeps its measure" in "The One Width Rule", but it applies at every width. Fix: keep the cap at every width (recommended, one rule for the counter). State that scope in DESIGN.md "Layout" and "The One Width Rule", and record it as deviation 6. Add 360 px and 700 px shots of `/roll/std` and `/roll/alt` with the settings open to W8. Trade-off: the phone settings panel changes without a golden or a case.

## Risks

- W-R1. Case 101 does not assert the left edge of a capped surface. A centered dossier or form would pass. The plan named W8 shots as the proof, and W8 did not run. Fix (`local`): add `dossier[0].left`, `form.left` and `account.left` equal to `mainL` within 1 px.
- W-R2. The handoff does not record the W8 shots, the W9 `polish`/`harden` pass, `impeccable detect` or the spelling grep (plan Verification step 6, and the acceptance line "The detector, the spelling grep and the shots of W8 are done").

## Nits

- W-N1 (`local`): The decision file rejects "keep 1180 px" because "the four-result roll stayed taller than its first screen at 1920". Plan 1.2 measured the end at 747 of 1080. Use the side space and owner item 7 as the reason.
- W-N2 (`local`): The `--dossier-w` comment cites "The Dossier Rule", which states no width. Cite "The One Width Rule", or add the shared width to "The Dossier Rule".
- W-N3 (`local`): handoff "Status" and "Next batch" still describe the 7b pause at `d10ffa41`.
- W-N4 (`deferred-scope`): The `run-all.js` `app/states` weight (179.3 s) is stale. Case 101 opens 74 contexts, up to 3840x2160. Re-measure the weight from this CI run.
- W-N5 (`local`): The editor cap bites from a 1158 px column (about a 1206 px window with the gutter), so the claim about 1212 px is a few pixels wrong for the editor too. Fold this into W-B1's wording.

## Deviations

1. Center against the body's width: accepted. `scrollbar-gutter: stable` makes the body the layout width.
2. `dialog[open] .modal-card`: accepted.
3. `#/roll/alt` added: accepted.
4. Per-language baselines: accepted.
5. Spec homes: accepted. FEATURES.md has no 240 px line, but the decision cites FEATURES "Chrome" for it. Add the line or drop the citation (part of W-B1).

## Standing checks

1. Scale: checked - `--wrap` uses (Shell x3, ModeRow, SelectionBar), no `590px` or `100vw` offsets, the dossier, editor, account, print and dialog caps, and case 97 at 1919x980. Lists draw as before. W-B1 is the one unplanned change.
2. Error scenarios: not applicable - CSS only, no write path or stored shape.
3. Consistency: checked - The One Width Rule, The Dossier Rule, The Two Breakpoints Rule (no new breakpoint), and DESIGN, FEATURES, COVERAGE and the decision give the same numbers (1213, 1472, 1440, 980, 720, 1100, 320). The exceptions are W-B1 and deviation 5.
4. RU/EN parity: checked - there is no new string. Case 101 runs EN at 1920 for the header and the heads.

Owner rules: checked - the context.md item 7 defaults (Q1-Q4) are in the decision file and DESIGN.md "Layout". The owner's counter request is not in context.md. The orchestrator records it there.

## Suggested next action

Run one fix pass for W-B1, W-R1, W-N1, W-N2, W-N3 and W-N5. Then run W8 (shots, including the counter at 360 and 700) and W9. No second review is needed if CI is green.

## Checks still needed

- CI of `8b1bc021`: `app/states` (cases 83, 97, 101), `app/golden` (no move), `sweep.js`, `app/print`, `contracts` at 1280, and `e2e`.
- W8 shots, W9 `polish`/`harden`, `impeccable detect`, the spelling grep.
