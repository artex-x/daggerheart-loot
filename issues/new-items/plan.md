# Plan - TASK new-items

Facts, inputs and owner decisions: `context.md`. Procedure: `.claude/prompts/add-source.prompt.md`.
Status: planned and implement-ready as one batch; it waits for task 57 and for the lr and vh pictures. Reviewed 2026-11-05 against `main` at `b6f153a5`.

## Start gate

Start batch B1 only when task 57 is closed: `issues/57/` is deleted and its closeout squash is on `main`.
Task 57 rewrites `TablesPage`, the filters, the tags, `RecordCard`, `dict.ts` and `help.ts` and re-seeds most
goldens; a new source edits the same files.

At the start, in `.claude/worktrees/new-items`:

1. `git merge main` (the branch holds only `issues/new-items/`, so there is no conflict).
2. Run `git grep -l -E "\bmwt\b" -- app tools preview tests docs llms.txt README.md` and
   `git grep -n realm -- app/src`. The touchpoint list below comes from `b6f153a5`; this command is the current list.
3. Read `docs/DECISIONS.md` for any decision of task 57 about tags, filter chips and source labels.

## Design (decided)

The model copies Arazo's Artifacts (one pool, roll in book order, lines) and Many Worlds Tavern (a record field
that names the card set). One new source key per book; the same wiring each time.

| Point | ph | lr | vh |
|---|---|---|---|
| Key, table, section | `ph`, `roll/ph`, "Pistolheart" | `lr`, `roll/lr`, "The Last Round Table" | `vh`, `roll/vh`, "Escape the Veiled Halls" |
| Ids and roll | `ph1`-`ph93`, roll = id number, book order, a line's rungs after its head | `lr1`-`lr26`, roll = id number, book order | `vh1`-`vh15`, roll = place in its room's table (d4, d4, d3, d4) |
| Roll mode | one pool of 93, random pick, no picker | one pool of 26, random pick | a room picker, then a roll in the room's table (as `roll/mwt` with its realm picker) |
| Sub-field | `vol` 1-3 | none | `room`: `basement`, `dressing`, `laboratory`, `library` |
| Equipment | 64 weapon records in 16 lines, 4 armor; printed stats; in the equipment tables too | 3 single Tier 2 weapons (printed stats), in the equipment tables too | none |
| Items | 29 (3 items, 11 consumables, 6 saddles, 9 Infusions) | 23 (11 items, 12 consumables) | 6 items, 9 consumables |
| Rules cards | 4 (`ph-mounted`, `ph-saddles`, `ph-infusions`, `ph-most-wanted`) | 3 (`lr-recipes`, `lr-deed`, `lr-fruitcake`) | none |
| `craft` | none | none | vh2 to vh6, vh8 to vh15 (potion families) |

Common to all three:

- The sub-field (`vol`, `room`) sections the source's table the way `realm` sections `mwt`, and the label and path
  name it. Three sources would use the mechanism after `mwt`: if `realm` is wired as one property per table,
  add `vol` and `room` to that wiring; if it is hard-wired, extract one shared "section property" once (the second
  real use) and move `realm` onto it without changing `realm`'s data, address or filter value (frozen contracts).
  Fallback: a flat table for ph, with the volume in the label and the path.
- Text: weapon and armor features are labelled `***Name:***`; items and consumables carry the book text. Plain text
  in `data.js`; `node tools/desc-style.mjs --write` adds the bold costs and italic conditions.
- Russian: from the B0 batches (reviewed). Product names stay Latin in Russian text (`dict.ts` keeps product names Latin).
- Rules cards: `LOOT.refs` entries in the `RefCard` shape with the book's product page as `url`. `RecordCard.svelte`
  links every catalog ref to daggerheart.su today: add one branch, a catalog ref whose `url` host is not
  `ru.daggerheart.su` draws the host as its link text and keeps the address as written (the branch for an own
  rule card already does this). One component test and an axe check, once.
- Product links: the help box of each source, both README source tables, `llms.txt`, the `url` of each ref.
- Art: a line shares its head's picture. Declare `img` in `data.js`, drop the pictures in a scratch directory with
  no other file, run `node tools/artwork/run.mjs plan --uploads <dir>`, then `ingest`.
- Counts: `tests/dataint.js` pins the total at 1459; after B1 it is 1593 (93 + 26 + 15 added). Update the
  `COUNT_BEARING_FILES` files. Fixture rows in `routes.json`: compute by script.
- Order of the source labels and sources in the supplements group: ph, then lr, then vh, after `mwt`.

## Batches

| Batch | Content | Why this size | Gates |
|---|---|---|---|
| B0-ph | Translate the ph draft; review; fix pass | Touches only `issues/new-items/`; done (`reviews/B0-ph.md`) | none |
| B0-lr | Translate the lr draft; review; fix pass | as above | none |
| B0-vh | Translate the vh draft; review; fix pass | as above | none |
| B1 | All three sources: merge 134 records and 7 refs, ingest 86 pictures, wire ph, lr and vh, build the shared mechanism once (the section property for `realm`, `vol` and `room`, the room picker, the ref link branch), specs, fixtures, goldens, decision files, the UI verification pass at ten supplements | One batch (owner, 2026-11-05). The sources share every touched component, the seed, the filters and the goldens; the three new source keys are the same public-contract change, so no split has its own criterion (`CLAUDE.md`, "Size a batch by its gates"). One wiring, one golden re-seed, one UI pass at the final count of ten supplements (a pass at eight would be thrown away), one review, one CI run. The mwt ingest was one commit of 152 files | `check:fast`, then push for CI |
| R1 | Reviewer on B1, one remediation commit | Triggers: public contracts and routes changed, new source mechanics, large data ingest, new or changed UI | `check:fast`, CI |
| V1 (conditional) | UI fixes found by the B1 verification pass that need more than a local fix (menu, chip rows, room picker, long names) | A changed UI is judged on its own screenshots and goldens; a reviewer reads it | `check:fast`, `check:built`, the browser suite, CI |
| B3 | Closeout: audit `issues/new-items/` against `/handoff`'s durable list, move what qualifies, delete the directory, squash onto `main` | Per `CLAUDE.md` | CI of the tip |

Art gate: B1 needs all 86 pictures: 45 for ph (delivered), 26 for lr and 15 for vh (kits ready, being generated by
the owner). Work inside B1 in this order so nothing waits early: wire the mechanism with ph first, then add lr
and vh as the pictures arrive; the batch is one commit and starts its gates when the last picture is in. Before
the ingest of lr and vh count the files (26 and 15); if they are missing, stop and report which. If the owner wants
B1 without them, the records may ship with `img: ''` and the art follows in a `refresh-artwork`-style batch
(`docs/artwork.md`).

Total gate cost: two `check:fast` runs (B1 and the R1 fix pass), two CI runs, one golden re-seed, one
`check:built` and browser-suite run, one UI pass. The earlier plan (ph, then lr and vh) cost one more of each.
What the merge costs: a larger diff for the reviewer (about 300 files with art, mostly mechanical) and a
failure on one source blocks all three; if `check:fast` fails on one source, split that source out then.

## UI verification at every width (owner, 2026-11-05)

Three sources take the supplements from seven to ten and add three tables, three roll modes, a room picker (vh)
and sectioned tables. Layout that held for seven may not hold for ten. B1 ends with this pass at ten supplements.

What can break (measure each; do not assume):

- The supplements menu «Дополнения» lists the supplements as 44 px items: ten items are 440 px plus the caption,
  against 640 px at 360x640 with a 111 px header.
- The tables page: the supplements group chip and its second row of book chips (10 chips), the picker row and sheet
  below 761 px, the group chips and tabs at most 140 px below 1000 px (`FEATURES.md`, "the seven"), the wide head.
- The roll tabs: the supplements chip panel (`PickerRollPanel`), the roll page of each new source, the vh room picker
  beside the mwt realm picker, the roll card at 600 and 601 px, the tall face.
- Sectioned tables: the volume (ph) and room (vh) sections beside the realm sections of `mwt`; the section leaf in the
  record's path line («Pistolheart · Том 2» style) at 360 px.
- Long names: "Blessed Kegs of the Blazing Barrel", "Saint Bungus Honey Butter Soap", "Deed to the Last Round
  Table", "Legendary Foresight Potion", «Продвинутый Револьвер Несущего Войну» and the longest Russian names, on the
  row, the card, the list, search, the share stub and the print card, at 360 px (rule 16: no overflow).
- Equipment: 68 new rungs and 3 weapons in the weapons and armor tables, the tier ladder of each new line, the print
  strip of a new line on both sheets (color and black and white, 63x88 and the compact 44x63).
- Search, lists, the preview stubs under `i/`, the share cards and `llms.txt`.

Method:

1. Build for the browser: `npm run build:test`, then the focused suite
   `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` and
   `node tests/app/sweep.js <width>` for 360, 390, 768 and 1180 (CI's `browser` matrix runs the same widths).
2. Open the routes in a real browser (the in-app browser; `npm run build:test` output) in Russian and English at
   these widths: 360x640, 390, 500, 600 and 601, 700, 760 and 761, 768, 999 and 1000, 1050, 1180x720, and one wide
   window (1440 or more): `/tables/ph`, `/tables/lr`, `/tables/vh` (every section), the tables page with the
   supplements group open, `/roll/ph`, `/roll/lr`, `/roll/vh` (every room), the supplements menu and chip panel,
   `/search` for a new name, a record page of each long name above, `/list`, a print preview of each new source
   (color and black and white, both sheets).
3. Check the rules of `DESIGN.md`: The First-Screen Rule (256 px at 640, 288 px at 720 for the table or the first
   roll result), The Two Breakpoints Rule, The One Width Rule, rule 16 at 360, touch targets at 600, no horizontal
   scroll, no clipped label, no third breakpoint.
4. Save screenshots of every defect and of the fixed state under `issues/new-items/mocks/` (scratch, deleted at
   closeout) and list each finding with the route, width, language and measured number in the handoff.

A finding is fixed inside the existing system (tokens, components, the two breakpoints): a menu that outgrows the
viewport gets a measured `max-height` and scroll, a chip row that outgrows its band wraps or moves to the picker
the way the narrow layout already does. A change of behavior updates `docs/specs/FEATURES.md` and `DESIGN.md`
in the same commit, and the "seven supplements" statements (`DESIGN.md` line 733; `FEATURES.md` lines 83, 88, 95,
160, 2804, 2805 and 2877 at `b6f153a5`) name the real count. New states get a `tests/app/inventory.js` entry and
a re-seeded golden. If the pass needs more than a local fix, stop the batch and raise a conditional batch V1
(UI fixes; a reviewer reads it: "new or changed UI" fires the trigger).

## B1 order of work

1. Merge `main`; re-grep (see Start gate).
2. Convert the drafts (ph first, then lr and vh) to `data.js` records: Russian text, `refs` objects in the `RefCard` shape, `img` fields,
   `craft` for vh. Use a merge script that loads `data.js`, mutates `L`, and writes the exact
   `window.LOOT=` + JSON + `;\n` form. The drafts hold working fields (`title`, `source`, `note`, `records`,
   `rooms`, `craft` map) that are not shipped.
3. Ingest the art; run `node tools/desc-style.mjs --write`, then `node tools/build.js`; search `i/` for `undefined`.
4. Wire the source (Touchpoints). A new word on the print card is not expected: the traits and ranges are in use.
5. Specs, fixtures (`routes.json` rows by script), `llms.txt`, READMEs, decision file.
6. `node tests/run-all.js dataint,derived,contracts`, then `rtk npm run check:fast`.
7. The UI verification pass ("UI verification at every width"); fix local findings in the same batch; commit; push.

## Checks that B0 left for B1

- How the record page, the copied text and the print card render the `|` table of `lr-recipes`: no catalog rules
  card carries a table today (`FEATURES.md`, "Formatted text", the table row rule). If it does not render, reshape
  the card as a list ("Name (rating N): effect") in the draft and the Russian.
- Whether `desc-style` styles the new condition «Ослаблен» (Impaired) like the other conditions, and what it does to
  the item feature labels written `Name - Kind:` (Action, Reaction, Passive, Rest Move): `STAT_BLOCK_FEATURE`
  expects the adversary form. Settle by an `OVERRIDES` entry with its reason, never by hand-editing `data.js`.
- The catalog already holds the ref `shambling-zombie` (`dv66`); lr12 points at it. Confirm the key.
- `ph-mounted` text keeps its bullet nesting; check it renders as a list on the record page.
- The vh6 English "an experience" is capitalized or not (the corpus capitalizes Experience).
- The reviewers had no `daggerheart-ru-terms` skill file on this host; the terms came from the site and the corpus.

## Touchpoints

From the Many Worlds Tavern commit (`5d62bf06`) and `git grep mwt` at `b6f153a5`. Re-grep after the 57 merge.

- Data and art: `data.js`, `img/<id>.webp`, `img/thumb/`, `og/`, derived files by `node tools/build.js`.
- App: `types.ts` (`TABLE_IDS`, `SECTIONS`, `Record_.vol`, `Record_.room`), a volumes and rooms module beside
  `realms.ts`, `tables.ts` (`TABLE_GROUPS`, the supplements group), `label.ts` (`tableOf`, `srcName`, `srcLabel`,
  `whereFrom`), `facets.ts`, `filters.ts`, `sections.ts`, `nav.ts`, `hash.ts`, `help.ts`, `dict.ts`, `App.svelte`,
  `PickerRollPanel.svelte` (the room picker of vh), `TablesPage.svelte`, `RecordCard.svelte`.
- Generators and worker: `tools/derived.js`, `tools/desc-style.mjs` (`isLabelled`), `tools/share-card.mjs`,
  `tools/build-share-pages.js`, `preview/worker.mjs`.
- Tests: `tests/dataint.js` (the source list, `vol` and `room` rules, the count), `tests/derived.js`,
  `tests/contracts.js`, `tests/app/contracts.js`, `inventory.js`, `states.js`, the goldens `_roll_<key>*.txt` and
  `_tables_<key>*.txt`, and the unit test beside each app file.
- Docs and contracts: `docs/specs/` (CONTRACTS, ROUTES, STATE, FEATURES, COVERAGE, I18N),
  `docs/fixtures/urls/routes.json` and `preview.json`, `llms.txt`, `README.md`, `README.ru.md`, `PRODUCT.md`,
  `docs/DECISIONS.md` and one decision file per batch.

## Standing checks

- Scale: 134 records add about 9 percent to the 1459 (about 6 percent for ph). Check `tools/bundle-budget.mjs`.
  86 pictures at about 30 KB each. Each table is a small source in at most three sections.
- Error scenarios: `ingest` refuses an existing destination and reports `unsourced` for an asset no file resolves
  to; a missing reference key fails `dataint`; a ref with a foreign host must still render an accessible link; an
  unknown `vol` or `room` fails `dataint`; a roll in a room's table that has no record fails `dataint`.
- Consistency: one source key per book, one prefix, rung words as Core, labelled-feature style, American spelling,
  ASCII punctuation, source names after the product, the same sub-field wiring for all three.
- RU/EN parity: every record, reference, volume and room name, table label, help text and path word has both
  languages. The reviewer reads the Russian against `daggerheart-ru-terms`.

## Do-nots

- Do not invent roll dice, tiers or Russian terms the book or the skill does not give.
- Do not infer equipment tier from stats; the tier of each rung is its printed tier.
- Do not renumber ids, copy a rules paragraph into many records, or hand-convert art.
- Do not commit the kits (PDFs, PNGs) to the repository.
- Do not change `realm`'s data, address or filter value.
