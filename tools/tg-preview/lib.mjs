/*
  Pure logic for the Telegram link-preview refresher: no network, no
  filesystem, no clock, no process. Everything that touches the outside world
  arrives as an argument (readImage, client, verify, sleep, now, random,
  writeState, writeResult, log) - see run.mjs and manifest.mjs for the wiring,
  and docs/tg-preview.md for the operator-facing behaviour this implements.

  Design reference: issues/tg-preview-refresh/plan.md, sections 3-5.
*/
import { createHash } from 'node:crypto';

// The bot's only documented bulk figure (context.md).
export const PER_MESSAGE = 10;
// Between messages; the wait for the bot's reply (section 5.5) is folded into
// this, not added on top. [min, max) ms, jittered by `random()`.
export const PACE_MS = [4000, 6000];
// Undocumented flood limits: a periodic pause is cheap insurance.
export const REST_EVERY = 25;
export const REST_MS = 30000;
// The largest FLOOD_WAIT the run will sleep through; anything bigger stops
// the run rather than blocking a CI job for that long.
export const MAX_WAIT_S = 600;
// Transport errors (socket, DNS), not RPC errors: a few quick retries.
export const NET_RETRIES = 3;
export const NET_RETRY_MS = 10000;
// Pages edges can still serve the old bytes for a few minutes after a
// deploy; the live check waits out up to this many rounds.
export const VERIFY_ROUNDS = 5;
export const VERIFY_ROUND_MS = 60000;
export const VERIFY_CONCURRENCY = 6;

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function sortedMap(map) {
  const out = {};
  for (const key of Object.keys(map || {}).sort()) out[key] = map[key];
  return out;
}

function pick(map, keys) {
  const out = {};
  for (const key of keys) if (key in map) out[key] = map[key];
  return out;
}

// A shared link (.../#/i/<id>) is, to Telegram, the root URL - fragments
// never reach the crawler - so the root's own preview needs refreshing too.
export function urls(records, site) {
  const out = [site];
  const seen = new Set(out);
  for (const it of records) {
    const u = site + 'i/' + it.id + '.html';
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

const ENTITY = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };
function decodeEntities(s) {
  return s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ENTITY[e]);
}

function metaTag(html, prop) {
  const re = new RegExp('<meta\\s+property="og:' + prop + '"\\s+content="([^"]*)"', 'i');
  const m = html.match(re);
  return m ? decodeEntities(m[1]) : '';
}

// Telegram's preview is built from exactly these three tags - not the rest
// of the stub's markup, which is why hashing whole files would over-trigger.
export function extractMeta(html) {
  return {
    title: metaTag(html, 'title'),
    description: metaTag(html, 'description'),
    image: metaTag(html, 'image')
  };
}

// What Telegram would see for one URL, folding in the image bytes so a
// picture swapped under an unchanged og:image is caught too (the root cause
// this whole tool exists for - see context.md).
export function fingerprint(meta, imageSha) {
  return sha256(JSON.stringify([meta.title, meta.description, meta.image, imageSha]));
}

// The basename under `<site>og/`, or null when the image lives somewhere
// else (should not happen for this app's own stubs, but a manifest builder
// should not assume it).
export function imageName(meta, site) {
  const prefix = site + 'og/';
  if (!meta.image || meta.image.indexOf(prefix) !== 0) return null;
  return meta.image.slice(prefix.length);
}

// Fingerprints the root plus one stub per record. `L` is the flat record
// list (`everything(window.LOOT)` in the real tree - see manifest.mjs);
// `renderStub(it)` renders one record's stub HTML in memory. A record whose
// image is missing on disk is reported in `missing` and left out of `urls`:
// that is a data-integrity failure, not something to refresh around.
export function buildManifest({ site, L, renderStub, rootHtml, readImage }) {
  const entries = [[site, rootHtml]];
  for (const it of L) entries.push([site + 'i/' + it.id + '.html', renderStub(it)]);

  const out = {};
  const missing = [];
  for (const [url, html] of entries) {
    const meta = extractMeta(html);
    const name = imageName(meta, site);
    if (!name) {
      out[url] = fingerprint(meta, sha256(Buffer.alloc(0)));
      continue;
    }
    const bytes = readImage(name);
    if (!bytes) {
      missing.push(url);
      continue;
    }
    out[url] = fingerprint(meta, sha256(bytes));
  }
  return { site, urls: out, missing };
}

// What is still stale: everything in `full` mode; in `incremental` mode,
// whatever the manifest's fingerprint disagrees with the state's, including
// every URL when there is no state or the state belongs to a different site
// (the bootstrap rule - plan.md section 3.3). A URL the state remembers but
// the manifest no longer has (a dropped record) is simply not visited.
export function stale(manifest, state, mode) {
  const known = state && state.site === manifest.site && state.urls ? state.urls : {};
  const out = [];
  for (const url of Object.keys(manifest.urls)) {
    if (mode === 'full' || known[url] !== manifest.urls[url]) out.push(url);
  }
  return out;
}

export function chunk(list, n) {
  const out = [];
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
  return out;
}

const WAIT_ERRORS = new Set(['FloodWaitError', 'SlowModeWaitError']);
const FATAL_ERRORS = new Set([
  'AuthKeyUnregisteredError',
  'SessionRevokedError',
  'SessionExpiredError',
  'SessionPasswordNeededError',
  'AuthKeyInvalidError'
]);

// One outcome per teleproto error, matched by class name / `.errorMessage` /
// `.seconds` rather than `instanceof` so this needs no import of teleproto -
// see plan.md section 3.4 for the table this mirrors.
export function decide(err, { attempt = 0, maxWaitS = MAX_WAIT_S } = {}) {
  const name = (err && err.constructor && err.constructor.name) || '';

  if (WAIT_ERRORS.has(name)) {
    const seconds = err.seconds;
    if (typeof seconds === 'number' && seconds <= maxWaitS) {
      return { retry: true, waitMs: (seconds + 2) * 1000 };
    }
    return { stop: true, reason: name + ': ' + seconds + 's exceeds the ' + maxWaitS + 's budget' };
  }
  if (name === 'PeerFloodError') {
    return { stop: true, reason: 'PeerFloodError: the account is limited for today' };
  }
  if (FATAL_ERRORS.has(name)) {
    return { fatal: true, reason: name + ': the credential is dead' };
  }
  // Any other RPCError: teleproto's specific error subclasses all carry
  // `errorMessage`, which is what lets this branch match without importing
  // teleproto's `RPCError` base class.
  if (err && typeof err.errorMessage === 'string') {
    return { stop: true, reason: err.errorMessage };
  }
  // A transport error (socket, DNS): worth a few quick retries.
  if (attempt < NET_RETRIES) {
    return { retry: true, waitMs: NET_RETRY_MS };
  }
  return {
    stop: true,
    reason: 'network error after ' + NET_RETRIES + ' retries: ' + ((err && err.message) || String(err))
  };
}

// Merges a completed run's result onto a (possibly newer) state: ours wins
// per URL, everything else the state already had is kept. Used by CI's
// `--apply` to commit onto a `main` that may have moved since the run
// started (plan.md section 6). A state recorded for a different site is
// discarded rather than merged into.
export function applyResult(state, result, site) {
  const base = state && state.site === site && state.urls ? state.urls : {};
  const merged = { ...base, ...((result && result.urls) || {}) };
  return { version: 1, site, urls: sortedMap(merged) };
}

const FLAGS = {
  '--mode': 'mode',
  '--limit': 'limit',
  '--only': 'only',
  '--max-wait': 'maxWaitS',
  '--budget-minutes': 'budgetMinutes',
  '--state': 'statePath',
  '--result': 'resultPath',
  '--assets': 'assets',
  '--apply': 'apply'
};

export function parseArgs(argv) {
  const opts = {
    mode: 'incremental',
    dryRun: false,
    limit: null,
    only: null,
    maxWaitS: MAX_WAIT_S,
    budgetMinutes: null,
    statePath: null,
    resultPath: null,
    assets: null,
    noVerify: false,
    apply: null
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') {
      opts.dryRun = true;
    } else if (a === '--no-verify') {
      opts.noVerify = true;
    } else if (a in FLAGS) {
      const key = FLAGS[a];
      const value = argv[++i];
      if (key === 'limit' || key === 'maxWaitS' || key === 'budgetMinutes') opts[key] = Number(value);
      else if (key === 'only') opts[key] = value.split(',').map((s) => s.trim()).filter(Boolean);
      else opts[key] = value;
    } else {
      throw new Error('unknown flag: ' + a);
    }
  }
  if (opts.mode !== 'incremental' && opts.mode !== 'full') {
    throw new Error('--mode must be incremental or full, got ' + opts.mode);
  }
  return opts;
}

function idOf(url, site) {
  if (url === site) return 'root';
  const m = url.slice(site.length).match(/^i\/(.+)\.html$/);
  return m ? m[1] : null;
}

// The send loop: steps 4-10 of plan.md section 5.2. `deps.manifest` and
// `deps.state` are already-built/already-read values (see run.mjs); the rest
// are the seams that make this testable without a network or a clock.
export async function runRefresh(opts, deps) {
  const { mode, dryRun, limit, only, maxWaitS, noVerify, budgetMinutes } = opts;
  const { manifest, state, client, verify, sleep, now, random, writeState, writeResult, log } = deps;

  let todo = stale(manifest, state, mode);
  if (only && only.length) {
    const wanted = new Set(only);
    todo = todo.filter((url) => wanted.has(idOf(url, manifest.site)));
  }

  if (todo.length === 0) {
    log('nothing to refresh');
    return { sent: [], pending: [], notLive: [], floodWaits: 0, stopped: null, exitCode: 0 };
  }

  let ready = todo;
  let notLive = [];
  if (!noVerify) {
    const v = await verify(pick(manifest.urls, todo));
    ready = v.ready;
    notLive = v.notLive;
  }

  let batches = chunk(ready, PER_MESSAGE);
  if (limit != null) batches = batches.slice(0, limit);

  if (dryRun) {
    log(todo.length + ' urls, ' + batches.length + ' messages');
    batches.slice(0, 3).forEach((b, i) => log('batch ' + (i + 1) + ': ' + b.join(', ')));
    if (notLive.length) log('not live (' + notLive.length + '): ' + notLive.join(', '));
    return { sent: [], pending: todo, notLive, floodWaits: 0, stopped: null, exitCode: 0 };
  }

  if (batches.length === 0) {
    log('nothing ready to send (' + notLive.length + ' not live)');
    return { sent: [], pending: todo, notLive, floodWaits: 0, stopped: null, exitCode: 0 };
  }

  const cx = await client();

  const sent = [];
  let floodWaits = 0;
  let stopped = null;
  let exitCode = 0;
  const deadline = budgetMinutes != null ? now() + budgetMinutes * 60000 : null;
  let sinceRest = 0;

  batchLoop: for (const batch of batches) {
    if (deadline != null && now() >= deadline) {
      stopped = 'budget exhausted';
      break;
    }

    let attempt = 0;
    for (;;) {
      try {
        const sentAt = now();
        await cx.send(batch.join('\n'));
        const paceMs = PACE_MS[0] + random() * (PACE_MS[1] - PACE_MS[0]);
        // The reply wait is folded into the pace, not added on top of it.
        await sleep(paceMs);
        const reply = await cx.lastReply(sentAt);
        log('sent ' + batch.length + ' url(s); reply: ' + (reply || '(none)'));
        sent.push(...batch);

        // Carry forward whatever the state already had for records still in
        // the manifest (a dropped record is silently left out here - section
        // 5.4), then overwrite with the fresh fingerprint for everything
        // sent so far this run.
        const carried = {};
        for (const url of Object.keys(state.urls || {})) {
          if (url in manifest.urls) carried[url] = state.urls[url];
        }
        const nextUrls = sortedMap({ ...carried, ...pick(manifest.urls, sent) });
        await writeState({ version: 1, site: manifest.site, urls: nextUrls });
        if (writeResult) await writeResult({ urls: pick(manifest.urls, sent) });
        break;
      } catch (err) {
        const d = decide(err, { attempt, maxWaitS });
        if (d.retry) {
          if (WAIT_ERRORS.has(err && err.constructor && err.constructor.name)) floodWaits++;
          attempt++;
          await sleep(d.waitMs);
          continue;
        }
        if (d.fatal) {
          log('fatal: ' + d.reason);
          stopped = d.reason;
          exitCode = 2;
          break batchLoop;
        }
        log('stopping: ' + d.reason);
        stopped = d.reason;
        break batchLoop;
      }
    }

    sinceRest++;
    if (sinceRest >= REST_EVERY) {
      await sleep(REST_MS);
      sinceRest = 0;
    }
  }

  await cx.close();

  const sentSet = new Set(sent);
  const pending = todo.filter((u) => !sentSet.has(u));
  log('refreshed ' + sent.length + ', pending ' + pending.length);
  return { sent, pending, notLive, floodWaits, stopped, exitCode };
}
