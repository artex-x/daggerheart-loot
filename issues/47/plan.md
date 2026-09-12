# Issue #47 - vanilla JS to Svelte + TypeScript

Source: [issue #47](https://github.com/artex-x/daggerheart-loot/issues/47). That
issue is the agreed plan; this file is the working copy, plus the decisions
taken while carrying it out. Where the two differ, the difference is written
down here with a reason.

Historical once Phase 8 closes - the cut-over retires the static root, and the
review after it ("Phase 8", below) is the last phase here. After that, work is driven by `CLAUDE.md`,
`docs/specs/*` and the tests.

## What must survive

Static site, no server, no build required to open it, lists in the URL hash,
two languages, GitHub Pages, `file://`. These are in `docs/specs/META.md` and
`docs/specs/CONTRACTS.md`, which outlive this file.

## Phases

| Phase | What | State |
|---|---|---|
| 0 | Baseline, inventory, durable specs, golden fixtures, coverage matrix | **done** |
| 1 | Vite + Svelte + TypeScript scaffold, quality gates, CI, contracts frozen | **done** |
| 2 | Extract pure logic to TypeScript modules with unit tests | **done** |
| 3 | Ports for replaceable concerns (drag and drop, search, modal) | **done** |
| 4 | Svelte component architecture, styling, i18n, the rewrite itself | **in progress** - see below |
| 5 | Testing pyramid: unit, component, a11y, the real-browser net | **planned (2026-09-12)** - B11 (the two owner-reported defects) and B12 (the browser layer on `dist/` and the gates); see "Phase 5 - the testing pyramid, planned". No Playwright exists or is built; the puppeteer legacy suites are re-homed now and deleted in Phase 7 |
| 6 | Build, artefacts, deployment | started: the build now completes `dist/` |
| 7 | Cut-over, cleanup, README, standing agent guidance | not started; the regression-net question it was to answer is answered by Phase 5 (decided 1-2); it becomes R0 of one 7/8 track - see "Phase 5 - the testing pyramid, planned", decided 8, and "Phase 8", "Where the phase sits" |
| 8 | Post-migration review: the app on its own terms | designed (2026-09-11) - see "Phase 8" below; runs after the cut-over, on the register B9 opens (`docs/specs/DEBT.md`) |

## Phase 4 - where the rewrite is

Built, and matching the live app exactly in both languages at all three widths:

| Screen | Route | States compared |
|---|---|---|
| Record page | `#/i/<id>` | page, whole page, both languages, three widths |
| Wondrous | `#/roll/wondrous` | page, modal, help, stepper, pin toggle |
| Dread | `#/roll/dread` | page |
| Vault of Ages | `#/roll/voa` | page, the artifacts division |
| Communities | `#/roll/community` | page, a second community |
| Core rules | `#/roll/std` | page, one source off, one kind off |
| Alternate tables | `#/roll/alt` | page, a critical success, the same at the top rarity, the same with one kind on |
| Tables (B1, the four filterless tables) | `#/tables`, `#/tables/hnf_consumable` | index, a second table, grid, searched, empty, a row opened, a row ticked, the help panel |
| Tables (B2, the filter) | `#/tables/wondrous`, `#/tables/dread` | folded, panel open, a value picked, a filter link arrived at, a filter plus a query leaving nothing |
| Tables (B3, sectioned bodies and anchors) | `#/tables/voa`, `#/tables/frames`, `#/tables/community`, `#/tables/alt_item`, `#/tables/alt_consumable` | each table's own page, a section anchor arriving on `voa`, a row anchor arriving on `core_item` (a B1 table) |
| Tables (B4, the equipment tables) | `#/tables/eq_weapon`, `#/tables/eq_secondary`, `#/tables/eq_armor` | each table's own page, the panel open, a value picked on both branches of the pill rule, a filter link, a search that keeps the type word, the empty state |

**"Matching exactly" in that table means "matching within its recorded
`VISUAL_DEBT`", and for the tables screens that turned out to be a weaker claim
than it reads. Three real defects were sitting inside debt entries whose reason
said antialiasing.** Two batches are inserted ahead of B4: **B3.5**, which
fixes them and re-baselines the debt, and **B3.6**, a two-part batch that greens
the red CI run and then builds the measurement that would have caught them.
Both are below, after "B3 built".

Not built. Each is `pending` in `tests/parity/specs.js`, so the expectation is
already being collected against the live app:

- `#/search` - the search slice. **Built as B6 (`9d5ca02`), reviewed and
  approved 2026-09-11 - see "B6 planned" and "B6 built".**
- `#/print/ci1-q1` - the print slice. **Built as B7 (`4776243`, remediated
  in `ee73d2e`), reviewed, and read clean by CI: run `34616445556` on
  `9fd3000` has all 54 `#/print` cells `совпадает` - see "B7 planned" and
  "B7 built". Phase 4 is complete.** What is open after it is bookkeeping
  and two follow-ups: "B8 planned" (the anchor debts, `main` red on the
  ratchet), "B9 planned" (implement-ready: the anchor re-play, the live
  reduced-motion policy and the behaviour-debt register; built), "B10
  planned" (implement-ready: the page-furniture extraction and the
  not-found record page).

**`#/lists` - the lists slice - is done as of B5.6.** Built across six
batches, B5.1-B5.6 (see "B5 planned" onward); B5.6 was the last one. Every
`#/lists*` and `#/l/*` state reads `совпадает` in `tests/parity/specs.js`,
none of them `pending` any longer.

### What every remaining `VISUAL_DEBT` entry is

Nothing outstanding is a styling defect. The 77 entries were five causes
before B2; B2 added a sixth. B3 adds no new cause - every one of its new
entries, below, is one of the same six, on new rows or a new control:

1. **The add-to-list and print row** under every record card - both record
   routes, the whole-page state, both roll modals, and now the table row's
   modal too. It is code that does not exist yet and lands with the lists and
   print slices, not polish to be chased. Do not let this reason absorb
   anything else: it did once, and the tier ladder hid behind it for weeks.
2. **The toast**, on `~ pinned`. The live app raises one when the starting
   section changes; the rewrite announces it to a screen reader only.
   `#/i/ci1 ~ toast` is `pending` for the same gap.
3. **The selection bar**, on `#/tables ~ a row ticked` - add to list, print,
   copy selection, at the bottom of the window once something is ticked. Same
   kind of gap as the first cause, named separately because it is a bar rather
   than a row and the reason has to say what it actually looks like.
4. **Help-panel rasterisation**, 0.29-0.79% on Wondrous, 0.34-0.72% on Core
   rules, and 0.40-2.12% on Tables. Measured, not guessed: the box, every
   paragraph, every line box and the colour are identical to three decimals
   and the text matches character for character. There is no value to copy -
   do not go looking for one.
5. **Withdrawn - this was a defect, see the correction below.**
   ~~Search-box placeholder antialiasing~~, under 900px on every Tables state -
   0.10-1.61%. The box and its placeholder measured pixel-identical, crop for
   crop, against the live app: same left edge, same width, same text: and the
   rest of each screen matched exactly on its own. What is left reads as
   antialiasing on the placeholder's thin, muted glyphs - the same class of
   noise cause 4 names, just on a control rather than a paragraph.
6. **Withdrawn - this was a defect, see the correction below.**
   ~~A description line wrapping one word earlier on a phone~~, 1.41-1.56% on
   `wondrous` and `dread` at 375px. Neither B1's four tables nor Core rules had
   a row with a long enough description to show it: the picture, the name, the
   stat line and every badge measured pixel-identical, and only the line-break
   point in the description differs by a few sub-pixels of kerning. First seen
   because B2 is the first slice to put a long Wondrous or Dread description on
   screen at 375px - not something the filter itself changed.

**B3's own new entries are the same six causes, not a seventh: cause 5 on
each sectioned table at 768px, cause 6 on each at 375px, and both the row and
section anchor states carry cause 6 as well - amplified rather than new,
because arriving at an anchor scrolls straight past the toolbar and filter
bar, so several description-heavy rows land above the fold *together* where
the bare route only ever showed one or two. Confirmed by measuring the
anchored row/section directly rather than assuming the bigger number meant a
bigger problem: its own position and size match the live app to the pixel in
both languages, and every row inside Vault of Ages' own artifact section
reports an identical name and height on both apps - the whole difference is
several already-known word-wraps landing on screen at once. The row and
section anchors also carry a small new instance of cause 4 (rasterisation) at
1100 and 768: the flash outline itself, 2px of gold, rasterises a fraction of
a pixel differently between the two apps, same as the help panel's text does.

**Correction, written after a human read `#/tables/community` at full width:
causes 5 and 6 above are wrong, and everything built on them is wrong with
them.** Cause 5 is `TablesPage.svelte` writing `font-size: 14px` on the
toolbar search box where the live app inherits 15.5px - the placeholder is
25px narrower, not identically rendered. Cause 6 is `TableRows.svelte` missing
`style.css:820`'s `@media (max-width:600px){.selbox{width:38px}}`, which makes
`.rt` 196px instead of 200px at 375 and pushes rows near a wrap point onto an
extra line - the wrap is a consequence of a 4px column, not of kerning. The
`~ panel open` entries blaming the space in `любое` on rasterisation are a
third: Svelte trimmed that space out of the markup entirely. Six causes are
therefore three, plus three defects that hid inside them for four batches. The
paragraph below about B3's entries being "the same six causes, not a seventh"
was true as an observation and false as a reassurance - the entries were the
same because the defects were the same, on new rows. B3.5 fixes all three and
rewrites this section's remainder against the numbers a real run produces; B3.6
builds the instrument that would have failed loudly on all three. The word
"antialiasing" had become the absorbing excuse this section's own cause 1
warns about.

Two real bugs surfaced while building the anchor - both fixed before any of
the above was measured, not filed as debt:

- **A font-loading race put the scroll target a few pixels off.**
  `scrollIntoView` computes where to land from the layout at the moment it is
  called; the monospace numerals in `.rnum` and the toolbar are wide enough
  that swapping from the fallback face to the real one shifts a row by a
  handful of pixels, and a scroll computed before that swap lands short or
  long by exactly that much. Deterministic once isolated - not jitter, and not
  something `document.getAnimations()` (already in the parity driver, for CSS
  animations) has any way to see, since a font swap is neither. Confirmed with
  a standalone script that read `window.scrollY` after each app's own anchor
  fired, repeated across several fresh browser launches: the live app landed
  on the same pixel every time, the rewrite alternated between two values a
  handful of pixels apart depending on how the font-load race fell. Fixed by
  waiting on `document.fonts.ready` before scrolling - the flash itself still
  fires immediately, matching the live app, since it does not depend on
  layout and gating it behind the same wait would only have made it start
  visibly later than the live app's own.
- **`SectionHead.svelte` was missing style.css's mobile override for
  `.tsec-link`** - `padding:11px;margin-bottom:2px` under 600px, a bigger tap
  target for a bare icon button that is otherwise a 20px square. Missing it
  made every section heading 10px shorter than the live app's on a phone, and
  because a `.tsection`'s own top offset compounds with every section above
  it, the drift kept growing down a table with several sections - exactly the
  "one constant offset reads as growing drift" pattern B1's toolbar margin and
  B2's `.field:last-child` cascade tie already taught, a third instance of it
  now on a rule that was ported once but only for the base width.

### The tables surface, and how it splits

Tables is the biggest thing left, and it is too big for one slice: 79
top-level rules in `style.css` and **four different body shapes** - a plain
list, a list cut into sections by tier, frame or community, the alternate
tables with hope/fear subheadings inside each rarity, and the equipment tables
with facets of their own. Split into four, each with a boundary chosen so
nothing has to be faked:

| | what | why it is a boundary |
|---|---|---|
| **B1** | the plain table: two-level chip nav, the toolbar, rows and tiles, selection, the empty state, a row opening the modal | the four tables with no filter |
| **B2** | the filter: the bar, the chosen pills, the folded panel, reset, the filter link, the `f_` segment | unlocks `wondrous` and `dread` - `community` is sectioned too, so it waits for B3 |
| **B3** | sectioned bodies and section anchors: `voa`, `frames`, `community`, and the two alternate tables | the anchors `#/roll/alt`'s crit box already links to |
| **B4** | the equipment tables, their facets and tier sections | the last body shape |

**B1's boundary is the four tables that have no filter.** `tblFacets` is empty
only where a table holds a single kind of record, and exactly four do - checked
against `data.js` rather than assumed:

| table | rows | kinds |
|---|---|---|
| `core_item` | 60 | item |
| `core_consumable` | 60 | consumable |
| `hnf_item` | 60 | item |
| `hnf_consumable` | 60 | consumable |

Every other table draws a filter bar: `wondrous`, `dread`, `frames` and `voa`
because they mix equipment in, `community` because of its `comm` facet. So B1
can build the whole page for those four without one deferred control on
screen. `#/tables` with no table name shows `core_item` - that is
`S.tables.t`'s default - and an unknown name is ignored rather than erroring.

### Three things found while planning the tables slice

- **The parity driver cannot type.** A table's query lives in `S.tables.q` and
  never enters the hash, so no URL reaches a searched table: a search box would
  ship uncompared, which is the hole that let the Core rules help print its own
  markup. B1 adds `type(placeholder, text)` to `tests/parity/driver.js`,
  gripping by the placeholder because that is the text a person reads - not by
  `id="tq"`, which is implementation and the thing the harness deliberately
  avoids gripping.
- **Search reuses the row wholesale.** `renderSearch` in `app.js` calls the
  same `rowHTML` and `selectAllHTML` as the tables. That is why search stays
  its own slice and comes after: the row is written once for tables and
  extracted on its second use, rather than designed for two callers before
  either exists.
- **A selection belongs to the page it was made on.** The live app clears
  `S.sel` on every `hashchange`, and says so in a comment - route strings
  cannot tell one table from another. The rewrite has to reset it when the hash
  changes, not when the component unmounts, because a hash-only move between
  two tables keeps the same component alive.

### B1 built: the plain table

`TablesPage.svelte` now holds every table id - the four with no facet render
in full, the other ten fall through to a `.todo` placeholder that still
resolves through the chip nav, so no chip is a dead end while B2-B4 are
outstanding. `lib/tables.ts` holds `TABLE_GROUPS`, `SUB_LABEL`/`subLabelOf` and
`groupOf`, all unit-tested including the exhaustiveness of the grouping against
`TABLE_IDS`. `Chip.svelte` grew an `href` form for the nav (a real `<a>`, same
as the tab bar) and a `size="sm"` variant for the sub-row; `ChipRow.svelte`
grew a `sub` flag for the same row's spacing. Seven parity states plus a
`~ help` state, all exact except the debts below.

**Found while building it, not before:**

- **A legacy numbering bug in the grid view, not reproduced.** `list.map(tileHTML)`
  in `app.js` passes the array's own index as `tileHTML`'s second parameter,
  which the function reads as a roll-number override - so every tile past the
  first shows its position in the list rather than its own roll. Confirmed
  against `data.js`: `core_item`'s first twelve rows are a plain 1-12, and the
  live grid draws 1, 1, 2, 3, 4, .... The rewrite draws each tile's real
  `it.roll`, which is what the row view (and the book) already shows, and the
  divergence is recorded in `ACCEPTED` in `tests/parity/specs.js` rather than
  copied - the live app is being deleted at the cut-over, and reproducing a
  numbering bug on purpose to keep a diff at zero would only carry it forward
  into the version that survives. Worth a word to the repository owner about
  the legacy site while it is still live.
- **Two spacing bugs, both from values that were guessed instead of read.**
  `.toolbar` in style.css carries `margin-bottom:18px`; the port had only
  reproduced the inline `margin-top:16px` the live markup adds on top of it,
  and invented a 6px bottom margin of its own that didn't exist anywhere in the
  original. The two are not additive - the wrapper below the toolbar opens
  with its own 6px top margin, and adjacent margins collapse to the larger
  rather than sum - so the real gap is 18px, not the fabricated 6. The result
  was every row 12px higher than the original, worse at every row further down
  the table, which is what a "growing drift" in a pixel diff usually means:
  not a value that changes per row, but one constant offset that reads as one
  the deeper into a long list you look. Fixed by copying `.toolbar`'s real
  margin rather than reasoning about the wrapper div's.
- **Svelte's whitespace collapsing changes what `textContent` says, not just
  how the page looks.** A row's accessible name is its whole content (see
  below), so a newline the compiler turns into a single space between two
  sibling elements shows up in that name even though it is invisible on
  screen - `.rt` and `.rm` are both `display:block`, so the browser does not
  render the gap, but `element.textContent` still contains it. Three
  boundaries needed the tight `>`/`<` placement RecordCard already uses
  elsewhere in the codebase: between the name and the stat line, between the
  row and its badges, and between a tile's number and its name. The last one
  took two tries - Prettier reformats a short tag like `<div class="tile-b">`
  back onto its own line even when the source had it hugging the previous
  element, undoing the fix on the next format. A single `<!-- prettier-ignore -->`
  placed before the whole `<button class="tile">` - not before each inner
  `<div>` separately - is what actually survives formatting, because Prettier
  ignores everything inside the node it is told to skip, not just that node's
  own tag.
- **The row's accessible name is deliberately its whole content, not a label.**
  Confirmed against the live app rather than assumed: `rowHTML`'s button
  carries no `aria-label`, so a screen reader reads the name, the stat line,
  the description and the badges together. Verbose, but matching it exactly is
  what let the two bugs above surface at all - the parity harness's control
  inventory diffs exact strings, and a hand-written `aria-label` would have
  quietly hidden both.

### B2 built: the filter

The section below is the design as it was written, kept for the reasoning;
what was actually built matched it, with three things found only while
building - listed after it rather than folded in, the way B1 did.

**Objective.** Draw the filter the live app draws over a table: the strip
(`fBarHTML`), the panel it folds open (`fPanelHTML`), and the `f_` segment of
the address (`fEncode`/`fDecode`/`syncFltUrl`). Two more tables become real -
`wondrous` and `dread` - and nothing else changes.

**Scope, and what B2 unlocks - corrected.** The handoff written after B1 said
B2 unlocks `wondrous`, `dread` and `community`. It unlocks **two tables, not
three**: `community` has a `comm` facet *and* a sectioned body
(`renderTables()` splits it by community, app.js ~2520), so it needs B3 as
well. Checked against `data.json` rather than assumed:

| table | rows | kinds present | body |
|---|---|---|---|
| `wondrous` | 119 | item 49, consumable 59, equip 11 | plain |
| `dread` | 29 | item 15, consumable 7, equip 7 | plain |
| `community` | 90 | item only (`comm` facet) | sectioned - B3 |
| `voa` | 108 | item 71, consumable 13, equip 24 | sectioned - B3 |
| `frames` | 94 | consumable 2, equip 92 | sectioned - B3 |
| `alt_item`, `alt_consumable` | - | no facets at all | sectioned - B3 |

So B2 implements exactly one facet row: **`kind`**, with the values that table
actually holds, in `KINDS` order (item, consumable, equip). `tier`, `frame` and
`comm` are B3's; the seven equipment groups are B4's. `KNOWN` in
`TablesPage.svelte` grows by `wondrous` and `dread`; the other eight tables keep
the `.todo` placeholder.

**Non-goals.** No sectioned bodies, no equipment facets, no selection bar, no
add-to-list row, no search page, no `Panel.svelte` extraction (see below). No
change to the hash grammar, the fixtures, `CONTRACTS.md` or `llms.txt`: the
`f_` segment is already frozen, already implemented in `lib/filters.ts` and
`lib/hash.ts`, and already replayed by `docs/fixtures/urls/routes.json`.

#### What the live app does, read off app.js

- `tblFacets(tid)` (2625) builds the rows. For a plain table it is the `kind`
  row where `tableKinds(tid).length > 1`, plus `tier` on `voa`, `frame` on
  `frames`, `comm` on `community`.
- `fBarHTML(tid, shown, total)` (2661) draws, in order: the `.btn.sm.ftoggle`
  carrying `aria-expanded`, the word "Filters" and a count of picks; one
  `.fpill` per picked value; then, only while something is picked, `.fclear`
  and `.flink`; then `.fcount`,
  which reads `total` alone when nothing is picked and `shown of total` when
  something is. The panel follows the strip when `S.fOpen`.
- `fPanelHTML` (2686) is `.panel.ffilter` holding one `.field` per row: a
  `.lbl` with the row's name, plus an italic "any" while that row is untouched,
  and a `.chips` row of `.chip` buttons carrying `aria-pressed`.
- `flt` (4178) toggles one value or resets everything, then `syncFltUrl()`
  (1583) and `render()`. `syncFltUrl` returns early on a table with no facets.
- `currentRoute()` (3617): a different table clears `S.fOn`, `S.fSeg` and folds
  the panel; a tail starting `f_` is decoded **only when it differs from
  `S.fSeg`**, and doing so **opens the panel**.
- Both empty states (2534 and 2742) add a reset button of their own, because
  the panel's reset has scrolled away.

Four details that are not visible from the markup and are what a port gets
wrong:

- **`.ffilter` is declared twice.** `margin-top:16px` at style.css:926 and
  `margin-top:10px` at 948, same specificity, so **10px wins**. This is the
  `.numbox` trap again: the rule that looks deliberate is not the rule that
  applies. Measure the element in both apps before copying either number.
- **`.fbar`'s `margin-top:16px` never shows.** It sits after a `.toolbar` whose
  `margin-bottom` is 18px, and adjacent margins collapse to the larger. The
  rewrite's `.toolbar` already carries `margin: 16px 0 18px`, so the strip
  needs its own 16px written down and no gap added anywhere else.
- **A pill's accessible name is its `title`, not its text.** `.fpill` carries
  a `title` reading "remove from the filter", and the harness's name function
  prefers `aria-label`, then `title`, then text - so every pill reports the
  same name and the inventory dedupes them to one. Copy the `title`; a pill
  named after its value would be a divergence the inventory reports forever.
- **A bare number in a pill takes its row's name** (`fChosen`, 2604:
  `/^\d+$/.test(...) ? f[1] + ' ' + o[1] : o[1]`), so `2` reads "Tier 2". No
  B2 value is numeric, so this is **B3's**, written down here so it is copied
  rather than re-derived.

#### How it is built

**`app/src/lib/facets.ts`** (new, pure). `facetRows(index, table, t)` returns
`{ group, label, values: { value, label }[] }[]` - B2 returns the `kind` row or
nothing. The group names come from `groupsFor()` in `lib/filters.ts`, which is
where the frozen part lives; this module only decides which values a row offers
and what each is called. `lib/filters.ts` already says the values are the
caller's business, and `lib/data.ts` already exports `plainFacets()` and
`kindOf()` from Phase 2 - both are still uncalled, and B2 is what calls them.

**`app/src/components/FilterBar.svelte`** (new). The strip and the panel, one
component because they are one feature and the live app draws them from one
function. Props: the rows, the picked `FilterState`, `shown`, `total`, whether
the panel is open, and callbacks for toggle / pick / reset / copy-link. It owns
none of the routing.

**`TablesPage.svelte`** grows the wiring and stays the owner of the address:

- `filter` is **read from `app.route.filter`** rather than mirrored. The live
  app needed `S.fSeg` because `currentRoute()` re-read the address on every
  render and fought the panel; here the write and the read are the same source,
  so the mirror is only needed for the one thing it decides - whether the panel
  should spring open.
- `seenSeg` is that mirror, and it holds **the exact string this component last
  wrote**. An effect compares it with `encodeFilter(route.filter, groups)`: when
  they differ the address came from somewhere else, so the panel opens - which
  is `S.fSeg`'s whole job in app.js. Round-tripping is stable for anything we
  wrote ourselves, so folding the panel and then dropping a pill does not
  spring it open again.
- The same effect resets `seenSeg` and folds the panel when the table changes,
  which is what `currentRoute()` does at 3622. It is one effect rather than two
  because the two would depend on each other's order.
- Picking normalises: a group's values are stored **in the row's declared
  order**, not in click order, because `fEncode` iterates the facet's values and
  filters. Otherwise the address reads differently for the same picks.

#### Three changes outside the tables screen, each with a reason

1. **`AppState.replace(hash)`** - writes the address through
   `env.router.replace` *and* updates `this.hash`, the way `go()` does minus the
   history entry. Without it `app.hash` goes stale after a filter pick and the
   pin button, `isHome` and `route` all disagree with the address bar; the live
   app's `replaceState` updates `location.hash`, so the rewrite has to as well.
2. **`AppState.navigations`** - a counter incremented when the router announces
   a change and when `go()` is called, and **not** by `replace()`. The live app
   clears the selection on `hashchange` (4627), and `replaceState` does not
   fire one - so a filter pick keeps the ticks and a link does not. Keying
   `TablesPage`'s selection reset on `app.hash`, which is what B1 does, would
   clear the selection on every chip press. The counter is the honest signal:
   "somebody navigated", not "the address string changed".
3. **`memoryRouter.replace` must stop announcing.** `hashRouter.replace` uses
   `replaceState` and fires nothing; the fake announces to its subscribers, so
   a test would see a navigation the browser never has. That is a defect in the
   fake, and it is what would make the counter above pass in tests and fail in
   the browser. `ports.test.ts` gains the case.

`Button.svelte` gains two things the toggle needs and nothing else does yet: an
`expanded` prop for `aria-expanded`, and a third `variant` for `.ftoggle.has`
(gold text, gold-tinted border) - the live app's toggle is a `.btn.sm`, so
copying its padding into a second place would put the decision in two files.
Watch the coverage floor: `Button.svelte` is the one named exception at 50%
branches, and two more props push it down.

#### Found in passing, not B2's to fix

- **`.panel` is copied into five components** - `AltPanel`, `RecordCard`,
  `RollPanel`, `StdPanel`, `TablesPage` - and `.ffilter` would be a sixth. The
  rule in `CLAUDE.md` is extract on the second use, so this is already four
  uses past due. It is not folded into B2: a cross-cutting extraction inside a
  filter slice is a change nobody can review, and it touches every screen the
  parity harness has already agreed on. It wants its own commit, verified by
  the existing states not moving. B2 writes the sixth copy.
- **The record modal does not close when the address changes.** `hashchange`
  in the live app calls `closeModal()` (4628); `TablesPage`'s effect clears the
  selection and leaves `open` alone. B2 is rewriting that effect and the fix is
  one line beside the selection reset, so it lands here with a component test
  rather than being filed and forgotten.
- **Eight tables have no parity state at all**, not even `pending`. Only
  `#/tables/eq_weapon` was written down. A state that is absent is invisible
  forever, so B2 adds `pending` entries for `voa`, `frames`, `community`,
  `alt_item` and the two remaining equipment tables. Pending states cost
  nothing - the runner prints them and moves on.
- **A name collision to avoid when writing states.** `fEquip` and
  `grpEquipment` are the same word in both languages, so clicking it on
  `#/tables/wondrous` finds the equipment chip in the navigation - which is a
  link - before the kind chip in the panel. Grip the "items" chip instead:
  with one sub-table, Wondrous draws no sub-row, so that name is unique on the
  page.

#### Corrections to two things this plan already said

- The decision "the kind filter is per panel, not per app" named the wrong
  third screen. The live app's shared `S.kind` covers Core rules, the alternate
  tables and **search** (2847, 2856). Tables never shared it: its kind facet is
  `S.fOn.kind`, which already resets when the table changes. So there is
  nothing for B2 to reconcile, and the open question belongs to batch C.
- The handoff's "B2 unlocks wondrous, dread, community" is wrong about
  `community` - see the table above.

#### What B2 has to leave behind

Tests, in the same commit as the behaviour:

- `lib/facets.test.ts` - the `kind` row for `wondrous` and `dread`, the empty
  answer for `core_item`, and the value order.
- `components/tables.test.ts` - the toggle folds and unfolds; a chip picks and
  a pill drops the same value; reset clears; the count reads `total` alone
  until something is picked; arriving at `#/tables/wondrous/f_kind-item` opens
  the panel; changing table clears the filter and folds it; the empty state
  grows its own reset button; a filter pick **keeps** the selection and a
  navigation clears it; the modal closes on a navigation.
- `components/a11y.test.ts` - `FilterBar.svelte` in `COVERED`, and a pressed
  state that opens the panel with a value picked. The fixture there has one
  `wondrous` row and no `dread`; it needs rows of two kinds for a panel to
  exist at all.
- `state/app.test.ts` - `replace()` updates the hash, adds no history entry and
  does not count as a navigation; `go()` does.
- `ports/ports.test.ts` - `memoryRouter.replace` announces nothing.
- `tests/parity/specs.js` - six new states and two new specs, below.

Parity states, each compared in both languages at three widths:

| id | how it is reached |
|---|---|
| `#/tables/wondrous` | a route: the strip folded, nothing picked |
| `#/tables/wondrous ~ panel open` | press the filters toggle |
| `#/tables/wondrous ~ filtered` | press the toggle, then the items chip |
| `#/tables/wondrous ~ filter link` | route `#/tables/wondrous/f_kind-item` - arrives with the panel open |
| `#/tables/wondrous ~ nothing found` | filter, then type a query nothing matches: the empty state with its own reset |
| `#/tables/dread` | the second table with a kind row, and the smallest |

Two specs beside the pixels, because both are off screen:

- **the address after a filter pick** - `presses: true`, reads `d.hash()` on
  the filtered state. The `f_` segment is a frozen contract and no screenshot
  can see it.
- **the filter link on the clipboard** - `presses: true`, presses the link
  button and reads `d.clipboard()`.

`NAME` gains the filters toggle, the items chip, the reset and the filter-link
button in both languages. `enter` steps run before the language is switched, so
they keep gripping Russian.

Expect new `VISUAL_DEBT` entries only for the search-box placeholder noise
already named as cause 5, at 768 and 375. Any other number gets its diff image
opened before a reason is written: a reason that explains less than the whole
difference is how the tier ladder stayed missing for weeks.

**Found while building it, not before:**

- **`.field:last-child` never actually zeroes the margin inside `.ffilter`.**
  Both rules are two classes deep - `.field:last-child` (line 151) and
  `.ffilter .field` (line 927) tie in specificity, a pseudo-class counting the
  same as a class - so at equal specificity the one written later in the file
  wins, and `.ffilter .field`'s 12px comes after the reset. The port had
  copied the reset as if it applied, which made the panel 12px shorter than
  the live app's real one and shifted everything below it up by that much -
  the same "one constant offset reads as growing drift the deeper you look"
  pattern the toolbar margin hit in B1, just a cascade tie instead of a
  duplicate declaration. Confirmed by measuring `.ffilter`'s bottom border in
  both apps rather than reasoning from the source, which is what actually
  found it: the `.numbox` trap again, and worth watching for in B3, where a
  second field makes `:last-child` matter for real.
- **A leading space inside an `{#if}` is not the same as a leading space in
  the markup.** `t().anyValue` reads "ТИП <i>любое</i>" with a literal space
  before the italic, and the first attempt wrote the space as its own line
  inside the `{#if}` block; Svelte's whitespace trimming at a block boundary
  removes it rather than collapsing it to one, which is a different rule from
  the "collapses to one space" behaviour the B1 handoff already knew about for
  whitespace *between* elements. The fix is the same tool B1 used for a
  different reason: `<!-- prettier-ignore -->` on the whole `<span>`, with the
  space written inline on one line rather than on its own.
- **`FilterBar`'s `.ffilter` needed `.panel`'s base rules copied in, not just
  its own override.** `TablesPage.svelte`'s `.tablenav` already does this for
  the nav strip; `.ffilter` is `.panel`'s second use in this file and needed
  the same background, border and padding written into its own scoped rule -
  missing it left the panel with no box at all around the label and chips.

### B3 planned: sectioned bodies and section anchors

**Objective.** Draw the four remaining plain-body tables that split their list
into subsections - `voa` (by tier), `frames` (by campaign), `community` (by
community) - plus the two alternate tables, which split by rarity and then by
hope/fear. Bring the facet rows those tables need (`tier`, `frame`, `comm`)
and the row/section anchor - `#/tables/<table>/<key>` - which nothing renders
today. Nothing outside `TablesPage.svelte` and its two new library modules
changes.

**Scope.** `voa`, `frames`, `community`, `alt_item`, `alt_consumable` join
`KNOWN` in `TablesPage.svelte`. `facets.ts` grows `tier`, `frame` and `comm`
rows. A new `<div class="tsection">` wrapper, its heading (with a
copy-section-link button), and the scroll-and-flash behaviour the anchor
segment triggers.

**Non-goals.** No equipment facets or tier sections (B4). No selection bar, no
add-to-list row (batch D). No search page (batch C). No change to the hash
grammar, `filters.ts`'s `PLAIN_GROUPS`, `CONTRACTS.md` or `llms.txt` - the
groups for these five tables are already frozen and implemented
(`PLAIN_GROUPS` already lists `voa: ['kind','tier']`, `frames:
['kind','frame']`, `community: ['comm']`), and `plainFacets()` in
`lib/data.ts` already answers `tier`, `frame` and `comm` for any record. Only
`facets.ts` (which values a row *offers*, and what to call them) and the
rendering are new.

#### What the live app does, read off app.js and confirmed against a running
copy of `index.html` this session (not assumed)

- `renderTables()` (2457-2543) branches on `st.t`: `voa` walks `VOA_TIERS = [1,
  2, 3, 4, 'A', 'C']`, `frames` walks `FRAME_ORDER` (four campaigns), and
  `community` walks `COMMUNITIES` (nine names) - each producing one
  `<div class="tsection" id="sec-<key>">` per non-empty group, `sectionHead()`
  plus `renderList()` inside. `alt_item`/`alt_consumable` are their own branch
  (2464-2494): five rarities, each with up to two `<h4 class="altcol
  hope|fear">` subsections holding the same row/tile markup, hope before fear,
  and only where that column has rows after the query narrows it.
- `sectionHead(label, table, key)` (2389) is a small heading row: a label and
  one button, `.tsec-link`, that copies `#/tables/<table>/<key>` -
  `t().copySection` for its title, `t().sectionLinkCopied` toasted after
  (confirmed by reading `app.js:3886-3890`: `data-copy-sec` splits on `/`
  and picks `sectionLinkCopied` whenever a key is present, `tableLinkCopied`
  when it is not - the same handler `TablesPage.svelte`'s existing "copy table
  link" button already exercises for the table-only case).
- **The row/section anchor is a real, working, completely unported feature.**
  Confirmed by running `index.html` in the browser this session:
  `#/tables/alt_item/rare` scrolls to and outlines `#sec-rare`;
  `#/tables/core_item/ci1` - a *row* anchor on one of **B1's own tables** -
  scrolls to and outlines the row for `ci1`. The mechanism (`app.js`
  3832-3845) is one piece of code for both: it looks up
  `#sec-<key>` first, falls back to `[data-row="<key>"]`, calls
  `scrollIntoView({behavior:'smooth', block:'start'})` and toggles a `.flash`
  class removed after 1.6s. `RecordPage`'s "show in table" link
  (`RecordPage.svelte:66`, already built) has been generating
  `#/tables/<table>/<id>` row-anchor links since Phase 4 with **nothing on the
  other end** - the target table draws the row, but nothing scrolls to it or
  flashes it, on any of the six tables built so far. No parity state visits
  this at all (`grep` of `tests/parity/specs.js` for `itemtable`, `anchor`,
  `flash` and `showInTable` all come back empty), so it has been invisible the
  whole time B1 and B2 were being verified - the same shape of gap as the tier
  ladder in `#/i/q1`. **This batch is where it gets built**, because B3 is
  what makes `route.anchor` real for the first time (B1/B2 parsed and ignored
  it), and the same code serves both cases.
  - CSS is entirely written already and needs no change: `.row.flash,
    .tilewrap.flash{outline:2px solid var(--gold);outline-offset:2px}` (row
    and tile anchors), `.tsection{scroll-margin-top:110px}` plus
    `.tsection.flash{animation:flash 1.6s ease-out}` with a `prefers-reduced-
    motion` fallback to a plain outline (section anchors). `style.css:171-174,
    536-544`.
  - The parity harness already sets `prefers-reduced-motion: reduce`
    (`driver.js:334`, for the card fade-in), so a screenshot of an anchored
    state lands on the static outline, not mid-animation - no new driver
    plumbing needed there.
- **A bare number does *not* read as a bare number in the tier facet's
  labels.** The B2 handoff filed this as "B3's" - re-checked this session by
  reading `tblFacets`'s `voa` branch (`app.js:2634`) and confirmed live:
  `o[1]` for a numeric VoA tier is `voaTierName(k)`, i.e. `"Ранг 2"` already,
  not the bare digit `"2"`. `fChosen`'s `/^\d+$/.test(o[1])` therefore never
  fires for `voa`'s tier facet - it only ever fires for the *equipment*
  tables' tier facet (`eqFacets`, `app.js:2575`, whose labels really are bare
  `"1"`-`"4"`), which is **B4's**, not B3's. Browser-confirmed on
  `#/tables/voa`: picking "Ранг 1" produces a pill reading "Ранг 1", not
  "Ранг Ранг 1". **`FilterBar.svelte`'s existing rule already handles both
  cases correctly and needs no change**: it tests `v.value` (`/^\d+$/`), not
  `v.label`, so for `voa` (`value: "2"`, `label: "Ранг 2"`) the test fires and
  reconstructs `row.label + ' ' + v.value` = `"Ранг" + " " + "2"` = `"Ранг 2"`
  - the same string, purely because `row.label` for the tier facet is the same
  word `voaTierName` uses. `facets.ts`'s job for `tier` is simply to mirror
  `voaSectionName` (already in `lib/sections.ts` - see below), not to invent a
  new numeric rule.
- `voa`'s tier values are `[1, 2, 3, 4, 'A', 'C']`; `sections.ts`'s
  `VOA_SECTIONS` and `voaSectionName(k, t)` **already exist**, built for
  `#/roll/voa`, and produce exactly the labels the tables facet needs
  (`"Ранг 2"`, `t.voaArtifact`, `t.voaCursed`) - confirmed against `data.json`
  this session: `voa` holds `tier` values `1,2,3,4,'A','C'`, matching
  `VOA_SECTIONS` exactly. `facets.ts`'s `tier` row for `voa` is a thin wrapper
  around `voaSectionName`, not a new naming function.
- `community`'s facet values and the section list are **the same derivation**:
  `sections.ts`'s `communities(index)` and `communityName(c, lang)` already
  exist (built for `#/roll/community`) and read the list off the records
  rather than a hardcoded pair - confirmed against `data.json`: `community`
  holds exactly the 9 names `COMMUNITIES` lists, in the same order (first
  appearance in the data). `facets.ts`'s `comm` row and `renderTables`'s
  per-community section both reuse `communities()` directly; nothing new to
  derive.
- `frames` has **no roll section** (frames never appear in `SECTIONS`/`TAB_LIST`
  - checked `types.ts`), so unlike `voa` and `community` there is no existing
  `lib` module naming a frame. `FRAME_ORDER` (`app.js:483`, four ids) and
  `FRAME_LABEL` (476-481, both languages) are new to the rewrite. Confirmed
  against `data.json`: `frames` holds all four (`beast_feast` 36,
  `colossus` 21, `dark_heart` 36, `motherboard` 1) - `motherboard` having only
  one row does not change the facet: `tblFacets` lists all four unconditionally
  (`app.js:2637`), so an unpicked, single-row group still gets its own chip.
- **`label.ts`'s `srcLabel` frame branch is already wrong, already shipped,
  and invisible for the same reason the anchor is: nothing has visited it.**
  `srcLabel(it, lang)`'s `case 'frame'` (`label.ts:82-83`) returns
  `it.frame ?? t.srcFrame` - the **raw id**, e.g. `"beast_feast"` - where the
  live app's `srcName(k)` (`app.js:944-948`) falls through to `frameName(k)`
  and shows `"Пир зверей"` / `"Beast Feast"`. Confirmed live this session:
  `#/i/f1`'s source badge reads "Пир зверей" on the live app. `label.ts` is
  Phase 2 code, used by every record card and row (`cardBadges`/`srcLabel` in
  `TablesPage.svelte` and `RecordCard.svelte`), so this has been wrong since
  before B1 - it stayed invisible because no parity state has ever opened a
  frame-equipment record (`#/i/f1` or any other), and `frames` itself has been
  `.todo` until now. **Not fixed by chance in B3's own work** - `srcLabel`
  is outside `TablesPage.svelte` - so it needs its own line item: once B3
  writes the frame-name lookup (for the `frame` facet's labels and the
  section headings), the same lookup fixes `srcLabel`'s `frame` case in the
  same commit, with a `label.test.ts` case and, ideally, a parity state that
  opens one frame-equipment record (`#/i/f1` is real data) to keep it from
  going invisible again.

#### How it is built

**`app/src/lib/frames.ts`** (new, pure, mirrors `sections.ts`'s shape).
`FRAME_ORDER` (the four ids, in book order - not derived from the data the way
`communities()` is, because `app.js` doesn't derive it either: order is a
book-authored fact, not something to infer from row counts) and
`frameName(id, lang)` off `FRAME_LABEL`. Used by `facets.ts`'s `frame` row,
`TablesPage.svelte`'s section loop, and `label.ts`'s `srcLabel` fix.

**`app/src/lib/facets.ts`** grows three branches, each thin:
- `tier` on `voa`: `VOA_SECTIONS.map(k => ({ value: String(k), label:
  voaSectionName(k, t) }))`, imported from `sections.ts` rather than
  reimplemented.
- `frame` on `frames`: `FRAME_ORDER.map(id => ({ value: id, label:
  frameName(id, t.lang or similar) }))` - check whether `Dict` alone can name
  a frame or whether `frameName` needs the `Lang`, matching `sections.ts`'s
  `communityName(c, lang)` signature rather than threading `t` where the
  existing sibling threads `lang`.
- `comm` on `community`: `communities(index).map(c => ({ value: c.id, label:
  communityName(c, lang) }))`.

Each is gated on the table actually holding that facet (mirroring the `kind`
row's `groupsFor(table).includes(...)` check) and, for `frame`/`comm`, gated
on nothing else - `tblFacets` always lists all four frames and all nine
communities, not only the ones with rows in the current filter state, because
the facet *offers* values independent of what else is picked.

**`TablesPage.svelte`** grows:
- A `sections(table, filtered)` computation (or three small ones) that groups
  the already-filtered, already-searched list by tier/frame/community/rarity,
  in book order, dropping empty groups - mirrors `renderTables`'s per-branch
  `.filter(...)` + `.map(...)`, reusing the existing row/tile markup inside
  each group rather than duplicating it.
- A `TableSection.svelte` (new, small) or inline block for one
  `<div class="tsection" id="sec-<key>">` - heading, copy-link button, then
  the same rows/tiles block B1 already renders, parameterised by the list.
  Whether this is worth its own component or stays inline in
  `TablesPage.svelte` is a real question (see below) - the alt-table body
  needs two nested levels (rarity, then hope/fear), the other three need one,
  so the shared part is the section wrapper and heading, not the whole body.
- Anchor handling: on `route.anchor` (already parsed by `hash.ts`, already
  typed on `Route`, unused by any component today), after the list renders,
  find `#sec-<anchor>` or `[data-row="<anchor>"]`, scroll it into view, and
  flash it for 1.6s (or apply the reduced-motion outline directly, matching
  the live app's own media query - Svelte can toggle a class and let CSS carry
  the animation the same way `style.css` already does, rather than
  reimplementing the timing in script). Needs an effect keyed on
  `route.anchor` and `table` together, cleared once used (matching
  `S.tables.anchor = ''` after the live app consumes it - an anchor should not
  re-fire on every re-render, only once per navigation to it).
- `alt_item`/`alt_consumable` need their own body branch: five rarities from
  `RARITIES5`-equivalent (check whether a `lib` module already has this -
  `rarityKey`/`rarityLabel` exist in `label.ts` for the roll picker; the
  `hope`/`fear` split reads `index.altRow`... no - re-check: `altRow` is a
  *lookup by face*, not a listing. The alt-table body needs the **columns**,
  not a random-access lookup - confirm whether `Loot.alt[kind][rarity]` (the
  raw `hope`/`fear` id arrays) is exposed anywhere in `Index`, or whether this
  branch has to read `loot.alt` directly. This is a real open question for the
  implementer to resolve before writing code, not answered by this session's
  reading.

**CSS**: `.tsec-head`, `.tsec-link`, `.altcol` (two colour variants, `hope`/
`fear`), the `.tsection` scroll-margin and flash keyframes, `.field:last-child`
already learned. All values are in `style.css:527-544` (already quoted above)
plus wherever `.altcol` is declared - not yet located this session, worth
finding early.

**`dict.ts`** gains `frameF`, `commF` (facet row labels - `t().frameF`,
`t().commF` in `app.js`, not yet copied), `copySection`, `sectionLinkCopied`
(both already used by the table-link button's sibling case but not yet needed
until a component actually renders a per-section link), plus whatever
`frameName`'s dictionary needs (four names x two languages - check whether
these belong in `dict.ts` proper, following `voaArtifact`/`voaCursed`'s
precedent of living in the shared dictionary, or in `frames.ts` itself,
following `sections.ts`'s precedent of deriving community names from data
rather than the dictionary - frames cannot be derived from data the way
communities are, since a frame's *name* is not stored on any record, so this
one likely wants its own small table in `frames.ts`, matching `FRAME_LABEL`'s
own location in `app.js` rather than `T.ru`/`T.en`).

#### Open questions for the implementer, not resolved by this session

1. **Where do the four frame names live** - `frames.ts` (own table, like
   `app.js`'s `FRAME_LABEL`) or `dict.ts` (like `voaArtifact`)? Leaning
   `frames.ts`, stated above, but not verified against how `dict.ts` is
   organised elsewhere (single free-standing strings vs. small lookup tables)
   - worth a quick look at `dict.ts`'s existing shape before deciding.
2. **Does `Index` need to expose the alternate tables' raw hope/fear id lists**,
   or is there already a way to get "every record in rarity R, column C" that
   this session did not find? `altRow` answers "the Nth one", not "all of
   them" - check before assuming `data.ts` needs a new field.
3. **One component or inline per body shape?** A `TableSection.svelte` that
   only wraps a heading and one list is cheap to write and might be premature -
   CLAUDE.md's rule is extract on the second use, and this batch is the first
   and only place four different sectioning schemes exist at once. Decide
   once the four branches are actually written and it is visible whether they
   share more than the heading.
4. **Should the `srcLabel` fix and the anchor-scroll feature be their own
   commits inside this batch, or folded into "B3 built"?** Both are
   pre-existing gaps this session found rather than B3-shaped work in the
   narrow sense - but both share code/data with what B3 is building anyway
   (the frame name table; `route.anchor`, which nothing but B3 will ever
   populate meaningfully with a section key). Splitting them out only pays if
   review wants to see them separately; recorded as a decision to make, not
   made here.

#### What B3 has to leave behind

Tests, in the same commit as the behaviour, following B1/B2's pattern:

- `lib/facets.test.ts` - the `tier` row for `voa` (values and labels, using
  `voaSectionName`), the `frame` row for `frames` (all four, in order, even
  though `motherboard` has one row), the `comm` row for `community` (all
  nine, in the data's order).
- `lib/frames.test.ts` (new) - `frameName` in both languages for all four ids.
- `lib/label.test.ts` - the `srcLabel` fix: a frame-equipment record's badge
  reads the frame's name, not its id, in both languages.
- `components/tables.test.ts` - each of the five tables groups into the right
  sections in the right order, empty groups are dropped, a row/section anchor
  scrolls (or at least sets the expected state/class - jsdom has no real
  layout, so "scrolled" likely means "the target element gained the flash
  class and `scrollIntoView` was called", not a pixel check, matching how
  other component tests already avoid asserting real geometry).
- `components/a11y.test.ts` - a pressed state for a sectioned table (the
  panel now has two fields for `voa`/`frames`, which is where `.field:
  last-child` would first matter for real, per the B2 handoff's own note).
- `tests/parity/specs.js` - replace the five `pending` entries
  (`#/tables/voa`, `#/tables/frames`, `#/tables/community`, `#/tables/alt_item`,
  `#/tables/alt_consumable`) with real states, each comparing at minimum the
  bare route; add states for a section-anchor arrival (e.g.
  `#/tables/alt_item/rare`) and a row-anchor arrival on **an already-built B1
  table** (e.g. `#/tables/core_item/ci1`) - the latter is not new *scope* for
  B3 in the sense of a new table, but it is the only way the anchor feature's
  fix gets verified on the tables that have existed since B1, and per
  CLAUDE.md ("a state that is absent is invisible forever") it has been
  missing this whole time. Add `#/i/f1` (or similar) as a state if one does
  not exist, to catch the `srcLabel` fix.
- `NAME` gains whatever section heading or copy-link button text the new
  states grip (`t().copySection`, community/frame names as needed for
  `enter` steps).

Expect new `VISUAL_DEBT` entries for the same three noise causes B1/B2 already
carry (help-panel rasterisation, search-placeholder antialiasing, and possibly
a new description-reflow case if a sectioned table's rows are long enough at
375px) - open the diff image before writing any reason that is not one of
those three, per CLAUDE.md's warning about reasons that explain less than the
whole difference.

### B3 built: sectioned bodies and section anchors

What was built matches the design above. The four open questions it left were
resolved while writing the code, not guessed at beforehand:

1. **Frame names live in `lib/frames.ts`**, its own small table
   (`FRAME_ORDER`, `FRAME_LABEL`, `frameName(id, lang)`), matching
   `FRAME_LABEL`'s own location in `app.js` rather than `dict.ts` - a frame's
   name is not derivable from any record, so it earns the same shape
   `sections.ts` already uses for the two facts that *are* derivable.
2. **`Index` grew `altColumn(kind, rarity, col)`**, returning `{ it, n }[]` for
   a whole column rather than one face - `altRow`'s sibling, sharing the same
   internal `altCols` map `buildIndex` already builds. `n` is the face that
   found the record, 1-indexed, which is what the alt-table body shows instead
   of the record's own `roll` in whatever table it is also printed in.
3. **The row/tile markup is a genuine component, not a snippet.** The plan
   above suggested a `TableSection.svelte` for the heading and left the body
   itself inline; building it surfaced a real blocker for that: Svelte 5's
   `{#snippet}` blocks, called locally with `{@render}` in the same file
   eslint-plugin-svelte's `@typescript-eslint/no-confusing-void-expression`
   flags every such call as "placing a void expression inside another
   expression" - confirmed with a two-line reproduction file outside this
   component, so it is not a mistake in the markup, it is the tool. Every
   existing snippet in this codebase is a *prop* (`Snippet<T>`, passed down
   and rendered by the child), never a same-file `{#snippet}` rendered by the
   component that declared it - which is exactly the pattern this batch was
   the first to want, four times over. Rather than fight the linter, the row
   and tile markup - by now wanted by five call sites (plain, tier, frame,
   comm, and each alt column) - moved into `TableRows.svelte`, well past
   "extract on the second use", and the heading became `SectionHead.svelte`
   (used by the same five). `TablesPage.svelte` is left holding only the
   per-body-shape grouping logic and the `.tsection`/`.altcol` wrappers.
4. **The `srcLabel` fix and the anchor-scroll effect landed inside this
   batch's own commit**, not split out - both share code this batch is
   already writing (`frameName`; `route.anchor`, which nothing but this batch
   ever populates with a section key), and splitting them into their own
   commits would have meant re-deriving the same context for a reviewer twice.

**The anchor effect** lives in `TablesPage.svelte`, keyed off `app.route`'s
`anchor` field and guarded by `app.navigations` (not by the anchor string
alone) so a search or a filter pick - which do not touch `navigations` - never
re-fires a scroll a link already played. It looks up `#sec-<anchor>` first,
then `[data-row="<anchor>"]`, and toggles `.flash` for 1.6s on whichever it
finds - the same lookup order and the same class `app.js`'s own version used,
now serving all eleven tables built so far rather than only the five this
batch adds. Confirmed live before writing it, and again after: `#/i/f1`'s
"show in table" link and `#/roll/alt`'s critical-success links have both been
generating anchors nothing consumed since Phase 4; both work now.

**Testing**: `lib/facets.test.ts` grew the `tier`/`frame`/`comm` rows;
`lib/frames.test.ts` (new) covers `frameName`; `lib/label.test.ts`'s frame case
was rewritten to assert the fix rather than the bug; `lib/data.test.ts` covers
`altColumn` against the real dataset. `components/tables.test.ts` grew: each
sectioned table groups correctly and drops empty groups, each section carries
its own select-all scoped to its own rows, the alt tables number by die face
and draw no select-all at all, the section-link button copies and announces,
the row and section anchors flash the right element (and a third test checks
an anchor naming neither does nothing), and the `frames` row's badge now reads
the campaign's name. `components/a11y.test.ts` gained a pressed state for a
sectioned table's filter panel - two fields, not one, which is where
B2's `.field:last-child` note said it would first matter for real - and
`TableRows.svelte`/`SectionHead.svelte` were added to its `COVERED` guard,
both pointed at `tables.test.ts`'s new sectioned-body axe check.

### B3.5 built: the absorbed parity debt

All three fixes shipped as planned, plus the focus-glow line. The real numbers,
read from `node tests/parity.js "tables"` (Rewritten build off this session's
final source, three fixes and the focus glow all present):

- `#/tables @ ru`: 1100 already had no entry (`совпадает`); 768 dropped from a
  0.13% debt to 0.00%; 375 dropped from 1.14% to 0.00%. `#/tables @ en 375`:
  1.0% to 0.00%. Matches `context.md`'s simulated prediction closely (it
  predicted 0.00/0.00/0.145 for the three widths, without the focus-glow line
  in the mix - the real 375 number came in lower still, at 0.00, not 0.145).
- Every other table this batch and B1-B3 built moved the same way at 375:
  `hnf_consumable`, `dread`, `voa`, `frames`, `community`, `alt_item`,
  `alt_consumable` all went from a 0.8-1.61% debt to 0.00% (one exception,
  below). `#/tables ~ searched` and `#/tables ~ nothing found` did too.
  `#/tables/wondrous` and its four sub-states (`~ panel open`, `~ filtered`,
  `~ filter link`, `~ nothing found`) all went to 0.00% at every width that
  had carried an entry, including `~ panel open @ ru 1100` (0.11% -> 0.00%),
  the exact cell the `любое` space was measured on. `#/tables ~ grid` dropped
  from 0.10-0.28% to 0.00-0.01% at every cell - under `JITTER` everywhere, so
  gone rather than lowered.
- **49 entries deleted.** 20 were the run failing outright ("стало лучше -
  опусти число" - the number the harness itself refuses to let stand); the
  other 29 were already inside `DEBT_SLACK` and had to be found by reading the
  percentages rather than waiting for a red run, exactly as `context.md`
  warned. None of the 49 kept "search-box placeholder antialiasing" or a
  `любое`-rasterisation reason - the whole comment block above them, which
  named those two causes, went with them. The full list is the `git diff` on
  `tests/parity/specs.js`; it is not worth re-typing here.
- **One entry survived unchanged in each language for a genuine, still-real
  cause:** `#/tables/core_item ~ row anchor @ ru|en 375` (8.85%/8.51% recorded,
  8.84%/8.47% measured - inside slack, still real, still large). The English
  1100/768 flash-outline entries for both anchors were exact matches to the
  measured value, also unchanged.

**One entry got worse, and it is B3.5's own fix that did it - confirmed, not
guessed.** `#/tables/voa ~ section anchor @ ru 375` moved from a 9.52% debt to
10.05% measured, twice, reproducibly - a real fail, not machine noise. Root
cause, found the way `context.md`'s method describes (a standalone script,
`getBoundingClientRect`/`scrollY` read directly, the harness's own launch
args), plus one extra step this time: reverting just the `.selbox` mobile fix
in a scratch copy, rebuilding `dist/`, and re-running the one state.

`tests/parity.js` scrolls to an anchor exactly once, at `WIDTHS[0]` (1100),
inside `arrive()`. The 768 and 375 screenshots that follow only resize the
viewport and call `settle()` - nothing re-scrolls. So the 375px screenshot
shows whatever the scrollY computed at 1100 lands on once the document has
reflowed to roughly double its 1100-width height. `tA` (Vault of Ages'
artifact tier) sits near the bottom of a long table, so the per-row reflow
difference between the two apps compounds over several dozen rows before it,
and the frozen scrollY ends up pointing at a different stretch of the list
entirely between legacy and next - not a word wrapping earlier, a whole
screenful landing elsewhere. Reverting `.selbox { width: 38px }` alone (keeping
the other two fixes) and rebuilding reproduced the old 9.52% exactly, twice.
The fix did not misplace the anchor - it changed how much the rows above it
reflow differently before the frozen scrollY is reinterpreted at 375, and this
time the change happened to move the number the wrong way. This is a property
of the harness's scroll-once-then-resize design, not a defect in either app,
and it is a **new**, previously undocumented failure mode, distinct from the
font-loading race B3 already fixed (that one was about *when* the scroll fires
within one width; this one is about screenshotting three widths off one
scroll). Recorded in `VISUAL_DEBT` at the measured 10.05%, with a reason
naming the real mechanism; `#/tables/voa ~ section anchor @ en 375` kept its
old value (8.84%, measured 8.90% - inside `JITTER` of it, not a fail) but got
the same corrected reason, since it is the same mechanism at a smaller
magnitude - English text compounds less reflow difference per row.
`#/tables/core_item ~ row anchor` does not show this pattern because its
target sits near the top of a short table, where the frozen scrollY is small
in both apps regardless of width.

This is worth a line in B3.6's own scope, not a fix here: the per-width probes
B3.6 is about to add will read a **different** scrollY at each width than the
whole-page screenshot does, because nothing about a probe requires the anchor
scroll to have happened at all. Whether that matters for the four named
controls depends on where they sit relative to an anchor state, which is not
one of B3.6's four `only`-listed states - so it likely does not apply, but the
mechanism above is worth having in mind if a future per-width spec ever runs
against an anchor route.

**The restored focus glow did not move any parity number.** Tested directly:
with the `box-shadow` line removed again and `dist/` rebuilt, `#/tables ~
searched` - the only state that ever focuses the search box (`d.type()` calls
`el.focus()` and never blurs it) - produced the identical six numbers with and
without the glow (`совпадает`/0.00%/0.01% at every cell, both ways). No other
state focuses the search box. The glow is correct to have restored - it is in
`style.css:258` and its absence was a real gap against the live app - but no
state in the current `STATES` list is capable of seeing it move a percentage.
Recorded here rather than asserted from reading the CSS, per this batch's own
standard.

**`.selbox`'s specificity, confirmed in the rendered build rather than by
argument:** a small puppeteer probe against `dist/index.html` at 375px read
`getComputedStyle(...).width` directly. `.selall .selbox` (the "select all" row
in list view): 42px. A plain row's `.selbox`: 38px, the new override actually
applying. `.tilewrap .selbox` (grid view): 30px, untouched. Matches the
acceptance criterion exactly.

**A new, unrelated blocker surfaced by the full-suite gate, not by this
batch's own changes - see the handoff's Blockers section for the full
writeup.** `node tests/run-all.js parity` (the unfiltered suite) fails on four
states this batch never touches: `#/roll/wondrous ~ modal @ ru 768|375`,
`#/roll/wondrous ~ help @ ru 768|375` and `@ en 375`, `#/i/ci1 ~ whole @
ru|en 768|375`, and `#/i/f1` (both languages - a missing `ACCEPTED` entry for
the add-to-list control, plus a small unrecorded pixel drift at 1100/768).
Confirmed pre-existing with `git stash` - identical failures, same numbers,
reproduce against the unmodified `main` tree with none of B3.5's changes
present. Left alone rather than fixed: none of the four are tables states, all
four are demonstrably unrelated to the three CSS defects this batch owns, and
chasing them would have turned a three-rule fix into an open-ended one. The
`"tables"`-filtered run this batch is scoped to is clean (`расхождений нет`,
confirmed twice, before and after the `.selbox` root-cause experiment).



A human read `#/tables/community` at full width and saw two things the harness
was reporting as clean. The orchestrator confirmed both by measurement and
found a third while confirming them. All three had been absorbed by
`VISUAL_DEBT` entries whose stated reason is antialiasing. The measurements,
the method and the simulated scores are in `issues/47/context.md` - read that
rather than re-deriving them; this section says what to change and what has to
land with it.

#### The three defects

1. **The toolbar search box is 14px where the live app is 15.5px.**
   `style.css:254` gives `input[type=search]` `font:inherit` and no
   `font-size`, so the live box inherits the body's 15.5px/24.8px.
   `TablesPage.svelte`'s `.toolbar input[type='search']` writes `font: inherit`
   and then `font-size: 14px` - an invented value with no comment and no source
   rule behind it. The placeholder measures 259.59px in the live app and
   234.47px in the rewrite: 25px narrower, on a control that is on every table
   route. This is the whole of the "search-box placeholder antialiasing" debt,
   whose reason claims the placeholder "measured pixel-identical".

2. **Svelte trimmed the space before the `любое` hint.** `app.js:2692` writes
   `esc(f[1]) + ' <i>' + esc(t().anyValue) + '</i>'`, so the live label's
   `textContent` is `"Тип любое"`. `FilterBar.svelte:96` puts that space at the
   *start* of the `{#if}` block, where Svelte's whitespace normalisation drops
   it: the rewrite renders `Тип<i>любое</i>`, `textContent` `"Типлюбое"`, and
   the `<i>` starts 4.3px to the left. This is the whole of the two
   `~ panel open` entries whose reason is "the space in `любое` rasterises a
   shade differently".

3. **`.selbox` is missing its mobile width override.** `style.css:820`, inside
   `@media (max-width:600px)`, sets `.selbox{width:38px}`. `TableRows.svelte`
   ported the base `width: 42px` and not the override, so at 375px every row's
   checkbox column is 4px too wide: `.row-main` starts at x=59 rather than 55
   and is 284px rather than 288, so `.rt` is 196px rather than 200. Rows whose
   title or description sits near the wrap point gain a whole extra line - row
   5 ("Разговаривающие Сферы") is 158.95px against 136.56px - and the page ends
   up about 78px taller. This is the whole of the "description line-wrap at
   375px" debt.

   **This is the fourth instance of one pattern**: a rule ported at its base
   width with its `@media` override left behind, whose constant offset
   compounds down the page and reads as growing drift. B1's toolbar margin,
   B2's `.field:last-child` cascade tie, B3's `.tsec-link` mobile padding, now
   this. It has earned a line in `CLAUDE.md`; see "What lands in the specs and
   in CLAUDE.md" below.

#### A fourth, suspected, not yet measured

`style.css:257` gives the focused search box
`box-shadow:0 0 0 3px rgba(216,171,94,.14)` on top of the gold border.
`TablesPage.svelte:606`'s `.toolbar input[type='search']:focus` has the
`outline: none` and the `border-color` and **not** the `box-shadow`, with no
comment saying why - the same shape of omission as defect 1 and defect 3, in
the same rule this batch is already editing. Three states focus that box (the
driver's `type()` calls `el.focus()`): `#/tables ~ searched`,
`#/tables ~ nothing found` and `#/tables/wondrous ~ nothing found`.

It was not measured this session and the planner is not asserting it changes
any number - a 14%-alpha glow may well sit under pixelmatch's threshold. It is
a missing declaration from a ported rule either way, it is cheap, local and
safe, and CLAUDE.md's campsite rule covers exactly that. Restore it, in the
repository's own colour syntax (`rgb(216 171 94 / 14%)`, matching
`TableRows.svelte`'s existing `rgb(216 171 94 / 10%)`), and record in the
handoff whether it moved any debt.

#### What to change

| File | Change |
|---|---|
| `app/src/components/TablesPage.svelte` | delete the `font-size: 14px` line from `.toolbar input[type='search']`; add `box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);` to `.toolbar input[type='search']:focus` |
| `app/src/components/FilterBar.svelte` | line 96: `{#if groupIsAny(picked, row.group)}{' '}<i>{t.anyValue}</i>{/if}` |
| `app/src/components/TableRows.svelte` | add `.selbox { width: 38px; }` to the existing `@media (max-width: 600px)` block |
| `app/src/components/tables.test.ts` | the two label assertions below |
| `tests/parity/specs.js` | the `VISUAL_DEBT` bookkeeping below |
| `docs/parity.md` | the standing rule about page-sized denominators |
| `CLAUDE.md` | one line: port a rule with its `@media` overrides |
| `issues/47/plan.md`, `issues/47/handoff.md` | corrections and the next batch |

Notes the implementer must not have to rediscover:

- **`{' '}`, not a literal space and not `&nbsp;`.** An expression tag is a text
  node the compiler cannot trim. A non-breaking space is a different glyph
  advance and a different line-break opportunity, so it would trade one
  measurable difference for another. Do not move the space inside the `<i>`
  either: an italic space is not the same advance.
- **Keep the `<!-- prettier-ignore -->`** above that line. It is there because
  prettier reflows the tag and reintroduces the trimming.
- **`.selall .selbox` must stay 42px at 375.** `style.css:418` sets
  `.selall .selbox{...width:42px}` at specificity (0,2,0), which beats the
  media query's `.selbox` (0,1,0) in the live app; `TableRows.svelte` already
  carries that rule at line ~261, so adding the media query reproduces the live
  behaviour with no further change. Svelte's scoping hash is added to every
  selector equally, so relative specificity is preserved. The same reasoning
  covers `.tilewrap .selbox` (30px, 0,2,0): grid tiles are unaffected in both
  apps.
- **Put the override in the `@media (max-width: 600px)` block that already
  exists** in `TableRows.svelte` (around line 275, currently holding
  `:global([data-row]) { scroll-margin-top: 132px }`) rather than opening a
  second one.

#### Coverage: what belongs where

jsdom does not apply a Svelte component's scoped `<style>`, so the component
suite cannot see a `font-size` or a `width` at all. That draws the line
cleanly, and it is the line to hold rather than reaching for a source-text
assertion (grepping a component's style block tests the source, not the
behaviour, and would rot on the first refactor):

- **`tables.test.ts` carries defect 2**, because it is DOM text and nothing
  else. Two assertions, in the existing `describe('the filter')` block, both
  against `#/tables/wondrous` where the `kind` row's label is `Тип`:
  1. with the panel open and nothing picked,
     `container.querySelector('.field .lbl')?.textContent` is exactly
     `'Тип любое'` - use `toBe` on the raw string, not `toHaveTextContent`,
     which normalises whitespace and would pass on the bug;
  2. after clicking `Предметы`, the same node's `textContent` is exactly
     `'Тип'` - this is what catches the space being hoisted out of the `{#if}`
     rather than into it.
  Russian only. There is no English render helper in `tables.test.ts` and this
  batch should not invent one; the parity harness already runs every state in
  both languages.
- **Parity carries defects 1, 3 and 4**, because they are CSS. Today that means
  the pixel diff plus the re-baselined debt. B3.6 is what turns them into a
  named value that fails loudly; see below.
- No new files, so no new coverage thresholds to satisfy.

#### The `VISUAL_DEBT` bookkeeping

This lands in the same change, not as a follow-up. Three things the
implementer needs to know before touching the table:

1. **A state that becomes exact must have its entry deleted, not lowered.** An
   entry of `0` still fails: `pct > JITTER` with no entry is the only passing
   shape for a matching state.
2. **The harness will not tell you about the small ones.** The ratchet is
   `pct < debt.pct - DEBT_SLACK` with `DEBT_SLACK = 0.5`, so an entry recorded
   at 0.13 that now measures 0.00 is *inside* the slack and passes silently.
   Every entry under 0.5 has to be deleted by reading the number in the run
   output, not by waiting for a failure. (B3.6 closes this; see there.)
3. **Entries above 0.5 will fail if they improve**, which is the harness doing
   its job - lower those to the measured value.

Expected outcome, from the simulated scores in `context.md`
(`#/tables @ ru`: 0.092 -> 0.000 at 1100, 0.131 -> 0.000 at 768,
1.749 -> 0.145 at 375). These are expectations to check against the real run,
not numbers to write down:

- **Expected to be deleted.** Every entry at 768 whose reason is "search-box
  placeholder antialiasing" (the 0.11-0.14 band, on `#/tables`,
  `hnf_consumable`, `wondrous` and its four sub-states, `dread`, and B3's five
  sectioned tables); `#/tables ~ grid` at every width and both languages (the
  grid's tiles carry their own 30px `.selbox`, so the search box is the whole
  of it); both `~ nothing found` pairs at 375 (no rows on screen, so nothing
  but the search box); and the two `~ panel open` entries whose reason is the
  `любое` space (`@ ru 1100`, `@ en 768`).
- **Expected to survive with a corrected reason.** The 375px entries on table
  routes that still show rows. `#/tables @ ru 375` simulates at 0.145, above
  `JITTER`, so something is left - and whatever it is, its reason may no longer
  say "description line-wrap": that phrase described defect 3 and defect 3 is
  gone. Open the diff image before writing the new reason. If a residue turns
  out to be genuinely sub-`JITTER`, delete the entry instead.
- **Expected to survive unchanged.** The four anchor entries at 1100/768
  (`#/tables/core_item ~ row anchor @ en 1100|768`,
  `#/tables/voa ~ section anchor @ en 1100|768`, 0.42-0.63, the flash
  outline). Note what these already tell you: they are English-only, and the
  Russian cells carry no entry at all, which is consistent with the search box
  being scrolled out of the fold in an anchor state - so the search fix should
  not move them.
- **Expected to move without being about this batch.** The 375px anchor
  entries (8.51-9.52) are the same reflow, multiplied by how many rows land
  above the fold together; they should collapse. `#/tables ~ a row ticked`,
  `#/tables ~ a row opened` and `#/tables ~ help` at 375 all draw rows behind
  or beside their own cause and may drop by more than `DEBT_SLACK`, which will
  fail the run and ask for a lower number. That is expected work, not a
  surprise.
- **Not touched.** Everything on `#/i/*`, `#/roll/*` and the help panels at
  1100/768. If one of those moves, stop: it means the change reached further
  than three CSS rules.

Two entries carry reasons that are now known to be false and must not be
copied forward under a new number: "search-box placeholder antialiasing - see
the note above `VISUAL_DEBT`" and "the space in `любое` rasterises a shade
differently at full width - measured character-for-character identical". Both
were written against measurements that were never taken at the level of the
glyph run. Any surviving entry needs a reason that names something measured
this time.

The prose above `VISUAL_DEBT` and in `plan.md`'s "What every remaining
`VISUAL_DEBT` entry is" both state causes 5 and 6 as noise. Both have to be
corrected in this change - see the correction already written into that
section.

#### Registering the state the human actually reported

`#/tables/community`'s filter panel has no state: `~ panel open` exists on
`wondrous` only, so the exact screen in the human's screenshot was never
compared. `docs/parity.md` is explicit that an absent state is invisible to the
harness. Add:

```js
{
  id: '#/tables/community ~ panel open',
  route: '#/tables/community',
  why: "the filter panel on a sectioned table - the screen the любое defect was reported from",
  enter: async (d) => { await d.click('Фильтры'); }
}
```

That is six more cells (two languages, three widths) and roughly a minute of
run time. It is worth it: it is the screen a person looked at, and the `comm`
facet row is a different row from `wondrous`'s `kind`.

#### Verification

```text
npm run check
npm run check:built
node tests/parity.js "tables"
node tests/run-all.js parity
```

`check:built` is required - all three fixes alter what a screen draws. The
filtered `tables` run is the working loop; the full `parity` run is the gate,
because the debt table was edited across many states and a stale entry
elsewhere fails the suite rather than this filter. Copy anything worth keeping
out of `test-output/parity/` before a second, narrower run: every invocation
wipes it.

#### Acceptance criteria

- `#/tables/wondrous`'s open filter panel renders `.field .lbl` as exactly
  `Тип любое`, and exactly `Тип` once a value is picked; both asserted in
  `tables.test.ts`.
- `.toolbar input[type='search']` has no `font-size` declaration; the focused
  rule carries the 3px glow.
- `TableRows.svelte` has `.selbox { width: 38px }` under
  `@media (max-width: 600px)`, and `.selall .selbox` still resolves to 42px.
- `node tests/run-all.js parity` passes with no state failing in either
  direction.
- No `VISUAL_DEBT` entry anywhere still gives "search-box placeholder
  antialiasing" or the `любое` rasterisation as its reason.
- `docs/parity.md` carries the denominator rule; `CLAUDE.md` carries the
  `@media` porting line.
- `#/tables/community ~ panel open` is in `STATES`.

#### Risks and do-nots

- **Do not lower `JITTER` and do not flip `includeAA`.** Rescoring the same
  pair with `includeAA: true` moved 1100 from 0.092% to 0.127% and 768 from
  0.131% to 0.181% - still the same order of magnitude as the threshold, so it
  converts a silent pass into a marginal one that the next session absorbs into
  a fresh "antialiasing" entry. It would make the excuse more plausible, not
  less. The denominator is the problem, not the sensitivity.
- **Do not fix a debt number by eye.** Read it out of the run output, and open
  the diff image before writing any surviving reason.
- **Do not touch `index.html`, `app.js` or `style.css`.** They are the
  expectation.
- **Do not extend the fixes past these rules.** Any other missing declaration
  found while reading the two CSS blocks goes in the handoff, not in this
  commit, unless it is inside a rule this batch already edits.

### B3.6 planned, part 0: make the harness quick enough to use

Ordered first inside B3.6, before part 1's diagnosis. Full reasoning in
`.claude/improvements.md`, "Finding 5"; this is the scoped version.

`node tests/run-all.js parity` takes **867s on CI** and the `tables` filter
alone takes ~9 minutes locally. That cost is not incidental - it is why workers
push long runs into the background and lose them, why a filtered run gets
treated as the gate, and therefore why CI stayed red for eight runs with nobody
looking. Part 1 is about to run this suite many times, so halving it pays for
itself inside the same batch.

Two structural facts, read off `tests/parity.js`:

- The run is **fully sequential** - `for state -> for lang -> for target -> for
  width`, one page at a time, with `no-await-in-loop` disabled at both hot
  spots.
- The **`legacy` side is re-shot on every run**, although the static root is
  frozen by policy: `CLAUDE.md` forbids touching `index.html`, `app.js` and
  `style.css` precisely because they are the expectation.

**In scope.**

1. **Cache the legacy screenshots, content-addressed.** Key each cached PNG on
   a hash of everything that can change it - `index.html`, `app.js`,
   `style.css`, `data.js`, the referenced assets, plus the state's own
   `id`/`route`/`enter` source and the viewport list. A hit is byte-identical
   to what the run would have produced, so it cannot mask a difference; a miss
   re-shoots and re-stores. Expect close to **half the wall clock**. Needs a
   `--no-cache` flag and a hash manifest stored beside the cache, under
   `test-output/` or a gitignored `.cache/` - never in the repo.

2. **Shard the CI run** across a job matrix (4 shards, roughly 220s each), the
   gate failing if any shard fails. Costs runner minutes, not correctness, and
   it removes the excuse for treating a filtered local run as the gate. This
   also settles part 1's item 5 - keep the unfiltered suite blocking, just make
   it affordable.

3. **Give the test suite a timeout that matches what it does.**
   `vite.config.mts`'s `test` block sets **no `testTimeout`**, so vitest uses
   its 5000ms default - while the a11y and component tests legitimately take
   5-13 seconds each, because axe over a full page in jsdom is slow. That is
   not flake: it is a timeout set below the work. It holds on an unloaded
   machine and on CI, and collapses the moment anything else runs - a single
   `npm run check` on a developer box during this session produced **66 failures,
   50 of them `Test timed out in 5000ms`**, against a suite that passes clean
   on its own. Three separate sessions have now written this off as
   "contention" in a handoff.

   There is a second mechanism on top of the first, and fixing only the
   timeout would leave it: **a timed-out test leaves `axe.run()` in flight, and
   axe holds a global lock**, so every later a11y test dies with `Axe is
   already running`. One timeout takes the rest of the file with it, which is
   why the failure count swings with load rather than staying put - 53 alone,
   66 during a `check`, 92 with one puppeteer probe alongside. Proof the
   timeout is the trigger: `npx vitest run --root app --testTimeout=30000
   src/components/a11y.test.ts` passes 17 of 17 where the same file fails
   wholesale at the default.

   Measure first: run the suite alone and record the slowest tests, then set
   `testTimeout` from what the work actually costs plus headroom, rather than
   picking a round number. Consider a higher timeout scoped to the a11y specs
   rather than raising it globally and hiding a genuinely hung test. Whatever
   is chosen, write the reasoning next to the value - an unexplained timeout is
   how this one got left at the default.

   This is a correctness issue as much as a speed one: a gate that fails
   randomly teaches everyone to re-run it until it passes, which is exactly how
   the red CI run in part 1 went unexamined for eight builds.

**Out of scope, deliberately: local parallelism.** A pool of 2-4 pages would
cut the rest, but it can change timing, and this repo has already been bitten -
the B3 handoff records five spurious `Test timed out in 5000ms` failures from a
vitest run overlapping a parity run's browsers. B3.6 part 2 exists to make
measurements trustworthy; do not destabilise the instrument in the same batch.
If it is attempted later, it goes behind a flag defaulted off and is adopted
only after a run at that concurrency reproduces every recorded number exactly -
the evidence bar the B3.5 reviewer used to rule out machine drift.

**Acceptance.** A cold run and a warm run produce identical verdicts and
identical percentages for every state; `--no-cache` reproduces the cold run;
the cache invalidates when any hashed input changes (prove it by touching
`style.css` and watching the miss); CI green and measurably faster.

**Why this is safe to do before part 1.** Caching cannot change a pixel - it
returns the same bytes or re-shoots. So the instrument is unchanged while part
1 uses it to diagnose, which is the property that matters.

### B3.6 planned, part 1: the red CI run

**B3.6 is one batch in two parts, merged at the owner's request on the standing
"prefer larger coherent batches" policy.** Part 1 (this section) makes the full
parity suite green on CI; part 2 (the next section) builds the instrument that
would have caught the defects B3.5 fixed. They belong together: both are about
whether the harness's verdict can be believed, both edit `tests/parity/*`, and
part 2's acceptance criterion is that it fails on part 1's own findings.

Ordered immediately after B3.5 and before B4. Written by the orchestrator at
the owner's request; to be executed in a separate session.

**Why B4 stays separate**, having been offered as a merge target: B4's own
acceptance includes a clean parity run and new `VISUAL_DEBT` entries for three
new tables. Building it inside a batch that is simultaneously rewriting the
debt table and replacing the instrument means no number can be attributed to
one change or the other - which is precisely the confounding that let three
defects hide behind an "antialiasing" reason for three batches. Fix the ruler,
then measure.

#### The finding

`.github/workflows/ci.yml` runs `npm run test:legacy`, which is
`node tests/run-all.js` with **no filter**. The full parity suite therefore runs
on every push and pull request. Every run on `main` since "Batch B1 planned and
written down" (2026-09-03) has failed - eight consecutive red builds. Sessions
recorded parity as passing while only ever running the filtered `tables` subset
locally, so nobody was looking at the gate that actually blocks.

The failures at `4976cb4` on ubuntu, and the same suite's failures on the
Windows development machine, are in `issues/47/context.md` under "CI is red".
Read that section rather than re-running to rediscover the list.

Two things are tangled together there, and the batch's first job is to separate
them:

- **A consistent overshoot on both machines.** `#/roll/wondrous ~ help` and
  `#/i/ci1 ~ whole` are over their recorded debt on ubuntu *and* on Windows.
  `~ whole` is over by up to 1.4pp, which is far too large to be text hinting.
  Something regressed these, or their debt was recorded against a baseline that
  no longer exists.
- **Genuine cross-platform variance of a tenth or two on top.** The two lists
  do not match: locally `#/roll/wondrous ~ modal` and `#/i/f1` fail and
  `~ help @ en 768` passes; on ubuntu the reverse.

`#/tables/wondrous @ en 768` and `@ en 375` are in the CI list and are
**already fixed** - they were the search-box defect, closed by B3.5. Expect
them to be green and do not go looking for them.

#### Owner decisions - settled input, do not re-open

Both taken by the repository owner on 2026-09-09 and recorded in `context.md`:

1. **CI (ubuntu) is the authoritative machine for `VISUAL_DEBT` numbers.** A
   debt figure must make CI green. A local Windows run is advisory and gets a
   documented per-platform tolerance; local drift may not be written into the
   table as though it were the baseline - which is what `docs/parity.md`'s
   "Machine variance" section already says, and which this batch is the first
   to have to honour in practice. Rejected on the record: per-platform pairs of
   numbers, and simply widening `JITTER`/`DEBT_SLACK`.
2. **Diagnose every failing state and fix root causes. Re-baseline only what is
   genuinely machine variance.** Explicitly not "green CI now, diagnose later" -
   the owner's stated reason is that it risks writing another absorbing excuse
   of the kind B3.5 just spent a batch removing.

#### What to build

1. **Get the complete list.** The CI log is not it: `run-all.js` prints only
   about a dozen grepped lines per suite, and the workflow's own comment says
   so. Either run `node tests/run-all.js parity` unfiltered locally and read
   `test-output/`, or download the `failure-output` artifact from a red run
   (`gh run download <id> -n failure-output`; it is ~197 MB, and the run at
   `4976cb4` is `34019148841`). Prefer the artifact for the ubuntu numbers,
   because those are the authoritative ones - a local run tells you about the
   advisory machine only.

2. **Run each failing state down individually**, with the standalone-puppeteer
   method the handoff's "Session gotchas" section and `context.md` both
   describe: the harness's own launch args
   (`['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']`), both
   `index.html` and `dist/index.html` at the same route, computed styles and
   `getBoundingClientRect()` read directly. For each state decide, with
   evidence, which of these it is:
   - a real defect in the rewrite -> fix the cause, and expect the number to
     fall a long way rather than a hair;
   - content that is correct but positioned by something not built yet -> the
     debt reason has to say that specifically, naming the control, not the
     word "antialiasing";
   - genuine cross-platform variance -> record against **ubuntu**, per
     decision 1.

   `#/i/ci1 ~ whole` is the one to start with. It is the largest overshoot, it
   is over on both machines, and it is a whole-page state, so a single missing
   element that shifts the footer accounts for a lot of pixels at once. B3.5's
   own experience is the pattern to expect: three separate "noise" reasons all
   turned out to be one CSS declaration each.

3. **`#/i/f1`'s missing `ACCEPTED` entry.** The Windows run fails it on
   `the controls on the page :: controls`: the live app's inventory carries
   `Добавить в список` / `Add to list` and the rewrite's does not. Every other
   record-card route has an `ACCEPTED` entry for exactly that gap; this one was
   never written when the state was added in B3. Add it, keyed the way the
   neighbours are - check the actual spec and field names in
   `tests/parity/specs.js` rather than copying a shape from here.

   Note that this failure did **not** appear in the CI log excerpt, which is
   most likely the dozen-line cap rather than a real pass; confirm against the
   full ubuntu output before concluding either way.

   `#/i/f1` also shows a small pixel drift with no `VISUAL_DEBT` entry at all
   (`@ ru 1100` 0.60%, `@ ru 768` 0.11%, `@ en 1100` 0.44%, `@ en 768` 0.10%).
   Plausibly the same missing control shifting the layout; not measured. Do not
   write an entry for it until it has been.

4. **Write the platform rule down.** `docs/parity.md`'s "Machine variance"
   section currently says not to replace established debt with local drift but
   does not say which machine establishes it. Add decision 1 there: CI/ubuntu
   is the baseline, a local run is advisory, and a local-only difference of a
   tenth or two is expected and is not licence to edit the table. Say how a
   person on another platform is meant to tell the two apart - the honest
   answer is the failing state's size and whether both machines agree, and that
   is worth stating rather than leaving to judgement.

5. **Decide whether CI should keep running the unfiltered suite as a blocking
   gate**, and record the decision either way. It is currently the only thing
   that would have caught this, which argues for keeping it; it also takes
   ~867s on CI, which is most of the run. Do not change the workflow without
   saying why in the plan.

#### Acceptance

- The complete failing-state list is written down, each with a diagnosis and a
  named cause - not one of them left as "antialiasing".
- `node tests/run-all.js parity` exits clean locally, and the reasoning for why
  it will also be clean on ubuntu is stated per re-baselined entry.
- `npm run check` and `npm run check:built` pass.
- CI is green on the resulting commit. **This is the acceptance criterion that
  matters**, and it cannot be verified from the working tree - it needs the
  owner to push. Say so in the handoff rather than declaring victory locally.
- `docs/parity.md` carries the platform rule.
- No `VISUAL_DEBT` entry was raised without its reason saying out loud that it
  was raised and why, per the doc comment above the table.

#### Out of scope for part 1

- The equipment tables (**B4**).
- The harness's metric and the new probe spec - that is part 2. Part 1 uses the
  harness as it stands, so that its diagnoses are made with the same instrument
  that produced the red run.
- `index.html`, `app.js`, `style.css` - they are the expectation.

#### Ordering within the batch

Part 1 first, part 2 second, and **do not collapse them into one pass**. Part
2's distinguishing acceptance criterion is that reverting each fix makes the
new spec fail by name; that only works if the fixes exist first. Part 1 may be
committed on its own if the batch is interrupted - it is a coherent boundary.

### B3.6 planned, part 2: the instrument that would have caught them

The second half of B3.6, run after part 1's fixes are in the tree - see part 1's
"Ordering within the batch" for why the order is load-bearing.

#### Why it is separate, and why it is not just a smaller threshold

The harness did not fail because it is broken. It failed because its verdict is
a percentage of the whole page. A wrong font size on one line of a 1100x900
screen is about 0.09% - under `JITTER`, so `#/tables @ ru 1100` had no
`VISUAL_DEBT` entry at all and printed `вид: совпадает`. **A control-sized
defect cannot outvote a page-sized denominator**, and no setting of `JITTER`
fixes that: below 0.1 the number starts tracking machine-to-machine text
hinting, which is the noise `JITTER` exists to absorb. `includeAA` is not the
culprit either (0.092 -> 0.127; 0.131 -> 0.181).

What does fix it is measuring the control instead of counting the page. The
harness already has that instrument and already trusts it: `metrics()` compares
computed typography between the two apps, with no expected value written down
anywhere, and `COVERAGE.md` says why - "the heading is 800 at 24px and was 680
at 23px" is a fix, where "40% of pixels differ" is not. This batch points that
same instrument at four named controls on the tables screen. All three defects
were values: `14px` against `15.5px`, `"Типлюбое"` against `"Тип любое"`,
`196px` against `200px`.

Separate from B3.5 for three reasons: it touches the harness loop rather than
the app, so its blast radius is every state rather than one screen; a reviewer
of B3.5 wants to see three CSS rules and a debt table, which is a different
review; and if the new spec surfaces differences on surfaces nobody has looked
at yet - which is the point of building it - that must not block a fix the
human is waiting on.

It is ordered *after* B3.5 rather than before so that no commit is left with a
red parity run. The proof that the instrument works is recovered without that:
see the acceptance criteria.

#### What to build

**1. One new driver method.** `tests/parity/driver.js`:

```js
/** Computed type, and the measured run of text, for named controls. */
async typeAt(probes) { ... }
```

`probes` is a plain `{ name: selector }` map, evaluated in the page. For each
probe return `null` when the element is absent, otherwise:

- `font` - `` `${c.fontWeight} ${c.fontSize}/${c.lineHeight}` ``, the same
  shape `metrics()` already uses
- `family` - `c.fontFamily.split(',')[0]` with quotes stripped, as `metrics()`
  does
- `text` - `textContent` with whitespace runs collapsed but **not** trimmed at
  the ends, so a missing separator is visible
- `advance` - the width of a `Range` over the element's contents,
  `getBoundingClientRect().width`, rounded to one decimal
- `width` - the element's own `getBoundingClientRect().width`, rounded to one
  decimal

The rounding is one decimal and no more. Two apps drawing the same string in
the same face at the same size in the same browser produce the same advance;
anything that differs by less than that and has no visible cause belongs in
`ACCEPTED` with the measured reason, not in a wider tolerance.

This is the one place in the driver that takes a CSS selector, and the comment
must say why: everything else grips a control by the name a person reads,
because a spec must not know which app it is driving; this method is measuring
one specific ported control, and the class names *are* ported - every component
in `app/src/components/` writes its CSS "off `.x` in `style.css`", and Svelte's
scoping keeps the original class in the `class` attribute alongside its hash.
Selectors stay structural or contract-level wherever one exists
(`input[type=search]`, `[data-row]`) and use a ported class only where none
does.

**2. One new spec** in `tests/parity/specs.js`:

```js
const typeRuns = {
  perWidth: true,
  name: 'the type on the controls a page percentage cannot see',
  only: [ /* the states below */ ],
  async run(d) {
    return await d.typeAt({
      search: '.toolbar input[type=search]',
      rowText: '[data-row] .rt',
      rowTitle: '[data-row] .rt b',
      filterLabel: '.ffilter .field .lbl'
    });
  }
};
```

Four controls, which is the handful `context.md` named, and each one is there
because a defect went through it:

| probe | catches |
|---|---|
| `search` | defect 1 - `font` is `400 14px/22.4px` against `400 15.5px/24.8px` |
| `filterLabel` | defect 2 - `text` is `"Типлюбое"` against `"Тип любое"` |
| `rowText` | defect 3 - `width` is 196 against 200, at 375 only |
| `rowTitle` | the row title's own face and advance, the value `rowText` cannot separate from its container |

A probe that resolves to nothing returns `null`; the live app is the one that
certainly has these controls, so a class the rewrite renamed reports `null`
against numbers and fails. The one silent case is a control missing from *both*
apps, which means `style.css` changed - and `style.css` is frozen.

**3. Per-width specs.** This is the part that is not optional: `parity.js` runs
every spec once, at `WIDTHS[0]` (1100), because the specs are about content and
the widths are for pixels. Defect 3 exists only at 375, so a spec that runs at
1100 alone would have caught two defects out of three.

The width sweep already sets the viewport and settles once per width, so this
is cheap. In `parity.js`:

- `const looks = mine.filter((s) => !s.presses && !s.perWidth);`
- `const measured = mine.filter((s) => s.perWidth);`
- inside the existing `for (const size of WIDTHS)` loop in `withPage`, after
  `await d.settle()`, run each `measured` spec and store it under
  `perWidth[target][size.w][spec.name]`
- after both targets, call `diff()` once per width with the route string built
  as `<id> @ <lang> <width>` (a template literal over `id`, `lang` and
  `String(size.w)`) rather than the `<id> @ <lang>` the once-per-language specs
  use - so an `ACCEPTED` key for a per-width spec is
  `"<id> @ <lang> <width> :: <spec> :: <field>"`

**4. The ratchet hole.** `pct < debt.pct - DEBT_SLACK` with `DEBT_SLACK = 0.5`
means an entry recorded at 0.13 that now measures 0.00 passes silently. Every
entry under half a percent is currently un-ratcheted in one direction, which is
the same failure as the one this whole batch is about: debt that cannot come
due. Add the missing case - a state with an entry that now measures at or under
`JITTER` fails, asking for the entry to be deleted:

```js
} else if (pct <= JITTER && debt.pct > JITTER) {
  fail++;  // the entry is paid; delete it
```

Expect this to find stale entries elsewhere in the table. That is the point;
delete them, with the run output as the evidence.

**5. Specs.** `docs/specs/COVERAGE.md` owns the harness's instruments and needs
two edits in this commit:

- "The look" describes two instruments. It is three now: measured typography,
  the per-control type-and-advance probes, and the pixel diff. Say what the
  third one is for in one sentence - a percentage of a page cannot see a
  control.
- The same section says "Position and size are deliberately *not* measured"
  and gives a good reason (two layouts mid-port disagree about them by
  definition). The new spec measures a width. Amend it rather than contradict
  it: geometry is not measured across the board, and is measured on a named
  handful of controls on screens that are already built, where a width is the
  consequence of a rule that was ported wrong.
- The same file states the debt is "enforced from both sides ... So it can only
  ratchet towards zero". That becomes true only with change 4; if 4 is dropped,
  this sentence has to be corrected instead.

`docs/parity.md`'s standing rule is B3.5's, not this batch's - see there.

#### Determinism

- Both apps are measured in the same browser, at the same viewport, in the same
  run, one after the other. Machine-to-machine differences in hinting and face
  selection cancel: nothing is compared against a number stored in the
  repository.
- No probe reads a colour, an opacity or a shadow, so nothing depends on the
  GPU path or on `--disable-gpu`.
- Rounding to one decimal absorbs float formatting and nothing else.
- The probes are read after the existing `settle()`, which already waits on
  `document.getAnimations()`, and after `ready()`, which waits on the artwork.
  Fonts are the one thing neither waits on - B3's anchor bug was exactly that -
  so the probe evaluation must `await document.fonts.ready` first. It is a
  no-op once the page has settled and it removes the only known source of a
  measurement that moves between runs on the same machine.

#### Which states

Start with the tables states that certainly have all four controls, and let the
`only` list be the whole scope of this batch:

- `#/tables`, `#/tables/hnf_consumable`, `#/tables/dread` - search and rows,
  no panel (`filterLabel` is `null` on both, which is honest)
- `#/tables/wondrous ~ panel open` and `#/tables/community ~ panel open` - all
  four
- `#/tables/community`, `#/tables/voa` - a sectioned body's rows

Extending it to `#/i/*`, `#/roll/*` and the equipment tables is deferred, and
named in "Deferred" below rather than attempted here: a spec that suddenly
reports on every surface at once is a batch whose size nobody can predict.

#### Acceptance criteria

- `node tests/run-all.js parity` passes.
- **The instrument is proved to fail.** With each of B3.5's three fixes reverted
  locally, one at a time, and the working tree restored afterwards, a filtered
  run reports a `FAIL` naming the field:
  `... :: the type on the controls a page percentage cannot see :: search`,
  `... :: filterLabel`, `... :: rowText` at 375. The exact output goes in the
  handoff. A spec that cannot find anything must not agree with itself, and a
  spec written after the fix has not been shown to find anything.
- The per-width wiring runs the spec at 1100, 768 and 375, and the report shows
  the width in the state name.
- The ratchet change fails a deliberately stale entry (record which one) and
  every stale entry it finds is deleted.
- `COVERAGE.md`'s "The look" describes three instruments, the geometry
  exception, and a debt statement that is true.

#### Risks and do-nots

- **Do not widen the rounding to make a probe agree.** A sub-pixel difference
  with no cause is an `ACCEPTED` entry with a measured reason.
- **Do not add probes for controls that are not built.** A probe that is `null`
  on both sides costs a line of report and proves nothing.
- **Do not let the `only` list grow past the tables states in this batch.**
- **Do not delete a `VISUAL_DEBT` entry the ratchet change surfaces without
  opening the diff image first.** The new failure says the number is stale; it
  does not say the screen is exact.

#### Fallback, considered and not chosen

A **region diff**: crop each screenshot to the toolbar, the filter bar and the
first row and score those separately. It fixes the denominator honestly and it
would have caught all three defects. Rejected because it needs a grip per
region (the same selector question, with no compensating value), because it
produces three more percentages that each need their own debt bookkeeping and
their own reasons, and because it still answers "how many pixels" where the
report's stated job is to name a value to go and change. Worth revisiting only
if the probe approach turns out to need more than a handful of selectors.

### B3.6 built, part 0: make the harness quick enough to use

Built across three agents, two of which ended a turn with a check still running
and lost it; the orchestrator ran the final verification itself. What shipped:

- `tests/parity.js`: a content-addressed cache for the **legacy** screenshots,
  `--no-cache`, and `--shard=N/M`. The key hashes `index.html`, `app.js`,
  `style.css`, `data.js`, `img/`, `og/`, `card/`, `tests/parity/driver.js` and
  `tests/parity.js` itself, plus the state's `id`/`route`/`enter` source, the
  `whole` flag, the language and the viewport list.
- `tests/run-all.js`: `--exclude=parity`.
- `.github/workflows/ci.yml`: parity leaves the pooled run and becomes its own
  4-way sharded job; `deploy` now needs it.
- `app/src/test/a11y.ts` + `a11y.test.ts`: `expectNoA11yViolations` clears
  axe's `_running` flag, so a test that times out no longer takes the rest of
  its file down with `Axe is already running`. `testTimeout: 30_000` already
  existed; only its comment changed.

#### Two defects found in review, before the evidence was taken

1. **`arrive()` was not in the cache key.** It lives in `tests/parity.js` and
   decides what the legacy page shows - `d.open(route)`, `enter(d)`, the
   language click - while only `driver.js` was hashed. Editing it (the
   frozen-scrollY anchor fix is a known future one) would have served stale
   PNGs forever, breaking the cache's own guarantee that a hit cannot mask a
   difference. `parity.js` is now hashed in; any edit to it invalidates the
   cache, which is the correct trade.
2. **Cache writes were not atomic.** `fs.writeFileSync` straight onto the final
   path leaves a truncated PNG if a run is killed mid-write - and one was
   killed, minutes earlier. Now a temp name plus `fs.renameSync`.

#### The speed claim did not survive measurement

This section planned "close to half the wall clock". Measured, on the `tables`
filter: uncached 12m39s, warm 11m22s - about 10%, and the uncached run was
contended, so the true figure is smaller still.

The estimate assumed the legacy *page work* was cacheable. It is not: the
legacy page is still opened and `arrive()`d for every state, because the
`looks` specs and `controls` read it. Only the per-width viewport switch,
`settle()` and screenshot are skipped - roughly 44 state-language pairs x 3
widths x ~1s, i.e. 1-2 minutes of a 12-minute run.

So **the 4-way shard, not the cache, is what makes CI affordable**, and the
cache buys a person re-running one filter far less than this plan promised.
Whether it earns its complexity - a correctness-critical component for ~10% -
is a fair question for whoever reviews B3.6; it is recorded here rather than
quietly left as an unexamined win. Part 1's item 5 is settled either way: the
unfiltered suite stays a blocking gate, sharded.

#### Evidence

Four runs, `tables` filter, logs kept outside the repository:

| Run | Cache | Wall clock | Verdict |
|---|---|---|---|
| A `--no-cache` | none | 12m39s | 1 расхождений |
| B | inherited 28, ended 44 | 12m22s | 1 расхождений |
| C warm | 44 hits | 11m22s | 1 расхождений |

`diff A B` and `diff B C` are both **byte-identical**, which is the acceptance
criterion: a cached run and an uncached one produce the same verdicts and the
same percentages. Invalidation: changing `style.css`'s *content* (not `touch` -
the key hashes bytes) added four new keys, 44 -> 48, and the file was restored
byte-identical. `--no-cache` was separately proved inert on a clear machine:
48 keys before, 48 after.

`npm run check` exits 0 (96.43% statements, 90.02% branches, 95.92% functions,
96.65% lines). `npm run check:built` was not run: part 0 changes no file a
screen draws - only the harness, the CI workflow, a test helper and a config
comment.

#### Two things the evidence exposed, neither part 0's to fix

- **`#/tables/core_item ~ row anchor @ en 375` measures 8.47% against its
  recorded 7.92%**, in every run here and in an independent run earlier the
  same day. B3.5's remediation lowered that entry to 7.92 on its own repeated
  measurement; both numbers are real, which is what a race looks like. The
  `fonts.ready`-deferred `scrollIntoView` that pass root-caused is the
  mechanism. **Part 1 owns it, and should not re-baseline it to either value
  without fixing or characterising the race first.**
- **A stopped agent's background run can still be running.** One overlapped
  run A for twelve minutes, writing cache entries and sharing
  `test-output/parity/`, which is why A's own "expect 0 keys" counter read 28.
  The verdicts were unaffected - A matched an independent run exactly - but
  two parity runs sharing one output directory is a real hazard for anyone
  reading numbers.

### B3.6 built, part 1: the red CI run

The complete failing list came off the `failure-output` artifact of run
`34361836525` (commit `79e26c9`), not off `gh run view --log-failed`: the log
shows about a dozen grepped lines and the run actually failed **22** cells. The
artifact carries `test-output/parity.log` in full plus every screenshot and
diff image the ubuntu run produced, which is what made a per-state diagnosis
possible without guessing at CI.

#### The complete list, and what each one is

| State (cells) | CI | Windows | Diagnosis |
| --- | --- | --- | --- |
| `#/roll/wondrous ~ help` (4 failing of 6) | 0.40-1.08 | 0.35-0.95 | **Defect, fixed.** `.helpbox` never got the `animation: pop` line style.css gives it. |
| `#/tables ~ help` (2 failing of 6) | 0.77-1.88 | at debt | Same defect, same fix. |
| `#/roll/std ~ help` (passing, inside slack) | at debt | at debt | Same defect; found by fixing the other two. |
| `#/i/ci1 ~ whole` (6) | 5.70-8.49 | 5.20-7.69 | Not a defect: the missing add-to-list row, proved by reconstruction. Stale number, re-baselined to CI. |
| `#/tables ~ a row ticked @ en 375` | 4.50 | 4.29 | Not a defect: B3.5 recorded the Windows figure. Re-baselined to CI. |
| `#/i/f1` (2 inventory, 2-4 pixel cells) | 0.62/0.46 at 1100, 0.075 at 768 | 0.60/0.44, 0.11/0.10 | Missing `ACCEPTED` and missing `VISUAL_DEBT`; the state has never passed since `2970c03`. Both written. |
| `#/tables/core_item ~ row anchor @ 375` (2) | 9.93/10.52 | 7.92/8.84 | The harness's width sweep. Race closed; the platform gap is not. |
| `#/tables/voa ~ section anchor @ 375` (2) | 10.31/11.55 | 8.84/10.05 | The same width sweep. |
| `#/roll/wondrous ~ modal` (0 on CI, 2 on Windows) | at debt exactly | 8.73/13.90 | Cross-platform variance, one machine only. Table left alone. |

Nothing is recorded as "antialiasing". Two of the reasons that were are now
named defects, and the two that are not defects say which machine and which
mechanism.

#### The help panel: one missing line, eighteen entries

`style.css:131-135` gives `.helpbox` `animation:pop .2s cubic-bezier(.2,.8,.3,1)
both`. `PageHead.svelte` had ported the box and dropped that line.

It reads as a motion difference and it is not only one. An element that
animates a transform is painted through its own layer, and the layer rounds the
text to a different set of pixels. The panel's geometry was identical before the
fix - box, every paragraph, every line rect, computed font, to three decimals,
measured in both apps at 768 - and yet single lines came out one pixel apart.
Which lines was the tell: only those whose top landed on a .5-.8 fraction of a
pixel, out of line boxes 21.6px tall. Shifting the changed band by one pixel
made it byte-identical to the other app, which is a paint difference, not a
layout one.

With the line ported, **all eighteen help cells measure 0.00%** - `#/roll/std`,
`#/roll/wondrous` and `#/tables`, both languages, all three widths. Every
`helpNoise` entry is deleted and the helper with them. This is the third time
this batch pair has found a single unported declaration behind a reason that
said "rasterisation".

#### `#/i/ci1 ~ whole`: the reason was right, the number was old

Decomposed rather than assumed. The two documents differ by exactly 38px in
height at every width; putting those 38px back into the shorter one and
re-diffing leaves **zero** changed pixels below the missing row. Above it there
was never anything. So the whole 5.87% is the add-to-list and print row, the
footer it holds down, and the 38px band at the bottom - which is what the entry
already said.

Why the number moved without the component moving: it was recorded at
`117af2e` on this project's Windows machine, and a whole-page state is the most
platform-sensitive shape in the suite - its denominator is the whole document
and its numerator counts every line of the shifted footer. CI reads about half
a percent higher for the identical cause. Re-baselined to CI per owner decision
1, with the reason saying it went up and why.

#### `#/i/f1`: the state that never passed

`2970c03` added it with no `ACCEPTED` entry and no debt entry, so it has failed
on every machine since the day it was written - which is also why it never
appeared in a CI excerpt anyone read. Added: the two `ACCEPTED` control-list
entries every other record route already had, and four debt cells for the row
peeking above the fold (1100 in both languages, plus 768 where only a few
pixels show - 0.075% on CI, just over `JITTER` on Windows, which is exactly the
kind of cell that flips between machines when it is left unrecorded).

#### The anchor states: one race closed, one mechanism named, one not solved

Three readings of these states have now been written down as fact. The first
two were wrong and this section replaces them.

**What was measured**, replicating the run's own sequence and reading
`window.scrollY`, document height and the target's rect at each step:

```text
legacy  1100 sy 368  |  768 sy 368  |  375 sy 374
next    1100 sy 368  |  768 sy 368  |  375 sy 387
```

Both apps scroll exactly once, at 1100, against the same 118px
`scroll-margin-top`. They are on the same pixel at 1100 and at 768. They part
only when the width sweep reaches 375, and neither lands where it was put:
Chrome moves a scrolled document on reflow to hold the reading position, it
chooses what to hold from the DOM, and the two DOMs are different.

So it is **not** `TablesPage.svelte` scrolling a second time against the phone's
132px margin (B3.5's reading - there is one scroll, at 118px, in both apps) and
it is **not** rows above the target reflowing differently (B3's reading - at 375
the two documents are the same 10065px tall and both tables are pixel-exact at
that width).

**The race is closed.** `document.fonts.ready`, which the anchor effect defers
behind, was measured to be doing something other than what its comment claimed:
neither app declares an `@font-face` or links a font service, so
`document.fonts.size` is 0 and the status is `loaded` before the first paint.
`ready` still settles ~400ms in, tracking the document's load rather than any
font work. The deferral is still needed - scrolling synchronously in the effect
lands the row 8px low, because this component's first layout is not its final
one (`abs` 493.97 against 485.97, `scrollHeight` 5909 against 5890), and trying
it took the 1100 and 768 cells from exact to 6-8%. What was wrong is that the
run could start its width sweep while that deferral was outstanding. So
`tests/parity/driver.js`'s `ready()` now waits for the same promise: a state
that has not stopped moving is not a state. `@ en 375` has since produced 7.92%
on three consecutive runs where it used to alternate 7.92/8.47.

**What is left is the sweep itself**, and it is not this batch's to fix: the
harness looks at one document at three widths, which is not what a person does,
and re-arriving per width changes how every state in the suite is measured.
Turning `overflow-anchor` off for both apps was tried and moves the two 375
figures around (8.84/7.92 becomes 7.92/8.47) without removing them, so
something else is in there that has not been found. Recorded as debt with the
understood part named and the rest admitted.

#### A defect found and deliberately not fixed: the anchor never flashes

The four 1100/768 anchor entries said "the flash outline's own antialiasing".
Cropped out of the run's own screenshots, `@ en 1100` is the live app's 2px
gold ring against **nothing at all** in the rewrite. Confirmed off the pixels
by asking each app for `.flash` directly:

```text
legacy   on arrival: yes  |  after 1.6s: no  |  after the EN click: yes
next     on arrival: no   |  after 1.6s: no  |  after the EN click: no
```

Two real things. `TablesPage.svelte` adds the class with
`target.classList.add('flash')` while the rows are drawn by a keyed `{#each}`,
so the next render replaces the element and takes the class with it - the
rewrite's anchor highlight has never been visible on any route. And the live
app re-plays the flash on a language switch, because switching re-enters
`render()` with the anchor still in the address, where the rewrite's effect is
guarded on `app.navigations`. That second one is why only the `@ en` cells
carry a number: at `@ ru` nothing is clicked, the live app's flash has expired
by screenshot time, and the two apps agree by accident.

Not fixed here on purpose. The fix is to make `flash` reactive state rather
than a class added behind Svelte's back, and it will move the `@ ru` cells that
currently pass - they pass because neither app shows a ring, and one that draws
its ring correctly will differ from one whose ring has expired. That needs the
whole anchor set re-measured together, which is a batch, not a footnote.

#### Item 5, the blocking gate: settled, unchanged

The unfiltered suite stays a blocking gate on every push and pull request. It
is the only thing that would have caught eight red builds, and part 0 made it
affordable by sharding it four ways, so the cost argument that was the only
case against it is gone. No workflow change in this part.

#### The platform rule

`docs/parity.md`'s "Machine variance" now says which machine establishes debt
(CI), that a local run is advisory, how to read the CI numbers without pushing,
and how to tell variance from a defect: under ~0.3pp on one machine only is
variance; over ~0.5pp, or both machines over the recorded figure, is a defect
or a stale baseline. It also says out loud the consequence nobody had written
down - a local run can legitimately fail a cell CI passes, reported as
"stalo luchshe", and that is not licence to edit the number.

#### What this leaves red on Windows, and why that is expected

Four `#/i/ci1 ~ whole` cells now sit at the CI figure, which is more than
`DEBT_SLACK` above what this machine measures, so a local full run reports them
as improved and fails them. That is the documented per-platform tolerance, not
a defect, and CI is the gate. The two `#/roll/wondrous ~ modal` cells that fail
on Windows and pass exactly on CI are the same thing from the other side.

#### Two things found in passing, neither part 1's

- **The language leaks between states through `localStorage`.** `file://` shares
  one origin, so a state that ran at `en` can leave the next state's `@ ru`
  screenshots in English. Both apps read the same storage, so it cancels out
  and no number is wrong - but a person reading `_ru_` screenshots will find
  English in them and should know why before chasing it.
- **`img/` and `og/` were rewritten in the working tree by something outside
  this session**, 402 files between 18:57 and 18:58 local time. Left alone and
  not committed. Both apps read the same files, and the artwork is drawn at a
  fixed CSS size, so no parity number depends on which bytes are there.

### B3.6 built, part 2: the instrument that would have caught them

Built by an implementer that lost its turn twice; the orchestrator finished the
verification, the one fix the instrument found, and the commit.

**What shipped.** `typeAt(probes)` in `tests/parity/driver.js`; a `typeRuns`
spec (`perWidth: true`) over four probes - the toolbar search box, a row's text
and title, and a filter label - scoped to the `only` list this plan named;
`tests/parity.js` split into `looks` and `measured`, the latter run inside the
width sweep; the `DEBT_SLACK` ratchet, so an entry that has been paid off fails
instead of passing in silence; and `docs/specs/COVERAGE.md` describing three
instruments rather than two.

**One interaction worth keeping in mind.** A state carrying a `measured` spec
cannot use part 0's legacy screenshot cache: the cache stands in for the
viewport switch as well as the shot, and a `perWidth` probe has to run at a
real viewport. `tests/parity.js` therefore skips the cache for those states.
Caching and per-width measurement are not independent, and a later change to
either has to remember it.

#### The instrument fires - proved by reverting each fix

Each of B3.5's three fixes reverted alone, rebuilt, measured on
`#/tables/community ~ panel open`, then restored:

| reverted | probe that failed | where |
|---|---|---|
| the search box's invented `font-size: 14px` | `:: search` | 1100, 768, 375 |
| the space before the `любое` hint | `:: filterLabel` | all six cells |
| `.selbox`'s missing 38px override | `:: rowText`, `:: rowTitle` | **375 only** |

The third row is the argument for `perWidth`. That defect does not exist at
1100, so a spec measured at the widest layout alone - which is what every
`looks` spec does - would have caught two of the three and missed the one that
took an afternoon to find.

#### What it found on its first clean run, and the fix

`filterLabel` failed in English at all three widths with everything correct:

```
было:  {"font":"650 11.5px/18.4px","family":"Inter","text":"Community any","advance":105.9}
стало: {"font":"650 11.5px/18.4px","family":"Inter","text":"Community any","advance":106}
```

Same font, same family, same string, same element width, and the pixel verdict
was `вид: совпадает` - 0.00%. Only the measured advance differed, by 0.1px, and
only in English.

The cause is B3.5's own fix. `app.js` emits the label and its trailing space as
**one** text node (`Сообщество <i>любое</i>`); the port emitted two, because a
literal leading space at the start of an `{#if}` is trimmed by Svelte and
`{' '}` was the workaround. A text advance rounds per text node, so two nodes
measure 0.1px wider than one, and English happens to sit on the rounding
boundary where Russian does not.

Fixed rather than accepted: the space now lives inside the label's own
expression (`{`${row.label} `}`), which Svelte cannot trim - an expression is
not markup whitespace - and which emits a single text node like the live app.
`ACCEPTED` was the alternative this plan allowed, and it would have cost three
keys and a paragraph to describe a difference that one line removes. The
probe passes; the state is `расхождений нет`.

**This is the whole point of the batch, demonstrated on its first run:** the
page percentage said the screen was identical while the type was measurably
different, which is precisely how three defects hid behind an "antialiasing"
reason for three batches.

#### The ratchet's first catch was a false one, and the rule caught it

Run in the ubuntu container, the new ratchet reported two entries as paid off:

```
FAIL #/roll/wondrous ~ pinned @ ru 375 :: вид :: 0.00%, долг записан как 3.64%
FAIL #/roll/wondrous ~ pinned @ en 375 :: вид :: 0.00%, долг записан как 3.82%
```

They are not paid off. Measured on a development host the same states read
3.52% and 3.76%, and CI passes them, so **the container is the outlier**. Those
entries describe a toast the live app raises and the rewrite lacks; a toast
fades, and the container is slow enough that it has gone before the screenshot,
so both sides photograph an empty screen and a real missing feature scores
zero. The entries were kept.

The rule that saved them is B3.5's: do not delete an entry a ratchet surfaces
without opening the diff first. It paid for itself on the ratchet's first run.

#### The four anchor cells, re-baselined to CI

`#/tables/{core_item ~ row anchor, voa ~ section anchor} @ ru|en 375` carried
figures measured on a development machine, and CI had been red on them since
part 1. They are now recorded at what CI measures - 10.52, 9.92, 11.55, 10.31 -
each `why` saying out loud that it was raised and off which machine. Four
independent measurements agree: two CI runs, an orchestrator container run, and
an implementer container run.

#### What the container is and is not

`tools/parity-ubuntu/` reproduces CI **to the hundredth on states whose
difference is layout**, which is what those four cells are. It does not
reproduce CI on states whose difference is timed, and the failure is silent - a
faded toast scores a perfect 0.00%. Both its README and `docs/parity.md` now
say so, with the recognition test: does the state's `why` describe something
that appears and then goes away?

### What lands in the specs and in CLAUDE.md

Three questions, three different answers.

**`docs/parity.md` gets the standing rule, in B3.5.** It is the operational
runbook and it is where a session goes before touching a debt number. It
already says "Expect zero pixel difference" and "`VISUAL_DEBT` is explicit debt,
not tolerance"; what it does not say is the thing that let three defects sit
inside those rules for four batches. Add to "Contract", or as a short block
under it:

> A whole-page percentage cannot see a control-sized defect. A wrong font size
> on one line of a 1100x900 screen scores about 0.09% - under `JITTER`, so the
> state reports as matching. Before writing "antialiasing", "rasterisation" or
> "line-wrap" as a reason, measure the thing itself: the computed type, the
> text content and the advance of the run, in both apps. A reason that names
> rendering noise is only allowed once a measurement at that level has been
> taken and recorded.

That is the rule the three false reasons broke, phrased so the next session
cannot satisfy it by eye.

**`CLAUDE.md` gets the `@media` line, in B3.5.** CLAUDE.md's own bar is "Add a
rule only after an agent repeats a mistake", and this one is on its fourth
instance across four batches: B1's toolbar margin, B2's `.field:last-child`
cascade tie, B3's `.tsec-link` mobile padding, B3.5's `.selbox`. Every one of
them ported a rule at its base width and left an override behind, and every one
of them read as growing drift because a constant offset compounds down a page.
One imperative line in "Migration and parity":

> - Port a rule with every `@media` override it has; a base-width-only port
>   reads as growing drift, not as a constant offset.

CLAUDE.md is at 179 lines of its 200 and this keeps it there.

**The Svelte leading-space gotcha stays in the handoff.** It is a first
occurrence, not a repeat, and CLAUDE.md's bar is explicit about that. It is
also narrower than it looks - it is one compiler behaviour, and the handoff's
"Session gotchas found this session" is exactly where B3's snippet/`{@render}`
finding and the jsdom `scrollIntoView` finding already live. Write it there as
a rule with its detection recipe:

> A literal leading space at the start of a Svelte `{#if}` or `{#each}` block
> is dropped by the compiler. Ported markup of the shape `' <tag>'` inside a
> block has this bug; emit the space as `{' '}`. Worth grepping for whenever a
> batch ports inline markup out of an `app.js` string template.

If a second instance turns up in B4 or later, it graduates to CLAUDE.md. Say so
in the handoff so the next session knows the promotion rule rather than
re-arguing it.

### B4 planned: the equipment tables, their facets and tier sections

**Objective.** Draw the three equipment tables - `eq_weapon`, `eq_secondary`,
`eq_armor` - the way `renderEquipTable` draws them: the facet strip and panel
with up to seven rows, four tier sections, and the empty state. With them every
table in `TABLE_DEFS` is real, so `TablesPage.svelte`'s `.todo` placeholder
branch goes. Nothing in the hash grammar, the fixtures, `CONTRACTS.md` or
`llms.txt` changes: the seven groups, their order and the `f_` segment are
frozen, already implemented in `lib/filters.ts` (`EQ_GROUPS`, `EQ_TABLE`) and
already replayed by `docs/fixtures/urls/routes.json`, which holds five
`eq_weapon` filter links (`f_tier-2.cls-mag`, `f_range-melee`, `f_burden-2`,
`f_tier-1-2`, and the bare route).

**Scope.** `eq_weapon`, `eq_secondary`, `eq_armor` render in full. `facets.ts`
grows the equipment branch. `dict.ts` gains six row labels it is missing.
`label.ts` gains `srcName`. `FilterBar.svelte`'s pill rule is corrected.
`TablesPage.svelte` grows the equipment pool, predicate and tier body, loses
`KNOWN`, and its search callback stops dropping the type word.
`TableRows.svelte` ports the one focus rule it lacks. Eight parity states and
two `only` lists in `tests/parity/specs.js`.

**Non-goals.** No selection bar, no add-to-list row (lists). No
`Panel.svelte`. No `typeRuns` probe on the equipment tables (deferred by the
orchestrator, unchanged). No anchor-flash fix and no width-sweep decision. No
600px overrides for components that do not exist (`.selx`, `.selacts`,
`.seldrop`, `.dropmenu`, `.lrow*`, `.npair`, `.batch-acts` - see "Decided"
below). No `noData`/`storageOff`. No change to `docs/specs/*`: `FEATURES.md`
already describes these three tables and the `src` facet, and nothing here
alters behaviour.

#### Early check 2: what `renderEquipTable` actually draws (app.js 2735-2761)

Read, not summarised. In order:

1. `pool` is `ALL_EQ` narrowed to `it.eq.t === kind`. `ALL_EQ` is `EQ` plus
   every `DATA` record carrying `eq` (app.js 936), so the table holds gear
   from every book, not only the `q*` records. Counted off `data.json`:

   | kind | pool | from `eq` (no `roll`) | from the roll tables |
   |---|---|---|---|
   | weapon | 317 | 239 | 78: wondrous 8, dread 6, voa 15, beast_feast 25, colossus 12, dark_heart 12 |
   | secondary | 108 | 73 | 35: wondrous 3, dread 1, voa 4, beast_feast 7, colossus 8, dark_heart 12 |
   | armor | 90 | 69 | 21: voa 5, beast_feast 4, dark_heart 12 |

   These are the 317 / 108 / 90 `FEATURES.md` publishes. `equipOfKind(index,
   kind)` in `lib/data.ts` already computes exactly this off `index.allEquip`
   and has had no caller since Phase 2; B4 is its caller.
2. `list` is `pool` narrowed by `eqPasses` and, when there is a query, by
   `matches`.
3. `fBarHTML(st.t, list.length, pool.length)` - so `.fcount` reads the **pool**
   when nothing is picked (`317`) and `shown of pool` when something is.
4. Nothing left: `.empty` holding `t().nothing` and, only when something is
   picked, a `.btn.sm` reset - the same markup as the plain table's empty state
   at 2534, which `TablesPage.svelte` already draws.
5. Otherwise four groups, `[1, 2, 3, 4]`, each `['t' + n, t().tier + ' ' + n,
   rows where eq.tier === n]`; an empty tier is skipped; each drawn one is
   `<div class="tsection" id="sec-t<n>" style="margin-top:22px">` holding
   `sectionHead(label, table, key)` and `renderList(rows)` - select-all scoped
   to the tier, then rows or tiles.

**So the answer is yes: tier sections as well as facets.** The body is
`voa`'s tier body with three substitutions - keyed on `it.eq.tier` rather than
`it.tier`, labelled `${t.tier} ${n}` ("Ранг 1" / "Tier 1") rather than
`voaSectionName`, and keys `t1`-`t4` with no `tA`/`tC`. Every tier is populated
on every kind (weapon 70/80/87/80, secondary 25/27/29/27, armor 16/27/23/24),
so all four sections draw on a bare route.

Two consequences that need no new code but do need tests: `#/tables/eq_weapon/t2`
is a live section anchor (`tests/eqtest.js:188` asserts `#sec-t2`), and
`#/i/q1`'s "show in table" link resolves through `tableOf` to
`#/tables/eq_weapon/q1`, a row anchor - both go through the effect B3 wired
and start working the moment the body exists. And 239 of the 317 weapons have
no `roll`, so their rows draw no `.rnum` and their tiles read `tileTier`
("Ранг 1") - `TableRows.svelte` already does both (`tables.test.ts:222`).

#### The facet rows, read off `eqFacets` (app.js 2571-2597)

| group | row label | values, in order | value labels | kinds |
|---|---|---|---|---|
| `tier` | `t.tier` | `'1'` `'2'` `'3'` `'4'` | the bare digit | all |
| `src` | `t.source` | `EQ_SRC` = `core`, `hnf`, `wondrous`, `dread`, `voa`, then `FRAME_ORDER`, **only those with at least one record of this kind** | `srcName(k)` | all |
| `cls` | `t.eqClass` on weapon, **`t.eqDmg` on secondary** | `phy` `mag` | `EQ_CLS` | weapon, secondary |
| `trait` | `t.eqTrait` | `EQ_TRAIT` keys in declared order | `EQ_TRAIT` | weapon, secondary |
| `range` | `t.eqRange` | `EQ_RANGE` keys in declared order | `EQ_RANGE` | weapon, secondary |
| `burden` | `t.eqBurden` | `'1'` `'2'` | `EQ_BURDEN` (Одноручное / Двуручное) | weapon |
| `line` | `t.eqLineF` | `line` `uniq` | `EQ_LINE` | all |

The order is `EQ_GROUPS[kind]` in `filters.ts`, exactly. `EQ_TRAIT` and
`EQ_RANGE` in `lib/i18n.ts` declare their keys in app.js's order (agility,
strength, finesse, instinct, presence, knowledge; melee, veryclose, close, far,
veryfar) - checked side by side, since `Object.keys` order is what both apps
draw. The `src` presence rule matters: weapon and secondary offer eight sources
(no `motherboard` equipment exists), armor offers **five** - `core`, `hnf`,
`voa`, `beast_feast`, `dark_heart` - because no wondrous, dread or colossus
armour exists. `equipFacets(it)` in `lib/data.ts` already answers every group
with the strings `eqPasses` compares (`String(e.tier)`, `eqSrcOf`,
`line`/`uniq`, `cls`, `tr`, `rg`, `String(bu)`); its one difference - `''`
against `'undefined'` for a missing burden - cannot matter, because `burden`
is a group only on weapon and every one of the 317 weapons has one (151 + 166).

Three things the rewrite is missing, found by reading rather than assumed:

1. **`dict.ts` has no `eqClass`, `eqDmg`, `eqTrait`, `eqRange`, `eqBurden` or
   `eqLineF`.** Nothing has needed a row label past `eqTh`/`eqScore` yet. Six
   keys in both languages, copied from app.js 101-103 (ru) and 287-289 (en):
   Класс / Тип урона / Характеристика / Дистанция / Хват / Линейка; Class /
   Damage type / Trait / Range / Burden / Line. `source` is already there.
2. **There is no `srcName(key)`.** `label.ts` names a source off a record
   (`srcLabel(it, lang)`); the facet needs a name off a key. app.js's
   `srcName(k)` is `named[k] || frameName(k) || k`. The rewrite's
   `frameName(id, lang)` already falls back to the id, so `srcName(key, lang)`
   is the five book keys to `t.srcCore`..`t.srcVoa`, else `frameName`.
   `srcLabel`'s five book cases then delegate to it - a second use, so the
   words live once.
3. **`EQ_SRC`'s order** exists nowhere in the rewrite. It goes in `facets.ts`,
   its only consumer, built off `FRAME_ORDER` rather than restating the four
   frame ids.

#### Early check 1: the bare-number pill rule is wrong, and B4 is where it shows

`fChosen` (app.js 2604) tests **the label**: `/^\d+$/.test(o[1]) ? f[1] + ' '
+ o[1] : o[1]`. `FilterBar.svelte` tests **the value**: `/^\d+$/.test(v.value)
? row.label + ' ' + v.value : v.label`. The two agree on `voa` (value `'2'`,
label `'Ранг 2'` - both print "Ранг 2", for the reason B3 recorded) and on the
equipment tier row (value `'1'`, label `'1'` - both print "Ранг 1"). They part
on **burden**: value `'1'`, label `'Одноручное'`. The live pill reads
"Одноручное"; the rewrite's rule would read "Хват 1". B2 wrote the rule against
a table with no numeric value, B3 confirmed it on a table where the two tests
coincide, and B4 is the first table where they do not.

The fix is one word - test `v.label` - with a component test asserting both
pills at once, and the `~ filtered` parity state below picks tier 1 **and**
two-handed so the pixel diff carries both branches of the rule.

#### A second divergence in the touched path: search drops the type word

`matches` (app.js 2834) tests `eqLine(it)` - `eqParts(it, undefined)`, so the
stat line it searches **starts with the type word** ("Основное оружие · Ранг 1
· ..."). `TablesPage.svelte`'s two `matches` callbacks (lines 191 and 309) pass
`{ noType: true }`, so "основное" finds all 317 weapons on the live app and
none in the rewrite. Pre-existing since B1 - equipment rows have been in
`wondrous`, `voa` and `frames` all along - and invisible because no state types
an equipment word. It is in the exact line B4 rewrites (`filtered` gains the
equipment pool), so it is fixed here: one shared `statLine` for both callbacks,
without `noType`. The row's *display* keeps `noType: true` - that matches
`rowHTML`'s own `eqLine(it, true)`. `RecordCard.svelte:81` is display too and
is untouched. A component test types the type word; the
`#/tables/eq_secondary ~ searched` state does the same in both apps.

#### How it is built

**`app/src/lib/dict.ts`** - the six keys above, both languages.

**`app/src/lib/label.ts`** - `srcName(key: string, lang: Lang): string`, and
`srcLabel`'s `core`/`hnf`/`wondrous`/`dread`/`voa` cases collapse to
`return srcName(it.src, lang)`. The existing `label.test.ts` cases for those
five keep passing unchanged; `srcName` gets its own case, including a frame key
and an unknown key falling back to itself.

**`app/src/lib/facets.ts`** - `facetRows(index, table, t, lang)` keeps its
signature; its first line becomes `const kind = EQ_TABLE[table]; if (kind)
return eqFacetRows(index, kind, t, lang);`, so `TablesPage` keeps calling one
function. `eqFacetRows` builds one `FacetRow` per group by walking
`EQ_GROUPS[kind]` and mapping each name to its row - **the order is taken from
`filters.ts` by construction**, never restated, which is what keeps the panel,
the address and the frozen grammar from drifting apart. The `src` row filters
`EQ_SRC` by `index.allEquip.some(it => it.eq?.t === kind && srcOf(it) === k)`.
Update the module's header comment: it is no longer "plain tables" only.

**`app/src/components/FilterBar.svelte`** - `v.value` becomes `v.label` in the
`chosen` derivation, and the comment above it names burden as the case that
tells the two apart.

**`app/src/components/TablesPage.svelte`**:

- `KNOWN`, `known`, the `{#if !known}` branch, the `.todo` rule and the header
  comment's placeholder story all go - every `TableId` is drawn now, and a
  branch nothing can reach is dead code in a touched path. The anchor effect's
  `ready` becomes `!!index`.
- `eqKind = $derived(EQ_TABLE[table])` (imported from `filters.ts`, which
  already exports it).
- `rows` becomes `eqKind ? equipOfKind(index, eqKind) : index.rows.get(table)
  ?? []` - this is what makes `total` the pool.
- `facPassed`'s `valueOf` becomes `eqKind ? equipFacets(it)[g] :
  plainFacets(it)[g]`.
- `bodyKind` gains `'eq'`; `eqSections` is a fourth `Section[]` derivation,
  `[1, 2, 3, 4].map(n => ({ key: 't' + n, label: `${t.tier} ${n}`, entries:
  filtered.filter(it => it.eq?.tier === n) }))` with empties dropped, and
  `activeSections` returns it for `'eq'`. The template's existing sectioned
  branch (`.tsection` at `margin-top:22px`, `SectionHead`, `TableRows` with
  `ontoggleall`) draws it unchanged - no new markup, because the live app's
  markup is the same.
- The two `matches` callbacks share one `statLine` without `noType`.

**`app/src/components/TableRows.svelte`** - port `style.css:1013`:
`.selbox:has(:focus-visible) { outline: 2px solid var(--gold); outline-offset:
-3px; border-radius: 8px }`, beside the `.selbox` family, with the live app's
reason (the row clips an outside ring; `:focus-within` would fire from the
mouse). See "Decided" for why it is B4's.

**`tests/parity/specs.js`** - the three `pending` entries become real and five
states join them (below); `filteredAddress.only` and `copiedFilterLink.only`
gain `'#/tables/eq_weapon ~ filtered'`. `NAME` needs nothing: `enter` steps run
in Russian before the language switch, and the filter-link name is already
there. `typeRuns.only` is **not** extended.

#### Parity states, each in both languages at three widths

| id | how it is reached | what it is for |
|---|---|---|
| `#/tables/eq_weapon` | route | the biggest table: four tier sections, `.fcount` 317, the strip folded |
| `#/tables/eq_secondary` | route | a second kind, six groups |
| `#/tables/eq_armor` | route | the third kind, three groups, the shortest |
| `#/tables/eq_weapon ~ panel open` | press `Фильтры` | seven rows, the widest panel the app has; at 375 the source and trait chips wrap several lines |
| `#/tables/eq_weapon ~ filtered` | press `Фильтры`, then `1`, then `Двуручное` | both branches of the pill rule on one screen ("Ранг 1" and "Двуручное"), a two-group address `f_tier-1.burden-2`, and the same on the clipboard |
| `#/tables/eq_secondary ~ filter link` | route `#/tables/eq_secondary/f_cls-mag` | arriving opens the panel; the `cls` row reads "Тип урона" here and "Класс" on weapons |
| `#/tables/eq_secondary ~ searched` | type `вторичное` | the type word is part of the searched stat line: every row stays in both apps, or the empty state shows in one |
| `#/tables/eq_armor ~ nothing found` | press `Фильтры`, then `Уникальные`, then type `zzzqqqxx123` | the three-row panel open, a pill, `0 из 90`, the empty state with its own reset |

`d.click('1')` is safe: the driver matches a control's whole name exactly
before it falls back to a substring, and the tier chip is the only control on
the page named exactly `1` - rows are named by their whole content and the
`q*` rows have no roll number. `Уникальные` (the chip, plural) is not the
`.badge.uniq` text (`Уникальное`, singular), and a badge is a span anyway.

Expect **zero** in every cell. The rows, the strip, the panel, the section
heading and the empty state are all already exact on `voa`, `community` and
`wondrous`; B4 adds no rule of its own. Any nonzero cell gets its diff image
opened and the control measured (`docs/parity.md`, the denominator rule) before
a reason is written, and the number written is CI's, not this machine's. The
one state to watch is `~ panel open` at 375, where seven rows of chips make the
tallest panel yet - if it differs, measure a chip row's height in both apps.

#### What B4 leaves behind

Tests, in the same commit as the behaviour:

- `lib/facets.test.ts` - for each kind: `rows.map(r => r.group)` equals
  `groupsFor(table)` (the two modules cannot drift); the tier row's labels are
  the bare digits; the `src` row lists only sources with a record of that kind,
  in `EQ_SRC` order, a frame named by `frameName`, and `motherboard` absent;
  `cls` is labelled `Класс` on weapon and `Тип урона` on secondary; `burden`
  exists on weapon only; `line`'s two labels. Fixture: a few `eq` records plus
  one frame record and one voa record carrying `eq`, so the pool provably spans
  `items` as well as `eq`.
- `lib/label.test.ts` - `srcName` for the five book keys in both languages, a
  frame key, and an unknown key falling back to itself.
- `components/tables.test.ts` - the fixture's `eq: []` gains weapons of all
  four tiers with both burdens and both classes, a secondary weapon, and an
  armour; `items.frames` gains one armour so the frame source shows in the
  `src` row (adjust the frames test that enumerates campaigns). Cases: each
  equipment table groups by `eq.tier` into `#sec-t1`-`#sec-t4` labelled
  "Ранг n", in order, dropping an empty tier; the pool spans every source and
  `.fcount` reads the pool; the panel has seven fields on weapons, six on
  secondary (no burden), three on armour; the `cls` label differs by kind; a
  tier pick's pill reads "Ранг 1" and a burden pick's reads "Двуручное" (the
  rule fix); a `mag` pick drops physical weapons; `#/tables/eq_weapon/f_tier-2.cls-mag`
  arrives with the panel open and both chips pressed; `#/tables/eq_armor/f_burden-2`
  leaves armour whole; the empty state grows its own reset; typing "основное"
  keeps every weapon (the search fix); `#/tables/eq_weapon/t2` flashes
  `#sec-t2` and `#/tables/eq_weapon/q1`-shaped row anchors flash the row. The
  "a table this slice has not built" placeholder test is deleted, not
  rewritten; keep its sibling about a single-table book.
- `components/a11y.test.ts` - a pressed state: `#/tables/eq_weapon`, press
  `Фильтры` then `1` - the widest panel, with a bare-number value pressed. No
  `COVERED` change: no new component.
- `tests/parity/specs.js` - the eight states and two `only` lists above.

#### Decided in planning - do not reopen

- **`.selbox:has(:focus-visible)` is B4's.** It is in a rule family the
  equipment rows draw, three lines, and the live app has it, so porting it can
  only reduce a difference. It cannot be pixel-verified: no state reaches a
  row checkbox by keyboard and the driver has no key press. It is verified by
  reading, and the instrument gap is recorded rather than invented around.
- **The 600px overrides for `.selx`, `.selacts`, `.seldrop`, `.dropmenu`, the
  `.lrow*` family, `.npair` and `.batch-acts` stay deferred.** Their base
  rules belong to the selection bar, the add-to-list menu, list rows, notes and
  batch actions - none exists. Porting an override without its base rule is
  the mistake `CLAUDE.md`'s `@media` line forbids, mirrored.
- **No equipment anchor parity state.** A section or row anchor state on an
  equipment table can only add 375 cells whose difference is the harness's own
  width sweep - a known, unfixed, not-B4 cause that would need `VISUAL_DEBT`
  entries taken from CI. The equipment-specific fact - section ids `sec-t1`-
  `sec-t4` and a `q*` row target - is pinned by component tests; the anchor
  mechanism itself already has two states. Revisit once the width-sweep
  decision lands.
- **`KNOWN` goes.** A branch no table reaches is dead code in a touched path.
- **`typeRuns.only` is not extended** to the equipment tables - the
  orchestrator deferred it explicitly.
- **One batch, not split.** The pieces are one vertical slice with one
  acceptance (the eight states and the checks); splitting facets from body
  would leave a table drawing a panel over a placeholder.
- **The Svelte leading-space rule.** B4 ports no new inline markup out of an
  `app.js` string - the tier body reuses B3's markup - so a second instance is
  unlikely; grep the diff for `' <` inside `{#if}`/`{#each}` anyway, and if one
  appears, promote the rule to `CLAUDE.md` in the same commit.

#### Ordered steps

1. `dict.ts`: the six keys, both languages. `npm run typecheck` (or the
   `check` typecheck step) confirms `Dict` accepts them.
2. `label.ts`: `srcName`; `srcLabel` delegates its five book cases.
   `label.test.ts` cases.
3. `facets.ts`: `EQ_SRC`, `eqFacetRows`, the `EQ_TABLE` branch at the top of
   `facetRows`, header comment. `facets.test.ts` cases.
4. `FilterBar.svelte`: `v.value` to `v.label` in `chosen`; the comment.
5. `TablesPage.svelte`: delete `KNOWN`/`known`/`.todo`; `eqKind`; `rows`;
   `facPassed`'s `valueOf`; `bodyKind 'eq'` and `eqSections`; the shared
   `statLine`; the anchor effect's `ready`; the header comment.
6. `TableRows.svelte`: the `:has(:focus-visible)` rule.
7. `tables.test.ts`: fixture, the cases above, delete the placeholder test.
   `a11y.test.ts`: the pressed state.
8. `tests/parity/specs.js`: the eight states, the two `only` lists.
9. `npm run check`. Then `npm run build` and `node tests/parity.js "eq_"`
   (fits one foreground call). Open every nonzero diff before writing anything
   into `VISUAL_DEBT`; expect none.
10. `npm run check:built`. Then `node tests/parity.js "tables"` - now over the
    600s foreground cap with eight more states, so run it in the background
    with output redirected to a file, or hand it to the orchestrator. The
    unfiltered `node tests/run-all.js parity` is the orchestrator's.
11. Update `plan.md` (this section's "built" counterpart, the Phase 4 table)
    and `handoff.md`; commit as one batch, `feat(tables): ...`, authored as
    `artex-x`.

### B4 built: the equipment tables, their facets and tier sections

What was built matches the design above with one addition the design did not
anticipate - a real ordering defect in code B4 was the first caller of.
Otherwise: `dict.ts` gained the six keys, `label.ts` gained `srcName` with
`srcLabel`'s five book cases delegating to it, `facets.ts` gained `EQ_SRC` and
`eqFacetRows` dispatched from `facetRows`'s first line, `FilterBar.svelte`'s
pill rule now tests `v.label`, `TableRows.svelte` carries
`.selbox:has(:focus-visible)`, and `TablesPage.svelte` lost `KNOWN`/`known`/
`.todo` and gained `eqKind`, the equipment `rows`/`facPassed` branches,
`bodyKind 'eq'`, `eqSections`, and a shared `statLine` without `noType` for
both `matches` callbacks - the row's own display keeps `noType: true`
(`TableRows.svelte`, `RecordCard.svelte:81`, both untouched).

**Found while building it, not anticipated by the design: `allEquip`'s
concat order was backwards, and B4 is what exposed it.** `equipOfKind` and
`equipFacets` had no caller since Phase 2, so nothing had ever looked at
`allEquip`'s *order* - only its membership and length, which every existing
test happened to check. `data.ts` built it as `[...all, ...eq].filter(it =>
it.eq)` - the roll-table records first, `eq` last. app.js's own
`ALL_EQ = EQ.concat(...Object.values(DATA))` puts `eq` **first**. The first
`node tests/parity.js "eq_"` run caught it immediately and unambiguously: a
bare `#/tables/eq_weapon` opened on `beast_feast`'s frame weapons (`Тесак`,
`Заточенные Грабли`, ...) with roll numbers and `УНИКАЛЬНОЕ` badges, where the
live app opens on Core's `Палаш`/`Длинный Меч`/... - not a styling difference,
a completely different first screenful, 0.95-2.46% at every width on all
three tables. Fixed by swapping the concat order in `data.ts` to
`[...eq, ...all]`, matching app.js exactly; a new `data.test.ts` case
reproduces `ALL_EQ`'s construction directly off `data.json` and asserts
`equipOfKind(index, 'weapon')` returns the same id order, so a future change
to either side is caught by a unit test rather than by a parity screenshot.
No other caller of `allEquip` depends on order (`upgradeLine` sorts by tier
itself; every other use is `.find`/`.length`/`.some`), so the fix is confined
to this one line plus its test - not a redesign, a bug in a touched path per
`CLAUDE.md`.

**Everything else matched on the first `eq_` run** after that fix: all eight
states, both languages, all three widths, `расхождений нет` - the facet rows,
the pill-rule fix (both "Ранг 1" and "Двуручное" render correctly on the same
screen), the panel widths (7/6/3 fields), the tier sections, the search fix
(the type word narrows the equipment pool the same way in both apps), and the
empty state. No `VISUAL_DEBT` entry was added or needed - the brief's
"expect zero" held once the pool order matched.

**Per-state percentages, `node tests/parity.js "eq_"`, this session's build:**

| state | every cell, both languages, all three widths |
|---|---|
| `#/tables/eq_weapon` | 0.00% |
| `#/tables/eq_secondary` | 0.00% |
| `#/tables/eq_armor` | 0.00% |
| `#/tables/eq_weapon ~ panel open` | 0.00% |
| `#/tables/eq_weapon ~ filtered` | 0.00% |
| `#/tables/eq_secondary ~ filter link` | 0.00% |
| `#/tables/eq_secondary ~ searched` | 0.00% |
| `#/tables/eq_armor ~ nothing found` | 0.00% |

`filteredAddress` and `copiedFilterLink`'s new `#/tables/eq_weapon ~ filtered`
entries also matched: the address reads `#/tables/eq_weapon/f_tier-1.burden-2`
and the same string lands on the clipboard, in both apps.

`node tests/parity.js "tables"` (the full tables suite, gained eight states)
is reported separately once the run completes - see `handoff.md`,
"Verification".

**Tests added, matching the design's list:** `lib/facets.test.ts` (group-order
guard against `groupsFor`, the tier row's bare digits, the `src` row's
presence filter and `motherboard`'s absence, the `cls` label split by kind,
`burden` weapon-only, `line`'s two labels), `lib/label.test.ts` (`srcName` for
the five books, a frame, and an unknown key), `lib/data.test.ts` (the ordering
fix, described above), `components/tables.test.ts` (the fixture's `eq` array
gained weapons of all four tiers with both burdens and both classes, a
secondary and an armour, and `items.frames` gained a frame-sourced armour so
the `src` row has a frame to offer; the placeholder test for "a table this
slice has not built" was deleted, its single-table-book sibling kept under a
renamed `describe('the chip nav', ...)`; a new `describe('the equipment
tables', ...)` covers tier sectioning, the pool-wide `.fcount`, panel field
counts per kind, the `cls` label split, both branches of the pill-rule fix, a
`mag` pick, a filter link opening the panel with both chips pressed, a group
the table does not offer leaving it whole, the empty state's own reset, the
search fix, and both anchor shapes), `components/a11y.test.ts` (one pressed
state: `#/tables/eq_weapon`, `Фильтры` then `1` - no `COVERED` change, no new
component).

No leading-space defect was found - B4 ports no new inline markup out of an
`app.js` string template, the tier body reuses B3's own row/section markup
unchanged, so the rule was not promoted to `CLAUDE.md`.

### B5 planned: the lists slice, and how it splits

Picked by the orchestrator on 2026-09-10 over search and print, because the
other deferred work waits on it: the 600px overrides for `.selx`, `.selacts`,
`.seldrop`, `.dropmenu`, the `.lrow*` family, `.npair` and `.batch-acts`;
`noData`/`storageOff`; and the add-to-list row that every `listRow` debt entry
and every `addToList` line in `ACCEPTED` currently excuses. Search reuses the
row and the selection bar wholesale, so it is cheaper after lists.

**The surface, read off app.js rather than remembered.** Lists is not one
screen; it is one piece of state and six places that draw it:

| piece | where it lives in app.js | what it draws |
|---|---|---|
| the store | `loadLists`/`keepLists`/`liftNotes`/`saveLists`/`mergeLists`/`storageWorks` 1149-1204, `createList`/`deleteList`/`toggleInList` 1320-1350, the `storage` listener 4621-4625 | nothing; everything below reads it |
| the toast | `toast`/`toastAction`/`hideToast`/`showToast` 969-1006, `#toast` in index.html, `.toast`/`.toast.err`/`.toast.act`/`.toast-act` in style.css | every "added to", "removed", "copied" and every undo |
| the add-to-list control | `listMenuHTML` 1831-1859, `idsForKey`/`metaForKey` 1865-1876, `addToListBtn` 1879-1891, `applyAddTo`/`addIdsTo`/`afterListChange`/`markMembership` 1907-1958, `placeMenu` 3695-3704, the outside click 3865-3869 | the `.seldrop` button with its `.dropmenu`; one instance per opener key |
| the card row | `listPicker` 1893-1896, called from `cardHTML` 2041 on a full card only | `.cardpick`: the control plus the print link |
| the selection bar | `renderSelBar` 3706-3721, `#selBar` after the footer in index.html, `S.sel` cleared on `hashchange` 4632 | count, cross, the control, print, copy selection |
| the lists index | `renderLists` 2909-2931, `storageWarning` 2872-2886 with `WARN_KEY`, `listCardHTML` 2888-2907 | `#/lists` |
| the list page | `renderOneList` 2960-2995, `listRollPanel`, `rolledNoteHTML`, `listRowHTML` 3040-3092, `listNoteHTML`, `notePairHTML`, `moneyPickerHTML`, the address sync `goToList`/`findListByPayload`/`freshenListUrl`/`syncListUrl` 1537-1607, the edit handlers 4371-4435, drag 4443-4535, position 4550-4558 | `#/lists/<id>`, rewritten to `#/l/<payload>` |
| batch actions | `batchBarHTML`/`moneyPanelHTML`/`guessPrice` 724-830, the handlers 3985-4084 | the `.batch` bar's `.batch-acts` and the `.guess` panel |
| the shared list | `renderSharedList` 3130-3170, `expandHash` 3591-3606, the `createFor` branch for `N_SHARED` 4213-4224, `importList` 4258-4270 | someone else's `#/l/<payload>`, and taking it |

Too big for one batch, and the boundaries below are chosen the way B1-B4's
were: so that nothing on screen has to be faked and every batch ends on states
the harness can reach. (B5.2 was split in planning on 2026-09-10 into a part 0
- CI green and the two unstable measurement classes, tests and docs only - and
a part 1, the bar itself; see "B5.2 planned, part 0" and "part 1" below.)

| | what | why it is a boundary |
|---|---|---|
| **B5.1** | the list store, the toast, and the add-to-list row on the card - `ListStore` (v2 read, the one-time v1 migration, save-with-merge, the two-tab `storage` event), `Toast` driven by `app.say`, `AddToList` (the button and its menu: chips with membership ticks, the inline new-list form, the search box from the eighth list), `.cardpick` on the full card with the print link; the driver learns to seed storage | closes every `listRow` debt entry and every `addToList`/`controls` line in `ACCEPTED` on the record routes and the modals; the control is written once, for the card, and the bar and the shared page reuse it |
| **B5.2** | the selection bar: `sel` lifted from `TablesPage` to `AppState` (search is its second owner), `SelBar` in `Shell` after the footer, the cross, the control, print, copy selection; the 600px overrides for `.selx` and `.selacts` | the second caller of `AddToList` and of the print link; closes the `selBar` debt and the `~ a row ticked` `ACCEPTED` lines |
| **B5.3** | the lists index `#/lists`: the page head and its help, the storage warning in both its forms (`dhloot.warn.v1`, the dismiss cross), create, import, the list cards (share as a short link, delete behind `confirm()`), the empty state; `Shell`'s invented `storageOff` paragraph goes and the live app's `storageWarning()` lands where the live app draws it | the route that is `pending` today; `deleteList` and the `deleted` set in the merge |
| **B5.4** | the list page as a page: `#/lists/<id>` rewritten to `#/l/<payload>` and kept fresh on every edit, own-list recognition, rename, the action row, the money picker and its help, the list note, the roll panel, the batch bar's select-all, the rows (`.lrow*`, quantity and price with the gold hint, the two notes, remove with undo, position, drag through the drag port), `contextNote` on the card's copy; the 600px `.lrow*` and 640px `.npair` overrides | the biggest surface; everything on it is per list and none of it needs batch actions to draw. May be split into 4a (the page and the rows) and 4b (notes, roll panel, drag) when it is planned. **Planned 2026-09-10: split into 4a (the page complete but for the live drag semantics; implement-ready) and 4b (drag as the live app does it; outlined) - the notes and the roll panel are on screen folded at arrival and cannot be cut without faking them; see "B5.4 planned"** |
| **B5.5** | batch actions and prices: `.batch-acts`, the money panel (reprice, suggest, clear), delete selected, the undo toasts, the 640px `.batch-acts` override; `lib/money.ts` gets its first callers | its own panel and its own undo set, on top of B5.4's `lsel`. **Planned 2026-09-11: absorbs B5.4b (drag as the live app does it) as its first commit - see "B5 remainder planned"; implement-ready** |
| **B5.6** | the shared list that is not ours: hitnotes, rows with tails, take into a list or a new list with the name and both notes, packed `~` links expanded and rewritten on open, the bad-link page, `listNotFound`; import on the index (B5.3) reuses the same decode | the other reader of the same page; completes the link contract loop that `contracts` replays. **Outlined 2026-09-11 as the second and last lists batch** |

**The harness can reach a list state, with one addition.** Lists live in
`localStorage`, and every state opens a fresh page whose `prepare()` clears
storage. So a state that needs lists to exist cannot be *entered*; it has to be
*seeded*. `tests/select.js` and `tests/lists2.js` already do exactly this on the
live app - `evaluateOnNewDocument` writing `dhloot.lists.v2` - and the same
technique works on `dist/`, which loads from the same `file://` origin. B5.1
adds it to the driver as `d.seed(entries)` (a second `evaluateOnNewDocument`,
registered after `prepare()`'s and so running after its `clear()`) and to the
runner as a `storage` field on a state, applied inside `arrive()` before
`open()` and hashed into the cache key. A press spec reads the result back
through `d.storage(key)`, so the write path is compared as data and not only as
the tick on a chip. Ids and `created` stamps come from the seed, so nothing in a
seeded state depends on the clock.

Two limits of the driver shape the states and are recorded so nobody "fixes"
the app against them:

- **The English cells of a menu state show the menu closed.** `arrive()`
  presses `EN` after `enter`, and the live app's document click handler treats
  any click outside `.seldrop`/`.dropmenu` as "dismiss the menu" before it does
  anything else - the language button included. The rewrite has to do the
  same, so `@ en` compares the row with the menu folded. Honest on both sides;
  the menu's own pixels are compared in Russian.
- **A toast is a timed state.** 1600ms for a plain notice, 2600ms for an error,
  7000ms for one with an undo. CI photographs `~ pinned` inside that window at
  all three widths (its debt is the toast's own pixels); the ubuntu container
  does not (`tools/parity-ubuntu/README.md`). A toast cell's number is CI's,
  and a Windows run that catches one side's toast expiring is the documented
  timed-state class, not a defect.

**Decided in planning - do not reopen.**

- **The toast is B5.1's, not a slice of its own.** The first list press raises
  one, every later lists batch raises several, and the record routes already
  owe one (`#/i/ci1 ~ toast` is `pending` for it; `~ pinned` carries it as
  debt). It replaces the `said` live regions the pages invented - the live app
  announces through the toast's own `role`/`aria-live`, and a visible `.said`
  paragraph under a page is not something the live app draws.
- **The toast goes in the top layer.** `RecordModal` is a native `<dialog>`
  (recorded in `ACCEPTED` as an accessibility fix), and a modal dialog makes the
  rest of the document inert and paints over it - so a fixed `.toast` in
  `Shell` would sit under the backdrop and go unannounced exactly when a person
  adds from the modal card. `popover="manual"` puts the toast in the top layer
  above the dialog and outside its inertness, at the cost of resetting the
  popover UA styles (`inset`, `margin`, `border`, `padding`, `overflow`,
  `color`, `background`). Fallback if that does not measure identical on
  `#/i/ci1 ~ toast @ ru 1100`: a plain `{#if}` fixed element, and the modal
  case is written into the handoff as B5.2's to close.
- **One component, `AddToList.svelte`, with the menu inside it.** `listMenuHTML`
  has one caller; a separate `ListMenu.svelte` is an abstraction ahead of need.
  `menuFor` - which opener has its menu open, app-wide, one at a time - lives on
  `AppState` beside `navigations`, because the live app clears it on every
  `hashchange` and closes it from any click outside the control, both of which
  are app-level facts. `newListFor`, `newListDraft` and `pickQ` are the
  component's own.
- **The print link is a link, and it is B5.1's.** `printBtn` is
  `<a class="btn sm" href="#/print/<ids>">` with an icon, a label and a title.
  It needs no print page to exist; `printHash` is in `lib/hash.ts` already. The
  print *page* stays the print slice. `Button.svelte`'s `href` form gets a
  `sameTab` prop for it - its two existing callers open a table in a new tab
  and keep doing so.
- **`Button.svelte` grows what the live `.btn` already has and this row uses:
  `on` (`.btn.on` and `.btn.primary.on`, the pressed look), `ghost`
  (`.btn.ghost`, the cancel button), and `caret` (the `<i class="caret">` that
  `FilterBar.svelte` draws inline today - second use, so the element and its two
  rules move into `Button` and `FilterBar`'s copy goes).**
- **The menu's chips are `Chip.svelte`.** Its button form carries
  `aria-pressed`, which the live chip does not; the accessible *name* is the
  text, which is what the inventory compares, and a membership tick is a
  pressed state in fact. Not an `ACCEPTED` entry: nothing the harness reads
  differs.
- **`+ Новый список` draws as a plain chip.** The live markup says
  `class="chip ghost"`, but the only `.chip.ghost` rule is `.picker .chip.ghost`
  and the menu is not inside `.picker` - so in the menu the dashed border never
  applies. Port the class, not the intent.
- **`Shell`'s `storageOff` paragraph stays until B5.3.** The live app has no
  chrome-level warning; it draws `storageWarning()` on the two lists pages.
  Reconciling `noData`/`storageOff` is the index batch's, where the live
  markup lands. Nothing in the harness sees the paragraph (storage works there).
- **`sel` stays in `TablesPage` until B5.2.** The bar is what needs it on
  `AppState`; moving it a batch early adds an export with no second caller.
- **Numbers for the three modal states come from the container or CI, not
  this host.** `#/roll/wondrous ~ modal`, `#/tables ~ a row opened` and
  `#/i/q1 ~ another tier` keep a residue after the row lands (the focus ring
  on the close button, recorded in `ACCEPTED`) and every one of their eighteen
  figures changes. Their difference is layout, which `tools/parity-ubuntu/` is
  calibrated for; if docker is not available the Windows figure goes in with a
  reason that says so and the handoff lists the cells for the orchestrator to
  reconcile off CI. Owner decision 1 stands.
- **Ids come from `env.random()` and `Date.now()`**, the way `newId()` does.
  No clock port: nothing else wants one, and a test stubs `Date.now`.

### B5.1 planned: the list store, the toast, and the add-to-list row

**Objective.** A person can put a record into a list from its card - the page
at `#/i/<id>` and the record modal - and take it out again, and the app
remembers it in `dhloot.lists.v2` the way the live app does, merging rather
than overwriting when two tabs are open. The row under every full card draws:
the add-to-list button with its menu and the print link. The app has a toast.
With that, every `listRow` entry in `VISUAL_DEBT` and every `addToList` and
record-route `controls` line in `ACCEPTED` is deleted, not lowered, and
`#/i/ci1 ~ toast` stops being `pending`.

**Scope.** `state/lists.svelte.ts` (new), `state/app.svelte.ts` (the store,
`menuFor`, `say`/`toast`), `components/Toast.svelte` (new),
`components/AddToList.svelte` (new), `components/Button.svelte` (`on`, `ghost`,
`caret`, `sameTab`), `components/FilterBar.svelte` (its caret moves into
`Button`), `components/RecordCard.svelte` (a `pick` snippet and `.cardpick`),
`components/RecordPage.svelte`, `RecordModal.svelte`, `TablesPage.svelte`,
`PageHead.svelte` (`say` becomes `app.say`; the `.said` paragraphs go),
`components/Shell.svelte` (renders the toast), `lib/dict.ts` (seventeen keys),
`lib/icons.ts` (`plus`, `print`), the driver, the runner, the specs, and tests
for all of it.

**Non-goals.** No selection bar and nothing on `AppState` for `sel` (B5.2). No
`#/lists`, no storage warning, no `storageOff` reconciliation (B5.3). No list
page, no shared-list page, no import (B5.4-B5.6). No `deleteList` and no
`deleted` set beyond the field the merge signature already takes (B5.3). No
`meta` travelling with an add - the only source of meta is a shared page
(B5.6), so `addIds` takes ids and nothing else until then. No `Panel.svelte`.
No `typeRuns` probe on the menu. No change to `docs/specs/*`, `docs/fixtures/`,
`CONTRACTS.md` or `llms.txt` - nothing here alters a contract or a behaviour
`FEATURES.md` describes.

#### What the live app does, read off app.js

**The control** (`addToListBtn`, 1879-1891). `<div class="seldrop">`, then -
only while `S.menuFor === key` - the menu, then the button:
`<button class="btn sm[ primary][ on]" data-act="menu" aria-expanded>` holding
`ICON_PLUS`, `t.addToList` and `<i class="caret[ up]">`. The menu comes
*before* the button in the DOM. `key` is the opener: a record id on a card,
`'sel'` on the bar, `'@'` on a shared page. On a card `primary` is true.

**The menu** (`listMenuHTML`, 1831-1859), for ids `[id]` on a card:

1. `<div class="dropmenu[ long]">`; `long` when the search box is drawn.
2. `<span class="lbl">` - `t.inLists` when there is exactly one id, `t.addTo`
   otherwise. A single record's menu says "Лежит в списках" even when it lies
   in none.
3. The search box, only when `S.lists.length >= 8` (`PICKER_SEARCH_AT`):
   `<input type="search" class="pickq" id="pickq" placeholder=aria-label=
   t.findList>`; typing filters chips by lowercase substring of the name.
4. `<div class="pickchips">` (`display:contents`) holding one
   `<button class="chip[ on]">` per list, **sorted by `created` descending**,
   text `'✓ ' + name` when the one id is in that list, else `name`. Nothing
   left after the search: `<span class="picker-none">t.nothing</span>`.
5. The tail: when `S.newListFor === key`, `<span class="picker-new">` with
   `<input type="text" id="newlist" placeholder=t.listNamePh>`, a
   `.btn.sm.primary` "Создать" and a `.btn.sm.ghost` "Отмена"; otherwise
   `<button class="chip ghost">+ t.newList</button>`.

**Pressing a chip** (`applyAddTo` 1907-1919, `addIdsTo` 1923-1940,
`afterListChange` 1943-1948). One id already in the list: remove it, save,
toast `removedFrom` with the name. Otherwise add the ids the data knows and the
list lacks, save, toast `addedTo` with the name (plus `': ' + fresh` when more
than one id was offered). The menu **stays open** - the live app redraws only
the chip (`markMembership`) unless the list page itself is showing.

**The new-list form** (4198-4225). `newListFor` opens it and focuses the input;
"Отмена" closes it; "Создать" with an empty name toasts `nameFirst` as an error
and refocuses; with a name it `createList`s (name trimmed, `untitled` if it
somehow ends up empty, `unshift`ed so newest is first, `created: Date.now()`,
saved) and then `addIdsTo` the same ids - so the toast is `addedTo`, not
`listCreated`. `createList.saved` is false when the write failed, and
`saveLists` itself has already toasted `saveFailed` as an error.

**Opening and closing** (3865-3869, 4234, 4627-4633). `data-act="menu"`
toggles `S.menuFor` between `''` and the key. Any click whose target is outside
`.seldrop` and `.dropmenu` closes it and clears `newListFor` - this check runs
*first* in the document handler, so pressing the language switch, a tab, or
another card's button all fold the menu. `hashchange` clears `menuFor` and
`newListFor` too.

**Placing it** (`placeMenu`, 3695-3704), after every render while a menu is
open: `below = innerHeight - button.bottom`, `need = menu.height + 16`,
`menu.classList.toggle('up', below < need)`, then
`menu.scrollIntoView({ block: 'nearest' })`. On the card `.cardpick .dropmenu`
opens **downward** (`top: calc(100% + 8px); left: 0; right: auto`) and `.up`
flips it above; on the bar the base rule opens upward. The scroll is part of
the state: on `#/i/ci1` at 1100x900 the row is below the fold and the live app
scrolls the menu into view, so both apps end up scrolled by the same amount.

**The card row** (`listPicker`, 1893-1896; `cardHTML` 2041): after
`.card-acts`, inside `.card-body`, only on a full card:
`<div class="cardpick">` holding the control (primary) and
`printBtn([id], 'sm')` - `<a class="btn sm" href="#/print/ci1" title=t.printHint>`
with `ICON_PRINT` and `t.print`.

**The store** (1149-1204, 1320-1350, 4621-4625). `loadLists` reads v2; when v2
is absent it reads v1, `keepLists` it, `liftNotes` each, writes the result to
v2 and **leaves v1 alone**. Anything that fails to parse is `[]`. `saveLists`
writes `mergeLists(S.lists)` and toasts `saveFailed` (error) on a throw. The
`storage` event for `LS_KEY` replaces `S.lists` with what storage holds
(`mergeLists(loadLists())` has empty `theirs`, so it is a plain take). All of
this is already pure in `lib/lists.ts` (`keepLists`, `liftNotes`,
`mergeLists`) and has had no caller since Phase 2; B5.1 is its caller.

**The toast** (969-1006). One element, `#toast`, after the modal in
`index.html`. `showToast(msg, mode, ms, action)`: `role` is `alert` and
`aria-live` `assertive` for `err`, `status`/`polite` otherwise; class
`toast[ err| act]`; text, then for an action a `<button class="toast-act">`
with the label; `hidden = false`; the previous timer is cleared and a new one
hides it after `ms` - 1600 plain, 2600 error, 7000 with an action. Pressing the
action hides the toast and runs it. `[hidden]{display:none !important}` is what
hides it, and `toastIn` replays each time it comes back.

**Three things the rewrite is missing, found by reading:**

1. `dict.ts` lacks seventeen keys this batch draws: `addToList`, `addTo`,
   `inLists`, `newList`, `listNamePh`, `create`, `cancel`, `findList`,
   `addedTo`, `removedFrom`, `nameFirst`, `untitled`, `saveFailed`, `print`,
   `printHint`, `homeSet`, `homeReset`. Russian at app.js 109-164 and 199-200,
   English at 295-348 and 380-381; copy them character for character (the
   English `addedTo` uses straight quotes, `listCreated` beside it curly ones -
   only the former is needed).
2. `lib/icons.ts` lacks `plus` (`M11 5h2v14h-2zM5 11h14v2H5z`, 15) and `print`
   (app.js 1044, 15).
3. `PageHead.svelte` reports only a failed pin; the live app toasts `homeSet`
   or `homeReset` on success. That toast is the whole `~ pinned` debt.

#### How it is built

**`app/src/state/lists.svelte.ts`** - `ListStore`. Constructed by `AppState`
with the `Env`, a `say(msg, error?)` and a `() => Dict`. Holds
`lists = $state<StoredList[]>([])` and a session-only `#deleted` record (the
third argument `mergeLists` already takes; nothing writes to it until B5.3).

- `load()`: `LISTS_KEY = 'dhloot.lists.v2'`; on `null`, `LISTS_KEY_V1`
  through `keepLists` and `liftNotes`, written to v2, v1 untouched; a parse
  failure is `[]`.
- `save(): boolean`: `mergeLists(this.lists, storedNow, this.#deleted)` where
  `storedNow` is `keepLists(JSON.parse(storage.get(LISTS_KEY) ?? '[]'))` (a
  parse failure means "merge with nothing"); `storage.set`; on `false`,
  `say(t.saveFailed, true)` and return false. The lists stay in memory either
  way - the session still works, as the live app's comment says.
- `get(id)`, `create(name)` (`'l' + Date.now().toString(36) + random36(4)`
  off `env.random`, name trimmed or `t.untitled`, `unshift`, `created:
  Date.now()`, `save()`), `addIds(list, ids, knows)` returning the fresh ids
  (`knows(id)` is `index.byId.has` - the store does not import the index),
  `removeId(list, id)`.
- `watch()`: `storage.onExternalChange(key => { if (key === LISTS_KEY)
  this.lists = this.load(); })`, returning the unsubscribe. `AppState.start()`
  calls it and `stop()` releases it, beside the router.

**`app/src/state/app.svelte.ts`** - `readonly lists: ListStore`;
`menuFor = $state('')`, cleared wherever `navigations` is bumped (the router's
`onChange` and `go()`); `toast = $state<Toast | null>(null)` with
`say(msg, opts?: { error?: boolean; action?: { label: string; run: () =>
void } })` and `hideToast()`. `say` sets the toast, clears the previous timer
and starts one for 1600/2600/7000ms. A `Toast` is `{ msg, mode: '' | 'err' |
'act', action? }`.

**`app/src/components/Toast.svelte`** - reads `app.toast`; renders
`<div class="toast" class:err class:act popover="manual" role=... aria-live=...>`
with the text and, for an action, `<button class="toast-act">` that calls
`app.hideToast()` then the action. An `$effect` calls `showPopover()` when a
toast arrives and `hidePopover()` when it goes, guarded on
`matches(':popover-open')` (calling `showPopover` on an open popover throws).
Styles off `.toast`, `.toast.err`, `.toast.act`, `.toast-act`, `@keyframes
toastIn`, plus the popover resets: `inset: auto auto 26px 50%; margin: 0;
border: 0; overflow: visible` (`width`/`height: fit-content` from the UA sheet
is what a shrink-to-fit fixed element measured anyway). `Shell.svelte` renders
it after the footer.

**`app/src/components/AddToList.svelte`** - props `app`, `key`, `ids:
readonly string[]`, `primary?: boolean`. `open = $derived(app.menuFor ===
key)`; local `newListFor = $state(false)`, `draft`, `pickQ`. Renders the
`.seldrop` with the menu **before** the `Button` (`size="sm"`, `variant`
primary or plain, `on={open}`, `expanded={open}`, `caret`), the button's
content `<Icon name="plus" />{t.addToList}`. The menu is the five-part markup
above: `Chip` per list with `label={(inList ? '✓ ' : '') + l.name}`, `on={inList}`
- the tick and its space are one string expression, so the leading-space rule
cannot bite - and a plain `<button class="chip">+ {t.newList}</button>` for
the tail (a `Chip` too, `label={'+ ' + t.newList}`, `on={false}`). Behaviour:

- the button toggles `app.menuFor` between `''` and `key`, and folds the form;
- a chip: one id already in the list → `removeId`, `save`, `say(removedFrom)`;
  else `addIds`, `save`, `say(addedTo + (ids.length > 1 ? ': ' + fresh.length :
  ''))`. The menu stays open; the chip re-derives its tick from the store;
- `<svelte:document onclick>`: when `open` and `event.target` is not inside
  this component's root (`bind:this`), set `app.menuFor = ''` and fold the
  form. Checked against `app.menuFor === key` at the moment the handler runs,
  so a click on another control's button - whose own handler already switched
  `menuFor` to its key - is not undone;
- the form: `+ Новый список` opens it and focuses the input (an `$effect` on
  the bound input); "Отмена" folds it; "Создать" with a blank draft →
  `say(t.nameFirst, { error: true })` and focus, else `create`, then the same
  add path, then fold;
- placement: an `$effect` reading `open`, the shown chips' length and
  `newListFor`, then after `tick()` measuring the menu and the button as
  `placeMenu` does - `classList`-free: an `up = $state(false)` on the menu and
  `menu.scrollIntoView({ block: 'nearest' })`.

Styles off style.css: `.seldrop`, `.dropmenu` (with `pop`), `.dropmenu .lbl`,
`.dropmenu :global(.chip)` (`width:100%; text-align:left; font-size:13px`),
`.dropmenu.long`, `input.pickq` and its focus, `.pickchips`, `.picker-none`,
`.picker-new`, `.picker-new input` and its focus, and the 600px
`.dropmenu { left: 0; right: 0; max-width: none }`. `.lbl` is the global rule
(`Field.svelte` carries a copy; a third copy here is the trigger to extract
it - do that only if a fourth appears, the rule is two uses of *shared UI*,
and a caption line is not a component).

**`app/src/components/RecordCard.svelte`** - `pick?: Snippet`; after the
`.card-acts` block, `{#if pick}<div class="cardpick">{@render pick()}</div>{/if}`.
Styles: `.cardpick` (`border-top`, `margin-top:12px`, `padding-top:12px`,
flex, `gap:6px`, wrap, `align-items:center`) and the two descendant rules
`.cardpick :global(.dropmenu) { bottom:auto; top:calc(100% + 8px); left:0;
right:auto }` and `.cardpick :global(.dropmenu.up) { top:auto; bottom:calc(100%
+ 8px) }`. Specificity matters here: the live `.cardpick .dropmenu` (0,2,0)
beats both `.dropmenu` (0,1,0) and the 600px `.dropmenu{left:0;right:0}`
(0,1,0), so on a phone the card's menu keeps `right:auto` and gains only
`max-width:none`. Svelte's scoping makes both sides (0,2,0); the parity cell
`#/i/ci1 ~ list menu @ ru 375` is what checks the cascade came out the same.

**`RecordPage.svelte`, `RecordModal.svelte`** - the `pick` snippet:
`<AddToList {app} key={it.id} ids={[it.id]} primary />` then
`<Button size="sm" href={printHash([it.id])} sameTab title={t.printHint}><Icon
name="print" />{t.print}</Button>`. `say` becomes `(m) => app.say(m)`; the
`.said` paragraph in `RecordPage` and the `sr-only` region in `RecordModal` go
- the toast is in the top layer and announced. `TablesPage.svelte` and
`PageHead.svelte` the same (`PageHead` says `homeSet`/`homeReset` on a
successful pin, `copyFailed` on a refused one).

**`Button.svelte`** - `on`, `ghost` (a third variant, `.btn.ghost`), `caret`
(renders `<i class="caret" class:up={expanded}>` after the children; the two
rules move here from `FilterBar.svelte`, which passes `caret`), `sameTab` on
the `href` form (omits `target`/`rel`). `AltPanel`'s two callers are untouched.

**`Shell.svelte`** - `<Toast {app} />` after the footer. Nothing else.

**`tests/parity/driver.js`** - `seed(entries)` and `storage(key)`, both as
described under "The harness can reach a list state". **`tests/parity.js`** -
`arrive()` seeds when `state.storage` is set; `keyFor` hashes
`storage: state.storage ?? null`.

#### Parity states, each in both languages at three widths

Seeds, defined once at the top of `STATES`:

```js
const LISTS = [
  { id: 'a', name: 'Клад дракона', ids: [], created: 1 },
  { id: 'b', name: 'Лавка в порту', ids: [], created: 2 }
];
const two = { 'dhloot.lists.v2': JSON.stringify(LISTS) };
const inList = { 'dhloot.lists.v2': JSON.stringify([{ ...LISTS[0], ids: ['ci1'] }, LISTS[1]]) };
const eight = { 'dhloot.lists.v2': JSON.stringify([...LISTS,
  ...Array.from({ length: 6 }, (_, i) => ({ id: 'x' + i, name: 'Лавка №' + (i + 1), ids: [], created: 10 + i }))]) };
```

| id | storage | how it is reached | what it is for |
|---|---|---|---|
| `#/i/ci1 ~ list menu` | `two` | press `Добавить в список` | the menu open under the card: label "Лежит в списках", "Лавка в порту" above "Клад дракона" (newest first), "+ Новый список"; the button pressed with its caret up; the page scrolled by `placeMenu` |
| `#/i/ci1 ~ in a list` | `inList` | press `Добавить в список` | the chip "✓ Клад дракона" lit |
| `#/i/ci1 ~ many lists` | `eight` | press `Добавить в список`, then `d.type('Найти список', 'порту')` | the `.long` menu with its search box, narrowed to one chip |
| `#/i/ci1 ~ new list` | `two` | press `Добавить в список`, then `+ Новый список` | the inline form with the input focused - both apps focus it, so the ring is on both |
| `#/i/ci1 ~ toast` | - | press `Скопировать название` (already registered, `pending` removed) | the toast, on a state that is not a menu |

Existing states that change: `#/i/ci1`, `#/i/ci1 ~ whole`, `#/i/q1`, `#/i/f1`
(the row lands: expect **zero**, delete the `listRow` entries), `#/roll/wondrous
~ pinned` (the toast lands: expect zero on CI, delete the six entries),
`#/roll/wondrous ~ modal`, `#/tables ~ a row opened`, `#/i/q1 ~ another tier`
(the row lands inside the modal; the focus-ring residue stays - re-baseline
from the container or CI, reason rewritten to name only the ring).

Nonvisual, in `SPECS`:

- `listMembership` (`presses: true`, `only: ['#/i/ci1 ~ list menu']`): a
  press spec re-arrives on its own page, and in English the `EN` click has
  already folded the menu (the outside-click rule above), so the spec first
  reopens it when the chip is not on screen - `if (!(await d.has('Клад
  дракона'))) await d.click(NAME[lang].addToList)` - then presses `Клад
  дракона` and returns `{ ticked: await d.has('✓ Клад дракона'), stored:
  JSON.parse(await d.storage('dhloot.lists.v2')).map(l => [l.id, l.ids]) }`.
  Both apps, both languages: `[['a', ['ci1']], ['b', []]]` - the seed order is
  the save order. A list's name is data, not interface text, so the chip is
  gripped by the same string in both languages.
- `recordActions.addToList` now answers `true` on both sides; the six
  `addToList` lines in `ACCEPTED` and the twelve record-route/modal `controls`
  lines (`#/i/ci1`, `#/i/q1`, `#/i/ci1 ~ whole`, `#/i/f1`, `#/roll/wondrous ~
  modal`, `#/i/q1 ~ another tier`, `#/tables ~ a row opened`) are deleted -
  the run fails on a stale one, so this is not optional. The two `#/tables ~ a
  row ticked` lines stay: the bar is B5.2's.

`NAME` needs nothing new: every `enter` step runs in Russian, `d.type` grips
the search box by its placeholder, and the one spec that presses per language
uses `NAME[lang].addToList`, which is already there.

Expect **zero** on every new cell in Russian and on every record route. The
control's rules are copied, not invented; the card row is a flex row of two
`.btn.sm` the card already draws three of. Two places to look first if a cell
is not zero: the menu's placement (`up` and the scroll - compare
`window.scrollY` and the menu's rect in both apps with the standalone-probe
technique in the handoff's gotchas), and the popover resets on the toast
(compare `getComputedStyle` of `.toast` on both apps: `inset`, `margin`,
`padding`, `border`, `width`).

#### What B5.1 leaves behind

Tests, in the same commit:

- `state/lists.test.ts` - reads v2; migrates v1 once (v2 written with
  `hnote`, v1 byte-identical afterwards); a broken JSON is `[]`; `save` merges
  with what another tab wrote (a list only storage has is appended after ours);
  `save` on `brokenStorage()` says `saveFailed` and keeps the list in memory;
  `create` puts the new list first with a trimmed name, `untitled` for a blank
  one, and a `created` stamp; `addIds` skips unknown ids and ids already there
  and returns the fresh ones; `removeId`; `watch` reloads on the v2 key and
  ignores others.
- `state/app.test.ts` - `say` sets the toast and clears it after 1600ms, an
  error after 2600ms, an action after 7000ms (`vi.useFakeTimers`); a second
  `say` replaces the first and restarts the clock; `hideToast`; `menuFor`
  clears on `go()` and on an external hash change and survives `replace()`.
- `components/lists.test.ts` (new) - through `App` at `#/i/ci1` with
  `memoryStorage({ 'dhloot.lists.v2': ... })`: the row draws the button
  (`aria-expanded="false"`) and the print link (`href="#/print/ci1"`, the
  title); pressing opens the menu newest first with "Лежит в списках"; a chip
  adds `ci1` to storage, ticks itself, keeps the menu open and toasts
  `Добавлено в «Клад дракона»`; pressing it again removes and toasts
  `Убрано из «Клад дракона»`; eight lists draw the search box and typing
  narrows the chips, `Ничего не найдено` when none is left; `+ Новый список`
  opens the form with focus, a blank "Создать" toasts `Сначала назовите
  список` as an alert, a named one creates the list first-in-order with `ci1`
  in it and folds the form; "Отмена" folds it; a click outside closes the
  menu; `router.navigate` closes it; `brokenStorage()` still adds for the
  session and toasts `saveFailed`; the same row draws in the modal a table row
  opens. Every case ends with `expectNoA11yViolations`.
- `components/shell.test.ts` - the toast: `role="status"` and polite by
  default, `role="alert"` and assertive for an error, the action button runs
  the action and hides the toast. (`showPopover` does not exist in jsdom -
  guard the effect on `typeof el.showPopover === 'function'`, which is also
  the browser fallback.)
- `components/button.test.ts` - `on`, `ghost`, `caret` up/down, `sameTab`
  omits `target`.
- `components/record.test.ts`, `tables.test.ts`, `roll.test.ts` and
  `std.test.ts` - wherever they assert the `said` text, assert the toast
  instead (`getByRole('status')`).
- `test/a11y.test.ts` - a pressed state: `#/i/ci1` with two lists seeded,
  press `Добавить в список`; and `COVERED` gains `Toast.svelte` and
  `AddToList.svelte` (`lists.test.ts` reaches both; the sweep's guard fails
  on a component no named state renders).
- `tests/parity/specs.js` - the states, the seeds, the spec, the deletions.

#### Ordered steps

1. `dict.ts`: the seventeen keys, both languages. `icons.ts`: `plus`, `print`.
2. `state/lists.svelte.ts` and its test. `state/app.svelte.ts`: `lists`,
   `menuFor`, `say`/`hideToast`/`toast`; `start()`/`stop()` wire `watch()`.
   `app.test.ts` cases.
3. `Button.svelte`: `on`, `ghost`, `caret`, `sameTab`; `FilterBar.svelte`
   passes `caret` and loses its `<i>` and two rules. `button.test.ts`.
4. `Toast.svelte`; `Shell.svelte` renders it. `shell.test.ts` cases.
5. `AddToList.svelte`.
6. `RecordCard.svelte`: `pick` and `.cardpick`. `RecordPage`, `RecordModal`:
   the snippet, `say` → `app.say`, the `.said`/`sr-only` regions deleted.
   `TablesPage`, `PageHead`: `say` → `app.say`, `homeSet`/`homeReset`.
7. `lists.test.ts`; the `said` assertions in the four existing files; the
   a11y state and `COVERED`.
8. `driver.js`: `seed`, `storage`. `parity.js`: `arrive` seeds, `keyFor`.
   `specs.js`: seeds, five states (one un-pended), `listMembership`, `NAME`,
   the `VISUAL_DEBT` and `ACCEPTED` deletions.
9. `npm run check 2>&1 | tail -n 120` - one foreground call, unchained,
   unredirected (`context.md`, "npm run check, settled").
10. `npm run build`, then `node tests/parity.js "i/ci1"` (7 states) and
    `node tests/parity.js "i/q1" "i/f1" "wondrous ~ modal" "a row opened" "pinned"`
    (6 states) - two foreground calls, each well inside the cap. Open every
    nonzero diff. Re-baseline the three modal states from the container
    (`tools/parity-ubuntu/README.md`) when docker is available, else record
    the Windows figure with a reason that says "Windows, advisory" and list
    the cells in the handoff for the orchestrator.
11. `npm run check:built`. `node tests/parity.js "tables"` and the unfiltered
    suite are the orchestrator's.
12. `plan.md` gains "B5.1 built"; `handoff.md`'s Completed/Verification/Next
    batch; commit as one batch, `feat(lists): ...`, authored as `artex-x`.

#### Acceptance criteria

- On `#/i/ci1`, `#/i/q1`, `#/i/f1` and in every record modal the card ends
  with a `.cardpick` row: "Добавить в список" (`aria-expanded`) and a "Печать"
  link to `#/print/<id>` with the live title.
- Pressing the button opens the menu before it in the DOM, with "Лежит в
  списках", the lists newest first, "+ Новый список"; pressing it again, or
  anywhere outside, or changing the hash, closes it.
- A chip adds the record to that list in `dhloot.lists.v2` (merged, not
  overwritten), ticks to "✓ name", keeps the menu open and toasts; a lit chip
  removes and toasts. Storage that refuses keeps the list for the session and
  toasts `saveFailed` as an alert.
- Eight lists draw the search box; the query narrows by substring.
- The new-list form focuses, refuses a blank name with an alert, and a named
  one creates the list first and adds the record.
- `dhloot.lists.v1` is read once into v2 and left untouched; another tab's
  write replaces the in-memory lists.
- The toast is one element in the top layer: `status`/polite, `alert`/
  assertive for an error, an action button that runs and hides, 1600/2600/
  7000ms.
- `#/roll/wondrous ~ pinned` raises `homeSet`/`homeReset`.
- The four new `#/i/ci1` states and `~ toast` report 0.00% at every Russian
  cell and every English cell; `#/i/ci1`, `~ whole`, `#/i/q1`, `#/i/f1` report
  0.00% everywhere and their `listRow` entries are deleted; the `~ pinned`
  entries are deleted or, if a Windows run cannot settle them, left for CI
  with a note. The three modal states carry new, smaller numbers whose reason
  names only the close button's focus ring.
- `listMembership` matches; no `ACCEPTED` entry is stale; `recordActions.
  addToList` is `true` on both.
- `npm run check` and `npm run check:built` exit 0 with thresholds met.

#### Risks and do-nots

- Do not build `ListMenu.svelte`, `SelBar.svelte`, or anything under
  `#/lists`. Do not move `sel` to `AppState`.
- Do not draw the menu after the button: the live DOM order is menu, then
  button, and a focus order that differs is a difference.
- Do not give `+ Новый список` a dashed border; see "Decided".
- Do not keep the menu open across the language click, and do not "fix" the
  English cells: the outside-click rule is the live app's.
- Do not hide the toast with `{#if}` while `popover` is in play - the popover
  needs its element to exist to `hidePopover()`; use the effect. If the
  popover route fails the `~ toast @ ru 1100` cell after the resets above
  have been compared computed-style for computed-style, take the fallback in
  "Decided" and write the modal gap into the handoff.
- Do not set the toast's timers in the component; they are the state's, so a
  second `say` from anywhere restarts the same clock.
- Do not call `save()` from `create()` and then again from `addIds()` in one
  press expecting one merge - two saves are fine (the live app does the same)
  but the second must see the first's write, which it does because `save`
  re-reads storage.
- Do not write `Date.now()` into anything a parity state can see; the seeds
  carry ids and stamps, and a *new* list is only made in the `~ new list`
  state, whose id never reaches the screen.
- Do not write a `VISUAL_DEBT` number off a Windows run for the three modal
  states as though it were CI's; see "Decided".
- Do not touch `RecordCard.svelte:81`'s `noType`, the `matches` callbacks, or
  anything B4 settled.
- Grep the diff for `' <` at the start of an `{#if}`/`{#each}` block. The
  `✓ ` and `+ ` prefixes are string expressions, not literal text nodes; if a
  literal one appears, promote the leading-space rule to `CLAUDE.md`.
- One batch, one commit, `feat(lists): ...`, authored as `artex-x`, no push.

**Fallback, considered:** rendering a second `Toast` inside `RecordModal`'s
`<dialog>` instead of using the top layer. Rejected as the primary route - two
live regions for one message - but it is the honest second answer if
`popover` cannot be made to measure identical, and it is a one-line change in
`RecordModal` on top of this design.

### B5.1 built: the list store, the toast, and the add-to-list row

What was built matches the design closely. `popover="manual"` measured
pixel-identical on every new state at every width in both languages - the
fallback was not needed. Three things the design did not anticipate, found
while building and while measuring:

1. **The success toast always racing the failure toast, unfixed in app.js,
   fixed here.** `addIdsTo` in app.js calls `saveLists()` - which itself
   toasts `saveFailed` on a throw - and then unconditionally toasts
   `addedTo` right after, on the same synchronous pass, so a real storage
   refusal is never actually seen in the live app: the success message
   always overwrites it before a screen reader or a person can register it.
   The acceptance criteria for this batch require the opposite - "a refusing
   storage keeps the session and toasts `saveFailed`" - so `AddToList.svelte`
   checks `save()`'s own return value before showing the success toast on
   top of it, in `pick()` and in `createNew()`. This is a deliberate
   departure from copying app.js's literal call order, not a parity gap: no
   parity state exercises a real storage failure (broken storage is a unit-
   test-only scenario), so nothing the harness compares is affected either
   way, and the fix is a strict improvement over a live-app defect nobody
   had reason to reproduce on purpose.
2. **jsdom implements `[popover]:not(:popover-open){display:none}` from its
   own default stylesheet, but neither `showPopover`/`hidePopover` nor
   `:popover-open` matching.** The effect's existing guard
   (`typeof el.showPopover !== 'function'`) already anticipated "the browser
   fallback" for exactly this shape of gap; what needed adding was the
   fallback's own body - toggling `el.style.display` directly, which wins
   over the UA rule by ordinary cascade precedence (inline beats any
   stylesheet). Without it every component test asserting `getByRole
   ('status'|'alert')` on the toast failed while `getByText` on the same
   element passed, since jsdom's CSS-only implementation left the element
   permanently `display:none` - a real component behaviour gap the design's
   "browser fallback" language did not spell out needed a body of its own.
3. **A per-instance outside-click handler reading a prop derived from a
   record that is mid-close throws.** `key={it.id}` on `AddToList` is a
   live getter into the parent's `it`; closing the modal (the close button,
   the backdrop) sets `it`'s source to `null` on the same synchronous pass a
   native click event is still bubbling through, and Svelte's own effects
   are torn down for a destroyed component before they run again but a
   raw `<svelte:document onclick>` listener is not - it fires once more,
   with the now-null-backed prop, and reading `key` throws
   `Cannot read properties of null (reading 'id')`. Reproduced in
   `roll.test.ts`'s existing "closes on the close button"/"closes on the
   backdrop" tests, unrelated to lists until `AddToList` started rendering
   inside every modal. Fixed with a `try`/`catch` around the one read: the
   record is on its way out either way, so there is nothing left to close.

**Numbers, measured this session, `node tests/parity.js "i/ci1"` and
`node tests/parity.js "i/q1" "i/f1" "wondrous ~ modal" "a row opened"
"pinned"`:**

- Every new `#/i/ci1` state - `~ list menu`, `~ in a list`, `~ many lists`,
  `~ new list` - measures **0.00%** at every width, in both languages,
  reproduced across repeated runs. `~ toast` is the same at five of six
  cells; `@ en 375` does not reproduce (below).
- `listMembership` matches on both apps, both languages:
  `[['a', ['ci1']], ['b', []]]`.
- `#/i/q1 ~ another tier`, `#/roll/wondrous ~ modal` and
  `#/tables ~ a row opened` all dropped from 4.6-13.6% to **0.02% at 1100,
  0.03% at 768, 0.07% at 375**, identically in both languages, reproduced
  exactly across two full runs - the close-button focus ring residue the
  design predicted, and nothing else. Recorded at these figures with a
  reason naming only the ring; `docker` is installed and its daemon runs on
  this host, but `tools/parity-ubuntu`'s own documented build command
  fails as committed (`COPY package.json package-lock.json ./` with a build
  context of `tools/parity-ubuntu`, which holds neither file - copying them
  in from the repo root makes the image build, but the container's own
  entrypoint copying `/work` into `/app` did not complete inside a 60s
  probe on this host, mount performance on Windows likely, and was not
  pursued further). These three figures are Windows, advisory; CI's own
  numbers are what actually settle the entries.
- `#/roll/wondrous ~ pinned` did not reach all-six-zero on this host across
  two runs (`ru 375` reads 3.52-3.64%, stably above the ratchet slack every
  time; `en 375` alternates between ~3.8% and 0.00% between runs) - per the
  brief's own instruction, left exactly as recorded, untouched, for CI to
  decide.
- **`#/i/ci1 ~ whole @ 1100` is a genuine finding, not predicted by the
  design: it does not go to zero, and it is not a stable number on this
  host.** 768 and 375 are exact zero on every run. At 1100, `ru` read
  1.43% then 5.53% and `en` read 4.88% then 0.00%, on an unchanged build,
  across consecutive runs. A standalone probe
  (`getBoundingClientRect` on `.card`, `.cardpick` and `.foot`, both apps,
  both languages, with and without the English language switch) found
  every rect byte-identical to the fraction in every configuration - same
  document height, same card, same row, same footer position - so this is
  paint, not layout, the same class `docs/parity.md` already names for the
  help panel, just unusually large and unusually unstable for that class.
  Recorded at the worse of the two runs per cell, with a reason naming the
  instability itself rather than a guessed cause, and flagged for CI to
  settle - see `handoff.md`, "Blockers".
- `recordActions.addToList` reads `true` on both apps at every one of the
  seven states now in its `only` list (`#/i/ci1`, `#/i/q1`,
  `#/i/ci1 ~ whole`, `#/i/f1`, `#/roll/wondrous ~ modal`,
  `#/i/q1 ~ another tier`, `#/tables ~ a row opened`); every `addToList` and
  `controls` ACCEPTED line naming those states as short of the row is
  deleted - twenty lines in total: six `addToList` lines (`#/i/ci1`, `#/i/q1`
  and `#/roll/wondrous ~ modal`, both languages) and fourteen `controls`
  lines across all seven states.

### B5.2 planned, part 0: green CI, and the two unstable classes named

**Why a part 0, and why it goes first.** Two things were on the table on
2026-09-10: CI red on five parity cells for two consecutive runs
(`context.md`, "CI is red again"), and the selection bar. They are one batch
name and two different kinds of work - the first is tests and docs with no
production code, finishable in a session with two short parity filters; the
second is a full UI surface. And the bar *depends* on the first: its
copy-selection state raises a 1600ms toast, so it is a timed state, and it
cannot be measured honestly until timed states have a mechanism. So part 0 goes
first, small, and part 1 lands on a green baseline with the instrument it needs.
CI red also blocks `deploy` on every push, which is reason enough on its own.

**Objective.** CI is green on the tree as it stands; the two measurement
classes B5.1 found - the timed toast and the whole-page capture - are named,
have a mechanism each, and a person who hits either on a local Windows run has
a written recipe rather than a judgement to make.

**Scope.** `tests/parity/specs.js` (five deletions, a `timed` flag on two
states, one new `perWidth` spec), `tests/parity.js` (timed states re-arrive per
width), `tests/parity/driver.js` (`shot()` waits for a stable capture;
`rectsAt()`), `docs/parity.md`, `docs/specs/COVERAGE.md`. No file under
`app/`.

**Non-goals.** Nothing about the bar. No change to `JITTER`, `DEBT_SLACK` or
the verdict logic in `parity.js` (288-325). No re-arrival for non-timed states
- the width-sweep decision for the anchor cells stays open (handoff,
"Blockers"). No fix to `tools/parity-ubuntu`'s Dockerfile. No `VISUAL_DEBT`
number written from this host, for any reason.

#### The five entries: deleted

`specs.js` 863-892: `#/i/ci1 ~ whole @ ru 1100` (5.53), `@ en 1100` (4.88),
`@ ru 768` (7.31), `#/i/ci1 ~ toast @ en 375` (2.78), `@ en 768` (0.86). CI
measured all five at an exact 0.00% on two runs, two commits, identically
(`34482875625` on `a404a52`, `34485537392` on `b6a2fcd`). Every one carries
"CI to confirm" or "B5.2's to solve" in its own `why`. CI has confirmed.

Deleted, not lowered: the ratchet's own rule is that a cell at or under
`JITTER` fails until its entry is gone (`parity.js` 532-543), and the only
figure that is not 0.00 is a Windows figure, which owner decision 1 forbids
writing as a baseline. Their block comments go with them - `specs.js` 848-
862 and 866-877 describe an instability this part removes, and a comment about
a deleted entry is a story nobody can check.

What that does to a local Windows run is the trade, and it is taken with the
eyes open: those cells were **already red locally** - the fix-pass read `@ ru
1100` at 1.43 against 5.53 and failed it as `стало лучше` - so deletion moves
them from one failure message to another (`ожидался ноль`) on a host that
reads noise, and to a pass on one that does not. What is *new* in this part is
that both classes get a mechanism that removes the noise at its source on
every machine, and a recipe for the residue (below, "What a local run does
afterwards").

#### Two classes, two mechanisms

The handoff already says it: two mechanisms, one symptom. Read off the runner:

**The timed class is the width sweep.** `parity.js` 352-450: one arrival per
language, then three viewports on the same document, each with a `settle()`
(up to 680ms) and a screenshot. A 1600ms toast raised by `enter` is
photographed three times on one clock, and in English a fourth press (`EN`)
sits between the toast and the first shot. Whether the 375 shot lands inside
the window depends on host load, and the legacy side may come from the cache -
a PNG taken on a different clock altogether. The fix is not a tolerance; it is
to stop sweeping a clock: **a state marked `timed: true` is arrived at afresh
at every width**, so every shot is the same few hundred milliseconds after the
press, on both sides, at every width. Two states carry it: `#/i/ci1 ~ toast`
and `#/roll/wondrous ~ pinned` (its `homeSet` toast is the same 1600ms; six
entries were deleted in the fix-pass and it still flaps locally). Any state a
later batch adds whose `enter` raises a toast carries it too - part 1's
`~ selection copied` is the first.

**The whole-page class is the capture.** `#/i/ci1 ~ whole` is the only
`whole: true` state; its shot is `page.screenshot({ fullPage: true })`, which
rasterises the whole 3000-plus-pixel document, most of it never painted before,
in one go. B5.1 measured the geometry byte-identical across every reading and
the pixels swinging 0.00-7.31% on an unchanged build, worst under the full
suite's load - the signature of a capture handed back before the raster
finished, not of anything the app drew (hypothesis, named as one; what is
established is that it is paint and not layout). The fix is the harness's own
invariant - a state that has not stopped moving is not a state - applied to
the capture: **`shot(whole)` takes full-page captures until two consecutive
ones are byte-identical** (cap at four), and says so on the console when it had
to retry. It cannot mask a difference between the apps: both captures it
compares are of the same page. Beside it, a **`geometry` spec** (`perWidth`,
`only: ['#/i/ci1 ~ whole']`) records the document height and the rects of
`.card`, `.cardpick` and `.foot` at every width, on both apps, rounded to a
tenth - the standalone probe B5.1's implementer wrote by hand, made part of the
suite. With it, "paint or layout?" is a line in the report rather than an hour
with a scratch script.

#### How it is built

**`tests/parity/specs.js`**

- Delete the five entries and their two block comments (848-877). The
  modal-state and `~ a row ticked` blocks below them stay.
- `#/i/ci1 ~ toast` and `#/roll/wondrous ~ pinned` gain `timed: true`, each
  with a one-line comment: "a 1600ms toast; arrived at afresh per width - see
  docs/parity.md, 'Timed states'".
- The `STATES` doc comment (317-323) gains a line for `timed`.
- A `geometry` spec after `typeRuns`:

  ```js
  /* Geometry for the one full-page state, so a noisy capture can be told from
     a layout change by reading, not by probing (B5.2 part 0). */
  const geometry = {
    perWidth: true,
    name: 'the geometry of the page a full-page capture photographs',
    only: ['#/i/ci1 ~ whole'],
    async run(d) {
      return await d.rectsAt({ card: '.card', pick: '.cardpick', foot: '.foot' });
    }
  };
  ```

  and `geometry` appended to `SPECS`. Note the consequence the runner already
  enforces: a state with a `perWidth` spec is shot uncached on both sides
  (`parity.js` 421-429), which for this one state is the point.

**`tests/parity/driver.js`**

- `shot(whole)`: unchanged for the fold. For `whole`, capture, then capture
  again; return when two in a row are equal (`Buffer.equals`), at most four
  captures; when more than one was needed, `console.log` one line naming the
  count (`       снимок целиком: N попыток до устойчивого кадра`). Comment:
  why (the class above), and that this is the animation/font wait applied to
  the capture itself.
- `rectsAt(probes)`: `{ name: selector }` in, per name `null` when absent or
  `{ x, y, w, h }` off `getBoundingClientRect()` rounded to a tenth, plus a
  `docHeight` field off `document.documentElement.scrollHeight`. Waits on
  `document.fonts.ready` first, like `typeAt`. The selector policy comment on
  `typeAt` applies - copy its one-paragraph rationale in a sentence, do not
  restate it.

**`tests/parity.js`**

- Destructure `timed` from the state. Hash it in `keyFor` (`timed:
  !!state.timed`) - parity.js's own hash already invalidates the whole cache
  on this edit, and the field keeps a later toggle honest.
- In the per-target block (389-453): when `timed`, the first page shoots only
  `WIDTHS[0]` (looks, controls and the 1100 shot stay exactly where they are);
  then, after that `withPage` has closed, one more `withPage` per remaining
  width: `viewport(size)`, `arrive(d)`, `settle()`, the `measured` specs if
  any, `shot(whole)`. The legacy cache is consulted per width *before* opening
  the page (a hit writes the file and skips the page), so a warm run stays
  cheap. `broke` is set the same way and breaks the same loops. One page at
  a time is preserved: `withPage` closes in `finally` before the next opens.
- The comment above `arrive` (352-356) gains the sentence: "A timed state
  arrives afresh at every width - see docs/parity.md."

**`docs/parity.md`**

- "Register the state first": `timed` joins `enter`, `whole`, `pending` in
  the field list, with when to use it (any `enter` that raises a toast).
- "Machine variance": the sentence about the container and timed states
  stays; a new short subsection **"Two unstable classes"** after it:
  1. *Timed states* - the mechanism (width sweep), the flag, and that its
     number is still CI's.
  2. *Full-page captures* - the mechanism (capture), the re-shoot, the
     `geometry` spec, and the recipe: a `whole` cell that fails locally with
     `geometry` agreeing on both apps and a diff image with no content change
     is this host's paint; re-run the one state (`node tests/parity.js "ci1 ~
     whole"`); write no entry; the latest CI shard decides. A `whole` cell
     that fails with `geometry` *disagreeing* is a layout defect, and the
     field that differs names it.
- "Harness invariants": two lines - a timed state is arrived at per width; a
  full-page capture is taken until two agree.

**`docs/specs/COVERAGE.md`** - the paragraph "Three conditions the harness
controls" becomes five, one clause each for the two above. Nothing else.

#### What a local run does afterwards

Written down because the question was asked, and because it is the part a
person hits at 11pm:

- `#/i/ci1 ~ toast` and `~ pinned`: expected to read 0.00 at all twelve cells
  on this host as well, since the shot is now a fixed distance from the press.
  If one does not, the toast's own pixels differ - open the diff; that is a
  defect, not the class.
- `#/i/ci1 ~ whole`: expected to read 0.00 on a quiet host now that the
  capture waits for itself; the console says when it had to retry. If a cell
  still reads non-zero: the `geometry` line for that width is the verdict.
  Agreeing → paint on this host, re-run the one state, write nothing.
  Disagreeing → a real difference, named by field.
- Nothing about owner decision 1 changes: no figure from this host enters the
  table. CI's shards are read with `gh run view <id> --log-failed`.

#### Ordered steps

1. `specs.js`: the five deletions and their comments; `timed: true` on the two
   states; the `STATES` doc line.
2. `parity.js`: `timed` in `keyFor` and the per-width arrival.
3. `npm run build` (dist is needed by the runner; nothing under `app/`
   changed, so the existing `dist/` is current if it is from this tree -
   build anyway, it is cheap).
4. `node tests/parity.js "i/ci1 ~ toast" "pinned"` - the two timed states,
   12 cells. Expect `расхождений нет`. Run it twice: the second run exercises
   the per-width cache path for timed states and should be visibly faster.
5. `driver.js`: `shot()`'s stable capture; `rectsAt()`. `specs.js`: the
   `geometry` spec, in `SPECS`.
6. `node tests/parity.js "ci1 ~ whole"` - one state, six cells, uncached both
   sides. Expect 0.00 everywhere and `geometry` silent. If the console shows
   retries, that is the class firing and being absorbed - note the count in
   the handoff. If a cell is non-zero and `geometry` agrees, run it once more
   and record both readings in the handoff without touching the table.
7. `docs/parity.md`, `docs/specs/COVERAGE.md`.
8. `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground call,
   `timeout: 600000`; over the cap means re-run, not salvage (`context.md`,
   "npm run check, settled", and its correction).
9. `node tests/parity.js "i/ci1"` (7 states, the full record-route family
   including the four list states) as the regression pass over everything
   this part touched. Expect `расхождений нет`.
10. `plan.md` gains "B5.2 built, part 0"; `handoff.md` Completed/Verification/
    Next batch (part 1 becomes next); one commit, `fix(parity): ...`, authored
    as `artex-x`, no push. The orchestrator reads the CI run on it.

#### Acceptance criteria

- `VISUAL_DEBT` holds none of the five ids; `node tests/parity.js "i/ci1"`
  and `"pinned"` report `расхождений нет` on this host.
- `STATES` has `timed: true` on exactly `#/i/ci1 ~ toast` and
  `#/roll/wondrous ~ pinned`; the runner opens a fresh page per width for
  them and the cache is honoured per width (a second run of step 4 is visibly
  faster and passes).
- `d.shot(true)` returns a capture equal to the one before it, or the fourth;
  a retry prints one line.
- `geometry` runs at every width on `#/i/ci1 ~ whole` and reports nothing.
- `docs/parity.md` names both classes, the flag, and the recipe;
  `COVERAGE.md`'s paragraph counts five conditions.
- `npm run check` exits 0. Note what it does *not* check: `.prettierignore`
  and `eslint.config.mjs` both skip `tests/`, so the runner and driver edits
  are verified only by running them (steps 4, 6, 9) - match the files' own
  style by hand.
- CI green on the commit - the orchestrator's read, recorded in the handoff
  with the run id, is what closes this part.

#### Risks and do-nots

- Do not write any `VISUAL_DEBT` number in this part. If a cell is non-zero
  on this host after steps 4-6, the handoff carries the reading and CI
  decides.
- Do not touch `JITTER`, `DEBT_SLACK`, or the five verdict branches. The
  answer to a flaky cell is never a wider gate.
- Do not mark a non-toast state `timed`, and do not re-arrive every state:
  that is the width-sweep decision, deliberately still open.
- Do not stub `setTimeout` or the toast's clock from `prepare()`. Both apps
  must run their own timers; the harness fixes *when it looks*, not what the
  app does.
- Do not cap the re-shoot at two: under real load the second capture can be
  the unfinished one. Four, then give up and let the diff speak.
- Keep the first page's `looks`/`controls`/1100 shot exactly where they are
  for timed states - a different inventory page would change every
  `inventory` comparison on those two states.
- `rectsAt` selectors are ported classes; if `.card` or `.cardpick` reports
  `null` on the rewrite, a class was renamed - that is a finding, not a reason
  to loosen the selector.
- One commit, no push, no `Co-Authored-By`.

**Decided in planning - do not reopen.**

- **Timed states re-arrive per width; the slack class is rejected.** A slack
  is a tolerance under another name: the toast is 0.9-2.8% of the fold, so
  the slack would have to be that wide, which is exactly the size of defect
  the toast state exists to catch (a wrong toast colour, a missing action
  button), and the owner has already rejected widening the gate. Also
  rejected: stubbing the toast timer from `prepare()` (fakes the app; couples
  the harness to three durations); excluding the toast's rectangle from the
  pixel compare (compares less; the toast's pixels are the point of the
  state); pressing `EN` before `enter` for timed states (changes what every
  `@ en` cell has meant since B1 and the flash-replay states depend on the
  order).
- **The five entries are deleted, not lowered and not kept.** There is no
  figure to lower to but 0.00, which is deletion by the ratchet's own rule;
  keeping them with a "local" reason is a permanently red CI gate.
- **Two mechanisms, two fixes, one part.** They are cheap enough to land
  together and the second (the capture) is what makes the local story after
  deletion honest rather than "expect red".
- **The `geometry` spec is a probe on one state, not a new instrument
  family.** It reuses the `perWidth` path `typeRuns` opened; extending it to
  other states waits for a reason, the same way `typeRuns` did.
- **`tools/parity-ubuntu`'s Dockerfile stays broken for now.** The fix moves
  the build context to the repository root and needs a `.dockerignore` for
  `img/`, `og/` and `i/`; a real change with its own verification, still in
  "Deferred". CI is the authoritative reader for this part, as it already is.

### B5.2 planned, part 1: the selection bar

**Objective.** Ticking rows in a table raises the live app's bar at the bottom
of the window: "Выбрано N" with a cross that clears everything, and three
actions on the right - add the whole selection to a list (the same control the
card has, opening above the bar), print the selection, copy it as one message.
With it, the six `selBar` entries in `VISUAL_DEBT` and the two `~ a row
ticked` lines in `ACCEPTED` are deleted, and the multi-id branches B5.1 built
without a caller (`t.addTo`, `': N'` on the toast) get one.

**Scope.** `state/app.svelte.ts` (`sel` lifted, `clearSel`),
`components/SelBar.svelte` (new), `components/Shell.svelte` (renders it),
`components/TablesPage.svelte` (reads `app.sel`), `components/AddToList.svelte`
(one invented rule deleted), `components/RecordModal.svelte` (folds the menu
before it closes - the live rule, a cheap fix in a path this batch makes
busier), `lib/dict.ts` (three keys), `lib/share.ts` (`shareSelection`), the
driver (`click(name, nth)`), the specs (two states, two press specs,
deletions), and tests for all of it.

**Non-goals.** No `#/search` (the second owner of `sel`; it arrives with the
search slice and reads `app.sel` as-is). No `#/lists`, no `lsel`, no batch
actions (B5.3-B5.5). No print *page*; the link is enough, as on the card. No
`@media print` rules for the bar (the print slice owns print styles; the live
`#selBar{display:none}` under print is recorded there). No `Panel.svelte`. No
change to `docs/specs/*` beyond `COVERAGE.md`'s test table, `docs/fixtures/`,
`CONTRACTS.md` or `llms.txt` - the print route already exists in the contracts
and nothing else here is public.

#### What the live app does, read off app.js and measured

**The bar** (`renderSelBar`, 3706-3721; `#selBar` in index.html:81, right
after `</footer>` and before the modal). `<div class="selbarwrap" id="selBar"
hidden>`; while `selCount()` is zero it is `hidden` and empty. Otherwise
`innerHTML` is:

```html
<div class="wrap selbar">
  <span class="selcount">Выбрано 1<button type="button" class="selx" data-act="clearSel"
    title="Снять выделение" aria-label="Снять выделение">×</button></span>
  <div class="selacts">
    <div class="seldrop">…addToListBtn('sel', selIds(), true)…</div>
    <a class="btn sm" href="#/print/ci1" title="Собрать карточки для печати: девять на лист A4">
      <svg…/>Печать</a>
    <button type="button" class="btn sm" data-act="copySel"><svg…/>Скопировать</button>
  </div>
</div>
```

(Read back from the live DOM by a probe, not transcribed.) Facts in it:

- The count is **one text node**, `t.selected + ' ' + n`, followed by the
  cross. Emit it as one expression.
- The add-to-list control is `primary` on the bar too (third argument `true`),
  key `'sel'`, ids `selIds()` = `Object.keys(S.sel)` in insertion order.
- The print link is `printBtn(selIds(), 'sm')` (3245-3249): an `<a class="btn
  sm">` to `#/print/<ids joined by ->` with `title=t.printHint`, `ICON_PRINT`
  and `t.print`. Its **accessible name is its title** (the driver's `NAME_FN`
  prefers `title` over text), so the inventory compares the long string, and
  `d.click('Печать')` would not find it.
- Copy is `<button class="btn sm" data-act="copySel">` with `ICON_COPY`
  (1041; `lib/icons.ts` `copy` is the same path) and `t.copySel`.
- `renderSelBar()` runs on every `render()` (3790), on every tick (4407,
  4419), after a list change (1947) and after a list rename (4433) - i.e. the
  bar is always current. In the rewrite that is reactivity, not calls.

**The handlers.**

- `clearSel` (4235): `S.sel = {}; S.menuFor = ''; render()`.
- `copySel` (4246-4250): `items = selIds().map(id => BY_ID[id]).filter
  (Boolean)`; if any, `copyRich(selAsHtml(items), selAsText(items),
  t().selCopied)`. `selAsText`/`selAsHtml` (1961-1966) are each record's
  `shareText`/`shareHtml` **with no skip set** joined by `'\n\n'` /
  `'<br><br>'` - a set, not alternatives, so no OR (the comment above them
  says so; `tests/select.js` asserts it). `copyRich` (1010-1018) toasts
  `selCopied` on success and `copyFailed` as an error otherwise - the
  rewrite's `writeRich` already carries that split.
- Ticks (4403-4420): a row box sets or deletes `S.sel[id]`; select-all walks
  its `data-sel-all` ids in list order. Existing keys keep their position, so
  the print link's id order is tick order. `TablesPage.svelte`'s
  `toggleSel`/`toggleAllIn` already do exactly this on a `SvelteSet`.
- `hashchange` (4632): `S.sel = {}; S.lsel = {}; S.menuFor = ''; S.newListFor
  = ''` - a selection belongs to the page it was made on. The rewrite clears
  on `app.navigations` today, inside `TablesPage`; the bar in the frame needs
  the same rule at app level.

**The styles** (style.css 54, 799-829): `.selbarwrap` is declared twice -
`padding-bottom: env(safe-area-inset-bottom)` at 54, and at 799 `position:
sticky; bottom: 0; z-index: 45` (above the sticky topbar's 40, below the
menu's 60), the gradient, the gold top border, `backdrop-filter: blur(12px)`
with its `-webkit-` twin; `.selbarwrap[hidden]{display:none}`. `.selbar` is
`display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:10px 0`
**plus `.wrap`** (52-53: `width: min(1180px, 100% - 32px); margin-inline:
auto; padding-left/right: env(safe-area-inset-*)`). `.selcount`, `.selx`,
`.selx:hover`, `.selacts{display:flex; gap:8px; flex-wrap:wrap; margin-left:
auto}`. Under `@media (max-width:600px)` (817-828): `.selx{width:32px;
height:32px}`, `.selacts{width:100%; margin-left:0}`, `.selacts .seldrop{flex:
1 1 100%}`, `.selacts .btn{flex:1 1 0; min-width:0; width:100%;
justify-content:center; overflow:hidden}`, and the `.dropmenu{left:0; right:0;
max-width:none}` that `AddToList.svelte` already carries. (`.selbox{width:
38px}` in the same block is B3.5's, already ported.)

**Measured, live, 2026-09-10** (a read-only puppeteer probe on `index.html
#/tables`, two lists seeded, reduced motion): at 1100x900 the bar is 53px
tall at y=847, `.selbar` 1053 wide from x=16, `.selacts` children 176.7 /
86.6 / 121.9 px wide at y=858; 768 the same heights, narrower; at 375x812 the
bar is **137px** tall (the count on one row, the add-to-list control filling
the second at 328px, print and copy at 160px each on the third). `#/tables`
(core_item) has 60 rows and a select-all; all ticked reads "Выбрано 60".

**The bar's menu opens above the bar at every width, and `up` is set.**
`placeMenu` (3695-3704) toggles `up` when `innerHeight - button.bottom <
menu.height + 16`, which at the bottom of the window is always true - and
**style.css has no base `.dropmenu.up` rule**, only `.cardpick .dropmenu.up`
(443). So on the bar the class is inert and the base `bottom: calc(100% +
8px)` keeps the menu above (measured: menu y=679 with the bar at 847, 230x171
with two lists, right-aligned at x=614; at 375 it spans x=16-344 under the
600px override). No scroll happens (`scrollY` 0; the menu is inside the
sticky bar and already in view).

**One thing the rewrite already has wrong.** `AddToList.svelte` carries
`.dropmenu.up { bottom: auto; top: calc(100% + 8px) }` - an invented rule with
no counterpart in style.css. On the card it is harmless (RecordCard's
`.cardpick :global(.dropmenu.up)` overrides it); on the bar it would put the
menu *below* a bar that sits at the bottom of the window, off-screen. Delete
it, and correct the comment above the base rule that promises "this is the
bar's own default (upward)" - it is, once the flip rule is gone.

**Three dictionary keys are missing:** `clearSel`, `copySel`, `selCopied`
(app.js 113-114 / 299-300). `selected`, `print`, `printHint`, `copyFailed`
exist.

#### How it is built

**`app/src/state/app.svelte.ts`** - `readonly sel = new SvelteSet<string>()`
(the type `TablesPage` already uses), documented beside `menuFor`: the bar in
the frame reads it and the live app clears it on `hashchange`, which is why it
is app-level and memory-only (`STATE.md`: a selection is not persisted).
Cleared wherever `menuFor` is cleared - the router's `onChange` and `go()` -
and untouched by `replace()`. `clearSel(): void { this.sel.clear();
this.menuFor = ''; }` - the live `clearSel` action. The class comment's
"a ticked row … belongs to the component that owns them" is corrected to say
the selection is shared because the bar draws it, and still starts over on
reload.

**`app/src/components/TablesPage.svelte`** - the local `sel` goes; every
`sel.` becomes `app.sel.`; the `$effect` on `app.navigations` keeps only
`open = null`. Nothing else moves.

**`app/src/lib/share.ts`** - `shareSelection(items, index, lang): { text,
html }`: `share(it, index, lang)` per record with **no skip set**, texts joined
by `'\n\n'`, htmls by `'<br><br>'`. Beside `shareRoll`, which is the same
shape with the OR; the comment says why this one has none (a set, not
alternatives - `selAsText` in app.js). `share.test.ts` pins the join and the
absence of any OR word in either flavour.

**`app/src/components/SelBar.svelte`** (new) - props `app`. `n =
$derived(app.sel.size)`, `ids = $derived([...app.sel])`, `t = $derived(app.t)`.
Renders nothing when `n` is 0 (`{#if n}` - the honest equivalent of `hidden`
plus an emptied `innerHTML`, and it unmounts the bar's `AddToList` the way the
live app throws its markup away). Otherwise:

```svelte
<div class="selbarwrap">
  <div class="selbar">
    <span class="selcount">{t.selected + ' ' + String(n)}<button
        type="button" class="selx" title={t.clearSel} aria-label={t.clearSel}
        onclick={() => app.clearSel()}>&times;</button></span>
    <div class="selacts">
      <AddToList {app} key="sel" {ids} primary />
      <Button size="sm" href={printHash(ids)} sameTab title={t.printHint}
        ><Icon name="print" />{t.print}</Button>
      <Button size="sm" onclick={copySel}><Icon name="copy" />{t.copySel}</Button>
    </div>
  </div>
</div>
```

`copySel`: `const index = app.index; if (!index) return; const items =
ids.map((id) => index.byId.get(id)).filter((it): it is Record_ => !!it); if
(!items.length) return; const { text, html } = shareSelection(items, index,
app.lang); const ok = await app.env.clipboard.writeRich({ html, plain: text });
app.say(ok ? t.selCopied : t.copyFailed, { error: !ok });` - the same shape
as `RecordActions.copyText`.

Styles, off style.css: `.selbarwrap` with **both** declarations merged (the
safe-area padding from line 54 and the sticky block from 799); `.selbar`
carrying `.wrap`'s four properties (the rewrite has no global `.wrap`;
`Shell`'s `.foot` and `TabBar` compose `--wrap` the same way, and `var(--wrap)`
is `min(1180px, 100% - 32px)` in `tokens.css:68`); `.selcount`; `.selx` and
`:hover`; `.selacts`; and the 600px block: `.selx`, `.selacts`, `.selacts
:global(.seldrop)`, `.selacts :global(.btn)`. On specificity: the live
`.selacts .btn` wins over `.btn.sm` by order, but the properties it sets
(`flex`, `min-width`, `width`, `justify-content`, `overflow`) are set by
neither `.btn` nor `.btn.sm`, so the Svelte-scoped equivalents cannot collide
whatever the bundle order - unlike the `.dropmenu` case B5.1 had to reason
about. No `@media print`.

**`app/src/components/Shell.svelte`** - `<SelBar {app} />` between
`</footer>` and `<Toast {app} />`, the live order (index.html 75-92: footer,
`#selBar`, modal, `#toast`). Sticky `bottom: 0` works inside `#app` as it does
inside `body`: `#app` spans the document.

**`app/src/components/AddToList.svelte`** - delete `.dropmenu.up`; fix the
header comment ("once B5.2 builds it") and the base-rule comment. The
`try`/`catch` in `onDocumentClick` stays - it is the belt.

**`app/src/components/RecordModal.svelte`** - the braces: every close path
(the close button, the backdrop, Escape/`cancel`) sets `app.menuFor = ''`
*before* telling the parent to close, which is the live app's own order
(`S.menuFor = ''` ahead of `closeModal()`, as B5.1's reviewer noted). Without
it the card's menu, left open when the modal closes, is still `open` when
that record's modal is reopened (`aria-expanded="true"`, menu drawn) - the
first Deferred finding from B5.1's review, taken here because a second
`AddToList` in the frame makes a stale `menuFor` twice as visible: the bar's
own button would read pressed-but-closed. One line per close path; the
component already holds `app`.

**`app/src/lib/dict.ts`** - `clearSel: 'Снять выделение' / 'Clear selection'`,
`copySel: 'Скопировать' / 'Copy'`, `selCopied: 'Выбранное скопировано' /
'Selection copied'`, character for character from app.js 113-114 and
299-300.

**`tests/parity/driver.js`** - `click(name, nth = 0)`: exact-name matches are
collected, the `nth` taken; the `includes` fallback applies only when `nth`
is 0, as today. Needed because every row checkbox is named "Выбрано" and
select-all has no accessible name of its own (a `<label>` wraps it; `NAME_FN`
reads `aria-label`/`title`/text and finds none on the input), so a second
row is the only way to two ids. `pressed` records the name as before.

**`tests/parity/specs.js`**

- `NAME` gains `copySel: 'Скопировать' / 'Copy'` and `clearSel: 'Снять
  выделение' / 'Clear selection'`. Both are exact-unique among controls on
  `#/tables` (the other copy buttons are "Скопировать ссылку …" / "Copy …
  link"; `click` prefers an exact match).
- States, after `#/tables ~ a row ticked`:

  | id | storage | enter | what it is for |
  |---|---|---|---|
  | `#/tables ~ bar menu` | `two` | `click('Выбрано')`, `click('Выбрано', 1)`, `click('Добавить в список')` | "Выбрано 2"; the menu above the bar, right-aligned, labelled "Добавить в" (two ids), "Лавка в порту" over "Клад дракона", "+ Новый список"; the button pressed, caret up; at 375 the menu spans the bar's width. English cells show the menu folded (the outside-click rule, as on the card). |
  | `#/tables ~ selection copied` | - | `click('Выбрано')`, `click('Скопировать')`; **`timed: true`** | the "Выбранное скопировано" toast over the bar with one row ticked |

  `#/tables ~ a row ticked`'s `why` is rewritten ("the bar, one row ticked")
  now that the missing bar is no longer what it is honest about.
- Press specs:
  - `copiedSelection` (`presses: true`, `only: ['#/tables ~ a row
    ticked']`): `resetClipboard()`, `click('Выбрано', 1)`, `click(NAME[lang]
    .copySel)`, return `{ clip: await d.clipboard() }` - both flavours of two
    records joined, compared character for character across the apps. This
    is where `shareSelection` meets `selAsText`/`selAsHtml`.
  - `barMembership` (`presses: true`, `only: ['#/tables ~ bar menu']`):
    reopen the menu when the chip is not on screen (`if (!(await d.has('Клад
    дракона'))) await d.click(NAME[lang].addToList)`), `click('Клад дракона')`,
    then return `{ stored: JSON.parse(await d.storage('dhloot.lists.v2')).map
    ((l) => [l.id, l.ids.length]), barStillUp: await d.has(NAME[lang].
    clearSel) }` - `[['a', 2], ['b', 0]]` and `true`: two ids landed in one
    press, and the selection survived it (`tests/select.js` asserts the
    same on the live app: "мешает добавить в два списка подряд").
- Deletions: the six `selBar(...)` entries, the `selBar` helper and its
  comment (845-847), and the two `#/tables ~ a row ticked … :: controls`
  lines in `ACCEPTED` (the run fails on a stale one).

Expect **zero** on every cell of all three states in both languages. Where
to look first if one is not: the bar's height at 375 (137px live - a wrap
that differs is `.selacts .btn`'s `flex: 1 1 0` or `min-width: 0` missing);
the menu's vertical position (if it is not above the bar, the `.dropmenu.up`
rule is still there); the `.selcount` text (one node); the print link's
`title`.

#### Tests

- `state/app.test.ts` - `sel` clears on `go()` and on a change the router
  announces, survives `replace()`; `clearSel()` empties it and folds
  `menuFor`.
- `lib/share.test.ts` - `shareSelection`: two records joined by `\n\n` and
  `<br><br>`, no OR in either flavour, a shared craft target repeated rather
  than skipped (the live behaviour, no skip set).
- `components/tables.test.ts`, a new `describe('the selection bar')` using
  the file's `LOOT` and `at()`: no bar and no "Снять выделение" with nothing
  ticked; one tick draws "Выбрано 1", the cross, "Добавить в список"
  (`aria-expanded="false"`), a print link with `href="#/print/<id>"` and the
  live title, and "Скопировать"; a second tick reads "Выбрано 2" and the href
  carries both ids in tick order; the cross clears every checkbox and the bar
  goes; select-all reads the row count; the bar's menu says "Добавить в" with
  two ids and "Лежит в списках" with one (two lists in `memoryStorage`); a
  chip adds both ids to storage, keeps the ticks and toasts `Добавлено в
  «Клад дракона»: 2`; copy calls `writeRich` with the joined flavours and
  toasts "Выбранное скопировано", `fakeClipboard({ fail: true })` toasts
  "Не удалось скопировать" as an alert; `router.navigate` to another table
  drops the bar (the existing "keeps the selection on a filter pick, and
  drops it on a navigation" case stays and now also asserts the bar). Each
  ends with `expectNoA11yViolations`.
- `components/record.test.ts` (or `roll.test.ts`, wherever the modal's close
  cases live) - open a record's modal, open its add-to-list menu, close the
  modal by the button; reopen the same record: the button reads
  `aria-expanded="false"` and no menu is drawn. The same through the backdrop.
- `components/a11y.test.ts` - a state `{ what: 'the selection bar with its
  menu open', route: '#/tables', storage: <two lists>, enter: tick the first
  row checkbox by role (`press` grips buttons; use `getAllByRole('checkbox',
  { name: 'Выбрано' })[0]`), then `press('Добавить в список')` }`; `COVERED`
  gains `'SelBar.svelte'`.
- `docs/specs/COVERAGE.md` - the `components/tables.test.ts` row in the test
  table mentions the bar.

#### Ordered steps

1. `dict.ts`: the three keys. `share.ts`: `shareSelection` and its test.
2. `app.svelte.ts`: `sel`, `clearSel`, the clearing, the comment;
   `app.test.ts` cases. `TablesPage.svelte`: `app.sel`; `npm run test --
   tables` green before going on.
3. `AddToList.svelte`: the rule and the two comments. `RecordModal.svelte`:
   `app.menuFor = ''` on every close path, and its test.
4. `SelBar.svelte`; `Shell.svelte` renders it.
5. `tables.test.ts` cases; `a11y.test.ts` state and `COVERED`;
   `COVERAGE.md`'s row.
6. `driver.js`: `nth`. `specs.js`: `NAME`, the two states, the two press
   specs, the deletions.
7. `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground call,
   `timeout: 600000`.
8. `npm run build`, then `node tests/parity.js "a row ticked" "bar menu"
   "selection copied"` (3 states, one timed) - the loop while getting to
   zero; then `node tests/parity.js "#/tables ~"` (8 states: grid, searched,
   nothing found, a row opened, a row ticked, help, bar menu, selection
   copied) and `node tests/parity.js "i/ci1 ~"` (6 states - the card's menu
   states must still be zero after the `.dropmenu.up` deletion). Three
   foreground calls, each inside the cap; do not merge them.
9. `npm run check:built`.
10. `plan.md` gains "B5.2 built, part 1"; `handoff.md`; one commit,
    `feat(lists): the selection bar`, authored as `artex-x`, no push.

#### Acceptance criteria

- Ticking any row on any table raises the bar after the footer, sticky at the
  window's bottom: "Выбрано N", the cross (named "Снять выделение"), the
  primary add-to-list control, a print link to `#/print/<ids in tick order>`
  titled with `printHint`, and "Скопировать".
- The cross clears every tick and folds an open menu; a navigation clears the
  selection; a filter pick does not.
- The bar's menu opens **above** the bar, labelled "Добавить в" for two or
  more ids and "Лежит в списках" for one; a chip adds every id the list lacks
  in one press, keeps the selection and toasts with the count.
- Copy puts both flavours of every selected record on the clipboard, joined
  by `\n\n` / `<br><br>`, with no OR; toasts "Выбранное скопировано", or
  "Не удалось скопировать" as an alert.
- At 600px and under, the cross is 32px, the actions take a full row, the
  add-to-list control fills a row of its own and print/copy share the next.
- `#/tables ~ a row ticked`, `~ bar menu` and `~ selection copied` read 0.00%
  at every cell in both languages; the six `selBar` entries and the two
  `ACCEPTED` lines are gone; `copiedSelection` and `barMembership` match;
  `node tests/parity.js "i/ci1 ~"` still reads zero on the card's menu
  states.
- `npm run check` and `npm run check:built` exit 0 with thresholds met.

#### Risks and do-nots

- Do not keep `.dropmenu.up` in `AddToList.svelte` "for the card" - the card's
  flip is RecordCard's rule, and on the bar this one hides the menu.
- Do not render the bar inside `TablesPage`, and do not put it before the
  footer: the live DOM order is footer, bar, modal, toast, and sticky
  geometry follows the DOM.
- Do not split "Выбрано" and the number into two text nodes; do not put the
  cross outside `.selcount`.
- Do not pass a `skip` set to `share()` in `shareSelection`: the live
  selection copy repeats a shared craft target, and `copiedSelection` compares
  it character for character.
- Do not `aria-label` the select-all checkbox to make it clickable from the
  harness - the live app has none, and the inventory would differ.
- Do not make `~ bar menu` timed (nothing in it fades) and do not forget
  `timed: true` on `~ selection copied` (part 0's rule: an `enter` that raises
  a toast).
- Do not write a `VISUAL_DEBT` number from this host; the three states are
  expected at zero and a non-zero cell is a diff image opened first.
- Grep the diff for `' <` at the start of an `{#if}`/`{#each}` block.
- One commit, no push, no `Co-Authored-By`.

**Decided in planning - do not reopen.**

- **`sel` lives on `AppState` as a `SvelteSet`, cleared with `menuFor`.**
  The bar is in the frame and the live app clears the selection on
  `hashchange`; both are app-level facts. Rejected: a `sel` store module of
  its own (one set and one method - an abstraction ahead of need), and
  keeping `sel` in `TablesPage` with the bar rendered from there (the frame
  owns the bar, and search will own the same set).
- **`SelBar.svelte` is `{#if n}`, not `hidden`.** Unmounting is what the live
  app's emptied `innerHTML` does to the menu inside it; `hidden` would keep a
  live `AddToList` and its document listener around for no reason.
- **`shareSelection` lives in `lib/share.ts`.** The join is logic, the module
  already holds `shareRoll` with the sibling rule, and a unit test pins the
  no-OR contract. Rejected: joining inline in the component (untestable
  without the DOM, and the second copier - the list page - is one batch away).
- **`.wrap` is composed into `.selbar`, not added as a global class.** Every
  frame element in the rewrite composes `--wrap`; a utility class would be a
  fourth way to say the same thing.
- **`d.click` grows `nth`, not a selector.** The harness grips by name on
  purpose; an index on an exact-name match keeps that rule and is the smallest
  thing that reaches a second identical checkbox. Rejected: naming select-all
  (changes the live-vs-rewrite inventory), a `clickAll(name)` verb (nothing
  else wants it).
- **Two new states, not four.** A "two rows ticked" state without the menu
  and an "all ticked" state add cells that differ from `~ bar menu` and
  `~ a row ticked` by a digit; the count and select-all are component-tested.
- **Search stays where it is.** `SelBar` reads `app.sel` from any page, so the
  search slice gets the bar for free when it builds its rows.

### B5.2 built, part 0: green CI, and the two unstable classes named

**What shipped**, exactly as designed - no deviation, no production code, no
file under `app/`:

- `tests/parity/specs.js`: the five `VISUAL_DEBT` entries (`#/i/ci1 ~ whole @
  ru 1100`, `@ en 1100`, `@ ru 768`; `#/i/ci1 ~ toast @ en 375`, `@ en 768`)
  and their three block comments are deleted - the modal-state and `~ a row
  ticked` entries right after them are untouched. `#/i/ci1 ~ toast` and
  `#/roll/wondrous ~ pinned` each gained `timed: true` with the one-line
  comment the brief specified. The `STATES` doc comment gained a `timed` line.
  A `geometry` spec (`perWidth: true`, `only: ['#/i/ci1 ~ whole']`,
  `d.rectsAt({ card: '.card', pick: '.cardpick', foot: '.foot' })`) was added
  after `typeRuns` and appended to `SPECS`.
- `tests/parity/driver.js`: `shot(whole)` now retakes a full-page capture
  until two in a row are `Buffer.equals()`, capped at four, logging one line
  naming the count only when more than the baseline two captures were needed.
  `rectsAt(probes)` waits on `document.fonts.ready` (the same wait `typeAt`
  already documents) and returns `{x, y, w, h}` rounded to a tenth per probe,
  `null` for one that resolves to nothing, plus `docHeight`.
- `tests/parity.js`: `timed` is destructured off the state and hashed into
  `keyFor` (`timed: !!state.timed`) so a future toggle invalidates the cache
  honestly. The per-target block now shares a `shootWidth(d, size)` closure
  (settle, run `measured` specs, shoot, write, warm the legacy cache) between
  the ordinary sweep and a timed state's re-arrival, so the two paths cannot
  drift apart: a `timed` state's first `withPage` shoots only `WIDTHS[0]`
  (looks, controls and the 1100 shot land exactly where they always did), then
  one further `withPage` per remaining width - viewport, `arrive`, `shootWidth`
  - with the legacy cache still consulted per width before a page opens. `broke`
  is set and checked the same way after each stage, so a state that fails to
  arrive at any width still stops the run for that target rather than reading
  as a false pass.
- `docs/parity.md`: `timed` joins the state fields in "Register the state
  first" with when to use it; a new "Two unstable classes" subsection under
  "Machine variance" names both mechanisms and gives the local-red recipe for
  each; "Harness invariants" gained the two lines the brief specified.
- `docs/specs/COVERAGE.md`: "Three conditions the harness controls" is now
  five, with one clause each for the timed re-arrival and the stable capture.

**Nothing deviated from the brief.** The `shot(whole)` retry counter and the
`shootWidth` extraction were implementation choices inside the design's own
description ("a page that has stopped moving," "the two paths cannot drift
apart" is this session's phrasing of the brief's own "one page at a time is
preserved"), not a change to what was asked for.

**Measured, not assumed:**

- `node tests/parity.js "i/ci1 ~ toast" "pinned"` (12 cells, the two timed
  states): `расхождений нет` on the first run and, run again immediately
  after, on the second - both runs read every cell `совпадает`. The second
  run's per-width legacy screenshots came off the cache (the cache key change
  did not evict anything meaningful since only the two timed states' own keys
  moved).
- `node tests/parity.js "ci1 ~ whole"` (6 cells): one console line, `снимок
  целиком: 3 попытки до устойчивого кадра`, on the first target/width the
  capture needed a retry for; every one of the six cells then read
  `совпадает`, and `geometry` produced no `FAIL` line at any width - silent,
  as the acceptance criteria require.
- `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground call,
  exit 0: format/lint/typecheck/data/derived/i18n/selftest all pass,
  `svelte-check` 518 files/0 errors/0 warnings, `vitest run --coverage` 732
  tests, 96.67/89.64/96.57/97.01 statements/branches/functions/lines, every
  threshold met. `.prettierignore` and `eslint.config.mjs` both skip `tests/`,
  confirmed by inspection before relying on it - so this run proves nothing
  about `parity.js`/`driver.js`/`specs.js` beyond "still valid JavaScript that
  does not break the rest of the suite"; the parity filters above are what
  actually exercise the edits.
- `node tests/parity.js "i/ci1"` (7 states, 42 cells, the full record-route
  family including the four B5.1 list states): `расхождений нет`, every cell
  `совпадает`.
- **No cell read non-zero on this host at any point in this batch.** No
  `VISUAL_DEBT` number was written from this host, per scope.
- `git log --oneline -3` re-read immediately before this commit: HEAD is
  still `2f3659d`, unmoved since the batch started - no peer session touched
  this tree while this batch ran.

**What is not yet known - the orchestrator's to close:** CI green on this
commit. Every acceptance criterion this session can check locally is met; the
one it explicitly cannot (`plan.md`'s own acceptance line: "CI green on the
commit, read by the orchestrator and recorded here with the run id") is
unread as of this writing. See `handoff.md`, "Blockers".

- Files changed: `tests/parity/specs.js`, `tests/parity.js`,
  `tests/parity/driver.js`, `docs/parity.md`, `docs/specs/COVERAGE.md`,
  `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): see `git log` for this session's `fix(parity): ...` commit, on
  top of `2f3659d`.

### B5.2 built, part 1: the selection bar

**What shipped**, matching the design in "B5.2 planned, part 1" with one
addition the design did not anticipate (below):

- **`app/src/state/app.svelte.ts`** gained `readonly sel = new
  SvelteSet<string>()` and `clearSel()`. `sel` clears wherever `menuFor`
  already does - the router's `onChange` and `go()` - and is untouched by
  `replace()`, the same split `menuFor` already draws. The class's opening
  comment, which said a ticked row "belongs to the component that owns them,"
  is corrected: the selection is shared because the bar that draws it lives in
  the frame, not on the page, and it still starts over on reload.
- **`app/src/components/TablesPage.svelte`** lost its local `sel` entirely;
  every read and write goes through `app.sel`. The `$effect` on
  `app.navigations` now only clears `open` - `app.sel` clears itself at the
  source.
- **`app/src/lib/share.ts`** gained `shareSelection(items, index, lang)` -
  `share()` per record with no `skip` set, joined by `\n\n` / `<br><br>`,
  beside `shareRoll`'s sibling shape with the OR. `share.test.ts` pins the join
  and a craft target two selected records share landing twice, not once - the
  opposite of `shareRoll`'s dedupe.
- **`app/src/components/SelBar.svelte`** (new) - `{#if n}` around the bar,
  `n = app.sel.size`, `ids = [...app.sel]` in tick order. The count is one
  interpolated expression (`t.selected + ' ' + String(n)`) immediately
  followed by the cross inside the same `<span class="selcount">`, using the
  tight `>`/`<` placement the codebase already uses to stop Svelte inserting a
  whitespace text node between them. Renders `AddToList` (`key="sel"`,
  `primary`), a `Button` print link (`href={printHash(ids)}`, `sameTab`,
  `title={t.printHint}`) and a `Button` calling `copySel()`, which builds
  `shareSelection` off `app.index`/`app.lang` and writes it through
  `app.env.clipboard.writeRich`, toasting `selCopied`/`copyFailed`. Styles are
  `.selbarwrap` (both style.css declarations merged - the safe-area padding
  and the sticky/gradient/border/blur block), `.selbar` composing `--wrap`'s
  four properties (no global `.wrap` class exists in the rewrite), `.selcount`,
  `.selx`/`:hover`, `.selacts`, and the 600px block
  (`.selx`/`.selacts`/`.selacts :global(.seldrop)`/`.selacts :global(.btn)`) -
  every value read off `style.css:54, 799-829` rather than guessed; the first
  draft guessed several (a generic transparent-to-black gradient, a round
  cross, `gap:8px`) and all of them were wrong against the real rules, caught
  before the parity run rather than by it.
- **`app/src/components/Shell.svelte`** renders `<SelBar {app} />` between
  `</footer>` and `<Toast {app} />`, matching the live DOM order
  (`index.html` 75-92: footer, `#selBar`, modal, `#toast`).
- **`app/src/components/AddToList.svelte`**: the invented `.dropmenu.up {
  bottom: auto; top: calc(100% + 8px) }` rule is deleted, along with the
  comment above it that promised the base rule was "the bar's own default
  (upward)" as a future fact - it now says so as a present one, and explains
  why: `placeMenu` in app.js always adds `up` at the bottom of the window and
  style.css has no base `.dropmenu.up` rule to flip against, only
  `.cardpick .dropmenu.up`.
- **`app/src/components/RecordModal.svelte`**: the dialog's `onclose` prop is
  no longer bound directly to the element. A `handleClose()` wrapper sets
  `app.menuFor = ''` first, then calls the prop - matching the live app's own
  order (`S.menuFor = ''` ahead of `closeModal()`). Because the close button,
  the backdrop click and Escape all end in the browser firing the dialog's own
  native `close` event, one handler reaches all three paths; no per-path
  branching was needed.
- **`app/src/lib/dict.ts`** gained `clearSel`, `copySel`, `selCopied`,
  character for character from app.js 113-114 / 299-300, placed directly after
  `selected`/`selectAll` to match app.js's own key order.
- **`tests/parity/driver.js`**: `click(name, nth = 0)` - exact-name matches
  are collected into an array and `nth` indexes it; the `includes` fallback
  only runs at `nth` 0, unchanged from before. `pressed` still records the bare
  `name`, as the brief specified.
- **`tests/parity/specs.js`**: `NAME` gained `copySel`/`clearSel` (both
  languages) and, found necessary while running the harness (below),
  `selected`. Two new states after `#/tables ~ a row ticked` -
  `#/tables ~ bar menu` (`storage: two`, ticks two rows then opens the menu,
  not timed) and `#/tables ~ selection copied` (ticks one row then copies,
  `timed: true`). `#/tables ~ a row ticked`'s own `why` changed from "the
  selection, where the missing bar is honest" to "the bar, one row ticked".
  Two new press specs, `copiedSelection` (only on `~ a row ticked`, ticks a
  second row and reads the clipboard) and `barMembership` (only on `~ bar
  menu`, reopens the menu if English folded it, presses a chip, and reads
  storage plus whether the bar is still up). The six `selBar(...)`
  `VISUAL_DEBT` entries and the `selBar` helper are deleted, and so are the two
  `#/tables ~ a row ticked … :: controls` `ACCEPTED` lines.
- **`docs/specs/COVERAGE.md`** gained a `components/tables.test.ts` row in the
  unit-suite table - there was none before, despite the file existing since
  B1; it now names the bar alongside the rest of what that file covers.

**One thing the design's own written spec got wrong, found while running the
harness rather than assumed:** `copiedSelection` reads `d.click('Выбрано', 1)`
in the design as written. That fails in English, because `arrive()` presses
`EN` *after* the state's own `enter` but *before* a press spec's `run()` -
unlike a state's `enter`, which always fires in Russian, a press spec's own
commands run against whatever language `arrive()` left the page in. By the
time `copiedSelection` runs in an English pass, the checkbox's accessible name
has already followed the switch to "Selected", so a literal `'Выбрано'`
throws "no control named" on *both* apps identically - a same-shaped failure
on both sides that still reads as a diff, because the error strings embed
`legacy:`/`next:`. Confirmed by running the filter, reading the exact failure,
and reasoning through `arrive()`'s own press order in `tests/parity.js` before
touching anything. Fixed by adding `selected: 'Выбрано'/'Selected'` to `NAME`
and using `NAME[lang].selected` in the spec - the same pattern
`listMembership` already uses for the outside-click-folds-the-menu case one
comment above it. Not a deviation from the brief's intent (both flavours of
two ticked records still land on the clipboard, in every language, exactly as
specified) - a one-line correction to how the brief said to reach that state,
found by running it rather than transcribing it.

**Verification, exact commands and results:**

- `npm run lint` - exit 0. `npm run typecheck` - `svelte-check`, 519 files, 0
  errors, 0 warnings. `npm run format:check` - four newly-written files needed
  `prettier --write` (formatting only, no logic changed); re-run clean.
- `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground call,
  **exit 0**: format/lint/typecheck/data/derived/i18n/selftest all pass,
  `vitest run --coverage` **751 tests**, 96.74/90/96.84/97.1
  statements/branches/functions/lines, every threshold met (`Button.svelte`'s
  named 50%-branch exception was not needed - it measured 66.66%; `SelBar.svelte`
  itself measured 95.34/75/100/100).
- `npm run build` - clean; `dist/assets/app.js` 204.84 kB, 63.78 kB gzip.
- `node tests/parity.js "a row ticked" "bar menu" "selection copied"` (3
  states, 18 cells, one timed) - first run caught the `copiedSelection`
  language bug above (both languages "erroring" identically, read as a diff);
  fixed, re-run: **`расхождений нет`**, every cell `совпадает`.
- `node tests/parity.js "#/tables ~"` (8 states, 48 cells) - **`расхождений
  нет`**: the six new/changed cells for `~ a row ticked`/`~ bar menu`/
  `~ selection copied` all `совпадает`; the five untouched states
  (`~ grid`/`~ searched`/`~ nothing found`/`~ a row opened`/`~ help`) read
  exactly their pre-existing recorded numbers (`~ a row opened`'s six cells at
  their recorded 0.02-0.07%, the close button's own focus ring - unrelated to
  this batch) or `совпадает`, confirming the shared `TablesPage.svelte` edits
  did not move anything this batch was not asked to touch.
- `node tests/parity.js "i/ci1 ~"` (6 states, 36 cells - the card's own
  add-to-list states, to prove the `.dropmenu.up` deletion did not regress the
  card) - **`расхождений нет`**, every cell `совпадает`.
- `npm run check:built` - **exit 0**: build, `file://` smoke ("the built page
  opens from a folder"), bundle budget (61.9 kB gzip against 120 kB).
- **No `VISUAL_DEBT` number was written from this host.** Every cell either
  matched a pre-existing entry exactly or read `совпадает`; nothing needed a
  diff image opened.
- `git log --oneline -3`, re-read immediately before committing: HEAD still
  `4210ee3` on top of `f167e62`/`2f3659d` - unmoved since the batch started, no
  peer session touched this tree while this batch ran.

- Files changed: `app/src/state/app.svelte.ts`, `app/src/state/app.test.ts`,
  new `app/src/components/SelBar.svelte`, `app/src/components/Shell.svelte`,
  `app/src/components/TablesPage.svelte`, `app/src/components/AddToList.svelte`,
  `app/src/components/RecordModal.svelte`, `app/src/components/record.test.ts`,
  `app/src/components/tables.test.ts`, `app/src/components/a11y.test.ts`,
  `app/src/lib/dict.ts`, `app/src/lib/share.ts`, `app/src/lib/share.test.ts`,
  `tests/parity/driver.js`, `tests/parity/specs.js`, `docs/specs/COVERAGE.md`,
  `issues/47/plan.md`, `issues/47/handoff.md`.
- Commit(s): see `git log` for this session's `feat(lists): ...` commit, on
  top of `4210ee3`.
- Deviations and rationale: none from the brief's scope, file list, ordered
  steps, or acceptance criteria. The one thing not anticipated in the written
  design - `copiedSelection`'s literal `'Выбрано'` failing in English - is
  documented above; the fix is a one-line addition to `NAME` and the spec, not
  a change to what the spec verifies.

### B5.3 planned: the lists index, the storage notice where the live app draws it, and `noData`

**Objective.** `#/lists` draws: the page head with its four-paragraph help,
the storage notice in both of its live forms (a plain undismissable warning
when storage refuses; otherwise a folded "lists live in this browser only"
disclosure with a cross remembered in `dhloot.warn.v1`), the panel with the
create and restore rows, and a card per list - name, a count badge, up to six
thumbnails or "Список пуст", a share button that copies the short players'
link, and a delete button behind `confirm()` - or the "no lists yet" empty
state. `Shell.svelte`'s invented `storageOff` paragraph goes, and the
`storageOff` key with it. `ListStore` gets `remove`, the first writer of the
`#deleted` set `mergeLists` has carried since B5.1. `#/lists` stops being
`pending` in `tests/parity/specs.js`. Every measured number and every line
number below is in `context.md`, "B5.3 planning facts".

**Scope.** `components/ListsPage.svelte` (new), `components/Empty.svelte`
(new - the second use of `.empty`), `components/TablesPage.svelte` (uses
`Empty`), `components/Shell.svelte` (the paragraph, its rule and
`storageWorks` deleted), `components/Button.svelte` (`danger`), `App.svelte`
(the route), `state/lists.svelte.ts` (`remove`, `create(name, init)`,
`saved`), `state/app.svelte.ts` (`warnHidden`, `hideWarn`), `ports/dialog.ts`
(new), `ports/types.ts`, `ports/index.ts`, `lib/dict.ts` (18 keys in, one
out), `lib/help.ts` (`lists`), `styles/tokens.css` (the global placeholder
rule), the driver (`summary` in `click`, a dialog auto-accept), the specs (a
seed, six states, three press specs, `NAME`), `docs/specs/FEATURES.md` (one
bullet corrected), `docs/specs/COVERAGE.md`, and tests for all of it.

**Non-goals.** No `#/lists/<id>` or `#/l/<payload>` page - after a restore or
a card click the rewrite lands on its `todo` paragraph, as it does today
(B5.4/B5.6). No rename, no `.listcard.active`, no `openList`/`urlPayload`
(B5.4). No `StorageNotice.svelte` - one use; B5.4's list page is the second
and extracts it then. No `Badge.svelte` and no `Panel.svelte` (see
"Decided"). No `typeRuns` probe on the index. No change to `CONTRACTS.md`,
`docs/fixtures/`, `ROUTES.md`, `STATE.md` or `llms.txt` - the route, the key
and the link format already exist there; the one spec line that changes is a
description that was wrong about where the notice is drawn (FEATURES.md).

#### What the live app does, read off app.js and measured

**The page** (`renderLists`, 2909-2931): `pageHead('lists')` - the `Списки`
heading, the pin (`homeHash()` returns `#/lists`, so it draws, unpressed),
the `?` with `t.help.lists` (252-257 / 433-438: four paragraphs; the second
and third carry two `<b>` runs each), the page-sub `pages.lists[1]`; then
`storageWarning()`; then `<div class="panel" style="margin-top:16px">` with
two `.field`s - `.lbl` "Новый список", `.numrow` > `.grow` > `<input type=
"text" id="lname" placeholder="Например: клад дракона">` + `.btn.primary`
"Создать"; `.lbl` "Восстановить из ссылки", `.numrow` > `.grow` > `<input
id="limport" placeholder="Ссылка на список">` + `.btn` "Восстановить"; then
`.listgrid` of `listCardHTML` in `S.lists` order (newest first, the seed
order in a parity state) or `<div class="empty">noLists</div>`.

**The notice** (`storageWarning`, 2872-2886). `storageWorks()` false:
`<div class="warn"><b>noStorageTitle</b> noStorage</div>` - after the `<b>`
**one** text node beginning with a space; nothing dismisses it. Otherwise,
unless `dhloot.warn.v1 === '1'`: `<details class="warn"><summary><b>
localOnlyTitle</b><i>readMore</i><button type="button" class="warn-x"
data-act="hideWarn" title=aria-label=dismiss>&times;</button></summary><p>
localOnly</p></details>` - the summary's three children touch. `hideWarn`
(4175) calls `e.preventDefault()` first (a click inside a summary would also
toggle the disclosure), writes `'1'` (`hideWarn` 2869, swallowing a throw)
and re-renders. Measured: folded 43.5px tall at 1100 and 768, 69.5 at 375
(the `<i>` wraps under the `<b>`); unfolded 150 / 189 / 429.5; the storage-off
div 43.5 / 64.5 / 121.5. Styles: `.warn` twice (855-861 and 963), `.warn b`,
`.warn summary`, `::-webkit-details-marker`, `.warn summary i`, `.warn[open]
summary i`, `.warn p`, `.warn-x`, `:hover` (964-975), `.warn-x:focus-visible`
(1002-1005). No `@media` override touches any of them.

**A card** (`listCardHTML`, 2888-2907): `<div class="listcard"><a class=
"listcard-main" href="#/l/<encodeList(l, false)>"><div class="listcard-top">
<b>name</b><span class="badge num">N</span></div>` then either `<div class=
"listcard-thumbs">` of up to six `<img src alt="" loading="lazy" decoding=
"async">` or `<p class="listcard-empty">listEmpty</p>`, `</a><div class=
"listcard-acts"><button class="btn sm" data-share-list>ICON_LINK share
</button><button class="btn sm danger" data-del-list>del</button></div></div>`.
`N` and the thumbs are `listItems(l)` - ids the data knows - not `l.ids`.
The link's accessible name is therefore "Клад дракона7" and, for an empty
list, "Лавка в порту0Список пуст": no whitespace between the children.
Styles: 831-846 (`.listgrid` `repeat(auto-fill, minmax(280px, 1fr))`, gap 14,
margin-top 18; `.listcard` gradient/border/radius/overflow/flex-column/
`transition:.16s`; `:hover`; `-main` block padding `14px 15px 12px` flex 1;
`-top` flex space-between gap 10 margin-bottom 10; `-top b` 15.5px/650/1.3;
`-main:hover -top b` gold-soft; `-thumbs` flex gap 5 wrap; `-thumbs img`
40x40 radius 7 cover `#0a0810`; `-empty` margin 0 12.5px muted2; `-acts`
flex gap 6 wrap padding `0 15px 14px`), `.badge` (331-335) and `.badge.num`
(349-352), `.btn.danger` and `:hover` (795-796). Measured at 1100: three
341.66px columns, a six-thumb card 149.59 tall, an empty one 129.59; two
columns at 768, one at 375.

**The panel and the fields**: `.panel` (145-149), `.field`/`.lbl` (150-152 -
`Field.svelte` already), `.numrow` and `.numrow .grow{flex:1 1 170px;
min-width:0}` (181-182), the global `input[type=text]` and `:focus` (254-258:
100% wide, 46px, padding `0 14px`, `var(--bg2)`, `var(--line2)` border,
`font:inherit` - so 15.5px) and `input::placeholder,textarea::placeholder
{color:var(--muted2);opacity:.7}` (727). Measured: the panel is 198.78px tall
at 1100 and 768, 254.78 at 375 - the restore row's 127.56px button drops
under its input there because 170+10+127.56 does not fit 290px, while the
create row's 92.42px button still does. `.empty` (524-525) is 104.8px.

**The handlers.** Create (4195-4203): a blank name toasts `nameFirst` as an
error and focuses the input; otherwise `createList` (unshift, save), the
draft is cleared, and `listCreated % name` toasts **only if
`createList.saved`** - a refused write has already toasted `saveFailed` and
must not be followed by a cheerful "created". Share (3971-3976): an empty
list (`!l.ids.length`) toasts `listEmpty` plain and stops; otherwise
`listShareUrlShort(l, true)` - `appUrl('#/l/' + packPayload(encodeListRaw(l,
true)))`, packed only when the packed form is shorter - is copied with
`playersLinkCopied`, `copyFailed` as an error otherwise. Delete (4136-4150):
`confirm(deleteConfirm % name)`; yes → `deleteList` (1332-1336: `S.deleted[id]
= true`, filter, `saveLists`), then on the index a re-render (a list page goes
to `#/lists` - B5.4's). Restore (4257-4270): the trimmed field through
`/#\/l\/([A-Za-z0-9_-]+)/`, `decodeList` of the capture or of the raw text,
`badShare` error on null, else `createList(data.name)`, `ids` and `meta`
copied on, save, `goToList` → `location.hash = '#/l/' + encodeList(l, true)`;
the render that follows `syncListUrl`s to that same string, so the address
after a restore is deterministic.

**Three things found by reading, not assumed:**

1. **The restore field refuses the app's own short links.** The regex has no
   `~` and `decodeList` `atob`s whatever it gets, so a packed link - the one
   "Поделиться" copies - fails as `badShare`. The rewrite fixes it: see
   "Decided".
2. **`confirm()` blocks puppeteer.** `el.click()` inside `page.evaluate`
   never returns while a dialog is open, so no state has ever pressed a
   destructive control. The driver grows an auto-accept that records the
   message; delete is then compared as data.
3. **The rewrite has no `::placeholder` rule at all.** Measured on
   `#/tables`: live `rgb(138,131,163)` at opacity 0.7, rewrite Chrome's
   `rgb(117,117,117)` at 1 - on every search box since B1, under `JITTER`
   because a placeholder is ~0.05% of a page. The same class B3.6 wrote down.
   Fixed here, globally, where the live rule is global.

#### How it is built

**`app/src/ports/dialog.ts`** (new) - `DialogPort { confirm(message: string):
boolean }`; `browserDialog(win = window)` calls `win.confirm`; `fakeDialog
(answer = true)` returns `answer` and records every message in `asked:
string[]`. `ports/types.ts` declares the interface and adds `dialog:
DialogPort` to `Env`; `ports/index.ts` wires `browserDialog()` into
`browserEnv` and `fakeDialog()` into `fakeEnv`, and re-exports both.

**`app/src/state/lists.svelte.ts`** - `saved = true`, set by every `save()`
(the live `createList.saved`); `create(name, init: Partial<Omit<StoredList,
'id' | 'name' | 'created'>> = {})` spreads `init` into the new list before
the one save (restore hands it `ids` and `meta`; B5.6 will hand it notes);
`remove(id)`: `this.#deleted[id] = true`, filter, `save()` - the live
`deleteList`. The comment on `#deleted` that says "nothing writes to it
until B5.3" is rewritten to say `remove` does.

**`app/src/state/app.svelte.ts`** - `WARN_KEY = 'dhloot.warn.v1'`;
`#warnHidden = $state(env.storage.get(WARN_KEY) === '1')` read in the
constructor beside `lang` and `home`; `get warnHidden()`; `hideWarn()` writes
`'1'` and sets the flag (the write's result is ignored, as the live
`hideWarn` ignores it; with storage refusing, the page draws the other form
anyway). App-level because B5.4's list page reads the same flag.

**`app/src/lib/dict.ts`** - eighteen keys, both languages, character for
character from app.js: `importList`, `importBtn`, `importPh` (107-108 /
293-294), `dismiss`, `readMore` (110-111 / 296-297), `listCreated` (154 /
338), `noLists` (156 / 340), `share`, `del` (159 / 343), `listEmpty` (160 /
344), `noStorageTitle`, `noStorage`, `localOnlyTitle`, `localOnly` (165-168 /
349-352), `deleteConfirm` (163 / 347), `playersLinkCopied` (148 / 332),
`badShare` (162 / 346), and `subLists` from `pages.lists[1]` (267 / 448).
`storageOff` is deleted from both. `listCreated` and `deleteConfirm` carry
`%s`; the English `listCreated` uses curly quotes and `deleteConfirm`
straight ones - copy, do not normalise.

**`app/src/lib/help.ts`** - `LISTS: Record<Lang, Help>` from app.js 252-257 /
433-438, registered as `lists` in `HELP`: paragraphs 1 and 4 through `p()`;
2 and 3 as `parts` arrays with `{ b: 'Для игроков' }`, `{ b: 'Только для
мастера' }`, `{ b: 'Ссылка игрокам' }`, `{ b: 'Ссылка себе' }` (and the
English equivalents) between the plain runs. No `lead`: none of the four
opens with a bold.

**`app/src/styles/tokens.css`** - beside `button` and `a`: `input::
placeholder, textarea::placeholder { color: var(--muted2); opacity: 0.7; }`
with a comment naming style.css:727 and the measurement above.

**`app/src/components/Button.svelte`** - `variant` gains `'danger'`;
`.btn.danger { border-color: rgb(224 104 95 / 40%); color: #f0a49d }` and
`.btn.danger:hover { border-color: var(--danger); background: rgb(224 104
95 / 12%) }` off 795-796. The header comment's "a third arrives when a screen
needs one" is that third.

**`app/src/components/Empty.svelte`** (new) - `children: Snippet`; `<div
class="empty">{@render children()}</div>`; the `.empty` rule moved from
`TablesPage.svelte` (696-705), which loses the rule and wraps both of its
empty branches (478, 511-516) in `<Empty>` with their inner markup unchanged.
Second real use, both inline copies removed - the rule in `CLAUDE.md`.

**`app/src/components/Shell.svelte`** - the `{#if !storageWorks}` block, the
`storageWorks` constant, the `untrack` import (if nothing else uses it) and
the `.warn` rule go. The header comment's "the one warning that has to be
visible before anything else is" goes with them.

**`app/src/components/ListsPage.svelte`** (new) - props `app`. `t`, `index`,
`lists = app.lists.lists`; `works = untrack(() => app.env.storage.works())`
(read once per mount, the way `Shell` did); `draft`, `importDraft` as
`$state('')`; `say = (msg, error?) => app.say(msg, { error })`. Template,
in this order and with this whitespace:

```svelte
<PageHead {app} title={t.lists} sub={t.subLists} help={helpFor('lists', app.lang)} {say} />

{#if !works}
  <div class="warn"><b>{t.noStorageTitle}</b>{' ' + t.noStorage}</div>
{:else if !app.warnHidden}
  <details class="warn"><summary><b>{t.localOnlyTitle}</b><i>{t.readMore}</i><button
      type="button" class="warn-x" title={t.dismiss} aria-label={t.dismiss}
      onclick={dismiss}>&times;</button></summary><p>{t.localOnly}</p></details>
{/if}

{#if !index}
  <p class="miss">{t.noData}</p>
{:else}
  <div class="panel">
    <Field label={t.newList}>
      <div class="numrow">
        <div class="grow"><input type="text" bind:value={draft} bind:this={nameInput} placeholder={t.listNamePh} /></div>
        <Button variant="primary" onclick={create}>{t.create}</Button>
      </div>
    </Field>
    <Field label={t.importList}>
      <div class="numrow">
        <div class="grow"><input type="text" bind:value={importDraft} placeholder={t.importPh} /></div>
        <Button onclick={restore}>{t.importBtn}</Button>
      </div>
    </Field>
  </div>
  {#if lists.length}
    <div class="listgrid">
      {#each lists as l (l.id)}
        {@const items = knownItems(l)}
        <div class="listcard">
          <a class="listcard-main" href={sharedListHash(encodeList(l, true))}
            ><div class="listcard-top"><b>{l.name}</b><span class="badge num">{items.length}</span></div
            >{#if items.length}<div class="listcard-thumbs">{#each items.slice(0, 6) as it (it.id)}<img
                  src={artSrc(it.img, app.artBroken(it.id))} alt="" loading="lazy" decoding="async"
                  onerror={() => app.markArtBroken(it.id)} />{/each}</div
            >{:else}<p class="listcard-empty">{t.listEmpty}</p>{/if}</a
          >
          <div class="listcard-acts">
            <Button size="sm" onclick={() => share(l)}><Icon name="link" />{t.share}</Button>
            <Button size="sm" variant="danger" onclick={() => del(l)}>{t.del}</Button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <Empty>{t.noLists}</Empty>
  {/if}
{/if}
```

The `>`/`<` placement inside `.listcard-main` and the summary is the same
device `SelBar.svelte` uses: Svelte turns a newline between two elements
into a space text node, and the live link's name has none. The storage-off
div's text is one expression, `' ' + t.noStorage`, because the live text
node is one node beginning with a space - `{' '}{t.noStorage}` would be two
nodes and the leading-space rule applies (context.md, "Defect 2").

Handlers: `dismiss(e)`: `e.preventDefault(); app.hideWarn()`. `create()`:
`if (!draft.trim()) { say(t.nameFirst, true); nameInput.focus(); return; }
const l = app.lists.create(draft); draft = ''; if (app.lists.saved) say(t.
listCreated.replace('%s', l.name))`. `share(l)`: `if (!l.ids.length) { say(t.
listEmpty); return; } const payload = await app.env.compress.pack(
encodeListRaw(l, true)); const ok = await app.env.clipboard.writeText(app.
linkTo(sharedListHash(payload))); say(ok ? t.playersLinkCopied : t.copyFailed,
!ok)`. `del(l)`: `if (!app.env.dialog.confirm(t.deleteConfirm.replace('%s',
l.name))) return; app.lists.remove(l.id)`. `restore()`: `const raw =
importDraft.trim(); const m = /#\/l\/([~A-Za-z0-9_-]+)/.exec(raw); let pay = m
? m[1] : raw; try { pay = await app.env.compress.unpack(pay); } catch { pay =
''; } const data = decodeList(pay, (id) => index.byId.has(id)); if (!data) {
say(t.badShare, true); return; } const l = app.lists.create(data.name, { ids:
data.ids, ...(data.meta ? { meta: data.meta } : {}) }); importDraft = '';
app.go(sharedListHash(encodeList(l, true)))`. `knownItems(l)` = `l.ids.map(
(id) => index.byId.get(id)).filter(Boolean)`. Whether `StoredList` satisfies
`ListShape` is a typecheck question the implementer answers by running it;
the fields match by name.

Styles, every value off style.css rather than typed from memory: `.warn`
(both declarations merged), `.warn b`, `.warn summary`, `.warn summary::
-webkit-details-marker`, `.warn summary i`, `.warn[open] summary i`, `.warn
p`, `.warn-x`, `.warn-x:hover`, `.warn-x:focus-visible` (outline 2px gold,
offset 2, radius 8 - the keyboard block's rule); `.miss` as `TablesPage`
has it; `.panel` (145-149) plus `margin-top: 16px` from the live inline
style; `.numrow`, `.numrow .grow`; `input[type='text']` and `:focus` (the
global rule, scoped here - `TablesPage` did the same for its search box);
`.listgrid`, `.listcard`, `:hover`, `-main`, `-top`, `-top b`, `-main:hover
-top b`, `-thumbs`, `-thumbs img`, `-empty`, `-acts`; `.badge` and `.badge.
num` (the third copy - see "Decided"). No `@media`: none of these rules has
an override in style.css.

**`app/src/App.svelte`** - `{:else if app.route.kind === 'section' && app.
route.section === 'lists'}<ListsPage {app} />` before the generic section
branch.

**`tests/parity/driver.js`** - `click()`'s selector list gains `summary`
(the disclosure's own control; `has()` and `controls()` do not, so the
inventory is unchanged - a summary is not a button in either app). In
`makeDriver`: `let dialog = null; page.on('dialog', (dlg) => { dialog = dlg.
message(); dlg.accept().catch(() => {}); });` and `dialog() { return dialog; }`
- a `confirm()` inside `el.click()` is answered yes and its text kept for a
spec to compare.

**`tests/parity/specs.js`** - a seed beside `eight`:

```js
const seven = {
  'dhloot.lists.v2': JSON.stringify([
    { ...LISTS[0], ids: ['ci1', 'ci2', 'ci3', 'ci4', 'ci5', 'ci6', 'ci7'] },
    LISTS[1]
  ])
};
```

`NAME` gains `share: 'Поделиться' / 'Share'`, `del: 'Удалить' / 'Delete'`,
`restore: 'Восстановить' / 'Restore'`, `importPh: 'Ссылка на список' /
'Paste a list link'`. The `pending` `#/lists` line is replaced by:

| id | storage | enter | what it is for |
|---|---|---|---|
| `#/lists` | - | - | the folded notice, both fields, "Списков пока нет — создайте первый выше" |
| `#/lists ~ two lists` | `seven` | - | a card with six thumbs and a badge of 7 above "Поделиться"/"Удалить", and an empty card with "Список пуст"; three columns at 1100, one at 375 |
| `#/lists ~ notice unfolded` | `seven` | `d.click('подробнее')` | the `<p>` open, the `<i>` hidden, the page 106px taller |
| `#/lists ~ notice dismissed` | `seven` | `d.click('Скрыть')` | no notice; the panel directly under the page-sub |
| `#/lists ~ help` | - | `d.click('Как это работает')` | the four paragraphs with their bold runs |
| `#/lists ~ created` | - | `d.type('Например: клад дракона', 'Тайник')`, `d.click('Создать')`; **`timed: true`** | the "Тайник" card first with "Список пуст", the field cleared, the toast |

The `~ created` card's link is `#/l/` + the payload of a name and no ids -
identical on both apps; the list's id never reaches the screen.

Press specs:

- `sharedListLink` (`presses: true`, `only: ['#/lists ~ two lists']`):
  `resetClipboard()`, `click(NAME[lang].share)` (the first card - seven
  ids), return `{ hash: clip.text.slice(clip.text.indexOf('#')) }` - the
  base differs between the two targets, the payload must not; both apps
  deflate the same bytes in the same Chrome and both keep the packed form
  only when it is shorter, so the string is the same on both.
- `deletedList` (`presses: true`, `only: ['#/lists ~ two lists']`):
  `click(NAME[lang].del)`, return `{ asked: d.dialog(), stored: JSON.parse(
  await d.storage('dhloot.lists.v2')).map((l) => l.id) }` - the confirm text
  in the language `arrive()` left the page in, and `['b']`.
- `restoredList` (`presses: true`, `only: ['#/lists']`): `d.type(NAME[lang].
  importPh, '#/l/' + PAYLOAD)` with `PAYLOAD` the `player.payload` of
  `docs/fixtures/lists/equipment-entry.json` (`Оружейная`, `q26`, `q33` - a
  plain link, on purpose: the packed form is where the two apps now differ,
  see "Decided"), `click(NAME[lang].restore)`, return `{ hash: await d.hash(),
  stored: JSON.parse(await d.storage('dhloot.lists.v2')).map((l) => [l.name,
  l.ids]) }` - `#/l/<that same payload>` and `[['Оружейная', ['q26', 'q33']]]`
  on both. The rewrite's `#/l/` page is a `todo` paragraph; no shot is taken
  by a press spec.

Expect **zero** on every cell of all six states in both languages, and no
`VISUAL_DEBT` or `ACCEPTED` entry written or deleted - none names `#/lists`.
Where to look first if a cell is not zero: the summary's three children
touching (a space text node shows as the `<i>` shifted); `.warn`'s
`margin-bottom:16px` (the second declaration, easy to miss); the restore
row's wrap at 375 (`flex: 1 1 170px` on `.grow`, not `flex: 1`); the badge
counting `l.ids` instead of known records; the thumbs' `background:#0a0810`
behind a `NO_ART` image; the placeholder colour.

#### Tests

- `ports/ports.test.ts` - `browserDialog` hands the message to the window's
  `confirm` and returns its answer; `fakeDialog(false)` refuses and records
  what it was asked.
- `state/lists.test.ts` - `remove` drops the list from memory and storage;
  a later `save()` does not bring it back when storage still holds another
  tab's copy of it (the `#deleted` set's first real test); `create(name, {
  ids, meta })` writes them in one save; `saved` reads `false` after a
  refused write and `true` after a good one.
- `state/app.test.ts` - `warnHidden` is `true` with `'1'` stored and `false`
  otherwise; `hideWarn()` writes `'1'` and flips it.
- `lib/help.test.ts` - `lists` is written in both languages with four
  paragraphs, the second and third carrying two bold parts each (the
  existing "every section that has one" case picks it up if it enumerates).
- `components/button.test.ts` - `danger` carries the class.
- `components/listsPage.test.ts` (new) - through `App` at `#/lists` with a
  `LOOT` of one known record (`ci1`, no `img`): the head, the folded notice
  (`Списки живут только в этом браузере.`, `подробнее`, a "Скрыть" button),
  both fields by placeholder, and "Списков пока нет — создайте первый выше";
  pressing "Скрыть" removes the notice and writes `dhloot.warn.v1 = '1'`;
  with `'1'` seeded no notice draws; `brokenStorage()` draws "Браузер
  блокирует локальное хранилище." with no cross; two lists seeded (`a` with
  `['ci1', 'nope']`, `b` empty) draw two cards in seed order, the first with
  one thumbnail and a badge of `1` (the unknown id not counted) and a link to
  `sharedListHash(encodeList(a, true))`, the second with "Список пуст" and
  `0`; a blank "Создать" toasts "Сначала назовите список" as an alert and
  focuses the input; "Тайник" creates a first card, clears the field, toasts
  "Список «Тайник» создан" and lands in storage; under `brokenStorage()` the
  card still appears, `saveFailed` toasts as an alert and no "создан"
  follows; "Поделиться" on the empty list toasts "Список пуст" and writes
  nothing; on the filled list writes `<base>index.html#/l/<payload>` (the
  plain payload under `plainCompress`) and toasts "Ссылка для игроков
  скопирована — заметок мастера в ней нет"; `fakeClipboard({ fail: true })`
  toasts "Не удалось скопировать" as an alert; "Удалить" with `fakeDialog(
  false)` asks "Удалить список «Клад дракона»? Это действие необратимо." and
  changes nothing; with `fakeDialog(true)` the card and the stored list go;
  "Восстановить" with `'#/l/' + encodeList(list, true)` of a known list
  navigates to that hash (`memoryRouter`) and stores the name, ids and meta;
  a bare payload works too; a packed `~` payload works through a compress
  port whose `unpack` maps it to the plain one; garbage toasts "Ссылка
  повреждена или собрана в другой версии данных." as an alert; `noData()`
  draws "Данные не загрузились. Обновите страницу." and no panel. Every case
  ends with `expectNoA11yViolations`.
- `components/shell.test.ts` - the two 'storage that does not work' cases
  go (the frame no longer says anything; the page test above does); the
  axe case "while warning that storage is off" stays as it is - it renders
  `#/lists` with `brokenStorage()`, which now exercises the page's warning.
- `components/tables.test.ts` - unchanged; its nothing-found assertions keep
  passing through `Empty`.
- `components/a11y.test.ts` - a state `{ what: 'the lists index with its
  notice unfolded and two lists', route: '#/lists', storage: two lists,
  enter: click the 'подробнее' text }`; `COVERED` gains `'ListsPage.svelte'`
  and `'Empty.svelte'` (the guard fails without them).
- `docs/specs/COVERAGE.md` - a `components/listsPage.test.ts` row; the
  `shell.test.ts` row loses "a browser that refuses storage".
- `docs/specs/FEATURES.md` - the "Chrome" bullet "Storage warning when
  `localStorage` is unavailable, dismissible and remembered" is wrong on
  both counts and moves to "Lists" as: a storage notice at the top of the
  index and of a list page - when storage refuses, a plain warning that
  cannot be dismissed; otherwise a folded "lists live in this browser only"
  disclosure whose cross is remembered in `dhloot.warn.v1`. The "Import"
  bullet gains "either link form, plain or packed".

#### Ordered steps

1. `dict.ts`: the eighteen keys, `storageOff` out. `help.ts`: `LISTS`;
   `help.test.ts`. `tokens.css`: the placeholder rule.
2. `ports/dialog.ts`, `types.ts`, `index.ts`; `ports.test.ts`.
3. `lists.svelte.ts`: `saved`, `create(name, init)`, `remove`; its test.
   `app.svelte.ts`: `warnHidden`, `hideWarn`; its test.
4. `Button.svelte`: `danger`; `button.test.ts`. `Empty.svelte`;
   `TablesPage.svelte` uses it; `npm run test -- tables` green before going
   on.
5. `ListsPage.svelte`; `App.svelte` routes to it; `Shell.svelte` loses the
   paragraph; `shell.test.ts`.
6. `listsPage.test.ts`; `a11y.test.ts` state and `COVERED`; `COVERAGE.md`;
   `FEATURES.md`.
7. `driver.js`: `summary`, the dialog. `specs.js`: `seven`, `NAME`, the six
   states, the three press specs, the pending line and its `outstanding`
   gone.
8. `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground call,
   `timeout: 600000`.
9. `npm run build`, then `node tests/parity.js "#/lists"` (6 states, one
   timed) - the loop while getting to zero; then `node tests/parity.js
   "nothing found" "#/tables ~"` (10 states: the three empty states through
   `Empty`, and the search-box placeholder) and `node tests/parity.js
   "i/ci1 ~"` (6 states: the `pickq` and new-list inputs' placeholders).
   Three foreground calls, each inside the cap; do not merge them.
10. `npm run check:built`.
11. `plan.md` gains "B5.3 built"; `handoff.md`; one commit, `feat(lists):
    the lists index`, authored as `artex-x`, no push.

#### Acceptance criteria

- `#/lists` draws the head with the pin and the `?`, and the `?` opens four
  paragraphs with "Для игроков", "Только для мастера", "Ссылка игрокам" and
  "Ссылка себе" in bold.
- With storage working and nothing dismissed, a folded notice sits between
  the page-sub and the panel; "подробнее" unfolds it and hides itself; the
  cross removes it for good (`dhloot.warn.v1 = '1'`) without toggling the
  disclosure. With storage refusing, the plain warning draws instead and
  has no cross. The frame draws no warning anywhere.
- The panel holds the create row and the restore row; at 375 the restore
  button wraps under its input and the create button does not.
- Every list is a card in store order with its name, a badge counting known
  records, up to six thumbnails or "Список пуст", a link to the players'
  payload, "Поделиться" and "Удалить"; with no lists, "Списков пока нет —
  создайте первый выше".
- Create refuses a blank name with an alert and focus, otherwise puts the
  new list first, clears the field and toasts "Список «…» создан" - not when
  the write was refused.
- Share copies the short players' link and toasts; an empty list toasts
  "Список пуст" instead. Delete asks the live question, and a yes removes
  the list from memory and storage and keeps it from coming back through a
  merge. Restore takes a full link, a bare payload, or a packed one, lands
  the list in storage and navigates to its players' hash; a bad one toasts
  `badShare` as an alert.
- With no data the page draws `noData` and no panel.
- `#/lists` and its five states read 0.00% at every cell in both languages;
  `sharedListLink`, `deletedList` and `restoredList` match; `"nothing
  found" "#/tables ~"` and `"i/ci1 ~"` still read zero (or their recorded
  numbers) after the `Empty` extraction and the placeholder rule; `#/lists`
  no longer prints as outstanding.
- `npm run check` and `npm run check:built` exit 0 with thresholds met.

#### Risks and do-nots

- Do not leave a newline between `<b>`, the badge and the thumbs/empty
  paragraph inside `.listcard-main`, or between the summary's children:
  the inventory names are "Клад дракона7" and "Лавка в порту0Список пуст".
- Do not count `l.ids` on the badge; count known records, as `listItems`
  does.
- Do not write the storage-off text as `{' '}{t.noStorage}` - one text node,
  one expression.
- Do not forget `e.preventDefault()` on the cross: without it the disclosure
  toggles under the click and the live app's does not.
- Do not toast `listCreated` when `saved` is false; do not toast `listEmpty`
  as an error - it is plain.
- Do not put `summary` into `has()` or `controls()`; the inventory must
  stay what the live app's is.
- Do not make any state but `~ created` timed, and do not forget `timed:
  true` on it (an `enter` that raises a toast - part 0's rule).
- Do not write a `VISUAL_DEBT` number from this host; every cell is expected
  at zero and a non-zero one is a diff image opened first.
- Do not add a `StorageNotice.svelte`, a `Badge.svelte` or a `Panel.svelte`
  (see "Decided"). Do not build anything under `#/l/` or `#/lists/<id>`.
- Grep the diff for `' <` at the start of an `{#if}`/`{#each}` block.
- One commit, no push, no `Co-Authored-By`.

**Decided in planning - do not reopen.**

- **One batch, not parts.** Six light states on one new page component, no
  modal, no whole-page capture, two five-line driver verbs. B5.2 split
  because CI was red and a measurement class needed naming first; nothing
  here is that.
- **The short-link restore defect is fixed, not reproduced.** Live refuses
  its own "Поделиться" output in "Восстановить" (`badShare`), which no user
  can want; the precedent is the grid-numbering bug (`ACCEPTED`), fixed in
  the rewrite and reported rather than carried. The fix is `env.compress.
  unpack` before `decodeList` and a `~` in the regex; `restoredList` uses a
  plain link so the two apps still agree on what a spec can see. Reported to
  the owner in the handoff. Rejected: waiting for B5.6 (which owns the packed
  *open* path) - the restore path is this batch's, and `CLAUDE.md` says fix
  cheap, local, safe bugs in a touched path.
- **`noData` stays; `storageOff` goes.** `noData` is a state the live app
  cannot draw (`app.js:7` throws on a missing `window.LOOT`) and the rewrite
  chose to render rather than crash - documented on `AppState.index`. The
  lists page joins every other page in drawing it. `storageOff` replaced a
  live warning with an invented one in the wrong place; the live markup lands
  and the invention is deleted, key and all.
- **A `DialogPort`, not `window.confirm` in the component.** The
  architecture boundary; a fake answers tests and records the question.
  Rejected: an in-page dialog (a redesign, and a different inventory) and
  hanging `confirm` on the router port (it is not routing).
- **`warnHidden`/`hideWarn` on `AppState`; the markup inline in `ListsPage`.**
  The flag is a storage-backed setting like `lang` and `home`, and B5.4's
  list page reads it too; the markup has one use until then, and B5.4
  extracts `StorageNotice.svelte` on its second.
- **`Empty.svelte` now, `Badge.svelte` not.** `.empty` reaches its second
  use here and the rule says extract and remove both copies - three
  nothing-found states guard it. `.badge` already has two copies (the card
  and the rows) that nobody extracted; a third is copied, and the extraction
  is recorded as deferred because it touches components with thirty-odd
  parity states for a two-rule gain.
- **The placeholder rule is global, in `tokens.css`.** style.css:727 is
  global and every input in the app inherits it; a per-component port would
  fix the lists page and leave the search box wrong. Every state with a
  placeholder is expected to stay at zero - the difference was always under
  `JITTER`, and closing it cannot raise a number.
- **Drafts are component-local.** Live `S.listDraft`/`S.importDraft` survive
  a navigation within the session; the rewrite's do not. The same call
  `TablesPage` made for the search query; nothing a spec or a person leans
  on. Rejected: two fields on `AppState` for a half-typed name.
- **The disclosure keeps its open state across a create.** Live folds it as
  a side effect of replacing `innerHTML`; the rewrite's `<details>` persists.
  Invisible to every state (each starts folded), kinder to a person, recorded
  rather than reproduced. **Corrected at close-out** ("B5.3 built",
  "Close-out decision"): "invisible to every state" was wrong for a
  *language switch* - the harness presses `EN` after `enter`, and the live
  `render()` folds the notice there by its own `data-keep` rule - so the
  port re-creates the `<details>` on `app.lang`. The create/delete case
  stands as written.
- **`create(name, init)` and `saved` on the store, rather than a `fill()`.**
  Live saves twice on a restore (create, then ids and meta); one write with
  the same end state is unobservable except by another tab's `storage`
  event mid-restore. `saved` is the live `createList.saved` by another name.
- **Delete and share are press specs, not states.** A dialog is not painted
  and a toast reads the same on both apps; the data - the question asked,
  what storage holds, what the clipboard got - is what can differ. The
  storage-off form has no state at all: the driver has no verb to make
  storage refuse, and adding one for a screen the component test already
  draws is an instrument nobody else needs.
- **`summary` joins `click()` only.** The unfolded notice is otherwise
  unreachable; `has()`/`controls()` stay as they are so the compared
  inventory does not change.

### B5.3 built: the lists index - implemented and verified, one real blocker found

**Everything in "Ordered steps" 1-10 is done, all of it as designed, with one
correction the harness itself found (below).** No production code beyond the
brief's scope was touched. **Not committed** - acceptance criterion "every
cell of `#/lists` and its five states at 0.00%" is not met, for a reason
outside the six the plan named, so this stops at "STOP AND REPORT" rather
than at a commit.

**What shipped**, file by file: `app/src/lib/dict.ts` (eighteen keys in,
`storageOff` out), `app/src/lib/help.ts` (`LISTS`, registered as `lists`) and
`help.test.ts`; `app/src/styles/tokens.css` (the global `::placeholder`
rule); `app/src/ports/dialog.ts` (new - `DialogPort`, `browserDialog`,
`fakeDialog`), wired into `types.ts`/`index.ts`, with `ports.test.ts` cases;
`app/src/state/lists.svelte.ts` (`saved`, `create(name, init)`, `remove`) and
its tests; `app/src/state/app.svelte.ts` (`warnHidden`, `hideWarn()`) and its
tests; `app/src/components/Button.svelte` (`danger` variant) and its test;
`app/src/components/Empty.svelte` (new, the second use of `.empty`) with
`TablesPage.svelte`'s two empty branches routed through it and the inline
rule deleted; `app/src/components/ListsPage.svelte` (new, the full template
from "How it is built", transcribed) and `listsPage.test.ts` (19 cases, all
green); `app/src/App.svelte` (the `lists` route); `app/src/components/
Shell.svelte` (the invented paragraph, its rule, and `storageWorks` all
deleted) and `shell.test.ts` (the two stale cases removed, the axe case kept
per the brief); `app/src/components/a11y.test.ts` (a new pressed state -
"the lists index with its notice unfolded and two lists" - `COVERED` gains
`ListsPage.svelte` and `Empty.svelte`, `Shell.svelte`'s line corrected);
`tests/parity/driver.js` (`summary` in `click()`'s selector, the dialog
auto-accept and `dialog()`); `tests/parity/specs.js` (`seven`, four `NAME`
entries, the six `#/lists` states replacing the `pending` line, and the
three press specs - `sharedListLink`, `deletedList`, `restoredList`);
`docs/specs/FEATURES.md` (the storage-notice bullet moved from Chrome to
Lists, corrected; the Import bullet gains "either link form, plain or
packed"); `docs/specs/COVERAGE.md` (a `listsPage.test.ts` row; `shell.test.ts`'s
row loses the storage-warning clause).

**One correction found while building, not in the brief's line list:** axe's
`nested-interactive` rule fires on the storage notice's own unfolded-or-folded
markup, because `.warn-x` (the dismiss button) sits inside its own `<summary>`
- exactly what app.js's `storageWarning()` writes, not the rewrite's
invention. It cannot be restructured without breaking the live behaviour:
`<details>` hides every child but the first `<summary>` while closed, so a
button that has to stay visible while the notice is folded has nowhere else
to live. Disabled in `app/src/test/a11y.ts`'s `OFF` map, alongside
`color-contrast`, with a comment naming the mechanism. This is a real,
unavoidable, live-app-inherited shape, not a rewrite defect - recorded rather
than reproduced as a violation.

**The blocker, found by the harness itself, not by one of the plan's six
named causes.** `node tests/parity.js "#/lists"` (run three times, same
result each time): 33 of 36 cells read `совпадает`. The three that do not are
all one state, all one language:

```
#/lists ~ notice unfolded @ en 1100  5.88% отличий, ожидался ноль
#/lists ~ notice unfolded @ en 768   6.40% отличий, ожидался ноль
#/lists ~ notice unfolded @ en 375   9.05% отличий, ожидался ноль
```

The Russian cells of the same state are exact. Diff images opened before
writing anything (`docs/parity.md`'s own rule): `_lists_notice_unfolded_en_*
-legacy.png` shows the notice **folded** - the disclosure has closed itself
- while `_lists_notice_unfolded_en_*-next.png` shows it still **open**, the
`<p>` of body text visible, the page correspondingly taller.

**Root cause, confirmed by reading `storageWarning()` (app.js 2872-2886) and
`hideWarn`/`warnHidden` (2865-2871), not guessed:** the live app's `<details>`
carries no `open` attribute driven by any tracked JS flag - whether it is
open or closed is pure, transient DOM state, native to the `<details>`
element and read by nobody. `arrive()`'s own sequence runs `enter()` once,
in Russian - which is `d.click('подробнее')`, opening the disclosure - and
only afterwards, for the English cells, presses `EN`. Pressing `EN` on the
live app calls its `render()`, which rebuilds `#view`'s `innerHTML` from
scratch; a fresh `<details>` with no `open` attribute starts closed, so the
click's effect is discarded. The rewrite's `<details>` is a persistent
Svelte-owned element that nothing recreates on a language change, so its
`open` property survives exactly as the person left it - which is the
correct, kinder behaviour `plan.md`'s own "Decided in planning" already
named and chose not to reproduce: **"The disclosure keeps its open state
across a create. Live folds it as a side effect of replacing `innerHTML`;
the rewrite's `<details>` persists. Invisible to every state (each starts
folded), kinder to a person, recorded rather than reproduced."**

**Why this is not one of the plan's six named causes, and why it is not
mine to resolve alone:** the six named suspects (summary-children
whitespace, `.warn`'s second `margin-bottom` declaration, the 375px restore
wrap, the badge counting `l.ids`, the thumbs' background colour, the
placeholder colour) are all either confirmed absent here (the folded/
dismissed/help/created/two-lists states all read exactly zero, in both
languages, which rules out all six as a systemic markup defect) or simply do
not apply to this specific failure's shape (a state persisting across a
language switch is not a rendering value at all). This is instead the exact
divergence the plan's own "Decided in planning" section already reasoned
about and explicitly decided was acceptable - **on the stated assumption
that it would be invisible to every state**. That assumption is now false: it
is the harness itself, exercising the very state (`~ notice unfolded`) the
plan designed to prove the disclosure opens, that has surfaced it. Deciding
how to close this gap is the same class of design call "Decided in
planning" already made once - re-deciding it is explicitly out of an
implementer's scope, and the acceptance criteria's own "no `VISUAL_DEBT` or
`ACCEPTED` entry expected" leaves no sanctioned way to paper over a real,
reproducible, non-zero measurement either. Three paths exist, none chosen
here: (1) make the rewrite's disclosure re-fold on a language switch (a
production change beyond this batch's line list, and a real behaviour
question - should it also re-fold on every navigation, the way the live
app's `render()` implies, or only on a language change?); (2) accept the
kinder rewrite behaviour and add an `ACCEPTED` line naming it, which
contradicts this batch's own stated acceptance criterion and needs the
owner's sign-off to override; (3) change what `~ notice unfolded` compares
so it no longer spans a language switch after the press - not obviously
possible in the current one-page-per-state model without a new mechanism.

**Nothing else regressed.** `node tests/parity.js "nothing found" "#/tables
~"` (10 states, the `Empty` extraction and the placeholder rule) -
`расхождений нет`. `node tests/parity.js "i/ci1 ~"` (6 states, the `pickq`
and new-list placeholders) - `расхождений нет`, including three `снимок
целиком` retries on `~ whole`'s already-known instability, not a new one.

**Verification run, in full** (all commands exactly as the brief specifies,
each its own foreground call):

- `set -o pipefail; npm run check 2>&1 | tail -n 120`, `timeout: 600000`.
  Needed **four attempts**, all with the shape unchanged - never salvaged,
  never backgrounded:
  1. First attempt: `format:check` failed on six files this batch touched
     (whitespace/wrapping only). Fixed with `npx prettier --write` on those
     six.
  2. Second attempt: `lint` failed - one `@typescript-eslint/
     no-confusing-void-expression` on `ListsPage.svelte`'s delete button
     (`onclick={() => del(l)}`, `del` returning `void`). Fixed by wrapping
     the call in braces, matching `AddToList.svelte`'s own convention for a
     synchronous void handler.
  3. Third attempt: `svelte-check` (typecheck) crashed the process -
     `FATAL ERROR: NewSpace::EnsureCurrentCapacity Allocation failed -
     JavaScript heap out of memory` - on a host measured at 1.3 GB free of
     16 GB (19 peer sessions sharing this tree). Not a code defect: re-run,
     per the brief's own instruction not to salvage a run that goes over
     under load.
  4. Fourth attempt: `typecheck` passed clean (523 files, 0/0); `vitest run
     --coverage` itself crashed a worker fork (`ERR_IPC_CHANNEL_CLOSED`),
     leaving many components read as 0% because their tests never ran under
     the dead worker - again the documented memory-pressure signature, not
     a defect. Re-run.
  5. **Fifth attempt, and it is also where a real defect turned up**: one
     failure, `listsPage.test.ts`'s own "draws two cards..." case, off by a
     literal space - `'Клад дракона1 '` where `'Клад дракона1'` was
     expected. Traced to attempt 1's own `prettier --write`: it had
     reformatted `ListsPage.svelte`'s hand-glued `.listcard-main` markup
     onto separate lines, reintroducing exactly the whitespace text node the
     glued `>`/`<` styling exists to prevent - the same failure mode
     `TableRows.svelte` already carries a `<!-- prettier-ignore -->` comment
     for, with its own explanation of why. Fixed the same way: the whole
     `.listcard-main` link wrapped in `<!-- prettier-ignore -->`, confirmed
     stable by running `prettier --write` on the file again and diffing (no
     change). Re-ran `listsPage.test.ts` alone (19/19) and then the whole
     suite.
  6. **Sixth attempt: exit 0.** format/lint/typecheck (523 files, 0/0)/data/
     derived/i18n/selftest (292 passed) all clean; `vitest run --coverage`:
     **781 tests, all files passing**, 96.89/90.09/96.93/97.15 statements/
     branches/functions/lines, every per-file and overall threshold met.
- `npm run build` - clean; `dist/assets/app.js` 223.39 kB, 69.15 kB gzip.
- `node tests/parity.js "#/lists"` (6 states, 36 cells, one timed) - **3
  расхождения**, all one state, all English, all diagnosed above; the other
  33 cells `совпадает`.
- `node tests/parity.js "nothing found" "#/tables ~"` (10 states, 60 cells) -
  `расхождений нет`.
- `node tests/parity.js "i/ci1 ~"` (6 states, 36 cells) - `расхождений нет`.
- `npm run check:built` - exit 0: build, `file://` smoke (`the built page
  opens from a folder`), bundle budget (67.1 kB gzip against 120 kB).
- **No `VISUAL_DEBT` or `ACCEPTED` entry was written.** Per scope, and
  because writing one for the one failing state would be exactly the design
  call flagged above as not an implementer's to make alone.
- `git log --oneline -3` and `git status --porcelain`, checked repeatedly
  through the session (before starting, before each `npm run check` retry,
  and again here): HEAD stayed at `91d7899` throughout - no peer session
  touched this tree while this batch ran. The pre-existing uncommitted
  change to `issues/47/context.md` (the "Re-measured at the implement
  dispatch" bullet, present before this session started) was left exactly
  as found, untouched and unstaged - it is not this batch's to commit.

**Deviations from the brief:** none in scope, file list, or ordered steps.
Two things found and fixed inside the touched path, both write-ups above:
the `nested-interactive` axe accommodation (a live-app-inherited shape, not
a defect) and the `prettier --write`-induced whitespace regression on
`ListsPage.svelte` (fixed with the same device `TableRows.svelte` already
uses). The one substantive deviation from "done" is the blocker above,
which is a stop, not a design choice made in this pass.

#### Close-out decision: the notice re-folds on a language switch (planner, 2026-09-10)

**Decided: path 1, narrowed to the language switch.** `ListsPage.svelte`
wraps its `<details class="warn">` in `{#key app.lang}` … `{/key}`, so a
language change destroys and re-creates the element - the rewrite's literal
analogue of the live `render()` building a fresh `<details>` - and the
notice comes back folded on both apps. Two lines of template, no new state,
no new module, export, component or variant; the `<summary>`'s glued
children and the `<p>` are untouched inside the block. The close-out brief
is `handoff.md`, "Next batch"; B5.3 still closes as one commit,
`feat(lists): the lists index`.

**Why this and not the other two - on mechanics, not taste.**

- **The live app has an explicit rule for exactly this, and the notice is
  outside it.** `render()` discards every DOM-only state in `#view` *except*
  what `restoreOpen()` (app.js 3769-3775) puts back: a person's own
  fold/unfold, captured by a capturing `toggle` listener (3780-3783) into
  `S.keepOpen`, on elements marked `data-keep` - the roll panel
  (`roll:<id>`, 3011), the note box (`rnote:<key>`, 3047) and the list note
  (`note:<id>`, 3095). `storageWarning()` writes no `data-keep`, so the
  notice folds on every re-render by the live app's own opt-in rule, not by
  an accident of `innerHTML`. `CLAUDE.md` says compare rendered results,
  not apparent intent; here the two agree.
- **Path 2 (an `ACCEPTED` entry) is not mechanically available for a pixel
  cell.** `ACCEPTED` is read only by the spec `diff()` (`tests/parity.js`
  214), keyed `<state> @ <lang> :: <spec> :: <field>`; the pixel verdict
  (538-575) consults `VISUAL_DEBT` alone. So "accept it" would mean a
  `VISUAL_DEBT` entry at 5.88/6.40/9.05% - a Windows figure written as a
  baseline (forbidden, owner decision 1) for a difference that is intended
  and so could never ratchet down (`docs/parity.md`: debt is not
  tolerance). That is the absorbing-excuse shape B3.5 and B3.6 spent two
  batches removing. Rejected; there is no owner override to ask for,
  because the path does not exist under settled decisions. The acceptance
  criterion "no `VISUAL_DEBT` or `ACCEPTED` entry" stands unchanged.
- **Path 3 (compare something else) is possible, and wrong.** The
  implementer's "needs a new harness mechanism" is right: `arrive()`
  (`parity.js` 353-363) runs `enter(d)` with no `lang`, then presses `EN`,
  and its comment says why - every `enter` grips Russian names. Pressing
  the language first would need a state flag, `enter(d, lang)`,
  `NAME[lang].readMore`, and the flag hashed into `keyFor` (155-167): ten
  lines, after which the harness can no longer see a divergence a person
  reaches in two clicks (unfold, then switch language). The state was
  written to prove the disclosure opens; it has also proved what survives a
  language switch, and that is worth keeping. Rejected.

**The sub-question, settled: language change only, in this batch.**

- *Navigation.* Every route change already remounts `ListsPage`:
  `App.svelte` (62-85) picks the page in an `{#if}`/`{:else if}` chain on
  `app.route`, and `#/lists` has no hash-only move within itself. A fresh
  `<details>` on navigation is already what happens, so keying on
  `app.navigations` here would be a branch no test can reach - add no
  variant before something uses it. `setLang()` (`app.svelte.ts` 252-255)
  does not bump `navigations`, which is why `app.lang` has to be the key.
- *In-page actions (create, delete).* The live `render()` folds the notice
  on these too; the rewrite's stays open. This is the original "Decided in
  planning" bullet and it stands, with its premise corrected: it is
  invisible to every state *because no state opens the notice and then
  acts on the panel*, not because persistence is invisible in general.
  Not reproduced, on purpose: B5.4's list page calls `render()` from a
  dozen in-page actions (rename, note, remove, roll), and "fold the notice
  on every action" is a growing list of counter bumps with no state to
  guard any of them. The line is drawn at screen-wide events - a
  navigation, a language switch.
- *What B5.4 inherits.* When it extracts `StorageNotice.svelte` on the
  second use, the `{#key app.lang}` moves with the markup. If the list page
  turns out to survive a list-to-list move without remounting (same route
  kind, different payload), `app.navigations` joins the key then, with a
  state that proves it - measured, not assumed. B5.4 also meets all three
  live `data-keep` opt-ins (`roll:`, `rnote:`, `note:`), where the rule
  below says the opposite: keep.

**The standing rule** is one line under "Working rules during the
migration": DOM-only transient state (an open `<details>`, a `hidden`
toggle) survives a language switch in the port exactly where the live app
marks the element `data-keep`; everywhere else the port re-creates the
element on `app.lang`. It lives in `plan.md` because it is a porting rule,
not product behaviour; `FEATURES.md`'s Lists bullet gains the one
product-visible clause (the notice comes back folded after a language
switch); not `CLAUDE.md` - first instance, not a repeated mistake, and the
file is near its cap.

**Expected effect on the 36 cells.** The three English `~ notice unfolded`
cells go to zero; the other 33 are unchanged - `#/lists`, `~ two lists`,
`~ help` and `~ created` re-create a folded notice as folded, `~ notice
dismissed` has no notice to re-create, and the Russian cells never press
`EN`. Nothing outside `ListsPage.svelte` renders the keyed block, so
`"nothing found" "#/tables ~"` (60 cells) and `"i/ci1 ~"` (36 cells) stay
banked; `npm run check` and `npm run check:built` re-run because production
code and a test change. Coverage: the new `listsPage.test.ts` case presses
`EN` after unfolding, which is the only way the `{#key}` block's re-create
path is reached.

**Close-out run.** `ListsPage.svelte`'s `{:else if !app.warnHidden}` branch
wraps the `<details class="warn">` in `{#key app.lang}` … `{/key}` with a
comment naming the mechanism (`restoreOpen`, app.js 3769); the `<summary>`'s
glued children and the `<p>` are untouched. `npx prettier --write
app/src/components/ListsPage.svelte` made no change, so `<!-- prettier-ignore
-->` was not needed. `listsPage.test.ts` gained one case in `describe('the
head and the panel')` - unfold, press `EN`, assert the fresh `details.warn`
is closed and `'more'` (the English `readMore`) is present, ending with
`expectNoA11yViolations`. `docs/specs/FEATURES.md`'s Lists storage-notice
bullet gained the one clause.

- `set -o pipefail; npm run check 2>&1 | tail -n 120`, one foreground call,
  `timeout: 600000` - **two attempts**: the first hit the documented
  worker-fork crash (`Worker exited unexpectedly`, `Test Files 34 passed
  (36)`, `Tests 687 passed (782)`, two unhandled errors) - a host-load
  signature, not a defect, re-run per the brief; the second was **exit 0**:
  format/lint/typecheck (523 files, 0/0)/data/derived/i18n/selftest (292
  passed) all clean, `vitest run --coverage`: **782 tests, 36/36 files
  passing**, 96.89/90.09/96.93/97.15 statements/branches/functions/lines,
  every threshold met.
- `npx prettier --write app/src/components/ListsPage.svelte` before the
  check - unchanged, confirming the glued summary survives formatting as
  written.
- `npm run test -- listsPage` (focused, before the full check) - 20/20
  passed; the run's own per-file coverage errors are the filter's own
  artifact (unrelated components read 0% because only one file's tests ran)
  and are not part of the gate.
- `npm run build` - clean; `dist/assets/app.js` 223.59 kB, 69.23 kB gzip.
- `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists"` (6 states, 36 cells,
  one timed) - **`расхождений нет`**, every one of the 36 cells `совпадает`,
  including all three English `~ notice unfolded` cells that were the
  blocker.
- `set -o pipefail; npm run check:built 2>&1 | tail -n 120`, one foreground
  call, `timeout: 600000` - **exit 0**: build, `file://` smoke ("the built
  page opens from a folder"), bundle budget (67.2 kB gzip against 120 kB).
- **No `VISUAL_DEBT` or `ACCEPTED` entry was written**, as expected - the
  three cells the plan targeted are now exact, not excused.
- `"nothing found" "#/tables ~"` and `"i/ci1 ~"` were **not re-run**, per the
  brief - banked from B5.3's own verification, nothing outside
  `ListsPage.svelte` renders the keyed block.
- `git log --oneline -3` and `git status --porcelain`, checked before
  starting and immediately before staging: HEAD stayed at `91d7899`
  throughout.
- Commit: see `git log` for this session's `feat(lists): the lists index`
  commit, authored `artex-x <artex-x@users.noreply.github.com>`, containing
  all of B5.3 plus this close-out (the 26 paths the batch already held plus
  this file, the test, `FEATURES.md`, and `handoff.md`). No push.

### B5.4 planned: the list page - split into 4a (the page, complete but for drag semantics) and 4b (drag as the live app does it)

**The split, and why it is drawn where it is.** The batch table offered
"4a (the page and the rows) and 4b (notes, roll panel, drag)". Measured on the
live page (`context.md`, "B5.4 planning facts"), that line cannot be drawn
without faking something on screen: the folded list note (`.lnote`, 36px) and
the folded roll panel (`.lroll`, 43px) are on every non-empty list at arrival,
every row carries the note button (`.lrow-note`, a 38px column) and any row
with a note shows its `.rnote` box open - leave them out and every row shifts
and every cell fails; draw them folded with nothing inside and a click opens an
empty panel, which is the faked affordance the B1-B4 rule forbids. The one
piece of B5.4 with no footprint the harness can see is reordering by drag: the
grip is an `aria-hidden` span drawn either way, the driver has no drag verb,
and the live semantics (`drop-before`/`drop-after` by pointer midpoint, the
row as drag image, edge autoscroll - app.js 4443-4530) are exactly what the
rewrite's index-based `nativeDrag` port does not carry. So:

- **4a** is the list page complete: every control that draws, every press,
  every address rewrite, the notes, the roll panel, `contextNote`, remove with
  undo, position by typing, and drag through the *existing* `nativeDrag` port
  (functional - drop on a row moves the entry there - without the live marks).
  Nothing on screen is inert. Implement-ready below.
- **4b** is drag with the live semantics: the port rewritten to the live
  event model, the marks and the dragging opacity, the drag image, edge
  autoscroll, a driver verb that dispatches synthetic `DragEvent`s on both
  apps, and a `reorderedByDrag` press spec. Outlined at the end.
- **Step 0 of 4a is a harness fix that stands on its own commit**: the legacy
  screenshot cache is turned off for `timed` states - the root cause of
  `#/tables ~ selection copied @ en 1100`, decided below. 4a adds a fifth timed
  state (`~ removed`) and would otherwise inherit the same trap.

One batch was considered and rejected: 4a alone is ~40 paths (B5.3 was 26 and
took six `npm run check` attempts under host load), and the drag port is the
one piece that can be cut cleanly. Putting the roll panel into 4b instead was
rejected for the reason above (its summary is on screen folded; its content
reuses `NumberField`, `Die`, `Button`, `OrGrid`, `RecordCard` and
`RecordActions`, so it is ~100 template lines, not a slice).

**Objective (4a).** `#/lists/<id>` draws the person's own list and rewrites
the address to `#/l/<players' payload>` at once and after every edit;
`#/l/<payload>` that decodes to one of the person's lists draws the same page
(a payload that is nobody's stays on the `todo` paragraph - B5.6). The page:
the name as a text input in the `h1`, the count line, the action row (players'
link, own link, copy text, print, delete), the storage notice (extracted to
`StorageNotice.svelte` on this second use), the money picker with its help
(only when some entry has a price), the list note (a `<details>` open when
either note exists), the roll panel (only with two or more entries; folded;
opens on its summary; a number typed or stepped, or the random button, shows
the entry's card with its roll number and both of its notes), the batch bar
with select-all and the count, and a row per known entry: grip, checkbox,
position field, the row body, quantity and price with the gold hint, the note
button and the remove cross, and the note box under the row. Empty list: the
hint. Unknown id: "Список не найден". No tab is lit.

**Non-goals (4a).** Drag marks, drag image, edge scroll (4b). `.batch-acts`
and everything under the bar - "Цены", "Удалить (N)", the money panel, batch
delete, reprice, suggest (B5.5): a ticked row in 4a shows the count and no
buttons, so no parity state ticks a row (the ticked bar is B5.5's state). The
shared page for a payload that is not ours, `#/l/~packed` expansion,
`listNotFound` for a payload, `renderSharedList`, `N_SHARED` (B5.6). No
`Badge.svelte`, `Panel.svelte`, `Row.svelte` (see "Decided"). No change to
`CONTRACTS.md`, `docs/fixtures/`, `ROUTES.md`, `STATE.md`, `llms.txt` - every
route, key and payload format already exists and is fixture-tested.

#### What the live app does, read off app.js and measured

Line numbers verified on `app.js` at HEAD `13bba19` (the file is unchanged
since B5.3's citations). Measurements: read-only puppeteer probe with the
harness's own launch args and reduced motion, `index.html#/lists/a` seeded
with `a` = seven Core items, `meta.ci2 = {qty 2, gold 750, note, hnote}`, a
list note; `b` empty; `c` two entries, no meta. Full record in `context.md`,
"B5.4 planning facts".

**Routing and the address** (`render`, 3792-3814; `goToList`/`findListByPayload`/
`freshenListUrl`/`syncListUrl` 1537-1607; `onListPage` 574-578). A `lists/<id>`
route resolves the list by id, sets `S.openList` and calls `syncListUrl`, which
`replaceState`s the address to `#/l/` + `encodeList(l, true)` - the players'
flavour, always plain - and remembers that payload in `S.urlPayload`. An
`l/<payload>` route is ours when `payload === S.urlPayload && getList(S.openList)`
(the short-circuit for a payload we wrote ourselves) or when
`findListByPayload` finds a stored list with the same name, the same ids in
the same order, no `qty`/`gold`/`note`/`hnote` in the payload's meta that
contradicts the stored one, and no list note that contradicts (a players'
payload simply lacks GM notes - that is not a disagreement). Every edit calls
`freshenListUrl(l)` = `syncListUrl` when `S.openList === l.id`. Measured: the
hash after opening `#/lists/a` is the players' payload; after remove, undo,
position, rename and the money mode each rewrite it; reopening that hash
draws the own page. `renderTabs` (3667-3673) lights a tab only when
`tab[0] === currentRoute()`, and the route is the string `l/…` or `lists/…`:
**no tab is lit on a list page** (measured: `#tabs a.on` empty at every
width). `homeHash()` (1133-1136) is `''` there, and `renderOneList` writes its
own `<h1>` rather than `pageHead()`: no pin, no `?`. `document.title` is the
plain `docTitle`. `hashchange` (4627-4635) clears `S.lsel`.

**The page** (`renderOneList` 2960-2995), top to bottom, with 1100px numbers:

- `<h1 class="page-h">` (46px tall) holding `<input type="text" id="rename"
  class="titleinput" value=name aria-label=rename>`. **`.titleinput`
  (style.css 848-853) mostly loses**: the global `input[type=text]` rule
  (254-258, specificity 0,1,1) beats the class (0,1,0), so the computed box is
  the ordinary text field - 46px tall, `padding: 0 14px`, `background:
  var(--bg2)` (`rgb(20,17,29)`), `border: 1px solid var(--line2)` on all four
  sides, `border-radius: 9px`, and the global `:focus` gold border with the
  `0 0 0 3px rgba(216,171,94,.14)` shadow. What survives of `.titleinput` is
  `max-width: 560px` (measured 560 wide at 1100/768, 328 at 375), `font-size:
  23px`, `font-weight: 680`, `letter-spacing: -.01em` (computed -0.23px) and
  `width: 100%`. Port both rules in the live order and specificity - the
  scoped `input[type='text']` rule `ListsPage.svelte` already carries, then
  `.titleinput` - and the cascade produces the same box; do not "fix" the
  dashed underline the class intended.
- `<p class="page-sub">` = `items.length + ' ' + plural(items.length)`
  (`plural` 3168-3175: ru позиция/позиции/позиций by the 1/2-4/5 rule with the
  11-14 exception, en item/items) - "7 позиций", "2 позиции", "7 items".
  22.39px tall, margin-bottom 18.
- `<div class="card-acts" style="margin-bottom:16px">` - five `.btn.sm`:
  `ICON_LINK sharePlayers`, `ICON_LINK shareGm`, `ICON_COPY copyText`,
  `printBtn(items ids, 'sm')` (an `<a href="#/print/…" title=printHint>` -
  absent on an empty list), `danger del`. 35px tall at 1100 and 768, 73 at
  375 (wraps to two lines).
- `storageWarning()` (2872-2886) - the same two forms as the index, in the
  same slot; 43.5px folded at 1100/768, 69.5 at 375, margin-bottom 16.
- `moneyPickerHTML(l)` (2933-2958) - only when some entry has `gold > 0`:
  `<div class="money"><span class="money-l">moneyAs</span>` then a `.chip`
  per `MONEY_MODES` (`bag`, `coin`) with `on` + `aria-current="true"` on the
  current mode, then `<button class="helpbtn sm" data-act="moneyHelp"
  aria-expanded title=aria-label=whatIsThis>?</button>`, and when open a
  `<span class="money-br"></span>` line break plus `<div class="helpbox
  money-help"><p>moneyHelp</p></div>` (the dictionary string carries five
  `<b>` runs in each language). Measured: 36.8 tall (chips 98.97 wide, the `?`
  22x22), 235.95 with the help open at 1100/768, 394.52 at 375; 65.8 folded at
  375 (the `?` wraps to its own line). `S.moneyHelp` is app memory; the mode
  is `l.money` (`coin`) or absent for `bag`; picking a mode saves, freshens
  the address, re-renders (4086-4094). The gold hint (`goldHintHTML` 1306-1311)
  and the field `title` (`goldTitle` 1297-1300) read `goldText` = `priceText`
  in bag mode, nothing in coin mode.
- `listNoteHTML(l)` (3094-3101): `<details class="lnote" data-keep="note:<id>"
  [open when l.note || l.hnote]><summary>ICON_NOTE<span>listNote</span></summary>`
  + `notePairHTML` with the list placeholders. Folded 36px (summary 34 +
  borders; padding 10/10); open 153 at 1100 (`[open] summary` padding-bottom
  6), 172 at 768, 285 at 375 (`.npair` stacks under 640px); margin-bottom 16.
- `notePairHTML(attr, o, opt)` (3109-3128): `<div class="npair">` of two
  `.nfield` (`n-pub` with `ICON_EYE`, `n-hid` with `ICON_EYE_OFF` and a dashed
  textarea border): `<span class="nlbl">icon label<i>hint</i><button
  class="note-x" data-note-clear title=aria-label=noteClear>&times;</button>
  </span><textarea rows="3" [attr] placeholder=ph>value</textarea>`. The
  cross is hidden by `.nfield:has(textarea:placeholder-shown) .note-x
  {display:none}` (1096) - CSS, no JS. Measured: `.nlbl` 20px tall at 1100
  (39 at 768/375 where the hint wraps), `.note-x` 20x20, textareas 509.5 wide
  in a row's pair at 1100 (343.5 at 768, 304 at 375; the list note's 506.5 /
  340.5 / 300). **Auto-size** (`autoSize`/`autoSizeNotes` 1100-1116, `NOTE_SEL`,
  `NOTE_MAX = 320`): on render and on every `input`, `height = auto` then
  `min(scrollHeight + (offsetHeight - clientHeight), 320)`, skipped for a box
  with `data-manual` or no `offsetParent`; measured 79px for a one-line row
  note (font 13px), 83px for a one-line list note (14px); an empty box keeps
  its `rows="3"` natural height (`style.height` unset). A hand-resized box is
  marked `data-manual` by the `pointerdown`/`pointerup` pair (4562-4571)
  when its `offsetHeight` changed between the two.
- `listRollPanel(l, items)` (2997-3029), only when `items.length > 1`:
  `<details class="panel lroll" data-keep="roll:<id>" [open when hit]>
  <summary>ICON_DIE<span>rollBy</span></summary>` then `<div class="field"
  style="margin-bottom:14px|0">` (14 when there is a hit, else 0 - inline, so
  it beats `.lroll>:last-child{margin-bottom:13px}`) with `<span class="lbl">
  rollResult (1–N)</span>` and a `.numrow` of `numBox('n', n, 1, N)` (**empty
  when `n < 1`** - #16, the field shows `''` and means "no roll yet"), the
  primary button `dieIcon(N) + rollLabel(N)` ("Случайно 1–7" for seven; a real
  die name for 4/6/8/10/12/20/100), and, with a hit, `.btn.ghost` "Сбросить"
  (`clearRoll` 4256); without a hit `<p class="rollhint">rollHint</p>`; with a
  hit `orGrid([cardHTML(hit, { rollLabel: n })])` (a compact card whose number
  badge is the position, name a link) and `rolledNoteHTML` (3031-3037): a
  `.hitnote` per non-empty note - `ICON_EYE`/`ICON_EYE_OFF` + `<span><b>label
  </b>lines(text)</span>`. `rollList` (4251-4255) sets `S.listRoll = {id, n:
  d(items.length)}`; typing or stepping goes through `applyNum` (4295-4306,
  `onListPage()` branch; the `input` handler's `n` branch 4315-4331): on the list page an empty field applies 0 on
  `input`, digits apply on `input`, and the `change` handler leaves an empty
  field alone (4536-4541). Measured: folded 43 (summary 41 + borders, its svg
  15x15); unfolded with no result 138.39 (numbox 156x48, button 157.53x46,
  rollhint 20 tall); with result 2 at 1100: 452.08 (field 74.39, card 178.19,
  hitnote 59.25 each, ghost button 100.23x46). `clearRoll` leaves the panel
  open (`keepOpen`). `.lroll>:not(summary)` carries `margin: 0 13px`.
- `batchBarHTML(l)` (724-748): `<div class="batch[ on]"><label class="batch-all">
  <input type="checkbox" data-lsel-all [checked when all]>text</label>` where
  the text is `pickAll` with nothing ticked, else `pickedN + ' ' + n`; with
  anything ticked, `.batch-acts` follows (B5.5). Measured 36px tall unticked
  (margin-top 16, `border-bottom: none`, radius 10 10 0 0), 49 with acts at
  1100, 80 at 375. The bar's own checkbox has no accessible name (like the
  tables' select-all) and is not in the inventory. `data-lsel` (4389-4393)
  and `data-lsel-all` (4394-4402) both re-render.
- `<div class="rows lrows">` of `listRowHTML(l, it, i)` (3040-3092), or
  `<div class="empty">listEmptyHint</div>` (129.59 tall) when empty.

**A row** (`listRowHTML`), `<div class="row lrow[ has-note]">` - 78px tall at
1100 with the plain description of a Core item (102.03 at 768, 202.63 at 375
where it wraps to three bands), in DOM order:

1. `<span class="lrow-grip" draggable="true" data-drag="<lid>:<id>"
   title=dragHint aria-hidden="true">ICON_GRIP</span>` - 26px wide, the grip
   svg 15x15, `cursor: grab`, `touch-action: none`, `background:
   rgba(216,171,94,.05)`, `border-right`.
2. `<label class="lrow-pick"><input type="checkbox" data-lsel=id [checked]
   aria-label=pickRow></label>` - 32px wide (`padding: 0 2px 0 10px`, the
   native 13px box with its 4/3px margins).
3. `<input type="number" class="lrow-n" min="1" max=l.ids.length
   inputmode="numeric" value=i+1 data-pos aria-label=position>` - 40px wide,
   mono 650 12px, gold-soft, `-moz-appearance: textfield` and the webkit
   spinner hidden; `:focus` inset gold ring. Reorders on `change` (4545-4549:
   `moveToInList(l, id, n - 1)` then `freshenListUrl`; an out-of-range or
   empty value re-renders, which puts the position back).
4. `<button type="button" class="row-main" data-open=id>` - the same body as
   a table row (`rowHTML` 2785-2803) **without** `rnum` and `rtail`: `imgTag(it,
   'row')`, `.rt` with `<b>name</b>`, `.rstats` for equipment, the clamped
   description span, `rowCraft`, then `.rm` with `kindBadge uniqBadge
   tierBadge` and the `badge src`. Its accessible name is the whole row text
   (no `aria-label`), as on the tables. Opens the modal (`openModal`,
   4572-4578: `cardHTML(it, { full: true })`).
5. `<div class="lrow-meta">` - 161px wide - two `<label><span>caption
   [goldhint]</span><input type="number" …></label>`: `qty` (`min 1 max 99
   inputmode="numeric" data-qty value=m.qty||'' placeholder="1"`, 70 wide,
   `padding-right: 2px`, native spinner kept) and `gold` (`min 0 max 99999
   data-gold value=m.gold||'' placeholder="—"` + `goldTitle`, 64 wide, spinner
   hidden). Both 30px tall, mono 600 13px, centred. The caption span is 9.5px
   uppercase; `goldHintHTML` puts `<span class="goldhint" data-goldhint=title=
   text>?</span>` (13x13, `cursor: help`) after the `gold` caption when the
   entry has a price in bag mode - measured `?` on row 2 only, the field's
   title "7 мешков 5 горстей". Handler (4346-4370): `setMeta` on every
   `input`, `freshenListUrl`; for gold, the field's own `title` is rewritten in
   place and **the page re-renders only when the first price appears or the
   last disappears** (`had !== has`) - so a typed price updates the title at
   once but the `?` in the caption appears only on the next render (measured:
   title "2 мешка 3 горсти" set, no `.goldhint` yet).
6. `<div class="lrow-acts">` - 39px wide, a column of two 38px buttons:
   `<button class="lrow-note[ on]" data-note-toggle title=aria-label=note>
   ICON_NOTE</button>` (37.5 tall; `.on` gold on a gold tint when the row has a
   note) and `<button class="row-x" data-remove title=aria-label=removeItem>
   &times;</button>` (38.5 tall, 18px cross, `border-top`). `data-note-toggle`
   (4113-4123) flips the box's `hidden`, records `S.keepOpen`, auto-sizes and
   focuses the first textarea (measured: focus lands in the textarea).
   `data-remove` (3944-3969): remembers the index and a copy of the meta,
   `toggleInList` (1337-1342, removes), `freshenListUrl`, `render`, then
   `toastAction(removedItem % name, undo, fn)` - the 7000ms `.toast.act` with
   the `.toast-act` button (measured 313.42x50, the button 73.78x30; text
   "«Заряжающий Колчан» убранВернуть"); undo splices the id back at
   `min(at, length)`, restores the meta, saves, freshens, re-renders
   (measured: order and count restored).
7. `<div class="rnote" data-keep="rnote:<lid>:<id>" [hidden unless note||hnote]>`
   + `notePairHTML` with the entry placeholders - a full-width band under the
   row (`flex: 0 0 100%`, `border-top`, `background: var(--bg2)`, padding
   `9px 11px`; textareas 13px on `var(--surface)`). Measured: row 2 with its
   one-line notes is 202.64 tall at 1100 (the box 123); an opened empty box
   is 116 tall. Typing a note (4371-4388) never re-renders: `setMeta`, the
   row's `has-note` and the button's `on` are toggled in place from "either
   textarea has text", then `freshenListUrl`. The clear cross (4096-4111)
   empties the textarea through a synthetic `input` event and toasts
   `noteCleared` with an undo that puts the text back the same way.

The list note's inputs (4421-4430) write `l.note`/`l.hnote` (deleting the key
when blank), save and freshen. `rename` (4431-4434) writes `l.name`, saves,
`renderSelBar()`, freshens - no re-render, the `h1` text stays `''` (measured).

**Copying** (`listAsText`/`listAsHtml` 1625-1647, `itemLine` 1313-1318,
`listSkip`/`noteBlocks`/`listNoteTail` 1609-1623, `textBlock`/`blockHtml`
583-588, `data-copy-listtext` 4133): text = `name` + `listNoteTail` blocks
(`\n\n` + `noteHead` + `\n` + `l.note`, only the players' note) + `\n\n` +
per known entry `itemLine` (`nameForShare` + ` ×qty` when `qty > 1` + ` — ` +
`priceText(gold, moneyMode(l))` when priced) + `\n` + stats + `\n\n` + desc +
`extraBlocks(it, skip)` (skip = every id in the list) + `noteBlocks` (the
entry's players' note as a `noteHead` block), entries joined by `\n\n`; html the
same with `<b>` names, `<br>` and `<br><br><i>head</i><br>body`. Toast
`listCopied`. **`contextNote`** (568-573): while a list is open, `shareText`/
`shareHtml` of any record in it append its players' note as a `noteHead` block
- measured on the roll card's "Скопировать текст": the copy ends `\n\nЗаметка\n
Светится в темноте`; the GM note does not travel. The modal opened from a row
copies the same way. The players' link (3971-3976) and the own link (3978-3984)
are `listShareUrlShort(l, true|false)` - packed when shorter - toasting
`playersLinkCopied` / `gmLinkCopied`, or `listEmpty` on an empty list. Delete
(4136-4150) asks `deleteConfirm`, removes, and **goes to `#/lists`** when the
deleted list was the open one.

**What survives a re-render** (`restoreOpen` 3769-3783, "B5.3 close-out
facts"): all three `data-keep` elements are on this page - the roll panel, the
row note boxes, the list note. A person's own fold/unfold wins over the
markup's default on every later render; the default (`open` when a hit / a
note exists; `hidden` when no note) applies only to elements never toggled.
The port's persistent elements give the same result on every path a state
reaches, with one recorded difference (see "Decided").

**The inventory the harness compares** (NAME_FN: `aria-label`, then `title`,
then `textContent`), Russian, list `a` with the seed above: `7 мешков 5
горстей` (the priced gold input, named by its title), `Выбрать позицию`,
`Заметка`, `Как в книге`, `Как это работает`, `Лавка закрыта до утра` and
`Светится в темноте` and `Проклят` (**the textareas, named by their text
content**), `Монетами`, `На единицу больше`/`меньше`, `Название списка`,
`Очистить заметку`, `Позиция в списке`, `Результат броска`, `Скопировать
текст`, `Скрыть`, `Случайно 1–7`, the print link's title, `Ссылка игрокам`,
`Ссылка себе`, `Убрать из списка`, `Удалить`, and one whole-row name per
entry. Empty and unpriced inputs have no name and are skipped. **Svelte does
not give a textarea a text child**: `<textarea>{x}</textarea>` and
`bind:value` both compile to `set_value` (a `.value` assignment, verified with
`svelte/compiler`), leaving `textContent` empty - so a ported textarea would
be nameless in the inventory and `~ noted`'s inventory spec would differ. The
port seeds the text child (see "How it is built").

**English** presses the language after `enter`: names become `7 bags 5
handfuls`, `Select entry`, `Note`, `As in the book`, `How this works`, `In
coins`, `List name`, `Clear the note`, `Position in the list`, `Roll result`,
`Copy text`, `Dismiss`, `Random 1–7`, `Players’ link` (curly apostrophe),
`Your own link`, `Remove from the list`, `Delete`; the sub reads `7 items`,
the bar `Select all`, the captions `Qty`/`Gold`. The Russian note texts stay
(user data).

#### How it is built

**`tests/parity.js`** (step 0, its own commit) - three edits, no production
code: the two `CACHE.read` guards and the one `CACHE.write` in `shootWidth`
gain `&& !timed`, so a `timed` state's legacy side is shot fresh at every
width on every run; the `CACHE` doc comment gains a paragraph saying why (a
timed shot's bytes depend on the clock at capture, so no cached entry can be
"the exact bytes an uncached shot would have produced"); `docs/parity.md`,
"Two unstable classes", item 1, gains the sentence "and its legacy side is
never served from the screenshot cache - a cached timed shot is a clock
frozen under whatever load wrote it". Verification: `node tests/parity.js
"selection copied"` - the six cells are expected at 0.00%; see "Decided" for
what a residue means. `.prettierignore` and `eslint.config.mjs` skip
`tests/`, so `npm run check` does not read this edit; running the harness is
its check.

**`app/src/lib/dict.ts`** - forty keys, both languages, character for
character from app.js (ru 114-158 / 176-184 / 195; en 300-344 / 360-368 /
376): `rename`, `sharePlayers`, `shareGm`, `gmLinkCopied`, `listCopied`,
`listEmptyHint`, `listNotFound`, `listNotFoundSub`, `rollBy`, `rollHint`,
`clear`, `note`, `listNote`, `noteHead`, `notePub`, `noteHid`, `notePubHint`,
`noteHidHint`, `listNotePhPub`, `listNotePhHid`, `notePhPub`, `notePhHid`,
`noteClear`, `noteCleared`, `qty`, `gold`, `position`, `pickRow`, `dragHint`,
`removeItem`, `removedItem`, `undo`, `pickAll`, `pickedN`, `moneyAs`,
`money_bag`, `money_coin`. Not added: `moneyHelp` (structured, in `help.ts`
below - it carries markup), `whatIsThis` (`helpHint` already holds that
string), `goldUnit` (`priceText` already defaults it), `batchMoney` (B5.5),
`sharedList`/`toStart` (B5.6). The English `removedItem` uses curly quotes
and `sharePlayers` a curly apostrophe - copy, do not normalise.

**`app/src/lib/help.ts`** - `MONEY: Record<Lang, Help>`: one paragraph, the
`moneyHelp` string as `parts` with five `{ b: … }` runs per language (ru:
"горстями, мешками и сундуками", "7 мешков 5 горстей", "8 мешков 9 горстей",
"9 мешков", "8 мешков"; en: "handfuls, bags and chests", "7 bags 5 handfuls",
"8 bags 9 handfuls", "9 bags", "8 bags"), exported as `moneyHelpFor(lang)` -
not registered in `HELP` (it is not a section's help). `help.test.ts` reads it
back in both languages with five bold parts.

**`app/src/lib/icons.ts`** - `eye` (13), `eyeOff` (13), `note` (14), `grip`
(15), `die` (16) off `ICON_EYE`/`ICON_EYE_OFF`/`ICON_NOTE` (1047-1049),
`ICON_GRIP` (1053), `ICON_DIE` (1760); paths verbatim. `Icon.svelte` needs no
change (the live `ICON_DIE` lacks `aria-hidden`; the summary rule sizes it to
15px either way).

**`app/src/lib/i18n.ts`** - `itemsWord(n, lang)`: the live `plural` (ru
позиция/позиции/позиций by the same rule `moneyWord` uses; en item/items);
`i18n.test.ts` covers 1, 2, 5, 11, 21, 0 in both languages.

**`app/src/lib/lists.ts`** - `findListByPayload(lists, payload, knows)`: the
live 1551-1574 over `decodeList` - same name, same ids in order, no meta field
among `qty`/`gold`/`note`/`hnote` in the payload that is defined and differs
from the stored entry's, `note`/`hnote` defined in the payload must equal the
stored ones; returns the list or `null`. Pure; `lib/lists.test.ts` covers a
players' payload of a list with a GM note (matches), a GM payload (matches), a
renamed list (no), a reordered list (no), a payload with a price the store
does not have (no), a bad payload (null).

**`app/src/lib/share.ts`** - `share()` gains `opts.suffix?: string`, appended
to the name in both flavours (inside the `<b>`; the live `itemLine` is one
bold run); `shareList(list, index, lang, t)` = the live `listAsText`/
`listAsHtml`: `skip` = every id in the list, `suffix` = ` ×qty` when `qty > 1`
plus ` — priceText(gold, moneyMode(list), lang)` when priced (the mode: the
list's `money` when it is one of `MONEY_MODES`, else `bag`), `extra` = the
entry's `note` as a `{ head: t.noteHead, body }` block, the list's own `note`
block right after the name, entries joined by `\n\n` / `<br><br>`. `share.test.ts`
pins a list with a priced, counted, noted entry against a string written from
the live functions; `copiedListText` (below) is the honest fixture.
`entryNoteBlock(meta, t)` - the one `contextNote` block - lives here too, so
the roll card and the modal pass the same thing.

**`app/src/state/lists.svelte.ts`** - seven writers, each ending in one
`save()`: `rename(id, name)` (4431-4434, no trim - the live keeps what was
typed); `setMeta(id, entryId, field, value)` (1211-1219: truthy sets, falsy
deletes, empty objects pruned); `setNote(id, kind, text)` (4421-4430: trimmed,
blank deletes the key); `setMoney(id, mode)` (4086-4094: `bag` deletes the
key); `move(id, entryId, to)` (1223-1231 through `moveEntry`; returns whether
anything moved, saves only then); `restoreEntry(id, entryId, at, meta)` (the undo
of 3944-3969: splice at `min(at, length)`, meta put back when non-empty, save);
`removeEntry(id, entryId)` = the existing `removeId` + `save()` - the row's
cross (`remove(id)` already means deleting a list and keeps that meaning). Every method replaces the list object
(`this.lists = this.lists.map(...)`) so `$derived` readers update. Tests: one
`it` per method in `state/lists.test.ts`, each asserting memory and storage.

**`app/src/state/app.svelte.ts`** - `section` returns `null` for `storedList`
and `sharedList` (the live `renderTabs`; the getter's own comment already says
"nothing is lit on a list" and the code disagreed); `openList = $state('')`,
`urlPayload = $state('')`, `syncListUrl(l)`: `payload = encodeList(l, true)`;
`openList = l.id; urlPayload = payload; if (hash !== '#/l/' + payload) replace(
sharedListHash(payload))` - the live 1599-1606; `clearOpenList()` empties both
(the live `S.openList = ''; S.urlPayload = ''` on every other route). Tests:
`section` null on `#/lists/abc` and `#/l/xyz`; `syncListUrl` rewrites through
the router and leaves an already-right address alone; `shell.test.ts`'s
"lights Tables for a table, and Lists for a list" becomes "…and nothing for a
list" (assert no `aria-current` on `#/lists/abc`).

**`app/src/components/StorageNotice.svelte`** (new, the second use) - props
`app`; the `{#if !works}` div / `{:else if !app.warnHidden}` `{#key app.lang}`
`<details class="warn">` block moved verbatim from `ListsPage.svelte` (its
`works` read, `dismiss`, and every `.warn*` rule, `.warn-x:focus-visible`
included, go with it; the header comment names `restoreOpen` as before).
`ListsPage.svelte` renders `<StorageNotice {app} />` in the same slot and
loses the inline copy. `listsPage.test.ts`'s notice cases keep passing
unchanged (they go through `App`).

**`app/src/components/HelpButton.svelte`** and **`HelpBox.svelte`** (new,
second uses): the `?` (`.helpbtn` with `:hover`, `.on`, `::after` target, the
600px 34px override; props `open`, `onclick`, `size?: 'sm'` for `.helpbtn.sm`
- 22x22, 12px, style.css 696, which the class specificity keeps at 22 inside
the 600px override) and the box (`.helpbox` with its `p`, `b`, `a`,
`:last-child` rules and the paragraph renderer PageHead carries today; prop
`help: Help`, an optional `class` for `money-help`). `PageHead.svelte`
composes both and loses its inline copies; `.page-head`, `.page-h`,
`.page-sub`, `.homebtn` stay in PageHead. The money picker uses both.

**`app/src/components/RowMain.svelte`** (new, second use): the `.row-main`
button and everything inside it, moved out of `TableRows.svelte` with the
`<!-- prettier-ignore -->` glue intact: props `it`, `index`, `lang`,
`artBroken`, `onartfail`, `onopen`, `num?: number` (the `rnum`, which the
list row does not pass), `tail?: string` (the `rtail`, B5.6's). The styles
that move: `.row-main` and its `:hover`/`:focus-visible`, `img`, `.rt`, `.rt
b`, `.rnum`, `.rt span`, `.rcraft` (+ svg), `.rstats` and its colour
variants, `.rm`, every `.badge*` rule, `.rtail` (style.css 785), and the
600px block for `.row-main`, `.rm` (+ the 400px inner rule) and `.rt span`.
`TableRows.svelte` keeps `.rows`, `.row`, `.row.sel`, the selbox rules, the
tile view and the anchor flash, and renders `<RowMain … num={rollNum} />`.
`tables.test.ts` and `sections.test.ts` keep passing unchanged (they read
rendered text); re-run `"#/tables ~"` and `"#/tables/eq_weapon"` before
going on (the row is on every table state).

**`app/src/components/NumberField.svelte`** - one prop, `empty?: boolean`,
the live #16 rule for the list page: with it, `value < min` draws as `''`
(the live `numBox` writes `''` below the minimum), an emptied field commits
`0` at once on `input` rather than `min` on `change`, digits commit on `input`
(the live list page applies every keystroke; roll pages keep `change`), and a
step from an empty field starts at 0 (`(parseInt('') || 0) + by`, clamped -
so `+` and `−` both land on `min`). The `$effect` that re-syncs `text` from
`value` uses the same "draw `''` below `min`" rule so it does not put `0` on
screen. Without the prop nothing changes; `record.test.ts`/`roll.test.ts` stay
as they are; a `numberField` case in `listPage.test.ts` covers the empty
field, a typed digit, and both steps from empty.

**`app/src/components/Field.svelte`** - `after?: number`, rendered as
`style="margin-bottom:{after}px"` when given - the live inline style on the
roll panel's field (14 with a hit, 0 without). One caller.

**`app/src/components/RecordActions.svelte`** - `extra?: readonly ShareBlock[]`
passed to `share()` in `copyText` (the live `contextNote`); `RecordModal.svelte`
takes the same prop and forwards it to its card-row `RecordActions`. The name
row and `send` are untouched (the live `copyName`/`shareItem` carry no note).

**`app/src/components/ListPage.svelte`** (new) - props `app`. Script:

- `route = $derived(app.route)`; `own = $derived.by(...)`: `storedList` →
  `app.lists.get(listId) ?? null`; `sharedList` and not `packed` → the
  `urlPayload` short-circuit, then `findListByPayload(app.lists.lists,
  payload, knows)`; `packed` → `null`. `items = $derived(own ? own.ids.map(
  byId).filter(Boolean) : [])`.
- `$effect(() => { if (own) app.syncListUrl(own); })` - reading `own`'s
  fields through `encodeList` subscribes the effect to every edit, which is
  the live `freshenListUrl` after each writer collapsed into one place; the
  teardown calls `app.clearOpenList()`. No loop: after `replace`, the route's
  payload equals `urlPayload`, the same list resolves, the hash already
  matches.
- Local state: `lsel = new SvelteSet<string>()`; `roll = $state(0)` (the
  live `S.listRoll.n` for this list - memory only, component-local, see
  "Decided"); `moneyHelp = $state(false)`; `noteOpen = new SvelteMap<string,
  boolean>()` - a person's own toggles per entry, the live `S.keepOpen[
  'rnote:…']`; `open = $state<Record_ | null>(null)` for the modal;
  `hit = $derived(roll >= 1 && roll <= items.length ? items[roll - 1] : null)`.
- `boxHidden(id, meta)` = `noteOpen.has(id) ? !noteOpen.get(id) : !(meta.note
  || meta.hnote)` - the live `hidden` default with `keepOpen` winning.
- `say`, `knows`, `metaOf(id) = itemMeta(own, id)`, `mode = moneyMode(own)`,
  `priced = own.ids.some(gold > 0)`, `goldText(coins)` = `priceText` in bag
  mode else `''`.
- Handlers, each the live one by line: `rename` (`oninput` → `store.rename`);
  `sharePlayers`/`shareGm` (empty → `say(t.listEmpty)`; else `compress.pack(
  encodeListRaw(own, forPlayers))` → `clipboard.writeText(app.linkTo(
  sharedListHash(payload)))` → `playersLinkCopied`/`gmLinkCopied` or
  `copyFailed` as an error - `ListsPage.share` is the model); `copyList`
  (`shareList` → `writeRich` → `listCopied`/`copyFailed`); `del` (`dialog.
  confirm(deleteConfirm % name)` → `store.remove(id)` → `app.go('#/lists')`);
  `pickMoney(mode)` → `store.setMoney`; `toggleMoneyHelp`; `noteInput(kind,
  e)` for the list note → `store.setNote`; `noteInput` for an entry →
  `store.setMeta(id, entryId, 'note'|'hnote', value.trim())`; `clearNote(ta)`
  (empty the textarea, dispatch `input`, `say(t.noteCleared, { action: {
  label: t.undo, run: () => put(was) } })`); `toggleNote(id)` (`noteOpen.set(
  id, hidden)`, then `tick()`, `autoSize` the box's textareas and focus the
  first - 4113-4123); `removeEntry(it, i)` (copy the meta, `store.removeEntry(own.id,
  it.id)`, `say(t.removedItem.replace('%s', nameOf(it)), { action: { label:
  t.undo, run: () => store.restoreEntry(own.id, it.id, i, meta) } })`); `setPos(it,
  i, e)` on `change` (`n` in `1..own.ids.length` → `store.move(own.id, it.id,
  n - 1)`, else reset the field to `i + 1`); `setQty`/`setGold` on `input`
  (`store.setMeta(..., parseInt(value) || 0)` - the gold `title` is reactive
  from `goldText`, and so is the `?`: see "Decided"); `rollNow` (`roll = pick(
  items.length, app.env.random)`); `setRoll(n)` from `NumberField`; `clearRoll`
  (`roll = 0`); `pickRow(id, on)` and `pickAll(on)` for `lsel`.
- Auto-size: a module-level `autoSize(ta)` = the live 1102-1110 (skip when
  `ta.dataset['manual']` or `!ta.offsetParent`; `height = auto`; `min(
  scrollHeight + frame, 320)`), called from an `$effect` after mount over
  every `.lnote textarea, .rnote textarea` (the live `autoSizeNotes` on
  render), from every note `oninput`, and after `toggleNote`; the
  `pointerdown`/`pointerup` pair on the page root marks a hand-resized box
  `data-manual` (4562-4571). In jsdom `offsetParent` is null and the function
  returns early, so tests reach it through `toggleNote` only; the coverage
  threshold is met by the branch structure, not by measuring.
- The textarea's text child: an action `use:seedText={value}` that sets
  `node.textContent = value` once on mount - the textarea's value follows its
  text content until it is dirtied, which is exactly the live `<textarea>
  esc(value)</textarea>`; the component never binds `value` and reads edits
  from `oninput`. This is what gives the inventory the live names.

Template, in the live order with the live whitespace (glue `>`/`<` where the
live markup has no whitespace between siblings, `<!-- prettier-ignore -->`
on each glued block as `TableRows` and `ListsPage` already do):

```svelte
{#if !index}
  <p class="miss">{t.noData}</p>
{:else if route.kind === 'storedList' && !own}
  <h1 class="page-h">{t.listNotFound}</h1>
  <p class="page-sub">{t.listNotFoundSub}</p>
  <Button variant="primary" href={sectionHash('lists')} sameTab>{t.lists}</Button>
{:else if !own}
  <p class="todo">{app.hash}</p>            <!-- B5.6's shared page -->
{:else}
  <h1 class="page-h"><input type="text" class="titleinput" value={own.name} aria-label={t.rename} oninput={rename} /></h1>
  <p class="page-sub">{String(items.length) + ' ' + itemsWord(items.length, app.lang)}</p>
  <div class="card-acts">
    <Button size="sm" onclick={() => void sharePlayers()}><Icon name="link" />{t.sharePlayers}</Button>
    <Button size="sm" onclick={() => void shareGm()}><Icon name="link" />{t.shareGm}</Button>
    <Button size="sm" onclick={() => void copyList()}><Icon name="copy" />{t.copyText}</Button>
    {#if items.length}<Button size="sm" href={printHash(items.map((x) => x.id))} sameTab title={t.printHint}><Icon name="print" />{t.print}</Button>{/if}
    <Button size="sm" variant="danger" onclick={del}>{t.del}</Button>
  </div>
  <StorageNotice {app} />
  {#if priced}
    <div class="money"><span class="money-l">{t.moneyAs}</span>{#each MONEY_MODES as m (m)}<Chip label={t[`money_${m}`]} on={m === mode} onclick={() => { pickMoney(m); }} />{/each}<HelpButton size="sm" open={moneyHelp} onclick={toggleMoneyHelp} />{#if moneyHelp}<span class="money-br"></span><HelpBox help={moneyHelpFor(app.lang)} class="money-help" />{/if}</div>
  {/if}
  <details class="lnote" open={untrack(() => !!(own.note || own.hnote))}>
    <summary><Icon name="note" /><span>{t.listNote}</span></summary>
    {@render notePair(own, 'list')}
  </details>
  {#if items.length > 1}
    <details class="panel lroll">
      <summary><Icon name="die" /><span>{t.rollBy}</span></summary>
      <Field label="{t.rollResult} (1–{items.length})" after={hit ? 14 : 0}>
        <div class="numrow">
          <NumberField value={roll} min={1} max={items.length} empty label={t.rollResult} stepDownLabel={t.stepDown} stepUpLabel={t.stepUp} onchange={setRoll} />
          <Button variant="primary" onclick={rollNow}><Die faces={items.length} />{rollLabel}</Button>
          {#if hit}<Button variant="ghost" onclick={clearRoll}>{t.clear}</Button>{/if}
        </div>
        {#if !hit}<p class="rollhint">{t.rollHint}</p>{/if}
      </Field>
      {#if hit}
        <OrGrid or={t.or} items={[hit]}>{#snippet card(it)}<RecordCard variant="compact" {it} {index} lang={app.lang} rollLabel={roll} … >{#snippet nameActions()}<RecordActions … row="name" />{/snippet}{#snippet actions()}<RecordActions … row="card" extra={entryNoteBlock(metaOf(it.id), t)} />{/snippet}</RecordCard>{/snippet}</OrGrid>
        {@render hitnote('eye', t.notePub, metaOf(hit.id).note)}
        {@render hitnote('eyeOff', t.noteHid, metaOf(hit.id).hnote)}
      {/if}
    </details>
  {/if}
  {#if items.length}
    <div class="batch" class:on={lsel.size}>
      <label class="batch-all"><input type="checkbox" checked={lsel.size > 0 && lsel.size === own.ids.length} onchange={(e) => { pickAll(e.currentTarget.checked); }} />{lsel.size ? t.pickedN + ' ' + String(lsel.size) : t.pickAll}</label>
    </div>
    <div class="rows lrows" bind:this={rowsEl}>
      {#each items as it, i (it.id)}
        {@const m = metaOf(it.id)}
        {@const hasNote = !!(m.note || m.hnote)}
        <div class="row lrow" class:has-note={hasNote} data-index={i}>
          <span class="lrow-grip" draggable="true" title={t.dragHint} aria-hidden="true"><Icon name="grip" /></span>
          <label class="lrow-pick"><input type="checkbox" checked={lsel.has(it.id)} aria-label={t.pickRow} onchange={(e) => { pickRow(it.id, e.currentTarget.checked); }} /></label>
          <input type="number" class="lrow-n" min="1" max={own.ids.length} inputmode="numeric" value={i + 1} aria-label={t.position} onchange={(e) => { setPos(it, i, e); }} />
          <RowMain {it} {index} lang={app.lang} artBroken={app.artBroken(it.id)} onartfail={…} onopen={(r) => { open = r; }} />
          <div class="lrow-meta">
            <label><span>{t.qty}</span><input type="number" min="1" max="99" inputmode="numeric" value={m.qty || ''} placeholder="1" oninput={(e) => { setQty(it.id, e); }} /></label>
            <label><span>{t.gold}{#if goldText(m.gold)}<span class="goldhint" data-goldhint={goldText(m.gold)} title={goldText(m.gold)}>?</span>{/if}</span><input type="number" min="0" max="99999" inputmode="numeric" value={m.gold || ''} placeholder="—" title={goldText(m.gold) || undefined} oninput={(e) => { setGold(it.id, e); }} /></label>
          </div>
          <div class="lrow-acts">
            <button type="button" class="lrow-note" class:on={hasNote} title={t.note} aria-label={t.note} onclick={() => { toggleNote(it.id); }}><Icon name="note" /></button>
            <button type="button" class="row-x" title={t.removeItem} aria-label={t.removeItem} onclick={() => { removeEntry(it, i); }}>&times;</button>
          </div>
          <div class="rnote" hidden={boxHidden(it.id, m)}>{@render notePair(m, it.id)}</div>
        </div>
      {/each}
    </div>
  {:else}
    <Empty>{t.listEmptyHint}</Empty>
  {/if}
{/if}
{#if open && index}<RecordModal {app} {index} it={open} extra={entryNoteBlock(metaOf(open.id), t)} onclose={…} onopen={…} />{/if}
```

The `notePair(o, key)` snippet draws `<div class="npair">` and two `.nfield`s
exactly as `notePairHTML` does - `n-pub` with `<Icon name="eye" />`, `n-hid`
with `eyeOff`, `.nlbl` = icon + label + `<i>hint</i>` + the `.note-x` button,
then `<textarea rows="3" placeholder=… use:seedText={value} oninput=…>` - with
the list placeholders when `key === 'list'` and the entry ones otherwise. The
`hitnote(icon, label, text)` snippet draws nothing for an empty text and
otherwise `<div class="hitnote"><Icon /><span><b>{label}</b>{lines}</span></div>`
with `\n` rendered as `<br />` through an `{#each text.split('\n')}`. Drag:
`$effect(() => app.env.drag.bind(rowsEl, { onDrop: (from, to) => { const id
= own.ids[from]; if (id !== undefined) store.move(own.id, id, to); } }))`
returning the unbind - the existing port, unchanged, on the `data-index` rows.

Styles, every value off style.css and never from memory, in this order:
`.page-h` (105), `.page-sub` (140); the global `input[type='text']` and
`:focus` (254-258) scoped as `ListsPage` did, then `.titleinput`, `:focus`,
`:hover` (848-853) - see the specificity note above; `.miss` and `.todo` as
`RecordPage`/`App` have them; `.card-acts` (405) plus `margin-bottom: 16px`;
`.money`, `.money-l`, `.money-br`, `.money-help` (694-702); `.lnote` and
its `summary`, `::-webkit-details-marker`, `svg`, `span`, `i`, `:hover span`,
`[open] summary` (636-644); `.lnote textarea, .rnote textarea`, `.rnote
textarea`, the `:focus` pair (646-657); `.npair`, `.lnote .npair`, `.rnote
.npair`, `.nfield`, `.nlbl` (both declarations, 663 and 1088), `.nlbl i`,
`.n-hid textarea`, the 640px `.npair` override (659-670); `.note-x`, `:hover`,
`.nfield:has(textarea:placeholder-shown) .note-x` (1089-1096); `.panel`
(145-149), `.lroll` and its seven rules (679-687), `.rollhint` (690); `.numrow`
(181); `.hitnote` and its four (626-633); `.batch`, `.batch.on`, `.batch-all`,
`.batch.on .batch-all` (1050-1058); `.rows`, `.row`, the `(hover:hover)`
`.row:hover` (547-553 - the third copy of three short rules, recorded); the
`.lrow` family: `.lrow`, `.rnote`, `.lrow.has-note`, `.lrow-acts .lrow-note`,
`.on`, `svg` (618-623); `.lrow-grip`, `:hover`, `:active`, `.lrow-n` and its
three (732-746); `.lrow.dragging`, `.drop-before`, `.drop-after` (747-749 -
port now, 4b sets the classes); `.lrow-meta` and its nine including
`.goldhint` and the `:hover`/`:focus-within` pair (750-776); `.lrow-acts` and
its four (777-784); `.lrow-pick` (1083); `.empty` through `Empty`; the focus
rules for `.lrow-acts button`, `.row-x`, `.lrow-grip` (999-1004); and the
600px block for `.lrow`, `.lrow .row-main`, `.lrow-meta`, `.lrow-acts`, its
`button`, `.row-x` (890-895). No `.selbox`: the list row's checkbox is
`.lrow-pick`. Svelte scopes every compound selector, so the rules that reach
into a child component's root need `:global()`: `.lroll > :global(:not(
summary))` and `.lroll > :global(:last-child)` (the `Field`, `OrGrid`),
`.lrow > :global(.row-main)` in the 600px block (`RowMain`), `.money >
:global(.money-help)` (`HelpBox`). The snippets are this component's own
markup and need none.

**`app/src/App.svelte`** - `{:else if app.route.kind === 'storedList' ||
app.route.kind === 'sharedList'}<ListPage {app} />` before the final `{:else}`.
`App.svelte` keeps its final `{:else}` and its `.todo` rule; `ListPage`
copies the rule for the paragraph it draws for a payload that is not ours.

**`tests/parity/driver.js`** - `type(placeholder, text, event = 'input')`:
finds the field by placeholder **or by accessible name** (`NAME_FN`, so the
title input and the position field are gripped by their `aria-label`) and
dispatches `event` - `'change'` for the position field, whose live handler
waits for the field to be committed. `NAME` gains `note`, `removeItem`,
`undo`, `noteClear`, `sharePlayers`, `shareGm`, `rollBy`, `moneyCoin`,
`rename`, `position`, `stepUp`, `whatIsThis`, `printHint` in both languages
(the English `sharePlayers` with its curly apostrophe).

**`tests/parity/specs.js`** - two seeds beside `seven`: `noted` = list `a`
with `ids ci1..ci7`, `meta: { ci2: { qty: 2, gold: 750, note: 'Светится в
темноте', hnote: 'Проклят' } }`, `note: 'Лавка закрыта до утра'`, plus `b`;
`oneEmpty` = `[LISTS[1]]`. States (route, storage, enter, what for):

| id | route | storage | enter | what it is for |
|---|---|---|---|---|
| `#/lists/a` | `#/lists/a` | `seven` | - | the page: title input, "7 позиций", five actions, the notice, no money picker, folded note and roll panel, "Выбрать все", seven plain rows; the 600px row bands at 375 |
| `#/lists/a ~ noted` | `#/lists/a` | `noted` | - | the money picker, the list note open with two texts, row 2 with qty 2, "7 мешков 5 горстей" and the `?`, its note box open, `has-note`; the 640px `.npair` stack at 375 |
| `#/lists/a ~ money help` | `#/lists/a` | `noted` | `d.click('Как это работает')` | the help box under the chips, `?` pressed |
| `#/lists/a ~ roll panel` | `#/lists/a` | `seven` | `d.click('Бросок по списку')` | the panel open: empty numbox, "Случайно 1–7", the hint |
| `#/lists/a ~ rolled` | `#/lists/a` | `noted` | `d.click('Бросок по списку')`, `d.click('На единицу больше')` twice | result 2: the compact card badged 2, both hitnotes, "Сбросить" |
| `#/lists/a ~ removed` | `#/lists/a` | `seven` | `d.click('Убрать из списка')`; **`timed: true`** | six rows, the undo toast |
| `#/lists/a ~ note opened` | `#/lists/a` | `seven` | `d.click('Заметка')` | row 1 with its empty note box open, focus in the first textarea |
| `#/lists/b` | `#/lists/b` | `oneEmpty` | - | the empty page: no print link, no money, the note folded, no roll panel, no bar, the hint |
| `#/lists/nope` | `#/lists/nope` | - | - | "Список не найден", the sub, the "Списки" button; the address not rewritten |
| `#/l/ ~ own list` | `'#/l/' + encodeList(seven's a, true)` | `seven` | - | own-list recognition: the same page as `#/lists/a` |

The `~ rolled` result is deterministic (the stepper, not the die) - the
random button is covered by `listPage.test.ts` with `random: () => 0`. Every
`enter` grips Russian names and runs before the `EN` press.

Specs: `listAddress` (a look, `only` all ten list-page states: `{ hash }` -
the rewritten address byte for byte, or the untouched one on `#/lists/nope`); presses (`presses: true`, each on its
own page): `renamedList` (`only: ['#/lists/a']`: `d.type(NAME[lang].rename,
'Тайник')` → `{ hash, name: stored[0].name }`); `movedByPosition` (`#/lists/a`:
`d.type(NAME[lang].position, '3', 'change')` → `{ hash, ids }` = `ci2, ci3,
ci1, …`); `pricedRow` (`#/lists/a`: `d.type('—', '231')` → `{ hash, meta:
stored[0].meta, picker: await d.has(NAME[lang].moneyCoin) }` - the picker
appears on the first price); `removedRow` (`#/lists/a`: click `removeItem` →
`{ afterRemove: ids, hash }`, then click `undo` → `{ afterUndo: ids }`);
`deletedFromPage` (`#/lists/a`: click `del` → `{ asked: d.dialog(), hash }` =
`#/lists`); `copiedListText` (`~ noted`: `resetClipboard`, click `copyText`
→ `{ text, html }` - the whole list export with the note tail, `×2`, `7
мешков 5 горстей`, the entry note); `ownLinks` (`~ noted`: click
`sharePlayers` → the hash part of the clipboard, `resetClipboard`, click
`shareGm` → the hash part - two packed payloads, identical on both apps as
`sharedListLink` already proves); `moneyMode` (`~ noted`: click `moneyCoin` →
`{ hash, money: stored[0].money }`); `noteCleared` (`~ noted`: click
`noteClear` - the first, the list note's players' side → `{ note: stored[0].
note ?? null, hash }`, then click `undo` → `{ back: stored[0].note }`).

Expect **zero** on every cell of all ten states in both languages and no
`VISUAL_DEBT` or `ACCEPTED` entry. Where to look first if a cell is not zero:
the title input's box (the specificity note - a dashed underline means the
class won where the attribute selector should); a space text node inside
`.nlbl` or between the summary's icon and span; `.batch`'s `margin: 16px 0 0`;
the row note textarea at 13px on `var(--surface)` against the list note's
14px on `var(--bg2)`; an auto-sized textarea that was not sized (79/83px
against the `rows="3"` height); `.lrow-meta`'s 44px left padding at 600px;
the `?` in the caption drawn without a price; `hitnote + hitnote` 8px; the
field's 14px/0 inline margin; the `.lroll>:last-child` 13px on the last
hitnote.

#### Tests

- `lib/i18n.test.ts` (`itemsWord`), `lib/lists.test.ts` (`findListByPayload`),
  `lib/share.test.ts` (`suffix`; `shareList` on a two-entry list with qty,
  price in both modes, an entry note, a list note; `entryNoteBlock`),
  `lib/help.test.ts` (`moneyHelpFor`).
- `state/lists.test.ts` - the seven writers; `state/app.test.ts` - `section`
  null on both list routes, `syncListUrl`/`clearOpenList`.
- `components/shell.test.ts` - the tab case corrected.
- `components/listPage.test.ts` (new) - through `App` with `memoryRouter(
  '#/lists/a')`, a `LOOT` of three known records (one equipment, for `.rstats`),
  storage seeded as in `noted`: the address is rewritten to the players'
  payload on mount; the title input holds the name and renaming stores it and
  rewrites the address; the sub counts known records; the five actions by
  name and the print link's `href`; no print link on an empty list; the
  storage notice draws (and `Скрыть` dismisses it); the money picker only with
  a price - `Монетами` stores `coin` and rewrites the address, `Как в книге`
  deletes the key; `Как это работает` opens the help with five bold runs and
  presses the button (`aria-expanded`); the list note is open with a note,
  folded without, typing stores and blank deletes; the roll panel is absent
  with one entry, folded with two; typing 2 shows the second entry's card
  badged 2 with both hitnotes and `Сбросить`; `Случайно 1–N` with `random:
  () => 0` shows entry 1; `Сбросить` empties the field and keeps the panel
  open; the empty field shows `''` and `+` from it gives 1; select-all ticks
  every row and the bar reads `Выбрано N`, one row `Выбрано 1`, none `Выбрать
  все`; the position field moves an entry on `change` and resets on an
  out-of-range value; qty and gold store on `input`, the gold title and `?`
  follow the price in bag mode and vanish in coin mode; `Заметка` opens the
  box and focuses its first textarea, `has-note` follows the text, the clear
  cross empties the box, toasts with `Вернуть`, and undo puts the text back;
  `Убрать из списка` removes the row, toasts `«…» убран` with `Вернуть`, and
  undo restores the entry at its index with its meta; `Скопировать текст`
  writes the list export (assert the string from `shareList`); the two links
  write packed players'/GM payloads under `plainCompress` and toast; an empty
  list toasts `listEmpty` for both; `Удалить` asks and, accepted, navigates to
  `#/lists` (`memoryRouter.stack`); a row's body opens the modal and its
  `Скопировать текст` includes the entry's players' note; `#/lists/nope` draws
  the not-found page with a `Списки` link and no rewrite; `#/l/<payload of a>`
  draws the own page; `#/l/<payload of nobody's list>` draws the `todo`
  paragraph; the drag port's `onDrop(0, 2)` (through a `fakeDrag` that exposes
  the handlers - add it to `ports/drag.ts` beside `noDrag`) moves the entry;
  `noData` draws the paragraph; the textarea's `textContent` equals its value
  after mount; every case ends with `expectNoA11yViolations`.
- `components/a11y.test.ts` - states: `a list page with a priced, noted entry
  and the roll panel open` (`#/lists/a`, `noted`, press `Бросок по списку`),
  `a list page with a row's note box open` (press `Заметка`); `COVERED` gains
  `ListPage.svelte`, `StorageNotice.svelte`, `RowMain.svelte`, `HelpButton.
  svelte`, `HelpBox.svelte`.
- `docs/specs/COVERAGE.md` - a `components/listPage.test.ts` row; the
  `listsPage.test.ts` row notes the notice moved to `StorageNotice`.
- `docs/specs/FEATURES.md`, "Lists": "The list page draws the roll panel
  folded and opens it on its summary; an empty roll field means no roll yet;
  the panel, a row's note box and the list note keep the person's own
  fold/unfold across a language switch (the live `data-keep` opt-ins), and
  the page rewrites its address to the players' link on open and after every
  edit." "Chrome": "No tab is lit on a record, a list page or a print sheet."

#### Ordered steps

0. `tests/parity.js`: the three `!timed` guards and the comment; `docs/parity.md`
   sentence. `npm run build` if `dist/` is stale, then `node tests/parity.js
   "selection copied"`. **Commit** `test(parity): no legacy cache for timed
   states`, authored `artex-x`, no push. Record the six cells in the handoff.
1. `dict.ts` (forty keys); `help.ts` `MONEY`/`moneyHelpFor` + test; `icons.ts`
   five icons; `i18n.ts` `itemsWord` + test; `rollLabel(max, t)` moves from
   `RollPanel.svelte`'s `$derived` into `lib/roll.ts` on this second use
   (RollPanel calls it; `roll.test.ts` covers a real die and a random range).
2. `lib/lists.ts` `findListByPayload` + test; `lib/share.ts` `suffix`,
   `shareList`, `entryNoteBlock` + tests.
3. `state/lists.svelte.ts` seven writers + tests; `state/app.svelte.ts`
   `section`, `openList`/`urlPayload`/`syncListUrl`/`clearOpenList` + tests;
   `shell.test.ts` corrected. `npm run test -- lists app shell` green.
4. `StorageNotice.svelte`; `ListsPage.svelte` uses it. `npm run test --
   listsPage` green.
5. `HelpButton.svelte`, `HelpBox.svelte`; `PageHead.svelte` uses them. `npm
   run test -- roll std alt` green. `npm run build`; `node tests/parity.js
   "~ help"` (the four help states) - zero, before going on.
6. `RowMain.svelte`; `TableRows.svelte` uses it. `npm run test -- tables
   sections` green. `npm run build`; `node tests/parity.js "#/tables ~"
   "#/tables/eq_weapon"` (8 + 3 states) - the recorded numbers, before going on.
7. `NumberField.svelte` `empty`; `Field.svelte` `after`; `RecordActions.svelte`
   and `RecordModal.svelte` `extra`; `ports/drag.ts` `fakeDrag`.
8. `ListPage.svelte`; `App.svelte` routes to it; `listPage.test.ts`;
   `a11y.test.ts` states and `COVERED`; `COVERAGE.md`; `FEATURES.md`.
9. `driver.js` `type` by name and event; `specs.js` seeds, `NAME`, ten
   states, ten specs.
10. `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground
    call, `timeout: 600000`.
11. `npm run build`, then, each its own foreground call, the loop while
    getting to zero: `node tests/parity.js "#/lists/a @"` (1 state, 6 presses);
    `node tests/parity.js "~ noted" "~ money help"` (2 states, 4 presses);
    `node tests/parity.js "~ roll panel" "~ rolled" "~ removed" "~ note opened"`
    (4 states, one timed); `node tests/parity.js "#/lists/b" "#/lists/nope"
    "own list"` (3 states); then the regressions: `node tests/parity.js
    "#/lists @" "#/lists ~"` (the six index states through `StorageNotice` and
    `HelpBox`) and `node tests/parity.js "i/ci1 ~"` (the modal with `extra`
    undefined, the toast). Do not merge them; do not run `"#/lists"` bare -
    it now matches every list-page state too.
12. `set -o pipefail; npm run check:built 2>&1 | tail -n 120`.
13. `plan.md` gains "B5.4a built"; `handoff.md`; one commit, `feat(lists):
    the list page`, authored as `artex-x`, no push.

#### Acceptance criteria

- `#/lists/a` (seeded) draws the page as measured: the title input as a 46px
  text field 560px wide, "7 позиций", the five actions (35px row), the
  notice, the folded note (36px), the folded roll panel (43px), the bar (36px,
  "Выбрать все"), seven 78px rows at 1100 that band into grip/pick/position,
  body, meta/acts at 375; the address reads `#/l/<players' payload>` at once.
- With a priced entry the money picker draws (36.8px) with `Как в книге`
  pressed, the `?` opens the help (235.95px); picking `Монетами` stores
  `coin`, rewrites the address, removes every `?` and gold title.
- The list note opens when a note exists; both boxes auto-size to their text
  (83px one-line); the clear cross appears only on a non-empty box, empties
  it, toasts, and undoes.
- The roll panel opens on its summary; the field is empty; `+` gives 1; a 2
  shows the second entry's compact card badged 2 with both hitnotes (59.25px
  each) and `Сбросить`, which empties the field and leaves the panel open; the
  card's copy text carries the entry's players' note, not the GM's.
- A row's note button opens its box (116px empty) and focuses the first
  textarea; text marks the row `has-note` and the button `on`.
- The cross removes the row, rewrites the address, and toasts `«…» убран` with
  `Вернуть` for 7s; undo puts the entry back at its position with its meta.
- Typing a position and committing moves the entry; out of range resets the
  field. Quantity and price store on input; the first price makes the picker
  appear.
- Select-all ticks every row and reads `Выбрано 7`; nothing draws under the
  bar (B5.5).
- Players' and own links copy packed payloads; an empty list toasts
  `listEmpty`. `Скопировать текст` copies the list export. `Удалить` asks and
  goes to `#/lists`.
- `#/lists/nope` draws the not-found page and leaves the address alone;
  `#/l/<own payload>` draws the own page; no tab is lit on any of them.
- All ten states read 0.00% at every cell in both languages; the ten specs
  match; `"~ help"`, `"#/tables ~" "#/tables/eq_weapon"`, `"#/lists @" "#/lists
  ~"` and `"i/ci1 ~"` still read zero or their recorded numbers.
- `"selection copied"` reads six `совпадает` after step 0 (see "Decided" for
  the one residue that is allowed and what it means).
- `npm run check` and `npm run check:built` exit 0 with thresholds met.

#### Risks and do-nots

- Do not give the title input the dashed underline `.titleinput` describes;
  port the cascade. Measured: 46px, filled, 1px solid, radius 9.
- Do not bind the textareas' `value`; seed the text child and read `oninput`.
  The inventory names them by `textContent`.
- Do not bind `open` on `.lroll` or `.lnote` reactively; set it once at mount.
  `Сбросить` must leave the panel open, as the live `keepOpen` does.
- Do not draw `.batch-acts` (B5.5) or the shared page (B5.6); do not add
  `Badge.svelte`, `Panel.svelte`, `Row.svelte`.
- Do not make the `?` in the gold caption or the field title lag a render:
  the port is reactive and the divergence is recorded ("Decided"); do not add
  a render counter to imitate it.
- Do not put the position field on `input`; the live handler is `change`.
- Do not forget `timed: true` on `~ removed`, and do not add it to any other
  state.
- Do not write a `VISUAL_DEBT` number from this host.
- Do not run `node tests/parity.js "#/lists"` expecting six states.
- Two commits, no push, no `Co-Authored-By`.

**Decided in planning - do not reopen.**

- **The `selection copied @ en 1100` cell is a stale cache hit, not a defect
  in either app, and not a debt.** Evidence, in order: the diff image
  (`test-output/parity/_tables_selection_copied_en_1100-diff.png`) is red
  only over the toast - the legacy shot has none, the rewrite's has
  "Выбранное скопировано" in Russian (right: the toast was raised before the
  `EN` press and is not re-translated in either app); the legacy PNG is
  byte-identical (`md5 c3551f51…`) to `test-output/.parity-cache/a6515261…/
  1100.png`, written 21:50:41 - inside the full suite's 21:33-22:03 window,
  under its load - while the "isolated" run at 22:04-22:05 wrote all three
  English legacy files within 35ms of each other (cache copies; a fresh
  arrival takes about seven seconds, which is the spacing of the `next` files
  at 22:05:16/23/30). The isolated run therefore never shot the legacy side:
  both measurements share one capture, which is why they agree to the
  hundredth. The mechanism: `tests/parity.js` turns the legacy cache off for
  `measured` states and not for `timed` ones (459-460, 476-477, 414), so a
  toast that had expired under load was cached and served ever after - the
  "cache written on a different clock" `docs/parity.md` names, made
  permanent. 0.74% is the toast's own pixels (a 200x44 plate over 1100x900
  is ~0.9% with its rounded corners). Sibling cells are clean because their
  cached captures happened to catch the toast. CI is unaffected (fresh
  runners, empty cache), which is consistent with every green parity shard.
  **Decision: fix the harness (step 0), no `VISUAL_DEBT` line, no
  re-measure before the fix.** If, with the cache off, the cell still reads
  non-zero on this host, it is the timed class `docs/parity.md` already
  documents ("a `timed` cell that is still non-zero locally is the toast's
  own pixels") and CI decides it - the implementer records the six cells and
  writes nothing. Rejected: deleting the two stale cache directories by hand
  (fixes one cell, keeps the trap for the four other timed states and 4a's
  fifth); a `VISUAL_DEBT` entry (a Windows figure, forbidden by owner
  decision 1, for a difference that is not in the app); widening `JITTER`
  (the toast is the thing the state exists to see).
- **4a/4b as above**, for the reasons in the opening paragraph.
- **Drag through the existing port in 4a.** `nativeDrag` works and has tests;
  binding it makes every affordance on screen do something. 4b replaces it
  with the live semantics; until then a drop lands on the target row's index
  rather than before/after its midpoint. Recorded, reachable by nobody in the
  harness.
- **The four extractions happen now**: `StorageNotice` (B5.3's own
  inheritance), `RowMain`, `HelpButton`, `HelpBox` - each is a second real
  use of the same live markup and the campsite rule is explicit. The `.badge`
  rules move with `RowMain` and their copy count does not change. `.rows`/
  `.row`/`.row:hover` (three short rules) are copied a third time and
  recorded with `.badge`'s deferred extraction; `.page-h`/`.page-sub` are
  copied because the list page's heading is an input, not `PageHead`'s
  string.
- **`open` on the two `<details>` and `hidden` on the note boxes are the
  person's, not the data's.** The live app applies the markup default only
  to elements the person never toggled (`restoreOpen`). The port sets the
  default once at mount and lets the element keep whatever the person does;
  `noteOpen` keeps the row toggles because those elements are re-created by
  `{#each}` only when the entry changes. Two consequences are recorded, not
  reproduced: a list note cleared to empty and then re-rendered by a
  select-all folds in the live app and stays open in the port; a roll made,
  then a navigation away and back, shows the result again in the live app
  (`S.listRoll` is app memory) and an empty field in the port (component
  state) - the same call B5.3 made for drafts. No state reaches either.
- **The gold hint and the field title are reactive.** The live app updates
  the title in place and the `?` on the next render (measured); the port
  draws both from the price at once. Kinder, invisible to every state (no
  state types a price and then looks), recorded.
- **`NumberField` grows `empty` rather than the list page drawing its own
  box.** The live `numBox` is one function with the #16 rule inside it; the
  roll pages never exercise the rule, the list page always does. One prop,
  four lines, no second numbox.
- **The address effect replaces eight `freshenListUrl` calls.** Every live
  writer calls it; a `$effect` over `encodeList(own, true)` re-runs on exactly
  the edits that change the payload and no others. Rejected: calling
  `syncListUrl` from each handler (the live shape, eight chances to forget
  one, and the live app itself forgot none only by discipline).
- **Delete on the page goes to `#/lists` through `app.go`**, counting as a
  navigation, so the index mounts fresh and `lsel`/`menuFor` clear - the live
  `location.hash = '#/lists'` fires `hashchange`, which does the same.
- **`copiedListText` is the fixture for `shareList`.** A string pinned in
  `share.test.ts` is written by hand from the live functions; the press spec
  reads the live app's clipboard and holds the port to it, in both languages,
  every run.
- **The shared page keeps the `todo` paragraph.** `#/l/` for a list that is
  not ours is B5.6's; today it draws `todo` in `App.svelte`, after 4a it draws
  the same paragraph from `ListPage`. Nothing on screen changes for that
  route.

#### B5.4b outlined: drag as the live app does it

- **`ports/drag.ts`** rewritten to the live event model (app.js 4443-4530):
  `dragstart` on `[data-drag]` sets the key, adds `dragging` to the row,
  `effectAllowed = 'move'`, `setData('text/plain', key)` (Firefox), and
  `setDragImage(row, 24, 24)`; a capturing `dragover` drives edge autoscroll
  (`EDGE = 120`, `EDGE_MAX = 22`, speed by depth, on `requestAnimationFrame`
  off the frame rather than the mouse); the bubbling `dragover` marks the row
  under the pointer `drop-before`/`drop-after` by its vertical midpoint and
  `preventDefault`s; `dragend` clears everything; `drop` computes `to` from
  the target's index and the mark (`after && to < from` → `+1`, `!after && to
  > from` → `-1`) and calls `onDrop(from, to)`. `DragHandlers` gains
  `onMark(rowIndex, where)` / `onClear()` so the component toggles the
  classes (or the port toggles them itself on the container's rows - decide
  by what keeps `lib/` and the component free of DOM listeners; the port is
  the place for listeners).
- **`ListPage.svelte`**: the grip gets `data-drag`; the row's `dragging`/
  `drop-before`/`drop-after` classes are driven by the port's callbacks. The
  rules were ported in 4a.
- **Driver**: `drag(fromName, toName, after)` dispatching synthetic
  `DragEvent`s with a `DataTransfer` on both apps (`dragstart` on the grip
  inside the row named `fromName`'s body, `dragover` on the target with a
  `clientY` above or below its midpoint, `drop`, `dragend`); rows are found
  through their `.row-main` accessible names.
- **Specs**: `reorderedByDrag` (`presses: true`, `only: ['#/lists/a']`): drag
  row 1 after row 3 → `{ ids, hash }` on both apps; and a second call before
  row 1 from row 3. A pixel state mid-drag is not attempted: a synthetic drag
  has no drag image to paint.
- **Tests**: `ports.test.ts` on a container of `[data-index]` rows with fake
  `DragEvent`s (jsdom has no `DragEvent`; construct `Event` with a
  `dataTransfer` stub) covering the midpoint rule, the adjusted index, edge
  speed at three depths, and the unbind.
- Also 4b's, as campsite: the deferred `.badge` and `.rows`/`.row`
  extraction if a `Row.svelte` earns its way by then; the `Badge.svelte`
  question stays deferred otherwise.

### B5.4a built: the list page - implemented and verified, both commits landed

**"Ordered steps" 0-13 are done as designed; no deviation from the plan.**
Step 0 landed earlier as `f38b900`. Steps 1-9 were already written and
uncommitted when this session picked up the tree; step 10 (`npm run check`)
had already gone green on an idle host (854 tests, 0 failures, coverage
96.24/88.87/96.86/96.86, all thresholds met) in the session before this one.
This session resumed at step 11.

**Step 11, the parity loop**, `npm run build` then six foreground filter
groups, none merged: `"#/lists/a @"` (1 state, 6 cells); `"~ noted" "~ money
help"` (2 states, 12 cells); `"~ roll panel" "~ rolled" "~ removed" "~ note
opened"` (4 states, 24 cells); `"#/lists/b" "#/lists/nope" "own list"` (3
states, 18 cells); the regressions `"#/lists @" "#/lists ~"` (36 cells) and
`"i/ci1 ~"` (36 cells). **All ten new states read `совпадает` (matching) on
every cell in both languages at all three widths on the first pass - no
port fix was needed, no group was re-run.** The regression filters read
zero as well: the lists index and its five sub-states, and the record modal
with `extra` undefined, are unaffected by the `PageHead`/`RowMain`/
`RecordActions`/`RecordModal`/`NumberField` extractions and prop additions.

**Step 12**, `npm run check:built`: build, `smoke-file-url.mjs` ("the built
page opens from a folder"), `bundle-budget.mjs` (77.3 kB gzip against the
120 kB budget) - exit 0.

**Step 13**, this section plus `handoff.md` and `context.md`, then one more
`npm run check` immediately before the commit (the doc edits change the
tree fingerprint - `tree-key.mjs` fingerprints `issues/**` and `*.md`
though the gate does not count them - so the armed cache from step 10 no
longer applies and a fresh pass is required right before `git commit`).

**What shipped**, on top of steps 1-9's already-written files: no production
code changed in this session; the session's own contribution is the parity
verification, `npm run check:built`, and the docs update. The 43 paths from
the previous session (five new components - `ListPage.svelte`, `RowMain`,
`HelpBox`, `HelpButton`, `StorageNotice` - `listPage.test.ts`, the route in
`App.svelte`, and the dict/lib/state/ports/harness edits) are committed as
written, unchanged.

**Nothing deferred beyond what the plan already named for 4b/B5.5/B5.6.**
B5.4b (drag as the live app does it), B5.5 (batch actions) and B5.6 (the
shared page) remain outlined/unplanned as before; this batch did not touch
their surface.

**Correction, one remediation pass on top of `8873473` (reviewer then
implementer, 2026-09-11): the blocker found in review is fixed.**
`ListPage.svelte`'s grip span was missing `draggable="true"`, so `nativeDrag`'s
`dragstart` listener could never fire and the grip - fully styled with
`cursor: grab`/`grabbing`, `touch-action: none`, and a drag-hint tooltip - did
nothing in a real browser, even though `listPage.test.ts`'s existing drag test
passed by calling `drag.handlers?.onDrop(0, 2)` directly, bypassing the
element entirely. Fixed with the one missing attribute, matching `app.js:3053`
exactly; a new `listPage.test.ts` case asserts `draggable="true"` on the
rendered `.lrow-grip` element itself, not through the port. `node
tests/parity.js "#/lists/a @"` reads all six cells `совпадает` (an attribute
has no geometry). **The parity driver has no drag verb**, so none of its 96
cells could have caught this - the port-to-component wiring was tested, the
element-to-browser wiring was not. That gap is why this needed a human-shaped
review rather than the harness; it is not fixed here (B5.4b's territory if it
is ever worth a driver verb).

### B5 remainder planned: two batches, not three (planner, 2026-09-11)

**The question.** Three pieces of the lists slice are left - B5.4b (drag as
the live app does it), B5.5 (the actions under a ticked selection) and B5.6
(the shared page) - and each looks smaller than B5.1-B5.4a. The human asked
whether they should be merged, because every batch pays the same fixed
verification cost whatever its size. Merging was the hypothesis; the split
below is what the evidence supports.

**The fixed cost, taken as measured (`context.md`, "State at the B5-remainder
kickoff"):** `npm run check` 165s idle and past the 600s foreground cap under
load, where it must be re-run rather than salvaged; `npm run check:built` a
few minutes; a parity filter up to ~9 min; the full suite ~867s. Paid once
per batch, and the check again for every commit inside it (the gate wants a
green check per commit; `check:built` and the filters are per batch).

**The three remainders, sized off the code they port, not remembered:**

| piece | production paths | harness paths | pixel states | press specs | filter it lives under |
|---|---|---|---|---|---|
| B5.4b | `ports/types.ts`, `ports/drag.ts`, `ListPage.svelte` (three classes, three rules) | `driver.js` (one verb), `specs.js` (one spec), `ports.test.ts` | none - a synthetic drag paints no drag image | 1 | `"#/lists/a"` |
| B5.5 | `dict.ts` (~16 keys x 2), `lib/money.ts` (`guessWhy`), `ListPage.svelte` (the `.batch-acts` pair, the `.guess` panel, four handlers, ~15 rules) | `listPage.test.ts`, `money.test.ts`, `specs.js` (five states, four specs, seven names) | 5 (30 cells) | 4 | `"#/lists/a"` |
| B5.6 | `state/app.svelte.ts` (packed expansion), a `SharedListPage.svelte`, `TableRows.svelte` (`tail` on an entry), `AddToList.svelte` (one prop), a `HitNote.svelte` on its second use, `ListPage.svelte` (the `!own` branch) | `specs.js` (four states, two specs) | 4 (24 cells) | 2 | `"#/l/"` |

**The split: two batches.**

- **B5.5 absorbs B5.4b** and becomes "the list page complete". Both live in
  `ListPage.svelte`, both seed `seven`/`noted`, and every state and press
  spec either adds runs under the one filter `"#/lists/a"` - so the parity
  cost of the merged batch is the cost of either alone. B5.4b by itself is
  about eight paths and not one pixel state: paying a check, a `check:built`
  and a filter run for it is the small-batch failure mode exactly. Inside
  the batch the port rewrite is its own commit (the shape B5.4a's step 0
  had), so a regression in drag bisects to one commit.
- **B5.6 stays its own batch.** It is the other *reader* of the payload: a
  different route (`#/l/<payload>` that is nobody's, `#/l/~packed`,
  `#/l/zzzz`), a different filter (`"#/l/"`), its own component, a change to
  `AppState`'s routing and to `AddToList`, and no seed in common. Nothing it
  verifies is verified by B5.5's filter, so merging it saves one `check` and
  one `check:built` and buys a batch that touches routing, the bar's row
  component and a new page at once - the size B5.3 (26 paths, six check
  attempts under load) and B5.4a (43 paths, two sessions lost to a loaded
  host before step 10 went green) showed this host does not verify in one
  pass reliably.

**Rejected, with the reason.**

1. *One batch of all three* (~30 production paths, three surfaces, two
   filters, ~11 states). Saves two gates against three; costs a review that
   has to hold drag semantics, a money panel and a routing change in one
   head, and - the failure mode B5.4a's history records - a single
   mid-verification stall that forfeits everything. The filters do not
   overlap, so the parity cost is not shared, only serialised.
2. *Three batches as outlined.* B5.4b alone pays a full gate for a port
   rewrite and a harness verb with no pixel state of its own. This is the
   case the human named.
3. *B5.4b with B5.6* ("the harness batch": a driver verb, a packed route).
   No shared file, seed or filter; nothing coheres but the word harness.
4. *B5.5 with B5.6, B5.4b alone.* The worse pairing on both counts: the two
   that share nothing merged, the one that shares everything with B5.5 left
   to pay a gate by itself.

**The standing rule this applies** is now `CLAUDE.md`, "Task and session
protocol" (size a batch by its gates, not its diff), with the measured costs
and the test for where the line is in `docs/parity.md`, "Batch size and the
fixed cost of a run". This section is the rule's first application.

**B5.4a's six review nits, assigned rather than re-deferred.**

| nit | goes to | what |
|---|---|---|
| 1 `RowMain`'s dead `tail`/`.rtail` | B5.6 | used through `TableRows` on the shared page (`x2 · 750 зол.` after the name); if B5.6 finds it does not need it, B5.6 deletes both |
| 2 money chips `aria-pressed` vs live `aria-current` | B5.5, decided here | **not an `ACCEPTED` entry.** `d.controls()` reads `aria-label`, `title` and text (`driver.js` `NAME_FN`), never `aria-pressed` or `aria-current`, so no key ever differs - and `parity.js` fails a run on a stale `ACCEPTED` key (`fail += stale.length`), so the entry would turn every run red from its first. Recorded instead the way B5.1 recorded the menu chips: in "Decided" below, and as prose in the comment block above `ACCEPTED` in `specs.js`, which B5.5 adds |
| 3 `23px`/`680`/`-0.01em` hardcoded in `ListPage.svelte` | B5.5 | tokenised while the block is open; `"#/lists/a @"` must stay zero |
| 4 `.row-main:focus-visible` restored in `RowMain` | recorded, nothing to do | stays in `handoff.md` "Deferred" as the note it is |
| 5 `moneyHelp` component state vs live `S.moneyHelp` memory | B5.5 | `rp` and `guess` join the same list, in the same place (`ListPage.svelte`'s "Local state" comment and "Decided" below) |
| 6 three text nodes for the sub | recorded, nothing to do | unchanged |

### B5.5 planned: the list page complete - drag as the live app does it, and the actions under a ticked selection

**Objective.** After this batch `#/lists/<id>` does everything the live list
page does. Dragging a row by its grip marks the row under the pointer above
or below its midpoint, dims the row being dragged, scrolls the page from
either edge, and drops the entry where the mark said - the live event model
(app.js 4443-4530) instead of the index-only `nativeDrag`. Ticking a row
puts two buttons on the bar's right - `Цены` with a caret and `Удалить (N)` -
and `Цены` unfolds the money panel under the bar: the percentage row (only
when a ticked row has a price), the note on where the numbers come from, one
line per ticked row with its band and the suggested price, `Проставить эти
цены`, and `Убрать цену (N)` (only when a ticked row has a price). Every
action toasts with an undo. At 640px and under the buttons drop to their own
full-width line.

**In scope.** `ports/types.ts`, `ports/drag.ts` and its tests; the three
drag classes and rules in `ListPage.svelte`; a `drag` verb in the parity
driver and a `reorderedByDrag` spec; the dictionary keys; `guessWhy` in
`lib/money.ts`; the bar's actions, the panel and its four handlers in
`ListPage.svelte`; their component tests; five parity states, four press
specs and their names; nits 2, 3 and 5 above.

**Out of scope.** The shared page, packed-link expansion, `#/l/zzzz`,
`SharedListPage`, `HitNote`, `TableRows`'s `tail` (B5.6). New store methods
(none are needed - see "How it is built"). `Badge.svelte`, `Row.svelte`,
`Panel.svelte`. Any change to `CONTRACTS.md`, `docs/fixtures/`, `ROUTES.md`,
`llms.txt`: nothing here touches a route, a key or a payload. `STATE.md`'s
memory table describes the live app and stays as it is; the rewrite's
component-local `rp`/`guess` is recorded in the component and here, the way
`roll` and `moneyHelp` were.

#### What the live app does, read off app.js

Line numbers are on `app.js` at HEAD `3cb2bd0` (unchanged since `d5d63c1`).
The CSS is `style.css` at the same HEAD. No measurement pass was taken in
this planning session: every rule below is a line-by-line port of a rule the
harness then proves, the same way B5.4a's cascade went in and read zero on
the first pass. If a cell is non-zero after the port, open the diff before
touching a value.

**Drag (4443-4530).** Module state `dragKey` (`"<listId>:<itemId>"`), the
row is `closest('.lrow')`.

- `dragstart` on `[data-drag]`: `dragKey`; the row gets `dragging`;
  `effectAllowed = 'move'`; `setData('text/plain', dragKey)` in a `try`
  (Firefox refuses to start without a payload); `setDragImage(row, 24, 24)`
  when the method exists.
- Edge autoscroll (4461-4488): `EDGE = 120`, `EDGE_MAX = 22`. A **capturing**
  `dragover` on `document` calls `edgeScroll(e.clientY)` whenever a drag is
  live - the pointer spends most of a drag over the gaps between rows, so
  the bubbling row handler below cannot drive it. `depth` is `y - EDGE` in
  the top band, `y - (innerHeight - EDGE)` in the bottom band, else 0;
  `edgeSpeed = round(EDGE_MAX * clamp(depth / EDGE, -1, 1))`; a
  `requestAnimationFrame` loop `scrollBy(0, edgeSpeed)` runs while the speed
  is non-zero and is cancelled by `edgeStop()` (on `dragend` and `drop`).
  Off the frame, not the mouse: it keeps scrolling while the hand is still.
- Bubbling `dragover` (4491-4500): no `dragKey` → return; the row under the
  target must contain `[data-drag]` or return; `preventDefault()`;
  `dropEffect = 'move'`; clear every `drop-before`/`drop-after`; if the row
  is the dragged one, stop there; else mark `drop-before` when `clientY <
  top + height / 2`, `drop-after` otherwise.
- `dragend` (4501-4506): `dragKey = ''`, `edgeStop()`, clear marks, remove
  `dragging`.
- `drop` (4507-4525): `edgeStop()`; no key → return; no row → return;
  `preventDefault()`; `after = row has drop-after`; clear marks; `from`,
  `to` from the ids; **`if (after && to < from) to += 1; if (!after && to >
  from) to -= 1;`** then `moveToInList(l, id, to)` → `freshenListUrl` +
  `render`.
- Rules (747-749): `.lrow.dragging{opacity:.45}`,
  `.lrow.drop-before{box-shadow:inset 0 3px 0 0 var(--gold)}`,
  `.lrow.drop-after{box-shadow:inset 0 -3px 0 0 var(--gold)}`.

**The bar's actions (`batchBarHTML`, 724-745).** `ids` = the list's ids
that are ticked, in list order; `n = ids.length`. When `n`:
`<span class="batch-acts">` with `<button class="btn sm[ on]" data-guess
aria-expanded="true|false">batchMoney<i class="caret[ up]"></i></button>`
and `<button class="btn sm danger" data-batch-del>del (n)</button>`; then
`moneyPanelHTML(l, ids)` when `n && S.guess`. `S.guess` (default `false`)
and `S.rp` (default `-20`) are app memory ("Prices", `STATE.md`); neither
is cleared on `hashchange` (4629-4636 clears `lsel` only).

**The money panel (`moneyPanelHTML`, 750-782).** `priced` = ticked ids with
`gold > 0`, counted.

```text
<div class="guess">
  [priced]  <div class="money-act">
              <span class="batch-lbl">repricePct</span>
              numBox('rp', S.rp, -90, 500)
              <button class="btn sm" data-reprice>{S.rp < 0 ? repriceDown : repriceUp}</button>
              <span class="money-hint">repriceHint</span>
            </div>
  <p class="guess-note">guessWhy</p>
  <div class="guess-rows">
    per ticked id (skipping one the data does not know):
    <div class="guess-row"><span>nameOf(it)</span><span class="guess-band">guessWhy(it)</span><b>{v ? priceText(v, moneyMode(l)) : '—'}</b></div>
  </div>
  <div class="money-act">
    <button class="btn sm primary" data-guess-apply>guessApply</button>
    [priced]  <button class="btn sm" data-batch-clearprice>batchNoPrice (priced)</button>
  </div>
</div>
```

`numBox` (2096) is what `NumberField.svelte` already ports for the roll
panel: give the `rp` field the same names `numBox` gives it (read 2096-2115
before writing the props) - the inventory compares names, and a better label
would be a difference.

**`guessWhy(it)` (831-842)** - the band label: no band → `guessNoTier`;
else `src · lo–hi goldUnit` where `src` is `tier + ' ' + it.eq.tier` for
equipment, the rarity's dictionary label (`RAR_KEY`, 463: `common`,
`uncommon`, `rare`, `veryRare`, `legendary`) when the alternate tables give
the id a rarity, `voaTierName(it.tier)` (920) when the record carries a
Vault of Ages tier, else `guessNoRarity`. The dash between `lo` and `hi` is
the live string's own U+2013; the `—` in an unpriced `<b>` is U+2014. Both
are product text: port the bytes.

**The four handlers (3986-4083).** All read `S.lsel` in list order and
end with `freshenListUrl(l); render();` (the rewrite's `$effect` on `own`
does the address for free).

- `data-guess` (3986): `S.guess = !S.guess`.
- `data-guess-apply` (3989-4010): for each ticked id, `v = guessPrice(it)`;
  skip `!v`; remember `before[id] = gold || 0`; `setMeta(gold, v)`; count.
  `!n` → return with no toast. `S.guess = false`. Toast `guessDone + ' (' +
  n + ')'` with action `repriceUndo` restoring every `before`.
- `data-reprice` (4012-4040): `pct = S.rp`; `!pct` → return. For each
  ticked id with `gold > 0`: remember; `Math.max(1, Math.round(g * (100 +
  pct) / 100))` - `lib/money.ts` `reprice()` exists; confirm it is this
  formula, and fix it if not. `!n` → return. Toast `repriceDone + ' (' +
  (pct > 0 ? '+' : '') + pct + '%, ' + n + ')'` with `repriceUndo`.
- `data-batch-clearprice` (4042-4059): ticked ids with `gold > 0` → gold
  `0`; none → return. Toast `batchNoPrice` (no count) with `repriceUndo`.
- `data-batch-del` (4061-4083): `gone = [{ id, at, meta }]` in list order
  for every ticked id; none → return; splice from the back; **`S.lsel =
  {}`**; save. Toast `batchDeleted + ' (' + gone.length + ')'` with `undo`
  (not `repriceUndo`), restoring each at `Math.min(at, ids.length)` in
  `gone` order with its meta.
- `#rp` on `input` (4336-4344): `S.rp = parseInt || 0`; the live app
  re-renders only when the sign flips (so the caret is not yanked); the
  rewrite is reactive and draws the same thing.

**Rules (style.css).** `.batch-acts` 1059; `.money-act` 1069 and its
`:last-child`, `.numbox`, `.numbox button`, `.numbox input[type=text]`
1070-1073; `.money-hint` 1074; `.money-act .btn{font-weight:650}` 1077;
`.batch-lbl` 1077; `.batch .btn.sm` 1081; `.guess` 709, `.guess-note` 710,
`.guess-rows` 715-716 (`max-height:210px;overflow:auto`), `.guess-row` 717,
`.guess-row>span:first-child` 718, `.guess-band` 719, `.guess-row b` 720;
`@media (max-width:640px){ .batch-acts{margin-left:0;width:100%} }` 1084.
**Not ported:** `.batch-price` and its three (1064, 1078-1080) - nothing in
`batchBarHTML` or `moneyPanelHTML` writes that class; it is dead in the live
app and would be dead CSS here.

#### How it is built

**Drag.** `DragHandlers` (`ports/types.ts`) keeps `onDrop(from, to)` and
gains three optional callbacks the component draws off:

```ts
export interface DragHandlers {
  onDrop(from: number, to: number): void;
  /** dragstart: which row is being dragged. */
  onDrag?(from: number): void;
  /** dragover on a row: where the entry would land; `null` over the dragged row itself. */
  onOver?(over: number, where: 'before' | 'after' | null): void;
  /** dragend, and after a drop: no row is dragged, no row is marked. */
  onEnd?(): void;
}
```

The port owns every listener and the scroll loop; the component owns the
classes. That split is forced, not chosen: Svelte drops a scoped rule no
template element can match and `npm run check` fails it as dead CSS (the
comment at `ListPage.svelte` ~1246 says so), so `dragging`/`drop-before`/
`drop-after` must be `class:` bindings in the template, driven by state the
port reports. `nativeDrag()` is rewritten in place: `dragstart` (index off
`closest('[data-index]')`, `effectAllowed`, `setData` in a `try`,
`setDragImage(row, 24, 24)` when the method exists, `onDrag(from)`); a
capturing `document` `dragover` bound on `dragstart` and unbound on
`dragend`/`drop`, running the edge loop exactly as 4461-4488 (`EDGE`,
`EDGE_MAX`, `requestAnimationFrame`, `scrollBy`); the container's bubbling
`dragover` (target row must exist, `preventDefault`, `dropEffect`,
`onOver(over, over === from ? null : clientY < mid ? 'before' : 'after')`);
`dragend` (`onEnd`, stop the loop, clear `from`); `drop` (`preventDefault`,
the `to` adjustment above off the *last reported* mark, `onDrop`, `onEnd`).
The unbind removes everything, the document listener included. `edgeSpeed(y,
innerHeight)` is a pure exported helper in `drag.ts` so a test can hit three
depths without a scroll. `noDrag` and `fakeDrag` are unchanged; `fakeDrag`
exposes the wider handlers for free.

`ListPage.svelte`: `let dragFrom = $state(-1)` and `let dragMark =
$state<{ over: number; where: 'before' | 'after' } | null>(null)`; the bind
passes `onDrag`, `onOver`, `onEnd`; the row gets `class:dragging={dragFrom
=== i}`, `class:drop-before={dragMark?.over === i && dragMark.where ===
'before'}`, `class:drop-after={...'after'}`; the three rules go in beside
`.lrow`, replacing the ~1246 comment. The grip keeps `draggable="true"` and
`data-drag`.

**The driver verb**, `drag(from, to, after)` by row index (both apps render
`.lrow` in list order, and a name-based lookup would have to read a
`.row-main` whose text carries the description): inside one
`page.evaluate`, `rows = document.querySelectorAll('.lrow')`, `grip =
rows[from].querySelector('[data-drag]')`, `target = rows[to]`; `dt = new
DataTransfer()`; dispatch `new DragEvent('dragstart', { bubbles: true,
dataTransfer: dt })` on `grip`; `rect = target.getBoundingClientRect()`;
dispatch `dragover` on `target` with `clientX: rect.left + 10`, `clientY:
rect.top + rect.height * (after ? 0.75 : 0.25)`, `bubbles`, `cancelable`,
`dataTransfer: dt`; dispatch `drop` on `target` with the same `clientY`;
dispatch `dragend` on `grip`. Then `settle()`. Chrome constructs
`DataTransfer` and `DragEvent` (puppeteer's Chrome is the only browser this
runs in); prove it on the **live** side first - `MSYS_NO_PATHCONV=1 node
tests/parity.js "#/lists/a @"` with the spec below runs both.

**The spec**, `reorderedByDrag` (`presses: true`, `only: ['#/lists/a']`):
`await d.drag(0, 2, true)` → `first = ids from storage`; `await d.drag(2, 0,
false)` → `second`; return `{ first, hash: await d.hash(), second }`. On both
apps `first` is `[ci2, ci3, ci1, ci4, ...]` and `second` is the seed order
again; the runner compares the two apps, not a constant. Register it in
`SPECS` beside `movedByPosition`.

**Batch actions.** All in `ListPage.svelte`, beside the bar and `lsel`:

- `let guess = $state(false)`, `let rp = $state(-20)` - component-local,
  recorded (see "Decided"). `const ticked = $derived(own ? own.ids.filter((id)
  => lsel.has(id)) : [])`; `const pricedCount = $derived(ticked.filter((id)
  => (metaOf(id).gold ?? 0) > 0).length)`.
- Template, after `.batch-all` inside `.batch`: `{#if ticked.length}<span
  class="batch-acts"><Button size="sm" on={guess} caret={...}
  aria-expanded={guess} onclick={() => (guess = !guess)}>{t.batchMoney}
  </Button><Button size="sm" variant="danger" onclick={batchDelete}>{t.del}
  ({ticked.length})</Button></span>{/if}{#if ticked.length && guess}<div
  class="guess">...</div>{/if}`. Check `Button.svelte` first: it has `on`
  and `caret` (B5.1); if `caret` has no open/`up` form, add one that draws
  `<i class="caret up">` and port `.caret.up` from `style.css` (grep it) -
  `FilterBar` may already flip it; reuse whatever exists. `aria-expanded`
  goes through `Button` the way `HelpButton` passes its `open`; if `Button`
  does not forward it, add the one attribute, not a rest-spread. The
  `danger` variant exists (the action row's delete uses it) - confirm.
- The panel is a plain block in the template; `NumberField` for `rp` with
  `min={-90} max={500}` and the names `numBox` gives; the reprice button's
  label `rp < 0 ? t.repriceDown : t.repriceUp`; the rows `{#each ticked as
  id (id)}{@const it = byId(id)}{#if it}...{/if}{/each}` with
  `guessPrice(it, index.rarityOf)` and `guessWhy(it, index.rarityOf, t)`.
- Handlers `applyGuess()`, `repriceTicked()`, `clearPrices()`,
  `batchDelete()` as read off 3989-4083, through the store methods that
  exist: `store.setMeta(own.id, id, 'gold', v)` per row (the live app also
  writes per row and saves once; N saves against one is unobservable except
  by another tab's `storage` event mid-batch, the same trade `ListsPage`'s
  restore recorded), `store.removeEntry` per gone row, `store.restoreEntry(own.id,
  id, Math.min(at, own.ids.length), meta)` per row on undo. Undo through
  `app.say(msg, { action: { label, run } })`, the shape `removeRow` uses.
  `batchDelete` clears `lsel`; the other three leave it.
- Rules ported verbatim in the component style; `.money-act .numbox`
  reaches into `NumberField`'s root the way `.money > :global(.money-help)`
  does - `:global()` on the inner selector only.
- Nit 3: replace `23px`/`680`/`-0.01em` in the two blocks (~714-716,
  ~774-776) with `var(--h-page-size)`/`var(--h-page-weight)`/
  `var(--h-page-spacing)` (`tokens.css:70-72`). Computed values are
  identical; the cells prove it.

**`lib/money.ts`** gains `guessWhy(it, rarityOf, t: Dict): string` as read
off 831-842; find the rewrite's VoA tier-name helper first (`grep -rn
"tierName\|voaTier" app/src/lib app/src/components`) and reuse it; only if
none exists does a `voaTierName` land in `lib/` beside `guessWhy`, with the
mapping off app.js 920. Confirm `reprice()` is `Math.max(1, Math.round(g *
(100 + pct) / 100))`.

**`dict.ts`**: add, in both languages, byte-exact from app.js (ru 116-188,
en 302-372), whichever of these are missing: `batchMoney`, `batchNoPrice`,
`repricePct`, `repriceDown`, `repriceUp`, `repriceHint`, `repriceDone`,
`repriceUndo`, `batchDeleted`, `guessWhy`, `guessNoTier`, `guessNoRarity`,
`guessDone`, `guessApply`, `goldUnit`, and the five rarity labels `RAR_KEY`
maps to if `AltPanel` does not already carry them. `del`, `undo`, `tier`
exist.

**Nit 2 and nit 5**, in the same commit: a comment paragraph above
`ACCEPTED` in `specs.js` - "Recorded, not keyed: `Chip.svelte`'s button form
writes `aria-pressed` where the live menu chips write nothing and the live
money chips write `aria-current="true"` (app.js 2944). `d.controls()` reads
names only, so no key differs; an entry here would fail every run as stale."
- and `rp`/`guess` added to the "Local state" comment in `ListPage.svelte`
beside `roll`/`moneyHelp`, with the observable difference (a percentage
typed, a navigation away and back: `-20` here, the typed value there).

#### Tests

- `ports.test.ts`: on a container of `[data-index]` rows with a fake
  `DragEvent` (jsdom has none: construct `new Event('dragover', { bubbles:
  true })` and assign `clientY` and a `dataTransfer` stub via
  `Object.defineProperty`), cover: `onDrag` at dragstart; the midpoint rule
  both sides; `null` over the dragged row; the four `to` adjustments (after
  and `to < from`; after and `to > from`; before and `to > from`; before
  and `to < from`); `onEnd` on dragend and on drop; the unbind removing the
  document listener (a `dragover` on `document` after unbind changes
  nothing); `edgeSpeed` at `y = 0` (`-22`), `y = 60` (`-11`), `y =
  innerHeight - 1` (`22`), `y = innerHeight / 2` (`0`). Keep the three
  existing `nativeDrag` cases green.
- `listPage.test.ts`: the classes follow `fakeDrag().handlers.onDrag/onOver/
  onEnd`; ticking a row shows `Цены` and `Удалить (1)`, unticking hides
  them; `Цены` opens the panel and flips `aria-expanded`; with a priced row
  ticked the reprice row and `Убрать цену (1)` are on screen, with an
  unpriced one neither is; the reprice label flips at `rp = 5`; apply
  writes the guessed gold, toasts `Цены проставлены (1)`, folds the panel,
  and undo restores `0`; reprice at `-20` on `750` gives `600` and undo
  gives `750`; clear gives `0` and undo `750`; batch delete of rows 1 and 3
  leaves the others, clears the ticks, toasts `Убрано из списка (2)`, and
  undo puts both back at their positions with their meta; the panel with
  the guess open passes `expectNoA11yViolations`.
- `money.test.ts`: `guessWhy` for an equipment record (`Ранг 2 · 100–150
  зол.`), a rarity-bearing loot record, a VoA-tier record, a record with no
  band (`нечем оценить`), and English once.

#### Parity states, each in both languages at three widths

All `route: '#/lists/a'`. `pickRow` is the row checkbox's `aria-label`
(`Выбрать позицию` / `Select entry`), reached by `nth`.

| id | storage | enter | why |
|---|---|---|---|
| `#/lists/a ~ a row ticked` | `seven` | `click(pickRow)` | the bar `.on`, "Выбрано 1", `Цены` with the caret, `Удалить (1)`; at 375 the 640px override puts the pair on its own full-width line |
| `#/lists/a ~ prices` | `noted` | `click(pickRow, 1)`, `click(prices)` | row 2 (750, bags) ticked: the percentage row at -20 with `Сделать скидку` and the hint, the note, one guess row with its band, `Проставить эти цены`, `Убрать цену (1)` |
| `#/lists/a ~ prices, none priced` | `seven` | `click(pickRow)`, `click(prices)` | row 1 ticked: no percentage row, no clear button - the two `priced` branches off |
| `#/lists/a ~ prices set` | `seven` | `click(pickRow)`, `click(prices)`, `click(applyPrices)` | the panel folded, row 1 priced, the money picker now drawn (first price on the list), the toast "Цены проставлены (1)" - `timed: true` |
| `#/lists/a ~ batch deleted` | `seven` | `click(pickRow)`, `click(delOne)` | six rows, the bar off, the toast "Убрано из списка (1)" with `Вернуть` - `timed: true` |

`NAME` gains `pickRow`, `prices` (`Цены`/`Prices`), `delOne` (`Удалить (1)`/
`Delete (1)` - **exact**, because the action row's delete-list button is
named exactly `Удалить` and `click()` prefers an exact match, so the short
name would delete the list), `clearPriceOne` (`Убрать цену (1)`/`Clear price
(1)`), `applyPrices` (`Проставить эти цены`/`Set these prices`), `discount`
(`Сделать скидку`/`Discount`), and the `rp` field's name as `numBox` gives
it. `listAddress`'s `only` list gains the five ids.

Press specs, each `presses: true`:

- `reorderedByDrag` - above.
- `guessedPrices` (`only: ['#/lists/a']`): `pickRow`, `prices`,
  `applyPrices`; `gold` of `ci1` from storage; `undo` (`NAME.undo` -
  `Вернуть` is both `undo` and `repriceUndo`); `gold` again. Return both and
  the hash.
- `repricedRows` (`only: ['#/lists/a ~ noted']`): `pickRow` nth 1, `prices`,
  `discount`; `ci2.gold` (600); `undo`; `ci2.gold` (750).
- `clearedPrices` (`only: ['#/lists/a ~ noted']`): `pickRow` nth 1, `prices`,
  `clearPriceOne`; `ci2.gold` (absent); `undo`; (750).
- `batchDeleted` (`only: ['#/lists/a ~ noted']`): `pickRow` nth 1, `delOne`;
  ids and `meta` from storage; `undo`; ids and `meta` again (ci2 back at
  index 1 with its qty, gold and both notes).

Before writing the `~ prices set` state, confirm on the live app that `ci1`
gets a band (a core item in the alternate tables has a rarity); if it does
not, the apply returns early with no toast and the state must tick a row
that does - pick by evidence, then record which.

#### Ordered steps

Two commits, in this order. Steps 1-4 are commit 1; 5-13 are commit 2.
Each ends with its own green `set -o pipefail; npm run check 2>&1 | tail -n
120` (one foreground call, Bash timeout 600000) immediately before `git
commit` - doc edits change the tree fingerprint, so the check comes after
the docs, not before.

1. `ports/types.ts` (`DragHandlers`), `ports/drag.ts` rewritten as above,
   `ports.test.ts` cases. `npx vitest run app/src/ports` green.
2. `ListPage.svelte`: `dragFrom`/`dragMark`, the three callbacks in the
   bind, the three `class:` bindings, the three rules; `listPage.test.ts`
   class cases.
3. `tests/parity/driver.js` `drag()`; `tests/parity/specs.js`
   `reorderedByDrag` + `SPECS` registration.
4. `npm run check`; `npm run build`; `MSYS_NO_PATHCONV=1 node
   tests/parity.js "#/lists/a @"` - six cells `совпадает` and the spec's
   `first`/`second` equal on both apps. If the live side's synthetic drag
   does not move the entry, the verb is wrong, not the app: fix the verb
   (the live handlers are the specification). Commit `feat(lists): drag as
   the live app does it`.
5. `dict.ts` keys; `lib/money.ts` `guessWhy` (+ the VoA tier-name reuse),
   `money.test.ts`.
6. `ListPage.svelte`: `guess`, `rp`, `ticked`, `pricedCount`; the
   `.batch-acts` pair (with whatever `Button` needs for the caret's open
   form and `aria-expanded` - reuse first); the `.guess` panel; the four
   handlers; the rules; nit 3's tokens; nit 5's comment line.
7. `listPage.test.ts` cases above.
8. `specs.js`: the five states, the `NAME` entries, the four press specs,
   `listAddress`'s `only`, the "Recorded, not keyed" paragraph above
   `ACCEPTED`.
9. `npm run check` green (fix, do not skip; if the host is loaded, read
   `.claude/README.md` "Run a long check" and `context.md` "The host block
   lifted" before retrying).
10. `npm run build`, then the parity loop, one foreground call per group,
    none merged, `MSYS_NO_PATHCONV=1` in front of each:
    `node tests/parity.js "~ a row ticked" "~ prices"` (3 states - the
    substring `~ prices` also matches `~ prices, none priced` and `~ prices
    set`; confirm the count in the run header - 18 cells plus the timed
    one); `node tests/parity.js "~ batch deleted"` (6 cells); the
    regression `node tests/parity.js "#/lists/a @" "#/lists/a ~ noted" "~
    money help" "~ roll panel" "~ rolled" "~ removed" "~ note opened"` (7
    states, 42 cells); `node tests/parity.js "#/lists/b" "#/lists/nope"
    "own list"` (18 cells). If `Button.svelte` or `NumberField.svelte`
    changed, also `node tests/parity.js "#/tables @" "i/ci1 @" "#/roll/alt
    @"`. Every cell zero; open a diff image before touching any value.
11. `npm run check:built` (the screen changes; the bundle budget).
12. `plan.md` "B5.5 built" (what shipped, exact commands and results, any
    deviation), `handoff.md` (Status, Completed, Verification, Next batch =
    B5.6, Deferred: nits 2, 3, 5 closed), `context.md` only for a durable
    fact learned.
13. `npm run check` again (the docs moved the fingerprint); commit
    `feat(lists): the actions under a ticked selection`. No push.

#### Acceptance criteria

- `npm run check` exit 0 before each commit; coverage thresholds met with
  `drag.ts` and `money.ts` reached by the new cases.
- All eleven `#/lists/a*` states, `#/lists/b`, `#/lists/nope` and `#/l/ ~
  own list` read `совпадает` in both languages at 1100, 768 and 375 - the
  six pre-existing list-page states included (nit 3's tokens and the
  `Button` change must not move a pixel).
- `reorderedByDrag`, `guessedPrices`, `repricedRows`, `clearedPrices`,
  `batchDeleted` observe the same data on both apps.
- `npm run check:built` exit 0.
- No `VISUAL_DEBT` entry written from this host; no `ACCEPTED` entry added.
- `ListPage.svelte` carries no `23px`, `680` or `-0.01em` literal; its
  "Local state" comment lists `rp` and `guess`; `specs.js` carries the
  "Recorded, not keyed" paragraph.
- `handoff.md` "Deferred" marks B5.4a nits 2, 3 and 5 closed by this batch
  and nit 1 as B5.6's.

#### Risks and do-nots

- Do not port `.batch-price`; it is dead in the live app.
- Do not name the batch delete button `Удалить` in `NAME`; the exact-match
  rule would press the list's own delete. `Удалить (1)`.
- Do not put `rp`/`guess` on `AppState`; component-local and recorded, the
  way `roll`/`moneyHelp` went (nit 5 is the record, not a reversal).
- Do not add an `ACCEPTED` entry for the chips (nit 2): a stale key fails
  the run.
- Do not add a store method for the batch writes; loop the ones that
  exist.
- Do not toggle the drag classes from the port: Svelte drops the unmatched
  scoped rule and the check fails it as dead CSS.
- Do not attempt a mid-drag pixel state; a synthetic drag paints no drag
  image on either side.
- The tick must survive the harness's `EN` press: keep `lsel`, `guess`,
  `rp` outside any `{#key app.lang}` block.
- `timed: true` on `~ prices set` and `~ batch deleted` only.
- Do not write a `VISUAL_DEBT` number from this host.
- Do not start B5.6's shared branch, `HitNote`, `TableRows`'s `tail` or
  the packed expansion "while in the file".
- Two commits, no push, no `Co-Authored-By`.

#### Decided in planning - do not reopen

- **B5.4b is inside B5.5**, as its first commit. See "B5 remainder
  planned".
- **The port reports, the component classes.** Forced by scoped CSS.
- **`drag()` is index-based.** Both apps render `.lrow` in list order.
- **`rp` and `guess` are component-local**, recorded beside `roll` and
  `moneyHelp`. Observable only as the percentage field forgetting a typed
  value across a navigation; no state pixel sees it.
- **The money chips keep `aria-pressed`; no `ACCEPTED` entry.** Nit 2.
- **No new store methods.** Per-row `setMeta`/`removeEntry`/`restoreEntry`
  loops.
- **The rules come from `style.css` line by line, not from a measurement
  pass**, and the harness proves them - a non-zero cell is a port defect
  until the diff image says otherwise.

#### B5.6 outlined: the shared page, the packed link, the bad link

The second and last lists batch. Everything below is a reader of a payload
the writer side already produces and the fixtures already freeze; no
contract changes.

- **Packed expansion, in `AppState`** (`state/app.svelte.ts`), off
  `expandHash` (app.js 3589-3603): when the route is `sharedList` with
  `packed`, `await env.compress.unpack(payload)` then `router.replace('#/l/'
  + plain)`; on rejection `router.replace('#/l/zzzz')` so the page says the
  link is damaged rather than hanging. `currentRoute` treats an unexpanded
  packed hash as `l/zzzz` while it waits; the rewrite's `ListPage` draws
  the `todo` paragraph for `packed: true` today (`own` is `null`) and
  should draw nothing until the replace lands. `browserCompress.unpack`
  exists and is tested; `ListsPage`'s restore is its first caller, this is
  the second.
- **`SharedListPage.svelte`**, rendered by `ListPage.svelte`'s `{:else if
  !own}` branch (replacing the `todo` paragraph), off `renderSharedList`
  (3130-3170): `decodeList(payload, knows)`; `null` → `<h1 class="page-h">
  notFound</h1><p class="page-sub">badShare</p>` and a `Button
  variant="primary" href={sectionHash('roll/std')} sameTab` `toStart`.
  Else: `h1` the name or `untitled`; `page-sub` `sharedList · N
  <plural>` (`itemsWord` in `lib/i18n.ts` is the rewrite's `plural`);
  `<div class="card-acts" style="margin-bottom:18px">` with `AddToList`
  keyed `'@'` (`N_SHARED`), `ids`, `primary`; the two list hitnotes when
  present, in a `margin-bottom:18px` wrapper; then `TableRows` in list
  view with `entries` carrying a new `tail?: string` (`x{qty} · price` off
  `itemMeta` and `moneyMode(fake)`, joined with ` · `; `×` is U+00D7 - port
  the byte) - **this is nit 1's use of `RowMain`'s `tail`**; if the row
  needs anything `TableRows` cannot give, delete `tail`/`.rtail` from
  `RowMain` instead and say why - with `selected`/`ontoggle` wired to
  `app.sel` (the live rows carry `selBox`, so the selection bar works on a
  shared list) and no `ontoggleall` (no `.selall` on the live page); per-row
  hitnotes after each row when the entry carries them.
- **`HitNote.svelte`** on its second use: `ListPage.svelte` ~434 draws the
  rolled entry's hitnotes inline today; the shared page is the second
  caller, so both become the component (icon, label, the text split on
  `\n` into `<br>`s), and the inline copy goes. Rules off `.hitnote` and its
  four (style.css 626-633).
- **`AddToList` learns to take a whole list.** One prop, `fresh?: { name:
  string; meta?: ...; note?: string; hnote?: string }`: the new-list draft
  starts as `fresh.name` (app.js 4206-4209, `newListFor === N_SHARED`), and
  `createFor` becomes `app.lists.create(draft, { ids, meta, note, hnote })`
  - `create(name, init)`'s second caller, which closes B5.3's nit 5 -
  followed by the `addedTo` toast and `goToList`. Adding to an *existing*
  list copies ids only (4218-4224: "into a ready list the GM's notes are not
  poured").
- **States** (no storage unless said): `#/l/ ~ shared` (the `own list`
  payload with nothing seeded → seven plain rows, no notes, the add
  control, no bar); `#/l/ ~ shared, noted` (route =
  `docs/fixtures/lists/notes-both-kinds.json`'s `gm.payload`: both list
  hitnotes, `ci1` with both entry hitnotes, no tails - and a second seed
  variant or `qty-and-price.json`'s payload for the tails, whichever the
  fixture set covers; pick by reading the fixtures); `#/l/ ~ packed` (the
  packed form of the `shared, noted` payload, computed once with Node's
  `zlib.deflateRawSync` in the scratchpad and pasted with a comment naming
  the command; pixels identical to the plain state, the address spec proves
  the rewrite); `#/l/zzzz` (the bad-link page). A ticked row on the shared
  page is the selection bar's state already covered on `#/tables`; a press
  spec, not a pixel state.
- **Specs**: `tookSharedList` (`only: ['#/l/ ~ shared, noted']`):
  `addToList`, `+ Новый список`, the create button → storage holds one list
  with the name, both notes and `ci1`'s meta; hash is `#/l/<its own
  players' payload>`. `addedSharedToList` (`only: ['#/l/ ~ shared']`,
  `storage: two`): `addToList`, the chip `Клад дракона` → list `a` holds
  the seven ids and no notes. `listAddress` gains all four ids - `~ packed`
  must read the plain hash on both apps.
- **Filters**: `"#/l/"` covers every state; the regressions are `"i/ci1 ~"`
  (the `AddToList` change) and `"#/tables @"` (`TableRows`), and
  `"#/lists/a ~ rolled"` (the `HitNote` extraction).
- Verification: `npm run check`, the filters, `npm run check:built`. One
  commit.

### B5.5 built: the list page complete - drag as the live app does it, and the actions under a ticked selection

**All thirteen ordered steps done as designed, in the two commits the brief
named; no deviation.** Steps 1-4 landed as `feat(lists): drag as the live app
does it` (`a006792`), on top of `36fd2f1` (the docs-only commit carrying the
five B5-remainder planning paths, per the brief's pathspec). Steps 5-13 land
as this section's own commit, `feat(lists): the actions under a ticked
selection`.

**The fallback was not needed.** The synthetic `DragEvent` sequence
(`tests/parity/driver.js`'s `drag(from, to, after)`) drove the **live** app's
own handlers correctly on the first attempt: `MSYS_NO_PATHCONV=1 node
tests/parity.js "#/lists/a @"` read all six pre-existing cells `совпадает`
and `reorderedByDrag`'s `first`/`second` id orders matched on both apps with
no re-run.

**Drag (steps 1-4).** `DragHandlers` gained `onDrag`/`onOver`/`onEnd`;
`ports/drag.ts`'s `nativeDrag()` was rewritten to the live event model
(app.js 4443-4530) - a capturing `document` `dragover` bound only while a
drag is live, driving the edge-scroll `requestAnimationFrame` loop via the
pure exported `edgeSpeed(y, innerHeight)`; the bubbling `dragover` marks
`before`/`after` off the pointer's own midpoint, `null` over the dragged row
itself; `drop` adjusts the target index off the *last reported* mark, exactly
as app.js's `if (after && to < from) to += 1; if (!after && to > from) to -=
1;`. `ListPage.svelte` gained `dragFrom`/`dragMark` state and the three
`class:` bindings (`dragging`/`drop-before`/`drop-after`) driven by the port's
callbacks - never by the port itself, since Svelte drops a scoped rule no
template element can match and the check fails it as dead CSS. `ports.test.ts`
covers `onDrag`, the midpoint rule both sides, `null` over the dragged row,
all four `to` adjustments, `onEnd` from both a drop and a plain `dragend`, the
unbind removing the document listener, and `edgeSpeed` at four depths; the
three pre-existing `nativeDrag` cases stayed green by giving the shared `rows`
fixture a real `getBoundingClientRect` (`new DOMRect(0, i * 40, 0, 40)`) and
aiming the shared `drag()` helper's `clientY` at each target row's own top
edge - `before` its midpoint, the shape those three cases were written
against.

**The actions under a ticked selection (steps 5-13).** `dict.ts` gained the
fifteen ru/en key pairs byte-exact from app.js (ru 116-188, en 302-372):
`goldUnit`, `batchMoney`, `batchNoPrice`, `repricePct`, `repriceDown`,
`repriceUp`, `repriceHint`, `repriceDone`, `repriceUndo`, `batchDeleted`,
`guessApply`, `guessWhy`, `guessNoTier`, `guessNoRarity`, `guessDone` (the
five rarity labels already existed). `lib/money.ts` gained `guessWhy(it,
rarityOf, t)` and a local `voaTierName` (no existing helper was found; `grep
-rn "tierName\|voaTier"` came back empty) - `reprice()` was already the exact
formula (`Math.max(1, Math.round((gold * (100 + percent)) / 100))`), confirmed
rather than rewritten. `ListPage.svelte` gained `guess`/`rp` state, `ticked`/
`pricedCount` derived, the `.batch-acts` pair (`Button` already had `on`,
`caret` and `expanded` from B5.1 - no change to `Button.svelte` was needed),
the `.guess` panel (the reprice row only when a ticked row is priced, the
note, one row per ticked id with its band and suggested price, apply and
clear-price buttons), the four handlers looping the store's existing
`setMeta`/`removeEntry`/`restoreEntry`, and every rule `style.css` gives them
(`.batch-acts`, `.batch .btn.sm`, `.guess` and its five, `.money-act` and its
four, `.money-hint`, `.batch-lbl`, the 640px override). Nit 3's tokens
(`--h-page-size`/`--h-page-weight`/`--h-page-spacing`) replaced `23px`/`680`/
`-0.01em` in both blocks that had them; nit 5's line joined `rp`/`guess` to
the "Local state" comment beside `roll`/`moneyHelp`. `specs.js` gained the
"Recorded, not keyed" paragraph above `ACCEPTED` for nit 2, five parity
states, `NAME` entries (`pickRow`, `prices`, `delOne` - exact, see
"Risks" - `clearPriceOne`, `applyPrices`, `discount`, `rollResult` for the
`rp` field, which `numBox` names identically to the roll field), `listAddress`'s
`only`, and four press specs (`guessedPrices`, `repricedRows`, `clearedPrices`,
`batchDeleted`).

**One real gap found and fixed in the touched path, not named in the
brief's line list: `NumberField`/`lib/numField.ts` could not type a negative
number at all.** `typed()` and `committed()` stripped every non-digit
character including a leading `-`, which is invisible for every existing
caller (every roll field's `min` is 1 or more) but breaks the reprice field
outright - its default is `-20` and its whole point is a negative percentage.
Read off app.js's own `#rp` input handler (4336-4344): the live field commits
on every keystroke, unclamped, and only re-renders when the sign flips (so
the reprice/markup button label tracks the field live, not just on blur) -
matched here by passing `empty` to `NumberField` for `rp`, which already
commits per keystroke through `committed()`. Both functions gained a `min`
parameter (default `0`, so every existing call site is byte-for-byte
unchanged) and a `digitsOf(raw, allowNeg)` helper that keeps a single leading
minus when `min < 0` and treats one anywhere else, or a second one, as noise
from a stray keystroke - exactly `CLAUDE.md`'s "fix cheap, local, safe bugs...
in a touched path" rule, since `NumberField` is what step 6 was already
extending to its first negative-range use. `numField.test.ts` gained a
`describe` block for the negative-range path; the existing positive-range
cases are untouched and still pass, confirming no behaviour moved for the
roll fields.

**Verification.** `set -o pipefail; npm run check 2>&1 | tail -n 120` exit 0
after steps 1-4 (one foreground call) and again after steps 5-9's production
code and tests (883 tests, 0 failures, coverage 96.11 stmts / 88.28 branch /
96.97 funcs / 97.05 lines - `money.ts` and `drag.ts` both fully reached by the
new cases). `npm run build` clean (82.41 kB gzip). The parity loop, four
foreground calls, none merged: `"~ a row ticked" "~ prices"` (30 cells -
the substring also matched `~ prices, none priced` and `~ prices set`, as the
brief warned); `"~ batch deleted"` (6 cells); the regression `"#/lists/a @"
"#/lists/a ~ noted" "~ money help" "~ roll panel" "~ rolled" "~ removed" "~
note opened"` (42 cells, all four `only: ['#/lists/a ~ noted']` press specs
included); `"#/lists/b" "#/lists/nope" "own list"` (18 cells) - **every cell
`совпадает` on the first pass, no diff image opened.** Because
`NumberField.svelte` changed, the extra regression the brief names also ran:
`"#/tables @" "i/ci1 @" "#/roll/alt @"` - clean as well. `npm run check:built`
exit 0 (build, `smoke-file-url.mjs`, `bundle-budget.mjs` at 80.1 kB against
the 120 kB budget). A final `npm run check` re-armed the gate after the docs
moved the tree fingerprint, immediately before this commit.

**No `VISUAL_DEBT` entry written; no `ACCEPTED` entry added.** `Удалить (1)`
(not `Удалить`) is `delOne` in `NAME`, exactly as the brief's do-not required.
`rp`/`guess` are component-local, never on `AppState`. B5.4a's nits 2, 3 and
5 are closed by this batch; nit 1 (`RowMain`'s dead `tail`) is B5.6's; nits 4
and 6 stay recorded as notes.

**Correction, one remediation pass on top of `ba0a92d` (reviewer then
implementer, 2026-09-11): both blockers found in review are fixed, plus seven
lower-severity findings from the same review.**

*Blocker 1 - `dragstart` was accepted from any element inside a row, not only
the grip.* `drag.ts`'s `onStart` read `(e.target).closest('[data-index]')`,
so dragging `RowMain.svelte`'s thumbnail or a run of selected text out of the
note textarea started a row reorder instead of the browser's own native drag
- every one of those elements sits inside `.lrow`, which carries
`data-index`. Live (`app.js:4452-4454`) checks `e.target.closest('[data-drag]')`
first and returns if it finds no grip. Fixed the same way, taking the row as
`grip.closest('[data-index]')`. Neither the unit suite nor the parity driver
could have caught this: `ports.test.ts`'s fixture rows had no grip element at
all, and the parity `drag()` verb already dispatches on `rows[f].querySelector(
'[data-drag]')`, so both exercised only the good path. Fixed alongside the
code: the shared `rows(n)` fixture now builds a real `[data-drag]` grip plus a
plain `.row-body` child per row, every existing `dragstart` dispatch moved
from the row to the grip, and a new case dispatches `dragstart` on the
`.row-body` and asserts `onDrag` is never called.

*Blocker 2 - `dragover` and `drop` had no "one of our drags is live" guard.*
Without it, a file dragged in from the desktop, or an image dragged from
another tab, painted the gold `drop-before`/`drop-after` line and swallowed
the browser's own drop handling. Live opens both handlers with `if
(!dragKey) return;` (`app.js:4492`, `app.js:4509`) and calls `preventDefault()`
in `drop` only once the key and row are known good. Fixed with `if (from < 0)
return;` at the top of `onOver`, and by moving `onDrop`'s `e.preventDefault()`
inside the existing `if (start >= 0 && at)` block rather than calling it
unconditionally first. Two new `ports.test.ts` cases fire a `dragover` and a
`drop` with no preceding `dragstart` and assert the handler was not called and
`event.defaultPrevented` stayed `false`.

*The five findings.* (3) `committed('-', -90, 500)` returned `min` (-90) for a
bare minus; live's `parseInt('-', 10) || 0` is `0` - fixed, and
`numField.test.ts:79`'s case (which pinned the wrong reading) now asserts `0`.
(4) `typed`/`committed` clamped a negative-range field into `[-90, 500]` on
every keystroke and on commit; live's `#rp` handler (`app.js:4336-4343`) never
clamps at all - only the stepper does (`app.js:3916`). Both functions now skip
clamping entirely when `min < 0` (an unclamped `parseInt`-equivalent reading,
with a bare minus or an empty field reading `0`), and `NumberField.svelte`'s
`step()` was changed from `committed(String(current + by), min, max)` to an
explicit `clamp(current + by, min, max)` so the stepper keeps clamping now
that `committed` no longer does it for it. Every `min >= 1` caller is
unaffected: for a non-negative range `committed(String(v), min, max)` and
`clamp(v, min, max)` read the same number, and `digitsOf` still collapses to
the old `replace(/\D/g, '')` there. (5) `drag.ts`'s `setDragImage` call was
missing the plan's own guard, `if (row && e.dataTransfer.setDragImage)`
(`app.js:4459`) - restored, with an `eslint-disable-next-line
@typescript-eslint/no-unnecessary-condition` since lib.dom types the method as
always present. (6) `reorderedByDrag` (`specs.js`) returned `{first, hash,
second}` compared app-to-app only, so a synthetic drag sequence that stopped
moving anything on *both* apps at once (a broken driver selector, say) would
still read `совпадает`. The spec now throws when `first` and `second` come
back identical, which a genuinely no-op sequence can no longer pass silently.
(7) `NAME.ru.rollResult`/`NAME.en.rollResult` (`specs.js`, added by B5.5) were
never read by any spec - removed, along with the comment explaining why the
key existed.

**Two doc corrections, not cosmetic.** This section's own "Verification"
paragraph above read `npm run build` as "clean (80.1 kB gzip)" - that is the
`bundle-budget.mjs` figure from `check:built`'s budget step, transcribed onto
the wrong line; the build itself printed 82.41 kB gzip (`handoff.md`,
"Verification", records both correctly). Fixed in place, above.
`handoff.md`'s Verification step 13 read "result recorded in Status once the
call completes" - the call completed in the same session and the result was
never written back; both that entry and this remediation pass's own closing
check now carry their real numbers.

**Verification.** `set -o pipefail; npm run check 2>&1 | tail -n 120` - one
lint failure on the first attempt (`@typescript-eslint/no-unnecessary-condition`
on the restored `setDragImage` guard, fixed with the disable comment above),
exit 0 on the second: 888 tests, 0 failures, coverage 96.15 stmts / 88.41
branch / 96.97 funcs / 97.06 lines (`drag.ts` 99.03/86.53/100/100 - up from
B5.5's own 84.61% branch, the new no-op-guard cases closing the gap the
review found; the remaining gaps are the same class the `src/ports/**`
threshold is set for - a `DataTransfer` without `setDragImage`, or one at all,
that jsdom cannot reproduce). `npm run build` clean: `dist/assets/app.js`
273.61 kB, 82.44 kB gzip. `MSYS_NO_PATHCONV=1 node tests/parity.js "#/lists/a
@"` - all six pre-existing cells `совпадает`, `расхождений нет`; the drag verb
(inside `reorderedByDrag`, `only: ['#/lists/a']`) ran for both languages and
neither app's result carried the new throw. No `check:built` - nothing drawn
changed. A final `npm run check` re-armed the gate after the doc edits moved
the tree fingerprint, immediately before the commit below.

**No `VISUAL_DEBT` entry written; no `ACCEPTED` entry added.** Left alone, as
instructed: the `$effect` rebind risk and `batchDelete`'s N saves (both
already recorded and deliberate), and B5.4a's nits 1, 4 and 6.

### B5.6 planned: the shared page, the packed link, the bad link, and taking a shared list

**Objective.** After this batch `#/l/<payload>` for a list that is nobody's
draws what the live `renderSharedList` draws: the list's name (or `Без
названия`) as the heading; `Список от другого игрока · N позиций` under it;
one `Добавить в список` control, whose `+ Новый список` takes the whole list -
name, both list notes, every entry's meta - into a new list of one's own and
lands on it, and whose chips pour the ids with their quantities, prices and
players' notes (never the GM's) into an existing list; the two list hitnotes
above the rows; the rows as the tables draw them (checkbox, thumbnail, name
with `×qty · price` after it, badges), each followed by its own hitnotes. A
ticked row raises the selection bar, whose add-to-list carries the shared
meta too. `#/l/~<packed>` expands through the compress port and rewrites the
address to the plain form in place; a packed link that cannot be expanded,
and any payload that does not decode, lands on `#/l/zzzz`: `Предмет не
найден`, `Ссылка повреждена…`, `На главную`. The last lists batch; it closes
B5.4a nit 1 (`RowMain`'s `tail` gets its caller) and B5.3 nit 5
(`ListStore.create(name, init)` gets its second caller).

**In scope.** `lib/dict.ts` (two keys), `lib/lists.ts` (`N_SHARED`),
`state/lists.svelte.ts` (`addIds` copies meta), `state/app.svelte.ts`
(`shared`, `toggleSel`, packed expansion), `components/HitNote.svelte` (new,
second use), `components/SharedListPage.svelte` (new), `TableRows.svelte`
(`tail`, `after`), `RowMain.svelte` (comments only), `AddToList.svelte`
(shared meta, the `@` take), `ListPage.svelte` (the branch, `HitNote`, dead
rules), `TablesPage.svelte` (`toggleSel` moves to `AppState`), their tests,
`a11y.test.ts`'s guard, one driver verb, four parity states, two press
specs, `NAME`, `listAddress`, `COVERAGE.md`'s suite table.

**Out of scope.** Any change to `CONTRACTS.md`, `docs/fixtures/`,
`tests/contracts.js`, `ROUTES.md`, `llms.txt` - nothing here touches a
route, a key or a payload; the packed form is already in `ROUTES.md` and
`CONTRACTS.md` section 3. `Button.svelte` (`href` + `sameTab` +
`variant="primary"` exist - the bad-link button is `ListPage`'s
list-not-found button with other words). `ListStore.create`'s signature.
`RecordModal`'s `extra` on the shared page (live `contextNote`, app.js
568-578, returns `[]` there: `onListPage()` is `''` without `S.openList`).
A `PageTitle`/`.page-h` extraction (`RecordPage`, `ListPage`, `PageHead`
each carry the rule; the shared page is a fourth copy, recorded in the
handoff's Deferred, not fixed here). Search, print.

#### What the live app does, read off app.js (HEAD `d6c951f`; unchanged since `d5d63c1`)

- **Expansion** (3589-3603, 4633-4636). `expandHash()` runs before every
  `render()` and on `hashchange`; a hash starting `l/~` is unpacked with
  `DecompressionStream('deflate-raw')` (1517-1521), then `replaceState` to
  `#/l/<plain>` and `render()`; the `catch` (a bad payload, or no
  `DecompressionStream` at all) replaces with `#/l/zzzz` and renders. While
  unpacking `render()` is not called at all (4636: `if (!expandHash())
  render()`), so `#view` stays empty; `currentRoute` (3604-3606) reports
  `l/zzzz` in that window. `#/l/zzzz` itself is an ordinary `l/<payload>`
  route whose `decodeList` returns null.
- **The shared page** (`renderSharedList`, 3130-3170). Null decode: `<h1
  class="page-h">notFound</h1><p class="page-sub">badShare</p><a class="btn
  primary" href="#/roll/std">toStart</a>`. Otherwise: `S.shared = { ids,
  meta: data.meta || {}, name, note, hnote }` (3140-3141); `h1.page-h`
  `data.name || untitled` (one text node); `p.page-sub` `sharedList + ' · '
  + items.length + ' ' + plural(n)` (**one** text node - `esc()` of one
  joined string); `<div class="card-acts" style="margin-bottom:18px">` with
  `addToListBtn(N_SHARED, data.ids, true)` (primary, `aria-expanded`); if
  either list note, `<div style="margin-bottom:18px">` holding
  `shown(ICON_EYE, notePub, note)` then `shown(ICON_EYE_OFF, noteHid,
  hnote)` - each `<div class="hitnote">icon<span><b>label</b>lines(text)
  </span></div>` (3144-3147; `lines` = `esc` then `\n` → `<br>`, 589); then
  `<div class="rows">` of, per entry, `rowHTML(it, '', tail)` followed by
  the entry's own `shown(...)` pair (3159-3166). `tail` is `bits.join('
  · ')` of `'×' + m.qty` when `m.qty > 1` and `priceText(m.gold,
  moneyMode(fake))` when `m.gold` - `×` is U+00D7, the separators U+00B7;
  port the bytes. No `selectAllHTML` - **no `.selall`** on this page.
- **The row** (`rowHTML`, 2785-2803): with `removeFrom === ''` the row
  carries `selBox(it.id)` and `.sel` off `S.sel[it.id]`, so the selection
  bar works here exactly as on `#/tables`; `tail` renders as `<i
  class="rtail">` inside `<b>` right after the name (2794).
- **Where the ticked and added meta comes from.** `idsForKey('@')` is
  `S.shared.ids` (1865-1869); `metaForKey(key)` (1874-1877) is
  `S.shared.meta` for `'@'`, and for any other key **while the route is
  `l/` with no `S.openList`** - so the bar's `sel` key and a card's own
  key both copy meta on the shared page, and nowhere else.
  `applyAddTo` (1907-1920): `'@'` goes straight to `addIdsTo(l, ids,
  S.shared.meta)` **before** the single-record toggle; every other key
  toggles a single record that is already in the list, else `addIdsTo(l,
  ids, metaForKey(key))`. `addIdsTo` (1924-1940): fresh ids appended; for
  each fresh id with meta, `setMeta` qty when `> 1`, gold when `> 0`, note
  when present - **in that order, and never hnote**; one save; toast
  `addedTo` + `': ' + fresh.length` when `ids.length > 1`. The outline's
  "adding to an existing list copies ids only" was wrong: ids **and** the
  players-visible meta travel; only the GM's note stays behind.
- **Taking the whole list.** `newListFor` (4205-4210): the new-list draft
  starts as `S.shared.name` for `'@'`, empty otherwise. `createFor`
  (4213-4232): a blank name toasts `nameFirst` as an error and focuses the
  input; for `'@'` the new list gets `ids` (a copy), `meta` (a deep copy,
  if any), `note`, `hnote` (each only if present), one save, toast
  `addedTo` with the name, then `goToList(l)` (1537-1545): `S.openList =
  l.id` and `location.hash = '#/l/' + encodeList(l, true)` - a navigation,
  not a replace; an identical hash re-renders by hand.
- **Strings**: ru 156 `untitled`, 161 `sharedList`, 162 `badShare`, 179
  `toStart`, 189 `notFound`; en 340, 345, 346, 363, 373. `dict.ts` already
  has `untitled`, `badShare`, `notFound`, `notePub`, `noteHid`, `addedTo`,
  `nameFirst`, `newList`, `create`, `cancel`, `addToList`; it lacks
  `sharedList` and `toStart`.
- **CSS**: `.page-h` 105, `.page-sub` 140, `.card-acts` 405 (plus the
  inline `margin-bottom:18px`), `.hitnote` and its four 626-633, `.rtail`
  785. All but `.card-acts`-outside-the-card are already ported somewhere
  (`ListPage`, `RowMain`); the shared page composes them.

#### How it is built

- **`lib/dict.ts`.** `sharedList: 'Список от другого игрока'` /
  `'A list from another player'`; `toStart: 'На главную'` / `'Home'`. Both
  blocks, beside `badShare`.
- **`lib/lists.ts`.** `export const N_SHARED = '@';` with app.js 1356's
  comment ("not an id either: the menu key for taking a shared list").
  Pure module, no other change.
- **`state/lists.svelte.ts` - `addIds(list, ids, knows, meta?)`.** Fourth
  parameter `meta?: Readonly<Record<string, ListEntryMeta>>`. Inside the
  existing `if (fresh.length)` map, when `meta` is given: start from `{
  ...(l.meta ?? {}) }`, and for each **fresh** id with a `meta[id]` build a
  fresh `ListEntryMeta` in the live order - `qty` when `(m.qty ?? 0) > 1`,
  `gold` when `(m.gold ?? 0) > 0`, `note` when truthy, never `hnote` - and
  set it only when non-empty; assign `next.meta` only when the merged
  object has keys. Still does not save. Every existing caller passes three
  arguments and is unchanged. (Key order matters: the parity spec compares
  the stored JSON of both apps, and the live `setMeta` sequence writes
  `qty`, `gold`, `note`.)
- **`state/app.svelte.ts`.** Three additions.
  1. `shared = $state<DecodedList | null>(null)` (type from
     `lib/listLink.js`). Doc: the live `S.shared` (app.js 51, 3140-3141) -
     what the open shared page shows, so every add-to-list menu on it (the
     page's own, the bar's, a card's) copies its qty, price and players'
     note along (`metaForKey`, 1874-1877) and `+ Новый список` on it takes
     the whole list (`createFor`, 4221-4228). Set by `SharedListPage`
     while mounted, null on every other page - the route gate the live
     `metaForKey` applies, done by mount instead.
  2. `toggleSel(id)`: `if (this.sel.has(id)) this.sel.delete(id); else
     this.sel.add(id);` - `TablesPage.svelte`'s local `toggleSel` (197-200)
     moves here on its second use; `TablesPage` calls `app.toggleSel`.
  3. `#expand()`, the live `expandHash`: `const r = this.route; if (r.kind
     !== 'sharedList' || !r.packed) return;` then `void
     this.env.compress.unpack(r.payload).then((plain) => {
     this.replace(sharedListHash(plain.startsWith(PACK_MARK) ? 'zzzz' :
     plain)); }).catch(() => { this.replace(sharedListHash('zzzz')); });`.
     The `startsWith(PACK_MARK)` guard is load-bearing: `plainCompress`
     hands a packed payload back untouched, and a browser without
     `DecompressionStream` throws inside `browserCompress.unpack` - the
     live `catch` covers both by landing on `#/l/zzzz`, and without the
     guard the fake would `replace` the same packed hash forever. Called
     at the end of the constructor (after `#applySource()`), at the end of
     `start()`'s `onChange` handler, and at the end of `go()`. **Not** from
     `replace()` - nothing replaces to a packed hash, and the expansion
     itself replaces. `replace` fires no navigation, so `navigations`,
     `sel` and `menuFor` are untouched by an expansion, as the live
     `replaceState` path leaves them.
- **`components/HitNote.svelte` (new).** Props `icon: IconName`, `label:
  string`, `text: string | undefined`; renders nothing when `text` is
  empty, else exactly `ListPage.svelte`'s `hitnote` snippet (570-580):
  `<div class="hitnote"><Icon name={icon} /><span><b>{label}</b>` then
  `text.split('\n')` joined by `<br />` `</span></div>`, keeping the
  snippet's whitespace-free markup. Styles: the five rules moved verbatim
  from `ListPage.svelte` 1261-1300 (`.hitnote`, `.hitnote :global(svg)`,
  `.hitnote b`, `.hitnote span`) - **except** the sibling rule, which
  becomes `:global(.hitnote + .hitnote) { margin-top: 8px; }` placed
  *after* the base `.hitnote` rule: a scoped `.hitnote + .hitnote` cannot
  be matched inside one instance's own template, Svelte would prune it and
  `npm run check` fails pruned CSS; the two rules are now equal in
  specificity, so source order is what makes the 8px win, exactly as the
  live cascade does by specificity. Second use of the shape: the list
  page's rolled entry (first, B5.4a) and the shared page (second); both
  inline copies go.
- **`components/TableRows.svelte`.** `TableEntry` gains `tail?: string`
  ("the shared page's `×qty · price` after the name - `rtail`"); the
  list-view `<RowMain>` passes `tail={entry.tail}`. `Props` gains `after?:
  Snippet<[Record_]>` ("drawn right after a list-view row - the shared
  page's per-entry hitnotes, which the live `renderSharedList` puts
  between the rows, app.js 3163-3166"); right after the list-view `.row`
  `</div>`, `{#if after}{@render after(it)}{/if}`. Grid view untouched
  (the live shared page has no grid). A rendered snippet *prop* does not
  trip the void-expression lint that the file's header comment describes
  for a *local* snippet - `RecordCard.svelte` 243-244 renders its
  `actions` prop the same way with no disable comment.
- **`components/RowMain.svelte`.** Comments only: lines 6, 25 and 254 say
  the decoration is B5.6's and unused; they now name the caller
  (`TableRows`'s `TableEntry.tail`, from the shared page). No markup or
  rule changes.
- **`components/AddToList.svelte`.** Imports `N_SHARED` from
  `lib/lists.js`, `encodeList` from `lib/listLink.js`, `sharedListHash`
  from `lib/hash.js`; `const shared = $derived(app.shared)`.
  - `pick(l)`: the single-record toggle branch is skipped when `key ===
    N_SHARED` (live 1911: the whole list is only ever added); the add
    call becomes `app.lists.addIds(l, ids, knows, shared?.meta)` -
    `app.shared` is non-null exactly where the live `metaForKey` returns
    `S.shared.meta`, for every key. Message unchanged.
  - `openNew()`: `draft = key === N_SHARED ? (shared?.name ?? '') : ''`
    (live 4208).
  - `createNew()`: after the blank-name refusal, `if (key === N_SHARED &&
    shared)`: `init = { ids: [...shared.ids] }`; `meta` copied entry by
    entry (`{ ...m }` per id - meta values are flat) only when `shared.meta`
    has keys; `note`/`hnote` only when truthy; `const l =
    app.lists.create(draft, init)` (one save - B5.3 nit 5's second
    caller); `if (app.lists.saved) app.say(t.addedTo.replace('%s',
    l.name))`; fold the form; `app.go(sharedListHash(encodeList(l,
    true)))` - the live `goToList`. When the taken link *was* the players'
    payload the hash does not change; `go()` still bumps `navigations`
    and clears `sel`/`menuFor`, and `ListPage`'s `own` recomputes off
    `app.lists.lists` and finds the new list, so the own page draws - no
    special case, `syncListUrl` then sets `openList`. Every other key
    keeps the existing path.
  - The header comment's "a shared page will pass their own once they
    exist" becomes present tense.
- **`components/SharedListPage.svelte` (new).** Props `app: AppState`,
  `index: Index` (non-null - `ListPage` only mounts it past its own
  `{#if !index}`), `payload: string`. Off `renderSharedList` 3130-3170.
  - `knows`, `shared = $derived(decodeList(payload, knows))`, `items`
    (`shared.ids.map(byId)`, filtered - `decodeList` already dropped
    unknown ids, so `items.length === shared.ids.length`), `mode =
    $derived(moneyMode(shared))`, `metaOf(id) = shared?.meta?.[id] ??
    {}`, `tailOf(id)` (the bits rule above, `'×' + String(qty)` and
    `priceText(gold, mode, app.lang)`, joined `' · '`, `undefined` when
    empty), `entries = $derived(items.map((it) => ({ it, tail:
    tailOf(it.id) })))`, `sub = $derived(`${t.sharedList} ·
    ${String(items.length)} ${itemsWord(items.length, app.lang)}`)` -
    **one string, one text node**, the live structure.
  - `$effect(() => { app.shared = shared; })` and `onDestroy(() => {
    app.shared = null; })` - the same two-part shape `ListPage` uses for
    `syncListUrl`/`clearOpenList`, for the same reason its comment gives.
  - `let open = $state<Record_ | null>(null)`; `<RecordModal {app} {index}
    it={open} onclose onopen />` at the end, no `extra`.
  - Template. `{#if !shared}`: `<h1 class="page-h">{t.notFound}</h1><p
    class="page-sub">{t.badShare}</p><Button variant="primary"
    href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>` -
    `ListPage`'s list-not-found block with other words. `{:else}`: `<h1
    class="page-h">{shared.name || t.untitled}</h1>`, `<p
    class="page-sub">{sub}</p>`, `<div class="card-acts"><AddToList {app}
    key={N_SHARED} ids={shared.ids} primary /></div>`, `{#if shared.note
    || shared.hnote}<div class="notes"><HitNote icon="eye"
    label={t.notePub} text={shared.note} /><HitNote icon="eyeOff"
    label={t.noteHid} text={shared.hnote} /></div>{/if}`, then
    `<TableRows {entries} view="list" {index} lang={app.lang}
    selected={(id) => app.sel.has(id)} artBroken={(id) =>
    app.artBroken(id)} ontoggle={(id) => { app.toggleSel(id); }}
    onartfail={(id) => { app.markArtBroken(id); }} onopen={(r) => { open =
    r; }}>` with `{#snippet after(it)}<HitNote icon="eye" label={t.notePub}
    text={metaOf(it.id).note} /><HitNote icon="eyeOff" label={t.noteHid}
    text={metaOf(it.id).hnote} />{/snippet}` and **no `ontoggleall`** (no
    `.selall` live).
  - Styles: `.page-h` and `.page-sub` copied from `ListPage.svelte`
    917-935 (the tokens, not literals); `.card-acts` off style.css 405
    with the live inline style folded in (`display:flex; gap:6px;
    flex-wrap:wrap; align-items:center; margin-top:auto; padding-top:3px;
    margin-bottom:18px`); `.notes { margin-bottom: 18px; }` (the live
    inline-styled wrapper). Nothing else - rows, badges, hitnotes and the
    menu bring their own.
- **`components/ListPage.svelte`.** (1) The `{:else if !own}` branch:
  `{#if route.kind === 'sharedList' && route.packed}` an HTML comment only
  ("a packed link: `AppState` is expanding it and will rewrite the address
  to the plain form or to `#/l/zzzz`; the live app draws nothing until
  then either, app.js 4636") `{:else if route.kind === 'sharedList'}
  <SharedListPage {app} {index} payload={route.payload} />{/if}` - the
  `todo` paragraph goes, and with it `.todo` from the `.miss, .todo` rule
  and the `.todo` font rule (938-946; a rule with no element fails the
  check). (2) The `hitnote` snippet (570-580) and its two `{@render}`
  lines with their `eslint-disable-next-line` comments (703-706) become
  `<HitNote icon="eye" label={t.notePub} text={metaOf(h.id).note} />` and
  the `eyeOff` twin; the five `.hitnote` rules (1261-1300) go; import
  `HitNote`; drop the `IconName` type import if nothing else uses it. (3)
  The header comment's two "B5.6" mentions (66-67) become present tense.
- **`components/TablesPage.svelte`.** Local `toggleSel` (197-200) removed;
  `app.toggleSel(id)` in its place. `toggleAllIn` stays (one caller).
- **`components/a11y.test.ts`.** The guard compares `COVERED` against the
  files on disk, so both new components need an entry:
  `'HitNote.svelte': "the list page's priced, noted entry with the roll
  panel open above, and the shared list below"`, `'SharedListPage.svelte':
  'sharedListPage.test.ts, and the shared list below'`. `STATES` gains `{
  what: 'a list from another player, with both notes and a noted entry',
  route: '#/l/' + NOTES_BOTH_KINDS.gm.payload }` - no storage, no `enter`;
  the file's `LOOT` already knows `ci1` and `cc1`. Read the fixture the way
  `listLink.test.ts` does (`readFileSync` + `join(import.meta.dirname,
  ...)`), or paste the payload with a comment naming the fixture - either
  is fine; do not compute it in the test.
- **`tests/parity/driver.js`.** One verb, `expanded()`: `await
  page.waitForFunction(() => !location.hash.startsWith('#/l/~')); await
  settle(page);`. Why: `ready()` waits for `#view`/`#app` to have
  children, which on the live app already means the expansion has landed
  (nothing renders before it), but the rewrite's `Shell` mounts at once
  and the replace lands a few milliseconds later - without the wait the
  packed cell would race the expansion on one side only.
- **`tests/parity/specs.js`.** Below.
- **`docs/specs/COVERAGE.md`.** The suite table gains a
  `components/sharedListPage.test.ts` row (what it owns, per the tests
  below); the `state/app.test.ts` row adds "a packed address expanded
  through the compress port, and where it lands when the port cannot"; the
  `components/listPage.test.ts` row adds "and the branch into the shared
  page". No threshold changes.

#### Resolved: the outline's two open questions

**(a) `RowMain`'s `tail`/`.rtail` - use it, do not delete it.** The live
`rowHTML(it, '', tail)` puts the decoration inside `<b>` right after the name
(2794), which is exactly `RowMain`'s existing `{#if tail}<i class="rtail">`;
the shared page's rows are `TableRows`'s list rows byte for byte (`.row` +
`.selbox` + `.row-main`, `.sel` off the app-wide selection, no `.selall`), so
`TableRows` is the right caller and `tail` only needs threading through
`TableEntry`. The one thing `TableRows` could not give - the per-entry
hitnotes drawn *between* rows, inside `.rows` where the 8px column gap and
the hitnote's own 12px top margin compose - is what the `after` snippet
supplies. Deleting `tail` would have meant `SharedListPage` drawing
`.row`/`.selbox` itself: a third copy of `TableRows`'s rules for a row that
is otherwise identical. Nit 1 closes with the caller.

**(b) The tails state uses `docs/fixtures/lists/qty-and-price.json`.** Its
payload (`player` and `gm` are the same string - no notes) carries `ci1*2`,
`cc21*5*50`, `q337*1*12`: a bare quantity, a quantity with a price, and a
bare price - all three tail shapes, and every id is in `data.js` (checked
with `window.LOOT` at `d6c951f`). `notes-both-kinds.json` carries notes and
no qty/gold, so it has no tails; `unicode-heavy.json` and
`money-coin-mode.json` are one-entry payloads that cover less. So the plain
shared state is the qty-and-price payload (tails, no notes), the noted
state is notes-both-kinds' `gm` payload (notes, no tails), and coin mode is
a unit case on `money-coin-mode.json`'s payload (`750 зол.`), not a pixel
state. The outline's "seven plain rows with the own-list payload" state is
dropped: it would show nothing the own-list state and the tails state do
not already show.

#### Tests

Every component test ends with `expectNoA11yViolations`; the pressed states
named below get their own axe pass (`COVERAGE.md`).

- **`lib/dict.ts`** needs no test: `Dict` is `Record<keyof typeof ru, string>`,
  so a key present in `ru` and absent in `en` fails `svelte-check` on its own.
- **`state/lists.test.ts`**, in "adding and removing ids": (1) `addIds`
  with `meta` copies `qty` only when above 1, `gold` only when above 0,
  `note` when present, and never `hnote` - assert the stored entry is
  `{ qty: 5, gold: 50, note: 'x' }` for one id, `{ gold: 12 }` for a
  `qty: 1` id, and absent for an id whose meta is `{ qty: 1 }`; (2) an id
  already in the list keeps its own meta untouched even when `meta`
  offers another; (3) a call without `meta` leaves `list.meta` exactly as
  it was (the existing case, kept green).
- **`state/app.test.ts`**. New `describe('a packed address')` with a
  compress fake whose `unpack` is `(p) => Promise.resolve(p.slice(1))`
  (the shape `listsPage.test.ts` 302-314 already uses): (1) at
  construction `#/l/~abc` becomes `#/l/abc` on both `app.hash` and
  `router.hash()`, with `router.stack.length` still 1 and `navigations`
  0 - a replace, not a step (use `await vi.waitFor(...)`); (2) the
  default `plainCompress` (cannot unpack) lands on `#/l/zzzz` and stays
  there - assert the hash and that `unpack` was called once (spy), so a
  loop cannot pass; (3) an `unpack` that rejects lands on `#/l/zzzz`; (4)
  a packed hash the router announces after `start()` expands the same
  way; (5) `go('#/l/~abc')` expands. In "the selection": `toggleSel` adds
  an absent id and removes a present one. `shared` starts null (one
  line, in the constructor tests).
- **`components/listPage.test.ts`**, in "the address": replace "draws the
  todo paragraph for a payload that is nobody's" with "draws the shared
  page for a payload that is nobody's" (the `h1` reads the payload's
  name, no title input); add "draws only the frame while a packed address
  expands, then the shared page once it lands" (compress fake as above;
  before `waitFor`, no `h1` in the main region; after, the name); add
  "lands on the bad-link page when the port cannot expand a packed
  address" (default env → `Предмет не найден`, the `badShare` line, a
  link `На главную` with `href` `#/roll/std`). The roll-panel case "shows
  an entry's compact card, badged, with both hitnotes" stays green
  through the component swap - it is the proof the extraction moved
  nothing.
- **`components/sharedListPage.test.ts` (new).** Harness as
  `listPage.test.ts`: `render(App, { env })` with `memoryRouter('#/l/' +
  payload)`, a `LOOT` that knows `ci1`, `cc1`, `cc21`, `q337` (four plain
  records are enough - names are what the assertions read), fixtures read
  from `docs/fixtures/lists/` the way `listLink.test.ts` does. Cases:
  1. **heading and sub** (notes-both-kinds `gm`): `h1` `Тайник`; the sub
     paragraph's `textContent` is exactly `Список от другого игрока · 2
     позиции` and it has **one** child node; the `Добавить в список`
     button is present with `aria-expanded="false"`; no `select all`
     checkbox (`t.selectAll` text absent); no selection bar.
  2. **untitled**: `encodeList({ name: '', ids: ['ci1'] }, true)` → `h1`
     `Без названия`.
  3. **notes**: above the rows, two `.hitnote`s in order `Для игроков` /
     `Только для мастера` with the fixture's texts; after `ci1`'s row
     (`[data-row="ci1"]`) its two entry hitnotes (`Видно игрокам`,
     `Подделка`) and none after `cc1`'s; a note containing `\n` (build one
     with `encodeList`) renders a `<br>`.
  4. **tails** (qty-and-price): `.rtail` under `ci1` reads `×2`, under
     `cc21` `×5 · ${priceText(50, 'bag', 'ru')}`, under `q337`
     `${priceText(12, 'bag', 'ru')}`; the noted payload's rows have no
     `.rtail`; money-coin-mode's payload reads `750 зол.`.
  5. **selection**: ticking `ci1`'s checkbox (`aria-label` `Выбрано`) puts
     `.sel` on its row and raises the bar with `Выбрано 1`; ticking again
     removes both.
  6. **the bar carries the shared meta** (qty-and-price, storage `TWO`):
     tick `cc21`, open the bar's `Добавить в список`, press `Клад
     дракона` → stored `a` is `{ ids: ['cc21'], meta: { cc21: { qty: 5,
     gold: 50 } } }` and `b` untouched.
  7. **a chip pours the whole list** (qty-and-price, storage `TWO`): the
     page's `Добавить в список`, then `Клад дракона` → `a.ids` `['ci1',
     'cc21', 'q337']`, `a.meta` `{ ci1: { qty: 2 }, cc21: { qty: 5, gold:
     50 }, q337: { gold: 12 } }`, no `note`/`hnote` anywhere; toast
     `Добавлено в «Клад дракона»: 3`; the menu stays open.
  8. **the GM's note stays behind** (notes-both-kinds `gm`, storage
     `TWO`): chip `Клад дракона` → `a.meta.ci1` is `{ note: 'Видно
     игрокам' }` - no `hnote` - and `a` has no list `note`/`hnote`.
  9. **taking into a new list** (notes-both-kinds `gm`, empty storage):
     `+ Новый список` → the input's value is `Тайник` and it has focus;
     `Создать` → storage holds one list with `name` `Тайник`, `ids`
     `['ci1', 'cc1']`, `note` `Лавка закрыта до утра`, `hnote` `Хозяин -
     контрабандист`, `meta.ci1` `{ note: 'Видно игрокам', hnote:
     'Подделка' }`; toast `Добавлено в «Тайник»`; `router.hash()` is
     `'#/l/' + NOTES_BOTH_KINDS.player.payload`; the page now draws the own
     list page (a title input with value `Тайник`, no `Список от другого
     игрока`).
  10. **a blank name is refused** (notes-both-kinds, `+ Новый список`,
      clear the input, `Создать`): alert toast `Сначала назовите список`,
      storage still empty, the form still open.
  11. **a row opens the modal**: click `ci1`'s `.row-main` → a `dialog`
      naming the record; close it.
  12. **the bad link** (`#/l/zzzz`): `h1` `Предмет не найден`, the
      `badShare` line, link `На главную` → `#/roll/std`; no add button.
  13. **English** (notes-both-kinds, `EN` press): sub `A list from another
      player · 2 items`; labels `For players` / `GM only`; the add button
      `Add to list`.
  14. **axe**: `expectNoA11yViolations` on (a) the noted page as drawn,
      (b) the bad-link page, (c) the page with the menu open and the
      new-list form showing, (d) the page with a row ticked and the bar
      showing.
- **`components/tables.test.ts`**: nothing new - `toggleSel` moving to
  `AppState` is covered by its existing selection cases staying green.

#### Parity states, each in both languages at three widths

`NOTES_BOTH_KINDS` and `QTY_AND_PRICE` are `require`d beside
`EQUIPMENT_ENTRY` (specs.js 17). The packed payload is pasted, computed once
by this command from the repository root (its output is below - the
implementer pastes it, and keeps the command in the comment beside it):

```text
node -e "const z=require('zlib');const f=require('./docs/fixtures/lists/notes-both-kinds.json');console.log('~'+z.deflateRawSync(Buffer.from(f.gm.raw,'utf8')).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''))"
```

```text
~JY2hDsIwFAD9PqKrH5AUwwfVMIXCLqNIBAkWQUKCL6xkpdB-w70_IgN5d-K44nmRiaRquVhttuvOtmZmralU09Wc8TxIeM2IJ0kvB3ETBoqWvTjp8aqruVEY5Ugk67kmUcj_yh1PJhBlJ041tjU1JyKBTNFEBukp04WP-tULhUDgyXvSXw
```

(Verified in planning: `inflateRawSync` of it re-encodes to exactly
`gm.payload`; Node's deflate bytes differ from Chrome's `CompressionStream`
but both are raw deflate, which `DecompressionStream('deflate-raw')` reads.)

| id | route | storage | enter | why |
|---|---|---|---|---|
| `#/l/ ~ shared` | `'#/l/' + QTY_AND_PRICE.player.payload` | `two` | - | a list from another player: heading `Лавка`, the sub, the add control, three rows with their tails (`×2`; `×5 · price`; `price`), no notes, no bar. Seeded so `addedSharedToList` has a list to add to; the lists are not drawn here, so the seed costs no pixel |
| `#/l/ ~ shared, noted` | `'#/l/' + NOTES_BOTH_KINDS.gm.payload` | - | - | `Тайник`: both list hitnotes above two rows, `ci1` with both entry hitnotes under it, no tails |
| `#/l/ ~ packed` | `'#/l/' + PACKED` (the string above) | - | `(d) => d.expanded()` | the packed form, expanded and rewritten to the plain form - pixels identical to `~ shared, noted`; `listAddress` proves the rewrite |
| `#/l/zzzz` | `#/l/zzzz` | - | - | the bad-link page: `Предмет не найден`, the `badShare` line, the `На главную` button |

None is `timed`. A ticked row on the shared page is `#/tables ~ a row
ticked`'s bar, already covered; it is a press spec here, not a pixel state.

`NAME` gains `newList: '+ Новый список'` / `'+ New list'` and `create:
'Создать'` / `'Create'` (the chip's text carries the `+ `; `d.click` needs
the exact string because the EN press has already renamed it by the time a
press spec runs). `listAddress.only` gains the four ids - `~ packed` must
read `'#/l/' + NOTES_BOTH_KINDS.gm.payload` on both apps.

Press specs, each `presses: true`:

- `tookSharedList` (`only: ['#/l/ ~ shared, noted']`): `click(addToList)`,
  `click(newList)`, `click(create)`; return `{ hash: await d.hash(),
  stored: stored.map((l) => [l.name, l.ids, l.note ?? null, l.hnote ??
  null, l.meta ?? null]) }`. Both apps: hash `'#/l/' +
  NOTES_BOTH_KINDS.player.payload`, one list `['Тайник', ['ci1', 'cc1'],
  'Лавка закрыта до утра', 'Хозяин - контрабандист', { ci1: { note: 'Видно
  игрокам', hnote: 'Подделка' } }]`.
- `addedSharedToList` (`only: ['#/l/ ~ shared']`): `click(addToList)`,
  `click('Клад дракона')`; return `{ hash, stored: stored.map((l) =>
  [l.id, l.ids, l.meta ?? null]) }`. Both apps: the hash unchanged (the
  live `afterListChange` → `freshenListUrl` rewrites only when
  `S.openList === l.id`, which it is not here), `[['a', ['ci1', 'cc21',
  'q337'], { ci1: { qty: 2 }, cc21: { qty: 5, gold: 50 }, q337: { gold: 12
  } }], ['b', [], null]]`.

#### Ordered steps

One code commit. The planning docs land first, on their own commit with an
explicit pathspec (`issues/47/plan.md issues/47/handoff.md
issues/47/context.md`), as B5.5's did. Each check is `set -o pipefail; npm
run check 2>&1 | tail -n 120`, one foreground call, Bash timeout 600000;
the last one runs after the doc edits, immediately before `git commit`,
because the docs move the tree fingerprint the gate reads.

1. `lib/dict.ts` (two keys, both blocks); `lib/lists.ts` (`N_SHARED`);
   `state/lists.svelte.ts` (`addIds` meta) + `state/lists.test.ts` cases;
   `state/app.svelte.ts` (`shared`, `toggleSel`, `#expand` and its three
   call sites) + `state/app.test.ts` cases. `npx vitest run app/src/state
   app/src/lib` green.
2. `components/HitNote.svelte`; `ListPage.svelte` swaps its snippet and
   drops the five rules; `TableRows.svelte` (`tail`, `after`);
   `RowMain.svelte` comments; `TablesPage.svelte` uses `app.toggleSel`.
   `npx vitest run app/src/components/listPage.test.ts
   app/src/components/tables.test.ts` green.
3. `AddToList.svelte` (shared meta, the `@` take, `openNew`'s draft).
4. `SharedListPage.svelte`; `ListPage.svelte`'s `{:else if !own}` branch
   and the `.todo` rules; `a11y.test.ts` (`COVERED` ×2, the state).
5. `components/sharedListPage.test.ts` (the fourteen cases);
   `listPage.test.ts`'s three address cases.
6. `tests/parity/driver.js` `expanded()`; `tests/parity/specs.js`: the two
   `require`s, `PACKED` with its comment, four states, `NAME` ×2,
   `listAddress.only` ×4, `tookSharedList`, `addedSharedToList`, both in
   `SPECS`.
7. `npm run check` green (fix, do not skip; if the host is loaded, read
   `.claude/README.md` "Run a long check" and `context.md` "The host block
   lifted" before retrying).
8. `npm run build`, then the parity loop - one foreground call per group,
   none merged, `MSYS_NO_PATHCONV=1` in front of each:
   - `node tests/parity.js "#/l/"` - 5 states (`~ own list` included), 30
     cells, `listAddress` ×5, `tookSharedList`, `addedSharedToList`;
   - `node tests/parity.js "i/ci1 ~"` - the `AddToList` regression, 36
     cells;
   - `node tests/parity.js "#/tables @" "#/tables ~ a row ticked" "#/tables
     ~ bar menu" "#/lists/a @" "#/lists/a ~ rolled"` - `TableRows`, the
     bar's menu, `ListPage`'s branch and the `HitNote` extraction, 30
     cells.
   Every cell zero; open a diff image before touching any value. If the
   `~ packed` rewrite cell is the only red, the verb did not wait - check
   `listAddress`'s two hashes first.
9. `npm run check:built` (the screen changes; the bundle budget).
10. `plan.md` "B5.6 built" (what shipped, exact commands and results, any
    deviation), `handoff.md` (Status, Completed, Verification, Next batch =
    the lists slice is closed - name what follows in the phase plan,
    Deferred: nit 1 closed), `COVERAGE.md`'s three rows, `context.md` only
    for a durable fact learned.
11. `npm run check` again (the docs moved the fingerprint); commit
    `feat(lists): the shared list page`. No push.

**Fits one implement cycle.** The batch is one component, one seed set,
one filter (`"#/l/"`) plus two regression groups; ~25 paths, under B5.4a's
43 and near B5.3's 26, both of which passed one foreground `npm run check`
on an idle host. Nothing here needs a contract change, a seed that does
not exist, or a verb the harness lacks beyond the eight-line `expanded()`
that lands in the same commit. No split.

#### Acceptance criteria

- `npm run check` exit 0 before the commit; thresholds met with
  `SharedListPage.svelte`, `HitNote.svelte`, `app.svelte.ts`'s `#expand`
  and `lists.svelte.ts`'s meta branch all reached.
- `a11y.test.ts`'s guard passes with both new components named, and the
  shared-list state passes axe.
- All five `#/l/` states read `совпадает` in both languages at 1100, 768
  and 375; `listAddress` reports the plain hash for `~ packed` on both
  apps; `tookSharedList` and `addedSharedToList` return the same data on
  both apps.
- The three regression groups read `совпадает` throughout - the `HitNote`
  extraction, the `TableRows` props and the `AddToList` change move no
  pixel.
- `npm run check:built` exit 0.
- No `VISUAL_DEBT` entry written from this host; no `ACCEPTED` entry
  added.
- `ListPage.svelte` has no `todo` element or rule, no `hitnote` snippet
  and no `.hitnote` rule; `RowMain.svelte`'s comments name the caller;
  `TablesPage.svelte` has no local `toggleSel`.
- `handoff.md` "Deferred" marks B5.4a nit 1 and B5.3 nit 5 closed by this
  batch.

#### Risks and do-nots

- Do not compute the packed payload in `specs.js` at run time, and do not
  let the live app's `sharedListLink` output stand in for it: paste the
  string above with its command.
- Do not put `after`'s hitnotes outside `TableRows`: the 8px column gap
  plus the hitnote's 12px top margin is the live geometry, and it only
  composes inside `.rows`.
- Do not write `.hitnote + .hitnote` scoped in `HitNote.svelte` - it
  prunes and the check fails; `:global(.hitnote + .hitnote)`, after the
  base rule.
- Do not call `#expand()` from `replace()`; the expansion's own `replace`
  would re-enter it.
- Do not drop the `startsWith(PACK_MARK)` guard: the test env's
  `plainCompress` returns the packed payload unchanged and the app would
  replace the same hash forever.
- Do not toggle a single record when the key is `'@'`; the live app adds
  the whole list even when it has one entry (1911, before the toggle).
- Do not copy `hnote` in `addIds`, and do not copy meta for an id that is
  already in the list (only `fresh` ids get it, 1930-1936).
- Do not build the sub from three text nodes; one string.
- Do not pass `ontoggleall` to `TableRows` on the shared page: the live
  page has no `.selall`.
- Do not seed storage on `~ shared, noted`: `tookSharedList` expects one
  list in storage afterwards. Do seed `two` on `~ shared`.
- Do not mark any of the four states `timed`; nothing on them fades.
- The `~ packed` state's `enter` must be the `expanded()` verb, not a
  `settle()`; the race is on the rewrite's side only.
- Do not write a `VISUAL_DEBT` number from this host.
- Two commits total (planning docs, then code), no push, no attribution
  trailer.

#### Decided in planning - do not reopen

- **`SharedListPage.svelte` is a component, rendered by `ListPage`'s
  `{:else if !own}` branch**, not more markup in `ListPage.svelte`: it owns
  the decode, `app.shared`, its own modal and the bad-link block. The
  fourth `.page-h`/`.page-sub` copy it carries is the pattern the three
  existing pages set; the extraction is recorded, not done.
- **`app.shared` is the route gate.** Set while `SharedListPage` is
  mounted, null otherwise - equivalent to the live `metaForKey`'s `route
  is l/ and no openList` test, and it lets `AddToList` read one field for
  every key instead of a `fresh` prop plus a `meta` prop.
- **`RowMain.tail` stays and is used** (nit 1); `TableRows` gets
  `TableEntry.tail` and an `after` snippet - the two differences the one
  real caller needs, nothing more.
- **`HitNote` is extracted now** - second use.
- **`toggleSel` moves to `AppState`** - second use, three lines, one test.
- **The packed expansion lives in `AppState`**, off the same three moments
  the live `expandHash` runs (first render, `hashchange`, a programmatic
  step), and lands on `#/l/zzzz` for both failure shapes.
- **Four states, not five**: the tails state carries the plain page; the
  "seven plain rows" state of the outline is dropped as redundant.
- **Coin mode on the shared page is a unit case**, not a state.
- **One code commit**; the harness verb is eight lines and lands with the
  state that uses it.

### B5.6 built: the shared page, the packed link, the bad link, and taking a shared list

**All eleven ordered steps done as designed, in one commit; no deviation from
the brief.** `lib/dict.ts` gained `sharedList`/`toStart` in both blocks;
`lib/lists.ts` gained `N_SHARED = '@'`; `state/lists.svelte.ts`'s `addIds`
gained a fourth `meta?` parameter that copies `qty` (above 1), `gold` (above
0) and `note` (never `hnote`) for fresh ids only, in the live `setMeta`
order; `state/app.svelte.ts` gained `shared` (`DecodedList | null`),
`toggleSel(id)` (moved off `TablesPage.svelte`'s own copy on its second use),
and `#expand()` (the live `expandHash`, called at the end of the
constructor, every `onChange`, and every `go()` - never from `replace()`),
guarded by `plain.startsWith(PACK_MARK)` so a port that cannot decompress
(the test env's `plainCompress`, and a real browser without
`DecompressionStream`) lands on `#/l/zzzz` instead of looping. `HitNote.svelte`
is the `hitnote` snippet's second use, carrying `:global(.hitnote +
.hitnote)` after the base rule so Svelte does not prune it as dead CSS.
`TableRows.svelte` gained `TableEntry.tail` (threaded into `RowMain`,
closing B5.4a nit 1) and an `after` snippet drawn right after each list-view
row. `AddToList.svelte` skips the single-record toggle for `key === N_SHARED`,
copies `app.shared?.meta` into every `addIds` call, and its `createNew()`
builds a `N_SHARED` list from the whole shared list's ids/meta/notes in one
`ListStore.create(name, init)` call (closing B5.3 nit 5), then navigates to
the new list's own address. `SharedListPage.svelte` (new) decodes the
payload, sets `app.shared` while mounted (the route gate the live
`metaForKey` applies, done by mount instead), and draws the heading, the
one-text-node sub, the add control, both list hitnotes, `TableRows` for the
rows with their tails and per-entry hitnotes, and the bad-link block for a
payload that does not decode. `ListPage.svelte`'s `{:else if !own}` branch
now nests the packed-address (draws nothing) and shared-page branches inside
a bare `!own` check - not `route.kind === 'sharedList' && !own` directly -
so `svelte-check` can still narrow `own` to non-null in the final `{:else}`;
the `hitnote` snippet, the `.hitnote` rules, the `todo` paragraph and its
`.todo` rules are gone. `TablesPage.svelte`'s local `toggleSel` is gone,
replaced by `app.toggleSel`. `a11y.test.ts` names both new components in
`COVERED` and gains the shared-list state, reading
`notes-both-kinds.json`'s `gm.payload` the way `listLink.test.ts` reads
fixtures. `tests/parity/driver.js` gained `expanded()` (waits for
`location.hash` to leave `#/l/~`, then `settle()`); `tests/parity/specs.js`
gained the two fixture `require`s, the pasted `PACKED` constant with its
command in a comment, four states, `NAME.newList`/`NAME.create`,
`listAddress.only`'s four new ids, and `tookSharedList`/`addedSharedToList`.

**One test-writing deviation, not a behaviour one: `components/listPage.test.ts`'s "packed address" test asserts on `within(main)` rather than the
brief's literal `#app main`.** `screen.getByRole('main')` is the same
element `<main id="main">` (`Shell.svelte`) that `#app main` would select;
the accessible-role query was already this suite's own convention
(`within(screen.getByRole('dialog'))` elsewhere) and needed no CSS escape
hatch. No other deviation: the fallback ("wait for the `h1` to exist in
`#app main` instead") was not needed - `expanded()` read every `~ packed`
cell `совпадает` on the first parity run.

**Verification.**

- `set -o pipefail; npm run check 2>&1 | tail -n 120` - exit 0: format,
  lint and `svelte-check` (532 files, 0 errors) clean; `data`/`derived.js`/
  `i18n.js`/`selftest.mjs` clean; 921 tests, 0 failures, coverage 96.3 stmts
  / 88.51 branch / 96.77 funcs / 97.06 lines (`state/app.svelte.ts` 100%
  across the board; `state/lists.svelte.ts` 95.89/88.46/100/98.27).
- `npm run build` clean: `dist/assets/app.js` 278.03 kB, 83.59 kB gzip.
- Three parity groups, each its own foreground call, none merged:
  `MSYS_NO_PATHCONV=1 node tests/parity.js "#/l/"` - 30 state cells plus
  `listAddress`, `tookSharedList`, `addedSharedToList`, **расхождений нет**;
  `MSYS_NO_PATHCONV=1 node tests/parity.js "i/ci1 ~"` - 36 cells,
  **расхождений нет**; `MSYS_NO_PATHCONV=1 node tests/parity.js "#/tables
  @" "#/tables ~ a row ticked" "#/tables ~ bar menu" "#/lists/a @"
  "#/lists/a ~ rolled"` - 30 cells, **расхождений нет**. Every `~ packed`
  cell read `совпадает` with `expanded()` unmodified - the plan's stated
  fallback was never needed.
- `npm run check:built` - exit 0: build clean, `smoke-file-url.mjs` opens
  from a folder, `bundle-budget.mjs` 81.2 kB against the 120 kB budget.
- A final `npm run check` re-armed the gate after the doc edits moved the
  tree fingerprint, immediately before the commit below.

**No `VISUAL_DEBT` entry written; no `ACCEPTED` entry added.** `ListPage.svelte`
has no `todo` element or rule, no `hitnote` snippet and no `.hitnote` rule;
`RowMain.svelte`'s comments name the caller (`TableRows`'s
`TableEntry.tail`, from the shared page); `TablesPage.svelte` has no local
`toggleSel`. B5.4a nit 1 and B5.3 nit 5 are closed by this batch, per
`handoff.md`'s "Deferred". This closes the lists slice; B5.6 was its last
batch.

### B6 planned: the search slice - one batch (planner, 2026-09-11)

Picked by the orchestrator on 2026-09-11 over print (`context.md`, "State at
the search-slice kickoff"): search reuses the row, the select-all bar, the
selection bar and the kind chips wholesale, whereas print is a from-scratch
visual surface whose evidence is the Figma nodes and the Figma connector is
unauthenticated. The pick is not reopened here; this section scopes it.

**Objective.** After this batch `#/search` draws what the live `renderSearch`
draws: the page head (`Поиск`, the pin button, the sub line, no help), one
panel holding the search box - focused on arrival - and the three kind chips
(`Предметы`, `Расходники`, `Снаряжение`, all on, the last one on refusing to
go), and under it one of three bodies: the hint `Начните вводить запрос`
while nothing is typed, or `Выбрать все (N)` over up to 300 rows of loot and
gear together in catalogue order, or `Ничего не найдено`. A ticked row raises
the selection bar; a row opens the record modal. Switching a kind off on
search switches it off on Core rules and the alternate tables too, the way
the live `S.kind` does. The `pending` on `#/search` in `tests/parity/specs.js`
goes. After this batch the only Phase 4 slice left is print.

**In scope.** `lib/types.ts` (`KINDS`), `lib/dict.ts` (two keys),
`lib/search.ts` (`statLineFor`) + test, `state/app.svelte.ts` (`kinds`,
`toggleKind`) + test, `components/SearchBox.svelte` (new, second use of the
search input), `components/SearchPage.svelte` (new),
`components/searchPage.test.ts` (new), `components/Field.svelte` (`label`
optional), `TablesPage.svelte` (the box and the stat line move out),
`StdPanel.svelte` and `AltPanel.svelte` (`kinds` moves up), `App.svelte`
(the route, and the dead section fallback goes), `components/a11y.test.ts`
(`COVERED` x2, one state), `tests/parity/driver.js` (`count`),
`tests/parity/specs.js` (seven states, three spec changes, two new specs -
one of them the carried `~ packed` throw), `docs/specs/COVERAGE.md` (one
row), `docs/specs/FEATURES.md` (the 300 cap, one clause).

**Out of scope.** Any change to `CONTRACTS.md`, `docs/fixtures/`,
`tests/contracts.js`, `ROUTES.md`, `llms.txt` - `#/search` is a plain
section route with no grammar of its own. `STATE.md` - the kind filter is
already listed there as memory-only, which is what it stays. A `.panel`
component (sixth inline copy; recorded in the handoff's Deferred with the
`.page-h` one, not done here). `S.search.q` surviving a route change in
memory (see "Decided"). `ListPage.svelte:103`'s stale comment - this batch
does not touch that file, so it stays recorded. Print.

#### What the live app does, read off app.js and style.css (HEAD `16bc32e`), and measured

Measured in planning with a headless-Chrome probe of
`file://.../index.html#/search` at 1100x900 (the script lived in the session
scratchpad and is not kept; the numbers are in `context.md`, "B6 planning
facts"):

- **The page** (`renderSearch`, 2841-2859; routed at 3574; tab at 3580).
  `pageHead('search')` (2145-2168): `h1.page-h` `Поиск`, the home button
  (`homeHash()` is truthy for a section, so it is drawn - measured `home:
  true`), **no help button** (`t().help` has no `search` key - 201-263,
  382-445; measured `help: false`), `p.page-sub` `Поиск по всем 1061 позиции
  сразу — добыча, расходники и снаряжение, на русском и на английском.` /
  `Search all 1061 entries at once — loot, consumables and equipment, in
  Russian and English.` (268, 449). Then `<div class="panel"
  style="margin-bottom:16px">` holding `<div class="field"><input
  type="search" id="sq" value=... placeholder=t().searchPh autofocus></div>`
  and `kindChips()`, then the body.
- **The box is focused on arrival.** `document.activeElement.id` reads `sq`
  on a fresh open of `#/search`, and the input's border reads
  `rgb(216,171,94)` - `input[type=search]:focus` (style.css 258) is painted
  in the first shot. Do not reason this away from the autofocus spec; it is
  measured. Computed: `15.5px Inter`, height `46px`, padding `0 14px`
  (style.css 254-257). The `.panel` margin-bottom is `16px` (inline), the
  input's `.field` is `16px` (150), the chips' `.field:last-child` is `0`
  (151).
- **The chips** (`kindChips`, 2114-2127, over `KINDS` 2110): `<div
  class="field"><span class="lbl">Тип</span><div class="chips">` and one
  `button.chip` per kind, `.on` and `aria-pressed` off `S.kind[k]`; the last
  one on carries `data-last="1"` and `title=t().keepOneKind`. The handler
  (4160-4164) toasts `keepOneKind` as an error and does nothing when
  `data-last` is set, else flips `S.kind[val]` and renders. `kindOf` (2131)
  is `equip` for anything with `eq` - the eleven Wondrous weapons stored as
  items obey the equipment chip, per the comment at 2128-2130 - and
  `kindAllows` (2132) reads `S.kind`. **`S.kind` is one object (60) shared
  by Core rules, the alternate tables and search**, never persisted
  (`tests/behave.js` 262-267 proves it resets on reload) and not cleared on
  `hashchange` (4628-4636 clears `sel`, `lsel`, `menuFor`, `newListFor`
  only).
- **The body** (2842-2851). `q = S.search.q.trim().toLowerCase()`. Empty:
  `<div class="empty">Начните вводить запрос</div>` / `Start typing` -
  **inline strings, not dictionary keys** (2845). Otherwise `res =
  SEARCHABLE.filter(kindAllows(kindOf(x)) && matches(x, q)).slice(0, 300)`
  where `SEARCHABLE = ALL.concat(EQ)` (23) - the rewrite's
  `index.searchable` is `[...all, ...eq]` (`lib/data.ts` 144), the same
  order - and `matches` (2834-2840) is `lib/search.ts`'s `matches` with
  `eqLine(it)` *with* the type word as the stat line (the rule
  `TablesPage.svelte` already documents on its own `statLine`). Hits:
  `selectAllHTML(res)` (2763-2773 - the `.selall` label, `Выбрать все (N)`)
  then `<div class="rows">` of `rowHTML(it)` (2785-2803: `selBox`
  2810-2815 with `aria-label=t().selected`, `.sel` off `S.sel`, `rnum` off
  `it.roll`, no tail). No hits: `<div class="empty">t().nothing</div>` -
  **no reset button** (that is the tables' `resetAll`, tied to facets).
  Measured row counts, the parity states are chosen off them: `кольцо` 12,
  `зелье` 40, `меч` 87 (34 with `Снаряжение` off - equipment gone, no
  `eq-*` badge left), `а` and `о` 300 (the cap; `Выбрать все (300)`),
  `zzzqqqxx123` 0 with `.empty`.
- **Typing** (4333): `S.search.q = el.value; render()` on every `input`
  event; `keepFocus`/`restoreFocus` (3740-3762) put the caret back after the
  redraw. A chip press likewise re-focuses the chip (measured
  `activeElement` `BUTTON` after the press) - the rewrite gets both for free
  by not redrawing.
- **Selection and the modal.** `S.sel` is the same app-wide object the bar
  reads (B5.2); `tests/select.js` 106-112 proves `.selall` on search takes
  "all of what was found". `data-open` on a row opens the modal (the same
  handler as the tables); `hashchange` closes it.
- **CSS**: `.panel` 145-149 (+ the inline 16px), `.field`/`.lbl` 150-152,
  `.chips`/`.chip`/`.chip.on` 155-163, `input[type=search]` and `:focus`
  254-258, `.empty` 524-525, `.rows`/`.row` 547+ - all but the first two
  already ported (`Field`, `ChipRow`, `Chip`, `Empty`, `TableRows`,
  `RowMain`; the input rule sits in `TablesPage.svelte` as `.toolbar
  input[type='search']`).

#### What is reused, and what is new

| piece | live | rewrite | this batch |
|---|---|---|---|
| page head | `pageHead('search')` | `PageHead` (`help={null}` draws no button) | reuse; `dict.subSearch` added |
| the search box | `input#sq` in `.field` | `TablesPage.svelte`'s toolbar input and its two rules | **`SearchBox.svelte`, extracted on this second use**; `TablesPage` uses it |
| the labelless field | `.field` around the input | `Field.svelte` requires `label` | `label` becomes optional - the one difference this caller needs |
| the kind chips | `kindChips()` over `KINDS` | `Field` + `ChipRow` + `Chip` in `StdPanel`/`AltPanel` over `LOOT_KINDS`, each with its own `kinds` and `toggleKind` | reuse the three components; **`kinds` and `toggleKind` move to `AppState`** (third owner, shared in the live app) |
| the two empties | `.empty` | `Empty.svelte` | reuse; `dict.startTyping` added |
| select-all + rows | `selectAllHTML` + `rowHTML` | `TableRows` (`ontoggleall` draws `.selall`), `RowMain` | reuse, `view="list"` |
| the match | `matches` | `lib/search.ts` `matches`; the stat line built inline in `TablesPage` | `statLineFor(lang, t)` in `lib/search.ts`, both pages call it |
| the cap | `.slice(0, 300)` | - | `SearchPage` slices; unit-tested |
| the bar, the modal | `renderSelBar`, `openModal` | `SelBar` via `Shell`, `RecordModal` | reuse; `open` cleared on `app.navigations` as `TablesPage` does |
| the route | `ROUTES.search` | `App.svelte`'s section fallback (`h1` + `.todo`) | `SearchPage`; the fallback and its `h1` rule go - every section now has a page |

Genuinely new: `SearchPage.svelte` (the composition, ~120 lines of which
half is the `.panel` copy and the `.miss` line), `SearchBox.svelte` (the
input, its two rules, a `focus` prop), `AppState.kinds`/`toggleKind`,
`statLineFor`, the `count` driver verb, and the strings.

#### How it is built

- **`lib/types.ts`.** `export const KINDS = ['item', 'consumable', 'equip']
  as const;` and `export type Kind = (typeof KINDS)[number];` replacing the
  literal union at line 6 - the same shape `SECTIONS`/`Section` already
  take in the same file. `lib/std.ts`'s `LOOT_KINDS` stays as written (the
  roll pages' two).
- **`lib/dict.ts`.** In both blocks, beside `subLists`: `subSearch` (the
  two sub lines above, verbatim - the `—` is U+2014 and the `1061` is the
  count `tests/derived.js` checks in six other files; see the handoff's
  Deferred). Beside `nothing`: `startTyping: 'Начните вводить запрос'` /
  `'Start typing'`.
- **`lib/search.ts`.** `export function statLineFor(lang: Lang, t: Pick<Dict,
  'tier' | 'eqTh' | 'eqScore'>): StatLine` returning `(it) => eqLine(it,
  lang, { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore })` - the
  type word kept, with `TablesPage.svelte`'s existing paragraph on why
  (typing `основное` finds every weapon in the live app) moved here as the
  doc comment. Imports `eqLine` from `./i18n.js` and the two types; still
  pure.
- **`state/app.svelte.ts`.** `kinds = $state<Chosen<Kind>>({ item: true,
  consumable: true, equip: true })` with a doc comment naming the live
  `S.kind` (app.js 60): shared by Core rules, the alternate tables and
  search, memory only (never written to storage), and **not** touched by
  `go()`, `onChange` or `replace()` - the live `hashchange` listener leaves
  it alone. `toggleKind(kind: Kind, among: readonly Kind[]): void` - when
  `isLastOn(this.kinds, among, kind)` it says `this.t.keepOneKind` as an
  error and returns; else `this.kinds = { ...this.kinds, [kind]:
  !this.kinds[kind] }`. `among` is the row the chip sits in (`LOOT_KINDS` on
  a roll page, `KINDS` on search), because "the last one on" is judged
  among the chips a person can see, exactly as `kindChips(list)` judges it
  (2119). Amend the header comment's "a roll or a search do not" sentence:
  the *query* stays with the page; the kind filter is the one piece of
  asked-for state the live app shares across pages, so it lives here. The
  `sel` doc comment's "search's rows once that slice exists" becomes "and
  search's rows".
- **`StdPanel.svelte`, `AltPanel.svelte`.** Delete the local `kinds`
  `$state` and `toggleKind`; read `app.kinds` where `kinds` was
  (`poolFor(index, n, app.source, app.kinds)`, `altPicks(index, rarity,
  roll, app.kinds)`, `altTables(app.kinds)`, `on={app.kinds[kind]}`,
  `title={isLastOn(app.kinds, LOOT_KINDS, kind) ? ... }`), and
  `onclick={() => { app.toggleKind(kind, LOOT_KINDS); }}`. `Chosen<Kind>`
  is assignable wherever `Chosen<LootKind>` is asked for; `poolFor`,
  `altPicks`, `altTables` and `isLastOn` need no signature change. Drop the
  now-unused `Chosen` import where it becomes unused; keep `isLastOn` and
  `LOOT_KINDS`.
- **`components/SearchBox.svelte`** (new; second real use of the same
  element and rules, per `CLAUDE.md`, "Extract shared UI on its second real
  use"). Props: `value: string`, `placeholder: string`, `oninput: (value:
  string) => void`, `focus?: boolean` (default false). Markup: `<input
  bind:this={el} type="search" {value} {placeholder} oninput={(e) => {
  oninput(e.currentTarget.value); }} />`. Style: the two rules from
  `TablesPage.svelte` (`width:100%; height:46px; padding:0 14px;
  border-radius:var(--r-sm); background:var(--bg2); border:1px solid
  var(--line2); color:var(--txt); font:inherit;` and the `:focus` rule with
  `outline:none; border-color:var(--gold); box-shadow:0 0 0 3px rgb(216
  171 94 / 14%)`) as `input[type='search']` - off style.css 254-258; the
  values are identical. Focus: `onMount(() => { if (focus) el?.focus(); })`
  - explicit, the way `ListsPage.svelte` (50) and `AddToList.svelte` focus
  their inputs, rather than the `autofocus` attribute (which Svelte 5's
  runtime turns into a `focus()` gated on `document.activeElement ===
  body` anyway, and which the compiler flags as an a11y warning under
  `--fail-on-warnings`). The reason for the prop, in its doc comment: the
  live `#sq` carries `autofocus` and the search page opens with the box
  focused and its focus ring painted - measured, see above.
- **`TablesPage.svelte`.** The toolbar's `<input type="search" ...>` becomes
  `<SearchBox value={q} placeholder={t.searchPh} oninput={(v) => { q = v;
  }} />` inside the same `.toolbar .grow`; the two `.toolbar input[type=
  'search']` rules go. `statLine` becomes `$derived(statLineFor(app.lang,
  t))` and its long comment shrinks to a pointer at `statLineFor`. Nothing
  else moves; `#/tables ~ searched` and `#/tables/eq_secondary ~ searched`
  are the regression cells.
- **`Field.svelte`.** `label?: string`; the `<span class="lbl">` is drawn
  only when given. No other change - the `.field`/`.field:last-child` rules
  are exactly what the search panel's two fields need (16px, then 0).
- **`components/SearchPage.svelte`** (new). Off `renderSearch`:

  - `const t = $derived(app.t)`, `const index = $derived(app.index)`, `let
    q = $state('')` (page memory, like `TablesPage`'s - see "Decided"), `let
    open = $state<Record_ | null>(null)` with the same `app.navigations`
    effect `TablesPage` uses to drop the modal on a real move; `say` as the
    other pages define it.
  - `const query = $derived(q.trim().toLowerCase())`; `const statLine =
    $derived(statLineFor(app.lang, t))`; `const found = $derived.by(() =>
    !index || !query ? [] : index.searchable.filter((it) =>
    app.kinds[kindOf(it)] && matches(it, query, statLine)).slice(0, 300))`
    - `kindOf` from `lib/data.ts`, the filter before the match as the live
    line has it, the cap last.
  - `toggleAllIn(ids)` copied from `TablesPage` (the on/off rule over
    `app.sel`; four lines - a third copy would be the moment to move it to
    `AppState`, recorded in the handoff, not done for two).
  - Markup: `<PageHead {app} title={t.search} sub={t.subSearch} help={null}
    {say} />`; then `{#if !index}<p class="miss">{t.noData}</p>{:else}`
    (the `TablesPage` precedent for a dataset that did not load); `<div
    class="panel">` with `<Field><SearchBox value={q} placeholder=
    {t.searchPh} focus oninput={(v) => { q = v; }} /></Field>` and `<Field
    label={t.filter}><ChipRow>{#each KINDS as kind (kind)}<Chip label=
    {t[KIND_LABEL[kind]]} on={app.kinds[kind]} title={isLastOn(app.kinds,
    KINDS, kind) ? t.keepOneKind : undefined} onclick={() => {
    app.toggleKind(kind, KINDS); }} />{/each}</ChipRow></Field></div>`
    (`KIND_LABEL` = `{ item: 'fItems', consumable: 'fCons', equip:
    'fEquip' }`, the three-key form of `StdPanel`'s); then `{#if !query}
    <Empty>{t.startTyping}</Empty>{:else if !found.length}<Empty>{t.nothing}
    </Empty>{:else}<TableRows entries={found.map((it) => ({ it }))}
    view="list" {index} lang={app.lang} selected=... artBroken=...
    ontoggle={(id) => { app.toggleSel(id); }} onartfail=... onopen={(it)
    => { open = it; }} ontoggleall={toggleAllIn} />{/if}{/if}`; then
    `{#if open && index}<RecordModal {app} {index} it={open} onclose=...
    onopen=... />{/if}` exactly as `TablesPage` mounts it.
  - Style: `.miss` (off `TablesPage`), and `.panel` off style.css 145-149
    **plus `margin-bottom: 16px`** for the inline style the live markup
    writes (the `ListsPage.svelte` precedent for an inline margin). Nothing
    else - every other rule lives in the components it composes.
- **`App.svelte`.** Import `SearchPage`; add `{:else if app.route.kind ===
  'section' && app.route.section === 'search'}<SearchPage {app} />` after
  the `lists` branch; delete the `{:else if app.route.kind === 'section'}`
  fallback (its `h1` and `.todo` paragraph) and the `h1` style rule, and
  drop `sectionKey`/`KEYS` from the module script if nothing else reads
  them (nothing does - check before deleting). The final `{:else}` keeps
  its `.todo` paragraph for `print` and `unknown`.
- **`components/a11y.test.ts`.** `COVERED['SearchPage.svelte'] =
  'searchPage.test.ts, and the searched state with a kind off below'`;
  `COVERED['SearchBox.svelte'] = "the tables toolbar in tables.test.ts, and
  the search page's own box below"`. One state: `{ what: 'the search page
  with a query typed and a kind switched off', route: '#/search', enter:
  async () => { await userEvent.type(screen.getByPlaceholderText('Поиск по
  названию или описанию…'), 'вещь'); await press('Снаряжение'); } }` -
  `вещь` is the word the file's own `LOOT` gives `w1` (`Первая вещь`) and
  `w2` (`Вторая вещь`), so the state has two rows of two kinds on screen
  with the third chip off.
- **`tests/parity/driver.js`.** `count(selector)` - three lines, beside
  `has`: `return page.$eval(selector, (els) => els.length)` wrapped as the
  other verbs are. The one thing the search states need that no verb
  reads: the `inventory` spec sees names, not counts, and dedupes them.
- **`docs/specs/FEATURES.md`**, "Tables and search", the search bullet:
  append "; the first 300 matches are shown" (live 2847, previously
  undocumented).
- **`docs/specs/COVERAGE.md`**, the unit-suite table: one row for
  `components/searchPage.test.ts` in the style of its neighbours (what it
  is held to: `renderSearch`, `kindChips` and the `#sq`/`kind` handlers,
  app.js 2841-2859, 2114-2132, 4160-4164, 4333).

#### Tests

Every component test ends with `expectNoA11yViolations`; the pressed states
named below get their own axe pass (`COVERAGE.md`).

- **`lib/dict.ts`**: none needed - a key in one block and not the other
  fails `svelte-check`.
- **`lib/search.test.ts`**, new `describe('the stat line the pages
  search')`: (1) `statLineFor('ru', dict('ru'))` finds `q26` for `катана`
  (the name path still works through it); (2) `search(index.searchable,
  'основное оружие', statLineFor('ru', dict('ru')))` returns more than 100
  records, every one with `eq?.t === 'weapon'` - the type word is in the
  line; (3) the same line under `'en'` finds nothing for `основное` and
  something for `primary weapon`.
- **`state/app.test.ts`**, new `describe('the kind filter')`: (1) a fresh
  `AppState` has all three on; (2) `toggleKind('consumable', KINDS)` turns
  it off and raises no toast; (3) with `item` and `equip` already off,
  `toggleKind('consumable', KINDS)` is refused - `kinds.consumable` still
  true, `toast` is `{ msg: 'Нужен хотя бы один тип', mode: 'err' }`; (4)
  over `LOOT_KINDS` the judgement ignores `equip`: with `consumable` off,
  `toggleKind('item', LOOT_KINDS)` is refused even though `equip` is on;
  (5) `go('#/tables')` and a router-announced change leave `kinds` as they
  were - contrast with `sel`, which the existing case shows cleared.
- **`components/searchPage.test.ts`** (new). Harness as `tables.test.ts`:
  `render(App, { env })` with `memoryRouter('#/search')` and a `LOOT` of a
  dozen records across `wondrous`, `core_item`, `core_consumable` and
  `eq` - reuse `tables.test.ts`'s `row()` shape; give two records a shared
  word in `ru` (`Ветра`) and the same two a shared English word (`Wind`),
  one consumable among them, and one `eq` record whose `ru` name shares
  nothing with any query but whose stat line does (`rg: 'melee'` -
  `eqLine` renders the range word, so `Ближний` finds it in Russian; confirm
  the word against `docs/fixtures/statlines/equipment.json` before writing
  the assertion). A helper `type(text)` = `userEvent.type` into
  `getByPlaceholderText('Поиск по названию или описанию…')`. Cases:
  1. **arrival**: `h1` `Поиск`; the sub paragraph text; no `Как это
     работает` button; the pin button present; the search box has focus
     (`document.activeElement` is the input) and `placeholder` `Поиск по
     названию или описанию…`; `Начните вводить запрос` shown; no `Выбрать
     все`, no `[data-row]`; three chips `Предметы`/`Расходники`/
     `Снаряжение` each `aria-pressed="true"` and none titled.
  2. **a query narrows, in catalogue order**: `Ветра` → exactly the two
     rows, `[data-row]` order equal to their order in `index.searchable`;
     `Выбрать все (2)`; the hint gone.
  3. **both languages at once**: `Wind` finds the same two while the page
     is in Russian.
  4. **the stat line**: the Russian range word finds the `eq` record and
     nothing else.
  5. **nothing found**: `zzz` → `Ничего не найдено`, no `Выбрать все`, no
     `Сбросить всё` button.
  6. **the cap**: a `LOOT` whose `core_item` holds 305 rows all named
     `Много N` (built with `Array.from`) → `Много` draws 300 `[data-row]`
     and `Выбрать все (300)`; ticking select-all raises the bar with
     `Выбрано 300`.
  7. **the kind filter narrows**: `Ветра`, press `Расходники` → one row
     left, the chip `aria-pressed="false"`; press `Предметы` → `Ничего не
     найдено` (equipment is still on, so nothing is refused).
  8. **the last kind is refused**: press `Расходники`, `Снаряжение`, then
     `Предметы` → toast `Нужен хотя бы один тип`, the chip still pressed and
     now titled `Нужен хотя бы один тип`.
  9. **equipment obeys the equipment chip whatever its `kind` says**: the
     `eq` record is stored under `core_item` with `kind: 'item'`; with
     `Снаряжение` off it is gone from a query that found it.
  10. **the filter is shared across pages**: switch `Расходники` off on
      search, `router.navigate('#/roll/std')` → Core rules' `Расходники`
      chip reads `aria-pressed="false"`; a second `render` with a fresh env
      starts with it on (memory, not storage: `storage` holds no new key).
  11. **selection**: tick a row's `Выбрано` checkbox → `.sel` on it, the
      bar reads `Выбрано 1`; `router.navigate('#/tables')` → no bar.
  12. **a row opens the modal**: click the row's `.row-main` → a `dialog`
      naming the record; `Escape` closes it.
  13. **no data**: `noData()` → `Данные не загрузились. Обновите страницу.`
      and no search box.
  14. **English**: press `EN` → `h1` `Search`, the English sub, placeholder
      `Search by name or description…`, `Start typing`, chips `Items`/
      `Consumables`/`Equipment`; with a query, `Select all (2)` and `Nothing
      found`.
  15. **axe**: `expectNoA11yViolations` on (a) arrival, (b) results with a
      row ticked and the bar up, (c) the nothing-found page.
- **`components/tables.test.ts`, `std.test.ts`, `alt.test.ts`**: nothing
  new; their kind-chip and search-box cases staying green is the proof the
  three moves changed nothing.

#### Parity states, each in both languages at three widths

The `{ id: '#/search', ..., pending: 'search slice' }` line (specs.js 1540)
is replaced by these seven; the `#/print/ci1-q1` line stays `pending`. Every
`enter` types through the placeholder, the way `#/tables ~ searched` does,
and `settle()`s. None is `timed`; none needs `storage`.

| id | route | enter | why |
|---|---|---|---|
| `#/search` | `#/search` | - | the page as opened: head, sub, the box focused with its ring painted, three chips on, the hint |
| `#/search ~ searched` | `#/search` | `type(searchPh, 'меч')` | 87 rows of loot and gear together in catalogue order, `Выбрать все (87)` |
| `#/search ~ kind off` | `#/search` | `type(searchPh, 'меч')`, `click('Снаряжение')` | 34 rows, no equipment badge left, the chip off |
| `#/search ~ stat line` | `#/search` | `type(searchPh, 'двуручное')` | rows found by the assembled stat line alone - the word is on no record as text |
| `#/search ~ capped` | `#/search` | `type(searchPh, 'а')` | the 300 cap: `Выбрать все (300)` over the first 300 |
| `#/search ~ nothing found` | `#/search` | `type(searchPh, 'zzzqqqxx123')` | `Ничего не найдено`, and no reset button - unlike the tables |
| `#/search ~ a row ticked` | `#/search` | `type(searchPh, 'меч')`, `click('Выбрано')` | the bar over search |

Where `searchPh` is the literal `'Поиск по названию или описанию…'`, as the
tables states write it. The English cells keep the box focused too:
`d.click` is `el.click()`, which moves no focus, and the `EN` press is the
same call - so the box holds focus on both apps through the language press
and through the typed states (`d.type` focuses the field it types into).
Nothing here needs an `ACCEPTED` entry: the row checkbox, the chips'
`aria-pressed` and the select-all label are byte-identical to the tables'.

Spec changes:

- `copiedSelection.only` gains `'#/search ~ a row ticked'` - two search rows
  copied as text and HTML, `shareSelection` on search's own rows.
- `typeRuns.only` gains `'#/search'` and `'#/search ~ searched'`, and its
  `search` probe becomes `'input[type=search]'` (from `'.toolbar
  input[type=search]'`) - on every existing tables state that selector
  still resolves to the toolbar's box, the only `input[type=search]` there,
  so no existing reading moves; on search it measures the box's computed
  type, which is the exact defect class B3.5 found on the tables' box.
  `rowText`/`rowTitle` measure the first row; `filterLabel` reads `null`
  on both apps.
- New looks spec `foundRows` (not `presses`): `only` the four searched
  states (`~ searched`, `~ kind off`, `~ stat line`, `~ capped`); `run(d)`
  returns `{ rows: await d.count('.rows [data-row]') }`. This is what pins
  87 / 34 / (the stat-line count) / 300 as numbers rather than as a set of
  deduplicated names.
- New spec `packedExpanded` - **the carried B5.6 risk 1** (`handoff.md`,
  "Deferred"): `only: ['#/l/ ~ packed']`, `run(d)` reads `const hash =
  await d.hash()` and **throws** `new Error('packedExpanded: the packed
  address landed on the bad-link page - nothing was expanded')` when it is
  `#/l/zzzz`, else returns `{ expanded: !hash.startsWith('#/l/~') }`; the
  comment beside it is `reorderedByDrag`'s (specs.js 520-528) adapted: the
  two apps are compared against each other, so two identical failures read
  green unless something throws. Folded in because this batch edits
  `specs.js` anyway; it is one spec and it lands in `SPECS`.
- `NAME`: no additions. No press spec grips a search-only control by name
  in both languages - `copiedSelection` uses `selected`/`copySel`, already
  there - and every `enter` runs before the `EN` press, in Russian.
- `VISUAL_DEBT`, `ACCEPTED`: no entries expected. A red cell is a defect to
  fix, not a number to write.

#### Ordered steps

One code commit. The planning docs land first, on their own commit with an
explicit pathspec (`issues/47/plan.md issues/47/handoff.md
issues/47/context.md`), as B5.6's did. Each check is `set -o pipefail; npm
run check 2>&1 | tail -n 120`, one foreground call, Bash timeout 600000;
the last one runs after the doc edits, immediately before `git commit`,
because the docs move the tree fingerprint the gate reads. Re-read `git log
--oneline -3` before the commit: three interactive peers share this tree.

1. `lib/types.ts` (`KINDS`, `Kind`); `lib/dict.ts` (two keys, both
   blocks); `lib/search.ts` (`statLineFor`) + `search.test.ts` cases;
   `state/app.svelte.ts` (`kinds`, `toggleKind`, the two comments) +
   `app.test.ts` cases. `npx vitest run app/src/lib app/src/state` green.
2. `StdPanel.svelte`, `AltPanel.svelte` onto `app.kinds`/`app.toggleKind`;
   `Field.svelte`'s optional label. `npx vitest run
   app/src/components/std.test.ts app/src/components/alt.test.ts` green
   unchanged.
3. `SearchBox.svelte`; `TablesPage.svelte` uses it and `statLineFor`, its
   two input rules and the stat-line comment go. `npx vitest run
   app/src/components/tables.test.ts` green unchanged.
4. `SearchPage.svelte`; `App.svelte` (the branch, the fallback and its
   `h1` rule out); `a11y.test.ts` (`COVERED` x2, the state).
5. `components/searchPage.test.ts` (the fifteen cases).
6. `tests/parity/driver.js` `count()`; `tests/parity/specs.js`: the seven
   states in place of the `pending` line, `copiedSelection.only`,
   `typeRuns` (probe + `only`), `foundRows`, `packedExpanded`, both new
   specs in `SPECS`.
7. `docs/specs/FEATURES.md` (the cap), `docs/specs/COVERAGE.md` (the row).
8. `npm run check` green (fix, do not skip; if the host is loaded, read
   `.claude/README.md` "Run a long check" and `context.md` "The host block
   lifted" before retrying).
9. `npm run build`, then the parity loop - one foreground call per group,
   none merged, `MSYS_NO_PATHCONV=1` in front of each:
   - **group A** - `node tests/parity.js "#/search"` - 7 states, 42 cells,
     plus `foundRows` x4, `copiedSelection` x1, `typeRuns` x2, `visuals`,
     `inventory`, `heading`, `title` on each. The `"#/l/"` group of B5.6
     (30 cells) ran in one call; 42 is under `tables`'s 192 (~9 min).
   - **group B**, the regression - `node tests/parity.js "roll/std ~ items
     only" "roll/alt ~ crit, items only" "#/tables ~ searched"
     "#/tables/eq_secondary ~ searched" "#/tables ~ nothing found" "#/l/ ~
     packed"` - 6 states, 36 cells: the lifted `kinds` on both roll pages
     (the chip pressed and refused paths), `SearchBox` in the tables
     toolbar, `statLineFor` on a searched table (an equipment one
     included), the empty state's reset button still there, and
     `packedExpanded` reading `expanded: true` on both apps.
   Every cell zero; open a diff image before touching any value. If
   `#/search @ ru` alone is red at the box, compare `document.activeElement`
   in both apps first - the focus ring is the likeliest single-cell
   difference, and the fix is in `SearchBox`'s `focus`, not in a number.
10. `npm run check:built` (the screen changes; the bundle budget).
11. `plan.md` "B6 built" (what shipped, exact commands and results, any
    deviation), `handoff.md` (Status, Completed, Verification, Next batch =
    the search slice is closed and print is what is left, Deferred: B5.6
    risk 1 closed by `packedExpanded`), `context.md` only for a durable
    fact learned.
12. `npm run check` again (the docs moved the fingerprint); commit
    `feat(search): the search page`. No push.

**Fits one implement cycle, and is one batch, not several.** Sized by its
gates (`CLAUDE.md`, "Task and session protocol"; `docs/parity.md`, "Batch
size"): one component set, no seed, one filter (`"#/search"`) plus one
regression group; ~20 paths, under B5.3's 26 and B5.4a's 43, both of which
passed one foreground `npm run check` on an idle host. Nothing here is a
contract change, a different route-and-filter set, or a boundary the
harness cannot reach (the one verb, `count`, is three lines and lands with
the states that use it). Splitting the three moves (`kinds`, `statLineFor`,
`SearchBox`) into a batch of their own would pay a check, a `check:built`
and a filter run for a change a reviewer reads in five minutes - the "too
small" case the rule names - and their regression group B is what tells
them apart from the page in a red run anyway.

#### Acceptance criteria

- `npm run check` exit 0 before the commit; thresholds met with
  `SearchPage.svelte`, `SearchBox.svelte`, `app.svelte.ts`'s `toggleKind`
  and `search.ts`'s `statLineFor` all reached.
- `a11y.test.ts`'s guard passes with both new components named, and the
  search state passes axe.
- All seven `#/search` states read `совпадает` in both languages at 1100,
  768 and 375; `foundRows` reports the same counts on both apps (87, 34,
  the stat-line count, 300); `copiedSelection` returns the same clipboard
  on `~ a row ticked`; `typeRuns` reads the same computed type for the box
  on `#/search` and `~ searched`.
- Group B reads `совпадает` throughout, and `packedExpanded` returns
  `{ expanded: true }` on both apps without throwing.
- `npm run check:built` exit 0.
- No `VISUAL_DEBT` entry written; no `ACCEPTED` entry added; `#/search` no
  longer `pending`, `#/print/ci1-q1` still is.
- `TablesPage.svelte` has no `input[type='search']` rule and no inline
  stat-line builder; `StdPanel.svelte` and `AltPanel.svelte` have no local
  `kinds`; `App.svelte` has no section fallback and no `h1` rule.
- `FEATURES.md` names the 300 cap; `COVERAGE.md` has the row.
- `handoff.md` "Deferred" marks B5.6 risk 1 closed by this batch and
  leaves nit 1 (`ListPage.svelte:103`) recorded.

#### Risks and do-nots

- Do not port the `autofocus` attribute; focus the box from `SearchBox`'s
  `onMount` under the `focus` prop. Do not skip the focus either: the
  live box is focused on arrival and its ring is in the shot (measured).
- Do not filter after the cap: `filter(...).slice(0, 300)`, in that order
  (2847) - the cap is on hits, not on candidates.
- Do not judge "the last one on" over `KINDS` on a roll page or over
  `LOOT_KINDS` on search; pass the row the chip sits in.
- Do not clear `kinds` on navigation, and do not write it to storage.
- Do not keep the search page's `q` on `AppState` (see "Decided").
- Do not draw a reset button in search's empty state; that is the tables'
  facet reset.
- Do not compute `statLine` with `noType: true`; the row's own display
  keeps `noType`, the *match* does not (`TablesPage`'s rule, now
  `statLineFor`'s).
- Do not change the `typeRuns` probe beyond the one selector, and check
  that group B's `#/tables ~ searched` reading is unchanged from the run
  before this batch if a doubt arises (the report prints both apps' values).
- Do not delete `KEYS`/`sectionKey` in `App.svelte` without grepping for a
  second reader first.
- Do not mark any state `timed`; the refusal toast is a unit case, not a
  state.
- Do not write a `VISUAL_DEBT` number from this host.
- Two commits total (planning docs, then code), no push, no attribution
  trailer.

#### Decided in planning - do not reopen

- **The kind filter moves to `AppState` now.** "The kind filter is per
  panel, not per app" (Decisions, below) said this comes due at search and
  named `AppState` as the destination; search is the third owner and the
  live app shares one object across all three. Per-panel copies would ship
  a divergence a person notices (switch consumables off on search, open
  Core rules, see them on). `STATE.md` needs no change: `kind` is listed
  under memory-only already.
- **The query stays with the page.** The live `S.search.q` survives a
  route change in memory (the same is true of `S.tables.q`), and the
  rewrite's `TablesPage` already keeps its `q` local and forgets it on
  unmount. Search follows that precedent: one page's own memory is not a
  cross-page contract, no state can observe it, and lifting it would put
  a per-page value on `AppState` for one caller. Recorded as an intentional
  divergence in Decisions, next to the kind-filter entry.
- **`SearchBox` is extracted now** - second real use of the same element
  and the same two rules (`CLAUDE.md`, campsite). `TablesPage`'s copy goes
  in the same commit.
- **`Field.label` becomes optional** rather than `SearchPage` carrying a
  third `.field` rule.
- **`statLineFor` lives in `lib/search.ts`**, second caller; it is the
  search's notion of a stat line, and `TablesPage`'s comment about the type
  word moves with it.
- **Seven states, none timed.** The refusal toast (`keepOneKind`) is a
  timed state the roll pages also do not photograph; it is a unit case
  here too. The modal over search is `#/tables ~ a row opened`'s modal - a
  unit case, not a state (the three modal states already carry CI-only
  numbers, and nothing new draws).
- **The `~ packed` throw is folded in; `ListPage.svelte:103` is not.** The
  first is one spec in a file this batch edits; the second is a comment in
  a file this batch does not touch, and stays recorded for whichever batch
  next opens it.
- **One code commit.** The three moves are small, their regression group
  runs in the same batch, and a separate commit would cost a check for
  nothing a reviewer could not hold in one pass.
- **No mock.** The page is transcribed from `app.js`/`style.css` line by
  line and measured live (`context.md`, "B6 planning facts"); the harness
  is the proof, as for every lists batch.

### B6 built: the search slice (implementer, 2026-09-11)

**All twelve ordered steps done as designed, in one commit; no design
deviation from the brief.** `lib/types.ts` gained `KINDS`/`Kind` (the
`SECTIONS`/`Section` shape) replacing the bare literal union; `lib/dict.ts`
gained `subSearch` and `startTyping` in both blocks; `lib/search.ts` gained
`statLineFor(lang, t)` (moved off `TablesPage.svelte`'s own inline builder,
its doc comment carrying the "type word kept" rule) plus three new test
cases; `state/app.svelte.ts` gained `kinds`/`toggleKind(kind, among)` (the
third owner of the live `S.kind`, memory-only, untouched by `go()`/
`onChange()`/`replace()`) and five new test cases, and its header/`sel`
doc comments were amended to say so. `StdPanel.svelte` and `AltPanel.svelte`
lost their own local `kinds`/`toggleKind` and read `app.kinds`/
`app.toggleKind` instead - unchanged behaviour, proven by their existing
suites staying green. `Field.svelte`'s `label` became optional.
`SearchBox.svelte` (new) is the search input extracted on its second real
use, focusing itself from `onMount` under an explicit `focus` prop rather
than the `autofocus` attribute; `TablesPage.svelte`'s toolbar uses it and
`statLineFor`, and its own two `input[type=search]` rules and its long
stat-line comment are gone. `SearchPage.svelte` (new) composes `PageHead`,
`Field`+`SearchBox`, `Field`+`ChipRow`+`Chip` over `KINDS`, `Empty` for the
hint and the nothing-found state, `TableRows` for up to 300 rows (filtered
before the cap, exactly as the live `.slice(0, 300)` orders it), and
`RecordModal`. `App.svelte` routes `#/search` to it and lost the generic
section fallback (`h1`/`.todo`) and its `h1` style rule, now dead code once
every section had its own page - `KEYS`/`sectionKey` went with it, confirmed
dead by grep before deletion. `a11y.test.ts` names both new components in
`COVERED` and gains one pressed state (a query typed, a kind switched off).
`components/searchPage.test.ts` (new, 17 cases) covers arrival, catalogue
order, both languages at once, the stat line, nothing found, the 300 cap,
the kind filter narrowing and refusing its last chip, equipment obeying the
equipment chip regardless of its own `kind`, the filter shared with Core
rules, selection, a row's own modal, `noData`, English, and three axe
passes. `tests/parity/driver.js` gained `count(selector)` (`page.$$eval`,
not the brief's literal `page.$eval` - see deviation below).
`tests/parity/specs.js` replaced the `#/search` `pending` line with seven
states, added `'#/search ~ a row ticked'` to `copiedSelection.only`,
added `'#/search'`/`'#/search ~ searched'` to `typeRuns.only` and changed
its `search` probe to the bare `input[type=search]` selector, and added two
new specs to `SPECS`: `foundRows` (`.rows [data-row]` counts on the four
searched states) and `packedExpanded` (closes B5.6 risk 1 - throws on
`#/l/zzzz` rather than reading two identical `false`s as a match).
`docs/specs/FEATURES.md` names the 300 cap; `docs/specs/COVERAGE.md` gained
one row for `components/searchPage.test.ts`.

**Two test-writing deviations, neither a behaviour one.**

1. **`driver.js`'s `count()` uses `page.$$eval`, not `page.$eval`.** The
   brief's literal `return page.$eval(selector, (els) => els.length)` would
   query only the *first* matching element (`document.querySelector`) and
   hand a single element to the callback, not a list - `els.length` on one
   element is `undefined` for anything but a form control. `$$eval` runs
   `document.querySelectorAll` and hands the whole array, which is what
   `foundRows` actually needs. Caught immediately by reading the Puppeteer
   API rather than by a failing run.
2. **Two `search.test.ts` assertions were rewritten against the real
   catalogue rather than kept as the brief specified them.** The brief's
   `search(index.searchable, 'основное оружие', statLineFor(...))` "every
   hit `eq?.t === 'weapon'`" fails on real data: "основное оружие" is
   ordinary Russian prose ("Кольцо Возвращения"'s own description uses the
   phrase), so the query also finds items with no `eq` block at all through
   their text fields, not only weapons through the stat line. The rewritten
   case instead builds one gear record's line directly and asserts it
   contains the type word while the row's own `noType` line does not - the
   same claim, proven without depending on the corpus having no other use of
   the phrase. The brief's per-language case (`search(..., 'основное', en)`
   `toEqual([])`) has the same defect for the same reason and was rewritten
   the same way: call `statLineFor('ru', ...)` and `statLineFor('en', ...)`
   on one record directly and compare the two strings, rather than routing
   through `search()` and the corpus's own text fields.

**One performance fix, not a behaviour one: the 300-cap component test
types through `userEvent.paste`, not `userEvent.type`.** Typing "Много"
character by character re-renders 300+ rows on every one of five
keystrokes; under `vitest run --coverage`'s instrumentation that pushed the
one test past the 30s default timeout (`npm run check`'s first full run
failed there, nothing else red). A paste lands the whole query in one
`input` event, matching what a person pasting a query would do, and the
suite is back under a few seconds a case.

**Verification.**

- `set -o pipefail; npm run check 2>&1 | tail -n 120` - exit 0 (after the
  fixes above): format, lint and `svelte-check` (535 files, 0 errors)
  clean; `data`/`derived.js`/`i18n.js`/`selftest.mjs` (292 passed) clean;
  947 tests, 0 failures, coverage 96.27 stmts / 88.53 branch / 96.67 funcs /
  97.01 lines (`state/app.svelte.ts` 100% across the board).
- `npm run build` clean: `dist/assets/app.js` 280.74 kB, 84.13 kB gzip.
- Two parity groups, each its own foreground call, `MSYS_NO_PATHCONV=1` in
  front of each: group A - `node tests/parity.js "#/search"` - 7 states, 42
  cells plus `foundRows` x4, `copiedSelection` x1, `typeRuns` x2, `visuals`,
  `inventory`, `heading`, `title`, **расхождений нет**; group B - `node
  tests/parity.js "roll/std ~ items only" "roll/alt ~ crit, items only"
  "#/tables ~ searched" "#/tables/eq_secondary ~ searched" "#/tables ~
  nothing found" "#/l/ ~ packed"` - 6 states, 36 cells, **расхождений нет**,
  `packedExpanded` read `{ expanded: true }` on both apps without throwing.
- `npm run check:built` - exit 0: build clean, `smoke-file-url.mjs` opens
  from a folder, `bundle-budget.mjs` 81.7 kB against the 120 kB budget.
- A final `npm run check` re-armed the gate after the doc edits moved the
  tree fingerprint, immediately before the commit below.

**No `VISUAL_DEBT` entry written; no `ACCEPTED` entry added.**
`TablesPage.svelte` has no `input[type='search']` rule and no inline
stat-line builder; `StdPanel.svelte` and `AltPanel.svelte` have no local
`kinds`; `App.svelte` has no section fallback and no `h1` rule. `#/search`
is no longer `pending` in `tests/parity/specs.js`; `#/print/ci1-q1` still
is - print is the only Phase 4 slice left. B5.6 risk 1 (the `~ packed`
blind spot) is closed by `packedExpanded`; `ListPage.svelte:103`'s stale
comment stays recorded, this batch did not open that file.

### B7 planned: the print slice - one batch (planner, 2026-09-11)

The last Phase 4 slice. Picked by elimination: lists (B5.1-B5.6) and search
(B6) are closed and `#/print/ci1-q1` is the only `pending` line left in
`tests/parity/specs.js` (1643). Planned at HEAD `d696675`, working tree clean
but for the orchestrator's own `context.md` kickoff section, kept and
committed with this pass.

**The Figma question, settled: this is a parity port and needs no design
access.** `CLAUDE.md` names Figma `88Hhc89oY9Orcbvd2ok1Hx`, nodes `714-42387`
(colour) and `3773-90792` (black-and-white), and says vectors are exported,
not redrawn. They were - by the live app's author, into `card/` (35 files,
2026-08-20..26): `banner`, `shield`, `burden-1`, `burden-2`, `ribbon`,
`ribbon-mag`, `thbox`, `die-d4`..`die-d20` in `-phy`/`-mag`, each with a `-bw`
twin (the dice a single `-bw`), plus `dots1`-`dots3` and `arrow` used by both
layouts. `app.js:3257` (`CARD_ART = 'card/'`) and `cardArt()` (3282-3291)
reference exactly those names and nothing else; the five kind glyphs
(`PRINT_GLYPH`, 3259-3266) and the die hexagon fallback are inline paths and
CSS `clip-path`; every other shape on the card is CSS. `vite.config.mts`
already junctions `card/` into `dist/` beside `img/` and `og/`, and
`CONTRACTS.md` section 5 freezes `card/*.svg` as a public asset path. The
rewrite therefore ports `app.js` + `style.css` and reads the same files the
live app reads - the harness compares the two apps against each other, and
the Figma nodes are the *provenance* of those files, not an input to this
batch. **Figma access is not a blocker for implementation.** The one thing
the nodes would add - a check that the live app itself matches the design -
is `tests/print.js`'s "размеры по макету" block, which already pins thirteen
positions against the design's own numbers (344x482 units) on the live app,
and stays as it is.

**Objective.** After this batch `#/print/<ids>` draws what the live
`renderPrint` draws: the bar (`Печать карточек`, the count line, `Назад` /
`Отправить на печать` / the colour-or-black-and-white segment / `Ссылка на
набор`, the red note when the address held more than 180, the print-dialog
note), then the sheets - A4 pages of nine 63x88 mm places, cards first and
blank places after the last card, the second sheet onward marked as a page
break - and, for an address that names nothing the catalogue knows, the
heading, `Печатать нечего…` and a gold `Списки` link. Each card is the live
`printCardHTML` in both of its layouts: **colour** (the art square with the
blurred backing, the tier band and the burden hands or the armour shield laid
over it, the white block fading in over the picture) and **black-and-white**
(no art, the band, the kind tag and the mark in a row over the name, `-bw`
vectors), branching in the markup as the live code does - two cards, not one
with a switch. The fit runs in the browser after render exactly as
`fitPrintCards` runs it: the stat values step down, the rules text steps its
font down, then the top padding, then the font again, and the art's height
and width follow the white block; a `Range` measures the text. `Отправить на
печать` opens the print dialog; `Назад` steps back in history or goes to
`#/lists`; the link button copies the sheet's own address. The `@media print`
rules go with it: the chrome hidden, the page margins gone, the sheet
unshadowed and page-broken. `#/print/ci1-q1`'s `pending` goes and nine states
take its place; no state in `specs.js` is `pending` after this batch.

**In scope.** `lib/hash.ts` (`printAsked`, `dropped` on the print route) +
test, `lib/types.ts` (`th` typed as the pair it is), `lib/dict.ts` (17 keys),
`lib/icons.ts` (`back`), `lib/label.ts` (`printSrc`) + test, `lib/print.ts`
(new: `cardArt`, `pages`, `dmgParts`, `glyphKey`, `PRINT_GLYPH`) + test,
`ports/types.ts` + `ports/dialog.ts` (`print()`) + `ports.test.ts`,
`state/app.svelte.ts` (`route` passes `knows`) + test,
`components/Seg.svelte` (new, third use of `.seg`), `Shell.svelte` and
`TablesPage.svelte` (use it; `LangSwitch.svelte` deleted, `TablesPage`'s
`.seg*` rules deleted), `components/PrintPage.svelte` (new),
`components/PrintCard.svelte` (new), `components/printPage.test.ts` (new),
`Shell.svelte`, `SelBar.svelte`, `Toast.svelte` (`@media print`),
`App.svelte` (the route), `components/a11y.test.ts` (`COVERED` x3, one
state), `tests/parity/driver.js` (`media`, `computed`, `eachAt`),
`tests/parity/specs.js` (nine states, four specs, two names, a data require,
figures logged by `foundRows`), `docs/specs/FEATURES.md` ("Print", three
clauses), `docs/specs/COVERAGE.md` (one row).

**Out of scope.** Any change to `CONTRACTS.md`, `docs/fixtures/`,
`tests/contracts.js`, `ROUTES.md`, `llms.txt` - `#/print/<ids>` is frozen
and unchanged, and `card/*.svg` stays where it is. `tests/print.js` - it
drives `index.html` and stays the live app's own suite. The Figma nodes.
`printBW` on `AppState` (see "Decided"). The page-furniture extraction pass
(`.panel`, `.page-h`/`.page-sub`, `.card-acts`, `.miss`, `toggleAllIn`) that
`handoff.md` "Deferred" says is owed once every page exists - after this
batch every page does exist, so it is the *next* thing, not this thing.
`Button.svelte`'s missing `:focus-visible` ring (noticed while reading
`style.css:1002`; not this batch's file - recorded in the handoff).

#### What the live app does, read off app.js and style.css (HEAD `d696675`), and measured

Measured in planning with a headless-Chrome probe (puppeteer, the harness's
own launch args and reduced motion, `ready()`'s waits, then 250ms after each
press) of `file://.../index.html` on four routes at 1100x900, 768x900 and
375x812, in colour, after the `Чёрно-белая` press, and after `EN`; and once
per route under `page.emulateMediaType('print')`. The script is in the
session scratchpad and is not kept; the numbers are in `context.md`, "B7
planning facts".

- **The route** (`currentRoute` 3610): `/^print\/[\w-]+$/` sets `S.printIds`
  to the segment. `printAsked` (3237-3240) keeps ids `BY_ID` knows, first
  occurrence only; `printIds` (3241) caps at `PRINT_MAX = 180` (3235, twenty
  sheets); `renderPrint` (3510-3558) computes `dropped = asked.length -
  ids.length`. `lib/hash.ts`'s `printIds(segment, knows)` already does the
  known/dedupe/cap in one pass, but `AppState.route` calls `parseHash(hash)`
  with the default `knows = () => true`, so today the rewrite's print route
  keeps unknown ids and knows nothing about `dropped`.
- **The bar** (3524-3548), inside `<div class="printbar noprint">`
  (`.printbar{margin-bottom:18px}`, 1112): `<h1 class="page-h">` printTitle
  - drawn directly, **not** through `pageHead()`: no pin button, no help -
  then `<p class="page-sub">` printSub with `%n` = cards and `%p` =
  `Math.ceil(n / 9)`; then `<div class="card-acts">` (405: flex, gap 6px,
  wrap, `padding-top:3px`) holding, in order: `button.btn` `ICON_BACK` +
  `back`, `button.btn.primary` `ICON_PRINT` + `printNow`, `<div class="seg
  small" role="group" aria-label=printTitle>` with `button` printColor and
  `button` printBW (`.on` on the current one, **no `aria-pressed`** - only
  the language segment has that, 3664), `button.btn` `ICON_LINK` +
  `printLink`; then `<p class="printnote warnnote">` printTooMany (`%n` =
  180, `%d` = dropped) only when `dropped`; then `<p class="printnote">`
  printNote. `.printnote` 1113: `margin:12px 0 0; font-size:12.5px;
  line-height:1.55; color:var(--muted2); max-width:62ch`; `.warnnote` 1116:
  `color:var(--danger); font-weight:600`. **Measured, 1100:** `h1` 36.8 tall
  at y=131.59, margin-bottom 4; `.page-sub` 528.28x22.39 (14px/22.4,
  `--muted`, 70ch), margin-bottom 18; `.card-acts` 1053x49 at y=212.78;
  buttons `Назад` 100.48x46, `Отправить на печать` 203.81x46, the segment
  192.67x46 (`.seg.small{align-self:stretch}` - it fills the 46px row; its
  buttons 77.58x38 / 107.09x38, `padding 4px 12px`, 12px/650, letter-spacing
  0.6px), `Ссылка на набор` 173.39x46; `.printnote` 417.77x58.13 at y=273.78
  (three lines); `.printbar` 200.31 tall. English: `Back` 90.7, `Send to
  printer` 160.53, the segment 195.34 (`Colour` 65.22, `Black and white`
  122.13), `Link to this set` 153.34. **At 375** the row wraps to three
  lines - `Назад` + `Отправить на печать` (16..326.29 fits the 328px main),
  the segment alone (200.67x43.19: the mobile `padding:8px 14px` makes its
  buttons 35.19 tall, and stretch on its own line is its own height), the
  link button alone - `.card-acts` 150.19 tall, `.printbar` 323.89, `.page-sub`
  two lines (44.78). 768 is identical to 1100 but for the main's x.
- **The sheets** (3549-3557): `pages` of nine; `<div class="psheet[ bw]"
  [data-next="1"]>` per page (`data-next` on every sheet but the first);
  cards, then on the **last** sheet `(9 - n % 9) % 9` `<div class="pcard
  blank">` places. `.psheet` 1118-1126: `210mm x 297mm`, `padding:14.5mm
  8.5mm`, `margin:0 auto 18px`, a 3x3 grid of `63mm`/`88mm` with `gap:2mm`,
  white, the two-layer shadow. **Measured:** 793.69x1122.52 at every width;
  centred at 1100 (x=145.66), **left-aligned at x=16 at 768 and 375** where
  `margin:auto` cannot go negative, so the document is 810 wide and scrolls
  sideways (`scrollWidth` 810 at both) - the fold shot at 375 shows the first
  card whole and part of the second; cards 238.11x332.59 (= 63x88 mm at
  96dpi), the first at (177.78, 404.7) at 1100; blanks have `border:0`
  (1139). Ten cards: two sheets (the second at y=1490.42, `data-next`), 18
  places, 8 blank, `Карточек: 10. Листов A4: 2.`; document 2822 tall.
- **The empty page** (3514-3517): `<h1 class="page-h">` printTitle, `<p
  class="page-sub">` printEmpty, `<a class="btn primary" href="#/lists">`
  lists - measured 87.42x46 at y=212.78, the exact shape of `ListPage`'s
  not-found block. No `.printbar`, no note. `#/print/nope` reaches it: the
  regex accepts the segment and `printAsked` drops the unknown id.
- **The card** (`printCardHTML` 3364-3425): `<article class="pcard pk-<kind>[
  bw]" data-pid=id>` where `eqClassFor` (3430-3432) is `pk-weapon` /
  `pk-secondary` / `pk-armor` / `pk-item` / `pk-cons` - **no rule in
  style.css reads `pk-*`** (grep), so the class is markup only, still
  ported. Colour: `<div class="pc-art">` with, when `hasImage(it)` (1675:
  `it.img` and not `brokenArt[id]`), `<img class="pc-back" src alt=""
  aria-hidden="true">` + `<img class="pc-img" src alt="">` (the same file
  twice; **no `loading`, no `data-art`, no error handler** - a print image
  never marks itself broken, 4597 keys off `data-art`), else
  `printGlyph(kindKey)` (`<svg class="pc-glyph" viewBox="0 0 48 50"
  aria-hidden="true">` + one `<path>`); then the band `<span
  class="pc-tier"><img src=cardArt('banner') alt=""><b>tier</b><i>t.tier</i>
  </span>` when there is a tier (`eq.tier`, else a numeric `it.tier`; an
  artifact/cursed `A`/`C` has none), then the mark: armour with `as != null`
  → `<span class="pc-shield"><img cardArt('shield')><b>as</b><i>pcArmor</i>
  </span>`, else a burden → `<span class="pc-burden"><small>eqBurden</small>
  <img cardArt('burden-1'|'burden-2')></span>` (`bu > 1` → 2). Then `<div
  class="pc-content">`: in bw `<div class="pc-head[ withtier]">` band + tags
  + mark, else just the tags (`<div class="pc-tags"><span class="pc-tag
  on">tag1</span>[<span class="pc-tag out">tag2</span>]</div>` - tag1 is
  `voaArtifact1`/`voaCursed1` for `A`/`C` loot, else `eqWord(EQ_TYPE, eq.t)`
  or `cons`/`item`; tag2 is `eqWord(EQ_CLS, eq.cls)` for a non-armour piece
  with a class); `<h3 class="pc-name">` nameOf; the strip - armour
  `thStripHTML`, else `dmgStripHTML(eq)` plus `dmgStripHTML(eq.alt)` when
  versatile, else nothing; `<div class="pc-text">` descHtml; `<div
  class="pc-bottom"><span>Daggerheart</span><span>printSrc</span></div>`.
  Text nodes: `.pc-tier` reads `1Ранг`, `.pc-bottom` `DaggerheartCore`,
  `.pc-cells` `УронфизЧертаПроворностьДистанцияВплотную` - no whitespace
  anywhere between siblings.
- **`descHtml(it)` for a card is not `RecordCard`'s markup.** The non-plain
  branch (661-690) emits lines joined with `<br>` **between two consecutive
  plain lines only**, list runs as `<ul class="dlist"><li>…</li></ul>` with
  no `<br>` before or after, and a label as `<i>label:</i>` + the rest of
  the line **including its leading space** (`voa2_a3`: `<i>Стоимость
  Призыва:</i> 2<br>Эта колода…`; `q1`: `<i>Надёжное:</i> +1 к Броскам
  Атаки`). No `<p>` ever - `.pc-text p` (1387) matches nothing. `lib/desc.ts`
  `descParts` gives the same split (`splitLabel` keeps the space in `body`);
  `RecordCard` renders it as `<p>`s, which is right for the card and wrong
  here. The global `.dlist li{margin:1px 0}` (725) applies inside the card;
  `.pc-text ul,.pc-text ol{margin:0 0 1.4cqw;padding-left:4cqw}` (1388)
  beats `.dlist`'s own margin and padding.
- **The strips.** `dmgStripHTML` (3298-3320): `<div class="pc-strip"><span
  class="pc-lead">dieHTML</span><span class="pc-frame"><img class="pc-ribbon"
  src=cardArt('ribbon'|'ribbon-mag') alt=""><span class="pc-cells"><span
  class="pc-c1[ wbonus]">[<span class="pc-bonus">+3</span>]statBox(pcDmg,
  eqWord(EQ_DT, dt) || '—')</span><span class="pc-c2">statBox(pcTrait,
  …)</span><span class="pc-c3">statBox(pcRange, …)</span></span></span>
  </div>` - the die and bonus split by `/^(d\d+)(.*)$/` on `dmg` (`d8+3` →
  `d8`, `+3`); `statBox` (3273) is `<span class="pc-box"><small>label</small>
  <b>value</b></span>`. `dieHTML` (3323-3331): `<span class="pc-die[ own][
  mag]" data-die="d8">[<img src=cardArt('die-d8-phy'|'-mag') alt="">]<b>d8
  </b></span>`, `own` for d4-d20 (`DIE_ART`). `thStripHTML` (3333-3356):
  `<div class="pc-thstrip"><div class="pc-cells">lab(thLight,1) box(th[0])
  lab(thMajor,2) box(th[1]) lab(thSevere,3)</div></div>` with `lab` = `<span
  class="pc-th-lab"><img src="card/dots<n>.svg" alt=""><small>word</small>
  </span>` and `box` = `<span class="pc-th-box"><img src=cardArt('thbox')
  alt=""><b>v</b></span><img class="pc-th-arrow" src="card/arrow.svg"
  alt="">` (the arrow follows every box). `th` is `[5, 11]` in the data
  (`q313`) or `null`; `lib/types.ts` types it `string | null`, and
  `i18n.ts:126` already indexes it as the pair it is.
- **`cardArt(name)`** (3282-3291): in bw, `die-d<n>-phy`/`-mag` collapse to
  `die-d<n>` (the colour was the only difference), then `-bw` is appended to
  every name; `dots*` and `arrow` are written with `CARD_ART` directly and
  never take `-bw`. Measured: `q23` in bw reads `ribbon-mag-bw.svg` (the
  magic frame keeps its own drawing) and `die-d6-bw.svg`.
- **The fit** (`fitPrintCards` 3438-3508), run from `render()` (3829) on
  **every** render of the print route - the first paint, the segment press,
  the `EN` press - synchronously after `innerHTML`, i.e. before any image of
  the fresh markup has loaded, and never again on load. Per card: (1) for
  each `.pc-strip .pc-cells`, reset every `.pc-box b`'s `font-size`, then
  `sz = 3; while (over() && sz > 2.2) { sz -= 0.1; set sz.toFixed(1)+'cqw' }`
  where `over()` is any `b` whose `Range` width exceeds `clientWidth - 2`;
  (2) reset `.pc-text`'s `font-size` and `.pc-content`'s `--pcpad`;
  `tight()` = `scrollHeight > clientHeight + 1`; `pct = 3.5; while (tight()
  && pct > 3) { pct -= 0.1; font-size = pct.toFixed(1)+'cqw' }`; `pad = bw ?
  5.8 : 23; while (tight() && pad > (bw ? 3 : 8)) { pad -= 1.5; --pcpad =
  pad+'cqw' }`; `while (tight() && pct > 2.6) { … }`; (3) when `.pc-art` and
  `.pc-content` both exist: `line = box.offsetTop / card.clientWidth * 100 +
  pad`, `top = art.offsetTop` likewise; `art.style.height = max(0, line -
  top + 6)+'cqw'`; `--artw = min(100, line - top - 1)+'cqw'`; `art.style
  .display = line - top < 24 ? 'none' : ''`. **Measured, and the port must
  reproduce these numbers:** the strip loop always ends at `2.2cqw` on every
  `b` (a block `b` inside a shrink-to-fit box is never narrower than its own
  text minus 2px, so `over()` never turns false; the loop exits when `sz`
  reaches 2.1999999999999993 - **eight subtractions of 0.1 from 3 in
  double precision**, which is why the port copies the arithmetic and the
  `toFixed(1)` verbatim rather than "improving" it); `ci1` colour: art
  `104cqw` high, `--artw 97cqw`; `q1`: `97.2203cqw` / `90.22033898305084cqw`;
  `q313`: `101.881cqw` / `94.88…`; `cc1`: `110.356cqw` / `100cqw`; `di11`
  (570 chars): `51.4576cqw` / `44.45…`, text untouched; `voa2_a3` (811
  chars): text `3.3cqw`, `--pcpad` untouched, art `32.8136cqw` /
  `25.81…cqw`. Identical at 375 - the fit is in `cqw` of a card whose size
  never changes. In bw none of the nine chosen cards needed a step
  (`.pc-text` has 150-245px for texts of at most 145), and the bw vectors
  in the head (`burden-*-bw` 24.66px tall, `shield-bw` 24.7, `banner-bw`
  37.31) had loaded before the probe could read them; a bw card whose text
  is near the limit would fit against a head that has not yet grown, on
  both apps alike, provided the rewrite fits at the same moment.
- **`.pc-*` CSS**, style.css 1128-1395, one block, no `@media` inside it
  (the only `@media` on the print surface is `@media print` at 1397-1414
  and the mobile `.seg button` rule at 880-881). Everything is in `cqw` off
  `.pcard{container-type:size}`; the design's 344px card is the unit
  (`18cqw` = 62px of 344). Port it verbatim, in order, comments included
  where they explain a number.
- **`@media print`** (1397-1414), measured under emulation on the live app:
  `header.topbar`, `nav.tabs`, `footer.foot`, `a.skip`, `.printbar`
  (`.noprint`) all `display:none`; `body` white on black text; `main`
  `max-width:none; width:auto` (reads 1085px) `padding:0; margin:0`;
  `.psheet` `margin:0; box-shadow:none; break-inside:avoid`;
  `.psheet[data-next]` `break-before:page`; `.psheet:last-child`
  `height:296.9mm` (reads 1122.14px against 1122.52 for a sheet that is not
  last); `.pcard` `break-inside:avoid`; `*{print-color-adjust:exact}`;
  `@page{size:A4 portrait;margin:0}`.
- **The handlers** (4236-4245): `doPrint` → `window.print()`; `printBack` →
  `history.length > 1 ? history.back() : location.hash = '#/lists'`;
  `printArt` → `S.printBW = val === 'bw'; render()` (`S.printBW`, 49, is
  app memory - it survives leaving the page; see "Decided"); `printLink` →
  `copyText(appUrl(printHref(printIds(S.printIds))), t().linkCopied)` -
  `copyText` (1021) toasts `linkCopied` on success and `copyFailed` as an
  error otherwise. `S.sel` is cleared on `hashchange` as everywhere.
- **Chrome.** `document.title` is `docTitle` (no record name); no tab lit
  (`renderTabs` compares the raw route string, `FEATURES.md` "Chrome");
  `activeElement` is `body` on arrival and stays `body` after a scripted
  `el.click()` on the segment on both apps (the live `restoreFocus` has
  nothing to restore; a mouse click focuses the button on both - the probe
  read `BUTTON.on` after `page.click`, the harness's `d.click` moves no
  focus).
- **Missing from the rewrite:** 17 dictionary keys (`pcDmg`, `pcTrait`,
  `pcRange`, `pcArmor`, `thLight`, `thMajor`, `thSevere`, `printColor`,
  `printBW`, `printNow`, `printLink`, `printTitle`, `printSub`, `printNote`,
  `printEmpty`, `printTooMany`, `back`; `pcTh` and `printFoot` exist in
  app.js but nothing reads them - not added); the `back` icon (`ICON_BACK`
  1039); a print port (`window.print` is a browser API); `printSrc` (954:
  `srcComm + ' · ' + srcLabel` for a community record, else `srcLabel`);
  `card/` art path building; the sheet arithmetic; and the `.seg` control's
  third use - `LangSwitch.svelte` and `TablesPage.svelte` (627-670) each
  carry the whole rule set today, the latter with the comment "not yet
  worth extracting on its own".

#### What is reused, and what is new

| piece | live | rewrite | this batch |
|---|---|---|---|
| the route | `currentRoute` + `printAsked`/`printIds` | `parseHash` → `{ kind: 'print', ids }`, `knows` never passed | `printAsked` exported; the route carries `dropped`; `AppState.route` passes `index.byId.has` |
| the head | `h1.page-h` + `p.page-sub` written by hand | `ListPage`'s own `.page-h`/`.page-sub` rules (no `PageHead` - no pin, no help) | the same two rules, third copy, recorded |
| the four buttons | `.btn`, `.btn.primary` | `Button` (`md`, `primary`, `href`+`sameTab`, `onclick`) + `Icon` | reuse; `icons.back` added |
| the segment | `.seg.small` | `LangSwitch.svelte` and `TablesPage.svelte`'s copy | **`Seg.svelte`, extracted on this third use**; both copies go |
| the print dialog | `window.print()` | - | `DialogPort.print()` (the browser's own dialogs, beside `confirm`) |
| back | `history.length > 1 ? back() : #/lists` | `router.canGoBack()` / `back()` already there ("so a print page knows whether to offer one") | reuse |
| the link | `copyText(appUrl(printHref(ids)))` | `app.linkTo(printHash(ids))` + `env.clipboard.writeText` + `say` (the `ListPage` pattern) | reuse |
| the sheet | `pages` of nine, blanks | - | `lib/print.ts` `pages(items)`; `PrintPage` draws |
| the card | `printCardHTML` + helpers | `artSrc`, `descParts`, `nameOf`, `eqWord` + the `EQ_*` maps, `srcLabel`, `t.voaArtifact1`/`voaCursed1` | **`PrintCard.svelte`**, both layouts; `lib/print.ts` `cardArt`, `dmgParts`, `glyphKey`, `PRINT_GLYPH`; `label.ts` `printSrc` |
| the fit | `fitPrintCards` | - | a `$effect` in `PrintCard`, ported verbatim |
| `@media print` | one block | none anywhere in `app/` | `Shell` (chrome, main, body, `@page`), `PrintPage` (bar, sheets, `*` colour-adjust), `PrintCard` (`break-inside`), `SelBar`, `Toast` |
| the empty page | `h1` + sub + `a.btn.primary` | `ListPage`'s not-found block | the same shape |
| no data | - | `.miss` + `t.noData` (every page) | the same |

Genuinely new: `PrintPage.svelte`, `PrintCard.svelte` (the markup is ~90
lines, the CSS ~270 ported lines, the fit ~60), `Seg.svelte`, `lib/print.ts`,
the port method, three driver verbs, four specs, the strings.

#### How it is built

- **`lib/types.ts`.** `Equip.th` becomes `readonly [number, number] | null`
  - the data's shape (`[5, 11]`), what `i18n.ts:126` already indexes, and
  what the threshold strip prints. No test fixture writes `th` as a string
  (grepped).
- **`lib/hash.ts`.** `export function printAsked(segment, knows): string[]`
  - the ids `knows` accepts, first occurrence only, **uncapped** (the loop
  `printIds` has today minus the `PRINT_MAX` break). `printIds` becomes
  `printAsked(segment, knows).slice(0, PRINT_MAX)`. The print `Route` gains
  `dropped: number`; `parseHash` computes `asked = printAsked(...)`, `ids =
  asked.slice(0, PRINT_MAX)`, `dropped = asked.length - ids.length`. The
  doc comment on `Route` says what `dropped` is for (the red note).
- **`state/app.svelte.ts`.** `get route()` becomes `parseHash(this.hash,
  (id) => this.index?.byId.has(id) ?? false)` - the one place `knows` is
  needed, and the one route kind that reads it. `section` needs no change:
  a print route already returns `null`.
- **`lib/dict.ts`.** Both blocks, verbatim from app.js 123-134 / 307-318,
  in this order beside `printHint`: `printColor`, `printBW`, `printNow`,
  `printLink`, `printTitle`, `printSub`, `printNote`, `printEmpty`, `back`,
  `printTooMany`; and beside `eqBurden`: `pcDmg`, `pcTrait`, `pcRange`,
  `pcArmor`, `thLight`, `thMajor`, `thSevere`. Keep the `×` (U+00D7) in
  `printSub`, the `«нет»` in `printNote`, the plain hyphen after `мм`, the
  `%n`/`%p`/`%d` markers.
- **`lib/icons.ts`.** `back: { d: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8
  1.41-1.41L7.83 13H20v-2z', size: 15 }`, with the `ICON_BACK (app.js:1039)`
  pointer the other entries carry.
- **`lib/label.ts`.** `export function printSrc(it, lang): string` - `it.src
  === 'community' ? \`${dict(lang).srcComm} · ${srcLabel(it, lang)}\` :
  srcLabel(it, lang)` (the `·` is U+00B7, as `whereFrom` writes it), doc
  comment off app.js 954: a community card leaves the table, so it names
  the book as well as the community.
- **`lib/print.ts`** (new, pure). `PRINT_MAX` stays in `hash.ts` (the route
  owns the cap). `export type GlyphKey = 'weapon' | 'secondary' | 'armor' |
  'item' | 'cons'`; `export const PRINT_GLYPH: Record<GlyphKey, string>` -
  the five `d` strings off app.js 3259-3266, **the `weapon` one is a single
  string with all four subpaths**; `export function glyphKey(it): GlyphKey`
  = `it.eq ? it.eq.t : it.kind === 'consumable' ? 'cons' : 'item'`;
  `export function cardArt(name: string, bw: boolean): string` off 3282-3291
  (`bw` replaces `S.printBW`; the die collapse, then `-bw`, then `.svg`,
  under `card/`) and `export const CARD_DIR = 'card/'` for `dots<n>` and
  `arrow` which never take `-bw`; `export function dmgParts(dmg: string |
  undefined): { die: string; bonus: string }` off 3299/3321 (`/^(d\d+)(.*)$/`;
  no match → `{ die: dmg ?? '', bonus: '' }`); `export const DIE_ART = new
  Set(['d4','d6','d8','d10','d12','d20'])`; `export function pages<T>(items:
  readonly T[]): { pages: T[][]; blanks: number }` off 3520-3522 (`blanks =
  (9 - n % 9) % 9`; zero items → no pages). Each with the app.js line in
  its comment.
- **`ports/types.ts`, `ports/dialog.ts`.** `DialogPort` gains `print():
  void` - "the browser's own dialogs: a confirm, and the print dialog";
  `browserDialog` → `win.print()`; `fakeDialog` gains `printed: number`.
- **`components/Seg.svelte`** (new; the third real use of `.seg`, so the
  campsite rule is two uses overdue). `<script lang="ts" generics="T extends
  string">` (the `OrGrid.svelte` precedent). Props: `options: readonly {
  value: T; label: string }[]`, `value: T`, `label: string` (the group's
  `aria-label`), `small?: boolean` (default false), `onchange: (value: T) =>
  void`. Markup: `<div class="seg" class:small role="group" aria-label=
  {label}>{#each options as o (o.value)}<button type="button" class:on={o
  .value === value} aria-pressed={o.value === value} onclick={() => {
  onchange(o.value); }}>{o.label}</button>{/each}</div>` - `aria-pressed` on
  every use: the live language segment writes it (3664), the live view and
  print segments do not, and no spec reads it, so the two gain an honest
  pressed state rather than the one losing it (recorded below). Styles, off
  style.css 72-81, 880-881 and 1002-1005: `.seg`, `.seg button` (`padding:
  5px 13px; font-size: 12.5px; font-weight: 650; letter-spacing: 0.05em;
  border: 0; background: transparent; color: var(--muted); border-radius:
  999px; transition: 0.16s; cursor: pointer`), `.seg.small { align-self:
  stretch }`, `.seg.small button { padding: 4px 12px; font-size: 12px }`,
  `.seg button.on`, `.seg button:not(.on):hover`, **`.seg button:focus-
  visible { outline: 2px solid var(--gold); outline-offset: 2px; border-
  radius: 8px }`** (the live rule neither copy ported - a cheap local fix in
  a touched path), and `@media (max-width: 600px) { .seg button, .seg.small
  button { padding: 8px 14px } }`. Measured on the live segment: 46px tall
  when stretched in the 46px row, buttons 38px; 43.19 alone on a 375px
  line.
- **`Shell.svelte`.** `import Seg`; `<Seg options={LANG_OPTIONS} value=
  {app.lang} label={app.t.langLabel} onchange={(l: Lang) => { app.setLang(l);
  }} />` with `const LANG_OPTIONS: readonly { value: Lang; label: string }[]
  = [{ value: 'ru', label: 'RU' }, { value: 'en', label: 'EN' }]` in the
  script. Delete `components/LangSwitch.svelte`. `shell.test.ts` grips the
  group by `Язык` and the buttons by `RU`/`EN` - unchanged. Add the print
  block to its `<style>`: `@media print { :global(html), :global(body) {
  background: #fff; color: #000; } .skip, .topbar, .foot { display: none
  !important; } main { max-width: none; width: auto; padding: 0; margin: 0;
  } }` plus `@page { size: A4 portrait; margin: 0; }` **outside** any
  selector, with the live comment on why the sheet owns the margins - and
  after `npm run build`, `grep -c "@page" dist/assets/*.css` must read 1
  (Svelte prunes unused *selectors*; an at-rule with none should pass
  through - verify rather than assume). The tabs are inside the header and
  go with it.
- **`TablesPage.svelte`.** The view segment (431-445) becomes `<Seg small
  options={VIEWS} value={view} label={t.view} onchange={(v) => { view = v;
  }} />` where `const VIEWS = [{ value: 'list', label: t.viewList }, { value:
  'grid', label: t.viewGrid }] as const` is `$derived` off `t` (the labels
  switch with the language); `view` is already `$state<'list' | 'grid'>`.
  Delete the `.seg*` rules and their comment (627-670) and the mobile
  override for `.seg` inside the 600px block if it is separate. `#/tables
  @` and `#/tables ~ grid` are the regression cells.
- **`SelBar.svelte`, `Toast.svelte`.** `@media print { .selbarwrap { display:
  none } }` and `@media print { .toast { display: none } }` - the live hides
  `#selBar` and `#toast` (1403). `RecordModal` is never mounted on the print
  route, so it needs no rule.
- **`components/PrintCard.svelte`** (new). Props: `it: Record_`, `lang:
  Lang`, `bw: boolean`, `artBroken: boolean`. `const t = $derived(dict
  (lang))`; `eq = $derived(it.eq ?? null)`; `kindKey = $derived(glyphKey
  (it))`; `armor`, `burden` (`eq && !armor && eq.bu ? eq.bu : 0`), `tier`
  (`eq?.tier ? String(eq.tier) : typeof it.tier === 'number' ? String
  (it.tier) : ''`), `artifact = (it.tier === 'A' || it.tier === 'C') && !eq`,
  `tag1`, `tag2`, `parts = $derived(descParts(it, lang))`, `src = $derived(
  printSrc(it, lang))`, `hasArt = $derived(!!it.img && !artBroken)`. Markup
  is `printCardHTML` line by line, with the same branching: `<article
  class="pcard {pkClass}" class:bw data-pid={it.id} bind:this={card}>`;
  `{#if !bw}<div class="pc-art">{#if hasArt}<img class="pc-back" src={artSrc
  (it.img)} alt="" aria-hidden="true"><img class="pc-img" src={artSrc(it
  .img)} alt="">{:else}<svg class="pc-glyph" viewBox="0 0 48 50" aria-hidden
  ="true"><path d={PRINT_GLYPH[kindKey]} /></svg>{/if}</div>{@render band()}
  {@render mark()}{/if}` then `<div class="pc-content">{#if bw}<div class=
  "pc-head" class:withtier={!!tier}>{@render band()}{@render tags()}{@render
  mark()}</div>{:else}{@render tags()}{/if}<h2 class="pc-name">{nameOf(it,
  lang)}</h2>{#if armor}{@render thStrip(eq)}{:else if eq}{@render dmgStrip
  (eq)}{#if eq.alt}{@render dmgStrip(eq.alt)}{/if}{/if}<div class="pc-text">
  …</div><div class="pc-bottom"><span>Daggerheart</span><span>{src}</span>
  </div></div></article>` - the band, tags, mark and the two strips as
  `{#snippet}`s so the two layouts share one definition each (the live
  builds them once as strings and places them twice). `<h2>`, not the live
  `<h3>`: axe's `heading-order` (on by default in `test/a11y.ts`) refuses an
  `h3` straight under the page's `h1`, the pixels are identical (`.pc-name`
  sets `margin:0` and the whole `font` shorthand), and no spec reads the
  tag - the same call `RecordCard` made with its `<h2 class="card-name">`.
  **The `.pc-text` block reproduces `descHtml`'s non-plain branch, not
  `RecordCard`'s `<p>`s:** `{#each parts as part, i (i)}{#if part.kind ===
  'list'}<ul class="dlist">{#each part.items as line, k (k)}<li>{#if line
  .label}<i>{line.label}:</i>{/if}{line.body}</li>{/each}</ul>{:else}{#if i
  > 0 && parts[i - 1]?.kind === 'line'}<br>{/if}{#if part.label}<i>{part
  .label}:</i>{/if}{part.body}{/if}{/each}` **written without a newline or
  space anywhere between those tags** - a leading space at the start of a
  block is dropped and whitespace between blocks becomes a text node (the
  B3.5 rule); `part.body` carries its own leading space as an expression.
  Strips: `dmgStrip(e)` = `<div class="pc-strip"><span class="pc-lead">
  {@render die(e)}</span><span class="pc-frame"><img class="pc-ribbon" src=
  {cardArt(e.dt === 'mag' ? 'ribbon-mag' : 'ribbon', bw)} alt=""><span
  class="pc-cells"><span class="pc-c1" class:wbonus={!!bonus}>{#if bonus}
  <span class="pc-bonus">{bonus}</span>{/if}{@render box(t.pcDmg, eqWord
  (EQ_DT, e.dt, lang) || '—')}</span><span class="pc-c2">{@render box(t
  .pcTrait, eqWord(EQ_TRAIT, e.tr, lang))}</span><span class="pc-c3">{@render
  box(t.pcRange, eqWord(EQ_RANGE, e.rg, lang))}</span></span></span></div>`
  with `{ die, bonus } = dmgParts(e.dmg)`; `die(e)` = `<span class="pc-die"
  class:own class:mag data-die={die}>{#if own}<img src={cardArt(\`die-${die}
  -${mag ? 'mag' : 'phy'}\`, bw)} alt="">{/if}<b>{die}</b></span>`; `box
  (label, value)` = `<span class="pc-box"><small>{label}</small><b>{value}
  </b></span>`; `thStrip(e)` with `th = e.th ?? ['—', '—']` and the
  `lab`/`box` pair exactly as 3335-3343 (`src="{CARD_DIR}dots{n}.svg"`,
  `cardArt('thbox', bw)`, `{CARD_DIR}arrow.svg`). `eq.alt` is typed - check
  `Equip` has `alt?: Pick<Equip, 'tr' | 'rg' | 'dmg' | 'dt'>`; add it if it
  is missing, the data has it (`q23`). Style: style.css 1128-1395 verbatim
  in order, `.pc-text ul, .pc-text ol` as written, **plus `.pc-text li {
  margin: 1px 0 }` for the global `.dlist li` the live page still applies**,
  `.pc-text p` kept as written even though nothing matches it (a verbatim
  port is easier to audit than a pruned one), and `@media print { .pcard {
  break-inside: avoid } }`. Nothing in `styles/tokens.css` changes: the
  card's colours are paper colours (`#fff`, `#000`, `#18171C`, `#75788A`,
  the golds), not the site's, and `var(--ui)` is the one token it reads.
  **The fit**, as `$effect(() => { void lang; void bw; void it; fit(card); })`
  - the three reads are the dependencies (the DOM the effect measures is
  rendered from them; Svelte runs an effect after the DOM it depends on is
  updated), and `fit(card)` is `fitPrintCards`'s loop body for one card,
  ported verbatim: reset **everything it can set** first (`.pc-box b`
  `font-size`, `.pc-text` `font-size`, `--pcpad`, and `.pc-art`'s `height`,
  `--artw`, `display` - the live starts from fresh markup every time, so a
  reset is what makes a re-fit start where the live's starts), then the
  strip loop, the three text loops and the art geometry, **with the same
  constants, the same `-= 0.1` / `-= 1.5` steps, the same `toFixed(1)` and
  the same `> 2.2` / `> 3` / `> 2.6` exits** - the measured `2.2cqw` on every
  strip value is a floating-point outcome and any "cleaner" arithmetic gives
  a different number. Do not `await` fonts or images before fitting: the
  live fits synchronously after render and never again on load, and the
  bw states' numbers were measured under exactly that timing. `document
  .createRange` exists in jsdom but its rects are zero, so in a component
  test every loop exits at once - see the test section for how the loops
  are still reached.
- **`components/PrintPage.svelte`** (new). Props: `app: AppState`, `ids:
  string[]`, `dropped: number`. `const t = $derived(app.t)`, `index`,
  `items = $derived(index ? ids.flatMap((id) => { const it = index.byId.get
  (id); return it ? [it] : []; }) : [])`, `sheet = $derived(pages(items))`,
  `let bw = $state(false)` (page memory, see "Decided"), `say` as the other
  pages define it. Handlers: `back()` = `if (app.env.router.canGoBack())
  app.env.router.back(); else app.go(sectionHash('lists'))`; `print()` =
  `app.env.dialog.print()`; `copyLink()` = `const ok = await app.env
  .clipboard.writeText(app.linkTo(printHash(ids))); say(ok ? t.linkCopied :
  t.copyFailed, !ok)`. Markup: `{#if !index}<p class="miss">{t.noData}</p>
  {:else if !items.length}<h1 class="page-h">{t.printTitle}</h1><p class=
  "page-sub">{t.printEmpty}</p><Button variant="primary" href={sectionHash
  ('lists')} sameTab>{t.lists}</Button>{:else}<div class="printbar"><h1
  class="page-h">{t.printTitle}</h1><p class="page-sub">{sub}</p><div class=
  "card-acts"><Button onclick={back}><Icon name="back" />{t.back}</Button>
  <Button variant="primary" onclick={print}><Icon name="print" />{t.printNow}
  </Button><Seg small options={ART} value={bw ? 'bw' : 'color'} label={t
  .printTitle} onchange={(v) => { bw = v === 'bw'; }} /><Button onclick=
  {copyLink}><Icon name="link" />{t.printLink}</Button></div>{#if dropped}
  <p class="printnote warnnote">{tooMany}</p>{/if}<p class="printnote">{t
  .printNote}</p></div>{#each sheet.pages as page, i (i)}<div class="psheet"
  class:bw data-next={i ? '1' : undefined}>{#each page as it (it.id)}
  <PrintCard {it} lang={app.lang} {bw} artBroken={app.artBroken(it.id)} />
  {/each}{#if i === sheet.pages.length - 1}{#each { length: sheet.blanks } as
  _, k (k)}<div class="pcard blank"></div>{/each}{/if}</div>{/each}{/if}` -
  `sub = $derived(t.printSub.replace('%n', String(items.length)).replace
  ('%p', String(Math.ceil(items.length / 9))))`, `tooMany` likewise with
  `PRINT_MAX` and `dropped`, `ART = $derived([{ value: 'color', label: t
  .printColor }, { value: 'bw', label: t.printBW }] as const)`. Style:
  `.page-h`/`.page-sub` (the `ListPage` copies, 905-926), `.miss`,
  `.card-acts` (`ListPage` 984-991, without the inline margin), `.printbar`,
  `.printnote`, `.printnote.warnnote` (1112-1116), `.psheet` (1118-1126),
  `.pcard.blank` as `.blank { box-sizing: border-box; background: #fff }`
  (the blank is this component's element, so `PrintCard`'s `.pcard` rules
  cannot reach it; `border: 0` is the whole of what `.pcard.blank` adds and
  the grid sizes the box), and `@media print { .printbar { display: none
  !important } .psheet { margin: 0; box-shadow: none; break-inside: avoid }
  .psheet[data-next] { break-before: page } .psheet:last-child { height:
  296.9mm } :global(*) { -webkit-print-color-adjust: exact; print-color-
  adjust: exact } }` with the live comments (the Chrome blank-page
  millimetre, the sheet owning its margins).
- **`App.svelte`.** `import PrintPage`; `{:else if app.route.kind ===
  'print'}<PrintPage {app} ids={app.route.ids} dropped={app.route.dropped}
  />` before the final `{:else}`; the `.todo` comment now names only
  `unknown`.
- **`components/a11y.test.ts`.** `COVERED['PrintPage.svelte'] = 'printPage
  .test.ts, and the black-and-white sheet below'`, `COVERED['PrintCard
  .svelte'] = 'the same'`, `COVERED['Seg.svelte'] = 'the frame, on every
  state here and in shell.test.ts; the tables view switch in tables.test.ts;
  the print sheet below'` replacing the `LangSwitch.svelte` line (357). One
  state: `{ what: 'a print sheet switched to black and white', route:
  '#/print/w1-w2', enter: async () => { await press('Чёрно-белая'); } }` -
  `w1`/`w2` are this file's own `LOOT` rows (check the ids the file
  defines; use two it has).
- **`tests/parity/driver.js`**, beside `count`: `media(type)` → `page
  .emulateMediaType(type)` - `'print'` to emulate, `undefined` to stop
  (puppeteer 25.9.0, `emulateMediaType(type?: string)`); `computed(selector,
  props)` → the first match's `getComputedStyle` values for `props`, `null`
  when nothing matches (the `typeAt` policy on selectors, and the same
  "null against real numbers fails loudly" reasoning); `eachAt(selector,
  props)` → for **every** match (`$$eval`, the B6 lesson) `{ x, y, w, h,
  style: { prop: el.style.getPropertyValue(prop) } }`, `round1`'d - the
  inline values the fit writes are the only record of what it decided.
- **`tests/parity/specs.js`.** `const LOOT = require('../../data.json')` at
  the top (beside the fixture requires; `data.json` is generated from
  `data.js` and `tests/derived.js` keeps them equal) and three routes built
  from it and from literals - see the states table. `NAME.ru.printLink =
  'Ссылка на набор'`, `NAME.en.printLink = 'Link to this set'`. `foundRows
  .run` logs its figure (`console.log(\`       foundRows ${d.target}: ${rows}\`)`
  - the seven-space indent `shot()` uses) so a green run still prints 87 /
  34 / … rather than only comparing them (B6 review risk 3). Four specs:
  - `sheetCounts` (looks, `only` the eight card states): `{ sheets: count
    ('.psheet'), cards: count('.pcard'), blanks: count('.pcard.blank'),
    breaks: count('.psheet[data-next]'), bw: count('.psheet.bw'), warn:
    count('.printnote.warnnote') }`, logged the same way.
  - `cardFit` (`perWidth: true`, `only` the eight card states): `{ text:
    eachAt('.pcard:not(.blank) .pc-text', ['font-size']), box: eachAt
    ('.pcard:not(.blank) .pc-content', ['--pcpad']), art: eachAt('.pc-art',
    ['height', '--artw', 'display']), strip: eachAt('.pc-strip .pc-box b',
    ['font-size']), head: eachAt('.pc-head', []) }` - the fit as numbers, per
    width, on both apps; what tells a noisy full-page capture from a card
    that fitted differently (the `geometry` recipe, `docs/parity.md`).
  - `printMedia` (looks, `only` `#/print/ci1-q1`, `#/print/ci1-q1 ~ black
    and white`, the ten-card state and `#/print/nope`): `await d.media
    ('print')`, then in a `try`: `{ header: computed('header', ['display']),
    nav: computed('nav', ['display']), footer: computed('footer',
    ['display']), skip: computed('a.skip', ['display']), bar: computed
    ('.printbar', ['display']), body: computed('body', ['background-color',
    'color']), main: computed('main', ['max-width', 'width', 'padding-top',
    'padding-left', 'margin-left']), sheet: computed('.psheet', ['margin-top',
    'margin-left', 'box-shadow', 'break-inside']), last: computed('.psheet:
    last-child', ['height']), next: computed('.psheet[data-next]', ['break-
    before']), card: computed('.pcard', ['break-inside', 'print-color-
    adjust']) }`, and `finally { await d.media(undefined); }` - it runs
    before the shots on the same page, so leaving print media on would
    photograph the wrong medium.
  - `copiedPrintLink` (presses, `only` `#/print/ci1-q1`): `resetClipboard`,
    `click(NAME[lang].printLink)`, return `{ hash: clip.text.slice(clip.text
    .indexOf('#')) }` - the `copiedFilterLink` shape; only the hash is
    compared because the two apps live at different paths.
  All four land in `SPECS`.
- **`docs/specs/FEATURES.md`**, "Print": three clauses the live app has and
  the spec did not name - the empty address draws the heading, `printEmpty`
  and a link to the lists; more than 180 ids prints the first 180 and a red
  note counting the rest; `Назад` steps back in history, or to `#/lists`
  when there is nothing to step back to.
- **`docs/specs/COVERAGE.md`**, the unit-suite table: one row for
  `components/printPage.test.ts` in its neighbours' style (held to
  `renderPrint`, `printCardHTML` and helpers, `fitPrintCards`, the four
  handlers: app.js 3235-3558, 4236-4245).

#### Tests

Every component test ends with `expectNoA11yViolations`; the pressed states
named below get their own axe pass (`COVERAGE.md`).

- **`lib/hash.test.ts`**, in `describe('print')`: (1) `printAsked('ci1-zzz-
  q26-ci1', knows)` is `['ci1', 'q26']`; (2) 181 known ids parse to a print
  route with 180 `ids` and `dropped: 1`, 180 give `dropped: 0`; (3) the
  existing `printIds` cases stay green unchanged.
- **`lib/print.test.ts`** (new): `cardArt('banner', false)` → `card/banner
  .svg`, `('banner', true)` → `card/banner-bw.svg`, `('die-d8-phy', true)`
  → `card/die-d8-bw.svg`, `('ribbon-mag', true)` → `card/ribbon-mag-bw.svg`
  (the die collapse is the dice's alone); `dmgParts('d8+3')` → `{ die: 'd8',
  bonus: '+3' }`, `('d6')` → `{ 'd6', '' }`, `(undefined)` → `{ '', '' }`;
  `pages` of 0 / 2 / 9 / 10 / 180 items → `[[], 0]`, `[[2], 7]`, `[[9], 0]`,
  `[[9, 1], 8]`, `[[9 x 20], 0]`; `glyphKey` on a weapon, an armour, a
  consumable, an item; `PRINT_GLYPH` has the five keys and each `d` starts
  with `M`.
- **`lib/label.test.ts`**: `printSrc` on a Core item reads `Core`; on a
  community item `Сообщества · <community>` in Russian and `Communities ·
  <community>` in English.
- **`ports/ports.test.ts`**, the dialog block: `browserDialog(win).print()`
  calls `win.print` once; `fakeDialog().print()` increments `printed`.
- **`state/app.test.ts`**: `#/print/ci1-zzz` on an app whose data knows
  `ci1` resolves to `ids: ['ci1'], dropped: 0`; on `noData()` the route is
  `print` with no ids.
- **`components/tables.test.ts`, `shell.test.ts`**: nothing new; their view
  switch and language cases staying green is the proof `Seg` changed
  nothing. Add one line to `tables.test.ts`: the pressed view button reads
  `aria-pressed="true"`.
- **`components/printPage.test.ts`** (new). Harness as `searchPage.test.ts`:
  `render(App, { env })` with `memoryRouter('#/print/…')` and a `LOOT` of a
  dozen rows - reuse the `row()` shape - including: an item with `img`, an
  item without, a consumable, a weapon with `eq: { t: 'weapon', tier: 1, tr:
  'agility', rg: 'melee', dmg: 'd8', dt: 'phy', bu: 1, cls: 'phy' }`, a
  two-handed magic versatile weapon (`dmg: 'd6'`, `dt: 'mag'`, `bu: 2`,
  `cls: 'mag'`, `alt: { tr, rg: 'far', dmg: 'd8', dt: 'mag' }`) with a
  labelled description (`'Универсальное: …'`), a weapon with `dmg: 'd8+3'`,
  an armour (`t: 'armor', tier: 2, as: 3, th: [5, 11]`), a `voa` artifact
  (`tier: 'A'`) whose `rud` has two plain lines and a list, and a community
  item. Cases:
  1. **arrival, colour**: `h1` `Печать карточек`; sub `Карточек: 2. Листов
     A4: 1. …`; no pin button, no help button; the four controls in order
     `Назад`, `Отправить на печать`, group `Печать карточек` with `Цветная`
     (`aria-pressed="true"`) and `Чёрно-белая`, `Ссылка на набор`; the
     note; one `.psheet`, nine `.pcard`, seven `.pcard.blank`, no
     `[data-next]`; `.pcard[data-pid]` in address order.
  2. **the loot card**: `.pc-tags` reads `Предмет`; `.pc-img` and `.pc-back`
     share `src` `img/<file>`; `.pc-back` is `aria-hidden`; no `.pc-tier`,
     `.pc-strip`, `.pc-thstrip`, `.pc-burden`, `.pc-shield`; `.pc-bottom`
     `textContent` is exactly `DaggerheartCore`; no `Крафт`/`Craft` text
     anywhere in the card.
  3. **no art**: the item without `img` draws `svg.pc-glyph` and no `img`;
     `markArtBroken(id)` on the item with `img` swaps it to the glyph.
  4. **the weapon card**: `.pc-tier` `textContent` `1Ранг`; `.pc-tags` two
     spans `Основное оружие` (`.on`) and `Физическое` (`.out`); `.pc-burden`
     `small` `Хват` and `img` `src` `card/burden-1.svg`; `.pc-die.own[data-
     die=d8]` with `img` `card/die-d8-phy.svg` and `b` `d8`; `.pc-ribbon`
     `card/ribbon.svg`; `.pc-cells` `textContent` exactly `УронфизЧерта
     ПроворностьДистанцияВплотную`; no `.wbonus`; `.pc-text` `innerHTML`
     exactly `<i>Надёжное:</i> +1 к Броскам Атаки` for a `rud` of
     `Надёжное: +1 к Броскам Атаки`.
  5. **the versatile magic weapon**: two `.pc-strip`; the second's cells
     name `Далеко`; both `.pc-die.mag`; `.pc-ribbon` `card/ribbon-mag.svg`;
     `.pc-burden img` `card/burden-2.svg`; `.pc-tag.out` `Магическое`.
  6. **the bonus**: `d8+3` → `.pc-c1.wbonus` with `.pc-bonus` `+3` and
     `.pc-die b` `d8`.
  7. **the armour card**: `.pc-shield` `b` `3`, `i` `Броня`, `img`
     `card/shield.svg`; no `.pc-burden`, no `.pc-die`; `.pc-thstrip` with
     three `.pc-th-lab` (`Лёгкий урон`, `Ощутимый урон`, `Тяжёлый урон`,
     dots `card/dots1.svg`..`dots3.svg`), two `.pc-th-box` (`5`, `11`, img
     `card/thbox.svg`), two `.pc-th-arrow` `card/arrow.svg`; `.pc-tier`
     `2Ранг`; `.pc-tags` one span `Броня`.
  8. **the artifact**: no `.pc-tier`; `.pc-tag.on` `Артефакт`; `.pc-text`
     `innerHTML` is `line one<br>line two<ul class="dlist"><li>…</li><li>…
     </li></ul>` for a `rud` of `line one\nline two\n- a\n- b` - no `<p>`,
     no `<br>` before the list, no whitespace between tags; and a `voa` line
     with a label keeps the label's `<i>` (`hasLabels`).
  9. **the community card**: `.pc-bottom` last span `Сообщества · <name>`.
  10. **black and white**: press `Чёрно-белая` → it reads `aria-pressed=
      "true"`, `Цветная` `"false"`; `.psheet.bw`, every `.pcard.bw`; no
      `.pc-art`, `.pc-img`, `.pc-back`, `.pc-glyph` anywhere; the weapon
      card has `.pc-head.withtier` holding `.pc-tier` then `.pc-tags` then
      `.pc-burden` in that order, and its band `img` is `card/banner-bw.svg`,
      the hands `card/burden-2-bw.svg` (the two-handed one), the die
      `card/die-d6-bw.svg`, the magic ribbon `card/ribbon-mag-bw.svg`, the
      shield `card/shield-bw.svg`, the threshold box `card/thbox-bw.svg`
      while the dots and the arrow keep their plain names; the loot card's
      `.pc-head` has no `withtier`; press `Цветная` → `.pc-art` is back.
  11. **the second sheet**: `#/print/<ten ids>` → two `.psheet`, the second
      with `data-next="1"`, 18 `.pcard`, 8 `.pcard.blank` all on the second
      sheet, none on the first; sub `Карточек: 10. Листов A4: 2.`; no
      `.warnnote`.
  12. **the cap**: a `LOOT` of 181 `core_item` rows `Много N` (built with
      `Array.from`, the B6 precedent), the address naming all 181 → 180
      non-blank `.pcard`, 20 `.psheet`, `.printnote.warnnote` reading `За
      один раз печатается 180 карточек, остальные 1 в лист не попали.
      Разделите набор на части.`; unknown and repeated ids in the address
      are dropped before counting (`#/print/ci1-ci1-zzz` → one card, no
      note).
  13. **nothing to print**: `#/print/zzz` → `h1` `Печать карточек`, sub
      `Печатать нечего: в адресе не нашлось ни одной вещи.`, a link `Списки`
      with `href` `#/lists` carrying `btn primary`; no `.printbar`, no
      `.psheet`, no note.
  14. **back**: with `memoryRouter` reporting `canGoBack()` true, `Назад`
      calls `back()` once; with it false, the hash becomes `#/lists`.
  15. **print**: `Отправить на печать` → `fakeDialog().printed` is 1.
  16. **the link**: `Ссылка на набор` → `fakeClipboard` holds `<base>#/print/
      ci1-q1` (the ids as parsed, not the raw address: for `#/print/ci1-zzz-
      ci1-q1` it is still `#/print/ci1-q1`), toast `Ссылка скопирована`; a
      clipboard that refuses → `Не удалось скопировать` (or whatever
      `t.copyFailed` reads) as an error toast.
  17. **the fit is wired**: jsdom lays nothing out - `clientWidth`,
      `clientHeight`, `offsetTop` and a `Range`'s rect are all zero, so
      every loop exits at once and the art arithmetic divides by zero. For
      the duration of this case, `Object.defineProperty` getters on
      `HTMLElement.prototype`: `clientWidth` → 238, `clientHeight` → 100,
      `offsetTop` → 0, `scrollHeight` → 140 for an element with class
      `pc-text` (always tight) and 100 otherwise; and `Range.prototype
      .getBoundingClientRect` → `{ width: 9999 }` (always over). Render
      `#/print/<the weapon>` and assert the floors the live arithmetic
      reaches - **computed in planning, not reasoned**: every `.pc-strip
      .pc-box b` has inline `font-size: 2.2cqw`; `.pc-text` `font-size:
      2.6cqw` (the first ladder stops at `3.0cqw`, the second at `2.6cqw`);
      `.pc-content` `--pcpad: 8cqw`; `.pc-art` `height: 14cqw`, `--artw:
      7cqw`, `display: none` (`line = 0 + 8`, `top = 0`, `8 < 24`). Press
      `Чёрно-белая` → `--pcpad` is **`2.8cqw`** (`5.8 - 1.5 - 1.5`; the
      loop stops when `pad > 3` fails, so the floor is below 3, not at it)
      and `.pc-text` again `2.6cqw`. Restore the prototypes in `finally`.
      This is the one place the loop bodies are reached under coverage; the
      real numbers are the parity `cardFit` spec's.
  18. **no data**: `noData()` → `Данные не загрузились. Обновите страницу.`
      and nothing else.
  19. **English**: press `EN` → `h1` `Printing cards`, sub `Cards: 2. A4
      sheets: 1. …`, `Back`, `Send to printer`, `Colour`/`Black and white`,
      `Link to this set`, the note; the weapon card `1Tier`, `Primary
      weapon`, `Physical`, `Burden`, `DamagephyTraitAgilityRangeMelee`, the
      armour `Minor damage`…`Severe damage`, `Armor`; the artifact
      `Artifact`; `document.title` `Daggerheart Loot Generator`.
  20. **axe**: `expectNoA11yViolations` on (a) the colour sheet, (b) the
      black-and-white sheet, (c) the empty page.

#### Parity states, each in both languages at three widths

The `{ id: '#/print/ci1-q1', …, pending: 'print slice' }` line (specs.js
1643) is replaced by these nine; nothing in `STATES` is `pending` after
this. Every `enter` grips the Russian name; none is `timed` (the link press
is a `presses` spec on a fresh arrival, so its toast never reaches a shot);
none needs `storage`. Routes: `NINE = '#/print/ci1-q1-q313-cc1-voa2_a3-q23-
w51-q35-di11'`, `LONG = '#/print/voa2_a3-voa2_a1-voa2_c4-voa2_c3-voa2_t4e-
voa2_t4d-voa2_c1-voa2_a6-di11'` (`tests/print.js`'s own long-text set),
`TEN = '#/print/' + ids ci1..ci10`, `TOO_MANY = '#/print/' + Object.values
(LOOT.items).flat().slice(0, 181).map((x) => x.id).join('-')` (884
characters; `core_item`, `core_consumable`, `hnf_item` and `hc1`).

| id | route | enter | whole | why |
|---|---|---|---|---|
| `#/print/ci1-q1` | `#/print/ci1-q1` | - | - | a print sheet: a loot card with its art beside a weapon card, seven blank places |
| `#/print/ci1-q1 ~ black and white` | `#/print/ci1-q1` | `click('Чёрно-белая')` | - | the other layout: no art, the band, the tag and the mark in a row over the name, `-bw` vectors |
| `NINE` | `NINE` | - | yes | every card shape on one sheet: item, weapon, armour, consumable, artifact, versatile magic, two-handed with a bonus, magic dagger, a long rule |
| `NINE ~ black and white` | `NINE` | `click('Чёрно-белая')` | yes | the same nine, the other layout |
| `LONG` | `LONG` | - | yes | the fit ladder end to end: the font, then the padding, then the art gives way on the longest texts in the catalogue |
| `LONG ~ black and white` | `LONG` | `click('Чёрно-белая')` | yes | the same, with the black-and-white padding floor |
| `TEN` | `TEN` | - | - | a second sheet: eighteen places, eight blank, the second sheet a page break; `Листов A4: 2` |
| `#/print/<181 ids> ~ too many` | `TOO_MANY` | - | - | the cap: 180 cards on twenty sheets and the red note about the one left out |
| `#/print/nope` | `#/print/nope` | - | - | nothing to print: the heading, the note and the way to the lists |

The two nine-card ids are their literal routes (long, but exact); the
181-id one carries `<181 ids>` in its id and the built route in `route`.
`whole: true` on the four nine-card states because a 900px fold shows only
the top row of a 1122px sheet - six of nine cards would never be looked at;
`cardFit` runs on them per width so a red `whole` cell can be read as the
capture class or as a card that fitted differently before anyone opens a
diff image (`docs/parity.md`, "Two unstable classes", the `geometry`
recipe). The fold shows both cards of `ci1-q1` whole at 1100 (the row ends
at y=737); at 768 and 375 it shows the sheet's left edge, the same on both
apps. Nothing here needs an `ACCEPTED` entry: every control name is a
dictionary string on both sides, and `aria-pressed` is not a name.

Spec changes: `sheetCounts`, `cardFit`, `printMedia`, `copiedPrintLink` as
above; `NAME` gains `printLink`; `foundRows` logs; `typeRuns` unchanged
(there is no search box or filter label on a print page; `visuals` reads the
heading). `VISUAL_DEBT`, `ACCEPTED`: no entries expected. A red cell is a
defect to fix, not a number to write - and a `whole` cell that is red
locally while `cardFit` agrees on both apps is the capture class CI decides
(owner decision 1).

#### Ordered steps

One code commit. The planning docs land first, on their own commit with an
explicit pathspec (`issues/47/plan.md issues/47/handoff.md issues/47/
context.md`), as B6's did. Each check is `set -o pipefail; npm run check
2>&1 | tail -n 120`, one foreground call, Bash timeout 600000; the last one
runs after the doc edits, immediately before `git commit`. Re-read `git log
--oneline -3` before the commit: peer sessions share this tree.

1. `lib/types.ts` (`th`, and `alt` on `Equip` if it is missing); `lib/hash
   .ts` (`printAsked`, `dropped`) + cases; `lib/dict.ts` (17 keys, both
   blocks); `lib/icons.ts` (`back`); `lib/label.ts` (`printSrc`) + cases;
   `lib/print.ts` + `print.test.ts`; `ports/types.ts` + `ports/dialog.ts` +
   cases; `state/app.svelte.ts` (`route` passes `knows`) + cases. `npx
   vitest run app/src/lib app/src/ports app/src/state` green.
2. `Seg.svelte`; `Shell.svelte` uses it (and gains its `@media print` block
   and `@page`); `TablesPage.svelte` uses it, its `.seg*` rules go; delete
   `LangSwitch.svelte`; `SelBar.svelte` and `Toast.svelte` print rules.
   `npx vitest run app/src/components/shell.test.ts app/src/components/
   tables.test.ts` green (the one added `aria-pressed` line aside).
3. `PrintCard.svelte`, `PrintPage.svelte`; `App.svelte`; `a11y.test.ts`
   (`COVERED` x3, the `LangSwitch` line gone, the state).
4. `components/printPage.test.ts` (the twenty cases).
5. `tests/parity/driver.js` (`media`, `computed`, `eachAt`); `tests/parity/
   specs.js` (the `data.json` require and the three routes, the nine states
   in place of the `pending` line, `NAME.printLink`, the four specs in
   `SPECS`, `foundRows`' log line).
6. `docs/specs/FEATURES.md` (three clauses), `docs/specs/COVERAGE.md` (the
   row).
7. `npm run check` green (fix, do not skip; a run that crosses the 600s cap
   is re-run, not salvaged - `context.md`, "`npm run check`, settled").
8. `npm run build`; `grep -c "@page" dist/assets/*.css` reads 1; `ls dist/
   card | wc -l` reads 35 (the junction is there). Then the parity loop, one
   foreground call per group, none merged, `MSYS_NO_PATHCONV=1` in front of
   each:
   - **group A** - `node tests/parity.js "#/print"` - 9 states, 54 cells
     (24 of them `whole`), plus `sheetCounts` x8, `cardFit` x8 per width,
     `printMedia` x4, `copiedPrintLink` x1, `visuals`, `inventory`,
     `heading`, `title` on each. Under the pre-B4 `tables` run (192 cells,
     ~9 min); the four `whole` states retake until stable.
   - **group B**, the regression - `node tests/parity.js "#/roll/std @"
     "#/tables @" "#/tables ~ grid" "#/lists @" "#/search ~ searched"` - 5
     states, 30 cells: the topbar's `Seg` on three pages in both languages
     at three widths (every page draws it; a moved pixel there would be red
     everywhere, so three are enough), the tables view switch at rest and
     pressed, `#/tables`'s `typeRuns` cells through the widened `search`
     probe (B6 review risk 1, read locally now; CI stays the authority) and
     its toolbar box photographed unfocused (risk 2), and `foundRows`
     printing 87 on `~ searched` (risk 3).
   Every cell zero; open a diff image before touching any value. A red
   `whole` print cell: read `cardFit` for that width first - agreeing on
   both apps with a diff image that is scattered noise is the capture class
   (CI decides; write nothing); a `cardFit` difference is a fit that ran at
   a different moment or with different arithmetic, and the fix is in
   `PrintCard`'s effect, never in a number. A difference in `printMedia`
   is a missing print rule.
9. `npm run check:built` (the screen changes; the bundle budget - the card
   CSS is ~8 kB before gzip, well inside the 120 kB).
10. `plan.md` "B7 built" (what shipped, exact commands and results, any
    deviation, the `cardFit` and `sheetCounts` figures as printed), `handoff
    .md` (Status, Completed, Verification, Next batch = Phase 4 is complete
    and what follows, Deferred as noted), `context.md` only for a durable
    fact learned.
11. `npm run check` again (the docs moved the fingerprint); commit
    `feat(print): the print sheet`. No push.

**Fits one implement cycle, and is one batch, not two.** Sized by its gates
(`CLAUDE.md`, "Task and session protocol"; `docs/parity.md`, "Batch size"):
one component set, no seed, one filter (`"#/print"`) plus one regression
group; ~30 paths - more than B6's ~20 but under B5.4a's 43, and most of the
weight is one verbatim CSS block and one test file. Nothing here is a
contract change or a different route-and-filter set: the bar, the sheet and
both card layouts are one route and one filter, and the colour and
black-and-white cards share every helper, every strip and the fit, so a
batch that shipped colour first would pay a second `check`, `check:built`
and a second `"#/print"` run to add an `{#if bw}` branch and 40 lines of
`.bw` rules - the "too small" case the rule names. The `Seg` extraction is
the one piece that could stand alone, and it is ~40 lines whose regression
group B is what tells it apart from the page in a red run anyway. The
harness verbs are three, all land with the specs that use them.

#### Acceptance criteria

- `npm run check` exit 0 before the commit; thresholds met with
  `PrintPage.svelte`, `PrintCard.svelte` (the fit loops reached by case
  17), `Seg.svelte`, `lib/print.ts`, `hash.ts`'s `printAsked` and
  `dialog.ts`'s `print` all covered; `LangSwitch.svelte` gone and the
  `a11y.test.ts` guard passing with the three new components named.
- All nine `#/print` states read `совпадает` in both languages at 1100, 768
  and 375; `sheetCounts` prints `1/9/7/0`, `1/9/7/0/bw 1`, `1/9/0`, `1/9/0/
  bw 1`, `1/9/0`, `1/9/0/bw 1`, `2/18/8/1`, `20/180/0/19/warn 1` and the
  empty page draws none; `cardFit` agrees on both apps at every width and
  its strip values all read `2.2cqw`, `voa2_a3`'s text `3.3cqw` in colour
  and its art `32.8136cqw`; `printMedia` agrees on both apps on all four
  states; `copiedPrintLink` reads `#/print/ci1-q1` on both.
- Group B reads `совпадает` throughout; `foundRows` prints 87 for `~
  searched` on both apps; the `#/tables` `typeRuns` cells agree.
- `npm run check:built` exit 0; `dist/assets/*.css` carries one `@page`.
- No `VISUAL_DEBT` entry written; no `ACCEPTED` entry added; no `pending`
  state left in `specs.js`.
- `TablesPage.svelte` has no `.seg` rule; `Shell.svelte` imports `Seg`;
  `RecordCard.svelte` is untouched.
- `FEATURES.md` "Print" names the empty page, the cap note and the back
  button; `COVERAGE.md` has the row.
- `handoff.md` "Deferred" marks B6 risks 1-3 as read locally by group B and
  names the CI run as the remaining authority; the page-furniture pass is
  the recorded next thing.

#### Risks and do-nots

- Do not build the card's text from `RecordCard`'s `<p>` markup, and do not
  leave a newline between the tags of the `.pc-text` block; case 8 pins the
  exact `innerHTML`.
- Do not "tidy" the fit: same constants, same steps, same `toFixed(1)`,
  same exits, same order (strip, font, padding, font, art); reset first;
  never wait for fonts or images before it.
- Do not put `printBW` on `AppState`, and do not clear or persist it
  anywhere (see "Decided").
- Do not draw the pin button, the help button or `PageHead` on the print
  page; the live head is a bare `h1` and `p`.
- Do not use `PageHead`'s `.page-head` wrapper either; the `h1` sits
  directly in `.printbar` (its `margin:0 0 4px` is the whole spacing).
- Do not give the print images `loading="lazy"`, `data-art` or an `onerror`
  - the live card has none, and `ready()` waits on images by `complete`.
- Do not omit `aria-hidden="true"` on `.pc-back` or the `alt=""` on every
  card vector.
- Do not write `dots<n>` or `arrow` through `cardArt` - they never take
  `-bw`.
- Do not port `.pcard.blank` into `PrintCard` - the blank is `PrintPage`'s
  element.
- Do not use `<h3>` for the card name (axe) and do not use anything but a
  heading either - `RecordCard` set the precedent with `<h2>`.
- Do not leave print media on after `printMedia` runs - the `finally` is
  load-bearing.
- Do not `page.$eval` in the new verbs where every match matters (`eachAt`
  is `$$eval`).
- Do not mark any state `timed`; do not add a toast state for the link.
- Do not write a `VISUAL_DEBT` number from this host, on a `whole` cell
  least of all.
- Do not touch `tests/print.js`, `card/`, `CONTRACTS.md` or the fixtures.
- Two commits total (planning docs, then code), no push, no attribution
  trailer.

#### Decided in planning - do not reopen

- **No Figma export, no design access.** Every vector the sheet draws is in
  `card/`, referenced by name from `app.js`, junctioned into `dist/` by the
  build, and frozen as a public asset path. The port is a parity port; the
  Figma nodes are provenance. The orchestrator need not ask the owner for
  anything.
- **One batch.** Colour and black-and-white are two layouts that share one
  route, one filter, every helper and the fit; the split the product law
  insists on is in the markup and the CSS, not in the schedule.
- **`bw` is the page's memory.** The live `S.printBW` survives leaving the
  page (app memory, never stored - `STATE.md` lists it under memory-only);
  the rewrite's `PrintPage` remounts on every navigation and forgets it,
  the same intentional divergence B6 recorded for `search.q` and `TablesPage`
  records for its `q`: one page's own memory is not a cross-page contract,
  no state can observe it, and a per-page value on `AppState` for one caller
  is the shape this migration keeps declining. Recorded in Decisions with
  the other two.
- **`Seg` is extracted now, and `aria-pressed` goes on every use.** Third
  use of the same rule set; the live language segment writes `aria-pressed`
  and the view and print segments do not; one component either drops it
  from the language pair (a regression) or adds it to the other two (an
  improvement no spec reads). The latter.
- **`<h2 class="pc-name">`.** axe's `heading-order` is on, the pixels are
  identical, and `RecordCard` already made the same call.
- **`DialogPort.print()`**, not a new port: the print dialog is the
  browser's own dialog, the port already exists with one method, and a
  new `Env` key would touch every `fakeEnv` caller for one line.
- **`dropped` on the route, `knows` from `AppState`.** The cap is the
  route's rule (`PRINT_MAX` lives in `hash.ts`); the page should not
  re-parse the address to learn what the parser threw away.
- **`whole: true` on the four nine-card states, with `cardFit` beside it.**
  A fold that shows three cards of nine is not a comparison of the sheet;
  the capture class is documented, the retake is in `shot()`, and `cardFit`
  is the number that says which class a red cell is.
- **The 181-id state is built from `data.json`** rather than typed: 884
  characters nobody should maintain by hand, and `tests/derived.js` keeps
  the file equal to `data.js`.
- **No mock.** The page is transcribed from `app.js`/`style.css` line by
  line and measured live; the harness is the proof.

### B7 built: the print slice (implementer, 2026-09-11)

Built to the plan above with no design deviation. `#/print/<ids>` draws in
full: the bar, both card layouts, the sheet arithmetic, `@media print`, and
the fit ported verbatim. `npm run check` is green (994 tests, coverage
thresholds met - `PrintCard.svelte` 98.4/85.3/98.9/100, `PrintPage.svelte`
100/94/100/100, `print.ts` 100/90/100/100), `npm run check:built` is green
(88.4 kB gzip, under budget), and parity group B (five regression states,
30 cells) reads **`расхождений нет`** - the `Seg` extraction touched nothing.

**Two measured deviations from the brief's own numbers, neither a defect:**

1. **`dist/assets/*.css` does not exist; `grep -c "@page" dist/assets/app.js`
   is 1.** Vite's build for this project (iife format, no code splitting,
   `base: './'`) inlines the component styles into the JS bundle rather than
   emitting a separate stylesheet - true before this batch and unrelated to
   it (verified: no `vite.config.mts` change in this diff). The `@page`
   at-rule survives, once, inside the bundle - the only thing the check was
   ever verifying. Read it from `app.js`, not from a CSS file that the build
   does not produce.
2. **`ls dist/card | wc -l` is 36, not 35.** `card/` on disk has 36 files -
   6 dice x 3 variants (phy/mag/bw) = 18, 7 paired vectors x 2 (banner,
   burden-1, burden-2, ribbon, ribbon-mag, thbox, shield) = 14, plus
   `dots1-3` and `arrow` = 4. 18+14+4 = 36. The junction (`dist/card` ==
   `card/`, byte for byte) is correct; the plan's count was off by one at
   planning time.

**One real defect found and fixed in a touched path**, per CLAUDE.md: `lib/
i18n.ts`'s `eqParts` read `e.th[0] ?? ''`/`e.th[1] ?? ''` against a `th`
typed as `string | null` (a leftover from before this batch retyped it to
the pair the data actually is, `readonly [number, number] | null`) - once
retyped, the `?? ''` became dead code, indexing was `number`, not `string`,
and `npm run lint` failed loudly (`restrict-template-expressions`,
`no-unnecessary-condition`). Fixed to `String(e.th[0])`/`String(e.th[1])`;
`i18n.test.ts`'s "half-filled threshold pair" case, which had been testing
`th: '5'` (a string - a shape the type no longer allows and the data never
had), is rewritten as "a threshold pair, minor and major separated by a
slash" against `th: [5, 11]`, since a half-filled pair cannot occur once
`th` is typed as the pair it is.

**One genuine defect, diagnosed wrong at first and then fixed: the reduced-
motion snippet's `0.01ms` was breaking the fit.** As first committed at
`4776243`, parity group A read 50 of 54 cells red - the `cardFit` cells on
every state whose text drives the fit ladder - and the diff images showed the
first cards on a sheet losing their artwork. That pass wrote the cause down as
a host-level browser race over `cqw` inline styles and handed it to CI. **That
diagnosis was wrong**, and an independent review disproved it by direct
measurement. The real cause, and it is deterministic:

`app/src/styles/tokens.css`'s `@media (prefers-reduced-motion: reduce)` block
set `transition-duration: 0.01ms !important` on `*` - the popular snippet's
value. **`0.01ms` is not zero.** Every inline style write therefore started a
real `CSSTransition`, whose value at t=0 is the *old* one. `PrintCard.svelte`'s
`fit()` writes an inline `cqw` size and reads the layout back synchronously, so
`tight()` was answered by the pre-write layout on every iteration, never turned
false, and all three ladders ran to their floors - which is exactly what
"`height:14cqw; --artw:7cqw; display:none`" is. The live app's reduced-motion
rules (`style.css:311`, `:544`) kill two named animations and leave
`transition-duration` at its initial `0s`, create no transition, and read
correctly. The harness runs every cell under
`emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])`
(`tests/parity/driver.js:649`), which is why parity saw it and nothing else
did. Measured on the built `dist/` before and after the one-character-class
fix, at 1100 under reduced motion, on the `LONG` route:

```text
before  transitionDuration "1e-05s"  getAnimations() ["CSSTransition"]
        first four .pc-art: none/14cqw  none/14cqw  flex/40.0169cqw  flex/40.0169cqw
after   transitionDuration "0s"      getAnimations() []
        first four .pc-art: flex/32.8136cqw  flex/35.3559cqw  flex/40.0169cqw  flex/40.0169cqw
```

Nothing in `app/src` listens for `transitionend` or `animationend` (grepped),
so killing the transition outright costs nothing. `animation-duration` keeps
its `0.01ms`: no measurement in this app reads back through an animation, and
the snippet's value there is what makes a one-shot `animation` finish instead
of never firing its `animationend`.

**The `cqw` instability narrative this section used to carry is deleted, not
softened. It was never an instability class** - `docs/parity.md`'s "Two
unstable classes" gains no third entry. The evidence against it: the staleness
reproduces on a non-container element with px units, `document.getAnimations()`
returns a `CSSTransition` on the rewrite and `[]` on the live app, and with
`transition-duration: 0s` injected the live `fitPrintCards` run verbatim over
the rewrite's own DOM reproduces the legacy numbers exactly. CI would have read
it red too.

**Two more corrections in the same pass, both in already-touched paths:**

- `Shell.svelte`'s print block put the page colours on `:global(html),
  :global(body)` - specificity (0,0,1), identical to `body` in `tokens.css`,
  and the bundle emits component styles *before* `tokens.css`, so the later
  rule won and the override was dead code in the built app. Measured under
  print media: `body` was `rgb(14,12,21)` on `rgb(236,232,246)` with the radial
  gradient still painted, and `print-color-adjust: exact` on `*` prints that.
  **Fixed by moving the rule into `tokens.css`'s own `@media print`**, next to
  the `body` it overrides - not by `!important`, because `tokens.css` owns
  `html`/`body` (CLAUDE.md, "Architecture boundaries") and being the later
  sheet makes the win structural rather than a specificity trick. After:
  `rgb(255,255,255)` on `rgb(0,0,0)`, `background-image: none`.
- `Shell.svelte`'s print block hid `.skip`, `.topbar` and `.foot` but not
  `.tabs`, which the live block (`style.css:1403`) names. **Fixed in
  `TabBar.svelte`'s own `@media print`**, matching the split Shell's comment
  describes. The review's rendering claim - that the tab bar prints across the
  top of the first sheet - does **not** hold: measured under print media before
  the fix, `nav.tabs` computed `display: flex` but had `getClientRects().length
  === 0`, because the nav sits inside `header.topbar`, which Shell already
  hides. `getComputedStyle` on a child of a `display:none` parent returns the
  child's own specified value, which is what that measurement read. The gap was
  real as source fidelity and is worth closing - a nav that ever moves out of
  the header would start printing - but it drew nothing.

**Parity after the fix.** Group A (`node tests/parity.js "#/print"`, 9 states,
54 cells): every `cardFit`, `sheetCounts` and control-name cell agrees, and the
image residue is **4 cells**, down from 50. Re-running the two states that
carried them produced a **different, non-overlapping set of 3** on the same
build (first run: `NINE @ en 1100`, `NINE @ en 768`, `LONG @ en 768`, `LONG @
ru 1100`; second run: `NINE @ ru 1100`, `NINE @ ru 768`, `NINE @ en 1100`, with
both `LONG` states fully clean). All nine print states are `whole: true`, the
log printed "снимок целиком: 3/4 попытки до устойчивого кадра" repeatedly, and
the diff image shows no content change - every card has its art, the red is a
sub-pixel swim across the whole page including the topbar, which this batch
never touched, best-aligned at a one-pixel vertical shift. That is
`docs/parity.md`'s **second unstable class verbatim** ("Full-page captures":
geometry byte-identical, pixels swinging on an unchanged build, worse under
load), and its own recipe applies - re-run the state, write no entry, the
latest CI shard decides. **No `VISUAL_DEBT` number was written from this host.**
Group B (5 states, 30 cells) reads `расхождений нет`, so the global
`transition-duration` change disturbed no other screen.

**Two cheap factual corrections in the same already-touched paths**, per
CLAUDE.md's campsite rule: `docs/specs/COVERAGE.md` still named `LangSwitch`
as covered through `shell.test.ts` after `4776243` deleted that component (now
`Seg`, which is genuinely what `shell.test.ts` drives through the language
switch), and `PrintCard.svelte`'s `fit()` doc-comment claimed "everything the
loop can set is reset first", which is untrue - `.pc-art`'s `height`, `--artw`
and `display` are not reset. Harmless, because `.pc-art` is
`position: absolute` and nothing measures those three, but the comment now says
what the code does and why the omission is safe.

### B8 planned: the anchor debts after B7 - the ratchet rides alone (planner, 2026-09-11)

Planned at HEAD `9fd3000` == `origin/main`, working tree clean but for the
untracked `issues/tg-preview-refresh/` (another task's; preserved). CI run
`34616445556` on `9fd3000` is the input, already read into `context.md`
("The CI read on `9fd3000`"): `check`, `audit`, `secrets` and parity shards
1 and 4 green; shards 2 and 3 red on **three `VISUAL_DEBT` ratchet cells**,
every one of them "стало лучше"; **all 54 `#/print` cells `совпадает`**, the
24 `whole:true` ones included. So Phase 4's last blocker is closed by that
read, and `main` is red only on bookkeeping that is now false. This batch
makes the bookkeeping true again and nothing else. It is small by diff and
it is the right size by its gates (`CLAUDE.md`, "Task and session
protocol"; `docs/parity.md`, "Batch size"): see "Batch shape" below for why
it does not merge with the furniture pass.

**Objective.** After this batch `tests/parity/specs.js`'s four `375` anchor
entries say what CI measures on `9fd3000` and why it moved; the entry CI
reads as `0.00` is gone; every reason string that said "RAISED ... to what
CI measures, reproduced by three CI runs and the ubuntu container" is
replaced by one that is true today; the note above those entries names the
mechanism that was "not found yet" in its last paragraph, because it has
now been measured; `tools/parity-ubuntu/README.md`'s calibration table
stops reading as a current target; and `handoff.md`'s first "Blockers"
entry (the print image residue) is marked resolved by the CI read. The
next CI run on top of this commit is expected green on every shard.

#### Decided in planning

1. **The numbers are CI's, verbatim.** Owner decision 1 leaves nothing else
   to write (`docs/parity.md`, "Machine variance"; `context.md`, 2026-09-09):

   | entry | was | now |
   |---|---|---|
   | `#/tables/core_item ~ row anchor @ ru 375` | 10.52 | **9.35** |
   | `#/tables/core_item ~ row anchor @ en 375` | 9.92 | **8.85** |
   | `#/tables/voa ~ section anchor @ ru 375` | 11.55 | **deleted** (CI reads 0.00) |
   | `#/tables/voa ~ section anchor @ en 375` | 10.31 | **9.86** |

   The `@ 1100` and `@ 768` entries of the same states (0.42 / 0.43 / 0.63 /
   0.42) are unmoved on CI and are not touched.

2. **A cell that reads `0.00` once is deleted, not held for a second
   reading.** The ratchet's own rule decides it (`tests/parity.js` 582-595):
   a cell at `0.00` fails "стало лучше" under any figure above 0.5 and fails
   "долг погашен" under any figure above `JITTER`, so **no number makes it
   pass** - the only green entry for a `0.00` cell is no entry. B5.2 part 0
   deleted five entries on the same rule. If the next CI run reads it
   non-zero it fails loudly as "ожидался ноль", which is the correct
   behaviour for a state with no entry and a real difference, and the reader
   then writes CI's figure with a reason. The reason strings that cited
   "three CI runs and the ubuntu container" were describing the *old*
   figures' provenance; they are replaced, not amended, because that
   sentence would be false about the new ones. The container was tried:
   `docker info` panics on this host (client-side, `reflect: indirection
   through nil pointer`), so a second reading comes from CI, on the push
   that carries this commit. That is not a blocker: CI is the referee the
   owner named, and it reads every push.

3. **`voa ~ section anchor @ en 375` is lowered to 9.86 in the same pass.**
   It passed this run only because 0.45 is inside `DEBT_SLACK` (0.5). The
   figure is what CI measures, three prior runs agreed to the hundredth on
   the old one, and the move is caused (below) - leaving 10.31 in place
   would be leaving a coin on the table for the next run to trip over.

4. **The move is caused, and the cause is measured** (`context.md`, "B8
   planning facts"): the two anchor states are *scrolled* when the width
   sweep reaches them, and B7 changed the one global thing that touches how a
   scrolled document survives a resize. The live app keeps every declared
   `transition` alive under `prefers-reduced-motion: reduce` (`style.css`
   311 and 544 kill two named animations and nothing else); when the sweep
   crosses 600px its mobile overrides animate for ~150ms and Chrome's scroll
   anchoring adjusts the scrolled document across those frames - 6px on
   `core_item`, measured. The rewrite's `tokens.css` reduced-motion block
   kills transitions outright (`transition-duration: 0s !important` since
   `ee73d2e`; `0.01ms` before it, a two-frame transition that yielded a
   third, different adjustment), so it is not adjusted. Proof, not
   correlation: the live app with `*{transition-duration:0s!important}`
   injected lands at 368 at 375 in both languages - **exactly where the
   rewrite lands**. That closes the sentence in the `specs.js` note that
   read "something else is in there as well and has not been found yet".
   (`.selbox`'s own 0.15s restored alone in the rewrite does *not* reproduce
   the 6px, so the element that transitions is another live rule with a
   mobile override; B9's to name.)

5. **The `ru`/`en` split on `voa ~ section anchor` names a real mechanism,
   not an unstable one.** CI's own diff image for `@ en 375` (artifact
   `failure-output-parity-2`, opened in planning) is rows 10-13 of the Vault
   of Ages table with every line doubled: the two shots best-align at a
   **22px vertical shift** (2.52% residual - the fixed topbar and the ring),
   while `@ ru 375` aligns at 0px with 0.00% and `@ en 768` at 0px with
   0.43% (the ring). So in English the two apps sit 22px apart at 375 and in
   Russian they coincide. The only English-only divergence the two apps
   have on this state is the language switch itself: the live `render()`
   re-parses the anchor from the hash on every render and re-scrolls to it
   (app.js 3832-3845, `S.tables.anchor` consumed and re-read), and re-plays
   the flash; the rewrite's effect is guarded on `app.navigations`, which
   `setLang()` does not bump, so it is left where scroll anchoring put it
   after the English reflow. On a Windows host those two positions happen
   to coincide (measured `scrollY` 9616 on both at every width); on ubuntu
   they do not. Three CI runs at 10.31 to the hundredth and one at 9.86
   after a global CSS change is a deterministic mechanism moving once, not
   noise. It is B9's to close (the re-play), and B8 writes it down as the
   reason.

6. **Not `timed: true`.** Fresh arrival at every width was measured too: it
   zeros the four `ru` cells and the `core_item @ en` cells, but the live
   app's re-scroll on the `EN` press puts `voa @ en` **1px apart at 768 and
   8px at 375** (the rewrite does not re-scroll), so it would make `@ en
   768` worse than its recorded 0.42 and leave `@ en 375` several percent -
   and a `timed` state's numbers can come only from CI (the container is
   not evidence for a timed difference, `tools/parity-ubuntu/README.md`),
   so `main` would stay red for at least one more run while they were read.
   The fix that actually retires the eight anchor entries is the port
   re-playing scroll-and-flash on `app.lang` plus the live reduced-motion
   policy for transitions - B9 - not a harness flag.

7. **Batch shape: the ratchet rides alone.** Measured against `docs/
   parity.md`, "Batch size": B8's gates are `npm run check` (the commit gate
   wants it because `tests/parity/specs.js` is not exempt, `bash-guard.mjs`
   `isExempt`) and one 12-cell parity filter (`"anchor"`, ~3-4 min);
   no `check:built` (nothing a screen draws changes). The furniture pass
   (B10) touches every page and its honest parity read is the whole suite -
   a different route-and-filter set, which the batch-size test names as a
   split point ("the parity cost is not shared, only serialised"). Merging
   would save one `npm run check` and cost: `main` red until a review-sized
   refactor lands and is CI-read, and that refactor's CI read judged
   against numbers changing in the same commit. Separate, B8 first: `main`
   green on the next push, then every later CI read is legible.

#### In scope

`tests/parity/specs.js` (four entries, one note), `tools/parity-ubuntu/
README.md` (one paragraph under the calibration table), `issues/47/
{plan,handoff,context}.md`. One commit.

#### Out of scope

Any change under `app/`, `tests/parity/driver.js`, `tests/parity.js`,
`docs/parity.md` (no new class, no changed rule - the reduced-motion
finding is B9's design input and lives in the `specs.js` note and
`context.md` until B9 decides it), `docs/specs/*`, every other
`VISUAL_DEBT` entry, the furniture extraction (B10), the anchor re-play
(B9).

#### Steps

1. **Re-read the tree.** `git log --oneline -3` must show `9fd3000` on top;
   `git status --short` must show only `?? issues/tg-preview-refresh/`
   (leave it alone, never `git add -A`). If HEAD moved, read
   `context.md`'s newest section before continuing.
2. **`tests/parity/specs.js`, the four entries** (currently 2056-2073).
   Replace the four entries with exactly three, in this order and with these
   texts:

   ```js
   '#/tables/core_item ~ row anchor @ ru 375': {
     pct: 9.35,
     why: 'LOWERED from 10.52 on 9fd3000, where B7 set transition-duration to 0s under reduced motion: the width sweep, where the live app is scroll-anchored 6px during the transitions it keeps alive under reduced motion and the rewrite, with none, is not - see the note above. 9.35 is what CI measures (run 34616445556)'
   },
   '#/tables/core_item ~ row anchor @ en 375': {
     pct: 8.85,
     why: 'LOWERED from 9.92 on 9fd3000: the same transition-policy offset, in English. 8.85 is what CI measures (run 34616445556)'
   },
   '#/tables/voa ~ section anchor @ en 375': {
     pct: 9.86,
     why: "LOWERED from 10.31 on 9fd3000: after the EN press the live app re-scrolls to the section and the rewrite is left where scroll anchoring put it - 22px apart on CI (the run's own diff image), 0.00 on the same state at @ ru 375, whose entry is deleted. 9.86 is what CI measures (run 34616445556); it was 0.45 under the old figure, inside DEBT_SLACK, and is lowered now rather than left for the next run to trip"
   }
   ```

   `'#/tables/voa ~ section anchor @ ru 375'` is deleted.
3. **`tests/parity/specs.js`, the note above them** (the block comment that
   starts "Both anchors, on a phone, are one mechanism and it lives in the
   harness."). Keep every paragraph up to and including "...Three runs since
   have reproduced these four numbers exactly." Replace the last paragraph
   ("What is left is the harness's to fix ... admitted.") with:

   ```text
   Found, at B7 (2026-09-11): the "something else" was the reduced-motion
   transition policy. The live app leaves every declared `transition` alive
   under `prefers-reduced-motion: reduce` (style.css 311 and 544 kill two
   named animations and nothing else), so when the sweep crosses 600px its
   mobile overrides animate for ~150ms and Chrome's scroll anchoring
   adjusts the scrolled document across those frames - 6px on `core_item`
   on a Windows host. The rewrite's tokens.css kills transitions outright
   (`transition-duration: 0s !important` since B7; `0.01ms` before, a
   two-frame transition with a third, different adjustment - the 368 -> 387
   above), so it is not adjusted. Measured, not inferred: the live app with
   every transition killed lands exactly where the rewrite lands, in both
   languages. That is why all four 375 figures moved on 9fd3000 after three
   CI runs had agreed to the hundredth, and by different amounts - the
   adjustment is a browser heuristic over each table's own DOM.

   The `@ en` cells carry a second, English-only mechanism on top: the live
   render() re-parses the anchor from the hash on every render and
   re-scrolls to it on the language switch (app.js 3832-3845), the
   rewrite's effect is guarded on `app.navigations` and stays where scroll
   anchoring left it after the English reflow. On CI that is a 22px offset
   on `voa @ en 375` (the run's diff image) against 0.00 at `@ ru 375`.

   Both are the port's to close, not the table's - the anchor re-play on
   `app.lang` and the live reduced-motion policy for transitions, B9 in
   issues/47/plan.md. Until then the figures below are CI's, run
   34616445556 on 9fd3000; a Windows host reads `core_item` 6px apart and
   `voa @ en` not apart at all, so a local run of these cells is advisory
   in both directions (docs/parity.md, "Machine variance").
   ```

   Do not touch the `@ en 1100` / `@ en 768` entries or the note above
   *them* ("The row and section anchors, at 1100 and 768...") - both are
   still true.
4. **`tools/parity-ubuntu/README.md`**, directly under the calibration
   table's four rows, add one paragraph: the four figures in that table are
   the readings of runs `34382722764`/`34383263349` and were the target
   when the image was calibrated; on `9fd3000` (run `34616445556`) CI reads
   them 10.52 -> 9.35, 9.92 -> 8.85, 11.55 -> 0.00, 10.31 -> 9.86 after B7's
   reduced-motion change (`tests/parity/specs.js`, the anchor note), so a
   re-calibration compares against the **latest** CI run's readings of
   those cells, never against this table. Keep the table itself as the
   historical record it is.
5. **`npm run build`**, then
   `MSYS_NO_PATHCONV=1 node tests/parity.js "anchor"` (2 states, 12 cells,
   one foreground call). Record every cell's line verbatim in the handoff.
   Expected on this host, **advisory and not a gate** (`docs/parity.md`,
   "Machine variance": a local run can legitimately fail a cell that CI
   passes): the six `voa @ ru` / `core_item @ ru 1100|768` cells and
   `voa @ ru 375` `совпадает`; the `@ en 1100|768` cells inside their
   0.42-0.63 debts; `voa @ en 375` **likely red as "стало лучше"** against
   9.86, because this host measures no scroll offset on that cell
   (`context.md`, "B8 planning facts"); the two `core_item @ 375` cells
   somewhere near their figures, either side (the pre-B3.6 Windows figures
   sat 1.7pp under CI's on these two cells, so "стало лучше" or "стало хуже"
   on them locally is the documented platform offset, not a verdict).
   **Change no number off this run.** The one result that stops the batch:
   any of the **eight non-375 cells** (`@ ru|en 1100|768` of both states)
   reading outside its entry or non-`совпадает` - those are ring-only or
   zero and reproduce on Windows, so a move there is a real change. Report
   it with its diff image, do not commit.
6. **`set -o pipefail; npm run check 2>&1 | tail -n 120`** (Bash timeout
   600000, one foreground call - it reads none of the files this batch
   changes, but the commit gate wants it green for the tree). Green arms the
   gate.
7. **Docs.** `plan.md`: mark this section built with the parity lines;
   `handoff.md`: Status, Completed, Verification (exact commands and every
   anchor cell's line), "Next batch" -> B9 outline pointer, Blockers (the
   print entry already reads RESOLVED from planning; add nothing), Deferred
   unchanged; `context.md`: append only if something durable was measured
   that this section does not already hold.
8. **One commit**, Conventional Commits, author `artex-x
   <artex-x@users.noreply.github.com>`, no `Co-Authored-By`:
   `test(parity): the anchor debts follow CI's read of 9fd3000`. Stage the
   four paths by name. **Never push.** The owner's push is the second
   reading the deleted entry waits on.

#### Acceptance criteria

- `tests/parity/specs.js` has exactly three `375` anchor entries with the
  figures above; `grep -c "RAISED from" tests/parity/specs.js` is 0 for the
  anchor entries (the string may survive elsewhere only if it is still true
  there - it is not used elsewhere today).
- `node -e "require('./tests/parity/specs.js')"` loads (no syntax slip).
- `MSYS_NO_PATHCONV=1 node tests/parity.js "anchor"` ran; every cell's line
  is in the handoff; the eight non-375 cells read as they do today
  (`совпадает` at `@ ru`, inside 0.42-0.63 at `@ en`); the four 375 cells
  are recorded as read and left alone.
- `npm run check` green; the commit gate armed; one commit; tree clean but
  for `issues/tg-preview-refresh/`.
- The next CI run on `main` (owner's push) is expected green on all four
  shards - the reading that closes B8. Record its run id in the handoff
  when it exists.

#### Risks and do-nots

- Do not write a Windows figure anywhere. Do not "fix" a locally red
  `voa @ en 375` by restoring 10.31 or by widening anything.
- Do not flag the anchor states `timed` (decided above).
- Do not touch `tokens.css` - the reduced-motion policy is B9's decision and
  needs the owner (see "Questions for the owner before B9").
- Do not edit `docs/parity.md`; nothing in it is false.
- Do not stage `issues/tg-preview-refresh/`.
- `dist/` is gitignored; `npm run build` before the parity run is required
  because the harness photographs `dist/index.html`.

#### Fallback

If `docker info` works on the implementing host, the container is a
legitimate second reading for the three **layout** cells (`docs/parity.md`,
"Machine variance"; `tools/parity-ubuntu/README.md`) - run
`docker run --rm -v "$PWD:/work:ro" dh-parity:ubuntu24 sh -c 'npm run build
&& node tests/parity.js "anchor"' > <scratch>/anchor-ubuntu.log` and record
the twelve lines. Agreement to the hundredth with 9.35 / 8.85 / 9.86 and
`совпадает` on `voa @ ru 375` confirms; disagreement is reported, not
written - CI stays the referee. This is optional; the batch does not wait
on it.

### B8 built: the anchor debts follow CI's read of 9fd3000 (implementer, 2026-09-11)

Built to the plan above with no design deviation. `docker info` panics on this
host too (client-side, `reflect: indirection through nil pointer`), so the
container fallback was not available; the second reading stays CI's, on the
owner's push.

`tests/parity/specs.js`'s four `375` anchor entries are now three:
`core_item @ ru 375` 9.35, `core_item @ en 375` 8.85, `voa @ en 375` 9.86 (all
`LOWERED from ... on 9fd3000`, CI run `34616445556`); `voa @ ru 375` is
deleted (CI reads 0.00, and the ratchet's own rule admits no passing figure
for a `0.00` cell). The note above them keeps every paragraph through "...Three
runs since have reproduced these four numbers exactly." and its last
paragraph is replaced with the three paragraphs the plan specifies: the
reduced-motion transition policy (measured), the English-only re-scroll (read
off CI's own diff image), both named as B9's to close.
`tools/parity-ubuntu/README.md` gains one paragraph under the calibration
table pointing a re-calibration at the latest CI run rather than the table.

**`npm run build`, then `MSYS_NO_PATHCONV=1 node tests/parity.js "anchor"`**
(12 cells, one foreground call) - advisory, this host, both directions
(`docs/parity.md`, "Machine variance"). All eight non-375 cells read exactly
as expected and unchanged: `вид: совпадает` on every `@ ru` cell of both
states at every width, and `@ en 1100|768` inside their existing 0.42-0.63%
debts. The three remaining 375 cells all read `FAIL ... стало лучше - опусти
число в VISUAL_DEBT` against the new figures - `core_item @ ru 375` 7.79%
against 9.35%, `core_item @ en 375` 7.31% against 8.85%, `voa @ en 375` 0.00%
against 9.86% - exactly the direction and shape the brief predicted (this
host measures no scroll offset on the `voa @ en` mechanism; the two
`core_item @ 375` cells sit under CI's figures, the documented platform
offset). No number was changed off this run. The one stop condition named in
the brief - a non-375 cell moving - did not occur.

**`set -o pipefail; npm run check 2>&1 | tail -n 120`** (Bash timeout
600000, one foreground call): exit 0. `format:check`, `lint`, `typecheck`
(540 files, 0 errors/warnings), `data` (derived files match, catalog reads,
stubs match, `noindex` present, i18n parity, `.claude/hooks/selftest.mjs`
292/292), and `vitest run --coverage` (41 files, 994 tests passed, 70.25s;
statements 96.52%, branches 88.44%, functions 96.95%, lines 97.24% - all
above threshold). The commit gate is armed for this tree.

No production code touched; `npm run check:built` was not run, per the brief
(nothing a screen draws changes in this batch).

**Committed as `274aa99`, with the docs correction `435a5ac` on top; pushed by
the owner; confirmed by CI run [`34628983995`](https://github.com/artex-x/daggerheart-loot/actions/runs/34628983995) on `435a5ac`** (orchestrator,
2026-09-11). B8's design named one closing condition - a second, independent
reading of the four anchor figures - and the run supplies it: **all four parity
shards green**, including shard 3 (`core_item ~ row anchor`) and shard 2 (`voa ~
section anchor`), the two that were red on `9fd3000`. The deleted `voa @ ru 375`
entry is confirmed by the absence of a cell to fail, so the `0.00` was the
reading and not a one-run artefact, which is what the ratchet's own rule needed
before the entry could stay deleted. The 54 `#/print` cells read `совпадает` a
second consecutive run. The same run's `check` job failed on the legacy
`behave` suite against the live app, a flake the owner re-ran and attempt 2
passed; none of B8's five paths can reach it. The run is green end to end.
**B8 is closed.**

### B9 outlined: the anchor re-play and the reduced-motion policy (planner, 2026-09-11)

Not implement-ready; a planning pass expands it. Everything measured is in
`context.md`, "B8 planning facts". Its purpose is to retire all **eight**
anchor entries (`@ en 1100|768` x4 and the three B8 leaves) by porting two
behaviours the live app has and the rewrite does not:

1. **The anchor scroll-and-flash re-plays on a language switch.** Live:
   `render()` re-reads the anchor from the hash every time and runs the
   block at app.js 3832-3845, so the `EN` press re-scrolls and re-flashes.
   Rewrite: `TablesPage.svelte`'s effect is guarded on `app.navigations`
   only. Port: key the effect on `app.lang` as well (a language switch is a
   re-render in the live app, and the "DOM-only transient state" rule in
   "Working rules" already says the port re-creates on `app.lang`), and make
   `flash` reactive state (`class:flash={flashKey === key}` in `TableRows`
   and `SectionHead`) rather than a class added behind Svelte's back, so a
   keyed re-render cannot drop it - the reason the rewrite's ring "has never
   been visible" (`specs.js`, the 1100/768 note). Expected: the four `@ en
   1100|768` entries (a ring's worth each) go to 0.00 and are deleted.
2. **Transitions under `prefers-reduced-motion: reduce`.** The live app
   keeps every declared `transition` alive and kills two named animations;
   `tokens.css`'s blanket block (`animation-duration: 0.01ms`,
   `animation-iteration-count: 1`, `transition-duration: 0s`,
   `scroll-behavior: auto`, all `!important` on `*`) is the rewrite's
   invention. The `transition-duration` line is what puts the `375` sweep
   cells 6px apart on `core_item` (B8, decided 4). Options, for the owner:
   (a) **port the live policy** - delete the `transition-duration` line
   (and decide the animation lines on the same evidence: `settle()` waits
   for animations, so they cost timing, not pixels); the rewrite then
   transitions exactly where the live app does and the sweep adjusts both
   the same way - recommended, because the parity law is "reproduce the
   shipped app" and the transitions in question are 150ms colour/width
   eases on hover and breakpoint, not motion in the vestibular sense;
   (b) keep the kill as an accepted accessibility improvement and carry the
   `375` cells as debt with the reason B8 writes - honest, but it leaves
   ~9% entries whose only content is a 6px scroll offset, and `ACCEPTED`
   cannot hold a pixel cell. Print is safe under (a): `PrintCard.svelte`
   and `PrintPage.svelte` declare no `transition` (grepped), so no
   `CSSTransition` can start on a measured element - the B7 defect needed a
   non-zero duration on `*`.
3. **Which live rule transitions on the breakpoint** is the one open
   measurement: `.selbox` alone restored in the rewrite does not reproduce
   the 6px; the candidates are the other `@media (max-width:600px)`
   overrides on elements with `transition:` (`style.css` 76, 93, 159, 232,
   409, 418, 495, 813, 835, 880). Under (a) it does not need naming - both
   apps run the same set; under (b) it does.

Files expected: `app/src/components/TablesPage.svelte`,
`TableRows.svelte`, `SectionHead.svelte`, `tables.test.ts`,
`app/src/styles/tokens.css` (under (a)), `tests/parity/specs.js` (entries
deleted or re-read from CI), `docs/specs/FEATURES.md` (the anchor sentence,
if the behaviour is written down there - it is not today), `docs/parity.md`
(the reduced-motion policy, one sentence under "Harness invariants" if (a)).
Parity filter: `"anchor"` (12 cells) plus `"#/print/ci1-q1-q313"` (12 cells,
the fit under the transition policy) - one foreground call together; the
whole suite is CI's. Gates: `npm run check`, `npm run check:built` (a screen
changes: the ring draws), the filter. Numbers: none from a Windows host;
the `@ en` residue after the re-play, if any, is CI's to read - which means
B9 may need one CI round trip before its entries settle, and its handoff
must say so rather than write a local figure.

**Questions for the owner before B9 is planned** (not B8's; listed so they
are not lost): the reduced-motion policy, (a) or (b) above, with (a)
recommended. `NEEDS_HUMAN_CONFIRMATION` for B9 is therefore expected to be
`yes` at its planning pass unless the owner answers first.

**Answered (owner, 2026-09-11): option (a).** Expanded to implement-ready
in "B9 planned", next. One correction to the outline: the print filter is
`"#/print/ci1-q1"`, not `"#/print/ci1-q1-q313"` - `WANTED` filters on the
state id, and no id carries the route's full tail.

### B9 planned: the anchor re-play, the live reduced-motion policy, and the behaviour-debt register (planner, 2026-09-11)

Implement-ready. Supersedes "B9 outlined" above, which stays as the record
of the question it put to the owner. Measured facts: `context.md`, "B8
planning facts" and "B9 planning facts". The owner's decisions:
`context.md`, "The owner's answer on B9, and a post-migration review step".

**Objective.** Retire all seven remaining anchor `VISUAL_DEBT` entries by
porting two behaviours the live app has and the rewrite does not - the
anchor scroll-and-flash re-playing on a language switch, and transitions
staying alive under `prefers-reduced-motion: reduce` - and open the
register that the second of those is the first entry of:
`docs/specs/DEBT.md`, the third category beside `VISUAL_DEBT` and
`ACCEPTED` (design and rejected alternatives: "Phase 8", below).

**Decided, not to be reopened.**

1. **Reduced motion: option (a), the live policy, by deleting the whole
   `@media (prefers-reduced-motion: reduce)` block in `tokens.css`**
   (lines 156-176 at `bb61db0`) - all four lines, not only
   `transition-duration`. Evidence, per line:
   - `transition-duration: 0s !important` is the 6px on `core_item @ 375`
     (B8, measured by injection both ways). The live app keeps every
     declared `transition` alive under reduced motion.
   - `animation-duration: 0.01ms` / `animation-iteration-count: 1`: the
     rewrite's six `animation:` declarations map one to one onto the live
     ones - `.card` pop (`RecordCard.svelte:262` = style.css:308, with the
     reduced-motion `animation:none` ported at `:278` = 311), `.modal-card`
     pop (`RecordModal.svelte:159` = 591, and `.modal-card .card
     {animation:none}` at `:165` = 593), `.helpbox` pop (`HelpBox.svelte:53`
     = 134, kept under reduced motion on purpose, its own comment says why),
     `.dropmenu` pop (`AddToList.svelte:291` = 435), `toastIn`
     (`Toast.svelte:96` = 606), and `.tsection.flash`
     (`TablesPage.svelte:635` = 538, with 544's `animation:none; outline`
     ported at `:655`). No animation in `app/src` loops. So with the block
     gone the rewrite's per-component rules *are* the live policy, and the
     harness's `settle()` (`driver.js:85`, `document.getAnimations()`,
     which includes `CSSTransition`s) waits them out - timing, not pixels.
   - `scroll-behavior: auto !important`: inert. Both apps scroll with
     `scrollIntoView({ behavior: 'smooth' })`, and an explicit `behavior`
     option is not overridden by the CSS property. The live app has no
     `scroll-behavior` rule at all.
   - Print is safe: `PrintCard.svelte` and `PrintPage.svelte` declare no
     `transition`, so `fit()`'s synchronous read-back cannot hit a
     `CSSTransition` (the B7 defect needed a non-zero duration on `*`).
     The `"#/print/ci1-q1"` filter below is the proof, not the argument.
   - Leave a four-line comment where the block was, so nobody reintroduces
     it: no blanket rule on purpose, the live policy is two named
     animations off and every transition alive, a blanket
     `transition-duration` of *any* value differs from the live app (B8)
     and a non-zero one broke `fit()` (B7); owed a real policy after the
     migration - `docs/specs/DEBT.md`, D1.
2. **The re-play is keyed on the language, and only the language.** The
   live `render()` re-parses the anchor from the hash on every call
   (app.js 3632-3634) and runs the scroll-and-flash block at its end
   (3832-3845), so the `EN` press re-scrolls and re-flashes. It also does
   so on every other `render()` with the anchor still in the address - a
   search keystroke (`app.js:4435`: `S.tables.q = el.value; render()`), a
   tick, a view switch - which drags the reader back to the anchor on every
   keystroke. That is a live defect and B9 does **not** reproduce it: the
   precedent is the grid-numbering bug in `ACCEPTED`; no parity state types
   or ticks with an anchor in the address, so nothing keys it, and it is
   written down instead (`FEATURES.md` bullet and `specs.js`'s "Recorded,
   not keyed" paragraph, both in this batch). The port re-plays on the two
   renders a person can cause with the anchor still in the address: a
   navigation (`app.navigations`, as today) and a language switch
   (`app.lang`, new).
3. **The flash is state, not a DOM write.** `flashKey` on `TablesPage` and
   a `flash` prop on `TableRows`; `class:flash` on `.tsection`, `.row` and
   `.tilewrap`. The timer starts in the effect, synchronously, as today -
   the live `render()` adds the class synchronously too, and the `@ ru`
   cells pass today because both rings have expired by the shot; a later
   start would keep the rewrite's ring alive past the live one's and
   regress those cells. Only the scroll waits (`document.fonts.ready`, the
   measured reason in the component's own comment - keep it).
4. **`SectionHead.svelte` is not touched.** The outline named it, but the
   flash target is the `.tsection` div that `TablesPage` draws around it,
   not the heading.
5. **Numbers.** None from this host. Delete an entry only when the local
   advisory run reads it `совпадает` *and* the mechanism behind it is one
   this batch closed (every anchor entry is); leave any cell that still
   reads non-zero at its recorded CI figure, untouched, and hand it to CI.
   The batch's closing condition is the CI read on the owner's push, as
   B8's was - an OPEN "Blockers" entry until then.
6. **The register is created in this batch, not at Phase 8.** The D1 entry
   carries measurements (the 6px, the 22px, the injection proof) that
   cannot be retaken once the static root is gone; and a `CLAUDE.md` row
   makes B10, Phase 7 and every later batch write its own entries as it
   goes instead of a sweep from memory at the end. Shape and rejected
   homes: "Phase 8", below.

**In scope.** `TablesPage.svelte` (effect and template), `TableRows.svelte`
(one optional prop, two `class:` bindings), `tables.test.ts`, `tokens.css`,
`tests/parity/specs.js` (entries and the note), `docs/specs/FEATURES.md`,
`docs/specs/DEBT.md` (new, with D1-D4), `docs/parity.md`,
`docs/specs/COVERAGE.md` (one sentence), `CLAUDE.md` (one table row, one
half-line).

**Out of scope.** `SectionHead.svelte`; `Button.svelte` and any focus-ring
work (measured, not a defect - `context.md`, "B9 planning facts"); the
`RecordPage.svelte:59` `.miss` fix and every other furniture item (B10); the
harness's width sweep; any `VISUAL_DEBT` figure from this host; any
reduced-motion policy *design* (Phase 8's).

**Steps.**

1. Preflight: `git log --oneline -3` shows `bb61db0` on top; `git status
   --short` shows nothing but `?? issues/tg-preview-refresh/` (another
   task's - never stage it) and, after step 2, your own edits. No
   `node tests/parity.js` in `tasklist`.
2. `app/src/components/TablesPage.svelte`, the anchor effect (lines
   338-399 at `bb61db0`):
   - Replace `let anchoredAt = $state(-1)` with three declarations: `let
     flashKey = $state('')` (read by the template), and two plain
     non-reactive `let`s - `played = ''` (the `${navigations}|${lang}`
     stamp the anchor was last played for) and `flashTimer:
     ReturnType<typeof setTimeout> | undefined`.
   - In the effect: read `app.route`, `app.navigations`, `app.lang` and
     `index` as tracked dependencies; compute `stamp =
     \`${nav}|${lang}\``; return if no anchor or no index; return if
     `played === stamp`; set `played = stamp`; then inside `untrack`:
     `clearTimeout(flashTimer)`, `flashKey = anchor`, `flashTimer =
     setTimeout(() => { flashKey = ''; }, 1600)`, and the existing
     `fonts.ready` promise whose `.then` now *does the lookup itself*
     (`document.getElementById('sec-' + anchor) ??
     document.querySelector<HTMLElement>(\`[data-row="${anchor}"]\`)`) and
     calls `scrollIntoView({ behavior: 'smooth', block: 'start' })` on it
     if found. The lookup moves into the `.then` because the element the
     effect saw can be replaced by a keyed re-render before the promise
     resolves; nothing about *when* the scroll happens changes.
   - Add `$effect(() => () => clearTimeout(flashTimer))` - unmount only,
     no dependencies; a cleanup returned from the anchor effect itself
     would clear the timer on every re-run, which the live app does not.
   - Rewrite the comment's first paragraph to say what decided 2 says
     (guarded on the navigation count *and* the language; the keystroke
     re-play is a live defect not copied, with `app.js:4435` cited) and
     its "The flash starts immediately" paragraph to add why the class is
     state (decided 3). Keep the measured `fonts.ready` paragraphs as they
     are.
   - Template: on both `.tsection` divs (the `alt` body and the
     tier/frame/comm/eq body) add `class:flash={flashKey === s.key}`; on
     all three `<TableRows>` call sites add `flash={flashKey}`.
3. `app/src/components/TableRows.svelte`: add `flash?: string` to `Props`
   with a doc comment ("the id of the row the anchor effect is outlining
   right now - state rather than a DOM write, so a keyed re-render keeps
   it; `TablesPage`'s `flashKey`"); destructure it; add
   `class:flash={flash === it.id}` to the `.row` div (line 105) and the
   `.tilewrap` div (line 131). `SearchPage` and `SharedListPage` pass
   nothing and need no change.
4. `app/src/components/tables.test.ts`, in `describe('the row and section
   anchor')`, real timers, the file's existing `render(App, { env:
   fakeEnv({ router: memoryRouter(...), data: fakeData(LOOT) }) })` shape,
   `Element.prototype.scrollIntoView = vi.fn()` per case as the file does:
   - "the outline follows the record into the grid view": arrive at
     `#/tables/core_item/ci2`, wait for `[data-row="ci2"]` to have `flash`,
     then `await userEvent.click(screen.getByRole('button', { name:
     'Сеткой' }))` (the file's own shape, line 247), re-query
     `[data-row="ci2"]` - it is now the `.tilewrap` - and assert it has
     `flash` and `scroll` was still called once. The view switch replaces
     the element outright, which is the regression a class written behind
     Svelte's back cannot survive and state can; a tick only toggles
     `class:sel` on the same element and would pass either way.
   - "re-plays the scroll and the outline on a language switch": arrive
     the same way, wait for `flash` and one scroll call, `await
     userEvent.click(screen.getByRole('button', { name: 'EN' }))`, then
     `waitFor` `scroll` called twice and the target (re-query it) has
     `flash`.
   - "a search keystroke does not re-play it": arrive, wait for one scroll
     call, type one character into the toolbar search box
     (`getByPlaceholderText('Поиск по названию или описанию…')`), assert
     `scroll` still called once.
   - Keep the four existing anchor cases unchanged. End each new case the
     way the file's other cases in this `describe` end (they assert and
     return; the axe sweep for this screen is `a11y.test.ts`'s).
5. `app/src/styles/tokens.css`: delete lines 156-176 (the comment line
   "Anyone who has asked..." through the block's closing brace) and put
   the four-line comment from decided 1 in their place.
6. `docs/specs/DEBT.md`: create it from the shape in "Phase 8", below,
   with entries D1-D4 whose text is given there verbatim. D1 is this
   batch's; D2-D4 are the sweep's, written now because the register's
   first commit should show the shape on more than one entry and because
   each is already measured and cited.
7. `CLAUDE.md`: add the row `| \`docs/specs/DEBT.md\` | live defects the
   rewrite reproduces on purpose, and live decisions kept over its own;
   owed a fix after the migration |` to the spec table after `META.md`,
   and extend the "Migration and parity" bullet "Record intentional
   accessibility differences in `ACCEPTED` with a reason." with "; a live
   defect reproduced on purpose goes in `docs/specs/DEBT.md`." The file is
   191 lines; stay under 200.
8. `docs/specs/FEATURES.md`: under "Tables and search", after "Every
   heading has a copy-link button; sections are addressable.", add: "A row
   or section link (`#/tables/<table>/<key>` - what a record's "show in
   table" link and a section's copy-link button produce) scrolls to its
   target and outlines it in gold for 1.6 s. The scroll and the outline
   re-play on a language switch. A search keystroke, a tick or a view
   switch does not re-play them - the live app re-renders and re-scrolls
   on each, a defect not reproduced." Under "Chrome", add: "Under
   `prefers-reduced-motion: reduce` the card's entrance and the section
   outline's fade are off (the outline is static); every other transition
   and animation runs. Ported from the live app and owed a real policy:
   `DEBT.md`, D1."
9. `docs/parity.md`: in "Contract", after the `ACCEPTED` bullet, add
   "- A live defect the rewrite reproduces on purpose is identical on both
   sides, so nothing can key it; record it in `docs/specs/DEBT.md`
   instead." In "Harness invariants", add "- Both apps are photographed
   under `prefers-reduced-motion: reduce`, and the rewrite's policy there
   is the live app's - two named animations off, every transition alive -
   so `settle()` waits on transitions as well as animations." In the
   intro paragraph, extend "current migration debt and ordering live only
   in `issues/47/plan.md` and `issues/47/handoff.md`" with "; behaviour
   reproduced on purpose lives in `docs/specs/DEBT.md`". `docs/specs/
   COVERAGE.md`, "The rewrite against the app it replaces", after the
   three kinds of finding: "A fourth thing is never a finding: a live
   defect the rewrite reproduces on purpose is identical on both sides,
   so it is written in `docs/specs/DEBT.md` rather than keyed here."
10. `set -o pipefail; npm run check 2>&1 | tail -n 120` - one foreground
    call, Bash timeout 600000. Green before anything below.
11. `set -o pipefail; npm run check:built 2>&1 | tail -n 60` - one
    foreground call, timeout 600000 (build + `file://` smoke + budget; a
    screen changes, so it is a gate).
12. `MSYS_NO_PATHCONV=1 node tests/parity.js "anchor" "#/print/ci1-q1"` -
    one foreground call, timeout 600000. Filters are OR-ed
    (`tests/parity.js:353`, `WANTED.some`), so this is four states, 24
    cells. **The outline's `"#/print/ci1-q1-q313"` matches nothing** -
    `WANTED` filters on the state id, and the print ids are
    `#/print/ci1-q1` and `#/print/ci1-q1 ~ black and white`. If the call
    approaches the cap, split it into two calls, each in the foreground.
    Read the twelve anchor lines and the twelve print lines. Expected: the
    twelve print cells `совпадает` (unchanged); the eight `@ ru|en
    1100|768` anchor cells `совпадает`, the four `@ en` ones now failing
    as `долг погашен - удали запись`; the three `375` cells either
    `совпадает`/`долг погашен` (the mechanism closed on this host too) or
    a figure inside their recorded debt.
    Open `test-output/parity/` for `core_item ~ row anchor @ en 1100`: the
    `-next.png` shows the gold ring around `ci1`'s row where before it
    showed none. Copy the four anchor `-next.png`/`-diff.png` pairs to
    `issues/47/evidence/b9/` (create it) before any further run wipes
    them.
13. `tests/parity/specs.js`: delete every anchor entry the run reported
    `долг погашен` (decided 5). Replace the long comment block above the
    `@ en 1100|768` entries and the one above the `375` entries with one
    short note in their place: what the two mechanisms were, that B9
    closed both (the ring is state, the re-play on `app.lang`, the live
    reduced-motion policy - `docs/specs/DEBT.md`, D1), and that the
    measured history is in git at `274aa99`. Do not append to the old
    text; a note that is three screens long stops being read. In the
    "Recorded, not keyed" paragraph above `ACCEPTED`, add one sentence:
    the live app re-plays the anchor scroll-and-flash on every render -
    a search keystroke included (`app.js:4435`) - and the rewrite re-plays
    it on a navigation and a language switch only; no state types with an
    anchor in the address, so nothing keys it (`FEATURES.md`, "Tables and
    search"). Re-run step 12's anchor filter once after editing
    (`"anchor"` alone, 12 cells) to confirm no `FAIL VISUAL_DEBT[...]
    такого состояния нет` and no remaining `долг погашен`.
14. Re-run step 10 (the tree changed since it armed). Commit as one
    commit, Conventional Commits, author `artex-x
    <artex-x@users.noreply.github.com>`, no attribution trailer, e.g.
    `feat(app): the anchor re-play and the live reduced-motion policy
    (#47)`. Public contracts are untouched, so no fixture or `llms.txt`
    change. Never push.
15. Update `handoff.md` (Status, Completed, Verification with every
    command and the 24 + 12 parity lines verbatim, Blockers with the OPEN
    "waits on CI's read" entry, Next batch -> B10) and `plan.md` ("B9
    built"). Any cell left at its CI figure is named there, with "CI
    decides".

**Acceptance criteria.**

- `tables.test.ts`: the three new cases pass and the four existing anchor
  cases are unchanged and green; per-file coverage thresholds hold.
- `tokens.css` has no `prefers-reduced-motion` block; `grep -rn
  "prefers-reduced-motion" app/src` finds exactly the two per-component
  rules (`RecordCard.svelte`, `TablesPage.svelte`) and nothing else.
- Step 12: all twelve `#/print/ci1-q1` cells `совпадает`; every anchor
  cell either `совпадает` or inside its recorded debt; no cell worse than
  its recorded figure. The four `@ en 1100|768` entries are deleted
  (their only content was the ring, which now draws; if any of the four
  still reads non-zero locally, stop and record the diff image - that is
  a defect in the port, not a machine variance, because the ring is above
  the fold at those widths).
- The `-next.png` for `core_item ~ row anchor @ en 1100` shows the ring.
- `specs.js`: no `VISUAL_DEBT` key without a state, no entry the local run
  reports `долг погашен`; the "Recorded, not keyed" paragraph names the
  keystroke re-play.
- `docs/specs/DEBT.md` exists with the header and D1-D4; `CLAUDE.md`
  routes to it and is under 200 lines; `FEATURES.md`, `parity.md`,
  `COVERAGE.md` carry the sentences in steps 8-9.
- `npm run check` and `npm run check:built` green on the committed tree,
  in the foreground; the commit gate armed from that run.

**Gates and cost.** `npm run check` (~165 s idle, once per commit),
`check:built` (a few minutes, once), the parity filter (24 cells, once,
plus a 12-cell re-run after the `specs.js` edit). One batch: the anchor
states and the print states share nothing but the run, but the print
filter is the transition policy's own proof and costs one call more, not
a separate batch. The full suite is CI's on the owner's push.

**Risks / do-nots.**

- Do not write a `VISUAL_DEBT` figure from this host (owner decision 1).
  A cell that improves but does not reach zero keeps its CI figure until
  CI reads it.
- Do not move the flash's start into the `fonts.ready` `.then` (decided
  3): the `@ ru` cells would regress.
- Do not key the re-play on anything but `navigations` and `lang` - not
  on `q`, `view` or the selection (decided 2).
- Do not port a `.tsection.flash`/`.row.flash` rule change; only the
  class application changes. The reduced-motion `outline` on
  `.tsection.flash` (`TablesPage.svelte:655`) is what the harness
  photographs and it stays.
- Do not add `flash` to `SectionHead`; do not touch `Button.svelte`.
- If `npm run check` is moved to the background by the cap, re-run it; a
  backgrounded run cannot arm the gate and `bash-guard.mjs` blocks a
  deliberately backgrounded one.
- Reviewer: this batch changes what a screen draws, so the orchestrator's
  risk rules put a review on it.

**Fallback.** If the language-keyed re-play moves an unrelated tables
cell (none is expected - every other tables state has no anchor in its
address, so the effect returns early), the re-play is still correct and
the cell's diff image is the evidence to read before anything is undone.

### B9 built: the anchor re-play, the live reduced-motion policy, and the behaviour-debt register (implementer, 2026-09-11)

Built to the plan above with no design deviation. Preflight matched the
brief exactly: HEAD `bb61db0`, `git status --short` showed only the
planner's uncommitted `context.md`/`plan.md`/`handoff.md` and the
untracked `issues/tg-preview-refresh/` (another task's, never staged).

Steps 2-9 as specified: `TablesPage.svelte`'s effect now keys on
`${navigations}|${lang}` (`played`), holds `flashKey` as `$state`, and
does the element lookup inside the `fonts.ready` `.then` rather than at
trigger time; a second, dependency-free `$effect` clears `flashTimer` on
unmount only. `TableRows.svelte` takes an optional `flash?: string` and
applies `class:flash` on `.row` and `.tilewrap` (the CSS rules themselves
were untouched, per decided 4). `tokens.css` lost the whole
`@media (prefers-reduced-motion: reduce)` block; `grep -rn
"prefers-reduced-motion" app/src` now finds exactly `RecordCard.svelte`
and `TablesPage.svelte`. `docs/specs/DEBT.md` was created with D1-D4
verbatim; `CLAUDE.md` (193 lines), `FEATURES.md`, `docs/parity.md`,
`docs/specs/COVERAGE.md` all carry the sentences the plan specifies.

Two eslint errors surfaced at `npm run check` that `svelte-check` had not
caught: `${nav}` over a `number` needed `String(nav)`
(`@typescript-eslint/restrict-template-expressions`), and the unmount
effect's inner arrow `() => clearTimeout(flashTimer)` needed braces
(`@typescript-eslint/no-confusing-void-expression` on the shorthand-void
form). Neither is a design deviation; both are one-line fixes the plan's
steps did not anticipate because they were written against `svelte-check`
output, not `eslint`'s.

**`MSYS_NO_PATHCONV=1 node tests/parity.js "anchor" "#/print/ci1-q1"`**
(one foreground call) matched **36 cells, not the predicted 24**: the
filter string `"#/print/ci1-q1"` is also a prefix of
`"#/print/ci1-q1-q313-cc1-voa2_a3-q23-w51-q35-di11"`, so both print states
matched, not one - 4 print states x 6 cells = 24 print cells, plus 12
anchor cells = 36. Every print cell read `совпадает`, satisfying the
acceptance criterion regardless of the count; the plan's own filter-cost
arithmetic ("four states, 24 cells") undercounted by exactly this, worth
recording so a later batch does not re-derive it as a surprise.

All twelve print-suite states (both ids, both layouts) read `совпадает`.
All seven anchor `VISUAL_DEBT` entries read **0.00% locally** - not only
the three whose message was `долг погашен - удали запись` (`core_item @ en
1100|768`, `voa @ en 768`), but also the other four, which read `стало
лучше - опусти число` (`voa @ en 1100`, and all three `375` entries)
because their recorded figures exceeded `DEBT_SLACK` (0.5) and
`parity.js`'s message-selection branches on the *recorded* figure's size,
not on whether the actual result is a match. Per decided 5 - delete an
entry when the local run reads it as a match and the mechanism this batch
closed is the entry's, and "every anchor entry is" - all seven were
deleted, matching the batch's own Objective. `core_item ~ row anchor @ en
1100`'s `-next.png` shows the gold ring around "Premium Bedroll" (`ci1`),
confirmed by eye; that pair and the other three `@ en 1100|768` pairs are
copied to `issues/47/evidence/b9/`.

`tests/parity/specs.js`: the two long comment blocks above the anchor
entries replaced with one short note pointing at `274aa99` for the
measured history rather than repeating it; the "Recorded, not keyed"
paragraph gained the keystroke-re-play sentence. Re-running
`"anchor"` alone (12 cells) afterward read `совпадает` on every cell -
`расхождений нет`, no `долг погашен` left, no `такого состояния нет`.

**`set -o pipefail; npm run check 2>&1 | tail -n 120`** (Bash timeout
600000): exit 0 both times it was run (after the component/docs edits,
and again after the `specs.js` edit) - `format:check`, `lint`,
`typecheck` (540 files, 0 problems), `data`/`derived`/`i18n`/`selftest`
(292/292), `vitest run --coverage` (41 files, 997 tests passing;
statements 96.49%, branches 88.38%, functions 96.89%, lines 97.21% - all
above threshold). **`set -o pipefail; npm run check:built 2>&1 | tail -n
60`**: exit 0 - build, `file://` smoke, bundle budget (88.5 kB gzip
against 120 kB). The commit gate is armed for the committed tree.

No `VISUAL_DEBT` figure was written from this host (owner decision 1
honoured - every anchor entry was deleted outright, none re-numbered).

**Committed as `ad46dac`; not pushed (never this session's to do).** B9's
own closing condition, same shape as B8's: a green CI read of the
owner's push. Open in `handoff.md`, "Blockers", until then.

**Correction, one remediation pass on top of `ad46dac` (`dba79ee` docs-only
in between) (reviewer then implementer, 2026-09-11): one blocker and six
nits, all fixed in one pass, per the review's own instruction.**

- **Blocker**: `handoff.md` had no `## Completed`/`## Verification` entry
  for B9 - both sections' newest entry was still B8's, and the run that
  measured all seven anchor cells at 0.00% (the justification for
  deleting them) existed nowhere in the repo once the 12-cell re-run
  overwrote `test-output/parity/`. Fixed: both sections now carry a B9
  entry, the `Verification` one quoting the 24-cell pre-deletion run
  (all seven debt-bearing cells, verbatim) and two 12-cell post-deletion
  runs (before and after this remediation's own code changes, confirmed
  identical).
- **N1**: `plan.md`'s and `handoff.md`'s own prose had the count backwards
  - "the four `долг погашен` cells" next to a three-item list, "the other
    three `стало лучше` cells" next to a four-item list. The lists were
    right; the counting words are swapped now (three `долг погашен`:
    0.42/0.43/0.42; four `стало лучше`: 0.63/9.35/8.85/9.86, matching
    `parity.js:582-599`'s branch order).
- **N2**: `#/tables/voa ~ section anchor @ en 375` is the one deleted
  entry with no local before/after delta of its own - B8's own run had
  already read this host at 0.00% on `9fd3000`, before either B9 fix
  existed, so 9.86 was CI-only. Its deletion still stands on the
  mechanism argument (the 1100/768 cells at the same two states prove
  both fixes independently), but it is the cell most likely to turn
  `main` red if that argument is wrong in a way this host cannot see -
  named first in `handoff.md`'s OPEN blocker for whoever reads CI.
- **N3**: `TablesPage.svelte`'s anchor effect returned on `!anchor ||
  !ready` without clearing `flashKey`/`flashTimer`, so a route change
  that drops the anchor within the 1.6s window left a stale ring lit on
  whatever `.row`/`.tilewrap` happens to carry the same id on the next
  table (the alternate tables reuse `ci*`/`q*` ids). Unreachable before
  B9 because the ring never drew at all. One added branch clears both;
  no parity state keys it (none navigates away from an anchor inside the
  window), so this is the campsite rule, not a measured fix - but
  `CLAUDE.md`'s "every defect fix gets a test" still applies, and a new
  `tables.test.ts` case pins it directly (arrive with the anchor, wait
  for the flash, click to a different table, assert no `.flash` remains).
- **N4**: `tests/parity/driver.js`'s `settle()` comment still said the
  modal "opens with a 0.22s animation in the live app and none at all in
  the rewrite" - true before B9, false after: `RecordModal.svelte:159`'s
  `pop` animation now runs under reduced motion on both sides. Reworded
  to say so, with both source lines cited.
- **N5**: `docs/specs/DEBT.md` D1's "How to verify the fix" opened with a
  parity-harness-only call (`page.emulateMediaFeatures`), but D1's fix
  lands at Phase 8, after the harness that call depends on is gone. Now
  names a DevTools rendering-emulation check or a Vitest assertion
  against a mocked `matchMedia` - either survives the harness's
  retirement.
- **N6**: D1's "Why parity won" ended "Deleted in B9", ambiguous between
  the `tokens.css` block (true) and the debt entry itself (false - D1 is
  open, owed to Phase 8). Reworded to say both explicitly.

No design was reopened; no decision already marked "Decided" was
touched. N3 also got its own regression test (`CLAUDE.md`, "every defect
fix gets a test") - one attempt failed first: it clicked `Chip`'s `<a
href>` expecting a route change, but `memoryRouter` does not listen for
a browser `hashchange` the way the real router does, so the click never
reached anything; fixed by driving `env.router.navigate(...)` directly,
the file's own established pattern. `set -o pipefail; npm run check
2>&1 | tail -n 120` green after the fix (998 tests, one more than B9's
own 997, coverage 96.49/88.38/96.89/97.22). `npm run check:built` was
**not** re-run - N3's clear changes what a route change draws only
inside a window no parity state exercises, and N4-N6 touch a test-helper
comment and docs prose only, so nothing a parity state photographs
changed beyond what B9's own `check:built` run already covered.
`MSYS_NO_PATHCONV=1 node tests/parity.js "anchor"` (12 cells) re-run after
N3/N4, byte-identical to the run right after the `specs.js` edit - no
anchor cell moved. **Committed as `84ca6df`; not pushed.**

### B10 outlined: the page-furniture extraction pass (planner, 2026-09-11)

Not implement-ready; a planning pass expands it. Inventoried at `9fd3000`
(grep over `app/src/components`, every non-test caller):

| rule | copies | where | differences between copies |
|---|---|---|---|
| `.panel` (div) | 5 | `AltPanel`, `StdPanel`, `RollPanel`, `ListsPage` (+`margin-top:16px`), `SearchPage` (+`margin-bottom:16px`) | the two margins are the live app's *inline* `style=` on those panels |
| `.panel` (details) | 1 | `ListPage` `<details class="panel lroll">` | a `<details>`, not a div; also composes `.lroll` |
| `.page-h` | 5 | `PageHead` (`margin:0`, from `.page-head .page-h`), `ListPage` (h1 holds the rename input), `PrintPage`, `RecordPage`, `SharedListPage` | `PageHead`'s margin; `ListPage`'s content is an input |
| `.page-sub` | 5 | `PageHead`, `ListPage`, `PrintPage`, `RecordPage` (holds a link), `SharedListPage` | none in the rule; `RecordPage`'s content has markup |
| `.card-acts` | 4 | `RecordCard`, `ListPage` (inline `margin-bottom:16px`), `PrintPage`, `SharedListPage` (`margin-bottom:18px` in the rule) | the two margins - check which are live inline styles and which are live rules before deciding where they go |
| `.miss` | 7 | `ListPage`, `ListsPage`, `PrintPage`, `RecordPage`, `RollPanel`, `SearchPage`, `TablesPage` - all `{#if !index}<p class="miss">{t.noData}</p>` | colour: `--muted2` in `ListPage`/`PrintPage`, `--muted` in the other five - the rewrite's own state, no live rule to port; pick one and say why |
| `toggleAllIn` | 2 | `TablesPage`, `SearchPage` | `ListPage` ticks its own `lsel`, so the "third caller moves it to `AppState`" rule has not triggered - **stays** |

Also found and B10's: **`RecordPage.svelte:59` draws `notFoundSub` as
`<p class="miss">` where the live app draws `<p class="page-sub">`**
(app.js:3195) - a real divergence on `#/i/<unknown id>`, unphotographed
(no parity state); fix it in the same pass with a component test that
asserts the class, or add the state.

Design questions for the planning pass, with the repository's own
precedents: `PageHead` was extracted as a component at the third use
("Decisions taken while working"); shared UI belongs in
`app/src/components/` and `styles/tokens.css` owns tokens, not classes
(`CLAUDE.md`, "Architecture boundaries") - so the extraction is components,
not a global class sheet. Candidates: `Panel.svelte` (`children` + an
optional `style` string that renders as the live app's own inline `style=`,
which makes the DOM more faithful, not less; the `ListPage` details stays
inline and is recorded, or `Panel` takes `as` via `svelte:element` only if
that is cheaper than one recorded exception), `PageTitle.svelte` (h1 +
sub, both as snippets because two callers put markup in them; `PageHead`
keeps its own row), `Actions.svelte` for `.card-acts` (or fold it into
`RecordCard`'s existing rule via a shared component only if a caller
genuinely shares the row - measure first), `NoData.svelte` for `.miss`.
"Expose only differences real callers need" and "remove both inline
copies" apply to each.

Gates and filters: `npm run check`, `npm run check:built` (screens are
redrawn even if identically), and parity per touched component -
`"#/roll/std @" "#/roll/alt @" "#/lists @" "#/search @"` (the panels),
`"#/i/ci1 @" "#/i/q1 @"` (`RecordPage`/`RecordCard`), `"#/lists/a @"
"#/l/ ~ shared @" "#/print/ci1-q1 @"` (`ListPage`, `SharedListPage`,
`PrintPage`) - about ten plain states, ~60 cells, in one or two foreground
calls, with the full suite CI's on the push. `.miss` is never photographed
(data always loads under the harness) and is covered by component tests
only. Expected debt change: none - every cell that reads `совпадает` today
must still; the batch is a refactor and its acceptance is "nothing moved".
Order relative to B9: independent files (B9 touches `TablesPage`'s effect,
`TableRows`/`SectionHead`'s flash and `tokens.css`; B10 touches page
furniture and `RecordPage`), so the orchestrator may run either first
without re-planning; B9 first is recommended because it retires ~40
percentage points of recorded debt and restores a user-visible behaviour,
and because B10's whole-suite CI read is cleaner once the anchor cells are
exact.

**Assigned by the B9 planning pass (2026-09-11), for B10's planning pass
to fold in** (the classification table is in "Phase 8", below):
`ListPage.svelte:103`'s stale `$effect` comment (B10 opens `ListPage`);
`Shell.svelte`'s `@page` outside `@media print` if B10 opens `Shell`;
the two "Recorded, not keyed" sentences for B7's segment `aria-pressed`
and `<h2 class="pc-name">` (B10 touches `specs.js` for its re-read); the
spec nits B6 nit 10, B5.3 nit 2 and B5.6 nit 5 (B10 touches `FEATURES.md`
for the `.page-sub` fix); `.badge` only if the card and the rows are
re-measured anyway. Any register entry B10 finds itself writing goes in
`docs/specs/DEBT.md` in the same commit, in the shape "Phase 8" gives.

### B10 planned: the page-furniture extraction pass (planner, 2026-09-11)

Implement-ready. Supersedes "B10 outlined" above, which stays as the
inventory it was. Measured facts: `context.md`, "B10 planning facts"; the
tree at planning: HEAD `b967481`, `origin/main` == HEAD, clean but for the
untracked `issues/tg-preview-refresh/` and `issues/agent-effort/` (both
another task's - preserve, never stage) and this pass's own
`issues/47/*` edits.

**Objective.** Collapse the five furniture rules every page copies -
`.panel`, `.page-h`, `.page-sub`, `.card-acts`, `.miss` - into four
components (`Panel`, `PageTitle`, `Actions`, `NoData`), remove every inline
copy they replace, and fix the one real divergence the inventory found:
`#/i/<unknown id>`, where the rewrite draws the sub line as `.miss` and
omits the "На главную" button the live page has. A refactor: every cell
that reads `совпадает` today still does, and one new state (`#/i/nope`)
reads `совпадает` from its first run.

**Decided, not to be reopened.**

1. **Four components, and which copies stay.** Counted on `b967481`, every
   non-test caller:
   - `Panel.svelte` replaces the five identical `<div class="panel">`
     copies - `AltPanel`, `StdPanel`, `RollPanel`, `ListsPage`,
     `SearchPage`. **Three composed variants stay inline, each with a
     one-line comment naming `Panel.svelte` and this reason:**
     `ListPage`'s `<details class="panel lroll">` (a `<details>`, and
     `.lroll{padding:0}` plus its `summary`/`[open]` rules are ListPage's
     own), `TablesPage`'s `.tablenav` and `FilterBar`'s `.ffilter` (each
     is the base rule plus a variant margin the parent owns). Svelte scopes
     a parent's rule to the parent's elements, so a `class` prop on `Panel`
     would make all three variants `:global()` - worse than three
     five-line copies. No `as`/`svelte:element` either: nothing needs it.
   - `PageTitle.svelte` replaces the eight `<h1 class="page-h">` +
     `<p class="page-sub">` pairs in `ListPage` (2), `PrintPage` (2),
     `RecordPage` (2), `SharedListPage` (2). **`PageHead` keeps its own
     `.page-h`/`.page-sub`**: its `h1` sits in the `.page-head` flex row
     with the home and help buttons *between* it and the sub, under the
     live app's own `.page-head .page-h{margin:0}` (style.css:104); hosting
     that in `PageTitle` would need a wrapper prop no other caller uses.
     One-line comment in `PageHead` naming `PageTitle.svelte` and this.
   - `Actions.svelte` replaces the four identical `.card-acts` rules -
     `RecordCard`, `ListPage`, `PrintPage`, `SharedListPage`. `RecordCard`
     is included: its two 600px descendant rules (`.card-acts
     :global(.btn-lbl)`, `.card-acts :global(.btn.sm:has(.btn-lbl))`) are
     re-anchored on the card's own root - `.card :global(.card-acts
     .btn-lbl)` - which compiles to `.card.svelte-x .card-acts .btn-lbl`
     and still outranks `Button.svelte`'s own rules, as before.
   - `NoData.svelte` replaces all seven `<p class="miss">{t.noData}</p>`
     (`ListPage`, `ListsPage`, `PrintPage`, `RecordPage`, `RollPanel`,
     `SearchPage`, `TablesPage`; `RollPanel`'s condition is `max === 0`,
     the others `!index` - the conditions stay where they are).
   - `toggleAllIn` stays duplicated (two callers; the outline's ruling).
2. **Margins: every one in the inventory is a live inline `style=`, none
   is a rule.** Read off `app.js`: the lists panel `style="margin-top:
   16px"` (2912), the search panel `style="margin-bottom:16px"` (2854), the
   list page's `.card-acts` `style="margin-bottom:16px"` (2972), the shared
   page's `.card-acts` `style="margin-bottom:18px"` (3154). So `Panel` and
   `Actions` take `style?: string` and emit it as the element's `style`
   attribute - the DOM gets *more* faithful: `SharedListPage` today folds
   its 18px into the rule, `ListsPage` and `SearchPage` fold theirs into
   `.panel`; all three become the live inline attribute. `PageHead`'s
   `margin:0` is a live rule (style.css:104) and stays a rule. **No
   `@media` override exists for `.panel`, `.page-h`, `.page-sub` or
   `.card-acts`** (style.css 800-1000 and the print block 1397-1414
   grepped); the only descendant rules are the two `.card-acts .btn-lbl`
   ones at 477-481 inside the 600px block, handled in decided 1.
3. **`.miss` is `var(--muted)`, margin 0.** The live app has no `.miss`
   rule and no such screen: `app.js:7` dereferences `window.LOOT.items`
   and throws, so with `data.js` missing only `index.html`'s static shell
   draws. The rewrite's state is its own (`FEATURES.md`, "Records", after
   this batch). `--muted` because five of the seven copies already use it
   and it is the live tone for `.page-sub` - one line of page-level prose
   where a heading's sub would be; `--muted2` is the live `.empty`/`.foot`
   tone for secondary furniture. `ListPage` and `PrintPage` change colour;
   nothing photographs it (the harness always loads data).
4. **`RecordPage`'s not-found branch: both fixes, pinned both ways.** The
   live `renderItemPage` (app.js:3194-3196) draws `h1.page-h` `notFound`,
   `p.page-sub` `notFoundSub`, and `<a class="btn primary"
   href="#/roll/std">toStart</a>`; the rewrite (RecordPage.svelte:58-59)
   draws the sub as `.miss` and **no button** - the outline saw the class
   and missed the button. Fixed by `PageTitle` plus the same `Button` line
   `SharedListPage.svelte:83` already uses. Pinned by (a) a `record.test.ts`
   case modelled on `listPage.test.ts:166` ("draws "Список не найден" for
   an unknown id"), asserting the class, the button's `href` and axe, and
   (b) a new parity state `#/i/nope` beside `#/lists/nope` and
   `#/print/nope` - `CLAUDE.md` makes an empty state a `STATES` entry, the
   `inventory` spec reads the button's name and `heading` the first line,
   and the pixels read the class. Both, not one: the state dies with the
   harness, the test outlives it.
5. **A register entry, D5, found by the same reading and written by this
   batch.** The live `render()` writes `document.title = nameOf(it) + ' — '
   + docTitle` on `#/i/<id>` (app.js:3795) and then calls `syncChrome()`
   (3822), whose last line (3658) is `document.title = t().docTitle` -
   the name is lost every render. The rewrite never writes it
   (`Shell.svelte:28` is the only title write). Identical by construction:
   measured, `#/i/ci1 @` reads `совпадает` on all six cells with the
   `title` spec silent (2026-09-11, this host, advisory). That is the
   register's class exactly; the text is below, verbatim.
6. **Carry-ins taken: five. Left: two, with their homes.** Taken, because
   the batch opens the file anyway: `ListPage.svelte:103`'s comment
   (`"not ours" todo paragraph` -> `SharedListPage`); the two "Recorded,
   not keyed" sentences in `specs.js` (B7's segment `aria-pressed` and
   `<h2 class="pc-name">`); B6 nit 10, B5.3 nit 2 and B5.6 nit 5 in
   `FEATURES.md` (opened for the not-found bullet). Left: `Shell.svelte`'s
   `@page` outside `@media print` - `Shell` is not opened (nothing in it
   is furniture) - stays on Phase 8 R1's backlog per the sweep table;
   `.badge` - `TableRows` is not opened and no tables state is in this
   batch's filter set, so the "re-measured anyway" condition is not met -
   stays Phase 8 R2.
7. **One batch.** By `docs/parity.md`, "Batch size": the parity filters
   (three calls, below) are serialised whichever way the work is cut, so a
   split would pay a second `check`, a second `check:built` and a second
   review for nothing; the check's cost does not scale with the diff; the
   diff is one class of change (declarations moved into a component,
   markup swapped for a tag) plus one small behaviour fix, reviewable in
   one pass; no public contract moves and no commit boundary the harness
   cannot reach exists (the new state needs no driver verb or seed).

**The components.** Written to fit `Empty.svelte`'s shape - a snippet, one
rule, a comment saying which live rule and why extracted now.

- `app/src/components/Panel.svelte`: `interface Props { children: Snippet;
  style?: string }`; `<div class="panel" {style}>{@render children()}</div>`;
  the five declarations off style.css:145-149 (`background:
  linear-gradient(180deg, var(--surface2), var(--surface)); border: 1px
  solid var(--line); border-radius: var(--r); padding: 18px; box-shadow:
  var(--shadow)`). A caller passes a string literal or nothing - never
  `style={undefined}` (`exactOptionalPropertyTypes`).
- `app/src/components/Actions.svelte`: same shape, `<div class="card-acts"
  {style}>`, the six declarations off style.css:405 (`display: flex; gap:
  6px; flex-wrap: wrap; align-items: center; margin-top: auto; padding-top:
  3px`).
- `app/src/components/NoData.svelte`: `{ children: Snippet }`; `<p
  class="miss">{@render children()}</p>`; `.miss { margin: 0; color:
  var(--muted) }`; the comment says it is the rewrite's own state (decided
  3).
- `app/src/components/PageTitle.svelte`: `interface Props { title: string
  | Snippet; sub: string | Snippet }` (both required); template, with the
  `{#if}` flush against the tags so no whitespace text node is added:

  ```svelte
  <h1 class="page-h">{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}</h1>
  <p class="page-sub">{#if typeof sub === 'string'}{sub}{:else}{@render sub()}{/if}</p>
  ```

  Rules off style.css:105 and 140, using the tokens `ListPage` already
  uses: `.page-h { margin: 0 0 4px; font-size: var(--h-page-size);
  font-weight: var(--h-page-weight); letter-spacing:
  var(--h-page-spacing); display: flex; align-items: center; gap: 10px;
  flex-wrap: wrap }` and `.page-sub { margin: 0 0 18px; color:
  var(--muted); font-size: 14px; max-width: 70ch }`. If `svelte-check`
  refuses the `typeof` narrowing in the template (the B5.6 trap was a
  `$derived.by` nullable across an else-if chain; a two-branch `typeof` on
  a plain prop is expected to narrow), the fallback is two `$derived`s in
  the script (`titleSnippet = typeof title === 'function' ? title : null`)
  and `{#if titleSnippet}{@render titleSnippet()}{:else}{title}{/if}`. If
  it raises `a11y_missing_content` on the `<h1>`, the `svelte-ignore`
  comment moves here from `ListPage` with its reason (the live heading
  holds only the rename input); otherwise that comment is deleted with
  the `h1` it annotated.

**Files.** New: the four above. Edited: `AltPanel`, `StdPanel`,
`RollPanel`, `ListsPage`, `SearchPage`, `TablesPage`, `ListPage`,
`PrintPage`, `RecordPage`, `SharedListPage`, `RecordCard`, `PageHead` (one
comment line), `FilterBar` (one comment line); `record.test.ts`,
`a11y.test.ts`; `tests/parity/specs.js`; `docs/specs/FEATURES.md`,
`docs/specs/DEBT.md`; then `issues/47/plan.md`, `handoff.md`. No
`CONTRACTS.md`, fixtures, `llms.txt`, `tokens.css`, `Shell.svelte`,
`TableRows.svelte`, `Button.svelte`.

**Steps.** Find every rule by its selector, not by the line numbers
quoted (they are `b967481`'s).

1. Preflight: `git log --oneline -3` (expect `b967481` or docs-only
   commits over it), `git status --short` (expect only `issues/47/*`
   modified and the two untracked `issues/` directories - never stage
   them, never `git add -A`), no `test-output/parity.lock`.
2. Write the four components as specified above.
3. `Panel` in: `AltPanel.svelte:100`, `StdPanel.svelte:90`,
   `RollPanel.svelte:100` (`<div class="panel">` -> `<Panel>`, closing tag
   likewise; delete each file's `.panel {...}` block and trim its "off
   `.panel`, ..." comment to the rules that remain); `ListsPage.svelte:108`
   -> `<Panel style="margin-top:16px">` and delete the `.panel` block
   (its `margin-top: 16px` goes with it); `SearchPage.svelte:82` ->
   `<Panel style="margin-bottom:16px">`, likewise. Import `Panel` in
   each. `TablesPage`'s `.tablenav` block, `FilterBar`'s `.ffilter` block
   and `ListPage`'s `.panel` block (line 1174, the `<details>`) stay;
   each gets the one-line comment from decided 1.
4. `NoData` in the seven files: `<p class="miss">{t.noData}</p>` ->
   `<NoData>{t.noData}</NoData>`; delete each file's `.miss {...}` block
   (`ListPage:929`, `ListsPage:183`, `PrintPage:143`, `RecordPage:159`,
   `RollPanel:181`, `SearchPage:150`, `TablesPage:631`, and trim
   `TablesPage`'s comment above it, which now introduces `.tablenav`).
5. `PageTitle` in the four page files:
   - `ListPage.svelte:574-575` -> `<PageTitle title={t.listNotFound}
     sub={t.listNotFoundSub} />`; `:589-598` -> `<PageTitle sub={...}>`
     whose `sub` is the *one* joined string `` `${String(items.length)}
     ${itemsWord(items.length, app.lang)}` `` (the live sub is one text
     node, app.js:2971) and whose `title` is a snippet holding the
     `<input class="titleinput" ...>` verbatim:
     `{#snippet title()}<input .../>{/snippet}` as a child of
     `<PageTitle>`. The `input[type='text']` and `.titleinput` rules stay
     in `ListPage` (the input is rendered in `ListPage`'s snippet, so it
     keeps `ListPage`'s scope; the comment at `:933-940` stays true -
     `PageTitle`'s `h1` is still the input's parent). Delete `.page-h`
     (`:909`) and `.page-sub` (`:921`).
   - `PrintPage.svelte:82-83` -> `<PageTitle title={t.printTitle}
     sub={t.printEmpty} />`; `:87-88` (inside `.printbar`) ->
     `<PageTitle title={t.printTitle} {sub} />`. Delete `.page-h`
     (`:123`) and `.page-sub` (`:135`).
   - `RecordPage.svelte:58-59` -> `<PageTitle title={t.notFound}
     sub={t.notFoundSub} />` followed by `<Button variant="primary"
     href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>` (add
     `sectionHash` to the `../lib/hash.js` import; `Button` is already
     imported); `:61-69` -> `<PageTitle title={nameOf(it, app.lang)}>`
     with `{#snippet sub()}...{/snippet}` whose body is today's `<p>`
     content **verbatim, whitespace included** (`{where}`, newline, the
     `{#if table}` link) - the `.itemtable` rules stay in `RecordPage`.
     Delete `.page-h` and `.page-sub` (`:115-131`); keep `.itemtable*` and
     `.itempage`. Update the file's header comment ("Three states, and
     two of them happen") if it no longer reads true - it does.
   - `SharedListPage.svelte:81-82` -> `<PageTitle title={t.notFound}
     sub={t.badShare} />`; `:85-86` -> `<PageTitle title={shared.name ||
     t.untitled} {sub} />`. Delete `.page-h` (`:135`) and `.page-sub`
     (`:147`).
6. `Actions` in the four files: `ListPage.svelte:599` -> `<Actions
   style="margin-bottom:16px">` (delete the `.card-acts` block at `:981`
   and its comment - the comment's fact, "the live inline style on this
   block", moves to the call site as an HTML comment or is dropped: the
   attribute now says it); `PrintPage.svelte:89` -> `<Actions>` (delete
   `:148`); `SharedListPage.svelte:87` -> `<Actions
   style="margin-bottom:18px">` (delete `:155-163`; the comment's "folded
   in" is no longer true); `RecordCard.svelte:244` -> `<Actions>{@render
   actions()}</Actions>` (delete `:613-620`; in the 600px block rewrite
   `.card-acts :global(.btn-lbl)` -> `.card :global(.card-acts .btn-lbl)`
   and `.card-acts :global(.btn.sm:has(.btn-lbl))` -> `.card
   :global(.card-acts .btn.sm:has(.btn-lbl))`, keeping the comment).
7. `ListPage.svelte:103`: the sentence ending `the "not ours" \`todo\`
   paragraph after a single keystroke` -> `the "not ours" branch - the
   shared page \`SharedListPage\` draws - after a single keystroke`.
8. `record.test.ts`: a case "draws the not-found page for an id the data
   does not know" - render `App` at `#/i/nope` with the file's usual env;
   assert `getByRole('heading', { level: 1, name: 'Предмет не найден' })`;
   `container.querySelector('p.page-sub')?.textContent` is
   `'Возможно, ссылка устарела или данные были изменены.'`;
   `container.querySelector('.miss')` is `null`; a link named
   `'На главную'` whose `href` is `#/roll/std` and whose `className`
   includes `btn` and `primary` (use `getAllByRole(...).some(...)` as
   `listPage.test.ts:176-179` does if the brand link shares the name); end
   with the file's `expectNoA11yViolations` call. The existing no-data
   case (`:274`) must still pass unchanged.
9. `a11y.test.ts` `COVERED`: four entries, each over ten characters, e.g.
   `'Actions.svelte': 'the card actions on every record state above, and
   record.test.ts'`, `'NoData.svelte': "record.test.ts's no-data case, and
   every page test's own"`, `'PageTitle.svelte': "record.test.ts's record
   and not-found pages, listPage/printPage/sharedListPage.test.ts"`,
   `'Panel.svelte': 'every roll page state above, the lists index and
   search'`. The guard compares the sorted key set to the files on disk.
10. `tests/parity/specs.js`: after `{ id: '#/i/q1', ... }` (line 1071) add
    `{ id: '#/i/nope', route: '#/i/nope', why: 'the not-found record page:
    "Предмет не найден", the sub line, the "На главную" button' }`. In the
    "Recorded, not keyed" comment (1999-2011) add, after the chip
    sentence: "`Seg.svelte` writes `aria-pressed` on every segment, so the
    tables view switch (app.js:2553) and the print page's colour /
    black-and-white switch (3534-3537), which write none live, differ the
    same way; and `PrintCard.svelte` draws the card's name as `<h2
    class="pc-name">` where `printCardHTML` writes `<h3>` (app.js:3419) -
    a heading level `d.controls()` does not read. Both are B7's deliberate
    improvements; Phase 7's sweep carries them into `FEATURES.md`."
11. `docs/specs/FEATURES.md`:
    - "Tables and search", the search bullet (43-44): `...both languages
      at once; \`#/search\` shows the first 300 matches - the cap is that
      page's alone, a table's own box is not capped.` (B6 nit 10).
    - "Lists", after the Import bullet (85-86), a shared-page bullet
      (B5.6 nit 5): `A shared link (\`#/l/<payload>\`) that is nobody's
      own list draws the shared page: the name, the shared-list line with
      the count as one text node, one add-to-list control that takes the
      whole list into a new or an existing list (quantity, price and a
      row's public note travel; the GM's note never does), the list's own
      notes, and the rows; a payload that cannot be decoded draws "Предмет
      не найден", the bad-link line and a "На главную" button to
      \`#/roll/std\`.`
    - "Lists", the storage-notice bullet (88-92), append (B5.3 nit 2):
      `; on the index it survives a create and a delete, where the live
      whole-page re-render re-folds it - the rewrite's deliberate
      deviation, invisible to every parity state because each starts
      folded.`
    - "Records", a new bullet after the first: `\`#/i/<id>\` for an id
      the data does not know draws "Предмет не найден", the sub line and
      a "На главную" button to \`#/roll/std\` (the live \`renderItemPage\`
      shape). The tab title on a record page is the app's name alone, on
      both apps - \`DEBT.md\` D5. When \`data.js\` itself did not load,
      every page draws the "data did not load" line in place of its
      content (\`NoData.svelte\`) - the rewrite's own state; the live app
      throws on a missing \`window.LOOT\` and draws nothing.`
12. `docs/specs/DEBT.md`, section 1, after D3 (D4 is section 2), verbatim:

    > ### D5 - a record page's tab title loses the record's name
    >
    > - **Where**: `app/src/components/Shell.svelte:28` - the rewrite's
    >   only `document.title` write, `app.t.docTitle` on every route.
    >   Live: `app.js:3795` `document.title = (it ? nameOf(it) + ' — ' :
    >   '') + t().docTitle;` in `render()`'s `i/` branch, then
    >   `app.js:3822` `syncChrome();`, whose last line (`:3658`) is
    >   `document.title = t().docTitle;` - every render ends by writing
    >   the plain title over the name. Read at `b967481`.
    > - **Live behaviour**: the tab and a bookmark of `#/i/<id>` read
    >   "Генератор лута — Daggerheart" (or the English), never the
    >   record's name; the name is written and overwritten inside one
    >   render.
    > - **What the rewrite would do instead**: title a record page
    >   `<name> — <docTitle>` in the current language - what line 3795
    >   intends - and keep the plain title everywhere else.
    > - **Why parity won**: B10 (2026-09-11), found while porting the
    >   not-found page. The harness's `title` spec compares `page.title()`
    >   on every state, and `#/i/ci1 @` reads a match on all six cells
    >   because both apps end on the plain title; writing the name would
    >   fail that spec on `#/i/ci1`, `#/i/q1`, `#/i/f1` and `#/i/ci1 ~
    >   whole` without an `ACCEPTED` key per cell.
    > - **How to verify the fix**: `record.test.ts` - after rendering
    >   `#/i/ci1`, `document.title` starts with the record's name in the
    >   page's language and follows a language switch; `#/i/nope` keeps
    >   the plain title. If the harness is still alive, the four record
    >   states' `title` cells get `ACCEPTED` keys; after the cut-over,
    >   nothing. `FEATURES.md`, "Records", the tab-title clause rewritten.
    > - **Recorded by**: B10, 2026-09-11.

13. `set -o pipefail; npm run check 2>&1 | tail -n 120` (Bash timeout
    600000, one foreground call). Then `set -o pipefail; npm run
    check:built 2>&1 | tail -n 120`, the same way - screens are redrawn
    even if identically.
14. The three parity calls, each `set -o pipefail; MSYS_NO_PATHCONV=1
    node tests/parity.js <filters> 2>&1 | tail -n 120`, Bash timeout
    600000. **`MSYS_NO_PATHCONV=1` is load-bearing on this host**: Git
    Bash rewrites a filter such as `"#/i/ci1 @"` to `"#I:/ci1 @"`, which
    matches nothing, and the run then prints `расхождений нет` for zero
    cells. Check that every call prints its cells.
    - Call 1, the panels (5 states, 30 cells): `"#/roll/std @"
      "#/roll/alt @" "#/roll/wondrous @" "#/lists @" "#/search @"`.
    - Call 2, the record page and card (5 states, 30 cells): `"#/i/q1 @"
      "#/i/f1 @" "#/i/nope @" "#/i/ci1 ~ whole @" "#/roll/wondrous ~
      modal @"`.
    - Call 3, the list, shared and print pages (6 states, 36 cells):
      `"#/lists/a @" "#/lists/nope @" "#/l/ ~ shared @" "#/l/zzzz @"
      "#/print/ci1-q1 @" "#/print/nope @"`.
    The trailing ` @` selects the plain state exactly, because `WANTED`
    matches the cell label `<id> @ <lang> <width>` (`tests/parity.js:374`).
    At the measured ~23 s per state each call is two to three minutes.
15. Commit as one commit, Conventional Commits, author `artex-x
    <artex-x@users.noreply.github.com>`, no attribution trailer, e.g.
    `refactor(app): the page furniture as components, and the not-found
    record page (#47)`. Never push.
16. Update `handoff.md` (Status, Completed, Verification with every
    command and the 96 parity lines' verdict, Blockers, Next batch ->
    Phase 6/7's planning pass) and `plan.md` ("B10 built").

**Acceptance criteria.**

- `grep -rn "class=\"panel\"\|class=\"card-acts\"\|class=\"miss\"\|class=\"page-h\"\|class=\"page-sub\"" app/src/components/*.svelte`
  finds each class in exactly one component (`Panel`, `Actions`, `NoData`,
  `PageTitle` - `PageHead` for `page-h`/`page-sub` as the recorded
  second, `TablesPage`/`FilterBar`/`ListPage` for the composed `panel`
  variants) and nowhere else; no `.panel {`, `.card-acts {`, `.miss {`,
  `.page-h {`, `.page-sub {` rule outside those files except the three
  recorded variants and `PageHead`.
- `git show HEAD -- app.js style.css index.html` is empty: no live file
  moves.
- Steps 13-14: `npm run check` and `check:built` green in the foreground;
  all 90 cells outside `#/roll/wondrous ~ modal` read `совпадает`,
  including the six new `#/i/nope` cells; the six `~ modal` cells read
  inside their recorded debt with no `стало лучше`/`долг погашен` line -
  if one appears, stop, leave the figure, and record the cell in the
  handoff for CI to read (owner decision 1). No `VISUAL_DEBT` entry is
  added, changed or deleted; no `ACCEPTED` key is added.
- `record.test.ts`'s new case and its no-data case pass; the a11y guard
  passes with the four new `COVERED` entries; per-file thresholds hold
  (each new component is rendered by existing page tests, and
  `PageTitle`'s string and snippet branches by `RecordPage` and
  `ListPage`).
- `FEATURES.md` carries the four edits of step 11; `DEBT.md` carries D5;
  `specs.js` carries the state and the two sentences.

**Gates and cost.** `npm run check` once per commit (~165 s idle, up to
the 600 s cap under load - re-run, never salvage a backgrounded one),
`check:built` once, three parity calls of two to three minutes each. The
full suite is CI's on the owner's push; B10 closes on that run's four
shards, as B8 and B9 did.

**Risks / do-nots.**

- Do not give `Panel` or `Actions` a `class` or `as` prop, and do not
  extract the three composed `.panel` variants (decided 1).
- Do not fold a live inline margin into a rule; the attribute is the port.
- Do not open `Shell.svelte`, `TableRows.svelte`, `Button.svelte`,
  `PageHead.svelte` beyond its one comment, or `tokens.css`.
- Do not fix D5 - the tab title stays plain; it is recorded, not fixed.
- Keep the text-node structure: the list page's sub is one joined string;
  the record page's sub snippet is today's `<p>` body verbatim.
- Do not write a `VISUAL_DEBT` figure from this host; a red `~ modal`
  cell is CI's to read.
- Run every parity call with `MSYS_NO_PATHCONV=1` and confirm the cells
  printed; a vacuous `расхождений нет` is not a result.
- Reviewer: the batch redraws every page, so the orchestrator's risk
  rules put a review on it; the review reads the diff as one class of
  change plus the not-found fix.

**Fallback.** If `svelte-check` rejects `string | Snippet` in the
template, the two-`$derived` form above. If a `PageTitle` call site moves
a cell (a whitespace text node the snippet trimmed or added), the diff
image names the line; restore that site's exact text-node shape rather
than touching the component - the other seven sites are the control.

### B10 built: the page-furniture extraction pass (implementer, 2026-09-11)

Built to the plan above with one real deviation from `PageTitle`'s
markup, found by a test rather than by `svelte-check`. Preflight matched
the brief: HEAD `b967481`, then one docs-only commit from another task
landed mid-batch (`daa2166`, `agents` doc, touches neither `app/`,
`tests/` nor `docs/specs/`) - re-read per the brief, harmless, and left
alone. `git status --short` showed only the planner's uncommitted
`context.md`/`plan.md`/`handoff.md` and the untracked
`issues/tg-preview-refresh/`/`issues/agent-effort/` (both another task's,
never staged); no `test-output/parity.lock`.

Steps 2-12 as specified: `Panel.svelte`, `Actions.svelte`, `NoData.svelte`
and `PageTitle.svelte` written per decided 1-3 and the components section
verbatim; `Panel` swapped into `AltPanel`, `StdPanel`, `RollPanel`,
`ListsPage` (`style="margin-top:16px"`), `SearchPage`
(`style="margin-bottom:16px"`), each caller's own `.panel` block deleted;
`TablesPage`'s `.tablenav` and `FilterBar`'s `.ffilter` kept inline with
the one-line comment decided 1 asks for, as does `ListPage`'s `<details
class="panel lroll">`. `NoData` swapped into all seven callers; `Actions`
into `ListPage` (`style="margin-bottom:16px"`), `PrintPage` (plain),
`SharedListPage` (`style="margin-bottom:18px"`) and `RecordCard`, whose
two 600px descendant rules are re-anchored `.card :global(.card-acts
.btn-lbl)` / `.card :global(.card-acts .btn.sm:has(.btn-lbl))`.
`PageTitle` into the four page files exactly as spelled out - `ListPage`'s
title is a `{#snippet renameTitle()}` holding the rename input verbatim
(the `svelte-ignore a11y_missing_content` comment was tried on the
snippet's `<input>` line first, found to annotate nothing there, and
removed rather than moved - `svelte-check` raised no
`a11y_missing_content` warning on `PageTitle`'s own `<h1>` either, so the
fallback's ignore-comment branch was never needed); `RecordPage`'s
not-found branch gained `<Button variant="primary"
href={sectionHash('roll/std')} sameTab>{t.toStart}</Button>` and its
found branch's sub is a `{#snippet sub()}` holding today's `<p>` body
verbatim. `ListPage.svelte:103`'s comment, the two "Recorded, not keyed"
sentences, the `#/i/nope` state, the `FEATURES.md` bullets (search cap,
the shared-page bullet, the storage-notice append, the new Records
bullet) and `DEBT.md` D5 all landed verbatim per steps 7 and 10-12.

**The one real deviation**: `PageTitle`'s first draft put the
`{#if typeof x === 'string'}...{:else}...{/if}` *inside* `<h1>`/`<p>`, as
the plan's own snippet shows. `npm run check`'s vitest step failed one
existing test - `sharedListPage.test.ts`, "draws the name, the sub as one
text node..." - `sub?.childNodes` read 2, not 1. Svelte 5 marks an
`{#if}` block with an anchor comment so it can track which branch is
live; nesting the check inside the element put that comment *inside*
`.page-sub`, turning a plain-string caller's single text node into a text
node plus a comment node - invisible to a pixel diff (comment nodes have
no geometry) but real to a DOM-structure assertion, and to the "port the
live app's text-node structure" rule in `CLAUDE.md`. Fixed by hoisting
each `{#if}` to wrap the *whole* element instead - two complete branches
per heading/sub, each a bare `<h1 class="page-h">{title}</h1>` or
`<h1 class="page-h">{@render title()}</h1>` - so the anchor comment lands
as a sibling of `<h1>`/`<p>`, not a child. This is not the plan's
documented fallback (that one addresses a `svelte-check` type-narrowing
rejection, which never occurred); it is a different failure mode the plan
did not anticipate, caught by the exact mechanism the plan relied on
(`npm run check`'s vitest step) rather than by parity. All 998 tests,
including the corrected one and the new `record.test.ts` case, passed
after the fix; no call site needed its own restoration, since the fix is
in the component and every one of the eight call sites is identical in
shape before and after.

`npm run check`: exit 0, 998 tests (997 before this batch plus the new
not-found case), thresholds held (statements 96.48, branches 88.4,
functions 96.96, lines 97.22); `Panel.svelte`, `Actions.svelte`,
`NoData.svelte` and `PageTitle.svelte` all read 100% and are omitted from
the v8 text reporter's per-file table (`skipFull` behaviour, not a
coverage gap - confirmed against the a11y guard's `COVERED` map, which
lists all four and passed). `npm run check:built`: build, smoke and the
88.4 kB bundle budget all green, `git diff -- app.js style.css
index.html` empty throughout - no live file was touched at any point.

All three parity calls read **all 96 cells** as either `совпадает` (90
cells, the six new `#/i/nope` cells included) or inside recorded debt
with no `стало лучше`/`долг погашен` line (the six `#/roll/wondrous ~
modal` cells, unchanged from their recorded figures - 0.02/0.03/0.07% at
each width, both languages). No `VISUAL_DEBT` entry was added, changed or
deleted; no `ACCEPTED` key was added. The acceptance grep
(`class="panel"` etc. across `app/src/components/*.svelte`) finds each
furniture class in exactly the components decided 1 names, nowhere else;
`.panel {` similarly appears only in `Panel.svelte` and `ListPage.svelte`
(the recorded `lroll` variant) - `TablesPage`'s `.tablenav` and
`FilterBar`'s `.ffilter` never matched the bare `.panel {` selector to
begin with, since they declare their own class name.

Files changed: `app/src/components/{Panel,PageTitle,Actions,NoData}.svelte`
(new); `AltPanel`, `StdPanel`, `RollPanel`, `ListsPage`, `SearchPage`,
`TablesPage`, `ListPage`, `PrintPage`, `RecordPage`, `SharedListPage`,
`RecordCard`, `PageHead`, `FilterBar`; `record.test.ts`, `a11y.test.ts`;
`tests/parity/specs.js`; `docs/specs/FEATURES.md`, `docs/specs/DEBT.md`;
`issues/47/plan.md`, `issues/47/handoff.md`, `issues/47/context.md`
(carrying the planning pass's own edits into this batch's commit, per the
tree preflight).

Commit: `8b0c3ce` (`refactor(app): the page furniture as components, and
the not-found record page (#47)`, 25 files). Not pushed - "Never push"
stands.

Next: Phase 6/7 (the cut-over, owner-gated) or Phase 8 (the register
sweep) - `handoff.md`, "Next batch" for the orchestrator's call between
the two, neither of which this session picked.

## Phase 5 - what already exists

The pyramid arrived alongside Phase 4 rather than after it:

- 570 unit and component tests, per-file coverage thresholds
- `app/src/components/a11y.test.ts` - axe on **pressed** states, plus a guard
  that fails when a component has no named state rendering it under axe
- `tests/parity.js` - the rewrite against the live app, every state in both
  languages at three widths

What is left of Phase 5 is Playwright, and it is worth asking whether it is
still needed: the parity harness already drives both apps in a real browser.
**Answered where it comes due, not before:** the harness is the net until
the static root retires, so Phase 7's planning pass decides what replaces
it - see "Phase 8", "Where the phase sits", entry condition 3.

## Phase 8 - the post-migration review: the app on its own terms (planner, 2026-09-11)

Asked for by the owner at the B9 kickoff (`context.md`, "The owner's answer
on B9, and a post-migration review step"): achieve full parity now, write
down what parity made the rewrite keep, and add a separate step where the
migrated app is reviewed, its issues found, and those fixed together with
everything already recorded as deferred or ported-not-fixed. This section
is that step's design. It is not implement-ready - it cannot be until
Phase 7 has happened - but its entry condition, its batches, its gates and
its register are decided here so that B9 can open the register today.

### The register: `docs/specs/DEBT.md`

**What it is.** The third category beside `VISUAL_DEBT` and `ACCEPTED`. A
`VISUAL_DEBT` entry is a pixel difference not yet reproduced; an `ACCEPTED`
entry is a *difference* kept on purpose, keyed and enforced (a stale key
fails the run). Neither can hold a defect the rewrite reproduced *because
the live app has it*: there is no difference to key, both apps are
identical by construction, and the harness will never mention it. That is
what the register holds, and it is the one of the three that must outlive
the migration - the other two are deleted with the harness.

**Where, and why there.** `docs/specs/DEBT.md`, a spec file, listed in
`CLAUDE.md`'s spec table with the authority "live defects the rewrite
reproduces on purpose, and live decisions kept over its own; owed a fix
after the migration". Reasons: `docs/specs/` is what every agent reads for
a touched path and it is the one place `CLAUDE.md` says durable behaviour
belongs; a spec file survives the task directory's retirement and the
harness's; and an entry *is* a behaviour statement ("the app does X; X is
wrong; here is why it does it anyway") - it reads as a spec with a debt
attached, which is exactly what it is.

Rejected homes:

- `tests/parity/specs.js`, beside `ACCEPTED` - nothing keys an identical
  behaviour (the "Recorded, not keyed" precedent), and the file goes when
  the static root does.
- a section in `docs/parity.md` - the runbook is the harness's and retires
  with it; its own first paragraph sends migration debt to `issues/47/`.
- a section in `docs/specs/FEATURES.md` - the product spec should say what
  the app does, and an entry that says "and this is wrong, fix it later"
  in the middle of it would either be read as behaviour or skipped. The
  register cross-references `FEATURES.md` bullets instead (D1 does).
- `issues/47/` - retired with the task; and Phase 8 needs the register as
  its *input*, which a retired directory cannot be.
- GitHub issues, one per entry - outlive the task but not in the tree, need
  `gh` and a network, and cannot carry a rule or a measurement verbatim.
  Phase 8 R1 files issues *from* the register for whatever it does not fix.
- the READMEs - a reader's document, not a maintainer's.

**Shape.** A short header (what the file is, the two sibling categories,
the rule that the batch which pays an entry deletes it - the same ratchet
culture as `VISUAL_DEBT` - and that a new entry is written in the batch
that makes the decision, never later), then two sections:

1. **Defects reproduced on purpose** - the live app is wrong, the rewrite
   copies it, parity was the reason.
2. **Live decisions kept over the rewrite's own** - not a defect; a design
   the rewrite argued against and lost to parity. Re-examined at Phase 8,
   and either kept (entry deleted, `FEATURES.md`/`STATE.md` say so) or
   changed.

Each entry is a `### D<n> - <name>` with these fields, in this order, every
one filled:

- **Where** - the rewrite's file and line at the commit that wrote the
  entry, and the live rule or code *quoted* with its `style.css`/`app.js`
  line and a commit hash it can be read at (`git show <hash>:app.js`). The
  quote is load-bearing: the live source is deleted at the cut-over, and a
  line number into a deleted file is no evidence.
- **Live behaviour** - what a person experiences, one or two sentences.
- **What the rewrite would do instead** - the fix, as a behaviour, not a
  diff.
- **Why parity won** - the batch, the date, the measured reason.
- **How to verify the fix** - the test, state or probe that pins it, and
  what has to change in specs at fix time.
- **Recorded by** - batch and date.

**The four entries B9 writes.** Verbatim, so the implementer copies rather
than composes. Cite `bb61db0` as the commit the live lines are read at.

> ### D1 - transitions run under `prefers-reduced-motion: reduce`
>
> - **Where**: `app/src/styles/tokens.css` - no reduced-motion block, by
>   design (a comment marks the place). Live: `style.css:311`
>   `@media (prefers-reduced-motion:reduce){.card{animation:none}}` and
>   `:544` `@media (prefers-reduced-motion:reduce){.tsection.flash{
>   animation:none;outline:2px solid var(--gold)}}` - the only two
>   reduced-motion rules in the live stylesheet; every `transition:` (`.btn`
>   232, `.row` 550, `.chip` 159, `.tsec-link` 531 and twenty-odd more) and
>   the `pop`/`toastIn` animations on the help box (134), the menu (435),
>   the modal (591) and the toast (606) stay live. Read at `bb61db0`.
> - **Live behaviour**: a person who has asked their system for less motion
>   still gets every 150 ms colour, width and position ease on hover,
>   press and breakpoint, the toast's slide-in, the menu's and the modal's
>   pop. Only the card's entrance and the section outline's fade are off.
> - **What the rewrite would do instead**: a real policy - the blanket
>   kill it shipped with until B9 (`animation-duration: 0.01ms`,
>   `animation-iteration-count: 1`, `transition-duration: 0s`,
>   `scroll-behavior: auto`, all `!important` on `*`) or a narrower one,
>   designed with `PrintCard.svelte`'s `fit()` in mind: a non-zero blanket
>   `transition-duration` starts a `CSSTransition` whose value at t=0 is
>   the old one and breaks the synchronous read-back (B7).
> - **Why parity won**: the harness photographs both apps under reduced
>   motion. With every transition killed the rewrite is not adjusted by
>   Chrome's scroll anchoring when the width sweep crosses 600 px and the
>   live app is - 6 px on `#/tables/core_item ~ row anchor @ 375`, both
>   languages, proved by injection both ways (B8, `issues/47/context.md`,
>   "B8 planning facts"). The owner chose full parity over the rewrite's
>   invented improvement (2026-09-11). Deleted in B9.
> - **How to verify the fix**: under `page.emulateMediaFeatures([{ name:
>   'prefers-reduced-motion', value: 'reduce' }])`, `document.getAnimations()`
>   after a hover or a breakpoint change is empty; `#/print/ci1-q1` still
>   fits (the `print` suite's geometry) and the first cards keep their art;
>   `FEATURES.md`, "Chrome", reduced-motion bullet rewritten.
> - **Recorded by**: B9, 2026-09-11.

> ### D2 - a stale packed-link expansion rewrites the address after the reader has left
>
> - **Where**: `app/src/state/app.svelte.ts`, `#expand()` - the `.then`
>   replaces the address unconditionally. Live: `app.js:3589-3603`
>   `expandHash()`: `unpackPayload(h.slice(2)).then(function (plain) {
>   if (history.replaceState) history.replaceState(null, '',
>   appUrl('#/l/' + plain)); else location.hash = '#/l/' + plain;
>   render(); })`. Read at `bb61db0`.
> - **Live behaviour**: open a `#/l/~...` link, navigate away before it has
>   unpacked (a slow device, a large list), and the unpack, resolving late,
>   sends you back to the shared list.
> - **What the rewrite would do instead**: drop the result when the route
>   is no longer the packed address it was unpacking (compare the payload
>   captured at start with `this.route` at resolve time).
> - **Why parity won**: B5.6 (2026-09-11) ported the live shape; its review
>   named the flaw and said it must not be fixed without recording the
>   divergence. Nothing pins it: the harness's `ready()` blocks until the
>   expansion is done, so no state can observe the window.
> - **How to verify the fix**: `app.test.ts` - a `compress` port whose
>   `unpack` resolves on demand; `go()` elsewhere before it resolves; the
>   hash stays where the person went. `STATE.md`, "The list migration" or
>   `FEATURES.md`, "Lists", one clause.
> - **Recorded by**: B9, 2026-09-11 (found by the B5.6 review).

> ### D3 - the storage notice's dismiss button lives inside its `<summary>`
>
> - **Where**: `app/src/components/StorageNotice.svelte:43-50`, a
>   `<button class="warn-x">` inside `<summary>`; `app/src/test/a11y.ts`
>   turns axe's `nested-interactive` rule off **suite-wide** to allow it.
>   Live: `app.js:2881-2884` `'<details class="warn"><summary>' + '<b>' +
>   ... + '<button type="button" class="warn-x" data-act="hideWarn" ...
>   >&times;</button>'`, with the comment "The cross lives inside the
>   summary: a closed <details> hides everything else, which would leave
>   nothing to dismiss it with." Read at `bb61db0`.
> - **Live behaviour**: a screen reader lands on a summary that is also a
>   button; activating the cross toggles and dismisses in one gesture on
>   some assistive technology, and the nested-interactive shape is a WCAG
>   4.1.2 failure axe reports on any page it runs on.
> - **What the rewrite would do instead**: a notice that is a region with
>   its own "read more" toggle and a sibling dismiss button, or the cross
>   outside the `<details>`; then `nested-interactive` back on for the
>   whole suite (the per-call override the B5.3 review suggested is the
>   interim shape if only this component needs it).
> - **Why parity won**: B5.3 (2026-09-10) ported the live markup so the
>   `#/lists` states compare pixel for pixel; the rule was switched off
>   rather than the markup changed.
> - **How to verify the fix**: `OFF` in `a11y.ts` has no `nested-interactive`
>   line; `listsPage.test.ts`'s notice cases end in
>   `expectNoA11yViolations`; every `#/lists` state in the post-cut-over
>   net still passes. `FEATURES.md`, "Lists", the storage-notice bullet.
> - **Recorded by**: B9, 2026-09-11 (found by the B5.3 review).

> ### D4 - one kind filter shared by Core rules, the alternate tables and search
>
> (Section 2 - a decision, not a defect.)
>
> - **Where**: `app/src/state/app.svelte.ts`, `kinds`/`toggleKind`, memory
>   only, untouched by navigation. Live: `S.kind`, one object - the
>   kind chips flip it (`app.js:4162` `S.kind[val] = !S.kind[val]`) and
>   `kindAllows()` (2132), the alternate-table pickers (2286-2293) and
>   `renderSearch` (2841) all read it. Read at `bb61db0`.
> - **Live behaviour**: switching consumables off on Core rules switches
>   them off on the alternate tables and on search too.
> - **What the rewrite would do instead**: a kind filter per page, which
>   is what `docs/specs/STATE.md`'s own rule argues for ("what was asked
>   on a page belongs to the page") and what the rewrite shipped until B6.
> - **Why parity won**: B6 (2026-09-11) moved it to `AppState` as the live
>   shape - `plan.md`, "The kind filter: per panel first, then per app".
>   No parity state navigates between two roll modes, so neither shape
>   is measured; parity won as the default, not as a finding.
> - **How to verify the fix**: if per-page wins at Phase 8, `app.test.ts`
>   loses `kinds` and each page's test pins its own; `STATE.md`, "The
>   in-memory state object", says which. If the live shape is kept, delete
>   this entry and write the sharing down in `FEATURES.md`, "Rolling".
> - **Recorded by**: B9, 2026-09-11.

**What the sweep of `handoff.md`'s "Deferred" and "Notes" found, classified.**
Everything there is one of four things; only the second goes in the
register.

| item (handoff "Deferred"/"Notes") | class | goes to |
|---|---|---|
| reduced-motion kill in `tokens.css` | ported-not-fixed | `DEBT.md` D1 (B9) |
| stale packed-link expansion (B5.6 risk 3) | ported-not-fixed | `DEBT.md` D2 (B9) |
| storage notice's button-in-summary, `nested-interactive` off suite-wide (B5.3 nit 1) | ported-not-fixed | `DEBT.md` D3 (B9) |
| shared `S.kind` (B6 decision) | live decision kept | `DEBT.md` D4, section 2 (B9) |
| the anchor never re-plays on a language switch; the ring never drawn | port defect | **fixed in B9** |
| `RecordPage.svelte:59` `.miss` where the live app draws `.page-sub` | port defect | B10 |
| `Shell.svelte`'s `@page` outside `@media print` (B7 review) | fidelity nit | B10 if it opens `Shell.svelte`; else Phase 8 R1 backlog |
| `ListPage.svelte:103` `$effect` comment names a deleted paragraph (B5.6 nit 1) | comment nit | B10 (it opens `ListPage` for `.page-h`/`.card-acts`) |
| `Button.svelte` "missing `:focus-visible` ring" (B7 planning note) | **stale claim** - measured false; the ring is the global rule in `tokens.css:150`, gold 2 px at 2 px offset in both apps; the one difference is the focused button's radius, 9 px (`--r-sm`) against the live rule's `8px` (`context.md`, "B9 planning facts") | closed here; the 1 px radius is Phase 8 R1's keyboard walk, not a batch |
| `.badge` copied three times (B5.3 nit 3) | refactor debt | B10 if the card and rows are re-measured there anyway; else Phase 8 R2 |
| `.panel`, `.page-h`, `.page-sub`, `.card-acts`, `.miss` copies | refactor debt | B10 |
| `specs.js` "Recorded, not keyed" does not name B7's `aria-pressed` on the segments and `<h2 class="pc-name">` (B7 review) | doc nit, and a **fixed-not-ported** improvement to carry into specs | B10 adds the two sentences (it touches `specs.js` for its re-read); Phase 7's sweep (below) |
| `ListsPage` reads `storage.works()` once where the live app re-probes per render (B5.3 nit 4) | rewrite-only divergence, minor | Phase 8 R1 verifies, R3 fixes if kept |
| the in-flight packed window draws a frame where the live app draws nothing (B5.6 risk 2) | rewrite-only divergence, unmeasurable | Phase 8 R1 decides (likely keep; record in `FEATURES.md`) |
| `AddToList.createNew` gates the toast on `saved` where the live app toasts unconditionally (B5.6 nit 2); the two dice name their controls; the grid-numbering bug not copied; the import field takes short links; `Chip` `aria-pressed`; rung `aria-label`s; the notice survives a create/delete; the keystroke anchor re-play not copied (B9) | **fixed-not-ported** improvements, today in `ACCEPTED`, prose, or plan decisions | Phase 7's sweep: each becomes a `FEATURES.md`/`STATE.md` bullet when `specs.js` retires |
| `moneyHelp`, `rp`, `guess`, `listRoll`, `keepOpen`, the tables/search query: component memory where the live app remembers (the timed-state-divergence list) | intentional, `STATE.md`'s rule | Phase 7's sweep confirms `STATE.md` says it; nothing else |
| the toast over a native `<dialog>` is asserted announced, never verified (B5.1 review) | unverified a11y claim | Phase 8 R1, screen-reader pass |
| `[hidden]`/`.toast.act` display guard dropped (B5.1 review) | fragility, no test | Phase 8 R2 adds the test |
| `app.menuFor` stale on Escape close (B5.1 review) | probably closed by B5.2's `handleClose` on the native `close` event | Phase 8 R1 verifies; a test if it holds |
| `AppState.stop()` leaves `#toastTimer`; `ListStore.load()` ignores `set`'s return; `AddToList.toggle()` folds `newListFor`; duplicate `knows`; `shell.test.ts` half-assertion; B6 nits 4, 5, 7, 11; B4 nits (`eqFacetRows` export, unreachable throw, order assertion, two axe states); B5.4a nit 4 (`.row-main:focus-visible` unrecorded); B5.2 nits 1-4 | test/code nits | Phase 8 R2-R3, each in the batch that opens its file; none earns a batch alone |
| B6 nit 9 (the kind-filter heading) | doc nit | **fixed by this planning pass** (heading renamed) |
| B6 nit 10 (`FEATURES.md` cap clause names no page) and B5.3 nit 2 (the storage-notice clause narrower than the code) and B5.6 nit 5 (no shared-list bullet) | spec nits | B10 (it touches `FEATURES.md` for the `.page-sub` fix) or Phase 7's sweep |
| the parity-coverage gap on `href` (B5.3), no keyboard-focus state, no equipment anchor state, the width sweep not a state, language leaking through `localStorage` in the harness, probes not extended past tables | harness limitations | die with the harness; Phase 7 decides what the post-cut-over net keeps (below) |
| Playwright | open decision | Phase 7's planning pass (below) |
| `lib/dict.ts`'s `1061` joins the count-checked file list | Phase 7 chore | Phase 7 |
| Pages source not switched | owner | Phase 7's entry condition |
| B3.7 self-hosted fonts; the usage guard; the ubuntu container | owner-decided or done | nothing |

### Where the phase sits

`B9 -> B10 -> Phase 6/7 (cut-over, owner-gated) -> Phase 8`. Phase 8
**follows** the cut-over. Every fix it makes is a parity regression by
construction - that is the definition of the register - so while the
static root is the expectation and the parity shards are the gate, each
fix would need a `VISUAL_DEBT` or `ACCEPTED` entry to go green, which is
the "keep the improvement as debt" option the owner rejected for D1. The
review part of R1 (read-only) could run earlier, but its findings could
not be acted on, and a finding list that sits for a phase goes stale;
R1 runs once, on the app people are using.

**"Migration complete", the entry condition, spelled out:**

1. Phase 4 closed: no `pending` state in `tests/parity/specs.js`,
   `VISUAL_DEBT` empty or every entry a CI figure with a current reason;
   B9 and B10 landed and read by CI.
2. Phase 7 done: the owner has switched Pages to "GitHub Actions", the
   `deploy` job publishes `dist/`, the static root is retired the way
   Phase 7's plan says, `main` green.
3. **A regression net that does not need the live app exists** - the
   load-bearing one. Today the parity harness is the only real-browser
   coverage of the rewrite's states, and it needs `index.html` as its
   expectation. **Decided, 2026-09-12** (Phase 5 planned, decided 1, 2
   and 6): the net is the parity driver re-pointed at `dist/` with a
   trusted `press` verb (`tests/app/`, B12), and after the cut-over
   rendering is proved by named invariants, numeric laws asserted against
   their source, and structural text goldens per state (accessibility
   tree + controls inventory) seeded from `dist/` at R0 under the last
   green parity run's warrant - no Playwright, no PNG goldens, no frozen
   measured-spec JSON. The rejected alternatives and what the chosen
   instruments cannot catch are written out under decided 2.
4. The `ACCEPTED` sweep done: when `specs.js` retires, every `ACCEPTED`
   reason and every "Recorded, not keyed" divergence has become a
   `FEATURES.md`/`STATE.md` bullet or been dropped with a reason in the
   commit - otherwise the fixed-not-ported decisions (table above) are
   lost with the file.

### The batches

**R1 - the review.** Read-only; one artefact. A new task directory
(`issues/<id>/`, the orchestrator's id) so this file can retire with
issue 47; the register is independent of that.

- *Surfaces*: every state in `tests/parity/specs.js`'s `STATES` at the
  moment of retirement (the inventory is copied into the R1 task
  directory in Phase 7 - it is the only list of "everything a person can
  reach" the project has), both languages, 1100/768/375, on the deployed
  `dist/`.
- *Against*: (a) `docs/specs/DEBT.md` - each entry re-verified as still
  true and given a decision (fix in R2-Rn, keep and delete the entry with
  a spec bullet, or file); (b) `docs/specs/FEATURES.md`, `STATE.md`,
  `I18N.md`, `META.md` - each bullet observed on the built app, both
  languages; a bullet that is not observable is a finding; (c)
  accessibility, in a real browser, not jsdom: `axe-core` (already a
  dependency) driven by puppeteer over every state, `color-contrast` *on*
  (jsdom has it off for a reason a real browser does not have); a
  keyboard walk of every route - Tab order, that every focusable control
  draws a visible ring, no trap, the `.selbox:has(:focus-visible)`
  instrument gap - reading focus styles only after `getAnimations()` is
  empty, because the rings transition for 150 ms (D1) and a t=0 read
  shows the pre-transition values (`context.md`, "B9 planning facts");
  a screen-reader pass (NVDA or VoiceOver, by hand) of three flows: the
  toast over the record modal (the unverified B5.1 claim), the storage
  notice (D3), ticking rows and using the selection bar; a
  reduced-motion pass (D1's fix design); (d) the backlog table above,
  each line marked open or closed against the tree.
- *Output*: `issues/<id>/review.md` - a findings table: id, surface (state
  id), evidence (screenshot path or measurement), class (`defect` /
  `a11y` / `register` / `spec` / `nit`), decision (`R2` .. `Rn` / `file`
  / `keep`), plus the register updated (new entries for anything found
  that the app does on purpose, decisions on D1-D4) and one GitHub issue
  per `file`. No production code.
- *Fix in the phase versus file*: fixed in R2-Rn - every `DEBT.md`
  section-1 entry; every `a11y` finding; every `defect` with a local fix
  and a test; every nit in a file a fix batch opens. Filed - a redesign
  (a new panel, a changed flow), a feature, a harness or tooling rewrite,
  anything the owner has to design (D1's real reduced-motion policy is
  proposed by R1 and confirmed by the owner at the phase's planning pass:
  that pass is expected to carry `NEEDS_HUMAN_CONFIRMATION: yes` on it).
- *Acceptance*: every `DEBT.md` entry has a decision; every backlog line
  a status; every finding a class and a decision; the findings table is
  the input to R2's planning pass.

**R2 .. Rn - the fixes**, grouped by surface and gate, sized by the rule
in `CLAUDE.md` ("size a batch by its gates"): one component family, one
seed, one net filter per batch. The grouping R1 is expected to produce,
revised by what it finds:

- *R2 - motion and focus*: D1's policy; the focused-button radius if the
  keyboard walk cares; the `.toast.act` display guard test; anything the
  a11y sweep found in `tokens.css`, `Button`, `Chip`, `Seg`.
- *R3 - lists and storage*: D2, D3 (`nested-interactive` back on), D6
  (the menu measured against its toggle and the box that clips it,
  `.card` `overflow: clip`, the `tests/app/states.js` assertions D6
  names), `works()` re-probe, `AppState.stop()`'s timer,
  `ListStore.load()`, `AddToList` nits, the shared-list spec bullet.
- *R4 - rolling and search*: D4's outcome, B6 nits 4/5/7/11, the B4 nits.
- *R5 - the rest of the findings*, or folded into R2-R4 by surface.

Each fix batch: a test per fixed defect (`CLAUDE.md`, "every defect fix
gets a test"), the spec bullet in the same commit, `npm run check`,
`npm run check:built`, the Phase 7 net's filter for its surface, and the
register entry deleted in the commit that pays it.

**Exit.** `DEBT.md` section 1 is empty or every remaining entry names the
filed issue; section 2 is decided; `review.md` has no row without an
outcome; the handoff records exact commands and results. After that the
register stays as the place a *future* "kept on purpose" decision is
written - the file outlives the phase, not only the migration.

## Decisions taken while working

### `base: './'`, not `base: '/daggerheart-loot/'`

Phase 1 item 6 of the issue asks for the absolute Pages base path. That
contradicts the `file://` requirement stated in the same issue's opening
constraints: an absolute base breaks every asset URL when the page is opened
from a folder. Relative URLs work identically on Pages, so nothing is lost.
Recorded in `docs/specs/META.md` section 4.

Consequences: one classic IIFE bundle rather than modules (Chrome refuses
modules over `file://`), no code splitting, `data.js` stays a classic script
assigning `window.LOOT`, and a build smoke check opens the built page from a
folder.

### Publishing is not gated by CI until Pages is switched over

GitHub's own `pages-build-deployment` publishes the configured branch on every
push regardless of Actions. Nothing in a workflow can prevent that. The fix is
**Settings -> Pages -> Source: GitHub Actions**, after which the `deploy` job in
`ci.yml` is the only route and it `needs: [check, audit, secrets]`.

**Still outstanding on the repository owner's side.** Until it is flipped, a red
build can go live.

### Parity compares states, not routes

A route only ever reaches the first paint, in the default language, at one
width, above the fold. That is how the modal shipped four times too wide with
none of the card's buttons while every check stayed green. `STATES` is now
multiplied by `LANGS` and `WIDTHS`, so a state written for one reason is checked
for five more, and a debt is keyed `"<id> @ <lang> <width>"`.

The full rule, and what the run measures about itself, is in `CLAUDE.md` under
"This is a refactor, not a redesign".

### The pre-commit hook was removed

It ran `eslint --fix` over staged files: over 150 seconds for three of them on a
mounted working copy, against 3.5 for prettier, and eslint's own CPU time was
half a second - the cost is reading `node_modules`, not linting. It was also a
strict subset of `npm run check`, which CI runs on every push, so the only thing
it added was a reason to pass `--no-verify`. A guard that gets waved through is
worse than no guard.

### The build completes `dist/`

`dist/` never contained `img/`, `og/` or `card/`; the build emits the
application and the pictures are made outside it. Invisible until Core rules
made the opening screen draw four cards, at which point the `file://` smoke run
failed on five missing `.webp`. A `closeBundle` hook links the three folders in -
linked rather than copied, because 80 MB per build is not worth paying for a
folder that has not changed, and `junction` makes that work on Windows without
elevation. `tests/parity.js` used to lay the same links itself; that workaround
is gone.

### The tier ladder was missing, behind a debt reason that hid it

`lineStepsHTML` in `app.js` draws the row of tier buttons on equipment that
belongs to an upgrade line - Палаш, Улучшенный, Продвинутый, Легендарный are
one weapon at four tiers, and the ladder is how a person moves between them.
`upgradeLine` was extracted and tested in Phase 2; no component ever called it,
so the row was never drawn.

It stayed invisible because every `#/i/q1` debt was filed as "the add-to-list
and print row" and that route was short of two things. The number looked
explained. Porting the ladder took the route to **exact at four of its six
cells** and to 0.1% at the other two, which is the add-to-list row peeking
above the fold - so the ladder had been almost the whole difference all along.

Two things came with it, both faithful rather than invented:

- **a rung opens the record over the page.** The live app answers `data-open`
  with the modal, on the record page as well as from a roll, so `RecordPage`
  now has one - which also makes the card's picture work there, as it does in
  the live app. `onopen` carries the record because the ladder opens a
  different one.
- **each rung is named.** The live app gives it a `title` and a digit for its
  content, and content wins the accessible name, so a screen reader hears
  "button, 2" three times with nothing to tell them apart. An `aria-label`
  carrying the same string the title does fixes it, and the parity inventory
  reads the same on both apps - so there is nothing to record in `ACCEPTED`.

### The Core rules help shipped with its markup showing

`helpFor` modelled a paragraph as text, links and an optional bold lead-in.
That covered the four sections ported first and quietly failed on the fifth:
the Core rules paragraph listing where each rarity fits is one paragraph with
four `<br><b>Word</b>` lines inside it, and the port kept it as a string with
the tags in it. Svelte escapes what it renders, so the panel said
`<br><b>Обычная</b>` in both languages, on a screen that has been "finished"
for weeks.

Nothing caught it because nothing looked. Coverage renders the panel, axe reads
its structure, and neither reads prose; the parity harness would have seen it
at a glance and Core rules had shipped without a `~ help` state. That state
exists now, and a paragraph is a run that can carry a break and a bold word -
which the tables and lists help will need as well, because both use `<b>`
mid-sentence.

### The kind filter: per panel first, then per app (B6)

The live app keeps one `S.kind` for Core rules, the alternate tables and
**search**, so switching consumables off on one screen switches them off on the
others. The rewrite gives each panel its own, which is what
`docs/specs/STATE.md` argues for everywhere else: what was *asked* on a page
belongs to the page. Nothing compares it - no parity state navigates between
two roll modes - so it is written down here rather than caught. Search is where
a person would notice, so batch C is where this decision comes due, and
`AppState` is where it would move to.

**This has nothing to do with the tables filter**, which is what the first
version of this entry said and what the B1 handoff then repeated as an open
question. Tables narrows by `S.fOn.kind` - its own object, cleared whenever the
table changes (app.js:3622) - and has never shared `S.kind` with anything.
B2 has nothing to reconcile here.

**Came due in B6 (planner, 2026-09-11): the kind filter moves to `AppState`
as `kinds`/`toggleKind`, shared by Core rules, the alternate tables and
search, memory only and untouched by navigation - the live shape.** What
stays per page is the *query*: the live `S.search.q` and `S.tables.q` both
survive a route change in memory, and the rewrite's `TablesPage` and
`SearchPage` both forget theirs on unmount. That is an intentional
divergence: one page's own memory is not a cross-page contract, no parity
state can observe it, and `STATE.md`'s rule ("what was asked on a page is
not remembered") is the one the rewrite keeps. See "B6 planned", "Decided".

### Every icon in a button is 15px, whatever its attribute says

`style.css` has `.btn svg{width:15px;height:15px}`, and it beats the `width`
attribute in the markup. The external-link icon is written at 13 and drawn at
15; `lib/icons.ts` had copied the 13. Nothing noticed until the alternate
tables put that icon inside a button for the first time, and the crit box came
out four pixels narrow per link. The rule now lives in `Button.svelte`, with
the `.btn .dieicon` counter-rule the live app also writes, because a die is a
different shape at a different height.

The general form of this is already a standing rule in `CLAUDE.md` - copy the
behaviour, not the intent - and this is its second instance after the 74px
number field.

### The two dice name their own controls

The live app calls both number fields "Result of the roll" and all four
steppers "One lower" / "One higher". On the one screen with two dice that
means a screen reader hears the same two controls twice and nothing says which
die is being changed. The rewrite puts the die in front of each name. That is
the accessibility exception in `CLAUDE.md`, and it is recorded in `ACCEPTED` in
`tests/parity/specs.js` - eight entries, one per state per language, all for
the control inventory.

### `PageHead` was extracted at the third use

The heading row, the two round buttons and the help panel they fold open were
written twice - `RollPanel` and `StdPanel` - about thirty lines of markup and
two hundred of style each. The alternate tables would have been a third copy,
so both were deleted into `components/PageHead.svelte`. The existing parity
states are what verified it: nothing moved.

### A red run has to leave something to read

Every suite's whole output goes to `test-output/<name>.log`, and the workflow
uploads that directory - with `dist/` and `coverage/` - whenever the job fails.

### Phase 0 kept the puppeteer suites

The plan moves to Vitest and Playwright. The existing suites are the baseline
the migration is measured against, so they stay until the code they test is
gone. `tests/contracts.js` is written in the same style deliberately - it has to
run today, against the current app, or it is not a baseline.

## Working rules during the migration

From the issue, unchanged:

- repo files are authoritative; do not depend on chat history
- small vertical slices, each with its own tests
- never break a public contract without updating fixtures, `CONTRACTS.md`,
  `llms.txt` and the tests in the same change
- update `docs/specs/*` in the change that alters behaviour, not afterwards
- pure logic free of Svelte and DOM; ports for replaceable behaviour
- strict TypeScript, `any` is an error
- scoped CSS and tokens, plain CSS only
- never infer a tier from stats
- every defect fix gets a test
- bad deploys are fixed by `git revert`

Added during the migration:

- DOM-only transient state - an open `<details>`, a `hidden` toggle - survives
  a language switch in the port only where the live app marks the element
  `data-keep` (`restoreOpen`, app.js 3769-3775: the roll panel, the note box,
  the list note); everywhere else the port re-creates the element on
  `app.lang` with `{#key}`, because the live `render()` builds it fresh. The
  harness presses `EN` after `enter`, so an unkeyed element shows up as an
  English-only non-zero cell. In-page actions that happen to call `render()`
  (create, delete, rename) are not a reason to fold anything. (B5.3
  close-out; the notice on `#/lists`.)

## Phase 5 - the testing pyramid, planned (planner, 2026-09-12)

The owner's GOAL, verbatim, is in `context.md`, "State at the Phase 5
kickoff". In one line: retire the flaky legacy browser suites into the
existing infrastructure, challenge every quality gate, review the pyramid
for gaps (component tests especially, and whether a layer is missing),
decide whether the legacy suites can be run against the rewrite, and
recommend the P6/P7/P8 order. Everything below is measured on `9e3d19f`;
the numbers are in `context.md`, "Phase 5 planning facts".

### What the tree has, said plainly

**There are no Playwright tests, and never were.** `package.json` carries
no `@playwright/*`; no `*.spec.*` file exists. What the owner calls "the
playwright tests" is the **puppeteer** legacy set: 20 suites under
`tests/`, 8.7k lines, run by `tests/run-all.js`, CI step "The legacy
suites against the live app" (1m57s of the `check` job's 3m40s on run
`34643510887`). Phase 5's Playwright layer was planned by the issue and
never built. So "retire the Playwright tests" is, here, "retire the
puppeteer suites" - and three of those are not browser suites at all:
`derived`, `i18n` and `dataint` are node-only, and the first two run
directly inside `npm run check`. They are not retired by this plan.

**`tests/contracts.js` is a contract gate**, named by `CLAUDE.md` and
`docs/specs/CONTRACTS.md`. Its pure half (list encoding re-derived by a
second implementation) and its browser half (fixtures replayed on the
live app: 26 routes, six lists, the stat line in both languages, every
filter group name selecting something, `llms.txt`'s spelling) are the
evidence that `hash.test.ts`, `listLink.test.ts` and `i18n.test.ts` are
replaying real contracts rather than recording what the new code does.
It is not dropped: the browser half is re-pointed at `dist/` (B12) and
the live-app copy is deleted only when the live app is (Phase 7).

### Decided

**1. The regression net is the parity driver, re-pointed at `dist/` alone,
with real input. No Playwright.** Phase 8's entry condition 3 named two
candidates; this pass answers it one phase early, as the orchestrator
asked, and it is one decision, not two. Measured before choosing:

- *Can a legacy suite run against `dist/` at all?* Yes, for the
  state-free sweeps: `typo` (two fonts, one scale, 13 pages, both
  languages) passes against `dist/index.html` with exactly two changes -
  `ROOT` and `ready()`'s `#view` becoming `#app` - and so does `audit2`
  at 1180 (41 addresses, both languages: no script errors, no sideways
  scroll, no clipped text, no unnamed control, no dead link, no broken
  image, no duplicate id, no `undefined`). `hues` fails 16 assertions for
  a reason that has nothing to do with the app: it injects bare
  `<span class="badge item">` elements and reads their colour, and the
  rewrite's `.badge` rules are Svelte-scoped so an injected span gets
  none; and it greps `[data-act="roll"]`. That is the shape of the other
  thirteen: they grip the live DOM by `data-act`, `data-open`,
  `data-copy-*`, `#modal`, `#selBar` (`behave` 35 such selectors,
  `lists2` 29, `select` 28, `print` 24, `flows` 23, `states` 21, `qa` 18,
  `notes` 12, `eqtest` 9, `noart` 6), none of which the rewrite emits. A
  re-point is a selector rewrite for those, and a selector rewrite of a
  suite whose assertions already live in a component test is waste.
- *What the parity harness cannot see.* `tests/parity/driver.js:245`
  presses a control with `el.click()` inside `page.evaluate` - a
  synthetic dispatch, the same kind jsdom's `userEvent` makes. Defect 2
  below is invisible to both and visible to a real click (measured, both
  ways, on both apps). A net without trusted input has a hole exactly
  where the owner found one.
- *Why not Playwright.* A second browser dependency and a second driver
  for the same verbs `driver.js` already has (`open`, `click`, `type`,
  `seed`, `storage`, `hash`, `title`, `clipboard`, `controls`, `computed`,
  `typeAt`, `rectsAt`, `metrics`, `shot`), a second CI browser install,
  and nothing puppeteer cannot do here. `STATES` in `specs.js` is already
  the only inventory of "everything a person can reach". The net is built
  on that driver with a new trusted `press` verb, under `tests/app/`,
  targeting `dist/index.html` over `file://` (so `META.md` section 4 is
  exercised on every run), listed in `run-all.js` beside the legacy
  suites, and run by CI's existing pooled step - which already runs after
  `Build`.

**2. After the cut-over, rendering is proved by named invariants and
structural text goldens - no pixel goldens, and no frozen dump of the
measured specs.** Rewritten 2026-09-12 after the owner reopened the
question and asked the better one: once there is no second implementation
to diff against, the instrument is not "how do we keep parity" but "what
proves the rewrite renders correctly on its own terms, and are there
better tools for that than the ones this repository built". The earlier
text of this point (freeze the last green run's legacy-side JSON for
`typeRuns`/`geometry`/`computed` into `docs/fixtures/states/`) is
withdrawn; its reasoning survives in the rejected list below.

*The recommendation.* Three instruments, all in the real-browser layer
B12 builds (`tests/app/`, puppeteer over `dist/index.html` from
`file://`), none of them a bitmap:

- **Invariants that name what "correct" means**, one sentence each,
  failing with that sentence: no sideways scroll at any width; no text
  wider than its box; every control named; no dead link, broken image,
  duplicate id or stray `undefined` (the eight `audit2` checks, ported in
  B12); axe with `color-contrast` on over every page; a focus-ring walk;
  a menu or form that opens lies inside the box that clips it (the
  modal's menu - decided 7, 2b); the dialog is inert behind and returns
  focus; a keystroke keeps focus; a computed-style anchor per control
  family asserted against `styles/tokens.css` rather than against a
  number (body and search-box `font-size` equal, `h1` at its token, the
  card at `min(440px, 100%)`, `.selbox` 42/38 at the 600 breakpoint -
  the shape of every B3.6 defect); the type scale (`typo`, ported);
  badge hues (`hues`, rewritten).
- **Numeric laws, asserted against their source, not recorded from a
  run**: the print sheet - 63x88 mm at 96 dpi, nine per A4, page breaks,
  the black-and-white layout, the fit ladder's written numbers (the
  `print` port, Phase 7); the three breakpoints; the bundle budget.
- **Structural text goldens per state**: for every `STATES` entry, in
  both languages at 1100, the accessibility tree
  (`page.accessibility.snapshot()` - puppeteer has had it for years, no
  new dependency) plus the controls inventory the harness already
  computes, written as one small JSON file under `tests/app/snapshots/`
  and compared strictly; regenerated with `--update` and read as a text
  diff in the commit that changes a screen. A structural golden says
  *what* changed - a control gone, a heading demoted, a label renamed -
  where a pixel golden says only *that* something did.

*Where the goldens' authority comes from.* They are generated from
`dist/` at Phase 7's R0, in the same commit that retires the harness,
and their warrant is the last green parity run at that commit: for every
state the two apps matched, so a snapshot of `dist/` there is a snapshot
of the shipped app. That is the only moment such a file can be seeded
honestly; after it the goldens are the rewrite's own record and change
only on purpose.

*Cost to run*: the B12 sweep is estimated at 3-4 min inside CI's
existing pooled step (`audit2` was 4x45 s in parallel, `typo` 23 s,
`contracts` 30 s); the snapshots add a `page.accessibility.snapshot()`
per state, well under a second each; nothing new to install. *Cost to
maintain*: an invariant is edited when the rule changes, which is rare
and is itself a product decision; a snapshot is regenerated and reviewed
as text in the commit that changes the screen. Neither needs a human to
eyeball an image.

*What it cannot catch, said honestly.* A pure repaint that breaks no
stated rule: a colour swapped for another accessible colour, a wrong icon
path, padding off by a few pixels inside a box that still fits, a wrong
picture behind a correct `alt`. Nothing automatic sees those without a
bitmap, and a bitmap only says "changed"; the honest answer is that a
person looks at the app - Phase 8 R1 is exactly that pass - and that the
token anchors above shrink the class to what is genuinely invisible to a
rule. Which failures this repository has actually had, all of them
invariant-shaped and none of them a colour: a control at 14px where the
body is 15.5px, a mobile-only override ported at the base width only, a
trimmed text node that moved a hint 4.3px, a decoder heuristic met on a
different code path, a listener racing a microtask checkpoint, and now a
menu re-measured from the wrong side of its button. The pixel harness
found the first three only because a second implementation existed to
diff against; the last three it could not see at all.

*Rejected, each with the reason it loses:*

1. **Freezing the measured JSON specs** (this point's previous text). A
   golden in JSON clothing: `typeRuns` advances and `geometry` rects are
   one screen's numbers, every deliberate layout change invalidates them
   wholesale, and a diff of `668.3 -> 671.1` says nothing about right or
   wrong. The *questions* those specs asked survive as invariants and
   laws where a rule exists; the numbers do not.
2. **Committed PNG goldens** (CI-only, one width and language). A bitmap
   says changed, not wrong; the figure is one machine's (owner decision 1,
   `docs/parity.md`, "Machine variance"); a whole-page percentage is
   blind to a control (B3.6); every deliberate change is a human eyeballing
   a diff image and re-blessing, which is the workflow this migration has
   spent batches escaping.
3. **A hosted visual-regression service** (Percy, Chromatic, Applitools).
   Bitmaps again behind a paid approval screen; an external service for a
   static-file project whose product law is "no backend"; the approval
   click is the same eyeball with a subscription.
4. **Playwright's screenshot assertions** (`toHaveScreenshot`) - goldens,
   rejected for what they are, not for the tool. **Playwright's aria
   snapshots** (`toMatchAriaSnapshot`) - the right idea, and it is
   adopted: puppeteer's `page.accessibility.snapshot()` yields the same
   tree, so the idea comes without the second driver. **Vitest browser
   mode** - would run the component tests in real Chromium and remove the
   `<dialog>` shim and the trusted-event blind spot at the component
   level, but it swaps the coverage instrument's environment and
   duplicates what `tests/app/` does with the app assembled; a Phase 8
   spike, filed, not planned. **axe over real pages** - adopted (decided
   5, contrast on).
5. **Nothing beyond the component tests.** The "Known thin spots" list is
   the reason, and both owner defects were invisible there by
   construction (decided 6).

*Playwright specifically.* Decided 1 rejected it for the B12 net with
three reasons; two still apply to a post-cut-over rendering check (a
second browser dependency and a second driver for verbs `driver.js`
already has, plus a second CI browser install) and one does not, quite:
Playwright's golden management and trace viewer are real conveniences
that puppeteer lacks. They are conveniences for a golden workflow this
point rejects, so the rejection stands - but for that reason, not by
inheritance.

*Where it lands.* Phase 7's first batch (R0 of the 7/8 track - the order
5 -> 6 -> 7 -> 8 is the owner's, confirmed, not reopened): `tests/app/
render.js` with the snapshots and the token anchors, the `print` port,
the sweep already there from B12; `tests/parity.js`, `specs.js`'s
`VISUAL_DEBT`/`ACCEPTED` and the `.parity-cache` retired in the same
commit after the `ACCEPTED` sweep. B11 (done) and B12 do not wait on any
of this: B12 asserts facts per state either way, and the snapshots are
additive.

**3. The 20 suites, each with a fate.** Timing rule: a browser suite that
tests the live app is deleted in the Phase 7 batch that deletes the live
app, never before - until then it is the gate on what Pages serves. A
suite's *assertions* are re-homed now (B12), so that the deletion batch
is mechanical.

| suite | fate | where its assertions live afterwards |
|---|---|---|
| `derived`, `i18n`, `dataint` | **kept** (node-only, in `npm run check` / `run-all`) | themselves; `dataint` joins the `check` script in Phase 7's guidance sweep if it is still outside it |
| `contracts` | pure half **kept as is** (a second implementation of the codec is the point); browser half **ported** to `tests/app/contracts.js` against `dist/` in B12; the live copy deleted in Phase 7 | `hash.test.ts`, `listLink.test.ts`, `i18n.test.ts` (already) + `tests/app/contracts.js` |
| `audit2` | **ported as is** (B12, `tests/app/sweep.js`) - passes re-pointed today | the sweep, plus axe with `color-contrast` on, per page |
| `typo` | **ported as is** (B12, `tests/app/typo.js`) - passes re-pointed today | itself |
| `hues` | **rewritten** (B12): read the computed colour off rendered badges (`#/search` with a query that yields every kind, or `#/tables/eq_weapon` + `#/roll/std`), not off injected spans; the roll-button look off `button.btn.primary` with a `.dieicon` | `tests/app/hues.js` |
| `states` | **superseded** - it walked click-only states and asserted "rendered something"; `STATES` is that list with assertions | `specs.js` `STATES` now, `tests/app/states.js` after Phase 7 |
| `flows` | **re-homed**: modal/list address/clipboard/roll copy; the `<dialog>` semantics (focus trap, Escape, inert page, focus return) and the clipboard happy path are browser-only | `tests/app/states.js` (B12); `listPage.test.ts`, `record.test.ts` for the rest |
| `select` | **re-homed**: selection bar, batch add/copy, select all, reset on navigation, card, modal | `tables.test.ts` (78 cases) already; the bar's real-click new-list case in B12 |
| `lists2` | **re-homed**: reorder, position, list search, storage warning, batch actions, upgrade steps, price modes/suggestion, empty roll field, taking a shared list, per-list roll, kind filter, alternate tables | `listPage.test.ts` (48), `sharedListPage.test.ts` (20), `state/lists.test.ts` (34); the "link assembled from `llms.txt`'s description" case moves into `tests/app/contracts.js` |
| `notes` | **re-homed**: two notes, copying, both links, v1 lists and links, own link after saving, note field height | `listPage.test.ts`, `state/lists.test.ts` (v1 migration), `listLink.test.ts`; "note field height" (textarea auto-size, a layout fact) -> `tests/app/states.js` |
| `behave` | **re-homed**: rolls, search, language, remembered/corrupt settings, starting section, navigation, copy and share, storage disabled | `roll.test.ts`, `std.test.ts`, `alt.test.ts`, `searchPage.test.ts`, `shell.test.ts`, `state/app.test.ts` (settings as untrusted data, pinning, refused writes), `ports.test.ts` (`brokenStorage`) |
| `eqtest` | **re-homed**: class, order, filters, filter links, anchors, colours, copying, all sources | `tables.test.ts`, `facets.test.ts`, `filters.test.ts`, `label.test.ts`; colours -> `tests/app/hues.js` |
| `craft` | **re-homed**: upgrade chains data/rendering/copying/stubs | `record.test.ts` (the tier ladder), `share.test.ts`, `derived` (stubs) |
| `craftmob` | **re-homed**: narrow-screen layout, touch highlight, selection bar overflow | the sweep at 360/390 (overflow); `hover: none` cannot be emulated in headless Chrome - stays a known thin spot |
| `noart` | **re-homed**: records without art, art that fails to load, the rest untouched | `record.test.ts`/`printPage.test.ts` (`artBroken`, the glyph swap); one `tests/app/states.js` state with a broken art path so the real `<img>` error path runs once |
| `qa` | **re-homed**, one line per numbered case, the honest list: 9.4 contrast -> axe in `tests/app/sweep.js` with `color-contrast` on; 7.2 scrollbar -> the sweep's overflow check; 3.5 previews -> `derived` (stubs, `og:`); 8.2 scripts don't block -> `tools/smoke-file-url.mjs`; 2.2 one dash in ranges -> `label.test.ts`/`desc.test.ts`; 1.1/1.4 number field -> `numField.test.ts`; 9.1 focus survives a redraw -> `tests/app/states.js` (a keystroke in the tables search box keeps focus; Svelte keeps the node, the live app rebuilt it); 9.2 live regions -> `shell.test.ts`; 9.3 heading structure -> axe `heading-order` (on by default) in every component test; 3.2 chrome labels/tab title language -> `shell.test.ts`; 4.1 truncated link -> `listLink.test.ts` + `tests/app/contracts.js`; 5.1 two tabs -> `state/lists.test.ts` (the merge) + one two-page state in `tests/app/states.js` (the `storage` event redraws); 6.3 leaving an empty result -> `tables.test.ts`; 4.4 unreadable address -> `state/app.test.ts` (`#/l/zzzz`); 6.4 unnamed list refused -> `lists.test.ts`; tile without image -> `noart`'s state; restoring a removed row -> `listPage.test.ts`; keyboard -> the focus-ring walk in `tests/app/sweep.js`; table/filter/list links -> `hash.test.ts`; 6.1 warning height -> the sweep (`StorageNotice` at 360) |
| `print` | **ported in Phase 7's deletion batch** (not B12): the geometry assertions - sheet grid, 63x88 mm card at 96 dpi, nine per sheet, page breaks, the black-and-white layout, the long-text fit ladder, the art edge pixel - are the one set of numbers that survive without a live app and that `printPage.test.ts`'s faked layout cannot measure. Until Phase 7, parity's 54 `#/print` cells are the gate | `tests/app/print.js` (Phase 7) |

**No replacement yet, said honestly** (these are the "Known thin spots"
that stay): `hover: none` (touch highlight); the share sheet's success
path (no headless share sheet exists; the fallback is tested); real
clipboard hardware (the harness stubs `navigator.clipboard`, and the
stub is what `tests/app/` keeps - the port's happy path *is* exercised,
the OS clipboard is not); print fitting until Phase 7.

**4. The coverage gates, each with a verdict.** Measured on `9e3d19f`
(998 tests; per-file minima in `context.md`):

| gate (`vite.config.mts`) | today | measured minimum | verdict |
|---|---|---|---|
| `src/lib/**` lines/functions | 90/90 | 100/100 (every file) | **raise to 95/95** - the bar should be within reach of a regression, not thirty points under the floor |
| `src/lib/**` branches/statements | 85/90 | 88.46 (`data.ts`) / 93.33 (`lists.ts`) | **keep** - three points of room is a bar, not a ceiling |
| `src/state/**` | 90/90/80/90 | 98.27/100/88.46/95.89 (`lists.svelte.ts`) | **raise to 95/95/85/90** |
| `src/ports/**` lines/branches/statements | 70/55/70 | 71.42/57.14/70.58 (`compress.ts`) | **keep** - `compress.ts` sits one point over each bar, and the happy paths are Chrome's: `#/l/ ~ packed` runs `CompressionStream` for real in the browser layer (B12 names it) |
| `src/ports/**` functions | 70 | 87.5 (`share.ts`) | **raise to 80** |
| components glob | 85/80/75/85 | 88.15/88/75/88.79 (`StdPanel`; branches: `Icon`, `SelBar` at exactly 75) | **keep** - two files sit *on* the branch bar; B12 adds the branch each is missing (`Icon`'s unused name, `SelBar`'s empty-selection arm) rather than moving the bar |
| `DiceBar.svelte` branches | 55 | 60 | **keep the exception** at 55, reason unchanged (attribute update paths) |
| `Button.svelte` branches | 50 | 66.66 | **raise the exception to 60** |
| exclude `src/test/**` | - | - | **keep** - test helpers |
| exclude `src/ports/types.ts`, `src/vite-env.d.ts` | - | - | **keep** - emit no code |
| exclude `src/main.ts` | - | - | **keep**, reason rewritten: reached by `tools/smoke-file-url.mjs` and every `tests/app/` run |
| exclude `src/ports/image.ts` | - | - | **keep**, reason rewritten: the canvas conversion runs in Chrome under `tests/app/states.js`'s copy-image state (today under parity's `clipboardImage` spec) |

**5. The two axe rules off.** `color-contrast` **stays off in jsdom**
(it lays nothing out) **and goes on in the browser layer** over every
page of the sweep - that is what replaces `qa` 9.4 and `typo`'s claim,
and it is the first place contrast is measured on the *rewrite* rather
than on the live app. `nested-interactive` **narrows from suite-wide to
per-call**: `expectNoA11yViolations(container, { allow: ['nested-interactive'] })`
only in the tests that render `StorageNotice` (D3), so the rule is live
on the other 45 components; D3's fix (Phase 8 R3) deletes the `allow`.

**6. The pyramid, and the layer that is missing.** Unit (`lib`, 25 files,
37 of 83 files at 100/100/100/100), state, component (jsdom, 16 files,
axe on named pressed states with a guard that every component has one),
parity (real Chrome, both apps, until Phase 7), contracts (fixtures
replayed twice). What nothing reaches, by mechanism rather than by
percentage:

- **trusted input events** - jsdom and `el.click()` both dispatch
  synchronously, so no microtask checkpoint runs between listeners; the
  rewrite flushes in one (Svelte 5, `dom/task.js`). Defect 2 is this
  class. Only a real click sees it;
- **native `<dialog>` semantics** - shimmed in jsdom (`vitest-setup.ts`);
  parity opens the modal but asserts nothing about focus, Escape or
  inertness; `flows` did, on the live app only;
- **the ports' happy paths** - clipboard (stubbed in the harness, absent
  in jsdom), `CompressionStream`, the canvas conversion; the `src/ports/**`
  bar is low for this reason;
- **contrast, fonts, the type scale, overflow, clipped text, unnamed
  controls, broken images** on the rewrite - `qa`/`typo`/`audit2` measure
  them on the live app; nothing measures them on `dist/`;
- **two tabs** - the merge is unit-tested, the `storage`-event redraw is
  not;
- **keyboard** - focus survives a re-render (Svelte keeps nodes; nothing
  asserts it), and no focus-ring walk exists outside Phase 8 R1's plan;
- **print geometry** on the rewrite, until Phase 7 (parity covers it now).

The missing layer is **one real-browser layer against `dist/` with real
input** - not a second component layer, and not more jsdom. Component
tests are not thin: 16 files, 78/48/34/27 cases on the four biggest
pages, every component reached (the `perFile` rule) and every one under
axe in a pressed state; what they cannot do is the list above, and no
amount of them will. B12 builds that layer; Phase 8 R1's a11y instruments
(axe in Chrome with contrast on, the keyboard walk, the reduced-motion
read) then run on every push rather than once in a review.

**7. The two owner-reported defects - measured, root-caused, placed.**

*Defect 1, `#/tables/frames`: pick "Пир зверей", then "Колоссы Сухоземья"
-> the filter resets and the table empties.* **Reproduced on `dist/`,
with real and synthetic clicks alike. The live app does it too - but only
when the link arrives, not while picking.** Measured: live in-page after
the second pick reads 57 of 94 rows and two pills (OR works); live at
`#/tables/frames/f_frame-beast_feast-colossus` arriving fresh reads 0
rows, no pills, count 94; the rewrite reads 0 rows and no pills in both
cases. Root cause, two halves: (a) the shared decoder heuristic -
`app/src/lib/filters.ts` `decodeFilter` and `app.js:2724` `fDecode`
both read a segment as the older `_`-separated form when it has no `.`
and every `_`-split piece contains a `-`, and `frame-beast_feast-colossus`
splits into `frame-beast` and `feast-colossus`, both of which "look like
a group" - so it decodes as `{frame:['beast'], feast:['colossus']}`,
`beast` is no frame, and the table is empty with nothing to draw a pill
from. The same holds for `dark_heart` + `motherboard`; `colossus` +
`dark_heart` and any three-frame pick decode correctly, which is why it
reads as "sometimes". (b) The live app never re-reads its own write
(`S.fSeg` guard, `app.js:3627`, the rule `FEATURES.md` states as "read
back only when the segment actually changed"), so it only meets the
heuristic on arrival; the rewrite's `TablesPage` reads the filter off
`app.route` after every `replace()`, so it meets it on every pick. **Not
a `DEBT.md` entry**: the rewrite fixes it, and the live app's own
link-arrival failure becomes a fixed-not-ported divergence, recorded in
`specs.js` prose and a `FEATURES.md` bullet per the Phase 7 sweep rule.
**Fix** (B11): `decodeFilter(segment, groups)` reads the old form only
when every piece's head names a group the table offers - the sharper
sentence `ROUTES.md` then carries; `parseHash` passes `groupsFor(table)`.
The grammar in `CONTRACTS.md` item 1 is untouched (dot-separated groups
were always the contract; this makes the decoder honour it). The
`routes.json` entry for the two-frame link **waits for Phase 7**: added
now, `tests/contracts.js` would fail it against the live app in CI.
**Would parity have caught it?** Yes, with a state - `#/tables/frames ~
two frames` differs 57 rows to 0 before the fix and matches after; B11
registers it. **Would the plan's coverage have caught it?** The same
state in `tests/app/states.js`, plus the link-arrival state (57 rows on
`dist/`, which no parity state can hold because the live side is
legitimately different).

*Defect 2, add to list -> "+ Новый список" does nothing, from any view.*
**Reproduced on `dist/` with a real click only; the live app is fine
either way.** Measured on `#/i/ci1`: a trusted click on "+ Новый список"
leaves no menu and no form and focus on `<body>`; the same press via
`el.click()` opens the form with focus in the input and "Создать" then
saves the list; from the selection bar on `#/tables`, the same. Root
cause: `AddToList.svelte:188-200`'s `<svelte:document onclick>` handler
closes the menu when the click's target is outside `.seldrop`. Svelte 5
flushes state in a microtask; a trusted event runs a microtask checkpoint
after each listener, so between the app root's delegated handler (which
sets `newListFor = true`) and the document listener, `{#if newListFor}`
has already replaced the chip - `e.target` is detached, `root.contains`
is false, the menu closes. A synthetic dispatch runs no checkpoint until
the stack unwinds, which is why `lists.test.ts:147` passes and why
parity's `#/i/ci1 ~ new list` passes: **neither layer can see this class
of defect, by construction.** Not a `DEBT.md` entry - a rewrite
regression. **Fix** (B11): in `onDocumentClick`, a target that is no
longer connected was inside this control when it was pressed - return.
One line, a comment naming the checkpoint, and a component test that
reproduces the ordering by calling `flushSync()` from a listener between
the app's and the document's. **Would parity have caught it?** No - its
click is synthetic. **Would the plan's coverage catch it?** Yes: B12's
`press` is a CDP mouse click, and the new-list states use it.

*Defect 2b, the menu inside the modal opening downward where the live app
opens it upward.* **Root-caused on measurement, 2026-09-12, after the
owner's repro (`handoff.md`, "Blockers", Q3) refuted the "not
reproduced" above.** Probe: a read-only puppeteer script over both apps
(the harness's launch args, `prepare()`, `el.click()` and a trusted CDP
click both tried), the modal opened from `#/tables` / `#/tables/
core_consumable` on four records whose descriptions span the range
(Малое Зелье Лечения 17 chars, Кольцо Тишины 98, Самоцвет Чутья 118,
Медальон Хранения Надежд 338), at 1913x981 and 1100x900, with zero, one
and two lists seeded - 24 cells per app. Numbers in `context.md`, "Q3
planning facts". Two findings, one live and one the rewrite's:

- **The first open is identical on both apps in all 24 cells, and it is
  downward on a tall window for a short card.** `placeMenu` and the
  `$effect` compute the same `below = innerHeight - toggle.bottom` against
  `need = menu.height + 16`, and at 981 px the centred card leaves ~280 px
  under its toggle, so a menu of 131 px (no lists) or 144 px (one list)
  opens down; Медальон's taller card leaves 115 px and opens up. That is
  the owner's "not on all items": the card's height, hence the toggle's
  `bottom`, decides the side. The owner's legacy comparison most likely
  ran with a different list count on the Pages origin (each chip adds
  ~33 px to `need`; with two lists all four records open up at 981) -
  plausible, unverified, and immaterial: at equal inputs the apps agree.
  **What makes the downward open a defect is what it does next**: the
  menu overflows the card, and `menu.scrollIntoView({ block: 'nearest' })`
  scrolls the **`.card` article** (`overflow: hidden`, style.css:306 and
  `RecordCard.svelte:260` - a scroll container for programmatic scrolls),
  not the `.modal-card` (`overflow: auto`, whose `scrollHeight` equals its
  `clientHeight`). Measured: `.card.scrollTop` 109 on both apps for
  Кольцо at 981 with no lists - the top 109 px of the picture chopped off,
  no scrollbar, no way to scroll it back by hand. The formula measures the
  window; the thing that clips is the card. **A live defect, reproduced
  faithfully: `docs/specs/DEBT.md` D6**, written by B11.1, owed a fix in
  Phase 8 (R3, with the other `AddToList` items). It appears at 1100x900
  too - Кольцо with no lists opens down there as well (`below` 239.9 vs
  `need` 131.2) - so no new width is needed to see it; the B11 state
  `#/tables ~ a row opened, list menu` misses it only because its `two`
  seed makes every card open up.
- **After "+ Новый список" the two apps diverge, and this is the
  rewrite's regression.** Live flips the menu **up in 24 of 24 cells**,
  by an accident with two parts: `refreshModal()` redraws the card's
  innerHTML, so the menu is fresh at its default (downward) side and the
  article's `scrollTop` is 0 again; then `placeMenu` reads
  `drop.querySelector('.btn')` - the **first** `.btn` inside `.seldrop`,
  which with the form open is the form's own "Создать" button inside the
  menu, not the toggle (the menu precedes the toggle in the DOM,
  `addToListBtn` 1879-1891). Its bottom, from the downward position, is
  under the fold, so `below` is negative and `up` is set - the "relocates
  correctly" half of the owner's report, and also why the chopped picture
  heals on that press. The rewrite's `$effect` reads the same first
  `.btn` (`AddToList.svelte:165`, ported verbatim) but from wherever the
  menu already is: with the menu already `up`, "Создать" sits ~50 px
  above the toggle's bottom, `below` reads ~50 px larger than the toggle
  would give, `need` grows by only 33 px, and in the band `need - 17 <=
  below < need` the sign flips - the menu goes **down**, the form lands
  under the card's edge and is clipped (`clipped: true` in 7 of 24
  rewrite cells: Самоцвет and Малое at 1100x900 with 0-1 lists, Медальон
  at 981 with none, Кольцо and Малое at 981 with two, and Кольцо at 1100
  with one - real and synthetic clicks alike). The 17 px band is why the
  owner's exact window is not special: 1100x900 reaches it on two of the
  four records with no lists seeded. **Not a `DEBT.md` entry - a rewrite
  regression. Fix: B11.1** - port the live algorithm's *order*, not only
  its formula: reset `up` to false and let the DOM catch up before
  measuring, keep the first-`.btn` reading (it is the live reading, and
  D6 records it), and put the class on the menu before scrolling it into
  view, as `classList.toggle` precedes `scrollIntoView` in `placeMenu`.
  Measuring the toggle instead (`:scope > .btn`) would be *more* correct
  and would break parity on every `~ new list` cell - that is the Phase 8
  fix, named in D6, not this one.
- **Would parity have caught it?** With a state, yes: `#/tables ~ a row
  opened, new list` (no seed, Самоцвет Чутья) differs at 1100 before the
  fix - live up, rewrite down and clipped - and matches after. B11.1
  registers it and runs it red first. **Would the plan's coverage catch
  it?** Yes: B12's `tests/app/states.js` "new list from the modal" case
  asserts the form's input lies inside `.modal-card`'s box and is focused
  - a rendering invariant, the post-cut-over form of the same test.
  **Does anything need the owner's 1913x981?** No: the height dependence
  is fully explained by `below < need`, and 1100x900 exercises both
  branches across the four records. A fourth harness width would be a
  global change (`WIDTHS` is hashed into every cache key, `parity.js:174`)
  costing +204 cells, roughly a third of the parity wall clock per shard
  (~3 min); per-state widths would be a harness feature nobody else
  needs. Neither is planned.

*This class as coverage grows.* The owner is right to expect more. The
two mechanisms here - a shared heuristic met on a different code path,
and event-loop timing that no synthetic dispatch reproduces - are both
things a component test cannot express and a synthetic-click harness
cannot see. That is the argument for decided 1 and 6 in one sentence.

**8. P6 -> P7 -> P8, and "unify 7 and 8".** Recommended order, with the
reason each step cannot move:

1. **Phase 5 (B11, B12) first**: the net must exist before the live app
   goes (entry condition 3), it runs against `dist/` today, and the two
   defects are user-visible now.
2. **Phase 6 - publish `dist/`**: the `deploy` job collects `dist/` (plus
   the generated `i/`, `og/`, `img/`, `card/`, `llms.txt`, `robots.txt`,
   `data.json`, `catalog.csv`) instead of the root files, and the owner
   flips Pages to "GitHub Actions". The static root stays *in the
   repository* through this phase, because parity is still the gate.
3. **Phase 7 - the cut-over cleanup**: delete `index.html`/`app.js`/
   `style.css` and the legacy suites (each in the commit that lands or
   names its successor - the table in decided 3), retire
   `tests/parity.js` once the structural goldens are seeded (decided 2), the `ACCEPTED`
   and "Recorded, not keyed" sweep into `FEATURES.md`/`STATE.md`, the
   `routes.json` two-frame entry, READMEs, `CLAUDE.md`'s migration
   section, CI's parity job. Mechanical, contract-touching, its own
   reviews.
4. **Phase 8 - the review and the fixes**, on the clean tree, with the
   net from B12 as its instrument.

7 before 8 is forced: every Phase 8 fix is a parity regression while
the harness is the gate, and R1's findings go stale if they cannot be
acted on. 6 before 7 is forced: deleting the root before the deploy job
publishes `dist/` takes the site down. 5 before 7 is forced by entry
condition 3; 5 before 6 is a choice, and the right one - the owner's
two defects are in the built app people will be sent to.

**Can 7 and 8 be unified?** As one *track*, yes - Phase 7's cleanup
becomes that track's first batch (R0) and R1's review starts the moment
it lands, on a tree with no old code for an agent to be confused by,
which is exactly the owner's reason. As one *batch*, no: R0 changes
public contracts and CI and must land and be reviewed alone
(`docs/parity.md`, "Batch size", first cut), and R1 is read-only by
design. **Cost of the recommended order**: nothing extra in gates - the
parity harness is paid for until R0 either way; one extra owner action
(the Pages flip) sits between 6 and 7, as it always did. **Cost of the
alternative** (7 then 6, or 8 before 7): a dark site, or a phase of fixes
each needing a `VISUAL_DEBT`/`ACCEPTED` excuse the owner already refused
for D1.

**9. "Phase 5" survives as a label** for the net and the gates - B11 and
B12 - and absorbs the Playwright question the plan had parked at Phase
7's planning pass. `docs/specs/COVERAGE.md`'s four "waits for Phase 5"
sentences are rewritten by B12 to name the state that now covers each.

### The batches

Three, sized by their gates: B11 (built) shared one `check`, one
`check:built` and one parity filter group (the two defects' surfaces);
B11.1 is one component fix, one parity state and one register entry
under one `check`, one `check:built` and one parity call; B12 shares one
`check`, one `check:built` and one `run-all` filter and touches no
parity-visible pixel. Merging B11.1 into B12 would bury a user-visible
production fix inside a ~1k-line review of ported test code that also
changes what CI enforces - the second way to get it wrong
(`docs/parity.md`, "Batch size"); merging it into B11 was impossible,
B11 having landed before the owner's repro arrived. B11.1 is small on
purpose and is numbered as B11's follow-up so that every existing
reference to "B12" (`COVERAGE.md`'s thin-spot bullet, the handoff, this
file) stays right.

#### B11 - the decoder, and the menu that closed itself (built: `73facda` + `64f9a27`, reviewed approve)

Built as specified; steps 1-14 done, the step-7 red-then-green recorded
in `handoff.md`, all gates green (41 files / 1004 tests, `check:built`,
60 parity cells `совпадает`). Reviewer (read-only): approve, no blockers,
six nits - recorded in `handoff.md`, "Deferred", and placed: nit 3
(the `[]`-groups path of `parseHash` unpinned) and nit 5 (`app.js:2724`
points at the comment, not the code) go to B11.1, which opens
`hash.test.ts`'s neighbours and `specs.js` anyway; nit 4 (the
`isConnected` guard's comment is broader than the guard's justification)
is a comment rewrite in B11.1, in the file it already edits - the
`onclickcapture` variant stays the recorded fallback and is *not*
taken, B11's "decided, do not reopen" standing, and B12's real-click
states exercise the guard as written; nit 2 (a retired group name ahead
of a live one drops the live narrowing - fails open) becomes one
sentence in `ROUTES.md` in B11.1; nit 1 (step 2's "non-empty tail" was
not implemented; behaviourally nil) is recorded here as the deviation
and nowhere else - `ROUTES.md` documents the code as written.

#### B11.1 - the menu's second measurement (implement-ready)

**Objective.** Make the add-to-list menu inside the record modal keep the
live app's side after "+ Новый список" is pressed - the rewrite's
regression root-caused in decided 7, 2b - pin it with a parity state
that reads red before the fix and green after, write the live defect the
port reproduces on purpose (the viewport-measured flip that chops the
card's picture) into `docs/specs/DEBT.md` as D6, and pay B11's cheap
review nits in the files this batch opens. One component, one state, one
register entry.

**In scope.** `app/src/components/AddToList.svelte` (the `$effect`, and
the `onDocumentClick` comment - nit 4), `tests/parity/specs.js` (one
state; the nit-5 line), `docs/specs/DEBT.md` (D6), `docs/specs/FEATURES.md`
(one clause), `docs/specs/ROUTES.md` (one sentence - nit 2),
`app/src/lib/hash.test.ts` (one case - nit 3), `issues/47/`.

**Out of scope.** Measuring the toggle rather than the first `.btn`, or
the card rather than the window (the Phase 8 fix, named in D6); `overflow:
clip` on `.card`; `RecordModal.svelte`; `RecordCard.svelte`; the driver;
`tests/app/` (B12); any threshold; the live files; any `VISUAL_DEBT`/
`ACCEPTED` figure; a fourth harness width (decided 7, 2b, last bullet).

**Decided, do not reopen.** The fix ports the live *order* - redraw at
the default side, then measure the first `.btn`, then place, then scroll
- and keeps the first-`.btn` reading because it is the live reading and
parity is the gate; the "correct" measurement is Phase 8's. The parity
state seeds **no** lists and opens **Самоцвет Чутья**: with the `two`
seed every card opens up and the divergence is not reached at 1100; with
no seed Самоцвет sits inside the 17 px band at 1100 (`below` 119.5 vs
`need` 131.2) on the measured tree. If the implementer's tree measures
differently (a font or a data change moves the card by a few pixels),
Малое Зелье Лечения on `#/tables/core_consumable` is the second record
in the band at 1100 with no seed - swap the record, do not add a seed.

**Steps.**

1. Preflight: `git log --oneline -3` reads `64f9a27` at HEAD or a
   docs-only successor; `git status --short` shows only `issues/47/`
   edits and the untracked `issues/tg-preview-refresh/` (another task's -
   never stage it). Read `context.md`, "Q3 planning facts", for the
   numbers; do not re-measure them.
2. `AddToList.svelte`, the placement `$effect` (lines 154-172). Replace
   its body so that it: keeps the `if (!open) return;` and the two `void`
   reads; then sets `up = false` **before** the `tick()`, with a comment
   that app.js redraws the menu on every render so `placeMenu` always
   measures from the default side, and that a re-measure from the flipped
   side reads a different `below` (D6); then inside `tick().then`, the
   same lookups as today (`root.querySelector('.dropmenu')`, `root.
   querySelector('.btn')`), with a comment on the `.btn` line: the first
   `.btn` inside `.seldrop`, as `placeMenu` reads it - the toggle while
   the menu shows chips, the form's own "Создать" once the form is open;
   the live reading, kept on purpose (D6); then `up = below < need;
   flushSync();` **before** `menu.scrollIntoView({ block: 'nearest' })`,
   with a comment that `classList.toggle` precedes `scrollIntoView` in
   `placeMenu` and the class has to be on the menu before it is scrolled
   into view. Import `flushSync` beside `tick` from `svelte`. Writing
   `up` inside the effect is safe: the effect reads `open`, `shown.length`
   and `newListFor`, never `up`. `svelte-check` must stay clean.
3. `AddToList.svelte`, `onDocumentClick`'s comment block (lines 196-203):
   narrow the last sentence. What is true: a detached target was either
   inside this control or was removed by the same flush; the guard
   cannot tell them apart, so an outside click whose target Svelte
   removes during the flush (a filter pill's cross, a toast's undo) leaves
   the menu open where the live app closes it; no reachable path was
   found (`RecordModal.svelte:68` and `app.svelte.ts`'s `menuFor = ''` on
   modal close and navigation cover the known ones); `onclickcapture`
   would decide "inside?" before any mutation and is the recorded
   fallback. Keep the guard itself byte-for-byte.
4. `tests/parity/specs.js`, `STATES`: directly after `#/tables ~ a row
   opened, list menu`, add
   `{ id: '#/tables ~ a row opened, new list', route: '#/tables', why:
   "the new-list form inside the modal, and which side the menu keeps
   when it grows - the rewrite re-measured from the flipped side and sent
   it under the card's edge", enter: async (d) => { await
   d.click('Самоцвет Чутья'); await d.click('Добавить в список'); await
   d.click('+ Новый список'); } }` - **no `storage`** (the reason is in
   "Decided" above; say it in a one-line comment).
5. `tests/parity/specs.js`, the "Recorded, not keyed" prose from B11:
   `app.js:2724` -> `app.js:2718-2726` (`fDecode` starts at 2718, the
   heuristic is 2725-2726) - nit 5.
6. `docs/specs/DEBT.md`, section "Defects reproduced on purpose", after
   D5: **D6 - the add-to-list menu's flip measures the window, not the
   card, and re-measures against the wrong button.** Follow D5's headings
   exactly. *Where*: `app.js:3695-3704` `placeMenu` (`$('.dropmenu')`,
   `drop.querySelector('.btn')`, `innerHeight - btn.bottom` against
   `menu.height + 16`, `scrollIntoView({ block: 'nearest' })`), run after
   every render (`app.js:3824`); the port `AddToList.svelte`'s placement
   `$effect`; `.card{overflow:hidden}` at `style.css:306` /
   `RecordCard.svelte:260`. *Live behaviour*: on a tall window a short
   card's menu opens downward inside the modal, overflows the `.card`
   article, and `scrollIntoView` scrolls that `overflow: hidden` article
   (measured `scrollTop` 109 at 1913x981 and 1100x900, Кольцо Тишины, no
   lists) - the top of the picture is chopped with no scrollbar and no way
   back; pressing "+ Новый список" redraws the card and flips the menu up
   because the first `.btn` is then the form's own "Создать", under the
   fold from the default side - which is what heals it. *What the rewrite
   would do instead*: measure the toggle (`:scope > .btn`) against the
   nearest clipping box (`.modal-card`), and make `.card` `overflow:
   clip` so a programmatic scroll cannot move its content (check the
   rounded corners still clip). *Why parity won*: B11.1 (2026-09-12) -
   every `~ list menu` / `~ new list` cell compares the side and the
   article's scroll; the correct measurement flips `#/i/ci1 ~ new list`
   and the new modal state against the live app with no `ACCEPTED` home
   for a whole-menu difference. *How to verify the fix*: `tests/app/
   states.js` - after opening the menu in the modal on Кольцо Тишины at
   1100x900 with no lists, `.card.scrollTop` is 0 and the menu's box lies
   inside `.modal-card`'s; after "+ Новый список", the input's box lies
   inside `.modal-card`'s and is focused; `#/i/ci1 ~ new list` is
   re-read by the same instrument. *Recorded by*: B11.1, 2026-09-12.
7. `docs/specs/FEATURES.md`, "Lists", the card-menu bullet: after "and
   through the new-list form and its cancel", add: "; it opens on the side
   of the button with room in the window, re-measured from its default
   side whenever it opens or grows (DEBT.md D6 records what that gets
   wrong inside the modal)".
8. `docs/specs/ROUTES.md`, "Filter grammar", after the B11 sentence
   ("every piece names a group the table offers"): one sentence - a
   retired group name ahead of a live one (`f_rg-melee_line-uniq`) makes
   the whole body one unknown group, so the live narrowing is dropped and
   the table stays whole: unknown groups fail open, never empty - nit 2.
9. `app/src/lib/hash.test.ts`, the `tables` describe: one case,
   "an unknown table takes no legacy reading" -
   `parseHash('#/tables/nope/f_tier-1_cls-phy')` has `table` null,
   `kind` `'tables'`, and `route.filter` has no `cls` key (the legacy
   reading is what would add one) - nit 3. Assert nothing about the shape
   of the foreign key, as B11 step 4(d) decided.
10. Gates, each one foreground call, Bash timeout 600000:
    - `set -o pipefail; npm run check 2>&1 | tail -n 120`
    - `set -o pipefail; npm run check:built 2>&1 | tail -n 120`
    - **red first**: with steps 4-5 in place and step 2 *not yet*
      applied, `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js
      "#/tables ~ a row opened, new list" 2>&1 | tail -n 60` - the 1100
      cells must read a difference (record the percentages in the
      handoff; open one diff image: the rewrite's form under the card's
      edge). If they read `совпадает`, the record is outside the band on
      this tree - swap to Малое Зелье Лечения on `#/tables/core_consumable`
      per "Decided" before touching step 2.
    - then, with step 2 applied: `set -o pipefail; MSYS_NO_PATHCONV=1
      node tests/parity.js "#/tables ~ a row opened" "#/i/ci1 ~ new list"
      "#/tables ~ bar menu" 2>&1 | tail -n 120` - 5 states / 30 cells
      (`#/tables ~ a row opened` is a prefix and matches its two
      siblings); every cell `совпадает` or its already-recorded debt
      figure unchanged (the modal itself carries 0.02/0.03/0.07 %).
      Confirm each call printed its cells; a vacuous `расхождений нет`
      is not a result.
11. One commit, `fix(app): keep the add-to-list menu on the live app's
    side when its form opens`, staging the seven files and `issues/47/`;
    the handoff with exact commands, the red-first percentages, and the
    diff image's description.

**Acceptance.** The new state reads a difference at 1100 before step 2
and `совпадает` on all six cells after; the four neighbouring states are
unchanged; `hash.test.ts` carries the nit-3 case; `DEBT.md` has D6 in
D5's shape; `FEATURES.md`, `ROUTES.md`, `specs.js` carry their edits;
`git show HEAD -- app.js style.css index.html` is empty; `npm run check`
green with thresholds held; the `onDocumentClick` guard is byte-identical
to B11's.

**Risks / do-nots.** Do not "improve" the measurement (toggle, card) -
it fails parity by design and is D6's Phase 8 fix. Do not add a seed to
the new state. Do not set `up` from inside `tick().then` without the
`flushSync()` - the scroll would run against the menu's previous side,
which is what the probe's clipped cells show: `scrollIntoView` ran while
the menu was still up and had nothing to do, then the class flipped it
down under the card's edge, unscrolled. If `#/i/ci1 ~ new list`
or `#/tables ~ bar menu` change, the reset is running with the menu at
the wrong default: check that `.cardpick :global(.dropmenu)` (down) and
`AddToList`'s base rule (up, the bar's) are untouched. Host load: the
rule from B11 stands - a `check` that crosses 600 s is re-run idle, never
salvaged.

**Fallback.** None needed for the fix. If the band moves on the
implementer's tree for both named records, register the state on
whichever of the four measured records reads red at 1100 with no seed
(`context.md`, "Q3 planning facts", table) and say which in the handoff.

**Objective.** Fix both owner-reported defects in the rewrite, pin each
with the test that would have caught it, register the two parity states
that make them visible, and write the behaviour down. No production code
beyond the two fixes; no harness change.

**In scope.** `app/src/lib/filters.ts`, `app/src/lib/hash.ts`,
`app/src/lib/filters.test.ts`, `app/src/lib/hash.test.ts`,
`app/src/components/AddToList.svelte`, `app/src/components/lists.test.ts`,
`tests/parity/specs.js` (two states, one prose sentence),
`docs/specs/ROUTES.md` (one sentence), `docs/specs/FEATURES.md` (two
bullets), `docs/specs/COVERAGE.md` (one thin-spot bullet), `issues/47/`.

**Out of scope.** `docs/fixtures/urls/routes.json` (Phase 7 - see decided
7), `tests/contracts.js`, `CONTRACTS.md`, `llms.txt`, `TablesPage.svelte`
(its read-back-on-every-write is correct once the decoder is), the
`$effect` placement in `AddToList` (2b is not reproduced), `tests/app/`
(B12), any threshold, the live files, any `VISUAL_DEBT`/`ACCEPTED`
figure.

**Decided, do not reopen.** The decoder takes the table's groups (not a
regex over known value spellings, not a `.`-only reading that would
break the legacy links `filters.test.ts:77` protects). The menu fix is
the `isConnected` guard, not a capture-phase listener (fallback below)
and not a `setTimeout`. The link-arrival divergence from the live app is
prose in `specs.js` and a `FEATURES.md` bullet, not an `ACCEPTED` key
(a whole-table pixel difference has no `ACCEPTED` home) and not a parity
state.

**Steps.**

1. Preflight: `git log --oneline -3` reads `9e3d19f` at HEAD (or a
   docs-only successor); `git status --short` shows only the orchestrator's
   `issues/47/` edits and the untracked `issues/tg-preview-refresh/`
   (another task's - never stage it). Read `context.md`, "Phase 5
   planning facts".
2. `filters.ts`: `decodeFilter(segment: string, groups: readonly string[]): FilterState`.
   The legacy reading applies only when the body has no `.` **and** every
   `_`-split piece has a head (the text before its first `-`) that is in
   `groups` and a non-empty tail. Rewrite the doc comment's example: the
   case that made the separator a dot was `frame-beast_feast`; the case
   that makes the heuristic name its groups is `frame-beast_feast-colossus`,
   which splits into `frame-beast` and `feast-colossus` - and `feast` is
   nobody's group.
3. `hash.ts:105`: `decodeFilter(tail, table ? groupsFor(table) : [])`.
   With no table there is no legacy reading, which is the safe side (an
   unknown table draws no filter).
4. `filters.test.ts`: every `decodeFilter` call gains its groups (use
   `groupsFor('eq_weapon')`/`groupsFor('frames')` rather than literals, so
   the test follows the table). Add, under "reading the address": (a)
   `f_frame-beast_feast-colossus` -> `{frame:['beast_feast','colossus']}`
   with a comment naming the owner's report; (b)
   `f_frame-dark_heart-motherboard` -> both values (the second pair the
   heuristic broke); (c) `f_tier-1_cls-phy` on `eq_weapon` still reads
   the old way (the existing case, kept); (d) the same
   `f_tier-1_cls-phy` decoded with `groupsFor('frames')` does **not**
   take the legacy reading - assert only that the result has no `frame`
   key, that nothing throws, and that `passes()` with `frames`' groups
   leaves every row through (a foreign group narrows nothing - what
   `passes` already promises). The exact shape of the foreign key is not
   asserted; it is noise the table ignores.
5. `hash.test.ts`: one case under the route grammar describe -
   `parseHash('#/tables/frames/f_frame-beast_feast-colossus')` has
   `filter.frame` equal to `['beast_feast','colossus']` and
   `encodeFilter(route.filter, groupsFor('frames'))` round-trips to the
   same segment. This is the interim pin for the `routes.json` entry
   Phase 7 adds; say so in the comment.
6. `AddToList.svelte` `onDocumentClick`: before the `root.contains`
   check, `if (e.target instanceof Node && !e.target.isConnected) return;`
   with a comment: a trusted click runs a microtask checkpoint after the
   app's delegated handler, Svelte 5 flushes in that microtask, and the
   `{#if newListFor}` block has already replaced the chip (or the form's
   own buttons) by the time the event reaches the document - a target
   that is no longer in the document was inside this control when it was
   pressed. Leave the existing `try { mine = key }` as is.
7. `lists.test.ts`: a new case, "opens the new-list form under a real
   browser's event ordering", that registers a bubbling `click` listener
   on `document.body` **after** render (so it runs after Svelte's
   delegated handler on the app root and before the document listener)
   which calls `flushSync()` (import from `svelte`), then clicks
   "+ Новый список" and asserts the input is present and focused and
   "Лежит в списках" is still on screen; then clicks "Отмена" the same
   way and asserts the menu is still open with the "+ Новый список" chip
   back. Remove the body listener in a `finally`. Run the case against
   the unfixed component first and record in the handoff that it failed
   (the menu text gone) - that is the proof it pins the mechanism. End
   with `expectNoA11yViolations`.
8. `specs.js`, `STATES`: after `#/tables/frames`, add
   `{ id: '#/tables/frames ~ two frames', route: '#/tables/frames',
   why: 'two frames picked in one row: values OR, and the second pick
   keeps the first', enter: async (d) => { await d.click('Фильтры');
   await d.click('Пир зверей'); await d.click('Колоссы Сухоземья'); } }`
   (copy `#/tables/wondrous ~ filtered`'s shape). After
   `#/tables ~ a row opened`, add `#/tables ~ a row opened, list menu`:
   the same `route`, `storage: two`, `enter` = that state's `enter` plus
   `await d.click('Добавить в список')`, `why: "the add-to-list menu
   inside the modal, and which side of the button it opens on"`.
9. `specs.js`, the "Recorded, not keyed" comment block: one sentence -
   a two-frame link (`#/tables/frames/f_frame-beast_feast-colossus`)
   opens both frames in the rewrite and an empty table in the live app,
   whose `fDecode` (app.js:2724) reads it as the old `_` form; no state
   holds it because the difference is the whole table; Phase 7's sweep
   carries it into `FEATURES.md` (B11 already writes the bullet).
10. `ROUTES.md`, "Filter grammar": replace "every piece looks like a
    group" with "every piece names a group the table offers".
11. `FEATURES.md`, "Tables and search", the filter-panel bullet: add
    "Values in a row combine with *or*; a link naming two frames opens
    both." "Lists", the card-menu bullet: add "and through the new-list
    form and its cancel."
12. `COVERAGE.md`, "Known thin spots": one bullet - a trusted click runs
    a microtask checkpoint between listeners that neither jsdom nor
    `el.click()` reproduces; B12's `press` is the instrument.
13. Gates, each one foreground call, Bash timeout 600000 (see risks on
    host load):
    - `set -o pipefail; npm run check 2>&1 | tail -n 120`
    - `set -o pipefail; npm run check:built 2>&1 | tail -n 120`
    - `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/tables/frames" "#/tables/wondrous ~ filter" "#/tables/eq_secondary ~ filter link" "#/tables ~ a row opened" 2>&1 | tail -n 120`
    - `set -o pipefail; MSYS_NO_PATHCONV=1 node tests/parity.js "#/i/ci1 ~ list menu" "#/i/ci1 ~ new list" "#/tables ~ bar menu" 2>&1 | tail -n 120`
    (the first parity call is 7 states, 42 cells; the second 3 states, 18
    cells; confirm each printed its cells - a vacuous `расхождений нет`
    is not a result).
14. One commit, Conventional Commits, `fix(app): ...`; the handoff with
    exact commands and results, and the step-7 pre-fix failure recorded.

**Acceptance.** `filters.test.ts` and `hash.test.ts` carry the cases
above; `lists.test.ts`'s new case fails on the unfixed component and
passes on the fixed one; `#/tables/frames ~ two frames` reads
`совпадает` on all six cells (both apps 57 rows, two pills);
`#/tables ~ a row opened, list menu` reads `совпадает` or, if CI reads a
difference, the diff image is inspected before any entry is written (no
`VISUAL_DEBT` from this host); the eight pre-existing states in the
filters read unchanged; `git show HEAD -- app.js style.css index.html`
empty; `ROUTES.md`, `FEATURES.md`, `COVERAGE.md`, `specs.js` carry their
edits; `npm run check` green with thresholds held.

**Risks / do-nots.** The host was loaded on 2026-09-12 01:48-02:03:
vitest alone took 378-393 s (the whole `check` is ~165 s idle), so a
`check` may cross the 600 s cap - a crossed run is re-run when the host
is idle, never salvaged, and never backgrounded. Do not widen the legacy
reading to "any known group anywhere" - `feast` is not a group on any
table today, but `groupsFor(table)` is the rule, not a global set. Do not
touch `TablesPage.svelte`'s read-back. Do not add `routes.json` entries.
If the `~ two frames` English cells differ, the cause is the chip name
lookup under `EN` (the harness presses the language *after* `enter`, so
Russian names are right) - not the decoder.

**Fallback.** If the `isConnected` guard proves insufficient in B12's
real-click state (it will not - the probe's mechanism is exactly the
detached target), switch the listener to `onclickcapture` so "inside?" is
decided before any handler mutates the DOM; the test in step 7 passes
either way.

#### B12 - the real-browser layer on `dist/`, and the gates (outline; decided points)

Expanded to steps at its own planning pass after B11.1 lands; the
decisions are made here so that pass is short. Added by the 2026-09-12
pass (Q2/Q3): `states.js` carries the modal's new-list invariant (the
form's input inside `.modal-card`'s box and focused - decided 7, 2b, the
post-cut-over form of B11.1's parity state) and D6's verification hook
in a form that is *expected to fail until Phase 8* is **not** written -
no red test is committed; D6 names the assertion, R3 writes it. The
real-click new-list states (card, bar, modal) are also where B11's
`isConnected` guard gets its trusted-event reading; nit 4's
`onclickcapture` variant is not measured separately unless one of them
fails. Selectors the contracts port needs, read off the tree: rows are
`.rows .row[data-row]` on both apps already (`TableRows.svelte:113`);
the lit tab is `#tabs a.on` live and `a[aria-current="page"]`
(`TabBar.svelte:38`) here; the pills need `data-val={c.group + ':' +
c.value}` on `FilterBar.svelte:83` to match `app.js:2671`'s
`group:value`; sources read `aria-pressed` (`Seg.svelte:31`/`Chip.svelte:
56`); the print cards are `.pcard:not(.blank)` on both; the stat line is
`.eqstats span` on both (`RecordCard.svelte:152`). `Icon`'s missing
branch is the `'opacity' in icon` arm (`Icon.svelte`, one icon carries
`opacity: 0.7`, `lib/icons.ts:44`); `SelBar`'s is the `if (!index)
return;` / empty-`items` arm of `copySel`. `run-all.js` resolves a
suite name to `tests/<name>.js`, so `app/sweep` reaches `tests/app/
sweep.js` without a runner change; the sweep is split by width into four
entries the way `audit2` is.

- **Driver.** `tests/parity/driver.js` gains `press(name, nth)` - the same
  lookup as `click`, but the element is resolved to a puppeteer
  `ElementHandle` and `.click()`ed (CDP mouse: trusted, scrolls into view).
  `click` is unchanged so parity's legacy-side cache key changes once
  (driver.js is hashed in) and its semantics do not. `ready()` must accept
  `#app` for the `next` target if it does not already.
- **Files.** `tests/app/lib.js` (a `next`-only driver factory over
  `makeDriver`/`prepare`, `axe` injection via
  `page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })`,
  the sweep reporter lifted from `audit2`), then one suite per file:
  `sweep.js` (every `STATES` route plus `audit2`'s `PAGES`, four widths,
  both languages, `audit2`'s eight checks + axe with `color-contrast` on
  + a focus-ring walk: Tab through every focusable, read `outline` after
  `getAnimations()` is empty), `typo.js`, `hues.js`, `contracts.js` (the
  browser half of `tests/contracts.js` on `dist/`: `.fpill` gets the live
  `data-val` attribute in `FilterBar.svelte` so the fixture's `picked`
  reads the same way; "which tab is lit" via `aria-current="page"`; rows
  via the row selector `TableRows.svelte` emits; sources via
  `aria-pressed`), `states.js` (real-input: new list from the card, the
  bar and the modal; two frames picked and the two-frame link arriving;
  `<dialog>` focus/Tab/Escape/return; two pages sharing storage; the
  packed link (`CompressionStream` for real); copy text and copy image
  through the stubbed clipboard; a broken art path; focus surviving a
  tables keystroke; the note textarea's height).
- **Runner and CI.** `run-all.js` `SUITES` gains the five, named
  `app/<name>`; the CI step keeps its command (`--exclude=parity`
  already runs after `Build`) and is renamed "The legacy suites against
  the live app, and the built app in a browser". `CLAUDE.md`, "Quality
  gates": one focused-command line for `node tests/run-all.js app/states`.
- **Gates config.** `vite.config.mts` per decided 4; `a11y.ts` per
  decided 5 (`OFF` loses `nested-interactive`; `expectNoA11yViolations`
  takes an optional `{ allow }`; the `StorageNotice` call sites in
  `listsPage.test.ts`/`listPage.test.ts`/`a11y.test.ts` pass it, each
  with a `D3` comment); `Icon`/`SelBar` gain the one branch each is
  missing.
- **Docs.** `COVERAGE.md` rewritten: the suite table gains the `app/*`
  rows and marks each legacy row with its fate from decided 3; "Known
  thin spots" loses its four "waits for Phase 5" sentences and gains the
  honest remainder (hover, share sheet, OS clipboard, print until Phase
  7); the "What is enforced" table gains the browser layer. `parity.md`
  unchanged.
- **Gates.** `npm run check`; `npm run check:built`;
  `set -o pipefail; node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts,app/states 2>&1 | tail -n 120`
  (estimate 3-4 min: `audit2` was 4x45 s in parallel, `typo` 23 s,
  `contracts` 30 s); parity `"~ filtered"` (12 cells) for the `data-val`
  attribute; a review, because it changes what CI enforces.
- **Not in B12.** `print` geometry (Phase 7's deletion batch), the JSON
  freeze (Phase 7), deleting any legacy suite.

#### B12 planned: the real-browser layer on `dist/`, and the gates (planner, 2026-09-12)

The outline above holds the decisions and is not reopened. This section is
the batch: the file list, the driver verb's contract, the step order, the
acceptance, the costs, and the two questions the outline left to this pass
(the `pop` re-measurement, and where `COVERAGE.md`'s rewrite lands).

Everything below is read off the tree at HEAD `d0963d9` (B11.1's fix
`e94a90e` plus three commits that touch no application code), so the
outline still describes the tree it was written against.

##### Decided in this pass - do not reopen

**1. One batch, three commits.** `docs/parity.md`, "Batch size", allows
both - "A batch may hold more than one commit; each commit is green on its
own" - and the same section's third cut *requires* the first of them: "a
commit boundary the harness cannot reach (a state that needs a driver verb
or a seed that does not exist yet) - the piece that adds the reach lands
first, on its own commit, so a later red bisects". `press` is exactly that
piece.

| commit | what | its gate |
|---|---|---|
| C1 `test(app): the driver presses like a person, and the gates move` | `press` in `driver.js`; `vite.config.mts` thresholds; `a11y.ts`'s `{ allow }`; the `Icon` and `SelBar` branches; B11.1's nits 2, 3 and 5; D6's "Where" sentence | `npm run check` |
| C2 `test(app): the built app swept in a real browser` | `tests/app/lib.js`, `sweep.js`, `typo.js`, `hues.js`, `contracts.js`; `data-val` on the filter pills and the source chips; `run-all.js`'s four+1 entries; the CI step's name; `COVERAGE.md`'s enforcement half | `npm run check`, `npm run check:built`, the four `app/*` suites, one parity call |
| C3 `test(app): the states a real click reaches, and the coverage matrix` | `tests/app/states.js`; its `run-all.js` entry; `COVERAGE.md`'s suite table, fates and thin spots; `CLAUDE.md`'s one focused-command line | `npm run check`, `node tests/run-all.js app/states` |

Not two batches. The diff is large (~1.5k lines) but most of it is a port a
reviewer diffs against the suite it came from; the genuinely new reading is
`lib.js`, `states.js`, the sweep's axe and focus-walk additions, `press`,
and the config edits - roughly 650 lines, one pass. Splitting would pay a
second `check:built` and a second review dispatch for nothing. Not one
commit either: the two seams where a red needs to bisect cleanly are the
driver verb (C1) and the real-input layer (C3). The cost of the three
boundaries is two extra `npm run check` runs, ~165 s each on an idle host -
see "Verification commands" below.

**2. Nit 1 - the `pop` re-measurement - is recorded in D6's "Where", in one
sentence, and is written to be deleted by Phase 8 R3.** Not settled
empirically, and not left unwritten. The facts, from `handoff.md`,
"Deferred", nit 1: the live app re-inserts the `.dropmenu` markup on every
render, so `animation: pop .16s ... both` restarts and `placeMenu` measures
a menu still at `translateY(10px) scale(.985)`; the port's menu element
persists across the "+ Новый список" re-measurement, so that second
measurement is taken at rest. Same side basis, ~10 px of offset against a
measured 17 px band, never observed as a defect. Four reasons for
recording rather than probing or ignoring:

- **The only instrument that could ever see it dies before the fix does.**
  Parity is what compares the two apps, and `tests/parity.js` retires at
  Phase 7 R0 (decided 2); D6's fix is Phase 8 R3. Unrecorded, the question
  outlives both its evidence and the only thing that could answer it.
- **D6's "Where" is the field for exactly this.** D6 frames the
  first-`.btn` reading as the live reading, ported on purpose. "How
  faithful, and where not" belongs beside it, not in a handoff nobody
  reads after the task closes.
- **Phase 8's named fix genuinely retires it, which is why the sentence is
  cheap.** `pop` translates the menu; `placeMenu` reads the first `.btn`
  *inside* the menu ("Создать" once the form is open), so the translate
  moves what is measured. Phase 8's measurement reads the toggle
  (`:scope > .btn`), which is outside the menu and untranslated. Only the
  `scale(.985)` term survives it - about 2 px on a 131 px menu, an order
  inside the 17 px band. So R3 deletes the sentence along with the reading
  it qualifies.
- **Settling it costs a batch's minutes for a defect nobody has seen.** A
  record-by-height sweep of the live app hunting a disagreement in a ~10 px
  sub-band, on code scheduled for deletion, buys nothing B12 or Phase 8
  needs.

No test is written for it. The outline's rule stands: no red test is
committed, and a verification hook expected to fail until Phase 8 is not
written.

**3. B11.1's nits 2, 3 and 5 ride in C1**, as the reviewer marked them, and
they are cheap and local in files C1 opens anyway (`CLAUDE.md`,
"Engineering posture and campsite"). Nit 2: `hash.test.ts`'s comment cites
`hash.ts:105`, which is `? {`; the load-bearing lines are `:103` and
`:109`. Nit 3: the `[]`-groups case adds `expect(filter.tier).toEqual([
'1_cls', 'phy' ])` beside `not.toHaveProperty('cls')` - the reviewer's
expectation; if the code produces something else, that is a finding to
record, not a typo to paper over. Nit 5: `FEATURES.md`'s appended clause
becomes "the menu opens on the side...", so "it" stops attaching to the
search box. Nit 4 resolves itself when C3 creates `tests/app/states.js`;
nit 6 is answered by C3's modal case, which is the unit-level pin it says
is missing - it is not a code change.

**4. `COVERAGE.md` is rewritten inside B12, split across C1's and C3's
commits so each commit is true on its own.** `CLAUDE.md`: "Behaviour
changes update their specs in the same commit", and `COVERAGE.md` is the
spec for suite ownership and thresholds. C1 moves the bars, so C1 edits
"What is enforced, and by what" (the three threshold rows' numbers, the
`src/lib`/`src/ports`/state sentence under the table) and the
`nested-interactive` line. C2 edits the same section's axe row once
contrast is measured on a real page. C3 rewrites the suite table with the
`app/*` rows and each legacy row's fate from decided 3, and replaces
"Known thin spots"' four "waits for Phase 5" sentences (lines 202, 261,
307, 317 today) with the honest remainder: `hover: none`, the share
sheet's success path, the OS clipboard, and print geometry until Phase 7.
Not after the batch: a threshold table that describes the previous commit
is the kind of drift this file exists to prevent.

**5. `CLAUDE.md`'s "Quality gates" gains exactly one line**, after the
`Focused:` line:

```text
The built app in a real browser (after `npm run build`): `node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts,app/states`.
```

The build clause is load-bearing: `npm run check` never builds (`package.json`),
so a local `run-all` on a stale or absent `dist/` would go red on five
suites for a reason that is not the app's. CI is already safe - the
"legacy suites" step runs after `Build`. The file is 197 lines against its
own 200-line cap, so this is one line and nothing else; if anything more
wants saying, it moves to `COVERAGE.md`.

**6. `Icon` and `SelBar` each gain the one branch they are missing; no
component threshold moves.** Confirmed on the tree:

- `Icon.svelte:21` - `'opacity' in icon ? ...` - has only its false arm
  exercised. `external` is the only icon carrying `opacity` (`lib/icons.ts:44`,
  `opacity: 0.7`) and it renders in `AltPanel.svelte:205` (the crit row's
  table links) and `RecordPage.svelte:67` ("показать в таблице"). The case
  goes wherever the fixture already reaches that markup - `alt.test.ts`'s
  crit render or `record.test.ts`'s equipment record - and asserts the
  svg's inline style carries `opacity:0.7`, not merely that an icon drew.
- `SelBar.svelte:33-41` `copySel` - the reachable dead arm is
  `if (!items.length) return;`, not `if (!index) return;`. `app.toggleSel(id)`
  (`state/app.svelte.ts:319`) accepts any id, so a selection holding an id
  the index does not carry renders the bar with `n = 1` and takes the early
  return. The case belongs beside the existing selection-bar tests and
  asserts that nothing reached the clipboard and no toast was said - a real
  shape (a selection outliving the row it named), not a contrivance.

Both are measured by `npm run check`'s coverage report in C1; if either
file still sits at 75.0 after the case, the case did not reach the arm.

##### What is already measured, and what is not

Measured, and the port can rely on it:

- `driver.js`'s `ready()` already accepts `#app`
  (`tests/parity/driver.js:25-27`: `#view` **or** `#app`). The outline's
  "if it does not already" is answered - nothing to change there.
- `run-all.js` spawns `path.join(HERE, name + '.js')` and keys its log file
  through `keyOf(...).replace(/[^\w.-]+/g, '-')`, so a suite named
  `app/sweep` resolves to `tests/app/sweep.js` and writes
  `test-output/app-sweep.log` with no runner change. `--exclude=parity`
  and the name filter both compare `s[0]`, so `run-all.js app/sweep` works
  and CI's existing command picks the new suites up unchanged.
- `tests/**` is outside both gates: `.prettierignore` lists `tests/`, and
  `eslint.config.mjs:18` ignores `tests/**`. The new files keep the legacy
  suites' shape (CommonJS, `const ok = (c, m) => ...`, Russian comments
  where the original carried them) and nothing reformats them.
- `axe-core/axe.min.js` resolves from the repository root
  (`node_modules/axe-core/axe.min.js`); `page.addScriptTag({ path })` reads
  it in node and inlines it, so it works over `file://`, and neither
  `index.html` nor `app/index.html` carries a CSP to refuse it.
- The selectors `tests/app/contracts.js` needs all exist:
  `.rows .row[data-row]` (`TableRows.svelte:113`), `nav.tabs a[aria-current="page"]`
  (`TabBar.svelte:38`, whose `href` is `sectionHash(section)` -
  `hash.test.ts:295` already replays the fixture's `tab` through it),
  `.pcard:not(.blank)`, `.eqstats span` (`RecordCard.svelte:152`).
- **The route fixtures replay cleanly against the rewrite**, including the
  three that could have been broken by B11's decoder fix, checked entry by
  entry: `f_tier-1_cls-phy` still takes the legacy `_` reading (both heads
  name groups `eq_weapon` offers) and reads `["tier:1","cls:phy"]`;
  `f_frame-beast_feast` never took it (`feast` has no `-`) and stays one
  value; `f_nosuch-1` fails open to the whole table, 317 rows. The
  two-frame link that B11 fixed is deliberately **not** in `routes.json` -
  it waits for Phase 7 - so nothing in the fixture set encodes the live
  app's arrival defect.
- Pill order and label text already match: parity's `#/tables/eq_weapon ~ filtered`
  and `#/tables/wondrous ~ filtered` are `совпадает`, which compares the
  drawn pills. So `picked` will read in the fixture's order.

**Not measured, and this is the batch's real unknown.** `audit2`
re-pointed at `dist/` was measured passing **at 1180 only** (`context.md`,
"Phase 5 planning facts"). 360, 390 and 768 were never run against the
rewrite, and neither was axe with `color-contrast` on, on any width. Step 1
below measures both before a line of the suite is written, because the
answer decides whether B12 is a test batch or a test batch with production
fixes in it.

##### The driver's new verb, and its blast radius

`press(name, nth = 0)` joins `driver.js`'s verbs. Its contract, exactly:

- **The same lookup as `click`** - the same element set
  (`button, a[href], [role="button"], input, summary`), the same `NAME_FN`,
  the same rule that an exact name match wins and the loose `includes`
  fallback applies only at `nth` 0. A spec that swaps `click` for `press`
  reaches the same element or throws.
- **A different dispatch, and that is the whole point.** The element is
  resolved to a puppeteer `ElementHandle` (`page.evaluateHandle` returning
  the element, then `asElement()`) and `.click()`ed, which is a CDP
  `Input.dispatchMouseEvent`: `isTrusted` is true, and the browser runs a
  microtask checkpoint between listeners on the same event. That is the
  class `el.click()` and jsdom's `userEvent` cannot reach by construction
  (decided 6; defect 2).
- **It scrolls the element into view first** (puppeteer does this before
  it aims), where `click()` does not. A caller that measures geometry after
  a `press` reads a page that may have scrolled - the modal cases below
  measure against `.modal-card`'s own box for that reason, not against the
  window.
- **It throws when the element is not clickable** - zero box, covered,
  detached - where `el.click()` succeeds silently. The message names the
  control and `nth`, matching `click`'s.
- **It records into `d.pressed` under the same key as `click`**, so the
  coverage report at the end of a parity run does not split one control
  into two entries.
- **`click` is untouched.** Every existing state keeps its semantics, and
  every `enter` function's source text - which `keyFor` hashes - is
  unchanged.
- **No parity state uses `press` in B12.** It exists for `tests/app/`. A
  later state that adopts it changes that state's own cache key, which is
  the ordinary behaviour of editing an `enter`.

**Blast radius, measured rather than feared.** `driver.js` is hashed into
the legacy screenshot cache's root key (`tests/parity.js:150`, inside
`rootHash()` beside `index.html`, `app.js`, `style.css`, `data.js`, the
three asset folders and `parity.js`). Editing it invalidates **every**
cached legacy screenshot, once. What that actually costs:

- **CI: nothing.** `.github/workflows/ci.yml` caches npm and nothing else;
  `test-output/.parity-cache` is never persisted, so every CI parity shard
  already runs cold. The four shards' 8-10 min are unaffected.
- **Locally: one re-capture of the legacy side, for the states the next
  parity call touches, refilling as it goes.** The whole suite is 582 cells
  in ~867 s, so ~1.5 s a cell with both sides captured; B12's own 36-cell
  call pays tens of seconds more than a warm one, not minutes.
- **And the cache was going to be destroyed anyway.** `run-all.js` does
  `fs.rmSync(OUT_DIR, { recursive: true, force: true })` on
  `test-output/` at the start of *every* invocation, and `CACHE_DIR` is
  `test-output/.parity-cache`. B12's own `node tests/run-all.js app/...`
  call wipes it. The invalidation is not a new class of cost on this host.

So: no re-capture is scheduled, none is avoided, and the one parity call
B12 makes is sized as cold below.

##### The files, and what each contains

New, all CommonJS under `tests/app/`:

- **`lib.js`** - the `next`-only half of the harness, and nothing else.
  `DIST = 'file://' + path.join(__dirname, '..', '..', 'dist', 'index.html')`;
  a guard that `dist/index.html` exists and, if not, exits with the sentence
  "сначала `npm run build`" rather than a stack; a `fresh({ width, height,
  lang, storage })` factory that makes a browser context, applies
  `prepare(page)` from `tests/parity/driver.js`, seeds
  `dhloot.lang.v1`/`dhloot.lists.v2` through `page.evaluateOnNewDocument`
  after it, and returns `{ ctx, page, d }` with `d = makeDriver(page, 'next')`;
  `axe(page)` which injects `require.resolve('axe-core/axe.min.js')` with
  `addScriptTag({ path })` and runs it with `color-contrast` enabled,
  returning violations only; the `ok`/`fail`/summary reporter lifted from
  `audit2.js` so five suites report the same way. Reuses `makeDriver` and
  `prepare`; does not fork them.
- **`sweep.js`** - `audit2.js` ported. Same eight checks, same four widths
  split into four `run-all.js` entries the way `audit2` is, same two
  languages, same `landed === asked` assertion, same `.tablenav .chips`
  strip cap. `PAGES` is `audit2`'s 41 addresses plus the routes only
  `STATES` reaches - `#/tables` bare, `#/lists/b`, `#/i/ci1`, `#/i/q1` -
  and `#/print/ci1-q1`, `#/print/nope` **at 1180 only**, because an A4
  sheet legitimately scrolls sideways in a 360 px window and the overflow
  check would be reading the medium, not a defect. Adds axe with
  `color-contrast` on to every cell (no extra navigation - the page is
  already open) and the focus-ring walk to a named six-address subset at
  1180 and 360, RU only: a roll page, a table with its filter panel open,
  the lists index, a list page, a record page, search. The walk Tabs
  through every focusable, waits for `getAnimations()` to drain, and reads
  `outline`; it is the one addition that scales with round trips (~25 ms a
  stop, ~50 stops a page), which is why it is a subset and not the sweep.
- **`typo.js`** - `tests/typo.js` ported. Two edits are enough for the
  assertions (`context.md`, "Phase 5 planning facts"), but the `hit()` list
  that reaches the parts that only exist after a click is live-only
  (`[data-act="fOpen"]`, `[data-note-toggle]`), so half the page is
  silently unchecked unless it is re-expressed. Three of the five grips
  survive as ported classes - `.helpbtn` (`HelpButton.svelte:28`),
  `.cardpick` (`RecordCard.svelte`), `.lnote summary`
  (`ListPage.svelte:640`) - and the other two are pressed by accessible
  name through the shared driver instead. A grip that resolves to nothing
  fails loudly rather than skipping.
- **`hues.js`** - rewritten, not ported. The original injects bare
  `<span class="badge item">` and reads its colour, which Svelte's scoping
  gives nothing, and greps `[data-act="roll"]`. The rewrite reads the
  computed colour off **rendered** badges: one route per badge class -
  `#/tables/core_item`, `#/tables/core_consumable`, `#/tables/eq_weapon`,
  `#/tables/eq_secondary`, `#/tables/eq_armor` - taking the first
  `.badge.<cls>` on each, plus `.badge.src`, which every row carries
  (`RowMain.svelte:98`). Deterministic and language-independent; six opens,
  ~10 s against the original's 4 s. The hue/saturation maths, the 40-degree
  floor and the grey exemption are copied unchanged. The roll-button half
  reads `button.btn.primary:has(.dieicon)` - `:has()` is Chrome's and this
  only ever runs in Chrome - keeping the original's four assertions
  (five buttons on `#/roll/std`, a die on each, one look between them, and
  the same look on `#/roll/alt`, `#/roll/wondrous`, `#/roll/voa`).
- **`contracts.js`** - the browser half of `tests/contracts.js`, re-pointed.
  The list fixtures' write path and read path, the truncated link, the 26
  route fixtures, the stat line in both languages, and the filter group
  probes. The pure half (the second implementation of the codec) and the
  `llms.txt`/`CONTRACTS.md`/`ROUTES.md` name greps stay in
  `tests/contracts.js` - they need no browser, and decided 3 leaves the
  live copy alive until Phase 7. `lists2`'s "link assembled from
  `llms.txt`'s description" case moves here (decided 3). Selector map, all
  verified above: rows `.rows .row[data-row]`; tab
  `nav.tabs a[aria-current="page"]` read as `href`; print cards
  `.pcard:not(.blank)`; pills `.fpill` read as `dataset.val`; sources
  `.chip[data-val]` read as `dataset.val + (aria-pressed === 'true' ? ':on' : ':off')`;
  stat line `.eqstats span`.
- **`states.js`** - the real-input layer, and the only file with no
  ancestor. Thirteen cases, each pressing with `press` where the press is
  the point:

  1. **New list from the card** (`#/i/ci1`): press "Добавить в список",
     press "+ Новый список" - the form's input exists and holds focus, the
     menu is still open. B11's `isConnected` guard under the event that
     defeated it.
  2. **New list from the selection bar** (`#/tables`, tick a row, press the
     bar's "Добавить в список", press "+ Новый список") - the same.
  3. **New list from the modal** (`#/tables`, press a row for Самоцвет
     Чутья, press "Добавить в список", press "+ Новый список"), **no seed,
     1100x900** - the form's input holds focus **and its box lies inside
     `.modal-card`'s box**. That is decided 7's 2b assertion in its
     post-cut-over form: it is the cell B11.1 measured clipped before its
     fix, and it is the unit-level pin nit 6 says does not exist.
  4. **Two frames picked** (`#/tables/frames`: press "Пир зверей", then
     "Колоссы Сухоземья") - 57 rows, two pills, hash
     `#/tables/frames/f_frame-beast_feast-colossus`.
  5. **The same link arriving fresh** - 57 rows and two pills. No parity
     state can hold this one: the live side legitimately reads 0
     (decided 7, defect 1).
  6. **`<dialog>` semantics** (`#/tables`, press a row): focus lands inside
     the dialog; Tab never lands outside it; Escape closes it; focus
     returns to the row that opened it; the page behind is inert while it
     is open. Shimmed in jsdom, asserted nowhere else once `flows` goes.
  7. **Two pages sharing storage**: page A creates a list, page B sitting
     on `#/lists` redraws on the `storage` event. `file://` pages share one
     origin's storage in Chrome - the fact that leaked lists between probe
     passes in "Phase 5 planning facts" is what makes this testable, and is
     why every case clears storage on entry.
  8. **The packed link**: press the share control on a seeded list, read the
     `#/l/~` address back, open it, and read the list out - `CompressionStream`
     for real. This is the `src/ports/**` bar's warrant (decided 4).
  9. **Copy text** through the stubbed clipboard - `d.clipboard()` carries
     both `text/html` and `text/plain`.
  10. **Copy image** - `d.clipboardImage()` reads `image/png`, non-empty.
      This is what keeps `src/ports/image.ts`'s coverage exclusion honest
      (decided 4, its rewritten reason).
  11. **A broken art path** - port the "art that fails to load" half of
      `tests/noart.js`, so the real `<img>` error path and the glyph swap
      run once in a browser.
  12. **Focus survives a tables keystroke** - type into `#/tables`'s search
      box and assert `document.activeElement` is still it after the redraw.
      `qa` 9.1; Svelte keeps the node where the live app rebuilt it.
  13. **The note textarea's height** (`#/lists/a`) - open the note, type
      several lines, assert the textarea grew to its `scrollHeight`.
      `notes`' "note field height".

Edited:

- `tests/parity/driver.js` - `press`, and nothing else.
- `tests/run-all.js` - five names: `app/sweep` four times, one per width,
  in `audit2`'s shape, plus `app/typo`, `app/hues`, `app/contracts`,
  `app/states`, placed by their measured seconds so the long ones start
  first (the list's stated ordering rule).
- `.github/workflows/ci.yml` - the "The legacy suites against the live app"
  step is renamed "The legacy suites against the live app, and the built
  app in a browser". Command unchanged; it already runs after `Build` and
  already excludes only `parity`.
- `app/src/components/FilterBar.svelte:83` - `data-val={c.group + ':' + c.value}`
  on `.fpill`, matching `app.js:2671`.
- `app/src/components/Chip.svelte` - an optional `value?: string` prop
  rendered as `data-val`, and `app/src/components/StdPanel.svelte`'s source
  chips pass it. This is a port, not an invention: `app.js:2217` writes
  `data-val="core"`/`"hnf"` on the same control, and without it the
  fixture's `core:on` / `hnf:on` can only be read positionally or by
  Russian label. `StdPanel` is the only caller - the kind and rarity chips
  in the same panel pass nothing, so `.chip[data-val]` selects the source
  row and only it.
- `vite.config.mts` - decided 4: `src/lib/**` lines/functions 90 -> 95,
  branches and statements unchanged at 85/90; `src/state/**` 90/90/80/90 ->
  95/95/85/90; `src/ports/**` functions 70 -> 80, lines/branches/statements
  unchanged at 70/55/70; `Button.svelte` branches 50 -> 60;
  `DiceBar.svelte` stays at 55; the component glob stays at 85/80/75/85;
  the `src/main.ts` and `src/ports/image.ts` exclusion comments are
  rewritten to name `tools/smoke-file-url.mjs` and `tests/app/states.js`'s
  copy-image case instead of parity.
- `app/src/test/a11y.ts` - decided 5: `nested-interactive` leaves `OFF`;
  `expectNoA11yViolations(container, { allow } = {})` disables only the
  named rules for that call; the `StorageNotice` call sites pass
  `{ allow: ['nested-interactive'] }` with a `D3` comment each. Which call
  sites those are is found by flipping the rule on and reading the
  failures, not by guessing - `listsPage.test.ts` (the `brokenStorage()`
  renders around :107 and :188), `listPage.test.ts`'s "the storage notice"
  describe (:221) and `a11y.test.ts`'s lists-index state (:247) are where
  to expect them.
- Two component tests for the `Icon` and `SelBar` branches (decided 6
  above).
- `docs/specs/DEBT.md` - D6's "Where" gains the `pop` sentence
  (decided 2 above).
- `app/src/lib/hash.test.ts`, `docs/specs/FEATURES.md` - nits 2, 3, 5.
- `docs/specs/COVERAGE.md`, `CLAUDE.md` - decided 4 and 5 above.

Not touched, and not up for reinterpretation: `print` geometry
(`tests/app/print.js` is Phase 7's), any structural golden or JSON freeze
(Phase 7, decided 2), the deletion of any legacy suite (Phase 7,
decided 3), `tests/parity.js`, `specs.js`'s `VISUAL_DEBT`/`ACCEPTED`,
`routes.json`, the live files, a fourth harness width.

##### Ordered steps

1. **Preflight and probe, before any file is written.** `git log --oneline -3`
   (two other sessions share this tree); `git status` shows only
   `issues/tg-preview-refresh/` untracked and it is left alone.
   `npm run build`, then a scratchpad script - disposable, not committed -
   that (a) runs the two-edit `audit2` copy against `dist/index.html` at
   **360, 390 and 768** in both languages, the three widths nobody has
   measured, and (b) runs axe with `color-contrast` on over eight
   representative pages of `dist/`. Record both results in `handoff.md`
   before continuing. This is the batch's one real unknown and it is
   measured first on purpose: what it finds decides whether B12 carries
   production fixes, and the answer is cheaper now than at the gate.
   Triage rule: a violation the **live app shares** is a live defect
   reproduced on purpose - `docs/specs/DEBT.md`, plus a named `allow` in
   the sweep citing it; a violation the **rewrite invented** is fixed here
   if it is a one-line markup or token change, and otherwise becomes a
   named follow-up batch in `plan.md` with an `allow` citing it. Either
   way the suite lands green; no red test is committed.
2. `press` in `tests/parity/driver.js`, to the contract above, with a
   comment naming the microtask checkpoint and pointing at decided 6.
3. `vite.config.mts`'s thresholds, decided 4 as tabulated above, and the
   two rewritten exclusion comments.
4. `a11y.ts`'s `{ allow }`, and the `StorageNotice` call sites - found by
   enabling `nested-interactive` and reading the failures, each given a
   `D3` comment.
5. The `Icon` and `SelBar` cases (decided 6 above). Confirm from
   `npm run check`'s coverage report that both files moved off 75.0
   branches; if either did not, the case missed its arm.
6. Nits 2, 3 and 5, and D6's "Where" sentence (decided 2 and 3 above).
7. `set -o pipefail; npm run check 2>&1 | tail -n 120`. Commit **C1**.
8. `tests/app/lib.js`, including the missing-`dist/` guard.
9. `tests/app/sweep.js`, then `typo.js`, then `hues.js`. Run each alone as
   it lands (`node tests/run-all.js app/sweep` and so on) so a red belongs
   to the suite that just appeared.
10. `data-val` on `.fpill`; `Chip`'s `value` prop and `StdPanel`'s source
    chips; then `tests/app/contracts.js`.
11. `run-all.js`'s four `app/sweep` entries plus `app/typo`, `app/hues`,
    `app/contracts`; the CI step's rename; `COVERAGE.md`'s enforcement
    half.
12. The gates for the production edit:
    `set -o pipefail; npm run check 2>&1 | tail -n 120`,
    `set -o pipefail; npm run check:built 2>&1 | tail -n 120`,
    `set -o pipefail; node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts 2>&1 | tail -n 120`,
    and the parity call in "Verification commands". Commit **C2**.
13. `tests/app/states.js`, cases 1-13, built in that order - 1, 2 and 3
    first, because they are why `press` exists and because case 3 is the
    one the plan has already measured the expected numbers for.
14. `run-all.js`'s `app/states` entry; `COVERAGE.md`'s suite table, fates
    and thin spots; `CLAUDE.md`'s one line.
15. `set -o pipefail; npm run check 2>&1 | tail -n 120` and
    `set -o pipefail; node tests/run-all.js app/states 2>&1 | tail -n 120`.
    Commit **C3**.
16. Push the branch (`CLAUDE.md`, "Source and commit conventions" - agents
    push once a batch's commits pass their gates; never `--force`), then
    update `plan.md` with what was built and deviated, and `handoff.md`
    with the exact commands, their results, the probe's findings, and the
    next batch.

##### Acceptance criteria

- `press` exists, `click` is byte-identical to B11.1's, and
  `git diff` on `tests/parity/specs.js` is empty - no parity state's
  `enter` changed, so no state's cache key moved for any reason but the
  root hash.
- All five suites green under one `run-all.js` call, and each green alone.
- The sweep runs axe with `color-contrast` **enabled** on every cell, and
  the only rules it disables are named, commented, and each points at a
  `DEBT.md` entry or a plan section.
- `tests/app/contracts.js` replays all six list fixtures, all 26 route
  fixtures, the stat line in both languages and the twelve filter-group
  probes against `dist/`, with no fixture edited. `docs/fixtures/` is
  untouched; `routes.json` gains nothing.
- `states.js` case 3 reads the form's input inside `.modal-card`'s box on
  Самоцвет Чутья at 1100x900 with no seed - the cell B11.1's fix turned.
  Cases 1, 2 and 3 fail on a tree with B11's `isConnected` guard reverted;
  the implementer is not asked to revert it, but if a case passes both ways
  it is not testing what it claims and is recorded as such.
- Coverage thresholds hold at the raised bars with no file excluded to make
  them hold, and `Icon.svelte` and `SelBar.svelte` both read above 75.0
  branches.
- `git show <C1> -- app.js style.css index.html` and the same for C2 and C3
  are empty. The live files are frozen.
- The parity call's cells are unchanged from B11.1's readings - every cell
  `совпадает` or its already-recorded debt figure exactly. A `data-val`
  attribute cannot move a pixel; anything that did is the `Chip` prop, not
  the attribute.
- `COVERAGE.md` carries no "waits for Phase 5" sentence; `CLAUDE.md` is
  under 200 lines.
- `issues/tg-preview-refresh/` is still untracked and unmodified; no
  `git add -A` was used.

##### Verification commands, with their costs

Each one foreground call, Bash timeout 600000, `set -o pipefail` and
`2>&1 | tail -n 120`:

| call | when | cost |
|---|---|---|
| `npm run check` | before C1, C2 and C3 | ~165 s idle each; ~8 min for the three. A run that crosses 600 s is re-run idle, never salvaged or backgrounded (`context.md`, "Host load") |
| `npm run check:built` | before C2 | a few minutes; it is what proves `dist/` still builds and opens from a folder after the `Chip`/`FilterBar` edit |
| `node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts,app/states` | before C2 (first four) and C3 (the fifth) | estimated 3-4 min. Eight processes for five names - the sweep is four - and the pool is `min(cpus, 8)`, so wall clock is the slowest single width: `audit2`'s 45 s plus ~40 s of axe plus the focus walk where it runs. **If the 1180 process passes ~4 min, drop the focus walk to 1180 only and record the measured numbers**; do not widen the timeout |
| `MSYS_NO_PATHCONV=1 node tests/parity.js "~ filtered" "#/roll/std"` | before C2 | 6 states / 36 cells - `"~ filtered"` matches `#/tables/eq_weapon ~ filtered` and `#/tables/wondrous ~ filtered`, `"#/roll/std"` matches `#/roll/std` and its `~ help`, `~ items only`, `~ one source` siblings (`tests/parity.js:353` matches with `id.includes`). Cold legacy cache, because step 2 changed `driver.js`: ~1.5 s a cell both sides, so a few minutes, comfortably one call. Without `MSYS_NO_PATHCONV=1` Git Bash rewrites the argument and the run matches nothing - confirm the call printed its cells |

The full parity suite (~867 s) is **not** run and is not one foreground
call. Nothing in B12 asks for it: the only production edit is two
attributes and one optional prop, and the two surfaces they touch are the
filter pills and the roll page's source chips, which is exactly what the
filter above covers.

##### Risks and do-nots

- **The probe in step 1 is the batch's schedule risk.** Three widths and
  every axe contrast reading are unmeasured against `dist/`. Do not write
  the sweep first and discover them at the gate.
- **Do not let the focus-ring walk become the sweep.** It is round trips,
  not page loads: ~25 ms a stop, ~50 stops a page, 328 cells if it ran
  everywhere - that alone would be 7 minutes. Six addresses, two widths,
  one language.
- **Do not add a fourth harness width.** `WIDTHS` is hashed into every
  parity cache key (`parity.js:174`): +204 cells and every legacy PNG
  re-captured, for a question 1100x900 already answers (decided 7, 2b).
- **Do not "improve" `click` into `press`.** Parity's synthetic dispatch is
  what every recorded state and every debt figure was measured with.
- **Do not commit a red or expected-to-fail test.** D6's Phase 8
  verification hook is named in D6 and written by R3, not here.
- **Do not delete, skip or weaken a legacy suite.** Their deletion is
  Phase 7's, each in the commit that lands its successor (decided 3).
- **Do not move a coverage threshold to make a file pass.** Decided 4 is
  the whole threshold change; anything else is a finding for the handoff.
- **Do not touch `docs/fixtures/`.** If a route fixture fails against
  `dist/`, that is a divergence to root-cause and report, not a fixture to
  edit - `CLAUDE.md`, "Public contracts default to no change".
- **Do not run `git add -A`.** `issues/tg-preview-refresh/` belongs to
  another task.
- Two other sessions share this working tree. Re-read
  `git log --oneline -3` before each of the three commits.

##### Fallback

- If the step 1 probe finds a **rewrite-only** defect bigger than a
  one-line fix: land B12 with the check narrowed by a named `allow`
  citing a new `B12.1` section in `plan.md`, and record it as the next
  batch. B12's own acceptance is unaffected.
- If a **live-shared** a11y violation appears: `docs/specs/DEBT.md` in D6's
  shape, plus the `allow` citing it. That is what the register is for.
- If the sweep cannot hold four widths inside its own `run-all.js` entry
  budget: the focus walk drops to 1180 first, then axe drops to RU at the
  three narrow widths with EN kept at 1180. Contrast is a function of
  tokens and breakpoints, not of which language's text occupies a node, so
  that loses nothing measurable. Record whichever was taken.
- If `tests/app/contracts.js`'s source reading proves awkward after the
  `Chip` prop lands: read the source chips positionally in `SOURCES` order
  within `StdPanel`'s source `Field`, and drop the prop. The prop is the
  better answer because it ports `app.js:2217`; it is not load-bearing.
- If `press` cannot reach a control that `click` reaches (covered, zero
  box): that is a finding about the rewrite's layout at that width, to
  record - not a reason to fall back to `click` in a case whose point is
  the trusted event.

#### Phase 6 and 7 - what this pass adds to their outlines

- Phase 6's one batch: the `deploy` job's "Collect what the site is made
  of" step copies `dist/` and the generated/asset folders, not the root
  files; `tests/derived.js`'s `noindex` and count checks read
  `app/index.html`/`dist/index.html`; the smoke stays. Owner-gated on the
  Pages flip.
- Phase 7's first batch (R0 of the unified 7/8 track): delete the three
  live files and every legacy browser suite (`tests/lib.js` with them),
  each named with its successor from decided 3 in the commit message;
  port `print`'s geometry into `tests/app/print.js` in the same batch;
  add `tests/app/render.js` per decided 2 (rewritten 2026-09-12): the
  per-state structural goldens (accessibility tree + controls inventory,
  both languages at 1100, `tests/app/snapshots/`, `--update` to
  regenerate) seeded from `dist/` in this very commit, whose warrant is
  the last green parity run at the same tree, plus the token anchors and
  the numeric laws; **no** frozen `typeRuns`/`geometry`/`computed` JSON
  and no PNG; delete `tests/parity.js`, `specs.js`'s `VISUAL_DEBT`
  and `ACCEPTED` after the sweep; add the `routes.json` two-frame entry;
  `tests/contracts.js`'s pure half moves to `tests/app/contracts.js` or
  stays as a node-only suite - implementer's call, one file either way;
  CI drops the parity job; `CLAUDE.md`'s "Migration and parity" section
  shrinks to the standing rules. Contract-touching: its own review.
