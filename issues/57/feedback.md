# Feedback F1 and F2 - design result - TASK 57

This document gives the design answer to the end-user feedback of 2026-11-03
(`context.md`, "End-user feedback"), for the owner to confirm. It is a plan and
mock pass: no production code changed. The orchestrator folds the answers into
`plan.md`, `handoff.md` and `context.md`. The mocks are `mocks/F/index.html`.

## Recommendations

| Item | Recommendation | Batch | Added gate cost |
|---|---|---|---|
| A, F1 | Batch 5 is the answer: up to 760 px no roll page draws a button beside a title. Add no rule to `PageHead`. | 5 | none |
| B, F2-1 | B1: up to 760 px the brand row scrolls away and the three jobs stay sticky. CSS only. Also fix the backward focus defect below. | 9 | about 10 min |
| C, F2-2 | C1b: one compact row, 77 px, with one clamped line of effect or stat, on `/lists/<uuid>` and `/s/` up to 760 px. A press unfolds the full row. Nothing is stored. | 9 | about 10-15 min |
| D, F2-3 | D1: the `/s/` search row from 8 entries on the owner's page, the filter sheet at every width, the filter in page memory. | 9 | about 5-10 min |

Result at 360x640: 1.9 rows today, 7.7 rows with C1b and B1 (10.3 with C1 and
B1). At 390x844: 2.6 rows today, 10.3 rows (13.9 with C1). No new batch, no stored setting, no schema column, no
address change, so no plan-review trigger fires.

NEEDS_HUMAN_CONFIRMATION: yes. The questions are in "Owner questions".

## Corrections to the brief

- The mode row is not sticky. `ModeRow.svelte` has no `position: sticky`, and
  DESIGN.md "Layout" says it scrolls with the page. B has no effect on it.
- The sticky filter column exists only from 1000 px. B acts up to 760 px, so
  the two never meet.
- Plan section 7 says the H1 is hidden "at 360". Mock 5's rule is
  `@media (max-width: 760px)` (`mocks/1/ua.css`, `.rfs .ph`). The batch 5
  refresh must read "up to 760 px". The system has no step at 360.
- `/s/` with a search row measures 286 px at 360x640, past the 256 px limit.
  Mock 9 measured only `shared-player` with six entries. This gap exists with
  or without F2.

## New defect found

Today a backward Tab hides the focus under the sticky header. On the live
`/tables/eq_weapon`, 15 of 30 Shift+Tab stops at 360 px and 10 of 30 at 1180 px
land under the header (WCAG 2.4.11). `html` has `scroll-padding-bottom` and no
`scroll-padding-top`. With an injected `scroll-padding-top` the count is 0 of 30
at both widths, and also with B1. The fix is in B below. It applies whichever
header option the owner takes.

## A. F1: the title and its buttons

**Today (live, Chrome, measured 2026-11-03).** `PageHead` is a wrapping flex row.
The help button wraps alone when the title leaves too little room.

| Page | Wraps at | Clean from |
|---|---|---|
| `/roll/alt` RU | 320-400 px | 412 px |
| `/roll/wondrous_environments` RU, EN | 320-375 px | 384 px |
| `/roll/community_items` RU | 320-340 px | 360 px |
| `/roll/std`, `/roll/many_worlds_tavern` RU | 320 px | 340 px |
| Every page from 412 px, 761 px included | none | - |

**After batch 5 (mocks 3, 5, 6, 7, 8, 9 probed at 320, 360, 390, 412, 430, 600,
760, 761, 800, 1000, 1180 px, RU and EN).** No head row wraps.

| Page | Up to 760 px | From 761 px |
|---|---|---|
| Nine roll pages | H1 visually hidden; the pin and the panel button in «··· Ещё» | H1, labeled pin, labeled panel button on one line |
| `/tables/*` | no `PageHead`: picker row | wide head, no wrap |
| `/homebrew` | no visible H1 row: picker | head row, no wrap |
| `/search` | H1 alone | H1 alone |
| `/lists` | H1 and two controls | H1 and two controls |

So a 390-430 px phone shows no wrap after batch 5. Production keeps the defect
until wave 2 lands. No user sees an interim state, because batches 3-7 ship as
one wave.

| | A1 (recommended) | A2 |
|---|---|---|
| Proposed | Batch 5 as drawn. Up to 760 px the lit mode chip names the page. | The title stays and wraps; the round pin and help stay on its first line. |
| Devices | every width up to 760 px | every width up to 760 px |
| First result at 360x640 | 245 px, passes | 320 px RU, 297 px EN: fails (at 390x844: 297 px, inside that screen's 40%) |
| Work | three acceptance lines in batch 5 | `PageHead` CSS (no wrap, `min-width: 0`, top alignment), M2-2 and R2-1 reversed, a named first-screen exception on eight roll modes |
| Reason | The owner's decisions M2-2 and R2-1 already remove the cause, and the First-Screen Rule stays whole. | It does literally what the users asked. |
| Trade-off | The users do not get the layout they asked for. They get no title row. The pin and the help take one more tap. | About 75 px on every roll page at 360. |

I do not recommend a `PageHead` guard beside A1. After batches 5-8 no caller draws
round buttons up to 760 px, so the rule would be dead code.

Batch 5 acceptance lines to add:

1. Up to 760 px no roll page draws the H1 visibly, the pin or the panel button in
   the head (plan section 7 reads "up to 760 px", not "at 360").
2. From 761 px the H1, the pin and the panel button of the longest pair
   («Альтернативные таблицы», «Где какая редкость» class of labels) share one
   line at 761 px in RU and EN: a geometry line in the batch's states case.
3. `FEATURES.md` "Chrome" names the visually hidden H1 range.

## B. F2-1: the header on scroll

**Today.** The header is `position: sticky`, 111 px up to 760 px, 63 px from 761 px.

| | B1 (recommended) | B2 | B0 |
|---|---|---|---|
| Proposed | The brand row scrolls away; the jobs row (45 px) stays sticky. `.topbar { top: -66px }` up to 600 px, `-60px` at 601-760 px (measured brand row), and `.topbar:focus-within { top: 0 }`. | The whole header hides on scroll down and shows on scroll up. | No change. |
| Scope | every page up to 760 px | list pages, or every page, up to 760 px | - |
| Rows at 360x640, C1 | 10.3 | 11.1 going down, 9.2 going up | 9.2 |
| Rows at 390x844, C1 | 13.9 | 14.7 going down, 12.7 going up | 12.7 |
| Rows at 360x640, C1b | 7.7 | 8.3 going down, 6.8 going up | 6.8 |
| Rows at 390x844, C1b | 10.3 | 11.0 going down, 9.5 going up | 9.5 |
| Code | 6 lines of CSS, no script | a new `app/src/ports/` scroll port, `Shell` state, about 12 guards, tests | none |
| Trade-off | Language and account need a scroll to the top. | The header moves under the thumb, and the mobile browser's own bar moves too. | None, and 1.1 fewer rows. |

**Recommendation: B1.** The jobs stay reachable, which is why the header is
sticky (the `Shell.svelte` comment). It gives back 66 of the 111 px with none of
B2's state. The trade-off I accept: the header does not return on scroll up.
This differs from the owner's idea, so it is the owner's call.

**Is it needed once the rows shrink?** No. C1b alone gives 6.8 rows at 360x640
(C1: 9.2) and answers F2. B1 adds 0.9 rows (C1: 1.1) for almost no cost, so it is
worth taking. B2 adds 0.6 more rows (C1: 0.8) for a real cost, so it is not.

I tested B1 on the live site in headless Chrome at 360 px by injected CSS: at
scroll 800 the jobs row sits at 0-44 px; a focus on the language button brings
the full header back; a blur collapses it. I did not test a real iOS device.

| Interaction | B1 | B2 |
|---|---|---|
| `--anchor-top` | Change up to 760 px from 118 / 132 to 62 px (45 + 17). Proof: a target at page offset T lands at 62 px, and the header there is at most 62 px tall. | Keep the worst case; a target then lands with a 111 px gap when the header is hidden. Stop the logic during a programmatic scroll. |
| Anchor scrolling | One sticky height, no state. | A smooth scroll up shows the header and a smooth scroll down hides it, so the landing varies. |
| Mode row | Not sticky: no effect. | Not sticky: no effect. |
| Filter column | From 1000 px only: no effect. | No effect at this scope. Past it, `top` and `max-height` must follow the state. |
| `HomebrewEditor` preview | From 800 px: no effect. | No effect at this scope. |
| Selection bar, `--selbar-h` | Bottom edge: no effect. | No effect. |
| Toast | Bottom edge: no effect. | No effect. |
| Focus (WCAG 2.4.11) | `scroll-padding-top` fix below; 0 of 30 covered. | The same fix, at the worst-case height. |
| Keyboard Tab into the header | `:focus-within` reveals it, tested. | A `focusin` handler must show it. |
| `prefers-reduced-motion` | Nothing animates. | The token rule cuts the transition; the header jumps. The browser suite forces this mode, so a timing test proves nothing. |
| iOS bounce | No direction logic, so nothing reads it. | Clamp `scrollY`, keep a 10 px dead zone, and ignore the bottom bounce. |
| Print | `.topbar` is hidden by `@media print`: no effect. | The same, plus a state reset. |
| On-screen keyboard | No script, so no effect. | Freeze while a field has focus, or the opening keyboard reads as a scroll. |
| Open menu, sheet, drag auto-scroll | Focus inside keeps the header; nothing else. | Freeze for each one (`menuOpen`, `dialogOpen`, `drag.ts` `scrollBy`). |
| Reload, Back, a short page | Sticky is stateless. | Reset on navigation; never hide on a short page. |

The focus fix, for B1 and B0 alike:

- Add `--sticky-h`: 63 px from 761 px, 45 px up to 760 px (111 px under B0).
- Set `html { scroll-padding-top: var(--sticky-h) }` in `tokens.css`.
- `scroll-margin-top` adds to `scroll-padding-top`, so an anchor would land twice
  as low. Add `--anchor-gap` (12-17 px). The three `scroll-margin-top` rules
  (`HomebrewCards`, `TableRows`, `TablesPage`) read it. `FilterPanel` keeps
  `--anchor-top`.
- `tests/app/sweep.js` checks "within 40 px under the header bottom": re-check
  this line up to 760 px.

## C. F2-2: the rows

**Today.** `/lists/<uuid>` rows are about 280 px at 390 px. Tick, position, art,
name, badges, the full text, quantity, price and three row actions all draw at
once. `/s/` draws the catalog row with its full text. Mock 9 makes the owner's row
about 220-254 px, so batch 9 as drawn gives 1.9 rows at 360x640: it does not
answer F2.

| Option | Row | 360x640 | 390x844 | At scroll 0, 360x640 | Stored | Cost |
|---|---|---|---|---|---|---|
| Live today | about 280 px | 1.9 | 2.6 | 0.6 | - | - |
| Batch 9 as drawn | 220-254 px | 1.9 | 2.8-3.0 | 1.5 | - | - |
| **C1b compact with one text line (recommended)** | 77 px | 6.8 (7.7 with B1) | 9.5 (10.3 with B1) | 4.8-5.0 | nothing | one shared component, two callers |
| C1 compact | 57 px | 9.2 (10.3 with B1) | 12.7 (13.9 with B1) | 6.4-6.7 | nothing | the same |
| C2 clamped full row | 122 px | 4.3 | 6.0 | 3.2 | nothing | CSS and one control line |
| C3 stored mode, no picture | 44 px | 12.0 | 16.7 | 7.8 | per list: a `lists` column | a migration and a plan review |

The two "today" figures are computed from the 280 px row of the owner's phone
screenshot. Heights are RU renders of `mocks/F/rows.json`. A row with a two-line name is 20 px
taller (C1 75 px, C1b 95 px); the average in the mock is 58 px and 78 px. Rows per screen assume the list is scrolled and
the header is 111 px, unless a figure names B1.

### The compact row (up to 760 px, revised after the critique)

- Art 44 px, with the position number on a small plate in its corner. The
  number stays visible because the list roll names entries by number
  (`FEATURES.md`: "the row numbers match it").
- Name: 15 px, weight 600, up to 2 lines, then an ellipsis. One line would cut 15%
  of the 1459 catalog names in RU at 360 px (over 200 px) and 7% at 390 px.
- Meta line: the short kind badge, then the price if the entry has one, else the
  source, then the note mark and, on the owner's page, the lock of a GM-only entry.
  The longest book price («7 сундуков 5 мешков») wraps to a second meta line; it is
  never cut.
- The whole body is one `<button aria-expanded>`, and a 20 px chevron ends it.
- Quantity: a separate target at the far right, 16 px from the chevron, never inside
  the button. On the owner's page it is a live number field, 42x44 px, with no sign
  and the accessible name «Кол-во: <name>». The 44 px field fits: the row stays 57 px.
  On `/s/` the text «×2». It reads as a count there: it is `--txt`, weight 600, about 20 px
  from the chevron, and it is the form the shared page already prints (`tailOf`). A
  quantity of 1 draws nothing, also as `tailOf` does.
- C1b only: one clamped line, 13 px, from the text column to the row's end, under the
  quantity. An item shows its effect. A weapon shows damage, range, burden and trait
  in that order, so a cut takes the trait first. Armor shows its thresholds and score.

| What | Where in the compact row |
|---|---|
| Quantity edit | in the row, live, 42x44 px, through the write buffer |
| Price edit | in the unfolded row; the price reads as text on the meta line |
| Position field | in the unfolded row, one tap away. It stays, so WCAG 2.5.7 holds |
| Drag grip | in the unfolded row, on hover devices only. A touch device has none today |
| Drop mark | on the compact row too |
| Tick | a column at the left in selection mode; the quantity turns to the text «×2» so a mis-tap edits nothing |
| Take line | under a ticked row, as today |
| Note | the mark on the meta line; the note in the unfolded row |
| GM-only | dashed border, recessed ground and art at 45%, as today |
| «Скрыть от игроков», «Открыть карточку», «Убрать из списка» | «··· Ещё» of the unfolded row (mock 9's menu) |
| `/s/` card | «Открыть карточку» in the unfolded row |

**Shop and inventory.** One row serves both, and the data decides. An entry with a
price shows its price, so a shop reads as a price list. An entry with no price
shows its source, so an inventory reads as a plain list. No mode exists to choose
or to store. The quantity is the inventory's one frequent edit, so it stays live.

**The choice is per device width.** `app.band === 'narrow'` draws the compact row;
from 761 px the full row stays, because a GM uses a laptop 80% of the time. Open
rows are page memory (`openRows`, keyed by entry id, dropped when the list changes).
No key, no column, no setting.

### C1 or C1b

The critique found that C1 takes the effect text away, so a player cannot compare
two potions. C1b adds one line for that.

| | C1 | C1b |
|---|---|---|
| Row | 57 px | 77 px |
| Rows, 360x640, 111 px header | 9.2 | 6.8 |
| Rows, 360x640, with B1 | 10.3 | 7.7 |
| Rows, 390x844, 111 px header | 12.7 | 9.5 |
| Rows, 390x844, with B1 | 13.9 | 10.3 |
| Rows at scroll 0, 360x640, owner's page | 6.4-6.7 | 4.8-5.0 |
| Rows at scroll 0, 390x844, owner's page | 10.0-10.3 | 7.4-7.6 |
| Rows at scroll 0, 360x640, `/s/` | 5.9-6.2 | 4.4-4.6 |
| Rows at scroll 0, 390x844, `/s/` | 9.8 | 7.3 |
| First entry, owner's page, 360x640 | 252 px, passes | 252 px, passes |
| First entry, `/s/`, 360x640 | 286 px, exception | 286 px, exception |
| Weapon and armor stats without a press | no | yes, at 360 px, in the sampled rows |
| Item text without a press | no | its start |

What one line holds, measured on `data.js` in the app's font at 13 px:

- 274 px at 360: 5% of the 1347 record texts in RU and 7% in EN fit whole.
- 304 px at 390: 6% in RU and 8% in EN fit whole.
- Among 226 consumables, 22 in RU and 16 in EN show a cut line equal to another's at
  360 px. «Вы получаете бонус +1 к следующему Броску» is one such line: the word that
  differs falls past the cut. At 390 px it is 16 in RU. The English line fits whole.

So C1b does not replace a press for a long item text. It gives the stats of a weapon
or armor, and for about 90% of consumables a line that differs from its neighbors.

**Recommendation: C1b, on both pages.** This changes my first recommendation. The new
fact is the comparison need: players choose by effect, and C1b still shows four times
today's rows. The trade-off I accept: 2.6 fewer rows than C1 at 360x640 with B1, and
95% of the texts stay cut, so a reader still presses a row for the whole text. A
compact row press unfolds where a catalog row opens the card. Hiding the rest of the
text is a user-visible change, so the owner confirms it (Q3).

C1 is the right choice if the owner weighs the row count over the comparison. The
two differ by one line in one component, so the choice costs no gate.

### Stray taps on the quantity field

The field sits at the right edge, where a right thumb scrolls. A tap there opens the
keyboard. The risk is a lost moment, not lost data.

I keep these mitigations, and add no others:

- The field is a native input. It takes focus on a tap only. A touch drag that starts
  on it scrolls the page. Measured on `mocks/F` in headless Chrome with touch events at
  360 px: a drag from the field scrolled 201 px and focused nothing, and a tap focused
  it. Real devices are not tested.
- `touch-action: manipulation` removes the double-tap zoom delay.
- A focus changes nothing: the write runs on `input`, so a stray tap stores nothing.
- No stepper. A «+» or «-» beside a scrolling thumb would change data on a stray tap.
- The field is off in selection mode, where a reader taps along the rows.

The trade-off: a player who uses a potion types the new number. A stepper is a later
request, if players ask.

### Critique findings I reject

- A bottom tab bar. This is a new navigation, out of scope for this feedback. It also
  takes the height that F2 asks for, and the three jobs stay in reach with B1.
- A remove control on the row. The row has none. «Убрать из списка» stays in «··· Ещё»
  of the unfolded row, so no destructive control sits beside a scrolling thumb.

The critique's other points are applied: the sign is gone from the owner's row, the
chevron ends the body at 20 px and the quantity stands apart, and `d-query` has its
clear control. The red and blue tint of the old «×» was a subpixel artifact: `.cq` drew
it in `--muted2`. The sign is gone from every field, so the tint no longer applies.

The clear control: `SearchBox.svelte` is a plain `type="search"` input, so its clear
control is the browser's own (Chrome and Safari draw one, Firefox does not). The mock
draws that control. Batch 9 keeps `SearchBox` as it is, unless the owner wants a drawn
control on every search field, which is a change for batch 3's box too.

**C2** keeps text visible but gives only 4.3 rows. **C3** gives 5.2 more rows than
C1b and drops the pictures. It needs `lists.row_mode`, the `write_lists` and share
projection functions, `import-v3` and export, a down migration and a plan review.

An optional add-on: a memory-only «Подробно» switch that opens every row
(the Q3.2 pattern, nothing stored). It costs one control in the head. I do not
recommend it now. Add it if the phone readers ask.

### Stored setting, if the owner wants one

`user_prefs.prefs` is JSONB with a 4096-byte check, so a default needs no migration:
`prefs.ts`, `dhloot.prefs.v1`, one Display row on `/account`, `STATE.md`, both
languages and tests. About 30 min. A previous frontend drops the field on its next
save, which is a stored-data change, so a plan review applies. It is not needed.

## D. F2-3: search and filter on `/lists/<uuid>`

**What mock 9 intends.** The sentence "no search row below eight entries" comes from
mock 3's list head (`context.md`, round 3: "mocks 6, 8 and 9 align to mock 3's list
head"), and plan section 14 names `/lists/<uuid>` among the list surfaces. But
`listPage()` in `mocks/9/states.js` has no `find` option, no state draws it, no
batch 9 line builds it, and `FEATURES.md` says "The owner's list page `#/lists/<id>`
has no filter". So the mock implies the row and designs nothing. This is new scope
for batch 9.

**Today.** `/s/` has search and filter from 8 entries; the owner's page has neither,
so people share a link to themselves to use them.

| | D1 (recommended) | D2 |
|---|---|---|
| Filter place | Page memory, as the `/lists` index name filter | Address `/lists/<id>/f_<filter>`, as `/s/` |
| Survives | a language switch and a re-read; not a reload | a reload, Back and Forward |
| Contract | none | `ROUTES.md`, `routes.json`, `CONTRACTS.md`, `tests/contracts.js`, `docs/fixtures/`, `llms.txt`: a plan-review trigger |
| Filter link | none: `FilterPanel` takes no `oncopylink` | none is useful: the address opens for its owner only |
| Reason | The address exists to share a filter (`STATE.md`), and this page cannot be shared. | - |
| Trade-off | A reload clears the filter. | A public contract for a private page. |

**The design of D1 (all widths, `/lists/<uuid>`):**

| Question | Answer |
|---|---|
| Threshold | `LIST_SEARCH_AT` = 8, latched per list as on `/s/`. One constant on every list surface. |
| Controls | `SearchBox`, «Фильтры · N» and «Выбрать» last, as `/s/`. Extract `ListFind.svelte` on this second use. |
| Filter rows | `listFacetRows(items, t, lang)` and `LIST_GROUPS`, as `/s/`. |
| Panel | `FilterPanel` with the sheet at every width: pass a non-wide `band`. From 1000 px the side column already holds the list's controls. |
| Count | The meta line reads «Показано 3 из 14 · сохранено» while narrowed, as mock 9 N9-1. No extra line, so the first entry stays at 252 px. |
| No match | «Ничего не найдено» and «Сбросить всё», as `/s/`. |
| Position numbers | True list numbers (3, 7, 13), so the list roll still matches. |
| Reorder | The position field stays live: it holds an absolute number, so a typed move is exact. The grip goes while narrowed, because a gap between two visible rows hides other rows. |
| Hidden tick | It leaves the selection, as on the Items tab (`STATE.md`, `sel`). This page has destructive bar actions, so a bar action never touches a row the reader cannot see. |
| «Все» | Ticks the drawn rows only. |
| «Свой предмет» | A create clears the query and the filter, as the index does, so the new row shows. |
| List actions | Copy, print, download and roll keep the whole list. |
| A not-loaded row | It has no facets: hidden while a value is picked, and no query matches it. The meta line counts it. |

**The first-screen cost.** The search row takes 52 px with its gap. With mock 9's head it puts the
first entry at 300 px at 360x640, past the 256 px limit.

| | D-head 1 (recommended) | D-head 2 |
|---|---|---|
| Today's plan | At 360 «Поделиться», «Печать» and «Бросить по списку» sit on an action row (M9-1). | The same |
| Proposed | Up to 760 px the three actions move into «··· Ещё», at every list size. | The action row stays. A named exception at about 300 px. |
| First entry at 360x640 | 200 px below 8 entries, 252 px from 8, narrowed included | 248 px, then 300 px |
| With requests | about 244 px, then about 296 px | about 292 px, then about 344 px |
| Rows at scroll 0, C1b | 4.8-5.0 | 4.2-4.4 |
| Reason | The rule passes, and phone players seldom print, share or roll. | The owner's answer M9-1 stands. |
| Trade-off | One more tap for those three on a phone. This reverses M9-1. | A third exception, on the page that the Phone-First Rule names first. |

`/s/` stays at 286 px at 360x640 with a search row. Its «Сохранить себе» keeps its
own row (plan section 14), so this needs a named exception either way (Q4).

## Batch placement and gates

Batch 5 takes A. Batch 9 takes B, C and D. Criterion: C and D share the row, the
component, the seed and the filter set of `/lists/<uuid>` and `/s/`, so a split has
no criterion (`CLAUDE.md`, "Task and session protocol") and two splits would re-seed
the same goldens twice. B is ten lines and needs no batch of its own. Batch 8 takes
nothing. Batch 9 is already the largest batch, so its review is heavier. A new
batch would cost 45-60 min; the merge costs about 25-35 min.

| Item | Added gates | Minutes |
|---|---|---|
| A | none: three acceptance lines in batch 5's run | 0 |
| B | `node tests/app/sweep.js 360`, the anchor cases of `app/states` | about 10 |
| C | the new 360 px goldens, axe cases, `check:fast` growth | about 10-15 |
| D | the new goldens, `lists.test.ts` cases | about 5-10 |
| Total | on top of batch 9's 45-60 min and its 768 px sweep | about 25-35 |

The remaining total of plan section 8 becomes about 586-749 min, 9.8-12.5 hours.
Batch 9 keeps writer test 3 (goldens, visual judgement) and needs no test 2.

**Moves in `FIRST_SCREEN` (`tests/app/states.js`):**

- `LIST_A as gm4` (`SEVEN_SPECS`, 7 entries): `shipped: true`, 200 px under D-head 1.
- New row, a list of 8 or more entries: asserted at the rule, 252 px, or at an
  `exception` of 300 px under D-head 2.
- The requests row: under D-head 1 the 7-entry state passes at about 244 px, so the
  292 px exception narrows to 8 or more entries at about 296 px. That is past the
  owner's figure, so the batch names it.
- New `/s/` row of 8 or more entries: `exception` 286 px at 360.
- DESIGN.md "The First-Screen Rule" lists each exception with the owner's date.

**New inventory states (each with its golden in RU and EN; `golden.js` already takes
`width`):** `LIST_A ~ compact` (360), `~ compact, row open` (360), `~ many` (the
search row), `~ filter sheet` (360), `~ narrowed`, `~ no match`, and
`#/s/player-token-1 ~ compact` (360). The list «Ещё» menu state of batch 9 grows.
Existing list and `/s/` goldens at 1100 px change only where the list has 8 entries
or more.

**Text changes:** `FEATURES.md` "Lists", "Account and browser lists" (the sentence
"has no filter" goes), "Chrome"; `STATE.md` (Filters and UI rows: the list page's
query, picks and `openRows`); `DESIGN.md` "Layout", The Two Breakpoints Rule
(`--anchor-top`, the 45 px sticky row), The First-Screen Rule; `COVERAGE.md`; one
file under `docs/decisions/` (the compact row, no stored mode, the filter in memory).
`ROUTES.md`, `CONTRACTS.md`, `routes.json` and `llms.txt` do not change.

**Batch 9 acceptance lines this adds:** the compact row and its unfolded row; the
true position numbers; the position field in the unfolded row (WCAG 2.5.7); the
search row, the sheet, the meta count, the hidden tick, the grip while narrowed; the
create that clears the filter; B1, `--sticky-h`, `--anchor-gap` and the Shift+Tab
proof at 360 and 1180 (0 covered stops). `mocks/F/` replaces mock 9 for the row and
the head up to 760 px; every other mock 9 state stands.

## Standing checks

### Scale

`/lists/<uuid>` and `/s/`, up to 760 px (from 761 px: mock 9, unchanged except the
search row). Limits: 100 entries by default, 300 at 3x.

| State | The screen shows | Proof |
|---|---|---|
| Empty | The empty state and «Добавить свой предмет»; no search row | unchanged |
| One | One compact row | new 360 golden |
| 7 | No search row, «Выбрать» on the title row | `FIRST_SCREEN` |
| 8, many | Search row, «Выбрать» last in it | `~ many` |
| 100, the limit | About 7700 px of rows; «Добавить свой предмет» last and off, with the limit note | `sweep 360` |
| 101, the refusal | Unchanged toast | unchanged |
| 300, 3x | About 23100 px, not 84000 px today; no virtualizing needed | a unit test of filter time |
| Longest name | 120 characters: two lines and an ellipsis; the full name in the unfolded row | new state |
| Longest price | «7 сундуков 5 мешков» beside «Расходник» wraps to a second meta line at 360; nothing is cut | `mocks/F/c1-book` |
| 1180 | Mock 9's row, the search row over it, the sheet | `~ many` |

Row order is list order. The primary action stays last on the page. The filter sheet
is at most 544 px at 360x640, and its body scrolls; it has no text field, so the
keyboard does not open over it. The search field sits in the page: with the keyboard
open about 380 px stay, minus the 45 px header. The sticky regions are the header
(45 px or 111 px) and the selection bar (129 px; 213 px RU on `/s/`). Neither can
pass the viewport height, as mock 9 measured.

### Error scenarios

| Scenario | The screen shows | Stored data |
|---|---|---|
| Loading | «Загружаем...», unchanged | - |
| Failed read | «Список не загрузился», unchanged | kept |
| Failed write | The quantity shows at once; «Не сохранено» on the meta line, the same buffer | kept in the buffer, as today |
| Offline | The same; open rows and the filter stay | as today |
| Conflict | A re-read redraws; last write wins; open rows are keyed by entry id | as today |
| A named record deleted | The row draws its key and «Предмет не загружен»; a filter hides it; the meta line counts it | kept |
| Entry removed elsewhere | The row leaves; its open mark and its tick go | as today |
| Stale tab | Nothing new is stored, so nothing differs | - |
| Revert | The previous frontend draws full rows; nothing to migrate | no change |

No path can lose stored data. `--selbar-h` and the write path do not change.

### Consistency

Rules followed: 1 (one counter, at the head), 2, 5 (quantity is silent, as today), 6,
12 (folds), 20 (focus returns to «Фильтры», as `/s/`). Named differences from the
sibling pages:

| Axis | Difference | Reason |
|---|---|---|
| Row press | Unfolds the row; a catalog row opens the card | The list row holds what the card does not: notes, fields |
| Filter place | Memory; `/s/` and the Items tab use the address | This page cannot be shared |
| Hidden tick | Leaves; `/s/` keeps it, as a buyer picks across filters | The bar here deletes; follows the Items tab |
| Filter panel | Sheet at every width; a column on the catalog | The side column is taken |
| Count while narrowed | Replaces «N из M» (rule 1) | Mock 9 N9-1; the limit returns when cleared |
| Action row at 360 | In «Ещё» (D-head 1); `/s/` keeps its primary | Reverses M9-1 if the owner agrees |

### RU/EN parity

The strings exist: `shownOf`, `filters`, `filtersN`, `showN`, `reset`, `resetAll`,
`searchPh`, `nothing`, and the row menu's labels. New: at most one label pair for
the quantity field, «Кол-во: %s» / "Qty: %s", and the short kind names of the badge,
which reuse the filter's values. The C1b line reuses the record's own text and stat
parts. Same facts, ASCII punctuation, no new plural set.

## Owner questions

Each has my recommendation first. The decisions are yours.

1. **Q1 (F1).** Batch 5 hides the title up to 760 px and moves both buttons. Keep this
   (A1, recommended), or keep the title and wrap it (A2, about 75 px lower on every
   roll page)?
2. **Q2 (header).** Take B1, the brand row scrolls away and the jobs stay
   (recommended), or B2, the whole header hides and returns on scroll up?
3. **Q3 (rows).** Take the compact row with one text line as the phone default on
   `/lists/<uuid>` and `/s/` (C1b, recommended, 7.7 rows at 360x640), or the row with no
   text line (C1, 10.3 rows)? Either way a phone reader presses a row to read the whole
   text. This is the one user-visible loss in the set.
4. **Q4 (head).** On phones move «Поделиться», «Печать» and «Бросить по списку» into
   «Ещё» (D-head 1, recommended, reverses M9-1), or keep the row with an exception of
   about 300 px? Also confirm a named exception of 286 px for `/s/` with a search row.

Planner defaults, unless you object: the filter in memory (D1), a hidden tick leaves
the selection, the grip goes while narrowed.

## Plan-review triggers

None for the recommended set. Each of these would fire one: A stored display setting
(C with `user_prefs`), a `lists` column (C3), the address form (D2).

Not verified: real iOS Safari behavior of B1, and the on-screen keyboard heights,
which are estimates. Impeccable `critique` on `mocks/F/` is the orchestrator's step.
