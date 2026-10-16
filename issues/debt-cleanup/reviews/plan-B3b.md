# Review - plan before B3b (debt-cleanup)

Verdict: fix-then-continue
Reviewed: f9cb76208adec41577f1af7490d8d7cf2d45d171
Scope: plan before B3b

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

This is the plan review before B3 (reviews/plan-B3.md), filed again under B3b's name by the orchestrator on 2026-10-16: the plan split D83 and the tooling lines out of B3 into B3b after this review, with no change to their text beyond its findings (plan.md Status). The findings and their applied changes are the same.

Read: `CLAUDE.md`; `issues/debt-cleanup/context.md`, `plan.md` (Status with the plan-review line,
2.1, 3.10.2, 3.11.1-3.11.3, 4.2, 4.3, 5, 6, 7 split criteria and gate cost, 7.2 steps 5-6, 7.3
with its stop condition and acceptance, 10), `handoff.md` against
`.claude/templates/handoff.template.md`, `reviews.md`, `reviews/B2.md`, `reviews/plan-B2.md`; the
decision `docs/decisions/2026-09-24-the-account-client-loads-after-first-paint-a.md`;
`app/src/ports/supabase.ts` (`createCloud`, `keepaliveFetch`, `writeOf`, `callFailure`,
`uploadRefusal`, `deleteAccount`, `onChange`, `events`), `supabase.test.ts` (the mock block and the
client-options case); supabase-js 2.117.1 in the main checkout's `node_modules`:
`src/SupabaseClient.ts`, `src/index.ts`, `src/lib/fetch.ts`, `constants.ts`, `helpers.ts`,
`SupabaseAuthClient.ts`; auth-js `GoTrueClient.ts` (defaults, constructor, the code-verifier key),
realtime-js `RealtimeClient.ts` (`setAuth`, `_performAuth`, connect and heartbeat), the
`StorageClient` and `PostgrestClient` constructors; `docs/specs/STATE.md`, `DEBT.md` (D60, D83),
`COVERAGE.md` (the `ports/supabase.test.ts` row); `tests/db/run.mjs`, `delete-account.test.mjs`
(the 3x case), `tools/supabase/restore.mjs` (`cli`, `runningContainer`, `ensureStackWithAuth`),
`restore-drill.mjs` (`main` and its handlers), the callers of `restore.mjs`;
`20260925120000_delete_account.sql`, `20260928120000_purchase_requests.sql` (keys, indexes),
`20261007130000_homebrew_links.sql` (`list_entries_hb_item`); `tests/e2e/lib.mjs` (`storageKey`,
`projectRef`), `run.mjs` (the configured build), the e2e sign-in path in `admin.mjs` and
`flows.mjs`; `eslint.config.mjs`; `tools/bundle-budget.mjs`; `.claude/README.md` (the publishable
key and `Authorization` note, the FAIL table). Searched every use of `supabase-js`,
`x-client-info`, `restore.mjs` exports and `npx supabase`.

Ran (read-only, in memory, no file written, no Supabase): rolldown 1.2.6 from the main checkout,
minified, gzip, browser platform, of two entries that construct the account client and touch
`auth`, `rpc`, `from`, `channel`, `removeChannel`, `storage.from` and
`REALTIME_SUBSCRIBE_STATES`: `createClient` from supabase-js 53.37 kB; the four packages wired as
3.11.1 describes 49.22 kB; functions-js alone 1.37 kB.

## Blockers

1. No gate proves the D60 auth client's configuration beyond three options, and no case runs the
   real packages (plan 3.11.1, the `accountClients` bullet; 7.3 step 2; the D60 acceptance lines).
   - Step 2 pins `storageKey`, `flowType` and `detectSessionInUrl`. Nothing pins the four
     endpoint URLs, the auth client's `headers`, `persistSession`, `autoRefreshToken`, or that
     the auth client's `fetch` is the plain `keepaliveFetch`, not the token wrapper.
   - The hosted e2e signs in by a magic link in Node (`tests/e2e/admin.mjs`, `verifyOtp`) and
     injects the session (`flows.mjs`, `contract.mjs`). It never reaches `signInWithOAuth`,
     `linkIdentity` or `exchangeCodeForSession`, and a fresh session does not refresh in the run.
   - Effect of a wrong auth URL (for example `.../auth/v1/` from a configured URL with a trailing
     slash, or a string join): the Google and Discord start, the code exchange and the token
     refresh go to a wrong address. Every gate passes; after the release no reader can sign in,
     and every stored session lapses within an hour. An auth fetch that reads the session would
     call `getSession` inside the auth client's own requests.
   - supabase-js derives every address from one base:
     `new URL(ensureTrailingSlash(url.trim()))` (`validateSupabaseUrl`), then
     `new URL('auth/v1', base)`, `rest/v1`, `storage/v1`, and `realtime/v1` with `http` replaced
     by `ws`.
   Change:
   - 3.11.1: one base built by supabase-js's rule above for the four URLs and the storage key;
     one `keepaliveFetch(url, tab)` instance, handed to the auth client and wrapped by `authed`.
   - 7.3 step 2, first case: for `https://abcdefghijklmnopqrst.supabase.co`,
     `https://ABC.supabase.co:443/` and `http://127.0.0.1:54321`, `AuthClient` gets exactly
     `{ url: '<origin>/auth/v1', headers: { Authorization: 'Bearer k', apikey: 'k' }, storageKey,
     flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true,
     fetch }` (plus `storage` when given); `PostgrestClient` gets `<origin>/rest/v1` and
     `schema: 'public'`; `RealtimeClient` gets `wss://<host>/realtime/v1` (`ws://` for the local
     URL); `StorageClient` gets `<origin>/storage/v1`. A request through the auth client's fetch
     calls `getSession` zero times and carries no `x-dhloot-tab`.
   - 7.3 step 2, a new test file with no module mocks (for example
     `app/src/ports/supabase.real.test.ts`): the real four packages, a memory `storage` handed to
     `createCloud`, `fetch` stubbed by `vi.stubGlobal`. Cases: a session stored under
     `sb-<ref>-auth-token` (expiry far ahead) makes `prefs.load()` send `apikey`,
     `Authorization: Bearer <access_token>` and `x-dhloot-tab` to `<origin>/rest/v1/user_prefs`;
     a `createCloud` with `redirect.code` and a verifier stored under
     `sb-<ref>-auth-token-code-verifier` posts to `<origin>/auth/v1/token?grant_type=pkce` with
     that verifier and, on a session answer, writes `sb-<ref>-auth-token`. If the test
     environment allows the navigation, also: `auth.signIn('google')` and `auth.signIn('discord')`
     (not awaited: the answer waits for `pageshow`) leave the verifier in the store. Optional
     oracle: supabase-js's `createClient` (it stays a devDependency) with the same options, its
     requests compared field by field except `X-Client-Info`.
   - Acceptance: one D60 line for each of the three cases above; the COVERAGE row names the file.

## Risks

1. Standing check 2: plan 4.3 states the wrong outcome for a request without the session's token
   and names the wrong loss path (4.3 item 2, the "a lapsed session" row and the paragraph under
   the table; the Status trigger line repeats it).
   - A write sent with the key alone is not dropped. PostgREST refuses an `anon` call with 401
     (`42501`, `PGRST301`, `PGRST303`), and `writeOf` reads 401 as `network`, so the buffer keeps
     the write and sends it again (`supabase.test.ts`: "another 42501" at 401 is `network`).
   - What the table leaves out: a read as `anon` answers 200 with no rows (row level security),
     so a list, homebrew or prefs read looks empty; a private topic join is refused; an upload is
     refused by the storage policy, which `uploadRefusal` most likely reads as the picture limit
     (403, `limit`, `homebrew_art`), so the reader gets a wrong message and the picture is not
     stored.
   - The shape that drops a write is a request with another session's token (`P0002` `gone`, 403
     `refused`). The per-request read rules it out, and step 2's "second account with C" case
     proves it.
   Change: rewrite the row as "a request with no session token (a lapsed session, or a token
   that did not reach a client) | reads answer no rows; an upload is refused as the picture
   limit | a write is kept (401 reads as `network`); the picture is not stored | sign in again".
   Rewrite the paragraph: "The path that loses stored data is a request sent with a token other
   than the session's at its send; `authed` reads it per request; the unit cases and `npm run
   e2e` prove it." Keep the e2e list (writes, the owner topic, F20's upload).

2. Owner rule: Q1 says "D60: its own batch; `npm run e2e` is its gate" (`context.md`; plan 9.0).
   The refresh before B3 puts D83's migration and security definer function, the stack tooling
   and the overload timing into the D60 batch (plan 7, split criteria; 10). The plan cites Q1 for
   the B2 | B3 split and then merges, but it does not name the merge as a departure from Q1's
   wording. A failed e2e or test push then has two candidate causes in one commit. This decision
   is the owner's.
   Change (recommended: keep the merge and record it): plan 10, "Refresh before B3", gains one
   line: "D83 and the tooling share B3 with D60, against Q1's 'its own batch'. Reason: the shared
   `check:db`, push and `e2e` save about 40 minutes. Trade-off: a failed e2e names its flow, and
   the batch review reads D60 and D83 apart. The owner confirms or splits at the next check-in."
   Copy the line to `context.md`, "Decisions already settled". The alternative, a D60-only B3 and
   a B3b for D83 and the tooling, costs one more `check:fast`, `check:1`, `check:2`, `check:db`,
   push and `e2e`.

3. Step 0 may time the wrong CLI, and the 240 s cap has no rule when it binds (plan 3.11.3; 7.3
   steps 0 and 6).
   - Step 0 times `npx supabase start -x <excludes>` and step 6 runs `npx supabase stop`. This
     worktree has no `node_modules`. `npm exec` looks for the bin in the nearest package's
     `node_modules/.bin`, so in this worktree it may fetch and run another CLI version, or ask to
     install it. I did not run it, so I am not sure. `check:db` spawns the binary that
     `supabaseCli()` resolves up the parents, and that binary is the one to time.
   - "Three times the slowest, at most 240 000 ms": a slowest warm start past 80 s gives less than
     three times the margin, and a slowest start past 240 s makes every start fail.
   Change: step 0 resolves the binary first (`node --input-type=module -e "const m = await
   import('./tools/supabase/lib.mjs'); console.log(m.supabaseCli(process.env));"` from the
   worktree), then `Measure-Command { & <path> start -x <excludes> }` and `& <path> stop` between
   runs. Use the same path for step 6's stop. Add to 3.11.3: when three times the slowest is past
   240 000 ms, the bound is 240 000 ms if the slowest is at most 120 s; otherwise stop for the
   planner, with the three figures in the handoff.

4. The restore half of the tooling cannot meet its acceptance line as written (plan 3.11.3, "B2
   Nit 5"; 4.3, the `restore:drill` row; the acceptance line "each timeout one FAIL line").
   - `runningContainer()` answers `null` for "not running", so a `docker ps` timeout has no way
     out. In `run.mjs` it reads as a missing container and leads to a stop and a start.
   - `ensureStackWithAuth()` answers `null` for every failure. The drill then prints "the local
     stack with Auth did not start (supabase start or status failed)." and no timeout.
   - The shape `restore: FAIL - ...` does not exist. The tools print `restore:drill: <message>`
     then `restore:drill: FAIL` (and `restore:prod: ...`). `reviews/B2.md`, Deviations, accepted
     the existing shape.
   Change: `runningContainer()` throws `Error('docker ps did not answer in 30 s. ...')` on a
   timeout. `run.mjs` catches it around the container checks and prints `failLine('check:db',
   err)`, then returns `SAID`. `ensureStackWithAuth()` throws on a timed-out start, stop or
   status with the `stalled()` text. The drill's `main()` catch puts it in `state.failure`, and
   `restore-prod.mjs` has the same handler. In 3.11.3, 4.3 and the acceptance line, write the real
   shapes: "`check:db: FAIL - ...`; `restore:drill: <message>` then `restore:drill: FAIL`". Add a
   `node:test` case for the throw (a stub `spawnSync` result with `error.code === 'ETIMEDOUT'`,
   through the existing `runTimed` failure helper).

## Nits

1. `local` - `docs/specs/STATE.md`, the `sb-<ref>-auth-token` row, says "(supabase-js 2.117.1)"
   and "Written and removed by supabase-js, never by the app". After D60 auth-js writes the keys,
   and the port names the key by supabase-js's rule. Add `STATE.md` to 7.3 "Files expected" and
   step 8. Write "Written and removed by auth-js 2.117.1 under the key that `ports/supabase.ts`
   names by supabase-js's rule (`sb-<first host label>-auth-token`); never by the app's own
   code".
2. `local` - `COVERAGE.md`'s `ports/supabase.test.ts` row says "over a stub supabase-js client"
   and "the prefix parsed as supabase-js parses the configured URL". Step 8 names only the
   `delete-account.test.mjs` and `list-shares.test.mjs` rows. Add this row: the four package
   stubs, the storage key, the per-request token, the `setAuth` rule, and the new file of
   Blocker 1. Update the same wording in `COVERAGE.md` (the F1 paragraph, the Node paragraph),
   `tests/e2e/lib.mjs` (two comments), `tools/bundle-budget.mjs` (the chunk comment) and
   `supabase.ts` (the comments at `keepaliveFetch`, `storage` and `onChange`).
3. `local` - 3.11.1 names `INITIAL_SESSION` in the token rule. Step 2's cases and the acceptance
   line leave it out. supabase-js calls `setAuth(token)` on it when the token changed, and a page
   load with a stored session emits it, not `SIGNED_IN`. Add "`INITIAL_SESSION` with A calls
   `setAuth('A')`; `INITIAL_SESSION` with no session calls nothing".
4. `local` - the bundle claim. My in-memory build measured 53.37 kB against 49.22 kB gzip, about
   4.2 kB less (functions-js alone 1.37 kB). The rest is `SupabaseClient`, its helpers and the
   tracing code that `fetch.ts` imports. The app's chunk compresses as one file, so its figure
   can differ. Change the D60 acceptance line to "smaller than step 0's figure, both figures in
   the README; the budget stays 303 kB". Drop "about 1.5 kB" in 4.3 item 1.
5. `local` - the amendment line in the 2026-09-24 decision. Three facts belong in it:
   - supabase-js also sent `X-Client-Info: supabase-js/2.117.1; runtime=web` on all four
     clients. The plan's headers drop it, and nothing in `supabase/`, `app/`, `tests/` or
     `tools/` reads it.
   - The five `@supabase/*` packages move together at one version: a split installs a second
     copy, and the old and the new bundle share one stored session.
   - The decision rejected a design that "would read supabase-js's private storage key names".
     The port now names that key itself, by the same rule, so a library upgrade cannot move it.
6. `local` - D83's `analyze` inside the rolled-back 3x transaction. As far as I know, ANALYZE
   writes `pg_class.reltuples` and `relpages` in place, and counts its own transaction's
   inserted rows as live. The seeded counts (about 1.35 million request lines) then stay after
   the rollback, while the column statistics roll back. I am not sure; it is a check, not a
   measured fact. Later files plan on those counts, and the overload timing in
   `list-shares.test.mjs` runs after it. Write it in the case's comment, or run `analyze` on the
   same tables again after the rollback, outside a transaction.
7. `local` - 3.11.2's trade-off says "a press a minute later finishes". Write the mechanism:
   autoanalyze runs when the changed rows pass 50 plus 10 % of a table's row count, and
   autovacuum looks every 60 s. A table that holds other accounts' rows already has statistics
   for the planner. The hosted figure is not measured.
8. `local` - `stalled()` in `run.mjs` prints `STACK_TIMEOUT_MS / 60000` minutes. With
   `DHLOOT_STACK_TIMEOUT_MS=1000` the forced run of step 6 prints a fraction of a minute. Use the
   reset line's format (`N minutes` when whole, else `N s`), through `stackTimeoutMs(env)`.
9. `local` - step 0 reads the `anon` timeout from the test project only; agents do not read
   production. State in 3.11.3 that the bound takes production as equal (both Supabase defaults).
   When `rolconfig` holds no `statement_timeout`, read `pg_db_role_setting` for the database and
   for `authenticator`, and record the effective value. A silent fallback to 3 s is not a
   reading.
10. `local` - the overload timing case and the 3x delete case assert a host-dependent time in
    `check:db`, which CI's `db` job runs and `deploy` needs. Name it in the `COVERAGE.md` row:
    the figure is this host's; a CI miss is a `DEBT.md` entry with the CI figure, not a retry.
11. `local` - 4.3 item 1 keeps "the busy state about 25 s at 3x". That estimate is from B1's
    single-statement delete. With bounded calls it is about 24 round trips, 2-4 s of request
    deletes and the final step. Write "an estimate of 5-10 s on the hosted project, not measured".
12. `local` - `handoff.md`, "Notes", has no "Screenshot findings:" line
    (`.claude/templates/handoff.template.md`). Add "Screenshot findings: none (no screen change
    in B3)".

## Deviations

- The handoff records B2's deviations; `reviews/B2.md` judged each of them. The refresh before B3
  records no new deviation. Its choices (D83 with `analyze` in its case, the merge into B3, the
  stack bound by measurement) are decisions in plan 10, judged below and in Risk 2.

The dispatch questions:

- Storage key: matches. supabase-js 2.117.1 builds `` `sb-${baseUrl.hostname.split('.')[0]}-auth-token` ``.
  The plan uses the same rule, and step 2 pins the hosted and the local key. The hosted proof is
  real: `flows.mjs` and `contract.mjs` store the session under `tests/e2e/lib.mjs`'s own
  `storageKey()`, so a changed key fails every signed-in flow. The PKCE verifier keys derive from
  the storage key (auth-js `${storageKey}-code-verifier`; `STATE.md`). A redirect started on the
  old bundle therefore finishes on the new one.
- Token refresh: auth-js is unchanged, and `authed` reads `getSession()` per request, as
  `fetchWithAuth` does. realtime-js calls `accessToken` on connect and on every heartbeat (25 s),
  in addition to `setAuth` on the auth events. Unit cases cover it; no e2e run reaches a refresh.
- `fetchWithAuth`: the plan matches 2.117.1 for PostgREST, Storage and Realtime. It sets `apikey`
  when absent, and `Authorization: Bearer <token ?? key>` when absent. The "no key as bearer"
  rule applies only to Edge Functions with a new-format key, and the app drops functions-js.
  Trace propagation is off by default. The one difference is `X-Client-Info` (Nit 5).
- Realtime: `params.apikey`, `accessToken: token ?? key`, `fetch: authed` and the
  `_handleTokenChanged` rule all match. `setAuth()` on `SIGNED_OUT` reads the callback, as
  supabase-js does. `INITIAL_SESSION` is untested (Nit 3).
- Storage headers: supabase-js passes its global headers (`X-Client-Info` only) and its
  auth-wrapped fetch. The plan's `{}` and `authed` are equal apart from that header.
- PostgREST: the URL, `schema` and `fetch` match. `timeout`, `urlLengthLimit` and `retry` are
  unset in both, so postgrest-js's own defaults apply in both.
- PKCE and the Google and Discord redirect: the same auth-js with the same options and storage
  key. The gap is the proof, not the design (Blocker 1).
- Bundle: the win is larger than claimed (Nit 4).
- D83: the decision holds. The request lines are row volume (2.3-4.2 s as one statement). The
  rest is a statistics effect (318 ms with `analyze`, 4.9-5.7 s without), and an index on
  `list_entries (hb_item)` exists for `homebrew_links_touch`. The function has a fixed
  `search_path`, a null `auth.uid()` refusal (`28000`), `EXECUTE` revoked from `public` and
  `anon` and granted to `authenticated`, and a reversal that drops it. The layer 3 matrix (pins,
  refusals, at most 200 a call, another user's request left, prune-only, 3x under `'4s'`) and the
  `supabase.test.ts` resume case answer the named loss. `share_id` is `not null ... on delete
  cascade`, so the join through `list_shares` reaches every request of the owner's lists. The
  accepted trade-off is stated; Nits 6 and 7 apply to its text.
- `STACK_TIMEOUT_MS`: inherited stdio removes the recorded pipe shape, and the override makes the
  bound testable. Risk 3 and Nit 8 apply.
- The layer 3 timing bound: the `'{}'` form is the worst case of database time (an md5 of every
  snapshot, no strip), so timing it against the two-argument form answers B2 Risk 2. Nits 9 and
  10 apply.

## Standing checks

1. Scale: checked - plan 4.3 item 1 against the code. No screen draws differently, so no width
   or keyboard state applies. D83 at 3x: 4500 pending requests, 24 prune calls of at most 60 000
   lines and one `delete_account()`; at the defaults, 4 calls; the cap of 100 calls (20 000
   requests) falls back to `delete_account()`. The overload is timed on 300 linked records of
   about 81 KB. Findings: Nit 11 (the busy estimate), Nit 4 (the bundle figure).
2. Error scenarios: checked - the 4.2 D83 rows (a prune failure, a failed final step with its
   resume, two tabs, a request sent during the loop, another tab first, the reversal) against
   7.2 steps 5-6; the 4.3 D60 rows against `writeOf`, `callFailure` and `uploadRefusal`; the
   tooling rows against `run.mjs` and `restore.mjs`. Findings: Risk 1 (the outcome of a request
   without a token, and the real loss path), Risk 4 (a timeout of `docker ps` or of the drill's
   start has no FAIL line).
3. Consistency: checked - no new string, toast or label; the account delete keeps
   «Аккаунт удалён.» and the one error toast; the override follows `DHLOOT_RESET_TIMEOUT_MS`;
   the remedy lines share `stackAdvice`. Finding: Risk 4 (a FAIL shape that the tools do not
   print).
4. RU/EN parity: not applicable - B3 adds and changes no user-visible string; the changed output
   is English tool output.

Owner rules: checked - `context.md` tags the refresh before B3's defaults to B3 with homes in the
D83 decision file and `FEATURES.md` "Account": both are in 7.3 "Files expected" and step 8. The
plan review before B3 is in Status. D90's hang guard is in 7.3 step 6 and the verification block.
The README net-zero rule is an acceptance line. Q1's "D60: its own batch" is not named as a
departure (Risk 2). No rule is over budget.

## Suggested next action

fix-then-continue: the planner applies Blocker 1, Risks 1-4 and Nits 1-12 in one pass (each names
its section and change), then the implementer runs B3 with no second plan look. Risk 2 is the
owner's decision. Recommended: record the merge as a default and ask the owner at the next
check-in, because a split costs about 40 minutes of gates for a cleaner bisect. The trade-off is
one commit with two candidate causes for an e2e failure.

## Checks still needed

- The shape of the orchestrator's hang guard (a 300 s window of silence, or 300 s in all). It is
  recorded only in the untracked decisions file. With inherited stdio, a silence window restarts
  at each line of CLI output.
- Whether `npx supabase` in this worktree runs the parent checkout's CLI (Risk 3).
- The hosted `anon` statement timeout (7.3 step 0) and the configured bundle figure on the real
  build (Nit 4).
- After the batch: `select relname, reltuples from pg_class where relname in
  ('purchase_request_lines', 'list_entries')` on the local stack after the 3x case (Nit 6).
- Before the release push: a person signs in with Google and with Discord, and links one to the
  other, on a build of B3 against the test project. No gate reaches the provider's consent page.
