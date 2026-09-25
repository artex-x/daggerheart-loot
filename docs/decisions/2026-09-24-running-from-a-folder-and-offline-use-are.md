# 2026-09-24 - Running from a folder and offline use are nice-to-haves

- Task: `persistent-storage`; worker revised in `persist-0-foundation`.
- Decision: direct `file://` execution ends (the IIFE build,
  `tools/smoke-file-url.mjs` and the from-a-folder address branch go;
  `base: './'` and the classic `data.js` stay) and offline use is retired.
  `sw.js` stays registered, for installability: cache first for same-origin
  `img/`, `img/thumb/` (issue 69's caps and revalidation) and hashed
  `assets/` (immutable, capped at 30); navigations, `data.js`, the manifest,
  `pages/`, other origins and an `auth-callback` URL pass to the network;
  activate deletes every other `dhloot-*` cache (`META.md` section 9).
- Rejected: the offline shell with Supabase bypass rules - a
  shell answered while `?code=` is in the URL is an Auth defect class, and
  hashed names need a precache list kept in step; a worker that unregisters
  itself - no worker puts the install prompt at risk; no caches - 1272
  pictures refetched past `max-age`; an absolute Pages base.
- Supersedes in part "A picture miss is answered before it is stored; an offline thumbnail miss takes the cached full picture" (2026-09-23).
- Supersedes "Navigations take the navigation preload response" (2026-09-23).
- Supersedes in part "PWA registration is a boot concern in `main.ts` behind `PwaPort`" (2026-09-23).
- Supersedes in part "The install link is drawn only where it can be used" (2026-09-23).
- Supersedes in part "The service worker is a hand-written `app/public/sw.js`" (2026-09-23).
- Supersedes "The shell is network first with a cache fallback; updates are silent" (2026-09-23).
- Supersedes in part "Thumbnails get their own worker cache, capped above the whole set" (2026-09-23).
