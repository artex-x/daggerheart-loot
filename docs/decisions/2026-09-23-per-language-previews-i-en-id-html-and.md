# 2026-09-23 - Per-language previews: `i/en/<id>.html` and `en/`, seeded into the refresher's state; site cards rendered from one template; a static page is a page per language

- Task: `64`; the owner settled `i/en/<id>.html`, the seed-when-absent rule,
  the English root, two re-rendered cards and one copy per static page.
- Decision: `i/<id>.html` and the root stay Russian and frozen; `i/en/<id>.html`
  and `en/index.html` (`<site>en/`) are English redirect pages from one
  generator, which store `dhloot.lang.v1=en` only when it is absent. The
  new URLs enter `tools/tg-preview/state.json` by `--adopt`, never pushed.
  `tools/artwork/cards.mjs` renders both site cards with a shipped Inter.
  `pages/<id>.html` is Russian, `pages/en/<id>.html` English. DEBT D38 paid.
- Rejected: `i/<id>.en.html`, `en/i/<id>.html`, `i/ru/`, `pages/ru/`; the
  language in the hash; the app served from `en/`; a meta refresh on `en/`;
  a hand-built state; a host font; one two-language page for `pages/`; a
  per-path 404; `hreflang` on the stubs; a `url_en` column.
- Evidence: an English link unfurled in Russian; the Telegram fingerprint
  reads only the `og:` title, description and picture; `og/_share.jpg` had
  Russian lettering and no generator (`7fd046c`); a submitted URL freezes.
- Supersedes in part "A site page links back to the screen the reader came from" (2026-09-23).
- Supersedes in part "Site pages are generated static files under `pages/`, linked from a footer nav row" (2026-09-23).
