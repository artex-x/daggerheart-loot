# Plan - TASK homebrew-followups

## Status

- Mode: A (new plan), planner pass 2026-10-08, base `3a899d52` (origin/main, holds R7h).
- Starts after task #71 ships to `main` (B1 builds on #71's `listFacetRows`; see "Item 2").
  TASK 70 (GM-only entries) may land before; B1 rebases `RequestsPanel.svelte`,
  `SharedListPage.svelte`, `facets.ts`, `dict.ts`, `inventory.js` on whatever is on `main`.
- Batches: B1 implement-ready, not started. B2 implement-ready (second planner pass, same day,
  after the owner's answers), not started.
- Owner answers 2026-10-08: Q1 = A (the card stores the official ids; the account's own view
  only; share links show the book's item; B can follow later with no data change); item 1 stays
  in this task.
- NEEDS_HUMAN_CONFIRMATION: no.
- Plan review: required before B2 (trigger: a migration and a SECURITY DEFINER function, a public contract change, possible loss of stored data)
- Plan review findings applied: reviews/plan-B2.md
  - plan-B2-1, B2 steps 10 and 11, Error scenarios, the decision file: `toHomebrewRows` copies a held card's `items` into a v1 file's card of the same kind, a v2 file wins; the two-tab race named; `homebrewImport.test.ts` and db cases; trade-off "a v1 file cannot remove book items"; the stale-tab export in the "Stale tab" row.
  - plan-B2-2, "Decided here" and B2 step 13: an own set's fold counts every member; catalog members in catalog order (`relOrder`), own by name; `FEATURES.md` "Own relations on a card" amended; `record.test.ts` checks the order.
  - plan-B2-3, B2 steps 9 and 13, Files: the import hint links `schema/homebrew-v2.json` beside v1 (new `hbImportSchemaV2`); `FEATURES.md` "Import" and "Exports" and `META.md` section 3's third `updated_at` limit added.
  - plan-B2-4, B1 step 8 and B2 step 11 and States: timing bounds moved to `facets.timed.test.ts` and `homebrew.timed.test.ts`, named in `COVERAGE.md`.
  - plan-B2-5, B2 step 13 and step 11: the Q1 = A text names the owner's own share links; a `sharedListPage.test.ts` case for gm1 on its own `#/s/`.
  - plan-B2-6, B2 step 2: `cardUses` stays; the three callers add `cardItemIds(c).length`.
  - plan-B2-7, B2 step 1: the `hb_` test uses `public.homebrew_key_ok`; the reversal names each restored body's source migration.
  - plan-B2-8, B2 step 11 and the decision file: db cases for items with text, `book_id` only, and a no-change update (now silent, stated).
  - plan-B2-9, B2 steps 11 and 13: an official member alone draws no set line or bonus (`data.test.ts`, FEATURES "Cards").
  - plan-B2-10, B2 States and step 11: the largest open fold (100 official plus 100 own, 300 at 3x) in `homebrewPage.timed.test.ts`.
  - plan-B2-11, B1 step 11: the two owner-rule texts trimmed to three lines each.
  - plan-B2-12, `handoff.md` "Completed": the review report path in the template form.
- Note for the orchestrator: `agent-guard.mjs` reads every "required before <batch>" line and
  denies any implementer dispatch of the task while one of them has no approve (or an applied
  fix-then-continue); it does not compare the line's batch with the batch dispatched. The
  review of B2 returned fix-then-continue and its findings are applied below, so B1 may start
  once #71 is on `main`, then B2; no second look.

## Objective and evidence

Owner feedback on the released R7h, relayed 2026-10-08 (no GitHub issue, no screenshot):

1. A set or a rule card on «Мои предметы» takes official catalog items, not only own items.
2. A filter row with one value (for example a single section on `#/tables/homebrew`) is useless.
   Filters are dynamic on every page: only the values present in what the page shows, as #71
   plans for the shared list page. Generalise it.
3. A list's change-notice panel with one notice (for example a deletion) draws «Скрыть» and
   «Скрыть изменения». Too many buttons: show one.
4. Arazo's Artifacts: delete the «Заметка для Мастера: ...» / "GM Note: ..." paragraph of aa2,
   aa5, aa21 and aa50, in `rud` and `ende`. A deliberate divergence from the book; record it
   where a future RU or source audit sees it, so nobody restores it.
5. aa11 "The Looking Glass": the owner dislikes «Зерцало»; the planner picks the name.

Live facts checked on the base (2026-10-08):

- `#/tables/homebrew` as gm1 (seed): two sources, so two chips. The «Мастерская Ольхи» chip
  holds one item (the axe, equipment, in «Холодное оружие»), but its panel offers «Тип» with
  three kinds (`kindRow` reads every own row, not the chosen source) and «Раздел» with one value.
  Both rows narrow nothing there. This is the owner's case.
- The catalog tables: every value the equipment rows offer is answered (`data.json`: weapons
  every `cls`, `range`, `burden`, trait, tier 1-4 and A; secondary every `cls`, `range`, tier 1-4;
  armour tier 1-4). `kindRow` already needs two kinds. So the offer rule changes no catalog
  table; only own-item rows change.
- `RequestsPanel.svelte` draws «Скрыть изменения» in `.nfold` for any count of notices.
- Only aa2, aa5, aa21 and aa50 carry a GM note in the catalog (the four, both languages; the
  note is the last line of each text). aa21's rungs carry none. aa11 is «Зерцало» in `ru` and
  «С помощью Зерцала» in `rud`, its only inflected use.

## Design

### Item 2 - the offer rule on every page

What "dynamic" means, taken from #71 ("What dynamic means", rules 1-3) and made every page's:

1. A row offers a value only when a row the page draws before the filter answers it.
2. A row is drawn only when it can narrow: two or more values, or one value that some drawn
   row does not answer.
3. A row never narrows by the picks in another row.

The pages with a filter strip are the tables (`TablesPage.svelte`: the plain tables, the three
equipment tables, `#/tables/homebrew`) and, after #71, the shared list page. The search page's
kind chips pick the scope of a query, not values of drawn rows, so they keep all three kinds
(and the «Нужен хотя бы один тип» rule). The roll pages draw roll modes, not filters.

Rule 4 (reading a picked value no row offers) stays per page:

- A table keeps a picked value among the offered values while it is picked, even when no
  drawn row answers it, so its pill stays and the table narrows as today. Example, as gm1:
  `#/tables/homebrew/f_src-hb_alderworkshopaaa.kind-item` keeps the pill «Предметы» and draws
  «Ничего не найдено» with «Сбросить всё», exactly as today. A value that no candidate row
  lists (an unknown key, `f_tier-A` on `eq_secondary`) draws no pill and empties the table, as
  today. So every table address reads and draws as before the change.
- A share link keeps #71's rule: such a value draws no pill and narrows nothing.

Why the tables do not take #71's rule 4: `CONTRACTS.md` section 1 freezes the route grammar
"as written in `ROUTES.md`", and `ROUTES.md` says a value no row answers "narrows to nothing".
Rule 4 on a table would turn an empty table into the whole table for the same address: a public
contract change for no request from the owner. The share link's reason (a list that changes
under the reader) does not hold for a catalog table.

Mechanism (pure, `app/src/lib/facets.ts`):

```ts
/** Returns the rows a page offers: of each candidate row, the values that a drawn record
 *  answers or that `picked` holds; a row stays when it can narrow (two values, or one value
 *  some record lacks) or holds a picked value (docs/specs/FEATURES.md, "Tables and search"). */
export function narrowRows(
  candidates: readonly FacetRow[],
  records: readonly Record_[],
  facetOf: (it: Record_, group: string) => string | readonly string[],
  picked: FilterState = {}
): FacetRow[]
```

- "Answers" is `groupHits`' rule: `[facetOf(it, group)].flat().includes(value)`, so `spellcast`
  answers all six traits and burden `any` answers `1` and `2`.
- The candidates stay the existing builders (`facetRows`, `eqFacetRows`, #71's list
  candidates): they own the order and the labels. `narrowRows` only removes.
- #71's `listFacetRows` becomes `narrowRows(<its candidates>, records, (it, g) =>
  listFacets(it)[g] ?? '')` with no `picked` (rule 4 stays the share page's `inForce`). This is
  the extraction on the second use; #71's unit tests stay green unchanged.

What #71 must expose: nothing blocking. B1 needs #71's `listFacetRows` and `listFacets` on
`main`. Cheaper for B1 (optional, the orchestrator's call): #71 writes `listFacetRows` as
"candidates, then one pruning step", so B1's extraction is a move. If #71 inlines it, B1
extracts it.

`TablesPage.svelte` composes: `facRows = narrowRows(facetRows(browse, table, t, lang,
hbSource), shownRows, valueOf, facetState)`, where `valueOf` is the accessor `facPassed`
already uses (`equipFacets` or `plainFacets`). On `#/tables/homebrew` this makes the rows the
chosen chip's: the gm1 «Мастерская Ольхи» chip draws no strip; «Хоумбрю» offers «Тип» with
«Предметы» and «Расходники» only.

### Item 3 - one notice, one hide button

`RequestsPanel.svelte`: the `.nfold` block (the fold «и ещё N изменений» and «Скрыть
изменения») is drawn only from two notices. With one notice the panel draws its row's «Скрыть»
(its name «Скрыть изменение «%s»») and nothing after it. From two, as today. The fold appears
from four, as today. Rejected: keeping «Скрыть изменения» and dropping the row's «Скрыть» for
one notice (the row button names the item; one control would move between two places by
count).

### Items 4 and 5 - Arazo data

- aa2, aa5, aa21, aa50: drop the last line of `ende` (from `\nGM Note: `) and of `rud` (from
  `\nЗаметка для Мастера: `). Nothing else changes; ids, rolls and art stay.
- aa11: `ru` «Зерцало» becomes «Волшебное Зеркало»; `rud` «С помощью Зерцала» becomes «С
  помощью Волшебного Зеркала». `en` stays "The Looking Glass".
- Why «Волшебное Зеркало»: "looking glass" is the old, fairy-tale word for a mirror; «волшебное
  зеркало» carries that register in Russian (the magic mirror of the tales), it reads as an
  artifact beside the catalog's «Зеркало Златоцвета» (cc59) and «Зеркало Фей» (di15), it is in
  the site's title case, and a search for «зеркало» finds it.
- Rejected: «Зерцало» (the owner: archaic); «Зеркало» (a plain noun beside two named mirrors,
  reads as an ordinary mirror); «Зеркальце» (a search for «зеркало» does not find it: the
  Snowball stems differ, «зеркал» and «зеркальц», and `stemHit` compares stems);
  «Зазеркалье» (a place, Carroll's book, not an object); «Зеркало Обличий» (invents a name the
  book does not give).
- Where an audit sees it: a bullet in `docs/specs/I18N.md`, "Rules" (the rules a RU audit
  reads), a guard in `tests/derived.js`'s Arazo block, and a decision file with the rejected
  names. The 2026-10-07 Arazo decision gets the "Amended by" pointer.

### Item 1 - official items in an own set or rule card (B2; the owner chose A)

Facts that fix the shape:

- An own item's membership lives on the item (`content.set`, `content.refs`); a card holds no
  member list. An official record is never written (`data.js` is the catalog). So an official
  member must be stored on the account side, and the only own row it can belong to is the card.
- A catalog record holds one `set` and up to three `refs` keys. Own items hold the same caps.
- The homebrew file `homebrew-v1` is frozen: "any other change is homebrew-v2.json beside this
  one" (`schema/homebrew-v1.json`). A card's official members must reach the account export,
  or a restore loses them.
- `homebrew_cards_touch()` (definer) bumps every list that links an item naming the card and
  writes a «changed» notice to other owners. A members-only card edit must not do that: no
  linked item's record changes (the record embeds a card's names and texts only).
- The previous frontend's card form writes only the form's fields (`cardContentOf`), so after a
  frontend revert an edit of a card's text drops its official members. A down migration must
  strip them (the old `homebrew_card_valid` refuses the key).

#### Owner question Q1 - how an official item joins an own set or rule card (answered: A)

The owner chose A on 2026-10-08, and kept item 1 in this task. The options as asked:

- **A (recommended)**: the card stores the official ids, `content.items`, at most 100 per card.
  The owner sees the own set bonus or rule card on the official item wherever the account draws
  it: the record page and dialog, table rows and cards, search, print, the owner's own lists.
  The Sets and Rules tabs list the official members beside the own ones, by name, each a link
  to `#/i/<id>` with its book's name after it and «Убрать». A shared link, another account and
  «Сохранить себе» see the official item as the book prints it. Cost: one migration (the card
  validator, the touch trigger), `homebrew-v2` for an export whose card holds official members,
  one plan review. Trade-off: players on a share link do not see the GM's set bonus on an
  official item.
- **B**: A, and a share link also carries the GM's card on an official entry
  (`get_shared_list`, a definer function, embeds the owner's cards per official entry, and a
  card edit bumps the lists that hold its official members). Players see the bonus. Cost: A
  plus a second definer change and more notices; it can follow A later with no data change.
- **C**: an official item added to a set becomes an own copy in «Хоумбрю» («Сохранить
  себе»-style) that joins the set; no schema change. Trade-off: two items with one name, and a
  list that holds the official id shows no set.

The recommendation was A: it is what "add the existing item" means to the GM who builds the
set, it changes only the card row on the server, and B stays open with the same stored shape.

"The account draws it" means the signed-in account's own index (`app.index`): the account's
own cards apply to an official item on every page that index draws, a share link the account
opens included. Another account's cards never apply. A signed-out reader, `#/h/<uuid>` (the
catalog index plus the author's item) and a share link's projection carry none.

Decided here (planner):

- An official item with a book set (`set` in `data.js`) is not offered for an own set: a record
  has one set, and the book's wins. Rule cards have no such limit beyond the three.
- An official item takes at most three rule cards: its book's plus the own cards that name it.
  The client refuses the fourth with «У предмета «%s» уже три карты правил.»; the database does
  not check across rows. A second tab can exceed it; the record then draws every card, bounded
  by the card limit.
- An official item in another own set is offered; the add asks «Предмет «%i» уйдёт из
  комплекта «%s». Перенести его?» and writes the old card (remove), then the new card (add). A
  failed second write leaves it in no set, and the toast says so; a retry adds it.
- Two own set cards that name one official item (a race, or a file import): the index takes the
  card whose key sorts first; the Sets tab lists it under both, so either «Убрать» repairs it.
- A rule card the account names on an official item draws after the book's rule cards, the own
  cards in key order.
- A set with an own key folds its members past the third on the record page, in print and in
  the copied text, the official ones included (`foldOwn` folds only own records today; an own
  set of 100 official members would otherwise draw 100 links). The catalog members draw in
  catalog order, as `relOrder` draws them, then the own ones by name; the Sets tab lists all
  members by name.
- While a write to a card is in flight, that card's picker offers nothing and its «Убрать»
  buttons are disabled, so a second press never writes over a stale revision.
- `items` holds catalog ids only (`^[A-Za-z0-9_-]{1,64}$`, never an `hb_` key): an own item's
  membership stays on the item.

## Batches

Two batches. Split criteria (`CLAUDE.md`, "Task and session protocol"):

- B2 is a public-contract change (`homebrew-v2`) with a migration and a definer function; it
  needs its own plan review. B1 changes no contract and no stored shape.
- Items 2, 3, 4 and 5 merge into B1: they share every gate (one check, one golden re-seed, one
  sweep pair). Separate batches would pay the gates three times for no review gain.

Gate cost (README figures, this host): B1 - `check:fast` + `check:1` + `check:2` 13-19 min,
`check:built` under 1 min, `contracts,dataint` 1 min, the pooled browser run 5-8 min, the golden
re-seed of the changed states about 3 min, four golden shards 8-20 min, sweeps 360 and 1180 11-20
min: about 45-70 min. B2 - the same plus `check:db` 7-9 min, and after the review's approve
`db:push --project test` and `npm run e2e` 2-3 min: about 55-80 min. Total about 1 h 45 min to
2 h 30 min, plus the plan review and the batch reviews.

### B1 - Offer rule on every page, one-notice panel, Arazo data (implement-ready)

**Objective.** Every filter strip offers only the values its drawn rows answer and draws only
rows that can narrow; a notice panel with one notice draws one hide button; Arazo's four GM
notes are gone and aa11 reads «Волшебное Зеркало», with the divergence recorded and guarded.

**In scope.** The files below. **Out of scope.** Item 1 (B2); the search page's kind chips;
the roll panels; the share page's rule 4; any route grammar; `#/lists/<id>` (no filter, owner
2026-10-06).

**Files.**

- `app/src/lib/facets.ts`, `facets.test.ts` - `narrowRows`; #71's `listFacetRows` built on it.
- `app/src/components/TablesPage.svelte`, `tables.test.ts`, `homebrewCatalog.test.ts`.
- `app/src/components/RequestsPanel.svelte`, `requestsPanel.test.ts`.
- `data.js` and the generated `data.json`, `catalog.csv`, `i/aa2.html`, `i/aa5.html`,
  `i/aa11.html`, `i/aa21.html`, `i/aa50.html`, `i/en/...` (by `node tools/build.js`; the hooks
  block a hand edit of generated files).
- `tests/derived.js` (the guard).
- `tests/app/inventory.js`, `tests/app/snapshots/` (re-seeded and new). No route fixture
  changes: every address reads as before.
- `docs/specs/FEATURES.md`, `ROUTES.md`, `I18N.md`, `COVERAGE.md`; two new files under
  `docs/decisions/`; the "Amended by" lines in two older ones; `docs/DECISIONS.md` (rebuilt by
  `node tools/decisions.js`).

**Steps.**

1. Read `app/src/lib/facets.ts`, `SharedListPage.svelte` and `facets.test.ts` on the branch
   base: #71's `listFacetRows` and `listFacets` must be there. If they are not, stop: B1 needs
   #71 on `main`.
2. `facets.ts`: add `narrowRows` with the signature in "Item 2" and this body:

   ```ts
   return candidates.flatMap((row) => {
     const chosen = picked[row.group] ?? [];
     const answers = (value: string) => (it: Record_) =>
       [facetOf(it, row.group)].flat().includes(value);
     const values = row.values.filter(
       (v) => chosen.includes(v.value) || records.some(answers(v.value))
     );
     const first = values[0];
     const narrows =
       values.length >= 2 || (first !== undefined && !records.every(answers(first.value)));
     const held = values.some((v) => chosen.includes(v.value));
     return first && (narrows || held) ? [{ ...row, values }] : [];
   });
   ```

   Import `FilterState` as a type from `./filters.js`. Rewrite #71's `listFacetRows` as its
   candidates passed through `narrowRows(candidates, records, (it, g) => listFacets(it)[g] ??
   '')`; keep its exported name and signature. Update the module's header comment: the offer
   rule is every page's (`FEATURES.md`, "Tables and search").
3. `TablesPage.svelte`:
   - Move the `valueOf` accessor out of `facPassed` into its own `$derived` (`eqKind ? (it, g)
     => equipFacets(it)[g] ?? '' : (it, g) => plainFacets(it)[g] ?? ''`) and use it in
     `facPassed`.
   - Replace `const facRows = $derived(browse ? facetRows(...) : [])` by a declaration placed
     after `shownRows` and `facetState`: `const facRows = $derived(browse ?
     narrowRows(facetRows(browse, table, t, app.lang, hbSource), shownRows, valueOf,
     facetState) : [])`. `pickFacet` reads `facRows` as now; nothing else changes.
   - Update the comment above `hbSources` or `facRows` in one or two lines: the rows are the
     shown rows' values (the chosen chip's on `homebrew`); a picked value stays drawn.
4. `RequestsPanel.svelte`: wrap `<div class="more nfold">...</div>` in `{#if notices.length >
   1}`. Update the header comment: «Скрыть изменения» from two notices.
5. `data.js` (one line of JSON): replace by exact substring, each asserted to occur once, with
   a throwaway `node` script outside the repository (or the `daggerheart-data-edit` skill):
   - aa2 `ende`: drop `\nGM Note: Radiant deals normal damage to each successfully hit target,
     rather than half damage.`; `rud`: drop `\nЗаметка для Мастера: Лучезарное наносит полный
     урон каждой поражённой цели, а не половину.`
   - aa5, aa21, aa50: drop the `\nGM Note: ...` and `\nЗаметка для Мастера: ...` tail in the
     same way (each tail runs to the end of its string; read the exact text from `data.js`).
   - aa11: `"ru":"Зерцало"` to `"ru":"Волшебное Зеркало"`; `С помощью Зерцала` to `С помощью
     Волшебного Зеркала`.
   - Then `node tools/build.js`. `git diff --stat` shows `data.js`, `data.json`, `catalog.csv`
     and the stubs of the five ids only.
6. `tests/derived.js`, Arazo block, after the Wyrmscale check:
   - `ok(arazo.every((x) => !/GM Note|Заметка для Мастера/.test(x.ende + '\n' + x.rud)), "an
     Arazo's Artifacts record carries a GM note; they are removed on purpose (I18N.md,
     Rules)")`.
   - `ok(aaById.aa11.ru === 'Волшебное Зеркало' && !/Зерцал/.test(aaById.aa11.rud), 'aa11 is
     not «Волшебное Зеркало» throughout (I18N.md, Rules)')`.
7. (No route fixture: the existing fixtures under `docs/fixtures/urls/routes.json` must pass
   unchanged in `contracts` and the browser replay; a changed `picked` or `rows` is a stop.)
8. Tests:
   - `facets.test.ts`: `narrowRows` - no record and no pick gives no row; one value every record
     answers is dropped; one value some record lacks is kept; two values are kept; a value no
     record answers is dropped unless picked; a picked value no record answers keeps its row;
     `spellcast` answers six traits; burden `any` answers both; the candidates' order and labels
     are kept; at 100 and 300 own records (`homebrew_items_per_owner` and 3x) on `#/tables/homebrew`'s
     candidates the result is bounded by the vocabulary. The timing bound (under 100 ms at 300)
     goes in a new `app/src/lib/facets.timed.test.ts` (the `timed` vitest project), named in
     `COVERAGE.md`. The
     catalog: for each of the 18 tables, `narrowRows(facetRows(index, table, ...), rows,
     valueOf)` deep-equals `facetRows(index, table, ...)` (the rule removes nothing from a
     catalog table).
   - `homebrewCatalog.test.ts`: as gm1 the «Мастерская Ольхи» chip draws no filter strip;
     «Хоумбрю» offers «Тип» with «Предметы» and «Расходники» only; `f_sect-hb_sectbladesaaaaaa`
     on the Alder chip draws the «Холодное оружие» pill; the existing facet cases (the kind
     pick, the pill drop, «Сбросить все», the folded panel) move to the «Хоумбрю» chip. Axe in
     each state.
   - `homebrewCatalog.test.ts`, the kept pick: `f_src-hb_alderworkshopaaa.kind-item` as gm1
     draws the strip with «Тип» holding «Предметы» (kept by the pick) and «Снаряжение», the pill,
     «0 из 1», «Ничего не найдено» and «Сбросить всё»; a press on the pill draws the axe and no
     strip. `tables.test.ts`: `#/tables/eq_secondary/f_tier-A` draws as today (no pill, no
     rows, «Сбросить всё»).
   - `requestsPanel.test.ts`: one notice draws one «Скрыть» and no «Скрыть изменения»; it hides
     that notice and moves the focus as before; two notices draw both, as before. Axe in the
     one-notice state.
9. `tests/app/inventory.js`:
   - `GM2_LIST + ' ~ one notice as gm2'`: the first notice's «Скрыть» pressed; the panel
     «Новое в списке (1)» with one notice and its «Скрыть», no «Скрыть изменения».
   - `'#/tables/homebrew/f_src-hb ~ filters open as gm1'`: «Фильтры» pressed: «Тип» with
     «Предметы» and «Расходники».
   - `'#/tables/homebrew/f_src-hb_alderworkshopaaa.kind-item as gm1'`: the Alder chip with the
     pill «Предметы», «0 из 1», «Ничего не найдено», «Сбросить всё».
   Use the driver verbs the file already uses.
10. Goldens: `npm run build:test`; re-seed the new states and the states whose diff is the
    owner's change only: `#/tables/homebrew as gm1` (no strip on the Alder chip),
    `#/tables/homebrew/f_sect-hb_sectbladesaaaaaa as gm1` (the strip without «Тип»), and the
    Arazo text: `_tables_arazo` and every golden whose diff is only aa2, aa5, aa11, aa21 or
    aa50 lines (`namelen`/`namehash` of a capped row, the aa11 name). Compare every other state.
    A catalog table's facet line that changes is a stop: report it, the plan assumed none.
11. Specs and records (each its own acceptance line):
    - `FEATURES.md`, "Tables and search", the filter panel bullet: add, at most three lines,
      "A row offers only values the drawn rows answer and shows only when it can narrow; a
      picked value stays offered as a pill. On `#/tables/homebrew` the drawn rows are the chosen
      source's." (The decision file carries the rest.) In the `#/tables/homebrew` bullet, "Facets: `kind` and
      `sect` (...)" reads "of the shown source's items, by the offer rule above". If #71's text
      names the shared list page there, keep it and say the share link reads a picked value as
      its own paragraph says.
    - `FEATURES.md`, "The change log": "Each notice has «Скрыть» (...); from two notices
      «Скрыть изменения» after them hides the notices the panel holds".
    - `ROUTES.md`, "Filter grammar", after the values paragraph: "A filter panel offers only
      the values the drawn rows answer (`FEATURES.md`, "Tables and search"); the address is
      read as above: a picked value no drawn row answers still narrows a table to nothing, and
      draws its pill where the panel lists the value."
    - `I18N.md`, "Rules", a new bullet after "Vocabulary follows daggerheart.su", at
      most three lines: "**Arazo's Artifacts ship without the book's GM notes** (aa2, aa5, aa21,
      aa50), and aa11 is «Волшебное Зеркало» (owner, 2026-10-08); `tests/derived.js` fails on
      either restored." (The decision file carries the reasons and rejected names.)
    - `COVERAGE.md`: the homebrew row names the new states and the `narrowRows` cases; the lists
      row names the one-notice state.
    - New decision `docs/decisions/2026-10-08-a-filter-row-offers-only-values-the-drawn-rows-answer.md`
      (title: "A filter row offers only values the drawn rows answer, on every page"): Task
      `homebrew-followups` (owner, 2026-10-08); Decision: the offer rules 1-3 on every filter
      strip (`narrowRows`), a table keeps a picked value offered so its address reads as before,
      a share link keeps rule 4; Rejected: #71's rule 4 on the tables (the frozen table address
      would draw every row where it draws none), one-value rows kept (the owner: useless), the
      search page's kind chips under the rule (they pick the query's scope); Amends "A share
      link's filter lives in its address; its facets are the drawn entries" (2026-10-06): its
      offer rule is every page's. Write the "Amended by" pointer into that file.
    - New decision `docs/decisions/2026-10-08-arazos-artifacts-drop-the-gm-notes-aa11-is-volshebnoe-zerkalo.md`
      (title: "Arazo's Artifacts drop the book's GM notes; aa11 is «Волшебное Зеркало»"): Task
      `homebrew-followups` (owner, 2026-10-08; the name, planner); Decision: the four records
      and the name, where they are guarded; Rejected: the four names in "Items 4 and 5" with
      their reasons; Amends "Arazo's Artifacts: source arazo, ids aa1-aa51, tier formulas as
      lines" (2026-10-07): GM notes are not shipped either. Write the "Amended by" pointer.
    - `node tools/decisions.js`.

**Acceptance criteria.**

1. `narrowRows` keeps the candidates' order and labels, drops a value no record answers unless
   picked, and drops a row that cannot narrow unless it holds a pick (unit).
2. On every catalog table the offered rows equal `facetRows` (unit); every catalog golden's
   filter lines are unchanged (golden compare).
3. As gm1, the «Мастерская Ольхи» chip draws no strip, and «Хоумбрю» offers «Тип» with two
   values (component test; goldens).
4. A picked value no drawn row answers keeps its row and pill and empties the table, as before
   (component test; `~ kind-item as gm1` golden); every route fixture passes unchanged.
5. #71's `listFacetRows` is built on `narrowRows` and its tests pass unchanged.
6. One notice draws one «Скрыть» and no «Скрыть изменения»; two draw both (component test;
   `~ one notice as gm2` and `GM2_LIST as gm2` goldens).
7. aa2, aa5, aa21 and aa50 carry no GM note in `ende` or `rud`; aa11 reads «Волшебное Зеркало»
   in `ru` and `rud`; `data.json`, `catalog.csv` and the five ids' stubs match `data.js`
   (`tests/derived.js`, `dataint`).
8. `tests/derived.js` fails when a GM note or «Зерцал» comes back (run it once with a note put
   back in a scratch copy, then discard the copy).
9. Owner rule, item 2: written to `FEATURES.md`, "Tables and search" (context.md tag B1).
10. Owner rule, item 3: written to `FEATURES.md`, "The change log" (context.md tag B1).
11. Owner rule, items 4 and 5: written to `I18N.md`, "Rules" (context.md tag B1).
12. The two decision files, both "Amended by" pointers and `docs/DECISIONS.md` agree
    (`tests/derived.js`' registry check).
13. Every state in the States table below has its proof; axe passes in each new state; RU and
    EN goldens.

**States (scale check).**

| State | Shows | Proof |
|---|---|---|
| a table with no own item (catalog) | the rows as today | unit 2; catalog goldens unchanged |
| `#/tables/homebrew`, one source, one item | no strip (one kind, its one section) | unit; `#/tables/homebrew as gm1` re-seeded (Alder chip) |
| one source chip with two kinds | «Тип» with those two | `~ filters open as gm1` |
| a source with one section and unsectioned items | «Раздел» with one value, kept: it narrows | unit |
| many, at the limit (100 own items, `homebrew_items_per_owner`) and 3x (300) | rows bounded by the vocabulary (3 kinds, 30 sections per source); the strip as today | unit at 100 and 300 |
| a picked value no drawn row answers | its row and pill, «0 из N», «Ничего не найдено», «Сбросить всё» (as today) | component test; `f_src-hb_alderworkshopaaa.kind-item as gm1` |
| longest section name (80 code points) | its chip and pill wrap as today | unchanged (`#/tables/homebrew` gm1 states) |
| notices: 0 | no notice block | unchanged |
| notices: 1 | the notice and its «Скрыть» only | `~ one notice as gm2` |
| notices: 2-3 | each «Скрыть», then «Скрыть изменения» | `GM2_LIST as gm2` unchanged |
| notices: 4+ (up to 100, 300 at 3x `entries_per_list`) | three, «и ещё N изменений», «Скрыть изменения» | unchanged (`requestsPanel.test.ts`) |
| notice with a 120-code-point name | wraps as today | `GM2_LIST as gm2` |
| the five Arazo records | shorter texts; aa11's new name | `_tables_arazo` and the re-seeded tables and search goldens |
| every row at 360 px and 1180 px | no sideways scroll | `node tests/app/sweep.js 360`, `1180` |

At many and at the limit: the row order is unchanged, the primary action (the table toolbar,
the panel's first notice) does not move; the filter panel is in the page flow and folds with one
press; no sticky region changes.

**Error scenarios.**

| Scenario | Screen | Stored data |
|---|---|---|
| Loading (own items) | «Загружаем...» as today; the strip waits for the rows | none written |
| Failed read | «Не получилось загрузить ваши предметы.» and «Повторить» | none |
| Failed write | the filter writes only the address; a failed notice hide toasts as today | notices kept |
| Offline | the last read draws; the offer rule runs on it | none |
| Conflict (another device edits an own item) | the re-read redraws; the rows recompute; a picked value stays as a pill | none |
| A named record deleted | it leaves the rows and the offered values | none |
| Stale tab (previous bundle) | the previous offer (every candidate value); the same address reads the same | none |
| Revert (previous frontend) | as a stale tab; `data.js` is data, a revert of it restores the notes | none |

No path loses stored data: B1 writes no stored shape.

**Consistency.**

- Follows rule 12 (folds: the notices' fold unchanged) and rule 11 (one close control per
  panel action). The decided requests' block has one «Скрыть» for its fold; one notice now has
  one too.
- Siblings: the tables and the share page share the offer rules 1-3 and `narrowRows`; one named
  difference, rule 4 (a table draws the pill of a picked value no row answers; a share link
  ignores it), recorded in the decision and in `ROUTES.md`. Search keeps its kind chips (a
  scope, not a facet), named in the decision.
- No new toast, confirm, counter or verb.

**RU/EN parity.** No new dictionary string. Data: aa11 `ru` changes, `en` stays; the four
records lose the note in both languages, so both still state the same facts.

**Verification commands.**

```text
node tools/build.js
node tests/run-all.js contracts,dataint
rtk npm run check:fast                      (Bash timeout 600000)
rtk npm run check:1                         (Bash timeout 600000)
rtk npm run check:2                         (Bash timeout 600000)
npm run check:built
npm run build:test
node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub
MSYS_NO_PATHCONV=1 node tests/app/golden.js --only="<state>"   (re-seed, per state, flags as golden.js documents)
node tests/app/golden.js --shard=1/4   ... --shard=4/4           (compare, one call each)
node tests/app/sweep.js 360
node tests/app/sweep.js 1180
```

**Risks and do-nots.**

- Do not change how an address is read: `passes` still reads `facetState`, not the offered rows.
- Do not change the search page's kind chips or the roll panels.
- Do not hand-edit `data.json`, `catalog.csv` or `i/*.html`; do not renumber an id; do not edit
  aa21's rungs (they carry no note).
- `facRows` must read `shownRows`, not `rows`: on `homebrew` the chip's rows are the point.
- Keep #71's share-page rule 4 (`inForce`) as #71 wrote it.
- TASK 70 and #71 edit `RequestsPanel.svelte`'s neighbours and `inventory.js`: rebase, keep
  their states.

### B2 - Official items in an own set or rule card (implement-ready)

**Objective.** A set card or a rule card on «Мои предметы» takes official catalog items beside
own items. The account sees its own set bonus and rule cards on those official items wherever
its index draws them, and the homebrew file carries the official members as `homebrew-v2`.

**In scope.** Option A as decided above and drawn in `mocks/index.html`. **Out of scope.**
Option B (a share link's projection, `get_shared_list`); `#/h/<uuid>`; the lists file; the
editor's «Связи» fold (an own item still names its set and rule cards there); a server check of
the three-rule-card cap across rows.

**Mock.** `issues/homebrew-followups/mocks/index.html`: the Sets tab at 1180 px (RU, the picker
open with official and own options) and 360 px (EN), and `#/i/q1` with the own set line and
bonus. NEW parts are outlined. Its notes list is part of the constraints below.

**Files.**

- `supabase/migrations/<YYYYMMDDHHMMSS>_homebrew_card_items.sql` (a time after every migration
  on `main`) and `supabase/reversals/<same name>.sql`.
- `app/src/lib/homebrew.ts`, `homebrew.test.ts`; `docs/fixtures/homebrew/cards.json`.
- `app/src/lib/data.ts`, `data.test.ts`; `app/src/lib/label.ts`, `label.test.ts`.
- `app/src/lib/homebrewForm.ts`, `homebrewForm.test.ts`; `app/src/lib/share.ts`, `share.test.ts`.
- `app/src/lib/homebrewFile.ts`, `homebrewFile.test.ts`; `schema/homebrew-v2.json` (new);
  `docs/fixtures/homebrew-file/` (`example-v2.json` new, `errors-v2.json` new,
  `wrong-version.json` to version 3, `README.md`); `llms.txt`; `tests/contracts.js`;
  `tools/check-site.lib.mjs`, `tools/check-site.test.mjs`; `.github/workflows/ci.yml` (the
  deploy step's schema list).
- `app/src/lib/dict.ts` (two new strings, two changed).
- `app/src/state/app.svelte.ts`; `app/src/components/HomebrewEditor.svelte` (the preview index).
- `app/src/components/HomebrewCards.svelte`, `homebrewPage.test.ts`; `CardForm.svelte` (the
  hint count); `RecordCard.svelte`, `record.test.ts`; `PrintPage.svelte`, `printPage.test.ts`;
  `HomebrewImport.svelte` (the card note, the hint's second schema link),
  `homebrewImport.test.ts`; `sharedListPage.test.ts`; `app/src/lib/homebrew.timed.test.ts`
  (new), `homebrewPage.timed.test.ts`; `docs/specs/META.md`.
- `app/src/ports/cloud.contract.ts` (and the fake and Supabase ports only if a test shows a gap;
  both pass card content through and the fake validates with `cardProblems`).
- `tests/db/homebrew-cards.test.mjs`; `tests/e2e/` (one flow).
- `tests/app/inventory.js`, `tests/app/snapshots/`.
- `docs/specs/FEATURES.md`, `CONTRACTS.md`, `COVERAGE.md`; a decision file and the "Amended by"
  pointers; `docs/DECISIONS.md`.

**Steps.**

1. Migration. `create or replace function public.homebrew_card_valid(p_kind text, p jsonb)`:
   the body of `20261001130000_homebrew_relations.sql` with `'items'` added to both key arrays,
   and before `return true`:

   ```sql
   if not public.homebrew_ids_ok(p, 'items', 100) then
     return false;
   end if;
   if exists (select 1 from jsonb_array_elements_text(coalesce(p -> 'items', '[]'::jsonb)) as t(id)
              where public.homebrew_key_ok(t.id)) then
     return false;
   end if;
   ```

   `create or replace function public.homebrew_cards_touch()`: the body of
   `20261007130000_homebrew_links.sql` with, first in the `begin` block,

   ```sql
   -- A change of the official members alone changes no linked item's record.
   if tg_op = 'UPDATE' and (old.content - 'items') = (new.content - 'items')
      and old.book_id is not distinct from new.book_id then
     return null;
   end if;
   ```

   Keep `security definer`, `set search_path` and the grants (`create or replace` keeps them;
   repeat the `revoke` lines as the earlier migrations do). The header comment cites this
   plan's decision file and `FEATURES.md`, "Homebrew", "Cards". The reversal first runs
   `update public.homebrew_cards set content = content - 'items' where content ? 'items';`,
   then restores both previous bodies verbatim: `homebrew_card_valid` from
   `20261001130000_homebrew_relations.sql` and `homebrew_cards_touch` from
   `20261007130000_homebrew_links.sql`.
2. `lib/homebrew.ts`:
   - `CardContent.items?: string[]` (doc: catalog record ids, 1-100, never an `hb_` key);
     `export const CARD_ITEMS_MAX = 100;` `SET_KEYS` and `REF_KEYS` gain `'items'`.
   - `cardProblems`: `idsProblems(v, 'items', CARD_ITEMS_MAX, undefined, out)`, then each
     element that matches `HOMEBREW_KEY` is `{ path: 'items.<i>', rule: 'pattern' }`. Order:
     after `url`, before the unknown keys; update the doc comment.
   - `cardsValid` (a snapshot's embedded cards): refuse a card that holds `items` (the
     `import-v2` schema closes those objects).
   - Extract `setCardOf(card: CardRef): SetCard` and `refCardOf(card: CardRef): RefCard` from
     `recordOf` (the filled shapes it writes today); `recordOf` calls them.
   - `withRecords(base, own, linked, cards: readonly CardRef[] = [])`: return `base` only when
     all three are empty. After today's `refs`/`sets` merge, add each own card
     (`sets[c.key] ??= setCardOf(c)` / `refs[c.key] ??= refCardOf(c)`). Build
     `ownSetOf: Map<string, string>` and `ownRefsOf: Map<string, string[]>` over `cards` sorted
     by key: for each id of `c.items ?? []` whose `byId` record is not homebrew: a set card
     sets `ownSetOf` once per id, and only when the record has no `set`; a rule card appends
     its key to `ownRefsOf` (no repeat). When `ownSetOf` is not empty, the result's
     `setMembers` is a copy of (the relations' or `base`'s) with each such record pushed under
     its own key. Return both maps in the index.
   - `cardMembers(items, kind, key)` and `cardUses(items, kind, key)` stay (own rows); add
     `cardItemIds(c: CardRow): string[]` returning `c.content.items ?? []`. The three callers
     that count a card's members (the head count, `CardForm`'s hint, the delete confirm in
     `HomebrewCards.svelte`) add `cardItemIds(c).length`.
3. `lib/data.ts`: the `Index` interface gains `ownSetOf: ReadonlyMap<string, string>` and
   `ownRefsOf: ReadonlyMap<string, readonly string[]>` (docs: the account's own card that names
   a catalog record, by record id); `buildIndex` sets empty maps. Add
   `export function setKeyOf(index: Index, it: Record_): string | undefined` (`it.set ??
   index.ownSetOf.get(it.id)`) and `export function refsOf(index: Index, it: Record_): string[]`
   (the record's `refs`, then `ownRefsOf`'s, each once). `setOf` and `setBonusOf` read the key
   through `setKeyOf`. `relate` is unchanged.
4. `lib/label.ts`: `foldOwn(list, keep, self?, folds: (r: Record_) => boolean =
   isHomebrewRecord)` and `relText(..., folds?)` pass it on; with `() => true` every member
   past `keep` folds.
5. `RecordCard.svelte`: `const setKey = $derived(setKeyOf(index, it))`; the set fold passes
   `() => true` when `setKey` is an own key; the bonus links to `homebrewTabHash('sets',
   setKey)` when `isHomebrewKey(setKey) && (manage || index.ownSetOf.get(it.id) === setKey)`;
   `refs` reads `refsOf(index, it)`; the rule card's «Открыть в «Мои предметы»» shows when
   `isHomebrewKey(key) && (manage || index.ownRefsOf.get(it.id)?.includes(key))`.
   `PrintPage.svelte`'s `setLine` and `lib/share.ts` (the refs loop over `refsOf`, the set head
   through `relText` with the same fold) follow.
6. `state/app.svelte.ts`, `index`: `const cards = this.homebrew?.cardRefs ?? [];` and
   `withRecords(this.catalog, own, [], cards)` when `own.length || cards.length`.
   `HomebrewEditor.svelte`'s preview passes `store.cardRefs`.
7. `lib/homebrewForm.ts`, `cardContentOf`: copy `base.items` when present (a new array).
8. `HomebrewCards.svelte` (the mock is the reference):
   - `pendingCards = new SvelteSet<string>()` (card ids with a write in flight).
   - `membersOf(c)`: the own records as now, plus each id of `c.content.items`: the catalog
     record (`app.catalog?.byId`), or `{ id, name: t.hbGoneItem }` for an id the catalog lacks;
     one list sorted by name in the page language.
   - A member row: the link (`recordHref`), then for an official record `<span
     class="src">{srcLabel(m, lang)}</span>` (style of `.count`), then «Убрать»
     (`label={t.hbRemove...}`), disabled while the item or the card is pending.
   - The head count and `CardForm`'s `hint` count both kinds; `remove()`'s confirm counts both.
   - `find(q)`: nothing while `pendingCards.has(c.id)`; else `rankHits` over
     `app.index?.searchable` (as `HomebrewRelations.svelte`'s `findItems`, with `parseQuery`,
     `statLineFor`, `hayFor`), leaving out the members, the pending own items and, on the Sets
     tab, an official record with a `set`; options through `recordOption`.
   - `add(c, key)`: an `hb_` key as today. Else (official): a set card refuses at
     `CARD_ITEMS_MAX` with `hbCardItemsFull`; a rule card refuses at `CARD_ITEMS_MAX` and when
     `refsOf(index, record).length >= REFS_MAX` (`hbRefsFull`). A set card whose record is in
     another own set (`index.ownSetOf.get(id)`) asks `hbMemberMoves` with that card's name; a
     yes writes the old card without the id, and on success this card with it.
   - `writeCard(cardId, content, itemName)`: read the row from `store.cards` at the press; add
     `cardId` to `pendingCards`; `store.updateCard(row, { content, book_id: row.book_id },
     row.revision)`; ok: `hbSaved` with the item's name; conflict: `hbCardChanged`; gone:
     `hbCardGone`; limit: `limitText`; else `hbWriteFailed`; remove the id in `finally`.
     Returns whether it saved.
   - `drop` of an official id writes the card without it (`items` deleted when empty).
   - Update the header comment (official members, the `items` field, FEATURES.md "Cards").
9. `HomebrewImport.svelte`'s hint: after the `homebrew-v1` link, ` / ` and a second link to
   `schema/homebrew-v2.json` named by a new `hbImportSchemaV2` «homebrew-v2» / "homebrew-v2"
   (`target="_blank" rel="noopener"` as the first); `homebrewImport.test.ts` checks both hrefs.
   `dict.ts`, both dictionaries: new `hbCardItemsFull` «В карте уже 100 предметов из книг - это
   предел.» / "The card already holds 100 book items - that is the limit."; `hbImportVersion`
   «Файл предметов версии %s: сайт читает версии 1 и 2.» / "An items file of version %s: the
   site reads versions 1 and 2."; `hbImportNoVersion` «В файле нет поля version. Сайт читает
   версии 1 и 2.» / "The file has no version field. The site reads versions 1 and 2."
10. Homebrew file:
    - `homebrewFile.ts`: `HOMEBREW_VERSIONS = [1, 2] as const`; `HOMEBREW_SCHEMA_V2` beside
      `HOMEBREW_SCHEMA`; `HomebrewFile.version: 1 | 2`; `CARD_KEYS` gains `'items'` last. The
      parse accepts both versions; in version 1 a card's `items` is `{ cards.<i>.items, extra }`;
      in version 2 each `items` id the catalog lacks (`ctx.catalogHas`) is a note
      `{ kind: 'relation', array: 'cards', index, field: 'items', id }` (the `FileNote`
      relation variant gains `array?: 'cards'` and the field `'items'`; `HomebrewImport.svelte`
      places it with `placeOf(n.array ?? 'items', ...)`). `toHomebrewFile` writes version 2 and
      `HOMEBREW_SCHEMA_V2` when a written card holds `items`, else version 1 byte for byte.
    - `toHomebrewRows`: for a version 1 file, each file card whose key names a held card of
      the same kind (`held.cards`, the store's rows at the press) carries that held card's
      `items` (a new array) when the held card has them; a version 2 file states its cards'
      `items` and the file wins, so a v2 card without `items` drops them on «Обновить». The
      database stays version-blind: `import_homebrew` writes the row's `content` as sent.
    - `schema/homebrew-v2.json`: `homebrew-v1.json` with `$id` `.../schema/homebrew-v2.json`,
      `version` const 2, the description naming what v2 adds, and `$defs.card.properties.items`:
      an array of 1-100 unique strings, pattern `^(?!hb_[a-z2-7]{16}$)[A-Za-z0-9_-]{1,64}$`,
      described "Catalog record ids from data.json that this card also holds: a set card's
      members, or the records a rule card applies to. An own item names the card in its own set
      or refs." Every other definition equal to v1's (a drift test).
    - Fixtures: `example-v2.json` (gm1's Alder set with `items: ["q1"]` and the axe naming it),
      `errors-v2.json` (an `hb_` key in `items`, 101 ids, a repeated id), `wrong-version.json`
      to `"version": 3` with its README row's text; `README.md` rows for the new files.
    - `llms.txt`: a subsection "### Version 2: book items in a card (homebrew-v2)" after "A
      complete homebrew file": when to write version 2, the `items` field, the schema URL and a
      short `json` example; the section's other sentences stay.
    - `tests/contracts.js`: the v2 schema's `$id`, version, closed objects, the `items` bounds
      and pattern, `example-v2.json` valid, the llms.txt subsection present.
    - `tools/check-site.lib.mjs` and its test: `schema/homebrew-v2.json` with its `$id`;
      `.github/workflows/ci.yml`'s schema list gains it.
11. Tests (writer tiers, each its own acceptance line):
    - Shared fixture `docs/fixtures/homebrew/cards.json`: valid - a set card and a rule card
      with `items: ["q1", "ci1"]`, 100 ids; invalid - `items: []`, 101 ids, a repeated id, an
      `hb_` key, a non-string, a 65-character id. `homebrew.test.ts` and
      `tests/db/homebrew-cards.test.mjs` both walk it (the existing parity pattern).
    - `homebrew.test.ts`: `withRecords` with cards (`ownSetOf`, `ownRefsOf`, a book-set record
      left out, the lower key wins, a missing id ignored, `setMembers` holding the official
      record); `cardsValid` refusing `items`.
    - `data.test.ts`: `setKeyOf`, `refsOf`, `setOf`/`setBonusOf` of an official member with two
      members, and alone in its set (no set line, no bonus, as an own item alone); `label.test.ts`: `foldOwn` with `folds`.
    - `homebrewForm.test.ts`: `cardContentOf` keeps `items`.
    - `homebrewFile.test.ts`: v1 export byte-identical with no `items`; v2 export and read
      back; a v1 file with `items` refused; the note for an unknown id; the drift guard for
      both schemas; `wrong-version.json` version 3.
    - `homebrewImport.test.ts`: «Обновить» with a v1 file naming a held card that holds
      `items` keeps them; with a v2 file whose card lacks `items` drops them; with a v2 file
      that states other ids writes those; an import that skips held cards writes no card.
    - `cloud.contract.ts` (runs on the fake and on Supabase): a card written with `items`
      reads back; an `hb_` member refused as `invalid`.
    - `tests/db/homebrew-cards.test.mjs`: the shared fixture through the constraint; a
      members-only update of a card that a linked item of gm1 names writes no `list_notices`
      row and leaves gm2's list `revision`; a text update still writes both; an update of
      `items` and the text together still writes both; a `book_id`-only update still writes
      both; an update that changes nothing writes neither (a change from today, stated in the
      decision file); `import_homebrew` with `items`; an `import_homebrew` update replaces a
      held card's `content`, `items` included (a row without `items` drops them); the
      reversal walk strips `items`.
    - Timing bounds live in `*.timed.test.ts` files (`.claude/README.md`, the `timed` vitest
      project), helpers in `app/src/test/`: `homebrew.timed.test.ts` (new) - `withRecords` at
      300 cards of 100 ids each under 50 ms; `homebrewPage.timed.test.ts` - its "a set of 300
      members" case extended with 100 official members. Add both to `COVERAGE.md`.
    - `homebrewPage.test.ts`: the picker offers official and own records, not members, not a
      book-set record on the Sets tab; an official add and «Убрать» write the card and toast;
      the move between two own sets asks and writes both; the 101st refused; the fourth rule
      card refused; a conflict and a gone card; the picker empty while a write is in flight;
      the counts and the delete confirm; axe.
    - `record.test.ts`: `#/i/q1` with an own set (line, bonus, link to the tab), with an own rule
      card after the book's (link to the tab); a share-page index without the account's cards
      draws neither; the fold past three, catalog members in catalog order.
      `sharedListPage.test.ts`: gm1 on its own `#/s/player-token-1`, whose «Палаш» (q1) row is
      in gm1's Alder set through `items`, draws the set bonus in the row's dialog; signed out the
      same link draws none. `printPage.test.ts`, `share.test.ts`: the set line.
    - e2e (after the review's approve and `db:push`): gm1 adds an official item to a set on the
      test project; the card reads back with `items`.
12. `tests/app/inventory.js` (as gm1, driven from the seed; no seed change):
    - `#/homebrew/sets/hb_aldersetaaaaaaaa ~ official member as gm1`: «Палаш» picked from «меч»
      typed into «Добавить предмет»: the member row «Палаш» with «Core» and «Убрать», the head
      «1 предмет», the toast «Сохранено: «Палаш»».
    - `... ~ official picker open as gm1`: «меч» typed: official and own options with their
      meta and «Ещё N - уточните запрос».
    - `#/i/q1 ~ own set as gm1`: after «Палаш» and «Топор Тлеющих Углей» joined the Alder set
      (`d.go` to `#/i/q1`): the set line and the bonus linked to the tab.
    Re-seed `#/homebrew/rules/hb_alderrulecardaaa ~ item added as gm1` if its picker list now
    shows official matches (expected: the typed query matches catalog names). Compare the rest.
13. Specs and records (each its own acceptance line):
    - `FEATURES.md`, "Homebrew", "Cards": the field «Добавить предмет» offers own and book items
      (not a book-set item on the Sets tab), members list both by name with the book's name
      after a book item, the 100-item refusal, the three-rule-card refusal, the move confirm,
      the counts; an official member alone in its set draws no set line and no bonus, as an own
      item alone; the owner rule (Q1 = A): "Only the account that owns the card sees it on a
      book item, on every page it opens, its own share links included; other readers of a share
      link, `#/h/` and another account see the book's item."
    - `FEATURES.md`, "Records", "Own relations on a card": an official record draws the
      account's own set and rule cards; under an own set the fold counts every member past the
      third, catalog records included, and the catalog members draw in catalog order
      (`relOrder`), then the own ones by name.
    - `FEATURES.md`, "Homebrew", "Import": the field takes a `homebrew-v1` or `homebrew-v2`
      file; its hint links `schema/homebrew-v1.json` and `schema/homebrew-v2.json`; «Обновить»
      with a version 1 file keeps a held card's book items, a version 2 file states them.
      `FEATURES.md`, "Account and browser lists", "Exports": the data zip's `homebrew.json` is
      `homebrew-v1`, or `homebrew-v2` when a card holds book items.
    - `META.md` section 3: `get_homebrew_item`'s `updated_at` gains a third known limit: a
      change of a card's book items alone moves the time of every item that names the card.
    - `CONTRACTS.md` section 4: a `homebrew-v2.json` bullet (v1 plus a card's `items`, written
      only when a card holds them; frozen as v1 is), the data zip's `homebrew.json` "homebrew-v1,
      or homebrew-v2 when a card holds book items"; section 5 lists `schema/homebrew-v2.json`.
    - `COVERAGE.md`: the homebrew row names the new cases, states and the db test.
    - Decision `docs/decisions/2026-10-08-an-own-card-holds-book-items-the-owner-sees-them.md`
      (title "An own set or rule card holds book items; only its account sees them"): Task
      `homebrew-followups` (owner, 2026-10-08, Q1 = A); Decision: `content.items` (catalog ids,
      1-100), the account's index applies them, `homebrew-v2`, the touch trigger skips a
      members-only edit; Rejected: B (the share projection; may follow with no data change), C
      (an own copy: two items of one name, lists keep the plain item), a member table (a new
      table, policies and export for a list the card can hold), the members on the item (an
      official record is never written); Accepted trade-off: players on a share link do not see
      the bonus; a frontend revert drops `items` on the next card text edit, and the down
      migration strips them; `get_homebrew_item`'s `updated_at` moves on a members-only edit;
      a v1 file cannot remove book items (its «Обновить» keeps them); a v1 «Обновить» in one
      tab can drop a book item another tab added meanwhile; a card update that changes nothing
      no longer bumps the lists or writes a notice.
      Amends "A homebrew item carries the whole catalog shape; sources and cards are rows"
      (2026-09-30) with the pointer written back.
    - `node tools/decisions.js`.

**Acceptance criteria.**

1. The database accepts a card with 1-100 unique catalog ids in `items` and refuses an empty
   list, 101 ids, a repeat and an `hb_` key, for both kinds; the client validator agrees over
   the shared fixture.
2. A members-only card update writes no notice and bumps no list; any other card update still
   does (db test).
3. The reversal strips `items` and restores both functions; the reversibility walk passes.
4. On the Sets and Rules tabs, an official item is added and removed as the mock shows, with
   the toasts and refusals named in step 8; a book-set item is not offered for a set.
5. The account's record page, dialog, print card and copied text of an official member show the
   own set (with its fold) and rule cards; a share page and `#/h/` show none from another
   account.
6. A card text edit keeps `items` (unit and component test).
7. The export writes `homebrew-v1` byte for byte when no card holds `items`, `homebrew-v2`
   otherwise; both read back; a v1 file with `items` is refused; version 3 is refused with the
   new text.
8. `schema/homebrew-v2.json`, its fixtures, `llms.txt`, `CONTRACTS.md` and the deploy checks
   agree (`tests/contracts.js`, `check-site`).
9. Owner rule Q1 = A written to `FEATURES.md`, "Homebrew", "Cards" (context.md tag B2).
10. The decision file, its "Amended by" pointer and `docs/DECISIONS.md` agree.
11. Every row of the States and Error scenarios tables below has its proof; axe in each new
    state; RU and EN goldens.
12. After the review's approve: `db:push --project test` and `npm run e2e` pass.

**States (scale check).**

| State | Shows | Proof |
|---|---|---|
| a card with no member | «0 предметов»; the picker | unchanged (`#/homebrew/sets as gm1`) |
| one official member | its row with the book name and «Убрать» | `~ official member as gm1` |
| many: own and official mixed | one list by name | `homebrewPage.test.ts` |
| official at the limit, 100 | 100 rows; the 101st add refused with `hbCardItemsFull`, nothing written | component test; db test (101 refused) |
| own cards at the limit, 100, and 3x, 300 (`homebrew_cards_per_owner`) | each card's fold as today; the index maps bounded by 300 x 100 ids | `homebrew.timed.test.ts` (`withRecords` at 300 cards of 100 ids under 50 ms) |
| the largest open card fold: 100 official plus 100 own members (300 own at 3x) | one list by name in the page flow; the fold folds with one press | `homebrewPage.timed.test.ts` (the 300-member set plus 100 official) |
| an own set of 100 official members on the record page | three names, «и ещё 97», «свернуть» open | `record.test.ts` |
| an official item with 3 rule cards | the fourth refused with `hbRefsFull` | component test |
| the picker | 8 options, «Ещё N - уточните запрос» | `~ official picker open as gm1` |
| longest names (an 80-code-point card, a 120-code-point own item, the longest catalog name) | rows wrap; no sideways scroll | sweep 360 and 1180 |
| `#/i/q1` with the own set | set line and bonus linked to the tab | `#/i/q1 ~ own set as gm1` |
| 360 px and 1180 px | as the mock | `node tests/app/sweep.js 360`, `1180` |

At many and at the limit: the member order is by name; the primary action (the tab's create
button) stays first under the tab row; the open fold is in the page flow and folds with one
press; the picker's list is at most `min(320px, 50vh)` tall at 360 px with the keyboard open
(`ItemPicker.svelte`), inside the window; no sticky region changes.

**Error scenarios.**

| Scenario | Screen | Stored data |
|---|---|---|
| Loading | «Загружаем...» as today; no official member before the read | none |
| Failed read | «Не получилось загрузить ваши предметы.» and «Повторить» | none |
| Failed write | `hbWriteFailed`; the row as before the press | the card unchanged; the next press writes from the store's row |
| Offline | `hbWriteFailed` on a press | unchanged |
| Conflict (another tab or device wrote the card) | `hbCardChanged`; the store reads again | the other write kept; the retry writes from the row read again |
| The card was deleted elsewhere | `hbCardGone`; the fold goes on the read | nothing written |
| The move: the first write ok, the second failed | the second's toast; the item in no own set | the old card without it; a retry adds it |
| A named catalog id no longer in `data.js` | «Предмета больше нет» with «Убрать» | kept until removed |
| Stale tab (previous bundle) | shows no official member; its card text edit drops `items`; its export or data zip writes `homebrew-v1` with no `items` (its `ordered()` drops the key) | lost on that edit (accepted, decision file); the file lacks them, the account keeps them |
| «Обновить» with a version 1 file naming a held card | the import as today | the card takes the file's texts and keeps its book items (copied from the store's row at the press) |
| «Обновить» with a version 2 file | the import as today | the file wins: its `items`, or none when its card has none |
| Two tabs: tab B adds a book item to a card between tab A's press and tab A's v1 «Обновить» call | tab A's import toasts as today | tab B's add is lost (tab A sends the list it held); accepted, named in the decision file; recovery: add it again |
| Revert of the frontend only | as a stale tab | `items` dropped on the next card text edit from it (accepted) |
| Down migration | cards lose `items` | stripped by the reversal (accepted, decision file) |
| A v2 file into a previous bundle | refused «версии 2» | nothing written |

Possible loss of stored data on a revert: the plan review trigger, stated in Status.

**Consistency.**

- Rule 5 (toasts): «Сохранено: «%s»» as today's member writes. Rule 2 (failures): the shared
  texts. Rule 1 (counters): the head count counts members of both kinds; the tab counter is
  unchanged. Rule 3 (delete confirms) unchanged, with the count of both. Rule 12 (folds): the
  record page's set fold as today, now over every member of an own set. Rule 13 (capped text)
  not touched. New refusal text follows the Sources tab's «... - это предел.».
- Siblings: the editor's «Связи» pickers rank with `rankHits` and show `recordOption` meta;
  this picker now does the same. The member row tags only book items, as the record page tags
  an own item with its source and not a book item; named here as the difference.

**RU/EN parity.** Two new strings (`hbCardItemsFull`, `hbImportSchemaV2`) and two changed
(`hbImportVersion`, `hbImportNoVersion`), each in both languages with the same facts and ASCII
` - `; no plural.
The llms.txt subsection is English as the file is.

**Verification commands.**

```text
rtk npm run check:fast                      (Bash timeout 600000)
rtk npm run check:1                         (Bash timeout 600000)
rtk npm run check:2                         (Bash timeout 600000)
npm run check:db                            (PowerShell tool, timeout 600000)
npm run check:built
node tests/run-all.js contracts,dataint
npm run build:test
node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub
MSYS_NO_PATHCONV=1 node tests/app/golden.js --only="<state>"   (re-seed, per state)
node tests/app/golden.js --shard=1/4   ... --shard=4/4           (compare, one call each)
node tests/app/sweep.js 360
node tests/app/sweep.js 1180
after the batch review's approve: npm run db:push -- --project test   then   npm run e2e
```

**Risks and do-nots.**

- Do not write `items` to an item, and do not accept an `hb_` key in it.
- Do not change `get_shared_list`, `homebrew_item_record` or `homebrew_snapshot_of` (option B
  is deferred).
- Do not let a share page or `#/h/` read another account's cards: only `app.index` carries the
  account's maps.
- `homebrew-v1` exports stay byte-identical when no card holds `items` (`export.json` pins it).
- Push the migration to the test project only after the approving review (rule 2r).

## Deferred

- Option B of Q1: a share link carries the GM's card on an official entry (owner chose A on
  2026-10-08; B can follow with no data change).
- The search page's kind chips stay static (a scope control); not a defect.
