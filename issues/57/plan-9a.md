# Batch 9a - The list pages on a phone (implement-ready)

This brief is the implementer's whole input for batch 9a, with the mock `mocks/F/` (`index.html`, the PNGs,
`f.js`, `f.css`), `feedback.md` sections C and D, mock 9 for every state that `mocks/F/` does not replace,
and `plan-5.md`, `plan-6.md`, `plan-7.md` for the shapes those batches ship. The owner is AFK
(`context.md`, "Owner AFK from 2026-11-03"), so every choice below is the recommended option; the
orchestrator logs each one in the owner-AFK decisions file. A mock is direction (owner, 2026-11-03): the
departures are named in "Decisions", and none of them reopens a decision of the owner. Section numbers
("section 7") are those of `plan.md`.

Batch 9a is the last batch of wave 2. It runs after batch 7's `polish`, `harden`, review and CI.

## Objective

A phone reader sees about seven rows of a list, not two. Up to 760 px `/lists/<uuid>` and `/s/<token>` draw
a compact row: a press unfolds the full row, and the quantity stays live on the owner's page. The owner's
page gets search and filter from 8 entries at every width, with the filter in page memory. Up to 760 px
its head holds the name, «Ещё» and one meta line, so the first entry passes the First-Screen Rule at 360.
Both pages take the selection mode and the one selection bar of batch 3. `/s/` loses its last pills,
`FilterBar` goes, and the shared page's strip and always-on ticks go. Nothing new is stored.

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a rebase).
- Batches 5, 6 and 7 are on the branch by now. Read `git log --oneline -12`, then `git diff 91bdcc55 HEAD --
  app/src/components/MoreMenu.svelte app/src/components/PinItem.svelte app/src/components/ErrorPage.svelte
  app/src/components/Empty.svelte app/src/components/SelBar.svelte app/src/components/FilterPanel.svelte
  app/src/components/Sheet.svelte app/src/components/RowMain.svelte app/src/components/TableRows.svelte
  app/src/components/Menu.svelte tests/app/states.js`. This brief names these shapes: `MoreMenu` (props
  `app`, `id`, `up?`, `label?`, `size?`, `disabled?`, `children(close)`), `ErrorPage` (`title`, `children`,
  `actions`), `Empty` (`title?`, `glyph?`, `children`), `Marked`, `RowMain` as batch 7 left it (`numLabeled`,
  `Marked`), `HomebrewBulk` (the bar's narrow «Ещё»), `SelBar` with its `hb` branch, case 83 with its
  `exception` limit (`plan-5.md` S10). A line that no longer matches is the implementer's to adapt, and
  `handoff.md` names the change.
- The code facts below were read on `91bdcc55` while a fix pass ran in this tree. They are not a substitute
  for reading the shipped file.
- The mock is `mocks/F/`, re-checked against the code. The departures are G3, G5, G9, G10, G12 and G14. The
  mock is not redrawn and not shown to the owner again.
- Impeccable cannot run from a subagent. The orchestrator runs `polish` and `harden` after S12 on `ListPage`,
  `SharedListPage`, `CompactRow` and `ListFind`, from the built app at 360 and 1180 px; fallback
  `impeccable:impeccable-finish-reviewer`.
- Steps are S1 to S14. The line "Session end partial progress" in `handoff.md` names the last finished step.

## Decisions of this refresh (planner defaults; the owner is away)

| # | Decision | Reason and trade-off |
|---|---|---|
| G1 | One new `CompactRow.svelte` with two callers. `ListPage` keeps its `div.row.lrow` wrapper, so the drag port (`[data-index]`, `[data-drag]`), the drop marks and `.lrow input[data-qty]` keep working. `TableRows` gains a `row?: Snippet<[TableEntry]>` prop that replaces `RowMain`, so `/s/` keeps `.selbox`, `data-row` and `inside`. | One shared component, as `feedback.md` says. A second row list on `/s/` would copy the tick and take line. |
| G2 | Keyboard order in a compact row: the tick (selection mode only), the body button, the quantity field, then the unfolded part (position, price, «Заметка», «Ещё», note boxes). The DOM holds this order; the quantity overlays the body's reserved last column by the grid (`.cbody`, `.cqf` in one cell, `z-index: 1`), so the tab order and the visual order agree. The press keeps the focus on the body button. `aria-controls` is drawn only while open: a missing id fails axe. | The orchestrator's check. A quantity inside the button is invalid (nested interactive). |
| G3 | The GM-only mark on the meta line is `Icon eyeOff`, the app's one sign for that state, with the hidden text `, Только для мастера`. It draws wherever the entry is GM-only, so also on a GM's `/s/` link. **Departures:** the mock draws a lock (no such icon in `icons.ts`), and draws it on the owner's page only. | One sign for one meaning; `.gm-only` already draws on the GM link, and a dashed row with no mark would need a legend. |
| G4 | The note mark is `Icon note` plus a hidden `t.note` inside the body button, drawn when `m.note \|\| m.hnote`. A players' link never holds `hnote`, so no projection rule is added. The note boxes and `HitNote`s draw only inside the unfolded part up to 760 px. `boxHidden` keeps its default, so an open row with a note shows it. | A mark by color alone fails WCAG 1.4.1. `noteInput` writes on each `input`, so a fold loses nothing. |
| G5 | The line of an entry (`rowLine`): armor and weapons take their stats, in the order of `feedback.md`. A record whose stats are empty (a homebrew equipment entry can have `eq` undefined) falls to its text. The text is the first non-empty line of `markupText(descOf(it, lang))`, so no `**` shows. **No text and no stats: no line and no empty box; the row is about 57 px.** Weapon class stays in the unfolded stats. **Departure:** the mock's `effect()` passes raw HTML through a strip; the app has a markup parser. | An empty line would be 20 px of nothing. `markupText` already exists. |
| G6 | The meta line: the first `cardBadges` badge (a record with no `eq` draws the item or consumable badge), then the price, else `srcLabel`. The source is one line with an ellipsis (`BOOK_NAME_MAX` is 80, so a homebrew source can fill the row); the price wraps and is never cut. A not-loaded row draws the key as its name, `itemNotLoaded` on the meta line, the item glyph, no line. An own picture goes through `artSrc(it.img, false, 'thumb')`, as `RowMain`. | A homebrew entry and an entry with no text are the two edge rows. A homebrew axe (`AXE_KEY`) and a long-source item (`LONG_SRC_ITEM_KEY`) are already seeded. |
| G7 | The live quantity is the existing path: the field calls the existing `setQty`, which writes `cloud.setMeta(...,'qty',...)` on `input`. No component buffer, no second field per row, no stepper. The store's write buffer (key `entry:<row>:qty`, 2 s quiet) keeps one write for a run of keys. `data-qty` stays. `max` reads `QTY_MAX`. A focus writes nothing. Spinners are off (`appearance: textfield`): they do not fit 42 px; the arrow keys still step. | The orchestrator's check. Case 49 proves one write for ten keys at 1180; case 95 proves it on the compact field. |
| G8 | Position numbers: on the owner's page the true `at + 1` of `narrowEntries`, also in `setPos`, `removeEntry`, `data-index` and `dropGap`. On `/s/` the place in `shared.ids` (a `Map` built once), also while filtered. **Accepted:** a players' link numbers the rest from 0 (`FEATURES.md`), so with a GM-only entry a player's numbers can differ from the owner's. | The server sends no owner position. Only the list page rolls by number. |
| G9 | `/s/` lead line (added to 9a: `FIRST_SCREEN` needs it). At every width the `h1`, then one line: the count, «Обновлено ...», then the buttons «Заметка» (`shared.note`) and «Заметка мастера» (`shared.hnote`), each opening its `HitNote` in place, closed on arrival. `t.sharedList` leaves the line and the dictionary. The `h1` takes one line with an ellipsis up to 760 px and three lines from 761 px. **Departures:** the mock lower-cases «обновлён»; this keeps `updated` text, so cases 45 and 52 do not move. The GM link's two buttons take a second line in RU: about 306 px at 360, not asserted (no `FIRST_SCREEN` row; a GM reads on a laptop 80% of the time). | Section 14's row `9 / shared-player` assumes this fold, and section 7's 9a list omits it. Without it `/s/` cannot reach 286. |
| G10 | `/s/` «Печать» (round 3, unit B). The code holds no whole-list print on `/s/`: the only «Печать» is the bar's, which already sits behind «Выбрать». So up to 760 px the line holds as it stands. **Departure:** from 761 px no button is added to the action row, as the mock draws. | A new whole-list print with its sign-in prompt is a new feature (issue: "no new features unless a fix needs one"). «Выбрать», «Все», «Печать» prints a whole list at every width. No feature leaves. |
| G11 | The filter link on `/s/` still opens the panel, now the sheet. `ROUTES.md` says so, and section 7 says `ROUTES.md` does not change, so the spec wins. `tests/app/contracts.js` keeps reading `[data-fval][aria-pressed="true"]` and drops only `.fpill`. See Q9a-1. | The catalog opens no sheet on a link; this is a named difference. A later change is `ROUTES.md` text, so it is the owner's. |
| G12 | The owner's selection bar. `lsel` and `picked` stay in `ListPage`, because every batch action reads them. `AppState` gains `pageBar = $state.raw<Snippet \| null>(null)`; `ListPage` sets it to a top-level snippet that draws `SelectionBar` while `own && app.selecting`, and clears it in `onDestroy`; `SelBar` renders it before its own branch. So the bar keeps its one place between `main` and the footer. `app.selecting` is reused, so a navigation leaves the mode (`#clearTicks`). **Rejected:** `SelectionBar` inside `main` (`--wrap` is a percentage, so the bar shrinks 32 px and loses its full-bleed ground); moving the ticks to `app.sel` with a `ListBulk` hook (about 160 lines moved, and `app.shared` would change what a card's add menu copies). | `SelectionBar`'s comment already says that a snippet keeps its caller's CSS scope. Accepted: one more field on `AppState`. Batch 8 can reuse it for `/lists`. |
| G13 | The bar's actions. From 761 px: «Цены» (caret), «Скопировать текст», «Скрыть от игроков (N)» / «Показать игрокам (N)», «Удалить (N)» (danger). Up to 760 px: «Цены», then `MoreMenu up` holding the copy, the hide, a separator and the danger «Удалить (N)» (H6 of `plan-6.md`). Zero ticks: the actions off, the clear on. | Round 6: rare actions fold at 360. Three flexible buttons cut «Скопировать текст» in 328 px. |
| G14 | «Цены» opens a `Sheet` «Цены выбранных» at every width, with the panel's content as it is. **Departure:** the mock draws a page section. | The bar is sticky now, and today's `below` panel with 210 px of rows and a number field grows past the window at 360 with the keyboard open, leaving its buttons out of reach. `Sheet` holds the head and foot and scrolls. Focus returns to «Цены» (rule 20). |
| G15 | New `ListFind.svelte`: the search row of both pages (`SearchBox` with `placeholder={t.searchShort}` and `label={t.searchPh}`, «Фильтры · N» while `rows.length`, `SelMode` last) and `FilterPanel` with `band="mid"`, the sheet at every width. It draws only while `finding`. `filterOpen` stays with the page, because `/s/` opens it from the address. | The second use. A 250 px column has no place on either page. |
| G16 | `SelMode.svelte`: the «Выбрать» button with its CSS, extracted on this use. `TablesPage`, `SearchPage` and `HomebrewPage` lose their copies; the DOM and `.selmode` do not change. Below 8 entries the page draws it: the title row up to 760 px, its own right-aligned row from 761 px on the owner's page; the end of the action row on `/s/`. | `CLAUDE.md`: extract and remove the inline copies. The fourth and fifth uses would otherwise copy the rules again. |
| G17 | The list «Ещё» (`MoreMenu id="list-more"`, at every width). Up to 760 px, in mock F's order: «Поделиться», «Печать», «Бросить по списку», a separator, «Цены: монетами» or «Цены: как в книге» (while `priced`), «Скопировать текст», «Скачать JSON», a separator, «Удалить список» (danger). From 761 px the action row is «Поделиться», «Печать», «Ещё», and the menu holds the last three. «Бросить по списку» sets `rollOpen`, and the panel draws under the head; 9b rewrites it. | D-head 1, A3, N9-2. An item with no target leaves: «Печать» with no loaded item, the roll with fewer than 2 rows. |
| G18 | Up to 760 px «Заметки ▾» on the meta line opens the list notes (closed on arrival), and `.money`, the `<details class="lnote">` and the roll `<details>` do not draw. **Interim until 9b:** the money «?» has no route up to 760 px; the owner removes it anyway (Q9.1). From 761 px those three blocks stay as they are, so the 1180 px offset stays logged. | N9-2. Least work: 9b rewrites all three (the owner's interim rule). |
| G19 | Full rows from 761 px change only here: ticks only in the selection mode, the neutral `.sel`, no grip while narrowed, «Добавить свой предмет». Their three icon buttons stay until 9b, each at least 24 px tall. | A2 in part. The row's «Ещё» from 761 px is 9b's. |
| G20 | No match on both pages: `Empty title={t.nothing}` with «Сбросить всё», which clears the query and the filter. **Changes `/s/`:** today the button draws only while a value is in force. The focus goes to «Фильтры», else the search box, else `#main`. | Mock `d-empty` has a query alone and a reset. Rule 20. |
| G21 | The filter's helpers move to `lib/`: `inForceOf`, `toggledFilter` in `filters.ts`, replacing the copies in `SharedListPage` and `HomebrewPage`; `narrowEntries` in `lists.ts`. | Pure logic belongs in `lib/`; this is the second use. |
| G22 | A decision file records G1, G12, G14, D1, D-head 1, and what was rejected (S12). | They outlive the task. |

## Owner questions (default taken; none blocks)

- Q9a-1. A filter link opens the sheet over the list on a phone (G11). Recommended later: stop opening it, as
  the catalog does; the cost is one sentence of `ROUTES.md` and one reader in `tests/app/contracts.js`.
- Q9a-2. With a GM-only entry, a player's position numbers can differ from the owner's (G8). Recommended:
  accept it; the fix is a server projection change with a migration.

## Placed items (the orchestrator folds these into `plan.md`; this brief cannot edit it)

- Section 8, row "9a": replace 15-25 and the 1 of the row "4-8, 9a, 9b" with 35-47 minutes of extra gates.
- Section 7, batch 9a, and section 14: `#/s/player-token-1` holds 10 entries (`fake-cloud-seed.ts`,
  `uuid(101)`), so it is itself the row of 8 or more. It takes `{ shipped: 360, exception: 286 }`, and no second
  `/s/` row is added. No seeded share has fewer than 8 entries; `sharedListPage.test.ts` holds that case.
- Section 7, batch 9b: the `compact` card and `sendAll` on the list roll (`plan-4.md` K5, `plan-5.md`) stay
  with 9b's A42, because 9a does not touch the roll panel. 9b also takes the three icon buttons from 761 px
  into the row's «Ещё», and `.lnote`, `.lroll`, `.money-l` of handoff Deferred.
- Section 7, batch 8: `pageBar` is free to use for `/lists`; `BatchBar` keeps `ListsPage` as its last caller.
- `plan-7.md`, "Placed items", says the `selectAll` key goes. It stays: `SelBar` reads it as the name of «Все».
- Plan review: not required for batch 9a (see the end of this file).

## In scope

- The outline of section 7, "Batch 9a", every line, and the placed lines of `plan-6.md` and `plan-7.md`.
- New: `CompactRow.svelte`, `ListFind.svelte`, `SelMode.svelte`.
- Changed: `ListPage`, `SharedListPage`, `TableRows`, `RowMain` (`full`), `SelBar`, `QuickItem` (`oncreated`),
  `TablesPage`, `SearchPage`, `HomebrewPage` (G16, G21), `lib/label.ts`, `lib/i18n.ts`, `lib/filters.ts`,
  `lib/lists.ts`, `lib/dict.ts`, `state/app.svelte.ts`.
- Deleted: `FilterBar.svelte`, `filterBar.test.ts`, the `anyValue` key, the `TableRows` strip, `toggleAllIn`.
- The browser suites, the goldens and the prose that name a moved control.

## Out of scope

- 9b: the note switch, the side column, the share, roll and requests panels, the price switch, A1, the «?»
  removal, the row's «Ещё» from 761 px, E2, E4. `FIRST_SCREEN` at 1180.
- A stored display mode, a stepper, a «Подробно» switch, a drawn clear control on `SearchBox`
  (`feedback.md` rejects or defers each). `ROUTES.md`, `CONTRACTS.md`, `routes.json`, `llms.txt`, the store,
  the cloud port.
- `BatchBar` (batch 8), `ListsPage`, the catalog's filters, `FilterPanel`, `Sheet`, `SelectionBar`, `Menu`.

## Facts read from the code (91bdcc55, 2026-11-04; batches 5 to 7 are not on it)

1. `ListPage` keeps `lsel` and `picked` locally and clears them on `app.navigations`. `BatchBar` sits in
   the page. `SelBar` draws from `app.sel`, which `#clearTicks` empties on every route change that is not
   `keepsTicks`, so the owner's page arrives with an empty `app.sel`.
2. `onDrag: (from) => { dragId = items[from]?.id }` reads `items`, which skips not-loaded rows, while `from`
   is the `data-index` of `rows`. Above a not-loaded row the drag picks the wrong entry: a cheap bug in the
   touched path (S7).
3. `SelBar` draws `{#if n || shared || app.selecting}`. `Shell` mounts it between `main` and the footer.
   `.selbar { width: var(--wrap) }`, and `--wrap` is `min(1180px, 100% - 32px)`.
4. `FIRST_SCREEN` case 83 asserts on `if (row.shipped)`: a truthy `360` would also assert at 1180.
5. `FilterPanel` draws the column only for `band === 'wide'`, so `band="mid"` is the sheet at every width.
6. `SharedListPage` sets `filterOpen = true` when the address segment is not its own. `shownItems` filters
   `items`; `tailOf` builds `×2 · <price>`, used by the full row only.
7. `RowMain`'s text column clamps at two or three lines by the scoped `.row-main .rt > span` rule.
8. `Icon` has `note`, `eyeOff`, `chevron`, `more`, `plus`, `print`, `share`, `copy`, `die`, and no `lock`.
9. `markupText(src)` in `lib/markup.ts` is exported. `eqParts` puts class, trait, range, damage, burden.
10. `Shell`'s `FIELD` guard holds the header while a number input has the focus (`plan-3b.md`), so a tap on
    the quantity freezes the header until a blur. No change.
11. `LIST_A as gm4` is seven entries (`SEVEN_SPECS`). Lists `uuid(101)` (10 entries, a homebrew axe, notes, a
    99999 price) and `uuid(301)` (8 entries, two homebrew, a long source) are seeded.
12. `NAME_MAX` is 120, a validator constant: the "200-character" of round 3 is 120 in the app.

## Files expected

| Step | Files |
|---|---|
| S1 | `app/src/lib/dict.ts`, `lib/i18n.test.ts` |
| S2 | `lib/i18n.ts`, `lib/label.ts`, `lib/label.test.ts`, `lib/filters.ts`, `lib/filters.test.ts`, `lib/lists.ts`, `lib/lists.test.ts` |
| S3 | new `CompactRow.svelte`, new `compactRow.test.ts`; `RowMain.svelte` |
| S4 | new `SelMode.svelte`, new `ListFind.svelte`, new `listFind.test.ts`; `TablesPage`, `SearchPage`, `HomebrewPage` |
| S5 | `state/app.svelte.ts`, `state/app.test.ts`, `SelBar.svelte`, `selBar` cases in `shell.test.ts` or `tables.test.ts` |
| S6 | `TableRows.svelte`, `tables.test.ts` |
| S7 | `ListPage.svelte`, `QuickItem.svelte`, `listPage.test.ts`, `lists.test.ts` |
| S8 | `SharedListPage.svelte`, `sharedListPage.test.ts` |
| S9 | delete `FilterBar.svelte`, `filterBar.test.ts`; `a11y.test.ts`, `tables.test.ts`, the comments that name it |
| S10 | `a11y.test.ts` (`COVERED`) |
| S11 | `tests/app/states.js`, `inventory.js`, `contracts.js`, `sweep.js`, `driver.js` if a helper is needed, `hues.js`, `typo.js`, `tests/e2e/flows.mjs`, about 50 goldens |
| S12 | `FEATURES.md`, `STATE.md`, `COVERAGE.md`, `DESIGN.md`, a new decision file, `docs/DECISIONS.md`, `tools/bundle-budget.mjs`, `.claude/README.md` |
| S13 | `handoff.md` (the Impeccable outcome) |
| S14 | `issues/57/mocks/9a/built/`, `handoff.md` |

## Steps

### S1. Strings

In both languages of `dict.ts`, same keys, ASCII punctuation, «ёлочки» in RU only, no new plural form:

| Key | RU | EN |
|---|---|---|
| `qtyOf` | Кол-во: %s | Qty: %s |
| `moreOf` | Ещё: %s | More: %s |
| `openCard` | Открыть карточку | Open the card |
| `rollFromList` | Бросить по списку | Roll on this list |
| `listDeleteItem` | Удалить список | Delete the list |
| `moneyTo_bag` | Цены: как в книге | Prices: as in the book |
| `moneyTo_coin` | Цены: монетами | Prices: in coins |
| `priceSelTitle` | Цены выбранных | Prices of the selected |
| `noteGmLink` | Заметка мастера | GM's note |
| `rowHide` | Скрыть от игроков | Hide from players |
| `rowShow` | Показать игрокам | Show to players |

- Change `quickOwn`: RU «Добавить свой предмет», EN "Add your own item" (A41; `ListPage` is its one reader).
- Delete in both languages: `anyValue`, `quickRowHint`, `sharedList`, and each key `FilterBar` alone reads. Run
  `git grep -n -E "<key>"` first. `selectAll`, `shownOf`, `filters`, `filtersN`, `filterLink` stay.
- A `%s` fill with a record's name uses a function replacer (`.replace('%s', () => label)`): a homebrew name
  can hold `$&`.

### S2. Pure helpers

- `lib/i18n.ts`: `eqRowParts(it, lang, labels): string[]`. Armor: thresholds, then the score, as `eqParts`.
  Any other `eq`: damage with its type, range, burden, trait, each dropped when empty. No `eq`: `[]`.
- `lib/label.ts`: `rowLine(it, lang, t): string`. `eqRowParts(...).join(' · ')`; when that is empty, the
  first non-empty line of `markupText(descOf(it, lang) || '')`, trimmed; else `''`. `label.test.ts`: a weapon's
  order, a cut that takes the trait last, armor, a consumable, markup removed, a list and a table as first
  block, a homebrew record with `kind: 'equip'` and no `eq`, a record with no text (`''`), RU and EN.
- `lib/filters.ts`: `inForceOf(rows, picked): FilterState` (the body of `SharedListPage`'s `inForce`) and
  `toggledFilter(rows, state, group, value): FilterState` (the body of `pickFacet`). Tests: a value no row
  offers is not in force; order follows the row.
- `lib/lists.ts`: `narrowEntries<T extends { id: string; it: Record_ | null }>(rows, inForce, terms, statLine,
  hay): (T & { at: number })[]`. `at` is the index in `rows`. With no value in force and no term every row
  passes. A row with `it === null` fails while a value is in force or a term is set. Tests: both, the true
  `at`, 300 rows.

### S3. `CompactRow` and `RowMain` `full`

`CompactRow.svelte` props: `it: Record_ | null`, `id`, `no: number`, `index`, `lang`, `artBroken`, `onartfail`,
`open: boolean`, `ontoggle`, `price?: string`, `note?: boolean`, `gmOnly?: boolean`, `qtyText?: string`,
`field?: Snippet`, `children?: Snippet` (the unfolded part, drawn while `open`).

```svelte
<div class="crow" class:open class:ro={!field} class:fx={!!line}>
  <button type="button" class="cbody" aria-expanded={open}
    aria-controls={open ? `crow-${id}` : undefined} onclick={ontoggle}>
    <span class="cart" class:gm={gmOnly}><ArtWell ...>img</ArtWell><span class="cno">{no}</span></span>
    <span class="ctext"><span class="cname">name{gm vh}</span>
      <span class="cmeta"><Badge/>price or source; note mark; GM mark</span></span>
    <span class="cchev"><Icon name="chevron" /></span>
    {#if line}<span class="cfx">{line}</span>{/if}
  </button>
  {#if field}{@render field()}{:else if qtyText}<span class="cqv">{qtyText}</span>{/if}
  {#if open}<div class="cfull" id="crow-{id}">{@render children?.()}</div>{/if}
</div>
```

- CSS from `mocks/F/f.css` (`.crow` to `.cfields`), with the nearest type tokens: art 44 px, the name 15 px weight
  600 on two lines (`line-clamp: 2`, none while `.open`), the line 13 px on one line with an ellipsis, the grid `44px minmax(0, 1fr) 20px 50px` (`34px` for `.ro`). `.cbody` and the field share one
  grid cell. `.cfull` has no background: a fill would cover the `drop-after` inset mark.
- The flat row: `:global(.rows:has(.crow)) { gap: 0; border-top: 1px solid var(--line2) }` and `:global(.rows
  .row:has(.crow)) { border-width: 0 0 1px; border-radius: 0; background: none }`, so 77 px holds. `.gm-only`
  keeps the dashed box with `margin: 2px 0` and `padding-inline: 6px`. `.sel` keeps `--surface2`. The focus ring
  sits inside (`outline-offset: -2px`): `.row` clips.
- `RowMain` gains `full?: boolean`: a `div.row-main.full` with no art, no name, no click, the tags, stats, text and
  craft lines unclamped, through one local snippet for the text column, so the button's DOM does not change.

### S4. `SelMode` and `ListFind`

- `SelMode.svelte`: props `label`, `onclick`; `<button type="button" class="selmode">` with `TablesPage`'s rules.
  Its height is 40 px on its own (the rule leaves `.searchrow`). `SelBar.clear()` keeps finding `button.selmode`.
  Replace the three copies; run `git grep -n "selmode"` first.
- `ListFind.svelte` props: `app`, `rows`, `picked`, `shown`, `query`, `onquery`, `open`, `onopen`, `onclose`, `onpick`,
  `onclear`, `onreset`, `oncopylink?`, `selectable: boolean`, `onselect`, `toggle = $bindable()`.
  One `.lfind` flex row (gap 8, `margin: 0 0 10px`, no wrap), `div.grow` over `SearchBox`, then, while `rows.length`,
  `Button size="sm" variant={n ? 'toggle' : 'plain'} expanded={open} bind:el={toggle}` reading `filtersN` or
  `filters`, then `SelMode` while `selectable`. Then `FilterPanel band="mid"` with `shown`, `oncopylink`. The sheet's
  close focuses `toggle` (rule 20).

### S5. `pageBar`

`app.svelte.ts`: `pageBar = $state.raw<Snippet | null>(null);` with a comment that names its one reader. `SelBar`:
`{#if app.pageBar}{@render app.pageBar()}{:else if n || shared || app.selecting}...{/if}`. Test: a set snippet draws
in place of the bar, and null brings the old branch back.

### S6. `TableRows`

Delete `ontoggleall`, `allSelected`, the strip, the `.selall` and `.selall .selbox` rules and the comment on them;
`selectAll` leaves this file only. Add `row?: Snippet<[TableEntry]>`: `{#if row}{@render row(entry)}{:else}<RowMain
.../>{/if}`. Then delete `app.toggleAllIn` and its tests when `git grep -n toggleAllIn -- app/src` shows no caller.
Drop the stale `.selall` filters in the test helpers that still name the strip.

### S7. `ListPage`

- State: `const narrow = $derived(app.band === 'narrow')`; `q`, `facets` (`FilterState`), `filterOpen`, `finding`,
  `filterToggle`; `openRows = new SvelteSet<string>()`; `notesOpen`, `rollOpen`. The `ownId` effect resets all of
  them. A second effect drops from `openRows` an id the list no longer holds.
- `facRows = listFacetRows(items, t, app.lang)`, `inForce = inForceOf(facRows, facets)`, `terms = parseQuery(q)`,
  `narrowed`, `shownRows = narrowEntries(rows, inForce, terms, statLine, hay)`. `finding` latches as on `/s/`, from
  `own.ids.length >= LIST_SEARCH_AT`, a query or a value in force, per list.
- D1 prune: an effect over `shownRows` drops from `lsel` and `picked` every id not drawn. `pickAll` ticks `shownRows`.
- Fix `onDrag`: `dragId = rows[from]?.id ?? null` (fact 2).
- `startSelecting()`: `app.selecting = true`, `await tick()`, focus `.selbarwrap .selall input`. `leaveSelecting()`:
  `lsel.clear()`, `picked.clear()`, `guess = false`, `app.clearSel()`, `await tick()`, focus `button.selmode`, else
  `#main`. `$effect` sets `app.pageBar = own && app.selecting ? listBar : null`; `onDestroy` clears it.
- Head. Up to 760 px: `.lhead`, a grid of `minmax(0, 1fr) auto`, holds `PageTitle` (`.page-h` in column 1, `.page-sub`
  across row 2) and `.lhead-acts`: `SelMode` while `!finding && rows.length && !app.selecting`, then the list «Ещё» (G17).
  `cloudSub` reads `t.shownOf` with `shownRows.length` and `rows.length` while `narrowed`, else `countOf(...)`, then
  the GM count and `SyncStatus`, then up to 760 px `· <button class="lnkb" aria-expanded={notesOpen}>{t.listNote}
  <Icon chevron /></button>`. From 761 px: `Actions` with «Поделиться», «Печать» while `items.length`, «Ещё».
- Up to 760 px: `{#if notesOpen}<div class="lnote">{@render notePair(own, 'list')}</div>{/if}`, and `{#if rollOpen}` the
  existing roll `<details open>`, whose `ontoggle` sets `rollOpen` false when it closes. From 761 px `.money`,
  `details.lnote` and `details.lroll` draw as today. `SharePanel` and `RequestsPanel` do not change.
- Search row: `{#if finding}<ListFind ... selectable={!app.selecting && shownRows.length > 0} />` with no `oncopylink`,
  `{:else if !narrow && rows.length && !app.selecting}` a right-aligned `SelMode`.
- `BatchBar` goes. Top-level snippet `listBar` draws `SelectionBar` with `label={t.selRegion}`, `total={shownRows.length}`,
  `picked={ticked.length}`, `allLabel={t.selectAll}`, `allText={t.allShort}`, `count={selCountText(...)}`,
  `clearText={t.clearSel}`, `onall={pickAll}`, `onclear`, the `summary` as today and the actions of G13. `.bulkmore` is
  `HomebrewBulk`'s rule.
- `{#if guess}<Sheet {app} label={t.priceSelTitle} title={t.priceSelTitle} onclose=...>`: the body of today's `below`
  snippet, the apply buttons in `foot`. `onclose` sets `guess = false` and focuses `guessBtn`. An effect closes it at
  zero ticks. `.guess` loses its top border. `.batch-lbl` leaves `--mono` for `--t-label` in `--ui` (handoff Deferred).
- Rows: `{#each shownRows as row (row.id)}`, the class list as today with `class:compact={narrow}`, `data-index={row.at}`,
  and `row.at` in place of `i`. `.lrow.sel` takes `TableRows`' neutral rule. The grip draws while `!narrowed`. Tick
  columns draw only while `app.selecting`. Up to 760 px the row is:

```svelte
{#if app.selecting}<label class="lrow-pick">...</label>{/if}
<CompactRow {it} {id} no={row.at + 1} {index} lang={app.lang} {artBroken} {onartfail}
  open={openRows.has(id)} ontoggle={() => flipRow(id)}
  price={(m.gold ?? 0) > 0 ? priceText(m.gold ?? 0, mode, app.lang) : undefined}
  note={hasNote} gmOnly={!!m.gmOnly}
  qtyText={app.selecting && (m.qty ?? 0) > 1 ? '×' + String(m.qty) : undefined}
  field={app.selecting ? undefined : qtyField}>
  {#if it}<RowMain full {it} {index} lang={app.lang} ... />{/if}
  <div class="cfields"> position, price, grip, «Заметка», row «Ещё» </div>
  {#if goldHint}...{/if}
  {#if !boxHidden(id, m)}<div class="rnote">...</div>{/if}
</CompactRow>
```

  `qtyField` is a local `{#snippet}` inside the `{#each}`: `<input type="number" class="cqf" min="1" max={QTY_MAX}
  inputmode="numeric" data-qty placeholder="1" value={m.qty || ''} aria-label={...qtyOf...} oninput={(e) => { setQty(id, e); }}
  />`, 42x44, `touch-action: manipulation`. Its CSS sits here (snippet scope): grid row 1, last column, `justify-self:
  end`, `margin-top: 6px`, `z-index: 1`.
  The position field, the price field and its «?» are one local snippet that both branches render, so 761 px and 760 px
  hold one copy. Row «Ещё»: `MoreMenu id="row-more-{id}" size="sm" label={moreOf}` with `rowHide` or `rowShow` (it calls
  `cloud.setGmOnly`), «Открыть карточку» (while `it`), a separator and «Убрать из списка» (danger). The press of the remove
  item closes the menu first; the undo toast takes the focus, as today.
- The take line stays under the row. Its `padding-left` is 11 px up to 760 px (already so at 600).
- `QuickItem` gains `oncreated?: () => void`, called once where the create succeeded. `ListPage` clears `q` and `facets`
  there. `.addhint` and its media rule go. No match: G20.
- `flipRow(id)` toggles `openRows`. `noteOpen`, `toggleNote`, `removeEntry`, `setPos`, `setQty`, `setGold` do not change.

### S8. `SharedListPage`

- `view.status === 'gone'`: `ErrorPage title={t.shareGone}` with `shareGoneSub` and the primary `toStart` (A21: the
  gutter comes with it). `error`: `ErrorPage title={t.sharedFailed}`, `sharedFailedSub`, primary `retry`.
- Head (G9): `sub` is a snippet. `.shhead :global(.page-h)` is one line with an ellipsis up to 760 px and three lines
  from 761 px. `UpdatedLine` leaves this page (`agoText` in the lead line); `ItemPage` keeps it. `.notes` draws each
  `HitNote` under its open button.
- `Actions`: «Сохранить себе», then `SelMode` while `!finding && entries.length && !app.selecting`.
- `ListFind` replaces `.lfind`: `query`, `rows={facRows}`, `picked={inForce}`, `shown={entries.length}`, `open={filterOpen}`,
  `oncopylink`, `selectable={!app.selecting && entries.length > 0}`, `bind:toggle={filterToggle}`. `pickFacet` calls
  `toggledFilter`. `onclear(group)` is `applyFilter({ ...inForce, [group]: [] })`. The `seenSeg` logic stays (G11).
- `sub` reads `shownOf` with `entries.length` and `items.length` while a query or a value narrows. The sentence "The sub
  keeps the whole count" changes (S12).
- The selection mode copies `TablesPage`'s three pieces: the effect that opens the mode while `app.sel.size > 0`,
  `startSelecting()`, `ticks={app.selecting}`. `ontoggleall` goes. A hidden tick stays ticked, as the spec says.
- `TableRows` takes `row={narrow ? compactRow : undefined}`. Snippet `compactRow(entry)`: `CompactRow` with `no={posOf.get(id)}`,
  `price`, `note={!!(m.note || m.hnote)}`, `gmOnly={entry.gmOnly === true}`, `qtyText={(m.qty ?? 0) > 1 ? '×' + m.qty : undefined}`,
  `open`, and the unfolded part: `RowMain full`, the two `HitNote`s, `Button size="sm"` «Открыть карточку» (`openRecord(it)`).
- `inside` draws `.rnotes` only from 761 px, and `.pickrow` at every width. Local `openRows` as on `ListPage`, reset with
  the token, pruned to `shared.ids`. `tail` stays for the full row.
- No match: G20; the reset also clears `q`.

### S9. `FilterBar` goes

Delete `FilterBar.svelte`, `filterBar.test.ts`, the row in `a11y.test.ts`, the import and two cases of `tables.test.ts`
(lines 13, 810-816 on `91bdcc55`). `git grep -n -E "FilterBar|fpill|fbar|fcount|anyValue"` must return only history. Fix the
comments in `AddToList`, `Button`, `Panel`, `SearchPage`, and the example in `COVERAGE.md`. A `lib/` export that loses its
last reader goes too.

### S10. Unit tests and the `COVERED` list

`a11y.test.ts` `COVERED` gains `CompactRow.svelte`, `ListFind.svelte`, `SelMode.svelte`. Each new or changed test file ends in
`expectNoA11yViolations`, with the open, ticked and sheet states. See "Tests".

### S11. Suites and states

`tests/app/states.js`:

- Case 83: `const asserted = row.shipped === true || row.shipped === width`, read by the `ok` and the `(logged)` text. Rows:
  see "First-screen rows".
- Case 95 (new; the next free number, check the list), "the compact row holds from 320 to 760 px", as `gm4` on `~ many`, RU and EN:
  1. At 360x640 and 320x568 a one-line row with its line is at most 80 px tall, nothing sideways, the field's box is 42x44, and
     `elementFromPoint` at the field's center hits the field.
  2. The tab order from the first body button: button, field, next button. After a press: button, field, position, price,
     «Заметка», «Ещё», next button. `aria-expanded` follows, and the focus stays.
  3. Ten ArrowUp presses on the field: `d.fake('writeCount')` rises by 1 after `d.writesSettled()`, and the fake holds the value.
     A focus alone writes nothing.
  4. With the network off, a typed quantity keeps the number and the meta line reads «Не сохранено»; online, «Повторить» stores it.
  5. A touch-emulated viewport: no grip; a position typed in the open row moves the row, and the live region says it.
  6. At 761x768 the full row draws and no `.crow` is left; the typed quantity is the same.
- Case 96 (new), "search and filter on the owner's page": at 360x640 and 1180x720: the row at 8 entries and not at 7; the
  sheet at both widths, with no filter link; a pick lights «Фильтры · 1», the meta line reads «Показано N из M · ...», the
  numbers stay true, the grip goes, the position field moves a row; a ticked row that a filter hides leaves the bar's count;
  «Все» ticks the drawn rows only; «Удалить (N)» leaves hidden rows alone; a create clears the filter; a reload clears it.
- Case 97 (new), "the list head and bars": at 360x640 «Ещё» opens inside the window and holds the items of G17 in order; «Бросить
  по списку», «Поделиться» and «Заметки» open their panels; the bar on both pages is at most 45% of the height at 640x360 and
  stays one bar; with 100 ticked the price sheet's foot is in view at 360x480; «Снять выделение» returns the focus to «Выбрать»;
  a `/s/` row unfolds and «Открыть карточку» opens the card; no `.selall` strip and no `.fpill` exists.
- Adapted cases: `git grep -n -E "lrow|batch-|Выбрать все|Свой предмет|\.selbox|lrow-acts|\.fbar|\.fcount" -- tests/app tests/e2e/flows.mjs`.
  Expect 3, 11, 26, 49, 58-64, 69, 77, 85 and F-flows that tick a row: a tick needs «Выбрать» first, and `.batch-summ` reads
  `.selsumm`. Case 69's 360 px part moves to the open compact row. Add `d.selecting()` to `driver.js` if four or more callers need it.
- `tests/app/contracts.js`: drop the `.fpill` form and its comment. `sweep.js`: drop `.fpill` from the selector and add `~ many`.
  `hues.js`: on the list pages a ticked row is not gold.
- `inventory.js`: see "Goldens and new states".

### S12. Prose, in the same commit

- `FEATURES.md`: "Lists" (the compact row, its meta line and text line, `openRows`, the quantity, the unfolded row, the true
  numbers; the selection mode and the one bar on the owner's page, the price sheet, «Все» keeps its label, "A ticked row takes the
  gold selected style" becomes the neutral selection; «Добавить свой предмет» replaces the rule 8 departure). "Account and browser
  lists" (the search block on both pages, the sheet in place of the strip and pills, the sub while narrowed, the lead line, `/s/`
  ticks only in the mode, the reset, "has no filter" goes; a hidden tick leaves on the owner's page and stays on `/s/`). "Chrome"
  (the head up to 760 px). Rule 1: the narrowed meta line. Rule 8: the departure.
- `STATE.md`, row Filters: the owner's list page query, picks, fold and whether the search row is drawn (page memory, no address).
  Row Lists: `openRows` on both pages, `pageBar` under Session or Lists. `lsel`, `picked` stay.
- `COVERAGE.md`: new tests, cases 95 to 97, the changed counts and the state count.
- `DESIGN.md`: see "DESIGN.md rules this batch writes".
- Decision file `docs/decisions/<date>-list-rows-fold-on-a-phone-and-the-list-filter-stays-in-memory.md` (template
  `.claude/templates/decision.template.md`): Task `57`; Decision: C1b, D1, D-head 1, G1, G12, G14; Rejected: C1 (no effect text), C2
  (4.3 rows), C3 (a `lists` column and a migration), D2 (a public contract for a private page), D-head 2 (a third exception),
  `SelectionBar` inside `main`, a `ListBulk` hook; Accepted trade-off: one more tap for share, print and roll on a phone, 95% of the texts
  cut until a press, a reload clears the filter. Then `node tools/decisions.js`.
- Budget: `tools/bundle-budget.mjs` and `.claude/README.md` by the standing rule (see "Verification" 6).

### S13. Impeccable

The orchestrator runs `polish` and `harden` on `ListPage`, `SharedListPage`, `CompactRow`, `ListFind` at 360 and 1180 px; `handoff.md`
gives the outcome. Fallback: `impeccable:impeccable-finish-reviewer`.

### S14. Evidence

`issues/57/mocks/9a/built/shoot.js`, from `mocks/7/built/shoot.js`: at 360x640 and 1180x720, RU and EN, plus 390x844 for the rows: `LIST_A`
(7 entries, `~ many`, a row open, a noted and GM-only row, the selection with a take line, «Ещё», the filter sheet, narrowed, no match, the
price sheet), `uuid(301)` as `gm3`, `/s/` (compact, a row open, the selection, the sheet, a long name), `/s/gm-token-1`, the gone token. The
set is evidence, not a gate.

## Acceptance criteria

Each line is observable in a suite, a unit case or the built app. Section 7's lines come first, in order.

- The compact row, C1b: on `/lists/<uuid>` and `/s/` while `app.band === 'narrow'`, a row about 77 px tall with the art 44 px, the position plate,
  the name on up to 2 lines, the meta line, one clamped 13 px line, one `<button aria-expanded>` with a 20 px chevron; a press unfolds the full
  row; from 761 px the full row stays (`compactRow.test.ts`, `listPage.test.ts`, `sharedListPage.test.ts`, case 95).
- The line (G5): an item's effect; a weapon's damage, range, burden and trait in that order; armor's thresholds and score (`label.test.ts`).
- An entry with no effect text draws no line and no empty box; a homebrew entry draws its source or price, its own picture, its stats or text with no
  markup; an 80-character source is cut, a price never is; a not-loaded row draws its key and «Предмет не загружен» (`compactRow.test.ts`, the `uuid(301)`
  golden).
- Keyboard order (G2): tick, body button, quantity field, unfolded controls; the press keeps the focus; a 24 px target at the least; `aria-controls` only
  while open (case 95, `compactRow.test.ts`).
- Open rows are page memory: `openRows` keyed by entry id, cleared when the list changes, pruned when an entry leaves. Nothing is stored (`listPage.test.ts`;
  `git diff` shows no change under `app/src/ports/storage.ts` or `lib/prefs`).
- Quantity on the owner's page: a separate 42x44 px live field, named «Кол-во: <name>» / "Qty: <name>", never inside the button, through the write buffer (one
  write for ten keys; a focus writes nothing; a failed write keeps the number), `touch-action: manipulation`, no stepper, one field per row (case 95, `listPage.test.ts`).
- On `/s/` the text «×2»; a quantity of 1 draws nothing (`sharedListPage.test.ts`).
- In the unfolded row: the price edit, the position field, the grip on hover devices only, the note, and «Скрыть от игроков», «Открыть карточку», «Убрать из
  списка» in the row's «Ещё». No remove control on the compact row. The drop mark draws on the compact row (`listPage.test.ts`, case 95).
- The note mark: the icon and its hidden name on the meta line while the entry has a note; the note itself only in the unfolded row, up to 760 px, on both pages;
  a players' link marks only a players' note (`compactRow.test.ts`, `sharedListPage.test.ts`).
- The `/s/` GM link: a GM-only entry is dashed with the mark on its meta line, both notes in the unfolded row, the toast of the filter link says the GM's text, the
  numbers count every entry (`sharedListPage.test.ts`, `#/s/gm-token-1 ~ compact`).
- The position numbers are the true list numbers (3, 7, 13), also while narrowed (case 96, `lists.test.ts`).
- In selection mode a tick column draws at the left and the quantity turns to the text «×2» (`listPage.test.ts`, `~ compact, selecting`).
- D1 at every width: `LIST_SEARCH_AT` = 8, latched per list; `SearchBox`, «Фильтры · N», «Выбрать» last in `ListFind`, shared by both pages; `listFacetRows` and `LIST_GROUPS`;
  `FilterPanel` as a sheet at every width; the filter in page memory, with no address; no filter link on the owner's page (`listFind.test.ts`, case 96).
- While narrowed, the meta line reads «Показано 3 из 14 · сохранено». No match draws «Ничего не найдено» and «Сбросить всё» (G20).
- While narrowed the grip goes and the position field stays live. A hidden tick leaves the selection, and «Все» ticks the drawn rows only. A create clears the query and the
  filter. Copy, print, download and roll keep the whole list. A not-loaded row has no facets: a picked value hides it and the meta line counts it (`lists.test.ts`, `listPage.test.ts`,
  case 96).
- D-head 1: up to 760 px «Поделиться», «Печать» and «Бросить по списку» sit in «··· Ещё» at every list size; the inline rename stays; from 761 px «Печать» stays on the action row (case 97).
- N9-2: at 360 «Цены» is in «Ещё» and «Заметки» sits on the meta line (G17, G18).
- A3 in part: «Удалить» is the list «Ещё» menu's danger item at every width.
- The selection bar of batch 3 on both pages; `BatchBar` leaves `ListPage`; ticks draw only in the mode; `.lrow.sel` is neutral; `FEATURES.md` says so (`hues.js`, `listPage.test.ts`).
- The price sheet (G14) keeps every batch price action; its foot stays in view at 360x480; focus returns to «Цены» (case 97).
- Round 3: `/s/` «Печать» closes by G10, named in `handoff.md`; a 120-character list name is one line at 360 on both pages (`~ long name`).
- A2 in part: a row action is at least 24 px tall from 761 px (case 69). A19: no bare count, no always-on tick on `/s/`. A20: the filter draws only from 8 entries. A21: `/s/` with an unknown
  token draws `ErrorPage` with its gutter. A41: «Добавить свой предмет» replaces the explainer. D2 needs no change.
- `TableRows`' `ontoggleall`, its strip and the `.selall` rules go; the `selectAll` key stays (`plan-7.md`'s placed line, corrected).
- `FilterBar.svelte`, `anyValue` and the `.fpill` reader in `tests/app/contracts.js` go (S9's `git grep` is empty).
- The list rows drop «Daggerheart»: `git grep Daggerheart -- app/src/components/ListPage.svelte app/src/components/SharedListPage.svelte app/src/components/CompactRow.svelte` is empty.
- `FIRST_SCREEN` at 360: see "First-screen rows"; case 83 asserts `shipped: 360` at 360 only.
- DESIGN.md lists the `/s/` exception of 286 px with the owner's date (2026-11-03).
- New states: each with its RU and EN golden and an axe case (see "Goldens and new states").
- Text in the same commit: S12; `ROUTES.md`, `CONTRACTS.md`, `routes.json`, `llms.txt` do not change.
- DESIGN.md: the neutral selection and the bottom sheet are checked.
- Fixed in the touched path: `onDrag` reads `rows`, so a drag above a not-loaded row moves the right entry (`listPage.test.ts`).
- From "Each of batches 2-9": the detector line, American spelling in new prose, `mocks/9a/built/`, the `polish` and `harden` outcome, no `verify` row open, the writer's local gates.
- Each new component has an axe case and is reached by a test. The bundle budget is raised by the standing rule. CI is green on the pushed tip.

## First-screen rows (plan section 14)

| Row | 360x640 (limit 256) | 1180x720 | Flag |
|---|---|---|---|
| `LIST_A as gm4` (7 entries) | the mock 200 | logged, 377 today | `shipped: 360` |
| `LIST_A ~ many as gm4` (14 entries, new) | the mock 252 | logged | `shipped: 360` |
| `LIST_A ~ long name as gm4` (new, section 14's longest name) | as above: the input is one line | logged | `shipped: 360` |
| `#/s/player-token-1` (10 entries) | the mock 286, `exception: 286` | logged, 481 today; the mock 258 | `shipped: 360, exception: 286` |
| `#/s/player-token-1 ~ long name` (new) | 286 | logged | `shipped: 360, exception: 286` |

The design target of 240 does not fit `~ many` (252): the limit is the rule's. With Source Sans 3 line boxes the built value can differ by a few px. If a built value passes its limit, log
it in `handoff.md` and the AFK decisions file, and the exception takes it (section 14, owner away); for `LIST_A` rows first remove `.page-sub`'s spare margin at 360. Do not move a limit without
the log. The rows with requests are 9b's. `[data-primary]` stays on the rows element of both pages.

## Goldens and new states

About 50 existing goldens move: every `_lists_*0101*`, `LIST_A*` and `_s_*` state (the head, «Выбрать», no tick column, the bar, «Добавить свой предмет», the lead line, the sheet), plus the `_search*`,
`_tables_*` and `_homebrew*` only if `SelMode` moved a byte, which is a defect to read. `~ a row ticked`, `~ picked`, `~ sold part`, `~ batch deleted`, `~ prices*`, `#/s/... ~ ticked`, `~ filtered`, `~ sent*`
press «Выбрать» first. `#/s/player-token-1 ~ filters open` keeps its id and now draws the sheet. `#/s/...f_kind-weapon.tier-1` draws the open sheet. Golden width is 1100, so a compact state needs `width: 360`, and a
menu state uses the `again` field. Seed with the four shards; never edit a golden by hand.

| State id | Width | Entry |
|---|---|---|
| `LIST_A ~ compact as gm4` | 360 | seven compact rows, «Выбрать» on the title row |
| `LIST_A ~ compact, row open as gm4` | 360 | one row open: text, position, price, «Заметка», «Ещё» |
| `LIST_A ~ compact, noted as gm4` | 360 | `NOTED_SPECS` with a GM-only entry: the note mark, the GM mark, the dashed row, an open note |
| `LIST_A ~ compact, selecting as gm4` | 360 | two ticks, the text «×2», the take line, the bar with «Цены» and «Ещё» |
| `LIST_A ~ row more as gm4` | 360 | the row's «Ещё» open |
| `LIST_A ~ more as gm4` | 360 | the list «Ещё» open, nine items |
| `LIST_A ~ more wide as gm4` | default | the list «Ещё» open, three items |
| `LIST_A ~ many as gm4` | default | 14 entries, the search row, «Выбрать» last |
| `LIST_A ~ filter sheet as gm4` | 360 | the sheet, no link |
| `LIST_A ~ narrowed as gm4` | default | one value picked: «Показано 3 из 14», no grip, true numbers |
| `LIST_A ~ no match as gm4` | default | «Ничего не найдено», «Сбросить всё» |
| `LIST_A ~ selecting as gm4` | default | the mode with no tick: the actions off |
| `LIST_A ~ price sheet as gm4` | default | «Цены выбранных» open |
| `LIST_A ~ long name as gm4` | 360 | a 120-character name |
| `#/lists/<uuid(301)> ~ compact as gm3` | 360 | homebrew rows, a long source cut, a row with no text if the seed holds one |
| `#/s/player-token-1 ~ compact` | 360 | «×2», no quantity at 1, the lead line |
| `#/s/player-token-1 ~ compact, row open` | 360 | the note, «Открыть карточку» |
| `#/s/player-token-1 ~ selecting` | default | the mode, the bar |
| `#/s/player-token-1 ~ long name` | 360 | one line, an ellipsis |
| `#/s/gm-token-1 ~ compact` | 360 | a GM-only row, both note buttons |

The filter sheet of `/s/` at 360 reuses `~ filters open` run with `width: 360`, only if one entry cannot hold both widths; else add `~ filter sheet`.

## DESIGN.md rules this batch writes

- "Layout", The Two Breakpoints Rule: list rows fold up to 760 px; from 761 px the full row. The First-Screen Rule: the `/s/` exception of 286 px at 360, owner, 2026-11-03.
- "Components": a new "Compact row" (the anatomy, 77 px, one press target, the field apart, flat rows with one divider, no remove control, the true number on a plate).
- "Filter chips and the count line": the "Pills" paragraph goes; list pages draw the sheet at every width and the count on the page's meta line.
- "Selection bar": the owner's list page joins; the rare actions fold into «Ещё» up to 760 px; a panel that a bar action opens is a `Sheet`, because the bar is sticky.
- "Bottom sheet": the list filter and the price sheet join its callers (checked).
- "The Seal Rule": the neutral selection on list rows (checked).

## Tests

| File | Cases |
|---|---|
| `compactRow.test.ts` | the anatomy; price or source; a cut source; a line, no line; note and GM marks with their hidden text; `aria-expanded`, `aria-controls` only while open; a not-loaded row; the field beside, not inside, the button; `qtyText`; axe open and closed |
| `listFind.test.ts` | the row with and without facet rows; the lit button; `selectable`; the sheet at `wide`; no link without `oncopylink`; focus back to «Фильтры»; axe |
| `listPage.test.ts` | the band switch; `openRows` memory, reset, prune; the field calls the store once per input and writes nothing on focus; one `[data-qty]` per row; the text in selection mode; the head and the two «Ещё»; each menu item's effect; narrowed count, true numbers, grip, hidden tick, «Все», no match and its focus; the mode, `pageBar`, the bar's actions at both bands, zero ticks; the price sheet and its focus; a create clears the filter; `onDrag` above a not-loaded row; axe. Render `SelBar` beside the page in the helper |
| `lists.test.ts` | the moved selectors |
| `sharedListPage.test.ts` | `ErrorPage` for gone and failed; the lead line and the note buttons on both audiences; a list under 8 entries (no search row, «Выбрать» on the action row); compact rows; position while filtered; the mode; a hidden tick stays; the sheet; the filter link opens it; the reset clears the query; axe |
| `tables.test.ts`, `searchPage.test.ts`, `homebrewPage.test.ts` | `row` snippet; no strip; `SelMode` unchanged |
| `lib/label.test.ts`, `lib/filters.test.ts`, `lib/lists.test.ts`, `lib/i18n.test.ts`, `state/app.test.ts` | S2; parity; `pageBar`; `toggleAllIn` removed |
| `a11y.test.ts` | the three new rows, `FilterBar` out |
| `tests/app/states.js` | cases 83, 95, 96, 97, the adapted cases |

## Verification

In this order, after S12. One command per call. A browser suite does not run locally (section 7, the writer's local gates).

1. While editing: `npx vitest run` with `app/src/components/compactRow.test.ts`, `listFind.test.ts`, `listPage.test.ts`, `lists.test.ts`, `sharedListPage.test.ts`, `tables.test.ts`, `searchPage.test.ts`,
   `homebrewPage.test.ts`, `shell.test.ts`, `a11y.test.ts`, `app/src/lib/label.test.ts`, `filters.test.ts`, `lists.test.ts`, `i18n.test.ts`, `app/src/state/app.test.ts`, then `npm run lint:untyped` and
   `npm run lint:typed`. `git ls-files -- "app/src/**/*.test.ts"` gives a right name.
2. `node --test tools/artwork/lib.test.mjs`.
3. `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to 4, one at a time. Then `git diff --stat tests/app/snapshots`: only the list and `/s/` families and the new files.
4. `node tools/decisions.js`.
5. `npm run check:built` (the unconfigured budget).
6. The configured budget: `npm run build` with placeholder `VITE_SUPABASE_*` values, then `node tools/bundle-budget.mjs`. Raise both limits by the standing rule, never past 270 and 350, in the same commit as the
   reason. Expected against 260-264 unconfigured and 317-321 configured before this batch:

   | Part | kB gzip |
   |---|---|
   | `CompactRow` with its CSS | +0.9 |
   | `ListPage`: filter, mode, head, menus, sheet, net of `BatchBar`'s call | +0.8 |
   | `ListFind`, `SelMode`, net of three `.selmode` copies | +0.3 |
   | `SharedListPage`: lead line, mode, row snippet, net of the old block | +0.2 |
   | `rowLine`, `eqRowParts`, `narrowEntries`, `pageBar` | +0.2 |
   | 11 new keys in two languages | +0.3 |
   | Growth | about +2.7 |
   | `FilterBar.svelte` with its CSS | -1.3 |
   | the `TableRows` strip and `.selall`, `toggleAllIn` | -0.2 |
   | `anyValue`, `quickRowHint`, `sharedList`, FilterBar-only keys | -0.1 |
   | `.addhint`, `.guess` border, `UpdatedLine` call | -0.1 |
   | Removals | about -1.7 |

   Net about +0.7 to +1.5 kB, so expect 261-266 unconfigured and 318-323 configured. **Past 266 unconfigured, stop and name it in `handoff.md`:** wave 3 needs about 4 kB under the 270 ceiling. The first cut is the
   `.cfields` CSS shared with the full row. This batch does not raise a ceiling.
7. `impeccable detect --json --no-inline-ignores app/src`, and the spelling grep of batch 2's word list over the touched files and the new prose.
8. `rtk npm run check:fast` (Bash timeout 600000), last.
9. Commit, push, the CI credit. CI's `app/states` (cases 83, 95 to 97 and the adapted ones), `app/contracts`, `app/hues`, `app/typo`, `sweep.js` at 360, 390, 768 and 1180 and the `e2e` flows are the browser proof. A failing
   case there is a case to read against this brief. The batch review follows (trigger: new or changed UI; `tests/app/` changed). Wave 2's squash waits for it.

## Risks and do-nots

- WARNING: one `[data-qty]` per row. A second field in the unfolded row would write the same key from two inputs and break `.lrow input[data-qty]` readers.
- Do not debounce the field in the component: the store owns the buffer, and a component timer loses the last key on a navigation.
- Do not put the field, a link or a menu inside `.cbody`. Do not put a `tabindex` on the field to change its order.
- `.cfull` and the flat row must have no fill over the inset drop mark (the `.lrow.drop-after .rnote` redraw stays).
- `shownRows` holds `at`: every place that read `i` reads `row.at`. A `rows.length` for the roll, the copy, the print and the position `max` stays the whole list.
- `lsel` is pruned by what is drawn; `app.sel` on `/s/` is not (a buyer picks across filters). Do not share the prune.
- Keep the `pageBar` snippet at the top level of `ListPage`: a snippet inside `{#snippet children}` cannot reach the script. `index` is nullable there; guard it.
- `FilterPanel` never mounts with `band="wide"` here. `ROUTES.md` does not change.
- Keep `tail` for the full row of `/s/`: only the compact branch leaves it, or the price draws twice.
- `band` moves at 761 px on a rotation. A focused field unmounts; the store and the buffer hold the value, so nothing is lost, and the focus falls to `#main`. Accepted.
- American spelling in new prose and test titles. A title names the behavior, never a batch or a finding id.
- Review order: `CompactRow.svelte`, `ListPage.svelte`, `SharedListPage.svelte`, `ListFind.svelte`, `SelBar.svelte` with `pageBar`, `TableRows.svelte`, `RowMain.svelte`, `lib/`, the suites, the prose.

## Standing checks for batch 9a

1. Scale. Limits: entries 100 by default (3x 300), `NAME_MAX` 120, `BOOK_NAME_MAX` 80, `QTY_MAX`, a price of 99999, `NOTE_MAX`; validator constants have no 3x row.

   | State | Shows | Proof |
   |---|---|---|
   | Empty | the empty state and «Добавить свой предмет»; no search row, no «Выбрать», no bar | `~ empty` states |
   | One | one compact row, «Выбрать» on the title row | `compactRow.test.ts` |
   | 7, many under 8 | no search row | `LIST_A` compact, `FIRST_SCREEN` |
   | 8, many | the search row, «Выбрать» last | `~ many` |
   | 100, the limit | about 7700 px of rows; the add row last, as today at the limit | `listPage.test.ts`, the 100-row fixture |
   | 101, the refusal | the toast, unchanged | unchanged |
   | 300, 3x | about 23100 px, not 84000; no virtualizing; `narrowEntries` once per keystroke | `lists.test.ts` |
   | Longest name | two lines and an ellipsis; the whole name while open | `compactRow.test.ts` |
   | Longest list name | one line at 360, three from 761 on `/s/` | `~ long name` |
   | Longest price | wraps to a second meta line; never cut | `uuid(101)`'s 99999, `~ compact` |
   | Longest source | one line with an ellipsis | `#/lists/<uuid(301)> ~ compact` |
   | 360 and 1180 | each row above at both widths; 320 for the row | cases 95, 96, `sweep.js` |

   At many and at the limit: rows keep list order; the primary action (the add row) stays last. The filter sheet is at most `min(85dvh, 640px)` with a body that scrolls, and it holds no text field, so no keyboard opens over it.
   The price sheet holds a number field: at 360x480 with the keyboard open its foot stays in view (case 97). The list «Ещё» is nine items of 44 px, 396 px at most, scrolled into view. The search field sits in the page, and the header
   holds while it has the focus (about 380 px left, less 111). Sticky regions: the header (111 px, or none) and the bar (129 px; 213 px RU on `/s/`), neither past the window; 640x360 stays at 45% or less (case 85).
2. Error scenarios.

   | Scenario | The screen shows | Stored data |
   |---|---|---|
   | Loading | «Загружаем...», unchanged | - |
   | A failed read | «Список не загрузился» as today on the owner's page; `/s/` draws `ErrorPage` with «Повторить» | kept |
   | A failed write | the number stays; «Не сохранено» on the meta line, with the same buffer and retry | kept in the buffer. The retry sends the queued write of the last edit, which replaced any earlier one by its key |
   | Offline | the same; open rows, the filter and the ticks stay | as today |
   | A conflict | a re-read waits for the empty buffer, then redraws; last write wins; open rows survive by entry id; a focused note holds its draft | as today |
   | A named record deleted | the row draws its key and «Предмет не загружен»; a value or a query hides it; the meta line counts it | kept |
   | An entry removed elsewhere | the row leaves; its open mark, tick and taken count go | as today |
   | A stale tab | the old bundle draws the old page; nothing new is stored | - |
   | A revert | the previous frontend draws full rows; no stored shape changed | no change |

   A fold while a note box has the focus loses nothing: `noteInput` writes on `input`, and the box's height stays in `handHeight`. «Удалить (N)» acts on drawn ticks only, and its undo is today's. No path can lose stored data.
3. Consistency. Rules of `FEATURES.md`, "Consistency rules", followed: 1 (one counter; the narrowed meta line is a named departure), 4, 5 (the quantity is silent), 6, 7, 8 («Добавить свой предмет» replaces the departure), 11, 12 (folds), 15, 16 (long names), 17 (no link on the owner's page), 20 (focus). Against the siblings: the catalog, `/search`, `/homebrew` and both list pages share `SearchBox`, «Фильтры · N», `FilterPanel`, «Выбрать», the one bar and the plate. Differences, each with its reason:

   | Axis | Difference | Reason |
   |---|---|---|
   | Row press | unfolds; a catalog row opens the card | the list row holds notes and fields |
   | Filter place | memory on the owner's page; the address on `/s/` and the catalog | the owner's page cannot be shared |
   | Hidden tick | leaves on the owner's page; stays on `/s/` | the bar here deletes; a buyer picks across filters |
   | Filter panel | a sheet at every width; a column on the catalog | the side column is 9b's |
   | Count while narrowed | on the page's meta line; a count line on the catalog; values not named | no extra line (252 px) |
   | Link arrival | the sheet opens on `/s/`; none on the catalog | `ROUTES.md` (G11, Q9a-1) |
   | Row «Ещё» | up to 760 px only until 9b | interim, accepted |

   Button verbs: «Сбросить всё», «Убрать из списка», «Удалить список», «Открыть карточку». The place of the primary: the add row last; «Сохранить себе» on `/s/`. Toasts, confirms and undo do not change.
4. RU/EN parity: the keys of S1 and S7 have both languages with the same facts, ASCII punctuation, «ёлочки» in RU only, no new plural form; the changed and deleted keys leave both; `rowLine` reads the record's own language with the existing fallback; cases 95 to 97 and the goldens hold both.

## Gate cost

Per section 8: one code batch is 45-60 minutes with its `check:fast`, one CI run and one review fix cycle. Extra local gates:

| Gate | Minutes |
|---|---|
| the affected vitest files (about 15, `listPage.test.ts` is long) | 8-10 |
| artwork test, both lints, decisions, the detector | 4-5 |
| `build:test` and the four golden shards (about 50 moved, 20 new) | 12-15 |
| `check:built` and the configured build with `bundle-budget.mjs` | 3-4 |
| the orchestrator's `polish` and `harden` | 5-10 |
| the screenshot set | about 3 |

Total: 35-47 minutes of extra gates (section 8 says 16-26). The plan total rises by 19-21. Browser suites, sweeps and `e2e` run on CI (owner, "Local gates").

## Writer tests

Facts for the orchestrator's dispatch, not a model choice.

| Test | Answer |
|---|---|
| 1 (a step asks for a choice, or an `Open design question:`) | no: every choice is decided above; Q9a-1 and Q9a-2 have defaults and block nothing |
| 2 (public contract, route, stored state, product law, migration, hook, configuration) | no; `tools/bundle-budget.mjs` rises under its standing rule |
| 3 (visual judgment: print fitting, a golden re-seed, parity with a design node) | yes: about 50 goldens re-seeded and new row, head, sheet and bar layouts that rest on visual judgment; no design node |

## Split criterion

The owner's split ("Batch 9 split") made this batch. Inside it the row, the search row and the bar share `ListPage`, `SharedListPage`, one seed, one filter set and one re-seed, so no further split has a criterion (`CLAUDE.md`, "Task and session protocol"). One split was weighed and rejected: the `/s/` page from the owner's page. It would save a review pass of about 15 minutes and cost a second re-seed of the list goldens and a second CI run (about 25 minutes), and it would leave `FilterBar` for a later batch. If the review cannot be held in one pass, it splits by the "Review order" list, not the batch.

## Plan review

Not required (no trigger fired): no migration or SECURITY DEFINER function; no public contract (`routes.json`, `ROUTES.md`, `CONTRACTS.md`, `llms.txt`, `tests/contracts.js` and `docs/fixtures/` do not change; `tests/app/contracts.js` only drops a reader of pills that no page draws); no stored data or `localStorage` key (`openRows`, the query, the picks, the mode and `pageBar` are memory); no new write or sync protocol (the field calls the existing `setMeta`). A batch review is required after the implementer (trigger: new or changed UI; `tests/app/` changed).
