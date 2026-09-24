# Product meta policies

Standing decisions that look like bugs or oversights and are not. Do not "fix"
any of them without the owner saying so.

## 1. `noindex` on every page

`<meta name="robots" content="noindex, nofollow">` is in `app/index.html` -
the rewrite's entry document, which is what `dist/index.html` is built from -
and in every generated page: the stubs in `i/` and `i/en/` and the English
entry document `en/index.html` (`tools/build-share-pages.js`), and the
static pages in `pages/` and `pages/en/` (`tools/build-pages.js`,
section 9). This is a personal
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
English entry document `en/index.html` gets the same read, less the two PWA
tags (it is a redirect page, never the installed app's document). The
published pages are checked again after a deploy by `tools/check-site.mjs`.

## 2. Crawling is allowed on purpose

`robots.txt` says `Allow: /`. Blocking crawlers would be worse, not better: a
crawler that is not allowed to fetch a page never reads the `noindex` on it, and
can still list the bare URL it found elsewhere. Letting it fetch and then telling
it `noindex` is what actually keeps the page out.

Link previews in messengers (Telegram, Discord, Slack) fetch the stub pages too,
so a blanket `Disallow` would break those as well.

A preview card has one language. `app/index.html` (the site root, and so
every `#/...` link, since the fragment never reaches a crawler) and
`i/<id>.html` carry the Russian card; `en/index.html`, published at
`<site>en/`, and `i/en/<id>.html` carry the English one, with its own
picture `og/_share_en.jpg` for the root (`docs/specs/I18N.md`).

Bulk collection for training is a separate matter and is refused by name:
`GPTBot`, `ClaudeBot`, `anthropic-ai`, `CCBot`, `Google-Extended`,
`Applebot-Extended`, `Bytespider`, `meta-externalagent`.

## 3. Lists live in the URL hash and in the browser, until cloud lists ship

The no-backend law was superseded on 2026-09-24 (`docs/DECISIONS.md`). A
Supabase backend (Auth and Postgres, EU West) is the one server the site
will use: for accounts, cloud lists and homebrew, each shipped in its own
release. Sign-in (Google or Discord) and `#/account` exist in a build
configured with the two `VITE_SUPABASE_*` values, and an account holds no
list yet. Until the cloud lists ship, a shared list is its address, and the
consequences stay deliberate:

- a `#/l/` link cannot be revoked, and it stays readable after accounts ship
  (its decoder retires only at the legacy write cutoff)
- a link is as long as its contents, hence the checksum and the short form
- the person's own lists are in `localStorage` and can be lost; the app says so
  in the section, and **Your own link** (`shareGm`) doubles as the backup

Add no server beside the Supabase backend: no upload endpoint and no paste
service.

## 4. HTTP only; `file://` retired

Superseded 2026-09-24 (`docs/DECISIONS.md`, "Running from a folder and
offline use are nice-to-haves"). Until then the built app opened from a
folder, which forced one classic IIFE bundle and a `defer` entry tag. Since
2026-09-24 the build serves over HTTP only: `dist/index.html` loads one ES
module entry with a hashed name under `assets/`, and a copy opened from a
folder does not start, because Chrome blocks modules over `file://`.

What stays:

- `base: './'`: relative paths serve from Pages, `vite preview` and the
  test server at any path. The `base: '/daggerheart-loot/'` of the issue
  47 plan stays rejected.
- `data.js` stays a classic script that assigns `window.LOOT` before the
  module runs (`CONTRACTS.md` section 4).
- The `<noscript>` links resolve through the build: `vite.config.mts`'s
  `closeBundle` copies `catalog.csv`, `data.json` and `llms.txt` into
  `dist/`, and `tools/smoke-http.mjs` asserts every `noscript a[href]`
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
grow `data.js`.

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
The English half sits in a `<div lang="en">`. There is no per-language 404
(issue 64): Pages serves one `404.html` for every miss, whatever the path,
so a variant could only be a script that picks a language from the path
(`/en/` or `/i/en/`). That was rejected: the page is script-free by design,
a dead end reads at a glance in either language, and its value is having no
logic that can fail.
Its two links are root-anchored (`/daggerheart-loot/#/roll/std` and
`/daggerheart-loot/#/search`) rather than relative, unlike every other page
in this repository: it can be served while the browser still shows an
arbitrary, possibly nested bad path, and a relative link would resolve
against that path's own directory, not against this file's real location.
It exists only as a Pages serving fallback, so section 4's relative-base
rule does not apply to it. `tools/check-site.lib.mjs`'s `checks()` proves the
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

The English URLs (`i/en/<id>.html`, `<site>en/`) entered the refresher's
state with `run.mjs --adopt` at issue 64 and were never pushed: Telegram had
no preview of them to correct. From then on a change to their `og:*` text or
picture is stale by the normal rule and pushed. `--adopt` refuses the
Russian root and the Russian stubs.

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

The `<link rel="manifest">` is not a static tag in `app/index.html`: the
PWA port (`app/src/ports/pwa.ts`) appends it once at boot, and
`tests/derived.js` refuses a second, static one. (It became a script-added
tag because Chrome refused it from a folder, measured 2026-09-23.)
Headless Chrome parses that manifest with no errors and finds
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
bundle and the TypeScript project. `app/src/main.ts` registers it at every
boot through `PwaPort`, as `./sw.js`, so its scope is the site folder. It
stays registered: it keeps the site an installable app, and it caches
pictures and hashed build files. It holds no offline shell (2026-09-24,
`docs/DECISIONS.md`).

| Request (path relative to the scope) | Policy |
|---|---|
| `img/thumb/` | Cache first in `dhloot-thumb-v1`, capped at 1500 entries, above the whole thumbnail set; the same revalidation on every hit as `img/`; a miss without a connection is answered with the cached `img/<x>.webp` from `dhloot-img-v1` when there is one, else it rejects and the app's `onerror` swaps in `img/thumb/_none.webp` |
| `img/` except `img/thumb/` | Cache first in `dhloot-img-v1`, capped at 300 entries (the oldest goes first); a hit is answered from the cache at once and revalidated in the background: an ok answer with the cached `ETag` writes nothing, a different or absent `ETag` replaces the entry, a failed fetch keeps it; a miss is answered as soon as the network answers, and stored and trimmed in the background |
| `assets/` (the hashed build files) | Cache first in `dhloot-assets-v1`, never revalidated: a hashed name never changes its bytes. Capped at 30 entries by insertion order, so the files of old deploys, which nothing asks for again, leave as new ones arrive |
| Everything else: every navigation (the document, `en/`, `pages/`, `i/`), `data.js`, `sw.js`, the manifest, `icons/`, `card/`, `og/`, the other root files, another origin (Supabase, now and later), a URL whose query holds `auth-callback`, a path outside the scope, any method but `GET` | Not answered: the worker calls no `respondWith`, and the browser's own network answers |

- There is no offline shell, no document cache and no navigation preload.
  Without a connection the app does not open. Rejected: the offline shell
  of issue 69 (a stale document answered while a sign-in callback's `?code=`
  is in the URL is a class of Auth bug, and hashed names need a precache
  list kept in step with every build) and no caches at all (1272 pictures
  refetched on every visit past `max-age`).
- Rejected as well: a worker that unregisters itself. With no worker at all
  the install prompt is at risk; the owner needs installability.
- There is no version stamp: the document and `data.js` always come from
  the network, and a hashed name is immutable. The browser reinstalls the
  worker only when `sw.js` changes; the cache names carry a hand-bumped
  `v1` for the day their layout changes.
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
  refresh. The background fetch goes through the browser's HTTP cache
  (Pages sends `max-age=600` and an `ETag`), so a picture replaced at the
  same path shows from the second view after that entry expires, at most
  about ten minutes after the deploy. Online, a view past the `max-age`
  costs one conditional request, usually a 304 (not measured on a device).
- Thumbnails and full pictures have separate caches. At 1500 the thumbnail
  cache holds every row picture of every table (about 2 KB each), so no
  table scroll evicts a row's own picture, and the 300 full pictures a GM
  opened stay out of its way; `tests/sw.test.mjs` fails when `img/thumb/`
  holds more files than the cap. The full-picture cache still keeps 300 by
  insertion order, so a tile view of a table longer than 300 evicts its own
  first tiles; they refetch.
- The asset cap of 30 holds several deploys of today's two files (one
  module, one stylesheet). A build that splits into more files than the cap
  evicts its own oldest file, which is then fetched again; raise the cap
  with the split.
- The URL `sw.js` is stable: a registered worker keeps polling its own URL,
  so a rename or a deletion leaves every installed copy on the old worker.
  To retire it, ship a worker that unregisters itself at the same URL.

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
  `og:image`: a page is a document, not the site), the style and
  `<main id="app-page">`, which holds the back link, a link to the copy in
  the other language, the fragment, and the back link again.
- The template owns the back links and the language link because their
  depth differs: the Russian page links `en/<id>.html` and `../`, the
  English one `../<id>.html` and `../../`. A relative link inside a
  fragment would resolve on one output only, so a fragment links the app
  only through `%APP%`, which the template replaces with that page's own
  back link.
- The back link reads «Назад к генератору» on the Russian page and "Back
  to the generator" on the English one, with `data-back`. A small inline
  script calls `history.back()` instead when the referrer is the app
  document (same origin; below the app root that the link's own `href`
  names, the path is empty or `index.html`) and the tab has history, so
  the reader returns to the exact hash route. A direct visit, a new tab, no
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
  fresh render and checks its language, head, sibling link, both back links
  and the script; `tools/check-site.mjs` probes all six outputs;
  `tests/app/states.js` case 29 follows the install guide's top back link
  in both languages and checks the back links of the four policy outputs.
- The worker does not answer `pages/`: a page always comes from the
  network.
- The footer's nav row links them on every page (the install link is left
  out inside the installed app), and every link starts from
  `AppState.pagesDir` (`pages/en/` in English, `pages/` in Russian),
  so a reader lands on the copy of the language on screen (`FEATURES.md`,
  "Chrome").
- The policy pages exist because the Google OAuth console publishes an app
  only with a privacy policy link. Their URLs are frozen once submitted:
  `https://artex-x.github.io/daggerheart-loot/pages/privacy.html` and
  `.../pages/terms.html`. `app/index.html`'s `<noscript>` block links both
  Russian pages too, so a reviewer without JavaScript finds them;
  `noindex, nofollow` stays on them. `privacy` names the operator `artex-x`
  and the contact `daggerheart.loot@gmail.com`, and describes the account
  service as it is, in general terms. It links the account page through
  `%APP%`, which `tools/build-pages.js` replaces with the page's own back
  link (`../` or `../../`) - the one way a fragment links an app route.
- The pages stay outside `tools/tg-preview`'s manifest: a Telegram preview
  of one stays cached until a hand push (section 8), which a text card with
  no picture and a rare text change does not justify.

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
  Safari do not show in the installed app; a list link carries a list
  across. These are platform facts, not measured here.
