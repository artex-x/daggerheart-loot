/*
  The usage report's pure half (usage-lib.mjs): the slope and the
  forecast, the states at each threshold, the MAU plan, the Management API
  answer in every shape, the keep-alive's 2xx rule and headers, the
  summary's privacy and the exit code. .claude/README.md, "Usage monitoring".
*/
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FREE_PLAN,
  evaluate,
  exitCodeOf,
  fetchApiCounts,
  forecast,
  keepAlive,
  mauPlan,
  parseApiCounts,
  renderSummary,
  slopePerDay,
  stateOf
} from './usage-lib.mjs';

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/usage/${name}`, import.meta.url), 'utf8'));
const TODAY = '2026-09-27';
const DAY_MS = 86_400_000;
const dayBefore = (n, from = TODAY) =>
  new Date(Date.parse(`${from}T00:00:00Z`) - n * DAY_MS).toISOString().slice(0, 10);
const snapshot = (over = {}) => ({
  db_bytes: 100_000_000,
  storage_bytes: 0,
  storage_objects: 0,
  mau: 10,
  auth_users: 20,
  ...over
});
const rowOf = (rows, key) => rows.find((r) => r.key === key || r.label === key);

/* A stub fetch: answers `status` with `body`, and records each call. */
function stubFetch(status, body = null) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  return { impl, calls };
}

const hangingFetch = (_url, init) =>
  new Promise((_, reject) => {
    init.signal.addEventListener('abort', () => {
      reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    });
  });

describe('slopePerDay', () => {
  it('returnsNullSlopeBelowSevenSnapshots', () => {
    const points = fixture('history.short.json').map((h) => ({
      day: h.taken_on,
      value: h.metrics.db_bytes
    }));
    points.push({ day: TODAY, value: 306_000_000 });
    assert.equal(points.length, 6);
    assert.equal(slopePerDay(points), null);
  });

  it('computesBytesPerDayFromGrowingHistory', () => {
    const history = fixture('history.growing.json');
    assert.equal(history.length, 28);
    const points = history.map((h) => ({ day: h.taken_on, value: h.metrics.db_bytes }));
    const slope = slopePerDay(points);
    assert.ok(Math.abs(slope - 30_000_000 / 27) < 1, `slope ${slope}`);
  });

  it('usesRealDatesAcrossAGap', () => {
    const days = [0, 1, 2, 3, 10, 11, 12];
    const points = days.map((d) => ({ day: dayBefore(12 - d), value: d * 1000 }));
    assert.ok(Math.abs(slopePerDay(points) - 1000) < 1e-9);
  });

  it('slopeSkipsNullPoints', () => {
    const real = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: dayBefore(10 - d), value: d * 500 }));
    const withNulls = [
      ...real,
      { day: dayBefore(2), value: null },
      { day: dayBefore(1), value: null }
    ];
    assert.equal(slopePerDay(withNulls), slopePerDay(real));
    assert.ok(Math.abs(slopePerDay(withNulls) - 500) < 1e-9);
    assert.equal(slopePerDay([...real.slice(1), { day: dayBefore(0), value: null }]), null);
    // A night without Storage access leaves the Storage forecast unbent.
    const history = real.map((p) => ({ taken_on: p.day, metrics: { storage_bytes: p.value } }));
    history.push(
      { taken_on: dayBefore(2), metrics: { storage_bytes: null } },
      { taken_on: dayBefore(1), metrics: { storage_bytes: null } }
    );
    const f = forecast({
      key: 'storage_bytes',
      now: 5000,
      limit: FREE_PLAN.storage_bytes,
      kind: 'cumulative',
      history,
      today: TODAY
    });
    assert.ok(Math.abs(f.perDay - 500) < 1e-9, `perDay ${f.perDay}`);
  });
});

describe('forecast', () => {
  it('forecastsDaysLeftForCumulativeMetric', () => {
    const history = [6, 5, 4, 3, 2, 1].map((n) => ({
      taken_on: dayBefore(n),
      metrics: { db_bytes: 406_000_000 - n * 1_000_000 }
    }));
    const f = forecast({
      key: 'db_bytes',
      now: 406_000_000,
      limit: FREE_PLAN.db_bytes,
      kind: 'cumulative',
      history,
      today: TODAY
    });
    assert.ok(Math.abs(f.perDay - 1_000_000) < 1e-6);
    assert.equal(f.daysLeft, 94);
    assert.ok(Math.abs(f.usedPct - 81.2) < 1e-9);
    // The growing fixture forecasts too.
    const g = forecast({
      key: 'db_bytes',
      now: 331_000_000,
      limit: FREE_PLAN.db_bytes,
      kind: 'cumulative',
      history: fixture('history.growing.json'),
      today: TODAY
    });
    assert.equal(g.daysLeft, 152);
    // Below seven points it names how many days it has.
    const s = forecast({
      key: 'db_bytes',
      now: 306_000_000,
      limit: FREE_PLAN.db_bytes,
      kind: 'cumulative',
      history: fixture('history.short.json'),
      today: TODAY
    });
    assert.equal(s.daysLeft, null);
    assert.equal(s.note, 'forecast: n/a (6 of 7 days)');
    const first = forecast({
      key: 'db_bytes',
      now: 1,
      limit: FREE_PLAN.db_bytes,
      kind: 'cumulative',
      history: [],
      today: TODAY
    });
    assert.equal(first.note, 'forecast: n/a (1 of 7 days)');
  });

  it('reportsNoGrowthForFlatHistory', () => {
    const f = forecast({
      key: 'db_bytes',
      now: 300_000_000,
      limit: FREE_PLAN.db_bytes,
      kind: 'cumulative',
      history: fixture('history.flat.json'),
      today: TODAY
    });
    assert.equal(f.perDay, 0);
    assert.equal(f.daysLeft, null);
    assert.equal(f.note, 'no growth');
  });

  it('projectsMauToMonthEnd', () => {
    // 20,000 by the 10th of a 30-day month: 2,000 a day.
    const f = forecast({
      key: 'mau',
      now: 20_000,
      limit: FREE_PLAN.mau,
      kind: 'monthly',
      history: [],
      today: '2026-09-10'
    });
    assert.equal(f.perDay, 2000);
    assert.equal(f.projected, 60_000);
    assert.equal(f.daysLeft, 15);
    assert.equal(f.usedPct, 40);
    assert.equal(stateOf(f), 'warn');
  });

  it('reportsResetsFirstWhenMauCrossingIsNextMonth', () => {
    const f = forecast({
      key: 'mau',
      now: 1000,
      limit: FREE_PLAN.mau,
      kind: 'monthly',
      history: [],
      today: '2026-09-10'
    });
    assert.equal(f.projected, 3000);
    assert.equal(f.daysLeft, null);
    assert.equal(f.note, 'resets first');
    assert.equal(stateOf(f), 'ok');
  });
});

describe('stateOf', () => {
  it('warnsAtFiftyPercent', () => {
    assert.equal(stateOf({ usedPct: 49.9, daysLeft: null }), 'ok');
    assert.equal(stateOf({ usedPct: 50, daysLeft: null }), 'warn');
    const rows = evaluate(snapshot({ db_bytes: 250_000_000 }), [], TODAY, {});
    assert.equal(rowOf(rows, 'db_bytes').state, 'warn');
  });

  it('warnsUnderSixtyDaysLeft', () => {
    assert.equal(stateOf({ usedPct: 10, daysLeft: 60 }), 'ok');
    assert.equal(stateOf({ usedPct: 10, daysLeft: 59 }), 'warn');
  });

  it('failsAtEightyPercent', () => {
    assert.equal(stateOf({ usedPct: 79.9, daysLeft: null }), 'warn');
    assert.equal(stateOf({ usedPct: 80, daysLeft: null }), 'fail');
    const rows = evaluate(snapshot({ storage_bytes: 800_000_000 }), [], TODAY, {});
    assert.equal(rowOf(rows, 'storage_bytes').state, 'fail');
  });

  it('failsUnderFourteenDaysLeft', () => {
    assert.equal(stateOf({ usedPct: 10, daysLeft: 14 }), 'warn');
    assert.equal(stateOf({ usedPct: 10, daysLeft: 13 }), 'fail');
  });
});

describe('evaluate', () => {
  it('infoRowsNeverWarn', () => {
    const history = [7, 6, 5, 4, 3, 2, 1].map((n) => ({
      taken_on: dayBefore(n),
      metrics: { auth_users: 1_000_000 * (8 - n), storage_objects: 1_000_000 * (8 - n) }
    }));
    const rows = evaluate(
      snapshot({ auth_users: 9_000_000, storage_objects: 9_000_000 }),
      history,
      TODAY,
      {}
    );
    const info = rows.filter((r) => r.kind === 'info');
    assert.deepEqual(
      info.map((r) => r.key),
      ['auth_users', 'storage_objects']
    );
    for (const r of info) {
      assert.equal(r.state, 'info');
      assert.ok(r.perDay > 0);
    }
  });

  it('warnsWhenNoMauSource', () => {
    const rows = evaluate(snapshot({ mau: null }), [], TODAY, {});
    const mau = rowOf(rows, 'mau');
    assert.equal(mau.state, 'warn');
    assert.equal(mau.note, 'no MAU source');
    assert.equal(mau.usedPct, null);
  });

  it('warnsWhenNoStorageAccess', () => {
    const rows = evaluate(
      snapshot({ storage_bytes: null, storage_objects: null }),
      [],
      TODAY,
      {}
    );
    const storage = rowOf(rows, 'storage_bytes');
    assert.equal(storage.state, 'warn');
    assert.equal(storage.note, 'no storage.objects access');
    assert.equal(storage.usedPct, null);
    assert.equal(rowOf(rows, 'storage_objects').now, null);
    const text = renderSummary({
      today: TODAY,
      rows,
      tables: [],
      nearLimits: { owners_near: 0, owners_over: 0, lists_near: 0, lists_over: 0 },
      points: 1
    });
    assert.match(
      text,
      /\| Storage \| - \| 1000\.0 MB \| - \| - \| - \| warn \| no storage\.objects access \|/
    );
  });
});

describe('mauPlan', () => {
  it('plansMauFromRefreshedAtThenUpdatedAt', () => {
    const base = [
      'auth.users.last_sign_in_at',
      'auth.sessions.user_id',
      'auth.sessions.created_at'
    ];
    assert.deepEqual(
      mauPlan([...base, 'auth.sessions.updated_at', 'auth.sessions.refreshed_at']),
      { users: true, sessions: 'refreshed_at' }
    );
    assert.deepEqual(mauPlan([...base, 'auth.sessions.updated_at']), {
      users: true,
      sessions: 'updated_at'
    });
    assert.deepEqual(mauPlan(base), { users: true, sessions: null });
  });

  it('plansMauWithoutSessionsTable', () => {
    assert.deepEqual(mauPlan(['auth.users.last_sign_in_at', 'auth.users.id']), {
      users: true,
      sessions: null
    });
    assert.deepEqual(mauPlan([]), { users: false, sessions: null });
  });
});

describe('the Management API', () => {
  it('parsesApiCountsFixture', () => {
    assert.deepEqual(parseApiCounts(fixture('api-counts.ok.json')), {
      auth: 15,
      rest: 400,
      storage: 1,
      realtime: 5
    });
  });

  it('throwsOnApiCountsWithoutResult', () => {
    assert.throws(
      () => parseApiCounts(fixture('api-counts.error.json')),
      /The usage\.api-counts response has no result array/
    );
    assert.throws(() => parseApiCounts(null), /no result array/);
  });

  it('treatsResponseWithoutResultAsUnavailable', async () => {
    const { impl, calls } = stubFetch(200, fixture('api-counts.error.json'));
    const r = await fetchApiCounts({ ref: 'abc', token: 'tok', fetchImpl: impl });
    assert.deepEqual(r, { ok: false, fatal: false, reason: 'no result array' });
    assert.equal(
      calls[0].url,
      'https://api.supabase.com/v1/projects/abc/analytics/endpoints/usage.api-counts?interval=1day'
    );
    assert.equal(calls[0].init.headers.Authorization, 'Bearer tok');
    const ok = await fetchApiCounts({
      ref: 'abc',
      token: 'tok',
      fetchImpl: stubFetch(200, fixture('api-counts.ok.json')).impl
    });
    assert.deepEqual(ok, {
      ok: true,
      counts: { auth: 15, rest: 400, storage: 1, realtime: 5 }
    });
  });

  it('treats401And403AsFatal', async () => {
    for (const status of [401, 403]) {
      const r = await fetchApiCounts({
        ref: 'abc',
        token: 't',
        fetchImpl: stubFetch(status).impl
      });
      assert.deepEqual(r, { ok: false, fatal: true, reason: `HTTP ${status}` });
      const rows = evaluate(snapshot(), [], TODAY, { requests: r });
      assert.equal(rowOf(rows, 'requests').state, 'fail');
      assert.equal(exitCodeOf(rows, r.fatal), 1);
    }
  });

  it('treats429And500AndTimeoutAsUnavailable', async () => {
    for (const status of [429, 500]) {
      const r = await fetchApiCounts({
        ref: 'abc',
        token: 't',
        fetchImpl: stubFetch(status).impl
      });
      assert.deepEqual(r, { ok: false, fatal: false, reason: `HTTP ${status}` });
    }
    const t = await fetchApiCounts({
      ref: 'abc',
      token: 't',
      fetchImpl: hangingFetch,
      timeoutMs: 20
    });
    assert.deepEqual(t, { ok: false, fatal: false, reason: 'timeout after 20 ms' });
    const rows = evaluate(snapshot(), [], TODAY, { requests: t });
    const row = rowOf(rows, 'requests');
    assert.equal(row.state, 'warn');
    assert.equal(row.note, 'unavailable (timeout after 20 ms)');
    assert.equal(exitCodeOf(rows, t.fatal), 0);
    assert.equal(rowOf(evaluate(snapshot(), [], TODAY, {}), 'requests').note, 'no token');
  });

  it('treatsStalledBodyAsUnavailable', async () => {
    const stalled = async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) });
    const r = await fetchApiCounts({
      ref: 'abc',
      token: 't',
      fetchImpl: stalled,
      timeoutMs: 20
    });
    assert.deepEqual(r, { ok: false, fatal: false, reason: 'timeout after 20 ms' });
    assert.equal(
      rowOf(evaluate(snapshot(), [], TODAY, { requests: r }), 'requests').state,
      'warn'
    );
  });
});

describe('keepAlive', () => {
  it('keepAliveCountsOnly2xxAsReached', async () => {
    const ok = stubFetch(200, null);
    assert.deepEqual(
      await keepAlive({
        url: 'https://x.supabase.co/',
        key: 'sb_publishable_k',
        fetchImpl: ok.impl
      }),
      { ok: true, status: 200 }
    );
    const { url, init } = ok.calls[0];
    assert.equal(url, 'https://x.supabase.co/rest/v1/rpc/get_shared_list');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.apikey, 'sb_publishable_k');
    assert.equal(init.headers['Content-Type'], 'application/json');
    assert.deepEqual(
      Object.keys(init.headers).filter((h) => h.toLowerCase() === 'authorization'),
      []
    );
    assert.deepEqual(JSON.parse(init.body), { p_token: 'A'.repeat(43) });
    assert.equal(
      rowOf(
        evaluate(snapshot(), [], TODAY, { keepAlive: { ok: true, status: 200 } }),
        'keep-alive'
      ).note,
      'reached'
    );

    for (const status of [401, 404]) {
      const r = await keepAlive({
        url: 'https://x',
        key: 'k',
        fetchImpl: stubFetch(status).impl
      });
      assert.deepEqual(r, { ok: false, status });
    }
    const r401 = await keepAlive({
      url: 'https://x',
      key: 'k',
      fetchImpl: stubFetch(401).impl
    });
    const rows = evaluate(snapshot(), [], TODAY, { keepAlive: r401 });
    const row = rowOf(rows, 'keep-alive');
    assert.equal(row.state, 'warn');
    assert.equal(row.note, 'not reached (HTTP 401)');
    const text = renderSummary({
      today: TODAY,
      rows,
      tables: [],
      nearLimits: { owners_near: 0, owners_over: 0, lists_near: 0, lists_over: 0 },
      points: 1
    });
    assert.ok(text.includes('- keep-alive: not reached (HTTP 401) - warn'), text);
    assert.equal(exitCodeOf(rows, false), 0);
  });

  it('keepAliveWarnsOnNetworkError', async () => {
    const failing = async () => {
      throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } });
    };
    const r = await keepAlive({ url: 'https://x', key: 'k', fetchImpl: failing });
    assert.deepEqual(r, { ok: false, reason: 'network error: ENOTFOUND' });
    const row = rowOf(evaluate(snapshot(), [], TODAY, { keepAlive: r }), 'keep-alive');
    assert.equal(row.state, 'warn');
    assert.equal(row.note, 'not reached (network error: ENOTFOUND)');
    const timeout = await keepAlive({
      url: 'https://x',
      key: 'k',
      fetchImpl: hangingFetch,
      timeoutMs: 20
    });
    assert.deepEqual(timeout, { ok: false, reason: 'timeout after 20 ms' });
  });
});

describe('the summary and the exit code', () => {
  it('summaryHoldsNoEmailOrUuid', () => {
    const rows = evaluate(
      snapshot({ db_bytes: 420_000_000 }),
      fixture('history.growing.json'),
      TODAY,
      {
        requests: { ok: true, counts: { auth: 1, rest: 2, storage: 3, realtime: 4 } },
        keepAlive: { ok: true, status: 200 }
      }
    );
    const text = renderSummary({
      today: TODAY,
      rows,
      tables: [
        { name: 'lists', rows: 12, bytes: 81920 },
        { name: 'list_entries', rows: 340, bytes: 163840 },
        { name: 'usage_snapshots', rows: 28, bytes: 49152 }
      ],
      nearLimits: { owners_near: 1, owners_over: 0, lists_near: 2, lists_over: 1 },
      points: 29
    });
    assert.ok(!text.includes('@'), text);
    assert.doesNotMatch(text, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    // The tables run by bytes, largest first.
    assert.ok(text.indexOf('| list_entries |') < text.indexOf('| lists |'));
    assert.match(text, /\| Database \| 420\.0 MB \| 500\.0 MB \| 84\.0 % \|.* FAIL \|/);
    assert.match(text, /- requests: last day: auth 1, rest 2, storage 3, realtime 4/);
    assert.match(text, /- keep-alive: reached - ok/);
    assert.match(text, /Snapshots behind the forecast: 29/);
  });

  it('exitCodeIsOneOnFailOrFatal', () => {
    const ok = evaluate(snapshot(), [], TODAY, {
      requests: { ok: true, counts: { auth: 0, rest: 0, storage: 0, realtime: 0 } },
      keepAlive: { ok: true, status: 204 }
    });
    assert.equal(exitCodeOf(ok, false), 0);
    assert.equal(exitCodeOf(ok, true), 1);
    const warn = evaluate(snapshot({ db_bytes: 300_000_000 }), [], TODAY, {});
    assert.equal(exitCodeOf(warn, false), 0);
    const fail = evaluate(snapshot({ db_bytes: 450_000_000 }), [], TODAY, {});
    assert.equal(exitCodeOf(fail, false), 1);
  });
});
