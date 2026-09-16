# Shared task context - TASK 56-followup

## Goal
- Fix the stale published Search count and audit other missed current counters.
- Repurpose the stable `#/tables/frames` surface as bilingual "Other" / "Прочее" and include the 30 non-rollable starting-inventory records alongside the existing campaign-frame records.
- Resolve the combined table's subsection model, route/filter grammar, and the
  special placement of Network Tether before completing the in-progress batch.
- Audit the Network Tether Russian record text against daggerheart.su and use
  that site's established terminology consistently.

## User evidence
- The human tested the published site and reported that the Search counter was not updated and starting items appear in no table.
- Human explicitly prefers reusing `#/tables/frames` as "Other" instead of adding a new route.
- Rendered published `#/search` was inspected on 2026-09-15: English subtitle says `Search all 1061 entries at once` while the current catalog has 1091 records.
- Browser navigation to `#/tables/frames` was rejected by the host usage-limit review. Existing current golden snapshot shows the route labeled `Frames`, a total of 94 records, frame sections, and filters `kind` + `frame`.
- On 2026-09-15 the human clarified that Network Tether belongs in its
  setting-specific section, not the generic starting-items section, and asked
  whether Other should expose explicit subsections such as starting items and
  frame items. They also asked for routing/filter structure to be resolved and
  the Russian translation checked against daggerheart.su.
- The human then clarified the intended information architecture: Other should
  group two real subtable paths, analogous to Core's `core_item` and
  `core_consumable`, with candidate ids such as `other_starting` and
  `other_frames`. A single `frames` route containing only visual sections does
  not satisfy this intent. Exact stable ids, compatibility behavior, and which
  filters belong to each subtable remain planner decisions.
- The human further clarified record-card provenance on 2026-09-15. A generic
  starting record such as `ci61` should identify both levels (example:
  `Прочее - Стартовые`, not only `Прочее`). A setting record such as `f1`
  should identify the Other group, Frames subtable, and concrete setting
  (example hierarchy: `Other -> Frames -> Beast Feast`) and should not display
  a misleading `Ранг`/Tier merely because frame equipment carries equipment
  tier metadata. Audit every equivalent provenance/reference surface in both
  languages for the same hierarchy and vocabulary. The human explicitly asked
  for fresh agents rather than resuming the inactive earlier agents.

## Repository facts
- Manual parity-pipeline commit is `8dae1b9 test(issue-56): remove parity from deploy requirements`; tree is clean except unrelated untracked `.claude/settings.local.json` and `issues/tg-preview-refresh/`.
- Canonical data has a non-rollable `starting` collection with 30 records. The current `frames` table contains 94 records and is the stable route used by frame record links.
- Public route `#/tables/frames` is frozen by `docs/specs/ROUTES.md`; user requested retaining and repurposing that route.
- Svelte user-visible stale count lives in `app/src/lib/dict.ts`; matching component tests and generated structural snapshots still expect 1061. Root fallback `app.js`, READMEs, entry metadata, `llms.txt`, `robots.txt`, current specs, and data tests already use 1091/710/876 correctly.
- Additional stale 1061 occurrences outside historical task notes/snapshots are comments in `app/src/lib/search.ts`, `app/src/lib/i18n.ts`, `app/src/lib/dict.ts`, and `tools/bundle-budget.mjs`.
- The working tree currently contains the uncommitted B1 implementation from
  `issues/56-followup/plan.md`: canonical `frames` table routing has been
  replaced with `other`, a derived starting-plus-frame pool exists, and the
  current section code puts every `starting: true` record (including `f95`) in
  `starting` while excluding it from frame sections.
- Canonical record `f95` is `Network tether`, currently translated as
  `Сетевой трос`; it is both `starting: true` and `frame: motherboard`.
- Live daggerheart.su evidence checked 2026-09-15: English Motherboard calls
  the item `Network Tether`; Russian Motherboard uses the heading and inventory
  name `Сетевой Узел` / `сетевой узел`, and calls the general category
  `Сетевые узлы`. The current catalogue name therefore does not match the
  site's established record term. Sources:
  `https://en.daggerheart.su/frame/motherboard` and
  `https://ru.daggerheart.su/frame/motherboard`.
- Measured 2026-09-15 after the two-subtable partial implementation: the
  focused Svelte suite passes 8 files / 273 tests. The combined legacy runner
  still found stale `#/tables/other` fixtures, and `audit2` measured the RU
  Other subchip row at 293 px on a 360 px viewport against a 260 px ceiling.
  The exact short subchip wording therefore needs a planner choice; the page
  headings may remain descriptive. The parallel `states` crawl also hit a
  protocol timeout while the other browser suites were active, so it must be
  rerun sequentially after route alignment rather than treated as a product
  failure.

## Key paths
- Tables/routing: `app/src/lib/tables.ts`, `app/src/lib/label.ts`, `app/src/lib/filters.ts`, `app/src/lib/types.ts`, `app/src/components/TablesPage.svelte`
- UI copy: `app/src/lib/dict.ts`, fallback `app.js`
- Tests: `app/src/components/tables.test.ts`, `app/src/components/searchPage.test.ts`, `app/src/lib/tables.test.ts`, `app/src/lib/label.test.ts`, `tests/app/inventory.js`, `tests/app/snapshots/`
- Specs: `docs/specs/ROUTES.md`, `docs/specs/FEATURES.md`, `docs/specs/I18N.md`, `docs/specs/COVERAGE.md`

## Constraints
- Keep `#/tables/frames` working; do not add or rename the route id.
- Starting records stay non-rollable.
- Existing frame filtering and record links must keep working.
- Update both Svelte rewrite and committed fallback where the table grouping/label changes.
- Audit current shipped counters; do not rewrite historical measurements in completed task notes.
- Required gates: focused tests, `npm run check`, `npm run check:built`, and structural goldens for changed UI snapshots.
- Preserve unrelated untracked `.claude/settings.local.json` and `issues/tg-preview-refresh/`.
- Preserve the already-generated task changes and snapshots until the revised
  planner decides how the new subsection/placement requirement alters them.
- `f95` must appear exactly once in the combined table, under Motherboard, even
  though it is granted at character creation.

## New human direction, 2026-09-16: tags and table paths are two abstractions
The human tested the published site after B1/B1r and rejected part of the
settled provenance policy. This supersedes the "full breadcrumb everywhere"
decision recorded in `plan.md`'s Evidence and settled design.

- **A table path belongs at the top of a record page**, and must be complete
  there. `https://artex-x.github.io/daggerheart-loot/#/i/cm1` shows `Highborne`;
  the human wants `Communities · Highborne` / `Сообщества · Великородное`.
- **A tag must not carry the path.** The source badge now reads
  `Core · Items` where the human wants `Core`. Quoted: "I want at the top of
  the page for path in tables [to] be displayed BUT I don't want tags to be
  displayed this way ... we should distinct these two abstractions - tags and
  table paths".

Verified in source on 2026-09-16, not guessed:
- `app/src/lib/label.ts` `whereFrom` opens with
  `if (it.src === 'community') return srcLabel(it, lang)`, which is why the
  community record page prints a leaf where every other record prints a path.
  `app.js` `whereFrom` has no community branch at all and falls through to
  `srcLabel` for the same result.
- `106e4dd` switched the `.badge src` element from `srcLabel` to `whereFrom`
  in `app/src/components/RecordCard.svelte` and `RowMain.svelte`, and in
  `app.js` `cardHTML`, `rowHTML` and `listRowHTML`. That is the whole of the
  tag regression; `RecordPage.svelte`'s own `where` line was already
  `whereFrom` before that commit.
- `printSrc` in both renderers, and `provenance()`/`subtitle()` in
  `tools/build-share-pages.js`, also emit breadcrumbs and are open questions
  for the planner, not settled by the quotes above.

Unresolved for the planner, listed because they are not in what the human
said: what a badge shows for a frame record (setting leaf such as
`Пир зверей`, which is what `srcLabel` gave before `106e4dd`) and for a
starting record (`Core`); whether the print card and the generated share
stubs count as tags or as paths; and how far the golden and parity fallout
reaches.

## Do not re-fetch unless
- The human supplies new behavior or naming direction.
- A source fact is missing or conflicts with live behavior.
