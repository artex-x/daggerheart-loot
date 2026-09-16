# Coverage matrix

What the 20 suites in `tests/` actually assert, mapped onto the features in
`FEATURES.md`. Update this file whenever the shape of the coverage changes -
adding a suite, moving what a suite is responsible for, or filling a gap.

Run: `node tests/run-all.js`, or one suite by name. Every suite's full output is
written to `test-output/<name>.log` whatever the result; the summary only prints
the first dozen failing lines. CI uploads that directory when a job fails.

## Suites

Twenty suites test the old app (`index.html`). Since B13 it is no longer what
Pages serves - the built rewrite is - but it stays in the repository as the
parity expectation and as the target of the one-commit revert, so all twenty
still run until Phase 7 deletes it. Five more, under `tests/app/`, test the
built rewrite (`dist/`) - what Pages now serves - in the same real Chrome, the
layer B12 added because nothing before it drove `dist/` with a trusted click, a
real network, or a real clipboard. Each old-app suite below carries its
**fate**: `kept` (stays through Phase 7, node-only), `ported as is`
(re-pointed at `dist/`, same
assertions), `rewritten` (same intent, new implementation), or `re-homed`
(its assertions now live in vitest component/state tests, or in a
`tests/app/` case) - decided in `plan.md`, "Phase 5 - the testing pyramid,
planned", decided 3. A suite is deleted only in the Phase 7 batch that
deletes `index.html` itself; until then every one of the twenty still runs.

| Suite | Kind | Fate | Responsible for |
|---|---|---|---|
| `dataint` | data | kept | ids, numbering, required fields, cross-references, equipment fields, text hygiene, image and stub files, and (since art-tooling B3) an `og/*.jpg` orphan check mirroring the existing `img/*.webp` one |
| `derived` | data | kept | `data.json` / `catalog.csv` / `i/*.html` rebuilt and compared byte for byte; counts spelled out in seven files; `noindex` on both entry documents (`index.html`, `app/index.html`) and their heads compared field by field with no exception list; the licence notice; die vectors; per-source pins (Dread, Vault of Ages, frames, equipment); `deploy.needs` includes the structural `golden` matrix |
| `parity` | migration | kept until Phase 7 | the rewrite against the live app: the same script on both, differences reported |
| `contracts` | contract | pure half kept; browser half ported to `tests/app/contracts.js` | golden fixtures: list encode and decode, both link variants, truncation, hash grammar for 28 route shapes, the equipment stat line in both languages, filter group key names against the docs |
| `i18n` | source | kept | dictionary parity in both directions, and no key the code asks for that is missing |
| `craft` | feature | re-homed: `record.test.ts`, `share.test.ts`, `derived` | upgrade chains: data, rendering, copying, stubs |
| `notes` | feature | **audited (R0b.1).** Covered already: `listPage.test.ts:112,290,298,318,544,560,562,565,570,574,581,603,614,656`, `state/lists.test.ts:305,325,333`, `lib/lists.test.ts:46,54,58,66,143,153,159`, `listLink.test.ts:39,41,51,60,94`, `sharedListPage.test.ts:134,166,257,273,299,301,335`, `share.test.ts:239,283`, `tests/app/states.js:385`, and the note text frozen in `tests/app/snapshots/_lists_a_noted.txt:59`/`_lists_a_note_opened.txt:44-45`. Ported, queued for R0b.2 (real geometry, not yet landed): the note-field group - the 3-line resting floor, a neighbour box not growing with its sibling, the real 320px ceiling with the text scrolling past it, and the shrink-back - plus the clear cross's `:has(:placeholder-shown)` visibility, both folded into `tests/app/states.js` case 13. Dropped: the toast's stale `display:none` rule (`Toast.svelte:65` is a popover now, the specificity clash it guarded cannot recur); `noteH` in prefs (no such key exists) | two notes: writing, copying, both links, migrating a v1 list, a v1 link, note field height |
| `lists2` | feature | **audited (R0b.1).** Covered already: `listPage.test.ts:222,388,424,449,487,557` (storage warning, empty roll field, batch actions, price modes/suggestion, reorder; full line map: `plan.md`, "R0b planned"), `listsPage.test.ts:93,101,171,178,190,217`, `sharedListPage.test.ts:106,166,186,213,232,257,272,305,335`, `state/lists.test.ts:305,325,333,341,351,370`, `lib/lists.test.ts:66,143,153,159`, `money.test.ts:20,29,55,105,168,222`, `numField.test.ts:56`, `share.test.ts:50,248,252,283`, `record.test.ts:187,402,412,421,428,442`, `tables.test.ts:182,284,556,920` (row carries its own roll number, selection, filter reset, per-section select-all; full map: `plan.md`), `facets.test.ts:54,66,230`, `tests/app/contracts.js:89,117,186`, `tests/derived.js:200`. Ported this batch (jsdom): `[data-goldhint]` is a `<span>` mirroring `title`, not a button (`listPage.test.ts:293`); the storage notice sits under the heading and above the rows on both `storedList`/`sharedList` routes (`listPage.test.ts:231`); the batch bar holds exactly two buttons with no percentage widget (`listPage.test.ts:437`). Ported, queued for R0b.2 (real browser): a real HTML5 drag reorder, a folded `<details>` surviving a select-all re-render, the money-help box's measured width and the pressed picker button's computed colour. Dropped: `[data-move]`/`.alttable` (markup the rewrite never had); the exact real-data counts 119/59/120 (`tests/app/contracts.js:186` pins the same invariant table-agnostically; `tests/derived.js` pins the dataset sizes); "row numbering is not recomputed under a filter" folded into `data.test.ts`'s real-data guard instead (see `eqtest` below) | list page: reorder, position entry, list search, storage warning, batch actions, upgrade steps, price modes, price suggestion, empty roll field, taking a shared list, per-list roll, kind filter |
| `select` | feature | **audited (R0b.1).** Covered already: `tables.test.ts:285,294,303,313,340,346,373,384,390,400,410,426`, `searchPage.test.ts:121,172`, `lists.test.ts:77,90,105,212,221,248`, `record.test.ts:448,471`, `state/app.test.ts:405,428,442`, `share.test.ts:189`; the two `elementFromPoint` hit-tests are covered *better* by `tests/app/states.js:54,68,86` (a trusted click through the real sticky stack, not a synthetic probe). Ported, queued for R0b.2: the selection bar pinned to the bottom of the viewport, merged into `tests/app/states.js`'s narrow-width case. Dropped: `[data-act="collect"]`/`.row-add` (markup the rewrite never emitted); "an existing-list chip from inside a modal adds the record" (covered by composition - `lists.test.ts:248` proves it is the same `AddToList`, `:90` proves that control adds) | selection, batch add and copy, select all, reset on navigation, card and modal |
| `flows` | feature | **audited (R0b.1).** Covered already: `tables.test.ts:479,649`, `record.test.ts:200,448,471`, `listPage.test.ts:112,118,198`, `state/app.test.ts:273,281`, `sharedListPage.test.ts:106,273`, `share.test.ts:69,93,127,145` - the clipboard half stricter than the legacy suite: `share.test.ts:69` is a parameterised golden over `docs/fixtures/share/records.json`, captured from the live app char-for-char - `std.test.ts:120,130`, `lists.test.ts:248`. Ported this batch: `w118`'s beastform shape (a 5+ line attached block with its own stat line) added to `docs/fixtures/share/records.json` via `tools/capture-share-fixture.mjs`, which `share.test.ts:69`'s golden now names alongside the original eight. **Two divergences live here, not gaps - neither is fixed, both are R0b.4's:** (1) a referenced card lost its `\n` -> `<br>` line breaks and its `daggerheart.su` outbound link - `app.js:886-896`'s `refHTML` writes both; `RecordCard.svelte:238` writes a plain text node and no link at all. Both sit inside a `<details>` closed by default (`FEATURES.md:152`), which is why a pixel diff and an accessibility-tree golden both miss it; `flows.js:117` was the only guard, and no vitest or `tests/app/` test replaced it - grepping `docs/specs/` for `refHTML`, `daggerheart.su` or `RecordCard.svelte:238` finds nothing before this line. (2) a frame-armour record's copy text keeps a tier word the live app now drops - `app.js:612`'s `isFrameRecord` guard (commit `106e4dd`) has no counterpart in `app/src/lib/share.ts:85`'s `eqLine(...)` call, found regenerating `docs/fixtures/share/records.json` for `w118` (see `plan.md`, "The fourth verdict", item 4); `tools/capture-share-fixture.mjs` carries the same note so the next person to run it does not read the resulting `f33` diff as a fresh regression. Dropped: nothing else | modal, list address, clipboard, copying a whole roll |
| `eqtest` | feature | **audited (R0b.1).** Covered already: `data.test.ts:140` (the same real-data `it()` named under "Ported" below - eqtest has no pre-existing data.test.ts coverage of its own, only this batch's), `facets.test.ts:54,66,75,107,166,180,230`, `filters.test.ts:23,82,90,103,143,179,185,196,215`, `label.test.ts:126`, `i18n.test.ts:52,74,80`, `tables.test.ts:507,535,556,681,712` (filter panel draws, narrows on a chip, resets, equipment-table grouping, facet fields; full map: `plan.md`), `share.test.ts:67,93`, `tests/app/hues.js:99`. Ported this batch (jsdom): the real-data guards nothing else made - the 73/69 secondary/armour split, 381 unique English names, 11 Wondrous stat-blocked records, the `core:phy core:mag hnf:phy hnf:mag` book order, `firstT1[0] === 'Broadsword'`, Wondrous = 119 rows, and a filtered Wondrous subset's roll numbers are scattered rather than recomputed to 1..N (`FEATURES.md`, "Tables and search") - one `it()` in `data.test.ts:140`; the filter<->address loop after arriving by a filter link - a further pick does not reopen a folded panel, and a pill dropped while folded is not snapped back to what the link said (`tables.test.ts:791`); reset and the copy-link button hidden while the filter is empty, reachable with the panel folded (`tables.test.ts:565`). Ported, queued for R0b.2: `.rstats` is one tone across weapon/secondary/armour (`tests/app/hues.js`). Dropped: the `scrollY > 100` smooth-scroll assertion (the app's own half is covered at `tables.test.ts:856,1018`; the rest is a test of Chrome); the old chip strip above search (markup the rewrite never emitted) | equipment: class, order, filters, filter links, anchors, colours, copying, all sources |
| `print` | feature | **audited (R0b.1), ported whole - queued for R0b.3, not yet landed.** `tests/print.js` entire, transposed onto `fresh()` and the moved driver (`tests/app/driver.js`), plus `tests/parity/specs.js`'s `sheetCounts`/`cardFit`/`printMedia`/`copiedPrintLink`, which die with the harness and are measured nowhere else. The structural goldens carry `#/print/ci1-q1`, its black-and-white twin, and `#/print/nope` as accessibility trees only (`tests/app/inventory.js:997-1052`) - a tree says nothing about millimetres | sheet grid, card size against the design, versatile weapons, dice by damage type, armour, black and white, art edges, text fitting, entry points |
| `noart` | feature | **audited (R0b.1).** Covered already: `record.test.ts:249,254,257,304,364`, `printPage.test.ts:226`, `ports.test.ts:215,230`, `tests/app/states.js:330`. Ported this batch (jsdom): no copy-image button for a record with no art at all (`record.test.ts:307`); the broken-art memory survives a navigation away and back (`record.test.ts:319`). **The real-load-failure half is a divergence, not a gap**: `RecordActions.svelte:105` gates the copy-image button on `it.img` alone where the live app also checks `!brokenArt[it.id]` (`app.js:1684,2047`) - the owner's decision (`issues/47/context.md`, 2026-09-16) is to restore the full gate; that fix and its case-11 real-browser port are R0b.4's, not this batch's. Dropped: the `noart` placeholder class (`desc.ts:109-119` returns only `NO_ART`, no such class exists); the impossible "share attaches no file" case (`RecordActions.svelte:68-75` never passes a file; `ports.test.ts:215` owns the port); the table-row placeholder (`RowMain.svelte:60` calls the same `artSrc`, duplicative of `record.test.ts`) | records without artwork, and artwork that fails to load |
| `behave` | journey | **audited (R0b.1).** Covered already: `roll.test.ts:57,62,83,167`, `std.test.ts:51,87,94,100,110,120,130`, `alt.test.ts:143,150,165`, `searchPage.test.ts:162,208,235,245`, `shell.test.ts:39,49,69,76,83,191`, `state/app.test.ts:79,87,98,132,138,154,428,486,509`, `ports.test.ts:43,215`, `record.test.ts:169,297,304,341,364`, `share.test.ts:69,110`, `dice.test.ts:10,20,27`, `data.test.ts:87,91,247`, `sections.test.ts:125,137`, `lists.test.ts:231`, `listsPage.test.ts:107,190`, `tables.test.ts:214,649`, `tests/app/states.js:161`. Ported, queued for R0b.2: real history Back/Forward across a table and a section, into `tests/app/states.js` (`ports.test.ts:694,701` only proves `history.back()` was *called*, not what came back). Dropped: the `dhloot.prefs.v1` group (a removed feature - the rewrite writes only `dhloot.lang.v1`/`dhloot.home.v1`/`dhloot.warn.v1`/`dhloot.lists.v2`); tab counters (`TabBar.svelte:32-40` draws no counter element); the die's literal viewBox (`dice.test.ts:27` already pins it); "no pin control on a record" (`app.test.ts:44` already refuses a pinned non-section); "tables work with no storage" (`ports.test.ts:43` makes the throw structurally unreachable) | rolls, search, language, remembered and corrupt settings, starting section, navigation, copy and share, storage disabled |
| `qa` | regression | **audited (R0b.1).** Covered already: `sweep.js:130,289,297,304,313,328`, `numField.test.ts:12,22,36,48,101`, `roll.test.ts:115,132,139`, `shell.test.ts:31,39,49,174,218,233,249`, `std.test.ts:110`, `searchPage.test.ts:221`, `state/app.test.ts:485`, `tables.test.ts:488,585,663,829`, `listsPage.test.ts:171,190,217`, `lists.test.ts:147,236`, `listPage.test.ts:112,150,638`, `sharedListPage.test.ts:335`, `state/lists.test.ts:63,200,370`, `hash.test.ts:422`, `tests/app/contracts.js:75`, `tests/app/states.js:178,348`. Ported this batch: `scrollbar-gutter: stable` (`tokens.css:93`) asserted in `tests/derived.js:139`; `defer` on both built script tags in `tools/smoke-file-url.mjs:66`; the og head facts pinned as absolute values, not only "the two heads agree" - the image is not a per-item photo, 1200x630, the file is on disk, `twitter:image === og:image`, `og:locale` - and every stub is `summary` with `og/<id>.jpg` (`tests/derived.js:150`). Ported, queued for R0b.2: tile geometry with `/img/*.webp` blocked at 360; the storage notice under 140px tall at 320; a **button** keeping focus across a re-render (`tests/app/states.js:348` today covers an *input* only). **The `.results` live region is a divergence, not a gap**: `StdPanel.svelte:150`, `RollPanel.svelte:128`, `AltPanel.svelte:192` emit a bare `<div class="results">` where the live app emits `role="status" aria-live="polite"` (`app.js:2235` etc.) - the owner's decision (2026-09-16) is to restore it; that fix is R0b.4's, not this batch's. Dropped: the one-dash grep and the `baseUrl()` grep over `app.js` (source text R0c deletes; every user-visible range string is pinned positively elsewhere); the unreadable-address rewrite (deliberately superseded by B12.1 - `sharedListPage.test.ts:335`, `sweep.js:289`); the whole-document Cyrillic-in-EN-labels regex - `shell.test.ts:39-55` plus `sweep.js`'s per-page run is the substitute, recorded as a thin spot below | one case per defect from an external report: caret, focus, live regions, contrast, truncated link, two tabs, previews, keyboard |
| `states` | journey | superseded by `tests/parity/specs.js`'s `STATES`, then by `tests/app/states.js`; that inventory itself now lives in `tests/app/inventory.js` | states reachable only by clicking |
| `audit2` | sweep | ported as is | every address, at four widths, in both languages |
| `craftmob` | layout | **audited (R0b.1), ported in four places.** Already ported (pre-dates R0b.1): the page-level sideways-scroll class at 360/390/768/1180 (`tests/app/sweep.js:246`). Queued for R0b.2, not yet landed: the four craft-heavy worst-case records (`#/i/w65`, `#/i/w3`, `#/i/ci19`, `#/i/w2`) plus `.craft, .rcraft, .dicebar, .numrow` in the clipped-text selector list (`sweep.js`); the selection-bar overflow at a narrow width (`tests/app/states.js`); the standalone share stub `i/w3.html` at 320/390 (new `tests/stub.js`); a selected tile's own fill (`tests/app/hues.js`). Thin spots recorded below: the `@media (hover:hover)` guard, and the 320px width | narrow screens, touch highlight, selection bar overflow |
| `typo` | layout | ported as is | two fonts and one size scale, every page, both languages |
| `hues` | layout | rewritten (reads rendered badges, not injected spans) | badges that can share a list are told apart by hue |

### `tests/app/*` - the same real Chrome, against `dist/` (B12)

| Suite | Kind | Responsible for |
|---|---|---|
| `app/sweep` | sweep | every address `audit2` covers plus the routes only `app/states` reaches, at four widths, both languages; axe with `color-contrast` on every cell (RU only at 360/390/768, both languages at 1180); a focus-ring walk over six named addresses at 1180 |
| `app/typo` | layout | `typo`, re-pointed at `dist/` |
| `app/hues` | layout | colour read off rendered badges and the real roll button, not an injected span |
| `app/contracts` | contract | the browser half of `contracts`, re-pointed: the link the app writes/reads, a truncated link, the llms.txt-described link, all 28 route fixtures, the stat line, filter group names |
| `app/states` | journey | the fourteen states only a trusted click, a real clipboard, a real second tab or a real network reaches: new list from the card/bar/modal, two Other frame values picked (fresh and live), `<dialog>` focus/Escape/return, two tabs sharing storage, the packed link, copy text/image, a broken art path, focus surviving a keystroke, the note textarea's height, a roll's card `<img>` node replaced |
| `app/golden` | structural | one accessibility-tree-plus-controls text snapshot per state in `tests/app/inventory.js` (110 states, both languages, four shards), compared byte-for-byte against `tests/app/snapshots/*.txt` - a control gone, a heading moved or a label renamed is a line in `git diff`, not a percentage. Regenerate a golden only with `node tests/app/golden.js --update`; `.claude/hooks/edit-guard.mjs` refuses a hand edit. It says nothing about colour, spacing, or which picture sits behind a correct `alt` - those stay `tests/app/sweep.js`'s and, until Phase 7 deletes it, `tests/parity.js`'s. The text a same-shape sibling run folds to its first two and last two occurrences (rule A) and the tail of a name past 64 code points (rule B, `namelen`/`namehash`) are both blind past that boundary. Mostly that is `data.js` catalogue text already owned by `tests/derived.js`, `tests/dataint.js` and the contract fixtures, **but not only**: retention is positional, so any node sharing a row's signature falls in the blind interior too. In `_tables_eq_weapon.txt` one of four per-tier `checkbox "Выбрать все (N)"` and one of four `StaticText "РАНГ N"` survive; the other six are elided, and a rename of one of those is not owned by any other suite once `tests/parity.js` is gone. What still fails: any attribute value change, any node added or removed (the group total moves), a role or tree-shape change, and a name change in a kept position or in any group of five or fewer. What does **not** fail: a rename inside an elided interior, and a **reorder of two same-signature siblings both inside it** - swapping them leaves the file byte-identical. |

## Features to suites

| Feature | Covered by |
|---|---|
| Six roll modes | `behave`, `audit2`, `lists2` (empty field) |
| Source switch, cannot be emptied | `behave`, `contracts` (legacy routes set it) |
| Crit jump to the table | `qa`, `audit2` |
| Tables, list/grid, search | `behave`, `eqtest`, `audit2` |
| Filter panel, pills, reset, link | `eqtest`, `contracts` |
| Filter group key names | `contracts` |
| Anchors | `eqtest`, `contracts` |
| Lists: create, reorder, remove, undo | `lists2`, `qa` |
| Add to list, menu, search from the eighth | `select`, `lists2` |
| Quantity, price, price modes, batch prices | `lists2` |
| Two notes | `notes`, `contracts` |
| List link, checksum, short link | `contracts`, `lists2`, `notes`, `qa` |
| Two tabs merge | `qa` |
| v1 storage and v1 links migrate | `notes` |
| Record card, modal, copy, share, image | `flows`, `select`, `noart` |
| Craft chains, referenced cards | `craft` |
| Print | `print` |
| Language switch | `behave`, `i18n`, `audit2`, `typo` |
| Starting section | `behave` |
| Storage unavailable | `behave`, `lists2` |
| `noindex`, robots | `derived` |
| Data generation | `derived`, `dataint` |
| `file://` | every browser suite loads the app from `file://` |

## The rewrite against the app it replaces

`tests/parity.js` is the answer to "is anything missing from the port?", and it
answers it without anybody having to remember what the old screen did.

Use [`docs/parity.md`](../parity.md) for the operational loop. Current migration
status and debt belong in `issues/47/plan.md` and `issues/47/handoff.md`.
The parity CI job runs on manual dispatch and is not a deployment dependency.

Every spec in `tests/parity/specs.js` observes a **state** - the controls on it,
what a button puts on the clipboard, the label on the roll button, the title of
the document - and returns what it saw. The harness runs each spec twice,
against `index.html` at the root and against the built `dist/`, and compares.
**Nothing is written down as the expected value: the live app is the
expectation**, re-read on every run, so it cannot go stale.

A state is a route plus what was pressed to reach it (`STATES` in the same
file), and every state is compared **in both languages at three widths** -
`LANGS` × `WIDTHS`, so the id a debt is keyed by is `"<id> @ <lang> <width>"`.
Routes alone were not enough: they only ever reach the first paint, in the
default language, at one width, above the fold.

What that has found so far: a modal four times too wide with none of the card's
buttons; an English tab reading "Core rules" where the live app says "Standard
rules"; two English subtitles and *every* English help paragraph rewritten
rather than copied; a Russian document title that had drifted; a wordmark being
translated to "Loot" when the live app never translates it; the pin toggle not
renaming itself when it is on; and focus moved into a field whose outline is
suppressed instead of left on the stepper.

Two of those came from pressing something for the first time, which is what the
coverage line at the end of a run is for: it counts the control names the run
pressed against the names it merely saw. A control nobody presses is compared
as a name in a list and in no other way. Not all of them can be states - the
roll button is random, and the live app's randomness cannot be seeded from the
harness - but the number is the honest measure of how much of the app the
states actually exercise.

The two targets are separate files and never clash. `dist/` has to be built
first; without it the suite says so and stops.

Three kinds of finding:

- **a difference** fails the run, and names the state, the spec and the field
- **outstanding** is a state the rewrite has not reached, or a difference listed
  in `ACCEPTED` with a reason - printed on every run so the list stays visible
- **stale** is an `ACCEPTED` entry that is no longer a difference. It fails, so
  an excuse has to be deleted by the slice that makes it untrue

A fourth thing is never a finding: a live defect the rewrite reproduces on
purpose is identical on both sides, so it is written in `docs/specs/DEBT.md`
rather than keyed here.

It found four things on its first run, all of which a component test had missed
because a component test only checks what somebody remembered to write:

- the record page had no **copy image** button at all
- **send** was hidden when the browser had no share sheet; the live app shows it
  and falls back to copying the link
- the roll label used a hyphen where the live app prints an en dash
- the card's metadata line and the page footer were missing, which is now
  written down as outstanding rather than unnoticed

This is also where the canvas conversion behind `ImagePort` is exercised: it
cannot run in jsdom, and here it runs in a real Chrome on both apps.

Five conditions the harness controls, each of which had produced a false
reading before it did: every state is opened from a fresh document, because a
hash-only navigation keeps the previous state's variables; the screenshot waits
for the artwork, because `loading="lazy"` keeps images out of `networkidle0` and
a blank card scores five percent; and a press waits on `document.getAnimations()`
rather than a timer, because the modal animates in one app and not the other.
The screenshot is also taken before the clipboard specs press anything - the
live app raises a toast after a copy, and taking the picture afterwards was
quietly inflating the debt on both record routes by about seven tenths of a
percent. A `timed` state is arrived at afresh at every width rather than swept
on one page, because a width sweep photographs a fading toast at whatever
distance from the press host load happened to leave it. A full-page capture is
retaken until two in a row agree, because `page.screenshot({ fullPage: true })`
can hand back a raster that has not finished, geometry unchanged and pixels
swinging by several percent on an unchanged build.

### The look

Three instruments, because they answer different questions.

**Measured** - typography and colour of the landmarks both apps certainly share,
compared strictly. These name something to go and change: "the heading is 800 at
24px and was 680 at 23px" is a fix, where "40% of pixels differ" is not.
Position and size are not measured this way: two layouts mid-port disagree about
them by definition, and a metric that always differs teaches everyone to ignore
the report.

**A per-control probe** (`driver.js`'s `typeAt`, `specs.js`'s `typeRuns`) -
computed type, text content and a measured text advance for a handful of named
controls, run at every width rather than once. It exists because a whole-page
percentage cannot see a control-sized defect: a wrong font-size on one line of
a 1100x900 screen scores about 0.09%, under `JITTER`, so the pixel diff below
reported the state as matching while three real defects sat inside it (B3.6).
This is where geometry *is* measured, as the exception to the paragraph above:
on a named handful of controls, on screens that are already built, where a
width is the consequence of a rule that was ported wrong rather than of a
layout that has not settled yet.

**A pixel diff, against zero.** `pixelmatch` compares the two screenshots and
writes a diff image next to them in `test-output/parity/`. The expectation is
that a state matches exactly: a state with no entry in `VISUAL_DEBT` fails on
any difference at all.

An entry in `VISUAL_DEBT` is a debt rather than a tolerance. It records what has
not been reproduced yet, with the reason, and it is enforced from both sides:

- the screen drifts worse than the number - it regressed, and the run fails
- the screen gets better than the number - the run fails too, asking for the
  number to come down
- the screen reaches `JITTER` or below - the run fails too, asking for the
  entry to be deleted rather than left to sit inside `DEBT_SLACK` unnoticed

So it can only ratchet towards zero, and the slice that finishes a screen
deletes its entry. `JITTER` is a tenth of a percent for machine-to-machine text
rendering; pixelmatch already discards antialiasing, so a real difference is
worth whole percents rather than hundredths.

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

`color-contrast` is off in `a11y.ts` for every call - jsdom lays nothing out,
so it can only see declared colours; `tests/app/sweep.js` measures contrast
for real, over a rendered page (B12). `nested-interactive` is on by default
and disabled only per call, via `expectNoA11yViolations(container, { allow })`,
for the handful of states that render the storage notice's live-ported markup
(`docs/specs/DEBT.md` D3) - every other component is still checked against it.

The bars differ because the obligations do. `src/lib` is pure and has no
excuse: 95 lines, 95 functions, 85 branches, 90 statements. `src/ports` wraps
browser APIs whose success paths jsdom cannot run at all, so it sits at
70 lines, 80 functions, 55 branches, 70 statements, and the difference is
covered by `tests/app/` driving the built app in a real browser (B12).
Components are at 85 lines, 80 functions, 75 branches, 85 statements; state is
at 95 lines, 95 functions, 85 branches, 90 statements.

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
- Three things existed with **no caller**: a `Button.svelte`, a `statLabels`
  helper, and the pin-the-start-section API on `AppState`. The first two were
  deleted - markup is written when a screen needs it. The third was kept and
  given `app.test.ts`, because it encodes rules read off the live app that
  would otherwise be re-derived, differently, by whoever writes that screen.

## The unit suite

`npm run test` runs the ported modules in `app/src/lib` and `app/src/ports`, and
the components, under vitest with coverage thresholds. It is a separate pyramid
from the nineteen browser suites and does not replace them: those test the app
people use, these test the one that will replace it.

| File | Held to |
|---|---|
| `listLink.test.ts` | `docs/fixtures/lists/*.json` |
| `hash.test.ts` | `docs/fixtures/urls/routes.json` |
| `i18n.test.ts` | `docs/fixtures/statlines/equipment.json` |
| `data.test.ts` | the real `data.json`, and the counts the README publishes |
| `money.test.ts` | the worked examples in the app's own help panel |
| `search.test.ts`, `lib/lists.test.ts`, `roll.test.ts` | stated behaviour |
| `state/lists.test.ts` | the live app's own list-store rules - `loadLists`..`storageWorks` and `createList` (app.js 1149-1330): the v1-to-v2 migration runs once and leaves v1 alone, a save merges with whatever another tab wrote, a refused write keeps the session working |
| `components/lists.test.ts` | the add-to-list row itself - `listMenuHTML`/`addToListBtn` and `listMemberFor(item)`'s live behaviour: the button, the menu, a chip's tick, the new-list form, and the toast each raises |
| `components/tables.test.ts` | the plain table's own behaviour - chip nav, the toolbar, selection, sectioned bodies, the row/section anchor - and, off `renderSelBar` (app.js 3706-3721), the selection bar it raises once a row is ticked: the count, the cross, its own add-to-list menu, and copying the whole selection |
| `filters.test.ts` | the facet grammar both ways, and the predicate and counters the panel is built from |
| `ports/ports.test.ts` | every way the browser says no: storage that throws, a page outside a secure context, a missing compressor, a dismissed share; and the hash router against a fake window |
| `state/app.test.ts` | settings read as untrusted data, which address may be pinned, a refused write, what an old section name sets, the storage notice's own dismissal flag, a packed address expanded through the compress port, and where it lands when the port cannot |
| `components/shell.test.ts` | the frame: labels a screen reader needs, the language switch and what it redraws, which tab is lit, the address on the way in, and axe on three states |
| `components/listsPage.test.ts` | `#/lists` - off `renderLists`/`storageWarning`/`listCardHTML` and the create/share/delete/restore handlers (app.js 2865-2931, 4136-4270): the head and its help, the storage notice (`StorageNotice.svelte`, extracted on its second use in B5.4) in both live forms, a card per list with a known-record badge and its actions, and `noData` |
| `components/listPage.test.ts` | `#/lists/<id>` and `#/l/<own payload>` - off `renderOneList` and everything it draws (app.js 2933-3128, the address at 1537-1607, the handlers at 3944-4571): the address rewrite and its address-only edge cases, the title input and the actions row, the storage notice, the money picker and its help, the list note, the roll panel (folded/absent/rolled/reset), select-all, a row's position/qty/gold/note/remove with undo, copying and sharing, deleting, a row's own modal, the drag port's `onDrop`, `noData`, and the branch into the shared page (drawn for a payload that is nobody's, nothing drawn while a packed address expands, the bad-link page when the port cannot expand one) |
| `components/sharedListPage.test.ts` | `#/l/<payload>` for a payload that is nobody's own list - off `renderSharedList` (app.js 3130-3170): the heading and the one-text-node sub, the add-to-list control and taking the whole list into a new one or an existing one (with its qty/gold/note, never the GM's own note), both list hitnotes and each entry's own after its row, the tails (`×qty`, `×qty · price`, bare price, coin mode), selection and the bar it raises, a row's own modal, the bad-link page, and English |
| `components/searchPage.test.ts` | `#/search` - off `renderSearch`, `kindChips` and the `#sq`/kind handlers (app.js 2841-2859, 2114-2132, 4160-4164, 4333): the head with no help button, the box focused on arrival, both languages at once, the assembled stat line, the 300 cap, the kind filter narrowing and refusing its last chip, equipment obeying the equipment chip regardless of its own `kind`, the filter shared with the roll pages, selection, a row's own modal, `noData`, and English |
| `components/printPage.test.ts` | `#/print/<ids>` - off `renderPrint`, `printCardHTML` and its helpers, and `fitPrintCards` (app.js 3235-3558), and the four handlers (`doPrint`/`printBack`/`printArt`/`printLink`, 4236-4245): the bar and its controls in order, a sheet's card/blank counts and page breaks, every card shape (loot with and without art, a broken image swapped for the glyph, a weapon's tier/tags/burden/die/ribbon/cells, a versatile weapon's second stat block, a damage bonus, an armoured card's shield and threshold strip, an artifact's list markup, a community record's source line), the black-and-white layout, the second-sheet and 180-id cap arithmetic, the empty address, `Назад`/print/link handlers, the fit ladder driven end to end under a faked layout, `noData`, and English |

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

Three of those fixtures are replayed by `contracts` as well, against the live
app. That is what makes them evidence rather than a record of what the new code
happens to do.

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
- **Route resolution had no fixture either.** `audit2` walks addresses to check
  they render, not that they resolve to the state they used to.
  `docs/fixtures/urls/routes.json` pins 28 shapes, including the three legacy
  section names and the source switch each one sets.
- **`robots.txt` was not in the count check** and still advertised 830 records.
  It is now checked with the other five files.

## Known thin spots

Not blocking, recorded so they are not mistaken for coverage:

- The short (`~`, deflate) link form is exercised by `lists2` and `notes`
  through the share buttons, but has no golden fixture, because deflate output
  is not guaranteed byte-stable across browser versions. The contract that is
  pinned is the plain form plus "compressed is expanded to plain on open".
- Print fitting is measured, not compared to a reference image. `print` checks
  geometry against the design's numbers and one pixel property (the art edge);
  it would not catch a purely cosmetic regression elsewhere on the card.
- `states` walks click-only states but does not assert much about them beyond
  "did not throw and rendered something".
- Touch-only behaviour is checked statically in `craftmob`: headless Chrome
  reports `hover: none` and will not emulate the `hover` media feature, so the
  `@media (hover:hover)` branch cannot be rendered in a test.
- The success paths of `clipboard`, `share` and `compress` cannot run in jsdom:
  there is no real clipboard, no share sheet and no `CompressionStream`. Their
  fallbacks - where the logic is - are covered in jsdom; `clipboard`'s and
  `compress`'s happy paths run for real in `tests/app/states.js` (B12), which
  is why the `src/ports/**` bar could move; the share sheet's success path is
  the one still without an answer - no headless browser exposes one to drive,
  so the fallback stays what is tested.
- Colour contrast is switched off in the axe pass, because jsdom lays nothing
  out and resolves no cascade. Contrast is a real measurement in `qa` and
  `typo`, on the live app, and now also on the rewrite: `tests/app/sweep.js`
  runs axe with `color-contrast` on over every address (B12) - the first gate
  that has ever measured it on `dist/` rather than only on `index.html`.
- `tests/parity.js` compares behaviour and screenshots only for registered
  states the rewrite has reached. Missing states remain invisible, so each new
  interaction surface must be registered in `STATES` in the same change.
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
- Print's geometry - the 63x88 mm card, nine to a sheet, the fit ladder, the
  art edge - is `print`'s alone until Phase 7 ports it into `tests/app/print.js`;
  `dist/`'s own print layout is untested until then.
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
  (430); adding it back costs a fifth `run-all` row and a fifth CI width, so
  it is recorded rather than re-added (R0b planned, "R0b.1 designed").
- `qa`'s whole-document "no Cyrillic in any EN `aria-label`/`title`" regex has
  no single-instrument replacement; `shell.test.ts:39-55` plus
  `tests/app/sweep.js`'s per-page `en` run over 41 addresses is the substitute,
  narrower than a whole-document grep but real rather than a grep over
  `app.js` (R0b planned, "R0b.1 designed").
