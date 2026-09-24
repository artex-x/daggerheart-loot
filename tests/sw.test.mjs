/*
  node:test over app/public/sw.js, the real file, run in a `vm` context with
  a fake CacheStorage, a stub `fetch` and fake events. What a real browser
  adds - registration, control and an offline reload - is
  tests/app/states.js's installed-shell case. The policy under test:
  docs/specs/META.md section 9.
*/
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const SRC = readFileSync(join(import.meta.dirname, '..', 'app', 'public', 'sw.js'), 'utf8');
const SCOPE = 'https://x.test/daggerheart-loot/';
const WORKER = SCOPE + 'sw.js';

/** A resolved absolute URL for a string (relative to the worker, as the
 *  Cache API resolves it) or a request-like object. */
const urlOf = (r) => (typeof r === 'string' ? new URL(r, WORKER).href : r.url);

/** One cache: a Map keeps insertion order, the order Chrome's `keys()` has. */
function fakeCache() {
  const entries = new Map();
  return {
    entries,
    async match(r, opts = {}) {
      let url = urlOf(r);
      if (opts.ignoreSearch) url = url.split('?')[0];
      const hit = entries.get(url);
      return hit ? hit.clone() : undefined;
    },
    async put(r, res) {
      entries.set(urlOf(r), res);
    },
    async addAll(list) {
      for (const r of list) await this.put(r, await this.fetch(r));
    },
    async keys() {
      return [...entries.keys()].map((url) => ({ url }));
    },
    async delete(r) {
      return entries.delete(urlOf(r));
    }
  };
}

function fakeCaches(fetch) {
  const named = new Map();
  return {
    named,
    async open(name) {
      if (!named.has(name)) named.set(name, Object.assign(fakeCache(), { fetch }));
      return named.get(name);
    },
    async keys() {
      return [...named.keys()];
    },
    async delete(name) {
      return named.delete(name);
    },
    /* `cacheName` searches that cache only and, as in a browser, never creates it. */
    async match(r, opts = {}) {
      if (opts.cacheName) return named.get(opts.cacheName)?.match(r);
      for (const c of named.values()) {
        const hit = await c.match(r);
        if (hit) return hit;
      }
      return undefined;
    }
  };
}

/** Loads the worker into a fresh context. `net.fn(url)` answers every
 *  `fetch`; it rejects (offline) until a test replaces it. `preload` gives
 *  the registration a `navigationPreload`, as Chrome has. */
function load({ timers = { setTimeout, clearTimeout }, preload = false } = {}) {
  const handlers = {};
  const calls = { skipWaiting: 0, claim: 0, preload: 0 };
  const net = {
    urls: [],
    fn: async () => {
      throw new TypeError('Failed to fetch');
    }
  };
  const fetch = (r) => {
    net.urls.push(urlOf(r));
    return net.fn(urlOf(r));
  };
  const caches = fakeCaches(fetch);
  const self = {
    registration: { scope: SCOPE },
    addEventListener: (type, fn) => {
      handlers[type] = fn;
    },
    skipWaiting: async () => {
      calls.skipWaiting++;
    },
    clients: {
      claim: async () => {
        calls.claim++;
      }
    }
  };
  if (preload) {
    self.registration.navigationPreload = {
      enable: async () => {
        calls.preload++;
      }
    };
  }
  const ctx = vm.createContext({ self, caches, fetch, URL, ...timers });
  vm.runInContext(SRC, ctx);
  return { handlers, calls, caches, net, ctx };
}

const body = (text, headers = {}) => new Response(text, { status: 200, headers });
const req = (path, init = {}) => ({
  url: new URL(path, SCOPE).href,
  method: 'GET',
  mode: 'cors',
  ...init
});

/** Dispatches a fetch event; `answered` is false when the worker let the
 *  browser handle the request itself. `init` adds event fields such as
 *  `preloadResponse`. */
function dispatch(w, request, init = {}) {
  const ev = {
    request,
    answered: false,
    response: null,
    waits: [],
    respondWith(p) {
      this.answered = true;
      this.response = Promise.resolve(p);
    },
    waitUntil(p) {
      this.waits.push(p);
    }
  };
  Object.assign(ev, init);
  w.handlers.fetch(ev);
  return ev;
}

async function lifecycle(w, type) {
  const waits = [];
  w.handlers[type]({ waitUntil: (p) => waits.push(p) });
  await Promise.all(waits);
}

describe('install and activate', () => {
  it('precaches every PRECACHE entry and skips waiting', async () => {
    const w = load();
    w.net.fn = async (url) => body('at ' + url);
    await lifecycle(w, 'install');
    /* Array.from: the array was made in the worker's realm. */
    const precache = vm.runInContext('PRECACHE', w.ctx);
    const shell = w.caches.named.get('dhloot-shell-v1');
    assert.deepEqual(
      [...shell.entries.keys()],
      Array.from(precache, (p) => new URL(p, WORKER).href)
    );
    assert.equal(w.calls.skipWaiting, 1);
  });

  it('deletes an older dhloot cache, keeps the current three and a foreign one, and claims', async () => {
    const w = load();
    for (const name of [
      'dhloot-shell-v0',
      'dhloot-shell-v1',
      'dhloot-img-v1',
      'dhloot-thumb-v1',
      'other'
    ]) {
      await w.caches.open(name);
    }
    await lifecycle(w, 'activate');
    assert.deepEqual(
      [...w.caches.named.keys()],
      ['dhloot-shell-v1', 'dhloot-img-v1', 'dhloot-thumb-v1', 'other']
    );
    assert.equal(w.calls.claim, 1);
  });
});

describe('the shell: network first, cache fallback', () => {
  it('answers a GET online from the network and stores it', async () => {
    const w = load();
    w.net.fn = async () => body('fresh app');
    const ev = dispatch(w, req('assets/app.js'));
    assert.equal(await (await ev.response).text(), 'fresh app');
    const stored = await w.caches.named.get('dhloot-shell-v1').match(SCOPE + 'assets/app.js');
    assert.equal(await stored.text(), 'fresh app');
  });

  it('answers the same GET offline from the stored copy', async () => {
    const w = load();
    w.net.fn = async () => body('fresh app');
    await (await dispatch(w, req('assets/app.js')).response).text();
    w.net.fn = async () => {
      throw new TypeError('Failed to fetch');
    };
    const ev = dispatch(w, req('assets/app.js'));
    assert.equal(await (await ev.response).text(), 'fresh app');
  });

  it('stores one entry per path, whatever the query, and answers offline from it', async () => {
    const w = load();
    w.net.fn = async (url) => body('shell for ' + url);
    await (await dispatch(w, req('index.html?a=1')).response).text();
    await (await dispatch(w, req('index.html?a=2')).response).text();
    const shell = w.caches.named.get('dhloot-shell-v1');
    assert.deepEqual([...shell.entries.keys()], [SCOPE + 'index.html']);
    w.net.fn = async () => {
      throw new TypeError('Failed to fetch');
    };
    const ev = dispatch(w, req('index.html?a=3'));
    assert.equal(await (await ev.response).text(), 'shell for ' + SCOPE + 'index.html?a=2');
  });

  it('falls back to the stored copy when the network does not answer in time', async () => {
    /* The five-second timeout, fired at once. */
    const w = load({
      timers: { setTimeout: (fn) => setTimeout(fn, 0), clearTimeout }
    });
    await (await w.caches.open('dhloot-shell-v1')).put(SCOPE + 'data.js', body('cached data'));
    w.net.fn = () => new Promise(() => {});
    const ev = dispatch(w, req('data.js'));
    assert.equal(await (await ev.response).text(), 'cached data');
  });

  it('answers a navigation to index.html offline with the cached scope root', async () => {
    const w = load();
    await (await w.caches.open('dhloot-shell-v1')).put('./', body('the shell'));
    const ev = dispatch(w, req('index.html', { mode: 'navigate' }));
    assert.equal(await (await ev.response).text(), 'the shell');
  });

  it('answers the English entry document from the network, stores it, and answers offline from it', async () => {
    const w = load();
    w.net.fn = async () => body('the English entry');
    const online = dispatch(w, req('en/', { mode: 'navigate' }));
    assert.equal(await (await online.response).text(), 'the English entry');
    const stored = await w.caches.named.get('dhloot-shell-v1').match(SCOPE + 'en/');
    assert.equal(await stored.text(), 'the English entry');
    w.net.fn = async () => {
      throw new TypeError('Failed to fetch');
    };
    const offline = dispatch(w, req('en/', { mode: 'navigate' }));
    assert.equal(await (await offline.response).text(), 'the English entry');
  });

  it('rejects an offline miss that is not the scope root', async () => {
    const w = load();
    await (await w.caches.open('dhloot-shell-v1')).put('./', body('the shell'));
    const ev = dispatch(w, req('card/x.svg', { mode: 'navigate' }));
    await assert.rejects(ev.response, /Failed to fetch/);
  });
});

describe('paths the worker leaves to the browser', () => {
  for (const [what, request] of [
    ['a share stub navigation', req('i/w1.html', { mode: 'navigate' })],
    ['an English share stub navigation', req('i/en/w1.html', { mode: 'navigate' })],
    ['a link preview picture', req('og/x.jpg')],
    ['data.json', req('data.json')],
    ['a POST', req('assets/app.js', { method: 'POST' })],
    [
      'a cross-origin URL',
      { url: 'https://other.test/daggerheart-loot/app.js', method: 'GET' }
    ],
    ['a path outside the scope', req('/elsewhere/index.html')]
  ]) {
    it('does not answer ' + what, () => {
      const w = load();
      assert.equal(dispatch(w, request).answered, false);
    });
  }

  it('does not answer a share stub navigation with a preload response, and waits for it', async () => {
    const w = load();
    const ev = dispatch(w, req('i/w1.html', { mode: 'navigate' }), {
      preloadResponse: Promise.resolve(body('stub'))
    });
    assert.equal(ev.answered, false);
    assert.equal(ev.waits.length, 1);
    await Promise.all(ev.waits);
  });
});

describe('pictures: cache first, capped', () => {
  it('fetches and stores a miss', async () => {
    const w = load();
    w.net.fn = async () => body('pixels');
    const ev = dispatch(w, req('img/x.webp'));
    assert.equal(await (await ev.response).text(), 'pixels');
    await Promise.all(ev.waits);
    assert.ok(w.caches.named.get('dhloot-img-v1').entries.has(SCOPE + 'img/x.webp'));
  });

  it('answers a miss before it is stored, then stores it', async () => {
    const w = load();
    const images = await w.caches.open('dhloot-img-v1');
    let open;
    const gate = new Promise((resolve) => {
      open = resolve;
    });
    const put = images.put.bind(images);
    images.put = async (r, res) => {
      await gate;
      return put(r, res);
    };
    w.net.fn = async () => body('pixels');
    const ev = dispatch(w, req('img/x.webp'));
    assert.equal(await (await ev.response).text(), 'pixels');
    assert.equal(images.entries.has(SCOPE + 'img/x.webp'), false);
    assert.equal(ev.waits.length, 1);
    open();
    await Promise.all(ev.waits);
    assert.ok(images.entries.has(SCOPE + 'img/x.webp'));
  });

  it('stores nothing for a miss that is not ok', async () => {
    const w = load();
    w.net.fn = async () => new Response('gone', { status: 404 });
    const ev = dispatch(w, req('img/x.webp'));
    assert.equal((await ev.response).status, 404);
    assert.equal(ev.waits.length, 0);
    const images = await w.caches.open('dhloot-img-v1');
    assert.equal(images.entries.has(SCOPE + 'img/x.webp'), false);
  });

  it('rejects an offline full-picture miss even when its thumbnail is cached', async () => {
    const w = load();
    const thumbs = await w.caches.open('dhloot-thumb-v1');
    await thumbs.put(SCOPE + 'img/thumb/x.webp', body('small'));
    const ev = dispatch(w, req('img/x.webp'));
    await assert.rejects(ev.response, /Failed to fetch/);
  });

  it('falls back offline to the placeholder precached in the shell cache', async () => {
    const w = load();
    await (await w.caches.open('dhloot-shell-v1')).put('img/_none.webp', body('placeholder'));
    const ev = dispatch(w, req('img/_none.webp'));
    assert.equal(await (await ev.response).text(), 'placeholder');
  });

  it('evicts the oldest picture when the 301st arrives', async () => {
    const w = load();
    const images = await w.caches.open('dhloot-img-v1');
    for (let i = 0; i < 300; i++) await images.put(SCOPE + 'img/p' + i + '.webp', body('p'));
    w.net.fn = async () => body('newest');
    const ev = dispatch(w, req('img/p300.webp'));
    await (await ev.response).text();
    await Promise.all(ev.waits);
    const keys = [...images.entries.keys()];
    assert.equal(keys.length, 300);
    assert.equal(keys[0], SCOPE + 'img/p1.webp');
    assert.equal(keys[299], SCOPE + 'img/p300.webp');
  });
});

describe('thumbnails: their own cache, capped above the whole set', () => {
  it('fetches a miss and stores it in the thumbnail cache, not the picture cache', async () => {
    const w = load();
    w.net.fn = async () => body('small pixels');
    const ev = dispatch(w, req('img/thumb/x.webp'));
    assert.equal(await (await ev.response).text(), 'small pixels');
    await Promise.all(ev.waits);
    assert.ok(w.caches.named.get('dhloot-thumb-v1').entries.has(SCOPE + 'img/thumb/x.webp'));
    assert.equal(w.caches.named.has('dhloot-img-v1'), false);
  });

  it('keeps 301 thumbnails and leaves the picture cache untouched', async () => {
    const w = load();
    const images = await w.caches.open('dhloot-img-v1');
    await images.put(SCOPE + 'img/p.webp', body('p'));
    w.net.fn = async () => body('t');
    for (let i = 0; i < 301; i++) {
      const ev = dispatch(w, req('img/thumb/t' + i + '.webp'));
      await (await ev.response).text();
      await Promise.all(ev.waits);
    }
    assert.equal(w.caches.named.get('dhloot-thumb-v1').entries.size, 301);
    assert.deepEqual([...images.entries.keys()], [SCOPE + 'img/p.webp']);
  });

  it('evicts the oldest thumbnail when the 1501st arrives', async () => {
    const w = load();
    const thumbs = await w.caches.open('dhloot-thumb-v1');
    for (let i = 0; i < 1500; i++)
      await thumbs.put(SCOPE + 'img/thumb/t' + i + '.webp', body('t'));
    w.net.fn = async () => body('newest');
    const ev = dispatch(w, req('img/thumb/t1500.webp'));
    await (await ev.response).text();
    await Promise.all(ev.waits);
    const keys = [...thumbs.entries.keys()];
    assert.equal(keys.length, 1500);
    assert.equal(keys[0], SCOPE + 'img/thumb/t1.webp');
    assert.equal(keys[1499], SCOPE + 'img/thumb/t1500.webp');
  });

  it('falls back offline to the thumbnail placeholder precached in the shell cache', async () => {
    const w = load();
    await (
      await w.caches.open('dhloot-shell-v1')
    ).put('img/thumb/_none.webp', body('small placeholder'));
    const ev = dispatch(w, req('img/thumb/_none.webp'));
    assert.equal(await (await ev.response).text(), 'small placeholder');
  });

  it('answers an offline thumbnail miss with the cached full picture', async () => {
    const w = load();
    await (await w.caches.open('dhloot-img-v1')).put(SCOPE + 'img/x.webp', body('full'));
    const ev = dispatch(w, req('img/thumb/x.webp'));
    assert.equal(await (await ev.response).text(), 'full');
  });

  it('fetches an online thumbnail miss even when the full picture is cached', async () => {
    const w = load();
    await (await w.caches.open('dhloot-img-v1')).put(SCOPE + 'img/x.webp', body('full'));
    w.net.fn = async () => body('small');
    const ev = dispatch(w, req('img/thumb/x.webp'));
    assert.equal(await (await ev.response).text(), 'small');
  });

  it('rejects an offline thumbnail miss with neither copy cached', async () => {
    const w = load();
    const ev = dispatch(w, req('img/thumb/x.webp'));
    await assert.rejects(ev.response, /Failed to fetch/);
    assert.equal(w.caches.named.has('dhloot-img-v1'), false);
  });

  it('holds THUMB_CAP at or above the number of thumbnails in img/thumb/', () => {
    const cap = vm.runInContext('THUMB_CAP', load().ctx);
    const dir = new URL('../img/thumb/', import.meta.url);
    const n = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.webp')).length : 0;
    assert.ok(
      cap >= n,
      'THUMB_CAP in app/public/sw.js is ' +
        cap +
        ', below the ' +
        n +
        ' thumbnails in img/thumb/ - raise it (docs/specs/META.md section 9)'
    );
  });
});

describe('picture and thumbnail hits: answered from the cache, revalidated on every hit', () => {
  for (const [name, path] of [
    ['dhloot-img-v1', 'img/x.webp'],
    ['dhloot-thumb-v1', 'img/thumb/x.webp']
  ]) {
    /** Seeds a hit, answers its background fetch with `answer`, and returns
     *  the cached text once the waits settle. */
    async function revalidated(answer, seed = body('old', { etag: '"a"' })) {
      const w = load();
      await (await w.caches.open(name)).put(SCOPE + path, seed);
      w.net.fn = async () => answer;
      const ev = dispatch(w, req(path));
      assert.equal(await (await ev.response).text(), 'old');
      await Promise.all(ev.waits);
      const text = await (await (await w.caches.open(name)).match(SCOPE + path)).text();
      return { w, text };
    }

    it(name + ': answers a hit before its background fetch settles', async () => {
      const w = load();
      await (await w.caches.open(name)).put(SCOPE + path, body('old', { etag: '"a"' }));
      let settle;
      w.net.fn = () =>
        new Promise((resolve) => {
          settle = resolve;
        });
      const ev = dispatch(w, req(path));
      assert.equal(await (await ev.response).text(), 'old');
      assert.equal(ev.waits.length, 1);
      assert.deepEqual(w.net.urls, [SCOPE + path]);
      settle(body('new', { etag: '"a"' }));
      await Promise.all(ev.waits);
    });

    it(name + ': writes nothing when the answer has the cached ETag', async () => {
      const { text } = await revalidated(body('new', { etag: '"a"' }));
      assert.equal(text, 'old');
    });

    it(name + ': replaces the entry when the ETag changed', async () => {
      const { w, text } = await revalidated(body('new', { etag: '"b"' }));
      assert.equal(text, 'new');
      if (name === 'dhloot-thumb-v1') assert.equal(w.caches.named.has('dhloot-img-v1'), false);
    });

    it(name + ': replaces the entry when the answer has no ETag', async () => {
      const { text } = await revalidated(body('new'));
      assert.equal(text, 'new');
    });

    it(name + ': replaces the entry when the cached copy has no ETag', async () => {
      const { text } = await revalidated(body('new', { etag: '"a"' }), body('old'));
      assert.equal(text, 'new');
    });

    it(name + ': keeps the cached picture when the answer is not ok', async () => {
      const { text } = await revalidated(
        new Response('gone', { status: 404, headers: { etag: '"b"' } })
      );
      assert.equal(text, 'old');
    });

    it(
      name + ': keeps the cached picture and does not reject when the fetch fails',
      async () => {
        const w = load();
        await (await w.caches.open(name)).put(SCOPE + path, body('old', { etag: '"a"' }));
        const ev = dispatch(w, req(path));
        assert.equal(await (await ev.response).text(), 'old');
        await assert.doesNotReject(Promise.all(ev.waits));
        const cached = await (await w.caches.open(name)).match(SCOPE + path);
        assert.equal(await cached.text(), 'old');
      }
    );
  }
});

describe('navigations: the preload response when there is one', () => {
  it('enables navigation preload on activate where the registration has it, then claims', async () => {
    const w = load({ preload: true });
    await lifecycle(w, 'activate');
    assert.equal(w.calls.preload, 1);
    assert.equal(w.calls.claim, 1);
  });

  it('still deletes older caches and claims when enabling navigation preload rejects', async () => {
    const w = load();
    w.ctx.self.registration.navigationPreload = {
      enable: async () => {
        throw new Error('refused');
      }
    };
    await w.caches.open('dhloot-shell-v0');
    await w.caches.open('dhloot-shell-v1');
    await lifecycle(w, 'activate');
    assert.deepEqual([...w.caches.named.keys()], ['dhloot-shell-v1']);
    assert.equal(w.calls.claim, 1);
  });

  it('answers a navigation with the preload response and stores it without the query', async () => {
    const w = load();
    const ev = dispatch(w, req('index.html?fbclid=1', { mode: 'navigate' }), {
      preloadResponse: Promise.resolve(body('preloaded'))
    });
    assert.equal(await (await ev.response).text(), 'preloaded');
    const stored = await w.caches.named.get('dhloot-shell-v1').match(SCOPE + 'index.html');
    assert.equal(await stored.text(), 'preloaded');
    assert.deepEqual(w.net.urls, []);
  });

  it('fetches when the preload response is undefined', async () => {
    const w = load();
    w.net.fn = async () => body('fetched');
    const ev = dispatch(w, req('index.html', { mode: 'navigate' }), {
      preloadResponse: Promise.resolve(undefined)
    });
    assert.equal(await (await ev.response).text(), 'fetched');
    assert.equal(w.net.urls.length, 1);
  });

  it('falls back to the cached scope root when the preload rejects', async () => {
    const w = load();
    await (await w.caches.open('dhloot-shell-v1')).put('./', body('the shell'));
    const ev = dispatch(w, req('index.html', { mode: 'navigate' }), {
      preloadResponse: Promise.reject(new TypeError('Failed to fetch'))
    });
    assert.equal(await (await ev.response).text(), 'the shell');
  });

  it('falls back to the stored copy when the preload does not settle in time', async () => {
    /* The five-second timeout, fired at once. */
    const w = load({
      timers: { setTimeout: (fn) => setTimeout(fn, 0), clearTimeout }
    });
    await (await w.caches.open('dhloot-shell-v1')).put(SCOPE + 'index.html', body('cached'));
    const ev = dispatch(w, req('index.html', { mode: 'navigate' }), {
      preloadResponse: new Promise(() => {})
    });
    assert.equal(await (await ev.response).text(), 'cached');
  });
});
