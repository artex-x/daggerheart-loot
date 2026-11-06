# Batch PW3 - the wave 3 blind review remediation (TASK 57)

This brief plans the one remediation batch for the three wave 3 reviews. Wave 3 is live on `main` (`10011729`);
this batch ships as the second squash, S2. Part A is the owner's decision table, part B the implement-ready batch,
part C the changes to the whole-app blind review prompt, part D the conflicts this plan could not settle.

## Status

- Planned 2026-11-06 (planner) from `reviews/post-wave-3.md` (production, signed out), `reviews/post-wave-3-signed-in.md`
  (fixture build, signed in), `reviews/post-wave-3-owner-chrome.md` (the owner's Chrome) and the owner's priority of
  2026-11-06: consistency, the same action in the same place on sibling pages. Not started.
- Owner: partly present ("pass all the feedback to the planner and then decide"). Part A waits for the owner's answers.
  A row the owner does not answer takes its recommended option, logged in the AFK decisions file (memory, "Owner AFK").
- Plan review: not required (no trigger fired). No route, no `CONTRACTS.md` path, no fixture, no `llms.txt` line, no
  stored key, no migration and no write or sync protocol changes. The list name field changes its element, not the
  stored name (part B, PW-4).
- Batch review: required (trigger: changed UI on most routes and a golden re-seed of about 110 files).
- Writer tier: `opus` (writer test 3: a golden re-seed and visual judgment at five widths). Test 1 also holds while a
  part A row stays open; the dispatch waits for the answers or the logged defaults.
- NEEDS_HUMAN_CONFIRMATION: yes, for the part A rows (owner-visible choices). No product law and no feature loss:
  every control that moves stays one press away.

Measurements of this plan: read-only probes on `dist-test/` of 2026-11-06 14:13 (the app code of these pages equals
`45050594`), scripts in the planner's scratchpad (`hb-head-probe.cjs`, `hb-tabs-probe.cjs`, `list-head-probe.cjs`,
`account-lead-probe.cjs`). Each figure is the top of the first `[data-primary]` (or of `main .stack` on a homebrew tab
with no mark), in px, at scroll 0.

## A. Decisions for the owner

One row per owner-level question. "Current" says what a person sees today and where. The recommended option is first.

| # | Finding | Current | Options (recommended first) | Recommendation, reason, accepted trade-off |
|---|---|---|---|---|
| D1 | OC-6 sheet placement | Every `Sheet` rises from the bottom edge at every width (560 px wide, top corners round). From 761 px the record dialog is centered. A desktop sees two modal shapes. | (a) Center the `Sheet` from 761 px, keep the bottom sheet up to 760 px. (b) Keep the bottom sheet at every width and name the difference in DESIGN.md. | (a). Reason: every modal from 761 px then has the record dialog's shape and place. Trade-off: on a desktop a sheet that a selection-bar action opens («Цены», «Переместить») appears in the middle, not next to the bar. |
| D2 | OC-7 «Импорт из файла» placement | From 761 px: «Мои списки» draws it in the head row before «Новый список»; «Мои предметы» draws it at the right end of each tab's tool row (Items: after the counts, before «Выбрать»). Up to 760 px both pages hold it in the head's «Ещё». | (b) The tool row on both pages: «Мои списки» moves it to its count row, before «Выбрать». (a) The head row on both pages, before the primary. | (b). Reason: the probe shows that the homebrew head cannot take a 162 px toggle at 1180x720 in Russian without wrapping its four pills to a second line (Items tab first content 231.4 to 266.0 px), and the GM reads this page on a laptop. Trade-off: on «Мои списки» the import leaves «Новый список» and sits in the count row, as it does on «Мои предметы» today. Measured figures for (a) are under the table. |
| D3 | SI-B4 the owner's list page at 761-999 px | The side content sits above the rows: the name (46 px), the meta line, the action row, «Цены» (62 px), both note boxes (165 px). First entry: «Лавка кузнеца» 526.2 px at 768x1024 (limit 410) and 900x720 (limit 288); gm2's list 382.3 px; lists with no notes or prices 313 px (reviewer). DESIGN.md asks the rule at 768x1024 and 900x720; FEATURES "The side column" draws the side content there. | (a) Draw the compact head of up to 760 px through 999 px: the name, «Выбрать» and «Ещё» on one row, the meta line with «Заметки ▾»; «Поделиться», «Печать», «Бросить по списку» and the price mode in «Ещё». The full rows stay from 761 px. (b) A named First-Screen exception at 526 px. | (a). Reason: the first entry then starts at about 206 px («Лавка кузнеца») and 212 px (gm2's list; both estimated from the compact head measured at 760x1024, 248.0 and 253.6 px, less the 42 px shorter header from 761 px) with no new layout: the page has two heads, split at the catalog's own 1000 px step. Trade-off: from 761 to 999 px the share, print and roll actions and the price switch are one press away in «Ещё», and the read-only notes are behind «Заметки ▾». |
| D4 | SI-R1 / OC-1 the list name field | An `<input>` in the `h1`, one line at every width. From 1000 px it is 294 px wide: a name of more than about 26 characters is cut with no mark (a 40-character name is 477 px of text). `/s/` draws the same name on up to three lines with an ellipsis from 761 px and one line with an ellipsis up to 760 px. | (a) In the side plate (from 1000 px) the field wraps the whole name (an auto-height field, Enter commits); in the compact head (up to 999 px with D3 (a)) one line with an ellipsis while the field has no focus. (b) One line with an ellipsis at every width (CSS only). (c) Three lines with an ellipsis as on `/s/`. | (a). Reason: the side plate pushes no row down, so the owner's page can show the whole name where `/s/` must clamp it for its first screen. Trade-off: a 200-character name makes the plate about nine lines taller and moves its actions down; the two list pages differ for a name over about 70 characters, with that reason stated. (c) needs an overlay over an editable field: more code for the same gain. |
| D5 | PW3-B1 signed-out `/account` at 360x640 RU | The lead «Войдите, чтобы ваши данные были доступны на всех устройствах. Всё остальное работает и без входа.» takes three lines; the sign-in panel starts at 262.4 px (limit 256). EN: two lines, 240.0 px. | (a) A shorter RU lead: «Войдите, чтобы данные были на всех устройствах. Остальное работает без входа.» (77 characters; EN unchanged). (b) A named exception at 263 px. | (a). Reason: measured two lines at 320, 360 and 390 px and one line from 768 px; the panel starts at 240.0 px at 360x640, the EN figure. Trade-off: the RU lead drops «ваши» and «доступны», the same facts in fewer words. Either option adds the signed-out `/account` row to `FIRST_SCREEN`. |
| D6 | PW3-N2 and SI-N4 instruction sentences (The Clarity Rule) | Six roll pages draw an instruction as their lead: Wondrous Environments, Dread GM Toolbox, The Dragon's Vault and Arazo's Artifacts («Введите результат броска или получите случайную позицию.»), Vault of Ages («Выберите раздел книги и бросьте кость по нему.»), Community items («Выберите происхождение и бросьте d10.»). The list roll panel draws «Бросьте кубик и введите результат - или нажмите кнопку» under an empty field. `/roll/mwt` lost its lead in `34ae151c`; `/roll/std` and `/roll/alt` draw a description. | (a) Remove the six leads and the roll hint, as the `/roll/mwt` lead went. (b) Rewrite each as a description of its table. (c) Keep them. | (a). Reason: the pill names the book and the field label «Результат броска (1-N)» and the roll button say what to do, so the sentences repeat the controls (the Clarity Rule). Trade-off: two kinds of roll lead remain: `/roll/std` and `/roll/alt` keep a description because they combine two books, which their names do not say. 15 roll goldens re-seed. Needs the owner's yes: it removes visible text. |
| D7 | OC-2 the note toggle on `/s/` | «Заметка» (and the GM note's toggle) at the end of the `/s/` meta line is a bare button: no underline, no chevron; it reads as plain text. The owner's page draws «Заметки ▾» there with an underline and a chevron. | (a) One meta-line toggle on both list pages: the owner's page look (underline, chevron that turns while open, the thumb target up to 600 px), extracted as one component. (b) Keep `/s/` as it is. | (a). Reason: one control, one look on sibling pages, and the chevron says that the text opens something. Trade-off: one new component (`MetaToggle.svelte`) on its second use. |
| D8 | OC-3 the account print defaults | One row «Печать по умолчанию» holds two switches («Цвет» «Ч/б», «63×88» «44×63») 8 px apart, so it reads as one group of four. | (a) Two rows with their own names, «Цвет печати» / "Print color" and «Размер карты» / "Card size", the group names of the `/p/` toolbar. (b) One row with a 24 px gap. | (a). Reason: each switch gets the name it has on `/p/`, so one name means one thing. Trade-off: the panel is one row taller; the «Печать по умолчанию» caption goes (each row is a setting, as the language and the start section are). |
| D9 | PW3-N3 the search lead repeats the start plate | From 761 px the lead says «... на русском и на английском.» and the start plate says «Ищет по названиям и описаниям, по-русски и по-английски сразу.» | (a) Drop «, на русском и на английском» from the lead (EN: ", in Russian and English"); the plate keeps the fact at every width. (b) Drop the clause from the plate. | (a). Reason: up to 760 px the lead is not drawn, so the plate is the one place a phone reader sees the fact. Trade-off: after a search, with the plate gone, no line states both languages. |
| D10 | SI-N10 the note switch moves the focus | A press on «Для игроков» or «Только для мастера» in a note area moves the focus into the field. | (a) Keep the focus on the pressed option. (b) Keep today's behavior and write it into FEATURES.md. | (a). Reason: a keyboard reader stays on the switch to compare the two notes, and a pointer reader taps the field anyway. Trade-off: a keyboard reader presses Tab once to type. |
| D11 | PW3-N7 the static pages | `/pages/*.html` draw the system face, and their language and back links are 17-24 px tall at 360 px. DESIGN.md "Notes" names only `404.html` as a system-face page. | (a) Fix the links (a padded box: 40 px up to 600 px, 24 px from 601 px) and name the static pages beside `404.html` in DESIGN.md "Notes". (b) Also give the template the self-hosted face. | (a). Reason: the targets are a cheap fix in the file this batch opens for N4; the face needs the hashed woff2 name from the Vite build, which `tools/build-pages.js` does not know. Trade-off: the privacy, terms and install pages keep the system face. |

Measured figures for D2 (a), the import moved into the homebrew head (probe on the built page, the toggle cloned before
«Новый предмет» and removed from the tool row; RU; EN changed nothing at any size):

| Route | 768x1024 | 900x720 | 1000x720 | 1180x720 | 1440x900 |
|---|---|---|---|---|---|
| `#/homebrew as gm3` (limit 410 / 288 / 288 / 288) | 286.2 to 286.2 | 286.2 to 286.2 | 266.0 to 266.0 (pills already on two lines) | 231.4 to 266.0 (pills wrap) | 231.4 to 231.4 |
| `#/homebrew/sources as gm3` | 225 | 225 | 170.2 to 214.0 | 170.2 | 170.2 |
| `#/homebrew/sets as gm3` | 281 | 281 | 226.2 to 270.0 | 226.2 | 226.2 |

No route scrolled sideways. The RU toggle is 162 px wide, the EN toggle 149 px. With (a), a tab switch in Russian
moves the pills by a line in a band of about 1000 to 1300 px (only the Items tab has «Новый предмет»), unless the other
tabs reserve the primary's place (PW-2b).

Found by the same probe, a defect under either option: at 1000x720 RU the Items tab draws its pills on two lines and
the Sources, Sets and Rules tabs on one, so a tab switch moves the pills today (from 1000 to about 1139 px in RU). The
Head Order Rule says "a row that some contents lack keeps its reserved space". PW-2b fixes it.

Changes the batch makes by default (not owner-level; the owner can veto a line): PW3-N1 the lit pill keeps its rest
width; PW3-N4 the static page titles use " - "; PW3-N5 the signed-out editor head draws no lead up to 760 px, as
`/homebrew`; PW3-N6 «показать в таблице» loses the external-link icon (it opens in the same tab); SI-N1 Enter creates a
list in the add-to-list menu; SI-N3 a create closes the error toast it answers; SI-N8 the focus goes to the print
page's `#main` after the list page's «Печать»; SI-N9 RU «по %s» becomes «%s за штуку» («2 шт. · 1 мешок 5 горстей за
штуку»; the dative of «по 1 мешку» needs a case per count); PW-2b the homebrew tabs reserve the primary's place.

## B. The batch PW3 (implement-ready)

### Objective

Fix every blocker and local nit of the three wave 3 reviews in one batch, with the part A answers, and keep CI green on
the target sweeps, the first-screen case and the states loader.

### Scope

In scope: PW3-B1, B2, N1-N6, N7 (links), N8 (links); SI-B1-B4, R1, N1-N3, N5-N12; OC-1-OC-4, OC-6, OC-7; the Head Order
defect found by the probe (PW-2b); the bundle budget; the docs each line names.

Out of scope, with the reason, placed in `plan-debt.md` (task `57-debt`) by this planning commit:

| Finding | Reason | Home |
|---|---|---|
| PW3-N7 the static pages' face | needs the hashed woff2 name outside the Vite build; D11 names it a kept exception | DESIGN.md "Notes" (PW-11) |
| PW3-N9 Escape clears a selection and folds «Настроить» | a proposed rule (DESIGN.md "Proposed rules", The Escape Rule), not shipped | `plan-debt.md` step 2 |
| SI-R2 a toast's live region set with its text | not verified with a screen reader; a fix touches case 108's timing hook and case 32's role count | `plan-debt.md` step 2 |
| SI-R3 inputs under 16 px at 360 px | not verified on iOS; a fix changes the type scale of six fields | `plan-debt.md` step 2 |
| SI checks still needed: 3x the default limits | the fake has no switch for a raised limit | `plan-debt.md` step 1 |

### Files

`app/src/components/`: `Sheet.svelte`, `sheet.test.ts`, `FilterPanel.svelte` (comment), `ListsPage.svelte`,
`listsPage.test.ts`, `HomebrewPage.svelte`, `homebrewPage.test.ts`, `ListPage.svelte`, `listPage.test.ts`,
`SharedListPage.svelte`, `sharedListPage.test.ts`, `MetaToggle.svelte` (new), `metaToggle.test.ts` (new),
`AccountPage.svelte`, `accountPage.test.ts`, `SyncStatus.svelte`, `PickQty.svelte`, `RequestsPanel.svelte`,
`SharePanel.svelte`, `TableLink.svelte`, `AddToList.svelte`, `lists.test.ts`, `ModeRow.svelte`, `Chip.svelte`,
`chip.test.ts`, `HomebrewEditor.svelte`, the notice component that draws «Открыть» (find it with
`git grep -n "noticeOpen\|t.open\b" -- app/src/components`), `App.svelte` (the roll `sub` fields); `app/src/lib/dict.ts`;
`tools/build-pages.js`; `404.html`; `tests/app/states.js`, `tests/app/lib.js`, `tests/app/inventory.js` (one `why`);
the goldens the tool re-seeds; `DESIGN.md`, `docs/specs/FEATURES.md`, `docs/specs/COVERAGE.md`; `issues/57/handoff.md`.
With D2 (a) instead of (b): `HomebrewSources.svelte`, `HomebrewCards.svelte` too.

### Constraints

- Settled, do not reopen: the 40 px thumb floor up to 600 px and the 24 px box from 601 px (owner, 2026-11-05); the
  Head Order Rule; the compact row and the compact head of up to 760 px (owner, 2026-11-03, C1b and D-head 1); the
  inline rename in the `h1` (M9-1); the `/s/` three-line name; the toast durations; the 63x88 mm card.
- A text control takes its padded box and gives the growth back (`Shell.svelte`, `.foot-nav a`): `display:
  inline-block; padding-block: max(0px, calc((max(24px, var(--thumb)) - 1lh) / 2)); margin-block: min(0px, calc((1lh -
  max(24px, var(--thumb))) / 2))`. Add `position: relative` where a later block paints over the box (the hit test reads
  the topmost element).
- `--thumb` is 40 px up to 600 px and 0 from 601 px: write `max(<desktop size>, var(--thumb))`, never a literal 40.
- No new system breakpoint: D3 uses the existing `app.band` values `narrow`, `mid`, `wide`.
- Interim inconsistency is fine only between batches; this batch is the last before S2, so it leaves none.

### Standing checks

1. Scale. States table (each row at 360 and 1180 px unless named):

| Screen | State | Shows | Proof |
|---|---|---|---|
| Any `Sheet` caller | open, at 360 | bottom sheet, unchanged | the price-sheet foot reads at 360x480 (unchanged) |
| Any `Sheet` caller | open, at 1180 | centered, four round corners, 560 px | new read in the price-sheet case (PW-1) |
| Price sheet | 1 ticked, 14 ticked (the height cap) | body scrolls, foot in view | existing 360x480 reads; PW-1 read at 1180x720 with 14 rows |
| `/lists` | 0 lists, 1, 50 (the limit, count red), a 51st refused | count row: count, import, «Выбрать» while a card draws | `listsPage.test.ts`; goldens; case 109 `#/lists ~ import panel` |
| `/lists` | failed save | count row: count, «Не сохранено», «Повторить», import, «Выбрать» | PW-14 probe at 360 and 1180 |
| `/homebrew` 4 tabs | 0 items, 44, the 100 limit | head unchanged (D2 (b)); Sources, Sets, Rules reserve the primary's place | PW-2b read at 1000 and 1180 RU |
| List page | 761-999 px, 0 notes, notes, prices, notices strip, requests strip | compact head; first entry at or under 288 at 900x720 and 410 at 768x1024 | case 83 `mid` rows (PW-3) |
| List page | a 200-character name, from 1000 px | the whole name wraps in the plate; rows start unchanged (139 / 208.6) | PW-4 browser read |
| List page | a 200-character name, up to 999 px | one line, ellipsis while not focused | PW-4 browser read at 768 and 360 |
| List page | 100 entries (the limit), 101st refused | unchanged | existing cases |
| List page | 10 pending requests (the limit), folds open | folds 40 px at 360 | case 109 (PW-20) |
| List page | selection mode, ticked entry with qty over 1 | tick column 40 px wide; «Мин» and the count field 40 px | case 109 (PW-20) |
| `/s/` | one note, both notes | the meta-line toggles with a chevron | `sharedListPage.test.ts` |
| `/account` signed out | RU, EN | the panel at 240.0 at 360x640 | case 83 new row |
| `/account` signed in | default | two print rows | `accountPage.test.ts`, goldens |
| Six roll pages | default | no lead | goldens |

   No collection limit changes; no per-record cap changes. At 360 px with the keyboard open: the price sheet keeps its
   foot in view (the 360x480 reads stand in for the keyboard); the compact head is not sticky; no sticky region grows.
   3x the default limits is not reachable in the fake (out of scope above).
2. Error scenarios. Loading and a failed read: unchanged on every touched page. A failed write: the save status
   «Повторить» now has a 40 px target and, when the retry saves, sends the focus to the page's lead control (PW-21);
   the row read again is the source of each retried field (the write buffer sends the store's current row, unchanged).
   Offline: the same as a failed write. A conflict: unchanged (the buffer's revision check). A deleted record that a
   list names: unchanged («Предмет не загружен»). A stale tab: no stored shape changes, so an old bundle meets the same
   rows. A revert: none needed, nothing stored changes. The rename field: a pasted line break becomes one space before
   the write, so no stored name gains a line break (PW-4).
3. Consistency. FEATURES.md "Consistency rules" followed: 1 (counters: the `/lists` count row keeps its place), 5
   (toasts: a create toast now shows after an error, SI-N3), 8 (create: Enter in both new-list fields), 9 (the primary;
   its departure text changes with D2), 16 (long names: the side-plate field wraps; the one-line departure narrows to
   999 px), 20 (focus: three new cases, PW-10, PW-21, PW-29). Sibling comparison: the import (D2), the note toggle (D7),
   the modal shape (D1), the head per band (D3), the roll leads (D6), the print setting names (D8), the head geometry
   across homebrew tabs (PW-2b). Each remaining difference has its reason in the row that keeps it.
4. RU/EN parity. Changed strings: `signInLead` RU (EN keeps the same facts), the search lead RU and EN, `eachPrice` RU
   (EN "%s each" has the same facts). Deleted in both languages: `subWondrous`, `subVoa`, `subCommunity`, `rollHint`,
   `defaultPrint` (if no other reader), and with D2 (b) nothing else. No new string: `MetaToggle` takes its caller's
   label. The static page titles change in both languages. `i18n.test.ts` passes.

### Steps, in order

1. Baseline. `npm run build:test`. Run the PW-34 probe on the unchanged build and save its output in the scratchpad
   (the before list of targets that pass only by the `inline` allowance).
2. Owner rows D1-D11 as answered (PW-1 to PW-11). Each row's code, its unit test, its doc lines.
3. Local blockers and nits (PW-12 to PW-33).
4. Suites: the `FIRST_SCREEN` `mid` flag and rows, the `TARGET_LAYERS` entries, the new browser reads (PW-1, PW-2b,
   PW-4, PW-20, PW-35).
5. `npm run build:test`; the probes (PW-34, PW-35); the targeted `states.js` cases (Verification); fix until clean.
6. Goldens: `node tests/app/golden.js --update --only=<prefix>` per family (PW-36); read each diff.
7. Docs (PW-37), the bundle (PW-38), lints, `check:built`, then `rtk npm run check:fast` last; commit; push.

### Acceptance

Each line is its own outcome in the handoff. "Test" names the proof that fails before the fix and passes after.

| Line | Finding | Fix | Test |
|---|---|---|---|
| PW-1 | D1, OC-6 | `Sheet.svelte`: `@media (min-width: 761px) { dialog[open] { inset: 0; margin: auto; height: fit-content; border-bottom: 1px solid var(--line2); border-radius: var(--r); box-shadow: var(--shadow) } }`; the width and height caps stay. Comments in `Sheet.svelte` and `FilterPanel.svelte` say "sheet", not "bottom sheet"; `sheet.test.ts` describe "the sheet". Callers from 761 px: `FilterPanel` (catalog and Items tab 761-999 px, both list pages at every width), `HomebrewBulk` move, `ListPage` «Цены выбранных»; `TableNav`, `HomebrewTabs` and the editor preview draw up to 760 px only and do not change. | In the case that reads `dialog.sheet .sheet-foot` at 360x480 (`states.js`): at 1180x720 with 14 ticks the sheet's top and the window's bottom gap differ by 1 px or less, its bottom is at least 16 px over the window's bottom, and its bottom-left radius equals `--r`; at 360x480 the existing foot reads still pass. DESIGN.md "Bottom sheet" becomes "Sheet" (bottom up to 760 px, centered from 761 px) and lines "Two Breakpoints Rule" and "Filter chips" lose "bottom"; FEATURES.md "Lists" (the `/s/` filter line) says "the sheet" |
| PW-2 | D2, OC-7 (b) | `ListsPage.svelte`: the import toggle leaves `wideHead` (the head keeps the primary); from 761 px it is the last control before «Выбрать» in the count row: in `.lhead` after `countLine`, and in `ListFind`'s `beside` after the count line, with `margin-left: auto` as `HomebrewPage`'s `.end`. Up to 760 px «Ещё» keeps it. Focus after the panel closes: the toggle in view, else «Ещё» (rule 20, unchanged). | `listsPage.test.ts`: at `wide` the toggle is not in `.page-head` and sits in the count row before «Выбрать»; at `narrow` it is an item of «Ещё»; ends with axe. Case 109 `#/lists ~ import panel as gm1` passes. FEATURES.md "Lists" (the index head bullet) and rule 9 ("the import is the last control before «Выбрать» in the collection's tool row from 761 px on `/lists` and on every tab of «Мои предметы», an item of the head's «Ещё» up to 760 px"). If the owner picks (a): the toggle moves into `HomebrewPage`'s `extra` before «Новый предмет» on every tab, the `tools` prop of `HomebrewSources` and `HomebrewCards` is deleted, FEATURES.md "Homebrew" and rule 9 follow, DESIGN.md "The Head Order Rule" names the import before the primary and the RU wrap band measured; the first screens of the D2 table are logged |
| PW-2b | Head Order defect (probe) | `HomebrewPage.svelte`: on the Sources, Sets and Rules tabs, from 1000 px, `extra` draws the primary's copy in a `<span class="headnew reserve" aria-hidden="true" inert>` with `visibility: hidden`, so every tab's pills wrap at the same width. | A browser read (case 112, homebrew family, or a new step there): at 1000x720 and 1180x720 RU the pills' line count and the first pill's top are equal on `#/homebrew`, `/sources`, `/sets`, `/rules` as gm3; log the first content per tab (expected: Sources and Rules about 214 and Sets about 270 at 1000x720 RU, 288 or less). `homebrewPage.test.ts`: the reserve is `aria-hidden` and not focusable. DESIGN.md "The Head Order Rule" names the reserve |
| PW-3 | D3, SI-B4 (a) | `ListPage.svelte`: `const compactHead = $derived(app.band !== 'wide')`; use it for the head branch (`.lhead` vs `.lside`), `class:wide`, the meta line's «Заметки ▾», the `narrow` items of the list «Ещё» (share, print, roll, price mode) and the `.selrow` condition. The rows (compact row, the bulk «Ещё», a row's notes) stay on `narrow`. | `listPage.test.ts` with `fakeViewport('mid')`: `.lhead` with «Выбрать» and «Ещё», «Ещё» holds «Поделиться», no `.lside`; at `wide` `.lside`; a focus on a head control across the 999/1000 px crossing lands where it lands at 760/761 (the Shell fallback). `FIRST_SCREEN`: a `mid: true` flag adds [768, 1024] and [900, 720] with the 40% limit; the four list-page rows take it and a new row `GM2_LIST as gm2` (`#/lists/00000000-0000-4000-8000-000000000201 as gm2`) with `mid: true`; expected about 206 px (shop) and 212 px (gm2's list). Case 105 at 768: the compact head above the rows, no `.lside`. Golden `~ mid band as gm4` re-seeds. FEATURES.md "The compact head" (up to 999 px), "The side column" (from 1000 px), the price switch line; DESIGN.md "The Two Breakpoints Rule"; COVERAGE.md case 83 |
| PW-4 | D4, SI-R1, OC-1 (a) | `ListPage.svelte`: the side plate's rename field is a `<textarea rows="1" class="titleinput">` (same `maxlength`, `aria-label`, `oninput`); its height follows its content (an `$effect` sets `height = scrollHeight` on input, on mount and on a `ResizeObserver` width change); Enter calls `blur()` with `preventDefault()`; the rename handler writes the value with each `\s*\n\s*` run as one space; `resize: none`; `overflow: hidden`. The compact head keeps its `<input>` with `text-overflow: ellipsis`. | `listPage.test.ts`: at `wide` the field is a textarea, Enter adds no line break and leaves the field, a pasted "a\nb" stores "a b"; at `mid` an input. Browser read (case 106 or 105): `~ long name as gm4` at 1180: the field's `scrollHeight` equals its `clientHeight` (the whole name), the rows column top unchanged; at 768 and 360 the input's `text-overflow` is `ellipsis`. Goldens at 1100 px that hold the field show `multiline=true` (read each diff: only that attribute moves). DESIGN.md "The Whole Message Rule" (the list name: one line up to 999 px, the whole name in the side plate), FEATURES.md rule 16's departure |
| PW-5 | D5, PW3-B1 (a) | `dict.ts` RU `signInLead`: «Войдите, чтобы данные были на всех устройствах. Остальное работает без входа.» | `FIRST_SCREEN` gains `{ state: '#/account', shipped: true }` (360x640 and 1180x720, RU and EN; expected 240.0 and 170.2). `accountPage.test.ts` reads the new text. FEATURES.md "Account" quotes it. Case 111 (a): the lead stays one line from 768 px |
| PW-6 | D6, PW3-N2, SI-N4 (a) | Delete `subWondrous`, `subVoa`, `subCommunity` (both languages) and their `sub` fields in `App.svelte`; delete `rollHint` (both languages) and `.rollhint` in `ListPage.svelte`. | The 15 roll goldens re-seed (each diff loses one `StaticText`); roll page tests that read a lead adapt; `i18n.test.ts`. FEATURES.md "Rolling" (the leads) and "Lists" (the roll panel) |
| PW-7 | D7, OC-2 (a) | New `MetaToggle.svelte` (props `label`, `expanded`, `onclick`, `el`): the `.lnkb` rules of `ListPage.svelte` (underline, 16 px chevron turned while open, `min-height: 24px`, the thumb box with the growth given back up to 600 px). `ListPage`'s «Заметки ▾» and `SharedListPage`'s two note toggles use it; `.lnkb` is deleted. | `metaToggle.test.ts` (name, `aria-expanded`, the chevron `aria-hidden`, ends with `expectNoA11yViolations`); `sharedListPage.test.ts`: both toggles carry the chevron and `aria-expanded`. FEATURES.md "Share links" (the `/s/` meta line) |
| PW-8 | D8, OC-3 (a) | `AccountPage.svelte`: two `.set` rows, «Цвет печати» (`printInk`) with the color switch and «Размер карты» (`printSize`) with the size switch; `.wb` and `defaultPrint` go when nothing else reads them. | `accountPage.test.ts`: two groups named «Цвет печати» and «Размер карты», ends with axe. Account goldens re-seed. FEATURES.md "Account" |
| PW-9 | D9, PW3-N3 (a) | `dict.ts` search lead: RU «Поиск сразу по 1459 позициям - добыча, расходники и снаряжение.», EN "Search all 1459 entries at once - loot, consumables and equipment." | `node tests/run-all.js derived` (the count-bearing check) passes; FEATURES.md "Tables and search" quote; goldens that hold the lead re-seed |
| PW-10 | D10, SI-N10 (a) | `ListPage.svelte` `switchKind`: no focus move. | `listPage.test.ts`: after a press on «Только для мастера» the focus is on that option and the GM field shows. FEATURES.md "Lists" (the note area) states it |
| PW-11 | D11, PW3-N7, N4, N8 (a) | `tools/build-pages.js`: the title uses " - "; the language link and the back links take the padded box (40 px up to 600 px, 24 px from 601 px). `404.html`: its links take the same box. | `node tools/build.js` exit 0; a probe at 360 and 1180 on `/pages/privacy.html` (RU, EN) and `/nope`: `targets()` reports nothing. DESIGN.md "Notes" names the static pages beside `404.html` for the system face |
| PW-12 | PW3-B2, PW3-N6 | `TableLink.svelte`: the padded box with the growth given back and `position: relative`; the external icon and its rule go. `tests/app/lib.js` `TARGET_ALLOW` `inline`: also require that the block's trimmed text ends with `.`, `!` or `?` (optionally followed by `»`, `"` or `)`), so a path line and a link after a sentence do not pass. | PW-20 entries `#/i/ci1` and `#/h/00000000-0000-4000-8000-000000000513 as gm1` at 360 (40 px) and 1180 (24 px); PW-35's before and after lists; `record.test.ts` / `itemPage.test.ts` drop the icon assertion |
| PW-13 | SI-B1 | `ListPage.svelte`: the price sheet's `NumberField` takes `label={t.repricePct}`; `.money-act :global(.numbox)` `height: max(32px, var(--thumb) + 2px)`, its buttons `width: max(28px, var(--thumb)); height: max(30px, var(--thumb))`, its input `height: max(30px, var(--thumb))`. | `listPage.test.ts`: `getByRole('textbox', { name: 'Изменить на, %' })`; case 109 `~ price sheet as gm4` (PW-20) |
| PW-14 | SI-B2 save status | `SyncStatus.svelte` `.linkbtn`: the padded box with the growth given back, `min-width: var(--thumb)`, `position: relative`. If the hit test fails on the name field above it at 360 px, drop the give-back (the meta line grows while a save has failed) and name it. | PW-20 entry `SHOP ~ not saved as gm1` at 360; the same state at 1180 (24 px) |
| PW-15 | SI-B2 tick column | `ListPage.svelte` `.lrow-pick`: `min-width: max(32px, var(--thumb))`, `justify-content: center`. | PW-20 entries `LIST_A ~ selecting as gm4` and `~ compact, selecting as gm4` |
| PW-16 | SI-B2 take control, SI-N7 | `PickQty.svelte` up to 600 px: the buttons and the input take `min-height: var(--thumb)`; the group grows to fit. FEATURES.md "Account and browser lists" (the take line) says 40 px. | PW-20 entry: a ticked entry with a quantity over 1 (`LIST_A ~ picked as gm4`, or the state that draws «Мин»; name it in the handoff) |
| PW-17 | SI-B2 requests | `RequestsPanel.svelte`: delete the `min-height: 36px` rule of `.decided`, `.notice` and `.more` buttons (`Button` already gives 40 px). | PW-20 entries `SHOP ~ many requests as gm1` (folds open) and `GM2_LIST ~ notices open as gm2` |
| PW-18 | SI-B2 share link | `SharePanel.svelte` `.sharelink`: `display: flex; align-items: center; min-height: max(24px, var(--thumb))` (the panel grows; no give-back needed in a block). | PW-20 entry `SHOP ~ share as gm1` at 360 and 1180 |
| PW-19 | SI-N11 | The notice's «Открыть» link takes the padded box with the growth given back. | PW-20 wide entry `GM2_LIST ~ notices open as gm2` at 1180 |
| PW-20 | SI-B2 sweep gap | `states.js` `TARGET_LAYERS` gains `LIST_A_ID ~ selecting`, `~ compact, selecting`, `~ price sheet`, the «Мин» state, `SHOP ~ share`, `~ many requests` (folds open), `~ not saved`, `GM2_LIST ~ notices open`, `#/i/ci1`, `#/h/...0513 as gm1`. A second list `TARGET_LAYERS_WIDE` is read at 1180x720 with `{ floor: 24, spacing: true }`: `SHOP ~ share`, `~ not saved`, `GM2_LIST ~ notices open`, `#/i/ci1`, `#/h/...0513 as gm1`. | Case 109 passes RU and EN; COVERAGE.md case 109 |
| PW-21 | SI-B3 | `SyncStatus.svelte`: an `after` prop as `LoadState`'s; a press records whether the button held the focus; when `failed` turns false and the focus is on `body`, `after()` takes it, else `#main`. Callers: `ListPage` passes the list «Ещё» toggle (never the name field: a phone would open its keyboard); `ListsPage` passes «Новый список». | A unit test (`listPage.test.ts` or `syncStatus.test.ts`): offline edit, online, «Повторить», the focus on the list «Ещё»; a retry that fails keeps the button and the focus. Rule 20 gains "the save status «Повторить» when it leaves - the list «Ещё» on a list page, «Новый список» on `#/lists`" |
| PW-22 | SI-N1 | `AddToList.svelte`: the new-list input takes `onkeydown`: Enter runs `createNew()` with `preventDefault()`. | `lists.test.ts`: type «Добыча», Enter, the list exists and the toast says «Добавлено в «Добыча»» |
| PW-23 | SI-N2 | FEATURES.md "Lists" line 479: «the name on one line (cut with an ellipsis)» becomes "the name, wrapped" (batch 9b made `.ln` wrap under The Whole Message Rule; `lists.test.ts` holds it). | Docs only |
| PW-24 | SI-N3 | `ListsPage.svelte` `create()` and `AddToList.svelte` `createNew()` call `app.closeErrorToast()` after the name check passes and before the write. | `listsPage.test.ts`: an empty create (error toast), then a valid one: «Список «Клад» создан» shows within 500 ms. DESIGN.md "The Reading Time Rule" and FEATURES.md "Chrome" add the list create to the presses that close an error first |
| PW-25 | SI-N5 | FEATURES.md "Share links": delete «Under the rows a hint says what the two buttons do...» (batch 9b deleted the hint). | Docs only |
| PW-26 | SI-N6 | FEATURES.md "Purchase requests: the owner" and the `why` of the arrival state in `inventory.js`: "the action toast" (no toast is gold). | That golden's line 3 re-seeds |
| PW-27 | SI-N12 | `ListPage.svelte`: wrap `.lroll-res` in `<div class="lroll-wrap">` that is the `faces` container; `.lroll-res` takes its two columns in `@container faces (min-width: 641px)`, not `@media (min-width: 601px)`. | A browser read at 640, 700, 1000 and 1060 px windows on `LIST_A ~ rolled as gm4`: one column and the row face under a 641 px container, two columns and the card face from it; a unit test cannot read it (jsdom). The comment on `.lroll-res` changes |
| PW-28 | SI-N9 | `dict.ts` RU `eachPrice`: «%s за штуку». | The `~ rolled` goldens re-seed; `i18n.test.ts` |
| PW-29 | SI-N8 | `ListPage.svelte` `pressPrint`: after the in-app move to `/p/<id>`, when the focus is on `body`, focus `#main`. | `listPage.test.ts` or a browser read in the print step of `app/print`: after «Печать» the focus is `#main`. Rule 20 gains the case |
| PW-30 | PW3-N1 | `ModeRow.svelte` `.mode` and `Chip.svelte`'s `href` form: the label sits in `<span class="pl" data-label={label}>`; `.pl { display: inline-grid }`, `.pl::after { content: attr(data-label) / ''; font-weight: 650; height: 0; overflow: hidden; visibility: hidden }`. The count stays outside the span. | Case 112 (g): the pills keep one left per language across a mode switch at 1000 and 1180 px, and the lit pill's width equals its rest width within 0.5 px (`/roll/std` to `/roll/alt`, a catalog group switch). No golden moves (the generated text has no accessible name) |
| PW-31 | PW3-N5 | `HomebrewEditor.svelte`: the signed-out and failed-read `PageTitle` draw `sub` only when `app.band !== 'narrow'`. | `homebrewEditor.test.ts` at `narrow`: no lead; at `wide`: the lead. `FIRST_SCREEN` `#/homebrew/new as gm1` unchanged |
| PW-32 | OC-4 | Reproduce on the fixture build: `/i/ci1 as gm1`, «В список», a list: the toast «Добавлено в «<name>»» shows within 500 ms and lasts 4000 ms. If it does not, find the cause and fix it with a failing test first. | The probe's output in the handoff; a failing test only if a defect is found |
| PW-33 | Inherited stale rows | Nothing to build: this planning commit removed three rows of `plan-debt.md` step 3 that batch 10 shipped (the `/roll/mwt` lead, «корника», the gold «ИЛИ» dividers). | - |
| PW-34 | Gate: filtered target probe | A scratchpad probe that calls `targets()` from `tests/app/lib.js` on every state this batch changes (the PW-20 entries, `#/lists as gm1`, `#/lists ~ many lists as gm4`, `#/homebrew as gm3` and its three tabs, `/account` signed out and as gm1, the six roll pages, `/pages/privacy.html`, `/nope`) at 360x640 (floor 40, menu 44), 768x1024 and 1180x720 (floor 24, `spacing: true`), RU and EN. | Zero reports after the batch; the before and after outputs in the handoff |
| PW-35 | Gate: the `inline` narrowing | The same probe lists the targets that pass only by the `inline` allowance, before (step 1) and after. Each target that leaves the list is fixed (a padded box) or is a link inside a sentence that the new test misreads (then the test is refined and the case named). | The two lists in the handoff; CI's `app/sweep` at 360, 390, 768 and 1180 green |
| PW-36 | Goldens | `node tests/app/golden.js --update --only=<prefix>` for `#/lists`, `#/homebrew` (only with D2 (a)), `#/roll/`, `#/account`, `#/search`, `#/s/` and each single state named above; read every diff. Expected about 110 files: the list name field about 50, `/lists` about 25, roll leads 15, account about 6, the rest one each. | `git diff --stat tests/app/snapshots` in the handoff; CI's golden job green |
| PW-37 | Docs | Every DESIGN.md, FEATURES.md and COVERAGE.md line named above, in this commit; the owner's answers that settle a reusable rule are written to their homes here (D1 "Sheet", D2 rule 9, D3 "The Two Breakpoints Rule", D4 "The Whole Message Rule", D6 FEATURES "Rolling"). | `node tests/run-all.js derived` passes |
| PW-38 | Bundle | `npm run check:built`: the unconfigured bundle was 269.5 of 270 kB. If the batch passes the limit, raise it to the measured total rounded up, under the 300 kB ceiling (decision of 2026-10-22; owner item 14 of the handoff's list). | `check:built` passes; the figure in the handoff |
| PW-39 | Owner answers | The handoff names the answer or the logged default of D1-D11 and each departure from the recommended option. | - |

### Verification

Each heavy command alone, in the foreground (Bash timeout 600000), one browser at a time.

- `npm run build:test` (before the probes and after the last code change).
- The probes PW-1 (sheet geometry), PW-2b, PW-4, PW-27, PW-32, PW-34, PW-35, and the first-screen figures of D3 at
  768x1024 and 900x720.
- `node tests/app/states.js --shard=<k>/<n>` for one case at a time, `<n>` the case count (`states.js` prints it;
  batch 10 used 105) and `<k>` the case's index: case 83 (first screen, the `mid` rows), 105 (list layout), 106 (row
  text), 109 (targets, the new entries), 111 (the account lead), 112 (head order and the pill widths), and the case that
  reads the price sheet. Each passes.
- Vitest, one file at a time, `VITEST_MAX_WORKERS=2`: every test file in "Files", plus `i18n.test.ts`, `a11y.test.ts`
  (the new component's coverage line) and `app.test.ts`.
- `node tests/run-all.js derived,contracts`; `node tools/build.js` (exit 0).
- `npm run lint:untyped`, `npm run lint:typed`, `rtk npm run check:built`.
- `VITEST_MAX_WORKERS=2 rtk npm run check:fast` last; commit; push; CI of the tip is the full gate.

### Gate cost

| Gate | Time |
|---|---|
| `npm run build:test` x2 | 3-5 min |
| Probes (PW-1, 2b, 4, 27, 32, 34 before and after, 35) | 15-20 min |
| Targeted `states.js` cases (7) | 20-30 min |
| Vitest by file | 12-18 min |
| Golden re-seed and diff reading (about 110 files) | 15-25 min |
| Lints, `derived`, `check:built`, `tools/build.js` | 5 min |
| `check:fast` (reaches `dict.ts` and the component suites) | 11-14 min |
| Local total | 80-115 min |
| CI run | about 15 min |
| Review and its one fix pass | 40-70 min |

One batch, no split: every line shares the list pages, `dict.ts`, the golden re-seed and one CI run; no line changes a
public contract or needs a commit the harness cannot reach (`CLAUDE.md`, "Task and session protocol").

### Risks and do-nots

- Do not change the compact row or the bulk «Ещё» with D3: only the head follows `compactHead`.
- Do not focus the name field from `SyncStatus`: a phone opens its keyboard.
- Do not widen `TARGET_ALLOW` to pass a new failure; fix the control or name the refined test.
- The textarea name field: keep `aria-label`, `maxlength` and the hidden `h1` text; axe must pass in every list-page
  unit test.
- Case 105's 768 px reads and case 112's homebrew reads change with D3 and PW-2b: change the assertion to the new
  design, never delete it.
- A first-screen figure over 270 px but under the limit is logged, not a failure (the aim of DESIGN.md).

## C. Final-review prompt changes

Calibration, 2026-11-06: the production reviewer (signed out) found none of OC-1 to OC-7; the fixture reviewer (signed
in) found OC-1 only (its R1). Neither found the sheet placement (OC-6) or the import placement (OC-7), the toggle that
reads as text (OC-2) or the two groups with no gap (OC-3). Cause: both prompts measured rules page by page (sizes,
first screen, axe, focus) and did not compare a surface with its siblings or look at a screenshot.

Add this block to the dispatch of the whole-app blind review (`plan.md` section 16, step 1), for both reviewers:

1. Surface inventory per width. At 360x640, 768x1024, 1000x720, 1180x720 and 1920x1080, open every overlay kind on
   every page that has it: each `Sheet` caller, the record dialog, every «Ещё» menu, the add-to-list popover, the
   selection bar, the toasts, the print dock, the crop dialog. Record for each: its anchor (bottom edge, centered, or
   attached to its control), its width, its corners, its scrim. Compare it with the same kind on the sibling pages and
   with the other modal kinds at the same width. A difference that no DESIGN.md or FEATURES.md line gives a reason for
   is a blocker.
2. Consistency matrix. Rows: import, new or create, «Выбрать», the search box, «Фильтры», the pin, the help, the
   primary, share, print, roll, the note toggle, the counter and the limit, the save status, the «Ещё» contents.
   Columns: `/lists`, `/lists/<uuid>`, `/s/<token>`, the four `/homebrew` tabs, `/tables/*`, `/search`, the roll pages,
   `/account`, `/p/<id>`. Each cell: the label, the control kind, and its place (head row, tool row, menu, side plate,
   bar) at 360 and 1180 px. Each difference in a row cites the spec line that gives its reason. A difference with no
   reason is a blocker. The matrix goes into the report.
3. Screenshots. Take a screenshot for each probe (each route at 360x640 and 1180x720 RU, each open overlay, each
   matrix cell that differs) into the reviewer's scratchpad, never the repository, and read it with the Read tool
   before writing the finding. Each finding names its screenshot file.
4. Seeded defect classes. Look for each one on every route and state, and report "none found" per class:
   - placement: the same control or overlay in different places on sibling pages or widths;
   - wrapped, clipped or cut names: every input, textarea and one-line text with `scrollWidth` over `clientWidth` and
     no ellipsis;
   - text that looks like plain text but is a control: a button or link whose computed color, text decoration,
     border, background and icon equal the body text around it;
   - groups with no gap: two switch or chip groups less than 16 px apart with no name between them;
   - unnamed or misnamed controls: the accessible name of every field against its visible label (WCAG 2.5.3);
   - controls under the target floor in states the sweep does not reach: the selection mode, every open panel, a
     failed save, every sheet, every collection at its limit;
   - focus on `body` after a control removes itself or after an in-app navigation;
   - instruction sentences (The Clarity Rule).
5. Two blind reviewers, the same block for each: production signed out (as `post-wave-3.md`), and the fixture build
   signed in (`dist-test/` after `npm run build:test`, `?as=gm1..gm4`, as `post-wave-3-signed-in.md`). Neither reads
   the plan, the handoff, `context.md` or earlier reviews. The orchestrator merges the two reports.

The owner's signed-in checklist on production (about 15 minutes; a phone and a desktop window):

1. `/lists`: create a list, Enter in the name field, then delete it (the toasts show).
2. A list page at 1920 px and at a 900 px window: the head, a long name, the notes, «Цены».
3. «Выбрать», tick two entries, «Цены»: the sheet's place and the percent field.
4. «Поделиться»: both links, «Скопировать».
5. `/s/<token>` from the share panel: the note toggle, «Сохранить себе».
6. `/homebrew` and its tabs at 1180 px: the pills stay put across tabs; «Импорт из файла».
7. `/account`: the print rows, the start section.
8. The same list page and `/s/` on the phone: the compact head, a tap on «Заметки ▾», the tick column.
9. Print one list (`/p/`) on the phone and on the desktop.

## D. Conflicts this plan could not settle

- DESIGN.md "The First-Screen Rule" checks the list page at 768x1024 and 900x720; FEATURES.md "The side column" draws
  the side content there, which fails it (SI-B4). D3 settles it; until the answer, the documents disagree.
- DESIGN.md "The Whole Message Rule" allows the one-line list name up to 760 px only; FEATURES.md rule 16 names the
  one-line input at every width (owner, 2026-10-22). D4 settles it.
- FEATURES.md "Lists" says the add-to-list row cuts a name to one line; DESIGN.md and batch 9b made it wrap. PW-23
  follows DESIGN.md (the code is right: DESIGN.md, "Overview").
- The orchestrator recommended D2 (a), the head; this plan's measurement recommends (b). The owner chooses.
- The Head Order Rule asks a reserved space for a row that some contents lack; the homebrew head breaks it today in
  Russian from 1000 to about 1139 px. PW-2b fixes it; no spec line changes except the named reserve.
