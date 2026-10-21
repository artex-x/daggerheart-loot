# Public contracts

These are frozen. A link someone pasted into a chat months ago has to keep
opening, and an agent reading `llms.txt` has to be able to build a working
address or import file without touching the site.

**Default: no contract change.** If one is unavoidable, the same change must
update the golden fixtures, the tests, this file and `llms.txt` together.

Fixtures: `docs/fixtures/lists/*.json`, `docs/fixtures/urls/routes.json`,
`docs/fixtures/urls/preview.json` (section 5), `docs/fixtures/import/` (section 4).
Checked by `tests/contracts.js`. `docs/fixtures/share/records.json` is not a
contract fixture in this sense - it is `share.test.ts`'s own golden,
regenerated from `dist/` by `tools/capture-share-fixture.mjs` and last
matched against the live app at `cf96e6f` (`docs/specs/COVERAGE.md`, "flows
- the share fixture's own provenance"). `docs/fixtures/homebrew/` is not a
contract fixture either until R7d's homebrew file: it holds the cases the
homebrew validators of `app/src/lib/homebrew.ts` and of the database share
(`docs/specs/COVERAGE.md`, "Suites").

## 1. Hash route grammar

Frozen as written in `ROUTES.md`. In particular:

- the twelve section names, and the three legacy ones that fold into `roll/std`
- the URL ids of the source products (owner, 2026-10-21): the sections `roll/wondrous_environments`, `roll/dread_gm_toolbox`, `roll/vault_of_ages`, `roll/dragons_vault`, `roll/arazos_artifacts`, `roll/community_items` and `roll/many_worlds_tavern`, and the tables `hope_and_fear_item`, `hope_and_fear_consumable`, `wondrous_environments`, `dread_gm_toolbox`, `vault_of_ages`, `dragons_vault`, `arazos_artifacts`, `community_items` and `many_worlds_tavern`; the app writes these. An old id still opens the same page (`roll/dread`, `#/tables/dv`, `hnf_item` and the rest, which are the internal ids); the address is not rewritten
- the table names in `#/tables/<table>`, including `other_starting` and `other_frames`; legacy `frames` resolves to `other_frames` without rewriting the pasted hash; the tables page's three copy buttons (the table, its filter, one block) hand out the preview host's address of the table (section 5), except on `homebrew`, and `<site>#/tables/...` keeps opening
- the filter grammar `f_group-value[-value][.group-value]`, **including the
  group key spelling**: `range` and `burden`, not `rg` and `bu`
- `#/i/<id>`, `#/lists/<listId>`, `#/l/<payload>`
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
  `get_shared_list(text, bigint, jsonb)` adds `rev`, the database's opaque
  hash of each linked record, and leaves out a `snapshot` that its `p_have`
  map names by that `rev`; a players'
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
  address; «Скопировать ссылку» and «Отправить» hand out the preview host's
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
| `cm` | Community items |
| `f` | Campaign frame equipment |
| `q` | Core and Hope & Fear equipment |
| `hb_` | reserved: a homebrew item's key, `hb_` and 16 of `a-z2-7`, per account; never a catalog id |

## 3. List link encoding

`#/l/` links stop decoding on 2026-10-26 (`LEGACY_WRITE_UNTIL`; decision
"`LEGACY_WRITE_UNTIL` is 2026-10-26; the migration release moves directly
after lists"); from then the codec, these fixtures and this section are
removed by a later release. `llms.txt` no longer documents building a `#/l/`
link (R6); an agent writes an import file (section 4).

`#/l/<payload>` where `payload` is `base64url(utf8(raw))`, unpadded, `+`/`/`
replaced by `-`/`_`.

The address bar always holds the **plain** form and the **player** variant.
From 2026-10-26 the app writes no `#/l/` address and expands no packed link; a
`#/l/` address then draws the retired page (`ROUTES.md`).

A list link opens from the site root, `<site>#/l/<payload>`, and from the
English entry document, `<site>en/#/l/<payload>`: the second redirects to the
first with the fragment kept, so both open the same list. The only difference
is the link preview a messenger builds, Russian for the first and English for
the second (section 5).

### The raw string

```
<name>\n<stamp><items>[\n<notes>]
```

**Items.** Comma separated, each `id` or `id*qty` or `id*qty*gold`. A price
forces the quantity to be written even when it is 1. A quantity of 1 with no
price is written as a bare id. Ids the data does not know are dropped on read.

**Stamp.** `<count base36>.<hash base36, last 4>~` prefixed to the items line.
The hash is FNV-1a over the joined items string. A messenger that wraps or
clips a long URL leaves a payload that still decodes into a shorter list which
looks complete; the stamp is what disagrees. A payload whose stamp does not
match the items is rejected outright. Links written before the stamp existed
have no `~` on the items line and are read as they always were.

**Notes.** A tail of records, each `\x1e[+]<id>\x1f<text>`.

- `\x1e` (record separator) starts a record, `\x1f` (unit separator) divides id
  from text. Neither can be typed into a note.
- A leading `+` on the id marks the note as meant for players. It rides on the
  id, not the text, because ids are letters and digits while a note may begin
  with anything. This is the same marker the pre-split format used for "copy
  along with the item", and it meant the same thing, so old links carry over.
- `~` as the id means the list's own note.
- `$` as the id carries the price display mode (`bag` or `coin`); `bag` is the
  default and is not written. It is not a record id and never can be, so a
  reader that predates the mode skips it and opens the list unchanged.
- Anything before the first `\x1e` is a list note from the first cut of this
  format, which had no marker; it meant the GM's own note.

**Player vs GM.** The player variant omits every note without `+`. The GM
variant carries both. Both are `#/l/<payload>`; nothing in the payload says
which it is.

### Short links

`#/l/~<payload>` is `base64url(deflate-raw(utf8(raw)))`. `~` cannot occur in
base64url, so the first character tells the two apart. Produced only by the
share buttons, and only when it actually comes out shorter; the address bar is
never compressed. On open the app expands it and rewrites the address to the
plain form, so everything downstream sees one format.

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
  `README.md`.
- `catalog.csv` - one row per record, with the stat line.
- `catalog-index.csv` - the catalog without its text, for an agent's one
  fetch (`llms.txt`, "Read this first"): the columns of `catalog.csv` without
  `url`, `text_ru` and `text_en`, in the same order, with the same rows, row
  order and quoting, from `tools/derived.js`'s `catalogIndexCsv(L)`. Budget:
  at most 196608 bytes, which `tests/derived.js` holds; 163562 bytes at 1459
  records, measured 2026-10-21, about 112 bytes a row, so the budget holds
  about 1750 records, about 296 more than today. A column may be added at
  the end, as `realm` was (2026-10-21, the last column of both files: a Many
  Worlds Tavern record's realm in English, empty elsewhere); any other change
  is a new file name. An ingest that passes the
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
  Worlds Tavern realm key to `{ n }`. A new key may be added; any other
  change is `version` 2. Budget: at most 196608 bytes, which
  `tests/derived.js` holds; 99779 bytes at 1459 records, measured
  2026-10-21. Not committed, like `i/`.
- `i/<id>.html` - a stub page per record with Open Graph markup, in Russian;
  `i/en/<id>.html` - the same page in English.
- `en/index.html` - the English entry document, published at `<site>en/`:
  the English preview card of the site, which redirects to the app at the
  root with the fragment kept.

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
  limits are the database's. The «Мои предметы» page imports it and writes
  it; `llms.txt`, "Homebrew items as a file (homebrew-v1)", describes it.
  Frozen: a bound may widen in place and never narrows, and so may a value
  list (the trait `any`, 2026-10-21, in all four homebrew and lists
  schemas); any other change is `homebrew-v2.json` beside it. Fixtures: `docs/fixtures/homebrew-file/`, the
  hand-test files, `export.json` (gm1's homebrew written by the export) and
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
  the same file imported again finds its keys held, and «Сохранить себе»
  and the lists file import (`import-v2`) take the same keys
  (`docs/decisions/2026-10-10-a-key-the-account-does-not-hold-becomes-a-derived-key.md`).
  The file format does not change. `llms.txt` and this section carry the
  rule; the frozen schemas' descriptions keep their published wording
  (`import-v2.json` and `import-v3.json`, entry `source`: "An account that
  holds the key gets a live reference; any other gets a frozen copy of the
  snapshot.").
- `schema/homebrew-v2.json` - the homebrew file `homebrew-v2`, `$id`
  `https://artex-x.github.io/daggerheart-loot/schema/homebrew-v2.json`:
  `homebrew-v1` with `version` 2 and a card's `items`, 1 to 100 unique catalog
  ids, never an `hb_` key. The export writes it only when a card holds
  `items`, else `homebrew-v1` byte for byte; the import reads both. Frozen as
  `homebrew-v1` is: any other change is `homebrew-v3.json`. Its other
  definitions equal `homebrew-v1.json`'s (`lib/homebrewFile.test.ts`);
  fixtures `example-v2.json` and `errors-v2.json`; `llms.txt`, "Version 2:
  book items in a card (homebrew-v2)", describes it.
- The account's data zip (`daggerheart-loot-data-<YYYY-MM-DD>.zip`, from
  «Скачать мои данные» on `#/account`): one JSON file per kind at the root,
  each with its own `format` and `version`: `lists.json`, exactly the lists
  file of every account list (`import-v1`, `import-v2` when it holds a
  homebrew entry, or `import-v3` when it holds a GM-only entry), then
  `homebrew.json`, exactly the account's whole `homebrew-v1` file, or
  `homebrew-v2` when a card holds book items, when the
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

| Artefact | Field | Carries |
|---|---|---|
| `data.js`, `data.json` | `ende`, `rud` of records, `sets` and `refs` | Markdown subset source |
| `names.json` | `sets[k].ende`, `sets[k].rud` | Markdown subset source, as `data.js` |
| `catalog.csv` | `text_ru`, `text_en` | plain text (`markupText`, newlines folded) |
| `i/<id>.html`, `i/en/<id>.html` | meta and Open Graph description, visible body | plain text |
| Preview host cards (`/h/`, `/s/`) | description, set bonus, players' note | plain text, cut by `fit` |
| `homebrew_items.content`, `homebrew_cards.content` | `ende`, `rud` | Markdown subset source |
| `lists.player_note`, `lists.gm_note`, `list_entries.player_note`, `list_entries.gm_note` | notes | Markdown subset source |
| `import-v1`, `import-v2`, `import-v3` files | list and entry `player_note`, `gm_note` | Markdown subset source |
| `dhloot.lists.v2`, `#/l/` payload | list and entry `note`, `hnote` | Markdown subset source |
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

`data.json` and `catalog.csv` stay tracked in git (a generated pair kept
rather than gitignored). Three triggers would reopen that: the seven
`app/src/lib/*.test.ts` suites stop reading `data.json` off disk; `data.json`
stops being one line (what keeps its diff invisible); its packed history
grows past a few MB (433 KB measured).

## 5. Static asset paths

`img/<id>.webp`, `og/<id>.jpg`, `card/*.svg`, `i/<id>.html`, `i/en/<id>.html`,
`en/` (the file `en/index.html`), `og/_share.jpg`, `og/_share_en.jpg`,
`names.json`, `catalog-index.csv`, `schema/import-v1.json`, `schema/import-v2.json`,
`schema/import-v3.json`, `schema/homebrew-v1.json` and `schema/homebrew-v2.json`.
Referenced from outside (link previews, other people's bookmarks), so the
layout is public. `i/<id>.html` and the site root keep a Russian preview;
`i/en/<id>.html` and `en/` are their English counterparts (issue 64,
`docs/specs/I18N.md`).

`img/<id>.webp`, `og/<id>.jpg`, `card/*.svg` and the two site cards
`og/_share.jpg` and `og/_share_en.jpg` are committed and published as they
are; `tools/artwork/cards.mjs` renders the two cards (`docs/artwork.md`, "The
site share cards"). `i/<id>.html`, `i/en/<id>.html`, `en/index.html`,
`names.json`, `catalog-index.csv`, the entry document and `assets/` are not
committed: they are what the build emits (`node tools/build.js` for `i/`,
`i/en/`, `en/`, `names.json` and `catalog-index.csv`; `app/index.html` and the
bundle become `dist/index.html` and the hashed files under `dist/assets/`,
whose names change with every build and are not public), and the deploy job
publishes them from the build rather than from a committed file. Nothing about
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
picture including `_none.webp`, committed and published with `img/`;
`tools/artwork/` writes it (`docs/artwork.md`, "Thumbnails"). It is internal:
the app draws it in rows, and nothing outside links to it, so
`docs/fixtures/`, `tests/contracts.js` and `llms.txt` do not name it - on the
same footing as the `tools/artwork/` paragraph below.

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
`tests/contracts.js` and `llms.txt` state behaviour the code already
enforced, not a new promise the code just started keeping.

**The preview host.** The origin `https://daggerheart-loot.pages.dev` (the
Cloudflare Pages project `daggerheart-loot`) is frozen: only this production
host is handed out, never a deployment host. It serves a link card to a
messenger and sends a person on to the app. The families, each also with
`/en` after the origin for the English card and the English app:

- `https://daggerheart-loot.pages.dev/h/<uuid>`, a homebrew item
  (`<site>#/h/<uuid>`)
- `https://daggerheart-loot.pages.dev/s/<token>[/f_<filter>]`, a share link
  (`<site>#/s/<token>[/f_<filter>]`)
- `https://daggerheart-loot.pages.dev/p/<id>`, a print set (`<site>#/p/<id>`)
- `https://daggerheart-loot.pages.dev/tables/<table>[/<tail>]`, a catalog
  table, one of its blocks or its filter (`<site>#/tables/<table>[/<tail>]`);
  never `homebrew`

The app adds `?v=<v>` to `/h/` and `/s/` links only: opaque, a version of
what the card draws, so a changed card is a new URL to a messenger's cache.
The host ignores every query. A path run (an id, a token, a table or a
tail) past 2048 characters reads as empty. Only `GET` and `HEAD` are
answered; any other method answers 405 with `Allow: GET, HEAD`.
`/robots.txt` is a static file; any other path answers 302 to `<site>`
(`<site>en/` under `/en/`); a deployment or branch host answers 301 to the
same path and query on the production host. The fixture is
`docs/fixtures/urls/preview.json`: `build` holds the links the app hands
out, `serve` the host's answers.
