# Sibling-page navigation: one placement and one style (outline for batch N; owner item 11)

Purpose: record the owner's question of 2026-11-05 ("why roll pages are between page title and header and table pages
are after header? can we unify these behavior?", and "consistent with items page"), the three options, and the
owner's answers: N1 = option A with a visible page heading on every family, N2 = the homebrew tabs become pills with
counts. Nothing here is built. Measured on the built `dist-test/` of `d8e30731` with DOM moves (`mocks/N/`:
`navprobe-roll-tables.cjs`, `navprobe-homebrew.cjs`, `navprobe-roll-h1.cjs`, the PNGs, the JSON).

## 1. The three placements today

Level 1 is the header's three jobs (Бросок, Таблицы, Поиск) on every page. Level 2 is a row of sibling pages inside
one job. Offsets are the top of the page's primary content at 1180x720 (limit 288, `FIRST_SCREEN`), RU and EN equal
unless noted.

| Family | Siblings | Placement from 1000 px | 761 to 999 px | Up to 760 px | Style | First content |
|---|---|---|---|---|---|---|
| Roll (9 pages, `ModeRow` in `Shell`) | «Обычные правила», «Альтернативные таблицы», «Дополнения ▾» | its own full-width row ABOVE the page title, outside `main`, with a rule below; it scrolls with the page; 53 px. The visible `h1` below it is the lit mode's name (a duplicate of the lit pill) | same | the same row, 40 px pills, the `h1` hidden | pills, the current one gold-filled | 267 at 1180, 1000 and 768; 323 at 360 (`/roll/std`), 251 (`/roll/alt` and supplements) |
| Tables (`TableNav` in `PageHead`) | level 2: seven group chips; level 3: the books of the group | the `h1` «Таблицы», the pin, «Об этих данных» and the chips in one title row; the tabs in a reserved row under it | both levels on their own rows under the title | one picker button and a sheet; the `h1` hidden | chips (gold fill) and underlined tabs (gold text) | 244 at 1180 (EN 1000 too); 288 RU at 1000; 334 at 768; 252 at 360 |
| Homebrew (`HomebrewTabs` in `PageHead`) | Предметы, Источники, Комплекты, Карты правил, each with a count | the `h1` «Мои предметы», the pin and the tabs in the title row, «Новый предмет» at the end | the same row, wrapped to a second line in RU (head 93 px) | one picker button and a sheet | underlined tabs only | 254 at 1180; 301 RU at 1000 and 768; 243 at 360 |
| Search, lists, list page, `/s/`, account, editor | none (the search kind chips are filters, not pages) | - | - | - | - | - |

The differences: where the siblings sit (above the title, beside it), their style (pills, chips plus tabs, tabs
only), and what the title says (the lit mode's name on the roll pages, the job or the page on the others). The roll
row is the only one outside `main`; `DESIGN.md` "A steady head" (batch 7b) exists because the table head jumped when
its content moved, and the roll row never jumps because it is outside the page.

## 2. Options

| | A. Siblings in the head row (owner's choice, N1) | B. Siblings above the title, as the roll row | C. Keep the placements, align the style only |
|---|---|---|---|
| Rule | Level 2 (modes, groups, sections) is pills in the head row after the visible `h1`, the pin and the help; from 761 to 999 px on its own row under the title row. Level 3 (the parts of one collection: books, sources) is underlined tabs under the head row. Up to 760 px: the pills when all fit in one row (roll, 3), else one picker and a sheet (tables, homebrew). | One full-width row under the header, above the `h1`, with a rule, on all three families. | Roll stays above the title; homebrew tabs become pills; tables stay. |
| Roll at 1180 | see section 3 | unchanged, 267 | unchanged, 267 |
| Tables at 1180 | unchanged, 244 | chips leave the title row for a row above it: 244 to 306, past 288 | unchanged |
| Homebrew at 1180 | four pills with counts in the title row, «Новый предмет» at the end; offset about the same (pills 32 px, tabs 40 px; the mock measures) | the tabs get a row above the title: 254 to 309, past 288 | four pills in the title row, as A |
| Cost | `Shell` and `RollPage` markup move; the roll pages and `/homebrew` goldens from 761 px (about 25-35 states) | two named exceptions or a fold of the tabs; every `_tables_*` and `_homebrew*` golden from 761 px moves | one CSS edit in `HomebrewTabs` |
| Answers the owner | yes, all families | yes, at the price of first screens | no |

## 3. Option A with a visible page heading (owner's correction to the first mock)

The first mock hid the roll page's `h1` and let the lit pill name the page. The owner asked "where have we lost the
page header?", so every family keeps a visible `h1` from 761 px, in the same title row, before the pin, the help and
the pills. The three titles are the job or page names the other families already use: «Таблицы», «Мои предметы» and,
for the roll pages, the job name.

Recommended roll wording: «Бросок» / "Roll" (`jobRoll`, an existing key, so no new string). Reason: it is the same
pattern as «Таблицы» on `/tables` and «Поиск» on `/search`, where the `h1` is the header tab's own word and the lit
pill or the tab names the page below it. It reads as a duplicate of the header's «Бросок» tab exactly as «Таблицы» does
of its tab, which the owner has not objected to. The alternative «Бросок костей» / "Dice roll" needs two new strings,
and the lead line already starts with «Бросок Костей Дуальности»; not recommended. The old `h1` (the mode's name,
`pageStd`, `pageAlt`, a supplement) would sit beside an identical lit pill, so it goes; the lit pill and
`aria-current` name the mode (check: the document title keeps naming the mode).

Measured with the visible `h1` (`mocks/N/measure-roll-h1.json`, `/roll/std`, `/roll/alt`, `/roll/mwt`,
`/roll/wondrous`, `/roll/voa`; RU and EN equal unless noted):

| Window | Today (first content) | Option A, visible `h1` | Head | Where the row breaks |
|---|---|---|---|---|
| 1180x720 | 267 | 214 (-53) | one row, 37 px | never: the last pill ends at 859-942 px (RU), 682-750 px (EN) |
| 1000x720 | 267 | 214 (-53) | one row, 37 px | never; the longest case (`/roll/wondrous` RU) ends at 942 of 984 px, 42 px to spare |
| 768x1024 | 267 | 256 (-11) | title row plus the pills on their own row, 79 px | by rule: the pills take their own row from 761 to 999 px, at the same height in RU and EN |
| 360x640 | 323 `/roll/std`, 251 others | unchanged | the mode row above the page, the `h1` hidden | not applicable |

Shots: `mocks/N/roll-std__1180__ru__h1.png`, `roll-alt__1180__ru__h1.png`, `roll-mwt__1180__ru__h1.png` (the longest
supplement label), `roll-alt__768__ru__h1.png`. A prior probe without the rule-based own row wrapped the pills one
per line at 768 RU (head 113 px, first content 290); the rule above (pills on their own row below 1000 px) is what the
batch builds, so the head does not depend on the language or on the page.

Trade-offs, stated plainly:
- The title row is longer: «Бросок», the pin (about 190 px), the help (about 140 px) and the pills (about 520-560 px)
  take 859-942 px of the 968 px column at 1000 px. The headroom is 42 px in RU on the longest supplement label; a
  longer label would break the "one row from 1000 px" rule and make the head depend on the page. The batch measures
  the longest label in both languages at 1000 and 1050 px before it fixes the threshold, and raises it (to 1100 px, one
  more step in this row only) if a label does not fit.
- Below 1000 px the head is two rows (title row, then the pills), as the tables and homebrew heads are: first content
  at 256 px at 768, 11 px higher than today.
- The roll pages lose the full-width rule line and the row above the title; the roll row is now inside the page, so a
  switch between two roll modes must not move the title or the pills (a case: one `RollPage` instance, the same top and
  left of the `h1` and the pills before and after a switch, the focus kept).
- Up to 760 px the roll `h1` stays visually hidden. The mode row above the page names the mode (the lit pill) and the
  header's lit «Бросок» tab names the job; tables and homebrew hide theirs for the same reason, their picker names the
  page.
- The `h1` of a roll page no longer names the mode; the mode is the lit pill with `aria-current="page"` and the
  document title.

## 4. Recommendation and answers

N1 (answered by the owner, 2026-11-05): option A, with a visible `h1` on every family from 761 px. N2 (answered, same
day): the homebrew tabs become pills with their counts («Предметы 44») as level 2; the same style on `/tables` and
`/homebrew`. Level 3 stays underlined tabs (the books of a table group, the sources on `/tables/homebrew`). Reason (the
planner's): level 1 (the jobs) already is the app's top bar, so level 2 is part of the page's own head and reads with
its heading, pin and help as one unit; one placement and one style per level is the consistency the owner asks for; it
spends no new row above the content (B costs 62 px on the tables and 55 px on `/homebrew` and breaks the First-Screen
Rule at 1180) and gives 53 px back on the nine roll pages.

## 5. Batch

Its own batch N (outline), after T and before P. Criterion (`CLAUDE.md`, "Size a batch by its gates"): a different
route set (the nine roll pages from 761 px, `/homebrew`) and its own goldens, against 9b's list pages and T's
up-to-600 px re-baseline; 9b already costs 95-130 min and T 65-90, so a fold into either adds a review that could not
hold both. Gate cost: the mock (8-10), the re-seed of about 25-35 states (8-12), `check:built` and lints (4-5), the
loader runs of the roll and `FIRST_SCREEN` cases (6-8), `polish` and `harden` (5-10), one CI run and one review:
about 70-90 min.

Acceptance lines (each its own line in batch N's brief):
1. From 761 px every page with siblings (the nine roll pages, `/tables/*`, `/homebrew` and its tabs) draws a visible
   `h1` first in its title row: «Бросок» / "Roll" on the roll pages, «Таблицы» / "Tables", «Мои предметы» / "My items".
   Up to 760 px the `h1` stays visually hidden on all three, and the row above names the page (the lit pill, the
   picker). A case reads the `h1`'s box and text per family at 360, 768, 1000 and 1180 px, RU and EN.
2. The pin, the help (where the page has one) and the pills follow the `h1` in that order in the DOM and on the row; the
   level 3 tabs stay under the head row.
3. The pills are one row from 1000 px and their own row below it (761 to 999 px) at one height in RU and EN; the
   longest supplement label fits at the threshold (measured in both languages), else the threshold moves and
   DESIGN.md names it.
4. A switch between roll modes moves neither the `h1` nor the pills (top and left within 1 px) and keeps the focus on
   the pressed pill; one `RollPage` instance stays mounted.
5. `/homebrew` draws its four tabs as pills with counts from 761 px, «Новый предмет» last in the row; up to 760 px the
   picker row is unchanged.
6. `FIRST_SCREEN` and `ROLL_FIT` rows re-measured: roll 267 to about 214 at 1180; tables and homebrew within their
   limits; no row passes 288 (256 at 360). The document title of each roll page still names the mode.
7. Goldens of the roll pages and `/homebrew` from 761 px re-seeded; each moved state has an axe case.
8. RU/EN parity: no new string (`jobRoll`, the tab labels, the counts); a roll page's `h1` is no longer `pageStd`,
   `pageAlt` or a supplement name (their keys stay, the pills read them).

Prose batch N writes (same commit): DESIGN.md "A steady head" gains the roll pages ("`/tables/*` and the roll pages are
the users: the title, the pin, the help and the pills sit in the head row from 1000 px and the pills on their own row
from 761 to 999 px; the head's geometry follows the band only") and a new sentence in "The Roll Page Rule" ("From 761px
the `h1` names the job, «Бросок»; the lit pill names the mode"); "The Two Breakpoints Rule" names the roll pills in the
head. A new named rule "The Sibling Row Rule": "Sibling pages are pills in the head row after the page's visible
heading, the pin and the help; the parts of one collection are underlined tabs under it. Up to 760px the pills stay a
row when they all fit, else one picker opens a sheet." FEATURES.md "Chrome" (the mode row sentence: it sits in the
head row, not under the header) and "Rolling" (the head), and "Homebrew" (the tabs as pills with counts). The Impeccable
`critique` of `mocks/N/` is the orchestrator's.

Mock note: `mocks/N/` from the built app of T's tip with DOM moves (the probe scripts move `nav.modes` into
`.page-head` and set the `h1`'s text) at 360, 768, 1000, 1180 and 1920 px, RU and EN, on `/roll/std`, `/roll/alt`, a
supplement page, `/tables/eq_weapon` and `#/homebrew as gm3`; the homebrew pills by injected CSS. Built so far: the
four roll shots with the visible `h1` and the offsets above; the homebrew pills and the 1000 and 1920 px shots are the
batch's first step.

Plan review: not required (no contract, route, stored key or write path changes).
