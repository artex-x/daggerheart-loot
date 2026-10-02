# Plan - TASK 63 (intelligent search)

## Status

- Planning pass 1, 2026-10-01, planner. HEAD `de4a1f1d`; the working tree
  holds R7c's uncommitted `B7c.1` work, which this pass did not touch.
- Pass 1 revision, 2026-10-01, after the owner's "I am also open to reuse
  some library if needed": section 3.1 weighs the libraries; v1 now takes
  its word forms from the Snowball stemmers of `@orama/stemmers` (Russian
  and English, 2.6 KB gzip) instead of a hand-written ending list
  (sections 5, 6.2, 7). The hand-written list is the fallback.
- Owner's answers, 2026-10-01 (section 9): `Q1` A (one search, `"..."`
  for an exact phrase), `Q2` A (`@orama/stemmers` 3.1.18), `Q3` A (own
  items rank with the catalog, the catalog first on a tie), `Q4` B (right
  after R7c's closeout, before R7e; R7e waits). Recorded in
  `docs/decisions/2026-10-01-search-is-one-mode-words-in-any-order-snowball-forms.md`.
- Task status: planned, not started. One batch, `B63.1`, is
  implement-ready (section 7). It starts after R7c's closeout push, after a
  dispatch-time planner refresh (section 8).
- NEEDS_HUMAN_CONFIRMATION: no.
- Plan review: not required (no trigger fired)
- Batches:

| Batch | Goal | Gates (cost) | Status |
|---|---|---|---|
| `B63.1` | One search: words in any order, word forms (Snowball, `@orama/stemmers`), `"..."` for an exact phrase; `#/search` ranks the hits | `npm install` of one pinned package, `check` x2, `check:built` (it runs the bundle budget), goldens compare then re-seed for the search states, `sweep 360` (~36 min) | implement-ready; dispatched after R7c's closeout and the refresh of section 8 |

Total gate cost: about 36 minutes for `B63.1`, plus the closeout's full
golden compare (four shards, about 12 minutes): about 48 minutes on an idle
host. The dependency adds no gate: `check:built` already runs
`bundle-budget.mjs`, and CI's `npm ci` reads the new lockfile. Figures
from `.claude/README.md`, "Batch size and the fixed cost of a run"
(re-measured 2026-09-26/27). No split: the whole v1 is one route and
filter set (`#/search`, the table boxes), one module and no contract
change, so a split has no criterion.

## 1. Objective and current state

Issue 63 asks for an "intelligent" search: a query such as "ring" also
finds items that do not use the word, and either a "basic | intelligent"
setting or one search with an exact-match escape (`"..."`). The owner
leaves the meaning open and asks for what works best for users, without
interrupting the persistence releases (`context.md`, "Goal").

Today (`app/src/lib/search.ts`, `FEATURES.md` "Tables and search"):

- The query is folded (`foldQuery`: case, `ё`, apostrophes, Latin
  diacritics, U+2212) and matched as one substring of one field: `ru`,
  `en`, `rud`, `ende`, and the stat line for equipment.
- `#/search` keeps catalogue order and shows the first 300 hits; a
  signed-in author's own items follow the catalogue's hits.
- A table's own box filters the same way and keeps the table's sections
  and roll order.
- `lists.ts` folds a list name with `foldQuery` (the list-name filter).
- The module header rejects fuzzy matching: "лук" must not offer "клык".

What the catalogue shows (`context.md`, "Measured facts"):

1. Noise is the main defect, not missing hits. "ring" finds 173 records;
   26 have the word in a name, the rest hold "during", "bring",
   "string". The rings are there, but buried in catalogue order.
2. Word forms fail. "potions" finds 1 record (46 hold "potion"),
   "daggers" 0 (21), "мечи" 0 (41), "доспехами" 0 (54).
3. Several words fail unless they are adjacent: "healing potion" 0,
   "меч огонь" 0.
4. RU/EN cross-matching of names already works: every record has both
   names.
5. True concept gaps exist but are fewer: "jewel" finds 1 record against
   about 40 rings, amulets, earrings and necklaces.

## 2. Product laws and constraints that shape the options

- The Supabase backend is the only server (`CLAUDE.md`, `META.md` 3).
- The build is static and HTTP-only; `data.js` is a classic script; no
  runtime `fetch()` for local data (`META.md` 4, `CONTRACTS.md` 4).
- First load is about 243 KB gzip (`META.md` 4: `app.js` 92 KB, `data.js`
  149 KB); `bundle-budget.mjs` guards `app.js`.
- Homebrew items come from Supabase after sign-in and join `searchable`;
  a build-time index does not cover them.
- Search text is memory only (`STATE.md`); no address or storage change.
- Precision: "лук" must not offer "клык" (no near-miss matching).
- `-1` is a documented query (it finds "−1" penalties), so a leading `-`
  cannot become an exclusion operator.

## 3. Options survey

Costs are for this catalogue and this codebase. "Fits" names the law or
constraint each option meets or breaks.

| Option | What users gain | Cost | Bundle / load | Fits |
|---|---|---|---|---|
| A. Several words in any order (AND over tokens, each token in some field, any language) | "меч огонь", "ранг 2 щит", "лечения зелья" work; each word may come from the name, the description or the stat line | Small: a tokenizer and a loop in `search.ts` | none | All laws. Recall is a superset of today: a contiguous phrase contains each of its words |
| B. Exact phrase `"..."` | Today's behaviour on demand, for a GM who wants one wording | Tiny: the tokenizer keeps a quoted run as one token, with no word forms | none | All laws; the issue's own proposal |
| C. Word forms: the query word and the catalogue word reduce to the same Snowball stem (`@orama/stemmers`, section 3.1); the hand-written ending list is the fallback | Plurals and Russian cases: "potions", "daggers", "мечи", "кольцо" -> «Кольца», "доспехами" | Small: one pinned dependency, a stem cache, a two-sided check (section 6.2); no catalogue index | 2.6 KB gzip (the fallback ~1 KB) | All laws; homebrew covered (stems are computed on demand). A stem never reaches a word with another stem ("зелье" not «зелёный», "лук" not «клык») |
| D. Relevance ranking on `#/search` | The 26 rings first for "ring", names before descriptions; the 300 cap cuts noise, not hits | Small: a score per hit and a stable sort; table boxes keep their order | none | All laws. Moves the order of the search goldens |
| E. Curated concept table (`lib/concepts.ts`: groups such as jewellery = ring, amulet, earring, necklace, кольц, амулет, серьг, ожерель) | The issue's "finds what never uses the word": "jewelry", "healing" -> health potions and "clear HP", "light" -> torch, lantern | Medium: content work (60-100 groups, RU terms checked with `daggerheart-ru-terms`), a test that every term reaches a record, the owner's review of the list | ~3-6 KB | All laws; homebrew covered (expansion is query-side). Upkeep with every new source |
| F. Typo and keyboard-layout fallback ("Did you mean ...?" only when a query finds nothing; edit distance 1 for words of 5+ letters, 2 for 8+, against the 10,008 catalogue words; also the ЙЦУКЕН/QWERTY swap, "rjkmwj" -> "кольцо") | Recovers a mistyped query without changing any result list | Medium: a vocabulary build, one new UI line, two `dict.ts` keys, a golden | ~2 KB | All laws; never fuzzes a result list, so "лук"/"клык" holds |
| G. Highlight or snippet of the matched words in a row | Shows why a description-only hit is there | Medium: `RowMain`/`TableRows` markup and goldens of every searched state | small | All laws; collides with R7c `B7c.4` and R8 `B8.1`, which change rows |
| H. Fuzzy library (Fuse.js and similar) | Typo tolerance inside results | Small code, a dependency | 9.3 KB gzip (Fuse.js 7.5.0) | Breaks the precision rule: measured, "лук" offers «Драконий Клык» (section 3.1). Rejected |
| I. Build-time embeddings in a static asset, query embedded in the browser | Semantic matches ("something to see in the dark") | Large: 1272 x 384 int8 vectors about 490 KB, plus an in-browser model (a multilingual small model is about 100+ MB, an English-only one about 23 MB) and its runtime | 2x-3x today's first load, or a lazy load | Breaks "no runtime fetch for local data" or doubles `data.js`; unusable on a phone; misses homebrew unless the browser embeds them too. Rejected |
| J. Supabase pgvector with an Edge Function that embeds the query | The same semantic matches, server-side | Large: a migration, an Edge Function, embeddings for 1272 records and for every homebrew save (a new write path), free-plan invocations for every reader, 100-500 ms per query, no search offline. The built-in `gte-small` model is English-only, so Russian queries match poorly; a multilingual model needs a third-party API and a secret | none in the bundle; a network call per query | Lawful (Supabase), but it collides with the persistence work (migration, plan review, a new write path) and turns a local filter of a few milliseconds into a network round trip. Short keyword queries, the common case, rank worse than with A-D. Rejected for now |
| K. A "basic \| intelligent" setting | A way back to today's rule | A synced preference: the Display section of `#/account`, `STATE.md`, likely a profile column (a migration) | small | Collides with the persistence work; redundant when A-D lose no hit (section 4). Rejected |
| L. Field operators (`tier:2`, `dmg>d8`) | Precise stat queries | Medium grammar | small | The table facets already do this with links; a second grammar to learn. Not planned |
| M. Search text in the address (`#/search?q=`) | A shareable search | A route grammar change (`ROUTES.md`, `CONTRACTS.md`) | none | A public contract change and a `STATE.md` reversal. Not planned; a separate issue if wanted |

### 3.1 Libraries weighed (owner: "open to reuse some library if needed")

Measured 2026-10-01 in the session scratchpad (outside the repository):
each package bundled alone with the project's `rolldown`, minified, gzip
level 9; then run over the 1272 records of `data.json` on the probe
queries of `context.md`. "Lost" counts the records today's substring rule
finds and the candidate does not.

| Package (version) | Gzip | RU morphology | "лук" offers «клык»? | Ranking | Homebrew items | Fit with `search.ts` |
|---|---|---|---|---|---|---|
| `@orama/stemmers` 3.1.18 (Apache-2.0, `russian` + `english` entries, no dependencies) | 2.6 KB | Snowball Russian: cases, numbers, adjectives, verbs, participles. кольцо/кольца -> кольц, зелье/зелья -> зел but зелёный -> зелен, огненный/огненная -> огнен, броня -> брон but бронза -> бронз | no: 0 hits without «лук» | ours (section 6.5) | covered: a stem is computed when a word is first met | a function; keeps the per-field folding, the `WeakMap` cache and today's substring test. **Recommended** |
| `snowball-stemmers` 0.6.0 (ISC, 2022) | 38.7 KB | the same Snowball algorithms | no | - | covered | one module holds every language; 15x the size of the Orama entries for the same output. Rejected |
| `stemmer` 2.0.1 (MIT) | 0.8 KB | none: English Porter only | no | - | covered | needs a second package for Russian. Rejected |
| `natural` 8.1.1 (MIT) | 13.8 MB unpacked | Snowball and WordNet | - | - | - | a Node toolkit (file system, WordNet data); not for a browser bundle. Rejected |
| MiniSearch 7.2.0 (MIT) with the Orama stemmers | 5.7 KB + 2.6 KB | Snowball through `processTerm` | no with `fuzzy` off; yes with `fuzzy: 0.2` («Лупа», «Лунный Шарф») | BM25+ with a field boost: good ("ring" puts the rings first) | a second index; an edited own item needs `replace` or `discard`, wired into `AppState` beside the derived index | whole-word index: loses every hit inside a word. Lost 143 of "ring" (mostly noise), 80 of "меч", 30 of "bow" (Longbow, Crossbow, real losses); index build about 1 s in Node (4-6 s on a phone) at first use. Rejected for v1 |
| Orama 3.1.18 (Apache-2.0) | 21.2 KB | Snowball, one language per tokenizer (bilingual records need a custom one) | yes with typo tolerance on | BM25 | a second index, as MiniSearch | whole-word, as MiniSearch, at 4x its size. Rejected |
| FlexSearch 0.8.212 (Apache-2.0) | 16.8 KB | no Russian stemmer in its language packs | no with its default encoder | contextual score | a second index | the `full` tokenizer keeps in-word hits at a large memory cost; still needs our stemmer. Rejected |
| Fuse.js 7.5.0 (Apache-2.0) | 9.3 KB | none | **yes**: «Драконий Клык», «Жуки-Влюблённые» | Bitap score | rebuilt per change | default threshold returns 700-1200 of 1272 records for one word, 200-1200 ms per query in Node. Rejected |

Probe results, today's rule against v1 with the Snowball check (lost 0 on
every query): "ring" 173 / 173 (rings first), "rings" 13 / 35, "мечи" 0 /
41, "potions" 1 / 46, "зелья" 4 / 47, "daggers" 0 / 21, "bows" 1 / 10,
"луки" 0 / 23, "доспехами" 0 / 54, "лечения зелья" 0 / 5, "стрела" 1 / 7,
"маска" 5 / 6. Against the hand-written ending list it gains precision
("стрела" no longer reaches «стреляет», "маска" no longer reaches
«маскировка») and loses one prefix accident ("healing potion" 6 -> 1:
Snowball keeps "heal" and "health" apart; the concept table answers it).
Warm query time 4-5 ms in Node (the ending list: 1-2 ms; today: 0.33 ms).

A library does not make the deferred items cheap enough for v1:

- Concept table (E): no package holds Daggerheart concepts in Russian and
  English; WordNet (`natural`) is English-only and megabytes. The stemmer
  makes the table smaller (base forms only), but the curation and the
  owner's term review stay the cost.
- "Did you mean" (F): MiniSearch's fuzzy `autoSuggest` could find the
  candidates, but only over its own index (the 1 s build and the second
  index above). A hand-written edit distance over the 10,008-word
  vocabulary is about 40 lines; the cost of F is its UI line, two
  `dict.ts` keys and a golden, which no library removes.

## 4. The mode question (issue 63)

Recommendation: **one search with `"..."` as the exact-phrase escape; no
setting.** (`Q1`)

- Reason: v1 (A-D) finds every record today's rule finds (an acceptance
  test pins this), so a "basic" mode would only hide hits and add
  ranking-free order, which nobody asked for. Quotes give the exact rule
  back per query, with no state.
- A setting is a synced account preference: the Display section of
  `#/account`, `STATE.md`, and probably a profile column. That is a
  migration and a persistence surface, which the owner wants left alone.
- Trade-off accepted: a reader who never learns the quotes cannot ask for
  an exact phrase. The `#/search` hint names the quotes (section 7, step 6).

## 5. Recommended scope (v1) and what is deferred

**Recommended v1 (`Q2`): A + B + C + D, one batch `B63.1`.**

- Reason: the measured defects are noise, word forms and word order; A-D
  fix all three in one pure module, with no data change and no contract
  change, and they cover homebrew items for free.
- Word forms come from `@orama/stemmers` (Snowball Russian and English),
  pinned exactly, as `supabase-js` and `age-encryption` are. Reason: a
  standard, maintained algorithm is more precise than our ending list and
  covers forms the list does not, for 2.6 KB gzip and less of our own code
  to test. Trade-off accepted: one runtime dependency, about 2.6 KB against
  the bundle budget, and 4-5 ms per query in Node instead of 1-2 ms.
- Engines (MiniSearch, Orama, FlexSearch, Fuse.js) are not used: each
  either breaks "лук" (fuzzy) or matches whole words only, which loses
  today's in-word hits ("bow" -> Longbow), and each needs a second index to
  keep in step with edited own items (section 3.1).
- Trade-off accepted: the issue's own example of a concept match ("finds
  rings that never use the word") gets ranking, not a synonym table. In
  this catalogue every ring is named "Ring"/«Кольцо», so ranking puts them
  first; true concept gaps ("jewel", "healing" against "health") stay until
  the concept table.
- Deferred, in the order recommended:
  1. E, the concept table, as its own follow-up task after the owner uses
     v1 and lists the queries that still miss (one batch, about 25 minutes
     of gates plus the curation and the owner's term review).
  2. F, the "Did you mean" fallback with the keyboard-layout swap (one
     batch; can join E's task).
  3. G, the matched-word highlight, after R8 (rows settle there).
  4. A sentence about the search grammar in the tables help (`lib/help.ts`
     changes in R7c `B7c.4`; add it with E or F).
- Not planned: H, I, J, K, L, M (section 3 gives each reason). I and J
  stay on record so a later proposal starts from the costs above.

## 6. Design of v1

### 6.1 The query

`parseQuery(raw: string): readonly Term[]` folds the raw text with
`foldQuery`, then reads it left to right:

- `"..."` is one phrase term (the text between the quotes, trimmed). An
  unclosed quote runs to the end of the text, so the result does not
  flicker while the reader types the closing quote. An empty phrase is
  dropped.
- Every other run of non-space characters is a word term.
- No terms (blank text, `""`) means no query: `#/search` shows its hint
  and a table shows all its rows, as today.

```ts
interface Term {
  readonly text: string;           // folded
  readonly phrase: boolean;        // from "..."
  readonly start: RegExp;          // `text` at a word start
  readonly stem: string | null;    // Snowball stem when it differs from `text`
}
```

A word start is the start of a field or a position after a character
that is not a letter or a digit: `(?:^|[^\p{L}\p{N}])`, flag `u`. The
regexes are built once per query, not per record.

### 6.2 Word forms

The stemmers are `stemmer` from `@orama/stemmers/russian` and
`@orama/stemmers/english` (Snowball), reached through one internal
function `stemOf(word)` in `search.ts`:

- A word that is all Cyrillic letters goes to the Russian stemmer, a word
  that is all Latin letters to the English one; any other word (digits,
  `'`, `-`, mixed scripts) is its own stem.
- `stemOf` keeps a module-level `Map` from word to stem; the vocabulary is
  about 10,000 words plus the own items' words, so the map stays small.
  Words are folded first, so `ё` arrives as `е`.

A word term carries `stem = stemOf(text)` when that differs from `text`;
otherwise `null` (the substring test already covers it). A phrase term
never carries a stem.

A term hits a field by its stem when both hold:

1. the field contains the stem as a substring (a cheap filter), and
2. some word of the field starts with the stem and `stemOf(word)` equals
   the stem.

The second check is what keeps precision: «зелёный» starts with "зел" but
stems to "зелен", so "зелье" does not reach it; «бронза» stems to "бронз",
so "броня" does not reach it; «клык» never starts with "лук".

Examples the tests pin (Snowball output, measured): кольцо, кольца ->
кольц; зелье, зелья -> зел; зеленый -> зелен; мечи, меч -> меч; луки ->
лук; огненный, огненная -> огнен; доспехами -> доспех; броня -> брон;
бронза -> бронз; potions -> potion; daggers -> dagger; bows -> bow;
healing -> heal; health -> health; лук, клык -> unchanged.

Known limits, accepted: fleeting vowels (камень -> камен, камня -> камн),
irregular plurals (knives -> knive, knife -> knife), and words of one
meaning that Snowball keeps apart ("healing" and "health"). The concept
table (deferred) is the answer to the last.

Fallback, if the dependency is refused at review or by the owner: the
hand-written rule of the first pass of this plan, query side only,
matched at a word start - Russian endings `иями ями ами ого его ому ему
ыми ими ией ой ей ий ый ая яя ое ее ые ие ую юю ом ем ам ям ах ях ов ев ью
ье ья ия ию а я о е ы и у ю ь й`, English `ies es s ing ed` (`s` never off
`ss`), the longest ending that leaves 4 letters, else the longest that
leaves 3. It measured the same recall with less precision ("стрела"
reaches «стреляет», "маска" reaches «маскировка») at 1-2 ms per query.

### 6.3 Matching (`matches`, all callers)

A record matches when **every** term hits **one** of its fields. A term
hits a field when the field contains `text` (any position, as today), or
by its stem (section 6.2). A term never spans two fields; two
terms may hit two different fields and two languages.

Recall: every record today's rule matched still matches, because a
contiguous query contains each of its words, and the substring test is
kept. The acceptance test in step 3 pins this on a probe list.

### 6.4 The haystack

`hayFor(statLine)` keeps its per-record `WeakMap` cache, but returns two
groups instead of one array, so a score can tell a name from a
description:

```ts
interface HayParts {
  readonly names: readonly string[]; // folded ru, en
  readonly texts: readonly string[]; // folded rud, ende, and the stat line for equipment
}
```

The words of a field (`[\p{L}\p{N}]+` runs, flag `u`) are split only when
the stem filter of section 6.2 passes, and are then kept in the record's
cache entry; a query without a stem costs what today's does.

`matches` without a `hay` folds the same groups on the spot through one
shared function (`partsOf`), so the two paths cannot disagree.

### 6.5 Ranking (`#/search` only)

`rankHits(records, terms, statLine, hay): Record_[]` returns the matching
records, sorted by score, highest first, with a stable sort, so equal
scores keep the order they were given (catalogue order, then own items).

- Per term, the best hit over the record's fields: a name at a word start
  (exact text or stem) 8, a name inside a word 4, a description or stat
  line at a word start 2, inside a word 1.
- The record's score is the sum over its terms.
- Table boxes do not rank: a table keeps its sections and roll order
  (`search.test.ts`, "the order it returns"). `search()` keeps input
  order too.
- Own items rank with the catalogue's hits (`Q3`, recommended); on an
  equal score the catalogue's record comes first because `searchable`
  holds the catalogue first.

Measured on the prototype: "ring" puts «Кольцо Тишины» and the other
rings first; "меч" puts the «Меч ...» names first; "зелье лечения" puts
the four healing potions first. Warm query time 4-5 ms in Node over 1272
records with the Snowball check (today 0.33 ms; a phone is 4-6x).

### 6.6 Callers

| Caller | Change |
|---|---|
| `SearchPage.svelte` | `parseQuery(q)` replaces `foldQuery(q.trim())`; `matched` is `rankHits(...)` over the kind-filtered `searchable`; the hint shows while there are no terms |
| `TablesPage.svelte` (`filtered`, `altSections`) | `parseQuery(q)` and `matches(it, terms, statLine, hay)`; no ranking |
| `lib/lists.ts` | none: a list name keeps the plain folded substring filter |
| R7c `ItemPicker.svelte`, if it exists at dispatch | its eight rows use `rankHits` over the same terms (an acceptance line in `B63.1`) |

### 6.7 Contracts and specs

- No public contract changes: no route, id, link, generated file or asset
  path. No `localStorage` key. No migration.
- `FEATURES.md` "Tables and search": the fold bullet ends differently
  (step 9 gives the text); the merge sentence about own items changes
  with `Q3`.
- `I18N.md`, `STATE.md`, `ROUTES.md`, `META.md`, `CONTRACTS.md`: no change.
- One new package: `@orama/stemmers`, pinned to `3.1.18` in
  `devDependencies` (the repository has no `dependencies` block; the
  bundled `supabase-js` and `age-encryption` are pinned there the same
  way). `package-lock.json` changes through `npm install` only (the edit
  guard blocks hand edits).
- Bundle budget: `bundle-budget.mjs` allowed 171 kB unconfigured against
  165.9 kB measured on 2026-10-01; R7c-R7f may use that headroom. If the
  2.6 KB fails the budget, the batch raises the unconfigured and
  configured limits by the measured excess plus about 1 kB, in the same
  commit, with the reason in the comment (the file's own rule: "Raising it
  is allowed, deliberately, in the same commit as the reason").
- A decision file records the settled answers to `Q1`-`Q3`, the chosen
  stemmer, and the rejected options H-K and the engines of section 3.1
  (step 10).

## 7. Batch `B63.1` - implement-ready

Open design question: none. The owner answered `Q1`-`Q3` as recommended;
the dispatch-time refresh of section 8 updates steps 7, 9, 11 and 12 to
what R7c shipped.

**Objective.** One search across `#/search` and every table box: words in
any order, Russian and English word forms, `"..."` for an exact phrase;
`#/search` ranks its hits. No hit that today's search finds is lost.

**In scope.** `app/src/lib/search.ts` and its test; the
`@orama/stemmers` package; `SearchPage.svelte`, `TablesPage.svelte`, and
`ItemPicker.svelte` if R7c shipped it; the `#/search` hint in `dict.ts`;
`FEATURES.md`; the search and table golden states; one new inventory
state; one decision file; the bundle budget only if it fails.

**Out of scope.** The concept table, the "Did you mean" fallback, the
keyboard-layout swap, match highlighting, the tables help text, the
list-name filter (`lists.ts`), the placeholder text `searchPh`, any
address or storage change.

**Files expected.**

- `package.json`, `package-lock.json` (through `npm install`)
- `app/src/lib/search.ts`, `app/src/lib/search.test.ts`
- `tools/bundle-budget.mjs`, only if the budget fails
- `app/src/components/SearchPage.svelte`, `searchPage.test.ts`
- `app/src/components/TablesPage.svelte`; `tables.test.ts` only if a
  case breaks
- `app/src/components/homebrewCatalog.test.ts` ("search with own items")
- `app/src/components/ItemPicker.svelte` and its test, only if present
- `app/src/lib/dict.ts` (`startTyping`, RU and EN)
- `tests/app/inventory.js`; `tests/app/snapshots/` (re-seeded)
- `docs/specs/FEATURES.md`
- `docs/decisions/2026-10-01-search-is-one-mode-words-in-any-order-snowball-forms.md`
  (written by the planner; `B63.1` edits it only if the fallback is taken)
  and the index `docs/DECISIONS.md` (`node tools/decisions.js`)

**Steps.**

0. Read `git log --oneline -5` and confirm the base is the closeout commit
   of the release before this slot (section 8). Run `git grep -n -E
   "foldQuery|hayFor|matches\(|search\(" -- app/src` and list every
   caller; compare with section 6.6. A caller not in the table is a stop:
   report it.
0a. `npm install --save-dev --save-exact @orama/stemmers@3.1.18`. Confirm
   `package.json` holds `"@orama/stemmers": "3.1.18"` and that the package
   has no dependencies of its own (`npm ls @orama/stemmers`). Import only
   the two entries: `import { stemmer as stemRu } from
   '@orama/stemmers/russian'` and the same for `english`.
1. `search.ts`: add `Term`, `HayParts`, `parseQuery`, the internal
   `stemOf` and `partsOf`, and `rankHits` per sections 6.1-6.5. Change
   `hayFor` to return `HayParts`. Change `matches(it, terms, statLine?,
   hay?)` to take `readonly Term[]`; return false for an empty list. Keep
   `search(records, query, statLine?)`: it parses the query and keeps
   input order. Keep `foldQuery` and `statLineFor` unchanged. Export only
   what a caller or a test uses.
2. Rewrite the module header: both languages at once; words in any order;
   word forms by Snowball stems, checked on both sides (why: «зелёный»
   must not answer "зелье"); `"..."` for an exact phrase; never a
   near miss ("лук" does not offer "клык"); ranking on `#/search` only. Keep
   the `й`/`и` and diacritic comments as they are.
3. `search.test.ts`: keep every existing case; adapt the calls that pass a
   folded string to `matches` so they pass `parseQuery(...)`. Add:
   - `parseQuery`: words, a phrase, an unclosed quote, `""` and blank text
     give no terms, folding applies inside quotes.
   - Word forms: every example of section 6.2 through the stems that
     `parseQuery` produces; `зелье` does not find a record whose only
     match is «зелёный»; `броня` does not find one whose only match is
     «бронза» (pick both from the catalogue with a Node one-off, or build
     a two-record fixture if none exists).
   - Recall is a superset: for each query of the probe list `ring`,
     `меч`, `лук`, `а`, `-1`, `keeper's`, `zweihander`, `двуручное`,
     `ранг 1`, `ring of`, `стресс`, every record that today's rule matches
     (a local helper: some folded field `includes` the folded query)
     matches under the new rule.
   - Several words: `лечения зелья` finds the healing potions, which the
     contiguous rule misses; each word may hit a different field.
   - A phrase: `"ring of"` returns exactly today's result for `ring of`.
   - No near miss: keep "лук"; add `луки`: every hit holds `лук` at a word
     start or `луки` inside a field.
   - Ranking: for `ring` the first hit has "ring" at a word start in a
     name; for `меч` every hit with «меч» at a word start in a name comes
     before every hit without; equal scores keep input order.
   - The `hay` and no-`hay` paths agree on the probe list (the existing
     equivalence case, extended to multi-word queries).
4. `SearchPage.svelte`: `const terms = $derived(parseQuery(q));`;
   `matched` = `rankHits(browse.searchable.filter((it) =>
   app.kinds[kindOf(it)]), terms, statLine, hay)`; the `{#if !query}`
   branch tests `!terms.length`. Update the component's header comment
   (ranked, not catalogue order).
5. `TablesPage.svelte`: in `filtered` and `altSections`, `const terms =
   parseQuery(q)`; `!terms.length` replaces `!query`; `matches(it, terms,
   statLine, hay)`.
6. `dict.ts` `startTyping`: RU `Начните вводить запрос. Несколько слов
   ищутся в любом порядке, "фраза в кавычках" - дословно.`; EN `Start
   typing. Several words match in any order; "a phrase in quotes" matches
   exactly.` The quotes are straight on purpose: they show what to type.
   Do not change `searchPh`.
7. If `ItemPicker.svelte` exists: its rows are the first eight of
   `rankHits` over the same terms; update its test for one ranked case.
8. Component tests: `searchPage.test.ts` - the hint text (RU and EN), the
   describe "a query narrows, in catalogue order" becomes a ranked order
   case; `homebrewCatalog.test.ts` "lists own matches after the catalog" -
   per `Q3`: an own item whose name starts with the query ranks above a
   catalogue description hit. Run `tables.test.ts` and fix only a case
   that breaks.
9. `FEATURES.md` "Tables and search": replace "still a substring match, not
   fuzzy." with: "A query is words in any order: each word must appear in
   the record's name, description or stat line, in either language, as
   typed or in another form of the same word by its Snowball stem (`мечи` finds «Меч», `potions` finds
   "Potion"; «зелёный» does not answer `зелье`). A phrase in
   straight quotes (`"ring of"`) matches as typed, in one field. No near
   misses: `лук` does not offer «клык». `#/search` ranks its hits - names
   before descriptions, a word start before a match inside a word - and a
   table keeps its own order." Change "A signed-in author's own items
   follow the catalog's matches" to "A signed-in author's own items rank
   with the catalog's matches; on a tie the catalog's record comes first"
   (`Q3`).
10. The decision file exists (planner, 2026-10-01). Leave it unchanged
    unless the batch takes the fallback of section 7; then change its
    Decision line to the hand-written ending list, move `@orama/stemmers`
    to Rejected with the reason, run `node tools/decisions.js` and `node
    tests/derived.js` (it checks the 15-line body cap).
11. `tests/app/inventory.js`: update the `why` of `#/search ~ searched`
    ("ranked: the names that start with «меч» first"). For `#/search ~ a
    row ticked`, compute the first ranked row for `меч` with a Node
    one-off over `buildIndex` and `rankHits`, tick that name, and replace
    the comment that says "The first hit for меч". Update the `why` of
    `#/search ~ own items as gm1` per `Q3`. Add `#/search ~ words in any
    order`, typing `лечения зелья`, why: "two words in another order and
    form: the healing potions, which a contiguous match misses".
12. Gates in the order of "Verification commands" below. Read the golden
    compare diff before the re-seed: only the order and count of the
    searched states, the hint text and the `#/tables ~ searched`
    («кольцо» now also reaches «Кольца») state may change.

**Acceptance criteria.**

- Every query in step 3's probe list returns a superset of today's
  records (unit test).
- `лечения зелья`, `мечи`, `potions` and `daggers` each find records that
  today's rule misses (unit test and the new golden).
- `"ring of"` returns exactly today's `ring of` result (unit test).
- `лук` never returns a record without «лук» in a field (unit test kept).
- `#/search` with `ring` shows a ring first; a table box keeps its
  sections and roll order with any query (unit test, golden).
- Own items rank with the catalogue per `Q3` (component test, golden
  `#/search ~ own items as gm1`).
- If `ItemPicker.svelte` exists, its eight rows are ranked (its test).
- The `#/search` hint names the quotes in RU and EN; the placeholder is
  unchanged.
- `FEATURES.md` "Tables and search" states the new rule; the decision file
  exists and `docs/DECISIONS.md` lists it.
- The golden compare diff shows only the searched states and `#/search`
  arrival; the re-seed covers exactly those.
- `npm run check` passes; `searchPage.test.ts` still ends with
  `expectNoA11yViolations`.

**Verification commands.**

```text
npm install --save-dev --save-exact @orama/stemmers@3.1.18   (step 0a, once)
rtk npm run check                       (Bash timeout 600000; once per commit)
npm run build:test
npm run check:built
MSYS_NO_PATHCONV=1 node tests/app/golden.js --only="#/search"
MSYS_NO_PATHCONV=1 node tests/app/golden.js --only="~ searched"
(read the diffs, then the same two with --update)
node tests/app/sweep.js 360
```

Cost: `npm install` about 1 minute, `check` x2 about 13, `build:test` and
`check:built` (with the bundle budget) about 3, four golden calls about
10, `sweep 360` about 7: about 36 minutes. The sweep runs because the
`#/search` hint gets longer at 360 px. Coverage adds nothing: vitest
measures `app/src/`, not `node_modules/`.

**Risks, do-nots, settled decisions.**

- Do not change `searchPh`: about twenty test and golden drivers type into
  the box by that label.
- Do not add a `-` exclusion operator: `-1` is a documented query.
- Do not add a fuzzy or edit-distance match to a result list.
- Do not rank a table: `search.test.ts` pins the order a table keeps.
- Do not touch `lists.ts` or its list-name filter.
- Keep the `hay` cache keyed by the record object (an edited own item is a
  new object).
- Build regexes once per query, not once per record; split a field into
  words only after its stem filter passes; warm time on the whole
  catalogue stays under 8 ms in Node (measured 4-5 ms on the prototype).
- Import the two stemmer entries only (`/russian`, `/english`); the
  package has one entry per language, 28 in all.
- Do not add a search engine (MiniSearch, Orama, FlexSearch, Fuse.js):
  section 3.1.
- Stage by path, `package.json` and `package-lock.json` included; the tree
  may hold other work.

**Fallback.** If the dependency is refused (review or owner), use the
hand-written ending list of section 6.2, "Fallback", with the same
`Term.stem` field matched at a word start; the tests of step 3 keep their
examples except "зелье" (the list gives "зель") and the «бронза» case
(the list reaches it at a word start; drop that assertion and name the
precision loss in the decision file).

## 8. Schedule

Paths each queued release touches, against the paths of `B63.1`
(`issues/persistent-storage/plan.md` sections 9 and 12;
`issues/persist-7c-homebrew-relations/plan.md` 7.3;
`issues/persist-7e-list-quick-item/plan.md`;
`issues/persist-7f-consistency/plan.md`):

| Release | `search.ts` | `SearchPage` | `TablesPage` | `FEATURES.md` "Tables and search" | Search goldens | Other shared files |
|---|---|---|---|---|---|---|
| R7c (`B7c.1`-`B7c.4`) | `B7c.3` may add a caller (`ItemPicker`) | rows only (`B7c.4`) | rows (`B7c.4`) | likely (`B7c.4`) | re-seeded in `B7c.4` | `help.ts`, `dict.ts` |
| R7e (`B7e.1`) | - | - | - | - | - | `dict.ts` |
| R7f (`B7f.1`) | - | - | the homebrew load line (`LoadState`) | - | - | `dict.ts` |
| R7d (`B7d.1`, `B7d.2`) | - | - | - | - | - | `dict.ts` |
| R8 (`B8.1`) | - | rows draw art | rows draw art | possibly | maybe (`as gm1`) | `RowMain` |
| R9 (`B9.1`) | - | - | - | - | - | - |
| `debt-cleanup`, `persist-review` | not yet planned | | | | | |
| R10 (`B10.1`-`B10.4`) | - | - | - | - | - | lists pages |

One session runs per working tree, and the heavy gates need one agent
session on this host (`.claude/README.md`, 2026-09-26), so task 63 runs
between two releases, never beside one.

**Chosen slot (owner, `Q4` B, 2026-10-01): right after R7c's closeout,
before R7e.** The planner had recommended after R7f; the owner chose the
earlier slot.

- Order from now: R7c, task 63 (`B63.1` and its closeout push), R7e, R7f,
  R7d, R9, R8, `debt-cleanup`, `persist-review`, R10.
- R7e is deferred behind `B63.1`: it is implement-ready, and its base
  becomes task 63's closeout commit instead of R7c's. R7e shares only
  `dict.ts` with `B63.1` (`startTyping` against R7e's two new keys), so
  its plan needs no change beyond that base; the orchestrator updates
  R7e's handoff "Base" line and the roadmap order
  (`issues/persistent-storage/plan.md` section 9) when it dispatches task
  63.
- Gain: the owner's choice ships v1 two releases sooner. Cost: R7e and R7f
  wait about one batch (about 36 minutes of gates, plus the review and the
  closeout).
- Dispatch-time refresh (required, a planner pass before the implementer):
  1. Read R7c's shipped `ItemPicker.svelte` and its test: confirm it
     filters through `search.ts`; write the exact edit of step 7 (the
     first eight of `rankHits`) or drop step 7 if the picker does not use
     `search.ts`.
  2. Read the search snapshots `B7c.4` re-seeded (`tests/app/snapshots/`,
     the `#/search` and `~ searched` states) and the rows they now draw;
     update step 11 and the expected compare diff of step 12.
  3. Re-run step 0's caller grep against the closeout commit and update
     section 6.6.
  4. Re-read `bundle-budget.mjs`: R7c may have used the headroom; state
     whether step 0a will need the raise of section 6.7.
  5. Re-read `FEATURES.md` "Tables and search" as `B7c.4` left it and
     adjust the step 9 text to the surrounding sentences.

## 9. Owner questions - answered 2026-10-01

| Question | Answer | Placed in |
|---|---|---|
| `Q1` mode | A: one search, `"..."` for an exact phrase | decision file; section 7 steps 6, 9 |
| `Q2` v1 scope | A: words in any order, `@orama/stemmers` 3.1.18, `"..."`, ranking | decision file; section 7 |
| `Q3` own items | A: rank with the catalog, the catalog first on a tie | decision file; section 7 steps 8, 9, 11 |
| `Q4` slot | B: right after R7c's closeout, before R7e (not the recommended slot) | section 8 |

The questions as asked, kept for the record:

`Q1` - One search or a mode switch?
- **A (recommended):** one search; `"..."` gives today's exact rule per
  query. Reason: v1 loses no hit, so a "basic" mode adds nothing but a
  synced setting and a persistence surface. Trade-off: the quotes must be
  learned; the hint names them.
- B: a "basic | intelligent" setting in the Display section of
  `#/account`. Costs a synced preference and likely a migration.

`Q2` - What is v1?
- **A (recommended):** words in any order, word forms from the Snowball
  stemmers of `@orama/stemmers` (one pinned package, 2.6 KB gzip),
  `"..."`, ranking on `#/search` (one batch, about 36 minutes of gates).
  Concept table and "Did you mean" later, as their own task. Reason: it
  fixes the three measured defects with no data or contract change, and
  the standard stemmer is more precise than a hand-written list.
  Trade-off: one dependency; concept matches ("jewel" -> rings and
  amulets, "healing" -> "health") wait.
- B: A with the hand-written ending list instead of the package. No
  dependency, 1-2 ms per query; less precise ("стрела" reaches
  «стреляет», "маска" reaches «маскировка»).
- C: A plus the concept table now. Adds the curation and your review of
  the RU and EN term list before the commit; about one more hour. No
  library makes this cheaper (section 3.1).
- Not offered: a search engine (MiniSearch, Orama, FlexSearch, Fuse.js).
  Measured, each either offers «клык» for "лук" or loses today's in-word
  hits ("bow" -> Longbow), and needs a second index for own items.

`Q3` - Where do your own items go in ranked results?
- **A (recommended):** they rank with the catalogue; a tie puts the
  catalogue's record first. Reason: "homebrew is first-class" (decision of
  2026-09-30), and an own item named by the query should not sit below 300
  description hits. Trade-off: the R7b rule "own items follow the
  catalog's matches" changes, with its golden.
- B: the catalogue's hits ranked, then your items ranked, as today's
  order.

`Q4` - When does task 63 run?
- **A (recommended):** after R7f's closeout, before R7d (or inside an
  owner wait of R7d). Reason in section 8.
- B: right after R7c's closeout, before R7e.
- C: after R9, beside `debt-cleanup`.

## 10. Risks, assumptions, deferred

- Risk: Snowball merges two words of different meaning into one stem.
  Mitigation: ranking puts a stem hit at a word start below nothing that
  holds the exact text in a name; the two-sided check already keeps
  «зелёный» and «бронза» apart.
- Risk: the package goes unmaintained. Accepted: it is pinned, has no
  dependencies, and the Snowball algorithm is stable; the hand-written
  list (section 6.2, "Fallback") replaces it in one file.
- Risk: the 2.6 KB fails the bundle budget after R7c-R7f. Mitigation:
  section 6.7, a raise with its reason in the same commit.
- Risk: the ranked order surprises a GM who expects book order on
  `#/search`. Accepted: the tables keep book order; `#/search` is a finder.
- Risk: warm time grows from 0.33 ms to about 4-5 ms per keystroke in
  Node (16-30 ms on a phone). Accepted; the batch keeps regexes per query
  and splits words only after the stem filter. If a phone stutters, the
  hand-written list (1-2 ms) is the fallback.
- Assumption: R7c's `ItemPicker` filters with `search.ts`. The refresh in
  section 8 checks it.
- Deferred (section 5): the concept table, the "Did you mean" fallback
  with the layout swap, the match highlight, the tables help sentence.
  Each goes to a follow-up task after the owner uses v1; at closeout the
  ones the owner keeps are named to the owner, the rest dropped.
- Not planned: a fuzzy library, a search engine library, embeddings in
  the bundle, pgvector with an Edge Function, a mode setting, field
  operators, search text in the address.
