# Review - batch mocks-2 (57)

Verdict: fix-then-continue
Reviewed: 6d7df497709fa98685ff916ce5fc33403907293f
Scope: batch mocks-2

An independent review of the batch mocks 1, 1b, 2-9 and P before the owner approves them. The
review does not read the plan, the handoff, the audit or the earlier reviews. Severity: blocker =
a feature lost, or a product law or an owner rule broken; major; minor. Each finding gives the
mock, the state, the width, the language, the fix and "owner: yes/no" (does the fix need the
owner's answer). A difference from DESIGN.md alone is not a finding; those are in "Departures
from DESIGN.md" below (coordinator correction, 2026-10-29).

Method: Impeccable critique and audit lenses applied by eye to the PNGs (360 first, RU and EN,
then 1180), FEATURES.md for required behaviour, DESIGN.md as the system today. The live app was
not opened: no browser tool was available to this session (see "Checks still needed"); "today"
comes from FEATURES.md and the main tree.

## Blockers

Mock 3 - catalog tables

- **B3-1** `catalog-selection`, `catalog-selection-screen`, 360 and 1180, RU and EN. The
  selection bar holds «В список», «Скопировать текст» and «Снять выделение». «Печать» is gone.
  FEATURES "Print" names the tables selection bar as one of the three print controls. Fix: add
  «Печать» to the bar (as mock 9's /s/ bar draws it), before «Снять выделение». Owner: no.

Mock 4 - record card and dialog

- **B4-1** `item-dialog`, 360, RU and EN. The fixed bar holds «В список», «Поделиться» and «Ещё»;
  the «Ещё» sheet (`item-more`) holds the four copy actions and «Сохранить себе». «Печать» is on
  no control of the dialog at 360. At 1180 the dialog draws it. FEATURES "Print": the pick row of
  the record modal prints. Fix: put «Печать» in the dialog's «Ещё» sheet at 360, or give the bar
  a second row («Поделиться», «Печать», «Ещё»), as the item page at 360 does. Owner: no.

Mock 5 - roll pages

- **B5-1** `roller-alt`, `roller-alt-crit`, RU and EN. The primary reads «Бросить кости» / "Roll
  the dice" at 360 and «Бросить Кости Дуальности» / "Roll the Duality Dice" at 1180. Owner
  (2026-10-29): one label per action on every page and state. Fix: one label at both widths;
  recommended «Бросить кости» / "Roll the dice", because it fits 360. Owner: no.
- **B5-2** `roller-alt*`, 1180, RU and EN. The chip reads «Альт. таблицы» / "Alt. tables"; the
  page heading reads «Альтернативные таблицы» / "Alternate tables". Owner (2026-10-23): the chip
  text matches the page heading. Fix: the chip reads «Альтернативные таблицы» / "Alternate
  tables" (two lines at 360 are allowed), or the heading takes the chip's words. Recommended: the
  full words on the chip, because an abbreviated h1 reads worse. Owner: no.

Mock 6 - homebrew

- **B6-1** `homebrew-select`, 360 and 1180, RU and EN. The bar holds «Переместить (2)», «Скачать
  JSON (2)», «Удалить (2)» and «Снять выделение». FEATURES "Homebrew" (Items tab): a tick feeds
  the selection bar with add to a list, print and copy. «В список», «Печать» and «Скопировать
  текст» are gone. Fix: draw mock 3's bar actions («В список», «Скопировать текст», «Печать») and
  the strip's three actions; at 360 put the strip's actions behind one «Ещё» in the bar to keep
  its height down (see R6-1). Owner: no.

Mock 7 - search, account, print preview

- **B7-1** `print-preview`, `print-settings`, 360 and 1180, RU and EN. The switches read
  «Цветная» / «Чёрно-белая» and «Обычный лист» / «Компактный» ("Color" / "Black and white",
  "Standard sheet" / "Compact"). Owner QP.7: short labels «Цвет» / «Ч/б» and «63×88» / «44×63».
  Mock 1b's and mock 6's editor preview already use the short pair. Fix: re-render mock 7 with
  the QP.7 labels. Owner: no.
- **B7-2** `search-*`, 360 and 1180, RU and EN. The search page draws no «Выбрать», no ticks and
  no selection bar. FEATURES "Print" names the search selection bar as a print control (and it
  adds to a list and copies). Fix: give /search mock 3's list head («Поиск», «Вид: все ▾»,
  «Выбрать» last) and the one selection bar. Verify against the live app first (not opened in
  this review). Owner: no.

Mock 9 - list pages

- **B9-1** `list-roll`, 360, RU and EN. The list roll's result draws the full card face (art on
  top, about 280 px tall). Owner (2026-10-29): a compact roll result card at 360 (96 px art
  beside the text), the full face from 600 px. Fix: use mock 5's compact card at 360. Owner: no.

## Risks

Cross-mock (new-system consistency)

- **R0-1** Icon-only «···»: mock 5 (every roll result, 360 and 1180), mock 2
  (`roller-supmenu`) and mock 9 (every list row) draw a «···» button with no label. Mock 4
  («··· Ещё») and mock 8 («··· Ещё» on cards) label it, and mock 4 states "every action has a
  text label at every width". Fix: «··· Ещё» / "More" everywhere, or name one rule that allows
  the icon-only form in a dense row with a visible accessible name. Recommended: the label,
  because the Clarity Rule asks a label to say what the control does. Owner: no.
- **R0-2** The one selection bar has four shapes. Mock 3: «Выбрано: 1», no «Все». Mock 6: «Все»
  inline before «Выбрано: 2». Mock 9 list: «Все» on its own row, «Выбрано 2 позиции · 7 шт. ·
  Итого: 400 зол.» (no colon). Mock 9 /s/: «Выбрано: 2 · 2 шт.», no «Все». FEATURES (lists,
  homebrew) keeps «Выбрать все». No mock draws selection mode with zero ticks, so the way out of
  the mode is not drawn. Fix: one bar in mock 3: «Все» (tri-state), «Выбрано: N» plus the page's
  extra facts, the page's actions, «Снять выделение» last; draw the zero-tick state and say what
  ends the mode. Owner: no.
- **R0-3** The page heading changes with the width on list pages. Mock 3: h1 «Таблицы» at 1180,
  «Оружие ▾» at 360. Mock 6: «Мои предметы» at 1180, «Предметы ▾» at 360. Rule 4 (one name) and
  rule 7 (fixed heading). Fix: keep the page name as the h1 at every width (visually hidden at
  360 if it must be) and make the picker a button whose accessible name names it («Таблица:
  Оружие»). Owner: no.

Mock 2 - shell

- **R2-1** `header`, `mode-long`, 360, RU and EN. The roll-page frames draw an h1 («Обычные
  правила», "Community items") under the mode row. Mock 5 and the owner's answer ("the heading
  merged") draw no h1 at 360. Fix: re-render mock 2's 360 roll frames without the h1, or mark
  them superseded by mock 5. Owner: no.

Mock 3 - catalog tables

- **R3-1** `catalog-filtered`, 360, RU and EN. No pill row at 360: the chosen values are not
  visible while the sheet is closed; only «Фильтры · 2» says that two are on. FEATURES "Tables and
  search": chosen values show outside the panel so they are reachable while it is folded. The
  owner settled this for /homebrew at 360 only. Fix options: (A, recommended) accept, and add
  the chosen values to the count line as text («Ранг 1, Вплотную · 23 из 458», one line,
  cut); (B) one scrolling pill row, which costs about 40 px and fails the first-screen rule
  (325 px). Owner: yes.
- **R3-2** `catalog-picker`, 360. A table in another group takes three taps against two today
  (the mock names it). Fix: accept (one labelled sheet), or keep the group row visible. Recommended:
  accept, because the sheet holds both levels in one place. Owner: yes.
- **R3-3** No state shows the «Свои предметы» / "Own items" switch (FEATURES "Tables and search":
  /search and the equipment tables' toolbar, signed in with own items). The list head pattern
  gives it no place. Fix: draw `catalog` and `search-results` signed in with own items, and give
  the switch its place in the head (after the view switch at 1180, in the filter sheet at 360).
  Owner: no.

Mock 5 - roll pages

- **R5-1** `roller-config`, 360, RU and EN. «Настроить» holds the manual entry, Источник, Тип,
  «Скопировать все четыре», the pin and «Где какая редкость». «Скопировать все четыре» acts on
  the results, and the pin and the help are page actions; the label says "set up". At 1180 the
  copy sits in the results head, and mock 3 puts rare page actions in «Ещё». Fix: at 360 put
  «Скопировать все четыре» on the results line (an icon-and-label button, or in a «Ещё» beside
  «Настроить»), and the pin and the help in that «Ещё»; «Настроить» keeps the roll inputs. Owner:
  no.

Mock 6 - homebrew

- **R6-1** `homebrew-select` with «Переместить (2)» open, 360. The sticky bar is about 390 px of
  a 640 px screen (61%) and covers most of the list. Standing check 1. Fix: open the move form as
  a sheet over the page (as the filter sheet), and keep the bar to two rows. Owner: no.

Mock 7 - search, account, print preview

- **R7-1** `account-delete`, 360, RU and EN. The typed confirm field and «Удалить навсегда» sit
  in the lower half of a bottom sheet; the on-screen keyboard (about 260-300 px) covers them.
  Standing check 1. The same applies to any sheet with a text field (mock 8's add-to-list «+
  Новый список»). Fix: a sheet with a text field docks to the visual viewport above the keyboard,
  or opens as a full-height sheet with the field on top; draw the keyboard-open frame. Owner: no.

Mock 9 - list pages

- **R9-1** `list-requests`, 360, RU and EN. The mock makes the requests panel head the primary
  content; the first entry starts about 1100 px down. The First-Screen Rule (DESIGN.md) names the
  first entry on /lists/<uuid>. Fix options: (A, recommended) at 360 fold the panel to its head
  («Новое в списке (3)» and «Открыть»), so the first entry stays in the first screen; (B) name
  an exception for the open panel. Owner: yes.

Mock P - print

- **RP-1** `page-current`, `page-proposed`, 360 and 1180. Mock P draws /p/ on the pre-batch-1
  build: five tabs, «Лут» on the EN page, gold switches, the radial ground, EN "Colour",
  «Отправить на печать» / "Send to printer", a fixed bottom bar with «Ещё», cards at full width at
  360. Mock 7 draws the same page in the new shell: «Напечатать» / "Print", «Настройки листа ▾»,
  «Весь лист», cards at 238 px. Two designs of one page; the owner answers QP.6 and QP.7 on the
  stale one. Fix: re-draw P's page frames on mock 7's shell with QP.6 and QP.7, and one primary
  label. Recommended label: «Напечатать» / "Print", because «Отправить на печать» does not fit
  the 360 row beside «Настройки листа». Owner: yes (the label).
- **RP-2** The fit table: the smallest compact text is 3.9 pt (EN, Source Sans 3) and 4.2 pt
  (RU); today it is 3.2 pt. DESIGN.md sets a paper floor of 4.5 pt for labels and 5 pt for
  values. The table does not name which element goes under the floor. Fix: name the element
  (likely a strip label or the footer source line), apply the floor to it, and show the result
  in the table. Owner: no.

## Nits

Mock 1

- **N1-1** `type`, 360, RU and EN: the stat line in the `--t-data` row and the «Цифры» rows run
  past the panel's right edge ("Двуручное" cut). Rule 16: nothing scrolls sideways. Fix: let the
  line wrap. `local`
- **N1-2** `print`: the colour card still draws the dark well; the owner chose the light well (mock
  1b). Fix: mark the state superseded by 1b. `local`

Mock 1b

- **N1b-1** The sheets text calls the margins "product-law values"; QP.2 changes them (7.75 /
  13.15 mm) in batch P. Only the sheet counts and the layouts are law. Fix: reword. `local`

Mock 2

- **N2-1** `roller-supmenu`, 360: the menu items are about 41 px tall (the account menu's are 44
  px, FEATURES "Chrome"), and the menu does not mark the open supplement. Fix: 44 px items and a
  check on the current one. `local`
- **N2-2** `header`, 1180, EN: «Справка» / "Help" stays on Vault of Ages while the mock's own rule
  says the button takes the name of the panel it opens. Fix: name it by its content, or ask the
  owner whether that panel stays (help panels are decided per mock). Owner: yes. `local`
- **N2-3** `toasts`: the plate toast on the dark rows separates by shadow only. Fix: a Seam Lit
  or `--muted2` border on the toast plate so it reads at a glance at the table. `local`

Mock 3

- **N3-1** `catalog-filtered`, 360: «23 из 458» sits in the «Ранг 1» section head and reads as the
  section's count; the pattern table itself says «Показано 23 из 458». Fix: the pattern's words,
  on its own line under the search row. The mock data also shows 4 rows for "23". `local`
- **N3-2** `catalog-grid`: the grid drops the section heading and «Ссылка на раздел» (FEATURES:
  every heading has a copy-link button). Fix: keep the section heads in the grid. `local`
- **N3-3** Rows and tiles at 360 (also mocks 1, 6, 9): a meta separator starts a line ("· Двуручное").
  Fix: keep each separator with the value before it. `local`

Mock 4

- **N4-1** `h-item`, `h-item-signedout`: «Сохранить себе» is inside «Ещё» on /i/ but a separate
  button with a sentence under it on /h/. The owner kept the relink line as the menu item's second
  line; the sentence under a button is help text (Clarity Rule). Fix: one placement on both
  pages; recommended inside «Ещё» with the relink as the item's second line. `local`
- **N4-2** `h-item`: the relation lines use Unicode arrows; product text other than Russian takes
  ASCII. Fix: drop the arrows (the labels «Получается из» / «Улучшается до» carry the meaning).
  `local`

Mock 5

- **N5-1** `roller-alt*`, RU: the dice letters are Latin «H» / «F» beside «Кость Надежды» /
  «Кость Страха». Fix: «Н» / «С» in RU, or no letter. `local`
- **N5-2** Supplement modes: the primary reads «Случайно 1-30» / "Random 1-30", which does not say
  "roll"; the alternate tables say «Бросить кости». Fix: «Бросить 1-30» / "Roll 1-30". `local`
- **N5-3** `roller-alt`, 1180: the five-option rarity segment wraps to two rows inside its pill
  track. Fix: a chip row (pills one per option) or a select, as at 360. `local`

Mock 6

- **N6-1** `homebrew-items`, `homebrew-select`, 360: «Новый предмет» has no plus icon; at 1180 it
  has one (rule 8). Mock 8's «Новый список» has none at either width. Fix: the plus icon on
  every «Новый ...». `local`
- **N6-2** `homebrew-items`, 360: the counter «9 предметов из 100» shows only inside the picker
  sheet (rule 1: at the head of the collection). Fix: the counter under the search row, or name
  the departure. `local`
- **N6-3** `editor`, RU and EN: «Текст на языке RU ● EN ○» carries a state with unlabeled dots
  (Clarity Rule). The EN frame shows "Emberaxe" in the name field with RU pressed and RU text in
  the preview. Fix: a worded state («EN: пусто»), and one consistent language state in the
  frame. `local`

Mock 7

- **N7-1** `search-empty`, 360, EN: the placeholder "A name or text, for example" is cut, and the
  example chip reads "№ 12" on the EN page (EN badges read "No."). Fix: a shorter placeholder;
  "No. 12" if search reads it. `local`
- **N7-2** `account-settings`: the print default is a «Цветная / Чёрно-белая» segment plus a
  «Компактный лист» checkbox; /p/ sets the same values with two short segments (QP.7). Fix: the
  same two segments in both places. `local`
- **N7-3** Missing states: /p/ loading and failed read; /account loading and failed read. Fix:
  draw them with mock 4's patterns. `local`

Mock 8

- **N8-1** `lists-index`: the «Новое в списке (3)» chip takes a gold-soft label and a gold border;
  the mock's own budget lists gold on three controls only. Fix: neutral chip with Chalk text, or
  add it to the budget with its reason. `local`
- **N8-2** `lists-limit`: 12 cards and «и ещё 38 списков»; FEATURES "Lists" draws 24 cards and
  «Показать ещё (N)». The change is not named. Fix: name it in FEATURES, or keep 24 and the
  spec's button. `local`
- **N8-3** `lists-new`: the name field has a placeholder only («Клад дракона»); rule 15a. Fix: a
  visible label «Название списка», or name the departure. `local`

Mock 9

- **N9-1** `shared-*`: the count «6 из 6» / "7 of 7" shows when nothing narrows the view and has
  no noun; mock 3's count shows only while narrowed. Fix: «6 позиций», and «Показано N из M» only
  under a filter. `local`
- **N9-2** `list`, 360: «Цены» moved into «Ещё» and the notes behind «Заметки ▾» (one more step
  each). Accept or ask; recommended accept for «Цены» (rare), keep «Заметки» on the meta line.
  Owner: yes. `local`
- **N9-3** `shared-filters`, 360: the sheet head has no «Ссылка на фильтры», which mock 3's sheet
  has. Fix: the same head, or name why /s/ has none. `local`

Mock P

- **NP-1** Proposed cards: the name reads lighter than today's 900 weight. Fix: check that the
  Source Sans 3 Black face loads for the name and the tier number (DESIGN.md print weights).
  `local`
- **NP-2** `proposed-ss3-std9-colour-ru__card-long`: uneven line gaps in the rules text where a
  bold italic run sits. Fix: one line-height for the runs. `local`

Index and chrome

- **N0-1** `mocks/index.html`: mock 5 still reads "Waiting for the owner"; the owner chose
  variant A. Mock P is not listed. Fix: update the index. `local`
- **N0-2** The error-page pattern (icon in a circle, heading, sentence, two buttons) and the
  dashed empty-state plate with a glyph tile are template shapes (Impeccable anti-pattern). Fix:
  drop the circled icon; keep the heading, the cause and the action. `deferred-scope`
- **N0-3** Bottom sheets draw a grab handle. Fix: build swipe-to-close, or drop the handle (a
  false affordance otherwise). `local`
- **N0-4** The sticky header at 360 is 111 px in the measures and "about 108" in mock 2's critique.
  Fix: one number. `local`

## Departures from DESIGN.md

No severity. Each row names the rule a batch rewrites.

| DESIGN.md rule | Mock | What the mock does |
|---|---|---|
| Navigation, "Tabs" (five tabs, «Дополнения» panel of chips) | 2 | three jobs with icons, a mode row of three controls, a «Дополнения ▾» menu |
| Navigation, "Brand" (wordmark never translated) | 2 | EN wordmark «Loot» |
| Two Breakpoints Rule | 2, 4, 7, 9 | new steps at 760 px (pin, menu vs sheet, print cards) and 1000 px (side column) |
| Layout (header 106 / 112 px) | 2 | 111 px sticky at 360 plus a mode row that scrolls |
| Toast (gold pill, white error text) | 2 | a plate with the Float shadow; error toast with dark ink on the alarm fill |
| Filter pills (chosen values outside the folded panel) | 3, 6 | no pill row at 360; none at any width on /homebrew |
| Chips (7px 12px) | 2, 5 | 40 px mode chips and dice at 360 |
| Segmented control (neutral for mode toggles only) | 6 | segments with the neutral check as form field pickers |
| Shapes, artwork (square, 420 px full card) | 4, 5 | 4:3 crop window on the item page, the dialog and roll cards |
| Cards, compact (132 px image) | 5 | 96 px image at 360 |
| Buttons, danger (red border and text) | 7 | filled alarm red with dark text in the delete confirm |
| Shapes (dashed border = a property) | 3 | dashed plate for every empty state |
| Don'ts (no illustrated empty states) | 3 | a kind-glyph tile in the empty state |
| Seal Rule (selection neutral) and FEATURES "ticked card gold border" | 3, 6, 8, 9 | ticked rows and cards lit, neutral, no gold border |
| Seal Rule (gold budget) | 8 | gold-bordered «Новое в списке (3)» chip |
| Components (no sheet) | 3, 4, 7, 8 | bottom sheets at 360 for menus, filters, the dialog, the delete confirm |
| Print card (63x88, 14.5 / 8.5 mm, `--print-ui`, 3.5cqw) | P | 63.5x88.9 mm, 7.75 / 13.15 mm, Source Sans 3, 4.0 / 4.6cqw |
| Print card (art region) | 1b | light well `#ebe7f0` with the glyph in `#3a3350` on a colour card with no picture |
| Badges (roll number) | 5 | roll number shown at 1180 only; rarity badge at 360 |

## Deviations

The mocks name these themselves; they are not handoff deviations (the handoff was not read).
Accepted, because an owner answer covers each: /roll/std exception at 360 (variant A, about 325
px); «Печать» into «Выбрать» on /s/ at 360; the 200-character name cut at 360; the /homebrew
primary marker on the first group head; «Новый список» on at 50 of 50; the light print well.
Not accepted without the owner: R3-1, R3-2, R9-1, RP-1 (label), N2-2, N9-2.

## Standing checks

1. Scale: checked - `lists-limit` (50 of 50), `list-limit`, `editor-longname`, `list-longname`,
   `shared-longname`, the sticky bars at 360 and the sheets with a text field. Findings R6-1
   (bar 61% of the screen), R7-1 (keyboard covers the sheet). No mock draws 3x the defaults
   (150 lists, 300 own items, 300 entries); FEATURES caps most of them, so only the 300-hit
   search cap line and a 3x homebrew list remain undrawn (N7-3 adds the missing states).
2. Error scenarios: checked - `h-item-failed`, `own-item-failed`, `homebrew-error`,
   `lists-error`, `list-error`, `editor-conflict`, `editor-errors`, `shared-gone`, `print-nope`,
   the error toast. Mocks write nothing, so no data loss applies; /p/ and /account have no
   failed-read state (N7-3).
3. Consistency: checked - FEATURES "Consistency rules" 1, 4, 7, 8, 9, 12, 15, 16, 17 against
   the sibling mocks. Findings R0-1, R0-2, R0-3, R2-1, RP-1, N3-1, N6-1, N6-2, N7-2, N8-2, N9-1.
4. RU/EN parity: checked - every state at 360 in both languages, 1180 for the main states.
   Findings N5-1 (Latin dice letters in RU), N6-3 (RU preview on the EN editor frame), N7-1 ("№"
   on EN), RP-1 (EN "Colour" against the owner's American spelling, Q3). Mock 7's EN print
   frames show RU cards (named by the mock as R's RU capture).

Owner rules: checked - the context file's "Owner directions" and "Decisions already settled"
against each mock. Broken: one label per action (B5-1, and RP-1 across mocks 7 and P), the chip
matches the heading (B5-2), QP.7 short labels (B7-1), the compact roll card at 360 (B9-1), the
relink line as the menu item's second line (N4-1). Held: the first-screen rule as measured
(except R9-1), phone-first at 360, the mode row of three controls, job labels with icons at
every width, the EN wordmark, the account menu order with no counts, «Бросок» to the start
section, the help panel answers (Q6.1, Q6.2, Q8.1, Q9.1, C1, C38), the 40 px mode chips and
dice, the list head «Выбрать» last, QP.1 to QP.6 and QP.8 in mock P's cards, Q1b.1 and the
light well in 1b, the share card text with "armor".

## Suggested next action

One mock fix pass: unit A takes B3-1, B4-1, B5-1, B5-2, B7-1, B7-2, R0-1 to R0-3, R2-1, R3-3,
R5-1, R7-1 and the `local` nits of mocks 1-5 and 7; unit B takes B6-1, B9-1, R6-1 and the
`local` nits of mocks 6, 8 and 9; the print owner re-draws P's page frames (RP-1) and answers
RP-2. Then put the owner questions (R3-1, R3-2, R9-1, RP-1 label, N2-2, N9-2) to the owner with
the recommendations above, before batch 2 starts.

## Checks still needed

- The live app (https://daggerheart-loot.pages.dev and /en/) at 360 and 1180 was not opened: no
  browser tool was exposed to this session. B7-2 (search selection), the pin at 360 today, the
  catalog row ticks today and the EN "entries" wording need a live look.
- Target sizes as built: the section copy link, «Снять выделение», the row tick boxes (drawn
  about 22 px) and the inline «Заметки ▾» link against WCAG 2.5.8.
- Contrast as built: the plate toast border, the muted unpressed segment labels and the alarm
  fill with dark ink (the mock states about 6:1).
- The Figma inspect of node 714-42387 for the print well values (named by mock 1b).
