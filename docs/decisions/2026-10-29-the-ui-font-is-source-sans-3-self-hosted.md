# 2026-10-29 - The UI font is Source Sans 3, self-hosted from the build's own origin

- Task: `57` (the owner, 2026-10-23: the font study and direction R; the
  package and the share card faces confirmed 2026-10-29).
- Decision: `--ui` is `'Source Sans 3 Variable'` from
  `@fontsource-variable/source-sans-3` (pinned exactly), imported in
  `main.ts` and served from `/assets/`; the print card keeps the old local
  stack as `--print-ui` until the print batch decides its face. The site
  share cards take the static Source Sans 3 faces of the Adobe release
  3.052R in `tools/artwork/fonts/` (`docs/artwork.md`). DESIGN.md, "The
  Local Font Rule".
- Rejected: PT Sans (no `tnum`, so stat numbers need mono again); Golos Text
  (not verified: no local file to check); Inter, Open Sans, Roboto and Lato
  (the detector flags them as overused); a font service (a third-party
  request on every page); local font names only (the glyphs depend on the
  machine, as before).
- Supersedes in part "Per-language previews: `i/en/<id>.html` and `en/`, seeded into the refresher's state; site cards rendered from one template; a static page is a page per language" (2026-09-23): the site cards' face.
