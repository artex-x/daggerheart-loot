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

## Re-check against main (2026-10-29)

Base: `claude/57` at `9112c4ed` (the merge of `main` `c8243ba6`). Main gained
R10, Cloudflare Pages, path addresses with `/en/`, the request toasts and the
(N) title, the Items-tab filter address, the tables nav landmark and the
210 px strip cap, bold-italic set names, deploy-replay-ci and
path-urls-followups. Method: code and spec reads plus `impeccable detect
--json app/src`; no live build. The `verify` rows stay `verify`: each batch
checks its rows in a live browser first. Addresses in the rows above keep
their `#/` form as evidence names; the app now serves them as paths (`#/i/ci1`
is `/i/ci1`, EN `/en/i/ci1`).

Fixed: none of the rows above. (`DEBT.md` D112 and D113, which the plan
had inherited, were fixed on `main` by `f74eae09`.)

Changed, still open:

| id | what changed | what stays open |
|---|---|---|
| C6, P9, D10 | R10: five tabs, not six (`TabBar.svelte`) | under 640 px the strip still scrolls; «Таблицы» and «Поиск» stay off-screen at 360 |
| A35 | R10 removed the Lists tab: «Мои списки» has no rival tab name | the menu is the only path to `/lists`, and no control is lit there (A37) |
| A18 | R10 removed browser lists | `listNotFoundSub` still says «...или открыт в другом браузере»: the cause is now false |
| C61, C35 | `AddToList.svelte` rewritten; signed out it shows only the new-list action | the «Лежит в списках» heading and the gold-only membership stay |
| A1, A2, A3, A5, A41, A42 | `ListPage.svelte` rewritten for account lists only (-752 lines) | no stacking rule below 900 px; the row icons, the note labels, «Свой предмет» and «Бросок по списку» stay |
| A19, A20, A22 | `SharedListPage.svelte` rewritten (requests, the sender's sent line) | the bare count, the read-only ticks, the eight filter groups and the GM note style stay |
| C12 | the selection bar gained the sender's sent line | the bar still covers the row under it (`verify`) |
| C34, A15 | the toast gained the `go` action and the new-request toast | the toast position and the error fill (`verify`); `DEBT.md` D121 is the toast's focus defect |
| C7, A25 | the tables chip panel is a navigation landmark | two chip rows in one style and gold |
| A28 | the Items tab keeps its filter in the address | pills that act as tabs |

Open, unchanged: C1, C2, C3, C4, C5, C8, C9, C10, C11, C13, C14, C15, C16,
C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31,
C32, C33, C36, C37, C38, C39, C40, C41, C43, C44, C45, C46, C47, C48, C49,
C50, C52, C53, C54, C55, C56, C57, C58, C59, C60, C62, C64, A4, A6, A7, A8,
A9, A10, A12, A13, A14, A16, A21, A23, A24, A26, A27, A29, A30, A31, A32,
A33, A34, A36, A37, A38, A39, A40, P1, P4, P5, P6, P7, P10, P11, P13, P14,
P15, D2, D5, D6, D7, D8, D9, D11, D14, D15, D16, D20. Artefacts, closed by
their batch's live check: C63, A11.

New in the re-check:

| id | surface | finding | batch |
|---|---|---|---|
| N1 | `HitNote.svelte` (list page and `/s/`) | detector warning `side-tab`: `border-left: 2px solid var(--gold)`; no ignore covers it | 9 |
| N2 | `orGrid.test.ts` | detector warning `broken-image`: a test `<img>` with no `src` | 5 |
| N3 | `app/src` | 128 detector advisories (`design-system-font-size`, `-color`, `-radius`): literals that DESIGN.md does not list; 33 of them in `PrintCard.svelte` | each batch in its files; 10 the rest |
| N4 | `TabBar.svelte` | the comment says "six supplement roll sections"; `nav.ts` has seven | 2 |
| N5 | share cards `og/_share*.jpg` | Inter, the old violet and blue washes, a gold «DAGGERHEART»; EN subtitle "armour" | 1 |

## Print audit (2026-10-29)

Owner, 2026-10-29 (`context.md`, "Print review" and "Print feel"): both
sheets, colour and black-and-white, RU and EN, long text, how often the fit
ladder shrinks text, the smallest type, and legibility at print size, judged
against the feel of the Daggerheart cards.

### Method

- Build: `npm run build:test` on `dae889dc` (app code as `main` `c8243ba6`);
  the fake cloud, signed in as `gm4`.
- Real print output: Chrome's PDF of `/p/<set>` under print media
  (`page.pdf`, `printBackground`, the CSS page size), first sheet, rasterised
  at 300 dpi. Sets: nine cards (`ci1`, `cc7`, `voa2_a3`, `q1`, `w7`, `f23`,
  `f33`, `voa4_t2b`, the no-picture homebrew `uuid(461)`) and sixteen (those
  nine plus `cm26`, `voa4_a3`, `q313`, `cc1`, `di11`, `voa2_a1`, the long-text
  homebrew `uuid(516)`): short and long text, weapons (physical, magic, two
  strips, artifact), armour, loot, consumables, a long name, no picture.
- The fit across the catalog: all 1459 records plus four `gm4` homebrew items,
  in sets of 180, RU and EN, each of the four layouts (colour or
  black-and-white, standard or compact). Per card: the rules-text size, the
  padding rung, the art height, the clip report, the name lines and the
  smallest rendered text. Card widths 236 px (62.4 mm inside the cut border)
  and 164 px (43.4 mm); a size in pt is the CSS px size times 0.75.
- Face: CDP `CSS.getPlatformFontsForNode` on `.pc-text` reports Segoe UI on
  this host (Inter is not installed; `--ui` starts with the local name Inter).
- Trials, injected into the built page (no app code changed): the print card
  in Source Sans Pro (the stand-in faces of
  `C:\Users\Ignat\.dhloot\notes\57\fonts\`, no italic file, so italic is
  synthesised); the colour rules text at 4.0cqw and at 4.6cqw. A trial size
  sets the stylesheet size; a card that does not fit at it falls to the
  existing ladder from 3.5cqw, so the trial overstates the shrink of those
  cards.
- `/p/` page: the top of the first sheet at 360x640 and 1180x720, RU and EN.
- Detector: `impeccable detect --json --no-inline-ignores` over
  `PrintCard.svelte`, `PrintPage.svelte` and `card-vectors.css`.
- Reference (owner: style only; nothing is copied into the repository or a
  mock): the Daggerheart Core Set PDF, PDF page 27 (printed page 26, "Reading
  Domain Cards", the one full card figure in the book) for the anatomy, the
  type sizes and the proportion of art to text, and PDF page 330 (printed page
  329, the domain card reference) for the text register. A crop of the page 27
  card is the only kept copy, outside the checkout. Measured on the crop, in
  card-width units: the art is about 49% of the card height; a type banner
  sits centred on the lower edge of the art; the name is centred, in heavy
  capitals of about 9.7 pt; the feature text is about 7 pt at about 1.2
  leading, left aligned, with side margins of about 4.3 mm; the credit line
  is about 4.5 pt italic.
- Figma: the nodes `714-42387` and `3773-90792` were not opened (the Figma
  connector needs authorisation through `/mcp`). The comparison uses
  `PrintCard.svelte`, which `FEATURES.md` "Print" records as the port of the
  nodes with its named departures.

Evidence: `C:\Users\Ignat\.dhloot\notes\57\print-evidence\` (outside the
checkout): `print-<std9|compact16>-<colour|bw>-<ru|en>.pdf` and its
`__300dpi.png` (today), `trial-ssp-print-*` (the Source Sans Pro trial),
`crop-*__300dpi.png` (single cards at real size), `fit-today.json`,
`fit-trial-source-sans.json`, `fit-trial-colour-4.0cqw.json`,
`fit-trial-colour-4.6cqw.json`, `p-page-<w>x<h>-<lang>.png`,
`detect-print.json`, `reference/core-p027-card-027.png`, and the scripts (a
copy in `issues/57/mocks/P/tools/`).

### Fit ladder across the catalog (today, Segoe UI)

| Layout | Rules text at the default | Shrunk below it | Padding rung | At the 2.6cqw floor | Clipped | Rules text (pt) | Art share of the card height |
|---|---|---|---|---|---|---|---|
| colour, 63x88, RU | 1458 of 1463 | 5 | 1 | 1 | 1 | 6.2 (catalog min 5.8) | p10 52%, median 66%, p90 75%; 3 cards hide it |
| colour, 63x88, EN | 1462 | 1 | 1 | 1 | 1 | 6.2 | p10 57%, median 69%, p90 79% |
| colour, 44x63, RU | 1458 | 5 | 1 | 1 | 1 | 4.3 (catalog min 4.07) | median 64% |
| colour, 44x63, EN | 1462 | 1 | 1 | 1 | 1 | 4.3 | median 68% |
| black-and-white, 63x88 | grows on 1462; most reach the 5cqw cap | 1 | 1 | 1 | 1 | 8.9 at the cap; the longest 6.4-6.7 | no art block |
| black-and-white, 44x63 | grows on 1462 | 1 | 1 | 1 | 1 | 6.2 at the cap; the longest 4.4-4.7 | no art block |

The one card that reaches the padding rung, the floor and the clip in every
layout is the `uuid(516)` fixture, which is built to clip. In the catalog the
ladder almost never runs: colour text shrinks on 5 RU cards (0.3%) and 1 EN
card. The fit is not the problem; the default sizes are. Names on three lines:
11 RU cards, 0 EN.

Smallest rendered text over the catalog: the tier word «Ранг» / "Tier" at
4.0 pt on both sheets; the strip labels at their 4.5 pt floor («Хват» /
"Burden"); the EN `DAMAGE` beside a modifier at 3.2 pt on the compact sheet
(the named shortfall of `FEATURES.md` "Print"); the compact colour rules text
at 4.3 pt on every card.

Trials (same method):

| Trial | Shrunk below the trial size | Rules text (pt), 63x88 / 44x63 | Art median (p10), colour RU | Names on three lines (RU) |
|---|---|---|---|---|
| today, Segoe UI, 3.5cqw | RU 5, EN 1 | 6.2 / 4.3 | 66% (52%) | 11 |
| Source Sans Pro stand-in, 3.5cqw | RU 3, EN 1 | 6.2 / 4.3 | 68% (54%) | 4 |
| colour 4.0cqw, Segoe UI | RU 18, EN 6 | 7.1 / 4.9 | 64% (48%) | 11 |
| colour 4.6cqw, Segoe UI | RU 46, EN 22 | 8.1 / 5.7 | 60% (40%) | 11 |

### Findings

The columns are those of "Findings" above; "width" is the sheet. Clarity:
`explain` = the card or page needs text or a legend to be read.

| id | surface | width | lang | evidence | rule | finding and fix | clarity | scope | status |
|---|---|---|---|---|---|---|---|---|---|
| PR1 | colour rules text, compact sheet | 44x63 | ru, en | `crop-compact16-colour-en-longtext-weapon__300dpi.png`, `fit-today.json` | legibility; reference about 7 pt | P1. Every compact colour card prints its rules text at 4.3 pt (the longest at 4.0), an x-height under 0.8 mm: hard to read at the table, where the players read the cards (owner, "Devices during play"). Raise the compact rules-text base to 4.6cqw (5.7 pt): 44 RU and 21 EN cards then take the ladder, and the art median falls from 64% to 58%. | - | sys | ok |
| PR2 | colour rules text, standard sheet | 63x88 | ru, en | `crop-std9-colour-ru-weapon__300dpi.png`, `fit-trial-colour-4.0cqw.json` | reference | P1. 6.2 pt on 1458 of 1459 cards while the art takes a median 66% of the card (the reference: about 7 pt and 49%). Raise the base to 4.0cqw (7.1 pt, the reference size): 18 RU and 6 EN cards take the ladder; the art median falls to 64%. One size on every card keeps the even texture of a deck. | - | sys | ok |
| PR3 | print face | both | ru, en | the CDP font report, `trial-ssp-print-*` | DESIGN.md "Overview" ("measure identically on every machine") | P1. The card is set in the reader's installed `--ui` face: Inter where it is installed, else SF, Segoe UI or Roboto, so the line breaks, the fit and the clip count differ by machine, and the `FEATURES.md` shortfalls hold for Segoe UI only. Print in the self-hosted UI face (Source Sans 3, batch 1) and fit again when the face has loaded. The stand-in trial: fewer shrinks (RU 3 for 5), fewer three-line names (4 for 11), art median +2 points. | - | sys | ok |
| PR4 | `/p/` page | 360, 1180 | ru, en | `p-page-360x640-ru.png`, `p-page-1180x720-en.png` | First-Screen Rule | P1. The sheet starts at 529 px at 360x640 (limit 256) and at 350 px at 1180x720 (limit 288); the bar is 373 px tall at 360 (three control rows, the lead, the A4 sentence); at 360 the cards draw 94 px wide and cannot be read (C29, C30). | explain | loc | ok |
| PR5 | small labels | both | ru, en | `fit-today.json` (`minWhat`) | `DECISIONS.md`, "Print card small text keeps the ribbon and gets one paper floor in every view" | P2. The tier word prints at 4.0 pt, under the 4.5 pt label floor of every other label. Give it the label floor; re-measure the named compact shortfalls in the new face. | - | sys | ok |
| PR6 | list markers | 63x88 | ru | `crop-std9-colour-ru-longtext__300dpi.png` | hierarchy | P2. The default disc at 6.2 pt prints as a speck, so a five-item result list (`voa2_a3`) reads as loose lines. Draw a marker of a fixed visible size in black. | explain | sys | ok |
| PR7 | line pitch | both | ru, en | `crop-std9-colour-ru-longtext__300dpi.png`, `crop-compact16-colour-en-longtext-weapon__300dpi.png`, `crop-trial-ssp-std9-colour-ru-longtext__300dpi.png` | rhythm | P2. Some lines look about one CSS px below the pitch, in both faces. Measured in mock P (2026-10-29, `voa2_a3`): the layout pitch is even (10.41 px); each list item adds the 1 px `li` margin on purpose; the rest is raster rounding in the 300 dpi check images (32.5 device px a line), not the print. No defect. | - | sys | closed |
| PR8 | art on long texts | 63x88 | ru, en | `print-std9-colour-ru__300dpi.png` (card 3) | reference | P2. The longest texts leave the art 23-26% of the card, and 3 RU cards hide it and keep a blank band of paper at the top where the art padding was (mock P); the reference keeps about half. Recommended: keep the ladder order (the text shrinks first, the art gives way last), because legibility at the table outranks the picture; an art floor would cost those cards text size. | - | loc | ok |
| PR9 | card size | 63x88 | ru, en | the `/p/` subtitle, Core Set p. 26 | reference; sleeves | P2. The card is 0.5 x 0.9 mm smaller than a 2.5 x 3.5 in (63.5 x 88.9 mm) playing card, which the subtitle «как у обычной игральной» names. 63.5 x 88.9 fits nine on A4 with 7.75 mm side and 13.15 mm top margins and matches the boxed cards. Owner question at mock P. | - | sys | ok |
| PR10 | name and kind tags | both | ru, en | Core Set p. 26, `print-std9-colour-ru__300dpi.png` | Figma `714-42387` | P2. The reference centres the type banner and the name; the Figma node left-aligns the pill tags and the name over a left-anchored ribbon. Not a defect: the node is the owner's design, and its axis is the ribbon's. Recommended: keep; named to the owner at mock P. | - | sys | ok |
| PR11 | no picture | both | ru, en | `print-std9-colour-ru__300dpi.png` (card 9) | theme 7 | P2. The "?" pedestal fills the art area of a colour card. Placed in batch 1b (C55 print, the light well). | - | loc | ok |
| PR12 | print bar notes | 1180 | ru | `p-page-1180x720-ru.png` | clarity | P2. The sentence on A4, orientation and margins repeats `@page`; the `KeepNote` under the bar explains a temporary choice (C29, C31; Q3.2 answered). | explain | loc | ok |

What works and stays: the fit is linear and almost never needed in the
catalog; the paper floors hold; the ribbon, the dice, the threshold strip and
the tier banner carry the Daggerheart register; the black-and-white card
grows short text to 8.9 pt, which the players gain at the table; the side
margins match the reference.

Impeccable audit of the print surfaces:

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | black on white; the risk is legibility at print size (PR1, PR2), not contrast |
| 2 | Performance | 4 | the fit is linear (`container-type: size`); one face to load after PR3 |
| 3 | Theming | 3 | 33 literal print colours and one radius in `PrintCard.svelte` (N3, batch 10): intended Figma paints that DESIGN.md does not list yet |
| 4 | Responsive | 2 | `/p/` at 360 fails the First-Screen Rule and draws cards that cannot be read (PR4) |
| 5 | Implementation integrity | 3 | coherent and product-specific; the face depends on the reader's machine (PR3) |
| **Total** | | **15/20** | Good: fix PR1-PR4 first |

Batch P (`plan.md`, section 15) takes PR1-PR10 and PR12; PR11 is batch 1b's.
