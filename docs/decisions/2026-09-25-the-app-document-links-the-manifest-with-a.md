# 2026-09-25 - The app document links the manifest with a static tag

- Task: `static-manifest-link` (owner request, 2026-09-25).
- Decision: `app/index.html` carries
  `<link rel="manifest" href="./manifest.webmanifest">`; `linkManifest()`
  and its call go, and `PwaPort.register()` only registers `./sw.js`. The
  script-added link existed for `file://`, retired on 2026-09-24. Vite
  8.2.2 keeps the href as written, with no hash and no warning (measured
  2026-09-25). The static pages' head gains `theme-color` from the
  manifest's `theme_color`.
- Rejected: keeping the script-added link - it serves no supported host,
  and Chrome answered `manifest-location-changed` when it arrived after
  `load`; both a static and a script-added link - two links, which
  `tests/derived.js` and case 28 refuse; an absolute
  `/daggerheart-loot/manifest.webmanifest` href - it breaks
  `vite preview` and the test server (`base: './'`).
