# 2026-09-25 - A static page links the manifest in its head and registers no worker

- Task: `install-from-guide`; the owner reported that the guide page
  cannot install the app.
- Decision: `tools/build-pages.js`'s head links `manifest.webmanifest`,
  `icons/apple-touch-icon.png` and the manifest's `short_name` as
  `apple-mobile-web-app-title`, at the page's depth, as static tags.
  Chrome answered `no-manifest` on the guide and found it installable
  with the link alone, worker or not (measured 2026-09-25, Chrome 152).
- Rejected: registering the worker from a page - installability does not
  need it, and it adds a second script; a script-added link like the
  app's then - that existed for `file://`, which is retired; an in-page
  install button over `beforeinstallprompt` - Chromium only, a second
  script, and the browser's own install item works now.
