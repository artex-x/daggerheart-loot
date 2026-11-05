# Sibling-page navigation and one head order (outline for batch N; owner item 11)

Purpose: record the owner's question of 2026-11-05 ("why roll pages are between page title and header and table pages
are after header? can we unify these behavior?", and "consistent with items page"), the options, and the owner's
answers: N1 = option A with a visible page heading on every family, N2 = the homebrew tabs become pills with counts,
N3 = the head order is heading, pills, then pin and help at the end, N4 = that order is ONE rule for every page that
has a `PageHead`. Nothing here is built. Offsets were measured on the built `dist-test/` of `d8e30731` with DOM moves
(`mocks/N/`: `navprobe-roll-tables.cjs`, `navprobe-homebrew.cjs`, `navprobe-roll-h1.cjs`, the PNGs, the JSON). The
2026-11-05 critique of the mocks (`C:\Users\Ignat\.dhloot\notes\57\mock-critique-9b-N.md`, outside the repository) is
placed in section 6.

## 1. The three placements today

Level 1 is the header's three jobs (Бросок, Таблицы, Поиск) on every page. Level 2 is a row of sibling pages inside
one job. Offsets are the top of the page's primary content at 1180x720 (limit 288, `FIRST_SCREEN`), RU and EN equal
unless noted.

| Family | Siblings | Placement from 1000 px | 761 to 999 px | Up to 760 px | Style | First content |
|---|---|---|---|---|---|---|
| Roll (9 pages, `ModeRow` in `Shell`) | «Обычные правила», «Альтернативные таблицы», «Дополнения ▾» | its own full-width row ABOVE the page title, outside `main`, with a rule below; it scrolls with the page; 53 px. The visible `h1` below it is the lit mode's name (a duplicate of the lit pill) | same | the same row, 40 px pills, the `h1` hidden | pills, the current one gold-filled | 267 at 1180, 1000 and 768; 323 at 360 (`/roll/std`), 251 (`/roll/alt` and supplements) |
| Tables (`TableNav` in `PageHead` `extra`) | level 2: seven group chips; level 3: the books of the group | the `h1` «Таблицы», the pin, «Об этих данных», then the chips in one title row; the tabs in a reserved row under it | both levels on their own rows under the title | one picker button and a sheet; the `h1` hidden | chips (gold fill) and underlined tabs (gold text) | 244 at 1180 (EN 1000 too); 288 RU at 1000; 334 at 768; 252 at 360 |
| Homebrew (`HomebrewTabs` in `PageHead` `extra`) | Предметы, Источники, Комплекты, Карты правил, each with a count | the `h1` «Мои предметы», the pin, then the tabs and «Новый предмет» (right end) in the title row | the same row, wrapped to a second line in RU (head 93 px) | one picker button and a sheet | underlined tabs only | 254 at 1180; 301 RU at 1000 and 768; 243 at 360 |
| Search | none (the kind chips are filters) | `PageHead`: the `h1`, the pin; the lead under it | same | `h1` beside «Ещё» | - | - |
| Lists | none | `PageHead`: the `h1`, the pin, then the import toggle and «Новый список» at the right end (`margin-left: auto`) | same | `h1`, primary, «Ещё» (no pin in the row) | - | - |
| List page, `/s/`, account, editor, print, error pages | none | `PageTitle` (no pin, no help, no `PageHead`) | same | same | - | - |

The differences: where the siblings sit (above the title, after the help, beside it), their style (pills, chips plus
tabs, tabs only), what the title says (the lit mode's name on the roll pages, the job or the page on the others), and
the order of the pin and the help against the siblings (Tables and Homebrew put the siblings AFTER the pin and the
help; the roll row is outside the head). The roll row is the only one outside `main`; `DESIGN.md` "A steady head"
(batch 7b) exists because the table head jumped when its content moved, and the roll row never jumps because it is
outside the page.

## 2. Options

| | A. Siblings in the head row (owner's choice, N1) | B. Siblings above the title, as the roll row | C. Keep the placements, align the style only |
|---|---|---|---|
| Rule | Level 2 (modes, groups, sections) is pills in the head row directly after the visible `h1` and before the pin and the help (N3); from 761 to 999 px on its own row under the title row. Level 3 (the parts of one collection: books, sources) is underlined tabs under the head row. Up to 760 px: the pills when all fit in one row (roll, 3), else one picker and a sheet (tables, homebrew). | One full-width row under the header, above the `h1`, with a rule, on all three families. | Roll stays above the title; homebrew tabs become pills; tables stay. |
| Roll at 1180 | see section 3 | unchanged, 267 | unchanged, 267 |
| Tables at 1180 | unchanged, 244 | chips leave the title row for a row above it: 244 to 306, past 288 | unchanged |
| Homebrew at 1180 | four pills with counts in the title row, «Новый предмет» at the end; offset about the same (pills 32 px, tabs 40 px; the mock measures) | the tabs get a row above the title: 254 to 309, past 288 | four pills in the title row, as A |
| Cost | `Shell`, `RollPage`, `TablesPage`, `HomebrewPage` and `PageHead` markup move; the roll, tables and homebrew goldens from 761 px (section 4: up to 143 files) | two named exceptions or a fold of the tabs; every `_tables_*` and `_homebrew*` golden from 761 px moves | one CSS edit in `HomebrewTabs` |
| Answers the owner | yes, all families | yes, at the price of first screens | no |

## 3. Option A with a visible page heading (owner's correction to the first mock)

The first mock hid the roll page's `h1` and let the lit pill name the page. The owner asked "where have we lost the
page header?", so every family keeps a visible `h1` from 761 px, first in the same title row. The three titles are
the job or page names the other families already use: «Таблицы», «Мои предметы» and, for the roll pages, the job name.

Recommended roll wording: «Бросок» / "Roll" (`jobRoll`, an existing key, so no new string). Reason: it is the same
pattern as «Таблицы» on `/tables` and «Поиск» on `/search`, where the `h1` is the header tab's own word and the lit
pill or the tab names the page below it. It reads as a duplicate of the header's «Бросок» tab exactly as «Таблицы» does
of its tab, which the owner has not objected to. The alternative «Бросок костей» / "Dice roll" needs two new strings,
and the lead line already starts with «Бросок Костей Дуальности»; not recommended. The old `h1` (the mode's name,
`pageStd`, `pageAlt`, a supplement) would sit beside an identical lit pill, so it goes; the lit pill and
`aria-current` name the mode (check: the document title keeps naming the mode).

Measured with the visible `h1` and the OLD order h1, pin, help, pills (`mocks/N/measure-roll-h1.json`, `/roll/std`,
`/roll/alt`, `/roll/mwt`, `/roll/wondrous`, `/roll/voa`; RU and EN equal unless noted). The new order (section 4)
puts the same items in the same row, so the total width and every row height stand; only the left edges inside the row
change. Batch N's first step re-runs the probes with the new order and writes the figures into `plan-N.md`; this
planning pass drew no browser.

| Window | Today (first content) | Option A, visible `h1` | Head | Where the row breaks |
|---|---|---|---|---|
| 1180x720 | 267 | 214 (-53) | one row, 37 px | never: the row ends at 859-942 px (RU), 682-750 px (EN) |
| 1000x720 | 267 | 214 (-53) | one row, 37 px | never; the longest case (`/roll/wondrous` RU) ends at 942 of 984 px, 42 px to spare with the pin NOT pressed (the pressed label is about 12 px wider, so about 30 px to spare: re-measure, section 6) |
| 768x1024 | 267 | 256 (-11) | title row plus the pills on their own row, 79 px | by rule: the pills take their own row from 761 to 999 px, at the same height in RU and EN |
| 360x640 | 323 `/roll/std`, 251 others | unchanged | the mode row above the page, the `h1` hidden | not applicable |

Shots: `mocks/N/roll-std__1180__ru__h1.png`, `roll-alt__1180__ru__h1.png`, `roll-mwt__1180__ru__h1.png` (the longest
supplement label), `roll-alt__768__ru__h1.png` (all with the old order; label them in the mock folder). A prior probe
without the rule-based own row wrapped the pills one per line at 768 RU (head 113 px, first content 290); the rule
(pills on their own row below 1000 px) is what the batch builds, so the head does not depend on the language or on
the page.

Trade-offs, stated plainly:
- The title row is longer: «Бросок», the pills (about 520-560 px), the pin (about 190 px) and the help (about 140 px)
  take 859-942 px of the 968 px column at 1000 px. The headroom is about 30 px in RU on the longest supplement label with
  the pin pressed; a longer label would break the "one row from 1000 px" rule and make the head depend on the page.
  The batch measures the longest label in both languages and both pin states at 1000, 1050 and 1100 px before it fixes
  the threshold, and raises it (to 1100 px, one more step in this row only) if a state does not fit.
- Below 1000 px the head is two rows (title row, then the pills), as the tables and homebrew heads are: first content
  at 256 px at 768, 11 px higher than today.
- The roll pages lose the full-width rule line and the row above the title; the roll row is now inside the page, so a
  switch between two roll modes must not move the title or the pills (a case: one `RollPage` instance, the same top and
  left of the `h1` and the pills before and after a switch, the focus kept). With the pills directly after a constant
  `h1` (N3) this holds by construction: the pin state and the help label come after the pills and cannot move them.
- Up to 760 px the roll `h1` stays visually hidden. The mode row above the page names the mode (the lit pill) and the
  header's lit «Бросок» tab names the job; tables and homebrew hide theirs for the same reason, their picker names the
  page.
- The `h1` of a roll page no longer names the mode; the mode is the lit pill with `aria-current="page"` and the
  document title.

## 4. The head order rule (owner N3 and N4, 2026-11-05)

Owner answers: "Heading, pills, then pin and help" for the roll head (N3; this replaces the order h1, pin, help, pills
of the first option A); then "I want it consistent on all pages then" (N4). One rule for every page that draws a
`PageHead`:

> **The Head Order Rule.** A page head draws, in this order in the DOM and on the screen: the heading; the pills of the
> sibling pages, where the page has siblings; the pin; the help; the page's primary action or actions at the right end.
> A page with no siblings has no pills slot, so its pin follows its heading.

The mechanism. `PageHead` gets two props: `nav?: Snippet` (the pills; drawn between the `h1` and the pin) and
`navBelow?: boolean` (the page passes `band === 'mid'`: the pills are drawn after the head row instead, as their own
row, so the DOM order equals the reading order in each band). `extra` stays and now means "the primary actions at the
right end" only (`margin-left: auto` on its box). The pin and the help stay where `PageHead` draws them.

Every page and what it needs (all pages that draw a head in the app were read):

| Page | Caller | Order today (from 1000 px) | Order after | Change, batch, goldens |
|---|---|---|---|---|
| Roll, nine pages | `RollPage` `PageHead`; the pills are `ModeRow` in `Shell` | pills row above; `h1` (mode), pin, help | `h1` «Бросок», pills (`nav`, `ModeRow` moves from `Shell`), pin, help | N; up to 37 files with the pin label (`_roll*`) |
| `/tables/*` | `TablesPage` `PageHead` `extra={nav}` | `h1` «Таблицы», pin, help, chips | `h1`, chips (`nav`), pin, help | N; up to 63 files (`_tables*`); the chips leave `extra` |
| `/homebrew` and its four tabs | `HomebrewPage` `PageHead` `extra={wideHead}` | `h1`, pin (when ready), tabs, «Новый предмет» (right end) | `h1`, pills with counts (`nav`), pin (when ready), «Новый предмет» (`extra`, right end) | N; up to 43 files (`_homebrew*`); `wideHead` splits in two snippets |
| `/lists` | `ListsPage` `PageHead` `extra={wideHead}` | `h1`, pin, then import and «Новый список» at the right end | the same | none: it already follows the rule; the browser check proves it; 0 goldens |
| `/search` | `SearchPage` `PageHead` | `h1`, pin | the same | none; 0 goldens |
| List page (`/lists/<uuid>`), `/s/`, account, editor, print, error pages | `PageTitle` | `h1` only; no pin, no help, no siblings; the list page's actions are in the side column (batch 9b) | the same | none: no `PageHead`; the rule does not apply |

The counts are the snapshot files in `tests/app/snapshots` that hold the pin label (`rtk grep -l "при запуске"`: roll
37, tables 63, homebrew 43, lists 25, search 16); the snapshots are taken at 1100 px by default, so most of them draw
the wide head. Narrow states (360 px) do not move. The real number of moved files is the output of `golden.js
--update` in batch N. `/lists` and `/search` goldens must come out byte-identical.

Bands. From 1000 px the head is one row: `h1`, pills, pin, help, primary at the right end (`flex-wrap` stays for
overflow). From 761 to 999 px the first row holds `h1`, pin, help and the primary at the right end, and the pills take
the next row (`navBelow`); the reading order (the top, then the left of each element) equals the DOM order in this band
too. This is the one named departure from the order of the sentence: below 1000 px the pills are not between the
heading and the pin. Up to 760 px nothing changes: roll keeps its pill row above the page (the `h1` hidden), tables and
homebrew keep their picker rows, pin and help are in «Ещё», `/lists` keeps `h1`, primary and «Ещё».

Alternative for 761 to 999 px (not taken): keep the strict order with three rows (`h1`; pills; pin, help, primary). It
costs one more row of about 40 px: roll at 768 about 296 instead of 256, tables about 374 instead of 334, homebrew
about 341 instead of 301; no `FIRST_SCREEN` row is asserted at 768, but a tablet reader loses a screen third. The
recommended form keeps the heights of the first option A and the DOM equal to the reading order. If the owner wants the
strict order below 1000 px, the change is one prop (`navBelow` off) and a re-measure.

Departures from sibling pages: none left. The tabs of level 3 stay under the head row on `/tables/*` and
`/tables/homebrew`.

## 5. Recommendation and answers

N1 (answered by the owner, 2026-11-05): option A, with a visible `h1` on every family from 761 px. N2 (answered, same
day): the homebrew tabs become pills with their counts («Предметы 44») as level 2; the same style on `/tables` and
`/homebrew`. Level 3 stays underlined tabs (the books of a table group, the sources on `/tables/homebrew`). N3 and N4
(answered, same day): heading, pills, pin and help; one rule for every `PageHead` page. Reason (the planner's): level 1
(the jobs) already is the app's top bar, so level 2 is part of the page's own head and reads with its heading, pin and
help as one unit; one placement and one style per level is the consistency the owner asks for; it spends no new row
above the content (B costs 62 px on the tables and 55 px on `/homebrew` and breaks the First-Screen Rule at 1180) and
gives 53 px back on the nine roll pages. The pills right after a constant heading cannot move when the pin state or the
help label changes (critique N-1), and the tab order reaches the page navigation before the pin and the help.

## 6. The mock critique, placed (2026-11-05; each finding judged)

| Finding | Decision | Where |
|---|---|---|
| N-1 (P1) the pills move on a mode switch | Taken: it is N3/N4 (section 4). The check of acceptance 4 holds by construction | acceptance 2, 4, 9 |
| N-2 (P1) the homebrew design (pills with counts in the title row) has no mock | Taken: drawing it and measuring its first content (limit 288 above 760 px) is the batch's FIRST step, at 1000, 1180 and 1920 px, RU and EN, with the new order and both pin states. The tabs-under-the-lead probe is labeled "rejected placement" in the mock folder | step 1 |
| N-3 (P1) the lit roll pill draws no check; `aria-current` against the Check Rule | Decided: NO check on a place. A sibling pill, a level 3 tab and `TableNav`'s chip mark where the person is, not a press; 9b's Check Rule already says "a link chip marks a place and draws none" (the critique compared it with the gold filter chip «Снаряжение», which is `aria-pressed`). The lit pill's cue is its fill (a luminance step, not a hue alone), the underline on the tabs and `aria-current="page"`. The Check Rule text in 9b names the sibling pills in that sentence. Reason: a check on 3 pills costs 21 px of the 30 px headroom at 1000 px and makes a navigation look like a toggle. Trade-off accepted: the place has no glyph. If the owner overrules, one line in `Chip`/`ModeRow` and the threshold moves to 1100 px | 9b M4 and the rule text; acceptance 3 |
| N-4 (P2) two gold fills on `/roll/alt` and `/roll/mwt` | Not changed: the Seal Rule lets the current place and one primary per panel each carry gold, and they sit in different panels (the head, the card). The mock step draws the lit pill in the Toggle look (gold label and border, no fill) at `/roll/alt` 1180 beside the shipped fill; the batch keeps the fill unless the shot shows the primary losing. A new gold treatment is a third look in "Chips" | step 1; acceptance 10 |
| N-5 (P2) 768 px: the gap from the pills to the lead is smaller than the gap from the title row to the pills | Taken as a measured check: from the bottom of the pills row to the next block is at least the gap from the title row to the pills row (RU and EN, `/roll/alt` and `/tables/eq_weapon` at 768) | acceptance 3 |
| N-6 (P2) the 1000 px headroom was measured with the pin unpressed | Taken: step 1 and acceptance 3 measure both pin states and the longest label at 1000, 1050 and 1100 px | acceptance 3 |
| N-7 (P3) `/roll/mwt` lead is an instruction sentence (Clarity Rule); «корника» in the `/roll/std` lead | Deferred to batch 10 (Deferred row in `handoff.md`). Reason: both are copy, not placement; the wording of «корника» is decided by the `daggerheart-ru-terms` skill (the help text and the fixtures use it too), and changing a lead in a geometry batch would blur the offset comparison. Proposed fix for the mwt lead: no lead (`sub` empty), since «Мир» and «Бросить d20» say it | handoff Deferred |
| Sam: `h1` «Бросок» on nine pages, the mode only in `aria-current` and the title | Not taken: a hidden suffix «Бросок: Обычные правила» would repeat the lit pill's name for a screen reader on every page; `aria-current` and the document title name the mode (acceptance 1 checks the title) | skipped |
| Sam: pin and help before the pills in the tab order | Solved by N3 | section 4 |
| The «ИЛИ» dividers are gold-outlined (Seal Rule, pre-existing) | Not in N: not in the touched head; named for batch 10's audit | handoff Deferred |

## 7. Batch

Its own batch N (outline), after T and before P. Criterion (`CLAUDE.md`, "Size a batch by its gates"): a different
route set (the nine roll pages, `/tables/*` and `/homebrew` from 761 px) and its own goldens, against 9b's list pages
and T's up-to-600 px re-baseline; 9b already costs 95-130 min and T 65-90, so a fold into either adds a review that
could not hold both. Gate cost: the mock (the homebrew pills, the pill variants and the head set at 1000, 1180 and
1920 px, RU and EN; 12-15), the re-seed of up to 143 states (`build:test` and four shards 15-20, the diff read 8-10),
`check:built` and lints (4-5), the vitest files of the moved components (10-12), the loader runs of the head order
case, the roll and `FIRST_SCREEN` cases (8-10), `polish` and `harden` (5-10), one CI run and one review: about 90-110
min.

First step (mock and probe, before the code): (1) draw `/homebrew as gm3` with the pills and counts in the title row
and «Новый предмет» at the right end, at 1000, 1180 and 1920 px, RU and EN, pin pressed and not, and measure its first
content against 288 above 760 px; (2) re-run the roll and tables probes with the order h1, pills, pin, help at the
same widths; (3) draw the lit pill in the Toggle look beside the fill on `/roll/alt` 1180 (N-4); (4) measure the longest
label of each family in both pin states at 1000, 1050 and 1100 px and fix the one-row threshold. The figures go into
`plan-N.md`; if the homebrew first content at 1180 passes 288, the batch stops and names the figure.

Acceptance lines (each its own line in batch N's brief):
1. From 761 px every page with siblings (the nine roll pages, `/tables/*`, `/homebrew` and its tabs) draws a visible
   `h1` first in its title row: «Бросок» / "Roll" on the roll pages, «Таблицы» / "Tables", «Мои предметы» / "My items".
   Up to 760 px the `h1` stays visually hidden on all three, and the row above names the page (the lit pill, the
   picker). A case reads the `h1`'s box and text per family at 360, 768, 1000 and 1180 px, RU and EN. A roll page's
   document title still names the mode.
2. The Head Order Rule (section 4): on every `PageHead` page the DOM order is `h1`, pills (where the page has them),
   pin, help, primary actions, and the primary actions end at the column's right edge (within 16 px). The level 3 tabs
   stay under the head row.
3. The pills are one row with the head from 1000 px and their own row below it (761 to 999 px) at one height in RU and
   EN; the longest supplement label with the pin pressed fits at the threshold (measured in both languages at 1000,
   1050 and 1100 px), else the threshold moves and DESIGN.md names it. At 768 px the gap from the pills row to the next
   block is at least the gap from the title row to the pills row. The lit pill draws no check (section 6, N-3).
4. A switch between roll modes moves neither the `h1` nor the pills (top and left within 1 px) and keeps the focus on
   the pressed pill; one `RollPage` instance stays mounted. The pills of `/tables/*` and `/homebrew` keep their left
   edge across tabs and tables.
5. `/homebrew` draws its four tabs as pills with counts from 761 px, then the pin, then «Новый предмет» last in the row;
   up to 760 px the picker row is unchanged.
6. `FIRST_SCREEN` and `ROLL_FIT` rows re-measured at 1180x720 and 360x640: roll 267 to about 214 at 1180; tables 244 and
   homebrew 254 or less; no row passes 288 (256 at 360). The rows at 1000 and 768 are logged (tables RU 288 and 334,
   homebrew RU 301 and 301 today); a row that passes its figure of today is named to the orchestrator.
7. The head order case (the browser check of section 8) passes on every route family.
8. Goldens of the roll, tables and homebrew states that draw the wide head are re-seeded (the number is written in
   `handoff.md`); `/lists` and `/search` goldens are byte-identical; each moved state has an axe case.
9. RU/EN parity: no new string (`jobRoll`, the tab labels, the counts); a roll page's `h1` is no longer `pageStd`,
   `pageAlt` or a supplement name (their keys stay, the pills read them).
10. The mock shows the lit pill beside the Toggle look on `/roll/alt` (N-4); the batch keeps the fill unless the shot
    shows the primary losing; the choice is written into DESIGN.md "Chips".
11. `handoff.md` Deferred carries the two copy rows of N-7 and the «ИЛИ» row.

## 8. The browser check of the head order (batch N, one new case)

One `states.js` case (the next free number; `handoff.md` names it), RU and EN, at 1180x720 and 768x1024, plus 1000x720
and 360x640 for the hidden `h1`. Routes (one per family): `/roll/std`, `/roll/alt`, `/roll/mwt`, `/roll/wondrous`,
`/tables/eq_weapon`, `/tables/homebrew`, `#/homebrew as gm3` (ready, tab Предметы), `#/lists as gm4` (signed in),
`#/search`. For each, with the pin pressed and not (where the page has a pin):
(a) the head's elements are found by role and name: `h1`; the nav (`nav` landmark or the pills' container); the pin
(`.homebtn`); the help (`.helpbtn`); the primary (a `.btn` primary in the head row, «Новый предмет» / «Новый список»);
(b) the DOM order, by `compareDocumentPosition`, equals the expected sequence of the family (roll and tables: h1, nav,
pin, help; homebrew: h1, nav, pin, primary; lists: h1, pin, import, primary; search: h1, pin); a page with no pills slot
has no nav element;
(c) the visual reading order equals the DOM order: the elements sorted by the row (tops within 8 px are one row) and
then by `left` give the same sequence; at 1180 all elements share one row; at 768 the nav is alone on the row under the
others;
(d) the primary's right edge is within 16 px of the column's right edge at 1180 and 768 (not asserted where the page has
no primary);
(e) the first content top is logged and asserted against `FIRST_SCREEN` where a row exists (288 at 1180, 256 at 360),
and the rows that move are named in `handoff.md`;
(f) at 360 the `h1` of the three families with siblings is visually hidden (a box of 1 px) and still in the DOM.
The case fails on a page that puts the pin before the pills, on a primary that is not last, and on a reading order that
differs from the DOM order.

## 9. Prose batch N writes (same commit)

- DESIGN.md "Layout", "Named Rules": a new **The Head Order Rule** (the text in section 4; it carries the sibling
  placement and style that the first draft called "The Sibling Row Rule", so there is one rule); "A steady head" gains
  the roll pages and the homebrew page ("`/tables/*`, the roll pages and `/homebrew` are the users: the heading, the
  pills, the pin, the help and the primary sit in the head row from 1000 px and the pills on their own row from 761 to
  999 px; the head's geometry follows the band only"); "The Roll Page Rule" gains "From 761px the `h1` names the job,
  «Бросок»; the lit pill names the mode"; "The Two Breakpoints Rule" names the pills in the head; "Chips" names the
  sibling pill (the lit one by fill, no check) and, if the mock decides so, the Toggle look.
- FEATURES.md "Chrome" (the mode row sentences: it sits in the head row from 761 px, not under the header; the lit
  control reads the mode, the `h1` the job), "Rolling" (the head), "Tables and search" (the head order), "Homebrew"
  (the tabs as pills with counts, then the pin), "Lists" (one sentence: the head order, already true).
- COVERAGE.md: the head order case. The Impeccable `critique` of `mocks/N/` is the orchestrator's.

Mock note: `mocks/N/` from the built app of T's tip with DOM moves (the probe scripts move `nav.modes` into
`.page-head`, set the `h1`'s text and now put the pills before `.homebtn`) at 360, 768, 1000, 1180 and 1920 px, RU and EN,
on `/roll/std`, `/roll/alt`, a supplement page, `/tables/eq_weapon` and `#/homebrew as gm3`; the homebrew pills by
injected CSS. Built so far: the four roll shots with the visible `h1` and the offsets above (old order); the new order,
the homebrew pills and the 1000 and 1920 px shots are the batch's first step.

Plan review: not required (no contract, route, stored key or write path changes).
