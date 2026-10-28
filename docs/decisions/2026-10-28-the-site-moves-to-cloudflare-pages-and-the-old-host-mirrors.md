# 2026-10-28 - The site moves to Cloudflare Pages and the old host mirrors its files

- Superseded in part by "Addresses are paths, with the language prefix and `?v` in the bar" (2026-10-28): a card path answers the app document, not a page that redirects to the app.
- Task: `cloudflare-pages` (owner, 2026-10-22 and 2026-10-28; the planner's recommended options while the owner was AFK, `CF1`).
- Decision: the Pages project `daggerheart-loot` serves the app at `https://daggerheart-loot.pages.dev/`; Functions answer only the card
  families of `preview/public/_routes.json`; every other path is a static file or `404.html`; `_headers` sends `X-Robots-Tag: noindex` on the
  text files. A record link is `<site>i/<id>?v=<v>` (`i/en/` in English), `<v>` from a build-time map of each record's card text and picture
  bytes that the build appends to `data.js` as `window.LOOT_V`. The Telegram preview refresher is gone. GitHub Pages stays on as the old host:
  each deploy publishes every frozen path there, with the entry document replaced by a page that forwards the fragment and `sw.js` by a worker
  that unregisters. Schema `$id`s keep the old host's URL; Supabase keeps the old callback for a revert. Homes: `docs/specs/CONTRACTS.md`
  section 5, `docs/specs/META.md` sections 8 and 9, `.claude/README.md`, "Preview host". `catalog.csv`'s `url` is `<site>i/<id>` with no `?v` (owner, 2026-10-28: a data table, not a messenger link; a `?v` would rewrite the committed file on each artwork refresh).
- Rejected: a frozen last copy of the old host (a later privacy text never reaches the Google URL); the full app on both hosts (two origins with
  separate storage and sessions); new schema `$id`s (every export and fixture changes for no reader); the refresher kept (owner); `<v>` in the
  bundle, in a separate script, in `data.js`'s source, or from the record text only; every path through the worker; `.html` record links.
- Accepted trade-off: signed-out readers lose the home pin and display defaults and everyone signs in once more; a link shared before a change keeps its old card; an installed old-origin app shows the forwarding text until reinstalled.
- Supersedes in part "Link previews come from a stateless worker" (2026-10-14): the rejection of moving the app to Cloudflare Pages, and catalog records keeping `i/<id>.html`.
- Supersedes in part "Per-language previews: `i/en/<id>.html` and `en/`, seeded into the refresher's state; site cards rendered from one template; a static page is a page per language" (2026-09-23): the refresher's state.
