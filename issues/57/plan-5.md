# Batch 5 - Roller pages and the card face on results (implement-ready)

This brief is the implementer's whole input for batch 5, with the mock `mocks/5/`
(`index.html`, the PNGs, `b5.js`, and `mocks/1/ua.css` lines 497-600 and 922-1100 for
its spacing). It has the shape of `plan-4.md` and `plan.md` section 10. The owner is
AFK (`context.md`, "Owner AFK from 2026-11-03"), so every choice below is the
recommended option; the orchestrator logs each one in the owner-AFK decisions file. A
mock is direction, not the source of truth (owner, 2026-11-03): the departures are
named in "Decisions", and none of them reopens a decision of the owner. Section numbers
("section 7") are those of `plan.md`.

Batch 5 runs after batch 4's `polish`, `harden`, review and CI, in wave 2.

## Objective

The nine roll pages share one layout. Up to 760 px: the `h1` is read, not drawn; the
roll controls sit under the mode row; one line holds «Бросок N», «Настроить» and
«Ещё»; the pin and the help are items of «Ещё». From 761 px: the head keeps the `h1`,
the labeled pin and the labeled help button on one line, and the page has two panes,
the controls (320 px) and the results. A roll result is a card face: the picture 4:3
with a fade into the plate from 601 px, a 96 px picture beside the text up to 600 px;
under it a labeled row «В список», «Поделиться», «Ещё». The roller's gold budget is one
primary. The `/roll/alt` tab title and its start-section option read the heading
(2-N5).

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a
  rebase).
- Batch 4 is on the branch by now. Read `git log --oneline -8`, then `git diff 38767ca4
  HEAD -- app/src/components/PickRow.svelte app/src/components/RecordActions.svelte
  app/src/components/Menu.svelte app/src/components/Button.svelte
  app/src/components/AddToList.svelte app/src/components/RecordCard.svelte
  app/src/lib/dict.ts tests/app/driver.js DESIGN.md`. This brief names batch 4's shape
  from `plan-4.md`: `RecordActions` rows `share` and `menu` with `onpicked`, `Button`
  `haspopup`, `AddToList` `size`, `Menu` `up`, `toList`, `d.more(name)` and cases 78 and
  88. A line that no longer matches is the implementer's to adapt, and `handoff.md`
  names the change.
- The mock is `mocks/5/`. It was re-checked against the shipped code: ten departures
  follow (L1, L2, L5 to L12). The mock is not redrawn and not shown to the owner again.
- Impeccable cannot run from a subagent. The orchestrator runs `polish` and `harden`
  after S10 on `RollPage`, `RollResult`, `DiceBar`, `RollSelect` and the face, from the
  built app at 360 and 1180 px; fallback `impeccable:impeccable-finish-reviewer`.
- Steps are S1 to S15. The line "Session end partial progress" in `handoff.md` names
  the last finished step.

## Decisions of this refresh (planner defaults; the owner is away)

| # | Decision | Reason and trade-off |
|---|---|---|
| L1 | One new `RollPage.svelte` is the shell of all nine modes. It reads `app.band`: `narrow` (up to 760 px) draws the narrow layout, any other band draws the two panes. The DOM differs by band, as in `TablesPage`; no hidden duplicate. | The mock draws both layouts in one DOM and hides one by CSS. That duplicates every number field and every id. `TablesPage` already switches on `app.band`. Trade-off: a band change remounts the controls; the values live in the panels, so nothing is lost. |
| L2 | The result card is a new `RecordCard` variant `face`. `compact` stays for `ListPage`'s roll result until batch 9b moves it. Departure from the mock only in that `compact` is not restyled. | A change of `compact` in place would reshape the list page's roll panel in a batch that does not own it (A1 at 640-900 px is 9b's). `variant` has one more value for a while; 9b deletes `compact`, its 132 px and 96 px rules and the two `REVIEW_ART_SIZES` rows. |
| L3 | The action row of a result sits under the card's plate, in a new `RollResult.svelte` (card and row, one unit). It holds «В список», «Поделиться» and «Ещё». It has no «Печать», no `nameActions` icons and no `Actions` row. The three near-copies of `cardOf` in `StdPanel`, `AltPanel` and `RollPanel` go. | As in the mock. The plate is `overflow: clip`, so a popover inside it is cut; the add-to-list menu and «Ещё» need to leave the plate. R0-1: no icon-only control. Extract on the second use (`CLAUDE.md`): the three copies were "too small to extract"; with the row they are not. |
| L4 | `MoreMenu.svelte` is extracted from `PickRow`'s «Ещё» (the button, the `Menu`, `closeMore`, the focus return of rule 20). `PinItem.svelte` and `HelpItem.svelte` are extracted from `TablesPage`'s two inline menu items. Callers: `PickRow`, `RollPage`, `RollResult` (`MoreMenu`); `TablesPage`, `RollPage` (the two items). `TablesPage`'s own «Ещё» button keeps its `morebtn` look. | Second and third real use. Batches 6, 7 and 8 move the pin into «Ещё» and reuse the three. The `TablesPage` DOM must not change: a moved `_tables_*` golden is a defect. |
| L5 | The «ИЛИ» separators of `OrGrid` stay. The mock draws none. `OrGrid` stacks by a container query on its own width (640 px) in place of the 860 px viewport media rule. | The separators are shipped, spec'd behavior (`FEATURES.md`, "Rolling": a choice, not a list; C26's cue). The mock dropped them with the «Выберите одно» heading (M5-8), and nothing else says the cards are alternatives. The two-pane page gives the results 387-600 px between 761 and 999 px, which a viewport rule cannot read. Trade-off: 76 px of separator column at 1180. |
| L6 | The five dice are plain buttons: none is gold, none is lit. Narrow: a 3 + 2 grid, two lines each (the count, the rarities it covers). From 761 px: a list of five rows under the group label «Бросить». The word «Бросить» leaves the first button. Departure from the mock's lit `1d12`. | A die is an action, not a choice, so nothing can be lit (The Seal Rule); a "last rolled" state would be new state with no spec. C25 asks for one gold primary: the roller has none on `/roll/std`, and the lit mode chip is its one gold. `tests/app/hues.js` changes (S10). |
| L7 | Source and type keep the toggle chips, the refusals `keepOneSource` and `keepOneKind` and the shared `app.kinds`. All chips of a row on: each is neutral pressed (the check, no gold). A row narrowed: the chips left on are gold. There is no «Все» chip. The closed «Настроить» is lit like «Фильтры · N» (variant `toggle`) while a row is narrowed and names the value: «Расходники»; two rows narrowed: «Настроить · 2». | The mock's «Все» pattern changes the model (a radio over a toggle set) and the spec rule that the last source cannot be emptied. The neutral default fixes C25's gold chips with no behavior change. Trade-off: the row has no reset chip; a second press turns a value back on. |
| L8 | A choice among parts is a native `<select>` inside a styled label: `RollSelect.svelte`, the name over the value. It serves Vault of Ages, Community items and Many Worlds Tavern at every width, and the rarity on `/roll/alt` up to 760 px. From 761 px the rarity is a row of neutral chips with no tier line (N5-3, C41). | The mock draws a custom listbox button. A native select gives the phone's own picker, keyboard and screen reader behavior, and needs no popup code. Trade-off: the open list is the browser's, not the page's; no golden can draw it. |
| L9 | The copy button keeps its label «Скопировать все варианты» / "Copy every option" (`copyRoll`). The mock reads «Скопировать все четыре». | A roll with one source or one kind offers two cards, and one card offers none; «четыре» is false then. |
| L10 | The mock's foot line (a muted «Daggerheart» left, the source right) is not built. The source stays the last badge of the badge row (`srcLabel`). The lead line (`sub`) of a page stays from 761 px, as today, and is read, not drawn, up to 760 px. | The screen card has no «Daggerheart» line (`plan-4.md` fact 10), so the owner's bottom-line rule holds by construction. The mock drops the lead at every width; removing visible text on a laptop is not mine to decide (`context.md`, Constraints). The owner may drop it later; the line costs about 40 px at 1180 (see "First-screen rows"). |
| L11 | The manual-entry copy stays: the field labels «Результат броска (1-60)» and the existing names. The mock's «Или введите свой бросок» and «Сумма на кубиках» are not built. | New copy with no owner decision and a test-literal sweep for a gain the Clarity Rule does not demand. The entry sits in the left pane under the roll controls and in «Настроить». |
| L12 | The nine help buttons take the names of the mock (N2-2): std «Где какая редкость» / "Where each rarity is" (plan Q5.1 and review R3; the mock reads "fits"), alt «Об этих таблицах» / "About these tables", Wondrous Environments «Об этой таблице» / "About this table", Dread, Vault of Ages, Dragon's Vault, Arazo, Many Worlds Tavern «Об этой книге» / "About this book", Community items «Об этих предметах» / "About these items". Set through `Help.button`. | The Same Label Rule: the button carries the panel's name. |
| L13 | The roll button of a range that is no die reads «Бросить 1-30» / "Roll 1-30" (N5-2; ASCII hyphen). The key `randomIn` goes if nothing else reads it. | «Случайно 1-30» does not say it rolls. |
| L14 | The roll number badge is drawn over the picture, top right, from 601 px, and hidden up to 600 px (the results line names the roll). | As in the mock. DESIGN.md "Badges" now says so; plan section 7 wrote "at 1180 only". The 600 px step is the system's touch step. |
| L15 | Up to 760 px the page's top padding is 6 px and the spacing is the mock's (`ua.css` 1056-1097). The closed «Настроить» and «Ещё» are 28 px tall there; the mode chips are 40 px (batch 2). | The first-screen offset of 245 depends on these numbers. |
| L16 | `/roll/std` at 360 is the named exception: `exception: 325` (owner, 2026-10-29: about 325; the mock measured 323). Rows `#/roll/alt`, `#/roll/alt ~ crit`, `#/roll/voa` and `#/roll/wondrous` join `FIRST_SCREEN` as `shipped: true`. | Section 14 and review M5-5: the picker modes and the plain mode are the three layouts; the crit plate is the tallest primary. The other modes share them. |
| L17 | `REVIEW_ART_SIZES` gains one row for the face; the 132 px and 96 px rows stay while `ListPage` draws `compact`. | The artwork review page must show the sizes the site draws. |
| L18 | A decision file records L1 to L8. | They outlive the task. |

## Placed items (the orchestrator folds these into `plan.md`; this brief cannot edit it)

- Section 8, row "4-8, 9a, 9b": replace "1" for batch 5 with 32-40 minutes of extra gates
  (see "Gate cost").
- Section 14: `FIRST_SCREEN` gets the five rows of L16; case 83 reads an `exception` limit
  for 360 px.
- Batch 9b, acceptance, one line: "`ListPage`'s roll result draws `variant="face"` and
  `RollResult`'s row; `compact`, `nameActions`, `Actions`, `sendAll`, the `.card.compact`
  rules and the two `REVIEW_ART_SIZES` rows for 132 px and 96 px are deleted."
- Batches 6, 7 and 8: the pin moves into «Ещё» through `PinItem` and `MoreMenu`
  (acceptance wording: "the pin item is `PinItem`").
- Plan review: not required for batch 5 (see the end of this file).

## In scope

- The outline of section 7, "Batch 5", every line, with the superseding noted in
  "Acceptance criteria".
- `RollPage`, `RollResult`, `RollSelect`, `MoreMenu`, `PinItem`, `HelpItem` (new);
  `StdPanel`, `AltPanel`, `RollPanel`, `PickerRollPanel`, `DiceBar`, `OrGrid`,
  `RecordCard` (the `face` variant), `RecordActions` (a `size`), `PickRow` and
  `TablesPage` (the extractions), `help.ts`, `dict.ts`, `icons.ts` (`tune`).
- The browser suites, the goldens and the prose that name a moved control.

## Out of scope

- `ListPage`'s roll result, `compact`, `Actions.svelte`, `sendAll` (9a and 9b).
- `PageHead`: no rule is added. Up to 760 px no roll page draws it (feedback A1).
- The mode row, the header, the supplements menu (batch 2).
- The crit plate's content: its two labeled table links are the shipped `altTables`
  (M5-4 holds). Only its look in the new column is checked.
- Print, the item page, the dialog (batch 4).
- The lead line (L10), the manual-entry copy (L11), a «Все» chip (L7).
- `rollNo`, `notFound`, `routes.json`, `llms.txt`.

## Facts read from the code (38767ca4, 2026-11-04)

1. `StdPanel`, `AltPanel` and `RollPanel` each draw `PageHead`, `RecordHost`, a `Panel` of
   `Field`s, an optional `.resbar` copy button and a `.results` block (`data-primary`,
   `role="status"`, `aria-live="polite"`). Each has its own copy of the `cardOf` snippet.
   `PickerRollPanel` wraps `RollPanel` and draws a `ChipRow` of the parts.
2. The results are `RecordCard variant="compact"` with the `nameActions` snippet (two
   icon buttons) and the `actions` snippet (`RecordActions row="card"`: «Отправить», copy
   image, copy text; the labels are hidden up to 600 px). A roll card has no add-to-list
   control and no «Ещё».
3. `compact` is 132 px beside the text, 96 px up to 600 px. `ListPage` is its other
   caller. `REVIEW_ART_SIZES` reads both widths from `RecordCard.svelte`
   (`tools/artwork/lib.mjs` 794-821; the guard is `tools/artwork/lib.test.mjs`).
4. `DiceBar` draws five gold `Button`-like buttons (`.dicebar .btn`), the word «Бросить»
   on the first, the rarities as an uppercase `<small>`. `tests/app/hues.js` 119-156
   asserts four or more gold roll buttons with a die on `/roll/std` and exactly one on
   every other mode.
5. `PageHead` is a wrapping flex row: the `h1`, the pin, the help button (`labeled`), the
   `sub` line. Up to 760 px the pin and the help are round. `TablesPage` draws a visually
   hidden `h1`, a picker row with «Ещё» (a `Menu` with the pin and the help items, then
   `closeMore()`) and `HelpBox` under it when `app.band === 'narrow'`.
6. The golden width is 1100 (`golden.js`), so every roll golden draws the two panes and
   the page head. A narrow state needs a `width: 360` field on its inventory entry
   (`inventory.js` 962-1014 use it).
7. `help.ts`: `Help.button` is set only for the catalog. The std help holds a lead
   paragraph, a paragraph whose tail is four `rarityLine`s, and a closing paragraph.
8. `SECTION_LABEL['roll/alt']` is `alt` («Альт. таблицы»); `sectionLabel` feeds the tab
   title (`Shell.svelte` 120-133) and the `/account` start-section option
   (`AccountPage.svelte` 291). `alt` also names the tables group chip and stays.
9. `AddToList` measures room against `.card` and `.modal-card`; outside both it measures
   the window and its base CSS opens upward. `tests/app/inventory.js` presses «Справка»
   at 469, 622, 687, 700 and 780 and «Открывать при запуске» at 495 and 2810.
10. About 34 `_roll_*` goldens and the five `_account*` goldens draw a roll page or the
    option label (`git ls-files tests/app/snapshots`).

## Files expected

| Step | Files |
|---|---|
| S1 | `app/src/lib/dict.ts`, `help.ts`, `icons.ts`, `lib/roll.ts`, `lib/i18n.test.ts`, `lib/help.test.ts`, `lib/roll.test.ts` |
| S2 | `OrGrid.svelte`, `orGrid.test.ts` |
| S3 | new `MoreMenu.svelte`, `PinItem.svelte`, `HelpItem.svelte`; `PickRow.svelte`, `TablesPage.svelte`; `pickRow.test.ts`, `tables.test.ts` |
| S4 | `RecordCard.svelte`, `RecordActions.svelte`, `record.test.ts` |
| S5 | new `RollResult.svelte`, `rollResult.test.ts` |
| S6 | new `RollSelect.svelte`, `rollSelect.test.ts`; `DiceBar.svelte` |
| S7 | new `RollPage.svelte`, `rollPage.test.ts` |
| S8 | `StdPanel.svelte`, `AltPanel.svelte`, `RollPanel.svelte`, `PickerRollPanel.svelte`, `std.test.ts`, `alt.test.ts`, `roll.test.ts` |
| S9 | `a11y.test.ts` (`COVERED`); the component tests that name a moved control |
| S10 | `tests/app/states.js` (cases 83, 89, 90 and the adapted ones), `inventory.js`, `hues.js`, `typo.js` if a read breaks, `sweep.js` (label only), about 50 goldens |
| S11 | `tools/artwork/lib.mjs`, `tools/artwork/lib.test.mjs`, `docs/artwork.md` |
| S12 | `FEATURES.md`, `COVERAGE.md`, `DESIGN.md`, new decision file, `docs/DECISIONS.md`, `tools/bundle-budget.mjs`, `.claude/README.md` |
| S13 | `handoff.md` (the Impeccable outcome) |
| S14 | none (gates) |
| S15 | `issues/57/mocks/5/built/`, `handoff.md` |

## Steps

### S1. Strings, help and the tab title

In both languages of `dict.ts`, same keys, ASCII punctuation:

| Key | RU | EN |
|---|---|---|
| `rollHead` | Бросок %s | Roll %s |
| `rollPair` | %a и %b | %a and %b |
| `setUp` | Настроить | Set up |
| `hopeLetter` | Н | H |
| `fearLetter` | С | F |

- `rollLabel` in `lib/roll.ts`: a range that is no die reads `` `${t.roll} 1-${max}` ``. Update
  `roll.test.ts` and the comment above it. Remove `randomIn` if `git grep -n randomIn` finds no
  other reader.
- `SECTION_LABEL['roll/alt']` becomes `'pageAlt'` (2-N5). `modeRow.test.ts` and
  `i18n.test.ts` read the map and stay green. The nine `_roll_alt*` and five `_account*` goldens move.
- `icons.ts`: add `tune` (three sliders, Material Icons "tune", Apache 2.0, as `search` was added in
  batch 2). It is the icon of «Настроить» (M5-9: not the filter funnel).
- `help.ts`: set `button` on the nine helps per L12. Trim the std help to the book's four placement
  lines (Q5.1): four paragraphs, each a `lead` (the rarity word) and its places, RU and EN; drop the
  lead paragraph, the "how many dice" sentence and the closing paragraph. Delete `rarityLine` and `BR`
  if nothing else uses them (`git grep -n -E "rarityLine|\bBR\b"`). Update `help.test.ts`.
- Do not touch `rollNo`, `sendAll`, `copyRoll`, `notFound`.

### S2. `OrGrid`

- Wrap the grid in `<div class="orwrap">` with `container-type: inline-size`. Replace the
  `@media (max-width: 860px)` block by `@container (max-width: 640px)` with the same body. One
  card, two cards and four cards behave as today above 640 px.
- `orGrid.test.ts` (N2): the raw snippet draws `<img src="a.webp" alt="" data-id=...>`, so the
  detector reports no `broken-image`. The node-identity assertions stay.

### S3. The three extractions

Read the shipped `PickRow.svelte` and `TablesPage.svelte` first.

- `MoreMenu.svelte`: props `app`, `id`, `up?`, `label?` (the button's `aria-label`),
  `children: Snippet<[() => void]>` (called with `close`). It draws the `morewrap` span
  (`position: relative; display: inline-flex`), `<Button size="md"|"sm" haspopup expanded controls bind:el>`
  with `<Icon name="more" />{t.moreMenu}` (a `size` prop, default `'md'`), and, while open, `<Menu cls="recmenu"
  label={t.moreMenu} {up}>` around the snippet. `close()` sets the flag false and focuses the button
  (rule 20). `PickRow` calls it and loses its copy; its `.recmenu` CSS moves with it.
- `PinItem.svelte`: props `app`, `home?`, `onpicked`. The item is `<button role="menuitem" tabindex="-1">`
  with `Icon check|home` and `t.homeOn|homeHint`; the press calls `onpicked()` then `app.pinHome(home)`.
- `HelpItem.svelte`: props `help: Help`, `open: boolean`, `ontoggle`, `onpicked`, `t`. The item has
  `Icon help`, `aria-expanded`, the label `help.button ?? t.helpHint`.
- `TablesPage` uses the two items and loses its inline copies. Its DOM, its `morebtn` and its goldens
  do not change.

### S4. The face and the share size

`RecordCard.svelte`: the `variant` type gains `'face'`. The markup does not change: the same head order
(`CARD_HEAD_SHA256` stays), the same body. Only CSS. The name is a link (as `compact`); the picture is the
`card-media` button that opens the dialog. CSS, after the `compact` rules and before the dossier block:

```css
.card.face { flex-direction: column; position: relative; }
.card.face .card-media {
  width: 100%; aspect-ratio: 4 / 3; cursor: zoom-in;
  -webkit-mask-image: linear-gradient(180deg, #000 72%, transparent);
  mask-image: linear-gradient(180deg, #000 72%, transparent);
}
.card.face .card-body { margin-top: -26px; position: relative; padding: 0 14px 12px; gap: 7px; }
.card.face :global(.badge.num) { position: absolute; top: 10px; right: 10px; z-index: 1; }
@media (hover: hover) { .card.face .card-media:hover img { transform: scale(1.05); } }
@media (max-width: 600px) {
  .card.face { flex-direction: row; align-items: flex-start; }
  .card.face .card-media { width: 96px; margin: 10px 0 10px 10px; border-radius: 8px;
    -webkit-mask-image: none; mask-image: none; }
  .card.face .card-body { margin-top: 0; padding: 10px 12px; gap: 4px; }
  .card.face :global(.badge.num) { display: none; }
}
```

The numbers are the mock's (`ua.css` 1003-1037 and `R/r.css`); tune them to the offsets of "First-screen
rows". The name keeps `--t-title`; at 600 px and below it keeps `--t-control`. Read `Badge.svelte` for the
class that `cls="num"` draws and fix the `:global` selector to match. The `compact` rules stay untouched.
The artwork guard of S11 follows.

`RecordActions.svelte`: row `share` gets `size?: 'md' | 'sm'` (default `'md'`), passed to its `Button`.

### S5. `RollResult.svelte`

Props: `app`, `index`, `it`, `col?`, `rollLabel?`, `onopen`. It replaces the three `cardOf` bodies.

```svelte
<div class="dealt">
  <RecordCard variant="face" {it} {index} lang={app.lang} {col} {rollLabel}
    artBroken={app.artBroken(it.id)} onartfail={(bad) => { app.markArtBroken(bad); }} {onopen} />
  <div class="resacts" role="group" aria-label={nameOf(it, app.lang)}>
    <AddToList {app} key={it.id} ids={[it.id]} size="sm" />
    <RecordActions {app} {index} {it} row="share" size="sm" />
    <MoreMenu {app} id="roll-more-{it.id}" size="sm">
      {#snippet children(close)}<RecordActions {app} {index} {it} row="menu" onpicked={close} />{/snippet}
    </MoreMenu>
  </div>
</div>
```

`.dealt` is a column with an 8 px gap; `.resacts` is a flex row, 6 px gap, `AddToList`'s root takes
`flex: 1` (the mock: the first button grows). Ids in the `id` are unique per card; a card can come twice
(Std pool: no; Alt: the same record in two columns can repeat), so the id also takes the slot:
`roll-more-{it.id}-{col ?? 0}`. `AddToList` opens upward (its base rule) and measures the window; nothing
is added for it. «Печать» is not on a roll result. The group's name is the record's name, so a reader hears
it before «В список».

### S6. `RollSelect` and `DiceBar`

`RollSelect.svelte`: props `label`, `value`, `options: readonly { id: string; label: string }[]`,
`onchange(id)`. Markup:

```svelte
<label class="pick">
  <span class="pk">{label}</span><span class="pv">{current?.label}</span><Icon name="chevron" />
  <select {value} onchange={...}>{#each options as o (o.id)}<option value={o.id}>{o.label}</option>{/each}</select>
</label>
```

`.pick` is a 40 px plain-button look (`--surface`, 1 px `--line2`, `--r-sm`), the caption `--t-label` in
`--muted2` over the value `--t-control`; the select is `position: absolute; inset: 0; opacity: 0; font-size:
16px`. The ring is `.pick:has(select:focus-visible)` with the global ring's values (read `tokens.css`). It
takes `min-width: 0` and `flex: 1 1 auto`, so a long label cuts with an ellipsis before the roll button.

`DiceBar.svelte`: keep the file and the class `.dicebar` (browser suites read it). New markup: a
`role="group" aria-labelledby` wrapper with a `<span class="lbl">{rollWord}</span>` (drawn from 761 px,
visually hidden up to 760 px), then the five buttons `<button class="die">` with `<span class="d"><Die
faces={12} />{n}d12</span><small>{caption}</small>`. No `primary` class, no gold gradient: plain look as the
shared `Button` plain. The caption joins the rarities with ` - `. The `title` keeps `{rollWord} {n}d12 - {caption}`.
CSS (the mock, `ua.css` 525-545 and 954-1002):

- up to 760 px: `display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px`; each die
  `grid-column: span 2`, the fourth and fifth `span 3`; two lines, `min-height: 50px`; the die icon hidden;
  the caption `--t-label`, centered.
- from 761 px: one column, each die a row of 46 px: icon, `1d12`, caption.

The `Die` icon keeps its own silhouette (DESIGN.md "Icons").

### S7. `RollPage.svelte`

Props: `app`, `index: Index | null`, `title`, `sub`, `help: Help | null`, `rolled: string`, `lit?: string`,
`copy?: (() => void) | undefined`, `empty?: string | undefined`, and the snippets `controls`, `settings`,
`results: Snippet<[(r: Record_) => void]>` (it gets `openRecord`). Local state: `cfgOpen`, `helpOpen` (page
memory; not rows of `STATE.md`).

```svelte
{#if narrow}<h1 class="vh">{title}</h1>{#if sub}<p class="vh">{sub}</p>{/if}
{:else}<PageHead {app} {title} {sub} {help} />{/if}
{#if empty}<NoData>{empty}</NoData>
{:else}
  <RecordHost {app} {index}>
    {#snippet children(openRecord)}
      <div class="rp">
        <div class="rp-ctrl" class:plate={!narrow}>
          {@render controls()}{#if !narrow}{@render settings()}{/if}
        </div>
        <div class="rp-res">
          <div class="reshead"> <h2>{t.rollHead.replace('%s', rolled)}</h2> ...the narrow or the wide tools... </div>
          {#if narrow && help && helpOpen}<HelpBox {help} />{/if}
          {#if narrow && cfgOpen}<div id="rp-set" class="plate">{@render settings()}</div>{/if}
          {@render results(openRecord)}
        </div>
      </div>
    {/snippet}
  </RecordHost>
{/if}
```

- `narrow = app.band === 'narrow'`. The `h1` is always in the DOM (rule 7: a heading in every state, `empty`
  included).
- The tools of the results line. Narrow: `Button size="sm" variant={lit ? 'toggle' : 'plain'} expanded={cfgOpen}
  controls="rp-set" caret` with `Icon tune` and `{lit || t.setUp}`; then `MoreMenu` («Ещё») with, in this order,
  «Скопировать все варианты» (when `copy`), `PinItem`, `HelpItem` (when `help`). Each item calls `close` first.
  From 761 px: a `Button size="sm"` `Icon copy` `{t.copyRoll}` when `copy`; the pin and the help are in `PageHead`.
- `.rp`: one column; from 761 px `grid-template-columns: 320px minmax(0, 1fr); gap: 22px; align-items: start`.
  `.plate` is the shared `Panel` look. Up to 760 px the controls have no plate (`ua.css` 519-524).
- Spacing up to 760 px: `main`'s top padding 6 px for a page that holds `.rp` (a `:global(main:has(> .rp))`
  rule; read how `TablesPage` reached 234 and reuse it), `.rp-ctrl` margin-top 4 px, `.reshead` margin 4 px 0,
  min-height 28 px, `h2` `--t-control` weight 700 (the mock's final values, `ua.css` 1086-1097).
- `copy`, the results block and the `data-primary` element stay in the panels. The `results` block keeps
  `role="status" aria-live="polite"`; the heading line is outside it.
- A band change: `cfgOpen` and `helpOpen` reset when the band leaves `narrow`; a lost focus goes to the results
  line's first control (as `TablesPage`'s `seenBand` effect does).

### S8. The panels

- `StdPanel`: `rolled = String(n)`. `controls`: `DiceBar`. `settings`: the number field (`Field`, as today),
  then the Source and Type `ChipRow`s with `Chip neutral` while every chip of the row is on (L7). `lit`: the
  value left on: one row narrowed gives that value's label (`t.srcCore`, `t.srcHnf`, `t.fItems`, `t.fCons`); two rows
  narrowed give `` `${t.setUp} · 2` ``; none gives `''`. A small pure helper `narrowedLabel` in `lib/std.ts` (a unit
  test). `copy`: `choice ? () => void copyRoll(choice) : undefined`. `results`: `.results` with `OrGrid` and the
  new `RollResult` snippet.
- `AltPanel`: `rolled = t.rollPair` with the two dice. `controls`: narrow, a row of `RollSelect` (label
  `t.rarity`, five options) and the primary `Button` «Бросить кости»; from 761 px, the `ChipRow` of rarities (neutral
  pressed on the chosen one, no `sub`; delete `tierCaption`) and the same button. `settings`: the two dice fields,
  each label gets a round letter badge (`hopeLetter` / `fearLetter`, hue by die, text visible; C23) beside the
  existing label, then the Type chips. `lit`: the Type row as above. The crit plate and its links keep their code;
  it sits first in `.results`. `Chip sub` has no caller left: delete the prop if `git grep -n "sub=" app/src` agrees.
- `RollPanel`: `rolled = String(n)`; `empty = t.noData` when `max === 0`. `controls`: the `picker` snippet (a
  `RollSelect`) if the caller passed one, then the primary roll button. `settings`: the number field. `lit`: `''`.
  `results`: one `RollResult` inside `{#key shown.it}`; the wide card is capped at 380 px
  (`grid-template-columns: minmax(0, 380px)`, the mock's `.hand2.one`).
- `PickerRollPanel`: the `ChipRow` goes; the picker snippet is a `RollSelect` over `parts`. The part resets the roll
  to 1 as today (`pickerValue`).
- All four: `help={helpFor(...)}` as today; the `.results`, `.resbar` and `.numrow` leftovers go from each file's CSS.

### S9. Unit tests and the `COVERED` list

`a11y.test.ts` `COVERED` gains `RollPage.svelte`, `RollResult.svelte`, `RollSelect.svelte`, `MoreMenu.svelte`,
`PinItem.svelte`, `HelpItem.svelte`, each with the test file that ends in `expectNoA11yViolations`. See "Tests".
Every new file is reached by a test (`COVERAGE.md`: a per-file threshold).

### S10. Suites and states

`tests/app/states.js`:

- Case 83: `limit = width === 360 && row.exception ? row.exception : 0.4 * got.vh`; the log line shows the
  exception. Rows per L16: `#/roll/std` becomes `{ shipped: true, exception: 325 }` and the four new rows are
  `shipped: true`. Per section 14, a measured value past 325 is logged in `handoff.md` and in the AFK decisions
  file, and the limit takes it.
- Case 89 (new; the next free number after batch 4's 88), "the roll page layout holds at 320 to 1180 px":
  1. 761x768, RU and EN, on `#/roll/alt`, `#/roll/std` and `#/roll/vault_of_ages`: the `h1`, the pin and the help
     button have tops within 2 px of each other (one line), none wraps, `scrollWidth <= clientWidth` (F1).
  2. 760x800, 390x844, 360x640, 320x568: the `h1` rect is at most 1 px wide, no `.homebtn` or `.helpbtn` shows in
     `main`, the results line holds «Бросок N», «Настроить» and «Ещё» inside 0..width and on one line (at 320 the
     line may wrap once: then «Ещё» stays visible).
  3. «Ещё» opens a `role="menu"` of the pin and the help (and the copy on std and alt); a press closes it and the
     focus returns to «Ещё»; Escape closes it.
  4. 360x640 `/roll/std`: the dice are two rows (the top of the fourth die is below the first's), each at least
     44 px tall, inside 0..360, no caption cut (`scrollWidth <= clientWidth`).
  5. The face flips at 600/601 px: at 600 the first card's picture is 96 px wide and the number badge has
     `display: none`; at 601 the picture is the card's width and 4:3 and the badge is drawn at the picture's top right.
  6. `/roll/many_worlds_tavern` and `/roll/vault_of_ages` at 360: the select, the roll button and the results line sit in
     the first 256 px band; the longest realm and section names do not cut the roll button off.
- Case 90 (new), "the result row and its menus": at 360x640 and 1180x720 on `/roll/std` as gm4 (account lists):
  the row holds three labeled controls inside the card's width; «Ещё» of a card opens a menu with the copies that
  stays inside the window; a copy closes it and returns the focus to that «Ещё»; the add-to-list menu of the first card
  stays inside the window and below the header; with 150 lists (`d.accountLists`) it scrolls and keeps «+ Новый список»
  in view; at 1180 the menus are not clipped by the card.
- The adapted cases (read each, `git grep -n -E "roll/|dicebar|\.results|Справка|Открывать при запуске|Бросить" -- tests`):
  14 and 1863 (`.results .card-media img`, `.card.compact .card-media`: the selector is `.card.face .card-media`),
  21 (`.dicebar button` keeps its class), the pin cases near 2150 and 3019, 3085 (the account menu on `/roll/std` at 360
  is unchanged), `typo.js` 113-119 (the `help` press names). A press of the pin or the help at 360 uses `d.more(name)`
  (batch 4's helper: the first «Ещё» on the page is the results line's, which comes before every card's).
- `inventory.js`: presses at 469, 622, 687, 700 and 780 use the new help names; 495 stays (1100 px draws the head).
  The new states of "Goldens and new states".
- `tests/app/hues.js` 119-156: on `/roll/std` the five `.dicebar button` share one look and none is `.primary`; every other
  mode keeps exactly one `button.btn.primary:has(.dieicon)`.
- `tests/app/sweep.js`: line 97's label reads `альтернативные таблицы` (a log word); no page is added.

### S11. The artwork guard

`tools/artwork/lib.mjs` `REVIEW_ART_SIZES` gains `{ label: 'roll card face', px: 380, dir: 'img/', radius: 0, file:
COMPONENTS + 'RecordCard.svelte', selector: '.card.face .card-media', declarations: ['aspect-ratio: 4 / 3'] }` (the 380 px is
the two-pane width of one card at 1180 px; the review page draws the whole picture, so it overstates the height, which
`handoff.md` says). The 132 px and 96 px rows stay (`ListPage`). Read `tools/artwork/review/review.mjs` 214 for how `px` is
drawn. `docs/artwork.md` line 359 names the new size. `node --test tools/artwork/lib.test.mjs` passes; `CARD_HEAD_SHA256`
does not change (the head is untouched). If it does, set it as batch 4 did.

### S12. Prose, in the same commit

`FEATURES.md`:

- "Rolling": a layout paragraph (the nine pages share one layout; the two bands; the results line; the face and its 600 px
  step; the action row); the dice paragraph (two rows up to 760 px, a list from 761 px, plain buttons, no gold); the pickers
  as selects and the rarity chips; "reads «Бросить 1-N» where it is not a die"; the help button names (L12); the copy button
  is on the results line from 761 px and in «Ещё» up to 760 px.
- "Chrome": the pin and the help lines drop "until their page's batch moves it" for the roll pages: up to 760 px both are in
  «Ещё», and the `h1` is read, not drawn; the tab title of `/roll/alt` is «Альтернативные таблицы».
- "Records": the roll card line (a result has the add control, «Поделиться» and «Ещё»; the copies are in «Ещё»); the hover zoom
  line names `compact` and `face`.

`COVERAGE.md`: the rows of the new tests, `roll.test.ts`, `std.test.ts`, `alt.test.ts`, `orGrid.test.ts`, the `app/states` row
(cases 83, 89, 90), the count of states and cases. `STATE.md`: no change (`git grep -n cfgOpen -- docs/specs/STATE.md` is empty).

`DESIGN.md`: see "DESIGN.md rules this batch writes".

Decision file `docs/decisions/<date>-the-roll-pages-share-one-layout-and-results-draw-the-card-face.md`:

```markdown
# <date> - The roll pages share one layout, and a result is a card face with its own row

- Task: `57` (the owner's mock 5 and its reviews, 2026-10-29; the AFK defaults of the batch 5 refresh).
- Decision: the nine roll pages draw `RollPage`: up to 760 px a read-only `h1`, the controls, one results line with «Настроить» and «Ещё»; from 761 px two panes. A result is `RecordCard variant="face"` with `RollResult`'s row under the plate. The pin, the help and the copy of every option are items of «Ещё» up to 760 px. A choice among parts is a native select.
- Rejected: the mock's hidden duplicate DOM (every id twice); a restyled `compact` (it reshapes the list page in another batch); a custom listbox for the pickers; dropping the «ИЛИ» separators (nothing else says the cards are alternatives); a «Все» chip over the source and type toggles (it changes the model and the last-source rule); a lit die (a roll button is not a choice).
- Accepted trade-off: the open select is the browser's own list; `/roll/std` at 360 is 325 px to its first result (the owner's named exception); the results have no «Печать».
```

Budget: after the measured totals, `tools/bundle-budget.mjs` and `.claude/README.md` rise by the standing rule of the file (see
"Verification" 6). Name the figures and the reason in the comment.

### S13. Impeccable

The orchestrator runs `polish` and `harden` on `RollPage`, `RollResult`, `RollSelect`, `DiceBar` and the face at 360 and 1180 px
and `handoff.md` gives the outcome. Fallback: `impeccable:impeccable-finish-reviewer`.

### S14. Gates

See "Verification".

### S15. Evidence

`issues/57/mocks/5/built/shoot.js`, from `mocks/3b/built/shoot.js`: at 360x640 and 1180x720, RU and EN: `/roll/std` (closed,
«Настроить» open, «Ещё» open, a card's «Ещё» open, items only), `/roll/alt` (and a crit), `/roll/vault_of_ages`,
`/roll/wondrous_environments`, `/roll/many_worlds_tavern`; plus 761x768 for `/roll/alt` RU and EN. The set is evidence, not a gate.

## Acceptance criteria

Each line is observable in a suite, a unit case or the built app. `plan.md` section 7 "Batch 5" and "Each of batches" are
first; F1's lines and 2-N5 follow.

- Q5.1: the std help button reads «Где какая редкость» / "Where each rarity is"; its box holds the four placement lines and
  nothing else (`help.test.ts`, the `~ help` golden).
- N2: `orGrid.test.ts` draws its `<img>` with a `src`; the detector reports no `broken-image` there.
- Dice at 360 (owner, "Roller dice at 360", variant A): five dice in two rows, 3 + 2, each with its rarities; none is gold or
  lit; from 761 px a list under the label «Бросить» (case 89 item 4, `std.test.ts`).
- `/roll/std` at 360 is the named exception: `exception: 325`, asserted at 360 and at the rule at 1180 (case 83, RU and EN);
  the other eight modes keep the rule (256 at 640, 288 at 720): rows `#/roll/alt`, `#/roll/alt ~ crit`, `#/roll/voa`,
  `#/roll/wondrous` are `shipped: true`; the offsets are in `handoff.md`.
- M5-7: a result at 360 is the 96 px card; from 601 px it is the face (case 89 item 5, `record.test.ts`); DESIGN.md "Cards" says so.
- N2-2: the nine help buttons carry the names of L12 in both languages (`help.test.ts`, the five `~ help` goldens); Vault of Ages
  keeps its panel.
- The roll cards draw no «Daggerheart» (verified: `git grep -n Daggerheart -- app/src/components/RecordCard.svelte
  app/src/components/RollResult.svelte` finds nothing); noted in `handoff.md`.
- M2-2 and R2-1: up to 760 px the pin and the help are items of «Ещё» and the roll inputs are in «Настроить» (case 89 items 2 and 3,
  `rollPage.test.ts`); the `h1` is read, not drawn, on all nine pages (`rollPage.test.ts`: one `h1` named by the page, `vh`).
- Up to 760 px no roll page draws the `h1`, the pin or the help button in the head (case 89 item 2, at 760, 390, 360 and 320).
- F1: from 761 px the `h1`, the pin and the help button of the longest pair share one line at 761 px in RU and EN
  («Альтернативные таблицы» with its help button, «Обычные правила» with «Где какая редкость»; case 89 item 1). If the line
  wraps at 761, `PageHead` gets `flex-wrap: nowrap` and `.page-h { min-width: 0 }` for that range, and `handoff.md` names it.
- `FEATURES.md` "Chrome" names the read-only `h1` range (S12).
- 2-N5: the `/roll/alt` tab title and its `/account` option read «Альтернативные таблицы» / "Alternate tables"; the tables group chip
  still reads «Альт. таблицы» (`i18n.test.ts`, `tables.test.ts`, the nine `_roll_alt*` and five `_account*` goldens).
- C23: each die field has a round letter badge and its label, not a hue alone (`alt.test.ts`). C24: the roll button is the first
  control of `/roll/alt`; the manual entry sits under it or in «Настроить»; no tier line on a rarity chip. C25: no gold chip or die on
  `/roll/std` while nothing is narrowed (`std.test.ts`, `hues.js`). C26: the «ИЛИ» separators stay and the heading reads «Бросок N» with no
  instruction (`orGrid.test.ts`, `std.test.ts`). C36, P10: the dice do not wrap raggedly at 360 or 320 (case 89 item 4). C38, C39, P11: a
  result title at 360 has at least one word per line and no break inside a word (case 89 item 6: the longest title of Vault of Ages,
  section «Проклятые предметы», and of Many Worlds Tavern at 320 and 360). C41: gone with the tier line. C43: the Hope and Fear
  badges keep word and hue. C49: Many Worlds Tavern draws one picker and one gold primary; the realm is named in the result's source badge.
- M5-4 holds as shipped: with both kinds on the critical plate has two labeled table links, with one kind on a general one
  (`alt.test.ts`, the three `~ crit` goldens).
- M5-6 (L7): with a row narrowed the closed «Настроить» is lit and names the value; with two rows narrowed it reads «Настроить · 2»
  (`std.test.ts`, `~ items only, 360`).
- N5-2 (L13): «Бросить 1-30» on a range that is no die (`roll.test.ts`).
- Every state that opens or presses something and is new has an inventory entry, a RU and EN golden and an axe case (see "Goldens and
  new states").
- Focus (rule 20): a pressed item of the results line's «Ещё» or a card's «Ещё» returns the focus to its «Ещё»; Escape closes only
  the menu (`rollPage.test.ts`, `rollResult.test.ts`). The header freezes while a menu is open (case 86 passes).
- Error states: no index draws the `h1` and `NoData`, nothing else (`roll.test.ts`); a failed copy or share toasts as before.
- The three extractions leave `TablesPage` and `PickRow` with the same DOM: no `_tables_*` or `_i_*` golden moves for them
  (`git diff --stat tests/app/snapshots`).
- Each new component has an axe case in `a11y.test.ts` and is reached by a test.
- The artwork guard passes with the new row (S11); `docs/artwork.md` names the size.
- Specs, DESIGN.md rules and the decision file of S12 match what ships; `COVERAGE.md` rows agree.
- From "Each of batches 2-9": the detector line, American spelling in new prose, the screenshot set in `mocks/5/built/`, the `polish` and
  `harden` outcome, `routes.json` unchanged.
- The bundle budget is raised by the standing rule with the measured figures; the reason is in the file.
- The gates pass and CI is green on the pushed tip.

## First-screen rows (plan section 14)

| Row | 360x640 (limit 256) | 1180x720 (limit 288) | Flag |
|---|---|---|---|
| `#/roll/std` | the mock 323, the exception 325 | the mock 234, with the lead line about 275 | `shipped: true`, `exception: 325` |
| `#/roll/alt` | the mock 245 | the mock 234, about 275 | `shipped: true` |
| `#/roll/alt ~ crit` | the plate's top, the mock 245 | about 275 | `shipped: true` |
| `#/roll/voa` | the mock 245 | the mock 231, about 271 | `shipped: true` |
| `#/roll/wondrous` | the mock 246 | the mock 231, about 271 | `shipped: true` |

The "about" figures add the lead line (L10: about 21 px of text and 18 px of margin) to the mock, which drew none. They pass the limit and miss
the 270 target by 1 to 5 px. If a built value passes the limit, log it in `handoff.md` and name the fix: hide the lead from 761 px too. That removes visible text, so the
orchestrator logs the choice in the AFK decisions file and the owner may reverse it. Do not move a limit without the log. The state ids are inventory ids; `#/roll/voa` and `#/roll/wondrous` read their first result at the opening value (row 1).

## Goldens and new states

About 50 existing goldens move: the 34 `_roll_*`, the five `_account*` (the option label), and the states that open a record over a roll
(`_roll_wondrous_modal`). A moved file outside those families is a defect to read, not to re-seed: especially `_tables_*`, `_i_*`, `_lists_*`.
The re-seed runs the four shards.

New inventory entries (a state keeps both languages in one file; `width: 360` where named):

| State id | Width | Entry |
|---|---|---|
| `#/roll/std ~ set up` | 360 | press «Настроить»: the manual entry, Источник, Тип in a plate |
| `#/roll/std ~ more` | 360 | press «Ещё» of the results line: copy, pin, help |
| `#/roll/std ~ items only, set up` | 360 | press «Настроить», press «Расходники» (consumables off), press «Настроить» again: the closed control is lit and names «Предметы» |
| `#/roll/alt ~ narrow` | 360 | `/roll/alt`: the select and the primary on one row, the dice letter badges are in «Настроить» |
| `#/roll/wondrous ~ narrow` | 360 | the single card at 96 px, the row under it |
| `#/roll/std ~ card more` | default | press «Ещё» of the first card: the four copies |
| `#/roll/std ~ list menu as gm4` | default | press «В список» of the first card with the account lists |

`#/roll/std ~ help`, `~ items only`, `~ one source` and the other existing states keep their ids; their `why` and `enter` change only where
the help button's name did. Seed the new files with the shard run; do not edit a golden by hand.

## DESIGN.md rules this batch writes

- "The Roll Page Rule" (new, "Layout"): the nine roll pages share one layout. Up to 760 px: a read-only `h1`, the controls, one results line
  («Бросок N», «Настроить», «Ещё»); the pin, the help and the copy of every option are items of «Ещё». From 761 px: the head with the labeled
  pin and help, a 320 px control pane, the results. The roller has one gold primary at most; a die is plain.
- "Cards": the `face` bullet (the picture 4:3 with a fade, the body drawn over its foot, 96 px beside the text up to 600 px; the action row
  under the plate because a popover cannot leave a clipped plate); the compact card's note says `ListPage` keeps it until 9b.
- "Badges": the roll number is drawn over the picture from 601 px and hidden up to 600 px (replaces "at 1180 only" of section 7).
- "Chips": the dice (plain, two lines, 3 + 2 up to 760 px, a list from 761 px) and the neutral pressed state of a row where every chip is on.
- "Shapes": the sentence of batch 4 about the 4:3 crop adds "and the roll card face".
- "The Two Breakpoints Rule": the 600 px list of grown targets adds "the roll card turns from a row into the face at 601 px".
- "The Same Label Rule": the interim note drops "the roller" from the pages that keep round buttons up to 760 px.
- "The First-Screen Rule": the `/roll/std` exception, 325 px at 360, owner, 2026-10-29, beside the rule's text.

## Tests

| File | Cases |
|---|---|
| `rollPage.test.ts` | the `h1` is in the DOM in both bands and in `empty`; narrow: no `PageHead`, «Бросок N» line, «Настроить» opens the settings with `aria-expanded`, «Ещё» holds copy, pin, help in order, a press closes it and returns the focus, Escape closes it; the help item opens the box; wide: `PageHead`, the copy button on the line, no «Настроить»; a band change resets the flags; `lit` renders the toggle look; axe in both bands |
| `rollResult.test.ts` | one group named by the record; three labeled controls in order; «Ещё» holds the copies in order, no image item without art; a press returns the focus; the add menu opens; no `Печать`; axe |
| `rollSelect.test.ts` | the caption and the value; a change calls `onchange`; the select is named by the label; axe |
| `std.test.ts` | the five dice and their captions, none `primary`; the count of chips neutral when all are on and gold when narrowed; `narrowedLabel` (none, one, two); the pool of two with one source off keeps the separator; a roll sets the field |
| `alt.test.ts` | the letter badges; rarity chips with no tier line from 761 px, the select up to 760 px; the crit plate with both kinds and one |
| `roll.test.ts` | «Бросить 1-N» for a non-die; the picker resets the roll; `empty` draws `NoData` and the `h1` |
| `orGrid.test.ts` | the `<img src>`; the cell keying; the separators stay for two and four |
| `record.test.ts` | the `face` variant draws the same head and body as `compact`; the name is a link; no `Actions` row without the snippet |
| `pickRow.test.ts`, `tables.test.ts` | the extractions: the same DOM, the same focus return |
| `lib/help.test.ts`, `lib/i18n.test.ts`, `lib/roll.test.ts` | the nine `button` names, the std help's four lines; parity with the five new keys; `sectionLabel('roll/alt')` |
| `a11y.test.ts` | the six new rows |
| `tools/artwork/lib.test.mjs` | the new size row |
| `tests/app/states.js` | cases 83 (the exception and the rows), 89, 90, the adapted cases |

## Verification

In this order, after S12. One command per call. A browser suite does not run locally (`plan.md` section 7, the writer's local gates).

1. While editing: `npx vitest run app/src/components/rollPage.test.ts app/src/components/rollResult.test.ts
   app/src/components/rollSelect.test.ts app/src/components/std.test.ts app/src/components/alt.test.ts
   app/src/components/roll.test.ts app/src/components/orGrid.test.ts app/src/components/record.test.ts
   app/src/components/recordHost.test.ts app/src/components/pickRow.test.ts app/src/components/tables.test.ts
   app/src/components/modeRow.test.ts app/src/components/shell.test.ts app/src/components/accountPage.test.ts
   app/src/components/a11y.test.ts app/src/lib/help.test.ts app/src/lib/i18n.test.ts app/src/lib/roll.test.ts
   app/src/lib/std.test.ts`, then `npm run lint:untyped` and `npm run lint:typed`. If a file name above is wrong,
   `git ls-files -- "app/src/**/*.test.ts"` gives the right one.
2. `node --test tools/artwork/lib.test.mjs`.
3. `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to 4, one at a time. Then `git diff --stat
   tests/app/snapshots`: only the families of "Goldens and new states" and the new files.
4. `node tools/decisions.js`.
5. `npm run check:built` (the unconfigured budget).
6. The configured budget: `npm run build` with placeholder `VITE_SUPABASE_*` values (this worktree has no `.env.test.local`), then
   `node tools/bundle-budget.mjs`. Raise both limits by the file's standing rule: the measured total rounded up to the next whole kB, never
   past 270 unconfigured and 350 configured, in the same commit as the reason, in `tools/bundle-budget.mjs` and `.claude/README.md`. Expected
   growth over batch 4's totals: +2.5 to +4.0 kB gzip (about +1.2 for `RollPage` and `RollResult`, +0.5 for `RollSelect`, +0.5 for the face
   and dice CSS, +0.4 for the strings, the rest the three small extractions; the std help trim takes back about 0.4). Batch 4 leaves about 256-257
   unconfigured and 313-314 configured, so expect 259-261 and 316-318. If the unconfigured total passes 266, `handoff.md` names it, because
   batches 6 to 10 need about 8 kB under the 270 ceiling; the batch does not raise a ceiling.
7. `impeccable detect --json --no-inline-ignores app/src`, and the spelling grep of batch 2's word list over the touched files and the new prose.
8. `rtk npm run check:fast` (Bash timeout 600000), last.
9. Commit, push, the CI credit. CI's `app/states` (case 83, 89, 90 and the adapted ones), `app/contracts`, `app/hues`, `app/typo`, `app/print`,
   `sweep.js` at 360, 390, 768 and 1180 and the `e2e` flows are the browser proof; a failing case there is a case to read against this brief.
   The batch review follows (trigger: new or changed UI; `tests/app/` changed).

## Risks and do-nots

- Do not change `compact`, `Actions.svelte`, `nameActions`, `sendAll` or `ListPage` (L2). If `ListPage` changes, a list golden moved by mistake.
- Do not render both bands' DOM at once (L1): the sweep reports a duplicate id, and an axe case reports two controls with one name.
- Do not draw a gold die or a lit die (L6) and do not add a «Все» chip (L7).
- Do not put the action row inside the plate (L3): `overflow: clip` cuts the popovers.
- Do not add a breakpoint: the pair is 760/761; 600 is the touch step. The `OrGrid` container query is one component's own measured problem.
- Do not write `{@html}` for the help or the heading. `rollHead` is replaced with `String.replace`, never injected.
- `RecordCard`'s head markup is not touched (`CARD_HEAD_SHA256`, `tools/artwork/review/review.mjs`).
- The first-screen numbers depend on Source Sans 3 line boxes and on the spacing of L15. The 360 rows have 10 px of room (245 of 256); the
  `/roll/std` exception has 2 px (323 of 325). Measure on the built page before the push; the CI run is the proof.
- A band change mounts the other layout. The page keeps `n`, the rarity, the dice, `app.source` and `app.kinds`; only `cfgOpen` and `helpOpen`
  reset. Do not store them.
- A native select cannot be golden-captured open; the closed state is the golden. Do not stub the select.
- The `Menu` of «Ещё» on a result opens down and right-aligned; on the last card of a page it can reach the footer. Accepted (a menu scrolls into view).
- A moved control makes a press throw on CI, not here. Search the whole `tests/` tree before the push (S10).
- `FilterBar`, `BatchBar`, `KeepNote` stay. `PageHead` is unchanged.
- Review order: `RollPage.svelte`, `RollResult.svelte`, `RecordCard.svelte`, `DiceBar.svelte`, `RollSelect.svelte`, `MoreMenu.svelte`, the three panels,
  the suites, the prose.

## Standing checks for batch 5

1. Scale. The batch adds no collection and no cap. A roll draws up to four cards (a constant of the roll, not a limit row); a part list has up to
   ten options (communities); a list menu holds the account's lists (limit 50, 3x is 150).

   | State | Shows | Proof |
   |---|---|---|
   | Four results (std, both sources and kinds), two (one source or kind off), one (one source and one kind) | two columns with separators from 641 px of results width; one column below; one card has no copy button and no separator | `~ one source`, `~ items only`, `std.test.ts`, case 89 |
   | Alt: four, two, a crit | the plate first; the crit plate keeps both links | `~ crit` goldens, `alt.test.ts` |
   | One result (the seven single modes) | one card, at most 380 px wide from 761 px | `#/roll/wondrous` and `~ narrow` goldens |
   | No account lists, one, 50, 150 (3x) | the add menu of a result: the empty line, one chip, a search from 8 and a scrolling list; head and «+ Новый список» in view | `~ list menu as gm4`, case 90 (150 at 360) |
   | Longest name and text | a catalog title wraps in the 96 px card at 360 and in the face at 1180; the badges wrap; nothing sideways | sweep, case 89, goldens of `~ artifacts` |
   | Longest option (a part or a realm) | the select cuts with an ellipsis; the roll button keeps its width | case 89 item 6 |
   | 360, 320 and 1180 px | each row above at 360 and 1180; 320 for the results line and the dice | case 89, sweep |

   At many and at the limit: the row order is the DOM order (add, share, more); the primary is the roll button, first under the mode row; the add menu
   is at most `min(60vh, 340px)`; with the on-screen keyboard open at 360x480 the new-list input stays above the keyboard as cases 79 and 42 measure.
   Sticky regions: none are new; the header hides on scroll (3b). The settings plate and the help box grow the page only.
2. Error scenarios. Loading: the index is read before the panels draw rows; no index draws the `h1` and `NoData` (`RollPanel`) or the controls with no
   results (`StdPanel`, `AltPanel`, as today). A failed read: the existing no-data path. A failed write: a copy or a share failure toasts as before, the menu
   is already closed and the focus is on «Ещё»; «В список» refusals are `AddToList`'s own. Offline: the copies fall back as today. A conflict: none, the page
   stores nothing but the pin; the pin is the existing `app.pinHome` write and a second tab's pin wins by `localStorage` as today. A named record deleted: a
   rolled record leaves the index only with a new data build; `RecordHost` closes its dialog. A stale tab: nothing is stored beyond the pin, so the old
   bundle draws its old page until a reload. A revert: nothing new is stored. No path can lose stored data.
3. Consistency. Rules of `FEATURES.md` "Consistency rules" followed: 4 (one name: the lit mode chip, the heading, the tab title and the start-section option
   read «Альтернативные таблицы»), 5 (the copy toasts keep their words), 7 (a heading in every state: the read-only `h1`), 9 (the primary is the first control:
   the roll button, or the dice), 14 (RU and EN with the same facts), 16 (long names wrap), 17 (links from the same functions), 20 (focus returns to «Ещё»).
   Departures named: no gold die (L6), no «Все» chip (L7), a native select (L8), the «ИЛИ» separators kept against the mock (L5), the copy label (L9), the lead line
   (L10). Compared with the siblings: the catalog's narrow head puts «Ещё» on its picker row, the roll page puts it on the results line because the mode row
   already names the page; both are the same `Menu` and the same pin and help items. The result row has the same three labels as the record page's row
   (batch 4), without «Печать» and «Изменить». The list page's roll result keeps «Отправить» until 9b; `/s/` is unchanged; toasts, load wording and the
   selection bar do not change.
4. RU/EN parity: the five new keys have both languages, the same facts, no plural form, ASCII punctuation, «ёлочки» in RU only; the nine help button names are
   in both; `rollHead` and `rollPair` keep the number first in both; `randomIn` goes from both; cases 89 and 90 run in both languages and the goldens hold both.

## Gate cost

Per `plan.md` section 8: one code batch is 45-60 minutes with its `check:fast`, one CI run and one review fix cycle. Extra local gates:

| Gate | Minutes |
|---|---|
| the affected vitest files (about 19) | 5-7 |
| `node --test tools/artwork/lib.test.mjs`, both lints, decisions, the detector | 4-5 |
| `build:test` and the four golden shards (about 50 moved files and 7 new) | 11-12 |
| `check:built` and the configured build with `bundle-budget.mjs` | 3-4 |
| the orchestrator's `polish` and `harden` | 5-10 |
| the screenshot set | about 4 |

Total: 32-42 minutes of extra gates (`plan.md` section 8 says 1 for this batch; the row under-counts). The plan total in section 8 rises by 31-41.
Browser suites, sweeps and the e2e flows run on CI (owner, "Local gates").

## Writer tests

Facts for the orchestrator's dispatch, not a model choice.

| Test | Answer |
|---|---|
| 1 (a step asks for a choice, or an `Open design question:`) | no: every choice is decided above |
| 2 (public contract, route, stored state, product law, migration, hook, configuration) | no for contract, route, state, law and migration; `tools/bundle-budget.mjs` rises under its standing rule |
| 3 (visual judgment: print fitting, a golden re-seed, parity with a design node) | yes: about 50 goldens re-seeded and a new face, two-pane and dice layout that rest on visual judgment; no design node |

## Split criterion

A different route and filter set (`/roll/*`), as `plan.md` section 7 gives. Everything inside shares one component set (`RollPage`, `RollResult`,
the three panels, `RecordCard`'s face), one seed set and one golden re-seed, so it is one batch (`CLAUDE.md`, "Task and session protocol": merge work that
shares a component, seed and filter). The three extractions ride here because the roll page is their second and third caller; a split would re-seed the
tables and record goldens twice.

## Plan review

Not required (no trigger fired): no migration or SECURITY DEFINER function; no public contract (`routes.json`, `CONTRACTS.md`, `llms.txt`, `tests/contracts.js`
and `docs/fixtures/` do not change; the `/roll/alt` tab title is no contract: `git grep` finds it in no spec or fixture); no stored data or `localStorage` key (the
pin write is the existing `app.pinHome`); no write or sync protocol. A batch review is required after the implementer (trigger: new or changed UI; `tests/app/`
changed).
