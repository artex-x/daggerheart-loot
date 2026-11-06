# Review - P (57)

Verdict: fix-then-continue
Reviewed: 1ae4546168628811ac15262e6c61ee348d4ac099
Scope: batch P

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Read: `CLAUDE.md`; `context.md` (items 7-15, "Print batch answers", "Mock P answers", "Card bottom line", "Burden
hands", Q-P1); `handoff.md` (Completed P, defaults 1-8, Verification); `plan-P.md` (P-D1 to P-D19, acceptance 1-30,
standing checks, do-nots); `git diff b3d3994c 1ae45461` for every source, test, spec, decision and tool file; the 40
goldens by group (the `_p_set_*` trees, the account six, the two editor print previews, the two new phone states); the
burden tools (`unmask.cjs`, `pixcmp.cjs`, `rasterprobe.cjs`); shots `p-emberaxe__360__ru`, `p-more__360__en`. No suite
was run. A read-only overlap probe was refused by the reviewer write guard, so the B1 render is under "Checks still
needed".

## Blockers

**P-B1 (blocking, local): the clearance check exempts every card at its floor, and the code path it exempts is never
reached by a test.** Default 2 adds a loop to `PrintCard.fit()` (`while (tight() && lift > 5.8)`). The loop gives the
mark band back to text that is still cut at its floor. `print.js` then changed its new check to
`c.atFloor || c.top >= c.low - 0.5`:

- The exemption covers every color card at its floor whose picture gave way. It also covers a card that did not take
  the band back, so a real collision on such a card passes. This loosens the check that acceptance 9 names ("clears
  every mark"). `plan-P.md`, "Risks and do-nots", says: "never loosen a check to pass".
- The check runs on the standard RU `voa2_*` set. `voa4_t4i` and `voa4_a3` take the band back on the RU compact color
  sheet only, so no browser check reaches the loop. In jsdom the clearance is always 5.8cqw (no mark has a box), so
  the loop body never runs in vitest either.
- The check compares tops only. A mark sits in a corner (the tier band at the left from 6.9cqw, the burden and armor
  marks at the right). The tags start at the left edge, and the name spans the whole width. At a 16.4 or 18.9cqw lift
  under marks that reach about 22cqw, the result depends on the horizontal extent too. FEATURES.md says the text
  "takes the mark's band back", but it does not say whether a tag or the name then draws under a mark (marks are
  `z-index: 4` over the content's 3). The decision file still lists "a fixed 5.8cqw lift (the tags under a tier band
  or a burden mark)" as rejected, and it does not name the take-back.

Change:
1. In `print.js`, replace the vertical test and its `atFloor` exemption with a rectangle test. No mark rectangle (the
   tier `svg`, `b`, `i`; the burden `img`, `small`; the shield `img`, `i`) may intersect a `.pc-tag` rectangle or a
   line rectangle of `.pc-name` (`Range.getClientRects()`) by more than 0.5 px. Apply it to every color card whose
   picture gave way.
2. Run that check also on a RU compact color set that holds `voa4_t4i` and `voa4_a3`. Log the lift of each card that
   took the band back.
3. If the two cards pass, no exemption is needed. FEATURES.md and the decision file then say that the tags and the
   name stay clear of the marks.
4. If either card intersects, stop and name it to the owner. Recommended: let those cards' rules text go under the
   3.7cqw floor as a named shortfall, with the measured pt in FEATURES.md, in place of a mark over a tag. This follows
   P-D5's own rule: a named shortfall is better than a collision on paper. The trade-off: two RU compact cards print
   their text a little under 4.5 pt. The alternatives are an overlap named in FEATURES.md with the two ids, or a
   counted clip.
5. In each case, add default 2 to the Status "For the owner" line with a shot of the two cards. Today only defaults 1
   and 4 are named to the owner.

## Risks

**P-R1 (local): on a landscape phone the primary is after every card.** The `.pdock` sticks only from a 481 px window
height. It copies the editor's rule, and the reason for that rule is the on-screen keyboard over a form; `/p/` has no
text field. In a narrow and short window (667x375, 740x360) «Напечатать» is in the flow after every card. With ten
cards that is about 6,000 px down. At the 180 cap it is about 100,000 px down. Scale check 1 names this ("a list that
pushes the primary action off the screen").
- Recommended: let `.pdock` stick at every height. Then let `tokens.css`'s `max-height: 480px` block keep `--ebar-h`
  for the print page only, for example through a page class. The trade-off: 67 px of a 360 px window stay covered.
- Alternative: under 481 px of height, draw «Напечатать» in `.prow` as from 761 px. The trade-off: a third form of
  the bar.

**P-R2 (CI): the unconfigured bundle is 269.8 of 270 kB.** The rule raises a limit to the measured total rounded up.
269.8 rounds up to 270, so the rule allows no raise now, and the margin is 0.2 kB locally. The configured CI figure is
about 0.1 kB over the local one (327.4 against 328). If the unconfigured build differs the same way on CI, the margin
is 0.1 kB. The CI run of this tip settles it. If `check:built` fails there, raise the limit to 271 by the stated rule
(under the 300 kB ceiling) with the CI figure in the comment. Batch 10 will almost certainly need a raise; plan for it.

**P-R3 (local, wording): the fonts port waits on `ready` for both answers (default 3).** This repository's own
`TablesPage` comment says that `ready` tracks "the document has finished loading". On a direct open of a `/p/` link,
«Напечатать» therefore stays disabled until the document has loaded, not only until the face has. That is acceptable,
because a print before the art loads is worse. But FEATURES.md ("which comes at once when no face was loading") and
the `FontsPort` doc comment say less than the code does. Change both to say that the answer comes after the document
and its fonts have settled.

## Nits

- **P-N1 (local):** 14 `inventory.js` `why`s on `#/p/` states still say "the note under the bar". `KeepNote` and the
  hint are gone, and the `why` is the golden's line 3, so the re-seeded headers carry the stale text. Remove the
  clause and re-seed the headers only; line 3 moves.
- **P-N2 (local):** `PrintPage`'s `back()` calls `preventDefault()` and `router.back()` on any click. A ctrl-click or
  cmd-click on «Назад» then steps back in the same tab, while `router.ts` leaves modified clicks to the browser. Return
  early on `e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey`, and add one `printPage.test.ts` case.
- **P-N3 (local):** `Toast.svelte` adds `--ebar-h` at every height. Under 481 px of height the editor's bar and the
  dock are in the flow, so a toast floats about 67 px higher than needed. `tokens.css` already drops `--ebar-h` there.
  Add the same `max-height: 480px` override to `.toast.page`. If P-R1 takes the recommended option, follow P-R1's
  form instead.
- **P-N4 (local):** the `ResizeObserver` effect that sets `--ebar-h` is now in two components (`HomebrewEditor`,
  `PrintPage`) and is the same code. Extract it on this second use (an action or one helper), as `CLAUDE.md` requires.
- **P-N5 (local):** permanent documents cite task-scratch ids that closeout deletes: FEATURES.md "(owner, Q3.2)" and
  the decision file "QP.1", "QP.4, QP.6 to QP.8", "QP.8". Write the owner and the date instead.
- **P-N6 (local):** case 115 "held" compares the cold fit with the warm fit on `set-emberaxe`, one short card. That
  card probably lands on the same values in either face, so the comparison does not prove the refit. The unit tests
  prove it (`printPage.test.ts`, the reads double). Add `voa2_a3` to the held set, or state in the case that it guards
  the disabled button and the end state only.
- **P-N7 (local):** DESIGN.md "Signature component" says "the text moves up to just under the marks". After default 2
  that is not true on two cards. Align the sentence with the outcome of P-B1.
- **P-N8 (deferred-scope):** `p-more__360__en.png` shows the open dock «Ещё» with the page scrolled about 24 px and the
  crumb row partly under the shown header. This is the same family as the Deferred "focus jump" and 9a R2 rows. Add
  the `/p/` dock to that row for `DEBT.md`; do not fix it here.
- **P-N9 (deferred-scope, the owner's call):** in EN, "Print" now names two actions: the entry control `print` (RU
  «Печать», opens the sheet) and `printNow` (RU «Напечатать», prints). RU keeps the two names apart. They never meet on
  one page. Name it in the batch 10 copy rows, or leave it as the owner's RP-1 answer.

## Deviations

1. Burden files as clip paths, not the exported bytes (default 1). **Accepted.** The owner's direction was "the node's
   vectors", and "exported bytes, no optimizer" was the planner's P-D10. `CLAUDE.md`'s law is "export vectors; do not
   redraw them". Every `d` stays the export's. `unmask.cjs` turns each `<mask>` (a white rect less a `<use>`) into an
   even-odd `clipPath` over the same rect and path. The two forms are the same region by construction; only mask
   luminance at the anti-aliased edge can differ.
   - The pixel proof is sound for its purpose. It draws through the same `<img>` path as the card, at 12x (744x444),
     and counts channels that differ by more than 8; the maximum difference is 4, so 0.000% follows. It draws on
     white only, and the color mark sits on art; that difference is limited to anti-aliased edges and is immaterial.
   - `rasterprobe.cjs` counts `/Subtype /Image` in a Chrome PDF: a direct test of the FEATURES.md law.
   - `tests/derived.js` still sees the colour and black-and-white geometries differ, so `UNFOLDED` holds. CONTRACTS.md
     section 5 freezes paths, not bytes: four files changed, no path moved.
   - The deviation is named to the owner (Status), in FEATURES.md "Print" and in the decision file's Rejected line.
2. The text takes the mark band back at its floor (default 2). **Not accepted as is:** see P-B1.
3. The fonts port waits on `ready` in both cases (default 3). **Accepted:** `TablesPage` needs that wait. Wording: see
   P-R3.
4. The background-graphics hint removed (default 4). **Accepted.** `PrintPage`'s print rule sets
   `print-color-adjust: exact` on `:global(*)`, so every element of every layout prints its fills without the dialog
   option. Chrome, Firefox and Safari (with the `-webkit-` form) honor it. The 0-of-2,174,960-pixel PDF compare is
   consistent with that. Its script was in the implementer's scratchpad, so I could not re-read it, but the argument
   holds by construction. `printNote` is gone in both languages, and no reader is left (grep).
5. The dock's «Ещё» is `up` without `flip` (default 5). **Accepted:** this is the editor bar's form.
6. `flex-shrink: 0` on `.pc-strip` and `.pc-thstrip` (default 6). **Accepted:** it fixes a real 26.0 px strip under its
   26.7 px band.
7. Configured bundle limit raised to 328 kB (default 7). **Accepted:** 327.3 kB measured, rounded up by the rule, the
   reason in the comment, under 350 kB. For the unconfigured margin, see P-R2.
8. The before tops not measured again (default 8). **Accepted:** TD's 579 / 350 px stand. After: 233 px (360x640) and
   190 px (1180x720), RU = EN, `shipped: true`, case 83 green locally.
9. One 150 dpi PDF raster in place of four 300 dpi rasters (handoff Deviation 3). **Accepted:** `print.js` holds the
   PDF checks.
10. `previewScale` reused, so a card is up to 2.4 px narrower than its column (handoff Deviation 4). **Accepted:**
    centered, never wider, asserted in `print.js` and case 114.

Other items asked:
- **EN compact «Damage» 3.94 pt:** accepted. It is P-D5's named shortfall, smaller than before (3.1-3.7 pt in Segoe
  UI), named in FEATURES.md with its date. The rules-text floor (4.5 pt compact, 4.6 pt standard) is checked
  separately in the floors probe.
- **Crumb:** the editor DOM is unchanged (the 15 `#/homebrew/hb_` states moved only in the print preview's labels).
  `crumb.test.ts` ends with axe. `KeepNote`, `printChanged`, `keep*` and `printNote` have no reader left (grep over
  `app`, `tests`, `docs`, DESIGN.md). The decision-file mentions are historical.
- **Golden groups:** the `_p_set_*` diffs hold only the link-first crumb, the new labels, the sub line after the
  cards, no «Daggerheart», no hint or note, and the bottom-line move. The account six change only the four labels.
  The two editor print previews change only the labels. The two new phone states hold the dock and the open menu.
  Each group is the explained change.

## Standing checks

1. Scale: checked - `plan-P.md` Scale table against the code. One card, ten cards (the «Лист 2 из 2» label before the
   second sheet, screen only), the 180 cap (`printPage.test.ts`; `drawn` is one string, so one wait per render), the
   longest name, text and source; 360 px (233 px, the dock 67 px) and 1180 px (190 px). Finding: P-R1, the primary
   after every card under 481 px of height. Row order is unchanged.
2. Error scenarios: checked - no write path or stored shape changed (`dhloot.prefs.v1` and the account `printBw` /
   `printCompact` keep their shape; `printChanged` was a getter). A failed font load settles (case 115 "failed": the
   button enables and no spill). A failed copy is the existing error toast, now above the dock. A failed read
   (`ErrorPage`), a deleted record (the red note) and the gone, retired and sign-in states are unchanged and tested. A
   stale tab or a revert restores the old card; the burden files revert with the commit. No loss.
3. Consistency: checked - rule 4 (one label set on `/p/`, the editor's print view and the account: goldens and
   `accountPage.test.ts`); rule 9 (the primary first from 761 px, in the dock up to 760 px, written into the rule's
   text); rule 19 (the clip box); the editor siblings (`Crumb`, the bottom bar, `--ebar-h`). Findings: P-N3 (the toast
   under 481 px), P-N4 (the duplicated bar-height effect), P-N7 (DESIGN.md against default 2).
4. RU/EN parity: checked - `printInk` «Цвет печати» / "Print color", `printSheetN` «Лист %n из %m» / "Sheet %n of %m"
   (two numbers, no plural), the labels «Цвет», «Ч/б», «63×88», «44×63», «Напечатать» / "Color", "B&W", "63×88",
   "44×63", "Print" (American "Color"); `printNote`, `keep*` and `printChanged` deleted in both languages; case 114 and
   `print.js` run both languages. Note: P-N9.

Owner rules: checked - "Burden hands" (FEATURES.md "Print", the decision file; the deviation named in Status),
"Card bottom line" (FEATURES.md, `print.js`, two `why`s), QP.1/QP.4/QP.6-QP.8 and RP-1 (FEATURES.md "Print", DESIGN.md
"Signature component", the decision file), Q-P1 kept at 63x88 mm (no size line moved; `printSub` unchanged). Each is in
its home. The homes use task-scratch ids (P-N5).

## Suggested next action

Send P-B1 and the local nits P-N1 to P-N7 to the implementer as the one remediation cycle, with P-R1 (take the
recommended option unless the orchestrator decides otherwise) and the P-R3 wording. If P-B1's rectangle check finds an
intersection on `voa4_t4i` or `voa4_a3`, the implementer stops and returns the measured overlap, so the orchestrator
can log the owner's choice (AFK default: the named rules-text shortfall). Read P-R2 from the CI run of this tip before
the fix pass starts. P-N8 and P-N9 go to handoff Deferred.

## Checks still needed

- A render or a rectangle probe of `voa4_t4i` and `voa4_a3` on the RU compact color sheet (`dist-test/`): does a tag
  or a name line intersect the tier band, the burden mark or its label? The reviewer could not write the probe (P-B1,
  step 1).
- The CI run of `1ae45461`: the third `app/print` run, the `app/sweep` targets on `/p/` at 360, 390, 768 and 1180, the
  unconfigured `check:built` figure (P-R2), and `PrintCard.svelte` per-file coverage with the take-back loop
  unreached in vitest.
- `/p/` at 667x375 and 740x360 after P-R1: the dock in view, and the toast and the focus clear of it.
