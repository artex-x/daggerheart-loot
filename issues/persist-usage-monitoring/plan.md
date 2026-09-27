# Plan - TASK persist-usage-monitoring (release R11: free-plan usage monitoring)

## Status

- Planning pass 2 (refresh), 2026-09-27, planner, mode B. Base `d343cc95`
  (`process-guards` `B1`, local, not pushed), worktree branch
  `worktree-agent-a739573d9a05f0ce9`. Pass 1: 2026-09-25, base `da7378cb`.
- One batch, `B11.1`, implement-ready below (section 8). Not started.
- Plan review: required before B11.1 (trigger: a schema change -
  `supabase/migrations/<stamp>_usage_snapshots.sql` adds
  `public.usage_snapshots`; stored data can be lost - the report deletes
  its own snapshot rows older than 400 days, and the reversal drops the
  table). No SECURITY DEFINER function, no public contract, no write or
  sync protocol. Section 4.3 is the reviewer's schema statement.
- Slot: after `process-guards` (roadmap section 9). Dispatch after
  `process-guards` `B2` lands (it adds the plan-review gate and rule 6,
  which `B11.1` is the first live use of), and after the plan review
  (`issues/persist-usage-monitoring/reviews/plan-B11.1.md`) reads
  `Verdict: approve`.
- NEEDS_HUMAN_CONFIRMATION: no - the owner answered Q1-Q3 of section 10
  as recommended on 2026-09-26; `B11.1` is written for those answers. The
  Log Query look the R5 closeout asked for is answered in section 12; it
  changes no answer (the owner can still say no to the token - section 9,
  step 7 is the check).
- Decisions recorded with this plan (`docs/decisions/`, 2026-09-25):
  "Production's free-plan usage is reported nightly by its own workflow",
  "The usage history is a table in production that the nightly report
  writes", "The free-tier keep-alive is the usage report's Data API call,
  not the dump" (amends the backup decision). The refresh changes none.

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

In scope: database size, rows and bytes of every `public` table,
`auth.users` count, an MAU estimate, Storage bytes and object count (0
until R8), API request counts per service (egress proxy, through a scoped
token), how close the users come to the count limits, a forecast per
limited metric, thresholds, the job summary, the failed run, the history
table, the keep-alive call, the `tests/derived.js` pins, the runbook and
the owner's setup.

Non-goals: billed egress bytes, billed MAU, Realtime peak connections and
messages - no public API returns them (2026-09-25); they stay the owner's
dashboard look (roadmap section 15, step 18, extended in section 11
below). No alert channel other than GitHub's failed-run email. No
automatic limit change: the owner decides. No dashboard page in the app.

## 3. Existing behaviour and code paths (re-read at `d343cc95`)

- `.github/workflows/`: `ci.yml`, `backup.yml`, `previews.yml`. Only
  `ci.yml`'s `migrate-prod` and `backup.yml`'s `dump` read
  `SUPABASE_DB_URL_PROD`, each in `environment: production`.
  `previews.yml` (cron `23 */4 * * *`) reads only `TG_*` secrets.
- `backup.yml`: job `dump`, `environment: production`, `permissions:
  contents: read`, cron `17 3 * * *`, `npm ci` with
  `PUPPETEER_SKIP_DOWNLOAD`; line 12 is the keep-alive comment that
  step 5 of `B11.1` replaces.
- `tools/supabase/db.mjs` `connect(url)`: the one module that opens a
  connection (`postgres`, `ssl: 'require'` for a hosted project, `max: 1`,
  `prepare: false`).
- `tools/supabase/lib.mjs`: `PROJECTS`, `dbUrlProject`, `parseProjectArg`,
  `LOCAL_STACK_EXCLUDES`; pure, tested by `tools/supabase/lib.test.mjs`
  inside `npm run check`.
- `tools/supabase/limits.mjs`: the CLI-script shape to copy (argument
  parse, env check, `dbUrlProject` refusal, `main()` guarded by
  `import.meta.url`, error text prefixed with the tool's name).
- Migrations on `main` (ten, each with a reversal): `20260925120000`
  `delete_account`, `120100` `user_prefs`, `120200`
  `user_prefs_service_role`, `130000` `limits`, `130100` `lists`, `130200`
  `list_shares`, `130300` `lists_service_role`, `130400` `legacy_move`
  (R5: `lists.legacy_fingerprint`, the exempted limit triggers,
  `move_legacy_list`), `130500` `legacy_move_conflict`, `130600`
  `list_writes` (`apply_list_writes`). The newest is `20260925130600`.
- `public` tables (six): `user_prefs`, `limit_defaults`,
  `user_limit_overrides`, `lists` (`owner_id`), `list_entries`
  (`list_id`), `list_shares`. `usage_snapshots` makes seven. R5b's
  `notifyGm` is a key inside `user_prefs`, not a table or a column.
- `public.effective_limit(uuid, text)` (security definer, no Data API
  role executes it); keys `lists_per_owner` (50) and `entries_per_list`
  (100). R5's `move_legacy_list` bypasses both limits
  (`docs/specs/DEBT.md` D62), so a user can be above 100 %.
- `public.get_shared_list(p_token text)` is unchanged since R2: a token
  that is not 43 characters of `[A-Za-z0-9_-]` returns null before any
  read; a well-formed token reads `list_shares` and returns null when
  nothing matches. `anon` may execute it (`tests/db/harness.test.mjs`,
  `EXPECTED_ANON_FUNCTIONS`).
- `supabase/config.toml`: `auto_expose_new_tables = false`. On the local
  stack `service_role` still holds `REFERENCES`, `TRIGGER` and `TRUNCATE`
  on a new table (`tests/db/list-shares.test.mjs` pins that set).
  `postgres` owns every table and has `BYPASSRLS`
  (`tests/db/legacy-move.test.mjs`).
- `tests/db/harness.test.mjs` already asserts, for every `public` table,
  RLS on and no `anon` privilege; the new table is covered with no edit.
- `tests/db/run.mjs` runs every `tests/db/*.test.mjs`, under the local
  stack lock, and arms the `check:db` gate by its own exit (`process-guards`
  `B1`). The stack runs without `gotrue`, `storage-api` and the other
  services (`LOCAL_STACK_EXCLUDES`). On this host on 2026-09-27 the local
  database (a volume that `restore:drill` once started with `gotrue`) had
  `auth.sessions` (`refreshed_at`, `updated_at`, `created_at`),
  `auth.users.last_sign_in_at` and `storage.objects` (`metadata`,
  `bucket_id`); CI's fresh `db` job is not measured, so `collect` must not
  assume `auth.sessions` or `storage.objects` exists (4.2).
- `tests/derived.js`: `prodSecretOutsideEnvironment(text)` and the
  `backup.yml` pins sit after the `migrate-prod` pins; the function runs
  over `ci.yml` and `backup.yml` only.
- `package.json` `check`: `node .claude/hooks/gate-credit.mjs begin check
  && ... && node --test --test-reporter=dot tools/supabase/lib.test.mjs &&
  ... && npm run test && node .claude/hooks/gate-credit.mjs arm check`.
- `bash-guard.mjs` rule 2n judges `npm run config:push|db:push|limits:set`
  and `supabase` CLI calls; a `node tools/supabase/<x>.mjs` run is not
  judged, so `usage.mjs`'s own `dbUrlProject` refusal is its guard.
- `.claude/README.md`: "Supabase configuration" holds "Migration names",
  "Release procedure", "Expected Security Advisor warnings" (0 errors, 9
  warnings, 2 info - the two info are RLS on with no policy for the two
  limit tables, `issues/persistent-storage/context.md`), "The local stack
  lock", "The hosted E2E and the deploy" and "Where the secrets live";
  "### Backups and restore" has "#### Run the agent drill" and "####
  Restore production (owner)", then "## Cloud sessions".

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
| `storage_bytes`, `storage_objects` | `select coalesce(sum((metadata->>'size')::bigint), 0), count(*) from storage.objects`; 0 and 0 with the note `no storage.objects` when `to_regclass('storage.objects')` is null | 1 GB = 1,000,000,000 bytes | cumulative |
| `mau` | distinct user ids from `auth.users` where `last_sign_in_at >= <month start UTC>`, union `auth.sessions` where `coalesce(<time column>, created_at) >= <month start UTC>` (see below) | 50,000 | monthly cycle |
| `auth_users` | `select count(*) from auth.users` | none | info |
| `tables` | for each `pg_tables` row in schema `public` (seven at `B11.1`): exact `count(*)` and `pg_total_relation_size` | none | info |
| `near_limits` | owners with `count(lists) >= 0.8 * effective_limit(owner, 'lists_per_owner')`; lists with `count(entries) >= 0.8 * effective_limit(owner, 'entries_per_list')`; each also counts the part above 100 % (D62); a `null` limit never counts | none | info |
| `requests_24h` | `usage.api-counts?interval=1day`, each `total_*_requests` summed over `result[]` | none | info |

Choices inside the table:

- Decimal limits (500,000,000 and 1,000,000,000 bytes) are the smaller
  reading of "500 MB" and "1 GB", so the report errs early.
- MAU: the billing cycle's anchor day is not readable; the calendar month
  in UTC stands in. `auth.sessions` rows vanish at sign-out, and a token
  refresh is not in `auth.users`, so the union is a lower bound. It is
  labelled "estimate" in the summary. The sources are chosen from
  `information_schema.columns` by a pure function (`mauPlan`, 4.8):
  `auth.sessions` when the table exists, with `refreshed_at`, else
  `updated_at`, as its time column; `auth.users.last_sign_in_at` when the
  column exists. No source at all -> `mau` is `null` and its row is
  `warn` with the note `no MAU source`. Hosted Auth has all of them; the
  choice exists for the local stack without `gotrue`.
- Egress: the report shows request counts per service over the last day
  as a trend, labelled "requests (egress proxy; billed egress: dashboard
  only)". It never claims a byte figure. The call is a Management API log
  read, so it counts against the organisation's Log Query allowance
  (section 12); `interval=1day` is the narrowest window that covers a
  night, and the report calls it once a run.
- Table names come from `pg_tables`; the count query quotes each
  identifier (`sql(name)` in `postgres`), so a table added by a later
  release is counted without a code change.
- The summary lists every `public` table by bytes (seven rows today), not
  a top five: the owner asked for row counts per table.

### 4.3 Where the history lives: a table in production (the reviewer's schema statement)

```sql
create table public.usage_snapshots (
  taken_on date primary key,
  taken_at timestamptz not null default now(),
  metrics jsonb not null
);
alter table public.usage_snapshots enable row level security;
revoke all on table public.usage_snapshots from public, anon, authenticated, service_role;
```

- Grants: none to `anon`, `authenticated` or `service_role`. The
  `limit_defaults` pattern revokes from the first three;
  `service_role` is added because the local stack leaves it
  `REFERENCES`, `TRIGGER` and `TRUNCATE` on a new table, and no harness
  reads this table (the hosted E2E never touches it).
- RLS: on, with no policy. No Data API role can read or write a row even
  if a later grant slips in. The Security Advisor reports it as a third
  "RLS enabled, no policy" info, like the two limit tables (section 6).
- Writer: only `usage.mjs` in `usage.yml`'s `report` job, connected as
  `postgres` over `SUPABASE_DB_URL_PROD`. `postgres` owns the table
  (migrations run as `postgres`) and has `BYPASSRLS`, so no policy is
  needed. Once a night it upserts today's row (`insert ... on conflict
  (taken_on) do update set taken_at = excluded.taken_at, metrics =
  excluded.metrics`), so a re-run the same day replaces it, then deletes
  rows with `taken_on < today - 400 days`. Both statements run in one
  write transaction after the read-only collection.
- Readers: the same job (the last 28 days, for the forecast);
  `tests/db/usage.test.mjs` on the local stack.
- What can be lost, and the recovery: rows older than 400 days (by
  design); every row if the reversal runs (`drop table`); the rows since
  the backup if production is restored (`restore:prod` truncates every
  `public` table and reloads the dump, which carries this table - the
  report runs 30 minutes after the dump, so one row). A lost history costs
  7 nights without a forecast (4.4); no user data is involved.
- No personal data: `metrics` holds totals only (4.6).
- Growth: about 2 KB a day (one `jsonb` row); 400 rows stay under 1 MB.
- The nightly `--schema auth,public` dump backs the table up. Until the
  first backup after `migrate-prod`, `restore:drill` prints `info: local
  tables not in the dump: public.usage_snapshots` - an info line, not a
  failure.

| Option | Durable | Private | Write path | Verdict |
|---|---|---|---|---|
| Table in production (recommended) | yes, and in the backup | yes (no grant; the summary is public anyway) | one upsert a night by CI through the Environment | chosen |
| Workflow artifact | 90 days at most; each run must download the last run's (`actions: read`, cross-run `download-artifact` with a run id) | no - public repository | upload per run | rejected: a broken chain loses the history, and the file is public |
| Actions cache | evicted when unused 7 days or when the repository passes 10 GB (least recently used, next to the npm caches) | yes | a new key per run | rejected: an eviction silently resets the forecast |
| Committed file | yes | no - public | `contents: write` for a job that holds the production secret, a push to `main` a night | rejected: widens the production job's token and races the owner's pushes |

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
No MAU source -> a `warn` row (4.2).

### 4.6 How the owner is notified

- Every night: `$GITHUB_STEP_SUMMARY` gets one Markdown table (metric,
  now, limit, used %, growth a day, days left, state), then every `public`
  table by bytes, then the near-limit counts, then one line with the
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
share, so the function reads `list_shares`; the function is unchanged
since R2, section 3). Any HTTP answer below 500 is "reached"; a network
error or 5xx is a `warn` row. Its SQL and upsert are database activity
too. Supabase still emails a week before a pause, and the dump and the
report both fail red on a paused project. `backup.yml`'s comment is
corrected in the batch (the decision file was amended with pass 1).

### 4.8 Code layout

- `tools/supabase/usage-lib.mjs` (new, pure): `FREE_PLAN` limits,
  `THRESHOLDS`, `monthStart(date)`, `mauPlan(columns)`,
  `slopePerDay(points)`, `forecast(...)`, `stateOf(...)`,
  `evaluate(snapshot, history, today)` -> rows with states,
  `parseApiCounts(json)`, `renderSummary(...)`, `exitCodeOf(rows, fatal)`,
  and the two HTTP calls over an injected `fetchImpl`: `fetchApiCounts`
  and `keepAlive`. No I/O of its own. Tested by
  `tools/supabase/usage-lib.test.mjs` with fixtures in
  `tools/supabase/fixtures/usage/`.
- `tools/supabase/usage.mjs` (new, I/O): `collect(db, now)` (the SQL of
  4.2 on whatever connection or transaction it gets),
  `readHistory(db, since)`, `saveSnapshot(db, day, metrics)` (the upsert
  plus the 400-day delete), and `main()`. `collect`, `readHistory` and
  `saveSnapshot` are exported for `tests/db/usage.test.mjs`.
- `lib.mjs` is not grown: its header scopes it to the release tools, and
  the usage logic is a separate concern with its own test file.

### 4.9 Tested without production

- Layer 1 (`npm run check`): `usage-lib.test.mjs` over fixtures -
  `api-counts.ok.json` (shaped from the OpenAPI schema
  `V1GetUsageApiCountResponse`), `api-counts.error.json` (`{ "error":
  "..." }`), `history.growing.json` (28 days, db 300 -> 330 MB),
  `history.short.json` (5 days), `history.flat.json`. Cases in `B11.1`,
  step 7.
- Layer 3 (`npm run check:db`): `tests/db/usage.test.mjs`, cases in
  `B11.1`, step 8. The reversibility gate covers the new migration and
  reversal; `harness.test.mjs` covers RLS and `anon` with no edit.
- `fetchApiCounts` and `keepAlive` take an injected `fetchImpl` (no
  global `fetch`), so layer 1 covers 200, 401, 403, 429, 500, a timeout
  and a bad body with a stub. `usage.mjs` passes `globalThis.fetch`.
- `tests/derived.js` pins the workflow (4.10).
- Layer 4 (`npm run e2e`) after the test-project push: no case changes;
  it proves the new migration leaves the app's flows green on the test
  project (rule 6, section 7).
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
- `prodSecretOutsideEnvironment(text, secret)` gains a secret argument
  and runs for `SUPABASE_DB_URL_PROD` and `SUPABASE_USAGE_TOKEN_PROD` over
  every `*.yml` file in `.github/workflows/` (read with `readdirSync`), so
  `previews.yml` and a later workflow are covered too.

## 5. Contracts and behaviour that stay stable

No public contract changes: no route, link, generated data or asset path.
`backup.yml` changes by one comment line only; its pins stay. No app code
changes; no `check:built`. The privacy page is unchanged: the new table
holds no personal data.

## 6. Documentation per batch

- `.claude/README.md`:
  - a new subsection "### Usage monitoring" after "#### Restore
    production (owner)" and before "## Cloud sessions": what runs when,
    the metric table (short), the thresholds, the runbook (symptom: a red
    `usage` run email; diagnosis: the run's summary; recovery:
    `limits:set`, data cleanup, or accept and raise the note), the Log
    Query note (section 12), the owner's setup steps (section 9), the
    token rotation;
  - "Where the secrets live": `usage.yml`'s `report` job is a third
    reader of `SUPABASE_DB_URL_PROD`, and the only reader of
    `SUPABASE_USAGE_TOKEN_PROD`; `derived.js` pins both over every
    workflow;
  - "Expected Security Advisor warnings": 0 errors, 9 warnings and 3
    info after R11's `migrate-prod`; the three info are RLS on with no
    policy for `limit_defaults`, `user_limit_overrides` and
    `usage_snapshots` (by design: no Data API role reads them).
- `docs/specs/COVERAGE.md`: the `usage-lib.test.mjs` paragraph after the
  `tools/supabase/lib.test.mjs` one; `tests/db/usage.test.mjs` in the
  layer 3 list; the `derived.js` pins sentence at the end of the
  `lib.test.mjs` paragraph gains `usage.yml` and "every workflow".
- `docs/specs/META.md`: one sentence after the backup sentence: "A nightly
  job reports the free-plan usage to the owner (`.claude/README.md`,
  "Usage monitoring")."

## 7. Batches: gates, cost, review, split criterion

| Batch | Goal | Gates (cost, 2026-09-27 host figures) | Review | Split criterion |
|---|---|---|---|---|
| `B11.1` | The whole release: migration and reversal, `usage-lib.mjs` and `usage.mjs`, `usage.yml`, `derived.js` pins, layer 1 and layer 3 tests, docs; after the approve, the test-project push and `npm run e2e` | before the review: `npm run check` (544 s), `npm run check:db` (517 s, plus about 20 s for one migration and one test file); after the approve: `db:push --project test` (under a minute), `npm run e2e` (104-117 s), the `usage.mjs --project test` smoke (seconds) | plan review before dispatch (`reviews/plan-B11.1.md`); batch review required (a `supabase/` batch, and a workflow that reads a production secret), `reviews/B11.1.md` | - (one batch: every piece shares the same two local gates, no route or public contract, and the harness reaches all of it) |

Total gate cost: about 21 minutes for one green pass (check 9 min,
check:db 9 min, push, e2e and smoke 3 min). A remediation cycle that
touches code repeats check and check:db (about 18 minutes); one that
changes the migration also needs the second review's approve before the
push (rule 6). `check:db` is close to the 600 s cap on a loaded host: a
run that crosses it still arms the gate by its own exit ("Gate credit").
The first live run is the owner's dispatch after the push (section 9,
step 6); a defect it finds is a new commit, because the push closes the
amend window.

Rule order (`process-guards` rules 1 and 6, `docs/decisions/`,
2026-09-27): plan review approve -> implementer -> local gates ->
commit -> batch review approve (its `Reviewed:` commit must hold the same
`supabase/migrations/` tree as `HEAD`) -> `db:push --project test` ->
`npm run e2e` -> smoke -> amend the handoff. `B11.1` is the first live use
of both rules.

## 8. Batch `B11.1` - free-plan usage report (implement-ready)

Objective: a nightly `usage.yml` run reads production's usage, stores a
snapshot, forecasts, writes a summary table, warns at the warn rule and
fails at the fail rule.

Prerequisites: `process-guards` `B2` is on `main`; the plan review
`issues/persist-usage-monitoring/reviews/plan-B11.1.md` reads `Verdict:
approve`; Q1-Q3 answered as recommended (2026-09-26).

In scope: sections 4.1-4.10 and 6. Out of scope: Realtime rows (R3 adds
them, section 11), a bytes estimate of egress, any app change.

Files:

| File | Change |
|---|---|
| `supabase/migrations/<stamp>_usage_snapshots.sql` | new; `<stamp>` is the current UTC minute at implementation (`date -u +%Y%m%d%H%M00`), which sorts after `20260925130600` and after any other branch's version on the test project (`.claude/README.md`, "Migration names") |
| `supabase/reversals/<stamp>_usage_snapshots.sql` | new; `drop table public.usage_snapshots;` |
| `tools/supabase/usage-lib.mjs` | new, pure |
| `tools/supabase/usage-lib.test.mjs` | new |
| `tools/supabase/fixtures/usage/*.json` | new, five files (4.9) |
| `tools/supabase/usage.mjs` | new, I/O and `main()` |
| `tests/db/usage.test.mjs` | new, layer 3 |
| `.github/workflows/usage.yml` | new |
| `.github/workflows/backup.yml` | line 12 comment only |
| `tests/derived.js` | the `usage.yml` block; `prodSecretOutsideEnvironment` takes the secret name and runs over every workflow |
| `package.json` | the `check` script's `node --test --test-reporter=dot tools/supabase/lib.test.mjs` step also runs `tools/supabase/usage-lib.test.mjs` |
| `.claude/README.md`, `docs/specs/COVERAGE.md`, `docs/specs/META.md` | section 6 |
| `docs/decisions/2026-09-25-*` (the three R11 decisions) | only if the review changes them; then `node tools/decisions.js` |

Steps:

1. Migration. Header comment (1-3 lines) citing `docs/DECISIONS.md`,
   2026-09-25, "The usage history is a table in production that the
   nightly report writes". Body: the SQL of 4.3, nothing else.
   Reversal: a one-line comment and `drop table public.usage_snapshots;`.
2. `usage-lib.mjs`, exports and contracts:
   - `FREE_PLAN = { db_bytes: 500_000_000, storage_bytes: 1_000_000_000, mau: 50_000 }`.
   - `THRESHOLDS = { warnPct: 50, warnDays: 60, failPct: 80, failDays: 14 }`.
   - `WINDOW_DAYS = 28`, `MIN_POINTS = 7`, `KEEP_DAYS = 400`.
   - `monthStart(now)` -> the UTC first of the month as a `Date`.
   - `mauPlan(columns)` -> `{ users: boolean, sessions: 'refreshed_at' | 'updated_at' | null }` from a list of `'<table>.<column>'` strings (`auth.users.last_sign_in_at`, `auth.sessions.refreshed_at`, ...); `sessions` needs `auth.sessions.user_id` and `auth.sessions.created_at` too.
   - `slopePerDay(points)` -> least-squares slope over `[{ day: 'YYYY-MM-DD', value }]`, `null` below `MIN_POINTS`.
   - `forecast({ key, now, limit, kind, history, today })` -> `{ usedPct, perDay, daysLeft, note }`; `kind` is `cumulative` or `monthly` (4.4).
   - `stateOf({ usedPct, daysLeft })` -> `ok` | `warn` | `fail` (4.5).
   - `evaluate(snapshot, history, today)` -> rows `[{ label, now, limit, usedPct, perDay, daysLeft, state, note }]` for the three limited metrics, then the info rows; a `null` `mau` is a `warn` row with the note `no MAU source`.
   - `parseApiCounts(json)` -> `{ auth, rest, storage, realtime }` or throws `The usage.api-counts response has no result array`.
   - `fetchApiCounts({ ref, token, fetchImpl, timeoutMs = 10000 })` -> `{ ok: true, counts }` | `{ ok: false, fatal: boolean, reason }`; 401 and 403 are `fatal`. The URL is `https://api.supabase.com/v1/projects/<ref>/analytics/endpoints/usage.api-counts?interval=1day`.
   - `keepAlive({ url, key, fetchImpl })` -> `{ ok, status | reason }`; posts to `/rest/v1/rpc/get_shared_list` with `apikey` and `Authorization: Bearer <key>` headers and `{ "p_token": "A".repeat(43) }`.
   - `renderSummary({ rows, tables, nearLimits, requests, keepAlive, points })` -> Markdown string (4.6).
   - `exitCodeOf(rows, fatal)` -> 1 when any row is `fail` or `fatal` is true, else 0.
3. `usage.mjs`: copy `limits.mjs`'s shape (error lines prefixed
   `usage:`). Arguments through `parseProjectArg` (`--project test|prod`).
   Refuse, exit 1, when `SUPABASE_DB_URL` is unset or
   `dbUrlProject(url) !== project`. Read the optional
   `SUPABASE_USAGE_TOKEN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.
   Order: `connect` -> in `sql.begin('read only', ...)`: `collect(tx,
   now)` and `readHistory(tx, today - 28 days)` -> `fetchApiCounts`
   (skipped without a token: a `warn` row) -> `keepAlive` (skipped without
   URL or key: a `warn` row) -> `evaluate` -> in `sql.begin(...)`:
   `saveSnapshot(tx, today, metrics)` -> write the summary to
   `process.env.GITHUB_STEP_SUMMARY` when set (append) and always to
   stdout -> `::warning::`/`::error::` lines -> `process.exitCode`.
   `sql.end()` in `finally`. `collect` details: 4.2; one
   `information_schema.columns` query for the `auth.users` and
   `auth.sessions` columns feeds `mauPlan`; `to_regclass('storage.objects')`
   decides the Storage query; `near_limits` is one query that joins
   `public.lists` and `public.list_entries` with
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
   `warnsWhenNoMauSource`, `plansMauFromRefreshedAtThenUpdatedAt`,
   `plansMauWithoutSessionsTable`, `parsesApiCountsFixture`,
   `throwsOnApiCountsWithoutResult`, `treats401And403AsFatal`,
   `treats429And500AndTimeoutAsUnavailable`, `keepAliveCountsA4xxAsReached`,
   `keepAliveWarnsOnNetworkError`, `summaryHoldsNoEmailOrUuid` (render with
   a seeded row set; assert no `@` and no uuid pattern),
   `exitCodeIsOneOnFailOrFatal` - 23 cases.
8. `tests/db/usage.test.mjs` (layer 3; each case in a transaction that
   rolls back, as `limits.test.mjs` does):
   - `collect` on seeded data: two users (`auth.users` rows with
     `last_sign_in_at` this month and last month, when `mauPlan` says the
     column exists), lists and entries for one of them; the result has
     `db_bytes > 0`, `auth_users` = the seeded count plus the rows
     before, a `tables` entry for each of the seven `public` tables with
     the seeded counts, and `mau` = 1 (or `null` when the stack has no
     source).
   - Storage: when `to_regclass('storage.objects')` is not null, insert
     one `storage.buckets` row and one object with `metadata = {"size":
     1234}`; `storage_bytes` rises by 1234 and `storage_objects` by 1.
     When it is null, `storage_bytes` is 0 with the note. If the insert
     fails on the stack (a storage trigger), record the error in the
     handoff and assert instead that `collect` equals a direct aggregate
     over `storage.objects` on the same transaction.
   - `near_limits`: one owner with 40 lists (80 % of 50) counts; an
     override of 10 set after the 40 inserts (the `lists_limit` trigger
     refuses the inserts otherwise) makes them count as above 100 %; an
     owner with a `null` override never counts.
   - `saveSnapshot` twice on one day leaves one row with the second
     metrics; a row 401 days old is deleted; a row 399 days old stays.
   - `readHistory` returns the rows of the last 28 days in date order.
   - Grants: `anon`, `authenticated` and `service_role` hold none of the
     seven table privileges on `public.usage_snapshots` (the
     `limits.test.mjs` query), `relrowsecurity` is true, and `select` as
     `authenticated` is refused with `permission denied` (`asRole`).
9. `package.json`: `node --test --test-reporter=dot tools/supabase/lib.test.mjs tools/supabase/usage-lib.test.mjs`.
10. Docs: section 6.
11. Local gates, in this order: `node tests/derived.js`; `rtk npm run
    check` (Bash, timeout 600000); `npm run check:db` (PowerShell tool,
    timeout 600000, the command alone). Commit (the task's first commit;
    Conventional Commits, for example `feat(persist): report production's
    free-plan usage nightly`).
12. Stop for the batch review. The orchestrator dispatches the reviewer
    (`reviews/B11.1.md`); a remediation amends the commit and re-runs
    step 11's gates.
13. After `Verdict: approve` on a report whose `Reviewed:` commit holds
    the same `supabase/migrations/` tree as `HEAD`: push the migration to
    the test project with `node --env-file=.env.test.local
    tools/supabase/db-push.mjs --project test --yes` (the password is
    loaded by `node`, never printed). If `db push` refuses because another
    branch's version sits on the test project, stop and report it (the
    recovery is the owner's, `.claude/README.md`, "Supabase
    configuration", the orphan paragraph).
14. `npm run e2e` (about 2 minutes). Expected: every case green.
15. Smoke: `node --env-file=.env.test.local tools/supabase/usage.mjs
    --project test`. If it prints `usage: SUPABASE_DB_URL is not set`,
    the host has no test connection string: record "smoke not run: no
    test connection string" and continue - the owner's first dispatch
    (section 9, step 6) is the live proof. Otherwise paste the summary
    table into the handoff.
16. Amend the commit with the handoff's results (no code change after
    the approve; a code change goes back to step 11 and step 12).

Acceptance criteria:

- The plan review approved before the implementer started.
- `npm run check` green; `usage-lib.test.mjs` runs inside it with the 23
  cases of step 7.
- `npm run check:db` green; `usage.test.mjs` proves `collect` on real
  tables, the Storage branch that the stack has, `near_limits` including
  the part above 100 %, the one-row-a-day upsert, the 400-day delete and
  the role refusals; the reversibility gate passes for the new pair; the
  harness invariants pass with no edit.
- `node tests/derived.js` fails when `usage.yml` loses `environment:
  production`, gains `contents: write`, or when either production secret
  is read outside such a job in any workflow file (checked by editing a
  scratch copy, then reverting; the handoff records the three messages).
- The test-project push ran only after the batch review's approve, and
  `npm run e2e` passed after it; the handoff records both commands and
  results.
- The smoke's result is in the handoff: a summary with three limited
  rows and exit 0, or "not run" with the reason of step 15.
- The summary holds no email, no user id and no list name.
- `backup.yml`'s pins in `derived.js` still pass unchanged.
- `.claude/README.md` "Usage monitoring" holds the owner's setup steps of
  section 9 in order, each with its expected result; "Where the secrets
  live" and "Expected Security Advisor warnings" match section 6.

Verification commands:

```text
node tests/derived.js
node --test --test-reporter=dot tools/supabase/usage-lib.test.mjs
rtk npm run check                                   (Bash, timeout 600000)
npm run check:db                                    (PowerShell, timeout 600000)
# after the batch review's approve only:
node --env-file=.env.test.local tools/supabase/db-push.mjs --project test --yes
npm run e2e
node --env-file=.env.test.local tools/supabase/usage.mjs --project test
```

Risks and do-nots:

- Never run `usage.mjs --project prod` from an agent session; production
  is CI's and the owner's. No hook denies it (section 3); the agent has
  no production string, and the do-not stands anyway.
- Never push the migration to the test project before the batch review
  approves (rule 6; after `process-guards` `B2`, `bash-guard.mjs` denies
  it).
- Never print a connection string, a token or a key; `postgres` errors
  can carry the host - print `err.message` only after `dbUrlProject` has
  passed, as `limits.mjs` does. Never open `.env.test.local`; `node
  --env-file` loads it.
- Do not add `analytics:read`-scoped log queries or a bytes estimate:
  the log schema is unverified, and every log read counts against Log
  Query (section 12).
- The keep-alive RPC couples the report to `get_shared_list(p_token)`; a
  later release that renames it updates `keepAlive` in the same commit.
- The Management API endpoint has no documented scope in the spec; if the
  owner's scoped token gets 403 with "Usage Analytics: Read", the setup
  step 2 fallback adds "Logs: Read" (section 9).
- `collect` must not assume `auth.sessions` or `storage.objects` (the
  `check:db` stack runs without `gotrue` and `storage-api`).

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
7. The next day, open the organization's usage page, Log Query, for the
   production project. Expected: the dispatch day is not visibly above
   the days around it. If it is more than 1 GB above them, delete the
   secret `SUPABASE_USAGE_TOKEN_PROD`: the report then shows "requests: no
   token" as a `warn` row and nothing else changes (section 12).
8. Re-run the Security Advisor on production. Expected: 0 errors, 9
   warnings, 3 info (the third info is `usage_snapshots`, RLS on with no
   policy).
9. After seven nights, open the latest summary. Expected: a forecast on
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

- Log Query (the R5 closeout asked R11's planner which tool reads logs;
  2026-09-18 to 10-18: 129.07 of 100 GB, data only on 2026-09-25/26).
  Supabase: Log Query is "the total GB of log data scanned" when logs are
  read "through the Studio UI, the Management API, the CLI, or any other
  interface"; the Free plan allowance is 100 GB (100 x the 1 GB ingest);
  it is not billed, and from the start of 2027 an overage rate-limits log
  queries and cuts Free log retention to 1 hour the next month, and a
  second overage in a row cuts log access
  (`https://supabase.com/docs/guides/platform/manage-your-usage/logs-query`,
  read 2026-09-27). No repository tool reads hosted logs: `git grep`
  finds no `analytics/endpoints`, `get_logs` or log command, and CI talks
  to the projects only through `postgres`, `db push` and the Data API.
  So the 2026-09-25/26 scans came from outside the repository - most
  likely dashboard pages opened in the owner's Chrome session those days
  (the project home charts, Reports, the Logs Explorer, the Security
  Advisor reruns); that is not provable from here, and a metering defect
  stays possible. The owner reads the per-day figures on the
  organization's usage page. For R11: `usage.api-counts` is a Management
  API log read, so it counts; one 1-day window a night is the smallest
  read that gives the trend, and setup step 7 measures it. Removing the
  secret turns it off with no code change.
- Assumption: `usage.api-counts` keeps its shape; it is not marked
  experimental in the 2026-09-25 spec, though a search snippet called it
  so. A changed body is a `warn` row, never a red run.
- Assumption: the scoped permission "Usage Analytics" grants this
  endpoint; unverifiable before the owner's first run.
- Assumption: `interval=1day` reads a 24-hour window; the spec does not
  document the bucket width (`context.md`).
- Risk: GitHub disables the schedules after 60 days without a push; the
  owner pushes more often than that during the programme. After the
  programme, a silent stop is possible; deferred: a monthly reminder is
  the owner's calendar, not code.
- Risk: `check:db` (517 s on 2026-09-27) plus the new migration and test
  file is close to the 600 s cap on a loaded host; gate credit keeps a
  green run that crosses it.
- Deferred: an egress bytes estimate from `analytics/endpoints/logs`
  (needs a verified `edge_logs` field, "Logs: Read" and more Log Query); a
  Storage GB-hours figure (the quota is time-weighted; the report reads
  the current size).

## 13. Refresh log (pass 2, 2026-09-27)

Facts that moved since pass 1 (base `da7378cb` -> `d343cc95`):

- R5 (`d679d285`) and R5b (`d0acbe13`) are live: three more migrations
  (`20260925130400`-`130600`), `lists.legacy_fingerprint`,
  `move_legacy_list` (limit bypass, D62), `apply_list_writes`; R5b added
  no migration. Six `public` tables, seven with R11; `near_limits` now
  counts the part above 100 %.
- `get_shared_list` is committed and unchanged; the "re-read R2's final
  migration" risk is closed.
- `process-guards` `B1` (`d343cc95`): gate credit for `check` and
  `check:db`; `tests/db/run.mjs` takes the stack lock; `.env*` reads
  denied (`node --env-file` loads them); `.claude/README.md` updated. The
  plan's commands now load `.env.test.local` with `node --env-file`.
- `process-guards` `B2` (planned): rule 1 (the `Plan review:` line in
  Status, `reviews/plan-B11.1.md`) and rule 6 (the test-project push after
  the batch review's approve). Section 7 and steps 11-16 follow them.
- Costs: `npm run check` 544 s and `npm run check:db` 517 s (2026-09-27),
  up from 348 s and about 9 minutes; `npm run e2e` 104-117 s.
- `tests/derived.js`: the function is cited by name, not by line numbers
  (they moved); the pin now covers every workflow file (`previews.yml`
  exists).
- The `check:db` stack runs without `gotrue` and `storage-api`: `collect`
  detects `auth.sessions`, its time column and `storage.objects` (4.2,
  step 8).
- The Security Advisor's info count goes from 2 to 3 (section 6, setup
  step 8).
- The migration stamp is the implementation's current UTC minute, not
  "the next free minute", so it also sorts after another branch's version
  on the test project.
