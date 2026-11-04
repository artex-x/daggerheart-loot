# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress (waves 1 and 2 are on `main`; batch 7b, wave 2b, is implemented on `claude/57`; next
  are its `polish`, `harden`, review, fix cycle and CI, then the wave 2b squash, then batch 9a)
- Last agent: implementer (batch 7b, 2026-11-04)
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Previous sha: `377d0981` (the CI run of `cd32174d` green)
- Pushed: the batch 7b commit; the sha is in the implementer's report.

## Completed
- Batch 1 - foundation: `9a31aede`, review fix `80872b35` (`reviews/1.md`).
- Batch 1b - no-picture placeholder retired: `fce4a9f8`, merge `3e5f6301`
  (`reviews/1b.md`, approve, no finding).
- Batch 2 - shell, the vault-die mark, American spelling: `30de6bf5`, fix pass
  `65829261` (`reviews/2.md`, approve). Deviations: a manual polish and harden
  pass in place of the Impeccable skill (2-R1; section 10 of `plan.md` now names
  the orchestrator-run fallback); the spelling sweep ran through a one-off
  script; the brand row at 360 uses tighter spacing; the supplements menu is
  right-aligned; the C34 and A15 live-site toast check moved to the
  post-release review.
- Wave 1 - batches 1, 1b, 2 squashed onto `main` as `d83384b4` (2026-10-30);
  `claude/57` merged it back as `51370bf8`.
- Batch 3 - catalog tables and filters: the list head, the filter column and
  sheet, the neutral «Все», the selection mode and the one bar, two-level
  navigation, «Об этих данных», the two-column grid, the search highlight and
  the empty-state plate. New: `viewport` port, `Sheet`, `SelectionBar`,
  `FilterPanel`, `TableNav`, `rowTags.ts`, the decision file
  `2026-10-30-list-pages-share-one-head-and-one-selection-bar.md`.
- Batch 3 fix pass (`reviews/3.md`, verdict fix-then-continue): B1-B5, R1-R7, N1-N6, N8,
  polish and harden items 1-3, and the CI coverage failure of `ef44bb5d`. Files changed:
  `rowTags.ts`, `tables.ts`, `icons.ts`, `dict.ts`, `help.ts`, `TablesPage`, `TableNav`,
  `SelectionBar`, `SelBar`, `FilterPanel`, `RowMain`, `Sheet`, `KeepNote` (comment),
  their tests, `tests/app/states.js` (cases 84, 85), `tests/app/contracts.js` (comment),
  `FEATURES.md`, `COVERAGE.md`, 30 goldens.
- Previous sha (fix pass diff base): `ef44bb5d`; batch 3's own base was `f150d7fd`.
- Acceptance lines of `plan.md` section 10:

  | Line | Outcome |
  |---|---|
  | List head at 360 and from 761 px, filter column from 1000 px, `h1` always | Done: `tables.test.ts`, goldens, `sweep.js 360` |
  | «Выбрать» opens the mode, «Снять выделение» leaves it, focus both ways | Done: `tables.test.ts`, `selectionBar.test.ts` |
  | The bar: «Все», summary, actions, clear last, zero ticks | Done, with deviation 2 below. C12 closed: `--selbar-h` scroll padding, 0 covered focus stops at 360 and 1180 |
  | Filter row «Все» neutral, picked value gold, no `любое` | Done: `filterPanel.test.ts`, `chip.test.ts` (axe) |
  | Count line | Done: goldens `~ two filters`, `app/states` |
  | Filter sheet | Done: `filterPanel.test.ts`, `sheet.test.ts`, three sheet goldens |
  | Labeled table, filter and section links; none on `homebrew` | Done: `tables.test.ts` |
  | Navigation labeled at both levels; three taps through the picker | Done: `tableNav.test.ts`, `tables.test.ts` |
  | «Об этих данных», three notes | Done: `help.test.ts` |
  | View switch «Список» / «Сетка», no note | Done; `KeepNote` draws only on `/p/` |
  | Rows, `rowTags`, highlight (P1, A40, C59) | Done: `rowTags.test.ts`, `search.test.ts`, goldens |
  | Grid (C56, C58, P15, D11) | Done: `tables.test.ts`, evidence `catalog-grid` |
  | Empty state (D12) | Done: `tables.test.ts`, evidence `catalog-nothing` |
  | Correct at 360, 390, 768, 1180 | 360 re-run on the final tree; 768 clean on 2026-10-30, 390 and 1180 are CI's |
  | `routes.json` unchanged, `app/contracts` passes | Done |
  | Each new state has an entry, a golden and an axe case | Done: nine new goldens, four retired |
  | Inherited: N1 and N3 hold; 2-R1; 2-N5 and 2-N6 | N1, N3 hold (no "labelled" in `DESIGN.md`, `FEATURES.md`); 2-R1 answered by the orchestrator's run; 2-N5, 2-N6 stay deferred to batches 5 and 10 |
  | `FIRST_SCREEN` rows `shipped: true`; DESIGN rules; detector; spelling; screenshots | Done, see Verification |
  | `polish` and `harden` outcome | Run by the orchestrator; items 1-3 fixed as `reviews/3.md` amended them, item 4 replaced by R2 |
  | Gates pass and CI green on the tip | Local gates pass; CI of the fix commit is the orchestrator's wait |

- Q3-S (owner, `context.md`): the catalog's per-section «Выбрать все (N)» strip is
  removed; the bar's «Все» is the one select-all control there. `/search` and
  `/s/` keep their strip until batches 7 and 9 (`ontoggleall`).
- Deviations and rationale:
  1. `data-primary` sits on the table column, section heads included, not on each
     `TableRows`: the first section head is where the table starts. Accepted, and
     load-bearing: the first row itself starts near 270 and 288 at 360, past the 256 limit.
  2. The bar keeps «Добавить в список»: batch 4 owns «В список». Accepted under the interim
     rule. Plan lines 947 and 1242 stay unmet in batch 3, so batch 4's refresh gives the
     bar's label its own acceptance line.
  3. `hiddenTags` returns a fourth flag, `core`.
  4. The bar draws no «Все» on a page that registers no rows (`/homebrew`, lists).
  5. The mid-band head cap in `sweep.js` is 140 px, not 110: measured 130 px.
     `FEATURES.md` says the same.
  6. Added at S15: the picker CSS. Accepted as CSS, but it did not close the defect: B4
     did, in the fix pass (deviation 7).
  7. B4, named departure from mock 3 and from the review's option: the picker is two lines
     at `--t-small`, the book in `--muted` over the table (`pickerParts`). Reason: the
     review's two lines at `--t-body` were built and measured, and 8 of 18 RU captions still
     cut («Расходники» and «Environments» broke inside the word in 80 px). The row now
     leaves 94 px (gap 4 px, «Ещё» padding 7 px). No caption cuts at 360 in RU or EN, and the
     offset stays 234. Accepted: the only visible page name below 761 px is 14 px, not 20.
  8. R5, departure from plan section 10, standing check 1: no `max-height: 45dvh` and no
     scroll. Measured 189 px at 640x360 against a cap of 162. A scroll would clip the add
     menu, so below 481 px of height the actions share one line. Case 85 holds it.
  9. R7: the search row stays across the page above the column, not in the rows column as
     in mock 3 (offset 244 against 269). From 1000 px the row draws the count alone.
  10. R6: the 300-item row's fixture draws 199 rows in its first source tab, because
     `fillItems` spreads the items over the sources. The test asserts that tab.
- CI of `ef44bb5d` failed on coverage only: `KeepNote.svelte` branches 50%, because batch 3
  removed its table caller and left the no-cloud branch unreached. Fixed with a test in
  `printPage.test.ts`; no threshold changed. `check:fast` missed it because it measures
  coverage only on changed sources (`--coverage.include`, `tools/check/fast.mjs`), and
  `KeepNote.svelte` was not changed: a file that loses reach through its caller shows only
  in CI's whole run.
- Batch 3b - the hide-and-show header and the focus fix (`plan-3b.md`). New: `lib/headerScroll.ts`,
  `ports/scroll.ts`, the decision file `2026-11-03-the-header-hides-on-scroll-down-up-to-760-px.md`,
  `DragPort.active()`, `--sticky-h`, `--anchor-gap`. Acceptance lines:

  | Line | Outcome |
  |---|---|
  | Hides past its height and 10 px down, returns 10 px up, no layout move; nothing hides from 761 px | Done: `headerScroll.test.ts`, `shell.test.ts`, case 86 |
  | Anchors land at most 40 px under a shown header | Done: case 86 at 360; `sweep.js` at 360, 390, 768 is CI's |
  | Focus into the header: top 0, hit at center | Done: case 86 |
  | Text field freezes it; a checkbox does not | Done: `shell.test.ts`, case 86 |
  | Menu, sheet, dialog freeze it; the first scroll after a close does not jump | Done: `shell.test.ts` (menu role, `dialog[open]`, `app.menuFor`), case 86 («Ещё», the sheet, the record dialog) |
  | Drag auto-scroll freezes it | Done: `ports.test.ts`, `shell.test.ts` |
  | iOS bounce clamped | Done: `ports.test.ts`, `headerScroll.test.ts`; a real device is not verified, the post-release check owns it |
  | Reduced motion | Done: case 86, `0.2s` and `transitionend` relaxed, `0s` restored |
  | Short pages | Done: `headerScroll.test.ts`, case 86 on `#/i/nope` |
  | Navigation reset, band change | Done: `shell.test.ts`, case 86 (`d.go`, Back). Forward and a reload: case 86 |
  | Print | Done: case 86 |
  | Port reached by tests; no `scrollY` outside `app/src/ports/` | Done: `ports.test.ts`; `git grep` for `scrollY` and `pageYOffset` hits only `ports/` |
  | Focus fix, 0 covered in 30 stops, fails without the fix | Done: case 87 and the probe under Verification |
  | Hidden state: inventory entry, RU and EN golden, axe | Done: `~ header hidden`; `shell.test.ts` ends in `expectNoA11yViolations` |
  | No other golden moves | Done: `git status` shows one new file |
  | `FIRST_SCREEN` unchanged | Unchanged in code; case 83 is CI's |
  | Specs, DESIGN rules, decision file | Done: S8 texts as written in the brief |
  | Detector, spelling, screenshots | Done, see Verification; `polish` and `harden` are the orchestrator's after this commit |
  | Deferred names the focus jump | Done |
  | Gates pass, CI green on the tip | Local gates pass; CI of the tip is the orchestrator's wait |

- Batch 3b deviations:
  1. The new browser cases are 86 and 87: batch 3's fix pass took 84 and 85.
  2. The golden is one file, not the brief's two: a state keeps both languages in one file.
     Confirmed: `_tables_eq_weapon_header_hidden.txt` holds `## ru` and `## en` sections.
  3. `live = false` sits in `drag.ts`'s `unlisten`, not `reset`: an unbind in the middle of a
     drag would otherwise leave the header frozen.
  4. `COVERAGE.md` and the header of `states.js` give the real count, 78 cases in 77 runs, not
     71 + 2, and `COVERAGE.md` gains the missing cases 84 and 85.
  5. Budget (orchestrator's decision, under the owner's standing rule): `tools/bundle-budget.mjs`
     rises to 254 kB unconfigured and 312 kB configured. Measured 253.6 (from 252.8 at `cd36b52f`)
     and 311.0 kB; 311.1 on CI's `e2e` job passes 311 by 0.1 kB, so the configured limit rises too.
     `.claude/README.md` follows.
  6. The two new browser cases ran locally once, through an in-memory loader, outside the
     dispatch's list: both passed.
  No departure from mock F: the header draws as in mock 2, in or out of the window.
- Batch 4 - record card, actions, item page, dialog, `/h/` (`plan-4.md`). New: `DialogClose`,
  `ErrorPage`, `NoItem`, decision file `2026-11-04-the-record-page-is-a-dossier-with-one-more-menu.md`,
  `d.more`, `d.openMore`, the golden `again` field, fake-cloud holds `item` and `own`. Acceptance:

  | Line | Outcome |
  |---|---|
  | New states with entry, golden, axe | Done: seven new states (below); axe in `pickRow`, `recordHost`, `itemPage` tests |
  | C63, the backdrop covers the window | Done: `dialog[open]` fills the window (345x640 and 1165x720: the headless scrollbar takes 15 px; `::backdrop` covers all), shots `dialog__*` with the page behind |
  | Clarity N11 | Done: `pickRow.test.ts`, `#/i/ci1 ~ save signed out` |
  | Action row, nothing cut at 360, 320 | Done: case 88 |
  | No neutral `Button` variant; «Ещё» not pressed | Done |
  | No «Daggerheart» on the screen card | Verified: `git grep Daggerheart -- app/src/components/RecordCard.svelte` is empty |
  | M4-2 | Done: `dict.ts`, `FEATURES.md`, `pickRow.test.ts` |
  | M4-3 | Done, deviation 3: `ITEM_H ~ read failed`, `#/i/<HB_AXE> ~ read failed as gm1`, `#/i/<HB_AXE> as gm1` |
  | M4-4 | Done: `RecordCard` CSS, DESIGN "Shapes" |
  | The bar's label | Done: `t.toList` in `AddToList`, bar goldens; `QuickItem` keeps `addToList` |
  | N0-2, `ErrorPage` | Done: `itemPage.test.ts`, `record.test.ts` |
  | `/i/nope`, `/h/` not found | Done; old list links keep `notFound` |
  | C17, C18, C19, A23, C20, P4, C44, C22, C46, A24, P6 | Done: `record.test.ts`, `pickRow.test.ts`, case 88. C22 and C46: case 88 reads the chevron, shots `rule-card` and `rule-card-open` show it |
  | P5 not changed | Done: Deferred; `plan.md` batch 10 has its line |
  | Focus, Escape, first button | Done: `pickRow.test.ts`, `recordHost.test.ts` |
  | Header frozen by the menu and dialog | No change; case 86 passed alone (see Verification) |
  | Dock | Done: case 88 |
  | `FIRST_SCREEN` | Rows `shipped: true`; figures under Verification come from CI's case 83 |
  | Artwork guard | Done: `CARD_HEAD_SHA256` set after reading `renderCard`, which builds the compact head by hand and needs no edit. The full card's size is not a `REVIEW_ART_SIZES` row |
  | New components with axe rows | Done: `COVERED`, three rows |
  | Specs, DESIGN, decision, pointer | Done |
  | Detector, spelling, shots, `routes.json` | See Verification; `polish` and `harden` are the orchestrator's |
  | Budget | See Verification |
  | CI green on the tip | The orchestrator's wait |

- Batch 4 departures and deviations:
  1. New `NoItem.svelte`, not in K6: the not-found page has two callers, so it is extracted
     (`CLAUDE.md`), and `ErrorPage` stays generic.
  2. Menu side, departure from K1 and S2: `up` does not force the menu up. In the dialog it opens up
     only where the room is only above. Reason: from 761 px the row can sit near the card's top, and
     a menu opened up leaves the scroll box and cannot be reached; a scroll box grows only downward.
     So the dock at 360x640 opens up, and at 640x360 the menu opens down from the row (not up, as
     case 88's brief text read). Measured against `offsetParent`, the menu's anchor.
  3. M4-3: no `/h/` failed state existed, and `items:fail` does not reach the `/h/` read or the own
     items read. The fake gains holds `item` and `own`; two new states, not re-seeded ones.
  4. Golden `again` field: the press on «EN» is a click outside and closes a `Menu`, so the EN half
     of a menu state reopens it. Without it the EN golden holds no menu.
  5. Up to 760 px `.morewrap` is static and the row anchors the menu: a wrapped «Ещё» at the row's
     left would push a right-aligned menu off the window (author's row at 360 and 320).
  6. `.recmenu { width: max-content }`: the wrap is as narrow as the button, and items wrapped.
     `align-items: flex-start` of S6 is not built: the icons sat too high on one-line items.
  7. The dialog's close from 761 px is sticky (height 0), not absolute: a long text keeps it in view.
     `top: -12px` because Chromium counts sticky `top` from the content box of a padded scroller.
  8. The short dock stays `position: relative`, not `static` (K16): it remains the menus' anchor.
  9. `PickRow` scrolls the open menu into view (`block: nearest`): at the window's bottom it opened
     past the fold. `AddToList` measures `.card:not(.dossier)`: a dossier does not clip.
  10. `Menu` skips disabled items in its arrow keys: a disabled save item stopped the focus.
  11. Case 78's second press goes by keys: the first toast covers the end of the menu at 360, so a
      click lands on the toast. Accepted for the toast's 7 s, as the toast over the selection bar.
  12. `ErrorPage` text and `.subline` CSS live where one copy serves both pages (`RecordCard`).
  13. Outside the dispatch's gates: cases 3, 9, 10, 11, 22, 23, 42, 78, 86, 88 ran once through an
      in-memory loader, because 78 and 88 are new and could not otherwise be checked before CI. They
      found three defects, fixed here. The rest of `app/states` was not run.
- Batch 4 remediation (`reviews/4.md`, verdict fix-then-continue). Outcomes:

  | Finding | Outcome |
  |---|---|
  | B1 | Fixed: F8 presses «Сохранить себе» with `d.press` on `/s/` |
  | R1 | Deferred, with its three options (Deferred below) |
  | R2 | Accepted, no change |
  | R3 | Fixed: `d.more(name, wait)`; F20 passes `WAIT` (20 s) |
  | N1 | Fixed: `RecordCard` draws `.badge.num` and `.badge.src` only without `sub`; `FEATURES.md`, goldens, `CARD_HEAD_SHA256`. `renderCard` needs no edit: the compact head keeps both |
  | N2 | Fixed: padding 11 px and gap 6 px up to 760 px, the insets of `.btn.sm`. The review's 5 px a side left 5.6 px over in the headless window's 313 px row; case 88 holds two lines at 360 |
  | N3 | Fixed: `PickRow` sets the menu's `top` from the button. The wrapper is not built: the dock's grid reads the row's children. `pickRow.test.ts`, case 88 |
  | N4 | Fixed: `#/i/mw9` closed and open in `shoot.js`, the chevron assertion in case 88 |
  | N5 | Fixed: `up` is `flip`; case 88 runs the dialog at 1180x720, `sticky` false |
  | N6 | Fixed: `ItemPage` sends the focus to `#main` after the press; `itemPage.test.ts` |
  | N7 | Fixed: the clause is in "The Seal Rule" |
  | N8 | Fixed, except the CI figure of the configured budget, which waits for the re-run |
  | N9 | Fixed: `ErrorPage` cites "Error page" |

  `plan-5.md`, `plan-6.md`, `plan-7.md`, `reviews/4.md` and `reviews.md` go into this commit.
- Batch 5 - the roll pages and the card face (`plan-5.md`). New: `RollPage`, `RollResult`, `RollSelect`,
  `MoreMenu`, `PinItem`, `HelpItem`, `narrowedLabel`, `d.part`, `d.openCardMore`, `d.openCardList`, the
  decision file `2026-11-04-the-roll-pages-share-one-layout-and-results-draw-the-card-face.md`. Acceptance:

  | Line | Outcome |
  |---|---|
  | Q5.1, four placement lines | Done: `help.test.ts`, `std.test.ts`, `~ help` golden |
  | N2, `<img src>` in `orGrid.test.ts` | Done; detector below |
  | Dice at 360 and from 761 px, none gold or lit | Done: `std.test.ts`, case 89, `hues.js` |
  | `/roll/std` exception 325; four new `FIRST_SCREEN` rows | Done: rows `shipped: true`, offsets below; assertion is CI's case 83 |
  | M5-7 face at 601 px, 96 px below | Done: `record.test.ts`, case 89, DESIGN "Cards" |
  | N2-2 nine help names | Done: `help.test.ts`, goldens |
  | No «Daggerheart» on the roll cards | Verified: `git grep -n Daggerheart -- app/src/components/RecordCard.svelte app/src/components/RollResult.svelte` is empty |
  | M2-2, R2-1, the read-only `h1` on nine pages | Done: `rollPage.test.ts` (`it.each` over the nine), case 89 |
  | F1 head on one line at 761 | Done: measured below; `PageHead` needs no change; case 89 |
  | `FEATURES.md` "Chrome" names the read-only `h1` | Done |
  | 2-N5 | Done: `i18n.test.ts`, `_roll_alt*` and `_account*` goldens; the group chip keeps `alt` |
  | C23, C25, C26, C36, C38, C39, C41, C43, C49, P10, P11 | Done: `alt.test.ts`, `std.test.ts`, `orGrid.test.ts`, case 89 |
  | C24 | Done with deviation 4 |
  | M5-4 crit links | Unchanged code; `alt.test.ts`, `~ crit` goldens |
  | M5-6 lit «Настроить» | Done: `std.test.ts`, `~ items only, set up` |
  | N5-2 «Бросить 1-30» | Done: `roll.test.ts`, deviation 1 |
  | New states: entry, golden, axe | Done: seven states; axe in `rollPage`, `rollResult`, `rollSelect`, `a11y` tests |
  | Focus rule 20, Escape | Done: `rollPage.test.ts`, `rollResult.test.ts`, cases 89, 90; case 86 is CI's |
  | Error states | Done: `roll.test.ts`, `rollResult.test.ts` (a failed copy) |
  | Three extractions leave the DOM alone | Done: no `_tables_*` or `_i_*` golden moved for them |
  | Axe rows, reached by a test | Done: `COVERED`, six rows |
  | Artwork guard | Done: the new row; `CARD_HEAD_SHA256` set, because the name link's condition moved to `variant !== 'full'`; `renderCard` builds the compact head by hand and needs no edit. The review page draws the whole picture at 380 px, so it overstates the height |
  | Specs, DESIGN, decision | Done |
  | Detector, spelling, shots, `routes.json` | See Verification; `polish` and `harden` are the orchestrator's |
  | Budget | See Verification |
  | CI green on the tip | The orchestrator's wait |
  | Inherited: F18 of CI run 41778683447 (`4cfe9d91`, job `e2e`) | Fixed: signed out the item carries a second line, so `waitControl`'s `textContent` read never equals «Сохранить себе». F18 presses it with `d.more(name, WAIT)` and reads the sign-in prompt. F19 touches no moved control; F20 already uses `d.more`. Not runnable here: CI's `e2e` is the proof |

- Batch 5 remediation (`reviews/5.md`, verdict fix-then-continue; CI run 41790682272):
  - B1, confirmed in the built app on `9d4f47ec` (`/roll/wondrous_environments` as gm4, 1180 and 360:
    `aria-expanded` false, no `.dropmenu`). `AddToList` takes `menuScope`, which prefixes the open
    menu's name; `RollResult` passes `roll-{col ?? 0}`. Two departures from the review's text: `slot` is
    a Svelte attribute, and a whole-name prop (`roll-{it.id}-...`) is a derived in the parent that reads
    `it` while a part change empties the result, which `sections.test.ts` caught.
  - R1: `inModal` on `AddToList` is now `returnToRecord`; `RollResult` sets it. One more local defect:
    a roll with the menu open left `menuFor` set, because the card leaves before the click reaches the
    document, so the header stopped hiding (measured at 360). `AddToList` clears its name on destroy.
  - CI: `.lbl` is the `.vh` rule under a media query, with no real clip, so `sweep.js` skips
    `clip-path: inset(50%)`. `RollSelect`'s `select` takes `font: inherit`. Case 31 was a real defect,
    against the review's deviation 2: the badge row ends on the picture's bottom edge and covers the ring.
    From 601 px `.card.face` repeats the ring above the body; the case is unchanged.
  - N1: "The Action Vocabulary Rule" is merged into "The Dossier Rule", because the rule has no
    citation and both name the record surfaces; "Layout" holds 8 rules. The pair the review named is
    not merged: the Same Label Rule has code citations and another subject.
  - N2, N3 in `DESIGN.md`; N4 in `hues.js` (a die's fill equals «Ещё»'s); N5 and the B1 press in case 90;
    N6 in case 89 (`showLongestTitle` steps the number field to the row, then `brokenWords`); N7 in
    `RollPanel` and `FEATURES.md`; N8 in `COVERAGE.md`, both READMEs (the pin's wording too), `alt.ts`,
    `RollResult`; N9 below.
  - Tests: three new `rollResult.test.ts` cases, all three failing at `9d4f47ec` in a detached worktree.
  - `polish` and `harden` of batch 5 (S13): the outcome is under Notes.

- Batch 5 departures and deviations:
  1. `rollLabel` has two callers, so `ListPage`'s roll button reads «Бросить 1-N» too, against the brief's
     "no list golden moves": 23 `_lists_*` goldens move by that one line. One action keeps one
     label, and the other way needs a second function and `randomIn` until 9b.
  2. The picture of the face sits at `z-index: -1` in the card's own stacking context, and the body is
     not positioned. The brief's positioned body anchors the number badge to the body, not the card.
     The fade goes while the picture has the focus: it would take the ring's bottom edge (case 31).
  3. The add menu of a result opens down, and up where the window has no room (`.cardpick`'s rules),
     against "nothing is added": the base rule opens up only, and a long list then passes under the
     header. Up to 600 px the row anchors it, so it takes the row's width.
  4. C24: the rarity comes before the roll button in the DOM, as in the mock; it is the button's input.
     The roll button is the first action, the manual entry is in the settings.
  5. `MoreMenu` has `flip`, not `up`, and carries `underMore` and the `scrollIntoView` effect from
     `PickRow` (batch 4's landing). It has no `label` prop: nothing needs one.
  6. `RollPage` draws the shared `Panel`, not a `.plate` copy. `RollSelect`'s `select` carries
     `aria-label`, and its two text lines are `aria-hidden`, so a reader hears the name once.
  7. `rarityLine` stays as the helper of the four paragraphs. `BR`, `HelpBreak` and `isBreak` went, with
     `randomIn` and `Chip`'s `sub`. `RARITY_TIERS` stays: `rarityLabel` reads it.
  8. `#/roll/alt ~ crit` opens «Настроить» around its press when it runs narrow: case 83 enters it at 360.
  9. Coverage: `DiceBar` lost its carve-out (its text now goes through functions, so it has no branch
     left), and `RollSelect` takes one at 50 for its `value` paths: `?? ''` on a string and an update a
     keyed option never takes. `vite.config.mts` and `COVERAGE.md` name it.
  10. The label over the Vault of Ages select stays the existing «Раздел книги», not the mock's «Раздел».
- Batch 6 - homebrew editor, pages and imports (`plan-6.md`). New: `HomebrewTabs`, `HomebrewBulk`,
  `d.tickNames`, the `more` argument of `d.openMore`, the `upload` icon, cases 91 and 92, the decision file
  `2026-11-04-the-homebrew-pages-share-the-list-head-and-one-selection-bar.md`. Acceptance:

  | Line | Outcome |
  |---|---|
  | Q6.1, no homebrew help | Done: `homebrewPage.test.ts`, `help.test.ts`; `~ help open` gone |
  | Q6.2, the eight «?»; Q6-1, the two `CardForm` «?» | Done: `homebrewEditor.test.ts`, `homebrewPage.test.ts`; captions under «Источник» on both forms; rules 15 and 18 changed |
  | Preview bug | Done. Reproduced first on the unchanged tree: `expect(card.querySelector('.badge.eq-weapon')).toHaveTextContent(...)` failed on null, the card stayed «Предмет». The new test passes with `eqType` |
  | A28, head and tabs | Done: `homebrewTabs.test.ts`, `homebrewPage.test.ts`, case 91 |
  | Filter system on the Items tab | Done: column from 1000 px, sheet below, no pill; case 82 adapted |
  | Round 3 unit B, round 6 | Done: marker `div.hbrows`, no plus at 360, plus from 761 px |
  | A40, one bar, bulk actions | Done: `homebrewPage.test.ts`, `homebrewBulk.test.ts` |
  | A29 | Done: two controls on a named source |
  | A38, theme 8 | Done: three plates; a failed read keeps `LoadState` |
  | A13, D16 | Done: `homebrewImport.test.ts`, `~ import` goldens |
  | A6 | Done: groups, sticky bar, sheet, pairs from 1000 px; case 92 |
  | A7, D15 | Done: five own messages, full damage words; the English damage message is short enough for two lines at 360 by `hbErrDmg` |
  | A8 | Done, deviation 2 |
  | A9 | Done: the tap is built. Probe under Verification |
  | A30 | Done: `homebrewEditor.test.ts` |
  | A11 | Case 92 asserts the sticky column from 800 px; CI's |
  | D5 | Done: `homebrewPage.test.ts`, `tables.test.ts`; D14 closed as by design (decision file, Accepted) |
  | M2-2 | Done: no `.homebtn` up to 760 px, pin in «Ещё» |
  | Seg rule | Done: `hues.js` reads it; CI's |
  | New states | 14 entries: see Verification; axe in the component tests |
  | Focus, rule 20 | Done: `homebrewTabs`, `homebrewBulk`, `homebrewPage`, `homebrewEditor` tests |
  | `FIRST_SCREEN` | Rows `shipped: true`, offsets under Verification; assertion is CI's case 83 |
  | Axe rows, artwork guard | Done: `COVERED` two rows; `node --test tools/artwork/lib.test.mjs` passes, `CARD_HEAD_SHA256` did not move |
  | Specs, DESIGN, decision | Done |
  | Detector, spelling, shots, `routes.json` | See Verification; `polish` and `harden` are the orchestrator's |
  | Budget | See Verification |
  | Inherited 5-R2 | Done: `.results` carries no role; `RollPage` draws a hidden status that names the rolled records, re-keyed per roll; `alt.test.ts`, `std.test.ts` |
  | Inherited 5-N10 | Done: «(1-30)» with a hyphen in `StdPanel` and `RollPanel` |
  | CI green on the tip | The orchestrator's wait |

- Batch 6 departures and deviations:
  1. `FormField` takes `optional` as the word itself, one string prop in place of the brief's boolean and `optionalText`.
  2. The word sits outside the `<label>`: a control's name stays its caption, so no golden name and no `getByLabelText` moves. A required control keeps `required` and `aria-required`, which is what a reader hears.
  3. A failed read, the load and signed out draw a visible `h1` up to 760 px through `PageTitle` (mock `homebrew-error`), not the `.vh` heading of the snippet in S4: no picker draws there, so nothing else would name the page. The pin is out of reach in those three states up to 760 px.
  4. `MoreMenu` gains `up` and `disabled`. `up` is a class on `Menu`, so `Menu` does not change. The `.msep` rule moves from `PickRow` to `MoreMenu`, its third caller.
  5. `#/homebrew ~ move` stays `as gm1`, not gm3: its enter names gm1's rows and source.
  6. The bar's «Ещё» row: `.seldrop` loses its own line while `HomebrewBulk` is in the bar, so the three controls share one row (mock B6-1). The catalog's bar does not change.
  7. `.hbform` is a flex column, not a grid: a sticky grid item stays inside its own row.
  8. From 761 px the row also draws «Показано N из M» beside the limit counter while the list is narrowed: otherwise that band shows no narrowed count. The brief names only the count line up to 760 px.
  9. The disclosure «Второй набор характеристик» keeps its caret. The brief's "plus icon" reads the mock; the code never had one, and the caret says it folds.
  10. `.rel summary` and the disclosure lose `--gold-soft`: «Сохранить» is the one gold of the form (H21). The fold's summary takes the group head's size, as the mock.
  11. The crop slider draws its own track and thumb: the native thumb takes no size. `accent-color` goes.
  12. The D5 tag sits after the row's tags, as the mock draws it, not directly after the name.
  13. `.pickrow` wraps, so at 320 px «Ещё» goes under the picker and no word breaks.
  14. `FEATURES.md` drops the measured "150 px, four lines" of a source row: the row has two controls now, and nothing measured its new height.
  15. Case 82 reads the column, not the toggle: at 1180 no «Фильтры» button draws.
  16. A row's source tag is hidden on `/homebrew` (`hiddenTags`, H9): the group head says it, so the test line «Мастерская Ольхи (HB)» went.
  17. The create button and the counter share one row on the Sources, Sets and Rules tabs, and the search sits under that row: above each other the Sets row started near 286 at 360, past 256. Up to 760 px the button is `sm`. The brief's "first control under the head" holds.
  18. `.pickrow` and a source's `.head` are positioned. Up to 760 px `MoreMenu`'s wrap is static, so a row must anchor the menu, or `Menu` focuses its first item at the page's end and the page jumps 85 px (the golden shard found it).
  19. `CardForm`'s «Язык текста» takes `neutral` too: it opens inside the editor's fold, and H21 keeps the gold on «Сохранить».
  20. The brief's `record.test.ts` case for `eqType` lives in `label.test.ts` (the badge) and `homebrewEditor.test.ts` (the badge, the glyph and no stat block on the drawn card).
  21. A local fix: a wrapped link of the error summary (`.errlink`) is inline, so its bullet stays on the first line (shot `editor-errors` at 360 EN).
  22. The fourth first-screen row is `hb_longsrcaaaaaaaaa`: its name is short and its path, the 80-character source, is the long part; a 120-character name is cut to one line at 360, so it moves no offset (case 92 holds the cut).

- Batch 6 remediation (`reviews/6.md`, verdict fix-then-continue; CI run 41813328286 of `96710fe3`). Each CI
  failure was reproduced first on `dist-test/` of `4857babc` (scratch loaders over `states.js` and `sweep.js`, and
  probes). All five were stale tests or a stale sweep script; the app was right in each:

  | Finding | Outcome |
  |---|---|
  | 6-CI sweep «вид на печати» (360, 390) | Stale script. Up to 760 px the print switch is in the preview sheet (A6), so the entry opens «Предпросмотр» first where no `.preview` column draws |
  | 6-CI sweep «названия тех, что уже есть» (EN) | Stale script. The import's caption is `.lbl` (`text-transform: uppercase`), and `innerText` reads «IMPORT ITEMS...», so the EN run took the RU names. The entry reads `html[lang]`; `hbImportOpen` matches the caption case-insensitively |
  | 6-CI states 63 | Stale case: up to 760 px the four tab chips are the picker (A28), so only the fold (25.6 px) was found against a count of 5. The case measures the picker, the fold and the four links of the picker's sheet |
  | 6-CI states 91 | Stale case, the same uppercase read: the panel opened. The check is case-insensitive |
  | 6-CI e2e F14 | Stale flow: D15 names the damage types in full words, so «физ» is «Физический». F15-F20 read against batch 6's labels: no other moved name. Not runnable here: CI's `e2e` is the proof |
  | 6-R1 | Fixed. Probe at 320x568 RU on `hb_emberaxeaaaaaaaa`: the bar box 17-288, «Ещё» ended at 314 (at 360, 4 px into the padding). Up to 380 px the bar's insets are 10 px, the gap 4 px and `.btn.sm` 6 px: «Ещё» ends at 278. Case 92 gains the 320 RU pass (inside the bar's box, no cut word, no sideways scroll) |
  | 6-R2 | Fixed: "Supersedes in part" in the new file, "Superseded in part by" in the 2026-10-02 and 2026-09-30 files |
  | 6-N1 | Deferred to the next batch's re-seed (Deferred) |
  | 6-N2 | Confirmed in the built app (one rect 39 px high, the bullet on «1-99.»), fixed with `vertical-align: top` |
  | 6-N3 | Fixed: the editor shots re-taken on the final build |
  | 6-N4 | Fixed: the clause leaves case 92's comment; `homebrewEditor.test.ts` holds the conflict |
  | 6-N5 | Fixed: `.opt` takes `aria-hidden` when the caption is hidden; a new `homebrewEditor.test.ts` case. Goldens of `homebrew` re-seeded |
  | 6-N6 | Fixed: the focus goes to «Предпросмотр» after a tick, else to `#main`; the band test asserts it |
  | 6-N7 | Fixed in CSS: under 481 px of height `scroll-padding-bottom` leaves `--ebar-h` out, the bar's own query |
  | 6-N8 | Fixed: the comment is back over `hbImportOpen` |
  | 6-N9 | Fixed: the `check:fast` result of this pass is under Verification. The figure of `96710fe3` was not recorded and is not recoverable |

  The two new unit tests failed at `4857babc` in a detached worktree (2 failed, 96 passed).

  CI run 41820770364 of `bbda9dca` failed only on `node tools/decisions.js` (a status line after "- Task" in the 2026-10-02 field-help and 2026-09-30 save-button files). Fix: both "Superseded in part by" lines moved above "- Task"; the validator reports 0 problems.

- Batch 7 - search, account, empty and error states (`plan-7.md`). New: `Marked`, `NoPage`, `pickKinds`,
  `markRuns`, `shortPath`, `AppState.searchKinds`, `pickKind`, `resetKinds`, `Button` `danger-fill`, `ErrorPage`'s
  `said`, the fake's `print` hold, cases 93 and 94, the decision file
  `2026-11-04-search-and-account-follow-the-list-head-and-the-error-page.md`. Acceptance:

  | Line | Outcome |
  |---|---|
  | Section 7, line 1 (`/p/` page rows) | Not this batch: batch P |
  | Section 7, line 2 (error-page pattern) | Done for five of the six S7 states, deviation 1: `NoPage`, retired link, failed `/p/` read, boundary, editor's missing item; `printPage`, `shell`, `homebrewEditor` tests with axe; the status region says the title (`ErrorPage` `said`) |
  | Section 7, line 3 (account clarity) | Done: `accountPage.test.ts`; the account goldens re-seeded |
  | Section 7, line 4 (`/p/` not-found and retired) | Partly, deviation 1: the retired link and the failed read draw `ErrorPage`; the unknown, expired and malformed set keep `PageTitle` (a contract) |
  | Section 7, line 5 (`danger-fill`) | Done: `button.test.ts`, `accountPage.test.ts`, DESIGN "Buttons"; the plate and the sheet checked against `/search` |
  | Section 7, line 6 (M2-2, pin on `/search`) | Done: `searchPage.test.ts`, case 93 |
  | C13 | Done: `searchPage.test.ts`, `std.test.ts`, `app.test.ts`, `hues.js` (new read), goldens; `toggleKind` unchanged |
  | Orchestrator line: a search pick leaves the roller's kinds on | Done, deviation 2: `AppState.searchKinds`. The test «leaves the roll pages' kinds on» failed at `0a43491f` in a detached worktree (`aria-pressed` false on the roller) and passes now; `app.test.ts` holds the state |
  | C14 | Done: no instruction sentence; three examples hit in RU and EN over `data.json`; a press fills the box, the box keeps the focus |
  | C15 (J8) | Done: «№ 89» / "No. 89" on `/search` rows, the bare number on a table row |
  | C16, C60 | Done: the cause, the two resets and their focus (`searchPage.test.ts`); the own-items plate with its title and a primary «Новый предмет» (`homebrewCatalog.test.ts`) |
  | Q3-S | Done: no strip on `/search`, ticks only in the mode, the bar's «Все» ticks the found rows, «Снять выделение» back to «Выбрать»; `TableRows` keeps the strip for `/s/` |
  | N7 (J7) | Done: `markRuns` and `Marked`; `RowMain` has no `nameRuns`; `tables.test.ts`, `searchPage.test.ts`, `search.test.ts` |
  | Deferred "Display note and default-view wording" | Done: no lead, "по умолчанию" rows; `FEATURES.md` "Account", "Tables and search" |
  | A31, A32 | Done: case 94, `accountPage.test.ts`, deviation 3 |
  | D7, N7-2 | Done: two `Seg`s, no checkbox, `printCompactBox` gone |
  | A34, D8 | Done: the list, the fill, the typed word, both focus rules; D8 probe under Verification |
  | J13 account loading | Done: the heading and «Загружаем...» |
  | Seg rule | Done: every account `Seg` `neutral`; `hues.js` reads it (CI's) |
  | New states: entry, golden, axe | Done: 9 new entries, `~ kind off` retired (deviation 4), axe in the component tests; the unknown session in `accountPage.test.ts` |
  | Specs, DESIGN, decision, COVERAGE | Done |
  | `FIRST_SCREEN` | Rows `shipped: true`; offsets under Verification; assertion is CI's case 83 |
  | Axe rows, artwork guard | Done: `COVERED` gains `Marked` and `NoPage`; `CARD_HEAD_SHA256` did not move |
  | Detector, spelling, shots, `routes.json` | See Verification; `routes.json` unchanged; `polish` and `harden` are the orchestrator's |
  | Budget | See Verification |
  | Inherited 6-N1 | Not measured: the re-seed passes no editor state with a 120-character name, and the editor's layout did not change in this batch (its missing state only); stays Deferred |
  | Placed items of `plan-7.md` | The orchestrator's to fold into `plan.md` (this batch cannot edit it): section 8 gate cost, section 14 rows `shipped: true` (done in `states.js`), the batch 8 and 9a acceptance lines, batch P's shared print labels, batch 10 nothing new |
  | CI green on the tip | The orchestrator's wait |

- Batch 7 departures and deviations:
  1. `/p/` unknown, expired and malformed sets keep `PageTitle` «Печать карточек» and the sub `printSetGone`:
     `docs/fixtures/urls/routes.json` (`#/p/short`) names that heading and sub, and the preview Worker
     quotes `printSetGone`, so the S7 row would change a public contract. `printSetGoneTitle` is not added; the
     retired link and the failed read do draw `ErrorPage`. Batch P can take it with a contract change.
  2. Search has its own kinds, `AppState.searchKinds` (the orchestrator's line), not `app.kinds` as J3 said. A
     roller kind switch no longer reaches search; `FEATURES.md` "Rolling" and `STATE.md` say so.
  3. The account panel draws the session's line (email, «через <provider>») also when no row names the
     session's provider, an email-link account: without it such an account showed its email nowhere. e2e F2
     waits for «Способы входа» in place of «Вы вошли как».
  4. `#/zzz-nowhere` is not an inventory entry: an unreadable address goes home (`routes.json` `#/nonsense`), so
     `NoPage` shows on `#/l/ ~ retired` and `#/l/~AAAA`, which re-seed.
  5. `ErrorPage` gains `said`: the brief's "as batch 4's `NoItem` does" was not true (`ItemPage` says only a lost
     item), so a status region fills after the mount on the new error pages.
  6. The search head's count line sits under the kind row from 761 px, and the account keeps `accountSub`.
  7. DESIGN.md gains "The Search Head Rule" in "Layout" (nine named rules there now).

- Batch 7 remediation (`reviews/7.md`, verdict fix-then-continue; CI run 41845174864 of `2c3f3833`). Diff base
  `2c3f3833`. Every finding is taken; no nit is skipped:

  | Finding | Outcome |
  |---|---|
  | 7-B1 | Fixed: `importZipHomebrew` «Сначала импортируйте файл homebrew.json ...: тогда списки свяжутся с этими предметами, а не с копиями.» and `hbImportZipLists` «Затем импортируйте файл lists.json ...», EN the review's text; `FEATURES.md` "Lists" (zip line), "Homebrew" (zip line) and "Account" give the order. Tests: `importPanel`, `homebrewImport` (the RU lines), `i18n` (EN and the RU first words); all three failed at `2c3f3833` in a detached worktree. No golden draws a zip preview, so none moved. The Deferred entry is gone |
  | 7-R1 | Fixed as the review recommended: from 761 px the count line is the last flex item of a new `.kindhead` wrapper after the `role="group"` kind row (`margin-left: auto`), so the DOM order and the goldens stay. Measured in the built app: 279.4 px with a kind picked at 1180 and 761 (was 301), RU and EN, the same as `~ searched`, so its 8.6 px margin holds. New `FIRST_SCREEN` row `#/search ~ kind picked` (1180 only, `wideOnly`: its enter presses a chip); case 93 gains the pick at every width |
  | 7-R1, found at 320 | The review's check "the box at least 140 px beside «Фильтры · 1»": at 320x568 RU with a pick «Выбрать» ended at 324.8 px, past the window (EN 290.8 in a 289 px row). Up to 380 px the two buttons take 6 px insets and the gap 4 px (the selection bar's precedent), and the box may narrow to 112 px: RU 118.3 px with a pick, 133.7 without; EN 152.2 and 167.6. `FEATURES.md` "Tables and search", case 93 and `COVERAGE.md` say 112 px at 320 |
  | 7-N1 | Fixed: the `searchPage.test.ts` row is written once |
  | 7-N2 | Fixed: signed in, `/account` draws no subtitle (an empty `.page-sub`, as the loading state, keeps the spacing); `accountSub` left `dict.ts`; `FEATURES.md` "Account"; the decision file's Accepted line names it as a default taken while the owner was away. Five `_account*` goldens moved by that one line. The signed-out `signInLead` stays |
  | 7-N3 | Confirmed in the built page: `&nbsp;·&nbsp;` draws 2.6 px both sides on `/search`; `TablesPage`'s `&nbsp;·&#32;` draws 0 px after the dot, because a flex item drops its trailing space. Both pages now use `&nbsp;·&nbsp;`. The mid band has no golden with a filter, so none moved |
  | 7-N4 | Fixed in code: `NoItem` says its title (`said`, on by default); `ItemPage` passes `said={!lost}`, so a lost item is said once by its own region, and its failed page passes `said`. `FEATURES.md` "Chrome" names both. Tests in `itemPage`, `record`; four goldens (`_i_nope`, `_i_hb_emberaxe...`, two `_h_`) gain the status line |
  | 7-N5 | Fixed: `App.svelte`'s boundary sends the focus to `#main` after `tick()`; `shell.test.ts` |
  | 7-N6 | Fixed: "batch P" left `FEATURES.md` "Print"; "J1-J17" and "for batch P" left the 2026-11-04 decision file; "D1-D13" left the 2026-10-30 one |
  | 7-N7 | Fixed: the comment says 279.4 px with a kind picked or not, measured 2026-11-04 |

  CI run 41845174864 failed on three suites, each reproduced first and each a stale test or file, none a weakened check:
  - `derived` (and the `check` job): the 2026-10-30 decision file had its "Amended by" line after "- Task" and 16
    body lines. The line moved above "- Task" and the Rejected bullet is one line: `validate()` reports nothing.
  - `app/print`: the retired print address reads `.page-h`, which `ErrorPage` no longer draws; it reads `main h1`.
    Reproduced locally (`failed to find element matching selector ".page-h"`).
  - `app/states` 86, "after the slide": a probe showed `transitionend` events of the tab links (`transition: all`,
    `color`) bubbling to `.topbar`; the first one ended the wait while the header was mid-way (CI: bottom 56.8). The
    wait now takes only the header's own `transform` event.

  Deviations: `FIRST_SCREEN` gains a row (`plan-7.md` "Placed items" said "No row is added"; the orchestrator's
  section 14 fold takes it); the 112 px box at 320 moves a spec number (named above); the shots in
  `mocks/7/built/` were not re-taken, so `account*` and `search-kind*` show the batch 7 build.

- Post-wave-2 remediation (`reviews/post-wave-2.md`, verdict fix-then-continue; diff base `10a47edc`), every
  finding taken, nits included. Each fix's test failed at `10a47edc` in a detached worktree outside the repo
  (19 tests, listed under Verification), and the worktree is removed:

  | Finding | Outcome |
  |---|---|
  | pw2-R1 | Fixed. The picture goes one step deeper: on a roll result and a list's roll hit it is the button «Открыть карточку» / "Open card" (the record dialog); in the dialog the link «Открыть страницу» / "Open page"; on `/i/`, `/h/` and the editor's preview a `div` with no control. `RecordCard` `pageLink`, passed by `RecordModal`; `openPage` reads «Открыть страницу», `openCard` is new. Deviation from the dispatch ("a roll result must open the page"): a roll is page memory, so the page would drop the roll, and the picture is the dialog's only way in over a result (`inventory.js` `#/roll/wondrous ~ modal`); the decision file `2026-11-04-the-record-picture-goes-one-step-deeper.md` names it. Case 31 reads the face ring only (the page picture has none); `FEATURES.md` "Records", `COVERAGE.md` |
  | pw2-R2 | Fixed: `TableNav`'s pick closes the sheet and focuses the picker after `tick()`; Escape (native restore) and the inline tabs from 761 px are unchanged. `tableNav.test.ts` |
  | pw2-R3 | Baseline first: the wave made it worse, so fixed. Numbers under Verification (median first paint 13.9 s before wave 1, 17.1 s at `10a47edc`, 6.3 s now; longest task 12.7, 12.7, 5.2 s). `TableRows` draws 60 rows in the mounting task, shared by the sections that mount in it, then 60 per task; later rows and an anchored table (`whole`, from `TablesPage`'s route anchor) draw at once; counts, «Все» and print read data; `data-drawing` marks the wait, and `tests/app/driver.js` `ready()` and `settle()` wait for it. `content-visibility` was measured and rejected. Decision file `2026-11-04-a-long-table-draws-its-rows-over-several-tasks.md`, `FEATURES.md` "Tables and search", `tableRows.test.ts` |
  | pw2-N1 | Fixed: `404.html` is hand-written (no generator); title «Страницы по этому адресу нет / No page at this address - Daggerheart Loot», one `h1` (the English half an `h2`), the app's cause line and actions «На главную» / «Открыть таблицы» (`/roll/std`, `/tables`, `/en/...`). The system font and no die mark stay (the reviewer's deferred-scope part). `tests/derived.js` checks the links, one `h1` and no dash; `META.md` section 7 |
  | pw2-N2 | Followed the newest spec: `FEATURES.md` "Homebrew" and `STATE.md` `dhloot.home.v1` (`eb899604`, 2026-10-21, owner 2026-10-19) let a pin hold `#/homebrew`; `ROUTES.md` "Homebrew" (`057405ee`, 2026-09-30) said it may not and now agrees. No behavior change: `FEATURES.md` "Homebrew" draws the narrow non-ready head (signed out, loading, failed) as the heading only, so the pin there is from 761 px; no decision file, since a source decides it |
  | pw2-N3 | Fixed: signed out, `/homebrew/new` and `/homebrew/<key>` title the tab «Мои предметы», the `h1` (`Shell.svelte`); `shell.test.ts` |
  | pw2-N4 | Unified at one seam, `SignInPrompt`: a prompt given `oncancel` focuses «Войти» on open and its «Отмена» closes it and returns the focus to the control that had it. `PickRow`'s «Печать» and «Сохранить себе» and the shared page's «Сохранить себе» pass it; the menu and the selection bar already did. Page-level prompts keep no «Отмена». `/p/<id>`'s «Войти» under its lead is a page-level prompt and stays. `FEATURES.md` "Where a list is made"; `signInPrompt.test.ts`, `pickRow.test.ts` |
  | pw2-N5 | No change: Cloudflare's pretty URLs answer `/pages/*.html` with one 308 to the path without `.html`; every link resolves |
  | pw2-N6 | Fixed: `HelpItem` draws a check for its icon while the panel is open (the pin item's mark; `aria-expanded` already); `HelpBox` takes `close`, and the narrow tables and roll panels start with «Закрыть», which folds the panel and focuses «Ещё». New inventory state `#/tables/eq_weapon ~ data notes from more` (360); `FEATURES.md` "Tables and search"; `tables.test.ts`, `rollPage.test.ts` |

  Not committed with this change: the orchestrator's later edit of `context.md` ("Phone feedback", 2026-11-04 18:46),
  which arrived in the tree during the session.

- Batch 7b - one tag rule, one-box badges, a steady table head, compact roll results and the homebrew pin
  (`plan-tags.md`, T1-T13 in the order T1-T7, T9, T13, T12, T8, T10, T11; diff base `377d0981`). New: `isCoreBook`
  (`lib/label.ts`), `PageHead` `pin`, `TableNav`'s tab slot, the `faces` container (`OrGrid`, `RollPanel`), cases
  95, 96 and 97 (`badgeIsOneBox`, `tableHeadHoldsStill`, `rollFitsByCount`, the `ROLL_FIT` table), the states
  `#/search ~ relations, dialog as gm3` and `#/roll/std ~ one result`, three decision files (relations and «Core» on
  the full card; the table head by band; the tall face only when the roll fits one line), `mocks/7b/built/head-probe.js`
  and `shoot.js`. Batch 9a reads cases 98, 99 and 100 as its next free numbers. Acceptance:

  | Line | Outcome |
  |---|---|
  | R1 cards: `face`, `compact` draw no relation lines, set, bonus or ladder; `full` draws all | Done: `record.test.ts` ("by card variant", ci1, q1, voa4_t3d, dossier on and off), case 95 part 3 |
  | R1 rows: no relation line on tables, search, `/homebrew`, lists, `/s/` | Done: `tables.test.ts`, `homebrewCatalog.test.ts`, `listPage.test.ts`, `sharedListPage.test.ts`, `searchPage.test.ts`; `RowMain` has no `.rcraft` |
  | R1 dialog keeps the own relation lines with «Хоумбрю» badges | Done: `homebrewCatalog.test.ts` (the dialog over ci1's search row, switch on and off, axe), golden `#/search ~ relations, dialog as gm3`. Deviation 1 |
  | R2 roll result draws no «CORE» | Done: `rollResult.test.ts`, case 95 part 3 (360, 1180), `_roll_std*` goldens |
  | R2 no «Core» on any row; dialog badge and page path keep it | Done: `tables.test.ts` (`other_starting`), `searchPage.test.ts`, list and `/s/` tests; `record.test.ts` full card `['Core']`; `_i_*` goldens unchanged |
  | R3 another book kept | Done: `tables.test.ts` (Hope & Fear on `other_starting`), `searchPage.test.ts`, `record.test.ts` (`hi61` on `face`, `compact`), `rollResult.test.ts` |
  | R4 homebrew tag as today | Done: `homebrewPage.test.ts`, `homebrewCatalog.test.ts` pass with the relation-line edits only |
  | R5 item 1 (the upgrade line) | Done: case 95 part 1 at 360 and 1180, RU and EN (one rect, on its name's line, no box within 2 px, no crossing); `record.test.ts` U+00A0. Deviation 2 (the `.rel` wrapper, 3 px margin) |
  | R5 item 3 (the tile pill) | Done: case 95 part 2 on `voa` at 360, 390, 412, 768, RU and EN, in and out of the mode; one line from 390; at 360 «ВТОРИЧНОЕ ОРУЖИЕ» / "Secondary weapon" get 135.5 px of the 139.6 / 136.0 they need and wrap inside one pill: logged (F3) |
  | R6 measurement | Done: the T9.1 table under Verification, causes named |
  | R6 head steady, failed at HEAD | Done: case 96 at 1180, 1050, 760, 390, RU and EN; at `377d0981` it failed 22 lines (numbers under Verification); passes now. Option A, deviation 3 |
  | R6 `TableNav` same node; late content | Done: `tables.test.ts` "keeps the same navigation node"; `tableNav.test.ts` the tab slot. Late content: row pictures are a fixed 60 px well, tiles `aspect-ratio: 1`, the count line sits in the search row from 761 px; the filter column is per table (deviation 3) |
  | R6 `FIRST_SCREEN` limits stay | Done: no limit or row changed; `/tables/eq_weapon` at 1180x720 is at 244 px (limit 288); case 83 is CI's |
  | No `core` flag, one predicate, no `index` prop | Done: `git grep -n -E "hide\?\.core|core: !!EQ_TABLE" -- app` empty; `RowMain`, `TableRows` lose `index` |
  | Print, copy, stubs unchanged | Done: `lib/print.ts`, `lib/share.ts`, `tools/build.js` no diff; `app/print` is CI's |
  | New dialog state, golden, axe; new `why` | Done (golden in the re-seed; axe in `homebrewCatalog.test.ts`) |
  | T8 prose, three decision files, pointers, `decisions.js` | Done: `FEATURES.md` "Rolling", "Tables and search", "Records", "Homebrew", "Chrome"; `DESIGN.md` "Layout", "Cards", "Badges"; `COVERAGE.md`; `node tools/decisions.js` 309 decisions, no problem |
  | R7 measurement | Done: the probe at HEAD and after, under Verification |
  | R7 the rule at 1180x720, failed at HEAD | Done: case 97 (every name of std 4 at 562, alt 4 at 645, voa at 583; std 1 and 2 whole at 665 and 666); at `377d0981` it failed 32 lines; alt crit logged (last name 744 RU, 688 EN) |
  | R7 the owner's window 1919x980 | Done: case 97, every count whole (alt crit 820 RU, voa 844) |
  | R7 one result at most 380 px | Done: case 97 (380 px), was 791 |
  | R7 the row face from 601 px | Done: case 97 at 1180 (four) and 1000 (every count); `~ one source` keeps two tall faces |
  | R7 the phone | Done: case 97 at 360 (96 px, no number); case 89 now reads 600 and 640 (row) and 720 (tall) and passed once here; `sweep.js` is CI's |
  | R7 new state `#/roll/std ~ one result` | Done (golden in the re-seed; axe: `rollResult.test.ts`) |
  | R7 roll `FIRST_SCREEN` offsets | Unchanged: the first result at 267 px from 761 px (probe) |
  | `node --test tools/artwork/lib.test.mjs` | Done: 77 pass after `CARD_HEAD_SHA256` moved (the «Core» condition in the head); `renderCard` draws the full card's head, so it keeps the source badge |
  | T13 the pin only when ready | Done: `homebrewPage.test.ts` "draws no pin signed out, loading or on a failed read" at wide and narrow, with axe; the ready case keeps it |
  | Detector, spelling, shots, polish and harden, CI | See Verification; `polish` and `harden` (T10) and CI are the orchestrator's |

- Batch 7b departures and deviations:
  1. The T3 dialog case lives in `homebrewCatalog.test.ts` (it opens the real dialog over ci1's search row as gm3 with
     axe), not in `recordHost.test.ts` or `pickRow.test.ts`.
  2. R5: an inline-block badge after a U+00A0 still broke onto its own line in Chrome (EN at 360, measured), so a name
     and its badge sit in a `span.rel` with `white-space: nowrap` (the link inside wraps as normal). A 2 px margin left
     1.8 px to a wrapped name above it at 360; the margin is 3 px. DESIGN.md keeps "2 px from the lines around it".
  3. HD1, option A as measured: the chips under the title from 1000 px would put `/tables/*` at 290.5 px at 1180x720
     (limit 288), so from 1000 px the chips stay beside the title (`.tablenav` `display: contents`, the chips wrap in
     their own box, two lines in RU up to about 1140 px) and the tabs take the next row; from 761 to 999 px both rows
     sit under the title. The tab slot holds every group's tabs unseen (`aria-hidden`, `visibility: hidden`, spans, no
     links), so it keeps the tallest row's height. Not built: hidden toolbar slots (a hidden control stays focusable for
     axe in jsdom and for `d.click` in the suites), so the view switch still moves sideways where a table adds
     «Фильтры», «Свои предметы» or the link; the filter column draws only on a table with filters. From 761 to 999 px
     every table reserves the supplements' two tab lines (+43 px on most tables).
  4. FEATURES "Tables and search": the 110 px head cap holds at the sweep's run widths from 1000 px, not at 1000-1140 px
     in RU (two chip lines).
  5. Case 97 presses a state's controls at 1180 px for its 360 px rows (`openState` `wideEnter`), because the source
     chips live behind «Настроить» there.
  6. The roll probe's sizes are its own (700x400, not 700x360).

- Review: done, `issues/57/reviews/3.md`, verdict fix-then-continue; the one remediation
  pass is this commit. No second review is needed: the picker fix leaves the first-screen
  rows unmoved (234 at 360).
- Plan review: not required for batch 3 (`plan.md` Status, no trigger fired).

## Verification
- Batch 7b, 2026-11-04 (diff base `377d0981`):
  - Failing direction: `git worktree add --detach E:/dev/dhl-7b-base 377d0981` (outside the repo, `node_modules` through a
    junction), `npm run build:test` there, the new `tests/app/states.js` and `inventory.js` copied in, then a scratch
    in-memory loader of `states.js` filtered to 95, 96, 97: 84 FAILED (95: the badges touch their neighbors, the
    weapon pills split into two fragments at every width, the roll result draws «Core» and «Улучшается до»; 96: 22
    lines, below; 97: 32 lines, the one-result width 791 px, every 1180 and 1000 row). The worktree is removed.
  - The same loader on the task build: 95, 96, 97 and 89 pass (89's row face at 600 and 640, tall face at 720).
  - T9.1 head probe (`node issues/57/mocks/7b/built/head-probe.js --root=E:/dev/dhl-7b-base`), as gm3 across the 19
    tables, RU and EN; Y of each block, least .. greatest:

    | Size | At HEAD | After |
    |---|---|---|
    | 1180x720 | chips 89 .. 136; tabs 136 .. 182.5, none on `homebrew`; search row 142 .. 238.5; rows 194 .. 290.5; chips X 16 .. 448 RU (352 EN) | chips 89, tabs 136, search row 192, rows 244, chips X 448 RU / 352 EN, every table |
    | 1050x720 | RU: chips 136, tabs 182.5, search row 188.5 .. 238.5 (`homebrew`), rows 240.5 .. 290.5; EN as 1180 | RU: chips 89 (two lines), tabs 179.5, search row 278.5, rows 330.5; EN as 1180 |
    | 1000x720 | (not probed) | RU as 1050; EN as 1180 |
    | 900x720 | tabs 182.5, height 0 .. 83; search row 188.5 .. 281.5; rows 240.5 .. 333.5 | search row 281.5, rows 333.5, every table |
    | 761x720 | (not probed) | search row 281.5; rows 333.5, but `eq_*` RU 381.5 (the toolbar wraps: five controls) |
    | 760x720 | picker row 40 .. 41.8; search row 177 .. 179; rows 225 .. 227 | search row 177, rows 225 |
    | 390x844, 360x640 | steady (search row 186.5, rows 234.5) | the same |

    Causes: (1) `PageHead` `.page-head` is a wrapping flex row and `TableNav`'s `nav.tablenav` one item of it, so the
    navigation sat beside the title or under it by its widest row, the seven supplement tabs (`.tabs` max-content);
    (2) `TableNav` draws no `.tabs` where a group has one table (`homebrew` with fewer than two sources); (3) from 761 to
    999 px the supplements' `.tabs` take two lines (83 px against 40); (4) up to 760 px `.tablenav.narrow` was a block
    whose line box added a descent under the two-line picker (`.picker-t`, 41.8 against 40); (5) the toolbar's X:
    «Фильтры» (mid band, a table with filters), «Свои предметы» (`eq_*` with own items) and «Ссылка на таблицу» (not
    `homebrew`) move the view switch; (6) the filter column draws only with filters (X of the rows). Rejected
    candidates: a scrollbar gutter (0 in every run), a scroll (0), a `TableNav` remount on a table switch (the node is
    kept; `tables.test.ts`), late pictures and counts (fixed boxes, Y unchanged). At 761 px RU the `eq_*` toolbar wraps
    to two lines, which case 96 does not read (760 is its mid-band neighbor): logged, not fixed (deferred).
  - Case 96 at HEAD, the failing lines: 1180 RU and EN groups, tabs, search row, rows, chips X; 1050 RU tabs (absent on
    `homebrew`), search row, rows; 1050 EN as 1180; 760 RU and EN search row and rows (177 .. 179, 225 .. 227).
  - T12 roll probe (`issues/57/mocks/7b/roll-probe.cjs`, served `dist-test/` through `tests/app/lib.js`), RU, last
    name / last action row, whole k/n; EN 0-60 px higher. The `--inject` model was not re-run here: the after numbers
    are compared with the planner's model table in `plan-tags.md`.

    | State | Size | HEAD | After |
    |---|---|---|---|
    | std 4 | 1919x980 | 1084 / 1231, 2/4 | 562 / 747, 4/4 |
    | std 4 | 1180x720 | 1049 / 1196, 2/4 | 562 / 747, 2/4 (n = 45: 627 / 855) |
    | std 4 | 1000x720 | 2695 / 2820, 0/4 | 1013 / 1133, 2/4 |
    | std 4 | 900x720 | 2417 / 2542, 0/4 | 1013 / 1154, 2/4 |
    | std 4 | 761x720 | 2021 / 2168, 1/4 | 1091 / 1276, 2/4 |
    | std 4 | 700x400 | 1045 / 1274, 0/4 | 719 / 1029, 0/4 |
    | std 2 | 1180x720 | 563 / 692, tall | 563 / 666, tall |
    | std 2 | 1000x720 | 1386 / 1493, 0/2 | 549 / 642, 2/2 |
    | std 1 | 1919x980 | 927 / 1009, 838 px wide | 583 / 665, 380 px, tall |
    | std 1 | 1180x720 | 892 / 973, 791 px wide | 583 / 665, 380 px, tall |
    | std 1 | 1000x720 | 757 / 838 | 333 / 426, row |
    | alt 4 | 1919x980 | 1059 / 1188, 2/4 | 592 / 712, 4/4 |
    | alt 4 | 1180x720 | 1023 / 1153, 2/4 | 645 / 787, 2/4 (EN 570 / 690, 4/4) |
    | alt crit | 1919x980 | 1197 / 1305, 2/4 | 700 / 820, 4/4 |
    | alt crit | 1180x720 | 1166 / 1274, 0/4 | 744 / 886, 2/4 (logged) |
    | voa 1 | 1180x720 | 583 / 844, tall | the same |
    | voa 1 | 900x720 | 583 / 844, tall | 333 / 563, row |
    | std 4 | 360x640 | 1247 / 1443 | 1205 / 1401 (the relation line gone; n = 45 1286 / 1522 both) |

    Differences from the model: std 4 at 1180 ends 18 px higher than modeled (562 against 580); the first result starts
    at 267 px from 761 px as before. At 700x400 a lone or paired result is the tall face (a 668 px column), as the brief
    says (F7).
  - `npx vitest run` of `label`, `rowTags`, `record`, `rollResult`, `recordHost`, `pickRow`, `tables`,
    `homebrewCatalog`, `homebrewPage`, `searchPage`, `listPage`, `sharedListPage`, `itemPage`, `badge`, `a11y`, `orGrid`,
    `std`, `alt`, `tableNav`, `tableRows`, `roll`, `rollPage`, `homebrewEditor`, `shell`: 1195 passed.
  - `npm run lint:untyped`, `npm run lint:typed`: no output. `npx svelte-check --threshold error`: 0 errors.
  - `node --test tools/artwork/lib.test.mjs`: 77 pass after `CARD_HEAD_SHA256` became `e5545321...`.
  - `node tests/app/golden.js --update --shard=n/4`, n = 1..4 (97, 98, 98, 97 states; 390 in all): shard 1 failed one
    capture (`#/search ~ relations, dialog as gm3`: the row's name holds a no-break space after «№»); its press became
    «Первоклассный» and `--update --only=` that state wrote it. 142 goldens moved, two new
    (`_roll_std_one_result`, `_search_relations_dialog_as_gm3`). Read: rows lose «Core» and the relation text (the
    `namelen` of recipe, upgrade and Frostwyrd rows drops), roll results lose «CORE», «УЛУЧШАЕТСЯ ДО» and its link and
    another book's badge stays, four-result rolls also lose the number badges from the tree (the row face hides them; the
    elided StaticText counts drop), the `/homebrew` lists as gm3, the list and `/s/` families. Outside the expected families: four `_i_`
    and five `_h_` goldens of records with own relations: only the elided `StaticText` count (the `.rel` wrapper splits
    the comma and the no-break space into their own text nodes, deviation 2); no dialog, editor or `/p/` golden moved.
  - `node tools/decisions.js`: 309 decisions, no problem.
  - `rtk npm run check:built`: exit 0, 264.2 kB within 265. Configured (`vite build` with placeholder
    `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, `node tools/bundle-budget.mjs`): 321.6 kB within 322. No
    limit moved; `dist/` rebuilt unconfigured after.
  - Detector, `npx impeccable detect --json --no-inline-ignores app/src`: 67 findings (67 before); in touched files only
    the `design-system-*` advisories of `RecordCard` and `TableRows`; no new file.
  - Spelling over the added lines: no British form.
  - `node issues/57/mocks/7b/built/shoot.js`: 34 shots in `mocks/7b/built/` (360 and 1180, RU and EN; the head at
    `core_item`, `wondrous`, `homebrew` at 1180).
  - `rtk npm run check:fast`, first run: FAIL at vitest, one test: `searchPage.test.ts` "shows 300 of 305" read 240 of
    300 rows when its 1 s `waitFor` ended under coverage (the 60-row steps); its wait is 5 s now, nothing else changed.
  - `rtk npm run check:fast`, last: exit 0, 2092 tests with coverage (741 s), 264.2 kB within 265; gate credit armed.
  - Not run locally (CI's): `app/states` whole (cases 83, 31 and the rest), `app/print`, `app/hues`, `app/typo`,
    `app/contracts`, `sweep.js`, `e2e`.
- Post-wave-2 remediation, 2026-11-04 (diff base `10a47edc`; its CI run 41870701968 green):
  - R3 baseline, `scratchpad/perf/measure.mjs` (puppeteer, 390x844, 4x CPU throttle, warm HTTP cache, the service
    worker bypassed; first contentful paint, `longtask` entries), each build served from its own `dist/`: the build
    before wave 1 from `git worktree add --detach E:/dev/dhl-base d83384b4~1` (`eea84371`), wave 2 from a detached
    `10a47edc`, both on the task tree's `node_modules` through a junction, then removed. Four interleaved rounds on a
    loaded host (`rounds.sh`), first paint / longest task / long-task sum, medians: `eea84371` 13.9 / 12.7 / 13.0 s
    (7103 nodes); `10a47edc` 17.1 / 12.7 / 16.8 s (8315 nodes, a second long task of 2.6-5.4 s); the fix 6.3 / 5.2 /
    10.4 s (first task, then 11-13 tasks of 0.05-1.2 s). Earlier single runs agreed (`eea84371` 8.5-9.1 s first paint,
    `10a47edc` 11.5-11.9 s). `content-visibility: auto` injected on `.row`: 8.6-10.3 s first paint, longest 8.0-9.7 s,
    no gain. A CPU profile at 1x: `(program)` 482 against 228 ms; the JS self time is about equal.
  - Tests that failed at `10a47edc` (the new and changed test files copied into a detached worktree,
    `npx vitest run ... --reporter=json`), 19: `record.test.ts` 3 (the page's picture, the dialog's link, the face's
    picture without `onopen`), `roll.test.ts` 6 («Открыть карточку», the dialog's link), `tableNav.test.ts` 1,
    `tableRows.test.ts` 2, `shell.test.ts` 2, `signInPrompt.test.ts` 2, `pickRow.test.ts` 1, `tables.test.ts` 1,
    `rollPage.test.ts` 1; `node tests/derived.js` 4 FAIL on the old `404.html`. All pass on the fix.
  - Focused vitest: `record`, `roll`, `rollResult`, `alt`, `a11y`, `homebrewEditor`, `tableNav`, `tableRows`,
    `tables`, `search`, `sharedListPage`, `homebrewCatalog`, `selectionBar`, `homebrewPage`, `listPage`, `shell`,
    `pickRow`, `signInPrompt`, `itemPage`, `lists`, `listsPage`, `rollPage`, `help`, `std`: all pass.
  - `npx eslint` over the changed files: no issues; `npm run typecheck`: 0 errors, 0 warnings.
  - `node tests/derived.js`: everything matches; `node tests/contracts.js`: contracts match the fixtures;
    `node tools/decisions.js`: 306 decisions.
  - `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1..4 (98, 97, 97, 97 states):
    122 goldens moved and one new (`_tables_eq_weapon_data_notes_from_more.txt`); every changed line read: the picture
    button gone from the page, «Открыть карточку» / "Open card" on results, the dialog's link «Открыть страницу»,
    the name links' description «Открыть страницу», the boxed prompts' «Войти» focused with «Отмена», «Ещё» no
    longer focused after «Сохранить себе»; nothing else.
  - `npm run check:built`: first FAIL, 264.1 kB over 264; raised to 265 and 322 by the standing rule (reason in
    `tools/bundle-budget.mjs`, `.claude/README.md`, the commit); configured build with placeholder
    `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`, `node tools/bundle-budget.mjs`: 321.4 kB within 322.
  - `npm run check:built` again: exit 0, 264.1 kB within 265, `dist/` carries no fake cloud.
  - `impeccable detect --json --no-inline-ignores app/src`: 67 findings (69 before); in touched files only
    `design-system-*` advisories (`HelpBox`, `RecordCard`, `Shell`, `TableRows`). `git grep -n impeccable-disable -- app/src`: nothing.
  - `npm run lint:untyped`, `npm run lint:typed`: no output (clean).
  - `rtk npm run check:fast`, first run: FAIL at vitest, three tests: `searchPage.test.ts` "shows 300 of 305" read the
    rows in the first task (now `waitFor` the 300), and `tableRows.test.ts` timed out at 30 s under coverage with 458
    rows and axe over them (now 150 rows, axe on the 80-row table, a fresh task before each test).
  - `rtk npm run check:fast` (after the fixes above and the escapes in `tests/derived.js`): PASS in 587 s, 2845 tests
    with coverage, 264.1 kB within 265; gate credit armed.
  - Browser cases changed (`states.js` 31, `inventory.js` modal entry, `print.js` D20, `driver.js` waits): not run
    locally (CI's); the golden run exercised the new `ready()` / `settle()` wait over `dist-test/` in every state.
- Batch 7 remediation, 2026-11-04 (diff base `2c3f3833`):
  - `gh run view 41845174864 --repo artex-x/daggerheart-loot --log-failed` (concluded, failure): `derived` and `check`
    (the 2026-10-30 decision file), `app/print` (`.page-h`), `app/states` 86 ("after the slide"). `e2e` passed.
  - Reproduced: `node -e` over `tools/decisions.js` `validate()`: the two problems; `node tests/run-all.js app/print`
    on the remediation build before its test fix: FAIL, `failed to find element matching selector ".page-h"`; a probe
    of case 86's slide (`scratchpad/probe86.js`, three runs): `transitionend` from `A` (`color`) reaches `.topbar`.
  - Failing direction: a detached worktree at `2c3f3833` with the new tests copied in: `npx vitest run` of
    `homebrewImport`, `importPanel`, `i18n` filtered to "zip": 3 failed; then `itemPage`, `record`, `shell`,
    `accountPage`, `i18n`: 8 failed (each new or changed assertion), 349 passed. The worktree is removed.
  - `npx vitest run` of `homebrewImport`, `importPanel`, `i18n`, `searchPage`, `tables`, `itemPage`, `record`, `shell`,
    `accountPage`, `a11y`: 665 passed.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0 (after typing the boundary snippet's `reset`). `npx svelte-check
    --fail-on-warnings`: 0 errors, 0 warnings.
  - Probes on the built app (`scratchpad/probe7.js`, `probe7w.js`, `probe7sep.js`), top of `[data-primary]`:

    | State | 320x568 | 360x640 (limit 256) | 761x768 | 1180x720 (limit 288) |
    |---|---|---|---|---|
    | `~ searched` RU, EN | 271.2 | 230 | 279.4 | 279.4 |
    | a kind picked RU, EN | 297.2 | 256 | 279.4 | 279.4 (was 301) |

    Search box at 320 with a pick: RU 118.3 px, EN 152.2 (before: RU «Выбрать» to 324.8 px, past the window). The
    count line at 1180 RU «Снаряжение · Показано 91 из 139» 960.6-1149 px on the kind row; two kinds 890.1-1149. The
    separator: 2.6 px both sides with `&nbsp;·&nbsp;`, 0 px after the dot with `&nbsp;·&#32;`.
  - `npm run build:test`, then `node tests/app/golden.js --update --only=` per family, one at a time (with
    `MSYS_NO_PATHCONV=1`): `#/account` 6 states, 5 moved (the subtitle line and the elision shift); `#/h/` 11 states,
    2 moved (the status line); `#/i/` 40 states, 2 moved (the status line); `search` 24 states, none moved. Each diff
    read.
  - Scratch loader of `states.js` on `dist-test/`: cases 83 and 93 passed (`~ kind picked` 279 / 288 RU and EN), then
    86, 93 and 94 passed. `rtk node tests/run-all.js app/print`: ok, 609.6 s. `node tests/derived.js`: everything
    matches.
  - `node tools/decisions.js`: 304 decisions.
  - `npm run check:built`: exit 0, 263.4 kB within 264. Configured (`vite build` with placeholder
    `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, `node tools/bundle-budget.mjs`): 320.8 kB within 321
    (CI's 0.1 kB more stays under it); no limit moved. `dist/` rebuilt unconfigured after.
  - Detector, `npx impeccable detect --json --no-inline-ignores app/src`: 67 findings (67 before).
  - `origin/main` (`d83384b4`) is already in the branch: no merge commit.
  - `rtk npm run check:fast`, last: exit 0 in 675 s, 76 files and 2831 tests with coverage, 263.4 kB within 264;
    gate credit armed.
  - Not run locally (CI's): `app/states` whole, `app/contracts`, `app/hues`, `app/typo`, `sweep.js`, `e2e`, the
    whole golden set.
- Batch 7, 2026-11-04, on the final tree (diff base `0a43491f`):
  - `npx vitest run` of `searchPage`, `accountPage`, `printPage`, `shell`, `tables`, `button`, `itemPage`, `record`,
    `homebrewEditor`, `homebrewPage`, `homebrewCatalog`, `listPage`, `sharedListPage`, `a11y`, `fake-cloud`,
    `app/src/lib`, `state/app`: pass after the fixes (searchPage 31, accountPage 46). Kinds proof: the case «leaves the
    roll pages' kinds on» in a detached worktree at `0a43491f`: 1 failed (`aria-pressed="false"` on the roller's chip).
  - `npx svelte-check`: 0 errors. `npm run lint:untyped`, `npm run lint:typed`: exit 0.
  - `node --test tools/artwork/lib.test.mjs`: 77 pass; `CARD_HEAD_SHA256` did not move.
  - `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4`, n = 1 to 4. Deviation: the inventory
    gained two entries while shards 1 and 2 ran, which moved the index partition, so `--update --only=` re-seeded the
    `search`, `#/account`, `#/l/`, `#/print/`, `load failed`, `grid searched` and `homebrew as gm2` families on the final
    inventory; then `node tests/app/golden.js --shard=1/4` and `--shard=2/4` compared: 97 and 97 states, unchanged (shards
    3 and 4 had run on the final inventory). Moved: 11 `_search*`, 4 `_account*`, `_l_retired`, `_l_AAAA`,
    `_print_ci1_q1`, `_tables_homebrew_as_gm2`; new: 9; deleted: `_search_kind_off`. `_p_bad`, `_p_set_expired1_as_gm2`
    and `_account` did not move (deviation 1). 388 states.
  - `node tools/decisions.js`: 304 decisions.
  - `npm run check:built`: 263.3 kB, past 262, so the limit is 264 (the standing rule; under 266, no removal needed).
    `smoke-http.mjs` read the old not-found heading: its line now reads «Страницы по этому адресу нет».
  - Configured: `vite build` with placeholder `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`,
    `node tools/bundle-budget.mjs`: 320.7 kB, past 320, so the limit is 321 (CI's 0.1 kB more stays under it).
    `tools/bundle-budget.mjs` and `.claude/README.md` carry both. The 270 kB ceiling is not reached, so the owner's 300 kB
    ceiling (orchestrator message, 2026-11-04) is not written anywhere yet.
  - Detector, `impeccable detect --json --no-inline-ignores app/src`: 67 findings (67 before); in touched files only the
    `design-system-*` advisories of `Button`, `PrintPage` and `TableRows`, none in a new file.
  - Spelling over added lines and new files: no hit.
  - Cases 83, 93 and 94 once through a scratch loader of `states.js` on `dist-test/`: all passed after two fixes (case
    93's English box name; the search head at 1180 first measured 289.4 > 288, see below).
  - First screen, measured in the built app (top of `[data-primary]`):

    | Row | 360x640 (limit 256) | 1180x720 (limit 288) |
    |---|---|---|
    | `#/search ~ searched` | 230 RU, 230 EN | 279 RU, 279 EN |
    | `#/search`, a kind picked (not a row) | 252 | 301 |
    | `#/account as gm1` | 241 RU, 218 EN | 186 RU, 186 EN |

    At 1180 the lead takes two lines; the search row and the kind row margins were tightened from 289.4 to 279.4. The
    named fix if a host passes 288: hide the lead from 761 px (removes visible text; the orchestrator logs it).
  - D8 probe (built app, `issues/57/mocks/7/built/shoot.js`): EN page, «delete» typed, «Delete for good» enabled at 360
    and 1180; RU with «удалить» the same. The typed word follows the interface language; the old D8 capture was an
    artefact of the golden typing the Russian word on the English half. The golden now types «delete» there (`again`).
  - `node issues/57/mocks/7/built/shoot.js`: the set in `mocks/7/built/`, 360 and 1180, RU and EN, and `/search` at 761.
  - 6-N1: not measured (no editor state in this re-seed has a 120-character name; the editor's layout did not change).
  - `rtk npm run check:fast`, last: exit 0 in 553 s, 4101 tests with coverage, 263.3 kB within 264; gate credit armed.
    Its first two runs failed: `golden.test.mjs` refused the id `#/account as gm1 ~ narrow` (now `#/account ~ narrow as
    gm1`) and the hold `print` (its pattern gains `print`); then the 300-row selection case timed out under coverage
    (one `fireEvent` per press, a 60 s limit).
  - Not run locally (CI's): `app/states` whole, `app/contracts`, `app/hues`, `app/typo`, `app/print`, `sweep.js`, `e2e`.
- Batch 6 remediation, 2026-11-04 (diff base `4857babc`):
  - `gh run view 41813328286 --repo artex-x/daggerheart-loot --log-failed`: the five failures of step 1 of the old
    "Next batch" list (sweep 360, 390, 768, 1180 en; states 63, 91; e2e F14).
  - `npm run build:test` on `4857babc`, then a scratch loader of `states.js` filtered to 63 and 91: both failed as on
    CI. A probe found the import open and its caption read «ИМПОРТ ПРЕДМЕТОВ ИЗ ФАЙЛА JSON» by `innerText`.
  - A scratch loader of `sweep.js` filtered to the two entries, at 360, 390, 768 and 1180, RU and EN, after the test
    fix: `page sweep (dist-test/): clean`. A probe of F14's seven `pick` calls at 1180 on `#/homebrew/new as gm1`:
    all found, «Физический» included.
  - Probes on the built app: 6-R1 at 320x568 RU, «Ещё» 245-314 in a bar of 17-288 before, 219-278 after (EN 215-278,
    360 RU 259-318 in 17-328). 6-N2 at 360 EN: the damage entry one rect of 39 px with the bullet on «1-99.» before,
    on the first line after (shot read).
  - `npx vitest run app/src/components/homebrewEditor.test.ts app/src/components/homebrewPage.test.ts
    app/src/components/markupField.test.ts`: 247 passed. The two new `homebrewEditor` cases at `4857babc` in a
    detached worktree: 2 failed, 96 passed.
  - Scratch loader of `states.js`, cases 63, 72, 85, 91 and 92 on the final build: all passed.
  - `node tools/decisions.js`: 303 decisions.
  - `node tests/app/golden.js --update --only=homebrew` (87 states): exit 0, 27 `_homebrew_*` goldens moved, each
    only by the `StaticText` «необязательно» / "optional" that left a hidden caption (6-N5), and the elision counts
    around it. No other family renders `FormField`'s word without `for`.
  - `node issues/57/mocks/6/built/shoot.js`: the editor and card-form shots re-taken; the first-screen tops did not
    move (243, 223, 246, 241 at 360; 254, 175, 198, 252 at 1180).
  - `npx prettier --write` over the touched files; `npm run lint:untyped`, `npm run lint:typed`: exit 0.
  - `npm run check:built`: exit 0, 261.6 kB within 262.
  - Configured: `vite build` with placeholder `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`,
    `node tools/bundle-budget.mjs`: 318.92 kB, within 319, but CI's 0.1 kB more passes 319, so the limit rises to
    320 (`tools/bundle-budget.mjs`, `.claude/README.md`).
  - `rtk npm run check:fast`, last: exit 0 in 561 s, 40 files and 1557 tests with coverage, 261.6 kB within 262;
    gate credit armed. The fix commit is `3e0106c8`.
  - Not run locally (CI's): `app/states` whole, `app/sweep`, `app/hues`, `app/typo`, `app/print`, `e2e`.
- Batch 6, 2026-11-04, on the final tree:
  - `npx vitest run` of the affected files (`homebrewPage`, `homebrewEditor`, `homebrewImport`, `homebrewTabs`,
    `homebrewBulk`, `homebrewCatalog`, `homebrewPrintPreview`, the three `timed` files, `cropDialog`, `record`,
    `tables`, `shell`, `selectionBar`, `a11y`, `alt`, `std`, `rollPage`, `sections`, `rollResult`, `pickRow`,
    `quickItem`, `lib/homebrewForm`, `lib/help`, `lib/i18n`, `lib/label`): pass after the fixes. Reproduction of
    the preview bug on `da96cbf3`: `.badge.eq-weapon` was null.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0. `npx svelte-check`: 0 errors.
  - `node --test tools/artwork/lib.test.mjs`: 77 pass, `CARD_HEAD_SHA256` did not move.
  - `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4`, n = 1 to 4, one at a time: 380 states,
    64 `_homebrew_*`, 39 `_roll_*` (5-R2, 5-N10) and 4 `_lists_*` goldens moved (the `own item` states: the star and
    the word), 14 new, 4 deleted, none in any other family. Exit 1 on shard 1: the 4 stale files, deleted by `git rm`.
    Exit 1 on shard 4: `~ more as gm3` found a real defect (deviation 18), fixed. Then `--only=~ more as gm3` and
    `--only=homebrew/s` re-seeded what later edits moved. Deviation: one `check:built` ran during shard 1 and rebuilt
    `dist-test/` under it; the source was the same, and the shard reported no other failure.
    `node tests/app/golden.js --only=homebrew` on the final build: exit 0, unchanged.
  - `node tools/decisions.js`: 303 decisions.
  - `npm run check:built`: exit 0, 261.5 kB within 262 (258.0 before); `dist/` carries no fake cloud.
  - Configured: `vite build` with placeholder `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`,
    `node tools/bundle-budget.mjs`: 318.8 kB within 319, with CI's 0.1 kB 318.9. `tools/bundle-budget.mjs` and `.claude/README.md` carry both. The unconfigured total is under 263, 8.5 kB below the 270 ceiling.
  - Detector, `impeccable detect --json --no-inline-ignores app/src`: 67 findings (67 before); in touched files only `CropDialog`'s two `design-system-*` advisories and `tokens.css`'s two, none in a new file. `git grep -n impeccable-disable -- app/src`: nothing.
  - Spelling over added lines and new files: only `aria-labelledby`.
  - First screen, measured in the built app (top of `[data-primary]`, RU and EN equal):

    | Row | 360x640 (limit 256) | 1180x720 (limit 288) |
    |---|---|---|
    | `#/homebrew as gm3` | 243 | 254 |
    | `#/homebrew/sets ~ long name as gm4` | 241 | 252 |
    | `#/homebrew/new as gm1` | 223 | 175 |
    | `#/homebrew/hb_longsrcaaaaaaaaa as gm4` | 246 | 198 |

    The Sets row first measured about 286 at 360 by hand, so the create button and the count share a row on the Sets, Rules and Sources tabs (deviation 17).

  - A9 probe, a 3:2 picture (600 x 400): the frame's top 17 px into a 287 px stage at 360x640 and 29 px into 486 px at 1180x720, the picture's top on it, so the 3:2 picture fills the frame at the smallest zoom and nothing is cut above it (A9 holds). `getComputedStyle` cannot read a slider's pseudo-element, so the 24 px thumb is read from the shot `editor-crop`; the native thumb took no size until the slider drew its own, deviation 11. The hint is `position: absolute` (`.vh`).
  - `git grep` of each moved control over `tests/`: `flows.mjs` (F17 keeps its `d.tick`, which opens the mode, and
    its presses at 1180; the `*` labels went from F15, F16), `states.js` (67, 82, 83, 91, 92), `inventory.js`,
    `hues.js`, `sweep.js`, `driver.js`, `print.js`. Every e2e flow on `/homebrew` read: F14, F15, F16, F17, F18,
    F20 run at 1180 px, so the import toggle, the bar's buttons and «Удалить» keep their names and places.
    `app/states` cases 91 and 92 are written, not run: CI's.
  - `node issues/57/mocks/6/built/shoot.js`: the set in `mocks/6/built/`, 360 and 1180, RU and EN, and `/homebrew` at 761.
  - `rtk npm run check:fast`: run last; its result is in the implementer's report.
  - Not run locally (CI's): `app/states`, `app/contracts`, `app/print`, `app/typo`, `app/hues`, `sweep.js`, `e2e`.
- Batch 5 remediation, 2026-11-04, on the final tree:
  - `npx vitest run` of `rollResult`, `pickRow`, `rollSelect`, `record`, `sections`, `a11y`, `selectionBar`
    and `app`: 533 passed. The three new `rollResult` cases failed at `9d4f47ec` (3 failed, 9 passed).
  - `node tests/run-all.js app/typo`: ok, 187.9 s. `npm run lint:untyped`, `npm run lint:typed`: exit 0.
  - `npm run check:built`: exit 0, 258.0 kB within 258 (257.8 before): the budget has no room left.
  - Cases 31, 89 and 90 from a scratch copy of `states.js`, filtered to the three, on `dist-test/`: all
    passed. `app/states` itself, `app/sweep`, `app/hues` and the goldens are CI's. No golden was re-seeded.
  - `rtk npm run check:fast`: run last; its result is in the implementer's report.
- Batch 5, 2026-11-04, on the final tree:
  - `npx vitest run` of 22 files (the plan's list, plus `sections`, `chip`, `listPage`): 888 passed, then
    `app/src/lib/std.test.ts`: 3 passed; `check:fast` ran them again with the later tests. `npx svelte-check`: 0 errors.
  - `node --test tools/artwork/lib.test.mjs`: 77 pass, with the new size row and `CARD_HEAD_SHA256`.
  - `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4`, n = 1 to 4, one at a time:
    exit 0, 93 states a shard, 370 states. 60 goldens moved, 7 new: 33 `_roll_*`, 4 `_account*`, 23
    `_lists_*` (the one line of deviation 1, read in the diff), none under `_tables_*` or `_i_*`.
    Two later CSS lines (the 96 px square, the menu's scroll margin) change no tree.
  - `node tools/decisions.js`: 302 decisions.
  - `npm run check:built`: exit 0, 257.8 kB within 258 (255.7 before); `dist/` carries no fake cloud.
  - Configured: `npm run build` with placeholder `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`,
    `node tools/bundle-budget.mjs`: 315.2 kB, so the limit is 316 with CI's 0.1 kB. `tools/bundle-budget.mjs`
    and `.claude/README.md` carry both. The unconfigured total is under 266, 12.2 kB below the 270 ceiling.
  - Detector, `impeccable detect --json --no-inline-ignores app/src`: 67 findings (69 before; `broken-image`
    in `orGrid.test.ts` is gone); in touched files only `RecordCard`'s three `design-system-*` advisories,
    none in a new file. `git grep -n impeccable-disable -- app/src`: nothing.
  - Spelling over added lines: only `aria-labelledby`.
  - First screen, measured in the built app (top of `[data-primary]`, RU and EN equal):

    | Row | 360x640 | 1180x720 |
    |---|---|---|
    | `#/roll/std` | 323 (exception 325) | 267 (limit 288) |
    | `#/roll/alt`, `#/roll/voa`, `#/roll/wondrous`, mwt | 251 (limit 256) | 267 |

    The lead line stays, and 1180 still passes the 270 target. The crit's offset equals `#/roll/alt`'s:
    the plate is the first child of the marked block.
  - A measuring script on the built page (`plan-5.md`, "Risks", not a suite): the head on one line at 761
    (all three middles 161, RU and EN); the results line on one line at 760, 390, 360 and 320, except
    `/roll/alt` RU at 320, which wraps once with «Ещё» in view; the dice 3 + 2 and uncut; the card's flip at
    600/601; the add menu with 150 lists under the header. It found two defects, fixed: the 96 px
    picture was 72 px tall, and the add menu's top sat 12 px under the header.
  - `git grep` of each moved control over `tests/`: `flows.mjs` (F18), `states.js` (14, 31, 83), `inventory.js`,
    `hues.js`, `sweep.js`, `driver.js`; `typo.js` runs at 1180, where `.helpbtn` stays; `contracts.js` reads
    no moved control. `app/states` cases 89 and 90 are written, not run: CI's.
  - `node issues/57/mocks/5/built/shoot.js`: the set in `mocks/5/built/`, 360 and 1180, RU and EN, and `alt` at 761.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0. `rtk npm run check:fast`, last: exit 0. Its first run
    failed on branch coverage of `HelpItem`, `RollSelect` and `DiceBar`: two tests and deviation 9 closed it.
  - Not run locally (CI's): `app/states`, `app/contracts`, `app/print`, `app/typo`, `app/hues`, `sweep.js`, `e2e`.
- Batch 4 remediation, 2026-11-04, on the final tree:
  - `npx vitest run` of `record`, `itemPage`, `pickRow`, `recordHost`, `homebrewEditor`, `badge` tests: pass
    after two stale `record.test.ts` assertions moved to the dialog and the path line.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0.
  - `node --test tools/artwork/lib.test.mjs`: 77 pass, with the new `CARD_HEAD_SHA256`.
  - `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4`, n = 1 to 4: exit 0, 45
    goldens moved, all `/i/` and `/h/`, none new. Deviation: the tool moved each shard to the background
    at 180 s, so the four shards overlapped, against "one at a time". A full
    `node tests/app/golden.js` then ran alone: 363 states, unchanged, exit 0.
  - Cases 3, 9, 10, 11, 22, 78, 88 through an in-memory loader: pass. The first run of 88 failed two
    lines at 360 RU with 12 px insets, which set N2's 11 px and 6 px gap.
  - `node issues/57/mocks/4/built/shoot.js`: the set again, with `rule-card` and `rule-card-open`. The
    chevron reads at the row's right end at 360 and 1180, and it turns up when open.
  - `npm run check:built`: exit 0, 255.7 kB within 256; `dist/` carries no fake cloud.
  - `rtk npm run check:fast`: exit 0 in 714 s, 1471 tests with coverage, 255.7 kB within 256. Its first
    run found `accountMenu.test.ts` still passing `up`; the test now passes `flip`.
  - Not run locally (CI's): the rest of `app/states`, `app/contracts`, `app/print`, `app/typo`,
    `sweep.js`, `e2e` with F9 to F20, the configured budget (limit 314; 255.7 is 0.2 kB up on batch 4).
- Batch 4, 2026-11-04, on the final tree:
  - `npx vitest run` of the twenty files of `plan-4.md` plus `accountMenu`, `fake-cloud`: pass after the fixes.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0. `node --test tools/artwork/lib.test.mjs`: pass after the hash.
  - `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4`, n = 1 to 4, one at a
    time: exit 0. 82 goldens moved, 7 new, all in the families of `plan-4.md` (two more are bar states:
    `~ own items hidden`, `~ selection copied`). 363 states.
  - `node tools/decisions.js`: 301 decisions.
  - `npm run check:built`: exit 0, 255.5 kB within 256 (253.6 before); `dist/` carries no fake cloud.
  - Configured: `npm run build` with placeholder `VITE_SUPABASE_*`, `node tools/bundle-budget.mjs`:
    312.9 kB. The limit is 314, not 313: CI's `e2e` read 0.1 kB above this host at batch 3b, and 313.0
    can pass 313. Correct it if CI's figure says otherwise.
  - Detector, `impeccable detect --json --no-inline-ignores app/src`: 69 findings, unchanged; in touched
    files only `design-system-*` advisories (`AddToList`, `Button`, `RecordCard`), none in a new file.
    `git grep -n impeccable-disable -- app/src`: nothing.
  - Spelling over added lines: only `aria-labelledby`.
  - First screen, measured in the built app (top of `[data-primary]`, RU and EN equal): `/i/ci1` and
    `/h/<513> as gm1` 137 at 360x640 (limit 256), 89 at 1180x720 (limit 288).
  - `node issues/57/mocks/4/built/shoot.js`: the set at 360 and 1180, RU and EN, in `mocks/4/built/`.
  - Cases through the in-memory loader (deviation 13): 3, 9, 10, 11, 22, 23, 42, 78, 88 pass. Case 86
    failed once on «after the slide» with two other cases loading the host, and passed alone: a timing
    read, no code of this batch moves it.
  - `git grep` of each moved control over `tests/`: the left presses are the `/s/` page, the list page
    and the selection bar, which keep their buttons. F18 and F20 of `flows.mjs` go through `d.more`
    or `d.openMore`; F8 stays on `d.press`, because `/s/` keeps its own button.
  - `rtk npm run check:fast`: exit 0 in 812 s, 3033 tests with coverage, 255.5 kB within 256.
  - Not run locally (CI's): the rest of `app/states`, `app/contracts`, `app/print`, `app/typo`, `sweep.js`, `e2e`.
- Batch 3b remediation (`3b-fix`, review `reviews/3b.md`):
  - B1: `.topbar.away:not(:has(:focus-visible))`; case 86 gains a trusted click on the tables
    job link then a scroll (hidden), a real Shift+Tab into the header (shown), Forward and a
    reload (N3). Run through the in-memory loader on `dist-test/`: 86 and 87 pass. With the
    built CSS patched back to `:not(:focus-within)`, 86 fails on the click line (top 0).
  - R1: `ScrollRead.held` is a function, called only on a read that would flip the header;
    `nextHeader` returns `s` when nothing changes; two new unit tests.
  - R2: `select` removed from `FIELD`. N1: 311.1 kB in the budget comment and README. N2: 356
    states in `COVERAGE.md`.
  - `npx vitest run` of `headerScroll` and `shell` tests: pass. Both lints: exit 0.
  - `npm run check:built`: 253.6 kB within 254.
- Batch 2 and its fix pass: exact lines in `git show 65829261:issues/57/handoff.md`.
- First-screen offsets after batch 3 (case 83, RU, EN; these two rows are asserted):

  | Route | 360x640 | 1180x720 | Limit |
  |---|---|---|---|
  | `/tables/eq_weapon` | 234, 234 | 244, 244 | 256 / 288 |
  | `/tables/eq_weapon` two filters | 252, 252 | 244, 244 | 256 / 288 |

  The other routes, measured after batch 2 and logged only (360 RU, EN; 1180 RU, EN):

  | Route | 360x640 | 1180x720 | Batch |
  |---|---|---|---|
  | `/roll/std` | 843, 769 | 561, 561 | 5 |
  | `/i/ci1` | 255, 218 | 170, 170 | 4 |
  | `/search` searched | 533, 467 | 419, 419 | 7 |
  | `/account` gm1 | 241, 218 | 170, 170 | 7 |
  | `/p/set-emberaxe` gm2 | 583, 531 | 310, 310 | P |
  | `/homebrew` gm3 | 719, 675 | 604, 604 | 6 |
  | `/homebrew/sets` long name gm4 | 522, 478 | 408, 408 | 6 |
  | `/homebrew/new` gm1 | 237, 237 | 189, 189 | 6 |
  | `/lists` gm1 | 526, 526 | 455, 455 | 8 |
  | `LIST_A` gm4 | 464, 464 | 377, 377 | 9 |
  | `/s/player-token-1` | 529, 529 | 481, 481 | 9 |

- Evidence: `issues/57/mocks/3/built/`, 360, 768 and 1180, RU and EN
  (`node issues/57/mocks/3/built/shoot.js`), with `picker-*` and `catalog-alt` at 360 added.
- Fix pass, confirmed in the built app of `ef44bb5d` before the fix (one puppeteer probe):
  B5 53 px of the column and 38 px of the last chip under the bar at 1180x720; R1 focus on
  `body` after the link and the pin; R2 sheet and menu reopen on return, focus on `body`,
  while the picker does not reopen (`TableNav` remounts); R3 focus on `body`; R4 «Нет
  совпадений с «»». The same probe on the fixed build: each is gone.
- Failing direction: a detached worktree at `ef44bb5d` with the new tests: 14 failed, 132
  passed (`tables`, `selectionBar`, `rowTags`). B5 and R5 are CSS: cases 84, 85 of `app/states`.
- Commands on the fix pass (2026-11-04):
  - `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4`, n = 1 to 4,
    one at a time: exit 0, 89, 89, 89, 88 states. 30 goldens moved: the alternate tables, idle
    `/s/`, the wide search row's values, «Выбрать» on empty tables. `~ searched` did not move.
  - `rtk node tests/run-all.js app/contracts,app/states,app/typo,app/hues,app/print,contracts,dataint,derived,stub`: all suites passed in 797 s.
  - `rtk node tests/app/sweep.js 360`: clean (RU, EN); `rtk node tests/app/sweep.js 768`: clean (RU, EN).
  - `npx vitest run app/src/components app/src/lib/rowTags.test.ts app/src/lib/tables.test.ts`:
    1646 passed, 1 stale count assertion, fixed; `homebrewCatalog.test.ts` re-run in `check:fast`.
  - `npm run lint:typed`, `npm run lint:untyped`: exit 0.
  - `rtk npm run check:fast`: exit 0 on the final tree, 2726 tests with coverage, within the 253 kB budget.
- Not run locally in the fix pass (the orchestrator dropped them; CI covers them):
  `sweep.js` at 390 and 1180, `npm run check:built` (the `check:fast` budget step runs the
  bundle budget).
- Batch 3b, 2026-11-04, on the final tree:
  - `npx vitest run app/src/lib/headerScroll.test.ts app/src/ports/ports.test.ts app/src/components/shell.test.ts app/src/components/tables.test.ts app/src/components/listPage.test.ts`: 501 passed.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0.
  - `npm run build:test`, then `node tests/app/golden.js --update --only="header hidden"`: one new file.
  - `node tools/decisions.js`: 300 decisions.
  - `npm run check:built`: exit 0, 253.6 kB within 254; `dist/` carries no fake cloud.
  - Configured: `npm run build` with placeholder `VITE_SUPABASE_*`, `node tools/bundle-budget.mjs`: 311.0 kB within 312.
  - `impeccable detect --json --no-inline-ignores app/src`: 69 findings, unchanged; in touched
    files only `design-system-*` advisories (`Shell`, `TableRows`, `tokens.css`).
    `git grep -n impeccable-disable -- app/src`: nothing.
  - Spelling, the `tests/derived.js` pattern over added lines and new files: 0 hits.
  - Shift+Tab probe, 30 stops from row 120, page scroll padding removed by injected CSS, then
    with the fix: 320 EN 17 then 0, 360 RU 16 then 0, 1180 RU 10 then 0. Header: 152 px at 320
    EN, 111 at 360, 63 at 768 and 1180.
  - Cases 86, 87 through an in-memory loader on `dist-test/`: both passed.
  - `node issues/57/mocks/3b/built/shoot.js`: ten shots; hidden bottom 0 at scroll 800, back at
    top 0 at 780, focused at top 0 (the page moved to 558: the deferred focus jump).
  - `rtk npm run check:fast`: exit 0 in 783 s, 2138 tests with coverage, 253.6 kB within 254.
  - Not run locally (CI's): `app/states`, `app/contracts`, `sweep.js`.
- Detector, `impeccable detect --json --no-inline-ignores app/src`: 69 findings (72
  on 2026-10-30); in touched files only `design-system-*` advisories (`AddToList`,
  `FilterBar`, `TableRows`, `tokens.css`), which batch 10 records.
  `git grep -n impeccable-disable -- app/src`: nothing.
- Spelling scan over added lines and new files: only `aria-labelledby`.

## Next batch (implement-ready)
Wave 2's blind review is done and remediated (step 6). Next: batch 9a (step 7), after the CI of the remediation's
push. Owner AFK rules hold
(`context.md`, "Owner AFK", "Wave reviews", "Local gates", "Mocks are direction"); defaults go to
`C:\Users\Ignat\.dhloot\notes\owner-afk-2026-11-03\decisions.md` (items 1-11 so far).

In order:
1. Done: batch 6 with its remediation (CI credit passed on `0a43491f`) and batch 7 (Completed, "Batch 7").
2. Done: `polish` and `harden` of batch 7 (Notes) and its review (`reviews/7.md`).
3. Done: CI run 41845174864 of `2c3f3833` read; its three failures are fixed in step 4.
4. Done: the batch 7 remediation (Completed, "Batch 7 remediation"). The orchestrator waits on the CI of its push:
   cases 83 (the new `~ kind picked` row), 86, 93 and 94, `app/print`, `derived`, e2e F2.
5. Done (commit `docs(57): fold the placed items of batches 4-7 into the plan`, branch `claude/57-fold`, 2026-11-04): the open
   "Placed items" of `plan-4.md` to `plan-7.md` are in `plan.md` section 7 (batches 8, 9a, 9b, P, 10) and section 8; the
   gate-cost, `FIRST_SCREEN` and P5 entries were already done or present. Section 10 is a pointer plus D1-D13 and
   "Impeccable" (last full text: `git show 5ecca692:issues/57/plan.md`). `plan-9a.md` stays a brief until its batch.
6. Done: the wave 2 squash (`dbd3cf73` on `main`, merged back into `claude/57`; 3, 3b, 4, 5, 6, 7) and the blind
   review of waves 1 and 2 on production (`reviews/post-wave-2.md`).
7. Done: the post-wave-2 remediation (`cd32174d`, Completed, "Post-wave-2 remediation"; the CI credit armed on it
   2026-11-04). It edited `RecordCard`, `TableRows` and `TablesPage`, so batch 7b's dispatch re-reads them.
8. Done: batch 7b (Completed, "Batch 7b"; T1-T13, HD1 option A as measured, RC1 option B; three decision files and
   their pointers). Next: `polish` and `harden` (T10) on `RecordCard`, `RowMain`, `TableRows`, `TablesPage`,
   `TableNav`, `Badge` from the built app at 360 and 1180 px (`mocks/7b/built/` holds the shots), the batch review
   (trigger: changed UI, `tests/app/` changed), its fix cycle and CI of the tip: cases 83, 89, 95, 96, 97, `sweep.js`
   360 and 768 (the head cap), `app/print`.
9. The wave 2b squash (`plan.md` section 16; `orchestrate.prompt.md` closeout step 8): after 7b's review and the green
   CI run of its tip, `ci-credit.mjs` on the tip with a clean tree, the squash onto `main`, the deploy, the merge
   back. A read-only reviewer of the wave 2b scope on production is not required by the owner's wave reviews: it is
   skipped, and the wave 3 blind review covers it.
10. Wave 3 in this order: 9a (brief `plan-9a.md`; `opus`; its `FIRST_SCREEN`, `selectAll` and `sendAll` corrections
   are in "Placed items"; it starts on a clean `main`, builds its compact row on 7b's rule and reads cases 95-97 as the
   next three free numbers; production still holds the old list rows, so the interim mix is wave 2's), then refresh and
   run 8, 9b, P, 10; the wave 3 blind review; the whole-app blind review; closeout.

Facts for the dispatches:
- Local gates: affected vitest files, both lints after the last edit, the golden re-seed when goldens move
  (each shard with Bash timeout 600000), `npm run check:built`, the detector, `rtk npm run check:fast` last.
  Browser suites and sweeps run on CI.
- `ci-credit.mjs` refuses when a writer's edits are in the tree: while a batch runs, read the run with
  `gh run watch <id> --exit-status` in the background instead. Each writer checks its predecessor's run before
  it pushes. A pushed run must have concluded before the next push.
- Budget: 264.2 of 265 kB unconfigured, 321.6 of 322 kB configured after batch 7b (ceiling 350; raised by the post-wave-2 remediation). The owner raised the unconfigured
  ceiling to 300 kB (`context.md`); the batch that first passes 270 writes it. Raises follow the standing rule.
- The owner must keep Chrome open and signed in to Figma for batch P's burden export.
- `FilterBar` stays until batch 9a removes it, and `BatchBar` until batch 8; a golden is re-seeded, never edited.

## Blockers
- None.

## Deferred
- `/tables/eq_*` at 761-about 800 px in RU (batch 7b probe): the toolbar's five controls wrap to two lines, so the rows
  start at 381.5 px against 333.5 on the other tables. Case 96 reads 760 and 1050, not 761. Not fixed: the hidden
  toolbar slots were not built (Completed, "Batch 7b", deviation 3).
- The `--inject` model run of `roll-probe.cjs` was not repeated on the build of `377d0981`; the planner's production
  numbers stand for the model.
- `404.html`'s look (pw2-N1, the reviewer's deferred-scope half): it keeps the system font and draws no die mark;
  the words, the `h1` and the actions now match the app. A self-hosted font on a script-free host page needs its own
  `@font-face` path; batch 10's lock is the place to decide it.
- `/search` at 320x568 RU (batch 7 remediation probe): after a kind is picked in the sheet and the sheet closes,
  `scrollWidth` is 313 against a `clientWidth` of 305, and a probe that hides one element at a time finds the
  header's tab links. Case 93 checks no sideways scroll before the sheet opens, where it passes. Not investigated.
- 6-N1 (the next batch with a golden re-seed): add an editor entry with a 120-character name as the fourth
  `FIRST_SCREEN` row, or log its 1180 offset from one probe. From 761 px the `h1` takes three lines, so the
  offset at 1180 is unmeasured (about 240 of 288 by the review's estimate).
- `reviews/6.md`, "Checks still needed", item 3: the homebrew selection bar at 640x360 and at 768x1024.
- `reviews/5.md`, "Checks still needed", items 3 to 5 (not measured here): the first `/roll/alt` card's
  menu at 360x640 with 7 or more lists at scroll 0; a right-column card's menu at about 1015-1075 px with
  a long list name; Tab and Enter on the nine routes at 360.
- 4-R1 (wave 2 blind review; the owner's choice): at 360x640 «В список» ends inside the first screen
  on 21 of 98 sampled records at the 4:3 crop (median bottom 693 px, worst 908 px). No device above
  760 px is affected. Current behavior: on a phone the primary is below the fold on most records.
  1. Recommended: keep the page, and let a reader scroll. The text starts in the first screen on
     almost every record. Trade-off: adding to a list from a long record takes a scroll.
  2. A sticky «В список» on the page up to 760 px, like the dock. Trade-off: it covers about 62 px of
     text on every record, and it adds a new surface rule.
  3. 16:9 up to 760 px. Trade-off: it reaches half of the records, and it changes M4-4.
- `SharedListPage`'s failed branch (batch 9): «Повторить» drops the focus to `body`, as `ItemPage` did
  before 4-N6.
- P5 (batch 4, K11): `rollNo` («номер» / "roll") stays; batch 10 changes it with `tools/share-card.mjs`
  and the stubs after a plan review (`plan.md`, batch 10).
- Toast over «Ещё» (batch 4): at 360 an action toast covers the end of the menu for its 7 s; a second
  save by touch waits for it. Named for the batch 8 sheet decision.
- `RecordCard`'s dialog art at 500-760 px wide and 481-560 px tall: a 4:3 picture can fill the card, so
  the dock is not in view until a scroll (sticky holds inside `.card-body`). No phone portrait reaches it.
- Focus jump (batch 3b, measured facts item 3): a `focus()` on a header control moves the page up
  (scroll 1500 to 1199 at 320 px, to 1115 at 1180 px; 900 to 558 at 360 px with the fix). An
  existing defect, harmless for the hide: the upward move shows the header.
  `{ preventScroll: true }` fits only a control always in view, and `Menu` also serves controls
  that scroll away, so the fix needs its own look. At closeout it goes to `docs/specs/DEBT.md`
  unless a later batch fixes it.
- 2-R1 (answered for batch 3 on): the orchestrator-run `polish` and `harden`
  of section 10, "Impeccable". The batch 2 shell components still had a manual
  pass only; the post-release Impeccable audit is the backstop (with the C34 and
  A15 live-site toast check).
- 2-R3 (batch 10 audit): from 761 px the header draws brand, jobs, language,
  account while the DOM order is brand, language, account, jobs (WCAG 2.4.3).
  Recommended: name the trade-off in DESIGN.md "Navigation", "Header", and let
  the audit decide.
- 2-N6 (batch 10): DESIGN.md "The Same Label Rule" and FEATURES.md "Chrome" say
  "until their page's batch moves them"; batch 10's lock removes it.
- R5 of `reviews/plan-1-3.md` (deferred-scope): `review.prompt.md` names a third
  look `<name>-2.md`, while `agent-guard.mjs` reads only `plan-<batch>-<n>.md`.
- Batch 10: the tab and picker CSS copied into `HomebrewTabs` from `TableNav` (H2); `EQ_DT`'s abbreviations
  in the stat line (D15, shared).
- Batch 9b: `FormField`'s `help` prop and its `HelpButton` import go with `QuickItem`'s «?», the last caller.
- Batch 3 candidate: the 1180 px equipment column table of mock 3 (D6, Q3-T), if
  the owner says yes; one added item with its own mock check.
- N0-2 of `reviews/mocks-2.md` (batch 4): the error-page pattern's circled icon
  is a template shape; keep the heading, the cause and the action.
- `KeepNote.svelte` leaves with batch P (the Account page's Display note left with batch 7).
- `FilterBar.svelte`, `BatchBar.svelte`, `anyValue` and the shared page's
  `.fpill` reader in `tests/app/contracts.js` leave with their last callers
  (batches 8, 9).
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.
- Uppercase controls outside the capitals rule are audited by their surface
  batches (15 components carry `text-transform: uppercase`).
- Monospace labels still outside the Key Characteristics rule, owed to their
  surface batches: `.batch-all` (BatchBar), `.ordiv i` (OrGrid), `.altcol`
  (TablesPage), the ListPage summary labels (`.lnote`, `.lroll`, `.batch-lbl`,
  `.money-l`), HelpButton, `.steps-l` (RecordCard).

## Notes
- Impeccable `polish` and `harden` of batch 7 (orchestrator, 2026-11-04, on `2c3f3833`, from the shots `search-searched`,
  `account`, `account-delete` at 360 RU; no live pass): one item to check. `account__360__ru.png` draws a lead line
  under «Аккаунт» («Отображение, способы входа, выход и ваши данные.»), while the batch report says the page has
  no lead line. It may be the page-head sub of the plan, or a stale shot. Sent to the reviewer.
- Impeccable `polish` and `harden` of batch 6 (orchestrator, 2026-11-04, on `96710fe3`, from the shots
  `homebrew`, `editor-new` at 360 RU and `homebrew` at 1180 RU; no live pass): no finding.
- Impeccable `polish` and `harden` of batch 5 (orchestrator, 2026-11-04, on `9d4f47ec`, from the shots of
  `/roll/alt` and `/roll/std` at 360 and `/roll/alt` at 761; no live pass): no finding.
- Impeccable `polish` and `harden` of batch 3b (orchestrator, 2026-11-04, on `38767ca4`,
  from the `Shell` and `tokens.css` diff, `lib/headerScroll.ts` and the shots; no live
  pass): no finding. To check in the review: `onscroll` runs `held()`, a document query,
  on each scroll event unless the port throttles it.
- Impeccable `polish` and `harden` (orchestrator, 2026-11-03, on `ef44bb5d`): outcomes are
  under Completed and in `reviews/3.md`. Clean: `Sheet` focus, scrim and Escape; `viewport`
  listener cleanup.
- Mocks path: `issues/57/mocks/<N>/`; evidence: `issues/57/mocks/3/built/`, `mocks/3b/built/`.
- Planner defaults D1-D13 of batch 3: `plan.md` section 10, "Decisions of this refresh".
- The owner answered the feedback (`context.md`, "Feedback answers", "Header batch"). Next
  step: the batch 3b refresh.
- Cleanup performed / retained artifacts: `plan.md` Status collapsed the two
  "findings applied" sub-bullet lists and the earlier-refresh bullets (the file
  was at the 150 KB line); the last pre-collapse commit is `65829261`
  (`git log --oneline -3 -- issues/57/`: `65829261`, `30de6bf5`, `da7a3354`).
  `issues/57/mocks/measure.mjs` stays until closeout. Print evidence and the
  mock P worktree stay at `C:\Users\Ignat\.dhloot\notes\57\`.
- Session end partial progress (if any): none
- Durable items written to their homes this batch: `FEATURES.md`, `COVERAGE.md`, `STATE.md`,
  `DESIGN.md`, `.claude/README.md` (the budgets), the decision file named under Completed. The placed
  items of `plan-7.md` are the orchestrator's to fold into `plan.md` (batch 7: `FEATURES.md` "Rolling", "Tables and
  search", "Lists", "Print", "Account", "Chrome" and rules 3, 6, 7, 15; `STATE.md`; `DESIGN.md`; the decision file;
  `tools/smoke-http.mjs`).
