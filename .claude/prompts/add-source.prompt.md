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
5. Inspect roll/table/filter patterns in `app.js` (and `app/` if needed)
6. Inspect id prefixes, `craft`, `refs`, equipment (`eq`) fields, image and `i/` stub conventions
7. Inspect `tools/build.js` and tests that pin counts, images, stubs, routes, i18n

Canonical data source of truth: `data.js` (`window.LOOT`).
Derived: run `node tools/build.js` for `data.json`, `catalog.csv`, `i/*.html`.
Art: `img/<id>.webp` and `og/<id>.jpg` are outside the JS build but required when records have art.

----------------------------------------
How data is organized today (do not reinvent this)
----------------------------------------

`window.LOOT` has several parts:

1) `items` - loot tables keyed by table id (e.g. core items/consumables, wondrous, dread, voa, community, ...).
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

2) `eq` - equipment list (weapons, secondary, armor, and some dual-listed wondrous gear).
   Equipment carries structured combat/stat fields and may participate in upgrade **lines** (tier ladder UI), which is separate from `craft`.

3) `alt` - alternate-table rarity layout data used by the rarity roll mode.

4) `refs` - referenced rulebook cards the item text points at.
   Purpose: item descriptions often assume a Core card (spell, grimoire feature, beastform, etc.). The site stores that card text so a player who only has the loot card still sees the referenced rule.
   Organization:
   - `LOOT.refs` is a map/object of reference entries keyed in the project's existing style
   - the UI renders referenced cards as a collapsed block on the record and includes them in copy/share flows
   - add a ref when the item text depends on another card's rules text; do not dump unrelated book chapters into `refs`
   - reuse an existing ref when the same card is already stored; do not duplicate the same card under a new key
   - bilingual handling must match how existing refs are stored and rendered
   - inspect real `refs` entries and the render path in `app.js` before adding new ones

5) `craft` relationships:
   - on a record, `craft: "<id>"` means "this thing crafts/produces that id"
   - reverse links (`crafted from`) are computed at load - do not hand-maintain a second reverse index unless the codebase already requires it
   - craft is not the equipment tier ladder; do not model upgrade lines as `craft` unless the book is truly a recipe-to-output relationship

Id prefixes are frozen public contracts (`ci`/`cc`, `hi`/`hc`, `w`, `di`, `voa...`, `cm`, `f`, `q`, ...).
Never renumber shipped ids. A new source may need a new prefix/scheme - justify it and keep it stable.

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
D) Map images to ids; note missing/duplicate/wrong art
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
5. Place/convert art to `img/` and `og/` naming expected by the project
6. Run `node tools/build.js` and fix derived drift
7. Wire roll mode / table / filters / i18n only if required
8. Update docs and copy that publish counts or source lists when they change (`index.html`, `README.md`, `README.ru.md`, `app.js`, `llms.txt`, and `robots.txt`)
9. Update tests/fixtures/specs only if behaviour or public contracts change
10. Run verification:
    - data/image/stub checks the repo expects
    - `npm run check` when code/app surface changed
    - `npm run check:built` when screen/dist output may change (per CLAUDE.md)
    - focused tests for new routes/filters/mechanics
11. Update TASK_DIR handoff/plan when useful (template headings)

Follow standing rules in `CLAUDE.md`.

Do not:
- renumber shipped ids
- invent book text
- duplicate existing refs under new keys
- model upgrade ladders as `craft` or `craft` as set bonuses
- leave derived files stale
- add unrelated refactors

----------------------------------------
Done criteria
----------------------------------------
- Every source entry is represented (or explicitly deferred with reason)
- Draft JSON mismatches resolved against the book
- `craft` / `refs` / equipment / set-or-new-mechanic relationships correct for what was approved
- Images mapped; missing art called out if any remain
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
- Commit only if checks pass, using Conventional Commits as defined in `CLAUDE.md`