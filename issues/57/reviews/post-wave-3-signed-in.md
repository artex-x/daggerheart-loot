# Review - post-wave-3-signed-in (57)

Verdict: fix-then-continue
Reviewed: 450505946120eebd0135050082fad227d99e9d47
Scope: batch post-wave-3-signed-in

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Blind, signed-in review of the fixture build (`dist-test/`, served by `tests/app/serve.js`
through `tests/app/lib.js`, signed in by `?as=gm1..gm4`). Each probe ran as `node -` on
stdin, one headless Chrome at a time, closed after each probe. Free memory stayed between
1.6 GB and 2.4 GB. No suite, no vitest and no build ran. No plan, handoff, context, mock or
earlier review was read.

Build state: `dist-test/index.html` is from 2026-11-06 14:13:03 +0100. HEAD
(`45050594`, a merge) is from 14:50:28. The app changes after the build
(`git diff ca730999 HEAD -- app/`) are: `RecordCard.svelte` drops the 14 px rule for
`.card-name svg`, two EN strings in `dict.ts` and `help.ts`, and one comment in `tokens.css`.
None of them touches a surface in this scope, except the icon size in a card's name row (the
roll result card). I did not rebuild. The build is current enough for every finding below.

axe-core (with `color-contrast`) found 0 violations in every probed state: `/lists` (plain,
50 lists, the selection mode), the list page (closed, the share panel, the roll panel, the
requests panel, the notices, the selection mode, the open add-to-list menu, the import
panel), `/homebrew` and its tabs, the editor, `/account`, `/p/`, `/h/`, at 360 and 1180,
RU and EN. No route scrolled sideways at 360, 390, 768, 1000, 1180, 1440 or 1920.

## Blockers

**B1. The percentage field in «Цены выбранных» is named «Результат броска» / "Roll result".**
Route `/lists/<uuid>` (gm1, «Лавка кузнеца»), «Выбрать», «Выбрать все», «Цены». All widths,
RU and EN. The visible label is «Изменить на, %» / "Change by, %". The input has
`aria-label="Результат броска"` and no `<label>`, so a screen reader reads the wrong field
name (WCAG 2.5.3, 4.1.2). At 360 the same stepper is 110x32 px: «-» and «+» 28x30 px, the
input 52x30 px, under the 40 px floor (DESIGN.md, "The Phone-First Rule"). Source:
`app/src/components/ListPage.svelte`, the second `<NumberField>`:

```svelte
label={t.rollResult}
```

Fix: pass the percentage label (`t.repricePct` or a short name for it), and give the stepper
the thumb height up to 600 px. Blocking, local.

**B2. Controls under the 40 px thumb floor at 360 px on the signed-in surfaces.**
Each was measured with `lib.targets(page, { floor: 40, menuFloor: 44 })` at 360x640 in RU
and EN, or read from the element's box. DESIGN.md, "The Phone-First Rule"; FEATURES.md,
"Chrome" (owner, 2026-11-05).

| Control | Route and state | Box (RU / EN) | Likely source |
|---|---|---|---|
| Save status «Повторить» / "Retry" (`p.page-sub > button.linkbtn`) | list page, an edit while offline | 70x22 / 35x22 | `SyncStatus.svelte`, `.linkbtn` |
| Tick column (`label.lrow-pick`) | list page, the selection mode | 32 wide, 76-114 tall | `ListPage.svelte`, `.lrow-pick` |
| Take control «Мин» and the count field (`span.qgroup`) | list page, a ticked entry with a quantity over 1 | 44x38 and 48x38 | `PickQty.svelte` |
| Request line fold «и ещё 4 позиции», request fold «и ещё 7 запросов» | list page, 10 pending requests, panel open | 36 tall | `RequestsPanel.svelte`: the `@media` block sets `.more :global(.btn) { min-height: 36px }` |
| Notice «Скрыть» and «Скрыть изменения» | gm2's list, the panel open | 40x36 and 116x36 | the same rule (`.notice`, `.decided`) |
| Share link `/s/player-token-1` (`a.sharelink`) | list page, the share panel | 275x18 | `SharePanel.svelte`, `.sharelink` |
| «показать в таблице» (`a.itemtable`) | `/h/<id>` of an own item in «Хоумбрю» (513, 662) | 127x19 | `TableLink.svelte` |
| «Цены выбранных» stepper | see B1 | 28x30 | `ListPage.svelte` |

The `RequestsPanel.svelte` rule overrides the 40 px that `Button.svelte` already gives a
bare button, so deleting the three `min-height: 36px` lines can be the whole fix there. The
`a.itemtable` link passes on `/i/ci1` only because the harness reads a path line of 20 or
more characters as running text; it is a control after a path line, not a link inside a
sentence. FEATURES.md, "Account and browser lists" (the take line) still says «At 600 px or
less the control is 36 px tall», which contradicts the owner's 40 px rule (N7).
Blocking, local. `tests/app/sweep.js` and case 109 did not catch these states: the selection
mode, an open share panel, an open requests panel and a failed save are not in their walk.

**B3. The focus is lost after the save status «Повторить» succeeds.**
Route `/lists/<uuid>` (gm1), an edit of «Кол-во» while the fake is offline, then online and
«Повторить» / "Retry". At 360 and 1180, RU and EN, the button leaves with the save and
`document.activeElement` is `body`. FEATURES.md rule 20 asks for the control that takes its
place, else the group's lead control, else `#main`. Likely source: `SyncStatus.svelte` and its
caller in `ListPage.svelte`. Blocking, local.

**B4. The owner's list page fails the First-Screen Rule from 761 to 999 px.**
DESIGN.md, "The First-Screen Rule": from 761 to 999 px the rule is checked at 768x1024 and
900x720, with one exception (`/tables/*`). Measured top of the first entry
(`[data-primary]`), RU:

| List | 768x1024 (limit 410) | 900x720 (limit 288) |
|---|---|---|
| gm1 «Лавка кузнеца» (notes, prices) | 526 | 526 |
| gm2 «Список второго ГМа» (notices strip) | 382 | 382 |
| gm1 «Трофеи», gm3 «Склад» (no notes, no prices) | 313 | 313 |

At these widths the side content sits above the rows (FEATURES.md, "The side column"): the
`h1` (46 px), the meta line, the action row, «Цены» (62 px) and both read-only note boxes
(165 px). Every owner list fails at 900x720, also the list with no notes. No suite measures
it: `FIRST_SCREEN` reads 360 and 1180 only, and case 112's `HEAD_ROUTES` has no
`/lists/<uuid>`. The two documents disagree, so this needs the owner's decision:

- Recommended: from 761 to 999 px draw the side content as the compact head does (the list
  notes behind «Заметки ▾», closed on arrival; the price mode in the list «Ещё»). Reason: the
  rows then start near the 1000 px figure (139 px) and no new layout is needed. Trade-off: the
  read-only note boxes are one press away in this band.
- Name an exception in DESIGN.md with the measured figures. Trade-off: on a 900x720 window the
  first entry starts at 73% of the height.

Blocking until the owner chooses; then local.

## Risks

**R1. The list name is cut at about 25 characters in the side plate from 1000 px (judged
as asked).** Route `/lists/<uuid>`, 1000 to 1920 px, RU and EN. The name input in the `h1`
is 294 px wide (`clientWidth`) at every width from 1000 px, because the plate stays 330 px.
`text-overflow` is `clip`: a 40-character name has `scrollWidth` 477 px, a 120-character
name 1337 px, a 200-character name 2216 px, and nothing on screen says that the name goes
on. The full name is only in the visually hidden `h1` text and the tab title. DESIGN.md,
"The Whole Message Rule", allows a one-line list name up to 760 px only; FEATURES.md rule 16
names the one-line input as a departure at every width (owner, 2026-10-22); `/s/` draws the
same name on up to three lines from 761 px. My judgment: at 1920 px this is a defect, because
a common name of 30-40 characters is cut while the window has 1000 px of free width, and the
two documents disagree. Options for the owner:

- Recommended: from 761 px make the name field wrap, up to three lines as on `/s/` (an
  auto-height field; Enter commits). Reason: the owner's page then shows what the players'
  page shows. Trade-off: a long name makes the side plate taller.
- Keep one line and add `text-overflow: ellipsis` while the field has no focus. Trade-off: the
  name stays cut, but the cut is visible.

deferred-scope (owner decision; then a DESIGN.md or FEATURES.md correction in the same change).

**R2. A toast can be silent for a screen reader.** `Toast.svelte` sets `role` and
`aria-live` on the popover in the same update that inserts the text (the attributes are
`undefined` while no toast shows). Screen readers often skip the first change of a live
region that appears at the same moment as its content (WCAG 4.1.3). Not verified with a
screen reader. deferred-scope.

**R3. Inputs under 16 px at 360 px.** iOS Safari zooms the page when an input under 16 px
takes focus. Measured at 360: the add-to-list menu's new-list field 13 px, the row position
and price fields 13 px, the note field 14 px, «Кол-во» 15 px. The search boxes, the `/lists`
name field and the editor fields are 16 px, so the project already uses 16 px in some fields.
Not verified on iOS. deferred-scope.

## Nits

- **N1** (local). The add-to-list menu's new-list field ignores Enter: typed «Добыча», Enter,
  nothing after 1.5 s (no list, no toast, the focus stays). `AddToList.svelte` draws the
  field in a `<span class="picker-new">` with no form and no key handler. The `/lists` name
  field and «Добавить свой предмет» take Enter. Item page, roll result, 360 and 1180.
- **N2** (local). The add-to-list menu wraps a 120-character list name: the row is 95 px
  tall at 360 (`.ln` has `white-space: normal`, `text-overflow: clip`). FEATURES.md, "Lists":
  «the name on one line (cut with an ellipsis)». `AddToList.svelte`, `.ln`.
- **N3** (local). An old error toast hides the result of the create that answers it. On
  `/lists` (360 RU, 1180 EN): «Новый список», Enter with an empty name gives «Сначала
  назовите список» (an error toast, 7000 ms); a valid create about 1 s later shows no «Список
  «Клад» создан»: the error toast stays, the create toast waits, and the later delete and bulk
  delete toasts take the waiting slot in turn, so the create and the delete toasts never show.
  DESIGN.md, "The Reading Time Rule": a retry press closes the error it answers. Add the list
  create (the `/lists` field and the menu's field) to the presses that first close a shown
  error toast. `ListsPage.svelte`, `AddToList.svelte`.
- **N4** (deferred-scope). The roll panel draws «Бросьте кубик и введите результат - или
  нажмите кнопку» / "Roll a die and type the result - or press the button" under an empty
  roll field (`ListPage.svelte`, `rollHint`). It is an instruction sentence (The Clarity
  Rule), it has no final period, FEATURES.md does not name it, and the roll pages draw none.
  Removing it needs the owner's yes.
- **N5** (local, docs). FEATURES.md, "Share links": «Under the rows a hint says what the two
  buttons do...». The build draws no hint (`SharePanel.svelte`); the same bullet later
  describes one muted line per row, which the build draws. Delete the stale sentence.
- **N6** (local, docs). FEATURES.md, "Purchase requests: the owner", and the `why` of the
  inventory state `#/roll/std ~ request arrived as gm1` call the arrival toast «the gold
  action toast». "Chrome" says no toast is gold, and the build draws a Vault Wall plate
  (`rgb(26, 22, 38)`) with a Vault Wall Lit button.
- **N7** (local, docs). FEATURES.md, the take line: «At 600 px or less the control is 36 px
  tall» contradicts the 40 px floor. Fix the text with B2.
- **N8** (deferred-scope). The focus goes to `body` after the in-app move from the list
  page's «Печать» to `/p/<id>` (360, 1180, 1920). No spec names a target; the request toast's
  «Открыть» already sends the focus to the panel head or `#main`.
- **N9** (deferred-scope). RU case: the roll result line reads «2 шт. · по 1 мешок 5
  горстей». With 1 the preposition takes the dative: «по 1 мешку 5 горстей». `dict.ts`
  `eachPrice` and the price text.
- **N10** (local, question). In a note area a press on «Только для мастера» or «Для игроков»
  moves the focus into the field (360 and 1180, RU and EN), so a keyboard reader leaves the
  switch with each press. FEATURES.md is silent. Keep the focus on the pressed option, or
  record the choice in FEATURES.md.
- **N11** (local). The notice's «Открыть» link is 53x20 px at 1180 (under 24 px). It sits
  after the sentence, not inside it, and passes the harness only as an inline link.
- **N12** (local; the most visible nit). The roll result draws the row face in a 260 px
  slot. `.lroll-res` takes two columns (`minmax(0, 260px) minmax(0, 1fr)`) from a 601 px
  window (`@media`), but RollResult draws the card face only from a 641 px `faces` container.
  Between the two, the row face sits in the 260 px column: measured `.lroll-res` 555 px at a
  640 px window, 615 px at 700, 561 px at 1000 and 621 px at 1060; the card is 260x321-425 px,
  its picture 96 px and its name 128 px wide («Топор Тлеющих Углей» on two lines), while the
  column beside it holds only «Показать в списке». A common 1024 px laptop window shows this.
  From 1100 px (661 px) and at 768 (683 px) the card face draws as specified. Fix: key the
  two columns to the same 641 px container step. `ListPage.svelte`, `.lroll-res`.

## Deviations

Not applicable: the dispatch forbids the handoff and the plan, so no recorded deviation was
read. The build departs from the specs where B4, R1, N2, N5, N6, N7 and N12 say.

## Standing checks

1. Scale: checked - `/lists` at the 50-list limit (count «50 списков из 50» in
   `rgb(240, 164, 157)`, 24 cards and «Показать ещё (26)», search box 237 px at 360 and 720 px
   from 761, the 51st refused with a 10000 ms toast that names the email, no sideways scroll at
   360, 1180, 1920); the add-to-list menu with 50 lists (search on top, 184 px of scrolled rows
   at 360 and 200 px at 1180, heading and search stay; the menu ends at y 568 at 360); a
   120-character list name (card wraps, menu row wraps: N2; list page: R1); a list of 100 entries
   with long notes (drawn in 308-451 ms, 101st entry refused with the limit toast, side plate
   720 px tall and not sticky); 10 pending requests (the 11th refused, 15 lines and 4 folds, the
   first «Принять» ends 517 px under the panel head at 360). Not measured: 3x the defaults (the
   fake keeps the default caps and the probe has no switch for a raised limit).
2. Error scenarios: checked - an offline entry edit («Не сохранено» and «Повторить» in the
   danger text, a retry saves; B3 loses the focus); an offline lists import (error toast
   7025 ms; the next press closes it at once and «Импортировано списков: 1» shows within
   150 ms); a refused file in the error look (danger text and border, no fill); a share link
   delete with the confirm, «Ссылка удалена» and «Создать ссылку»; the entry limit refusal; an
   offline editor save (the page line «Не получилось сохранить...»). Not checked: two tabs, a
   conflict, a stale tab, a deleted record that a list names.
3. Consistency: checked - FEATURES.md rules 1, 2, 5, 8, 10, 11, 12, 16, 19 and 20 on `/lists`,
   the list page, the share, roll, requests and import panels and the add-to-list menu; the
   Seal Rule (one gold «Принять» per requests panel, no gold in the share panel or on any
   toast, the menu rows neutral); focus after menu picks (the row «Ещё», the list «Ещё», the
   supplement menu, a mode pill, the price switch, «Готово», Escape in the menu) is correct;
   departures: B3, N1, N3, N10, R1, N2.
4. RU/EN parity: checked - the share panel, the request panel columns and lines, the notices,
   the import panel and its errors, the toasts (create, delete, copy, limit, undo, arrival),
   the list and row menus, the note switch and its captions, the price switch, the roll panel
   and the selection bar, in both languages with the same facts and both plural sets («1
   позиция», «2 позиции», «10 позиций»; "1 item", "2 items"); ASCII punctuation in every probed
   string; one RU grammar slip (N9).

Owner rules: not applicable for `context.md` (the dispatch forbids it); checked the
owner-dated rules in DESIGN.md that this scope draws - The Phone-First Rule (B1, B2), The
First-Screen Rule (B4), The Whole Message Rule (R1), The Reading Time Rule (durations met:
plain 4025-4058 ms, error 7016-7026 ms, action 6993-7010 ms, long or email 9901-10053 ms;
hover, focus and touch hold the clock; N3).

## Suggested next action

Send B1, B2 and B3 with the local nits N1, N2, N3, N5, N6, N7, N10, N11 and N12 to one
implementer batch: they sit in `ListPage.svelte`, `SyncStatus.svelte`, `PickQty.svelte`,
`RequestsPanel.svelte`, `SharePanel.svelte`, `TableLink.svelte`, `AddToList.svelte`,
`ListsPage.svelte` and FEATURES.md. Add the missed states to the target sweep (the selection
mode on a list page, an open share panel, an open requests panel at the pending cap, a failed
save). Ask the owner about B4 and R1 with the recommended options above; with the owner away,
take the recommended options and log them. File R2, R3, N4, N8 and N9 in the handoff's
Deferred.

## Checks still needed

- Rebuild `dist-test/` after the fix batch and repeat the B1-B4 and N12 probes at 360x640,
  768x1024, 900x720, 1024x768 and 1180x720, RU and EN.
- 3x the default limits (150 lists, 300 entries, 30 pending requests): needs a raised limit in
  the fake.
- R2 with a screen reader (NVDA or VoiceOver) on a plain, an error and an action toast.
- R3 on an iOS device or simulator.
- Two tabs, a conflict, a stale tab and a deleted linked item on the list page.
