# Review - N (57)

Verdict: fix-then-continue
Reviewed: cb581b666d050f071dac30dc4649eeb4fd72a794
Scope: batch N

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Diff read: `git diff 2986f75c cb581b66` (source, tests, specs, the handoff). Goldens by group: 139 files, 40 `_roll*`
(RU and EN), 56 `_tables*`, 41 `_homebrew*`, 2 new. Sampled: `_roll_alt`, `_roll_alt_narrow`, `_roll_std_more`,
`_roll_vault_of_ages_supplements_menu`, `_tables_wondrous`, `_tables_eq_weapon_mid_band`, `_homebrew_as_gm1`. Each
sample moves only the explained lines: the `h1` text, `navigation "Режим броска"` into `main` after the `h1`, the
pin and help after the chips' landmark, the tabs out of the landmark, the pills before the pin with the label's
trailing space. No `_lists*`, `_search*`, `_s_*`, `_account*`, `_i_*`, `_h_*` or `_p_*` file moved.

One browser probe ran (inline `node -e` against `dist-test/`, built 07:16 with `inhead` in the bundle; no file
written): focus a mode pill on `#/roll/std`, press Enter, read `document.activeElement`.

## Blockers

**N-B1 (blocking, local). From 761 px a mode switch drops the keyboard focus to `body`.** Probe result:

```
roll 1180 before A.mode "Альтернативные таблицы" | after BODY | /roll/alt
roll 768  before A.mode "Альтернативные таблицы" | after BODY | /roll/alt
roll 360  before A.mode "Альтернативные таблицы" | after A.mode.on "Альтернативные таблицы"
tables 1180 / 768: before A.chip "Альт. таблицы" | after A.chip.on "Альт. таблицы"
```

Cause: `App.svelte` draws `StdPanel`, `AltPanel` or a keyed `RollPanel`/`PickerRollPanel` per mode, so the
`RollPage`, its `PageHead` and the `ModeRow inhead` inside it remount on every mode switch. Before N, `ModeRow`
lived in `Shell` and survived a switch, so the pressed pill kept the focus at every width; at 360 px it still does.
The same loss hits a supplement picked in the «Дополнения» menu (the menu returns the focus to its button, and the
button unmounts). `/tables/*` and `/homebrew` keep the focus on the pressed sibling, so this is also a consistency
departure between the three sibling families (standing check 3). This is the part of acceptance 4 ("one `RollPage`
instance stays mounted") that Deviation 1 drops; `plan-nav.md` acceptance 4 states the intent ("keeps the focus on the
pressed pill"). A screen-reader user loses the place after each mode switch, and at 768 px the next Tab lands on the
pin, after the pills' slot. A GM uses a laptop about 80% of the time (context, "Devices during play").
Deviation 1's geometry-only outcome is acceptable for the visual part: case 112 (g) proves that the `h1` and the pill
row hold their place.

Fix, recommended (about 10 lines and one test): `ModeRow` notes a press on one of its own controls (an `OWN` link or
a supplement menu item) in a module-level flag (`<script module>`). The `inhead` instance reads the flag on mount:
when it is set and `document.activeElement` is `body` or `null`, it focuses its lit control (the
`[aria-current="page"]` link, or the supplements button on a supplement page) and clears the flag. Add a
`rollPage.test.ts` case at `wide` and at `mid`: focus «Альтернативные таблицы» on `#/roll/std`, activate it, expect the
lit «Альтернативные таблицы» to have the focus; the same for a supplement menu item, which expects the supplements
button. Trade-off accepted: a little module state in `ModeRow`.
Alternative, not recommended: draw one roll head above the panel branches in `App.svelte`. It restructures four
panels and their props for the same outcome.
The same fix pass should also cover the 760/761 px crossing: `RollPage`'s band effect restores a lost focus only when
the focus was inside the page, and the narrow `ModeRow` sits in `Shell`, outside it. Extend that check to
`nav.modes`, so a focused pill crossing 761 px lands on the same pill in the head.

## Risks

- **N-R1.** Thin first-screen margins that CI fonts decide: `#/homebrew as gm3` at 900x720 is 286.2 px against 288,
  and `/tables/*` at 900x720 is 333.6 px against its 336 px ceiling. The `/roll/community` RU row with the pin pressed
  at 1000 px has 14 px of room. N-D6 names the remediation for the roll row (an 8 px head gap from 1000 px). The
  other two have none named: if CI reads them over, the remediation should set the measured figure and name it,
  not loosen the limit.
- **N-R2.** The unconfigured bundle is 268.8 of 269 kB. This follows the rule, but batch P will very likely pass
  it. P raises it to the measured figure rounded up, under the 300 kB ceiling, in the same commit.

## Nits

- **N-N1 (local). Three orphaned dictionary keys in both languages.** Deviation 4 removed the `title` chain, and
  `pageVoa`, `pageMwt` and `pageArazo` now have no reader (`git grep -n -E "pageVoa|pageMwt|pageArazo"` finds only
  `dict.ts`). The pills and the tab title read `voa`, `mwt` and `arazo`. Delete the six lines (CLAUDE.md: no unused
  export).
- **N-N2 (local). FEATURES.md "Consistency rules", rule 4, states a departure that no longer exists.** The rule says
  "on Arazo's Artifacts the button and the menu read «Arazo's Artifacts», the tab title the book's full title". The tab
  title reads `SECTION_LABEL['roll/arazo']`, which is `arazo`: «Arazo's Artifacts». Before N the full title was the
  `h1`; now it shows nowhere. Drop the Arazo departure from rule 4. Also fix the `modeRow.test.ts` comment ("whose
  tab title is the book's full title"), and let the `it.each` include `roll/arazo`, because it now passes.
- **N-N3 (local). DESIGN.md "The First-Screen Rule": the `/tables/*` mid-band exception says "taken while the owner
  was away".** context.md item 12, ANSWERS (2026-11-05): the owner chose the named exception held to 336 px. Write
  "owner, 2026-11-05".
- **N-N4 (local). DESIGN.md "The Head Order Rule" and FEATURES.md "Tables and search" say that the catalog's chips
  wrap "up to about 1049px"**, but case 96 reads the 1050x720 RU rows at 287.5 px (two-line chips), and the next
  sentence says "From 1000px to 1139px". Write "up to about 1139px" in both files.
- **N-N5 (local). DESIGN.md "The Head Order Rule": "Up to 760px the heading is read, not drawn"** is true only for
  the pages with siblings. `/lists` and `/search` draw their `h1` at 360 px. Write "Up to 760px a page with siblings
  reads its heading, not draws it, ...".
- **N-N6 (local). The case 113 doc comment cites "owner item 12"**, an item number of the task's scratch context
  (CLAUDE.md, "Comments": only what resolves from a clean checkout). Cite the FEATURES.md "Rolling" bullet, or drop
  the clause.
- **N-N7 (local). `pageHead.test.ts` "moves the pills after the primary" does not test the lead's 12 px margin.** It
  always passes `below`, so `.page-head.navbelow + .page-sub` never matches. The comment ("The lead follows the head
  with the larger gap") describes the rule that the test skips. Add a case with no `below` that reads the computed
  `margin-top` of `.page-sub` (12px), or reword the comment (plan S2 step 5 asked for the margin).
- **N-N8 (local). The `TableNav` `part` doc comment lists three levels for two values** ("the group chips, the page
  head's pills, or the tabs under the head"). Write "the group chips (the page head's pills) or the tabs under the
  head".
- **N-N9 (local). Dead CSS in `HomebrewTabs`: `.sheetlinks .tab { border-bottom: 0 }`** resets a border that no
  `.tab` rule sets any more.
- **N-N10 (local). The `tools/bundle-budget.mjs` comment does not state the measured configured total.** It reads
  "325.7 kB ... before the one head order on every page added 0.5 kB to both", which gives 326.2, while the
  measurement was 326.3. Write "326.3 kB here (325.7 before)".
- **N-N11 (local, the orchestrator's). `handoff.md` leaves two facts to "the implementer's report"**: the batch sha
  (`cb581b66`) and the result of the second `check:fast`. Definition of done: the handoff records exact results.
- **N-N12 (deferred-scope). `docs/decisions/2026-11-04-the-table-head-is-set-by-the-band-not-the-table.md` cites
  DESIGN.md "Layout", "A steady head"**, which N replaced with "The Head Order Rule". Update the pointer if the
  decisions convention allows it, else leave the record as it is.

## Deviations

1. Acceptance 4, "one `RollPage` instance stays mounted": not built. The geometry outcome is accepted (case 112 (g)).
   The lost focus is not accepted: N-B1.
2. The S1 DOM-move probe was not drawn, and the built page was measured instead: accepted for the figures the
   handoff gives. The 3x counts at 1000 px RU and 1050 px were not measured, so they go to "Checks still needed".
   1920 px shots exist in `mocks/N/built/`.
3. `.page-below` 10 px and the lead under a mid-band head 12 px, set at the collapsed margins: accepted. The
   measured gaps are the brief's.
4. The `title` prop left the whole chain: accepted. It leaves three orphaned keys behind: N-N1.
5. The two new states carry `width: 768` only: accepted (a golden is a tree, so the height does not matter).

Acceptance lines: 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 and 17 hold in the diff. 16 (`polish`, `harden`) is
the orchestrator's. Line 4 is partly met (N-B1).

Specific asks of the dispatch:
- Landmark and name order: `main` > `h1` «Бросок» > `navigation "Режим броска"` (from 1000 px) > the pin > the help,
  per the goldens. At 761-999 px the order is `h1`, pin, help, primary, then the pills: the owner's option A, with the
  DOM order equal to the reading order (case 112 (c)). `aria-current="page"` is on the lit link or the supplements
  button. The pin keeps `aria-pressed`, and no lit pill draws a check (case 112 (h), `chip.test.ts`).
- Die marks: `--hope` `#e9b949` and `--fear` `#8a72d6`, not `--gold`. The violet on `--surface` is about 4.6:1, over
  the 3:1 for a graphic. There is no letter, the box is `aria-hidden`, and the word stays the label text. The field
  name «Кость Надежды: Результат броска» is asserted (case 113, `alt.test.ts`).
- `/tables/*` 334 px exception: DESIGN.md names it with a 336 px ceiling, and case 112 (e) asserts 336 at 900x720 and
  410 at 768x1024. Measured 333.6.
- Budget: configured 326.3 kB to a limit of 327, the measured figure rounded up and under 350, written in
  `tools/bundle-budget.mjs` and `.claude/README.md`. Unconfigured 268.8 of 269.
- Removed keys: `hopeLetter` and `fearLetter` have no reader in either language. The removed `title` chain has no
  reader left. Its keys `pageVoa`, `pageMwt` and `pageArazo` are orphaned (N-N1).
- Target sweep: the new pills are `Chip` links and `.mode` (padding 7 px, about 32 px tall) from 761 px only, over the
  24 px floor. Up to 760 px the narrow picker and the narrow mode row are unchanged (40 px). The level 3 tabs are
  unchanged. `TARGET_ALLOW` is unchanged. The implementer's probe on the 12 head pages is clean at 1180, 768, 360 and
  390. The full 768 and 1180 sweeps are CI's.
- Cases 112 and 113 fail before the batch (the old `h1` text, the pills outside `main`, the letters with no
  `svg.dieicon`) and pass after (handoff, Verification).

## Standing checks

1. Scale: checked - the plan's States table against the code. The pill order is fixed (`OWN`, `TABLE_NAV`, `TABS`).
   `.headnav` shrinks to its widest pill and wraps inside its box. At 1000 px the widest content (RU, the pin
   pressed, the longest supplement label) has 14 px of room, as measured. No sticky region was added. The homebrew
   3x counts were not measured (Deviation 2), so they go to "Checks still needed". At 360 px nothing changed.
2. Error scenarios: checked - nothing is stored. The pin's write path is unchanged. While `/homebrew` loads or
   fails, the head has no `nav` and no `extra` (`ready` guard). A stale tab or a revert reads the same
   `dhloot.home.v1`. No loss.
3. Consistency: checked - the three sibling families against FEATURES.md rules 4 and 9 and DESIGN.md "The Head
   Order Rule". Departures: N-B1 (the roll pills lose the focus, the catalog and homebrew pills keep it) and N-N2
   (rule 4 names a departure that no longer exists).
4. RU/EN parity: checked - `dict.ts` diff, the RU and EN golden pairs, `i18n.test.ts` in the handoff. There is no
   new string. Two keys left both languages, and three keys are orphaned in both (N-N1). The `h1` reads «Бросок» /
   "Roll", and the counts are tabular in both languages.

Owner rules: checked - The Head Order Rule is in DESIGN.md "Layout", "Named Rules", in the place of "A steady head",
inside the budget. The item 12 die mark is in DESIGN.md "Tertiary" and "The Seal Rule", and FEATURES.md "Rolling".
The `/tables/*` exception is in DESIGN.md "The First-Screen Rule" (its attribution is wrong: N-N3). The budget rule is
in `tools/bundle-budget.mjs` and `.claude/README.md`.

## Suggested next action

One remediation pass from `cb581b66`: N-B1 with its test, then the local nits N-N1 to N-N11. Gates: the touched
vitest files one at a time (`rollPage`, `modeRow`, `pageHead`, `i18n`), `node tests/run-all.js contracts,derived`,
`check:built`, `check:fast` last, and push. No golden should move, because the focus and the comments are not in the
tree and the removed keys are not drawn. If a golden moves, name it. Then continue with batch P after CI is green.

## Checks still needed

- CI's run of `cb581b66`: `app/sweep` 768 and 1180 (targets, spacing), case 112 at 1000 px RU with the pin pressed
  (N-D6), case 112 (e) homebrew at 900x720 and `/tables/*` at 900x720 (N-R1), all golden shards.
- The homebrew pills with 3x counts («Предметы 300», «Источники 60», «Комплекты 300», «Карты правил 300») at 1000x720
  and 1050x720 RU: one head row and no sideways scroll (Deviation 2).
- After the N-B1 fix: a keyboard pass on `/roll/std` at 1180 and 768 px (Enter on a pill, then a supplement from the
  menu, then Tab) and a screen-reader announcement check.
- The orchestrator's `polish` and `harden` on `/roll/alt`, `/tables/eq_weapon` and `#/homebrew` (acceptance 16).
