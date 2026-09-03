# Issue #47 - vanilla JS to Svelte + TypeScript

Source: [issue #47](https://github.com/artex-x/daggerheart-loot/issues/47). That
issue is the agreed plan; this file is the working copy, plus the decisions
taken while carrying it out. Where the two differ, the difference is written
down here with a reason.

Historical once the cut-over is done. After that, work is driven by `CLAUDE.md`,
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
| 5 | Testing pyramid: unit, component, a11y, e2e | largely arrived early, see below |
| 6 | Build, artefacts, deployment | started: the build now completes `dist/` |
| 7 | Cut-over, cleanup, README, standing agent guidance | not started |

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

Not built. Each is `pending` in `tests/parity/specs.js`, so the expectation is
already being collected against the live app:

- `#/tables/eq_weapon`, `#/tables/eq_secondary`, `#/tables/eq_armor` - the
  equipment tables, batch B4
- `#/lists` - the lists slice
- `#/search` - the search slice
- `#/print/ci1-q1` - the print slice

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
5. **Search-box placeholder antialiasing**, under 900px on every Tables state -
   0.10-1.61%. The box and its placeholder measured pixel-identical, crop for
   crop, against the live app: same left edge, same width, same text: and the
   rest of each screen matched exactly on its own. What is left reads as
   antialiasing on the placeholder's thin, muted glyphs - the same class of
   noise cause 4 names, just on a control rather than a paragraph.
6. **A description line wrapping one word earlier on a phone**, 1.41-1.56% on
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

## Phase 5 - what already exists

The pyramid arrived alongside Phase 4 rather than after it:

- 570 unit and component tests, per-file coverage thresholds
- `app/src/components/a11y.test.ts` - axe on **pressed** states, plus a guard
  that fails when a component has no named state rendering it under axe
- `tests/parity.js` - the rewrite against the live app, every state in both
  languages at three widths

What is left of Phase 5 is Playwright, and it is worth asking whether it is
still needed: the parity harness already drives both apps in a real browser.

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

### The kind filter is per panel, not per app

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
