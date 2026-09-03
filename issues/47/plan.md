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

Not built. Each is `pending` in `tests/parity/specs.js`, so the expectation is
already being collected against the live app:

- `#/tables/voa`, `#/tables/frames`, `#/tables/community`, `#/tables/alt_item`,
  `#/tables/alt_consumable` - sectioned bodies, batch B3
- `#/tables/eq_weapon`, `#/tables/eq_secondary`, `#/tables/eq_armor` - the
  equipment tables, batch B4
- `#/lists` - the lists slice
- `#/search` - the search slice
- `#/print/ci1-q1` - the print slice

### What every remaining `VISUAL_DEBT` entry is

Nothing outstanding is a styling defect. The 77 entries were five causes
before B2; B2 adds a sixth, all of it measured rather than guessed:

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
