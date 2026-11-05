# Plan - TASK pistolheart

Facts, inputs and owner decisions: `context.md`. Procedure: `.claude/prompts/add-source.prompt.md`.
Status: planned and implement-ready. Reviewed 2026-11-05 against `main` at `b6f153a5`.

## Start gate

Start batch B1 only when task 57 is closed: `issues/57/` is deleted and its closeout squash is on
`main`. Task 57 rewrites `TablesPage`, the filters, the tags, `RecordCard`, `dict.ts` and `help.ts`,
and re-seeds most goldens. This source edits the same files.

At the start, in `.claude/worktrees/pistolheart`:

1. Merge `main` into `claude/pistolheart` (`git merge main`; the branch holds only
   `issues/pistolheart/`, so the merge has no conflict).
2. Run `git grep -l -E "\bmwt\b" -- app tools preview tests docs llms.txt README.md` and
   `git grep -n realm -- app/src`. The touchpoint list below comes from `b6f153a5`; this
   command is the current list.
3. Read `docs/DECISIONS.md` for any decision of task 57 about tags, filter chips and source
   labels, and follow it.

## Design (decided)

The model copies Arazo's Artifacts (one pool, roll in book order, lines) and Many Worlds Tavern
(a record field that names the card set).

| Point | Decision |
|---|---|
| Source, table, section | `src: 'ph'`, table `ph`, section `roll/ph`. Name "Pistolheart" (`docs/decisions/2026-10-21-source-names-follow-the-source-product.md`). |
| Ids and roll | `ph1`-`ph93`, `roll` equals the id number. Book order: Vol 1 weapons, Vol 2 primary, secondary, items, consumables, Vol 3 armor, consumables, saddles, Infusions. A line's rungs follow its head. |
| Roll mode | One pool of 93, a random pick, no die and no picker (as `roll/arazo`). The mwt realm picker is not used. |
| Volume | New optional `Record_.vol: 1 \| 2 \| 3`, required on `ph` and absent elsewhere (as `realm` and `mwt` in `tests/dataint.js`). A small module `volumes.ts` (order, "Pistolheart Vol. 1" and its Russian name) mirrors `realms.ts`. The tables page sections `ph` by `vol` the way it sections `mwt` by `realm`; the source label and the record path say the volume. |
| Fallback | If mirroring `realm` costs more than about 10 files after the 57 merge, ship a flat `ph` table. The label and path still say the volume. Record the choice in the decision file. |
| Equipment | 64 weapon records in 16 four-rung lines (`eq.line` is the head id, tiers 1-4 from the book), 4 armor records. Printed stats stay as printed (`docs/decisions/2026-10-18-many-worlds-tavern-equipment-keeps-its-printed-stats.md`). The records live in `items.ph` with an `eq` block and appear in the equipment tables: `tableOf` returns `ph` before the equipment check, and the equipment source facet gains `ph`. |
| Items | 29 records (3 items, 11 consumables, 6 saddles, 9 Infusions) have no `eq`: `kind` is `item` or `consumable`. Saddles and Infusions are items. |
| Text | Weapon and armor features are labelled `***Name:***`. Items, consumables, saddles and Infusions carry the book text only. Verbatim English is in `records-draft.json`. |
| Russian | Translate every record and reference with `daggerheart-ru-terms`. Rung words as Core: `Улучшенный`, `Продвинутый`, `Легендарный`. |
| References | Four catalog refs (`context.md`). A `RefCard` needs `url`, and `RecordCard.svelte` links every catalog ref to daggerheart.su. Add a third branch: a catalog ref whose `url` host is not `ru.daggerheart.su` draws the host as its link text and keeps the address as written (the branch for an own rule card already does this). `ensub` reads "Pistolheart Vol. 1 - p. 7 - rules" and its Russian form. Add a component test and an axe check. |
| Links | The three DriveThruRPG pages go to the help box, both README source tables, `llms.txt` and the `url` of each ref. Check that `help.ts` can show three links; if it cannot, print one link line per volume. |
| Art | 45 pictures: a line shares its head's picture (`img` of rungs 2-4 is the head's file), so no `img/` file of its own. Drop the 45 PNGs in a scratch directory with no other file, run `node tools/artwork/run.mjs plan --uploads <dir>`, then `ingest`. Declare `img` in `data.js` first. |
| Counts | `tests/dataint.js` pins the total at 1459: it becomes 1552. Update `COUNT_BEARING_FILES` files. Fixture rows in `routes.json`: compute by script. |

## Touchpoints

From the Many Worlds Tavern commit (`5d62bf06`) and `git grep mwt` at `b6f153a5`. Re-grep after the 57 merge.

- Data and art: `data.js`, `img/ph*.webp`, `img/thumb/`, `og/`, derived files by `node tools/build.js`.
- App: `types.ts` (`TABLE_IDS`, `SECTIONS`, `Record_.vol`), `volumes.ts` (new), `tables.ts`
  (`TABLE_GROUPS`, the supplements group), `label.ts` (`tableOf`, `srcName`, `srcLabel`, `whereFrom`),
  `facets.ts`, `filters.ts`, `sections.ts`, `nav.ts`, `hash.ts`, `help.ts`, `dict.ts` (tab, page,
  `src*`, the data-credit line), `App.svelte`, `TablesPage.svelte`, `RecordCard.svelte`.
- Generators and worker: `tools/derived.js`, `tools/desc-style.mjs` (`isLabelled`), `tools/share-card.mjs`,
  `tools/build-share-pages.js`, `preview/worker.mjs`.
- Tests: `tests/dataint.js`, `tests/derived.js`, `tests/contracts.js`, `tests/app/contracts.js`,
  `inventory.js`, `states.js`, the goldens `_roll_ph*.txt` and `_tables_ph*.txt`, and the unit
  test beside each app file.
- Docs and contracts: `docs/specs/` (CONTRACTS, ROUTES, STATE, FEATURES, COVERAGE, I18N),
  `docs/fixtures/urls/routes.json` and `preview.json`, `llms.txt`, `README.md`, `README.ru.md`,
  `PRODUCT.md`, `docs/DECISIONS.md` and one decision file.

## Batches

| Batch | Content | Why this size | Gates |
|---|---|---|---|
| B0 | Translate `records-draft.json` (93 records, 4 refs) with the `daggerheart-ru-terms` skill and daggerheart.su; a reviewer checks terms, parity and consistency; one fix pass | Touches only `issues/pistolheart/`, so it does not wait for task 57. The Russian is the largest content risk; B1 then merges verified text. | none (JSON valid, parity script) |
| B1 | Merge 93 records and 4 refs, ingest 45 pictures, wire the source, update specs, fixtures and goldens, write the decision file | No split: data, art, wiring and goldens share the same components, seed and filters, and the one public-contract change (a new source key and its routes) lands in one commit. The Many Worlds Tavern ingest was one commit too. | `check:fast`, then push for CI |
| R1 | Reviewer on B1, one remediation commit | Triggers: public contracts and routes changed, new source mechanics, large data ingest. | `check:fast`, CI |
| B2 | Closeout: audit `issues/pistolheart/` against `/handoff`'s durable list, move what qualifies, delete the directory, squash onto `main` | Per `CLAUDE.md`. | CI of the tip |

Total gate cost: two `check:fast` runs and two CI runs, one golden re-seed, one `check:built` and one
browser-suite run. Run `check:built` and the browser suite once, after the goldens are seeded.

## B1 order of work

1. Merge `main`; re-grep (see Start gate).
2. Convert `records-draft.json` (Russian done in B0) to `data.js` records: `refs` objects in the
   `RefCard` shape, `img` fields. Write plain text only: `node tools/desc-style.mjs --write` applies
   the bold cost and italic condition styling. Use a merge script that loads `data.js`, mutates `L`, and writes the exact
   `window.LOOT=` + JSON + `;\n` form.
3. Ingest the art; run `node tools/desc-style.mjs --write`, then `node tools/build.js`; search `i/` for `undefined`.
4. Wire the source (Touchpoints). A new word on the print card is not expected: the traits and ranges
   are all in use (`any` is not needed).
5. Specs, fixtures (`routes.json` rows by script), `llms.txt`, READMEs, decision file.
6. `node tests/run-all.js dataint,derived,contracts`, then `rtk npm run check:fast`; commit; push.

## Standing checks

- Scale: 93 records add about 6 percent to the 1459. Check `tools/bundle-budget.mjs`. The table
  is one source of 93 rows in three sections: no list virtualisation needed. 45 pictures
  at about 30 KB each.
- Error scenarios: `ingest` refuses an existing destination and reports `unsourced` for an asset
  no file resolves to; a missing reference key fails `dataint`; a ref with a foreign host must still
  render an accessible link; an unknown `vol` fails `dataint`.
- Consistency: one source key, one prefix, rung words as Core, labelled-feature style, American
  spelling, ASCII punctuation, source names after the product.
- RU/EN parity: every record, reference, volume name, table label, help text and path word has both
  languages. The reviewer reads the Russian against `daggerheart-ru-terms`.

## Do-nots

- Do not invent roll dice, tiers or Russian terms the book or the skill does not give.
- Do not infer equipment tier from stats; the tier of each rung is its printed tier.
- Do not renumber ids, copy the Infusions paragraph into nine records, or hand-convert art.
- Do not commit the kit (PDFs, PNGs) to the repository.
