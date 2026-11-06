# Batch D - Dashes mean "drop here", one gap above the empty plate, one line for a short lead (implement-ready)

This brief is the implementer's whole input for batch D, with the mock `mocks/D/` (`index.html`, the probes
`measure.cjs` and `shoot.cjs`, the readings `gaps.json`, `leads.json`, `after.json`, the shots `shots/*.png`). It
places owner items 13 and 14 of `context.md` (2026-11-05). Every choice below is the recommended option; with the
owner away it is logged in the owner-AFK decisions file. A mock is direction (owner, 2026-11-03): each departure is
named in "Decisions". Section numbers ("section 7") are those of `plan.md`. Guideline sources are cited by URL only.

Batch D is merged into batch T as batch TD (owner, 2026-11-05, `plan-rebatch.md` option B): it runs inside TD, after 9b
and before N. `plan-TD.md` gives the merged order of steps, the case numbers and the acceptance map; this brief stays
the source for D's decisions, steps and acceptance lines (its case numbers below are TD's: 110 and 111).

## Objective

A dashed border says one thing: "drop here". The app has no drop place with a border today (the list's drop mark is a
2 px gold line), so the screen draws no dashed border at all; the empty plate, the unique tag, the GM boxes and rows,
the list title field, the add row and the preview pane take solid borders. The empty plate also stops crowding the row
above it: it sits 16 px (`--gap-plate`) under the last control row on every page. A page lead of one or two sentences
takes one line while the column allows it (120ch instead of 70ch), so `/search` and `/homebrew` gain 22 px of first
content from 761 px. Nothing is stored; no string changes; no route or contract moves.

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a rebase). `git log --oneline -8`
  must show 9b's last commit and the CI fix pass (`a8bdf1de` or later).
- Read the shipped `Empty.svelte`, `Badge.svelte`, `HitNote.svelte` (9b gave it a dashed `gm` variant, `plan-9b.md`
  M14), `ListPage.svelte` (`.titleinput`, `.addrow`, `.narea.gm`, `.lrow.gm-only`), `TableRows.svelte` (`.row.gm-only`),
  `MarkupField.svelte` (`.pane`), `PageHead.svelte` and `PageTitle.svelte` (`.page-sub`), and the plate's parents in
  `SearchPage`, `TablesPage`, `HomebrewPage`, `ListsPage`. A line of this brief that no longer matches the code is the
  implementer's to adapt; `handoff.md` names the change.
- Case numbers (TD's): T takes 108 and 109, D's plates are 110, and D's lead case is widened into the text measure,
  111 (`plan-text.md`). Batch N takes 112 and 113 and batch P 114 and 115. `handoff.md` names the numbers taken.
- Host: memory-starved. Run vitest with `VITEST_MAX_WORKERS=2`, one file at a time, and no browser suite in parallel
  with vitest.
- Impeccable cannot run from a subagent. The orchestrator runs `critique` on `mocks/D/` before the dispatch and
  `polish` and `harden` after S8 on `/search`, `/tables/eq_weapon` (nothing found), `#/lists`, `#/homebrew` and a list
  page with a GM-only entry, at 360 and 1180 px; fallback `impeccable:impeccable-finish-reviewer`.
- Steps are S1 to S10. The line "Session end partial progress" in `handoff.md` names the last finished step.

## Decisions of this refresh (planner defaults; the asks are the owner's, 2026-11-05)

| # | Decision | Default, fallback, reason |
|---|---|---|
| D-1 | **The Drop Rule.** A dashed border marks a place that takes a dragged thing, and nothing else. No screen element draws one today. The print card's 0.4 mm cut border stays dashed: it is a cut line on paper, the one exception, named in the rule. | Default as stated. Fallback: none needed (the rule only removes dashes). Sources: the Scottish Government Design System's file upload, "the dashed border of the drop zone becomes a solid line" once a file is chosen (https://designsystem.gov.scot/components/file-upload); IBM Carbon's file uploader drop zone (https://v10.carbondesignsystem.com/components/file-uploader/usage/; its text names the drop zone, its pictures draw it dashed). Material 3 and the Apple HIG: no source found. `material-review.md` has no entry on dashes, and the official pages render by script, so the lookup could not read them; the rule cites neither. |
| D-2 | **The plate, option A.** `Empty` takes a solid 1 px Seam border (`--line`) on the Vault Wall ground (`--bg2`); radius, padding and contents stay. | Mock `shots/search__1180__ru__a.png`. The ground keeps the plate's edge visible on a 1440 px column without a second outline style, and it is quieter than a card (`--surface`). Fallback, option B: the ground with no border (`shots/search__1180__ru__b.png`): the edge then rests on a 6-step contrast difference (`#14111d` on `#0e0c15`), which a dim phone screen loses. |
| D-3 | **The other dashed surfaces turn solid and keep their colour and ground.** The unique tag (`Badge` `.uniq`: `--line2`, Ash Violet, like the tier tag; its word says what it is), the GM note box (`HitNote` `.gm`: `--line2` on `--bg2`, the `eyeOff` icon and «Только для мастера»), the GM note field (`ListPage` `.narea.gm textarea`; the `Seg` and the caption name the note), the GM-only row (`ListPage` `.lrow.gm-only`, `TableRows` `.row.gm-only`: `--line2` on `--bg2`, the art at 45% and the GM mark on the meta line), the list title field (`.titleinput`: a solid `--line2` underline, `--muted2` on hover, gold on focus), the add row (`.addrow`: `--line2` on a transparent ground, the Seal Gold Soft label with its plus), the formatted-text preview (`MarkupField` `.pane`: `--line2` on `--bg2`). | Each keeps a second sign of what it is, so the dash was never the only one. Fallback for the GM row only, if the review finds it too close to a plain row: a 2 px `--muted2` top border (no new hue). Reverses `plan-9b.md` M14's dashed `gm` box, accepted: owner item 13 came after 9b's plan. |
| D-4 | **The gap token.** `tokens.css` gains `--gap-plate: 16px`: the space from the last block above an empty plate (the search row, the kind chips, the count line, the page head) to the plate's top edge, at every width. | Measured today (live site, RU and EN equal): `/search` 4 px at 1180 and 1920 (the kind chips) and 8 px at 360 (the search row); `/tables/*` 12 px at 1180 (the search row, beside the filter column) and 6 px at 360 (the count line); `/homebrew` 12 px and `/lists` 10 px (signed in) or 18 px (signed out) read from the CSS, because production needs a sign-in there (S1 measures them on the built app). 16 px is twice the 8 px gap between the chips of a row, so the plate reads as the next block, not as one more chip (proximity); it is the catalog's existing gap above its search row. Fallback: 12 px (the `--anchor-gap` value): fewer moves, but 1.5x the chip gap. |
| D-5 | **The gap's mechanism.** The plate's own `margin-top: var(--gap-plate)`, which collapses with the smaller bottom margin of the block above in a block parent (`/search`, `/tables/*` up to 999 px, `/homebrew` without the column). Where the plate is the first child of a flex or grid item and cannot collapse, the container takes the gap and the plate's margin is 0: the filter-column body (`.body.withcol:has(> .rowscol > .empty:first-child)` in `TablesPage`, the same on `HomebrewPage`'s `.body.withcol` and `.hbrows`), so the filter column and the plate share one top 16 px under the search row; `ListsPage`'s `.stack` (a grid) sets its own top so the signed-out plate lands 16 px under the head. Case 110 is the arbiter: a parent it finds at another value gets the same treatment, named in `handoff.md`. | Measured in the mock: the plain margin gave 28 px beside the filter column (12 + 16, no collapse in a flex item); the `:has` pair gives 16 and keeps the column aligned (`after.json`). `:has` is already used by `CompactRow`. Alternative: a gap prop on `Empty`: every caller passes a number, a second place for one value. |
| D-6 | **The lead cap (owner item 14).** The page lead (`.page-sub` of `PageHead` and of `PageTitle`) caps at 120ch (835 px at 14 px) instead of 70ch (487 px). A one-to-two sentence lead takes one line while its column allows it; up to 760 px it wraps in the column as today. The prose caps do not move. | Measured (`leads.json`): of 15 head pages only two leads wrap from 761 px today: `/search` (RU 91 characters, 593 px on one line; EN 90, 526 px) and `/homebrew` (RU 105, 684 px; EN 113, 633 px). With 120ch both take one line from 768 px (column 736 px) to 1920 px. `/account` keeps its own 70ch column (557 px): RU stays on two lines, EN (499 px) takes one. Fallback: 140ch. Alternative not taken: no cap, which lets a future three-sentence lead run 1440 px. Trade-off accepted: a 105-character line is past WCAG 1.4.8's 80-character measure (AAA, not a requirement here); a single line needs no return sweep, which is that measure's reason. |
| D-7 | **The checks.** A static check in `tests/derived.js` ("Dashed means drop"): no CSS declaration in `app/src` (`.svelte`, `.css`) has `border*` or `outline*` with `dashed`, except `PrintCard.svelte`'s cut border. Case 110 (browser, the plates) and case 111 (browser, the lead). | A static check costs seconds and catches a new dash in any component, also one no browser state opens. |
| D-8 | **No golden moves by the look.** The goldens are accessibility trees and control lists (`## ru :: tree`, `## ru :: controls`): borders, margins and widths are not in them. Six goldens re-seed for their header only: the `why` text of six `inventory.js` states says "dashed". | Counted: 16 golden files hold a plate's text; none moves. Error states draw no plate (`ErrorPage`: "No icon and no plate", DESIGN.md "Error page"; `LoadState` draws a line), so they move nothing either. |

## Owner questions (none open)

- Items 13 and 14 are the owner's asks; D-1 to D-8 are defaults (AFK decisions file). The owner may pick option B of
  D-2 at the mock.

## Placed items (each is its own acceptance line below)

- `context.md` item 13: the inventory of dashes and their replacements (D-1, D-3; acceptance 1-4), the DESIGN.md rule
  (acceptance 9), the gap on every page with a plate (D-4, D-5; acceptance 5-6).
- `context.md` item 14: the lead on one line from 761 px, still wrapping at 360 (D-6; acceptance 7-8), the One Width
  Rule sentence (acceptance 9), the first-screen effect (acceptance 10).
- Two corrections to item 13's facts: the list drop mark is not dashed (it is a 2 px gold line, `plan-9b.md` M15), and
  the value-less filter chip is not dashed (DESIGN.md "Shapes" names a gold-tinted border for a filter with a value
  and the dash for the unique tag and the plate). Neither is changed.
- Campsite: DESIGN.md "Typography" says "Prose caps at 70ch" and "The One Width Rule" says 78ch; the code has 70ch for
  body prose (`AccountPage`, `HomebrewEditor`) and 78ch for a help box (`HelpBox`). The One Width Rule's sentence names
  both (acceptance 9).
- For batch 10: `.impeccable/design.json` draws `.ds-badge-uniq` dashed; batch 10's `document` run regenerates it
  (acceptance line placed in `plan.md` section 7, "Batch 10", by the fold list).

## Inventory of dashes (HEAD `340fa727` plus 9b's working tree, 2026-11-05)

| # | Where | What it means today | A drop target? | Replacement (D-2, D-3) |
|---|---|---|---|---|
| 1 | `Empty.svelte` `.empty` - every empty plate: `/search` start and nothing found, `/tables/*` nothing found, `/tables/homebrew` empty, `/homebrew` empty and nothing found, the sets, rules and sources tabs, `/lists` signed out, no lists, nothing found, a list page's empty and nothing found, `/s/` nothing found (12 call sites) | "an empty place" | no | solid `--line` on `--bg2`; `margin-top: var(--gap-plate)` |
| 2 | `Badge.svelte` `.badge.uniq` («Уникальное») | "a property, not a category" | no | solid `--line2` |
| 3 | `HitNote.svelte` `.hitnote.gm` (9b, M14) | "GM only" | no | solid `--line2` on `--bg2` |
| 4 | `ListPage.svelte` `.narea.gm textarea` | "GM only" | no | solid |
| 5 | `ListPage.svelte` `.lrow.gm-only` | "GM-only entry" | no | solid `--line2` on `--bg2` |
| 6 | `TableRows.svelte` `.row.gm-only` (`/s/` on a GM link) | "GM-only entry" | no | solid `--line2` on `--bg2` |
| 7 | `ListPage.svelte` `.titleinput` (bottom border) | "you can type the name here" | no | solid `--line2` underline |
| 8 | `ListPage.svelte` `.addrow` («Добавить свой предмет») | "add a new row here" | no (a button) | solid `--line2`, transparent ground |
| 9 | `MarkupField.svelte` `.pane` (the preview) | "a preview, not the field" | no | solid `--line2` on `--bg2` |
| 10 | `PrintCard.svelte` cut border (0.4 mm, `#c9c4d2`) | "cut here" (paper) | no | kept: the rule's named exception |
| - | `ListPage.svelte` drop mark (`.drop-before`, `.drop-after`) | "the row lands here" | yes, the only one | already a 2 px gold line; stays |
| - | `RecordCard.svelte` `.craft a` (dotted underline) | a link in the craft line | no | not a border of a box; out of the rule (dotted, not dashed) |
| - | `CompactRow.svelte` comment "keeps its dashed box" | - | - | the comment follows row 5 |

No element takes a dragged file (`git grep -n -E "ondrop|ondragover" -- app/src` finds nothing); the list rows'
drag uses the gold line above.

## Measured (live site `https://daggerheart-loot.pages.dev`, wave 2b, 2026-11-05; `mocks/D/`)

Gap above the plate, px (RU and EN equal; 1920 equals 1180):

| State | 360 today | 360 after | 1180 today | 1180 after | Block above |
|---|---|---|---|---|---|
| `/search` «Что ищем?» | 8 | 16 | 4 | 16 | search row (360), kind chips (1180) |
| `/search` «Ничего не найдено» | 8 | 16 | 4 | 16 | same |
| `/tables/eq_weapon`, `/tables/core_item` nothing found | 6 | 16 | 12 | 16 | count line (360), search row beside the filter column (1180) |
| `/homebrew` (CSS, not on production signed out) | 12 | 16 | 12 | 16 | the count line or the tools row |
| `/lists` signed in, no lists (CSS) | - | 16 | 10 | 16 | the count row |
| `/lists` signed out (CSS) | 12 | 16 | 18 | 16 | the page head |

Page lead (`.page-sub`, 14 px, line 22.4 px), today 70ch = 487 px:

| Page | RU characters / one-line px | EN characters / one-line px | Lines from 761 px today | After (120ch = 835 px) | 360 |
|---|---|---|---|---|---|
| `/search` | 91 / 593 | 90 / 526 | 2 | 1 | hidden |
| `/homebrew` | 105 / 684 | 113 / 633 | 2 | 1 | hidden |
| `/lists` | 59 / 392 | 70 / 371 | 1 | 1 | 2 (column 313) |
| `/account` (its column 557) | 97 / 633 | 88 / 499 | 2 | RU 2, EN 1 | RU 3, EN 2 |
| `/p/<id>` signed out | 33 / 218 | 23 / 124 | 1 | 1 | 1 |
| `/roll/std` | 52 / 345 | 53 / 304 | 1 | 1 | hidden |
| `/roll/alt` | 61 / 417 | 66 / 375 | 1 | 1 | hidden |
| `/roll/wondrous`, `dread`, `dv`, `arazo` | 56 / 378 | 47 / 261 | 1 | 1 | hidden |
| `/roll/voa` | 46 / 299 | 46 / 251 | 1 | 1 | hidden |
| `/roll/community` | 37 / 252 | 28 / 155 | 1 | 1 | hidden |
| `/roll/mwt` | 37 / 242 | 32 / 173 | 1 | 1 | hidden |
| `/tables/*` | no lead | no lead | - | - | - |

First-screen effect: from 761 px `/search` and `/homebrew` rise 22.4 px (one line less): the rows `#/search ~
searched`, `#/search ~ kind picked` and `#/homebrew as gm3` at 1180 (and any homebrew tab row with the lead). At 360
nothing moves: the lead is hidden or wraps in its column, and no `FIRST_SCREEN` row starts at a plate.

## Files expected

| Step | Files |
|---|---|
| S1 | `tests/app/states.js` (case 110, run red first) |
| S2 | `app/src/styles/tokens.css` |
| S3 | `Empty.svelte`, `TablesPage.svelte`, `HomebrewPage.svelte`, `ListsPage.svelte`; any other plate parent case 110 names (`SearchPage`, `ListPage`, `SharedListPage`, `HomebrewCards`, `HomebrewSources`) |
| S4 | `Badge.svelte`, `HitNote.svelte`, `ListPage.svelte`, `TableRows.svelte`, `MarkupField.svelte`, `CompactRow.svelte` (comment), `listPage.test.ts` (a comment), `sharedListPage.test.ts` (two titles), `tests/app/states.js` (the `dashed` keys of two cases), `tests/app/inventory.js` (six `why` texts) |
| S5 | `PageHead.svelte`, `PageTitle.svelte` |
| S6 | `tests/derived.js` |
| S7 | `tests/app/states.js` (case 111) |
| S8 | `DESIGN.md`, `docs/specs/FEATURES.md`, `docs/specs/COVERAGE.md` |
| S9 | `tests/app/snapshots/*` (six headers, re-seeded with `--only`, never edited) |
| S10 | `issues/57/mocks/D/built/`, `handoff.md` |

## Steps

### S1. Case 110, red first

`tests/app/states.js`, case 110 "the empty plate" (DESIGN.md "Empty state", "The Drop Rule"): for each plate state
below at 360x640 and 1180x720, RU and EN, read (a) the plate's four computed border styles; (b) the gap from the
nearest visible block above it to its top edge: the lowest bottom of the elements in `main` that are not the plate, its
ancestor or its child, overlap it sideways and end above its top (the function `gapProbe` of `mocks/D/measure.cjs`,
inlined); (c) on a state with the filter column (`.fcol` drawn), the plate's top against the column's top. Assert (a)
solid on all four sides, (b) 16 +/- 0.5 px, (c) equal +/- 0.5 px. States (inventory ids): `#/search`, `#/search ~
narrow`, `#/search ~ nothing found`, `#/search ~ nothing found, kind picked`, `#/tables ~ nothing found`,
`#/tables/eq_armor ~ nothing found`, `#/tables/wondrous ~ nothing found`, `#/homebrew ~ no match as gm3`,
`#/homebrew/sets ~ empty as gm4`, `#/homebrew/rules ~ empty as gm4`, `#/lists ~ empty as gm4`, `#/lists ~ nothing found
as gm4`, `#/lists/00000000-0000-4000-8000-000000008001 ~ no match as gm4`, `#/s/player-token-1 ~ no match`, and
`#/lists` signed out (open with no `as`). `git grep -n "<Empty" -- app/src` lists every caller: a caller with no state
here gets a state only if `inventory.js` already opens its route empty; otherwise `handoff.md` names it. Build
(`npm run build:test`) and run the case through the in-memory loader of `states.js` (the `CASES` list filtered, as
batch 8 did) before S2: `handoff.md` keeps the red run's gaps as the before column.

### S2. The token

`tokens.css`, `:root`, after `--gap-sm`: `--gap-plate: 16px;` with one comment line: "The space above an empty plate:
twice a chip row's gap, so the plate reads as the next block (DESIGN.md, "Empty state")."

### S3. The plate and its parents (D-2, D-5)

1. `Empty.svelte` `.empty`: `border: 1px solid var(--line); background: var(--bg2); margin-top: var(--gap-plate);`.
   The top comment: "a plate with a seam border on the Vault Wall ground (DESIGN.md, "Empty state")".
2. `TablesPage.svelte`: `.body.withcol:has(> .rowscol > :global(.empty):first-child) { margin-top: var(--gap-plate); }`
   and `.body.withcol > .rowscol > :global(.empty:first-child) { margin-top: 0; }` (mock `after.json`: 16 px, the column
   on the same top). The body's margin collapses with the search row's 12 px.
3. `HomebrewPage.svelte`: the same pair on its `.body.withcol` and `.hbrows`.
4. `ListsPage.svelte`: the signed-out `.stack` sets its own top so the plate lands 16 px under the head (`.stack >
   :global(.empty:first-child) { margin-top: 0 }`, and the stack's `margin-top` 12 px at every width, the head's 4 px
   bottom margin above it); read the signed-in no-lists state in case 110 and treat its parent the same way if it is a
   flex or grid.
5. Re-run case 110: every row passes; a parent that does not is fixed by the same pattern and named in `handoff.md`.

### S4. The other dashes (D-3)

1. `Badge.svelte`: `.badge.uniq` loses `border-style: dashed`; its comment: "Neutral, because nobody chose it (The Seal
   Rule); its word says it is a property."
2. `HitNote.svelte`: `.hitnote.gm` keeps `background: var(--bg2)` and loses `border-style: dashed`; the `gm` prop's
   doc: "on the darker ground, the style of the owner's GM note field".
3. `ListPage.svelte`: `.titleinput` `border-bottom: 1px solid var(--line2)`; `.addrow` `border: 1px solid var(--line2)`
   and its comment ("a list row's box on no ground: it adds, it is not an entry"); the `.narea.gm` rule and its comment
   go (the field is the plain textarea); `.lrow.gm-only` keeps `border-color` and `background` and loses
   `border-style`. The markup comment "the GM note in its dashed box" reads "in its GM box".
4. `TableRows.svelte`: `.row.gm-only` loses `border-style`; the `gmOnly` doc reads "the row's GM look".
5. `MarkupField.svelte`: `.pane` `border: 1px solid var(--line2)`.
6. `CompactRow.svelte`: the comment reads "A GM-only entry keeps its box on the darker ground".
7. Tests: `listPage.test.ts` (the comment "its dashed field"), `sharedListPage.test.ts` (titles "the GM note in its GM
   box", "its GM row"); `states.js` cases at the `dashed:` keys: rename the key to `gmOnly`, the messages unchanged in
   meaning; `inventory.js`: the six `why` texts read "the row on the recessed ground" / "in its GM box" / "in the GM
   field" instead of "dashed" (lines with `dashed` in the `why` of the GM-only, the hidden, the rolled, the note-switch,
   the compact-noted and the `/s/` GM states).

### S5. The lead (D-6)

`PageHead.svelte` and `PageTitle.svelte`: `.page-sub { max-width: 120ch; }` with one comment line: "A lead of one or
two sentences takes one line while the column allows it (DESIGN.md, "The One Width Rule")." No other `.page-sub` rule
changes (`ListPage`'s side column and `SharedListPage`'s head keep theirs). If batch N's `PageHead` moved `.page-sub`,
edit it where it is.

### S6. The static check (D-7)

`tests/derived.js`, a block "Dashed means drop" after "American spelling": walk `app/src` for `.svelte` and `.css`
files; in each, match `/(border|outline)[\w-]*\s*:[^;{}]*\bdashed\b/g`; allow `components/PrintCard.svelte` only (its
cut border, DESIGN.md "The Drop Rule"); `ok(found.length === 0, 'a dashed border outside a drop place: ' + list)`.
First assert the pattern reads `border: 1px dashed` and `border-style: dashed` and not `/* dashed */`.

### S7. Case 111, the lead

`tests/app/states.js`, case 111 "the page lead": on `#/search`, `#/homebrew as gm3`, `#/lists as gm1`, `#/roll/alt` and
`#/account` at 1180x720, 1440x900 and 1920x1080, RU and EN: the `main .page-sub` computed `max-width` is 120ch (its
pixel value over the font size is 120 +/- 1 `ch` of the face: read `ch` from a probe span); where its one-line width
(a hidden `nowrap` clone, as `leadProbe` of `mocks/D/measure.cjs`) is at most its column's width, it is one line (its
height under 1.5 line heights). At 360x640 on `#/lists as gm1` and `#/account`, RU and EN: the lead wraps (two lines or
more) and nothing scrolls sideways.

### S8. Prose, in the same commit

DESIGN.md (the texts in "DESIGN.md and FEATURES.md text" below): "Shapes", "Named Rules" gains The Drop Rule (2 of 8)
and the borders sentence; "Colors", "Named Rules" (the Seal Rule's "The unique tag is neutral and dashed"); "Badges"
(the unique variant); "Compact row" (the GM-only box); "Empty state" (the plate and the gap); "The One Width Rule" (the
lead); "Typography", "Hierarchy" (the campsite). FEATURES.md: the five lines that say "dashed" (the catalog's empty
state, the rolled entry's GM note, the note area's GM box and field, the GM-only row). COVERAGE.md: the two rows that
say "dashed" (list page and shared page tests) and cases 110 and 111, and the derived check. `git grep -n -i dashed --
DESIGN.md docs/specs app/src tests` then finds only the print card, The Drop Rule's own text, the derived check and
`PrintCard.svelte`.

### S9. Goldens

`npm run build:test`, then `MSYS_NO_PATHCONV=1 node tests/app/golden.js --update --only="<id>"` for the six states
whose `why` changed (one call per id, or a comma list if `golden.js` takes one). `git status -- tests/app/snapshots`
shows six files, each changed in its third line only. Any other moved golden is a defect of this batch: find the
cause, do not re-seed it.

### S10. Evidence and gates

`issues/57/mocks/D/built/` (`shoot.js` from `mocks/9b/built/shoot.js`): `search`, `search-none`, `tables-none`,
`lists-empty`, `lists-out`, `homebrew-none`, `list-gm-only`, `shared-gm-only` at 360 and 1180 px, RU and EN, and
`search` and `homebrew` at 1920 RU. `handoff.md`: the before and after gap of every case 110 row, the lead lines of
case 111, the six re-seeded ids. Then the gates (Verification) and one commit.

## Acceptance criteria

1. The Drop Rule holds: `tests/derived.js` "Dashed means drop" passes; `git grep -n -E
   "(border|outline)[a-z-]*: [^;]*dashed" -- app/src` finds `PrintCard.svelte` only.
2. The plate (D-2): every plate state of case 110 draws a solid `--line` border on `--bg2`, RU and EN, 360 and 1180.
3. The unique tag, the GM note box and field, the GM-only rows on the list page and `/s/`, the title field, the add
   row and the preview pane draw solid borders and keep their colour and ground (D-3; the built shots).
4. The list drop mark is unchanged: a 2 px gold line (the existing drag case passes).
5. The gap (D-4): case 110 reads 16 +/- 0.5 px above every plate in every listed state, at 360 and 1180, RU and EN;
   `--gap-plate` is the only place of the value (`git grep -n "gap-plate" -- app/src` names `tokens.css` and the
   rules of S3).
6. The filter column and the plate share one top on `/tables/*` and `/homebrew` from 1000 px (case 110 (c)).
7. The lead (D-6): case 111 passes: one line on `/search` and `/homebrew` at 1180, 1440 and 1920, RU and EN; `/lists`
   and `/roll/alt` one line as today; `/account` RU two lines inside its column, EN one.
8. The lead still wraps at 360 (case 111, `/lists` and `/account`), with no sideways scroll.
9. DESIGN.md carries The Drop Rule in "Shapes", "Named Rules" (2 of 8), the new borders sentence, the plate and the gap
   in "Empty state", the lead sentence in "The One Width Rule", and the corrected unique-tag, GM-only and Typography
   lines; FEATURES.md and COVERAGE.md say no "dashed" outside the print card.
10. First screen: `#/search ~ searched`, `#/search ~ kind picked` and `#/homebrew as gm3` at 1180 rise by about 22 px
    and pass their limits; no row at 360 moves (`FIRST_SCREEN` in case 83, `handoff.md` before and after).
11. Goldens: six headers re-seeded, no tree or control line moved; the CI golden job passes.
12. RU/EN parity: no string added or changed; the lead and the plate measured in both languages.
13. `polish` and `harden` ran (the orchestrator); the screenshot set is in `mocks/D/built/`; no new detector finding in
    a touched file; no `impeccable-disable`.
14. The two corrections (the drop mark and the filter chip are not dashed) are in `handoff.md`, and `context.md`
    item 13 is corrected by the orchestrator's fold.

## States table (standing check 1)

| State | What the screen shows | Proof |
|---|---|---|
| empty (a search, a table, a tab, a list, `/lists` with no lists or signed out, `/s/` with no match) | the plate: solid seam border on the Vault Wall ground, 16 px under the row above, its glyph, title, cause and one primary | case 110, the shots |
| one, many | no plate; the rows as today; the lead on one line from 761 px | case 111, unchanged goldens |
| at the limit, one past it, 3x | not applicable: a plate shows at zero results only; the count lines and refusals do not change | unchanged |
| the longest text | a 100-character query in «Нет совпадений с «...»» wraps inside the plate at 360; the longest lead (`/homebrew` EN, 113 characters) on one line from 768 px | case 110 at 360 (`#/search ~ nothing found` RU and EN), case 111 |
| 360 px | the plate 16 px under the search row or the count line; leads as today | case 110, case 111 |
| 1180 px | the plate 16 px under the chips or the search row, the filter column on its top; `/search` and `/homebrew` leads on one line | case 110, case 111 |

At many and at the limit nothing changes in row order, the primary's place, folds, popups or sticky regions; the
on-screen keyboard at 360 covers the same rows as today (the plate is 8-10 px lower, under the box).

## Error scenarios (standing check 2)

- Loading, a failed read, offline: `LoadState`'s line and `ErrorPage` draw no plate; they do not change. A failed
  homebrew read on `/tables/homebrew` keeps its `LoadState`.
- A failed write, a conflict, a deleted record, a stale tab, a revert: nothing is stored or written by this batch; a
  stale tab draws the old dashes on the same data; the previous frontend reads the same data.
- No path loses stored data: no plan-review trigger.

## Consistency (standing check 3)

Rules of `FEATURES.md` "Consistency rules" followed: 6 (load states: unchanged), 9 (the primary action: a plate holds
one primary at most, unchanged), 14 (text: no wording changes). Siblings: every page draws one plate, at one gap, in one
border style; one lead cap for every page head (`PageHead`) and page title (`PageTitle`). Named differences: the print
card keeps its dashed cut line (The Drop Rule's exception); `/account` keeps its own 70ch column, so its RU lead stays on
two lines; `/tables/*` has no lead.

## RU/EN parity (standing check 4)

No string is added or changed. The gap is the same in both languages (measured). The lead's one-line widths differ (RU
longer on `/search` and `/homebrew`); 120ch holds the longer of each pair from 768 px.

## Tests

- Unit: none new (CSS and comments; jsdom has no layout); `listPage.test.ts` and `sharedListPage.test.ts` run for their
  renamed titles.
- Static: `tests/derived.js` "Dashed means drop".
- Browser (CI): cases 110 and 111; case 83's `FIRST_SCREEN` rows; the goldens.
- COVERAGE.md names cases 110, 111 and the derived block.

## Verification

1. `VITEST_MAX_WORKERS=2 npx vitest run app/src/components/listPage.test.ts`, then
   `app/src/components/sharedListPage.test.ts`, one at a time.
2. `node tests/run-all.js derived`.
3. `npm run lint:untyped`, `npm run lint:typed`.
4. `npm run build:test`; cases 110, 111 and 83 through the in-memory loader of `states.js` on the final `dist-test/`;
   the six `--only` re-seeds (S9).
5. `rtk npm run check:built`; `npx impeccable detect --json --no-inline-ignores app/src` (no new finding in a touched
   file).
6. `VITEST_MAX_WORKERS=2 rtk npm run check:fast` last (Bash timeout 600000); push; CI is the full gate.

## Risks and do-nots

- Do not add a dashed style for the drag (the gold line is the drop mark, `plan-9b.md` M15).
- Do not move a plate's contents or wording; only its box and its top gap.
- Do not give the plate a margin where its parent is a flex or grid item: the container takes the gap (D-5).
- Do not change `ListPage`'s or `SharedListPage`'s own `.page-sub` rules; they are not page leads of a head.
- `:has()` with a `:global(.empty)` inside a scoped rule: Svelte keeps it only if the compiled selector still matches
  this component's markup (`.body`, `.rowscol` are the page's own); if `npm run check` prunes it, write the whole
  selector inside one `:global(...)` and name it in `handoff.md`.
- A golden that moves beyond the six headers means a tree changed: find the cause.

## Gate cost

One code batch (45-60 min: `check:fast` 12-14 min with `VITEST_MAX_WORKERS=2`, one CI run 10.5-11.5, one review fix
cycle, the screenshot set) plus extra gates: the two vitest files alone, two workers (8-10); `derived` (1); both lints,
`check:built` and the detector (4-5); `build:test` and the loader runs of cases 110, 111 and 83, red then green (10-12);
the six `--only` re-seeds (5-8); the shots at 360, 1180 and 1920 (5); `polish` and `harden` (5-10); the review (20-30).
No full golden re-seed. About 100-140 min in all as its own batch; inside T's batch (`plan-rebatch.md`, option B) about
33-45 min more than T alone (the lints, `check:built`, the detector, `polish`, `harden`, `build:test` and the shot setup
run once; the review grows by 10-15 min).

## Writer tests (for the orchestrator's dispatch; not a model choice)

- Test 1: no. Every fork has a default (D-1 to D-8); case 110 decides each plate parent.
- Test 2: no. No contract, route, stored state, product law, hook or configuration; `tests/derived.js` is a test.
- Test 3: in part. Six header-only re-seeds, no design node; the plate ground and the GM looks rest on visual
  judgment against `mocks/D/`.
- Test 4: no.

## Split criterion

As its own batch: none of `CLAUDE.md`'s three applies against batch T (both are rules of the whole system, every route,
no filter set, no contract, no golden tree), so `plan-rebatch.md` recommends merging it into T. Against batch N: a
different route set (D's plates and GM rows are on `/search`, `/tables/*`, `/lists`, the list pages and `/s/`; N's head
change is on the roll pages, `/tables/*` and `/homebrew` from 761 px) and N's 145 goldens, which D does not move. Against
batch P: P's print gates and product law; D keeps the print card's dash.

## Plan review

Not required (no trigger fired): no migration, no SECURITY DEFINER function, no public contract change (`routes.json`,
`CONTRACTS.md`, `llms.txt`, `docs/fixtures/` stay), no stored data or `localStorage` key, no new write or sync protocol.
`plan.md` Status takes "- Plan review: not required (no trigger fired) for batch D".

## DESIGN.md and FEATURES.md text this batch writes

DESIGN.md, "Shapes", "Named Rules", after The Pill Rule:

> **The Drop Rule.** A dashed border means "drop here": it marks a place that takes a dragged thing, and nothing else
> is dashed. The app has no such place: the list's drop mark is a 2px gold line, so the screen draws no dashed border.
> The print card's 0.4mm cut border is a cut line on paper, the one exception.

DESIGN.md, "Shapes", the borders paragraph:

> Borders are one pixel and a seam color, except where a border states something: a gold-tinted border marks a filter
> that has a value, and a border at about 45 per cent alpha echoes its own tag's hue. A border is solid (The Drop
> Rule).

DESIGN.md, "Colors", The Seal Rule: "The unique tag is neutral and dashed" reads "The unique tag is neutral".
DESIGN.md, "Badges", variants: "unique (dashed, Ash Violet on Seam Lit)" reads "unique (Ash Violet on Seam Lit, like
the tier tag; its word says it is a property)".
DESIGN.md, "Compact row": "A GM-only entry keeps its dashed box" reads "A GM-only entry keeps its box on the Vault Wall
ground".

DESIGN.md, "Empty state", first bullet:

> - `Empty`: a plate with a Seam border (`--line`) on the Vault Wall ground (`--bg2`), `--gap-plate` (16px) under the
>   block above it on every page - twice a chip row's gap, so it reads as the next block. Beside the filter column the
>   column and the plate share that top. The catalog adds the kind glyph in its art well (the only picture), the
>   heading «Ничего не найдено», one cause sentence and a primary reset while a filter is chosen.

DESIGN.md, "The One Width Rule", the measure sentence:

> ... the account at most 1100px, body prose at most 70ch (a help box 78ch), and a page lead at most 120ch, so a lead
> of one or two sentences takes one line while its column allows it; up to 760px it wraps in the column.

DESIGN.md, "Typography", "Hierarchy", Body: "Prose caps at 70ch." reads "Prose caps at 70ch (The One Width Rule)."

FEATURES.md: "The empty state is a dashed plate" reads "The empty state is a plate"; "the GM note in its dashed box"
reads "the GM note in its GM box"; "the GM note's box dashed on the darker ground" reads "the GM note's box on the
darker ground"; "The GM field is dashed." goes (the switch and the caption name the note); "A GM-only row has a dashed
border" reads "A GM-only row sits on the darker ground".

## Fold list (folded into `plan.md`, `plan-TD.md` and `handoff.md` on 2026-11-06; kept for the record)

1. `plan.md` Status: "Batch D (owner items 13 and 14, 2026-11-05): `plan-D.md` is its brief (decisions D-1 to D-8,
   steps S1-S10, acceptance 1-14, the four standing checks); `mocks/D/` is its mock. Defaults: AFK decisions file." and
   "- Plan review: not required (no trigger fired) for batch D".
2. `plan.md` section 7: a row for D in the batch table (split criterion as above, or "merged into T" if the owner
   picks option B of `plan-rebatch.md`), its place in the run order, and the inherited line for batch 10:
   "`.impeccable/design.json` regenerated by `document` draws no dashed tag (owner item 13, `plan-D.md`)".
3. `plan.md` section 8: D's row (100-140 min alone; 33-45 min more inside T).
4. `context.md` item 13: "Placed (planner): `plan-D.md`"; the two corrections (the drop mark is a 2 px gold line; the
   filter chip is not dashed). Item 14: "Placed (owner, via the orchestrator): batch D, `plan-D.md` D-6".
5. If merged with T: `plan-T.md`'s dispatch reads both briefs; one commit; T's acceptance 1-20 and D's 1-14; D's cases
   are 110 and 111, N's become 112 and 113 (`plan-N.md` preflight); the gates of the Verification lists run once each.
   `plan-N.md` preflight then also says: keep `.page-sub`'s 120ch (batch D) when `PageHead` moves, and expect the
   `/homebrew` first content at 1180 about 22 px higher than its measured 254 (N's S1 re-measures it).
