# Sibling-page navigation: one placement and one style (outline for batch N; owner item 11)

Purpose: answer the owner's question of 2026-11-05 ("why roll pages are between page title and header and table pages
are after header? can we unify these behavior?", and "consistent with items page") with the facts, three options and
one recommendation. The owner answers interactively; nothing here is built. Measured on the built `dist-test/` of
`d8e30731` with DOM moves (`mocks/N/`: `navprobe-roll-tables.cjs`, `navprobe-homebrew.cjs`, the PNGs, the JSON).

## 1. The three placements today

Level 1 is the header's three jobs (Бросок, Таблицы, Поиск) on every page. Level 2 is a row of sibling pages inside
one job. Offsets are the top of the page's primary content at 1180x720 (limit 288, `FIRST_SCREEN`), RU and EN equal
unless noted.

| Family | Siblings | Placement from 1000 px | 761 to 999 px | Up to 760 px | Style | First content |
|---|---|---|---|---|---|---|
| Roll (9 pages, `ModeRow` in `Shell`) | «Обычные правила», «Альтернативные таблицы», «Дополнения ▾» | its own full-width row ABOVE the page title, outside `main`, with a rule below; it scrolls with the page; 53 px | same | the same row, 40 px pills, the `h1` hidden | pills, the current one gold-filled | 267 at 1180, 1000 and 768; 323 at 360 |
| Tables (`TableNav` in `PageHead`) | level 2: seven group chips; level 3: the books of the group | the chips in the title row beside the `h1`, the pin and «Об этих данных»; the tabs in a reserved row under it | both levels on their own rows under the title | one picker button and a sheet; the `h1` hidden | chips (gold fill) and underlined tabs (gold text) | 244 at 1180 (EN 1000 too); 288 RU at 1000; 334 at 768; 252 at 360 |
| Homebrew (`HomebrewTabs` in `PageHead`) | Предметы, Источники, Комплекты, Карты правил, each with a count | the tabs in the title row after the pin, «Новый предмет» at the end | the same row, wrapped to a second line in RU (head 93 px) | one picker button and a sheet | underlined tabs only | 254 at 1180; 301 RU at 1000 and 768; 243 at 360 |
| Search, lists, list page, `/s/`, account, editor | none (the search kind chips are filters, not pages) | - | - | - | - | - |

The differences: where the siblings sit (above the title, beside it), their style (pills, chips plus tabs, tabs
only), and what carries the page name (the lit pill on the roll pages, the `h1` on the others). The roll row is the
only one outside `main`; `DESIGN.md` "A steady head" (batch 7b) exists because the table head jumped when its content
moved, and the roll row never jumps because it is outside the page.

## 2. Options

| | A. Siblings in the head row (recommended) | B. Siblings above the title, as the roll row | C. Keep the placements, align the style only |
|---|---|---|---|
| Rule | Level 2 (modes, groups, sections) is pills in the head row after the `h1` or its place, the pin and the help; from 761 to 999 px on its own row under it. Level 3 (the parts of one collection: books, sources) is underlined tabs under the head row. Up to 760 px: the pills when all fit in one row (roll, 3), else one picker and a sheet (tables, homebrew). | One full-width row under the header, above the `h1`, with a rule, on all three families (the roll row copied). | Roll stays above the title; homebrew tabs become pills; tables stay. |
| Roll at 1180 | the mode pills join the pin and help row; the `h1` is visually hidden (the lit pill is the name, as at 360); first content 267 to 210 | unchanged, 267 | unchanged, 267 |
| Tables at 1180 | unchanged, 244 | chips leave the title row for a row above it: 244 to 306, past 288 | unchanged |
| Homebrew at 1180 | four pills with counts in the title row, «Новый предмет» at the end; offset about the same (pills are 32 px, tabs 40 px; mock to measure) | the tabs get a row above the title: 254 to 309, past 288 | four pills in the title row, as A |
| At 360 | no change (roll row, picker rows) | no change for roll; tables and homebrew keep the picker | no change |
| Roll at 761 to 999 px | RU wraps the pills to a second line (768 RU: first content 252; EN 210) | unchanged | unchanged |
| Cost | `Shell` and `RollPage` markup move; nine roll pages and `/homebrew` goldens at 761 px and above (about 25 to 35 states); `FIRST_SCREEN` rows `/roll/*` get room, `ROLL_FIT` limits loosen only; the steady head check on the roll pages | `FIRST_SCREEN` needs two named exceptions or a fold of the tabs; every `_tables_*` and `_homebrew*` golden at 761 px and above moves | one CSS edit in `HomebrewTabs`; fits 9b |
| Answers the owner's question | yes, all three families | yes, at the price of first screens | no: the roll row stays elsewhere |

## 3. Recommendation (not a decision)

Option A. Reason: level 1 (the jobs) already is the app's top bar, so level 2 is part of the page's own head and reads
with its heading, pin and help as one unit (the Material guide puts tabs under the top app bar only when the tabs are
the page's main structure; here the jobs are). One placement and one style per level is the consistency the owner
asks for, and it spends no new row above the content: B costs 62 px on the tables and 55 px on `/homebrew` and breaks
the First-Screen Rule at 1180, while A gives 57 px back on the nine roll pages. Trade-off accepted: the roll pages
lose the full-width rule line and the visible `h1` from 761 px (the lit pill names the page, as it does up to 760 px,
`DESIGN.md` "The Roll Page Rule"); the pills wrap in RU from 761 to 999 px as the table chips do; the roll row is
inside the page, so a switch between two roll modes must not move it (a case: one `RollPage` instance, the same top
and left of the pills before and after a mode switch, focus kept).

A second question inside A, for the owner: the homebrew tabs become pills with counts («Предметы 44») as level 2
(recommended: the same style on `/tables` and `/homebrew`); keeping them underlined makes `/homebrew` the one family
with tabs as level 2.

## 4. Batch

Its own batch N (outline), after T and before P. Criterion (`CLAUDE.md`, "Size a batch by its gates"): a different
route set (the nine roll pages from 761 px, `/homebrew`) and its own goldens, against 9b's list pages and T's
up-to-600 px re-baseline; 9b already costs 95-130 min and T 65-90, so a fold into either adds a review that could not
hold both. Gate cost: the mock (8-10), the re-seed of about 25-35 states (8-12), `check:built` and lints (4-5), the
loader runs of the roll and `FIRST_SCREEN` cases (6-8), `polish` and `harden` (5-10), one CI run and one review:
about 70-90 min. If the owner picks C, the one edit rides in 9b (`HomebrewTabs` CSS and its goldens; HomebrewPage is
already a 9b file for Field Measure).

Mock note: `mocks/N/` from the built app of T's tip with DOM moves (the probe scripts move `nav.modes` into
`.page-head` and hide the `h1`; homebrew pills by injected CSS) at 360, 768, 1000, 1180 and 1920 px, RU and EN, on
`/roll/std`, `/roll/alt`, a supplement page, `/tables/eq_weapon` and `#/homebrew as gm3`; Impeccable `critique` by the
orchestrator. Built so far: the 1180 RU shots and the offsets (`mocks/N/`).

Open design question N1 (owner): A, B or C. Open design question N2 (owner, only with A): the homebrew tabs as pills
(recommended) or underlined.

Plan review: not required (no contract, route, stored key or write path changes).
