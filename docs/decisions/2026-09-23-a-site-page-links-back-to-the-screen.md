# 2026-09-23 - A site page links back to the screen the reader came from

- Superseded in part by "Per-language previews: `i/en/<id>.html` and `en/`, seeded into the refresher's state; site cards rendered from one template; a static page is a page per language" (2026-09-23): each page's link carries its own language, and the script
  takes the app root from the link's own href.
- Task: `69`, follow-up; the owner chose it on 2026-09-23.
- Decision: the `tools/build-pages.js` template draws «Назад к
  генератору / Back to the generator» at the top and the bottom of
  every site page, `href="../"`; an inline script calls
  `history.back()` instead when the referrer is the app document and
  the tab has history (`docs/specs/META.md` section 9, "Static pages").
- Rejected: `../` alone - it opens the default section, not the one
  the reader left; the route in the page URL
  (`pages/install.html?from=...`) - app code writes it and a page URL
  carries state; a link at the end of each language section - on a
  phone the reader scrolls the whole page to reach it.
