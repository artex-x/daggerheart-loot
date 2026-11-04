# Batch 7b - One tag rule, one-box badges and a steady table head (implement-ready, wave 2b)

This brief is the implementer's whole input for batch 7b: the owner's phone feedback of 2026-11-04
(`context.md`, "Phone feedback", items 1-3, the lean, the refinement, the answer and the confirmation), the
desktop feedback of the same day about a table head that jumps (item 5, step T9) and the desktop feedback about
roll results that do not fit the screen (item 6, step T12). Batch 7b is its own batch with
its own small squash onto `main`, "wave 2b" (`plan.md`, sections 7 and 16). It runs right after the post-wave-2
remediation and before batch 9a. Section numbers ("section 7") are those of `plan.md`. The code facts were read
on `10a47edc`. The post-wave-2 remediation edited `RecordCard`, `TableRows` and `TablesPage` after that, so the
dispatch re-reads every file this brief names (see "Dispatch preflight").

## Owner decision

Owner, chat, 2026-11-04: the owner asked whether the tag batch can come "in post-wave-2 remediation next batch,
to start wave 3 clean". Orchestrator's reading, taken as the decision: batch 7b runs right after the post-wave-2
remediation, a wave 2b squash puts it on `main`, and batch 9a then starts on a clean `main`. This replaces the
earlier plan to fold the brief into batch 9a. Batch 7b writes its own decision file and its own `Supersedes`
lines (T8). Batch 9a builds on the rule and no longer carries any of it (`plan-9a.md`, "From batch 7b").

## Dispatch preflight

- `git fetch origin`; merge `origin/main` into `claude/57` if it moved (a merge, never a rebase).
- Batch 7 and the post-wave-2 remediation are on the branch. Read `git log --oneline -12`, then `git diff 10a47edc
  HEAD -- app/src/components/RecordCard.svelte app/src/components/RowMain.svelte
  app/src/components/TableRows.svelte app/src/components/TablesPage.svelte app/src/components/TableNav.svelte
  app/src/components/PageHead.svelte app/src/components/Badge.svelte app/src/lib/rowTags.ts app/src/lib/label.ts
  tests/app/states.js tests/app/inventory.js`. Line numbers in this brief ("about line 246") are approximate. A
  line that no longer matches is the implementer's to adapt, and `handoff.md` names the change.
- No mock: the rule changes surfaces that mocks 4, 5, 7 and `F` already drew, and the owner confirmed it in chat.
  The screenshot set (T11) is evidence for the batch review.
- Impeccable cannot run from a subagent. The orchestrator runs `polish` and `harden` after T9 on `RecordCard`,
  `RowMain`, `TableRows`, `TablesPage`, `TableNav` and `Badge`, from the built app at 360 and 1180 px; fallback
  `impeccable:impeccable-finish-reviewer`.
- Tier: `opus` (writer tests 1 and 3 below). Steps are T1 to T13, run in the order T1-T7, T9, T13, T12, T8, T10, T11
  (T8's prose and decisions describe what T9 and T12 built). The line "Session end partial progress" in
  `handoff.md` names the last finished step.
- The post-wave-2 remediation may also touch `RollResult`, `OrGrid`, `RollPanel` or `RecordCard`'s face rules: add
  `app/src/components/RollResult.svelte app/src/components/OrGrid.svelte app/src/components/RollPanel.svelte` to the
  `git diff` above before T12.

## Objective

A reader sees the relation lines and the default book's tag where they help, on the full record card, and
nowhere else; every badge draws as one clean box; and the table head stays where it is when the reader moves
between tables. Concretely: «Получается из», «Улучшается до», the set line «Комплект» with its bonus, and the tier
ladder «Ранг» draw only on the full record card. The «Core» tag draws only there too. Another book's tag and every
homebrew tag draw where they draw today. A badge never splits into fragments: the «Хоумбрю» badge in a relation
line keeps clear of the lines around it and stays on its name's line, and a grid tile's «ОСНОВНОЕ ОРУЖИЕ» is one
pill. On `/tables/*` the title row, the group chips, the second-level tabs, the toolbar and the first list row
start at the same Y on every table of the same band. On the roll pages a roll of one, two or four results shows
every result's name in the first screen at 1180x720, and the whole roll on the owner's 1919x980 window (T12).

## The rule (stated once; the decision files and DESIGN.md take this text)

Owner, 2026-11-04: "consistency first"; "on record card dialog we also can show them, don't show only on compact
representation"; "yeah let's make it consistent".

- **The full record card** is `RecordCard` with `variant="full"`: the record page `/i/<id>` (`RecordPage`), the
  homebrew item page `/h/<uuid>` (`ItemPage`), the record dialog (`RecordModal`) - these three are `dossier` -
  and the homebrew editor's preview (`HomebrewEditor`, not `dossier`). **A compact representation** is every
  other record surface: a roll result (`RecordCard variant="face"`, `RollResult`), the list page's roll result
  (`variant="compact"`, `ListPage` until 9b moves it to `face`), a row (`RowMain`: tables, search, `/homebrew`,
  `/lists/<uuid>`, `/s/`), a grid tile (`TableRows` grid) and, when batch 9a adds it, the compact row of a list
  (`CompactRow`) with its unfolded `RowMain full`. Print, the copied text and the share stubs are not screen
  surfaces and do not change.
- **R1. Relations** - «Получается из», «Улучшается до», the set line «Комплект», the set bonus and the tier
  ladder «Ранг» - draw on the full record card only, at every width. A compact representation draws none of
  them, and nothing in their place.
- **R2. The «Core» tag** (`srcLabel` gives «Core»: `src === 'core'`, no `frame`, no `realm`) draws on the full
  record card only: the dialog's source badge and the page's path line «Core · ...». No compact representation
  draws it: the default book is unmarked. This widens today's equipment-table rule (`hiddenTags().core`) to
  every compact surface.
- **R3. Another book's tag** («Hope & Fear», «Vault of Ages», a frame, a community, a realm) draws where it
  draws today: on a row by `hiddenTags` (hidden on a one-book table or under one picked book), on a roll result
  in its badge row, on the full card.
- **R4. A homebrew tag** draws where it draws today: the source tag «Хоумбрю» or «<source> (HB)» on rows
  (hidden on `/homebrew`, whose group head says it) and on cards; the «Хоумбрю» badge after an own name in a
  relation line, which by R1 is now on the full record card only.
- **R5. A badge is one box.** It never splits into fragments across lines. A label longer than its room wraps
  inside its own border. In running text it stays on the line of the word before it and keeps at least 2 px from
  the boxes of the lines above and below.
- **R6. The table head is steady** (step T9; owner, 2026-11-04, about 19:10). On `/tables/*` the geometry of the
  head is a function of the viewport band only, never of the table.
- **R7. A roll result is as tall as its line allows** (step T12; owner, 2026-11-04, about 19:30). A result draws the
  tall face (the 4:3 picture above the text) only while the whole roll sits on one line: one result, at most 380 px
  wide, or two side by side, in a results column of at least 641 px. Otherwise every result of the roll draws the
  row face, the picture beside the text, which phones draw today. Up to 600 px nothing changes.

Reason: the owner judged the relation lines and the default book's tag not valuable enough on a compact
representation at any width, and asked for one consistent rule. The full record card is one press away on every
compact surface: a row opens the dialog, a roll result's name links to the page. The rule follows the existing
row rule "a row hides the tags that repeat what the page already says": on a compact surface the default book is
what a reader assumes.

## Current behavior and the proposed one, per surface

All widths, both languages, every device unless named. "Rel." is R1's set: the two craft lines, the set line, the
set bonus and the ladder.

| Surface (component) | Today | Proposed | What the reader loses |
|---|---|---|---|
| Record page `/i/<id>` (`RecordPage`, `full` + `dossier`, with `sub`) | Rel. with «Хоумбрю» badges; the path line names the book; no badge row source | unchanged; the «Хоумбрю» badge is one box on its name's line (R5) | nothing |
| Item page `/h/<uuid>` (`ItemPage`, same) | the same | unchanged; R5 | nothing |
| Record dialog (`RecordModal`, `full` + `dossier`, no `sub`) | Rel.; the badge row draws the number and the source badge, «Core» included | unchanged; R5 | nothing |
| Editor preview (`HomebrewEditor`, `full`) | Rel.; the source badge | unchanged (a homebrew record never reads «Core») | nothing |
| Roll result (`RollResult`, `face`; phone 96 px art up to 600 px, the face from 601 px) | Rel. («Улучшается до» with «Хоумбрю» badges in the owner's screenshot); the badge row with «CORE» | no Rel.; no «Core» badge; another book's badge stays | the upgrade, made-from and set lines, the set bonus and the ladder; the name links to the page that has them |
| List page roll result (`ListPage`, `compact`, until 9b) | Rel.; «Core» | no Rel.; no «Core» | the same as a roll result |
| Table rows (`RowMain` via `TableRows`, `/tables/*`) | the text line «Получается из: X · Улучшается до: Y (HB) и ещё N»; «Core» hidden on equipment tables only, shown on `alt_item`, `alt_consumable`, `other_starting` | no relation line; no «Core» on any table | the relation names on the row; one press opens the dialog with them |
| Search rows (`/search`) | the relation line; «Core» on every Core row | no relation line; no «Core» | the same |
| `/homebrew` rows (gm3 holds 34 items with relations) | the relation line; the source tag hidden | no relation line | the same |
| `/lists/<uuid>` rows (`ListPage` `RowMain`) | the relation line; «Core» | no relation line; no «Core». Batch 9a's compact row follows the same rule when it lands | the same |
| `/s/<token>` rows (`TableRows`) | the relation line; «Core» | no relation line; no «Core» | the same |
| Grid tiles (`TableRows` grid) | the kind badge; no source tag, no relation | the kind badge is one pill (R5, T5) | nothing |
| `/tables/*` head | moves between tables (T9) | one structure per band | nothing |
| Roll results from 601 px (`RollResult` in `OrGrid` or `RollPanel`; T12, R7) | the tall face at every count; one result on `/roll/std` at the column's width (592-627 px picture); four results in two rows of tall faces; from 761 to 1014 px every count stacked as tall faces | one result: the tall face, at most 380 px wide, in a column of 641 px or more; two: two tall faces side by side there; otherwise (four results, or a column under 641 px) the row face, 96 px picture beside the text, no number badge | on a four-result roll and in the mid band: the large picture and the roll number on the card (the results line names the roll); the picture opens at full size with one press as today |
| Print, copied text, share stubs | the set label, the relation blocks, «Core» on the print card | unchanged | nothing |

The trade-off accepted: a GM who deals a Core item on a phone no longer sees on the result what it upgrades to
or which set it belongs to; the name link and one more screen show it. A reader can no longer tell a Core row
from an unmarked row of an unknown book: none exists, because every other book is marked (R3).

## Facts read from the code (10a47edc, 2026-11-04)

1. `RecordCard.svelte` draws the ladder (`.steps`) and the relation block (`.craft`: from, into, set line, set
   bonus) for every variant; nothing checks `variant` or `dossier` there. The badge row draws
   `<Badge cls="src">{srcLabel(it, lang)}</Badge>` whenever `!sub`, so on `face`, `compact` and the dialog.
2. `RowMain.svelte` draws `span.rcraft` (both craft lines as text through `relText`) on every row, and reads
   `index` only for `upgradesTo` and `madeFrom`. `TableRows` reads its `index` prop only to pass it to `RowMain`.
   Callers of `TableRows`: `TablesPage` (three), `SearchPage`, `SharedListPage`, `HomebrewPage`; `ListPage`
   renders `RowMain` itself.
3. `RowMain` pushes the source tag `if (!hide?.src && !(hide?.core && core))`; `hiddenTags` returns
   `core: !!EQ_TABLE[table]`. `SearchPage`, `ListPage` and `SharedListPage` pass no `hide`, so they draw «Core».
4. The spacing defect (item 1) and the tile defect (item 3) have one cause. `Badge` is an inline `<span>`
   (`padding: 3px 7px`, a 1 px border, `max-width: 100%`, `overflow-wrap: anywhere`). In `.craft p` the names and
   badges sit in one `<span>` run (the flex item that keeps the commas flowing), so each badge is an inline box
   in a 13 px line with `line-height: 1.45` (18.9 px). An inline box's vertical padding and border do not enter
   the line box, so the badge (11.5 px type plus 8 px of padding and border, about 22-23 px) overflows its line
   by about 2 px a side and touches the text above and the badge below. The space before it is an ordinary
   `{' '}`, so the badge can break away from its name and open a line alone. In the grid, `.tile-k` is an
   absolute box `max-width: calc(100% - 44px)`; the inline badge in it wraps «ОСНОВНОЕ ОРУЖИЕ» to two lines, and
   an inline box that wraps draws its border per fragment (`box-decoration-break: slice`): the first fragment
   has no right edge, the second word is a separate fragment with no left edge.
5. Room for a tile's kind badge (`--wrap` is `min(1180px, 100% - 32px)`; two columns and a 10 px gap up to 600
   px; `minmax(168px, 1fr)` and a 12 px gap above): at 320 a tile is 139 px, at 360 159, 390 174, 412 185, 768
   175. Estimated badge widths at 11.5 px, weight 650, 0.07em tracking, Source Sans 3 (not measured): «ПРЕДМЕТ»
   about 75 px, «ОСНОВНОЕ ОРУЖИЕ» about 134, «ВТОРИЧНОЕ ОРУЖИЕ» about 141, "PRIMARY WEAPON" about 127, "SECONDARY
   WEAPON" about 139. Today's room (`- 44px`) is 115 at 360 and 141 at 412: both weapon labels wrap. A room of
   `- 14px` is 145 at 360: all four fit on one line (the RU secondary by about 4 px). The 44 px keeps the tick
   box (top-left, 6 + 30 px) clear; the roll number sits bottom-left and does not collide.
6. Inline-context uses of `Badge`: the `hbBadge` snippet (relation run), the tile's `.tile-k`, and the «Сейчас»
   badge in `AccountPage`. In `.card-meta` and `RowMain`'s `.rh` the badges are flex items, so a `display` change
   on `.badge` does not move them.
7. `tools/artwork/lib.test.mjs` pins `CARD_HEAD_SHA256` over `RecordCard`'s card head, and
   `tools/artwork/review/review.mjs` says a change to `RecordCard.svelte` or `Badge.svelte` must be mirrored in
   `renderCard`.
8. Seeds that prove it: `#/i/ci1 as gm3` (`ci1` upgrades to 15 own items, three drawn with «Хоумбрю», then «и ещё
   12»; the owner's screenshot is this line on a roll result), `#/i/q1 as gm3` (the ladder with HB rungs),
   `#/i/voa4_t3d as gm3` (the set line and the bonus), `#/search ~ relations as gm3` (rows with relation lines).
   `data.js`: 31 records carry `craft`, 5 carry `set`, 356 an `eq.line`.
9. The table head (read for T9; the causes are candidates, not measured). Bands: narrow up to 760 px, mid 761-999
   px, wide from 1000 px (`app.band`). From 761 px `TablesPage` draws `PageHead` with `extra={nav}`, so `TableNav`
   (the group chips `.groups`, the second-level `.tabs` of the active group) sits in the title row's `extra` slot
   and takes the title's row or its own, by the width of what it holds. Below 761 px it draws `.pickrow`: the
   `TableNav` picker button, the view switch and «Ещё». Under the head, `.searchrow` holds `SearchBox`, then by
   band «Фильтры», the view switch, the `Switch` «Свои предметы» (only while `eqKind` and the account has own
   records), the table-link button (only while `linkable`), the count (only while `narrowed`) and «Выбрать»
   (only while a row is drawn). `.body.withcol` draws the filter column only while `facRows.length`. The
   `TablesPage` comment at the band effect says "`TableNav` remounts". The owner's recording shows the head
   re-flowing between tables on production: the group chips beside the title on `alt_item` and `eq_weapon`,
   below it on `wondrous_environments`; the second-level tabs moving with them; the first row starting at about
   125 px on one table and 143 px on another.

## Decisions of this pass (owner-confirmed rule; planner defaults for the parts the owner did not name)

| # | Decision | Reason and trade-off |
|---|---|---|
| K1 | The full record card is `variant === 'full'`, `dossier` or not; one derived `whole` in `RecordCard` gates the ladder, the relation block and the «Core» badge. No new prop. | The four full-card callers are exactly the surfaces the owner named plus the editor preview; `face` and `compact` are exactly the compact cards. A prop would add a variant before a caller needs it (`CLAUDE.md`). |
| K2 | The editor preview keeps R1's lines. | It previews the record page; its author edits «Улучшается до», «Получается из» and «Комплект» in the same form and needs to see the result. |
| K3 | The set bonus goes with the set line on a compact card (default). | The owner said "sets"; the bonus holds only with the whole set, and its lead names the set. Accepted: a roll result of a set piece does not show the bonus. See "Feedback to batch here", F1. |
| K4 | The tier ladder goes with the relation lines on a compact card (default). | The ladder is the upgrade line (`eq.line`, «Линия улучшений» in the editor), the same relation as «Улучшается до». See F2. |
| K5 | R2 moves out of `hiddenTags`: the `core` flag goes, and a pure `isCoreBook(it)` in `lib/label.ts` serves `RowMain` and `RecordCard` (batch 9a's `CompactRow` reads it later). `hiddenTags` keeps kind, tier and source, which depend on the page. | R2 no longer depends on the table; one predicate in `lib/` for every caller. `rowTags.ts` keeps its "repeats what the page says" scope. |
| K6 | `RowMain` loses `span.rcraft`, its CSS, its `index` prop and the imports only it used; `TableRows` loses `index`; every caller drops it. | An unused prop fails the lint; `index` fed only the relation line (fact 2). |
| K7 | R5 at the root: `.badge` becomes `display: inline-block`. In a relation run the space before the badge is U+00A0, and `.craft :global(.badge)` takes `margin-block: 2px`. | An atomic inline box never splits, wraps inside its border, and its margin box enters the line box, so lines with a badge open by the badge's height plus 4 px. One change fixes both defects (fact 4); flex-item badges do not move (fact 6). |
| K8 | The tile's kind badge keeps the full term: `.tile-k` takes `max-width: calc(100% - 14px)` and `text-align: right`, and `calc(100% - 44px)` only while the tick box draws (`ticks`). Below 360 px or in the selection mode a weapon label wraps inside its one pill (`text-wrap: balance`). | One name for one thing: rows, cards and filters say «Основное оружие». Precedent: the owner kept the full «Альтернативные таблицы» on a two-line chip at 360 (2026-10-23, B5-2) over a short label. Accepted: in the selection mode at 360-412 a weapon pill is two lines tall over the picture's top-right corner. Rejected: a tile-only short label («Основное», "Primary"; a second name and four strings), `white-space: nowrap` alone (the tile clips the label), `box-decoration-break: clone` (two pills for one tag). See F3. |
| K9 | No placeholder replaces the lines on a compact card. | The owner: nothing. The name link and the row press already lead to the full card. |
| K10 | `#/search ~ relations as gm3` keeps its id with a new `why` (the own bedrolls ranked with the catalog ones; no row draws a relation line); a new state `#/search ~ relations, dialog as gm3` opens `ci1`'s row and proves the dialog keeps the line. | The dialog was not seeded with own relations; the rule's "dialog keeps" half needs a golden. |
| K11 | Three decision files: one for R1-R5 (the rule and what was rejected), one for R6 (the head), one for R7 (the roll results, T12). Batch 7b writes all three and the `Supersedes` and `Amends` lines. | The tag rule outlives the task and reverses a line of a recorded decision; the head rule is a separate decision with its own rejected option. |
| K12 | **Open design question HD1 (table head), default option A.** A: one head structure for all tables, chosen by the band only. B: keep the per-table head and only reserve space for late content. See T9.2. | The owner asked "is there a better way?". A removes the cause; B hides the symptom in part. Cost and trade-off in T9.2. |
| K13 | Batch 7b is its own batch with its own squash, wave 2b. | The owner's decision (see "Owner decision"). Split criterion: the owner's wish to ship the fix before wave 3 and to start wave 3 on a clean `main`, as for batch 9a ("Batch 9 split"). The batch shares `RowMain`, `TableRows` and the list and `/s/` goldens with 9a; accepted: those goldens are re-seeded twice (here and in 9a). |
| K14 | **Open design question RC1 (compact roll results), default option B**: a result is the tall face only while it fits one line (one result, or two side by side, in a results column of at least 641 px); otherwise it is the row face that phones draw today. See T12.1-T12.2. | Consistency (one more place for the face the phone already has, no new control) and the measured fit; A crops square art to a strip and still leaves row 2 below the fold at 1180x720; C adds a control and a stored key. |
| K15 | T12 folds into batch 7b, not its own batch. | `CLAUDE.md`, "Size a batch by its gates": it shares a component (`RecordCard`, whose face T3 already edits, and `RollResult`), a seed and a filter (the `_roll_std*` and `_roll_alt*` goldens that R2 already moves), and the route (`/roll/*`, already in T6.3). No split criterion holds: no public contract, no other route or filter set, nothing the harness cannot reach. Own batch: about 50-65 min more (a `check:fast`, a CI run, a re-seed of the same goldens, a review); fold: 20-30 min. |

## Batch, squash and cost

| Item | Value |
|---|---|
| Batch | 7b: `polish`, `harden`, batch review, fix cycle, CI of the tip |
| Squash | wave 2b: the same steps as waves 1 and 2 (`plan.md` section 16, "Wave squash content"); lands after batch 7b's review and the green CI run of its tip |
| Gate cost | 100-135 min, 4-6 runs: one golden re-seed (four shards), one `check:fast`, one CI run, one batch review, by habit one fix cycle (a second `check:fast` and CI run). T9 adds 15-20 and T12 20-30 to the 65-85 of T1-T8 (T12: the probe at HEAD and after, 8-10; the CSS and the two-file move, 5-8; the new state and its golden pair inside the one re-seed, 2-3; the browser case written, run on CI, 3-5; the prose, 2-4) |
| Squash cost | 15-20 min (one `main` CI run with the deploy, the merge back, the `origin/main` merge) |
| Blind review | none of its own: a read-only reviewer of the wave 2b scope on production is not required by the owner's wave reviews. The wave 3 blind review covers it |
| Lands on production | about five batches (9a, 8, 9b, P, 10) sooner than wave 3 |

## In scope

- R1-R5 on every surface of the table above; the spacing defect (item 1) on the full record card, where the
  line still draws; the tile pill (item 3); the roll result's «CORE» badge; R6 on `/tables/*` (T9); R7, the
  compact roll results on the nine roll pages from 601 px (item 6, T12), and the one-result width defect of
  `/roll/std` against `FEATURES.md` "Rolling".
- Changed by T12: `RecordCard.svelte` (the face's CSS only), `RollResult.svelte`, `OrGrid.svelte`,
  `RollPanel.svelte`, `tests/app/states.js` (one case), `tests/app/inventory.js` (one state), the goldens,
  `FEATURES.md` "Rolling", `DESIGN.md` "Layout" and "Cards" and "Badges", one decision file.
- Changed: `lib/label.ts` (`isCoreBook`), `lib/rowTags.ts`, `RecordCard.svelte`, `RowMain.svelte`,
  `TableRows.svelte`, `Badge.svelte`, `TablesPage.svelte`, `TableNav.svelte`, `PageHead.svelte` if it holds the
  head row (T9), the callers that pass `index` (`TablesPage`, `SearchPage`, `SharedListPage`, `HomebrewPage`,
  `ListPage`), their tests, `tests/app/states.js`, `tests/app/inventory.js`, the goldens,
  `tools/artwork/review/review.mjs` and `lib.test.mjs` if the head hash moves, the prose of T8.

## Out of scope

- Print (`PrintCard`, `lib/print.ts`), the copied text (`lib/share.ts`), the share stubs (`tools/build.js`),
  `relText` (print and share still read it), `catalog.csv`, `llms.txt`, `routes.json`, `CONTRACTS.md`.
- Another book's tag on a single-book roll page (`/roll/voa` repeats «Vault of Ages»): F4, not changed.
- The tile's roll number, the row tags other than «Core», the `.lt` language mark.
- The head of `/search`, `/homebrew`, `/lists` and the other pages: T9 touches `/tables/*` only. A like jump on
  another page goes to the next refresh.
- T12: the phone face up to 600 px, the control pane (its height, a sticky pane), the page head of the roll pages,
  the list page's roll result (`compact`, until 9b) and `OrGrid`'s use there, a density switch (option C).

## Files expected

| Step | Files |
|---|---|
| T1 | `app/src/lib/label.ts`, `label.test.ts`, `rowTags.ts`, `rowTags.test.ts` |
| T2 | `RowMain.svelte`, `TableRows.svelte`, `TablesPage.svelte`, `SearchPage.svelte`, `SharedListPage.svelte`, `HomebrewPage.svelte`, `ListPage.svelte`, `tables.test.ts`, `homebrewCatalog.test.ts`, and each test that names `.rcraft` or passes `index` (`git grep -n -E "rcraft|index=|\{index\}" -- app/src`: `listPage.test.ts`, `sharedListPage.test.ts`, `searchPage.test.ts`) |
| T3 | `RecordCard.svelte`, `record.test.ts`, `rollResult.test.ts`, `itemPage.test.ts` (unchanged expectations), `recordHost.test.ts` or `pickRow.test.ts` (the dialog keeps the lines) |
| T4 | `Badge.svelte`, `badge.test.ts` |
| T5 | `TableRows.svelte` (the tile rules) |
| T6 | `tests/app/states.js` (one new case), `tests/app/inventory.js` |
| T7 | `tools/artwork/review/review.mjs`, `tools/artwork/lib.test.mjs` (only if the hash moves) |
| T8 | `docs/specs/FEATURES.md`, `DESIGN.md`, `docs/specs/COVERAGE.md`, two new decision files, `docs/decisions/2026-09-30-hb-marks-homebrew-a-relation-shows-only-to-its-author.md`, `docs/DECISIONS.md` |
| T9 | `TablesPage.svelte`, `TableNav.svelte`, `PageHead.svelte` (if it holds the head row), `TableRows.svelte` (picture aspect), their tests, `tests/app/states.js` (one more case), `issues/57/mocks/7b/built/head-probe.js` |
| T12 | `RecordCard.svelte` (face CSS), `RollResult.svelte`, `OrGrid.svelte`, `RollPanel.svelte`, `orGrid.test.ts`, `rollResult.test.ts`, `tests/app/states.js` (one case), `tests/app/inventory.js` (one state), `issues/57/mocks/7b/roll-probe.cjs` (run it, adapt it), the T8 prose below |
| T10 | `handoff.md` (the Impeccable outcome) |
| T11 | `issues/57/mocks/7b/built/`, `handoff.md` |

## Steps

### T1. `isCoreBook` and `hiddenTags`

- `lib/label.ts`: `export function isCoreBook(it: Record_): boolean` - `it.src === 'core' && !it.frame &&
  !it.realm`, with a one-line comment that cites `FEATURES.md`, "Records" (the default book is unmarked on a
  compact surface). `label.test.ts`: a Core item, a Core frame record (false), a Hope & Fear item, a homebrew
  record.
- `lib/rowTags.ts`: delete `core` from `HiddenTags` and from the return; drop the `EQ_TABLE` import if nothing
  else reads it. `rowTags.test.ts`: the three `core:` lines go.

### T2. Rows

- `RowMain.svelte`: delete the `{#if into.length || from.length}<span class="rcraft">...` block, the `.rcraft`
  and `.rcraft .rsep` and `.rcraft :global(svg)` rules, `into`, `from`, the `index` prop, and the imports only
  they used (`Icon`, `relText`, `madeFrom`, `upgradesTo`, `Index`; check each with `git grep -n` in the file).
  The source tag line becomes `if (!hide?.src && !isCoreBook(it)) out.push(...)`. Update the file's top comment
  if it names the craft line.
- `TableRows.svelte`: delete `index` from `Props`, the destructuring and the `RowMain` call. Run `git grep -n
  -E "<TableRows|<RowMain|render\(RowMain|render\(TableRows"` and drop `index` / `{index}` at every caller and
  test.
- `tables.test.ts`: the two `.rcraft` cases (`ci2`, about lines 246 and 267) become "a row draws no relation
  line" (`[data-row="ci2"] .rcraft` is null and the row's text holds neither `t.craftInto` nor `t.craftFrom`);
  the selector at about line 303 drops `:not(.rcraft)`; the `RowMain` case at about line 1961 asserts no
  `.rcraft`. Add: on `/tables/alt_item` (or `other_starting`) a Core row draws no «Core» tag and a Hope & Fear
  row keeps «Hope & Fear»; a search row of a Core record draws no «Core»; a list row (`ListPage`) and a `/s/`
  row draw no relation line and no «Core».
- `homebrewCatalog.test.ts` (about line 759, "the own relations kept on a catalog row while the switch hides the
  own items"): the row reads no relation line; the case opens `ci1`'s dialog and reads the own names there, with
  the switch off and on.

### T3. `RecordCard`

- `const whole = $derived(variant === 'full');` with a one-line comment: the relation lines, the set and the
  ladder are the full card's (DESIGN.md, "Cards").
- `{#if whole && ladder.length}` on `.steps`; `{#if whole && (into.length || from.length || setMembers.length ||
  setBonus)}` on `.craft`.
- The badge row: `{#if !sub && (whole || !isCoreBook(it))}` on the source badge. The number and the column
  badges do not change.
- `hbBadge`: `{' '}<Badge cls="hb">` in place of `{' '}` (keep the eslint comment above it accurate).
- CSS: `.craft :global(.badge) { margin-block: 2px; }` with a comment: an atomic badge's margin enters the line
  box, so the lines around it keep 2 px (DESIGN.md, "Badges").
- `record.test.ts`: `face` and `compact` draw no `.steps`, no `.craft` and no «Core» source badge, and keep a
  Hope & Fear badge; `full` (with and without `dossier`) keeps all three; the `hbBadge` text node before the
  badge is U+00A0. `rollResult.test.ts`: a Core result draws no «Core» badge and no `.craft`. A dialog test
  (`recordHost.test.ts` or `pickRow.test.ts`): the dialog over `ci1` as an author draws «Улучшается до» with a
  `.badge.hb`.

### T4. `Badge`

- `.badge { display: inline-block; ... }` with a comment: one box, so a wrapped label stays inside its border
  (DESIGN.md, "Badges"). Keep `max-width: 100%` and `overflow-wrap: anywhere` (an 80-character source tag still
  wraps inside its box).
- `badge.test.ts`: no CSS assertion in jsdom; leave it, and let case T6 prove the box.

### T5. The tile pill

- `.tile-k`: `max-width: calc(100% - 14px)`, `text-align: right`; `.tilewrap.ticks .tile-k { max-width:
  calc(100% - 44px) }` with `class:ticks={ticks}` on `.tilewrap`; `.tile-k :global(.badge) { text-wrap: balance;
  line-height: 1.2 }`. The comment says why the room shrinks in the mode (the tick box).

### T6. The browser case and the states

- `tests/app/states.js`, the next free case number (95 if the list ends at 94; check it, and name it in
  `handoff.md`, because batch 9a takes the next three): "a badge is one box and keeps clear of the lines around
  it", RU and EN:
  1. `#/i/ci1 as gm3` at 360x640 and 1180x720: each `.craft .badge.hb` has one client rect; it overlaps its
     name's last rect vertically (the same line); between any two boxes on adjacent lines of `.craft p` (badge,
     link, fold button) the vertical gap is at least 2 px, and no badge rect intersects another box.
  2. A grid table whose tiles draw both weapon kind badges (find it in the seed: `other_starting`, `voa` or
     `mwt` first; the owner's screenshot is RU at about 412 px) at 360x640, 390x844, 412x915 and 768x1024: every
     `.tile-k .badge` has one client rect inside its `.tile-img`; outside the selection mode its height is at
     most the «Броня» badge's height + 1 (one line). Then «Выбрать» on: still one rect inside `.tile-img`. If a
     one-line check fails at 360 by a measured width, log the width in `handoff.md`; the pill stays one box (F3).
  3. `/roll/std` as gm3 at 360 and 1180 after a roll that holds `ci1`: no «Core» badge, no `.craft`, no `.steps`
     in the result; then the result's name opens `/i/ci1`, which draws «Улучшается до».
- `inventory.js`: `#/search ~ relations as gm3` takes the new `why` (K10). New: `#/search ~ relations, dialog as
  gm3` - «спальный мешок» typed, `ci1`'s row pressed: the dialog's «Улучшается до» with three «Хоумбрю» badges and
  «и ещё 12». Its golden in RU and EN; its axe case is the dialog's existing one in `recordHost.test.ts` or the
  new T3 dialog case with `expectNoA11yViolations`.

### T7. The artwork guard

- `node --test tools/artwork/lib.test.mjs`. If `CARD_HEAD_SHA256` fails, read `renderCard` in
  `tools/artwork/review/review.mjs`: the review page draws a catalog card head, so it drops a «Core» source
  badge only if it draws the `face` head; set the hash by `docs/artwork.md`, "The card follows the site's card".

### T8. Prose and decisions, in the batch's commit

Run it after T9, so the head prose is true.

- `FEATURES.md`, "Tables and search" (the row line): "and the «Core» source tag on an equipment table (a row from
  another book keeps its name)" becomes "and the «Core» source tag on every row: the default book is unmarked; a
  row from another book keeps its name". Add: "A row draws no relation line."
- `FEATURES.md`, "Records", "Own relations on a card": "A row draws its catalog names, the first homebrew name
  and «и ещё N» as text." becomes "Only the full record card - the record page, `/h/`, the dialog and the
  editor's preview - draws the relation lines, the set line with its bonus and the tier ladder; a roll result, a
  list's roll result, a row and a tile draw none (owner, 2026-11-04)." The roll result line and the dialog line
  ("the dialog draws both as badges") gain: a roll result draws no «Core» badge.
- `FEATURES.md`, "Tables and search", the grid line: "a table of more than one kind labels the tile with a kind
  badge" gains "one pill: a long label wraps inside its border". The head line gains the T9 rule: "The head
  draws the same rows on every table of a band: the title row, the group chips, the second-level tabs, the
  toolbar and the list start at the same place (owner, 2026-11-04)." (Adapt to option A or B as built.)
- `DESIGN.md`, "Cards": the "Relation lines" bullet becomes "**Relation lines:** «Получается из», «Улучшается
  до», the set line and its bonus, and the tier ladder draw on the full record card only (`full`: the record
  page, `/h/`, the dialog, the editor preview); `face`, `compact`, rows and tiles draw none. A homebrew name
  draws the plain bordered badge «Хоумбрю» after it on the same line; a catalog name draws none."
- `DESIGN.md`, "Badges": add "**One box:** a badge is an inline block: it never splits across lines, a long
  label wraps inside its border, and in running text it keeps 2 px from the lines around it. **The default
  book:** «Core» draws on the full record card only; every other source keeps its tag."
- `DESIGN.md`, "Layout": add "**A steady head:** a page whose content switches under a fixed head draws the
  head's geometry from the viewport band only, never from the content; a row that some contents lack keeps its
  reserved space, and late content (a picture, a count) reserves its box." Cite `/tables/*` as the first user.
- `COVERAGE.md`: the `homebrewCatalog.test.ts` entry ("the own relations kept on a catalog row") reads "the own
  relations in the dialog of a catalog row"; the `tables.test.ts`, `record.test.ts`, `rollResult.test.ts` and
  `rowTags.test.ts` entries name the new cases; the three new `states.js` cases (T6, T9.3, T12.4), case 89's
  moved flip, `orGrid.test.ts`'s container class and the state count.
- Decision file 1, `docs/decisions/2026-11-04-relations-and-the-core-tag-draw-on-the-full-card-only.md`
  (template `.claude/templates/decision.template.md`):

  ```markdown
  # 2026-11-04 - Relations and the Core tag draw on the full record card only

  - Supersedes in part "(HB) marks homebrew, and a homebrew relation shows only to its author" (2026-09-30): a row draws no relation line.
  - Task: `57` (owner, 2026-11-04, chat: "consistency first"; "on record card dialog we also can show them, don't show only on compact representation"; "yeah let's make it consistent").
  - Decision: «Получается из», «Улучшается до», the set line with its bonus and the tier ladder draw on the full record card only (`RecordCard` `variant="full"`: the record page, `/h/`, the dialog, the editor preview); a roll result, a list's roll result, a row and a tile draw none, at every width. «Core» is unmarked on every compact surface and named on the full card; another book's tag and every homebrew tag draw as before. A badge is one inline block: it never splits across lines and keeps 2 px from the lines around it. Specs: `FEATURES.md` "Tables and search", "Records"; `DESIGN.md` "Cards", "Badges".
  - Rejected: hiding the homebrew tag everywhere but the full card (the owner's first lean; the owner kept the tag); the relation lines on the item page only, without the dialog (a row press opens the dialog, so a table, search or list reader would lose them; the owner's answer); a placeholder line on a compact card (the name already links to the page); a tile-only short weapon label («Основное», "Primary": a second name for one type); `box-decoration-break: clone` (two pills for one tag).
  - Accepted trade-off: a roll result of a Core item no longer shows what it upgrades to, its set or its bonus; one press shows them.
  ```

- Decision file 2, `docs/decisions/2026-11-04-the-table-head-is-set-by-the-band-not-the-table.md`: Task `57` (owner,
  2026-11-04, chat: "I also don't like much that some divs are jumping during navigation, is there a better way?");
  Decision: the option built in T9.2 with the measured causes; Rejected: the other option, and a per-table
  `min-height` patch with no structure (it hides the symptom on one table); Accepted trade-off: the cost of
  option A (a reserved strip) or of option B (the head still differs by table). It supersedes no earlier file.
- T12's prose (R7):
  - `FEATURES.md`, "Rolling", the result bullet: "from 601 px the picture is 4:3 ... up to 600 px it is 96 px beside
    the text ... From 601 px one result is at most 380 px wide; up to 600 px it takes the line." becomes: "A result
    is the tall face - the picture 4:3 fading into the plate, the roll number over its top right - only while the
    whole roll sits on one line: one result, at most 380 px wide, or two side by side, in a results column of at
    least 641 px. Otherwise each result is the row face: the picture 96 px beside the text, no number (the results
    line names the roll). Up to 600 px that is every roll; from 761 px a four-result roll and every roll in a
    results column under 641 px (owner, 2026-11-04)."
  - `DESIGN.md`, "Layout", The Two Breakpoints Rule: "and the roll card turns from a row into the face at 601px"
    becomes "and a roll card can be the tall face from 601px (The Roll Page Rule)"; The Roll Page Rule gains: "A
    result is the tall face only while the roll sits on one line in a results column of at least 641px; otherwise
    the row face, so a four-result roll shows every name in the first screen at 1180x720."
  - `DESIGN.md`, "Cards", the `face` bullet: "and 96px beside the text up to 600px" becomes "and the row face, 96px
    beside the text, wherever the roll does not sit on one line (The Roll Page Rule)". "Badges": "On a roll card
    face the roll number is drawn over the picture from 601px and hidden up to 600px" becomes "drawn over the
    picture of the tall face and hidden on the row face".
  - Decision file 3, `docs/decisions/2026-11-04-a-roll-result-is-the-tall-face-only-when-the-roll-fits-one-line.md`:
    title "2026-11-04 - A roll result is the tall face only when the roll fits one line"; first bullet `- Amends "The
    roll pages share one layout, and a result is a card face with its own row" (2026-11-04)`; Task `57` (owner,
    2026-11-04, chat: "also for classic and alternative rolls page look good only when 2 items are
    visible, for 4 or 1 it doesn't fit to the screen fully, can we show more compact view?"); Decision: R7 with the
    measured numbers of T12.0 and after; Rejected: option A (the picture cropped by the count) and option C (a
    «Компактно» switch), each with the reason of T12.1; Accepted trade-off: T12.2's. In the file
    `2026-11-04-the-roll-pages-share-one-layout-and-results-draw-the-card-face.md`, above "- Task": `- Amended by "A
    roll result is the tall face only when the roll fits one line" (2026-11-04): a roll that does not fit one line
    draws row faces.`
- In the 2026-09-30 file, above "- Task": `- Superseded in part by "Relations and the Core tag draw on the full
  record card only" (2026-11-04): a row draws no relation line.` Then `node tools/decisions.js`.

### T9. The table head stays put (owner, 2026-11-04, about 19:10; design choice HD1)

Owner, chat, a desktop screen recording (1862x852, 4.6 s) of production while clicking through the group chips
«Core / Hope & Fear / Альт. таблицы / Дополнения / Снаряжение / Прочее / Хоумбрю»: "I also don't like much that some
divs are jumping during navigation, is there a better way?" The orchestrator's reading of 4 of 16 decoded frames:
when the table changes, the page head re-flows. The group chips sit at the right of the «Таблицы» title on the
same row on some tables (`alt_item`, `eq_weapon`) and wrap to their own row below the title on others
(`wondrous_environments`); the second-level tabs move with them; the toolbar row changes content (the «Свои
предметы» switch appears only on equipment); the filter column appears or changes width; the first list row starts
at about 125 px on one table and 143 px on another. This is not proven: no measurement exists yet.

**T9.1 Measure first, before any CSS edit.** Write `issues/57/mocks/7b/built/head-probe.js` (evidence, not a
gate) and run it on the built app (`npm run build:test`) the way batch 3b ran cases 86 and 87 (an in-memory loader
on `dist-test/`; `handoff.md`, "Completed", "Batch 3b"). For every table that the picker lists, in every group
(read the list from `TableNav`), as `gm3` (so «Хоумбрю» and «Свои предметы» draw), at 1180x720, 1050x720 (the wide
band's low end, where the chip row switches beside or below the title), 900x720 (mid), 760x720, 390x844 and
360x640, in RU and EN, moving from table to table with the same window: record the top (Y) and left (X) of the
title row, `.groups`, `.tabs` (or its absence), `.searchrow` and each item in it, the count line, `.body` with its
column, the top of `.rowscol` and the first `[data-row]` or tile; also `documentElement.clientWidth` against
`innerWidth` (a scrollbar gutter) and the scroll position. Log in `handoff.md` a table per width: the least and
the greatest Y per block across the tables, and for each block that differs, the CSS cause with file, selector and
property. Candidate causes, read from the code (fact 9), to confirm or reject: a `flex-wrap` in `PageHead`'s
`extra` slot that depends on the chips' content width; a toolbar item that exists only on some tables (the
«Свои предметы» `Switch`, the table-link button, the count, «Выбрать»); a filter column that mounts after the rows
(`facRows.length`); pictures or counts that load late; a scrollbar gutter that changes the width between a short
and a long table; the `TableNav` remount on a table switch; second-level tabs that exist on some groups only.

**T9.2 Fix principle: the head geometry is a function of the band only.**

- **Option A (recommended): one head structure for all tables.**
  - The title row holds the title. The group chips are one row that draws in the same place, and scrolls or wraps
    the same way, for every table of the band. Decide beside or below the title per band from the widest chip row
    in either language, never per table.
  - The second-level tabs are their own row with a reserved `min-height` at the bands that draw it (from 761 px);
    a table with none keeps the empty strip.
  - The toolbar row's slots are always present: an item that some tables lack keeps its slot (hidden with
    `visibility`, not `display`, or an empty box of the same size) while the row is wide enough to hold it.
  - Late content reserves its box: `aspect-ratio` on row pictures, a fixed-height count line or a placeholder, and
    the filter column drawn with the table, not after it.
  - `TableNav` stays mounted across a table switch: the switch changes `table`, not the component's identity (no
    `{#key}` on the table, no band-effect remount on a table change).
  - Cost: more goldens than B. Every `_tables_*` golden whose head gains a reserved strip or slot moves; planner's
    estimate 25-50, overlapping the 12-20 that T1-T8 already move, so about 25-40 extra (not counted: the number
    follows the measurement). Trade-off accepted: a table with no second-level tabs draws a reserved strip (the
    height of one tab row, about 36-44 px, not measured) from 761 px; the first screen has that much less there.
    The narrow band is not affected: its picker button holds the table, and the tabs live in its sheet.
- **Option B: keep the per-table head and reserve space only for late content** (picture aspect, count
  placeholder, the filter column's width). Cost: 10-20 goldens. Trade-off: the chips still sit beside the title on
  one table and below it on another, so the main jump the owner filmed stays. Not recommended.

  The default is A. The owner can overrule it with a yes to B; nothing blocks on it (the owner is on autonomy,
  `context.md`, "Autonomy"). If the measurement shows that A pushes a table past a `FIRST_SCREEN` limit by the
  reserved strip, stop at that table, log the numbers in `handoff.md`, and take B for that band only.

**T9.3 The browser case.** `tests/app/states.js`, the next free number after T6's, "the table head holds still
between tables", in the shape of case 83 (it reads geometry and asserts per row): visit every table of the picker
as `gm3` at 1180x720, 1050x720, 760x720 and 390x844, RU and EN; for each band read the Y (rounded to 0.5 px) of
the title row, `.groups` and `.tabs` (when it exists, as its reserved box), `.searchrow`, `.rowscol` (the primary
region, not the first row: an alt table opens with a section head), and fail when the Y of any of them differs
by more than 1 px between two tables of the same band; also fail when the X of the group chips differs. Prove the
case first: run it at HEAD (before the T9.2 edit) through the in-memory loader of T9.1; it must fail, with the
numbers logged in `handoff.md`; then it passes after the edit. Add a unit test that `TableNav`'s root element is
the same node after a table switch (`tables.test.ts` or `tableNav.test.ts`, whichever renders the page with a
router).

**T9.4** `FIRST_SCREEN` (section 14): the limits stay. Case 83 passes with no limit loosened and no row moved to
an exception. A measured miss is logged as section 14 says; do not move a limit without the log.

### T12. Compact roll results (owner, 2026-11-04, about 19:30; design choice RC1)

Owner, chat, three desktop screenshots of production `/roll/std`, RU, a 1919x980 window: "also for classic and
alternative rolls page look good only when 2 items are visible, for 4 or 1 it doesn't fit to the screen fully, can
we show more compact view?" The screenshots: two results (two faces side by side with the «ИЛИ» pill) fit whole;
one result fills the column, its picture about 600 px tall, the name and the text below the fold; four results form
two rows of two, and the second row starts below the fold. The same on `/roll/alt`.

**T12.0 Current behavior (measured by the planner on production, 2026-11-04, read-only probe, RU; EN within a
few px).** From 761 px the head ends and the results start at 267 px at every width (`[data-primary]`). The control
pane is 570 px tall on `/roll/std` and 401 px on `/roll/alt`, and it is not sticky. A count is 1, 2 or 4: `poolFor`
gives one record per picked source and kind, `altPicks` one per kind and die; 3 needs a table without the row (none
found at n = 1, 13, 30, 45, 60); the dice count and the manual number pick the row, not the count. Both pages open
with four results.

| Width x height | 1 result (`/roll/std`, Core, items) | 2 results | 4 results (both pages' default) |
|---|---|---|---|
| 1919x980 (the owner's) | card 838 px wide, picture 627; name at 903; action row ends 1009-1030 | two faces 376 px; whole roll ends 705-727 | row 2 starts 767-789; its names at 1056-1078; ends 1205-1249 |
| 1180x720 | card 791, picture 592; name at 868; ends 973-995 | two faces 352 px; ends 688-709 | row 2 starts 750-771 (below the fold); ends 1170-1214 |
| 1015x720, 1000x720 | one column (the results column is 640 px or less, so `OrGrid` stacks): card 611-626, picture 457-468; ends 838-871 | stacked; the second face starts 896-929; ends 1489-1537 | stacked; ends 2794-2883 |
| 900x720 | card 511, picture 382; ends 763-785 | stacked; ends 1339-1382 | stacked; ends 2516-2559 |
| 761x720 | card 372, picture 278; ends 659-724 | stacked; ends 1152-1221 | stacked; ends 2125-2251 |

Causes, read from the code: (1) `OrGrid` draws one card at the column's width, but `FEATURES.md`, "Rolling", says
"From 601 px one result is at most 380 px wide", which only `RollPanel`'s `.results` keeps: a defect on `/roll/std`
(one result) against the spec. (2) The face's picture is 4:3 at the card's full width, so the card's height grows
with its width. (3) From 761 to 1014 px the results column is 387-640 px, `OrGrid`'s `@container (max-width:
640px)` stacks every count in one column, and each face takes the column's width. (4) The «ИЛИ» rule between rows
takes 58-62 px. The narrow band above the phone face has the same causes: at 601x800 four results end at 2692 px
and one at 839 px (T12 measurements).

**T12.1 Options.** The owner prefers consistency and fewer controls.

Each candidate was injected as CSS into production in the planner's local browser and measured the same way (RU;
"names" is the bottom of the last result's name, "whole" the bottom of the last action row; the fold is 720 or
980). All three options fix cause 1 (one result at most 380 px wide).

| | A. The picture cropped by the count | B. The row face when the roll does not fit one line (recommended) | C. A «Компактно» switch per device |
|---|---|---|---|
| What changes | The tall face stays at every count; from three results, and in a column under 641 px, the picture's window is 2:1 (175-312 px tall), the «ИЛИ» rule between rows 6 px | The tall face stays for one result (380 px) and for two side by side in a column of 641 px or more; otherwise each result is the row face that phones draw (96 px picture beside the text, no number badge); the «ИЛИ» rule between the two rows of a 2x2 6 px | A switch in the results line, stored per device (`localStorage`); on, every result is the row face; off, today's faces |
| 1 result, 1180x720 | whole 665 | whole 665 | whole 665 with the fix of cause 1 |
| 4 results, 1180x720 | names 832-858, whole 944-1005: row 2 still below the fold | names 562-645 (627 at n = 45), whole 747-855: every name in the first screen; the last action row 27-135 px below it | off: as today; on: as B |
| 4 results, 1919x980 | names 838-881, whole 946-1028 | whole 725-811 | as B when on |
| 2 results, 900x720 (mid band) | names 981, whole 1089 | whole 649 | as B when on |
| 4 results, 761-1000x720 | names 1848-2100 | names 998-1154, whole 1096-1361: two results whole, the third starts | as B when on |
| What the reader loses | most of each square picture (a 2:1 band of it); still a scroll for a four-result roll | the big picture and the card's roll number on a four-result roll and in a results column under 641 px (761-1014 px, and 601 to about 688 px); one press opens the picture | nothing by default, but a control to find and a setting to remember; the default still fails the owner's case |
| Consistency | one face, a crop window the item page never uses | the two faces that exist, chosen by one rule; the phone's face reused | a second display mode beside the rule; a new stored key (`STATE.md`) |
| Cost | CSS in `RecordCard` and `OrGrid`; the same case | CSS in `RecordCard`, `OrGrid`, `RollResult`, `RollPanel`; the same case; about 3 more goldens (the number badge leaves the tree on four-result states) | B's work plus a `Switch`, a `prefs` key, `STATE.md`, two strings, a state per mode |

**T12.2 Decision: option B (RC1 default).** B is the only option that puts every result's name of the default
four-result roll in the first screen at 1180x720 and the whole roll on the owner's window, with no new control and
no new card form: the row face is the phone's own. A crops the fixed square art to a strip and still scrolls; C
leaves the default as it is and adds a control the owner did not ask for. Accepted trade-offs: a four-result roll
and every roll between 761 and 1014 px lose the large picture (96 px instead of 263-468) and the number badge on the
card; at 1180x720 the last action row of a four-result roll ends 27-135 px below the fold (every name is above
it), and on a crit the last name too (744 px in RU); between 761 and 1014 px a four-result roll shows two results
whole and the third starting; a lone result in that band is a row, not the 380 px tall face (a long Vault of Ages
text then fits: 563 px against 844 today).
The owner can overrule with A or C; nothing blocks on it (autonomy). The probe shows 96 and 120 px pictures within
about 60 px of each other; 96 px keeps one size with the phone.

**T12.3 The edit (option B).** CSS and one class binding; no markup, prop, string or stored value changes.

1. Measure first. `node issues/57/mocks/7b/roll-probe.cjs --base=<the built app>` (no `--inject`) on the build
   before the edit, then with `--inject` (the planner's CSS model of this step), into `handoff.md`. The script
   names the sizes, states and languages; serve `dist-test/` the way batch 3b ran cases 86 and 87, or read
   production. The planner's runs on production are in "T12 measurements" below.
2. `RecordCard.svelte`, the face block ("the roll card face"): the row face becomes the base and the tall face
   moves into one named container query. Delete the face rules of `@media (max-width: 600px)` and `@media
   (min-width: 601px)` (the ring) and write:
   - base: `.card.face { position: relative; flex-direction: row; align-items: flex-start; isolation: isolate; }`;
     `.card.face .card-media { width: 96px; aspect-ratio: 1; margin: 10px 0 10px 10px; border-radius: 8px; }`;
     `.card.face .card-body { padding: 10px 12px; gap: 4px; }`; `.card.face :global(.badge.num) { display: none; }`.
   - `@container faces (min-width: 641px)`: `.card.face { flex-direction: column; align-items: stretch; }`;
     `.card.face .card-media { z-index: -1; width: 100%; aspect-ratio: 4 / 3; margin: 0; border-radius: 0;
     mask-image: linear-gradient(180deg, #000 72%, transparent); }`; `.card.face .card-media:focus-visible {
     mask-image: none; }`; the `::after` ring rule as it is; `.card.face .card-body { margin-top: -26px; padding: 0
     14px 12px; gap: 7px; }`; `.card.face :global(.badge.num) { display: inline-block; position: absolute; top:
     10px; right: 10px; }` (`inline-block` is `.badge`'s own display after T4).
   - The comment above the block: the row face is the base; the tall face needs a `faces` container of 641 px,
     which a roll provides only while it sits on one line (DESIGN.md, "The Roll Page Rule"). Up to 600 px no
     container is that wide, so the phone keeps the row face.
3. `OrGrid.svelte`: `class:faces={items.length <= 2}` on `.orwrap`, and `.orwrap.faces { container-name: faces; }`
   (the `container-type` stays on every `.orwrap`: the grid's own `@container (max-width: 640px)` reads it). Add
   `@container (min-width: 641px) { .ordiv.h { padding: 6px 0; } }`: the rule between the two rows of a four-result
   roll (the row faces) takes 42 px instead of 62. The stacked separators below 641 px keep 14 px, so the phone's
   separators do not move. Update the file's top comment: four make a 2x2 of row faces. `ListPage`'s `OrGrid`
   (one `compact` card) is not a face and does not change.
4. `RollPanel.svelte`: `.results` becomes `container: faces / inline-size;` and loses its `@media (min-width:
   601px)` 380 px column; update its comment.
5. `RollResult.svelte`: `@container faces (min-width: 641px) { .dealt { max-width: 380px; } }` with a comment:
   a tall face is at most 380 px wide (`FEATURES.md`, "Rolling"); it fixes the one-result width on `/roll/std` and
   replaces `RollPanel`'s copy.
6. Unit cases (jsdom draws no container query, so they hold the classes, not the geometry): `orGrid.test.ts` -
   one and two items draw `.orwrap.faces`, four draw `.orwrap` without it; `rollResult.test.ts` keeps its cases
   (the markup does not change).
7. `tests/app/inventory.js`: new state `#/roll/std ~ one result` after `#/roll/std ~ items only`, `why`: "Core rules
   with Hope & Fear and consumables off: one result, the tall face at most 380 px wide (R7)", `enter` presses
   «Hope & Fear» and «Расходники». Its RU and EN golden come from the one re-seed. `#/roll/std` keeps its `why`
   with "four results draw row faces from 601 px" added.
8. Run the probe again on the edited build (no `--inject`): the numbers match the model within a few px, or
   `handoff.md` names each difference.

**T12.4 The browser case.** `tests/app/states.js`, the next free number after T9.3's: "a roll fits the first screen
by its count" (DESIGN.md, "The Roll Page Rule"). Beside `FIRST_SCREEN`, a table `ROLL_FIT` of inventory states and
sizes, read the way case 83 reads its rows (`d.open` with the state's fields, `enter`, `d.settled`, «EN» for the EN
pass, `scrollTo(0, 0)`, `document.fonts.ready`, two frames). Per `.dealt`: the bottom of `.card-name`, the bottom of
`.resacts`, the width of `.card-media` and of `.dealt`, and whether `.badge.num` is displayed. RU and EN:

| State | Size | Asserts |
|---|---|---|
| `#/roll/std` (4), `#/roll/alt` (4) | 1180x720 | every name's bottom at most 720; every picture at most 100 px wide; no number drawn |
| `#/roll/std ~ one source` (2) | 1180x720 | every action row's bottom at most 720; both pictures at least 300 px wide (tall); the number drawn |
| `#/roll/std ~ one result` (1) | 1180x720 | the action row's bottom at most 720; `.dealt` at most 380.5 px wide; the picture at least 300 px wide |
| `#/roll/voa` (1, a long Vault of Ages text) | 1180x720 | the name's bottom at most 720; `.dealt` at most 380.5 px wide; the picture at least 300 px wide (its action row ends at 844 px today and after: the text, not the layout) |
| `#/roll/std`, `#/roll/alt`, `#/roll/alt ~ crit`, `~ one source`, `~ one result`, `#/roll/voa` | 1919x980 | every action row's bottom at most 980 |
| `#/roll/std` (4), `~ one source` (2), `~ one result` (1) | 1000x720 | every picture at most 100 px wide (a column under 641 px); the first two action rows' bottoms at most 720 |
| `#/roll/std` (4), `~ one result` (1) | 360x640 | every picture 96 px wide and no number drawn (the phone as today) |

`#/roll/alt ~ crit` at 1180x720 is logged, not asserted: the crit box puts its last name at 744 px in RU (T12
measurements). Prove the case first: run it through the in-memory loader at HEAD; the 1180x720 rows of `#/roll/std`
and `~ one result` and the 1000x720 rows must fail, with the numbers in `handoff.md`; then it passes after the
edit.

Case 89 ("the card flips at 600/601 px", `#/roll/wondrous`): the flip is no longer a window step. It reads the row
face at 600x800 as today, then the tall face at 720x800 (a `.results` container of at least 641 px with the
scrollbar's gutter), and adds the row face at 640x800; its title and comment change to "the card is the tall face
from a 641 px results column". Case 31 (`#/roll/wondrous` at 1180x520) keeps the tall face and passes unchanged.

`plan.md` section 14 gains one line: `ROLL_FIT` is the roll pages' fit check beside `FIRST_SCREEN`; the first
result's offset rows stay as they are.

**T12 measurements (planner, 2026-11-04, production, `roll-probe.cjs` without and with `--inject`, RU; the EN
texts are shorter and end 0-60 px higher; at 1180x720 EN the four-result `/roll/alt` fits whole, 690 px).** "name" is the last result's name bottom, "whole" the last action
row's bottom, "k/n" how many action rows end inside the window. The first result starts at 267 px from 761 px,
310 px (std) or 244 px (alt, voa) from 601 to 760 px, as today in both columns.

| State | Size | Today: name / whole | Option B model: name / whole |
|---|---|---|---|
| std, 4 (n = 1; n = 45) | 1919x980 | 1084 / 1231, 2/4 | 580 / 765, 4/4 (604 / 811 at n = 45) |
| std, 4 | 1366x768 | 1084 / 1231, 2/4 | 580 / 765, 4/4 (604 / 811, 2/4 at n = 45) |
| std, 4 | 1180x720 | 1049 / 1196, 2/4 | 580 / 765, 2/4 (627 / 855 at n = 45) |
| std, 4 | 1000x720 | 2695 / 2820, 0/4 | 1020 / 1140, 2/4 |
| std, 4 | 761x720 | 2021 / 2168, 1/4 | 1132 / 1317, 2/4 |
| std, 4 | 601x800 | 2567 / 2692, 0/4 | 1063 / 1183, 2/4 |
| std, 2 | 1180x720 | 563 / 692, 2/2 (tall) | the same (tall) |
| std, 2 | 1000x720 | 1386 / 1493, 0/2 | 549 / 649, 2/2 |
| std, 1 | 1919x980 | 927 / 1009, 0/1 (838 px wide) | 583 / 665, 1/1 (380 px, tall) |
| std, 1 | 1180x720 | 892 / 973, 0/1 (791 px wide) | 583 / 665, 1/1 (380 px, tall) |
| std, 1 | 1000x720 | 757 / 838, 0/1 | 333 / 426, 1/1 (row) |
| alt, 4 | 1919x980 | 1059 / 1188, 2/4 | 592 / 732, 4/4 |
| alt, 4 | 1180x720 | 1023 / 1153, 2/4 | 645 / 787, 2/4 |
| alt, crit | 1919x980 | 1197 / 1305, 2/4 | 700 / 840, 4/4 |
| alt, crit | 1180x720 | 1166 / 1274, 0/4 | 744 / 886, 2/4 (logged) |
| voa, 1 | 1180x720 | 583 / 844, 0/1 (tall) | the same (tall) |
| voa, 1 | 900x720 | 583 / 844, 0/1 (tall) | 333 / 563, 1/1 (row) |
| any | 360x640 | std 4: 1247 / 1443 | the same at every state: the phone does not move |

The flip: with the page's scrollbar gutter a results column reaches 641 px at a window of about 688 px, so 673
and 672 px both draw the row face; case 89 reads 720 px for the tall face. At 700x400 (a phone on its side) a lone
result is the tall face and overflows a 400 px window, today and after; not in scope (F7).

### T10. Impeccable

The orchestrator runs `polish` and `harden` on `RecordCard`, `RowMain`, `TableRows`, `TablesPage`, `TableNav` and
`Badge` at 360 and 1180 px after T9; `handoff.md` gives the outcome. Fallback:
`impeccable:impeccable-finish-reviewer`.

### T11. Evidence

`issues/57/mocks/7b/built/shoot.js`, from `mocks/7/built/shoot.js`: at 360x640 and 1180x720, RU and EN: `#/i/ci1 as
gm3`, `/roll/std` with `ci1`, `#/search ~ relations, dialog as gm3`, a grid table with weapon tiles (also in the
selection mode), `/tables/alt_item`, `/account` (the «Сейчас» badge), and the head at three tables of one band
side by side. The set is evidence, not a gate.

## Acceptance criteria

Each line is observable in a suite, a unit case or the built app.

- R1: `face` and `compact` cards draw no «Получается из», «Улучшается до», set line, set bonus or tier ladder;
  `full` cards (page, `/h/`, dialog, editor preview) draw all of them as today (`record.test.ts`, T6.3).
- R1: no row draws a relation line - tables, search, `/homebrew`, `/lists/<uuid>`, `/s/` (`tables.test.ts`,
  `homebrewCatalog.test.ts`, `listPage.test.ts`, `sharedListPage.test.ts`).
- R1: the dialog of a row keeps the own relation lines with their «Хоумбрю» badges (`#/search ~ relations,
  dialog as gm3`, the T3 dialog case).
- R2: the roll result's «CORE» badge is gone: a Core result on `/roll/std` draws no source badge at 360 and 1180
  (`rollResult.test.ts`, T6.3, the `_roll_std*` goldens).
- R2: no row draws «Core» on any table, search or list page; the dialog's badge row keeps «Core»; the record
  page's path line keeps «Core · ...» (`tables.test.ts`, `record.test.ts`, goldens).
- R3: a Hope & Fear row on `alt_item` keeps «Hope & Fear»; a Hope & Fear roll result keeps its badge
  (`tables.test.ts`, `record.test.ts`).
- R4: the homebrew source tag draws on rows (not on `/homebrew`) and cards as today; `homebrewPage.test.ts` and
  `homebrewCatalog.test.ts` pass with only the relation-line edits of T2.
- R5, item 1 (the upgrade line spacing, on the full card): on `#/i/ci1 as gm3` at 360 and 1180, RU and EN, each
  «Хоумбрю» badge is one box on its name's line, at least 2 px from every box on the adjacent lines, and touches
  no other badge (T6.1). The space before it is U+00A0 (`record.test.ts`).
- R5, item 3 (the tile pill): every grid kind badge is one box inside its picture at 360, 390, 412 and 768, RU
  and EN; one line outside the selection mode («ОСНОВНОЕ ОРУЖИЕ», «ВТОРИЧНОЕ ОРУЖИЕ», "PRIMARY WEAPON", "SECONDARY
  WEAPON"); in the mode one box, which may wrap inside its border (T6.2). A measured miss at 360 is logged (F3).
- R6, item 5, the measurement: `handoff.md` holds the T9.1 table per width and names the CSS cause of each
  block that jumps.
- R6, the head: on every table of the picker, at 1180, 1050, 760 and 390, RU and EN, the Y of the title row, the
  group chips, the second-level row, the toolbar and the primary region differs by at most 1 px between tables of
  the same band (the T9.3 case), and that case failed at HEAD with the numbers logged.
- R6: `TableNav` is the same node after a table switch (a unit test); late content reserves its box (picture
  aspect, count line, filter column) so that nothing under the head moves when it arrives.
- R6: the `FIRST_SCREEN` limits stay; case 83 passes with no limit loosened (T9.4).
- `hiddenTags` has no `core` flag; `isCoreBook` is the one predicate; `RowMain` and `TableRows` have no `index`
  prop (`git grep -n -E "hide\?\.core|core: !!EQ_TABLE"` is empty).
- Print, the copied text and the share stubs do not change: `node tests/run-all.js app/print` is CI's;
  `lib/print.ts`, `lib/share.ts` and `tools/build.js` have no diff.
- New state `#/search ~ relations, dialog as gm3` with its RU and EN golden and an axe case; `#/search ~
  relations as gm3` has its new `why`.
- T8's prose, the three decision files, the pointer in the 2026-09-30 file, the `Amended by` line in the roll
  pages' file and `node tools/decisions.js` with 0 problems, in the same commit.
- R7, item 6, the measurement: `handoff.md` holds T12.3's probe table at HEAD and after the edit (1919x980,
  1180x720, 1000x720, 900x720, 761x720, 700x360; 1, 2 and 4 results; RU and EN).
- R7, the rule: at 1180x720, RU and EN, on `/roll/std` with one, two and four results, on `/roll/alt` with four and
  on `/roll/voa`, every result's name ends inside the first screen; on `/roll/std` with one and two results the
  whole roll ends inside it, the action row included (the T12.4 case). `/roll/alt ~ crit` at 1180x720 is logged
  (last name at 744 px in RU), not asserted.
- R7, the owner's window: at 1919x980, RU and EN, the whole roll ends inside the first screen at every count, the
  action rows included (the T12.4 case).
- R7, one result: from 601 px a lone result on `/roll/std` is at most 380 px wide, as `FEATURES.md` "Rolling" already
  says (the defect of T12.0, cause 1); `/roll/voa` and the other single-result pages keep their width (the T12.4
  case).
- R7, the row face from 601 px: a four-result roll at 1180, and every roll in a results column under 641 px,
  draws each card with its picture beside the text and no number badge; two results at 1180 keep the tall face
  with the number (the T12.4 case, `_roll_std ~ one source` golden unchanged).
- R7, the phone: up to 600 px nothing moves - `sweep.js 360` and `390`, the 360 px goldens and case 89 pass
  unchanged.
- R7: new state `#/roll/std ~ one result` (Core only, items only) with its RU and EN golden and an axe case (the
  existing `rollResult.test.ts` axe case covers the card; the state's own is its golden).
- R7: the `FIRST_SCREEN` rows of the roll pages keep their limits and offsets (267 at 1180x720; 323 and 251 at
  360x640).
- `node --test tools/artwork/lib.test.mjs` passes (T7).
- From "Each of batches 2-9": the detector line, American spelling in new prose, `mocks/7b/built/`, the `polish`
  and `harden` outcome, no `verify` row open, the writer's local gates. CI is green on the pushed tip.

## Standing checks

1. Scale.

   | State | Shows | Proof |
   |---|---|---|
   | No relation | no line on any surface | unchanged |
   | One relation (a Core item that upgrades to one record) | the full card: one line; a compact surface: none | `record.test.ts` |
   | Many: 15 own upgrades (`ci1` as gm3) | the full card: the catalog names, three own names with badges, «и ещё 12» | `#/i/ci1 as gm3` |
   | At the own-items limit and 3x (`limit_defaults`) | the fold caps a line at three own names, so 3x draws the same height; a compact surface draws nothing | the fold is unchanged; `foldOwn` tests |
   | Longest own name (120 code points) with its badge | the name wraps; the badge stays on its last line (U+00A0) at 360 | T6.1 |
   | Longest badge: an 80-character source tag on a row | one box that wraps inside its border; a flex item, as today | unchanged |
   | Longest kind badge on a tile | «ВТОРИЧНОЕ ОРУЖИЕ» / "SECONDARY WEAPON": one line at 360-768 outside the mode | T6.2 |
   | Table head: the table with the most chips, tabs and toolbar items against the one with the fewest | the same Y for each block | T9.3 |
   | Table head: the longest group chip row (RU) at the narrowest wide width | the same structure on every table | T9.3 at 1050 |
   | 360 and 1180 | each row above | T6, T9.3, goldens |
   | Roll results: none (an empty table, `empty`) | `NoData` as today | unchanged |
   | Roll results: one (`/roll/std ~ one result`, every single-result page) | from a 641 px column the tall face, at most 380 px wide; under it the row face | T12.4, new golden |
   | Roll results: two | side by side as tall faces from a 641 px column; stacked row faces under it | T12.4, `~ one source` golden |
   | Roll results: three (a table without the row; not reached by the shipped data) | `OrGrid`'s `c4` layout, row faces, as four | `orGrid.test.ts` (class only) |
   | Roll results: four, the limit (`poolFor`, `altPicks`: two sources or dice by two kinds; no 3x row, the count is a code constant) | row faces in a 2x2 from a 641 px column, stacked under it; the alt crit box above them | T12.4 |
   | Roll results: the longest name and text (`n = 45` and `60` on `/roll/std`, RU) | the row face grows with the text; the name stays above the fold at 1180x720 | T12.4 |
   | Roll results at 360 and 1180 | 360: unchanged row faces; 1180: as the rows above | T12.4, case 89, `sweep.js 360` |

   Roll pages (T12): the row order (the results in `poolFor` and `altPicks` order), the primary action (the dice or
   the roll button in the pane, unchanged) and the result's action row (under each plate) do not move. The pane is
   not sticky and does not grow. The first result starts at 267 px from 761 px as today.

   Row order, the primary action, folds, popups and sticky regions do not change. A roll result and a row get
   shorter (fewer lines); no `FIRST_SCREEN` offset moves on a roll result or a row, because the first result and
   the first row start where they did. On `/tables/*` from 761 px the first row may start lower by the reserved
   strip on a table with no second-level tabs (option A); the limit is the rule's and case 83 holds it.
2. Error scenarios: not applicable to stored data - no write path or stored shape changes. Loading, a failed
   read, offline and a stale tab draw what they draw today; a record named by a relation and deleted drops out of
   the full card's line as today. The head holds still while a table loads (the late-content rule). A revert to
   the previous frontend draws the lines on every surface and the old head again; no data moves. T12 is CSS only:
   a picture that fails draws the glyph in the 96 px well, as on the phone; a stale tab draws the old faces until
   it reloads; a revert draws the tall faces at every count again.
3. Consistency. `FEATURES.md`, "Consistency rules": one name for one thing (the tile keeps «Основное оружие»;
   K8); the row rule "a row hides the tags that repeat what the page already says" is extended, not departed
   from. Siblings: every compact surface (rows on five pages, tiles, two roll results) now draws the same set of
   tags and no relation; the three dossier surfaces and the editor preview draw the same full card. Named
   differences: print and the copied text keep the relation blocks, the set label and «Core» (out of scope; a
   printed card and a pasted message have no surrounding page); a single-book roll page still repeats its book
   tag (F4); only `/tables/*` has the steady head so far (the other pages have one content set under their head).
   T12: the nine roll pages draw one result rule (The Roll Page Rule); the row face is the phone's, so a roll looks
   the same in a narrow column at any width. Named difference: the list page's roll result stays `compact` until
   9b moves it to `face`, and then takes R7 with it.
4. RU/EN parity: no string is added, changed or removed. The goldens, T6, T9.3 and T12.4 run in both languages; the
   EN tile labels are the longer ones, the RU chip row is the wider one, and the RU result texts are the taller
   ones (T12 measurements).

## Goldens expected to move

Golden width is 1100. Seed with the four shards; never edit a golden by hand.

- `_search*` (about 12): rows lose «Core» and the relation line.
- `_roll_std*` (about 10) and any `_roll_*` result of a Core record, an upgrade, a set piece or a laddered
  weapon (`_roll_voa*` holds ladders): the result loses «Core», the relation lines and the ladder.
- `_tables_*` of mixed books (`alt_item`, `alt_consumable`, `other_starting`) and every table golden that holds a
  row with a relation (`_tables_alt_consumable` holds 11): rows lose «Core» or the relation line. With option A,
  also every `_tables_*` whose head gains a reserved strip or slot (T9).
- `_homebrew_*` list states as gm3 (`_homebrew_as_gm3`, `~ bar more`, `~ filter sheet`, `~ import held names*`,
  `~ more`, `~ narrow`, `~ search`, `~ select*`, `~ tabs`): rows lose the relation line.
- The list and `/s/` families with a Core row or a relation line (`_lists_*0101*`, `LIST_A*`, `_s_*`): rows lose
  «Core» and the relation line. About 30-50. Batch 9a re-seeds them again for the compact row (accepted, K13).
- T12, at the golden width of 1100 (a 726 px results column): every four-result roll state loses the number badge
  from the tree (the row face hides it): `_roll_std`, `~ help`, `~ set up`, `~ more`, `~ card more`, `~ list menu
  as gm4`, `~ request arrived as gm1`, `as gm1`, `~ account menu as gm1` (all moved by R2 already), and
  `_roll_alt`, `_roll_alt_crit`, `_roll_alt_legendary_crit` (about 3 more). Two-result states (`~ one source`, `~
  items only`, `~ crit, items only`) and single-result pages keep their tall face: no T12 move.
- Not expected to move: `_i_*`, `_h_*`, every dialog state, the editor states, `_p_*`. A move there is a defect
  to read.

Estimate: 75-125 goldens in all. The new states add four files (`#/search ~ relations, dialog as gm3` and
`#/roll/std ~ one result`, RU and EN).

## Tests

| File | Cases |
|---|---|
| `lib/label.test.ts` | `isCoreBook` |
| `lib/rowTags.test.ts` | no `core` |
| `record.test.ts` | R1 and R2 per variant; U+00A0 before `.badge.hb` |
| `rollResult.test.ts` | no «Core», no `.craft` |
| `recordHost.test.ts` or `pickRow.test.ts` | the dialog keeps the own relation line; axe |
| `tables.test.ts` | no `.rcraft`; no «Core» on a mixed table and on search; another book kept; `TableNav` keeps its node on a table switch |
| `listPage.test.ts`, `sharedListPage.test.ts` | a row draws no relation line and no «Core» |
| `homebrewCatalog.test.ts` | the own relations in the dialog, not on the row |
| `orGrid.test.ts` | `.orwrap.faces` for one and two items, not for four (T12) |
| `tests/app/states.js` | the badge case (T6), the head case (T9.3), the roll fit case (T12.4) and case 89's moved flip |

## Verification

In this order, after T8. One command per call. A browser suite does not run locally (section 7, the writer's
local gates).

1. While editing: `npx vitest run` with `app/src/lib/label.test.ts`, `rowTags.test.ts`,
   `app/src/components/record.test.ts`, `rollResult.test.ts`, `recordHost.test.ts` or `pickRow.test.ts`,
   `tables.test.ts`, `homebrewCatalog.test.ts`, `homebrewPage.test.ts`, `searchPage.test.ts`, `listPage.test.ts`,
   `sharedListPage.test.ts`, `itemPage.test.ts`, `badge.test.ts`, `a11y.test.ts`, `orGrid.test.ts`, `std.test.ts`,
   `alt.test.ts` (components), then `npm run lint:untyped` and
   `npm run lint:typed`. `git ls-files -- "app/src/**/*.test.ts"` gives a right name.
2. `node --test tools/artwork/lib.test.mjs` (T7).
3. `npm run build:test`, then `node tests/app/golden.js --update --shard=n/4` for n = 1 to 4, one at a time. Then
   `git diff --stat tests/app/snapshots`: only the families above and the new files.
4. `node tools/decisions.js`: 0 problems; `docs/DECISIONS.md` rebuilt.
5. `npm run check:built` (the unconfigured budget). The bundle shrinks by about 0.2 kB (the row's relation line
   and its CSS); T9 may add 0.1 kB. Then the configured build with placeholder `VITE_SUPABASE_*` values and `node
   tools/bundle-budget.mjs`. Raise a limit only by the standing rule.
6. `impeccable detect --json --no-inline-ignores app/src`, and the spelling grep of batch 2's word list over the
   touched files and the new prose.
7. `rtk npm run check:fast` (Bash timeout 600000), last.
8. Commit, push, the CI credit. CI's `app/states` (the three new cases, case 83 and case 89), `app/print`, `app/hues`,
   `app/typo`, `sweep.js` and the `e2e` flows are the browser proof. The batch review follows (trigger: new or
   changed UI; `tests/app/` changed). The wave 2b squash waits for it and for the green CI run of the tip.

## Risks and do-nots

- Do not hide the homebrew tag anywhere it draws today (owner's refinement). Do not touch print, the copied text
  or `relText`.
- `inline-block` on `.badge` changes the line metrics of every inline badge (fact 6): read the «Сейчас» badge on
  `/account` in the shots; a flex-item badge must not move (`card-meta`, `.rh`).
- Keep the badge's `overflow-wrap: anywhere`: without it an 80-character homebrew source tag pushes a row wide.
- A `face` card that loses its lines must keep its `flex: 1 1 auto` height in the roll grid (`RollResult`'s
  `.dealt`): two results in a row stay the same height.
- T9: do not patch one table with a `min-height`; measure first (T9.1) and fix the cause. A reserved box must not
  draw a visible empty frame or a focusable element. A hidden toolbar slot is out of the tab order and the
  accessibility tree (`visibility: hidden` or `inert`), and the Tab order of the head does not change.
- T9: the `FIELD` guard of `Shell` and the header that hides on scroll (batch 3b) read the head's height; a
  reserved strip changes `--sticky-h` consumers only through the header, not through the page head. Check `sweep.js
  360` and `768` on CI.
- T12: the phone must not move. The row face becomes the base of `.card.face` with the same values as today's
  `@media (max-width: 600px)` block; read the 360 px shots of `mocks/5/built/` against T11's. Do not add a
  breakpoint to the viewport port, and do not write the face rules twice (a media copy and a container copy):
  the named container is the one switch. `.dealt { height: 100% }` stays, so two tall faces keep one height.
- T12: a container query needs a container in every caller of `RollResult`. `OrGrid` and `RollPanel` are the two;
  a third caller (9b's list roll result) names its container or draws the row face.
- Review order: `RecordCard.svelte`, `Badge.svelte`, `RowMain.svelte`, `TableRows.svelte`, `TablesPage.svelte`,
  `TableNav.svelte`, `lib/label.ts`, `lib/rowTags.ts`, the states cases, the prose.

## Writer tests

Facts for the orchestrator's dispatch, not a model choice.

| Test | Answer |
|---|---|
| 1 (a step asks for a choice, or an `Open design question:`) | yes: HD1 (T9.2) and RC1 (T12.2) have defaults (option A, option B) that block nothing; the tag rule is the owner's; K3, K4 and K8 have defaults that block nothing |
| 2 (public contract, route, stored state, product law, migration, hook, configuration) | no: no contract, route or stored state; print is untouched; `CARD_HEAD_SHA256` is a test constant |
| 3 (visual judgment: print fitting, a golden re-seed, parity with a design node) | yes: 70-120 goldens in one re-seed, and the badge, tile and head layouts rest on visual judgment; no design node |

## Plan review

Not required (no trigger fired): no migration or SECURITY DEFINER function, no public contract
(`routes.json`, `ROUTES.md`, `CONTRACTS.md`, `llms.txt`, `tests/contracts.js` and `docs/fixtures/` do not
change), no stored data or `localStorage` key, no write or sync protocol. A batch review is required after the
implementer (trigger: new or changed UI; `tests/app/` changed).

## Feedback to batch here

The owner may send more phone or desktop feedback. Until 7b's dispatch, each new item joins this brief as a T
line and an acceptance line; after it, the next refresh (batch 9a) or the post-wave-3 remediation takes it.
Open, each with its default:

- F1 (K3). The set bonus on a compact card. Default: it goes with the set line. Alternative: keep the bonus text
  on roll results (it is the piece's rules text) and drop only the member names.
- F2 (K4). The tier ladder on a compact card. Default: it goes. Alternative: keep the ladder on a roll result of
  laddered equipment (one row of 26 px rungs).
- F3 (K8). A weapon kind pill at 320 px or in the selection mode wraps inside its one border. Default: accept.
  Alternative: a tile-only short label («Основное» / «Вторичное», "Primary" / "Secondary"), a second name for
  the type.
- F4. A single-book roll page (`/roll/voa`, the supplements) repeats the book's tag on each result. Default:
  unchanged (R3). Alternative: hide a tag that the page's book already says, as rows do.
- F5. Closed: placement is decided (owner, 2026-11-04): batch 7b with wave 2b.
- F6 (HD1, K12). The table head. Default: option A. Alternative: option B. Another page with a like jump (a
  head that changes with its content): default, not in this batch.
- F7 (RC1, K14). Compact roll results. Default: option B. Alternatives: option A (the picture cropped by the
  count) or option C (a «Компактно» switch). Not in this batch, by default: a sticky control pane, a shorter page
  head on the roll pages, the 601-760 px band beyond what R7 gives it.

### T13. The homebrew pin in the not-ready states (owner, 2026-11-04, "recommended makes sense"; from the blind
review after wave 2, N2)

Current behavior: `/homebrew` draws the pin («Открывать при запуске») from 761 px in every state, signed out
included. Up to 760 px the not-ready head (signed out, loading, failed read) draws the heading only, so a phone
shows no pin there. The post-wave-2 remediation aligned `ROUTES.md` with `FEATURES.md` and `STATE.md` (a pin may
hold `#/homebrew`) and left the width difference.

Decision (owner): the pin draws only when the page is ready (signed in, items read), at every width. In the
signed out, loading and failed states it is not drawn at any width. The reason: a launch page that a signed-out
visitor cannot use ends at a sign-in wall at every launch. Trade-off, accepted: a signed-out visitor cannot
pre-pin the page, and desktop loses a control that it has in those three states.

Do: the one condition in `HomebrewPage` (and its head component) for the pin; `FEATURES.md` "Homebrew" and
"Chrome" say it; `homebrewPage.test.ts` cases for the three states at both bands that fail before the fix; the
`_homebrew*` signed-out, loading and failed goldens at 1180 move (one pin button gone), read each diff; axe on
the states. Acceptance line: in the three not-ready states the pin is absent at 360 and 1180, present when ready at
both. Run order: with T9 (it shares the `/homebrew` head). Cost: about 5 minutes and 0 extra gate runs.
