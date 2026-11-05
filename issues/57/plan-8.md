# Batch 8 - The lists page, list cards, lists import and the add-to-list menu (implement-ready)

This brief is the implementer's whole input for batch 8, with the mock `mocks/8/` (`index.html`, `states.js`,
`u.js`, the PNGs), `docs/specs/FEATURES.md` "Lists" and "Consistency rules", and the shipped files named below.
Section numbers ("section 7") are those of `plan.md`. The owner is AFK (`context.md`, "Owner AFK from
2026-11-03"): every choice below is the recommended option, and the orchestrator logs it in
`C:\Users\Ignat\.dhloot\notes\owner-afk-2026-11-03\decisions.md` (items 13 to 16 are written there). A mock is
direction (owner, 2026-11-03): every departure is named in "Decisions", and none of them reopens an owner decision.

Batch 8 is the second batch of wave 3. It runs after batch 9a (tip `6f90ccd6`, CI green). It carries two small
owner items of 2026-11-05 that no other wave 3 batch can take sooner: the number stepper (L10) and the bundle
ceiling line (L11).

## Objective

`/lists` becomes the page that mock 8 draws: a head with the primary «Новый список» that opens the name field in
place, the import and the pin out of the way, a count line with «Выбрать», cards with their actions in a labeled
«Ещё» menu, and the one selection bar of batch 3 (through `app.pageBar`, which 9a added). `BatchBar` is deleted.
The import preview loses its raw ids and shows its details on request. `/lists/<uuid>` not found draws
`ErrorPage` with a true cause. The add-to-list menu takes the mock's look: the heading «Списки», a check mark on a
list that holds the record, the count in words, no gold fill. The number stepper is laid out as a stepper.

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a rebase). Read
  `git log --oneline -8`.
- Read the shipped files this brief names: `ListsPage`, `ListCard`, `ListFind`, `SelMode`, `SelBar`,
  `SelectionBar`, `MoreMenu`, `PinItem`, `PageHead`, `Empty`, `ErrorPage`, `AddToList`, `ImportPanel`,
  `ImportLines`, `NumberField`, `ListPage` (only its `!own` branch and `listBar`, as the pattern), `HomebrewPage`
  (its head and its import, as the pattern), `listsPage.test.ts`, `batchBar.test.ts`, `lists.test.ts`. A line of
  this brief that no longer matches the code is the implementer's to adapt, and `handoff.md` names the change.
- States cases: the next free numbers are 102, 103 and 104 (101 is batch W's). Check
  `git grep -n -E "^  \['10[0-9] " -- tests/app/states.js` first; batch 9b reads the next three free numbers.
- Stale-case risk (9a lost a CI run to it): before the first edit, read every `tests/app/` reader of what this
  batch moves. List: states cases 1, 2, 3, 22, 23, 27, 37, 41, 42, 58-62, 66, 79, 83; `sweep.js` (`importOpen`);
  `inventory.js` (the `#/lists` states, the list-menu states, `tickTwo`, `importOpen`, `twoRequests`,
  `onAccount`); `tests/e2e/flows.mjs` (the lists flows, F13); `hues.js`. Each one that names «Выбрать все»,
  «Ваш аккаунт», `.btn.danger` on a card, «Например: клад дракона», «Справка» on `/lists`, or the chip look of the
  menu is changed in the same commit.
- Impeccable cannot run from a subagent. The orchestrator runs `polish` and `harden` after the prose step on
  `ListsPage`, `ListCard`, `AddToList` and `ImportPanel`, from the built app at 360 and 1180 px (fallback
  `impeccable:impeccable-finish-reviewer`).

## Decisions of this refresh (planner defaults; the owner is away)

| # | Decision | Reason and trade-off |
|---|---|---|
| L1 | The head is `PageHead` with its `extra` snippet, no sub line, no help. From 761 px the pin stays in the head row (`pin`), and the `extra` snippet holds the import toggle (icon `upload`, «Импорт из файла») and the primary (icon `plus`, «Новый список») at the row end (`margin-left: auto`), as `HomebrewPage`'s `wideHead`. Up to 760 px `pin={false}`; the `extra` holds the primary (size `sm`, plus icon) and `MoreMenu id="lists-more"` with the import item (while the lists are read) and `PinItem`. `subLists` and `help.ts` `LISTS` go (Q8.1). Departure: mock 8 draws no pin at 1180; the pin stays because the Same Label Rule and `FEATURES.md` "Chrome" give every page the pin, and a start page that cannot be pinned would be a gap. | M2-2 and Q8.1. The sign-in state also draws `MoreMenu` up to 760 px, holding the pin alone, so the pin stays reachable. Trade-off: a menu of one item signed out. |
| L2 | «Новый список» opens the name field in place (rule 8): a `Panel` under the head with a visible label «Название списка» (new key `listNameLabel`; rule 15a), the input, «Создать» (primary) and «Отмена» (ghost). Enter creates; Escape cancels. The focus goes into the input on open, and back to the primary after «Создать» or «Отмена». A create closes the field, clears the name filter (as today) and raises the existing `listCreated` toast. At the limit the press calls `app.listsFull()`, which toasts the limit and leaves the field closed (the primary stays enabled, round 3 unit B). `listNamePh` becomes «Клад дракона» / "Dragon's hoard" (D20: the old example clipped). | Rule 8 and `FEATURES.md` rule 9 (the primary in the head is a named departure, as the Items tab). The old inventory states that typed 50 lists through the field are re-seeded through `onAccount` (L9). |
| L3 | The count line sits at the head of the collection, under the head row: «3 списка из 50» (`countOf`), red at the limit (`.over`), then `SyncStatus` while a write fails, then «Выбрать» (`SelMode`) at the end while `drawn.length` and not selecting. From the eighth list (`LIST_SEARCH_AT`) the row under the head is the search («Найти список») with «Выбрать» last; the count sits under it up to 760 px and in the row from 761 px (mock `lists-limit`, M8-1). The search row is `ListFind`, whose filter props become optional (L8). `D116`: the «Ваш аккаунт» group heading and `groupAccount` go. | The mock and rule 1. `ListFind` has two callers and gains a third; the own `.tools` row of `HomebrewPage` stays (Deferred). |
| L4 | A card keeps its link and its thumbs. Its `actions` snippet becomes a `MoreMenu` (`id="lcard-<id>"`, `size="sm"`, `label` «Ещё: <name>») holding «Открыть» (a link to the list), «Скачать JSON» (`app.exportLists([id])`), a separator and «Удалить список» (danger; today's confirm `deleteCloudConfirm`, no undo). No red «Удалить» on a card (A16). The waiting line becomes a neutral chip inside the card link: `inboxHead` with N = pending requests + unread notices, as the mock's «Новое в списке (3)»; the gold `.listcard-req` goes (Seal Rule). The meta line, the thumbs and `listEmpty` stay. | A16, the Seal Rule. The 9b requests panel head reads the same words (`inboxHead`). |
| L5 | Selection mode: `app.selecting` plus `app.pageBar = listsBar` (a top-level snippet drawing `SelectionBar`, as `ListPage`'s `listBar`): «Все», «Выбрано: N», «Скачать JSON (N)», «Удалить (N)» (danger), «Снять выделение» last, at every width (mock: 129 px, 20% at 360x640). A card draws its tick (32 px box, 44 px target, name «Выбрать: <name>») only while selecting, and no «Ещё». A ticked card is neutral: a lit border (`--muted2`) and a check, no gold fill. `lsel` stays page memory, always a subset of the drawn cards (as today). Leaving drops the ticks and focuses `button.selmode`, else the primary, else `#main`. A delete leaves the mode on and focuses the bar's «Все», else `button.selmode`. A page with no drawn card leaves the mode. | Rule 20 and the pattern of 9a. «Выбрать все» (`pickAll`) leaves this page: the bar's «Все» reads `selectAll`. |
| L6 | Empty states. Signed in, no list: `Empty glyph="kindItem" title={t.listsNoneTitle}` with `listsNoneHint` and «Открыть таблицы» (`openTables`, a link to `sectionHash('tables')`). Signed out (`target === 'prompt'`): `Empty glyph="kindItem"` holding `SignInPrompt` with `lead={t.signInToCreate}` and the return hash `#/lists`; the head draws no primary and no import. `noCloudLists` and the old panel go. A failed read stays `LoadState failed` with `cloudLoadFailed` and «Повторить», whose retry focus goes to the primary, else `#main`. | Mock `lists-empty`, `lists-signedout`, `lists-error`; rules 6 and 7. The mock's `list` glyph does not exist in `icons.ts`; `kindItem` is the empty plate's well everywhere else. |
| L7 | The import. The panel is `ImportPanel` in a `Panel` under the head, opened by the head's import toggle (the toggle shows `on` and `aria-expanded`; it closes the panel and drops the file, as the homebrew import does, rule 11; no «Закрыть» is added). The preview (A14, D6): the head paragraph stays; a skip line names the position and, when the data knows the record, its name, and never the raw id (`skipLine` builds `{ pos, name }`, no `item`); the unknown record reads «Позиция 4: пропущена - такой записи нет в данных». The report of a list draws the list head, its size and the name-taken line, and its skip lines inside a closed `<details>` with the summary «Пропущено: N» (new key `importSkippedList`, plural sets in both languages). The refused report keeps the field and path codes (an author needs them). | A14, D6. "One summary, details on request" is the audit's text. Departure: mock `lists-import` draws the fold open and a «Закрыть» button; the fold stays closed (on request) and the toggle closes the panel (consistency with `/homebrew`). |
| L8 | `ListFind` gets `rows?: FacetRow[]` (default `[]`), and its other filter props (`picked`, `shown`, `open`, `onopen`, `onclose`, `onpick`, `onclear`, `onreset`, `toggle`) optional and read only while `rows.length`; and `label?` / `placeholder?` for the search box. `/lists` passes none of the filter props. Its CSS and the 36 px height up to 760 px stay. | Extract on the third use; no filter control draws without rows (it already does not). |
| L9 | `/lists` first-screen rows: `#/lists as gm1` moves from `shipped: false` to `shipped: true` (asserted at 360x640 and 1180x720, RU and EN, limit 256 and 288, design target 240 and 270; the mock measured 231 and 189). A new row `#/lists ~ many lists as gm4` (30 lists: the search row) is asserted at the same limits (the mock's `lists-limit` measured 253 at 360: under 256, past 240). `data-primary` stays on `.listgrid`. | Section 14. |
| L10 | **The number stepper (owner item 8, `context.md`).** In `NumberField.svelte` the text input takes `flex: 1 1 auto; min-width: 0` (its 74 px `width` stays as the basis), so the value centers between the two buttons and «+» sits at the right edge of the box. The `max-width: 240px` cap stays. The money-act override in `ListPage` (`width: 52px`, shrink-to-fit parent) and the alt pair's `max-width: none` keep working: the first has no free space to grow into, the second now centers the value in each block. `FEATURES.md` "Rolling" and `DESIGN.md` "The One Width Rule" lose any sentence that implies the value sits beside the buttons. **Fallback, one line, the owner's call:** drop the cap (`max-width: 100%`); then the box fills its column and the sibling controls and it share one width. | The owner's three complaints are the value off-center, «+» far from the field's end and extra space after «+»; the owner offered "smaller" or "«+» at the right side". A flex input fixes all three and keeps batch W's measurement (2026-11-04: past 240 px the number floated between two far buttons). Trade-off: the box is still narrower than the column at 330 px and wider; reverting the cap is allowed by the owner and costs one line. No batch of wave 3 opens a roll page, so this is the first batch that ships it; it is CSS only, so no golden moves (the goldens hold accessibility trees). |
| L11 | **The 300 kB ceiling (review 9a R1, `context.md` "Bundle budget ceiling").** This batch writes the owner's unconfigured ceiling of 300 kB, whether or not its own total passes 270: `tools/bundle-budget.mjs` (the comment: "never past 350 configured and 300 unconfigured", the measured line), `.claude/README.md` ("The configured bundle budget": the ceiling sentence and the "Expected" line with this batch's measured figures; the decision chain at the end), and a new file `docs/decisions/2026-11-05-the-unconfigured-bundle-ceiling-rises-to-300-kb.md` (template `.claude/templates/decision.template.md`: Task `57`, the owner's words "we can increase budget up to 300", the decision, rejected: the ceiling set as the budget at once, a bundle split; consequence: later batches measure and raise by the standing rule; `Amends` the 2026-10-22 file; add one `Amended by` line to that file's head). Then `node tools/decisions.js`. The budgets themselves rise by the standing rule only if the measured total passes them: 268.1 of 269 unconfigured and 325.5 of 326 configured at 9a. The configured ceiling stays 350 kB; a total past it stops the batch and asks the owner. | Review 9a R1 expected this batch to be the first past 270. If a guard refuses a write to a file above, stop and return the text for the orchestrator. |
| L12 | **The add-to-list menu stays a popover at every width; no bottom sheet.** Departure from mock 8's 360 sheet (C62). Reason: batch 4's K1 traps hold - a `Sheet` nested in the record `<dialog>` resets `app.dialogOpen` when it closes and draws a second `Toast inDialog`; `AddToList` has four callers (the record page and dialog, the roll result, the selection bar, the editor preview). The popover is already measured against the viewport and the clipping box and never hides under the dock (K16, case 23). Its content takes the mock's look (L13). Recorded in a decision file: `docs/decisions/2026-11-05-the-add-to-list-menu-stays-a-popover.md` (Rejected: the sheet at up to 760 px with a dialog depth counter in `app.svelte.ts`, `Sheet`, `RecordModal`, `CropDialog` and `Toast`; Consequence: at 360 an action toast covers the end of an upward menu for its 7 s, kept in `handoff.md` Deferred). | Least work and no new surface rule (owner: the interim mix between batches is fine; take the option with less work). The owner may ask for the sheet later; the cost is the counter. |
| L13 | Menu content (C61, C35). The heading reads «Списки» / "Lists" for every menu (new key `listsHead`; `inLists` and `addTo` go). A list row is a `button` (`aria-pressed` on a one-record menu, none on the selection bar's menu, which only adds) with a check icon when it holds the record, the name cut to one line, and the count in words at the end (`plural(l.ids.length, t.itemsN)`): no gold fill (the neutral lit style of `Chip` `neutral`, or the row's own CSS). Rows are 44 px tall up to 760 px and 36 px from 761 px. The search from the eighth list, the order taken at open, the busy state, the undo toast and the position rules stay as `FEATURES.md` "Lists" has them. «+ Новый список» stays a button below a separator (not a chip) with the plus icon, opening the name field in the menu; the signed-out menu keeps its two steps (the button, then the sign-in prompt) and its text. The mock's one-step signed-out form is not built (Deferred). | A pressed chip by fill alone fails WCAG 1.4.1 (C61). The signed-out flow carries a pending action and has cases (37, 42); a change there is risk for no gain now. |
| L14 | `/lists/<uuid>` not found (A18) is `ErrorPage` in `ListPage`'s `!own` branch; `PageTitle` leaves it. Signed out (and a non-account address): title «Список не открывается» / "This list does not open", text «Списки открываются только в аккаунте, где их создали. Войдите в него.» / "A list opens only in the account where it was made. Sign in to that account.", primary «Войти» (`askSignIn({ hash: app.hash })`), then «Открыть таблицы». Signed in with the lists read and the id absent: title «Этого списка нет в вашем аккаунте» / "This list is not in your account", text «Его удалили, или он сохранён в другом аккаунте. Вы вошли как %s.» / "It was deleted, or it is in another account. You are signed in as %s." (the account's email, as `AccountPage` reads it; without an email the last sentence is left out), primary «Мои списки» (`sectionLabel('lists', t)`), then «Открыть таблицы». `listNotFound`, `listNotFoundSub` and `signInToOpen` go when no reader is left. The load and error branches keep `LoadState`. | Rule 7; the cause after R10 is true (`DEBT`-free: A18 closes). |
| L15 | The nits and facts carried: the `BatchBar` strings and its mono label (`.batch-all`) go with the file; `pickAll` stays (`HomebrewPage` tests read it); the `FEATURES.md` rule 1 «the account group of `#/lists`» names the collection head; Deferred "Toast over «Ещё»" is widened to the add-to-list menu and stays Deferred (L12). | Campsite. |

## Owner questions (default taken; none blocks)

- Q8-1. The add-to-list menu is a popover at 360 (L12). Recommended later: leave it. The sheet costs a dialog depth
  counter in five files and a second look at every toast case.
- Q8-2. The stepper keeps its 240 px cap (L10). The owner may ask for the full column width; the change is one line.
- Q8-3. The signed-out add-to-list menu keeps two steps (L13).

## Placed items

- Owner item 8 (the stepper): L10 and its own acceptance line below.
- Owner item 9 (rows cut with free width at 1180, 1440 and 1920): no file of this batch opens `RowMain` or
  `TableRows`, so it is placed in batch 9b (`plan.md` section 7, batch 9b, "9b-R9"), the batch that lays out the
  full row at wide widths (M-9b). This batch does not touch the row clamp.
- Review 9a R2 (the scroll at 83 probe) stays with 9b (`handoff.md` Deferred). Review 9a N1-N7 were fixed in the
  9a fix pass. R1 is L11.
- Batch 3 deviation 2 (the bar's label): closed in batch 4 (K4: `AddToList` draws `t.toList`, «В список»); this
  batch gives it its own acceptance line (A-label below) as a check, because the bar is the surface that raised it.
- `docs/specs/DEBT.md` D116 is deleted in this batch (the heading is gone).

## In scope

- `ListsPage`, `ListCard`, `ListFind` (L8), `AddToList` (L13), `ImportPanel` and `ImportLines` (L7), `ListPage`'s
  `!own` branch (L14), `NumberField` (L10), `app/src/lib/dict.ts` and `help.ts` (strings), the deleted
  `BatchBar.svelte` and `batchBar.test.ts`.
- The suites, goldens and prose that name what moves. The ceiling line (L11).

## Out of scope

- 9b: the list page's panels, the side column, the row's «Ещё» from 761 px, A1, the note switch, the owner's item 9
  (the row clamp).
- A sheet for the add-to-list menu, a one-step signed-out menu, a new glyph, a `RecordModal` change, the
  `HomebrewPage` search row (it keeps its own `.tools`), `ROUTES.md`, `CONTRACTS.md`, `routes.json`, `llms.txt`,
  the store, the cloud port, the schema.

## Files expected

| Step | Files |
|---|---|
| S1 strings | `app/src/lib/dict.ts` (RU and EN: new `listNameLabel`, `listsNoneTitle`, `listsNoneHint`, `listsHead`, `importSkippedList`, `listGoneSignedOut`, `listGoneSignedOutSub`, `listGoneAccount`, `listGoneAccountSub`; changed `listNamePh`; removed `groupAccount`, `noCloudLists`, `subLists`, `inLists`, `addTo`, `listNotFound`, `listNotFoundSub`, `signInToOpen` when no reader is left), `lib/i18n.test.ts` parity, `lib/help.ts` and `help.test.ts` (`LISTS` and its cases go) |
| S2 `ListFind`, `NumberField` | `ListFind.svelte`, `listFind.test.ts`, `NumberField.svelte`, `NumberField` tests (in `roll.test.ts` or the file that holds them) |
| S3 card | `ListCard.svelte` (tick only while selecting, the neutral `.picked`, the chip, the `actions` slot), `lists.test.ts` or a new `listCard` case in `listsPage.test.ts` |
| S4 page | `ListsPage.svelte`, `listsPage.test.ts` |
| S5 import | `ImportPanel.svelte`, `ImportLines.svelte` (only if its `code` for a known name needs a switch), `importPanel.test.ts` |
| S6 menu | `AddToList.svelte`, `lists.test.ts`, the tests that name the chips (`rollResult.test.ts`, `itemPage.test.ts`, `homebrewPage.test.ts`, `pickRow.test.ts`, `recordHost.test.ts`: read for `aria-pressed` chips) |
| S7 not found | `ListPage.svelte` (`!own` branch), `listPage.test.ts` |
| S8 delete | `BatchBar.svelte`, `batchBar.test.ts`; `a11y.test.ts` (`COVERED`: the `BatchBar.svelte` row goes; no new component) |
| S9 suites | `tests/app/states.js` (cases 102-104, `FIRST_SCREEN`, the stale cases of the preflight), `inventory.js`, `sweep.js`, `hues.js`, `tests/e2e/flows.mjs`, `tests/app/contracts.js` only if a reader moves |
| S10 prose | `FEATURES.md` ("Lists", "Chrome", rules 1, 8, 9 text), `DESIGN.md` (The Seal Rule's list-card line, The Same Label Rule), `STATE.md` (the `pageBar` row), `COVERAGE.md`, `DEBT.md` (D116 out), the two decision files, `docs/DECISIONS.md` (by `node tools/decisions.js`), `tools/bundle-budget.mjs`, `.claude/README.md` |
| S11 evidence | `issues/57/mocks/8/built/`, `handoff.md` |

## Steps

### S1. Strings

Add the keys of the table in RU and EN, both plural sets where a count shows (`importSkippedList`: «Пропущено: %n» is a
label, not a plural; the RU and EN plural pair applies to none of the new keys, so none carries a `|`). ASCII only,
American spelling. `listNamePh`: «Клад дракона» / "Dragon's hoard". `listsNoneHint`: «Нажмите «Новый список» - или «В
список» у предмета в таблице или в броске.» / `Press "New list" - or "Add to list" on an item in a table or a roll.`
`listsNoneTitle`: «Списков пока нет» / "No lists yet". `listsHead`: «Списки» / "Lists". `listNameLabel`: «Название
списка» / "List name". The not-found strings are in L14. Delete a key only after `git grep -n -w <key> -- app tests
docs` shows no reader; `i18n.test.ts` keeps the two languages equal. `help.ts`: delete `LISTS`, the `lists` map
entry, its cases in `help.test.ts` and the `#/lists ~ help` state with its goldens (S9).

### S2. `ListFind` and `NumberField`

`ListFind`: L8. A test renders it with no `rows` (a search box and «Выбрать», no «Фильтры», no panel) and keeps the
old cases. `NumberField`: L10, CSS only: in the `input[type='text']` rule add `flex: 1 1 auto; min-width: 0;`, keep
`width: 74px`. Do not touch the `.numbox` cap, the button widths (40, 36 at 430 px) or `ListPage`'s override. A unit
test cannot lay out; the proof is case 104.

### S3. `ListCard`

Props: `onpick` is passed only while selecting (the tick draws only then, as today's `{#if onpick}`); `actions` becomes
the `MoreMenu` snippet the page passes (the card keeps the `.listcard-acts` row, now at the card's end, right-aligned,
as the mock). The request chip: a new optional prop `inbox?: string`, drawn inside the link as
`<span class="listcard-new">{inbox}</span>` (neutral: `--txt` on `--surface2`, a `--line2` border, `--t-label`), and
part of the link's accessible name. Delete the `.listcard-req` rule and the gold `.picked` fill: `.listcard.picked`
takes a `--muted2` border and `--surface2` ground. Keep `overflow-wrap: anywhere` on the name; a 120-character name
wraps and never widens the card.

### S4. `ListsPage`

Rewrite the template and the script by L1 to L6; keep the script's working parts (`focusOr`, `filtering`,
`foundAccount`, `drawnAccount`, `hidden`, `sel` and its prune effect, `exportTicked`, `delPicked`, `waiting`,
`setQuery`, `showMore`, `knownItems`, `create`, `delAccount`) and adapt them:

- `draft`, `newOpen`, `nameInput`, `newButton` (the primary's element, `bind:el`). `openNew()` calls `app.listsFull()`
  first and returns when it is true; else `newOpen = true`, and after `tick()` the input takes the focus.
  `create()` is as today, then `newOpen = false` and the focus returns to `newButton`. `cancel` does the same.
- `app.pageBar`: an effect sets `app.pageBar = signedIn && cloud?.status === 'ready' && app.selecting ? listsBar :
  null`; `onDestroy` clears it. `startSelecting()` and `leaveSelecting()` as `ListPage` has them (read them; the focus
  target is `button.selmode`, else `newButton`, else `#main`). An effect leaves the mode when `drawnAccount` is empty.
  The prune effect and `ticked` stay.
- `listsBar` snippet at the top level (a snippet inside another cannot reach the script): `SelectionBar` with
  `label={t.selRegion}`, `total={drawnAccount.length}`, `picked={ticked.length}`, `allLabel={t.selectAll}`,
  `allText={t.allShort}`, `count={t.selCount.replace('%n', String(ticked.length))}`, `clearText={t.clearSel}`,
  `onall`, `onclear`, and the two actions «Скачать JSON (N)» (`disabled` while exporting or no tick) and «Удалить (N)»
  (danger, no tick: disabled).
- The card's `actions` snippet (inside `{#each}`): `MoreMenu {app} id={'lcard-' + l.id} size="sm"
  label={t.moreOf.replace('%s', l.name || t.untitled)}` (`moreOf` exists: «Ещё: %s» / "More: %s") with the three items of L4; each item calls `close()` first. «Удалить список»
  runs `delAccount(l, i)`; `focusAfterCard` now targets the next card's menu trigger (`.listcard-acts button`), else
  the previous, else `newButton`.
- The import: `canImport`, `importing`, `importSending`, `toggleImport`, `closeImport` stay; the toggle's element is
  `importButton` (`bind:el`); `closeImport` focuses it, else the opener of the narrow menu item (as `HomebrewPage`
  `importOpener`), else `#main`. `ImportPanel` sits in a `Panel` under the head, above the new-list field.
- Head and rows as L1, L3, L6. `data-primary` stays on `.listgrid`. `Показать ещё` stays, with its focus move.
- The cards pass `inbox={waiting(l.id)}`, where `waiting` returns `t.inboxHead.replace('%n', String(n + changed))`
  or `undefined` when both counts are 0.
- Delete: the `BatchBar` import, `allBox`, `pickAllCards`' strip use (`pickAll` for the bar's `onall`), the `.group`
  and `.grouptext` rules that the heading and the sentences used, and the `helpFor` import.

### S5. `ImportPanel`

L7. `skipLine(s)`: `const it = app.index?.byId.get(s.id)`; `return { pos, ...(it ? { name: nameOf(it, app.lang) } : {}),
text }` with `pos = t.importPos.replace('%n', String(s.entry + 1))`. Keep `where()` for `errorLine`. In the report,
render the skip lines of a list inside `<details class="skips"><summary>{t.importSkippedList.replace('%n', ...)}</summary>
<ImportLines .../></details>`; the name-taken line stays outside the fold, above it. The report draws for a list
when it has skip lines or a taken name (as today). Add the summary style (the muted `--t-data`, a chevron by the
existing fold look: reuse `FoldButton`'s CSS only if it is already global; else a small local rule). Tests: a skip
line for an unknown record has no `<code>`; a known one names the record and has no `<code>`; the fold is closed on
arrival; the refused report still draws its codes.

### S6. `AddToList`

L12 and L13. Keep every behavior of the file (the open/close state, the order taken at open, `held` and `known`,
the busy state, `pick`, `removeFrom` with its undo, the search, `createNew`, the sign-in return, `placeMenu`, the
Escape and document-click closes). Change only the content of `{#if open}`: the heading `t.listsHead` (it draws in
the signed-out menu too: the heading, then the same sign-in slot); the rows; the «+ Новый список» button. The row
markup: `<button type="button" class="lrow" aria-pressed={one !== undefined ? inList(l) : undefined} aria-busy=...
disabled-like busy as `Chip` does>{#if inList(l)}<Icon name="check" />{:else}<span class="sp"></span>{/if}<span
class="ln">{l.name}</span><span class="lc">{plural(l.ids.length, t.itemsN, app.lang)}</span></button>`. `l.ids` of a
list not yet read in detail may be shorter than the stored count: use the same count the `ListsPage` card uses
(`l.ids.length`); the test fixes the number against the fake cloud. Delete the `Chip` import if nothing else uses it.
Delete the `.dropmenu :global(.chip)` rule. `.lbl` stays for the heading. The popover width stays (`min-width`
becomes 280 px, `max-width: min(320px, 90vw)`), and the 600 px rule that spans the width stays. Names: one line with
an ellipsis; the count never cut.

### S7. `ListPage` not found

L14: replace the final `{:else}` and the signed-out `{#if}` branches of the `!own` block with `ErrorPage` (import
it) as L14 says; the account email comes from the same source as `AccountPage`'s `session.email` (find it; do not
add a new store). The error and loading branches stay. A test per branch in `listPage.test.ts`; both texts have an
axe case; the heading is the one `h1`.

### S8. Delete `BatchBar`

`git grep -n -E "BatchBar|batch-all|batch-summ|batch-acts|batchBar"` returns history and `DEBT`-free prose only.
Remove the `a11y.test.ts` row, the `COVERAGE.md` rows (1283's mention and 1554's row) and the comment citations.

### S9. Suites and states

`tests/app/inventory.js`: update the `#/lists` states to the new flow and add the new ones (see "Goldens and new
states"). `tests/app/states.js`:

- `FIRST_SCREEN`: `#/lists as gm1` to `shipped: true`; add `#/lists ~ many lists as gm4` (`shipped: true`) (L9).
- Case 102, "the lists page holds from 320 to 1440 px": as `gm1` and `gm4 ~ many`, at 320x568, 360x640, 390x844,
  768x1024, 1180x720 and 1440x900, RU and EN: no sideways scroll; the head row (the `h1`, the primary, «Ещё» or the
  import toggle) shares one row up to 760 px at 320 and 360 (the primary and «Ещё» do not wrap under the `h1`); the
  primary is 44 px tall or has a 44 px target; a card's name never widens the card; the grid's cards share one row
  height per row; at 1180 and 1440 the head's primary is at the column's right edge; a 120-character name wraps inside
  the card; the bar at 640x360 takes at most 45% of the height (as case 100); the count line is red at the limit.
- Case 103, "the add-to-list menu keeps its place and its keys": on `/i/ci1 as gm1` and `/roll/std` result at
  360x640 and 1180x720, RU and EN: the menu opens, its heading reads «Списки», a list that holds the record shows a
  check and is `aria-pressed`, the row heights are 44 px at 360 and 36 px at 1180, the menu stays inside the viewport
  and never under the dock (case 23's measure), Tab and Shift+Tab walk heading-less rows in DOM order and reach
  «+ Новый список», Escape returns the focus to the toggle.
- Case 104, "the number stepper is laid out as a stepper": `/roll/std`, `/roll/eq_weapon` (the `RollPanel`) and
  `/roll/alt` at 360, 390, 768 and 1180, RU and EN (at 360 and 390 open «Настроить» first; at 768 and 1180 the field
  is in view): for every `.numbox`: the input's horizontal center is within 1.5 px of the box's center; the box's
  right edge minus the «+» button's right edge is at most 2 px (the border); the box is as wide as `min(240,
  its column)` within 1 px (`max-width: none` on the alt pair: as wide as its block); no sideways scroll; the field's
  height is 46 px. Also read the list page's two `NumberField`s once at 1180 (the money panel): the box width equals
  its size before this batch (`git stash`-free: assert against the figures `case 89` already logs, 133 and 136).
  Existing cases 89 and 101 (`numbox <= 240.5`) keep passing.
- Adapt the stale cases of the preflight list. Do not delete a case: change its selector or its flow.

`tests/e2e/flows.mjs`: the lists flows press «Новый список» then type and «Создать»; F13 (import) opens the panel
from the head's toggle.

### S10. Prose, in the same commit

- `FEATURES.md` "Lists": rewrite the bullets at the index (from the name filter to the import): the head, the
  primary and the field (rule 8, the visible label), the count line, «Выбрать», the search from the eighth list, the
  card with its labeled «Ещё» and the neutral selection, the bar (replace "the selection strip ... «Выбрать все»"),
  the import as the head's toggle and the preview's fold; the add-to-list menu bullets (the heading, the check, the
  count; the popover at every width); A18's texts. "Chrome": the pin and the help sentences lose "until its page's
  batch moves it" for `/lists` (every page now has the pin in «Ещё» up to 760 px). Rules 1 (the counter's place),
  8 (the chip «+ Новый список» departure now names the row's plus icon) and 9 (the head primary on `/lists`).
- `DESIGN.md`: The Seal Rule gold budget: the «Новое в списке (N)» chip is neutral; The Same Label Rule: delete the
  interim exception sentence ("The one interim exception ...") and its «Ещё (the lists)» tail; the Components lines
  for the list card and the menu.
- `STATE.md`: the `pageBar` row gains `/lists`; `COVERAGE.md`: the new cases and the removed ones; `DEBT.md`: D116
  is deleted with its heading (the section keeps its intro if other rows remain; if it is empty, the section goes).
- Two decision files: L11 and L12. Run `node tools/decisions.js`.
- `PageHead.svelte`: if `git grep` shows no caller renders it below 761 px with `pin` or `help`, delete the round
  `.homebtn` rules and the `.txt` visually-hidden branch and their `@media (max-width: 600px)` block; if any caller
  does, keep them and name it in `handoff.md`.

### S11. Evidence

The screenshot set into `issues/57/mocks/8/built/`: `/lists` (3 lists, 30 lists, 50 lists, empty, signed out, the
new-list field open, the card menu, the selection mode with two ticks, the import panel open and with a preview), the
add-to-list menu on `/i/ci1` and in the record dialog, `/lists/<uuid-nope>` signed out and signed in, and `/roll/std`
with the settings open: each at 360 and 1180 px, RU and EN; plus `/lists` and `/roll/std` at 1920 (batch W's rule).
`handoff.md`: the gates, the measured bundle figures, each deviation.

## Acceptance criteria

Each line is its own line; a line with no outcome keeps the batch open.

1. Head: up to 760 px the `h1`, the primary (plus icon) and «Ещё» share one row at 320 and 360 in RU and EN; from 761
   px the `h1`, the pin, the import toggle and the primary share the head row, the primary at the column's right
   edge. There is no sub line and no «Справка» (Q8.1); `help.ts` `LISTS` and `#/lists ~ help` are gone.
2. `«Ещё»` of the head (up to 760 px) holds «Импорт из файла» (while the lists are read) and the pin item
   (`PinItem`); the round pin button is not drawn on `/lists` at any width (M2-2). The Same Label Rule's interim
   sentence is deleted from `DESIGN.md` and the two `FEATURES.md` sentences are updated.
3. «Новый список» opens the name field in place with a visible label; Enter and «Создать» create; «Отмена» and
   Escape discard; the focus goes into the input, then back to the primary. An empty name toasts `nameFirst` and
   keeps the field open. Rule 8's plus icon is on the primary at every width.
4. At 50 of 50 the primary stays enabled; the press toasts the limit through `app.listsFull()`, the field stays
   closed, the count is red. At 150 lists (3x the default) the page draws the first 24, «Показать ещё (126)» and the
   search; one press draws 24 more and focuses the first revealed card.
5. The count line: «N <plural> из M» at the head of the collection, with `SyncStatus` while a write fails, and
   «Выбрать» at its end under 8 lists; from 8 lists the search row holds the search and «Выбрать» last, and the
   count sits under it up to 760 px and in the row from 761 px. No «Ваш аккаунт» heading, and `groupAccount` is
   gone from both languages (D116; `DEBT.md` D116 deleted).
6. Card: the name (up to 120 characters wraps, never widens the card), the meta line, up to six thumbs, the neutral
   chip «Новое в списке (N)» (requests plus unread notices, no gold), and a «Ещё: <name>» menu with «Открыть»,
   «Скачать JSON», a separator and «Удалить список» (danger). No red «Удалить» button on a card (A16). The link's
   accessible name holds the name, the count, the edit time and the chip.
7. «Удалить список» asks today's confirm and offers no undo; after it the focus goes to the next card's menu, else
   the previous, else the primary. A delete of a list another tab already deleted changes nothing.
8. Selection mode (L5): «Выбрать» opens it and focuses the bar's «Все»; the cards draw a tick and no «Ещё»; a ticked
   card is neutral (a lit border and a check, no gold; `hues.js` reads it); the bar holds «Все», «Выбрано: N»,
   «Скачать JSON (N)», «Удалить (N)», «Снять выделение» last; with zero ticks the two actions are off; «Все» ticks the
   drawn cards only; a search or a fold-back drops the hidden ticks; «Снять выделение» leaves the mode and focuses
   «Выбрать». At 640x360 the bar takes at most 45% of the height (case 102). The bar's edge equals `main`'s at 1180
   and 1440. `BatchBar.svelte`, `batchBar.test.ts` and their `a11y` and `COVERAGE` rows are gone.
9. A-label (batch 3 deviation 2, own line): on the catalog, search, the own items and the shared page the bar's
   add-to-list button reads «В список» / "Add to list" (`t.toList`), never «Добавить в список»; `addToList` stays
   only on `QuickItem`'s submit. A component test per page family names the bar's button by `t.toList`
   (`homebrewBulk.test.ts` and `pickRow.test.ts` already do for two; add the catalog's and the shared page's if
   absent). Outcome recorded in `handoff.md`.
10. Empty, signed out and failed read: the empty state (title, hint, «Открыть таблицы»), the signed-out plate with the
    sign-in prompt and no primary, and the failed read with «Повторить» (focus to the primary after a retry) draw as
    L6 says, in RU and EN, each with a golden and an axe case.
11. Import: the toggle in the head (or the narrow menu item) opens `ImportPanel` under the head and closes it, with
    the focus back on the toggle or the opener; a skip line never shows a raw id and a known record shows its name;
    a list's skip lines sit in a closed «Пропущено: N» fold; the name-taken line stays visible; the refused report
    keeps its codes; every existing import case (58-62, e2e F13) passes after its adaptation.
12. `/lists/<uuid>` not found: signed out, the `ErrorPage` of L14 with «Войти» and «Открыть таблицы»; signed in, the
    `ErrorPage` with the account's email and «Мои списки»; exactly one `h1`; no `PageTitle` not-found is left in
    `ListPage`; `listNotFoundSub` and `signInToOpen` are gone or have a reader (named in `handoff.md`). A18 closed.
13. Add-to-list menu: heading «Списки»; a row for each list with its name, its count in words and, when it holds the
    record, a check and `aria-pressed="true"`; no gold fill; 44 px rows up to 760 px, 36 px from 761 px; the
    selection bar's menu has no check state; «+ Новый список» is a button below a separator; the search, the order
    taken at open, the busy state, the undo toast, the new-list form and the sign-in return behave as before
    (cases 1, 2, 3, 22, 23, 27, 37, 42 pass after their adaptation). It is a popover at every width (L12).
14. Number stepper (own line, owner item 8): at 360, 390, 768 and 1180 px, RU and EN, in `StdPanel`, `RollPanel` and
    `AltPanel` (and the list page's two fields), the value is centered in its box within 1.5 px, «+» sits at the box's
    right edge, and the box is `min(240, column)` wide (the alt pair: its block). Case 104 holds it; the choice is
    named in `handoff.md` and the decision log (item 16); `FEATURES.md` "Rolling" and `DESIGN.md` match.
15. Bundle ceiling (own line, review 9a R1): `tools/bundle-budget.mjs`, `.claude/README.md` and the new decision file
    give 300 kB unconfigured and 350 kB configured; the budgets rise only by the measured-total rule; the measured
    totals of both builds (`npm run check:built`, and the configured line of `.claude/README.md`) are in `handoff.md`.
16. States and cases: every new or changed open or pressed state has its inventory entry, a RU and EN golden and an
    axe case (list below); cases 102, 103 and 104 pass; `FIRST_SCREEN` has `#/lists as gm1` and `#/lists ~ many
    lists as gm4` at `shipped: true`; no stale case is left red or deleted.
17. RU and EN parity, ASCII, American spelling and both plural sets hold for every new or changed string
    (`i18n.test.ts`); the detector (`impeccable detect --json --no-inline-ignores app/src`) reports no new finding in a
    touched file; no `impeccable-disable` comment is added.
18. `polish` and `harden` ran on `ListsPage`, `ListCard`, `AddToList` and `ImportPanel`; `handoff.md` gives the
    outcome; the screenshot set of S11 is in `issues/57/mocks/8/built/`.

## First-screen rows (section 14)

| Row | 360x640 RU / EN | 1180x720 | Limit |
|---|---|---|---|
| `#/lists as gm1` (3 lists) | mock 231 / 231; asserted at 256 | mock 189 / 189; asserted at 288 | rule |
| `#/lists ~ many lists as gm4` (30 lists, search row) | mock 253 / 253; asserted at 256 | mock 191; asserted at 288 | rule |

If the built page measures past the limit, name the measured value in `handoff.md` and the AFK log before moving
the limit (section 14, "Named exceptions"); do not move it silently.

## Goldens and new states

New or changed `tests/app/inventory.js` entries, each with its RU and EN golden and an axe case:

- `#/lists as gm1` (changed: no group heading, the head, the count line, cards with «Ещё»), `#/lists` signed out
  (changed), `#/lists ~ load failed` (changed), a new `#/lists ~ empty as gm4` (an account with no list; use
  `onAccount(d, [], false)`), `#/lists ~ new list as gm1` (the field open), `#/lists ~ list limit as gm2` (re-seeded
  with `onAccount` of 50 specs, then the press: the toast, the count red), `#/lists ~ card menu as gm1` (a card's
  «Ещё» open), `#/lists ~ lists selected as gm1` (changed), `#/lists ~ selecting as gm1` (the mode with no tick),
  `#/lists ~ more as gm1` at 360 (the head «Ещё»; its entry sets a 360 viewport as `~ more` of 9a does), `#/lists ~
  many lists as gm4`, `~ shown more`, `~ filtered`, `~ nothing found` (changed), `#/lists ~ created`, `~ not saved`,
  `~ requests as gm1` (changed: the chip), `~ lists deleted` (changed), the `~ import panel`, `~ import preview`
  (two), `~ import preview v2`, `~ import refused`, `~ imported` states (changed).
- `#/lists ~ help` and its goldens are removed.
- `#/lists/<uuid-not-found>` signed out (changed to `ErrorPage`) and signed in (new, as `gm1` with a missing id).
- The add-to-list states (`#/i/ci1 ~ list menu as gm1`, `~ in several lists as gm4`, `~ many lists as gm4`, `~ new
  list`, the table-row, roll and homebrew variants: about 12) are changed by the menu's content.
- About 35 to 40 goldens in one re-seed (`npm run build:test`, then the four `--update` shards, each with Bash
  timeout 600000; a golden is re-seeded, never edited by hand).

## States table (standing check 1)

At 360 and at 1180 px (case 102 and the goldens); limits from `limit_defaults` (`lists_per_owner` 50). Every row
passes through the shown list with no change of the row order: newest edit first; the primary stays in the head
at every state.

| State | The screen shows | Proof |
|---|---|---|
| empty (0 lists), signed in | the plate, hint, «Открыть таблицы»; the count line «0 списков из 50»; no «Выбрать», no search | golden, case 102 |
| signed out | the plate with the sign-in prompt; no primary, no import | golden |
| one list | one card; the count «1 список из 50»; «Выбрать» | unit test, golden `#/lists` |
| many (3, 7) | the cards, no search under 8 | golden `as gm1` |
| 8 to 24 | the search row from the eighth list; «Выбрать» last | golden `~ many`, case 102 |
| at the limit (50) | the first 24 cards, «Показать ещё (26)», the count red, the primary stays on | golden `~ list limit`, case 102 |
| one past the limit | a press on the primary toasts the limit; the field stays closed; no 51st card | golden, `listsPage.test.ts` |
| 3x default (150, an owner override) | the first 24, «Показать ещё (126)», a delete or select-all acts on the drawn cards only; the bar's «Все» ticks the drawn | `listsPage.test.ts` (150 fixtures), `lists.timed` is not needed: 150 cards are cheap |
| longest name (120) | wraps inside the card; the head's `h1` is fixed text; the menu's row and the toast cut at one line / wrap | goldens `~ long name` is not added; case 102 measures it |
| the bar, many ticked | the bar is at most 45% at 640x360; it never grows with the ticks (one summary line) | case 102 |
| the menu, 50 lists | the search, the scroll inside the chips box only, the heading and «+ Новый список» in view, at most `min(60vh, 340px)` | case 27 (adapted), case 103 |

At 360 with the keyboard open: the name field is in the panel under the head, above every card, so the keyboard
covers cards and not the field; the in-menu name field follows case 79 (the picker above the keyboard). The sticky
regions that can grow past the viewport are the selection bar (capped at 45% by case 102) and the header; the
popover has a max height and scrolls inside.

## Error scenarios (standing check 2)

| Scenario | The screen shows | Stored data and recovery |
|---|---|---|
| loading | `LoadState` «Загружаем...» in the collection's place; the head and the primary are drawn | none |
| a failed read | `LoadState` «Не получилось загрузить списки аккаунта.» and «Повторить»; the retry reads the account again and focuses the primary | nothing stored changes |
| a failed write (create, delete, the import press) | the existing «Не сохранено» in the count line with `SyncStatus` and «Повторить»; a refused import press toasts `accountFailed` and keeps the preview | the store keeps its buffer and retries the same ops (the existing path); the page adds no write path |
| offline | as a failed write; the cards read from the store | kept in the buffer; recovery: reconnect or «Повторить» |
| a conflict (another tab or device wrote first) | the card list follows the store: a list deleted elsewhere leaves the page and its tick is pruned; a list created elsewhere joins at the top | the store's own merge; the page holds ticks, the query, the open field and `listsShown` as page memory only |
| a record the page names was deleted | a card whose list went is gone; a stale «Удалить список» on a deleted list changes nothing; `/lists/<uuid>` of a deleted list draws the L14 `ErrorPage` | nothing to restore (no undo; the confirm said so) |
| a stale tab (the previous bundle) | the previous bundle keeps working on the same store; this batch adds no stored key, no message and no route | none |
| a revert (the previous frontend) | the previous page reads the same account lists; it loses the new look only | nothing stored by this batch |
| the import preview with an unheld own item | unchanged (the existing waiting state) | unchanged |
| the number stepper | unchanged behavior; CSS only | none |

A path of this batch can lose no stored data: it adds no write, no key and no migration.

## Consistency (standing check 3)

Rules of `FEATURES.md` "Consistency rules" followed: 1 (the counter at the head of the collection), 2 and 6 (the
failure and load lines), 3 (the delete confirm ends «Отменить удаление нельзя.»), 4 (the page is «Мои списки» in the
heading, the pin and the tab), 5 (the create toast), 7 (the `ErrorPage` title is the one `h1`), 8 (the create
button «Новый <noun>» with the plus icon; the submit «Создать»), 10 (a list delete asks and has no undo), 11
(«Отмена» discards, the toggle closes the import), 20 (every focus move above). Departures, each named: rule 9
(the primary sits in the head, as the Items tab; the import is the head's toggle or an item of «Ещё»), rule 8 (the
add-to-list «+ Новый список» is a button with the plus icon, no longer a chip, so the old chip departure now reads
as a button; the form's submit is «Создать»), the signed-out add-to-list menu keeps two steps (L13), the pin at
1180 in the head (L1), no «Закрыть» on the import panel (L7).

Compared with the siblings (`/homebrew` Items tab, the catalog, `/search`): one name for a thing in the menu, the
heading and the tab («Мои списки»); the count and the limit in one place; the page head in every state (the `h1`
draws in loading, failed and empty states; signed out too); load, empty and error wording from the sibling
patterns (`Empty`, `ErrorPage`, `LoadState`); toasts in rule 5's words; the selection bar is `SelectionBar` with
«Все», the count, the actions and «Снять выделение» last; the button verbs are «Создать», «Отмена», «Повторить»,
«Выбрать». The difference from `/homebrew`: its import is a lazy chunk and `/lists` imports `ImportPanel` directly
(a smaller panel, already in the bundle); the difference from the catalog: the search row has no filter (a list has
only a name).

## RU and EN parity (standing check 4)

Every new key is in both languages with the same facts and ASCII punctuation: `listNameLabel`, `listsNoneTitle`,
`listsNoneHint`, `listsHead`, `importSkippedList`, the four not-found keys, `listNamePh` (changed); `moreOf` exists. No new plural set; the existing `itemsN`, `listsN`, `noticesN` and `requestsWaitN` keep theirs.
`inboxHead` is reused. EN keeps its own words ("items", not the mock's "entries"): the dictionary wins over the
mock. `i18n.test.ts` fails on a key that is in one language only.

## DESIGN.md rules this batch writes

- The Seal Rule: the «Новое в списке (N)» chip is neutral; a card selection is neutral (a lit border and a check).
- The Same Label Rule: the interim exception goes.
- Components: the list card (the labeled «Ещё», the chip) and the add-to-list menu (the heading, the check, the
  count, the popover at every width) are described in one sentence each.
- The One Width Rule or "Layout": the stepper sentence of L10, if the file describes it.

## Tests

| Test | Reads |
|---|---|
| `listsPage.test.ts` | L1-L7: the head at both bands, the primary and the field, the limit, the count line, the search from 8, the card's menu, the bar and its focus moves, the empty, signed-out and failed states, 150 cards, the import toggle; axe in each |
| `listFind.test.ts` | no `rows`: a search box and «Выбрать», no filter; the old cases |
| `lists.test.ts`, `rollResult.test.ts`, `itemPage.test.ts`, `pickRow.test.ts`, `homebrewPage.test.ts` | the menu's heading, rows, check and count; the chips' old assertions adapted; axe |
| `importPanel.test.ts` | no raw id in a skip line, the closed fold, the refused report's codes |
| `listPage.test.ts` | the two `ErrorPage` branches |
| `help.test.ts`, `i18n.test.ts` | `LISTS` gone; parity |
| `a11y.test.ts` | `COVERED`: the `BatchBar.svelte` row goes |
| `tests/app/states.js` | cases 102-104 and the adapted cases; `FIRST_SCREEN` |

## Verification

Local (Bash timeout 600000 where a command runs long): the affected vitest files (the ones above plus
`state/app.test.ts` if `app.svelte.ts` changed, which this batch does not plan), both lints after the last edit,
`node tools/decisions.js`, `node --test tools/artwork/lib.test.mjs`, the golden re-seed (`npm run build:test`, then
the four shards with `--update`), `npm run check:built`, the configured budget line of `.claude/README.md`, the
detector, and `rtk npm run check:fast` last. CI runs `app/states`, `app/contracts`, `app/hues`, `app/typo`,
`sweep.js` and `e2e`; the writer reads the failures of its predecessor's run before it pushes. A schema change: none.

## Risks and do-nots

- Do not add a write path, a stored key, a route or a contract change. `ROUTES.md`, `CONTRACTS.md`, `routes.json`
  and `llms.txt` do not change.
- Do not build a sheet for the add-to-list menu (L12) and do not nest a `Sheet` in a dialog.
- Do not change `RecordModal`, `Sheet`, `Toast` or `app.dialogOpen`.
- Keep `pageBar` as a top-level snippet in `ListsPage`: a snippet inside another cannot reach the script.
- A stale case is the likely CI failure (9a): do the preflight read of the readers before the first edit.
- `ListFind`'s optional filter props must not change `ListPage` or `SharedListPage` (their cases stay green).
- Settled and not to reopen: the neutral selection, the one bar, rule 8, Q8.1 (the help panel goes), round 3 unit B
  (the primary stays on at the limit and explains it), the owner's 300 kB ceiling.
- The owner's mock departures are named in L1, L6, L7, L12, L13.

## Gate cost

`rtk npm run check:fast` 10-14 min (it reaches the component suites and `dict.ts`), one CI run 10.5-11.5 min, one
review fix cycle (a second `check:fast` and CI run), the golden re-seed and `build:test` 15-20, `check:built` and the
configured budget line 3, both lints and decisions 3, `polish` and `harden` 5-10, the screenshot set 5. Total 75-100
min (section 8, row 8).

## Writer tests (for the orchestrator's dispatch; not a model choice)

1. A step that asks the implementer to choose between approaches, or an `Open design question:` line: no. Every fork
   (L12 the popover, L10 the stepper, L13 the menu) is decided with a default and a named fallback.
2. A public contract, route, stored state, product law, hook, or configuration every later session runs under: yes,
   in part. The bundle ceiling is configuration (`tools/bundle-budget.mjs`, `.claude/README.md`, a decision file),
   and a guard may refuse one write. No contract, route, stored state or product law changes.
3. An acceptance line on visual judgment (a golden re-seed, parity with a design node): yes. About 35 to 40 goldens
   re-seed, and the card, bar, head and menu follow mock 8.
4. The remediation of a batch that stopped early or failed review: no.

Tests 2 and 3 hold, so `opus` by `orchestrate.prompt.md`, "Writer tier".

## Split criterion

Batch 8 is one batch: the page, its card, its import and the menu share `ListCard`, `AddToList` and the `#/lists`
and menu goldens (one re-seed). It is split from 9a and 9b by a different route and filter set (`CLAUDE.md`, "Size a
batch by its gates"). The two owner items ride here because each is a few CSS lines or one comment line with its own
case and no golden.

## Plan review

Not required. No trigger fires: no migration, no `SECURITY DEFINER` function, no public contract change (`routes.json`,
`CONTRACTS.md`, `llms.txt` stay), no stored data or `localStorage` key, no new write or sync protocol (create and
delete use the existing store calls; the import uses the existing `importLists`).
