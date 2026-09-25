# Shared task context - TASK persistent-storage

## Goal
Implement persistent storage: accounts (Google/Discord via Supabase), cloud
lists with player/GM share links, legacy local-list migration, JSON
import/export, homebrew with media, Realtime. This session's output is a
finalized high-level plan with batch splits, so that later sessions run small
plan-implement-review-remediate loops per batch.

## Release status
- R0 closed 2026-09-24; R1 `persist-1-auth` closed 2026-09-25 (record:
  `plan.md` section 16, "R1 closeout record"). Next: R2 `persist-2-lists`.

## Input design (external, not authoritative)
- `C:\Users\Ignat\OneDrive\Desktop\persist\DAGGERHEART-LOOT-PERSISTENCE-DESIGN.md`
  (2590 lines, revised 2026-09-23, reviewed repo revision `4976cb4`).
- Owner instruction: treat it as high-level input "with a grain of salt"; it
  can be outdated, wrong, confusing or have major gaps. It is not a plan.
- Sections: 1 summary, 5-6 scenarios, 7 catalog authority, 8 DB design,
  9 RLS, 10 APIs, 11 save buffer, 12 Realtime, 13 migration/cutoff, 14 URLs,
  15 OAuth/security, 16 media, 17 manual config, 18 phases 0-7, 19 tests,
  20 corner cases, 21 fixed decisions.
- Secrets live next to it in `.env` and `.env.test.local` (key names only
  here; never copy values into the repo, a VITE_ variable, or a task doc):
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_AUTH_EXTERNAL_{GOOGLE,DISCORD}_{CLIENT_ID,SECRET}`,
  `SUPABASE_DB_PASSWORD`, `E2E_SUPABASE_URL`,
  `E2E_SUPABASE_PUBLISHABLE_KEY`, `E2E_SUPABASE_SECRET_KEY`,
  `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`.

## GitHub issue
- None exists for persistence. Related: #47 (Svelte rewrite, closed
  2026-09-17), #69 (PWA, closed 2026-09-23), #50 (list selection/partial
  purchase; shipped parts on main, e.g. `d8a23dc`, `ad050f6`).

## Repository facts (verified 2026-09-24, HEAD `12557fe1`)
- Build is still the #47 shape: classic-script `data.js` + `assets/app.js`
  IIFE, relative paths, `file://` supported. The design's Phase 0 build
  change has not started.
- #69 shipped: `sw.js`, manifest, `pages/src/` generator
  (`install.html`, `en/`), `img/thumb/`. No `pages/privacy.html` or
  `pages/terms.html` (live URL 404).
- `app/src/ports/` has `data.ts` (sync DataPort), `storage.ts`, `pwa.ts`,
  `router.ts`, etc. No Supabase code, no `supabase/` directory, no
  `@supabase/*` dependency.
- `.claude/README.md` "Persistence era: decided now, activated at Phase 0"
  (line ~934) and its row 42 already decide the agent-config guards: RLS
  gate, migration-reversibility gate, applied-migration `edit-guard.mjs`
  rule, gitleaks-on-commit, one session per shared database. Status:
  decided, not installed; transfers to this task's plan.
- Laws this work supersedes: `CLAUDE.md` "Product laws" bullet 1 (no
  backend), "Project shape"/"Architecture boundaries" `file://` clauses,
  `docs/specs/META.md` line ~51 ("There is no backend and there will not
  be one"). `META.md` ~286 and ~367 already anticipate Phase 0 and the
  policy pages; `docs/DECISIONS.md` ~249 names the policy-page recipe.
- gitleaks runs only in CI (`.github/workflows/ci.yml` `secrets` job,
  pinned SHA). No local hook runs it.
- `.nvmrc` = 24; host Node v24.15.0.

## Health check results (2026-09-24)

| Area | Result |
|---|---|
| Prod Supabase `zzmrftmzefcqehhyztjq` (eu-west-1, PG 17.6) | ACTIVE_HEALTHY |
| Test Supabase `rdjxcjkhsklhprmzxajq` "daggerheart-loot-test" (eu-west-1, same org) | ACTIVE_HEALTHY |
| Prod Auth providers (`/auth/v1/settings`) | google=on, discord=on, email=off, phone=off, anonymous=off, signup enabled |
| Test Auth providers | email=on only, anonymous=off |
| Prod `/authorize` google | 302 to accounts.google.com, client id matches local `.env` |
| Prod `/authorize` discord | 302 to discord.com, client id matches local `.env` |
| Data API root with publishable key | 401 "Secret API key required" on both projects (expected) |
| Supabase CLI (`npx supabase`) | 2.117.0, logged in, lists both projects; no project linked in this tree |
| Docker engine | Rancher Desktop 1.24, engine 29.5.3 linux, context `default` (`npipe:////./pipe/docker_engine`). Responds from the PowerShell tool; the Git Bash tool hangs on `docker version` (sandbox or npipe). Run `docker`/`npx supabase start` through PowerShell. Docker Desktop 3.6.0 (2021) is also installed; do not use it |
| gitleaks | 8.30.1 at `%LOCALAPPDATA%\Microsoft\WinGet\Links\gitleaks.exe`; resolves from both the Bash and PowerShell tools (owner installed, 2026-09-24) |
| Supabase Auth dashboard (browser audit 2026-09-24, read-only) | Site URL `https://artex-x.github.io/daggerheart-loot/`; redirects (changed later 2026-09-24 with the owner's OK: `localhost:8000/**` removed, `localhost:4173` added) `http://localhost:5173/?auth-callback=1`, `http://localhost:4173/?auth-callback=1`, `https://artex-x.github.io/daggerheart-loot/?auth-callback=1`; manual linking on; anonymous off; email off; Google nonce-skip off; Google and Discord refuse users without email |
| Supabase Data API | auto-expose new tables off; 0 tables exposed; Security Advisor 0 errors / 0 warnings / 0 info (2026-09-24) |
| Google OAuth client | redirect URIs: the Supabase callback and `http://127.0.0.1:54321/auth/v1/callback`; JS origins `https://artex-x.github.io`, `http://localhost:5173` |
| Google consent screen | Testing. "Publish app" is refused until Branding has a privacy policy link ("To publish your app, you must complete your configuration on the Branding page"); privacy and terms links empty. `artex-x.github.io` IS accepted as an authorized domain; the Supabase host is the second. Publishing needs no verification for openid/email/profile |
| Discord application | one redirect, the Supabase callback; Public Client off |
| GitHub Pages | build_type=workflow, https enforced |
| Env `github-pages` | custom branch policy only; no reviewers |
| Env `supabase-production` | does not exist |
| `main` branch protection / rulesets | none |
| Actions variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` set (owner, `gh variable list`, 2026-09-24) |
| Actions secrets | `TG_API_HASH`, `TG_API_ID`, `TG_SESSION`, and `E2E_SUPABASE_URL`, `E2E_SUPABASE_PUBLISHABLE_KEY`, `E2E_SUPABASE_SECRET_KEY`, `E2E_USER_EMAIL` set (owner, `gh secret list`, 2026-09-24); `SUPABASE_DB_URL_TEST`, `SUPABASE_DB_URL_PROD` added and `E2E_USER_PASSWORD` deleted (owner, 2026-09-25); variable `BACKUP_AGE_RECIPIENT` added (owner, 2026-09-25) |
| Supabase CLI config commands | `supabase config push` and `supabase config diff` exist in 2.117.0; the help warns that a non-interactive push also writes template values (a local `site_url`) over a customised hosted setting - always `config diff` first, never a blind `--yes` (owner, 2026-09-24) |
| `https://artex-x.github.io/` root | 404 (no user-site repo) |

The dashboard items that the API probes could not show (redirect
allowlist, Site URL, linking, nonce, no-email toggles, Data API exposure,
Security Advisor) were read in the browser on 2026-09-24 - the rows above.

The E2E user sign-in was not probed: the agent may not authenticate with a
password. The owner runs that check.

## Google OAuth findings (2026-09-24)
- Owner-reported: the Google OAuth app is in Testing mode.
- Google Cloud help (support.google.com/cloud/answer/15549945): an external
  app that requests only openid/email/profile is exempt from the Testing
  restrictions and can be published to production with no verification.
  Brand verification is only for showing the app name/logo; without it the
  consent screen shows only the domain (the Supabase host).
- Corrected 2026-09-24 by the browser audit: `artex-x.github.io` is
  accepted as an authorized domain, and "Publish app" is refused until the
  Branding page carries a privacy policy link. So the policy pages ARE the
  blocker for leaving Testing mode; brand verification (name and logo on
  the consent screen) is a separate, unpursued step.
- Consequence for the plan: `privacy` and `terms` ship in R0; the owner
  sets the Branding links and publishes after R0 is live.

## Owner inputs recorded 2026-09-24 (through the coordinator)
- `file://` and offline use are nice-to-haves; drop them where that gives
  cleaner architecture and code. Recorded in `docs/DECISIONS.md`
  (2026-09-24) and `plan.md` section 2.
- Ship small sub-features one at a time, each deployable alone: auth, then
  lists with migration, then homebrew, and so on. One TASK id per
  sub-feature matches the intent (`plan.md` section 9).
- Batches that run the local Supabase stack use the PowerShell tool for
  `docker`, `npx supabase start`, `db reset --local` and `npm run check:db`.
- Decisions 1-15 answered 2026-09-24 (`plan.md` section 16;
  `docs/DECISIONS.md` seven entries of that date): one task per release;
  `data.js` the only catalog source; Realtime in v1 directly after lists;
  `#/l/` decoder retires at the cutoff; sign-in-only list creation from the
  lists release; `#/account` route with provider linking ("Allow manual
  linking" stays on); the scope cut otherwise as recommended.
- Second round, 2026-09-24: policy pages move to R0; "Sign out
  everywhere" in R1; "edited N ago" on cloud list cards in R2; account
  preferences (language, home section, tables view, print layout, default
  money mode) persist per account from R1, account wins and local seeds an
  empty account; a deterministic in-memory fake cloud in a test build
  (`dist-test/`) gives the goldens signed-in and signed-out states, with a
  fake-vs-real agreement test in the hosted E2E; no local JSON export after
  the cutoff; ideas duplicate list and share-open count rejected.
- Configuration as code (owner, 2026-09-24): Auth settings live in
  `supabase/config.toml` and reach the hosted projects through `supabase
  config push` after a read `config diff`; the dashboard is read-only by
  convention; the Supabase GitHub integration (Branching) is not connected.
- Privacy/abuse contact: `daggerheart.loot@gmail.com`, a dedicated
  mailbox (owner, 2026-09-24; a personal address was offered and withdrawn
  the same day). The privacy page names the operator as `artex-x`.
- Purchase requests (owner feature, 2026-09-24): a new release R4
  `persist-4-requests` after Realtime; releases R4-R9 of the earlier
  numbering became R5-R10. Anyone with a link may send; both notify-only
  and add-to-own-list flows. Questions 32-38 open (`plan.md` section 16).
- Cloud sessions (claude.ai/code), decided 2026-09-24 (`plan.md` section
  18): a whole release per host; a cloud release amends on its task branch,
  pushes it once, the owner fast-forwards `main`; network "Full"; E2E
  secret key as a proxy-attached API credential, no production secret;
  the E2E session is minted with `generateLink` + `verifyOtp`, no password.
  Goldens are OS-independent text (ubuntu CI compares Windows-seeded
  goldens green). To verify in the first cloud session: Docker works,
  Chrome for Testing downloads, Supabase images pull, and the layer 4
  probe (publishable-key request gets 401; the browser sees no injected
  header). Superseded in R1: no proxy credential (environment variables),
  a push after every green commit, the orchestrator squash-merges -
  `plan.md` section 18.

## Repository facts found by the planner (2026-09-24)
- `tests/app/driver.js` `TARGETS.next` is `file://.../dist/index.html`;
  `tests/app/states.js` already has a `serveDist()` static server on a free
  port (case 28) - the shared HTTP base for `B0.1` moves from there.
- `tools/check-site.lib.mjs` probes `sw.js` for the string `dhloot-shell`
  and `assets/app.js` by name; `ci.yml` names `assets/app.js` in its
  by-name and `cmp` checks.
- `app/src/lib/hash.ts`: `#/lists/<id>` accepts `[\w-]+`, so a UUID fits
  the existing route; `Site.hosted` and `RouterPort.hosted()` exist only
  for the from-a-folder address form.
- `tests/run-all.js` suite weights (CI seconds): sweep rows 275-327 each,
  `app/contracts` 256, `app/print` 160, golden shards 94-106, `app/states`
  103, `app/typo` 78, `app/hues` 67.
- `.claude/settings.json` registers hooks for the `Bash` tool only; a
  `check:db` run through PowerShell is invisible to `check-observer.mjs`
  until its matcher gains `PowerShell` (`B0.2`).
- Supabase Auth links identities that share a verified email automatically
  (platform default; unverified here - the owner checks at R1 closeout).

## Command costs (from `.claude/README.md`, idle host)

| Command | Wall clock | Fits one call? |
|---|---|---|
| `npm run check` | ~165 s | yes; past 600 s on a loaded host |
| `npm run check:built` | a few minutes | yes |
| `node tests/run-all.js app/print,app/contracts,app/states,app/typo,app/hues,stub` | ~260-290 s | yes |
| `node tests/app/sweep.js <width>` | ~320-590 s per width | one width per call |
| `node tests/app/golden.js --shard=n/4` | ~100-290 s per shard | one shard per call |
| `npm run check:db` (planned) | unmeasured; stack start 3-5 min once | PowerShell tool |
| hosted E2E (planned) | unmeasured | - |

## Dates
- Today 2026-09-24. Design's anonymous-write cutoff target is 2026-10-07
  (13 days), and its own Phase 2 says "no earlier than October 7 and only
  after 14 stable production days". The date cannot hold; it is an owner
  decision.

## Owner request 2026-09-25: amend decision 31 (limits) - for the R2 planner
- Limits configurable in the database: defaults in a table, not trigger
  constants; a generic per-user override (a new limit needs no schema
  change); `null` means "no limit" (decision 31 has null = the default).
- Orchestrator's proposal, not yet confirmed: `limit_defaults(key pk,
  value int null)`, `user_limit_overrides(user_id, key fk, value int null)`
  with a missing row = the default, `effective_limit(user, key)` for every
  limit trigger, no grant to `anon`/`authenticated`, `limits:set` gains
  `--default`, `--unlimited`, `--clear`. Built in `B2.1` (first user).
- Owner: `null` = no limit is a proposal; a large integer is acceptable if
  null does not fit. Orchestrator recommends null (a missing override row
  is the default, so null is free; PL/pgSQL `if n >= null` is not true) on
  one condition: `effective_limit()` raises for a key not in
  `limit_defaults`, so a typo can never read as unlimited. The R2 planner
  decides and records it in `docs/DECISIONS.md`.
- Owner confirmed 2026-09-25 (all as recommended): the proposal above;
  null = no limit with the unknown-key raise; the table covers every count
  limit (lists, entries per list, homebrew items, R4's lines per request
  and pending requests per list), while R4's rate (5 per link per minute)
  and expiry (1 hour) stay constants; an override may raise or lower a
  limit. The R2 planner applies it to decision 31 and section 14's `B2.1`.

## Owner decision 2026-09-25: agents may write to the test project
- Built in R1: `docs/DECISIONS.md`, 2026-09-25, "Agents may write to the
  test project; production is CI's or the owner's".

## Constraints
- Public contracts default to no change; each unavoidable change updates
  `docs/fixtures/`, `tests/contracts.js`, `CONTRACTS.md`, `llms.txt` in the
  same commit.
- One commit per task and amend per batch (CLAUDE.md). A multi-month
  persistence programme likely needs a different commit policy per phase;
  the planner must name it.
- Secrets never enter the repo, a `VITE_*` other than the publishable key,
  a task doc, or chat.

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
