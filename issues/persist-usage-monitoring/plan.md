# Plan - TASK persist-usage-monitoring (release R11: free-plan usage monitoring)

## Status

- Planning pass 1, 2026-09-25, planner, mode A. Base `da7378cb` (R2's
  local task commit), worktree branch `worktree-agent-acf8d4e7cebcec311`.
- One batch, `B11.1`, implement-ready below (section 8). Not started.
- Slot: after R5 and R5b (roadmap section 9). Dispatch after R5 is live;
  the R5 check of 2026-10-12 keeps priority.
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q1-Q3 of section 10 as
  recommended on 2026-09-26; `B11.1` is written for those answers.
- Decisions recorded with this plan (`docs/decisions/`, 2026-09-25):
  "Production's free-plan usage is reported nightly by its own workflow",
  "The usage history is a table in production that the nightly report
  writes", "The free-tier keep-alive is the usage report's Data API call,
  not the dump" (amends the backup decision).

## 1. Objective and current state

Goal: a nightly report of production's free-plan usage with a forecast,
a warning in the job summary, and a failed run (GitHub's email) before a
limit is near, so the owner tunes the count limits (`npm run limits:set`)
or deletes data in time.

Today nothing measures usage. The owner reads nothing until Supabase
emails after a quota is passed (MAU, egress) or the database turns
read-only at 500 MB (`context.md`, "Platform facts"). The roadmap's
section 15 step 18 is a manual monthly dashboard look for Realtime from
R3 on. `backup.yml` dumps production nightly through the Environment
`production`; its comment calls that run the keep-alive, which the
documentation does not support.

## 2. Scope and non-goals

In scope: database size, per-table rows and bytes, `auth.users` count,
an MAU estimate, Storage bytes and object count (0 until R8), API request
counts per service (egress proxy, through a scoped token), how close the
users come to the count limits, a forecast per limited metric, thresholds,
the job summary, the failed run, the history table, the keep-alive call,
the `tests/derived.js` pins, the runbook and the owner's setup.

Non-goals: billed egress bytes, billed MAU, Realtime peak connections and
messages - no public API returns them (2026-09-25); they stay the owner's
dashboard look (roadmap section 15, step 18, extended in section 11
below). No alert channel other than GitHub's failed-run email. No
automatic limit change: the owner decides. No dashboard page in the app.

## 3. Existing behaviour and code paths

- `.github/workflows/backup.yml`: job `dump`, `environment: production`,
  `permissions: contents: read`, cron `17 3 * * *`, `npm ci` with
  `PUPPETEER_SKIP_DOWNLOAD`, reads `secrets.SUPABASE_DB_URL_PROD`.
- `tools/supabase/db.mjs` `connect(url)`: the one module that opens a
  connection (`postgres`, `ssl: 'require'` for a hosted project, `max: 1`,
  `prepare: false`).
- `tools/supabase/lib.mjs`: `PROJECTS`, `dbUrlProject`, `parseProjectArg`;
  pure, tested by `tools/supabase/lib.test.mjs` inside `npm run check`.
- `tools/supabase/limits.mjs`: the CLI-script shape to copy (argument
  parse, env check, `dbUrlProject` refusal, `main()` guarded by
  `import.meta.url`).
- `public.limit_defaults`, `public.user_limit_overrides`,
  `public.effective_limit(uuid, text)` (R2): the count limits.
- `tests/derived.js` lines 1347-1414: `prodSecretOutsideEnvironment` and the
  `backup.yml` pins.
- `tests/db/` (layer 3, `npm run check:db`): `roles.mjs` six-role helper,
  `limits.test.mjs` the closest model.

## 4. Design

### 4.1 Where it runs: its own workflow `usage.yml`

A new workflow `.github/workflows/usage.yml`, job `report`, cron
`47 3 * * *` (30 minutes after the backup, which took 74 s), plus
`workflow_dispatch`; `environment: production`; `permissions: contents:
read`; `concurrency: { group: usage, cancel-in-progress: false }`;
`timeout-minutes: 10`.

Rejected: a step in `backup.yml`'s `dump` job (the orchestrator's
proposal). A threshold failure would turn the backup run red and email
"backup failed" while the backup is fine; a failed dump would skip the
report; and `derived.js` pins `backup.yml` to what keeps a dump private,
which a report step dilutes. A second job in `backup.yml` fixes the first
two but still sends usage alerts under the name "backup". The cost of the
separate file: a second `npm ci` (about 20 s of runner time a night) and a
second schedule that GitHub disables after 60 days without a push, as it
does `backup.yml`.

### 4.2 Metrics and how each is read

SQL runs over `SUPABASE_DB_URL_PROD` (the session pooler, role `postgres`)
in one read-only transaction; the API call uses the scoped token.

| Metric (snapshot key) | Source | Limit | Kind |
|---|---|---|---|
| `db_bytes` | `select sum(pg_database_size(datname))::bigint from pg_database` (Supabase's own query) | 500 MB = 500,000,000 bytes | cumulative |
| `storage_bytes`, `storage_objects` | `select coalesce(sum((metadata->>'size')::bigint), 0), count(*) from storage.objects` | 1 GB = 1,000,000,000 bytes | cumulative |
| `mau` | distinct user ids from `auth.users` where `last_sign_in_at >= <month start UTC>`, union `auth.sessions` where `coalesce(refreshed_at, updated_at, created_at) >= <month start UTC>` | 50,000 | monthly cycle |
| `auth_users` | `select count(*) from auth.users` | none | info |
| `tables` | for each `pg_tables` row in schema `public`: exact `count(*)` and `pg_total_relation_size` | none | info |
| `near_limits` | owners with `count(lists) >= 0.8 * effective_limit(owner, 'lists_per_owner')`; lists with `count(entries) >= 0.8 * effective_limit(owner, 'entries_per_list')`; a `null` limit never counts | none | info |
| `requests_24h` | `usage.api-counts?interval=1day`, each `total_*_requests` summed over `result[]` | none | info |

Choices inside the table:

- Decimal limits (500,000,000 and 1,000,000,000 bytes) are the smaller
  reading of "500 MB" and "1 GB", so the report errs early.
- MAU: the billing cycle's anchor day is not readable; the calendar month
  in UTC stands in. `auth.sessions` rows vanish at sign-out, and a token
  refresh is not in `auth.users`, so the union is a lower bound. It is
  labelled "estimate" in the summary. The column `refreshed_at` exists in
  current Auth; the step checks `information_schema.columns` and falls back
  to `updated_at` when it is absent.
- Egress: the report shows request counts per service over the last day
  as a trend, labelled "requests (egress proxy; billed egress: dashboard
  only)". It never claims a byte figure.
- Table names come from `pg_tables`; the count query quotes each
  identifier (`sql(name)` in `postgres`), so a table added by a later
  release is counted without a code change.

### 4.3 Where the history lives: a table in production

`public.usage_snapshots (taken_on date primary key, taken_at timestamptz
not null default now(), metrics jsonb not null)`, RLS enabled with no
policy, `revoke all ... from public, anon, authenticated` (the
`limit_defaults` pattern). The report upserts today's row (`on conflict
(taken_on) do update`), so a re-run on the same day replaces it, and
deletes rows older than 400 days. `jsonb` takes the R3 and later keys
without a migration. The table is in `public`, so the nightly
`--schema auth,public` dump backs it up.

| Option | Durable | Private | Write path | Verdict |
|---|---|---|---|---|
| Table in production (recommended) | yes, and in the backup | yes (no grant; the summary is public anyway) | one upsert a night by CI through the Environment | chosen |
| Workflow artifact | 90 days at most; each run must download the last run's (`actions: read`, cross-run `download-artifact` with a run id) | no - public repository | upload per run | rejected: a broken chain loses the history, and the file is public |
| Actions cache | evicted when unused 7 days or when the repository passes 10 GB (least recently used, next to the npm caches) | yes | a new key per run | rejected: an eviction silently resets the forecast |
| Committed file | yes | no - public | `contents: write` for a job that holds the production secret, a push to `main` a night | rejected: widens the production job's token and races the owner's pushes |

The table's own growth is about 2 KB a day (one `jsonb` row); 400 rows
stay under 1 MB. The cost: one migration with a reversal and a layer 3
case (`check:db`, about 9 minutes) in the batch.

### 4.4 Forecast

- Cumulative metrics (`db_bytes`, `storage_bytes`): least-squares slope
  (bytes a day) over the snapshots of the last 28 days, today's value
  included. At least 7 snapshots, else "forecast: n/a (k of 7 days)".
  `days_left = floor((limit - now) / slope)` when the slope is above zero,
  else "no growth".
- Monthly metric (`mau`): `rate = now / days elapsed in the month`
  (today counts as one); `projected = now + rate * days left in the
  month`; `days_left = floor((limit - now) / rate)` only when that day
  falls inside the month, else "resets first". No history needed.
- Info metrics: growth a day from the same least-squares slope when 7
  snapshots exist; no threshold.
- Gaps (a failed night) are fine: the slope uses the real `taken_on`
  dates as x.

### 4.5 Thresholds and states (Q1, owner, 2026-09-26)

| State | Rule (any one) | Effect |
|---|---|---|
| `ok` | none of the below | a row in the summary |
| `warn` | used >= 50 % of the limit, or `days_left` < 60 | a row marked `warn`, plus a `::warning::` annotation |
| `fail` | used >= 80 %, or `days_left` < 14 | a row marked `FAIL`, a `::error::` annotation, exit 1 after the summary is written |

Other outcomes: a SQL error, a refused connection or a failed upsert ->
exit 1 (the report is ours to fix; a read-only database fails here, which
is itself the alert). The token absent -> a `warn` row "requests: no
token". HTTP 401 or 403 -> exit 1 ("the usage token is expired or lacks
Usage Analytics read"). HTTP 429, 5xx, a timeout (10 s) or a response
without `result[]` -> a `warn` row "requests: unavailable (<reason>)";
the API is Beta-grade and must not page the owner nightly on its own.

### 4.6 How the owner is notified

- Every night: `$GITHUB_STEP_SUMMARY` gets one Markdown table (metric,
  now, limit, used %, growth a day, days left, state), then the top five
  tables by bytes, then the near-limit counts, then one line with the
  snapshot count behind the forecast. The same text goes to the log.
- On `fail`: the job exits 1 after the summary; GitHub emails the user who
  created the scheduled workflow (`context.md`, "GitHub"), which is the
  owner pushing `main`. The owner's notification setting must include
  failed Actions runs (setup step 4).
- The summary and log are public (public repository). They hold aggregate
  numbers only - no email, no id, no list name. The owner accepted that
  (Q2, 2026-09-26).

### 4.7 The project-pause question

The documentation defines inactivity as too little "user database
activity" and says "a few user requests to the database each day" keep a
project up; it does not say whether a `pg_dump` over the session pooler
is such a request (`context.md`). The only staff statement confirms that
REST API calls count. So the report makes one Data API call a night with
the public publishable key: `POST <VITE_SUPABASE_URL>/rest/v1/rpc/get_shared_list`
with `{"p_token": "<43 x 'A'>"}` (a well-formed token that matches no
share, so the function reads `list_shares`). Any HTTP answer below 500 is
"reached"; a network error or 5xx is a `warn` row. Its SQL and upsert are
database activity too. Supabase still emails a week before a pause, and
the dump and the report both fail red on a paused project. `backup.yml`'s
comment and the backup decision are corrected in the batch (the decision
file is amended now, with this plan).

### 4.8 Code layout

- `tools/supabase/usage-lib.mjs` (new, pure): `FREE_PLAN` limits,
  `THRESHOLDS`, `monthStart(date)`, `slopePerDay(points)`,
  `forecast(metric, history, now)`, `evaluate(snapshot, history, now)` ->
  rows with states, `parseApiCounts(json)`, `renderSummary(rows, extra)`,
  `exitCodeOf(rows, fatal)`, and the two HTTP calls over an injected
  `fetchImpl`: `fetchApiCounts` and `keepAlive`. No I/O of its own.
  Tested by `tools/supabase/usage-lib.test.mjs` with fixtures in
  `tools/supabase/fixtures/usage/`.
- `tools/supabase/usage.mjs` (new, I/O): `collect(sql, now)` (the SQL of
  4.2), `readHistory(sql, since)`, `saveSnapshot(sql, day, metrics)` (upsert
  plus the 400-day delete), and `main()`. `collect`, `readHistory`
  and `saveSnapshot` are exported for `tests/db/usage.test.mjs`.
- `lib.mjs` is not grown: its header scopes it to the release tools, and
  the usage logic is a separate concern with its own test file.

### 4.9 Tested without production

- Layer 1 (`npm run check`): `usage-lib.test.mjs` over fixtures -
  `api-counts.ok.json` (shaped from the OpenAPI schema
  `V1GetUsageApiCountResponse`), `api-counts.error.json` (`{ "error":
  "..." }`), `history.growing.json` (28 days, db 300 -> 330 MB),
  `history.short.json` (5 days), `history.flat.json`. Cases below in
  `B11.1`'s acceptance.
- Layer 3 (`npm run check:db`): `tests/db/usage.test.mjs` runs `collect`
  on the local stack after seeding two users, lists and one
  `storage.objects` row; `saveSnapshot` twice on one day leaves one row;
  a 401-day-old row is deleted; `anon` and `authenticated` cannot select
  or insert `usage_snapshots`. The reversibility gate covers the new
  migration and reversal.
- `fetchApiCounts` and `keepAlive` live in `usage-lib.mjs` and take an
  injected `fetchImpl` (no global `fetch`), so layer 1 covers 200, 401,
  403, 429, 500, a timeout and a bad body with a stub. `usage.mjs` passes
  `globalThis.fetch`.
- `tests/derived.js` pins the workflow (4.10).
- The first real run is the owner's dispatch on `main` after the push
  (setup step 6); its summary is recorded in the closeout.

### 4.10 What `tests/derived.js` pins

A `usage.yml` block after the `backup.yml` block:

- the file exists; `cron: '47 3 * * *'`; `workflow_dispatch`;
- `permissions:` is `contents: read` only (the same regex as backup);
- the job declares `environment: production` and reads
  `SUPABASE_DB_URL_PROD`; `node tools/supabase/usage.mjs --project prod`
  is a step;
- no `upload-artifact` and no `contents: write` in the file;
- `prodSecretOutsideEnvironment(text, secret)` gains a secret argument and
  runs for `SUPABASE_DB_URL_PROD` and `SUPABASE_USAGE_TOKEN_PROD` over
  `ci.yml`, `backup.yml` and `usage.yml`.

## 5. Contracts and behaviour that stay stable

No public contract changes: no route, link, generated data or asset path.
`backup.yml` changes by one comment line only; its pins stay. No app code
changes; no `check:built`. The privacy page is unchanged: the new table
holds no personal data.

## 6. Documentation per batch

- `.claude/README.md`: a new subsection "### Usage monitoring" after
  "Backups and restore": what runs when, the metric table (short), the
  thresholds, the runbook (symptom: a red `usage` run email; diagnosis:
  the run's summary; recovery: `limits:set`, data cleanup, or accept and
  raise the note), the owner's setup steps (section 9), the token
  rotation. "Where the secrets live" names `usage.yml`'s `report` job as a
  third reader of `SUPABASE_DB_URL_PROD` and the new secret.
- `docs/specs/COVERAGE.md`: the `usage-lib.test.mjs` paragraph after the
  `lib.test.mjs` one; `tests/db/usage.test.mjs` in the layer 3 list; the
  `derived.js` pins sentence gains `usage.yml`.
- `docs/specs/META.md`: one sentence after the backup sentence: "A nightly
  job reports the free-plan usage to the owner (`.claude/README.md`,
  "Usage monitoring")."

## 7. Batches: gates, cost, review, split criterion

| Batch | Goal | Gates (cost, 2026-09-25 host figures) | Review | Split criterion |
|---|---|---|---|---|
| `B11.1` | The whole release: migration and reversal, `usage-lib.mjs` and `usage.mjs`, `usage.yml`, `derived.js` pins, layer 1 and layer 3 tests, docs | `npm run check` (~348 s), `npm run check:db` (~9 min) - about 15 minutes; CI on the push | required: a `supabase/` batch (schema rule) and a workflow that reads a production secret | - (one batch: every piece shares the same two gates, no route or public contract, and the harness reaches all of it) |

Total gate cost: about 15 minutes, one green pass. The first live run is
the owner's dispatch after the push (section 9, step 6); a defect it finds
is a new commit, because the push closes the amend window.

## 8. Batch `B11.1` - free-plan usage report (implement-ready)

Objective: a nightly `usage.yml` run reads production's usage, stores a
snapshot, forecasts, writes a summary table, warns at the warn rule and
fails at the fail rule.

Prerequisites: R5 is closed; Q1-Q3 answered as recommended (2026-09-26).

In scope: sections 4.1-4.10 and 6. Out of scope: Realtime rows (R3 adds
them, section 11), a bytes estimate of egress, any app change.

Files:

| File | Change |
|---|---|
| `supabase/migrations/<stamp>_usage_snapshots.sql` | new; `<stamp>` is the next free minute after the newest migration on `main` (`.claude/README.md`, "Migration names") |
| `supabase/reversals/<stamp>_usage_snapshots.sql` | new; `drop table public.usage_snapshots;` |
| `tools/supabase/usage-lib.mjs` | new, pure |
| `tools/supabase/usage-lib.test.mjs` | new |
| `tools/supabase/fixtures/usage/*.json` | new, five files (4.9) |
| `tools/supabase/usage.mjs` | new, I/O and `main()` |
| `tests/db/usage.test.mjs` | new, layer 3 |
| `.github/workflows/usage.yml` | new |
| `.github/workflows/backup.yml` | line 12 comment only |
| `tests/derived.js` | the `usage.yml` block; `prodSecretOutsideEnvironment` takes the secret name |
| `package.json` | the `check` script's `node --test ... tools/supabase/lib.test.mjs` step also runs `tools/supabase/usage-lib.test.mjs` |
| `.claude/README.md`, `docs/specs/COVERAGE.md`, `docs/specs/META.md` | section 6 |
| `docs/decisions/2026-09-25-the-usage-history-is-a-table-in-production.md` and the two others | only if an owner answer changes them; then `node tools/decisions.js` |

Steps:

1. Migration. Header comment (1-3 lines) citing `docs/DECISIONS.md`,
   2026-09-25, "The usage history is a table in production that the
   nightly report writes". Body:
   ```sql
   create table public.usage_snapshots (
     taken_on date primary key,
     taken_at timestamptz not null default now(),
     metrics jsonb not null
   );
   alter table public.usage_snapshots enable row level security;
   revoke all on table public.usage_snapshots from public, anon, authenticated;
   ```
   Reversal: a one-line comment and `drop table public.usage_snapshots;`.
2. `usage-lib.mjs`, exports and contracts:
   - `FREE_PLAN = { db_bytes: 500_000_000, storage_bytes: 1_000_000_000, mau: 50_000 }`.
   - `THRESHOLDS = { warnPct: 50, warnDays: 60, failPct: 80, failDays: 14 }`.
   - `WINDOW_DAYS = 28`, `MIN_POINTS = 7`, `KEEP_DAYS = 400`.
   - `monthStart(now)` -> the UTC first of the month as a `Date`.
   - `slopePerDay(points)` -> least-squares slope over `[{ day: 'YYYY-MM-DD', value }]`, `null` below `MIN_POINTS`.
   - `forecast({ key, now, limit, kind, history, today })` -> `{ usedPct, perDay, daysLeft, note }`; `kind` is `cumulative` or `monthly` (4.4).
   - `stateOf({ usedPct, daysLeft })` -> `ok` | `warn` | `fail` (4.5).
   - `evaluate(snapshot, history, today)` -> rows `[{ label, now, limit, usedPct, perDay, daysLeft, state, note }]` for the three limited metrics, then the info rows.
   - `parseApiCounts(json)` -> `{ auth, rest, storage, realtime }` or throws `The usage.api-counts response has no result array`.
   - `fetchApiCounts({ ref, token, fetchImpl, timeoutMs = 10000 })` -> `{ ok: true, counts }` | `{ ok: false, fatal: boolean, reason }`; 401 and 403 are `fatal`.
   - `keepAlive({ url, key, fetchImpl })` -> `{ ok, status | reason }`; posts to `/rest/v1/rpc/get_shared_list` with `apikey` and `Authorization: Bearer <key>` headers and `{ "p_token": "A".repeat(43) }`.
   - `renderSummary({ rows, tables, nearLimits, requests, keepAlive, points })` -> Markdown string (4.6).
   - `exitCodeOf(rows, fatal)` -> 1 when any row is `fail` or `fatal` is true, else 0.
3. `usage.mjs`: copy `limits.mjs`'s shape. Arguments through
   `parseProjectArg` (`--project test|prod`). Refuse, exit 1, when
   `SUPABASE_DB_URL` is unset or `dbUrlProject(url) !== project`. Read the
   optional `SUPABASE_USAGE_TOKEN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.
   Order: `connect` -> `collect` in `sql.begin('read only', ...)` ->
   `readHistory(since = today - 28 days)` -> `fetchApiCounts` (skipped
   without a token) -> `keepAlive` (skipped without URL or key: a `warn`
   row) -> `evaluate` -> `saveSnapshot` -> write the summary to
   `process.env.GITHUB_STEP_SUMMARY` when set (append) and always to
   stdout -> `::warning::`/`::error::` lines -> `process.exitCode`.
   `sql.end()` in `finally`. `collect` details: 4.2; the MAU `refreshed_at`
   check through `information_schema.columns`; `near_limits` through one
   query that joins `public.lists` and `public.list_entries` with
   `public.effective_limit(owner_id, key)`.
4. `usage.yml`:
   ```yaml
   name: usage

   # Nightly report of production's free-plan usage: sizes, rows, an MAU
   # estimate, request counts, a forecast. A limit near its end fails the
   # run, so GitHub emails the owner. .claude/README.md, "Usage monitoring".

   on:
     # 30 minutes after backup.yml. GitHub disables this after 60 days
     # without a push; any push re-arms it.
     schedule:
       - cron: '47 3 * * *'
     workflow_dispatch:

   permissions:
     contents: read

   concurrency:
     group: usage
     cancel-in-progress: false

   jobs:
     report:
       runs-on: ubuntu-latest
       timeout-minutes: 10
       environment: production
       steps:
         - uses: actions/checkout@v5
         - uses: actions/setup-node@v5
           with:
             node-version-file: .nvmrc
             cache: npm
         - run: npm ci
           env:
             PUPPETEER_SKIP_DOWNLOAD: 'true'
         - name: Report free-plan usage
           run: node tools/supabase/usage.mjs --project prod
           env:
             SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL_PROD }}
             SUPABASE_USAGE_TOKEN: ${{ secrets.SUPABASE_USAGE_TOKEN_PROD }}
             SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}
             SUPABASE_PUBLISHABLE_KEY: ${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY }}
   ```
   The env name `SUPABASE_USAGE_TOKEN`, not `SUPABASE_ACCESS_TOKEN`, so no
   CLI call in the job picks the token up by itself.
5. `backup.yml` line 12: replace "The run is also production's free-tier
   keep-alive." with "The keep-alive is usage.yml's Data API call
   (docs/DECISIONS.md, 2026-09-25)." Keep every pinned string.
6. `tests/derived.js`: section 4.10.
7. `usage-lib.test.mjs` cases (names describe behaviour):
   `returnsNullSlopeBelowSevenSnapshots`, `computesBytesPerDayFromGrowingHistory`,
   `usesRealDatesAcrossAGap`, `forecastsDaysLeftForCumulativeMetric`,
   `reportsNoGrowthForFlatHistory`, `projectsMauToMonthEnd`,
   `reportsResetsFirstWhenMauCrossingIsNextMonth`, `warnsAtFiftyPercent`,
   `warnsUnderSixtyDaysLeft`, `failsAtEightyPercent`,
   `failsUnderFourteenDaysLeft`, `infoRowsNeverWarn`,
   `parsesApiCountsFixture`, `throwsOnApiCountsWithoutResult`,
   `treats401And403AsFatal`, `treats429And500AndTimeoutAsUnavailable`,
   `keepAliveCountsA4xxAsReached`, `keepAliveWarnsOnNetworkError`,
   `summaryHoldsNoEmailOrUuid` (render with a seeded row set; assert no
   `@` and no uuid pattern), `exitCodeIsOneOnFailOrFatal`.
8. `tests/db/usage.test.mjs`: 4.9, layer 3.
9. `package.json`: `node --test --test-reporter=dot tools/supabase/lib.test.mjs tools/supabase/usage-lib.test.mjs`.
10. Docs: section 6. Then `node tests/derived.js`, `npm run check`,
    `npm run check:db` (PowerShell tool on this host).

Acceptance criteria:

- `npm run check` green; `usage-lib.test.mjs` runs inside it with the 20
  cases of step 7.
- `npm run check:db` green; `usage.test.mjs` proves `collect` on real
  tables, the one-row-a-day upsert, the 400-day delete and the role
  refusals; the reversibility gate passes for the new pair.
- `node tests/derived.js` fails when `usage.yml` loses `environment:
  production`, gains `contents: write`, or when either production secret
  is read outside such a job (checked by editing a scratch copy, then
  reverting; the handoff records the three messages).
- `node tools/supabase/usage.mjs --project test` against the test project
  (an agent may, rule 2n; `SUPABASE_DB_URL_TEST` as `SUPABASE_DB_URL`)
  prints a summary with three limited rows and exits 0; the handoff pastes
  the table. Before `B11.1`'s migration reaches the test project, `migrate-test`
  on the branch's CI run applies it.
- The summary holds no email, no user id and no list name.
- `backup.yml`'s pins in `derived.js` still pass unchanged.
- `.claude/README.md` "Usage monitoring" holds the owner's setup steps of
  section 9 in order, each with its expected result.

Verification commands:

```text
node tests/derived.js
node --test --test-reporter=dot tools/supabase/usage-lib.test.mjs
rtk npm run check            (Bash timeout 600000)
npm run check:db             (PowerShell tool)
node tools/supabase/usage.mjs --project test
```

Risks and do-nots:

- Never run `usage.mjs --project prod` from an agent session; production
  is CI's and the owner's.
- Never print a connection string, a token or a key; `postgres` errors
  can carry the host - print `err.message` only after `dbUrlProject` has
  passed, as `limits.mjs` does.
- Do not add `analytics:read`-scoped log queries or a bytes estimate:
  the log schema is unverified.
- The keep-alive RPC couples the report to `get_shared_list(p_token)`:
  re-read R2's final migration first; if R2 renamed it, use the new name.
- The Management API endpoint has no documented scope in the spec; if the
  owner's scoped token gets 403 with "Usage Analytics: Read", the setup
  step 2 fallback adds "Logs: Read" (section 9).
- The migration stamp must sort after every applied migration.

## 9. Owner setup (in order)

1. After R11 is merged and pushed, confirm `migrate-prod` applied the
   migration (the `check` run on `main` is green).
2. Create the token: supabase.com, Account, Access Tokens, "Generate new
   token", scoped: organization of production, project
   `zzmrftmzefcqehhyztjq` only, permission "Usage Analytics" = Read,
   nothing else; the longest expiry the form offers; name
   `github-usage-report`. If the first run (step 6) reports 403, edit the
   token and add "Logs" = Read. Expected: the token string, shown once.
3. GitHub, Settings, Environments, `production`: add the secret
   `SUPABASE_USAGE_TOKEN_PROD` with the token. Expected: the secret is
   listed under the environment, not under repository secrets.
4. GitHub, your account, Settings, Notifications, Actions: "Only
   notify for failed workflows" with email on. Expected: the setting is
   saved.
5. Put the token's expiry date in your calendar, 14 days early. On
   expiry the run fails with "the usage token is expired or lacks Usage
   Analytics read"; repeat steps 2-3.
6. Dispatch once: `gh workflow run usage.yml`, then open the run.
   Expected: a green run whose summary has three limited rows (database,
   storage, MAU), "forecast: n/a (1 of 7 days)", a requests line and
   "keep-alive: reached". Send the summary to the closeout.
7. After seven nights, open the latest summary. Expected: a forecast on
   the database row.

## 10. Owner questions - answered 2026-09-26

Answers (owner, 2026-09-26, all as recommended): Q1 warn at 50 % or under
60 days left, fail at 80 % or under 14 days left; Q2 the public summary
shows totals only - no email, id or list name; Q3 a scoped read-only
Management API token, `SUPABASE_USAGE_TOKEN_PROD`, in the `production`
Environment. The questions as asked:

Q1. Thresholds. **Recommended: warn at 50 % or under 60 days left, fail
at 80 % or under 14 days left**, for the database, Storage and MAU; the
fail email then leaves at least two weeks to act, and 80 % of the database
is 100 MB short of read-only mode. Alternative: fail at 90 % (fewer
emails, 50 MB of margin).

Q2. The public summary. The repository is public, so anyone can read each
night's summary: database and Storage size, row counts per table, the
number of accounts and the MAU estimate. No email, id or list name.
**Recommended: accept** - aggregate numbers only, and the privacy page
promises nothing about them. Alternative: print percentages and states
only, no absolute numbers or row counts (hides growth detail from you
too; the table still holds the numbers).

Q3. The Management API token. The public API returns only request counts
per service - no billed egress, no MAU. **Recommended: create the scoped
read-only token** (section 9, steps 2-3): a daily traffic trend for the
cost of one secret that can read one project's usage only. Alternative:
no token - the report is SQL only, the requests line reads "no token",
and egress stays your monthly dashboard look.

## 11. Placement of later work

- R3 (`B3.1`) acceptance line: the usage report gains the Realtime rows -
  `requests_24h.realtime` is already there; add the rows of
  `realtime.messages` inserted in the last 24 hours as `realtime_rows_24h`
  (a lower bound: one row is delivered once per subscriber), info state.
  Peak connections and billed messages stay roadmap section 15, step 18.
- R8 (`B8.1`) acceptance line: the usage report's Storage row reads the
  `homebrew-art` bucket (no code change; the E2E's upload shows a non-zero
  `storage_bytes` on the test project's report).

Both lines are in the roadmap's section 14 outlines.

## 12. Risks, assumptions, deferred

- Assumption: `usage.api-counts` keeps its shape; it is not marked
  experimental in the 2026-09-25 spec, though a search snippet called it
  so. A changed body is a `warn` row, never a red run.
- Assumption: the scoped permission "Usage Analytics" grants this
  endpoint; unverifiable before the owner's first run.
- Risk: GitHub disables both schedules after 60 days without a push; the
  owner pushes more often than that during the programme. After the
  programme, a silent stop is possible; deferred: a monthly reminder is
  the owner's calendar, not code.
- Deferred: an egress bytes estimate from `analytics/endpoints/logs`
  (needs a verified `edge_logs` field and "Logs: Read"); a Storage
  GB-hours figure (the quota is time-weighted; the report reads the
  current size).
