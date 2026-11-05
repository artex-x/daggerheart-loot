# Batch P - Print: the card and the `/p/` page (implement-ready)

This brief is the implementer's whole input for batch P, with `plan.md` sections 7 ("Batch P", the inherited lines),
13 (QP answers) and 15 (the outline it expands), the mock `mocks/P/` (`index.html`, `tools/`, the 300 dpi renders) and
the burden check `mocks/P/burden/` (`render.cjs`, `sheet.png`, `burden.json`, written at this refresh). The owner
answered every mock P question on 2026-10-29 (`context.md`, "Print batch answers", "Mock P answers", "Card bottom line",
"Burden hands"). Every other choice below is the recommended option, logged in the owner-AFK decisions file (item 22).
A mock is direction (owner, 2026-11-03): each departure from mock P or from section 15 is named in "Decisions".
Section numbers ("section 15") are those of `plan.md`.

Batch P runs after batch N and its remediation (CI credit passed), before batch 10. Run order of wave 3: 9a, 8, 9b, T,
N, P, 10.

## Objective

The printed card reads at the table in one face on every machine: Source Sans 3, rules text at 7.1 pt on the standard
card and 5.7 pt on the compact card (never under 4.5 pt there), the tier word on the paper floor, list items with a
visible marker, the source line alone on the bottom line, the Figma node's hands with fingers. The sheet is fitted
again once the face has loaded, and «Напечатать» waits for that fit. The standard card is 63.5x88.9 mm if the owner
confirms the product-law text (Q-P1). The `/p/` page puts the first sheet (on a phone, the first readable card) inside
the first screen: the way back and the heading on one row, the two switches always visible, the primary first in the
row under the head (from 761 px) or in a bottom dock (up to 760 px), the notes under the sheets, no `KeepNote`.

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a rebase).
- Read `git log --oneline -8`, then the shipped `PrintCard.svelte`, `PrintPage.svelte`, `PrintPreview.svelte`,
  `PrintSwitches.svelte`, `KeepNote.svelte`, `HomebrewEditor.svelte` (`.crumb`, `.back`, `.ebar`), `Toast.svelte`,
  `Seg.svelte`, `Button.svelte`, `MoreMenu.svelte`, `TablesPage.svelte` (the `document.fonts` effect), `lib/print.ts`,
  `ports/index.ts`, `ports/types.ts`, `tokens.css`, `tests/app/print.js` (sections "size and grid", "measurements
  against the design", "the sheet in a phone window", the `cardFit` and editor-view specs). Batches 9b, T and N edited
  `Seg`, `Button`, `Toast`, `HomebrewEditor`, `PageHead`, `tokens.css` and `states.js`: a line of this brief that no
  longer matches the code is the implementer's to adapt; `handoff.md` names the change.
- Case numbers: 112 and 113 are the next free `states.js` numbers after batch N's 110 and 111; `handoff.md` names the
  ones taken.
- Host: memory-starved. Run vitest with `VITEST_MAX_WORKERS=2`, one file group at a time, and no browser suite beside
  vitest.
- Impeccable cannot run from a subagent. The orchestrator runs `polish` and `harden` on `/p/` (360, 390, 768, 1180 px,
  RU and EN) and on the print renders after S12; fallback `impeccable:impeccable-finish-reviewer`.
- Plan review: required before this batch (Status line in "Plan review" below). Q-P1 must be answered first.
- Steps are S1 to S14. The line "Session end partial progress" in `handoff.md` names the last finished step.

## Owner question (NEEDS_HUMAN_CONFIRMATION: yes)

**Q-P1. Write the 63.5x88.9 mm standard card into the product law?** The owner answered QP.2 on 2026-10-29 ("standard
card 63.5x88.9 mm, nine still fit on A4"). The answer changes the `CLAUDE.md` product law ("nine 63x88 mm cards per A4
sheet") and the public `llms.txt` sentence on `/p/<id>`, and the owner's stop rule names a product law. The
orchestrator asks once before the dispatch.

- Current: a 63x88 mm card, 8.5 mm side and 14.5 mm top and bottom sheet margins, 2 mm gutters; the subtitle says
  «как у обычной игральной», which the card is not (0.5 x 0.9 mm smaller than a 2.5 x 3.5 in card, `audit.md` PR9).
- Proposed: 63.5x88.9 mm, 7.75 mm side and 13.15 mm top and bottom margins, the same gutters; the compact card stays
  44x63 mm (QP.3). Every phone, tablet and laptop sees it only on paper and in the `/p/` preview.
- **Recommended: yes.** The card then matches the boxed Daggerheart cards and standard 63.5x88 mm sleeves, and the
  subtitle tells the truth. Trade-off: 7.75 mm side margins, still outside the 3-5 mm unprintable band of a home
  printer; every print figure is re-measured (it is anyway, for the face).
- Visual evidence for the owner (already drawn): `mocks/P/proposed-ss3-std9-colour-ru__300dpi.jpg` beside
  `mocks/P/current-today-std9-colour-ru__300dpi.jpg` (the whole sheet at 63.5x88.9 against 63x88), the real-size card
  crops `mocks/P/proposed-ss3-std9-colour-ru__card-weapon__300dpi.jpg` and `..._card-long_...`, and `mocks/P/index.html`,
  "Owner answers already in the plan".
- If the owner says no: P-D1's fallback (63x88 stays); S6 skips the size lines; the plan review is not required.

## Decisions of this refresh (planner defaults; the QP answers are the owner's)

| # | Decision | Reason and trade-off |
|---|---|---|
| P-D1 | **Card size (QP.2, Q-P1).** `.psheet` `grid-template-columns: repeat(3, 63.5mm)`, `grid-template-rows: repeat(3, 88.9mm)`, `padding: 13.15mm 7.75mm`; `PrintPreview`'s cell `63.5mm` x `88.9mm`; `PRINTED_PX.std` 240 (63.5 mm at 96 px per inch). The compact sheet is unchanged. Fallback (Q-P1 no): every 63x88 value stays. | Owner, QP.2. One geometry per sheet in two components and one constant. |
| P-D2 | **The face (QP.1).** `--print-ui` leaves `tokens.css`; `PrintCard.svelte`'s 17 `var(--print-ui)` read `var(--ui)`. The card is set in `'Source Sans 3 Variable'` where the face has loaded, else the system stack after it. | Owner, QP.1; one token, no near-duplicate. The face is already self-hosted and preloaded (batch 1), upright and italic, weights 200-900 (the name and tier number use 900). |
| P-D3 | **The fit after the face loads.** A new port `FontsPort { settled(): Promise<boolean> }` (`app/src/ports/fonts.ts`): the browser form resolves `true` after `document.fonts.ready` when `document.fonts.status` was `'loading'` at the call, else `false` at once; the fake resolves `false` at once, or holds until a test releases it (`fakeFonts()` with `release(loading: boolean)`). `PrintPage` and `PrintPreview` call it after `tick()` once per sheet render (keys: the cards, `per`, `shownPrintBW`, `lang`) and, on `true`, bump a `refit` counter that each `PrintCard` reads in its fit effect. `TablesPage`'s anchor scroll moves to the port too (its second user; the cast and its comment go). «Напечатать» is `disabled` until the port settles. | The fit never awaited a font (`PrintCard`'s doc comment): with a self-hosted face, the first fit can run in the fallback face (`font-display: swap`). After `tick()` the cards have laid out once, so the italic and any unpreloaded subset have started to load and `fonts.ready` is the pending promise. `false` skips a second fit of 180 cards when the face was already in memory. Browser APIs belong behind a port (`CLAUDE.md`); the two uses make it earn its place. Alternative: each card awaits `document.fonts.ready` itself (180 promises, no port, untestable in jsdom). |
| P-D4 | **The rules-text base per sheet (QP.4) and the compact floor (RP-2, first half).** `PrintCard` takes `compact: boolean` (both callers know it). CSS: `.pc-text { font-size: 4cqw }`, `.pcard.compact .pc-text { font-size: 4.6cqw }`. `fit()`: `const base = compact ? 4.6 : 4.0`, `const floor = compact ? 3.7 : 2.6`; the black-and-white grow runs from `base` to `GROW_CAP` (5); the shrink runs `base` down to `max(3, floor)`, then the padding rungs, then down to `floor`. The reference implementation is `refitAll` in `mocks/P/tools/mockp.cjs` (the fit the mock measured). **Departure** from section 15's "Ladder unchanged below the base": on the compact card the ladder stops at 3.7cqw (4.5 pt on a 43.2 mm content box). | Owner, QP.4. The compact floor: before it, three RU colour compact cards printed rules text at 4.2-4.4 pt, under the paper floor every label keeps (`DECISIONS.md`, "Print card small text ..."); mock P measured the cost: 3 more RU compact colour cards lose their picture (20 for 17), no catalog card clips. The standard floor stays 2.6cqw (4.7 pt at 62.7 mm). |
| P-D5 | **The damage label beside a modifier keeps today's shrink** (to fit its box, down to 2.2cqw): a named shortfall, re-measured in Source Sans 3. **Departure** from mock P's RP-2 second half (the label stops at 4.5 pt), which left «DAMAGE» 2.6 px wider than its box on 70 EN compact cards, touching the modifier and the ribbon notch. | A shortfall `FEATURES.md` already names is better than a collision on paper; no new string. Alternative: an EN "DMG" label beside a modifier on the compact sheet (a new string and a second label for one cell). |
| P-D6 | **The tier word on the label floor (PR5).** `.pc-tier i` `font: 500 max(2.6cqw, var(--pc-min-label)) / 1`; `.bw .pc-tier i` `font-size: max(2cqw, var(--pc-min-label))`. | `audit.md` PR5: 4.0 pt, the one label under 4.5 pt. |
| P-D7 | **The list marker (PR6).** `.pc-text ul { list-style-type: '\2013  ' }` (an en dash and two spaces) and `.pc-text li::marker { color: #000 }`; `ol` keeps its numbers. | Mock P drew it; the default disc printed as a speck at 6.2 pt. The node has no list, so no Figma departure. |
| P-D8 | **A picture that gives way (PR8, QP.8), with the marks cleared.** The ladder order stays (text first, picture last). When the art hides (`line - top < 24`), a colour card sets `--pcpad` to its clearance and fits its text again from `base` down to `floor`. The clearance is `max(5.8, c)` cqw, where `c` is the lowest bottom edge, in cqw of the card's top, of the absolutely placed marks the card draws (`.pc-tier`, `.pc-burden` with its `small`, `.pc-shield` with its `i`) plus 1.2cqw. **Departure** from mock P, which used a fixed 5.8cqw: a card with a tier band or a mark would draw its tags under them. | Owner, QP.8; the marks sit over the art at fixed offsets (the tier band to about 14cqw, the burden mark and label to about 21cqw), so a fixed 5.8 is only right for a card with no mark (mock P's long cards had none). S9 measures which catalog cards give way with a mark. |
| P-D9 | **The bottom line (owner, "Card bottom line").** `.pc-game` («Daggerheart») and its CSS go; `.pc-bottom` `justify-content: flex-end`; `.pc-src` takes the whole width, right-aligned. | Owner. The source keeps the node's right-hand place; a long homebrew source wraps in the full width. |
| P-D10 | **The burden hands (owner, "Burden hands").** `card/burden-1.svg`, `burden-2.svg`, `burden-1-bw.svg`, `burden-2-bw.svg` take the bytes of `C:\Users\Ignat\.dhloot\notes\57\figma\burden-{1,2}-{colour,bw}-hands.svg` as exported (62x37, `<use>` and masks; no hand edit, no optimizer). `PrintCard`'s `<img ... width="62" height="37">`. They stay unfolded: each pair's geometry differs (the colour file draws 8 `<path>` elements, the black-and-white file 5; `tests/derived.js` "its two files share one shape" holds), so `UNFOLDED` and `cardVectors.ts` do not change. Paths stay (`CONTRACTS.md` section 5). | Owner. Measured at this refresh (`mocks/P/burden/burden.json`): each hands file draws pixel-identical to its raw Copy-as-SVG export cropped above the «ХВАТ» label (0% of 744x444 px differ at 12x), and differs from today's mitten files on 5.0-5.8% of the pixels (the finger cuts). The node's own pixels need a signed-in Figma; the raw export is the node's vector, so the crop check stands for the node (S1). |
| P-D11 | **The head row: `Crumb.svelte`** (new, `app/src/components/`), extracted from `HomebrewEditor`'s `.crumb` on its second use: `<div class="crumb"><a class="back" href={href} onclick>...</a><h1 class="ttl" title>...</h1></div>` with props `href`, `label`, `title`, `onback?: (e: MouseEvent) => void`. The editor passes `href` only; `PrintPage` passes `href` = the home section and `onback` that calls `preventDefault()` and `router.back()` when `canGoBack()` (FEATURES "Print": back in history, else home). Both inline copies go. «Назад» becomes a link (it was a `Button`). The sub line leaves the head. | "Extract shared UI on its second real use; remove both inline copies" (`CLAUDE.md`). Mock 7 and mock P draw «Назад» and the heading on one row. The editor's DOM stays byte-identical (its goldens must not move). Alternative: a `Button` beside a `PageTitle` in a flex row, a third copy of the pattern. |
| P-D12 | **The action row and the dock.** From 761 px (`app.band !== 'narrow'`) one row under the crumb: «Напечатать» (primary), the two switches, «Ссылка на набор» (a plain button, the row's end). Up to 760 px: the switches' row under the crumb, and a bottom dock after the sheets with «Напечатать» (grows) and `MoreMenu` («Ещё», `up`, `flip`; one item «Ссылка на набор»); the dock is `position: sticky; bottom: 0` from a 481 px window height (as the editor's `.ebar`) and sets `--ebar-h` while mounted (`ResizeObserver`, as `.ebar`), so focus stops clear of it. **Departure** from section 15, which put «Ссылка на набор» into «Ещё» at 1180 too: a one-item menu where the label fits breaks the Clarity Rule; mock P's 1180 frame draws the button, and the list pages move their actions into «Ещё» up to 760 px only (D-head 1). | First-Screen Rule at 360 (estimate below); the primary is the first control under the head from 761 px (rule 9 followed, its print departure goes). At 360 «Напечатать» and «Ссылка на набор» do not fit one row in RU (about 333 px for 328), so the link takes «Ещё». The band comes from the `viewport` port, so JS and CSS agree. |
| P-D13 | **The notes under the sheets.** The sub line (cards, sheets, size) and the gray hint follow the last sheet at every width; above every sheet from the second, «Лист N из M» / "Sheet N of M" (`printSheetN`, new); both hidden in print media. The red deleted note, the clip warning and its status region stay above the sheets (they are states, not the default). The hint loses the A4, orientation and margin sentence (C29) and reads «В окне печати включите «Фоновые изображения».» / 'In the print dialog, turn on "Background graphics".', unless S11 shows a PDF without background graphics is the same as one with them; then the hint goes too (C29 "at most"). | Section 15; `@page` sets A4, the orientation and the margins. `print-color-adjust: exact` may already print the backgrounds; the measure decides, the default keeps the hint. |
| P-D14 | **The phone preview (QP.6) at the 760 px step, not 600.** Up to 760 px the screen draws one card per row, `min(column, 420px)` wide (`PREVIEW_MAX_PX`, the editor preview's cap), centered, 12 px apart; blanks are not drawn; each card keeps its paper layout and is drawn by a screen-only `transform: scale(k)` with `k` = shown width / printed width, passed to the card as `screenScale` (the same mechanism as today's scaled sheet: `fit()` divides it out). From 761 px the scaled sheet of today. Print media draws the sheets as today at every width. **Departure** from mock P and section 7's "below 600 px": 760 is the system step the `viewport` port reads (DESIGN.md, "The Two Breakpoints Rule": no new system breakpoint), and `k` must be computed in code. | Owner, QP.6 ("one card per row at 360"). At 761 px today's sheet draws its cards about 218 px wide (readable); at 600-760 px a whole sheet would draw them 170-218 px. A 420 px cap keeps a card under about 590 px tall on a tablet held upright. Alternative: 600 px by a component media query, with `k` read from the DOM: a second width source. |
| P-D15 | **`KeepNote` goes (C31).** `KeepNote.svelte`, its `a11y.test.ts` line, its `printPage.test.ts` describe, the strings `keepBefore`, `keepLink`, `keepAfter` and the getter `printChanged` (no reader left: `app.test.ts` and `accountPage.test.ts` assert `shownPrintBW` / `shownPrintCompact` against the default instead). The switches show the visit's choice. | Owner Q3.2; `handoff.md` Deferred ("`KeepNote.svelte` leaves with batch P"). Delete a component with its last caller. |
| P-D16 | **Labels (QP.7, RP-1).** `printColor` «Цвет» / "Color", `printBW` «Ч/б» / "B&W", `printStd` «63×88» / "63×88", `printCompact` «44×63» / "44×63", `printNow` «Напечатать» / "Print"; they reach `/p/`, the editor's print view and the account defaults (one name, rule 4). The colour group's accessible name was the page title; it becomes `printInk` «Цвет печати» / "Print color" (new) in `PrintSwitches` and stays `defaultPrint` on the account page. | Owner, QP.7 and RP-1. The group name is a campsite fix: a radio group named «Печать карточек» does not say what it chooses. |
| P-D17 | **The subtitle (QP.2).** `printSub` «Карточек: %n. Листов A4: %p. Размер карты 63,5×88,9 мм - как у обычной игральной.» / "Cards: %n. A4 sheets: %p. Card size 63.5×88.9 mm - the size of a playing card." `printSubCompact` unchanged. Fallback (Q-P1 no): today's text. | Owner, QP.2; RU decimal comma, EN decimal point. |
| P-D18 | **The toast clears the dock.** `Toast.svelte`'s page toast offset adds `var(--ebar-h, 0px)` beside batch T's `var(--selbar-h, 0px)`; `tokens.css`'s `--ebar-h` comment names both bars (the editor's and the print page's). | A 4000 ms «Ссылка скопирована» would cover «Напечатать» at 360. The editor's toast clears its bar too (the same variable). Fallback: if T's toast offset has another form, follow it and name the change. |
| P-D19 | **The bundle.** About +0.6 to +1.0 kB (the port, `Crumb`, the dock) and -0.4 kB (`KeepNote`); measured in S13. A raise follows the standing rule (measured total rounded up, the reason in the commit, under the 300 kB ceiling). | `context.md`, "Bundle budget ceiling". |

## Placed items (each is its own acceptance line below)

- `plan.md` section 7, "Batch P", every line: PR1-PR10 and PR12 with their outcomes; C29, C30, C31; the `/p/` retired
  link and failed read on `ErrorPage` with the gone set kept on `PageTitle` (`routes.json` `#/p/short`); the shared
  switch labels with the account; the `/p/` `FIRST_SCREEN` row asserted; each Figma departure in `FEATURES.md`; the
  lines of "Each of batches 2-9"; QP.1, QP.6, QP.7, QP.8; RP-1; the card bottom line; the burden hands; QP.2 in
  `CLAUDE.md`; DESIGN.md "Signature component: the print card" and The Two Breakpoints Rule.
- Section 15: the fit after the face loads with a waiting «Напечатать»; the catalog measure's figures in `FEATURES.md`;
  no catalog card clipped; the face on every machine; the editor's print preview renders the same card and fit.
- `handoff.md` Deferred: "`KeepNote.svelte` leaves with batch P" (P-D15).
- Batch T, "Out of scope": "batch P builds its bar on the rule" (the Thumb Rule at 360 and 390 px on `/p/`).
- Batch N (`plan-N.md`, "In scope" and `plan-nav.md` section 4): `/p/` draws no `PageHead`, so The Head Order Rule does
  not apply and batch N leaves it alone; batch P keeps `/p/` without a pin and help (the crumb is not a `PageHead`).
- Mock P's RP-2 (`reviews/mocks-2.md`): the compact floor (P-D4) and the label (P-D5).

## In scope

- New: `app/src/ports/fonts.ts` (`browserFonts`, `fakeFonts`), `FontsPort` in `ports/types.ts`, `fonts` in `Env`;
  `app/src/components/Crumb.svelte`; the dock in `PrintPage`; `PrintCard`'s `compact` and `refit` props; the strings
  `printInk`, `printSheetN`; cases 112 and 113; the inventory states of "New states".
- Changed: `PrintCard.svelte`, `PrintPage.svelte`, `PrintPreview.svelte`, `PrintSwitches.svelte`, `HomebrewEditor.svelte`
  (the crumb only), `TablesPage.svelte` (the port only), `Toast.svelte` (one offset line), `tokens.css` (`--print-ui`
  out, the `--ebar-h` comment), `lib/print.ts` (`PRINTED_PX.std`, `cardScale`), `lib/dict.ts`, `state/app.svelte.ts`
  (`printChanged` out), `ports/index.ts`, `ports/types.ts`; the four `card/burden-*.svg`.
- Deleted: `KeepNote.svelte`.
- Tests: `printPage.test.ts`, `homebrewPrintPreview.test.ts`, `print.test.ts`, `ports.test.ts`, `tables.test.ts`,
  `accountPage.test.ts`, `app.test.ts`, `a11y.test.ts`, `crumb.test.ts` (new), the editor's component test that reads
  `.crumb` (find it with `git grep -n "crumb\|\.back" -- app/src/components/*.test.ts`), `tests/app/print.js`,
  `tests/app/states.js` (cases 83, 112, 113, and the case that reads `.keepnote a`), `tests/app/inventory.js` (S10).
- Prose: `FEATURES.md` ("Print", "Homebrew" print view, "Account" Display switches, rule 9), `DESIGN.md`, `COVERAGE.md`,
  `CLAUDE.md` (Q-P1), `PRODUCT.md`, `README.md`, `README.ru.md`, `llms.txt` (Q-P1), one decision file and the
  "Amended by" lines of the five older ones, `docs/DECISIONS.md` (by `node tools/decisions.js`).

## Out of scope

- The sheet counts, the colour and black-and-white split, the browser-measured fit (product law); the compact card
  size (QP.3); the name and tags (QP.5, PR10 kept); the screen record card.
- A `PageHead` on `/p/`; the gone set's move to `ErrorPage` (a `routes.json` contract change, not taken).
- `.impeccable/design.json` (batch 10 regenerates it); the detector's print colour advisories (batch 10, N3).
- Anything copied from the Core Set PDF.

## Facts read from the code and measured (HEAD `340fa727` and the 9b working tree, 2026-11-05)

1. `PrintCard` fits once per render, synchronously, at 3.5cqw on both sheets; the ladder steps 0.1cqw to 3.0, the
   padding 23 to 8cqw by 1.5 (colour) or 5.8 to 3cqw (black and white), then 0.1cqw to 2.6; black and white grows to
   5cqw first. It does not know the sheet size.
2. `--print-ui` is 'Inter' then the system stack; Inter is not installed on this host, so the card prints in Segoe UI
   here and in another face elsewhere (`audit.md` PR3).
3. The tier word is `max(2.6cqw, 4pt)` (colour) and `max(2cqw, 4pt)` (black and white): the one label under 4.5 pt.
4. `.pc-bottom` is `space-between` with «Daggerheart» (`.pc-game`, `nowrap`) and the source; a long source wraps beside
   it.
5. The burden `<img>` reserves 62x36; the files are 62x36 mittens; the exports are 62x37 with fingers
   (`mocks/P/burden/`).
6. `PrintPage`: `PageTitle` (title and sub), then one `Actions` row («Назад», «Отправить на печать», two `Seg`,
   «Ссылка на набор»), `KeepNote` while a switch differs from its default, the red note, the clip box, the gray note,
   then the sheets; below an 840 px column the whole sheet scales (`sheetScale`). The sheet is the `data-primary`.
7. `FIRST_SCREEN` row `#/p/set-emberaxe as gm2` is `shipped: false`. Mock P measured the proposal on the pre-batch-1
   build (248 px at 360x640, 271 at 1180x720); the shell changed since (111 px header at 360, 63 at 1180, 26 px of
   `main` padding), so the figures are estimates below and S2 measures them.
8. `print.js` clicks the switches by their labels («Чёрно-белая», «Цветная», «Компактная», «Обычная», 16 sites), pins
   the card at 63x88 mm, «Daggerheart» on the bottom line (`gameLines`), the design positions (`SPEC`: the burden mark
   right 24, top 20, width 62 units of 344), the 3.5cqw colour ceiling and the 2.6..5 range, and the phone sheet at 360
   and 768 px scaled whole.
9. `llms.txt` (the `/p/<id>` line), `README.md`, `README.ru.md`, `PRODUCT.md`, `CLAUDE.md`, `DESIGN.md` and
   `FEATURES.md` state 63x88 mm.
10. `TablesPage.svelte` reads `document.fonts.ready` through a cast (jsdom has no `FontFaceSet`); no port exists.

## Numbers that need the build (the implementer measures them; none can be read on production)

`/p/` needs a signed-in account, which the live site cannot give a probe, and the card changes exist only in code. So:

| Number | Where it lands | Step |
|---|---|---|
| `/p/` first-screen tops at 360x640, 390x844, 768x1024, 1180x720, RU and EN (estimate 236-248 px at 360: header 111, padding 26, crumb row about 40, gap, the switches' 42 px track, gap; about 200-215 px at 1180) | `FIRST_SCREEN`, case 112, `handoff.md` | S2 (before), S12 (after) |
| The catalog fit in all four layouts, RU and EN, in the shipped face: rules-text median and minimum pt, cards below the base, art median, art gone, names on three lines, the smallest text and what it is | `FEATURES.md` "Print", the decision file, `handoff.md` | S11 |
| Which cards give their picture way with a tier band or a mark, and their clearance (P-D8) | `handoff.md`, `print.js` | S11 |
| The compact EN «DAMAGE» shortfall in pt (today 3.1-3.7 in Segoe UI) and the RU one-line values (4.8 pt) | `FEATURES.md` named shortfalls | S11 |
| The black-and-white head with the 37-unit burden mark (the `SPEC` positions, the head height) | `print.js` `SPEC` | S11 |
| The time from the sheet drawn to «Напечатать» enabled, cold and warm cache, and the refit cost on the 180-card set | `handoff.md` | S12 |
| A PDF with and without background graphics (P-D13) | the hint's text | S11 |
| The dock's height at 360 (one row, 40 px buttons, safe-area padding) and the `--ebar-h` it writes | `handoff.md` | S12 |

## Files expected

| Step | Files |
|---|---|
| S1 | `issues/57/mocks/P/burden/` (re-run `render.cjs`), `card/burden-1.svg`, `burden-2.svg`, `burden-1-bw.svg`, `burden-2-bw.svg` |
| S3 | `app/src/ports/fonts.ts`, `ports/types.ts`, `ports/index.ts`, `ports.test.ts`, `TablesPage.svelte`, `tables.test.ts` |
| S4 | `PrintCard.svelte`, `tokens.css` |
| S5 | `PrintCard.svelte`, `PrintPage.svelte`, `PrintPreview.svelte` |
| S6 | `PrintPage.svelte`, `PrintPreview.svelte`, `lib/print.ts`, `print.test.ts` |
| S7 | `Crumb.svelte`, `crumb.test.ts`, `HomebrewEditor.svelte`, `PrintPage.svelte`, `PrintSwitches.svelte`, `Toast.svelte`, `tokens.css` |
| S8 | `KeepNote.svelte` (deleted), `PrintPage.svelte`, `state/app.svelte.ts`, `app.test.ts`, `accountPage.test.ts`, `a11y.test.ts` |
| S9 | `lib/dict.ts`, `printPage.test.ts`, `homebrewPrintPreview.test.ts` |
| S10 | `tests/app/inventory.js`, `tests/app/states.js`, `tests/app/print.js` |
| S11 | `issues/57/mocks/P/tools/print-measure.cjs` and `print-analyse.cjs` (pointed at `dist-test/`), `handoff.md` |
| S12 | `issues/57/mocks/P/built/` |
| S13 | `FEATURES.md`, `DESIGN.md`, `COVERAGE.md`, `CLAUDE.md`, `PRODUCT.md`, `README.md`, `README.ru.md`, `llms.txt`, `docs/decisions/`, `docs/DECISIONS.md` |
| S14 | goldens under `tests/app/snapshots/`, `handoff.md` |

## Steps

### S1. The hands, rendered and compared, then swapped

1. `node issues/57/mocks/P/burden/render.cjs`. Expected: `burden.json` has `diffToRawPct: 0` and `natural: [62, 37]`
   for all four files. Read `sheet.png`: the hands draw fingers in colour (a gold held hand, a black free hand; both
   black on the two-handed mark) and in black and white (white held, `#5E5F6E` free), as today's files draw them with
   no fingers. A non-zero diff or a missing finger stops the swap: name it and return (the fallback is the redraw named
   in `plan.md` section 7, an exception to "export vectors, do not redraw them", and needs the owner).
2. If the orchestrator's session has Claude in Chrome with the owner's Figma session, the orchestrator compares
   `sheet.png` with the `Burden` groups of the Палаш card (one hand) and the Длинный меч card (two hands) on nodes
   `714-42387` and `3773-90792`; otherwise the crop check of step 1 stands for the node (the raw files are the node's
   Copy as SVG). `handoff.md` says which ran.
3. Copy the four `-hands.svg` files over `card/burden-1.svg`, `card/burden-2.svg`, `card/burden-1-bw.svg`,
   `card/burden-2-bw.svg` byte for byte (`cp`; the source is outside the checkout). In `PrintCard.svelte` the burden
   `<img>` reads `width="62" height="37"`.
4. `node tests/derived.js` (the folded vectors block): the three unfolded pairs still differ; `print.js`'s "the hand is
   filled almost black" reads `fill="#5E5F6E"` (ink 299, over 180) and passes.

### S2. Measure before

1. `npm run build:test`. Run `issues/57/mocks/measure.mjs` (or case 83 through its loader) on `#/p/set-emberaxe as gm2`
   at 360x640, 390x844, 768x1024 and 1180x720, RU and EN. Record the tops in `handoff.md` ("before").

### S3. The fonts port (P-D3)

1. `ports/types.ts`: `export interface FontsPort { /** Resolves true once fonts that were loading have settled, false
   at once when none were. */ settled(): Promise<boolean>; }` and `fonts: FontsPort` in `Env`.
2. `ports/fonts.ts`: `browserFonts()` reads `document.fonts` through one guarded access (jsdom has none: resolve
   `false`); when `status === 'loading'` it returns `document.fonts.ready.then(() => true)`. `fakeFonts(hold = false)`:
   resolves `false` at once, or, with `hold`, returns a promise that `release(loading)` settles; export the type
   `FakeFonts`.
3. `ports/index.ts`: `fonts: browserFonts()` in `browserEnv`, `fonts: fakeFonts()` in `fakeEnv`; re-export.
4. `TablesPage.svelte`: the anchor scroll waits on `app.env.fonts.settled()` (either answer); the cast and the
   "`document.fonts` does not exist in jsdom" sentence go; the comment's reason (the layout is final by then) stays.
5. `ports.test.ts`: the fake's two forms; the browser form with a stubbed `document.fonts` (`status` `'loading'` then
   `'loaded'`) answers `true` then `false`. `tables.test.ts` keeps passing.

### S4. The card: face, base, floors, marker, bottom line (P-D2, P-D4 to P-D9)

1. `tokens.css`: delete `--print-ui` and its comment. `PrintCard.svelte`: every `var(--print-ui)` reads `var(--ui)`.
2. Props: `compact?: boolean` (default `false`) and `refit?: number` (default 0). The root gets `class:compact`. The fit
   effect reads `void compact; void refit;` beside its other keys.
3. CSS: `.pc-text { font-size: 4cqw }`, `.pcard.compact .pc-text { font-size: 4.6cqw }`; P-D6's two tier rules; P-D7's
   two list rules; P-D9: delete `.pc-game` and its markup, `.pc-bottom { justify-content: flex-end }`, `.pc-src` keeps
   `text-align: right` and gains `flex: 1 1 auto`; the comment on the long source line says it wraps in the whole
   width.
4. `fit()`: `const base = compact ? 4.6 : 4.0; const floor = compact ? 3.7 : 2.6;` (named constants at the top:
   `BASE`, `FLOOR`, each with the sheet as key). Start `pct` at `base`; the grow loop as today to `GROW_CAP`; the first
   shrink `while (tight() && pct > Math.max(3, floor) + 0.05)`; the padding loop as today; the last shrink `while
   (tight() && pct > floor + 0.05)`. Compare with `mockp.cjs` `refitAll` line by line; the step sizes, `toFixed(1)` and
   the exits stay.
5. P-D8: after the art block is written, when a colour card's art is hidden, compute the clearance (the lowest
   `getBoundingClientRect().bottom` of `.pc-tier`, `.pc-burden`, `.pc-shield`, each including its label, minus the
   card's top, through `px()` and `cq()`, plus 1.2), set `--pcpad` to `max(5.8, clearance)` cqw and refit from `base`
   down to `floor`, then `report()`. A card with no mark gets 5.8cqw.
6. The doc comment of `fit()`: the base per sheet, the compact floor, the clearance, and "runs again when `refit`
   changes, after the face has loaded (`FontsPort`)" in place of "never awaits fonts".

### S5. The refit and the waiting button (P-D3)

1. `PrintPage.svelte`: `let refit = $state(0); let faceReady = $state(false);` An effect keyed on `cards`, `per`,
   `app.shownPrintBW` and `app.lang` sets `faceReady = false`, then `tick()`, then `app.env.fonts.settled()`; on its
   answer (dropped if the effect re-ran) `if (loading) refit++` and `faceReady = true`. Pass `compact={app.shownPrintCompact}`
   and `{refit}` to every `PrintCard`. «Напечатать» has `disabled={!faceReady}`.
2. `PrintPreview.svelte`: the same effect keyed on `shown`, `compact`, `bw`, `lang`, `scale`; pass `compact` and
   `refit`. No button.
3. `printPage.test.ts`: with `fakeFonts(true)` the button is disabled after the sheet draws and enabled after
   `release(true)`, and each card fitted twice (count the fits through `fakeLayout`'s reads or an `onfit` spy); with
   `release(false)` once. `homebrewPrintPreview.test.ts`: the card fits again after `release(true)`.

### S6. The geometry and the phone preview (P-D1, P-D14)

1. `PrintPage.svelte` `.psheet`: the P-D1 grid and padding (Q-P1 yes). `PrintPreview.svelte` `.pframe`: `63.5mm` x
   `88.9mm`. `lib/print.ts`: `PRINTED_PX.std` 240 and its comment; a new `cardScale(width, compact)` = `min(width,
   PREVIEW_MAX_PX) / PRINTED_PX[...]`, cut to three decimals, 1 before the column has a width (`print.test.ts`: 328 px
   gives 1.366 std and 1.972 compact; 700 px gives 1.75 std; 0 gives 1). `previewScale` stays.
2. `PrintPage.svelte`: `const narrow = $derived(app.band === 'narrow')`; `const k = $derived(narrow ?
   cardScale(column, app.shownPrintCompact) : sheetScale(column))`; `screenScale={k}`; `.pfit` takes `class:one={narrow}`
   and `class:scaled={!narrow && k < 1}`. Screen-only CSS (`@media screen`) for `.pfit.one`: `.pfit-in` no transform;
   `.psheet` `width: auto; height: auto; padding: 0; margin: 0 0 12px; background: none; box-shadow: none;
   grid-template-columns: calc(var(--pcard-w) * var(--pfit)); grid-auto-rows: calc(var(--pcard-h) * var(--pfit)); gap:
   12px; justify-content: center` (with `--pcard-w`/`--pcard-h` 63.5mm/88.9mm, or 44mm/63mm on `.compact`);
   `:global(.pcard)` inside it `width: var(--pcard-w); height: var(--pcard-h); transform: scale(var(--pfit));
   transform-origin: 0 0`; `.pcard.blank` `display: none`. `@media print` keeps today's rules and adds nothing for `.one`
   (print draws the A4 sheets).
3. «Лист N из M» (`printSheetN`, `%n` and `%m`): a `<p class="psheet-n">` before each `.psheet` from the second, at
   every width, `@media print { display: none }`, `--t-data`, `--muted`.
4. `printPage.test.ts` "the sheet on a narrow screen": with `fakeViewport('narrow')` and a 328 px column the cards carry
   `screenScale` 1.366 and the sheet class `one`; with `'mid'` and 736 px the sheet scales whole (today's test); the fit
   written at k 1.366 equals the fit at 1 (as the half-scale test).

### S7. The head, the row and the dock (P-D11, P-D12, P-D16, P-D18)

1. `Crumb.svelte` with the editor's `.crumb`, `.back` and `.ttl` CSS moved verbatim (batch T's padded box included);
   `HomebrewEditor.svelte` draws `<Crumb href={app.href(HOMEBREW_HASH)} label={t.myItems} {title} />` and loses the
   three rules. `crumb.test.ts`: a link with the icon and the label, the `h1` with its `title`, `onback` called with the
   event, `expectNoA11yViolations`.
2. `PrintPage.svelte` ready branch: `<div class="printbar"><Crumb href={app.href(sectionHash('roll/std'))}
   label={t.back} title={t.printTitle} onback={back} />` where `back(e)` calls `e.preventDefault()` and
   `router.back()` only when `canGoBack()`; then `<div class="prow">`: from 761 px «Напечатать», `<PrintSwitches
   {app} />`, «Ссылка на набор»; up to 760 px `<PrintSwitches {app} />` alone; then the red note, the status region and
   the clip box. After `.pfit`: `<div class="pfoot">` with `<p class="page-sub">{sub}</p>` and `<p
   class="printnote">{t.printNote}</p>`; up to 760 px the dock `<div class="pdock" bind:this={dock}>` with «Напечатать»
   and `<MoreMenu {app} id="print-more" up flip>` holding one item «Ссылка на набор». `.prow` is a wrapping flex row,
   gap `var(--gap-sm)`; `.pdock` copies `.ebar`'s narrow look (`--surface` ground, top `--line` border, `10px 18px`
   padding with the safe-area inset, `margin: 0 -16px`), `position: sticky; bottom: 0; z-index: 3` under `@media
   (min-height: 481px)`; its effect writes `--ebar-h` with a `ResizeObserver` and removes it on unmount, as
   `HomebrewEditor` does. `.pfoot` and `.pdock` are `display: none` in print media.
3. `PrintSwitches.svelte`: the colour group's `label={t.printInk}`.
4. `Toast.svelte`: the page toast's `bottom` adds `+ var(--ebar-h, 0px)` (P-D18).
5. The `data-primary` stays on each `.psheet` (the first one is the primary content at every width).

### S8. `KeepNote` and `printChanged` go (P-D15)

1. Delete `KeepNote.svelte`, its import and `{#if app.printChanged}` in `PrintPage`, the `printChanged` getter in
   `app.svelte.ts`, the three `keep*` strings in both languages, the `a11y.test.ts` map line, the `printPage.test.ts`
   describe "the note under the bar" (its "nothing stored" assertions move into "survives leaving the print page").
2. `app.test.ts` and `accountPage.test.ts`: each `printChanged` assertion becomes the pair `shownPrintBW` /
   `shownPrintCompact` against `printBW` / `printCompact`. `tables.test.ts` lines that read `.keepnote` stay (they
   assert absence) or go if the class is gone everywhere: delete them.
3. `git grep -n -E "keepnote|KeepNote|printChanged|keepBefore|keepLink|keepAfter" -- app tests docs DESIGN.md` returns
   only `docs/decisions/` history.

### S9. Strings (P-D13, P-D16, P-D17)

`dict.ts`, both languages, ASCII apart from the `×` the labels already use:

| Key | RU | EN |
|---|---|---|
| `printColor` | Цвет | Color |
| `printBW` | Ч/б | B&W |
| `printStd` | 63×88 | 63×88 |
| `printCompact` | 44×63 | 44×63 |
| `printNow` | Напечатать | Print |
| `printInk` (new) | Цвет печати | Print color |
| `printSheetN` (new) | Лист %n из %m | Sheet %n of %m |
| `printSub` | Карточек: %n. Листов A4: %p. Размер карты 63,5×88,9 мм - как у обычной игральной. | Cards: %n. A4 sheets: %p. Card size 63.5×88.9 mm - the size of a playing card. |
| `printNote` | В окне печати включите «Фоновые изображения». | In the print dialog, turn on "Background graphics". |

Then `printPage.test.ts` and `homebrewPrintPreview.test.ts` take the new labels (49 and its sites; `git grep -n -E
"'(Цветная|Чёрно-белая|Компактная|Обычная|Color|Black and white|Compact|Standard|Отправить на печать|Send to printer)'"
-- app/src tests`), the English test the new bar, and the order test: crumb, then from 761 px «Напечатать», the two
groups, «Ссылка на набор». `accountPage.test.ts` takes the account labels. Run `VITEST_MAX_WORKERS=2 npx vitest run
<the files of S3-S9>`.

### S10. Browser tests and states

1. `tests/app/print.js`: the switch clicks take the new labels (`bw` «Ч/б», `colour` «Цвет», `compact` «44×63», the
   standard «63×88»; EN «B&W»); the card size 63.5 / 88.9 mm (Q-P1), the compact 44 / 63; the colour text ceiling and
   ranges read the base per sheet (`<= 4.0` standard and `<= 4.6` compact in colour; `floor..5` in black and white);
   «Daggerheart» absent from every bottom line and the source box as wide as the content box (`gameLines` goes); the
   burden `SPEC` and the head figures re-measured with their reasons; "the sheet in a phone window": at 360 one card per
   row, each card `min(column, 420)` wide, no sideways scroll, the footer after the dock; at 768 the scaled sheet; at
   1180 the paper size; print media equal at 360 and 1180 (the existing box and page-count check); a new check: no
   colour card whose art is hidden draws its tags or name above the bottom of its tier band or mark (P-D8); every
   rendered text node of the catalog sheets at or over its floor, the named shortfalls excepted by element; the
   computed face of `.pc-text` is Source Sans 3 (CDP `CSS.getPlatformFontsForNode`, as `audit.md` read it).
2. `tests/app/states.js`:
   - case 83: `#/p/set-emberaxe as gm2` to `shipped: true` (the rule at 360x640 and 1180x720, RU and EN).
   - the case that reads `.keepnote a` (`c` of the prefs case): asserts no note and the switch pressed for the visit.
   - **Case 112, the print page head and dock** (FEATURES "Print"; DESIGN.md "The Two Breakpoints Rule"):
     `#/p/set-emberaxe as gm2` at 360x640, 390x844, 768x1024 and 1180x720, RU and EN: (a) DOM order: the back link,
     the `h1`, then from 761 px «Напечатать», the two groups, «Ссылка на набор» on one row, up to 760 px the two groups
     on one row; (b) up to 760 px the dock is in view at scroll 0 and after a scroll to the last card, holds «Напечатать»
     and «Ещё», and `--ebar-h` equals its height; «Ещё» opens up with «Ссылка на набор»; (c) the first `.psheet` top
     within 40% of the height (logged at 390 and 768); (d) up to 760 px each card is one per row, `min(column, 420)`
     wide within 1 px, centered; (e) «Лист 2 из 2» before the second sheet of the ten-card set; (f) no sideways scroll;
     (g) every control at 360 and 390 px passes batch T's `targets` floor (40 px, 44 for menu items).
   - **Case 113, the face wait**: open `#/p/set-emberaxe as gm2` at 1180x720 with request interception holding every
     `/assets/*.woff2` for 1500 ms and the cache disabled: «Напечатать» is disabled while the sheet shows and enabled
     after the fonts arrive; the cards' written fit (the `.pc-text` sizes and `--pcpad`) then equals a warm open of the
     same set; with the woff2 requests failed (aborted), the button enables and the sheet fits in the fallback face.
3. `tests/app/inventory.js` ("New states"), with the `why` of `#/p/set-longsrc1 as gm2` and `~ compact` rewritten (no
   «Daggerheart»; the source wraps in the whole width) and every `why` that names an old label or «Отправить на
   печать» updated.

### S11. The catalog measure (on `dist-test/`)

1. Point `issues/57/mocks/P/tools/print-measure.cjs` and `print-analyse.cjs` at this worktree's `dist-test/` (a
   constant at the top; the mock's own build path stays for history) and remove their CSS and fit injection: the build
   is the proposal now. Run RU and EN, four layouts, the 1459 records and the four `gm4` homebrew items, in sets of
   180. One browser at a time.
2. Record per layout: rules-text median and minimum pt, below the base, art median and p10, art gone (and how many of
   them carry a tier band or a mark, with the clearance), names on three lines, clipped (only the `uuid(516)` fixture),
   the smallest rendered text and what it is (the named shortfalls by element). Expected near mock P's Source Sans 3
   column (`mocks/P/index.html`, "The fit over the whole catalog"); a difference over 2 cards or 0.3 pt is named.
3. Print one nine-card colour PDF with `printBackground: true` and one with `false`, raster both at 150 dpi
   (`mockp-raster.cjs`); if the share of differing pixels is under 0.1%, the hint goes (P-D13), else it stays.
4. The figures go into `FEATURES.md` "Print" (S13) and `handoff.md`.

### S12. The screenshot set

`issues/57/mocks/P/built/`: `/p/set-emberaxe as gm2` and the ten-card set at 360, 390, 768 and 1180 px, RU and EN
(the dock, the open «Ещё», the second sheet's label), and the 300 dpi PDF rasters of the nine and sixteen sheets in both
layouts and languages (the `mocks/P/` file names with the `built-` prefix). Measure the first-screen tops ("after"), the
dock height, and the button's wait (cold and warm) and the refit time on the 180-card set; record them in `handoff.md`.

### S13. Specs and decisions (each in this commit)

1. `FEATURES.md` "Print": the card size and margins (Q-P1); the face and the fit after it loads, the waiting
   «Напечатать», a tab offline with no cached face prints in the fallback; the bases 4.0 / 4.6cqw, the compact floor
   3.7cqw, the black-and-white grow from the base; the tier word on the 4.5 pt floor; the en dash marker; the art that
   gives way and its clearance; the bottom line without «Daggerheart» (its sentence goes); the hands of the nodes; every
   measured figure of S11 with its date and host; the named shortfalls re-measured; the `/p/` bar (the crumb, the row,
   the dock up to 760 px, the notes under the sheets, «Лист N из M», no note under the bar: the paragraph on the
   switches' note is rewritten); the phone preview up to 760 px; each departure from nodes `714-42387` and `3773-90792`
   with its date: the card size, the face, the bases, the compact floor, the tier word floor, the clearance. "Homebrew"
   (the print view's cell size and labels), "Account" (the Display switches' short labels), rule 9 (the print bar's
   departure goes; the dock up to 760 px is named as the editor's bar is).
2. `DESIGN.md`: "Overview" (the print exception paragraph: the card is set in the UI face; the "identical print"
   sentence is true now); "Typography" ("Print Font" line goes, the UI font line names the print card); "The Local Font
   Rule" (the card's sentence); "The Two Breakpoints Rule" (the `/p/` step at 760 px: one card per row); "Signature
   component: the print card" (63.5x88.9 mm, 13.15 by 7.75 mm margins, the face, the bases, the compact floor, the
   marker, the bottom line, the hands with fingers; the compact card is no longer the standard card at 70% in its text
   size).
3. `CLAUDE.md` "Product laws" line: "nine 63.5x88.9 mm cards per A4 sheet" (Q-P1). If a guard refuses the write, stop
   and return the text for the orchestrator.
4. `PRODUCT.md` (the "Table handout" row), `README.md` and `README.ru.md` (the print paragraph), `llms.txt` (the
   `/p/<id>` line): 63.5x88.9 mm. `node tests/contracts.js` and `node tests/derived.js` pass.
5. `COVERAGE.md`: the `app/print` row (the new checks of S10.1), cases 112 and 113, `Crumb.svelte` and `fonts.ts` with
   their tests, `KeepNote` out of the print row.
6. A decision file `docs/decisions/2026-11-<dd>-the-print-card-sets-the-ui-face-at-a-larger-base.md` (title at most
   80 characters, for example "The print card prints in the UI face at 7.1 pt, fitted after it loads"): Decision (the
   face, the bases and floors, the fit after the face, the size with Q-P1); Rejected (today's local stack: a different
   fit on every machine; Overpass: not compared, QP.1; an art floor: smaller text on the longest cards, QP.8; a 600 px
   phone step: a second width source; the label stop at 4.5 pt: a collision on 70 EN compact cards); "Amends" lines for
   "Print card small text keeps the ribbon and gets one paper floor in every view" (2026-09-23: the tier word, the
   compact floor), "The compact sheet is an independent size switch" (2026-09-23: the compact card is no longer the
   standard card at 70% in its text), "The black-and-white card grows its rules ..." (2026-09-23: it grows from the
   base), "The print sheet scales to a phone screen by a ..." (2026-10-22: one card per row up to 760 px), "The UI font
   is Source Sans 3, self-hosted" (2026-10-29: the print card takes it) and "The print card recolours its exported
   vectors with ..." (2026-10-21: the burden files take new bytes); the mirror "Amended by" line in each of those six
   files. `node tools/decisions.js`.

### S14. Goldens, gates and the handoff

1. Find the goldens that move: `git grep -l -E "Цветная|Чёрно-белая|Обычная|Компактная|Отправить на печать|Send to
   printer|Black and white|Daggerheart|настройках аккаунта|account settings" -- tests/app/snapshots` (the `/p/` states,
   the account Display states, the editor's print views); `npm run build:test`; re-seed those states and the new ones
   with `node tests/app/golden.js --update --only <id>` (one shard at a time). Read every diff: only the bar, the labels,
   the notes, the bottom line and the new states may move; an editor golden that moves is a `Crumb` regression.
2. Local gates (owner, "Local gates", with one exception): the vitest files of S3-S9, both lints, Prettier, the detector
   on the touched files, `node tests/derived.js`, `node tests/contracts.js`, `npm run check:built`, one local
   `node tests/run-all.js app/print` (the print figures cannot be pinned from CI's logs alone; about 8 min, no vitest
   beside it), then `rtk npm run check:fast` last (Bash timeout 600000). Cases 112, 113 and the sweep run on CI.
3. `handoff.md`: every acceptance line with its outcome, the S2 and S12 tables, the S11 figures, the departures (P-D4,
   P-D5, P-D8, P-D12, P-D14 and any found while building), the `polish` and `harden` outcome, the CI run.

## New states (each an inventory entry, a golden in RU and EN and an axe case)

| State | Why |
|---|---|
| `#/p/set-emberaxe ~ phone as gm2` (`width: 360`) | the crumb, the switches' row, one card per row, the dock with «Напечатать» and «Ещё», the notes under the card |
| `#/p/set-emberaxe ~ phone more as gm2` (`width: 360`) | the dock's «Ещё» open upward with «Ссылка на набор» |
| `#/p/set-tencards as gm2` | two sheets: «Лист 2 из 2» before the second, the notes after it (the seeded set `set-tencards`, `ci1`-`ci10`, already exists in `fake-cloud-seed.ts`; add the state only if `inventory.js` has none for it) |

The axe cases: `printPage.test.ts` "axe" adds the narrow band with the dock and the open «Ещё» (`fakeViewport('narrow')`).

## Acceptance (each line is checked and its outcome is in `handoff.md`)

1. Q-P1 answered before the dispatch; with yes, the standard card is 63.5x88.9 mm with 7.75 / 13.15 mm margins
   (`print.js` "size and grid"), and `CLAUDE.md`, `PRODUCT.md`, `README.md`, `README.ru.md`, `llms.txt`, `DESIGN.md` and
   `FEATURES.md` say so; with no, every 63x88 figure stays and the line reads "kept, owner".
2. PR1 and PR2 (QP.4): the rules text starts at 4.0cqw standard and 4.6cqw compact; the catalog measure (S11) gives the
   medians (7.1 and 5.7 pt in colour) and the counts that `FEATURES.md` states.
3. PR3 (QP.1): `--print-ui` is gone (`git grep -n print-ui -- app` returns nothing); `print.js` reads Source Sans 3 as
   the platform face of `.pc-text`.
4. The fit after the face: `printPage.test.ts` (S5.3) and case 113 pass; «Напечатать» is disabled until the port
   settles; an aborted face fits in the fallback and the button enables.
5. PR4, C29, C30 (First-Screen Rule): the `/p/` row of `FIRST_SCREEN` is `shipped: true` and passes at 360x640 and
   1180x720, RU and EN (target 240 / 270, limit 256 / 288); case 112 (c) logs 390 and 768.
6. PR5: the tier word is at least 4.5 pt in every layout (`print.js` floors check).
7. PR6: a `ul` item prints an en dash in black (`print.js` reads `li::marker` content and colour on `voa2_a3`).
8. PR7: closed with no code (measured in mock P); `FEATURES.md` keeps no claim about it.
9. PR8 and QP.8: the ladder order holds; a colour card whose art gives way has no blank band and clears every mark
   (`print.js`, P-D8 check); `handoff.md` lists the cards and their clearance.
10. PR9: answered by Q-P1 (line 1).
11. PR10 (QP.5): the name and tags are unchanged (no `.pc-name` or `.pc-tag` rule changes in the diff).
12. PR12 and C31: no `KeepNote` (S8.3 grep); the A4 sentence is gone; the hint is under the sheets or gone by S11.3.
13. C29: the bar holds the crumb row and one control row from 761 px, the crumb row and the switches' row up to 760 px.
14. C30 and QP.6: up to 760 px one card per row at `min(column, 420)` px; print media unchanged at 360 (`print.js`).
15. QP.7 and RP-1: the four short labels and «Напечатать» / "Print" on `/p/`, the editor's print view and the account
    defaults; `printInk` names the colour group.
16. The bottom line: no «Daggerheart» on any card in any layout; the source takes the whole width; `FEATURES.md` lost
    the sentence; the `why` of `#/p/set-longsrc1 as gm2` and its compact twin changed.
17. The burden hands: S1 step 1 passed (0% difference to the raw export); the four files hold the export bytes
    (`git diff --stat card/` shows four files and nothing else); the `<img>` reserves 62x37; `tests/derived.js` and
    `print.js` pass. Every `card/*.svg` path is unchanged (`CONTRACTS.md` section 5).
18. The compact floor (P-D4): no rules text under 3.7cqw on the compact card; the label beside a modifier is a named
    shortfall with its measured pt (P-D5).
19. No catalog card clips (the `uuid(516)` fixture alone, by design); the smallest rendered text is at its floor or a
    named shortfall (S11).
20. The editor's print preview renders the same card and fit as the sheet (`print.js` editor-view spec passes with the
    new bases and size).
21. The `/p/` retired link and the failed read draw `ErrorPage`; the unknown, expired and malformed set still draws
    `PageTitle` «Печать карточек» with `printSetGone` (`routes.json` `#/p/short` unchanged).
22. `Crumb.svelte` serves the editor and `/p/`; the editor's goldens are byte-identical; `crumb.test.ts` ends with
    `expectNoA11yViolations`.
23. The fonts port serves `PrintPage`, `PrintPreview` and `TablesPage`; no component reads `document.fonts`
    (`git grep -n "document.fonts" -- app/src` lists only `ports/fonts.ts`).
24. The dock: case 112 (b); the toast clears it (P-D18); focus stops clear of it (`--ebar-h`).
25. The Thumb Rule on `/p/` (batch T): `sweep.js 360` and `390` report no target under 40 px on `/p/`; case 112 (g).
26. New states: the three of "New states" with goldens in RU and EN and axe cases.
27. Each departure from nodes `714-42387` and `3773-90792` is named in `FEATURES.md` "Print" with its date; DESIGN.md
    and the decision file match; the six older decision files carry "Amended by".
28. "Each of batches 2-9": the owner's mock notes applied (QP answers; none rejected); `polish` and `harden` ran and
    `handoff.md` gives the outcome; no detector finding in a touched file except the N3 print colour advisories for
    batch 10; no `impeccable-disable` added; American spelling in new prose; the screenshot set in
    `issues/57/mocks/P/built/`.
29. The bundle stays under its budget, or the budget rises by the standing rule with the reason in the commit.
30. `printChanged` and the three `keep*` strings are gone in both languages.

## Standing checks

### 1. Scale

| State | What `/p/` and the card show | Proof |
|---|---|---|
| empty set (no card the build knows) | the heading, «Печатать нечего...», the deleted note if any, «На главную»; no bar, no dock, no sheet | `printPage.test.ts` "nothing to print", unchanged |
| one card | 360: the crumb, the switches, one card 328 px wide, the notes, the dock; 1180: the crumb, the row, one sheet with eight blanks, the notes | case 112, `#/p/set-emberaxe ~ phone as gm2` |
| many (ten, two sheets) | «Лист 2 из 2» before the second sheet; at 360 the cards of both sheets one per row, the label between the ninth and tenth | `#/p/set-tencards as gm2`, case 112 (e) |
| at the cap (180) | twenty sheets (twelve compact); at 360, 180 cards one per row (about 82,000 px of page); one refit pass after the face | `print.js` `MAX`, S12 refit time |
| one past the cap (181 pressed) | the cap toast, unchanged (now 10000 ms by batch T's long class: 97 characters) | `app.test.ts`, unchanged |
| 3x the default | none: 180 is a render bound, not a configurable limit | - |
| the longest rules text (`voa2_a3`, 847 RU characters) and the clip fixture | the ladder from the new base; the clip box names the fixture | `print.js`, S11 |
| the longest names (`cm26`, `f60`, `hi62`, `ci81`, with ` ×99`) | at most three lines (`FEATURES.md` cap); fewer in Source Sans 3 (mock P: 4 RU names on three lines for 11) | `nameLines` in `print.js` |
| the longest source (80 code points, `set-longsrc1`) | the source wraps right-aligned in the whole width | `print.js`, the `why` |
| a no-picture record and a broken picture | the light well with the glyph (batch 1b), unchanged | `print.js` |
| 360 px | the first card top within 256 px (estimate 236-248); the dock at the bottom, one row, 40 px buttons | case 83, case 112 |
| 1180 px | the sheet top within 288 px (estimate 200-215) | case 83, case 112 |

Row order: the cards in the set's order, unchanged. The primary: from 761 px the first control under the head; up to
760 px the dock's first control. Popups at 360: «Ещё» opens up from the dock, one item (about 60 px), no keyboard
on this page. Sticky regions: the header (hides on scroll down, batch 3b) and the dock (about 61 px: 40 px button,
20 px padding, the safe-area inset), never taller than the window; under 481 px of height the dock is in the flow.

### 2. Error scenarios

- Loading: the heading and «Загружаем...», unchanged; the face loading after the sheet draws: the sheet in the
  fallback face for a moment, then refitted; «Напечатать» disabled meanwhile. Nothing stored.
- A failed read: `ErrorPage` «Набор не загрузился» with «Повторить», unchanged (reads the address again).
- A failed write: none; `/p/` writes nothing. A failed copy of the link: the existing error toast, now over the dock.
- Offline: the cached face (the service worker answers `/assets/`) or, with no cached face, the fallback face, its fit
  and its clip count; the button enables when the port settles (a failed load settles too).
- A conflict (another tab wrote first): not applicable, nothing is written; the switches are visit memory.
- A record it names was deleted: the red note «Удалены автором ...» above the sheets, unchanged.
- A stale tab (the previous bundle): prints the old card (63x88, Segoe UI, 3.5cqw) and the old bar; nothing stored
  differs, so a reload is the recovery.
- A revert (the previous frontend): the old card and bar return; `dhloot.prefs.v1` and the account's `printBw` /
  `printCompact` keep their shape; the four burden files keep the new bytes until their own revert (they are files of
  the same commit, so a revert of the commit restores them).

No stored data, key or write path changes; no data can be lost.

### 3. Consistency

Rules of `FEATURES.md`, "Consistency rules": rule 4 (one name per action: «Напечатать» on `/p/`, while the entry
controls stay «Печать», the verb that opens the sheet; the switch labels are one set on `/p/`, the editor and the
account), rule 6 (the failed read replaces the page), rule 9 (from 761 px the primary is the first control under the
head: the print bar's named departure goes; up to 760 px the primary is in the dock, the editor's pattern, named), rule
19 (the clip warning box), rule 20 (focus after «Повторить»). Siblings: the editor (the crumb, the bottom bar up to
760 px, the print view's switches), the list pages (actions into «Ещё» up to 760 px, D-head 1), the record dialog
(the sticky dock up to 760 px). Differences named: the dock's «Ещё» holds one item (the RU row has no room for the
link's label at 360); `/p/` has no pin and no help, as before (no `PageHead`; batch N leaves it); the page's sub line
sits under the sheets, unlike every `PageTitle` sub (the First-Screen Rule at 360). Load, empty and error states and
their wording are unchanged. Toasts: the link toast, unchanged text, above the dock.

### 4. RU/EN parity

Every changed string has both languages with the same facts (S9's table): the short labels, «Напечатать» / "Print",
«Цвет печати» / "Print color", «Лист %n из %m» / "Sheet %n of %m", the subtitle with the decimal comma and point, the
hint. No plural: `printSheetN` names two numbers, not a count of things; `printSub` keeps its «Карточек: %n» form. ASCII
punctuation apart from the `×` and «» the RU strings already use. The catalog measure and every browser case run in both
languages; the EN labels are American ("Color").

## First-screen rows

| Row | Before (S2) | Estimate after | Limit | Decision |
|---|---|---|---|---|
| `#/p/set-emberaxe as gm2` 360x640 | measure (today's bar: three wrapped rows, about 450-530) | 236-248 | 256 | `shipped: true`; past 256 after S12: trim the crumb row's margin and the row gap to 8 px, else name the measured value as an exception (logged, AFK) |
| `#/p/set-emberaxe as gm2` 1180x720 | measure (about 330-350) | 200-215 | 288 | `shipped: true` |
| 390x844, 768x1024 | measure | logged | 40% | case 112 (c) logs |

## Gate cost (`VITEST_MAX_WORKERS=2`, this host)

| Item | Minutes |
|---|---|
| S1 the hands (render, compare, swap) | 5 |
| S2 `build:test` and the before tops | 8 |
| S3-S9 the affected vitest files (`printPage.test.ts` alone 4-6; with `homebrewPrintPreview`, `print`, `ports`, `tables`, `accountPage`, `app`, `a11y`, `crumb`, the editor test) | 20-25 |
| both lints, Prettier, the detector, `derived`, `contracts`, `decisions.js` | 6 |
| S11 the catalog measure (four layouts, RU and EN) and the background PDFs | 12-15 |
| `build:test` and the golden re-seed of about 30-45 states, the diff read | 15-20 |
| one local `app/print` run | 8 |
| `check:built` and the bundle line | 2 |
| `rtk npm run check:fast` | 12-14 |
| S12 the screenshot set and the PDF rasters | 8-10 |
| `polish` and `harden` (orchestrator) | 5-10 |
| one CI run | 11 |
| the batch review (the Figma departures, the print figures, the product law) | 20-30 |
| one fix cycle (`check:fast` and CI) | 25 |
| the plan review before the dispatch (Q-P1's `llms.txt` line) | 30-40 |
| **Total** | **187-237** |

`plan.md` section 8 counted 75-95 min for P. The difference: the plan review (30-40), the fonts port and the crumb
extraction (their tests, 10), the per-card phone preview and cases 112-113 (15), one local `app/print` run (8), the
golden re-seed that section 8 did not count (15-20), and this host's `VITEST_MAX_WORKERS=2` timings. No split: the card
and the page share `PrintPage.svelte`, the `#/p/` seed sets, the `app/print` gate and the `/p/` goldens (`CLAUDE.md`,
"Size a batch by its gates"); a split would pay a second `check:fast`, CI run and review (about 60 min) and re-seed the
`/p/` goldens twice.

## Writer tier (facts for the orchestrator's dispatch, not a model choice)

| Test | Answer |
|---|---|
| 1 (an open design question) | no: every fork has a default (P-D1 to P-D19); Q-P1 is answered before the dispatch |
| 2 (public contract, route, stored state, product law, hook, configuration) | yes: the product law's card size (`CLAUDE.md`, Q-P1) and the `llms.txt` line; no route, stored state or hook |
| 3 (print fitting, golden re-seed, parity with a design node) | yes: the print fit at new bases and floors, about 30-45 goldens, parity with nodes `714-42387` and `3773-90792` (the hands) |

## Plan review

- Plan review: required before P (trigger: public contract change - `llms.txt`, the `/p/<id>` line, takes the card size
  63.5x88.9 mm with Q-P1; the four `card/burden-*.svg` keep their paths and take new bytes, as the share cards did).
- If Q-P1 is no, no trigger fires: then `- Plan review: not required (no trigger fired)`; the burden bytes alone change
  no contract (`CONTRACTS.md` section 5 freezes the paths).
- No migration, no `SECURITY DEFINER` function, no stored key, no write or sync protocol; no stored data can be lost.

## Risks and do-nots

- Do not change the sheet counts, the colour and black-and-white split or the browser-measured fit (product law).
- Do not copy anything from the Core Set PDF into the repository or a mock.
- Do not delete or rename a `card/*.svg`; only the four burden files take new bytes, as exported (no optimizer).
- `tests/app/print.js` pins many measured values: change each to its new measurement with the reason in the message;
  never loosen a check to pass.
- The refit must not loop: the `refit` counter changes once per sheet render; a card's `onfit` writes `clippedBy` only
  on a change (today's guard).
- `transform` on the card is screen-only (`@media screen`); print media must draw the A4 sheets at full size at every
  window width (`print.js` "print media equal at 360 and 1180").
- `fit()` divides rendered sizes by `screenScale`; with `k > 1` (the phone) the division is the same code; the half-scale
  equality test gets a 1.366 twin.
- The editor's print preview uses `scale`, not `screenScale`: it multiplies mm and pt and needs `compact` for the base;
  check it renders the same card and fit (acceptance 20).
- A `<use>` with `xlink:href` and masks in an `<img>` SVG renders in Chrome, Firefox and Safari; S1 renders it in
  Chrome; the screenshot set's PDF rasters are the print proof.

## Fold list (for the orchestrator: `plan.md`, `handoff.md`, `context.md`, the AFK file)

1. `plan.md` Status: add "Batch P refresh (2026-11-05): `plan-P.md` is batch P's brief (decisions P-D1 to P-D19, steps
   S1-S14, acceptance 1-30, the four standing checks); `mocks/P/burden/` holds the hands check (0% difference to the raw
   export)." and the line `- Plan review: required before P (trigger: public contract change - llms.txt's /p/<id> line
   takes the 63.5x88.9 mm card with Q-P1)`, replacing the Status sentence "Batch P fires no plan-review trigger" (it
   missed the `llms.txt` line) and "Batches P and 10 take their own line at their refreshes" for P.
2. `plan.md` Status: `NEEDS_HUMAN_CONFIRMATION: yes` for batch P only, Q-P1 (text in "Owner question" above).
3. `plan.md` section 7 table, row P: "Mock depends on" adds "N: `/p/` keeps no `PageHead`"; the run order line reads
   9a, 8, 9b, T, N, P, 10.
4. `plan.md` section 7, "Batch P": add "- Placed (2026-11-05): `plan-P.md`; every line above is an acceptance line
   there (1-30)." The line "The Two Breakpoints Rule takes the `/p/` card step (one card per row below 600 px)" reads
   "up to 760 px" (P-D14); section 4's table row "The Two Breakpoints Rule" already says 760.
5. `plan.md` section 8: row P reads "`plan-P.md`, 'Gate cost': 187-237 in all (with the plan review)"; the "Time left"
   paragraph replaces "P 75-95" with "P 187-237".
6. `plan.md` section 8 writer table, row P: test 2 "yes: the product law's card size (Q-P1, `CLAUDE.md`) and the
   `llms.txt` line"; plan-review column "required (llms.txt, Q-P1)".
7. `plan.md` section 15: a one-line pointer at its head, "Expanded into `plan-P.md` (2026-11-05); departures there:
   P-D4 (compact floor), P-D5 (label shortfall kept), P-D8 (mark clearance), P-D12 (the link a button from 761 px),
   P-D14 (the 760 px step)."
8. `plan.md` section 14: the batch line "print P" stays; add "Batch P (`plan-P.md`, 'First-screen rows'): the `/p/` row
   to `shipped: true`, estimate 236-248 / 200-215."
9. `handoff.md` "Next step": after N, batch P with brief `issues/57/plan-P.md`, mock `issues/57/mocks/P/`, after Q-P1
   and the plan review; cases 112 and 113.
10. `handoff.md` Deferred: the line "`KeepNote.svelte` leaves with batch P" is placed (`plan-P.md` P-D15, acceptance
    12 and 30); keep it until P ships.
11. `context.md`, "Burden hands": add "Rendered (planner, 2026-11-05, `mocks/P/burden/`): each hands file draws
    pixel-identical to its raw export above y 37 and differs from today's file on 5.0-5.8% of the pixels; the pairs stay
    unfolded (8 and 5 paths)." "Print batch answers", QP.2: add "Q-P1 (2026-11-05): the product-law write waits for the
    owner's confirmation (`plan-P.md`)."
12. `context.md`, "Mock P answers": add "RP-2 (planner default, 2026-11-05): the compact floor 3.7cqw is taken, the
    label stop at 4.5 pt is not (`plan-P.md` P-D4, P-D5)."
13. The AFK decisions file has item 22 (written by this planner).
14. `.impeccable/design.json` still says 63x88 mm: batch 10 regenerates it (no action in P).
