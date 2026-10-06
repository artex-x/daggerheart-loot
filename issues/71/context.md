# Shared task context - TASK 71

## Goal
- Plan filters for the shared list view, with grounded mockups. No implementation in this pass.
- The owner approves mockups and design first; then the plan is committed and pushed.

## GitHub issue (if any)
- URL: https://github.com/artex-x/daggerheart-loot/issues/71
- Captured or last verified: 2026-10-06
- Title: Add filters to the shared list view
- Summary (facts only):
  - The shared list view gets filters.
  - The filters are dynamic, "maybe as everywhere" in the app.
  - They include type, trait and the other filters that the table view and search already have.
- Decisions already settled (owner, 2026-10-06): the filter goes into the `#/s/` address with the copy-link button, as on a table; the mocks and the threshold of 8 entries are approved; the owner's list page `#/lists/<id>` gets no filter.
- Open questions: for the planner - reuse of the existing filter components and grammar, whether filter state goes into the URL (`ROUTES.md`, `STATE.md`), what "dynamic" means (facets limited to values present in the list).

## Screenshot / attachment findings
- The issue has no screenshots and no comments.

## Key paths
- Specs: `docs/specs/ROUTES.md` (filter grammar), `STATE.md`, `FEATURES.md`, `CONTRACTS.md`, `I18N.md`
- Code hot paths: existing table and search filter components and `app/src/lib/` filter logic; the shared list view (planner locates them)
- Mocks: `issues/71/mocks/` (`mocks/index.html` is the entry the Browser pane opens)

## Code facts (planner, 2026-10-06)
- The shared view is `app/src/components/SharedListPage.svelte` for `#/s/<token>` and `#/l/<payload>`.
- The table filter is `FilterBar.svelte` + `lib/facets.ts` (`facetRows`) + `lib/filters.ts` (grammar, `passes`); record facets in `lib/data.ts` (`equipFacets`, `plainFacets`, `srcOf`, `kindOf`).
- `parseHash` reads `#/s/` as the leading `[A-Za-z0-9_-]` run and drops the rest; `#/l/` reads the payload as written.
- Seed share `#/s/player-token-1`: «Лавка кузнеца», 10 entries (3 items, 1 consumable, 5 weapons, 1 armour; Core, Hope & Fear, Wondrous, Dread, Vault of Ages, own source «Мастерская Ольхи»).
- `entries_per_list` default 100 (3x: 300); `BOOK_NAME_MAX` 80; `LIST_SEARCH_AT` 8.
- `.fpill` is `white-space: nowrap`: a long own-source pill overflows at 360 px today (fixed in B1).

## Command costs
See `CLAUDE.md` and `.claude/README.md`, "Batch size and the fixed cost of a run". Not measured for this task yet.

## Constraints
- Reuse the existing filter UI and logic; extract shared UI on its second real use.
- RU/EN parity for every new label.
- Related: TASK 70 (owner-controlled item visibility on lists) plans the same view in parallel. Keep the two designs compatible; neither plan may assume the other ships first.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
