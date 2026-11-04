# Batch 6 - Homebrew editor, homebrew pages and imports (implement-ready)

This brief is the implementer's whole input for batch 6, with the mock `mocks/6/`
(`index.html`, the PNGs, `states.js`, `u.css`), `plan-4.md` and `plan-5.md`. It has the
shape of `plan-5.md` and `plan.md` section 10. The owner is AFK (`context.md`, "Owner AFK
from 2026-11-03"), so every choice below is the recommended option; the orchestrator logs
each one in the owner-AFK decisions file. A mock is direction, not the source of truth
(owner, 2026-11-03): the departures are named in "Decisions", and none of them reopens a
decision of the owner. Section numbers ("section 7") are those of `plan.md`.

Batch 6 runs after batch 5's `polish`, `harden`, review and CI, in wave 2.

## Objective

`/homebrew` and its four tabs draw the list head of batch 3: up to 760 px a read-only `h1`,
a tab picker with the primary «Новый ...» and «Ещё» (import, pin); from 761 px the head
with the labeled pin, the four tabs with their counts and the primary. The Items tab draws
the search, «Фильтры · N» (`FilterPanel`: a column from 1000 px, a sheet below) and
«Выбрать»; the rows tick only in the selection mode, and the one selection bar (batch 3)
carries the page's actions («В список», «Печать», the copy, the move, the JSON download and
the delete). The help panel is gone. A source row has two controls. The import panel reads
as one decision. The editor draws its fields in three groups with optional fields marked,
no «?» on a field, field-specific errors, a sticky save bar with a preview sheet up to 760
px, and a conflict state whose primary does not overwrite the other device. The editor's
preview follows «Вид» at once (the owner-reported bug, step S2).

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a
  rebase).
- Batches 4 and 5 are on the branch by now. Read `git log --oneline -10`, then `git diff
  38767ca4 HEAD -- app/src/components/MoreMenu.svelte app/src/components/PinItem.svelte
  app/src/components/Menu.svelte app/src/components/Sheet.svelte
  app/src/components/AddToList.svelte app/src/components/SelBar.svelte
  app/src/components/SelectionBar.svelte app/src/components/FilterPanel.svelte
  app/src/components/RowMain.svelte app/src/components/TableRows.svelte`. This brief names
  the shapes of `plan-4.md` and `plan-5.md`: `MoreMenu` (props `app`, `id`, `up?`, `label?`,
  `size?`, `children(close)`), `PinItem` (props `app`, `home?`, `onpicked`), `Menu` `up`,
  `Button` `haspopup`, `AddToList` `toList`, `DialogClose`, `Sheet`. A line that no longer
  matches is the implementer's to adapt, and `handoff.md` names the change.
- The mock is `mocks/6/`. It was re-checked against the shipped code: the departures are named
  in "Decisions" (H1, H4, H7, H8, H11 to H14, H18 to H20, H22, H23). The mock is not redrawn
  and not shown to the owner again.
- Impeccable cannot run from a subagent. The orchestrator runs `polish` and `harden` after
  S12 on `HomebrewPage`, `HomebrewTabs`, `HomebrewBulk`, `HomebrewEditor` and the crop
  dialog, from the built app at 360 and 1180 px; fallback
  `impeccable:impeccable-finish-reviewer`.
- Steps are S1 to S16. The line "Session end partial progress" in `handoff.md` names the
  last finished step.
- S2 comes first on purpose: reproduce the preview bug on the unchanged tree before any
  other edit.

## Decisions of this refresh (planner defaults; the owner is away)

| # | Decision | Reason and trade-off |
|---|---|---|
| H1 | The head is the catalog's. Up to 760 px: `<h1 class="vh">`, the lead as `<p class="vh">`, one row: `HomebrewTabs` picker, the tab's primary (`size="sm"`, no plus icon), `MoreMenu` («Ещё»: «Импорт из файла», `PinItem`). From 761 px: `PageHead` with `help={null}`, `home={HOMEBREW_HASH}`, `sub={t.subHomebrew}` and an `extra` snippet holding the tab links and the primary (with the plus icon). Departure from the mock: the lead line stays from 761 px (the mock draws none). | The same call as batch 5's L10: removing visible text on a laptop is not mine to decide. The lead costs about 40 px at 1180 (first group head about 230 of 288). The mock's no-plus-at-360 stands (N6-1). |
| H2 | New `HomebrewTabs.svelte`: from 761 px a `nav` of four `a.tab` links with counts, `aria-current="page"`; up to 760 px a picker button (accessible name «Мои предметы: Предметы», `aria-haspopup="dialog"`) that opens a `Sheet` with the four tabs, their counts and the item counter. Its CSS copies `TableNav`'s `.tab` and `.picker` rules. | Extract-on-second-use would fold it into `TableNav`, whose markup mixes group chips and the source fold; the move would shift `_tables_*` goldens. About 35 lines of CSS are copied and named in `handoff.md` Deferred for batch 10. |
| H3 | The tab counts are: items `store.items.length`, sources `store.books.length`, sets and rules the cards of that kind. The limit counter «9 предметов из 100» (rule 1) sits in the search row from 761 px, in the picker sheet up to 760 px, and under the search row only while narrowed (batch 3's count line, `shownOf`) or at the limit (red, `--danger-text`). | Mock N6-2: the first screen at 360 has no room for a count line. Rule 1 says the counter sits at the head of its collection; the search row is that head from 761 px. |
| H4 | The Items tab uses `SearchBox`, `FilterPanel` (no `oncopylink`: the Items filter hands out no link, rule 17 of `FEATURES.md`), «Фильтры · N» (variant `toggle` while a value is in force) and «Выбрать» last in the row. The search and the filter draw from the eighth item or a value in force, latched until the tab is left (as today). «Выбрать» and the import button draw whenever the tab is ready and has an item (import: always from 761 px). | `FilterBar` and its pills go from this page (`FilterBar` keeps its last caller, `SharedListPage`, until 9a). The mock's «Ссылка на фильтры» is not built: the spec wins (owner, 2026-10-28). |
| H5 | The selection is batch 3's: `app.selecting`, `app.setSelectable(drawnIds)`, rows with `ticks={app.selecting}`, and the one bar `SelBar` -> `SelectionBar`. `BatchBar`, the strip, the move panel and the delete line leave `HomebrewPage`. The page's actions are the new `HomebrewBulk.svelte`, which `SelBar` mounts in its `actions` when `app.route.kind === 'homebrew' && app.route.tab === 'items'`. | Today a ticked row shows two bars (the frame's and the strip). One bar is the owner's round 6 answer. `SelBar` already knows the route (`app.shared`). `BatchBar` keeps `ListsPage` and `ListPage`. |
| H6 | `HomebrewBulk` from 761 px: «Переместить (N)» (toggle, caret), «Скачать JSON (N)», «Удалить (N)» (danger) as buttons after `SelBar`'s «Скопировать текст». Up to 760 px: `SelBar` leaves its copy button out and `HomebrewBulk` draws one `MoreMenu up` («Ещё») with the copy, «Переместить (N)...», «Скачать JSON (N)», a separator and «Удалить (N)» (danger). | Mock B6-1. The bar keeps «В список» and «Печать» beside «Ещё», about 129 px of 640. |
| H7 | The move form is a `Sheet` at every width (source, section, the one-line consequence, «Отмена», «Переместить N предмета»). Departure from the mock's popover at 1180. | `Sheet` exists and is axe-covered; a popover over a sticky blurred bar is new geometry with its own clipping risk. Trade-off: a bottom sheet on a laptop. |
| H8 | The delete's progress line under the strip goes. While a delete runs the whole `HomebrewBulk` is disabled, the status region says «Удаляем предметы (N)...» once, the focus waits on «Все» as today, and the toast ends it. | The bar has no free row; `SelectionBar`'s `below` is the caller's, not the bulk's. The spec text changes in S13. |
| H9 | Rows are `TableRows` `view="list"` with `ticks={app.selecting}`, `hide={hiddenTags('homebrew', inForce, false)}` and no `primary`. `data-primary` sits on one wrapper `div.hbrows` around the group heads and rows, as `TablesPage`'s `.rowscol` does. Group heads (`h2.hbgroup`) stay at every width; under a source filter they drop the source name (mock). | Owner, round 3 unit B: the first group head is the marker. `TableRows` with `primary` would mark the first row (255 at 360, past the 240 target). |
| H10 | Empty states use batch 3's `Empty title glyph`: Items «Своих предметов пока нет» + «Свой предмет ищется вместе с книгами, виден в «Таблицах» и попадает в списки.»; Sets «Комплектов пока нет» + «Комплект - предметы с общим бонусом: бонус виден на карточке каждого из них.»; Rules «Карт правил пока нет» + «Карта правил - правило, на которое ссылается предмет: заклинание, черта, противник.» No button inside (the head holds the primary). A failed read keeps `LoadState` under the page heading (batch 4's `hbLoadFailedTitle` serves the record page, not this one). | Owner, Q6.1: each fact sits where it applies. The old line «...создайте первый выше или импортируйте файл» goes: the primary and «Ещё» are in view. |
| H11 | Sources: a named source's row holds «Разделы» (caret) and «Ещё» (`MoreMenu`: «Переименовать», «Скачать JSON», a separator, «Удалить»). The default source row holds «Скачать JSON» only. Section rows keep «Переименовать» and «Удалить». The worded limits stay as shipped («2 источника из 20», «N предметов · M разделов из 30»); the mock's re-ordered «разделов: 2 из 30» is not built. | A29 asked for fewer controls; the ratios are already words. Rule 20: «Переименовать» opens the `NameField`, and its «Отмена» and the delete return the focus to the row's «Ещё» (or the source's name when the row is gone). |
| H12 | Sets and Rules rows stay folds, closed by default, with «Изменить» and «Удалить» in the head; no bonus or text preview on the closed row. The two cards' `CardForm` keeps its two «?» (source, markup). Departure from the mock's open rows. | The spec says a card is a closed fold (`FEATURES.md`, "Cards"). The mock's row preview is new content, and the empty states already carry the definitions. The CardForm «?» are not among the owner's eight (Q6.2): see "Owner questions". |
| H13 | The import panel keeps its logic and its states. The panel opens under the head at every width (not above the tab row). Its order: the file chooser with «Формат файла» (schema) and `llms.txt` links on its row; one line «Подходит файл из «Скачать JSON», архив из «Скачать мои данные» или файл по описанию в llms.txt.»; one summary; «Куда положить предметы» rows; the segment labeled «Если уже есть:» with its consequence line; «Импортировать (N)» and «Отмена». D16: EN reads "If you already have it:". | A13: nine text blocks around one decision, the links inside the flow, a sentence as a segment label. The held-name lines and the notes stay (they are facts of the file). |
| H14 | The editor's head is a breadcrumb row: the link `t.myItems` (chevron, `href` `#/homebrew`, under the dirty-form guard) and the item name as `h1` (one line, cut with an ellipsis, up to 760 px; up to three lines from 761 px), with the path line under it as today. `PageTitle` leaves the ready state. The «К моим предметам» button leaves the button row; the missing and gone states keep it. | Mock, plan section 14 ("the back link joins the H1 row"). The breadcrumb is the way back at every width and never reads «Отмена». |
| H15 | The form draws three headed groups: «Предмет» (Вид, Тип снаряжения, Язык текста, Название, Описание, Картинка, and for an item or a consumable «Ранг»), «Характеристики» (equipment only: Ранг, Класс, Характеристика, Дистанция, Урон, Тип урона, Хват, Второй набор / Показатель брони, Пороги урона) and «Где лежит» (Источник, Раздел), then the fold «Связи». From 1000 px short Seg fields pair in two columns (`@media (min-width: 1000px)`). | The identity first, the placement last (mock). The group heads are `h2`. 1000 px is the system's step. No new breakpoint. |
| H16 | Optional fields are marked, required ones are not. `FormField` gains `optional?: boolean` (a muted «необязательно» / "optional" after the caption) and stops drawing the `*`; `required` stays an ARIA and `required` attribute matter of the control. The legend `hbLegend` goes. The editor marks Описание, Картинка, Ранг (item or consumable), Раздел, and each optional relation. `CardForm` marks Подзаголовок and Ссылка and drops the word «Необязательно.» from its two hints. `QuickItem` (list page) gets one `optional` on its description field and loses its star with the others. | A8 and the Forms rule (section 4): one rule for every `FormField`, so no form mixes stars and marks. `QuickItem` is touched for that one line only; batch 9b still owns its «?». |
| H17 | Field messages (A7): `problemText` returns a message of its own for class, trait, range, damage type and burden (keys in S1) in place of «Выберите значение.»; the kind and the type always hold a value. The summary keeps «<Поле> - <message>». D15: the damage message is two lines at 360 in EN, and the editor's «Тип урона» options read «Физический / Магический / Оба» ("Physical / Magic / Both") from three new keys; the stat line keeps the shared `EQ_DT` abbreviations (Deferred). | A7 (7 repeats of one generic line), D15. `EQ_DT` serves the catalog rows and print: not this batch's. |
| H18 | The eight «?» of the editor go (Q6.2): Источник, Описание, Второй набор характеристик, Линия улучшений, Улучшается до, Получается из, Комплект, Карты правил. Three captions replace the three that name a site rule: under Источник «Без источника предмет лежит в «Хоумбрю».»; under «Линия улучшений» «Одно снаряжение на рангах 1-4: карточка рисует лесенку рангов.»; under «Комплект», when a set is chosen, «Бонус комплекта: <text>». The refs label reads «Карты правил, до 3» (`hbRefsUpTo`) and `hbRefsHint` goes. The «Второй набор характеристик» disclosure keeps its plus icon and has no hint (`hbErrAlt` names the fix). | Owner yes, 2026-10-29. Rule 15 (c) and rule 18 change in S13. A caption states a fact of the site (rule 15 (d)); help text would be a defect by the Clarity Rule. |
| H19 | Up to 760 px the editor's button row is a sticky bar at the bottom of the form (`position: sticky; bottom: 0`, the `Sheet`'s ground and top border, safe-area padding): «Сохранить» (the one gold), «Предпросмотр», and `MoreMenu up` («Ещё») holding «Удалить» on a stored item (no «Ещё» on a new one). «Предпросмотр» opens a `Sheet` that holds the screen / print switch, `PrintSwitches` and the card. From 761 px the row is «Сохранить» and, on a stored item, «Удалить» (danger), as today less «К моим предметам»; 761-799 px keeps the card under the form, from 800 px the column beside it (unchanged). From a window shorter than 481 px the bar is not sticky. | Mock A6 "a preview button at the bottom". A danger button in a sticky bar invites a mis-tap and does not fit with two others at 360 (RU needs about 356 of 328 px). A menu with one item is accepted for that reason. |
| H20 | Conflict (A30): in the banner the primary is «Показать новую версию» and «Сохранить мою версию» is `variant="danger"`; the main «Сохранить» is disabled while the banner shows. The gone banner is unchanged. | Mock `editor-conflict`; plan section 7 line. The labels stay as shipped (the mock's «Заменить её моей» is not built: new copy, no gain). |
| H21 | The editor's `Seg`s take `neutral` (a check on the pressed option, no gold): the `choice` snippet, Ранг, «Язык текста», the view switch, the import's «Если уже есть:». Gold stays on «Сохранить» only. | DESIGN.md "Segmented control" rewrite (section 4, batch 6). |
| H22 | The crop dialog (A9, verify): the zoom range gets a 24 px thumb (WebKit and Moz rules), real `−` and `+` buttons (44 px high, named «Меньше» / «Больше»: new keys) in place of the two `aria-hidden` signs, the hint `hbArtCropHint` becomes visually hidden (still `aria-describedby`), the frame draws the thirds on both axes, and a tap on the stage without a drag (under 4 px of movement) centers the frame on the point (the single-pointer alternative of WCAG 2.5.7). The mock's corner handles are not built. | A handle that does not resize is a false affordance. The tap is small and unit-testable. If the pointer code resists, the implementer drops the tap, logs it in `handoff.md` Deferred and names the 2.5.7 gap for the post-release audit. |
| H23 | D5: `RowMain` draws a small language tag («EN» / «RU», `lang` set) after the name of an own item whose two names are equal and written in the other language than the interface (`oneLangOf(it.ru, it.en)`, on the name). D14 is by design (`FEATURES.md`, "Language": the card draws the shown language) and closes with no change. | One helper call and one tag. The tag can move a `_tables_homebrew*` or `_search_*` golden that draws such a row: read each, do not re-seed blind. |
| H24 | The preview bug fix (S2): `previewOf` keeps deleting `eq` (no stat block until a tier is chosen) and sets a new optional `eqType` on the record; `cardBadges`, `RecordCard`'s glyph and the editor's `ArtField` glyph read `it.eq?.t ?? it.eqType`. | Smallest change that keeps "a tier is never shown that the author did not choose". `eqParts` and `PrintCard` read `eq.tier` and must not see a tierless `eq`. |
| H25 | A decision file records H1 to H7, H9, H15 to H21 (S13). | They outlive the task. |

## Owner questions (default taken; none blocks)

- Q6-1. The `CardForm` «?» on «Источник» and on the markup box of a set bonus or a rule card
  text are not among the eight the owner removed (Q6.2). Removing them is a visible-feature
  loss with no owner yes, so they stay (H12). Recommended later: ask the owner whether the
  card forms follow the editor; the change is two `help` props and their strings. Until then
  the editor's «Описание» box has no markup hint while the card forms keep theirs; rule 18
  names it as a departure.

## Placed items (the orchestrator folds these into `plan.md`; this brief cannot edit it)

- Section 8, row "4-8, 9a, 9b": replace "1" for batch 6 with 38-49 minutes of extra gates
  (see "Gate cost").
- Section 14: the three homebrew rows (`#/homebrew as gm3`, `#/homebrew/sets ~ long name as
  gm4`, `#/homebrew/new as gm1`) become `shipped: true`; a fourth row, the editor with a
  long name (`#/homebrew/hb_longsrcaaaaaaaaa as gm4`, or a new entry if that item's name is
  short), is added as `shipped: true` (the longest-name row of section 14 for
  `/homebrew/<id>`). No row is added for `/homebrew/sources`.
- Batch 9b, acceptance, one line: "`FormField`'s `help` prop and its `HelpButton` import go with the
  last «?» (`QuickItem`'s, and the card forms' too if Q6-1 is answered yes)."
- Batch 8 and batch 9a: `BatchBar` leaves `HomebrewPage` here; its callers are `ListsPage`
  (8) and `ListPage` (9a), as `plan.md` already says. `FilterBar` loses its `HomebrewPage`
  caller here; `SharedListPage` is the last (9a).
- Batch 10: the copied tab and picker CSS of `HomebrewTabs` and `TableNav` (H2); `EQ_DT`'s
  abbreviations in the stat line (D15, shared); `KeepNote` is untouched.
- Plan review: not required for batch 6 (see the end of this file).

## In scope

- The outline of section 7, "Batch 6", every line, with the superseding noted in
  "Acceptance criteria".
- New: `HomebrewTabs.svelte`, `HomebrewBulk.svelte`.
- Changed: `HomebrewPage`, `HomebrewSources`, `HomebrewCards` (empty states, count), `HomebrewImport`,
  `HomebrewEditor`, `HomebrewRelations`, `CardForm` (optional marks), `FormField`
  (`optional`), `CropDialog`, `SelBar` (the hook), `RowMain` (D5), `RecordCard` and
  `lib/label.ts` (`eqType`), `lib/homebrew.ts`, `lib/homebrewForm.ts`, `lib/help.ts`
  (the homebrew help goes), `lib/dict.ts`.
- The browser suites, the goldens and the prose that name a moved control.

## Out of scope

- `ListPage`, `ListsPage`, `SharedListPage`, `QuickItem` (one `optional` line only), `BatchBar`, `FilterBar`
  (still read by `SharedListPage`), `PageHead`, `TableNav`, `Sheet`, `FilterPanel`, `Menu`.
- `#/tables/homebrew` (the catalog's own-items table): batch 3's. The D5 tag may reach it
  through `RowMain`; nothing else changes there.
- The print card and `PrintPreview` (a tierless equipment in the print view keeps drawing
  no type; the owner's bug is the screen card), `EQ_DT` and the stat line.
- The `homebrew-v2` file, the store, the cloud port, `routes.json`, `llms.txt`.
- The lead line (H1), the «?» of the card forms (Q6-1), the mock's open card rows (H12), a
  source row's bonus or text preview.

## Facts read from the code (38767ca4, 2026-11-04; batch 4 files are in flux)

1. `HomebrewPage` draws `PageHead` (title, lead, pin, `helpFor('homebrew')`), the import toggle
   above the tab row, `ChipRow` tabs, then per tab. The Items tab draws «Новый предмет»,
   `SearchBox` and `FilterBar` (from `LIST_SEARCH_AT` = 8 or a value in force), `p.note`
   (the counter), `BatchBar` with the move, JSON and delete actions, then `h2.hbgroup` and
   `TableRows` with `primary` and always-on ticks (A40).
2. `SelBar` mounts while `n` is ticked or `app.selecting`, and it also draws on `/homebrew`:
   the page shows two bars. `app.selectable` is set by `TablesPage`, `SearchPage` and
   `SharedListPage`, not by `HomebrewPage`.
3. `previewOf` (`lib/homebrewForm.ts` 444-453) runs `if (draft.eqTier === '') delete c.eq;`.
   The record then has `kind: 'equip'` and no `eq`. `cardBadges` (`lib/label.ts` 81-96) takes
   the type badge from `it.eq` and else `badgeKind` (`consumable` or item); `kindGlyph` takes
   the type from `it.eq?.t`. So «Вид» = «Снаряжение» draws the item badge and glyph until a
   tier is chosen, and a consumable draws at once: the owner's report (2026-10-30). The
   existing test `previewOf draws no stat block until the author chose a tier` holds
   `eq === undefined`.
4. `HomebrewEditor` draws `PageTitle`, one `Panel` form with the legend `hbLegend`, `choice`
   Segs (gold pressed), five `FormField help` «?» (`hbSourceHelp`, mark box, `HelpButton` for
   the second set, relation fields) and `HomebrewRelations` with five more (`hbLineHelp`,
   `hbCraftIntoHelp`, `hbCraftFromHelp`, `hbSetHelp`, `hbRefsHelp`). The button row is
   `Сохранить`, `К моим предметам`, `Удалить`; the preview is a column from 800 px and the
   card under the form below. The conflict banner's primary is «Сохранить мою версию».
5. `FormField` draws `*` for `required` and the «?» for `help`; it serves the editor,
   `CardForm`, `QuickItem` and `ArtField`.
6. `HomebrewSources` rows hold «Разделы», «Переименовать», «Скачать JSON», «Удалить» (A29).
   `HomebrewCards` rows hold «Изменить» and «Удалить».
7. `HomebrewImport` is a lazy chunk (counted by `bundle-budget.mjs`, which sums every `.js`
   and `.css` but `data.js`).
8. `tests/app/states.js` reads the homebrew markup in cases 63, 64, 67, 68, 70-72, 79, 80 and
   82 and `FIRST_SCREEN` rows at lines 5187-5189 (`shipped: false`). `inventory.js` has the
   `#/homebrew` states at 2717-3364 and 3650-3721, among them `~ help open` (2847),
   `~ filters`, `~ filters open`, `~ move`, and the editor `~ description help`.
9. About 70 `_homebrew_*` goldens (`git ls-files tests/app/snapshots`) and the `_i_hb_*`,
   `_h_*` ones that draw the editor's preview card.
10. `help.ts` `HOMEBREW` (lines 735-820) is the only help read by `HomebrewPage`; `help.test.ts`
    reads `helpFor('homebrew')` at lines 134-135 and 256.

## Files expected

| Step | Files |
|---|---|
| S1 | `app/src/lib/dict.ts`, `lib/help.ts`, `lib/i18n.test.ts`, `lib/help.test.ts` |
| S2 | `lib/homebrewForm.ts`, `lib/homebrew.ts` (type), `lib/types.ts` (`eqType`), `lib/label.ts`, `RecordCard.svelte`, `HomebrewEditor.svelte` (glyph), `homebrewForm.test.ts`, `homebrewEditor.test.ts`, `record.test.ts` |
| S3 | `FormField.svelte`, `CardForm.svelte`, `formField.test.ts` (new if none) |
| S4 | new `HomebrewTabs.svelte`, `homebrewTabs.test.ts`; `HomebrewPage.svelte` (head, tabs, import row) |
| S5 | `HomebrewPage.svelte` (Items tab: search, filter, rows, selection, empty, counter), `RowMain.svelte` (D5) |
| S6 | new `HomebrewBulk.svelte`, `homebrewBulk.test.ts`; `SelBar.svelte` |
| S7 | `HomebrewSources.svelte`, `HomebrewCards.svelte` |
| S8 | `HomebrewImport.svelte` |
| S9 | `HomebrewEditor.svelte`, `HomebrewRelations.svelte`, `lib/homebrewForm.ts` (`problemText`), `ArtField.svelte` (marks) |
| S10 | `CropDialog.svelte`, `cropDialog.test.ts` (new or the existing file that mounts it) |
| S11 | `a11y.test.ts` (`COVERED`), the component tests that name a moved control |
| S12 | `tests/app/states.js` (cases 91, 92 and the adapted ones, `FIRST_SCREEN`), `inventory.js`, `driver.js` if a helper is needed, `typo.js` and `hues.js` if a read breaks, about 90 goldens |
| S13 | `FEATURES.md`, `COVERAGE.md`, `STATE.md` (check), `DESIGN.md`, new decision file, `docs/DECISIONS.md`, `tools/bundle-budget.mjs`, `.claude/README.md` |
| S14 | `handoff.md` (the Impeccable outcome) |
| S15 | none (gates) |
| S16 | `issues/57/mocks/6/built/`, `handoff.md` |

## Steps

### S1. Strings, help and the helper keys

In both languages of `dict.ts`, same keys, ASCII punctuation, «ёлочки» in RU only:

| Key | RU | EN |
|---|---|---|
| `hbOptional` | необязательно | optional |
| `hbGroupItem` | Предмет | Item |
| `hbGroupStats` | Характеристики | Stats |
| `hbGroupWhere` | Где лежит | Where it goes |
| `hbPreview` | Предпросмотр | Preview |
| `hbTabPick` | Мои предметы: %s | My items: %s |
| `hbSourceCap` | Без источника предмет лежит в «Хоумбрю». | With no source the item goes to Homebrew. |
| `hbLineCap` | Одно снаряжение на рангах 1-4: карточка рисует лесенку рангов. | One piece of equipment at tiers 1-4: the card draws a ladder of tiers. |
| `hbSetBonusOf` | Бонус комплекта: %s | Set bonus: %s |
| `hbRefsUpTo` | Карты правил, до 3 | Rule cards, up to 3 |
| `hbErrCls` | Выберите класс: физическое или магическое. | Choose a class: physical or magic. |
| `hbErrTr` | Выберите характеристику. | Choose a trait. |
| `hbErrRg` | Выберите дистанцию. | Choose a range. |
| `hbErrDt` | Выберите тип урона. | Choose a damage type. |
| `hbErrBu` | Выберите хват. | Choose a grip. |
| `hbDtPhy` | Физический | Physical |
| `hbDtMag` | Магический | Magic |
| `hbDtAny` | Оба | Both |
| `hbEmptyTitle` | Своих предметов пока нет | No items of your own yet |
| `hbNoSetsSub` | Комплект - предметы с общим бонусом: бонус виден на карточке каждого из них. | A set is items with a shared bonus: the bonus shows on the card of each of them. |
| `hbNoRefsSub` | Карта правил - правило, на которое ссылается предмет: заклинание, черта, противник. | A rule card is a rule an item points to: a spell, a feature, an adversary. |
| `hbImportFits` | Подходит файл из «Скачать JSON», архив из «Скачать мои данные» или файл по описанию в llms.txt. | Takes a file from "Download JSON", the archive from "Download my data", or a file written to llms.txt. |
| `hbImportFormat` | Формат файла | File format |
| `cropLess` | Меньше | Zoom out |
| `cropMore` | Больше | Zoom in |

- Change: `hbEmpty` (RU «Свой предмет ищется вместе с книгами, виден в «Таблицах» и попадает в
  списки.» / EN "Your own item is found with the books, shows in Tables and goes into lists."),
  `hbNoSets` and `hbNoRefs` (drop the final period: they are titles), `hbImportHeldLabel`
  (RU «Если уже есть:» / EN "If you already have it:", D16), `hbErrDmg` (RU «Выберите кость
  d4-d20; бонус - число от 1 до 99.» / EN "Choose a die (d4-d20); a bonus is 1-99."),
  `hbCardSubHint` and `hbCardUrlHint` (drop the leading «Необязательно.» / "Optional." and
  keep the rest as it is). `hbToMyItems` stays (the missing and gone states use it).
- Delete in both languages: `hbLegend`, `hbSourceHelp`, `hbAltHint`, `hbLineHelp`,
  `hbCraftIntoHelp`, `hbCraftFromHelp`, `hbSetHelp`, `hbRefsHelp`, `hbRefsHint`,
  `hbImportHintBefore`, `hbImportSchema`, `hbImportHintAfter`. Run `git grep -n -E "<key>"`
  for each first; keep a key another file still reads. `mdHelp`, `fieldHelp`, `importHintMid`
  and `importLlms` stay (card forms, `QuickItem`, the lists import).
- `help.ts`: delete `HOMEBREW`, its `homebrew` entry and the type member; update `help.test.ts`
  (lines 134-135 and 256: the section list loses `'homebrew'`). `helpFor` has no caller for
  `'homebrew'` after S4.
- `i18n.test.ts` holds key parity.

### S2. The preview bug (reproduce, test, fix)

1. On the unchanged tree add the failing component test in `homebrewEditor.test.ts`: a new item
   (`#/homebrew/new as gm1`), press «Снаряжение», then assert on the preview card: the badge
   text «Оружие» (`eq-weapon`), the `kindWeapon` glyph, no stat chips, no tier line. Press
   «Броня»: the badge «Броня» and `kindArmor`. Press «Расходник»: the consumable badge (the
   case that works today). Run it: the equipment assertions must fail on the badge «Предмет».
   Name the failing assertions in `handoff.md` (the reproduction).
2. Fix (H24): in `lib/types.ts` add to `Record_` `eqType?: EquipKind` with the comment "The
   type of an editor draft that has no tier yet; only `previewOf` sets it." In `previewOf`,
   when `draft.eqTier === ''` and `draft.kind === 'equip'`, `delete c.eq` as today and set
   `rec.eqType = draft.t` on the returned record. `cardBadges` reads `const t = it.eq?.t ??
   it.eqType`: with `t` set it draws the type badge, and draws the «Уникальное» badge only
   when `it.eq` exists and has no `line`. `RecordCard` (the `ArtWell` glyph) and
   `HomebrewEditor` (`ArtField` `glyph`) call `kindGlyph(kind, it.eq?.t ?? it.eqType)`.
3. `homebrewForm.test.ts`: `previewOf` with `eqTier: ''` has `eq === undefined` and `eqType ===
   draft.t`; with a tier chosen it has `eq` and no `eqType`. `record.test.ts`: a record with
   `eqType` and no `eq` draws the type badge and glyph, and no stat chips.
4. Assert the other equipment fields (type, class) change nothing else: the stat block stays
   absent until the tier press.

### S3. `FormField`

- Add `optional?: boolean`. The caption draws `<span class="opt">{dict(lang).hbOptional}</span>`
  after the label text when set (muted `--muted2`, `--t-label`, weight 400, no uppercase). It
  needs the language: `FormField` has no `lang`; draw the word through a new prop `optionalText?:
  string`, passed by callers from `t.hbOptional`.
- Remove the `*` and the `.req` rule. `FormField`'s `required` prop goes with them (it drew
  only the star): delete it from `FormField` and from every caller's `FormField` tag
  (`git grep -n -B2 -A6 "<FormField" -- app/src/components`); the controls inside keep their own
  `required` attribute and `aria-required`.
- `CardForm`: pass `optional` and `optionalText` on Подзаголовок and Ссылка; leave the required
  fields bare. `QuickItem`: pass them on its description field.
- `ArtField`: its `FormField` gets `optional`.

### S4. The head, the tabs and the import row

`HomebrewTabs.svelte`: props `app`, `tab: HomebrewTab`, `counts: Record<HomebrewTab, number>`,
`limitText: string` (the counter). `app.band === 'narrow'` draws the picker button
(`aria-label` `t.hbTabPick.replace('%s', current label)`, `aria-haspopup="dialog"`, the label
and a chevron, two-line clamp as `TableNav`'s `.picker`) and, when pressed, `Sheet` (`label`
the same, `title` `t.myItems`) with the four links (`a.tab`, count `span.n`, `aria-current`) and
the counter as a `p`. Any other band draws `nav[aria-label=t.myItems]` with the four links. A
link press in the sheet closes it. Rule 20: closing the sheet focuses the picker.

`HomebrewPage` (head part; the body is S5 to S8):

```svelte
{#if narrow}
  <h1 class="vh">{t.myItems}</h1><p class="vh">{t.subHomebrew}</p>
  <div class="pickrow">
    <HomebrewTabs {app} {tab} {counts} {limitText} />
    {#if tab === 'items'}{@render primary(false)}{/if}
    <MoreMenu {app} id="hb-more" size="sm">{#snippet children(close)}
      <button role="menuitem" tabindex="-1" onclick={() => { close(); toggleImport(); }}>
        <Icon name="upload" />{t.importOpen}</button>
      <PinItem {app} home={HOMEBREW_HASH} onpicked={close} />
    {/snippet}</MoreMenu>
  </div>
{:else}
  <PageHead {app} title={t.myItems} sub={t.subHomebrew} help={null} home={HOMEBREW_HASH}
    extra={wideHead} />
{/if}
```

- `wideHead` is a snippet: `HomebrewTabs` and the primary with the plus icon, the primary
  pushed right (`margin-left: auto`). The primary is `Button variant="primary" href={app.href(
  homebrewItemHash(null))} sameTab` per tab (`hbNewItem`, `hbNewSource`, `hbNewSet`,
  `hbNewCard`): the sources and cards tabs keep their in-place forms, which today open from a
  `Button` in each component; here the head's primary for those tabs is the tab's own button
  rendered by the child, so the head draws the primary only on the Items tab. Read
  `HomebrewSources` and `HomebrewCards` (their first `Button variant="primary"`): on those two
  tabs the child's button stays first under the head, as rule 9 of `FEATURES.md` says ("each
  tab's create button is the first control under the tab row"), and the head draws no primary
  there. Items: the head primary. This keeps their forms and focus returns untouched.
- Heading in every state (rule 7): the head draws before `{#if app.user === null}`, so the
  signed-out, loading and failed branches keep «Мои предметы» as the `h1`; `LoadState` draws
  its line as today. `hbLoadFailedTitle` (batch 4) is not used on this page.
- The import toggle: from 761 px a `Button size="sm" variant="plain" caret on={importing}
  expanded={importing}` «Импорт из файла» (`Icon upload`) at the right end of each tab's first
  tool row (S5, S7); up to 760 px it is the «Ещё» item. `toggleImport`, `closeImport`,
  `importView`, `loadImport` and the chunk logic stay as they are; the panel renders
  `<Panel>` directly under the head (above the tab body) at every width. `closeImport` returns
  the focus to the toggle that opened it, else «Ещё»: keep a `importOpener` element captured
  at open (the button, or «Ещё» after the item pressed).
- The counts: `counts = { items: store.items.length, sources: store.books.length, sets: cards of
  kind set, rules: cards of kind ref }`; `limitText` is the existing `count` (rule 1). Read
  `store.cards` for `kind`.
- The page no longer imports `BatchBar`, `FilterBar`, `Chip`, `ChipRow`, `helpFor`.

### S5. The Items tab

Order under the head: the import panel (when open), then for `tab === 'items'`:

1. A tools row (`.tools`, flex, gap 8): `SearchBox` (grows, `placeholder` `t.searchShort`, `label`
   `t.hbFindOwn`; drawn when `finding`), «Фильтры · N» (`Button size="sm"` variant `toggle` when
   `chosenCount(inForce) > 0`, plain otherwise; drawn when `finding` and `band !== 'wide'`),
   from 761 px the counter `span.count` (red at the limit) and the import button, then
   «Выбрать» last (`button.selmode`, as `TablesPage`; hidden while `app.selecting` and with no
   drawn item). With no item and from 761 px the row holds the import button alone; up to 760
   px with no item there is no row.
2. Up to 760 px only: the count line (batch 3's `.count.line`: the chosen values then
   `t.shownOf`) while `narrowed`, and the limit line (red) while `store.itemLimit !== null &&
   store.items.length >= store.itemLimit`.
3. `.body` with `class:withcol={band === 'wide' && facRows.length > 0}`: `FilterPanel` (`rows
   facRows`, `picked inForce`, `shown drawn.length`, `band`, `open filterOpen`, `onclose` focus
   `filterToggle`, `onpick pickFacet`, `onclear` (drop the group), `onreset applyFilter({})`)
   and `div.hbrows data-primary` holding the groups.
4. The groups: `h2.hbgroup` (label, count `span.n`) then `TableRows` (`entries`, `view="list"`,
   `index`, `lang`, `ticks={app.selecting}`, `hide`, `terms` of `findQ`, `selected`,
   `artBroken`, `ontoggle`, `onartfail`, `onopen` -> `app.go(homebrewItemHash(it.id))`). Under a
   source filter with one source the head drops the source name: `groupsOf` already labels
   `source · section`; add a small `trim` in the page: when `inForce.src` has one value, strip
   the leading `source · ` from `g.label` (read `groupsOf` for its separator constant).
5. Empty: `Empty title={t.hbEmptyTitle} glyph="kindItem"` with `t.hbEmpty`; no match: `Empty
   title={t.nothing}` with the cause line and, when a value is in force, «Сбросить все»
   (`t.resetFilters` of batch 3; the focus goes to `filterToggle` else `#main`, rule 20).

Selection (H5): copy `TablesPage`'s three pieces: the effect that sets `app.selecting = true` when
`app.sel.size > 0`; `startSelecting()` (sets the mode, focuses `.selbarwrap .selall input`); the
`setSelectable(drawnIds)` effect and its `onDestroy` clear. Keep the effect that drops a tick the
search or the filter hides. The tick of a row of another tab is kept (`keepsTicks`).

State carried over: `findQ`, `filterOpen`, `seenSeg`, `finding`, `picked`, `inForce`, `facRows`,
`applyFilter` and the address behavior (`seenSeg` opens the sheet when the address changed from
outside; up to 999 px that opens the `FilterPanel` sheet, as the old panel opened its fold).
`filterOpen` resets when the band becomes `wide`, as `TablesPage` does with `seenBand`.

D5 (H23): in `RowMain.svelte`, after the name element, when `isHomebrewRecord(it)` and
`oneLangOf(it.ru, it.en)` is a language other than `lang`, draw `<span class="lt"
lang={that}>{that.toUpperCase()}</span>` (`--t-label`, `--muted2`, 1 px `--line2` border,
`--r-sm`, no capitals rule needed: it is a code). Import `oneLangOf` from `lib/homebrew.js`.

### S6. `HomebrewBulk` and the bar

`HomebrewBulk.svelte`: props `app`, `store: Homebrew`, `ids: readonly string[]` (the ticked ids),
`copy: () => void`. It owns the logic that left `HomebrewPage`: `moving`, `moveBook`,
`moveSection`, `moveGone`, `moveSending`, `tickedRows`, `placeOf`, `toMove`, `movePicked`,
`deletePicked`, `deleting`, `deletingSaid`, and the `StatusRegion`. Markup:

- `app.band !== 'narrow'`: `Button size="sm" caret on={moving} expanded={moving} disabled={busy}`
  `{t.hbMove.replace('%n', n)}`; `Button size="sm"` `{t.exportJson} (n)`; `Button size="sm"
  variant="danger" disabled={busy}` `{t.del} (n)`.
- `app.band === 'narrow'`: `<span class="bulkmore"><MoreMenu {app} id="hb-bulk" up size="sm"
  disabled={busy}>` with the items `<Icon copy>{t.copyText}`, `{t.hbMove} ...`, `{t.exportJson}
  (n)`, `<div role="separator" class="msep">`, and the danger «Удалить (N)» item (`.danger`).
  `.bulkmore { flex: 1 1 0; min-width: 0; display: flex }` and `.bulkmore :global(.btn) { width:
  100% }`. Add `disabled?: boolean` to `MoreMenu` if batch 5's version has none (a one-line
  prop onto its `Button`).
- «Переместить» opens `Sheet` (`label` and `title` `t.hbMove` with N) with the batch's
  `SourcePicker` and section select, the notes (`moveGone`, `hbMoveHere`) and a foot of
  «Отмена» and the primary `{moveSending ? t.hbMoving : t.hbMoveGo}`. Capture the opener
  (`document.activeElement` after the menu closed) and focus it on close (rule 20).
- Success: `app.clearSel()`, close the sheet, `app.say(hbMovedN)`, focus `button.selmode`, else
  `#main` (the bar left the screen with the mode). Delete: the confirm text, `deleteItemAsk`,
  `store.removeItems`, the failure toasts and the kept ticks are unchanged; while it runs
  `busy` is true, `allBox` (`.selbarwrap .selall input`) takes the focus, and `deletingSaid`
  fills the `StatusRegion`.
- The move and delete act on `ids` filtered to the store's items (`store.items.filter(...)`),
  which the page already limits to the drawn rows (S5's prune effect).

`SelBar.svelte`: `const hb = $derived(app.route.kind === 'homebrew' && app.route.tab === 'items'
&& !!app.homebrew)`. In `actions`, after `AddToList` and «Печать»: the «Скопировать текст» button
draws unless `hb && app.band === 'narrow'`; then `{#if hb && app.homebrew}<HomebrewBulk {app}
store={app.homebrew} {ids} copy={() => void copySel()} />{/if}`. The bar's «Все» ticks the drawn
rows (S5 sets `app.selectable`). No other `SelBar` behavior changes.

### S7. Sources, Sets and Rules

- `HomebrewSources`: in a named source's `.acts` keep «Разделы» and replace the other three
  buttons by `MoreMenu` (`id="hb-src-{book.id}"`, items: rename (`start('book:' + id)`), JSON
  (`app.exportHomebrew({ book: book.id }, ...)`), `role="separator"`, delete (danger, `void
  removeSource(book)`)). Each item calls `close()` first. Section rows and the default row do
  not change. The tools row (`.cline`): the counter and, from 761 px, the import button at the
  right end.
- `HomebrewCards`: `Empty` gets `title` (`hbNoSets` / `hbNoRefs`) and the body `hbNoSetsSub` /
  `hbNoRefsSub`, glyph `kindItem`; the tools row as above. The head buttons stay.

### S8. The import panel

`HomebrewImport` (H13): move the schema link and the llms link to the file row after
`ImportFile` (`Формат файла` = `hbImportFormat` to `/schema/homebrew-v2.json`, `llms.txt` to
`/llms.txt`, both `target="_blank" rel="noopener"`); draw `hbImportFits` as one `p.hint` under
the file row (visible; it states what files fit before a choice, rule 15 (d)); delete the
trailing composed hint; keep the preview, the `where` rows, the held block (label `t.hbImportHeldLabel`
via the `Seg` with `neutral`), notes, over-limit and actions as they are. The summary line stays one
line (`counts`). Check the panel at 360: no horizontal scroll (`sweep.js`).

### S9. The editor

`HomebrewEditor` and `HomebrewRelations`:

- Head (H14): replace `PageTitle` in the ready branch with `div.crumb` holding `<a href=
  {app.href(HOMEBREW_HASH)} class="back"><Icon chevron-left/>{t.myItems}</a>` (use the existing
  back/chevron icon: `git grep -n "chevron" app/src/lib/icons.ts`; if none points left, rotate
  `chevron` in CSS) and `<h1 class="ttl">{title}</h1>`, then `<p class="page-sub">{sub}</p>`
  (the same `.page-sub` look as `PageHead`). `h1`: `overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap` up to 760 px; `-webkit-line-clamp: 3` from 761 px; `title={title}`
  attribute for the cut name. The loading, failed, signed-out and missing branches keep
  `PageTitle`.
- Groups and order (H15): `<section class="grp" aria-labelledby="g-item">` with `<h2
  id="g-item">`. Order per H15. «Ранг» of an item or consumable moves inside «Предмет» after
  «Картинка» and carries `optional`. «Характеристики» draws for `draft.kind === 'equip'` and
  holds the rank, the weapon or armor fields, and the disclosure. «Где лежит» holds Источник
  and Раздел. `fieldOf`, ids and the `focusField` order follow the DOM order automatically;
  check that `formProblems`' summary order (validators' order) still reads well and do not
  re-sort it.
- From 1000 px: `.grp` is a 2-column grid for the short Seg fields (`@media (min-width:
  1000px)`; fields that must span: Название, Описание, Картинка, Характеристика, Дистанция:
  `grid-column: 1 / -1`).
- Marks and legend (H16, H21): delete `<p class="legend">`; pass `optional` and `optionalText=
  {t.hbOptional}` to Описание, Картинка (S3), Ранг (item), Раздел, «Улучшается до», «Получается
  из», «Комплект», «Карты правил, до 3» and «Линия улучшений». Required fields lose `required`
  on `FormField` only. Add `neutral` to every `Seg` (the `choice` snippet, the tier Segs, «Язык
  текста», the view switch).
- No «?» (H18): remove the `help` prop from the Источник and Описание `FormField`s and from the
  five in `HomebrewRelations`; remove the `HelpButton` import, `altHelp` and `hb-alt-help` from
  the editor. Add `<p class="cap">{t.hbSourceCap}</p>` under Источник and `{t.hbLineCap}` under
  the line choice (drawn for `draft.kind === 'equip'`), `<p class="cap">{t.hbSetBonusOf.replace
  ('%s', bonus)}</p>` under «Комплект» when the chosen set has a bonus (read it from
  `store.cardRefs` or the catalog set; `bonus` in the language `editIn`), `.cap` = `--t-data`,
  `--muted2`, margin 0. `ArtField`'s hint stays (it states a limit, rule 15 (d)).
- Equipment labels (H17): the `DAMAGE` options read `t.hbDtPhy`, `t.hbDtMag`, `t.hbDtAny`
  (`phy`, `mag`, `any`); `problemText` in `lib/homebrewForm.ts` returns `hbErrCls`, `hbErrTr`,
  `hbErrRg`, `hbErrDt`, `hbErrBu` for `hb-cls`, `hb-tr`, `hb-rg`, `hb-dt`, `hb-bu` before the
  generic `hbErrPick`. `homebrewForm.test.ts` holds each mapping.
- Conflict (H20): in the `conflict` banner swap the two buttons' variants (`Показать новую
  версию` primary, `Сохранить мою версию` danger, both `size="sm"`; the DOM order stays). The
  button row's «Сохранить» gets `disabled={busy || banner === 'conflict'}`.
- Bar and preview (H19): wrap the button row in `div.ebar`; `app.band === 'narrow'` draws
  «Сохранить», `Button variant="plain"` `{t.hbPreview}` (opens `Sheet label={t.hbPreview}
  title={t.hbPreview}` with `previewBody`), and `MoreMenu up` with `{t.del}` (danger item,
  stored items only). From 761 px: «Сохранить» and, on a stored item, «Удалить» (danger). Move
  the preview column's content into a snippet `previewBody` used by the column (761 px and up)
  and by the sheet; the card renders in one place per band, never twice. The sheet closes on
  a band change (`$effect.pre` on `app.band`, as `TablesPage`'s `seenBand`) and rule 20 returns
  the focus to «Предпросмотр». The sticky bar: `position: sticky; bottom: 0; z-index: 3;
  background: var(--surface); border-top: 1px solid var(--line); padding: 10px 16px
  calc(10px + env(safe-area-inset-bottom)); margin: 0 -16px`; `@media (max-height: 480px)
  { position: static }`. `scroll-padding-bottom` follows the bar: set `--selbar-h`-style
  `--ebar-h` through a `ResizeObserver` as `SelectionBar` does (WCAG 2.4.11), and add it to
  the page's scroll padding where `--selbar-h` is added.
- Failed save: the summary keeps `role="alert"` and the focus. A field's message is its own
  (H17). The `inLists` hint, the `uploadingArt` line and `refused` stay under the bar's row.

### S10. The crop dialog

`CropDialog.svelte` (H22): (1) `.range input::-webkit-slider-thumb` and `::-moz-range-thumb` 24
px; (2) two `Button size="md"` (`−`, `+`, `aria-label` `t.cropLess` / `t.cropMore`) that step
`zoom` by 0.25 and clamp to `[1, ZOOM_MAX]`, replacing the `aria-hidden` signs; (3) `.hint`
becomes `.vh` (still the target of `aria-describedby="hb-crop-hint"`); (4) `.sq::after` draws
the vertical thirds as `.sq::before` draws the horizontal ones; (5) tap-to-center: `ondown`
stores `{x, y}`; `onup` with a movement under 4 px calls `moveTo` for the point (the stage's
rect to the image's coordinates, as `onmove` computes); a drag does nothing extra. Add cases to
the dialog's test (the `+` step, the clamp, the tap, a drag that does not center). A9's live
check: one probe at 360x640 and 1180x720 of the built app with a 3:2 picture: the frame's top
cut position and the thumb size (`getComputedStyle`); record the numbers in `handoff.md`.

### S11. Unit tests and the `COVERED` list

`a11y.test.ts` `COVERED` gains `HomebrewTabs.svelte` (`homebrewTabs.test.ts`) and
`HomebrewBulk.svelte` (`homebrewBulk.test.ts`), each file ending in `expectNoA11yViolations`.
`homebrewPage.test.ts`, `homebrewEditor.test.ts`, `homebrewImport.test.ts`,
`homebrewCatalog.test.ts`, `homebrewPrintPreview.test.ts`, `tables.test.ts` (the D5 tag),
`search.test.ts` (D5), `record.test.ts` and `cardForm`'s tests change where they name a moved
control, a `*`, a «?» or a legend (`git grep -n -E "Подсказка:|fieldHelp|hbLegend|К моим предметам|\\*"
-- app/src/components/homebrew*.test.ts`). See "Tests".

### S12. Suites and states

`tests/app/states.js`:

- `FIRST_SCREEN` (lines 5187-5189): the three rows become `{ shipped: true }` and the fourth row of
  "First-screen rows" is added. The `/homebrew` marker is `div.hbrows`. A built value past the limit is logged in `handoff.md` and the AFK
  decisions file, as section 14 says; do not move a limit without the log.
- Case 91 (new, the next free number after batch 5's 90; check the list), "the homebrew head,
  tabs and bar hold from 320 to 1180 px":
  1. 760x800, 390x844, 360x640 and 320x568 on `#/homebrew as gm3`: the `h1` rect is at most 1
     px wide; no `.homebtn` in `main`; the picker, the primary and «Ещё» sit inside 0..width on
     one line (at 320 the line may wrap once: then «Ещё» stays visible); the picker's accessible
     name is «Мои предметы: Предметы».
  2. 761x768 RU and EN: the `h1`, the pin and the four tabs share one line or wrap whole (no
     word broken, `scrollWidth <= clientWidth`); at 1180 the primary is on that line.
  3. «Ещё» (360) opens a `role="menu"` of the import and the pin; the import item opens the panel
     and returns the focus to «Ещё» when the panel closes; Escape closes only the menu.
  4. The picker sheet at 360 lists four tabs with counts and the counter; a tab press closes it
     and goes to the tab, keeping the ticks.
  5. Selection at 360 with two ticked: one bar (no strip), «В список», «Печать» and «Ещё» inside
     0..360 and the bar at most 150 px high; «Ещё» opens upward inside the window with the copy,
     the move, the JSON and the delete; «Переместить» opens the sheet and returns the focus to
     the opener; at 1180 the bar holds the six actions and no `Menu`.
  6. 300 items (case 68's fixture): the page draws and scrolls; `scrollWidth <= clientWidth`.
- Case 92 (new), "the editor holds its layout and the preview sheet": at 360x640 and 1180x720 on
  `#/homebrew/new as gm1` and `#/homebrew/hb_emberaxeaaaaaaaa as gm1`, RU and EN: the three group
  heads in DOM order; no `button[aria-label^="Подсказка"]`; no `*`; at 360 the `.ebar` is
  sticky (its bottom equals the viewport's), holds three controls inside the window, and
  «Предпросмотр» opens the sheet with the card and the switches, Escape closes it and the focus
  returns; the card exists once in the DOM per band; the longest title (the 120-character name
  of `~ long name`) is one line at 360 and at most three at 1180; at 1180 the pairs sit on one
  row (`getBoundingClientRect` tops within 2 px). A failed save at 360 shows field messages
  that differ per field (no two equal texts among class, trait, range, damage type, burden).
  The conflict banner's primary is «Показать новую версию».
- Adapted cases (read each; `git grep -n -E "homebrew|dicebar|Подсказка|\\.hbform|BatchBar|\\.batch"
  -- tests`): 63 (relation folds, the preview menu), 64 (the own-item row: ticks only in the mode,
  the D5 tag), 67 (field help at 360: it becomes "no field help at 360" or is deleted with its
  inventory states; the threshold labels stay), 68 (300 items: the bar and the head, not the
  strip), 70-72 (the crop dialog: the new controls), 79 (a picker list above the keyboard),
  80 (the refusal look: the summary and the import alert), 82 (the filter address: the sheet
  and the count line in place of pills), 78 and 86-88 (no change expected), `tests/e2e/flows.mjs`
  (homebrew flows: the import, the ticks, the editor's save and back link).
- `inventory.js` (about 8 removed, about 14 new, about 55 re-seeded): remove `#/homebrew ~ help
  open`, the editor `~ description help` and the editor's relation-help states; add per "Goldens
  and new states". Keep the ids that stay. A state that opens or presses something and is new has
  its entry, RU and EN golden and an axe case.
- `tests/app/hues.js`: on `/homebrew/new` the only gold control is «Сохранить»; on
  `/homebrew` the gold is the primary and the lit tab only. If a read breaks, adapt it.
- `tests/app/typo.js` reads: if it names the editor's `*` or legend, adapt.

### S13. Prose, in the same commit

`FEATURES.md`:

- "Homebrew", "`#/homebrew` and its tabs": the head (up to 760 px the read-only `h1`, the
  picker, «Ещё» with the import and the pin; from 761 px the head with the pin, the tabs with
  counts and the primary); the five-paragraph help goes; the import is in «Ещё» or the tools row;
  a tab press keeps the ticks (unchanged).
- "The Items tab": the search row, «Фильтры · N», the sheet below 1000 px and the column from it,
  no pill and no strip, «Выбрать», the one bar with its actions, the narrowed count line, the
  group heads without the source under a source filter, the empty states (H10), the bar's delete
  and move texts as H6 to H8 say, the focus after a move or a delete.
- "The Sources tab": the row's two controls.
- "The editor": the group order, the optional marks, no legend, the breadcrumb, the bar and the
  preview sheet up to 760 px, the sentence about `«?»` removed, the three captions, the field
  messages, the conflict roles.
- "Relations", "Checks", "Saving", "Import" (order and labels), "The bulk move" (a sheet; focus
  to «Выбрать»), "Downloads" (the bar's «Скачать JSON (N)»).
- Consistency rule 15 (c): drop «Линия улучшений», «Второй набор характеристик» and «Источник на
  форме предмета» from its examples and the departure about the second set; keep the card forms'
  «?» (Q6-1). Rule 18: add the departure "the editor's «Описание» box has no «?» (owner, Q6.2)".
  Rule 9: the departure about the import and the tab row is rewritten (the primary of the Items
  tab sits in the head). Rule 11: the bulk move's sheet, «Отмена» discards. Rule 1: the counter's
  places. Rule 20 lines for the move and delete focus.
- "Chrome": «Мои предметы» is among the pages with the read-only `h1` up to 760 px and the pin in
  «Ещё» (`/homebrew`); the editor's heading is the breadcrumb row.

`COVERAGE.md`: the rows of `homebrewTabs.test.ts`, `homebrewBulk.test.ts`, the changed counts,
cases 91 and 92 and the new state count. `STATE.md`: check `git grep -n -E "findQ|filterOpen|moving"
-- docs/specs/STATE.md`; the page memory rows for the homebrew filter and the move stay true.

`DESIGN.md`: see "DESIGN.md rules this batch writes".

Decision file `docs/decisions/<date>-the-homebrew-pages-share-the-list-head-and-one-selection-bar.md`
(template `.claude/templates/decision.template.md`): Task `57`; Decision: H1 to H7, H9, H15 to H21;
Rejected: the mock's open card rows (the spec's closed fold), a popover for the move (a new
clipped geometry), a legend sentence for the stars (a defect by the Clarity Rule), drawing the
preview card twice (hidden duplicate), corner handles that do not resize (a false affordance), a
lit filter pill row (batch 3); Accepted trade-off: a bottom sheet for the move on a laptop, a menu
with one item on a phone editor, the copied tab CSS. Then
`node tools/decisions.js`.

Budget: after the measured totals, `tools/bundle-budget.mjs` and `.claude/README.md` rise by the
standing rule of the file (see "Verification" 6), with the figures and the reason in the comment.

### S14. Impeccable

The orchestrator runs `polish` and `harden` on `HomebrewPage`, `HomebrewTabs`, `HomebrewBulk`,
`HomebrewEditor` and the crop dialog at 360 and 1180 px; `handoff.md` gives the outcome.
Fallback: `impeccable:impeccable-finish-reviewer`.

### S15. Gates

See "Verification".

### S16. Evidence

`issues/57/mocks/6/built/shoot.js`, from `mocks/5/built/shoot.js`: at 360x640 and 1180x720, RU and
EN: `/homebrew` (closed, tabs sheet, «Ещё», filter sheet, selection with two ticked, the bar's
«Ещё», the move sheet, empty, failed read), the three other tabs (the source «Ещё» open, the two
empty states), the import panel with a preview, `/homebrew/new` (closed, the optional marks, errors,
the preview sheet, the conflict banner, a long name), the crop dialog, plus 761x768 for `/homebrew`
RU and EN. The set is evidence, not a gate.

## Acceptance criteria

Each line is observable in a suite, a unit case or the built app. `plan.md` section 7 "Batch 6"
and "Each of batches" are first; the placement lines follow.

- Q6.1 (owner): `/homebrew` draws no help panel and no help button at any width and in any
  state (`homebrewPage.test.ts`: no `button` named «Справка» / "Help"); `help.ts` has no homebrew
  help and `help.test.ts` passes; the `~ help open` state and its goldens are gone.
- Q6.2 (owner): the editor and the relations fold draw none of the eight «?» (`homebrewEditor.test.ts`:
  no button named «Подсказка: ...» for Источник, Описание, Второй набор характеристик, Линия
  улучшений, Улучшается до, Получается из, Комплект, Карты правил); the three captions draw
  (H18); `FEATURES.md` rules 15 (c) and 18 change in the same commit (the owner's yes, 2026-10-29);
  the card forms keep their two «?» (Q6-1).
- The owner-reported preview bug (2026-10-30): the reproduction is named in `handoff.md` (the
  failing assertions of S2 on the unchanged tree); after the fix «Вид» = «Снаряжение» draws the
  type badge and glyph at once, «Броня» the armor ones, and no stat block until a tier is
  chosen; a component test in `homebrewEditor.test.ts` holds it, with the unit cases of S2
  (`homebrewForm.test.ts`, `record.test.ts`).
- A28 (head and tabs): H1 and H2 hold; four tabs with counts and `aria-current`; the tab press
  keeps the import panel and the ticks (`homebrewPage.test.ts`, case 91 items 1 to 4).
- The Items-tab filter strip adopts the filter system: `FilterPanel` column from 1000 px, a
  sheet below, no pill row at any width, «Фильтры · N» lit while a value is in force; the
  address behavior of case 82 is unchanged (`homebrewPage.test.ts`, case 82 adapted, the
  `~ filters`, `~ filters open` and `f_src-...` goldens).
- Round 3, unit B (owner): the `/homebrew` primary marker is the first group head; group heads
  stay at 360; a filter in force is a lit «Фильтры · 1» (case 83, `homebrewPage.test.ts`).
- Round 6 (owner): at 360 «Новый предмет» has no plus icon; from 761 px it has one
  (`homebrewPage.test.ts`, case 91 item 2); the selection bar is batch 3's, with «Все» visible
  at every tick count (`homebrewBulk.test.ts`, the shared `SelBar` tests).
- A40 (homebrew rows): a row draws no tick outside the selection mode; «Выбрать» opens it, «Снять
  выделение» leaves it and returns the focus to «Выбрать» (`homebrewPage.test.ts`, case 91 item 5).
- One bar: a ticked row shows exactly one `.selbarwrap` and no strip (`homebrewPage.test.ts`);
  the bar's actions are H6; the move, the JSON download and the delete behave as before
  (`homebrewBulk.test.ts`: the ids sent, the revision list, the `gone`, `conflict`, `refused`,
  `limit` and network answers, the confirm text, the partial-failure toast and the kept ticks,
  the focus rule of H8 and S6).
- A29: a named source's row holds two controls, «Разделы» and «Ещё»; the menu holds rename, JSON
  and delete; the worded limits stay (`homebrewPage.test.ts`, the sources goldens).
- A38 and theme 8: the three empty states of H10 draw their title and sentence with no button
  inside (`homebrewPage.test.ts`, the empty goldens); a failed read keeps `LoadState` with the
  page heading.
- A13 and D16: the import panel reads in the order of H13; EN reads "If you already have it:"; the
  two links sit on the file row (`homebrewImport.test.ts`, the import goldens); no horizontal
  scroll at 360.
- A6: the editor draws three headed groups and, from 1000 px, pairs short choices; up to 760 px
  the sticky bar and the preview sheet exist, the card draws once per band (case 92).
- A7: five field-specific messages replace the generic line; no two fields of a failed save show
  one text (`homebrewForm.test.ts`, `homebrewEditor.test.ts`, case 92). A summary keeps the focus
  and links each field.
- A8: optional fields carry «необязательно» / "optional"; no `*` and no legend in the editor and
  the card forms; the required controls keep `required` and `aria-required`
  (`homebrewEditor.test.ts`, `cardForm` tests, axe).
- A9 (verify): the live probe's numbers are in `handoff.md`; the 24 px thumb, the two buttons, the
  hidden hint, the thirds and the tap are held by the dialog's tests; or the tap is logged as
  Deferred (H22).
- A30: the conflict banner's primary is «Показать новую версию»; «Сохранить мою версию» is danger;
  «Сохранить» is disabled while it shows; the primary does not write
  (`homebrewEditor.test.ts`, the conflict golden).
- A11 (artefact): closed by the live check of `plan.md` ("the preview is already `sticky`"): case 92
  asserts the column is sticky from 800 px.
- D5 (H23): the tag draws on a one-language own item in a row and does not draw on a catalog row
  or on an item in the interface language (`tables.test.ts` or `rowMain` test, `search.test.ts`).
- D14: closed as by design, in `handoff.md` and the decision file's Accepted.
- D15: the damage message is at most two lines at 360 in EN and the damage-type options read in
  full words (case 92; `homebrewEditor.test.ts`).
- Consistency, from section 7's "M2-2 (from batch 2)": `/homebrew` up to 760 px has no `.homebtn`
  and the pin is an item of «Ещё» (`PinItem`; case 91 items 1 and 3).
- Seg rule (section 4): the editor's pressed options carry a check and no gold (`hues.js`).
- Every new state has an inventory entry, a RU and EN golden and an axe case (see "Goldens and
  new states").
- Focus (rule 20): after a pressed «Ещё» item, a closed move sheet, a closed preview sheet and a
  closed tabs sheet the focus returns to the opener; Escape closes only the topmost popup
  (`homebrewPage.test.ts`, `homebrewBulk.test.ts`, `homebrewEditor.test.ts`). The header freezes
  while a menu or a sheet is open (case 86 passes).
- `FIRST_SCREEN`: the four homebrew rows are `shipped: true` and pass at 360x640 and 1180x720 in
  RU and EN (case 83); the offsets are in `handoff.md`.
- Each new component has an axe case in `a11y.test.ts` and is reached by a test; the artwork
  guard still passes (`RecordCard`'s head markup is untouched: `CARD_HEAD_SHA256` does not move).
- Specs, DESIGN.md rules and the decision file of S13 match what ships; `COVERAGE.md` rows agree.
- From "Each of batches 2-9": the detector line, American spelling in new prose, the screenshot set
  in `mocks/6/built/`, the `polish` and `harden` outcome, `routes.json` unchanged.
- The bundle budget is raised by the standing rule with the measured figures.
- The gates pass and CI is green on the pushed tip.

## First-screen rows (plan section 14)

| Row | 360x640 (limit 256) | 1180x720 (limit 288) | Flag |
|---|---|---|---|
| `#/homebrew as gm3` | the mock 223 (first group head); the first item row 255 | the mock 189; with the lead line about 230 | `shipped: true` |
| `#/homebrew/sets ~ long name as gm4` (the Sets tab, a long set name) | the mock 242 RU, 209 EN (first card row) | the mock 185; with the lead about 225 | `shipped: true` |
| `#/homebrew/new as gm1` (the editor) | the mock 228 | the mock 187 (no lead line on the editor) | `shipped: true` |
| the editor with a 120-character name (`#/homebrew/hb_longsrcaaaaaaaaa as gm4` or a new entry) | the mock 228 | the mock 215 | `shipped: true` (new row) |

Today's built values (after batch 3, handoff): 719 / 604, 522 / 408 and 237 / 189. The "about"
figure adds the lead line (H1; about 21 px of text and 18 px of margin) to the mock, which drew
none. At 360 the lead is read, not drawn, so the 360 values are the mock's. The Sets tab at 360
RU starts at 242 (two-line head: «Карты правил ▾» and «Новая карта правил»), inside the limit and past the 240
target. If a built value passes the limit, log it in `handoff.md` and the AFK decisions file and name the fix: hide
the lead from 761 px (it removes visible text: the orchestrator logs the choice and the owner may reverse it). Do
not move a limit without the log. The editor's `data-primary` is the form, whose top is the first group head.

## Goldens and new states

About 90 existing goldens move: the 70 `_homebrew_*`, the `_i_hb_*` and `_h_*` ones that draw the
editor's preview card (the `eqType` fix may not move them; read each), and the `_tables_homebrew*`
and `_search_*` states that draw a one-language own name (D5). A moved file outside those families
is a defect to read, not to re-seed: especially `_tables_eq_*`, `_roll_*`, `_lists_*`, `_s_*`.
Deleted: `~ help open` (page), the editor `~ help open` and `~ description help`. The re-seed runs
the four shards.

New inventory entries (a state keeps both languages in one file; `width: 360` where named):

| State id | Width | Entry |
|---|---|---|
| `#/homebrew ~ narrow as gm3` | 360 | the head: the picker, the primary, «Ещё» |
| `#/homebrew ~ tabs as gm3` | 360 | press the picker: the sheet with four tabs, counts and the counter |
| `#/homebrew ~ more as gm3` | 360 | press «Ещё»: the import and the pin |
| `#/homebrew ~ filter sheet as gm3` | 360 | press «Фильтры»: the sheet (replaces `~ filters open` where it was the strip) |
| `#/homebrew ~ select as gm3` | default | press «Выбрать», tick two: the bar with six actions |
| `#/homebrew ~ select narrow as gm3` | 360 | the bar with «В список», «Печать», «Ещё» |
| `#/homebrew ~ bar more as gm3` | 360 | press the bar's «Ещё»: the menu opens upward |
| `#/homebrew ~ move as gm3` | default | press «Переместить»: the sheet (replaces `~ move as gm1`) |
| `#/homebrew/sources ~ menu as gm1` | default | press a source's «Ещё» |
| `#/homebrew/sets ~ empty as gm4` | default | an account with no set (a fixture without cards) |
| `#/homebrew/rules ~ empty as gm4` | default | the same for rule cards |
| `#/homebrew/new ~ narrow as gm1` | 360 | the sticky bar |
| `#/homebrew/new ~ preview sheet as gm1` | 360 | press «Предпросмотр» |
| `#/homebrew/new ~ equipment as gm1` | default | press «Снаряжение»: the preview draws the weapon badge (the bug's state) |
| `#/homebrew/hb_emberaxeaaaaaaaa ~ bar more as gm1` | 360 | press the bar's «Ещё»: «Удалить» |

`#/homebrew ~ filters`, `~ search`, `~ no match`, `~ import ...`, `~ imported`, `~ pinned`,
`~ section fold` and the other existing states keep their ids; their `why` and `enter` change only
where a control's name or place did. Seed the new files with the shard run; do not edit a golden by
hand. If the fixture `gm4` has cards, pick the account whose fixture has none (`git grep -n
"cards" -- tests/app/driver.js`); name the account in `handoff.md`.

## DESIGN.md rules this batch writes

- "Forms" (new, "Components"): optional fields are marked with the word, required ones are not; no
  legend sentence; a field's error is its own sentence naming the fix; the summary names the field
  first; a field has no «?» unless it states a site constraint (`FEATURES.md` rule 15); a caption
  under a field states a fact the person must know before typing.
- "Segmented control": the neutral pressed state with a check is the picker of a form field; gold
  stays for a choice that narrows a view (the catalog chips).
- "Components": the sticky bottom bar of a form (the editor's save bar, up to 760 px) and the
  preview sheet; a menu may hold a single danger action when the bar has no room.
- "Layout": the list head of batch 3 is the head of `/homebrew` (the picker row up to 760 px, the
  head with tabs from 761 px); `/homebrew` is in the First-Screen table.
- "The Same Label Rule": the interim note drops `/homebrew` from the pages that keep the round
  pin up to 760 px.
- "Filter pills": none at any width on `/homebrew` (the mock departure, section 4).
- "Badges": the language tag of a one-language own item in a row (H23).

## Tests

| File | Cases |
|---|---|
| `homebrewTabs.test.ts` | four links with counts and `aria-current` from 761 px; the picker's name and its sheet up to 760 px; a link press closes the sheet and the focus returns; axe in both bands |
| `homebrewBulk.test.ts` | the six actions from 761 px and the menu up to 760 px; the move sheet (source, section, the `gone` and "already here" notes, the sent revisions, success clears the mode and focuses «Выбрать»); the JSON ids; the delete (confirm text, one status line, disabled while it runs, partial failure keeps the ticks, focus on «Все»); the opener's focus return; axe |
| `homebrewPage.test.ts` | the head in both bands; no help; the search row latch at the eighth item; the filter sheet and column; the count line while narrowed and the red limit line; ticks only in the mode; one bar; the group heads under a source filter; the three empty states; the sources «Ещё» menu and its focus return; the import in «Ещё» and in the row; tab press keeps ticks and the import panel; the D5 tag; case 82's address behavior |
| `homebrewEditor.test.ts` | the preview bug (S2), kind and type; the group heads and order; no `*`, no legend, optional marks; none of the eight «?»; the three captions; the five field messages; the conflict roles and the disabled «Сохранить»; the breadcrumb through the guard; the sticky bar and the preview sheet up to 760 px and the card once per band; the damage-type labels; the neutral Segs |
| `homebrewForm.test.ts` | `previewOf` `eqType`; `problemText` for the five fields |
| `homebrewImport.test.ts` | the order of H13, the labels, the links on the file row, D16 EN |
| `record.test.ts` | a record with `eqType` and no `eq` draws the type badge and glyph, no chips |
| crop dialog test | the thumb size rule (via the CSS text), `+` and `-` steps and clamp, hidden hint with `aria-describedby`, the tap centers, a drag does not |
| `formField` / `cardForm` tests | `optional` draws the word; no `*`; the two card-form hints lose «Необязательно.» |
| `tables.test.ts`, `search.test.ts` | the D5 tag on a one-language own row; no tag on a catalog row |
| `lib/help.test.ts`, `lib/i18n.test.ts` | no homebrew help; parity with the new keys, the deleted keys absent |
| `a11y.test.ts` | the two new rows |
| `tests/app/states.js` | cases 83 (three rows), 91, 92, the adapted cases |

## Verification

In this order, after S13. One command per call. A browser suite does not run locally (`plan.md`
section 7, the writer's local gates).

1. While editing: `npx vitest run app/src/components/homebrewTabs.test.ts
   app/src/components/homebrewBulk.test.ts app/src/components/homebrewPage.test.ts
   app/src/components/homebrewEditor.test.ts app/src/components/homebrewImport.test.ts
   app/src/components/homebrewCatalog.test.ts app/src/components/homebrewPrintPreview.test.ts
   app/src/components/record.test.ts app/src/components/tables.test.ts
   app/src/components/search.test.ts app/src/components/shell.test.ts
   app/src/components/selectionBar.test.ts app/src/components/a11y.test.ts
   app/src/lib/homebrewForm.test.ts app/src/lib/homebrew.test.ts app/src/lib/help.test.ts
   app/src/lib/i18n.test.ts`, then `npm run lint:untyped` and `npm run lint:typed`. If a file name
   above is wrong, `git ls-files -- "app/src/**/*.test.ts"` gives the right one (the form and
   crop tests are named by what they mount).
2. `node --test tools/artwork/lib.test.mjs` (the card head did not change; it must pass).
3. `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to 4, one at
   a time. Then `git diff --stat tests/app/snapshots`: only the families of "Goldens and new
   states" and the new files.
4. `node tools/decisions.js`.
5. `npm run check:built` (the unconfigured budget).
6. The configured budget: `npm run build` with placeholder `VITE_SUPABASE_*` values (this worktree
   has no `.env.test.local`), then `node tools/bundle-budget.mjs`. Raise both limits by the file's
   standing rule: the measured total rounded up to the next whole kB, never past 270 unconfigured
   and 350 configured, in the same commit as the reason, in `tools/bundle-budget.mjs` and
   `.claude/README.md`. Expected growth over batch 5's totals (batches 3 to 5 reach about 259-261
   unconfigured and 316-318 configured): new code about +1.7 kB gzip (`HomebrewTabs` +0.5,
   `HomebrewBulk` +0.3 as the moved logic, the editor's groups, sticky bar and preview sheet +0.6,
   the crop buttons and tap +0.2, `RowMain` tag and `optional` +0.1); removals about -1.9 kB (the
   homebrew help text in both languages about -0.5, the eight hint strings and `hbLegend` in both
   languages about -0.9, the `BatchBar` strip, the move panel CSS and the delete line from
   `HomebrewPage` about -0.3, the import hint strings about -0.2); net about -0.2 to +1.2 kB, so
   expect 259-262 unconfigured and 316-319 configured. If the unconfigured total passes 263,
   `handoff.md` names it, because batches 7 to 10 need about 7 kB under the 270 ceiling; the batch
   does not raise a ceiling. `FilterBar` and `BatchBar` do not leave here (their callers remain:
   `SharedListPage`; `ListsPage` and `ListPage`); the next removals are theirs, in 8 and 9a.
7. `impeccable detect --json --no-inline-ignores app/src`, and the spelling grep of batch 2's word
   list over the touched files and the new prose.
8. `rtk npm run check:fast` (Bash timeout 600000), last.
9. Commit, push, the CI credit. CI's `app/states` (cases 83, 91, 92 and the adapted ones),
   `app/contracts`, `app/hues`, `app/typo`, `app/print`, `sweep.js` at 360, 390, 768 and 1180 and the
   `e2e` flows are the browser proof; a failing case there is a case to read against this brief. The
   batch review follows (trigger: new or changed UI; `tests/app/` changed).

## Risks and do-nots

- Do not draw the preview card twice (the column and the sheet): a duplicate id or two axe hits. One
  snippet, one render per band; the sheet unmounts on a band change.
- Do not change `compact`, `FilterBar`, `BatchBar`, `Sheet`, `FilterPanel`, `TableNav` or `PageHead`.
  If a golden outside the homebrew families moves, it moved by mistake (D5 can touch rows of own
  items in `_tables_homebrew*` and `_search_*`: read them).
- `HomebrewBulk` must act only on the drawn ticked rows: the page's prune effect and
  `store.items.filter(...)` hold that; a move or delete that touches a hidden row is a data defect.
- Rule 20 is the likely miss: «Ещё» -> sheet -> close, delete -> bar leaves, import close, source
  rename cancel. Capture the opener, test each.
- The bar is `backdrop-filter`ed and `z-index: 45`; the `Menu up` and the `Sheet` (`z-index: 100`) sit
  above it. Measure the bar at 360 (about 129 px) and 360x480 landscape (case 85 style).
- The editor's `focusField` and the summary links read field ids: the group move keeps every id.
- A native `required` attribute with no star: `FormField` stops drawing the mark, never the
  attribute on the control. `QuickItem`'s and `CardForm`'s controls keep theirs.
- Do not store anything: `cfgOpen`-style flags are page memory (`STATE.md` unchanged).
- The first-screen numbers depend on Source Sans 3 line boxes. Measure on the built page before the
  push.
- `previewOf` must keep the stat block hidden: `eqParts` and `PrintCard` read `eq.tier`. Only
  `eqType` is new.
- American spelling in new prose and test titles ("color", "gray").
- Review order: `HomebrewPage.svelte`, `HomebrewBulk.svelte`, `SelBar.svelte`, `HomebrewEditor.svelte`,
  `lib/homebrewForm.ts`, `HomebrewTabs.svelte`, `HomebrewSources.svelte`, `HomebrewImport.svelte`,
  `CropDialog.svelte`, `FormField.svelte`, the suites, the prose.

## Standing checks for batch 6

1. Scale. Limits: items 100 (3x 300; case 68 has the 300 fixture), sources 20 (60), sections of a
   source 30 (90), cards 100 (300), ticked ids up to 300, the item name 120 characters, a source or
   section name 80, a set or rule text 1500.

   | State | Shows | Proof |
   |---|---|---|
   | Items: 0, 1, 9, 100 (limit), 101 (refused at create), 300 | 0: `Empty`, no search, «Выбрать» absent, import only from 761 px; 1 to 7: no search or filter, «Выбрать» present; 8 and up: search and «Фильтры»; 100: the red limit line, the primary stays on and its press says the limit; 300: groups scroll, the bar's actions act on the drawn ids | `homebrewPage.test.ts`, case 68, goldens `~ narrow`, `~ select`, the limit golden if one exists (add `~ at the limit` only if the fixture is cheap: it is not required) |
   | Sources: 0 named (the default only), 1, 8 (search from the eighth), 20, 60 | rows of two controls; 60 rows scroll; the «Ещё» menu stays inside the window | `homebrewPage.test.ts`, the sources goldens, case 68 style at 60 if a fixture exists |
   | Sections: 30 (limit), 31st refused, 90 | the section fold past 20 as today | unchanged (`~ section fold`) |
   | Cards: 0, 1, 100 | the empty title and sentence; a fold per card; 100 scroll | `~ empty` goldens, `homebrewPage.test.ts` |
   | Longest name (120) | the editor `h1` cuts to one line at 360 and three at 1180 with `title`; a group head and a row wrap (`overflow-wrap: anywhere`); the picker clamps to two lines | case 92, `~ long name` golden, sweep |
   | Longest text | the card and the preview scroll inside their column; the sheet scrolls | unchanged |
   | 360 px, 320 px, 1180 px | each row above at 360 and 1180; 320 for the head, the bar and the editor's sticky bar | cases 91, 92, sweep |

   At many and at the limit: the row order is the group order (source creation, then «Хоумбрю» last), the
   primary is the head's «Новый предмет» (Items) or the tab's own first button (the other tabs); the bar is
   one row group of about 129 px at 360; the move sheet is at most `min(85dvh, 640px)`; with the on-screen
   keyboard open at 360x480 the editor's sticky bar is static (H19) and the move sheet's selects stay in view.
   Sticky regions: the bar (batch 3, unchanged height class) and the editor's `.ebar` (about 64 px, static
   under 481 px of height); neither grows with content.
2. Error scenarios. Loading: the head and its `h1` draw first, then `LoadState`. A failed read: `LoadState`
   with «Повторить»; no tabs and no import while nothing is read, as today. A failed write: the bulk move and
   delete answers keep their toasts and kept ticks (a retry re-reads the rows and the revisions: the move
   sends the revisions of the last read, never a copy held before the failure); a failed save keeps the form;
   the sticky bar stays. Offline: the same toasts. A conflict (another device wrote first): the editor's banner,
   whose primary shows the new version, and the bulk move's `conflict` toast; nothing is overwritten without
   the danger press. A deleted record: an item deleted elsewhere under a dirty form draws the `gone` banner and
   keeps the typed text; a ticked item deleted elsewhere leaves the ticks after the next read. A stale tab: the
   old bundle draws its old page until a reload; nothing new is stored. A revert: no stored shape changes (the
   `eqType` field is a runtime preview field, never written; `contentOf` ignores it). A path that can lose data:
   none added; the bulk delete and the editor delete are the existing ones with the same confirms.
3. Consistency. Rules of `FEATURES.md` "Consistency rules" followed: 1 (counters), 3 (delete confirms),
   5 (toasts), 6 (load states), 7 (a heading in every state: the read-only `h1`; the editor's breadcrumb row),
   8 (create button), 9 (the primary first: the head's primary, the tab's first button), 11 (the sheet's
   «Отмена»), 12 (folds), 13 (caps), 14 (RU and EN), 15 (labels: (c) and (d) rewritten), 16 (long names),
   17 (no filter link), 18 (the departure for «Описание»), 20 (focus). Departures named: the lead line kept
   (H1), a sheet for the move (H7), closed card rows (H12), the card forms' «?» kept (Q6-1). Compared with the siblings: the catalog and `/homebrew` share the picker row, the search
   row, `FilterPanel`, «Выбрать» and the bar; `/lists` (batch 8) and `/lists/<uuid>` (9a) follow the same
   bar; the roll page (batch 5) puts «Ещё» on its results line, `/homebrew` on its picker row, the same
   `MoreMenu` and `PinItem`. The editor's button verbs: «Сохранить», «Удалить», the breadcrumb for the way
   back, never «Отмена». Toasts, load wording and the delete confirms do not change.
4. RU/EN parity: the 25 new keys of S1 have both languages with the same facts, ASCII punctuation, «ёлочки»
   in RU only, no new plural form; the 12 deleted keys leave both; `hbOptional` and the field messages read
   the same in both; cases 91 and 92 run in both languages and the goldens hold both. D16 changes the EN
   label only.

## Gate cost

Per `plan.md` section 8: one code batch is 45-60 minutes with its `check:fast`, one CI run and one review
fix cycle. Extra local gates:

| Gate | Minutes |
|---|---|
| the affected vitest files (about 20; the homebrew tests are 6000 lines) | 8-10 |
| `node --test tools/artwork/lib.test.mjs`, both lints, decisions, the detector | 4-5 |
| `build:test` and the four golden shards (about 90 moved files and 14 new) | 12-14 |
| `check:built` and the configured build with `bundle-budget.mjs` | 3-4 |
| the A9 probe | 2 |
| the orchestrator's `polish` and `harden` | 5-10 |
| the screenshot set | about 4 |

Total: 38-49 minutes of extra gates (`plan.md` section 8 says 1 for this batch; the row under-counts). The plan
total in section 8 rises by 37-48. This is the biggest page batch: the owner merged the editor and the pages
(2026-10-29). Browser suites, sweeps and the e2e flows run on CI (owner, "Local gates").

## Writer tests

Facts for the orchestrator's dispatch, not a model choice.

| Test | Answer |
|---|---|
| 1 (a step asks for a choice, or an `Open design question:`) | no: every choice is decided above; Q6-1 has a default and blocks nothing |
| 2 (public contract, route, stored state, product law, migration, hook, configuration) | no for contract, route, state, law and migration; `tools/bundle-budget.mjs` rises under its standing rule |
| 3 (visual judgment: print fitting, a golden re-seed, parity with a design node) | yes: about 90 goldens re-seeded and new sticky-bar, sheet and group layouts that rest on visual judgment; no design node; no print change |

## Split criterion

A different route and filter set (`/homebrew`, `/homebrew/<id>`), as `plan.md` section 7 gives. The editor and the
pages are one batch by the owner's merge (2026-10-29) and by `CLAUDE.md`, "Task and session protocol": they share
`FormField`, `Seg`, `CardForm`, the homebrew test fixtures and seeds, the `_homebrew_*` golden family (a split
would re-seed about 70 goldens twice) and the same CI gate. One split was weighed and rejected: the editor alone
(S9, S10) from the pages (S4 to S8). It would save a review pass of about 20 minutes and cost a second re-seed and
a second CI run (about 25 minutes), with no public-contract or route difference to justify it. If the review of this
batch cannot be held in one pass, the review splits by the "Review order" list, not the batch.

## Plan review

Not required (no trigger fired): no migration or SECURITY DEFINER function; no public contract (`routes.json`,
`CONTRACTS.md`, `llms.txt`, `tests/contracts.js` and `docs/fixtures/` do not change; the homebrew addresses are
untouched); no stored data or `localStorage` key (the move, the delete, the save and the import call the same store
methods with the same arguments; the pin is the existing `app.pinHome`; `eqType` is never written); no write or
sync protocol. A batch review is required after the implementer (trigger: new or changed UI; `tests/app/` changed).
