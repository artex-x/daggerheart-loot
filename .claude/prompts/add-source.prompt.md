TASK: <id>

The `TASK` value above is a placeholder. Prefer the TASK id from the orchestrator or user message when present.

Interpret it as:

* `TASK_ID`: the entire non-empty value after `TASK:`, trimmed; hyphens are part of the id
* `TASK_DIR`: `issues/<TASK_ID>`

Use `<TASK_ID>` as a variable. Never treat a sample id as hard-coded.

Add a new item source (or extend an existing one) into daggerheart-loot end-to-end in this session when safe.

This prompt is agent-agnostic (Claude Code, Codex, or similar).
Always read and follow `CLAUDE.md` in the repo root before doing anything else.
Do not select models - the orchestrator chooses models.
Only one writer should own this working tree at a time.
Spawn a subagent only for a wide, independent track; do reads, checks and verification in this session.

Prefer one coherent pass (this operation is rare). Split only on a hard verification boundary or missing inputs.
When durable notes help multi-session recovery, write `plan.md` / `handoff.md` under TASK_DIR using `.claude/templates/handoff.template.md` headings.

----------------------------------------
Inputs (discover from this chat; do not ask the human to re-specify paths)
----------------------------------------
- Primary source material (book scans/PDF/pages/text/photos - whatever is attached)
- Optional rough JSON/notes (high-level translation / approximate stats) - DRAFT only; verify everything against the source
- Image folder or image attachments
- Any extra notes in this message

If a required input is missing, say what is missing and stop.

----------------------------------------
Orientation
----------------------------------------
1. Read `CLAUDE.md`
2. Read `<TASK_DIR>/context.md` if it exists. Prefer captured facts over re-reading the same source material; refresh only when facts are missing, stale, or superseded by new human input.
3. Read relevant `docs/specs/` (CONTRACTS, FEATURES, ROUTES, I18N, and anything else this source may touch)
4. Inspect existing similar sources in `data.js` / `data.json` / `catalog.csv`
5. Inspect roll/table/filter patterns in `app/src/lib/` and `app/src/components/`
6. Inspect id prefixes, `craft`, `refs`, equipment (`eq`) fields, image and `i/` stub conventions
7. Inspect `tools/build.js` and tests that pin counts, images, stubs, routes, i18n

Canonical data source of truth: `data.js` (`window.LOOT`). The file is
exactly `window.LOOT=` + `JSON.stringify(L)` + `;\n`, so a merge script can
load it, mutate `L` and write it back without changing an unrelated byte.
Derived: run `node tools/build.js` for `data.json`, `catalog.csv`, `i/*.html`.
Art: `img/<asset-id>.webp` and `og/<asset-id>.jpg` are outside the JS build but
required when records have art. The asset id is the basename of a record's
`img` field, not necessarily the record id: several records may share one
asset, and a record joining one gets no `img/` or `og/` file of its own. A
record may legitimately ship with `img: ''`, which renders `_none.webp`. Use
`node tools/artwork/run.mjs ingest` to install and validate art - never
hand-convert; see `docs/artwork.md` for the tool and its settings, and its
"The ingest path" for the drop: image files only, counted against the
records first and again just before `ingest`, no renaming pass for
`<Name> v<N>.png`, and `unarted` named per record.

----------------------------------------
How data is organized today (do not reinvent this)
----------------------------------------

`window.LOOT` has several parts:

1) `items` - loot tables keyed by table id (e.g. core items/consumables, wondrous, dread, voa, dv, community, ...).
   A record that rolls on its book's table and also has a stat block lives here, with its `eq` block (the Wondrous, Dread and Dragon's Vault model): it rolls with its book and still appears in the equipment tables.
   Typical loot record fields (names may be short forms in data.js):
   - `id` - stable public id
   - `src` / source
   - `kind` - `item` | `consumable` (equipment may also appear with an `eq` block)
   - `roll` - table number when the set is rolled
   - `en` / `ru` - names
   - `ende` / `rud` - descriptions
   - `img` - image filename
   - optional `craft` - id of what this recipe/item produces
   - optional other source-specific fields already used by similar sets (tier/rarity/community/etc.)

2) `eq` - equipment with no roll (weapons, secondary, armor).
   Equipment carries structured combat/stat fields and may participate in upgrade **lines** (tier ladder UI), which is separate from `craft`.
   `eq.line` is only the four-tier ladder: `tests/dataint.js` holds every line at tiers `1,2,3,4`.
   `eq.alt` holds a second stat set that the weapon's own feature switches to (Versatile, and any paid or conditional swap); the print card draws it as a second strip. `Универсальное:` names Versatile only (`docs/specs/I18N.md`, "Rules").

3) `alt` - alternate-table rarity layout data used by the rarity roll mode.

4) `refs` - referenced rulebook cards the item text points at.
   Purpose: item descriptions often assume a Core card (spell, grimoire feature, beastform, etc.). The site stores that card text so a player who only has the loot card still sees the referenced rule.
   Organization:
   - `LOOT.refs` is a map/object of reference entries keyed in the project's existing style
   - the UI renders referenced cards as a collapsed block on the record and includes them in copy/share flows
   - add a ref when the item text depends on another card's rules text; do not dump unrelated book chapters into `refs`
   - reuse an existing ref when the same card is already stored; do not duplicate the same card under a new key
   - bilingual handling must match how existing refs are stored and rendered
   - inspect real `refs` entries and the render path in `app/src/components/RecordCard.svelte` before adding new ones

5) `craft` relationships:
   - on a record, `craft: "<id>"` means "this thing crafts into / upgrades to that id"; the card reads "Upgrades to" and the target reads "Made from"
   - reverse links (`crafted from`) are computed at load - do not hand-maintain a second reverse index unless the codebase already requires it
   - a chain of named items (Frostwyrd Dormant -> Awakened -> Exalted) is a craft chain; the four-tier ladder is `eq.line`, and nothing else is

6) `sets` - a bonus shared by several records (Ember and Spark's Blazing Twins).
   - each member names its set in `set: "<key>"`; members are derived at load, never stored as a sibling list
   - `LOOT.sets[key]` holds the bonus once (`en`, `ru`, `ende`, `rud`); every member's card, copy, print card, stub and `catalog.csv` row carries it
   - never copy the bonus into one member's text; design the wording for N members before the field exists

Id prefixes are frozen public contracts (`ci`/`cc`, `hi`/`hc`, `w`, `di`, `voa...`, `dv`/`dve`, `cm`, `f`, `q`, ...).
Never renumber shipped ids. A new source may need a new prefix/scheme - justify it and keep it stable.

----------------------------------------
Contributor drafts and delivery notes
----------------------------------------
A source often arrives as a package: a draft data file, a review, a patch ledger, integration notes, an art folder.

- Read the review and the patch ledger first. Check whether each ledger edit is already applied (its `to` string present) before applying anything.
- Read integration notes for book facts, never for where to edit. Notes written against an older renderer name files that no longer exist (`app.js`, `TABLE_OF`, `EQ_SRC` were deleted at `23c00a6`); the checklist in Phase 2 is the current list.
- A contributor's claim about a repository rule is a claim. Find the rule in `tests/` or `types.ts` before you design around it: a four-tier `line` rule taken for a schema rule once produced a parallel `upgrade_line` field, where relaxing or reusing the real mechanism was the answer.
- Extra draft fields default to drop (`page`, `lore_*`, `state`, ...). A GM sidebar that is rules text folds into the record text as a final line. Lore is a product question: raise it, do not ship it silently.
- Where the book's overview table and its detailed entry disagree, the entry wins; confirm each case on the rendered PDF page, and measure the printed-page offset once per book.
- Normalise draft punctuation to the catalogue's: `docs/DECISIONS.md`, "Text normalisation for an ingest, and its guard"; `tests/dataint.js` enforces it.

----------------------------------------
New mechanics the app does not support yet
----------------------------------------
Sources may introduce mechanics beyond current data/UI, for example:
- set bonuses / set effects (2+ pieces give an extra effect)
- charges, attunement-like limits, or conditional multi-item state
- new roll procedures or table geometries
- new filter axes (set name, slot, curse flag, etc.)
- cross-record bundles that are not simple `craft` or upgrade lines
- anything that needs interaction, not only static text

Treat these explicitly:

A) Detect - while inventorying, flag every mechanic not already represented by existing fields (`craft`, `refs`, `eq` stats, upgrade lines, rarity/tier/community/frame, plain description text).

B) Classify each new mechanic:
- **Text-only:** can be fully and honestly described in the item text (and refs if needed) with no extra UI - prefer when players only need to read the rule
- **Structured data, minimal UI:** needs fields for search/filter/grouping but not a new interaction model
- **First-class product feature:** needs new data shape and UI (e.g. set effect browser, "pieces of this set")

C) Design before coding:
- For each non-text-only mechanic, propose data model, UI surfaces, contract/test impact, and the smallest change that fits existing patterns
- Ask the human only for material forks (e.g. text-only vs first-class set UI). Present 2-3 options, tradeoffs, one recommendation
- If the human would reasonably not care, choose the smallest honest option and proceed
- If confirmation is required: `NEEDS_HUMAN_CONFIRMATION: yes` and stop before large writes
- Do not silently pretend a set effect is supported in UI if you only pasted flavor text and players cannot see which other pieces belong to the set when that matters

D) Mockups:
- If a new mechanic needs visible UI, produce lightweight mockups grounded in the current app
- Show the recommended option and at most 1-2 alternatives when meaningful
- Do not fully implement only to screenshot; do not redesign unrelated chrome
- Store under TASK_DIR/mocks/ when useful

----------------------------------------
Phase 1 - Analyze and decide
----------------------------------------
A) Inventory the source: every entry, kind, roll/tier/rarity, equipment stats, recipes/upgrades, sets, specials
B) Reconcile optional draft JSON vs book; prefer the book; list mismatches
C) Design records: stable ids, fields, bilingual text, `craft` chains, `refs`, equipment blocks, set membership if any
D) Decide, per new record: which source image belongs to it; whether it
   joins an existing upgrade line and takes the line's existing asset rather
   than getting its own (a source-book judgment - the only legal reason two
   records may share one picture); and which records ship without art for
   now. Note missing/duplicate/wrong art.
E) Product surface: existing roll mode/table vs new ones; roll page; table page + filters; i18n/help; extra records needed
F) Explicit "new mechanics" notes: each mechanic -> text-only / structured / first-class -> decision

If blocked on missing source pages, unreadable art, or unanswered material decision: stop with a clear checklist.
Otherwise continue to Phase 2 in this same session.

----------------------------------------
Phase 2 - Implement in one coherent pass
----------------------------------------
Do:
1. Merge records into `data.js` with correct fields and conventions
2. Add/reuse `refs` entries where item text depends on referenced cards
3. Wire `craft` links and verify reverse "crafted from" behaviour
4. Implement any approved structured/first-class mechanics with the smallest fitting design
5. Declare each new record's `img` in `data.js`, then run
   `node tools/artwork/run.mjs ingest` per `docs/artwork.md`; never
   hand-convert. Records must be in `data.js` before or in the same change
   as running `ingest`, or its `og/` orphan gate fails
6. Run `node tools/build.js` and fix derived drift. Then search `i/` for `undefined`: a source missing from a generator's label map prints it into the stub
7. Wire roll mode / table / filters / i18n only if required. A new source key, table or roll section is registered in all of these (grep an existing key such as `voa` or `dv` to confirm the list is still complete):
    - app: `app/src/lib/types.ts` (`TABLE_IDS`, `SECTIONS`), `tables.ts`, `label.ts` (`srcName`, `srcLabel`, `tableOf`), `dict.ts` (tab, page, `src*`, `footBefore`, section labels), `help.ts` (the help box and its product link), `facets.ts`, `filters.ts` (`PLAIN_GROUPS`), `sections.ts`, `desc.ts`; `App.svelte` (`ROLL_TABLE`), `TabBar.svelte`, `TablesPage.svelte`, `FilterBar.svelte`
    - generators: `tools/derived.js` (`SRC`), `tools/build-share-pages.js` (`SRC_LABEL`)
    - tests: `tests/dataint.js`, `tests/derived.js` (per-source pins), the unit tests beside each app file above, `tests/app/sweep.js`, `typo.js`, `hues.js`, `contracts.js`, `inventory.js`
    - contracts and docs: `docs/fixtures/urls/routes.json`, `docs/specs/CONTRACTS.md`, `ROUTES.md`, `STATE.md`, `FEATURES.md`, `COVERAGE.md`, `README.md`, `README.ru.md`, `llms.txt`, `PRODUCT.md`
8. Update docs and copy that publish counts or source lists when they change - every file `tests/derived.js`'s `COUNT_BEARING_FILES` names. A new document that publishes a count gets an entry there in the same change, or it goes stale silently
9. Update tests/fixtures/specs only if behaviour or public contracts change. Fixture counts (the `routes.json` row counts) move with every equipment ingest: compute them from the merged data with a script, never by hand
10. A new word on the print card (a trait, a range) is measured in the built app against the cell at the `2.2cqw` floor before it ships; a word that does not fit gets a print-only short form (`app/src/lib/print.ts`)
11. Run verification:
    - `node tests/run-all.js dataint` - ids, images, `og/` orphans, stubs
    - `npm run check` when code/app surface changed
    - `npm run check:built` when screen/dist output may change (per CLAUDE.md)
    - focused tests for new routes/filters/mechanics
12. Update TASK_DIR handoff/plan when useful (template headings)

Follow standing rules in `CLAUDE.md`.

Do not:
- renumber shipped ids
- invent book text
- duplicate existing refs under new keys
- model the four-tier ladder as `craft`, a named-item chain as `eq.line`, or a set bonus as `craft`
- leave derived files stale
- add unrelated refactors

----------------------------------------
Done criteria
----------------------------------------
- Every source entry is represented (or explicitly deferred with reason)
- Draft JSON mismatches resolved against the book
- `craft` / `refs` / equipment / set-or-new-mechanic relationships correct for what was approved
- Images installed via `node tools/artwork/run.mjs ingest`; missing art
  called out if any remain; `node tests/run-all.js dataint` passes
- Derived files rebuilt
- Roll/table/filter/mechanic UI defined and implemented when this source needs it
- Counts/docs/tests updated as required
- Checks run and reported

----------------------------------------
Finish with
----------------------------------------
- Summary of what was added (counts by kind/source)
- New mechanics encountered and how each was handled (text-only / structured / first-class)
- Files changed
- Commands run and results
- Deferred items or follow-ups
- Commit only if checks pass, using Conventional Commits as defined in `CLAUDE.md` - the first batch commits, every later batch amends (`git commit --amend`) the task's one commit; the message body names the task id. Do not push - the task's commit is pushed once, at closeout, after the task directory is retired.