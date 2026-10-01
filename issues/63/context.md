# Shared task context - TASK 63

Orchestrator maintains this file so later steps do not re-fetch the same sources.

## Goal
- Plan only. Owner, 2026-10-01: "plan only, I don't want to intervene with
  persistance work, but if it's easy enough we can try to fit between it's
  releases. "intelligent" there is pretty vague, so I am open to
  opportunities and posibilities what would work best for users".
- No implement batch is dispatched in this session.

## GitHub issue (if any)
- URL: https://github.com/artex-x/daggerheart-loot/issues/63 (no comments, no labels, open)
- Captured or last verified: 2026-10-01
- Title: Intelligent search
- Summary (facts only):
  - Search today is an exact (folded) substring match. The owner wants a
    query such as "ring" to also find items that do not contain the word
    but match by synonym or context, "e.g. how vector indexes work".
  - The issue asks to consider a separate setting "basic search |
    intelligent search" against one search with an exact-match escape such
    as Google's quoted phrase `"..."`.
- Decisions already settled: none. The owner leaves the meaning of
  "intelligent" open and asks for what works best for users.
- Open questions: what "intelligent" means here (synonyms, stemming,
  typo tolerance, cross-language EN/RU matching, semantic embeddings,
  ranking); one mode or two; where the matching runs.

## Screenshot / attachment findings
- None attached.

## Key paths
- Specs: `docs/specs/FEATURES.md` "Tables and search" (lines ~73-99: 1272
  records, both languages at once, `#/search` cap 300, fold rules, "still a
  substring match, not fuzzy"); `docs/specs/STATE.md` (search text is
  memory only, never persisted); `docs/specs/ROUTES.md` (`#/search`);
  `docs/specs/META.md` (HTTP-only static build, Supabase the only server);
  `docs/specs/I18N.md`.
- Code hot paths: `app/src/lib/search.ts` (182 lines: `foldQuery`,
  `hayFor` per-field folded cache, `matches`, `search`; header comment
  records the earlier "no fuzzy" stance and "лук" must not offer "клык");
  `app/src/lib/search.test.ts`; `app/src/components/SearchPage.svelte`,
  `SearchBox.svelte`, `TablesPage.svelte` (per-table boxes, uncapped);
  homebrew items merge into search after catalog matches
  (`FEATURES.md` "Tables and search", `lib/homebrew.ts`).
  Other folded-search callers: list-name filter on the lists index and the
  add-to-list menu (`FEATURES.md` ~190-211) fold "as search folds".
- Decisions possibly touched: `docs/decisions/2026-09-19-text-normalisation-for-an-ingest-and-its-guard.md`,
  `docs/decisions/2026-09-30-homebrew-is-first-class-in-the-catalog-pages.md`.
- Mocks: none yet.

## Command costs
From `.claude/README.md` and `issues/persistent-storage/plan.md` section 12
(idle host, one green pass).

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | ~165 s | yes |
| `npm run check:built` | ~180-240 s | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | ~260-290 s | yes |
| `node tests/app/sweep.js <width>` | ~320-590 s | barely, one width |
| `node tests/app/golden.js --shard=n/4` | ~100-290 s | yes, one shard |

## Which machine is authoritative
- This Windows host for timings.

## Measured facts (planner, 2026-10-01, `data.json` at `de4a1f1d`)
- 1272 records; every record has `ru` and `en`; 112 have no `rud`/`ende`.
  Folded text: 423,709 characters, 10,008 distinct words (5,905 RU,
  4,103 EN); a record's text is 283 characters at the median, 1,679 at most.
- RU/EN cross-matching already works for names: both names are on every
  record, so "ring" reaches «Кольцо ...» through `en`.
- Substring noise: "ring" 173 hits, 30 at a word start, 26 with the word in a
  name (during, bring, string...). "bow" 40 vs 10; "sword" 43 vs 12; "меч"
  121 vs 41. A word-start-only rule would lose compounds (Longbow,
  Crossbow, Hellfire, Veilcloak) - rank, do not filter.
- Word forms today: "potions" 1 hit (36 with the stem), "daggers" 0 (21),
  "rings" 13 (35), "мечи" 0 (41), "луки" 0 (24), "стрела" 1 (14),
  "доспехами" 0 (54), "кольцо" 23 (27), "броня" 6 (80, «брони» in
  descriptions).
- Multi-word today is one contiguous substring: "healing potion" 0,
  "меч огонь" 0, "ранг 2 щит" 0.
- Concept gaps the data cannot answer by words: "jewel" 1 hit against 26
  rings, 13 amulets, 2 earrings, 1 necklace.
- Prototype of the v1 rule (scratch, not in the repository): across 21
  probe queries it lost 0 of today's hits; warm query time 0.9-2.0 ms in
  Node with a hand-written ending list, 4-5 ms with the Snowball two-sided
  check (today 0.33 ms; a phone is 4-6x).
- Owner, 2026-10-01: "I am also open to reuse some library if needed".
- Libraries measured 2026-10-01 (alone, minified with the project's
  `rolldown`, gzip 9): `@orama/stemmers` 3.1.18 Russian + English 2.6 KB;
  `snowball-stemmers` 0.6.0 38.7 KB (all languages in one module);
  `stemmer` 2.0.1 0.8 KB (English only); MiniSearch 7.2.0 5.7 KB; Orama
  3.1.18 21.2 KB; FlexSearch 0.8.212 16.8 KB; Fuse.js 7.5.0 9.3 KB;
  `natural` 8.1.1 is 13.8 MB unpacked (Node toolkit).
- Snowball Russian (`@orama/stemmers`): кольцо/кольца -> кольц, зелье/
  зелья -> зел, зеленый -> зелен, огненный/огненная -> огнен, броня ->
  брон, бронза -> бронз, камень -> камен, камня -> камн. English: healing
  -> heal, health -> health, knives -> knive.
- Fuse.js at its default threshold returns 700-1200 of 1272 records for
  one word, 200-1200 ms per query in Node, and offers «Драконий Клык» for
  "лук". MiniSearch (whole words, Snowball terms, prefix on) loses 143 of
  today's "ring" hits, 80 of "меч", 30 of "bow" (Longbow, Crossbow); with
  `fuzzy: 0.2` it offers «Лупа», «Лунный Шарф» for "лук"; its index build
  takes about 1 s in Node.
- `bundle-budget.mjs` (2026-10-01): unconfigured 165.9 of 171 kB,
  configured 224.8 of 230 kB; raising a limit is allowed in the same
  commit as the reason. `package.json` has no `dependencies` block; the
  bundled `supabase-js` and `age-encryption` are pinned exactly in
  `devDependencies`. `edit-guard.mjs` blocks hand edits of
  `package-lock.json`.

## Path overlap with the persistence releases (2026-10-01)
- R7c `B7c.3` adds `ItemPicker.svelte`, a combobox over `searchable` (at
  most eight rows) - a likely third caller of `search.ts`.
- R7c `B7c.4` changes rows on `#/search` and `#/tables/*`, `lib/help.ts`,
  and re-seeds search goldens.
- R7e: `ListPage`, `QuickItem`, `Toast`, `dict.ts`. R7f: `dict.ts`,
  `TablesPage` (its homebrew load line becomes `LoadState`). R7d, R8, R9,
  `debt-cleanup`, `persist-review`, R10: no search path named.
- Golden states that type a query: `#/search ~ searched`, `~ kind off`,
  `~ stat line`, `~ capped`, `~ nothing found`, `~ a row ticked`,
  `~ own items as gm1`, `~ own items hidden as gm1`, `#/tables ~ searched`
  («кольцо»), `#/tables/eq_secondary ~ searched` («вторичное»). The golden
  `--only` filter is a substring of the state id.
- The search box placeholder is the label every golden and test types
  into; changing it breaks about twenty drivers.

## Reasons already disproved
-

## Constraints
- Product laws (`CLAUDE.md`): the Supabase backend is the only server; no
  other backend. Static HTTP-only build; data comes from the classic-script
  `data.js`, no runtime `fetch()` for local data.
- Bilingual: records carry `ru`, `en`, `rud`, `ende`; search matches both
  languages at once.
- Persistence programme is in flight on `main` (uncommitted R7c work in the
  tree; R7c, R7d, R8, R9, R10 queued; R10 gated on 2026-10-01). Task 63 must
  not collide with it: plan a schedule slot between releases, touching
  paths R7c-R10 do not, or state the overlap.
- Homebrew items (signed-in, from Supabase) also flow through search; any
  index built at build time does not cover them.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
