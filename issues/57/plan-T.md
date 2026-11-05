# Batch T - The Thumb Rule and the Reading Time Rule (implement-ready)

This brief is the implementer's whole input for batch T, with the mock `mocks/T/` (`index.html`, the probe
`probe.cjs` and its CSS `thumb.css`, the readings `measure-*.json`, the shots `shots/*.png`, the card mock
`listcard.html`). The owner approved both rules on 2026-11-05 ("Approve both", `context.md` item 10, "APPROVED").
Every other choice below is the recommended option, logged in the owner-AFK decisions file (item 21). A mock is
direction (owner, 2026-11-03): each departure is named in "Decisions". Section numbers ("section 7") are those of
`plan.md`. Guideline sources are cited by URL only.

Batch T runs after batch 9b and its remediation (CI credit passed), before batch N and batch P.

## Objective

Up to 600 px every control a person presses is a 40 px thumb target, so a phone at the table (players 80% of the
time, The Phone-First Rule) never meets a 28 or 32 px button beside 40 px dice. Every toast stays long enough to read
twice and holds while a pointer, a finger or the focus is on it. The `FIRST_SCREEN` rows at 360x640 keep their limits
through folds of spacing (measured on the live site: every row ends at or under today's top); `/roll/std` keeps its
named 325 px exception (318.7 measured with the folds), and a list row that the folds cannot hold takes its measured
exception. A browser check enforces both rules. Nothing new is stored; no string changes.

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a rebase).
- Read `git log --oneline -6`, then the shipped `Button.svelte`, `Chip.svelte`, `Seg.svelte`, `RollPage.svelte`,
  `TableRows.svelte`, `ListFind.svelte`, `ListCard.svelte`, `MoreMenu.svelte`, `Toast.svelte`, `app.svelte.ts`
  (`say`, `holdToast`, `#runToast`), `tokens.css`. Batch 9b edited `ListPage`, `SharedListPage`, `RequestsPanel`,
  `SharePanel`, `Chip`, `Seg`, `ListFind`: a line of this brief that no longer matches the code is the
  implementer's to adapt; `handoff.md` names the change.
- Case numbers: 108 and 109 are the next free `states.js` numbers after 9b's 105-107; `handoff.md` names the ones
  taken. Batch N's brief (`plan-N.md`) takes 110 and 111 after them.
- Host: memory-starved. Run vitest with `VITEST_MAX_WORKERS=2`, one suite at a time, and no browser suite in parallel
  with vitest.
- Impeccable cannot run from a subagent. The orchestrator runs `critique` on `mocks/T/` before the dispatch and
  `polish` and `harden` after S8 on the roll pages, the catalog, `/search`, `/lists`, the list pages and the selection
  bar at 360 and 390 px; fallback `impeccable:impeccable-finish-reviewer`.
- Steps are S1 to S10. The line "Session end partial progress" in `handoff.md` names the last finished step.

## Decisions of this refresh (planner defaults; the rules themselves are the owner's, 2026-11-05)

| # | Decision | Reason and trade-off |
|---|---|---|
| T1 | **The Thumb Rule, its form.** Up to 600 px (`@media screen and (max-width: 600px)`) every pressable control with a visible box (a border, a fill or a track) is at least 40x40 px; a menu item and a row target stay 44 px (`Menu`, `ModeRow`'s menu, `AddToList`'s rows). A control with no box (a text link in a list or a heading, the brand, a fold summary with no border) reaches 40 px by its padded box and gives the growth back by a negative margin, so no line moves. An existing `::after` target (`PageHead`'s pin, `ListCard`'s pick box, 44 px) stays. From 601 px the small button keeps 32 px. At every width a target is at least 24x24 px or keeps the 24 px spacing of WCAG 2.5.8; a link inside a sentence is the rule's one exception at every width (the check also skips what no thumb presses, T7). **Departure** from the guideline draft: it said "40 px tall and 40 px wide" and left open whether that is the box or the hit area; the box it is for every boxed control. | Sources: https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2 (Touch_Targets, 48 dp), https://developer.apple.com/design/human-interface-guidelines/accessibility (44x44 pt), https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (24 px, the inline exception). The box, not an invisible area, because the evidence is a mismatch the eye sees (32 px results buttons beside 40 px dice, `counter-std__360__ru.png` of the guideline review; 8-G1), and because a 40 px invisible area around a 28 px box in the results line overlaps the dice above it. Alternative (not taken): hit areas only, which moves no first-screen top but leaves two sizes of button side by side. |
| T2 | **One token.** `tokens.css` gains `--thumb: 0px` in `:root` and `--thumb: 40px` in `@media screen and (max-width: 600px)`. A component writes `min-height: var(--thumb)` and `min-width: var(--thumb)`; a fixed height takes `height: max(<its height>, var(--thumb))`. The 44 px menu rows keep their own rule. Print never matches the `screen` query. | About 25 components take the floor: one value and one breakpoint in one place ("Components compose tokens; they do not invent near-duplicate values"). Alternative: a `@media (max-width: 600px)` block with a literal 40 in each component (the `ModeRow` pattern): 25 copies of two numbers. `ModeRow`, `PickQty` and the dice keep their literal 40/44 (already compliant, not touched). |
| T3 | **First-screen folds at 360x640** (section "First-screen rows" below has every row). The roll pages: the results line grows 28 to 40 px (+12) and takes the space back from its own margins (`.reshead` `margin: 4px 0` to `0`, `.rp:not(.two) .rp-ctrl` `margin-top: 4px` to `0`, `ModeRow` up to 600 px `padding: 6px 0` to `4px 0`): measured 250.7 to 245.9 px (plain growth 265.9). The catalog: `.pickrow` `margin-bottom: 6px` to `4px` up to 600 px for the 2 px the 42 px `Seg` track adds: 252.4 to 248.4 (plain 260.4). The list pages: `ListFind`'s row grows 36 to 40 px (+4) and `.lfind` `margin-bottom` goes 8 to 4 px up to 600 px (estimate; S3 measures). `/roll/std` measured 323.5 to 318.7 px: its exception stays 325. `/s/` with its search row takes its measured value if it passes 302. | Without a fold the roll pages and the two-filter catalog pass 256 (265.9, 260.4) and `LIST_A ~ many` likely does (estimate 258-266); a spacing fold costs no feature and no label. Alternative per row: an `exception` at the measured value (logged in the AFK file), named in DESIGN.md "The First-Screen Rule". A row the folds do not bring under 256 takes that alternative and `handoff.md` names it. |
| T4 | **Text links.** Up to 600 px `RecordCard`'s name link (`.card-name a`), the footer's links, the brand, `HomebrewEditor`'s back link and any other box-less link the check finds take `display: inline-block` (where inline) and a vertical padding that makes the box 40 px, given back by the same negative margin (`padding-block: 10px; margin-block: -10px` on a 20 px line; `(40 - L) / 2` on a line of `L` px); the footer's licence `summary` takes `min-height: var(--thumb)` (the footer's last line: its growth moves no content). | No layout moves (the margin gives the padding back), and the padded box is the hit area. A link inside a sentence (`a` with `display: inline` in running text) is not touched: WCAG 2.5.8's inline exception. |
| T5 | **8-P1, the `/lists` card's «··· Ещё».** It leaves its own row: it sits in the card's top right corner, the slot the selection mode's pick box uses, as a text button (`MoreMenu` gains `variant?: 'plain' \| 'bare'`, passed to `Button`; `ListsPage` passes `bare` for the card); up to 600 px its box is at least 40x40 px; the name reserves the slot with `padding-right` (76 px at 360 RU, read the shot). **Departure** from mock 8 (the button on the chip's row): a card without a chip has no chip row, and the corner holds one control in each mode. | Review 8-P1: the bordered row adds about 46 px to every card (2.3 cards in the first screen at 360 against the mock's 3). `mocks/T/listcard.html` and `shots/listcard__360__ru.png` draw today, the corner and the fallback from the card's CSS: a card of 6 thumbs and the chip is 197 px today, 155 px with the corner (the «Ещё» box 59x40), 171 px with the row kept at 40 px. Fallback: the row stays and the button is 40 px (`variant` not added). The DOM order stays (the link, then «Ещё»), so no golden moves. |
| T6 | **The browser check.** One page-side function `targets(page, opts)` in `tests/app/lib.js` (two callers: the sweep step and case 109) returns every visible pressable control under the floor that a hit test does not prove: for a box under the floor it scrolls the control to the window's center and probes the 8 edge points of a floor-sized square on the box's center with `document.elementFromPoint`; every point on the control or inside it passes (padding and `::after` targets count). `sweep.js` at 360 and 390 px, RU and EN, floor 40 (44 for `[role^=menuitem]`); at 768 and 1180 px, floor 24 or the WCAG spacing circle. Case 109 runs the same function at 360x640 on the open layers that `sweep.js` does not open (list below). | A CSS read misses padding and pseudo-element targets; a hit test also catches a target that another element covers. Sources as T1. |
| T7 | **The allow-list** (exported beside `targets`, each entry one line with its reason): (1) a link inside running text (`a`, computed `display: inline`, its nearest block holds 20 or more characters beyond the link) - WCAG 2.5.8 "Inline"; (2) `a.skip` - shown on keyboard focus only (WCAG 2.4.1), no thumb reaches it; (3) a control that is `:disabled` or `aria-disabled="true"` - not pressable; (4) a native checkbox or radio inside a `label` - the label is measured instead, not exempt. Dense chips are not exempt: Material draws a 32 dp chip on a 48 dp target and Apple asks 44 pt, so a chip grows to 40 px. A new entry needs its reason and a `handoff.md` line. | The owner's approval names "every control"; each exemption above is one the sources make. |
| T8 | **The Reading Time Rule.** A plain toast lasts 4000 ms, an error toast 7000 ms, an action toast 7000 ms, and a long toast 10000 ms: one whose text holds an email address or more than 80 characters in either language (a third line in the 360 px toast), so the class is the same in Russian and English. Every toast holds its clock while a pointer or a finger is on it (`pointerenter` and `pointerleave`, which a touch fires too) or a person moved the focus into it, and runs on with the time it had left; the focus an undo toast takes itself does not hold it. The queue order of 2026-10-08 stays: a plain toast said while an error or an action toast shows waits and then shows for its own class; the arrival toast stays the lowest. A hidden tab runs a toast unseen, as today. | Sources: https://api.flutter.dev/flutter/material/SnackBar/duration.html (4 s), https://developer.apple.com/design/human-interface-guidelines/accessibility ("Minimize use of time-boxed interface elements"). 8-G4: the list-limit toast is an error with the email address (`limitText`), 110 characters RU: 10000 ms. 8-G4's "count" is the page's red count line, which keeps the fact; a count in a short toast («Удалено списков: 2») does not lengthen it. The old 1600/2600 ms came from the original `app.js`, not from an owner decision. Alternative: a reading-speed formula (50 ms per character): one number less to name, but a duration a person cannot predict and a test cannot pin. |
| T9 | **Constants.** `app.svelte.ts` exports `TOAST_MS = { plain: 4000, error: 7000, action: 7000, long: 10000 }` and `TOAST_LONG_CHARS = 80`; `say` picks the class with a module function `toastMs(mode, msg)` that draws `msg` in both languages (`dict('ru')`, `dict('en')`). The arrival keeps `ARRIVAL_MS` (7000, an action). The tests read the names; one test pins the four values. | The next change of a duration edits one line, not 30 test numbers. |
| T10 | **The toast floats above the selection bar.** The page's toast (not the copy inside the record dialog) sits at `bottom: calc(26px + var(--selbar-h, 0px))`. The «Ещё» and add-to-list menus that end under a toast (`handoff.md` Deferred, "Toast over «Ещё»") are measured by case 108 (f) and stay for `DEBT.md` at closeout with the numbers: the fix needs the menu and the toast to know each other, which is not local to `Toast`. | A 4000-7000 ms toast over the bar's actions at 360 px would block the next press of a selection for 2.5 times longer than today; `--selbar-h` is already set by `SelectionBar` (FilterPanel and the scroll padding read it). |
| T11 | **No golden moves.** Sizes, durations and the card's corner are CSS; the toast holds in the golden build (`holdsToasts`). A state whose tree moves is re-seeded with `--only` and named. | Accessibility-tree goldens at 1100 px (`tests/app/golden.js`). |
| T12 | **The header holds its height.** Up to 600 px `Seg`'s track loses its padding (`padding: 0 1px`, 3 px today), so a 40 px segment makes a 42 px track: inside the header's 44 px row (the account control) and 2 px over the catalog's 40 px picker row (T3 takes it back). Measured: the header 111.2 px today, 114.4 with the plain growth and 155.6 at 360 EN (the brand row wrapped: the inactive «RU» grew 35.7 to 40 px), 110.4 with the hold in RU and EN at 360 and 390. The pressed segment then fills the track's height. | Every first-screen top at 360 sits under the header. Alternative: keep the 3 px inset and take the width from the account control's padding: it holds the width only (the 44.8 to 48 px height growth stays). |

## Owner questions (none open)

- The rules are the owner's (2026-11-05). T1-T12 are defaults, logged in the AFK decisions file, item 21.

## Placed items (each is its own acceptance line below)

- `plan.md` section 7, "Batch T": every line (the rule and its scope, 8-P1, the check and its allow-list, the
  `FIRST_SCREEN` re-measure with `/roll/std` and `/s/`, the Reading Time Rule, the DESIGN.md homes, the mock step, no
  golden, the toast over «Ещё»).
- 8-G1 (the card «Ещё», the search row's «Выбрать» and `ListFind` at 360; `/lists`, the card menus and `ListFind` in the
  sweep), 8-G4 (the email toast), 8-P1 (T5).
- `handoff.md` Deferred: "Toast over «Ещё»" (T10, measured, then `DEBT.md` at closeout unless fixed).
- `context.md` item 10, "APPROVED": the homes DESIGN.md "The Phone-First Rule" and "Components", "Named Rules", and
  FEATURES.md "Chrome".

## In scope

- New: the token `--thumb`; `MoreMenu`'s `variant` prop; `TOAST_MS`, `TOAST_LONG_CHARS`, `toastMs`; `targets` and its
  allow-list in `tests/app/lib.js`; cases 108 and 109; the sweep step.
- Changed (CSS up to 600 px unless named): `tokens.css`, `Button`, `Chip`, `Seg`, `RollPage`, `ModeRow` (padding only),
  `TablesPage` (`.pickrow` margin only),
  `TableRows`, `SectionHead` (`.tsec-link`), `NumberField`, `AltPanel` (`.pick select`), `ListFind`, `ListCard`,
  `ListsPage`, `MoreMenu`, `AddToList`, `ItemPicker`, `MarkupField`, `PickQty`, `Switch`, `RecordCard` (`.card-name a`,
  `.steps .step`), `HomebrewCards`, `HomebrewEditor` (`.back`, selects), `CardForm`, `NameField`, `SourcePicker`,
  `HomebrewRelations`, `AccountPage` (`select`), `PageHead` (`.homebtn`, `.helpbtn` where they draw up to 600 px),
  `Shell` (the brand, the footer links and `summary`), `Toast` (`.toast-act`, the bar offset, the hold for every mode),
  `app.svelte.ts` (durations, `holdToast`), `ListPage` and `SharedListPage` (what the check finds after 9b).
- Tests and prose: `app.test.ts`, `shell.test.ts`, the component tests of the changed components where a class or a
  prop moves, `tests/app/lib.js`, `sweep.js`, `states.js` (cases 83, 108, 109), `inventory.js` (comments only),
  `golden.js` (comments only), DESIGN.md, FEATURES.md, COVERAGE.md.

## Out of scope

- A size from 601 px (the small button keeps 32 px); the print page's own controls beyond the floor (batch P builds
  its bar on the rule); the sibling navigation and the heads from 761 px (batch N); a new string; a route, a stored key,
  the server.
- The toast's place over a menu (T10: measured only).

## Facts read from the code and measured (HEAD `340fa727`, live site `b6f153a5`, 2026-11-05)

1. `.btn.sm` is `height: 32px` at every width (`Button.svelte`); `MoreMenu` passes `size` to it. `RollPage` sets the
   narrow results line's buttons to 28 px (`.reshead > .btn`, `.reshead .morewrap > .btn`) and `.reshead` to
   `min-height: 28px; margin: 4px 0`.
2. `Chip` is `padding: 7px 12px` at 13 px (36.8 px tall; the one-digit tier chips 32.6 px wide); `Seg` buttons 35.2
   (small) and 36.8 px (the language switch); the number field's steppers 36 px wide at 360.
3. `ListFind` draws its search row 36 px up to 760 px ("as mock F: the first entry must start in the first screen at
   360x640"); `ListCard`'s «Ещё» is `size="sm"` (32 px) on its own `.listcard-acts` row; the pick box is 32 px with a
   44 px `::after` target.
4. `Menu`'s items, `ModeRow`'s supplement items and `PickQty`'s buttons are already 44 px up to 600 px; the mode
   chips and the dice 40 px.
5. Toasts: `say` sets `const ms = opts.action ? 7000 : opts.error ? 2600 : 1600`; `holdToast` returns unless the
   mode is `act` ("a resting pointer must not keep them"); `ARRIVAL_MS = 7000`. `.toast` sits `26px` off the bottom;
   `.toast-act` is `padding: 5px 12px` (about 28 px tall).
6. `--selbar-h` is set on the root by `SelectionBar` while it is mounted.
7. Live site at 360/390/600 px, RU and EN, signed out (`mocks/T/measure-before-360-390-600.json`): 33 control
   selectors under 40 px on 29 states (the sweep list below); first-screen tops in the table below.

## The sweep list (up to 600 px)

Measured on the live site (production, wave 2b, signed out), 29 states x 360, 390, 600 px x RU, EN; heights in px
(width where it is the short side). "Fix" names the step.

| Control (selector < parent) | Size | Where | Fix |
|---|---|---|---|
| `button.btn.sm` in `.reshead` («Настроить», «Ещё») | 28 | the roll pages' results line | S2, S3 (T3 fold) |
| `button.btn.sm` in `.resacts`, `.seldrop` («В список», «Поделиться») and `.morewrap` (a result's «Ещё») | 32 | every roll result | S2 |
| `button.btn.sm` in `.morewrap` (`/search`'s «Ещё») | 32 | `/search` head | S2 |
| `button.btn.sm` in `.sheet-foot` («Сбросить», «Показать N») | 32 | the filter sheet | S2 |
| `button.btn.sm` in `.selacts`, `.seldrop`, `.selclear` («Печать», «Скопировать текст», «В список», «Снять выделение») | 32 | the selection bar | S2 |
| `button.tsec-link` («Ссылка на раздел») | 28 | every table section head | S2 |
| `label.selbox` in a row / in a tile | 38 wide / 30x30 | the selection mode, list and grid | S2 |
| `.seg` buttons («Список», «Сетка»; «RU», «EN») | 35.2 / 36.8 (EN 33.2-35 wide) | the catalog's view switch, the header | S2, T12 |
| `button.chip` (filter values, tier «1»-«4», group chips, setup chips, search examples, «+ Новый список») | 36.8 (32.6 wide) | the filter sheet, the table picker, `/roll/*` setup, `/search` start, the add-to-list popover | S2 |
| `select` in `.pick` («Редкость», «Раздел книги») | 38 | `/roll/alt`, `/roll/vault_of_ages` | S2 |
| `.numbox button` («На единицу меньше» / «больше») | 46 x 36 | the roll setup | S2 |
| `button.homebtn`, `button.helpbtn` | 34 | `/lists` signed out (production only; batch 8 moved them into «Ещё») | S2 if any page still draws them up to 600 px |
| `a` in `.card-name` (the result's name) | 20.2-39.4 | every roll result | S4 (padded box) |
| `a.brand` | 30.2 | the header | S4 |
| `a` in `.foot-nav`, `summary` in `.foot-licence` | 20.8 | the footer | S4 |
| `details > summary` (a Vault of Ages rule) | 26.2 | `/roll/wondrous_environments` | S2 |
| `a.skip` | 25.6 | every page | allow-list (T7) |
| inline links in running text | under 40 | 204 readings | allow-list (T7) |

From the code (signed-in surfaces the live site cannot reach, HEAD `340fa727`; batch 9b may have moved some):
`ListFind` row 36 (`/lists`, `/lists/<uuid>`, `/s/`; 8-G1), `ListCard` «Ещё» 32 (8-G1, T5), the `/lists` head's
«Ещё» (`MoreMenu size="sm"`, 32), `AddToList` rows `min-height: 36px` (to 44) and its inputs 32, `ItemPicker` `.x`
32x32 and its input 38, `MarkupField` `.tool` 36x32, `PickQty` `.qgroup` 36, `Switch` 32, `RecordCard` `.steps
.step` 26x26 (the tier ladder on `/i/q1`), `HomebrewCards` fold `.btn.bare` 24, `HomebrewEditor` `.back` 24 and its
selects 38, `CardForm`, `NameField`, `SourcePicker`, `HomebrewRelations`, `AccountPage` selects and inputs 38,
`.toast-act` about 28, `.btn.bare` (no height) on every caller (the requests fold, 9b's «Удалить ссылку»), and
`ListPage`'s fields and buttons of 28-32 px (read after 9b). The check of S7 is the authority: every control it
reports is fixed or allow-listed with its reason.

Totals: live, 19866 controls read on 174 state passes; 3428 readings under 40 px in 33 selector groups (174 of
them `a.skip`, allow-listed) and 204 readings of inline links in running text (allow-listed). With `thumb.css` and
`fold.css` injected (`measure-fold-360-390-600.json`, 13 states, 10398 controls): 78 readings under the floor, every
one `a.skip`. Code: 17 more selector groups on the signed-in surfaces above.

## First-screen rows (section 14; 360x640, limit 256; 600x640 logged)

Measured on the live site (production `b6f153a5`, the 9a/8/9b surfaces are not on it), RU = EN unless noted; "plain"
is the Thumb Rule with no fold, "fold" adds T3 and T12 (`mocks/T/measure-*.json`). Rows marked "estimate" are not on
the live site signed out: the figure is the last built measurement in `plan.md` or `reviews/8.md` plus the growth
read from the code; S3 step 4 measures them.

| `FIRST_SCREEN` row | Before | Plain | Fold | Decision |
|---|---|---|---|---|
| `#/roll/std` (exception 325) | 323.5 | 338.7 (EN 379.9) | 318.7 | passes 325 with the fold; the exception stays 325 (the owner's figure; section 14: it moves only past it) |
| `#/roll/alt`, `~ crit`, `#/roll/voa`, `#/roll/wondrous` | 250.7 | 265.9 (EN 307.1): **would pass** 256 | 245.9 | the roll fold (T3) |
| `#/tables/eq_weapon` | 234.4 | 242.4 (EN 283.6) | 230.4 | the header hold and `.pickrow` 6 to 4 px |
| `#/tables/eq_weapon ~ two filters` | 252.4 | 260.4 (EN 301.6): **would pass** | 248.4 | as above |
| `#/i/ci1`, `#/h/...0513 as gm1` | 137.2 | 140.4 (EN 181.6) | 136.4 | none needed |
| `#/search ~ searched` | 230.0 | 236.4 (EN 277.6) | 232.4 | none needed (the head's «Ещё» grows 32 to 40 inside the header-held page) |
| `#/search ~ kind picked` | 1180 only (`wideOnly`) | - | - | unchanged |
| `#/account as gm1` | about 177 (mock 7) | estimate +0 (no control above the panel up to 600 px but the header) | - | none expected |
| `#/p/set-emberaxe as gm2` | logged (`shipped: false`, batch P) | - | - | batch P builds on the rule |
| `#/homebrew as gm3` | 243 (`plan-nav.md`, built) | estimate 243-251 (the collection head's «Выбрать» and «Ещё» 32 to 40) | - | if past 256: the collection head's top margin by the growth; else the exception |
| `#/homebrew/sets ~ long name as gm4` | not logged in the plan | estimate +0-8 | - | measure; as `#/homebrew` |
| `#/homebrew/new as gm1`, `#/homebrew/hb_longsrc... as gm4` | about 234 (mock 6) | estimate +0 (the back link grows by its padded box, T4) | - | none expected |
| `#/lists as gm1` | about 211 (mock 8) | estimate +0-8 (the head's «Ещё» beside the 44 px primary: +0) | - | none expected |
| `#/lists ~ many lists as gm4` | 252 (`reviews/8.md`, deviation 9) | estimate 256 (`ListFind` 36 to 40): **at the limit** | estimate 252 (`.lfind` margin 8 to 4) | the list fold (T3) |
| `LIST_A as gm4` | about 200 (`plan-9b.md`) | estimate 204-212 | - | none expected |
| `LIST_A ~ many as gm4`, `~ long name as gm4` | 254 (`plan-9b.md`) | estimate 258-266 (`ListFind` +4; the 9a head's 32 px buttons +8 if they set the row's height): **would pass** | estimate 254-262 | the list fold; then the `.lhead` row's margins by the remaining growth; else the measured `exception`, logged (the AFK file) and named in DESIGN.md |
| `#/s/player-token-1`, `~ long name` (exception 302) | 301 | estimate 305-313 | estimate 301-309 | the exception takes the measured value if it passes 302 (section 14), logged |
| the requests row of 9b (new in 9b) | 9b's measured figure | estimate +4-12 | - | as `LIST_A ~ many` |

At 600x640 (logged, not asserted): `/roll/std` 316.2, 331.4, 311.4; the roll pages 250.2, 265.4, 245.4; the other
rows as at 360. At 1180x720 nothing changes (the rule ends at 600 px). The header measured 111.2 px, 114.4 with the
plain growth (155.6 at 360 EN: the brand row wrapped when the inactive «RU» grew 35.7 to 40 px) and 110.4 with T12.

## Toasts: every toast and its class

Read from HEAD `340fa727` (`say` and `copied` call sites: 141 in 25 files, 110 message keys; lengths are the longer of
RU and EN with a 12 and «Длинный меч» put in; the scratch script is not kept). The class is computed from the drawn
text at `say` time (T8, T9), so a composed text (the export summary, «... Владелец получил запрос.») takes its class
from its whole length; this table is the record, not code.

| Class (ms) | Mode | Keys |
|---|---|---|
| plain, 4000 (was 1600) | `''` | `addedTo`, `droppedItems`, `exportBig`, `exportHomebrewSkippedN`, `exportLongLists`, `exportManyLists`, `exportOverBounds`, `filterLinkCopied`, `hbCardCreated`, `hbCardDeleted`, `hbCreated`, `hbDeleted`, `hbDeletedN`, `hbImportDone` (and its parts), `hbMovedN`, `hbSaved`, `hbSectionCreated`, `hbSectionDeleted`, `hbSetCreated`, `hbSetDeleted`, `hbSourceCreated`, `hbSourceDeleted`, `homeReset`, `homeSet`, `imgCopied`, `imgSaved`, `imgTainted`, `importDone`, `linkCopied`, `listCopied`, `listCreated`, `listDeleted`, `listsDeleted`, `nameCopied`, `printSkipped`, `requestApplied`, `requestAppliedToast`, `requestDeclined`, `requestDeclinedToast`, `requestPartialToast`, `requestSent`, `requestTaken`, `rollCopied`, `sectionLinkCopied`, `selCopied`, `signedOut`, `accountDeleted`, `tableLinkCopied`, `textCopied`, the share panel's created and deleted texts |
| error, 7000 (was 2600) | `err` | `accountFailed`, `cloneFailed`, `cloudLoadFailed`, `copyFailed`, `hbBookChanged`, `hbCardChanged`, `hbCardGone`, `hbCardItemsFull`, `hbDeleteFailed`, `hbGone`, `hbImportFailed`, `hbImportRefused`, `hbItemChanged`, `hbLoadFailed`, `hbMoveChanged`, `hbMoveFailed`, `hbMoveRefused`, `hbNotAdded`, `hbNotReady`, `hbRefsFull`, `hbWriteFailed`, `imgFailed`, `importTooSlow`, `keepOneKind`, `keepOneSource`, `nameFirst`, `noticeHideFailed`, `printSetFailed`, `requestActFailed`, `requestDecidedElsewhere`, `requestNetwork`, `requestPending`, `requestRate`, `requestRefused`, `requestStale`, `saveItemFailed`, `shareFailed` |
| action, 7000 (unchanged) | `act` | `batchDeleted`, `copyArtFailed`, `gmOnlyHidden`, `gmOnlyShown`, `noteCleared`, `quickAdded`, `removedFrom`, `removedItem`, the reprice undo, `saveItemSaved`, the arrival (`requestArrived`, `requestsArrivedList`, `requestsNewN`; `ARRIVAL_MS`) |
| long, 10000 (new) | any | every `limitText` text (the eight `limit*` keys, each with the email address; 95-110 characters), `saveFailed` (103), `gmFilterLinkCopied` (105), `saveItemRefused` (101), `requestLinesMax` (101), `printTooMany` (97), `exportHomebrewBig` (97), `requestExpired` (88), `importRefused` (85), `writeRefused` (85), `saveItemRelinked` (84, an action), `gmShareCopied` (82), `playersShareCopied` (81) |

`TOAST_LONG_CHARS` is 80: the toast's text box is 296 px at 360 px (328 px less 32 px of padding), about 42
characters of the 14 px semibold face a line, so 81 characters or more take a third line (arithmetic, not measured;
case 108 (d) reads the line count of the long toast at 360 RU, and `handoff.md` names a difference).

Tests that assert the old timings (each moves to the class names of T9; the behavior they test stays):

- `app/src/state/app.test.ts`: "shows a plain notice for 1600ms", "shows an error for 2600ms", "replaces the first
  toast and restarts the clock" (1000 + 1000 + 600), "redraws a toast in the language switched to and keeps its
  deadline" (1000 + 599 + 1), "never holds a plain notice" (becomes "holds a plain notice and an error while hovered
  and runs on with the time they had left"), "holds a plain toast said during an error until the error ends, then
  shows it 1600ms", "replaces an error or an action at once ..." (2600), "keeps one waiting plain toast ..." (2600,
  1600), "shows a waiting plain toast in the language switched to" (2600), and the arrival cases at 2983 (2600), 2993,
  3006, 3018, 3029, 3052 (1600). The 7000 ms cases stay.
- `app/src/components/shell.test.ts`: "draws an error, then a plain toast said during it once the error ends" (2600).
- Comments only: `app.svelte.ts` (the `ToastAction` and `say` docs, `holdToast`'s "A plain notice and an error never
  hold"), `Toast.svelte` (lines 6-8, 59-60, 128-130), `tests/app/golden.js` (the 1600 ms lifetime notes),
  `tests/app/inventory.js` (each "a 1600ms toast" comment: "a 4000ms toast").
- Prose: FEATURES.md "Chrome" (the toast paragraph: "A toast with no action never pauses", "for its own 1600 ms"),
  DESIGN.md "Toast".

## Files expected

| Step | Files |
|---|---|
| S1 | `app/src/styles/tokens.css` |
| S2 | `Button.svelte`, `Chip.svelte`, `Seg.svelte`, `SectionHead.svelte`, `TableRows.svelte`, `NumberField.svelte`, `AltPanel.svelte`, `PageHead.svelte`, `AddToList.svelte`, `ItemPicker.svelte`, `MarkupField.svelte`, `PickQty.svelte`, `Switch.svelte`, `RecordCard.svelte` (`.steps .step`, `details > summary`), `HomebrewCards.svelte`, `HomebrewEditor.svelte`, `CardForm.svelte`, `NameField.svelte`, `SourcePicker.svelte`, `HomebrewRelations.svelte`, `AccountPage.svelte`, `ListFind.svelte`, `ListPage.svelte`, `SharedListPage.svelte`, `Toast.svelte` (`.toast-act`) |
| S3 | `RollPage.svelte`, `ModeRow.svelte`, `ListFind.svelte`, `Seg.svelte`, `TablesPage.svelte` |
| S4 | `RecordCard.svelte` (`.card-name a`), `Shell.svelte` (the brand, `.foot-nav a`, `.foot-licence summary`), `HomebrewEditor.svelte` (`.back`) |
| S5 | `MoreMenu.svelte`, `ListsPage.svelte`, `ListCard.svelte`, `listsPage.test.ts` |
| S6 | `app/src/state/app.svelte.ts`, `Toast.svelte` |
| S7 | `tests/app/lib.js`, `tests/app/sweep.js`, `tests/app/states.js` (case 109) |
| S8 | `app.test.ts`, `shell.test.ts`, `tests/app/states.js` (case 108, case 83's rows) |
| S9 | `DESIGN.md`, `docs/specs/FEATURES.md`, `docs/specs/COVERAGE.md`, `tests/app/inventory.js` and `tests/app/golden.js` (comments) |
| S10 | `issues/57/mocks/T/built/` (`shoot.js` from `mocks/9b/built/shoot.js`), `handoff.md` |

## Steps

### S1. The token

`tokens.css`: in `:root` add `--thumb: 0px` with a one-line comment (the thumb target of DESIGN.md "The Phone-First
Rule"); after the `@media (max-width: 600px)` block of `--sticky-h` add `@media screen and (max-width: 600px) { :root {
--thumb: 40px; } }`. Keep `--sticky-h`'s block as it is (it is not `screen`-scoped and print needs no header).

### S2. Boxed controls

For each control of the sweep list and the code list, inside its component:

1. A fixed height becomes `height: max(<today>, var(--thumb))` (`.btn.sm` 32, `RollPage`'s `.reshead` buttons 28,
   `ListFind`'s 36 row, `AddToList`'s inputs 32, `ItemPicker`'s 32 and 38, `MarkupField`'s `.tool` 32, `PickQty`'s 36,
   the selects and inputs of 38). A `min-height` takes `max(<today>, var(--thumb))` (`Switch` 32, `.tsec-link` 28,
   `HomebrewCards`' fold 24). A box with no height rule takes `min-height: var(--thumb)` (`Chip`, `Seg`'s buttons,
   `.toast-act`, `.btn.bare`, a `details > summary` with a box).
2. Width: `min-width: var(--thumb)` where a control can be narrower (`Chip`, `Seg`'s buttons, `.numbox button`,
   `.steps .step`, `ItemPicker .x`, `MarkupField .tool`); `TableRows`' row `.selbox` up to 600 px is 40 px (38 today),
   the tile's `.selbox` 40x40 (30 today).
3. A chip and a `Seg` button center their label when they grow: `Chip` up to 600 px takes `display: inline-flex;
   align-items: center; justify-content: center` (the pressed chip already does since 9b's Check Rule); check the
   one-digit tier chips stay one line.
4. `AddToList`'s rows (`.lrow`, `.lnew`): `min-height: max(36px, 44px)` up to 600 px is 44 px: a row target (T1).
5. `PageHead`'s `.homebtn` and `.helpbtn`: only if `git grep` and the shots show a page that draws them up to 600 px
   (batch 8 moved `/lists`' pin into «Ещё»); else leave them.
6. Run S7's check on one state per touched component through the loader and read the report; each control it names
   is fixed here or, if it is one of T7's classes, left.

Trap: do not write `height: 40px` inside a new `@media` block (T2); do not grow anything from 601 px.

### S3. First-screen folds (T3)

1. `RollPage.svelte` up to 760 px: `.reshead { margin: 0 }` (was `4px 0`), `.rp:not(.two) .rp-ctrl { margin-top: 0 }`
   (was 4). Keep `#main`'s 6 px.
2. `ModeRow.svelte` up to 600 px: `.modes-in { padding: 4px 0 }` (was `6px 0`). The 40 px chips stay.
3. `ListFind.svelte` up to 600 px: `.lfind { margin-bottom: 4px }` (8 today).
4. `Seg.svelte` up to 600 px: `.seg { padding: 0 1px }` (T12; 3 px today); `TablesPage.svelte` up to 600 px:
   `.pickrow { margin-bottom: 4px }` (6 today). Check the header at 360 EN signed out: one brand row, 110-111 px.
5. Measure every `FIRST_SCREEN` row at 360x640, RU and EN, through the loader of case 83 before S2 and after S3 (the
   first-screen table below names the expected tops); write both columns into `handoff.md`. A row past 256 px: try the
   next fold of its row in the table; if none is named, the row takes an `exception` at the measured value (rounded up
   to the next whole px), the AFK decisions file logs it while the owner is away, and DESIGN.md "The First-Screen Rule"
   names it with its date. `/roll/std`'s and `/s/`'s exceptions take their measured values the same way.

### S4. Text links (T4)

Up to 600 px: `RecordCard`'s `.card-name a`, `Shell`'s `.foot-nav a` and `HomebrewEditor`'s `.back` take
`display: inline-block; padding-block: 10px; margin-block: -10px` (a 20 px line; for a line of `L` px use `(40 - L) / 2`);
`Shell`'s brand takes `padding-block: 5px; margin-block: -5px` (30 px today); `.foot-licence summary` takes
`min-height: var(--thumb); display: flex; align-items: center` (it is the footer's last line: its growth moves no
content). Check in the shots that a two-line name keeps its line spacing and that no padded box covers another control
(S7's hit test fails if one does).

### S5. The card's «Ещё» (T5, 8-P1)

1. `MoreMenu.svelte`: `variant?: 'plain' | 'bare'` (default `plain`), passed to `Button`. Comment: the card's corner
   draws text alone.
2. `ListsPage.svelte`: the card's `MoreMenu` passes `variant="bare"`.
3. `ListCard.svelte`: `.listcard-acts` becomes `position: absolute; top: 4px; right: 4px; padding: 0`; `.listcard-top`
   takes `padding-right` for the slot outside the selection mode (76 px; read the RU shot at 360 and the EN one, take the
   wider); `.btn.bare` there has `min-height: var(--thumb)` from S2 and `padding: 0 8px`. The pick box keeps its corner
   in the selection mode (the two never draw together).
4. `listsPage.test.ts`: the card's «Ещё» has the `bare` class and is not inside the card's link; axe.

### S6. Toasts (T8-T10)

1. `app.svelte.ts`: export `TOAST_MS` and `TOAST_LONG_CHARS = 80`; a module function `toastMs(mode, msg)` returns
   `TOAST_MS.long` when `msg(dict('ru'), 'ru')` or `msg(dict('en'), 'en')` holds `@` or is longer than
   `TOAST_LONG_CHARS`, else the mode's value. `say` calls it in place of `const ms`. The doc comments of `say` and
   `ToastAction` name the four classes.
2. `holdToast(on)`: drop the `mode !== 'act'` return; keep the `holdsToasts` return and the rest. The doc comment says
   every toast holds.
3. `Toast.svelte`: `app.holdToast(on)` runs for every mode (the effect's `toast?.mode === 'act'` condition goes); the
   comments of lines 6-8 and 128-130 say every toast. The page's copy (`!inDialog`) sits at `bottom: calc(26px +
   var(--selbar-h, 0px))` (a class on the root element, `inset` stays for the dialog copy). `.toast-act` up to 600 px
   takes `min-height: var(--thumb)` (S2).
4. `pointerenter`/`pointerleave` already exist; a touch fires them (no new listener).

### S7. The check (T6, T7)

1. `tests/app/lib.js`: `targets(page, { floor, menuFloor, spacing })` and `TARGET_ALLOW` (T7's four classes, each an
   object `{ test, why }`), exported. Page side: the selector `button, a[href], input:not([type=hidden]), select,
   textarea, summary, [role^=menuitem], [role=option], [role=tab], [tabindex="0"]`; skip what is hidden (`[hidden]`,
   `[inert]`, `[aria-hidden=true]`, a closed `dialog`, a closed popover, `display: none` or `visibility: hidden` on it
   or an ancestor, `clip-path: inset(50%)`, a zero box); a checkbox or radio inside a `label` is measured by the label;
   a box at or over the floor passes; else `scrollIntoView({ block: 'center', inline: 'center' })` and the 8 points
   (corners inset 1 px and edge midpoints) of a floor-sized square on the box's center: each `elementFromPoint` is the
   control or inside it, else the control is reported as `{ sel, name, w, h }`. `spacing: true` (768 and 1180 px)
   passes an undersized target whose 24 px circle on its center meets no other target's box (WCAG 2.5.8 spacing).
2. `sweep.js`: after the existing reads of each page, `targets(page, width <= 600 ? { floor: 40, menuFloor: 44 } : {
   floor: 24, spacing: true })`; each report is one `ok(false, where + ': a target under ' + floor + ' px - ' + ...)`.
   The run widths 360 and 390 take the 40 px floor; 768 and 1180 the 24 px one.
3. Case 109 (`states.js`): at 360x640, RU and EN, open each state and run `targets` with the 40/44 floor:
   `#/tables/eq_weapon ~ filter sheet`, `~ table picker`, `~ more menu`, `~ selecting`, `#/tables ~ a row opened`,
   `#/tables/eq_weapon ~ a row opened, actions menu`, `#/tables ~ a row opened, list menu as gm4`, `#/tables ~ bar menu
   as gm4`, `#/i/ci1 ~ list menu as gm1`, `#/i/q1 ~ more as gm3` (the tier ladder), `#/roll/std ~ set up`, `~ more`,
   `~ card more`, `#/roll/vault_of_ages ~ supplements menu`, `#/search ~ more`, `~ selecting`, `#/lists ~ more as gm1`,
   `~ card menu as gm1`, `~ selecting as gm1`, `~ import panel as gm1`, `#/s/player-token-1 ~ selecting`, `#/homebrew
   ~ more as gm3`, `~ filter sheet as gm3`, `~ select narrow as gm3`, `~ bar more as gm3`, `#/homebrew/new ~ preview
   sheet as gm1`, `~ picker open as gm1`, `~ crop dialog as gm1`, `#/account ~ delete confirmation as gm1`, and the list
   page's open states of 9b (`LIST_A ~ more as gm4`, `~ row more as gm4`, `~ note open as gm4`, `~ requests open as
   gm4`; take the ids `inventory.js` holds after 9b). A missing id fails the case with its name.
4. Run the check once locally: `node tests/app/sweep.js 360 ru` (about 4-5 min) and case 109 through the loader. Each
   report is fixed in S2-S5 or matches T7.

### S8. Tests

1. `app.test.ts`: the timings above read `TOAST_MS`; new cases: "pins the four durations" (`TOAST_MS` equals `{ plain:
   4000, error: 7000, action: 7000, long: 10000 }`), "gives a toast with an email address the long class" (a
   `limitText` message: present at 9999 ms, gone at 10000), "gives a toast of more than 80 characters in either
   language the long class" (an 81-character EN text with a short RU one), "holds a plain notice and an error while
   hovered and runs on with the time they had left", "shows a plain toast that waited behind an error for its own
   class". Each `it` title names the behavior.
2. `shell.test.ts`: the 2600 case reads `TOAST_MS.error`; a case: the page's toast element carries the bar offset
   class while `--selbar-h` is set, the dialog's copy does not; a hover on a plain toast holds it (`fireEvent.pointerEnter`,
   advance past 4000, still drawn; `pointerLeave`, advance the rest, gone).
3. Case 108 (`states.js`, the toasts in a real browser), 360x640, RU and EN, the waits of one language in parallel
   pages: (a) a plain toast (a section link copied on `#/tables/eq_weapon`) is drawn at 3500 ms and gone by 4600 ms;
   (b) an error toast (`keepOneSource` on `#/roll/std ~ set up`: the last source chip pressed off) is drawn at 5000 ms
   and at 6500 ms, gone by 7600 ms; (c) a plain toast with the pointer moved onto it at 1000 ms is drawn at 6000 ms,
   and gone within 3600 ms of the pointer leaving; (d) a long toast (the list limit on `#/lists ~ list limit as gm2`,
   «Новый список» pressed at 50 of 50) is drawn at 9000 ms and gone by 10600 ms, and its text box takes three or more
   lines at 360 RU; (e) with the selection bar shown (`#/tables/eq_weapon ~ selecting`, two ticks, «Скопировать текст»)
   the toast's bottom edge is at or above the bar's top edge; (f) the «Ещё» menu of a roll result opened and a toast
   raised: log the overlap of the toast's box with the menu's last item (T10), assert nothing. Relax the reduced-motion
   emulation only if a read needs the entry animation (it does not: the reads are presence and boxes).
4. Case 83: the rows of the first-screen table, with the new `exception` values where S3 measured them.

### S9. Prose, in the same commit

- DESIGN.md "Layout", "The Phone-First Rule" gains the Thumb Rule (the text below); "The Two Breakpoints Rule"'s list
  "At 600px touch targets grow: segment padding ..., the mode row's controls 40px tall" reads "At 600px every target
  takes the thumb size (The Phone-First Rule), row actions take their own line, and a roll card can be the tall face
  from 601px (The Roll Page Rule)"; "The First-Screen Rule" names the measured exceptions with the date 2026-11-05 (or
  the batch's date). "Components": "Buttons" (the small size is 32px from 601px and 40px up to 600px), "Chips" (40px up
  to 600px), "Toast" (the place above the selection bar), and the Reading Time Rule as the fifth entry of "Components",
  "Named Rules" (9b writes the subsection).
- FEATURES.md "Chrome": the toast paragraph (the four classes, every toast holds on hover, touch or focus, the waiting
  toast's own class, the place above the selection bar); one sentence for the thumb targets up to 600 px (owner,
  2026-11-05) with its pointer to DESIGN.md.
- COVERAGE.md: cases 108 and 109, the sweep step, `targets` in `lib.js`.
- Comments: the ones the toast list names; the `inventory.js` "a 1600ms toast" comments.

The DESIGN.md text:

> **The Phone-First Rule.** (the existing paragraph, then:) Up to 600px every control a person presses is a thumb
> target of at least 40x40px (`--thumb`), the size of the mode row and the dice; a menu item and a row are 44px. A
> control with a box grows its box; a text link grows its padded box and keeps its line. From 601px the small button
> is 32px. At every width a target is at least 24x24px or keeps the WCAG 2.5.8 spacing; a link inside a sentence is
> the one exception. Owner, 2026-11-05; sources: Android adaptive app quality, Tier 2 (Touch_Targets), and Apple's
> Human Interface Guidelines, Accessibility.

> **The Reading Time Rule.** A toast stays long enough to read twice: 4000ms for a notice, 7000ms for an error or a
> toast with an action, 10000ms for one that carries an email address or more than 80 characters, in either language.
> Every toast holds while a pointer, a finger or the focus is on it, and runs on with the time it had left. A notice
> said while an error or an action toast shows waits for it; the new-request toast waits behind every other one. The
> toast floats above the selection bar. Owner, 2026-11-05; sources: Flutter's `SnackBar.duration` and Apple's Human
> Interface Guidelines, Accessibility.

### S10. Evidence

`issues/57/mocks/T/built/shoot.js` from `mocks/9b/built/shoot.js`: `roll-std`, `roll-alt`, `roll-std-setup`,
`tables-eq-weapon`, `tables-filters`, `tables-selecting`, `tables-grid-selecting`, `search`, `lists`, `lists-many`,
`list-many`, `shared-player`, `homebrew`, `editor`, `item-q1` at 360 and 390 px, RU and EN, and the long toast on
`lists-limit` at 360 RU. `handoff.md`: the first-screen before and after columns, the sweep and case 109 reports (zero,
or each allow-listed one with its reason), the toast case's log of (f).

## Acceptance criteria

1. The Thumb Rule (T1, 8-G1): up to 600 px every pressable control with a box is at least 40x40 px (44 px for a menu
   item and a row target); `sweep.js` at 360 and 390 px, RU and EN, reports no target under the floor outside T7's
   allow-list; the card «Ещё», the search row's «Выбрать» and `ListFind`'s row are 40 px at 360.
2. The token (T2): `--thumb` is the one place of the 40 px floor; `git grep -n "var(--thumb)" -- app/src` names every
   component of the Files table's S2 row; no new `@media (max-width: 600px)` block holds a literal 40.
3. From 601 px nothing grows: `.btn.sm` is 32 px at 768 and 1180 (the sweep's 24 px run passes; the 1180 shots do not
   move).
4. The 24 px floor: `sweep.js` at 768 and 1180 px reports no target under 24x24 px without the WCAG spacing.
5. Text links (T4): the card name, the footer links and the brand reach 40 px by their padded box, and no line moves
   (the shots before and after match line for line).
6. 8-P1 (T5): the `/lists` card's «Ещё» sits in the card's top right corner as a text button, 40 px up to 600 px; the
   card has no `.listcard-acts` row of its own; the name never runs under it (RU and EN, a 120-character name);
   `listsPage.test.ts` passes with axe.
7. Case 109 passes: no open layer at 360x640 (sheets, menus, the selection bars, the dialog, the popover, the account
   confirm, the editor's sheets) has a target under the floor.
8. `FIRST_SCREEN` (section "First-screen rows"): every row passes its limit at 360x640 in RU and EN with the folds of
   T3; a row that does not takes its measured `exception`, logged in the AFK decisions file and named in DESIGN.md "The
   First-Screen Rule" with its date; `/roll/std` keeps 325 unless it measures past it; `/s/` takes its measured value.
   `handoff.md` holds the before and after column of every row.
9. The header holds (T12): 111 px at 360 and 390 px in RU and EN, signed out and signed in (the language switch's
   track is 42 px); the brand row does not wrap at 360 EN.
10. The Reading Time Rule (T8, T9, 8-G4): plain 4000, error 7000, action 7000, long 10000 ms; a long toast is one with
    an email address or more than 80 characters in either language; `app.test.ts` pins the four values and each
    class; case 108 (a)-(d) pass in RU and EN.
11. Every toast holds while hovered, touched or focused, and runs on with the time it had left (`app.test.ts`,
    `shell.test.ts`, case 108 (c)); the undo's own focus does not hold it (the existing case stays green).
12. The queue order stays (owner, 2026-10-08): every case of "the toast slot, owner 2026-10-08" and the arrival cases
    pass with the new durations.
13. The toast floats above the selection bar (T10): case 108 (e); the dialog's copy keeps its place.
14. "Toast over «Ещё»" (`handoff.md` Deferred): case 108 (f) logs the overlap at 360 with the new durations;
    `handoff.md` carries the numbers, and the line stays for `DEBT.md` at closeout unless a later batch fixes it.
15. No golden moves (T11): the CI golden job passes with no re-seed, or each re-seeded state is named.
16. DESIGN.md: "The Phone-First Rule" holds the Thumb Rule; "The Two Breakpoints Rule" points to it; "Buttons",
    "Chips", "Toast" carry the sizes and the place; "Components", "Named Rules" holds the Reading Time Rule (5 of 8);
    "Layout" keeps its named rule count (the Thumb Rule merges, no new entry). FEATURES.md "Chrome" carries the four
    durations, the hold and the thumb sentence. COVERAGE.md names cases 108, 109 and the sweep step.
17. Every timing comment of the toast list says the new durations; `git grep -n -E "1600 ?ms|2600 ?ms" -- app/src
    tests/app docs/specs DESIGN.md` finds none that describes a toast.
18. RU/EN parity: no string added or changed; the long class is the same in both languages (T8).
19. `polish` and `harden` ran (the orchestrator); the screenshot set is in `mocks/T/built/`.
20. Parity and detector: no new detector finding in a touched file; no `impeccable-disable`.

## States table (standing check 1)

| State | What the screen shows | Proof |
|---|---|---|
| empty (no lists, an empty list, a search with no result) | the empty plate; its one primary 46 px; nothing under 40 px | sweep 360/390 |
| one (a list of one entry, one roll result) | the row and the results line at 40 px | sweep, case 109 |
| many (`/lists ~ many lists`, `LIST_A ~ many`, a four-result roll) | every card «Ещё» in its corner; the search row 40 px; the first content inside the limit | case 83, sweep |
| at the limit (50 of 50 lists, 100 of 100 entries) | the long toast with the email for 10000 ms; the red count line | case 108 (d), unchanged golden |
| one past it (the refused create) | the same toast; the field stays closed | case 108 (d) |
| 3x the default (150 lists) | 24 cards drawn, «Показать ещё (126)» at 46 px; each card «Ещё» in the corner | `listsPage.test.ts`, sweep |
| the longest name (a 120-character list name, an 80-character source) | the card name wraps beside the corner slot and never under it; the editor's back link keeps its line | S5 step 3, the shots |
| 360 px | every target at least 40x40 | sweep 360, case 109 |
| 1180 px | unchanged; every target at least 24 px or spaced | sweep 1180 |

At many and at the limit: the row order and the primary's place do not change; the selection bar at 360 is three rows
of 40 px controls on the catalog (the box, the summary and «Снять выделение»; «В список»; «Печать» and «Скопировать
текст»), about 24 px taller than today (`shots/tables-selecting__360__ru__fold.png`), and the toast sits above it; the filter sheet
(`min(85dvh, 640px)`) scrolls its 40 px chips; no popup grows past the window (the menus open where they open today;
their items were 44 px already). With the on-screen keyboard open at 360 the search rows are 40 px instead of 36: the
first entry under the box moves 4 px, inside the viewport.

## Error scenarios (standing check 2)

- Loading, a failed read, a failed write, offline: the error toasts read for 7000 ms (a long one 10000 ms) and hold
  while touched; the page lines (`LoadState`, the sync line) are unchanged. Nothing is stored by this batch.
- A conflict, a deleted record: their toasts (`hbItemChanged`, `hbGone`, `writeRefused` ...) take the new classes;
  the data paths are unchanged.
- A stale tab (the previous bundle): it keeps the old sizes and durations on the same data; nothing differs in storage.
- A revert (the previous frontend): the same; no key, no server shape.
- A toast held by a resting pointer (the reason the old code held only action toasts): the toast appears 26 px off the
  bottom, centered, so a pointer is rarely there; it runs on when the pointer leaves. Accepted with the owner's rule
  ("every toast pauses"); case 108 (c) proves the run-on.
- No path loses stored data: no plan-review trigger.

## Consistency (standing check 3)

Rules of `FEATURES.md` "Consistency rules" followed: 2 (failures: the error toasts keep their words), 4 (one name:
no label changes), 9 (the primary first: unchanged), 20 (focus returns: unchanged; the undo toast's focus rule stays).
Siblings: every page up to 600 px takes the same floor through one token, so the roll pages, the catalog, `/search`,
`/lists`, the list pages, `/homebrew` and the editor no longer differ (32 px on some rows, 40 on others). Toasts: one
duration table for every page. Named differences: the 44 px menu and row targets (already the rule); the text links'
invisible padded box (T4); the `/lists` card's corner «Ещё» against mock 8's chip row (T5); `/roll/std` and `/s/`
keep their named first-screen exceptions.

## RU/EN parity (standing check 4)

No string is added or changed. The long toast class reads both languages, so a text that is long in one language is
long in both. The header is tighter in EN at 360 (the inactive «RU» grows 35.7 to 40 px and wrapped the brand row in
the plain injection, 111 to 156 px); T12 holds it in both languages. The card corner reserves the wider label.

## Tests

- Unit: `app.test.ts`, `shell.test.ts`, `listsPage.test.ts`, and the component test of each component whose markup or
  props change (`MoreMenu` through `listsPage.test.ts`); CSS-only edits add no unit test (jsdom has no layout).
- Browser (CI): `sweep.js` 360, 390, 768, 1180 with the new step; cases 83, 108, 109; `typo.js` (the icon-and-label
  centers of the grown segments).
- Coverage: `tests/app/lib.js` is not under the vitest thresholds; the new cases and the sweep step are listed in
  COVERAGE.md.

## Verification

1. `VITEST_MAX_WORKERS=2 npx vitest run app/src/state/app.test.ts`, then `app/src/components/shell.test.ts`, then
   `app/src/components/listsPage.test.ts`, one at a time.
2. `npm run lint:untyped`, `npm run lint:typed` after the last edit.
3. `npm run build:test`; through the in-memory loader of `states.js` (the `CASES` list filtered, as batch 8 did):
   cases 83, 108 and 109 on the final `dist-test/`; `node tests/app/sweep.js 360 ru` once (Bash timeout 600000).
4. `rtk npm run check:built`; `npx impeccable detect --json --no-inline-ignores app/src` (no new finding in a touched
   file).
5. `VITEST_MAX_WORKERS=2 rtk npm run check:fast` last (Bash timeout 600000); push; CI is the full gate (the sweep at
   four widths, the goldens).

## Risks and do-nots

- Do not grow anything from 601 px. Do not put a 40 px floor under `@media print` (the `screen` query keeps it out).
- Do not add an invisible `::after` target to a boxed control to save a first-screen row (the fallback is an
  exception, not a hidden area), except where one exists today.
- Do not change a label to save width (The Same Label Rule); the header and the card corner take the space from
  padding.
- A toast must still end: the hold ends on `pointerleave`, `focusout` and `hideToast`; a hidden toast fires no
  `pointerleave`, so the next toast starts unheld (the existing reset effect stays).
- The sweep's hit test scrolls each undersized control into view; up to 760 px the header hides on a scroll down. A
  probe that lands on the shown header is a real cover, not a false report.
- A browser case that presses a control at the window's bottom right after a toast may meet a longer toast: case 108
  (e)'s offset covers the selection bar; a failing case elsewhere is adapted (wait for the toast to end or close it),
  never deleted, and `handoff.md` names it.

## Gate cost

One code batch (45-60 min: `check:fast` 12-14 min with `VITEST_MAX_WORKERS=2`, one CI run 10.5-11.5, one review fix
cycle, the screenshot set) plus extra gates: the three vitest files alone, two workers (6-8); both lints, `check:built`
and the detector (4-5); `build:test` and the loader runs of cases 83, 108 and 109 before and after the folds (10-12;
case 108 waits about 35 s a language); `sweep.js 360 ru` once (5); `polish` and `harden` (5-10). No golden re-seed.
About 75-100 min in all (`plan.md` section 8 said 65-90; the local sweep run and the first-screen loader runs before
and after are the difference).

## Writer tests (for the orchestrator's dispatch; not a model choice)

- Test 1: no. Every fork has a default (T1-T12), and each first-screen row has a fold or the exception rule.
- Test 2: no. Sizes, durations and test limits only: no contract, route, stored state, product law, hook or
  configuration.
- Test 3: yes, in part. No golden re-seed and no design node, but the folds at 360, the card's corner slot and the
  header hold rest on visual judgment against the shots of `mocks/T/`.
- Test 4: no.

## Split criterion

One batch. The Thumb Rule and the Reading Time Rule share `Toast` (`.toast-act`'s size, the bar offset, the hold) and
one CI run whose sweep proves both; a split would add a CI run and a review (45-60 min) for three lines of durations.
Split from 9b by a different route set (every route up to 600 px with its own re-baseline of every `FIRST_SCREEN` row
at 360, which 9b's list review cannot hold), and from N by its band: N changes nothing up to 760 px except the roll
`h1`'s hidden state, T changes nothing from 601 px, so the two touch no common rule, and N's goldens (1100 px) are not
moved by T.

## Plan review

Not required (no trigger fired): no migration, no SECURITY DEFINER function, no public contract change (`routes.json`,
`CONTRACTS.md`, `llms.txt`, `docs/fixtures/` stay), no stored data or `localStorage` key, no new write or sync
protocol. The toast hold changes timing only. `plan.md` Status already carries "Plan review: not required (no trigger
fired) for batches 9b and T"; this refresh keeps it.

## Fold list (for the orchestrator: `plan.md`, `handoff.md`, `context.md`; this brief edits none of them)

1. `plan.md` Status: add "Batch T refresh (2026-11-05): `plan-T.md` is batch T's brief (decisions T1-T12, steps
   S1-S10, acceptance 1-20, the four standing checks); `mocks/T/` is its mock (the live site with the CSS injected,
   measured). Defaults: AFK decisions item 21." The plan-review line for T stays "not required".
2. `plan.md` section 7, "Batch T": replace the outline's body by a pointer to `plan-T.md` and these changes from the
   outline: (a) the floor is the box for a boxed control and the padded box for a text link (T1, T4); (b) one token
   `--thumb` (T2); (c) a fourth toast class, long 10000 ms, for a toast with an email address or more than 80
   characters (T8; the outline had 4000/7000 only); (d) the toast floats above the selection bar (T10); (e) 8-P1 is the
   card's corner slot, a departure from mock 8's chip row (T5); (f) the header hold (T12); (g) the check is a hit test
   shared by the sweep step and case 109 (T6). The outline's "Menu/MoreMenu 44 px" line is already true (`Menu` holds 44
   px up to 600 px today).
3. `plan.md` section 8: batch T's row reads 75-100 min (was 65-90): the extra gates of `plan-T.md`, "Gate cost". The
   writer-test row for T: test 1 no (every fork has a default), test 2 no, test 3 yes in part (no re-seed; visual
   judgment on the folds, the card corner and the header).
4. `plan.md` section 14: replace "Batch T re-measures every row ..." by the measured live figures at 360x640 (before /
   plain / fold): `/roll/std` 323.5 / 338.7 / 318.7 (exception stays 325), the roll pages 250.7 / 265.9 / 245.9, the
   catalog 234.4 / 242.4 / 230.4, two filters 252.4 / 260.4 / 248.4, `/i/ci1` 137.2 / 140.4 / 136.4, `/search`
   230.0 / 236.4 / 232.4; the header 111.2 / 114.4 (155.6 at 360 EN) / 110.4. The list pages, `/lists` and
   `/homebrew` are estimates; batch T measures them through the loader.
5. `handoff.md` "Next batch": after 9b, batch T, brief `issues/57/plan-T.md`, mock `issues/57/mocks/T/`; cases 108 and
   109; writer tests as item 3; plan review not required.
6. `handoff.md` Deferred, "Toast over «Ещё»": batch T measures it (case 108 (f)) and fixes only the selection bar's
   overlap (T10); the menu overlap stays for `DEBT.md` at closeout with T's numbers.
7. `context.md` item 10, "Placed": the homes are DESIGN.md "The Phone-First Rule" (the Thumb Rule merged, no new
   "Layout" entry), DESIGN.md "Components", "Named Rules" (the Reading Time Rule, the fifth of 8) and FEATURES.md
   "Chrome", all written by batch T; the owner's "4000/7000 ms" gains the long class of 10000 ms for an email address
   or more than 80 characters (planner default, AFK item 21), because 8-G4's email toast is 110 characters.
8. Batch N (`plan-N.md`, written in parallel) already takes cases 110 and 111 after T's 108 and 109. Two couplings
   to name in N's dispatch: T's folds move N's 360 figures (the roll pages 250.7 to 245.9 px, `/roll/std` 323.5 to
   318.7, the header 111.2 to 110.4), so N reads T's tip; and both batches edit `RollPage`, `ModeRow` and
   `TablesPage` in different bands (T up to 600 px, N from 761 px; N's hidden roll `h1` text is not geometry), so the
   second one merges by reading, not by rule.
9. 8-G4's "count" (the dispatch's wording "an email address or a count"): in `reviews/8.md` the count is the page's red
   count line, which keeps the fact; a short toast with a number («Удалено списков: 2») stays a 4000 ms notice. No
   owner question: the rule reads the text, so a long toast with a number is long anyway.
10. Measurement source: the live site is production (`b6f153a5`, wave 2b), not 9b's tip; the 9a, 8 and 9b surfaces
    were read from the code at HEAD `340fa727` and their first-screen figures are estimates (`plan-T.md`,
    "First-screen rows"). No `dist/` or `dist-test/` was built or read.
11. AFK decisions file: item 21 is appended (the defaults T1-T12); item 20 is batch N's, written by its planner in
    parallel. The brief's header names item 21.
