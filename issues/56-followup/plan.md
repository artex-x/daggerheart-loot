# Plan - TASK 56-followup

## Status

- Task status: **reopened, in_progress**. B1 and B1r are done, committed and
  pushed (`106e4dd`, `33d0b26`, `2d2e983`, `c92c8e8`, `bb55a2d`). The human
  tested the published site on 2026-09-16 and rejected one half of B1's
  provenance policy; **B2 below is the next batch**. See "B2 direction" for
  which of B1's settled lines survive and which are void.
- NEEDS_HUMAN_CONFIRMATION: no. The human settled the two ends of the rule
  (a complete path at the top of a record page, a bare tag in a badge). The
  open middle - what a badge shows for a frame and a starting record, whether
  the print card and the share stubs are tags or paths, and what happens to
  `whereFrom`'s community branch - is decided in "B2 direction" below.
- HEAD moves under this task: a second session commits to the same `main`
  working tree for `issues/config-audit` and `issues/47`. Re-read HEAD and
  `git status` at the start of B2; do not assume the tree is what a document
  here last recorded.
- History below this line is the B1/B1r record. It stands except where the
  "B2 direction" section marks a line void.

- Gate remediation (2026-09-15): completed the final Svelte-check fixes after
  `33d0b26`. `eqLine` now accepts the established `noTier` option, its
  fixture coverage applies frame-tier suppression, the Other-frame test uses
  safe indexed access, and the hash regression uses canonical `other_frames`.
  Focused Vitest, standalone typecheck, and `npm run check` are green.

- Contract-remediation follow-up (2026-09-15): the authoritative `f7` stat-line
  fixture now omits direct frame-equipment tier labels in both languages,
  matching the settled presentation policy. Focused `node tests/run-all.js
  app/contracts` completed successfully (exit 0); the 38 pre-existing
  generator-produced structural golden updates remain intentionally retained
  for the final batch verification and review.
- (historical, B1) Task status: in_progress; B1 has a large interrupted,
  uncommitted implementation that must be adapted to the two-subtable
  direction. **Superseded: B1 and B1r landed; the tree is clean of them.**
- Starting commit: `8dae1b9f7111034f4ee9a9d3841679acc8010cba` on `main`.
- (historical, B1) NEEDS_HUMAN_CONFIRMATION: no. The human chose a real
  two-subtable Other group and delegated ids, compatibility, contents,
  anchors, backlinks, and filters to planning; those decisions are settled
  below and are **not** reopened by B2.
- (historical, B1) "Preserve the current working tree" applied to B1's
  interrupted implementation only. **Void for B2**: B1/B1r are committed, and
  the only tree state B2 must preserve is the concurrent session's.

## Current state and objective

The catalogue has 1091 records. The canonical non-rollable `starting`
collection has 30 records; the canonical `frames` collection has 94. One
starting record, `f95` Network Tether, carries `frame: motherboard`, so the
human wants it presented with its setting rather than with generic starting
items. The remaining 29 starting records have no frame metadata.

The interrupted tree already fixes the Svelte Search subtitle/current 1061
surfaces, derives a 124-row browse pool without changing canonical indexes,
labels the former frame navigation Other/Прочее, classifies `f95` under
Motherboard, and changes its Russian title/description to the daggerheart.su
term `Сетевой Узел` / `сетевой узел` in `data.js` and generated outputs.
However, it still implements Other as one table and is internally inconsistent:
production has largely returned to `frames`, route fixtures and generated
states still contain partial `other` paths, and deleted/new snapshot names
reflect earlier superseded designs.

Finish B1 as a top-level **Other / Прочее** group with two real subtables,
analogous to Core's item/consumable pair:

- `#/tables/other_starting` - **Starting items / Стартовые предметы**;
- `#/tables/other_frames` - **Frame items / Предметы сеттингов**.

Those are the descriptive page headings. The shorter navigation subchips are
**Starting / Стартовые** and **Frames / Сеттинги** so the two-chip row fits the
existing 260 px mobile ceiling without weakening the page titles.

The old frozen `#/tables/frames` path remains a compatibility alias for
`other_frames`; it is not a third visible subtable. Starting items stay
non-rollable, `f95` appears once under Motherboard, and global/search/roll
indexes retain their existing totals and semantics.

## Evidence and settled design

### Canonical ids and navigation

- Add canonical `TableId`s `other_starting` and `other_frames`; remove
  `frames` as a canonical/navigation TableId.
- Add one `TableGroup` with id `other`, label **Other / Прочее**, top/default
  `other_starting`, and ordered subtables
  `['other_starting', 'other_frames']`. Clicking the top-level group opens
  Starting items, matching the existing first-subtable behavior used by Core.
- Navigation subchip labels are exactly **Starting / Стартовые** and
  **Frames / Сеттинги**. Descriptive page headings remain
  **Starting items / Стартовые предметы** and
  **Frame items / Предметы сеттингов**. This follows the existing pattern in
  which short subchips identify sibling tables while the page heading carries
  the full category name. In touched Russian UI/help/docs use daggerheart.su's
  term **сеттинг**, including the frame-filter label **Сеттинг**; keep
  code/schema/filter key `frame` unchanged.
- Measured gate evidence is authoritative: the descriptive Russian subchips
  total 293 px at the 360 px viewport, exceeding `audit2`'s 260 px ceiling.
  The naming correction is content-only. Do not shrink type, reduce spacing,
  wrap, truncate, horizontally scroll, or change the group/subchip layout.
- There is no `#/tables/other` route. `other` is navigation grouping only.

### Contents, sections, and pure selectors

- Keep `data.js` collections and `Index.rows` canonical. Remove/replace the
  current combined `otherRows(index)` API with a pure table selector that
  returns:
  - `other_starting`: `rows.starting` records with no recognized `frame`
    value - 29 records, all kind `item`, in canonical starting order;
  - `other_frames`: canonical `rows.frames` followed by framed records from
    `rows.starting` - 95 records. Today the appended record is only `f95`.
- A single pure function such as
  `otherTableRows(index, 'other_starting' | 'other_frames')` owns this split.
  Mirror it with one fallback `tablePool(id)` branch. Do not duplicate the
  split in the component, facet code, or canonical data.
- `other_starting` is a plain table body. Its route is the real category
  boundary, so it has no redundant `starting` section heading or section
  anchor. Row anchors remain available as
  `#/tables/other_starting/<record-id>`.
- `other_frames` has four existing flat setting sections and anchors in order:
  `beast_feast` 36, `colossus` 21, `dark_heart` 36, `motherboard` 2. `f95`
  appears once in Motherboard beside `f94`. Row anchors use
  `#/tables/other_frames/<record-id>`.
- No five-section combined body, nested umbrella, `starting` anchor, or
  cross-subtable 124-row screen remains. The group contains 124 unique records
  across its two routes (29 + 95), not in either route individually.

### Filters

- `other_starting` exposes no filter panel: all 29 rows are kind `item`, so a
  one-value kind facet is noise. Its memory-only table search, view toggle,
  selection, copy, and list behavior remain standard.
- `other_frames` exposes `kind` and `frame`, in that order. The 95-row pool has
  92 equipment, 2 consumables, and 1 item (`f95`), so the kind facet now has
  three meaningful values. Frame values/order and underscore-safe encoding
  remain `beast_feast`, `colossus`, `dark_heart`, `motherboard`.
- `frame=motherboard` shows 2 of 95 (`f94`, `f95`) under Motherboard;
  `kind=item` shows only `f95`; Beast Feast shows 36 of 95. Values within a
  group remain OR, groups remain AND, and unknown groups fail open.
- The legacy `frames` alias decodes filters with `other_frames`'s allowed
  groups so existing filtered links retain their meaning.

### Backlinks and legacy compatibility

- Route records semantically: a recognized `frame` value (or canonical frame
  source fallback) routes to `other_frames` before testing `starting`; an
  unframed `starting: true` record routes to `other_starting`. Thus `f95`
  routes to Motherboard, while the other 29 starters route to Starting items.
- All newly rendered navigation, filter-share, section-copy, record backlink,
  pinned-home, README, and machine-guidance links use canonical
  `other_starting` or `other_frames` paths.
- Preserve old `#/tables/frames` links as a parser/resolver alias to
  `other_frames`, including the complete tail:
  - bare route -> 95-row Frame items table;
  - `frames/<record-id>` -> matching row anchor;
  - `frames/<setting-key>` -> matching setting anchor;
  - `frames/f_<filter>` -> same decoded frame/kind selection.
- Loading a legacy URL does not proactively rewrite the address. It renders
  the canonical `other_frames` state while leaving the pasted hash intact;
  the next generated link or filter interaction uses `other_frames`. This
  avoids a navigation side effect while ensuring all future links converge.
- Treat a stored home value `#/tables/frames` as
  `#/tables/other_frames` on read in both apps, without requiring a storage
  write. It opens the correct screen and the home control compares active
  against the canonical path; the next explicit save writes the canonical id.
- Do not promise compatibility for uncommitted experimental paths
  `#/tables/other`, `#/tables/frames/starting`, or `#/tables/other/starting`.
  They were never shipped contracts.

### Translation and counters

- Preserve the already-applied canonical/generated `f95` changes:
  title `Сетевой Узел`, description occurrence `сетевой узел`. The captured
  English/Russian Motherboard pages establish these forms. Do not broaden the
  rewrite beyond this supported discrepancy.
- Preserve the already-applied Svelte 1091 subtitle/current-comment fixes and
  extended `tests/derived.js` counter audit. Historical task measurements and
  the explanatory historical guard comment remain unchanged.
- No visual mock is needed. The design uses the existing two-row group/subchip
  navigation, plain table body, sectioned frame body, FilterBar, SectionHead,
  row anchor, empty state, selection, and bilingual patterns.

### Record provenance and frame-tier presentation

> **B1 policy. Partly void as of 2026-09-16** - read "B2 direction" below
> before implementing anything from this subsection. In one sentence: every
> line here that says *path* still holds for the record page, the print card
> and the share stub; every line that extends the path to a **badge, row, tile
> or Search reference** is void, and those surfaces go back to the leaf tag.
> The frame-tier suppression rule in this subsection is untouched.

- Use one exact breadcrumb separator everywhere provenance is rendered:
  space + U+00B7 MIDDLE DOT + space (` · `). The arrows and hyphen in the
  human's examples describe hierarchy; they are not additional UI separators.
- Provenance uses the concise navigation vocabulary, not the longer page
  headings. Exact required strings are:
  - generic starting item (`ci61`): **`Прочее · Стартовые`** /
    **`Other · Starting`**;
  - Beast Feast item (`f1`): **`Прочее · Сеттинги · Пир зверей`** /
    **`Other · Frames · Beast Feast`**;
  - Network Tether (`f95`): **`Прочее · Сеттинги · Материнская Плата`** /
    **`Other · Frames · Motherboard`**.
  The same rule applies to every other starting/setting record using its
  existing localized setting name. Do not substitute `Стартовые предметы` or
  `Предметы сеттингов` inside provenance; those remain page titles only.
- Treat a record as a frame/setting record when it has `frame` metadata or
  `src === 'frame'`, matching the frame-first table routing rule. For those
  records, `eq.tier` remains canonical data but is not printed on a direct
  representation of the record. Suppress it from:
  - the record-page subtitle suffix;
  - full and compact record-card stat chips, including cards opened from
    Search, Tables, Lists, and modals;
  - list/table result stat lines and grid-tile tier labels;
  - the record card's tier ladder;
  - colour and black-and-white print-card tier banners;
  - generated `i/<id>.html` subtitles and preview/meta descriptions.
- This is a presentation rule, not a data migration. Do not delete or rewrite
  `eq.tier`; do not change tier-based ordering, the cross-source Equipment
  tables' tier sections/facets, price estimation, or existing equipment counts.
  Those are aggregate tools driven by canonical equipment metadata, not the
  provenance or direct presentation of one setting record.
- The full provenance string must replace the current leaf-only source label
  on every direct reference surface: record-card source badges, table/search/
  list rows and tiles, record-page subtitle, print-card bottom source line,
  fallback equivalents, and generated share-page subtitle/metadata. Setting
  section headings and the Equipment source-facet values remain leaf labels
  (`Пир зверей` / `Beast Feast`) because their parent context is already
  visible and they are selectors, not record provenance.
- Generated share stubs are Russian-only. Their visible subtitle begins with
  the exact Russian provenance above; their `description`, `og:description`,
  and `twitter:description` include the same provenance and omit the frame
  tier. Regenerate all affected starting/frame `i/*.html` files through
  `tools/build-share-pages.js`; never hand-edit them.

## Scope and non-goals

In scope:

- canonical `other_starting` and `other_frames` TableIds/routes/grouping in
  both Svelte and fallback apps;
- read compatibility for shipped `frames` URLs and stored home preference;
- 29-row plain starting subtable and 95-row four-section frame subtable;
- semantic backlinks and per-subtable filter ownership;
- preserved `f95` Russian/generated-data correction and 1091 counter fix;
- exact bilingual two-/three-level provenance on all record reference surfaces
  and suppression of direct frame-record tier presentation without changing
  canonical tier metadata or aggregate Equipment behavior;
- contracts/specs/fixtures/help/READMEs/`llms.txt`, focused tests, app state
  inventories, share-page generator/output, generator-produced snapshots,
  full gates, review, and commit.

Out of scope:

- canonical data collection/id/artwork/English-text changes beyond the already
  applied Russian correction;
- starting-item roll behavior or changes to global search/equipment indexes;
- visible third `frames` subtable, combined 124-row route, `#/tables/other`,
  `starting` section anchor, new source/starting facets, or new UI components;
- compatibility for never-shipped partial-plan URLs;
- unrelated Russian terminology cleanup or historical-counter rewrites;
- push unless separately authorized.

## Public contracts and generated artifacts

- `docs/specs/ROUTES.md` lists canonical table names `other_starting` and
  `other_frames`, removes canonical `frames`, assigns filter groups per table,
  documents the four `other_frames` section anchors, and documents `frames` as
  an accepted legacy alias with tail preservation.
- `docs/specs/CONTRACTS.md` records both new frozen ids plus the retained
  legacy alias. Contract fixtures/suites cover canonical routes and legacy
  base/filter/anchor behavior in the same commit.
- Route fixtures include at minimum:
  - canonical `other_starting` -> 29;
  - canonical `other_frames/f_frame-beast_feast` -> 36 of 95;
  - canonical `other_frames/motherboard` -> 95 with anchor behavior;
  - legacy `frames/f_frame-beast_feast` -> same 36-of-95 selection without
    changing the input hash.
- `FEATURES.md`, `COVERAGE.md`, both READMEs, `llms.txt`, and help describe the
  Other group and its two routes. Current examples emit canonical links;
  compatibility is documented only where route contracts belong.
- The `f95` edit has already regenerated `data.json`, `catalog.csv`, and its
  current `i/f95.html`, but the new provenance rule changes the share-page
  generator itself. Preserve the canonical data outputs, update
  `tools/build-share-pages.js`, and regenerate affected starting/frame
  `i/*.html` pages. `tests/derived.js` must compare every generated page byte
  for byte and pin the representative `ci61`, `f1`, and `f95` provenance/tier
  behavior.

## Batch B1 - Split Other into real subtables (DONE, `106e4dd` + `c92c8e8`)

### Objective

Adapt the interrupted single-table work into canonical Starting items and Frame
items subtables, retain old frame-link compatibility, and ship the translation,
counter, contracts, tests, and reviewed goldens as one commit.

### Expected files

Production and pure logic:

- `app/src/lib/types.ts`, `data.ts`, `tables.ts`, `filters.ts`, `facets.ts`,
  `hash.ts`, `label.ts`, `dict.ts`, `help.ts`, `search.ts`, and `i18n.ts`
- `app/src/components/TablesPage.svelte`
- `app/src/components/RecordPage.svelte`, `RecordCard.svelte`,
  `PrintCard.svelte`, `RowMain.svelte`, and `TableRows.svelte`
- `app/src/state/app.svelte.ts` if home normalization is not kept in a shared
  pure route-normalization helper
- `app.js`, `tools/build-share-pages.js`, and `tools/bundle-budget.mjs`
- already changed `data.js`, `data.json`, `catalog.csv`, and `i/f95.html`
- generated `i/*.html` files for affected starting/frame records, including
  `i/ci61.html`, `i/f1.html`, and `i/f95.html`

Contracts, docs, guards, tests, and inventories:

- `docs/specs/ROUTES.md`, `CONTRACTS.md`, `FEATURES.md`, `COVERAGE.md`,
  `I18N.md`, `META.md`, and `STATE.md` if the stored-home normalization is
  specified there
- `docs/fixtures/urls/routes.json`, `README.md`, `README.ru.md`, `llms.txt`
- `tests/derived.js`
- affected `app/src/lib/*.test.ts`, `app/src/components/record.test.ts`,
  `printPage.test.ts`, `tables.test.ts`, `searchPage.test.ts`, and
  `app/src/state/app.test.ts`
- `tests/contracts.js`, `eqtest.js`, `audit2.js`, `app/contracts.js`,
  `app/states.js`, `app/sweep.js`, `app/inventory.js`, and
  `tests/parity/specs.js`
- runner-generated `tests/app/snapshots/*.txt`, including canonical
  `_tables_other_starting*` and `_tables_other_frames*` states plus an explicit
  legacy `_tables_frames*` compatibility state
- `issues/56-followup/plan.md` and `handoff.md`

### Ordered implementation steps

1. Re-check HEAD/status. Preserve every coherent interrupted change and the
   unrelated untracked `.claude/settings.local.json` and
   `issues/tg-preview-refresh/`; do not reset/checkout the broad tree and do
   not run a second implementation session concurrently.
2. Define canonical TableIds `other_starting`, `other_frames`. Change the
   visible Other group to id `other`, top `other_starting`, ordered subs
   `[other_starting, other_frames]`; set subchips exactly to
   `Starting / Стартовые` and `Frames / Сеттинги`, while keeping the full page
   headings `Starting items / Стартовые предметы` and
   `Frame items / Предметы сеттингов`. Remove `frames` from canonical table
   definitions/navigation while retaining it in an explicit legacy-alias map,
   not in `TABLE_IDS`.
3. Replace current `otherRows(index)` with one pure selector owning the split:
   29 unframed starting rows for `other_starting`; 94 canonical frame rows plus
   framed starters for `other_frames`. Keep canonical `Index.rows` unchanged.
   Mirror the helper in fallback table-pool logic. Assert canonical 30/94,
   subtable 29/95, 124 unique across both, exact order, and unchanged global
   1091/710/381 totals.
4. Make `other_starting` use the plain body with no section wrapper. Make
   `other_frames` use four setting sections classified by `frame`. Remove the
   combined five-section/`starting` anchor code. Assert 36/21/36/2, one-time id
   coverage, `f95` only under Motherboard, and normal search/empty behavior in
   both renderers.
5. Assign no facet groups to `other_starting`; assign `['kind', 'frame']` to
   `other_frames`. Ensure facet option discovery uses its 95-row display pool.
   Test 92 equipment/2 consumables/1 item, `kind=item -> f95`, Beast Feast
   36 of 95, Motherboard 2 of 95, multi-frame OR, cross-group AND, and unknown
   group fail-open behavior.
6. Update `tableOf()`/fallback `tableIdOf()` to route frame metadata/source to
   `other_frames` before generic starting to `other_starting`. Test Core/H&F
   starters, `f95`, `f94`, ordinary frame equipment/consumable, and unaffected
   roll/equipment records. Verify canonical row backlinks and row-anchor flash.
7. Add one pure legacy normalization used by both route parsing and filter
   decoding: `frames -> other_frames`, tail unchanged. Mirror it in fallback
   route resolution. Keep the input hash on initial render; ensure subsequent
   generated filter/section/row links are canonical. Cover bare, row, setting,
   and filter legacy links; unknown table behavior must remain unchanged.
8. Normalize stored home `#/tables/frames` to canonical
   `#/tables/other_frames` on read in both apps, without a required storage
   write. Test startup navigation, active-home state, next save, canonical new
   pins, and rejection of unknown table pins.
9. Update touched Russian UI/help/docs from user-facing `Фрейм` to
   `Сеттинг`/`сеттинг` where it names the Daggerheart concept. Preserve code
   key `frame`, English labels, proper setting names, and the already-generated
   `f95` `Сетевой Узел` change. Verify `data.js` and derived outputs agree.
10. Add one shared Svelte provenance policy and mirror it in `app.js`. Use
    exact ` · ` breadcrumbs: `Прочее · Стартовые` / `Other · Starting` for
    generic starters, and `Прочее · Сеттинги · <setting>` /
    `Other · Frames · <setting>` for frame records. Apply it to `whereFrom`,
    source badges, row/tile references, and print source lines. Keep leaf-only
    labels in setting headings and facet controls. Cover `ci61`, `f1`, and
    `f95` explicitly in both languages.
11. Add one shared presentation predicate for setting records and use it to
    suppress `eq.tier` on direct record pages/cards, compact rows and tiles,
    Search results, tier ladders, and both print layouts; mirror it in
    `app.js`. Keep `eq.tier` and aggregate Equipment tier behavior intact.
    Ensure a query matching only the hidden `Tier 1`/`Ранг 1` text does not
    find a frame record through a stat line the UI no longer renders.
12. Update `tools/build-share-pages.js` to emit the same Russian provenance in
    visible subtitles and all three preview-description fields, without a
    frame tier. Regenerate affected starting/frame stubs via the generator and
    assert `ci61`, `f1`, and `f95` as representatives; do not hand-edit `i/`.
13. Preserve the 1091 Search/current-comment changes and expanded counter
    guard. Align specs, route fixtures, both contract implementations,
    inventories, and `(id, route)` parity guards on the two canonical routes
    plus explicit legacy compatibility.
14. Replace partial combined/other snapshot states through the generator only.
    Generate canonical Starting items, Frame items, frame-filter, setting
    anchor, generic-starting-record, direct-frame-record, frame Search result,
    frame print card in both layouts, and at least one legacy `frames` route
    state. Update `_i_f1.txt` only through the golden generator and inspect the
    exact RU/EN breadcrumb plus absence of the direct Tier/Ранг presentation.
    Keep broad table/search snapshots already valid for label/count changes;
    remove obsolete names only after replacements exist. Inspect the entire
    diff, then run all four comparison shards sequentially.
15. Run focused legacy/built-app suites, `npm run check`,
    `npm run check:built`, and `git diff --check`. Request the configured
    reviewer, apply at most one coherent remediation cycle, rerun affected
    focused checks plus both full gates, update handoff, and commit the complete
    batch with a Conventional Commit. Do not push without separate authority.

### Acceptance criteria

- The visible **Other / Прочее** top-level group has exactly two subchips and
  routes: **Starting / Стартовые** (`other_starting`) first and
  **Frames / Сеттинги** (`other_frames`) second. Their page headings remain
  **Starting items / Стартовые предметы** and
  **Frame items / Предметы сеттингов**. There is no canonical or visible
  `other`/`frames` table entry.
- `other_starting` is a plain 29-row table of unframed starting items, has no
  facet panel or redundant section anchor, and supports standard row anchors,
  search, view, selection, copy, and list behavior.
- `other_frames` reports 95 and renders four setting sections in order:
  Beast Feast 36, Colossus 21, Dark Heart 36, Motherboard 2.
- `f95` appears exactly once across the two subtables, under Motherboard beside
  `f94`; it is absent from Starting items. The two subtable pools contain 124
  unique ids together.
- Generic starting backlinks use `other_starting/<id>`; `f95` and all frame
  backlinks use `other_frames/<id>` and flash the correct row/section.
- All direct provenance uses ` · ` exactly. `ci61` reads
  `Прочее · Стартовые` / `Other · Starting`; `f1` reads
  `Прочее · Сеттинги · Пир зверей` /
  `Other · Frames · Beast Feast`; `f95` reads
  `Прочее · Сеттинги · Материнская Плата` /
  `Other · Frames · Motherboard`. Record pages, full/compact cards, table/
  Search/list references, modal cards, print source lines, fallback output,
  and generated share stubs do not fall back to leaf-only `Прочее`, a setting
  alone, or a source-book label for these records.
- A frame record displays no `Ранг N` / `Tier N` on its direct record-page
  provenance, full/compact card stat row, list/table/Search row, grid tile,
  tier ladder, print-card banner (colour or black-and-white), or generated
  share subtitle/preview description. `f1` is the pinned representative.
  Canonical `eq.tier`, aggregate Equipment tier sections/facets/order, pricing,
  and counts remain unchanged.
- Setting headings and source-facet chips continue to use leaf labels such as
  `Пир зверей` / `Beast Feast`; they do not repeat the full breadcrumb.
- `other_starting` has no filters. `other_frames` has only `kind` + `frame`;
  its observed counts and OR/AND/fail-open behavior match the settled design.
- Old `#/tables/frames` base, row, setting-anchor, and filter links still render
  the corresponding `other_frames` state with their input hash initially
  intact. All newly generated links use `other_frames`.
- A stored `#/tables/frames` home opens and compares as
  `other_frames`; new/next-saved home values use the canonical route.
- Current public contracts list `other_starting` and `other_frames`, explicitly
  retain `frames` only as a legacy alias, and do not promise experimental
  `other` or `frames/starting` paths.
- Russian UI on the affected surface uses **Стартовые предметы**,
  **Предметы сеттингов**, and filter label **Сеттинг**; its navigation uses
  the concise **Стартовые** and **Сеттинги** subchips. English navigation uses
  **Starting** and **Frames**. `f95` remains `Сетевой Узел` / `сетевой узел`;
  generated data/static output matches source.
- At 360 px, `audit2` measures the Other subchip row at or below its 260 px
  ceiling without CSS/layout/font-size changes, wrapping, truncation, or scroll.
- Starting records remain non-rollable. Catalogue/search/index totals remain
  1091 overall, 710 source-table records, 381 standalone equipment, and 876
  images; canonical rows remain 30 starting and 94 frames.
- Search subtitles say 1091 in both languages; the expanded guard catches
  current-source drift without rewriting historical measurements.
- Specs, fixtures, docs, both apps, tests, inventories, and generated
  structural snapshots agree. All changed snapshots are generator-produced,
  reviewed, and pass four comparison shards.
- Focused tests, source/generated-data checks, `npm run check`,
  `npm run check:built`, `git diff --check`, and reviewer pass are green with
  no unrelated changes included.

### Verification commands

Run sequentially unless the runner owns concurrency:

```text
rtk npx vitest run --coverage=false app/src/lib/data.test.ts app/src/lib/tables.test.ts app/src/lib/filters.test.ts app/src/lib/facets.test.ts app/src/lib/hash.test.ts app/src/lib/label.test.ts app/src/lib/i18n.test.ts app/src/components/record.test.ts app/src/components/printPage.test.ts app/src/components/tables.test.ts app/src/components/searchPage.test.ts app/src/state/app.test.ts
rtk node tools/build-share-pages.js
rtk node tests/derived.js
rtk node tests/run-all.js dataint,derived,contracts,i18n,eqtest,audit2,states
rtk npm run build
rtk node tests/app/golden.js --update --only=tables
rtk node tests/app/golden.js --update --only=search
rtk node tests/app/golden.js --update --only=i/f1
rtk node tests/app/golden.js --update --only=print
rtk node tests/app/golden.js --shard=1/4
rtk node tests/app/golden.js --shard=2/4
rtk node tests/app/golden.js --shard=3/4
rtk node tests/app/golden.js --shard=4/4
rtk node tests/run-all.js app/contracts,app/states,app/sweep
rtk npm run check
rtk npm run check:built
rtk git diff --check
```

`tools/build-share-pages.js` must run because its provenance/tier formatting
changes even if `data.js` does not. Run `rtk node tools/build.js` instead when
implementation changes `data.js` beyond the already-generated `f95`
correction; it also invokes the share-page generator. Snapshot update mode is
generation, not verification; never hand-edit snapshots or `i/*.html`, and
never run update shards concurrently.

### Risks and do-nots

- Do not reset the interrupted tree or overwrite unrelated untracked paths.
- Do not keep `frames` in canonical `TABLE_IDS`; doing so creates a third
  navigation table and weakens the two-subtable contract. Compatibility belongs
  in an explicit alias map before canonical validation.
- Do not redirect/rewrite a legacy hash during initial parsing. Normalize the
  internal table and generated links; normalize stored home on read.
- Do not concatenate all 30 starters into `other_frames`; only framed starters
  belong there. Do not route `starting` before `frame`.
- Do not add a `starting` facet/anchor to replace the real subtable boundary.
- Do not duplicate derived pools in `Index.rows`, `all`, search, equipment, or
  roll pools; keep the split in one pure selector per renderer.
- Do not globally rename schema/filter identifier `frame`, source collection
  `frames`, artwork, or historical prose while correcting user-facing Russian.
- Preserve generated `f95` work; do not broaden its translation without new
  daggerheart.su evidence.
- Do not use `-`, `—`, `->`, `/`, or `>` as a provenance separator; use
  ` · ` in both languages and generated Russian stubs.
- Do not remove `eq.tier` from data or disturb the aggregate Equipment tables,
  their tier facets/sections, price logic, or counts. Suppress tier only on the
  direct presentation surfaces enumerated above.
- Do not reuse the long page headings inside provenance and do not expand
  setting headings/facet chips into redundant full breadcrumbs.
- Do not solve the measured chip overflow with styling. The exact short labels
  are the complete design correction; page headings retain the descriptive copy.

No fallback is needed. The alias-plus-two-canonical-TableIds model directly
matches the human's clarified information architecture and existing router.

## B2 direction: a tag and a table path are two different things

The human tested the published site after B1/B1r and split one idea into two.
`context.md`, "New human direction, 2026-09-16", holds their words. This
section is the design that follows from them, and it is the authority for B2
wherever it contradicts the B1 subsection above.

### The rule

- A **table path** answers *where does this record live in the navigation*. It
  is the group, its sub-table where the group has one, and the record's own
  section inside that table where the table is sectioned by something the
  record carries. It is drawn where the reader has no surrounding context: the
  line under a record-page heading, the print card's source line, and a share
  stub's subtitle. It must be **complete** there.
- A **tag** answers *what is this record from*. It is one leaf: a book, a
  community, or a campaign setting. It is drawn on the `.badge src` chip, which
  always sits inside a listing or a card that already supplies the context. It
  **never** carries a path.
- In code these are exactly the two functions that already exist:
  `whereFrom()` is the path, `srcLabel()` is the tag. `106e4dd`'s whole tag
  regression was pointing five `.badge src` sites at `whereFrom`. B2 points
  them back at `srcLabel` and repairs the path function.

### What the badge shows (the human left this open; decided here)

Reverting the five badge sites to `srcLabel` answers every open case at once,
with no special-casing, and it is the vocabulary the equipment source facet
already uses (`EQ_SRC`/`srcName`: the five books plus the four settings).

| record | badge before B2 | badge after B2 |
|---|---|---|
| `ci1` Core loot | `Core · Предметы` | `Core` |
| `ci61` generic starter (`src: core`) | `Прочее · Стартовые` | `Core` |
| an `hnf` starter (8 of the 29) | `Прочее · Стартовые` | `Hope & Fear` |
| `f1` frame equipment | `Прочее · Сеттинги · Пир зверей` | `Пир зверей` |
| `f95` Network Tether | `Прочее · Сеттинги · Материнская Плата` | `Материнская Плата` |
| `cm1` community | `Великородное` | `Великородное` (unchanged) |
| a Wondrous record | `Wondrous Loot` | `Wondrous` |
| a Dread record | `Dread GM Toolbox` | `Dread` |
| a VoA record | `Vault of Ages` | `Vault of Ages` (unchanged) |
| equipment in `eq_weapon` | `Снаряжение · Оружие` | its book or setting |

- **A frame record's tag is its setting**, which is what `srcLabel` gave before
  `106e4dd`. A setting is not a section of a book; beside a Core row it is the
  thing that tells them apart, exactly as a community is.
- **A generic starter's tag is its source book.** Verified in `data.json`: the
  29 unframed starters are 21 `src: 'core'` and 8 `src: 'hnf'`, so the book is
  real information and `Прочее` would be none. "Starting" is a property of the
  table it is browsable in, not of where the record came from - it belongs in
  the path, and it stays there.

### What `whereFrom` becomes

Two changes, and only two:

1. **Delete the community early return.** `if (it.src === 'community') return
   srcLabel(it, lang)` in `label.ts` is the whole reason `#/i/cm1` prints a
   leaf where every other record prints a path. Deleting it makes `tableOf`
   return `community`, whose `GROUPS` entry is already
   `{ ru: 'Сообщества', en: 'Communities', subs: ['community'] }` with no
   `SUBS` row - so the base is `Сообщества` / `Communities`, and the leaf
   below appends the community. **`tableOf` needs no change at all**; the
   table id, the group and the grouping already exist.
2. **Generalise the third segment.** Today it is `isFrameRecord(it) ?
   ' · ' + srcLabel(...)`. Make the condition `it.frame || it.community`:
   append the record's own section leaf when the table is sectioned by a value
   the record carries. That is true of exactly two tables - `other_frames` is
   sectioned by `frame`, `community` by `community` (`sections.ts`,
   `communityGroup`) - and of no others. **Do not generalise further**: Vault
   of Ages is sectioned too, but by the book's own tiers, not by a property of
   the record, and its path stays `Vault of Ages`.

Everything else in `whereFrom` stands unchanged, including the
`if (!table) return srcLabel(it, lang)` fallback that `label.test.ts:176`
pins. The net effect is that **`whereFrom`'s output changes for the 90
community records and for nobody else.**

### `printSrc` and the share stubs (the human left these open; decided here)

- **The print card is a path, and it does not change.** A card leaves the
  table and goes to the table alone, which is the argument already recorded in
  `label.ts`'s own comment and in the B1 subsection above; that argument
  survives the split intact, because a print card has no surrounding listing to
  supply context. Its current outputs are already correct under the new rule,
  so B2 changes no rendered print text. What B2 *does* do is collapse the
  duplication the two-abstraction rule exposes: `printSrc`'s hand-built
  `` `${t.srcComm} · ${srcLabel(it, lang)}` `` is now character-for-character
  what `whereFrom` returns for a community record, so `printSrc` becomes
  `isFrameRecord(it) || it.src === 'community' ? whereFrom(...) : srcLabel(...)`
  - byte-identical output for every record in the catalogue, one rule instead
  of two. Mirror the same collapse in `app.js`.
- **The generated share stubs are not touched.** `tools/build-share-pages.js`
  is not a general path renderer: `provenance()` returns a breadcrumb for frame
  and starting records and `''` for everything else, and `subtitle()` then
  falls through to the historical `Предмет · Core · №12` form. Read under the
  new rule that file is already right on both counts - the breadcrumb sits in
  the headline position, which is a path, and the middle field of the fallback
  form is a source leaf, which is a tag. So `i/*.html` does not move, and with
  it `data.js`, `data.json`, `catalog.csv`, `docs/fixtures/`,
  `tests/contracts.js`, `docs/specs/CONTRACTS.md` and `llms.txt` do not move
  either. **This is a decision, not an omission**: if a future human wants the
  unfurl to carry a full path for every record, that is its own batch with its
  own 1091-stub regeneration and its own contract commit.

### Which B1 acceptance lines are void, and which stand

Void:

- "The full provenance string must replace the current leaf-only source label
  on every direct reference surface" - **void for the five `.badge src` sites**
  (`RecordCard.svelte`, `RowMain.svelte`, and `cardHTML`/`rowHTML`/
  `listRowHTML` in `app.js`). Those are tags. The same bullet's record-page,
  print-card and share-stub clauses stand.
- The B1 acceptance line beginning "All direct provenance uses ` · ` exactly"
  is void **only** in its enumeration of card, row, tile, Search and modal
  references. Its `ci61` / `f1` / `f95` strings remain correct for the record
  page, the print card and the share stub, which is where B2 leaves them.
- Anything in B1 that reads "do not fall back to leaf-only" **about a badge**.
  A badge falling back to the leaf is now the requirement.

Stand, unchanged:

- The separator: one ` · ` (U+00B7 with a space either side), everywhere a path
  is drawn, in both languages and in the Russian stubs.
- The path vocabulary: the concise navigation words (`Стартовые`, `Сеттинги`,
  `Starting`, `Frames`), never the descriptive page names.
- "Setting section headings and the Equipment source-facet values remain leaf
  labels ... because their parent context is already visible and they are
  selectors, not record provenance." This is the same principle the human has
  now extended to badges; it is the reason B2 is a small change and not a
  redesign.
- **The frame-tier suppression policy is untouched.** Verified rather than
  assumed: it is driven entirely by `isFrameRecord()` in `eqParts`/`eqLine`,
  `tileTier`, the tier ladder, `PrintCard` and the stub generator, none of
  which reads `whereFrom` or `srcLabel`. Its pinned fixture
  (`docs/fixtures/statlines/equipment.json`, `f7`) is a stat line, not a
  badge. B2 must not touch it, and must not let a golden diff on a tier line
  pass as expected fallout.
- The whole of the route, filter, section, alias, home-normalisation, counter
  and `f95` translation design. B2 reopens none of it.

### Two divergences this design also closes

Both were found in source while planning B2, both sit in the exact functions
B2 rewrites, and both are one line. `CLAUDE.md`: in a touched path, fix cheap,
local, safe bugs.

1. **The badge diverges between the two renderers today.** `app.js`'s
   `whereFrom` returns `srcLabel(it)` for every record that is neither a frame
   nor a starter, so the fallback badge on a Core item reads `Core` while the
   shipped Svelte badge reads `Core · Предметы`. That is a rendered-text
   difference across most of the catalogue, and it went unnoticed because
   `8dae1b9` had already dropped `parity` from `deploy.needs`. Pointing both
   renderers' badges at `srcLabel` closes it exactly.
2. **The record-page path drops the artifact segment in the rewrite.**
   `app.js:3237` appends `' · ' + voaTierOne(it.tier)` for `tier === 'A'` or
   `'C'`; `RecordPage.svelte`'s `where` does not. Eleven VoA records are
   affected (`voa2_a1`..., all with a roll number), so the live app prints
   `Vault of Ages · Артефакт · номер 1` and the rewrite prints
   `Vault of Ages · номер 1`. No golden or parity state opens such a record,
   which is why nothing caught it. It is the human's own complaint in another
   costume - the path at the top of a record page is incomplete - so it is
   fixed here, with its own acceptance line and its own state.

## Batch B2 - Separate the tag from the table path (next, implement-ready)

### Objective

Make `.badge src` a leaf tag again in both renderers, complete the table path
on a record page for the two record types where it is short (community, VoA
artifact/cursed), and leave every other provenance surface byte-identical.

### In scope / out of scope

In scope: `label.ts`'s `whereFrom` and `printSrc`; the five `.badge src`
sites; `RecordPage.svelte`'s subtitle; the same five-plus-two places in
`app.js`; the unit and component tests that pin these strings; two new golden
states; `FEATURES.md` and `COVERAGE.md`; regenerated goldens.

Out of scope, and each is a decision recorded above, not an oversight:
`tools/build-share-pages.js` and every `i/*.html`; `data.js` and its generated
outputs; `CONTRACTS.md`, `docs/fixtures/`, `tests/contracts.js`, `llms.txt`;
`ROUTES.md`, `STATE.md`, `I18N.md`; routes, filters, sections, aliases, home
normalisation, counters, the `f95` translation; the frame-tier suppression
policy; `dict.ts` (no key is added or removed, so `tests/i18n.js` parity is
unaffected); `PrintCard.svelte` and `TableRows.svelte` (tiles carry no source
badge - verified).

### Expected files

Production:

- `app/src/lib/label.ts` - `whereFrom` (community branch, leaf condition),
  `printSrc` (collapse), and the module header comment, which still describes
  the pre-B1 arrangement and must now state the tag/path split.
- `app/src/components/RecordCard.svelte:136`,
  `app/src/components/RowMain.svelte:98` - `whereFrom` -> `srcLabel`.
- `app/src/components/RecordPage.svelte` - the artifact/cursed segment.
- `app.js` - `whereFrom` (rewrite to the path form), `printSrc` (collapse),
  the three badge sites at `2029`, `2821`, `3093` (`whereFrom` -> `srcLabel`),
  and `renderItemPage` at `3226-3231` (drop the inline path, call `whereFrom`).

Tests, docs, goldens:

- `app/src/lib/label.test.ts`, `app/src/components/tables.test.ts`,
  `app/src/components/record.test.ts`, `app/src/components/searchPage.test.ts`
- `tests/app/inventory.js` and `tests/parity/specs.js` (two new states)
- `docs/specs/FEATURES.md`, `docs/specs/COVERAGE.md`
- `tests/app/snapshots/*.txt` (generator output only)
- `issues/56-followup/plan.md`, `handoff.md`

### Ordered implementation steps

1. Re-read HEAD and `git status`. The concurrent session owns `.claude/`,
   `CLAUDE.md`, `issues/config-audit/`, `issues/47/` and may have touched
   `tests/parity/specs.js` for issue 47's R0b. Re-read `specs.js` and
   `tests/app/inventory.js` before editing them rather than trusting the line
   numbers in this plan. Preserve every unrelated path.
2. `app/src/lib/label.ts`: delete the `if (it.src === 'community') return
   srcLabel(it, lang)` first line of `whereFrom`. Change its last line from
   `isFrameRecord(it) ? ...` to appending `srcLabel(it, lang)` when
   `it.frame || it.community` is set. Keep `if (!table) return srcLabel(...)`.
   Comment the *why* in one or two lines: the leaf is the record's own section
   in a table that is sectioned by a value the record carries, which is
   `other_frames` and `community` and nothing else.
3. `label.ts`: collapse `printSrc` to
   `isFrameRecord(it) || it.src === 'community' ? whereFrom(it, lang) :
   srcLabel(it, lang)` and drop the now-unused `const t = dict(lang)` (the
   `dict` import stays - `srcName` uses it). Keep the existing comment's
   argument; it is still the reason the card names the book.
4. `label.ts`: rewrite the module header comment. It currently explains
   `srcLabel` and a community record as if that were the only rule. It must now
   say plainly that `srcLabel` is the tag a badge carries and `whereFrom` is
   the path a record page carries, and why a badge must not carry a path.
5. Point `RecordCard.svelte:136` and `RowMain.svelte:98` at
   `srcLabel(it, lang)`. Fix the imports: `whereFrom` is no longer used in
   either file, `srcLabel` is; `isFrameRecord` stays in both (stat lines,
   tier ladder).
6. `RecordPage.svelte`: in `where`, after the `whereFrom` bit and before the
   roll/tier bit, push `t.voaArtifact1` when `it.tier === 'A'` and
   `t.voaCursed1` when `it.tier === 'C'`, matching `app.js:3237`'s
   `voaTierOne`. Do not restructure the rest of the `$derived.by`.
7. `app.js`: rewrite `whereFrom(it)` to the same path form the Svelte one now
   has - `tableIdOf` -> `groupOf` -> `SUB_LABEL`, then append `srcLabel(it)`
   when `it.frame || it.community`. It keeps reading `S.lang` as it does now.
   Then collapse `printSrc` the same way as step 3, and point `2029`, `2821`
   and `3093` at `srcLabel(it)`.
8. `app.js` `renderItemPage`: replace the inline
   `isFrameRecord(it) || it.starting ? whereFrom(it) : ...` ternary with
   `whereFrom(it)`. `tid` stays (`tableHref(tid, it.id)` needs it); the now
   unused `grp` and `sub` locals go. The surrounding comment about the
   subtitle reading as a navigation path is still correct - keep it, and let it
   now describe the whole function rather than a special case.
9. Update the pinned strings:
   - `label.test.ts:171-173` - `whereFrom` on a community record becomes
     `Сообщества · Великородное` / `Communities · Highborne`.
   - `tables.test.ts:965` - the frame row's badge becomes `Пир зверей`.
     The comments at `tables.test.ts:888` and `:926` say the row badge carries
     the same name as its section heading; after B2 both are true again, so
     leave them, but re-read them for accuracy.
   - `printSrc`'s existing assertions (`label.test.ts:77-83`) must pass
     **unchanged** - that is the proof the collapse is output-identical.
10. Add coverage, not only edits. At minimum: `whereFrom` and `srcLabel`
    asserted side by side for one record of each shape (core loot, generic
    starter, `hnf` starter, `f1`, `f95`, `cm1`, VoA artifact) in both
    languages, so the two abstractions are pinned apart rather than one being
    derived from the other; a component assertion that a Search result row and
    a list row draw the leaf tag; and a `record.test.ts` case for `#/i/cm1`
    and for a VoA artifact page's subtitle. End component tests with
    `expectNoA11yViolations` per `COVERAGE.md`.
11. Add two golden states, in **both** `tests/app/inventory.js` and
    `tests/parity/specs.js` `STATES` (the guard at the foot of `inventory.js`
    compares the two by id and route, so one without the other fails):
    `{ id: '#/i/cm1', route: '#/i/cm1', why: 'a community record - the one
    table path whose leaf is the record\'s own community' }` and
    `{ id: '#/i/voa2_a1', route: '#/i/voa2_a1', why: 'an artifact - the tier
    word belongs in the path line, and no state opened one' }`. Mirror the
    shape of the existing `#/i/f1` entry. They need no `recordActions.only`
    membership.
12. `docs/specs/FEATURES.md`, "Records": add the rule in two bullets - the
    line under the heading is the record's table path and is complete there,
    including the community and the artifact/cursed word; the source badge is
    one leaf naming the book, community or setting, because every place it is
    drawn already shows the context around it.
13. `docs/specs/COVERAGE.md`: `app/golden` says "108 states"; two new states
    make it **110**. Check for any other count of the same set in that file
    before committing.
14. Regenerate the goldens with the generator only, one shard at a time, never
    concurrently: `node tests/app/golden.js --update --shard=N/4` for N in
    1..4. Then inspect the whole diff before running the comparison shards.
    See "Expected golden fallout" below for what a surprise looks like.
15. Run the gates in "Verification commands". Then update `handoff.md` with
    exact commands and results, and commit the batch as one Conventional
    Commit authored `artex-x <artex-x@users.noreply.github.com>` with no AI
    attribution trailer. Push once the gates are green.

### Expected golden fallout

Say this out loud in the commit body too, so a reviewer can tell an expected
diff from a surprise.

- **Expect roughly 95 of the 108 existing snapshots to move, plus 2 new
  files, for 110 in total.** The reason is mechanical: a listing row is a
  `button` whose accessible name is the whole row text, badge included, and a
  golden records that name as `namelen=` / `namehash=`. So *every* state that
  draws a record row or a record card moves, in both languages, even though
  only a few characters changed. The route families are tables 38, lists 20,
  roll 18, `#/i/` 11, search 7, `#/l/` 5.
- **Expect the 9 `#/print/` snapshots not to move at all.** `printSrc` is
  output-identical by construction. A print snapshot that moves means the
  `printSrc` collapse was not output-identical - stop and diff it.
- **Expect no `Ранг N` / `Tier N` to appear or disappear anywhere.** A golden
  diff that touches a tier line means the frame-tier policy was disturbed;
  that is a defect, not fallout.
- Path lines (`page-sub`) move on the 90 community records and the 11 VoA
  artifact/cursed records only. In the existing snapshot set that is visible
  in the two new files; `_i_ci1*`, `_i_f1` and `_i_q1*` move on their **card
  badge**, not on their subtitle. `_i_f1.txt`'s `StaticText "Прочее · Сеттинги
  · Пир зверей "` line is the subtitle and must stay exactly as it is.
- `#/i/nope` (the not-found page) draws no record, so it should not move.

### Acceptance criteria

- `#/i/cm1` reads `Сообщества · Великородное` in Russian and
  `Communities · Highborne` in English, in **both** renderers, and the same
  holds for all 90 community records.
- The `.badge src` chip carries exactly one leaf everywhere it is drawn - a
  record card (full and compact), a table row, a Search result row, a list
  row, a modal card - in both renderers: `Core`, `Hope & Fear`, `Wondrous`,
  `Dread`, `Vault of Ages`, a community name, or a setting name. It contains
  no ` · ` for any record in the catalogue.
- `ci61` badges `Core`; an `hnf` starter badges `Hope & Fear`; `f1` badges
  `Пир зверей` / `Beast Feast`; `f95` badges `Материнская Плата` /
  `Motherboard`.
- The record-page subtitle still reads `Прочее · Стартовые` / `Other ·
  Starting` for `ci61`, `Прочее · Сеттинги · Пир зверей` / `Other · Frames ·
  Beast Feast` for `f1`, and `Прочее · Сеттинги · Материнская Плата` /
  `Other · Frames · Motherboard` for `f95`. B2 changes none of these.
- `#/i/voa2_a1` reads `Vault of Ages · Артефакт · номер 1` /
  `Vault of Ages · Artifact · roll 1` in both renderers; a `tier: 'C'` record
  reads `Проклятый предмет` / `Cursed object` in the same position.
- Every `printSrc` output is byte-identical to `c92c8e8`'s for every record;
  no `#/print/` golden moves.
- No `i/*.html` file, no generated data file, and no public contract file
  changes. `git status` after `node tools/build.js` shows no `i/` diff.
- Frame records still show no `Ранг` / `Tier` on any direct surface, and
  aggregate Equipment tier sections, facets, ordering, pricing and counts are
  unchanged.
- The two renderers agree: `app.js` and the built app draw the same badge text
  and the same record-page path for every record shape listed above. (This is
  a defect B2 closes, so it is acceptance, not a background assumption.)
- `tests/app/inventory.js` and `tests/parity/specs.js` both carry `#/i/cm1`
  and `#/i/voa2_a1`; the inventory guard passes; `COVERAGE.md` says 110.
- `FEATURES.md` states the tag/path rule.
- All four golden comparison shards pass after regeneration, every changed
  snapshot is generator-produced, and the diff matches "Expected golden
  fallout" with no tier-line movement and no print movement.
- `npm run check`, `npm run check:built` and `git diff --check` are green, or
  the exact reason a gate could not run is recorded in the handoff before the
  commit (see the blocker note below).

### Verification commands

Focused, fast, first:

```text
rtk npx vitest run --coverage=false app/src/lib/label.test.ts app/src/components/record.test.ts app/src/components/tables.test.ts app/src/components/searchPage.test.ts app/src/components/printPage.test.ts app/src/components/listPage.test.ts
rtk node tests/run-all.js i18n,derived,dataint,eqtest,qa
```

Then the generator and the goldens, sequentially, never two at once:

```text
rtk npm run build
rtk node tests/app/golden.js --update --shard=1/4
rtk node tests/app/golden.js --update --shard=2/4
rtk node tests/app/golden.js --update --shard=3/4
rtk node tests/app/golden.js --update --shard=4/4
rtk node tests/app/golden.js --shard=1/4
rtk node tests/app/golden.js --shard=2/4
rtk node tests/app/golden.js --shard=3/4
rtk node tests/app/golden.js --shard=4/4
rtk node tests/run-all.js app/sweep,app/typo,app/hues,app/contracts,app/states
```

Then the two repository gates. `npm run check` is the one that must fit a
single foreground call - `.claude/README.md`, "Run a long check":

```text
set -o pipefail; npm run check 2>&1 | tail -n 120      # Bash timeout 600000
rtk npm run check:built
rtk git diff --check
```

Advisory, because CI is the parity baseline and this host is not
(`docs/parity.md`, "Machine variance"). Run it because B2 is the batch that
closes a renderer divergence, and a nonzero cell here is information:

```text
MSYS_NO_PATHCONV=1 node tests/parity.js "#/i/"
```

If a new `#/i/cm1` or `#/i/voa2_a1` cell measures nonzero, do **not** invent a
`VISUAL_DEBT` number from a local reading. Record the figure in the handoff and
say CI must confirm it.

This is one batch, not three. It shares one component set (`label.ts` and its
five call sites), one seed, one golden regeneration and one parity filter; the
fixed cost of `check` + `check:built` + four shards is paid once whether it
carries two files or twelve (`docs/parity.md`, "Batch size and the fixed cost
of a run"). It crosses no public-contract boundary, which is the cut that would
have forced it into its own commit.

### Risks and do-nots

- **Do not touch `tools/build-share-pages.js` or any `i/*.html`.** That is the
  decision in "B2 direction", and it is what keeps this batch off the
  contract path. A stub diff means something upstream changed that should not
  have.
- Do not change `tableOf`/`tableIdOf`. The community table id, group and
  section grouping already exist; the bug was the early return above them.
- Do not extend the third path segment beyond `it.frame || it.community`. VoA
  sections are the book's tiers, not a property of the record.
- Do not reintroduce a path into a badge "for consistency" on any one surface.
  A tag is a tag on all five.
- Do not touch the frame-tier suppression rule, `eqParts`/`eqLine`'s `noTier`
  option, or `docs/fixtures/statlines/equipment.json`.
- Do not hand-edit a snapshot or an `i/` page; `.claude/hooks/edit-guard.mjs`
  refuses it, and it would hide the very drift the goldens exist to show.
- Do not add or remove a `dict.ts` key. `srcFrame` is already unused and stays
  that way; `tests/i18n.js` already reports it among seven pre-existing unused
  names, and widening that list is a separate decision.
- The concurrent session may be editing `tests/parity/specs.js` for issue 47's
  R0b at the same time. Re-read it before editing, keep the edit to the two
  `STATES` entries, and if it conflicts, add the entries and say so in the
  handoff rather than reverting anything of theirs.
- `npm run check` was red at B1r's close for a cause outside this task: the
  other session's untracked `.agents/` and `.claude/skills/impeccable/` fail
  `format:check` and `lint`. Check whether that is still true **before**
  starting, and if it is, follow B1r's precedent exactly - run every stage of
  the gate with the foreign paths excluded, record each stage's result in the
  handoff, and name the exclusion in the commit rather than silently bypassing
  the gate.

No fallback is needed. The design is a revert of one half of `106e4dd` plus a
two-line repair of `whereFrom`; there is no second approach worth carrying.

## Deferred

- The three unused `dict.ts` source strings the audit keeps reporting
  (`srcFrame` and friends) - pre-existing, not this task's to decide.
- `app.js`'s `tableIdOf` still tests `it.frame`, then `it.starting`, then
  `it.src === 'frame'`; `label.ts`'s `tableOf` merged the two frame tests in
  B1r finding 12. No record in the catalogue reaches the difference. Fold them
  the next time either file is open for another reason.
- Whether a share stub's subtitle should carry a full table path for every
  record rather than only for Other. Decided *not* to do in B2 (reasons in "B2
  direction"); it would cost a 1091-stub regeneration and a contract commit.

## Implementation checkpoint

- Preserve: 1091 copy/guard work, pure-index invariant, `f95` semantic
  Motherboard classification, canonical/generated `Сетевой Узел` files, broad
  docs/tests, and generator-produced snapshots where still valid.
- Replace: the one-table `frames`/combined design with canonical
  `other_starting` and `other_frames`; current mixed `other` fixtures/states;
  combined starting section; obsolete snapshot names.
- Add: explicit legacy `frames` parser/home compatibility, per-subtable
  filters/backlinks/counts, canonical states/contracts.
- Then finish: focused tests, snapshot review/four shards, app sweep, both
  repository gates, reviewer, handoff, and commit.
