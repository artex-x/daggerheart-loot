# Plan - TASK persist-7-homebrew (homebrew releases R7, R7b, R7c, R7d)

## Status

- Planning pass 4 (phase B), 2026-09-30, planner, on `main` at `7005abeb`
  (R4 at `88c9f8bc`, R6 at `885d2978`, R4b and the toast change at
  `ec573cd8`-`f39534d7`: all shipped). Phase B applied every owner answer
  (section 9), split the work into four releases (`Q6`, section 7), updated
  m02 and m22 for the `Q12` revision, wrote the decisions (section 10) and
  expanded `B7.1` to implement-ready steps (section 14). The same day it
  applied the owner's answers after pass 4 (`context.md`): `Q14` = A (the
  budget steps, 4.10 and 7.1) and the catalog `craft` becomes a list
  (`B7c.1`, 7.3). The plan review (`reviews/plan-B7.1.md`,
  fix-then-continue) is applied in one text pass (section 13, item 6).
- NEEDS_HUMAN_CONFIRMATION: no - every owner question is answered.
- Plan review: required before B7.1 (trigger: a migration with SECURITY DEFINER functions - `my_limit`, the trigger functions, the re-created `get_shared_list` and `clone_shared_list`; a stored-data change on `list_entries` - its snapshot checks replaced and its bound widened; a new write path - the homebrew rows; public contract changes later in R7 - the `#/homebrew` routes and the reserved `hb_` prefix in `B7.2`)
- The review reads the whole plan. R7b, R7c and R7d each move to their own
  task directory at R7's closeout (section 7.5) and carry their own
  `Plan review:` line there: R7b (a table id), R7c (a public contract
  change - the catalog `craft` shape in `data.json` - and a migration) and
  R7d (a migration and two public schemas) each fire a trigger. R7c's line
  reads `- Plan review: required before B7c.1 (trigger: a public contract
  change - the catalog `craft` as a list; a migration in B7c.2)`.
- Batches:

| Release | Task id | Batch | Status |
|---|---|---|---|
| R7 | `persist-7-homebrew` | `B7.1` schema, ports, pure logic | implement-ready (section 14) |
| R7 | | `B7.2` the account's pages and the editor | outline (7.1) |
| R7 | | `B7.3` homebrew in lists, the quick item | outline (7.1) |
| R7b | `persist-7b-homebrew-catalog` | `B7b.1` tables, search, filters, chip | outline (7.2) |
| R7c | `persist-7c-homebrew-relations` | `B7c.1` the catalog `craft` as a list (public contract) | outline (7.3) |
| R7c | | `B7c.2` cards, relations schema and logic | outline (7.3) |
| R7c | | `B7c.3` the editor's relations, the cards panel | outline (7.3) |
| R7c | | `B7c.4` relations on catalog cards and rows | outline (7.3) |
| R7d | `persist-7d-homebrew-files` | `B7d.1` import RPC, two schemas, `llms.txt` | outline (7.4) |
| R7d | | `B7d.2` import and export UI, the zip | outline (7.4) |

- Name change: pass 3's "R7b" (the files release) is R7d now; pass 3's
  `B7.4` (the catalog pages) is R7b; the relations of pass 3's `B7.1`,
  `B7.2` and `B7.4` are R7c.
- What pass 4 changed against pass 3: no `draft` column, badge, banner or
  «Черновики» group (`Q12` revised); the item limit is 100 (`Q3`); the
  source tag is the text «<source> (HB)» (`Q5`); no «Другой язык» fold, the
  editor edits the item's own language (`Q4`); four releases (`Q6`);
  `my_limit()` for the counter; the catalog `craft` becomes a list of ids
  in `B7c.1` (`Q11` follow-up, section 9); `owner_id` dropped from the client
  row shapes (no reader yet); the homebrew Realtime event carries only
  `by`; the snapshot drops `section` and carries `book.section`; the file
  bounds follow the import call's ceilings (task `limits-follow-overrides`).

## 1. Objective and current state

Homebrew items in a signed-in account as first-class catalog records: the
same shape as an official record, grouped by the author's sources and
sections, related to catalog items, added to lists as live references,
frozen when a copy leaves the account, printed as any card, and moved by
file. Four releases deliver it (section 7).

State at `7005abeb` (unchanged since pass 3 read `14e6dcf9`: `git diff
14e6dcf9 7005abeb -- supabase app/src/ports` is empty):

- `list_entries.source` and `snapshot` exist and are never written:
  `source` is always `official`, `snapshot` null. R2's column CHECK
  `(source = 'official') = (snapshot is null)` (Postgres named it
  `list_entries_snapshot_check`; confirm) and `list_entries_snapshot_size`
  (16384 bytes) are in `20260925130100_lists.sql`. `apply_list_writes` and
  `import_lists` insert `source` and `snapshot` from `jsonb_to_recordset`
  (a JSON `null` becomes SQL null); `get_shared_list` projects them;
  `clone_shared_list` copies them with `nullif(e -> 'snapshot', 'null')`.
- `CloudPort` is `auth`, `prefs`, `lists`, `shares`, `events`, `requests`;
  `lazyCloud` wraps each member; the contract has cases A-L.
- `limit_defaults` holds four keys; `effective_limit()` has no grant to
  `anon` or `authenticated`.
- The owner topic carries `list` and `request` events; `lib/live.ts`
  ignores any other event name.
- `Index` (`lib/data.ts`): `byId`, `all`, `rows`, `searchable`,
  `allEquip`, `craftedFrom` (one source per target), `setMembers`,
  `rarityOf`, `altRow`, `altColumn`, `refs`, `sets`. `Record_.craft` is one
  id; 17 catalog records carry it and no target has two sources.
- R4b (`ec573cd8`): `RequestsPanel` names lines, decided ones included,
  through `app.index?.byId`; `SharedListPage` takes an `index` prop and
  asks `index.byId.has` to keep an entry. The toast change (`f39534d7`):
  `AppState.say` takes a `Msg` built in the language on screen; every new
  toast in R7 is a `Msg`.
- The bundle budget (`tools/bundle-budget.mjs`): 203.0 kB of 210 configured
  and 144.9 kB of 150 unconfigured (measured 2026-09-30). R7's pages do not
  fit the headroom: the budgets step up per batch to 250 and 190 kB (`Q14`,
  7.1).

The catalog (`data.js`, 1272 records): `craft` on 17, `refs` on 13, `eq` on
604 (288 in 72 upgrade lines, every line one picture; `alt` on 20),
`community` on 90, `frame` on 95, `tier` `A` 9 and `C` 5, `recall` on 102
(drawn nowhere), `set` on 5 (two sets), `starting` 30. Armour carries `as`
2-8 and `th` up to 48; weapon `dmg` is `d4`-`d20` with `+1`..`+15`. An
artifact weapon (`voa4_a3`) has `tier: 'A'` on the record and on `eq`. No
id starts with `hb`.

## 2. Scope and non-goals

- R7 (items): two tables (`homebrew_books` with sections, `homebrew_items`)
  with owner-only row level security and count limits; the item content
  (section 4.1, the R7 subset); keys `hb_` + 16 base32; `my_limit()`; the
  reference and frozen-copy rules on `list_entries`; the shared projection
  and the copy; the Realtime `homebrew` event; the port, the fake, the
  store; `#/homebrew`, `#/homebrew/new`, `#/homebrew/<key>`, `#/i/<key>`;
  the account menu entry; the editor with its failure states and guard;
  own records in `byId`; lists, shared pages, the lists index, print and
  the requests panel resolving references and frozen copies; the quick item
  from a list page; deletion; account deletion.
- R7b (catalog pages): the `homebrew` table, own equipment in the equipment
  tables, dynamic `src` values and the `sect` facet, one merged search with
  the intro counter, the «Хоумбрю» chip.
- R7c (relations): the catalog's `craft` as a list of ids (`B7c.1`, a
  public contract change); `homebrew_cards` (sets and rule cards), `eq.line`,
  `craft`, `craft_from` (lists of up to 8), `set`, `refs`; the snapshot
  with cards; the derivations over the merged index; the editor's
  «Связи» and the «Карты» panel; relations drawn on catalog cards and rows.
- R7d (files): `schema/homebrew-v1.json`, `schema/import-v2.json`,
  `import_homebrew`, `llms.txt` with a blind round, import with the source
  mapping and skip or update, the downloads, `homebrew.json` in the zip.
- Non-goals: art (R8); `#/h/<token>`, clone and add from an item link,
  print routes for cloud lists (R9); books shared with other users (item
  13); a second-language UI (`Q4`); moving items between sources in bulk; a
  Trash (decision 30); homebrew in the roll pages (owner); `roll`, `frame`,
  `starting`, `recall`, `community` on a homebrew record; a per-field write
  buffer in the editor; `img` in the file format before R8.

## 3. The gap audit (item 12)

Every surface that touches a catalog record, what differs for a homebrew
record, and where the plan puts it. "-" is out by design.

| # | Surface | What differs | Decision | Where |
|---|---|---|---|---|
| G1 | The seven roll pages | Pools read `index.rows` and `LOOT.alt` | Excluded by the owner; the shape keeps a later `roll` open (4.13) | - |
| G2 | `#/tables/eq_*` | `equipOfKind` reads `allEquip`; `src` lists `EQ_SRC` | Own equipment joins `allEquip`; `src` gains `hb` and each source key | R7b |
| G3 | The book tables | A book's own rows | Not drawn there; the `homebrew` table instead | - |
| G4 | A table for homebrew | None | `homebrew` in `TABLE_IDS` (a contract change), group chip signed in only, sections by source and section, facets `kind`, `src`, `sect` | R7b |
| G5 | Filter grammar | Fixed `src` keys | Dynamic values `hb`, `hb_<16>`; an unknown value empties the table (today's rule) | R7b |
| G6 | With / without homebrew | None | Memory-only chip «Хоумбрю» on `#/search` and the equipment tables | R7b |
| G7 | A table's own search box, section links, tiles | Work over rows | Nothing to change; no number badge | R7b |
| G8 | `#/search` | Official only | One merged list, official first, the 300 cap over all; the intro adds «И N ваших предметов.» | R7b |
| G9 | `#/i/<id>` | Not found | The owner's item resolves; the path «Хоумбрю · Мастерская Ольхи · Пистоли · Ранг 2»; «Изменить»; another account: not found | `B7.2` |
| G10 | The record modal | Same card | «Изменить» for an own live item, none for a frozen copy | `B7.2` |
| G11 | The card's ladder, craft lines, set line, refs | Unknown keys | Derived over the merged index; «(HB)» names, a dashed rung, the fold | `B7c.4` |
| G12 | `RowMain` | Same in one line | The source tag «... (HB)» (`B7.2`); the first relation name plus «и ещё N» (`B7c.4`) | `B7.2`, `B7c.4` |
| G13 | `RecordActions` | `recordUrl` names a stub that does not exist | The app address for a `hb_` id; copy image hidden with no art | `B7.2` |
| G14 | `#/print/<ids>` | Resolves through `app.index` | An own or a frozen (own list) id prints; the source line is the path; a viewer's frozen copy: `DEBT.md` under R9 | `B7.3` |
| G15 | Add-to-list | `entryRowsOf` writes `official` | A resolver writes a reference for an own item, the carried snapshot for a frozen row | `B7.1` (the database), `B7.3` |
| G16 | The list page | `byId` over `own.ids` | One derived index per page (`withRecords` with the list's snapshots); undo restores `source` and `snapshot` | `B7.3` |
| G17 | The lists index | `knownItems` reads `app.index` | Through the list's snapshots too | `B7.3` |
| G18 | `#/s/<token>` | Unknown ids dropped | The projection fills a reference's snapshot; the page merges snapshots | `B7.1`, `B7.3` |
| G19 | Purchase requests | Names through `app.index?.byId` | Names through the list's derived index, decided lines included | `B7.3` |
| G20 | «Сохранить себе», add-to-my-list | Copy `source`, `snapshot` | The copy freezes unless the caller owns the list; add-to-my-list writes the carried snapshot | `B7.1`, `B7.3` |
| G21 | Realtime | An item edit bumps nothing | The item and source touch triggers bump referencing lists; a `homebrew` event on `owner:<uid>` refreshes the store | `B7.1`, `B7.2` |
| G22 | Export | v1 refuses `source: homebrew` | `import-v2`, `homebrew.json` in the zip, the account hint | R7d |
| G23 | Import | Passes `source`, `snapshot` | v2 entries frozen, or references when the account holds the key; `import_homebrew` | R7d |
| G24 | `llms.txt`, `schema/` | Nothing | Two sections, two schemas, a blind round | R7d |
| G25 | `catalog.csv`, `data.json`, `i/`, `og/` | Generated from `data.js` | Never carry a homebrew record; `llms.txt` says so | R7d |
| G26 | `#/account` | Zip hint; `delete_account()` | The cascade (`B7.1`); the hint (R7d) | `B7.1`, R7d |
| G27 | The account menu | Three entries | «Мои предметы» between «Мои списки» and «Выйти» | `B7.2` |
| G28 | Language switch | English never falls back | `recordOf` fills a missing language from the other | `B7.1` |
| G29 | `hasLabels` | Equipment and Vault of Ages only | True for `src === 'homebrew'` | `B7.2` |
| G30 | Signed out, unconfigured | - | `#/homebrew*` signed out: the sign-in prompt; unconfigured: not found, address kept; `#/tables/homebrew` the same in R7b | `B7.2`, R7b |
| G31 | Storage, two tabs, `STATE.md` | Nothing local | Nothing of homebrew in `localStorage`; `STATE.md` says so | `B7.2` |
| G32 | `privacy`, `terms` | Name "homebrew items" | Check that the wording covers sources and cards | `B7.2` |
| G33 | Usage report | Counts every `public` table | The test's table list and the items near-limit counts | `B7.1` |
| G34 | Keyboard, screen readers | New controls | axe on every open state; the fold a button with `aria-expanded`; the picker a combobox | `B7.2`, R7b, R7c |
| G35 | Roll "copy every option" | Roll pages excluded | - | - |
| G36 | The `#/l/` codec | Official ids only | Nothing: a browser list never holds a homebrew entry | - |
| G37 | A set filter or page | None for official records | Deferred with them | - |
| G38 | The art slot | `_none.webp` | R8 | R8 |
| G39 | A list page's own add path | None | «+ Свой предмет» makes a plain item and a reference (`Q12` revised) | `B7.3` |
| G40 | Sections inside a source | None | Sections, the path leaf (`B7.1`, `B7.2`), the `sect` facet (R7b) | `B7.1`, `B7.2`, R7b |
| G41 | Several craft links | One `craft` id | The catalog's `craft` becomes a list (`B7c.1`); up to 8 each way for homebrew | `B7c.1`-`B7c.4` |
| G42 | Form failure states | No pattern | Required marks, the summary, field lines, refused-save lines, the revision banner | `B7.1` (revision), `B7.2` |

## 4. Design

### 4.1 The record shape (items 1, 2; `Q4`, `Q11`)

A homebrew item's stored part is `HomebrewContent`; the record the app
draws is `recordOf(key, content, book)` (`lib/homebrew.ts`), the same
object the database's `homebrew_snapshot_of` writes.

```ts
/* lib/homebrew.ts - pure. R7 stores these keys; R7c adds the marked ones. */
export interface HomebrewContent {
  kind: 'item' | 'consumable' | 'equip';
  en?: string; ru?: string;        // 0..120 code points each; at least one holds a non-space character
  ende?: string; rud?: string;     // 0..3000 code points each
  tier?: 1 | 2 | 3 | 4 | 'A' | 'C'; // loot only
  eq?: HomebrewEquip;              // iff kind === 'equip'
  section?: string;                // a hb_ key of a section of the item's source
  // R7c: craft?: string[]; craft_from?: string[]; set?: string; refs?: string[];
}
export interface HomebrewEquip {
  t: 'weapon' | 'secondary' | 'armor';
  tier: 1 | 2 | 3 | 4 | 'A';       // typed by the author, never derived
  cls?: 'phy' | 'mag'; tr?: Trait; rg?: Range; dmg?: string; dt?: 'phy' | 'mag' | 'any';
  bu?: 1 | 2 | 'any'; as?: number; th?: [number, number];
  alt?: { tr: Trait; rg: Range; dmg: string; dt: 'phy' | 'mag' | 'any' };
  // R7c: line?: string;
}
```

- Field names are the catalog's (`data.json`). Absent means "not
  applicable" (the catalog writes `null`); the validators refuse `null`.
- A book's own fields never appear: `roll`, `frame`, `starting`,
  `community`, `recall`, and `img` until R8.
- `Q11` (answered: up to 8 each way; follow-up: one shape everywhere):
  R7c adds `craft` and `craft_from` as lists of 1-8 unique ids, never the
  item's own key. `B7c.1` first turns the catalog's `craft` into a list of
  ids in `data.js` and `data.json` (a public contract change, 7.3), so
  `Record_.craft` is `readonly string[]` for every record.
- `Q4` (answered: bilingual stored, no second-language UI): the stored
  shape holds both languages, each optional, one name required;
  `recordOf` fills a missing language from the other, so `nameOf` and
  `descOf` need no change. The editor edits one language, the item's own
  (4.10); only a file import (R7d) fills both. Migration cost, recorded:
  one language plus a `lang` field would need, later, a rewrite of every
  `content` and every frozen `snapshot`, a validator replacement and a
  `homebrew-v2` file; both languages now cost nothing later.
- `recordOf(key, c, book)`: every field of `c` except `section`, then `id:
  key`, `src: 'homebrew'`, `en`/`ru`/`ende`/`rud` each filled from the other
  language (else `''`), `tier: 'A'` when `c.eq?.tier === 'A'` (the
  catalog's artifact rule), and `book: { key, en, ru, section? }` when the
  item names a source; `section: { key, en, ru }` only when the source
  holds the item's section key. A key the source does not hold draws as no
  section, everywhere.
- Size: names 120 and descriptions 3000 code points per language; a
  maximal item written in 4-byte characters is about 26 KB of JSON, its
  snapshot with a maximal source about 28 KB, under the 32768-byte bound.
  The bound holds because the validators refuse the C0 control characters
  except tab and newline (review R1): `jsonb::text` writes such a character
  as `\u00XX`, 6 bytes, while every character a name or a text may hold
  takes at most 4 bytes (`"`, `\`, tab and newline escape to 2). A text
  with `\r` is refused: the editor's textarea gives `\n` only, and R7d's
  import turns `\r\n` and `\r` into `\n` before it validates.

### 4.2 Sources: «Источник», `book` (items 9, 13; `Q5`, `Q9`, `Q10`)

- `homebrew_books(id, owner_id, key, content { en?, ru?, sections? },
  revision, created_at, updated_at)`, `unique (owner_id, key)`, limit
  `homebrew_books_per_owner` 20. Names 1..80 code points, one language
  required. `sections [{ key, en?, ru? }]`, at most 30, one name each
  (4.14 F4, `Q10`). Section keys are unique in the source by the database's
  validator; section names are unique in the source by the client only,
  compared without case, as source names are (review nit 4).
- `homebrew_items.book_id uuid null references homebrew_books on delete
  set null`: null is the default source «Хоумбрю» / "Homebrew". Deleting a
  source keeps its items in the default source.
- UI word «Источник» / "Source"; code and schema word `book`, apart from
  `list_entries.source` (`official` | `homebrew`).
- `Q5` (answered: plain text): the source tag reads «Мастерская Ольхи (HB)»
  / "Alder Workshop (HB)" in the ordinary source badge style, and the
  default source's tag reads «Хоумбрю» / "Homebrew" (its name already says
  it). What else marks homebrew: a homebrew name inside a relation line
  reads «<name> (HB)» (R7c); a homebrew rung on an upgrade ladder, which
  has no text, takes a dashed border and the title «<source> (HB)» (R7c).
  Nothing else changes on a catalog card. "(HB)" is the same Latin text in
  both languages (the owner's wording).
- The path (`whereFrom`, the record page's sub line and the print source
  line) reads «Хоумбрю · Мастерская Ольхи · Пистоли» (the group, the
  source, the section), or «Хоумбрю» alone for the default source.
- `srcOf(it)` answers `it.book?.key ?? 'hb'` for the facets (R7b);
  `tableOf` answers `homebrew` (R7b); `printSrc` follows `whereFrom`.
- Sources are made on `#/homebrew` and inline from the editor (4.14 F2);
  an import creates the file's sources through a mapping (4.14 F3, R7d).

### 4.3 Cards: sets and rule cards (R7c)

`homebrew_cards(id, owner_id, kind 'set' | 'ref', key, book_id null,
content, revision, created_at, updated_at)`, `unique (owner_id, key)`,
limit `homebrew_cards_per_owner` 100. `content` is `SetCard` (`en`, `ru`,
`ende`, `rud`; names 1..80, texts 0..1200) or `RefCard` (`en`, `ru`,
`ensub`, `rusub`, `ende`, `rud`, `url` optional `https:` 0..300; subs
0..60), one language required. The merged index's `sets` and `refs` are the
catalog's plus the account's. An item may name a catalog set or card as
well as an own one. The label «Карты правил» for `refs` is confirmed. Cards
are made in the «Карты» panel on `#/homebrew` and inline from the editor
(4.14 F7). A deleted card's key stays on the items and draws nothing.
Rejected: the set card on one member; cards inside the source row; two
tables.

### 4.4 Relations across the boundary (items 3-6; R7c)

- Storage: keys on the homebrew item (`craft`, `craft_from`, `eq.line`,
  `set`, `refs`); an official record is never written.
- Derivation over the merged index: `upgradesTo(id)` = records whose
  `craft_from` holds `id` plus the records `craft` names; `madeFrom(id)` =
  records whose `craft` holds `id` plus the records `craft_from` names;
  each deduplicated, official first. `B7c.1` replaces `Index.craftedFrom`
  with them over the catalog (readers: `RecordCard`, `RowMain`,
  `share.ts`, `data.test.ts`); `B7c.2` adds own records and `craft_from`.
  `setMembers` groups own records too; `upgradeLine` filters `allEquip`
  by `eq.line`; a frozen copy is appended to its own ladder.
- Display (item 4): a craft line with more than three names draws three,
  then «и ещё N» (a button with `aria-expanded`); a row draws the first
  name and the count. Copied text writes every target.
- Marking (item 5, `Q5`): 4.2.
- Visibility (item 6): only the signed-in account's own rows join the
  derivations; a frozen copy joins `byId` alone.

### 4.5 Tier progression and "unique" (item 1; `Q1`)

`Q1` (answered: the existing mechanism): "unique" is a one-off outside any
upgrade line - an absent `eq.line`, drawn as the «Уникальное» badge and
offered by the `line` facet as `uniq`; no new flag. Artifact is `eq.tier:
'A'`. In R7 every homebrew equipment item is a one-off. R7c adds the
editor's «Линия улучшений» `Seg` («Уникальный» / «В линии» with a picker /
«Новая линия») and a dashed rung on an official ladder. R8 reuses the line
for art (the line's picture).

### 4.6 The merged index and where homebrew appears (items 10, 11)

`withRecords(base, own, frozen)` in `lib/homebrew.ts`, grown per release:

| Field | R7 | R7b | R7c |
|---|---|---|---|
| `byId` | own records; frozen copies where the key is not own | - | - |
| `searchable`, `allEquip` | catalog only | own records after the catalog's | - |
| `rows` | catalog only | a `homebrew` key: own records by source and section | - |
| derivations, `sets`, `refs` | catalog only | - | own records and cards; a frozen copy's embedded cards for its own card |

It returns `base` itself when `own` and `frozen` are empty, so a
signed-out build keeps today's index object. `AppState.index` becomes
`$derived(withRecords(base, homebrew.own, []))` (`B7.2`); a list, shared,
lists-index or print page derives `withRecords(app.index, none,
snapshots)` (`B7.3`). The index never holds the editor's own draft.

R7b's table, facets, chip and search follow pass 3 (`Q2` answered: a table
page of its own): `TABLE_IDS` gains `homebrew`; `TABLE_GROUPS` gains `{ id:
'hb', label: 'srcHomebrew', top: 'homebrew', subs: ['homebrew'] }` last,
its chip drawn only signed in; `PLAIN_GROUPS.homebrew = ['kind', 'src',
'sect']`; the equipment tables' `src` facet appends `hb` and each source
key after `EQ_SRC`; the chip `app.homebrewShown` (memory only, default
true) sits beside the kind chips on `#/search` and in the equipment
tables' toolbar while the account holds an item. The search intro keeps
the catalog count (1272, pinned by `tests/derived.js`) and adds «И N ваших
предметов.» / "And N of your items." when N > 0 (the owner's answer).

### 4.7 Schema

- R7 (`B7.1`): one migration `<stamp>_homebrew.sql` and its reversal;
  section 14 step 1 gives every object. In short: the two limit rows; the
  validators `homebrew_key_ok`, `homebrew_names_ok`, `homebrew_text_ok`,
  `homebrew_content_valid`, `homebrew_book_valid`, the formula
  `homebrew_snapshot_of(key, content, book)` and `homebrew_snapshot_valid`;
  the two tables with row level security; pin, limit, touch, before-delete
  and broadcast triggers; the `list_entries` checks and the
  reference-exists trigger; `my_limit(key)`; `get_shared_list` and
  `clone_shared_list` re-created.
- R7c (`B7c.2`): `homebrew_cards` with its limit (`homebrew_cards_per_owner`
  100), pin, touch and broadcast triggers; `homebrew_content_valid` and
  `homebrew_snapshot_valid` replaced to admit `eq.line`, `craft`,
  `craft_from` (1-8 unique ids), `set` and `refs` (at most 3) and the
  snapshot's `cards`; `homebrew_snapshot_of` replaced by a form that takes
  the item's cards (an immutable function cannot read a table: a fourth
  argument); the `list_entries` bound revisited (a maximal item with three
  maximal rule cards and a set card passes 32768 bytes: raise the bound to
  65536 or cap the card texts; `B7c.2` decides and records it). A
  validator only widens: a snapshot frozen under R7 stays valid.
- R7d (`B7d.1`): `import_homebrew(p_books, p_cards, p_items, p_update)
  returns jsonb`, security invoker, one transaction, per-call ceilings
  (never the default limits), skip or update of held keys, a held
  source's sections always merged and its name written only on update.

### 4.8 References and frozen copies

The 2026-09-26 rule holds, amended by
`docs/decisions/2026-09-30-a-frozen-copy-embeds-its-source-a-reference-must-exist.md`:
an own item in an own list is a reference (`source 'homebrew'`, `snapshot`
null) drawn from the merged index; a copy that leaves the account is
frozen by `homebrew_snapshot_of`. The snapshot carries `book` (the tag and
the path) and, from R7c, the cards. `list_entries` checks the snapshot's
shape and that its `id` is the entry's `item_key`; the bound is 32768
bytes. A trigger refuses a reference whose key the list's owner does not
hold, on every write path (`apply_list_writes`, `import_lists`,
`clone_shared_list`), and takes `for key share` on the item so a
concurrent delete waits and then removes the new reference. A copy of a
list decides each entry from the source row, not from the projection
(which carries a snapshot for both kinds): an entry that is a reference in
the source stays a reference only when the caller owns the source list; a
frozen entry stays frozen for everyone (review blocker 1). `B7.3`'s
resolver writes a reference for an own item, the carried snapshot for a
frozen row, `official` otherwise; `restoreEntry` rewrites what it
removed.

### 4.9 Ports and state

- `HomebrewRepository` (`B7.1`, section 14 step 5): `newId`, `newKey`,
  `load` (books, items and `itemLimit` from `my_limit`), and create,
  update and remove per kind as plain PostgREST writes. An update names the
  revision the form loaded; `null` writes without it (the banner's
  «Сохранить мою версию»). It answers `conflict` when the row is newer and
  `gone` when it is deleted. An update whose answer was lost and that is
  sent again finds the row at a newer revision holding exactly the patch:
  it answers `ok` with that revision, not `conflict` (review R2). A
  `my_limit` read that fails does not fail `load`: `itemLimit` is then
  null and the page draws «Мои предметы: N» (review nit 9). R7c adds cards;
  R7d adds `import`.
- The row shapes carry no `owner_id`: row level security keeps every row
  the author's in R7-R7d. Item 13's subscribed rows add it with the first
  reader (4.13).
- The fake (`B7.1`) seeds `gm1` with one source («Мастерская Ольхи», the
  sections «Пистоли» and «Холодное оружие») and four items: an equipment
  axe in «Холодное оружие», a Russian-only potion, an English-only cap and
  a plain ring; `gm2` has nothing. `B7.3` adds the reference row to list
  101 and the frozen row to list 201, with the goldens they move.
- The `Homebrew` store (`B7.2`, `state/homebrew.svelte.ts`): `status`,
  `books`, `items`, `itemLimit`, `own = $derived(...)`, `load`, `refresh`
  (on focus, on the `homebrew` event from another tab, every 45 s while a
  homebrew page is on screen), `clear` on sign-out, `save` and `remove` per
  kind, and the counts a delete confirm needs.

### 4.10 Routes, pages and the editor (item 7; `Q3`, `Q4`, `Q8`; `B7.2`)

- Routes: `#/homebrew`, `#/homebrew/new`, `#/homebrew/<key>` (`hb_` +
  16 of `a-z2-7`); no tab reads current. Entry points: the account menu's
  «Мои предметы», «Изменить» on an own record, the path line's table link
  (R7b). The routes and the reserved `hb_` prefix are public contracts
  (`ROUTES.md`, `CONTRACTS.md` sections 1 and 2, `routes.json`,
  `tests/contracts.js`).
- `#/homebrew` («Мои предметы», m02): the count line «Мои предметы: N из M»
  (M from `my_limit`, the owner's answer; «Мои предметы: N» when M is
  null); the «Источники» panel (the default and each source with its
  count, rename, delete with «Его N предметов останутся в «Хоумбрю».»,
  «Разделы» per source, «+ Новый источник»); «+ Новый предмет»; the items
  as `TableRows` under one heading per source and section (sections in the
  author's order, «без раздела» last as the source name, the default last);
  a row opens the editor; its tick feeds the selection bar (add to a list,
  print, copy) and R6's `BatchBar` («Удалить (N)»). Empty: «Своих
  предметов пока нет - создайте первый.» (R7d adds «...или импортируйте
  файл»). Signed out: the head and `SignInPrompt`; unconfigured: not
  found, address kept. The «Карты» fold is R7c; the import and download
  buttons are R7d.
- The editor (m04, m05, m18, m19, m20; the m04/m05 relations fieldset and
  the «Другой язык» fold are not drawn): a `Panel` with the form and the
  live compact `RecordCard` preview of `recordOf(draft)` beside it at 960
  px, under it at 360 px. Fields: Вид (`Seg`); for equipment the type
  `Seg`; Источник (a `<select>` plus «+ Новый источник...», m18) and Раздел
  (for a named source, plus «+ Новый раздел...», m19); Название and
  Описание; Ранг; the weapon or armour fields; «Второй набор
  характеристик» folded (`alt`). Buttons «Сохранить» (primary), «Отмена»,
  «Удалить» (danger, an existing item).
- `Q4`, the edited language: the name and description fields bind to the
  item's own language - the UI language for a new item; for an existing
  one the language that holds its name, and the UI language when both do.
  The labels follow the UI. The other language's text is kept untouched
  on save. A quick item (4.14 F8) writes the UI language.
- `Q8` (answered: the save button with the guard): leaving the route with a
  dirty form asks through `env.dialog.confirm` («Изменения не сохранены.
  Уйти?»), closing the tab through a `beforeunload` handler behind
  `PagePort` (a new method, `B7.2`), and Ctrl+S submits. Failure states:
  4.14 F5.
- `Q14` (answered: A): a batch whose `check:built` passes a budget raises
  that budget in `tools/bundle-budget.mjs` to its measured size plus about 5
  kB, in the same commit, with a decision file; the ceilings are 250 kB
  configured and 190 kB unconfigured for R7-R7d. A batch that would pass a
  ceiling stops and asks the owner.
- `Q3` (answered: 100): the refused-save line reads «Не сохранено:
  достигнут предел своих предметов - 100. ...» with the database's number
  (`limitText` gains the two homebrew keys, `B7.2`).

### 4.11 Files, `llms.txt`, import and export (item 8; R7d)

Pass 3's design stands (both formats public contracts in `CONTRACTS.md`
section 4, `additionalProperties: false`, fixtures, `llms.txt` sections
proven by a blind round), with these changes:

- The bounds of both files are the import call's ceilings, never the
  default limits (task `limits-follow-overrides`, owner's answer to its
  `Q1`, 2026-09-30). `import-v2` is `import-v1` plus homebrew entries; it
  inherits v1's entries bound (5000 after that task) and the lists-per-call
  ceiling that task's migration sets (its `Q2` answer; its uncommitted
  `20260930120000_import_lists_ceiling.sql` reads 1000 lists per call).
  `B7d.1` reads that task's result before it writes the schema.
- `import_lists` needs no change for v2: the client turns an entry whose
  key the account holds into a reference, and the reference-exists trigger
  guards the rest. A v2 frozen entry must send `snapshot` as a JSON object
  (a JSON `null` becomes SQL null in `jsonb_to_recordset` and would read as
  a reference).
- `Q7` (answered: skip or update, default skip), `Q9` (answered:
  automatic sources with the per-source «Куда» mapping): as 4.14 F3.
- No `draft` field (the mark does not exist).

### 4.12 Deletion, account deletion, monitoring

An item delete: the confirm counts the lists holding it (R7c adds the
relations naming it), then a hard delete; the before-delete trigger removes
the owner's references; other accounts' frozen copies stay. A source
delete keeps its items in the default source. A section delete keeps its
items in the source. No undo (decision 30). Account deletion: the cascade
from `auth.users`, in either order. Usage report (R11): the new tables are
counted by the existing table walk; the items near-limit counts join the
report (`B7.1`).

### 4.13 Item 13: what the releases must not close off

| Later need | Shape now | Cost later |
|---|---|---|
| A book id on the item, not a tag | `book_id` FK; `book` on the record | none |
| Stable references | per-owner `hb_` keys with 80 random bits; a subscribed item resolves by `(book, key)`; `list_entries` may gain `item_owner uuid null` | one additive column and a projection change |
| Visibility apart from ownership | owner-only RLS; a `homebrew_subscriptions(user_id, book_id)` table and a `select` policy are additive; the index merge takes "records visible to me" | one migration; the row shapes gain `owner_id` and the store `editable` |
| Subcategories | sections (D8) | none |
| Roll tables per book | `roll` refused | `roll` on the content, a `rows` entry per book, a roll panel that takes a book |
| Converting a catalog source into a book | the file format is the catalog's field names | a tool, no schema |
| Unsubscribing keeps list entries valid | an entry stores a key | the projection embeds a subscriber's snapshot, or the entry freezes on unsubscribe |

D7 (this direction) is written to `docs/decisions/` at R7's closeout.

### 4.14 Pass 3 answers to the owner's first mock review (F1-F8), as amended

- F1 - the example source name: the invented «Мастерская Ольхи» / "Alder
  Workshop" everywhere; code, fixtures, seeds, goldens and `llms.txt` use
  invented names only. Acceptance line in `B7.1` and `B7d.1`: `git grep -i
  -E "pistolheart"` outside `issues/` finds nothing.
- F2 - a new source from the editor (m18, `B7.2`): the source `<select>`
  ends with «+ Новый источник...»; choosing it swaps the select for a name
  field with «Создать» and «Отмена»; «Создать» writes the source at once
  and selects it. Refusals under the field: an empty name, a duplicate name
  (the client compares without case), the limit of 20, the network. The
  same pattern serves «+ Новый раздел...» (`B7.2`) and «+ новый комплект»,
  «+ новая карта» (`B7c.3`). A cancelled item can leave an empty source,
  listed with a zero count.
- F3 - sources on import (m15, R7d; `Q9`): the preview's «Куда положить
  предметы» row per file source, default: the held key, then a same-name
  source, then a new one; «Без источника» for items with no `book`; the
  client rewrites `book` before the call; sections join by key, then by
  name, else are added.
- F4 - sections (m02, m09, m12, m13, m19; `Q10`): D8. `#/homebrew`'s
  «Разделы» toggle per source (add, rename, delete); the editor's «Раздел»
  select, reset when the source changes; headings «Мастерская Ольхи ·
  Пистоли»; the path leaf; the `sect` facet and anchors in R7b.
- F5 - failure states and required fields (m20, `B7.2`; the revision check
  in `B7.1`): the form checks on «Сохранить» only. A failed submit draws
  the `.errs` box at the top (`role="alert"`, `tabindex="-1"`, focused)
  with «Не сохранено: исправьте N полей.» and one link per problem; each
  field draws its `.err` line, `aria-invalid`, `aria-describedby`; an
  error clears on the field's next change. A required field that can be
  empty carries a red asterisk and `aria-required="true"`; the legend «* -
  обязательное поле. Остальное можно заполнить позже.» heads the form. The
  rules below run in `lib/homebrew.ts` and in the SQL validators over one
  fixture set, so a form that passes never meets a CHECK refusal.

| Field | Kind | Rule |
|---|---|---|
| `kind`, `eq.t` | all | always set: the segments have a default |
| the name (`en` or `ru`) | all | required: 1-120 characters in the edited language |
| the description | all | optional, 0-3000; a counter past 2500 |
| `book`, `section` | all | optional: none is «Хоумбрю»; a section needs a named source and one of its sections |
| `tier` | loot | optional: «Нет», 1-4, «Артефакт», «Проклятый» |
| `eq.tier` | equipment | required, no default: 1-4 or «Артефакт» |
| `cls`, `tr`, `rg`, `dmg`, `dt`, `bu` | weapon, secondary | required; `dmg` is `d4`-`d20` with an optional `+1`..`+20` |
| `as`, `th` | armour | required: `as` 0-12, `th` two whole numbers 1-99, the second larger |
| `alt` | weapon, secondary | optional; once one of its four fields is set, all four are required |
| `eq.line`, `craft`, `craft_from`, `set`, `refs` | all | R7c: 4.14 F6, F7 |
| the quick item | list page | the name only; the description optional |

  A refused save keeps the form and the guard armed, with one line under
  the buttons: the limit (4.10) or the network («Не удалось сохранить - нет
  связи. Правки остались в форме: нажмите «Сохранить» ещё раз.»). A CHECK
  refusal the form did not predict reads as the network line and is a
  defect. `conflict` draws a warning `NoticeBox` with «Сохранить мою
  версию» (a forced write) and «Показать новую версию» (a reload; the guard
  asks first); `gone` draws «Сохранить как новый» (a new key) and «К моим
  предметам».
- F6 - several upgrade links (m04, m05, m12, m20; `Q11`; R7c): `craft` and
  `craft_from` hold 1-8 unique ids each, never the item itself; each id is
  one arrow. The editor stacks the chosen rows with a picker below
  («Добавить ещё»), disabled at 8. After `B7c.1` the catalog writes the same
  list; the `homebrew-v1` file takes a list only (no string form).
- F7 - rule cards (m21, m13, m12; R7c): the «Карты» panel with
  «Комплекты» and «Карты правил», each card row with its item count,
  «Изменить» and «Удалить»; the rule card form «Название карты» *,
  «Подзаголовок», «Текст карты» *, «Ссылка» (`https://`), «Источник»; the
  set form «Название комплекта» *, «Бонус комплекта» *; no «Другой язык»
  (`Q4`).
- F8 - the quick item from a list page (m22, `B7.3`; `Q12` revised, D9):
  an own account list (`isCloud`, not read-only) gains «+ Свой предмет», a
  toggle like «Поделиться». Its panel: «Название» * (1-120), «Описание»
  (0-3000), «Добавить в список», «Закрыть». One press makes two writes in
  order: the item (awaited; `kind: 'item'`, the UI language's name and
  description, the default source), then the entry through the list's
  write buffer as a reference (quantity 1, no price). The fields clear and
  focus returns to the name; a toast names the item. Failures: no name
  (the field's error); the item refused (the limit, the network: a line
  under the panel, the text kept); the entry refused (the item stays on
  `#/homebrew` in «Хоумбрю» and the list's own «Не сохранено · Повторить»
  takes over). Nothing marks the item. A browser list has no button (G36).
  The empty list's hint gains «...или добавьте свой предмет кнопкой «+
  Свой предмет».».

## 5. Contracts and behaviour that stay stable

`data.js`, `data.json`, `catalog.csv`, `i/`, `og/`, except the one
change the owner chose: `craft` becomes a list of ids (`B7c.1`; the bytes
of `catalog.csv` and of the `i/` pages do not change while every list holds
one id); the record ids and prefixes (`hb` reserved in `B7.2`); the route
grammar (routes added in `B7.2` and R7b, none changes meaning; the filter
grammar's groups per table unchanged, `src` gains values); the `#/l/`
encoding; `list_entries`' columns (an official row is exactly as before);
the share projection's shape (`snapshot` filled for a reference); the ten
sections and tabs; the sign-in prompt rule; the count-limit mechanism; the
print geometry; `import_lists`' signature and `import-v1` (the bound
widened by `limits-follow-overrides`); the account zip's layout (R7d adds
one root file, as its contract allows).

## 6. Tests, fixtures, documentation per batch (outline; `B7.1` is section 14)

| Batch | Layer 1 | Layer 2 (browser) | Layer 3 | Layer 4 | Docs |
|---|---|---|---|---|---|
| `B7.1` | section 14 | none | section 14 | contract case M after the approve | `COVERAGE.md`, `.claude/README.md` |
| `B7.2` | `homebrew.test.ts` (`withRecords` byId, `editLang`), `label.test.ts`, `desc.test.ts`, `hash.test.ts`, `share.test.ts` (`recordUrl`), `cloudLists.test.ts` (`limitText`), `live.test.ts` (the `homebrew` message), `homebrewStore.test.ts`, `homebrewPage.test.ts`, `homebrewEditor.test.ts` (every field, the marks and legend, the summary's focus and links, field errors clearing, the inline source and section, the refused-save lines, conflict and gone, the guard, Ctrl+S, the edited language, delete counts), `recordPage.test.ts`, `accountMenu.test.ts`, `app.test.ts`, `page.test.ts` (the unload guard), `a11y.test.ts` | states as `gm1`, `gm2`, signed out: `#/homebrew` (filled, «Разделы» open, empty, signed out), `#/homebrew/new` (empty, submitted with errors, the new-source field), `#/homebrew/<axe>` (the conflict banner), the delete confirm, `#/i/<axe>`, the menu open; goldens | none | `flows.mjs`: a source with a section, an item, an edit, a delete | `FEATURES.md` "Homebrew" (new), "Account", "Limits"; `ROUTES.md`; `CONTRACTS.md` 1, 2; `STATE.md`; `I18N.md`; `META.md`; `COVERAGE.md`; `routes.json`; `tests/contracts.js`; `llms.txt` (the routes line); `tests/app/inventory.js`; privacy pages if needed |
| `B7.3` | `listPage.test.ts` (a reference row, a frozen row, «Изменить» in the modal, undo of a removed homebrew entry, the quick item: two writes in order, the refusals, no button on a browser or read-only list), `sharedListPage.test.ts`, `listsPage.test.ts`, `requestsPanel.test.ts`, `cloudLists.test.ts` (the resolver), `printPage.test.ts`, `app.test.ts` | states: list 101 as gm1 (a reference; the panel open, after an add, refused), list 201 as gm2 (a frozen row), `#/s/player-token-1`, `#/print/<axe>-<potion>` both layouts; the goldens of lists 101, 201 and the shared page re-seeded | none | `flows.mjs`: add an own item as a reference, edit it, the projection carries the edit; a quick item | `FEATURES.md` "Lists", "Homebrew"; `STATE.md`; `COVERAGE.md`; `DEBT.md` (a viewer's frozen copy cannot print from the address, R9) |
| `B7b.1` | pass 3's `B7.4` row without relations: `label.test.ts`, `facets.test.ts`, `tables.test.ts`, `searchPage.test.ts` (merged, the chip, the intro counter), `tablesPage.test.ts`, `filterBar.test.ts`, `homebrew.test.ts` (`withRecords` R7b columns) | `#/tables/homebrew as gm1` (the `sect` facet open; signed out), `#/tables/eq_weapon as gm1` (chip on and off), `#/search as gm1`; goldens compared, then re-seeded for `as gm1` only | none | none | `FEATURES.md` "Tables and search"; `ROUTES.md`; `CONTRACTS.md` 1; `routes.json`; `llms.txt` URL line; `COVERAGE.md` |
| `B7c.1` | `data.test.ts` (`upgradesTo`/`madeFrom` over the catalog, a string read as a list of one), `share.test.ts`, `record.test.ts`, `tables.test.ts` | the goldens of the records with craft lines compared, none may move | none | none | `CONTRACTS.md` 4, `README.md` field meanings, `llms.txt` data lines, `tests/contracts.js`, `tests/derived.js`, `tests/dataint.js`, `tests/craft.js`, `.claude/prompts/add-source.prompt.md` |
| `B7c.2` | `homebrew.test.ts` (the R7c validators, snapshots with cards, the derivations over own records with deduplication), `data.test.ts`, fake and contract case N (cards) | none | `tests/db/homebrew-cards.test.mjs` (grants, RLS, validators, limit, touch, the widened snapshot validator, a snapshot frozen under R7 still valid) | case N after the approve | `COVERAGE.md` |
| `B7c.3` | `itemPicker.test.ts`, `homebrewEditor.test.ts` (relations, lists of 8, the line `Seg`, inline set and card forms), `homebrewPage.test.ts` (the «Карты» panel) | the picker open, the new-set and new-card forms, the «Карты» panel; goldens | none | `flows.mjs`: a rule card and two relations | `FEATURES.md` "Homebrew" |
| `B7c.4` | `recordCard.test.ts` (the fold, «(HB)» names, a dashed rung), `rowMain.test.ts`, `share.test.ts` | `#/i/ci1 as gm1` (fold closed, open), `#/i/q1 as gm1` (a dashed rung); signed-out goldens compared first, must not move | none | none | `FEATURES.md` "Records" |
| `B7d.1` | `bundle.test.ts` (v2), `homebrewFile.test.ts`, fake import | none | `tests/db/import-homebrew.test.mjs` | the import case after the approve | `CONTRACTS.md` 4, `llms.txt`, `tests/contracts.js`, `tests/derived.js` |
| `B7d.2` | `importItemsPanel.test.ts`, `homebrewPage.test.ts`, `accountPage.test.ts`, `zip.test.ts`, `app.test.ts` | the import panel states, the account page | none | export, delete, import with update | `FEATURES.md` "Homebrew", "Account"; `META.md`; `COVERAGE.md` |

## 7. Releases and batches: gates, cost, review, split criterion

Costs (`.claude/README.md`, "Batch size and the fixed cost of a run", this
host): `npm run check` 7-10 min, `check:db` 9-10 min, `build:test` plus
`check:built` 2 min, `app/states` 4-6 min, `app/contracts` 7 min, a golden
shard about 3.2 min (four shards 13 min; a compare then a re-seed 26 min),
`sweep.js 360` 7-9 min, `npm run e2e` 2-3 min, a blind round 5-10 min, a
closeout about 10 min.

`Q6` (answered: finer releases where a criterion supports it) gives four
releases, each deployable alone. The criterion of each release cut:

| Cut | Criterion |
|---|---|
| R7 \| R7b | R7 is complete alone (make, edit, list, share, print own items); R7b is a public-contract change (a table id) with its own review, on a different route and filter set (`#/tables/*`, `#/search`) |
| R7b \| R7c | a public contract change (the catalog `craft` shape) and a migration of its own (cards, the validator and snapshot replacements), with their own plan review; the catalog's own cards change for a signed-in reader |
| R7c \| R7d | two public schemas and `llms.txt` with a blind round; the file format goes last so v1 carries every field |

Rejected: a split per source (a source is the author's data, not code);
two releases (pass 3's shape, about two hours of gates fewer, but the first
production use waits for relations). The cost of the four-release shape:
about 430 minutes of gates and four closeouts against about 290 minutes and
two closeouts; the difference is the second migration, the editor and
catalog goldens re-seeded twice, the catalog `craft` batch (which pass 3
did not have) and two more closeouts.

### 7.1 R7 `persist-7-homebrew`

| Batch | Goal and scope | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B7.1` | Section 14 | `check` 8, `check:db` 10; after the approve `db:push --project test` 1, `e2e` 3 (~22 min) | required (a migration with SECURITY DEFINER functions) | a commit boundary the harness cannot reach: `B7.2`'s states need this seed, fake port and migration; SQL and ports judged apart from Svelte |
| `B7.2` | The account's own pages (4.9 store, 4.10, 4.14 F2, F4, F5): the store, `AppState.index` derived and the route handling, `withRecords` (byId), the menu entry, `#/homebrew` with sources and sections, the editor with its failure states and guard, `PagePort`'s unload guard, `#/i/<key>` with «Изменить» and the path, `recordUrl`, `hasLabels`, the «(HB)» tag, `limitText` for the two keys, `live.ts`'s `homebrew` message; the routes contract; specs, states, goldens, a flow | `check` x2 16, `check:built` 2, `app/states` 5, `app/contracts` 7, goldens 13, `sweep 360` 8, `e2e` 3 (~54 min) | required (a public contract change, new UI) | a public-contract change (routes) with its own fixtures |
| `B7.3` | Homebrew in lists (4.8, 4.14 F8): the resolver on add, copy and add-to-my-list, one derived index on the list, shared, lists-index and print pages, undo of a removed entry, the requests panel's names, the quick item; the seed's reference and frozen rows; specs, goldens, states, a flow | `check` x2 16, `check:built` 2, `app/states` 5, goldens 13, `sweep 360` 8, `e2e` 3 (~47 min) | required (a new write path into `list_entries`, new UI) | a different route and filter set (`#/lists/*`, `#/s/*`, `#/print/*` against `#/homebrew*`), and a review not held in one pass with `B7.2` |

R7 total: about 123 minutes of gates plus the closeout. Inherited lines,
each an acceptance line of its batch: F1's grep (`B7.1`); R6's deferred
rename of `const before` in `tests/db/import-lists.test.mjs` (`B7.1`, the
batch that edits the file); the restore runbook's key list (`B7.1`); the
bundle budget step per `Q14` (`B7.2` and every later batch that runs
`check:built`: raise to the measured size plus about 5 kB with a decision,
never past 250 / 190 kB); the privacy wording (`B7.2`); the
`DEBT.md` entry for a viewer's frozen print (`B7.3`).

### 7.2 R7b `persist-7b-homebrew-catalog`

| Batch | Goal and scope | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B7b.1` | 4.6's R7b column and table: `homebrew` in `TABLE_IDS`, the group and its chip, facets `kind`, `src`, `sect`, source and section headings and anchors, own equipment in the equipment tables with dynamic `src`, the chip, one merged search with the intro counter; the contract (`ROUTES.md`, `CONTRACTS.md` 1, `routes.json`, `llms.txt`); specs, states, goldens | `check` x2 16, `check:built` 2, `app/states` 6, `app/contracts` 7, goldens compare then re-seed 26, `sweep 360` 8 (~65 min) | required (a public contract: a table id) | one batch: one index change, one filter set, one golden re-seed |

### 7.3 R7c `persist-7c-homebrew-relations`

| Batch | Goal and scope | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B7c.1` | The catalog's `craft` as a list of ids (below) | `check` 8, `build:test` plus `check:built` 2, `node tests/run-all.js contracts,dataint,craft,stub` 3, goldens of the craft records compared (`--only`) 5 (~18 min) | required (a public contract change) | a public-contract change with its own commit and review, apart from the migration |
| `B7c.2` | 4.3, 4.4 storage and derivation over own records, 4.7's R7c migration (cards, the validators and the snapshot formula replaced, the bound decided), the port and the fake for cards, contract case N | `check` 8, `check:db` 10; after the approve push 1, `e2e` 3 (~22 min) | required (a migration) | a commit boundary the harness cannot reach (the cards seed and port) |
| `B7c.3` | The editor's «Связи» (the line `Seg`, «Улучшается в», «Сделан из» as lists of 8, «Комплект», «Карты правил»), `ItemPicker.svelte`, the inline set and card forms, the «Карты» panel on `#/homebrew`, the delete confirm's relation count | `check` x2 16, `check:built` 2, `app/states` 6, goldens 13, `e2e` 3 (~40 min) | required (new UI) | a different route set (`#/homebrew*`) from `B7c.4`, and a review not held in one pass |
| `B7c.4` | Relations drawn on catalog cards and rows: the fold, «(HB)» names, a dashed rung, set lines, rule cards, copied text | `check` x2 16, `check:built` 2, `app/states` 5, goldens compare then re-seed (the card and row states) 10, `sweep 360` 8 (~41 min) | required (the catalog's cards change for a signed-in reader) | a different route set (`#/i/<catalog id>`, `#/tables/*`, `#/search`) |

R7c total: about 121 minutes plus the closeout, and the contract review of
`B7c.1`.

`B7c.1` - the catalog `craft` as a list (owner, 2026-09-30: one shape
everywhere). Scope for the R7c refresh to expand:

- `data.js`: each of the 17 `craft` values becomes a one-element array
  (`"craft":["dve25"]`); then `node tools/build.js` (the hooks refuse a
  hand edit of the generated files). `data.json` changes shape;
  `catalog.csv`'s `crafts_into` joins the ids with `;` (the bytes stay while
  every list holds one id); the `i/` pages keep their text.
- `app/src/lib/types.ts`: `craft?: readonly string[]`. `lib/data.ts`:
  `Index.craftedFrom` becomes `madeFrom: ReadonlyMap<string, readonly
  string[]>` and `upgradesTo` for the catalog, with one reader
  `craftIds(r)` that also takes a string as a list of one (a `data.js` held
  in the HTTP cache from before the deploy still draws). `RecordCard`,
  `RowMain` and `share.ts` draw every target in order, comma-joined in the
  line; the fold and «(HB)» are `B7c.4`'s. The drawn text does not change:
  every catalog list holds one id.
- Tools and suites: `tools/derived.js` (`crafts_into`),
  `tools/build-share-pages.js` (`CRAFTED_FROM` to lists),
  `tools/capture-share-fixture.mjs` (reads `rec.craft` twice; review nit
  11),
  `tests/derived.js` (the Frostwyrd pin `dve24.craft` equal to
  `['dve25']`), `tests/dataint.js` (each id exists, no repeat, never the
  record itself; the one-source-per-target rule goes, as `madeFrom` is a
  list), `tests/craft.js` (the chain walk over lists), the component tests
  that build a record with `craft`.
- The contract, in the same commit: `docs/specs/CONTRACTS.md` section 4 (a
  record's `craft` is a list of ids; `crafts_into` joins them with `;`),
  `README.md` (the field meaning), `llms.txt` (the `crafts_into` column
  and `data.json`'s `craft`), `tests/contracts.js` (a guard: every
  `craft` in `data.json` is an array of known ids),
  `.claude/prompts/add-source.prompt.md` (`craft: ["<id>"]`).
- Decisions: `2026-09-19-frostwyrd-is-a-two-step-craft-chain-every.md`
  quotes `craft: 'dve25'`; the batch adds the mirror pair "Amended by" there
  and "Amends" in D1 (`2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md`),
  keeping both within fifteen lines, then runs `node tools/decisions.js`.
- Acceptance: the goldens of every record with a craft line compare clean;
  `catalog.csv` is byte for byte unchanged; `tests/contracts.js`,
  `tests/derived.js`, `tests/dataint.js`, `tests/craft.js` and
  `tests/stub.js` pass.

### 7.4 R7d `persist-7d-homebrew-files`

| Batch | Goal and scope | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B7d.1` | `import_homebrew` (4.7), `lib/homebrewFile.ts`, `lib/bundle.ts` v2, the two schemas and fixtures, `tests/contracts.js` and `tests/derived.js` pins, `llms.txt` both sections, `HomebrewRepository.import`, the fake, the contract case, the blind round; F1's grep again | `check` 8, `check:db` 10, `check:built` 2, the blind round 10; after the approve push 1, `e2e` 3 (~34 min) | required (a migration, two public schemas) | a new release; the schema batch rule |
| `B7d.2` | The import panel on `#/homebrew` with the «Куда» mapping and the skip or update `Seg`, the three download surfaces, the batch bar's download, `homebrew.json` in the zip, the account hint | `check` x2 16, `check:built` 2, `app/states` 6, `app/contracts` 7, goldens 13, `e2e` 3 (~47 min) | required (new UI) | a commit boundary the harness cannot reach without `B7d.1` |

Inherited lines for R7d: the import turns `\r\n` and `\r` into `\n` before it
validates (4.1, review R1); a v2 frozen entry sends `snapshot` as an object (4.11).

R7d total: about 81 minutes plus the closeout. All four releases: about
430 minutes of gates and four closeouts.

### 7.5 Where each release's plan lives, and R8, R9

- At R7's closeout the orchestrator moves this plan's R7b, R7c and R7d
  parts (sections 3, 4, 6-9, 11-13 as they apply) into
  `issues/persist-7b-homebrew-catalog/plan.md` with a `context.md` naming
  R7c and R7d as the next releases; R7c and R7d get their directories when
  R7b closes, in the same way. Each directory writes its own `Plan
  review:` line. D7 is written at R7's closeout.
- R8 `persist-8-media` (`B8.1`): `art_url` on `homebrew_items`; the
  validator and `homebrew_snapshot_of` admit `img` (a function
  replacement); the uploader offers the line's picture or another own
  item's; a file is deleted only when no own item names it; storage per
  image counts against the owner's concern of `Q3`.
- R9 `persist-9-item-share` (`B9.1`): `#/h/<token>` draws a projection that
  carries the snapshot's book and cards; relations to the sharer's other
  items travel as frozen names or are dropped (R9 decides); a clone makes
  a new key; the print routes resolve through `withRecords(index, none,
  snapshots)`.

## 8. Mocks (`mocks/index.html`)

The owner approved m01-m22 on 2026-09-30. Phase B changed m02 (no
«Черновики» group, the count «Мои предметы: 21 из 100», the quick items in
«Хоумбрю») and m22 (no mark, no banner, the limit 100), which also
removed the draft badge from the rows m09 reuses and one line of m17's
text. The generator lives outside the repository (`context.md`, "Facts
settled by planning pass 3"); it reproduced every file byte for byte
before the change.

Answers that override what the other mocks still draw - each an
implementer constraint:

| Answer | Mocks that still draw the old form | What ships |
|---|---|---|
| `Q3` limit 100 | m03, m15, m19, m20, m21 («из 500», «- 500») | 100 from the database (`my_limit`), in the count form «Мои предметы: N из M» |
| `Q4` no second-language UI | m04, m05, m20, m21 («Другой язык» fold) | no fold; the fields edit the item's own language (4.10) |
| `Q5` plain text tag | every mock with a dashed source badge, m07 and m08's dashed relation names | «<source> (HB)» in the ordinary badge; «<name> (HB)» in relation lines; a dashed border only on a ladder rung |
| `Q6` four releases | the batch names printed in each mock's "Plan" line | section 7's release map |

| Mock | Screen | Release, batch |
|---|---|---|
| m01 | the menu with «Мои предметы» | R7 `B7.2` |
| m02 | `#/homebrew as gm1`: sources with sections, the rows | R7 `B7.2` (the «Карты» fold: R7c `B7c.3`) |
| m03 | empty, signed out, unconfigured | R7 `B7.2` |
| m04 | the weapon editor | R7 `B7.2`; its «Связи»: R7c `B7c.3` |
| m05 | the loot editor | R7 `B7.2`; the made-from list and the new-set fold: R7c `B7c.3` |
| m06 | the item picker | R7c `B7c.3` |
| m07 | relations on `#/i/ci1`, `#/i/q1` | R7c `B7c.4` |
| m08 | a row with «и ещё 14» and the tag | R7c `B7c.4` (the tag: R7 `B7.2`) |
| m09 | `#/tables/homebrew` | R7b `B7b.1` |
| m10 | `#/tables/eq_weapon` with homebrew rows and the chip | R7b `B7b.1` |
| m11 | `#/search` merged | R7b `B7b.1` |
| m12 | `#/i/hb_... as gm1`: the path, «Изменить» | R7 `B7.2`; the relations and the own rule card: R7c |
| m13 | the delete confirms, the guard | R7 `B7.2`; the card and set confirms: R7c `B7c.3` |
| m14 | lists with a reference and a frozen row; the shared page | R7 `B7.3` |
| m15 | «Импорт предметов» | R7d `B7d.2` |
| m16 | the download surfaces | R7d `B7d.2` |
| m17 | the `homebrew-v1` file and the `llms.txt` outline | R7d `B7d.1` |
| m18 | a new source from the editor | R7 `B7.2` |
| m19 | sections | R7 `B7.2` |
| m20 | validation and the failure states | R7 `B7.2` (the relation rows: R7c) |
| m21 | the «Карты» panel and rule cards | R7c `B7c.3` |
| m22 | «+ Свой предмет» on a list | R7 `B7.3` |

## 9. Owner answers, and the question still open

| Question | Answer (2026-09-30) | Lands in |
|---|---|---|
| `Q1` "unique" | a one-off outside any line, the existing empty `line` | 4.5; R7c |
| `Q2` "a separate table" | `#/tables/homebrew` | 4.6; R7b |
| `Q3` item limit | 100; more by the owner's override on request | 4.10; `B7.1` (the row), `B7.2` |
| `Q4` second language | the bilingual stored shape, no second-language UI; only a file import fills both | 4.1, 4.10 |
| `Q5` the label | «Мастерская Ольхи (HB)» as plain text | 4.2; D2 |
| `Q6` releases | finer releases where a criterion supports it | section 7; D10 |
| `Q7` held keys on import | skip or update, default skip | 4.11; R7d |
| `Q8` editing | the save button with the unsaved-changes guard | 4.10; D5 |
| `Q9` sources on import | automatic, with the per-source mapping | 4.14 F3; R7d |
| `Q10` categories | sections in the first release | 4.2, 4.14 F4; D8 |
| `Q11` several links | up to 8 each way; follow-up after pass 4: the catalog's `craft` becomes a list too | 4.1, 4.4; R7c `B7c.1`-`B7c.4` |
| `Q14` bundle budget | A: step up per batch to 250 kB configured, 190 kB unconfigured | 4.10, 7.1 |
| `Q12` quick item | in R7, then revised: no draft mark | 4.14 F8; D9 |
| `Q13` `import-v1` bounds | decided in `limits-follow-overrides` | 4.11; R7d |
| Counters | the search intro adds «И N ваших предметов.»; `#/homebrew` shows «Мои предметы: N из M» | 4.6, 4.10; D11 |
| «Карты правил» | confirmed | 4.3; R7c |
| Mocks | approved, with the `Q12` revision | section 8 |

Decided by the planner in phase B (the owner may overrule; none blocks):

- What marks homebrew besides the tag (`Q5`): «(HB)» after a homebrew name
  in a relation line; a dashed border only on a ladder rung (4.2).
- The count text: «Мои предметы: N из M» under the page title, as the owner
  wrote it; «Мои предметы: N» when the limit is null.
- `my_limit()` reads the account's own limit: the answer "M from the
  database" needs it; it amends the 2026-09-26 decision that rejected
  reading the limit in the client (D11).

Open: none. Pass 4 had decided to keep the catalog `craft` as one id; the
owner overruled it after pass 4 (one shape everywhere), and `Q14` was
answered with A.

## 10. Decisions (`docs/decisions/`, written in phase B)

| File | Decision |
|---|---|
| `2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md` | D1: the whole shape; sources and cards are rows; `craft` a list everywhere, the catalog's from `B7c.1`; amends 2026-09-25 |
| `2026-09-30-hb-marks-homebrew-a-relation-shows-only-to-its-author.md` | D2: «(HB)» marks; a relation shows only to its author; the fold |
| `2026-09-30-homebrew-is-first-class-in-the-catalog-pages.md` | D3: the catalog pages, the chip, the search counter; amends the 2026-09-26 menu decision |
| `2026-09-30-a-frozen-copy-embeds-its-source-a-reference-must-exist.md` | D4: the snapshot, the bound, the reference check; amends 2026-09-26 |
| `2026-09-30-the-homebrew-editor-keeps-its-save-button-with-a-guard.md` | D5: the save button, the guard, the revision check; amends 2026-09-25 |
| `2026-09-30-homebrew-travels-as-its-own-file.md` | D6: two file formats, skip or update, the mapping, the ceilings |
| `2026-09-30-a-homebrew-source-may-hold-sections.md` | D8: sections |
| `2026-09-30-a-list-page-makes-a-plain-homebrew-item-in-one-press.md` | D9: the quick item, no mark |
| `2026-09-30-homebrew-ships-in-four-releases.md` | D10: the release split |
| `2026-09-30-the-account-reads-its-own-effective-limit.md` | D11: `my_limit()`; amends 2026-09-26 "Import validation is the client's ..." |

The five amended older files (two dated 2026-09-25, three dated
2026-09-26) carry their mirror lines; two 2026-09-26 files were rewrapped
to stay within fifteen lines, and
`2026-09-26-import-validation-...` keeps one free line for the
`limits-follow-overrides` mirror. D7 (item 13) is written at R7's closeout
from 4.13. The `Q14` decision is written by `B7.2`, the first batch that
raises a budget, with the mirror line in
`2026-09-30-the-configured-bundle-budget-is-210-kb.md` (this pass may not
write that file or the index while `limits-follow-overrides` runs on the
tree). Its text: title "The bundle budget steps up per batch to 250 kB
configured and 190 unconfigured"; Decision: during R7-R7d a batch whose
build passes a budget raises it to the measured size plus about 5 kB in the
same commit, never past 250 kB configured and 190 kB unconfigured; past a
ceiling the batch stops and asks; Rejected: B, homebrew kept out of the
unconfigured build (an import seam for a build nobody deploys), C, the
slimmer account client first (`DEBT.md` D60 buys one batch and delays R7);
"Amends" the 210 kB decision: the ceilings. `node tools/decisions.js` rebuilt `docs/DECISIONS.md` and
`validate()` reports nothing.

## 11. Roadmap changes (`issues/persistent-storage/plan.md`; the orchestrator applies them)

The planner does not write the roadmap. `pending-apply.md` is deleted;
these lines replace it, adjusted to the answers:

1. Section 5: replace the R7 row with - two tables (`homebrew_books` {id,
   owner_id default `auth.uid()`, key `^hb_[a-z2-7]{16}$`, content {en?, ru?,
   sections?}, revision, timestamps, unique (owner_id, key)},
   `homebrew_items` {..., book_id null fk set null, content = the catalog
   shape's R7 subset, validated by `homebrew_content_valid`}); limits
   `homebrew_books_per_owner` 20, `homebrew_items_per_owner` 100;
   `my_limit(key)`; owner-only RLS, `service_role` select and delete; pin,
   limit, touch (item, book), before-delete and `homebrew` broadcast
   (`{ by }` on `owner:<uid>`, one per owner per transaction) triggers;
   `homebrew_snapshot_of(key, content, book)`; `list_entries`: R2's check
   replaced by two, the bound widened to 32768, a
   `list_entries_reference_exists` trigger; `get_shared_list` and
   `clone_shared_list` re-created. Add rows: R7b (no schema); R7c
   (`homebrew_cards`, `homebrew_cards_per_owner` 100, the validators and
   the snapshot formula replaced, the bound decided); R7d
   (`import_homebrew(p_books, p_cards, p_items, p_update)`, security
   invoker, per-call ceilings, skip or update, a held source's sections
   merged).
2. Section 6 (public contracts): `B7.2` - `ROUTES.md`, `CONTRACTS.md` 1
   and 2 (`#/homebrew*`, the `hb_` prefix), `routes.json`,
   `tests/contracts.js`, `llms.txt`; `B7b.1` - the `homebrew` table with
   groups `kind`, `src`, `sect`; `B7d.1` - `CONTRACTS.md` 4
   (`schema/homebrew-v1.json`, `schema/import-v2.json`, the zip's
   `homebrew.json`), `llms.txt` two sections, `tests/derived.js` pins.
   `B7c.1` - the catalog `craft` as a list (`data.json`, `catalog.csv`'s
   `crafts_into`, `CONTRACTS.md` 4, `README.md`, `llms.txt`,
   `tests/contracts.js`). `B7.3`, `B7c.2`-`B7c.4` change no public
   contract.
3. Section 9 (releases): R7 -> `B7.1`-`B7.3` (planned 2026-09-28, amended
   2026-09-30 by passes 3 and 4; `issues/persist-7-homebrew/plan.md` is the
   authority): own items with sources and sections, the editor, lists,
   shared pages, print, the quick item. New rows after R7: `R7b |
   persist-7b-homebrew-catalog | B7b.1 | the homebrew table, own equipment
   in the equipment tables, one merged search, the chip`; `R7c |
   persist-7c-homebrew-relations | B7c.1-B7c.4 | the catalog craft as a list, cards, upgrade lines, craft
   links, sets, relations on catalog cards`; `R7d |
   persist-7d-homebrew-files | B7d.1, B7d.2 | homebrew-v1, import-v2,
   llms.txt with a blind round, import and export, homebrew.json in the
   zip`. The order line: "... R6, R7, R7b, R7c, R7d, R8, R9,
   persist-review, R10".
4. Section 12 (costs): replace the `B7.*` rows with section 7's ten rows;
   the total gains about 360 minutes against the roadmap's old 70 (R7 123,
   R7b 65, R7c 121, R7d 81, plus four closeouts).
5. Section 14 (outlines): replace the `B7.*` outline with a pointer to this
   plan's section 4 and one paragraph: the record is the whole catalog
   shape plus `craft_from`, with `craft` and `craft_from` as lists and a
   `section`; sources with sections and cards are rows; own records join
   `byId` (R7), `searchable`, `allEquip` and a `homebrew` table (R7b), the
   relation derivations (R7c); frozen copies join `byId` alone; «(HB)»
   marks homebrew; the snapshot embeds the source and, from R7c, the cards;
   the editor keeps its save button with a guard; a list page makes a
   plain item in one press; files in R7d. `B8.1` gains: the uploader offers
   the line's or another own item's picture; delete only when no item
   names the file. `B9.1` gains: the projection carries book and cards;
   relations to the author's other items travel as frozen names or are
   dropped; a clone drops or clones the chain.
6. Section 16, decision 31: the homebrew item default is 100 (`Q3`); the
   new keys `homebrew_books_per_owner` 20 and, in R7c,
   `homebrew_cards_per_owner` 100.
7. Section 17: "Deferred: homebrew import beyond v2's create-only" ->
   "import updates held keys when the GM chooses (R7d)"; drop "homebrew
   sets" from "Not in v1"; the R5b item "which release owns `DEBT.md` D64"
   stays open for the owner.

## 12. Risks, assumptions, deferred

- Risk: the bundle budget. `B7.1` adds a little to both builds
  (`lazy-cloud.ts`'s `newKey`, the adapter); `B7.2` measures with
  `check:built` and steps the budget (`Q14` = A, 4.10).
- Risk: `B7c.1` changes `data.json`'s record shape; a reader outside the
  site that expects a string breaks. `llms.txt` and `README.md` say it in
  the same commit; the app reads both shapes while an old `data.js` may be
  cached.
- Risk: the reference-exists trigger and the before-delete trigger race;
  the trigger's `for key share` on the item row makes a concurrent delete
  wait and then remove the new reference. A layer 3 case proves the plain
  order; the race itself is not tested.
- Risk: R2's column check's name. `B7.1` confirms it from `pg_constraint`
  before writing the migration and the reversal; the reversibility gate
  proves the round trip.
- Risk: a CHECK calls the validators as the writing role, so
  `authenticated` needs EXECUTE on them (`anon` never): the harness test
  `EXPECTED_ANON_FUNCTIONS` stays unchanged.
- Risk: `recordOf` and `homebrew_snapshot_of` must agree field for field;
  one fixture file (`snapshots.json`) is compared by both suites.
- Risk: `B7c.4` changes what a signed-in reader's catalog card draws; the
  signed-out goldens must not move (the compare before the re-seed is the
  proof).
- Risk: the quick item makes two writes across two write paths; a test
  proves the entry never leaves before the item exists.
- Risk: the client-only rules (a section inside the item's source, a line
  that starts at equipment of the same type, a duplicate source name)
  cannot be CHECKs; the editor and the import share one function, and a
  key that answers nothing draws nothing.
- Risk: a mock can name a catalog record wrongly (pass 2 did it four
  times); each batch checks every catalog id and name it takes from a mock
  against `data.js`.
- Risk: `ListPage.svelte` is large and R4b edited it; `B7.3` re-reads it.
- Assumption: a frozen snapshot of up to 32 KB per entry. At the default
  entry limit a shared list is at most 3.2 MB; an override of 1000 entries
  makes it up to 32 MB in the worst case (`limits-follow-overrides` note);
  real snapshots are about 2 KB. Accepted: an override is the owner's own
  grant.
- Assumption: a purchase request's 32 KiB lines bound holds about 700
  lines of homebrew keys (19 characters each), not the 360 of a 64-character
  key the `limits-follow-overrides` note assumes.
- Coordination: task `limits-follow-overrides` changes `import-v1`'s
  entries bound to 5000 and raises `import_lists()`'s lists-per-call
  ceiling in a migration. R7's migration takes a later timestamp; R7d's
  `import-v2` inherits both. That task's `B1` edits
  `tests/db/import-lists.test.mjs` and `tests/db/limits.test.mjs` too: the
  second to land rebases. Its step 14 adds a mirror line to
  `2026-09-26-the-list-file-import-v1-is-a-strict-json-schema.md`, which
  already holds fifteen lines: it must rewrap the file.
- Deferred: item 13 (books shared with other users); a Trash; art (R8);
  links (R9); a set filter; `recall` on a homebrew record; a per-source
  cover; bulk moves between sources; price and quantity in the quick item
  panel; `DEBT.md` D64 and D66 stay with the owner.

## 13. Phase B record (pass 4, 2026-09-30)

1. Delta against `main` `7005abeb`: no change under `supabase/` or
   `app/src/ports` since pass 3; R4b's `RequestsPanel` and `SharedListPage`
   still name items through an index (G19 and G18 stand); every new toast
   is a `Msg`; the bundle budget has 5-7 kB of headroom (`Q14`).
2. The answers applied (section 9); the decisions written (section 10);
   `pending-apply.md` replaced by section 11 and deleted.
3. m02 and m22 regenerated for `Q12` revised; `npx prettier --write` over
   the mocks; `git grep` finds no draft mark in `mocks/`.
4. `B7.1` expanded (section 14); the plan review line kept.
5. After pass 4, the owner's answers: `Q14` = A (4.10, 7.1, the decision
   text in section 10 for `B7.2`); the catalog `craft` as a list (`B7c.1`,
   7.3; D1 revised). R7c's batches were renumbered: `B7c.1` is the catalog
   batch, pass 4's `B7c.1`-`B7c.3` are `B7c.2`-`B7c.4`.
6. The plan review before `B7.1` (fix-then-continue): blocker 1 (the copy
   decides from the source row: 4.8, step 2h, steps 12, 13, 15); blocker 2
   (a fixed `search_path` on every function, the function pin: steps 2e,
   2f, 15, "Constraints"); R1 (C0 controls refused: 4.1, steps 2b, 4, 5);
   R2 (a repeated update answers `ok`: 4.9, steps 5, 8, 9, 12, 14); R3 (the
   undo note: step 18); the local nits (steps 2b, 7, 12, 14, 18, "Files",
   4.2, 4.9, D8, the 2026-09-25 mirror line, the handoff); nit 11 in
   `B7c.1`'s tool list. Register: `reviews.md`.

## 14. `B7.1` - schema, ports and pure logic (implement-ready)

### Objective

The database, the port and the pure logic of R7's homebrew items: sources
with sections, items in the R7 subset of the catalog shape, the owner's
own limit read, references and frozen copies on `list_entries`, the shared
projection and the copy, the Realtime event; the real adapter, the lazy
wrapper, the fake with its seed, and the contract case M. No component,
store or page changes, and no golden moves.

### In scope / out of scope

- In: section 4.7's R7 objects; `lib/homebrew.ts` (keys, validators,
  `recordOf`); `docs/fixtures/homebrew/`; `HomebrewRepository` in
  `ports/types.ts`, `supabase.ts`, `lazy-cloud.ts`, `fake-cloud.ts` and its
  seed; contract case M; layer 3 suites; the usage report's items
  near-limit counts; the restore runbook's key list; `COVERAGE.md`.
- Out: the store, `withRecords`, every component and route (`B7.2`); the
  list resolver and the seed's list rows (`B7.3`); cards and relations
  (R7c); files (R7d); `FEATURES.md` (the behaviour reaches a user in
  `B7.2`).

### Files

- New: `supabase/migrations/<stamp>_homebrew.sql`,
  `supabase/reversals/<stamp>_homebrew.sql`,
  `docs/fixtures/homebrew/items.json`, `books.json`, `snapshots.json`,
  `app/src/lib/homebrew.ts`, `app/src/lib/homebrew.test.ts`,
  `tests/db/homebrew.test.mjs`.
- Edited: `app/src/ports/types.ts` (`index.ts` re-exports it already), `supabase.ts`,
  `supabase.test.ts`, `lazy-cloud.ts`, `lazy-cloud.test.ts`,
  `fake-cloud.ts`, `fake-cloud-seed.ts`, `fake-cloud.test.ts`,
  `cloud.contract.ts`; `tests/db/limits.test.mjs`,
  `restore-drill.test.mjs`, `usage.test.mjs`, `import-lists.test.mjs`;
  `tools/supabase/usage.mjs`, `usage-lib.mjs`, `usage-lib.test.mjs`;
  `tests/e2e/contract.mjs`; `docs/specs/COVERAGE.md`,
  `docs/specs/CONTRACTS.md` (the fixture paragraph only);
  `.claude/README.md`.

### Constraints (settled; do not reopen)

- Keys: `^hb_[a-z2-7]{16}$` for sources, sections and items; unique per
  owner per table; never changed after insert.
- Validation: the database refuses `null` values and unknown keys; `lib`
  and SQL accept and refuse the same fixtures. Each rule is 4.1's type and
  4.14 F5's table, R7 subset (no `eq.line`, `craft`, `craft_from`, `set`,
  `refs`).
- The client never refuses a write by a count: limits are the database's;
  `my_limit` is for display only.
- Official list entries behave exactly as before.
- No example source name of a published product anywhere (F1).
- Every new or re-created function states `set search_path = public,
  pg_temp` and its `language`; every new function revokes EXECUTE from
  `public` and `anon`; trigger functions also from `authenticated`.
- Every name and text refuses the C0 control characters except tab and
  newline (4.1, review R1).

### Steps

1. **Confirm two facts.** Against the local stack after `npm run check:db`
   has reset it once (or by reading `pg_constraint` in a layer 3 probe):
   the name of R2's column check on `list_entries.snapshot` (expected
   `list_entries_snapshot_check`). Take a migration timestamp later than
   every file in `supabase/migrations/` (on 2026-09-30 the newest is
   `20260930120000_import_lists_ceiling.sql` of task
   `limits-follow-overrides`, not yet committed).

2. **The migration** `supabase/migrations/<stamp>_homebrew.sql`. Header
   comment: what it adds and `docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md`
   and `...-a-frozen-copy-embeds-its-source-a-reference-must-exist.md`.
   Objects in this order (write every `if` check on its own line; Postgres
   does not promise the order of an `and` chain, so cast a value only after
   an earlier `if` proved its type):

   a. `insert into public.limit_defaults (key, value) values
      ('homebrew_books_per_owner', 20), ('homebrew_items_per_owner', 100);`

   b. Validators, each `immutable`, `set search_path = public, pg_temp`,
      `revoke execute ... from public, anon; grant execute ... to
      authenticated;` (a CHECK runs them as the writing role):
      - `homebrew_key_ok(p text) returns boolean`: `p is not null and p ~
        '^hb_[a-z2-7]{16}$'`.
      - `homebrew_names_ok(p jsonb, p_max integer) returns boolean`: `en`
        and `ru` each absent or a JSON string of at most `p_max` code
        points (`char_length`) with no character matching
        `'[\x01-\x08\x0b-\x1f]'` (the C0 controls but tab and newline),
        and at least one of them matches `'\S'`.
      - `homebrew_text_ok(p jsonb, p_key text, p_max integer) returns
        boolean`: the key absent or a JSON string of at most `p_max` code
        points with no character matching `'[\x01-\x08\x0b-\x1f]'`.
      - `homebrew_content_valid(p jsonb) returns boolean` (plpgsql): an
        object; keys only `kind en ru ende rud tier eq section`; `kind` a
        string in `item consumable equip`; `homebrew_names_ok(p, 120)`;
        `ende`, `rud` by `homebrew_text_ok(..., 3000)`; `section` absent or
        a string passing `homebrew_key_ok`; `(kind = 'equip') = (p ? 'eq')`;
        `tier` absent, or on loot only one of the JSON values `1 2 3 4 "A"
        "C"` (compare `p -> 'tier' = any (array['1','2','3','4','"A"','"C"']::jsonb[])`);
        `eq`: an object with keys only `t tier cls tr rg dmg dt bu as th
        alt`; `t` one of `"weapon" "secondary" "armor"`; `tier` one of `1 2
        3 4 "A"`; for a weapon or secondary: `cls` `"phy" "mag"`, `tr` one
        of the six traits or `"spellcast"`, `rg` `"melee" "veryclose"
        "close" "far" "veryfar"`, `dmg` a string matching
        `^d(4|6|8|10|12|20)(\+([1-9]|1[0-9]|20))?$`, `dt` `"phy" "mag"
        "any"`, `bu` `1 2 "any"`, all six required, `as` and `th` absent,
        `alt` absent or an object with exactly `tr rg dmg dt` by the same
        rules; for armour: `as` a JSON number that is a whole number 0-12,
        `th` a two-element array of JSON whole numbers 1-99 with the first
        smaller, and none of `cls tr rg dmg dt bu alt`. Use `is not true`
        around each comparison so a missing key reads as a refusal.
      - `homebrew_book_valid(p jsonb) returns boolean`: an object; keys
        only `en ru sections`; `homebrew_names_ok(p, 80)`; `sections`
        absent or an array of at most 30 objects, each with keys only `key
        en ru`, `homebrew_key_ok(key)`, `homebrew_names_ok(s, 80)`, keys
        unique in the array.
      - `homebrew_snapshot_of(p_key text, p_content jsonb, p_book jsonb)
        returns jsonb`: the rules of `recordOf` (4.1): `p_content -
        'section'`, then `id`, `src 'homebrew'`, `en`, `ru`, `ende`, `rud`
        as `coalesce(nullif(<this>, ''), <other>, '')`, `tier 'A'` when
        `p_content #>> '{eq,tier}' = 'A'`, and `book` when `p_book` is not
        null: `{ key, en, ru }` with the same fallback, plus `section {
        key, en, ru }` for the element of `p_book -> 'sections'` whose key
        is `p_content ->> 'section'`, its `en` and `ru` with the same
        fallback (`coalesce(nullif(<this>, ''), <other>, '')`; review nit
        6). `p_book` is the book's `content ||
        jsonb_build_object('key', key)`.
      - `homebrew_snapshot_valid(p jsonb) returns boolean`: an object;
        `src` = `"homebrew"`; `id` a string passing `homebrew_key_ok`;
        `book` absent or an object with keys only `key en ru section`, its
        `key` passing `homebrew_key_ok`, `homebrew_names_ok(book, 80)`, and
        `section` absent or an object with keys only `key en ru`, a valid
        key and `homebrew_names_ok(section, 80)`; then `v := p - 'id' -
        'src' - 'book'`; when `v ->> 'kind' = 'equip'` and `v ? 'tier'`:
        `v -> 'tier'` must be `"A"` and `v #>> '{eq,tier}'` must be `A`,
        then `v := v - 'tier'`; finally `homebrew_content_valid(v)`.

   c. Tables, following `20260925130100_lists.sql`:
      - `public.homebrew_books (id uuid primary key, owner_id uuid not null
        default auth.uid() references auth.users (id) on delete cascade,
        key text not null check (public.homebrew_key_ok(key)), content
        jsonb not null check (public.homebrew_book_valid(content)),
        revision bigint not null default 1, created_at timestamptz not null
        default now(), updated_at timestamptz not null default now(),
        unique (owner_id, key))`.
      - `public.homebrew_items (id uuid primary key, owner_id ... as above,
        key ..., book_id uuid references public.homebrew_books (id) on
        delete set null, content jsonb not null check
        (public.homebrew_content_valid(content)), revision, created_at,
        updated_at, unique (owner_id, key))`; `create index
        homebrew_items_book on public.homebrew_items (book_id);`.
      - Both: `enable row level security`; `revoke all ... from public,
        anon, authenticated`; `grant select, insert, update, delete ... to
        authenticated`; `grant select, delete ... to service_role` (the
        E2E admin). Policies `<table>_select|insert|update|delete` for
        `authenticated` on `(select auth.uid()) = owner_id`; the items'
        insert and update `with check` add `(book_id is null or exists
        (select 1 from public.homebrew_books b where b.id = book_id and
        b.owner_id = (select auth.uid())))`.

   d. Trigger functions and triggers (every one `set search_path = public,
      pg_temp`; `revoke execute ... from public, anon, authenticated`):
      - `homebrew_books_before_update()` and
        `homebrew_items_before_update()` (invoker, as
        `lists_before_update`): pin `id`, `owner_id`, `key`, `created_at`;
        `revision := old.revision + 1`; `updated_at := now()`. Triggers
        `before update ... for each row`.
      - `homebrew_books_limit()` and `homebrew_items_limit()` (security
        definer, as `lists_limit`): after insert, per-owner advisory lock
        `hashtext('homebrew_books:' || owner)` or `'homebrew_items:'`,
        `effective_limit(new.owner_id, '<key>')`, raise `'limit: <key>'`
        with `errcode = 'P0001', detail = v_limit::text` when the count
        passes it.
      - `homebrew_items_touch()` (security definer): after update, `update
        public.lists l set revision = revision + 1, updated_at = now()
        where l.owner_id = new.owner_id and exists (select 1 from
        public.list_entries e where e.list_id = l.id and e.source =
        'homebrew' and e.snapshot is null and e.item_key = new.key)`.
      - `homebrew_books_touch()` (security definer): after update, the same
        for lists holding a reference to any item with `book_id = new.id`.
        A source delete needs no trigger: `on delete set null` updates its
        items, whose touch trigger bumps the lists.
      - `homebrew_items_before_delete()` (security definer): before delete,
        `delete from public.list_entries e using public.lists l where
        l.id = e.list_id and l.owner_id = old.owner_id and e.source =
        'homebrew' and e.snapshot is null and e.item_key = old.key`;
        `return old`.
      - `homebrew_broadcast()` (security definer, modelled on
        `lists_broadcast` in `20260927120000_realtime.sql`): the owner is
        `coalesce(new.owner_id, old.owner_id)`; a transaction-local mark
        `dhloot.hb_broadcast` sends once per owner per transaction; `by`
        from `request.headers`' `x-dhloot-tab` with the same pattern check;
        `realtime.send(jsonb_build_object('by', v_by), 'homebrew', 'owner:'
        || v_owner::text, true)`; any error raises a warning, never fails
        the write. Two `create constraint trigger ... after insert or
        update or delete ... deferrable initially deferred for each row`,
        one per table.

   e. `list_entries`:
      - `alter table public.list_entries drop constraint
        list_entries_snapshot_check, drop constraint
        list_entries_snapshot_size;` (step 1's confirmed name).
      - `add constraint list_entries_snapshot_source check (source =
        'homebrew' or snapshot is null)`, `add constraint
        list_entries_snapshot_valid check (snapshot is null or
        (public.homebrew_snapshot_valid(snapshot) and snapshot ->> 'id' =
        item_key))`, `add constraint list_entries_snapshot_size check
        (snapshot is null or octet_length(snapshot::text) <= 32768)`.
      - `list_entries_reference_exists()` (`language plpgsql security
        definer set search_path = public, pg_temp`; revoke EXECUTE from
        `public`, `anon`, `authenticated`): when
        `new.source = 'homebrew' and new.snapshot is null`, `perform 1 from
        public.homebrew_items i join public.lists l on l.owner_id =
        i.owner_id where l.id = new.list_id and i.key = new.item_key for
        key share of i;` and `if not found then raise exception
        'list_entries: no homebrew item %', new.item_key using errcode =
        '23503'; end if;` `return new`. Trigger `before insert or update of
        list_id, item_key, source, snapshot on public.list_entries for each
        row`.

   f. `my_limit(p_key text) returns integer`, `language plpgsql stable
      security definer set search_path = public, pg_temp`:
      raise `'my_limit: not signed in'` with `errcode = '28000'` when
      `auth.uid()` is null; else `return public.effective_limit(auth.uid(),
      p_key);`. `revoke ... from public, anon; grant execute ... to
      authenticated`.

   g. `create or replace function public.get_shared_list(p_token text)`:
      R2's body, with the entry's `'snapshot', e.snapshot` replaced by
      `'snapshot', case when e.source = 'homebrew' and e.snapshot is null
      then (select public.homebrew_snapshot_of(i.key, i.content, case when
      b.id is null then null else b.content || jsonb_build_object('key',
      b.key) end) from public.homebrew_items i left join
      public.homebrew_books b on b.id = i.book_id where i.owner_id =
      v_list.owner_id and i.key = e.item_key) else e.snapshot end`.
      `create or replace` keeps the grants; keep R2's `stable security
      definer set search_path = public, pg_temp`.

   h. `create or replace function public.clone_shared_list(p_token text,
      p_id uuid)`: R2's body plus `v_owner uuid` read as the source list's
      owner (`list_shares` joined to `lists` by the active token); the
      entries' `snapshot` becomes, deciding from the source row and not
      from the projection (which fills a reference's snapshot):

      ```sql
      case when e ->> 'source' = 'homebrew' and v_owner = auth.uid()
             and exists (select 1 from public.list_entries s
                         where s.id = (e ->> 'id')::uuid and s.snapshot is null)
           then null
           else nullif(e -> 'snapshot', 'null'::jsonb) end
      ```

      The owner's own references stay references; a frozen entry stays
      frozen with its snapshot for everyone. Keep R2's `security definer
      set search_path = public, pg_temp`.

3. **The reversal** `supabase/reversals/<stamp>_homebrew.sql`: a comment
   that every homebrew row and every homebrew list entry is dropped; then
   `delete from public.list_entries where source = 'homebrew';`; drop the
   reference trigger and its function; drop the three new `list_entries`
   constraints and add back `list_entries_snapshot_check check ((source =
   'official') = (snapshot is null))` and `list_entries_snapshot_size check
   (snapshot is null or octet_length(snapshot::text) <= 16384)`; `create or
   replace` `get_shared_list` and `clone_shared_list` with R2's bodies
   copied byte for byte from `20260925130200_list_shares.sql`; drop
   `my_limit(text)`; drop `homebrew_items`, then `homebrew_books` (their
   triggers go with them); drop every new function; `delete from
   public.limit_defaults where key in ('homebrew_books_per_owner',
   'homebrew_items_per_owner');`. The reversibility gate must pass
   (up-down-up and the base walk). The reversal destroys data: step 18
   writes when to run it.

4. **The fixtures** under `docs/fixtures/homebrew/`, each written as
   `JSON.stringify(v, null, 2) + '\n'`:
   - `items.json`: `{ "valid": [{ "name", "content" }], "invalid": [{
     "name", "content", "problems": [{ "path", "rule" }] }] }`. Valid:
     a Russian-only item; an English-only consumable with a description;
     both languages with `tier` `"C"`; `tier` `"A"` and `4` on loot; a full
     weapon with `section`; a secondary with `alt`; armour `{ t: "armor",
     tier: "A", as: 0, th: [1, 2] }` and `as: 12, th: [98, 99]`; `dmg`
     `d4`, `d20+20`, `d12+1`; names of 120 and descriptions of 3000 code
     points in a 4-byte character (the maximal item); empty `ende` and
     `rud`. Invalid, each with its expected problems: an array (`""`,
     `type`); an extra key `img`, `roll` and `craft` (`extra`); no `kind`
     (`required`); `kind` `"weapon"` (`enum`); no name, and names of
     spaces only (`name`, `required`); `en` of 121 code points (`long`);
     `rud` of 3001 (`long`); `en: null` (`type`); `tier` on equipment
     (`extra`); `tier` 5 and `"B"` (`enum`); `equip` without `eq`
     (`eq`, `required`); `item` with `eq` (`eq`, `extra`); `eq.t`
     `"shield"` and `eq.tier` `"C"` (`enum`); no `eq.tier` (`required`); a
     weapon without `dmg` (`required`); `dmg` `2d8`, `d8+21`, `d8+0`
     (`pattern`); a weapon with `as` (`extra`); armour with `dmg`
     (`extra`); `th` `[5, 5]` (`order`), `[0, 3]` (`range`), `[3]`
     (`type`); `as` 13 (`range`) and 2.5 (`type`); `alt` with `tr` only
     (`eq.alt.rg`, `eq.alt.dmg`, `eq.alt.dt`, `required`); `alt` on armour
     (`extra`); `section` `"pistols"` (`pattern`); `bu` 3 (`enum`);
     `en` holding U+0007 and `rud` holding U+001B or `\r` (`pattern`).
     One more valid case: `rud` holding a tab and newlines.
   - `books.json`: the same shape. Valid: a Russian name; an English name
     with two sections; 30 sections. Invalid: no name (`name`,
     `required`); a name of 81 code points (`long`); 31 sections
     (`sections`, `many`); a repeated section key (`sections.1.key`,
     `duplicate`); a section with no name (`sections.0.name`, `required`);
     a section key `"a"` (`pattern`); an extra key `cover` (`extra`); a
     source name holding U+0001 (`pattern`). Section names are not checked
     here (a client rule, 4.2).
   - `snapshots.json`: `{ "valid": [{ "name", "key", "content", "book",
     "snapshot" }], "invalid": [{ "name", "snapshot" }] }`. Valid: the
     Russian-only potion with no source; the English-only cap with a source
     without sections; the weapon with a source holding its section; an
     item whose section key its source does not hold (no `section` in
     `book`); an artifact weapon (the record's `tier` `"A"`); the maximal
     item with a maximal source and section. Invalid: `src` `"official"`;
     `id` `"ci1"`; `book` with an extra key; a `book.section` with no
     name; a content part with `kind` `"weapon"`; `tier` `"A"` on
     equipment whose `eq.tier` is 2.

5. **`app/src/lib/homebrew.ts`** (pure; a header comment names the
   migration and the fixtures):
   - `HOMEBREW_KEY = /^hb_[a-z2-7]{16}$/`, `isHomebrewKey(s)`,
     `keyFrom(bytes: Uint8Array): string` (the first 10 bytes as 16
     base32 characters of `a-z2-7`; throws for fewer than 10 bytes).
   - `NAME_MAX = 120`, `DESC_MAX = 3000`, `BOOK_NAME_MAX = 80`,
     `SECTIONS_MAX = 30`, `SNAPSHOT_BYTES = 32768`.
   - Types: `HomebrewContent`, `HomebrewEquip` (4.1), `SectionRow { key;
     en?; ru? }`, `BookContent { en?; ru?; sections?: SectionRow[] }`,
     `BookRef = BookContent & { key: string }`, `BookRow { id; key;
     content: BookContent; revision; created_at; updated_at }`, `ItemRow {
     id; key; book_id: string | null; content: HomebrewContent; revision;
     created_at; updated_at }`, `NewBookRow = Pick<BookRow, 'id' | 'key' |
     'content'>`, `NewItemRow = Pick<ItemRow, 'id' | 'key' | 'book_id' |
     'content'>`, `HomebrewRecord = Record_ & { book?: { key; en; ru;
     section?: { key; en; ru } } }`, `Problem { path: string; rule:
     'type' | 'required' | 'extra' | 'enum' | 'long' | 'pattern' | 'range'
     | 'order' | 'many' | 'duplicate' }`.
   - `contentProblems(v: unknown): Problem[]` and `bookProblems(v:
     unknown): Problem[]`: every problem, in the order `kind`, `name`,
     `en`, `ru`, `ende`, `rud`, `tier`, `section`, `eq` (`t`, `tier`,
     `cls`, `tr`, `rg`, `dmg`, `dt`, `bu`, `as`, `th`, `alt.tr`, `alt.rg`,
     `alt.dmg`, `alt.dt`), then extra keys in their order; `name` is the
     path of "no language holds a name"; code points by `Array.from`; the
     space test `/\S/u`; a C0 control but tab and newline
     (`/[\u0001-\u0008\u000b-\u001f]/`) is `pattern`.
   - `canonJson(v: unknown): string`: `JSON.stringify` with object keys
     sorted at every level (jsonb reorders keys); the adapters compare a
     repeated update with it, and contract case M compares with it.
   - `snapshotValid(v: unknown): boolean` (the SQL rule, 2b).
   - `recordOf(key, content, book: BookRef | null): HomebrewRecord`
     (4.1).
   - Nothing else: `withRecords`, form helpers and labels are `B7.2`'s.

6. **`app/src/lib/homebrew.test.ts`**: every `items.json` and
   `books.json` case gives exactly its `problems` (valid: none); every
   `snapshots.json` valid case: `recordOf(key, content, book)` deep-equals
   `snapshot` and `snapshotValid` is true; every invalid snapshot: false;
   `keyFrom` over fixed bytes gives a fixed key, matches `HOMEBREW_KEY`,
   throws for 9 bytes; the maximal snapshot's UTF-8 JSON is under
   `SNAPSHOT_BYTES`; a missing language falls back and an empty one too.

7. **`app/src/ports/types.ts`**: import the row types from
   `../lib/homebrew.js`; add

   ```ts
   export type HomebrewRead =
     | { ok: true; books: BookRow[]; items: ItemRow[]; itemLimit: number | null }
     | { ok: false };
   /** An update's answer: the row's new revision, or why not. */
   export type HomebrewSaved =
     | { ok: true; revision: number }
     | { ok: false; error: 'conflict' | 'gone' }
     | Exclude<ListWrite, { ok: true }>;
   /** The signed-in author's homebrew
    *  (docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md). */
   export interface HomebrewRepository {
     newId(): string;
     /** A fresh `hb_` key for a source, a section or an item. */
     newKey(): string;
     load(): Promise<HomebrewRead>;
     createBook(row: NewBookRow): Promise<ListWrite>;
     /** `revision` null writes whatever the row's revision is. */
     updateBook(id: string, content: BookContent, revision: number | null): Promise<HomebrewSaved>;
     removeBook(id: string): Promise<ListWrite>;
     createItem(row: NewItemRow): Promise<ListWrite>;
     updateItem(
       id: string,
       patch: { content: HomebrewContent; book_id: string | null },
       revision: number | null
     ): Promise<HomebrewSaved>;
     removeItem(id: string): Promise<ListWrite>;
   }
   ```

   and `homebrew: HomebrewRepository` on `CloudPort` (its comment gains
   "R7 homebrew"). `ports/index.ts` re-exports `types.ts` whole: no edit.

8. **`app/src/ports/supabase.ts`**: `BOOK_SELECT =
   'id,key,content,revision,created_at,updated_at'`, `ITEM_SELECT =
   'id,key,book_id,content,revision,created_at,updated_at'`. `homebrew`:
   - `newId: () => crypto.randomUUID()`, `newKey: () =>
     keyFrom(crypto.getRandomValues(new Uint8Array(10)))`.
   - `load()`: `userId()` null answers `{ ok: false }`; else the two
     selects and `rpc('my_limit', { p_key: 'homebrew_items_per_owner' })`
     in `Promise.all`; an error or a non-array of either select, or a
     throw, answers `{ ok: false }`; `itemLimit` is `my_limit`'s number,
     and null for a null answer or a failed `my_limit` read (the page then
     draws the count alone).
   - `createBook` / `createItem`: `timed((s) => client.from(<table>).upsert(row,
     { onConflict: 'id', ignoreDuplicates: true }).abortSignal(s))`,
     through `written`/`writeOf` (so `limit: <key>` reads as the limit and
     `23505` as `refused`).
   - `updateBook` / `updateItem`: the update `.eq('id', id)`, plus
     `.eq('revision', revision)` when it is not null, then
     `.select('revision')` under `timed`; an error reads through `writeOf`;
     one row answers `{ ok: true, revision }`; no row: read
     `select('revision,content,book_id').eq('id', id).maybeSingle()` - a row
     whose `content` (and, for an item, `book_id`) equals the patch by
     `canonJson` answers `{ ok: true, revision }` (the same update sent
     again after its answer was lost), another row answers `conflict`, none
     answers `gone`, a failed read `network`. A forced update matches no
     row only when the row is gone.
   - `removeBook` / `removeItem`: `delete().eq('id', id)` under `timed`,
     through `written`.
   - `return { ..., homebrew }`.

9. **`app/src/ports/supabase.test.ts`**, a `describe('the homebrew rows')`:
   extend the hoisted `rows` stub with `insert`, `update`, `delete`,
   `abortSignal` and a settable terminal answer; cases: `load` reads both
   tables with the two selects and `my_limit` with its key, answers the
   limit and null, null when only `my_limit` fails, and `{ ok: false }`
   signed out, on a select's error and on a throw; a create sends `upsert` with `{ onConflict: 'id',
   ignoreDuplicates: true }` and reads `P0001 limit:
   homebrew_items_per_owner` with details `100` as the limit, `23505` as
   `refused`, status 0 and 503 as `network`; an update with a revision
   filters by it and answers the new revision; no row and a row equal to
   the patch answers `ok` with the row's revision; no row and a different
   row answers `conflict`; no row found answers `gone`; a forced update does
   not filter by revision; a remove; a write with no answer is `network`
   at `WRITE_TIMEOUT_MS`.

10. **`app/src/ports/lazy-cloud.ts`**: a `homebrew` member; `newId` and
    `newKey` answer before the chunk loads (`crypto.randomUUID()`,
    `keyFrom(crypto.getRandomValues(...))`); a chunk that never arrives
    answers `{ ok: false }` to `load` and `network` to every write.
    `lazy-cloud.test.ts`: the delegation and the two failure answers.

11. **`app/src/ports/fake-cloud-seed.ts`**: `SeedBook`, `SeedItem`
    (`{ id, key, bookId?, content, createdAgoMs, editedAgoMs }`) and
    `Seed.homebrew: Record<SeedUserId, { books: SeedBook[]; items:
    SeedItem[] }>`. `gm1`: the source `uuid(501)`, key
    `hb_alderworkshopaaa`, `{ ru: 'Мастерская Ольхи', en: 'Alder Workshop',
    sections: [{ key: 'hb_sectpistolsaaaaa', ru: 'Пистоли', en: 'Pistols'
    }, { key: 'hb_sectbladesaaaaaa', ru: 'Холодное оружие', en: 'Blades' }]
    }`; items `uuid(511)` `hb_emberaxeaaaaaaaa` in the source, section
    `hb_sectbladesaaaaaa`: `{ kind: 'equip', ru: 'Топор Тлеющих Углей', en:
    'Ember Axe', rud: 'Лезвие тлеет и не гаснет под дождём.', ende: 'The
    blade smoulders and does not go out in the rain.', eq: { t: 'weapon',
    tier: 2, cls: 'mag', tr: 'spellcast', rg: 'melee', dmg: 'd10+2', dt:
    'mag', bu: 2 } }`; `uuid(512)` `hb_smithpotionaaaaa`, no source: `{
    kind: 'consumable', ru: 'Настой кузнеца', rud: 'Выпейте перед работой у
    горна: до конца сцены вы не отмечаете Стресс от жара.' }`; `uuid(513)`
    `hb_whispercapaaaaaa`, no source, English only: `{ kind: 'item', en:
    'Whispering Cap', ende: 'Once per rest, hear one sentence spoken within
    Far range.', tier: 2 }`; `uuid(514)` `hb_engravedringaaaa`, no source:
    `{ kind: 'item', ru: 'Кольцо с гравировкой', rud: 'Надпись на
    неизвестном языке. Тёплое на ощупь.' }`. `gm2`: none. The header
    comment gains one sentence on the homebrew rows. No list entry refers
    to them yet (`B7.3`).

12. **`app/src/ports/fake-cloud.ts`**, mirroring the database:
    - `FakeCloudOptions.limits` gains `books?` and `items?` (defaults 20
      and 100).
    - Per-user held books and items, copied from the seed with times back
      from `boot`; `deleteAccount` drops them.
    - `newKey()`: `hb_new` plus a counter in base32, left-padded with `a`
      to 13 characters (fixed on every run).
    - `load`: offline or signed out `{ ok: false }`; else copies and
      `itemLimit` = the option.
    - `createBook` / `createItem`: `network` offline or signed out; an id
      that any user already holds answers `ok` and changes nothing, as the
      adapter's `upsert` with `ignoreDuplicates` does (a comment says so;
      review nit 8); an invalid key, a repeated key, `bookProblems` /
      `contentProblems` not empty, or a `book_id` that is not the caller's
      answer `refused`; the limit answers `limited('<key>', n)`.
    - `updateBook` / `updateItem`: a missing row `gone`; a revision given
      and not the row's: `ok` with the row's revision when the row equals
      the patch by `canonJson`, else `conflict`; invalid content
      `refused`; else the
      row's revision + 1, `updated_at`, the touch of every list of the
      caller holding a reference to the item (or to an item of the source),
      and `announce`; answer the new revision.
    - `removeItem`: delete the caller's references from the caller's lists
      (touching them), then the row. `removeBook`: every item of the source
      gets `book_id: null` and revision + 1 (touching their lists), then the
      row goes.
    - Every homebrew write that changed something sends one `homebrew`
      message `{ by: TAB }` to `owner:<uid>`.
    - `insertEntries` (all list writes and `import`): `official` with a
      snapshot, `homebrew` with a snapshot that fails `snapshotValid` or
      whose `id` is not the entry's key, or whose UTF-8 JSON passes
      `SNAPSHOT_BYTES`, and a reference whose key the list's owner does not
      hold answer `refused` (the owner through `userIdOf`).
    - `projection`: a reference's `snapshot` is `recordOf(item.key,
      item.content, book ? { ...book.content, key: book.key } : null)`; a
      reference with no item carries `null`.
    - `shares.clone`: decides from the held source entry, not from the
      projection: a held entry whose `snapshot` is null stays a reference
      only when the caller owns the source list; a held frozen entry keeps
      its snapshot for everyone; every other entry carries the projection's
      snapshot.
    - `load`'s `itemLimit` is the option; the fake has no failing
      `my_limit` path.

13. **`app/src/ports/fake-cloud.test.ts`**: the seed pinned (every key
    matches `HOMEBREW_KEY`, unique per user; every content and book passes
    its validator; the axe's section is in its source; `gm2` holds none);
    every rule of step 12, each as its own case; the limits by option; the
    `homebrew` message once per write with `by: 'fake-tab'`, and none for a
    refused write; the account deletion; offline; "the owner copies its
    own share holding a frozen entry: the frozen entry stays frozen with its
    snapshot, the reference stays a reference"; "an update repeated after it
    landed answers ok"; and contract case M.
    `COVERAGE.md`'s fake row lists them.

14. **`app/src/ports/cloud.contract.ts`**: the header's case list gains "M
    the homebrew rows". In the signed-out block: `homebrew.load()` is `{
    ok: false }` and `createItem` answers `network`. `homebrewCases(port,
    assert)` on the doomed port after case L, with a helper `canon(v)` that
    sorts object keys recursively before `JSON.stringify` (jsonb reorders
    keys):
    1. `load()` is `{ ok: true }` with no books and no items and `itemLimit`
       100; `newKey()` matches `HOMEBREW_KEY` twice, different.
    2. `createBook` of a source with one section answers `ok`, twice.
    3. `createItem` of a weapon in the source and section answers `ok`; a
       second item with the same key and a new id answers `refused`; an item
       with `kind: 'weapon'` answers `refused`.
    4. `load()` reads both back, `canon`-equal, revision 1.
    5. `updateItem` with revision 1 answers `{ ok: true, revision: 2 }`;
       the same update with 1 again answers `{ ok: true, revision: 2 }`
       (it landed); a different update with 1 answers `conflict`; with
       `null` answers revision 3.
    6. A list created with a reference to the item and a frozen entry under
       another key (`recordOf` of the potion) answers `ok`; an `add` of a
       reference to a key the account lacks answers `refused`.
    7. A player share of the list reads the reference's `snapshot`
       `canon`-equal to `recordOf(key, content, book)` of the updated item,
       and the frozen entry as written.
    8. `updateBook` with its revision renames the source; the next share
       read shows the new name in `snapshot.book`.
    9. `removeItem` answers `ok`; the list keeps only the frozen entry;
       `updateItem` of the removed item answers `gone`.
    10. `removeBook` answers `ok`; `load()` holds no source; then
        remove the list.

    `tests/e2e/contract.mjs` (the hosted grants check, review nit 3): add
    `homebrew_books` and `homebrew_items` to the tables `anon` must not
    read, and an `anon` `rpc('my_limit', ...)` that must fail.

15. **`tests/db/homebrew.test.mjs`** (header comment in the style of
    `import-lists.test.mjs`; users A and B; `asRole`, `commitAs`,
    `messagesTo`, `realtimePartition`): the grants (none to `anon`, the
    four to `authenticated`, select and delete to `service_role`, row
    level security on) for both tables; A cannot read, change or delete
    B's rows, and cannot insert an item with B's `book_id`; every fixture
    of `items.json` and `books.json` through the validators (valid true,
    invalid false); every valid `snapshots.json` case:
    `homebrew_snapshot_of` equals `snapshot` (compare as jsonb) and
    `homebrew_snapshot_valid` is true; every invalid one false; the
    maximal snapshot's `octet_length(::text)` under 32768 and an insert of
    it as a frozen entry passes; the key check; `unique (owner_id, key)`
    per owner, the same key for A and B allowed; the pin triggers (id,
    owner, key, creation time kept; revision + 1; `updated_at` moves); the
    21st source and the 101st item refused with the detail, an override
    raising each, `null` no limit; `my_limit` signed out `28000`, A 100,
    A under an override 250 and `null`, an unknown key `22023`, no EXECUTE
    for `anon`; a reference passes for A's own key, is refused (`23503`)
    for a key A lacks and for B's key, through a plain insert and through
    `apply_list_writes` (the write's answer `code: 23503`); a frozen entry
    passes for any key; an official entry with a snapshot, a homebrew
    entry with an invalid snapshot and one whose `id` is not the entry's
    key are refused; an item update bumps each list holding a reference to
    it once and no list holding only a frozen copy; a source rename bumps
    the lists holding a reference to its items; a source delete sets its
    items' `book_id` null and bumps those lists; an item delete removes A's
    references and keeps B's frozen copy; `get_shared_list` fills a
    reference's snapshot from the item, its source and section, and shows
    an edit in the next read; `clone_shared_list` by B freezes the
    references, by A keeps them; A clones its own share holding a frozen
    entry: the frozen entry stays frozen with its snapshot (review blocker
    1); a name holding U+0007 is refused by the CHECK (R1); one `homebrew` message per owner per
    committed transaction with `by` from the tab header, and none for a
    rolled-back one; deleting A's `auth.users` row removes A's sources,
    items and references in either order; the function pin, as
    `list-shares`, `purchase-requests`, `delete-account` and `legacy-move`
    have it: for every new or re-created function (the seven validators and
    the formula, the trigger functions, `list_entries_reference_exists`,
    `my_limit`, `get_shared_list`, `clone_shared_list`) its `prosecdef`,
    its `proconfig` (`search_path=public, pg_temp`) and EXECUTE for
    `anon`, `authenticated` and `service_role` (review blocker 2);
    `EXPECTED_ANON_FUNCTIONS` in `harness.test.mjs` is unchanged (it runs
    as it is).

16. **Other layer 3 files**:
    - `tests/db/limits.test.mjs`: "hold the four defaults" becomes "hold
      the six defaults" with `homebrew_books_per_owner=20` and
      `homebrew_items_per_owner=100` in key order.
    - `tests/db/restore-drill.test.mjs`: the reset's expected
      `limitDefaults()` list gains the two keys.
    - `tests/db/restore-prod.test.mjs`: confirm it pins no default key (its
      `TABLES` are fixture tables); if it does, add the two keys.
    - `tests/db/usage.test.mjs`: `PUBLIC_TABLES` gains `homebrew_books` and
      `homebrew_items`; the near-limit case gains items near and over (step
      17).
    - `tests/db/import-lists.test.mjs`: a case "refuses the whole call for
      a homebrew reference whose key the caller does not hold" and "imports
      a frozen homebrew entry"; rename the inner `const before` (in the
      broadcast test) to `sentBefore`, which shadowed `node:test`'s `before`
      (R6's deferred item).

17. **The usage report**: `tools/supabase/usage.mjs` `collect()` adds a
    `per_items` CTE (`count(*)` per owner of `homebrew_items`,
    `effective_limit(owner_id, 'homebrew_items_per_owner')`) and
    `items_near`, `items_over` beside the others; `usage-lib.mjs` adds the
    line "- owners at 80 % or more of homebrew_items_per_owner: N (above
    100 %: M)", reading a missing field of an older snapshot as 0;
    `usage-lib.test.mjs` updates its three `nearLimits` objects and adds
    the missing-field case.

18. **Docs**:
    - `docs/specs/COVERAGE.md`: the new suites and cases in "Suites" and
      "The unit suite" (`lib/homebrew.test.ts`, `tests/db/homebrew.test.mjs`,
      the fake's homebrew cases, contract case M, `supabase.test.ts` "the
      homebrew rows"); the contract's case list A-M; one sentence that
      `docs/fixtures/homebrew/` holds the validators' shared cases and is
      not a public contract until R7d.
    - `docs/specs/CONTRACTS.md`, the fixtures paragraph at the top: the same
      sentence beside the note on `docs/fixtures/share/records.json`
      (review nit 2; `edit-followup.mjs` flags every `docs/fixtures/`
      edit).
    - `.claude/README.md`: the restore runbook's expected keys (step 4)
      gain `homebrew_books_per_owner` 20 and `homebrew_items_per_owner`
      100, with the migration that seeds them; the usage report's near-limit
      lines, where that section lists them; and in "Undo a deploy that
      carried a migration" one paragraph (review R3): to undo R7, revert the
      app alone - the old frontend writes official rows only, which the new
      checks take; run the homebrew reversal only after a backup and only
      when the tables must go, because it deletes every homebrew source,
      item and homebrew list entry.

19. **Gates** (section "Verification commands"), then the review; after its
    approve, the test project push and the hosted E2E.

### Acceptance criteria

- The migration applies on a reset stack and its reversal passes the
  reversibility gate (up-down-up and the base walk).
- Every `docs/fixtures/homebrew/` case is accepted or refused alike by
  `lib/homebrew.ts` and by the SQL validators, and `recordOf` equals
  `homebrew_snapshot_of` for every snapshot case.
- A reference to a key the list's owner does not hold is refused on every
  write path (a plain insert, `apply_list_writes`, `import_lists`), and a
  frozen entry is accepted for any key with a valid snapshot.
- An item edit or a source rename bumps exactly the lists that hold a
  reference; an item delete removes its references and keeps other
  accounts' frozen copies.
- `get_shared_list` fills a reference's snapshot with the live item, its
  source and section; `clone_shared_list` freezes for another user, keeps
  references for the owner, and keeps a frozen entry frozen for everyone.
- Every new or re-created function has `search_path=public, pg_temp` and
  the EXECUTE grants the plan names, pinned by step 15.
- A name or a text holding a C0 control other than tab and newline is
  refused by `lib/homebrew.ts` and by the database alike.
- An update sent again after it landed answers `ok` in both adapters.
- `my_limit('homebrew_items_per_owner')` answers 100, an override's value,
  or null; signed out it raises `28000`.
- One `homebrew` Realtime message per owner per transaction, `{ by }` only.
- The fake passes contract case M and every rule of step 12; the real
  adapter's mapping passes step 9's cases.
- No golden, state or component changes; `npm run check` and `npm run
  check:db` pass.
- Inherited: `git grep -i -E "pistolheart"` outside `issues/` finds nothing
  (F1).
- Inherited: `tests/db/import-lists.test.mjs` no longer shadows
  `node:test`'s `before` (R6's deferred item).
- Inherited: the restore runbook in `.claude/README.md` names the two new
  limit keys.

### Verification commands

- `rtk npm run check` - one foreground Bash call, timeout 600000
  (`.claude/README.md`, "Run a long check").
- `npm run check:db` - through the PowerShell tool.
- After the review's approve: `npm run db:push -- --project test`, then
  `npm run e2e` (contract cases A-M over the hosted test project).

### Risks and do-nots

- Do not write a component, a store, a route or a golden: `B7.2` owns them.
- Do not seed a list entry that refers to a homebrew key: it moves the
  goldens of lists 101 and 201 (`B7.3`).
- Do not add `owner_id` to the client row shapes.
- Do not give `anon` EXECUTE on any new function; give `authenticated`
  EXECUTE on the validators (the CHECKs need it).
- Do not change `import_lists` or `apply_list_writes`: the trigger guards
  them.
- Do not hand-edit `docs/DECISIONS.md`; it is generated.
- Push to the test project only after the review's approve; never to
  production.
- Fallback: if Postgres named R2's column check otherwise, use that name in
  both files. If the reversibility gate's schema dump prints the restored
  check differently from R2's, compare `pg_get_constraintdef` of both (a
  named check is one catalog row whether declared on the column or on the
  table), make the reversal's text match, and record the finding in the
  handoff.
