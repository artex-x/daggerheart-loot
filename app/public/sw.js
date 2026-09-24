/* The service worker: it keeps the site an installable app and caches the
 * pictures and the hashed build files. Offline use is retired: there is no
 * shell and no document cache.
 *
 * Plain JS copied verbatim into dist/, outside the bundle and the TypeScript
 * project. The policy and the reason there is no version stamp:
 * docs/specs/META.md section 9. tests/sw.test.mjs and
 * tools/check-site.lib.mjs read the cache names. */

const IMAGES = 'dhloot-img-v1';
const IMAGE_CAP = 300;
/* Above the whole thumbnail set (about 2 KB each), so a table scroll never
   evicts a row's own picture; tests/sw.test.mjs fails when img/thumb/ outgrows it. */
const THUMBS = 'dhloot-thumb-v1';
const THUMB_CAP = 1500;
/* Hashed names never change their bytes, so a hit is never revalidated. A
   deploy adds new names and nothing asks for the old ones again: the cap
   drops the oldest, which holds several deploys of today's two files. */
const ASSETS = 'dhloot-assets-v1';
const ASSET_CAP = 30;
const KEEP = [IMAGES, THUMBS, ASSETS];

self.addEventListener('install', () => {
  self.skipWaiting();
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
      .then(disablePreload)
      .then(() => self.clients.claim())
  );
});

/* The issue-69 worker enabled navigation preload, and the setting outlives
   that worker; with no navigation handler every preload would be wasted. */
async function disablePreload() {
  try {
    await self.registration.navigationPreload?.disable();
  } catch {
    /* Unsupported or refused: the page still loads from the network. */
  }
}

/* 'pass' | 'image' | 'thumb' | 'asset', from the path relative to the scope.
   A navigation, `data.js`, the worker, the manifest, `pages/`, any other
   origin and a sign-in callback all pass to the network untouched. */
function policy(req) {
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);
  if (req.method !== 'GET' || req.mode === 'navigate') return 'pass';
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return 'pass';
  if (url.search.includes('auth-callback')) return 'pass';
  const rel = url.pathname.slice(scope.pathname.length);
  if (/^img\/thumb\//.test(rel)) return 'thumb';
  if (/^img\//.test(rel)) return 'image';
  if (/^assets\//.test(rel)) return 'asset';
  return 'pass';
}

self.addEventListener('fetch', (e) => {
  const p = policy(e.request);
  if (p === 'thumb') e.respondWith(imageFirst(e, THUMBS, THUMB_CAP));
  else if (p === 'image') e.respondWith(imageFirst(e, IMAGES, IMAGE_CAP));
  else if (p === 'asset') e.respondWith(assetFirst(e));
});

async function imageFirst(e, name, cap) {
  const cache = await caches.open(name);
  const hit = await cache.match(e.request);
  if (hit) {
    e.waitUntil(revalidate(cache, e.request, hit.headers.get('etag')));
    return hit;
  }
  let res;
  try {
    res = await fetch(e.request);
  } catch (err) {
    /* A thumbnail miss without a connection takes the full picture when
       that one is cached. */
    if (name === THUMBS) {
      const full = await caches.match(fullOf(e.request.url), { cacheName: IMAGES });
      if (full) return full;
    }
    throw err;
  }
  if (res.ok) e.waitUntil(store(cache, e.request, res.clone(), cap));
  return res;
}

async function assetFirst(e) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(e.request);
  if (hit) return hit;
  const res = await fetch(e.request);
  if (res.ok) e.waitUntil(store(cache, e.request, res.clone(), ASSET_CAP));
  return res;
}

/* Through the browser's HTTP cache: within Pages' `max-age` nothing goes
   out, after it a conditional request usually answers 304. The same
   `ETag` writes nothing, so a view costs no cache write. */
async function revalidate(cache, req, etag) {
  try {
    const res = await fetch(req);
    if (!res.ok) return;
    const fresh = res.headers.get('etag');
    if (fresh && fresh === etag) return;
    await cache.put(req, res);
  } catch {
    /* Offline or failing: the cached picture stays until the next hit. */
  }
}

/* Off the answer's path: `trim` reads every key, up to THUMB_CAP. */
async function store(cache, req, res, cap) {
  try {
    await cache.put(req, res);
    await trim(cache, cap);
  } catch {
    /* Quota or a failed write: the file is fetched again next time. */
  }
}

/* A thumbnail keeps its picture's name: `img/thumb/<x>` is `img/<x>`. */
function fullOf(href) {
  const scope = self.registration.scope;
  return scope + 'img/' + href.slice((scope + 'img/thumb/').length);
}

/* `cache.keys()` returns insertion order, so the front is the oldest. */
async function trim(cache, cap) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - cap))) await cache.delete(key);
}
