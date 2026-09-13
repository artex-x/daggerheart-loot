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

// Small Msg builders (the shape client.mjs's `plain()` mapper produces) -
// shared by the matchButtons and runRefresh suites below.
function buttonMsg(id, url, photoId = null) {
  return {
    id,
    text: '',
    url,
    pending: false,
    photoId,
    buttons: [{ text: lib.UPDATE_BUTTON, data: Buffer.from('press-' + id) }]
  };
}
function summaryMsg(id, text = 'Link previews was updated successfully. Check them out!') {
  return { id, text, url: null, pending: false, photoId: null, buttons: [] };
}

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
  class BotResponseTimeoutError extends Error {
    constructor() {
      super('timeout');
      this.errorMessage = 'BOT_RESPONSE_TIMEOUT';
    }
  }
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

  it('BotResponseTimeoutError is neither a retry nor a stop - the press was delivered', () => {
    assert.deepEqual(lib.decide(new BotResponseTimeoutError(), {}), { unanswered: true });
  });

  it('also matches BOT_RESPONSE_TIMEOUT by errorMessage alone', () => {
    const err = new Error('x');
    err.errorMessage = 'BOT_RESPONSE_TIMEOUT';
    assert.deepEqual(lib.decide(err, {}), { unanswered: true });
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

describe('botThrottle', () => {
  it('recognises the measured sentence and pulls out the seconds', () => {
    const t = lib.botThrottle('Sorry, too many attempts. Please try again in 3213 seconds.');
    assert.deepEqual(t, { seconds: 3213 });
  });

  it('case and surrounding words do not matter', () => {
    const t = lib.botThrottle('TOO MANY ATTEMPTS!! retry in 90 SECONDS please');
    assert.deepEqual(t, { seconds: 90 });
  });

  it('a throttle sentence with no seconds figure is still a throttle', () => {
    assert.deepEqual(lib.botThrottle('Sorry, too many attempts. Please try again later.'), { seconds: null });
  });

  it('the bot\'s normal summary is not a throttle', () => {
    assert.equal(lib.botThrottle('Link previews was updated successfully. Check them out!'), null);
  });

  it('an empty string and null are not throttles', () => {
    assert.equal(lib.botThrottle(''), null);
    assert.equal(lib.botThrottle(null), null);
    assert.equal(lib.botThrottle(undefined), null);
  });
});

describe('parseArgs', () => {
  it('defaults to an incremental, verifying, non-dry run', () => {
    const o = lib.parseArgs([]);
    assert.equal(o.mode, 'incremental');
    assert.equal(o.dryRun, false);
    assert.equal(o.noVerify, false);
    assert.equal(o.limit, null);
    assert.equal(o.pressLimit, lib.PRESS_LIMIT);
    assert.equal(o.only, null);
  });

  it('parses every flag', () => {
    const o = lib.parseArgs([
      '--mode', 'full',
      '--dry-run',
      '--limit', '3',
      '--press-limit', '7',
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
    assert.equal(o.pressLimit, 7);
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

  it('--limit 0 is legal (phase 1 only, send nothing)', () => {
    const o = lib.parseArgs(['--limit', '0']);
    assert.equal(o.limit, 0);
  });

  it('throws on a non-numeric --limit/--press-limit/--max-wait/--budget-minutes rather than silently no-op-ing', () => {
    assert.throws(() => lib.parseArgs(['--limit', 'ten']), /--limit must be a number, got ten/);
    assert.throws(() => lib.parseArgs(['--press-limit', 'ten']), /--press-limit must be a number, got ten/);
    assert.throws(() => lib.parseArgs(['--max-wait', 'x']), /--max-wait must be a number, got x/);
    assert.throws(() => lib.parseArgs(['--budget-minutes', 'x']), /--budget-minutes must be a number, got x/);
  });

  it('throws on a negative --limit', () => {
    assert.throws(() => lib.parseArgs(['--limit', '-1']), /--limit must be a number, got -1/);
  });
});

describe('matchButtons', () => {
  function noButtonWebpage(id, url) {
    return { id, text: '', url, pending: false, photoId: null, buttons: [] };
  }

  it('matches by exact media.webpage.url', () => {
    const msgs = [buttonMsg(1, 'https://x/a'), buttonMsg(2, 'https://x/b')];
    const { matched, unmatched } = lib.matchButtons(msgs, ['https://x/a', 'https://x/b']);
    assert.deepEqual(Object.keys(matched).sort(), ['https://x/a', 'https://x/b']);
    assert.deepEqual(unmatched, []);
  });

  it('a message without webpage media (the summary) is never a button message', () => {
    const msgs = [summaryMsg(1)];
    const { matched, unmatched, summary } = lib.matchButtons(msgs, ['https://x/a']);
    assert.deepEqual(matched, {});
    assert.deepEqual(unmatched, ['https://x/a']);
    assert.deepEqual(summary, [msgs[0].text]);
  });

  it('a message with a webpage but without the UPDATE_BUTTON button is not one either, and is not the summary', () => {
    const msgs = [noButtonWebpage(1, 'https://x/a')];
    const { matched, unmatched, summary } = lib.matchButtons(msgs, ['https://x/a']);
    assert.deepEqual(matched, {});
    assert.deepEqual(unmatched, ['https://x/a']);
    assert.deepEqual(summary, []);
  });

  it('the newest of duplicate button messages wins', () => {
    const msgs = [buttonMsg(1, 'https://x/a'), buttonMsg(5, 'https://x/a'), buttonMsg(3, 'https://x/a')];
    const { matched } = lib.matchButtons(msgs, ['https://x/a']);
    assert.equal(matched['https://x/a'].id, 5);
  });

  it('the trailing-slash fallback matches the root; an unrelated URL is not normalised', () => {
    const msgs = [buttonMsg(1, 'https://x/'), buttonMsg(2, 'https://x/i/other.html')];
    const { matched, unmatched } = lib.matchButtons(msgs, ['https://x', 'https://x/i/a.html']);
    assert.equal(matched['https://x'].id, 1);
    assert.deepEqual(unmatched, ['https://x/i/a.html']);
  });

  it('unmatched URLs are reported in input order', () => {
    const msgs = [buttonMsg(1, 'https://x/b')];
    const { unmatched } = lib.matchButtons(msgs, ['https://x/a', 'https://x/b', 'https://x/c']);
    assert.deepEqual(unmatched, ['https://x/a', 'https://x/c']);
  });

  it('a message that looks like our own echo (webpage present, no matching button) is ignored: not matched, not summarised', () => {
    // incoming() already filters `!m.out` at the port boundary (client.mjs);
    // this proves matchButtons stays safe even if such a message reached it.
    const echo = noButtonWebpage(1, 'https://x/a');
    const { matched, unmatched, summary } = lib.matchButtons([echo], ['https://x/a']);
    assert.deepEqual(matched, {});
    assert.deepEqual(unmatched, ['https://x/a']);
    assert.deepEqual(summary, []);
  });
});

describe('runRefresh', () => {
  function fakeManifest(n) {
    const site = 'https://x/';
    const urls = { [site]: 'root-fp' };
    for (let i = 0; i < n; i++) urls[site + 'i/r' + i + '.html'] = 'fp' + i;
    return { site, urls, missing: [] };
  }

  function repliesFor(urlsList, baseId, photoId = null) {
    const msgs = [summaryMsg(baseId)];
    urlsList.forEach((url, i) => msgs.push(buttonMsg(baseId + 1 + i, url, photoId)));
    return msgs;
  }

  // `send` is consumed one entry per cx.send() call ({ok:true} succeeds,
  // {throw:err} throws); `incoming` is a queue of canned Msg[] answers, one
  // per call (the first call is always phase 1's recovery scan); `press` is
  // consumed one entry per cx.press() call; `photoAfter` backs byIds's photo
  // lookup by message id.
  function fakeClient({ send = [], incoming = [], press = [], photoAfter = new Map() } = {}) {
    let sendIdx = 0;
    let pressIdx = 0;
    let nextId = 9000;
    const queue = incoming.slice();
    const sent = [];
    const pressedCalls = [];
    const closed = { value: false };
    const incomingCalls = { count: 0 };
    return {
      async client() {
        return {
          async send(text) {
            const step = send[sendIdx++];
            if (step && step.throw) throw step.throw;
            const id = nextId++;
            sent.push({ id, text });
            return { id };
          },
          async incoming() {
            incomingCalls.count++;
            return queue.length ? queue.shift() : [];
          },
          async byIds(ids) {
            return ids
              .filter((id) => photoAfter.has(id))
              .map((id) => ({
                id,
                text: '',
                url: null,
                pending: false,
                photoId: photoAfter.get(id),
                buttons: []
              }));
          },
          async press(id, data) {
            pressedCalls.push({ id, data });
            const step = press[pressIdx++];
            if (step && step.throw) throw step.throw;
            return { text: (step && step.text) || 'ok' };
          },
          async close() {
            closed.value = true;
          }
        };
      },
      sent,
      pressedCalls,
      closed,
      incomingCalls
    };
  }

  function baseDeps(manifest, extra = {}) {
    const written = [];
    const results = [];
    const logs = [];
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
      log: (msg) => logs.push(msg)
    };
    deps.written = written;
    deps.results = results;
    deps.logs = logs;
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
    assert.deepEqual(result, {
      sent: [],
      pending: [],
      notLive: [],
      unmatched: [],
      pressed: 0,
      confirmed: [],
      photo: { newId: 0, sameId: 0, none: 0, unseen: 0 },
      floodWaits: 0,
      stopped: null,
      exitCode: 0
    });
  });

  it('sends batches in manifest order, presses every button, and writes state after each batch', async () => {
    const manifest = fakeManifest(25); // 26 urls -> chunks of 10, 10, 6
    const batches = lib.chunk(Object.keys(manifest.urls), 10);
    const incoming = [[]]; // phase 1: nothing to recover
    const press = [];
    let baseId = 1000;
    for (const b of batches) {
      incoming.push(repliesFor(b, baseId));
      baseId += b.length + 100;
      b.forEach(() => press.push({ text: 'ok' }));
    }
    const fake = fakeClient({ incoming, press });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(fake.sent.length, 3);
    assert.equal(fake.sent[0].text.split('\n').length, 10);
    assert.equal(fake.sent[2].text.split('\n').length, 6);
    assert.equal(result.confirmed.length, 26);
    assert.equal(result.pending.length, 0);
    assert.equal(result.pressed, 26);
    assert.equal(deps.written.length, 3);
    assert.ok(fake.closed.value);
  });

  it('--limit sends at most that many messages, the rest pending', async () => {
    const manifest = fakeManifest(25);
    const batches = lib.chunk(Object.keys(manifest.urls), 10);
    const b0 = batches[0];
    const fake = fakeClient({
      incoming: [[], repliesFor(b0, 1000)],
      press: b0.map(() => ({ text: 'ok' }))
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full', limit: 1 }, deps);
    assert.equal(fake.sent.length, 1);
    assert.equal(result.confirmed.length, 10);
    assert.equal(result.confirmed.length + result.pending.length, Object.keys(manifest.urls).length);
    assert.ok(result.pending.length > 0);
  });

  it('--only narrows to the given record ids, "root" included', async () => {
    const manifest = fakeManifest(5);
    const wanted = [manifest.site, manifest.site + 'i/r2.html'];
    const fake = fakeClient({
      incoming: [[], repliesFor(wanted, 1000)],
      press: wanted.map(() => ({ text: 'ok' }))
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full', only: ['r2', 'root'] }, deps);
    assert.equal(result.confirmed.length, 2);
    assert.ok(fake.sent[0].text.includes('r2.html'));
    assert.ok(fake.sent[0].text.includes(manifest.site));
  });

  it('a dry run sends and writes nothing, and never loads the client', async () => {
    const manifest = fakeManifest(15);
    const deps = baseDeps(manifest, {
      clientFactory: async () => {
        throw new Error('must not connect');
      }
    });
    const result = await runRefresh({ mode: 'full', dryRun: true }, deps);
    assert.equal(result.confirmed.length, 0);
    assert.equal(result.pending.length, Object.keys(manifest.urls).length);
    assert.equal(deps.written.length, 0);
  });

  it('resends the same batch once after a small FLOOD_WAIT on a send', async () => {
    class FloodWaitError extends Error {
      constructor(s) {
        super('flood');
        this.seconds = s;
      }
    }
    const manifest = fakeManifest(3); // 4 urls, 1 batch
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({
      send: [{ throw: new FloodWaitError(5) }, { ok: true }],
      incoming: [[], repliesFor(urls, 1000)],
      press: urls.map(() => ({ text: 'ok' }))
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(fake.sent.length, 1);
    assert.equal(result.floodWaits, 1);
    assert.equal(result.confirmed.length, urls.length);
  });

  it('stops on PEER_FLOOD on a send, green, with everything confirmed so far recorded', async () => {
    class PeerFloodError extends Error {}
    const manifest = fakeManifest(25); // 3 batches
    const batches = lib.chunk(Object.keys(manifest.urls), 10);
    const fake = fakeClient({
      send: [{ ok: true }, { ok: true }, { throw: new PeerFloodError() }],
      incoming: [[], repliesFor(batches[0], 1000), repliesFor(batches[1], 2000)],
      press: [...batches[0], ...batches[1]].map(() => ({ text: 'ok' }))
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.ok(result.stopped);
    assert.equal(result.exitCode, 0);
    assert.equal(result.confirmed.length, 20);
    assert.equal(result.pending.length, Object.keys(manifest.urls).length - 20);
    assert.ok(fake.closed.value);
  });

  it('is fatal (exit 2) on a dead credential on a send, stopping the run', async () => {
    class AuthKeyUnregisteredError extends Error {}
    const manifest = fakeManifest(5);
    const fake = fakeClient({ send: [{ throw: new AuthKeyUnregisteredError() }], incoming: [[]] });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.exitCode, 2);
    assert.equal(result.confirmed.length, 0);
  });

  it('a FLOOD_WAIT on a press re-presses the same button', async () => {
    class FloodWaitError extends Error {
      constructor(s) {
        super('flood');
        this.seconds = s;
      }
    }
    const manifest = fakeManifest(3); // 4 urls, 1 batch
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({
      incoming: [[], repliesFor(urls, 1000)],
      press: [
        { throw: new FloodWaitError(5) },
        { text: 'ok' },
        { text: 'ok' },
        { text: 'ok' },
        { text: 'ok' }
      ]
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.floodWaits, 1);
    assert.equal(result.confirmed.length, urls.length);
    assert.equal(fake.pressedCalls.length, urls.length + 1);
  });

  it('PEER_FLOOD on a press stops with earlier presses recorded', async () => {
    class PeerFloodError extends Error {}
    const manifest = fakeManifest(3); // 4 urls
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({
      incoming: [[], repliesFor(urls, 1000)],
      press: [{ text: 'ok' }, { text: 'ok' }, { throw: new PeerFloodError() }]
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.ok(result.stopped);
    assert.equal(result.exitCode, 0);
    assert.equal(result.confirmed.length, 2);
    assert.ok(fake.closed.value);
  });

  it('is fatal (exit 2) on a dead credential mid-press', async () => {
    class AuthKeyUnregisteredError extends Error {}
    const manifest = fakeManifest(3);
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({
      incoming: [[], repliesFor(urls, 1000)],
      press: [{ text: 'ok' }, { throw: new AuthKeyUnregisteredError() }]
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.exitCode, 2);
    assert.equal(result.confirmed.length, 1);
  });

  it('an unanswered press is confirmed when the photo id is new, and pending when it is not', async () => {
    class BotResponseTimeoutError extends Error {
      constructor() {
        super('timeout');
        this.errorMessage = 'BOT_RESPONSE_TIMEOUT';
      }
    }
    const manifest = fakeManifest(2); // 3 urls: root, r0, r1
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({
      incoming: [[], repliesFor(urls, 1000, 'before')],
      press: urls.map(() => ({ throw: new BotResponseTimeoutError() })),
      photoAfter: new Map([
        [1001, 'after'], // newId
        [1002, 'before'], // sameId
        [1003, null] // no photo at all
      ])
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.confirmed.length, 1);
    assert.equal(result.pending.length, urls.length - 1);
    assert.deepEqual(result.photo, { newId: 1, sameId: 1, none: 1, unseen: 0 });
  });

  it('the photo telemetry is right, and an unchanged/absent photo id is not failure when the press was answered', async () => {
    const manifest = fakeManifest(2); // 3 urls
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({
      incoming: [[], repliesFor(urls, 1000, 'before')],
      press: urls.map(() => ({ text: 'ok' })),
      photoAfter: new Map([
        [1001, 'after'], // newId
        [1002, 'before'], // sameId
        [1003, null] // none
      ])
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.deepEqual(result.photo, { newId: 1, sameId: 1, none: 1, unseen: 0 });
    // Every press was answered, so all three are confirmed regardless of
    // their photo-id delta - the photo-id trap (plan.md section 3.4).
    assert.equal(result.confirmed.length, 3);
  });

  it('a pressed message byIds cannot re-fetch is counted unseen: unconfirmed unanswered, confirmed answered', async () => {
    class BotResponseTimeoutError extends Error {
      constructor() {
        super('timeout');
        this.errorMessage = 'BOT_RESPONSE_TIMEOUT';
      }
    }
    const manifest = fakeManifest(1); // 2 urls: root, r0
    const urls = Object.keys(manifest.urls);
    // photoAfter is left empty: byIds returns nothing for either message id,
    // so the after-press fetch cannot see either one - `unseen`, not `same`.
    const fake = fakeClient({
      incoming: [[buttonMsg(9001, urls[0], 'before'), buttonMsg(9002, urls[1], 'before')]],
      press: [{ throw: new BotResponseTimeoutError() }, { text: 'ok' }]
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.deepEqual(result.photo, { newId: 0, sameId: 0, none: 0, unseen: 2 });
    // The unanswered press stays unconfirmed on an unseen delta; the
    // answered one confirms regardless - the fourth bucket changes neither
    // side of the confirmation rule.
    assert.deepEqual(result.confirmed, [urls[1]]);
    assert.equal(result.pending.length, 1);
    assert.equal(fake.sent.length, 0); // both recovered in phase 1
  });

  it('fewer button messages than links leaves the unmatched ones pending and unrecorded', async () => {
    const manifest = fakeManifest(2); // 3 urls
    const urls = Object.keys(manifest.urls);
    const onlyTwo = urls.slice(0, 2);
    const incoming = [[]];
    for (let i = 0; i <= lib.BUTTON_WAIT_ROUNDS; i++) incoming.push(repliesFor(onlyTwo, 1000));
    const fake = fakeClient({ incoming, press: onlyTwo.map(() => ({ text: 'ok' })) });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.confirmed.length, 2);
    assert.equal(result.pending.length, 1);
    assert.deepEqual(result.unmatched, [urls[2]]);
  });

  it('a button message that arrives late is found on a later wait round', async () => {
    const manifest = fakeManifest(0); // just the root, 1 url
    const rootUrl = manifest.site;
    const fake = fakeClient({
      incoming: [
        [], // phase 1 scan
        [summaryMsg(1000)], // round 0: summary only, no button yet
        repliesFor([rootUrl], 1000) // round 1: the button has arrived
      ],
      press: [{ text: 'ok' }]
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.confirmed.length, 1);
    assert.equal(result.unmatched.length, 0);
  });

  it('phase 1 presses a button message found in the scan and sends nothing for that URL', async () => {
    const manifest = fakeManifest(2); // 3 urls
    const urls = Object.keys(manifest.urls);
    const residueUrl = urls[1];
    const others = urls.filter((u) => u !== residueUrl);
    const fake = fakeClient({
      incoming: [[buttonMsg(9999, residueUrl, 'before')], repliesFor(others, 1000)],
      press: [{ text: 'ok' }, { text: 'ok' }, { text: 'ok' }]
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.confirmed.length, 3);
    assert.equal(fake.sent.length, 1);
    assert.ok(!fake.sent[0].text.includes(residueUrl));
  });

  it('--limit 0 still runs phase 1 (a cheaper press, no new send)', async () => {
    const manifest = fakeManifest(2); // 3 urls
    const urls = Object.keys(manifest.urls);
    const residueUrl = urls[0];
    const fake = fakeClient({
      incoming: [[buttonMsg(9999, residueUrl, 'before')]],
      press: [{ text: 'ok' }]
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full', limit: 0 }, deps);
    assert.equal(fake.sent.length, 0);
    assert.equal(result.confirmed.length, 1);
    assert.equal(result.pending.length, urls.length - 1);
  });

  it('the deadline stops between two presses, with the confirmed ones recorded', async () => {
    const manifest = fakeManifest(15); // 16 urls -> batches of 10, 6
    const batches = lib.chunk(Object.keys(manifest.urls), 10);
    const b0 = batches[0];
    const fake = fakeClient({
      incoming: [[], repliesFor(b0, 1000)],
      press: b0.map(() => ({ text: 'ok' }))
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    // clock-driven `now` (baseDeps default): deadline = 4500ms. The send's
    // pace (4000ms, random()=>0) leaves it open; the first press's pace
    // (1000ms) pushes the clock to 5000ms, past the deadline, so the second
    // press in the batch never starts.
    const result = await runRefresh({ mode: 'full', budgetMinutes: 4500 / 60000 }, deps);
    assert.ok(result.stopped);
    assert.equal(result.exitCode, 0);
    assert.equal(result.confirmed.length, 1);
    assert.ok(result.confirmed.length < b0.length);
  });

  it('a flood wait that would end past the deadline is not started', async () => {
    class FloodWaitError extends Error {
      constructor(s) {
        super('flood');
        this.seconds = s;
      }
    }
    const manifest = fakeManifest(3);
    const fake = fakeClient({ send: [{ throw: new FloodWaitError(500) }], incoming: [[]] });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full', budgetMinutes: 1 }, deps); // deadline = 60000ms
    assert.ok(result.stopped);
    assert.match(result.stopped, /flood wait of 502s would exceed the budget/);
    assert.equal(result.exitCode, 0);
    assert.equal(fake.sent.length, 0);
  });

  it('excludes not-live urls from sending and reports them as pending', async () => {
    const manifest = fakeManifest(5); // 6 urls
    const notLiveUrl = manifest.site + 'i/r0.html';
    const readyUrls = Object.keys(manifest.urls).filter((u) => u !== notLiveUrl);
    const fake = fakeClient({
      incoming: [[], repliesFor(readyUrls, 1000)],
      press: readyUrls.map(() => ({ text: 'ok' }))
    });
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
    assert.ok(!result.confirmed.includes(notLiveUrl));
  });

  it('--no-verify skips the live check entirely', async () => {
    const manifest = fakeManifest(3);
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({ incoming: [[], repliesFor(urls, 1000)], press: urls.map(() => ({ text: 'ok' })) });
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
    assert.equal(result.confirmed.length, urls.length);
  });

  it('writes a --result entry alongside state after each batch', async () => {
    const manifest = fakeManifest(3);
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({ incoming: [[], repliesFor(urls, 1000)], press: urls.map(() => ({ text: 'ok' })) });
    const deps = baseDeps(manifest, { clientFactory: fake.client, withResult: true });
    await runRefresh({ mode: 'full' }, deps);
    assert.equal(deps.results.length, 1);
    assert.equal(Object.keys(deps.results[0].urls).length, urls.length);
  });

  it('confirmed and pending always add up to the stale count', async () => {
    const manifest = fakeManifest(37); // 38 urls -> 4 batches
    const batches = lib.chunk(Object.keys(manifest.urls), 10);
    const incoming = [[]];
    const press = [];
    let baseId = 1000;
    for (const b of batches) {
      incoming.push(repliesFor(b, baseId));
      baseId += b.length + 100;
      b.forEach(() => press.push({ text: 'ok' }));
    }
    const fake = fakeClient({ incoming, press });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.confirmed.length + result.pending.length, Object.keys(manifest.urls).length);
  });

  // Pass 4 - the bot's own attempt quota (plan.md section 3.4, 10a).

  it('a press answered with the throttle sentence is not recorded and stops the run green, with the presses before it recorded', async () => {
    const manifest = fakeManifest(2); // 3 urls: root, r0, r1
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({
      incoming: [[], repliesFor(urls, 1000)],
      press: [{ text: 'ok' }, { text: 'ok' }, { text: 'Sorry, too many attempts. Please try again in 3213 seconds.' }]
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.confirmed.length, 2);
    assert.equal(result.pending.length, 1);
    assert.match(result.stopped, /bot throttled: retry in 3213s/);
    assert.equal(result.exitCode, 0);
    // The refused press is still an attempt (B4 review nit 2): `pressed`
    // counts all three, not just the two the bot answered normally.
    assert.equal(result.pressed, 3);
    // The throttled URL never reaches any writeState call.
    const thirdUrl = urls[2];
    assert.ok(deps.written.every((s) => !(thirdUrl in s.urls)));
    assert.ok(deps.written.length > 0);
  });

  it('a throttle in the bot\'s summary stops the run without pressing that batch, and does not burn the remaining button-wait rounds', async () => {
    const manifest = fakeManifest(2); // 3 urls
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({
      incoming: [[], [summaryMsg(1000, 'Sorry, too many attempts. Please try again in 500 seconds.')]],
      press: []
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full' }, deps);
    assert.equal(result.confirmed.length, 0);
    assert.equal(result.pending.length, urls.length);
    assert.match(result.stopped, /bot throttled: retry in 500s/);
    assert.equal(result.exitCode, 0);
    assert.equal(fake.pressedCalls.length, 0);
    // phase 1's scan (1 call) + exactly one post-send read - no extra
    // BUTTON_WAIT_ROUNDS polling once the summary is recognised as a refusal.
    assert.equal(fake.incomingCalls.count, 2);
  });

  it('the press budget stops a run mid-phase-1, with the confirmed ones recorded', async () => {
    const manifest = fakeManifest(2); // 3 urls
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({
      incoming: [[buttonMsg(9001, urls[0], 'before'), buttonMsg(9002, urls[1], 'before'), buttonMsg(9003, urls[2], 'before')]],
      press: [{ text: 'ok' }, { text: 'ok' }]
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full', pressLimit: 2 }, deps);
    assert.equal(result.confirmed.length, 2);
    assert.equal(result.pending.length, 1);
    assert.equal(result.stopped, 'press budget reached');
    assert.equal(result.exitCode, 0);
    assert.equal(fake.sent.length, 0); // phase 2 never starts
    assert.ok(deps.written.length > 0);
  });

  it('the press budget stops phase 2 before a send when fewer than PER_MESSAGE presses remain, and no send is attempted', async () => {
    const manifest = fakeManifest(9); // 10 urls, 1 batch of 10
    const fake = fakeClient({ incoming: [[]], send: [], press: [] });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full', pressLimit: 5 }, deps);
    assert.equal(fake.sent.length, 0);
    assert.equal(fake.pressedCalls.length, 0);
    assert.equal(result.confirmed.length, 0);
    assert.equal(result.stopped, 'press budget too low for another batch');
    assert.equal(result.exitCode, 0);
  });

  it('phase 1 and phase 2 draw on one press budget', async () => {
    const manifest = fakeManifest(10); // 11 urls: root + r0..r9
    const urls = Object.keys(manifest.urls);
    const recoveredUrl = urls[0];
    const rest = urls.filter((u) => u !== recoveredUrl); // 10 urls -> exactly one batch
    const fake = fakeClient({
      incoming: [[buttonMsg(9000, recoveredUrl, 'before')]],
      press: [{ text: 'ok' }]
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    // Budget 10: phase 1 spends 1, leaving 9 - one short of PER_MESSAGE (10)
    // for phase 2's only batch. A separate-budget implementation would let
    // phase 2 send (it would see a fresh 10); the shared budget stops it.
    const result = await runRefresh({ mode: 'full', pressLimit: 10 }, deps);
    assert.equal(result.confirmed.length, 1);
    assert.equal(result.pending.length, rest.length);
    assert.equal(result.stopped, 'press budget too low for another batch');
    assert.equal(fake.sent.length, 0);
  });

  it('--press-limit 0 sends nothing and presses nothing and exits green', async () => {
    const manifest = fakeManifest(4); // 5 urls
    const fake = fakeClient({ incoming: [[]], send: [], press: [] });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    const result = await runRefresh({ mode: 'full', pressLimit: 0 }, deps);
    assert.equal(fake.sent.length, 0);
    assert.equal(fake.pressedCalls.length, 0);
    assert.equal(result.confirmed.length, 0);
    assert.equal(result.exitCode, 0);
  });

  it('--mode full with a press budget below the stale count logs the warning', async () => {
    const manifest = fakeManifest(4); // 5 urls
    const fake = fakeClient({ incoming: [[]], send: [], press: [] });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    await runRefresh({ mode: 'full', pressLimit: 2 }, deps);
    assert.ok(deps.logs.some((l) => l.includes('--mode full') && l.includes('2')));
  });

  it('does not warn under --mode full when the press budget covers the stale count', async () => {
    const manifest = fakeManifest(2); // 3 urls
    const urls = Object.keys(manifest.urls);
    const fake = fakeClient({
      incoming: [[], repliesFor(urls, 1000)],
      press: urls.map(() => ({ text: 'ok' }))
    });
    const deps = baseDeps(manifest, { clientFactory: fake.client });
    await runRefresh({ mode: 'full', pressLimit: lib.PRESS_LIMIT }, deps);
    assert.ok(!deps.logs.some((l) => l.includes('--mode full cannot finish')));
  });

  it('the dry-run counts line names the press budget', async () => {
    const manifest = fakeManifest(4); // 5 urls
    const deps = baseDeps(manifest, {});
    await runRefresh({ mode: 'full', dryRun: true, pressLimit: 17 }, deps);
    assert.ok(deps.logs.some((l) => l.endsWith('(press budget 17)')));
  });
});
