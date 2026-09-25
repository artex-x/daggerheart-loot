# 2026-09-23 - Site pages are generated static files under `pages/`, linked from a footer nav row

- Superseded in part by "Per-language previews: `i/en/<id>.html` and `en/`, seeded into the refresher's state; site cards rendered from one template; a static page is a page per language" (2026-09-23): one page per language, `pages/en/<id>.html`.
- Task: `69`; on 2026-09-23 the owner chose generated static pages linked
  from a footer row.
- Decision: `tools/build-pages.js` renders `pages/src/<id>.html` into
  `pages/<id>.html` from one template (both languages, `noindex`, relative
  links); `ci.yml` publishes the outputs only. `Shell.svelte`'s footer gains
  a nav row above the licence line; the install guide is its first link,
  and the persistence work's policy pages follow the same recipe
  (`docs/specs/META.md` section 9, "Static pages").
- Rejected: hash routes - the route grammar is frozen, and a hash has no
  plain URL for a verifier or a messenger; a hand-authored file per page -
  the owner asked for a shell the policy pages drop into; an About route; a
  menu - none exists, and the tab bar switches sections.
