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

**"Matching exactly" in that table means "matching within its recorded
`VISUAL_DEBT`", and for the tables screens that turned out to be a weaker claim
than it reads. Three real defects were sitting inside debt entries whose reason
said antialiasing.** Two batches are inserted ahead of B4: **B3.5**, which
fixes them and re-baselines the debt, and **B3.6**, a two-part batch that greens
the red CI run and then builds the measurement that would have caught them.
Both are below, after "B3 built".

Not built. Each is `pending` in `tests/parity/specs.js`, so the expectation is
already being collected against the live app:

- `#/tables/eq_weapon`, `#/tables/eq_secondary`, `#/tables/eq_armor` - the
  equipment tables, batch B4 - unchanged, and still the batch after B3.6
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
