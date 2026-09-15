# Handoff - TASK 56-followup

## Status
- Task status: in_progress (B1 interrupted; provenance/tier contract now fully specified)
- Last agent: planner
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `main`
- Base / starting commit: `8dae1b9f7111034f4ee9a9d3841679acc8010cba`

### Provenance implementation follow-up (2026-09-15)
- Added a shared Svelte frame-record predicate and full Other breadcrumbs on
  record cards, rows, record pages, print cards, tiles, and generated Russian
  share pages. Frame equipment tiers remain in data/aggregate equipment logic
  but no longer render on those direct surfaces.
- Regenerated share stubs with `node tools/build-share-pages.js` (and again via
  the production build). Representative label coverage now pins concise
  Russian/English Other provenance in `label.test.ts`.
- Verification observed green: focused six-file Vitest (219 tests),
  `node tests/derived.js`, focused label Vitest (24 tests), and the completed
  build/smoke portion of `npm run check:built`. `npm run check` reached lint
  after format/type setup without a captured final tail; rerun its complete
  command plus the required browser/golden shards before treating the batch as
  fully verified.

## Completed
- Batch name/id: Replan B1 - Split Other into real subtables.
- What shipped: No production change in this planner pass. The next batch now
  defines canonical `other_starting` and `other_frames` routes under the
  Other/Прочее group, with `frames` retained only as a deep-link/home
  compatibility alias to `other_frames`. This follow-up also settles the
  navigation-only labels as **Starting / Стартовые** and
  **Frames / Сеттинги**, while preserving descriptive page headings.
- Files changed: `issues/56-followup/plan.md` and
  `issues/56-followup/handoff.md` only in this planner pass.
- Commit(s): none; the broad implementation remains uncommitted on `8dae1b9`.
- Deviations and rationale: The latest human clarification supersedes both
  prior single-table plans. A visual Starting section inside one `frames` table
  is not sufficient; Starting items and Frame items must be real subtable
  paths analogous to Core's pair.

## Verification
- Commands run (exact): re-read `context.md`, current `plan.md`, current
  `handoff.md`, and the Daggerheart RU terminology skill; `rtk git status
  --short`; `rtk git diff --stat`; targeted `rtk git diff`/`rtk rg`; read-only
  data.json audits of starting/frame kinds and setting counts.
- Results: HEAD remains `8dae1b9`. The interrupted tree spans 73 tracked files
  plus task/unrelated untracked paths. Production currently uses a combined
  `frames` display pool and classifies `f95` under Motherboard, while route
  fixtures and snapshot artifacts still include prior `other` paths. Counts
  verified from current generated data: starting 30 with one framed starter;
  canonical frames 94; proposed Starting items 29; proposed Frame items 95,
  comprising 92 equipment, 2 consumables, 1 item and setting counts
  36/21/36/2. `f95` source/generated Russian text is already corrected to
  `Сетевой Узел` / `сетевой узел`.
- Gates: no production gates run in this planner-only pass. Earlier focused/
  contract/build evidence predates the new two-subtable contract and must not
  be treated as final; rerun the plan's full verification after implementation.
- Latest measured evidence: focused Vitest is green (8 files / 273 tests).
  `audit2` at 360 px measured the descriptive Russian subchips at 293 px versus
  a 260 px ceiling. The plan now resolves this with shorter copy only; rerun
  `audit2` after implementation.

### Implementer follow-up (2026-09-15)
- Completed in this bounded pass: canonical Svelte/fallback subtable routing,
  `frames` read alias, 29/95 display-pool split, frame-first backlinks,
  stored-home normalization, and initial route/doc terminology alignment.
- Commands run: `rtk npx vitest run --coverage=false ... app/src/state/app.test.ts`
  and `rtk node tests/run-all.js dataint,derived,contracts,i18n,eqtest,audit2,states`.
  The RTK wrapper returned no result text for either foreground run, so their
  success is not yet recorded as evidence; rerun after the remaining fixture/
  inventory alignment.
- Remaining next action: align every route fixture/browser inventory/contract
  assertion, generate canonical and legacy structural snapshots, inspect them,
  then run all four comparison shards and full repository gates.

### Focused follow-up (2026-09-15)
- Fixed the last reported focused Vitest assertion in
  `app/src/components/tables.test.ts`: Frame items has only setting sections;
  generic Starting items is its own subtable.
- Re-ran the exact focused Vitest and legacy `run-all.js` commands with
  `rtk proxy`; this worker received only the Vitest banner/no final output and
  no legacy output, so a succeeding exit status still needs host-side capture.

### Fixture follow-up (2026-09-15)
- Host-captured focused Vitest: 8 files, 273 tests green.
- Corrected canonical route fixture totals: `other_starting` is 29;
  `other_frames` and its Beast Feast facet use a 95-row total.
- Re-ran `rtk proxy node tests/run-all.js dataint,derived,contracts,i18n`;
  this worker received no output after dispatch, so its final exit/result needs
  host capture before the remaining audit/states action.

### Fresh provenance planning follow-up (2026-09-15)
- Read the current uncommitted diff and traced provenance through Svelte,
  fallback, print, Search/Tables/List rows, grid tiles, and generated share
  pages. Current `_i_f1.txt` proves the defect: the heading line is only
  `Прочее · Ранг 1` / `Other · Tier 1`, and the card source badge names only
  the setting.
- Settled separator and strings: use ` · ` everywhere. `ci61` is
  `Прочее · Стартовые` / `Other · Starting`; `f1` is
  `Прочее · Сеттинги · Пир зверей` /
  `Other · Frames · Beast Feast`; `f95` is
  `Прочее · Сеттинги · Материнская Плата` /
  `Other · Frames · Motherboard`.
- Settled tier boundary: frame records keep canonical `eq.tier` for aggregate
  Equipment grouping/filtering/order and price logic, but direct record
  presentations suppress Tier/Ранг in record-page provenance, full/compact
  cards, rows/Search/grid, tier ladders, both print layouts, and generated
  share subtitles/meta descriptions.
- Settled reference boundary: record provenance is always the full breadcrumb;
  section headings and source-facet controls remain leaf setting labels because
  their parent context is already visible.
- No production code was edited in this planner pass. Only `plan.md` and this
  handoff were revised.

## Next batch (implement-ready)
- Name: B1 - Split Other into real subtables.
- Objective: Convert the interrupted combined table into canonical
  `other_starting` and `other_frames`, retain `frames` compatibility, preserve
  the f95/counter work, make provenance consistent, remove direct frame-tier
  presentation, and finish contracts/tests/goldens/gates/commit.
- In scope: Two canonical routes and group/subchips; 29-row plain Starting
  items; 95-row, four-section Frame items; per-subtable filters/backlinks;
  legacy base/deep/filter/home compatibility; affected Russian terminology;
  preserved f95/generated data and 1091 corrections; exact RU/EN provenance;
  frame-tier presentation policy; share-page generator/output; both
  renderers/docs/tests.
- Out of scope: visible/canonical `frames` third table, combined 124-row route,
  `#/tables/other`, starting section anchor/facet, roll/global-index changes,
  deletion/reinterpretation of canonical `eq.tier`, aggregate Equipment tier
  grouping/filtering/pricing changes, unrelated translation cleanup,
  historical counts, push.
- Files expected: Exact source/state/data/docs/test/snapshot list under B1 in
  `issues/56-followup/plan.md`.
- Steps: Preserve the tree; add the two canonical TableIds/group labels; split
  the display pool in one pure selector; make Starting plain/no facets and
  Frames sectioned with kind+frame; route backlinks semantically; normalize old
  `frames` route tails and stored home; use exact subchips
  **Starting / Стартовые** and **Frames / Сеттинги** while keeping full page
  headings; align terminology/contracts/docs/states; regenerate/review
  canonical and legacy snapshots; add the exact ` · ` provenance policy and
  suppress direct frame-tier labels across page/card/row/grid/print/share
  output while retaining aggregate Equipment behavior; regenerate affected
  `i/*.html` through `tools/build-share-pages.js`; run gates/reviewer; commit.
- Acceptance criteria: Every B1 acceptance line in the plan, especially 29/95
  subtable totals, 36/21/36/2 setting sections, `f95` only in Motherboard,
  canonical new links, old `frames` base/deep/filter/home compatibility,
  per-table filters, exact concise subchips under the 260 px mobile ceiling,
  descriptive page headings, exact `ci61`/`f1`/`f95` bilingual breadcrumbs,
  no direct frame Tier/Ранг labels, unchanged aggregate Equipment tier
  behavior, `Сетевой Узел`, 1091/global totals, generated share pages, reviewed
  goldens/gates.
- Verification commands: Use the exact sequential focused/legacy/build/golden/
  app/full commands under B1 in the plan. The share-page generator now runs
  even without another `data.js` change; use the full data build if data changes.
- Risks / do-nots: No reset/global rename; legacy alias is not a canonical
  TableId; do not rewrite initial legacy URLs; do not put f95 in Starting;
  do not duplicate derived pools/global indexes; no hand-edited generated files
  or snapshots/share stubs; use only ` · ` for provenance; do not remove
  `eq.tier` or change aggregate Equipment behavior; preserve unrelated
  untracked paths.
- Fallback (optional): none; the two canonical ids plus explicit alias model is
  settled.

## Blockers
- None. NEEDS_HUMAN_CONFIRMATION remains no; exact ids, compatibility,
  contents, anchors, backlinks, filters, concise labels, provenance strings,
  separator, tier-suppression boundary, and affected surfaces are decided in
  the plan. No other design change is needed; retain the current subchip layout
  and descriptive page headings.

## Deferred
- None.

## Notes
- Mocks path: none; existing group/subchip and plain/sectioned table patterns
  fully specify the UI.
- Screenshot findings: Published Search showed stale 1061; current structural
  snapshots establish the reused navigation/table patterns.
- Cleanup performed / retained artifacts: No cleanup. Retain the whole partial
  B1 tree, `.claude/settings.local.json`, and `issues/tg-preview-refresh/`.
- Session end partial progress (if any): Planning documents revised only;
  production/data/snapshot changes, verification, review, commit, and push were
  not performed by this planner.
