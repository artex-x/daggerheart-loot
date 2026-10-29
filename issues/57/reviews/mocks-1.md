# Review - mocks 1, 1b, 2-9 before owner approval (57)

Verdict: fix-then-continue
Reviewed: ea4af0d217b26179ca8de52b893df8ae91872aaf
Scope: batch mocks-1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

This is an independent read of the batch mocks against `docs/specs/FEATURES.md`,
`DESIGN.md`, `PRODUCT.md`, the owner rules in `issues/57/context.md` and the
Impeccable critique, audit, craft-floor and operate guidance. `plan.md` was not
read. The coordinator's mid-task scope adds every UI and UX gap and each
contradiction with Impeccable.

Method note: DEGRADED: single-context (read-only reviewer). The Impeccable
lenses were applied by reading the renders. The Impeccable launcher and the
detector were not run; the detector results that each mock page records are
cited as they stand. About 500 PNGs exist. This review read every mock index
and sampled the renders 360 first (RU and EN), then 1180, for each state that
carries a feature risk. A state that is not named here was not read in full.

Severity: blocker = a feature lost or a product law broken; major; minor.
"Owner" = the fix needs the owner's decision.

Counts: 6 blockers, 19 major, 22 minor.

## Blockers

### Mock 5 (roller)

- **M5-1 - manual roll entry, source and type are folded under the results.**
  `roller`, `roller-config`, 360, RU and EN. «Или введите свой бросок» (a GM
  who rolls real dice), «Источник» (Core / Hope & Fear) and «Тип» (items /
  consumables) sit in «Настроить бросок» under four result cards, about
  1700 px down. The 1180 pane keeps all three. A GM on a phone must scroll
  past every result to enter a roll or to narrow the next one.
  Fix: shorten the results heading to «Бросок 1» / "Roll 1" and put a
  «Настроить ▾» / "Set up ▾" button at the right end of that same line. The
  button opens the panel above the results. This adds no height, so the
  240 px target holds. Owner: no.
- **M5-2 - three controls are drawn nowhere at 360.** `roller-config`, 360,
  RU and EN. The index says that the fold holds the pin and «Где какая
  редкость», and that «Скопировать все четыре» goes into the fold. The
  render of the open fold shows only the number field, the source row and
  the type row. "Copying every option of a roll" (FEATURES "Records"), the
  pin (FEATURES "Chrome") and the C38 panel that the owner kept and renamed
  are lost on a phone.
  Fix: draw all three in the panel of M5-1, in this order: copy, pin, help.
  Owner: no.
- **M5-3 - the dice buttons lose their rarity labels at 360.** `roller`,
  360, RU and EN. FEATURES "Rolling" says: "each button is labelled with the
  count and the rarities it covers". At 360 the buttons read only 1d12 to
  5d12. The rarity badge on a result tells the rarity after the roll, so a
  GM cannot choose a die by rarity before the roll. 1180 keeps the labels.
  The mock does not name this as a spec change.
  Fix (recommended): draw the dice as two rows (3 + 2) with the rarity line,
  merge the heading line as in M5-1, and measure. If the first result then
  passes 256 px, the owner chooses between the rarity labels and the 240 px
  target. Owner: yes.
- **M5-4 - a critical success offers one table link when both kinds are
  on.** `roller-alt-crit`, 360 (1180 not read), RU. «Тип» is «Все», but the
  critical plate draws one link, «Таблица этой редкости». FEATURES
  "Rolling" says: "With both kinds on the two links name their tables
  apart". The consumables table link is lost.
  Fix: with both kinds on, draw two links that name their tables (for
  example «Предметы: Обычная» and «Расходники: Обычная»); with one kind on,
  draw one link with the general label. Owner: no.

### Mock 3 (catalog)

- **M3-1 - the filter link is gone.** `catalog-filtered`, 360 and 1180, RU
  and EN. Rule 17 and FEATURES "Tables and search" name three copy buttons
  on a catalog table: the table link, the filter link and a block's link.
  They also say that the chosen values show as pills "with a reset and a
  copy-link button". The mock draws the pills and «Сбросить» at 360, and
  «Сбросить» in the column head at 1180, but no «Ссылка на фильтры» /
  "Link to these filters" at either width.
  Fix: at 360, add the copy-link button at the end of the pill row. At 1180,
  add it in the filter column head beside «Сбросить». Owner: no.

### Mock 1b (print well)

- **M1b-1 - the light well and the glyph contradict Figma node 714-42387.**
  `print-card`, `print-sheets`, `editor-preview`, all widths, RU and EN. The
  coordinator's fact (the node was viewed in the owner's browser): a card
  with no picture (for example «Возвращающийся клинок» or «Скипетр») has a
  blank paper art area, with no outline, no glyph and no tone. The mock
  proposes `#ebe7f0` with a `#3a3350` glyph. Two statements that the
  decision rests on are wrong:
  - FEATURES "Print" says that the node draws "an outline per kind".
  - Option B in 1b says that its silhouettes are "exported from the node".
    They are the app's own `PRINT_GLYPH` paths from before `eb899604`.

  The print review requires the owner's yes for each departure from the
  node.
  Fix (recommended): follow the node. On paper, the art block of a colour
  card with no picture is blank paper, with no well, no glyph and no fade.
  The screen keeps the dark well with the glyph (batch 1). Drop option B.
  Correct the FEATURES "Print" lines in batch 1b. Accepted trade-off: the
  paper card shows no kind mark in the art area, and the kind badge under
  the art names the kind.
  Alternative: keep the glyph on the light well as a named departure from
  the node. Owner: yes.

## Risks

Major findings, grouped by mock.

### Mock 5 (roller)

- **M5-5 - the first-screen rule fails on the sibling roll pages.**
  `roller-alt-crit`, 360: the first result starts at about 1080 px.
  `roller-mwt`, 360: the first result starts at about 680 px. Both are past
  the 256 px limit. Mock 5 measures `/roll/std` only. The layout is also
  inconsistent: `/roll/std` hides the H1 and folds the pin and the help at
  360, while `/roll/alt` and `/roll/many_worlds_tavern` keep the H1, the pin
  and the help above the controls.
  Fix: give every roll mode the layout of `/roll/std` (H1 visually hidden at
  360, the pin and the help in the panel, the pickers compact). Measure all
  nine modes at 360x640 and 1180x720, and add a row for each to the
  first-screen table. Owner: no.
- **M5-6 - a closed «Настроить бросок» hides a narrowed roll.** `roller`,
  360. The kind toggle is shared by Core rules, the alternate tables and
  search (FEATURES "Rolling"). With consumables off, the results change and
  the page shows no cause.
  Fix: the closed control names each value that is not the default
  («Настроить · Core · Расходники») and is lit as «Фильтры · N» is. Owner:
  no.
- **M5-7 - result cards are about 400 px tall at 360.** `roller`, 360. Four
  results take about three screens, so a GM must scroll to compare the four
  and pick one. This is against Impeccable's density guidance for Operate
  surfaces and PRODUCT principle 1 ("readable at a glance").
  Fix (recommended): a compact result card at 360 (a 96 px art beside the
  text), with the full card face from 600 px. This changes the "card face
  on roll results" choice of direction R. Owner: yes.

### Mock 3 and the list-head siblings

- **M3-2 - «Выбрать» looks pressed at rest.** Mocks 3, 6, 8 and 9, all
  widths. The «Выбрать» / "Select" button carries the check icon. Batch 1
  made check plus label the neutral pressed state («RU ✓», «Список ✓»), so
  the button reads as "on" before a press. This is an affordance conflict
  (Impeccable: consistent affordances).
  Fix: use a select (checkbox-outline) icon, or no icon. Owner: no.
- **M3-3 - «Выбрать» is in a different place on each sibling page.** At 360,
  mock 3 draws «Выбрать» at the end of the search row, which is the owner's
  round 3 answer (unit A). Mocks 6, 8 and 9 put it in «Ещё» at 360 and say
  that this is "as the catalog". Mock 3's own `catalog-more` lead also says
  that «Ещё» holds the view switch and «Выбрать», but its render does not.
  Fix: redraw mocks 6, 8 and 9 to mock 3's render, and correct the
  `catalog-more` lead text. Owner: no (the owner already answered).
- **M3-4 - the search field is too narrow at 360.** `catalog`, 360, RU and
  EN. The field is about 110 px wide and the placeholder is cut («Поиск
  по»). Search is a player task, and player surfaces are phone-first.
  Fix: use the placeholder «Поиск» / "Search" on every list page (mock 6
  already does). Measure the field at 140 px or more beside «Фильтры · N»
  and «Выбрать». Owner: no.
- **M3-5 - there are three selection-bar patterns.** Mock 3 uses a floating
  bar near the bottom that covers a row (C12). Mock 9 `/s/` uses an inline
  bar under the head, which scrolls away from a tick 50 rows down. Mock 6
  uses a bar with an open move panel. In mock 9, «Сообщить владельцу» is
  the first control and a gold fill, but FEATURES "Purchase requests: the
  send" puts it last, on its own line at 600 px or less. With «Копия в мои
  списки», two gold fills show at once.
  Fix: use one sticky-bottom bar on every list page, and give the list a
  bottom padding equal to the bar height. Keep the FEATURES order, or name
  the change in FEATURES. Owner: no.
- **M3-6 - the selected row has a side stripe.** `catalog-selection`, 360,
  EN. The ticked row has a coloured left border wider than 1 px. Impeccable
  craft-floor bans this, the detector rule is `side-tab`, and mock 6
  dropped the stripe for this reason.
  Fix: use a lit ground and the check only, as in mocks 6 and 9. Owner: no.
- **M3-7 - the filter-active state is not consistent.**
  - `catalog`: the address `/tables/eq_weapon` carries no filter, but 360
    shows «Фильтры · 1» with no pill and 1180 shows «1» picked in the tier
    row.
  - `catalog-filtered`: «Фильтры · 2» is not lit at either width. The
    DESIGN.md toggle rule and mock 6 light the button once a filter holds a
    value.
  - Mock 6 drops the pills at 360 (the owner allowed this for `/homebrew`),
    while the catalog keeps them.

  Fix: draw `catalog` unfiltered. Light «Фильтры · N» while N > 0. Name the
  `/homebrew` difference in FEATURES "Tables and search". Owner: no.

### Mock 2 (shell)

- **M2-1 - «Справка» is still on `/lists`.** `header`, 360 and 1180, RU and
  EN. The `/lists` frame draws «Справка» / "Help" beside «Мои списки». The
  owner removed this panel (Q8.1, option A).
  Fix: remove the button from the `/lists` frame. Owner: no.
- **M2-2 - the pin has two labels and two placements.**
  - Mock 2 draws a visible «Открывать при запуске» / "Open on start"
    button under the H1 at 360 on the roll pages and on `/tables` (the
    toast frames).
  - Mock 3 puts the same pin in «Ещё» at 360.
  - Mock 6 calls it «Стартовый раздел» in «Ещё».
  - The background frames of mock 8 show «Стартовый раздел» / "Start
    section". Mock 2 says that R's «Стартовый раздел» was replaced.

  Fix: use mock 2's label pair everywhere. Use one placement rule: in «Ещё»
  at 360 on list pages and on roll pages (M5-2), and visible by the H1 at
  1180. Redraw mock 2's `/tables` frames. Owner: no.

### Mock 4 (record)

- **M4-1 - the «Ещё» menu leaves the screen at 360.** `item-more`, 360, RU.
  The menu opens past the left edge, so its labels are cut («текст»,
  «название», «картинку», «ссылку», «предметы»).
  Fix: at 360, open «Ещё» as a bottom sheet, as the add-to-list sheet does
  (mock 8). Elsewhere, align the menu to the button's right edge and keep it
  inside the viewport. Owner: no.
- **M4-2 - «Сохранить себе» is renamed and its consequence note is gone.**
  `item-more` and `h-item-signedout`, all widths.
  - Signed in, the action is «Копия в мои предметы» inside «Ещё». Signed
    out on `/h/`, it is a visible button, "Sign in and save a copy to "My
    items"". So one action has two labels.
  - Mock 9 renames «Сохранить себе» on `/s/` as «Копия в мои списки».
  - Rule 5 ties the toast «Предмет «%s» сохранён в «Мои предметы»» to the
    word of the button.
  - The note is dropped. Its relink form («...а строки ваших списков с этим
    предметом будут вести на неё») is what a press does at once (rule
    15d).
  - «мои предметы» in lower case breaks rule 4 (one name).

  Fix: use one label per action on every page and in every state, and keep
  «Мои предметы» capitalized. Keep the relink line as the menu item's second
  line when it applies. Update the FEATURES and toast wording in the same
  batch. Owner: yes for the removal of the note; no for the labels.
- **M4-3 - record states are missing.** Mock 4 draws no `/h/` loading state
  and no failed read («Предмет не загрузился» with a primary «Повторить»).
  It also draws no failed read of the author's items on `/i/<key>`, and no
  own-item pick row with «Изменить». The error page renames «Предмет не
  найден» as «Предмета по этому адресу нет» and does not name the spec
  change.
  Fix: add the three states, and name the new title in FEATURES "Records".
  Owner: no.

### Mock 6 (homebrew)

- **M6-1 - the damage inputs have no labels.** `editor`, 360. «Урон» holds a
  die select, a «+» and a number box, and neither input has a label of its
  own. Rule 15b names «Кость урона» and «Бонус к урону» under «Урон».
  Fix: add the two input labels. Owner: no.

### Mock 7 (print preview)

- **M7-1 - the print sheet cannot be read at 360.** `print-preview`, 360.
  The sheet is scaled to about 330 px (C30, left open by the mock). Print is
  a GM surface that must still work on a phone.
  Fix (recommended): on screen only, under 600 px, draw the cards one per
  row at the real card width with «Весь лист» to see the whole sheet. Print
  output does not change. Owner: no (screen only), but name it at the
  batch 7 mock.

### Mock 9 (list pages)

- **M9-1 - two owner answers are used past their scope.** `list`, 360. The
  owner moved «Печать» into «Выбрать» on `/s/` only. Mock 9 also moves
  «Печать» into «Ещё» on `/lists/<uuid>` at 360. It also moves the rename
  into «Ещё», while FEATURES rule 16 makes the name an `<input>` in the
  `h1`.
  Fix: ask the owner about «Печать» on `/lists/<uuid>`, or keep it on the
  action row. Name the rename change in FEATURES rules 15 and 16. Owner:
  yes (print).
- **M9-2 - the list notes and «Цены» move under the entries at 360.**
  `list`, `list-prices`, 360. At the 100-entry limit, both sit about
  19 000 px down, while `/s/` keeps «Заметка ▾» on the lead line.
  Fix: put «Заметка ▾» on the meta line, as on `/s/`, and put «Цены» in
  «Ещё» or on the meta line. Owner: no.
- **M9-3 - the requests state is not measured.** `list-requests`, 360. The
  requests panel pushes the first entry to about 1100 px. The first-screen
  table has no row for this state. The panel shows two gold «Принять»
  buttons, while DESIGN.md allows one primary per panel.
  Fix: add the state to the first-screen table and name its primary content
  (the panel head). Make «Принять» gold on the first request only. Owner:
  no.

## Nits

All are minor and all are `local` (they fall inside the mock folders and the
batch specs that own them).

### Mock 1b

- **M1b-2** - `print-sheets`, 1180, EN. Each drawn light well shows a dark
  band at its lower edge, from the capture's fade under it, so the render
  does not show the real result. This is moot if M1b-1 goes blank.
- **M1b-3** - `print-card`, EN. The black-and-white capture holds Russian
  text, so the EN evidence is not at parity.
- **M1b-4** - `editor-preview`, 360. The homebrew editor preview shows a
  catalog record (Premium Bedroll, "Core"). The card is left-aligned, with
  an empty right side.

### Mock 2

- **M2-3** - The index gives two values for the mode-row padding (6 px and
  8 px). The frames use internal ids that the app no longer writes
  (`/roll/voa`, `/roll/mwt`; ROUTES.md writes `/roll/vault_of_ages`,
  `/roll/many_worlds_tavern`). Mock 3's address uses `?tier=1&range=melee`
  instead of `/f_<filter>`. Correct the frames so that an implementer does
  not copy a wrong address.
- **M2-4** - The toast becomes a plate, and the error toast takes dark ink
  on the alarm fill. DESIGN.md "Toast" (gold pill, white error text) must
  change in batch 2. Record this as a planned change.

### Mock 3

- **M3-8** - The `catalog-more` lead text does not match the render (see
  M3-3).
- **M3-9** - A table switch at 360 now takes a picker sheet: three taps for
  a table in another group, against two today. State the extra step to the
  owner with the C7 trade-off.

### Mock 4

- **M4-4** - The item page, the dialog and the result cards crop the square
  art to about 3:2. DESIGN.md "Shapes" says "Artwork is square". The crop
  window is a design choice, so name it in DESIGN.md.

### Mock 5

- **M5-8** - «Бросок 1 - выберите один предмет» is an instruction in a
  heading (clarity rule), and `/roll/alt` says «Выберите одно». Use one
  heading pattern on all roll pages (M5-1).
- **M5-9** - «Настроить бросок» carries the filter funnel icon, but it opens
  the roll settings. Use a tune or settings icon.
- **M5-10** - `roller-mwt`. The source slot of the result card reads "Many
  Worlds Tavern". FEATURES "Rolling" says that a record's badge names its
  realm («Спорополис»).

### Mock 6

- **M6-2** - The head vocabulary differs from mock 3: the placeholder
  «Поиск» against «Поиск по названию...», «Фильтры» with a funnel icon
  against no icon, and «Ещё» with a chevron against none. Use one set.
- **M6-3** - In the preview sheet, the pressed segments (Экран / Печать,
  Цвет / Ч/б, 63x88 / 44x63) show no check. Batch 1's neutral pressed
  state is check plus label.

### Mocks 6, 8 and 9

- **X-3** - The unit B renders use the old shell. The language switch has
  no batch 1 check. The footer summary drops «- Источники и лицензия» and
  its caret, which is the DPCGL fold (FEATURES "Chrome"). The mocks name a
  re-render, but the owner reviews these renders now.

### Mock 7

- **M7-2** - `search-results`. «Найдено: 3» is new. FEATURES "Tables and
  search" says that nothing is said under the 300 cap. Name the change or
  drop it.
- **M7-3** - `account-settings`. «Скачать мои данные (ZIP)» carries the copy
  icon. Use the download icon.
- **M7-4** - `print-preview`, 360. «Назад» is a text link about 20 px tall,
  under the 24 px of WCAG 2.5.8. Give it a 44 px target, as the system does
  at 600 px.

### Mock 8

- **M8-1** - `lists-limit`. «50 из 50» sits inside the search box with no
  plural noun. Rule 1 asks for «50 списков из 50» at the head of the
  collection. «Показать ещё (38)» departs from the fold wording of rule 12
  («и ещё 38 списков» / «свернуть»).
- **M8-2** - `item-listmenu`. The add-to-list sheet closes with «Готово».
  Signed out it shows "Done" with nothing to finish. Rule 11 asks for
  «Закрыть» for a panel that keeps what it holds. «10 поз.» is an
  abbreviation that the clarity rule does not need: there is room for
  «10 позиций».
- **M8-3** - `lists-index`. The chip «1 изменение» does not say what
  changed. Use «Новое в списке» or link the chip to the panel.

### Mock 9

- **M9-4** - `shared-select`. The bar's «Готово» replaces FEATURES' «Снять
  выделение». Name the change or keep the spec label.
- **M9-5** - «Добавить свой предмет» replaces the rule 8 departure «Свой
  предмет». «Новое в списке: 2 запроса, 1 изменение» replaces «Новое в
  списке (N)». Name both in FEATURES "Lists".

## Deviations

Each mock page records its own differences from R and the plan. This review
accepts these:

- the neutral pressed state;
- the toast as a plate;
- the H1 picker on the catalog;
- the dropped side stripe in mock 6;
- the long list name cut to one line at 360 (owner);
- the lit «Фильтры · 1» on `/homebrew` (owner);
- the position field kept as the non-drag reorder (WCAG 2.5.7).

This review does not accept these:

- the rarity removal (M5-3);
- the folded manual entry (M5-1);
- «Выбрать» in «Ещё» on mocks 6, 8 and 9 (M3-3);
- «Печать» in «Ещё» on `/lists/<uuid>` (M9-1);
- the light print well (M1b-1).

## Standing checks

1. Scale: checked - `lists-limit` (50 of 50) and its card density,
   `list-requests` (two requests and a change notice), the homebrew
   first-screen table, the longest-name states of mocks 6 and 9, and the
   roll pages at 360. One past the limit and 3x were not drawn for `/lists`
   or `/lists/<uuid>` (100 entries). The open questions are M8-1, M9-2,
   M9-3 and M5-5.
2. Error scenarios: checked - the error and empty states drawn for each
   surface: `homebrew-error`, `editor-errors`, `editor-conflict`,
   `item-nope`, `print-nope`, the `lists-error` state (listed),
   `shared-gone` (listed) and `catalog-nothing`. Missing: the `/h/` failed
   read and the `/i/<key>` items failed read (M4-3). A mock carries no
   write path, so data loss does not apply.
3. Consistency: checked - the list head (search, «Фильтры», «Выбрать»,
   «Ещё», the view switch), the pin, the help labels, the selection bar, the
   filter-active state, the toasts, the empty and error patterns, and rules
   1, 4, 5, 8, 11, 12, 15, 16 and 17 across mocks 2-9. Findings: M2-1, M2-2,
   M3-2 to M3-7, M4-2, M6-2, M8-1, M8-2, M9-4, M9-5 and X-3.
4. RU/EN parity: checked - the RU and EN renders of each sampled state, the
   new-label tables of mocks 3, 5 and 7, and American spelling ("armor",
   "color", "license" are correct). Gaps: the EN black-and-white capture in
   1b (M1b-3), and the EN "Start section" against "Open on start" (M2-2).

Owner rules:

- checked - First-screen rule: fails on `/roll/alt` and
  `/roll/many_worlds_tavern` at 360 (M5-5); `list-requests` is not measured
  (M9-3).
- checked - Phone-first, devices during play: M3-4, M5-1, M5-7, M7-1.
- checked - Mock answers: the C1 and C38 renames hold, but the C38 panel is
  missing at 360 (M5-2); Q8.1 is broken by mock 2 (M2-1).
- checked - Mock round 3 answers: unit A's «Выбрать» rule is broken by
  mocks 6, 8 and 9 (M3-3); unit B's «Печать» on `/s/` is extended to
  `/lists/<uuid>` (M9-1).
- checked - Print answers: the Figma check is now answered against the
  mock (M1b-1).
- checked - The linear ground is on every mock read.
- checked - The gold budget holds, except two gold fills in the `/s/`
  selection (M3-5) and in the requests panel (M9-3).

## Suggested next action

1. Show M1b-1, M5-3, M5-7, M4-2 (the note) and M9-1 to the owner as
   questions, with the recommendations above.
2. Send the remaining blockers and majors to the mock writers. Unit A takes
   mocks 2, 3, 4, 5 and 7. Unit B takes mocks 6, 8 and 9.
3. Re-render. Re-measure the first screen for all nine roll modes and for
   `list-requests`.
4. Approve the mocks after these steps. Do not approve 1b or 5 before the
   owner answers.

## Checks still needed

- Read `roller-alt-crit` at 1180, and the VoA and community roll pages at
  360 and 1180. Each needs a first-screen measure.
- Read the renders this review did not open (most 1180 states of mocks 6, 8
  and 9, `list-share`, `list-roll`, `shared-filters`, `editor-crop`,
  `homebrew-import`).
- Run `impeccable detect` on each mock folder in a session that can write
  outside the report.
- Check the sticky state of the selection bars in the live mock pages
  (`state.html`); a static PNG cannot show it.
