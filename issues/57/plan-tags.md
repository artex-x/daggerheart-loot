# Tags and relation lines - one rule for every surface (implement-ready, folded into batch 9a)

This brief is the implementer's whole input for the owner's phone feedback of 2026-11-04 (`context.md`, "Phone
feedback", items 1-3, the lean, the refinement, the answer and the confirmation). It is not a batch of its own:
it rides batch 9a (see "Placement"), and `plan-9a.md`, "Folded from `plan-tags.md`", holds its acceptance lines
as 9a lines. Run steps T1-T8 first, before 9a's S1: 9a's S3 and S6 then build on the files as T leaves them.
Section numbers ("section 7") are those of `plan.md`. The code facts were read on `10a47edc`; the post-wave-2
remediation runs on `claude/57` now and edits `RecordCard`, `TableRows` and `TablesPage`, so read the shipped
files at dispatch.

## Objective

A reader sees the relation lines and the default book's tag where they help, on the full record card, and
nowhere else; every badge draws as one clean box. Concretely: «Получается из», «Улучшается до», the set line
«Комплект» with its bonus, and the tier ladder «Ранг» draw only on the full record card. The «Core» tag draws
only there too. Another book's tag and every homebrew tag draw where they draw today. A badge never splits into
fragments: the «Хоумбрю» badge in a relation line keeps clear of the lines around it and stays on its name's
line, and a grid tile's «ОСНОВНОЕ ОРУЖИЕ» is one pill.

## The rule (stated once; the decision file and DESIGN.md take this text)

Owner, 2026-11-04: "consistency first"; "on record card dialog we also can show them, don't show only on compact
representation"; "yeah let's make it consistent".

- **The full record card** is `RecordCard` with `variant="full"`: the record page `/i/<id>` (`RecordPage`), the
  homebrew item page `/h/<uuid>` (`ItemPage`), the record dialog (`RecordModal`) - these three are `dossier` -
  and the homebrew editor's preview (`HomebrewEditor`, not `dossier`). **A compact representation** is every
  other record surface: a roll result (`RecordCard variant="face"`, `RollResult`), the list page's roll result
  (`variant="compact"`, `ListPage` until 9b moves it to `face`), a row (`RowMain`: tables, search, `/homebrew`,
  `/lists/<uuid>`, `/s/`; 9a's `CompactRow` and its unfolded `RowMain full`), and a grid tile (`TableRows`
  grid). Print, the copied text and the share stubs are not screen surfaces and do not change.
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
| `/lists/<uuid>` rows (`ListPage` `RowMain`; 9a `CompactRow` up to 760 px) | the relation line; «Core» | no relation line; no «Core»; 9a's meta line draws the price, else another book's tag, else nothing | the same |
| `/s/<token>` rows (`TableRows`) | the relation line; «Core» | no relation line; no «Core» | the same |
| Grid tiles (`TableRows` grid) | the kind badge; no source tag, no relation | the kind badge is one pill (R5, T5) | nothing |
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

## Decisions of this pass (owner-confirmed rule; planner defaults for the parts the owner did not name)

| # | Decision | Reason and trade-off |
|---|---|---|
| K1 | The full record card is `variant === 'full'`, `dossier` or not; one derived `whole` in `RecordCard` gates the ladder, the relation block and the «Core» badge. No new prop. | The four full-card callers are exactly the surfaces the owner named plus the editor preview; `face` and `compact` are exactly the compact cards. A prop would add a variant before a caller needs it (`CLAUDE.md`). |
| K2 | The editor preview keeps R1's lines. | It previews the record page; its author edits «Улучшается до», «Получается из» and «Комплект» in the same form and needs to see the result. |
| K3 | The set bonus goes with the set line on a compact card (default). | The owner said "sets"; the bonus holds only with the whole set, and its lead names the set. Accepted: a roll result of a set piece does not show the bonus. See "Feedback to batch here", F1. |
| K4 | The tier ladder goes with the relation lines on a compact card (default). | The ladder is the upgrade line (`eq.line`, «Линия улучшений» in the editor), the same relation as «Улучшается до». See F2. |
| K5 | R2 moves out of `hiddenTags`: the `core` flag goes, and a pure `isCoreBook(it)` in `lib/label.ts` serves `RowMain`, `RecordCard` and 9a's `CompactRow`. `hiddenTags` keeps kind, tier and source, which depend on the page. | R2 no longer depends on the table; one predicate in `lib/` for three callers. `rowTags.ts` keeps its "repeats what the page says" scope. |
| K6 | `RowMain` loses `span.rcraft`, its CSS, its `index` prop and the imports only it used; `TableRows` loses `index`; every caller drops it. | An unused prop fails the lint; `index` fed only the relation line (fact 2). |
| K7 | R5 at the root: `.badge` becomes `display: inline-block`. In a relation run the space before the badge is U+00A0, and `.craft :global(.badge)` takes `margin-block: 2px`. | An atomic inline box never splits, wraps inside its border, and its margin box enters the line box, so lines with a badge open by the badge's height plus 4 px. One change fixes both defects (fact 4); flex-item badges do not move (fact 6). |
| K8 | The tile's kind badge keeps the full term: `.tile-k` takes `max-width: calc(100% - 14px)` and `text-align: right`, and `calc(100% - 44px)` only while the tick box draws (`ticks`). Below 360 px or in the selection mode a weapon label wraps inside its one pill (`text-wrap: balance`). | One name for one thing: rows, cards and filters say «Основное оружие». Precedent: the owner kept the full «Альтернативные таблицы» on a two-line chip at 360 (2026-10-23, B5-2) over a short label. Accepted: in the selection mode at 360-412 a weapon pill is two lines tall over the picture's top-right corner. Rejected: a tile-only short label («Основное», "Primary"; a second name and four strings), `white-space: nowrap` alone (the tile clips the label), `box-decoration-break: clone` (two pills for one tag). See F3. |
| K9 | No placeholder replaces the lines on a compact card. | The owner: nothing. The name link and the row press already lead to the full card. |
| K10 | `#/search ~ relations as gm3` keeps its id with a new `why` (the own bedrolls ranked with the catalog ones; no row draws a relation line); a new state `#/search ~ relations, dialog as gm3` opens `ci1`'s row and proves the dialog keeps the line. | The dialog was not seeded with own relations; the rule's "dialog keeps" half needs a golden. |
| K11 | The decision file below records R1-R5 and what was rejected. | The rule outlives the task and reverses a line of a recorded decision. |

## Placement

**Recommended: fold T1-T8 into batch 9a**, run before 9a's S1, with no batch of its own.

| Option | Extra gate runs | Extra minutes | Lands on production |
|---|---|---|---|
| Fold into 9a (recommended) | none: 9a's one re-seed, one `check:fast`, one CI run and one review carry it | 15-20 (the extra vitest files, a larger re-seed diff to read, about 10 more review minutes, three more shots) | with wave 3 |
| Batch T of its own before 9a | +1 golden re-seed (four shards), +1 `check:fast`, +1 CI run, +1 batch review, and by habit one fix cycle (+1 `check:fast`, +1 CI): 4-6 runs | 65-85 | with wave 3, the same day as the fold |
| Batch T and its own squash onto `main` before 9a (a new wave 2b) | T's runs, plus one `main` CI run with the deploy and the merge back | 80-100 | about five batches (9a, 8, 9b, P, 10) sooner; it changes the owner's three-wave plan, so it is the owner's call |

Criterion (`CLAUDE.md`, "Size a batch by its gates"): T shares `RowMain`, `TableRows`, the list and `/s/` goldens
and the one golden re-seed with 9a, and it changes no public contract. The one split criterion that could apply,
"a different route and filter set", does not hold: T changes two components and one badge rule, not a route's
filter set, and its moved goldens ride 9a's re-seed. A split with no criterion is a merge. Folding also avoids
rework: 9a's S3 would otherwise build `RowMain full` with the relation line that T removes. The owner asked for
speed (the fewer gate runs), and the separate batch reaches production no sooner unless it takes its own
squash. Owner feedback that arrives before 9a's dispatch rides this fold ("Feedback to batch here"); feedback
after it goes to batch 8's refresh or the post-wave-3 remediation.

## In scope

- R1-R5 on every surface of the table above; the spacing defect (item 1) on the full record card, where the
  line still draws; the tile pill (item 3); the roll result's «CORE» badge.
- Changed: `lib/label.ts` (`isCoreBook`), `lib/rowTags.ts`, `RecordCard.svelte`, `RowMain.svelte`,
  `TableRows.svelte`, `Badge.svelte`, the callers that pass `index` (`TablesPage`, `SearchPage`,
  `SharedListPage`, `HomebrewPage`, `ListPage`), their tests, `tests/app/states.js`, `tests/app/inventory.js`,
  the goldens, `tools/artwork/review/review.mjs` and `lib.test.mjs` if the head hash moves, the prose of T8.

## Out of scope

- Print (`PrintCard`, `lib/print.ts`), the copied text (`lib/share.ts`), the share stubs (`tools/build.js`),
  `relText` (print and share still read it), `catalog.csv`, `llms.txt`, `routes.json`, `CONTRACTS.md`.
- Another book's tag on a single-book roll page (`/roll/voa` repeats «Vault of Ages»): F4, not changed.
- The tile's roll number, the row tags other than «Core», the `.lt` language mark.

## Files expected

| Step | Files |
|---|---|
| T1 | `app/src/lib/label.ts`, `label.test.ts`, `rowTags.ts`, `rowTags.test.ts` |
| T2 | `RowMain.svelte`, `TableRows.svelte`, `TablesPage.svelte`, `SearchPage.svelte`, `SharedListPage.svelte`, `HomebrewPage.svelte`, `ListPage.svelte`, `tables.test.ts`, `homebrewCatalog.test.ts` |
| T3 | `RecordCard.svelte`, `record.test.ts`, `rollResult.test.ts`, `itemPage.test.ts` (unchanged expectations), `recordHost.test.ts` or `pickRow.test.ts` (the dialog keeps the lines) |
| T4 | `Badge.svelte`, `badge.test.ts` |
| T5 | `TableRows.svelte` (the tile rules) |
| T6 | `tests/app/states.js` (one new case), `tests/app/inventory.js` |
| T7 | `tools/artwork/review/review.mjs`, `tools/artwork/lib.test.mjs` (only if the hash moves) |
| T8 | `docs/specs/FEATURES.md`, `DESIGN.md`, `docs/specs/COVERAGE.md`, a new decision file, `docs/decisions/2026-09-30-hb-marks-homebrew-a-relation-shows-only-to-its-author.md`, `docs/DECISIONS.md` |

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
  row keeps «Hope & Fear»; a search row of a Core record draws no «Core».
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
- `hbBadge`: `{' '}<Badge cls="hb">` in place of `{' '}` (keep the eslint comment above it accurate).
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

- `tests/app/states.js`, the next free case number after 9a's 97 (check the list): "a badge is one box and keeps
  clear of the lines around it", RU and EN:
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

### T8. Prose, in 9a's commit

- `FEATURES.md`, "Tables and search" (the row line): "and the «Core» source tag on an equipment table (a row from
  another book keeps its name)" becomes "and the «Core» source tag on every row: the default book is unmarked; a
  row from another book keeps its name". Add: "A row draws no relation line."
- `FEATURES.md`, "Records", "Own relations on a card": "A row draws its catalog names, the first homebrew name
  and «и ещё N» as text." becomes "Only the full record card - the record page, `/h/`, the dialog and the
  editor's preview - draws the relation lines, the set line with its bonus and the tier ladder; a roll result, a
  list's roll result, a row and a tile draw none (owner, 2026-11-04)." The roll result line and the dialog line
  ("the dialog draws both as badges") gain: a roll result draws no «Core» badge.
- `FEATURES.md`, "Tables and search", the grid line: "a table of more than one kind labels the tile with a kind
  badge" gains "one pill: a long label wraps inside its border".
- `DESIGN.md`, "Cards": the "Relation lines" bullet becomes "**Relation lines:** «Получается из», «Улучшается
  до», the set line and its bonus, and the tier ladder draw on the full record card only (`full`: the record
  page, `/h/`, the dialog, the editor preview); `face`, `compact`, rows and tiles draw none. A homebrew name draws
  the plain bordered badge «Хоумбрю» after it on the same line; a catalog name draws none."
- `DESIGN.md`, "Badges": add "**One box:** a badge is an inline block: it never splits across lines, a long
  label wraps inside its border, and in running text it keeps 2 px from the lines around it. **The default
  book:** «Core» draws on the full record card only; every other source keeps its tag."
- `COVERAGE.md`: the `homebrewCatalog.test.ts` entry ("the own relations kept on a catalog row") reads "the own
  relations in the dialog of a catalog row"; the `tables.test.ts`, `record.test.ts`, `rollResult.test.ts` and
  `rowTags.test.ts` entries name the new cases; the new `states.js` case and the state count.
- Decision file `docs/decisions/2026-11-04-relations-and-the-core-tag-draw-on-the-full-card-only.md`:

  ```markdown
  # 2026-11-04 - Relations and the Core tag draw on the full record card only

  - Supersedes in part "(HB) marks homebrew, and a homebrew relation shows only to its author" (2026-09-30): a row draws no relation line.
  - Task: `57` (owner, 2026-11-04, chat: "consistency first"; "on record card dialog we also can show them, don't show only on compact representation"; "yeah let's make it consistent").
  - Decision: «Получается из», «Улучшается до», the set line with its bonus and the tier ladder draw on the full record card only (`RecordCard` `variant="full"`: the record page, `/h/`, the dialog, the editor preview); a roll result, a list's roll result, a row and a tile draw none, at every width. «Core» is unmarked on every compact surface and named on the full card; another book's tag and every homebrew tag draw as before. A badge is one inline block: it never splits across lines and keeps 2 px from the lines around it. Specs: `FEATURES.md` "Tables and search", "Records"; `DESIGN.md` "Cards", "Badges".
  - Rejected: hiding the homebrew tag everywhere but the full card (the owner's first lean; the owner kept the tag); the relation lines on the item page only, without the dialog (a row press opens the dialog, so a table, search or list reader would lose them; the owner's answer); a placeholder line on a compact card (the name already links to the page); a tile-only short weapon label («Основное», "Primary": a second name for one type); `box-decoration-break: clone` (two pills for one tag).
  - Accepted trade-off: a roll result of a Core item no longer shows what it upgrades to, its set or its bonus; one press shows them.
  ```

  In the 2026-09-30 file, above "- Task": `- Superseded in part by "Relations and the Core tag draw on the full
  record card only" (2026-11-04): a row draws no relation line.` Then `node tools/decisions.js`.

## Acceptance criteria

Each line is its own line in `plan-9a.md`, "Folded from `plan-tags.md`".

- R1: `face` and `compact` cards draw no «Получается из», «Улучшается до», set line, set bonus or tier ladder;
  `full` cards (page, `/h/`, dialog, editor preview) draw all of them as today (`record.test.ts`, T6.3).
- R1: no row draws a relation line - tables, search, `/homebrew`, `/lists/<uuid>` (full row and 9a's compact and
  unfolded rows), `/s/` (`tables.test.ts`, `homebrewCatalog.test.ts`, `listPage.test.ts`, `sharedListPage.test.ts`).
- R1: the dialog of a row keeps the own relation lines with their «Хоумбрю» badges (`#/search ~ relations,
  dialog as gm3`, the T3 dialog case).
- R2: the roll result's «CORE» badge is gone: a Core result on `/roll/std` draws no source badge at 360 and 1180
  (`rollResult.test.ts`, T6.3, the `_roll_std*` goldens).
- R2: no row draws «Core» on any table, search or list page; the dialog's badge row keeps «Core»; the record
  page's path line keeps «Core · ...» (`tables.test.ts`, `record.test.ts`, goldens).
- R2 in 9a: the compact row's meta line draws the price, else another book's tag, else nothing; never «Core»
  (`compactRow.test.ts`).
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
- `hiddenTags` has no `core` flag; `isCoreBook` is the one predicate; `RowMain` and `TableRows` have no `index`
  prop (`git grep -n -E "hide\?\.core|core: !!EQ_TABLE"` is empty).
- Print, the copied text and the share stubs do not change: `node tests/run-all.js app/print` is CI's;
  `lib/print.ts`, `lib/share.ts` and `tools/build.js` have no diff.
- New state `#/search ~ relations, dialog as gm3` with its RU and EN golden and an axe case; `#/search ~
  relations as gm3` has its new `why`.
- T8's prose, the decision file, its pointer in the 2026-09-30 file and `node tools/decisions.js` with 0 problems,
  in the same commit.
- `node --test tools/artwork/lib.test.mjs` passes (T7).

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
   | 360 and 1180 | each row above | T6, goldens |

   Row order, the primary action, folds, popups and sticky regions do not change. A roll result and a row get
   shorter (fewer lines); no `FIRST_SCREEN` offset moves, because the first result and the first row start where
   they did.
2. Error scenarios: not applicable to stored data - no write path or stored shape changes. Loading, a failed
   read, offline and a stale tab draw what they draw today; a record named by a relation and deleted drops out of
   the full card's line as today. A revert to the previous frontend draws the lines on every surface again; no
   data moves.
3. Consistency. `FEATURES.md`, "Consistency rules": one name for one thing (the tile keeps «Основное оружие»;
   K8); the row rule "a row hides the tags that repeat what the page already says" is extended, not departed
   from. Siblings: every compact surface (rows on five pages, tiles, two roll results) now draws the same set of
   tags and no relation; the three dossier surfaces and the editor preview draw the same full card. Named
   differences: print and the copied text keep the relation blocks, the set label and «Core» (out of scope; a
   printed card and a pasted message have no surrounding page); a single-book roll page still repeats its book
   tag (F4).
4. RU/EN parity: no string is added, changed or removed. The goldens and T6 run in both languages; the EN tile
   labels are the longer ones.

## Goldens expected to move

Golden width is 1100. In addition to 9a's own list and `/s/` families (whose rows lose the relation line and
«Core» in the same re-seed):

- `_search*` (about 12): rows lose «Core» and the relation line.
- `_roll_std*` (about 10) and any `_roll_*` result of a Core record, an upgrade, a set piece or a laddered
  weapon (`_roll_voa*` holds ladders): the result loses «Core», the relation lines and the ladder.
- `_tables_*` of mixed books (`alt_item`, `alt_consumable`, `other_starting`) and every table golden that holds a
  row with a relation (`_tables_alt_consumable` holds 11): rows lose «Core» or the relation line.
- `_homebrew_*` list states as gm3 (`_homebrew_as_gm3`, `~ bar more`, `~ filter sheet`, `~ import held names*`,
  `~ more`, `~ narrow`, `~ search`, `~ select*`, `~ tabs`): rows lose the relation line.
- Not expected to move: `_i_*`, `_h_*`, every dialog state, the editor states, `_p_*`. A move there is a defect
  to read.

Estimate: 40-70 goldens beyond 9a's. Seed with the four shards; never edit a golden by hand.

## Tests

| File | Cases |
|---|---|
| `lib/label.test.ts` | `isCoreBook` |
| `lib/rowTags.test.ts` | no `core` |
| `record.test.ts` | R1 and R2 per variant; U+00A0 before `.badge.hb` |
| `rollResult.test.ts` | no «Core», no `.craft` |
| `recordHost.test.ts` or `pickRow.test.ts` | the dialog keeps the own relation line; axe |
| `tables.test.ts` | no `.rcraft`; no «Core» on a mixed table and on search; another book kept |
| `homebrewCatalog.test.ts` | the own relations in the dialog, not on the row |
| `tests/app/states.js` | the new case (T6) |

## Verification

Inside 9a's order (`plan-9a.md`, "Verification"): the T test files join step 1's vitest list (`label`, `rowTags`,
`record`, `rollResult`, `recordHost` or `pickRow`, `tables`, `homebrewCatalog`); step 2 reads T7; step 3's `git
diff --stat tests/app/snapshots` expects the families above too; step 4 rebuilds `docs/DECISIONS.md`. The bundle
shrinks by about 0.2 kB (the row's relation line and its CSS). The new case and the sweeps run on CI.

## Risks and do-nots

- Do not hide the homebrew tag anywhere it draws today (owner's refinement). Do not touch print, the copied text
  or `relText`.
- `inline-block` on `.badge` changes the line metrics of every inline badge (fact 6): read the «Сейчас» badge on
  `/account` in the shots; a flex-item badge must not move (`card-meta`, `.rh`).
- Keep the badge's `overflow-wrap: anywhere`: without it an 80-character homebrew source tag pushes a row wide.
- A `face` card that loses its lines must keep its `flex: 1 1 auto` height in the roll grid (`RollResult`'s
  `.dealt`): two results in a row stay the same height.
- Review order inside 9a: `RecordCard.svelte`, `Badge.svelte`, `RowMain.svelte`, `TableRows.svelte`,
  `lib/label.ts`, `lib/rowTags.ts`, the states case, the prose - after 9a's own list.

## Writer tests

Facts for the orchestrator's dispatch, not a model choice.

| Test | Answer |
|---|---|
| 1 (a step asks for a choice, or an `Open design question:`) | no: the rule is the owner's; K3, K4 and K8 have defaults that block nothing |
| 2 (public contract, route, stored state, product law, migration, hook, configuration) | no: no contract, route or stored state; print is untouched; `CARD_HEAD_SHA256` is a test constant |
| 3 (visual judgment: print fitting, a golden re-seed, parity with a design node) | yes: 40-70 more goldens in 9a's re-seed and the badge and tile layouts; 9a already answers yes |

## Plan review

Not required (no trigger fired): no migration or SECURITY DEFINER function, no public contract
(`routes.json`, `ROUTES.md`, `CONTRACTS.md`, `llms.txt`, `tests/contracts.js` and `docs/fixtures/` do not
change), no stored data or `localStorage` key, no write or sync protocol. 9a's batch review covers it.

## Feedback to batch here

The owner may send more phone feedback. Until 9a's dispatch, each new item joins this brief as a T line and a
`plan-9a.md` acceptance line; after it, batch 8's refresh or the post-wave-3 remediation takes it. Open, each
with its default:

- F1 (K3). The set bonus on a compact card. Default: it goes with the set line. Alternative: keep the bonus text
  on roll results (it is the piece's rules text) and drop only the member names.
- F2 (K4). The tier ladder on a compact card. Default: it goes. Alternative: keep the ladder on a roll result of
  laddered equipment (one row of 26 px rungs).
- F3 (K8). A weapon kind pill at 320 px or in the selection mode wraps inside its one border. Default: accept.
  Alternative: a tile-only short label («Основное» / «Вторичное», "Primary" / "Secondary"), a second name for
  the type.
- F4. A single-book roll page (`/roll/voa`, the supplements) repeats the book's tag on each result. Default:
  unchanged (R3). Alternative: hide a tag that the page's book already says, as rows do.
- F5. Placement. Default: folded into 9a, live with wave 3. Alternative: its own batch and squash before 9a
  (wave 2b), live about five batches sooner, for 80-100 more minutes and a change to the three-wave plan.
