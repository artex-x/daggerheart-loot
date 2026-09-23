# Coverage matrix

What the suites in `tests/` and `tests/app/` actually assert, mapped onto the
features in `FEATURES.md`. Update this file whenever the shape of the
coverage changes - adding a suite, moving what a suite is responsible for, or
filling a gap.

Run: `node tests/run-all.js`, or one suite by name (`node tests/run-all.js
nosuch` lists none and exits 1 - `tests/run-all.js`'s own `SUITES` array is
the source of truth for the current list). Every suite's full output is
written to `test-output/<name>.log` whatever the result; the summary only prints
the first dozen failing lines. CI uploads that directory when a job fails.

## Suites

R0c (issue 47, `23c00a6`) deleted the static root (`index.html`, `app.js`,
`style.css`), the fourteen browser suites that drove it, `tests/i18n.js`, and
the parity harness that compared the two apps - "The rewrite against the app
it replaces", below, is what survives of that comparison, as history. Twelve
suite files remain, nineteen `run-all.js` rows (`app/golden` split four ways,
one per shard; `app/sweep` split five ways, one per width plus a second
language row at 1180):

- Five `tests/*.js` files, fs/node-only: `contracts` (trimmed to its pure
  half - the list-encoding fixtures and the docs-name check), `craft`
  (trimmed to two sections - data invariants and the share stubs), `dataint`,
  `derived`, `stub` (the generated `i/*.html` share stubs do not scroll
  sideways - never tested either app). `craft`, `dataint`, `derived`, and
  `stub` read `i/` off disk; `i/` is generated, not committed
  (`docs/specs/CONTRACTS.md` section 5), so a clean checkout needs a build
  (`node tools/build.js`, or `npm run check`, which runs it) before any of
  these four run outside `npm run check`.
- Seven `tests/app/*.js` suites test the built rewrite (`dist/`) - what Pages
  serves - in a real Chrome: `app/sweep`, `app/golden`, `app/contracts`,
  `app/states`, `app/typo`, `app/hues`, `app/print`. This is the layer B12
  added because nothing before it drove `dist/` with a trusted click, a real
  network, or a real clipboard; see "`tests/app/*`" below.

The table immediately below is kept as a **record**, not a current list: it
describes the twenty suites that tested the deleted static root, and each
one's **fate** - `kept` (fs/node-only, survives as is or trimmed), `ported as
is` (re-pointed at `dist/`, same assertions), `rewritten` (same intent, new
implementation), or `re-homed` (its assertions now live in vitest
component/state tests, or in a `tests/app/` case) - decided in `plan.md`,
"Phase 5 - the testing pyramid, planned", decided 3, and settled by R0b's
audit and R0c's deletion. Every citation of `app.js:N` or `style.css:N` in
this file (here and below) refers to the file's state at its last commit
before deletion, `23c00a6^`: `git show 23c00a6^:app.js` (or `:style.css`,
`:index.html`) reads it.

### The old-app suites (deleted at R0c, `23c00a6`) - kept as a record

| Suite | Kind | Fate | Responsible for |
|---|---|---|---|
| `dataint` | data | kept | ids, numbering, required fields, cross-references, equipment fields, text hygiene, image and stub files, and (since art-tooling B3) an `og/*.jpg` orphan check mirroring the existing `img/*.webp` one |
| `derived` | data | kept, re-pointed at R0c | `data.json` / `catalog.csv` / `i/*.html` rebuilt and compared byte for byte against what `npm run data` (run immediately before, in the same `npm run check`) just wrote - proving the generator agrees with its own output, not that a commit ships the matching bytes; in CI, a `git diff --exit-code` step after `npm run check` is what makes that second comparison bite (B4); counts spelled out in the files `tests/derived.js`'s `COUNT_BEARING_FILES` array names; `noindex` and the head (`headFacts`) read from `app/index.html` alone - before R0c this also compared it against the now-deleted root `index.html`'s head; the licence notice; die vectors read from `app/src/lib/dice.ts`'s `DIE_ART` (before R0c: parsed out of `app.js`); per-source pins (Dread, Vault of Ages, frames, equipment); `deploy.needs` includes the structural `browser` matrix |
| `parity` | migration | **deleted at R0c** (`23c00a6`) | was: the rewrite against the live app, the same script on both, differences reported - see "The rewrite against the app it replaces" below |
| `contracts` | contract | pure half kept; browser half ported to `tests/app/contracts.js` | golden fixtures: list encode and decode, both link variants, truncation, hash grammar for 28 route shapes, the equipment stat line in both languages, filter group key names against the docs, `data.json` top-level keys against `CONTRACTS.md` section 4 |
| `i18n` | source | **deleted at R0c**; superseded by a compile-time check | before R0c: dictionary parity in both directions, and no key the code asks for that is missing (`tests/i18n.js`, parsed out of `app.js`). Now: `app/src/lib/dict.ts`'s `Dict` type makes the same parity a `tsc`/`svelte-check` error in both directions - part of `npm run check`, not a separate suite. The one thing lost: the informational dead-key report (`I18N.md`) |
| `craft` | feature | trimmed to sections 1 and 6; sections 2-5 re-homed: `record.test.ts`, `share.test.ts`, `derived` | data invariants and the share stubs (kept); upgrade chains rendering and copying (re-homed) |
| `notes` | feature | **audited (R0b.1).** Covered already: `listPage.test.ts:112,290,298,318,544,560,562,565,570,574,581,603,614,656`, `state/lists.test.ts:305,325,333`, `lib/lists.test.ts:46,54,58,66,143,153,159`, `listLink.test.ts:39,41,51,60,94`, `sharedListPage.test.ts:134,166,257,273,299,301,335`, `share.test.ts:239,283`, `tests/app/states.js:385`, and the note text frozen in `tests/app/snapshots/_lists_a_noted.txt:59`/`_lists_a_note_opened.txt:44-45`. Ported (R0b.2, landed): the note-field group - the 3-line resting floor, a neighbour box not growing with its sibling, the real 320px ceiling with the text scrolling past it, and the shrink-back - plus the clear cross's `:has(:placeholder-shown)` visibility, both folded into `tests/app/states.js` case 13 (`noteTextareaHeight`, `tests/app/states.js:397-440`). Dropped: the toast's stale `display:none` rule (`Toast.svelte:65` is a popover now, the specificity clash it guarded cannot recur); `noteH` in prefs (no such key exists) | two notes: writing, copying, both links, migrating a v1 list, a v1 link, note field height |
| `lists2` | feature | **audited (R0b.1).** Covered already: `listPage.test.ts:222,388,424,449,487,557` (storage warning, empty roll field, batch actions, price modes/suggestion, reorder; full line map: `plan.md`, "R0b planned"), `listsPage.test.ts:93,101,171,178,190,217`, `sharedListPage.test.ts:106,166,186,213,232,257,272,305,335`, `state/lists.test.ts:305,325,333,341,351,370`, `lib/lists.test.ts:66,143,153,159`, `money.test.ts:20,29,55,105,168,222`, `numField.test.ts:56`, `share.test.ts:50,248,252,283`, `record.test.ts:187,402,412,421,428,442`, `tables.test.ts:182,284,556,920` (row carries its own roll number, selection, filter reset, per-section select-all; full map: `plan.md`), `facets.test.ts:54,66,230`, `tests/app/contracts.js:89,117,186`, `tests/derived.js:200`. Ported this batch (jsdom): `[data-goldhint]` is a `<span>` mirroring `title`, not a button (`listPage.test.ts:293`); the storage notice sits under the heading and above the rows on both `storedList`/`sharedList` routes (`listPage.test.ts:231`); the batch bar holds exactly two buttons with no percentage widget (`listPage.test.ts:437`). Ported (R0b.2, landed): a real HTML5 drag reorder (`tests/app/states.js:539`, case 17 `dragReorder`), a folded `<details>` surviving a select-all re-render (`tests/app/states.js:600`, case 18 `foldedDetailsSurviveRerender`), and the money-help box's measured width plus the pressed picker button's computed colour (`tests/app/states.js:729`, case 22 `moneyHelpAndPressedPicker`). Dropped: `[data-move]`/`.alttable` (markup the rewrite never had); the exact real-data counts 119/59/120 (`tests/app/contracts.js:186` pins the same invariant table-agnostically; `tests/derived.js` pins the dataset sizes); "row numbering is not recomputed under a filter" folded into `data.test.ts`'s real-data guard instead (see `eqtest` below) | list page: reorder, position entry, list search, storage warning, batch actions, upgrade steps, price modes, price suggestion, empty roll field, taking a shared list, per-list roll, kind filter |
| `select` | feature | **audited (R0b.1).** Covered already: `tables.test.ts:285,294,303,313,340,346,373,384,390,400,410,426`, `searchPage.test.ts:121,172`, `lists.test.ts:77,90,105,212,221,248`, `record.test.ts:448,471`, `state/app.test.ts:405,428,442`, `share.test.ts:189`; the two `elementFromPoint` hit-tests are covered *better* by `tests/app/states.js:54,68,86` (a trusted click through the real sticky stack, not a synthetic probe). Ported (R0b.2, landed): the selection bar pinned to the bottom of the viewport at 1000x900, and its buttons not spilling at 360, in `tests/app/states.js:511` (case 16 `selectionBarGeometry`). Dropped: `[data-act="collect"]`/`.row-add` (markup the rewrite never emitted); "an existing-list chip from inside a modal adds the record" (covered by composition - `lists.test.ts:248` proves it is the same `AddToList`, `:90` proves that control adds) | selection, batch add and copy, select all, reset on navigation, card and modal |
| `flows` | feature | **audited (R0b.1).** Covered already: `tables.test.ts:479,649`, `record.test.ts:200,448,471`, `listPage.test.ts:112,118,198`, `state/app.test.ts:273,281`, `sharedListPage.test.ts:106,273`, `share.test.ts:69,93,127,145` - the clipboard half stricter than the legacy suite: `share.test.ts:69` is a parameterised golden over `docs/fixtures/share/records.json`, captured from the live app char-for-char - `std.test.ts:120,130`, `lists.test.ts:248`. Ported this batch: `w118`'s beastform shape (a 5+ line attached block with its own stat line) added to `docs/fixtures/share/records.json` via `tools/capture-share-fixture.mjs`, which `share.test.ts:69`'s golden now names alongside the original eight. **Two divergences lived here; both fixed in R0b.4, and both now guarded again.** (1) A referenced card's `\n` -> `<br>` line breaks and its `daggerheart.su` outbound link - `app.js:886-896`'s `refHTML` writes both - are restored in `RecordCard.svelte`'s refs block as real text nodes (not `{@html}`) split on the line break, plus an `<a>` whose subdomain follows the language on screen (`r.url` in Russian, `r.url.replace('//ru.', '//en.')` in English, `app.js:882-883`). `record.test.ts` now asserts both: the split text nodes around the `<br>`, and the link's href in each language. Both still sit inside a `<details>` closed by default (`FEATURES.md`, "Records"), so a pixel diff cannot see them, but the structural goldens are not blind to both: `d.controls()` (`tests/app/driver.js:171-182`) filters on `offsetParent`, which does distinguish a properly-hidden closed panel from one that only looks closed - that is how a rendering bug in this very batch (the restored link staying hit-testable with the card closed until `RecordCard.svelte` gained style.css:400's own `.refs details:not([open])>*:not(summary){display:none}` rule) was found comparing `_roll_wondrous_pinned.txt`'s `controls` section, corrected in `acef2a8`. The `<br>` line breaks and the link's own text are still a golden blind spot (`d.controls()` reads only `button, a[href], input, select, textarea`, and the accessibility tree's own snapshot never opens a closed `<details>` to read its `<p>`) - `record.test.ts` is the only guard for those two. (2) A frame-armour record's copy text keeping the tier word the live app dropped was D11, tracked as a divergence; the owner's Q6 decision ("print the tier on frame equipment") paid it off instead of restoring the old app's behaviour. `app/src/lib/share.ts`'s `eqLine(...)` call no longer passes `noTier: isFrameRecord(it)` - the tier now prints on every stat line it builds, frame or not. `docs/fixtures/share/records.json` was recaptured with `tools/capture-share-fixture.mjs` (only `f33`'s `ru`/`en` full text changed, gaining the tier word - "Броня · Ранг 1 · ..." / "Armor · Tier 1 · ...") and `share.test.ts`'s golden loop covers all nine ids including it. Dropped: nothing else | modal, list address, clipboard, copying a whole roll |
| `eqtest` | feature | **audited (R0b.1).** Covered already: `data.test.ts:140` (the same real-data `it()` named under "Ported" below - eqtest has no pre-existing data.test.ts coverage of its own, only this batch's), `facets.test.ts:54,66,75,107,166,180,230`, `filters.test.ts:23,82,90,103,143,179,185,196,215`, `label.test.ts:126`, `i18n.test.ts:52,74,80`, `tables.test.ts:507,535,556,681,712` (filter panel draws, narrows on a chip, resets, equipment-table grouping, facet fields; full map: `plan.md`), `share.test.ts:67,93`, `tests/app/hues.js:99`. Ported this batch (jsdom): the real-data guards nothing else made - the 73/69 secondary/armour split, 381 unique English names, 11 Wondrous stat-blocked records, the `core:phy core:mag hnf:phy hnf:mag` book order, `firstT1[0] === 'Broadsword'`, Wondrous = 119 rows, and a filtered Wondrous subset's roll numbers are scattered rather than recomputed to 1..N (`FEATURES.md`, "Tables and search") - one `it()` in `data.test.ts:140`; the filter<->address loop after arriving by a filter link - a further pick does not reopen a folded panel, and a pill dropped while folded is not snapped back to what the link said (`tables.test.ts:791`); reset and the copy-link button hidden while the filter is empty, reachable with the panel folded (`tables.test.ts:565`). Ported (R0b.2, landed): `.rstats` is one tone across weapon/secondary/armour (`tests/app/hues.js:141`). Dropped: the `scrollY > 100` smooth-scroll assertion (the app's own half is covered at `tables.test.ts:856,1018`; the rest is a test of Chrome); the old chip strip above search (markup the rewrite never emitted) | equipment: class, order, filters, filter links, anchors, colours, copying, all sources |
| `print` | feature | **audited (R0b.1), ported whole - landed (R0b.3).** `tests/print.js` entire, transposed onto `fresh()` and the moved driver (`tests/app/driver.js`) as `tests/app/print.js`, plus `tests/parity/specs.js`'s `sheetCounts`/`cardFit`/`printMedia`/`copiedPrintLink`, which die with the harness and are measured nowhere else. `dist/` renders no `[data-act]` anywhere (checked live before the port); the colour/black-and-white and "back" controls are gripped by name instead, the fallback `tests/parity/specs.js` already used for the same buttons. On this Windows host, 2026-09-16, the longest-text set's ladder never reaches past the font step - ubuntu CI reaches the art rung on the same route (`print` suite, CI run 35130947774, green on `98ddf52`); a local result is advisory and may legitimately fail a cell CI passes (`CLAUDE.md`). The font-step check stayed; a host-independent rung invariant (if some card's `--pcpad` sits at its own floor, some card's art is hidden) was added beside it so the end of the ladder is still checked wherever it is actually reached. The structural goldens carry twenty-one print states - `#/print/ci1-q1` and its black-and-white twin, `#/print/ci1*3-q1` (the counted card), the nine-card sheet and its twin, the long-text sheet and its twin, the ten-id two-sheet state, the 181-id cap state, `#/print/nope`, Dragon's Vault's own worst-case sheet (Frostwyrd's longest rung, the One/Two-Handed grip mark, the Spellcast trait cell, two second strips (Ember, Steampowered Gauntlets) and the set line on both members) and its black-and-white twin, Vault of Ages Volume 4's worst-case sheet (the artifact weapon card, the three set members, a consumable artifact, a folded condition line, two lists) and its black-and-white twin, and seven compact states (`ci1-q1`, the nine-card and long-text sheets, each in colour and black and white, and the ten-id sheet on one compact page) - as accessibility trees only (`tests/app/inventory.js`) - a tree says nothing about millimetres | sheet grid, card size against the design, versatile weapons, dice by damage type, armour, black and white, art edges, text fitting, short black-and-white text growing to its cap, the compact 4x4 sheet in either layout, entry points |
| `noart` | feature | **audited (R0b.1).** Covered already: `record.test.ts:249,254,257,304,364`, `printPage.test.ts:226`, `ports.test.ts:215,230`, `tests/app/states.js:330`. Ported this batch (jsdom): no copy-image button for a record with no art at all (`record.test.ts:307`); the broken-art memory survives a navigation away and back (`record.test.ts:319`). **The real-load-failure half was a divergence; fixed in R0b.4.** `RecordActions.svelte:105` now gates the copy-image button on `it.img && !app.artBroken(it.id)`, matching the live app's `hasImage(it)` (`app.js:1684`, used at `:2047`). `record.test.ts` covers the broken-art side beside the existing no-art test, and `tests/app/states.js` case 11 (`brokenArtPath`) gained the real-browser assertion that the button is gone once the picture's own request is aborted. Dropped: the `noart` placeholder class (`desc.ts:109-119` returns only `NO_ART`, no such class exists); D22 makes `send()` pass a file where there is art, so "share attaches no file" is no longer an impossible case - it is covered by `record.test.ts`'s "attaches no file for a record with no art" and "attaches the picture where there is art" cases; the table-row placeholder (`RowMain.svelte:60` calls the same `artSrc`, duplicative of `record.test.ts`) | records without artwork, and artwork that fails to load |
| `behave` | journey | **audited (R0b.1).** Covered already: `roll.test.ts:57,62,83,167`, `std.test.ts:51,87,94,100,110,120,130`, `alt.test.ts:143,150,165`, `searchPage.test.ts:162,208,235,245`, `shell.test.ts:39,49,69,76,83,191`, `state/app.test.ts:79,87,98,132,138,154,428,486,509`, `ports.test.ts:43,215`, `record.test.ts:169,297,304,341,364`, `share.test.ts:69,110`, `dice.test.ts:10,20,27`, `data.test.ts:87,91,247`, `sections.test.ts:125,137`, `lists.test.ts:231`, `listsPage.test.ts:107,190`, `tables.test.ts:214,649`, `tests/app/states.js:161`. Ported (R0b.2, landed): real history Back/Forward across a table and a section, in `tests/app/states.js:483` (case 15 `historyBackForward`) - `ports.test.ts:694,701` only proves `history.back()` was *called*, not what came back. Dropped: the `dhloot.prefs.v1` group (a removed feature - the rewrite writes only `dhloot.lang.v1`/`dhloot.home.v1`/`dhloot.warn.v1`/`dhloot.lists.v2`); tab counters (`TabBar.svelte:32-40` draws no counter element); the die's literal viewBox (`dice.test.ts:27` already pins it); "no pin control on a record" (`app.test.ts:44` already refuses a pinned non-section); "tables work with no storage" (`ports.test.ts:43` makes the throw structurally unreachable) | rolls, search, language, remembered and corrupt settings, starting section, navigation, copy and share, storage disabled |
| `qa` | regression | **audited (R0b.1).** Covered already: `sweep.js:137,316,324,332,341,356`, `numField.test.ts:12,22,36,48,101`, `roll.test.ts:115,132,139`, `shell.test.ts:31,39,49,174,218,233,249`, `std.test.ts:110`, `searchPage.test.ts:221`, `state/app.test.ts:485`, `tables.test.ts:488,585,663,829`, `listsPage.test.ts:171,190,217`, `lists.test.ts:147,236`, `listPage.test.ts:112,150,638`, `sharedListPage.test.ts:335`, `state/lists.test.ts:63,200,370`, `hash.test.ts:422`, `tests/app/contracts.js:75`, `tests/app/states.js:178,348`. Ported this batch: `scrollbar-gutter: stable` (`tokens.css:93`) asserted in `tests/derived.js:139`; `defer` on both built script tags in `tools/smoke-file-url.mjs:66`; the og head facts pinned as absolute values, not only "the two heads agree" - the image is not a per-item photo, 1200x630, the file is on disk, `twitter:image === og:image`, `og:locale` - and every stub is `summary` with `og/<id>.jpg` (`tests/derived.js:150`). Ported (R0b.2, landed): tile geometry with `/img/*.webp` blocked at 360 (`tests/app/states.js:644`, case 19 `tileGeometryNoArt`); the storage notice under 140px tall at 320 (`tests/app/states.js:680`, case 20 `storageNoticeAt320`); a **button** keeping focus across a re-render (`tests/app/states.js:704`, case 21 `buttonFocusSurvivesRerender` - `tests/app/states.js:348` remains the *input* case, case 12). **The `.results` live region was a divergence; fixed in R0b.4.** `StdPanel.svelte`, `RollPanel.svelte` and `AltPanel.svelte` now emit `role="status" aria-live="polite"` on the results container, matching the six `app.js` sites (`app.js:2235, 2292, 2325, 2341, 2368, 2391`). `std.test.ts`, `roll.test.ts` and `alt.test.ts` each assert `role`/`aria-live` on that container. Dropped: the one-dash grep and the `baseUrl()` grep over `app.js` (source text R0c deletes; every user-visible range string is pinned positively elsewhere); the unreadable-address rewrite (deliberately superseded by B12.1 - `sharedListPage.test.ts:335`, `sweep.js:316`); the whole-document Cyrillic-in-EN-labels regex - `shell.test.ts:39-55` plus `sweep.js`'s per-page run is the substitute, recorded as a thin spot below | one case per defect from an external report: caret, focus, live regions, contrast, truncated link, two tabs, previews, keyboard |
| `states` | journey | superseded by `tests/parity/specs.js`'s `STATES`, then by `tests/app/states.js`; that inventory itself now lives in `tests/app/inventory.js` | states reachable only by clicking |
| `audit2` | sweep | ported as is | every address, at four widths, in both languages |
| `craftmob` | layout | **audited (R0b.1), ported in five places - all landed.** Already ported (pre-dates R0b.1): the page-level sideways-scroll class at 360/390/768/1180 (`tests/app/sweep.js:255`). Landed (R0b.2): the four craft-heavy worst-case records `#/i/w65`, `#/i/w3`, `#/i/ci19`, `#/i/w2` (`tests/app/sweep.js:54-57`) plus `.craft, .rcraft, .dicebar, .numrow` in the clipped-text selector list with the spill/squeeze-under-60px/`.craft a` tap-height reads (`tests/app/sweep.js:282-303`); the selection-bar overflow at a narrow width (`tests/app/states.js:511`, case 16 `selectionBarGeometry`); the standalone share stub `i/w3.html` at 320/390 (`tests/stub.js`); a selected tile's own fill (`tests/app/hues.js:159`). Thin spots recorded below: the `@media (hover:hover)` guard, and the 320px width | narrow screens, touch highlight, selection bar overflow |
| `typo` | layout | ported as is; `tests/app/typo.js` is in fact stricter than this - its `EXPECTED` set turns "control not found" into a failure the live suite used to swallow | two fonts and one size scale, every page, both languages |
| `hues` | layout | rewritten (reads rendered badges, not injected spans) | badges that can share a list are told apart by hue |

### `tests/app/*` - the same real Chrome, against `dist/` (B12)

| Suite | Kind | Responsible for |
|---|---|---|
| `app/sweep` | sweep | every address `audit2` covers plus the routes only `app/states` reaches, at four widths, both languages; axe with `color-contrast` on every cell (RU only at 360/390/768, both languages at 1180); a focus-ring walk over six named addresses at 1180 |
| `app/typo` | layout | `typo`, re-pointed at `dist/` |
| `app/hues` | layout | colour read off rendered badges and the real roll button, not an injected span |
| `app/contracts` | contract | the browser half of `contracts`, re-pointed: the link the app writes/reads, a truncated link, the llms.txt-described link, every route fixture, the stat line, filter group names |
| `app/print` | feature | the deleted `tests/print.js`, transposed onto `dist/` and the moved driver: sheet grid, card size against the design (millimetres, not a tree), versatile weapons, dice by damage type, armour, black and white, art edges, text fitting, short black-and-white text growing to its cap without a spill (and colour never growing), the compact sheet (44x63 mm cards, four to a row on A4, the grow cap and the colour ceiling at 44 mm, the design measurements at 70%), entry points; plus the four print specs the deleted parity harness used to run (`sheetCounts`, `cardFit`, `printMedia`, `copiedPrintLink`) - the sheet's counts, the fit ladder's own written numbers at every width, the sheet under print media, and the copied set link; `sheetCounts` and `cardFit` run over the seven compact states, `printMedia` over `TEN ~ compact` (`copiedPrintLink` runs no compact state); an English pass added at R0c (`sheetCounts`/`printMedia` stay Russian-only, a comment in the file says why) |
| `app/states` | journey | the twenty-seven states only a trusted click, a real clipboard, a real second tab or a real network reaches: new list from the card/bar/modal, two Other frame values picked (fresh and live), `<dialog>` focus/Escape/return, two tabs sharing storage, the packed link, copy text/image, a broken art path, focus surviving a keystroke, the note textarea's height (plus, R0b.2, the list note-field group's real CSS geometry), a roll's card `<img>` node replaced, real history Back/Forward, the selection bar pinned to the viewport at a narrow width, a real HTML5 drag reorder including a release inside the row gap marking both rows at once, a `dragenter` crossing into a row's own child reporting `defaultPrevented`, a `drop-after` row with its note box open painting gold in a measured strip at its bottom edge - pixel probe via `pngjs`, at the end of the list and in the middle of it, that same row's redrawn mark on its open note box declaring no transition of its own and the base mark's `transition-property` excluding `box-shadow` - read with reduced motion briefly relaxed then restored, and a cancelled drag (dragend, no drop) leaving the order and the marks untouched, a folded `<details>` surviving a select-all re-render, tile geometry with art blocked, the storage notice under 320px, a button keeping focus across a re-render, the money-help box plus the pressed picker's colour, and (case 26) a touch-emulated viewport where the drag grip is hidden and a committed position both moves a row and announces it through a visually hidden live region, plus that same grip drawn again for a pointer that can hover, and (case 27) the add-to-list menu at 50 lists, at 1100 and 360 wide: no taller than 342 px, its search and «+ Новый список» inside the menu and the window, the chips scrolling on their own, the five lists holding the record first, and the new-list form started with the query |
| `app/golden` | structural | one accessibility-tree-plus-controls text snapshot per state in `tests/app/inventory.js` (148 states, both languages, four shards), compared byte-for-byte against `tests/app/snapshots/*.txt` - a control gone, a heading moved or a label renamed is a line in `git diff`, not a percentage. Regenerate a golden only with `node tests/app/golden.js --update`; `.claude/hooks/edit-guard.mjs` refuses a hand edit. It says nothing about colour, spacing, or which picture sits behind a correct `alt` - that stays `tests/app/sweep.js`'s alone since R0c deleted the pixel harness that used to also watch it. The text a same-shape sibling run folds to its first two and last two occurrences (rule A) and the tail of a name past 64 code points (rule B, `namelen`/`namehash`) are both blind past that boundary. Mostly that is `data.js` catalogue text already owned by `tests/derived.js`, `tests/dataint.js` and the contract fixtures, **but not only**: retention is positional, so any node sharing a row's signature falls in the blind interior too. In `_tables_eq_weapon.txt` the tier 1 `checkbox "Выбрать все (N)"` and the last section's label and select-all (`АРТЕФАКТЫ`, since Volume 4) survive; the other select-alls and every `StaticText "РАНГ N"` are elided, and a rename of one of those is owned by no other suite now that `tests/parity.js` is deleted. What still fails: any attribute value change, any node added or removed (the group total moves), a role or tree-shape change, and a name change in a kept position or in any group of five or fewer. What does **not** fail: a rename inside an elided interior, and a **reorder of two same-signature siblings both inside it** - swapping them leaves the file byte-identical. |

### The golden format, and why

Rule A groups a node's children by a signature over role + attribute values +
child roles, names excluded, across the whole child list rather than by
consecutive run (a table row is a `checkbox` and a `button` at the same
depth, so run-detection would see runs of one). Rule B caps names at 64 code
points and hashes the whole name (fail-closed), appending `namelen`/
`namehash` only when it fires, so an uncapped line stays byte-identical to
the seed. Order is load-bearing: the sole-`StaticText` transform runs first,
then rule A's signatures, then elision, then rule B's cap. Why 64 and not 40:
40 saves about 0.2 MB more, but cuts the line below where a person can
identify the row from the diff - the seeded format was refused for an
unreadable diff, not for its byte count.

Measured over the real 105-file corpus: seeded 5,204,669 B / 40,361 section
lines; elision alone 3,142,681 -> 664,988 B on tree sections; the cap alone
2,040,411 -> 946,374 B on controls at an unchanged 12,829 lines; both applied
together, ~1,575,000 B / 24,346 lines; largest file 372 KB -> 89 KB. 14,720 of
40,361 lines carried a name over 64 characters, up to 1023 long - cap-only
leaves the line count at 27,532 (bytes, not churn, is what the cap buys).

`golden.js` shards four ways, mirroring the old parity matrix's own
`stateIdx % of !== n` interleave, which spreads the ~7 s `#/tables*` arrivals
across shards instead of piling them into one; a shard runs ~250 s, 2.4x
headroom under the 600 s cap. `--shard` suppresses neither the missing-golden
guard (per-state) nor the stale-file guard (against the whole inventory);
only `--only=` does - the mechanical half of the rule that an `--only=` probe
proves less than a full shard.

`page.accessibility.snapshot()` exists in the installed puppeteer (25.9.0);
two consecutive captures of one arrival were byte-identical on all seven
routes probed. Capture itself costs 12-120 ms; the arrival is ~1.2 s, and ~7 s
on `#/tables*` - why the shard interleave above exists, and why arrival, not
capture, is what a golden run actually pays for. Three serialised
accessibility-tree fields are per-run poison: `elementHandle`,
`backendNodeId`, `loaderId`; with the absolute `file://` url they were the
entire non-determinism left in the format. The `url` is
`file:///E:/.../dist/index.html#/...` (three slashes, one machine's path) and
never equals the driver's own target string - `normUrl` cuts at the last
`/dist/index.html`, never by prefix (CI is ubuntu). `document.
styleSheets[n].cssRules` throws over `file://`, so a probe reads computed
values, not matched rules.

`NAME_FN` is `aria-label || title || textContent`, with recurring
consequences: the print link is gripped by its long `title`; a table's select-all
cannot be gripped (no `aria-label`/`title` on the label); the own list's
select-all is gripped by its `aria-label` "Выбрать все", which
`tests/app/inventory.js` depends on; every row's own box
is named "Выбрано", so a second row needs `d.click(name, nth)`; a card's
accessible name has no spaces because the live markup had none between
`<b>`, the badge and the empty `<p>` - a Svelte template newline there would
change the inventory. `confirm()` blocks puppeteer; the driver auto-accepts
and records the message.

The controls section and the accessibility tree disagree about the same row
by design and must not be reconciled: matching one against the other matched
462 of 12,829 entries (`NAME_FN` has no inter-element spaces, carries the
roll number, keeps case; the accessibility name inserts spaces, omits the
number, reflects `text-transform`). That is the `Сообщество <i>любое</i>`
class the two instruments keep apart - why the controls section gets the
name cap only and keeps all 12,829 lines.

### app/states - the case-7 flake

A states case-7 flake (a loaded-host contention symptom, the same family
`.claude/README.md`'s "A check reporting zero coverage everywhere" catalogues
elsewhere) was fixed by a two-stage wait with its own message per stage and
no swallow: the page under test carries a `storage` listener and its own
counter, so stage one answers "did Chrome deliver the event" and stage two
"did the page redraw", against a 30 s deadline chosen against `driver.js`'s
`protocolTimeout: 300_000`. Stage-one red is the environment; stage-two red
is the app. Rejected: raising the old 5000 ms wait to 30000 alone (keeps the
swallow); polling from Node with `page.evaluate` (more CDP round trips, the
slow thing under load); reloading the second page (destroys what the case
tests).

### app/states - the drag pixel probe's viewport trap

The note-box gold-line probe in case 17 opens its own 1180x1600 page, not
the case's shared 1180x900 one: `drag.ts`'s own 120px edge-scroll band
(`EDGE`) starts `window.scrollBy` under a `dragover` whose `clientY` sits
within 120px of either viewport edge, and that scroll moves the page under
whatever rect the probe already measured. At 1180x900, with every row's note
open, the probed row's own edge sat inside the band and the strip read a
stale class for two of three cases; at 1180x1600 the same code is stable.
Any later probe placed near a row's edge has to clear that band the same way.

### app/states - two harness facts a device-capability case runs into

Measured while adding case 26 (announce a reorder, hide an inert grip):

- **Every page `tests/app/` opens runs under `prefers-reduced-motion:
  reduce`** (`driver.js`'s own `prepare()`), and `tokens.css`'s blanket kill
  forces every computed `transition-duration` to `0s` under it. A duration
  read in any of these suites is `0s` regardless of what is declared, unless
  the case briefly emulates `prefers-reduced-motion: no-preference` for that
  one read and restores `reduce` after (case 17 does this).
- **`page.emulateMediaFeatures` cannot move `hover` or `pointer` at all** -
  Puppeteer rejects both features outright, and a raw CDP
  `Emulation.setEmulatedMedia` with them changes nothing `matchMedia` can
  see. Only `page.setViewport({ isMobile: true, hasTouch: true })` moves
  them (`hover: none`, `pointer: coarse`, `any-hover: none`,
  `any-pointer: coarse`); a plain narrow viewport with no touch still reports
  `hover: hover`. This is why `tests/app/sweep.js`, which walks widths with
  no touch emulation, cannot see a `(hover: none)`/`(any-hover: none)` rule
  and case 26 owns that coverage instead.

### CI matrix notes

The golden suite got a sharded CI job of its own rather than joining
`check`'s pooled step: `check` was already 11m51s, and a 7-17 min suite on
top would make it the critical path - "CI picks the suite up for free" was
wrong at that cost. Measured, the golden CI job costs the workflow nothing
(runs `34753801089` vs `34747570250`): `check` 11m51s -> 11m57s, the four
`golden` shards 1m43s-2m02s each, finishing nine minutes before the gating
job - about 2 min on CI against about 4m20s locally.

### app/sweep - the focus-walk replay

The focus-walk check's shape: each real Tab stop is read twice, focused and
forcibly blurred a settle later, over 894 stops across six `FOCUS_WALK`
addresses. The OR-combined `outline || box || border` check still passed
while blurred on over a third of `#/roll/std`'s stops - a permanent ancestor
drop shadow satisfies the box-shadow arm, a resting gold border satisfies the
border arm. Hence: the indicator is read per depth and must change, focused
against blurred, not merely present.

### flows - the share fixture's own provenance

`tools/capture-share-fixture.mjs` is re-pointed at `dist/` and grips the two
copy buttons by their `dict.ts` accessible names; the fixture is now the
rewrite's own golden, last matched against the live app at `cf96e6f` - the
only provenance anchor left for `docs/fixtures/share/records.json`. Rejected:
deleting the tool and freezing the fixture by hand (a later share-text change
would then need a hand-edited golden).

### contracts / craft - why trimmed, not deleted

`tests/contracts.js` was trimmed, not deleted, and kept its name: four
documents and a hook name it, so a rename would churn `CLAUDE.md`,
`CONTRACTS.md`, `ROUTES.md`, `README.ru.md` and `edit-followup.mjs` for
nothing; it keeps the list-encoding half and the docs-name check.
`tests/craft.js` was trimmed to sections 1 and 6. Rejected: re-pointing its
jsdom render at `dist/` instead - Vite's bundle is not a script jsdom can run
with `window.LOOT` seeded, and every grip in the old script is `data-*`
markup the rewrite does not emit.

## Features to suites

Re-pointed at R0c from the old-app suite names above to the surviving homes
their fate column names (each old suite name still appears there for anyone
tracing a feature back through history).

| Feature | Covered by |
|---|---|
| Seven roll modes | `std.test.ts`, `roll.test.ts`, `alt.test.ts`, `tests/app/sweep.js` |
| Source switch, cannot be emptied | `state/app.test.ts`, `contracts` (legacy routes set it) |
| Crit jump to the table | `tests/app/states.js`, `tests/app/sweep.js` |
| Tables, list/grid, search | `tables.test.ts`, `searchPage.test.ts`, `tests/app/sweep.js` |
| Filter panel, pills, reset, link | `facets.test.ts`, `filters.test.ts`, `tables.test.ts`, `contracts` |
| Filter group key names | `contracts` |
| Anchors | `tables.test.ts`, `contracts` |
| Lists: create, reorder, remove, undo | `listPage.test.ts`, `listsPage.test.ts`, `tests/app/states.js` |
| Add to list, menu, search from the eighth, the label, search and create control pinned over scrolling chips, the lists holding the record first, the new-list name taken from the query | `components/lists.test.ts`, `tables.test.ts` (a selection's menu stays newest first), `listPage.test.ts`, `tests/app/states.js` case 27 |
| Quantity, price, price modes, batch prices, the selection total and taken counts | `money.test.ts`, `listPage.test.ts`, `lists.test.ts`, `share.test.ts`, `sharedListPage.test.ts`, `app.test.ts` |
| Two notes | `listPage.test.ts`, `share.test.ts`, `contracts` |
| List link, checksum, short link | `contracts`, `listLink.test.ts`, `state/lists.test.ts` |
| Two tabs merge | `state/lists.test.ts` |
| v1 storage and v1 links migrate | `state/lists.test.ts` |
| Record card, modal, copy, share, image | `record.test.ts`, `share.test.ts`, `tests/app/states.js` |
| Craft chains, referenced cards | `record.test.ts`, `tables.test.ts`, `share.test.ts`, `derived` |
| Print | `app/print` |
| Language switch | `i18n.test.ts`, `app/src/lib/dict.ts`'s compile-time check, `tests/app/sweep.js`, `tests/app/typo.js` |
| Starting section | `state/app.test.ts`, `tests/app/states.js` |
| Storage unavailable | `ports.test.ts`, `state/app.test.ts` |
| `noindex`, robots | `derived` |
| Data generation | `derived`, `dataint` |
| `file://` | every `tests/app/` suite loads the app from `file://` |

## The rewrite against the app it replaces (history)

Before R0c (issue 47, `23c00a6`), `tests/parity.js` ran every spec against
both `index.html` and the built `dist/`, in both languages at three widths,
failing on any difference not recorded in `VISUAL_DEBT`/`ACCEPTED` - "is
anything missing from the port?" without remembering what the old screen did.
It found a four-times-too-wide modal, a mistranslated tab, a missing
copy-image button, and, in B3.6, three real layout defects a whole-page pixel
percentage had been hiding.

What survives it: `docs/specs/DEBT.md` (defects kept on purpose); the
`ACCEPTED`/`VISUAL_DEBT` sweep that turned every accepted divergence into a
`FEATURES.md`/`STATE.md` bullet first (`30b2744`); the structural goldens
(`tests/app/golden.js`, `inventory.js`, `snapshots/`), seeded at R0a under the
last green parity run's warrant; and the R0c sweep (`git show
92d6a4b:issues/47/sweep.md`), one more read for what a pixel diff and a
static tree could never see - homed in `DEBT.md` section 3 and "Known thin
spots" below.

### Why the replacement is text, not pixels

The caveat that governs every surviving instrument: the parity harness read
the live app as the expectation on every run; every successor (a golden, a
vitest assertion, a `tests/app/` case) freezes or asserts the rewrite's own
output instead. The question survives (is the rewrite right); the second
opinion does not (there is no live app left to check it against).

Rendering after the cut-over is proved by named invariants, numeric laws
asserted against their source, and structural text goldens - never a bitmap.
Rejected, each with its loss: freezing the `typeRuns`/`geometry` JSON (a
golden in JSON clothing - a diff like `668.3 -> 671.1` says nothing about
right or wrong); committed PNG goldens (one machine's figure; a whole-page
percentage is blind to a control; every deliberate change becomes a human
re-blessing a diff image); a hosted visual-regression service (bitmaps behind
a paid approval screen for a no-backend project); Playwright's
`toHaveScreenshot` (goldens, rejected for what they are), while the idea
behind `toMatchAriaSnapshot` was taken via puppeteer's own
`page.accessibility.snapshot()`; vitest browser mode (filed as a spike, never
scheduled); nothing beyond component tests. What no golden catches: a colour
swapped for another accessible colour, a wrong icon path, a wrong picture
behind a correct `alt` - a human pass is the answer for that class.

Playwright was also rejected for the regression net on measurement, not just
on principle: re-pointing a legacy suite at `dist/` is a selector rewrite,
because each legacy suite gripped the live DOM by `data-act`/`data-open`/
`#modal`/`#selBar` (`behave` 35 such selectors, `lists2` 29, `select` 28,
`print` 24, `flows` 23, `states` 21, `qa` 18, `notes` 12, `eqtest` 9, `noart`
6), and a rewrite of a suite whose assertions already live in a component
test is waste - plus a second browser dependency, a second driver for verbs
`tests/app/driver.js` already has, a second CI install. What puppeteer lacks
(golden management, a trace viewer) serves the golden workflow above, which
was itself rejected.

The R0c sweep's denominator: 519 rows read (431 same, 55 differs, 24 absent,
7 n.a.), 82 homed ((a) 13 rows / 12 entries from reading source directly, (b)
34, (c) 34), committed at `5b2e693`, read at HEAD `7a33c22`. Part E - 148
rows of the deleted instruments' own assertions - found zero observable
divergence; every class-(a) row came from reading source (sweep Parts A, B,
D, F), the classes no instrument could see. `DEBT.md` section 3 records the
82 homed rows, not the 519 read.

To resurrect it from history: `git show 23c00a6^ -- index.html app.js
style.css tests/lib.js tests/parity.js tests/parity docs/parity.md
tools/probe.mjs tools/parity-ubuntu` plus the fourteen deleted browser suites
(`tests/audit2.js`, `behave.js`, `craftmob.js`, `eqtest.js`, `flows.js`,
`hues.js`, `lists2.js`, `noart.js`, `notes.js`, `print.js`, `qa.js`,
`select.js`, `states.js`, `typo.js`) and `tests/i18n.js`, re-point
`derived.js`/`craft.js`/`contracts.js` at the root files, and restore
`ci.yml`'s `parity` job from `git show b9d84ce^:.github/workflows/ci.yml`.

## What is enforced, and by what

Coverage here is a build failure, not a report somebody reads. Five things
enforce it, and they catch different mistakes:

| Layer | Catches | Where |
|---|---|---|
| Coverage `include` covers everything that ships | a whole directory left out of the measurement | `vite.config.mts` |
| Per-file thresholds (`perFile: true`) | a file with no test, hidden behind a well covered neighbour | `vite.config.mts` |
| Thresholds set per directory | lib's numbers paying for a component's | `vite.config.mts` |
| `expectNoA11yViolations` in every component test | markup a screen reader cannot follow | `app/src/test/a11y.ts` |
| Layer rules in ESLint | logic that reaches for the DOM and stops being testable | `eslint.config.mjs` |

Nothing is disabled per call in `a11y.ts`; `color-contrast` is the only rule
off, and it is off everywhere - jsdom lays nothing out, so it can only see
declared colours; `tests/app/sweep.js` measures contrast for real, over a
rendered page (B12). `nested-interactive` used to be disabled per call, via
`expectNoA11yViolations(container, { allow })`, for the handful of states that
rendered the storage notice's old markup (`StorageNotice.svelte`'s dismiss
button sat inside its own `<summary>`). That shape was fixed - the button
moved to a sibling - so no component trips the rule any more, and the `allow`
parameter was deleted with it; `nested-interactive` is now checked on every
component like any other rule.

`a11y.test.ts`'s own guard compares a `COVERED` list against every
`*.svelte` file on disk, so a new component fails `npm run check` until it is
named there with a state that renders it under axe; `vite.config.mts`'s
coverage glob reaches a new file automatically, with no matching hook change
needed.

**How a suite reaches CI.** `tests/` is invisible to `npm run check`'s own
format and lint steps (`.prettierignore`, `eslint.config.mjs`), so a suite
there is verified only by running it. Conversely, CI picks up a new
`tests/app/` suite with no `ci.yml` edit at all: `tests/run-all.js` resolves
`app/<name>` to `tests/app/<name>.js` and logs to `test-output/`, and no hook
change is needed either.

### Whitespace text nodes are content

`.prettierrc` never sets `htmlWhitespaceSensitivity`, so Prettier uses its
default, `"css"`: whitespace around an element whose default CSS display is
block (`div`, `p`, `h1`, `li`, ...) is treated as insignificant for paint and
reflowed freely on every format, while inline elements and Svelte components
are treated as sensitive. This app also reads `textContent` and accessible
names, for which a whitespace text node between two block elements is very
significant - the two models disagree, and Prettier's own formatting can
silently change what a component renders. Where that risk is real, the whole
subtree is protected with `prettier-ignore` and pinned with a test that reads
`childNodes` directly rather than a joined string (`record.test.ts:271-279`
is the pattern) - a joined-string assertion cannot tell a split text node
from a joined one, and a split node measures a different advance than a
joined one (`FilterBar.svelte:58-66`'s comment documents a real case: a
one-space expression Svelte trims differently than the live app split one
text node into two, measuring 0.1px wider in English). Setting
`"htmlWhitespaceSensitivity": "strict"` in `.prettierrc` would remove the bug
class entirely (every element becomes sensitive, so Prettier can never add or
remove a whitespace text node), at the cost of reflowing every `.svelte` file
into the hugging style - a project-wide formatting change, not a coverage
fix, and not undertaken here.

The bars differ because the obligations do. `src/lib` is pure and has no
excuse: 95 lines, 95 functions, 85 branches, 90 statements. `src/ports` wraps
browser APIs whose success paths jsdom cannot run at all, so it sits at
70 lines, 80 functions, 55 branches, 70 statements, and the difference is
covered by `tests/app/` driving the built app in a real browser (B12).
Components are at 85 lines, 80 functions, 75 branches, 85 statements; state is
at 95 lines, 95 functions, 85 branches, 90 statements. Three components carry
their own lower branch carve-out in `vite.config.mts` - `Button.svelte` 60,
`DiceBar.svelte` 55, `Badge.svelte` 50 - each named there with the reason
(Svelte compiles every attribute into an update path a small component's own
tests cannot all reach); only `Button`'s is called out in prose below.

**A per-file rule is not a per-file *test* rule.** Nothing requires a
`Foo.test.ts` beside every `Foo.svelte`, and a rule that did would be answered
with tests asserting that a button renders a button. What is required is that
every file is *reached* by some test - `perFile` fails at 0% whether the file
has a test of its own or is exercised through a parent. `TabBar` and
`Seg` have no test files and are at 100% because `shell.test.ts` drives them
through `App`. That is the intended shape.

What this found the day it was turned on, all of it invisible to the previous
global number:

- Components, state and `App.svelte` were **outside the measurement entirely**.
  The reported 88% described `src/lib` and `src/ports` and nothing else.
- `filters.ts` had **no test file**, only incidental coverage through
  `hash.test.ts`. Decoding was covered; `groupIsAny`, `groupHits` and
  `chosenCount` - which are what the filter panel is built out of - were not.
- Five of the ten writers in `hash.ts` had **no test at all**. The parser was
  held to fixtures; the functions that produce the links were not.
- `hashRouter` was written to take an injectable window so it could be tested
  without a browser, and then was not tested.
- Three things existed with **no caller** at the time of this audit: a
  `Button.svelte`, a `statLabels` helper, and the pin-the-start-section API
  on `AppState`. `statLabels` was deleted - markup is written when a screen
  needs it. `Button.svelte` was kept and later given real callers as
  components were extracted (`button.test.ts`, and its own per-file
  threshold carve-out in `vite.config.mts` - Svelte's attribute-update paths
  make full branch coverage impractical for a component this small). The
  pin API was kept and given `app.test.ts`, because it encodes rules read
  off the live app that would otherwise be re-derived, differently, by
  whoever writes that screen.

## The unit suite

`npm run test` runs the ported modules in `app/src/lib` and `app/src/ports`, and
the components, under vitest with coverage thresholds. It is a separate pyramid
from the `tests/app/*` real-Chrome suites and does not replace them: those
drive the built app people use in a real browser; these test its logic and
components in isolation.

| File | Held to |
|---|---|
| `listLink.test.ts` | `docs/fixtures/lists/*.json` |
| `hash.test.ts` | `docs/fixtures/urls/routes.json` |
| `i18n.test.ts` | `docs/fixtures/statlines/equipment.json` |
| `data.test.ts` | the real `data.json`, and the counts the README publishes |
| `money.test.ts` | the worked examples in the app's own help panel |
| `search.test.ts`, `lib/lists.test.ts`, `roll.test.ts` | stated behaviour |
| `state/lists.test.ts` | the live app's list-store rules, ported - `loadLists`..`storageWorks` and `createList` (app.js 1149-1330): the v1-to-v2 migration runs once and leaves v1 alone, a save merges with whatever another tab wrote, a refused write keeps the session working |
| `components/lists.test.ts` | the add-to-list row itself - `listMenuHTML`/`addToListBtn` and `listMemberFor(item)`'s live behaviour: the button, the menu, a chip's tick, the new-list form, and the toast each raises |
| `components/tables.test.ts` | the plain table's own behaviour - chip nav, the toolbar, selection, sectioned bodies, the row/section anchor - and, off `renderSelBar` (app.js 3706-3721), the selection bar it raises once a row is ticked: the count, the cross, its own add-to-list menu, and copying the whole selection |
| `filters.test.ts` | the facet grammar both ways, and the predicate and counters the panel is built from |
| `ports/ports.test.ts` | every way the browser says no: storage that throws, a page outside a secure context, a missing compressor, a dismissed share; and the hash router against a fake window |
| `state/app.test.ts` | settings read as untrusted data, which address may be pinned, a refused write, what an old section name sets, the storage notice's own dismissal flag, a packed address expanded through the compress port, and where it lands when the port cannot |
| `components/shell.test.ts` | the frame: labels a screen reader needs, the language switch and what it redraws, which tab is lit, the address on the way in, and axe on three states |
| `components/listsPage.test.ts` | `#/lists` - off `renderLists`/`storageWarning`/`listCardHTML` and the create/share/delete/restore handlers (app.js 2865-2931, 4136-4270): the head and its help, the storage notice (`StorageNotice.svelte`, extracted on its second use in B5.4) in both live forms, a card per list with a known-record badge and its actions, the name filter from the eighth list, the first 24 cards and «Показать ещё (N)» with its focus move and its count kept across a return, and `noData` |
| `components/listPage.test.ts` | `#/lists/<id>` and `#/l/<own payload>` - off `renderOneList` and everything it draws (app.js 2933-3128, the address at 1537-1607, the handlers at 3944-4571): the address rewrite and its address-only edge cases, the title input and the actions row, the storage notice, the money picker and its help, the list note, the roll panel (folded/absent/rolled/reset), select-all, a row's position/qty/gold/note/remove with undo, copying and sharing, deleting, a row's own modal, the drag port's `onDrop`, `noData`, and the branch into the shared page (drawn for a payload that is nobody's, nothing drawn while a packed address expands, the bad-link page when the port cannot expand one) |
| `components/sharedListPage.test.ts` | `#/l/<payload>` for a payload that is nobody's own list - off `renderSharedList` (app.js 3130-3170): the heading and the one-text-node sub, the save button and saving the whole list as a new own list (both notes, the money mode, a nameless list), the bar alone holding add-to-list with a row ticked, and the bar taking rows into a new or an existing list (qty/gold/note, never the GM's own note), both list hitnotes and each entry's own after its row, the tails (`×qty`, `×qty · price`, bare price, coin mode), selection and the bar it raises, a row's own modal, the bad-link page, and English |
| `components/searchPage.test.ts` | `#/search` - off `renderSearch`, `kindChips` and the `#sq`/kind handlers (app.js 2841-2859, 2114-2132, 4160-4164, 4333): the head with no help button, the box focused on arrival, both languages at once, the assembled stat line, the 300 cap, the kind filter narrowing and refusing its last chip, equipment obeying the equipment chip regardless of its own `kind`, the filter shared with the roll pages, selection, a row's own modal, `noData`, and English |
| `components/printPage.test.ts` | `#/print/<ids>` - off `renderPrint`, `printCardHTML` and its helpers, and `fitPrintCards` (app.js 3235-3558), and the four handlers (`doPrint`/`printBack`/`printArt`/`printLink`, 4236-4245): the bar and its controls in order, a sheet's card/blank counts and page breaks, every card shape (loot with and without art, a broken image swapped for the glyph, a weapon's tier/tags/burden/die/ribbon/cells, a versatile weapon's second stat block, a damage bonus, an armoured card's shield and threshold strip, an artifact's list markup, a community record's source line), the black-and-white layout, the second-sheet and 180-id cap arithmetic, the empty address, `Назад`/print/link handlers, the fit ladder driven end to end under a faked layout, the grow rung's cap and step-back under a faked layout, the compact switch (sixteen places, independent of the colour switch both ways, the compact subtitle, the ten-id and 180-id arithmetic at sixteen, session memory, a re-fit on a size change, axe on both compact layouts), `noData`, English, and the per-card count from `*<n>` |

The browser adapters' happy paths are the one thing these cannot reach - a real
clipboard write, a real share sheet - because jsdom has neither. `tests/app/states.js`
exercises the clipboard's rich-text and image writes and the packed link's real
`CompressionStream` for exactly this reason (B12); the share sheet's success
path stays a thin spot below, since no headless browser offers one to drive.
The fallbacks, which is where the logic actually lives, are covered here.

`tools/tg-preview/lib.test.mjs` is a separate suite again, run under
`node --test` as its own step in `npm run check` rather than through vitest:
it covers the Telegram preview refresher's pure logic (URL derivation,
fingerprinting, what counts as stale, batching, the flood/fatal error table,
button matching, and the two-phase send-and-press loop against a fake
client, clock and live check), plus `@WebpageBot`'s own per-user attempt
throttle: recognising its refusal text (`botThrottle`), the run-scoped press
budget (`--press-limit`/`PRESS_LIMIT`) that spans both phases and stops a run
before it overspends the bot's quota, and the warning when `--mode full`
cannot finish the stale set on that budget. It also covers the
`--stale-list` writer: `--stale-list` requires `--dry-run` and is rejected
otherwise regardless of flag order, a dry run emits it exactly once whether
or not anything is stale, `--only` narrows what it writes, a non-dry run
never calls it even when the dependency is supplied, and an accidental
`--apply` of its payload is a no-op because it carries no `urls` key. The
real Telegram connection
(`client.mjs`) and the real CDN fetch (`live.mjs`) are deliberately outside
it - thin wrappers around a live network, where the only honest proof is
Telegram and the CDN themselves. See `docs/tg-preview.md`.

`tools/artwork/lib.test.mjs` is a separate suite again, run under `node
--test` as its own step in `npm run check`, right after
`tools/tg-preview/lib.test.mjs`: it covers the artwork refresh tool's pure
logic - name normalisation (typographic apostrophes, NFC, the trailing
`v<N>` provenance suffix, case and whitespace), record indexing (`byId`,
`byName` as arrays so a shared name is representable, `byImg` for the
shared-asset groups), destination resolution keyed by a record's `img`
value rather than its id, shared-asset grouping (one pair for four records
sharing one asset, its `og/` file named after the asset and never after a
sharing record), collision and duplicate-source-bytes detection, the
`--map`/`assign` override, the affected-stub-URL derivation (every matched
record and every record it shares an asset with), and the stale-set algebra
`verify-previews` runs on two `tools/tg-preview` `--stale-list` files.
`tools/artwork/run.mjs` (hashing uploads, decoding geometry, the `sharp`
encoder, atomic install, byte verification) is deliberately outside it - the
same argument the tg-preview paragraph above makes for `client.mjs` and
`live.mjs`: it is a thin wrapper around the filesystem and an encoder, where
the only honest proof is a real image going in and a real file coming out.

Since art-tooling B3 the same suite also covers `planIngest`, the ingest
counterpart to `planInstall`: assets keyed by distinct asset in `missingAssets`
so `og/<new-record-id>.jpg` cannot arise (the og/-trap case, asserted by
grepping the whole returned object for that string), two brand-new records
sharing one not-yet-installed asset producing one `creates` entry, a record
joining an asset that already exists on disk landing in `shares` with no
filenames, `img: ''` landing in `unarted`, a missing asset with no resolving
source landing in `unsourced` by asset and waiting record ids, and the same
unmatched/ambiguous/duplicate-bytes/`map.assign` handling `planInstall` uses
via the matching helper the two planners share.
See `docs/artwork.md`.

`tools/check-site.test.mjs` is the same pattern again:
`tools/check-site.lib.mjs`'s `checks()`/`runChecks()` covers the assertion
list itself - a good in-memory site producing no failures, three broken ones
(a missing root falling through to the 404 fallback, a truncated
`assets/app.js`, a share stub with no `og:image`) each producing exactly the
expected failure message, and the 404-fallback probe both when it works and
when no fallback exists at all - plus `dirReader`'s GitHub-Pages-missing-path
emulation against a real temporary directory. `fetchReader` (the live-URL
transport `tools/check-site.mjs` actually runs post-deploy) is deliberately
outside it, the same argument as `client.mjs`/`live.mjs`/`run.mjs` above: a
thin wrapper around a real network call, where the only honest proof is a
real deploy.

`tests/app/golden.test.mjs` covers `tests/app/
golden.js`'s pure half the same way - the DOM-adjacent normalisation and
comparison logic that needs neither `dist/` nor puppeteer, exported under a
`require.main` guard so requiring the file for its exports never trips
either: `collapse`, `normUrl` on both a `dist/index.html` url and a real
outbound link, `clean`'s joined-versus-split text-node rule, rule A's
same-shape-sibling elision at the 5/6 boundary, rule B's name cap at the
63/64/65-code-point boundary (including that two names differing only past
the cut do not hash the same), a `headerOf`/`sectionsOf` round trip through
`render()`'s own line format, and `compareGolden` reporting nothing on
identical text and the right section/line on a real difference. Capturing a
state from a real page (`captureLang`, `captureState`, the toast wait, the
top-level walk over `STATES`) stays inside the `require.main` guard,
puppeteer-only, and is what the CI `browser` matrix's golden shards actually
exercise - this suite is not a substitute for that, only for the arithmetic
around it that a golden run was proving by accident.

`golden.test.mjs` also carries a coupling assertion:
`URL_DEBOUNCE_MS` in `tests/app/driver.js` must equal the trailing debounce
`ListPage.svelte`'s own `scheduleUrlSync` sets, read from both files as text
(the same shape as `tests/derived.js` parsing `ci.yml` for the shard/divisor
coupling). If the two ever disagree the failure names both files and what to
do - the debounce moved, so `URL_DEBOUNCE_MS` and every golden shard need
re-running.

**"No golden moved" is narrower than it sounds.** A
golden snapshots the accessibility tree plus the control inventory
(`serializeTree`/`controlLine`, above) - no class attribute, no CSS, no
computed style. A CSS-only change (B5's C2 dedup, D1, D18, D20) can therefore
truthfully claim "no golden moved" while still moving what the page looks
like; that half rests on `tests/app/hues.js` (computed `color` on a handful
of selectors) and axe's `color-contrast` rule, not on the goldens. Do not
read "no golden moved" as "no pixel moved" - it answers structure only.

**The gate rule for "no golden moved".** A batch's
claim that a change moved no golden is proved by all four `--shard=n/4` runs,
or by `--only=` probes that between them reach every route kind the change can
touch - one shard is not enough, and a hand-picked `--only=` proves only what
it measured. B8's three failures fell one each in shards 2, 3 and 4
(`~ removed` in shard 2, `~ prices set` in shard 3, `~ batch deleted` in shard
4), so `--shard=1/4` alone would have come back green and shipped the exact
defect this rule exists to catch. B8 in fact claimed no movement with
`--only=#/i/ci1` and `--only=print`; both were true, and both missed all three
failures, because neither reaches an owned-list route. A prior claim of "no
movement" is worth nothing if `dist/` itself was stale when it was measured -
`tests/app/lib.js` fails closed on a lagging `dist/`, both a byte mismatch
against the three files `npm run data` regenerates and an mtime check against
the bundle, before any suite requiring it can run.

**The capture wait.** `golden.js`'s `captureState` calls
`driver.js`'s `d.addressSettled()` immediately before every snapshot - the
ordinary two-language capture and the `timed` toast capture alike - because
`settle()` no longer waits long enough to catch a debounced address write
(see that function's own comment in `driver.js`). This is a harness fix, not
a production one: do not shorten `ListPage.svelte`'s 150ms debounce or flip
`prepare()`'s reduced-motion emulation to make a golden pass faster - read
`prepare()`'s own comment first, it states what the emulation costs and why
it stays.

Three of those fixtures are replayed by `contracts` as well, against the live
app. That is what makes them evidence rather than a record of what the new code
happens to do.

### Component-test traps

Recurring jsdom/Svelte traps that do not surface anywhere else, worth
checking against before reading a component test as a defect:

- jsdom implements `[popover]:not(:popover-open){display:none}` but neither
  `showPopover`/`hidePopover` nor `:popover-open`, so a `popover="manual"`
  element is permanently `display:none` in a component test - findable by
  `getByText`, invisible to `getByRole`; when the function is absent, toggle
  `el.style.display` directly instead.
- A `<svelte:document>`/`<svelte:window>` handler can outlive the prop it
  reads by microseconds (a bubbling native click sees the parent's state
  change before the child's teardown effect runs) - `try`/`catch` the one
  read.
- `$state` wraps stored objects in a proxy, so `toBe` on anything read back
  from a `$state` array/object fails (`store.list = [x]; store.list[0] ===
  x` is `false` in Svelte 5) - use `toEqual`.
- A literal leading space at the start of a Svelte `{#if}`/`{#each}` block is
  dropped by the compiler; emit `{' '}` - not `&nbsp;` (a different advance
  and break opportunity) and not a space inside the tag.
- A locally declared `{#snippet}` rendered with `{@render}` in the same file
  trips `@typescript-eslint/no-confusing-void-expression` every time; pass a
  `Snippet<T>` prop down or extract a component instead.
- `Element.prototype.scrollIntoView` does not exist in this jsdom - a
  `TypeError`, not a no-op - so `vi.spyOn` cannot be used on it; assign
  `Element.prototype.scrollIntoView = vi.fn()` directly.
- jsdom does not apply a Svelte component's scoped `<style>`, so the
  component suite cannot assert a `font-size` or `width` from it - and a
  source-text assertion on the style block is not a substitute (it tests the
  source, not the behaviour).
- A record's source badge carries the same string as its section heading, so
  `getByText('Пир зверей')` finds two once a section has rows; assert the
  heading via `.tsec-head .lbl` instead.

### Typecheck traps

`svelte-check`/`tsc` traps that never surface in vitest, only in the check
itself: `exactOptionalPropertyTypes` rejects `{ tail: undefined }` for
`tail?: string`, and rejects re-reading `m.qty` after a `(m.qty ?? 0) > 1`
guard; narrowing a `$derived.by` nullable across an `{#if}/{:else if}/
{:else}` chain needs the terminating negative check written bare (nest the
positive-kind branch inside a bare `{:else if !own}`, not the other way
round); an inline arrow's parameter is not contextually typed through a
component prop - write `(v: string) =>` explicitly.

Svelte compiler traps in the same family: a scoped CSS rule no template
element can match is pruned, and `npm run check` fails it as dead CSS (drag
classes are `class:` bindings driven by port callbacks; a sibling rule one
instance cannot match needs `:global(...)` after the base rule); an
`{#if}` inside an element leaves an anchor comment in that element (a
comment - no box, does not split a text run, but visible to a `childNodes`
assertion); authored template comments never reach the DOM;
`<textarea>{x}</textarea>` and `bind:value` both compile to a `.value`
assignment and leave `textContent` empty (no accessible name for a harness
reading it); `.card :global(.card-acts ...)` raises specificity (0,3,0 ->
0,4,0).

## Gaps closed in Phase 0

- **Filter group key names had no test at all.** `llms.txt` documented `rg` and
  `bu`; the code expects `range` and `burden`. A link built from the
  documentation returned the whole table, unfiltered and unmarked. `contracts`
  now probes every documented group on a real table and fails if the group does
  not narrow anything, and fails again if the wrong names reappear in
  `llms.txt`.
- **The list codec had no fixture on disk.** It was covered only by tests that
  encode and decode with the same code, which cannot catch a change of format -
  only a change of behaviour. `docs/fixtures/lists/*.json` now hold the raw
  string and payload for both link variants of six lists, and `contracts`
  re-derives base64url and the checksum with its own implementation.
- **Route resolution had no fixture either.** The address-walking sweeps
  (`audit2`, now `tests/app/sweep.js`) check that an address renders, not that
  it resolves to the state it used to. `docs/fixtures/urls/routes.json` pins
  28 shapes, including the three legacy section names and the source switch
  each one sets.
- **`robots.txt` was not in the count check** and still advertised 830 records.
  It is now checked with the other five files.

## Known thin spots

Not blocking, recorded so they are not mistaken for coverage:

- Across three reviewed batches, four of five real defects a review caught
  were caught by the reviewer, not a gate, and every one was inert
  verification - a check that stayed green while measuring nothing (a lint
  widening that never un-ignored the hooks; an uncovered close-on-navigation
  effect; an apostrophe test that could no longer fail; two `--only` probes
  reaching no owned-list route). Gates are structurally blind to that class.
- The short (`~`, deflate) link form is exercised through
  `tests/app/states.js` cases 13/17/22 and the share-button jsdom tests, but
  has no golden fixture, because deflate output is not guaranteed byte-stable
  across browser versions. The contract that is pinned is the plain form plus
  "compressed is expanded to plain on open". Measured: Node's
  `zlib.deflateRawSync` bytes differ from Chrome's `CompressionStream`
  output; both are raw deflate and `DecompressionStream('deflate-raw')`
  reads either - that is the byte-instability behind this bullet.
- Part A's class-(c) cluster from the R0c sweep, still true of the shipped
  app: the rewrite drops the live `id`/`data-*` grips the old app carried on
  nine controls (they served `restoreFocus`, `restoreOpen` and the
  `data-act` dispatcher, none of which the rewrite has), and adds
  `aria-pressed`/`aria-current`/`aria-label` on eight controls where the old
  app had none. Neither loses behaviour, but both change what a future
  instrument can grip.
- Language leaks between states through `localStorage` (`file://` is one
  origin), so a state run at `en` can leave the next `@ ru` capture in
  English; no verdict is wrong, but a human reading a `_ru_` artefact finds
  English text in it. Same mechanism: a previous pass's created lists leak
  into the next one - a 43 px menu-height difference in one capture was one
  extra list chip carried over from an earlier state.
- Print fitting is measured, not compared to a reference image. `app/print`
  checks geometry against the design's numbers and one pixel property (the
  art edge); it would not catch a purely cosmetic regression elsewhere on
  the card.
- `tests/app/states.js` walks click-only states but does not assert much
  about them beyond "did not throw and rendered something".
- The success paths of `clipboard`, `share` and `compress` cannot run in jsdom:
  there is no real clipboard, no share sheet and no `CompressionStream`. Their
  fallbacks - where the logic is - are covered in jsdom; `clipboard`'s and
  `compress`'s happy paths run for real in `tests/app/states.js` (B12), which
  is why the `src/ports/**` bar could move; the share sheet's success path is
  the one still without an answer - no headless browser exposes one to drive,
  so the fallback stays what is tested.
- Colour contrast is switched off in the axe pass, because jsdom lays nothing
  out and resolves no cascade. Before R0c, contrast was measured for real only
  on the live app (the deleted `qa` and `typo` suites); `tests/app/sweep.js`
  runs axe with `color-contrast` on over every address (B12) - the first and,
  since R0c, only gate that measures it, on `dist/`.
- The structural goldens compare only registered states. Missing states
  remain invisible, so each new interaction surface needs a
  `tests/app/inventory.js` entry and a re-seeded golden in the same change
  (`CLAUDE.md`, "Task and session protocol").
- A native `<dialog>` cannot be opened in jsdom - there is no `showModal` - so
  `app/vitest-setup.ts` shims presence and open/closed. The focus trap, Escape,
  the return of focus and the page behind going inert are the browser's;
  `tests/app/states.js`'s dialog-semantics case checks all four for real
  (B12), where `flows` used to on the live app alone.
- A trusted click runs a microtask checkpoint between listeners on the same
  event that neither jsdom's `userEvent` nor `parity`'s `el.click()`
  reproduces - both dispatch on a non-empty call stack, so Svelte 5's flush
  (a microtask) waits until the stack unwinds. `AddToList.svelte`'s
  new-list-form defect was invisible to both for exactly this reason;
  `press`, a real CDP mouse click in `tests/app/driver.js` (B12), is the
  instrument that sees it, and `tests/app/states.js` is what uses it.
- `hover: none` in headless Chrome still cannot render a `@media (hover:hover)`
  branch, in `craftmob` or in `tests/app/sweep.js` alike - no environment
  answers this without real touch/pointer hardware, so it stays a thin spot
  with no batch waiting to close it.
- The `@media (hover:hover)` guard on `.tile:hover`/`.row:hover` (`craftmob`'s
  own instrument was a grep over `style.css`, which R0c deletes). The rewrite
  carries the rule in three component `<style>` blocks - `ListPage.svelte:1415`,
  `RecordCard.svelte:315`, `TableRows.svelte:295,355` - but a grep over Svelte
  source would assert on text the compiler rewrites, so it is not the same
  instrument, and headless Chrome still reports `hover: none` regardless of
  where the rule lives. No environment answers this without real touch/pointer
  hardware (R0b planned, "R0b.1 designed").
- The 320px width `craftmob` swept is below every other instrument's floor
  (`sweep` 360, `parity` 375) and below `style.css`'s narrowest breakpoint
  (430); adding it back costs a sixth `run-all` row and a sixth CI width, so
  it is recorded rather than re-added (R0b planned, "R0b.1 designed").
- `qa`'s whole-document "no Cyrillic in any EN `aria-label`/`title`" regex has
  no single-instrument replacement; `shell.test.ts:39-55` plus
  `tests/app/sweep.js`'s per-page `en` run over 41 addresses is the substitute,
  narrower than a whole-document grep but real rather than a grep over
  `app.js` (R0b planned, "R0b.1 designed").

**The R0c sweep's class-(b) findings** (`git show 92d6a4b:issues/47/sweep.md`,
written while HEAD was `7a33c22`) - a question a deleted instrument asked that nothing surviving
asks, with **no known divergence** between the two apps (unlike `DEBT.md`
section 3, which is where a divergence *was* found). Full detail, row by row,
is in `sweep.md`; grouped here so the list stays readable:

- The list page's roll panel (`<details class="panel lroll">`) opens itself
  live whenever a roll result already exists (`app.js:3026`); no reachable
  path was found that needs the rewrite's equivalent to auto-open, so this is
  a lost question, not a known gap (sweep Part A).
- Three behaviours ported byte-for-byte with no instrument watching either
  side any more: the capture-phase `dragover` edge-auto-scroll while
  dragging a list row near a viewport edge, and the `pointerdown`/`pointerup`
  pair that marks a note box `data-manual` once the person has resized it by
  hand (sweep Part D - all three read `same`, all three lose their last
  watcher at R0c).
- The exact text of a multi-row selection export (`selCopied`) is asserted
  only for its two names and the absent `-` separator, never the whole
  string (sweep Part E(i), `copiedSelection`).
- Heading typography (weight, line-height, letter-spacing, colour) and the
  page background are read by nothing surviving; `tests/app/typo.js` checks
  only font family and the size scale, only at 1180px, and never a measured
  text advance - the two things B3.6 added specifically because a
  whole-page pixel percentage could not see a control-sized defect (sweep
  Part E(i), `visuals` and `typeRuns`).
- No surviving instrument measures the geometry (position and size) of
  `.card`, `.cardpick` or `.foot` at more than one width on any state;
  `tests/app/sweep.js` checks only for sideways overflow (sweep Part E(i),
  `geometry`).
- The craft-chain relationship (a record that upgrades into or comes from
  another) is exercised on Frostwyrd (`record.test.ts`) and one synthetic
  chain (`tables.test.ts`), never across the full set of real chained records
  the way `tests/craft.js` sections 2-5 did, and no assertion says a
  chainless item's card or list export carries *no* craft line (sweep Part
  E(ii-a), 13 rows). The captions ("Получается из" / "Улучшается до") are
  rendered by the goldens `#/i/dve25` (both) and `#/roll/wondrous ~ stepped`
  (forward); chain order and the two arrows are pinned in `record.test.ts`
  and `tables.test.ts`, and the share stub's order in `tests/craft.js`.
- Three legacy suites carried an implicit "the page never threw" tripwire
  (a `pageerror` listener failing the run) that `tests/app/contracts.js`,
  `tests/app/hues.js` and `tests/app/typo.js` do not attach; `contracts.js`
  also dropped its floor of "at least twenty route fixtures" and "at least
  ten stat-line fixtures" exist at all, so a fixture file emptied to a
  couple of entries would still pass every surviving check (sweep Part
  E(ii-c), E(ii-d), E(ii-f)).
- `tests/app/states.js`'s per-case assertions are narrower than
  `tests/states.js`'s blanket sweep over 24 click-reached states at two
  widths: only 22 of the legacy 24 states have any arrival assertion at all;
  nothing checks for a console/page error or the literal word "undefined"
  in a click-reached state; sideways-scroll and tap-target-size checks cover
  only the selection bar and phone width respectively rather than every
  state; and only one of six overlay classes (`.dropmenu`, `.modal-box`,
  the modal `.card`, `.helpbox`, `.ffilter`, `#selBar`) is checked for
  staying inside the viewport, at one width (sweep Part E(ii-e), 7 rows).
- `tests/i18n.js`'s dead-key report (a dictionary key with no `t().key`
  reader anywhere) has no surviving replacement; `svelte-check` does not
  flag an unused object property (sweep Part E(iii)).
- `tools/**` is outside every coverage gate: the "Coverage `include` covers
  everything that ships" row above is `app/src/**` only. `tools/build.js` and
  `tools/build-share-pages.js` are byte-compared by `tests/derived.js`, and
  `tools/smoke-file-url.mjs`/`tools/bundle-budget.mjs` run on every CI build,
  but `tools/capture-share-fixture.mjs` is unmitigated - it produces
  `docs/fixtures/share/records.json`, the evidence `share.test.ts:69`'s
  golden is held to, so a drift in the generator and a drift in the fixture
  agree with each other. No threshold is proposed here; a second coverage
  runner for `tools/**` is not worth it for one script. The obligation this
  bullet states only the negative half of: a new file under `tools/**` gets
  its pure half a `node --test` suite wired into `npm run check`, and a
  paragraph here - `tools/**` and `tests/**` both sit outside the vitest
  thresholds, `eslint .`'s ignores, and `.prettierignore`.
- Axe runs with `color-contrast` RU-only at 360/390/768 (`sweep.js:356`,
  both languages at 1180). Contrast and heading order are a function of
  tokens and DOM order, not of which language occupies a node, so this is a
  deliberate gap, not an oversight.
- `NoData.svelte` (`FEATURES.md`, "data did not load") has no
  `tests/app/inventory.js` entry: reaching it needs `data.js` blocked
  entirely, which no address can express. It is unreachable by a structural
  golden for that reason, not by omission; vitest's component tests are its
  only coverage.
