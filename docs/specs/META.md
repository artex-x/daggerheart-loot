# Product meta policies

Standing decisions that look like bugs or oversights and are not. Do not "fix"
any of them without the owner saying so.

## 1. `noindex` on every page

`<meta name="robots" content="noindex, nofollow">` is in `app/index.html` -
the rewrite's entry document, which is what `dist/index.html` is built from -
and in every generated stub (`tools/build-share-pages.js`). This is a personal
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
  in the section, and the GM link doubles as the backup

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
`app/src/**/*.test.ts` is already English throughout.

## 7. The 404 fallback page (issues/phase-8, B4, owner override of R8's "skip it")

`404.html` is authored and tracked at the repository root (it carries no
data, so nothing generates it) and published by `.github/workflows/ci.yml`'s
collect step alongside `llms.txt`/`robots.txt`. GitHub Pages serves it
verbatim, with a 404 status, for any request under this site that does not
match a real path - a share link truncated by a chat client, a hand-typed
record id, a stub whose record a data change dropped
(`issues/phase-8/critique/resilience.md`, R8). Before this page existed,
every one of those landed on GitHub's own generic 404, with no route back to
the app in either language.

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
