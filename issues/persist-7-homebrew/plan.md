# Plan - TASK persist-7-homebrew (releases R7 and R7b)

## Status

- Planning pass 3 (design level, still phase A), 2026-09-30, planner, on
  `main` at `14e6dcf9` (R4 shipped at `88c9f8bc`; R6 committed at
  `885d2978`, its closeout and the persist-4b release run on this tree
  now). Pass 3 answers the owner's first mock review (`context.md`, "Owner
  feedback on the pass 2 mocks", eight items) in section 4.14 (F1-F8),
  revises the mocks and adds `Q9`-`Q12`. Pass 2 (2026-09-28, `b38bc5ab`)
  replaced pass 1 under the owner's widened scope. Phase B (a delta pass
  against R4 and R6 as shipped, and `B7.1`'s implement-ready steps) is a
  later dispatch; nothing here is implement-ready.
- NEEDS_HUMAN_CONFIRMATION: yes - the mocks (`mocks/index.html`, m01-m22)
  and `Q1`-`Q12` of section 9 wait for the owner. Pass 3 did not change
  `Q1`-`Q4`, `Q7`, `Q8`; it renamed the example in `Q5` and widened the
  batch split under `Q6` (section 9 says how).
- Plan review: required before `B7.1` (trigger: a migration with
  SECURITY DEFINER functions, a public contract change - routes, a table
  id, two file schemas - and a stored-data change on `list_entries`).
- Releases and batches (section 7): R7 `B7.1` (schema, ports, pure logic),
  `B7.2` (the account's pages: `#/homebrew` with sources, sections, cards
  and drafts, the editor with its failure states, `#/i/<key>`), `B7.3`
  (homebrew in lists: references and frozen copies on the list, shared,
  lists-index and print pages, the requests panel, the quick draft),
  `B7.4` (the catalog integration: tables, search, cards and rows,
  filters); R7b `persist-7b-homebrew-files` `B7b.1` (the import RPC, the
  two file schemas, `llms.txt`), `B7b.2` (the import and export UI with
  the source mapping, the zip). R8 and R9 change shape (section 7.3).
- What pass 3 changed against pass 2: an invented example source
  «Мастерская Ольхи» / "Alder Workshop" replaces the trademarked one;
  inline creation of a source, a section, a set and a rule card from the
  editor, each with its own write; sections inside a source (`Q10`);
  `craft` and `craft_from` as lists of up to 8 (`Q11`); a quick draft from
  a list page with a `draft` mark (`Q12`); the required-field rules, the
  error summary, the refused-save lines and a revision conflict banner;
  the import's per-source «Куда» mapping (`Q9`); `B7.2` split into `B7.2`
  and `B7.3` (section 7.1). Pass 2's mocks named four catalog records
  wrongly and its example keys broke the key grammar; pass 3 fixed both.
- What pass 2 changed against pass 1: the record shape is the whole
  catalog shape (relations, sets, references, a second stat set, a
  source); sources («Источник» / `book`) and cards (sets and referenced
  cards) are rows; homebrew records join `allEquip`, `searchable`, the
  relation derivations and a table `#/tables/homebrew`, not only `byId`
  and a search group; the search draws one merged result list; a
  «Хоумбрю» show/hide chip; the snapshot embeds the cards it needs and
  the `list_entries` bound widens to 32768; the bundle's `homebrew` array
  moves to its own file `homebrew.json` (R6's zip); the editor keeps its
  save button and gains an unsaved-changes guard; `import_bundle` is
  replaced by a client-side reference conversion plus `import_homebrew`.

## 1. Objective and current state

Release R7 adds homebrew items to a signed-in account as first-class
catalog records: the same shape as an official record, made and edited in
the app or imported from a file, grouped by the author's sources, found by
search and on the tables, related to catalog items (upgrade lines, craft
chains, sets, referenced cards), added to lists as live references,
frozen when a copy leaves the account, printed as any card. R7b adds the
file formats, `llms.txt` and the import and export surfaces.

State at `b38bc5ab`: `list_entries.source` and `snapshot` exist and are
never written (`source` always `official`, `snapshot` null; the CHECK
`(source = 'official') = (snapshot is null)` and the 16384-byte bound are
in `20260925130100_lists.sql`, "R7 may widen"). `get_shared_list` and
`clone_shared_list` copy `source` and `snapshot` through. `CloudPort` has
`auth`, `prefs`, `lists`, `shares`, `events`, `requests` (R4 `B4.2` adds
`requests` to the fake and the contract now). `ListRepository` is `newId`,
`list`, `apply`, `move` (R5's buffer, `apply_list_writes` takes `source`
and `snapshot`). The account menu (`AccountMenu.svelte`) draws «Аккаунт»,
«Мои списки», «Выйти». `AppState.index` is built once from `LOOT`;
`Index` has `byId`, `all`, `rows`, `searchable`, `allEquip`, `craftedFrom`
(one source per target), `setMembers`, `rarityOf`, `altRow`, `altColumn`,
`refs`, `sets`. `TABLE_IDS` has 16 tables; `TABLE_GROUPS` ten groups;
`EQ_SRC` is a fixed list of five books and the frames.

The catalog (`data.js`, 1272 records, 2026-09-28): fields `id`, `src`,
`kind`, `roll`, `en`, `ende`, `ru`, `rud`, `img`, `craft` (17 records),
`refs` (13), `eq` (604, of which 288 in 72 upgrade lines - every line
shares one image - and 20 with `alt`), `community`/`community_ru` (90),
`frame` (95), `tier` (`A` 9, `C` 5), `recall` (102, stored, drawn
nowhere in the app), `set` (5, two sets), `starting` (30); `LOOT.sets`
(2), `LOOT.refs` (13), `LOOT.alt`. Id prefixes: `ci cc hi hc w cm di f
voa dv dve q`; none starts with `hb`.

## 2. Scope and non-goals

In scope (R7): three tables (`homebrew_books`, `homebrew_cards`,
`homebrew_items`) with owner-only RLS and count limits; the full record
shape in one jsonb column, validated in SQL and in `lib/homebrew.ts`
over shared fixtures; keys `hb_` + 16 base32 for every homebrew object;
the reference and frozen-copy rule on `list_entries` with a widened bound
and a reference-exists trigger; the shared projection carrying the
referenced content and its cards; the `HomebrewRepository` port in the
real adapter and the fake; the `Homebrew` store; the merged index
(`withRecords`) that puts own records into `byId`, `searchable`,
`allEquip`, the relation derivations, `sets`, `refs` and a `homebrew`
table, and frozen copies into `byId` alone; routes `#/homebrew`,
`#/homebrew/new`, `#/homebrew/<key>`, `#/tables/homebrew`; the account
menu entry «Мои предметы»; the management page with sources; the editor
with relation pickers and card forms; the record card and row drawing
homebrew relations, marked; the tables (`homebrew`, the three equipment
tables with dynamic `src` values); one merged search; the «Хоумбрю»
show/hide chip; lists, shared pages and print resolving references and
frozen copies; delete with the count warning; account deletion by
cascade; the owner-topic `homebrew` event; layer 1-4 coverage; goldens.
Pass 3 adds (4.14): inline creation of a source, a section, a set and a
rule card from the editor; sections inside a source (`Q10`); `craft` and
`craft_from` lists of up to 8 (`Q11`); the required-field rules, the
error summary, the refused-save lines and the revision conflict; the
«Карты» panel's forms; the quick draft from a list page with its `draft`
mark (`Q12`).

In scope (R7b): `schema/homebrew-v1.json` and the file format
`daggerheart-loot/homebrew`; `schema/import-v2.json` (lists with homebrew
entries); `import_homebrew` RPC with skip or update of held keys; the
import's source mapping (`Q9`);
`llms.txt` sections for both, proven by a blind round; «Импорт предметов»
and «Скачать предметы (JSON)» on `#/homebrew` (all, one source, a
selection); `homebrew.json` in the account's data zip; the account page's
hint.

Non-goals: art (R8); `#/h/<token>`, clone and add from a link, print
routes for cloud lists (R9); books shared with other users, subscriptions
and roll tables per book (item 13, a later release; subcategories moved
into R7 as sections if the owner accepts `Q10`); moving items between
sources in bulk; a
Trash or undo for a deleted item (decision 30); homebrew in the roll
pages (owner, item 10); `roll`, `frame`, `starting`, `recall` and
`community` on a homebrew record (section 3); a per-field write buffer in
the editor (section 4.10); `img` in the file format before R8.

## 3. The gap audit (item 12)

Every surface that touches a catalog record, what a homebrew record would
do there today, and the decision. "Include" is R7 or R7b (the batch in
the last column); "defer" names the release; "ask" is a question of
section 9.

| # | Surface | What differs for a homebrew record | Decision | Where |
|---|---|---|---|---|
| G1 | `#/roll/std`, `#/roll/alt`, `#/roll/wondrous`, `#/roll/dread`, `#/roll/voa`, `#/roll/dv`, `#/roll/community` | Roll pools read `index.rows` and `LOOT.alt` by id; a homebrew record is in neither | Excluded by the owner (item 10). The shape does not close it off: a later `roll` field and a `hb_<book>` row table (section 4.13) | - |
| G2 | The three equipment tables `#/tables/eq_*` | `equipOfKind` reads `allEquip`; the `src` facet lists `EQ_SRC` (five books, four frames) | Include: own equipment joins `allEquip`; `src` gains «Хоумбрю» (`hb`) and each source as a value; the tier sections and the `A` chip already follow the records | `B7.4` |
| G3 | The book tables (`core_*`, `hnf_*`, `wondrous`, `dread`, `voa`, `dv`, `community`, `alt_*`, `other_*`) | Rows are a book's own; a homebrew record has no roll number and no book | By design, not drawn there. A homebrew table of its own instead (G4) | - |
| G4 | A table for homebrew | None exists | Include: `homebrew` joins `TABLE_IDS` (a contract change), group «Хоумбрю» drawn only signed in, sectioned by source, facets `kind` and `src` (the author's sources) | `B7.4`, ask `Q2` |
| G5 | Filter grammar and the `f_` address | `src` values are fixed keys; a homebrew source key in an address opened by another account narrows to nothing | Include: dynamic values `hb` and `hb_<16>`; an unknown value empties the table as any bogus value does today (accepted) | `B7.4` |
| G6 | "With / without homebrew" (item 11) | No such narrowing | Include: a memory-only chip «Хоумбрю» (pressed = shown) beside the kind chips on `#/search` and in the equipment tables' toolbar, drawn only when the account has items; not in the address | `B7.4` |
| G7 | A table's own search box, the copy-link button of a section, the grid tiles | Work over the table's rows; a tile's number badge reads `it.roll` | Include, nothing to change: a homebrew row has no number badge | `B7.4` |
| G8 | `#/search` | Filters `index.searchable` (official only) | Include: one merged result list, official first, the 300 cap over all, the badge tells them apart (pass 1's second group dropped) | `B7.4` |
| G9 | `#/i/<id>` | `byId` misses; the not-found page | Include: the owner's item resolves; the sub line reads the path «Хоумбрю · Мастерская Ольхи · Ранг 2»; «показать в таблице» leads to `#/tables/homebrew/<source>`; «Изменить» in the pick row; signed out or another account: not found | `B7.2` |
| G10 | The record modal from a row | Same card | Include: «Изменить» for an own live item; none for a frozen copy | `B7.2` |
| G11 | The record card: tier ladder, craft lines, set line, set bonus, refs | Derived from the index; a homebrew rung, target, member or card is unknown | Include: derived over the merged index; homebrew names dashed and titled; many targets folded (section 4.4) | `B7.4` |
| G12 | The table and search row (`RowMain`): the craft line, badges | Same as G11 in one line | Include: first name plus «и ещё N»; dashed source badge | `B7.4` |
| G13 | `RecordActions`: copy name, copy link, share, copy image, copy text | Copy link and share use `recordUrl` (a stub `i/<id>.html` that does not exist); copy image needs art | Include: `recordUrl` answers the app address for a `hb_` id (pass 1); copy image hidden while there is no art (the existing no-art rule); copy text works over the merged index | `B7.2` |
| G14 | `#/print/<ids>` and the print card | Resolves through `app.index`; the source line is `printSrc` | Include: an own or frozen (own list) id prints; the source line is the path; the glyph until R8. A viewer's frozen copy cannot print from the address: `DEBT.md` under R9 (pass 1) | `B7.3` |
| G15 | Add-to-list from a card, a row's tick and the selection bar, the record page | `entryRowsOf` writes `official` | Include: a resolver writes a reference for an own item, a frozen row for a carried snapshot (pass 1) | `B7.1`, `B7.3` |
| G16 | The list page: rows, the modal, copy list text, the print button, undo of a removed entry, the batch bar | `byId` over `own.ids`; `shareList` takes an index | Include: one derived index per page (`withRecords` with the list's snapshots); `shareList` and the batch bar get that index; undo rewrites `source` and `snapshot` from the row it removed | `B7.3` |
| G17 | The lists index: card thumbnails and count | `knownItems` reads `app.index` | Include: through the list's snapshots too, so a frozen copy counts and draws `_none` | `B7.3` |
| G18 | `#/s/<token>` | `sharedListOf` drops unknown ids | Include: the projection fills a reference's snapshot (pass 1); the page merges snapshots into its index | `B7.1`, `B7.3` |
| G19 | Purchase requests (R4): the owner's panel, the requester's send, apply and decline | Lines carry `item_key`; the panel names items through `app.index`; a frozen copy in the owner's own list is not in it | Include: the panel resolves names through the list's index (`withRecords`); R4 shipped at `88c9f8bc` and persist-4b polishes it now - phase B reads what shipped and places one line | `B7.3` |
| G20 | «Сохранить себе» (clone) and R4's add-to-my-list | Copy `source` and `snapshot` through | Include: `clone_shared_list` freezes unless the caller owns the list (pass 1); add-to-my-list writes the carried snapshot | `B7.1`, `B7.3` |
| G21 | Realtime (R3): the owner topic, share topics | A list bump reaches them; an item edit bumps nothing | Include: the touch trigger bumps referencing lists (pass 1); a `homebrew` event on `owner:<uid>` refreshes the store on other devices | `B7.1`, `B7.2` |
| G22 | Export (R6): a list file, the account zip | v1 refuses `source: homebrew` | Include (R7b): `import-v2` for list files, `homebrew.json` in the zip, the account hint | `B7b.2` |
| G23 | Import (R6) | `import_lists` passes `source` and `snapshot` through | Include (R7b): a v2 list file's homebrew entries import frozen, or as references when the account holds the key (client-side conversion); `import_homebrew` for the items file | `B7b.1`, `B7b.2` |
| G24 | `llms.txt`, `schema/` | Nothing about homebrew | Include (R7b): two sections, two schemas, a blind round | `B7b.2` |
| G25 | `catalog.csv`, `data.json`, `i/<id>.html`, `og/`, the English entry document | Generated from `data.js` | By design, never carry a homebrew record; `llms.txt` says so | `B7b.2` |
| G26 | `#/account`: «Ваши данные», delete account | The zip hint names `lists.json`; `delete_account()` cascades | Include: the hint (R7b); the cascade (`B7.1`) | `B7.1`, `B7b.2` |
| G27 | The account menu | «Аккаунт», «Мои списки», «Выйти» | Include: «Мои предметы» between «Мои списки» and «Выйти» (decision 2026-09-26) | `B7.2` |
| G28 | Language switch, `nameOf` and `descOf` | English never falls back | Include: the record is built with a fallback from the other language, so a one-language item never draws blank (pass 1) | `B7.1` |
| G29 | Description labels (`hasLabels`: equipment and Vault of Ages only) | A homebrew loot description with `Label: text` lines draws no italics | Include: a homebrew record has labels (`src === 'homebrew'`) | `B7.4` |
| G30 | Sign-in prompt states, unconfigured build | - | Include: `#/homebrew*` and `#/tables/homebrew` signed out draw the prompt; unconfigured they draw the not-found page and keep the address (`#/account` precedent) | `B7.2`, `B7.4` |
| G31 | Storage, the two-tab merge, `STATE.md` | Nothing local | Include: nothing of homebrew in `localStorage` or session memory beyond the store; `STATE.md` says so | `B7.2` |
| G32 | Static pages `privacy`, `terms` | Name "homebrew items" already | Phase B checks the wording covers sources and cards (the same class of data) | `B7.2` |
| G33 | Usage report (R11) | Counts tables by name | Include: the three tables and the new limit keys join the report's lists | `B7.1` |
| G34 | Keyboard and screen readers: the pickers, the fold, the chip | New controls | Include: axe on every open state; the fold is a button with `aria-expanded`; the picker is a combobox pattern | `B7.2`, `B7.4` |
| G35 | Roll "copy every option", `shareRoll` | Roll pages excluded | - | - |
| G36 | The legacy `#/l/` codec | Official ids only; retires at R10 | Nothing: a homebrew entry never enters a browser list | - |
| G37 | Set filter or set page | None for official records either (decision 2026-09-19) | Defer with the official ones | - |
| G38 | The art slot: card, row, print, list thumbnails | `_none.webp` | R8; the editor's preview reserves the slot | R8 |
| G39 | The list page's own add path (pass 3, F8) | A list page adds nothing itself; items come from catalog pages | Include: «+ Свой предмет» on an own account list makes a draft item and a reference in one press (4.14 F8) | `B7.3`, ask `Q12` |
| G40 | Community-style subcategories (pass 3, F4) | The community table sections and filters by `community`; a homebrew source has no inner level | Include: sections inside a source, a `sect` facet on the `homebrew` table, the path's third leaf (4.14 F4) | `B7.1`, `B7.2`, `B7.4`, ask `Q10` |
| G41 | A record's craft relations (pass 3, F6) | The catalog stores one `craft` id per record | Include: a homebrew item stores up to 8 of each direction (4.14 F6) | `B7.1`, `B7.2`, ask `Q11` |
| G42 | Form failure states (pass 3, F5) | The app has no required mark and no field-level error pattern | Include: the required mark, the error summary, field errors, refused-save lines, a revision conflict banner (4.14 F5) | `B7.1` (the revision check), `B7.2` |

## 4. Design

### 4.1 The record shape (items 1, 2)

A homebrew item is a `Record_` whose stored part is `HomebrewContent`:
every field a catalog record may carry except the ones tied to a book's
own tables.

```ts
/* lib/homebrew.ts - pure */
export interface HomebrewContent {
  kind: 'item' | 'consumable' | 'equip';
  en?: string;   ru?: string;     // 0..120 code points; at least one non-empty
  ende?: string; rud?: string;    // 0..3000
  tier?: 1 | 2 | 3 | 4 | 'A' | 'C';   // loot only; 'A' artifact, 'C' cursed (the catalog's badges)
  eq?: HomebrewEquip;             // iff kind === 'equip'
  section?: string;               // pass 3 (Q10): a hb_ key of a section of the item's own book
  craft?: string[];               // pass 3 (Q11): upgrades to, 1..8 official ids or hb_ keys
  craft_from?: string[];          // pass 3 (Q11): made from, 1..8; the reverse, stored here because the official side is read-only
  set?: string;                   // a catalog set key or a hb_ card key of kind 'set'
  refs?: string[];                // 0..3 catalog ref keys or hb_ card keys of kind 'ref'
}
// pass 3 (Q12): homebrew_items.draft boolean - a column beside content, never in content, a snapshot or a file
export interface HomebrewEquip {
  t: 'weapon' | 'secondary' | 'armor';
  tier: 1 | 2 | 3 | 4 | 'A';     // typed by the author, never derived
  cls?: 'phy' | 'mag'; tr?: Trait; rg?: Range; dmg?: string; dt?: 'phy' | 'mag' | 'any';
  bu?: 1 | 2 | 'any'; as?: number; th?: [number, number];
  line?: string;                  // the first item of the line: an official id or a hb_ key; absent = unique
  alt?: Pick<HomebrewEquip, 'tr' | 'rg' | 'dmg' | 'dt'>;   // the second strip
}
```

Field names are the catalog's own (`data.json`), so one shape serves the
form, the column, the snapshot and the file; an LLM that read `data.json`
can write it. Two exceptions since pass 3: `craft` is a list here (the
catalog's is one id; the file reader takes a string as a list of one,
4.14 F6), and `section` names a section of the item's source (4.14 F4).
`craft_from` is the one field the catalog does not have:
`craft` is stored in one direction only, and a homebrew item that is
made from an official item cannot write on the official record. Fields a
homebrew record never carries: `roll`, `frame`, `starting`, `community`,
`recall` (Vault of Ages' own, drawn nowhere), `img` (R8 adds it through
`art_url`). `kind === 'equip'` iff `eq` is present (`kindOf`).

Validation: enums as pass 1 plus `tier` `A`/`C` on loot, `eq.tier` `A`,
`craft`, `craft_from`, `set`, `refs[]`, `eq.line` as ids
(`^[A-Za-z0-9_-]{1,64}$`, the `item_key` grammar; a key nothing answers
is not drawn, the rule `craftedFrom` already follows), `refs` at most 3,
`alt` with the weapon subset. `validateDraft(content): Problem[]` and
`public.homebrew_content_valid(jsonb)` enforce the same rules over
`docs/fixtures/homebrew/valid.json` and `invalid.json` (pass 1).

Languages (item 2, decided): the stored shape holds both languages,
each optional, at least one name required; `toRecord()` fills a missing
language from the other, so `nameOf`/`descOf` need no change. Migration
cost either way: storing one language plus a `lang` field now and adding
the second later means a migration that rewrites every `content` and
every frozen `snapshot` in `list_entries` (a frozen copy is immutable by
decision, so it would need a special case), a validator replacement and a
file format bump to `homebrew-v2`; storing both now costs nothing later
and the file format is bilingual from its first version, which item 13's
converted books need. Recommendation `Q4`: bilingual shape; the editor
shows the UI language's name and description and folds the other
language under «Другой язык» / "Other language" (two fields the shape
already has; a converted book keeps its English while the author writes
Russian).

Size: names 120 and descriptions 3000 code points per language as pass 1;
a maximal item is about 13 KB of JSON before its cards (section 4.8).

### 4.2 Sources: «Источник», `book` (items 9, 13)

A source groups an author's items the way a book groups the catalog's.
UI word: «Источник» / "Source" (the facet label `t.source` already);
code and schema word: `book` (`homebrew_books`, `Record_.book`), so it
does not collide with `list_entries.source` (`official` | `homebrew`)
and names item 13's target. One word per layer, stated here once.

- `homebrew_books(id, owner_id, key hb_..., content jsonb { en?, ru? } (1..80 code points, at least one), revision, created_at, updated_at)`,
  `unique (owner_id, key)`, limit `homebrew_books_per_owner` 20.
- An item's `book_id uuid null references homebrew_books on delete set null`:
  null is the default source, tagged «Хоумбрю» / "Homebrew" (owner, Q3 of
  pass 1). Deleting a source keeps its items and drops them to the
  default (the confirm says so).
- The record carries `book?: { key, en, ru }` (denormalised at build by
  `toRecord`, rebuilt when a source is renamed; a frozen snapshot keeps
  the name it was frozen with). `srcOf(it)` answers `it.book?.key ?? 'hb'`
  for the facets; `srcLabel` answers the source name in the UI language
  (fallback to the other) or «Хоумбрю»; `tableOf` answers `homebrew`;
  `whereFrom` answers «Хоумбрю · <source>» (the group and its leaf, the
  community rule) or «Хоумбрю» alone; `printSrc` follows `whereFrom` for
  a homebrew record, as it does for a community record.
- Label form (item 9, `Q5`): recommended - the tag reads the source name
  alone («Мастерская Ольхи»; «Хоумбрю» for the default source) and takes a
  dashed border (`.badge.src.hb`, the property style `.badge.uniq`
  already uses) with the title «Хоумбрю: ваш источник» / "Homebrew: your
  source"; the path form on the record page and the print card reads
  «Хоумбрю · Мастерская Ольхи». Reason: a tag is one leaf, and "dashed means
  homebrew" is the one visual rule this release adds (section 4.4).
  Alternative: the text «Мастерская Ольхи (HB)» everywhere.
- Sources live on `#/homebrew` (section 4.10): add, rename, delete;
  `#/tables/homebrew` sections by them. Pass 3: the editor creates one
  inline (4.14 F2), a source may hold sections (4.14 F4, `Q10`), and an
  import creates the file's sources through a mapping (4.14 F3, `Q9`).

### 4.3 Cards: sets and referenced cards

A set's bonus and a referenced card are stored once and drawn on every
record that names them (`LOOT.sets`, `LOOT.refs`). Homebrew needs the
same store: `homebrew_cards(id, owner_id, kind 'set' | 'ref', key hb_...,
book_id null, content jsonb, revision, created_at, updated_at)`,
`unique (owner_id, key)`, limit `homebrew_cards_per_owner` 100. `content`
is `SetCard` (`en`, `ru`, `ende`, `rud`; names 1..80, texts 0..1200) or
`RefCard` (`en`, `ru`, `ensub`, `rusub`, `ende`, `rud`, `url` optional
`https:` 0..300; names 1..80, subs 0..60, texts 0..1200), one language
required. The merged index's `sets` and `refs` are the catalog's plus
the account's, keyed by `hb_` keys, so nothing collides.

An item may name a catalog set (`saints-ensemble`) or card
(`vicious-entangle`) as well as an own one (item 3). A card's editor is
inline in the item editor («+ новый комплект», «+ новая карта») and on
`#/homebrew` (a «Карты» panel: rename, edit, delete; a deleted card's key
stays on the items that named it and is simply not drawn).

Rejected: the set card on one member (the 2026-09-19 decision), the
cards inside a source row's jsonb (an item with no source has nowhere to
put them), two tables (`homebrew_sets`, `homebrew_refs`: the same RLS,
limit and revision code twice).

### 4.4 Relations across the boundary (items 3-6)

Storage: a homebrew item stores its relations as keys (`craft`,
`craft_from`, `eq.line`, `set`, `refs`); an official record is never
written. Derivation, over the merged index (section 4.6):

- `upgradesTo(id): Record_[]` = records whose `craft_from` holds `id`,
  plus the records `it.craft` names; `madeFrom(id): Record_[]` = the
  records whose `craft` holds `id`, plus the records `it.craft_from`
  names; each deduplicated by id (an edge stored on both sides draws
  once). The catalog's one-id `craft` reads as a list of one. Both
  replace `Index.craftedFrom: Map<string, string>` (one source per
  target) with maps to arrays; `RecordCard`, `RowMain`, `share.ts` and
  `data.test.ts` read the new shape. Official first, then homebrew, each
  group in catalog or name order.
- `setMembers` groups own records by `set` beside the catalog's;
  `upgradeLine` filters `allEquip` by `eq.line` (own equipment included)
  and sorts by tier; a record that is not in `allEquip` (a frozen copy)
  is appended to its own ladder so the "on" rung exists.

Display (item 4, the 15 bedrolls): a craft line with more than three
names draws the first three, then a button «и ещё 12» / "and 12 more"
(`aria-expanded`) that unfolds the rest inline; the row (`RowMain`)
draws the first name and «и ещё 14». The set line lists every member
(a set of sixteen is a long line; accepted, the fold rule applies past
eight). Copied text (`shareBlocks`) writes every target as today, one
block per target, homebrew ones after official.

Marking (item 5): one rule - dashed means homebrew. A homebrew record's
name inside a relation (a craft target, a set member, a ladder rung)
takes a dashed underline (`.craft a.hb`, `.step.hb` a dashed border) and
the title «<source> · хоумбрю»; the source badge is dashed (4.2). The
official record's own card is otherwise unchanged, so a reader without
homebrew sees today's card byte for byte.

Visibility (item 6): the merged index is built from the signed-in
account's own rows, so only the author sees own relations on catalog
cards. A frozen copy in a list merges into `byId` alone (section 4.6):
its own card draws its outbound relations where they resolve (made from
«Первоклассный Спальный Мешок» does; a target the viewer does not hold
is not drawn), and the official card opened from that list page shows
no homebrew relation. A cloned item (R9) is an own item and joins the
derivations as one.

### 4.5 Tier progression and "unique" (item 1)

The catalog's upgrade line is `eq.line` (the first item's id; the four
tiers of one weapon, one shared picture) and a one-off is an empty
`line`, drawn as the «Уникальное» badge and offered by the `line` facet
as `uniq`. The editor's «Линия улучшений» / "Upgrade line" is a `Seg`:
«Уникальный» (no `line`, the badge) / «В линии» (a picker for the item
that opens the line - official or own; `line` = that item's `eq.line` or
its id) / «Новая линия» (`line` = the item's own key, the first rung).
A homebrew rung on an official ladder is one more square, dashed
(4.4); two rungs of one tier stand side by side. Artifact is the
existing `eq.tier: 'A'` value (a `Seg` option «Артефакт»). R8 reuses the
line for art: the uploader offers the line's picture.

`Q1` (recommended): "unique" is the one-off outside a line - the
existing mechanism, no new flag; "artifact" is `tier 'A'`, also existing.

### 4.6 The merged index and where homebrew appears (items 10, 11)

`withRecords(base: Index, own: { records, sets, refs, books }, frozen: Record_[]): Index`
in `lib/homebrew.ts` returns:

| Field | Own records | Frozen copies |
|---|---|---|
| `byId` | join (an official id is never shadowed: `hb_` keys) | join where the key is not held |
| `searchable`, `allEquip` | join, after the catalog's | no |
| `rows` | a new key `homebrew`: own records, sections by source in the page's order (default first, then sources by name), inside by name in the UI language | no |
| `upgradesTo`, `madeFrom`, `setMembers` | derived over catalog + own | no |
| `sets`, `refs` | catalog + own cards | the snapshot's embedded cards, for its own card only (4.8) |
| `all`, `rarityOf`, `altRow`, `altColumn` | the catalog's objects, untouched | untouched |

`AppState.index` becomes `$derived(withRecords(base, homebrew.own, []))`;
a list, shared or print page derives its own `withRecords(app.index,
none, snapshots)` (pass 1). `withRecords` returns `base` itself when both
inputs are empty, so a signed-out build keeps today's index object and
no golden without `as` moves.

Tables (`Q2`, recommended reading: a table page of their own):
`TABLE_IDS` gains `homebrew` (a contract change in `ROUTES.md` and
`CONTRACTS.md` section 1); `TABLE_GROUPS` gains `{ id: 'hb', label:
'srcHomebrew', top: 'homebrew', subs: ['homebrew'] }` last, its chip
drawn only when a user is signed in (signed out the address still
parses: the page draws the sign-in prompt; unconfigured, the not-found
page); `PLAIN_GROUPS.homebrew = ['kind', 'src']` with `src` values built
from the account's sources (`hb` and each `hb_` key), sectioned by
source with the source key as the anchor. The equipment tables' `src`
facet appends the same dynamic values after the fixed `EQ_SRC` list,
through the presence filter that already hides a source with no rows of
that kind; `srcName` takes a resolver for `hb` keys. The `line` facet's
`uniq` and the tier `A` chip follow the records with no change.

The chip (item 11): `app.homebrewShown` (memory only, default true, the
`kinds` precedent), drawn as a pressed `Chip` «Хоумбрю» beside the kind
chips on `#/search` and in the equipment tables' toolbar, only while the
account holds at least one item; off, own records leave `searchable` and
`allEquip` for those pages (the `homebrew` table ignores it). Not in the
address: the frozen filter grammar does not change, and a link narrowed
by private items has nobody to open it. Rejected: a `hb` filter group
(a grammar change on three tables for a private narrowing).

Search (G8): one merged list; the second group of pass 1 is dropped -
first-class means the same rows, told apart by the tag. `hayFor` is
keyed by id, so the page derives its cache from `index`, not `t` alone
(an edit changes the object, not the id).

### 4.7 Schema (design level; phase B writes the migration)

One migration `<stamp>_homebrew.sql` and its reversal, the R2
conventions (pass 1 section 4.3 lists them). Objects:

- `homebrew_books`, `homebrew_cards`, `homebrew_items` (4.2, 4.3, 4.1):
  `id uuid pk` client-made, `owner_id` cascade, `key text check '^hb_[a-z2-7]{16}$'`,
  `content jsonb check (<kind>_valid(content))` with a size CHECK,
  `book_id` on cards and items (`on delete set null`), `revision`,
  `created_at`, `updated_at`, `unique (owner_id, key)`; owner-only RLS,
  `service_role` select and delete; a `before_update` pin trigger and a
  limit trigger each (`effective_limit`, keys `homebrew_books_per_owner`
  20, `homebrew_cards_per_owner` 100, `homebrew_items_per_owner` - `Q3`).
  Pass 3: `homebrew_items.draft boolean not null default false` (`Q12`);
  a book's `content` may hold `sections [{ key, en?, ru? }]`, at most 30,
  keys unique in the book (`Q10`).
- Validators `homebrew_content_valid`, `homebrew_card_valid(kind, jsonb)`,
  `homebrew_book_valid`, immutable, over the shared fixtures. Pass 3:
  `craft` and `craft_from` arrays of 1-8 unique ids; `section` a key;
  `eq` requires the six weapon fields or the two armour fields and a
  `dmg` of `^d(4|6|8|10|12|20)(\+([1-9]|1[0-9]|20))?$`; `th` ascending;
  `alt` all four or absent; a set card's text and a ref card's text
  required (4.14 F5). Cross-row rules (the section is in the item's own
  book, a line starts at equipment of the same type) are the client's
  and the import's; a key that answers nothing is not drawn.
- `homebrew_snapshot_of(p_key, p_content, p_book, p_cards)`: the record
  with the fallbacks, `src 'homebrew'`, `book { key, en, ru }` and
  `cards { sets: {...}, refs: {...} }` holding the own cards the item
  names (4.8); `homebrew_snapshot_valid`.
- `list_entries`: the R2 CHECK replaced by `source = 'homebrew' or
  snapshot is null` and `snapshot is null or homebrew_snapshot_valid(snapshot)`;
  the size bound widened to 32768 (R2 foresaw it); a new trigger
  `list_entries_reference_exists` (before insert or update of `item_key`,
  `source`, `snapshot`): a homebrew reference (`snapshot is null`) needs
  `exists homebrew_items where owner = the list's owner and key = item_key`,
  else `23503`-class refusal - no dangling reference can be written by
  any path (import included).
- `homebrew_items_touch` (an edit bumps every referencing list's
  `revision`), `homebrew_items_before_delete` (removes the owner's
  references; pass 1), `homebrew_books_touch` and `homebrew_cards_touch`
  (a rename or card edit bumps the lists referencing an item of that
  source or naming that card - the shared projection reads them).
- `homebrew_broadcast`: after insert, update or delete on the three
  tables, event `homebrew` `{ kind: 'book' | 'card' | 'item', key,
  revision | null, by }` to `'owner:' || owner_id` (R3's send helper and
  tab header).
- `get_shared_list` and `clone_shared_list` re-created (pass 1): the
  projection fills a reference's `snapshot` from the item, its source
  and its cards; a clone freezes unless the caller owns the list.
- `import_homebrew` is R7b's (`B7b.1`): `import_homebrew(p_books jsonb,
  p_cards jsonb, p_items jsonb, p_update boolean) returns jsonb
  { books, cards, items, updated }`, `security invoker` (the
  `import_lists` reasoning), one transaction; a held key is skipped, or
  updated when `p_update` (references stay live; frozen copies do not
  move); the limit triggers refuse the whole call.
- Reversal: the R2 bodies of the two share functions, the R2 CHECK and
  bound back, the trigger and tables dropped, the limit rows deleted.

Account deletion: `on delete cascade` from `auth.users`; the
before-delete trigger removes references first (a layer 3 case proves
the order does not matter). Decision 40's Edge Function stays R8's.

### 4.8 References and frozen copies

The pass 1 rule holds (decision 2026-09-26): an own item in an own list
is a reference (`source 'homebrew'`, `snapshot` null) drawn from the
merged index; a copy that leaves the account is frozen by
`homebrew_snapshot_of`. Changes:

- The snapshot embeds what its card needs and the viewer cannot resolve:
  `book { key, en, ru }` for the tag and the path, and `cards` for its
  own set bonus and referenced cards (parity: "referenced cards travel
  with the item into copies and shares", `FEATURES.md`, "Records").
  Relations stay keys and draw only where they resolve (4.4).
- Size: an item of 13 KB plus three ref cards of up to 6 KB each is
  under 32768 with margin; the `list_entries` bound widens to 32768
  (both CHECKs, the R2 comment foresaw R7 doing it); `octet_length`
  bounds on `content` of each table match the fixtures' maxima.
- The resolver of `entryRowsOf` (pass 1) writes a reference for an own
  item, the carried snapshot for a frozen row, `official` otherwise;
  `restoreEntry` rewrites what it removed.
- `CloudList.snapshots` and one derived index per list, shared, print
  and lists-index page (pass 1, G16-G18).

### 4.9 Ports and state

`HomebrewRepository`: `newId()`, `newKey()`, `load(): Promise<{ ok, books,
cards, items } | { ok: false }>`, and one create, update and remove per
kind as plain PostgREST writes (`{ onConflict: 'id', ignoreDuplicates:
true }` on create), each answering `ListWrite`; R7b adds `import(...)`.
Pass 3: an update names the revision the form loaded (`.eq('revision',
r)`, `select` of the row); zero rows answered and a re-read that finds
the row answers `{ ok: false, error: 'conflict' }`, a re-read that finds
nothing answers `{ ok: false, error: 'gone' }`; `force: true` writes
without the revision (the conflict banner's «Сохранить мою версию»,
4.14 F5).
The row shapes carry `owner_id`, so the store computes `editable` per
row now - item 13's subscribed rows will not be editable, and no page
may assume that a visible row is the author's. The fake seeds `gm1` with
two sources («Мастерская Ольхи» with the sections «Пистоли» and
«Холодное оружие», and the default), four items (the pass 1 axe, potion
and cap - the axe in «Холодное оружие», in a line with `q1`'s Broadsword
at tier 2, `craft_from: ["ci1"]`, `craft: [<the potion's key>]` so a
list relation has two sides - and one draft), one set card and one ref
card; `gm2` with nothing; the
reference row in list 101 and the frozen row in list 201 (pass 1). The
`Homebrew` store: `status`, `books`, `cards`, `items`, `own = $derived`,
`load`, `refresh` (on focus, on the `homebrew` event, every 45 s while a
homebrew page is on screen), `clear`, `save`, `remove` per kind, and the
counts a delete confirm needs.

### 4.10 Routes, pages and the editor (item 7)

Routes: `#/homebrew`, `#/homebrew/new`, `#/homebrew/<key>` (pass 1; the
key grammar `hb_[a-z2-7]{16}`), `#/tables/homebrew[/<anchor or f_>]`
(4.6). No tab reads current on `#/homebrew*`; `tables` is current on the
table. Entry points: the account menu's «Мои предметы», the table
group's chip, «Изменить» on an own record, the `#/i/` sub line's table
link.

`#/homebrew` («Мои предметы»): the head with «N предметов из 500»; a
panel «Источники» listing the default «Хоумбрю» and each source with its
count, an inline rename, «Скачать JSON» (R7b) and «Удалить» (confirm:
«Удалить источник «Мастерская Ольхи»? Его 23 предмета останутся как
«Хоумбрю».»), and a «+ Новый источник» name field; a panel «Карты» folded
(sets and referenced cards, edit and delete); the actions row «+ Новый
предмет» (primary), «Импорт предметов» (R7b, R6's panel pattern); then
the items as `TableRows` grouped under one heading per source, each row
opening the editor, with the row's tick feeding the selection bar
(add-to-list, print, copy) and R6's `BatchBar` («Удалить (N)», «Скачать
JSON (N)» in R7b) on its third use. Empty: «Своих предметов пока нет -
создайте первый или импортируйте файл.» Signed out: the head and the
`SignInPrompt`; unconfigured: not found, address kept.

The editor (`#/homebrew/new`, `#/homebrew/<key>`): a `Panel` with the
form and, beside it at 960 (under it at 360), the live `RecordCard`
compact preview over `toRecord(draft)`. Fields, in order: Вид (`Seg`);
for equipment the type `Seg`; Источник (a `<select>` of the sources plus
«+ новый источник»); Название and Описание in the UI language; «Другой
язык» folded (`Q4`); Ранг (`Seg`: Нет 1 2 3 4 Артефакт Проклятый for
loot; 1 2 3 4 Артефакт for equipment); the weapon or armour fields (pass
1); «Второй набор характеристик» folded (`alt`: trait, range, damage,
type); a fieldset «Связи» / "Relations": Линия улучшений (`Seg` + a
picker), Улучшается в (picker), Сделан из (picker), Комплект (picker of
set cards, catalog and own, or «+ новый комплект» revealing name and
bonus fields), Карты правил (up to three pickers, or «+ новая карта»
revealing name, subtitle, text, link). The picker (`ItemPicker.svelte`,
new, four uses): a text field searching the merged index (`matches`,
eight rows), the chosen record as a small row with its badge and a
remove button; a combobox for the keyboard. Buttons: «Сохранить»
(primary), «Отмена», «Удалить» (danger, existing item). Validation on
submit as pass 1; the "in N lists" hint; the delete confirm counts lists
and the items whose relations name it («...и он указан в 2 связях»).
Pass 3 amends this paragraph: the section select beside the source,
«Улучшается в» and «Сделан из» as lists of up to 8, every inline
«+ новый ...» with its own «Создать» write, the required marks, the
error summary and the failure states (4.14 F2, F4-F7; m04, m05,
m18-m21); on `#/homebrew` the «Разделы» toggle per source, the «Карты»
panel's forms and the «Черновики» group first (m02, m19, m21).

Editing (item 7, decided; the owner asked): the editor keeps the explicit
save (decision 2026-09-25) and gains an unsaved-changes guard: leaving
the route with a dirty form asks through `env.dialog.confirm`
(«Изменения не сохранены. Уйти?»), closing the tab through a
`beforeunload` handler behind `PagePort`, and Ctrl+S submits. Rejected:
R5's write buffer for the item text. Reasons, weighed: (1) an own entry
is a live reference, so a buffered flush every 2 s would put a half-typed
name on every referencing list, shared page and print sheet, and bump
each list's revision on each flush - one owner topic message and one
share topic message per list per flush while typing (R3's Realtime
budget is 2 million messages a month); (2) a draft is invalid between
keystrokes (an empty name, `dmg` "d1"), the database CHECK would refuse
the flush and the buffer's refused-write path re-reads the row and
reverts the form under the typist; (3) a form has one submit and the
buffer's merge-into-last is built for a list's discrete fields. What the
buffer gives - no lost edit on a closed tab - the guard gives at the
cost of one dialog.

### 4.11 Files, `llms.txt`, import and export (item 8; R7b)

Two formats, both public contracts (`CONTRACTS.md` section 4), each a
draft 2020-12 JSON Schema beside `import-v1.json`, `additionalProperties:
false`, fixtures under `docs/fixtures/homebrew/` and `docs/fixtures/import/`:

- `daggerheart-loot/homebrew` version 1, `schema/homebrew-v1.json`: `{
  "$schema", "format", "version": 1, "exported_at"?, "books": [{ "key",
  "ru"?, "en"? }], "cards": [{ "key", "kind": "set" | "ref", "book"?,
  ...SetCard | RefCard }], "items": [{ "key", "book"?, ...HomebrewContent
  }] }`. Keys are the objects' `hb_` keys (a file written by an agent
  makes its own: 16 of `a-z2-7`; `llms.txt` says how); relations inside
  the file name keys of the same file or catalog ids. Bounds are the
  tables' (20, 100 and the item limit). Written by «Скачать предметы
  (JSON)» (all, one source, a selection) and as `homebrew.json` in the
  account zip (R6 4.14; the zip's frozen layout gains one root file, as
  R6 wrote it would). Pass 3: `books[].sections [{ "key", "ru"?, "en"?
  }]` and `items[].section` (`Q10`); `craft` and `craft_from` a list of
  1-8, a single string read as a list of one (`Q11`); no `draft` field
  (m17).
- `daggerheart-loot/lists` version 2, `schema/import-v2.json`: v1 plus
  `entries[].source: "homebrew"` with a required `snapshot` (the snapshot
  shape; a file never carries a bare reference); v1 stays published and
  imports for good; a v1 reader refuses `version` 2 as R6 wrote it.
  Export writes an own entry frozen (`snapshotOf` of the live item) and
  a frozen row as it is.

Import: on `#/homebrew`, «Импорт предметов» (R6's panel: choose a file,
validate in the client with paths, preview «Источников 1, карт 2,
предметов 23; уже есть: 5», a `Seg` «Существующие: пропустить /
обновить», one press) -> `import_homebrew`, all or nothing. A lists file
with homebrew entries goes through R6's panel and `import_lists`
unchanged: the client turns an entry whose snapshot key the account
holds into a reference (`snapshot: null`) before the call, and the
reference-exists trigger guards the rest. Rejected: `import_bundle` (a
second RPC for a conversion the client can do), the `homebrew` array
inside the lists file (R6 moved it to the zip; a lists file stays lists).
Pass 3 adds the preview's «Куда положить предметы» mapping: sources are
created automatically unless the GM maps one elsewhere (4.14 F3, `Q9`,
m15).

`llms.txt`: a section "Homebrew items as a file (homebrew-v1)" after the
lists section - what it is (convert a supplement into a file, import it
under one source), the schema URL, a complete example file with one
source, one set card, one ref card and three items (a weapon in a line
with `q1`, a loot item made from `ci1`, a consumable naming a catalog
ref), the field table (every key of the three objects with bounds and
the `data.json` field it mirrors), the rules (keys, relations by id or
key, both languages optional with one name, tiers from the book never
from the stats, at most 3 refs, the limits, skip or update), how to hand
it over; the lists section gains the v2 lines. Proof: `tests/contracts.js`
completeness over both schemas (R6's P2 walk), the example imports clean
(P1), and a blind round (P3): a fresh agent reads `llms.txt` and
`catalog.csv` only and converts a short pasted stat block list into a
file that imports clean and relates to the catalog as asked.

### 4.12 Deletion, account deletion, monitoring

An item delete: the confirm with the list count and the relation count,
then a hard delete; the trigger removes references; other items keep
their keys to it (not drawn). A source delete keeps its items. A card
delete keeps the keys on items. No undo (decision 30). Account deletion:
the cascade. Usage report (R11): the three tables and the three limit
keys.

### 4.13 Item 13: what R7 must not close off

| Later need | R7 shape | Cost later |
|---|---|---|
| A book id on the item, not a tag | `book_id` FK; `book` on the record | none |
| Stable references | per-owner `hb_` keys with 80 random bits; a subscribed item resolves by `(book, key)`, never by the reader's own key space; `list_entries` may gain `item_owner uuid null` additively | one additive column and a projection change |
| Visibility apart from ownership | RLS is owner-only now; a `homebrew_subscriptions(user_id, book_id)` table and a `select` policy `exists subscription` are additive; the index merge takes "records visible to me" as input and the store carries `editable` per row from day one | one migration, no data rewrite |
| Subcategories (community's `community`) | pass 3 (`Q10` recommended): sections in the book row, `section` on the item, a `sect` facet and section anchors on the `homebrew` table. If the owner declines `Q10`: not stored, `section` refused by the validator | with `Q10`: none. Without: a validator replacement (the R8 `img` pattern), an optional `section` on the content and in both files, a `sect` facet and an anchor on the book table |
| Roll tables per book | `roll` refused now | `roll` on the content, a `rows` entry `hb_<book>` per book, a roll panel that takes a book |
| Converting a catalog source into a book | the file format is the catalog's field names, so `tools/` can write a `homebrew-v1` file from `data.js` today | a tool, no schema |
| Unsubscribing keeps list entries valid | an entry stores a key; a reference whose item is invisible draws as a frozen name only if the projection kept one | the projection embeds the snapshot for a subscriber's entry, or the entry freezes on unsubscribe |

The direction is written to `docs/decisions/` at closeout (section 10,
D6) since this file is deleted then.

### 4.14 Pass 3: the owner's first mock review (F1-F8)

`context.md`, "Owner feedback on the pass 2 mocks", lists eight items.
Each answer below gives the design, the recommendation, the mocks and the
batch. A product choice is a new owner question (section 9, `Q9`-`Q12`);
the rest is decided here.

**F1 - the example source name.** Decided: the invented «Мастерская
Ольхи» / "Alder Workshop" replaces the trademarked example in every mock,
in the example file (m17), in the fake seed (4.9) and in the fixtures and
`llms.txt` example that phase B and `B7b.1` write. Rule for every batch:
an example source in code, fixtures, seeds, goldens or `llms.txt` is an
invented name, never a published product's. The owner's verbatim quotes in
`context.md` keep their words. Acceptance line in `B7.1` and `B7b.1`:
`git grep -i -E "pistolheart"` outside `issues/` finds nothing.

**F2 - a new source from the editor.** Decided (pass 2's 4.10 named it;
pass 3 mocks it, m18). The source `<select>` ends with the command
«+ Новый источник...»; choosing it swaps the select for a name field with
«Создать» and «Отмена». «Создать» writes the source at once (one awaited
`books.create`, the store call the `#/homebrew` panel uses) and selects
it; «Отмена» or Escape brings the select back. Refusals under the field:
an empty name, a duplicate name (the client compares without case; the
database does not index names), the limit of 20, the network. The same
pattern serves «+ Новый раздел...» (F4), «+ новый комплект» and
«+ новая карта» (F7). Reason: each press is one write and «Сохранить»
stays one write of the item, so a refused source never blocks the item.
Trade-off accepted: a cancelled item can leave an empty source or an
unused card, listed with a zero count and deletable. Rejected: creating
them on «Сохранить» (two or three writes in one submit, and a partial
failure to undo). Batch `B7.2`.

**F3 - sources on import.** Answer: yes, created automatically (m15).
The preview gains «Куда положить предметы»: one row per source of the
file, and a «Без источника» row when some items name no `book`. Each row
is a `<select>` whose default is, in order: the held source with the same
key («уже есть»); a source of the same name, compared without case (a
file an agent wrote again has new keys); a new source. The options are a
new source, each existing source and «Хоумбрю»; the «Без источника» row
adds «Новый источник...» (F2's name field). The client rewrites each
item's `book` before `import_homebrew`; a file source mapped onto an
existing one is not created. Sections of a mapped source join the target
by key, then by name, else they are added to the target's list; the
client sends the target book row with the merged list, and
`import_homebrew` writes a held book's sections always and its name only
when updating (`B7b.1`). The preview counts sources and sections against
the limits after the mapping. `Q9` asks the owner. Batches `B7b.1` (the
RPC's book rule), `B7b.2` (the preview, the rewrite).

**F4 - categories inside a source.** Recommended (`Q10`): sections, the
community table's split for homebrew (m02, m09, m12, m13, m19). A section
is a named group inside one named source, stored in the book row's
`content.sections [{ key, en?, ru? }]` (at most 30; the key is an `hb_`
key; names unique inside the source) and named on the item by `section`.
`#/homebrew`: a «Разделы» toggle under each source (add, rename, delete;
a delete keeps the items in the source). The editor: a «Раздел» select
beside «Источник», drawn for a named source only, with «Без раздела», the
sections and «+ Новый раздел...»; changing the source resets it. Display:
one heading per source and section on `#/homebrew` and `#/tables/homebrew`
(«Мастерская Ольхи · Пистоли»; sections in the author's order, items with
no section last under the source name alone); the `homebrew` table gains a
`sect` facet, drawn when a section exists, and section anchors; the path
line and the print source line gain the section leaf; the tag stays the
source (4.2). The snapshot's `book` gains `section { key, en, ru }`; both
files carry `books[].sections` and `items[].section`. Why a list inside
the book row: a section has nothing but a name, a rename rewrites one row
and the book's touch trigger already bumps the referencing lists. Why not
a text tag on each item: a rename would rewrite every item, and item 13's
books need stable ids. Cost: about 10 more minutes of states over `B7.2`
and `B7.4`, no new batch. The alternative (separate sources now, sections
with item 13's books) costs a validator replacement and an optional field
in both file schemas later.

**F5 - failure states and required fields.** Decided (m20, m04, m05, m18,
m22). The form checks on «Сохранить», never while typing. A failed submit
draws the `ImportPanel` `.errs` box at the top of the form (`role="alert"`,
`tabindex="-1"`, it takes focus) with «Не сохранено: исправьте N полей.»
and one link per problem that moves focus to its field; each field draws
its own `.err` line under it, `aria-invalid` and `aria-describedby`; a
field's error clears on its next change. A field that can be empty and
is required carries a red asterisk after its label and
`aria-required="true"`; the form starts with the legend «* - обязательное
поле. Остальное можно заполнить позже.»; a segmented control with a default
carries no mark. An inline form («Создать ...») checks the same way on its
own button; «Сохранить» with an inline form open adds its problems to the
summary and saves nothing. The same rules run in `lib/homebrew.ts` and in
the database validators over one fixture set, so a form that passes never
meets a CHECK refusal.

| Field | Kind | Rule |
|---|---|---|
| `kind`, `eq.t` | all | always set: the segments have a default |
| `ru` or `en` | all | required: one name, 1-120 characters; the other language optional |
| `rud`, `ende` | all | optional, 0-3000 characters; a counter shows past 2500 |
| `book`, `section` | all | optional: none is «Хоумбрю»; a section needs a named source and must be one of its sections |
| `tier` | loot | optional: «Нет», 1-4, Артефакт, Проклятый |
| `eq.tier` | equipment | required, no default: 1-4 or Артефакт, from the book |
| `cls`, `tr`, `rg`, `dmg`, `dt`, `bu` | weapon, secondary | required (every catalog weapon carries all six); `dmg` is `d4`-`d20` with an optional `+1`..`+20` |
| `as`, `th` | armour | required: `as` 0-12, `th` two whole numbers, the second larger |
| `alt` | weapon, secondary | optional; once one of its four fields is set, all four are required |
| `eq.line` | equipment | «Уникальный»: none; «В линии»: required, equipment of the same type; «Новая линия»: this item |
| `craft`, `craft_from` | all | optional, 0-8 each, no duplicates, never the item itself (`Q11`) |
| `set` | all | optional; a new set needs a name and a bonus |
| `refs` | all | optional, 0-3; a new rule card needs a name and a text; a subtitle is optional; a link starts with `https://` |
| quick draft | list page | the name only; the description optional (F8) |

A refused save keeps the form as typed and the unsaved-changes guard
armed, with one line under the buttons: the limit («Не сохранено:
достигнут предел своих предметов - 500. ...») or the network («Не удалось
сохранить - нет связи. Правки остались в форме: нажмите «Сохранить» ещё
раз.»). A CHECK refusal the form did not predict reads as the network
line and is a defect. A conflict (4.9): the update names the revision the
form loaded; `conflict` draws a warning `NoticeBox` with «Сохранить мою
версию» (a forced write) and «Показать новую версию» (a reload, the guard
asks first); `gone` draws «Сохранить как новый» (a new key; the deleted
item's references are gone) and «К моим предметам». Reason: two tabs or
two devices can edit one item, and a save button without a revision
check overwrites the other edit without a word. Cost: one port option
and one banner; `revision` exists already. Batches `B7.1` (the port, the
validators), `B7.2` (the form).

**F6 - several upgrade links.** Recommended (`Q11`): `craft` and
`craft_from` hold 1-8 unique ids each (catalog ids or own keys), never
the item itself. Each id is one arrow ("either one upgrades into this"),
never a recipe that uses all of them; the copied text and the card say
the same as for one. The editor stacks the chosen rows with a picker
below («Добавить ещё»), disabled at 8. The derivations already return
lists (4.4) and fold past three names. The file reads a string as a list
of one, so a record copied from `data.json` still imports; export writes
lists. Why 8: the catalog's widest is one; 8 covers branching tiers and
keeps a snapshot inside its bound. Batches `B7.1` (validators,
derivations), `B7.2` (the editor). m04, m05, m12, m20.

**F7 - making a rule card.** Decided (m21, m13, m12; the storage is 4.3).
Two entry points. (1) The «Карты» panel on `#/homebrew`, two groups
«Комплекты» and «Карты правил»: each card row shows how many items name
it, «Изменить» (the form replaces the row; one form open at a time) and
«Удалить» (a confirm with that count; the key stays on the items and
draws nothing); «+ Новый комплект» and «+ Новая карта правил» open the
form in place. The rule card form: «Название карты» *, «Подзаголовок»,
«Текст карты» *, «Ссылка» (`https://`), «Источник» (the panel only),
«Другой язык» folded, and below it the card as it draws on an item (the
open `refs` fold). The set form: «Название комплекта» *, «Бонус
комплекта» *. (2) The editor's inline «+ новая карта» and «+ новый
комплект», created at once in the item's source and chosen (F2). A set's
members are chosen in each item's editor, as the catalog stores `set` on
the item. The field label stays «Карты правил» (the catalog's word for
`refs`); the handoff asks the owner to confirm it. Batch `B7.2`.

**F8 - a quick draft from a list page.** Recommended (`Q12`; m22, m02).
An own account list (`isCloud`, not read-only) gains «+ Свой предмет», a
toggle like «Поделиться». Its panel: «Название» * (1-120), «Описание»
(0-3000), «Добавить в список», «Закрыть». One press makes two writes in
order: the item (awaited; `kind: 'item'`, the UI language's name and
description, the default source, `draft = true`), then the entry through
the list's write buffer as a reference (quantity 1, no price) - the
reference-exists trigger needs the item first. The fields clear and focus
returns to the name for the next one; a toast names the item. Failures:
no name (the field's error); the item refused (the limit, the network: a
line under the panel, the text kept); the entry refused (the item stays
under «Черновики» and the list's own «Не сохранено · Повторить» takes
over). The mark is a column, not content: the «Черновик» badge draws only
from the owner's index (`#/homebrew`, the owner's list rows, tables,
search and card); a projection, a snapshot and a file never carry it.
`#/homebrew` lists drafts first under «Черновики», once. The editor shows
a gold `NoticeBox` while the mark is on, and «Сохранить» writes
`draft = false`. A browser list has no button (G36). The empty list's
hint gains «...или добавьте свой предмет кнопкой «+ Свой предмет».».
Batches `B7.1` (the column, the port), `B7.2` (the group, the badge, the
banner), `B7.3` (the list page).

## 5. Contracts and behaviour that stay stable

`data.js`, `data.json`, `catalog.csv`, `i/`, `og/`; the record ids and
prefixes (one reserved prefix `hb` added); the route grammar (the
`#/homebrew*` routes and the `homebrew` table added, no existing route
changes meaning; the filter grammar's groups per table unchanged, `src`
gains values; the new `homebrew` table's groups are `kind`, `src` and,
with `Q10`, `sect`); the `#/l/` encoding; `list_entries`' columns (one CHECK
replaced by two, the bound widened, a trigger added; an official row is
exactly as before); the share projection's shape (`snapshot` filled for
a reference); the ten sections and tabs (the homebrew page is not a
section, the table group is a chip inside Tables); the sign-in prompt
rule; the count-limit mechanism; the print geometry; R6's `import_lists`
signature and `import-v1`; the account zip's layout (one root file
added, as its contract allows).

## 6. Tests, fixtures, documentation per batch (outline; phase B expands)

| Batch | Layer 1 | Layer 2 | Layer 3 | Layer 4 | Docs |
|---|---|---|---|---|---|
| `B7.1` | `homebrew.test.ts` (validators over the fixtures - pass 3 adds `craft`/`craft_from` lists, `section`, book `sections`, the weapon and armour required fields, the `dmg` pattern, ascending `th`, `alt` all-or-none, card texts; `toRecord`, `snapshotOf` with cards and the section, `withRecords`: own vs frozen, `upgradesTo`/`madeFrom` over lists with deduplication, `setMembers`, `rows.homebrew`), `data.test.ts` (the new map shapes), `cloudLists.test.ts` (the resolver), `fake-cloud.test.ts` (seed pins, the port, limits, `remove` takes references, `update` bumps, the revision check answers `conflict` and `gone`, `force`, `draft` round-trips, the projection), `supabase.test.ts`, `live.test.ts` (the `homebrew` event), `cloud.contract.ts` case L (conflict and gone included) | none | `tests/db/homebrew.test.mjs`: grants and RLS for three tables, the validators over the fixtures, the snapshot formula with cards and section, the key and size CHECKs, per-owner uniqueness, the pin triggers, the three limits, `draft` defaults false and never reaches a snapshot, the touch triggers (item, book, card), the before-delete trigger, the reference-exists trigger (a reference to a key the owner lacks is refused, an import path included), the `list_entries` CHECKs and the 32768 bound, `get_shared_list` and `clone_shared_list`, the broadcast event, the cascade, the reversal | the contract case on the test project after the approve; `admin.mjs` cleanup helpers | `COVERAGE.md` |
| `B7.2` | `hash.test.ts`, `homebrewPage.test.ts` (sources, the «Разделы» toggle and its forms, the «Карты» panel with its forms and counts, «Черновики» first, rows by source and section, the batch bar, empty, signed out), `homebrewEditor.test.ts` (every field, the required marks and legend, the error summary's focus and links, field errors that clear on change, the inline source, section, set and card forms with their refusals, the lists of up to 8, the refused-save lines, the conflict and gone banners, the draft banner and `draft = false` on save, the guard, delete counts), `itemPicker.test.ts`, `recordPage.test.ts` («Изменить», the path with the section), `accountMenu.test.ts`, `app.test.ts` (`index` derived, `homebrewShown`, load/clear/refresh), `a11y.test.ts` | states as `gm1`, `gm2`, signed out: `#/homebrew` (filled with drafts and sections, «Разделы» open, «Карты» open with the new rule card form, empty, signed out), `#/homebrew/new` (empty, submitted with errors, the new-source field), `#/homebrew/<axe>` (the hint, the conflict banner), the draft's editor, the picker open, the new-set fold open, the delete confirm, `#/i/<axe>`, the menu open | none | `flows.mjs`: create a source with a section, a rule card and an item, relate it to two items, edit it, delete it | `FEATURES.md` "Homebrew" (new) and "Account", `ROUTES.md` (`#/homebrew*`), `CONTRACTS.md` 1, `STATE.md`, `META.md` 3, `I18N.md`, `COVERAGE.md`, `routes.json`, `tests/app/contracts.js`, the privacy pages if needed |
| `B7.3` | `listPage.test.ts` (a reference row, a frozen row, the modal's «Изменить», undo of a removed homebrew entry, the quick draft: two writes in order, the fields clear, the refusals, no button on a browser list or read-only), `sharedListPage.test.ts`, `listsPage.test.ts` (thumbnails and counts through snapshots, the empty hint), `requestsPanel.test.ts` (a frozen name), `cloudLists.test.ts` (the resolver on add, clone and add-to-my-list), `printPage.test.ts` (an own id, a frozen id in an own list), `app.test.ts` | states: `#/lists/<uuid(101)> as gm1` (a reference; the quick-draft panel open, after an add, refused), `#/lists/<uuid(201)> as gm2` (a frozen row), `#/s/player-token-1`, `#/print/<axe>-<potion>` both layouts; the moved goldens of lists 101 and 201 and `#/s/player-token-1` | none | `flows.mjs`: add an own item to a list as a reference, edit it, the projection carries the new text and the cards; a quick draft from the list completed in the editor; delete, the entry is gone | `FEATURES.md` "Lists" (homebrew entries, the quick draft) and "Homebrew", `STATE.md` (nothing local), `COVERAGE.md`, `DEBT.md` (the print address of a viewer's frozen copy, R9) |
| `B7.4` | `label.test.ts` (`srcLabel`, `whereFrom` with the section leaf, `tableOf`, `printSrc` for homebrew), `facets.test.ts` (dynamic `src`, `sect`, the `homebrew` table's rows), `tables.test.ts`, `desc.test.ts` (`hasLabels`), `share.test.ts` (many targets), `recordCard.test.ts` (the fold, dashed marks, a homebrew rung, the draft badge for the owner), `rowMain.test.ts`, `searchPage.test.ts` (merged, the chip), `tablesPage.test.ts` (the group chip signed in only, the chip, source and section headings, section anchors), `filterBar.test.ts` | states: `#/tables/homebrew as gm1` (the `sect` facet open; and signed out), `#/tables/eq_weapon as gm1` (the chip on and off, the `src` facet open), `#/search as gm1` («спальн»: official and homebrew rows), `#/i/ci1 as gm1` (the fold closed and open), `#/i/q1 as gm1` (the ladder with a dashed rung) | none | none | `FEATURES.md` "Tables and search" and "Records", `ROUTES.md` (the table and its groups `kind`, `src`, `sect`), `CONTRACTS.md` 1, `routes.json`, `llms.txt` URL grammar line (the table), `COVERAGE.md` |
| `B7b.1` | `bundle.test.ts` (v2 branch; v1 unchanged), `homebrewFile.test.ts` (the format's validator over fixtures, a string `craft` read as a list, sections, the drift guard against both schemas), `fake-cloud.test.ts` (import: skip, update, a held book's sections written in both modes, all or nothing, limits), the contract's import case | none | `tests/db/import-homebrew.test.mjs`: skip, update (references stay live, frozen copies do not move), a held book's sections merged, all or nothing, the limits, another owner's keys | the import case on the test project | `COVERAGE.md`, `CONTRACTS.md` 4 (both schemas, the zip's new file), `llms.txt` (both sections), `tests/contracts.js` (completeness, canonical fixtures), `tests/derived.js` pins |
| `B7b.2` | `importItemsPanel.test.ts` (the «Куда» mapping: defaults by key, by name, new; «Без источника»; the `book` rewrite; the counts against the limits after mapping), `homebrewPage.test.ts` (download buttons, the batch bar's download), `accountPage.test.ts` (the hint), `zip.test.ts` (`homebrew.json` in the zip), `app.test.ts` (`exportHomebrew`, `exportData`) | states: the import panel (empty, first import, the same file again, a same-name source, refused, done), the account page | none | export all, delete the source, import with update, the item is back with its key and its list entry is a reference | `FEATURES.md` "Homebrew" and "Account", `META.md` 3, `COVERAGE.md` (the blind round) |

## 7. Releases and batches: gates, cost, review, split criterion

Costs (`.claude/README.md`, "Batch size and the fixed cost of a run",
this host, 2026-09-27): `npm run check` 7-10 min (may cross the 600 s
cap in one call; gate credit by exit), `check:db` 9-10 min, `build:test`
plus `check:built` 2 min, `app/states` 4-5 min, `app/contracts` 7 min,
`app/print,app/typo,app/hues,stub` pooled with it 7 min, a golden shard
3.2 min (13 min for four; twice when a compare precedes a re-seed),
`sweep.js 360` 7-9 min, `npm run e2e` 2-3 min, a blind round 5-10 min.

### 7.1 R7 `persist-7-homebrew`

| Batch | Goal and scope | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B7.1` | Section 4.7 (all SQL of R7, with pass 3's `draft` column, sections, lists of `craft`, the required-field rules), 4.1-4.3 and 4.8 pure logic, 4.9 port (the revision check, `conflict`, `gone`, `force`), fake, store shell, the contract case, `live.ts` event, fixtures, `admin.mjs`, `usage-lib.mjs` table list | `check` 8, `check:db` 10; after the approve `db-push --project test` 1, `e2e` 3 (~22 min) | required (schema rule) | new release; SQL and ports judged apart from Svelte |
| `B7.2` | The account's own pages: routes `#/homebrew*`, the menu entry, `#/homebrew` (sources with sections, the «Карты» panel and its forms, «Черновики», the rows, the batch bar's delete), the editor (4.10 and 4.14: every field, the pickers and lists of 8, the inline source, section, set and card forms, the required marks, the error summary, the refused-save lines, the conflict and draft banners, the guard), `AppState.index` derived, `#/i/<key>` with «Изменить», delete; dictionary, specs, fixtures, goldens, states, a flow | `check` x2 16, `check:built` 2, `app/states` 6, `app/contracts` 7, goldens 13, `sweep 360` 8, `e2e` 3 (~55 min) | required (public contract, new UI) | a commit the harness cannot reach without `B7.1`'s seed and port; a public-contract change (routes) with its own fixtures |
| `B7.3` | Homebrew in lists (4.8, 4.14 F8): the resolver on add, clone and add-to-my-list, one derived index on the list, shared, lists-index and print pages, undo of a removed entry, the requests panel's names, the quick draft panel; specs, goldens, states, a flow | `check` x2 16, `check:built` 2, `app/states` 5, goldens 13, `sweep 360` 8, `e2e` 3 (~47 min) | required (a new write path into `list_entries`, new UI) | a different route set (`#/lists/*`, `#/s/*`, `#/print/*` against `#/homebrew*`), and a review that cannot be held in one pass with `B7.2`: the editor with its failure states against the list write paths |
| `B7.4` | Section 4.4-4.6: the merged derivations on cards and rows, the fold and the marks, `homebrew` in `TABLE_IDS`, the group, facets (`kind`, `src`, `sect`) and source and section headings, the equipment tables' `src` values, the chip, one merged search, `hasLabels`, `whereFrom` with the section; specs, fixtures, goldens, states | `check` x2 16, `check:built` 2, `app/states` 6, filter group 7, goldens compare then re-seed 26 (every table and search golden without `as` must not move; the `as gm1` ones re-seed), `sweep 360` 8 (~65 min) | required (public contract: a table id; the catalog's own cards change for a signed-in reader) | a second public contract (the table) with its own fixtures, and a review that cannot be held in one pass with the account's pages: the catalog's pages |

R7 total: about 190 minutes of gates, one green pass per batch (pass 2:
140). Pass 3 adds about 10 minutes of states for sections, the forms and
the failure states, and about 40 minutes for the split of pass 2's
`B7.2` into `B7.2` and `B7.3`. The merge alternative is one `B7.2` of
about 65 minutes (one review of the editor and the list paths together),
which saves about 35 minutes; the planner recommends the split because
the review of a merged `B7.2` would be the largest of the task.

### 7.2 R7b `persist-7b-homebrew-files`

| Batch | Goal and scope | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B7b.1` | `import_homebrew` (4.7, 4.11; a held book's sections written in both modes), `lib/homebrewFile.ts` (validate, parse, write; a string `craft` read as a list), `lib/bundle.ts` v2 branch, the two schemas and fixtures, `tests/contracts.js` and `tests/derived.js` pins, `llms.txt` both sections, `HomebrewRepository.import`, the fake, the contract case, the blind round | `check` 8, `check:db` 10, `check:built` 2 (`dist/index.html` names the schemas), the blind round 10; after the approve push 1, `e2e` 3 (~34 min) | required (schema rule, public contracts) | new release; the contract and SQL judged apart from the UI, and the schema batch rule (the test-project push waits for the approve) |
| `B7b.2` | The UI: the import panel on `#/homebrew` with the «Куда» mapping and the skip/update `Seg`, the three download surfaces, the batch bar's download, `homebrew.json` in the zip, the account hint, `AppState.exportHomebrew`; states, a flow | `check` x2 16, `check:built` 2, `app/states` 6, `app/contracts` 7, goldens 13, `e2e` 3 (~47 min) | required (new UI) | a commit the harness cannot reach without `B7b.1`'s fake `import`, fixtures and migration |

R7b total: about 81 minutes. Both releases: about 270 minutes (pass 2:
220).

`Q6` (recommended): two releases. R7 ships items to production about
80 minutes of gates earlier, the files release has its own review of the
two contracts and the blind round, and each is deployable alone (R7
without files is complete: the editor makes items; R7b without R7 has
nothing to import). Trade-off accepted: one more closeout (about ten
minutes: the directory audit, the push, the CI watch) and one more
`Plan review:` line. Alternative: one R7 of six batches, the same gate
cost, one closeout.

Not split further: sources, sections, cards, drafts and the editor share
one route set and one seed (`B7.2`); the list, shared, lists-index and
print pages share one derived index and one golden set (`B7.3`); the
tables, search and the card share one index change and one golden
re-seed (`B7.4`). Commit policy: `B7.1` commits, the later batches amend,
the closeout pushes; R7b starts a new commit after R7's push.

### 7.3 How R8 and R9 change shape

R8 `persist-8-media` (`B8.1`): `art_url` on `homebrew_items` (pass 1);
`homebrew_snapshot_of` and the validator admit `img` (a function
replacement); the uploader offers the picture of another own item or of
the line's first rung («Использовать картинку линии») so an upgrade line
shares one file as the catalog does (the owner's "potential art reuse");
a file is deleted only when no own item names its URL; the editor's
preview slot takes the control; a book has no cover in R8. Gate: the
editor's states re-seed (~25 min, was ~20).

R9 `persist-9-item-share` (`B9.1`): `#/h/<token>` draws `toRecord()` of a
projection that must now carry the snapshot's cards and book, and its
relations to the author's other items as frozen names (or drop them -
R9 decides; a catalog relation resolves for anyone); a clone makes a new
key and either drops relations to the sharer's other items or offers to
clone the chain (R9's question); the print routes resolve through
`withRecords(index, none, snapshots)`; `add_shared_homebrew_to_list`
writes the snapshot with cards. `homebrew_shares` stays one link per
item; a link per book is item 13's release, not R9's.

R11 (shipped): `usage-lib.mjs` gains the three tables in `B7.1`.
`persist-review`: homebrew is in its scope; nothing changes. R10:
nothing.

## 8. Mocks (`mocks/index.html`)

One self-contained file per screen, each state at 960 px and 360 px,
composed from the shipped components' rules (the `:root` block is
`tokens.css`); dashed purple marks the proposal. Each file inlines one
shared sheet written by the generator (`context.md`, "Facts settled by
planning pass 3"). Checked in the browser pane at 360 px for horizontal
overflow (`handoff.md`, Notes). Pass 3 changed m02, m04, m05, m09, m12,
m13, m15, m17 and added m18-m22.

| Mock | Screen | Plan |
|---|---|---|
| `m01-account-menu.html` | the menu with «Мои предметы» | 4.10, `B7.2` |
| `m02-homebrew-page.html` | `#/homebrew as gm1`: sources with the «Разделы» toggle, cards folded, actions, «Черновики» first, rows by source and section, the batch bar | 4.10, 4.14 F4 F8, `B7.2` |
| `m03-homebrew-page-states.html` | empty (`gm2`), signed out, unconfigured | 4.10, `B7.2` |
| `m04-editor-equipment.html` | the weapon editor: required marks, source and section, two upgrade targets, the preview beside | 4.10, 4.14 F2 F4-F6, `B7.2` |
| `m05-editor-loot.html` | the loot editor: tier with «Артефакт» and «Проклятый», made from two items, the new-set fold with «Создать комплект», «Другой язык» open | 4.10, 4.14 F6 F7, `B7.2` |
| `m06-item-picker.html` | the picker open with matches, chosen, empty, keyboard | 4.10, `B7.2` |
| `m07-record-card-relations.html` | `#/i/ci1 as gm1`: fifteen homebrew upgrades folded and unfolded; `q1` with a dashed rung; a set line with a homebrew member | 4.4, `B7.4` |
| `m08-rows.html` | a table or search row with «и ещё 14», the dashed source badge | 4.4, 4.2, `B7.4` |
| `m09-tables-homebrew.html` | `#/tables/homebrew as gm1`: the group chip, headings by source and section, the facets with «Раздел»; signed out | 4.6, 4.14 F4, `B7.4` |
| `m10-tables-equipment.html` | `#/tables/eq_weapon as gm1`: homebrew rows in the tier sections, the `src` facet with the sources, the «Хоумбрю» chip on and off | 4.6, `B7.4` |
| `m11-search.html` | `#/search as gm1`: one merged list, the chip | 4.6, `B7.4` |
| `m12-record-page.html` | `#/i/hb_... as gm1`: the path line with the section, two upgrade targets, an own rule card open, «Изменить»; the print card's source line as text | 4.2, 4.10, 4.14 F4 F6, `B7.2` |
| `m13-dialogs.html` | the delete confirms (item, source, section, rule card, set), the unsaved-changes guard | 4.10, 4.12, 4.14 F4 F7, `B7.2` |
| `m14-lists.html` | an own list with a reference row; `gm2`'s list with a frozen row; the shared page | 4.8, `B7.3` |
| `m15-import-items.html` | «Импорт предметов»: empty, first import with the «Куда» mapping, the same file again with skip or update, a same-name source, refused, done | 4.11, 4.14 F3, `B7b.2` |
| `m16-export.html` | the download surfaces on `#/homebrew` and the account page's hint | 4.11, `B7b.2` |
| `m17-llms-and-file.html` | the `homebrew-v1` example file (sections, a `craft_from` list, valid keys) and the `llms.txt` section outline as text | 4.11, 4.14, `B7b.1` |
| `m18-editor-source-inline.html` | the source select open, the new-source name field, created with the section select, the four refusals | 4.14 F2, `B7.2` |
| `m19-sections.html` | «Разделы» open under a source; the section select open; a new section | 4.14 F4, `B7.2` |
| `m20-editor-validation.html` | a weapon submitted with four problems; armour and a new rule card with rule errors; a refused save; the conflict and gone banners; the required and optional table | 4.14 F5, `B7.2` |
| `m21-rule-cards.html` | the «Карты» panel open; a new rule card with how it draws; «+ новая карта» in the item editor; editing a set | 4.3, 4.14 F7, `B7.2` |
| `m22-list-quick-draft.html` | «+ Свой предмет» on a list: open, after an add, refused; the draft in the editor | 4.14 F8, `B7.3` |

## 9. Owner questions (recommendation first)

- `Q1` "Unique" (item 1). Recommended: a one-off outside any upgrade
  line, the existing empty-`line` mechanism (the «Уникальное» badge, the
  `line` facet); no new flag. Artifact stays `tier 'A'`. Alternative:
  "unique" means artifact - then the editor offers no line control and
  every homebrew equipment is a one-off, which loses the tier 1-4 ladders
  the owner asked for.
- `Q2` "A separate table" (item 10). Recommended: a table page of their
  own, `#/tables/homebrew`, sectioned by source, beside the storage
  tables (which exist either way). Alternative: no table page; homebrew
  appears on the equipment tables and in search only, and `#/homebrew` is
  the one listing - fewer contract changes, but a homebrew loot item then
  has no table at all.
- `Q3` The item limit (decision 31 amendment). Recommended: raise
  `homebrew_items_per_owner` from 50 to 500 (books 20, cards 100). Reason:
  a converted supplement is 29 to 346 records (Vault of Ages 144, The
  Dragon's Vault 145); 50 holds none of them. Cost: 500 items of about
  2 KB is one megabyte per account read once per session; the merged
  index rebuilds in a millisecond. Alternative: 200 (holds Wondrous, not
  Core-sized books) with the override command for the owner's own
  account.
- `Q4` The second language (item 2). Recommended: the bilingual stored
  shape and a folded «Другой язык» in the editor (two fields). Alternative:
  the bilingual shape with no second-language UI at all in R7 (the file
  import is then the only way to fill both).
- `Q5` The source label (item 9). Recommended: «Мастерская Ольхи» as the
  tag with a dashed border and a title, «Хоумбрю · Мастерская Ольхи» as
  the path. Alternative: «Мастерская Ольхи (HB)». Pass 3 changed the
  example name only (F1); the choice is the same.
- `Q6` Releases. Recommended: R7 (four batches, about 190 minutes of
  gates) and R7b (two, about 81). Alternative: one R7 of six batches, the
  same gate cost, one closeout. Pass 3 changed the batch count, not the
  question: the added scope split pass 2's `B7.2` in two (section 7.1
  names the criterion and the merge alternative).
- `Q7` Import of held keys. Recommended: a skip-or-update `Seg` in the
  preview, default skip; an update keeps references live and leaves frozen
  copies. Reason: the owner converts a source and iterates on the file.
  Alternative: skip only (delete the source's items first, then import),
  the pure create-only rule R6 set for lists.
- `Q8` Editing (item 7, the owner asked). Recommended: the save button
  plus the unsaved-changes guard (4.10). Alternative: the write buffer
  gated on a valid draft - still propagates a half-typed text to lists
  and shared pages every two seconds.

Pass 3 (the owner's first mock review, 4.14):

- `Q9` Sources on import (F3). Recommended: the file's sources are
  created automatically, and the preview's «Куда положить предметы» row
  per source lets the GM put them into an existing source instead; the
  default is the held key, then a same-name source, then a new source.
  Reason: an agent that converts one supplement twice writes new keys,
  and without the mapping the second import makes a second source of the
  same name, while moving items between sources is deferred. Trade-off
  accepted: one more control in the preview and a client-side rewrite of
  `book`. Alternative: create by key only, no mapping (simpler; a
  duplicate source is then deleted with its items and imported again).
- `Q10` Categories inside a source (F4). Recommended: sections in R7 - a
  named group inside one source, headings on `#/homebrew` and
  `#/tables/homebrew`, a `sect` facet, the path's third leaf, one editor
  select (m02, m09, m19). Reason: the community table already splits a
  book this way, the file format is a public contract from its first
  version, and item 13's books need the level. Trade-off accepted: one
  more editor field and a «Разделы» toggle, about 10 minutes of gates, no
  new batch. Alternative: separate sources now («Мастерская Ольхи:
  пистоли»), sections with item 13's books (a validator replacement and
  an optional field in both schemas later).
- `Q11` Several upgrade links (F6). Recommended: `craft` and `craft_from`
  hold up to 8 items each; each is one "either one upgrades into this"
  arrow. Reason: the owner asked for branching, the card already folds
  lists, and the derivation already returns lists. Trade-off accepted:
  the homebrew `craft` is a list where the catalog's is one id (the file
  reads a string as a list of one; `llms.txt` says so). Alternative: one
  each way, as the catalog.
- `Q12` A quick draft from a list page (F8). Recommended: in R7 (`B7.3`),
  «+ Свой предмет» on an own account list, name and description, a
  `draft` mark shown only to the owner, «Черновики» first on
  `#/homebrew`, the mark removed by the editor's first save (m22, m02).
  Reason: the owner finds the drafts after the game in one place.
  Trade-off accepted: one column, one badge variant and one group.
  Alternatives: the same panel with no mark (the item is a plain
  «Хоумбрю» item, found by name); or the quick draft in a later release.

Decided without a question (the human would reasonably not care; recorded
here): dashed marks homebrew everywhere; the fold at three names on a
card and one on a row; a source delete keeps the items; the memory-only
chip; one merged search list; the snapshot embeds cards and the bound
widens to 32768; the reference-exists trigger; `craft_from` as the one
non-catalog field; the picker as a combobox; no `img` in `homebrew-v1`
until R8; the `homebrew` event on the owner topic; `book` as the code
word for «Источник». Pass 3: the invented example source (F1); inline
creation with its own write (F2); the required-field rules, the error
summary, the refused-save lines and the revision conflict (F5); the
«Карты» panel and the inline card forms (F7); the label «Карты правил»
kept (the handoff asks the owner to confirm it).

## 10. Decisions to record (`docs/decisions/`; the texts are in the report)

- D1 (amends 2026-09-25 "A homebrew item is stored as the catalog record
  shape ..."): the content is the whole catalog shape plus `craft_from`;
  sources and cards are rows; every homebrew object shares the `hb_` key.
- D2: dashed marks homebrew; a homebrew relation draws on a catalog record
  for its author only; many targets fold at three.
- D3: homebrew is first-class in the catalog pages: `allEquip`, one
  merged search, the `homebrew` table, dynamic `src` values, a memory-only
  show/hide chip; the roll pages are excluded.
- D4 (amends 2026-09-26 "Homebrew in the owner's lists is a live
  reference ..."): the snapshot embeds its cards and source; the bound is
  32768; a reference must exist when written.
- D5 (amends 2026-09-25 "A homebrew save is a form submit ..."): the save
  button stays, with an unsaved-changes guard; the write buffer rejected
  for the reasons of 4.10.
- D6: two file formats (`homebrew-v1`, `import-v2`), the items file in
  the zip, import skips or updates held keys, no `import_bundle`.
- D7 (written at closeout): the book direction of item 13 and what R7
  left open for it (4.13).
- Pass 3 amendments (`pending-apply.md` carries the texts): D1 gains
  `section`, `craft`/`craft_from` as lists and the `draft` column outside
  the content; D5 gains the inline create forms, the failure states and
  the revision check; D6 gains the import's source mapping; D8 (with
  `Q10`) sections inside a source; D9 (with `Q12`) the quick draft and
  its mark.

## 11. Roadmap changes (`issues/persistent-storage/plan.md`; applied by the orchestrator)

- Section 5, R7 row: three tables, the widened bound, the reference
  trigger, the broadcast event, `import_homebrew` moved to R7b; a new R7b
  row.
- Section 6: the `B7.2` row keeps the `#/homebrew` routes; a `B7.4` row
  for the `homebrew` table (`ROUTES.md`, `CONTRACTS.md` 1, fixtures,
  `llms.txt` URL grammar); a `B7b.1` row for `CONTRACTS.md` 4 and the two
  `llms.txt` sections. `B7.3` changes no public contract.
- Section 9, releases table: R7 batches `B7.1`-`B7.4`; a new R7b row after
  R7, before R8; the order line.
- Section 12: `B7.1`-`B7.3` rows replaced by `B7.1`-`B7.4`; `B7b.1`,
  `B7b.2` added; the total.
- Section 14: the `B7.1`-`B7.3` outline replaced by section 4's summary;
  `B8.1` gains the art-reuse line; `B9.1` gains the cards and relations
  lines.
- Section 16, decision 31: the item limit per `Q3`'s answer.
- Section 17: "Deferred: homebrew import beyond v2's create-only" becomes
  "import updates held keys (R7b)"; "homebrew sets" leaves "Not in v1".

## 12. Risks, assumptions, deferred

- Risk: `B7.4` changes what a signed-in reader's catalog card draws; the
  signed-out goldens must not move (the compare before the re-seed is the
  proof).
- Risk (pass 3): the quick draft makes two writes in order across two
  write paths (an awaited item create, then the list buffer); a test must
  prove the entry never leaves before the item exists, or the
  reference-exists trigger refuses it and the buffer's refused-write path
  runs.
- Risk (pass 3): the client-only rules (a section inside the item's own
  book, a line that starts at equipment of the same type, a duplicate
  source name) cannot be enforced by a CHECK; the import validator and
  the editor must share one function, and a dangling key draws nothing.
- Risk (pass 3): a mock can name a catalog record wrongly (pass 2 did it
  four times); phase B checks every catalog id and name a golden or a
  fixture takes from the mocks against `data.js`.
- Risk: `Index.craftedFrom`'s type change touches four readers; a search
  for its readers is phase B's first step.
- Risk: `TABLE_IDS` is read by `isTableId`, `groupsFor`, `facetRows`,
  `TABLE_GROUPS`, `SUB_LABEL`, the pin check and `routes.json`; the new
  id must be handled in each (a table with no rows signed out).
- Risk: the picker searches the merged index on every keystroke; the
  `hayFor` cache makes it cheap, but the editor must not rebuild the
  index on its own draft (the preview record is not in the index).
- Risk: `ListPage.svelte` is large (67 KB at `14e6dcf9`) and R6 and
  persist-4b edit it now; `B7.3`'s change there is one derived index, the
  resolver and the quick-draft toggle, and phase B re-reads the file.
- Assumption: a frozen snapshot of up to 32 KB is acceptable per entry
  (100 entries per list is at most 3.2 MB, read once).
- Assumption: R6 ships `BatchBar`, `ImportPanel`, `lib/zip.ts` and the
  zip's "other files named in the preview" rule as planned; phase B reads
  them.
- Mocks check: recorded in `handoff.md`, "Notes" after the browser pass.
- Deferred: item 13 (books, subscriptions, roll tables; subcategories
  unless `Q10` puts sections in R7); a Trash; art (R8); links (R9); a set
  filter; `recall` on a homebrew record; a per-source cover picture; bulk
  edit (move items between sources) beyond delete and download; a list
  entry's price and quantity in the quick draft panel (the list row sets
  them after the add).

## 13. Phase B (the next planning dispatch)

1. Delta check against `main`: R4 `B4.2` as shipped (the requests panel's
   name resolver, `CloudPort.requests` in the fake, `live.ts` readers),
   R6 as shipped (`bundle.ts`, `zip.ts`, `BatchBar`, `ImportPanel`, the
   zip contract text, `llms.txt` structure, `import_lists`), the account
   menu and `ListPage.svelte` (R6's closeout and persist-4b edit them on
   this tree now).
2. The owner's answers to `Q1`-`Q12` and the mock review applied; the
   mocks amended with the generator (`context.md`, pass 3 facts); a
   declined `Q10`, `Q11` or `Q12` removes its lines from 4.1, 4.7, 4.14,
   the tests table and the batch scopes, and from `pending-apply.md`.
3. `B7.1` expanded to implement-ready steps: the migration text, the
   fixtures (every validator case, with pass 3's required-field rules),
   the seed rows, the port signatures (the revision check), the contract
   case, the layer 3 case list, the acceptance lines and the inherited
   lines: F1's no-trademark line; `DEBT.md` D64 if the owner assigns it
   to R7.
4. `plan.md` Status keeps the `Plan review: required before B7.1` line;
   `handoff.md` names `B7.1`.
