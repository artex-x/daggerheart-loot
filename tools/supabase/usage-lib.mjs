/*
  Pure logic of the nightly usage report (usage.mjs, .github/workflows/usage.yml):
  the free-plan limits, the forecast, the states, the summary, and the two
  HTTP calls over an injected fetch. No I/O of its own, so usage-lib.test.mjs
  covers it inside `npm run check`. .claude/README.md, "Usage monitoring".
*/

/** The free-plan quotas the report measures. The decimal reading of
 * "500 MB" and "1 GB" is the smaller one, so the report errs early. */
export const FREE_PLAN = Object.freeze({
  db_bytes: 500_000_000,
  storage_bytes: 1_000_000_000,
  mau: 50_000
});

/** The owner's thresholds (2026-09-26): warn at 50 % or under 60 days
 * left, fail at 80 % or under 14 days left. */
export const THRESHOLDS = Object.freeze({
  warnPct: 50,
  warnDays: 60,
  failPct: 80,
  failDays: 14
});

export const WINDOW_DAYS = 28;
export const MIN_POINTS = 7;
export const KEEP_DAYS = 400;

const DAY_MS = 86_400_000;
const API_BASE = 'https://api.supabase.com';
const SHARE_TOKEN_LENGTH = 43;

/** Returns the UTC date of `date` as `YYYY-MM-DD`. */
export function dayOf(date) {
  return date.toISOString().slice(0, 10);
}

/** Returns the first day of `now`'s month, 00:00 UTC. */
export function monthStart(now) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Returns the MAU sources that exist, from `'<schema>.<table>.<column>'`
 * names: `users` when `auth.users.last_sign_in_at` exists, and `sessions`,
 * the time column of `auth.sessions` (`refreshed_at`, else `updated_at`),
 * or null when the table, its `user_id` or its `created_at` is missing. */
export function mauPlan(columns) {
  const has = new Set(columns);
  let sessions = null;
  if (has.has('auth.sessions.user_id') && has.has('auth.sessions.created_at')) {
    if (has.has('auth.sessions.refreshed_at')) sessions = 'refreshed_at';
    else if (has.has('auth.sessions.updated_at')) sessions = 'updated_at';
  }
  return { users: has.has('auth.users.last_sign_in_at'), sessions };
}

const dayNumber = (day) => Date.parse(`${day}T00:00:00Z`) / DAY_MS;

/** Returns the least-squares slope, units a day, over `[{ day, value }]`,
 * with the real dates as x. Points with a null value are skipped first;
 * below MIN_POINTS the answer is null. */
export function slopePerDay(points) {
  const real = points.filter((p) => p.value !== null && p.value !== undefined);
  if (real.length < MIN_POINTS) return null;
  const xs = real.map((p) => dayNumber(p.day));
  const ys = real.map((p) => Number(p.value));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}

/** Returns the points of `key` from `history` (the snapshots before
 * `today`, `[{ taken_on, metrics }]`) followed by today's value `now`. */
function pointsOf(key, history, today, now) {
  return [
    ...history.map((h) => ({ day: h.taken_on, value: h.metrics?.[key] ?? null })),
    { day: today, value: now }
  ];
}

/** Returns `{ usedPct, perDay, daysLeft, note }` for one metric (and
 * `projected` for a monthly one). `kind` is `cumulative` (a least-squares
 * slope over the history plus today) or `monthly` (the month's rate so far,
 * reset on the 1st). `limit` null gives the growth only. */
export function forecast({ key, now, limit, kind, history, today }) {
  const usedPct = limit ? (now / limit) * 100 : null;
  if (kind === 'monthly') {
    const date = new Date(`${today}T00:00:00Z`);
    const elapsed = date.getUTCDate();
    const inMonth = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
    ).getUTCDate();
    const rate = now / elapsed;
    const projected = Math.round(now + rate * (inMonth - elapsed));
    if (rate <= 0) return { usedPct, perDay: 0, daysLeft: null, projected, note: 'no growth' };
    const days = Math.max(0, Math.floor((limit - now) / rate));
    if (days > inMonth - elapsed) {
      return { usedPct, perDay: rate, daysLeft: null, projected, note: 'resets first' };
    }
    return { usedPct, perDay: rate, daysLeft: days, projected, note: '' };
  }
  const points = pointsOf(key, history, today, now);
  const perDay = slopePerDay(points);
  if (perDay === null) {
    const k = points.filter((p) => p.value !== null).length;
    return {
      usedPct,
      perDay: null,
      daysLeft: null,
      note: `forecast: n/a (${k} of ${MIN_POINTS} days)`
    };
  }
  if (!limit) return { usedPct, perDay, daysLeft: null, note: '' };
  if (perDay <= 0) return { usedPct, perDay, daysLeft: null, note: 'no growth' };
  return {
    usedPct,
    perDay,
    daysLeft: Math.max(0, Math.floor((limit - now) / perDay)),
    note: ''
  };
}

/** Returns `ok`, `warn` or `fail` by THRESHOLDS; a null part is ignored. */
export function stateOf({ usedPct, daysLeft }) {
  const pct = usedPct ?? -1;
  const days = daysLeft ?? Infinity;
  if (pct >= THRESHOLDS.failPct || days < THRESHOLDS.failDays) return 'fail';
  if (pct >= THRESHOLDS.warnPct || days < THRESHOLDS.warnDays) return 'warn';
  return 'ok';
}

const LIMITED = [
  { key: 'db_bytes', label: 'Database', kind: 'cumulative', unit: 'bytes' },
  { key: 'storage_bytes', label: 'Storage', kind: 'cumulative', unit: 'bytes' },
  { key: 'mau', label: 'MAU (estimate)', kind: 'monthly', unit: 'count' }
];
const INFO = [
  { key: 'auth_users', label: 'Accounts', unit: 'count' },
  { key: 'storage_objects', label: 'Storage objects', unit: 'count' },
  // Rows of realtime.messages: one per broadcast, delivered once per
  // subscriber, so the billed messages are at least this many.
  {
    key: 'realtime_rows_24h',
    label: 'Realtime messages (24 h, lower bound)',
    unit: 'count',
    noteKey: 'realtime_note'
  }
];
const MISSING_NOTE = { storage_bytes: 'no storage.objects access', mau: 'no MAU source' };

function requestsRow(requests) {
  const row = { kind: 'check', label: 'requests' };
  if (!requests) return { ...row, state: 'warn', note: 'no token' };
  if (requests.ok) {
    const c = requests.counts;
    return {
      ...row,
      state: 'ok',
      note:
        `last day: auth ${c.auth}, rest ${c.rest}, storage ${c.storage}, realtime ${c.realtime}` +
        ' (egress proxy; billed egress: dashboard only)'
    };
  }
  if (requests.fatal) {
    return {
      ...row,
      state: 'fail',
      note: `the usage token is expired or lacks Usage Analytics read (${requests.reason})`
    };
  }
  return { ...row, state: 'warn', note: `unavailable (${requests.reason})` };
}

function keepAliveRow(result) {
  const row = { kind: 'check', label: 'keep-alive' };
  if (!result) return { ...row, state: 'warn', note: 'not run (no URL or key)' };
  if (result.ok) return { ...row, state: 'ok', note: 'reached' };
  const why = result.status !== undefined ? `HTTP ${result.status}` : result.reason;
  return { ...row, state: 'warn', note: `not reached (${why})` };
}

/** Returns the report's rows: the three limited metrics, the info
 * metrics, then the `requests` and `keep-alive` checks. `history` holds
 * only the days before `today`; today's snapshot is the last point. A null
 * `mau` or `storage_bytes` is a `warn` row that names the missing source.
 * `checks.requests` is fetchApiCounts' answer (absent: no token);
 * `checks.keepAlive` is keepAlive's (absent: no URL or key). */
export function evaluate(snapshot, history, today, checks = {}) {
  const rows = [];
  for (const m of LIMITED) {
    const now = snapshot[m.key];
    const limit = FREE_PLAN[m.key];
    const base = { kind: 'limited', key: m.key, label: m.label, unit: m.unit, now, limit };
    if (now === null || now === undefined) {
      rows.push({
        ...base,
        usedPct: null,
        perDay: null,
        daysLeft: null,
        state: 'warn',
        note: MISSING_NOTE[m.key]
      });
      continue;
    }
    const f = forecast({ key: m.key, now, limit, kind: m.kind, history, today });
    const notes = [f.note];
    if (m.kind === 'monthly') notes.unshift(`projected ${f.projected} at month end`);
    if (m.key === 'storage_bytes' && snapshot.storage_note)
      notes.unshift(snapshot.storage_note);
    rows.push({
      ...base,
      usedPct: f.usedPct,
      perDay: f.perDay,
      daysLeft: f.daysLeft,
      state: stateOf(f),
      note: notes.filter(Boolean).join('; ')
    });
  }
  for (const m of INFO) {
    const now = snapshot[m.key] ?? null;
    const f =
      now === null
        ? { perDay: null, note: '' }
        : forecast({ key: m.key, now, limit: null, kind: 'cumulative', history, today });
    rows.push({
      kind: 'info',
      key: m.key,
      label: m.label,
      unit: m.unit,
      now,
      limit: null,
      usedPct: null,
      perDay: f.perDay,
      daysLeft: null,
      state: 'info',
      note: [m.noteKey && snapshot[m.noteKey], f.note].filter(Boolean).join('; ')
    });
  }
  rows.push(requestsRow(checks.requests), keepAliveRow(checks.keepAlive));
  return rows;
}

/** Returns `{ auth, rest, storage, realtime }`, each `total_*_requests`
 * summed over `result[]`. Throws when the body has no result array. */
export function parseApiCounts(json) {
  if (!json || !Array.isArray(json.result)) {
    throw new Error('The usage.api-counts response has no result array');
  }
  const sum = (field) => json.result.reduce((n, r) => n + (Number(r?.[field]) || 0), 0);
  return {
    auth: sum('total_auth_requests'),
    rest: sum('total_rest_requests'),
    storage: sum('total_storage_requests'),
    realtime: sum('total_realtime_requests')
  };
}

/* Runs `fetchImpl(url, init)` and then `read(res)` under one `timeoutMs`
   limit; answers `{ res, body }`, or `{ reason }` for a network error or the
   timeout. The race also ends a body read that ignores the abort signal. */
async function timedFetch(fetchImpl, url, init, timeoutMs, read) {
  const controller = new AbortController();
  let timer;
  const expired = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('timeout'));
      controller.abort();
    }, timeoutMs);
  });
  const fetched = (async () => {
    const res = await fetchImpl(url, { ...init, signal: controller.signal });
    return { res, body: await read(res) };
  })();
  fetched.catch(() => {});
  expired.catch(() => {});
  try {
    return await Promise.race([fetched, expired]);
  } catch (err) {
    if (controller.signal.aborted) return { reason: `timeout after ${timeoutMs} ms` };
    return { reason: `network error: ${err?.cause?.code ?? err?.message ?? 'unknown'}` };
  } finally {
    clearTimeout(timer);
  }
}

/** Reads the last day's request counts per service from the Management
 * API. Returns `{ ok: true, counts }` or `{ ok: false, fatal, reason }`;
 * only 401 and 403 are fatal (the token), everything else is a warning. */
export async function fetchApiCounts({ ref, token, fetchImpl, timeoutMs = 10000 }) {
  const url = `${API_BASE}/v1/projects/${ref}/analytics/endpoints/usage.api-counts?interval=1day`;
  const { res, body, reason } = await timedFetch(
    fetchImpl,
    url,
    { headers: { Authorization: `Bearer ${token}` } },
    timeoutMs,
    (r) => (r.ok ? r.json().catch(() => null) : undefined)
  );
  if (!res) return { ok: false, fatal: false, reason };
  if (res.status === 401 || res.status === 403) {
    return { ok: false, fatal: true, reason: `HTTP ${res.status}` };
  }
  if (!res.ok) return { ok: false, fatal: false, reason: `HTTP ${res.status}` };
  try {
    return { ok: true, counts: parseApiCounts(body) };
  } catch {
    return { ok: false, fatal: false, reason: 'no result array' };
  }
}

/** Makes one Data API call with the publishable key: `get_shared_list`
 * with a well-formed token that matches no share, so the function reads
 * `list_shares` and answers null. Returns `{ ok: true, status }` for a 2xx
 * answer only, `{ ok: false, status }` for any other status, `{ ok: false,
 * reason }` for a network error or the timeout. The headers are `apikey`
 * and `Content-Type` alone: the gateway verifies a Bearer value as a JWT. */
export async function keepAlive({ url, key, fetchImpl, timeoutMs = 10000 }) {
  const { res, reason } = await timedFetch(
    fetchImpl,
    `${String(url).replace(/\/+$/, '')}/rest/v1/rpc/get_shared_list`,
    {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: 'A'.repeat(SHARE_TOKEN_LENGTH) })
    },
    timeoutMs,
    async (r) => {
      await r.body?.cancel?.().catch(() => {});
    }
  );
  if (!res) return { ok: false, reason };
  return res.status >= 200 && res.status < 300
    ? { ok: true, status: res.status }
    : { ok: false, status: res.status };
}

const MB = 1_000_000;

function amount(value, unit) {
  if (value === null || value === undefined) return '-';
  if (unit === 'bytes') return `${(value / MB).toFixed(1)} MB`;
  return String(Math.round(value));
}

function growth(perDay, unit) {
  if (perDay === null || perDay === undefined) return '-';
  if (unit === 'bytes') return `${(perDay / MB).toFixed(2)} MB`;
  return perDay.toFixed(1);
}

const cell = (text) => String(text).replace(/\|/g, '\\|');

/** Returns the Markdown summary: the metric table, the checks, every
 * `public` table by bytes, the near-limit counts, and the number of
 * snapshots behind the forecast. Totals only: no email, id or list name. */
export function renderSummary({ today, rows, tables, nearLimits, points }) {
  const out = [`## Free-plan usage, ${today}`, ''];
  out.push('| Metric | Now | Limit | Used | Growth a day | Days left | State | Note |');
  out.push('|---|---|---|---|---|---|---|---|');
  for (const r of rows.filter((x) => x.kind !== 'check')) {
    out.push(
      '| ' +
        [
          r.label,
          amount(r.now, r.unit),
          r.limit ? amount(r.limit, r.unit) : '-',
          r.usedPct === null ? '-' : `${r.usedPct.toFixed(1)} %`,
          growth(r.perDay, r.unit),
          r.daysLeft === null ? '-' : String(r.daysLeft),
          r.state === 'fail' ? 'FAIL' : r.state,
          r.note || ''
        ]
          .map(cell)
          .join(' | ') +
        ' |'
    );
  }
  out.push('');
  for (const r of rows.filter((x) => x.kind === 'check')) {
    out.push(`- ${r.label}: ${r.note} - ${r.state === 'fail' ? 'FAIL' : r.state}`);
  }
  out.push('', '### Tables in `public`, by bytes', '');
  out.push('| Table | Rows | Bytes |', '|---|---|---|');
  for (const t of [...tables].sort(
    (a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name)
  )) {
    out.push(`| ${cell(t.name)} | ${t.rows} | ${amount(t.bytes, 'bytes')} |`);
  }
  out.push('', '### Near the count limits', '');
  out.push(
    `- owners at 80 % or more of lists_per_owner: ${nearLimits.owners_near} (above 100 %: ${nearLimits.owners_over})`,
    `- lists at 80 % or more of entries_per_list: ${nearLimits.lists_near} (above 100 %: ${nearLimits.lists_over})`
  );
  out.push(
    '',
    `Snapshots behind the forecast: ${points} (a forecast needs ${MIN_POINTS}).`,
    ''
  );
  return out.join('\n');
}

/** Returns the GitHub annotation lines: `::warning::` for a `warn` row and
 * `::error::` for a `fail` row. */
export function annotationsOf(rows) {
  return rows
    .filter((r) => r.state === 'warn' || r.state === 'fail')
    .map((r) => {
      const parts = [];
      if (r.usedPct !== null && r.usedPct !== undefined)
        parts.push(`${r.usedPct.toFixed(1)} % used`);
      if (r.daysLeft !== null && r.daysLeft !== undefined)
        parts.push(`${r.daysLeft} days left`);
      if (r.note) parts.push(r.note);
      return `::${r.state === 'fail' ? 'error' : 'warning'}::usage: ${r.label}: ${parts.join(', ')}`;
    });
}

/** Returns 1 when any row is `fail` or `fatal` is true, else 0. */
export function exitCodeOf(rows, fatal) {
  return fatal || rows.some((r) => r.state === 'fail') ? 1 : 0;
}
