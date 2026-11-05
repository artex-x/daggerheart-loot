# Batch N - One head order on every page, and the d12 die marks (implement-ready)

This brief is the implementer's whole input for batch N, with the mocks `mocks/N/index-N.html` (this refresh: the d12
label, the `/tables/*` mid band, the roll head in the new order, the lit pill), `mocks/N/headorder/` (the owner's A/B
choice for 761-999 px) and `plan-nav.md` (the options, the owner's answers N1-N4 and the first mock critique). Every
choice below is the owner's answer or the recommended option; the recommended options are logged in the owner-AFK
decisions file, item 20. A mock is direction (owner, 2026-11-03): each departure is named in "Decisions". Section
numbers ("section 7") are those of `plan.md`. The repository cites no file of `issues/57/` and no file outside it.

Batch N runs after batch T and its remediation, before batch P (`plan.md` section 7). It needs 9b's `Chip` (the Check
Rule: a link chip draws no check) and T's 40 px rule up to 600 px, so it starts from T's pushed tip.

## Objective

Every page that draws a `PageHead` draws one head order (owner, 2026-11-05, N3 and N4; "The Head Order Rule"): the
heading, the pills of the sibling pages where the page has siblings, the pin, the help, the primary action at the right
end. From 1000 px that is one row; from 761 to 999 px the pills take the next row (owner, option A); up to 760 px
nothing changes. The roll pages lose the mode row above the title from 761 px and gain a visible `h1` «Бросок» /
"Roll" (owner N1), so their first content rises from 267 to 214 px at 1180; the homebrew tabs become pills with their
counts (owner N2). Owner item 12: on `/roll/alt` the round letter badges «Н» and «С» before «Кость Надежды» and
«Кость Страха» become the page's own d12 in the die's colour, with no letter. Nothing is stored, no route or contract
moves.

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a rebase). `git log
  --oneline -8` must show 9b's and T's commits; if T is not committed, stop and say so.
- Read the shipped `PageHead.svelte`, `RollPage.svelte`, `ModeRow.svelte`, `Shell.svelte` (the `ModeRow` block
  only), `TableNav.svelte`, `TablesPage.svelte` (the head block), `HomebrewTabs.svelte`, `HomebrewPage.svelte` (the head
  block and `.headx`/`.headnew`), `Chip.svelte` (9b's), `AltPanel.svelte`, `Die.svelte`, `ListsPage.svelte` (`.headx`),
  `SearchPage.svelte` (its `PageHead` call). A line of this brief that no longer matches the code is the implementer's
  to adapt; `handoff.md` names the change.
- Case numbers: 110 (the head order) and 111 (the die marks), after batch T's 108 and 109 (`plan-T.md`). If T took
  other numbers, use the next two free `states.js` numbers; `handoff.md` names the ones taken.
- Host: memory-starved. Run vitest with `VITEST_MAX_WORKERS=2`, one file at a time, and no browser suite in parallel
  with vitest.
- Impeccable cannot run from a subagent. The orchestrator runs `critique` on `mocks/N/index-N.html` before the
  dispatch and `polish` and `harden` after S9 on `/roll/alt`, `/tables/eq_weapon` and `#/homebrew` from the built app
  at 360, 768, 1000 and 1180 px; fallback `impeccable:impeccable-finish-reviewer`.
- Steps are S1 to S12. The line "Session end partial progress" in `handoff.md` names the last finished step.

## Decisions of this refresh

| # | Decision | Reason and trade-off |
|---|---|---|
| N-D1 | **The mechanism.** `PageHead` gains three optional props: `nav?: Snippet` (the sibling pills), `navBelow?: boolean` (the page passes `app.band === 'mid'`) and `below?: Snippet` (the third level under the head). DOM inside `.page-head`, from 1000 px: `h1`, `.headnav` (nav), pin, help, `extra`. From 761 to 999 px: `h1`, pin, help, `extra`, `.headnav.below` (nav, `flex: 1 0 100%`). `below` draws after `.page-head`, in `<div class="page-below">`. `extra` keeps its meaning for `/lists` (the primary at the right end): the caller's own box takes `margin-left: auto`, as `ListsPage`'s `.headx` already does, so `/lists` and `/search` draw byte-identical DOM. From 1000 px a head with a nav takes `flex-wrap: nowrap`; `.headnav` is `flex: 0 1 auto` with the default `min-width` (its widest pill), so where the row is short the pills wrap inside their own box (the catalog's chips at 1000 px RU, as today) and nothing moves to a second row. | The DOM order equals the reading order in each band (WCAG 1.3.2, 2.4.3), which was the reason for option A. Measured: with `flex-wrap` left on, the catalog's help drops to its own row at 1000 px RU (`mocks/N/tables-mid/tables-wide.json`: head 129 px, first content 286); the shrinking box keeps today's 288. `below` sits outside `.page-head` because a `flex-basis: 100%` item cannot wrap in a `nowrap` row. |
| N-D2 | **Roll.** The roll `h1` reads `t.jobRoll` («Бросок» / "Roll") at every width (visually hidden up to 760 px, as today); `RollPage` loses its `title` prop and its three callers (`StdPanel`, `AltPanel`, `RollPanel`) stop passing it. From 761 px `RollPage` passes `nav` = `<ModeRow {app} inhead />` and `navBelow={app.band === 'mid'}`; `Shell` draws `ModeRow` above `main` only while `app.band === 'narrow'`. `ModeRow` gains `inhead?: boolean`: no bottom border, no `--wrap` width, no padding, `flex-wrap: wrap` on `.modes-in`. The document title keeps the mode's name. | Owner N1 ("where have we lost the page header?") and the wording of `plan-nav.md` section 3 (no new string). One heading text at every width: a band change does not rename the page for a screen reader. Measured on the nine pages (`mocks/N/roll-head/roll-head.json`): one row from 1000 px in RU and EN with the pin pressed or not; the least room left is 14 px (1000 px, RU, `/roll/community` lit, pin pressed); the pill row's left edge is one value per language on all nine pages (100 px RU, 65 px EN). |
| N-D3 | **Tables.** `TableNav` gains `part?: 'groups' \| 'tabs'` (ignored up to 760 px, where the one instance draws the picker as today). `part="groups"` draws `<nav class="tablenav" aria-label={t.tables}>` with the `.groups` chips; `part="tabs"` draws the `.tabslot` (the current group's tabs and the hidden ghosts; the source fold of `/tables/homebrew` lives there). `TablesPage` from 761 px: `<PageHead ... nav={groups} navBelow={band === 'mid'} below={tabs} />`. The `.inhead` `display: contents` rule and the `.below` rule go. The level 3 tabs keep `role="group"` named by the group, after the navigation landmark instead of inside it. | The rule puts the pin and the help between the chips and the tabs, so one `nav` element cannot hold both levels. One `nav` landmark per head, as on the roll and homebrew heads; the tabs keep their group name. Trade-off: a landmark jump to «Таблицы» reaches the chips, and the tabs follow in reading order. Measured in the new order (`tables-wide.json`): 244 px from 1050 px RU and from 1000 px EN, unchanged; the chips' left edge one value per language on every table. |
| N-D4 | **Homebrew (owner N2).** From 761 px `HomebrewTabs` draws its four links as `Chip href` pills with their counts in a `.pills` row (`gap: 7px`, the `.groups` gap), inside the existing `nav` «Мои предметы»; up to 760 px the picker and its sheet do not change. `Chip`'s link form gains `count?: number`: `{label}{' '}<span class="n">{count}</span>`, the count in `--muted2` at weight 500 with tabular figures, and in Ink on Gold on the lit pill (The Ink Rule). The accessible name stays «Предметы 44», as today's tab. `HomebrewPage` from 761 px: `nav` = the pills when ready, `extra` = «Новый предмет» on the Items tab when ready (the existing `.headnew`, `margin-left: auto`), `navBelow={band === 'mid'}`; `wideHead` and `.headx` go. | The count is part of the pill's name today; a `Chip` prop is the second use of the link chip, not a new component. The 9b Check Rule draws no check on a link chip. Not measured on production: `/homebrew` needs a sign-in there, and the "homebrew" cells of `headorder/` were drawn on `/roll/alt` with stand-in labels (`index-N.html`, section 4). S1 draws and measures it on the built app first. |
| N-D5 | **`/tables/*` from 761 to 999 px: a named exception, not a fix** (owner AFK default). The head order changes nothing in this band (today's head is already h1, pin, help, then the chips, then the tabs), so the first content stays at 334 px (RU and EN, every table, `tables-mid/tables-mid.json`): 33% of a 768x1024 tablet (limit 410) and 46% of a 900x720 window (limit 288). DESIGN.md "The First-Screen Rule" names it; case 110 holds it as a ceiling of 336 px at 900x720. | The cause is the reserved tab row: 43 px of empty slot on six of seven groups, kept so that the head does not jump between tables (A steady head). Every fix measured costs more than it gives: one reserved line with a sideways-scrolling tab row is 291 px (still over), 287 px with 4+4 px of trimmed gaps (1 px under the limit, 17 over the 270 px aim) and hides 2 of 7 supplement tabs at 768 px and 1 at 900 px behind a cut label (against 9b's Whole Message Rule, and a mouse user needs Shift+wheel); no reservation in this band is 291 px on six groups and 334 on «Дополнения», and the head jumps 43 px. Fallback if the owner rejects the exception: `scrollTrim` of the mock (`TableNav` from 761 to 999 px: `.tabs { flex-wrap: nowrap; overflow-x: auto; margin-top: 6px }`, `.searchrow` 4 px higher, the current tab scrolled into view on mount) with its costs named in DESIGN.md. |
| N-D6 | **One row from 1000 px holds.** No threshold moves. If CI's fonts break the row of `/roll/community` RU with the pin pressed at 1000 px (case 110 (c)), the remediation sets the head's gap to 8 px from 1000 px (8 px back on four gaps), not a new breakpoint. | Measured 14 px of room in the worst state; the font stack on CI (Source Sans 3, self-hosted) is the same face, so the risk is small. |
| N-D7 | **The lit pill keeps the gold fill and draws no check** (critique N-3 and N-4). | The Seal Rule gives the current place a gold fill; 9b's Check Rule names the sibling pills as link chips (a place, not a press). The mock of the Toggle look (`roll-head/roll-{alt,mwt}__1180__ru__lit-toggle.png`) loses the place more than it helps the primary: the 46 px gradient primary already outweighs a 32 px pill. A Toggle look would be a third gold treatment in "Chips" and would move every catalog chip too. |
| N-D8 | **Gaps from 761 to 999 px** (critique N-5): the title row to the pills is the head's row gap, 10 px; the pills to the lead is 12 px (`.page-head.navbelow + .page-sub { margin-top: 8px }`, over the head's 4 px margin). A page with no lead (`/tables/*`) keeps today's spacing to its `below` and search row. | Measured with these values: roll first content 264 px at 768x1024 and 900x720 (267 today), the gaps 10 and 12. |
| N-D9 | **Focus across the 1000 px step.** A resize across 1000 px moves the nav from one place in the DOM to the other and remounts it. `PageHead` keeps the focus: before the move (`$effect.pre` on `navBelow`), the index of the focused element among `.headnav a, .headnav button`; after it (`tick`), the same index is focused. | A keyboard user who resizes loses no place; about 15 lines and one unit test. Today the roll head cannot lose a pill's focus this way, because the mode row is outside the page. |
| N-D10 | **Owner item 12, the die marks.** In `AltPanel` each `.dv` box holds `<Die faces={12} />` (the page's own d12, lines only, 17x18 px, the `Die` component unchanged) and no letter; `.dv` loses its ring, radius, size and type rules; `.dv.h` keeps `color: var(--hope)`, `.dv.f` `color: var(--fear)`; the box keeps `aria-hidden="true"`. The visible word stays text, so a reader hears «Кость Надежды» and the fields keep their names («Кость Надежды: Результат броска»). `hopeLetter` and `fearLetter` leave `dict.ts` in both languages (no other reader). The colour conflict: the owner's hint was "gold and violet"; Seal Gold (`--gold`) stays out, because the mark is not a choice (The Seal Rule). The amber is Hope Amber (`--hope`), the token the DESIGN.md "Tertiary" rule already gives the Hope die's badge and focus glow, and the violet is Fear Violet (`--fear`). "A die is plain" (The Seal Rule, `hues.js`) covers a die button, an action; a die mark in a label is not a button, so DESIGN.md says so in one clause. | Mock `mocks/N/d12/` at 360 and 1180 px, RU and EN: the label row is 21 px instead of 22 px, nothing else moves. The alternative with a 22% fill of the hue reads more "coloured" but gives `Die` a fill its rule refuses ("lines only"): the fallback if the owner finds the line die too faint. An `aria-label` is not added: the word is already the label's text, and a second hidden name would repeat it. |
| N-D11 | **The First-Screen Rule from 761 to 999 px.** Case 110 measures every family at 768x1024 and 900x720 and asserts 40% of the height (410 and 288 px), with the `/tables/*` exception at 900x720 (N-D5). `FIRST_SCREEN` keeps its two sizes. | The owner judged the 761-999 band against the rule ("over the limit in every option"), so the band gets an assertion; a ceiling stops the exception from growing. |
| N-D12 | **New states** for the band that now has its own DOM order: `#/roll/alt ~ mid band` and `#/homebrew ~ mid band as gm3` (`width: 768`, height 1024), unless an existing state already opens these routes at 761-999 px (search `inventory.js` for `768`). Each gets its RU and EN golden and an axe case. | "A new state gets a `tests/app/inventory.js` entry and a re-seeded golden" (`CLAUDE.md`). `/tables/*` in this band keeps today's DOM order, so it needs no new state. |

## Owner questions (none open)

The owner answered N1-N4 and the 761-999 px form (option A) in chat on 2026-11-05. The open points were decided as AFK
defaults (decisions file, item 20): N-D5 (the `/tables/*` exception), N-D7 (the fill), N-D10 (lines, Hope Amber and
Fear Violet), N-D2 (the roll `h1` «Бросок» at every width), N-D4 (the count as a `Chip` prop).

## Placed items (each is its own acceptance line below)

- `plan-nav.md` section 7, acceptance 1-11 (rewritten here as acceptance 1-11 with the measured figures).
- `context.md` item 11, ANSWER: option A for 761-999 px; the `/tables/*` fix or exception (N-D5, acceptance 13).
- `context.md` item 12: the d12 die marks (N-D10, acceptance 14).
- The mock critique of 2026-11-05, `plan-nav.md` section 6: N-1 (by construction, acceptance 4), N-2 (S1, acceptance
  5), N-3 and N-4 (N-D7, acceptance 3 and 10), N-5 (N-D8, acceptance 3), N-6 (measured, N-D6), N-7 and the «ИЛИ»
  dividers (acceptance 11).
- This refresh's correction: the "homebrew" cells of `headorder/` are roll-page offsets (acceptance 5).

## In scope

- Changed: `PageHead`, `RollPage`, `ModeRow`, `Shell`, `StdPanel`, `AltPanel`, `RollPanel`, `TableNav`, `TablesPage`,
  `HomebrewTabs`, `HomebrewPage`, `Chip`, `lib/dict.ts` (two keys removed).
- Tests: `pageHead.test.ts` (new), `rollPage.test.ts`, `alt.test.ts`, `modeRow.test.ts`, `shell.test.ts`,
  `tableNav.test.ts`, `tables.test.ts`, `homebrewTabs.test.ts`, `homebrewPage.test.ts`, `chip.test.ts`,
  `a11y.test.ts` (the map's lines for the changed files), `tests/app/states.js` (cases 110 and 111, case 96's
  selectors, the homebrew tab check at 761 px), `tests/app/sweep.js` (`headHeight`), `tests/app/inventory.js` (two
  states), the goldens.
- Prose: DESIGN.md, FEATURES.md, COVERAGE.md (texts below).

## Out of scope

- Up to 760 px: every layout (the mode row, the pickers, «Ещё»); only the hidden roll `h1`'s text changes.
- `/lists`, `/search`, the list page, `/s/`, the account, the editor, print and the error pages: they already follow
  the rule or draw no `PageHead` (`plan-nav.md` section 4). Their goldens must come out byte-identical.
- The copy of the `/roll/mwt` lead and «корника», and the «ИЛИ» dividers' gold (Deferred, acceptance 11).
- `ROUTES.md`, `CONTRACTS.md`, `routes.json`, `llms.txt`, the store, the cloud port, the server.

## Facts read from the code (`340fa727`, 2026-11-05)

1. `PageHead` draws `.page-head` (flex, `gap: 10px`, `flex-wrap: wrap`, `margin-bottom: 4px`): `h1.page-h`, the pin
   (`.homebtn`, when `pin`), `HelpButton` (`.helpbtn`, when `help`), then `extra`; then `.page-sub` and the `HelpBox`.
2. `RollPage` draws `<h1 class="vh">{title}</h1>` up to 760 px and `<PageHead {app} {title} {sub} {help} />` from 761
   px; its callers pass `title={t.pageStd}`, `t.pageAlt` or the supplement's name.
3. `Shell` draws `{#if modeOf(app.section)}<ModeRow {app} />{/if}` between the header and `main`, at every width.
   `ModeRow`'s `.modes` has a bottom border, `.modes-in` takes `var(--wrap)` and `padding: 10px 0`. The lit control is
   `.mode.on` (gold fill), `aria-current="page"`, `data-section`. `tests/app/contracts.js` reads `nav.modes
   [aria-current="page"]`.
4. `TablesPage` from 761 px: `<PageHead {app} title={t.tables} sub="" {help} {home} extra={nav} />`, `nav` being one
   `TableNav`; `TableNav` is `.inhead` (`display: contents`) from 1000 px and `.below` (`flex: 1 0 100%`) from 761 to
   999 px. Case 96 reads `.page-head .groups`, `.page-head .tabslot`, `.searchrow`, `.rowscol`; `sweep.js`'s
   `headHeight` reads `.tablenav > .groups` and `.tablenav > .tabslot`.
5. `HomebrewPage` from 761 px: `<PageHead ... help={null} home={HOMEBREW_HASH} pin={ready} extra={wideHead} />`;
   `wideHead` is `.headx` holding `HomebrewTabs` (links `.tab` with `.n` counts, `white-space: nowrap`) and, on the
   Items tab, `.headnew` (`margin-left: auto`). `states.js` reads `.hbtabs .tab` at 761 px.
6. `ListsPage`'s `extra` is `.headx` with `margin-left: auto`; `listsPage.test.ts` checks its last child is the
   primary. `SearchPage` passes no `extra`.
7. `AltPanel`'s `.dielbl` holds `<span class="dv h" aria-hidden="true">{t.hopeLetter}</span>{t.hopeDie}` (and the
   Fear pair); `.dv` is a 22 px ring in `currentcolor`, `.dv.h` `var(--hope)`, `.dv.f` `var(--fear)`.
   `alt.test.ts` checks the two label texts and the letters «Н», «С». `Die faces={12}` is the roll button's die:
   `svg.dieicon`, lines only, `stroke: currentColor`, `aria-hidden`, 18 px tall.
8. Goldens (`tests/app/snapshots`, taken at 1100 px unless a state sets a width): `_roll*` 41 files (40 hold the
   mode row's navigation), `_tables*` 70 (63 hold the pin), `_homebrew*` 78 (43 hold the pin).

## Measured on production (2026-11-05, `https://daggerheart-loot.pages.dev`, DOM moves; `mocks/N/`)

| Family | 360x640 | 768x1024 | 900x720 | 1000x720 | 1180x720 | Source |
|---|---|---|---|---|---|---|
| Roll, nine pages (first content) | unchanged: 323 `/roll/std`, 251 the others | 267 to 264 | 267 to 264 | 267 to 214 | 267 to 214 | `roll-head/roll-head.json` |
| Roll, room left in the one row | - | - | - | RU 27 (pin off), 14 (pin on, `/roll/community`); EN 214 | RU 207 / 194; EN 399 / 394 | same |
| `/tables/*` | unchanged: 234 | 334 (today and after; limit 410) | 334 (limit 288: the named exception) | RU 288, EN 244 (chips wrap in their box in RU) | 244 | `tables-mid/tables-today.json`, `tables-wide.json` |
| `/homebrew` (built app, S1) | 243 today | 301 today | - | 301 RU today | 254 today | `plan-nav.md` section 1 |
| d12 label row (`/roll/alt`) | 22 to 21 px | - | - | - | 22 to 21 px | `d12/d12-label.json` |

## Files expected

| Step | Files |
|---|---|
| S1 | `issues/57/mocks/N/built/homebrew-head.cjs`, its PNGs and JSON |
| S2 | `app/src/components/PageHead.svelte`, `pageHead.test.ts` (new) |
| S3 | `ModeRow.svelte`, `Shell.svelte`, `RollPage.svelte`, `StdPanel.svelte`, `AltPanel.svelte`, `RollPanel.svelte`, `modeRow.test.ts`, `rollPage.test.ts`, `shell.test.ts`, `alt.test.ts` |
| S4 | `TableNav.svelte`, `TablesPage.svelte`, `tableNav.test.ts`, `tables.test.ts` |
| S5 | `Chip.svelte`, `HomebrewTabs.svelte`, `HomebrewPage.svelte`, `chip.test.ts`, `homebrewTabs.test.ts`, `homebrewPage.test.ts` |
| S6 | `AltPanel.svelte`, `lib/dict.ts`, `alt.test.ts` |
| S7 | `a11y.test.ts` |
| S8 | `tests/app/states.js`, `tests/app/sweep.js`, `tests/app/inventory.js` |
| S9 | `tests/app/snapshots/*` (re-seeded, never edited) |
| S10 | `DESIGN.md`, `docs/specs/FEATURES.md`, `docs/specs/COVERAGE.md` |
| S11 | `issues/57/mocks/N/built/` |

## Steps

### S1. Draw and measure the homebrew head first (critique N-2)

1. `npm run build:test` from the merged tip. Copy `issues/57/mocks/N/navprobe-homebrew.cjs` to
   `issues/57/mocks/N/built/homebrew-head.cjs` and change it to open `#/homebrew as gm3` (ready, the Items tab) and
   move the DOM into the rule's order: the four `.hbtabs .tab` links restyled as the catalog chips (inject the
   computed style of `.tablenav .chip` from `#/tables/eq_weapon`, or copy its CSS values from `Chip.svelte`), with the
   count in a `.n` span, placed after the `h1`; then the pin; then `.headnew` at the right end. From 761 to 999 px the
   pills go after `.headnew` as their own row (`flex: 1 0 100%`).
2. Measure the first content (`[data-primary]`) and the head's rows at 768x1024, 900x720, 1000x720, 1050x720,
   1180x720 and 1920x1080, RU and EN, the pin pressed and not; once more at 1000x720 RU with the counts set to the 3x
   figures («Предметы 300», «Источники 60», «Комплекты 300», «Карты правил 300») by text injection. Shots at 768, 1000,
   1180 and 1920 px, RU and EN, into `mocks/N/built/`.
3. Stop condition: if the first content at 1180x720 passes 288 px in either language, stop and name the figure to
   the orchestrator. At 1000 px RU the pills may wrap inside their box (N-D1); log the figure.
4. Write the figures into `handoff.md` ("Measured at S1").

### S2. `PageHead` (N-D1, N-D8, N-D9)

1. Props: `nav?: Snippet | undefined` ("the sibling pages' pills, drawn after the heading"), `navBelow?: boolean`
   ("from 761 to 999 px the pills take the next row, after the primary"), `below?: Snippet | undefined` ("the third
   level, under the head"). Rewrite `extra`'s doc comment: "The page's primary actions; the caller's box takes
   `margin-left: auto`, so they end the row".
2. Markup inside `.page-head` (classes `hasnav` when `nav`, `navbelow` when `nav && navBelow`): `h1`; `{#if nav &&
   !navBelow}<div class="headnav">{@render nav()}</div>{/if}`; the pin; the help; `{@render extra?.()}`; `{#if nav &&
   navBelow}<div class="headnav below">{@render nav()}</div>{/if}`. After `.page-head`: `{#if below}<div
   class="page-below">{@render below()}</div>{/if}`, then `.page-sub` and the `HelpBox` as today.
3. CSS: `.page-head.hasnav:not(.navbelow) { flex-wrap: nowrap; }`; `.headnav { flex: 0 1 auto; }`; `.headnav.below {
   flex: 1 0 100%; }`; `.page-below { margin-top: 6px; }` (the head's 4 px margin plus 6 is today's 10 px row gap);
   `.page-head.navbelow + .page-sub { margin-top: 8px; }`. `h1`, the pin and the help take `flex: none`.
4. N-D9: `let row: HTMLDivElement | undefined` bound to `.page-head`; `$effect.pre` reading `navBelow` stores the index
   of `document.activeElement` among `row.querySelectorAll('.headnav a, .headnav button')` (or `-1`); an `$effect`
   reading `navBelow` focuses that index after `tick()` when it is not `-1`. One comment line: why (the nav remounts
   across 1000 px).
5. `pageHead.test.ts` (new): the DOM order with `nav` and without `navBelow` (`h1`, nav content, pin, help, extra, by
   `compareDocumentPosition`); with `navBelow` (`h1`, pin, help, extra, nav); `below` after `.page-head`; no `.headnav`
   without `nav`; a focused nav link keeps the focus when `navBelow` flips; the lead's margin with `navBelow`; end with
   `expectNoA11yViolations`.

### S3. Roll: the heading and the pills in the head (N-D2)

1. `ModeRow`: `const { app, inhead = false }: { app: AppState; inhead?: boolean } = $props();`; `class:inhead` on
   `nav.modes`; CSS `.modes.inhead { border-bottom: 0; }`, `.inhead .modes-in { width: auto; margin: 0; padding: 0;
   flex-wrap: wrap; }`. The 600 px block is unchanged (an `inhead` row never draws at 600 px).
2. `Shell`: `{#if modeOf(app.section) && app.band === 'narrow'}<ModeRow {app} />{/if}`.
3. `RollPage`: drop the `title` prop (and its doc line); up to 760 px `<h1 class="vh">{t.jobRoll}</h1>`; from 761 px
   `<PageHead {app} title={t.jobRoll} {sub} {help} nav={modes} navBelow={app.band === 'mid'} />` with `{#snippet
   modes()}<ModeRow {app} inhead />{/snippet}`. Update the file's head comment ("From 761 px: the head with the mode
   pills").
4. `StdPanel`, `AltPanel`, `RollPanel`: remove `title={...}` from the `RollPage` call. `git grep -n "pageStd\|pageAlt"`
   must still find the keys in `ModeRow` and the document title code: they stay.
5. Tests: `rollPage.test.ts` "the heading": the `h1` reads «Бросок» / "Roll" in both bands, `vh` up to 760 px,
   `page-h` from 761 px; from 761 px the head holds `nav.modes` after the `h1` and before the pin; up to 760 px no
   `nav.modes` inside `main`. `alt.test.ts` 276 and 311: the `h1` is «Бросок» / "Roll" (the mode name moves to the lit
   pill's assertion). `modeRow.test.ts`: `inhead` draws no border class and the same three controls. `shell.test.ts`:
   the mode row is above `main` at the narrow band only.

### S4. Tables: chips in the head, tabs under it (N-D3)

1. `TableNav`: `part?: 'groups' | 'tabs'` with a doc comment. Up to 760 px the component draws the picker as today
   (no `part`). From 761 px: `part === 'groups'` draws `<nav class="tablenav" aria-label={t.tables}><div class="groups"
   role="group" aria-label={t.groupLabel}>...chips...</div></nav>`; `part === 'tabs'` draws the `.tabslot` with
   `{@render tabs(group, null)}` and the `.ghosts`. Delete the `.inhead` and `.below` rules and the classes; set
   `.tabslot > .tabs, .ghosts > .tabs { margin-top: 0; }` (the sheet's tabs keep 10 px). Update the head comment.
2. `TablesPage` from 761 px: `{#snippet groupsNav()}<TableNav ... part="groups" />{/snippet}`, `{#snippet
   tabsRow()}<TableNav ... part="tabs" />{/snippet}`, `<PageHead {app} title={t.tables} sub="" {help} {home}
   nav={groupsNav} navBelow={band === 'mid'} below={tabsRow} />`. The narrow block keeps its one `TableNav`.
3. Check by eye at 768, 1000, 1050 and 1180 px, RU and EN, that the title row, the chips, the tab row, the search row
   and the rows start where they do today (case 96 proves it in S8).
4. Tests: `tableNav.test.ts` (each part alone; the source fold inside `tabs`; one `navigation` landmark), `tables.test.ts`
   (the head order from 761 px: `h1`, the chips' nav, the pin, the help, then the tab group after `.page-head`).

### S5. Homebrew: pills with counts (N-D4)

1. `Chip`, link form only: `count?: number | undefined` in `Base` (doc: "A count after the label, as the homebrew
   pills draw it"); markup `{label}{#if count !== undefined}{' '}<span class="n">{count}</span>{/if}`; CSS `.chip .n {
   font-weight: 500; font-variant-numeric: tabular-nums; color: var(--muted2); } .chip.on .n { color: inherit; }`.
2. `HomebrewTabs` from 761 px: `<div class="pills">{#each TABS as x (x)}<Chip label={labels[x]} count={counts[x]}
   on={x === tab} href={app.href(homebrewTabHash(x))} />{/each}</div>` inside the existing `nav.hbtabs`; `.pills {
   display: flex; flex-wrap: wrap; gap: 7px; }`. The `links` snippet stays for the sheet only; delete the `.tabs` rule
   and the wide `.tab` rules no reader keeps (the sheet's `.sheetlinks .tab` stays). Update the head comment.
3. `HomebrewPage`: replace `wideHead` with `{#snippet hbNav()}<HomebrewTabs {app} {tab} {counts} limitText={count}
   />{/snippet}` and `{#snippet hbNew()}<span class="headnew">{@render newItem(true)}</span>{/snippet}`;
   `<PageHead ... nav={ready ? hbNav : undefined} navBelow={band === 'mid'} extra={ready && tab === 'items' ? hbNew :
   undefined} />`. Delete `.headx`.
4. Tests: `chip.test.ts` (the count's text and the accessible name «Предметы 44»; no check on the link form),
   `homebrewTabs.test.ts` (four link chips with counts from 761 px, `aria-current` on one, the picker up to 760 px),
   `homebrewPage.test.ts` (the head order: `h1`, the pills, the pin, «Новый предмет» last; no pills and no pin while
   loading).

### S6. The d12 die marks (N-D10, owner item 12)

1. `AltPanel`: `<span class="dv h" aria-hidden="true"><Die faces={12} /></span>{t.hopeDie}` and the Fear pair (`Die`
   is already imported). CSS: `.dv { display: inline-flex; flex: none; }`, `.dv.h { color: var(--hope); }`, `.dv.f {
   color: var(--fear); }`; the width, height, border, radius and type lines go. Rewrite the comment above the blocks:
   "The die's own mark and its word name it; the hue alone does not."
2. `lib/dict.ts`: delete `hopeLetter` and `fearLetter` in both languages (`git grep -n "hopeLetter\|fearLetter"` finds
   no other reader).
3. `alt.test.ts` 169-174: each `.dv` holds one `svg.dieicon` and no text; the `.dielbl` texts are «Кость Надежды» and
   «Кость Страха»; the number fields keep their names.

### S7. `a11y.test.ts`

Update the map's lines for `PageHead.svelte` (now `pageHead.test.ts` too), `ModeRow.svelte` (`inhead`),
`TableNav.svelte` (the two parts), `HomebrewTabs.svelte` (the pills), `Chip.svelte` (the count).

### S8. Browser suites and states

1. **Case 110, the head order** (`plan-nav.md` section 8, with this refresh's figures). One context per route and
   language; `page.setViewport` per size in the order 1180x720, 1000x720, 900x720, 768x1024, 360x640. Routes:
   `#/roll/std`, `#/roll/alt`, `#/roll/community`, `#/roll/mwt`, `#/tables/eq_weapon`, `#/tables/wondrous`, `#/homebrew
   as gm3`, `#/lists as gm4`, `#/search`. At 1000 and 1180 px on the roll, tables and homebrew routes the steps run
   twice: the pin not pressed, then pressed. Steps:
   (a) Find `main h1`, `.page-head .headnav` (none on `/lists` and `/search`), `.page-head .homebtn`, `.page-head
   .helpbtn` (none on `/homebrew`), the primary in the head (`.page-head .btn.primary`: «Новый предмет», «Новый
   список»; none on the others).
   (b) DOM order by `compareDocumentPosition`: from 1000 px `h1`, nav, pin, help, primary; from 761 to 999 px `h1`, pin,
   help, primary, nav; `/lists`: `h1`, pin, import, primary; `/search`: `h1`, pin.
   (c) Reading order equals DOM order: the elements grouped into rows by their vertical centers (within 8 px), then by
   `left`. From 1000 px every element of the head is in one row; from 761 to 999 px the nav is alone in the row under
   the others.
   (d) The primary's right edge is within 16 px of `main`'s content box at 1180 and 768 px.
   (e) First content (`[data-primary]`, the same read as case 83), logged at every size; asserted at 768x1024 at most
   410 px, at 900x720 and 1180x720 at most 288 px except `/tables/*` at 900x720 at most 336 px (N-D5).
   (f) The `h1`'s text: «Бросок» / "Roll" on the roll routes, «Таблицы» / "Tables", «Мои предметы» / "My items"; at
   360 px it is visually hidden (a box of 1 px or less) on those three families and still in the DOM.
   (g) The pill row holds still: per language and size, the nav's `left` and `top` are equal within 1 px on the four
   roll routes; the document title of each roll route starts with its mode's name.
   (h) No lit pill draws a check (`.headnav .on svg` holds only the supplements chevron; match the check icon's markup
   from `Icon.svelte`).
   (i) From 761 to 999 px on `/roll/alt`: the gap from the pills' bottom to the lead's top is at least the gap from the
   title row's bottom to the pills' top.
   The case fails on a pin before the pills, a primary that is not last, and a reading order that differs from the DOM
   order. Its comment cites DESIGN.md "The Head Order Rule".
2. **Case 111, the die marks** (item 12): `#/roll/alt` at 360x640 (open «Настроить» / "Set up") and 1180x720, RU and
   EN: two `.dielbl`; each holds exactly one `svg.dieicon` inside an `aria-hidden="true"` box with no text node; the
   label's text is the die's word; the svg's computed `color` equals the computed colour of a probe set to `var(--hope)`
   (Hope) or `var(--fear)` (Fear) and differs from `var(--gold)`'s; the svg's vertical center is within 1 px of the
   label's; the Hope field's accessible name is «Кость Надежды: Результат броска» / "Hope Die: Roll result".
3. Case 96: `tabs: y('.page-below .tabslot') ?? y('.page-head .tabs')`; the other reads stay. Its figures must equal
   today's (the head holds still is the proof that S4 moved nothing).
4. `states.js` near line 5297 (the homebrew tabs at 761 px): read `.hbtabs .chip` instead of `.hbtabs .tab`.
5. `sweep.js` `headHeight`: from 761 px measure from the top of `.tablenav .groups` to the bottom of `.page-below
   .tabslot` (both by `document.querySelector`); rewrite its doc comment; the caps stay.
6. `inventory.js`: the two states of N-D12 with `why` lines.
7. Run: `node tests/run-all.js app/states` (or the cases 83, 96, 97, 110, 111 alone through the loader of case 83),
   `node tests/app/sweep.js 768`, `node tests/app/sweep.js 1180`; Bash timeout 600000 each.

### S9. Goldens

`npm run build:test`, then `node tests/app/golden.js --shard=n/4 --update` for n = 1 to 4 (Bash timeout 600000 each).
Expected to move: every `_roll*` file (the `h1` text at every width; from 761 px the mode row's navigation inside
`main`), the `_tables*` files that draw the wide head (the chips' landmark before the pin, the tabs after the help),
the `_homebrew*` files that draw the ready wide head (the pills before the pin), and the two new states: about
140-150 files. Byte-identical: every `_lists*`, `_search*`, `_s_*`, `_account*`, `_i_*`, `_h_*` and `_p_*` file, and
every state at 360 px outside the roll family. A golden is re-seeded, never edited; `handoff.md` names the count and
any file outside the expected set, with its reason.

### S10. Prose, in the same commit

The texts are in "DESIGN.md and FEATURES.md text this batch writes" below. COVERAGE.md: cases 110 and 111 (what each
proves), case 96's and `sweep.js`'s new reads, `pageHead.test.ts`.

### S11. Evidence

`issues/57/mocks/N/built/shoot.js` from `mocks/8/built/shoot.js`: `/roll/std`, `/roll/alt`, `/roll/mwt`,
`/tables/eq_weapon`, `/tables/wondrous`, `#/homebrew as gm3`, `#/lists as gm4` and `#/search` at 360, 768, 1000, 1180
and 1920 px, RU and EN; `/roll/alt` with the settings open at 360 px.

### S12. Gates and commit

`rtk npm run check:fast` (Bash timeout 600000), `npm run check:built`; one commit `feat(57): one head order on every
page and the die marks (batch N)` with the reason and the effect in the body; push; CI's green run of the tip is the
full gate.

## Acceptance criteria

1. From 761 px the nine roll pages, `/tables/*` and `/homebrew` draw a visible `h1` first in the head: «Бросок» /
   "Roll", «Таблицы» / "Tables", «Мои предметы» / "My items"; up to 760 px it is visually hidden with the same text and
   the mode row or the picker names the page; a roll page's document title names its mode (case 110 (f), (g)).
2. The Head Order Rule: on every `PageHead` page the DOM order is `h1`, pills (where the page has siblings), pin, help,
   primary from 1000 px, and `h1`, pin, help, primary, pills from 761 to 999 px; the primary ends within 16 px of the
   column's right edge; the level 3 tabs follow the head (case 110 (a)-(d)).
3. From 1000 px the head is one row on all nine roll pages, RU and EN, the pin pressed or not (14 px of room measured
   at 1000 px RU); from 761 to 999 px the pills take the next row at one height in RU and EN; the pills-to-lead gap is
   at least the title-to-pills gap (12 and 10 px); no lit pill draws a check (case 110 (c), (h), (i)).
4. A switch between roll modes moves neither the `h1` nor the pill row (left and top within 1 px); one `RollPage`
   instance stays mounted; the chips of `/tables/*` and the pills of `/homebrew` keep their left edge across tables and
   tabs (case 110 (g), case 96).
5. `/homebrew` draws its four tabs as pills with their counts from 761 px, then the pin, then «Новый предмет» last;
   up to 760 px the picker row is unchanged; S1's figures are in `handoff.md`, and its first content at 1180x720 is at
   most 288 px in RU and EN. `handoff.md` notes that the "homebrew" cells of `headorder/` were roll-page offsets.
6. `FIRST_SCREEN` and `ROLL_FIT` pass: the roll rows at 1180x720 near 214 px (267 before), `/tables/eq_weapon` 244,
   `#/homebrew as gm3` 254 or less; the 360x640 rows unchanged. The 1000x720 and 768x1024 figures are logged in
   `handoff.md`.
7. Case 110 passes on every route family; the case 110 figures are in `handoff.md`.
8. The goldens of the moved states are re-seeded (the count in `handoff.md`); the `/lists` and `/search` goldens are
   byte-identical; the two new states (N-D12) have RU and EN goldens and an axe case.
9. RU/EN parity: no new string; `hopeLetter` and `fearLetter` are gone in both languages; a roll page's `h1` is
   `jobRoll`; `pageStd`, `pageAlt` and the supplement names stay (the pills and the title read them).
10. The lit pill keeps the gold fill (N-D7); DESIGN.md "Chips" names the sibling pills, the fill and no check.
11. `handoff.md` Deferred carries three rows for batch 10: the `/roll/mwt` lead (an instruction sentence; the
    proposal: no lead), «корника» in the `/roll/std` lead (decided with `daggerheart-ru-terms`), and the gold outline of
    the «ИЛИ» dividers (The Seal Rule).
12. `PageHead` keeps the focus on the same pill across the 1000 px step (`pageHead.test.ts`).
13. `/tables/*` from 761 to 999 px: the named exception of N-D5 is in DESIGN.md "The First-Screen Rule" with its date
    and figure, and case 110 (e) asserts its 336 px ceiling at 900x720 and 410 px at 768x1024.
14. Owner item 12: on `/roll/alt` each die label starts with the d12 mark in `--hope` or `--fear`, no letter, the word
    as text; case 111 passes at 360 and 1180 px, RU and EN; DESIGN.md "Tertiary" and "The Seal Rule" carry the clause.
15. The prose of S10 is in the same commit; `node tools/decisions.js` is not needed (no decision file).
16. `polish` and `harden` ran (the orchestrator); the shots are in `mocks/N/built/`.

## First-screen rows

| Row | 360x640 | 768x1024 (case 110) | 900x720 (case 110) | 1180x720 |
|---|---|---|---|---|
| `#/roll/std` | 323, exception (T sets its measured value) | 264 (limit 410) | 264 | 214 |
| `#/roll/alt`, `~ crit`, `#/roll/voa`, `#/roll/wondrous` | unchanged (251) | 264 | 264 | 214 |
| `#/tables/eq_weapon`, `~ two filters` | unchanged (234) | 334 (limit 410) | 334 (exception, ceiling 336) | 244 |
| `#/homebrew as gm3` | unchanged (243) | S1 measures (301 today) | S1 | S1 (254 today) |
| `#/lists as gm1`, `#/search ~ searched` | unchanged | unchanged | unchanged | unchanged |

## States table (standing check 1)

| State | What the screen shows | Proof |
|---|---|---|
| roll: three pills (fixed), the supplements button with its longest name lit («Предметы сообществ», "Wondrous Environments") | one head row from 1000 px; 14 px of room at 1000 px RU with the pin pressed | case 110 (c), `roll-head.json` |
| tables: six group chips signed out, seven signed in | from 1000 px one row; at 1000-1049 px RU the chips wrap inside their box (288 px); from 761 to 999 px the chips' row, then the reserved tab row | case 96, case 110 |
| homebrew counts: zero, one, many (44), at the limit (100 items, 20 sources, 100 cards), 3x (300, 60, 300 with an override) | the pills grow by one or two digits; from 1000 px RU they wrap inside their box where the row is short | S1 step 2 (3x by injection), case 110 logs |
| `/tables/homebrew` with 12 sources of 80 characters | the source tabs under the head, not reserved, folded past `CHIP_FOLD_AT` (unchanged; only their place in the DOM moves, after the help) | `tableNav.test.ts` (the fold inside the `tabs` part), the `_tables_homebrew*` goldens |
| the longest help label («Об этих предметах») and the pressed pin («Открывается при запуске») | in the one row at 1000 px | case 110 at 1000 px, pin pressed |
| each family at 360 px | unchanged layouts; the hidden roll `h1` reads «Бросок» | case 110 (f), the narrow goldens |
| each family at 1180 px | one head row; first content 214 (roll), 244 (tables), S1 (homebrew) | case 110 (e), case 83 |
| `/roll/alt` die labels at 360 (the settings open) and 1180 px | the d12 mark, the word | case 111 |

At many and at the limit: the pill order is fixed (the modes, `TABLE_NAV`, the four homebrew tabs); the primary
«Новый предмет» ends the row from 761 px; at 360 px with the keyboard open nothing changes (no field in the head); no
sticky region is added or grows (the head is not sticky).

## Error scenarios (standing check 2)

- Loading: `/homebrew` draws the `h1` and the lead with no pills, no pin and no primary until the store is ready, as
  today (the props are `undefined`); a roll page with no data draws the head with its pills and `NoData`, as today.
- A failed read (`/homebrew`): the `LoadState` under the head; no pills, no pin. Offline: the same.
- A failed write: the pin is the only write in the head; its path does not change (a toast on failure, as today).
- A conflict (the pin set in another tab): the existing storage merge; the pressed state follows.
- A deleted record: not applicable (the head names pages, not records).
- A stale tab: the previous bundle draws the old head on the same stored values; nothing new is stored.
- A revert: the previous frontend reads the same `dhloot.home.v1`; nothing is lost.
- A resize across 1000 px with the focus on a pill: the focus stays on the same pill (N-D9); across 760 px the
  existing `RollPage` and `TablesPage` band effects place it.
- No path loses stored data: no plan-review trigger.

## Consistency (standing check 3)

Rules of `FEATURES.md` "Consistency rules" followed: 4 (one name: the lit pill, the tab title and the start-section
option name the page; the heading names the job on the roll pages, as «Таблицы» does on `/tables/*`; rule 4 is
rewritten, see below), 9 (the primary action at the right end), 16 (labels). Siblings compared:

| Axis | Roll | Tables | Homebrew | Lists | Search |
|---|---|---|---|---|---|
| Heading | «Бросок» (job) | «Таблицы» (job) | «Мои предметы» (page) | «Мои списки» (page) | «Поиск» (job) |
| Siblings | three pills | six or seven chips, then the tabs | four pills with counts | none | none |
| Pin, help | after the pills | after the chips | the pin after the pills; no help (owner, Q6.1) | after the `h1`; no help | the pin after the `h1` |
| Primary | none in the head (the roll pane's button) | none | «Новый предмет», right end | «Новый список», right end | none |
| 761-999 px | pills on the next row | chips and tabs on the next rows (unchanged) | pills on the next row | unchanged | unchanged |
| Up to 760 px | the mode row, the `h1` hidden | the picker row | the picker row | `h1`, primary, «Ещё» | `h1`, «Ещё» |

Named differences: the roll and catalog headings name the job while the homebrew and lists headings name the page
(they are one page each); the catalog has a third level; `/homebrew` has no help panel (owner). The lit place is the
gold fill on every family (N-D7).

## RU/EN parity (standing check 4)

No new string. Two keys go in both languages (`hopeLetter`, `fearLetter`). The labels in the head are existing keys
(`jobRoll`, `tables`, `myItems`, the mode and group names, `hbItems`, `hbSources`, `hbSets`, `hbRefs`, the pin and the
help labels). RU is the longer language in the head row: measured at 1000 px (14 px of room RU, 214 px EN).

## Gate cost, goldens, tier, review

| Gate | Minutes |
|---|---|
| S1: `build:test`, the homebrew probe and its shots | 12-15 |
| vitest, one file at a time with `VITEST_MAX_WORKERS=2` (11 files) | 12-16 |
| `check:fast` (the diff reaches `dict.ts`: 676-840 s on this host) | 12-14 |
| `build:test` and four golden shards with `--update`, then the diff read of about 145 files | 25-30 |
| cases 83, 96, 97, 110, 111 and `sweep.js` 768 and 1180 | 15-20 |
| `check:built`, lints | 4-5 |
| `polish` and `harden` (the orchestrator) | 5-10 |
| one CI run; the review | 11 + 20-30 |
| **Total** | **about 115-150** |

- Goldens: about 140-150 files move (roll 41, tables up to 63, homebrew up to 43, plus the two new states); the real
  list is the output of `golden.js --update`.
- Writer tier: `opus`, writer test 3 (an acceptance line rests on a golden re-seed and on visual judgment of the head
  at five widths). No test 1 (no open design question) and no test 2 (no contract, route, stored state or product
  law).
- Split criterion (`CLAUDE.md`, "Size a batch by its gates"): its own route set (the nine roll pages, `/tables/*` and
  `/homebrew` from 761 px) and its own golden set against T's up-to-600 px re-baseline; item 12 joins because it is a
  roll-page file the batch opens and costs no gate of its own beyond case 111.
- Plan review: not required (no trigger fired: no migration, no SECURITY DEFINER function, no public contract change,
  no stored key, no write or sync protocol). The reviewer of the batch is required by the golden re-seed.

## DESIGN.md and FEATURES.md text this batch writes

DESIGN.md, "Layout", "Named Rules": **The Head Order Rule** replaces "A steady head" (the budget of "Layout" is past 8,
so the new rule takes the old one's place and keeps its sentences):

> **The Head Order Rule.** A page head draws, in this order in the DOM and on the screen: the heading, the pills of
> the sibling pages where the page has siblings, the pin, the help, and the page's primary action at the right end. A
> page with no siblings has no pills slot, so its pin follows its heading. From 1000px the head is one row, and where
> the row is short the pills wrap inside their own box (the catalog's chips in Russian up to about 1049px); from 761px
> to 999px the pills take the next row, under the heading, the pin, the help and the primary, so the DOM order is the
> reading order in each band. A third level (a table group's books, the homebrew sources) is underlined tabs under the
> head. Up to 760px the heading is read, not drawn, and the mode row or the picker row names the page. The head's
> geometry follows the band only, never the content: the heading is constant, so a switch between siblings moves no
> pill, and the catalog's tab row keeps the height of the tallest group's tabs on every table; the homebrew sources
> are not reserved, because they hold the GM's own text (up to 12 names of 80 characters), so `/tables/homebrew` may
> draw a taller row. The lit pill takes the gold fill of the current place and no check (The Check Rule). Owner,
> 2026-11-05.

"The Roll Page Rule", the second sentence: "From 761px: the head (The Head Order Rule) with the `h1` «Бросок», the
three mode pills and the labeled pin and help, a 320px control pane, the results." Add: "The `h1` names the job at
every width; the lit pill and the tab title name the mode."

"The Two Breakpoints Rule": "from 761px it draws the wide head (the `h1`, the group chips, the labeled pin and «Об
этих данных», then the tabs)"; "the mode row's controls 40px tall" stays (up to 760px).

"The First-Screen Rule", after the two exceptions: "From 761px to 999px the rule is checked at 768x1024 and 900x720
too, with one more exception: `/tables/*` in a 720px window starts at 334px, the reserved tab row of The Head Order Rule
(measured 2026-11-05; taken while the owner was away)."

"Layout", the second paragraph: "the mode row on the nine roll pages up to 760px (53px, scrolling with the page)";
the first paragraph: "so the brand, the first mode control (up to 760px) and the first word of the page share a left
edge".

"Colors", "Tertiary", Hope Amber and Fear Violet: "They color the badge, the die's mark before each die's label on
the alternate tables (the page's d12 in lines, no letter; the word names the die) and the focus glow of the die they
belong to, on the alternate tables only." "The Seal Rule": "A die button is an action and plain: no gold, no check, no
lit border. A die's mark in a label is not a button: it takes its die's color (Tertiary)."

"Components", "Chips": the "Mode row" bullet becomes "**Sibling pills:** the roll modes, the catalog's groups and the
four homebrew tabs (with their counts, tabular, in `--muted2`) are link chips in the page head (The Head Order Rule);
the lit one takes the Seal Gold fill of the current place and draws no check. Up to 600px the roll's three share the
mode row, 40px tall, and a long name takes two lines." "Two-level navigation": "the catalog's group chips in the head
row, then the book or section of the group as underlined tabs under the head".

"Components", "Navigation": "**Mode row:** up to 760px, under the sticky header on the nine roll pages, scrolling
with the page; from 761px the same three controls are the page head's pills after «Бросок»." "**List head:**
`/homebrew` draws the catalog's: up to 760px the picker row with the `h1` read, not drawn; from 761px the head with the
four tabs as pills with their counts, the pin and the primary."

FEATURES.md:

- "Rolling", the first bullet: "From 761 px the head holds the `h1` «Бросок» / "Roll", the three mode pills, the
  labeled pin and help (DESIGN.md, "The Head Order Rule"; from 761 to 999 px the pills take the row under them), and
  the lead; ..." The bullet "The nine roll sections share the header's roll job ... and draw the mode row under the
  header" reads "... draw the mode row under the header up to 760 px and the same controls as the page head's pills
  from 761 px".
- "Rolling", the alternate-tables bullet: "Each die's label starts with that die's mark, the page's d12 in lines,
  amber for Hope and violet for Fear, with no letter; the word names the die (owner, 2026-11-05)."
- "Tables and search", the navigation bullet: "From 1000 px the group chips follow the `h1` in the head row, before the
  pin and «Об этих данных»; from 761 to 999 px they take the row under them; the tabs follow under the head." The head
  measure sentence: "180 px from 1000 to 1139 px in Russian (the chips take two lines inside the head row up to about
  1049 px; the rows start at 288 px at 1000x720, measured 2026-11-05)".
- "Homebrew": "From 761 px the head holds the heading, the four tabs as pills with their counts («Предметы 44»), the
  labeled pin and, on the Items tab, «Новый предмет» with the plus icon at the right end (from 761 to 999 px the
  pills take the row under them), then the lead line".
- "Lists": "The head follows DESIGN.md's Head Order Rule: no siblings, so the pin follows the heading and the primary
  ends the row."
- "Chrome", the mode-row bullet: "The nine roll sections draw the mode row under the sticky header up to 760 px; it
  scrolls with the page. From 761 px the same three controls are the pills of the page head, after the `h1` «Бросок» /
  "Roll" (DESIGN.md, "The Head Order Rule")." "the row is 53 px at 360 and 1180 px" reads "at 360 px".
- "Consistency rules", rule 4: "`/roll/alt` is «Альтернативные таблицы» / "Alternate tables" in the lit mode pill, the
  tab title and the start-section option. The lit pill reads its page's name. Departures: the nine roll pages and
  `/tables/*` are headed by their job, «Бросок» / "Roll" and «Таблицы» / "Tables", and the lit pill or tab names the
  page; the menu button «Дополнения» / "Supplements" names the seven supplement pages as one group and shows the open
  supplement's name; and on Arazo's Artifacts the button and the menu read «Arazo's Artifacts», the tab title the
  book's full title."

## Fold list (for the orchestrator: `plan.md`, `handoff.md`, `context.md`)

1. `plan.md` section 7, "Batch N": replace the outline's body with one line: "Refreshed 2026-11-05 into `plan-N.md`
   (implement-ready); the figures and the decisions are there." Keep the split criterion line.
2. `plan.md` Status: add "- Batch N refreshed 2026-11-05 (`plan-N.md`): the Head Order Rule, the `/tables/*` mid-band
   exception (334 px at 900x720), owner item 12 (the d12 die marks). Writer tier `opus` (writer test 3)." and "- Plan
   review: not required (no trigger fired) for batch N."
3. `plan.md` section 14 (first-screen rows): add the 768x1024 and 900x720 columns of "First-screen rows" above and the
   `/tables/*` exception.
4. `context.md` item 11, after the ANSWER: "Placed (planner, 2026-11-05): `plan-N.md` N-D5: a named exception, 334 px
   at 900x720, ceiling 336 in case 110; fallback `scrollTrim` (287 px). Measured: `mocks/N/tables-mid/`. Correction: the
   'homebrew' cells of `mocks/N/headorder/` were drawn on `/roll/alt`; S1 measures the real page." The rule tag:
   "The Head Order Rule: batch N, acceptance 2 (DESIGN.md, replaces "A steady head")."
5. `context.md` item 12: "Placed (planner, 2026-11-05): batch N, `plan-N.md` N-D10 and S6, case 111; mock
   `mocks/N/d12/` (lines in `--hope`/`--fear`, no letter; the 22% fill is the fallback); the Seal Rule's 'a die is
   plain' covers die buttons, the Tertiary rule covers the mark."
6. `handoff.md`: the next batch after T is N, brief `plan-N.md`; the Deferred rows of acceptance 11 (three rows, for
   batch 10); "Measured at S1" is a line the implementer fills.
7. The Impeccable `critique` of `mocks/N/index-N.html` before the dispatch (the preflight).
8. Owner-AFK decisions file: item 20 is written (this refresh).
