# Issue #47 - handoff

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/plan.md`, then this file. Nothing here depends on chat history.

## Status

Phase 4 is **in progress**. Built and matching the live app apart from the
debts named in `plan.md`: all six roll modes, the record page, Batch B1 of the
tables slice (the four filterless tables), and now **Batch B2 - the filter**
(`wondrous` and `dread`).

**This session built B2 end to end**: `plan.md`, "B2 built: the filter" has
the design as written plus what was found only while building, and this file
reflects the result. `npm run check` and `npm run check:built` both pass, and
a full parity run of every B2 state matches the live app exactly except the
placeholder-antialiasing and one text-reflow debt named below - the same
category of noise B1 already carried for the other four tables.

## What B2 built

- `app/src/lib/facets.ts` + `facets.test.ts` - `facetRows(index, table, t)`,
  the `kind` row for a table that mixes more than one kind, in `item`,
  `consumable`, `equip` order; nothing for a single-kind table or one with no
  `kind` group at all.
- `app/src/lib/dict.ts` - `filters`, `kindF`, `fEquip`, `anyValue`, `outOf`,
  `dropValue`, `resetAll`, `filterLink`, `filterLinkCopied`, copied verbatim
  from `T.ru` / `T.en` in `app.js`.
- `app/src/state/app.svelte.ts` - `replace(hash)` (writes through
  `env.router.replace`, keeps `hash` in step, adds no history entry) and
  `navigations` (a counter that `go()` and a router-driven address change both
  increment, and `replace()` does not).
- `app/src/ports/router.ts` - `memoryRouter.replace` no longer announces to
  its listeners, matching `hashRouter.replace`'s real `replaceState` behaviour.
- `app/src/components/Button.svelte` - `expanded` (`aria-expanded`) and a
  `toggle` variant for `.ftoggle.has` (gold text, gold-tinted border, no fill).
- `app/src/components/FilterBar.svelte` (new) - the strip (`.fbar`: the
  toggle, one pill per pick, reset, the filter-link button, the count) and the
  panel it folds open (`.panel.ffilter`: one `.field` per facet row, a `.lbl`
  with the row's name and an "any" hint, a `ChipRow` of `Chip`s). Pure props
  in, callbacks out - it owns none of the routing.
- `app/src/components/TablesPage.svelte` - `KNOWN` grows by `wondrous` and
  `dread`; the filter is read from `app.route.filter` rather than mirrored,
  with `seenSeg` as the one mirror (the exact segment this component last
  wrote) deciding whether an address change opens the panel; the selection and
  the open modal now reset on `app.navigations` rather than `app.hash`, so a
  filter pick keeps both and a real navigation clears both; the empty state
  grows its own reset button once something is picked.
- `tests/parity/specs.js` - six new states (`#/tables/wondrous`,
  `~ panel open`, `~ filtered`, `~ filter link`, `~ nothing found`,
  `#/tables/dread`), two new specs (`filteredAddress` reads `d.hash()`,
  `copiedFilterLink` reads the clipboard's hash), `NAME` entries for the
  toggle, the items chip, reset and the filter link, and `pending` entries for
  the seven tables B3/B4 have not reached (`voa`, `frames`, `community`,
  `alt_item`, `alt_consumable`, `eq_secondary`, `eq_armor` - `eq_weapon`
  already had one).

Three things found only while building, all written up in `plan.md` under "B2
built: the filter" with the reasoning:

1. `.field:last-child`'s reset never actually applies inside `.ffilter` - a
   cascade tie that `.ffilter .field`'s later declaration wins, which made the
   port's panel 12px short until it was measured against the live app rather
   than assumed from the source.
2. A space written on its own line inside an `{#if}` is trimmed away entirely
   rather than collapsed to one, unlike whitespace *between* two elements -
   fixed with `<!-- prettier-ignore -->` on the whole `<span>`, the space
   written inline.
3. `FilterBar`'s `.ffilter` needed `.panel`'s base rules (background, border,
   padding) copied in, the way `TablesPage.svelte`'s `.tablenav` already does
   for the nav strip - `.ffilter` is `.panel`'s second use in this codebase.

## Files changed

```
app/src/lib/facets.ts                  new
app/src/lib/facets.test.ts             new
app/src/lib/dict.ts                    modified - nine keys, both languages
app/src/state/app.svelte.ts            modified - replace(), navigations
app/src/state/app.test.ts              modified - three new tests
app/src/ports/router.ts                modified - memoryRouter.replace
app/src/ports/ports.test.ts            modified - one new test
app/src/components/Button.svelte       modified - expanded, toggle variant
app/src/components/button.test.ts      modified - three new tests
app/src/components/FilterBar.svelte    new
app/src/components/TablesPage.svelte   modified - the wiring, see above
app/src/components/tables.test.ts      modified - "the filter" describe block
app/src/components/a11y.test.ts        modified - FilterBar in COVERED, one
                                        pressed state, a second wondrous kind
                                        added to the fixture
tests/parity/specs.js                  modified - see above
issues/47/plan.md                      modified - B2 marked built
issues/47/handoff.md                   this file
```

## Tests and checks run, with results

```
npm run check           PASS - 508 files, 0 svelte-check errors/warnings,
                                637 tests passed, coverage thresholds met
npm run check:built     PASS - build, file:// smoke, bundle budget (55.1 kB
                                of 120 kB)
node tests/parity.js "tables/wondrous" "tables/dread"   PASS - зеро
                                unexpected discrepancies; every debt recorded
                                matches what a fresh run measures
```

The full unfiltered parity run was **not** re-run this session - it takes
about nine minutes and the filtered run above covers everything B2 touched.
The ten pre-existing Windows-vs-Linux drift failures from the B1 session (see
"Ten parity failures that are not yours" below) were seen again in an
intermediate run while filtering broadly on `"wondrous ~"` and are unrelated
to this batch - confirmed by name against that list, not re-verified with
stash-and-rebuild this session. A full run before the next slice's commit
would settle whether they have moved.

## Deviations from the plan, and why

None. The design in `plan.md` under "B2 planned: the filter" (now "B2
built") was followed as written; the three findings above are additions to
it, not departures from it - none of them changed what the strip, the panel,
`replace()` or `navigations` do, only how a couple of CSS rules and one
whitespace character had to be written to match the live app exactly.

## New `VISUAL_DEBT` entries, and why they are not defects

All measured against a fresh build this session, not guessed:

- **Search-box placeholder antialiasing**, 0.11-0.44% across `wondrous`'s five
  new states at 768 and 375 (one entry, `#/tables/wondrous ~ panel open @ ru
  1100`, also needed one at full width and `en 768` - the space fix for
  finding 3 below moved a rasterisation boundary by a fraction of a pixel).
  Same cause 5 already named in `plan.md` for the four B1 tables.
- **A description line wrapping one word earlier on a phone**, 1.41-1.56% on
  `#/tables/wondrous @ ru/en 375` and `#/tables/dread @ ru/en 375`. Neither of
  B1's four tables nor Core rules had a description long enough at 375px to
  show this; the picture, name, stat line and badges are pixel-identical, only
  the line-break point differs by sub-pixel kerning. First seen because B2 is
  the first slice to put a long Wondrous or Dread description on screen at
  375px, not something the filter changed. Written up as cause 6 in
  `plan.md`.

## Remaining work, in batches

- **B3 - sectioned bodies and section anchors**: `voa`, `frames`, `community`,
  `alt_item`, `alt_consumable`. Brings the `tier`, `frame` and `comm` facet
  rows with it (`facets.ts` only has `kind` today - untested rows would be
  worse than missing ones), and the numeric-pill rule already recorded in
  `plan.md` ("a bare number takes its row's name"). The anchors `#/roll/alt`'s
  crit box links to (`#/tables/alt_item/<rarity>`) land here. `voa`, `frames`,
  `community`, `alt_item`, `alt_consumable` are already `pending` in
  `tests/parity/specs.js`.
- **B4 - the equipment tables**, their seven facets and tier sections.
  `#/tables/eq_weapon`, `#/tables/eq_secondary`, `#/tables/eq_armor` stay
  `pending` until then.
- **B2a (loose, unscheduled) - extract `Panel.svelte`.** `.panel`'s base rules
  are now copied into six components (`AltPanel`, `RecordCard`, `RollPanel`,
  `StdPanel`, `TablesPage`'s `.tablenav`, and now `FilterBar`'s `.ffilter`).
  Its own commit, verified by the existing parity states not moving.
  Deliberately not folded into B2, same as it was not folded into B1.
- **C - search** (`#/search`). `lib/search.ts` exists. This is the second
  caller of the table row, so the row markup moves into its own component
  here - not before. It is also where the shared `S.kind` decision comes due
  (see "Open questions" below).
- **D - lists** (`#/lists`). Pays off the add-to-list debts on both record
  routes, both roll modals and the table row's modal, and adds the selection
  bar.
- **E - print** (`#/print/<ids>`).
- **F - the toast.** Small; closes `~ pinned` and `#/i/ci1 ~ toast`.

Then Phase 6 (deployment) and Phase 7 (cut-over).

## The exact next implementation batch

**B3 - sectioned bodies and section anchors.** Before writing code:

1. Read `app.js`'s `renderTables()` branches for `voa`, `frames`, `community`
   (the `tsection` divisions, ~2501-2530) and the alternate-tables branch
   (~2464-2494), plus `tblFacets`'s `tier`, `frame`, `comm` rows (2634-2641).
2. Read the numeric-pill rule already recorded in `plan.md` under "B2
   planned: the filter" > "Four details that are not visible from the
   markup": `fChosen` reads a bare number as its row's name plus the number -
   `facets.ts`'s `kindLabel`-style mapping needs the same rule for `tier`.
3. Confirm against `data.json` which kinds/tiers/frames/communities each of
   the five tables actually holds, the way B2's handoff did for `wondrous` and
   `dread` - do not assume from `plan.md`'s tables, which were themselves
   checked against `data.json` once and could be stale.
4. Decide whether `facets.ts` grows three more branches or the module is
   restructured - it was written for exactly one row on purpose ("an untested
   row is worse than a missing one"), so this is a real design question, not
   a formality.

## What not to start yet

- **Do not touch Phase 7.** `index.html`, `app.js` and `style.css` are the
  parity harness's expectation. Deleting them ends the ability to verify
  anything.
- **Do not point Pages at `dist/`.** Phase 6, and it needs the owner to switch
  Settings -> Pages -> Source first.
- **Do not start Playwright.** Ask first whether it earns its place - the
  parity harness already drives both apps in a real browser.
- **Do not extract `Panel.svelte` inside B3.** It touches every screen the
  harness has already agreed on; it wants its own commit.
- **Do not extract the row into its own component yet.** It has one caller.
  Search is the second.
- **Do not implement the equipment facets in B3.** They are B4's; the seven
  groups (`tier`, `src`, `cls`, `trait`, `range`, `burden`, `line`) are a
  different shape from the plain-table rows B3 adds.
- **Do not chase the help-panel, search-placeholder or description-reflow
  debts.** All three were measured identical apart from rasterisation or a
  line-wrap boundary; there is nothing to copy.
- **Do not re-record the ten failing debts below without the stash check.**
- **Do not translate the legacy Russian comments** in `app.js`, `style.css`
  and the older suites. Those files are deleted at the cut-over.

## Ten parity failures that are not yours

Carried forward from the B1 handoff, unverified again this session but seen
once more in passing while filtering broadly on `"wondrous ~"`:

```
#/roll/wondrous ~ modal @ ru 768 8.73 vs 8.57
#/roll/wondrous ~ modal @ ru 375 13.90 vs 13.55
#/roll/wondrous ~ help @ ru 768  0.92 vs 0.73
#/roll/wondrous ~ help @ ru 375  0.64 vs 0.52
#/roll/wondrous ~ help @ en 375  0.95 vs 0.79
#/i/ci1 ~ whole @ ru 768         5.61 vs 5.39
#/i/ci1 ~ whole @ ru 375         7.64 vs 7.28
#/i/ci1 ~ whole @ en 768         5.40 vs 5.22
#/i/ci1 ~ whole @ en 375         7.69 vs 7.01
#/i/ci1 ~ whole @ ru 1100        5.92 vs 5.29  (not yet stash-verified)
```

All ten were left alone on purpose - see the B1 handoff's reasoning, still
valid: Windows-vs-Linux rendering drift against numbers recorded on the Linux
CI agent. Give the last one its stash-and-rebuild check before touching it -
two minutes, and it settles the question rather than guessing.

## Quality gates for a slice

```
npm run check          # format, lint, typecheck, data, derived, i18n, tests
npm run check:built    # build, file:// smoke, bundle budget
node tests/parity.js   # the rewrite against the live app
```

`check:built` is required for anything that alters what a screen draws - B3
will. A full parity run takes about nine minutes here; filter while working,
the argument is a substring of the expanded id:
`node tests/parity.js "tables/voa"`.

Must pass: the whole unit suite, per-file coverage thresholds, 0 svelte-check
errors, prettier clean, the `a11y.test.ts` guard, and no `VISUAL_DEBT` entry
stale in either direction apart from the ten drift entries above.

## Session gotchas

Carried forward, all still true:

- **A whitespace text node between two `display:block` siblings is invisible
  on screen and present in `textContent`.** Only the controls spec catches it,
  because a row's accessible name is deliberately its whole content.
- **A space written on its own line inside an `{#if}` block is trimmed away
  entirely, not collapsed to one** - a different rule from whitespace
  *between* two elements, which does collapse to a single space. Both need
  `<!-- prettier-ignore -->` on the whole element the same way, with the
  content written on one line rather than split across several.
- **Two CSS rules of equal specificity: the one written later in the file
  wins, not the one that reads as "the override."** `.field:last-child`
  (line 151) loses to `.ffilter .field` (line 927) because it comes first,
  even though a `:last-child` reset reads like it should win. Measure the
  computed value in both apps; do not reason from which rule looks like an
  override.
- **A pixel diff that "grows" down a long list is usually one constant offset
  higher up.** Measure `getBoundingClientRect()` - or, without a live DOM,
  scan the screenshot's own pixels column by column - on two elements before
  assuming a row itself is wrong. This is what found both the B1 toolbar
  margin and B2's panel height.
- **Parity output is buffered when redirected.** Write to a real file and grep
  it afterwards rather than piping through `tail` - and prefer running the
  node process itself in the background over piping through `tail` in the
  same command, since a `| tail -N` truncates before the file write finishes
  and can hide the summary line.
- **A parity run wipes `test-output/parity/`.** Analyse a diff image before
  starting another run. `pngjs` is already a dependency and is useful for
  cropping one, or for scanning a single pixel column to find exactly where
  two screenshots diverge vertically - faster than eyeballing crops back and
  forth.
- **The tool call cap is about 178 seconds.** A full parity run - or even a
  broad filtered one - exceeds it; run it in the background and wait for the
  notification rather than polling with short foreground commands.
- **Stray puppeteer `chrome.exe` processes accumulate across backgrounded
  parity runs on this machine and slow down everything else, including
  unrelated `vitest` runs (the a11y suite's axe checks are CPU-heavy and hit
  the default 5s test timeout under load).** If a test that doesn't touch
  anything you changed times out, check `tasklist` for a pile of `chrome.exe`
  before assuming the test itself is flaky; killing them and re-running is
  the fix, not raising the timeout.
- **The equipment nav chip and the `equip` kind chip are the same word** in
  both languages. A parity `enter` that clicks it on `#/tables/wondrous` finds
  the navigation link, not the panel chip. Grip the "items" chip instead.
- **`.ffilter` is declared twice in `style.css`** (926 and 948) and the second
  wins: the panel's top margin is 10px, not 16 - and see the `:last-child`
  gotcha above for the same file's second trap in the same block.
- **A `.fpill`'s accessible name, in the real DOM, is its text content, not
  its `title`.** The parity harness's own `NAME_FN` prefers `title` over
  content (unlike the real accessible-name algorithm), which is why the plan
  said to grip it by title - that instruction is for `tests/parity/driver.js`
  only. A component test using `@testing-library/svelte`'s real accessible-name
  computation has to grip the pill some other way - `container.querySelector`
  by class is what `tables.test.ts` does.
- **`enter` steps run before the language switch**, so they grip Russian
  names; only specs need `NAME` entries in both languages.

## Open questions

- **Pages source.** Settings -> Pages -> Source is still not "GitHub Actions",
  so a red build can still publish. Owner-side.
- **Playwright.** Phase 5 asks for it; the parity harness may already cover
  what it would. Worth a decision before building anything.
- **`Panel.svelte`.** Five copies of `.panel` before B2, six after (`.ffilter`
  is the sixth). Its own batch, unscheduled - the owner's call whether it goes
  before C or later.
- **`noData` and `storageOff`.** Two dictionary strings with no twin in the
  live app's dictionary and no parity state reaching them. Worth aligning when
  the lists slice touches storage.
- **The legacy grid-numbering bug.** `list.map(tileHTML)` in `app.js` passes
  the array index as the tile's roll number, so every tile past the first
  shows its position rather than its own roll. The rewrite draws the real
  number and records the divergence in `ACCEPTED`. Still worth reporting to
  the repository owner as a live-site defect.
- **The shared `S.kind`.** Core rules, the alternate tables and search share
  one; the rewrite gives each its own. Batch C is where that comes due - it
  has nothing to do with the tables filter, which B2 confirmed narrows by its
  own `S.fOn.kind` and always has.

## Critical files

| Path | What it settles |
|---|---|
| `issues/47/plan.md` | "B2 built: the filter" - the design, and what was found building it |
| `app.js` 1576-1587, 2595-2733, 3617-3637, 4176-4188 | the whole filter, in the app being copied |
| `style.css` 145-156, 230-256, 926-962 | every value the strip and the panel need |
| `app/src/lib/filters.ts` | the frozen `f_` grammar and the predicate |
| `app/src/lib/facets.ts` | which values a row offers and what they are called - `kind` only so far |
| `app/src/lib/hash.ts` | `parseHash`, `tablesHash` - the filter round-trips |
| `app/src/state/app.svelte.ts` | `replace`, `navigations` |
| `app/src/ports/router.ts` | `hashRouter.replace` vs `memoryRouter.replace` |
| `app/src/components/FilterBar.svelte` | the strip and the panel |
| `app/src/components/TablesPage.svelte` | the screen B3 grows next |
| `app/src/components/Button.svelte` | the toggle's base, and the one coverage exception |
| `app/src/components/a11y.test.ts` | axe on pressed states, and the `COVERED` guard |
| `tests/parity/specs.js` | `STATES`, `LANGS`, `WIDTHS`, `NAME`, `ACCEPTED`, `VISUAL_DEBT` |
| `tests/parity/driver.js` | gripping by accessible name, `type`, `click`, `settle` |
| `app/vite.config.mts` | coverage thresholds, including Button's named exception |
