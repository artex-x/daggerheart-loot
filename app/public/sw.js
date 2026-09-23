/* The service worker: an offline shell and two capped picture caches.
 *
 * Plain JS copied verbatim into dist/, outside the bundle and the TypeScript
 * project. The policy, the silent update and the reason there is no version
 * stamp: docs/specs/META.md section 9. tests/sw.test.mjs and
 * tools/check-site.lib.mjs read the cache names. */

const SHELL = 'dhloot-shell-v1';
const IMAGES = 'dhloot-img-v1';
const IMAGE_CAP = 300;
/* Above the whole thumbnail set (about 2 KB each), so a table scroll never
   evicts a row's own picture; tests/sw.test.mjs fails when img/thumb/ outgrows it. */
const THUMBS = 'dhloot-thumb-v1';
const THUMB_CAP = 1500;
const KEEP = [SHELL, IMAGES, THUMBS];
const IMAGE_MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const NETWORK_MS = 5000;
const PRECACHE = [
  './',
  'assets/app.js',
  'data.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'img/_none.webp',
  'img/thumb/_none.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('dhloot-') && !KEEP.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* 'pass' | 'image' | 'thumb' | 'shell', from the path relative to the scope. */
function policy(url) {
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return 'pass';
  const rel = url.pathname.slice(scope.pathname.length);
  if (/^(og|i)\//.test(rel)) return 'pass';
  if (/^(data\.json|catalog\.csv|llms\.txt|robots\.txt|404\.html)$/.test(rel)) return 'pass';
  if (/^img\/thumb\//.test(rel)) return 'thumb';
  if (/^img\//.test(rel)) return 'image';
  return 'shell';
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const p = policy(new URL(e.request.url));
  if (p === 'pass') return;
  if (p === 'shell') e.respondWith(networkFirst(e.request));
  else if (p === 'thumb') e.respondWith(imageFirst(e, THUMBS, THUMB_CAP));
  else e.respondWith(imageFirst(e, IMAGES, IMAGE_CAP));
});

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await withTimeout(fetch(req), NETWORK_MS);
    /* Keyed without the query: `?fbclid=...` must not add a shell entry per visit. */
    if (res.ok) await cache.put(req.url.split('?')[0], res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate' && isRoot(req.url)) {
      const shell = await cache.match('./');
      if (shell) return shell;
    }
    throw err;
  }
}

async function imageFirst(e, name, cap) {
  const cache = await caches.open(name);
  const hit = await cache.match(e.request);
  if (hit) {
    if (ageOf(hit) > IMAGE_MAX_AGE_MS) e.waitUntil(refresh(cache, e.request));
    return hit;
  }
  let res;
  try {
    res = await fetch(e.request);
  } catch (err) {
    /* An offline miss rejects; the app's `onerror` then asks for
       `img/_none.webp` (or `img/thumb/_none.webp`), which this same lookup
       answers from the shell cache's precached copy. */
    const precached = await caches.match(e.request);
    if (precached) return precached;
    throw err;
  }
  if (res.ok) {
    await cache.put(e.request, res.clone());
    await trim(cache, cap);
  }
  return res;
}

/* The scope root and `index.html` are the one document every hash route
   resolves to; any other path (a stub, an unknown file) stays network-only. */
function isRoot(href) {
  const path = new URL(href).pathname;
  const scope = new URL(self.registration.scope).pathname;
  return path === scope || path === scope + 'index.html';
}

/* 0 without a `Date` header, so such a response is never refreshed on a loop. */
function ageOf(res) {
  const date = Date.parse(res.headers.get('date') || '');
  return Number.isNaN(date) ? 0 : Date.now() - date;
}

async function refresh(cache, req) {
  try {
    const res = await fetch(req);
    if (res.ok) await cache.put(req, res);
  } catch {
    /* Offline or failing: the cached picture stays until the next attempt. */
  }
}

/* `cache.keys()` returns insertion order, so the front is the oldest. */
async function trim(cache, cap) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - cap))) await cache.delete(key);
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('network timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
