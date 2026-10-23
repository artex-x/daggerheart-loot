# Plan - TASK 57

This plan settles the design direction of the UI audit (phase 2) and orders
the phase 3 batches. Phase 1 findings are in `audit.md`; facts and owner
decisions are in `context.md`.

## Status

- Phase 1 (S1): done, triaged (`context.md`).
- Phase 2 (S2): done. The owner chose R (2026-10-23) and fixed its roll
  mode row (section 1). R now has a mock for every screen and state of the
  manual review round (`mocks/direction/index.html`, R first, by surface).
- Phase 3: batch 1 is implement-ready (section 8); batches 2-11 are
  outlines (batch 9 is 9a and 9b). Order (owner, 2026-10-23): no batch
  starts before R10 and `cloudflare-pages` have shipped. The owner's
  screen notes on the R states arrive before batch 1; a note changes the
  batch that owns the screen, and batch 1 only when it touches the font,
  the ramp, the tokens, the pressed default or the glyph. The batch 1
  dispatch refresh is the gate that re-checks the plan review's "Next
  action" list (section 8, "Dispatch refresh").
- Plan review: required before 1 (trigger: public contract change in batch 7)
- Plan review findings applied: reviews/plan-1.md
  - B1, Status, section 6, section 7 row 7 and inherited lines: batch 7 is a public contract change (`routes.json` `tab`); its same-commit set, its contracts gates and its batch review are listed.
  - B2, sections 4, 5 and 8: the family name comes from the installed package CSS (expected `'Source Sans 3 Variable'`) for `--ui`, `typo.js` and DESIGN.md; a `document.fonts` loaded check is an acceptance line.
  - B3, section 8: the art well covers `RecordCard`, `RowMain`, `TableRows`, `ListCard` and `ArtField`; `artSrc` and print keep `_none.webp`; the mechanism, the glyph mapping, the copy-image outcome and the tests that pin `_none.webp` are named.
  - B4, sections 5 and 8: the roll number and the stat line take the UI face's tabular figures; "The Numerals Rule" is a batch 1 rule; "roll number" left the mono list.
  - B5, sections 5, 6, 7 and 8: `FEATURES.md` "Chrome" (the font bullet) changes in batch 1; one `docs/decisions/` file for the font (batch 1) and one for the navigation (batch 7), both indexed.
  - B6, section 8: a bundle-budget step and acceptance line with the 0.4 kB headroom and the failure path; owner question Q1 in section 11.
  - R1, sections 7 and 8: P7 moved from batch 1 to batch 7, with its four quoting files and the DPCGL "License" kept.
  - R2, section 7: batch 9 split into 9a (`#/lists/<uuid>`) and 9b (`#/lists` and the add-to-list menu), each with its criterion and cost; the total is updated.
  - R3, sections 6, 7 and 8: the `cloudflare-pages` shape (`/assets/` paths, path links, the language switch stays a control) in batch 1 and batch 7; the EN wordmark scope is the header only.
  - R4, section 7 inherited lines: batch 7 stores the canonical section, maps each old address to its job and mode, names the lit control off the roll routes, the sticky rows and header height, and the `SupplementNav` removal set.
  - R5, sections 8 and 9: a new pressed or open state gets an `inventory.js` entry, RU and EN goldens and an axe case; the known ones per batch are listed; batch 1's `Chip` and `Seg` cases are named.
  - R6, Status, sections 6, 8 and 10, `context.md` Constraints: every "may run before R10" line is gone; the `typo.js` seed is a dispatch-refresh item.
  - R7, sections 7 and 8: each batch dispatch merges `main` into `claude/57`; batch 2 names `DEBT.md` D112 and D113.
  - N1, Status: the plan review line reads "required before 1" (the dispatch's trigger wording).
  - N2, sections 5 and 8: `--h-page-weight` and `--h-page-spacing` stay; only `--h-page-size` moves to `--t-page`; `tools/artwork/review/index.html` is a named reader.
  - N3, section 8: each icon path names its family (Material Icons, and Material Symbols for `swords`).
  - N4, section 8: batch 1 moves the language switch, the tables list/grid switch and the print colour/black-and-white switch.
  - N5, section 8 standing check 3: the interim gold «Все» does not reach `main` (one squash at closeout).
  - N6, `handoff.md` Status: pushed at `69f2178`.
  - N7, section 7 row 11: a re-audit defect goes to `DEBT.md`, or batch 11 takes the code and pays the full gate.
  - N8, section 7 inherited lines: batch 2's C57 decision covers the `#/p` compact note (C31); batch 8 applies it.
- NEEDS_HUMAN_CONFIRMATION: yes - one question, Q1 (section 11, the bundle
  budget), due before the batch 1 dispatch. The direction, the font, the
  dependency and the mode row are settled (`context.md`).

Mocks: `issues/57/mocks/direction/index.html` (R first, grouped by surface;
A, B and C follow as history; `compare-a.html` is the A1/A2 comparison).
R's states: `mocks/direction/R/state.html?s=<state>`, composed from
`R/states.js` and `R/r.css`. Shared code and the font specimen:
`mocks/direction/shared/`. Discovery came from the phase 1 triage; this
session had no question tool, so the Impeccable interview was replaced by
the owner's recorded decisions (`context.md`).

## 1. Chosen direction (R)

The owner chose R (2026-10-23): direction B, option B1, with A1's gold
budget, the Source Sans 3 font, and one part of C. Set: `mocks/direction/R/`
(six surfaces and 45 review states, 360 and 1180 RU, EN 360 where the text
is long).

| Part | Source | Reason |
|---|---|---|
| Three jobs (Бросок, Таблицы, Поиск), each with an icon before its label | B1; the icons from R's header mock | Every top-level place is visible at 360 in both languages, so no tab hides behind a scroll (C6, P9, D10). The icon helps a scan; the label stays at every width (theme 3). |
| Roll mode row: «Обычные правила», «Альт. таблицы» and one «Дополнения ▾» chip that opens a menu of the seven supplements | owner critique of B1's row (2026-10-23) | B1's row held two chips, a label and seven chips, and wrapped to two lines at 1180. Three controls hold one line at every width; the chip shows the active supplement in the current-place gold («Vault of Ages ▾»). |
| Filter column beside a column table at desktop width; a filter sheet at 360 | B1 | The GM compares weapons by column, and the panel no longer pushes the rows 570 px down (C3, C54). |
| Two-pane roller: controls on the left, results on the right | B1 | The result is the focus during play and the controls stay in reach (C39, C25). |
| Dossier item page, bottom-sheet dialog with a fixed action bar at 360 | B1 (A's sheet) | It uses the desktop width (C17) and keeps the actions reachable on a phone (C44). |
| List controls and notes in a side column | B1 | The first item is in view at once, and the controls do not wrap above it (A3, A1). |
| Strict gold budget | A1 | The Seal Rule is already the system's own law; A2 keeps gold on defaults, which is the defect C13 names. |
| Source Sans 3, self-hosted | font study (section 4) | It meets every hard requirement, and it is the only OFL candidate whose tabular figures and Cyrillic I could check on this host. |
| Roll results drawn as the card face (art fading into the plate, kind tag, stat ribbon) | C1 | It gives the one moment that matters at the table the register of the printed card, and it uses the fixed art at full width. |

Trade-offs accepted:

- The navigation changes shape, so a returning GM learns one new click
  ("Бросок" then the mode), and the plan pays three more batches than A (12
  against 9, after the plan review split batch 9).
- A switch from one supplement to another takes one more tap (open the
  menu, then pick). The two rule sets stay one tap away.
- At 360 the three mode controls share the width, so a label can take two
  lines inside its control («Обычные / правила», «Vault of / Ages»). The row
  itself stays one line.
- The mode chip keeps today's tab label «Альт. таблицы» while the H1 reads
  «Альтернативные таблицы», as today; the full name does not fit three
  controls at 360. FEATURES.md rule 4 departure, named in batch 7.

Mode row alternative (shown, not taken): one row of all nine modes that
scrolls sideways with an edge fade (`R/header__alt__360.png`,
`R/header__alt__1180.png`). It keeps every supplement one tap away, but it
hides modes behind a scroll at every width, which is the defect C6 names
for the tabs.

Tab icons: the app's own set (`app/src/lib/icons.ts`) supplies them, not the
mock's outline paths (`shared/kit.js`, drawn for the mocks, no external
source), so that the header uses one icon family. Бросок `die` (in the set,
from the shipped `app.js`), Таблицы `table` (in the set, Material Icons
`grid_on`, Apache 2.0), Поиск `search` (new: Material Icons `search`, Apache
2.0, the same family as `copy` and `table`). Width at 360: the three jobs
are a three-column grid, so the icons hide nothing (`R/header__360__ru.png`,
`R/header__360__en.png`).

Conflicts and how R resolves them:

- C's card name is set in heavy capitals; A1 allows capitals only for section
  labels (A39). R sets the name in title case at the title step.
- C draws the tier banner; the print vectors must not be redrawn. R shows the
  tier as a badge on screen and draws no banner.
- B's filter column needs a width the two system breakpoints do not give.
  R makes it a container query of the tables page, which the Two Breakpoints
  Rule allows for one component and its own measured problem.
- B's mode row and job tab are two "current place" marks on a roll page. R
  keeps both: the tab is a gold underline, the mode is the one gold fill.
  On a supplement page the gold fill is the «Дополнения ▾» chip, which then
  carries the supplement's name.

Considerations weighed before the choice (history):

- Density: B keeps the table density and adds columns; C loses about half of
  it in the grid and the list; A keeps today's density.
- Clarity rule: B has no hidden navigation and labels every action; A still
  hides two tabs at 360; C needs a dot row to tell a phone user that more
  cards follow.
- Fixed art: C uses it best, B well (4:3 crop window on results, 460 px on the
  item page), A as today. All keep the image bytes and use the kind glyph
  for a record without a picture.
- Fantasy register: C strongest, R takes C's card face for the roll result;
  A and B rely on the art and the font.
- Impeccable with no exceptions: all four pass the anti-pattern rules on the
  mocks; the remaining findings are DESIGN.md frontmatter gaps that the lock
  batch closes (section 2, "Detector").
- RU/EN length: B's job labels are short in both languages; A's five tabs are
  the longest strip at 360; C's capitals make RU names two lines in a 156 px
  card.
- Gate cost: A 9 batches, B 11, R 12 (after the batch 9 split), C 12
  (section 7).

## 2. Directions compared (history; R chosen)

The table records the comparison the owner chose from; R's row is the
chosen one.

| | A - polish in place | B - two-level index | C - card table | R - chosen (owner, 2026-10-23) |
|---|---|---|---|---|
| What changes | Rules enforced, font, type floor, labels, placeholder; layout and navigation stay | Navigation regrouped; filter column and column table; two-pane roller; dossier; list side column | A record is shown as its card: roll hand, card item page, card grid and card list | B1 + A1 gold + C card face on roll results; mode row of three controls (owner fix) |
| Options | A1 strict gold (in the set); A2 lenient gold (`catalog`, `roller`) | B1 three jobs in the header (in the set); B2 left rail and phone bottom bar (`header`, `roller`) | C1 screen card (in the set); C2 printed paper card on the item page (`item`) | - |
| Batches | 9 | 11 | 12 (the card face needs the exported vectors on screen) | 12 (batch 9 split by the plan review) |
| Risk | Low; the 360 tab strip stays a scroller | Medium; navigation spec and goldens change; a container query | High; density drops, print vectors on screen, long RU names in narrow cards | Medium, as B |
| Detector on the mocks | Passes the anti-pattern rules | Passes | Adds an 8.5 px step (the tier banner label) | Passes |
| Fit with the fixed art | As today: 56 px rows, 150 px result art | Good: 4:3 result art, 460 px item art | Best: art is the card's top, faded into the plate | Good, best on roll results |
| Clarity at 360 | Two tabs off-screen | All places visible | A deck that scrolls sideways | All places visible |

Detector: `impeccable detect --json issues/57/mocks/direction` after the
fixes found no anti-pattern (the striped GM-note ground and black mask stops
were removed). It still reports `design-system-font-size`,
`design-system-color` and `design-system-font`: the sizes, the gold gradient
stops `#e2b76c`/`#e8c27c`, the wash `#1b2b3d` and the font are not in the
DESIGN.md frontmatter. Batch 1 writes the new ramp and the font there; batch
11 records every remaining colour. `#6f8fb0` is the mock caption colour only.

Directions not taken, one reason each:

- A: it leaves C6 half fixed (a fade still hides two tabs at 360) and C17 as a
  narrower card.
- C: it halves the catalog density that 1459 records need, and it puts the
  print vectors on screen, which costs a batch and a print review.
- B2: a rail takes 236 px of every desktop page, and a phone bottom bar
  covers the toast and the selection bar (C12, C34).
- A2: gold on defaults is the defect C13 names.
- C2: white paper on the dark page is the brightest object on screen, and the
  printed card already has its own page (`#/p/<id>`).

## 3. The eight themes

| # | Theme | Decision | Rejected, one reason each | Settles |
|---|---|---|---|---|
| 1 | Gold spent on things nobody chose | Polish in place. Gold fill: one primary action per panel, a choice that narrows the view, the current place. A pressed default (`«Все»`), a mode toggle (view, language, prices) and a selection are neutral: a lit border and a check. Roll buttons are plain; the one that made the shown result keeps a gold border. Unique tag neutral dashed; footer links muted; roll number in the UI face. | A2 lenient budget: gold on defaults is C13. A second accent: two accents halve the signal. | C9, C13, C18, C25, C28, C45, C49, A4, A16, A26 |
| 2 | Help text repairs controls | Polish in place: each control says what it does (captions, option text, counts), so a panel holds nothing new. The three panels stay behind a labelled «Справка» button until the owner decides per batch mock (owner, 2026-10-23). | Remove the panels now: the owner keeps that decision per batch. Tooltips: they are help text in another place. | C1, C38, A27 (panel), clarity inventory |
| 3 | Labels change with the width | Polish in place: one action vocabulary, the same labels at every width, and one «Ещё» / "More" overflow for the rare actions. Vocabulary: «В список», «Поделиться», «Печать», «Ещё» (Скопировать текст, Скопировать название, Скопировать картинку, Скопировать ссылку, Копия в мои предметы). | Icon-only at 360 (today): fails the clarity rule. An action sheet per card: one more tap for the primary action. | C5, C18, C27, C40, A23, A36 |
| 4 | Navigation at 360 and after R10 | Redesign: three jobs with an icon before each label (B1) and a mode row of three controls: «Обычные правила», «Альт. таблицы», «Дополнения ▾» (a menu of the seven supplements; the chip shows the active one). «Бросок» opens the last roll section of this tab, else `#/roll/std`. The account control is «Войти» signed out and an initial with a chevron signed in, lit on `#/account`; the menu is the only path to «Мои списки». | A1 scroller with a fade: two tabs stay hidden. B2 rail: costs 236 px and a bottom bar. Shorter tab names: the names change between the menu, the tab and the heading. B1's row of nine chips: it wraps to two lines at 1180 (owner). One scrolling row of nine: modes hide behind a scroll at every width. | C6, C7, C27, C48, A28, A35, A37 |
| 5 | Type floor and caps | Polish in place with a new font: ten steps (23, 20, 18, 16, 15, 14, 13, 12, 11.5, numeral 19); data text 13 px at the least; capitals only for section labels and badges. | Keep Inter at 12 px: it is a local name most machines lack, and the detector flags it. Mono for stat lines: Cyrillic words in mono at 11 px are C33. | C2, C33, A5, A39 |
| 6 | Density on phones, space on desktop | Redesign for the catalog, roller, item and list (B1); polish for the rest. Rows: name with its tags after it, one stat line, one feature line, tags that repeat the active filter hidden, no tier in the stat line under a tier heading; a selection mode («Выбрать») replaces the always-on checkbox column. | C card grid: half the density. Keep the 520 px card: C17. | C3, C10, C17, C39, C54, C56, A1, A40 |
| 7 | Missing art | Polish in place. Every record has its image (C55 and C11 were a lazy-load capture artefact, `context.md`). A record with no picture (homebrew) and an image still loading show the kind glyph on the art well; the "?" pedestal moves to empty states. | Keep the pedestal on rows: it reads "unknown item", not "no picture". Generated art: the art is fixed. | C11, C55, A10, A38 |
| 8 | State and empty-state consistency | Polish in place: an empty or error page names the cause and one next step; a temporary choice lives where it is made, with no note; a dialog keeps its actions in a fixed bar. | A new empty-state illustration set: the art is fixed and the pedestal exists. | C16, C32, C44, C57, A18 |

## 4. Font

Today: no `@font-face`; `--ui` starts with the local name 'Inter', so Windows
renders Segoe UI, macOS SF and Android Roboto. `PrintCard.svelte` reads
`var(--ui)`.

Candidates (checked 2026-10-23 with a local parser of the font files, and with
the detector):

| Font | Licence | Cyrillic | Tabular figures | 12 px | Detector | Verdict |
|---|---|---|---|---|---|---|
| Source Sans 3 | OFL | full (upright and, in v3, italic) | default figures are tabular (`pnum` switches them off) | open forms, clear at 12-13 px | not flagged | chosen |
| PT Sans | OFL (ParaType) | Cyrillic-first design | no `tnum` | good | not flagged | rejected: stat numbers would need the mono face again (C33) |
| Golos Text | OFL (ParaType) | Cyrillic-first | not verified | good | not flagged | rejected for now: no local file to check `tnum` or to show in the mocks |
| Inter | OFL | full | `tnum` | good | flagged `overused-font` | rejected: the owner wants the exception gone |
| Open Sans, Roboto, Lato | OFL/Apache | full | `tnum` | good | flagged | rejected |

The mocks render Source Sans from OFL files copied to
`C:\Users\Ignat\.dhloot\notes\57\fonts\` (the Source Sans Pro release, whose
italic has no Cyrillic; the product takes Source Sans 3, whose italic has it).
Specimen: `mocks/direction/shared/fonts__1180.png`.

Loading: self-hosted woff2 from the build's own origin, Latin and Cyrillic
subsets with `unicode-range`, `font-display: swap`, the upright subset
preloaded. No font service. The service worker caches the files as hashed
assets (`ASSET_CAP` grows to hold them).

Family name: the `@fontsource-variable/*` packages declare the family as
`'<Name> Variable'`, so the expected name is `'Source Sans 3 Variable'`. The
package is not installed on 2026-10-23; batch 1 step 1 reads the name from
the installed package CSS, and `--ui`, `typo.js` `UI` and the DESIGN.md
frontmatter use that exact string. A local `'Source Sans 3'` is not listed
first: it would pass `typo.js` on a machine that has it and hide a missing
face on one that does not.

Recorded decision reversed: `FEATURES.md` "Chrome" says the owner dropped
self-hosted fonts, and DESIGN.md "The Local Font Rule" says "no `@font-face`
... ever". The owner reversed both on 2026-10-23 (`context.md`). Batch 1
rewrites both and records the choice in one `docs/decisions/` file.

Print: the new font does not reach the print cards. The card keeps today's
stack through a new token `--print-ui`. A print font change is a separate,
optional batch with the print checks and the owner's yes.

## 5. Token changes and DESIGN.md rules

Tokens (`app/src/styles/tokens.css`), each added with its first reader:

| Token | Value | Replaces |
|---|---|---|
| `--ui` | `'<family from the package>', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (expected `'Source Sans 3 Variable'`, section 4) | the Inter-first stack |
| `--print-ui` | today's `--ui` value | `var(--ui)` in `PrintCard.svelte` |
| `--t-page` | 23px | `--h-page-size` (same value); `--h-page-weight` and `--h-page-spacing` stay as they are |
| `--t-section` | 20px | 19, 20 |
| `--t-title` | 18px | 17, 18, 19 |
| `--t-body` | 16px | `--step-0` 15.5 |
| `--t-control` | 15px | 14 and 15.5 controls |
| `--t-small` | 14px | 13.5, 14 |
| `--t-data` | 13px | 11, 11.5 (mono stat line), 12.5, 13 |
| `--t-label` | 12px | 11.5 labels, 12 |
| `--t-badge` | 11.5px | 10.5, 9.5 |
| `--t-num` | 19px (mono) | 20 in the number field |
| `--art-well` | `#0a0810` | the literal in the record components |

`tests/app/typo.js`: `UI = '<family from the package>'` (the same string as
`--ui`), `SCALE = [23, 20, 19, 18, 16, 15, 14, 13, 12, 11.5]` (19 for the
numeral). Colours do not change.

Readers outside `app/src`: `tools/artwork/review/index.html` reads
`--h-page-size`, `--h-page-weight`, `--h-page-spacing` and `var(--ui)`.
Batch 1 moves its `--h-page-size` to `--t-page`; the other two tokens stay.

DESIGN.md rules changed (each written by the batch that ships it):

- The Local Font Rule becomes "one self-hosted family from the build's own
  origin; no font service; the print card keeps the local stack" (batch 1).
- The Numerals Rule becomes "a number a person compares has tabular
  figures: the roll number and the stat line take the UI face's tabular
  figures; the value in a number field, a rung in an upgrade chain, a
  quantity, a price and damage dice stay monospace" (batch 1; C33, C15).
- The Sixteen Steps Rule becomes a ten-step rule with the 13 px data floor
  (batch 1).
- The Seal Rule gains the budget of theme 1, with the neutral pressed
  default (batch 1).
- Capitals only for section labels and badges (batch 1).
- The kind glyph on the art well is the no-picture state (batch 1).
- Navigation: three jobs with icons and the three-control mode row replace
  the six-tab text; the wordmark is «Лут» in RU and «Loot» in EN, which
  replaces "never translated" (batch 7).
- The Two Breakpoints Rule: the tab-strip figures (the row scrolls under
  640 px, a 112 px header) give way to the measured header of batch 7.
- Empty state and error page: one pattern each (`R/pattern-empty__*`,
  `R/pattern-error__*`), written by the first batch that ships it (batch 2
  for the empty state, batch 3 for the error page).
- Book names stay Latin in RU (P13) (batch 2).
- The clarity rule, as a check, in "Notes"; the detector exceptions list,
  empty (batch 11).

## 6. Scope, contracts and dependencies

- In scope: every row of `audit.md` (section 7 places each), the post-R10
  shape, both languages, 360 to 1600.
- Not in scope: print card layouts and sheets (product law); new features;
  the surfaces R10 deletes; the link-preview Worker's card images (they keep
  their own font, `tools/artwork/fonts/`).
- Contracts that stay: routes, ids, links, asset paths, `data.js`. New: font
  files under the build's assets.
- Public contract change: batch 7. `docs/fixtures/urls/routes.json` pins the
  lit tab of every route (`resolves.tab`, the `href` of `nav.tabs
  a[aria-current="page"]`, read by `tests/app/contracts.js` and
  `app/src/lib/hash.test.ts`). The three jobs change that value on every
  roll route, and «Бросок» has a dynamic `href`. Batch 7 carries the
  same-commit set and the contracts gates (section 7) and needs a batch
  review.
- Specs that change: `FEATURES.md` "Chrome", the font bullet (batch 1);
  `META.md` section 9 (asset cache, batch 1); `FEATURES.md` "Chrome", the
  tab-bar bullets, "Consistency rules" rule 4 and the "Rolling" paragraph
  that cites the supplements panel (batch 7); `ROUTES.md` "Sections" and
  `CONTRACTS.md` section 1 (batch 7); `STATE.md` (the last roll section,
  memory only, batch 7).
- Decisions (`docs/decisions/`, indexed by `node tools/decisions.js`): the UI
  font (batch 1) and the navigation (batch 7), section 8 and section 7.
- Order (owner, 2026-10-23): every batch starts after R10 and
  `cloudflare-pages` have shipped. Batch 1 also touches files that R10
  changes (`ListPage`, `ListCard`, the `typo.js` seed `dhloot.lists.v2` and
  `#/lists/a`). `catalog-filter-links` touches `FilterBar`: whichever lands
  second merges the other.
- `cloudflare-pages` shape (its B1, read by the plan review): Vite `base:
  '/'`, absolute paths in `app/index.html`, every `href` through
  `app.href()`, `pathRouter`, `/sw.js` at scope `/`. The language switch
  rewrites the `/en` prefix with `replaceState` and stays a control; it does
  not become a link. The `CLAUDE.md` law "Preserve relative asset paths" may
  change with it; the batch 1 dispatch refresh reads the shipped form.

## 7. Phase 3 batch outline

Order (owner, 2026-10-23): no batch starts before R10 and `cloudflare-pages`
have shipped, and the owner's screen notes on the R states arrive before
batch 1. Each batch dispatch merges `main` into `claude/57` first (a merge
commit, never a rebase or a force-push), because batch 1 touches the type of
nearly every component and every later task on `main` (R10,
`cloudflare-pages`, `catalog-filter-links`) would otherwise conflict at the
squash. Each batch then builds to the R states named below; a note from the
owner's review edits that batch's mock first (in the batch's mock step,
under `issues/57/mocks/<N>/`), a help panel it touches is shown with its
replacement and asked about, and its `verify` rows are checked in a live
browser first. Every surface has an R mock, so no batch starts from a blank
mock.

| # | Batch | Audit ids | R states to build to | Split criterion |
|---|---|---|---|---|
| 1 | Foundation: font, ten-step ramp, tokens, gold primitives, art well | C2 (type), C9, C28, C33, A39, C55, C11, A10, A26 | all of `R/*` (every state shows the font, the ramp and the neutral pressed default) | a review that cannot be held in one pass: it moves every route's text metrics; layout work on top would hide its regressions |
| 2 | Catalog tables and filters | C1 (panel, ask), C3, C4, C5, C7, C8, C10, C12 (verify), C53, C54, C56, C57, C58, C59, A25, A40 (tables), P1, P13, P14, P15 | `R/catalog`, `R/catalog-*`, `R/pattern-empty` | a different route and filter set (`#/tables/*`) |
| 3 | Record card, actions, item page, dialog, `#/h` | C17, C18, C19, C20, C21, C22, C34 (verify), C40, C44 (verify), C45, C46, C47, A23, A24, P4, P5, P6 | `R/item`, `R/item-*`, `R/h-item`, `R/pattern-error` | a different component group and route (`#/i/`, `#/h/`, the dialog) |
| 4 | Roller pages and the card face on results | C23, C24, C25, C26, C36, C37, C38 (panel, ask), C39, C41, C43, C49, P10, P11 | `R/roller`, `R/roller-alt-crit`, `R/roller-mwt` | a different route and filter set (`#/roll/*`) |
| 5 | Homebrew editor | A6, A7, A8, A9 (verify), A11 (artefact, close), A12, A30, D14 (verify), D15, editor clarity rows | `R/editor`, `R/editor-errors`, `R/editor-crop`, `R/editor-conflict` | a different route (`#/homebrew/<id>`) |
| 6 | Homebrew pages and imports | A13, A27 (panel, ask), A28, A29, A38, A40 (homebrew), D5, D16 | `R/homebrew-*` | a different route and filter set (`#/homebrew` tabs) |
| 7 | Shell: header, jobs with icons, three-control mode row and supplements menu, account control, wordmark, EN spelling | C6, C27, C48, C52, A35, A36, A37, P7, P9, D9, D10, D11 | `R/header`, `R/shell-*`, `R/roller-supmenu` | a public contract change (`routes.json` `tab`) and a public spec change (`ROUTES.md`, `FEATURES.md` Chrome); it needs a batch review |
| 8 | Search, account, print preview, empty and error states | C13, C14, C15, C16, C29, C30, C31, C32, C60, A15 (verify), A31, A32, A33, A34, D7, D8 (verify) | `R/search-*`, `R/account-*`, `R/print-preview`, `R/pattern-*` | different routes (`#/search`, `#/account`, `#/p/`, error pages) |
| 9a | Account list page `#/lists/<uuid>`: notes, prices, picks, list roll, requests | A1, A2, A3, A4, A5, A22 (owner editor), A40 (list rows), A41, A42, list clarity rows (price toggle, requests) | `R/list`, `R/list-*` (note, share, prices, picked, sold, roll, selected, requests) | a review that cannot be held in one pass (`ListPage.svelte`, about 2400 lines, nine ids and eight inherited lines) and a different route (`#/lists/<uuid>`) |
| 9b | Lists page `#/lists`, list cards, lists import, add-to-list menu | A14, A16, A18, C35, C61, C62, D6, D20 | `R/lists-*`, `R/item-listmenu` | a different route and filter set (`#/lists`, and the add-to-list menu that the item pages open) |
| 10 | Shared list page `#/s/<token>` | A19, A20, A21, A22 (GM view), A40 (`#/s`), D2 | `R/shared-*` | a different route and filter set |
| 11 | Lock: DESIGN.md, detector clean, re-audit, closeout | C63 (artefact, close), all rows re-checked | none | docs and closeout only, unless the re-audit finds a defect (inherited lines) |

Every row of `audit.md` is placed above. Theme rows are decided in section 3
and implemented in the batch named. Rows cited only inside other rows (C36,
C41, C43, C46, C47, C50, C52, C60, C62, C64, A26, A36, A37) go with their
parent row's batch; C50, C64 and A26 go to batch 1 with C9 and C28. A40
(always-on checkboxes) is done per surface: tables in batch 2, homebrew rows
in batch 6, list rows in batch 9a, `#/s` in batch 10 (with A19).

Inherited acceptance lines (each is its own line in its batch):

- Batch 1: the `overused-font: inter` entry leaves `.impeccable/config.json`,
  and the detector passes on `tokens.css` without it.
- Batch 2: `DEBT.md` D112 (the tables chip panel has no navigation
  landmark) and D113 (the tables strip measures 162 px against its 150 px
  cap from 500 to 767 px) are fixed by the rebuilt panel and leave
  `DEBT.md`, or stay with a reason. Both are owned by `catalog-filter-links`:
  whichever of the two lands second merges the other.
- Batch 2: the C57 decision (where a temporary view choice lives) covers
  the `#/p` compact-sheet note (C31) too.
- Batch 7: the same-commit contract set (`CLAUDE.md`, "Specs are the
  behaviour source of truth"): `docs/fixtures/urls/routes.json` with the new
  semantics (`tab` becomes the lit job, `roll`, `tables`, `search` or
  `null`, because «Бросок» has a dynamic `href`; a new `mode` field holds the
  lit mode control's canonical section, or `null` off the roll routes),
  `tests/app/contracts.js`, `app/src/lib/hash.test.ts`, `tests/contracts.js`
  where it asserts the fixture, `docs/specs/CONTRACTS.md` section 1,
  `docs/specs/ROUTES.md` "Sections" and the `COVERAGE.md` rows that name
  `routes.json`. `llms.txt` names no tab bar today (checked 2026-10-23), so
  it changes only if the batch adds one. Gates: `node tests/run-all.js
  contracts,dataint` and `node tests/run-all.js app/contracts`. The batch
  takes a batch review before its squash.
- Batch 7: after `cloudflare-pages`, the job and mode links are paths
  through `app.href()`, and the contract test compares paths. The batch 7
  refresh reads the shipped router before it fixes the fixture form.
- Batch 7: «Бросок» opens the last roll section of this tab. The memory
  holds the canonical section (`SECTION_SLUG` in `app/src/lib/hash.ts`, the
  internal route string), never the raw address, so `#/roll/hnf` does not
  replay its source switch and `#/roll/dread` does not store an old id.
- Batch 7: each old address lights the right job and mode: `#/roll/core`,
  `#/roll/hnf` and `#/roll/all` light «Обычные правила»; `#/roll/dread`,
  `#/roll/voa` and every other supplement alias light the «Дополнения ▾»
  chip with that supplement's name. Both sets are `routes.json` replay rows.
- Batch 7: off the roll, tables and search routes no job is lit. The
  account control is lit on `#/account`, `#/lists`, `#/lists/<uuid>` and
  `#/homebrew` with its tabs (A37), because the account menu is the only
  path to them; nothing is lit on `#/i/`, `#/h/`, `#/p/` and `#/s/`, as
  today.
- Batch 7: the header rows and their sticky part are measured at 360 and
  1180 in both languages. The mock stacks the brand row, the jobs and the
  mode row (about 215 px at 360, against today's 112 px). The brand row and
  the job row stay sticky; the mode row scrolls with the page; the sticky
  part is no taller than today's 112 px at 360. `FEATURES.md` "Chrome" and
  DESIGN.md "The Two Breakpoints Rule" take the measured figures.
- Batch 7: C48 removes `SupplementNav`: delete `SupplementNav.svelte` and
  `supplementNav.test.ts`, its `COVERAGE.md` row and its `a11y.test.ts`
  `COVERED` entry, and rewrite the «Дополнения» departure of rule 4 and the
  `FEATURES.md` "Rolling" paragraph that cites the supplements panel.
- Batch 7: DESIGN.md records the EN wordmark «Loot». Its scope is the
  header wordmark only, as the owner's answer says; `<title>`, the manifest
  name and `en/index.html` keep their text.
- Batch 7 (P7, moved from batch 1 by the plan review): one English spelling
  app-wide, American, as the shipped "catalog" and the Daggerheart books
  print it ("Color", "license"). `footSummary` and `printColor` change in
  `app/src/lib/dict.ts`; the four files that quote them change with them:
  `shell.test.ts`, `printPage.test.ts`, `tests/app/print.js`
  (`dEn.click('Colour')`) and `FEATURES.md` "Chrome". The DPCGL notice keeps
  "License": it is the licence's own title. RU does not change. The batch's
  header change re-seeds every golden anyway.
- Batch 7: one `docs/decisions/` file for the navigation: three jobs and the
  three-control mode row; rejected: the scrolling tab strip with a fade, B2's
  rail and bottom bar, B1's row of nine chips, one scrolling row of nine.
  Indexed with `node tools/decisions.js`.
- Batch 7: the mode row has three controls at every width; «Дополнения ▾»
  opens a menu of the seven supplements, each a link to its section
  address, and on a supplement page the chip shows that supplement's name in
  the current-place gold (owner, 2026-10-23). The `SupplementNav` chip panel
  on supplement pages goes (C48), because the menu replaces it.
- Batch 7: each job shows its icon before its label at every width, from
  `app/src/lib/icons.ts` (`die`, `table`, and a new `search` from Material
  Icons, Apache 2.0); the sweep at 360 shows all three jobs in both
  languages.
- Batch 7: FEATURES.md "Consistency rules" rule 4 departure recorded: the
  mode chip «Альт. таблицы» and the H1 «Альтернативные таблицы».
- Batch 9a: icon-and-label controls share one vertical centre in every
  segment and button, at 360 and 1180: one 16 px icon box, one gap,
  `inline-flex` with `align-items: center`; a label beside an icon does
  not wrap under it (owner review, 2026-10-23; the note switch «Для
  игроков» / «Только для мастера» was off). Proof: a browser check that
  compares each icon's centre with its label's first line box, 1 px at
  most (the R mocks pass it at both widths).
- Batch 9a (A2): row actions are 24 px targets at the least; one note area
  with a «Для игроков» / «Только для мастера» switch replaces the two
  editors per row (`R/list-note`).
- Batch 9a (A3): the list controls sit in the side column; «Удалить» moves
  to «Ещё»; the share panel is two labelled link rows (`R/list-share`).
- Batch 9a (A42): «Бросить по списку» is a real button that opens the roll
  panel; the result shows as the card face with both notes (`R/list-roll`).
- Batch 9a (clarity, price toggle): the switch reads «Цены:» «Как в книге» /
  «Монетами», shows an example under it, and every price on the page
  follows it, rows, totals and the roll result included (`R/list-prices`,
  `R/list-picked`).
- Batch 9a (clarity, requests): «Новое в списке» shows was, taken and
  becomes per entry and names a short stock in words («Просили 9, в списке
  5»), with no «×9 из 5» or «(без цен: 1)» (`R/list-requests`).
- Batch 9a: the price, pick, sold, roll, selected and requests states of
  `tests/app/inventory.js` (`#/lists/a ~ prices*`, `~ picked`, `~ sold
  part`, `~ roll panel`, `~ rolled`, `~ a row ticked`, `~ batch deleted`)
  are browser-list states today. Each has an account-list state after this
  batch, with its golden: the batch adds the ones R10 `B10.3` did not
  move.
- Batch 9a: the `side-tab` entry for `ListPage.svelte` leaves
  `.impeccable/config.json`, and the detector passes on `ListPage.svelte`
  without it (owner, 2026-10-23).
- Batch 8: the batch 2 C57 decision is applied to the `#/p` compact-sheet
  note (C31).
- Batch 11: `ignoreValues` holds only exceptions that DESIGN.md "Notes"
  records (target: none), and `.impeccable/design.json` is regenerated.
- Batch 11: a defect that the re-audit finds goes to `docs/specs/DEBT.md`
  under the task that owes it, and batch 11 stays docs only; or batch 11
  fixes it in code and pays the full code gate (`check:fast` and a CI run
  with `e2e`, 35-45 min), named in its refresh.
- Each of batches 2-10: each new open or pressed state of section 9, item 5,
  has its `tests/app/inventory.js` entry, a golden in RU and EN and an axe
  case (`expectNoA11yViolations`) in the same change.
- Batch 2 and batch 4, batch 6: the owner's answer on each help panel.
- Each of batches 2-10: the owner's screen notes on its R states are
  applied or named as rejected by the owner.

Gate cost per batch (`.claude/README.md`, "Batch size and the fixed cost of a
run"): `npm run check:fast` 4-12 min (215-710 s), one CI run 10.5-11.5 min,
one review fix cycle (a second `check:fast` and CI run), and golden re-seeds
by CI's text where a11y text moves. About 35-45 min of gates per batch.
Extra local gates: batch 1 runs `node tests/run-all.js
app/print,app/typo,app/hues,stub` (about 5 min), because the print token
moves; batch 7 runs `node tests/run-all.js contracts,dataint` and `node
tests/run-all.js app/contracts` (about 6-7 min; `app/contracts` 343-364 s),
because it changes a public contract, and its batch review is the one fix
cycle already counted. Batch 9a and batch 9b pay 35-45 min each. Batch 11
has no code and pays one `check:fast` and one docs-only CI run (no `e2e`),
about 20 min.
Total: 11 code batches (1-8, 9a, 9b, 10) at 35-45 min (385-495 min), plus
about 12 min of extra local gates, plus batch 11 at about 20 min: about
417-527 min, so about 7-9 hours of gates. If batch 11 takes code, add 15-25
min.

Under the other directions (history, before the owner chose R):

- A: batch 7 becomes tab polish (fade, the account control, the wordmark);
  batches 2, 3, 4 and 9a lose their layout changes (no column table, no
  two-pane roller, no dossier, no list side column). 9 batches.
- B: as R, without the card face in batch 4.
- C: batch 3 and batch 4 take the card face for every record surface and
  need the exported vectors on screen (a new batch before 3, with the print
  checks); batch 2 makes the grid the main view. 12 batches.

## 8. Batch 1 - Foundation (implement-ready after its dispatch refresh)

Objective: ship the new UI font, the ten-step ramp, the type and art tokens,
the neutral pressed state, and the kind-glyph placeholder, with print
unchanged. No layout change.

Dispatch refresh (the gate before batch 1; it re-checks the plan review's
"Next action" and "Checks still needed" lists). It runs after R10 and
`cloudflare-pages` have shipped and the owner's screen notes have arrived.
It updates this section and `handoff.md` and adds no batch:

1. Merge `main` into `claude/57` (section 7).
2. The base path and the `app/index.html` form after `cloudflare-pages`
   (`/assets/` paths, the absolute `<link>` form), and whether the
   `CLAUDE.md` law "Preserve relative asset paths" changed.
3. The language switch: it stays a control (`replaceState` on the `/en`
   prefix); batch 1 moves only its pressed style.
4. The bundle total after R10: `npm run build`, then `npm run budget`
   (unconfigured), and the configured total from CI's last `deploy` log.
5. The `typo.js` seed after R10: today it seeds `dhloot.lists.v2` and visits
   `#/lists/a`, which R10 changes; batch 1 takes the post-R10 seed as it is.
6. The file list: `git grep -n -E "artSrc|var\(--ui\)|--h-page|--step-0" --
   app/src tools/artwork`, against "Files expected" below.
7. The owner's screen notes: a note that touches the font, the ramp, the
   tokens, the pressed default or the glyph becomes an acceptance line here;
   every other note goes to the batch that owns the screen (section 7).
8. Q1 (section 11) has the owner's answer, or the recorded default holds.

In scope: tokens, the font files and their loading, the type sizes in every
component (mechanical, to the nearest step of the table in section 5), the
neutral pressed default for `Chip` and `Seg`, the unique and roll-number
badges, footer link colour, the art well and glyph on every screen reader
of `artSrc`, the DESIGN.md and `FEATURES.md` rules listed under batch 1 in
sections 5 and 6, the font decision file.
Out of scope: navigation, layouts, labels, help panels, print layouts, P7
(moved to batch 7).

Files expected:

- `package.json`, `package-lock.json`: devDependency
  `@fontsource-variable/source-sans-3` (exact version; the owner said yes on
  2026-10-23). `package-lock.json` is hook-guarded: write it with `npm
  install --save-dev --save-exact`, never by hand. Fallback, only if the
  package lacks the Cyrillic italic subset: woff2 files from the Adobe
  release under `app/public/fonts/` with an `@font-face` in `tokens.css`.
- `app/src/main.ts`: import the upright and italic CSS of the package before
  `tokens.css` (or only its Latin and Cyrillic subset files, by Q1).
- `app/index.html`: one `<link rel="preload" as="font" type="font/woff2"
  crossorigin>` for the upright Latin and Cyrillic subsets, in the
  `/assets/` form of the `cloudflare-pages` build, if Vite rewrites it to the
  hashed file; else no preload (record why).
- `app/src/styles/tokens.css`: the tokens of section 5; `--ui` names the
  family string read from the package CSS (section 4); delete `--step-0` and
  `--h-page-size` after their readers move; `--h-page-weight` and
  `--h-page-spacing` stay.
- `tools/artwork/review/index.html`: `var(--h-page-size)` becomes
  `var(--t-page)`; nothing else.
- `app/src/components/PrintCard.svelte`: every `var(--ui)` becomes
  `var(--print-ui)`; nothing else.
- Components with a literal size: every `.svelte` file `git grep -n -E
  "font(-size)?:.*[0-9.]+px" -- app/src/components` lists, mapped to the
  tokens. Mono stays for a quantity, a price, the number field, damage dice
  and a rung in an upgrade chain; the roll number and the stat line move to
  the UI face with its default tabular figures (B4, C33, C15).
- `app/src/components/Chip.svelte`, `Seg.svelte`: a neutral pressed state for
  the default option (a prop that callers pass for «Все»/"All" and for mode
  toggles). This batch moves three callers: the language switch
  (`Shell.svelte`), the tables list/grid switch (`TablesPage.svelte`) and the
  print colour/black-and-white switch (`PrintSwitches.svelte`). The other
  `Seg` and `Chip` callers move in their own batches.
- `app/src/components/Badge.svelte`: unique neutral dashed; roll number in the
  UI face.
- `app/src/components/Shell.svelte`: footer links `--muted`, underlined.
- `app/src/lib/icons.ts`: the set has no glyph for a kind and no check mark
  today. Add five filled 24 px paths (Apache 2.0), each with its family and
  name in the comment, as for the toolbar entries: `kindArmor` (Material
  Icons `shield`), `kindConsumable` (Material Icons `science`), `kindItem`
  (Material Icons `diamond`), `check` (Material Icons `check`), and
  `kindWeapon` (Material Symbols `swords`; it exists only in Material
  Symbols). If a Material Icons name is missing, take the Material Symbols
  filled path and name that family. `copy`, `table` and the toolbar icons
  are Material Icons today. Each name gets its first reader in this batch.
- `app/src/lib/label.ts`: `kindGlyph(kind, t)` beside `badgeKind`: `t ===
  'armor'` gives `kindArmor`; `t === 'weapon'` or `'secondary'` gives
  `kindWeapon`; else `kind === 'consumable'` gives `kindConsumable`; else
  `kindItem`. Callers pass `it.kind, it.eq?.t` (a record) or the draft's
  kind and `t` (the editor). Test in `label.test.ts`, one case per branch.
- `app/src/components/ArtWell.svelte` (new; five callers, so it is extracted
  at once): the well (`--art-well`) with the kind glyph through `Icon.svelte`
  at 42% of the well in `--line2`, `aria-hidden`, and a `children` snippet for
  the caller's own `<img>`. Its own component test, with
  `expectNoA11yViolations`, and an `a11y.test.ts` `COVERED` entry.
- The screen readers of `artSrc` (`app/src/lib/desc.ts`): `RecordCard.svelte`,
  `RowMain.svelte`, `TableRows.svelte`, `ListCard.svelte` (the cover strip)
  and `ArtField.svelte` (the editor thumbnail; it takes a `glyph` prop that
  `HomebrewEditor.svelte` passes from the draft). Mechanism: `artSrc` keeps
  its result (`img/_none.webp` for no picture or a broken one), because
  print reads it. Each screen caller draws its `<img>` inside `ArtWell` only
  when `it.img` is set and `app.artBroken(it.id)` is false (the broken-image
  path), and draws the glyph alone otherwise. While a picture loads, the
  glyph shows under it.
- Kept on `_none.webp`: `PrintCard.svelte` (print law) and the editor's
  print preview (`PrintPreview.svelte`). `RecordActions.svelte` copy image:
  unchanged; «Скопировать картинку» shows only when `it.img &&
  !app.artBroken(it.id)`, so neither the placeholder nor the glyph is copied.
- Tests that pin `_none.webp` today: `desc.test.ts` and `printPage.test.ts`
  stay; `homebrewEditor.test.ts` keeps its print-preview case; the screen
  cases of `record.test.ts`, `tables.test.ts`, `listsPage.test.ts` (or its
  post-R10 successor) and `artField.test.ts` change to "no `<img>`, the glyph
  for the kind".
- `app/public/sw.js`: `ASSET_CAP` raised to hold the font files; `META.md`
  section 9 says so; `tests/sw.test.mjs` if it asserts the cap.
- `tools/bundle-budget.mjs`: only if the budget fails (step 9).
- `tests/app/typo.js`: `UI` (the package family string), `SCALE`, and the
  `document.fonts` check (acceptance).
- `app/src/components/chip.test.ts`, `shell.test.ts`: the neutral pressed
  case for `Chip` and for `Seg`, each ending with `expectNoA11yViolations`:
  `aria-pressed="true"` stays, the `check` icon is `aria-hidden`. The new
  branches meet the per-file thresholds (85/80/75/85; `Badge` 50 branches).
- `DESIGN.md`: the batch 1 rules of section 5 (The Local Font Rule, The
  Numerals Rule, the ten-step rule, the Seal Rule budget, capitals, the kind
  glyph) and the frontmatter typography (the package family string, ten
  steps) so the detector reads them.
- `docs/specs/FEATURES.md` "Chrome": the font bullet ("Self-hosted fonts
  were considered and dropped ...") becomes the shipped fact: one
  self-hosted family, Source Sans 3, from the build's own origin, the print
  card on its local stack through `--print-ui`.
- `docs/decisions/<date>-the-ui-font-is-source-sans-3-self-hosted.md` (from
  `.claude/templates/decision.template.md`): Task 57, the owner, 2026-10-23;
  Decision: Source Sans 3, self-hosted, `@fontsource-variable/source-sans-3`,
  `--print-ui` keeps print; Rejected: PT Sans (no `tnum`), Golos Text (not
  verified on this host), Inter (flagged `overused-font`), a font service
  (a third-party request; the owner's requirement). Then `node
  tools/decisions.js` rebuilds `docs/DECISIONS.md`.
- `.impeccable/config.json`: remove the `overused-font: inter` entry.
- `tests/app/inventory.js` and goldens: no new state; re-seed only what moves
  (the art well's a11y text where a homebrew record has no picture).

Behaviour and UI constraints: the R states in `mocks/direction/R/` for the
font, sizes, the neutral pressed chip (a check and a lit border, no gold:
`R/catalog__1180__ru.png`, the «Все» chips) and the glyph on the art well
(`R/homebrew-items__1180__ru.png`); no layout or label change in this batch;
print output byte-identical in layout (the print suite and `check:built`
prove it). An owner screen note applies to this batch only when it touches
the font, the ramp, the tokens, the pressed default or the glyph; the
dispatch refresh names any such note.

Steps:

1. Add the font dependency and import it. Read the family name from the
   installed package CSS (`@font-face` `font-family`, expected `'Source Sans
   3 Variable'`) and use that exact string in `--ui`, `typo.js` `UI` and the
   DESIGN.md frontmatter. Confirm with the parser that the upright and the
   italic files carry Cyrillic. Build with `npm run build:test` and confirm
   the woff2 files land under `dist-test/assets/` in the `/assets/` form of
   the `cloudflare-pages` build.
2. Add the tokens; move `PrintCard.svelte` to `--print-ui` and the review
   page to `--t-page`; run the print suite (`node tests/run-all.js
   app/print`).
3. Map every component size to the ramp; update `typo.js` (with the
   `document.fonts` check); run `node tests/run-all.js app/typo`.
4. Add the five icon paths to `icons.ts`. Add the neutral pressed variant
   (the `check` icon and a lit `--muted2` border, no gold) to `Chip` and
   `Seg`, with its component cases; use it for the language switch, the
   tables list/grid switch and the print colour/black-and-white switch;
   badges; footer links.
5. Add `kindGlyph`, `ArtWell` and the five screen callers; keep `artSrc`
   and print on `_none.webp` (keep the file: the empty-state pattern uses it
   from batch 2); update the tests that pin it.
6. Service worker cap, `META.md` section 9.
7. DESIGN.md rules and frontmatter, `FEATURES.md` "Chrome", the decision
   file and `node tools/decisions.js`; remove the Inter ignore; run the
   detector over `app/src`.
8. `npm run build`, then `npm run budget`.
9. If the budget fails: the measured headroom on 2026-10-22 is 0.4 kB in
   both builds (252.6 kB against 253 unconfigured, 310.6 against 311
   configured), and the font CSS (`@font-face` blocks for every subset,
   upright and italic) counts. Take the owner's answer to Q1 (section 11);
   with no answer, take its recommended option: raise the budget to the
   measured total rounded up to the next whole kB in the same commit, with
   the reason in the `tools/bundle-budget.mjs` comment (decision 2026-10-22,
   "The unconfigured bundle ceiling rises to 270 kB"). Past 270 kB
   unconfigured or 350 kB configured, stop and ask the owner. Name the
   outcome in `handoff.md`.
10. `rtk npm run check:fast`, commit, push, CI credit.

Acceptance criteria:

- The app renders in Source Sans 3 on a machine without it installed; no
  request leaves the origin for a font.
- In a real browser (`typo.js`), on a RU page and an EN page: the face of
  the package family is in `document.fonts` with `status === 'loaded'`, and
  `document.fonts.check('16px "<family>"', text)` is true for a Cyrillic and
  a Latin sample. The first name of the computed `font-family` alone is no
  proof.
- `typo.js` passes with the ten-step scale and the package family string.
- The print suite passes with no change to any print measurement.
- `impeccable detect --json app/src` reports no `overused-font` finding, and
  `.impeccable/config.json` has no Inter entry.
- A homebrew record with no picture, and a record whose picture is broken,
  shows the glyph of its kind (weapon, armor, consumable, item) on every
  screen surface (card, row, table tile, list cover, editor thumbnail); no
  screen surface shows the "?" pedestal; the print card and the editor's
  print preview still show `_none.webp`.
- «Скопировать картинку» is absent for a record with no picture or a broken
  one, as today.
- The language switch, the tables list/grid switch and the print
  colour/black-and-white switch show the neutral pressed state; gold is not
  used on them.
- `chip.test.ts` and `shell.test.ts` cover the neutral pressed state with
  `expectNoA11yViolations`; `ArtWell` has its own test and `COVERED` entry;
  the per-file thresholds hold.
- `icons.ts` holds `kindWeapon`, `kindArmor`, `kindConsumable`, `kindItem`
  and `check`, each with its family and name in the comment and a reader in
  this batch; `label.test.ts` covers each `kindGlyph` branch.
- `package.json` pins `@fontsource-variable/source-sans-3` to an exact
  version, and the parser check confirms Cyrillic in the upright and the
  italic files it ships.
- `npm run budget` passes, at today's budget or at a raise recorded in the
  same commit with its reason (step 9), and `handoff.md` names the outcome.
- `FEATURES.md` "Chrome" no longer says that self-hosted fonts were dropped;
  DESIGN.md "The Local Font Rule" and "The Numerals Rule" read as in section
  5; the font decision file exists and `docs/DECISIONS.md` lists it.

Verification: `rtk npm run check:fast` (Bash timeout 600000); `node
tests/run-all.js app/print,app/typo,app/hues,stub`; `npm run check:built`
(it runs the budget); push and CI credit (CI runs the sweep at 360, 390,
768, 1180 and the golden shards).

Risks and do-nots:

- The ramp change moves text widths everywhere; the sweep at 360 is the
  check. Do not change a layout to absorb it in this batch: list the overflow
  and fix the smallest cause.
- `TablesPage.svelte`'s scroll wait now waits for a real font; keep the wait
  and update its comment (the face exists now).
- The artwork review page under `tools/artwork/review/` draws the card head
  from the same CSS; it gets the font through the same import or keeps the
  fallback - name the outcome in the handoff.
- A picture with transparent areas would show the glyph through it. Count
  the `img/` files with an alpha channel in step 5; if any, hide the glyph
  on the image's `load` event and name it in the handoff.
- Do not touch print layouts, `PrintPage` structure or `card-vectors.css`.

Standing checks for batch 1:

1. Scale: no collection or cap changes. States: every route at 360 and 1180
   (sweep); the longest names (`Возвращающийся клинок`, a 100-character
   homebrew name) at 360 in both languages; a homebrew record with no
   picture and one with a broken picture in a card, a row, a tile, a list
   cover and the editor thumbnail; proof: sweep and typo suites, the
   component tests above.
2. Error scenarios: the font fails to load - `swap` shows the fallback stack
   and nothing is stored; offline - the cached font or the fallback; a stale
   tab - the old bundle keeps its own font links; a revert - the previous
   frontend ignores the font files; a broken picture - the glyph, as for no
   picture. No stored data changes.
3. Consistency: FEATURES.md rules 1-11 unchanged; the three switches this
   batch moves use the neutral pressed style. Interim departure: «Все» and
   the other default chips stay gold until batch 2 and their own batches.
   That mix is not on `main`, because the task branch reaches `main` as one
   squash at closeout.
4. RU/EN parity: no string changes (P7 moved to batch 7); the glyph and the
   pressed check carry no text.

## 9. Standing checks for the plan

1. Scale: each batch from 2 on writes its States table; the limits that the
   changed screens draw are the list caps (100 entries, 50 lists), the
   homebrew caps (100 items, 20 sources, 30 sections) and the 9 roll modes;
   the mocks cover one, many, the longest names and 360/1180. The sticky
   regions to measure: the filter sheet at 360 with the keyboard open (batch
   2), the editor's fixed bar (batch 5), and the header with its three rows
   at 360 and 1180 (batch 7, section 7). The supplements menu at 360 holds
   seven items in about 270 px and fits (`R/roller-supmenu__360__ru.png`).
2. Error scenarios: the redesign adds no write path. Batch 5 keeps the
   conflict state (A30, the primary must not overwrite); batch 9a keeps the
   list save, undo and limit states; each batch names load, failed read,
   failed write, offline, conflict, deleted record, stale tab and revert for
   its screen. The last roll section (batch 7) is memory per tab and loses
   nothing.
3. Consistency: rule 4 (one name) drives the job tab, the mode chip and the H1
   («Обычные правила» in all three; «Альт. таблицы» against the H1
   «Альтернативные таблицы» is the one departure, as today, named in batch
   7); rule 9 (the primary action first) drives the item and editor bars;
   rule 11 drives «Закрыть» on sheets. The empty-state and error-page
   patterns (`R/pattern-*`) give every load, empty and error state one
   shape: the cause, then one next step. A departure is named in its batch:
   DESIGN.md "The Numerals Rule" and the `FEATURES.md` font bullet (batch
   1); the «Дополнения» departure of rule 4 and the Two Breakpoints Rule
   figures (batch 7).
4. RU/EN parity: the R states exist in EN at 360 for the header, the item,
   the editor, the signed-out shell and save, both imports and the delete
   confirmation; every new string has both languages and the same facts;
   P5, P6, P7 (batch 7), D11, D15 and D16 close named gaps. The EN wordmark
   is the header only (batch 7).
5. New pressed and open states: each gets a `tests/app/inventory.js` entry,
   a golden in RU and EN and an axe case (`expectNoA11yViolations`) in the
   same change. Known ones: batch 1, the neutral pressed `Chip` and `Seg`
   (component cases only; the a11y tree keeps `aria-pressed`, so no new
   inventory state); batch 2, the filter sheet open at 360 and the selection
   mode («Выбрать»); batch 3, the «Ещё» menu open and the bottom-sheet
   dialog; batch 7, the «Дополнения ▾» menu open; batch 9a, the note switch
   («Для игроков» / «Только для мастера») and the list «Ещё» menu; batch 9b,
   the add-to-list menu in its new form. A batch refresh adds any other one
   it finds.

## 10. Risks, assumptions, deferred

- Assumption: Source Sans 3 italic carries Cyrillic in the version the batch
  installs; batch 1 checks it with the same parser before it ships.
- Assumption: the package declares the family `'Source Sans 3 Variable'`;
  batch 1 step 1 reads it from the installed CSS and uses what it finds.
- Risk: the font CSS passes the bundle budget (0.4 kB headroom); batch 1
  step 9 and Q1.
- Risk: the navigation change confuses returning users; the mode row keeps
  both rule sets one click away and each supplement two, and every address
  works.
- Risk: the owner's screen notes on 45 R states move a batch's scope. A
  change stays in the batch that owns the screen; only a public-contract
  change or a new route and filter set adds a batch.
- Order (owner, 2026-10-23): every batch waits for R10 and
  `cloudflare-pages`. If either slips, the task waits; no batch runs before
  them.
- Risk: the task branch lives for twelve batches before one squash; each
  dispatch merges `main` first (section 7).
- Deferred: a print font change (optional, owner's yes, own batch); the
  link-preview card images keep Inter; a Golos Text trial if the owner wants a
  Cyrillic-first face; the EN `<title>`, manifest name and `en/index.html`
  wordmark (the owner's answer covers the header only).

## 11. Owner decisions and the review round

Settled on 2026-10-23 (`context.md`, "Decisions already settled"): R, the
three-control mode row, the job icons, Source Sans 3 with the fontsource
dependency, the order (after R10 and `cloudflare-pages`).

Open question for the owner, due before the batch 1 dispatch:

- Q1, the bundle budget. Today: the budget is 253 kB unconfigured and 311
  kB configured, with 0.4 kB of headroom in each (2026-10-22); the font's
  `@font-face` CSS counts, the woff2 files do not. R10 removes code, so the
  total may still fit. If it does not:
  - Recommended: raise the budget to the measured total rounded up to the
    next whole kB, in the same commit, with the reason, as decision
    2026-10-22 allows under the 270 and 350 kB ceilings. Reason: the CSS
    is a few hundred bytes and the full subset set keeps Greek, Vietnamese
    and extended Latin homebrew text in the face. Trade-off: the budget
    grows by about 1 kB without a code change.
  - Alternative: import only the Latin and Cyrillic subset CSS (or write
    `@font-face` for those two). It keeps the budget, and other scripts
    render in the fallback face.
  With no answer, batch 1 takes the recommended option and records it.

Next: wait for R10 and `cloudflare-pages`, then the batch 1 dispatch
refresh (section 8). The owner's screen notes arrive before it; each note
goes to the batch that owns the screen (section 7) as its own acceptance
line; a note that touches the font, the ramp, the tokens, the pressed
default or the glyph goes to batch 1.
