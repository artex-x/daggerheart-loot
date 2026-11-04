# Batch W - Wide windows from 1181 to 3840 px (implement-ready, wave 2b)

This brief plans one batch, W. W designs and tests the pages of waves 1 and 2 (shell, tables, search, record
card and page, roll pages, homebrew, account, error pages, print) for windows wider than 1180 px, up to 3840 px.
It also audits which common viewport sizes the browser suites miss. It is scratch: the closeout deletes it, and
the rule goes to `DESIGN.md`, `FEATURES.md`, `COVERAGE.md` and one decision file in W's own commit.

## Status

- Batch W: planned (2026-11-04), not started. Implement-ready below ("Batch W").
- Place (owner, 2026-11-04, through the orchestrator): W is part of wave 2b. Order: batch 7b's fix pass, then W,
  then the wave 2b squash (7b and W in one squash onto `main`), then wave 3 (9a). W's tip is the squash tip: its
  green CI run and its CI credit arm the squash.
- Case number: W takes 101. Batch 9a keeps 98, 99 and 100 (`plan-9a.md`), although 9a now lands after W.
- Plan review: not required (no trigger fired). No migration or SECURITY DEFINER function, no public contract
  (`routes.json`, `ROUTES.md`, `CONTRACTS.md`, `llms.txt`, `tests/contracts.js` and `docs/fixtures/` do not change),
  no stored data or `localStorage` key, no write or sync protocol. A batch review is required after the
  implementer (trigger: changed UI; `tests/app/` changed).
- NEEDS_HUMAN_CONFIRMATION: no. Four owner questions have recommended defaults that block nothing (section 7).
- Sibling plan: `plan-wave3-wide.md` (another planner) applies this rule to the wave 3 surfaces (lists, `/s/`, the
  list roll). W changes `--wrap` for every page, so the wave 3 pages follow the new column from W on; section 1.3
  measured them: nothing breaks.

## 1. Survey of the built app

Method: the built app `dist-test/` of `d10ffa41` (batch 7b), a read-only Puppeteer probe through
`tests/app/lib.js`, RU, signed in as `gm3` (`gm1` for the account and the editor, `gm2` for print), 2026-11-04, on
this host. The probe scripts were scratch and are not kept. The fix-pass implementer edited `app/src` in this tree
during the survey, so the later runs bypassed the `dist-test/` mtime guard in the probe only; the build was the 7b
tip in every run. The CSS of the proposal was injected into that build (`--wrap: min(1440px, 100% - 32px)`, then
with the two caps of section 2), not built.

### 1.1 Today: the column stops at 1180 px

| Window | `main` width | Space left / right (the right side holds the 15 px scrollbar gutter) |
|---|---|---|
| 1180x720 | 1133 | 16 / 31 |
| 1366x650 | 1180 | 86 / 101 |
| 1440x900 | 1180 | 123 / 138 |
| 1920x1080 | 1180 | 363 / 378 |
| 2560x1440 | 1180 | 683 / 698 |
| 3840x2160 | 1180 | 1323 / 1338 |

Every page draws the same layout from 1213 px up; only the side space grows. No page scrolls sideways at any of
these widths. The first-screen tops are the same at every width from 1180 px: roll pages 267, tables 244,
`/search` 279, `/i/ci1` 89, `/homebrew` 254, the editor 175, `/account` 160, the print page 310.

### 1.2 Today, per page, at 1920x1080

| Page | What fills the 1180 px column | Measured |
|---|---|---|
| `/roll/std`, `/roll/alt` (4 results) | 320 px control pane, then the results, 838 px | four row faces of 376 px in a 2x2 grid, 18 px from each «или»; the last result ends at 747 (std) and 712 (alt) |
| `/roll/voa` (1 result) | the pane and one tall face | the face is 380 px (`FEATURES.md` "Rolling") |
| `/tables/core_item`, list | rows 1180 px wide, no filter column | a row's text ends 638 px from its left edge (`RowMain` caps it at 70ch): 542 px of every row is empty |
| `/tables/eq_weapon`, list | 250 px filter column, rows 910 px | 272 px of every row is empty |
| `/tables/voa`, grid | filter column, tiles | 5 tiles of 172 px; `core_item` (no column) 6 tiles of 187 px |
| `/search ~ searched` | rows 1180 px | 542 px of every row is empty |
| Record dialog | a 980 px card | the text runs at about 87 characters a line |
| `/i/ci1`, `/i/w65` (record page) | the dossier spans the column: a 460 px picture and a 688 px text column | about 114 characters a line (108 at a 1180 window): past a readable measure today |
| `/homebrew` | as the tables list | 542 px of every row is empty |
| `/homebrew/new` | the form, 704 px, and the 420 px sticky preview | the form's text box runs about 99 characters a line |
| `/account` | two columns, capped at 1100 px | 80 px free |
| `/p/<id>` | the 794 px sheet (A4 at 96 dpi), centered | no transform; nothing changes with the window |
| Error page | `ErrorPage`, capped at 62ch | not measured by the probe (its open timed out); the cap is in the CSS |

### 1.3 With the column at 1440 px (injected), what grows and what breaks

| Page | 1440x900 | 1920x1080 (also 1536, 2560, 3840) | Verdict |
|---|---|---|---|
| Header, mode row, footer, selection bar | follow the column | brand at the column's left, account at its right, one row | grows; no break |
| Roll pages (4 results) | cards 482 px, gaps 18/18 | cards 506 px, gaps 18/18; the roll ends at 675 (std), 637 (alt), was 747 and 712 | grows; better: shorter cards, the whole roll in the first screen |
| `/tables/*` list, `/search`, `/homebrew` | rows 1393 px, 755 px empty per row | rows 1440 px, 802 px empty per row | no break; trade-off (section 2.4) |
| Tables with the filter column | rows 1123 px | rows 1170 px | grows |
| Grid | voa 6 tiles, core 7 | voa 6 tiles of 185 px, core 8 of 170 px | grows: more tiles a line |
| Record page | text 150 characters a line | 158 characters a line | breaks: needs the dossier cap |
| Record dialog, sheets | 980 px, 560 px | the same | unchanged (own caps) |
| Editor | form 917 px | form 964 px; the text box runs about 150 characters, and the preview sits 1000 px from the field labels | breaks: needs the form cap |
| `/account` | 1100 px | 1100 px | unchanged (own cap) |
| Print page | sheet 794 px, centered | the same | unchanged |
| Wave 3 pages (`/lists`, `/lists/<uuid>`, `/s/`) | follow the column | `/s/` rows 1440 px, 760 px empty per row | no break; the wave 3 plan owns them |

With both caps (section 2) injected, measured at 1180x720, 1280x800, 1366x650, 1536x864, 1920x1080, 2560x1080
and 3840x2160: no sideways scroll; every first-screen top as in 1.1; the record page's dossier 980 px with its text
at about 92 characters a line at every width from 1180; the editor's form 682 px of content beside the 420 px
preview at 1920.

### 1.4 Why the column stops at 1440 px

- Line length. Prose is capped at 60-78ch and a row's text at 70ch, so a wider column adds empty space inside the
  rows, not text. The roll cards are the one surface whose text line grows with the column: at 1440 a card is
  506 px, about 60 characters a line; at a 1920 px column it would be about 750 px, about 95 characters, past a
  readable measure.
- Scan distance. The header puts the brand at the column's left and the account control at its right: 1440 px
  apart at a 1440 column, 3800 px apart at full width on a 4K window.
- Physical size. A 4K screen at 100% scaling is about 60 cm wide at 27 inches; a 1440 px column is about 22 cm of
  it, inside a comfortable reading arc. A person who wants the app larger uses the browser's zoom: at 150% a 4K
  window is 2560 CSS px, at 200% it is 1920.
- Nothing to put in a second column. A second column needs content. The candidate is a record side pane on
  `/tables/*` and `/search` (the dossier beside the rows, not a dialog), which is a new interaction surface with
  its own focus, address and accessibility rules, not a layout rule. It is named to the owner as a later
  candidate (section 7, Q2), not built in W.

## 2. The rule

### 2.1 Tokens

| Token | Today | W |
|---|---|---|
| `--wrap` | `min(1180px, 100% - 32px)` | `min(1440px, 100% - 32px)` |
| `--dossier-w` | (none; `RecordModal` writes `980px`) | `980px`: the record dialog's card and the record page's dossier |

No new breakpoint. The column grows with the window from 1213 px (where `100% - 32px` passes 1180) to 1472 px
(where it reaches 1440), then stays 1440 px and centered. A CSS custom property cannot sit in a media query, so a
breakpoint token is not possible without a build plugin (`@custom-media` is not native); the system keeps its two
breakpoints and the catalog's 1000 px step (DESIGN.md "The Two Breakpoints Rule"). Every window up to 1212 px
draws exactly as today, so every 360-1180 px test, golden and `FIRST_SCREEN` row keeps its numbers.

### 2.2 What grows

The header bar, the job row, the mode row, `main`, the footer and the selection bar (all on `--wrap`); list rows on
`/tables/*`, `/search`, `/homebrew` and the wave 3 pages; the rows beside the filter column; tile grids (more
columns, `minmax(168px, 1fr)`); the roll results (two wider cards a line, the same 2x2 for four).

### 2.3 What keeps its measure

| Surface | Width | Source |
|---|---|---|
| Record dialog | at most 980 px | `--dossier-w` (was the literal in `RecordModal`) |
| Record page dossier (`/i/`, `/h/`) | at most 980 px, at the column's left edge | `--dossier-w`, new; the page and the dialog are one dossier (DESIGN.md "The Dossier Rule") |
| Editor form | at most 720 px beside the 420 px preview, from 1100 px | `HomebrewEditor`, new local value, like its 340 and 420 |
| Account | at most 1100 px | unchanged |
| Bottom sheet | at most 560 px | unchanged |
| Filter column | 250 px | unchanged |
| Roll control pane | 320 px | unchanged |
| Prose (lead, cause, notes, row text) | 60-78ch | unchanged |
| Print sheet | the paper | unchanged; browser-measured fitting stays (product law) |

A capped surface sits at the column's left edge, so the brand, the first control and the first word keep one
left edge (DESIGN.md "The One Width Rule"). Only the column is centered.

### 2.4 Trade-offs accepted

- From 1213 px the record page's dossier changes: at a 1180 window it was 1133 px with about 108 characters a
  line; it becomes 980 px with about 92, the picture 392 px instead of 453. The page leaves 153 px free on the
  right at 1180, 460 px at 1440 and up. Reason: one dossier width on the page and in the dialog, and a readable
  line.
- List rows grow with the column and their text does not: at 1920 about 800 px of each row is empty, against 542
  today. The alternative, capping the rows at a measure, breaks the one left and right edge of the list head, the
  search row and the selection bar above them (section 7, Q1).
- From 1472 px the side space grows: 240 px a side at 1920, 560 at 2560, 1200 at 3840.

### 2.5 Spec homes, all in W's commit

- `app/src/styles/tokens.css`: the two tokens and their comments.
- `DESIGN.md` "Layout": the first paragraph gives the new `--wrap`, the growth from 1213 to 1472 px and the
  centered 1440 px column; "The One Width Rule" gains one sentence: "From 1472 px the column stays 1440 px and
  centered; a reading surface keeps its measure at the column's left edge: the dossier at most 980 px
  (`--dossier-w`), the editor's form at most 720 px, the account at most 1100 px, prose at most 78ch." Amend,
  do not add a named rule ("Layout" holds nine). Also: "320 px is the narrowest width a page is built for (WCAG
  1.4.10)" (Q4).
- `FEATURES.md` "Chrome": one bullet: the page column is the window less 16 px a side, up to 1440 px, centered
  above that. "Records": the record page's dossier is as wide as the dialog's card, at most 980 px, at the
  column's left edge. "Homebrew": from 1100 px the editor's form is at most 720 px beside the 420 px preview.
- `docs/specs/COVERAGE.md`: case 101 in the `app/states` list; a "Width coverage" note in "Known thin spots"
  (section 3.4); the run's case count.
- Decision file `docs/decisions/<date of W>-the-page-column-grows-to-1440-px-then-centers.md` from
  `.claude/templates/decision.template.md`: context (owner item 7, the survey numbers), decision (section 2),
  alternatives (keep 1180; 1600 px; full width; a stepped `xl` breakpoint at 1440; a second column or record side
  pane; capped list rows), consequences (section 2.4), status Accepted; then `node tools/decisions.js`.

## 3. Viewport audit

### 3.1 Sizes the suites use today

| Width (heights) | Where |
|---|---|
| 320 (568, 390) | cases 88, 89, 91, 92, 93 |
| 360 (640, 480, 740, 800, 840, 1180) | `sweep.js`, case 83 (`FIRST_SCREEN`), goldens, many cases |
| 390 (844, 900) | `sweep.js`, cases |
| 412x915 | one case (states.js, case 89's list) |
| 500, 600, 700 | `sweep.js` 768 run, the head at narrow widths |
| 560, 600, 640x360, 720, 760, 761 | single cases (landscape phone, breakpoint edges) |
| 768 (900, 1024) | `sweep.js`, cases |
| 900, 960, 1000, 1050 | single cases (cases 96, 97) |
| 1100x900 | the golden default width (`golden.js`) |
| 1180 (720, 900, 950, 1000, 1600, 520, 480) | `sweep.js`, case 83, most cases, `hues.js`, `typo.js`, `print.js` |
| 1280x900 | `contracts.js` (routes and links, no geometry) |
| 1919x980 | case 97 (`ROLL_FIT`, six roll states) |

Thresholds in the code: `max-width` 380, 400, 430 (component), 600, 640/641 (container `faces`), 760/761 (system),
800 and 1100 (editor), 1000 (system, catalog and account), `max-height` 480/481; and, after W, the column's knees
at 1212 and 1472 (not breakpoints).

### 3.2 Common viewports against the suites (measured 2026-11-04, RU, `d10ffa41`)

| Viewport | Class | Covered | Measured | Action |
|---|---|---|---|---|
| 280x653 | folded phone (cover screen) | no | every surveyed page scrolls sideways (roll, tables, search, record, editor, account) | Q4: name 320 px as the floor in DESIGN.md; no test, no fix |
| 320 | small phone | yes (cases) | - | none |
| 360 | phone | yes (sweep, goldens, case 83) | - | none |
| 375 | phone | by equivalence: the same side of the 380 query as 360 | - | none |
| 390 | phone | yes (sweep) | - | none |
| 412x915 | phone | one case | clean: no sideways scroll; roll top 323 of 366 | none |
| 430x932 | phone | no, but the edge of `NumberField`'s 430 query | clean: roll top 317 of 373 | none |
| 600-720 (690x840) | unfolded foldable | single cases at 600, 640, 720 | clean: roll top 310 of 336; the record page's text runs 107 characters a line (picture above, full width; below 761) | none in W (named in 3.4) |
| 768 | tablet portrait | yes (sweep) | - | none |
| 810, 820, 834 | tablet portrait | between 768 and 1000 | clean at their heights; `/tables/eq_weapon` RU starts at 382 at 820 and 834 (toolbar on two lines) | fact for 7b's Deferred item (3.3) |
| 761-999 at 720 high | split window, small laptop | no | catalog tables start at 334 (core) and 382 (eq, 761-834) to 291 (999), past the 288 line | 3.4; not a rule breach (the rule names 360x640 and 1180x720) |
| 1024x768 | tablet landscape | case 97 at 1000x720 | four roll results stack in one column (pane 635 px, under the 641 container step), the first two in view as `ROLL_FIT` asks; `/tables/eq_weapon` starts at 288, on the line | none |
| 1112, 1194 | tablet landscape | by 1180 | clean | none |
| 1280x800 | small laptop | `contracts.js` only | with W: column 1248, clean | covered by case 101's 1366 |
| 1366x768 (about 650 inside the browser) | laptop | no | roll top 267 and `/search` 279 against 260 (40% of 650): 7 and 19 px past; the first results' names are in view | Q3: keep 720 as the rule's height; log 1366x650 in case 101 |
| 1440x900 | laptop | no | with W: column 1393, clean | covered by equivalence (between 1366 and 1536) |
| 1536x864 | laptop at 125% | no | with W: column 1440 reached, side 41 px, clean | covered by equivalence (at the cap) |
| 1600, 1680 | desktop | no | the layout of 1536 with more side space | by equivalence |
| 1920x1080 | desktop | case 97 (1919x980) | with W: section 1.3 | case 101, shots |
| 2560x1080, 3440x1440 | ultrawide | no | with W: 2560x1080 clean, the roll ends at 675 | by equivalence with 3840 (the column is fixed) |
| 2560x1440 | QHD, 4K at 150% | no | with W: as 1920 | shots |
| 3840x2160 | 4K at 100% | no | with W: column 1440, side 1193 px, clean | case 101, shots |
| 640x360, 844x390, 932x430 | phone landscape | 640x360 (cases 72, 85, 88) | 932x430: clean; roll faces stack (pane 543 px); `/tables/eq_weapon` starts at 334 of 172: a landscape phone shows the head only | none (the rule is set at portrait sizes) |

### 3.3 A fact for batch 7b's fix pass (not W's)

`handoff.md` "Deferred" names the `eq_*` toolbar on two lines "at 761-about 800 px in RU". Measured: the first row
starts at 382 from 761 to 834 px (`eq_weapon`, RU, gm3), at 334 from 850 to 950 px (as `core_item` at every width
from 761 to 950, and as `eq_weapon` in EN at 761, 850 and 950), at 291 at 999 px and at 288 at 1000 px (on the
line). So the two-line RU toolbar reaches at least 834 px, and the mid band's catalog head puts the first row at
334 on every table. The fix pass edits `TableNav.svelte` now; the orchestrator gives it this fact.

### 3.4 Recommended added set and its cost

| Addition | Covers | Cost |
|---|---|---|
| Case 101 at 1366x768, 1920x1080, 3840x2160 (RU) and 1920x1080 (EN), ten states, with a 1180x720 baseline | the column, its centering, the caps, no sideways scroll, unchanged first-screen tops, 4K | about 2-3 min of runner time a CI run, inside `app/states` |
| `shoot.js` at 1920x1080 and 3840x2160 (RU), 1920 (EN) for two pages | the look, for the review and the owner | about 5 min, local, once (evidence, not a gate) |
| COVERAGE "Known thin spots": the 761-999 x 720 catalog tops, the 280 px floor, 1366x650 | the gaps named, not tested | prose |
| Not added: a `sweep.js` width at 1920 or 3840 | - | it would cost about 220-400 s of runner time per CI run, every run |

Why no sweep width: from 1472 px the layout does not change with the width (the column is fixed; only the side
space grows), so a sweep at 1920 and one at 3840 repeat each other, and case 101 asserts the width-invariance at
3840. Between 1213 and 1471 the column is fluid and case 101's 1366 run samples it. The sweep's failure classes
(sideways scroll, clipped text, the head's height) get less likely with more width, and the wide-only contracts
(the caps, the centering) are case 101's. One 3840 shot per page type is enough for the same reason. If the owner
wants the sweep anyway (Q1's alternative), it is one `run-all.js` row `['app/sweep', 'dist-test/: page sweep 1920
ru', <CI seconds>, ['1920', 'ru']]` and `tests/derived.js`'s matrix check.

## 4. Mocks

No Figma or HTML mock. The change is one token and two caps, drawn by the built app, and the survey's injected
shots were the mock pass (1920 and 3840, before and after, scratch). Mocks are direction, not law, and the
built shots of `shoot.js` (step W8) are the evidence the review and the owner read. If the owner asks for a
look before the implementer: the brief is the thirteen page types of step W8 at 1920x1080, RU, today and with
section 2's CSS injected into `dist-test/`, side by side.

## 5. Ordering and cost

- After batch 7b's fix pass is committed and pushed and its CI run has concluded. W's dispatch re-reads
  `DESIGN.md`, `FEATURES.md`, `COVERAGE.md` and `tests/app/states.js` after that commit (the fix pass edits
  `DESIGN.md`, `FEATURES.md`, `TableNav.svelte` and `sweep.js`).
- Before the wave 2b squash. The squash takes 7b and W together after W's review, its fix cycle, the green CI run
  of W's tip and `ci-credit.mjs` on that tip with a clean tree.
- Split criterion: none; W is one batch (one component family of CSS, one browser case, one route set).
- Gate cost of W: local about 20-30 min (the affected vitest files and both lints, about 5 min; `check:built`
  about 3 min; the artwork test and `node tools/decisions.js`, seconds; case 101 once through a loader, about 3
  min; `shoot.js`, about 5 min; `rtk npm run check:fast`, 215-840 s); one CI run, about 11 min and 65-70
  runner-minutes; one batch review. A fix cycle repeats `check:fast` and the CI run. No golden re-seed ("Goldens expected to move").

## 6. Batch W

### Objective

Grow the page column with the window up to 1440 px and keep it centered above that; keep each reading surface at
its measure; prove it at 1366, 1920 and 3840 px.

### In scope

- `tokens.css`: `--wrap` and `--dossier-w`.
- `RecordModal.svelte`: the card's width from `--dossier-w`.
- `RecordCard.svelte`: the page dossier capped at `--dossier-w`.
- `HomebrewEditor.svelte`: the form column capped at 720 px from 1100 px.
- `tests/app/states.js`: case 101.
- `DESIGN.md`, `FEATURES.md`, `COVERAGE.md`, one decision file, `docs/DECISIONS.md` (generated).
- `issues/57/mocks/W/built/shoot.js` and its shots (evidence).

### Out of scope

- A record side pane or any second column (Q2).
- The wave 3 surfaces' own layout (`plan-wave3-wide.md`); they follow `--wrap` with no edit.
- The mid-band catalog head (3.3: 7b's fix pass or its Deferred), the 280 px overflow (Q4), the record page's text
  line below 761 px (3.2, 690 px row).
- Print: no change to the sheet, its fitting or the print media rules.

### Files expected

| File | Change |
|---|---|
| `app/src/styles/tokens.css` | `--wrap`, `--dossier-w`, comments |
| `app/src/components/RecordModal.svelte` | `width: min(var(--dossier-w), 100%)` |
| `app/src/components/RecordCard.svelte` | `max-width: var(--dossier-w)` on the dossier from 761 px |
| `app/src/components/HomebrewEditor.svelte` | `grid-template-columns: minmax(0, 720px) 420px` from 1100 px |
| `tests/app/states.js` | case 101 and its `CASES` row |
| `DESIGN.md`, `docs/specs/FEATURES.md`, `docs/specs/COVERAGE.md` | section 2.5 |
| `docs/decisions/<date>-the-page-column-grows-to-1440-px-then-centers.md`, `docs/DECISIONS.md` | new, generated |
| `issues/57/mocks/W/built/shoot.js` and PNGs | evidence |
| `tools/artwork/lib.test.mjs` | only if `CARD_HEAD_SHA256` moves (step W2) |

### Constraints

- Mocks are direction; the specs win; the survey's numbers are the target, within 2 px.
- No new breakpoint, no `viewport.ts` change, no new band. `--wrap` stays the one container (The One Width Rule).
- A capped surface sits at the column's left edge; do not center a capped surface inside the column.
- No change at or below 1212 px windows except the record page's dossier from 1013 px (section 2.4). Every other
  360-1180 px number stays.
- Do not touch `PrintCard`, `PrintPreview`'s fit, the `@media print` blocks or `--print-ui`.

### Steps

#### W1. Tokens

In `tokens.css`, set `--wrap: min(1440px, 100% - 32px)`. Comment: "The page container, off `.wrap`: one width for
the header and the content, centered. It grows with the window to 1440 px; past that only the side space grows
(DESIGN.md, "Layout")." After it add `--dossier-w: 980px` with the comment "The record dialog's card and the record
page's dossier: one width for one dossier (DESIGN.md, "The Dossier Rule")."

#### W2. The dossier

1. `RecordModal.svelte`: `width: min(980px, 100%)` becomes `width: min(var(--dossier-w), 100%)`.
2. `RecordCard.svelte`, in the existing `@media (min-width: 761px)` block, `.card.dossier` gains
   `max-width: var(--dossier-w);`. The dossier in the dialog is 930 px, so the rule does not change it.
3. Run `node --test tools/artwork/lib.test.mjs`. If `CARD_HEAD_SHA256` moves, read `renderCard` in
   `tools/artwork/review/review.mjs` as its message says, then set the new hash.

#### W3. The editor

`HomebrewEditor.svelte`, the `@media (min-width: 1100px)` block: `grid-template-columns: minmax(0, 720px) 420px;`.
Comment (one line): "The form keeps its measure past 1180 px: a wider form only moves the preview away (964 px at
1920, measured 2026-11-04)." At a 1180 window the form is 695 px, under the cap, so nothing moves there.

#### W4. Check the rest

Search for literal container widths that bypass `--wrap`: `git grep -n -E "max-width: 1[0-9]{3}px|width:
min\([0-9]{3,4}px" -- app/src`. Today: `AccountPage` 1100 (keeps it), `RecordModal` 980 (W2). Anything else found
is reported, not changed, unless it breaks at 1920 in the shots.

#### W5. Case 101

In `tests/app/states.js`, after case 97, add:

```js
/** 101. The page column grows with the window to 1440 px and stays centered past it; a reading
 *  surface keeps its measure at the column's left edge (DESIGN.md, "The One Width Rule"). */
```

- `WIDE_STATES`: `#/roll/std`, `#/tables/eq_weapon`, `#/tables/eq_weapon ~ grid searched`, `#/search ~ searched`,
  `#/i/ci1`, `#/search ~ relations, dialog as gm3`, `#/i/nope`, `#/homebrew as gm3`, `#/homebrew/new as gm1`,
  `#/account as gm1`, `#/p/set-emberaxe as gm2`. Each must exist in `inventory.js`; a missing one fails the case
  with its id.
- Sizes: the baseline 1180x720 RU; then 1366x768 RU, 1920x1080 RU and EN, 3840x2160 RU; log 1366x650 RU (no
  assertion; prints the primary top against 260). Open each with `openState(id, width, height, lang)`.
- Assertions at every size but the baseline:
  1. `main`'s width equals `min(1440, clientWidth - 32)` within 1 px, and its left and right space inside the
     client area differ by at most 1 px.
  2. The brand link's left edge and the footer's left edge equal `main`'s left edge within 1 px.
  3. No sideways scroll: `scrollWidth <= clientWidth`.
  4. The first `[data-primary]` with a height starts within 2 px of its baseline top.
  5. Caps: a `.card.dossier` (page or dialog) is at most 980.5 px wide; in a dialog the dialog's card is at most
     980.5 px; `.hbform` is at most 720.5 px and `.preview` 420 px within 1 px; the account's panel grid is at
     most 1100.5 px; the print sheet's width equals its baseline width within 1 px and its `transform` is `none`.
  6. Roll results: the cards of a pair have equal widths within 1 px, the two gaps to the «или» pill differ by
     at most 1 px, and at 1920x1080 every result's bottom is inside the window.
  7. The header is one row: `.topbar`'s height equals its baseline height within 1 px (63 px in both
     languages).
- Write each measure with `fs.writeSync(1, ...)` as case 97 does, so a CI log reads the numbers.
- `CASES` row: `['101 (the page column grows to 1440 px and stays centered)', pageColumnOnWideWindows]`.
- The case runs once locally through an in-memory loader (as batches 4 to 7b did for a new case); CI's
  `app/states` is the proof.

#### W6. COVERAGE.md

The `app/states` list gains case 101 with its sizes; the run's count (case count and run count) follows the
header of `states.js`. "Known thin spots" gains a "Width coverage" entry: the suites run 320-1180 px and case
101's 1366, 1920 and 3840 px; from 1472 px the layout is width-invariant, so no sweep width runs past 1180; not
asserted: the catalog head at 761-999 px x 720 (tops 291-382 against 288), 1366x650 (roll 267, `/search` 279
against 260; logged by case 101), and widths under 320 px (280 overflows; 320 is the floor).

#### W7. Prose and decision

Section 2.5, in W's commit. Run `node tools/decisions.js` (0 problems).

#### W8. Evidence

`issues/57/mocks/W/built/shoot.js`, from `mocks/7b/built/shoot.js`: viewport shots (not full page) at 1920x1080
and 3840x2160 RU, and 1920x1080 EN for `/roll/std` and `/tables/core_item`: `/roll/std`, `/roll/voa`,
`/tables/core_item` (list), `/tables/eq_weapon` (column), `/tables/voa` (grid), `/search` with «меч», the dialog
over «Первоклассный Спальный Мешок», `/i/ci1`, `/homebrew as gm1`, `/homebrew/new as gm1`, `/account as gm1`, a
nine-card print page, `#/i/nope`. The set is evidence, not a gate.

#### W9. Impeccable

The orchestrator runs `polish` and `harden` on `Shell`, `RecordCard` and `HomebrewEditor` from the W8 shots at
1920 and 3840; `handoff.md` gives the outcome.

### Acceptance criteria

- At 1920x1080 and 3840x2160 `main` is 1440 px wide and centered; at 1366x768 it is the window's client width
  less 32 px (case 101, items 1 and 2).
- At every window up to 1212 px every page draws as before W, except the record page's dossier from 1013 px: no
  golden, no `FIRST_SCREEN` top and no 360-1180 px case moves (CI).
- The record page's dossier is at most 980 px at every width and starts at the column's left edge; the dialog's
  card reads its width from `--dossier-w` (case 101 item 5; shots).
- From 1100 px the editor's form is at most 720 px beside the 420 px preview (case 101 item 5).
- The account, the sheets, the filter column, the roll pane and the print sheet keep their widths (case 101 item
  5; shots).
- Roll results at 1920x1080: two equal cards a line, equal gaps to «или», the whole roll inside the window (case
  101 item 6; case 97's 1919x980 rows still pass).
- No page scrolls sideways at 1366, 1920 or 3840 (case 101 item 3).
- The first-screen tops at 1366, 1920 and 3840 equal the 1180 tops within 2 px (case 101 item 4).
- The header is one row at 1920 in RU and EN (case 101 item 7).
- 1366x650 tops are logged by case 101 (fact for Q3).
- `tokens.css`, `DESIGN.md`, `FEATURES.md`, `COVERAGE.md` and the decision file say section 2.5's text;
  `node tools/decisions.js` reports 0 problems.
- The artwork guard passes (`node --test tools/artwork/lib.test.mjs`).
- The detector, the spelling grep and the shots of W8 are done; `polish` and `harden` are the orchestrator's (W9).
- Gates pass; CI is green on W's tip; the CI credit is armed on it for the wave 2b squash.

### Standing checks

1. Scale. W changes what a screen draws above 1212 px only (and the record page's dossier from 1013 px). It does
   not change a collection, a cap or a text field, so the empty, one, many, limit, past-limit, 3x and longest-name
   states draw as before at 360 and 1180 px. The new rows:

   | State | What the screen shows | Proof |
   |---|---|---|
   | Each W5 state at 1366, 1920, 3840 | the column grows, then stays 1440 and centered; caps hold | case 101 |
   | Many: four roll results at 1920 | two 506 px cards a line, the roll ends at 675 | case 101 item 6, case 97 |
   | Many: 300 own items on `/homebrew` at 1920 | 1440 px rows, one column, as today | unchanged in code; case 68 runs at 1180 |
   | Longest name: a 120-character name on a row at 1920 | wraps inside the 70ch row text, as at 1180 | unchanged |
   | Record page at 1180 | the dossier 980 px, text about 92 characters a line | case 101 baseline log, shots |
   | Each row at 360 px | unchanged | goldens, sweep 360 |
   | Each row at 1180 px | unchanged but the record page | goldens, sweep 1180, case 101 baseline |

   Row order, the primary action's place, popups and sticky regions do not change: the dialog stays 980 px in the
   window's center, menus anchor to their buttons, the editor's sticky preview keeps its `max-height`, and the
   filter column keeps its sticky top.
2. Error scenarios. Not applicable for data - no write path and no stored shape. The screens: loading, a failed
   read, offline and the error pages draw inside the same column with their own caps (`ErrorPage` 62ch, case 101
   opens `#/i/nope`). A stale tab draws the old 1180 column until it reloads. A revert restores the 1180 column
   and the uncapped page dossier; no data is involved.
3. Consistency. Follows DESIGN.md "The One Width Rule" (one container, one left edge), "The Two Breakpoints Rule"
   (no new breakpoint), "The Dossier Rule" (the page and the dialog are now one width too) and `FEATURES.md`
   rules 7 and 9 (page heads and the primary's place do not move). Sibling pages: every list page (tables,
   search, homebrew, and the wave 3 lists) spans the column with its head, search row and selection bar; every
   reading page (record, editor, account, print, error) keeps its measure at the left edge. No departure.
4. RU/EN parity. No new string. Case 101 runs EN at 1920 to check the header and the heads in the longer
   language.

### Goldens expected to move

None. W changes CSS only; a golden is the accessibility tree and the controls, so no `_*.txt` moves. A moved
golden is a defect of the batch: report it, do not re-seed.

### Tests

| Test | Change |
|---|---|
| `tests/app/states.js` | case 101 |
| Vitest | none: jsdom computes no layout; no component's DOM changes |
| `tools/artwork/lib.test.mjs` | only the hash, if W2 moves it |

### Verification

One command per call; a browser suite does not run locally except case 101 once (W5).

1. `npx vitest run app/src/components/record.test.ts app/src/components/recordHost.test.ts
   app/src/components/homebrewEditor.test.ts` (no change expected), then `npm run lint:untyped` and
   `npm run lint:typed`.
2. `node --test tools/artwork/lib.test.mjs`.
3. `node tools/decisions.js`: 0 problems.
4. `npm run build:test`, then case 101 once through a loader; then `node issues/57/mocks/W/built/shoot.js`.
5. `npm run check:built`; the bundle does not grow by more than 0.1 kB.
6. `impeccable detect --json --no-inline-ignores app/src` and the spelling grep over the touched files and prose.
7. `rtk npm run check:fast` (Bash timeout 600000), last.
8. Commit (`feat(ui): grow the page column to 1440 px on wide windows`), push, CI. CI's `app/states` (case 101,
   case 83, case 97), `app/golden` (no move), `sweep.js`, `app/print` and `e2e` are the browser proof. Then the
   batch review, its fix cycle, the CI credit on the tip, and the wave 2b squash.

### Risks and do-nots

- Do not center a capped surface; the left edge is the rule.
- `clamp(260px, 40%, 460px)` of the dossier's picture now reads 40% of 980: the picture is 392 px at most on the
  page. Do not change the clamp.
- `contracts.js` runs at 1280x900: the column there grows from 1180 to 1248 px. It checks links, not geometry;
  a failure there is a real defect, not a stale number.
- `print.js` runs at 1180x950: below 1213 px, so the print page's numbers do not move.
- Do not add a `sweep.js` width or a `run-all.js` row unless the owner picks Q1's alternative.
- Review order: `tokens.css`, `RecordCard.svelte`, `RecordModal.svelte`, `HomebrewEditor.svelte`, case 101, the
  prose.

### Fallback

If the review or the owner rejects the record page's change at 1180 (section 2.4): keep the page dossier
uncapped and cap only its text column at 70ch (`.card.dossier .card-body { max-width: 70ch }`). Trade-off: the
page then holds up to 460 px of empty card on the right at 1920.

### Writer tests

| Test | Answer |
|---|---|
| 1 (a step asks for a choice, or an `Open design question:`) | no: Q1-Q4 have defaults that block nothing |
| 2 (public contract, route, stored state, product law, migration, hook, configuration) | no: CSS and one browser case; print untouched |
| 3 (visual judgment: print fitting, a golden re-seed, parity with a design node) | partly: the shots carry the look; no golden, no design node |

## 7. Questions for the owner (defaults taken if no answer before W's dispatch)

- Q1. List rows past 1440 px. Current: rows span the column, so at 1920 about 800 px of each row is empty.
  Recommended: keep it; the list head, the search row, the selection bar and the rows share one edge. Trade-off:
  sparse rows on a wide screen. Alternative: cap the rows at about 980 px and leave the head full width (two right
  edges on one page). Second alternative, about the tests: a permanent `sweep.js 1920 ru` CI row (about 220-400 s
  a run).
- Q2. A second column. Recommended: none in W; record a record side pane on `/tables/*` and `/search` from 1440
  px as a later candidate. Trade-off: the side space stays empty above 1472 px. Alternative: plan the side pane
  now as its own batch with mocks (a new surface: focus, address, Escape and print rules).
- Q3. Short laptops (1366x768, about 650 px inside the browser). Current: the roll page and `/search` start 7 and
  19 px past the 40% line at that height. Recommended: keep 720 px as the First-Screen Rule's height and log 650
  in case 101. Trade-off: on such a laptop the first result starts just under the 40% line, with its name in
  view. Alternative: move the rule's wide height to 650 px, which fails two route families today and needs head
  work.
- Q4. Windows under 320 px (folded phones, 280 px). Current: every page scrolls sideways at 280. Recommended:
  name 320 px as the narrowest width in DESIGN.md "Layout" (WCAG 1.4.10 reflow is defined at 320). Trade-off: a
  folded cover screen keeps a sideways scroll. Alternative: a 280 px pass of every page (its own batch, a sweep
  width).
