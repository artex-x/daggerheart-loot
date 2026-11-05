# Batch 9b - The list panels and five guideline rules (implement-ready)

This brief is the implementer's whole input for batch 9b, with mock 9 (`mocks/9/`, the panel states), the mock of
the five rules (`mocks/9b/index.html`, `measure.json`, the PNGs, `rowtext.cjs`), `plan-9a.md` for the shapes 9a
shipped, and `plan-wave3-wide.md` section 3 for the wide lines. Every choice below is the recommended option, logged
in the owner-AFK decisions file (items 17, 18 and 19), except the two the owner answered in chat on 2026-11-05:
rows stay one column and the text takes the free width (M1; `context.md` item 9), and the share panel keeps a delete
per link (M12). A mock is direction (owner, 2026-11-03): each departure is named in "Decisions". Section numbers
("section 7") are those of `plan.md`. The guideline sources are cited by URL only (the report outside the repository
is never cited).

Batch 9b runs after batch 8 and its remediation (`d8e30731`, CI credit passed), before batch T.

## Objective

The owner's list page gets its final layout: from 1000 px a 330 px side column holds the name, the actions, the
price switch and the list notes; a row's notes are one area with a «Для игроков» / «Только для мастера» switch;
the share, roll and requests panels take mock 9's form; every «?» of the list pages goes. Five guideline rules ship
with their code and browser checks: Row Text (a row's text takes the free width of its row before it is cut), Field Measure (a
search box is at most 720 px), Stepper (a lone number field fills its column), Check (every pressed chip draws the
check) and Whole Message (a heading, a control label, an error line and a toast are never cut). DESIGN.md gains the
"Proposed rules" section. Nothing new is stored.

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a rebase).
- Read `git log --oneline -6`, then the shipped `ListPage.svelte`, `SharedListPage.svelte`, `CompactRow.svelte`,
  `RequestsPanel.svelte`, `SharePanel.svelte`, `HitNote.svelte`, `RowMain.svelte`, `TableRows.svelte`,
  `NumberField.svelte`, `Chip.svelte`, `Seg.svelte`, `AddToList.svelte`, `ListFind.svelte`. A line of this brief that
  no longer matches the code is the implementer's to adapt; `handoff.md` names the change.
- Read CI's `e2e` budget figure of the tip (8-R2): the configured budget had 0.2 kB headroom (325.7 of 326). A raise
  uses CI's measured number, rounded up to the next whole kB, under the standing rule (ceilings 300 and 350).
- Case numbers: 105, 106 and 107 are the next free `states.js` numbers; `handoff.md` names the ones taken.
- Host: memory-starved. Run vitest with `VITEST_MAX_WORKERS=2` (vitest 4 reads it), one suite at a time, and no
  browser suite in parallel with vitest. `listPage.test.ts` is 114 KB: run it alone.
- Impeccable cannot run from a subagent. The orchestrator runs `critique` on `mocks/9b/` before the dispatch and
  `polish` and `harden` after S13 on `ListPage`, `SharedListPage`, `RequestsPanel`, `SharePanel`,
  from the built app at 360, 768, 1180 and 1920 px; fallback `impeccable:impeccable-finish-reviewer`.
- Steps are S1 to S15. The line "Session end partial progress" in `handoff.md` names the last finished step.

## Decisions of this refresh (planner defaults; the owner's two answers of 2026-11-05 are M1 and M12)

| # | Decision | Reason and trade-off |
|---|---|---|
| M1 | **Row Text** (owner, 2026-11-05, option B of the independent opinion; Row Columns is rejected). `RowMain`'s `.rt` loses `max-width: 70ch`: a row's text takes the free width of its row, in one column at every width (`TableRows` and its flex column stay as they are). The description clamp stays 3 lines up to 600 px and 2 lines from 601 to 999 px, and becomes 3 lines from 1000 px (the owner's stated fallback; its trigger fired, see the measures). Up to 760 px the layouts do not change (a phone row is narrower than the old 557 px cap). **Departure:** from about 800 px, where a row is wider than the old cap, the text is wider than the owner-reviewed 1180 screens drew, and rows from 1000 px show a third line. | Measured on the built app of `d8e30731` with the rule injected (`mocks/9b/measure.json`, `rowText`, every drawn row with a description; `rowtext.cjs`). Share of described rows that clamp, RU, at 1180 / 1440 / 1920 px, today -> text cap removed with 2 lines (B) -> B with 3 lines from 1000 px (the rule): `/search` «меч» (131 rows) 57.3 -> 28.2 / 22.1 / 21.4 -> 12.2 / 9.9 / 9.2; `eq_weapon` (355) 35.5 -> 18.6 / 10.4 / 9.9 -> 6.5 / 5.1 / 4.8; `wondrous` (119) 60.5 -> 21.8 / 3.4 / 1.7 -> 0.8; `hnf_consumable` (60) 26.7 -> 1.7 / 0 / 0 -> 0; the catalogue sample `/search ~ capped` (292 of 1459) 32.2 -> 4.8 / 3.1 / 3.1 -> 2.1 / 1.4 / 1.4; Vault of Ages (144) 93.8 -> 85.4 / 77.8 / 75.0 -> 61.8 / 36.8 / 34.7 (rules text of 300-800 characters: it clamps by content at every width). EN is lower everywhere. The owner's trigger is "more than 15% of RU rows still clamp under B": B alone passes the catalogue sample and fails at 1180 on three tables (18.6, 21.8, 28.2) and on `/search` at 1440 and 1920 (22.1, 21.4), so the 3-line clamp from 1000 px is in; with it every state of case 106 that has 20 or more described rows, Vault of Ages excepted (content), is at 12.2% or less (`/s/player-token-1` has 10 rows, 2 of them clamp at 1180 RU: too few for a share). A text line is up to about 160 characters at 1180, 200 at 1440 and 207 at 1920 and 2560 on `/search` (the 1440 px column bounds it; 119-166 beside the filter column), above the 75-80 of reading prose: a row is a scan surface, and the owner's second fallback (a cap near 120ch) is named in the rule's check, not built. The median row still leaves 27-43% free at 1440-1920 on `/search` RU and EN: short descriptions leave space that no layout fills without new content (the opinion's option C, not for 9b). First-screen tops do not move (`/search` 279, `eq_weapon` 244, `/s/` 275 in every shot). Rejected by the owner: two row columns (1108/550/575 px thresholds, a 100ch text). Rejected by the opinion: a list-detail pane (a later direction), tiles as the default, a stat column. |
| M2 | **Field Measure.** From 761 px the search box's wrapper takes `max-width: 720px` and keeps its own `flex` basis, on `SearchPage`, `TablesPage`, `HomebrewPage` (`.tools .grow`), `ListsPage` and `ListFind`. Up to 760 px nothing changes. The row's next controls follow the box. «Выбрать» stays last in its row; section 14's "at the right end" reads "last". | A 720 px `flex` basis wraps the catalog's search row and moved its first row from 244 to 292 px (mock 9b, measured); a `max-width` alone keeps 244. Source: https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2 (UI_Secondary_Elements). 8-G2: `/lists` is the third `ListFind` caller. |
| M3 | **Stepper.** `NumberField`'s `.numbox` cap is `max-width: 480px` (was 240). A lone field fills its column (the roll pane 282 of 282 px, the phone settings panel); a field in a `NumRow` beside its button, and the price sheet's fields, keep their content width. The 240 px sentences leave DESIGN.md "Layout" and FEATURES.md. | Owner item 8 allowed dropping the cap; 8-G3 found the box 240 px in a 282 px column. Source: https://playbook.ebay.com/design-system/components/numeric-stepper. |
| M4 | **Check.** `Chip`'s button form draws `Icon check` whenever `on`, gold or neutral; `.chip.on` takes the neutral rule's `inline-flex`, `gap: 6px`. `Seg` draws the check on every pressed option. A link chip (`TableNav`, `aria-current`) is a place, not a press, and draws none. | Sources: https://developer.android.com/develop/ui/compose/components/chip, https://developer.apple.com/design/human-interface-guidelines/accessibility ("Convey information with more than color alone"). Measured: `#/tables/eq_weapon ~ two filters` keeps its first row at 244 px at 1180 (RU and EN) with the check on both gold chips. |
| M5 | **Whole Message.** A heading, a control label, an error line, a status line and a toast are never cut: they wrap. A name, a description or a list of chosen values may be cut to its clamp when one press shows it whole. Named exceptions: the list name `h1` on `/lists/<uuid>` and `/s/` and the record name `h1` of the editor, one line up to 760 px (the whole is in the rename field, the form's name field or the page title; owner, 2026-10-29). 8-G6: the add-to-list row's list name wraps (no ellipsis). | Source: https://carbondesignsystem.com/patterns/overflow-content/. A cut found by the new check is fixed by wrapping; if a wrap moves a `FIRST_SCREEN` row past its limit, the label keeps its cut, joins the allow-list with its reason and `handoff.md` names it. |
| M6 | The side column (from 1000 px) on the owner's page: `grid-template-columns: minmax(0, 1fr) 330px; gap: 24px`. The side column is first in the DOM and placed at the right by `grid-column: 2; grid-row: 1`, so Tab reaches the name and the actions before the rows, as at 360 (a DOM order of rows first would put the actions after 100 rows). Not sticky: it can grow past the viewport with the notes open. From 761 to 999 px its content sits on top in one column (A1). | Mock 9. A sticky column taller than the viewport hides its own end (standing check 1). DOM order before the rows matches the 360 head (WCAG 1.3.2 and 2.4.3). |
| M7 | The rows column is a size container (`container: lrows / inline-size`). Below 760 px of container width a full row stacks its quantity, price and row actions under the row body (A1); from 760 px they sit inline at the row's end. | The window band cannot say it: the rows column is 714 px at a 761 px window and 599 px at 1000 px. At 1180 the column is about 779 px, so the row is inline, as mock 9 draws it (text cell about 305 px). A container query is a component rule, not a system breakpoint (DESIGN.md "The Two Breakpoints Rule"). |
| M8 | From 761 px a full row's three icon buttons (note, eye, ×) become «Заметка» (labeled, `aria-expanded`, a filled-note dot with the hidden text «, заполнена») and «··· Ещё» (`MoreMenu`, name «Ещё: <name>»: «Скрыть от игроков» / «Показать игрокам», «Открыть карточку», a separator, «Убрать из списка»). One `rowMore` snippet in `ListPage` serves the compact and the full row (second use). | R0-1, A2 in part, `plan-9a.md` placed item. A label never gives way to an icon (The Same Label Rule). |
| M9 | The note switch (A2, A5): one note area per entry, and one for the list. Closed, each filled note draws read-only as a `HitNote` box (players') or its dashed `gm` variant (GM), with «Изменить» in the side column for the list notes. «Заметка» (or «Изменить», or «Заметки ▾» up to 760 px) opens the area: a neutral `Seg` «Для игроков» / «Только для мастера» (a dot on an option whose note is filled), one `MarkupField` for the chosen note, the caption («Видна по ссылке для игроков» / «Игроки не видят»), «Готово» and «Очистить». The GM option draws the field dashed. Opening picks the players' note unless only the GM note is filled. A switch first commits the shown draft through the existing `noteInput` path, then shows the other note. | Mock 9 `list-note`, `list-note-gm`. Standing check 2 (plan section 7): a switch never drops an edit. The note «?» and the × go (Q9.1). |
| M10 | The price switch: «Цены:» with a neutral `Seg` «Как в книге» / «Монетами» (the check, M4) and one line «Например: <price>» (the first priced entry in the chosen mode). It replaces the two `Chip`s, the «?» and `HelpBox`. Every price on the page follows it: rows, the bar total, the price sheet, the requests panel and the roll result. Up to 760 px 9a's «Ещё» item stays as it is. | Mock 9 `list-prices`. Least work up to 760 px (9a G17). |
| M11 | The roll panel (A42): «Бросить по списку» is a button with `aria-expanded` in the action row (the side column from 1000 px, the head row from 761 px, «Ещё» up to 760 px as 9a) that opens a `Panel` at the top of the rows column: «Результат броска (1-N)», the stepper and «Бросить dN» (the gold primary) on one `NumRow`, then the result as `RecordCard variant="face"` from 601 px or `RollResult`'s row face up to 600 px, the entry's price in the page's mode, both notes (`HitNote`, `gm` dashed) and «Показать в списке» (scrolls to the row and flashes it). The `<details class="panel lroll">` and the `compact`, `nameActions`, `Actions`, `sendAll` code of the old card go where no other reader needs them. | Mock 9 `list-roll`, B9-1, `plan.md` section 7 "From batch 5". |
| M12 | The share panel (A3, A4): two labeled link rows. Each: the caption («Ссылка для игроков» / «Ссылка для мастера»), one muted line («Без заметок мастера и скрытых позиций» / «С заметками «Только для мастера»»), the link, «Скопировать» neutral, and «Удалить ссылку» as a bare danger text button. `shareHint` goes if the two lines say what it says (else it stays, and `handoff.md` names why). **Departure:** mock 9 draws one «Закрыть доступ по обеим ссылкам»; each link keeps its own delete (owner, 2026-11-05: yes, keep it; Q9b-2). | A4: no gold in the panel. Dropping a per-link delete is a feature loss, which needs the owner's yes (owner rule, "Confirm feature sacrifices"); the owner said to keep it. |
| M13 | The requests panel folds to its head at every width (owner, round 6, R9-1): `h2` «Новое в списке (N)» and «Открыть» / «Свернуть» (`aria-expanded`). Open, each request shows, per entry, the columns «Было», «Возьмут», «Станет», «Цена»; a short stock reads «Просили 9, в списке 5: возьмут 5»; a line with no price reads «без цены»; the total reads «Итого: 180 зол. · 1 позиция без цены». `requestOf` («×%w из %h») and the «(без цен: N)» form go. The `h2` stays drawn while folded, so the arrival toast's focus target exists; a `go` arrival opens the panel. | Mock 9 `list-requests-open`. The fold keeps the first entry in the first screen at 360. |
| M14 | `HitNote` draws a full 1 px border box (no left accent); its `gm` variant is dashed, the style of the owner's GM editor. `/s/` on a GM link draws the GM note with it (A22). | N1 (the detector's `side-tab` on `HitNote.svelte`) and A22 in one change. |
| M15 | E2: the drop mark is a 2 px gold line drawn by `::before` of the row after the gap (or `::after` of the last row) in the 8 px gap, `position: absolute`, full row width; no inset shadow and no side border. Then the `side-tab` entry for `ListPage.svelte` leaves `.impeccable/config.json`. | Plan review B2. Every `FEATURES.md` "Lists" drop rule stays. |
| M16 | E4 as section 7 states: one edit with the Impeccable hook live and one `impeccable detect` run first; if `.impeccable/config.json` stays byte-identical, it loses `ignoreValues` and the `.prettierignore` line goes. | Plan review R8. |
| M17 | Q9.1: the money «?» (`moneyHelp`, `HelpBox class="money-help"`), the note «?» (`noteHelp`, `mdHelp` hint) and the price field «?» (`priceHelp`, `.ghint`) go, with `QuickItem`'s «?» (the last `FormField` `help` caller). `HelpButton.svelte`, `HelpBox.svelte`, `moneyHelpFor` and their tests go too if `git grep` finds no other caller. | Owner, Q9.1 (2026-10-29). Add no module before something uses it; delete a module with no caller. |
| M18 | M-9b (`plan-wave3-wide.md`) is not drawn. Batch W capped the column at 1440 px, under the 1620 px at which option A of Q-W2 holds, and the list page's `.lrows` keeps one column: option A is the rule. The built shots at 1920 and 2560 px and case 105's slack step replace the mock. | Arithmetic of `plan-wave3-wide.md` fact 7 with W's cap; no drawing would change the choice. |
| M19 | DESIGN.md gains "Proposed rules" (the text is the last section of this brief), written by this batch, not batch 10. | 9b edits DESIGN.md already; the section gives the reviewers of 9b, T, P and 10 a permanent home for the guideline sources (owner item 10, "Reviewers"), which ends the dispatch stopgap three reviews sooner. Batch 10 only re-checks it. |
| M20 | Homes of the five rules: a new "### Named Rules" subsection at the end of DESIGN.md "Components" holds Row Text, Field Measure, Stepper and Check (4 of 8); Whole Message goes into "Typography", "Named Rules" (5 of 8). | "Layout" already holds nine named rules and "A steady head", past its budget of 8 (`.claude/README.md`, "Owner insights"). Each of the four is a component's rule. |

## Owner questions (none open)

- Q9b-1 (answered, owner, 2026-11-05): Row Columns is rejected; rows stay one column and the text takes the free
  width (M1). One point stays with the owner's eye, not a blocker: the 3-line clamp from 1000 px is the owner's own
  fallback, taken because the measured trigger fired (M1); the 120ch cap is the owner's second fallback, built only
  if the shots at 1440 and 1920 px read badly.
- Q9b-2 (answered, owner, 2026-11-05): the share panel keeps a delete per link (M12).

## Placed items (each is its own acceptance line below)

- `plan.md` section 7, "Batch 9b": every line; 9b-R9 is replaced by M1 (the owner's choice of 2026-11-05, item 9: one column, no text cap).
- `context.md` item 10 (a): the five rules; (b): the "Proposed rules" section (M19).
- 8-G2 (Field Measure includes `/lists`), 8-G3 (Stepper), 8-G6 (Whole Message, the add-to-list row).
- 8-N2: fixed in batch 8's remediation (`aria-expanded` on «Новый список», goldens re-seeded); 9b's re-seed keeps it.
- `handoff.md` Deferred: the nine add-to-list states whose EN half holds a closed menu; review 9a R2's probe;
  `FormField`'s `help` prop; the monospace labels `.lnote`, `.lroll`, `.money-l`, `.batch-lbl`.
- `plan-wave3-wide.md` 9b-W1 to 9b-W7 (W1 by M18; W2's slack holds by construction under M1; W3: `/s/` is one column with M1's text; W5 is not applicable: `golden.js` has no 1920 family).

## In scope

- New: none. A `gm` prop on `HitNote`, a `rowMore` snippet and a note-area snippet in `ListPage`.
- Changed: `ListPage`, `SharedListPage`, `RequestsPanel`, `SharePanel`, `HitNote`, `RowMain`,
  `NumberField`, `Chip`, `Seg`, `AddToList`, `ListFind`, `SearchPage`, `TablesPage`, `HomebrewPage`, `ListsPage`,
  `QuickItem`, `FormField`, `lib/dict.ts`, `.impeccable/config.json`, `.prettierignore`.
- Deleted (when no caller is left): `HelpButton.svelte`, `HelpBox.svelte`, their tests, `moneyHelpFor`, the help
  inventory states of the list page.
- The suites, the goldens and the prose that name a moved control; DESIGN.md "Proposed rules".

## Out of scope

- The Thumb Rule and the toast timing (batch T). The print page (batch P). `ROUTES.md`, `CONTRACTS.md`,
  `routes.json`, `llms.txt`, the store, the cloud port, the server.
- The catalog's filter column, `FilterPanel`, `Sheet`, `SelectionBar`, `Menu` (no change beyond M4's chip).
- A drawn `/s/` side column: `/s/` keeps mock 9's one column; its row text takes M1's free width.

## Facts read from the code (`d8e30731`, 2026-11-05)

1. `ListPage` from 761 px draws `PageTitle`, `Actions` («Поделиться» caret, «Печать», «Ещё»), `SharePanel` while
   `sharing`, `RequestsPanel`, the `.money` chips with `HelpButton`, `<details class="lnote">` with `notePair`, and
   `<details class="panel lroll">`. Up to 760 px `.lhead`, `notesOpen`, `rollOpen` (9a G17, G18).
2. `notePair` renders two `noteField`s; each has `HelpButton`, `.nhelp`, a × `note-x`, a `MarkupField` with
   `drafts`, and the `noteBox` action that settles on `focusout`. `noteInput(key, kind, e)` writes through the store.
3. A full row from 761 px: grip, tick, `posField`, `RowMain`, `.lrow-meta` (Кол-во, `priceField` with its «?»),
   `.lrow-acts` (three icon buttons), `hint()`, `notes()`.
4. `RowMain`'s `.rt` has `max-width: 70ch`; its description clamps 2 lines, 3 up to 600 px. `TableRows`' `.rows` is a
   flex column with `gap: 8px`. Measured: 70ch is 557 px.
5. `.numbox` has `max-width: 240px`; the input is `flex: 1 1 auto` (batch 8).
6. `Chip` draws `check` only for `neutral && on`; `Seg` only for `neutral`.
7. `AddToList`'s `.ln` cuts the list name with `text-overflow: ellipsis`.
8. `SharePanel` draws a gold «Скопировать» and a danger «Удалить ссылку» per link, then `shareHint`.
9. `RequestsPanel` is always open; per line `requestOf` («×%w из %h») and the price; `shortText` in a `role="alert"`.
10. Toasts: plain 1600 ms, error 2600 ms, action 7000 ms (batch T changes them).

## Files expected

| Step | Files |
|---|---|
| S1 | `app/src/lib/dict.ts`, `lib/i18n.test.ts` |
| S2 | `RowMain.svelte` |
| S3 | `SearchPage.svelte`, `TablesPage.svelte`, `HomebrewPage.svelte`, `ListsPage.svelte`, `ListFind.svelte` |
| S4 | `NumberField.svelte` |
| S5 | `Chip.svelte`, `Seg.svelte`, `chip.test.ts`, the `Seg` cases |
| S6 | `AddToList.svelte` |
| S7 | `HitNote.svelte`, `SharedListPage.svelte`, `sharedListPage.test.ts` |
| S8 | `ListPage.svelte` (side column, rows container, row controls, notes, price switch, roll panel), `listPage.test.ts`, `lists.test.ts` |
| S9 | `SharePanel.svelte`, `sharePanel.test.ts` |
| S10 | `RequestsPanel.svelte`, `requestsPanel.test.ts` |
| S11 | `QuickItem.svelte`, `FormField.svelte`, the `HelpButton`/`HelpBox` deletions, `a11y.test.ts` (`COVERED`) |
| S12 | `.impeccable/config.json`, `.prettierignore` |
| S13 | `tests/app/states.js`, `inventory.js`, `typo.js`, `sweep.js`, `contracts.js` if a reader moves, `tests/e2e/flows.mjs` if a flow presses a moved control, the goldens |
| S14 | `DESIGN.md`, `docs/specs/FEATURES.md`, `docs/specs/COVERAGE.md`, `docs/specs/I18N.md` if a term moves, `tools/bundle-budget.mjs` and `.claude/README.md` if the budget rises |
| S15 | `issues/57/mocks/9b/built/` (`shoot.js`), `handoff.md` |

## Steps

### S1. Strings

Both languages, ASCII punctuation, both plural sets where a count shows:

- `noteForPlayers` «Для игроков» / "For players"; `noteForGm` «Только для мастера» / "GM only" (reuse `notePub`
  and `noteHid` if they hold these words: `git grep`).
- `noteSeenByPlayers` «Видна по ссылке для игроков» / "Shown on the players' link"; `noteNotSeen` «Игроки не
  видят» / "Players do not see it"; `noteDone` «Готово» / "Done"; `noteClearText` «Очистить» / "Clear";
  `noteEdit` «Изменить» / "Edit"; `noteFilled` «, заполнена» / ", filled" (hidden text).
- `pricesLabel` «Цены:» / "Prices:"; `priceExample` «Например: %s» / "For example: %s".
- `shareNoGm` «Без заметок мастера и скрытых позиций» / "Without GM notes and hidden entries"; `shareWithGm`
  «С заметками «Только для мастера»» / "With the GM-only notes".
- `reqWas` «Было» / "Was"; `reqTaken` «Возьмут» / "Taken"; `reqBecomes` «Станет» / "Becomes"; `reqPrice` «Цена» /
  "Price"; `reqShortLine` «Просили %w, в списке %h: возьмут %t» / "Asked %w, the list has %h: %t taken";
  `reqNoPrice` «без цены» / "no price"; the total's unpriced part «%n позиция без цены» with the plural set /
  "%n entry without a price"; `requestsOpen` «Открыть» / "Open" and `requestsFold` «Свернуть» / "Fold" (reuse an
  existing pair if `git grep` finds one).
- `showInList` «Показать в списке» / "Show in the list".
- Delete the keys whose last reader goes: `requestOf`, the «(без цен)» key, `moneyAs` if no reader stays,
  `notePubHint`, `noteHidHint`, `mdHelp` (if only the note «?» read it), `noteClear` if only the × read it.

### S2. Row Text (M1)

CSS in `RowMain.svelte` alone; `TableRows.svelte`, the list page's `.lrows` and `CompactRow` stay as they are.

1. `.row-main .rt`: delete `max-width: 70ch`. Replace its comment ("The line length holds at 70 characters.") by
   one line: the text takes the free width of its row (DESIGN.md "Components", "The Row Text Rule"). `flex: 1` and
   `min-width: 0` stay, so on the list page's full row the text box ends at `.lrow-meta`.
2. The clamp: the base stays `-webkit-line-clamp: 2` (601 to 999 px). Replace `@media (max-width: 600px)` by
   `@media (max-width: 600px), (min-width: 1000px)` and keep its body (3 lines, `line-clamp` too). The comment says
   why in one to three lines: three lines up to 600 px, and from 1000 px where two lines cut 18-28% of the described
   RU rows at 1180 px (DESIGN.md "Components", "The Row Text Rule"). `.row-main.full` keeps its `none`.
3. No unit test: jsdom has no layout, and no logic changes. Case 106 (S13.5) is the proof.
   `git grep -n "70ch" app/src/components/RowMain.svelte` finds nothing after the edit.
4. Trap: add no grid, no column count and no new `max-width` to `TableRows` or `ListPage` (the owner rejected Row
   Columns). The row's picture, tick column, tags and stat line do not change.

### S3. Field Measure (M2)

In `SearchPage` (`.searchrow .grow`), `TablesPage` (`.searchrow .grow`), `HomebrewPage` (`.tools .grow`),
`ListsPage` (`.grow`) and `ListFind` (`.lfind .grow`), add inside `@media (min-width: 761px)`: `max-width: 720px`.
Keep each `flex` basis and `min-width`. **Trap:** a `flex-basis: 720px` wraps the catalog's search row (measured: the
first row moved 244 to 292 px at 1180). Check that no row puts its last control at the far end by `margin-left:
auto`; if one does, remove that margin (the controls follow the box).

### S4. Stepper (M3)

`NumberField.svelte`: `max-width: 480px`; the comment says the box fills its column up to 480 px, a box in a row
with its button keeps its content width, and the alt roll's pair opts out in `AltPanel` (unchanged). Read
`AltPanel`, `NumRow` and the price sheet: none may grow. Mock 9b: the roll pane box is 282 of 282 px at 1180.

### S5. Check (M4)

1. `Chip.svelte`: `{#if on}<Icon name="check" />{/if}` for the button form; `.chip.on` takes `display: inline-flex;
   align-items: center; gap: 6px`; the neutral rule keeps its colors. The link form is unchanged.
2. `Seg.svelte`: the check on every pressed option (`o.value === value`), not only `neutral`.
3. `chip.test.ts`: a gold pressed chip holds the check `svg`; an off chip and a link chip hold none.

### S6. Whole Message, the add-to-list row (M5, 8-G6)

`AddToList.svelte` `.ln`: no `white-space: nowrap`, no ellipsis; `overflow-wrap: anywhere`. The row grows with the
name. `lists.test.ts` or the menu case: a 120-character name is whole in the row's text.

### S7. `HitNote` and `/s/` (M14, A22)

1. `HitNote.svelte`: a full 1 px `--line2` border, `--r-sm` radius, no left accent; prop `gm?: boolean` draws the
   border dashed, the `--bg2` ground, the `eyeOff` icon and the label «Только для мастера».
2. `SharedListPage`: the GM link's GM note and an entry's GM note use `gm`. The players' note uses the plain box.
3. Tests: `sharedListPage.test.ts` reads the GM note in a `gm` box on `gm-token-1`; axe.

### S8. `ListPage` (M6-M11, A1, A2, A3, A5, A42)

1. Layout. One wrapper `.lpage`: from 1000 px `display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap:
   24px; align-items: start`. The side column `.lside` is first in the DOM, `grid-column: 2; grid-row: 1`; the main
   column `.lmain` is `grid-column: 1; grid-row: 1` and is the size container `container: lrows / inline-size`.
   From 761 to 999 px `.lside` sits on top in one column; up to 760 px 9a's `.lhead` stays as it is.
2. `.lside` from 761 px, in order: the rename `h1` (`renameTitle`), the meta line (`cloudSub`), the action row
   «Поделиться» (caret, `aria-expanded`), «Печать», «Бросить по списку» (`aria-expanded`, M11), «Ещё» (copy, JSON,
   delete); the price switch while `priced` (M10); the list notes (M9: two read-only boxes with «Изменить», or the
   area when open). The `.lside` is a `Panel` from 1000 px (mock 9), plain from 761 to 999 px.
3. `.lmain`, in order: the share panel while `sharing` (M12), the roll panel while `rollOpen` (M11), the requests
   panel (M13), `ListFind` or the «Выбрать» row, the rows, «Добавить свой предмет».
4. The full row (from 761 px): grip, tick, position, `RowMain`, `.lrow-meta` (Кол-во, Цена), «Заметка», `rowMore`
   (M8). `@container lrows (max-width: 759px)`: `.lrow-meta` and the two buttons take a second line under
   `RowMain`, from the text's left edge (A1). From 760 px of container they sit inline at the row's end.
5. Notes (M9): replace `notePair`/`noteField` by `noteArea(o, key)`: the `Seg`, one `MarkupField` keyed by the shown
   kind (`id` `note-<key>-<kind>`, so `drafts` and the existing `noteBox` settle keep working), the caption, «Готово»
   (closes the area, focus back to its opener) and «Очистить» (clears the shown note, as the × did). The switch
   handler calls the settle of the shown field before it changes kind. `notes()` draws the read-only boxes while the
   area is closed, the area while open (`boxHidden` keeps its meaning). The list notes take the same area with key
   `list`. Delete `noteHelp`, `.nhelp`, `note-x`.
6. Price switch (M10): `Seg neutral` with `MONEY_MODES` and `pickMoney`; the example line; delete `.money`, the
   chips, `moneyHelp`, `toggleMoneyHelp`, `.money-l`, `.money-br`. Pass `mode` to every `priceText` caller on the
   page (`git grep -n priceText -- app/src/components/ListPage.svelte`) and to `RequestsPanel`.
7. Roll panel (M11): `rollBody` in a `Panel` with an `h2` «Бросок по списку»; the result face by width (`RecordCard
   variant="face"` from 601 px, else `RollResult`'s row face, as `RollPanel` chooses); the price line; the two
   `HitNote`s; «Показать в списке» (`scrollIntoView` of `[data-index]`, the flash class 1.5 s, focus on the row's
   body). Delete the `<details class="panel lroll">`, its `summary` and `.lroll` rules, and the `compact`,
   `nameActions`, `Actions`, `sendAll` code, the `.card.compact` rules and the two `REVIEW_ART_SIZES` rows for 132 and
   96 px, each only where `git grep` finds no other reader.
8. Price field: delete the «?» and `.ghint` (`priceHelp`, `goldHint` if unread).
9. `.batch-lbl` takes `var(--ui)` (handoff Deferred, monospace labels).
10. Run 9a R2's probe first (360x640 RU, `LIST_A ~ noted`: open the list «Ещё», close by Escape, then by a tap
    outside; read `scrollY` and whether the header covers «Ещё»). If `focus({ preventScroll: true })` on `MoreMenu`'s
    return cures it and «Ещё» stays in view, take it; else log the numbers in `handoff.md` Deferred.
11. Tests in `listPage.test.ts`: the side column's order and names; the note switch keeps a typed text across two
    switches and after `vi.advanceTimersByTime` of the store buffer; «Очистить»; «Готово» returns the focus; the price
    switch changes a row price, the bar total and the roll result; the roll panel's «Показать в списке»; the row
    «Ещё» items; no «?» on the page; axe on the open area, the open roll panel and the row menu.

### S9. `SharePanel` (M12)

Two rows as M12; «Скопировать» `variant` neutral; «Удалить ссылку» `variant="bare"` with the danger color class the
requests panel uses; an `h2` «Поделиться» for the panel. `sharePanel.test.ts`: no primary button in the panel; both
descriptions; each delete still deletes one link.

### S10. `RequestsPanel` (M13)

1. A fold state `folded = $state(true)` per page visit; the head row (the `h2` and «Открыть»/«Свернуть»); the body
   only while open. The arrival's `go` path and the focus target (`head`) work folded: the `go` opens it.
2. Each request's table: a header row «Было», «Возьмут», «Станет», «Цена» (`th scope="col"`), one row per entry:
   the stock, the asked count (or the taken part when short), the stock after, the price in `mode` or «без цены».
   The short line above the actions reads `reqShortLine`. The total line with the unpriced count in words.
3. `requestsPanel.test.ts`: folded on arrival; open and fold by the head button; the columns; the short line; no
   «×» form; axe open and folded.

### S11. The last «?» (M17, Q9.1)

`QuickItem`'s «?» goes, then `FormField`'s `help` prop and its `HelpButton` import. `git grep -n -E
"HelpButton|HelpBox|moneyHelpFor"`; delete each module with no caller, with its tests and its `COVERED` line.
`FEATURES.md` rule 15 (c) changes in the same commit.

### S12. E2 and E4 (M15, M16)

1. The drop mark of M15; the existing reorder cases pass unchanged.
2. Remove the `side-tab` entry for `ListPage.svelte` from `.impeccable/config.json`. `npx impeccable detect --json
   --no-config --no-inline-ignores app/src/components/ListPage.svelte app/src/components/HitNote.svelte` reports no
   `side-tab`. If no form passes, keep a value-scoped ignore and name it for batch 10.
3. E4: one edit with the hook live, one `npx impeccable detect --json app/src`; `git diff --exit-code
   .impeccable/config.json`; `npx prettier --check .impeccable/config.json`. Then the file holds no `ignoreValues`
   and the `.prettierignore` line goes. If the hook rewrites the file, E4 stays and `handoff.md` gives the reason.

### S13. Suites, states and goldens

1. `inventory.js`, new states (RU and EN goldens, an axe case each): `LIST_A ~ note open as gm4` (a row's area, the
   players' option), `~ note open, gm as gm4` (the GM option), `~ list notes open as gm4`, `~ row more as gm4` (from
   761 px), `~ roll result as gm4` (the panel with a typed number), `~ prices in the book as gm4`, `~ requests as
   gm4` (folded) and `~ requests open as gm4` on the seeded list with requests, `~ mid band as gm4` (`width: 768`).
   Reuse an existing id where one draws the same state. Delete `LIST_A ~ money help`, `~ price help`, `~ note help`
   and their goldens.
2. The nine add-to-list states of `handoff.md` Deferred each get an `again` that repeats its enter's presses in EN:
   `#/i/ci1 ~ many lists as gm4`, `~ new list`, `~ new list as gm2`, `~ new list from a search as gm2`, `#/tables ~ a
   row opened, list menu as gm4`, `~ a row opened, new list`, `~ bar menu as gm4`, `#/homebrew ~ add to list as
   gm1`, `#/homebrew/<HB_AXE> ~ add to list as gm1`.
3. Case 104 (Stepper): at 360, 390, 768 and 1180 px, RU and EN, a lone `.numbox` spans its column's content box
   within 1 px (or is 480 px), «+» ends within 1 px of the box's right edge, the value's center is within 1 px of the
   box's, the box is 46 px tall; the price sheet's fields and the list roll's field keep their content width.
4. Case 105 (the list page layout): `LIST_A ~ many as gm4` and `#/s/player-token-1`: at 768 px the side content is
   above the rows and every row's controls sit under the row body (A1: no badge over a name, each name's word on one
   line, no sideways scroll); at 1000 and 1180 px the side column is 330 px at the main column's right, the rows
   column at its left, the DOM order side then rows; at 1180 a row's controls are inline; at 1920 and 2560 px the
   side column keeps 330 px and a row's text box ends within 24 px of its quantity field (the text takes the free
   width, M1, so the slack of 240 px that 9b-W2 allowed is zero by construction); `/s/` keeps one column and its row
   text takes the row (9b-W3); RU and EN.
5. Case 106 (Row Text and Field Measure). Rows: at 1180x720, 1440x900 and 1920x1080 px, RU and EN, on
   `#/search ~ searched`, `#/search ~ capped` (300 rows, the catalogue sample), `#/tables/eq_weapon`,
   `#/tables/wondrous`, `#/tables/hnf_consumable`, `#/tables/voa` and `#/s/player-token-1`; wait until no
   `[data-drawing]` is left. The description box is `.row-main:not(.full) .rt > span:not(.rh):not(.rstats)`.
   Steps: (a) `.rt` has a computed `max-width` of `none` and its right edge is within 16 px of the row body's
   content edge. (b) No box with `scrollHeight > clientHeight + 1` has 40 px or more free to the right of its text
   ("cut while free"; it holds by construction next to the plain row, and guards a later cap). (c) Clamp share: the
   boxes with `scrollHeight > clientHeight + 1`, over the described rows, are at most 15% on every state of at least
   20 described rows except `#/tables/voa` (rules text of 300-800 characters: logged, named in the case's comment, not
   asserted); `/s/` has 10 rows and is logged only. The case logs every share with its state, width and language;
   this refresh measured 12.2% or less on the asserted states (M1). If a share passes 15%, the batch stops and names
   the state and the figure to the orchestrator; the owner's second fallback (a text cap near 120ch) is not built
   unasked. (d) Computed clamp: `-webkit-line-clamp` of the box is 3 at 360, 390 and 600 px, 2 at 601, 768 and 999 px,
   3 at 1000 and 1180 px. (e) No row text is cut inside a word: no box has `scrollWidth > clientWidth + 1`, no box's
   computed `overflow-wrap` is `anywhere` or `break-word` and no `word-break` is `break-all`, and a clamped box
   shows whole lines (`clientHeight` is the clamp's line count times the line height, within 0.05 line); the ellipsis
   at the end of the last line is the one cut, and one press opens the whole record. (f) The rows of the owner's
   screenshot («Фляга Путника», «Мешок Собирателя») are not clamped at 1440 and 1920 px. (g) Field Measure: the
   search box is at most 720 px wide and its next control starts within 16 px of it on the pages above that have one,
   `#/lists ~ many lists as gm4` and `LIST_A ~ many as gm4`; at 360, 390 and 768 px the box fills its row as today.
   Log the shares in `handoff.md` (the build of `d8e30731` with the rule injected gave `/search` «меч» RU 12.2 /
   9.9 / 9.2% at 1180 / 1440 / 1920 px, `eq_weapon` 6.5 / 5.1 / 4.8%).
6. Case 107 (the note switch in a real browser): type in the players' note, switch to «Только для мастера» within
   the store's quiet time, switch back, reload: the text is kept; the requests panel opens and folds by its head;
   the price switch changes every drawn price.
7. `typo.js`: (a) Check: `SWITCHES` gains the gold pressed chips of `#/tables/eq_weapon ~ two filters` (column at
   1180, sheet at 360) and the `/search` kind row with one kind picked; every `[aria-pressed=true]` chip and segment
   holds the check `svg` with its center within 1 px of the label's first line box. The note switch and the price
   switch join `SWITCHES`. (b) Whole Message: on its `PAGES` at 360 and 1180, RU and EN, no `h1`-`h3`, `button`,
   `label`, `[role=menuitem]`, `[role=alert]`, `[role=status]` or toast holds an element whose computed
   `text-overflow` is `ellipsis` or whose `line-clamp` is set and whose `scrollWidth > clientWidth + 1` or
   `scrollHeight > clientHeight + 1`; the allow-list of M5 by selector, each with its reason in one line.
8. `FIRST_SCREEN` (section 14): `LIST_A as gm4`, `~ many as gm4`, `~ long name as gm4`, `#/s/player-token-1` and
   `~ long name` move from `shipped: 360` to `shipped: true`; the requests state's row is added: asserted at the rule,
   or an `exception` at 360 set to the measured value when it passes 256 (the owner's figure is 292; the estimate is
   about 296; with the owner away the measured value is logged in the AFK decisions file). Case 83's 1920 step for
   `shipped: 360` rows moves into case 105 for these rows (9b-W4).
9. `sweep.js 768` runs on CI (A1); a `sweep.js` entry opens the note area and the requests panel at 360.
10. Golden re-seed: `npm run build:test`, then the four shards with `--update` (Bash timeout 600000 each). Expected
    to move: every `LIST_A*` and `#/s/*` golden, the requests and share states, the nine add-to-list states, the
    `/search`, catalog and roll states whose chips gained a check only if the tree shows it (it should not: the icon
    is `aria-hidden`). A golden is re-seeded, never edited. The `[expanded=false]` of «Новый список» (8-N2) stays.

### S14. Prose, in the same commit

- DESIGN.md: the four rules in "Components", "Named Rules", and Whole Message in "Typography" (texts below);
  "Layout": the first paragraph's 240 px exception goes ("A window up to 1212px draws as it did at 1180px" stays: a
  row's text follows its row, which is no new exception); "The One Width Rule" loses the lone number field's
  sentences and gains one: a row's text is a clamped snippet, not prose, and takes its row's free width (The Row
  Text Rule); "The Two
  Breakpoints Rule" names the 1000 px side column of the list page and the rows container's 760 px step;
  "Components": "Inputs" (the stepper), "Chips" (the check), the selection and the gold budget checked;
  "Proposed rules" (the text below, after "Do's and Don'ts").
- FEATURES.md: "Tables and search", the sentence "the text holds at 70 characters a line and a separator never
  starts a line" reads "the description takes the free width of its row, at most 3 lines up to 600 px and from
  1000 px and 2 lines between, and a separator never starts a line; a cut has one press to the whole record" (owner,
  2026-11-05); "Rolling" (the 240 px sentence goes); "Lists" (the side column, the note switch, the
  price switch with its example, the roll panel, the share panel, the requests panel folded, the row «Ещё», the
  drop mark); rule 15 (c) (no «?» on the list pages); "Chrome" if a label sentence moves; the section 14 sentence
  "«Выбрать» at the right end" reads "last in its row" where FEATURES holds it.
- `COVERAGE.md`: cases 105-107, the `typo.js` steps, the deleted help states.
- A decision file under `docs/decisions/` (`.claude/templates/decision.template.md`, then `node tools/decisions.js`):
  "A row's text takes its row's free width; rows stay one column" with the measured shares of M1 and the rejected
  alternatives (two row columns, a 110ch or 100ch cap, tiles by default, a stat column, a list-detail pane). It cites
  no batch, plan line or mock.
- `I18N.md` if a term moves.

### S15. Evidence

`issues/57/mocks/9b/built/shoot.js` from `mocks/8/built/shoot.js`: `list`, `list-note`, `list-note-gm`,
`list-prices`, `list-roll`, `list-share`, `list-requests`, `list-requests-open`, `list-rowmore`, `shared-player`,
`shared-gm`, `search`, `eq-weapon`, `roll-std` at 360 and 1180 px, `list`, `list-prices`, `shared-player` at 768 px,
and `list`, `shared-player`, `search`, `list-requests` at 1920 and 2560 px, RU and EN (9b-W6).

## Acceptance criteria

1. Side column (M6): from 1000 px the 330 px side column holds the name, the meta line, the action row, the price
   switch and the list notes, in that DOM order before the rows; from 761 to 999 px they sit above the rows; up to
   760 px 9a's head is unchanged.
2. A1 (P0): below 760 px of rows column a full row's controls stack under the row body; no badge draws over a name;
   no sideways scroll at 768 (case 105, `sweep.js 768`).
3. Row controls (M8): from 761 px «Заметка» and «··· Ещё» replace the three icon buttons; the compact and full rows
   share `rowMore`.
4. Note switch (M9, A2, A5): one area with the `Seg`, the caption, «Готово», «Очистить»; the GM option is dashed; a
   switch keeps a pending edit (case 107, a unit test); the read-only boxes draw while closed.
5. Price switch (M10): «Цены:» with the `Seg` and «Например: ...»; every price on the page follows it, rows, the
   bar total, the price sheet, the requests panel and the roll result included.
6. Roll panel (A42, M11): a real button opens it; the result is the face (from 601 px) or the row face, with the
   price, both notes and «Показать в списке»; the batch 5 leftovers are deleted where unread.
7. Share panel (A3, A4, M12): two labeled rows, no gold, a delete per link.
8. Requests (M13): folded at every width; the four columns; the short line in words; no «×9 из 5», no «(без цен)».
9. `/s/` GM note (A22) and `HitNote` (M14) in the dashed GM box; the detector reports no `side-tab` on `HitNote`.
10. E2 (M15): the drop mark is a gap line; the `side-tab` entry for `ListPage.svelte` is gone from
    `.impeccable/config.json`; the reorder cases pass.
11. E4 (M16): done, or kept with its reason in `handoff.md`.
12. Q9.1 (M17): no «?» on `/lists/<uuid>`; the three help states and their goldens are gone; `FormField` has no
    `help` prop; `HelpButton` and `HelpBox` are deleted if no caller is left; rule 15 (c) changed.
13. Icon-and-label controls of the note switch and the list controls share one vertical center at 360 and 1180
    (`typo.js` `SWITCHES`).
14. Row Text (M1; item 9): case 106 passes (a to g); `RowMain` has no `max-width: 70ch` and clamps at 3 lines up to
    600 px and from 1000 px; DESIGN.md "The Row Text Rule" and "The One Width Rule" and FEATURES.md "Tables and search"
    carry the rule with the owner's date (2026-11-05); the clamp shares are logged in `handoff.md`; the decision file
    is written.
15. Field Measure (M2, 8-G2): case 106's box steps pass on `/search`, the catalog, `/homebrew`, `/lists`, the list page
    and `/s/`.
16. Stepper (M3, 8-G3): case 104 passes with the new steps; the 240 px sentences are gone from DESIGN.md and
    FEATURES.md.
17. Check (M4): every pressed chip and segment draws the check (`typo.js`, `chip.test.ts`); no `FIRST_SCREEN` row
    moves.
18. Whole Message (M5, 8-G6): the `typo.js` step passes with the M5 allow-list; the add-to-list row shows a
    120-character name whole.
19. DESIGN.md "Proposed rules" holds the entries below, each with its source URL, draft text, check and building
    batch (owner item 10 (b)).
20. The nine add-to-list states have an `again`, and their EN goldens hold an open menu (handoff Deferred, 8-R3 shape).
21. 8-N2: every signed-in `_lists*` golden still holds `[expanded=false]` on «Новый список».
22. 9a R2's probe ran; the outcome is the fix of S8 step 10 or a Deferred line with its numbers.
23. `.lnote`, `.lroll`, `.money-l` are gone and `.batch-lbl` uses the UI face (handoff Deferred).
24. `FIRST_SCREEN`: the five list rows are `shipped: true` and pass at 360x640 and 1180x720, RU and EN; the requests
    row passes its rule or its logged exception; DESIGN.md "The First-Screen Rule" names a new exception with its
    date.
25. Wide lines: 9b-W2 (zero slack by M1, case 105), 9b-W3, 9b-W4 (case 105), 9b-W6 (the shots), 9b-W7 (DESIGN.md
    "Layout" names the side column at wide widths); 9b-W1 by M18.
26. New states: each with its RU and EN golden and an axe case (S13.1).
27. Parity and detector: `i18n.test.ts` passes; no new detector finding in a touched file; no `impeccable-disable`.
28. `polish` and `harden` ran (the orchestrator); the screenshot set is in `mocks/9b/built/`.
29. The budget: raised only by the standing rule, from CI's figure, with the reason in the commit.

## First-screen rows (section 14)

| Row | 360x640 | 1180x720 |
|---|---|---|
| `LIST_A as gm4` | asserted (about 200 today) | asserted: the first entry in the rows column, mock 9 159 |
| `LIST_A ~ many as gm4` | asserted (254 today, limit 256) | asserted |
| `LIST_A ~ long name as gm4` | asserted | asserted |
| `#/s/player-token-1`, `~ long name` | exception 302 (unchanged) | asserted (275 today) |
| the requests state (new) | the rule, or the measured exception (owner 292, estimate 296) | asserted (the folded strip) |

The Row Text Rule moves no first-screen top (measured with the rule injected: `/search` 279, `eq_weapon` 244, `/s/`
275 at 1180, 1440, 1920 and 2560 px).

## States table (standing check 1)

| State | What the screen shows | Proof |
|---|---|---|
| empty list | the empty plate; the side column without the price switch | unchanged golden |
| one entry | one row; no roll button (fewer than 2 rows) | `listPage.test.ts` |
| many (14), at the limit (100 of 100), 3x (300, with an override) | rows in one column; the side column unchanged; at 100 «Добавить свой предмет» off with its line | goldens, `listPage.timed.test.ts` |
| a 120-character list name | `h1` one line up to 760 px; three lines in the 330 px side column, wrapped | `~ long name`, case 105 |
| a 120-character entry name | wraps in its row at every width; in the add-to-list row whole | case 105, S6 test |
| a 1000-character note (`NOTE_MAX`) | the area's field scrolls; the read-only box wraps | `listPage.test.ts` |
| 50 requests (the server limit) | folded strip; open: the existing `REQUESTS_SHOWN` fold | `requestsPanel.test.ts` |
| row lists (catalog, `/search`, `/s/`, list page) at 360 / 1180 / 1920 | one column at every width; the text takes the row's free width | case 106 (a), (b) |
| a description longer than the clamp (RU: 12% of the described `/search` rows at 1180 with the rule; 57% under the old cap) | cut to 3 lines up to 600 px and from 1000 px, 2 lines between, ellipsis at the end of the last line; one press opens the record | case 106 (c), (d), (e) |
| the longest description (811 characters RU) | clamped, no sideways scroll, no half line | case 106 (e) on `#/tables/voa` |
| `/search` at its cap (300 rows) and a table of 355 rows | rows draw in steps of 60; the clamp share holds | case 106 (c) on `#/search ~ capped` and `#/tables/eq_weapon` |

At many and at the limit: the rows keep list order; the primary «Добавить свой предмет» stays after the last row;
at 360 with the keyboard open the note area's field and its two buttons fit (the area is in the row, not a popup);
no sticky region grows (the side column is not sticky; the selection bar unchanged).

## Error scenarios (standing check 2)

- Loading, a failed read: `LoadState` as today, in the rows column; the side column draws the name only after the
  list is read.
- A failed write (a note, a price, a quantity): the meta line says «не сохранено» and the alert with «Повторить», as
  today; the area keeps the typed text (the draft), so a retry writes the field as it stands.
- Offline: writes queue in the store buffer; the switch commits the draft into the buffer; nothing is lost.
- A conflict (another tab wrote the note): the store's merge as today; an open area keeps the local draft until
  «Готово», then the merged value draws.
- A deleted entry while its area or row menu is open: the row leaves; the menu closes with it; focus goes to the
  next row's body, else the rows head.
- A stale tab (the previous bundle): it draws the old panels on the same stored data; nothing new is stored.
- A revert (the previous frontend): the same stored keys and server shape; both notes stay as stored.
- The Row Text Rule (M1) is CSS: it changes no state and no stored value. A stale tab draws the old 70ch text; a
  revert restores it.
- No path loses stored data: no plan-review trigger.

## Consistency (standing check 3)

Rules of `FEATURES.md` "Consistency rules" followed: 1 (one count per collection: the meta line), 4 (one name for
one thing: «Бросить по списку» in the side column, the head and «Ещё»), 9 (the primary action first: «Бросить dN» in
the roll panel), 15 and 16 (labels, the rename `h1`), 19 (the short stock line, not a box), 20 (focus returns).
Siblings: `/lists` and `/homebrew` share the head pattern and «Ещё»; `/s/` keeps one column. Named differences:
the list filter stays a sheet at every width (9a G15); the side column exists on the owner's page only; the share
panel keeps a delete per link (M12); M1's wider row text from about 800 px and its third line from 1000 px (a departure from the 1180 screens the owner reviewed).

## RU/EN parity (standing check 4)

Every key of S1 in both languages with the same facts; the plural sets for «позиция без цены» (one, few, many) and
the English (one, other); ASCII punctuation (straight quotes in EN, «» in RU as the dictionary uses them). RU is the
longer language in the side column (the action row and the switch), measured by case 105.

## DESIGN.md rules this batch writes

"Components", a new "### Named Rules" subsection at its end:

**The Row Text Rule.** A row's text takes the free width of its row: a description is cut only when it is longer
than its clamp, never while width remains. The cap of 70ch went because a 1440px `/search` row was 54% empty
(measured 2026-11-05). The text is a clamped snippet, not prose, so the prose measure does not apply. The clamp is
three lines up to 600px and from 1000px, and two lines between; a cut always has one press to the whole, the
record. Rows stay one column at every width, and the layouts from 360px to 760px do not change. Owner, 2026-11-05
(item 9).

**The Field Measure Rule.** A search box is at most 720px from 761px, and the controls of its row follow it on the
same line; up to 760px it takes the row's free width. Source: Android adaptive app quality, Tier 2,
UI_Secondary_Elements.

**The Stepper Rule.** A lone number field fills its column up to 480px: «-» at its left edge, «+» at its right edge,
the value centered between them, 46px tall; a button at its limit is disabled, and the value stays a text field. A
field in a row with its button keeps its content width. Owner, 2026-11-05 (item 8).

**The Check Rule.** Every pressed chip and segment draws the check before its label, a gold pick and a neutral
default alike: gold says "this narrows the view", the check says "this is on". A state never rests on color alone.
A link chip marks a place and draws none.

"Typography", "Named Rules":

**The Whole Message Rule.** A heading, a control label, an error line, a status line and a toast wrap; they are
never cut. A name, a description or a list of chosen values may be cut to its clamp when one press shows it whole.
Exceptions: the list name and the editor's record name, one line up to 760px (owner, 2026-10-29).

## DESIGN.md "Proposed rules" (the section this batch writes, after "Do's and Don'ts")

```markdown
## Proposed rules

These candidates come from official design guidance (owner, 2026-11-05). None is a rule yet: each needs the
owner's yes, its code and its check in the batch that builds it. A reviewer may cite one as a finding with its
source.

| Rule | Source | Draft | Check | Built by |
|---|---|---|---|---|
| The Escape Rule | https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2 (Keyboard_Exit) | Escape undoes the last layer a person opened: it closes a menu, a sheet or a dialog, clears a search box that holds text, and in a selection with no layer open clears the ticks. The focus stays on its control, or goes to `main` when that control leaves. | `tests/app/states.js` on `/tables/core_item`, `/search`, `/lists` and `/lists/<uuid>` at 360 and 1180px: two ticks, Escape, «Выбрано: 0» and the focus kept; with the filter sheet open the first Escape closes only the sheet | a later task, with its mock; home `FEATURES.md` "Chrome" |
| The Tablet Screen | https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2 (test devices) | The First-Screen Rule adds 1024x640, Russian and English, as a third viewport: logged first, then asserted route by route at 256px. | `FIRST_SCREEN` gains the viewport with logged rows; each route past 256px is named to the owner | a later task |
| The Detail Pane | https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts (list-detail) | From a 1600px window a picked row on `/tables/*` and `/search` may open its dossier in a pane beside the rows, at the dialog's address; below 1600px the dialog stays. A direction, not a rule of task 57. | a states case at 1600 and 1920px: the `h1` in the pane, `aria-current` on the row, Escape and Back close it, print prints the sheet only | a later task, with its mock |
| The Error Line | https://developer.apple.com/design/human-interface-guidelines/accessibility ("Minimize use of time-boxed interface elements") | An error that a person must act on is also a line on the page, not a toast alone. | an audit of the error toasts of `FEATURES.md` rule 2, each with its page line | a later task |
| Window size classes | https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes | Not proposed: the project's 600, 760 and 1000px steps follow the same principle; only the 1600px class is of use, as the Detail Pane's threshold. | - | - |
| A step of ten | https://developer.apple.com/design/human-interface-guidelines/steppers | Not proposed: a Shift-press step of ten is a shortcut with no label (The Clarity Rule). | - | - |
| A 24px gutter | https://primer.style/product/getting-started/foundations/layout/ | Not proposed: from 1280px a 24px gutter would move every number of the 1440px column for 8px a side. | - | - |
```

## Tests

- Unit: `chip.test.ts`, the `Seg` cases, `listPage.test.ts`, `lists.test.ts`,
  `sharedListPage.test.ts`, `sharePanel.test.ts`, `requestsPanel.test.ts`, `quickItem.test.ts`, `a11y.test.ts`,
  `i18n.test.ts`; every changed component ends with `expectNoA11yViolations`.
- Browser (CI): cases 104-107, case 83, `typo.js`, `sweep.js 360` and `768`, the reorder cases.
- Coverage: a deleted module leaves `COVERED` and `COVERAGE.md`; a changed file keeps its threshold.

## Verification

1. `VITEST_MAX_WORKERS=2 npx vitest run <each changed test file>`, one file at a time for `listPage.test.ts`.
2. `npm run lint:untyped`, `npm run lint:typed` after the last edit.
3. `npm run build:test`; `node tests/app/golden.js --update --shard=n/4` for n = 1-4 (Bash timeout 600000 each).
4. `rtk npm run check:built`; `npx impeccable detect --json --no-inline-ignores app/src` (no new finding in a touched
   file); S12's detector and Prettier checks; `node tools/decisions.js` if a decision file changes.
5. Through the in-memory loader of `states.js` (the `CASES` list filtered, as batch 8 did): cases 83, 104, 105, 106,
   107 at least once on the final `dist-test/`; `node tests/app/typo.js` if memory allows, else CI.
6. `VITEST_MAX_WORKERS=2 rtk npm run check:fast` last (Bash timeout 600000); push; CI is the full gate.

## Risks and do-nots

- Do not store a note mode, a fold state or a column choice: page memory only.
- Do not change a route, the `/s/` address grammar, a stored key or the server shape.
- Do not use a `flex-basis` of 720px for the search box (S3 trap).
- Do not make the side column sticky (M6).
- Do not add a grid, a column count or a text cap to the rows (the owner rejected Row Columns; the 120ch cap is a
  named fallback, not built unasked). A case that fails on the wider row text is adapted, never deleted, and
  `handoff.md` names each.
- Delete a symbol only after `git grep` finds no reader; a kept leftover is named in `handoff.md`.
- If a whole-message wrap moves a `FIRST_SCREEN` row past its limit, keep the cut, allow-list it with its reason
  and name it (M5).

## Gate cost

One code batch (45-60 min: `check:fast` 12-14 min with `VITEST_MAX_WORKERS=2` on this memory-starved host, 744 s
measured at batch 8; one CI run 10.5-11.5; one review fix cycle; the screenshot set) plus extra gates: the golden
re-seed of about 70-100 states (`build:test` and four shards, 15-20); the affected vitest files alone, two workers
(12-18: `tableRows.test.ts` is no longer touched); `check:built`, the detector, E4 and Prettier (4-5); the loader
runs of cases 83 and 104-107 (8-10); the screenshot set at four widths (10); `polish` and `harden` (5-10). CI adds
`sweep.js 768`. About 95-130 min in all (the two-column design's goldens, its case 93 adaptation and its unit test
are gone).

## Writer tests (for the orchestrator's dispatch; not a model choice)

- Test 1: no. Every fork has a default (M1-M20).
- Test 2: yes: `.impeccable/config.json` and `.prettierignore` (configuration every session runs under).
- Test 3: yes: about 70-100 goldens re-seeded; the side column and the panels rest on visual judgment against
  mock 9, and the row text against mock 9b.
- Test 4: no.

## Split criterion

One batch. The list panels share `ListPage`, its seeds and the list goldens; the five rules are CSS in shared
components whose browser checks run in the same CI run and whose goldens do not move (accessibility trees), so a
second batch would add a CI run and a review (45-60 min) and no separate verification. The owner placed the five
rules in 9b (`context.md` item 10 (a)). The Thumb Rule and the toast timing are batch T (`plan.md` section 7).

## Plan review

Not required (no trigger fired): no migration, no SECURITY DEFINER function, no public contract change
(`routes.json`, `CONTRACTS.md`, `llms.txt` stay), no stored data or `localStorage` key changes, no new write or sync
protocol. The note switch writes through the existing `noteInput` path and commits the shown draft before it
switches (Error scenarios), so no path loses stored data.
