# Shared task context - TASK persist-7-homebrew

## Goal
Release R7: homebrew items (the same record shape as official items), a
"Your homebrew" search group, add-to-list as an immutable snapshot, and
bundle schema v2. Batches `B7.1`, `B7.2` in the roadmap; they may change.
R8 (homebrew art) and R9 (`#/h/<token>` item links, add and clone, print
routes for cloud lists) build on this design.

Planned ahead (2026-09-25) while R2's last batch is being built. Design
level plus owner questions now; the implement-ready steps get a refresh
before the build.

## Sources (read, do not re-fetch)
- Roadmap `issues/persistent-storage/plan.md`: sections 3, 5, 9, 12, 14
  (R7, and R8/R9 as consumers), section 16 (decisions 7 "catalog
  authority", 31 limits with homebrew items as a count limit, 40 the
  `delete-account` Edge Function and the `homebrew-art` bucket), section
  17 (deferred: homebrew Trash, import beyond create-only).
- `issues/persistent-storage/context.md`: the limits amendment (homebrew
  items are a row in `limit_defaults`).
- R2's task `issues/persist-2-lists/`: `plan.md` section 4.2 (the B2.1
  schema: `list_entries.source` and `snapshot`, 16384-byte bound that
  "R7 may widen").
- `data.js` (canonical catalog), `app/src/lib/types.ts` (the record
  shape), `app/src/lib/data.ts` (index and search), `CLAUDE.md` "Product
  laws" (never infer equipment tier from stats), the `daggerheart-*`
  skills for terminology.
- R6 (bundle v1) is being planned in parallel; v2 extends v1 - name the
  seam with R6's plan, do not redesign v1.

## Owner input for the R7 refresh (2026-09-27, through the orchestrator)
Items to think about in the next planning pass. Not decided, not planned.

Mocks first (owner, 2026-09-28): the refresh makes mocks of every changed
or new screen and the owner reviews them before any batch goes to an
implementer, as for R4 and R6 (a `mocks/` directory in this task: one
self-contained file per screen, each state at 960 px and 360 px). The
refresh stops with NEEDS_HUMAN_CONFIRMATION: yes until the owner
approves the mocks.

Verbatim: "re homebrew items we need to make sure that all features
currently supported by default items are supported by homebrew as well:
tier preogression, craft chains, sets, references, whatever else, maybe
only think that I'd not add for now is multi-language support. we would
also reconsider how we display built-in loot because I should be able to
unify existing loot with my to sets, or set to upgrade from upgrade to to
the existing loot, also we should consider some corner cases e.,g. I
implement 15 versions of Premium Bedroll that upgrade from it but
providing some different stats, so how we will display it on Premium
Bedroll? should we mark these cases that these items are hb so it's clear
for users that they authored that? for people who added this item in
their list but have not cloned/copied it I don't think it should be
displayed in existing items like that"

The items, as the orchestrator reads them:
1. Feature parity: a homebrew item supports every relation and property a
   catalog item has - tier progression (upgrades from and to), craft
   chains, sets, references, and anything else the record shape carries.
   The planner audits `data.js`, `app/src/lib/types.ts` and the item card
   for the full list.
   Owner's clarification (2026-09-27), verbatim: "tier progression was
   more to items like we have usual that tier 1 tier 2 tier 3 tier 4 with
   potential art reuse, maybe as a separate mechanic we need to add flag
   to mark them as unique but maybe we can reuse existing mechanism for
   that". So tier progression means an upgrade line: the tier 1-4
   versions of one item, which can share one image. The catalog carries
   it as `eq.line` (the `id` of the line's first item, empty on a one-off)
   and `eq.tier` (from the book, never from stats), with `craft` for the
   upgrade step (`app/src/lib/types.ts`, `Equip` and `Record_`). The
   owner asks whether a homebrew item needs a flag that marks it unique,
   or whether an existing mechanism covers it. Two readings to confirm
   with the owner: "unique" is a one-off outside any line (the catalog
   already shows this as an empty `line`), or "unique" is an artifact
   (the catalog's `tier: 'A'`).
2. Out for now: multi-language homebrew in the UI (one language per
   item). Amended (owner, 2026-09-28: "so maybe we should not design for
   multilingual ui but maybe we should write schema for that if it will
   be hard to migrate later"): no bilingual editor or display in R7, but
   the planner judges whether the stored shape should already hold both
   languages (the catalog's `en`/`ru`, `ende`/`rud` pairs), because
   item 13's books would carry bilingual catalog sources and a later
   migration of stored items and snapshots may cost more than a nullable
   second language now. The planner states the migration cost either way
   and recommends one.
3. Links across the boundary: a homebrew item can join a catalog set, and
   can upgrade from or to a catalog item. So the catalog item's own view
   changes: it shows the author's homebrew relations.
4. Many-to-one corner case: 15 homebrew variants of «Premium Bedroll»
   that all upgrade from it with different stats. How does the catalog
   item's card or page show them (a count, a fold, a list)?
5. Marking: homebrew relations drawn on a catalog item are marked as
   homebrew, so the author sees that they wrote them.
6. Visibility: a homebrew relation shows on catalog items only for its
   author (and for a user who cloned or copied the item). A user who only
   has the item in a list (a frozen snapshot, not a clone) does not see it
   on the catalog items.
7. Editing (owner, 2026-09-28, verbatim: "also ofk we will need edits of
   these homebrew items, maybe we can reuse the same mechanism we have
   for lists where we buffer update if someone edits text char by
   char"). The pass-1 plan's editor saves with an explicit «Сохранить»
   and «Отмена» (plan section on the editor). The owner asks whether the
   editor reuses R5's account write buffer instead: the 2 s quiet window,
   early flushes and the `keepalive` close, sent as one request per flush
   (roadmap section 9, R5 row; `apply_list_writes`). The planner weighs
   that against the save button, including how a live reference in other
   lists and shared pages takes a half-typed edit.

Owner, 2026-09-28, verbatim: "I also feel like we need to do
import/export/llms support, e.g. I'd like to convert items from some
specific source to format and import to the application. also might be
useful to add some items to some categories, like by default they are
prefixed by HB but I then add some additional source e.g. pistolheart and
it's displayed as pistolheart or pistolheart (hb), also they should be
treated as first-class citizen everywhere expcet roll pages for now
(maybe I will reasses it later), i.e. we have a separate table for them,
filters are dynamically created, they are embedded to equipment view,
etc. maybe we should add some additional filters like with homebrew or
without homebrew"

8. Import, export and `llms.txt` for homebrew items: an author converts
   the items of one source (a community supplement, for example) into a
   file and imports them in one go; an export gives them back. `llms.txt`
   teaches that item format, as R6 does for lists. The planner fixes
   where this meets R6's `schema/import-v1.json` and R7's bundle v2.
9. The author's own sources: a homebrew item is tagged «Хоумбрю» /
   "Homebrew" (HB) by default; the author can add a named source (for
   example "Pistolheart") and put items in it. The label then reads
   "Pistolheart" or "Pistolheart (HB)" - the planner proposes which, the
   owner picks.
10. First-class everywhere except the roll pages (the owner may
    reconsider the roll pages later): homebrew items appear wherever
    catalog items do - the source filters are built from the author's
    sources at run time, the items sit inside the equipment view, and so
    on. "A separate table for them" - to confirm with the owner: a table
    page of their own, as each catalog source has, or the storage table.
11. Filters: a "with homebrew" / "without homebrew" switch.
12. An audit for gaps (owner, 2026-09-28: "I'd like planner to do some
    additional push towards making homebrew items first-class citizens,
    maybe I missed some use cases or flows"). The owner's items 1-11 are
    a starting list, not the whole list. The planner walks every route,
    view, filter, search, print layout, list and share flow, export and
    `llms.txt` path that touches a catalog item, and names each place
    where a homebrew item would behave differently. For each gap: include
    it, defer it, or ask the owner. The result goes to the owner with the
    mocks, as a table.

13. Long-term direction, not built in R7 (owner, 2026-09-28, verbatim):
    "ideally for this one we should be able later to: convert things such
    as voa dread wondrous etc to "homebrew books" and all related items
    to hb items / share these books with other players. they can
    subscribe to them to make it visible on their ui but owner still can
    update it / all current func remains - roll table, table, filters,
    adding to lists, etc / if user unsubscribes from this book they stop
    seeing it but list references remain / its very long term and will
    be done not in the scope of this task but we might need to design for
    this capability in future, hope by then we will have all lists
    migrated to db so updating references is not a big problem".
    - A "book" groups items (item 9's named source is its seed). A
      catalog source (Vault of Ages, Dread, Wondrous and the others)
      could one day become such a book, its items homebrew items.
    - The author shares a book; another user subscribes and sees its
      items in the UI; the author's edits reach subscribers.
    - Everything works for a book's items, the roll tables included
      (unlike item 10's exclusion for R7).
    - A book can have subcategories (owner, 2026-09-28: "also note that
      eg for community we have splits for subcategories in book"). The
      catalog's community source does this today: each record carries
      `community` / `community_ru` (`app/src/lib/types.ts`, `Record_`),
      and the source's page, filters and roll table (`roll/community`)
      split by it. So a book's shape needs an optional subcategory level,
      and item 9's named sources should not rule it out.
    - Unsubscribing hides the book; list entries that point at its items
      stay valid.
    - By then R10 has removed browser lists, so every list entry is a
      database row whose reference can be updated.
    R7 does not build this. The planner checks that R7's schema and
    shapes do not close it off (for example: a source or book id on the
    item, not a free-text tag; references by stable id; per-user
    visibility separate from ownership), names what it would cost later,
    and writes the direction to a permanent home (a decision under
    `docs/decisions/`) when R7 closes, since this file is deleted then.

Scope (owner, 2026-09-28: "we can plan everything in the scope of r7
planning and add some additional batches/releases if needed based on
increased scope"): one R7 planning pass plans items 1-12 in full. It adds
batches to R7, or new releases after R7 in the roadmap, where the scope
needs them; it names the split criterion of each and its gate cost.

## Facts settled by planning pass 2, phase A (2026-09-28, planner)
Read at `main` `b38bc5ab`; the design is `plan.md`, this is the evidence.

- Catalog (`data.js`): 1272 records, 891 in `items` tables plus 381 in
  `eq`; 604 carry `eq`, 288 of them in 72 upgrade lines (`eq.line`), and
  every line shares one `img`; `craft` on 17 (Core recipes, Wondrous,
  the Frostwyrd chain `dve24 -> dve25 -> dve26`); `refs` on 13 (13 ref
  cards in `LOOT.refs`); `set` on 5 (two sets in `LOOT.sets`); `eq.alt`
  on 20; `tier 'A'` on 9 and `'C'` on 5; `community`/`community_ru` on
  90 (nine communities); `frame` on 95; `starting` 30; `recall` on 102
  (stored, drawn nowhere in `app/src`); no `line` crosses a source; id
  prefixes `ci cc hi hc w cm di f voa dv dve q`.
- `Index` (`lib/data.ts`): `craftedFrom` is `Map<string, string>` (one
  source per target); readers: `RecordCard`, `RowMain`, `share.ts`,
  `data.test.ts`. `allEquip` feeds `equipOfKind`, `upgradeLine`, the
  facets' presence filters. `searchable` feeds `SearchPage` only. `rows`
  feeds the roll panels, `TablesPage`, `facets.ts`, `sections.ts`,
  `std.ts`.
- `TABLE_IDS` (16) is read by `isTableId`, `groupsFor`, `PLAIN_GROUPS`,
  `TABLE_GROUPS`, `SUB_LABEL`, `pinOf`, `routes.json`; `TABLES_RE` admits
  `[a-z_]+` names and `[A-Za-z0-9_.-]+` tails, so `homebrew` and an anchor
  `hb_<16>` fit the grammar.
- `EQ_SRC` (`facets.ts`) is a fixed list filtered by presence in
  `allEquip`; `srcName(key, lang)` names the five books and falls back to
  `frameName`.
- `hasLabels` (`desc.ts`) is true for `eq` and `src === 'voa'` only.
- `hayFor` caches by id; `SearchPage` derives it from `statLine`.
- `RowMain` draws one craft line (`craftFrom`, `craftInto`), badges, the
  `src` badge; `RecordCard` draws the ladder (`upgradeLine`), both craft
  lines, the set line with the bonus, the refs as `<details>`.
- `AccountMenu.svelte` draws «Аккаунт», «Мои списки», «Выйти» as
  `role="menuitem"` children; R7 inserts one `<a>`.
- `list_entries` (`20260925130100_lists.sql`): the R2 CHECK and the
  16384 bound named `list_entries_snapshot_size`; `unique (list_id,
  item_key)`; `apply_list_writes` takes `source` and `snapshot`.
- `CloudPort` at `b38bc5ab`: `auth`, `prefs`, `lists` (`newId`, `list`,
  `apply`, `move`), `shares`, `events` (`subscribe`, `tab`), `requests`
  (R4 `B4.2` wires the fake now).
- R6 as planned (`287ba73b`): the account zip holds `lists.json`; R7 adds
  `homebrew.json` with its own format and schema (R6 plan 4.8 and 4.14);
  `import_lists` passes `source` and `snapshot` through; a v1 reader
  refuses `version` 2 and `source: homebrew`; `BatchBar` and the import
  panel ship in `B6.2`.
- Gate costs on this host (2026-09-27, `.claude/README.md`): `check` 7-10
  min, `check:db` 9-10 min, a golden shard 3.2 min, `app/states` 4-5 min,
  `app/contracts` 7 min, `sweep 360` 7-9 min, `e2e` 2-3 min.
- The mocks: `mocks/index.html`, m01-m17 (`plan.md` section 8).

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
