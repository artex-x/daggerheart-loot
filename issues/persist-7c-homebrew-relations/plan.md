# Plan - TASK persist-7c-homebrew-relations (homebrew releases R7c, R7d)

## Status

- Moved from task `persist-7b-homebrew-catalog`'s plan at R7b's closeout
  (2026-10-01). R7b shipped (batches `B7b.1` and `B7b.2`, one task commit,
  pushed by the orchestrator at that closeout); its behaviour lives in
  `FEATURES.md` ("Tables and search", "Records", "Homebrew", "Rolling"),
  `ROUTES.md`, `CONTRACTS.md` 1, `STATE.md`, `COVERAGE.md` and decisions D3
  and D12. This file holds R7c and R7d. R7d gets its own directory
  `issues/persist-7d-homebrew-files/` at R7c's closeout (7.5).
- Task status: planned, not started. Every batch is an outline; the R7c
  planner refresh expands `B7c.1` (7.3) and writes its plan-review line.
- NEEDS_HUMAN_CONFIRMATION: no.
- Plan review: required before B7c.1 (trigger: a public contract change - the catalog craft as a list; a migration in B7c.2)
- Plan review: required before B7d.1 (trigger: a migration and two public schemas) - written when R7d's directory is created
- R7b closeout gates (orchestrator, 2026-10-01): `node tests/app/sweep.js
  1180` clean (ru, en); `node tests/app/golden.js --shard=n/4`, n = 1-4:
  232 states compared, unchanged.
- Batches:

| Release | Task id | Batch | Status |
|---|---|---|---|
| R7c | `persist-7c-homebrew-relations` | `B7c.1` the catalog `craft` as a list (public contract) | outline (7.3) |
| R7c | | `B7c.2` cards, relations schema and logic | outline (7.3) |
| R7c | | `B7c.3` the editor's relations, the cards panel | outline (7.3) |
| R7c | | `B7c.4` relations on catalog cards and rows | outline (7.3) |
| R7d | `persist-7d-homebrew-files` | `B7d.1` import RPC, two schemas, `llms.txt` | outline (7.4) |
| R7d | | `B7d.2` import and export UI, the zip, bulk move | outline (7.4) |

## Owner decisions of 2026-10-01 (placed, do not re-ask)

| Decision | Placed in |
|---|---|
| The tables help text (`lib/help.ts`) names the «Хоумбрю» group (and its facets); it moves the signed-out `#/tables ~ help` golden, so the batch re-seeds it | `B7c.4`, an acceptance line (7.3) |
| Bulk moves between sources and sections: a selection on `#/homebrew` with «Переместить...» in the selection bar, reusing the import's «Куда» source and section picker | `B7d.2`, an acceptance line (7.4) |
| G37, a set filter or a set page: deferred, placed in no release; revisit once homebrew sets exist | Deferred (section 12) |
| Price and quantity in the quick item panel («Свой предмет»): deferred, no release | Deferred (section 12) |
| A Trash for homebrew: deferred, no release (roadmap decision 30) | Deferred (section 12) |
| `DEBT.md`: a separate generic debt clean-up release between R9 and `persist-review` takes D64, D66 and every other `DEBT.md` entry still open then; not R10, not a task now | Deferred (section 12) |

## 1. Objective and the state after R7

Homebrew items in a signed-in account as first-class catalog records. R7
made, edited, listed, shared and printed them. R7b puts them in the catalog
pages (a `homebrew` table, the equipment tables, one merged search, a
show/hide chip). R7c relates them to catalog records and to each other
(upgrade lines, craft links, sets, rule cards) and draws those relations on
catalog cards. R7d moves them by file (two public schemas, `llms.txt`,
import and export, the account zip).

What R7 built, and what R7c and R7d build on (read the code before a refresh):

- Schema, migration `20260930130000_homebrew.sql` and its reversal:
  `homebrew_books` (content `{ en?, ru?, sections? }`, sections at most 30)
  and `homebrew_items` (`book_id` null, on delete set null), owner-only row
  level security, `service_role` select and delete; limit rows
  `homebrew_books_per_owner` 20 and `homebrew_items_per_owner` 100; the
  validators `homebrew_key_ok`, `homebrew_names_ok`, `homebrew_text_ok`,
  `homebrew_content_valid`, `homebrew_book_valid`, the formula
  `homebrew_snapshot_of(key, content, book)` and `homebrew_snapshot_valid`;
  `my_limit(key)`; pin, limit, touch, before-delete and broadcast triggers
  (`homebrew` with `{ by }` on `owner:<uid>`); `list_entries`' two checks,
  the 32768-byte bound and the reference-exists trigger; `get_shared_list`
  and `clone_shared_list` re-created.
- `lib/homebrew.ts`: `HomebrewContent` (the R7 subset of 4.1), `recordOf`,
  `isHomebrewRecord`, `withRecords(base, own, frozen)` (the R7 column of
  4.6: `byId` only), `editLang`, `nameTaken`, `groupsOf`.
  `lib/homebrewForm.ts` holds the form rules (4.14 F5). `lib/label.ts`:
  `srcLabel` reads «<source> (HB)» or «Хоумбрю»; `whereFrom` and `printSrc`
  give the path; `tableOf` answers null for a homebrew record (R7b made it
  answer `homebrew`). `lib/desc.ts` `hasLabels` is true for `src === 'homebrew'`.
  `lib/cloudLists.ts`: `entrySource`, `frozenOf`, `snapshotRecords`.
  `lib/bundle.ts`: `officialOnly` (a lists export leaves homebrew entries
  out until R7d).
- Ports: `HomebrewRepository` (`newId`, `newKey`, `load` with `itemLimit`,
  create, update and remove per kind with the revision check and the
  `conflict` and `gone` answers); the real adapter; the fake and its seed:
  `gm1` holds the source «Мастерская Ольхи» (`hb_alderworkshopaaa`,
  sections «Пистоли» `hb_sectpistolsaaaaa` and «Холодное оружие»
  `hb_sectbladesaaaaaa`), the axe `hb_emberaxeaaaaaaaa` in «Холодное
  оружие», the Russian-only potion `hb_smithpotionaaaaa`, the English-only
  cap `hb_whispercapaaaaaa` and the plain ring `hb_engravedringaaaa`; list
  101 holds a reference, list 201 a frozen row; `gm2` holds nothing.
  `cloud.contract.ts` runs cases A-M (M is homebrew).
- State: `state/homebrew.svelte.ts` (the store: `status`, `books`,
  `items`, `itemLimit`, `own`, refresh on focus, on the `homebrew` event
  and every 45 s on a homebrew page); `AppState.index` is
  `withRecords(catalog, homebrew.own, [])`; `recordFor`, `frozenCopy`,
  `knows`.
- UI: `#/homebrew` (`HomebrewPage`, `HomebrewSources`), `#/homebrew/new` and
  `#/homebrew/<key>` (`HomebrewEditor`), `#/i/<key>` for the author, «Мои
  предметы» in the account menu, «+ Свой предмет» (`QuickItem`) on an own
  list; shared fields `FormField`, `TextArea`, `NameField`, `PickRow`.
- Specs: `FEATURES.md` "Homebrew", `ROUTES.md`, `CONTRACTS.md` sections 1
  and 2 (the routes, the reserved `hb_` prefix), `STATE.md`, `I18N.md`,
  `META.md`, `COVERAGE.md`; `DEBT.md` D69 (R7d) and D70 (R9).
- The bundle budget (`tools/bundle-budget.mjs`): after R7b, 225.7 of 230 kB
  configured and 166.8 of 171 kB unconfigured (2026-10-01).

The catalog (`data.js`, 1272 records): `craft` on 17 (one id each, no
target with two sources), `refs` on 13, `eq` on 604 (288 in 72 upgrade
lines, every line one picture; `alt` on 20), `community` on 90, `frame` on
95, `tier` `A` 9 and `C` 5, `recall` on 102 (drawn nowhere), `set` on 5
(two sets), `starting` 30. No id starts with `hb`.

What R7b built (read the code before a refresh): `homebrew` in `TABLE_IDS`
and its group chip (signed in only); the equipment tables with own rows and
dynamic `src` values (`hb`, `hb_<16>`) and the `sect` facet; `srcOf` and
`tableOf` for homebrew records; `withRecords` returns `searchable`,
`allEquip` and a `homebrew` key of `rows` for own records, and
`browseIndex(index, base, shown)` applies the «Хоумбрю» chip
(`AppState.homebrewShown`, memory only); one merged search with the intro
counter; the record page's table link to `#/tables/homebrew/<item key>`;
`HomebrewLoad.svelte` (the shared load and failed-read state); in the
editor, the damage die select and bonus field, the second set's hint,
unpress and «Очистить второй набор», «Добавить в список» on a saved item's
preview. The migration `20261001120000_homebrew_damage_bonus.sql` widened
the damage bonus to `+1`..`+99` (`DMG`, `homebrew_content_valid`); the
bundle budget after R7b is 225.7 of 230 kB configured and 166.8 of 171 kB
unconfigured (2026-10-01; the configured figure is measured with the
README's `.env.test.local` line).

## 2. Scope and non-goals

- R7b (catalog pages): shipped.
- R7c (relations): the catalog's `craft` as a list of ids (`B7c.1`, a
  public contract change); `homebrew_cards` (sets and rule cards),
  `eq.line`, `craft`, `craft_from` (lists of up to 8), `set`, `refs`; the
  snapshot with cards; the derivations over the merged index; the editor's
  «Связи» and the «Карты» panel; relations drawn on catalog cards and rows.
- R7d (files): `schema/homebrew-v1.json`, `schema/import-v2.json`,
  `import_homebrew`, `llms.txt` with a blind round, import with the source
  mapping and skip or update, the downloads, `homebrew.json` in the zip.
- Non-goals: art (R8); `#/h/<token>`, clone and add from an item link,
  print routes for cloud lists (R9); books shared with other users (item
  13, D7); a second-language UI (`Q4`); a Trash (roadmap decision 30); homebrew in the roll pages (owner);
  `roll`, `frame`, `starting`, `recall`, `community` on a homebrew record; a
  per-field write buffer in the editor; `img` in the file format before R8.

## 3. The gap audit (item 12), the rows R7c and R7d own

Every surface that touches a catalog record, what differs for a homebrew
record, and where the plan puts it. "-" is out by design. Rows shipped in
R7 and R7b are not repeated (G2, G4-G10, G13-G21, G27-G33, G39, G40, G42,
and the R7 parts of G12, G34).

| # | Surface | What differs | Decision | Where |
|---|---|---|---|---|
| G1 | The seven roll pages | Pools read `index.rows` and `LOOT.alt` | Excluded by the owner; the shape keeps a later `roll` open (4.13, D7) | - |
| G3 | The book tables | A book's own rows | Not drawn there; the `homebrew` table instead | - |
| G11 | The card's ladder, craft lines, set line, refs | Unknown keys | Derived over the merged index; «(HB)» names, an «HB» label on a rung, the fold | `B7c.4` |
| G12 | `RowMain` | Same in one line | The source tag shipped in R7; the first relation name plus «и ещё N» | `B7c.4` |
| G22 | Export | v1 refuses `source: homebrew` | `import-v2`, `homebrew.json` in the zip, the account hint | R7d |
| G23 | Import | Passes `source`, `snapshot` | v2 entries frozen, or references when the account holds the key; `import_homebrew` | R7d |
| G24 | `llms.txt`, `schema/` | Nothing | Two sections, two schemas, a blind round | R7d |
| G25 | `catalog.csv`, `data.json`, `i/`, `og/` | Generated from `data.js` | Never carry a homebrew record; `llms.txt` says so | R7d |
| G26 | `#/account` | The zip hint | The hint names homebrew (D69) | R7d |
| G34 | Keyboard, screen readers | New controls | axe on every open state; the fold a button with `aria-expanded`; the picker a combobox | R7b, R7c |
| G35 | Roll "copy every option" | Roll pages excluded | - | - |
| G36 | The `#/l/` codec | Official ids only | Nothing: a browser list never holds a homebrew entry | - |
| G37 | A set filter or page | None for official records | Deferred with them | - |
| G38 | The art slot | `_none.webp` | R8 | R8 |
| G41 | Several craft links | One `craft` id | The catalog's `craft` becomes a list (`B7c.1`); up to 8 each way for homebrew | `B7c.1`-`B7c.4` |

## 4. Design

### 4.1 The record shape (items 1, 2; `Q4`, `Q11`)

A homebrew item's stored part is `HomebrewContent`; the record the app
draws is `recordOf(key, content, book)` (`lib/homebrew.ts`), the same
object the database's `homebrew_snapshot_of` writes. R7 stores the keys
below; R7c adds the marked ones.

```ts
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
- `dmg` (and `alt.dmg`) is `d4`-`d20` with an optional flat bonus
  `+1`..`+99` (`DMG`; the owner widened it from `+20` on 2026-10-01,
  `B7b.2`'s migration). The editor writes it from a die select and a bonus
  field; the stored shape does not change.
- A book's own fields never appear: `roll`, `frame`, `starting`,
  `community`, `recall`, and `img` until R8.
- `Q11` (answered: up to 8 each way; follow-up: one shape everywhere):
  R7c adds `craft` and `craft_from` as lists of 1-8 unique ids, never the
  item's own key. `B7c.1` first turns the catalog's `craft` into a list of
  ids in `data.js` and `data.json` (a public contract change, 7.3), so
  `Record_.craft` is `readonly string[]` for every record.
- `Q4` (answered: bilingual stored, no second-language UI): the stored
  shape holds both languages, each optional, one name required;
  `recordOf` fills a missing language from the other. The editor edits
  the item's own language (`editLang`); only a file import (R7d) fills
  both.
- Size: names 120 and descriptions 3000 code points per language; a
  maximal item in 4-byte characters is about 26 KB of JSON, its snapshot
  with a maximal source about 28 KB, under the 32768-byte bound. The bound
  holds because the validators refuse the C0 control characters except tab
  and newline (`jsonb::text` writes one as `\u00XX`, 6 bytes). A text with
  `\r` is refused: R7d's import turns `\r\n` and `\r` into `\n` before it
  validates (an inherited line of `B7d.1`). R7c's cards reopen the bound
  (4.7).

### 4.2 Sources: «Источник», `book` (items 9, 13; `Q5`, `Q9`, `Q10`), amended by the owner's marker answer

- Shipped in R7: `homebrew_books` with sections (4.14 F4, D8); `book_id`
  null is the default source «Хоумбрю» / "Homebrew"; deleting a source
  keeps its items in the default source. UI word «Источник» / "Source";
  code and schema word `book`, apart from `list_entries.source`
  (`official` | `homebrew`).
- The marker (owner, `Q5` and the marker answer during `B7.3`,
  2026-09-30; D2): one marker everywhere, the Latin text HB, the same in
  both languages. «ХБ» is rejected (it reads as х/б).
  - The source tag reads «Мастерская Ольхи (HB)» / "Alder Workshop (HB)" in
    the ordinary source badge style; the default source's tag reads
    «Хоумбрю» / "Homebrew" (its name already says it). Shipped in R7.
  - A homebrew name inside a relation line (upgrades, made from, set
    members) reads «<name> (HB)» (R7c, `B7c.4`).
  - A homebrew rung on an upgrade ladder draws an «HB» label beside its
    tier (for example «2 HB»), in the rung's own type, and its title and
    accessible name read «<name> (HB)» (R7c, `B7c.4`). The rung keeps the
    ordinary border: no dashed border anywhere. A rung with the label is
    wider than the fixed 26 px square of a catalog rung; `B7c.4`'s refresh
    checks the ladder at 360 px.
  - Nothing else changes on a catalog card.
- The path (`whereFrom`, the record page's sub line and the print source
  line) reads «Хоумбрю · Мастерская Ольхи · Пистоли», or «Хоумбрю» alone
  for the default source. Shipped in R7.
- `srcOf(it)` answers `it.book?.key ?? 'hb'` for the facets (R7b);
  `tableOf` answers `homebrew` (R7b); `printSrc` follows `whereFrom`.
- An import creates the file's sources through a mapping (4.14 F3, R7d).

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
- Marking (item 5): 4.2.
- Visibility (item 6): only the signed-in account's own rows join the
  derivations; a frozen copy joins `byId` alone.

### 4.5 Tier progression and "unique" (item 1; `Q1`)

`Q1` (answered: the existing mechanism): "unique" is a one-off outside any
upgrade line - an absent `eq.line`, drawn as the «Уникальное» badge and
offered by the `line` facet as `uniq`; no new flag. Artifact is `eq.tier:
'A'`. In R7 every homebrew equipment item is a one-off. R7c adds the
editor's «Линия улучшений» `Seg` («Уникальный» / «В линии» with a picker /
«Новая линия») and a homebrew rung with the «HB» label on an official
ladder (4.2). R8 reuses the line for art (the line's picture).

### 4.6 The merged index and where homebrew appears (items 10, 11)

`withRecords(base, own, frozen)` in `lib/homebrew.ts`, grown per release:

| Field | R7 (shipped) | R7b | R7c |
|---|---|---|---|
| `byId` | own records; frozen copies where the key is not own | - | - |
| `searchable`, `allEquip` | catalog only | own records after the catalog's | - |
| `rows` | catalog only | a `homebrew` key: own records by source and section | - |
| derivations, `sets`, `refs` | catalog only | - | own records and cards; a frozen copy's embedded cards for its own card |

It returns `base` itself when `own` and `frozen` are empty, so a
signed-out build keeps today's index object. The index never holds the
editor's own draft. R7b adds `browseIndex(index, base, shown)` beside it:
with the «Хоумбрю» chip off, search and the equipment tables read the
catalog's `searchable` and `allEquip`, while `byId` and the `homebrew` rows
keep the own records (`FEATURES.md`, "Tables and search"; D3).

R7b built the table, facets, chip and search (the R7b column above;
`withRecords`, `browseIndex`).

### 4.7 Schema

- R7: shipped (section 1).
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

Shipped in R7 (D4): an own item in an own list is a reference (`source
'homebrew'`, `snapshot` null) drawn from the merged index; a copy that
leaves the account is frozen by `homebrew_snapshot_of`, which embeds
`book`. From R7c the snapshot also embeds the own set and rule cards the
item names, so a viewer draws them with nothing to resolve; relations stay
keys and draw only where they resolve. A copy of a list decides each entry
from the source row: a reference stays live only for the source list's
owner, a frozen entry stays frozen.

### 4.9 Ports and state

- `HomebrewRepository` (shipped in R7): R7c adds cards (create, update,
  remove, and `load` returns them); R7d adds `import`. Each keeps the
  revision check and the `ok` answer for a repeated update that finds its
  own patch.
- The row shapes carry no `owner_id`: row level security keeps every row
  the author's in R7-R7d. Item 13's subscribed rows add it with the first
  reader (4.13, D7).
- The fake: R7c seeds `gm1` with one set card and one rule card, with the
  goldens they move; R7d's fake import follows the RPC's answers.
- The `Homebrew` store: R7c adds `cards` and the relation counts a delete
  confirm needs; R7d adds the import call and a reload after it.

### 4.10 Routes, pages and the editor (item 7; `Q3`, `Q4`, `Q8`; the parts for R7c and R7d)

- `#/homebrew` (m02): R7c adds the «Карты» fold (m21); R7d adds the import
  and download buttons, the empty text's «...или импортируйте файл» and
  «Переместить...» in the selection bar (7.4).
- The editor: R7c adds the «Связи» fieldset of m04 and m05 (the line `Seg`,
  «Улучшается в», «Сделан из», «Комплект», «Карты правил»). The «Другой
  язык» fold is never drawn (`Q4`).
- `Q14` (answered: A) and the owner's answer to `B7.2-4`: a batch whose
  build passes a budget raises that budget in `tools/bundle-budget.mjs` to
  its measured size plus about 5 kB, rounded up, in the same commit. Such a
  step applies the existing decision
  (`2026-09-30-the-bundle-budget-steps-up-per-batch-to.md`) and writes no
  new decision file: the batch records the measured figures in the
  budget file's comment and in `.claude/README.md`'s budget paragraph. The
  ceilings are 250 kB configured and 190 kB unconfigured; they may rise
  when a batch needs room, as long as the rise is reasonable, and each
  ceiling rise writes a new decision file. A batch that raises a ceiling
  names the rise and its reason in its handoff for the owner.


### 4.11 Files, `llms.txt`, import and export (item 8; R7d; D6)

Both formats are public contracts in `CONTRACTS.md` section 4, with
`additionalProperties: false`, fixtures, and `llms.txt` sections proven by
a blind round.

- `schema/homebrew-v1.json`, `daggerheart-loot/homebrew` version 1:
  `books` with sections, `cards` and `items` in the catalog's field names
  under their `hb_` keys; written by «Скачать предметы (JSON)» and as
  `homebrew.json` in the account zip; read by «Импорт предметов» through
  `import_homebrew`. `craft` and `craft_from` are lists only (no string
  form). No `draft` field (the mark does not exist). No `img` before R8.
- `schema/import-v2.json`, `daggerheart-loot/lists` version 2: v1 plus
  `source: "homebrew"` entries with a required `snapshot`; v1 stays.
- The bounds of both files are the import call's ceilings, never the
  default limits (task `limits-follow-overrides`, 2026-09-30). `import-v2`
  inherits v1's 5000 entries per list and 1000 lists per call, and the
  rule that a bound widens in place, never narrows (`CONTRACTS.md`
  section 4).
- `import_lists` needs no change for v2: the client turns an entry whose
  key the account holds into a reference, and the reference-exists trigger
  guards the rest. A v2 frozen entry must send `snapshot` as a JSON object
  (a JSON `null` becomes SQL null in `jsonb_to_recordset` and would read as
  a reference).
- `Q7` (answered: skip or update, default skip), `Q9` (answered:
  automatic sources with the per-source «Куда» mapping): 4.14 F3.
- A v1 reader refuses `version` 2 and `source: homebrew` (R6's code); the
  R7 lists export leaves homebrew entries out (`officialOnly`) until v2.

### 4.12 Deletion (the parts for R7c)

An item delete's confirm counts the lists holding it (R7); R7c adds the
relations naming it. A card delete keeps its key on the items, which then
draw nothing for it. No undo (roadmap decision 30).

### 4.13 Item 13: what the releases must not close off

Written as D7,
`docs/decisions/2026-10-01-homebrew-keeps-the-way-open-to-shared-books.md`.
Each batch keeps these shapes:

| Later need | Shape now | Cost later |
|---|---|---|
| A book id on the item, not a tag | `book_id` FK; `book` on the record | none |
| Stable references | per-owner `hb_` keys with 80 random bits; a subscribed item resolves by `(book, key)`; `list_entries` may gain `item_owner uuid null` | one additive column and a projection change |
| Visibility apart from ownership | owner-only RLS; a `homebrew_subscriptions(user_id, book_id)` table and a `select` policy are additive; the index merge takes "records visible to me" | one migration; the row shapes gain `owner_id` and the store `editable` |
| Subcategories | sections (D8) | none |
| Roll tables per book | `roll` refused | `roll` on the content, a `rows` entry per book, a roll panel that takes a book |
| Converting a catalog source into a book | the file format is the catalog's field names | a tool, no schema |
| Unsubscribing keeps list entries valid | an entry stores a key | the projection embeds a subscriber's snapshot, or the entry freezes on unsubscribe |

### 4.14 Answers to the owner's first mock review (F1-F8), the parts for R7c and R7d

- F1 - the example source name: the invented «Мастерская Ольхи» / "Alder
  Workshop" everywhere; code, fixtures, seeds, goldens and `llms.txt` use
  invented names only. Acceptance line in `B7d.1`: `git grep -i -E
  "pistolheart"` outside `issues/` finds nothing.
- F2 - a new record from a picker (shipped in R7 for sources and sections):
  the same pattern serves «+ новый комплект» and «+ новая карта»
  (`B7c.3`): the choice swaps the select for a name field with «Создать»
  and «Отмена»; «Создать» writes at once and selects it; refusals under the
  field (empty, duplicate without case, the limit, the network).
- F3 - sources on import (m15, R7d; `Q9`): the preview's «Куда положить
  предметы» row per file source, default: the held key, then a same-name
  source, then a new one; «Без источника» for items with no `book`; the
  client rewrites `book` before the call; sections join by key, then by
  name, else are added.
- F5 - failure states (shipped in R7; `lib/homebrewForm.ts` and the SQL
  validators over one fixture set): R7c adds the relation rows under the
  same rules - `eq.line`, `craft`, `craft_from`, `set`, `refs` optional;
  `craft` and `craft_from` at most 8 each, unique, never the item itself;
  a line starts at equipment of the same type. A form that passes never
  meets a CHECK refusal.
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

## 5. Contracts and behaviour that stay stable

`data.js`, `data.json`, `catalog.csv`, `i/`, `og/`, except the one
change the owner chose: `craft` becomes a list of ids (`B7c.1`; the bytes
of `catalog.csv` and of the `i/` pages do not change while every list holds
one id); the record ids and prefixes (`hb` reserved since R7); the route
grammar (R7b adds a table id, none changes meaning; the filter grammar's
groups per table unchanged, `src` gains values); the `#/l/` encoding;
`list_entries`' columns (an official row is exactly as before); the share
projection's shape; the ten sections and tabs; the sign-in prompt rule;
the count-limit mechanism; the print geometry; `import_lists`' signature
and `import-v1`; the account zip's layout (R7d adds one root file, as its
contract allows); the R7 routes `#/homebrew*` and `#/i/<key>`.

## 6. Tests, fixtures, documentation per batch (outline)

| Batch | Layer 1 | Layer 2 (browser) | Layer 3 | Layer 4 | Docs |
|---|---|---|---|---|---|
| `B7c.1` | `data.test.ts` (`upgradesTo`/`madeFrom` over the catalog, a string read as a list of one), `share.test.ts`, `record.test.ts`, `tables.test.ts` | the goldens of the records with craft lines compared, none may move | none | none | `CONTRACTS.md` 4, `README.md` field meanings, `llms.txt` data lines, `tests/contracts.js`, `tests/derived.js`, `tests/dataint.js`, `tests/craft.js`, `.claude/prompts/add-source.prompt.md` |
| `B7c.2` | `homebrew.test.ts` (the R7c validators, snapshots with cards, the derivations over own records with deduplication), `data.test.ts`, fake and contract case N (cards) | none | `tests/db/homebrew-cards.test.mjs` (grants, RLS, validators, limit, touch, the widened snapshot validator, a snapshot frozen under R7 still valid) | case N after the approve | `COVERAGE.md` |
| `B7c.3` | `itemPicker.test.ts`, `homebrewEditor.test.ts` (relations, lists of 8, the line `Seg`, inline set and card forms), `homebrewPage.test.ts` (the «Карты» panel) | the picker open, the new-set and new-card forms, the «Карты» panel; goldens | none | `flows.mjs`: a rule card and two relations | `FEATURES.md` "Homebrew" |
| `B7c.4` | `recordCard.test.ts` (the fold, «(HB)» names, the «HB» label on a homebrew rung with its title and accessible name, no dashed border), `rowMain.test.ts`, `share.test.ts` | `#/i/ci1 as gm1` (fold closed, open), `#/i/q1 as gm1` (a rung with the «HB» label, 960 px and 360 px); signed-out goldens compared first, must not move | none | none | `FEATURES.md` "Records"; `I18N.md` (HB is Latin in both languages) |
| `B7d.1` | `bundle.test.ts` (v2), `homebrewFile.test.ts`, fake import | none | `tests/db/import-homebrew.test.mjs` | the import case after the approve | `CONTRACTS.md` 4, `llms.txt`, `tests/contracts.js`, `tests/derived.js` |
| `B7d.2` | `importItemsPanel.test.ts`, `homebrewPage.test.ts`, `accountPage.test.ts`, `zip.test.ts`, `app.test.ts` | the import panel states, the account page | none | export, delete, import with update | `FEATURES.md` "Homebrew", "Account"; `META.md`; `COVERAGE.md`; `DEBT.md` (D69 deleted); both privacy pages |

## 7. Releases and batches: gates, cost, review, split criterion

Subsections 7.3-7.5 keep the numbers of the plan they came from; 7.1 was R7
and 7.2 was R7b.

Costs (`.claude/README.md`, "Batch size and the fixed cost of a run", this
host): `npm run check` 7-10 min, `check:db` 9-10 min, `build:test` plus
`check:built` 2 min, `app/states` 4-6 min, `app/contracts` 7 min, a golden
shard about 3.2 min (four shards 13 min; a compare then a re-seed 26 min),
`sweep.js 360` 7-9 min, `npm run e2e` 2-3 min, a blind round 5-10 min, a
closeout about 10 min.

`Q6` (answered: finer releases where a criterion supports it; D10) gave
four releases, each deployable alone. R7 and R7b shipped. The criterion of
each remaining cut:

| Cut | Criterion |
|---|---|
| R7b \| R7c | a public contract change (the catalog `craft` shape) and a migration of its own (cards, the validator and snapshot replacements), with their own plan review; the catalog's own cards change for a signed-in reader |
| R7c \| R7d | two public schemas and `llms.txt` with a blind round; the file format goes last so v1 carries every field |

Rejected: a split per source (a source is the author's data, not code);
two releases (about two hours of gates fewer, but the first production use
waits for relations).

Total gate cost of R7c and R7d: about 202 minutes (R7c 121; R7d 81) plus
two closeouts, and the contract review of `B7c.1`.

Inherited by every batch that runs `check:built` (`Q14`, `B7.2-4`): each
build measured, configured and unconfigured, and each passed budget raised
to the measured size plus about 5 kB, rounded up, in the same commit; a
step under the ceilings writes no decision file, a ceiling rise does
(4.10). The figures after R7b (2026-10-01): 225.7 of 230 kB configured,
166.8 of 171 kB unconfigured.

### 7.3 R7c `persist-7c-homebrew-relations`

| Batch | Goal and scope | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B7c.1` | The catalog's `craft` as a list of ids (below) | `check` 8, `build:test` plus `check:built` 2, `node tests/run-all.js contracts,dataint,craft,stub` 3, goldens of the craft records compared (`--only`) 5 (~18 min) | required (a public contract change) | a public-contract change with its own commit and review, apart from the migration |
| `B7c.2` | 4.3, 4.4 storage and derivation over own records, 4.7's R7c migration (cards, the validators and the snapshot formula replaced, the bound decided), the port and the fake for cards, contract case N | `check` 8, `check:db` 10; after the approve push 1, `e2e` 3 (~22 min) | required (a migration) | a commit boundary the harness cannot reach (the cards seed and port) |
| `B7c.3` | The editor's «Связи» (the line `Seg`, «Улучшается в», «Сделан из» as lists of 8, «Комплект», «Карты правил»), `ItemPicker.svelte`, the inline set and card forms, the «Карты» panel on `#/homebrew`, the delete confirm's relation count | `check` x2 16, `check:built` 2, `app/states` 6, goldens 13, `e2e` 3 (~40 min) | required (new UI) | a different route set (`#/homebrew*`) from `B7c.4`, and a review not held in one pass |
| `B7c.4` | Relations drawn on catalog cards and rows: the fold, «(HB)» names, the «HB» label on a homebrew rung (4.2; no dashed border), set lines, rule cards, copied text | `check` x2 16, `check:built` 2, `app/states` 5, goldens compare then re-seed (the card and row states) 10, `sweep 360` 8 (~41 min) | required (the catalog's cards change for a signed-in reader) | a different route set (`#/i/<catalog id>`, `#/tables/*`, `#/search`) |

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
  `tools/capture-share-fixture.mjs` (reads `rec.craft` twice),
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

Acceptance lines inherited from R7, each its own line in its batch when the
R7c refresh expands it:

- `B7c.1` (`plan-B7.1-N11`): `tools/capture-share-fixture.mjs` reads
  `rec.craft` as a list at both reads, and its output does not change.
- `B7c.2`: the `list_entries` bound is decided (65536, or capped card
  texts) and recorded in a decision file; a snapshot frozen under R7
  passes the widened `homebrew_snapshot_valid` (a layer 3 case).
- `B7c.2` (`B7b.2`): the replaced `homebrew_content_valid` starts from the
  body of `20261001120000_homebrew_damage_bonus.sql` (the `+1`..`+99`
  damage patterns), not from R7's; the fixture case `d20+99` still passes.
- `B7c.3`: the delete confirm counts the relations that name the item
  (4.12).
- `B7c.4` (owner's marker answer, 2026-09-30): a homebrew rung shows the
  «HB» label beside its tier, titled «<name> (HB)»; no element of a
  catalog card or row has a dashed border for homebrew; «(HB)» is the same
  Latin text in both languages; «ХБ» appears nowhere (`git grep -n "ХБ" --
  app/src` finds nothing).
- `B7c.4`: m07 draws a dashed rung and dashed names (section 8's
  overrides); the R7c refresh redraws m07's rung with the «HB» label before
  `B7c.4` is dispatched (a hand edit if the mock generator is gone).
- `B7c.4` (owner, 2026-10-01): the tables help text (`lib/help.ts`) names
  the «Хоумбрю» group and its facets (`kind`, `src`, `sect`) in both
  languages; it moves the signed-out `#/tables ~ help` golden, so the batch
  compares first and re-seeds that golden on purpose, with the reason in the
  handoff.
- `B7c.3` and `B7c.4`: the bundle budget line above.

### 7.4 R7d `persist-7d-homebrew-files`

| Batch | Goal and scope | Gates (cost) | Review | Split criterion |
|---|---|---|---|---|
| `B7d.1` | `import_homebrew` (4.7), `lib/homebrewFile.ts`, `lib/bundle.ts` v2, the two schemas and fixtures, `tests/contracts.js` and `tests/derived.js` pins, `llms.txt` both sections, `HomebrewRepository.import`, the fake, the contract case, the blind round; F1's grep again | `check` 8, `check:db` 10, `check:built` 2, the blind round 10; after the approve push 1, `e2e` 3 (~34 min) | required (a migration, two public schemas) | a new release; the schema batch rule |
| `B7d.2` | The import panel on `#/homebrew` with the «Куда» mapping and the skip or update `Seg`, the three download surfaces, the batch bar's download, `homebrew.json` in the zip, the account hint, the privacy merge steps | `check` x2 16, `check:built` 2, `app/states` 6, `app/contracts` 7, goldens 13, `e2e` 3 (~47 min) | required (new UI) | a commit boundary the harness cannot reach without `B7d.1` |

R7d total: about 81 minutes plus the closeout.

Acceptance lines inherited from R7, each its own line in its batch when the
R7d refresh expands it:

- `B7d.1` (4.1, review R1 of R7's plan): the import turns `\r\n` and `\r`
  into `\n` before it validates.
- `B7d.1` (4.11): a v2 frozen entry sends `snapshot` as a JSON object; a
  test proves that a JSON `null` never reaches `import_lists` for a frozen
  entry.
- `B7d.1` (`B7.1-3`): the "holds a name" test agrees on both sides. SQL `\S`
  follows the database's ctype locale; `/\S/u` in `lib/homebrew.ts` also
  counts U+00A0, U+2007, U+202F and U+FEFF as spaces, so a name of only
  U+00A0 passes the database and fails the client. R7d's migration puts one
  explicit character class on both sides, with one fixture case in
  `docs/fixtures/homebrew/`. The R7 migration does not change.
- `B7d.1` (F1): `git grep -i -E "pistolheart"` outside `issues/` finds
  nothing.
- `B7d.1` (`B7b.2`): `schema/homebrew-v1.json`'s `dmg` pattern is `DMG`'s
  (`+1`..`+99`), and `llms.txt` names that bound.
- `B7d.1` (task `limits-follow-overrides`): `import-v2` takes v1's widened
  bounds (5000 entries per list, 1000 lists per call); the schema's bounds
  are the call's ceilings.
- `B7d.2` (`B7.2-9`): a source or section rename writes the name in the
  item's language rule, not only in the language on screen. Today a source
  named only in English and renamed in the Russian interface keeps its old
  English name, and the English interface shows the old name. Apply
  `editLang` (or the same rule) to source and section names, since R7d's
  import fills both languages.
- `B7d.2` (D69): `DEBT.md` D69 is deleted in the batch whose data zip
  carries homebrew items, sources and homebrew list entries, and the zip
  of an account with a source, an item and a list holding a reference and
  a frozen copy loads back into a new account with all of them; the hint
  `yourDataHint` and the privacy pages' merge paragraph ("Если Google или
  Discord уже занят" and its English twin) say so.
- `B7d.2`: the `#/homebrew` empty text gains «...или импортируйте файл».
- `B7d.2` (owner, 2026-10-01): bulk moves between sources and sections. A
  selection on `#/homebrew` offers «Переместить...» in the selection bar;
  it opens the import's «Куда» source and section picker (one component for
  both, extracted on its second use), moves the ticked items in one write
  per source or section pair, keeps every item key, and refuses a move that
  breaks a rule of 4.14 F5 (a section outside the target source) with the
  form's own text. The R7d refresh designs the write (a batch update on the
  repository port, one revision check per item) and the mock.
- `B7d.1` and `B7d.2`: the bundle budget line above.


### 7.5 Where each release's plan lives, and R8, R9

- At R7c's closeout its planner moves this plan's R7d parts into
  `issues/persist-7d-homebrew-files/plan.md` with a `context.md`, and this
  directory is deleted in R7c's commit. Each directory writes its own
  `Plan review:` line.
- R8 `persist-8-media` (`B8.1`): `art_url` on `homebrew_items`; the
  validator and `homebrew_snapshot_of` admit `img` (a function
  replacement); the uploader offers the line's picture or another own
  item's; a file is deleted only when no own item names it; storage per
  image counts against the owner's concern of `Q3`.
- R9 `persist-9-item-share` (`B9.1`): `#/h/<token>` draws a projection that
  carries the snapshot's book and cards; relations to the sharer's other
  items travel as frozen names or are dropped (R9 decides); a clone makes
  a new key; the print routes resolve through `withRecords(index, none,
  snapshots)`; `DEBT.md` D70.

## 8. Mocks (`mocks/index.html`)

The owner approved m01-m22 on 2026-09-30. They moved here from R7b's
directory at R7b's closeout; m01, m02, m03, m09-m11, m14, m18, m19, m22 and
m23 draw shipped screens and stay for the index's links. The generator
lived outside the repository and is gone: edit a mock by hand. The browser
pane opens `mocks/index.html` from disk but refuses the other mock paths
except `m23-editor-feedback.html` (2026-10-01); a 360 px check ran on pages
copied to that path, each under about 88 000 URL-encoded characters.

Answers that override what the mocks still draw - each an implementer
constraint:

| Answer | Mocks that still draw the old form | What ships |
|---|---|---|
| `Q3` limit 100 | m03, m15, m19, m20, m21 («из 500», «- 500») | 100 from the database (`my_limit`), in the count form «Мои предметы: N из M» |
| `Q4` no second-language UI | m04, m05, m20, m21 («Другой язык» fold) | no fold; the fields edit the item's own language (4.10) |
| `Q5` plain text tag, and the owner's marker answer (2026-09-30) | every mock with a dashed source badge; m07 and m08's dashed relation names; m07's dashed rung | «<source> (HB)» in the ordinary badge; «<name> (HB)» in relation lines; an «HB» label on a homebrew rung; no dashed border anywhere (4.2) |
| `Q6` four releases | the batch names printed in each mock's "Plan" line | section 7's release map |
| The seed, not the mock data (refresh 2026-10-01) | m09, m10, m11 draw pistols, a musket and bedrolls the gm1 seed does not hold, and m11 R7c's relation lines | the states draw gm1's four items; the relation lines come with R7c |

| Mock | Screen | Release, batch |
|---|---|---|
| m02 | `#/homebrew as gm1`: sources with sections, the rows | R7 (shipped); the lead line R7b `B7b.1`; the «Карты» fold R7c `B7c.3` |
| m04 | the weapon editor | its «Связи»: R7c `B7c.3` |
| m05 | the loot editor | the made-from list and the new-set fold: R7c `B7c.3` |
| m06 | the item picker | R7c `B7c.3` |
| m07 | relations on `#/i/ci1`, `#/i/q1` | R7c `B7c.4` |
| m08 | a row with «и ещё 14» and the tag | R7c `B7c.4` (the tag shipped in R7) |
| m12 | `#/i/hb_... as gm1`: the path, «Изменить» | the relations and the own rule card: R7c |
| m13 | the delete confirms, the guard | the card and set confirms: R7c `B7c.3` |
| m15 | «Импорт предметов» | R7d `B7d.2` |
| m16 | the download surfaces | R7d `B7d.2` |
| m17 | the `homebrew-v1` file and the `llms.txt` outline | R7d `B7d.1` |
| m20 | validation and the failure states | the relation rows: R7c |
| m21 | the «Карты» panel and rule cards | R7c `B7c.3` |

## 9. Owner answers

| Question | Answer (2026-09-30) | Lands in |
|---|---|---|
| `Q1` "unique" | a one-off outside any line, the existing empty `line` | 4.5; R7c |
| `Q2` "a separate table" | `#/tables/homebrew` | 4.6; R7b; D3 |
| `Q4` second language | the bilingual stored shape, no second-language UI; only a file import fills both | 4.1; R7d |
| `Q5` the label | «Мастерская Ольхи (HB)» as plain text | 4.2; D2 |
| The marker (during R7's `B7.3`) | one marker everywhere, the Latin HB; an «HB» label on a homebrew rung instead of a dashed rung; «ХБ» rejected (it reads as х/б) | 4.2; `B7c.4`; D2 |
| `Q6` releases | finer releases where a criterion supports it | section 7; D10 |
| `Q7` held keys on import | skip or update, default skip | 4.11; R7d; D6 |
| `Q9` sources on import | automatic, with the per-source mapping | 4.14 F3; R7d; D6 |
| `Q11` several links | up to 8 each way; follow-up: the catalog's `craft` becomes a list too | 4.1, 4.4; R7c `B7c.1`-`B7c.4`; D1 |
| `Q13` `import-v1` bounds | decided in `limits-follow-overrides` | 4.11; R7d |
| `Q14` bundle budget | A: step up per batch to 250 kB configured, 190 kB unconfigured; the ceilings may rise when reasonable, each with a decision (`B7.2-4`) | 4.10, section 7 |
| Counters | the search intro adds «И N ваших предметов.»; `#/homebrew` shows «Мои предметы: N из M» | 4.6 (R7b); D11 |
| «Карты правил» | confirmed | 4.3; R7c |
| Mocks | approved, with the `Q12` revision | section 8 |
| Help text, bulk move, G37, quick-panel price, Trash, debt release (2026-10-01) | see "Owner decisions of 2026-10-01" | `B7c.4`, `B7d.2`, section 12 |

Open: none.

## 10. Decisions (`docs/decisions/`)

| File | Decision |
|---|---|
| `2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md` | D1: the whole shape; sources and cards are rows; `craft` a list everywhere, the catalog's from `B7c.1` (which adds the Frostwyrd mirror pair) |
| `2026-09-30-hb-marks-homebrew-a-relation-shows-only-to-its-author.md` | D2: one HB marker; the «HB» rung label; a relation shows only to its author; the fold. Amended in place at R7's closeout with the owner's marker answer |
| `2026-09-30-homebrew-is-first-class-in-the-catalog-pages.md` | D3: the catalog pages, the chip, the search counter (R7b) |
| `2026-09-30-a-frozen-copy-embeds-its-source-a-reference-must-exist.md` | D4: the snapshot, the bound, the reference check; from R7c the cards |
| `2026-09-30-the-homebrew-editor-keeps-its-save-button-with-a-guard.md` | D5 |
| `2026-09-30-homebrew-travels-as-its-own-file.md` | D6: two file formats, skip or update, the mapping, the ceilings (R7d) |
| `2026-10-01-homebrew-keeps-the-way-open-to-shared-books.md` | D7: item 13's direction (4.13), written at R7's closeout |
| `2026-09-30-a-homebrew-source-may-hold-sections.md` | D8: sections |
| `2026-09-30-a-list-page-makes-a-plain-homebrew-item-in-one-press.md` | D9 |
| `2026-09-30-homebrew-ships-in-four-releases.md` | D10: the release split |
| `2026-09-30-the-account-reads-its-own-effective-limit.md` | D11: `my_limit()` |
| `2026-09-30-the-bundle-budget-steps-up-per-batch-to.md` | `Q14`: the budget steps |
| `2026-10-01-homebrew-sections-stay-in-the-source-row.md` | D12: sections stay a list in the source row; a sections table and parent books rejected (owner, 2026-10-01); amends D8 |

Decisions R7c and R7d still write: `B7c.1` the Frostwyrd mirror pair with
D1; `B7c.2` the `list_entries` bound; each budget raise (4.10).

## 11. Roadmap (`issues/persistent-storage/plan.md`)

Each release's closeout here marks its row closed in the roadmap's section
9, collapses its section 12 rows to one closed row, and writes its closeout
record in section 16.

## 12. Risks, assumptions, deferred

- Risk: `B7c.1` changes `data.json`'s record shape; a reader outside the
  site that expects a string breaks. `llms.txt` and `README.md` say it in
  the same commit; the app reads both shapes while an old `data.js` may be
  cached.
- Risk: a CHECK calls the validators as the writing role, so
  `authenticated` needs EXECUTE on each new validator (`anon` never): the
  harness test `EXPECTED_ANON_FUNCTIONS` stays unchanged.
- Risk: `recordOf` and `homebrew_snapshot_of` must agree field for field;
  one fixture file (`docs/fixtures/homebrew/snapshots.json`) is compared by
  both suites; R7c's replaced formula keeps it so.
- Risk: `B7c.4` changes what a signed-in reader's catalog card draws; the
  signed-out goldens must not move (the compare before the re-seed is the
  proof).
- Risk: the client-only rules (a section inside the item's source, a line
  that starts at equipment of the same type, a duplicate name) cannot be
  CHECKs; the editor and the import share one function, and a key that
  answers nothing draws nothing.
- Risk: a mock can name a catalog record wrongly (pass 2 of R7's plan did
  it four times); each batch checks every catalog id and name it takes
  from a mock against `data.js`.
- Risk: the golden `#/l/ ~ every entry gone` flaked before R7 (its toast
  lived 1600 ms and the harness arrived late); R7 fixed it with the toast
  hold (`docs/decisions/2026-09-30-a-timed-golden-holds-its-toast-until-the.md`).
  A new timed state takes the same hold.
- Assumption: a frozen snapshot of up to 32 KB per entry. At the default
  entry limit a shared list is at most 3.2 MB; an override of 1000 entries
  makes it up to 32 MB in the worst case; real snapshots are about 2 KB.
  Accepted: an override is the owner's own grant. R7c's cards may raise
  the bound (4.7).
- Assumption: a purchase request's 32 KiB lines bound holds about 700
  lines of homebrew keys (19 characters each).
- Deferred (ideas, not placed in R7c or R7d; the owner's lines of
  2026-10-01 first): a set filter or page (G37); price and quantity in the
  quick item panel («Свой предмет»); a Trash for homebrew; books shared with
  other users (item 13, D7); art (R8); item links (R9); `recall` on a
  homebrew record; a source cover. `DEBT.md` D64, D66 and every entry still
  open then go to the generic debt clean-up release between R9 and
  `persist-review` (owner, 2026-10-01); neither is R10 nor a task now.

## 13. The review register carried from R7 and R7b

R7's and R7b's review registers were scratch and went with their
directories. Every R7b row is closed, placed in `B7b.2` and shipped, or a
closeout gate that ran (`sweep.js 1180`, the golden compare). One row is
dropped on purpose: `B7b.2-2`, the signed-in strip cap holding 2 px of room
(298 of 300 px at 360 px), named to the owner. The rows that stay open, each
placed as an acceptance line in section 7:

| Id | Finding | Placed in |
|---|---|---|
| `plan-B7.1-N11` | `B7c.1`'s tool list must include `tools/capture-share-fixture.mjs`, which reads `rec.craft` twice | `B7c.1` |
| `B7.1-3` | SQL `\S` and JS `/\S/u` differ on U+00A0, U+2007, U+202F, U+FEFF | `B7d.1` |
| `B7.2-4` | The bundle headroom after R7; the owner: raise when reasonable, with a decision | every batch that runs `check:built` |
| `B7.2-9` | A source or section rename writes only the language on screen | `B7d.2` |
