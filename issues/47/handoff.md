# Issue #47 - handoff

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/plan.md`, then this file. Nothing here depends on chat history.

## Status

Phase 4 is **in progress**. Built and matching the live app apart from the
debts named in `plan.md`: all six roll modes, the record page, Batch B1 (the
four filterless tables), Batch B2 (the filter, `wondrous` and `dread`), and
now **Batch B3 - sectioned bodies and section anchors**.

**B3 shipped this session.** `voa`, `frames`, `community`, `alt_item` and
`alt_consumable` all draw in full now - `TablesPage.svelte`'s `KNOWN` list
covers eleven of the fourteen tables, leaving only the three equipment tables
(`eq_weapon`, `eq_secondary`, `eq_armor`) for B4. The row/section anchor
(`#/tables/<table>/<key>`) is wired up for the first time on every table built
so far, not only the five this batch adds - it had been parsed and ignored
since Phase 4. `label.ts`'s `srcLabel` frame case now names the campaign
rather than its raw id.

See `plan.md`'s "B3 built: sectioned bodies and section anchors" for the full
account, including how the four open questions the planning session left were
resolved and what changed from the plan while writing the code (the row/tile
markup and the section heading became real components, `TableRows.svelte` and
`SectionHead.svelte`, rather than local snippets - a linter limitation forced
that, documented there in full).

## Files changed this session

New:
- `app/src/lib/frames.ts`, `app/src/lib/frames.test.ts`
- `app/src/components/TableRows.svelte`, `app/src/components/SectionHead.svelte`

Changed:
- `app/src/lib/data.ts` - `Index.altColumn`, tested in `data.test.ts`
- `app/src/lib/label.ts` - `srcLabel`'s frame case, tested in `label.test.ts`
- `app/src/lib/alt.ts` - `rarityLabel(r, t)`, the alt tables' own rarity heading
- `app/src/lib/facets.ts` - `tier`/`frame`/`comm` rows, rewritten tests in
  `facets.test.ts` (the signature grew a `lang` parameter)
- `app/src/lib/dict.ts` - `frameF`, `commF`, `copySection`, `sectionLinkCopied`
- `app/src/components/TablesPage.svelte` - `KNOWN` grown to eleven tables, the
  sectioned-body derivations (`tierSections`/`frameSections`/`commSections`/
  `activeSections`, `altSections`), the anchor-scroll effect, `copySectionLink`;
  the row/tile markup and its CSS moved out to the two new components
- `app/src/components/tables.test.ts` - fixture grew `voa`/`frames`/`community`/
  `alt` data; new `describe` blocks for each sectioned body, the alternate
  tables' numbering and missing select-all, the row/section anchor, and a
  second accessibility check on a sectioned body
- `app/src/components/a11y.test.ts` - `COVERED` grew `SectionHead.svelte` and
  `TableRows.svelte`; `STATES` grew a sectioned table's filter panel (two
  fields); the fixture's `voa` grew a second row so that panel actually has
  two fields to show
- `tests/parity/specs.js` - the five `pending` B3 entries are now real states;
  added a section-anchor arrival (`#/tables/voa/tA`), a row-anchor arrival on a
  **B1** table (`#/tables/core_item/ci1` - this is what verifies the anchor fix
  on tables that shipped before this batch), and `#/i/f1` (a frame-equipment
  record, catching the `srcLabel` fix)
- `issues/47/plan.md` - "B3 built" section, the Phase 4 summary table, the
  "not built" list

## Tests and checks run

- `npm run check` - **passes**: format, lint, typecheck (0 errors), data
  build, `derived`, `i18n`, and the full Vitest suite (657 tests, all
  thresholds met including `SectionHead.svelte`'s function coverage, which
  needed one more test - clicking its own copy-link button - to clear 80%).
- `npm run check:built` - **passes**: build, `file://` smoke, bundle budget
  (56.8 kB gzip, well under the 120 kB budget).
- `node tests/parity.js "tables"` - **passes clean** (`расхождений нет`) after
  two real fixes and a full round of `VISUAL_DEBT` bookkeeping - see below and
  `plan.md`'s "What every remaining VISUAL_DEBT entry is" for the full account.

## Parity results

Filtered `tables` run, final state: every B1/B2 state still matches its
existing recorded debt (no regression from moving the row/tile markup into
`TableRows.svelte`); every new B3 state is one of the six already-documented
noise causes, recorded fresh in `VISUAL_DEBT`. Two real bugs were found and
fixed along the way, both only reachable through the anchor feature this
batch is the first to wire up:

1. **A font-loading race put the anchor scroll target a few pixels off.**
   `scrollIntoView` computes its target from the layout at the moment it is
   called; the monospace numerals in `.rnum`/the toolbar are wide enough that
   swapping from the fallback font to the real one shifts a row a handful of
   pixels, and a scroll computed before that swap lands short by exactly that
   much. Confirmed deterministic (not jitter) with a standalone script
   launching fresh browsers repeatedly: the live app landed on the same
   `scrollY` every time, the rewrite alternated between two values 8px apart
   depending on how the race fell. Fixed in `TablesPage.svelte`'s anchor
   effect by waiting on `document.fonts.ready` before scrolling; the flash
   itself still fires immediately (it does not depend on layout), matching
   the live app's own synchronous timing.
2. **`SectionHead.svelte` was missing style.css's mobile override for
   `.tsec-link`** (`padding:11px;margin-bottom:2px` under 600px - a bigger
   touch target for an otherwise-20px icon button). Missing it made every
   section heading 10px shorter than the live app's on a phone, and because
   each `.tsection`'s offset compounds with the ones above it, the drift grew
   down a table with several sections - the third instance of the
   "one constant offset reads as growing drift" pattern (B1's toolbar margin,
   B2's `.field:last-child` tie, now a mobile-only override that was ported
   once but only for the base width). Fixed by adding the media query to
   `SectionHead.svelte`.

`VISUAL_DEBT` gained entries for: the five sectioned tables' own routes
(same two causes every table since B1 carries - placeholder antialiasing at
768px, description line-wrap at 375px); the row and section anchors' small
flash-outline antialiasing at 1100/768 (English only - not investigated
further why English alone shows it, see open questions); and the row/section
anchors' larger 375px numbers, which are the *same* description-wrap noise,
just multiplied because arriving at an anchor scrolls past the toolbar and
filter bar, bringing several description-heavy rows into the fold together
where the bare route only ever showed one or two. Confirmed by measuring the
anchored row/section directly (`getBoundingClientRect()` on every row inside
Vault of Ages' artifact section, both apps) before writing that reason down -
every row's name and height matched exactly; the whole difference is text
reflow, not a missing or misplaced element.

## Deviations from the plan, and why

- **`TableSection.svelte` was not built; `TableRows.svelte` and
  `SectionHead.svelte` were, instead.** The plan's open question 3 asked
  whether a section wrapper was worth its own component. It turned out to be
  the wrong question: the wrapper (`<div class="tsection">` plus a heading) is
  three lines and stayed inline in `TablesPage.svelte`; the *row and tile
  markup* is what actually wanted extracting, because eslint-plugin-svelte
  flags every `{@render}` of a locally-declared `{#snippet}` as a
  `no-confusing-void-expression` violation - confirmed with a two-line
  reproduction outside this component, so it is a tool limitation rather than
  a mistake in the markup. Every existing snippet in this codebase is a prop
  (`Snippet<T>`) rendered by a child, never rendered by the component that
  declared it; this batch was the first to want that shape, four times over
  (tier, frame, community, and each alt-table column all draw the same rows).
  `TableRows.svelte` (the rows/tiles, plus the "select all" bar - off
  `renderList`/`selectAllHTML`/`rowHTML`/`tileHTML` in app.js) and
  `SectionHead.svelte` (the heading and its copy-link button - off
  `sectionHead()`) are both used by five call sites now.
- **`facetRows` grew a fourth parameter, `lang`.** The plan's sketch threaded
  `t` (the `Dict`) alone into `frameName`/`communityName`; both of those
  actually need the `Lang`, matching `sections.ts`'s existing
  `communityName(c, lang)` signature. `facets.test.ts`'s existing calls all
  needed updating (`facetRows(index, table, t)` -> `facetRows(index, table, t,
  lang)`), and one pre-existing test ("answers nothing for a table with no
  kind facet at all", written against `community`) had to move to `hnf_item`:
  `community` now always answers with its `comm` row, so it was never really
  testing "no facet at all" once B3 landed.

## Session gotchas found this session

- **A locally-declared `{#snippet}` rendered with `{@render}` in the same
  file trips `@typescript-eslint/no-confusing-void-expression`, every time,
  regardless of arguments or nesting.** Reproduced with a two-line component
  (`{#snippet foo(n: number)}<span>{n}</span>{/snippet}` then bare
  `{@render foo(x)}`) - the error is not about the argument, the surrounding
  markup, or anything specific to this batch's code. The fix is the codebase's
  existing convention: pass a `Snippet<T>` prop down and let the child render
  it, or - what this batch did - extract the markup into a real component.
  Worth checking for before reaching for a local snippet again.
- **A community record's or a frame-equipment record's own source badge
  carries the exact same string as its section heading.** `srcLabel` for
  `community` already returned the community's own name before this batch;
  after this batch's fix, a frame's badge does too. A component test that
  greps a section's label by text (`screen.getByText('Пир зверей')`) will find
  two matches - the heading and every row's badge - once there is more than
  one row in the section. Assert the heading count via `.tsec-head .lbl`
  (or similar) rather than a bare text match once a section has real rows.
- **`Element.prototype.scrollIntoView` does not exist in this jsdom setup** -
  not merely a no-op, an actual `TypeError` when called. `vi.spyOn` cannot be
  used because the property is not there to spy on; assign a `vi.fn()`
  directly (`Element.prototype.scrollIntoView = vi.fn()`) in whichever test
  needs it.
- **`npx vitest run --coverage` and `node tests/parity.js` fight over the
  CPU exactly the way CLAUDE.md's stray-`chrome.exe` gotcha describes** - a
  vitest run started while a parity run's puppeteer Chrome instances were
  still up hit five spurious `Test timed out in 5000ms` failures across two
  unrelated files, none of them real - a rerun once the parity run finished
  passed clean. Don't run them concurrently; check for lingering `chrome.exe`
  processes before trusting a timeout.
- **A pressed a11y state needs its fixture to actually produce the shape being
  tested.** The a11y-suite's own `voa` fixture had one row (kind `item`
  only), so opening its filter panel drew a single `tier` field - the `kind`
  row needs two different kinds present before `facetRows` includes it at
  all. The state exists to catch `.field:last-child`'s cascade tie (B2's own
  finding) mattering for real with two fields; a fixture with one field
  doesn't reach it. Needed a second `voa` row of a different kind before the
  new pressed state was actually testing what it claims to.
- **A parity run wipes `test-output/parity/` on every invocation, including a
  single-state filtered one.** Losing the B3 sectioned-body diff images to a
  follow-up single-state debugging run cost a full 9-minute rerun to get them
  back. Copy anything worth keeping out of `test-output/parity/` before
  running a second, narrower filter.
- **A large, unexplained `VISUAL_DEBT` percentage is worth a standalone
  puppeteer script before a reason gets written down.** The technique that
  found both real bugs this session: launch a small script with the exact
  same `args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']`
  the harness uses (omitting them makes results non-deterministic - GPU
  rendering path differs from the harness's software one), navigate both
  `index.html` and `dist/index.html` to the same route, and read
  `window.scrollY` / `getBoundingClientRect()` / computed styles directly via
  `page.evaluate`. Cross-correlating two screenshots at different vertical
  offsets (shift one by `dy` and find the `dy` that minimises the pixel
  difference) is what told a real layout bug apart from a pure scroll-position
  mismatch in under a minute, where reasoning from the diff image alone had
  produced two wrong theories first.
- **A standalone reproduction script that omits the harness's launch args can
  look flaky when the real bug is not.** The same script gave inconsistent
  results (a screenshot diff that varied between runs) with a bare
  `puppeteer.launch()`, and became stable and repeatable once it launched with
  the harness's own `args: ['--no-sandbox', '--disable-dev-shm-usage',
  '--disable-gpu']`. Chase determinism in the reproduction before concluding a
  bug itself is non-deterministic.

## The exact next implementation batch

**B4 - the equipment tables, their facets and tier sections.** The last body
shape: `eq_weapon`, `eq_secondary`, `eq_armor`. `docs/specs/ROUTES.md`'s
filter-grammar table and `lib/filters.ts`'s `EQ_GROUPS`/`EQ_TABLE` already
describe the groups (`tier`, `src`, `cls`, `trait`, `range`, `burden`, `line`)
- frozen, no change expected there. `lib/data.ts`'s `equipFacets` already
answers every value a record has for those groups; `facets.ts` needs an
`eqFacetRows` (or similar) the way B2/B3 added the plain-table rows, off
`eqFacets(kind)` in app.js (2575-2620ish - re-read it fresh rather than
trusting this line range).

Two things B4 should check early, both flagged in earlier handoffs and still
true:

1. **The bare-number pill rule (`fChosen`'s `/^\d+$/` test) is B4's for
   real this time.** B3's own session confirmed `voa`'s tier facet never hits
   it - `voaSectionName` already produces `"Ранг 2"`, not a bare digit - but
   the *equipment* tables' tier facet (`eqFacets`) really does carry bare
   `"1"`-`"4"` values, which is exactly the case `FilterBar.svelte`'s existing
   rule was written for and has been sitting untested since B2. Confirm it
   still does the right thing once a numeric-valued facet actually exists.
2. **Whether the equipment tables need tier sections in addition to facets.**
   The plan's own naming ("B4 - the equipment tables, their facets and tier
   sections") suggests yes - re-read `renderEquipTable` in app.js before
   assuming the facet bar alone is the whole body; B1-B3 all found the real
   shape only by reading the function, not by trusting a summary of it.

Before writing code: nothing to confirm here - this session's own
`node tests/parity.js "tables"` run finished clean (`расхождений нет`); see
"Parity results" above for what it found and fixed along the way.

## What not to start yet

Carried forward, all still true:

- **Do not touch Phase 7.** `index.html`, `app.js` and `style.css` are the
  parity harness's expectation.
- **Do not point Pages at `dist/`.** Needs the owner to switch Settings ->
  Pages -> Source first.
- **Do not start Playwright.** Ask first.
- **Do not implement the equipment facets outside B4.**
- **Do not chase the help-panel, search-placeholder or description-reflow
  debts** without opening the diff image first.
- **Do not translate the legacy Russian comments** in `app.js`/`style.css`.

## Quality gates for a slice

```
npm run check          # format, lint, typecheck, data, derived, i18n, tests
npm run check:built    # build, file:// smoke, bundle budget
node tests/parity.js   # the rewrite against the live app
```

`check:built` is required for a slice that alters what a screen draws. A full
parity run takes about nine minutes; filter while working:
`node tests/parity.js "tables/eq"` once B4 starts.

## Open questions (carried and new)

- **Pages source.** Still owner-side, still not switched.
- **Playwright.** Still worth a decision before building anything.
- **`Panel.svelte`.** Still unscheduled - `.ffilter`, `.tablenav` and now
  nothing new from B3 (`TableRows`/`SectionHead` are not `.panel` copies).
- **`noData` and `storageOff`.** Still untouched, still waiting on the lists
  slice.
- **The legacy grid-numbering bug**, still worth reporting to the repository
  owner, still deliberately not reproduced.
- **The shared `S.kind`.** Still batch C's.
- **The equipment tables' body shape** - see "the exact next implementation
  batch" above: confirm from `renderEquipTable` rather than assuming facets
  alone are the whole story.
- **Why the row/section anchor's flash-outline antialiasing (`VISUAL_DEBT`,
  ~0.4-0.6%) shows up in English but not Russian at 1100/768.** Confirmed real
  and small (the target's own position and content measure pixel-identical;
  only the 2px outline differs), and low-priority given the size, but the
  language asymmetry itself was not chased down - worth a look if a future
  session touches the flash mechanism again and wants to close it out.
