# Plan - TASK 56-followup

## Status

- Task status: in_progress; B1 has a large interrupted, uncommitted
  implementation that must be adapted to the latest two-subtable direction.
- Starting commit: `8dae1b9f7111034f4ee9a9d3841679acc8010cba` on `main`.
- NEEDS_HUMAN_CONFIRMATION: no. The human chose a real two-subtable Other
  group and delegated exact ids, compatibility, contents, anchors, backlinks,
  and filters to planning; those decisions are settled below.
- Preserve the current working tree. It already contains useful counter,
  combined-pool, translation, documentation, test, generated-data, and
  snapshot work. Make targeted edits; do not reset or reconstruct the batch.

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

## Batch B1 - Split Other into real subtables (next, implement-ready)

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

## Deferred

- None.

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
