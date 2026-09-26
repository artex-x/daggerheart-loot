# Shared task context - TASK persistent-storage

## Goal
Implement persistent storage: accounts (Google/Discord via Supabase), cloud
lists with player/GM share links, legacy local-list migration, JSON
import/export, homebrew with media, Realtime. This session's output is a
finalized high-level plan with batch splits, so that later sessions run small
plan-implement-review-remediate loops per batch.

## Release status
- R0 closed 2026-09-24; R1 `persist-1-auth` closed 2026-09-25 (record:
  `plan.md` section 16, "R1 closeout record"); R2 `persist-2-lists` live
  2026-09-26 (`012462e1`, budget fix `8ebf03ea`). Next: R5
  `persist-5-migration` (its `plan.md` section 13 refresh, then `B5.1`),
  then R5b `persist-5b-account-menu`.

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

## Owner request 2026-09-25: usage monitoring and forecast - a release after R2
- Track everything important against the Supabase free plan: database
  size, row counts per table, file storage (from R8), egress, monthly
  active users; forecast days left from recent growth.
- Alert: warn in the job summary (e.g. 50% of a limit or under 60 days
  left); fail the job, so GitHub emails the owner (e.g. 80% or under 14
  days). The owner then tunes limits with `limits:set`.
- Orchestrator's proposal: a step in the nightly `backup.yml` job (it
  already holds the production secret through the `production`
  Environment); egress and users need the Supabase Management API and a
  personal access token as a new `production` environment secret.
- Placement: its own task after R2 (owner: "after r2", "plan it as the
  last batch"). Recommended slot: right after R5, so the 2026-10-12
  check for R5 keeps priority; the roadmap planner places it and settles
  thresholds, the history store, and the free-project pause question
  (a project idle for a week pauses; unverified whether the nightly dump
  counts as activity).

## Plans made ahead, 2026-09-25 - where they live until integrated
Planned in parallel with R2's `B2.3`, each in its own git worktree on its
own local branch (not pushed), all based on R2's local task commit
`da7378cb`. Each planner commits its plan on its branch. After R2 closes
and is pushed, the orchestrator brings each planning commit onto `main`
(conflicts expected only in this roadmap's `plan.md`), then removes the
worktree. All six plan commits were integrated in this commit (one docs
commit on `main`, 2026-09-26) with every owner answer below applied; the
worktrees and branches may now be removed.

| Release | Task id | Worktree (`.claude/worktrees/`) | Branch | Planner model | Integrated |
|---|---|---|---|---|---|
| R5 migration and cutoff | `persist-5-migration` | `agent-ab6237f88fb7735f1` | `worktree-agent-ab6237f88fb7735f1`, plan commit `6cae06e4` (revised, replaces `146be6ab`) | Fable | in this commit |
| R3 Realtime (polling stays plan B) | `persist-3-realtime` | `agent-ae90a050b0e40090a` | `worktree-agent-ae90a050b0e40090a`, plan commit `c39f3de1` | Opus | in this commit |
| R11 usage monitoring (after R5) | `persist-usage-monitoring` | `agent-acf8d4e7cebcec311` | `worktree-agent-acf8d4e7cebcec311`, plan commit `43e0e7dd` | Opus | in this commit |
| R6 import and export | `persist-6-import-export` | `agent-a7cedf410497c36ee` | `worktree-agent-a7cedf410497c36ee`, plan commit `a22a4230` | Fable | in this commit |
| R7 homebrew | `persist-7-homebrew` | `agent-ae9a09b5c219f2c0f` | `worktree-agent-ae9a09b5c219f2c0f`, plan commit `764ff8e7` (revised 2026-09-26, replaces `e9f82755`) | Fable | in this commit |
| R4 purchase requests | `persist-4-requests` | `agent-a1edb43d760ec7422` | `worktree-agent-a1edb43d760ec7422` (on top of R3's `c39f3de1`), plan commit `d8268062` | Opus | in this commit |

The untracked starter `context.md` files in the main tree were deleted
before the integration; the planners' refined copies replaced them.

Owner answers for R11 usage monitoring (2026-09-26), to apply when its
plan is integrated: thresholds warn at 50% or under 60 days, fail at 80%
or under 14 days (Q1, as recommended); the public job summary shows totals
only, no emails, ids or list names (Q2, as recommended); a scoped
read-only Management API token `SUPABASE_USAGE_TOKEN_PROD` in the
`production` Environment (Q3, as recommended).

Owner answers for R3 Realtime (2026-09-26), to apply when its plan is
integrated: Q1 yes - the owner's own devices subscribe to their account
lists (`owner:<uid>`), reversing the 2026-09-24 "not subscribed in v1";
Q2 "Allow public access" off on both projects, set by the owner after
`B3.2` is live and read back each release; Q3 yes - a 5-minute safety
re-read while Realtime reports live. All as recommended. `B3.1` is
unblocked by Q1.

Owner answers for R6 import and export (2026-09-26), all as recommended:
Q1 import is all or nothing (one `import_lists` transaction); Q2 an
export always carries both notes, no players' variant; Q3 three export
surfaces (account all, index checklist, list page one); Q4 unknown catalog
ids are skipped and named in the preview and the result.

Owner answers for R5 and R7 (2026-09-26), changing both plans:
- R5: the move of browser lists into the account is automatic, with no
  press - on sign-in, lists move on the reader's behalf; the owner accepts
  the shared-computer risk with two guards: a one-time notice naming the
  moved lists, and the move runs only for the first account that signs in
  on that browser. After the cutoff a browser list may still be deleted
  (confirm); a moved list is removed from the browser, never duplicated.
- New account menu (the header's account control): "Display settings",
  "My lists", "My items", "Sign out". The Lists tab is removed at the
  cutoff (lists are account-only then); until then it stays for signed-out
  readers with browser lists. The menu can ship before R7 ("My items"
  joins in R7). "Display settings" conflicts with section 17's "not in v1:
  a preferences page" - the owner's new request supersedes it; the planner
  designs the smallest form.
- R7: homebrew items are live references inside the owner's account - an
  edit updates every list holding the item, shared pages included. A copy
  that leaves the account (a player's "Save a copy", R4's add-to-my-list,
  R6's export) freezes a snapshot. Deleting an item that is in lists:
  warn with the count, then delete it and remove it from those lists.

Owner answer for R4 (2026-09-26): the remembered "notify the list owner"
answer (`prefs.notifyGm`: ask / always / never) is changed in "Display
settings", the page R5's account menu opens - not a field on `#/account`.
R4's plan named `#/account`; its refresh moves it.

Owner answer for R7 (2026-09-26): the source tag on a homebrew row, card
and print card is «Хоумбрю» / "Homebrew" (against the planner's
«Свой предмет»); the page, menu entry and search group stay «Мои
предметы» / "My items".
R5 plan revised (2026-09-26): plan commit `6cae06e4` replaces `146be6ab`
(automatic move, account menu as `B5.3`). Open: whether `B5.3` ships as
its own release R5b right after R5 (recommended) or as R5's last batch.
R2 `B2.3` committed as `fd9b46eb`; the orchestrator's foreground
`npm run check` on that tree passed 2026-09-26 (812/0, vitest 1697/1697)
and armed the gate - an earlier attempt died with Windows 0xC000012D
(commit limit: the host ran out of memory with seven agents and their
worktrees).
Owner answer (2026-09-26): the account menu ships as its own release R5b
`persist-5b-account-menu` right after R5 (live before the 2026-10-26
cutoff); R5 keeps `B5.1`, `B5.2`. R8, R9 and R10 are not planned yet
(owner: finish R2 first).

Owner answer (2026-09-26): DEBT D24 moves under R5 (`persist-5-migration`)
with one acceptance line - the automatic move also moves a readable
`dhloot.lists.v2.bad` backup, or names it in the move notice - and the
entry is deleted at R10. The "Consistent storage" section is retired as
superseded by the persistence programme; its signed-out cross-tab settings
note (`dhloot.lang`/`home`/`warn`) becomes a one-line entry. Lands in the
docs commit that integrates the plans made ahead. Applied there: D24 under
R5 with the line in R5's `B5.2` acceptance; the settings note is D61 under
a new R10 `persist-10-legacy-removal` section.

R2 live (2026-09-26): push `cd1b3b15..012462e1`; CI run 36228323330 red
only in `e2e`'s configured bundle budget (172.0 of 170 kB; every flow
passed; `migrate-prod`/`deploy` skipped); fix `8ebf03ea` (budget 180 kB,
DEBT D60); CI run 36229149582 green in every job - `migrate-prod` in the
`production` Environment applied `20260925130000`-`130300`, `deploy`
green. Backup run 36229596679 (`dump` in `production`) green,
08:22:49-08:24:01Z. Owed: owner step 4 (delete the repository secret
`SUPABASE_DB_URL_PROD`), the production Security Advisor look (Claude in
Chrome was not connected at 08:25Z).
Production Security Advisor after R2 (orchestrator, Claude in Chrome,
linter rerun 2026-09-26): 0 errors; 8 warnings - SECURITY DEFINER
executable by signed-in users for `clone_shared_list`, `create_list_share`,
`delete_account`, `get_shared_list`, `reorder_list`, `revoke_list_share`,
and by anon for `get_shared_list` (all by design, pinned by layer 3), plus
leaked password protection off (no password sign-in); 2 info - RLS on with
no policy for `limit_defaults` and `user_limit_overrides` (by design, no
client access). No `rotate_list_share`.
Owner step 4 done (2026-09-26, verified by `gh secret list`, names only):
the repository secret `SUPABASE_DB_URL_PROD` is gone; it exists only in
the `production` Environment. The production connection string is now
readable only by jobs that run from `main`.

Restore drill task planned (2026-09-26): `persist-restore-drill`, worktree
`.claude/worktrees/agent-a3eca8d34368886ab`, branch
`worktree-agent-a3eca8d34368886ab`, plan commit `29f38394` on `8ebf03ea`;
one batch B1 (`npm run restore:drill`, key `BACKUP_AGE_IDENTITY` in the
git-ignored `.env.restore.local`, in-memory decrypt with `age-encryption`,
local stack only, counts from the dump, cleanup in `finally`, hook rule
2q). Not integrated yet; no owner question.
