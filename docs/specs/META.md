# Product meta policies

Standing decisions that look like bugs or oversights and are not. Do not "fix"
any of them without the owner saying so.

## 1. `noindex` on every page

`<meta name="robots" content="noindex, nofollow">` is in `app/index.html` -
the rewrite's entry document, which is what `dist/index.html` is built from -
and in every generated page: the site's record and English-root app
documents, which keep the shell's head outside the card block
(`tools/app-documents.js`), the mirror's stubs in `i/` and `i/en/` and its
English entry document `en/index.html` (`tools/build-share-pages.js`), and
the static pages in `pages/` and `pages/en/` (`tools/build-pages.js`,
section 9). The worker's app document carries it too, and the header
`X-Robots-Tag: noindex, nofollow`. This is a personal
tool and is meant to stay out of search results. Do not remove it to improve
SEO.

`tests/derived.js` asserts the tag on `app/index.html`, on the **source**
rather than on a build: `npm run check` does not build, so a check that read
`dist/index.html` would be reading whatever was built last. The same suite
reads that document's `<head>` (`headFacts`) and asserts it carries every field
the preview card needs - title, description, robots, color scheme, viewport,
every `og:*` and `twitter:*`, and the icon. Before R0c (issue 47) this compared
`app/index.html`'s head against the now-deleted root `index.html`'s; that
second document is gone, so the check is a single-document read now. The
mirror's English entry document `en/index.html` gets the same read, less the
two PWA tags (it is a redirect page, never the installed app's document); the
site's `dist/en/index.html` is the app document with the English card. The
published pages are checked again after a deploy by `tools/check-site.mjs`.

## 2. Crawling is allowed on purpose

`robots.txt` says `Allow: /`. Blocking crawlers would be worse, not better: a
crawler that is not allowed to fetch a page never reads the `noindex` on it, and
can still list the bare URL it found elsewhere. Letting it fetch and then telling
it `noindex` is what actually keeps the page out.

Link previews in messengers (Telegram, Discord, Slack) fetch the card paths
too, so a blanket `Disallow` would break those as well.

A preview card has one language. `app/index.html` (the site root, every
non-card route path, and every old `#/...` link, since the fragment never
reaches a crawler) and the record path `i/<id>` carry the Russian card;
`<site>en/`, every `/en/` non-card route path and `i/en/<id>` carry the
English one, with its own picture `og/_share_en.jpg` for the root
(`docs/specs/I18N.md`). Each card path answers the app document with its card
in the head (`CONTRACTS.md` section 5), so a pasted address-bar link draws the
same card as the copy button's.

The preview host's cards (`CONTRACTS.md` section 5), probed by the owner on
2026-10-14 in Telegram Desktop:

| Link | Card | Picture |
|---|---|---|
| `/h/` rich item, Russian and English | the title, the full subtitle and text; the English card in English | the site picture of its language, large (since 2026-10-29; probed with `og/_none.jpg` on 2026-10-14) |
| `/h/` item with its own WebP picture | the same | its WebP picture |
| `/h/` item with 1000 related items | drawn, the set line folded | the site picture of its language, large (since 2026-10-29; probed with `og/_none.jpg` on 2026-10-14) |
| `/s/` players' link | the list name, «5 позиций.» and the players' note | the site picture |
| `/s/` GM link | the same and « · Ссылка для мастера» | the site picture |
| `/p/` | «Печать карточек», «Войдите, чтобы печатать карточки.» | the site picture |
| a WebP and a JPEG test picture | both drawn | - |

Other Telegram clients and other messengers were not probed (owner: not
needed), so own pictures stay WebP.

Bulk collection for training is a separate matter and is refused by name:
`GPTBot`, `ClaudeBot`, `anthropic-ai`, `CCBot`, `Google-Extended`,
`Applebot-Extended`, `Bytespider`, `meta-externalagent`.

The `*` group also holds `Content-Signal: search=no, ai-input=yes,
ai-train=no`. The Content Signals Policy
(https://blog.cloudflare.com/content-signals-policy/, read 2026-10-15)
defines the three uses: `search` builds a search index and gives search
results, not AI search summaries; `ai-input` puts the content into an AI
model, with retrieval augmented generation, grounding and AI search
answers; `ai-train` trains or fine-tunes an AI model. So `ai-input=yes`
also allows an AI search answer built from a crawled copy, not only a fetch
a person asked for: an assistant must use the text to follow the `llms.txt`
reading route. A crawler obeys the group that names its token (RFC 9309),
so for the eight named tokens the `Disallow: /` wins over the signal;
`Google-Extended` keeps Gemini grounding refused. A crawler that does not
know the line ignores it, and compliance is the vendor's.

A crawler reads robots.txt only at a host root. Since the site moved to
`daggerheart-loot.pages.dev` (task `cloudflare-pages`, 2026-10-28), the
site's own `robots.txt` is that host's root file and is read. The old host
keeps a copy under `/daggerheart-loot/`, which no crawler reads
(`https://artex-x.github.io/robots.txt` answers 404; owner, 2026-10-15: no
root file for `artex-x.github.io`). The text files (`llms.txt`, `data.json`,
`catalog.csv`, `catalog-index.csv`, `names.json`, `schema/*.json`) carry
`X-Robots-Tag: noindex` on the site's host through
`preview/public/_headers`, which Pages applies to static files only; the old
host cannot send a header, so its copies carry none (an accepted trade-off of
the mirror). `tools/check-site.mjs --preview` asserts the root file and the
header after each deploy.

## 3. Lists live in the account

The no-backend law was superseded on 2026-09-24 (`docs/DECISIONS.md`). A
Supabase backend (Auth and Postgres, EU West) is the only server that
stores the site's data: accounts, lists and homebrew, each shipped in its
own release. One stateless preview Worker renders link cards and stores
nothing (the last paragraph of this section). Sign-in (Google or Discord) and `#/account` exist in a build
configured with the two `VITE_SUPABASE_*` values, and an account holds the
reader's preferences and lists (`STATE.md`); a signed-in reader makes every
new list there, and a signed-out one is asked to sign in first
(`FEATURES.md`, "Account and browser lists"). An account list is shared through `#/s/`
links, a players' one and a GM's one, which its owner can delete and make
again; a link opens the list as it is now, read-only. A nightly job backs the database up,
encrypted to the owner's key, and each copy is kept 30 days; a copy holds no sign-in
session, so a restore signs each restored reader out once
(`.claude/README.md`, "Backups and restore"). A nightly job reports the
free-plan usage to the owner (`.claude/README.md`, "Usage monitoring"). Browser lists, their
move into the account and the `#/l/` link left the app at R10 (`FEATURES.md`, "Account and
browser lists"): an old `#/l/` link draws the not-found page, and a build with no sign-in
configured has no lists.

Live updates reach an open shared page and the owner's other tabs and
devices only through Supabase Realtime private channels, sent by the
database; the backend is still Supabase alone, and no client sends on a
channel. "Allow public access" is off on both projects, a dashboard setting
the owner reads back each release (`docs/DECISIONS.md`, 2026-09-26,
"Realtime public access is off; the owner sets it in the dashboard").
On 2026-10-22 the dashboard read it as on for both projects; it was
switched off on both that day (the save disconnects every client).

A share link's holder, signed in or not, can send the list's owner a
purchase request (`FEATURES.md`, "Account and browser lists"). It is the
first write `anon` makes: through `create_purchase_request(uuid,text,jsonb)`
alone, a security definer function that holds every bound itself - a valid
active token, a client-made id whose replay inserts nothing, at most 100
lines of items the list holds and 10 pending per list (the defaults of
`request_lines` and `pending_requests_per_list`), 5 requests a minute per
link - and stores no name, account or address of the sender. A request
expires 1 hour after the list's owner first reads it, applies or declines it,
or 30 days after it was sent while nobody reads it (`docs/decisions/`,
2026-10-07, "A list's change log shares the requests' view and the
database's clean-up"). `anon` executes seven functions: the held-records
overload `get_shared_list(text,bigint,jsonb)`, the security definer that
builds the projection, checks the share and the list's revision before any
build (`unchanged` for a revision the list has not passed), names each
linked record by `rev` and builds only the records the caller does not hold;
`get_shared_list(text)` and its revision overload
`get_shared_list(text,bigint)`, security invoker forms of it that answer no
`rev` and every record; that one, `get_homebrew_item(uuid)`, `get_item_preview(uuid,text)`
and `get_shared_list_preview(text)`, and reads no table (`tests/db/harness.test.mjs`;
`docs/DECISIONS.md`, 2026-09-26, "Purchase requests are written only by a
bounded function any link holder calls"). Only the request function has a
rate limit: a caller who holds a share link or an item id can repeat these
reads and spend the free plan's 5 GB of uncached egress and the `anon`
role's database time. The owner accepts it and reads the usage dashboard
monthly (owner, 2026-10-22; `docs/decisions/`, 2026-10-22, "Anonymous reads
have no rate limit; the owner watches the usage").

Data with a lifecycle is deleted by the backend on a schedule, never by a
client: `public.lifecycle_cleanup()`, which `pg_cron` runs hourly at minute
7 as the job `dhloot-lifecycle`, and the nightly usage report for its own
`usage_snapshots` (kept 400 days). A client may hide such a row by its
clock; a reader's explicit delete is not lifecycle logic. No API role
executes the function. The nightly usage report warns when a row outlives
its retention by 2 hours, or the job's newest run failed or is older than 2
hours (`docs/decisions/`, 2026-10-07, "Lifecycle data is deleted by the
database on a schedule").

| Rows | Deleted |
|---|---|
| `purchase_requests`, pending or decided (with their lines) | when `expires_at` passes: 1 hour after the first read, apply or decline, or 30 days after `created_at` unread |
| `list_notices` read | 1 hour after `read_at` |
| `list_notices` unread | 30 days after `created_at`, which each new change of the item resets |
| `list_shares` stopped | 30 days after `revoked_at`, only when a newer row of the same list and audience exists: the owner's panel draws the newest row of each audience |
| `cron.job_run_details` | 7 days after `end_time` |
| own picture files of `homebrew-art` that no item names | at the row change that stops naming them, through the Storage API; else the hourly job, 1 hour after the upload, at most 2000 a run |
| `homebrew_art_released` (the names queued for deletion) | 1 day after `at` |
| `print_sets` | 90 days after `opened_at`, which an open moves at most once a day |

Printing needs an account. A print set holds references: the ordered
catalog ids and homebrew item ids of one sheet and their counts, never a
record, a note, a price or a picture name. Two definer functions for
`authenticated` only, `create_print_set(jsonb)` and `get_print_set(text)`,
write and read it; the table has no grant and no policy, and `anon` gains
nothing. A reader of a set's 12-character id sees the cards as they are
now, and an item deleted since is left out and counted (`docs/decisions/`,
2026-10-08, "A print set holds references and lives 90 days after its last
open").

Homebrew items, their sources and sections, and the author's set and rule
cards live in the account only: never in the browser's storage. They leave it only as the reader's own file: a homebrew
file, the data zip's `homebrew.json`, or a lists file's version 2 entry with
its snapshot (`FEATURES.md`, "Homebrew"). Any homebrew item opens for
anyone who holds its id, through two definer functions,
`get_homebrew_item(uuid)` (`anon` and `authenticated`) and
`get_homebrew_items(uuid[])` (`authenticated`, at most 1000 ids); nobody
can list items, and neither answer holds the owner. `get_homebrew_item`
also answers `updated_at`, when the item, its source or a card it names
was last changed, with three known limits: a rename of a source moves the
time of every item in it, an «Обновить» import that writes the same
content moves it too (`docs/decisions/`,
2026-10-07, "An item is read by its id by anyone; a list holds a live
link"), and a change of a card's book items alone moves the time of every
item that names the card (`docs/decisions/`, 2026-10-08, "An own set or rule
card holds book items; only its account sees them"). The client makes each
item id, and a delete frees it, so a deleted item's address may later open
another account's item, in a `#/h/` link and in its author's print sets
(owner, 2026-10-22; `docs/decisions/`, 2026-10-22, "A deleted item's id may
be taken again by another account"). The preview Worker
draws a link card for every item `get_homebrew_item` returns, to the same
audience as `#/h/` and with no opt-in: the holder of the link chose to
share it.

An own homebrew item may have a picture: two public files of the Supabase
Storage bucket `homebrew-art` under one random name, `p/<32 hex>.<ext>`
(640 px) and `t/<32 hex>.<ext>` (160 px), WebP or JPEG, at most 200 KB.
`homebrew_items.art` stores the name (or a catalog picture's basename),
never an address, and the three item reads and `get_print_set` answer it as
`img` beside the record. Only `homebrew_items.art` names a file: a print set
holds the item's id and reads its picture at each open; a table that stores
a picture name extends the release trigger, the job's files block and the
`lifecycle_files` watch. Ownership is the object's `owner_id`, which Storage sets from the
session: an item names only an upload of its stored owner, and an upload
needs room under twice `homebrew_items_per_owner` plus 5 pictures. The
browser uploads and never deletes: the database deletes a file when no item
names it, through `pg_net` with the project's URL and a secret key in
Vault, and a failed request refuses no write; the hourly job asks again.
On the test project (2026-10-14) the Storage API answered 400 or 404 for
a deleted file within 30 s, while its public address, read once before the
delete, still answered 200 from the CDN. Uploads ask for a cache age of one
day (`cacheControl` 86400, against readers' egress; the decision below), so a removed picture is
expected to stay readable for at most a day: a bound from the cache age,
not a measurement.
`anon` still executes the seven functions above and has no storage policy
(`docs/decisions/`, 2026-10-14, "Own pictures are random-named files the
database deletes").

An account's lists leave it only as the reader's own file: the lists JSON
or the data zip of `#/account` (`FEATURES.md`, "Account and browser
lists", "Exports"), which is the per-user backup and the way between two
accounts. The site keeps no copy of a file, and «Импорт из файла» on `#/lists` and
on «Мои предметы» import only a file the reader chose, through the same
Supabase backend.

The Supabase backend is the only server that stores data; one stateless
preview Worker renders link cards and stores nothing. It is the Cloudflare
Pages project `daggerheart-loot` (`.claude/README.md`, "Preview host"). It
makes three reads, each as a signed-out reader: `get_item_preview(uuid,
text)`, `get_shared_list_preview(text)` and the site's generated
`names.json`. The two card reads
(`supabase/migrations/20261014120200_link_previews.sql`) answer only what a
card draws, and nothing beyond what `get_homebrew_item` or `get_shared_list`
shows to the same caller, so an answer stays a few KB at any set size or
entry count. It keeps `names.json` in memory for 10 minutes and nothing
else; it has no edge cache, no cookie and no persistent log. A GM link's
card read carries no GM note at all: a list card shows the list name, the
count of the entries that the link's audience sees and the start of the
players' note. Add no other
backend, upload endpoint or paste service (`docs/decisions/`, 2026-10-14,
"Link previews come from a stateless worker").

## 4. HTTP only; `file://` retired

Superseded 2026-09-24 (`docs/DECISIONS.md`, "Running from a folder and
offline use are nice-to-haves"). Until then the built app opened from a
folder, which forced one classic IIFE bundle and a `defer` entry tag. Since
2026-09-24 the build serves over HTTP only: `dist/index.html` loads one ES
module entry with a hashed name under `assets/`, and a copy opened from a
folder does not start, because Chrome blocks modules over `file://`.

What stays:

- `base: '/'`: every URL starts at the host root (`/data.js`,
  `/assets/...`, `/img/`, `/card/`, `/pages/`, `/schema/`, `/sw.js`), so
  the app runs at every route path (`ROUTES.md`, "Path form"); it runs only
  at a host root - the site's host, `vite preview` and the test server
  (owner, 2026-10-28). Rejected: a `<base href="/">` element, which breaks a
  fragment-only `url(#...)` of the print page's inline SVG in some engines
  and sends the skip link `#main` off the document; relative paths at every
  depth, which only a worker could answer, so a quota burn would reach the
  whole site. CSS `url()` stays relative to its stylesheet, and the
  manifest's `./` values resolve against `/manifest.webmanifest`. The
  `base: '/daggerheart-loot/'` of the issue 47 plan stays rejected
  (`docs/decisions/2026-10-28-addresses-are-paths-with-the-language-prefix-and.md`).
- `data.js` stays a classic script that assigns `window.LOOT` before the
  module runs (`CONTRACTS.md` section 4).
- The `<noscript>` links resolve through the build: `vite.config.mts`'s
  `closeBundle` copies `catalog.csv`, `data.json` and `llms.txt` into
  `dist/`, `schema/import-v1.json`, `schema/import-v2.json`,
  `schema/import-v3.json`, `schema/homebrew-v1.json` and
  `schema/homebrew-v2.json` resolve through the
  `schema` entry of `vite.config.mts`' `ROOT_DIRS` (a junction in `dist/`,
  as `img/`), and `tools/smoke-http.mjs` asserts every `noscript a[href]`
  resolves to a real file under `dist/`.

The main landmark's id moved from `view` to `main`, alongside the skip link,
after checking `#view` appears in no spec, fixture, or route grammar
(`CONTRACTS.md` names routes, ids, links, and asset paths, never a DOM id);
`tabindex="-1"` was preserved on the move. Other shape differences from the
deleted live app, carried deliberately: the skip-link text itself, the pair
of controls now marked `type="button"`, and the selection bar being absent
from the DOM when empty rather than present with a `hidden` attribute.

First load, measured live 2026-09-17 on the IIFE build, enforced by nothing
(`bundle-budget.mjs` excludes `data.js`): `index.html` 2,120 B gzip +
`assets/app.js` 92,033 B + `data.js` 148,860 B = 243,013 B gzip, ~973 kB to
parse; `data.js` re-eval 32.1 ms in Node (a mid-range phone 4-6x that);
`buildIndex`'s `byId` pass 1.27 ms. The number to quote at any proposal to
grow `data.js`. Since the task `cloudflare-pages` the published `data.js`
also carries `window.LOOT_V`, the record links' card versions: about 26 KB
raw and 12 KB gzip at 1459 records (`tests/derived.js` prints it), about
45 KB gzip at three times the catalog.

## 5. Never infer an equipment tier from its stats

Damage bands for adjacent tiers overlap. A guess trained on the Core tables
misses one row in seven of its own and four in seven on a third-party book.
Every piece of equipment carries a tier taken from a book. Wondrous does not
print one next to the item, but its "Loot items by environment" table binds each
piece to a location and the location has a tier; those eleven are pinned by name
in `tests/derived.js`.

## 6. Interface language

Interface text is Russian and English (see `docs/specs/I18N.md`); everything
else - tests, tools, comments, developer docs - is English (`CLAUDE.md`).
`tests/` is being brought into line in phase 8: today its node/browser suites
(`tests/run-all.js`, `tests/stub.js`, and the rest of `tests/*.js`) still
print Russian messages and comments, which predates this rule, while
`app/src/**/*.test.ts` is already English throughout. Closing census of the
language sweep, 2026-09-17: 14 files, 395 Cyrillic lines remain under
`tests/` + `tools/` (snapshots excluded), every one a product literal or an
English sentence quoting one; the 24 remaining Cyrillic comment lines were
classified by hand.

## 7. The 404 fallback page

Kept on the owner's instruction over the review's recommendation to skip it.

`404.html` is authored and tracked at the repository root (it carries no
data, so nothing generates it) and published by `.github/workflows/ci.yml`'s
collect step alongside `llms.txt`/`robots.txt`, to both hosts. Each host serves
it verbatim, with a 404 status, for any request that does not match a real
path - a share link truncated by a chat client, a hand-typed record id
(`/i/zzzz`), a record path whose record a data change dropped, `/mcp` until the task `ai-mcp`, and
on the old host the install guide (section 9, "The old host"). Before this page
existed, every one of those landed on GitHub's own generic 404, with no
route back to the app in either language (verified live on `i/zzzz.html`
before this page shipped).

It carries `noindex, nofollow` like every other page (section 1) and both
languages on the one page at once (`docs/specs/I18N.md`) rather than
switching on a stored preference, since there is no script here to read one.
The English half sits in a `<div lang="en">`. There is no per-language 404
(issue 64): Pages serves one `404.html` for every miss, whatever the path,
so a variant could only be a script that picks a language from the path
(`/en/` or `/i/en/`). That was rejected: the page is script-free by design,
a dead end reads at a glance in either language, and its value is having no
logic that can fail.
Its links are absolute URLs of the site's host
(`https://daggerheart-loot.pages.dev/#/roll/std` and `.../#/search`; the
English half `.../en/#/roll/std` and `.../en/#/search`) rather than
relative, unlike every other page in this repository: it can be served
while the browser still shows an arbitrary, possibly nested bad path, and a
relative link would resolve against that path's own directory, not against
this file's real location. One file serves both hosts, and the old host's
root only forwards, so the links name the site's host itself. It exists only
as a serving fallback, so the relative links of the static pages
(section 9) are not its rule. `tools/check-site.lib.mjs`'s `checks()` proves the
fallback on every deploy and on every CI run outside `main`
(`deploy-replay`), against the local `_site/` build before publishing, and
on every deploy against the live URL after
(`tools/check-site.mjs --dir _site` / `tools/check-site.mjs <url>`), and
`mirrorChecks()` does the same for the old host (`--mirror`).

## 8. Link previews are cached by Telegram, so a changed card is a new URL

Telegram keys a link's unfurl preview on the URL, with no TTL, and ignores
everything the origin serves - a changed `Cache-Control`, a changed
`og:image` byte, a redeploy. Nothing at the app level refreshes a cached
preview, and nothing pushes one: the Telegram preview refresher was removed
(owner, 2026-10-28, task `cloudflare-pages`).

Instead every link the app hands out for a card carries a version in its
URL. A record link is `<site>i/<id>?v=<v>` (`i/en/<id>` in English), where
`<v>` comes from the build's map of each record's card text and picture
bytes in both languages (`card-versions.json`, appended to the published
`data.js` as `window.LOOT_V`; `CONTRACTS.md` sections 4 and 5). A link of
`/h/` or `/s/` carries `?v=<v>`, a version of what its card draws. So a
changed card, an artwork refresh included, is a new URL to Telegram's cache.
A link shared before a change keeps its old card for good (owner,
2026-10-28). `/p/` and `/tables/` links carry none: a print card never
changes, and a table card changes only with a data deploy, so an old
message keeps the old count. The record cards' `og:url`, the site root and `en/`
carry no version: a cached card of the site itself stays as it is.

The address bar carries the same version (owner, 2026-10-28): on a record at
once, and on `/h/` and `/s/` once the page has read its card, so a link
copied from the bar draws the same card as the copy button's link. A
navigation drops it.

## 9. Installable app (PWA)

The published site installs as an app on Android and desktop Chrome and on
iOS. The installed app needs a connection, the same as the site: offline
use was retired on 2026-09-24 (`docs/DECISIONS.md`).

### The manifest and the icons

`app/public/manifest.webmanifest`, copied verbatim into `dist/` by Vite's
`publicDir`:

- One language, Russian, like the share stubs (`docs/specs/I18N.md`);
  `name` equals `og:site_name`. `short_name` is "Лут DH": Android launchers
  truncate past about 12 characters, and "Лут Daggerheart" is 15.
- `id`, `start_url` and `scope` are `./`, relative to the manifest, so they
  resolve to the host root `/` on the site's host (`/daggerheart-loot/` on the
  old host before the move). An absolute base changes nothing here.
- `theme_color`, `background_color`, the `theme-color` in `app/index.html`'s
  head and in every static page's head are all `--bg` from `tokens.css`;
  `tests/derived.js` pins them to one value.
- The icons are `app/public/icons/`: `icon.svg` is the source, and
  `tools/artwork/icons.mjs` rasterizes it into `icon-192.png`,
  `icon-512.png`, `maskable-512.png` and `apple-touch-icon.png` (180 px),
  committed like `card/*.svg` (`docs/artwork.md`, "Icons"). The drawing
  stays inside the maskable safe zone, a centered circle of radius 40% of
  the side, so the maskable icon is the same drawing. iOS reads the
  `apple-touch-icon` link in `app/index.html`, not the manifest, for the
  home-screen icon. The tab favicon is `icons/favicon.svg`, the same mark on
  a rounded dark tile, linked by every document that has an icon (the app,
  the site pages, the record pages, `404.html` and the old host); the header
  and both site share cards draw the same mark (`docs/artwork.md`, "Icons").
- `app/index.html` also carries a static
  `<meta name="apple-mobile-web-app-title" content="Лут DH">`: iOS takes the
  home-screen label from it; whether iOS Safari reads the manifest's
  `short_name` is not verified on a device. `tests/derived.js` pins it to the
  manifest's `short_name`.

`app/index.html` links the manifest with a static
`<link rel="manifest" href="./manifest.webmanifest">`, and
`tests/derived.js` requires exactly one. Vite keeps the href as written and
copies the manifest verbatim (measured 2026-09-25, Vite 8.2.2); the
script-added link it replaces is in `docs/DECISIONS.md` (2026-09-25). The
static pages carry the same static link at their depth
(below, "Static pages"); without it Chrome answers `no-manifest` on the
install guide (measured 2026-09-25, Chrome 152, on the published site).
Headless Chrome parses that manifest with no errors and finds
the page installable with no error, and also finds `pages/install.html`
and `pages/en/install.html` installable with the manifest at the app root
(`tests/app/states.js` case 28, through
CDP, in the browser's default context; an incognito context always answers
`in-incognito`). Not verified on a device: that the install prompt of
Android Chrome and of desktop Chrome appears, and that iOS Safari reads the
manifest link when "Add to Home Screen" runs. iOS Safari's "Add
to Home Screen" from a static page is not verified either: it may keep the
page's URL as the start page. On iOS the
`apple-touch-icon` and the `apple-mobile-web-app-title` tags cover the icon
and the label either way.

### The service worker

`app/public/sw.js`, hand-written plain JS, copied verbatim, outside the
bundle and the TypeScript project. `app/src/main.ts` registers it at every
boot through `PwaPort`, as `/sw.js` with the scope `/`, so a deep route path
(`/i/ci1`) registers the same worker at the host root. It
stays registered: it keeps the site an installable app, and it caches
pictures and hashed build files. It holds no offline shell (2026-09-24,
`docs/DECISIONS.md`).

| Request (path relative to the scope) | Policy |
|---|---|
| `img/thumb/` | Cache first in `dhloot-thumb-v1`, capped at 1500 entries, above the whole thumbnail set; the same revalidation on every hit as `img/`; a miss without a connection is answered with the cached `img/<x>.webp` from `dhloot-img-v1` when there is one, else it rejects and the app's `onerror` marks the picture broken and draws the kind glyph |
| `img/` except `img/thumb/` | Cache first in `dhloot-img-v1`, capped at 300 entries (the oldest goes first); a hit is answered from the cache at once and revalidated in the background: an ok answer with the cached `ETag` writes nothing, a different or absent `ETag` replaces the entry, a failed fetch keeps it; a miss is answered as soon as the network answers, and stored and trimmed in the background |
| `assets/` (the hashed build files) | Cache first in `dhloot-assets-v1`, never revalidated: a hashed name never changes its bytes. Capped at 60 entries by insertion order, so the files of old deploys, which nothing asks for again, leave as new ones arrive |
| Everything else: every navigation (the document, `en/`, `pages/`, `i/`), `data.js`, `sw.js`, the manifest, `icons/`, `card/`, `og/`, the other root files, another origin (Supabase, now and later), a URL whose query holds `auth-callback`, a path outside the scope, any method but `GET` | Not answered: the worker calls no `respondWith`, and the browser's own network answers |

- There is no offline shell, no document cache and no navigation preload.
  Without a connection the app does not open. Rejected: the offline shell
  of issue 69 (a stale document answered while a sign-in callback's `?code=`
  is in the URL is a class of Auth bug, and hashed names need a precache
  list kept in step with every build) and no caches at all (1272 pictures
  refetched on every visit past `max-age`).
- Rejected as well: a worker that unregisters itself. With no worker at all
  the install prompt is at risk; the owner needs installability.
- The worker has no version stamp: the document and `data.js` always come
  from the network, and a hashed name is immutable. The browser reinstalls
  the worker only when `sw.js` changes; the cache names carry a hand-bumped
  `v1` for the day their layout changes. The published `data.js` carries the
  record links' version map (`window.LOOT_V`), which an artwork refresh
  changes, so a reader downloads `data.js` again after such a deploy.
- Updates are silent: `skipWaiting()` on install; on activate, every
  `dhloot-*` cache that is not one of the three current names is deleted
  (the issue 69 worker's `dhloot-shell-v1` among them), navigation preload
  is disabled (the issue 69 worker enabled it, and the setting outlives that
  worker; a failure is ignored), then `clients.claim()`. There is no "update available" prompt.
- The installed app asks for persistent storage once per boot
  (`navigator.storage.persist()`, only when not yet persisted), so under
  storage pressure the browser keeps the caches and the lists; a browser
  tab keeps best-effort storage. Chrome grants an installed app without a
  prompt; other browsers are not measured here.
- Revalidation on every hit replaces a manual cache bump after an artwork
  refresh. The background fetch goes through the browser's HTTP cache.
  Cloudflare Pages sends `Cache-Control: public, max-age=0, must-revalidate`
  and an `ETag` (GitHub Pages sent `max-age=600`), so each view of a cached
  picture costs one conditional request, usually a 304, and a picture
  replaced at the same path shows from its second view (not measured on a
  device).
- Thumbnails and full pictures have separate caches. At 1500 the thumbnail
  cache holds every row picture of every table (about 2 KB each), so no
  table scroll evicts a row's own picture, and the 300 full pictures a GM
  opened stay out of its way; `tests/sw.test.mjs` fails when `img/thumb/`
  holds more files than the cap. The full-picture cache still keeps 300 by
  insertion order, so a tile view of a table longer than 300 evicts its own
  first tiles; they refetch.
- The asset cap of 60 holds several deploys of what one visit takes: the
  module, the stylesheet, a few lazy chunks and up to four files of the
  self-hosted UI face (the Latin and Cyrillic subsets, upright and italic).
  A build that splits into more files than the cap
  evicts its own oldest file, which is then fetched again; raise the cap
  with the split.
- The URL `sw.js` is stable: a registered worker keeps polling its own URL,
  so a rename or a deletion leaves every installed copy on the old worker.
  To retire it, ship a worker that unregisters itself at the same URL.

### The old host

Since the task `cloudflare-pages` (2026-10-28) the site's host is
`https://daggerheart-loot.pages.dev/`. GitHub Pages stays on as the old host
`https://artex-x.github.io/daggerheart-loot/`, and each deploy publishes a
mirror there: the site's files without `assets/`, `data.js`,
`pages/install.html` and `pages/en/install.html`, with two files replaced.

- `index.html` is `old-host/index.html`: `noindex`, the site card of
  `app/index.html`, and one script that forwards to the site's host with the
  fragment, to `<site>en/` when the old origin's `dhloot.lang.v1` is `en` (the
  language is the one preference that follows, `STATE.md`, "The site's
  origin"). The query is dropped: a stale sign-in callback's verifier is on
  the old origin. The script stores the time of its forward in the old
  origin's `sessionStorage` (`dhloot.moved.at`) and shows the bilingual text
  with the link instead of a second forward within 10 s, so two hosts that
  send a tab to each other stop at the second hop. In an installed app
  (`display-mode: standalone`) it shows the text and the link and does not
  forward: one tap opens the new host, and the reader installs again from
  there. Without a script, a `<noscript>` meta refresh opens the new root.
- `sw.js` is `old-host/sw.js`: on install `skipWaiting()`, on activate it
  deletes every `dhloot-*` cache and calls `registration.unregister()`; it
  has no fetch listener. The rejection above ("a worker that unregisters
  itself") still holds for the site's worker; the old host is exempt
  because nothing installs from it any more.
- The install guide is left out, so `404.html` answers it with its links to
  the site's host: it would guide a reader to install an origin that only
  forwards. The privacy and terms URLs that the Google console holds stay
  current, and the stubs, `en/`, the data files, `schema/`, `img/`, `og/`,
  `card/`, `robots.txt`, the manifest and `icons/` keep answering.
- A cached pre-move document on the old host fails to load its module, as a
  cached document fails after any deploy, and a reload forwards.

### Static pages

Pages outside the app - the install guide and the policy pages `privacy`
and `terms` - are plain static files, so each has a plain URL that works without
JavaScript and without a hash route (the route grammar is frozen,
`CONTRACTS.md` section 1).

- One page per language: `pages/<id>.html` is Russian and keeps the URL,
  `pages/en/<id>.html` is English (issue 64; the shape of `i/en/` and
  `en/`). No `pages/ru/`.
- Sources are two body fragments, `pages/src/<id>.html` (Russian) and
  `pages/src/en/<id>.html` (English): authored, tracked, content only - no
  `<section lang>` wrapper (the document's `<html lang>` carries the
  language) and no link back to the app but through `%APP%` (below). `tools/build-pages.js` throws
  when a page has no fragment in one of the languages.
- Outputs are written by `tools/build-pages.js` through
  `node tools/build.js`, gitignored like `i/`. The template adds the head
  (`noindex, nofollow`, section 1; a `description` and a text preview
  card - `og:type article`, `og:title`, `og:description`, `og:url`,
  `og:locale` with the other language as the alternate, `twitter:card
  summary` - from the `PAGES` entry's `title` and `desc` pairs, with no
  `og:image`: a page is a document, not the site; a `theme-color` from the
  manifest's `theme_color`; a `<link rel="manifest">`
  to the app's manifest, the `apple-touch-icon` link and an
  `apple-mobile-web-app-title` from the manifest's `short_name`, at the
  output's depth, `../` or `../../`), the style and
  `<main id="app-page">`, which holds the back link, a link to the copy in
  the other language, the fragment, and the back link again. So the
  browser installs the app from any static page; the manifest's
  `start_url` opens the app root.
- The template owns the back links and the language link because their
  depth and language differ: the Russian page links `en/<id>.html` and the
  app root `../`, the English one `../<id>.html` and the English app root
  `../../en/`. A relative link inside a fragment would resolve on one output
  only, so a fragment links the app only through `%APP%<route>`, which the
  template replaces with that page's app root (`%APP%account` opens
  `/account` or `/en/account`).
- The back link reads «Назад к генератору» on the Russian page and "Back
  to the generator" on the English one, with `data-back`. A small inline
  script calls `history.back()` instead when the referrer is a page of the
  app (same origin and not under `/pages/`, whatever its language: an English
  record is `/i/en/<id>`, outside `/en/`) and the tab has history, so the
  reader returns to the exact route with its scroll. A direct visit, a new tab, no
  JavaScript, or a referrer that is the other language's copy opens the app
  root. The script is the page's only one and stores nothing, so an English
  page does not store the language preference the way an English stub does
  (`docs/specs/I18N.md`).
- `pages/src/` is never published: `ci.yml` copies `pages/*.html` and
  `pages/en/*.html` only and refuses `_site/pages/src`. `vite.config.mts`
  junctions `pages/` into `dist/` with the artwork, so the built app
  serves both copies too.
- `.claude/hooks/edit-guard.mjs` blocks a direct write to `pages/*.html`
  and `pages/en/*.html`; `tests/derived.js` compares each output with a
  fresh render and checks its language, head, the theme color, the manifest
  link and the two iOS tags, sibling link, both back links and the script;
  `tools/check-site.mjs` probes all six outputs; `tests/app/states.js`
  case 28 asks Chrome whether both guides are installable; case 29 follows the install guide's top back link
  in both languages and checks the back links of the four policy outputs.
- The worker does not answer `pages/`: a page always comes from the
  network, and a page registers no worker: the manifest link alone makes it
  installable (measured 2026-09-25).
- The footer's nav row links them on every page (the install link is left
  out inside the installed app), and every link starts from
  `AppState.pagesDir` (`pages/en/` in English, `pages/` in Russian),
  so a reader lands on the copy of the language on screen (`FEATURES.md`,
  "Chrome").
- The policy pages exist because the Google OAuth console publishes an app
  only with a privacy policy link. Their URLs are frozen once submitted:
  `https://artex-x.github.io/daggerheart-loot/pages/privacy.html` and
  `.../pages/terms.html`, which the old host's mirror keeps current; the same
  pages answer on the site's host. `app/index.html`'s `<noscript>` block links both
  Russian pages too, so a reviewer without JavaScript finds them;
  `noindex, nofollow` stays on them. `privacy` names the operator `artex-x`
  and the contact `daggerheart.loot@gmail.com`, and describes the account
  service as it is, in general terms. It links the account page through
  `%APP%`, which `tools/build-pages.js` replaces with the page's own back
  link (`../` or `../../`) - the one way a fragment links an app route.
- A Telegram preview of a page stays cached for good (section 8); a text
  card with no picture and a rare text change do not justify a versioned
  link.

One more page, in order:

1. One `PAGES` entry in `tools/build-pages.js`: the id, the `title` pair
   and the `desc` pair.
2. Two fragments, `pages/src/<id>.html` (Russian) and
   `pages/src/en/<id>.html` (English): content only, no wrapper, no back
   link, and an app route only as `%APP%#/<route>`.
3. One footer link: a `dict.ts` key pair and one
   `<a href={app.pagesDir + '<id>.html'}>` in `Shell.svelte`'s nav.
4. `node tools/build.js`.
5. A page submitted to a verifier or a messenger joins `ci.yml`'s by-name
   list and `check-site.lib.mjs`'s probes, in both languages. A submitted
   URL is frozen; each language has its own, and the Russian page links the
   English one at its top.

The `derived` suite, the collect step and the edit guard already cover
every `pages/*.html` and `pages/en/*.html`.

### On iOS

- iOS has no install prompt: a site goes to the home screen only through
  Safari's Share sheet, "Add to Home Screen". An iOS home-screen web app
  keeps its own storage, separate from Safari's tabs, so lists saved in
  Safari do not show in the installed app; a share link opens a list
  across. These are platform facts, not measured here.
