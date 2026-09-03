# Issue #47 - handoff

Recovery state for the next session. Read `CLAUDE.md`, then
`issues/47/plan.md`, then this file. Nothing here depends on chat history.

## Status

Phase 4 is **in progress**. All six roll modes, the record page, and now
**Batch B1 of the tables slice** (the four filterless tables: `core_item`,
`core_consumable`, `hnf_item`, `hnf_consumable`) are built and match the live
app exactly, apart from the debts named below. `npm run check` and
`npm run check:built` both pass. A full `node tests/parity.js` reports ten
failures, none of them in the Tables work - nine are known Windows-rendering
drift carried forward from earlier sessions, and one is a new instance of the
same drift on a record-page state this session never touched. See "Ten parity
failures that are not yours" further down.

## Completed this session

Batch B1, in one slice:

- **`app/src/lib/tables.ts`** (+ `tables.test.ts`) - `TABLE_GROUPS`,
  `SUB_LABEL`/`subLabelOf`, `groupOf`. Tested for exhaustiveness against
  `TABLE_IDS` so a table can never fall through the nav ungrouped.
- **`app/src/components/TablesPage.svelte`** (+ `tables.test.ts`) - the chip
  nav (book row, sub row), the toolbar (search, copy-table-link, list/grid
  switch), rows and tiles, the selection checkbox and select-all, the empty
  state, and a row opening the record modal. Every table id resolves through
  the nav; the ten tables B1 does not draw fall through to a `.todo`
  placeholder rather than crashing.
- **`Chip.svelte`** grew an `href` form (a real `<a>`, matching the tab bar)
  and a `size="sm"` variant for the sub-row. **`ChipRow.svelte`** grew a `sub`
  flag for the same row's spacing. Both were second uses, not designed ahead.
- **`Chip.test.ts`** - new, both render forms directly, since `Chip` now has
  behaviour of its own the parent tests do not each exercise.
- **`tests/parity/driver.js`** - added `type(placeholder, text)` (a table's
  query lives in memory and never reaches the address, so a spec has to type
  into it directly), and widened `click()`'s selector to include `input` (it
  already found checkboxes via `has()`; `click()` had not, and the selection
  checkbox has no other way to be pressed by name).
- Eight parity states: `#/tables`, `#/tables/hnf_consumable`, `~ grid`,
  `~ searched`, `~ nothing found`, `~ a row opened`, `~ a row ticked`,
  `~ help`. All exact except the debts below.
- `docs/specs/FEATURES.md` needed no change - it already described the finished
  feature, not the build order.

**Three things found while building it**, all written up in `plan.md` under
"B1 built: the plain table" with full detail - short version:

- **A legacy numbering bug in the grid view, not reproduced.**
  `list.map(tileHTML)` in `app.js` passes the array index as the tile's roll
  number, so every tile past the first shows its position instead of its own
  roll. Confirmed against `data.js`. The rewrite draws the real number and
  records the divergence in `ACCEPTED` rather than copying the bug forward
  into the version that survives the cut-over. Worth mentioning to the
  repository owner.
- **Two invented-not-copied spacing values**, worth 12px of vertical drift that
  got worse every row down the table (one constant offset reading as "growing"
  the further into a long list you look, not an actual per-row difference).
  `.toolbar`'s real `margin-bottom` in style.css is 18px; the port had guessed
  6px and also missed that a wrapping div's own 6px top margin collapses into
  the larger figure rather than adding to it.
- **Whitespace the Svelte compiler inserts between block siblings changes
  `textContent`, invisibly.** Three boundaries needed the tight `>`/`<`
  placement pattern (name/stat-line, row/badges, tile-number/tile-name), and
  Prettier undoes that placement for a short tag like `<div class="tile-b">`
  on every format unless the `<!-- prettier-ignore -->` sits before the whole
  `<button>`, not before each inner `<div>`. See "Session gotchas" below for
  how to recognise this class of bug again.

## Ten parity failures that are not yours

A full unfiltered `node tests/parity.js` run at the end of this session reports
**10 расхождений on this machine**. Nine are unchanged from before this
session and were not re-verified again this time, but nothing this session
touched could have affected them - Wondrous and the record page share no code
with `TablesPage.svelte` or anything it imports. Verified in an earlier
session via `git stash push -u`, rebuild, run the failing states - the numbers
came back identical:

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
```

**The tenth is new this session and worth a second look, not a shrug:**

```
#/i/ci1 ~ whole @ ru 1100        5.92 vs 5.29
```

Same state family as the eight `~ whole` entries above, but at 1100px, which
had been exact on this machine until now. This session touched no file that
record-page rendering depends on - not `RecordCard.svelte`, `RecordPage.svelte`,
`RecordModal.svelte`, `label.ts`, `desc.ts`, `i18n.ts`, `hash.ts`, `data.ts`, nor
`styles/tokens.css` - so there is no code path connecting this session's actual
changes to that failure. It reads as the same Windows-vs-Linux rendering drift
as the other nine, just crossing the threshold at a width that happened to sit
just under it before. It was **not** re-verified with the stash-and-rebuild
check this session, because there was no clean baseline to stash back to that
would isolate it (every uncommitted change this session is Tables-only and
shares no path with the record page) - so treat it as suspected same-cause
drift, not confirmed, and give it the stash check first if it is still failing
next session.

**All ten were left alone on purpose.** The nine recorded numbers were set on
the Linux agent, CI runs there, and re-recording them to this machine's
rendering would only move the failure to CI. Do not re-record them; do not
chase them further.

## Remaining work, in batches

**Batch B2 - the filter**, next. The bar, the chosen pills, the folded panel,
reset, the filter link, the `f_` segment - `plan.md`, "The tables surface, and
how it splits", has the full reasoning. Unlocks `wondrous`, `dread`,
`community` (any table with a `kind`/`comm` facet but no sectioned body).
`lib/filters.ts` already holds the parsing and the predicate logic
(`groupsFor`, `decodeFilter`, `encodeFilter`, `passes`, `chosenCount`) -
tested, and unused until B2 wires a panel to it. Nothing in B1 needs
revisiting to build B2 on top of it; the toolbar and row/tile markup are
already shaped to take a filter bar between the toolbar and the body, the way
the live app's `fBarHTML` sits between `searchBar` and `body` in `app.js`.

**Batch B3 - sectioned bodies and section anchors**: `voa`, `frames`,
`community`, and the two alternate tables. The anchors `#/roll/alt`'s crit box
already links to (`#/tables/alt_item/<rarity>`) land here.

**Batch B4 - the equipment tables**, their facets and tier sections. The last
body shape; `#/tables/eq_weapon` stays `pending` until then.

**Batch C - search** (`#/search`). `lib/search.ts` exists. The row is now
built in `TablesPage.svelte` and is the second use search reuses - per
CLAUDE.md's extraction rule, this is the point at which the row markup should
move into its own component (`Row.svelte` or similar), since a second caller
now genuinely exists. Do not extract it before search actually needs it.

**Batch D - lists** (`#/lists`). Pays off the outstanding add-to-list debts on
both record routes, both roll modals, and now the table row's modal, plus adds
the selection bar B1 left honestly missing (`#/tables ~ a row ticked`).

**Batch E - print** (`#/print/<ids>`). Pays the print half of the same row.

**Batch F - the toast.** Small, and it closes `~ pinned` and `#/i/ci1 ~ toast`.
Could be folded into any batch above.

Then Phase 6 (deployment, the `_site` file list becomes `dist/`) and Phase 7
(cut-over: delete `index.html`, `app.js` and `style.css` and the legacy
suites).

## Ordered next steps

1. Read `CLAUDE.md`, this file, `issues/47/plan.md`, then `docs/specs/ROUTES.md`
   ("Filter grammar") and `docs/specs/FEATURES.md` ("Tables and search",
   the filter-panel bullet).
2. Confirm the environment - see "Environment" below.
3. Build B2: a `FilterBar.svelte` (or similar) reading `lib/filters.ts`,
   wired for `wondrous`, `dread` and `community` first (their facets are
   `kind`/`comm` only - no sectioned body yet, so B2 can prove the filter in
   isolation before B3's section splitting complicates the picture).
4. Measure, record any debt with a reason that names **everything** the state
   is short of - see CLAUDE.md, "the debt's reason" - run both gates and a
   full parity run, commit.
5. Update `docs/specs/FEATURES.md`, `plan.md` and this file in the same commit
   as the behaviour.

## What not to start yet

- **Do not touch Phase 7.** `index.html`, `app.js` and `style.css` are the
  parity harness's expectation. Deleting them ends the ability to verify
  anything.
- **Do not point Pages at `dist/`.** Phase 6, and it needs the owner to switch
  Settings -> Pages -> Source first.
- **Do not start Playwright.** Ask first whether it earns its place - the
  parity harness already drives both apps in a real browser.
- **Do not chase the help-panel debts** (Wondrous, Core rules, or the new
  Tables one). All three are measured identical character-for-character;
  there is nothing to copy.
- **Do not chase the search-box placeholder debts either**, for the same
  reason - measured pixel-identical box and text, the remainder reads as
  antialiasing on thin glyphs.
- **Do not re-record the ten failing debts** - nine from earlier sessions, one
  new this session. Give the new one the stash-and-rebuild check first if it
  is still failing, since it was not verified that way this time.
- **Do not translate the legacy Russian comments** in `app.js`, `style.css`
  and the older suites. Those files are deleted at the cut-over.
- **Do not extract the row into its own component yet.** It has one caller
  (`TablesPage.svelte`). Search is the second, and CLAUDE.md's rule is second
  use, not anticipated use.

## Quality gates for a slice

```
npm run check          # format, lint, typecheck, data, derived, i18n, tests
npm run check:built    # build, file:// smoke, bundle budget
node tests/parity.js   # the rewrite against the live app
```

`check:built` is required for anything that alters what a screen draws. A full
parity run takes about nine minutes here; filter while working, the argument
is a substring of the expanded id: `node tests/parity.js "tables ~ grid"`.

Must pass: 613+ tests, per-file coverage thresholds, 0 svelte-check errors,
prettier clean, and no `VISUAL_DEBT` entry that is stale in either direction -
apart from the ten machine-drift entries above.

## Environment

**This session ran natively on Windows** at `E:\dev\daggerheart-loot`, not in a
Linux sandbox reaching the repository over a host mount. The `/tmp` mirror
described in `CLAUDE.md` has nothing to mirror here, and none of the mount
costs apply. Measured this session, from the repository root:

| | this machine |
|---|---|
| `vitest run --coverage`, 30 files | ~40 s |
| `svelte-check` | a few seconds |
| `eslint .` | a few seconds |
| `vite build` | ~1 s |
| `npm run check` end to end | ~2 min |
| one filtered `node tests/parity.js "tables"` run | ~2-3 min |
| full `node tests/parity.js` | ~9 min |

So: **check which kind of session you are in before paying for a mirror.** If
`node -v` and `npx eslint` on a couple of files answer in seconds, work in
place.

**`npm run check`'s `format:check` step may report `.claude/settings.local.json`
as unformatted.** That file is gitignored and belongs to the local session,
not the repository - it is not something to fix, and not evidence that
anything you touched is misformatted. Run `npx prettier --check .` yourself
and read past that one line, or check the specific files you edited.

## Session gotchas

- **A whitespace text node between two `display:block` siblings is invisible
  on screen and present in `textContent`.** The layout does not show it, so a
  parity screenshot cannot catch it - only the "controls on the page" spec
  can, because it reads accessible names, and a row's accessible name here is
  deliberately its whole content (no `aria-label`; confirmed against the live
  markup). When a button's name has to match character-for-character and the
  markup crosses a block-element boundary, check whether the two apps'
  concatenated text agree before assuming the render is fine because the
  screenshot is.
- **Prettier does not reliably preserve the `>`/`<` whitespace-suppression
  trick on a tag that fits on one line**, even when the source already has it
  split. It keeps the trick on a tag it is forced to wrap anyway (long
  attributes), but reformats a short one like `<div class="tile-b">` back onto
  its own line, silently reintroducing the collapsed-whitespace bug on the
  next format. If a fix like this has to survive formatting, put
  `<!-- prettier-ignore -->` before the outermost element whose whole subtree
  needs protecting, not before each inner element - ignoring a node protects
  everything inside it, and ignoring only the inner elements leaves the gaps
  between them exposed again.
- **A pixel diff that "grows" down a long list is usually one constant offset
  higher up, not a per-row difference.** `#/tables`'s rows were each a correct
  78-80px tall on both apps; the apparent growth in the diff image was a
  single 12px gap between the toolbar and the first row, repeating unchanged
  at every row below it. Measure `getBoundingClientRect()` on a `[data-row]`
  or two before assuming the row itself is wrong.
- **Parity output is buffered when redirected.** Use a real file
  (`node tests/parity.js "x" > /tmp/out.txt 2>&1; grep ...`) in one shell
  command rather than piping through `tail` first - `tail` discards
  everything before the cutoff, including `FAIL` lines you need to grep for
  afterward.
- **A parity run wipes `test-output/parity/`.** Analyse a diff image before
  starting another run, or it is gone. `pngjs` (already a dependency) is
  useful for cropping a diff image to a specific region when eyeballing the
  whole screenshot is not precise enough - see the crops used to find the
  toolbar-margin bug this session, none of which were committed.
- **The tool call cap is about 178 seconds.** A full parity run exceeds it;
  run it in the background and wait on it, or filter to the states you need.

## Open questions

- **Pages source.** Settings -> Pages -> Source is still not "GitHub Actions",
  so a red build can still publish. Owner-side; nothing in a workflow can fix
  it.
- **Playwright.** Phase 5 asks for it. The parity harness may already cover
  what it would. Worth a decision before building anything.
- **`noData` and `storageOff`.** Two dictionary strings in the rewrite have no
  twin in the live app's dictionary. Neither is reachable by any parity state
  today; `#/tables` with `noData()` now exercises `noData` in a unit test, but
  no parity state does. Worth aligning when the lists slice touches storage.
- **The kind filter's scope.** The live app shares one `S.kind` across Core
  rules, the alternate tables and Tables; the rewrite gives each panel its
  own. Nothing compares it. B2 is where a person might notice, and `plan.md`
  records the decision.
- **The legacy grid-numbering bug** (see above) - worth reporting to the
  repository owner as a live-site defect, independent of this migration.

## Critical files

| Path | What it settles |
|---|---|
| `tests/parity/specs.js` | `STATES`, `LANGS`, `WIDTHS`, `NAME`, `ACCEPTED`, `VISUAL_DEBT` |
| `tests/parity.js` | the runner: matrix expansion, one page per target, coverage report |
| `tests/parity/driver.js` | gripping by accessible name, `type`, `click`, `settle`, waiting for artwork |
| `app/src/components/a11y.test.ts` | axe on pressed states, and the `COVERED` guard |
| `app/src/components/TablesPage.svelte` | the plain table: nav, toolbar, rows, tiles, selection |
| `app/src/lib/tables.ts` | `TABLE_GROUPS`, `SUB_LABEL`/`subLabelOf`, `groupOf` |
| `app/src/lib/filters.ts` | the facet grammar B2 wires up next |
| `app/src/components/PageHead.svelte` | the heading, the two round buttons, the help panel |
| `app/src/lib/help.ts` | the help shape: text, links, bold words, breaks - `tables` is in `HELP` now |
| `app/src/lib/dict.ts` | `Dict` derives from the Russian side; parity is a compile error |
| `vite.config.mts` | the artwork links, the `file://` build, coverage thresholds |
| `app.js`, `style.css`, `index.html` | the expectation. Read values from here, never guess |
