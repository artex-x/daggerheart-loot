# Public contracts

These are frozen. A link someone pasted into a chat months ago has to keep
opening, and an agent reading `llms.txt` has to be able to build a working
address without touching the site.

**Default: no contract change.** If one is unavoidable, the same change must
update the golden fixtures, the tests, this file and `llms.txt` together.

Fixtures: `docs/fixtures/lists/*.json`, `docs/fixtures/urls/routes.json`.
Checked by `tests/contracts.js`. `docs/fixtures/share/records.json` is not a
contract fixture in this sense - it is `share.test.ts`'s own golden,
regenerated from `dist/` by `tools/capture-share-fixture.mjs` and last
matched against the live app at `cf96e6f` (`docs/specs/COVERAGE.md`, "flows
- the share fixture's own provenance").

## 1. Hash route grammar

Frozen as written in `ROUTES.md`. In particular:

- the ten section names, and the three legacy ones that fold into `roll/std`
- the table names in `#/tables/<table>`, including `other_starting` and `other_frames`; legacy `frames` resolves to `other_frames` without rewriting the pasted hash
- the filter grammar `f_group-value[-value][.group-value]`, **including the
  group key spelling**: `range` and `burden`, not `rg` and `bu`
- `#/i/<id>`, `#/print/<ids>` (each id optionally followed by `*<n>`, a
  count), `#/lists/<listId>`, `#/l/<payload>`
- `#/account`, the account page, read in every build (the not-found page,
  address kept, where no sign-in is configured)
- `#/s/<token>`, an account share link: the token is opaque, made only by
  the list's owner, one active per audience (players, GM); it opens from
  `<site>#/s/<token>` and `<site>en/#/s/<token>` alike

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
| `dv` / `dve` | The Dragon's Vault loot / equipment |
| `cm` | Community items |
| `f` | Campaign frame equipment |
| `q` | Core and Hope & Fear equipment |

## 3. List link encoding

`#/l/` links stop decoding on 2026-10-26 (`LEGACY_WRITE_UNTIL`; decision
"`LEGACY_WRITE_UNTIL` is 2026-10-26; the migration release moves directly
after lists"); from then the codec, these fixtures and this section are
removed by a later release.

`#/l/<payload>` where `payload` is `base64url(utf8(raw))`, unpadded, `+`/`/`
replaced by `-`/`_`.

The address bar always holds the **plain** form and the **player** variant.

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
  (`en`, `ru`, `ende`, `rud`); a record names its set in `set`. Field
  meanings are in `README.md`.
- `catalog.csv` - one row per record, with the stat line.
- `i/<id>.html` - a stub page per record with Open Graph markup, in Russian;
  `i/en/<id>.html` - the same page in English.
- `en/index.html` - the English entry document, published at `<site>en/`:
  the English preview card of the site, which redirects to the app at the
  root with the fragment kept.

All of them are generated from `data.js` by `node tools/build.js` and
compared byte for byte by `tests/derived.js`.

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
`en/` (the file `en/index.html`), `og/_share.jpg` and `og/_share_en.jpg`.
Referenced from outside (link previews, other people's bookmarks), so the
layout is public. `i/<id>.html` and the site root keep a Russian preview;
`i/en/<id>.html` and `en/` are their English counterparts (issue 64,
`docs/specs/I18N.md`).

`img/<id>.webp`, `og/<id>.jpg`, `card/*.svg` and the two site cards
`og/_share.jpg` and `og/_share_en.jpg` are committed and published as they
are; `tools/artwork/cards.mjs` renders the two cards (`docs/artwork.md`, "The
site share cards"). `i/<id>.html`, `i/en/<id>.html`, `en/index.html`, the
entry document and `assets/` are not committed: they are what the build emits
(`node tools/build.js` for `i/`, `i/en/` and `en/`; `app/index.html` and the
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
