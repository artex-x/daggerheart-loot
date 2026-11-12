# Public contracts

These are frozen. A link someone pasted into a chat months ago has to keep
opening, and an agent reading `llms.txt` has to be able to build a working
address or import file without touching the site.

**Default: no contract change.** If one is unavoidable, the same change must
update the golden fixtures, the tests, this file and `llms.txt` together.

Fixtures: `docs/fixtures/urls/routes.json`, `docs/fixtures/urls/paths.json`
(section 1), `docs/fixtures/urls/preview.json` (section 5),
`docs/fixtures/urls/record.json` (section 5), `docs/fixtures/import/` (section 4),
`docs/fixtures/api/v1/` (section 6).
Checked by `tests/contracts.js`. `docs/fixtures/share/records.json` is not a
contract fixture in this sense - it is `share.test.ts`'s own golden,
regenerated from `dist/` by `tools/capture-share-fixture.mjs` and last
matched against the live app at `cf96e6f` (`docs/specs/COVERAGE.md`, "flows
- the share fixture's own provenance"). `docs/fixtures/homebrew/` is not a
contract fixture either until R7d's homebrew file: it holds the cases the
homebrew validators of `app/src/lib/homebrew.ts` and of the database share
(`docs/specs/COVERAGE.md`, "Suites").

## 1. Route grammar

Frozen as written in `ROUTES.md`. The routes below are named by their route
key; the address is its path form (`ROUTES.md`, "Path form"; owner,
2026-10-28): `#/<rest>` is `<site><rest>` in Russian and `<site>en/<rest>` in
English (`/tables/eq_weapon`, `/en/tables/eq_weapon`, `/lists`, `/account`,
`/homebrew`), a record `<site>i/<id>` and `<site>i/en/<id>`. The bar and every
in-app link show this form. Every older address keeps opening: `<site>#/<rest>`,
`<site>en/#/<rest>` and `<site><path>#/<rest>` open the fragment's route, an
English root keeps English, and the app writes the path form in the same
history entry. `docs/fixtures/urls/paths.json` pins both directions. The host
answers every route path in both forms with the app: the worker's families
(`preview/public/_routes.json`), the static record pages `i/` and `i/en/`, and
the rewrites of `preview/public/_redirects` for every other route, which also
answers `/en/i/<id>` with a 301 to `/i/en/<id>`. Pages routes `/tables/*` to the
worker for the bare `/tables` too, so `_routes.json` excludes `/tables` and
`/en/tables`, and their slash forms `/tables/` and `/en/tables/`, which the
rewrite answers. `tests/contracts.js` checks that each
route of `routes.json` is covered and that the worker takes no rewritten path.
`routes.json` pins each route's resolved address, its lit job and its lit mode. In particular:

- the fifteen section names, and the three legacy ones that fold into `roll/std`
- the URL ids of the source products (owner, 2026-10-21): the sections `roll/wondrous_environments`, `roll/dread_gm_toolbox`, `roll/vault_of_ages`, `roll/dragons_vault`, `roll/arazos_artifacts`, `roll/community_items`, `roll/many_worlds_tavern`, `roll/pistolheart`, `roll/last_round_table` and `roll/escape_the_veiled_halls` (2026-11-07), and the tables `hope_and_fear_item`, `hope_and_fear_consumable`, `wondrous_environments`, `dread_gm_toolbox`, `vault_of_ages`, `dragons_vault`, `arazos_artifacts`, `community_items`, `many_worlds_tavern`, `pistolheart`, `last_round_table` and `escape_the_veiled_halls`; the app writes these. An old id still opens the same page (`roll/dread`, `#/tables/dv`, `hnf_item` and the rest, which are the internal ids); the address is not rewritten
- the table names in `#/tables/<table>`, including `other_starting` and `other_frames`; legacy `frames` resolves to `other_frames` without rewriting the pasted hash; the tables page's three copy buttons (the table, its filter, one block) hand out the preview host's address of the table (section 5), except on `homebrew`, and `<site>#/tables/...` keeps opening
- the filter grammar `f_group-value[-value][.group-value]`, **including the
  group key spelling**: `range` and `burden`, not `rg` and `bu`
- `#/i/<id>`, `#/lists/<listId>`
- Retired on 2026-10-26: `#/l/<payload>`, an old list link, and every address
  under `#/l/` draw the not-found page, the address kept, the payload never
  read (section 3)
- `#/p/<id>`, a stored print set: 12 base64url characters made by the
  database when a signed-in reader presses «Печать», so a set is unlisted, not
  secret, and an agent cannot build one; it opens for a signed-in reader only,
  from `<site>#/p/<id>` and `<site>en/#/p/<id>` alike; a malformed id draws the
  "set not found" print page; «Ссылка на набор» hands out
  `https://daggerheart-loot.pages.dev/p/<id>` (section 5)
- Retired on 2026-10-08 (owner, a deliberate break): `#/print/<ids>` and every
  address under `#/print/` draw the retired print page, the address kept
  (`docs/decisions/2026-10-08-every-print-is-a-stored-set-long-print.md`)
- `#/account`, the account page, read in every build (the not-found page,
  address kept, where no sign-in is configured)
- `#/homebrew`, `#/homebrew/new` and `#/homebrew/<key>`, the author's own
  items and their editor, and the tabs `#/homebrew/sources`,
  `#/homebrew/sets[/<key>]` and `#/homebrew/rules[/<key>]` (a key opens that
  card), read in every build as `#/account` is; an own item also opens at
  `#/i/<key>`, for its author only
- `#/homebrew/f_<filter>`, the Items tab with its filter: the groups `kind`,
  `src` (any number of values, OR'd) and `sect` of the `homebrew` table; a
  pick rewrites the address in place; an earlier build reads it as
  unreadable and opens the home section (`ROUTES.md`, "Homebrew")
- `#/tables/homebrew`, the author's own items as a table, read in every build
  as `#/account` is; its filter group `sect`, and the `src` values `hb` and
  `hb_<16>` on it and on the equipment tables (values that live in one
  account). On `homebrew`, `src` holds one value and picks the source chip:
  with two or more sources the table shows one source at a time, and a
  second value, a value that names no held source, or a `sect` value that is
  not a section of the chosen source is dropped and the address rewritten (`ROUTES.md`, "Homebrew")
- `#/s/<token>`, an account share link: the token is opaque, made only by
  the list's owner, one active per audience (players, GM); it opens from
  `<site>#/s/<token>` and `<site>en/#/s/<token>` alike; its projection
  (`get_shared_list`) draws each homebrew entry live from the linked item,
  with the item's id as `hid` beside the entry's `snapshot`, and its own
  picture's stored name as `img` when it has one (`p/<32 hex>.<ext>` or a
  catalog basename, never inside `snapshot`); its overload
  `get_shared_list(text, bigint, jsonb)`, for a `p_have` that is not null,
  adds `rev`, an opaque name of the linked record's version, and leaves out a
  `snapshot` that its `p_have` map names by that `rev`; a players'
  link's projection holds no entry marked GM only (`list_entries.gm_only`),
  and a GM's link writes `gm_only` on each entry; the token is optionally
  followed by a filter, `#/s/<token>/f_<filter>`, in the grammar and with the
  groups of `ROUTES.md`; an earlier build ignores the filter; the share panel's
  copy and the shared page's filter link hand out the preview host's address
  (section 5), and `<site>#/s/...` keeps opening
- `#/h/<uuid>`, one homebrew item by its id (`homebrew_items.id`), for
  everyone, signed out too: the id is random, made by the author's client, so
  an item is unlisted, not secret, and nobody can build or list one; the id
  is read as the leading run of `[0-9A-Fa-f-]`, lowercased (a stray character
  after it is dropped, the address kept); a malformed or unknown id draws the
  record page's not-found page, never home; it opens from `<site>#/h/<uuid>`
  and `<site>en/#/h/<uuid>` alike. A relation and a list row link to this
  address; «Скопировать ссылку» and «Поделиться» hand out the preview host's
  address (section 5); `#/i/<key>` keeps opening the author's own item

## 2. Record ids

Stable, and the join between the data, the stub pages, the artwork and every
shared list. Never renumber a record that has shipped.

| Prefix | Set |
|---|---|
| `ci` / `cc` | Core item / consumable |
| `hi` / `hc` | Hope & Fear item / consumable |
| `w` | Wondrous Environments |
| `di` | Dread GM Toolbox |
| `voa` | Vault of Ages (`voa<vol>_<tier><n>`) |
| `dv` / `dve` | The Dragon's Vault loot / equipment |
| `aa` | Arazo's Artifacts, book order, an upgrade line's rungs after its head |
| `mw` | Many Worlds Tavern, realm by realm in release order, card order inside a realm; Hornet Hold and The Drome print no number, so kind, then name |
| `ph` | Pistolheart, book order over the three volumes, an upgrade line's rungs after its head |
| `lr` | The Last Round Table, book order; the id number is the roll |
| `vh` | Escape the Veiled Halls, one flat list in the adventure's order; the id number is the roll |
| `cm` | Community items |
| `f` | Campaign frame equipment |
| `q` | Core and Hope & Fear equipment |
| `hb_` | reserved: a homebrew item's key, `hb_` and 16 of `a-z2-7`, per account; never a catalog id |

## 3. List link encoding (retired)

`#/l/` links stopped opening on 2026-10-26, and R10 removed their format; an old
`#/l/` address draws the not-found page (section 1). The format is in `git show
0b73fd5c:docs/specs/CONTRACTS.md`, section 3.

## 4. Machine-readable data

- `data.json` - `{ items: {...}, eq: [...], refs: {...}, alt: {...}, sets: {...} }`, the same
  content as `data.js`: `tools/derived.js`'s `dataJson(L)` is
  `JSON.stringify(L) + '\n'`, nothing stripped, and `tests/derived.js` holds
  `data.json` to that output byte for byte inside `npm run check`. An empty
  description is `rud: ""`/`ende: ""` in both files alike (112 such literals
  in `data.json`, verified). `sets` maps a set key to its shared bonus
  (`en`, `ru`, `ende`, `rud`); a record names its set in `set`. A record's
  `craft` is a list of one or more record ids, the records it upgrades into,
  in drawing order, never its own id; before R7c it was one id string.
  `catalog.csv`'s `crafts_into` joins the ids with `;`. Field meanings are in
  `README.md`. Not committed, like `names.json`.
- `catalog.csv` - one row per record, with the stat line. Not committed, like
  `names.json`.
- `catalog-index.csv` - the catalog without its text, for an agent's one
  fetch (`llms.txt`, "Read this first"): the columns of `catalog.csv` without
  `url`, `text_ru` and `text_en`, in the same order, with the same rows, row
  order and quoting, from `tools/derived.js`'s `catalogIndexCsv(L)`. Budget:
  at most 196608 bytes, which `tests/derived.js` holds; 181825 bytes at 1593
  records, measured 2026-11-07, about 114 bytes a row, so the budget holds
  about 1720 records, about 130 more than today. A column may be added at
  the end, as `realm` was (2026-10-21, the last column of both files: a Many
  Worlds Tavern record's realm in English, empty elsewhere), then `volume`
  (2026-11-07: a Pistolheart record's volume number, empty elsewhere); any
  other change is a new file name, with one exception: the `room` column,
  added on 2026-11-07 after `volume`, left both files on the same day with
  no new file name, because Escape the Veiled Halls became one flat list
  (`docs/decisions/2026-11-07-escape-the-veiled-halls-is-one-flat-list-with-no-rooms.md`).
  The `roll` column is empty on an upgrade line's rungs. An ingest that passes the
  budget raises `INDEX_BUDGET` and the `llms.txt` words "under 200 KB" in
  one commit, or publishes a new file name. Not committed, like `names.json`.
- `names.json` - what the preview host reads at request time
  (`docs/specs/META.md` section 3): one line, `JSON.stringify(v) + '\n'`
  from `tools/derived.js`'s `namesJson(L)`, with `format`
  `daggerheart-loot/names` and `version` 1; `items` maps every catalog
  record and equipment row to `[ru, en]` (`ru` as stored, `""` when
  absent); `sets` maps each key of `data.js`'s `sets` to `ru`, `en`,
  `rud`, `ende` and `members`, the ids in the stubs' order; `tables` maps
  each catalog table id (no `homebrew`) to `{ n }`, the rows the signed-out
  tables page draws; `communities` maps a community's English name to `ru`
  and `n`; `frames` maps a frame key to `{ n }`; `realms` maps a Many
  Worlds Tavern realm key to `{ n }`; `volumes` maps a Pistolheart volume
  number to `{ n }` (2026-11-07). A new key may be added; any other
  change is `version` 2, with one exception: the `rooms` key, added on
  2026-11-07, left the file on the same day in `version` 1, for the reason
  that `catalog.csv` lost its `room` column. Budget: at most 196608 bytes, which
  `tests/derived.js` holds; 109969 bytes at 1593 records, measured
  2026-11-07. Not committed, like `i/`.
- `i/<id>.html` - a stub page per record with Open Graph markup, in Russian;
  `i/en/<id>.html` - the same page in English. Each redirects to the record's
  path on the site. The old host's mirror publishes them; the site publishes,
  under the same paths, the app document with the same card fields between
  the card markers of `app/index.html` and the record's plain text (name,
  path line, text, craft and set lines) in a `<noscript>` block after the
  app's mount point, which the build writes into `dist/i/`
  (`tools/app-documents.js`; about 420 bytes a document on average, 1.2 MB over
  the 2918 documents, measured 2026-10-28). An agent and a reader without
  JavaScript read the record there (`llms.txt`). The record link the app and the tools hand out
  is extensionless, `<site>i/<id>` and `<site>i/en/<id>` (section 5); the
  files keep their `.html` paths.
- `en/index.html` - the English entry document: on the mirror, the English
  preview card of the site, which redirects to `<site>en/` with the fragment
  kept; on the site, `dist/en/index.html`, the app document with the same
  card fields.

All of them except the five `schema/` files are generated from `data.js` by
`node tools/build.js` and compared byte for byte by `tests/derived.js`.

- `schema/import-v1.json` - the lists file `import-v1`, a JSON Schema (draft
  2020-12) with `$id`
  `https://artex-x.github.io/daggerheart-loot/schema/import-v1.json`,
  hand-written, not generated by `tools/build.js`. The export writes this
  file and the import reads it (`docs/specs/FEATURES.md`, "Account and
  browser lists"); `llms.txt`, "Lists as a file (import-v1)", describes it
  for an AI assistant. Frozen: a v1 file written today imports for good. A
  bound may widen in place, up to the import call's own ceiling, and never
  narrows; any other change is `import-v2.json` beside it, `version` tells
  the two apart, and both stay published. `format` is
  `daggerheart-loot/lists`; the bounds are one import call's
  (`import_lists`: 1000 lists, 5000 entries per list); the account's limits
  are the database's (`FEATURES.md`, "Limits").
  Fixtures: `docs/fixtures/import/`, each JSON file exactly
  `JSON.stringify(v, null, 2) + '\n'`; `tests/contracts.js` checks the
  schema, the fixtures and the `llms.txt` section, and `lib/bundle.test.ts`
  keeps the app's validator equal to the schema.
- `schema/import-v2.json` - the lists file `import-v2`: `import-v1` with
  `version` 2, an entry `source` of `official` or `homebrew`, and a
  homebrew entry's `snapshot` (the item as a catalog record, at most 131072
  bytes, what `homebrew_snapshot_of` writes); `$id`
  `https://artex-x.github.io/daggerheart-loot/schema/import-v2.json`. A
  homebrew entry has a key as its `id` and may carry `snapshot`; the export
  writes one on every homebrew entry; an official entry never holds one.
  The export writes version 2 only for a file that holds a
  homebrew entry, so an official-only export stays an `import-v1` file byte
  for byte; the import reads versions 1 and 2 (and 3, see `import-v3`), and
  a v1 reader refuses version 2.
  On import a held key becomes a link to the own item, and so does a key whose
  derived key (below, `homebrew-v1`) the account holds. Each other homebrew
  entry with a snapshot becomes an own item under the derived key, its `hb_`
  relations taking derived keys too; one without a snapshot is skipped, as an
  unknown catalog id is. The import counts
  against the item and card limits and `import_homebrew`'s 1000 rows; past
  either it is refused whole, and nothing is written. One copy is made per
  distinct key and snapshot; a later differing snapshot of a key gets a new
  key. The database stores a link (`list_entries.hb_item`), never a
  snapshot. Frozen: v1's bounds (1000 lists, 5000 entries per list) hold, a
  bound or a value list widens, or a required key becomes optional, in place,
  and nothing narrows; any other change is `import-v3.json`. Its `eq` and `key`
  definitions are copies of `homebrew-v1.json`'s, held deep-equal by
  `lib/homebrewFile.test.ts`.
  `llms.txt`, "Version 2: homebrew entries (import-v2)", describes it.
  Fixtures: `docs/fixtures/import/example-v2.json`, `errors-v2.json`,
  `from-llms-v2.json` (the blind round), `keys-only-v2.json` (entries without
  a snapshot).
- `schema/import-v3.json` - the lists file `import-v3`: `import-v2` with
  `version` 3 and an optional entry `gm_only` (boolean), true for an entry
  marked «Только для мастера» ("GM only"), which a players' link leaves out;
  `$id` `https://artex-x.github.io/daggerheart-loot/schema/import-v3.json`.
  The export writes version 3 only for a file that holds a GM-only entry and
  writes the key only as `true`, so a file without one stays `import-v1` or
  `import-v2` byte for byte
  (`docs/decisions/2026-10-08-a-gm-only-entry-is-dropped-by-the-share-projection.md`).
  The import reads versions 1, 2 and 3 and refuses `gm_only` in a version 1
  or 2 file. A version 3 entry keeps its mark on its link, or on its fixed
  copy's link; the copy itself has no mark. Frozen as `import-v2`; any other
  change is `import-v4.json`. Its `$defs` are `import-v2`'s but for the
  entry's `gm_only`, held deep-equal by `lib/bundle.test.ts`. `llms.txt`,
  "Version 3: GM-only entries (import-v3)", describes it. Fixtures:
  `docs/fixtures/import/example-v3.json`, `errors-v3.json`, `export-v3.json`
  (gm1's lists with one GM-only entry, written by the export); `v4.json` is
  the refused "another version" file.
- `schema/homebrew-v1.json` - the homebrew file `homebrew-v1`, a JSON Schema
  (draft 2020-12) with `$id`
  `https://artex-x.github.io/daggerheart-loot/schema/homebrew-v1.json`:
  `format` `daggerheart-loot/homebrew`, `version` 1, and `books` (sources
  with `sections`), `cards` (set and rule cards) and `items` in the catalog's
  field names, every fixed-key object closed. Its bounds are one
  `import_homebrew` call's ceilings, at least three times the default limits:
  100 sources, 1000 cards, 1000 items, 30 sections per source; the account's
  limits are the database's. The «Мои предметы» page reads it by the import
  and no longer writes it (the export writes `homebrew-v2`); frozen as
  before. `llms.txt`, "Homebrew items as a file (homebrew-v2)", describes it
  as the older form. The schema's description keeps its published wording
  ("...writes it on export", and the `llms.txt` section name it gives);
  `llms.txt` and this section carry the rule.
  Frozen: a bound may widen in place and never narrows, and so may a value
  list (the trait `any`, 2026-10-21, in all four homebrew and lists
  schemas); any other change is `homebrew-v2.json` beside it. Fixtures: `docs/fixtures/homebrew-file/`, the
  hand-test files and
  `from-llms.json` (the blind round), each canonical; `tests/contracts.js`
  checks both schemas, the fixtures and the two `llms.txt` sections, and
  `lib/homebrewFile.test.ts` and `lib/bundle.test.ts` keep the validators
  equal to them. A homebrew record never reaches `data.json`, `catalog.csv`,
  `i/` or `og/`.
  The import keeps each key the account holds and gives every other `hb_`
  key of a source, a section, a card or an item the account's derived key,
  `hb_` and 16 characters of `a-z2-7` from the FNV-1a 128 hash of the
  account's user id and the old key; a section keeps its key while its
  source keeps its own, and every `hb_` reference of the file follows. So
  the same file imported again finds its keys held, and the lists file
  import (`import-v2`) takes the same keys
  (`docs/decisions/2026-10-10-a-key-the-account-does-not-hold-becomes-a-derived-key.md`).
  «Сохранить себе» gives its item a new key at each press, and the rule
  cards it copies keep their derived keys; it copies no set
  (`docs/decisions/2026-10-21-each-save-to-my-items-press-makes-a-new-copy.md`,
  `docs/decisions/2026-10-22-a-save-to-my-items-copy-leaves-out-its.md`).
  The file format does not change. `llms.txt` and this section carry the
  rule; the frozen schemas' descriptions keep their published wording
  (`import-v2.json` and `import-v3.json`, entry `source`: "An account that
  holds the key gets a live reference; any other gets a frozen copy of the
  snapshot.").
- `schema/homebrew-v2.json` - the homebrew file `homebrew-v2`, `$id`
  `https://artex-x.github.io/daggerheart-loot/schema/homebrew-v2.json`:
  `homebrew-v1` with `version` 2 and a card's `items`, 1 to 100 unique catalog
  ids, never an `hb_` key. The export writes it always; the import reads
  both (`docs/decisions/2026-10-21-the-homebrew-export-writes-homebrew-v2-always.md`).
  Frozen as `homebrew-v1` is: any other change is `homebrew-v3.json`. Its
  other definitions equal `homebrew-v1.json`'s (`lib/homebrewFile.test.ts`);
  fixtures `export.json`, `example.json`, `example-v2.json` and
  `errors-v2.json`; `llms.txt`, "Homebrew items as a file (homebrew-v2)" and
  its "Book items in a card", describes it. The schema's description keeps
  its published wording ("...only when a card holds them, else version 1",
  and the `llms.txt` section name it gives); `llms.txt` and this section
  carry the rule.
- The account's data zip (`daggerheart-loot-data-<YYYY-MM-DD>.zip`, from
  «Скачать мои данные» on `#/account`): one JSON file per kind at the root,
  each with its own `format` and `version`: `lists.json`, exactly the lists
  file of every account list (`import-v1`, `import-v2` when it holds a
  homebrew entry, or `import-v3` when it holds a GM-only entry), then
  `homebrew.json`, exactly the account's whole `homebrew-v2` file, when the
  account holds a source, a card or an item. Frozen: a data zip written today imports for good, and a new kind is
  a new root file. A data zip holds its files at its root and no folders;
  every entry is stored (method 0) with a UTF-8 name (flag bit 11), no
  zip64, no encryption, one disk, at most 1000 entries. The import reads a
  zip of at most 10 MB whose chosen file is at most 5 MB. «Импорт из файла»
  on `#/lists` reads its `lists.json` and «Импорт из файла» on «Мои
  предметы» its `homebrew.json`, each
  naming the other file with its page; a restore into another account is
  `homebrew.json` first, then `lists.json`
  (`docs/decisions/2026-10-02-a-lists-file-is-version-2-only-when-it-holds-homebrew.md`).
  The pins are `docs/fixtures/import/data.zip`, the zip of `export.json`
  (an account with no own item), and `docs/fixtures/import/data-homebrew.zip`,
  the zip of `export-v2.json` (gm1's lists, the axe as a homebrew entry) and
  `docs/fixtures/homebrew-file/export.json`, each byte for byte.

### Formatted text

A text field marked Markdown carries the formatted-text subset of
`docs/specs/FEATURES.md`, "Records", "Formatted text"; a file written before
2026-10-15 is read the same way. Plain text is valid subset text, so no file
version and no fixture changed. Stored homebrew text is read as Markdown with
no migration: a pair of `*` draws italics or bold, a `\` before an ASCII
punctuation character is hidden, a line that starts "1. " is a numbered list,
and a `|` line above a separator line is a table. A stored list or entry note
is read the same way, with no migration. The catalog text follows the catalog
style of `FEATURES.md`, "Records", "Catalog style" (`***Name:***` names, bold
costs, italic conditions); its plain text did not change, so `catalog.csv` and
the stubs did not change. The app no longer finds labels by a colon.

| Artifact | Field | Carries |
|---|---|---|
| `data.js`, `data.json` | `ende`, `rud` of records, `sets` and `refs` | Markdown subset source |
| `names.json` | `sets[k].ende`, `sets[k].rud` | Markdown subset source, as `data.js` |
| `catalog.csv` | `text_ru`, `text_en` | plain text (`markupText`, newlines folded) |
| `i/<id>.html`, `i/en/<id>.html` (stubs and app documents) | meta and Open Graph description, the stub's visible body | plain text |
| Preview host cards (`/h/`, `/s/`) | description, set bonus, players' note | plain text, cut by `fit` |
| `homebrew_items.content`, `homebrew_cards.content` | `ende`, `rud` | Markdown subset source |
| `lists.player_note`, `lists.gm_note`, `list_entries.player_note`, `list_entries.gm_note` | notes | Markdown subset source |
| `import-v1`, `import-v2`, `import-v3` files | list and entry `player_note`, `gm_note` | Markdown subset source |
| `homebrew-v1`, `homebrew-v2` files | item and card `ende`, `rud` | Markdown subset source |
| `import-v2`, `import-v3` files | entry `snapshot` `ende`, `rud` and its `cards` texts | Markdown subset source |
| Clipboard «Скопировать» | `text/plain`; `text/html` | plain text; flat HTML (`<b>`, `<i>`, `<br>`) |
| Names, subtitles, source and section names | all | plain text, never parsed |

`data.js` assigns `window.LOOT` from a classic script. That is not decoration:
the dataset is cached apart from the hashed bundle, so a code change does not
send the data again, and the app reads it at boot with no async bootstrap
and no loading state. (It began as a script because `fetch()` of a local
JSON is blocked under `file://`, retired 2026-09-24.) Any build must keep
loading the data this way, and read it through one typed adapter rather than
importing it.

The build appends one line to the published `data.js`: `window.LOOT_V = {...}`,
the record links' card versions (section 5), from `card-versions.json`, which
`node tools/build.js` writes (`tools/data-script.js`). The source `data.js`
never holds `LOOT_V`. An artwork refresh changes a version, so it changes the
published `data.js`, and a reader downloads it again after such a deploy.

`data.json` and `catalog.csv` are not committed, like `names.json`:
`node tools/build.js` writes them from `data.js` and the deploy publishes
them at the same URLs. Vitest reads the catalog from `data.js` through
`app/src/test/loot.ts`, which calls the same `tools/derived.js` functions.
A data change has no readable diff in git
(`docs/decisions/2026-10-28-data-json-and-catalog-csv-leave-git-the-build.md`).

## 5. Static asset paths

`img/<id>.webp`, `og/<id>.jpg`, `card/*.svg`, `i/<id>.html`, `i/en/<id>.html`,
`en/` (the file `en/index.html`), `og/_share.jpg`, `og/_share_en.jpg`,
`names.json`, `catalog-index.csv`, `schema/import-v1.json`, `schema/import-v2.json`,
`schema/import-v3.json`, `schema/homebrew-v1.json` and `schema/homebrew-v2.json`.
Referenced from outside (link previews, other people's bookmarks), so the
layout is public. `i/<id>.html` and the site root keep a Russian preview;
`i/en/<id>.html` and `en/` are their English counterparts (issue 64,
`docs/specs/I18N.md`). On the site each of them is the app document with that
card in its head; on the old host's mirror, a page that redirects to the site.

`img/<id>.webp`, `og/<id>.jpg`, `card/*.svg` and the two site cards
`og/_share.jpg` and `og/_share_en.jpg` are committed and published as they
are; `tools/artwork/cards.mjs` renders the two cards (`docs/artwork.md`, "The
site share cards"). `i/<id>.html`, `i/en/<id>.html`, `en/index.html`,
`names.json`, `catalog-index.csv`, the entry document and `assets/` are not
committed: they are what the build emits (`node tools/build.js` for the
mirror's `i/`, `i/en/` and `en/`, `names.json` and `catalog-index.csv`;
`app/index.html` and the bundle become `dist/index.html`, the site's app
documents `dist/i/`, `dist/i/en/` and `dist/en/`, and the hashed files under
`dist/assets/`, whose names change with every build and are not public), and
the deploy job publishes them from the build rather than from a committed file. Nothing about
the frozen paths above changes with them.

`manifest.webmanifest`, `sw.js` and `icons/` are build outputs too, published
the same way as `assets/`: Vite copies them verbatim from `app/public/`. The
URL `sw.js` stays stable once published, because every registered worker
keeps polling it; the worker stays registered and caches only pictures and
hashed build files (`docs/specs/META.md` section 9).

`pages/<name>.html` (Russian) and `pages/en/<name>.html` (English) are the
site's static pages, one copy per language: `install`, `privacy` and
`terms`. The `privacy` and `terms` URLs are frozen once submitted to the
Google OAuth console. `tools/build-pages.js` generates them from
`pages/src/<name>.html` and `pages/src/en/<name>.html` through
`node tools/build.js`, and the deploy job publishes them from the build, like
`i/`; `pages/src/` is never published. A page URL is public once something
outside links to it (`docs/specs/META.md` section 9, "Static pages").

`img/thumb/<id>.webp` is a 160x160 derivative of `img/<id>.webp`, one per
picture, committed and published with `img/`;
`tools/artwork/` writes it (`docs/artwork.md`, "Thumbnails"). It is internal:
the app draws it in rows, and nothing outside links to it, so
`docs/fixtures/`, `tests/contracts.js` and `llms.txt` do not name it - on the
same footing as the `tools/artwork/` paragraph below.

A record with no picture has no `img/` or `og/` file; its link card names the
site card of its language, `og/_share.jpg` or `og/_share_en.jpg`, as a large
card. The placeholder `img/_none.webp`, its thumbnail and `og/_none.jpg` were
removed on 2026-10-29 (owner); a messenger that cached a card before then keeps
a dead picture until it fetches the page again.

`<id>` in `img/<id>.webp` and `og/<id>.jpg` is the **asset id**, not
necessarily the record id: it is the basename of a record's `img` field, and
several records may share one asset (`tools/build-share-pages.js` derives the
`og:image` tag from `img`, never from `id`, so this is already the rule the
code enforces, not a new one). In both directions: replacing a shared asset
never creates `og/<some-other-sharing-record's-id>.jpg`, and a new record
that joins an existing asset gets no `img/` or `og/` file of its own.

`tools/artwork/` (see `.claude/README.md`, "Artwork tooling") enforces this
same rule at write time rather than only documenting it, so its shipment
was deliberately not treated as a new contract: `docs/fixtures/`,
`tests/contracts.js` and `llms.txt` state behavior the code already
enforced, not a new promise the code just started keeping.

**The site's host.** The origin `https://daggerheart-loot.pages.dev` (the
Cloudflare Pages project `daggerheart-loot`) is frozen: only this production
host is handed out, never a deployment host. Since the task `cloudflare-pages`
(2026-10-28) it is `<site>`: Pages serves every path above as a static file,
answers every route path with the app document (section 1), and an unknown
path answers `404.html` with status 404 (an unknown record id `/i/zzzz` too). A `.html` path answers
308 to the same path without `.html` (`i/<id>.html` to `i/<id>`,
`en/index.html` to `en/`), so every frozen `.html` URL keeps opening through
one redirect. The path `/mcp` is the MCP endpoint (section 6); `/mcp/me` and
every other path under `/mcp/` stay reserved for the account tier of the task
`ai-mcp` and answer 404, and the deploy refuses a published `mcp`. The path `/api/` is reserved for the read API (section 6), whose
static part is `/api/v1/catalog/`; the deploy refuses any other published file under
`api/`. `/.well-known/oauth-protected-resource/` is reserved for the account tier of
that task, and the deploy refuses a published file there. `apidata/` is internal:
the projections of the worker, changed without notice, like `img/thumb/`.

**The record link.** The app and every tool hand out a record as
`<site>i/<id>?v=<v>` in Russian and `<site>i/en/<id>?v=<v>` in English
(owner, 2026-10-28). The address bar on a record page carries the same `?v`
at once, so a link copied from the bar equals the copy button's (owner,
2026-10-28). `<v>` is the record's card version from the build's map:
opaque, so nothing parses it; a changed card is a new URL to a messenger's
cache. A record the map does not hold gets the link without `?v`. The host
ignores the query and answers the record's app document: the app runs at the
same URL with no redirect, and a crawler reads the record's card from the head.
The card fields' `og:url` and `canonical` and the `url` column of
`catalog.csv` are the extensionless link without `?v`. The fixture is
`docs/fixtures/urls/record.json`: `build` holds the links, `serve` the host's
answers.

**The old host.** `https://artex-x.github.io/daggerheart-loot/` (GitHub Pages)
serves the same files as a mirror, without `assets/`, `data.js` and the
install guide: its root forwards to `<site>` with the fragment, its `i/`,
`i/en/` and `en/` are the redirect pages of `tools/build-share-pages.js` (to
`<site>i/<id>`, `<site>i/en/<id>` and `<site>en/` with the fragment), and its
`sw.js` unregisters itself (`docs/specs/META.md` section 9, "The old host").
The file schemas keep their `$id` there (section 4), and the mirror keeps
each one readable.

**The link cards.** A card path answers the app document with the link card
in its head: a messenger reads the card, and a person's browser runs the app
at the same URL with no redirect. The status is the card's (200, 404 for a
not-found card, 503 for a failed read). When the worker cannot read the app
document (`index.html` from the deployment's own files), it answers the card
page instead, which redirects a person to the route's `#/` form. The
families, each also with `/en` after the origin for the English card and the
English app:

- `https://daggerheart-loot.pages.dev/h/<uuid>`, a homebrew item
- `https://daggerheart-loot.pages.dev/s/<token>[/f_<filter>]`, a share link
- `https://daggerheart-loot.pages.dev/p/<id>`, a print set
- `https://daggerheart-loot.pages.dev/tables/<table>[/<tail>]`, a catalog
  table, one of its blocks or its filter; `homebrew` and an unread
  `names.json` draw the site's words

Of the families, the app adds `?v=<v>` to `/h/` and `/s/` links only: opaque, a version of
what the card draws, so a changed card is a new URL to a messenger's cache.
The address bar on an item and a share link page carries the same `?v` once
the page has read its card; a navigation drops it.
The host ignores every query. A path run (an id, a token, a table or a
tail) past 2048 characters reads as empty. Only `GET` and `HEAD` are
answered; any other method answers 405 with `Allow: GET, HEAD`.
`preview/public/_routes.json` sends only these families and the read API (`/api/*`,
section 6) to the worker; every other path is a static file of the site or the 404 page. A deployment or
branch host answers 301 to the same path and query on the production host
for a family path. The fixture is `docs/fixtures/urls/preview.json`: `routes`
is the routes file's list, `build` holds the links the app hands out, `serve`
the host's answers (a `static` row is a path Pages serves, not the worker;
`app` is the card page's redirect target, the answer when the app document
cannot be read).

## 6. The read API

A public, read-only API on the site's host, served by the same stateless worker
as the link cards (`preview/api/`, `preview/api/openapi.json`; decisions "The
read API and MCP are one stateless worker over build-time projections", "The app
keeps its logic; the API runs the same pure modules" and "API v1 is public read,
frozen, with a v2 beside it for a break"). It needs no key. Every operation is
tier T0: it ignores an `Authorization` header and never forwards it, so every
Supabase read runs as the anon reader and an answer never depends on the caller.
Fixtures: `docs/fixtures/api/v1/`, checked by `preview/api/api.test.mjs` byte for
byte and by `tests/contracts.js`; the MCP endpoint's are `docs/fixtures/mcp/`, checked
by `preview/api/mcp.test.mjs`.

| Operation | Answer |
|---|---|
| `GET /api/v1/openapi.json` | the OpenAPI 3.1 description |
| `GET /api/v1/rolls` | `daggerheart-loot/api-rolls` v1 |
| `POST /api/v1/rolls/{section}` | `daggerheart-loot/api-roll` v1 |
| `GET /api/v1/tables` | `daggerheart-loot/api-tables` v1 |
| `GET /api/v1/tables/{table}` | `daggerheart-loot/api-table` v1; `part` is required on `eq_weapon`, `eq_secondary` and `eq_armor` |
| `GET /api/v1/records/{id}` | `daggerheart-loot/record` v1 |
| `GET /api/v1/homebrew-items/{uuid}` | `daggerheart-loot/record` v1 |
| `GET /api/v1/shared-lists/{token}` | `daggerheart-loot/api-shared-list` v1 |

The bulk catalog is not an operation: `/api/v1/catalog/index.json`
(`daggerheart-loot/api-catalog` v1) names the absolute URLs of its chunk files
`/api/v1/catalog/<n>.json` (`daggerheart-loot/api-catalog-chunk` v1), and lists
every catalog record as `{ id, rev, chunk }`. They are static files that Pages
serves (`_routes.json` excludes the prefix), so a pull costs no Functions request.
A client compares `data_version` and each `rev` with what it holds and reads only
the chunks of the changed ids; a chunk whose `data_version` differs from the
index's, or a chunk URL that answers 404, means a deploy happened between the
reads, and the client reads the index again. Frozen: the index URL, both schemas,
the `rev` rule (an opaque string, compared for equality only, changed whenever the
record's JSON changes, and possibly at other times) and each `chunks` entry being
an absolute URL. Not frozen: the chunk names, their count and the ids a chunk
holds. A miss under `/api/v1/catalog/` is the 404 page of Pages, not JSON. The
files answer `Access-Control-Allow-Origin: *` from Pages, which
`tools/check-site.mjs` holds for the index and for one `img/` picture.

**Frozen at v1.** The paths, the parameter names, the field names, the values of
each answer's `format` and the CORS rule. A new optional parameter, a new field, a
new resource and a wider value list change in place; anything else is `/api/v2/`
beside v1. A client ignores unknown fields. A client that meets an error `code` it
does not know acts on the HTTP status; a `code` keeps its status and meaning for
good. Every answer names its `format` and `version`.

**Links.** A record's `link` is what the app's `linkToRecord` hands out (section 5, "The
record link"): `<site>i/<id>?v=<v>` and `<site>i/en/<id>?v=<v>` for a catalog record, with
`<v>` from the build's card-version map, `<site>h/<uuid>?v=<v>` and `<site>en/h/<uuid>?v=<v>`
for a homebrew item. A record the map does not hold, and a homebrew entry without an item
id, has no `?v`. The `?v` is opaque; the unversioned URL is the canonical `og:url`. A client
stores the link as given. A shared-list answer has no link of its own. The 422 messages keep
their bare app links.

**Answers.** JSON, `Content-Type: application/json; charset=utf-8`. Every text a
person reads is a pair `{ "ru", "en" }` built by the app's own functions: an empty
Russian side takes the English text, English never takes Russian. The error answer
is `{ "format": "daggerheart-loot/api-error", "version": 1, "error": { "code",
"message" } }`; the message is English, names a field and never echoes a value.
Projection answers carry `ETag: "<data_version>"`; the OpenAPI document's `ETag` is its
version and a hash of its bytes. They carry `Cache-Control: public,
max-age=300` and answer 304 to a matching `If-None-Match`; rolls, homebrew items and
shared lists are `no-store`.

| Status | `code` | When |
|---|---|---|
| 400 | `bad_request` | a parameter or body field fails its schema; the message names the field |
| 404 | `not_found` | an unknown path, section, table, part, record id, homebrew id or share token |
| 405 | `method_not_allowed` | another method; `Allow` names the allowed ones, `OPTIONS` included |
| 413 | `too_large` | a request body past 4096 bytes |
| 415 | `unsupported_media_type` | a `POST` body that is not `application/json` |
| 422 | `answer_too_large` | a Supabase answer past 65536 bytes; the message gives the app link |
| 503 | `unavailable` | a file or Supabase read failed, timed out or was invalid; a second `data_version` mismatch |

The check order, pinned by the fixtures: the host guard's 301 (a deployment host or
a branch alias; the one answer without the JSON headers), `OPTIONS` 204, the path
404, the method 405, the section or table id 404, 415, 413, then the body and
schema 400. A path run past 2048 characters reads as empty.

**CORS.** Every answer under `/api/` carries `Access-Control-Allow-Origin: *`, none
carries `Access-Control-Allow-Credentials` or `Vary: Origin`, and every worker answer
(all of `/api/` outside `/api/v1/catalog/`) also carries `X-Content-Type-Options:
nosniff` and a CSP with `sandbox`. `OPTIONS` on bare `/api` and on any path under
`/api/` outside `/api/v1/catalog/` answers 204 with
`Access-Control-Allow-Methods: GET, POST, OPTIONS`,
`Access-Control-Allow-Headers: Content-Type` and `Access-Control-Max-Age: 86400`,
and reads no file. Each preflight is one Functions request on the shared quota.
`_headers` never carries an `Access-Control-Allow-Origin` line.

**Reserved.** `/api/v1/me/` is reserved for the account tier. It holds no data in
v1, answers the JSON 404, and its 404 and preflight carry `*` only because it is
reserved; v1 promises no CORS rule for it, and the account tier replaces both
answers with an explicit `Origin` allowlist. `/mcp/me` stays reserved (section 5).

**MCP.** `https://daggerheart-loot.pages.dev/mcp` is a read-only MCP server over the same
service (`preview/api/mcp.mjs`; decision "The MCP endpoint is a hand-written dispatcher over
the OpenAPI document"). Streamable HTTP, `POST` only, one `application/json` answer per
request, no stream, no session id, no sign in. It speaks the legacy era (`initialize`;
`2025-03-26`, `2025-06-18`, `2025-11-25`) and the modern era (`2026-07-28`: `server/discover`,
the version in `_meta`, the `MCP-Protocol-Version`, `Mcp-Method` and `Mcp-Name` headers,
`resultType`, `ttlMs` and `cacheScope`). A legacy version is reached through `initialize`: a
modern request that names one gets `UnsupportedProtocolVersion` (-32022). A legacy request
without `MCP-Protocol-Version` is served as `2025-03-26`. A missing or different modern
header is `HeaderMismatch` (-32020, status 400); an unknown modern method is -32601 with
status 404 (legacy: status 200). A notification answers 202 with no body.

| Tool | Operation |
|---|---|
| `list_rolls` | `GET /api/v1/rolls` |
| `roll` | `POST /api/v1/rolls/{section}`; `section` and the roll fields are the arguments |
| `list_tables` | `GET /api/v1/tables` |
| `get_table` | `GET /api/v1/tables/{table}`; `part` is an optional argument |
| `get_record` | `GET /api/v1/records/{id}` |
| `get_homebrew_item` | `GET /api/v1/homebrew-items/{uuid}` |
| `get_shared_list` | `GET /api/v1/shared-lists/{token}` |

The tools are the operations of `openapi.json` that carry `x-mcp-tool` and no `security`, in
document order; the description of a tool is its summary and description, and each argument
takes its parameter's description. A call returns the REST answer: `content[0].text` is its
JSON, `structuredContent` its value, and an operation error is a result with `isError` and the
`api-error` body (REST: the HTTP status). A missing or non-string path or query argument is a
400 `bad_request` result; an unknown tool or arguments that are not an object are -32602
with status 200. The check order, pinned by the fixtures: the host guard's 301, a path other
than exactly `/mcp` 404 with no body, any `Origin` header 403 (DNS rebinding; JSON-RPC
-32000), a method other than `POST` 405 with `Allow: POST`, a body that is not
`application/json` 415, a body past 65536 bytes 413 before any parse, a body that is not JSON
400 (-32700), not a JSON-RPC 2.0 request 400 (-32600), a message without `id` 202, then the
era. `/mcp` sends no CORS header, never reads `Authorization`, `Mcp-Session-Id` or
`Last-Event-ID`, and never answers 401. The URL equals `info["x-mcp-endpoint"]` of
`openapi.json`.

**Rights.** Every record carries `rights.license`, `dpcgl` or `owner`, read at build
time from `docs/rights/records.json` (decision "Game text rights follow a per-record
SRD audit"); a table with `reviewed` null (not yet accepted) makes every record `owner`; the owner accepted the table on 2026-11-12. `dpcgl`
means the English text is SRD 2.0 Public Game Content; the Russian text is a
third-party translation the value does not cover. A homebrew item is `owner`.

`apidata/` holds the internal projections the worker reads (`rolls.json`,
`tables.json`, `cards.json`, `roll/`, `table/`, `records/index.json`,
`version.json`). It is published beside the site and changed without notice, like
`img/thumb/`; nothing outside the worker binds to it, and it is not a contract.
