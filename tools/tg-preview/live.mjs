/*
  Confirms the CDN is already serving what the manifest hashed, before a
  refresh is sent: pushing a refresh before Pages catches up would make
  Telegram re-cache the very bytes this tool exists to replace, under a state
  entry that claims to be current - the one failure the state cannot see
  (plan.md section 5.3). No unit test: it is real network I/O, same as
  client.mjs; docs/tg-preview.md section "How the owner verifies a real
  refresh" is what actually checks its output.
*/
import { createHash } from 'node:crypto';
import {
  extractMeta,
  fingerprint,
  imageName,
  VERIFY_ROUNDS,
  VERIFY_ROUND_MS,
  VERIFY_CONCURRENCY
} from './lib.mjs';

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

async function runPool(items, concurrency, worker) {
  let i = 0;
  async function lane() {
    while (i < items.length) {
      const item = items[i++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
}

// `urls` is `{ url: expectedFingerprint }`, a subset of the manifest for
// whatever is currently stale. Returns `{ ready: [url], notLive: [url] }`.
export async function verify(urls, { site, fetch: fetchImpl, sleep, log }) {
  // Records share pictures; fetch and hash each distinct image once per run.
  const imageCache = new Map();
  function imageSha(name) {
    if (!imageCache.has(name)) {
      const promise = (async () => {
        const res = await fetchImpl(site + 'og/' + name);
        if (!res.ok) throw new Error('image fetch failed: ' + name + ' (' + res.status + ')');
        return sha256(Buffer.from(await res.arrayBuffer()));
      })();
      // A rejected promise must not stay cached: a new `og/<name>.jpg` can
      // 404 in round 1 while Pages catches up - exactly the case the rounds
      // exist for - and the next round needs to fetch again, not replay the
      // same rejection.
      promise.catch(() => imageCache.delete(name));
      imageCache.set(name, promise);
    }
    return imageCache.get(name);
  }

  async function liveFingerprint(url) {
    const res = await fetchImpl(url);
    if (!res.ok) return null;
    const meta = extractMeta(await res.text());
    const name = imageName(meta, site);
    const sha = name ? await imageSha(name) : sha256(Buffer.alloc(0));
    return fingerprint(meta, sha);
  }

  const ready = [];
  let pending = Object.keys(urls);
  for (let round = 0; round < VERIFY_ROUNDS && pending.length; round++) {
    if (round > 0) {
      log('live check: ' + pending.length + ' url(s) still not caught up, retrying');
      await sleep(VERIFY_ROUND_MS);
    }
    const mismatched = [];
    await runPool(pending, VERIFY_CONCURRENCY, async (url) => {
      // Declared, not initialised: the initial value was never read before
      // either branch below overwrote it (issues/phase-8, B9-R2/B9-N5).
      let live;
      try {
        live = await liveFingerprint(url);
      } catch {
        live = null;
      }
      if (live && live === urls[url]) ready.push(url);
      else mismatched.push(url);
    });
    pending = mismatched;
  }
  return { ready, notLive: pending };
}
