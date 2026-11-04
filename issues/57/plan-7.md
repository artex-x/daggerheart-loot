# Batch 7 - Search, account, empty and error states (implement-ready)

This brief is the implementer's whole input for batch 7, with the mock `mocks/7/` (`index.html`,
the PNGs, `b7.js`), `plan-4.md`, `plan-5.md` and `plan-6.md`. It has the shape of `plan-6.md` and
`plan.md` section 10. The owner is AFK (`context.md`, "Owner AFK from 2026-11-03"), so every choice
below is the recommended option; the orchestrator logs each one in the owner-AFK decisions file. A
mock is direction, not the source of truth (owner, 2026-11-03): the departures are named in
"Decisions", and none of them reopens a decision of the owner. Section numbers ("section 7") are
those of `plan.md`.

Batch 7 runs after batch 6's `polish`, `harden`, review and CI, in wave 2. The `/p/` page rows C29,
C30 and C31 are batch P's; this batch touches the `/p/` error branches only (J12).

## Objective

`/search` draws the list head of batch 3: a search row with «Фильтры · N» (up to 760 px) or the
kind chips (from 761 px), «Выбрать» last, ticks only in the selection mode, the one selection bar,
and no per-section strip. Its empty states say what to do: a start state with example queries, and a
nothing-found state with a cause and a one-step reset. `/account` loses its explaining sentences,
reads in two columns from 1000 px, merges "signed in as" into the sign-in methods, and its delete
confirm lists what goes and ends in a filled danger button. Every other error page (an unknown
address, a retired print link, a missing or failed print set, a page that threw) uses the error-page
pattern of batch 4. Grid tiles and `/search` rows mark the matched words.

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a rebase).
- Batches 4, 5 and 6 are on the branch by now. Read `git log --oneline -12`, then `git diff
  38767ca4 HEAD -- app/src/components/ErrorPage.svelte app/src/components/NoItem.svelte
  app/src/components/Empty.svelte app/src/components/MoreMenu.svelte
  app/src/components/PinItem.svelte app/src/components/Button.svelte
  app/src/components/Sheet.svelte app/src/components/FilterPanel.svelte
  app/src/components/SelBar.svelte app/src/components/TableRows.svelte
  app/src/components/RowMain.svelte app/src/components/HomebrewEditor.svelte
  app/src/components/TablesPage.svelte`. This brief names the shapes of `plan-4.md` to
  `plan-6.md`: `ErrorPage` (props `title`, `children`, `actions`), `NoItem`, `Empty` (`title?`,
  `glyph?`, `children`), `MoreMenu` (props `app`, `id`, `up?`, `label?`, `size?`, `children(close)`),
  `PinItem` (props `app`, `home?`, `onpicked`), `Button` `haspopup`, `FilterPanel` (as batch 3
  shipped it), `Sheet`. A line that no longer matches is the implementer's to adapt, and
  `handoff.md` names the change.
- The mock is `mocks/7/`. It was re-checked against the shipped code: the departures are named in
  "Decisions" (J1 to J4, J7, J8, J11 to J13). The mock is not redrawn and not shown to the owner
  again.
- Impeccable cannot run from a subagent. The orchestrator runs `polish` and `harden` after S11 on
  `SearchPage`, `AccountPage`, `NoPage` and the `/p/` error branches, from the built app at 360 and
  1180 px; fallback `impeccable:impeccable-finish-reviewer`.
- Steps are S1 to S14. The line "Session end partial progress" in `handoff.md` names the last
  finished step.

## Decisions of this refresh (planner defaults; the owner is away)

| # | Decision | Reason and trade-off |
|---|---|---|
| J1 | The `/search` head. Up to 760 px: one row with the visible `h1` «Поиск» and `MoreMenu` («Ещё», size `sm`) that holds `PinItem`; the lead is `<p class="vh">`. From 761 px: `PageHead` with `help={null}`, `sub={intro}` (the lead stays) and the labeled pin. Departures from the mock: the mock draws no pin at 360 (a visible feature loss without the owner's yes) and no lead line. | `plan.md` section 7 says the pin "takes the place mock 7 draws"; the mock draws none, and a stop rule forbids the loss. The h1 row costs no height the mock did not already spend (the mock draws the h1). This page has no picker to fill the row, so the h1 stays visible where the catalog hides it. Accepted: a menu with one item (as batch 6 H19). |
| J2 | The search row: `SearchBox` (placeholder `searchShort`, `label` `searchPh`, focus on mount as today), «Фильтры · N» (`Button size="sm"`, variant `toggle` while a kind is picked; up to 760 px only) and `button.selmode` «Выбрать» last (hidden while `app.selecting` and with no row). Up to 760 px `FilterPanel` opens as a `Sheet` with the one row «Тип» and, with own items, the «Свои предметы» switch as its first row (`own` prop). From 761 px the kind chips and the switch draw in a row under the search row (J3). Departures: «Фильтры · N» in place of the mock's «Вид: все ▾» menu; the mock's five kinds (weapons and armor apart) are not built. | One name for one control on every list page, and `FilterPanel` plus `Sheet` are shipped and covered by axe. A menu cannot hold a `role="switch"` validly. The app has three kinds (`KINDS`); a weapon/armor split is a new feature (the catalog already splits them by table). Trade-off: the chosen kinds are not on the button; the count line names them (J5). |
| J3 | The kind chips follow the filter model of `FilterPanel`: «Все» (neutral pressed while no kind is picked), then «Предметы», «Расходники», «Снаряжение» (a picked chip is gold). A press from «Все» picks only that kind; a press on another adds it; the last pick off returns to «Все». New pure `pickKinds(chosen, kind)` in `lib/std.ts`; `AppState.pickKind(kind)` and `resetKinds()` beside `toggleKind`. `toggleKind` and its `keepOneKind` toast stay for the roller. **Changes what users see:** today the three chips are visibility toggles, all gold, and a press turns a kind off. | C13 asks for a neutral default and gold only for a narrowing choice; the sheet and the catalog already use this model, and a «Все» chip beside toggles would read both ways. Trade-off: the old press-to-hide habit inverts. `app.kinds` stays one shared set, so a pick here is also the roller's state, as today. |
| J4 | The rows: `TableRows` `view="list"`, `primary`, `ticks={app.selecting}`, `terms`, `numLabeled`, no `ontoggleall`. The selection mode copies `TablesPage`'s three pieces (the effect that opens the mode when `app.sel.size > 0`, `startSelecting()`, the existing `setSelectable` effect). The strip «Выбрать все (N)» goes from `/search` in this batch (Q3-S, `context.md`): the bar's «Все» ticks the found rows. `TableRows` keeps `ontoggleall`, the strip and `selectAll` for `/s/` until batch 9a deletes them. | Q3-S is the owner's yes. Ticking the found rows takes «Выбрать», then «Все» (two taps instead of one: the accepted trade-off). `SharedListPage` is the strip's last caller. |
| J5 | The count line: one line under the search row, drawn while a kind is picked or the matches pass 300: `<picked kinds> · Показано N из M` (`shownOf`, kinds joined with a comma, cut to one line; the count never cut; with no kind picked, the count alone). `M` is the match count over all three kinds; `N` is the rows drawn (at most 300). The old «300 из N» line (`outOf`) goes. `matched` is computed once over all kinds and filtered by `app.kinds`. | R3-1 (the count line names the chosen values) applies here: the sheet hides them once closed. Ranking is a per-record sort, so filtering after ranking gives the order that filtering before did; a test holds that. |
| J6 | The empty states use `Empty` with `glyph={kindGlyph('item', undefined)}`. **Start** (no query): title «Что ищем?», one sentence «Ищет по названиям и описаниям, по-русски и по-английски сразу.», and three example chips (`Chip`, neutral) that fill the box and keep the focus there; `startTyping` goes. **Nothing found**: title `nothing`, one cause sentence naming the query, the picked kinds or both (`emptyBoth` reused; a new `emptySearch` for a query alone), and one primary: «Сбросить фильтры» while a kind is picked, else «Очистить поиск». Departures from the mock: its cause line («поищите по-английски») is false, because search reads both languages at once; its fourth example «№ 12» is dropped, because search does not read roll numbers. | C14, C16: the syntax moves into examples (one is two words in another order), the cause and the next step are stated. Rule 20: «Очистить поиск» and «Сбросить фильтры» leave the screen on a press, so the focus goes to «Фильтры» (up to 760 px) or the first kind chip, else the search box. |
| J7 | The matched-word mark (`reviews/3.md` N7, deferred to this batch). `/search` passes `terms` (it passes none today). A new `lib/search.ts` function `markRuns(name, terms)` returns the runs once; a new `Marked.svelte` (props `text`, `terms`) draws them and owns the `mark` CSS. `RowMain`'s name and the grid tile's `<b>` both use it, so `RowMain` loses its `nameRuns` and `.row-main mark` rule. | The tile is the second use of the run logic. The DOM of a row with no terms is unchanged, so the goldens that draw rows do not move on that account. |
| J8 | C15: `RowMain` gets `numLabeled?: boolean`; `/search` rows draw the roll number as «№ 89» / "No. 89" (`rowNo`) inside the existing `.rnum` box, in the same place. Tables keep the bare number. Departure from the mock (a trailing badge): the position stays. | A bare number before a name reads as a count only where no table is named. One prop and one string; the mock's move changes the row anatomy of batch 3. |
| J9 | `/account` layout (A31). The page keeps one column below 1000 px. From 1000 px it is two columns of the page's own order: the left holds «Отображение на всех устройствах» and «Способы входа», the right holds «Ваши данные», «Выход» and «Удаление аккаунта». The DOM order is left then right, so the tab order and the reading order agree. Departure from the mock (display and data left; sign-in, sign-out and delete right): that grouping reorders the DOM or breaks the focus order (WCAG 2.4.3). | Two columns fill the empty right side and keep the spec's section order. 1000 px is the system's step; no new breakpoint. |
| J10 | `/account` clarity (plan review N11). The «Вы вошли как» panel goes: the «Способы входа» rows carry each provider's email once, and the row of the provider in use gets the badge «Сейчас» / "Current" (`signedInNow`); while the identities are unread or failed, that panel draws the old line (the session email in bold and «через <provider>») in place of the rows. The Display lead sentence goes. The heading reads «Отображение на всех устройствах». The rows read «Вид таблиц по умолчанию» (`Seg`), «Печать по умолчанию» (two `Seg`s: color and sheet size, as `PrintSwitches`; the checkbox «Компактный лист» goes) and «Когда беру из чужого списка» (the select stays; its question hint goes). `yourDataHint` is one sentence («Списки и свои предметы одним архивом ZIP.»); `zipNoArt` stays as a conditional line. The «Выйти на всех устройствах» note goes. Every account `Seg` takes `neutral`. | N11, A32, A33, D7 and the batch 6 rule (a pressed option of a form-field picker is neutral). The select stays because three answers do not fit a `Seg` at 360 (the existing comment in `AccountPage`); the row label carries the condition the question carried. "Kept only until reload" is no longer said on this page: the rows say "by default", and the pick on the page says nothing (C57 answer, `KeepNote` leaves with batch P). The transfer order and the 1000 cap live in the two import panels (`hbImportZipLists`, `importZipHomebrew`, the over-limit lines); S6 checks that. |
| J11 | The delete confirm (A34) stays inline in its panel: it gains a list «Будут удалены:» and the final button `variant="danger-fill"`. The list holds counts the page already reads: lists (`listsN`, when `app.cloudLists.status === 'ready'`), own items, sources, sets and rule cards in one line (`hbItemsN`, `hbSourcesN`, `hbSetsN`, `hbRefsN`, when `app.homebrew.status === 'ready'`), a line with count zero left out, and one fixed line «Ссылки на списки и запросы на покупку.» A count never read is never drawn. Departures from the mock: no dialog or sheet at any width (the mock needs a keyboard-docking sheet, R7-1, which no shipped sheet has); no «Сначала скачать данные» button («Ваши данные» sits one panel above). | The inline confirm keeps the focus rule (the typed field takes it, «Отмена» returns it to «Удалить аккаунт...») and the keyboard problem never arises, because the page scrolls. A34 asks for a summary and a stronger danger action, and both fit inline. Accepted: the confirm is a panel unfold, not a modal. The list can undercount if another device wrote since the last read; it cannot overcount. |
| J12 | The error pages use `ErrorPage`: the unknown address and the retired print link, the missing and failed print set, the page that threw, and the editor's missing state. Table in S7. The generic not-found is the new `NoPage.svelte`; the 80-character address cut of `NoItem` moves to `shortPath(hash, lang, max)` in `lib/address.ts` (the second use). The skeleton panels and the whole-page failed read of mock 7 are not built (J13). The `h1` of an error page is its cause; the page name stays in the tab title (rule 7, a departure named in `FEATURES.md`). | C32. `App.svelte`'s `notFound` title «Предмет не найден» is false for an account page in a build with no sign-in or an old list link. Extract on the second use. |
| J13 | Loading and failure of `/account`: the unknown session draws the heading and `LoadState` (rule 6); there is no whole-page failed read to draw (the identities and the lists reads fail in their own panels, as shipped). `/p/` loading stays `PageTitle` plus `LoadState`; a failed `/p/` read is `ErrorPage` with the primary «Повторить» (rule 6: the failure replaces the page). No skeleton. Departure from the mock (skeleton panels). | A skeleton is a new pattern with no owner direction; `LoadState` is rule 6. |
| J14 | New `Button` variant `danger-fill`: `background: var(--danger)`, `border-color: var(--danger)`, `color: var(--ink-on-gold)` (the error toast's pair, about 5.6:1). Its first and only caller is the account's «Удалить навсегда». `danger` stays for the other delete buttons. | "Add no variant before something uses it": this one has its caller. The "Buttons" departure of section 4. |
| J15 | The generic-page `Empty` gaps: `TablesPage`'s own-items empty state draws `Empty title={t.hbEmptyTitle}` (batch 6's key) with the glyph and a primary «Новый предмет»; `hbEmptyTable` goes if nothing else reads it. | C60. The plate had no title. |
| J16 | D8 (verify): the typed word follows the interface language at the moment of typing (`typedOk` reads `t.deleteWord`). The live check is one probe in the built app; the outcome is "artefact of the capture" and `handoff.md` says so. The golden's `enter` types the word of the page's language when the driver exposes it, else the entry's `why` keeps today's note. | D8 is a `verify` row. No behavior change. |
| J17 | A decision file records J1 to J6, J9 to J14 (S10). | They outlive the task. |

## Owner questions (default taken; none blocks)

- Q7-1. The kind chips change from visibility toggles to a filter pick (J3). The old behavior is
  still reachable (pick the other two). Recommended later: nothing; the owner sees it on the live
  site. If the owner wants the toggles back, the change is `SearchPage`'s chip handlers and the
  sheet's two props.
- Q7-2. The delete confirm stays inline (J11), where the mock draws a dialog and a keyboard-docking
  sheet. If the owner wants the sheet, R7-1 needs a keyboard-aware `Sheet` first (a
  `visualViewport` port), which is a batch of its own.

## Placed items (the orchestrator folds these into `plan.md`; this brief cannot edit it)

- Section 8, row "4-8, 9a, 9b": replace "1" for batch 7 with 32-43 minutes of extra gates (see
  "Gate cost").
- Section 14: the two rows `#/search ~ searched` and `#/account as gm1` become `shipped: true`. No
  row is added.
- Batch 8, acceptance: "`/lists/<uuid>` not found (A18) and the sign-in variant draw `ErrorPage`;
  `ListPage` has no `PageTitle` not-found left." Batch 9a, acceptance: "`/s/` with an unknown token
  draws `ErrorPage` (A21); `TableRows`' `ontoggleall`, its strip, the `.selall` rules and the
  `selectAll` key go with `SharedListPage`'s last use."
- Batch P: keeps the wording and the `ErrorPage` of the `/p/` branches of S7; `printColor`,
  `printBW`, `printStd` and `printCompact` are shared with the account's `Seg`s, so QP.7's short
  labels reach both at once; `KeepNote` leaves with batch P as before.
- Batch 10: nothing new from this batch; `subSearch` stays as the lead.
- Plan review: not required for batch 7 (see the end of this file).

## In scope

- The outline of section 7, "Batch 7", every line, with the superseding noted in "Acceptance
  criteria".
- New: `Marked.svelte`, `NoPage.svelte`.
- Changed: `SearchPage`, `AccountPage`, `App.svelte` (the not-found, retired-print and boundary
  branches), `PrintPage` (its `!valid`, `gone` and failed branches), `HomebrewEditor` (the missing
  state, only if batch 6 left it as `PageTitle`), `NoItem` (uses `shortPath`), `TablesPage` (the
  own-items empty state), `RowMain` and `TableRows` (J7, J8), `Button` (J14), `lib/std.ts`,
  `lib/search.ts`, `lib/address.ts`, `state/app.svelte.ts` (`pickKind`, `resetKinds`),
  `ports/fake-cloud.ts` (a `print` hold), `lib/dict.ts`.
- The browser suites, the goldens and the prose that name a moved control.

## Out of scope

- The `/p/` page itself: `printEmpty`, `signInToPrint`, the print bar, the switches, the sheet, the
  preview, `KeepNote` (batch P).
- `/lists/<uuid>` and `/s/` not-found pages (batches 8 and 9a), `ListsPage`, `SharedListPage`,
  `ListPage`, `FilterBar`, `BatchBar`, `HomebrewPage`'s empty states (batch 6).
- `PageHead`, `Sheet`, `FilterPanel`, `Menu`, `MoreMenu`, `SelBar`, `SelectionBar` (shipped; this
  batch only calls them).
- The roller's use of `app.kinds` and `toggleKind` (batch 5).
- A keyboard-aware sheet (Q7-2), a skeleton pattern, the mock's weapon/armor kinds, the «Сначала
  скачать данные» button.
- `routes.json`, `llms.txt`, `CONTRACTS.md`, the store, the cloud port.

## Facts read from the code (38767ca4, 2026-11-04; batch 4 files are in flux)

1. `SearchPage` draws `PageHead` (title, `subSearch` plus `subSearchOwn`, `help={null}`, so the pin
   is round up to 760 px), then one `Panel` with `SearchBox`, a `Field` «Тип» holding three gold
   `Chip`s that call `app.toggleKind(kind, KINDS)`, and the `Switch` «Свои предметы» when the
   account holds an item. Under it: `Empty` with `startTyping` or `nothing`, or `TableRows`
   (`primary`, no `ticks` prop, so the tick column is always on) with `ontoggleall` (the strip) and no
   `terms`. The line `.scount` reads «300 из N» past the cap.
2. `app.kinds` is shared by the roller (`StdPanel`, `AltPanel`: `LOOT_KINDS`) and search (`KINDS`).
   `toggleKind` refuses to turn the last one off and says `keepOneKind`. A pick of «Снаряжение»
   only leaves both loot kinds off for the roller: this reaches the same state today and is not
   changed here (`handoff.md` Deferred).
3. `TableRows` draws the strip when `ticks && ontoggleall && entries.length`; its grid tile draws
   `<b>{nameOf(it, lang)}</b>` with no mark; `RowMain` builds `nameRuns` from `highlightRanges`.
4. `TablesPage` shows the pattern to copy: the effect at line 379 (opens the mode), `startSelecting`
   (line 388), `button.selmode` (line 848), `FilterPanel` with `own` (line 862).
5. `AccountPage` draws `PageTitle`, then (signed in) six panels in this order: Display (lead,
   language `Seg`, start-section select, tables `Seg`, print `Seg` plus a checkbox, notify select
   plus hint), «Вы вошли как», «Способы входа», «Ваши данные», «Выход» (with a note), «Удаление
   аккаунта» (an inline confirm: a label, `TextInput`, «Удалить навсегда», «Отмена»). Its column is
   `max-width: 70ch`. The unknown session draws the title alone. `printCompactBox` has the checkbox
   as its only reader.
6. `App.svelte` draws `PageTitle` plus a gold «На главную» for `notFound` (title «Предмет не
   найден»), `printRetired` and the boundary's `failed` snippet (the error message as the sub).
   `PrintPage` draws `PageTitle` plus `printSetGone` and «На главную» for `!valid` and `gone`, and
   `PageTitle` plus a small-retry `LoadState` for `failed`.
7. `fake-cloud.ts` holds a read by name: `lines`, `items`, `rows`, `item`, `own` (`HoldMode`).
   There is no `print`; a failed `/p/` read cannot be captured yet.
8. `printLinkRetiredSub` still says "вида /#/p/" (a hash address) while the app serves `/p/`.
9. The inventory has `#/search` (8 states plus `~ own items`, `~ own items hidden`, `~ relations`,
   `~ markup row`), `#/account` (4 states plus `~ pinned table`), `#/p/bad`,
   `#/p/set-expired1 as gm2`, `#/p/set-allgone1 as gm2`, `#/print/ci1-q1`, `#/l/ ~ retired`,
   `#/l/~AAAA`; `FIRST_SCREEN` rows at `states.js` 5187-5188 are `shipped: false`.
10. The `search` kinds label is `t.kindF` («Тип»); `t.filter` is also «Тип». `FilterPanel` builds its
    heading from `filters` and `filtersN`.

## Files expected

| Step | Files |
|---|---|
| S1 | `app/src/lib/dict.ts`, `lib/i18n.test.ts` |
| S2 | `lib/std.ts`, `lib/std.test.ts`, `lib/search.ts`, `lib/search.test.ts`, `lib/address.ts`, `lib/address.test.ts`, `state/app.svelte.ts`, `state/app.test.ts` |
| S3 | new `Marked.svelte`; `RowMain.svelte`, `TableRows.svelte`, `tables.test.ts` |
| S4 | `Button.svelte`, `button.test.ts` |
| S5 | `SearchPage.svelte`, `searchPage.test.ts` |
| S6 | `AccountPage.svelte`, `accountPage.test.ts` |
| S7 | new `NoPage.svelte`; `NoItem.svelte`, `App.svelte`, `PrintPage.svelte`, `HomebrewEditor.svelte`, `TablesPage.svelte`, `ports/fake-cloud.ts`, `ports/fake-cloud.test.ts`, `printPage.test.ts`, `shell.test.ts` or `app.test.ts` |
| S8 | `a11y.test.ts` (`COVERED`), the component tests that name a moved control |
| S9 | `tests/app/states.js`, `inventory.js`, `driver.js` if a helper is needed, `typo.js` and `hues.js` if a read breaks, about 26 goldens |
| S10 | `FEATURES.md`, `COVERAGE.md`, `STATE.md` (check), `DESIGN.md`, a new decision file, `docs/DECISIONS.md`, `tools/bundle-budget.mjs`, `.claude/README.md` |
| S11 | `handoff.md` (the Impeccable outcome) |
| S12 | none (gates) |
| S13 | `issues/57/mocks/7/built/`, `handoff.md` |

## Steps

### S1. Strings

In both languages of `dict.ts`, same keys, ASCII punctuation, «ёлочки» in RU only, no new plural form:

| Key | RU | EN |
|---|---|---|
| `searchWhat` | Что ищем? | What are you looking for? |
| `searchStartSub` | Ищет по названиям и описаниям, по-русски и по-английски сразу. | Searches names and text in Russian and English at once. |
| `searchEx1` | зелье | potion |
| `searchEx2` | меч | sword |
| `searchEx3` | лечения зелья | healing potions |
| `emptySearch` | Нет совпадений с «%q» в названиях и описаниях. | No match for "%q" in names and descriptions. |
| `clearSearch` | Очистить поиск | Clear the search |
| `rowNo` | № %n | No. %n |
| `nowhereTitle` | Страницы по этому адресу нет | No page at this address |
| `nowhereSub` | Адрес %s не открывается. Ссылка могла устареть или быть набрана с ошибкой. | The address %s does not open. The link may be old or mistyped. |
| `printSetGoneTitle` | Набор для печати не найден | Print set not found |
| `printLoadFailedTitle` | Набор не загрузился | The set did not load |
| `defaultTablesView` | Вид таблиц по умолчанию | Default table view |
| `defaultPrint` | Печать по умолчанию | Default print |
| `signedInNow` | Сейчас | Current |
| `deleteGoes` | Будут удалены: | This deletes: |
| `deleteGoesRest` | Ссылки на списки и запросы на покупку. | List links and purchase requests. |

- Change: `displayHead` (RU «Отображение на всех устройствах» / EN "Display on all your devices"),
  `displayNotify` (RU «Когда беру из чужого списка» / EN "When I take from someone else's list"),
  `yourDataHint` (RU «Списки и свои предметы одним архивом ZIP.» / EN "Your lists and items in
  one ZIP archive."), `printSetGone` (a sentence under the new title: RU «Ссылку не открывали 90
  дней, или в адресе ошибка.» / EN "Nobody opened the link for 90 days, or the address is wrong."),
  `printLinkRetiredSub` (replace "/#/p/" by "/p/" in both languages).
- Delete in both languages: `startTyping`, `displayLead`, `notifyHint`, `signOutAllHint`,
  `signedInAs`, `printCompactBox`, and `hbEmptyTable` once `TablesPage` stops reading it. Run `git
  grep -n -E "<key>"` for each first; keep a key another file still reads. `outOf` stays if
  `FilterBar` reads it. The `mdHelp`, `selectAll`, `selected` and `keepOneKind` keys stay.
- The three example strings must each return at least one hit in their language (S5 test).
- `i18n.test.ts` holds key parity.

### S2. Pure helpers and state

- `lib/std.ts`: `pickKinds<K extends string>(chosen: Chosen<K>, keys: readonly K[], key: K):
  Chosen<K>`. When every key is on, the result has only `key` on. Otherwise it flips `key`; when no
  key is left on, every key is on. `std.test.ts` holds: from all, one pick, two picks, the last pick
  off, an already-picked key off.
- `lib/search.ts`: `markRuns(name: string, terms: readonly Term[]): { text: string; mark: boolean }[]`,
  the body of `RowMain`'s `nameRuns` moved verbatim (one run `{ text: name, mark: false }` for no
  terms; an empty name returns `[]`). `search.test.ts` holds a marked middle, two ranges, a stem
  match left unmarked, no terms. Add one test: ranking over all kinds then filtering by kind gives the
  order of ranking the filtered pool (a fixture of three kinds and a tie).
- `lib/address.ts`: `shortPath(hash: string, lang: Lang, max = 80): string` = `pathOf` cut to `max`
  characters with `...` when longer. `NoItem` uses it. `address.test.ts` holds a short and a long address.
- `state/app.svelte.ts`: `pickKind(kind: Kind): void { this.kinds = pickKinds(this.kinds, KINDS, kind); }`
  and `resetKinds(): void { this.kinds = { item: true, consumable: true, equip: true }; }`, beside
  `toggleKind`. `app.test.ts` holds both. `KINDS` comes from `lib/types.ts`.

### S3. `Marked`, the tile mark and the number label

- `Marked.svelte`: props `text: string`, `terms?: readonly Term[] | undefined`; it draws `{#each
  markRuns(text, terms ?? []) as r, i (i)}{#if r.mark}<mark>{r.text}</mark>{:else}{r.text}{/if}{/each}`
  with no whitespace between the tags (the goldens are byte exact), and the `mark` rule moved from
  `RowMain` (`background: var(--surface2); color: inherit; text-decoration: underline;
  text-underline-offset: 3px`).
- `RowMain`: the `.rname` span holds `<Marked text={nameOf(it, lang)} {terms} />`; delete `nameRuns`,
  `highlightRanges` import and `.row-main mark`. Add `numLabeled?: boolean`: when set and `num` is
  set, the `.rnum` text is `t.rowNo.replace('%n', String(num))`.
- `TableRows`: the tile's `<b>` becomes `<b><Marked text={nameOf(it, lang)} {terms} /></b>`; add a
  `numLabeled?: boolean` prop passed to `RowMain`. A tile draws no `.rnum` label (the tile's
  `tile-n` badge is unchanged).
- Tests: `tables.test.ts` gains "a grid tile marks the queried words of its name" (a query on a
  grid table); `searchPage.test.ts` holds the row mark (S5); a row with no `terms` is unchanged.

### S4. `Button` `danger-fill`

Add `'danger-fill'` to the `variant` union and the rules `.btn.danger-fill` (see J14) and
`.btn.danger-fill:hover` (`border-color: var(--danger-text)`). `button.test.ts` gains one case that
the class is set; the account test holds the caller. Update the comment above the union.

### S5. `SearchPage`

Replace the page body. Keep `q`, `terms`, `statLine`, `hay`, the `setSelectable` effect and
`onDestroy`.

- Derived: `band = app.band` (batch 3's port value), `all = rankHits(browse.searchable, terms,
  statLine, hay)` (empty with no terms or no `browse`), `matched = all.filter((it) =>
  app.kinds[kindOf(it)])`, `found = matched.slice(0, 300)`, `picked = KINDS.filter((k) =>
  app.kinds[k])`, `narrowed = picked.length < KINDS.length`, `kindState: FilterState = narrowed ? {
  kind: picked } : {}`, `rows: FacetRow[] = [{ group: 'kind', label: t.kindF, values: KINDS.map((k) =>
  ({ value: k, label: t[KIND_LABEL[k]] })) }]`, `own` as today.
- Head (J1):

```svelte
{#if band === 'narrow'}
  <div class="headrow">
    <h1 class="page-h">{t.search}</h1>
    <MoreMenu {app} id="search-more" size="sm">{#snippet children(close)}
      <PinItem {app} onpicked={close} />
    {/snippet}</MoreMenu>
  </div>
  <p class="vh">{intro}</p>
{:else}
  <PageHead {app} title={t.search} sub={intro} help={null} />
{/if}
```

  `.headrow` is a flex row (`justify-content: space-between`, `align-items: center`, `gap: 10px`,
  `margin-bottom: 8px`); `.page-h` takes the type of `PageHead`'s (`--t-page`, `--h-page-weight`,
  `--h-page-spacing`, `margin: 0`). The `h1` stays in the DOM at every width.
- Search row (J2): `.searchrow` (flex, gap 8, wrap off) with `div.grow` > `SearchBox`
  (`value={q}`, `placeholder={t.searchShort}`, `label={t.searchPh}`, `focus`), then, when `band ===
  'narrow'`, `Button size="sm" variant={narrowed ? 'toggle' : 'plain'} expanded={filterOpen}
  bind:el={filterToggle}` reading `narrowed ? t.filtersN.replace('%n', '1') : t.filters` (the count
  is the number of picked kinds: `picked.length`), then `button.selmode` copied from `TablesPage`
  (shown when `!app.selecting && found.length > 0`). Copy `TablesPage`'s `.selmode` rules.
- Kind row from 761 px (`band !== 'narrow'`): `ChipRow` with `Chip neutral label={t.allShort}
  on={!narrowed} onclick={() => { app.resetKinds(); }}` then one `Chip` per kind (`on={narrowed &&
  app.kinds[kind]}`, `onclick={() => { app.pickKind(kind); }}`), then, with own items, `Switch`
  «Свои предметы» at the end of the row (J2).
- Sheet (up to 760 px): `{#if band === 'narrow'}<FilterPanel {app} {rows} picked={kindState}
  shown={found.length} {band} open={filterOpen} onclose={() => { filterOpen = false;
  filterToggle?.focus(); }} onpick={(_, v) => { app.pickKind(v as Kind); }} onclear={() => {
  app.resetKinds(); }} onreset={() => { app.resetKinds(); }} own={own > 0 ? { on:
  app.homebrewShown, onchange: () => { app.toggleHomebrew(); } } : undefined} />{/if}`. Close the
  sheet when the band leaves `narrow` (`$effect.pre` on `app.band`, as `TablesPage`'s `seenBand`).
  `FilterPanel` is never mounted at `mid` or `wide` here, so no column draws.
- Count line (J5): `{#if terms.length && (narrowed || matched.length > 300)}` one `p.count` (the
  catalog's count-line look; copy its CSS: `--t-data`, `--muted`, one line with an ellipsis for the
  values, the count never cut) with `[picked labels joined by ', ' + ' · ']` and
  `t.shownOf.replace('%n', String(found.length)).replace('%m', String(all.length))`.
- Body: `{#if !index}<NoData/>`; `{:else if !terms.length}` the start `Empty` (J6) with three example
  chips (`searchEx1..3`; a press sets `q`, and the box keeps the focus; the `SearchBox` follows `value`);
  `{:else if !found.length}` the nothing-found `Empty` (J6): the cause is `emptyBoth` (`%q` the trimmed
  query, `%v` the picked kind labels) while a kind is picked, else `emptySearch`; the primary
  `Button variant="primary"` reads `narrowed ? t.resetFilters : t.clearSearch` and calls
  `app.resetKinds()` or sets `q = ''`, then moves the focus (rule 20: `filterToggle` up to 760 px or
  the first kind chip while `narrowed` was true, else the search box). Use one pass with a function for
  the `%q`/`%v` fill, as `TablesPage.emptyCause` does, so `$&` in a query stays text.
  `{:else}` `TableRows` (J4) with `primary`: the first row is the page's primary content, because
  `/search` has no section head before it.
- The `own` switch outside the sheet draws only from 761 px; below it the sheet's first row carries it
  (no double draw: `FEATURES.md` "Tables and search" already says so for the catalog).
- Remove `Panel`, `Field`, `ChipRow` use for the old panel, `isLastOn`, `plural` stays for `intro`.

### S6. `AccountPage`

- Unknown session (`app.user === undefined`): `PageTitle title={t.account} sub=""` then `<LoadState {t}
  failed={false} text="" onretry={() => undefined} />` (the loading line only; rule 6 and 7).
- Layout (J9): inside `.col`, wrap the panels in `div.acc` holding two `div.colA` and `div.colB`; below
  1000 px `.acc` is one column (`.colA` then `.colB`), from 1000 px `display: grid; grid-template-columns:
  repeat(2, minmax(0, 1fr)); gap: 0 16px; align-items: start`, and `.col`'s `max-width` becomes
  `1100px` there (the signed-out page keeps 70ch). `.colA`: Display, «Способы входа». `.colB`: «Ваши
  данные», «Выход», «Удаление аккаунта». Keep the panels' `margin-top: 16px` style prop; the first
  `Panel` of each column carries `primary` only on `.colA`.
- Display (J10): `Field label={t.displayHead} heading`; no lead; rows: `Seg neutral` language;
  the start-section `select`; `defaultTablesView` with `Seg neutral`; `defaultPrint` holding two `Seg
  neutral small`: color (`printColor`, `printBW`) and size (`printStd`, `printCompact`, label
  `printSize`) writing `app.setPrintBW` and `app.setPrintCompact(v === 'compact')`; the notify row
  (`displayNotify`, the select, no hint, no `aria-describedby`). Delete the checkbox, `.chk` CSS and
  `.sethint`. `.wb` (a flex row with `flex-wrap: wrap; gap: 8px`) holds the two print `Seg`s (D7).
- «Способы входа» (J10): when `ids` is read, the rows as today, with the badge `signedInNow` (a
  neutral `Badge`) after the provider name on the row whose provider equals `session.provider`; the
  `identity ? identity.email : notConnected` line, the single Disconnect/Connect button and the
  `alreadyLinked` alert stay. When `ids` is null or `idsFailed`, draw the old `.who` line above the
  loading or failed note (`session.email` bold, then `via`). Delete the «Вы вошли как» panel.
- «Ваши данные»: the one-line hint, the conditional `zipNoArt`, the button, the `LoadState` on a failed
  read. «Выход»: the two buttons, no note.
- Delete confirm (J11, J14): inside the open confirm, before the label: `<p class="goes">{t.deleteGoes}</p>`
  and a `ul` built by `goes` (derived): `cl = app.cloudLists` with `cl?.status === 'ready' && cl.lists.length
  > 0` -> `plural(cl.lists.length, t.listsN, app.lang)`; `hb = app.homebrew` with `hb?.status === 'ready'`
  -> one line joining, for each count above zero, `plural(items, t.hbItemsN)`, `plural(books,
  t.hbSourcesN)`, `plural(sets, t.hbSetsN)`, `plural(rules, t.hbRefsN)` with `', '` (read `store.items.length`,
  `store.books.length` and the cards by kind as batch 6's tab counts do; the default source is not a
  book); then the fixed `deleteGoesRest`. The final button is `variant="danger-fill"`; «Отмена» stays
  `ghost`. The typed field, `typedOk`, `deleting` and the focus rules do not change. `.goes` and `ul`
  take `--t-small` and `--muted`, `margin: 0 0 6px`, `padding-left: 20px`.
- D8: one probe in the built app (EN, type «delete», the final button enables); the outcome goes to
  `handoff.md`. In `inventory.js` the entry `#/account ~ delete confirmation as gm1` types the word of
  the page's language if `d` exposes it (read `driver.js` for `lang`); else it keeps the `why` note.

### S7. Error pages

| State | Today | After |
|---|---|---|
| Unknown address, `/lists` or `/account` in a build with no sign-in, an old list link | `App`'s `notFound` snippet: `PageTitle` «Предмет не найден», gold «На главную» | `<NoPage {app} />`: `ErrorPage` title `nowhereTitle`, the sentence `nowhereSub` with the address in `<code>` (`shortPath`, split at `%s` as `NoItem` does, never `{@html}`), actions: primary «На главную» (`toStart`, `sectionHash('roll/std')`), then «Открыть таблицы» (`openTables`, `sectionHash('tables')`) |
| Retired print link `#/print/...` | `PageTitle` + `printLinkRetiredSub` + gold «На главную» | `ErrorPage` title `printLinkRetired`, sentence `printLinkRetiredSub`, the same primary «На главную» |
| `/p/` malformed id or a gone set | `PageTitle printTitle` + `printSetGone` + «На главную» | `ErrorPage` title `printSetGoneTitle`, sentence `printSetGone`, primary «На главную», then «Открыть таблицы» |
| `/p/` failed read | `PageTitle` + small `LoadState` | `ErrorPage` title `printLoadFailedTitle`, sentence `printLoadFailed`, primary «Повторить» (`attempt++`) |
| A page that threw (`svelte:boundary` `failed`) | `PageTitle pageError` + the message as the sub + «Обновить страницу» | `ErrorPage` title `pageError`, the message as plain text, primary «Обновить страницу» (`reset`) |
| The editor's missing item (only if batch 6 left `PageTitle` + «К моим предметам») | `PageTitle notFound` | `ErrorPage` title `notFound`, sentence `notFoundSub`, the same button |

- `PrintPage` keeps every other branch as it is (batch P). `NoPage.svelte`: props `app`, about 25
  lines, a sibling of `NoItem`; `NoItem` moves its address cut to `shortPath` and keeps its own text.
- `ports/fake-cloud.ts`: add `print?: HoldMode` to `FakeCloudOptions['hold']`, read it in the
  print-set read with `heldAnswer(options.hold?.print)`, and allow the name `print` in the `?hold=`
  parser (line 2314 and following). `fake-cloud.test.ts` holds a `print:fail` answer.
- `TablesPage` (J15): the own-items empty state draws `<Empty title={t.hbEmptyTitle}
  glyph="kindItem">` with `<Button variant="primary" href={app.href(homebrewItemHash(null))}
  sameTab><Icon name="plus" />{t.hbNewItem}</Button>` and no sentence. If batch 6 did not add
  `hbEmptyTitle`, add it with its value from `plan-6.md` S1.
- Rule 7: the `h1` of each of these pages is the `ErrorPage` title (a departure named in `FEATURES.md`).
  The status region says the title once on arrival, as batch 4's `NoItem` does.

### S8. Unit tests and the `COVERED` list

`a11y.test.ts` `COVERED` gains `Marked.svelte` (`'searchPage.test.ts and tables.test.ts, the marked
rows and tiles'`) and `NoPage.svelte` (`'app test or shell.test.ts, the not-found page'`). Each new
or changed test file ends in `expectNoA11yViolations`. See "Tests".

### S9. Suites and states

`tests/app/states.js`:

- `FIRST_SCREEN` (lines 5187-5188): the two rows become `{ shipped: true }`. A built value past the
  limit is logged in `handoff.md` and the AFK decisions file, as section 14 says; do not move a limit
  without the log.
- Case 93 (new; the next free number after batch 6's 92, check the list), "the search page holds from
  320 to 1180 px":
  1. 760x800, 390x844, 360x640 and 320x568 on `#/search ~ searched` (RU, EN): the `h1` is visible
     up to 760 px with «Ещё» on its row; the search row (box, «Фильтры», «Выбрать») is inside 0..width on
     one line and the box is at least 140 px; no horizontal scroll.
  2. 761x768 and 1180x720: `PageHead` with the labeled pin, the kind chips on one row (or wrapped whole),
     «Выбрать» last in the search row, no «Фильтры» button.
  3. «Ещё» (360) opens a `role="menu"` of the pin; Escape closes it and the focus returns to «Ещё».
  4. The sheet at 360: «Фильтры» opens it with «Тип» and, as `gm1`, «Свои предметы» first; a pick lights
     «Фильтры · 1» and the count line names the kind; Escape returns the focus to «Фильтры».
  5. A press of «Выбрать» opens the mode, focuses the bar's «Все»; «Все» ticks the found rows; «Снять
     выделение» returns the focus to «Выбрать». No `.selall` strip exists in `main`.
  6. The 300 cap: a query that matches over 300 draws «Показано 300 из N» and 300 rows; the page scrolls.
- Case 94 (new), "the account holds its layout and its confirm": at 360x640 and 1180x720 as `gm1`, RU and
  EN: no `.chk`; the print row's two `Seg`s are inside 0..width; no panel named «Вы вошли как»; at 1180
  the two columns have tops within 2 px; the delete confirm lists «Будут удалены:» and the final button
  has a filled background (`getComputedStyle`), is disabled until the word is typed, and the focus is
  in the field after «Удалить аккаунт...» and back on that button after «Отмена».
- Adapted cases (read each; `git grep -n -E "search|account|Выбрать все|startTyping|Снаряжение"
  -- tests/app/states.js tests/app/contracts.js tests/app/hues.js tests/app/typo.js tests/e2e/flows.mjs`):
  every read of the old three-chip row, the strip, the always-on search ticks, the account's checkbox
  and the "Вы вошли как" panel changes. The sweep (`sweep.js`) pages `/search` and `/account` stay;
  a 320 px read of the head is case 93.
- `inventory.js` (about 6 changed ids, about 10 new, about 26 re-seeded): see "Goldens and new
  states". Keep the ids that stay. A new open or pressed state has its entry, RU and EN golden and an
  axe case.
- `tests/app/hues.js`: on `/search` the only gold is a picked kind chip and the focused box; on
  `/account` no Seg is gold and the final delete button is the one danger fill. If a read breaks,
  adapt it.

### S10. Prose, in the same commit

- `FEATURES.md`: "Tables and search" (the `/search` head and rows: the h1 row and «Ещё» up to 760 px, the
  search row, the kind chips and the sheet, the pick model, the count line, the selection mode, the
  empty states, the marked words on rows and tiles, the number label; delete "`/search` and the shared
  page keep their ticks and their «Выбрать все (N)» strip until their batches" for `/search`, keep it
  for the shared page; the own-items switch placement; the own-items table's empty state). "Account"
  (the section list and order, the two columns from 1000 px, no lead, the new row labels, the print
  `Seg`s in place of the checkbox, the merged sign-in panel, the delete summary and the filled danger
  button, the loading line, the single-sentence data hint, no notes). "Print" (the retired, missing
  and failed pages). "Chrome" (the error-page `h1`). Consistency rules: 3 (the account delete's
  departure also lists what goes), 6 (the failed `/p/` read is the primary retry), 7 (add the error
  pages' `h1` departure), 15 (the notify select's label and the removed hints).
- `COVERAGE.md`: the rows of the new tests, cases 93 and 94, the changed counts, the state count.
  `STATE.md`: check `git grep -n -E "kinds|homebrewShown|selecting" -- docs/specs/STATE.md`; the kinds row
  says the pick model.
- `DESIGN.md`: see "DESIGN.md rules this batch writes".
- Decision file `docs/decisions/<date>-search-and-account-follow-the-list-head-and-the-error-page.md`
  (template `.claude/templates/decision.template.md`): Task `57`; Decision: J1 to J6, J9 to J14;
  Rejected: a kind menu with a switch inside (an invalid `role="menu"` child), a weapon/armor split of
  the kinds (a new feature), a dialog or sheet for the account delete (needs a keyboard-aware sheet),
  skeleton panels (a new pattern), the mock's trailing number badge (moves the row anatomy), dropping the
  pin on `/search` (a feature loss); Accepted trade-off: the press-to-hide kind chips invert, two taps to
  tick the found rows, a one-item «Ещё» on a phone, the delete confirm as an unfold. Then `node
  tools/decisions.js`.
- Budget: after the measured totals, `tools/bundle-budget.mjs` and `.claude/README.md` rise by the
  standing rule of the file (see "Verification" 6).

### S11. Impeccable

The orchestrator runs `polish` and `harden` on `SearchPage`, `AccountPage`, `NoPage` and the `/p/` error
branches at 360 and 1180 px; `handoff.md` gives the outcome. Fallback:
`impeccable:impeccable-finish-reviewer`.

### S12. Gates

See "Verification".

### S13. Evidence

`issues/57/mocks/7/built/shoot.js`, from `mocks/6/built/shoot.js`: at 360x640 and 1180x720, RU and EN:
`/search` (start, searched, the kind sheet, «Ещё», nothing found with a kind picked, the selection with one
tick, own items), `/account` as `gm1` (closed, the delete confirm with the word typed) and signed out, the
unknown address, the retired print link, `/p/bad`, `/p/set-expired1`, plus 761x768 for `/search` RU and EN. The
set is evidence, not a gate.

## Acceptance criteria

Each line is observable in a suite, a unit case or the built app. `plan.md` section 7 "Batch 7" and
"Each of batches" are first; the placement lines follow.

- Section 7, line 1 (the `/p/` rows C29, C30, C31 and the first-screen row): not in this batch; batch P
  holds them (`plan.md`). This batch's `/p/` work is the error branches of S7.
- Section 7, line 2 (the error-page pattern on `/i/nope`, `/h/` gone and the other error pages): the six
  states of the S7 table draw `ErrorPage` (heading, one cause sentence, the actions with the primary first,
  no icon, no plate); `itemPage.test.ts` still holds the batch 4 pages; `printPage.test.ts`, the app test
  and `shell.test.ts` hold the others, each with `expectNoA11yViolations`; the status region says the title.
- Section 7, line 3 (clarity inventory, account): the settings scope sentence, the notify question, the ZIP
  manual (A33) and the sign-out-everywhere note are gone; the labels «Отображение на всех устройствах»,
  «Вид таблиц по умолчанию», «Печать по умолчанию», «Когда беру из чужого списка» and the one-line data hint
  say what they did; no `p.hint` of the old five remains (`accountPage.test.ts`, the account goldens).
- Section 7, line 4 (the error-page pattern reaches the `/p/` not-found and retired-link pages): the
  retired link and the missing or gone set draw `ErrorPage` with the wording of S1; the failed read draws it
  with the primary «Повторить» (`printPage.test.ts`, the `hold: 'print:fail'` golden). Batch P keeps the
  wording.
- Section 7, line 5 (DESIGN.md "Buttons", the danger fill in the delete confirm): `danger-fill` exists, its
  one caller is the account's final button, and "Buttons" says so; the empty-state plate and the bottom sheet
  are checked against `/search`.
- Section 7, line 6 (M2-2, the pin on `/search`): up to 760 px no round pin draws; the pin is an item of
  «Ещё» (`PinItem`) on a visible `h1` row; from 761 px the labeled pin stays in `PageHead` (case 93 items 1
  to 3; `searchPage.test.ts`).
- C13: on first load no kind chip is gold; «Все» is neutral pressed; a picked kind is gold (`searchPage.test.ts`,
  `hues.js`, `_search*` goldens). J3 holds: from «Все» one press picks one kind, the last pick off returns to
  «Все»; the roller's `toggleKind` is unchanged (`std.test.ts`, `app.test.ts`, `stdPanel` tests untouched).
- C14: the page draws no instruction sentence; the start state shows three example chips, each of which
  returns at least one hit in RU and EN (`searchPage.test.ts` runs `rankHits` over `data.json`); a press fills
  the box and the focus stays there.
- C15 (J8): a `/search` row draws «№ 89» / "No. 89"; a table row draws the bare number (`searchPage.test.ts`,
  `tables.test.ts`).
- C16 and C60: the nothing-found state draws the plate with the glyph, the title «Ничего не найдено», a cause
  naming the query or the picked kinds, and one primary («Очистить поиск» or «Сбросить фильтры») that
  returns the focus per J6; the own-items table's empty state draws a title and a primary «Новый предмет»
  (`searchPage.test.ts`, `tables.test.ts`, the goldens).
- Q3-S (`context.md`): `/search` draws no «Выбрать все (N)» strip; ticks draw only in the selection mode;
  «Выбрать» opens it, the bar's «Все» ticks the found rows, «Снять выделение» leaves it and returns the focus
  to «Выбрать»; `TableRows` still draws the strip for `/s/` (`searchPage.test.ts`, `sharedListPage.test.ts`
  unchanged, case 93 item 5).
- N7 of `reviews/3.md` (J7): a grid tile and a `/search` row mark the queried words of the name; the run logic
  lives once in `markRuns` and `Marked`; `RowMain` has no `nameRuns` (`tables.test.ts`, `searchPage.test.ts`,
  `search.test.ts`).
- Handoff Deferred, "The Account page's Display note and its default-view wording": the Display lead goes,
  the rows say "по умолчанию", and the tables and print rows set the defaults only (`accountPage.test.ts`);
  `FEATURES.md` "Account" and "Tables and search" say so.
- A31, A32 (J9, J10): from 1000 px the page has two columns with the section order of the spec; one panel
  names the sign-in methods, each provider's email once, and the badge «Сейчас» marks the provider in use;
  while the identities are unread the old line draws; there is no «Вы вошли как» panel (case 94,
  `accountPage.test.ts`).
- D7 and N7-2: the print default is two `Seg`s that wrap inside 360 px; the checkbox and `printCompactBox`
  are gone (case 94, `accountPage.test.ts`).
- A34 and D8 (J11, J16): the open confirm lists «Будут удалены:» with only the counts the page read, ends in
  a filled danger button, keeps the typed-word rule, and the focus rules (field on open, the opener on
  «Отмена»); the D8 probe's outcome is in `handoff.md` (`accountPage.test.ts`, case 94, the confirm golden).
- Account loading (J13): an unknown session draws the heading and the loading line; the identities and lists
  failures draw in their panels as before (`accountPage.test.ts`).
- Seg rule (batch 6): every account `Seg` is neutral (`hues.js`).
- Every new state has an inventory entry, a RU and EN golden and an axe case (see "Goldens and new
  states"); the states that cannot be captured (the unknown session) are held by a component test.
- Specs, DESIGN.md rules and the decision file of S10 match what ships; `COVERAGE.md` rows agree.
- `FIRST_SCREEN`: `#/search ~ searched` and `#/account as gm1` are `shipped: true` and pass at 360x640 and
  1180x720 in RU and EN (case 83); the offsets are in `handoff.md`.
- Each new component has an axe case in `a11y.test.ts` and is reached by a test; the artwork guard still
  passes (`CARD_HEAD_SHA256` does not move: `RecordCard` is untouched).
- From "Each of batches 2-9": the detector line, American spelling in new prose, the screenshot set in
  `mocks/7/built/`, the `polish` and `harden` outcome, `routes.json` unchanged.
- The bundle budget is raised by the standing rule with the measured figures.
- The gates pass and CI is green on the pushed tip.

## First-screen rows (plan section 14)

| Row | 360x640 (limit 256) | 1180x720 (limit 288) | Flag |
|---|---|---|---|
| `#/search ~ searched` | the mock 217 (the h1 row, the search row, the first row); expect 234 to 250 once the h1 row and the line boxes of Source Sans 3 are counted, and 252 to 256 with a picked kind (the count line adds about 18 px); the catalog measured 234 and 252 the same way | the mock 223; with the lead line about 255 | `shipped: true` |
| `#/account as gm1` | the mock 177; today 241 RU and 218 EN; the removed lead (two lines) makes it lower | the mock 129; today 170 | `shipped: true` |

Today's built values: 533 / 467 and 419 / 419 for search, 241 / 218 and 170 / 170 for the account. The lead
line from 761 px is a departure from the mock (J1). If a built value passes the limit, log it in `handoff.md`
and the AFK decisions file and name the fix: hide the lead from 761 px (it removes visible text: the
orchestrator logs the choice and the owner may reverse it). Do not move a limit without the log. The search
rows are the page's `data-primary`; the account's first `Panel` is.

## Goldens and new states

About 26 existing goldens move: the 12 `_search*` (all of them: the head, the chips, the strip, the ticks),
the 5 `_account*`, `_p_bad`, `_p_set_expired1_as_gm2`, `_p_set_allgone1_as_gm2` (only if its heading moves: read
it), `_print_ci1_q1`, `_l_retired`, `_l_AAAA`, `_tables_homebrew*` empty state, and every golden that draws a
`Marked` name (none expected: a row with no terms has the same DOM). A moved file outside those families is a
defect to read, not to re-seed: especially `_tables_eq_*`, `_roll_*`, `_lists_*`, `_s_*`, `_homebrew_*`, `_i_*`.
`#/search ~ kind off` is retired (the toggle model). The re-seed runs the four shards.

New inventory entries (a state keeps both languages in one file; `width: 360` where named):

| State id | Width | Entry |
|---|---|---|
| `#/search ~ narrow` | 360 | the h1 row with «Ещё», the search row, the start state with the examples |
| `#/search ~ more` | 360 | press «Ещё»: the pin item |
| `#/search ~ filter sheet as gm1` | 360 | type a query, press «Фильтры»: the sheet with «Свои предметы» and «Тип» |
| `#/search ~ kind picked` | default | type a query, press «Снаряжение»: the lit chip, the count line (replaces `~ kind off`) |
| `#/search ~ selecting` | default | type a query, press «Выбрать», tick one: the bar |
| `#/search ~ nothing found, kind picked` | default | a query with no hit and a picked kind: the cause with the kind and «Сбросить фильтры» |
| `#/tables/eq_weapon ~ grid searched` | default | the grid view with a query: the marked tile names (N7) |
| `#/account as gm1 ~ narrow` | 360 | the single column, the print row wrapped |
| `#/account as gm1 ~ delete confirmation` | default | the existing entry, re-seeded with the list (a second entry with `width: 360` is not needed) |
| `#/p/set-twocards ~ load failed as gm2` | default | `hold: 'print:fail'`: `ErrorPage` with «Повторить» |
| `#/zzz-nowhere` | default | an unknown address: `NoPage` (the address in `<code>`) |

`#/search ~ searched`, `~ capped`, `~ nothing found`, `~ own items`, `~ own items hidden`, `~ relations`, `~ markup
row`, `~ stat line`, `~ words in any order`, `~ a row ticked` keep their ids; their `why` and `enter` change only
where a control's name or place did (`~ a row ticked` presses «Выбрать» first). The unknown session has no
golden: the fake answers at once; a component test holds it. Seed the new files with the shard run; do not edit
a golden by hand.

## DESIGN.md rules this batch writes

- "Buttons": `danger-fill` is the one irreversible press of a confirm (the Alarm Red fill with Ink on Gold, the
  toast's pair); `danger` stays the outlined default. The section 4 departure row is closed.
- "Empty state": the start state of a search (a title, one sentence, example chips) and the nothing-found state
  (cause, one reset) join the catalog's; the plate holds one primary at most.
- "Error page": the pattern now covers every page-level failure (an unknown address, a retired link, a missing
  or failed set, a page that threw); the `h1` is the cause.
- "Layout": the `/search` head (the h1 row with «Ещё» up to 760 px, where there is no picker to fill the row)
  and the account's two columns from 1000 px; the First-Screen table lists both.
- "Chips": «Все» neutral plus gold picks is the model for any filter row, including search's three kinds.
- "The Same Label Rule": the interim note drops `/search` from the pages that keep the round pin up to 760 px.
- "Segmented control": the account's pickers are neutral (checked, not rewritten).

## Tests

| File | Cases |
|---|---|
| `searchPage.test.ts` | the head in both bands (h1 row and «Ещё» with the pin up to 760 px, `PageHead` from 761 px); the neutral «Все» and the pick model through the chips and through the sheet; the sheet's `own` row; the count line (narrowed, capped, both); the start state and its three examples (each hits in RU and EN); the nothing-found cause for a query, a kind, both, and the two resets with their focus; ticks only in the mode; no strip; «Все» ticks the found rows; the mark on a row; «№ 89»; axe |
| `accountPage.test.ts` | the loading line; the two columns' DOM order; no lead, no hints, no checkbox; the print `Seg`s write the defaults; the merged sign-in panel with its badge and its fallback line; the confirm's list (counts only when read; a zero count left out), the filled final button, the typed word and the focus rules; axe |
| `printPage.test.ts` | the retired and gone pages through `ErrorPage` (titles, sentences, actions); the failed read's primary retry and a retry that reads again; axe |
| `shell.test.ts` or the app test | `NoPage` for an unknown route and for `/account` with no cloud (the address in `<code>`, cut at 80 characters); the boundary's `ErrorPage` and its reset; axe |
| `tables.test.ts` | a grid tile marks the query; the own-items empty state's title and primary; a table row's bare number |
| `button.test.ts` | the `danger-fill` class |
| `lib/std.test.ts`, `lib/search.test.ts`, `lib/address.test.ts`, `state/app.test.ts` | `pickKinds`; `markRuns`; rank-then-filter equals filter-then-rank; `shortPath`; `pickKind` and `resetKinds` |
| `ports/fake-cloud.test.ts` | a `print:fail` hold |
| `lib/i18n.test.ts` | parity with the new keys, the deleted keys absent |
| `a11y.test.ts` | the two new rows |
| `tests/app/states.js` | cases 83 (two rows), 93, 94, the adapted cases |

## Verification

In this order, after S10. One command per call. A browser suite does not run locally (`plan.md` section 7,
the writer's local gates).

1. While editing: `npx vitest run app/src/components/searchPage.test.ts
   app/src/components/accountPage.test.ts app/src/components/printPage.test.ts
   app/src/components/shell.test.ts app/src/components/tables.test.ts
   app/src/components/button.test.ts app/src/components/itemPage.test.ts
   app/src/components/record.test.ts app/src/components/homebrewEditor.test.ts
   app/src/components/sharedListPage.test.ts app/src/components/a11y.test.ts
   app/src/lib/std.test.ts app/src/lib/search.test.ts app/src/lib/address.test.ts
   app/src/lib/i18n.test.ts app/src/state/app.test.ts app/src/ports/fake-cloud.test.ts`, then `npm
   run lint:untyped` and `npm run lint:typed`. If a file name is wrong, `git ls-files --
   "app/src/**/*.test.ts"` gives the right one.
2. `node --test tools/artwork/lib.test.mjs` (the card head did not change; it must pass).
3. `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to 4, one at a time.
   Then `git diff --stat tests/app/snapshots`: only the families of "Goldens and new states" and the new files.
4. `node tools/decisions.js`.
5. `npm run check:built` (the unconfigured budget).
6. The configured budget: `npm run build` with placeholder `VITE_SUPABASE_*` values (this worktree has no
   `.env.test.local`), then `node tools/bundle-budget.mjs`. Raise both limits by the file's standing rule: the
   measured total rounded up to the next whole kB, never past 270 unconfigured and 350 configured, in the
   same commit as the reason, in `tools/bundle-budget.mjs` and `.claude/README.md`. Expected growth over batch
   6's totals (259-262 unconfigured, 316-319 configured): new code about +1.3 kB gzip (`SearchPage`'s head,
   kind row, sheet wiring and empty states +0.5, `AccountPage`'s columns, merge and confirm list +0.3,
   `NoPage` and the `ErrorPage` call sites +0.2, `Marked` and `markRuns` +0.1, `pickKinds`, `shortPath` and
   the two state methods +0.1, `danger-fill` +0.1); new strings about +0.7 kB (17 keys in two languages);
   removals about -0.9 kB (`startTyping`, `displayLead`, `notifyHint`, `signOutAllHint`, `signedInAs`,
   `printCompactBox` and `hbEmptyTable` in both languages about -0.5, the old chip panel, the checkbox CSS
   and the `.who` panel about -0.2, `RowMain`'s `nameRuns` and the strip call about -0.2); net about +0.8 to
   +1.4 kB, so expect 260-264 unconfigured and 317-321 configured. If the unconfigured total passes 264,
   `handoff.md` names it, because batches 8 to 10 need about 5 kB under the 270 ceiling; the batch does not
   raise a ceiling.
7. `impeccable detect --json --no-inline-ignores app/src`, and the spelling grep of batch 2's word list over
   the touched files and the new prose.
8. `rtk npm run check:fast` (Bash timeout 600000), last.
9. Commit, push, the CI credit. CI's `app/states` (cases 83, 93, 94 and the adapted ones), `app/contracts`,
   `app/hues`, `app/typo`, `app/print`, `sweep.js` at 360, 390, 768 and 1180 and the `e2e` flows are the
   browser proof; a failing case there is a case to read against this brief. The batch review follows
   (trigger: new or changed UI; `tests/app/` changed).

## Risks and do-nots

- Do not change `toggleKind`, `LOOT_KINDS` or the roller's chips: `app.kinds` is shared, and a roller test
  must not move.
- Do not mount `FilterPanel` at `mid` or `wide` on `/search`: its `wide` band draws a column. The search
  draws chips there.
- Do not draw the `own` switch twice (the sheet's first row up to 760 px, the kind row from 761 px).
- `Marked` must not add whitespace between the runs: the goldens are accessibility-tree text compared byte
  for byte.
- `TableRows` keeps `ontoggleall` and the strip for `/s/`. Do not delete them here (batch 9a).
- The count in the delete summary comes only from a store whose `status` is `ready`. A count never read is
  never drawn, and the page must not read the stores again to draw it.
- Rule 20 is the likely miss: «Очистить поиск» and «Сбросить фильтры» leave the screen on a press; the
  example chip keeps the box; «Ещё» closed returns to «Ещё»; «Отмена» returns to «Удалить аккаунт...».
  Capture the opener and test each.
- The `ErrorPage` `h1` replaces the page's `PageTitle`: a page must draw exactly one `h1`.
- `PrintPage`: touch only the three branches of S7. A diff outside them is batch P's.
- A native `required` or an ARIA name on a control stays when its caption changes (the account selects keep
  their `<label for>`).
- The first-screen numbers depend on Source Sans 3 line boxes. Measure on the built page before the push.
- American spelling in new prose and test titles ("color", "gray").
- Review order: `SearchPage.svelte`, `AccountPage.svelte`, `NoPage.svelte` and `App.svelte`, `PrintPage.svelte`
  (the three branches), `Marked.svelte` with `RowMain.svelte` and `TableRows.svelte`, `lib/std.ts`,
  `state/app.svelte.ts`, `Button.svelte`, `fake-cloud.ts`, the suites, the prose.

## Standing checks for batch 7

1. Scale. Limits: the search cap 300 rows (a page constant, no 3x row), own items 100 (3x 300), lists 50
   (3x 150), sources 20, the query length (no cap), an identity email (any length).

   | State | Shows | Proof |
   |---|---|---|
   | Search: no query | the start plate with three example chips; no count line | `searchPage.test.ts`, `#/search`, `~ narrow` |
   | Search: 1 hit, many hits | rows ranked best first; no count line while no kind is picked and the hits stay under 300 | `~ searched`, `~ words in any order` |
   | Search: 300 hits, more than 300 | 300 rows and «Показано 300 из N»; the page scrolls; the bar stays (about 129 px at 360) | `~ capped`, case 93 item 6 |
   | Search: 300 own items in the pool | the pool is ranked once (`all`) and filtered; no per-key cost added | `searchPage.test.ts` ranking test |
   | Search: nothing found, a 200-character query | the cause wraps (`overflow-wrap: anywhere`); one primary | a `searchPage.test.ts` case, `~ nothing found` |
   | Account: 0, 1, 50 lists; 0, 100, 300 own items | the delete summary shows counts only for what is read, a zero left out; 3x values are numbers only | `accountPage.test.ts` |
   | Account: a 100-character email | wraps inside its row; no horizontal scroll | `accountPage.test.ts`, case 94 |
   | Error pages: a 300-character address | cut at 80 characters with `...`; the sentence wraps | `shortPath` test, the app test |
   | 360 px, 320 px, 1180 px | each row above at 360 and 1180; 320 for the search head and the account print row | cases 93, 94, `sweep.js` |

   At many and at the limit: the row order is rank order; the primary action is the first row of the
   results (`data-primary`); the bar is one row group (batch 3); the filter sheet is at most
   `min(85dvh, 640px)` with a body that scrolls, and with the on-screen keyboard open at 360x480 its foot
   stays in view (the sheet has no text field; the search box is outside it). The account delete confirm is
   inline, so the keyboard only scrolls the page. Sticky regions: the selection bar (batch 3), nothing new.
2. Error scenarios. Loading: `/search` has no network read (the catalog is bundled); the own items arrive
   when the account's read answers, and the switch appears then. A failed read: own items that fail to read
   leave the catalog results alone (as shipped); the account's identities and lists reads fail in their own
   panels with a retry; a failed `/p/` read is the page-level `ErrorPage` with a retry that reads the set
   again from the address (never a copy held before the failure). Offline: the same. A conflict (another
   device wrote first): the delete summary counts the last read and can undercount; the delete removes all
   the account holds, and a refusal says the error toast and keeps the session (a later press finishes it).
   A record the page names was deleted: a ticked search result that no longer exists leaves the selection on
   the next search; the missing and gone print sets draw `ErrorPage`. A stale tab: the old bundle draws the
   old page until a reload; nothing new is stored. A revert: no stored shape changes (`app.kinds` and the
   selection mode are memory only; the account writes the same preference fields, with the same values for
   `printBW` and `printCompact`). A path that can lose data: none added; the account delete is the existing
   one with a stronger confirm.
3. Consistency. Rules of `FEATURES.md` "Consistency rules" followed: 3 (the account delete's departure is
   extended, not removed), 4 (one name: the lit job, the heading and the tab read «Поиск»), 6 (load states
   and the primary retry), 7 (a heading in every state; the error pages' `h1` is the cause, named as a
   departure), 11 (the sheet's «Закрыть»), 14 (RU and EN), 15 (labels: (c) unchanged, (d) the one caption of
   the account stays a fact), 16 (long names), 17 (no link is handed out), 20 (focus). Compared with the
   siblings: the catalog, `/homebrew` and `/search` share the search row, «Фильтры · N», `FilterPanel`,
   «Выбрать» last, the one bar, the count line and the empty plate. Differences: `/search` keeps a visible
   `h1` up to 760 px (no picker to fill the row) and has a «Ещё» with one item; its filter is three kinds,
   so it draws chips from 761 px, not a column. Button verbs: «Сбросить фильтры», «Очистить поиск»,
   «Повторить», «На главную», «Открыть таблицы», «Удалить навсегда»; the place of the primary: the plate's
   one button. Toasts, load wording and the other confirms do not change.
4. RU/EN parity: the 17 new keys of S1 have both languages with the same facts, ASCII punctuation, «ёлочки»
   in RU only, no new plural form; the changed and deleted keys leave both; the example chips return hits
   in both languages; `rowNo` reads «№ 89» and "No. 89"; cases 93 and 94 run in both languages and the
   goldens hold both.

## Gate cost

Per `plan.md` section 8: one code batch is 45-60 minutes with its `check:fast`, one CI run and one review fix
cycle. Extra local gates:

| Gate | Minutes |
|---|---|
| the affected vitest files (about 18) | 6-8 |
| `node --test tools/artwork/lib.test.mjs`, both lints, decisions, the detector | 4-5 |
| `build:test` and the four golden shards (about 26 moved files and 11 new) | 10-12 |
| `check:built` and the configured build with `bundle-budget.mjs` | 3-4 |
| the D8 probe | 1 |
| the orchestrator's `polish` and `harden` | 5-10 |
| the screenshot set | about 3 |

Total: 32-43 minutes of extra gates (`plan.md` section 8 says 1 for this batch; the row under-counts). The plan
total in section 8 rises by 31-42. Browser suites, sweeps and the e2e flows run on CI (owner, "Local gates").

## Writer tests

Facts for the orchestrator's dispatch, not a model choice.

| Test | Answer |
|---|---|
| 1 (a step asks for a choice, or an `Open design question:`) | no: every choice is decided above; Q7-1 and Q7-2 have defaults and block nothing |
| 2 (public contract, route, stored state, product law, migration, hook, configuration) | no for contract, route, state, law and migration; `tools/bundle-budget.mjs` rises under its standing rule; the fake cloud gains a test-only hold |
| 3 (visual judgment: print fitting, a golden re-seed, parity with a design node) | yes: about 26 goldens re-seeded and new head, chip, sheet, column and confirm layouts that rest on visual judgment; no design node; no print change |

## Split criterion

Different routes (`/search`, `/account`, the error pages), as `plan.md` section 7 gives. The three parts
share `Empty`, `ErrorPage`, `Seg`, the dict, the `Button` variant and one CI gate, and none changes a public
contract or a route. One split was weighed and rejected: the error pages (S7) from search and account. It
would save a review pass of about 15 minutes and cost a second re-seed of the `_p_*` and `_l_*` families and a
second CI run (about 25 minutes). If the review of this batch cannot be held in one pass, it splits by the
"Review order" list, not the batch.

## Plan review

Not required (no trigger fired): no migration or SECURITY DEFINER function; no public contract
(`routes.json`, `CONTRACTS.md`, `llms.txt`, `tests/contracts.js` and `docs/fixtures/` do not change; the
`/p/` and `/print/` addresses are untouched, only the retired page's sentence loses a stale address form); no
stored data or `localStorage` key (`app.kinds`, the selection mode, the sheet and the confirm are memory; the
account writes the same preference fields through the same setters; the delete is the existing call); no write
or sync protocol (the fake cloud's `print` hold is test-only). A batch review is required after the
implementer (trigger: new or changed UI; `tests/app/` changed).
