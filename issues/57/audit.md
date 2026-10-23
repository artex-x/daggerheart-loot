# Audit - TASK 57 (phase 1)

This file records the phase 1 critique of the shipped app: what is wrong,
where, and how bad. Phase 2 decides the systemic themes; phase 3 fixes the
rest in batches.

## Method

- Build: `npm run build:test` on `0b73fd5c` (2026-10-23), the fake cloud.
- Evidence: 74 states from `tests/app/inventory.js`, one per state family,
  at 360, 390, 768, 1180 and 1600 in RU and EN: 740 PNGs and
  `manifest.json` in `C:\Users\Ignat\.dhloot\notes\57\evidence\` (outside
  the checkout). File name: `<golden slug>__<width>__<lang>.png`.
- EN capture: arrive in RU, set up, press EN. A signed-in arrival takes the
  account's language (`STATE.md`), so a seeded EN is overridden.
- Critique: Impeccable critique and audit by two helpers (catalog side
  `C*`, account side `A*`), against `PRODUCT.md` and `DESIGN.md`, plus the
  owner's clarity rule (`context.md`, Constraints).
- Skipped: the surfaces R10 deletes (Lists tab, banner, move and storage
  notices, browser lists, `#/l/`). No Vercel cross-check (owner).
- Not read: 390 and 1600 for most states. Helpers read 360 and 1180 for
  all states, and 390, 768 and 1600 for layout-sensitive screens only.

### Capture artefacts

The capture is a full-page screenshot of a 900 px viewport. A `fixed`
element (toast, dialog backdrop) draws at the viewport edge, and a `sticky`
element draws at its scroll start. So a finding about the position of a
toast, a backdrop, the selection bar or the editor preview needs a live
check. Status `artefact`: the position finding is wrong, the rest of the
row stands. Status `verify`: check in a live browser before a batch takes it.

## Findings

Column P: P0 accessibility blocker or broken flow, P1 high-impact usability
or hierarchy, P2 polish, tone or art. Clarity: `explain` = the surface
needs text to be understood. Scope: `sys` = token, shared component or a
pattern across screens; `loc` = one surface.

### P0

| id | surface | width | lang | evidence | rule | finding and fix | clarity | scope | status |
|---|---|---|---|---|---|---|---|---|---|
| A1 | `#/lists/<uuid>` rows with qty/price | 768 (640-900) | ru | `_lists_..0101_share_as_gm1__768__ru` | WCAG 1.4.10 | Title column shrinks to 20-60 px: one word per line, kind badges draw over titles, rows 250-400 px tall. Stack qty/price and row actions under the body below about 900 px. Add 768 to the layout suite. | - | loc | ok |

### P1

| id | surface | width | lang | evidence | rule | finding and fix | clarity | scope | status |
|---|---|---|---|---|---|---|---|---|---|
| C1 | `#/tables` help panel | 360, 1180 | ru | `_tables_help__360__ru` | clarity | About 10 paragraphs; pushes the table 2000 px down at 360. Replace with counts on group chips and short inline captions. Removing the panel needs the owner's yes. | explain | sys | ok |
| C38 | `#/roll/std` help panel | 360 | ru | `_roll_std_help__360__ru` | clarity | 3 paragraphs and a rarity legend; the names are already on the buttons. Show rarity on result cards, caption the field "Сумма кубиков". | explain | loc | ok |
| C2 | filter panel row labels | 360-1180 | ru, en | `_tables_eq_weapon_panel_open__360__ru` | WCAG 1.4.3, type | «любое» suffix at about 10 px grey explains "nothing picked = any". Use a pre-pressed «Все» chip or a picked count. | explain | sys | ok |
| C3 | filter panel | 360 | ru | `_tables_eq_weapon_panel_open__360__ru` | density | 7 rows, about 570 px; «Источник» wraps 7 lines; round rank chips beside pills. Scroll long rows, one chip shape. | - | loc | ok |
| C4 | filtered toolbar | 360, 768 | ru | `_tables_eq_weapon_filtered__360__ru` | states | Pills, text reset, icon-only link and counter share one row. Label the link the same at all widths, move the counter below at 360. | explain | sys | ok |
| C5 | table toolbar link button | 360 | ru, en | `_tables_eq_weapon__360__ru` | WCAG 2.5.8 | «Ссылка на таблицу» collapses to a bare icon at 360. Keep one label at all widths. | explain | sys | ok |
| C6 | tab strip | 360 | ru, en | `_tables_eq_weapon__360__ru` | navigation | Strip cut at «Допо...»; Таблицы, Поиск off-screen; routes with no lit tab do not scroll it (A37). Edge fade and a visible current or target group. | explain | sys | ok |
| C7 | two chip rows (group, book) | 360, 1180 | ru | `_tables_voa__1180__ru` | hierarchy | Same chip style and gold for both levels; second row unlabelled. Also `#/roll/mwt` (C49) and `#/tables/homebrew` (A25). | explain | sys | ok |
| C9 | row tags | 360, 1180 | ru | `_tables_eq_weapon__1180__ru` | Tag Rule, Seal Rule | Up to three tags; «Уникальное» gold dashed reads as "chosen". Neutral style for unique. Also C50, A26 («Ранг 2» gold pill). | - | sys | ok |
| C10 | rows at 360 | 360 | ru, en | `_tables_eq_weapon__360__ru` | density | Four text levels plus a checkbox column per row. Hide tags that repeat the active filter. | - | sys | ok |
| C12 | selection bar | 360, 1180 | ru | `_tables_a_row_ticked__1180__ru` | WCAG 2.4.11 | Sticky bar covers the row under it; «Скопировать» does not say what. Reserve space, name the action. | explain | sys | verify |
| C13 | `#/search` type chips | 360, 1180 | ru | `_search__360__ru` | Seal Rule, WCAG 1.4.1 | All chips gold on first load: on or off cannot be told. Neutral default, gold only for a narrowing choice. | explain | sys | ok |
| C14 | `#/search` hint | 360, 1180 | ru | `_search__360__ru` | clarity | Sentence teaches query syntax. Move into the placeholder or example chips. | explain | loc | ok |
| C17 | item page | 1180 | ru | `_i_ci1__1180__ru` | layout | 520 px card pinned left, about 600 px empty. Also A31 (`#/account`). Use the width or centre. | - | sys | ok |
| C18 | item card actions | 360, 1180 | ru, en | `_i_ci1__360__ru` | Seal Rule | Two gold primaries (share, add to list); share, image and copy lose labels at 360; two more icons by the title. One primary, same labels at all widths. Also C40, C45, A23. | explain | sys | ok |
| C19 | «Сохранить себе» + note | 360, 1180 | ru, en | `_i_ci1__360__ru` | clarity | The note exists because the label does not say the result. Rename the button and drop the note. Also A23 (`#/h`). | explain | loc | ok |
| C23 | `#/roll/alt` dice and crit box | 360, 768 | ru | `_roll_alt_crit__360__ru` | hierarchy, WCAG 1.4.1 | Dice identity by colour only; crit box 190 px with a rule paragraph and 3 outline buttons; Hope/Fear tags compete with kind tags (C43). | explain | loc | ok |
| C24 | `#/roll/alt` roll input | 360, 768 | ru | `_roll_alt_crit__768__ru` | clarity | Two number fields plus «Бросить кости»: type or roll is unclear; rank sub-lines in every chip (C41). | explain | loc | ok |
| C25 | `#/roll/std` roll panel | 360-1600 | ru, en | `_roll_std__1600__ru` | Seal Rule | Five gold roll buttons plus gold source/type chips and a gold house icon; ragged wrap at 360 (C36, P10). One gold primary. | explain | sys | ok |
| C37 | house and «?» icons by H1 | 360-1600 | ru, en | `_roll_std__360__ru` | WCAG 4.1.2 | House means "open the app here", told only by a toast after the click; gold on one page, grey on another. Also A27 (`#/homebrew`). | explain | sys | ok |
| C27 | header account control | 360 | ru, en | `_account__360__ru` | WCAG 2.5.8 | Signed out: a bare person glyph at 360; signed in: a letter circle with no menu cue (C52, A35, A36). | explain | sys | ok |
| C33 | stat line type | 360, 1180 | ru | `_tables_eq_weapon__1180__ru` | WCAG 1.4.4, type | Stat line 10.5-11 px mono grey; feature text 12.5 italic grey. Raise data text to 12 px. Also A39. | - | sys | ok |
| C39 | roll result card | 360 | ru | `_roll_std__360__ru` | layout | Text column about 140 px: RU titles break mid-word. Stack the art on top at 360. | - | sys | ok |
| C44 | item dialog | 360 | ru | `_tables_a_row_opened__360__ru` | WCAG 2.5.8 | Full-screen content with no sticky actions; close button on the art. Bottom sheet with a sticky action bar. | - | sys | verify |
| C48 | supplement chips | 360 | ru | `_roll_mwt__360__ru` | navigation | 7 chips wrap 4 lines; chip text differs by width and from the H1. | - | sys | ok |
| C49 | `#/roll/mwt` realm row | 360, 1180 | ru | `_roll_mwt__1180__ru` | hierarchy | Three gold elements; «МИР» is the only cue of a sub-choice. | explain | loc | ok |
| C53 | `#/tables` header block | 360-1600 | ru, en | `_tables__360__ru` | clarity, density | About 430 px before the first row; a sentence says what the page does. Delete it. | explain | loc | ok |
| C54 | `#/tables` rows, wide | 1180, 1600 | ru, en | `_tables__1600__ru` | layout | Tags 700 px from the name; 90+ characters per line. Tags after the name, cap at 70ch. | - | sys | ok |
| C55 | missing art | all | ru, en | `_tables_grid__1180__ru` | assets | About 25 of 60 Core items and most of VoA show black squares; empty black tiles in the grid. Placeholder with a kind glyph. Also C11, A10. | - | sys | ok |
| C56 | grid view at 360 | 360 | ru, en | `_tables_grid__360__ru` | density | One column of full-width art; unlabelled coloured dot (also A25). Two columns, label or drop the dot. | explain | sys | ok |
| C57 | view and print notes | 360, 1180 | ru | `_tables_grid__360__ru` | clarity | «Только до перезагрузки...» does not say what is temporary. Also C31, A account note. Decide where the view choice lives. | explain | sys | ok |
| C59 | search match | 360 | ru | `_tables_searched__360__ru` | WCAG 1.4.1 | No highlight of the matched text. | - | loc | ok |
| C61 | add-to-list menu | 360, 1180 | ru | `_tables_a_row_opened_list_menu__360__ru` | WCAG 1.4.1 | Heading «ЛЕЖИТ В СПИСКАХ» over all lists; membership by gold fill only; opens over content (C62). Check marks, heading «Списки». | explain | loc | ok |
| A2 | list editor rows | 360, 1180 | ru | `_lists_..0101_as_gm1__360__ru` | WCAG 2.5.8 | Three 20 px icon buttons per row (note, eye, x); two full note editors per opened row. 24 px targets, one note area with a switch. | explain | sys | ok |
| A3 | list header and share panel | 360, 1180 | ru | `_lists_..0101_share_as_gm1__360__ru` | hierarchy | 8+ controls before the first item; «Удалить» beside «Печать»; share rules in a 5-line paragraph. Group export actions, move delete to an overflow. | explain | loc | ok |
| A4 | share links | 360 | ru | `_lists_..0101_share_as_gm1__360__ru` | Seal Rule | Two gold «Скопировать» in one panel; link text 10-11 px mono. | - | loc | ok |
| A5 | note labels | 360, 1180 | ru | `_lists_..0101_as_gm1__360__ru` | type, WCAG 1.4.3 | Labels are sentences in 10-11 px caps plus «?». Short labels; the border style carries the difference. | explain | loc | ok |
| A6 | homebrew editor form | 360 | ru | `_homebrew_new_as_gm1__360__ru` | form design | 3000+ px column of 11 pill groups; the preview is below the form at 360. A preview button at the bottom. | - | loc | ok |
| A7 | editor validation | 360, 1180 | ru | `_homebrew_new_problems_as_gm1__360__ru` | WCAG 3.3.1, 3.3.3 | 7 repeats of the generic «Выберите значение.». Field-specific messages or summary only. | - | loc | ok |
| A8 | required fields | 360, 1180 | ru | `_homebrew_new_as_gm1__360__ru` | WCAG 3.3.2 | Required set changes with «Вид» and nothing says so; a sentence explains the star. | explain | loc | ok |
| A9 | crop dialog | 360, 1180 | ru | `_homebrew_new_crop_dialog_as_gm1__360__ru` | WCAG 2.5.7 | No handles, 14 px slider thumb, a two-line keyboard manual. The top-cut position at 360 needs a live check. | explain | loc | verify |
| A10 | homebrew rows without art | 360 | ru | `_homebrew_as_gm3__360__ru` | assets | The "?" pedestal art repeats on every picture-less row. Same fix as C55. | - | sys | ok |
| A12 | editor print preview toggles | 360, 1180 | ru | `_homebrew_hb_emberaxe..._print_preview_as_gm1__1180__ru` | density | Three segment groups wrap two rows in the narrow column. | - | loc | ok |
| A13 | import panels | 360, 1180 | ru | `_homebrew_import_preview_as_gm1__360__ru` | hierarchy, clarity | 9 text blocks around one decision; schema links in the flow; a sentence as a segment label. | explain | loc | ok |
| A14 | lists import preview | 360, 1180 | ru | `_lists_import_preview_as_gm1__360__ru` | density | Raw ids (`zzz1`) and repeated lines. One summary, details on request. | - | loc | ok |
| A15 | limit error toast | 360, 1180 | ru | `_lists_list_limit_as_gm2__360__ru` | WCAG 1.4.3 | Fill looks lighter than Alarm Red: white text may fail 4.5:1. Position is a capture artefact. | - | loc | verify |
| A16 | list cards | 360, 1180 | ru | `_lists_lists_selected_as_gm1__360__ru` | Seal Rule | A red «Удалить» on every card; selection in the same gold as the bar. | - | sys | ok |
| A18 | `#/lists/nope` | all | ru, en | `_lists_nope__360__ru` | empty states | Cause is a guess; button «Списки» repeats the tab. A next step and a sign-in. | explain | loc | ok |
| A19 | `#/s/<token>` | 360, 1180 | ru, en | `_s_player_token_1__360__ru` | hierarchy | Bare count «10»; checkboxes on a read-only list; price block squeezes the title at 360. | explain | loc | ok |
| A20 | `#/s` filters | 360, 1180 | ru | `_s_player_token_1_filters_open__360__ru` | density | 8 filter groups for 10 rows; «ЛИНЕЙКА» unclear. Hide filters for short lists. | explain | loc | ok |
| A22 | `#/s` GM view | 360, 1180 | ru | `_s_gm_token_1_as_gm2__360__ru` | consistency | GM-only notes look like player notes except an icon; the editor uses a dashed border. | - | loc | ok |
| A25 | `#/tables/homebrew` | 360, 1180 | ru | `_tables_homebrew_as_gm1__1180__ru` | consistency | «Хоумбрю» is a group and a source; two gold rows. | explain | loc | ok |
| A27 | `#/homebrew` title icons | 360, 1180 | ru | `_homebrew_as_gm3__360__ru` | WCAG 2.5.8 | House and «?» chips, 22-26 px, unlabelled. Same as C37. | explain | sys | ok |
| A28 | homebrew sub-tabs | 360, 1180 | ru | `_homebrew_sources_as_gm1__360__ru` | navigation | Pills that act as tabs; wrap at 360; import sits above all four. | explain | loc | ok |
| A29 | source and set rows | 360 | ru | `_homebrew_sources_as_gm1__360__ru` | WCAG 2.5.8 | 4 buttons wrap two rows; limits as bare ratios. | - | loc | ok |
| A30 | edit conflict | 360, 1180 | ru | `_homebrew_hb_emberaxe..._conflict_as_gm1__360__ru` | WCAG 3.3.4 | The primary overwrites the other device's changes. | - | loc | ok |
| A32 | account sign-in cards | 360, 1180 | ru | `_account_as_gm1__360__ru` | consistency | "Signed in as" repeats "Sign-in methods"; two equal «Отключить». | - | loc | ok |
| A33 | account «Ваши данные» | 360, 1180 | ru | `_account_as_gm1__360__ru` | clarity | A 7-line manual on the ZIP. | explain | loc | ok |
| A34 | account delete confirm | 360, 1180 | ru | `_account_delete_confirmation_as_gm1__360__ru` | WCAG 3.3.4 | No summary of what is deleted; danger confirm as weak as «Отмена». | - | loc | ok |
| A35 | account menu | 360, 1180 | ru | `_roll_std_account_menu_as_gm1__360__ru` | navigation | «Мои списки» in the menu vs the «Списки» tab: one page, two names. R10 removes the tab: phase 2 decides the menu. | - | sys | ok |
| A40 | always-on row checkboxes | 360 | ru | `_homebrew_as_gm3__360__ru` | density | A 40 px checkbox column on every row. A selection mode. Also A19. | - | sys | ok |

### P2

| id | surface | width | lang | evidence | rule | finding and fix | clarity | scope | status |
|---|---|---|---|---|---|---|---|---|---|
| C8 | group chips «Core», «Hope & Fear» | 360, 1180 | ru | `_tables_eq_weapon__1180__ru` | tone | Latin book names beside Russian chips. Keep, record the rule (P13). | - | loc | ok |
| C11 | missing art in rows | all | ru | `_tables_voa__1180__ru` | assets | Merged into C55. | - | sys | ok |
| C15 | search roll number | 360 | ru | `_search_searched__360__ru` | clarity | Number badge reads as a count. «№ 89» or drop it. | explain | loc | ok |
| C16 | empty results | 360, 1180 | ru | `_search_nothing_found__360__ru` | empty states | No cause, no one-step reset (also C60). | - | loc | ok |
| C20 | item title twice | 360 | ru | `_i_ci1__360__ru` | hierarchy | H1 and card title repeat. Also P4. | - | loc | ok |
| C21 | art framing | 360 | ru | `_i_mw9_ref_open__360__ru` | assets | Dark art dissolves into the card; no defect, no inner frame. | - | sys | ok |
| C22 | rules reference box | 360, 1180 | ru | `_i_mw9_ref_open__360__ru` | clarity | Role of the box not named; looks like a button (C46). | explain | loc | ok |
| C26 | «ИЛИ» pills | 1600 | ru | `_roll_std__1600__ru` | clarity | Relation of result cards unclear. «Выберите одно». | explain | loc | ok |
| C28 | footer links | all | ru | `_search__360__ru` | Seal Rule | Gold links outside the chosen-state rule (C64). | - | sys | ok |
| C29 | print preview header | 360, 1180 | ru, en | `_p_set_twocards_as_gm2__360__ru` | clarity | Three control groups wrap 3 rows. The A4/orientation/margin sentence repeats what `@page` already sets (`Shell.svelte`); keep at most a background-graphics hint. | explain | loc | ok |
| C30 | print sheet at 360 | 360 | ru, en | `_p_set_twocards_as_gm2__360__ru` | layout | Sheet scaled to 313 px: cards unreadable. Print layouts are product law; only the screen preview may change. | - | loc | ok |
| C31 | compact-sheet note | 1180 | ru | `_p_set_twocards_compact_as_gm2__1180__ru` | clarity | Merged into C57. | explain | loc | ok |
| C32 | error pages | 360, 1180 | ru | `_i_nope__360__ru` | empty states | Bare pages; gold «На главную». | - | loc | ok |
| C34 | toasts over actions | 360 | ru | `_i_ci1_toast__360__ru` | WCAG 4.1.3 | A bottom toast covers the action row (C47: the pin toast; show the pinned state on the icon). | explain | sys | verify |
| C35 | item list menu | 360 | ru | `_i_ci1_list_menu_as_gm1__360__ru` | states | Merged into C61. | explain | loc | ok |
| C58 | grid cards | 1180 | ru | `_tables_grid__1180__ru` | hierarchy | Number badge on light art; no kind information. | - | loc | ok |
| C63 | dialog backdrop | 360, 1180 | ru | `_tables_a_row_opened__360__ru` | - | Backdrop ends mid-page: `fixed` in a full-page capture. | - | - | artefact |
| A11 | editor preview | 1180 | ru | `_homebrew_hb_emberaxe..._as_gm1__1180__ru` | layout | The preview is already `sticky` (`HomebrewEditor.svelte`). | - | - | artefact |
| A21 | `#/s` unknown token title | 360 | ru | `_s_unknown_token__360__ru` | layout | Title reaches the gutter. | - | loc | ok |
| A24 | `(НВ)` relation suffix | 360 | ru | `_h_..0662__360__ru` | clarity | Jargon. Use the homebrew badge. | explain | loc | ok |
| A31 | account layout | 1180 | ru | `_account_as_gm1__1180__ru` | layout | Narrow column with empty right side (C17); compact checkbox reads as a segment. | - | loc | ok |
| A38 | empty states and art | all | ru | `_homebrew_new_as_gm1__360__ru` | tone | The pedestal art is the only asset with character; empty states have no voice. | - | loc | ok |
| A39 | small caps metadata | 360, 1180 | ru | `_account_as_gm1__1180__ru` | type | Caps at 10-11.5 px carry sentences. Caps for section labels only. | - | sys | ok |
| A41 | «Свой предмет» row | 360, 1180 | ru | `_lists_..0101_as_gm1__1180__ru` | clarity | Explainer for a hidden state. «Добавить свой предмет». | explain | loc | ok |
| A42 | «Бросок по списку» | 360, 1180 | ru | `_lists_..0101_as_gm1__360__ru` | states | Looks like a heading, not a button. | explain | loc | ok |

## Clarity inventory

Each row is a text that exists to explain the UI, or a control that does
not say what it does. The fix removes the need for the text. A removed help
panel or feature needs the owner's yes.

| surface | text or control | UI change that removes the need |
|---|---|---|
| `#/tables` | «?» help panel (10 paragraphs) | Counts on group chips, one-line captions |
| `#/roll/std` | «?» help panel and rarity legend | Rarity on result cards, field caption «Сумма кубиков» |
| `#/homebrew` | «?» panel (5 paragraphs) and the subtitle sentence | Tabs with counts; a one-line empty state per tab; import details inside the import panel |
| `#/tables`, `#/s` | «любое» on filter rows | A pre-pressed «Все» chip |
| `#/tables`, `#/s` | «ЛИНЕЙКА» row name | A name that says upgrade chains or uniques |
| `#/tables` | H1 description sentence | Delete |
| `#/tables`, `#/p` | «Только до перезагрузки...» notes | Decide where the view and print choice live (C57) |
| `#/search` | query syntax hint | Placeholder or example chips |
| `#/roll/*`, `#/homebrew` | house icon by H1 | Filled/outline state with a visible label |
| `#/roll/alt` | crit rule paragraph; two fields plus «Бросить кости» | Selectable result cards; separate "roll" and "enter" |
| `#/roll/std` | «ИЛИ» pills | Group heading |
| `#/roll/mwt` | «МИР» row | Tab style or a row label |
| item card, dialog, `#/h` | icon-only share, image, copy, copy name, copy link | The same text labels at every width |
| item card, `#/h` | «Сохранить себе» and its note | A label that says the result |
| `#/h` signed out | «Войдите, и копия...» box | «Войти и сохранить» |
| add-to-list menu | «ЛЕЖИТ В СПИСКАХ» | Check marks, heading «Списки» |
| rules reference box | role not named | A verb or plain text |
| `#/p` | A4, orientation and margin sentence | Delete; `@page` sets them |
| header | account glyph or letter circle | Visible «Войти»; a menu cue |
| tab strip at 360 | hidden tabs | Edge fade, scroll to the current group |
| list editor | note labels as sentences with «?» | Short labels; border style |
| list editor | eye and note icons | Labelled toggle; 24 px targets |
| list editor | price display toggle with «?» | Show the effect on a row; label «Цены:» |
| list editor | share panel paragraph | Two labelled link rows |
| list editor | «Свой предмет» explainer | «Добавить свой предмет» |
| list editor | «Бросок по списку» bar | A real button |
| list requests | «×9 из 5», «(без цен: 1)» | "было -> стало" columns |
| imports | segment label sentence, schema paragraph, raw ids | «Если уже есть:»; a «Формат файла» link; a plain summary |
| editor | «?» by Источник, Описание, second stat set | Option text; toolbar; show only where it applies |
| editor | required-field sentence | Mark optional fields |
| editor | «Язык текста: RU - пусто» | Label «Текст на языке», a fill dot |
| editor | picture constraints paragraph | Errors only when broken |
| editor | «физ/маг», «Одноручное/двуручное» | Full words |
| editor | "item is in 1 list" sentence | A «В списках: 1» link |
| crop dialog | drag and keys manual | Handles and a grid; keep the text for AT only |
| `#/s` | bare count, read-only checkboxes | «10 из 10»; a selection mode |
| `#/tables/homebrew`, grid | coloured dot | Label or remove |
| account | settings scope sentence, notify question, ZIP manual, «Выйти везде» note | Labels that say it; one line for the ZIP |
| `#/lists/nope` | «Возможно, он удалён...» | A next step and a sign-in |

## RU/EN parity

| id | surface | width | difference | fix |
|---|---|---|---|---|
| P1 | `#/tables/eq_weapon` rows | 360 | EN stat line and «PRIMARY WEAPON» tag are wider: rows about 20 px taller | Drop "Tier 1" under a "TIER 1" heading |
| P4 | `#/i/ci1` title | 360 | RU title wraps twice (H1 and card) | C20 |
| P5 | item meta line | all | RU «номер 1» vs EN "roll 1": different terms | One term in both |
| P6 | «Сохранить себе» | all | EN names "my items", RU names nothing | One label that says the destination in both |
| P7 | spelling | all | British "Colour", "licence" | Choose one English spelling app-wide |
| P9 | tab strip | 360 | EN tabs about 30 px wider; cut at the third tab | C6 |
| P10 | roll buttons | 360 | RU wraps 1+1+1+2, EN 2+2+1 | Fixed button width |
| P11 | result titles | 360 | RU breaks mid-word, EN at spaces | C39 |
| P13 | book names | all | «Core», «Hope & Fear» stay Latin in RU | Record the rule in `DESIGN.md` |
| P14 | `#/tables` rows | 360 | EN descriptions truncate earlier; "Upgrades to" on its own line | Row height by line count |
| P15 | grid name order | 360, 1180 | RU name then EN name in both languages? Not checked in EN | Check in a batch |
| D2 | `#/s` user notes | 360 | Owner notes stay RU in EN (user content) | Acceptable |
| D5 | homebrew rows | 360 | EN-only items in the RU list, no language badge | An "EN" badge when RU text is missing |
| D6 | lists import | 360, 1180 | Raw ids in both | A14 |
| D7 | account print segment | 360 | "Colour / Black and white" nearly touches the card edge | Let the segment wrap |
| D8 | account delete confirm | 360 | Field holds «удалить» under an EN prompt: the capture typed it in RU, then switched. Artefact; check live which word EN accepts after a language switch | verify |
| D9 | account menu | 360 | Pressing EN closed the menu: EN labels not checked | Check in batch |
| D10 | tab strip | 360 | EN nearly fits, so no cut and no scroll cue, but Tables, Lists, Search stay off-screen | C6 |
| D11 | wordmark «Лут» in EN | all | `DESIGN.md`: never translated; an EN reader cannot read it | Owner: EN shows «Loot» |
| D14 | editor preview chrome | 360 | Preview badges, stat labels and the draft title follow the text language, not the UI language: RU chrome in an EN UI. May be by design (the card as printed); confirm | verify |
| D15 | editor messages | 360 | EN damage message is 3 lines; «физ/маг» and "phy/mag" are abbreviations in both | Shorter message; full words |
| D16 | import label | 360 | EN "already hold" is a literal of «уже есть» | "already have" |
| D20 | new-list placeholder | 360 | Clipped in both languages | A shorter example |

## Systemic themes for phase 2

1. **Gold is spent on things nobody chose.** Roll buttons, default-on
   chips, two primaries per panel, unique tags, the house icon, footer
   links, selection fills. "Chosen" no longer stands out. Decide the gold
   budget and the neutral default. (C9, C13, C18, C25, C28, C45, C49, A4,
   A16, A26)
2. **Help text repairs controls.** Three help panels, about twenty
   explaining sentences, «?» chips. Decide which panels go and what replaces
   them. Owner's yes per removed panel. (C1, C38, A27 panel, clarity table)
3. **Labels change with the width.** Icon-only at 360, labelled at 1180:
   share, image, copy, table link, account. Decide one action vocabulary and
   an overflow pattern. (C5, C18, C27, C40, A23, A36)
4. **Navigation at 360 and after R10.** Clipped tab strip, no current tab on
   account routes, account control with no cue, «Списки»/«Мои списки»,
   pills that act as tabs. Design the header and nav for the post-R10 shape.
   (C6, C7, C27, C48, A28, A35, A37)
5. **Type floor and caps.** Data at 10-11 px mono, sentences in small caps.
   Decide the floor (12 px data) and where caps are allowed. (C2, C33, A5,
   A39)
6. **Density on phones and space on desktop.** Four-level rows, always-on
   checkboxes, a 570 px filter panel, a narrow result card; on desktop a
   520 px column and 700 px tag gaps. Decide the row anatomy per width and a
   selection mode. (C3, C10, C17, C39, C54, C56, A1, A40)
7. **Missing art.** About a third of the first 60 Core items, most of VoA
   and all picture-less homebrew rows show black squares or the same
   pedestal. Decide one placeholder. (C11, C55, A10, A38)
8. **State and empty-state consistency.** Empty and error pages give no
   cause or next step; temporary choices are explained in notes; a dialog
   with no sticky actions. (C16, C32, C44, C57, A18)

## Owner triage

Owner, 2026-10-23 (`context.md`, "Decisions already settled"): all eight
themes go to phase 2; help panels are decided per batch mock; every other
row is phase 3 input; D11 resolved: EN shows «Loot». No row rejected yet.
