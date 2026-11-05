# Handoff - TASK 57
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress. Waves 1, 2 and 2b are on `main`; wave 3: 9a and 8 done; batch 9b is implemented and
  verified but NOT committed: `check:fast` fails at its format stage on another session's untracked planner files
  (`issues/57/mocks/{D,N/*,P/burden,T,text}/`, `plan-{D,N,P,T,rebatch,text}.md`; two HTML files do not parse), so
  the commit gate has no credit. 9b's own files pass Prettier.
- Last agent: implementer (batch 9b, 2026-11-05). No subagent runs. No worker has uncommitted code edits.
- NEEDS_HUMAN_CONFIRMATION: no for batch 9b (Q9b-1 and Q9b-2 are answered by the owner; AFK items 17 to 19; M21 and M22 are planner defaults). No for batch N: the owner answered N1 (option A with a visible `h1`), N2 (pills), N3 (heading, pills, then pin and help) and N4 (one head order on every `PageHead` page) on 2026-11-05; its refresh expands `plan-nav.md` into `plan-N.md`. One planner default the owner may overrule: from 761 to 999 px the pills take their own row under the head row (`plan-nav.md` section 4).
- Branch: `claude/57` (worktree `.claude/worktrees/57`)
- Base / starting commit: `d8e30731`; previous sha of batch 9b: `340fa727`.
- Pushed: no. Uncommitted: batch 9b's files (every path in `git status` except `issues/57/context.md`,
  `issues/57/plan-nav.md` and the untracked planner files above, which are the other session's).
- Next step, in order: (0) the other session commits or formats its planner files; then `VITEST_MAX_WORKERS=2 rtk
  npm run check:fast` and the 9b commit (stage 9b's files by name); (1) the orchestrator runs `polish` and `harden` on `ListPage`, `SharedListPage`,
  `RequestsPanel`, `SharePanel` (360, 768, 1180, 1920), dispatches 9b's batch review (trigger: changed UI,
  `tests/app/`, `.impeccable/config.json`, `.prettierignore`), pushes, and waits on CI; (2) batch T's refresh
  (`plan.md` section 7, "Batch T"), then T; batch N follows T and precedes P; (3) batch P, 10; the wave 3 and
  whole-app blind reviews; closeout. DESIGN.md "Proposed rules" now holds the guideline sources (the dispatch
  stopgap of `context.md` item 10 ends).

## Completed
One line per shipped batch. The full acceptance tables, deviations and measurements of batches 1 to 9a are in
`git show c489766a:issues/57/handoff.md` (the Cleanup line under Notes).

- Batch 1 - foundation (fonts, the ten-step ramp, the art well): `9a31aede`, fix `80872b35` (`reviews/1.md`).
- Batch 1b - the no-picture placeholder retired: `fce4a9f8` (`reviews/1b.md`, approve).
- Batch 2 - the shell, the vault-die mark, American spelling: `30de6bf5`, fix `65829261` (`reviews/2.md`, approve).
- Wave 1 (1, 1b, 2): squashed onto `main` as `d83384b4`, merged back as `51370bf8`.
- Batch 3 - the catalog head, filters and selection bar: `ef44bb5d`, fix `cd36b52f` (`reviews/3.md`). Q3-S removed the
  catalog's per-section strip.
- Batch 3b - the hide-and-show header and the focus fix: `38767ca4`, fix `ed7d353a`.
- Batch 4 - the record card, actions, item page, dialog, `/h/`: `91bdcc55`, fix `4cfe9d91` (`reviews/4.md`; 4-R1 deferred).
- Batch 5 - the roll pages and the card face: `9d4f47ec`, fix `da96cbf3` (`reviews/5.md`).
- Batch 6 - the homebrew editor, pages and imports: `96710fe3`, fix `3e0106c8` and `0a43491f` (`reviews/6.md`).
- Batch 7 - search, account, empty and error states: `2c3f3833`, fix `30735930` (`reviews/7.md`).
- Wave 2 (3, 3b, 4, 5, 6, 7): squashed onto `main` as `dbd3cf73`; the post-wave-2 remediation `cd32174d`
  (`reviews/post-wave-2.md`).
- Batch 7b - one tag rule, one-box badges, a steady table head, compact roll results: `d10ffa41`, fix `4874ed63`
  (`reviews/7b.md`).
- Batch W - the page column grows to 1440 px and centers: `8b1bc021`, fix `5566dbf0`.
- Wave 2b (7b, W): on `main` as `b6f153a5`, merged back as `8b99ac8e`.
- Batch 9a - the list pages on a phone: `6703151d`, fix `6f90ccd6` (`reviews/9a.md`, approve).

- Batch 8 - the lists page, list cards, lists import, the add-to-list menu, the stepper and the ceiling (`plan-8.md`,
  previous sha `82dec9d6`). New: `ListFind`'s optional filter props and `beside`, `TextInput`'s `onkeydown`,
  `ListCard`'s `inbox`, cases 102-104, two decision files (the popover, the 300 kB ceiling). Deleted: `BatchBar.svelte`,
  `batchBar.test.ts`, `help.ts` `LISTS`, `DEBT.md` D116 and its section. Acceptance:

  | Line | Outcome |
  |---|---|
  | 1 Head | Done: `PageHead` + `extra`; no sub, no help; `LISTS` and `#/lists ~ help` gone. `listsPage.test.ts` "the head"; case 102 (CI) |
  | 2 «Ещё» of the head | Done: the import item and `PinItem`; no `.homebtn` on `/lists`; DESIGN Same Label sentence and the two FEATURES "Chrome" sentences rewritten |
  | 3 «Новый список» and the field | Done: label «Название списка», Enter/«Создать», Escape/«Отмена», focus in and back, empty name kept; plus icon at both bands |
  | 4 Limit and 150 lists | Done: `listsFull()` toast, field closed, `.count.over`; 150 lists draw 24, «Показать ещё (126)», the bar «Все» ticks 48 |
  | 5 Count line and search | Done: count, `SyncStatus`, «Выбрать»; `ListFind` from 8 with the count in the row from 761 px, under it up to 760 px; no «Ваш аккаунт», `groupAccount` gone, D116 deleted |
  | 6 Card | Done: the chip «Новое в списке (N)» (neutral), «Ещё: <name>» with «Открыть», «Скачать JSON», a separator, «Удалить список»; no red «Удалить»; the link name holds the chip. The 120-character wrap is case 102 (jsdom has no `overflow-wrap`) |
  | 7 Card delete | Done: today's confirm, no undo, focus to the next card's «Ещё», else the previous, else the primary. Deviation 4 on a list another tab deleted |
  | 8 Selection mode | Done: `app.pageBar = listsBar`, focus on «Все», ticks only in the mode, neutral `.picked`, the actions off at zero, «Снять выделение» to «Выбрать», delete keeps the mode, no drawn card leaves it; `hues.js` reads the ticked card; 640x360 and the bar edge are case 102; `BatchBar` files and their `a11y`/COVERAGE rows gone |
  | 9 A-label | Verified, no change: the bar's add button is `AddToList`'s `t.toList` on every page (batch 4 K4); `addToList` is read only by `QuickItem`. Covered by `homebrewBulk.test.ts`, `pickRow.test.ts`, `tables.test.ts` (`openBarMenu` presses «В список») and `sharedListPage.test.ts` (`within(bar)` «В список») |
  | 10 Empty, signed out, failed | Done: three states, goldens `~ empty as gm4`, `#/lists`, `~ load failed`; axe in `listsPage.test.ts` |
  | 11 Import | Done: head toggle or menu item, panel under the head, focus back; skip lines with no raw id, a known record named; closed fold «Пропущено: N»; name-taken line in view; refused codes kept; cases 58-62 and e2e F13 adapted |
  | 12 Not found | Done: two `ErrorPage` branches, one `h1`; `listNotFound`, `listNotFoundSub`, `signInToOpen` removed (no reader); A18 closed |
  | 13 Add-to-list menu | Done: heading «Списки» (also signed out), rows with check, `aria-pressed` on a one-record menu only, the count as the row's description, no gold, 44/36 px rows, «Новый список» button under a separator; popover at every width; cases 1, 2, 3, 22, 23, 27, 37, 42 adapted |
  | 14 Stepper (owner item 8) | Done: `flex: 1 1 auto; min-width: 0` on the input, the 240 px cap kept (AFK item 16); FEATURES "Rolling" area and DESIGN One Width Rule updated; case 104 (CI) |
  | 15 Ceiling (9a R1) | Done: `tools/bundle-budget.mjs`, `.claude/README.md`, the new decision file and the "Amended by" line; budgets not raised (268.3 of 269, 325.7 of 326) |
  | 16 States and cases | Done: inventory entries below, goldens re-seeded, cases 102-104 written; `FIRST_SCREEN` rows `shipped: true`; no case deleted |
  | 17 Parity, detector | Done: `i18n.test.ts` passes; detector 62 findings (67 at batch W), none new in a touched file; no `impeccable-disable` added |
  | 18 `polish` and `harden`, shots | Shots in `mocks/8/built/` (`shoot.js`); `polish` and `harden` are the orchestrator's (a subagent cannot run Impeccable), see Notes |

  CI fix, 2026-11-05: the 2026-10-30 list-pages decision file got the "Amends" line the 2026-09-28 file's "Amended by" needs; `node tools/decisions.js` and the `derived` suite pass.


- Batch 8 departures and deviations:
  1. Two keys beyond the brief: `listOpen` («Открыть», the card menu item: `noticeOpen` and `arrivalOpen` mean other
     things) and `listGoneAs` («Вы вошли как %s.»): the sentence is left out without an email, so it is its own key.
  2. The add-to-list row's accessible name is the list name alone, and its count is its description
     (`aria-labelledby`, `aria-describedby`): a name of "name + count" broke every row lookup and reads the count twice.
  3. The chip «Новое в списке (N)» and «Ещё» sit on two lines of the card, not one as mock 8: the chip is inside the link
     (the plan) and the actions row is after it.
  4. A delete of a list another tab already deleted: no guard was added. The menu leaves with its card, so the stale
     press is only a confirm-time race; `CloudLists.remove` of a gone id enqueues a delete that removes nothing on the
     server. Acceptance 7's second clause holds by the store and the server, with no unit test.
  5. `ListCard` lost `overflow: hidden` (the card's menu opens past it) and its pick box's accent is `--txt`.
  6. Up to 760 px the head's buttons are 44 px tall with 6 px insets and a 4 px icon gap: the RU row is 307 of 313 px
     at 360. At 320 px the primary and «Ещё» wrap under the `h1` together (no text fits: `h1` 120 + 178 px), against
     acceptance 1's "one row at 320"; case 102 holds one row from 360 and the pair's row at 320 (the 9a precedent,
     `HomebrewPage` at 320). `PageHead` lost its round pin rules (no caller draws pin or help in it below 761 px; S10).
  7. Case 104 reads `/roll/wondrous` for the `RollPanel` (no `/roll/eq_weapon` route) and checks the price sheet's
     steppers by their 52 px input and no growth, not by the 133/136 figures of the brief (case 89 logs none).
  8. `ImportPanel`'s name-taken line is a `<p class="taken">`, outside the fold, not a list item.
  9. Found by the local run of case 83: the empty `SyncSaid` region took a grid row and its 14 px gap; it sits before
     the `.stack` now, and up to 760 px the stack's top margin is 8 px and the count under the search row is tighter.
     First screen at 360x640: `#/lists as gm1` 239 of 256 (mock 231), `~ many lists as gm4` 252 of 256 (mock 253), RU
     and EN; 199 of 288 at 1180 (mock 189 and 191).
  10. Found by the local run of case 102: at 320 px a card was 280 px in a 273 px grid (`minmax(280px, 1fr)`); the grid
     takes `minmax(min(280px, 100%), 1fr)`.
- Review: required (trigger: changed UI, `tests/app/`, configuration), report `issues/57/reviews/8.md`, verdict
  fix-then-continue. The one remediation pass (previous sha `c489766a`):

  | Finding | Outcome |
  |---|---|
  | CI `check`: `Chip.svelte` branches 62.5% | Reproduced: `vitest related Chip.svelte --coverage` gave 62.5% (5/8), lines 83-96. Batch 8 removed the last caller of `Chip`'s `busy` (the menu rows are `.lrow` now). Fixed: the dead `busy` prop and its `aria-disabled` CSS are gone; no threshold changed |
  | CI `app/typo` `#/lists` "help" | Stale grip: `/lists` has no help (Q8.1). `EXPECTED['#/lists']` is `[]`; the comment names `ListsPage` beside `SearchPage`. `node tests/run-all.js app/typo` passes |
  | CI e2e F7 «E2E список» | Stale wait: `waitControl`'s `NAMED` read `aria-label`, else the text, and a menu row's text is its name and its count. `NAMED` reads `aria-labelledby` first, as the driver's `NAME_FN`; F8's «E2E ссылки» had the same wait. F10, F13 (`d.tick` opens the mode) and F15 read as written. Not runnable here: CI's `e2e` is the proof |
  | CI `app/states` 54 | Caused by batch 8 (a stale case): the index card says «Новое в списке (N)» and no «N запрос(а) ждёт ответа» line. Reproduced alone through the in-memory loader (both lines failed). The case reads the card's `.listcard-new` chip, (1), then (2) after `shownAgain`; it passes |
  | CI `app/states` 86 | Not batch 8: a timing flake of the slow shard (1414 s). Batch 8 changed no header file (`git diff 82dec9d6 dc132655` of `Shell`, `headerScroll`, `ports/scroll`, `tokens.css`, `App` is empty), and the case passed twice alone. Unchanged; Deferred names it |
  | B1 | Fixed: the `LoadState` branch sits in a plain `<div>`, so «Повторить» keeps its own width; `listsPage.test.ts` asserts that the retry is no grid item of `.stack`. The shots are not re-taken |
  | R1 | Fixed: both `FEATURES.md` "Chrome" sentences as the review wrote them |
  | R2 | Named: CI's `e2e` figure of the tip is the orchestrator's read before 9b |
  | R3 | Fixed: `again: (d) => d.click('Add to list')` on both states, re-seeded (EN menus open). Nine more add-to-list states have closed EN halves (Deferred). The EN shots are not re-taken |
  | R4 | Fixed: the sweep entry opens every `.skips` fold by its summary («Пропущено: N» / "Skipped: N") and throws when it finds none. Not run here: `sweep.js` is CI's |
  | N1 | Fixed: both `gone()` branches pass `said`; `listPage.test.ts` reads the status after the page |
  | N2 | Fixed (one attribute and a test): «Новый список» carries `aria-expanded`; every signed-in `_lists*` golden moves by it |
  | N3 | Fixed: `knownItems(l, byId)` moves to `lib/cloudLists.ts` (its second caller); the add-to-list row counts it, as the card does. `cloudLists.test.ts`; `lists.test.ts` reads «1 позиция» for a list of `w1` (not in the test data) and `ci1` |
  | N4 | Fixed: the signed-out plate centers «Войти» under the lead (`.signedout`, `justify-content: center`) |
  | N5 | Fixed: up to 760 px the name input takes its own line and «Создать» and «Отмена» the next one; `FEATURES.md` "Lists" |
  | N6 | Fixed: the two 2026-11-05 decision files cite no batch, plan line or mock; the 2026-09-28 file gains "Amended by" the 2026-10-30 file, above "- Task" |
  | N7 | Fixed: Status replaced, the deviations in order 1-10, this Review line, the file compacted |
  | N10 | Fixed: «Войдите, чтобы открыть список» / "Sign in to open this list", the sentence kept; `FEATURES.md`, `COVERAGE.md`, `inventory.js`, the tests |
  | P1 | Skipped: the Thumb Rule batch (G1) resizes the same card «Ещё» to 40 px, so a ghost variant now would be done twice |
  | N8, N9, P2, G1-G6 | Left as their `reviews.md` rows say (deferred) |

  The new and changed unit tests failed at `17700f3c` in a detached worktree outside the repo (6 failed: the two
  `said` reads, `aria-expanded`, the retry's parent, the menu row's count, the `knownItems` import); it is removed.

- Batch 9b - the list panels and five guideline rules (`plan-9b.md`, previous sha `340fa727`). Acceptance:

  | Line | Outcome |
  |---|---|
  | 1 Side column | Done: `.lpage`/`.lside`/`.lmain` in `ListPage`; from 1000 px a 330 px plate at the right, first in the DOM; 761-999 above the rows; up to 760 px 9a's `.lhead` unchanged. Case 105, `listPage.test.ts` (side order) |
  | 2 A1 | Done: `.lrows` is the `lrows` size container; under 760 px of it `.lrow-ctl` takes a line under the text (146 px inset). Case 105 at 768; `sweep.js 768` is CI's |
  | 3 Row controls | Done: «Заметка» (dot + hidden «, заполнена») and «Ещё: <name>»; one `rowMore` and one `noteBtn` snippet for the compact and full rows |
  | 4 Note switch | Done: `noteArea` (neutral `Seg` with `filled` dots, caption, one `MarkupField`, «Готово», «Очистить»), GM field dashed, read-only `HitNote`s while closed; `Seg` gained the `filled` option. Unit test across two switches and the buffer; case 107 |
  | 5 Price switch | Done: «Цены:», `Seg neutral`, «Например: ...»; rows, bar total, price sheet, requests panel and roll line all read the list's mode (they already did; the bar and the roll are asserted in `listPage.test.ts`) |
  | 6 Roll panel | Done: «Бросить по списку» button (`aria-expanded`) opens a `Panel` with `h2`; `RollResult` in a `faces` container, the count/price line, both notes, «Показать в списке» (scroll, 1.5 s flash, focus). Deleted: the `<details>`, `.lroll`, `.panel` copy, `OrGrid`/`RecordCard`/`RecordActions` use here. Kept (other readers: `record.test.ts`): `RecordCard`'s `compact` variant and `nameActions`, `RecordActions` `sendAll` (Deferred) |
  | 7 Share panel | Done: `h2` «Поделиться», two labeled rows with one muted line each, «Скопировать» plain, «Удалить ссылку» bare in the danger color; `shareHint` kept (the two lines do not say that a deleted link stays deleted) |
  | 8 Requests | Done: folded per visit (`folded`), head button «Открыть»/«Свернуть»; the five columns with `th scope=col` («Позиция» added: a name column needs a header); `reqShortLine`; «без цены»; the total with the plural; marks read only while open; the arrival focus opens it. `totalParts` unchanged (the bar keeps its form) |
  | 9 `HitNote` / A22 | Done: full `--line2` box, `gm` dashed on `--bg2`, no gold; `/s/` GM notes use `gm`. Detector: no `side-tab` on `HitNote` |
  | 10 E2 | Done: the 2 px gap line (`::before`/`:last-child::after`); `.lrow` no longer clips (`overflow: visible`, the first cell takes the corners); the `side-tab` entry is gone; cases 17 and 33 adapted and pass |
  | 11 E4 | Done: one edit with the hook live and one `impeccable detect --json app/src`: `config.json` byte-identical; it holds no `ignoreValues`; the `.prettierignore` line and its comment are gone; `prettier --check .impeccable/config.json` passes |
  | 12 Q9.1 | Done: no «?» on `/lists/<uuid>`; the three help states and goldens deleted; `FormField` has no `help`; `QuickItem`'s «?» gone; `moneyHelpFor` and its test deleted. `HelpButton`/`HelpBox` stay (callers: `PageHead`, `RollPage`, `TablesPage`); rule 15 (c) and rule 18 changed |
  | 13 Icon centers | Partly: `typo.js` `SWITCHES` gained the gold «2» chip of `#/tables/eq_weapon/f_tier-2` (column and sheet). The note and price switches need an account list, which the `SWITCHES` loop cannot make: not added (Deferred); `/search`'s kind row not added either |
  | 14 Row Text | Done: no `70ch`; clamp 3 / 2 / 3; DESIGN.md "The Row Text Rule" and "The One Width Rule", FEATURES.md "Tables and search"; the decision file; case 106 (shares under Verification) |
  | 15 Field Measure | Done: `max-width: 720px` from 761 px in `SearchPage`, `TablesPage`, `HomebrewPage`, `ListsPage` (the new-list name field: the plan named it; `/lists`' search is `ListFind`), `ListFind`; case 106 (g) |
  | 16 Stepper | Done: 480 px cap; case 104's `min(480, col)` and the list roll's content width; case 101's cap moved to 480; the 240 px sentences left DESIGN.md and FEATURES.md |
  | 17 Check | Done: `Chip` (button form) and `Seg` draw the check on every pressed option; `chip.test.ts`; goldens unchanged by it (the icon is `aria-hidden`) |
  | 18 Whole Message | Done: `AddToList`'s `.ln` wraps (`lists.test.ts`, 120 characters); the `typo.js` step at 1180 with the allow-list (row description, compact name and line). 360 is not read (Deferred) |
  | 19 Proposed rules | Done: DESIGN.md "Proposed rules" after "Do's and Don'ts", the Stat Columns Rule included |
  | 20 Nine add-to-list `again`s | Done; their EN goldens hold the open menu (checked on `_i_ci1_new_list.txt`, `many lists`, `bar menu`) |
  | 21 8-N2 | Kept: no `_lists` index golden moved |
  | 22 9a R2 probe | See Deferred (the numbers) |
  | 23 Monospace labels | Done: `.lnote`, `.lroll`, `.money-l` gone; `.batch-lbl` already used `var(--ui)` |
  | 24 `FIRST_SCREEN` | Partly: four rows `shipped: true` and pass; `/s/ ~ long name` kept at `shipped: 360` (312 at 1180, Deviation 3); the requests row asserted with a 324 px exception at 360, named in DESIGN.md |
  | 25 Wide lines | Done: W2 (case 105 at 1920/2560), W3 (`/s/` one column), W4 (case 105), W6 (shots), W7 (DESIGN.md "Layout"); W1 by M18 |
  | 26 New states | Done: `~ note open`, `~ note open, gm`, `~ list notes open`, `~ row menu`, `~ prices in coins`, `~ mid band` (gm4), `SHOP ~ requests open`, `GM2_LIST ~ notices open`; `~ rolled` and `~ roll panel` reused; axe on each is the unit tests' (`listPage.test.ts`, `requestsPanel.test.ts`), not a browser axe case |
  | 27 Parity, detector | Done: `i18n.test.ts` passes; detector 60 findings (62 before), none new in a touched file; no `impeccable-disable` |
  | 28 `polish`/`harden`, shots | Shots in `mocks/9b/built/` (`shoot.js`); `polish` and `harden` are the orchestrator's |
  | 29 Budget | See Verification |
  | 30 Line height | Done: 1.55 from 1000 px; case 106 (h) |
  | 31 `/s/` tail and note | Done: `.rtail` `--muted2`, mono, tabular; the GM box without gold; case 106 (i) |
  | 32 Deferred rows | Done: the bare «1» and the stat columns rows are in Deferred |

- Batch 9b deviations:
  1. Dict: `noteKind` («Чья заметка», the switch's group name) and `reqItem` («Позиция», the name column's header) beyond
     the brief; `noteEdit` reuses `edit`, `noteForPlayers`/`noteForGm` reuse `notePub`/`noteHid`, `noteClearText` is the
     shortened `noteClear` («Очистить»). Deleted: `requestOf`, `notePubHint`, `noteHidHint`, `mdHelp`, `moneyAs`.
     `unpricedN` stays (the selection bar's total).
  2. Plan state ids: the 761 px row menu is `~ row menu as gm4` (`~ row more as gm4` is the 360 compact state); the
     book-units state is the existing `~ noted` and the new one is `~ prices in coins`; the requests states live on
     gm1's shop (`SHOP ~ requests as gm1` now folded, `~ requests open as gm1` new).
  3. `FIRST_SCREEN`: the requests row (gm1's shop: the folded strip and the search row of its 10 entries) measured
     324 px at 360x640, so its exception is 324 and DESIGN.md "The First-Screen Rule" names it (owner's figure 292;
     the AFK log entry is the orchestrator's). `#/s/player-token-1 ~ long name` stays `shipped: 360`: from 761 px
     the name takes three lines and the first entry starts at 312 of 288 at 1180x720 (logged, not asserted).
  4. Case 106 (b) measures a clamped box against its row's content edge, not its last line (a multi-paragraph
     description ends lines early by content); case 107 leaves the page and comes back instead of a reload (the
     fake cloud lives in the page).
  5. Found by case 65: at 360 the five request columns pushed the page sideways; up to 600 px the insets narrow and a
     name and a price wrap (`RequestsPanel.svelte`).
  6. The sweep entry opens the list notes and a row's note area (360 and 761+); the requests panel at 360 is not in
     the sweep (gm1's shop holds no request on arrival).

## Verification
- Batch 9b, 2026-11-05 (previous sha `340fa727`; vitest with `VITEST_MAX_WORKERS=2`):
  - `svelte-check`: 0 errors. Vitest `listPage` 134 pass (40 adapted: the side column, the note area, the row «Ещё»,
    the price switch, the roll panel); `requestsPanel` 37 (+1); `sharePanel`, `sharedListPage`, `chip`, `quickItem`,
    `i18n`, `help`, `plural`: 272 pass together; `lists` and `listPage.timed`: 39 pass.
  - Goldens: `build:test`, the four shards with `--update` (shard 1 failed once on the three stale help goldens,
    removed; shard 4 once on `SHOP ~ own item preview` pressing the seventh «Просмотр», fixed and re-seeded with
    `--only`). 67 files: 3 deleted (the help states), 8 new, the rest changed (`_lists*`, `_s_gm_token_1_saved`, the nine
    add-to-list states' EN halves, `#/lists/...201` notices).
  - Browser cases through the in-memory loader (`scratchpad/states-only.cjs`, the `CASES` list filtered) on the final
    `dist-test/`: 13, 17, 18, 22, 30, 33, 56, 64, 65 (after the Deviation 5 fix), 69, 76, 100, 104, 105, 106, 107 pass;
    83 passes after the two `FIRST_SCREEN` changes of Deviation 3 (list page 210 / 139, `~ many` 254 / 139, `/s/` 301 /
    275, the requests row 324 / 209 at 360 / 1180).
  - Case 106 clamp shares, RU then EN, 1180 / 1440 / 1920: `/search ~ searched` 12.2 / 9.9 / 9.2 and 10.7 / 8.4 / 8.4;
    `~ capped` 2.1 / 1.4 / 1.4 and 1.4 / 1.4 / 1.4; `eq_weapon` 6.5 / 5.1 / 4.8 and 5.4 / 3.9 / 3.7; `wondrous` 0.8 every
    width; `hnf_consumable` 0; `voa` (logged) 61.8 / 36.8 / 34.7 and 40.3 / 25.7 / 23.6; `/s/player-token-1` (logged,
    10 rows) 20 / 10 / 10 and 10 / 10 / 10. The 1.55 line height is kept (no first-screen top moved).
  - E4: `npx impeccable detect --json --no-config --no-inline-ignores ListPage.svelte HitNote.svelte`: `[]`; one edit
    with the hook live and `impeccable detect --json app/src`: `config.json` byte-identical (`cmp`), 60 findings (62
    before), none new in a touched file (the old 11 px / 7 px radii); `prettier --check .impeccable/config.json` passes.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0 after the last edit. `node tools/decisions.js`: 314 decisions.
  - `rtk npm run check:built`: pass, 268.0 kB within 269 (unconfigured); no budget raised.
  - `VITEST_MAX_WORKERS=2 rtk npm run check:fast`: FAIL at the format stage, only on the other session's untracked
    files. Its later stages run by hand: `node tools/check/run.mjs --only=typecheck,test:golden` pass (23 s); the
    `vitest related` of the plan's 27 test roots with coverage on the 19 changed sources (`VITEST_MAX_WORKERS=2`): 80
    files, 2929 of 2932 pass on the first run; the 3 failures fixed (`a11y.test.ts` pressed the old roll summary,
    `shell.test.ts` now opens the folded requests panel before the read, `listPage.timed.test.ts` scopes its role
    queries to the bar: 27.4 s to 4.8 s alone) and their files rerun: 157 pass. The budget stage: `check:built` above.
  - Commit gate, 2026-11-05: planner mock files formatted and committed apart as `18855ed`; two stray `</html>` tags
    removed from `mocks/N/headorder/index.html` and `mocks/N/index-N.html`. `VITEST_MAX_WORKERS=2 rtk npm run
    check:fast`: first run failed on the branch threshold of `app/src/lib/help.ts` (83.33 of 85) after the money
    help and its test left; `help.test.ts` got one test for `isBold` and `isLink` on all three part kinds. Second
    run: exit 0 (format, svelte-check 0 errors, golden stage, vitest 80 files, 2932 tests, coverage thresholds).
  - Shots: `mocks/9b/built/` (`shoot.js`): the list page, its notes, prices, roll, share, requests, row menu, `/s/`,
    `/search`, the catalog's gold chips, `/roll/std`, at 360 / 1180, a few at 768, the wide set at 1920 / 2560.
  - Not run here: `typo.js`, `sweep.js`, `app/contracts`, `app/print`, `app/hues`, case 101 and the rest of
    `app/states`, `e2e` (F8, F12, F19 adapted): CI's.
- Batch 8 remediation, 2026-11-05 (previous sha `c489766a`, not pushed; vitest with `VITEST_MAX_WORKERS=2`):
  - Reproduced first: `npx vitest related .../Chip.svelte --run --coverage --coverage.include=app/src/components/Chip.svelte`
    (40 files, 1621 tests, 774 s): branches 62.5% (5/8), the CI error. Case 54 failed alone on the in-memory loader
    (`scratchpad/states-only.cjs`, the `CASES` list filtered) with both CI lines; case 86 passed alone, twice.
  - Vitest `listsPage`, `listPage`, `lists`, `lib/cloudLists`, `chip`: 273 pass. At `17700f3c` (detached worktree, the
    four changed test files copied in): 6 fail, 259 pass.
  - Goldens: `build:test`; `golden.js --update --only=#/lists` (86 states, 27 files move: the `[expanded=false]` of
    «Новый список» on every signed-in `_lists*`, and on the two not-found pages the new title and the status line);
    `--update` of `#/i/ci1 ~ list menu as gm1` and `~ in several lists as gm4` (EN menus open). Compare-only, unchanged:
    `--only=list menu` (3), `add to list` (2), `bar menu` (1), `from a list` (2), `#/i/ci1` (15).
  - Loader runs on the final `dist-test/`: cases 54, 86 pass; 54 and 102 pass after `check:built`.
  - `node tests/run-all.js app/typo`: ok, 189 s.
  - `npm run lint:untyped`, `npm run lint:typed`: exit 0 after the last edit. `npx prettier --list-different` on the
    changed files: clean after `--write` of `tests/e2e/flows.mjs`. `node tools/decisions.js`: 313 decisions.
  - `rtk npm run check:built`: pass, 268.3 kB within 269. Detector `npx impeccable detect --json --no-inline-ignores
    app/src`: 62 findings (62 before).
  - `VITEST_MAX_WORKERS=2 rtk npm run check:fast`: PASS in 744 s (vitest 94 files, 3757 tests, 678 s, coverage on the
    changed sources including `Chip.svelte`; budget passed), gate credit armed.
  - Not run here: `sweep.js` (the R4 fold step), `app/contracts`, `app/print`, `app/hues`, the rest of `app/states`,
    `e2e` (F7, F8): CI's. The `lists-error`, `lists-signedout`, `lists-new` and EN `item-listmenu` shots are not
    re-taken.
- Batch 8, 2026-11-05 (previous sha `82dec9d6`):
  - Vitest, the whole suite once mid-batch: 129 files, 4733 tests pass; after the last edits `listsPage`, `listPage` and
    `importPanel`: 234 pass. `svelte-check`: 0 errors. `npm run lint:typed` and `npm run lint:untyped`: exit 0 after
    the last source edit. `node tools/decisions.js`: 313 decisions. `node tests/run-all.js contracts,dataint,derived`:
    pass. `node --test tools/artwork/lib.test.mjs`: 77 pass.
  - Goldens: `build:test`, the four shards with `--update` (shard 1 failed once on the stale `_lists_help.txt`, removed),
    then `--only=#/lists` once more after the spacing fix (86 states). 43 files move: 36 changed, 6 new
    (`~ card menu`, `~ empty as gm4`, `~ more`, `~ new list`, `~ selecting`, the signed-in not-found), 1 deleted
    (`~ help`); every one is a `_lists*`, an add-to-list menu (`_i_ci1*`, `_tables_a_row_opened*`, `_tables_bar_menu`,
    `_roll_std_list_menu`, two `_homebrew*`) or the import.
  - Browser cases run locally through an in-memory loader of `states.js` (the `CASES` list filtered), on the final
    `build:test`: 1, 2, 3, 22, 23, 27, 37, 41, 42, 58-62, 66, 79, 83, 89, 101, 102, 103, 104 pass. They found three
    defects, fixed here (deviations 6, 9, 10) and case 62's two reads of the bar's buttons through `d.text()` (the bar sits
    outside `main`). `node tests/app/hues.js`: pass, with the new ticked list card read.
  - `npm run check:built`: pass, 268.3 kB of 269 unconfigured. Configured (the `.env.test.local` line of
    `.claude/README.md`, with the main checkout's file): 325.7 kB of 326. No budget raised; ceilings now 300 and 350.
  - Detector `impeccable detect --json --no-inline-ignores app/src`: 62 findings, none new in a touched file (the
    touched files carry only the old 11 px and 7 px radii).
  - `rtk npm run check:fast`: the first run failed on `listPage.timed.test.ts` (56 s under the parallel load against
    its 30 s timeout; 11.4 s alone, 10.8 s at 9a: host load, not this batch); the second run PASS in 758 s (vitest 2918
    pass, budget within 269 kB), gate credit armed.
  - Not run here: `sweep.js`, `app/contracts`, `app/typo`, `app/print`, the other `app/states` cases and `e2e` (F7, F8,
    F10, F13, F15 adapted; hosted project): CI's.

## Next batch (implement-ready)
- Name: batch 9b's review (required: changed UI, `tests/app/`, `.impeccable/config.json`, `.prettierignore`), then
  batch T's refresh (the Thumb Rule and the toast timing; `plan.md` section 7, "Batch T"), then T, N, P and 10.
- What CI must prove for 9b: `app/states` (cases 105-107 new; 13, 17, 18, 22, 30, 33, 56, 64, 65, 69, 76, 83, 100,
  101, 104 adapted), `app/typo` (the gold chip in `SWITCHES`, the Whole Message step), `sweep.js` 360 and 768 (the new
  notes entry), `e2e` F8, F12 and F19 (the note switch, the folded requests panel, the row «Ещё»), the goldens, the
  bundle budget.
- Facts for the dispatches: the local gates are the affected vitest files, both lints after the last edit, the golden
  re-seed when goldens move (each shard with the Bash timeout 600000), `npm run check:built`, the detector, and
  `rtk npm run check:fast` last; browser suites and sweeps run on CI. `ci-credit.mjs` refuses while a writer's edits
  are in the tree. The budget after batch 8: 268.3 of 269 kB unconfigured, 325.7 of 326 configured (ceilings 300 and
  350). On this host `VITEST_MAX_WORKERS=2` bounds vitest's workers (vitest 4 reads it). The owner keeps Chrome open
  and signed in to Figma for batch P's burden export. A golden is re-seeded, never edited.

## Blockers
- None.

## Deferred
- 9a R2 probe (run in 9b, 360x640 RU, `LIST_A ~ noted as gm4`): the list «Ещё» at top 141 and scroll 0; opening its
  menu scrolls to 83 and the shown header covers «Ещё» (top 58); Escape returns the focus and the page to scroll 0;
  a tap outside leaves scroll 83 with «Ещё» covered. A `preventScroll` focus return cannot cure the tap path (no focus
  returns there): not taken. The same family as the focus jump below; at closeout to `DEBT.md` unless batch T fixes it.
- Batch 9b leftovers with other readers: `RecordCard`'s `compact` variant and `nameActions`, the `.card.compact`
  rules, the `REVIEW_ART_SIZES` rows for 132 and 96 px and `RecordActions`' `sendAll` row: no page draws them since
  the list roll took `RollResult`; `record.test.ts` still reads them. Batch 10's audit removes them with their tests.
- Batch 9b, `typo.js`: the note switch and the price switch are not in `SWITCHES` (the loop opens a route and cannot
  make an account list); `/search`'s kind row is not either; the Whole Message step reads 1180 only, not 360.
- Batch 9b: the requests panel keeps its gold frame and tint (`.reqpanel`); mock 9 draws a plain plate. A Seal Rule
  question for the review.
- `/s/` shows the bare list position «1» where `/search` shows «№ 89» (critique, 2026-11-05; `plan-9b.md` M21 d): two
  different numbers, «№ 1» costs three characters of the name column at 360 px. Not changed; batch 10's audit may
  revisit it.
- Tabular stat columns on table rows from 1440 px (owner, 2026-11-05, `plan-9b.md` M22): a "Proposed rules" row, built by
  its own task after wave 3 with a mock first (`plan.md` section 12).
- Batch N, copy in the touched heads (critique N-7, `plan-nav.md` section 6): the `/roll/mwt` lead «Выберите мир и бросьте
  кость по нему.» is an instruction sentence (Clarity Rule; proposed fix: no lead); «корника» in the `/roll/std` lead
  needs the `daggerheart-ru-terms` skill (the help text uses it too); the gold-outlined «ИЛИ» dividers of the roll
  pages (Seal Rule, pre-existing). Batch 10.
- Case 86 "after the slide" (CI run 42020997138, shard 3 at 1414 s): the header read mid-way (top -54.3, bottom 56.9)
  after the filtered `transitionend`; it passed twice alone on 2026-11-05. If it recurs, log each `transitionend`'s
  `elapsedTime` and target before the read.
- Add-to-list states whose EN half holds a closed menu (the 8-R3 shape): `#/i/ci1 ~ many lists as gm4`, `~ new list`,
  `~ new list as gm2`, `~ new list from a search as gm2`, `#/tables ~ a row opened, list menu as gm4`, `~ a row
  opened, new list`, `~ bar menu as gm4`, `#/homebrew ~ add to list as gm1`, `#/homebrew/<HB_AXE> ~ add to list as
  gm1`. Each needs an `again` that repeats its enter's presses; it rides 9b's re-seed (placed: `plan-9b.md` S13.2,
  acceptance 20).
- 9a, found by the golden of `LIST_A ~ more`: at 360x900, after the list «Ещё» opens and closes, the page sits at
  scroll 83 and the shown header covers that «Ещё» (a press lands on the job row); the header hides only past its own
  height. The golden reopens from the top (`reopen` in `inventory.js`). The same family as the focus jump below.
  Review 9a R2: its probe (360x640 RU on `LIST_A ~ noted`: open «Ещё», close by Escape, then by a tap outside, read
  `scrollY`) was not run in the 9a fix pass; batch 9b takes it (`plan-9b.md` S8 step 10, acceptance 22), else
  `DEBT.md` at closeout.
- W-N4 (batch W review): the `tests/run-all.js` weight for `app/states` (179.3 s) is stale; case 101 opens 74
  contexts, up to 3840x2160. Re-measure it from the CI run of the tip.
- `/tables/eq_*` at 761-about 800 px in RU (batch 7b probe): the toolbar's five controls wrap to two lines, so the rows
  start at 381.5 px against 333.5 on the other tables. Case 96 reads 760 and 1050, not 761. Not fixed: the hidden
  toolbar slots were not built (Completed, "Batch 7b", deviation 3).
- The `--inject` model run of `roll-probe.cjs` was not repeated on the build of `377d0981`; the planner's production
  numbers stand for the model.
- `404.html`'s look (pw2-N1, the reviewer's deferred-scope half): it keeps the system font and draws no die mark;
  the words, the `h1` and the actions now match the app. A self-hosted font on a script-free host page needs its own
  `@font-face` path; batch 10's lock is the place to decide it.
- `/search` at 320x568 RU (batch 7 remediation probe): after a kind is picked in the sheet and the sheet closes,
  `scrollWidth` is 313 against a `clientWidth` of 305, and a probe that hides one element at a time finds the
  header's tab links. Case 93 checks no sideways scroll before the sheet opens, where it passes. Not investigated.
- 6-N1 (the next batch with a golden re-seed): add an editor entry with a 120-character name as the fourth
  `FIRST_SCREEN` row, or log its 1180 offset from one probe. From 761 px the `h1` takes three lines, so the
  offset at 1180 is unmeasured (about 240 of 288 by the review's estimate).
- `reviews/6.md`, "Checks still needed", item 3: the homebrew selection bar at 640x360 and at 768x1024.
- `reviews/5.md`, "Checks still needed", items 3 to 5 (not measured here): the first `/roll/alt` card's
  menu at 360x640 with 7 or more lists at scroll 0; a right-column card's menu at about 1015-1075 px with
  a long list name; Tab and Enter on the nine routes at 360.
- 4-R1 (wave 2 blind review; the owner's choice): at 360x640 «В список» ends inside the first screen
  on 21 of 98 sampled records at the 4:3 crop (median bottom 693 px, worst 908 px). No device above
  760 px is affected. Current behavior: on a phone the primary is below the fold on most records.
  1. Recommended: keep the page, and let a reader scroll. The text starts in the first screen on
     almost every record. Trade-off: adding to a list from a long record takes a scroll.
  2. A sticky «В список» on the page up to 760 px, like the dock. Trade-off: it covers about 62 px of
     text on every record, and it adds a new surface rule.
  3. 16:9 up to 760 px. Trade-off: it reaches half of the records, and it changes M4-4.
- P5 (batch 4, K11): `rollNo` («номер» / "roll") stays; batch 10 changes it with `tools/share-card.mjs`
  and the stubs after a plan review (`plan.md`, batch 10).
- Toast over «Ещё» (batch 4): at 360 an action toast covers the end of the menu for its 7 s; a second
  save by touch waits for it. Batch 8 decided no sheet (`plan-8.md` L12), so it stays, and it now also covers the
  end of the add-to-list popover; batch T measures it with the new toast durations (`plan.md` section 7, "Batch T");
  at closeout it goes to `docs/specs/DEBT.md` unless a later batch fixes it.
- Batch 8 (`plan-8.md`): the signed-out add-to-list menu keeps its two steps (L13); the `HomebrewPage` search row
  keeps its own `.tools` beside `ListFind` (L8).
- `RecordCard`'s dialog art at 500-760 px wide and 481-560 px tall: a 4:3 picture can fill the card, so
  the dock is not in view until a scroll (sticky holds inside `.card-body`). No phone portrait reaches it.
- Focus jump (batch 3b, measured facts item 3): a `focus()` on a header control moves the page up
  (scroll 1500 to 1199 at 320 px, to 1115 at 1180 px; 900 to 558 at 360 px with the fix). An
  existing defect, harmless for the hide: the upward move shows the header.
  `{ preventScroll: true }` fits only a control always in view, and `Menu` also serves controls
  that scroll away, so the fix needs its own look. At closeout it goes to `docs/specs/DEBT.md`
  unless a later batch fixes it.
- 2-R1 (answered for batch 3 on): the orchestrator-run `polish` and `harden`
  of section 10, "Impeccable". The batch 2 shell components still had a manual
  pass only; the post-release Impeccable audit is the backstop (with the C34 and
  A15 live-site toast check).
- 2-R3 (batch 10 audit): from 761 px the header draws brand, jobs, language,
  account while the DOM order is brand, language, account, jobs (WCAG 2.4.3).
  Recommended: name the trade-off in DESIGN.md "Navigation", "Header", and let
  the audit decide.
- 2-N6 (batch 10): DESIGN.md "The Same Label Rule" and FEATURES.md "Chrome" say
  "until their page's batch moves them"; batch 10's lock removes it.
- R5 of `reviews/plan-1-3.md` (deferred-scope): `review.prompt.md` names a third
  look `<name>-2.md`, while `agent-guard.mjs` reads only `plan-<batch>-<n>.md`.
- Batch 10: the tab and picker CSS copied into `HomebrewTabs` from `TableNav` (H2); `EQ_DT`'s abbreviations
  in the stat line (D15, shared).
- Batch 9b: `FormField`'s `help` prop and its `HelpButton` import go with `QuickItem`'s «?», the last caller
  (placed: `plan-9b.md` S11, acceptance 12). The ListPage monospace labels below: acceptance 23.
- Batch 3 candidate: the 1180 px equipment column table of mock 3 (D6, Q3-T), if
  the owner says yes; one added item with its own mock check.
- N0-2 of `reviews/mocks-2.md` (batch 4): the error-page pattern's circled icon
  is a template shape; keep the heading, the cause and the action.
- `KeepNote.svelte` leaves with batch P (the Account page's Display note left with batch 7).
- The link-preview Worker's card images (`tools/share-card.mjs`).
- The EN `<title>`, manifest name and `en/index.html` wordmark.
- Uppercase controls outside the capitals rule are audited by their surface
  batches (15 components carry `text-transform: uppercase`).
- Monospace labels still outside the Key Characteristics rule, owed to their
  surface batches: `.ordiv i` (OrGrid), `.altcol`
  (TablesPage), the ListPage summary labels (`.lnote`, `.lroll`, `.batch-lbl`,
  `.money-l`), HelpButton, `.steps-l` (RecordCard).


## Notes
- Mocks path: `issues/57/mocks/<N>/`; built shots in `mocks/<N>/built/` (`shoot.js` per batch).
- Impeccable `polish` and `harden`: the orchestrator runs them per batch (a subagent cannot); batch 8's outcome is in
  `reviews/8.md`, "polish and harden outcome". Earlier outcomes are in the pre-collapse handoff.
- Planner defaults D1-D13 of batch 3: `plan.md` section 10, "Decisions of this refresh".
- Scratch to retire at closeout, not before: the worktree `.claude/worktrees/57-fold` (branch `claude/57-fold`,
  merged); `issues/57/mocks/measure.mjs`; the print evidence and the mock P worktree at
  `C:\Users\Ignat\.dhloot\notes\57\`.
- Owner rules this session: "proceed autonomously"; the unconfigured ceiling is 300 kB; phone feedback goes to
  `context.md` "Phone feedback"; AFK defaults go to `C:\Users\Ignat\.dhloot\notes\owner-afk-2026-11-03\decisions.md`.
- Cleanup performed / retained artifacts: compacted on 2026-11-05 (142 KB against the 150 KB line): Completed is one
  line per shipped batch, Verification holds batch 8, Notes hold current state. The last pre-collapse commit is
  `c489766a` (`git log --oneline -3 -- issues/57/`: `c489766a`, `17700f3c`, `dc132655`);
  `git show c489766a:issues/57/handoff.md` holds the full tables and every measurement.
- Session end partial progress (if any): none
- Durable items written to their homes this pass: `FEATURES.md` "Chrome" (help and pin) and "Lists" (the menu count,
  the name field up to 760 px, `aria-expanded`, the not-found title); `COVERAGE.md` (the not-found title); the
  decision files of 2026-09-28 ("Amended by") and 2026-11-05 (two).
