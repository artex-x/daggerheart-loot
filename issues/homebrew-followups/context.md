# Shared task context - TASK homebrew-followups

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- Owner feedback on the released R7h (2026-10-08), five items in one task, implemented after
  task #71 (filters on the shared list page) ships:
  1. Sets and rule cards take official catalog items, not only own items.
  2. Filters are dynamic on every page: a row offers only values the page's records answer;
     a one-value row that cannot narrow is not drawn. Reuse #71's design.
  3. A change-notice panel with one notice draws one hide button, not «Скрыть» and «Скрыть
     изменения».
  4. Arazo's Artifacts: delete the «Заметка для Мастера: ...» / "GM Note: ..." paragraph of aa2,
     aa5, aa21, aa50 (`rud` and `ende`); a deliberate divergence from the book, recorded so no
     audit restores it.
  5. (added by the coordinator, same day) aa11 "The Looking Glass": the owner dislikes «Зерцало»;
     the planner picks the name (`ru` and every inflected use in `rud`).

## GitHub issue (if any)
- URL: none (owner feedback in chat, relayed by the coordinator).
- Captured or last verified: 2026-10-08.
- Title: Homebrew follow-ups after R7h.
- Summary (facts only): the five items above, verbatim intent from the dispatch.
- Decisions already settled:
  - Item 2 reuses #71's offer rules (owner). Tag: home `docs/specs/FEATURES.md`, "Tables and
    search" (the filter panel bullet) - batch B1.
  - Item 3: one notice, one hide button (owner). Tag: home `docs/specs/FEATURES.md`, "Account
    and browser lists", "The change log" - batch B1.
  - Item 4: the Arazo GM notes are removed on purpose (owner). Tag: home `docs/specs/I18N.md`,
    "Rules", plus a `tests/derived.js` guard - batch B1.
  - Item 5: aa11 reads «Волшебное Зеркало» (planner, owner delegated). Tag: same I18N bullet -
    batch B1.
  - Item 1, Q1 = A (owner, 2026-10-08): an own set or rule card stores the official ids
    (`content.items`); only the account that owns the card sees it on the official item; share
    links and other readers see the book's item; option B (the share projection) can follow
    later with no data change. Tag: home `docs/specs/FEATURES.md`, "Homebrew", "Cards", plus a
    decision file - batch B2.
  - Item 1 stays in this task, not split out (owner, 2026-10-08). Consequence:
    `agent-guard.mjs` denies B1's dispatch until the plan review of B2 approves.
- Open questions: none.

## Screenshot / attachment findings
- None supplied.

## Key paths
- Specs: `docs/specs/FEATURES.md` ("Tables and search", "Account and browser lists" - "The
  change log", "Homebrew" - "Cards"), `ROUTES.md` ("Filter grammar", "Homebrew"), `CONTRACTS.md`
  sections 1, 4, 5, `I18N.md` ("Rules"), `COVERAGE.md`.
- Code hot paths: `app/src/lib/facets.ts` (`facetRows`, `eqFacetRows`, `homebrewSectValues`),
  `app/src/components/TablesPage.svelte` (`facRows`, `facetState`, `facPassed`, `pickFacet`,
  `copyFilterLink`), `FilterBar.svelte`, `RequestsPanel.svelte` (the `.nfold` block),
  `HomebrewCards.svelte`, `lib/homebrew.ts` (`cardProblems`, `cardMembers`, `withRecords`),
  `lib/data.ts` (`relate`, `setOf`, `setBonusOf`), `RecordCard.svelte` (refs), `lib/share.ts`,
  `lib/homebrewForm.ts` (`cardContentOf`), `lib/homebrewFile.ts`, `schema/homebrew-v1.json`,
  `supabase/migrations/20261001130000_homebrew_relations.sql` (`homebrew_card_valid`,
  `homebrew_cards` table), `20261007130000_homebrew_links.sql` (`homebrew_cards_touch`,
  `homebrew_item_record`, `get_shared_list`), `data.js` (aa2, aa5, aa11, aa21, aa50).
- #71's plan (not on main yet): `git show b63af78a:issues/71/plan.md` (branch
  `claude/task-planners-mockups-079cc9`); decision
  `docs/decisions/2026-10-06-a-share-links-filter-lives-in-its-address-its-facets.md` there.
- Mocks: `issues/homebrew-followups/mocks/index.html` (B2: the Sets tab with an official
  member at 1180 px RU and 360 px EN, and `#/i/q1` with the own set). B1 needs none.

## Command costs

| Command | Wall clock | Fits one call? |
|---|---|---|
| `rtk npm run check:fast` | 215-310 s | yes |
| `rtk npm run check:1` / `check:2` | 252 s / 308-566 s | yes, each its own call |
| `npm run check:built` | 20-25 s | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | 260-450 s | usually; loaded host past 600 s |
| `node tests/app/sweep.js <width>` | 320-590 s | yes, one width per call |
| `node tests/app/golden.js --shard=n/4` | 100-290 s | yes, one shard per call |
| `npm run check:db` (PowerShell) | 400-550 s | close to the cap |

Source: `.claude/README.md`, "Batch size and the fixed cost of a run" (2026-10-07/08 rows).

## Which machine is authoritative
- For recorded numbers (visual debt, timings): this Windows host.
- What a difference on another machine means: load, not a regression; re-run on an idle host.

## Reasons already disproved

- "The homebrew item limit is 1000": it is 100 (`homebrew_items_per_owner`, 300 at 3x); 1000
  is one file's bound (`FILE_ITEMS_MAX`).
- "The catalog equipment tables would lose filter chips under the offer rule": disproved on
  `data.json` (2026-10-08): weapons answer every `cls`, `range`, `burden`, trait and tier 1-4 and
  A; secondary every `cls`, `range`, tier 1-4; armour tier 1-4. Only own-item rows change.

## Constraints
- Contracts / parity / i18n notes: B1 changes no public contract (the table address reads as
  today). B2 changes one: the homebrew file gains `homebrew-v2` (a card's official members), and
  the database gains a card key and a definer-function change. RU/EN parity for every string.
- `data.js` is canonical; `node tools/build.js` after the edit; never renumber an id.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
