/* The old host's service worker: the deploy publishes it in place of the
 * app's sw.js on GitHub Pages. A browser that installed the app there picks
 * it up on its next update check; it deletes the app's caches and
 * unregisters itself, because nothing runs the app on this origin any more
 * (docs/specs/META.md section 9, "The old host"). No fetch listener: every
 * request goes to the network. */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('dhloot-')).map((k) => caches.delete(k)))
      )
      .then(() => self.registration.unregister())
  );
});
