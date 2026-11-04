# Batch 4 - Record card, actions, item page, dialog and `/h/` (implement-ready)

This brief is the implementer's whole input for batch 4, with the mock `mocks/4/`
(`index.html`, the PNGs, `b4.js`). It has the shape of `plan-3b.md` and `plan.md`
section 10. The owner is AFK (`context.md`, "Owner AFK from 2026-11-03"), so every
choice below is the recommended option; the orchestrator logs each one in the
owner-AFK decisions file. A mock is direction, not the source of truth (owner,
2026-11-03): the departures are named in "Decisions", and none of them reopens a
decision of the owner.

Batch 4 runs after batch 3b's `polish`, `harden`, review and CI, in wave 2. Section
numbers ("section 7") are those of `plan.md`.

## Objective

One record, one design, on three surfaces: the item page `/i/<id>` and `/h/<uuid>`
(a dossier: the picture and the text side by side from 761 px, stacked below), the
record dialog (a centered dossier from 761 px, a bottom sheet with a fixed action
dock up to 760 px), and one action vocabulary at every width: «В список» (the one
gold primary), «Поделиться», «Печать», «Изменить» (the author only) and «Ещё», which
holds the copies and «Сохранить себе». The error pages of the two item routes take
the new error-page pattern. The selection bar's add control takes the same label.

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge,
  never a rebase).
- Read `git diff 38767ca4 HEAD -- app/src/components/RecordCard.svelte
  app/src/components/PickRow.svelte app/src/components/RecordModal.svelte
  app/src/components/RecordActions.svelte app/src/components/Menu.svelte
  app/src/components/Sheet.svelte app/src/styles/tokens.css`. A line of this brief that
  no longer matches is the implementer's to adapt, and `handoff.md` names the change.
- The mock is `mocks/4/`. It was re-checked against batch 3's shipped patterns
  (`Sheet`, `Menu`, `SelectionBar`, the `viewport` band): five departures follow (K1,
  K2, K7, K9, K10). The mock is not redrawn and not shown to the owner again.
- Impeccable cannot run from a subagent. The orchestrator runs `polish` and `harden`
  after S11 on `RecordCard`, `PickRow` and `RecordModal`, from the built app at 360
  and 1180 px; fallback `impeccable:impeccable-finish-reviewer`.
- Steps are S1 to S15. The line "Session end partial progress" in `handoff.md` names
  the last finished step.

## Decisions of this refresh (planner defaults; the owner is away)

| # | Decision | Reason and trade-off |
|---|---|---|
| K1 | «Ещё» is the shipped `Menu` popover at every width. No bottom sheet at 360. It opens down on a page and up in the dialog (`Menu` gets an `up` prop). Departure from mock 4 and from `reviews/mocks-1.md` M4-1. | Batch 3 shipped «Ещё» as `Menu` at 360 (decision D8). A `Sheet` nested in the record `<dialog>` has two traps: `Sheet` sets `app.dialogOpen = false` when it closes while the outer dialog is still open, and two `Toast inDialog` copies would draw. M4-1's real defect (the menu leaving the screen) is fixed by the right-aligned `Menu`, which is `min(320px, 90vw)` wide. Trade-off: no thumb-height sheet; rows are 44 px at 600 px and below. Batch 8 turns this and the add-to-list menu into sheets together, if the owner wants them. |
| K2 | The dialog stays `RecordModal`'s own `<dialog>`, restyled. Up to 760 px it looks like a bottom sheet (full width, top corners, sticky head, sticky dock). It does not use `Sheet`. | One element across the band: no remount when the window crosses 760 px, `.modal-card` and the first-`button` focus hook of `Toast.svelte` stay, `Sheet` keeps its two callers. |
| K3 | One labeled close, icon and «Закрыть», in the dialog at every width. `DialogClose.svelte` is extracted: `Sheet` and `RecordModal` are its two callers, and both inline copies go. The class is `dlg-x`. | Extract on the second real use (`CLAUDE.md`). Rule 11 of `FEATURES.md` ("a read-only dialog says «Закрыть»") now holds by text, not by an icon. |
| K4 | New key `toList`: «В список» / "Add to list". `AddToList` draws it. `addToList` («Добавить в список») stays: `QuickItem`'s submit reads it (rule 8 of `FEATURES.md`). | One value cannot serve both: «В список» as a submit label says nothing. This is the bar's label (batch 3 deviation 2). EN does not change. |
| K5 | The share button reads `t.share` («Поделиться»). `sendAll` («Отправить») stays on the compact roll cards and the list-page roll card. | The compact cards move in batch 5 (and 9a for the list roll card). Interim mix, accepted by the standing rule. |
| K6 | New: `ErrorPage.svelte`, `DialogClose.svelte`. Changed: `PickRow.svelte` becomes the action row (it keeps its name and its test file), `RecordActions.svelte` gains `row="share"` and `row="menu"`. No `RecordBar`. | `PickRow` already owns the add, print, edit and save logic; the clipboard handlers stay in `RecordActions`. A new module would copy one or the other. |
| K7 | `RecordCard` gets a `dossier` prop (boolean, not a variant), a `heading` prop (`h1` or `h2`, default `h2`) and a `sub` snippet. The head keeps its DOM order: badge row, name, stat chips, description. The mock draws the name above the badge row; that is not built. | The artwork review page pins the head markup (`tools/artwork/lib.test.mjs`, `CARD_HEAD_SHA256`) and the compact roll cards share the order. Changing the order would split one head into two. Trade-off: the page `h1` sits one badge row lower than in the mock. |
| K8 | The picture is cropped to 4:3 up to 760 px and square from 761 px. `max-height: 420px` goes on the dossier. | M4-4 (crop on screen). The art file is not touched (owner, 2026-10-23). DESIGN.md "Shapes" is rewritten. |
| K9 | Error pages: `ErrorPage` has no circled icon (`reviews/mocks-2.md` N0-2). New keys `noItem`, `noItemSub`, `findItem`, `openTables`, `hbLoadFailedTitle`. `notFound` and `notFoundSub` stay: `App.svelte`, `HomebrewEditor`, `PrintPage`, `ListPage`, `tools/share-card.mjs` and the preview worker read them. The `/h/` loading line keeps `LoadState`; the mock's skeleton is not built. The `/i/<key>` failed read keeps `LoadState` and gains `page`. | `notFound` is a public word (`og:title` of the preview worker, `i18n.test.ts` `WORDS`). The skeleton is a new state with its own motion rule; `LoadState` carries the focus return of rule 20. |
| K10 | The path line stays under the name as the spec writes it (`FEATURES.md`, "Records": the complete table path, then the roll number or the tier). The mock's short «Core · № 1» is not built. The record dialog draws no path line and no «показать в таблице» (the mock draws both). | The spec rule wins over the mock (owner, 2026-10-28). From a table row or a list, the path adds nothing. |
| K11 | P5 (`rollNo`: «номер» in RU, "roll" in EN) is not changed here. It goes to batch 10 (see "Placed items"). | `tools/share-card.mjs` copies `rollNo`, and every generated share stub `i/*.html` (about 1000 committed files) carries the line. A change rewrites them and needs a plan review. |
| K12 | A24: on the card, each homebrew record in the «Получается из», «Улучшается до» and set lines draws its name and a badge `Хоумбрю` / "Homebrew" (the existing `srcHomebrew`), not the suffix «(HB)». The suffix stays in a rung's title, the copied text, the print card, the rows and the lists. | The confirmed mock draws the badge; the text outside the card is shared with print and the clipboard (decision `2026-09-30-hb-marks-homebrew-a-relation-shows-only-to-its-author.md`). A pointer line goes to that decision. |
| K13 | C22 and C46 (the rule-card box looks like a button, its role is not named): the `summary` gets a trailing chevron that turns when the box is open, and loses nothing else. No caption is added. | A chevron states a fold; a caption would be help text (Clarity Rule). |
| K14 | Copy-image keeps its label «Скопировать изображение» / "Copy image". The mock reads «Скопировать картинку». | The key `copyImg` and its toast words exist; the change moves nothing for the reader. |
| K15 | The dock order is the DOM order: «В список», «Поделиться», «Печать», [«Изменить»], «Ещё». The mock puts «Ещё» second. An odd count makes the last cell span both columns. | Tab order equals visual order. |
| K16 | The dock is `position: sticky` inside the dialog's scrolling card. From a window shorter than 481 px it is not sticky. The add-to-list `.dropmenu` inside the dock spans the dock's width. | A 3-row dock is 150 px; at 640x360 it would take 42% of the height. |
| K17 | The signed-out press of «Сохранить себе» keeps the boxed sign-in prompt under the action row (its lead `signInToSaveItem` and «Войти»). The menu item's second line says «Сначала вход в аккаунт» / "Signs you in first". The always-visible box under a button is gone (N11 of `reviews/plan-1-2.md`). | The prompt appears only after the press. The mock's old text «Войти и сохранить копию...» is superseded by its round 5 label rule (M4-2). |
| K18 | `/h/` keeps its two lines: the path line with «Предмет другого игрока», then «Обновлено N назад» (`UpdatedLine`). The mock merges them into one. | Two facts, two lines; `UpdatedLine` has its own tests. |
| K19 | `Button` gets a `haspopup` prop (`aria-haspopup="menu"`) for «Ещё». No neutral pressed variant: nothing needs it (plan review R4). «Ещё» is not drawn pressed; `aria-expanded` carries the state. | Gold marks a choice (Seal Rule), and an open menu is not one. |
| K20 | Browser cases that press a moved control call a new driver helper `d.more(name)`: it presses «Ещё» (inside `dialog[open]` when one is open, else the first on the page), then presses `name` inside `[role="menu"]`. | About 20 call sites change by one line. |

## Placed items (the orchestrator folds these into `plan.md`; this brief cannot edit it)

- P5 (`rollNo`) goes into batch 10's acceptance as its own line: "P5: the record page's
  roll number reads one term in both languages («№» and "No."); `app/src/lib/dict.ts` and
  `tools/share-card.mjs` change together, `node tools/build.js` regenerates the share
  stubs, `app/contracts` (stub subtitle equals the heading line) passes; a plan review
  is required before it; or the owner keeps it as a `DEBT.md` entry."
- Section 8, row 4: replace "1" with 30-35 minutes of extra gates (see "Gate cost").
- Section 14: the `/h/` row joins `FIRST_SCREEN` as `shipped: true` in this batch.
- Plan review: not required for batch 4 (`plan.md` Status line, see the end of this file).

## In scope

- The outline of section 7, "Batch 4", every line, with the superseding noted in
  "Acceptance criteria".
- `RecordCard` (full card and its relation lines), `PickRow`, `RecordActions`,
  `RecordModal`, `RecordPage`, `ItemPage`, `Menu` (`up`), `Button` (`haspopup`), `Sheet`
  (the shared close), `AddToList` (the label), `SelBar` (a comment), `ErrorPage`.
- The RU label «В список» on the add control everywhere it draws (page, dialog, bar,
  the editor's preview).
- The specs, DESIGN.md rules and the decision file of S12.

## Out of scope

- The roll cards, the list-page roll card and the editor's preview card: they keep
  `variant="compact"` or the plain `full` card, `nameActions`, `.card-acts` and
  `sendAll` (batches 5, 9a, 6).
- `SharedListPage`'s «Сохранить себе» button (batch 9a) and the `/s/` copy flow.
- `rollNo` (K11), the `/h/` skeleton, a bottom-sheet «Ещё», the add-to-list sheet
  (batch 8).
- The header, the catalog, the selection bar's shape.
- Any change to `notFound`, `notFoundSub`, the preview worker and the share stubs.

## Facts read from the code (38767ca4, 2026-11-04)

1. `RecordCard.svelte` draws one head for both variants: `.card-meta` (badges), `h2.card-name`
   with the `nameActions` snippet, `.eqstats`, `.card-desc`, then the ladder, `.craft`
   lines, `.refs`, `Actions` (the `actions` snippet) and `.cardpick` (the `pick` snippet).
   Callers of the full card with `nameActions`, `actions` and `pick`: `RecordPage`,
   `ItemPage`, `RecordModal`. The editor's preview passes `pick` only.
2. `ItemPage` and `RecordPage` draw a `PageTitle` (the name as `h1`, the path line) and then the
   card, which repeats the name as `h2` (audit C20, P4). `ItemPage` adds `UpdatedLine`
   and a `StatusRegion`.
3. `PickRow` draws `AddToList`, «Печать», «Изменить», and the «Сохранить себе» group with a
   note, plus two boxed `SignInPrompt`s. `RecordActions` row `card` draws «Отправить»,
   «Скопировать изображение», «Скопировать текст»; row `name` draws two icon buttons.
4. `Menu.svelte` is `role="menu"`, right-aligned, opens down, focuses the first item, closes on
   Escape and on a click outside. `TablesPage`'s «Ещё» is its pattern: a `Menu` plus a
   `closeMore()` that returns focus to the button (rule 20).
5. `AddToList` draws `t.addToList` and opens a `.dropmenu` (`bottom: calc(100% + 8px)`,
   `left: 0; right: 0` up to 600 px) that measures room against `.card` and `.modal-card`.
6. `RecordModal` is a native `<dialog>`, `.modal-card` 440 px wide and `overflow: auto`, a
   round `.modal-x`. `Toast inDialog` returns focus to the dialog's first `button`; the close
   button must stay that first button.
7. `notFound` is read by `App.svelte`, `HomebrewEditor`, `ItemPage`, `RecordPage`, `tools/share-card.mjs`
   and the preview worker; old list links draw it (`tests/app/contracts.js`).
8. About 90 goldens hold the RU «Добавить в список» (`git grep -l -E "Добавить в список|Add
   to list" -- tests/app/snapshots`): every `/i/`, `/h/`, modal, bar and add-menu state,
   and the editor's preview states.
9. `tests/app/states.js` reads `.modal-card` (cases 3, 23, 42), `.cardpick` (22), `.card.full
   .card-media` (31), `.savegroup` (78) and presses «Скопировать текст», «Скопировать
   изображение», «Скопировать ссылку» and «Сохранить себе» on `/i/` and `/h/` (cases 9, 10,
   11, 78, 81); `tests/app/print.js` reads `.card.full .cardpick` (1631-1635); `tests/e2e/flows.mjs`
   presses «Сохранить себе» (F8, F18, F20).
10. The screen card has no «Daggerheart» line (`git grep Daggerheart -- app/src/components/RecordCard.svelte`
    finds nothing): the owner's bottom-line rule holds for the screen already.

## Files expected

| Step | Files |
|---|---|
| S1 | `app/src/lib/dict.ts`, `app/src/lib/help.ts`, `app/src/lib/i18n.test.ts` (parity) |
| S2 | `Button.svelte`, `Menu.svelte`, `button.test.ts`, one case in a test that mounts `Menu` |
| S3 | new `DialogClose.svelte`; `Sheet.svelte`, `FilterPanel.svelte` (the `.sheet-x` query), `sheet.test.ts`, `filterPanel.test.ts` |
| S4 | new `ErrorPage.svelte`; `a11y.test.ts` (`COVERED`) |
| S5 | `RecordActions.svelte`, `record.test.ts` |
| S6 | `PickRow.svelte`, `AddToList.svelte` (label), `pickRow.test.ts` |
| S7 | `RecordCard.svelte`; `tools/artwork/lib.test.mjs` (`CARD_HEAD_SHA256`), `tools/artwork/review/review.mjs` (check only) |
| S8 | `RecordPage.svelte`, `ItemPage.svelte`, `itemPage.test.ts`, `record.test.ts` |
| S9 | `RecordModal.svelte`, `recordHost.test.ts`, `record.test.ts` |
| S10 | the label sweep: `SelBar.svelte` (comment), the component tests, `tests/app/inventory.js`, `states.js`, `driver.js`, `tests/e2e/flows.mjs`, `README.ru.md` |
| S11 | `tests/app/states.js` (cases 78, 88, `FIRST_SCREEN`), `tests/app/inventory.js` (new states), `driver.js` (`d.more`), about 100 goldens |
| S12 | `docs/specs/FEATURES.md`, `CONTRACTS.md` (prose), `ROUTES.md` (prose), `COVERAGE.md`; `DESIGN.md`; new decision file; `docs/DECISIONS.md`; `tools/bundle-budget.mjs`; `.claude/README.md` |
| S13 | `handoff.md` (the Impeccable outcome) |
| S14 | none (gates) |
| S15 | `issues/57/mocks/4/built/`, `handoff.md` |

## Steps

### S1. Strings

In both languages of `dict.ts`, same keys, ASCII punctuation:

| Key | RU | EN |
|---|---|---|
| `toList` | В список | Add to list |
| `noItem` | Предмета по этому адресу нет | No item at this address |
| `noItemSub` | Адрес %s не ведёт ни к одному предмету. Ссылка могла устареть или быть набрана с ошибкой. | The address %s leads to no item. The link may be old or mistyped. |
| `findItem` | Найти предмет | Find the item |
| `openTables` | Открыть таблицы | Open the tables |
| `hbLoadFailedTitle` | Не получилось загрузить ваши предметы | Could not load your items |
| `saveItemSignIn` | Сначала вход в аккаунт | Signs you in first |

- Remove `saveItemNote` in both languages (the note is gone; owner yes, `reviews/mocks-1.md`
  M4-2). `saveItemNoteList` stays: it is the relink line, the item's second line.
- EN `saveItem` reads "Save to My items" (M4-2: "My items" is the tab's name, `myItems`);
  the quotation of it inside the EN refusal text that ends `Press "Save to my items" again.`
  follows (`git grep -n "Save to my items" -- app tests docs/specs`). RU `saveItem` stays
  «Сохранить себе».
- The two sentences that quote the button: the empty-list line of `dict.ts` that reads «...нажмите
  «Добавить в список» - или сделайте это прямо с карточки предмета» (RU and EN) and
  `help.ts` (the RU "Соберите список" paragraph and its EN twin). RU becomes «В список»; the EN
  text stays "Add to list".
- Do not touch `notFound`, `notFoundSub`, `rollNo`, `sendAll`, `addToList`.
- `i18n.test.ts` holds key parity: it passes with the seven new keys and one removed.

### S2. `Button` and `Menu`

- `Button.svelte`: prop `haspopup?: boolean`; the `<button>` gets `aria-haspopup={haspopup ? 'menu' : undefined}`.
  One case in `button.test.ts`.
- `Menu.svelte`: prop `up?: boolean` (default false). `up` adds the class `up`:

```css
.menu.up {
  top: auto;
  bottom: calc(100% + 8px);
  max-height: min(60dvh, 360px);
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

  The existing three callers (account, supplements, catalog «Ещё») do not pass it. A case
  in a test that already mounts `Menu` (`accountMenu.test.ts` or `shell.test.ts`) checks the class.

### S3. `DialogClose`

`app/src/components/DialogClose.svelte`: props `label: string` (the caller passes `app.t.close`, so the
component imports no state) and `onclick: () => void`; it draws

```svelte
<button type="button" class="dlg-x" {onclick}><Icon name="close" /><span>{label}</span></button>
```

Move `.sheet-x`'s CSS (40 px high, 1 px `--line2` border, `--r-sm`
radius, `font: 600 var(--t-data) / 1 var(--ui)`, hover border `--muted2`) into it as `.dlg-x`.
`Sheet.svelte` uses it and its focus line reads `.dlg-x`; `FilterPanel.svelte` line 74 reads
`dialog.sheet .dlg-x`; `sheet.test.ts` and `filterPanel.test.ts` follow. `git grep -n -E
"sheet-x|modal-x"` returns nothing after S9.

### S4. `ErrorPage`

`app/src/components/ErrorPage.svelte`: the error-page pattern of DESIGN.md. No icon, no plate.

```svelte
interface Props { title: string; children: Snippet; actions: Snippet }
<div class="errpage">
  <h1 class="errtitle">{title}</h1>
  <p class="errtext">{@render children()}</p>
  <div class="erracts">{@render actions()}</div>
</div>
```

`.errtitle` takes `.page-h`'s type (`--t-page`, `--h-page-weight`, `--h-page-spacing`, `margin: 0 0 8px`,
`overflow-wrap: anywhere`); `.errtext` is `--t-small` in `--muted`, `max-width: 62ch`,
`overflow-wrap: anywhere`, with a `code` child styled as the mock (`--t-data` mono, a `--bg2`
ground, `--r-sm`); `.erracts` is a flex row with an 8 px gap that wraps. Add the row to
`a11y.test.ts` `COVERED` (`'ErrorPage.svelte': 'itemPage.test.ts and record.test.ts, every error state'`).

The cause sentence names the address. A helper in the page: `const where = pathOf(app.hash,
app.lang)`, cut to 80 characters with `...` when longer, put in `<code>` by splitting
`t.noItemSub` at `%s`. Never write the address through `{@html}`.

### S5. `RecordActions`

`export type ActionRow = 'name' | 'card' | 'share' | 'menu'`. New prop `onpicked?: () => void`
(called first in each menu handler, so the menu closes and the focus returns before the clipboard
or share call; the existing handlers do not change).

- `row="share"`: `<Button size="md"><Icon name="share" />{t.share}</Button>` calling `send()`. `title` is not set.
- `row="menu"`: the copy items, in this order, each
  `<button type="button" role="menuitem" tabindex="-1"><Icon name=... />{label}</button>`:
  `copyText` (`copy`), `copyName` (`copy`), `copyImg` (`image`, only when `it.img && !app.artBroken(it.id)`),
  `copyLink` (`link`, only when `linked`). Labels are the long keys `t.copyText`, `t.copyName`, `t.copyImg`,
  `t.copyLink`.
- Rows `name` and `card` stay for the compact callers; their markup and CSS do not change.

### S6. `PickRow` (the action row)

New props: `index: Index`, `extra?: readonly ShareBlock[] | undefined`. Callers: `RecordPage`,
`ItemPage`, `RecordModal` (the last passes its `extra`). The component keeps everything it has now
(`foreign`, `offered`, `toLists`, `press`, `pressPrint`, the two `$effect`s, the two prompts) and
draws, in this DOM order:

1. `<AddToList {app} key={it.id} ids={[it.id]} primary size="md" {inModal} />`. `AddToList` gains `size?: 'md' | 'sm'`
   (default `'sm'`, passed to its `Button`; the selection bar and the editor's preview keep `sm`). Its label is `t.toList` (S10).
2. `<RecordActions ... row="share" />`.
3. «Печать» as today (`Icon print`, `title={t.printHint}`), `size="md"`.
4. «Изменить» as today when `app.homebrew?.has(it.id) && !foreign` (`Icon note`), `size="md"`.
5. «Ещё», in `<span class="morewrap">` (`position: relative; display: inline-flex`, so the menu anchors to it):
   `<Button size="md" haspopup expanded={moreOpen} controls={moreOpen ? menuId : undefined} bind:el={moreButton}><Icon name="more" />{t.moreMenu}</Button>`,
   and, while `moreOpen && moreButton`, `<Menu control={moreButton} label={t.moreMenu} id={menuId} cls="recmenu" up={inModal} onclose=...>`.
   Inside: `<RecordActions row="menu" onpicked={closeMore} />`, then, when `offered`, a separator
   (`<div role="separator" class="msep"></div>`) and the save item:

```svelte
<button type="button" role="menuitem" tabindex="-1"
  disabled={app.savingItem === ref || app.newListTarget === 'wait'}
  aria-labelledby="{noteId}-l" aria-describedby={noteId}
  onclick={() => { closeMore(); press(); }}>
  <Icon name="plus" />
  <span class="mit"><span id="{noteId}-l">{t.saveItem}</span><small id={noteId}>{second}</small></span>
</button>
```

   `second` is `toLists ? t.saveItemNoteList : app.newListTarget === 'prompt' ? t.saveItemSignIn : ''`;
   the `<small>` draws only when `second` is not empty. The accessible name is the label alone
   (`aria-labelledby`), so `d.press('Сохранить себе')` and `waitControl` of the e2e flows still match.
6. The two boxed prompts under the row, unchanged (`.saveprompt`, `flex-basis: 100%`).

`closeMore()` is TablesPage's: `moreOpen = false; moreButton?.focus()`. `moreOpen` is a component-local
`$state`; it is not a row of `STATE.md`. A band change needs no reset: the menu has one form at every width.
`menuId` is `rec-more-${inModal ? 'm' : 'p'}-${ref}`, as `noteId` is built.

Delete the `.savegroup`, `.savenote` CSS. The row is `.cardpick` (kept: `states.js` case 22 and `print.js` read the
class) and keeps `display: flex; flex-wrap: wrap; gap: 8px; align-items: center`. Its CSS lives in `RecordCard`
(S7). At 600 px and below the menu items are 44 px tall already (`Menu.svelte`); add `.recmenu .mit small { display:
block; font-size: var(--t-data); color: var(--muted2); font-weight: 400; max-width: 28ch }` and `.recmenu
[role="menuitem"] { align-items: flex-start }` here. `.msep` is a 1 px `--line` rule with a 4 px margin.

### S7. `RecordCard`

Props: `dossier?: boolean` (default `false`), `heading?: 'h1' | 'h2'` (default `'h2'`), `sub?: Snippet`.
The root class is `card {variant}` plus `dossier` when set, so `.card.full` selectors of the suites still match.

- The name: `<svelte:element this={heading} class="card-name">` with the same children as today. A
  `nameActions` snippet still renders for the compact callers. The `sub` snippet renders as
  `<div class="card-sub">{@render sub()}</div>` directly after the name element.
- The head order stays: `.card-meta`, name, `.card-sub`, `.eqstats`, `.card-desc`.
- Relation lines (`from`, `into`, set): after each homebrew record's `<a>`, draw `<Badge cls="hb">{t.srcHomebrew}</Badge>`
  (a new `Badge` class `hb`: dashed border is the unique tag's, so use the plain bordered badge look with
  `--txt` text; read `Badge.svelte` and add the one rule). The link keeps its name from `relName`
  without «(HB)»: pass a new local `plainName(r)`: `nameOf(r, lang)`. A catalog record draws no badge. `title` of the
  rung buttons and the ladder text stay as they are.
- The rule-card `summary` (`.refs summary`): a trailing chevron drawn as a CSS-only `::after` (the look of `Button`'s
  `<i class="caret">`), rotated when `details[open]`; the leading `ref` icon stays.
- The dossier CSS (all under `.card.dossier`):

```css
.card.dossier {
  background: none; border: 0; box-shadow: none; overflow: visible; animation: none;
  display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px;
}
.card.dossier .card-media { max-height: none; aspect-ratio: 4 / 3; border-radius: var(--r); cursor: default; }
.card.dossier .card-body { padding: 0; }
.card.dossier .card-name { font-size: var(--t-page); font-weight: var(--h-page-weight); letter-spacing: var(--h-page-spacing); }
.card.dossier .cardpick { border-top: 0; margin-top: 6px; padding-top: 0; }
@media (min-width: 761px) {
  .card.dossier { grid-template-columns: clamp(260px, 40%, 460px) minmax(0, 1fr); gap: 32px; align-items: start; }
  .card.dossier .card-media { aspect-ratio: 1; }
}
```

  The 760/761 pair is the system's (DESIGN.md "The Two Breakpoints Rule"); no new breakpoint.
  Up to 760 px the first action («В список», the `.seldrop` of `AddToList`) takes its own line:
  `.card.dossier .cardpick :global(.seldrop) { flex: 1 0 100% }` and `:global(.seldrop > .btn) { width: 100%;
  justify-content: center }`. The plate (`.card` gradient, border, shadow, `overflow: clip`) stays for
  `compact` and the plain `full` card of the editor's preview. In the dialog the focus ring of
  `.card-media:focus-visible` keeps `outline-offset: -2px`.
- Remove no `nameActions`, `actions` or `pick` prop: the compact callers and the editor's preview pass them.
- The `.cardpick :global(.dropmenu)` rules (opens down, `.up` flips) stay for the plain card; the dock overrides them (S9).

Then the artwork guard: `node --test tools/artwork/lib.test.mjs` fails on `CARD_HEAD_SHA256`. Read `renderCard` in
`tools/artwork/review/review.mjs` (`docs/artwork.md`, "The card follows the site's card"): it builds the compact head
by hand and does not draw `sub` or the heading level, so it needs no edit. Set the constant to the hash in the message.
The full card's picture size is not a row of `REVIEW_ART_SIZES` (the table lists thumbnails and compact sizes);
say so in `handoff.md`.

### S8. `RecordPage` and `ItemPage`

- Remove `PageTitle` from both ready branches. The card draws the `h1`: `<RecordCard dossier heading="h1" ...>`.
  Remove the `nameActions` and `actions` snippets; keep `pick`, now `<PickRow {app} {it} {index} owner=... />`.
- The `sub` snippet: the path line as today (`{where}` plus `TableLink`), in a `<p class="page-sub">`-like
  `<p class="subline">` (`--t-small`, `--muted`, `margin: 0`, `overflow-wrap: anywhere`); on `ItemPage` also `<UpdatedLine>`
  after it, with `.card-sub :global(.updated) { margin: 0 }` (its negative margin assumes `PageTitle`).
- `.itempage { max-width: 520px }` goes. `data-primary` stays on `.itempage`.
- Error states use `ErrorPage` (S4):
  - `RecordPage` `!it`: title `t.noItem`, text `t.noItemSub` (S4's address); actions: a primary
    `Button href={app.href(sectionHash('search'))} sameTab` reading `{t.findItem}`, then a plain
    `Button href={app.href(sectionHash('tables'))} sameTab` reading `{t.openTables}`. No icons.
  - `ItemPage` not found (`!readable || gone`): the same page. `ItemPage` failed read: `ErrorPage` with title `t.itemFailed`, text
    `t.sharedFailedSub`, action primary `{t.retry}` calling `view.retry()`.
  - `RecordPage` failed own-items read (`failed`): `<LoadState {t} failed page text={t.hbLoadFailed} onretry={retry} />`; the sentence
    keeps its period; `hbLoadFailedTitle` is drawn as an `h1` above it by `PageTitle title={t.hbLoadFailedTitle}` (rule 7: a
    failed page keeps a heading). `waiting` keeps its loading `LoadState`.
- The `StatusRegion` text for a gone item reads `t.noItem`.
- `NoData` branches do not change.

### S9. `RecordModal`

- Structure inside `.modal-card`: `<div class="modal-head"><DialogClose label={app.t.close} onclick=.../></div>` first (the close must
  stay the dialog's first `button`), then `<RecordCard dossier heading="h2" ...>` with `pick` only, `{extra}` and `{index}` passed to
  `PickRow`. `aria-label` of the `<dialog>` stays the name. The focus line reads `.dlg-x`.
- From 761 px: `dialog[open]` is centered as today; `.modal-card { width: min(980px, 100%); padding: 24px; background:
  linear-gradient(180deg, var(--surface2), var(--surface)); border: 1px solid var(--line); box-shadow: var(--shadow) }`.
  `.modal-head` sits at the card's top right (`position: absolute; top: 12px; right: 12px`); `.modal-card :global(.card-name)`
  takes `padding-right: 112px` so a long name does not run under it. The card's own scroll (`max-height: 88vh; overflow: auto`) stays.
- Up to 760 px (CSS media, no JS): `dialog[open] { padding: 0; align-items: flex-end }`; `.modal-card { width: 100%;
  max-height: min(92dvh, 100%); border-radius: var(--r) var(--r) 0 0; border-bottom: 0; padding: 0; display: block }`.
  `.modal-head` is sticky at the top (`position: sticky; top: 0; display: flex; justify-content: flex-end; padding: 8px 16px;
  background: var(--surface); z-index: 3`). The dossier gets `padding: 0 16px`. The dock is `.cardpick` inside the modal:

```css
@media (max-width: 760px) {
  .modal-card :global(.cardpick) {
    position: sticky; bottom: 0; z-index: 3; margin: 12px -16px 0;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    background: var(--surface); border-top: 1px solid var(--line);
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  }
  .modal-card :global(.cardpick > .btn), .modal-card :global(.cardpick .seldrop > .btn),
  .modal-card :global(.cardpick .morewrap), .modal-card :global(.cardpick .morewrap > .btn) { width: 100%; justify-content: center }
  .modal-card :global(.cardpick > :last-child:nth-child(odd)) { grid-column: 1 / -1 }
  .modal-card :global(.cardpick .seldrop) { position: static }
  .modal-card :global(.cardpick .dropmenu) { left: 0; right: 0; bottom: calc(100% + 8px); top: auto }
}
@media (max-width: 760px) and (max-height: 480px) {
  .modal-card :global(.cardpick) { position: static; margin: 12px 0 0; padding: 0; border-top: 0 }
}
```

  The prompts (`.saveprompt`) are `flex-basis: 100%` in a flex row; in the grid they take `grid-column: 1 / -1`. The `pick` is
  the last child of `.card-body`, which is the last child of the card, so the sticky dock sits at the end of the scroll.
- The modal keeps its entrance `pop`, its backdrop (`rgb(6 4 12 / 78%)`, blur 5 px) and its print rule. C63: after the change,
  take the built app's screenshot at 360x640 and 1180x720 with the page scrolled to 800 px behind it, and record in `handoff.md`
  that the backdrop covers the whole window (the audit saw a full-page capture artefact).

### S10. The label sweep and the suites that name a moved control

- `AddToList.svelte`: `{t.toList}` in place of `{t.addToList}`. `SelBar.svelte` line 129: the comment reads «В список».
- RU literal «Добавить в список» becomes «В список» in tests that mean the add control (`git grep -l "Добавить в список" --
  app/src tests`): the component tests (`a11y`, `lists`, `listPage`, `sharedListPage`, `tables`, `record`, `pickRow`, `homebrewEditor`,
  `homebrewPage`, `homebrewPrintPreview`, `itemPage`), `tests/app/inventory.js` (`NAME.ru.addToList` and 27 entries),
  `states.js` (21), `typo.js`, `tests/e2e/flows.mjs` (7). Tests that read `t.addToList` for the control read `t.toList`.
  Do not change `quickItem.test.ts`: `QuickItem` keeps `addToList`. EN literals stay.
- `README.ru.md` (lines 96 and 100) reads «В список»; `README.md` stays. `FEATURES.md` follows in S12.
- Press sites of a moved control gain one call: `d.more(name)` of K20 replaces `d.press(name)` / `d.click(name)` for `Скопировать текст`,
  `Скопировать название`, `Скопировать изображение`, `Скопировать ссылку` and `Сохранить себе` on `/i/`, `/h/` and the record
  dialog. Known sites: `inventory.js` 527, 933, 1220, 1223, 1591, 1627, 1636, 2592; `states.js` 285, 299, 352-359 (`has`
  becomes a check inside the opened menu), 4649, 4658, 4905, 4933; `flows.mjs` 486, 1156, 1339-1340. Leave the `/s/` and
  roll-card presses (`inventory.js` 2137, 2274; compact cards) alone. `git grep -n -E "Скопировать (текст|название|изображение|ссылку)|Сохранить себе" --
  tests` finds the rest; a press on a control that is no longer in the DOM throws, so each miss shows at once on CI.

### S11. Suites and states

`tests/app/driver.js`:

```js
/** Opens the «Ещё» menu of the open dialog, else of the page, then presses `name` in it. */
async more(name) { ... }
```

It evaluates the first «Ещё» button inside `dialog[open]` when one is open, else the first on the page; it presses it with `press`
(a trusted click), waits for `[role="menu"]`, then presses the item whose name is `name` inside the menu.

`tests/app/states.js`:

- Case 78 is rewritten ("«Сохранить себе» on a catalog record"): at 360x740 on `#/i/cm26` (the longest catalog name) the `h1` wraps
  inside 0..360, no sideways scroll, `d.more('Сохранить себе')` twice makes the toasts «... » and «... (2)» with «Изменить» inside
  0..360; at 1180x900 the menu opens under «Ещё», right edge inside the window. The old `.savegroup` reads go.
- New case 88, "the record actions fit at 360, 320 and 1180": for `#/i/ci1`, `#/i/ci1 as gm3` and the own item `#/i/hb_emberaxeaaaaaaaa as gm1`, RU
  and EN, at 360x640, 320x568 and 1180x720: every control of the row is inside 0..width, none has `scrollWidth > clientWidth`, the row is
  at most 3 lines; «В список» is the only `.btn.primary` of the page body; «Ещё» opens a menu whose box lies inside the window and
  whose items are 44 px tall at 360. In the dialog (`#/tables/eq_weapon`, press a row, 360x640 and 640x360): the dock is at the
  card's bottom while the card scrolls (rect bottom equals the dialog's bottom), its height is at most 0.45 of the window height, the
  menu opens up and lies inside the window and the card, a toast raised by a copy does not unmount the dock. With 150 account lists (`d.accountLists`)
  the add menu in the dialog at 360x640 scrolls, keeps its head and «+ Новый список» in view and stays inside the window.
- `FIRST_SCREEN`: `#/i/ci1` becomes `shipped: true`; a new row `{ state: '#/h/00000000-0000-4000-8000-000000000513 as gm1', shipped: true }`.
- Cases 3, 23, 31, 42, 9, 10, 11, 22, 81 read the moved markup: adapt each to `d.more`, `.dlg-x`, `.card.full` (kept), `.cardpick` (kept)
  and `.modal-card` (kept); case 42 measures the sign-in prompt in the dock's menu at 360, which now opens from the dock.

`tests/app/inventory.js`: the states of "Goldens and new states". `tests/app/print.js` is not edited unless a read breaks; its
`.card.full .cardpick button[title=...]` still matches.

### S12. Prose, in the same commit

`FEATURES.md`, "Records":

- The own-item bullet and the `/h/` bullet: «Отправить» becomes «Поделиться»; the pick row becomes the action row: «В список»,
  «Поделиться», «Печать», «Изменить» (the author), «Ещё». A reader sees «Предмет другого игрока» first in the path line.
- The «Сохранить себе» paragraph: the group and its note are replaced by the «Ещё» menu item with its second line (the relink line, or
  «Сначала вход в аккаунт» signed out); the relink behavior, the toasts and the limits are unchanged; the button reads "Save to My
  items" in EN; signed out the press opens the boxed prompt under the row.
- «Предмет не найден» of the record routes becomes «Предмета по этому адресу нет» (the cause as the title, the address, «Найти предмет»
  and «Открыть таблицы»); the status region says it; old list links keep «Предмет не найден» (lines 597 and 1182-1224, 1319).
- The copy bullets: «Скопировать название», «Скопировать ссылку», «Скопировать изображение» and «Скопировать текст» are the menu
  items; share is the labelled «Поделиться».
- A new bullet "The item page and the dialog": the dossier (the picture left from 761 px, 4:3 above the text below), the `h1`
  once, the dock and its 481 px rule, one gold primary.
- The record-modal bullet: a labelled «Закрыть», a bottom sheet with a fixed dock up to 760 px.
- The own-relations bullet: the badge in the three relation lines; «(HB)» stays elsewhere.

`CONTRACTS.md` line 102 and `ROUTES.md` line 320: the label «Отправить» and the not-found title in prose only; no route, id or link
changes. `COVERAGE.md`: the `itemPage.test.ts`, `pickRow.test.ts` rows (lines near 1526-1527), the "Records" row (near 1282) and
the `app/states` row (case 88 and the rewritten 78), `a11y.test.ts` if it lists the covered set. `STATE.md`: no change (local flags
are not rows; check `git grep -n moreOpen -- docs/specs/STATE.md` stays empty).

`DESIGN.md`: see "DESIGN.md rules this batch writes".

The decision file `docs/decisions/<date>-the-record-page-is-a-dossier-with-one-more-menu.md`:

```markdown
# <date> - The record page is a dossier, the actions are one row, and «Ещё» is a menu

- Task: `57` (the owner's mock 4 and its reviews, 2026-10-29; the AFK defaults of the batch 4 refresh).
- Decision: `/i/`, `/h/` and the record dialog draw one dossier (`RecordCard` `dossier`); the actions are «В список» (the one gold primary), «Поделиться», «Печать», «Изменить» and «Ещё», which holds the four copies and «Сохранить себе» with a second line; «Ещё» is the shipped `Menu` at every width; the error pages of the two item routes use `ErrorPage`.
- Rejected: «Ещё» as a bottom sheet at 360 (a `Sheet` nested in a modal dialog resets `app.dialogOpen` and draws two toasts; batch 8 decides it with the add-to-list menu); the record dialog built on `Sheet` (a remount at 761 px); the name above the badge row (the artwork review pins the head order); the mock's short path line (the spec writes the complete path); a skeleton for `/h/` (a new state and motion rule); changing `rollNo` (it rewrites the share stubs; batch 10).
- Accepted trade-off: at 360 «Ещё» is a popover, not a thumb-height sheet; the `h1` sits under the badge row; «(HB)» stays in text outside the card while the card draws a badge.
```

Add a pointer line to `docs/decisions/2026-09-30-hb-marks-homebrew-a-relation-shows-only-to-its-author.md` ("the card's relation lines draw the
badge «Хоумбрю»: `<date>`"). Then `node tools/decisions.js`.

Budget: `tools/bundle-budget.mjs` and `.claude/README.md` rise to the measured totals rounded up (standing rule of the file's comment,
never past 270 and 350): see "Verification", step 6. Name the measured figures and the reason in the comment, as batch 3b did.

### S13. Impeccable

The orchestrator runs `polish` and `harden` on `RecordCard`, `PickRow`, `RecordModal` and `ErrorPage` from the built app at 360 and 1180
px, and `handoff.md` gives the outcome. Fallback: `impeccable:impeccable-finish-reviewer`.

### S14. Gates

See "Verification".

### S15. Evidence

`issues/57/mocks/4/built/shoot.js`, from `mocks/3b/built/shoot.js`: at 360x640 and 1180x720, RU and EN: `/i/ci1`, its «Ещё» open,
signed out; `/h/` with the relink line open; the own item; the record dialog over `/tables/eq_weapon`, closed menu and open menu, at 360
and 1180; `/i/nope`; the failed `/h/` page. The set is evidence, not a gate.

## Acceptance criteria

Each line is observable in a suite, a unit case or the built app. `plan.md` section 7 "Batch 4" is the outline; its lines are first.

- New states, each with an inventory entry, a RU and EN golden and an axe case: the «Ещё» menu open (signed out, signed in, `/h/` with the
  relink line) and the dialog as a bottom sheet at 360, with and without its menu open (`inventory.js`).
- C63: the built dialog's backdrop covers the window at 360 and 1180 px (screenshot, outcome in `handoff.md`).
- Clarity (N11): no sentence stands under «Сохранить себе»; the menu item's second line is the relink line or «Сначала вход в аккаунт»; the
  signed-out press opens the boxed prompt under the row (`pickRow.test.ts`, `#/i/ci1 ~ save signed out`).
- The action row, superseding the outline's "three controls" line by mock round 5 (B4-1, N4-1): four labelled controls («В список»,
  «Поделиться», «Печать», «Ещё»), five for the author; nothing cut at 360 and 320 in RU and EN; «Печать» is on a control of the dialog
  at 360 (case 88, `pickRow.test.ts`).
- No `Button` neutral variant is added (plan review R4: no caller needs it); «Ещё» is not drawn pressed.
- The screen card draws no «Daggerheart» (verified: `git grep` in `RecordCard.svelte` finds nothing); noted in `handoff.md`.
- M4-2: one label per action on every page and state: «Сохранить себе» / "Save to My items"; the relink line is the second line when a list
  links the item; the plain note is gone; the toast words follow the button's (rule 5); `FEATURES.md` agrees.
- M4-3: the `/h/` failed read, the `/i/<key>` failed read and the own item with «Изменить» each have a state and a golden
  (existing states re-seeded; `hold: 'items:fail'` for the key page).
- M4-4: the picture is 4:3 up to 760 px and square from 761 px on the page and in the dialog; DESIGN.md "Shapes" says it.
- The selection bar's label (batch 3 deviation 2): the bar's add control reads «В список» in RU and "Add to list" in EN at 360 and 1180
  (`selectionBar.test.ts` or `tables.test.ts`, the bar goldens, case 16); `QuickItem` still reads «Добавить в список».
- N0-2 (`handoff.md` Deferred): `ErrorPage` draws a heading, the cause and the actions, no circled icon, in the three error states
  (`itemPage.test.ts`, `record.test.ts`, axe); DESIGN.md "The error-page pattern" says so.
- `/i/nope`, `/h/` unknown, malformed, deleted and no-cloud draw «Предмета по этому адресу нет», the address in `<code>` (cut at 80
  characters), «Найти предмет» (to `/search`) and «Открыть таблицы»; old list links still draw «Предмет не найден»
  (`tests/app/contracts.js` unchanged and green).
- C17: the dossier uses the width (side by side from 761 px). C18: one gold primary on the page; every action is labelled at every
  width. C19, A23: no note beside an action. C20, P4: the name is drawn once, as the `h1` on a page and the `h2` in the dialog. C44: the
  dialog's actions stay in reach at 360. C22, C46: the rule-card summary shows a chevron. A24: the relation badge (K12). P6: closed
  by M4-2 (EN names the destination; RU keeps the owner's word).
- P5 is not changed; `handoff.md` Deferred names it and the placement in batch 10 (K11).
- Focus: a pressed menu item returns the focus to «Ещё» (rule 20); Escape closes the menu and, in the dialog, only the menu; the
  dialog's first `button` is its close (`Toast` returns focus there).
- Header: a menu or the dialog freezes it (`[role="menu"]`, `dialog[open]`; no change needed, case 86 passes).
- The dock: sticky, at most 0.45 of the window height at 360x640 and 640x360; not sticky below 481 px of height (case 88).
- `FIRST_SCREEN`: `/i/ci1` and the `/h/` row are `shipped: true` and pass at 360x640 and 1180x720 in RU and EN (the mock measured 133 and
  85); the offsets are in `handoff.md`.
- The artwork guard: `CARD_HEAD_SHA256` is updated after `renderCard` is read; the full card's size is not a `REVIEW_ART_SIZES` row.
- Each new component has an axe case in `a11y.test.ts` (`ErrorPage`, `DialogClose`) and is reached by a test.
- Specs, DESIGN.md rules, the decision file and the pointer line of S12 match what ships; `COVERAGE.md` rows agree.
- From "Each of batches 2-9": the detector line, American spelling in new prose, the screenshot set in `mocks/4/built/`, the `polish` and `harden`
  outcome, `routes.json` unchanged.
- The bundle budget is raised by the standing rule with the measured figures (see S12 and "Verification"); the reason is in the file.
- The gates pass and CI is green on the pushed tip.

## First-screen rows (plan section 14)

| Route | 360x640 (limit 256) | 1180x720 (limit 288) | Row |
|---|---|---|---|
| `/i/ci1` | the mock measured 133 RU and EN; today 255 and 218 | the mock 85; today 170 | `shipped: true` |
| `/h/<uuid 513> as gm1` | the mock 133 | the mock 85 | new row, `shipped: true` |

The art is first on the page at 360, so `[data-primary]` starts under the header (111 px) and the 26 px of `main` padding. Design target
(plan review R2): 240 and 270. If a measured value passes the limit, log it in `handoff.md` and name the fix; do not move the limit.

## Goldens and new states

About 90 existing goldens move (86 hold the RU or EN add label today, plus the error pages). The re-seed runs the four shards; the
`git diff --stat tests/app/snapshots` lists the moved files. A moved file outside these families is a defect to read, not to re-seed:
`/i/*`, `/h/*`, the record modal states (`#/tables ~ a row opened*`, `#/roll/wondrous ~ modal`, `GM2_LIST ~ axe opened`), the selection-bar
states (`~ a row ticked`, `~ selecting`, `~ bar menu`, `#/s/player-token-1 ~ ...`, `#/search ~ a row ticked`), the editor and list states that
draw the add control, `#/i/nope` and the `/h/` not-found state.

New inventory entries (ids end with the language-independent part; both languages seed into one file):

| State id | Width | Entry |
|---|---|---|
| `#/i/ci1 ~ actions menu` | default | `d.press('Ещё')` (signed out: the second line «Сначала вход в аккаунт») |
| `#/i/ci1 ~ actions menu as gm1` | default | signed in: «Сохранить себе» with no second line (a catalog record, no relink target) |
| the `/h/` state that holds a list linking the item (the one of `GM2_LIST ~ axe opened as gm2`'s family: read its `why`) `~ actions menu as gm2` | default | the second line is the relink line |
| `#/tables/eq_weapon ~ a row opened` | 360 | press the row «Палаш» (the dock) |
| `#/tables/eq_weapon ~ a row opened, actions menu` | 360 | then `d.press('Ещё')` (the menu opens up inside the card) |

`GM2_LIST ~ axe opened as gm2` changes its `why` and its `enter`: the relink note is now inside «Ещё». The own item `#/i/<HB_AXE> as gm1` keeps its id.
Seed the new files with the shard run; do not edit a golden by hand.

## DESIGN.md rules this batch writes

- "The Action Vocabulary Rule" (new, "Layout"): «В список», «Поделиться», «Печать» and «Ещё» are the same four labelled controls on every
  record surface at every width; «Изменить» joins for the author; the copies and «Сохранить себе» live in «Ещё», a `Menu` that opens down
  on a page and up in the dialog; one gold primary; a label never gives way to an icon (the Same Label Rule).
- "The Dossier Rule" (new, "Layout"): a record page and the record dialog are one dossier, the picture beside the text from 761 px and 4:3
  above it below; the name is drawn once; the dialog is a bottom sheet with a sticky dock up to 760 px (not sticky from a window shorter than 481 px).
- "The error-page pattern" (new, "Components", beside "Empty state"): `ErrorPage`: the cause as the title, one sentence that names the
  address, the actions; no icon and no plate.
- "Shapes": the sentence "Artwork is square" gains "except the record page and the dialog up to 760 px, which crop it to 4:3; `max-height`
  420 px goes".
- "Cards": the `Layout` bullet reads "`full` stacks the image above the body, or, as a dossier, sets it beside the text; `compact`..."; the
  relation-line badge.
- "Bottom sheet": a sentence that the record dialog up to 760 px has the sheet's look and is not a `Sheet`; «Ещё» is a `Menu` (K1).
- The Two Breakpoints Rule: "menu or sheet" is checked against the dialog and «Ещё»: no new step.

## Tests

| File | Cases |
|---|---|
| `pickRow.test.ts` | the row's DOM order and labels (signed out, signed in, author, reader); «Ещё» opens a `role="menu"` with the four copies in order and no image item without art; the save item with `aria-describedby` and its second line (relink, signed out, none); a press closes the menu and returns focus to «Ещё»; Escape closes only the menu; the signed-out press opens the boxed prompt; the existing save cases (two presses, relink, refusals) press through the menu; axe with the menu open |
| `record.test.ts` | the dossier card: one `h1` on the page and no second name, `h2` in the modal; no `nameActions` on the page; the relation badge for a homebrew record and none for a catalog one; the rung title keeps «(HB)»; the rule-card chevron; copy handlers through the menu items (text, name, image fallbacks, link); the compact card still draws `.card-acts` |
| `itemPage.test.ts` | the `h1` is the item's name; the path line and `UpdatedLine` under it; each error state through `ErrorPage` (not found for a malformed id, an unknown id, a gone item, no cloud; the failed page with «Повторить»); the status region says `noItem`; axe in each |
| `recordHost.test.ts` | the dialog's first `button` is «Закрыть»; the dock's `.cardpick`; Escape with the menu open |
| `lists.test.ts`, `tables.test.ts`, `selectionBar.test.ts` | the add control reads `toList` in the bar and the card; `lists.test.ts` presses the new label |
| `sheet.test.ts`, `filterPanel.test.ts` | `.dlg-x` replaces `.sheet-x`; focus on open |
| `button.test.ts`, `accountMenu.test.ts` or `shell.test.ts` | `haspopup`; `Menu` `up` class |
| `a11y.test.ts` | rows for `ErrorPage.svelte`, `DialogClose.svelte`; the `COVERED` list equals the files on disk |
| `lib/i18n.test.ts` | parity with the seven new keys and the removed one |
| `tools/artwork/lib.test.mjs` | the card head hash |
| `tests/app/states.js` | cases 78 (rewritten) and 88 (new), the two `FIRST_SCREEN` rows, the adapted cases of S11 |

## Verification

In this order, after S12. One command per call. A browser suite does not run locally (`plan.md` section 7, the writer's local gates).

1. While editing: `npx vitest run app/src/components/pickRow.test.ts app/src/components/record.test.ts
   app/src/components/itemPage.test.ts app/src/components/recordHost.test.ts app/src/components/lists.test.ts
   app/src/components/tables.test.ts app/src/components/selectionBar.test.ts app/src/components/sheet.test.ts
   app/src/components/filterPanel.test.ts app/src/components/button.test.ts app/src/components/a11y.test.ts
   app/src/components/quickItem.test.ts app/src/components/sharedListPage.test.ts app/src/components/listPage.test.ts
   app/src/components/homebrewEditor.test.ts app/src/components/homebrewPage.test.ts
   app/src/components/homebrewPrintPreview.test.ts app/src/components/shell.test.ts app/src/lib/i18n.test.ts
   app/src/lib/help.test.ts`, then `npm run lint:untyped` and `npm run lint:typed`.
2. `node --test tools/artwork/lib.test.mjs` (after the hash update).
3. `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to 4, one at a time. Then `git diff --stat
   tests/app/snapshots`: only the families of "Goldens and new states" and the new files.
4. `node tools/decisions.js`.
5. `npm run check:built` (the unconfigured budget).
6. The configured budget: `npm run build` with placeholder `VITE_SUPABASE_*` values (this worktree has no `.env.test.local`), then
   `node tools/bundle-budget.mjs`. Raise both limits by the file's standing rule: the measured total rounded up to the next whole kB,
   never past 270 unconfigured and 350 configured, in the same commit as the reason, in `tools/bundle-budget.mjs` and `.claude/README.md`.
   Expected growth: +1.5 to +2.5 kB gzip (about +0.5 for `PickRow` and `RecordActions`, +0.5 for the dossier and dock CSS, +0.4 for
   seven strings, +0.3 for `ErrorPage` and `DialogClose`, the rest `Menu`, `Button`, the badge). From 253.6 kB that is 255.1 to
   256.1 unconfigured, so the limit becomes 256 or 257; from 311.0 it is 312.5 to 313.5 configured, so 313 or 314. If the measured total is
   under 254.0, no raise.
7. `impeccable detect --json --no-inline-ignores app/src`, and the spelling grep of batch 2's word list over the touched files and the new prose.
8. `rtk npm run check:fast` (Bash timeout 600000), last.
9. Commit, push, the CI credit. CI's `app/states` (cases 78, 83, 88 and the adapted ones), `app/contracts`, `app/print`, `sweep.js` at 360,
   390, 768 and 1180 and the `e2e` flows F8, F18, F20 are the browser proof; a failing case there is a case to read against this brief. The
   batch review follows (trigger: new or changed UI; `tests/app/` changed).

## Risks and do-nots

- Do not change `notFound` or `notFoundSub`: the preview worker, `tools/share-card.mjs` and old list links read them.
- Do not change `rollNo`, `sendAll`, `addToList`, `Actions.svelte`, the compact card or the editor's preview card.
- Do not make the close button anything but the dialog's first `button`: `Toast.svelte` returns focus to it.
- Do not nest a `Sheet` in the dialog (K1) and do not give `RecordModal` a `<Sheet>`.
- Do not use `{@html}` for the address or the second line.
- Do not add a breakpoint: the pair is 760/761. The 481 px height rule is a component rule, named as batch 3's R5 is.
- Do not write a golden by hand; re-seed with the four shards.
- `AddToList`'s `.dropmenu` is measured against `.card` and `.modal-card` by `placeMenu`; in the dock `.seldrop` becomes `position: static`
  and the CSS in S9 pins the menu above the dock. If case 42 or 23 fails, read their measure first (they read `.modal-card`).
- A `position: sticky` dock needs every ancestor up to `.modal-card` to keep `overflow: visible` or `clip`; `.card.dossier` sets `overflow: visible`.
  Do not add `overflow: hidden` to `.card-body`.
- The toast draws over the dock for its few seconds, as it draws over the selection bar. Accepted.
- The first-screen number depends on Source Sans 3 line boxes; the design margin is large (133 of 256).
- A moved control makes a press throw on CI, not here. Search the whole `tests/` tree before the push (S10).
- `FilterBar.svelte`, `BatchBar.svelte` stay (batches 6, 8, 9a). `KeepNote.svelte` stays (batch P).
- Review order: `RecordCard.svelte`, `PickRow.svelte`, `RecordActions.svelte`, `RecordModal.svelte`, `ErrorPage.svelte`, `Menu.svelte`, the suites, the prose.

## Standing checks for batch 4

1. Scale. The batch adds no collection and no cap; it changes what a record draws.

   | State | Shows | Proof |
   |---|---|---|
   | Catalog record, signed out | dossier; «В список», «Поделиться», «Печать», «Ещё»; the menu holds four copies and «Сохранить себе» with «Сначала вход в аккаунт» | `#/i/ci1`, `~ actions menu` |
   | Catalog record, signed in | the same; no second line | `~ actions menu as gm1` |
   | Reader's `/h/` item | path line with «Предмет другого игрока», «Обновлено N назад»; the relink line when a list links it | `/h/` goldens, `~ actions menu as gm2` |
   | The author's item | + «Изменить»; five controls; the dock's last cell spans two columns | `#/i/<HB_AXE> as gm1`, case 88 |
   | No picture, or a broken one | the glyph well; no «Скопировать изображение» item | case 11 (adapted), `record.test.ts` |
   | Account lists: none, one, 50 (the limit), 51st (the refusal, unchanged), 150 (3x) | the add menu: «ничего» / one chip / a search from 8 and a scrolling list / 150 scrolling rows; its head and «+ Новый список» stay in view | `lists.test.ts` (unchanged), `#/i/ci1 ~ many lists as gm4`, case 88 (150 at 360) |
   | Longest name (120 code points) | `h1` wraps inside the column; the dialog's `h2` clears the close button; nothing sideways | `#/i/ci1 as gm3` golden, case 78 (cm26 at 360), sweep |
   | Longest text (3000 characters) | the dialog's card scrolls under a fixed head and dock; the page grows | `#/h/<515> ~ markup as gm4` golden, case 88 |
   | Relations past the fold (15 homebrew relations) | three names, the badge each, «и ещё 12» | `#/i/ci1 as gm3`, `~ more` goldens |
   | An address of 500 characters on the error page | cut at 80 characters with `...`, wrapped | `itemPage.test.ts` |
   | 360 and 1180 px | each row above at both widths; 320 px for the dock | case 88, sweep, goldens |

   At many and at the limit: the row order is DOM order; the primary is first and takes its own line up to 760 px; the add menu is at
   most `min(60vh, 340px)`; the «Ещё» menu is at most `min(60dvh, 360px)` when it opens up; with the on-screen keyboard open at 360x480 the
   dock is part of the card's scroll, not fixed, and the new-list input inside the add menu stays above the keyboard as case 79 and
   case 42 measure. Sticky regions: the dialog's head (one row, 56 px) and the dock (at most 150 px with five controls at 320 px); the pair
   can reach 206 px, which is under half of 480 px and is why the dock unsticks below 481 px of height.
2. Error scenarios. Loading: `/h/` and a waiting own key draw the load line; the dialog needs none (its record is in memory). Failed
   read: `/h/` draws `ErrorPage` with «Повторить»; `/i/<key>` draws the heading and `LoadState page`; each retry reads again through
   `view.retry()` and `app.homebrew.load()`, never from a copy held before. Failed write: «Сохранить себе» refusals and a lost answer are
   toasts as today, the menu is already closed, the focus is on «Ещё»; the kept retry key of the spec is untouched. Offline: the copies
   fall back as today (`copyImage` to a download, `send` to the clipboard). Conflict: another tab's save reaches the page by the 45 s
   re-read; the `StatusRegion` says «Предмет обновлён». A named record deleted: `/h/` draws the error page and says `noItem`; the dialog
   closes when its record leaves the index (`RecordHost`). A stale tab: nothing is stored, so the previous bundle draws its old row until
   a reload. A revert: nothing is stored. No path can lose stored data.
3. Consistency. Rules of `FEATURES.md` "Consistency rules" followed: 4 (one name: «Сохранить себе», «Поделиться», «Мои предметы»), 5
   (the toast repeats the button's word), 6 (a failure replaces the page: primary «Повторить» and a title), 7 (a failed page keeps its heading),
   9 (the primary is the first control), 11 («Закрыть» on a read-only dialog), 14 (RU and EN with the same facts), 16 (long names wrap,
   `overflow-wrap: anywhere`), 17 (the link comes from the same function), 20 (focus returns to «Ещё»). Departures named: «Ещё» is
   a popover at 360 where mock 4 draws a sheet (K1); the name sits under the badge row (K7); the dialog draws no path line (K10); the
   relation badge replaces «(HB)» on the card only (K12). Compared with the siblings: the catalog's «Ещё» is the same `Menu`; the
   bar's add control has the same label as the card's; the roll cards still read «Отправить» until batch 5; `/s/` keeps its «Сохранить себе» button until
   9a; the selection bar, the toasts and the load wording do not change.
4. RU/EN parity: the seven new keys in the table of S1 have both languages with the same facts, no plural form, ASCII punctuation, «ёлочки» in
   RU only; `saveItemNote` is removed from both; the EN `saveItem` follows `myItems`; the RU «В список» and the EN "Add to list" name the same
   control; cases 88 and 78 run in both languages and the goldens hold both.

## Gate cost

Per `plan.md` section 8: one code batch is 45-60 minutes with its `check:fast`, one CI run and one review fix cycle. Extra local gates:

| Gate | Minutes |
|---|---|
| the affected vitest files (about 20) | 4-6 |
| `node --test tools/artwork/lib.test.mjs`, both lints, decisions, the detector | 4-5 |
| `build:test` and the four golden shards (about 90 moved files) | 11-12 |
| `check:built` and the configured build with `bundle-budget.mjs` | 3-4 |
| the orchestrator's `polish` and `harden` | 5-10 |
| the screenshot set | about 3 |

Total: 30-40 minutes of extra gates (`plan.md` section 8 says 1; the row under-counts). The plan total in section 8 (about 610-788 minutes left) rises by 29-39.
Browser suites, sweeps and the e2e flows run on CI (owner, "Local gates").

## Writer tests

Facts for the orchestrator's dispatch, not a model choice.

| Test | Answer |
|---|---|
| 1 (a step asks for a choice, or an `Open design question:`) | no: every choice is decided above |
| 2 (public contract, route, stored state, product law, migration, hook, configuration) | no for contract, route, state, law and migration; `tools/bundle-budget.mjs` rises under its standing rule |
| 3 (visual judgment: print fitting, a golden re-seed, parity with a design node) | yes: about 90 goldens re-seeded and a new dossier and dock layout that rest on visual judgment; no design node |

## Split criterion

A different component group and route (`/i/`, `/h/`, the dialog), as `plan.md` section 7 gives. Everything inside shares one component set (`RecordCard`,
`PickRow`, `RecordModal`), one seed set and one golden re-seed, so it is one batch (`CLAUDE.md`, "Task and session protocol": merge work that shares a
component, seed and filter). The selection bar's label rides here because `AddToList` is one component with one label; a split would re-seed the bar and
card goldens twice.

## Plan review

Not required (no trigger fired): no migration or SECURITY DEFINER function; no public contract (`routes.json`, `CONTRACTS.md` values, `llms.txt`,
`tests/contracts.js` and `docs/fixtures/` do not change; `CONTRACTS.md` and `ROUTES.md` change prose labels only; `notFound`, the preview worker and the
share stubs are untouched, which is why `rollNo` is not changed here); no stored data or `localStorage` key; no write or sync protocol (the save, print and
share paths are untouched). A batch review is required after the implementer (trigger: new or changed UI).
