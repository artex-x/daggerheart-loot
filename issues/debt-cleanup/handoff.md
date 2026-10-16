# Handoff - TASK debt-cleanup
<!-- Status is a snapshot: replace it, never append. Budget and compaction: .claude/skills/handoff/SKILL.md -->

## Status
- Task status: in_progress - B1 `7430de8e`, B2 `5eb69ff6`, B3 `6be801dc` done (each review
  approve); B3b (D83, the stack tooling, the overload timing) done as its own commit on
  `6be801dc`, review approve (`reviews/B3b.md`), the test push applied
  `20261015120100` and the hosted `npm run e2e` passed; the B4 refresh is next
- Last agent: implementer
- NEEDS_HUMAN_CONFIRMATION: no
- Branch: `claude/debt-cleanup` (worktree `.claude/worktrees/debt-cleanup`)
- Base / starting commit: `origin/main` `ae5ab7cf` (authoring-print-preview shipped)
- Pushed: no

## Completed
- Batch name/id: B3b - D83's account delete, the stack tooling, the overload's time (2026-10-16,
  implementer).
- What shipped:
  - D83: `supabase/migrations/20261015120100_account_delete_requests.sql` (security definer
    `delete_account_requests()`, 200 of the caller's requests a call, `28000` with no user id,
    EXECUTE for `authenticated` only) and its reversal; `deleteAccount()` (`supabase.ts`) calls
    it on `rest.rpc` until 0 or not a number, at most `ACCOUNT_DELETE_CALLS_MAX` (100), then
    `delete_account()`; an error answers `failed` and calls nothing more; `PGRST202` goes
    straight to `delete_account()`. `supabase.test.ts`: the five loop cases (200, 200, 0;
    an error; `PGRST202`; 100 calls and a non-number; the failed final step, then a finished
    second press). `delete-account.test.mjs`: the pins, at most 200 a call with their lines
    and another user's kept, the prune-only counts, `28000` and `anon` refused; the 3x case
    runs as a plain case with `analyze` in its transaction, the bounded calls and
    `delete_account()` under `'4s'`, the log line, and a second `analyze` after the rollback.
  - `tests/e2e/contract.mjs`: the art throwaway's raw `rpc('delete_account_requests')` through
    a supabase-js client with its minted token, before its `deleteAccount()`; any error fails.
  - Tooling: `STACK_TIMEOUT_MS` 180 000, `stackTimeoutMs(env)` with `DHLOOT_STACK_TIMEOUT_MS`,
    `spanText`, `stalledText`, `DOCKER_PS_TIMEOUT_MS` (`lib.mjs`); `run.mjs` runs `start` and
    `stop` with `['ignore', 'inherit', 'inherit']`, `status` piped, the bound through
    `stackTimeoutMs(env)`, and catches a `runningContainer()` throw into `check:db: FAIL - ...`
    (`readyStack`); `restore.mjs` `cli()` on `runTimed` with the same bound and stdio, throwing
    on a timeout, and `runningContainer()` throwing after 30 s - the drill's `main()` catch and
    `restore-prod.mjs`'s rejection handler already print them, so neither file changed.
    `lib.test.mjs`: the override, a bad value, the span format, the stalled text, and the
    `cli()` and `runningContainer()` throws over a stub spawn.
  - B2 Risk 2: the todo case in `list-shares.test.mjs` (300 entries, each its own item at
    `hb_maximalcardsaaaa`'s maximal record, as `anon`, three runs after `analyze`); it missed
    half the hosted `anon` timeout, so `DEBT.md` D111 holds the figures.
  - B3 Nits 1-3: `keepaliveFetch(base.href, tab)` and two URL forms in "the fetch the client
    is given" (`//` and spaces); the two comments rewrapped (`tools/bundle-budget.mjs`,
    `tests/e2e/lib.mjs`); `supabase.real.test.ts` checks the four `@supabase/*` versions equal
    supabase-js's.
  - Records: the decision "An account delete removes its purchase requests in bounded calls
    first" (figures, the autoanalyze mechanism, the trade-off), the `Amended by` line in the
    2026-10-15 statement-timeout decision, one measured line in the shared-page decision;
    `FEATURES.md` "Account"; `COVERAGE.md` (the `delete-account.test.mjs` and
    `list-shares.test.mjs` rows with the host-dependence sentence, the e2e raw check);
    `.claude/README.md` (the start-timeout row, a `docker ps` row, "the checkout the run is
    in", rule 2n's `RESET_COMMAND`, the undo paragraph of both B2/B3b migrations; net 0 over
    the task: `git diff --numstat ae5ab7cf -- .claude/README.md` 31/31); `DEBT.md` D83 deleted,
    D111 added; `node tools/decisions.js` 244, `validate` empty.
- Files changed: `git diff --stat 6be801dc HEAD`.
- Previous sha (batch diff base): `6be801dc`.
- Acceptance lines of 7.3b and their outcome:
  - D83 (every 7.2 D83 line with `analyze`): met - 24 calls, slowest 225-926 ms, final
    501-1252 ms (three runs), no row left; pins, refusals, loop, resume and prune-only cases; the reversal is
    clean (`check:db`'s up-down-up walk passed).
  - D83 Nit 6 (second `analyze`, `reltuples`): met - after the rollback `list_entries` 45000,
    `purchase_request_lines` 1350000; after the second `analyze` 0 and 0.
  - D83 raw RPC check in `contract.mjs`: met - the hosted contract (cases A-S and the
    real-only checks, the raw `delete_account_requests()` call included) passed.
  - D83 Nit 7 (decision figures, statistics, autoanalyze, trade-off; D83 deleted): met.
  - B2 Risk 3 / plan-B3 Risk 3 (timed binary, rule, override, stdio, forced 1 s run): met.
  - B2 Nit 5 / plan-B3 Risk 4 (`docker ps` FAIL line, drill throw, `node:test`): met by
    `lib.test.mjs` cases; no live `docker ps` hang was forced.
  - B2 Risk 2 / plan-B3 Nits 9, 10: met by the entry - the median missed the bound; D111,
    `COVERAGE.md` and the decision line hold both figures.
  - B2 Nit 1: cleared (D83 deleted). B2 Nit 2: met.
  - `.claude/README.md` did not grow over the task: met (31/31).
  - Test push and `npm run e2e`: met after the review's approve (Verification).
  - Own commit on the task's HEAD: met.
  - B3 Nits 1-3: met (`supabase.test.ts`, `supabase.real.test.ts`, the two comments).
- Deviations and rationale:
  - The overload timing missed its bound: the case is `todo` (it still runs and logs, about
    15 s of `check:db`) and D111 records it, by 3.11.3's rule; no redesign.
  - `restore-drill.mjs` and `restore-prod.mjs` are unchanged: their handlers already turn the
    throw into `FAIL: <message>` then `restore:drill: FAIL`, and `restore:prod: <message>` then
    `restore:prod: FAIL`.
  - `check:db` ran twice: the first PASS (707 s) was on a tree before a lint fix in
    `supabase.ts` (`no-unsafe-assignment` on the RPC answer) and the todo text's third figure.
  - The 3x case's analyze names the ten seeded tables, `auth.users` included; the run printed
    no privilege warning.
- Review: required (trigger: a migration, a SECURITY DEFINER function, possible loss of stored
  data), report `issues/debt-cleanup/reviews/B3b.md`: approve, Reviewed `758af368`, the
  migrations tree `94170da2` (equal to `git rev-parse HEAD:supabase/migrations` before the
  push); Risk 1 and Nits 1-4 below.

## Verification
- Commands run (exact): the commands in Results below, each as written there.
- Results (this host, 2026-10-16):
  - Step 0: `origin/main` `ae5ab7cf`, newest migration `20261014120200_link_previews.sql`
    (no newer one). The binary `supabaseCli()` resolves:
    `E:\dev\daggerheart-loot\node_modules\@supabase\cli-windows-x64\bin\supabase.exe`
    (CLI 2.117.0). Three warm starts (`Measure-Command { & <bin> start -x imgproxy,mailpit,
    postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor }`, `& <bin> stop`
    between): 42.5 s, 40.5 s, 39.9 s; stops 4.1-5.0 s. Rule: 3 x 42.5 = 127.5 s, up to the
    minute: `STACK_TIMEOUT_MS` = 180 000 (under 240 000).
  - Step 0, hosted `anon` timeout (read-only scratch script, `--env-file=.env.test.local`):
    `rolconfig` of `anon` `statement_timeout=3s` (effective 3 s; `authenticated` 8s,
    `authenticator` 8s; `pg_db_role_setting` agrees). Bound: 1500 ms.
  - Focused before the gates: `vitest run supabase.test.ts supabase.real.test.ts` 245 pass;
    `node --test tools/supabase/lib.test.mjs` 117 pass; the two db files on a reset stack:
    the 3x case `seed 42071 ms, 24 calls, slowest 334 ms, delete 501 ms`; the overload medians
    1728/2305 ms and 2072/3214 ms (two runs; the two `check:db` runs add 2120/3237 and
    1550/2346).
  - Forced stack timeout: stack stopped, `$env:DHLOOT_STACK_TIMEOUT_MS = '1000'; npm run
    check:db` printed `check:db: supabase start did not finish in 1 s (DHLOOT_STACK_TIMEOUT_MS
    sets the bound, for a first start that pulls its images). Run "npx supabase stop" ...` then
    `check:db: FAIL` in 3.7 s; `Get-Process supabase` found nothing; then `& <bin> stop`.
  - `rtk npm run check:fast`: PASS in 101 s.
  - `npm run check:db` (PowerShell, the hang guard: Rancher `win32\bin` first, a log, 1100 s
    limit, 300 s stall kill; no stall): PASS in 707 s on the first tree (561 tests, 1 todo;
    reset 44 s; `delete-account: 3x seed 38881 ms, 24 calls, slowest 225 ms, delete 513 ms`;
    `list-shares: ... median (text, bigint) 2120 ms, (text, bigint, jsonb) 3237 ms`).
  - `rtk npm run check:1`: first FAIL (lint:typed, `supabase.ts` RPC answer); after the fix
    PASS in 362 s (18 stages).
  - `rtk npm run check:2`: PASS, 652 s, 4138 tests in 112 files; the tool moved the call to
    the background at 600 s and the run ended in the turn with `gate credit: armed`.
  - `npm run check:db` on the final tree, the first try: `check:db: supabase start did not
    finish in 3 minutes (DHLOOT_STACK_TIMEOUT_MS ...)` then `check:db: FAIL` at 185 s, before the
    guard's stall kill - Docker answered `timed out dialing Hyper-V socket` after a Rancher
    restart (a live proof of the new bound). `rdctl shutdown`, `rdctl start`, `docker ps`
    three times in a row, then the re-run: PASS in 733 s (561 tests, 1 todo; reset 45 s;
    `delete-account: 3x seed 41399 ms, 24 calls, slowest 926 ms, delete 1252 ms`;
    `list-shares: ... median (text, bigint) 1550 ms, (text, bigint, jsonb) 2346 ms`); `gate
    credit: armed`. The stack and Rancher stopped after it.
  - After the review's approve (2026-10-16): the test push `node
    --env-file=E:/dev/daggerheart-loot/.env.test.local --input-type=module -e
    "process.env.SUPABASE_DB_URL=process.env.SUPABASE_DB_URL_TEST; await
    import('./tools/supabase/migrate-test.mjs');"` from this worktree printed `migrate-test:
    applied 1` (`20261015120100_account_delete_requests.sql`); a second run printed
    `migrate-test: none pending`. Then `node --env-file=E:/dev/daggerheart-loot/.env.test.local
    --import ./tests/e2e/ts-hooks.mjs tests/e2e/run.mjs`: `e2e: PASS` on the first run
    (contract ok, cases A-S and the real-only checks; configured build; F0-F20; cleanup ok).
  - The hosted server time of the two `get_shared_list` forms at a modest seed: not measured;
    it needs a seeded shared list on the test project, more than a read-only call.
- Gates: `npm run check` (both halves), `npm run check:db`; `check:built` not required (no
  screen change; `check:fast`'s budget 239.1 kB of 242).

## Next batch (implement-ready)
- Name: the B4 refresh (planner), then B4.
- Objective: expand B4 (`plan.md` 7.4) and place D111 and B3b review Risk 1.
- In scope: `plan.md` 3.12, 7.4; the items under "For the B4 refresh" below.
- Out of scope: B5.
- Files expected: `plan.md` 7.4 at its expansion.
- Steps: `plan.md` 7.4 at its expansion.
- Acceptance criteria: `plan.md` 7.4 at its expansion.
- Verification commands: `plan.md` 7.4 at its expansion.
- Risks / do-nots: `20261015120100` is applied on the test project; a behaviour change is a
  new migration.
- Fallback (optional): none.
- For the B4 refresh:
  - B3b review Risk 1 (D111, partly a B2 regression at 3x): place a fix in this release before
    the closeout, as its own acceptance line. The review recommends a port-only fallback: when
    the three-argument `get_shared_list` call answers `57014`, `shares.read` reads once
    more with the call of before B2 (`{ p_token }` or `{ p_token, p_since }`) and uses that
    answer whole, as the `sharedHaveGone` path does; two `supabase.test.ts` cases (`57014`
    then a whole answer with no `rev` answers ok; two failures answer `{ ok: false }`).
    D111 stays for the live build; its verification records the server-side time. The other
    option, D111 kept on purpose, is the owner's decision (a user-visible failure at 3x).

## Blockers
- none.

## Deferred
- B3b review Nit 1 (local): `.claude/README.md`, "Expected Security Advisor warnings": add
  `delete_account_requests` to the `delete_account` row with no new line. Its deferred-scope
  part: the table lists only R5's seven functions (later definer functions with a Data API
  grant and the counts are missing); name it to the human at closeout.
- B3b review Nit 2 (local): `DEBT.md` D111, "Why deferred": keep the design reason only; if
  Risk 1's fallback ships, add that it restores the pre-B2 cost and the entry stays for the
  live build.
- B3b review Nit 3 (local): rewrap the "Measured" line of the shared-page decision to 96.
- B3b review Nit 4 (local): `delete-account.test.mjs`, the 3x case: put the second
  `analyze` and the `reltuples` log in a `finally` around the `asRole` call.
- D111 (the shared page of 300 maximal linked records nears the `anon` timeout): new
  `DEBT.md` entry under "Debt cleanup"; the planner places it (B4 refresh or the closeout).
- B3 review Nit 4 (`reviews/B3.md`): the B3 handoff had no "- Gates:" line and gave a wrong
  reason for the decision reflow (`BODY_MAX` applies only from 2026-09-26); this handoff has
  the line, and the reason stands corrected here.
- B3 review Nit 5 (deferred-scope): five decision files still cite `DEBT.md` D60; the closeout
  decides on a one-line amendment of the 2026-10-14 bundle-ceiling decision.
- B2 Nit 4: the commit subject names "the B1 nits"; the closeout squash names the behaviour
  (`plan.md` 7.5).
- B1-4 (the D61 bad-value test): B4.
- Configured bundle 296.8 kB, budget 303 (B3): B4 and B5 raise the budget by the rule when they
  pass it.
- The owner's Google and Discord sign-in and link on a B3 build: B5's closeout (`plan.md` 7.5).
- The Items-tab filters in the address (a route change); named to the owner at closeout.
- `catalog-copy` (K5): its own task.

## Notes
- Mocks path: none yet (B4, B5 at their expansions).
- Screenshot findings: none (no screen change in B3b).
- Cleanup performed / retained artifacts: scratch scripts in the session scratchpad only
  (`anontimeout.mjs`, `warmstart.ps1`, `focused.ps1`, `guard.ps1`); the local stack and
  Rancher Desktop stopped after the last `check:db`.
- Session end partial progress (if any): none.
- Durable items written to their homes this batch: the D83 decision file, the two decision
  lines, `FEATURES.md` "Account", `COVERAGE.md`, `DEBT.md` (D83 out, D111 in),
  `.claude/README.md` ("The database suite", the undo paragraph, the hook table).
  `reviews/B3b.md` is untracked (the amend takes the handoff only). Carry for
  the closeout: `persist-review`'s roadmap row (`plan.md` 2.2, K14).
