/*
  Pure logic for the Telegram link-preview refresher: no network, no
  filesystem, no clock, no process. Everything that touches the outside world
  arrives as an argument (readImage, client, verify, sleep, now, random,
  writeState, writeResult, log) - see run.mjs and manifest.mjs for the wiring,
  and docs/tg-preview.md for the operator-facing behaviour this implements.

  Design reference: issues/tg-preview-refresh/plan.md, sections 3-5.
*/
import { createHash } from 'node:crypto';

// The bot's only documented bulk figure (context.md). The press cost is per
// URL and identical at any batch size, so batching only shapes the send
// axis - the largest documented batch is the fewest sends.
export const PER_MESSAGE = 10;
// Between messages; the wait for the bot's button messages (section 5.5) is
// folded into this, not added on top. [min, max) ms, jittered by `random()`.
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
// Between callback presses - a different RPC method from sends, so never
// rested on the send-axis clock; insurance on a days-old account.
export const PRESS_PACE_MS = [1000, 2000];
// Extra polls when fewer button messages than links have arrived yet - the
// bot fetches every page before it can answer for it.
export const BUTTON_WAIT_ROUNDS = 6;
export const BUTTON_WAIT_MS = 5000;
// `limit` when reading replies newer than the sent message; 11 are expected
// per batch (one summary + one per link).
export const BUTTON_FETCH = 50;
// How many recent chat messages are read at run start to find pressable
// button messages that need no new send (resumability, plan.md section 3.4).
export const RECOVER_SCAN = 200;
// Matched by exact button text - never parsed from the bot's prose.
export const UPDATE_BUTTON = 'Update with content';
// @WebpageBot's own per-user attempt quota (plan.md 3.4, "The bot's own
// attempt quota") - a third limit, independent of Telegram's flood control,
// that binds before either axis above does. The only measurement is that 115
// presses in one run tripped it; 50 deliberately under-shoots, because the
// costs are asymmetric - over-shooting costs a ~54-minute lockout plus the
// sends already spent, under-shooting costs one extra two-minute run.
// `--press-limit` raises it once runs at 50 have gone through cleanly.
export const PRESS_LIMIT = 50;

// The one sentence of @WebpageBot's prose that reaches control flow -
// plan.md section 2's carve-out from the "never parse the bot's text" rule.
// Module-private: nothing outside botThrottle matches on it. The rule around
// it is asymmetric by construction - a match can only withhold confirmation
// and stop the run; no text, recognised or not, ever grants confirmation.
const THROTTLE_MATCH = /too many attempts/i;

// null when `text` is not a throttle refusal; otherwise `{ seconds }`, the
// first integer immediately before "second(s)" in the text, or `null` when
// the sentence carries no seconds figure (still a throttle either way).
export function botThrottle(text) {
  if (!text || !THROTTLE_MATCH.test(text)) return null;
  const m = text.match(/(\d+)\s*seconds?/i);
  return { seconds: m ? Number(m[1]) : null };
}

function throttleReason(t) {
  return 'bot throttled' + (t.seconds != null ? ': retry in ' + t.seconds + 's' : '');
}

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
  // Telegram delivered the callback query but the bot did not answer inside
  // its own window - neither a retry nor a stop; confirmation falls back to
  // the photo check (plan.md section 3.4).
  if (name === 'BotResponseTimeoutError' || (err && err.errorMessage === 'BOT_RESPONSE_TIMEOUT')) {
    return { unanswered: true };
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
  '--press-limit': 'pressLimit',
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
    pressLimit: PRESS_LIMIT,
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
      if (key === 'limit' || key === 'pressLimit' || key === 'maxWaitS' || key === 'budgetMinutes') {
        // A NaN here would silently mean "send nothing" or "no budget",
        // both exit 0 - the same species of lie the state's evidence rule
        // exists to remove, so a bad number is a thrown error, not a no-op.
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          throw new Error(a + ' must be a number, got ' + value);
        }
        opts[key] = n;
      } else if (key === 'only') {
        opts[key] = value.split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        opts[key] = value;
      }
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

function stripSlash(u) {
  return u.endsWith('/') ? u.slice(0, -1) : u;
}

function updateButtonData(m) {
  const b = m.buttons.find((btn) => btn.text === UPDATE_BUTTON);
  return b ? b.data : null;
}

// Matches the bot's button messages to the URLs a run cares about, by exact
// `media.webpage.url` equality with one trailing-slash fallback - the root
// is the only URL Telegram could plausibly canonicalise; nothing else is
// normalised. Never matches by position or count. The newest (highest id)
// message wins when several answer the same URL. A message with text but no
// webpage media is the bot's plain summary, collected verbatim for logging,
// never parsed for control flow (plan.md section 5.5).
export function matchButtons(messages, urls) {
  const byUrl = new Map();
  const byStripped = new Map();
  const summary = [];

  for (const m of messages) {
    const data = updateButtonData(m);
    if (m.url === null || data === null) {
      if (m.url === null && m.text) summary.push(m.text);
      continue;
    }
    const existing = byUrl.get(m.url);
    if (existing && existing.id >= m.id) continue;
    const entry = { id: m.id, data, photoId: m.photoId };
    byUrl.set(m.url, entry);
    const stripped = stripSlash(m.url);
    const existingS = byStripped.get(stripped);
    if (!existingS || existingS.id < m.id) byStripped.set(stripped, entry);
  }

  const matched = {};
  const unmatched = [];
  for (const url of urls) {
    const entry = byUrl.get(url) || byStripped.get(stripSlash(url));
    if (entry) matched[url] = entry;
    else unmatched.push(url);
  }
  return { matched, unmatched, summary };
}

// Phase 1 (recovery) then phase 2 (send-and-press) - plan.md section 5.2,
// steps 4-13. `deps.manifest` and `deps.state` are already-built/already-read
// values (see run.mjs); the rest are the seams that make this testable
// without a network or a clock.
export async function runRefresh(opts, deps) {
  const { mode, dryRun, limit, only, maxWaitS, noVerify, budgetMinutes } = opts;
  // Same default-when-absent pattern as maxWaitS (relied on by decide()'s own
  // default): a literal test object that omits pressLimit still gets the
  // real budget rather than an unbounded one.
  const pressLimit = opts.pressLimit == null ? PRESS_LIMIT : opts.pressLimit;
  const { manifest, state, client, verify, sleep, now, random, writeState, writeResult, log } = deps;

  let todo = stale(manifest, state, mode);
  if (only && only.length) {
    const wanted = new Set(only);
    todo = todo.filter((url) => wanted.has(idOf(url, manifest.site)));
  }

  function baseResult() {
    return {
      sent: [],
      pending: [],
      notLive: [],
      unmatched: [],
      pressed: 0,
      confirmed: [],
      photo: { changed: 0, same: 0, none: 0 },
      floodWaits: 0,
      stopped: null,
      exitCode: 0
    };
  }

  if (todo.length === 0) {
    log('nothing to refresh');
    return baseResult();
  }

  let ready = todo;
  let notLive = [];
  if (!noVerify) {
    const v = await verify(pick(manifest.urls, todo));
    ready = v.ready;
    notLive = v.notLive;
  }

  if (dryRun) {
    let batches = chunk(ready, PER_MESSAGE);
    if (limit != null) batches = batches.slice(0, limit);
    log(
      todo.length +
        ' urls stale, ' +
        ready.length +
        ' ready, up to ' +
        batches.length +
        ' messages, ' +
        ready.length +
        ' presses (press budget ' +
        pressLimit +
        ')'
    );
    batches.slice(0, 3).forEach((b, i) => log('batch ' + (i + 1) + ': ' + b.join(', ')));
    if (notLive.length) log('not live (' + notLive.length + '): ' + notLive.join(', '));
    const result = baseResult();
    result.pending = todo;
    result.notLive = notLive;
    return result;
  }

  if (ready.length === 0) {
    log('nothing ready to send (' + notLive.length + ' not live)');
    const result = baseResult();
    result.pending = todo;
    result.notLive = notLive;
    return result;
  }

  const cx = await client();

  // `--mode full` treats every URL as stale on every run, so a press budget
  // smaller than the stale set cannot finish it in one run and the next run
  // re-presses the same recovered buttons - a livelock the budget bounds but
  // does not cure (plan.md 3.4, "`--mode full` is not chunkable"). This is
  // advice for the owner, not a stop: the run still makes whatever progress
  // the budget allows.
  if (mode === 'full' && pressLimit < todo.length) {
    log(
      'warning: --mode full cannot finish ' +
        todo.length +
        ' stale url(s) with a press budget of ' +
        pressLimit +
        ' in one run; chunked reindexing uses the default incremental mode - see docs/tg-preview.md step G'
    );
  }

  const deadline = budgetMinutes != null ? now() + budgetMinutes * 60000 : null;
  let floodWaits = 0;
  let stopped = null;
  let exitCode = 0;
  // One run-scoped allowance spanning both phases - the bot's quota does not
  // care which phase a press came from (plan.md 3.4).
  let pressBudget = pressLimit;

  // The shared retry table (plan.md section 3.4): checked before every send
  // and every press attempt, and before every wait a retry would start - a
  // wait that would end past the deadline is refused rather than begun.
  async function attempt(action) {
    let n = 0;
    for (;;) {
      if (deadline != null && now() >= deadline) {
        return { stopped: 'budget exhausted' };
      }
      try {
        const value = await action();
        return { value };
      } catch (err) {
        const d = decide(err, { attempt: n, maxWaitS });
        if (d.unanswered) return { unanswered: true };
        if (d.retry) {
          if (WAIT_ERRORS.has(err && err.constructor && err.constructor.name)) floodWaits++;
          if (deadline != null && now() + d.waitMs > deadline) {
            return { stopped: 'flood wait of ' + Math.round(d.waitMs / 1000) + 's would exceed the budget' };
          }
          n++;
          await sleep(d.waitMs);
          continue;
        }
        if (d.fatal) return { stopped: d.reason, exitCode: 2 };
        return { stopped: d.reason };
      }
    }
  }

  async function pressOne(entry) {
    if (pressBudget <= 0) return { stopped: 'press budget reached' };
    // Decremented whether or not the attempt succeeds - a refused attempt
    // still counts against the bot's quota (plan.md 3.4).
    pressBudget--;
    const r = await attempt(() => cx.press(entry.id, entry.data));
    if (r.stopped) return r;
    if (r.unanswered) return { unanswered: true };
    const text = r.value && r.value.text;
    const throttle = botThrottle(text);
    if (throttle) return { stopped: throttleReason(throttle) };
    return { answered: true, text };
  }

  // Presses `urlsInOrder`'s matches, in that order, paced by PRESS_PACE_MS
  // and never rested (presses are a different method from sends); re-fetches
  // once by id afterwards for the photo delta, which gates confirmation only
  // in the unanswered case and is telemetry otherwise - the photo-id trap:
  // an unchanged photo is not evidence of failure when the press was
  // acknowledged (plan.md section 3.4).
  async function pressGroup(urlsInOrder, matched) {
    const pressedList = [];
    let stop = null;
    let code = 0;

    for (const url of urlsInOrder) {
      const entry = matched[url];
      if (!entry) continue;
      const r = await pressOne(entry);
      if (r.stopped) {
        stop = r.stopped;
        code = r.exitCode || 0;
        break;
      }
      pressedList.push({ url, id: entry.id, photoBefore: entry.photoId, answered: !!r.answered });
      const pace = PRESS_PACE_MS[0] + random() * (PRESS_PACE_MS[1] - PRESS_PACE_MS[0]);
      await sleep(pace);
    }

    const ids = pressedList.map((p) => p.id);
    const refetched = ids.length ? await cx.byIds(ids) : [];
    const photoAfter = new Map(refetched.map((m) => [m.id, m.photoId]));

    const confirmed = [];
    const photo = { changed: 0, same: 0, none: 0 };
    for (const p of pressedList) {
      const after = photoAfter.has(p.id) ? photoAfter.get(p.id) : undefined;
      const delta = after === undefined ? 'same' : after == null ? 'none' : after !== p.photoBefore ? 'changed' : 'same';
      photo[delta]++;
      if (p.answered || delta === 'changed') confirmed.push(p.url);
    }

    return { confirmed, photo, pressedCount: pressedList.length, stopped: stop, exitCode: code };
  }

  // Carry-forward write of state and --result: everything the state already
  // had for records still in the manifest, overwritten with the fresh
  // fingerprint for every URL confirmed so far this run (plan.md 5.4).
  async function record(confirmedSoFar) {
    const carried = {};
    for (const url of Object.keys(state.urls || {})) {
      if (url in manifest.urls) carried[url] = state.urls[url];
    }
    const nextUrls = sortedMap({ ...carried, ...pick(manifest.urls, confirmedSoFar) });
    await writeState({ version: 1, site: manifest.site, urls: nextUrls });
    if (writeResult) await writeResult({ urls: pick(manifest.urls, confirmedSoFar) });
  }

  const sent = [];
  const confirmedAll = [];
  const unmatchedAll = [];
  const photoTotals = { changed: 0, same: 0, none: 0 };
  let pressedTotal = 0;

  function addPhoto(p) {
    photoTotals.changed += p.changed;
    photoTotals.same += p.same;
    photoTotals.none += p.none;
  }

  function finish() {
    const confirmedSet = new Set(confirmedAll);
    const pending = todo.filter((u) => !confirmedSet.has(u));
    log('refreshed ' + confirmedAll.length + ', pending ' + pending.length);
    return {
      sent,
      pending,
      notLive,
      unmatched: unmatchedAll,
      pressed: pressedTotal,
      confirmed: confirmedAll,
      photo: photoTotals,
      floodWaits,
      stopped,
      exitCode
    };
  }

  // Phase 1 - recovery: a button message already in the chat is a cheaper
  // retry - no new send, but still a press from the same budget (plan.md
  // section 3.4). Every URL matched here - confirmed or not - is removed
  // from `ready` so phase 2 never re-sends it in the same run.
  const scan = await cx.incoming({ limit: RECOVER_SCAN });
  const recovery = matchButtons(scan, ready);
  const recoveredUrls = Object.keys(recovery.matched);
  if (recoveredUrls.length) {
    const g = await pressGroup(recoveredUrls, recovery.matched);
    pressedTotal += g.pressedCount;
    confirmedAll.push(...g.confirmed);
    addPhoto(g.photo);
    if (g.stopped) {
      stopped = g.stopped;
      exitCode = g.exitCode;
    }
    log(
      'phase 1: pressed ' +
        g.pressedCount +
        ', confirmed ' +
        g.confirmed.length +
        ' (photo changed ' +
        g.photo.changed +
        ', same ' +
        g.photo.same +
        ', none ' +
        g.photo.none +
        ')'
    );
    await record(confirmedAll);
  }
  const recoveredSet = new Set(recoveredUrls);
  ready = ready.filter((u) => !recoveredSet.has(u));

  if (stopped) {
    await cx.close();
    return finish();
  }

  let batches = chunk(ready, PER_MESSAGE);
  if (limit != null) batches = batches.slice(0, limit);

  let sinceRest = 0;

  batchLoop: for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    // A send whose buttons cannot be afforded is pure waste on the scarcer
    // axis - stopped, never trimmed: re-chunking mid-run would make --limit
    // mean something different on the last batch (plan.md 3.4).
    if (pressBudget < PER_MESSAGE) {
      stopped = 'press budget too low for another batch';
      exitCode = 0;
      break batchLoop;
    }

    const sendOutcome = await attempt(() => cx.send(batch.join('\n')));
    if (sendOutcome.stopped) {
      stopped = sendOutcome.stopped;
      exitCode = sendOutcome.exitCode || 0;
      break batchLoop;
    }
    const sentId = sendOutcome.value.id;
    sent.push(...batch);

    const paceMs = PACE_MS[0] + random() * (PACE_MS[1] - PACE_MS[0]);
    // The reply wait is folded into the pace, not added on top of it.
    await sleep(paceMs);

    let replies = await cx.incoming({ afterId: sentId, limit: BUTTON_FETCH });
    let m = matchButtons(replies, batch);
    // The bot's summary can itself be a throttle refusal - checked on every
    // round so the run does not burn BUTTON_WAIT_ROUNDS x BUTTON_WAIT_MS
    // waiting for buttons that are never coming (plan.md 3.4).
    let summaryThrottle = m.summary.map(botThrottle).find(Boolean) || null;
    let rounds = 0;
    while (!summaryThrottle && m.unmatched.length && rounds < BUTTON_WAIT_ROUNDS) {
      rounds++;
      await sleep(BUTTON_WAIT_MS);
      replies = await cx.incoming({ afterId: sentId, limit: BUTTON_FETCH });
      m = matchButtons(replies, batch);
      summaryThrottle = m.summary.map(botThrottle).find(Boolean) || null;
    }
    if (m.summary.length) log('bot: ' + m.summary[m.summary.length - 1]);
    if (summaryThrottle) {
      stopped = throttleReason(summaryThrottle);
      exitCode = 0;
      break batchLoop;
    }
    if (m.unmatched.length) {
      unmatchedAll.push(...m.unmatched);
      m.unmatched.forEach((u) => log('no button message for ' + u));
    }

    const matchedUrls = batch.filter((u) => m.matched[u]);
    const g = await pressGroup(matchedUrls, m.matched);
    pressedTotal += g.pressedCount;
    confirmedAll.push(...g.confirmed);
    addPhoto(g.photo);

    await record(confirmedAll);

    log(
      'batch ' +
        (i + 1) +
        '/' +
        batches.length +
        ': sent ' +
        batch.length +
        ', buttons ' +
        matchedUrls.length +
        ', pressed ' +
        g.pressedCount +
        ', confirmed ' +
        g.confirmed.length +
        ' (photo changed ' +
        g.photo.changed +
        ', same ' +
        g.photo.same +
        ', none ' +
        g.photo.none +
        ')'
    );

    if (g.stopped) {
      stopped = g.stopped;
      exitCode = g.exitCode;
      break batchLoop;
    }

    sinceRest++;
    if (sinceRest >= REST_EVERY) {
      await sleep(REST_MS);
      sinceRest = 0;
    }
  }

  await cx.close();
  return finish();
}
