# Product meta policies

Standing decisions that look like bugs or oversights and are not. Do not "fix"
any of them without the owner saying so.

## 1. `noindex` on every page

`<meta name="robots" content="noindex, nofollow">` is in `index.html` and in
every generated stub (`tools/build-share-pages.js`). This is a personal tool and
is meant to stay out of search results. Do not remove it to improve SEO.

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

Opening `index.html` from a folder works today, and it is a real property for
this audience: a GM at a table with no connection can use the tool from a copy
of the repo.

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

Interface text and test messages are Russian. English only in code comments and
in the machine-facing files (`llms.txt`, `docs/`, `CLAUDE.md`) - models read
those, and it is cheaper that way.
