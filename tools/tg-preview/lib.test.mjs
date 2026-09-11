/*
  node:test over lib.mjs's pure logic. Imports nothing from node_modules, so
  it runs inside `npm run check` even before `npm install` has ever touched
  this directory - the acceptance criterion in plan.md section 10, B1.

  The real data.js is loaded the way tests/derived.js does it, for the one
  count that has to be pinned against something real rather than a fixture.
*/
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as lib from './lib.mjs';
import { runRefresh } from './lib.mjs';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

function realData() {
  if (!globalThis.window) globalThis.window = {};
  if (!globalThis.window.LOOT) require(join(ROOT, 'data.js'));
  return globalThis.window.LOOT;
}
const derived = require(join(ROOT, 'tools', 'derived.js'));
const { page } = require(join(ROOT, 'tools', 'build-share-pages.js'));

describe('urls', () => {
  it('is the root plus one stub per record, each unique, root first', () => {
    const records = derived.everything(realData());
    const list = lib.urls(records, derived.SITE);
    assert.equal(list.length, records.length + 1);
    assert.equal(list[0], derived.SITE);
    assert.equal(new Set(list).size, list.length);
    for (const it of records) assert.ok(list.includes(derived.SITE + 'i/' + it.id + '.html'));
  });
});

describe('extractMeta', () => {
  it('reads og:title/description/image off a real stub', () => {
    const it = derived.everything(realData())[0];
    const meta = lib.extractMeta(page(it));
    assert.equal(meta.title, it.ru || it.en);
    assert.ok(meta.image.startsWith(derived.SITE + 'og/'));
    assert.ok(meta.description.length > 0);
  });

  it('reads the root index.html', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    const meta = lib.extractMeta(html);
    assert.ok(meta.title.length > 0);
    assert.equal(meta.image, derived.SITE + 'og/_share.jpg');
  });

  it('decodes the entities esc() produces, and returns empty strings for a missing tag', () => {
    const html = '<meta property="og:title" content="Fish &amp; Chips &quot;A&quot; &lt;B&gt; &#39;C&#39;">';
    assert.equal(lib.extractMeta(html).title, 'Fish & Chips "A" <B> \'C\'');
    assert.deepEqual(lib.extractMeta('<html></html>'), { title: '', description: '', image: '' });
  });
});

describe('fingerprint', () => {
  const meta = { title: 'A', description: 'B', image: 'https://x/og/a.jpg' };

  it('is stable for the same input', () => {
    assert.equal(lib.fingerprint({ ...meta }, 'sha1'), lib.fingerprint({ ...meta }, 'sha1'));
  });

  it('changes on title, description, image URL, or image bytes; not on anything else', () => {
    const base = lib.fingerprint(meta, 'sha1');
    assert.notEqual(lib.fingerprint({ ...meta, title: 'A2' }, 'sha1'), base);
    assert.notEqual(lib.fingerprint({ ...meta, description: 'B2' }, 'sha1'), base);
    assert.notEqual(lib.fingerprint({ ...meta, image: 'https://x/og/b.jpg' }, 'sha1'), base);
    assert.notEqual(lib.fingerprint(meta, 'sha2'), base);
  });
});

describe('imageName', () => {
  it('extracts the basename under <site>og/', () => {
    assert.equal(lib.imageName({ image: 'https://x/og/a1.jpg' }, 'https://x/'), 'a1.jpg');
  });

  it('is null when the image is not under site + og/', () => {
    assert.equal(lib.imageName({ image: 'https://elsewhere/x.jpg' }, 'https://x/'), null);
    assert.equal(lib.imageName({ image: '' }, 'https://x/'), null);
  });
});

describe('buildManifest', () => {
  const site = 'https://example.test/';
  function stub(it) {
    return (
      '<meta property="og:title" content="' +
      it.id +
      '"><meta property="og:description" content="d-' +
      it.id +
      '"><meta property="og:image" content="' +
      site +
      'og/' +
      it.img +
      '">'
    );
  }
  const rootHtml =
    '<meta property="og:title" content="root">' +
    '<meta property="og:description" content="root-d">' +
    '<meta property="og:image" content="' +
    site +
    'og/_share.jpg">';

  it('fingerprints every record plus the root, and reports a missing image without throwing', () => {
    const L = [
      { id: 'a', img: 'a.jpg' },
      { id: 'b', img: 'missing.jpg' }
    ];
    const images = { 'a.jpg': Buffer.from('AAA'), '_share.jpg': Buffer.from('ROOT') };
    const manifest = lib.buildManifest({
      site,
      L,
      renderStub: stub,
      rootHtml,
      readImage: (name) => images[name] || null
    });
    assert.equal(manifest.site, site);
    assert.equal(Object.keys(manifest.urls).length, 2);
    assert.ok(manifest.urls[site]);
    assert.ok(manifest.urls[site + 'i/a.html']);
    assert.equal(manifest.urls[site + 'i/b.html'], undefined);
    assert.deepEqual(manifest.missing, [site + 'i/b.html']);
  });
});

describe('stale', () => {
  const manifest = {
    site: 'https://x/',
    urls: { 'https://x/': 'r1', 'https://x/i/a.html': 'a1', 'https://x/i/b.html': 'b1' }
  };

  it('full mode: everything is stale regardless of state', () => {
    const state = { site: 'https://x/', urls: { ...manifest.urls } };
    assert.deepEqual(lib.stale(manifest, state, 'full'), Object.keys(manifest.urls));
  });

  it('incremental mode: only what disagrees with the state', () => {
    const state = { site: 'https://x/', urls: { ...manifest.urls, 'https://x/i/a.html': 'OLD' } };
    assert.deepEqual(lib.stale(manifest, state, 'incremental'), ['https://x/i/a.html']);
  });

  it('absent state: everything is stale (the bootstrap rule)', () => {
    assert.deepEqual(lib.stale(manifest, {}, 'incremental'), Object.keys(manifest.urls));
  });

  it('a state recorded for a foreign site is ignored', () => {
    const state = { site: 'https://other/', urls: { ...manifest.urls } };
    assert.deepEqual(lib.stale(manifest, state, 'incremental'), Object.keys(manifest.urls));
  });

  it('a record dropped from the manifest is simply not visited', () => {
    const state = { site: 'https://x/', urls: { ...manifest.urls, 'https://x/i/gone.html': 'g1' } };
    assert.deepEqual(lib.stale(manifest, state, 'incremental'), []);
  });
});

describe('chunk', () => {
  it('splits 1062 into 107 groups of 10, the last one short', () => {
    const list = Array.from({ length: 1062 }, (_, i) => i);
    const batches = lib.chunk(list, 10);
    assert.equal(batches.length, 107);
    assert.equal(batches[0].length, 10);
    assert.equal(batches[106].length, 2);
  });
});

describe('decide', () => {
  class FloodWaitError extends Error {
    constructor(seconds) {
      super('flood');
      this.seconds = seconds;
    }
  }
  class SlowModeWaitError extends Error {
    constructor(seconds) {
      super('slow');
      this.seconds = seconds;
    }
  }
  class PeerFloodError extends Error {}
  class AuthKeyUnregisteredError extends Error {}
  class SessionRevokedError extends Error {}
  class SessionExpiredError extends Error {}
  class SessionPasswordNeededError extends Error {}
  class AuthKeyInvalidError extends Error {}
  class SomeOtherRPCError extends Error {
    constructor(msg) {
      super(msg);
      this.errorMessage = msg;
    }
  }

  it('retries a small FLOOD_WAIT after seconds + 2', () => {
    const d = lib.decide(new FloodWaitError(5), { attempt: 0, maxWaitS: lib.MAX_WAIT_S });
    assert.deepEqual(d, { retry: true, waitMs: 7000 });
  });

  it('retries a small SLOW_MODE_WAIT the same way', () => {
    const d = lib.decide(new SlowModeWaitError(3), {});
    assert.deepEqual(d, { retry: true, waitMs: 5000 });
  });

  it('stops on a FLOOD_WAIT bigger than the budget, naming the seconds', () => {
    const d = lib.decide(new FloodWaitError(700), { maxWaitS: 600 });
    assert.equal(d.stop, true);
    assert.match(d.reason, /700/);
  });

  it('stops on PEER_FLOOD', () => {
    assert.equal(lib.decide(new PeerFloodError(), {}).stop, true);
  });

  for (const Cls of [
    AuthKeyUnregisteredError,
    SessionRevokedError,
    SessionExpiredError,
    SessionPasswordNeededError,
    AuthKeyInvalidError
  ]) {
    it('is fatal for ' + Cls.name, () => {
      assert.equal(lib.decide(new Cls(), {}).fatal, true);
    });
  }

  it('stops on any other RPCError, naming its errorMessage', () => {
    const d = lib.decide(new SomeOtherRPCError('NOT_FOUND'), {});
    assert.deepEqual(d, { stop: true, reason: 'NOT_FOUND' });
  });

  it('retries a non-RPC (transport) error up to NET_RETRIES, then stops', () => {
    const err = new Error('ECONNRESET');
    assert.equal(lib.decide(err, { attempt: 0 }).retry, true);
    assert.equal(lib.decide(err, { attempt: lib.NET_RETRIES - 1 }).retry, true);
    assert.equal(lib.decide(err, { attempt: lib.NET_RETRIES }).stop, true);
  });
});

describe('applyResult', () => {
  it('keeps a foreign entry the result did not touch, and takes ours for the rest', () => {
    const state = { site: 'https://x/', urls: { 'https://x/i/keep.html': 'K', 'https://x/i/a.html': 'OLD' } };
    const result = { urls: { 'https://x/i/a.html': 'NEW', 'https://x/i/b.html': 'B' } };
    const next = lib.applyResult(state, result, 'https://x/');
    assert.equal(next.site, 'https://x/');
    assert.deepEqual(next.urls, {
      'https://x/i/a.html': 'NEW',
      'https://x/i/b.html': 'B',
      'https://x/i/keep.html': 'K'
    });
  });

  it('discards a state recorded for a different site', () => {
    const state = { site: 'https://other/', urls: { 'https://x/i/a.html': 'OLD' } };
    const result = { urls: { 'https://x/i/b.html': 'B' } };
    assert.deepEqual(lib.applyResult(state, result, 'https://x/').urls, { 'https://x/i/b.html': 'B' });
  });
});

describe('parseArgs', () => {
  it('defaults to an incremental, verifying, non-dry run', () => {
    const o = lib.parseArgs([]);
    assert.equal(o.mode, 'incremental');
    assert.equal(o.dryRun, false);
    assert.equal(o.noVerify, false);
    assert.equal(o.limit, null);
    assert.equal(o.only, null);
  });

  it('parses every flag', () => {
    const o = lib.parseArgs([
      '--mode', 'full',
      '--dry-run',
      '--limit', '3',
      '--only', 'a, b,c',
      '--max-wait', '30',
      '--budget-minutes', '5',
      '--state', 's.json',
      '--result', 'r.json',
      '--assets', 'dist',
      '--no-verify'
    ]);
    assert.equal(o.mode, 'full');
    assert.equal(o.dryRun, true);
    assert.equal(o.limit, 3);
    assert.deepEqual(o.only, ['a', 'b', 'c']);
    assert.equal(o.maxWaitS, 30);
    assert.equal(o.budgetMinutes, 5);
    assert.equal(o.statePath, 's.json');
    assert.equal(o.resultPath, 'r.json');
    assert.equal(o.assets, 'dist');
    assert.equal(o.noVerify, true);
  });

  it('parses the --apply form', () => {
    const o = lib.parseArgs(['--apply', 'result.json', '--state', 's.json']);
    assert.equal(o.apply, 'result.json');
    assert.equal(o.statePath, 's.json');
  });

  it('throws on an unknown flag', () => {
    assert.throws(() => lib.parseArgs(['--bogus']));
  });

  it('throws on an unknown mode', () => {
    assert.throws(() => lib.parseArgs(['--mode', 'partial']));
  });
});

describe('runRefresh', () => {
  function fakeManifest(n) {
    const site = 'https://x/';
    const urls = { [site]: 'root-fp' };
    for (let i = 0; i < n; i++) urls[site + 'i/r' + i + '.html'] = 'fp' + i;
    return { site, urls, missing: [] };
  }

  // `script` is consumed one entry per cx.send() call, in order, across
  // retries too: {ok:true} succeeds, {throw:err} throws err for that call.
  function fakeClient(script) {
    let i = 0;
    const sent = [];
    const closed = { value: false };
    return {
      async client() {
        return {
          async send(text) {
            const step = script[i++];
            if (step && step.throw) throw step.throw;
            sent.push(text);
          },
          async lastReply() {
            return 'ok';
          },
          async close() {
            closed.value = true;
          }
        };
      },
      sent,
      closed
    };
  }

  function baseDeps(manifest, extra = {}) {
    const written = [];
    const results = [];
    let clock = 0;
    const deps = {
      manifest,
      state: extra.state || {},
      client: extra.clientFactory,
      verify: extra.verify || (async (picked) => ({ ready: Object.keys(picked), notLive: [] })),
      sleep: async (ms) => {
        clock += ms;
      },
      now: extra.now || (() => clock),
      random: () => 0,
      writeState: async (s) => {
        written.push(JSON.parse(JSON.stringify(s)));
      },
      writeResult: extra.withResult
        ? async (r) => {
            results.push(JSON.parse(JSON.stringify(r)));
          }
        : null,
      log: () => {}
    };
    deps.written = written;
    deps.results = results;
    return deps;
  }

  it('never loads the client when nothing is stale', async () => {
    const manifest = fakeManifest(3);
    const state = { site: manifest.site, urls: { ...manifest.urls } };
    const deps = baseDeps(manifest, {
      state,
      clientFactory: async () => {
        throw new Error('must not connect');
      }
    });
    const result = await runRefresh({ mode: 'incremental' }, deps);
    assert.deepEqual(result, { sent: [], pending: [], notLive: [], floodWaits: 0, stopped: null, exitCode: 0 });
  });

  it('sends batches in manifest order and writes state after each', async () => {
    const manifest = fakeManifest(25); // 26 urls -> chunks of 10,10,6
    const fake = fakeClient([{ ok: true }, { ok: true }, { ok: true }]);
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(fake.sent.length, 3);
    assert.equal(fake.sent[0].split('\n').length, 10);
    assert.equal(fake.sent[2].split('\n').length, 6);
    assert.equal(result.sent.length, 26);
    assert.equal(result.pending.length, 0);
    assert.equal(deps.written.length, 3);
    assert.ok(fake.closed.value);
  });

  it('--limit sends at most that many messages, the rest pending', async () => {
    const manifest = fakeManifest(25);
    const fake = fakeClient([{ ok: true }]);
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full', limit: 1 }, deps);
    assert.equal(fake.sent.length, 1);
    assert.equal(result.sent.length + result.pending.length, Object.keys(manifest.urls).length);
    assert.equal(result.pending.length, Object.keys(manifest.urls).length - result.sent.length);
    assert.ok(result.pending.length > 0);
  });

  it('--only narrows to the given record ids, "root" included', async () => {
    const manifest = fakeManifest(5);
    const fake = fakeClient([{ ok: true }]);
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full', only: ['r2', 'root'] }, deps);
    assert.equal(result.sent.length, 2);
    assert.ok(fake.sent[0].includes('r2.html'));
    assert.ok(fake.sent[0].includes(manifest.site));
  });

  it('a dry run sends and writes nothing', async () => {
    const manifest = fakeManifest(15);
    const deps = baseDeps(manifest, {
      clientFactory: async () => {
        throw new Error('must not connect');
      }
    });
    const result = await runRefresh({ mode: 'full', dryRun: true }, deps);
    assert.equal(result.sent.length, 0);
    assert.equal(result.pending.length, Object.keys(manifest.urls).length);
    assert.equal(deps.written.length, 0);
  });

  it('resends the same batch once after a small FLOOD_WAIT', async () => {
    class FloodWaitError extends Error {
      constructor(s) {
        super('flood');
        this.seconds = s;
      }
    }
    const manifest = fakeManifest(3);
    const fake = fakeClient([{ throw: new FloodWaitError(5) }, { ok: true }]);
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(fake.sent.length, 1);
    assert.equal(result.floodWaits, 1);
    assert.equal(result.sent.length, Object.keys(manifest.urls).length);
  });

  it('stops on PEER_FLOOD, green, with everything sent so far recorded', async () => {
    class PeerFloodError extends Error {}
    const manifest = fakeManifest(25); // 3 batches
    const fake = fakeClient([{ ok: true }, { ok: true }, { throw: new PeerFloodError() }]);
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.ok(result.stopped);
    assert.equal(result.exitCode, 0);
    assert.equal(result.sent.length, 20);
    assert.equal(result.pending.length, Object.keys(manifest.urls).length - 20);
    assert.ok(fake.closed.value);
  });

  it('is fatal (exit 2) on a dead credential, stopping the run', async () => {
    class AuthKeyUnregisteredError extends Error {}
    const manifest = fakeManifest(5);
    const fake = fakeClient([{ throw: new AuthKeyUnregisteredError() }]);
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.exitCode, 2);
    assert.equal(result.sent.length, 0);
  });

  it('stops cleanly when the time budget runs out', async () => {
    const manifest = fakeManifest(25); // 3 batches
    const fake = fakeClient([{ ok: true }, { ok: true }, { ok: true }]);
    let calls = 0;
    const deps = baseDeps(manifest, {
      clientFactory: fake.client,
      now: () => {
        calls++;
        return calls <= 2 ? 0 : 100 * 60000;
      }
    });
    const result = await runRefresh({ mode: 'full', budgetMinutes: 1 }, deps);
    assert.ok(result.stopped);
    assert.equal(result.exitCode, 0);
    assert.ok(result.sent.length < Object.keys(manifest.urls).length);
  });

  it('excludes not-live urls from sending and reports them as pending', async () => {
    const manifest = fakeManifest(5);
    const notLiveUrl = manifest.site + 'i/r0.html';
    const fake = fakeClient([{ ok: true }]);
    const deps = baseDeps(manifest, {
      clientFactory: fake.client,
      verify: async (picked) => ({
        ready: Object.keys(picked).filter((u) => u !== notLiveUrl),
        notLive: [notLiveUrl]
      })
    });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.deepEqual(result.notLive, [notLiveUrl]);
    assert.ok(result.pending.includes(notLiveUrl));
    assert.ok(!result.sent.includes(notLiveUrl));
  });

  it('--no-verify skips the live check entirely', async () => {
    const manifest = fakeManifest(3);
    const fake = fakeClient([{ ok: true }]);
    let verifyCalled = false;
    const deps = baseDeps(manifest, {
      clientFactory: fake.client,
      verify: async () => {
        verifyCalled = true;
        return { ready: [], notLive: [] };
      }
    });
    const result = await runRefresh({ mode: 'full', noVerify: true }, deps);
    assert.equal(verifyCalled, false);
    assert.equal(result.sent.length, Object.keys(manifest.urls).length);
  });

  it('writes a --result entry alongside state after each message', async () => {
    const manifest = fakeManifest(3);
    const fake = fakeClient([{ ok: true }]);
    const deps = baseDeps(manifest, { clientFactory: fake.client, withResult: true });
    await runRefresh({ mode: 'full' }, deps);
    assert.equal(deps.results.length, 1);
    assert.equal(Object.keys(deps.results[0].urls).length, Object.keys(manifest.urls).length);
  });

  it('the summary numbers always add up to the stale count', async () => {
    const manifest = fakeManifest(37); // 38 urls -> 4 batches
    const fake = fakeClient([{ ok: true }, { ok: true }, { ok: true }, { ok: true }]);
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.sent.length + result.pending.length, Object.keys(manifest.urls).length);
  });
});
