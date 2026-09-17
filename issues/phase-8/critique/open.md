# Phase 8 - open critique (no lens)

Read-only pass with no assigned dimension. I read the seven existing reports'
headings first and stayed off what they own. Everything below is measured on
this tree at `f53f44d`, against `data.js` / `data.json`, `app/src/**`,
`tools/**`, `tests/app/snapshots/`, git history, and the deployed
`https://artex-x.github.io/daggerheart-loot/`. No `npm` script was run.

---

## What the seven dimensions collectively do not cover

**Not one of the seven reports audits the catalogue.** They audit the
repository: components, comments, shards, bundle bytes, specs, hooks. The
catalogue - 1,091 records, which is what the site *is* - appears in them only as
a bundle-size number and as a fixture path. Nobody asked "is the data internally
consistent?", "does the app's own search find it?", "do the 1,091 published stub
pages say the right thing?". `app/src` is the frame; the data is the picture,
and the picture was not examined.

That blind spot is not an accident of how the briefs were written. It is
produced by the migration's acceptance criterion. **Parity makes every defect
the two implementations share invisible.** `docs/specs/DEBT.md` catches the
divergences somebody noticed and chose to reproduce; nothing catches the ones
nobody noticed, because reproducing them scored as success. O1 below is exactly
that shape: a Russian-language app whose search cannot find 37 of its own
Russian item names. I checked the deleted implementation with
`git show 23c00a6^:app.js` - its `function matches(it, q)` had the identical
defect, so the port was correct and the bug survived on a green gate.

The cost has gone up, not down. The old app is deleted, so "it behaved like this
before" is no longer answerable without archaeology, and the 110 goldens now
enshrine today's rendered output as the definition of right. From here on, a
pre-existing product defect can only be found by someone asking a product
question that no gate asks. That is the thing the framed agents could not be
asked for, and I think it is worth more than any single item below: **the next
pass should be run against the data and the user's intent, not against the
repository's own rules.**

---

## Worth doing

### O1 - search cannot find 37 of the catalogue's own Russian names

- **Where**: `app/src/lib/search.ts:37-38` - `has()` is
  `!!hay && hay.toLowerCase().includes(needle)`, and `search()` (`:62`)
  lowercases and trims the query and does nothing else.
- **What is wrong**: the only normalisation is case. Russian writers routinely
  type "e" where the catalogue spells "yo". A reader who types
  `плетеная сеть`, `черная нить`, `звездная капля` or `мед` gets nothing, or a
  short list that silently omits the record they wanted. The same holds for the
  13 English equipment names carrying a typographic apostrophe
  (`Keeper’s Staff`): a keyboard produces the ASCII form, the data holds U+2019,
  and the substring test fails.
- **Evidence** (counted over `data.json`, all 1,091 records):

  | query | hits today | hits with folding |
  |---|---|---|
  | `плетеная` | 0 | 1 |
  | `черная` | 0 | 1 |
  | `звездная` | 0 | 1 |
  | `мед` | 19 | 20 |
  | soldier + ASCII apostrophe + s | 0 | 1 |
  | keeper + ASCII apostrophe + s | 3 | 4 |

  37 Russian **names** contain the letter yo; 211 records contain it in a
  Russian field. 13 English names contain U+2019; 28 equipment records contain
  it somewhere. This hits every search box, not just `#/search` - `TablesPage`
  uses the same `matches`.
- **Smallest fix**: one pure helper in `search.ts` applied to both sides -
  lowercase, fold yo to e, fold U+2019 to the ASCII apostrophe. `has()` folds
  the haystack, `search()` folds the query once. No component, state, port or
  contract changes. Three cases in `search.test.ts`: a yo name, an apostrophe
  name, and the existing lookalike case still failing to match, so folding is
  not mistaken for fuzziness.
- **Goldens: none.** I replayed all six queries the golden states type
  (`меч`, `двуручное`, `а`, `кольцо`, `вторичное`, `zzzqqqxx123`) with and
  without folding over the full catalogue: identical hit counts in every case,
  including the 300-cap state. Folding can only add matches, and none of those
  queries gains one.
- **Effort/value**: S / **high**. Highest user impact I found, cheapest to fix.

---

### O2 - the apostrophe splits perfectly along the data's ingest seam

- **Where**: `data.js`, and therefore `data.json`, `catalog.csv` and `i/*.html`.
- **What is wrong**: all **381** equipment records (`eq`, ids `q*`/`f*`) use
  U+2019; all **710** loot-table records use the ASCII apostrophe. Zero records
  mix the two. That is not editorial drift, it is two ingests never reconciled,
  and it is visible: a search for `меч` puts `Demon’s Edge` and a
  straight-apostrophe loot name in the same result list. `CLAUDE.md`
  ("otherwise use ASCII punctuation and characters") reads as an argument for
  the ASCII form, which is also what a keyboard types. Distinct from
  `product.md` P14, which is scoped to `dict.ts`.
- **Evidence**: `eq` records with U+2019: 28; with ASCII: 0. Loot records with
  U+2019: 0; with ASCII: 173.
- **Smallest fix**: one substitution over the `en`/`ende` fields of `d.eq` in
  `data.js`, then rebuild the derived files. Ids are untouched, so no shipped
  record is renumbered and CONTRACTS.md needs no change - but `data.json`,
  `catalog.csv` and 381 stub files move, and `llms.txt` advertises the CSV as
  the canonical name source, so an agent holding a cached name string would
  miss.
- **Goldens: 6 files.** `_search_searched.txt`, `_search_a_row_ticked.txt`,
  `_tables_eq_armor.txt`, `_tables_eq_secondary.txt`, `_tables_eq_weapon.txt`,
  `_tables_eq_weapon_panel_open.txt` render one or more of the 13 apostrophe
  names (22 occurrences). No golden renders an apostrophe-bearing *description*.
  Note that the 20 goldens containing U+2019 mostly get it from `dict.ts`'s
  `Players’ link`, not from the data - do not conflate the two when
  re-recording.
- **Effort/value**: M / low-medium. **Do O1 first**: with folding in place this
  is purely cosmetic, and it is reasonable to defer it, or to decide the other
  way (normalise everything *to* U+2019), without losing anything.

---

### O3 - every one of 1,091 records has the same browser tab title

- **Where**: `app/src/components/Shell.svelte:26-29` - one `$effect` sets
  `document.documentElement.lang = app.lang` and
  `document.title = app.t.docTitle`.
- **What is wrong**: `docTitle` is one constant per language. The title never
  follows the route or the open record. Nine sections, 1,091 records and every
  saved list produce byte-identical history entries, bookmarks and tab labels.
  The irony: the share stub already computes the right string - `i/w1.html` has
  `<title>Смола Бездны — Генератор лута Daggerheart</title>` - so the app is the
  only surface that throws it away, and a reader arriving from a shared link
  watches a correct title be replaced by a generic one.
- **Smallest fix**: extend the same `$effect` to append the record or section
  name when the route has one, reusing `nameOf(it, app.lang)` and the section
  labels already in `dict`. No new module, no new export; the naming logic
  exists.
- **Goldens**: none - the snapshots are accessibility trees of the body.
- **Effort/value**: S / medium. Confirm with the owner that it is wanted before
  planning it; it is the only item here that adds behaviour rather than
  correcting it.

---

### O4 - the largest published surface is monolingual, and no spec says so

- **Where**: `tools/build-share-pages.js:104-160`; live at
  `https://artex-x.github.io/daggerheart-loot/i/w1.html`.
- **What is wrong**: all 1,091 stubs are hard-coded Russian - `html lang="ru"`,
  Russian title, `og:description`, `twitter:*`, body copy and the
  "Открыть в генераторе лута" link - built from `it.ru || it.en` and
  `it.rud || it.ende`. An English-mode reader who uses the record card's
  "Страница"/"Page" action lands on a Russian page, and every link that reader
  shares unfurls in Russian. That may well be right for the audience, but
  `docs/specs/I18N.md` does not mention the stubs at all (searched for `stub`,
  `lang="ru"`, `i/<id>`: no matches), and neither does `META.md`'s section on
  what is published. A bilingual product's biggest published artefact carries an
  undocumented language decision.
- **Smallest fix**: three sentences in `I18N.md` recording the decision and its
  reason. Do **not** generate an English stub set - that doubles a 1,091-file
  artefact for a preview string.
- **Effort/value**: XS / medium. The value is that the next person does not
  rediscover this and "fix" it into 2,182 files.

---

### O5 - the stub generator survives on an undocumented `data.js` shape

- **Where**: `tools/build-share-pages.js:109` - the description is built with
  `(it.rud || it.ende).replace(/\s*\n\s*/g, ' ')`, with no fallback.
- **What is wrong**: 112 records carry no description in either language. It
  does not throw only because `data.js` stores `rud: ""`, `ende: ""` rather than
  omitting the keys - confirmed on `f2`. `tools/build.js` strips those empty
  strings when it writes `data.json`, so the same record is `{ende: ""}` in the
  canonical file and has no `ende` key in the published one. Nothing enforces
  the empty-string convention; the first record added with the key genuinely
  absent fails the build inside `npm run check` with a bare `TypeError`.
- **Smallest fix**: add a `|| ''` fallback to that expression. One token.
- **Effort/value**: XS / low-medium. Cheap insurance on a path that runs in
  three CI jobs.
- **Same file, same visit**: line 169's comment says "render all 830 into
  memory" - the count is 1,091. One word.

---

### O6 - the stub's visible paragraph keeps list markup the meta line strips

- **Where**: `tools/build-share-pages.js:109` vs `:160`.
- **What is wrong**: line 109 deliberately flattens newlines for the unfurl,
  with a comment saying why, but line 160 emits the description raw into a
  paragraph. 98 records have multi-line descriptions using the "- " list
  convention, so `i/w6.html` renders
  "…бросить d6: - 1: отметьте Стресс - 2-3: ничего не происходит…" as one
  run-on paragraph. Only visible before the redirect fires and to a reader
  without JS, which is why it has survived.
- **Smallest fix**: reuse the already-computed flat string, or split on newline
  and emit list items. `app/src/lib/desc.ts` already owns this parse correctly
  for the app - the generator is the one place that does not.
- **Effort/value**: XS / low.

---

## Noticed, not worth it

- **`data.js` and `data.json` disagree on empty-string vs absent keys** (the
  other half of O5). Seven vitest suites read `data.json`; the browser reads
  `window.LOOT`. Every current consumer treats the two the same
  (`descOf(it, lang) || ''`, `!!hay &&`), so nothing is broken - but a test
  asserting `toBeUndefined()` on a description would pass against the fixture
  and be wrong about the shipped app. Worth one line in CONTRACTS.md's
  generated-data section if someone is editing it anyway.
- **`app/src/lib/listLink.ts:48-59` uses `btoa`/`atob`/`TextEncoder` directly**
  while `CLAUDE.md` says `app/src/lib/` is pure logic and browser APIs belong
  behind `app/src/ports/`. These are `globalThis` functions available in Node
  too, so the module is genuinely testable and portable; the rule's intent is
  satisfied even if its letter is strained. Leave it.
- **`.nvmrc` says 24, `package.json` `engines.node` says `>=22`.** Not a
  contradiction, and CI pins from `.nvmrc`. Mentioned only because the two sit
  three lines apart in a cold-clone reader's attention.
- **`llms.txt:20`** says "Fetching `index.html` gives you an empty page". It
  does not - `app/index.html`'s `noscript` block carries the three data links
  and two paragraphs, which is precisely the fix that block's own comment
  describes ("a model handed a link to a list decided the site was
  unreadable"). The sentence undercuts the thing it should point at. One clause.

---

## Checked and found sound - do not look here again

Concrete, so the next person can skip these on a number rather than a feeling.

**Catalogue integrity (`data.json`, all 1,091 records)**
- 1,091 ids, **zero** collisions across the ten tables and `eq`.
- Every record has `id`, `src`, `kind`, `en`, `ru`, `img`. 112 lack a
  description; **all 112 lack it in both languages** - zero asymmetric records,
  so no language has a hole the other fills.
- Roll numbering: `core_item`, `core_consumable`, `hnf_item`, `hnf_consumable`
  1-60; `wondrous` 1-119; `dread` 1-29 - contiguous, no duplicates, no gaps.
  `community` is 9 sub-tables of exactly 10 by `community`; `voa` is 24/24/24/25
  by tier plus 6 artifacts and 5 cursed - each internally unique. `frames` and
  `starting` carry no roll, as designed.
- Zero duplicate English names and zero duplicate Russian names within a table.
- Text hygiene: no leading/trailing whitespace, no double spaces, no tabs or CR,
  no NBSP, no Cyrillic in an English field, no Latin-only Russian name, no
  record where `ru === en` or `rud === ende`.
- Translation structure: of the 979 records with both descriptions, **zero**
  have a RU/EN length ratio outside 0.55-2.2 and **zero** have a differing line
  count. Whoever did this was careful and it shows.
- `refs`: 5 entries, all 5 referenced by at least one record.
- Equipment: 59 upgrade lines - 58 of exactly four records (tier 1-4) plus 149
  records with none; every line's head id exists. Tiers 58/108/108/107.
  51 distinct damage strings, and **every one** resolves to a die (d4-d20) that
  `card/` has art for, so no card silently falls back to the CSS hexagon.

**Artwork and published assets**
- 875 distinct `img` values across 1,091 records; 876 `.webp` files; **zero**
  records point at a missing file. The only orphan is `_none.webp`.
- `og/` is keyed by image basename, not record id (which is why a naive per-id
  check reports 216 false gaps). Under the correct key: **zero** missing, and
  the only orphans are `_none.jpg` and `_share.jpg`, both intentional.
- All 36 `card/*.svg` are reached - the names are built by template in
  `print.ts:47-50` and `dice.ts`, which is why a literal-string search reports
  25 of them as dead. None are.

**Generated artefacts**
- The CSV is 1,092 lines = header + 1,091, exactly as `robots.txt` advertises;
  embedded newlines are flattened to spaces, so "one per row" holds.
- `tools/build-share-pages.js` escapes **every** interpolation - the five HTML
  entities via `esc` at `:23-25`, and the inline redirect via `JSON.stringify`
  at `:163`. I looked for an injection through a record name or description and
  there is none.
- Counts agree everywhere they are written down: 1,091 in `llms.txt:3`, `:43`,
  `robots.txt`, `app/index.html`'s description and `noscript` block; 710 + 381;
  94/119/108/90 per source in `llms.txt:66-70`.

**App correctness in the places I probed**
- `app/src/lib/desc.ts` parses the "- " list convention and the label-colon
  convention correctly and returns *data*, so no component injects HTML. The 98
  multi-line descriptions render properly in the app - the stub is the only
  place that does not (O6).
- `document.documentElement.lang` follows the language switch
  (`Shell.svelte:26-29`), with a comment saying why. This is the WCAG 3.1.1
  failure I went looking for and it is not there.
- `dict.ts` parity is a **compile error** by construction (`Dict` derived from
  the Russian side), not a test that could be skipped. Strictly better than the
  build-time source-parsing the old app used.
- Type and lint discipline: **five** `eslint-disable` lines in all of production
  source, **one** `as any` and it is in a test file, **zero** `@ts-ignore` or
  `@ts-expect-error`. For 17,013 lines of source that is unusually clean.
- Share-link size has no cliff: a 300-id list is a **1,954-character** URL
  uncompressed and **847** through `deflate-raw` (`ports/compress.ts`), which
  already picks whichever came out shorter. No browser or messenger limit is in
  reach. `stamp()`'s "about once in two million" claim is right - 36^4 = 1.68M.
- `roll.ts` is correct for what it claims, including the deliberate triangular
  distribution of Nd12 that `README.md` explains rather than hides.
- Licensing is handled: the DPCGL attribution is in the app's own footer
  (`dict.ts:82` and `:406`, both languages), not only in `README.md`, so it
  reaches the published product.
- Live site: the root, `robots.txt`, `llms.txt`, `data.js` and `i/w1.html` all
  answer 200 with the expected bytes; `noindex` is present on both the SPA shell
  and the stub while crawling stays allowed, which is the product law working.

---

## Noted, out of scope

The apostrophe seam (O2) is one symptom of there being no normalisation step at
ingest - a proper one would also settle dash style, quote style and yo-letter
policy across the data. That is a data-pipeline ticket, not a Phase 8 batch.

---

## Verdict and next action

**fix-then-continue.**

Nothing here blocks a release; the catalogue is in better shape than I expected
and the app's type and asset discipline is genuinely good. But O1 is a
one-function fix for a defect that makes the product's primary-language search
fail on 37 of its own item names, and it is golden-safe by measurement.

Order: **O1**, then O5 + O6 + the "830" comment as one cheap `tools/` commit,
then O4 as a spec sentence. O3 needs an owner decision before it is planned.
O2 is defensible to defer indefinitely once O1 lands.

**Checks still needed** (I ran none - read-only, shared tree): `npm run check`
after O1, and all four golden shards only if O2 is taken.
