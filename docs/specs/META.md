# Product meta policies

Standing decisions that look like bugs or oversights and are not. Do not "fix"
any of them without the owner saying so.

## 1. `noindex` on every page

`<meta name="robots" content="noindex, nofollow">` is in `app/index.html` -
the rewrite's entry document, which is what `dist/index.html` is built from -
and in every generated stub (`tools/build-share-pages.js`) and static page
(`tools/build-pages.js`, section 9). This is a personal
tool and is meant to stay out of search results. Do not remove it to improve
SEO.

`tests/derived.js` asserts the tag on `app/index.html`, on the **source**
rather than on a build: `npm run check` does not build, so a check that read
`dist/index.html` would be reading whatever was built last. The same suite
reads that document's `<head>` (`headFacts`) and asserts it carries every field
the preview card needs - title, description, robots, colour scheme, viewport,
every `og:*` and `twitter:*`, and the icon. Before R0c (issue 47) this compared
`app/index.html`'s head against the now-deleted root `index.html`'s; that
second document is gone, so the check is a single-document read now. The
published page is checked again after a deploy by `tools/check-site.mjs`.

## 2. Crawling is allowed on purpose

`robots.txt` says `Allow: /`. Blocking crawlers would be worse, not better: a
crawler that is not allowed to fetch a page never reads the `noindex` on it, and
can still list the bare URL it found elsewhere. Letting it fetch and then telling
it `noindex` is what actually keeps the page out.

Link previews in messengers (Telegram, Discord, Slack) fetch the stub pages too,
so a blanket `Disallow` would break those as well.

Bulk collection for training is a separate matter and is refused by name:
`GPTBot`, `ClaudeBot`, `anthropic-ai`, `CCBot`, `Google-Extended`,
`Applebot-Extended`, `Bytespider`, `meta-externalagent`.

## 3. Lists live in the URL hash, never on a server

There is no backend and there will not be one. A shared list is the address. The
consequences are deliberate:

- no accounts, no sync, no way to revoke a link
- a link is as long as its contents, hence the checksum and the short form
- the person's own lists are in `localStorage` and can be lost; the app says so
  in the section, and **Your own link** (`shareGm`) doubles as the backup

Do not invent server-side list storage, an upload endpoint or a paste service.

## 4. `file://` must keep working

Opening `dist/index.html` from a folder works today, and it is a real property
for this audience: a GM at a table with no connection can use the tool from a
copy of the repo (`npm run build`, then open the built file - no server, no
network).

This constrains any future build:

- assets must be referenced relatively (`base: './'`, not an absolute Pages
  path). Relative paths work on a GitHub Pages project site too, so nothing is
  lost there.
- the entry point cannot be `<script type="module">` - Chrome blocks module
  loading over `file://`. A single classic (IIFE) bundle is the way.
- `fetch()` of a local file is blocked, so the dataset must keep arriving as a
  script that assigns a global (see `CONTRACTS.md` section 4).

The `<noscript>` links work under `file://` through the build, not by
rewriting them: `vite.config.mts`'s `closeBundle` copies `catalog.csv`,
`data.json` and `llms.txt` into `dist/`, and `tools/smoke-file-url.mjs`
asserts every `noscript a[href]` resolves to a real file under `dist/`;
`app/index.html` itself stays untouched, so `dist/index.html` and every
golden stay byte-identical. Rejected: absolute Pages URLs for those links
(would break the no-server, no-network property this section states).

The main landmark's id moved from `view` to `main`, alongside the skip link,
after checking `#view` appears in no spec, fixture, or route grammar
(`CONTRACTS.md` names routes, ids, links, and asset paths, never a DOM id);
`tabindex="-1"` was preserved on the move. Other shape differences from the
deleted live app, carried deliberately: the skip-link text itself, the pair
of controls now marked `type="button"`, and the selection bar being absent
from the DOM when empty rather than present with a `hidden` attribute.

First load, measured live 2026-09-17, enforced by nothing
(`bundle-budget.mjs` excludes `data.js`): `index.html` 2,120 B gzip +
`assets/app.js` 92,033 B + `data.js` 148,860 B = 243,013 B gzip, ~973 kB to
parse; `data.js` re-eval 32.1 ms in Node (a mid-range phone 4-6x that);
`buildIndex`'s `byId` pass 1.27 ms. The number to quote at any proposal to
grow `data.js`.

The refactor plan (issue #47, Phase 1 item 6) asks for
`base: '/daggerheart-loot/'`. That contradicts this policy, and this policy
wins; the plan's own opening constraints list `file://` among the strengths to
preserve. Recorded here so the contradiction is not rediscovered.

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
collect step alongside `llms.txt`/`robots.txt`. GitHub Pages serves it
verbatim, with a 404 status, for any request under this site that does not
match a real path - a share link truncated by a chat client, a hand-typed
record id, a stub whose record a data change dropped. Before this page
existed, every one of those landed on GitHub's own generic 404, with no
route back to the app in either language (verified live on `i/zzzz.html`
before this page shipped).

It carries `noindex, nofollow` like every other page (section 1) and both
languages on the one page at once (`docs/specs/I18N.md`) rather than
switching on a stored preference, since there is no script here to read one.
Its two links are root-anchored (`/daggerheart-loot/#/roll/std` and
`/daggerheart-loot/#/search`) rather than relative, unlike every other page
in this repository: it can be served while the browser still shows an
arbitrary, possibly nested bad path, and a relative link would resolve
against that path's own directory, not against this file's real location.
It is never opened over `file://` - nothing links to it locally, it exists
only as a Pages serving fallback - so section 4's relative-path rule does
not apply to it. `tools/check-site.lib.mjs`'s `checks()` proves the
fallback on every deploy, against the local `_site/` build before
publishing and against the live URL after
(`tools/check-site.mjs --dir _site` / `tools/check-site.mjs <url>`).

## 8. Link previews are cached by Telegram until pushed

Telegram keys a link's unfurl preview on the URL, with no TTL, and ignores
everything the origin serves - a changed `Cache-Control`, a changed
`og:image` byte, a redeploy. Rewriting `og/<id>.jpg` bytes under an unchanged
URL (an artwork refresh, for instance) therefore needs a refresh pushed to
`@WebpageBot`, or every messenger preview of that record stays on the old
picture indefinitely. Nothing at the app level can fix this; see
`docs/tg-preview.md` for the tool that does it and why the fix has to be
pushed rather than served. A plain send to `@WebpageBot` only refreshes the
page's title and description and keeps the cached picture when `og:image`
still points at the same URL - this site's exact case; only the bot's
"Update with content" button re-downloads the image. `@WebpageBot` also
throttles update attempts per user, independently of Telegram's flood
control, and refuses further attempts of either kind - presses and sends -
with "Sorry, too many attempts. Please try again in `<N>` seconds."

## 9. Installable app (PWA)

The published site installs as an app on Android and desktop Chrome and on
iOS, and opens with no connection after one online visit. Under `file://`
it stays the same folder app as before (section 4): nothing below loads
there.

### The manifest and the icons

`app/public/manifest.webmanifest`, copied verbatim into `dist/` by Vite's
`publicDir`:

- One language, Russian, like the share stubs (`docs/specs/I18N.md`);
  `name` equals `og:site_name`. `short_name` is "Лут DH": Android launchers
  truncate past about 12 characters, and "Лут Daggerheart" is 15.
- `id`, `start_url` and `scope` are `./`, relative to the manifest, so they
  resolve to `/daggerheart-loot/` on Pages. An absolute base changes
  nothing here.
- `theme_color`, `background_color` and the head's `theme-color` are all
  `--bg` from `tokens.css`; `tests/derived.js` pins the four to one value.
- The icons are `app/public/icons/`: `icon.svg` is the source, and
  `tools/artwork/icons.mjs` rasterises it into `icon-192.png`,
  `icon-512.png`, `maskable-512.png` and `apple-touch-icon.png` (180 px),
  committed like `card/*.svg` (`docs/artwork.md`, "Icons"). The drawing
  stays inside the maskable safe zone, a centred circle of radius 40% of
  the side, so the maskable icon is the same drawing. iOS reads the
  `apple-touch-icon` link in `app/index.html`, not the manifest, for the
  home-screen icon. The tab favicon is unchanged.
- `app/index.html` also carries a static
  `<meta name="apple-mobile-web-app-title" content="Лут DH">`: iOS takes the
  home-screen label from it when it does not read the script-added manifest
  link below. `tests/derived.js` pins it to the manifest's `short_name`.

The `<link rel="manifest">` is not a static tag in `app/index.html`. Chrome
fetches it from a folder too and refuses it with a CORS error and a failed
request (measured 2026-09-23, `tools/smoke-file-url.mjs`). The PWA port
(`app/src/ports/pwa.ts`) appends the tag at boot, only over `http:` or
`https:`. Headless Chrome parses that manifest with no errors and finds
the page installable with no error (`tests/app/states.js` case 28, through
CDP, in the browser's default context; an incognito context always answers
`in-incognito`). Not verified on a device: that the install prompt of
Android Chrome and of desktop Chrome appears with a manifest link added by
a script, and that iOS
Safari reads such a link when "Add to Home Screen" runs; on iOS the
`apple-touch-icon` and the `apple-mobile-web-app-title` tags cover the icon
and the label either way.

### The service worker

`app/public/sw.js`, hand-written plain JS, copied verbatim, outside the
bundle and the TypeScript project. `app/src/main.ts` registers it once at
boot through `PwaPort`, as `./sw.js`, so its scope is the site folder.

| Request (path relative to the scope) | Policy |
|---|---|
| `./`, `assets/app.js`, `data.js`, `manifest.webmanifest`, the three manifest icons, `img/_none.webp`, `img/thumb/_none.webp` | Precached into `dhloot-shell-v1` on install |
| `img/thumb/` | Cache first in `dhloot-thumb-v1`, capped at 1500 entries, above the whole thumbnail set; the same revalidation on every hit; an offline miss is answered with the cached `img/<x>.webp` from `dhloot-img-v1` when there is one, else it rejects as for `img/`, and the app's `onerror` swaps in `img/thumb/_none.webp`, answered from the shell cache's precached copy |
| `img/` except `img/thumb/` | Cache first in `dhloot-img-v1`, capped at 300 entries (the oldest goes first); a hit is answered from the cache at once and revalidated in the background: an ok answer with the cached `ETag` writes nothing, a different or absent `ETag` replaces the entry, a failed fetch keeps it; a miss is answered as soon as the network answers, and stored and trimmed in the background; an offline miss rejects, the app's `onerror` then swaps in `img/_none.webp`, which is answered from the shell cache's precached copy |
| `og/`, `i/`, `data.json`, `catalog.csv`, `llms.txt`, `robots.txt`, `404.html`, another origin, a path outside the scope, any method but `GET` | Not handled: the browser's own network, so the stubs, the previews and the 404 fallback (section 7) behave as before |
| Everything else (the shell, `card/`, `icons/`, `pages/`) | Network first with a 5 s timeout, a navigation taking the navigation preload response where the browser has it (enabled on activate), stored on every successful answer under its URL without the query (`?fbclid=...` adds no entry); the cached copy when the network fails; a navigation to the scope root or `index.html` falls back to the cached `./` |

- Every hash route is the one document, so the cached `./` answers every
  list link, section, record page and print sheet offline.
- Network first is why there is no version stamp: each successful online
  load refreshes the shell entries, so a deploy shows on the next online
  load. The browser reinstalls the worker only when `sw.js` changes; the
  cache names carry a hand-bumped `v1` for the day their layout changes.
- Updates are silent: `skipWaiting()` on install, `clients.claim()` on
  activate. That is safe because the app is one IIFE plus `data.js`, both
  loaded at start, so an open page never lazy-loads a chunk from a newer
  build. There is no "update available" prompt.
- The installed app asks for persistent storage once per boot
  (`navigator.storage.persist()`, only when not yet persisted), so under
  storage pressure the browser keeps the caches and the lists; a browser
  tab keeps best-effort storage. Chrome grants an installed app without a
  prompt; other browsers are not measured here.
- Revalidation on every hit replaces a manual cache bump after an artwork
  refresh. The background fetch goes through the browser's HTTP cache
  (Pages sends `max-age=600` and an `ETag`), so a picture replaced at the
  same path shows from the second view after that entry expires, at most
  about ten minutes after the deploy. Online, a view past the `max-age`
  costs one conditional request, usually a 304 (not measured on a device).
- Each shell entry is refreshed on its own. On a slow link one load can
  pair a fresh `assets/app.js` with a timed-out cached `data.js`, or the
  reverse, until the next online load; that is comparable to the ten-minute
  `max-age` Pages already sends, under which the two files can also come
  from two deploys.
- `card/*.svg` is cached on first use, not precached, so an offline print
  needs one earlier online print.
- Thumbnails and full pictures have separate caches. At 1500 the thumbnail
  cache holds every row picture of every table (about 2 KB each), so no
  table scroll evicts a row's own picture, and the 300 full pictures a GM
  opened stay out of its way; `tests/sw.test.mjs` fails when `img/thumb/`
  holds more files than the cap. The full-picture cache still keeps 300 by
  insertion order, so a tile view of a table longer than 300 evicts its own
  first tiles; they refetch online and show the placeholder offline.
- The URL `sw.js` is stable: a registered worker keeps polling its own URL,
  so a rename or a deletion leaves every installed copy on the old worker.
  To retire it, ship a worker that unregisters itself at the same URL.

When Phase 0 of the persistence design lands (hashed chunks, a versioned
catalog snapshot, no `file://`), `sw.js` gains one rule - `assets/` and
`catalog/` become cache first with no age check - and its precache list
names the entry document only. The port, the manifest and the
registration call do not change.

### Static pages

Pages outside the app - today the install guide, later the policy pages -
are plain static files, so each has a plain URL that works without
JavaScript and without a hash route (the route grammar is frozen,
`CONTRACTS.md` section 1).

- Sources are `pages/src/<id>.html`: authored, tracked, a body fragment
  with a `<section lang="ru">`, an `<hr />` and a `<section lang="en">`.
  Outputs are `pages/<id>.html`, written by `tools/build-pages.js` through
  `node tools/build.js`, gitignored like `i/`. The template adds the head
  (`noindex, nofollow`, section 1), the style, `<main id="app-page">` and
  a back link at its top and its bottom.
- Both languages sit on one page, Russian first, like `404.html`: no
  script reads the language preference there.
- Links are relative (`../` is the app), unlike `404.html` (section 7): a
  page here is always served at its own path.
- The back link reads «Назад к генератору / Back to the generator»,
  `href="../"`. A small inline script calls `history.back()` instead when
  the referrer is the app document (same origin, the scope root or
  `index.html`) and the tab has history, so the reader returns to the
  exact hash route; a direct visit, a new tab or no JavaScript opens `../`.
- `pages/src/` is never published: `ci.yml` copies `pages/*.html` only
  and refuses `_site/pages/src`. `vite.config.mts` junctions `pages/`
  into `dist/` with the artwork, so the built app serves the pages too.
- `.claude/hooks/edit-guard.mjs` blocks a direct write to `pages/*.html`;
  `tests/derived.js` compares each output with a fresh render, and
  `tools/check-site.mjs` probes `pages/install.html`.
- The worker treats `pages/` as shell: a page read once online is readable
  offline; a page never opened shows the browser's own offline page,
  because only the scope root and `index.html` fall back to the cached
  `./`. The pages are not precached: the install guide is read before
  installing, which happens online.
- The footer's nav row links them, drawn only where its link can be used
  (`FEATURES.md`, "Chrome").

One more page is: one `PAGES` entry in `tools/build-pages.js` (the id and
the two titles), one source `pages/src/<id>.html`, and one footer link (a
`dict.ts` key pair and one `<a>` in `Shell.svelte`'s nav). The nav's
`{#if app.showInstall}` guard covers the install link only, but today it
wraps the whole `<nav>`: with a second link, move the guard onto the install
`<a>`, or the installed app and a folder hide the new link too.

### From a folder, and on iOS

- `file://`: the port tests the protocol before it touches
  `navigator.serviceWorker` or the head, so from a folder no worker
  registers and no manifest link exists. `tools/smoke-file-url.mjs`
  asserts no failed request, no console error and no controlling worker.
- iOS has no install prompt: a site goes to the home screen only through
  Safari's Share sheet, "Add to Home Screen". An iOS home-screen web app
  keeps its own storage, separate from Safari's tabs, so lists saved in
  Safari do not show in the installed app; a list link carries a list
  across, and the app opens offline only after its first launch online.
  These are platform facts, not measured here.
