# Public contracts

These are frozen. A link someone pasted into a chat months ago has to keep
opening, and an agent reading `llms.txt` has to be able to build a working
address without touching the site.

**Default: no contract change.** If one is unavoidable, the same change must
update the golden fixtures, the tests, this file and `llms.txt` together.

Fixtures: `docs/fixtures/lists/*.json`, `docs/fixtures/urls/routes.json`.
Checked by `tests/contracts.js`.

## 1. Hash route grammar

Frozen as written in `ROUTES.md`. In particular:

- the nine section names, and the three legacy ones that fold into `roll/std`
- the table names in `#/tables/<table>`
- the filter grammar `f_group-value[-value][.group-value]`, **including the
  group key spelling**: `range` and `burden`, not `rg` and `bu`
- `#/i/<id>`, `#/print/<ids>`, `#/lists/<listId>`, `#/l/<payload>`

## 2. Record ids

Stable, and the join between the data, the stub pages, the artwork and every
shared list. Never renumber a record that has shipped.

| Prefix | Set |
|---|---|
| `ci` / `cc` | Core item / consumable |
| `hi` / `hc` | Hope & Fear item / consumable |
| `w` | Wondrous Loot |
| `di` | Dread GM Toolbox |
| `voa` | Vault of Ages (`voa<vol>_<tier><n>`) |
| `cm` | Community items |
| `f` | Campaign frame equipment |
| `q` | Core and Hope & Fear equipment |

## 3. List link encoding

`#/l/<payload>` where `payload` is `base64url(utf8(raw))`, unpadded, `+`/`/`
replaced by `-`/`_`.

The address bar always holds the **plain** form and the **player** variant.

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

- `data.json` - `{ items: {...}, eq: [...], refs: {...}, alt: {...} }`, the same
  content as `data.js`. Field meanings are in `README.md`.
- `catalog.csv` - one row per record, with the stat line.
- `i/<id>.html` - a stub page per record with Open Graph markup.

All three are generated from `data.js` by `node tools/build.js` and compared
byte for byte by `tests/derived.js`.

`data.js` assigns `window.LOOT` from a classic script. That is not decoration:
`fetch()` of a local JSON is blocked under `file://`, so the dataset has to
arrive as a script. Any future build must keep loading the data this way, and
read it through one typed adapter rather than importing it.

## 5. Static asset paths

`img/<id>.webp`, `og/<id>.jpg`, `card/*.svg`, `i/<id>.html`. Referenced from
outside (link previews, other people's bookmarks), so the layout is public.
