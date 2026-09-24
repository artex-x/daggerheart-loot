# Plan - TASK persistent-storage (programme roadmap)

## Status

- Planning pass 1, 2026-09-24, planner; revised the same day after the
  owner answered decisions 1-13 (section 16). HEAD `12557fe1`, branch
  `claude/persistent-storage-plan-d74d73`.
- NEEDS_HUMAN_CONFIRMATION: yes for the purchase-request questions 32-38
  (section 16); decisions 1-31 answered 2026-09-24. `B0.1` and R1-R3 do
  not depend on them; `B4.1` does.
- Current release: R0 `persist-0-foundation`, `B0.1` running in its own
  directory (2026-09-24). Next release after R0: R1 `persist-1-auth`.
- This file is the programme roadmap. One TASK id per release (section 9,
  settled); each release's planner refresh writes its batches into
  `issues/persist-<n>-<name>/`; this directory keeps sections 1-12 and
  14-18, compacted at each release closeout (`/handoff`).

## 1. Objective and current state

Goal: accounts (Google/Discord through Supabase), cloud lists with player
and GM share links, migration of local lists, JSON import and export,
homebrew items with art, later Realtime. The external design
(`DAGGERHEART-LOOT-PERSISTENCE-DESIGN.md`, revised 2026-09-23) is input, not
authority; `context.md` holds the verified repository and platform facts.

Current state (HEAD `12557fe1`): the Svelte app builds one IIFE bundle plus
the classic script `data.js`, runs from `file://` and from Pages, has a
hand-written service worker with an offline shell and two picture caches
(issue 69), no Supabase code, no `supabase/` directory, no policy pages.
Both Supabase projects exist and are healthy; Google and Discord providers
are on in production; the Google OAuth app is in Testing mode.

## 2. Owner decisions recorded 2026-09-24

1. **`file://` and offline use are nice-to-haves.** Drop them where the drop
   gives cleaner architecture and code. Recorded in `docs/DECISIONS.md`
   (2026-09-24, "Running from a folder and offline use are nice-to-haves").
   Applied by `B0.1`: direct `file://` execution ends; the IIFE build, the
   `file://` smoke and the `hosted`/from-a-folder address branch go.
2. **Offline (the issue 69 worker).** Delegated to the planner; decided:
   - Retired: the offline shell (precache, network-first document with cache
     fallback), the `img/` and `img/thumb/` caches, the navigation preload
     and the `sw.test.mjs` suite that covers them. `sw.js` stays at its URL
     as a worker that deletes every `dhloot-*` cache and unregisters itself
     (the retirement path `META.md` section 9 already records).
   - Kept: `manifest.webmanifest`, the icons, the install page, the manifest
     link added by `PwaPort`, `navigator.storage.persist()` in the installed
     app, and the worker registration call (it is how installed copies fetch
     the retiring worker).
   - Why: every persistence surface would have needed a worker rule
     (Supabase origins, the Auth callback, homebrew media, hashed chunks,
     the "update available" reload); a page answered from a stale shell
     cache while `?code=` is in the URL is a class of Auth bug. Removing the
     worker removes the class. Users lose: rolling and browsing without a
     connection.
3. **Delivery strategy.** Ship small sub-features one at a time, each
   deployable to production alone, in the order auth, lists with migration,
   homebrew, and so on. Section 9 maps this to task ids, commits and pushes.
4. **Answers to decisions 1-15** (2026-09-24, section 16): Realtime is in
   v1 as its own release directly after lists; the `#/l/` decoder retires
   at the legacy write cutoff; from R2 on only a signed-in user creates a
   list; the account is a route `#/account` with provider linking. The rest
   as recommended.
5. **Second round** (2026-09-24, section 16, items 16-22): policy pages in
   R0 because Google refuses to publish without a privacy link; "Sign out
   everywhere" in R1; "edited N ago" on cloud list cards in R2; account
   preferences persist per account from R1; a deterministic fake cloud
   gives layer 2 signed-in and signed-out goldens; no local JSON export
   after the cutoff; four named test layers and the CI organisation
   (section 8).

## 3. Scope: v1 as recommended

In v1 (releases R0-R10, section 12):

- Google and Discord sign-in through Supabase Auth (PKCE); an account page
  `#/account` reached from the header control, with sections in this
  order: Signed in as (provider and email, read from the session, never
  stored in `public`); Connected providers (Connect Google / Connect Discord
  through `linkIdentity`, Disconnect through `unlinkIdentity`, drawn only
  while two or more identities are connected); Your data (Export JSON, from
  R6; the section is absent before R6); Sign out, with a second button
  "Sign out everywhere" (`signOut({ scope: 'global' })`); Delete account
  (typed confirmation, `delete_account()`). Policy pages `privacy` and
  `terms` ship in R0 (the Google console publishes only with a privacy
  link); `privacy` describes the account service as conditional ("if you
  sign in") and links to `#/account` for erasure.
- Account preferences (R1): for a signed-in user the per-user UI settings
  now in `localStorage` or session memory - language (`dhloot.lang.v1`),
  starting section (`dhloot.home.v1`), tables view (`dhloot.prefs.v1`),
  print layout (colour or black-and-white, compact sheet), and a default
  money mode for new lists - persist in `user_prefs` and apply on every
  device; the controls stay where they are, no settings page. Precedence:
  the account wins; a first sign-in with an empty account row seeds it from
  the local values; every later change writes local and account (local is
  what the next boot draws before the session resolves); two devices are
  last write wins, refetched on focus. Anonymous users keep `localStorage`.
- Cloud list cards show "edited N ago" from `updated_at` and the lists
  index offers a sort by last edit (R2).
- Cloud lists for a signed-in owner: the current list contract (order,
  quantity, unit price, money mode, two notes, list roll, batch prices,
  selection and taken counts, copy, print of official entries, undo).
- Player and GM share links (`#/s/<token>`), hash-only tokens shown once,
  rotate and revoke, read-only viewing by anyone with the link, "Save a
  copy" for a signed-in viewer, refetch on focus and every 45 s (R2), then
  live updates through Realtime Broadcast with the poll kept as the
  fallback (R3).
- Purchase requests (R4): anyone with a player or GM link selects entries
  and taken counts on the shared page and sends "Notify the owner" with an
  optional name; a signed-in viewer who adds the selection to their own
  list is asked "Notify the GM?" (remembered in `user_prefs.notifyGm`).
  The owner sees a Requests panel on the list page, live through a private
  Realtime topic with the 45 s poll as fallback, and applies (stock
  deducted in one transaction) or declines; the requester sees Sent /
  Applied / Declined / Expired through a request key kept in
  `sessionStorage`. The first anonymous write in the system, bounded by
  caps (section 5, R4 row). Details and open questions: section 16, items
  32-38.
- From R2 on, only a signed-in user creates a list: anonymous "New list",
  "Add to list" and "Save a copy" ask the user to sign in. Existing local
  lists stay editable until the cutoff (section 10).
- Migration of local lists after sign-in, idempotent, per-list removal after
  read-back; a legacy write cutoff after which local lists are read-only
  and still migratable, and the `#/l/` decoder is retired on the same date
  (section 10).
- JSON export (all, selected, one list) and create-only import of a
  versioned bundle (`import-v1`), published as a JSON Schema for LLM use.
- Homebrew items (same record shape as official items), a "Your homebrew"
  search group, add-to-list as an immutable snapshot, art upload (client
  resize to 640 and 160 WebP, owner folder in one public bucket), one
  standalone link per item (`#/h/<token>`), add-to-list and clone from it,
  print routes for cloud lists (`#/print/list/<id>`, `#/print/s/<token>`).

Deferred (a later release, not v1): a homebrew Trash; homebrew in the
import bundle beyond what R7 defines; an owner-scoped private Realtime
topic (the owner's own devices refetch on focus).

Dropped from the design, with the reason (confirmed by the owner
2026-09-24, section 16 decision 5):

| Design item | Recommendation | Reason |
|---|---|---|
| Catalog manifest -> PostgreSQL -> generated artefacts (7.1), `items` rows for official records, `catalog_state`, `catalog_releases`, `CatalogSnapshotPort`, versioned `catalog/catalog-v<N>.json` | Drop. `data.js` in git stays the only catalog authority; the database holds user data only; list entries store an official `item_key` and the client resolves it against the in-memory index, as today | Two authorities for 1272 records the database never needs; the async bootstrap forces loading states onto every official screen |
| Public Edge catalog endpoints, `contracts/*.json`, `capabilities.json` (7.2, 10.2) | Drop. `catalog.csv`, `data.json`, `llms.txt` on Pages are the machine surface; feature switches and the cutoff are build-time constants | Zero Edge Functions to deploy, rate-limit and monitor; a switch flip is a commit and an 8-minute deploy |
| `profiles`, display name, recent-reauth, account archive ZIP (5.2, 5.4) | Drop. The account page shows the provider and the session's own email, never stored in `public`. Supabase links identities with the same verified email automatically; manual linking for users whose Google and Discord emails differ stays (decision 15). One per-user row returns as `user_prefs` for preferences (decision 20), holding no name and no email | No public field ever shows a display name in v1 |
| `operation_receipts`, `account_usage`, `admin_audit_log`, `storage_cleanup_jobs`, rate buckets (8.2, 8.4) | Drop. Limits are `CHECK` constraints and one per-owner count trigger; idempotency is a client-generated UUID primary key with `on conflict do nothing` | A personal tool on a free tier needs bounds, not accounting |
| Pending-write IndexedDB buffer, per-aggregate serialisation, conflict UI (11) | Drop. Online-first writes through PostgREST; a failed write shows "not saved" with retry; last write wins; refetch on focus | One owner, two devices at most |
| Staging bucket, `finalize_asset_set` Edge Function, `asset_sets`/`item_assets`, janitor (16.2) | Drop. Direct upload to `homebrew-art/<owner>/<item>/<hash>.webp`; the URL is stored on the item | The client is trusted to upload an image into its own folder; only link holders ever see it |
| Backup drills, off-project encrypted daily backups, 24 h RPO (20) | Replace with a monthly owner runbook: `supabase db dump` to the owner's own encrypted store; the user-facing JSON export is the per-user backup | Free tier has no automatic backups; a drill needs a target project and time the owner has not budgeted |
| CSP meta policy, structured telemetry, 99.5 % objective (15.2, 20) | Defer; one hardening batch after R8 if wanted | No inline scripts exist in `app/index.html`; a meta CSP is a follow-up |
| Production base `/daggerheart-loot/` (2, 18 Phase 0) | Reject. `base: './'` stays | Relative paths work on Pages, `vite preview` and the test server alike |

## 4. Conflicts with the design, settled here or raised

| Conflict | Settled |
|---|---|
| Design keeps the worker and adds Supabase bypass rules (7.3); owner says offline is a nice-to-have | Worker retired (section 2) |
| Design supersedes `file://` at Phase 0 with an async snapshot port | `file://` ends, `data.js` classic script stays (section 3) |
| Design cutoff 2026-10-07 with 14 stable production days | Impossible in 13 days; replaced by the rule in section 10 (owner decision D2) |
| Design: `RLS gate wired into npm run check` (row 42) needs Docker for every check | Separate chain `npm run check:db`, commit gate extended for `supabase/**` paths (section 7) |
| Design phases are large releases; owner wants small deployable sub-features | Section 9 and 12 |
| Design 14 keeps the `#/l/` decoder read-only through v1 and retires it only by a major-version decision | Owner 2026-09-24: the decoder retires at the legacy write cutoff, the same date (section 10) |
| Design 13.2: anonymous users edit and create local lists until the cutoff | Owner 2026-09-24, stricter: from R2 on anonymous users create no list; existing local lists stay editable until the cutoff (section 10, `B2.2`) |
| Design Phase 5 places Realtime after homebrew and media | Owner 2026-09-24: Realtime is R3, directly after lists; polling stays as the fallback |
| Design 17.4 names `docs/agent-audit.v6.prompt.md`; no such file | Ignored; `.claude/README.md` row 42 already records the mismatch |
| Design 15.3 proposes five policy pages | Two pages (`privacy`, `terms`); acceptable use, retention and deletion are sections of them. A submitted URL is frozen, so the names are settled now |
| Design 17.3 A.6 wants branch protection and a `supabase-production` environment with reviewers | Not in v1: migrations are pushed by the owner from the CLI before each release push (section 9, 15) |
| Design 14 target routes `#/my/lists`, `#/my/homebrew`, `#/my/data/import` | Rejected. `#/lists` and `#/lists/<id>` are reused (the id class `[\w-]+` admits a UUID); homebrew lives at `#/homebrew` and `#/homebrew/<key>` (one new section, R7); import/export is a panel on the lists index and an "Export JSON" section of `#/account`. Fewer contract changes |
| Design 5.3: account section in navigation | Owner 2026-09-24 (decision 14): a header control beside the language switch reads "Sign in" or the account name and opens the route `#/account`; the tab bar keeps ten sections. A dialog was rejected: it needs extra code to reopen after an OAuth redirect, and a plain route is what the privacy page links to for erasure |

Raised, not settled: none beyond section 16.

## 5. Architecture

**Backend** (Supabase, project `zzmrftmzefcqehhyztjq`; test project
`rdjxcjkhsklhprmzxajq`). Schema by release:

| Release | Objects |
|---|---|
| R1 | `public.delete_account()` security definer: deletes the caller's rows and `auth.users` row; `user_prefs(user_id uuid pk references auth.users on delete cascade, prefs jsonb not null default '{}', updated_at)` with owner-only RLS and a `CHECK (pg_column_size(prefs) < 4096)` |
| R2 | `lists(id uuid pk client-generated, owner_id, name, money_mode, player_note, gm_note, position, revision, legacy_fingerprint unique per owner null, created_at, updated_at)`, `list_entries(id, list_id, item_key, source 'official'\|'homebrew', snapshot jsonb null, position, quantity, price_coins, player_note, gm_note)`, `list_shares(id, list_id, audience, token_hash bytea unique, topic_key uuid default gen_random_uuid(), created_at, revoked_at)`; RLS: owner CRUD on base tables, nothing for `anon`; RPCs `create_list_share`, `rotate_list_share`, `revoke_list_share`, `get_shared_list(raw_token)` (returns the projection, `revision` and `topic_key`), `clone_shared_list(raw_token)`, `reorder_list(list_id, entry_ids)`; a trigger bumps `lists.revision` and `updated_at` on any list or entry write; a trigger holds 200 lists per owner and 500 entries per list |
| R3 | An `after update of revision on lists` trigger calls `realtime.send(jsonb_build_object('revision', new.revision), 'revision', 'share:' \|\| s.topic_key, false)` for every active share of the list; a policy on `realtime.messages` lets `anon` and `authenticated` `select` where `realtime.topic() like 'share:%'` (topics are random and unguessable; a forged message can only cause a refetch). Both are SQL migrations, never dashboard clicks |
| R4 | `purchase_requests(id uuid pk, list_id fk cascade, share_id fk list_shares, audience, requester_user uuid null, requester_name varchar(40) null, status 'pending'\|'applied'\|'declined'\|'expired', status_key uuid unique default gen_random_uuid(), created_at, decided_at null, expires_at = created_at + 14 days)`, `purchase_request_lines(request_id fk cascade, entry_id fk list_entries on delete set null, item_key, name_snapshot, quantity 1..99, unit_price_coins null)`; RLS: the list owner selects, updates status and deletes; nothing for `anon` on the tables. RPCs: `create_purchase_request(raw_token, lines jsonb, requester_name text)` security definer with `execute` to `anon` and `authenticated` - validates the active share (player or GM), 1..20 lines each naming an entry of that list with 1..99, name trimmed and bounded, refuses when the list has 20 pending requests or the share sent 5 in the last minute (counted from the table, no IP), deletes that list's requests decided or expired more than 30 days ago (write-time housekeeping), returns `{ id, status_key }`; `get_purchase_request(status_key)` returns status and lines only; `apply_purchase_request(id, clamp boolean default false)` owner-only, one transaction: every line's quantity must be at or below the entry's current stock or the whole request is refused with the failing lines, unless `clamp` - then each line takes what is there; an entry that reaches zero leaves the list (today's remove semantics); `lists.revision` bumps through the existing trigger; `decline_purchase_request(id)`. A `status` read past `expires_at` reports `expired`. An `after insert` trigger calls `realtime.send({ list_id }, 'request', 'owner:' \|\| owner_id, true)`; a policy on `realtime.messages` lets `authenticated` `select` where `realtime.topic() = 'owner:' \|\| auth.uid()` |
| R6 | `import_lists(bundle jsonb)` security definer, create-only, one transaction |
| R7 | `homebrew_items(id, owner_id, catalog_key unique, kind, content jsonb, art_url null, revision, created_at, updated_at)`, `homebrew_shares` (as `list_shares`, with `topic_key`); RPCs `get_shared_homebrew`, `clone_shared_homebrew`, `add_shared_homebrew_to_list`, share create/rotate/revoke; 500 items per owner |
| R8 | Storage bucket `homebrew-art` (`insert into storage.buckets`) and its policies, public read, insert/update/delete only under `<auth.uid()>/` - a SQL migration |

Everything that can be code is code (decision 27): Auth configuration in
`supabase/config.toml`, schema, RLS, Realtime and Storage in
`supabase/migrations/`, Edge Functions - none planned - would live in
`supabase/functions/`. The dashboard is read-only by convention; any
hosted value that differs from the repository is a defect found by
`config diff` at each release (section 15, step 15). The Supabase GitHub
integration (Branching) is not connected.

Rules: every function `security definer` with `set search_path = public,
pg_temp`; `anon` receives `execute` on the share-read RPCs only; no table is
selectable by `anon`; tokens are 32 random bytes, base64url, stored as
SHA-256; a raw token is returned once by create and rotate. Optimistic
concurrency is not used for owner edits: last write wins, the shared page
polls `revision`.

**Frontend**. `Env` gains `cloud: CloudPort | null`. `null` when
`import.meta.env.VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` is
absent: every cloud control is then not drawn. This is the build every
`tests/app/` suite drives, so the goldens stay deterministic and offline.
`CloudPort = { auth: AuthPort; prefs: PreferencesPort; lists:
ListRepository; homebrew: HomebrewRepository; media: MediaPort; events:
CapabilityEventsPort }`. `app/src/ports/supabase.ts` is the only module
that imports `@supabase/supabase-js` (an ESLint `no-restricted-imports`
rule enforces it); the deterministic `fake-cloud.ts` (section 8) is the
second implementation and the one the layer 2 build ships. `AppState`
reads preferences from `localStorage` at boot as today and, when a session
resolves, from `cloud.prefs`; the account value wins and is written back to
the local key so the next boot draws it before the session resolves. Cloud state lives in `app/src/state/cloud.svelte.ts` with the
resource union `idle | loading | ready | error`; `AppState` holds only the
session. `ListPage.svelte` takes a `ListModel` interface that the local
`ListStore` and the cloud store both implement - the seam of R2.

**Modes.** Unconfigured production build (no URL and key): today's app
plus the retired worker; local lists as today; no cloud control drawn.
Test build (`dist-test/`, section 8): the fake cloud, signed out by default
and signed in through `?as=<user>`; this is what `tests/app/` drives, so
the goldens hold both states. Configured, signed out (from R2): a "Sign
in" control;
existing local lists editable until the cutoff; "New list", "Add to list"
and "Save a copy" draw one shared `SignInPrompt` component instead of
acting. Configured, signed in: cloud lists, migration banner while local
lists exist, homebrew.

**Routes.** Existing grammar unchanged until R10. Additions, each a contract
change in its own batch: `#/account` (R1), `#/s/<token>` (R2),
`#/homebrew`, `#/homebrew/<key>` (R7), `#/h/<token>`, `#/print/list/<id>`,
`#/print/s/<token>` (R9). `#/account` in an unconfigured build, or signed
out, draws the sign-in chooser (or "not configured" when `env.cloud` is
null); a provider redirect (sign-in or link) returns to the route saved in
`sessionStorage['dhloot.auth.return']`, `#/account` for a link. Retirement (R10): `#/l/<payload>` stays a
recognised route kind whose page says the format was retired on the cutoff
date; the payload is never parsed.

**Configuration.** Actions variables `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` are read by the `deploy` job's build only;
`check` and `browser` build unconfigured. Locally `app/.env.local`
(gitignored by `.env.*`). The publishable key is public by design; every
other key stays out of the repository, `VITE_*`, task documents and chat.

## 6. Laws, contracts and specs superseded, by batch

| Text | Batch |
|---|---|
| `CLAUDE.md` "Project shape" bullet 1 (`file://`), "Architecture boundaries" last bullet (`file://` clause), "Product laws" bullet 1 (no backend) | `B0.1` |
| `docs/specs/META.md` section 3 (no backend), section 4 (`file://`), section 9 worker table, "From a folder, and on iOS" | `B0.1` |
| `docs/specs/CONTRACTS.md` section 4 (classic script "because of `file://`"), section 5 (`assets/app.js`, `sw.js` sentence) | `B0.1` |
| `docs/specs/FEATURES.md` "Chrome" footer row condition and the two policy links; `META.md` section 9 "Static pages" list (`privacy`, `terms`) | `B0.1` |
| `docs/specs/COVERAGE.md` rows `file://`, "Installable app", "Known thin spots" footer bullet, `sw.test.mjs` paragraph | `B0.1` |
| `README.md`, `README.ru.md` "Running and developing" | `B0.1` |
| `.gitleaks.toml` comment "The app has no backend" | `B0.1` |
| `docs/DECISIONS.md`: supersession entry for the three laws; `Superseded by` lines on the 2026-09-23 worker entries | `B0.1` |
| `CLAUDE.md` "Task and session protocol": one session per shared database; "Quality gates": `check:db` | `B0.2` |
| `.claude/README.md` "Persistence era" table: each row's installed state; row 42 amended (separate chain) | `B0.2` |
| `COVERAGE.md`: the four-layer table and the two rules (section 8), the test build and the fake cloud, `dist-test/` | `B1.1` |
| `ROUTES.md` and `CONTRACTS.md` section 1 (`#/account`), `docs/fixtures/urls/routes.json`, `tests/contracts.js`; `llms.txt` "no accounts" lines and the new route; `FEATURES.md` "Chrome" (account control) and a new "Account" section | `B1.2` |
| `STATE.md` (a fourth place: the account; `user_prefs`, the precedence rule, `sb-<ref>-auth-token`; print layout leaves session memory for a signed-in user), `FEATURES.md` "Print" and "Tables" (the persisted layout and view), "Lists" (default money mode) | `B1.4` |
| `docs/specs/STATE.md` (`dhloot.migrated.v1`), `FEATURES.md` "Lists" (cloud paragraphs; list creation needs an account; the sign-in prompt; "edited N ago" and the sort), `META.md` section 3 | `B2.2` |
| `ROUTES.md`, `CONTRACTS.md` section 1 and 3, `docs/fixtures/urls/routes.json`, `tests/contracts.js`, `llms.txt` list-link section (`#/s/`; cloud lists never write `#/l/`; `#/l/` links retire at the cutoff, LLM-built links end - use the JSON bundle from R6) | `B2.3` |
| `FEATURES.md` "Lists" shared page (live update, `Updated just now`), `COVERAGE.md` | `B3.1` |
| `FEATURES.md` "Lists" (the Requests panel, "Notify the owner", the requester's status line, apply and decline semantics), `STATE.md` (`sessionStorage['dhloot.requests.v1']`, `user_prefs.notifyGm`), `pages/src/privacy.html` and `en/` (requests store the typed name and the items for the owner, deleted 30 days after decision or expiry), `pages/src/terms.html` and `en/` (a request is not a binding order), `COVERAGE.md` | `B4.2` |
| `STATE.md` cutoff and the two-tab merge section; `FEATURES.md` migration banner, `#/l/` retired-link page, local list controls after the cutoff; `META.md` section 3 final text and section 9 install guide; `llms.txt` and `CONTRACTS.md` section 3 gain the retirement date; `pages/src/install.html` and `en/` iOS paragraph | `B5.1` |
| `CONTRACTS.md` section 4 (`schema/import-v1.json`), `llms.txt` import section | `B6.1` |
| `ROUTES.md`, `CONTRACTS.md`, fixtures, `tests/contracts.js`, `llms.txt`: `#/homebrew` | `B7.2` |
| Same set: `#/h/`, `#/print/list/`, `#/print/s/` | `B9.1` |
| `CONTRACTS.md` section 3 deleted (a history line remains), `ROUTES.md` `#/l/` rows, `docs/fixtures/lists/*.json` deleted, `tests/contracts.js` list-encoding half, `docs/fixtures/urls/routes.json` (`#/l/` -> `legacyList`), `llms.txt` list-link section, `STATE.md`, `FEATURES.md`, `COVERAGE.md` rows | `B10.1` |

## 7. Agent guards (decided in `.claude/README.md` row 42)

| Guard | Batch | Mechanism |
|---|---|---|
| Supersede the three laws | `B0.1` | edits in section 6 |
| gitleaks on commit | `B0.2` | `bash-guard.mjs`: on a `git commit` segment run `gitleaks protect --staged --config .gitleaks.toml`; deny on findings; `speak` when gitleaks is not on PATH; selftest cases; `settings.json` timeout raised only if measured over 10 s |
| RLS gate | `B0.2` harness, every schema batch adds cases | **Separate chain** `npm run check:db`, not inside `npm run check`: starts the local stack if needed, `supabase db reset --local`, runs `tests/db/*.test.mjs` (node:test, `postgres` client) with the six-role matrix (no token, player, GM, owner, other user, revoked). Two reasons: Docker for every `npm run check` on a CSS fix is not acceptable, and on this host `npm run check` runs through the Bash tool while the Docker engine answers only the PowerShell tool (Git Bash hangs on `docker`), so a check chain that needs Docker could never arm the commit gate from Bash. The commit gate gains one rule: a commit whose staged paths include `supabase/**` or `tests/db/**` needs a recorded passing `check:db` (`.check-db-cache.json`); `check-observer.mjs` must therefore also run on the `PowerShell` tool - `settings.json` adds `PowerShell` to its `PostToolUse` matcher, the hook reads the same `tool_input.command` shape, and a selftest case proves it (unverified until `B0.2` runs it). CI runs `check:db` on every push in a `db` job (ubuntu runners have Docker). This amends row 42's "wired into `npm run check`"; the batch records it there |
| Migration reversibility | `B0.2` | in `check:db`: every `supabase/migrations/<ts>_<name>.sql` has `supabase/reversals/<ts>_<name>.sql`; the gate applies all up, all down in reverse, all up, and compares `pg_dump --schema-only` before and after; a file whose reversal is the single line `-- additive` passes a lint that forbids `drop`, `alter ... type`, `rename` |
| Applied migrations never edited | `B0.2` | `npm run db:push -- --project prod|test` wraps `supabase db push` and appends the pushed file names to `supabase/applied.json`; `edit-guard.mjs` denies a write to a listed path; selftest cases |
| One session per shared database | `B0.2` | one sentence in `CLAUDE.md` |
| Authenticated CI credentials | `B1.3` | repository secrets (section 15, step 13) and a documented failure mode in `.claude/README.md` |

Docker on this host (confirmed 2026-09-24, `context.md`): Rancher Desktop
1.24, engine 29.5.3 linux, context `default` on
`npipe:////./pipe/docker_engine`. It answers the PowerShell tool; the Git
Bash tool hangs on `docker version`. Standing instruction for every batch
that touches the local stack: run `docker ...`, `npx supabase start`,
`npx supabase status`, `npx supabase db reset --local` and `npm run
check:db` through the **PowerShell** tool. `npm run check` stays on the Bash
tool (`rtk npm run check`, the commit gate's observer). Docker Desktop 3.6.0
is also installed and must not be used.

## 8. Test layers and CI

Four layers (owner, 2026-09-24). `B1.1` writes this table and the two
rules into `docs/specs/COVERAGE.md`; `B0.2` adds the layer 3 suite
description there when it creates `tests/db/`.

| Layer | Name | Runs | Covers |
|---|---|---|---|
| 1 | Unit and component | vitest with fakes, `npm run test` (inside `npm run check`) | pure logic, ports against fake clients, components with axe |
| 2 | Built app in a browser | `tests/app/` goldens, states, sweep, print, contracts, typo, hues over HTTP against `dist-test/`, the build with the deterministic fake cloud | every screen, signed out and signed in, offline and in parallel |
| 3 | Database | `tests/db/`, `npm run check:db`, local Supabase in Docker (PowerShell tool on this host) | RLS, SQL functions, migrations and their reversals |
| 4 | Hosted E2E | `tests/e2e/`, `npm run e2e`, against the test project `rdjxcjkhsklhprmzxajq` | real Auth, network and RLS end to end; the fake-vs-real agreement check |

Rules: pixel and structural comparisons exist only in layer 2. Real network
and real Supabase exist only in layers 3 and 4.

**Layer 2: the fake cloud and the test build** (`B1.1`). `app/src/ports/
fake-cloud.ts` implements `CloudPort` in memory from
`app/src/ports/fake-cloud-seed.ts`: two users (`gm1` with Google and
Discord identities, `gm2` with Google only), fixed UUIDs
(`00000000-0000-4000-8000-0000000000nn`), fixed raw tokens
(`player-token-1`, `gm-token-1`), fixed timestamps
(`2026-09-01T12:00:00Z` and offsets), lists with entries, notes and
shares, homebrew items with `art_url` pointing at `img/_none.webp`, and a
fake `CapabilityEventsPort` whose `window.__dhlootFake.emit(topic,
revision)` hook lets a states case play an owner edit. The signed state is
a query switch read once at boot: `?as=gm1` signs that seeded user in,
absent means signed out; `tests/app/driver.js` `open(route, { as })` sets
it and `golden.js` names the state `<route> @ <lang> <width> as <user>`.
Selection at build time: `vite build --mode test` writes `dist-test/`;
`vite.config.mts` defines `import.meta.env.VITE_CLOUD_FAKE` as `true` only
in that mode, `main.ts` chooses `await import('./ports/fake-cloud.js')`
inside `if (import.meta.env.VITE_CLOUD_FAKE)`, and Rollup drops the branch
and its chunk from the production build. Guard: `npm run check:built`
greps `dist/assets/*.js` for the marker string `dhloot-fake-cloud` and
fails if found, and `bundle-budget.mjs` measures `dist/` only. `tests/app/`
suites drive `dist-test/`; `tools/smoke-http.mjs`, `bundle-budget.mjs` and
the deploy collect step drive `dist/`. Every UI batch adds its signed-out
and signed-in states to `tests/app/inventory.js` and re-seeds the goldens.

**Layer 4: hosted E2E** (`B1.3`). `tests/e2e/run.mjs`, Puppeteer, `dist/`
built with the test project's URL and publishable key (the deploy build's
own code path, configured), session minted in Node with the secret key -
`auth.admin.generateLink({ type: 'magiclink', email: E2E_USER_EMAIL })`
then `verifyOtp({ token_hash, type: 'magiclink' })` (no password in any
request body, so the cloud proxy can carry the one header it needs,
section 18) - and written to
`localStorage['sb-rdjxcjkhsklhprmzxajq-auth-token']` through
`evaluateOnNewDocument` before the app loads; the driver from `tests/app/`
then acts as a person. `tests/e2e/probe.mjs` runs first on every host: a
publishable-key-only request to a protected table returns 401 and a
Puppeteer page sees no injected `Authorization` header, or the run refuses
with a named message. Cleanup with the secret key in Node before and
after, run-scoped by a prefix, after asserting the project ref is the test
project. Fake-vs-real agreement: `app/src/ports/cloud.contract.ts` exports
`runCloudContract(port, fixtures)` - the same assertions (create a list and
read it back, share and read the projection, revoke and be refused,
homebrew add and clone) - run by vitest against the fake (layer 1) and by
`tests/e2e/contract.mjs` against the real adapter (layer 4); a drift fails
one of the two. Not in `run-all.js`'s shard pool. Failure mode: a red `e2e`
with a green `check` and `db` means the test project's schema lags the
repository - the owner runs `npm run db:push -- --project test`.

OAuth itself (Google and Discord return and cancel, linking) is verified
by the owner by hand at each release closeout on a desktop browser, an
Android phone and an iPhone installed app (section 15, step 16).

**CI organisation.** All four layers run in CI. The owner is the only
contributor and almost never opens a pull request, so every job is
designed for push to `main` plus `workflow_dispatch`; the existing
`pull_request` trigger stays where it is free and gets no design, step or
test of its own. Layers 1-3 run on every push and pull request as today;
layer 4 on push to `main`, `workflow_dispatch`, and a pull request from
this repository (a plain `if:` on the job, nothing more).

| Job | Layer | Trigger | Lands in | Wall clock (estimate) |
|---|---|---|---|---|
| `check` | 1 (plus format, lint, typecheck, data, derived, hooks selftest) | every push and PR | unchanged | ~4-5 min |
| `browser` | 2 | every push and PR; 4-shard matrix over the `run-all.js` pool, driving `dist-test/` (`npm run build:test`) | `B0.1` (HTTP), `B1.1` (test build) | slowest shard ~5 min today (run `35232880507`: 436 s for the matrix), growing with every signed-in state |
| `db` | 3 | every push and PR; ubuntu runner (Docker preinstalled), `npx supabase start`, `npm run check:db`; plus a token-free check that every file under `supabase/migrations/` is listed in `supabase/applied.json` under `prod` on a push to `main` | `B0.2` | ~4-5 min (image pull dominates) |
| `e2e` | 4 | push to `main`, `workflow_dispatch`, and a PR whose head is this repository - one job-level `if:` (`github.event_name != 'pull_request' \|\| github.event.pull_request.head.repo.full_name == github.repository`), no notice step; `concurrency: { group: e2e-test-project, cancel-in-progress: false }` so two runs never share the test database | `B1.3` | ~5-6 min (build ~1 min) |
| `audit`, `secrets` | - | unchanged | - | ~1 min each |
| `deploy` | - | push to `main`, and `workflow_dispatch` on `main` with input `skip_e2e`; `needs: [check, audit, secrets, browser, db, e2e]` with `if: ... && !contains(needs.*.result, 'failure') && !contains(needs.*.result, 'cancelled')` so a skipped `e2e` passes and a failed one blocks | `B0.2` (`db`), `B1.3` (`e2e`) | ~40 s after the last need |

Shard trigger: when the slowest `browser` shard's suite step passes 6
minutes (360 s) on two consecutive `main` runs, the next UI batch adds a
shard - `ci.yml` matrix, `tests/derived.js`'s shard assertion,
`tests/run-all.js` weights re-measured from those runs. The implementer of
every UI batch reads the shard timings of the run that deployed the
previous release and records them in the handoff; that is who measures.

Critical path to deploy: the slowest of `browser` and `e2e` (both ~5-6
min today) plus `deploy` - about 7-9 minutes, as now; `e2e` adds latency
only once it outgrows `browser`. Escape hatch when the test project is
down: the owner runs the `check` workflow by `workflow_dispatch` on `main`
with `skip_e2e: true`, and records the run id and the reason in the
release handoff; nothing else may skip it. Production migrations: no CI
job pushes them in v1 (checklist step 15); the `applied.json` check above
catches a forgotten push without a `SUPABASE_ACCESS_TOKEN` in CI, so the
token-based read-only check is not recommended. Actions minutes: the
repository is public, so standard runners are free; the +27 % billed
seconds the sharding costs are accounting, not money.

## 9. Commit, push and deploy policy (owner decision D1)

Settled 2026-09-24 (decision 1; `docs/DECISIONS.md`): **one TASK id per
release**, `persist-<n>-<name>`. Each release follows the standing law
unchanged: first batch commits, later batches amend, closeout deletes
`issues/persist-<n>-<name>/`, pushes once; the push to `main` deploys.
Before the push the owner runs `npm run db:push -- --project prod` for
that release's migrations and re-runs Security Advisor (section 15). This
directory, `issues/persistent-storage/`, is the programme roadmap: it stays
open, is compacted at every release closeout inside that release's commit,
and is retired with the last release (a planned-but-unshipped task keeps
its directory, `CLAUDE.md`). Rejected: one task with one commit per phase
and owner-called pushes - lawful today ("a push before closeout is the
human's call") but it keeps one directory and one growing commit message
for months; one task id per batch - a batch is not a deployable feature.

Releases, in the order the owner set (batch ids carry the release number):

| Release | Task id | Batches | Ships |
|---|---|---|---|
| R0 | `persist-0-foundation` | `B0.1`, `B0.2` | HTTP-only build, retired worker, laws superseded, policy pages `privacy` and `terms`, Supabase tooling and guards, CI `db` job; no user-visible cloud feature. After it is live the owner publishes the Google app |
| R1 | `persist-1-auth` | `B1.1`-`B1.4` | Fake cloud and test build (layer 2), sign in, `#/account` with linking and sign out everywhere, delete account, hosted E2E (layer 4) and CI `e2e` job, account preferences |
| R2 | `persist-2-lists` | `B2.1`-`B2.3` | Cloud lists with "edited N ago", sign-in-only creation, player and GM share links with polling, save a copy |
| R3 | `persist-3-realtime` | `B3.1` | Live updates on shared pages; polling stays as the fallback |
| R4 | `persist-4-requests` | `B4.1`, `B4.2` | Purchase requests from a shared list to its owner: anonymous "Notify the owner", the signed-in "add to my list, notify the GM" flow, the owner's Requests panel, apply and decline, requester status |
| R5 | `persist-5-migration` | `B5.1` | Migration banner and flow, legacy write cutoff, date-gated `#/l/` retirement and its announcement, two-tab merge removed |
| R6 | `persist-6-import-export` | `B6.1` | JSON export and import, published schema |
| R7 | `persist-7-homebrew` | `B7.1`, `B7.2` | Homebrew items, search group, add to list, bundle schema v2 |
| R8 | `persist-8-media` | `B8.1` | Homebrew art |
| R9 | `persist-9-item-share` | `B9.1` | `#/h/<token>`, add and clone, print routes for cloud lists |
| R10 | `persist-10-legacy-removal` | `B10.1` | After the cutoff date has passed: the `#/l/` codec, its fixtures and contract text are removed |

R10 is the first release dispatched after the cutoff date; R6-R9 may ship
before it. Each release is deployable alone.

## 10. Legacy write cutoff (owner decision D2)

The design's 2026-10-07 cannot hold. Replacement rule, settled 2026-09-24
(decision 2), extended by decisions 6 and 12:

- `LEGACY_WRITE_UNTIL` is a build-time constant (`app/src/lib/legacy.ts`),
  ISO date with a time zone, shown in the migration banner, on the local
  lists index and in `llms.txt` from the day R5 ships.
- Its value is the first Monday at least 30 days after R5 reaches
  production, set in R5's closeout commit; R5 ships only after the owner has
  migrated real lists on one desktop browser and one phone.
- From R2 (before the date): anonymous users create no list. Existing local
  lists stay editable, and their `#/l/` links keep working, until the date.
- After the date, in the same build (`B5.1` gates every item on the
  constant): local lists are read-only (no create, no edit, no reorder,
  no import from a link); the `#/l/` decoder is off - `#/l/<payload>` draws
  the retired-link page ("This link format was retired on <date>. Ask the
  sender for a new link, or sign in to build a list"); the two link buttons
  and "Import from a link" are hidden on local lists. Copy text, print and
  "Sign in and move to your account" stay.
- Export path for a local list after the date: **migration into an
  account** is the only structured path; copy text and print are the
  unstructured ones. There is no `#/l/` and no local JSON export (the
  bundle format arrives in R6 for signed-in users). The migration
  fingerprint is a SHA-256 of a canonical JSON of the local list, not of
  the codec's text, so migration does not depend on the codec.
- Nothing is deleted on a client clock; `dhloot.lists.v1` stays untouched
  as `STATE.md` already requires.
- Moving the date is a one-line commit and a deploy. If R5 shows a defect
  in production, the date moves before it elapses.
- What the `#/l/` retirement breaks, and the answer:
  (a) the "Your own link" backup path for local lists - replaced by
  migration (above); the buttons hide on the date.
  (b) the install guide's iOS paragraph (carry a list across with the link
  and "Restore from a link") - `B5.1` rewrites both fragments: sign in in
  Safari and in the installed app; the lists are in the account.
  (c) the pinned contract: `B5.1` announces the date in `llms.txt`,
  `CONTRACTS.md` section 3 and the shared page; `B10.1` (R10, dispatched
  after the date) removes `codec.ts`'s decode and encode, the share
  buttons' `#/l/` writers, `docs/fixtures/lists/*.json`, the list-encoding
  half of `tests/contracts.js`, `tests/app/contracts.js` list cases, states
  cases 13, 17 and 22, `listLink.test.ts`, `CONTRACTS.md` section 3 (a
  one-line history pointer stays), the `llms.txt` section and the
  `ROUTES.md` rows; `#/l/` keeps a route kind `legacyList` in
  `docs/fixtures/urls/routes.json` so the retired-link page is reached,
  never the home fallback. `#/print/<id>*<n>` keeps its spelling: it is
  print grammar, not the list link.

## 11. Google OAuth, policy pages and `noindex`

- An external app that requests only `openid`, `email` and `profile` is
  published without verification, but the console refuses "Publish app"
  until the Branding page carries a privacy policy link (browser audit
  2026-09-24, `context.md`). `artex-x.github.io` is accepted as an
  authorized domain. So the policy pages ship in R0 (`B0.1`), and the owner
  sets the Branding links and publishes as soon as R0 is live (section 15,
  steps 8-9); on R1 day everyone can sign in. Brand verification (the app
  name on the consent screen) is a separate step and is not pursued in v1
  (decision 13); the consent screen shows the Supabase host.
- Policy pages `privacy` and `terms`, both languages, through the `META.md`
  section 9 recipe, in `B0.1`, linked from the footer, listed in `ci.yml`
  and `check-site.lib.mjs`. Written before any account exists, so `privacy`
  speaks conditionally ("if you sign in"): what is stored then (lists,
  homebrew, art, preferences, the provider identities and email held by
  Supabase Auth), where (Supabase, EU West), what a share link exposes,
  deletion (from the account page, immediate), the already-linked recovery
  (export the account you drop, import into the one you keep), the abuse
  and privacy contact (a project alias the owner names - step 7, a
  prerequisite of `B0.1`). `terms` states acceptable use and that the
  service is best effort with no uptime promise. `B1.2` adds the `#/account`
  link once the route exists.
- `noindex, nofollow` stays on the policy pages: Google's requirement
  pages name no indexing condition. The pages are linked from the home
  page's footer, which Svelte draws; `app/index.html`'s `<noscript>` block
  carries the two links too (`B0.1`, two lines), so a reviewer without
  JavaScript finds them.
- The URLs are frozen once submitted:
  `https://artex-x.github.io/daggerheart-loot/pages/privacy.html` and
  `.../pages/terms.html`.

## 12. Batches: goal, scope, gates, review, split criterion

Costs from `.claude/README.md`, "Batch size and the fixed cost of a run",
idle host, one green pass: `check` (layer 1) 165 s, `check:built` ~180 s
(~240 s once it builds `dist/` and `dist-test/`), layer 2 filter group
`app/print,app/contracts,app/states,app/typo,app/hues,stub` ~290 s, layer 2
golden re-seed 4 shards ~600 s (grows with every signed-in state), layer 2
sweep 5 rows ~2250 s, layer 3 `check:db` ~120 s (first stack start adds 3-5
min once), layer 4 E2E ~240 s (estimate, unmeasured). Every UI batch from
`B1.2` on adds its signed-out and signed-in states to
`tests/app/inventory.js` and re-seeds the goldens, so its gate column
carries "goldens".

| Batch | Goal and scope | Specs touched | Gates (cost) | Review | Split criterion from the previous batch |
|---|---|---|---|---|---|
| `B0.1` | HTTP-only ES-module build, retire the worker's caches, supersede the three laws, harness over HTTP, policy pages `privacy` and `terms` with footer and `<noscript>` links | section 6 rows 1-8 | layer 1 `check` x2, `check:built`, layer 2 filter group, golden re-seed, sweep x5 (~61 min) | required: generated artefacts and UI (footer always drawn, two new links) | - |
| `B0.2` | `supabase/` init, layer 3 `check:db` chain and RLS harness, reversibility gate, applied-migration guard, gitleaks hook, CI `db` job with the `applied.json` check, `db:push` wrapper | section 6 rows 9-10 | layer 1 `check`, layer 3 `check:db`, CI (~5 min + first stack start) | required (plan rule: every hook and every `supabase/` batch) | a review that cannot be held in one pass: build and product source vs hooks and tooling (the `B12b`/`B12c` precedent) |
| `B1.1` | Layer 2 reach: `CloudPort` types, `fake-cloud.ts` and its seed, `cloud.contract.ts`, `vite build --mode test` -> `dist-test/`, `main.ts` selection, the production-bundle marker guard in `check:built`, `tests/app/` driving `dist-test/`, driver `open(route, { as })`, `golden.js` state naming, CI `browser` builds the test build; one states case proves signed-out and `?as=gm1` differ and one proves `dist/` lacks the marker; `COVERAGE.md` four-layer table | section 6 row 11 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens (~28 min) | required: harness that every later golden trusts | new release (R1); a commit boundary the harness cannot reach - the reach lands first, on its own commit |
| `B1.2` | `@supabase/supabase-js`, real `auth` adapter, PKCE sign-in and callback (`redirectTo` `<site>?auth-callback=1`, return route in `sessionStorage`, `replaceState` strips `code` and `auth-callback`), header control, route `#/account` and `AccountPage.svelte` with the five sections (section 3) including "Sign out everywhere", provider linking and unlinking with the last-identity guard and the already-linked error, `delete_account()` migration, `privacy` gains the `#/account` link; vitest with the fake `AuthPort`: connect calls `link(provider)` and shows the redirect state, Disconnect absent with one identity and present with two, unlink removes one, `identity_already_exists` renders "This <provider> account is already used by another account"; layer 2 states: `#/account` signed out, as `gm2` (one identity), as `gm1` (two identities), header both states | section 6 row 12 | layer 1 `check` x2, `check:built`, layer 2 filter group (`app/contracts` carries the new route), goldens, layer 3 `check:db` (~30 min) | required: public contract, new UI | a public-contract change |
| `B1.3` | Layer 4: hosted E2E harness, `npm run e2e`, `tests/e2e/contract.mjs` (fake-vs-real agreement), CI `e2e` job with its concurrency group and the `skip_e2e` dispatch input, `deploy` needs `e2e`; flows: seeded session, `#/account` draws the email user's provider and email, no Disconnect with one identity, Export JSON section absent, sign out, sign out everywhere, delete account. OAuth linking is not reachable with the email-only test project: the owner's closeout check covers it (section 15, step 16) | `COVERAGE.md`, `.claude/README.md` | layer 1 `check`, layer 4 E2E (~7 min) | not required unless the worker deviates | a commit boundary the harness cannot reach: the flows need `B1.2`'s UI; the harness is tooling judged against `COVERAGE.md` |
| `B1.4` | Account preferences: `user_prefs` migration and reversal, RLS matrix, `PreferencesPort` (real and fake), `AppState` precedence (account wins, local seeds an empty row, write-through to local), print layout and default money mode become preferences for a signed-in user; layer 2 states: tables view, print layout and language as `gm1` versus signed out; E2E: change the language on one session, read it back on a fresh one | section 6 row 13 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens, layer 3 `check:db`, layer 4 E2E (~35 min) | required: schema rule and UI | a different route and filter set: tables, print and lists states versus `#/account` |
| `B2.1` | R2 schema (with `topic_key`), RLS, RPCs, six-role matrix tests, reversals; the fake cloud's seed gains lists and shares | - | layer 1 `check`, layer 3 `check:db` (~5 min) | required (schema rule) | new release; SQL judged apart from Svelte |
| `B2.2` | `ListRepository`, cloud store, `ListModel` seam in `ListPage.svelte`, lists index groups (cloud, local) with "edited N ago" and a sort by last edit, save states; **sign-in-only creation**: one `SignInPrompt` component drawn by "New list" (lists index) and "Add to list" (`AddToList.svelte`, record menu, selection bar) when nobody is signed in; layer 2 states signed out and as `gm1` for the index, a list page, the prompt in each slot; E2E flows create/edit/reorder/delete and a signed-out prompt case | section 6 row 14 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens, layer 4 E2E (~27 min) | required: new UI | a commit boundary the harness cannot reach (needs `B2.1`) |
| `B2.3` | Share links: create, one-time display, rotate, revoke; `#/s/<token>` page (reuse `SharedListPage.svelte`), "Save a copy" (signed out: the `SignInPrompt`), poll on focus and 45 s; cloud lists never write `#/l/`; `llms.txt` announces that `#/l/` retires at the cutoff; layer 2 states: share panel as `gm1`, `#/s/player-token-1` and `#/s/gm-token-1` signed out and as `gm2` | section 6 row 15 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens, layer 4 E2E (~27 min) | required: public contract | a public-contract change |
| `B3.1` | Realtime: `realtime.send` trigger and `realtime.messages` policy (migration, reversal, `check:db` case that an update inserts one message per active share and none for a revoked one), real `CapabilityEventsPort` adapter, shared page subscribes to `share:<topic_key>`, coalesces events 250 ms, refetches, keeps the 45 s poll as the fallback, `Updated just now` and an `aria-live` announcement; layer 2 states: the fake's `emit` plays an edit into an open shared page; E2E: owner edit reaches an open viewer without reload | section 6 row 16 | layer 1 `check` x2, layer 3 `check:db`, `check:built`, layer 2 `app/states`, goldens, layer 4 E2E (~24 min) | required: schema rule and UI | new release (R3) |
| `B4.1` | R4 schema and RPCs (section 5, R4 row), owner topic policy, RLS, reversals; layer 3 matrix: anon creates through a valid token only, a revoked or wrong token is refused, the caps refuse the 21st pending and the 6th in a minute, another user cannot read or apply, apply refuses over-stock and clamps on request, zero removes the entry, the status key reads status and lines only, the insert broadcasts to `owner:<uid>` and to nobody else | - | layer 1 `check`, layer 3 `check:db` (~5 min) | required (schema rule; the first anonymous write) | new release (R4); SQL judged apart from Svelte |
| `B4.2` | Shared page: "Notify the owner" on the selection bar with an optional name field (signed out) and a Sent state with a status line; signed-in add-to-list asks "Notify the GM?" with "always / never" remembered in `user_prefs.notifyGm`; list page: a Requests panel above the entries (requester, lines, total, Apply, Apply available, Decline), a badge on the lists index card; `CapabilityEventsPort` subscribes to `owner:<uid>` when signed in, poll fallback; fake seed gains two requests (one over stock); layer 2 states: the form signed out and as `gm2`, Sent, the panel as `gm1` with a pending and an over-stock request, refused apply, declined; E2E: anonymous request, owner applies, stock deducted, requester status reads applied; privacy and terms fragments | section 6 row 17 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens, layer 4 E2E (~29 min) | required: new UI, policy text | a commit boundary the harness cannot reach (needs `B4.1`) |
| `B5.1` | Migration banner and flow (canonical-JSON fingerprint, `legacy_fingerprint`, read-back, per-list removal, `dhloot.migrated.v1`), `LEGACY_WRITE_UNTIL` read-only mode, date-gated `#/l/` retirement (retired-link page, hidden link buttons and link import) and its announcement (`llms.txt`, `CONTRACTS.md`, install guide iOS paragraph), remove the two-tab merge with the local write path; layer 2 states: banner as `gm1` with seeded local lists, read-only local list and retired-link page with the constant forced past (a test-build-only `?today=` switch beside `?as=`) | section 6 row 18 | layer 1 `check`, `check:built`, layer 2 `app/states`, `app/contracts`, goldens, layer 4 E2E (~23 min) | required: UI, data safety, contract text | new release (R5) |
| `B6.1` | `schema/import-v1.json` published, export all/selected/one (and the `#/account` "Your data" section), upload-validate-preview-import, `import_lists` RPC, `llms.txt` (the bundle replaces LLM-built links); layer 2 states: the import panel's preview and error report as `gm1` | section 6 row 19 | layer 1 `check` x2, layer 3 `check:db`, `check:built`, layer 2 filter group, goldens, layer 4 E2E (~29 min) | required: public contract | new release (R6) |
| `B7.1` | R7 schema, RLS, RPCs, tests, reversals; seed gains homebrew | - | layer 1 `check`, layer 3 `check:db` (~5 min) | required (schema rule) | new release (R7) |
| `B7.2` | `#/homebrew` section and item form (kind-specific fields, EN and RU), "Your homebrew" search group, add to list as snapshot, delete with confirm, bundle schema v2 with homebrew; layer 2 states as `gm1`: the section, the form per kind, the search group | section 6 row 20 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens, layer 4 E2E (~27 min) | required: contract and UI | a commit boundary the harness cannot reach |
| `B8.1` | Art: decode, square crop, 640 and 160 WebP, upload to the owner folder, `art_url`, rows and cards draw it, replace and remove; layer 2 states: a homebrew row and card with seeded art | `FEATURES.md` | layer 1 `check`, `check:built`, layer 2 `app/states`, goldens, layer 4 E2E (~20 min) | required: UI | new release (R8) |
| `B9.1` | `#/h/<token>` (subscribes to its topic as `B3.1` does), add to list and clone, print routes `#/print/list/<id>` and `#/print/s/<token>` with homebrew cards; layer 2 states: `#/h/` signed out and as `gm2`, both print routes | section 6 row 21 | layer 1 `check` x2, `check:built`, layer 2 filter group, `app/print`, goldens, layer 4 E2E (~27 min) | required: public contract | new release (R9); a public-contract change |
| `B10.1` | After the cutoff date: remove the `#/l/` codec, its writers, fixtures, tests and contract text (section 10 (c)); `legacyList` route kind kept for the retired-link page | section 6 row 22 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens (~28 min) | required: public contract | new release (R10), gated on the date |

Total gate cost, one green pass per batch, idle host: about 7.1 hours
(`B0.1` alone is one hour because every browser suite re-runs over HTTP;
the layer 2 goldens add ~10 minutes to every UI batch from `B1.1` on). A
stalled host doubles a batch's cost; no batch above needs more than one
foreground `npm run check` call per commit.

Mockups: `B0.1` changes no control beyond two footer links. Each later UI
batch (`B1.2`, `B1.4`, `B2.2`, `B2.3`, `B3.1`, `B4.2`, `B5.1`, `B6.1`, `B7.2`,
`B8.1`, `B9.1`) gets a grounded mockup in its planner refresh, under
`issues/persist-<n>-<name>/mocks/`, composed from the current screen: the
header control sits beside the language switch; cloud and local lists are
two headed groups on the lists index; the `SignInPrompt` takes the slot of
the control it replaces (the new-list form, the add-to-list menu body, the
"Save a copy" button); the share panel replaces the two link buttons on a
cloud list page; the migration banner reuses the storage-notice slot.

## 13. Batch B0.1

Moved to `issues/persist-0-foundation/plan.md` when R0 was dispatched
(2026-09-24). This roadmap keeps the release table and the outlines.

## 14. Later batch outlines

`B0.2` Supabase tooling. `npx supabase init`; commit `supabase/config.toml`
as the configuration of record (decision 27): `[auth] site_url =
"https://artex-x.github.io/daggerheart-loot/"`, `additional_redirect_urls`
= the three `?auth-callback=1` URLs (section 15, step 3),
`enable_manual_linking = true`, `enable_anonymous_sign_ins = false`,
`[auth.email] enable_signup = false`, `[auth.sms] enable_signup = false`,
`[auth.external.google]` and `[auth.external.discord]` `enabled = true`
with `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"` and
`secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"` (Discord alike),
`skip_nonce_check = false`; the test project's differences (email on, no
OAuth) through the CLI's per-project override
`supabase/config.rdjxcjkhsklhprmzxajq.toml` if 2.117.0 honours
`[remotes.<ref>]` or the `--project-ref`-scoped config file - the batch
verifies which and, if neither exists, keeps one `config.toml` and a
documented two-line manual difference for the test project in the release
checklist. `.gitignore` `supabase/.temp/`, `supabase/.branches/`; the
`env(...)` values come from the owner's local `.env` for a push and are
absent in CI and the cloud (the local stack leaves both providers
unconfigured). `npm run config:push -- --project test|prod`: `supabase
config diff` printed and read, a typed `yes`, then `supabase config push`;
no `--yes` path exists in the wrapper. DevDependencies `supabase` (pinned)
and `postgres`;
`tests/db/run.mjs` (starts the stack if `supabase status` fails, `db reset
--local`, runs `tests/db/*.test.mjs`), `tests/db/roles.mjs` (the six-role
matrix helper using JWTs minted with the local `SUPABASE_JWT_SECRET` from
`supabase status`), `tests/db/reversibility.test.mjs`, a first migration
`0001_baseline.sql` with an `-- additive` reversal so the gate has a subject;
`npm run check:db`, `npm run db:push`; `bash-guard.mjs` gitleaks family and
`check:db` commit rule, `check-observer.mjs` command recognition on the
Bash and PowerShell tools (`settings.json` matcher), `edit-guard.mjs`
applied-migration rule, selftest cases; `ci.yml` `db` job; `CLAUDE.md` two
sentences (one session per shared database; `check:db` runs through
PowerShell on this host); `.claude/README.md` rows, row 42 amendment and a
"Hooks" fact for the Git Bash Docker hang; the "Cloud sessions" section,
`.claude/cloud-setup.sh`, the `CLAUDE_CODE_REMOTE` branch in
`session-start.mjs`, the cloud push rule in `bash-guard.mjs` (current
branch only, never `main`) and the one-line `CLAUDE.md` amendment
(section 18). The worker runs every Docker and
Supabase-stack command through the PowerShell tool (section 7). Owner:
gitleaks on PATH before this batch.

`B1.1` Fake cloud and test build (section 8, "Layer 2"). `app/src/ports/
cloud.ts` (the `CloudPort` types and the resource union), `fake-cloud.ts`,
`fake-cloud-seed.ts`, `cloud.contract.ts` and its vitest run against the
fake; `vite.config.mts` `mode === 'test'` -> `define` and `outDir
../dist-test`; `package.json` `build:test`, `check:built` builds both and
runs the marker guard (`tools/no-fake-in-prod.mjs`); `main.ts` selection;
`Env.cloud`; `tests/app/lib.js` `serveDist()` serves `dist-test/`;
`driver.js` `open(route, { as })`; `golden.js` naming; `ci.yml` `browser`
runs `npm run build:test`; `.gitignore` `dist-test/`; `edit-guard.mjs`
denies `dist-test/` like `dist/`; `COVERAGE.md` four-layer table.

`B1.2` Auth. `@supabase/supabase-js` (pinned); `app/src/ports/auth.ts`
(`AuthPort`: `session()`, `identities()`, `signIn(provider)`,
`link(provider)`, `unlink(identityId)`, `signOut()`, `deleteAccount()`,
`onChange`; a fake with a settable identity list and a settable error);
`app/src/ports/supabase.ts` (`createCloud(url, key): CloudPort`; maps the
Supabase error code `identity_already_exists` to `AuthError.alreadyLinked`
and everything else to `AuthError.failed`); `app/src/ports/config.ts`
(reads `import.meta.env`, returns `null` when unset); `Env.cloud`;
`AppState.user`; `Shell.svelte` header control that navigates to
`#/account`; `hash.ts` route kind `account`; `AccountPage.svelte` with the
five sections in section 3's order - Disconnect is drawn per identity only
while `identities().length >= 2`; Connect for a provider not yet connected
calls `link(provider)` after saving `#/account` as the return route; the
already-linked error renders under the button and the page keeps its
state; the Sign out section has "Sign out" and "Sign out everywhere"
(`signOut({ scope: 'global' })`); Delete needs the typed word the
dictionary names. Callback: `redirectTo` is `<site>?auth-callback=1` (the
allowlisted form, `context.md`); the wanted hash route is saved to
`sessionStorage['dhloot.auth.return']` for ten minutes before `signIn` or
`link`, restored after `exchangeCodeForSession`; `replaceState` strips
`code` and `auth-callback`. Migration `0002_delete_account.sql` and
reversal. `privacy` gains the `#/account` link. The fake's `auth` follows
the same interface (`?as=` decides the session). Contract change:
`ROUTES.md`, `CONTRACTS.md` section 1, `docs/fixtures/urls/routes.json`,
`tests/contracts.js`, `llms.txt`. ESLint `no-restricted-imports` for
`@supabase/*` outside `ports/supabase.ts`. Owner steps 3 (the remaining
part) and 12 of section 15 before the release push.

`B1.3` Hosted E2E and the CI `e2e` job: section 8. Owner step 13 before
it.

`B1.4` Account preferences. Migration `0003_user_prefs.sql` and reversal;
`PreferencesPort` `{ load(): Promise<Prefs | null>; save(p: Prefs):
Promise<void> }` real (one row, `upsert`) and fake; `Prefs = { lang, home,
view, printBw, printCompact, moneyMode }`, every field optional;
`AppState`: at boot read local as today; on session ready `load()`; `null`
-> `save(localValues)`; a row -> apply each present field, write it to its
local key or session field; every later change writes local first, then
`save()` when signed in; on sign-out nothing is cleared. `STATE.md` gains
the fourth place and the precedence rule; print layout stops being
session-only for a signed-in user (`FEATURES.md` "Print"). Layer 2 states
and E2E as in section 12.

`B2.1`-`B2.3`: section 5 schema; `ListRepository` (`list()`, `get(id)`,
`create`, `update`, `reorder`, `remove`, shares); the `ListModel` seam;
lists index groups "Your account" and "This browser"; save state text
"Saved" / "Saving" / "Not saved - retry"; `SignInPrompt.svelte` (one
sentence and a "Sign in" button that opens the provider chooser; drawn
only when `env.cloud` exists and `app.user` is null) in the new-list form
slot, the add-to-list menu body and the shared page's save control;
`#/s/<token>` reuses `SharedListPage.svelte` behind an async loader; share
panel with one-time token display and "Generate a new link" warning;
`clone_shared_list` behind "Save a copy". Inventory and goldens: none
change (the unconfigured build keeps local creation); vitest covers the
prompt in `listsPage.test.ts`, `components/lists.test.ts`,
`sharedListPage.test.ts` and `a11y.test.ts`; the hosted E2E covers it for
real.

`B3.1`: the `realtime.send` trigger and policy (section 5, R3 row);
`CapabilityEventsPort` `{ subscribe(topic, onRevision): unsubscribe }` over
`supabase.channel('share:<key>', { config: { private: true } })`; the
shared page refetches when a received revision is above the one drawn,
coalesced 250 ms, and on reconnect; the 45 s poll stays; owner devices are
not subscribed (they refetch on focus). Free-plan limits (200 peak
connections, 2 million messages a month) are a monthly owner check
(section 15, step 18).

`B4.1`-`B4.2` Purchase requests. Schema and RPCs as in section 5's R4
row; the RPC is the system's first anonymous write, so its bounds are
constraints and counts inside the function, not client checks: 20 lines,
quantities 1..99, 40-character name, 20 pending per list, 5 per share per
minute, 14-day expiry, 30-day housekeeping at write time. Shared page:
the selection bar (taken counts already exist, `FEATURES.md` "Lists")
gains "Notify the owner"; signed out it opens a one-field form (name,
optional) and sends; the response's `status_key` is kept in
`sessionStorage['dhloot.requests.v1']` (`{ [listToken]: [{ key, at }] }`,
bounded to the last five) so the page draws a status line - Sent, Applied,
Declined, Expired - refreshed with the page's own poll and the R3
subscription (the owner's apply bumps the list revision, which the shared
page already refetches on). Flow b: the add-to-list control on the shared
page, after copying the selection into the viewer's own list, asks "Notify
the GM?" with "Yes" / "No" and "Remember my choice"; the answer lands in
`user_prefs.notifyGm` (`ask` default, `always`, `never`), editable nowhere
else in v1 (reset by choosing the other answer once `ask` is gone - the
`#/account` page gains one line only if the owner wants it). Owner side:
`ListRepository.requests(listId)` and `apply(id, clamp)`, `decline(id)`;
the Requests panel lists pending requests newest first with requester,
lines (name, quantity, unit price), total in the list's money mode, and
three buttons; Apply on an over-stock request shows the failing lines and
offers "Apply available"; applied and declined requests fold under
"Decided" for the session. Lists index cards carry a pending count badge.
`CapabilityEventsPort.subscribe('owner:<uid>')` when signed in, one
subscription for the session, refetches the open list's requests and the
index badges; the 45 s poll stays. Privacy fragment: one paragraph on
requests; terms: a request is a message to the owner, not an order.
Anonymous requester name is plain text through Svelte text nodes, as every
user string.

`B5.1`: migration - fingerprint = SHA-256 of a canonical JSON of the local
list (sorted keys, no codec), `legacy_fingerprint` unique per owner,
`dhloot.migrated.v1` map, per-list states Waiting / Moving / Moved / Needs
attention, resume on next sign-in; `LEGACY_WRITE_UNTIL` and every item
section 10 gates on it; the retired-link page for `#/l/`; install guide
iOS paragraph; the two-tab merge deleted with the local write path.

`B6.1`: `schema/import-v1.json` in the repository root (copied to `_site`
by `ci.yml`, linked from `llms.txt` and the `<noscript>` block), lists only
in v1; export builds the bundle client-side from the cloud store; import
validates with a hand-written validator in `lib/` (no dependency), previews
counts and unknown official keys, then one `import_lists` call.

`B7.1`-`B9.1`: section 5 schema; homebrew content is the existing record
shape (`Record_` fields the form can fill: kind, tier or rarity, names and
descriptions in both languages, stat line for equipment); `catalog_key`
`hb_<base32>`; search groups official then "Your homebrew"; `RowMain`
draws `art_url` through the same thumb rule; `#/print/list/<id>` and
`#/print/s/<token>` load entries then reuse `PrintPage`.

`B10.1`: section 10 (c). Dispatched only after `LEGACY_WRITE_UNTIL` has
passed in production; the planner refresh checks the date first.

## 15. Owner-action checklist

In the order the batches need them. Values are exact.

Before `B0.2`:

1. Done 2026-09-24: Rancher Desktop 1.24 runs the engine (29.5.3 linux)
   and answers PowerShell. Keep it running during `B0.2` and every schema
   batch; do not start Docker Desktop 3.6.0 beside it.
2. Done 2026-09-24: gitleaks 8.30.1 is on PATH and resolves from both the
   Bash and PowerShell tools (`context.md`).

Before `B0.1` starts:

7. Done 2026-09-24: the abuse and privacy contact address is
   `daggerheart.loot@gmail.com`, a dedicated mailbox. `privacy` names it
   and names the operator as `artex-x`. `B0.1` has no open prerequisite.

Supabase dashboard, project `zzmrftmzefcqehhyztjq` (browser audit
2026-09-24 read the current values, `context.md`):

3. Authentication -> URL Configuration. Done: Site URL
   `https://artex-x.github.io/daggerheart-loot/`; redirects
   `https://artex-x.github.io/daggerheart-loot/?auth-callback=1` and
   `http://localhost:5173/?auth-callback=1` - the plan adopts this
   `?auth-callback=1` form. Done 2026-09-24 (orchestrator, owner's OK):
   removed `http://localhost:8000/**`; added
   `http://localhost:4173/?auth-callback=1` for `vite preview`. The list is
   now exactly the three `?auth-callback=1` URLs.
4. Done 2026-09-24: Email off, Anonymous off, Google nonce-skip off,
   Google and Discord refuse users without email. Phone: confirm off.
5. Done 2026-09-24: "Allow manual linking" on (decision 15); automatic
   linking by verified email stays on.
6. Done 2026-09-24: Data API auto-expose off, 0 tables exposed; Security
   Advisor 0/0/0. Repeat the Advisor after every release that pushes a
   migration and record the date in the release handoff.
   From `B0.2` on, steps 3-5 are code (decision 27): `supabase/config.toml`
   declares them and `npm run config:push -- --project prod` applies them
   after a read `config diff`; the dashboard is read-only by convention.

Google Cloud console, after R0 is live (the pages must answer):

8. OAuth consent screen -> Branding: App home page
   `https://artex-x.github.io/daggerheart-loot/`; Privacy policy
   `https://artex-x.github.io/daggerheart-loot/pages/privacy.html`; Terms
   `https://artex-x.github.io/daggerheart-loot/pages/terms.html`.
   Authorized domains: `artex-x.github.io` (accepted) and
   `zzmrftmzefcqehhyztjq.supabase.co` (present). Save.
9. Audience: **Publish app** (scopes stay `openid`, `email`, `profile`; no
   verification is requested; the console refused this until step 8).
   Optional, same screen: set `daggerheart.loot@gmail.com` as the User
   support email or a developer contact; Google may first require that
   account to be a member of the Cloud project.
10. Done 2026-09-24: Credentials -> the Web client has the Supabase
    callback `https://zzmrftmzefcqehhyztjq.supabase.co/auth/v1/callback`
    (and `http://127.0.0.1:54321/auth/v1/callback`, harmless, unused).
    Nothing to change.

Discord Developer Portal:

11. Done 2026-09-24: OAuth2 redirect is the Supabase callback; Public
    Client off. Optional, after R0 is live: General Information -> Terms of
    Service URL and Privacy Policy URL set to the two page URLs.

GitHub, repository settings -> Secrets and variables -> Actions:

12. Done 2026-09-24 (`gh variable list`): `VITE_SUPABASE_URL` and
    `VITE_SUPABASE_PUBLISHABLE_KEY` are set.
13. Done 2026-09-24 (`gh secret list`): `E2E_SUPABASE_URL`,
    `E2E_SUPABASE_PUBLISHABLE_KEY`, `E2E_SUPABASE_SECRET_KEY`,
    `E2E_USER_EMAIL`, `E2E_USER_PASSWORD` are set. `B1.3` uses the first
    four; `E2E_USER_PASSWORD` is removed once the mint path is proven
    (section 18, conflict 3).
14. Not in v1: branch protection, a `supabase-production` environment,
    `SUPABASE_ACCESS_TOKEN` in CI, the Supabase GitHub integration
    (Branching - decision 27). Migrations and configuration are pushed
    from the owner's machine (step 15).

Every release that carries a migration or a `config.toml` change (R0
config, R1, R2, R3, R4, R6, R7, R8):

15. From the repository root, before the git push, for `test` then
    `prod`: `npx supabase link --project-ref <ref>`; `npm run config:push
    -- --project <name>` (runs `supabase config diff`, prints it, waits for
    a typed `yes`, then `supabase config push`; never `--yes`); `npm run
    db:push -- --project <name>`; after `test`, run the hosted E2E once;
    after `prod`, step 6. The wrappers refuse `db reset` against a linked
    project. A non-empty `config diff` that the repository did not cause is
    hosted drift - a defect: record it, then push the repository's value
    over it. This is where the drift check runs; CI has no access token by
    design.
16. After the push: `node tools/check-site.mjs` is CI's; the owner signs
    in once on a desktop browser, once on an Android phone and once from an
    iPhone installed app, both providers, and records the result in the
    release handoff. At R1 additionally, on `#/account`: connect the second
    provider (a Discord account whose email differs from the Google one),
    see two identities, disconnect one, see Disconnect vanish with one
    identity left; then, from a second Supabase user, try to connect a
    provider account that the first user already holds and see "This
    <provider> account is already used by another account".

Monthly, from R2 on:

17. `npx supabase db dump --linked --data-only -f <date>-data.sql` into the
    owner's encrypted store; delete dumps older than 90 days.
18. From R3 on: Dashboard -> Reports -> Realtime: peak connections under
    150 and messages under 1.5 million for the month; if either is passed,
    the owner says so and the next release raises the poll interval or
    disables the subscription behind a constant. Realtime needs no
    dashboard toggle: it is on by default, and the `realtime.messages`
    policy is a migration.

At the cutoff date (set in R5's closeout):

19. Confirm in production that `#/l/<payload>` draws the retired-link page
    and a local list shows no link buttons; then ask for R10.

Cloud sessions (after R0 is live):

20. claude.ai/code -> environment for this repository: network "Full";
    setup script `bash .claude/cloud-setup.sh`; no environment variables;
    one API credential: `Authorization: Bearer <E2E_SUPABASE_SECRET_KEY>`
    for `https://rdjxcjkhsklhprmzxajq.supabase.co` (the test project's
    secret key from `.env.test.local`; never a production value). Open one
    session on `main`, run `npm run check`, `npm run check:built`, `npm run
    check:db` and the layer 4 probe (`node tests/e2e/probe.mjs` from
    `B1.3`; before `B1.3`, a `curl` with the publishable key against
    `/rest/v1/` must answer 401), and record the result and the starred
    facts of section 18 in `.claude/README.md` through that session's
    branch. The probe's verdict decides whether R1 may run in the cloud.
21. For a cloud release: after its branch is pushed, run section 18
    conflict 5 (a)-(g) in order.

## 16. Owner decisions - answered 2026-09-24

Each: the recommendation as put, then the owner's answer. Durable entries
with rejected alternatives: `docs/DECISIONS.md`, 2026-09-24 (commit
policy, catalog authority, Realtime placement, `#/l/` retirement,
sign-in-only creation).

1. **Commit and release policy.** Recommended one TASK id per release
   (section 9). **Accepted.**
2. **Legacy write cutoff.** Recommended a build-time constant, first Monday
   at least 30 days after the migration release is live, after the owner's
   own migration. **Accepted** (section 10; the release is R5).
3. **Catalog authority.** Recommended `data.js` in git as the only catalog
   source; official records never enter the database. **Accepted.**
4. **Realtime.** Recommended deferring past v1. **Changed: Realtime is in
   v1 as its own release directly after R2.** R2 ships share links with
   polling; R3 adds Broadcast and keeps the poll as the fallback
   (sections 5, 9, 12, 14).
5. **The rest of the scope cut** (no profiles or display name, no
   identity-linking UI, no receipts or usage counters, no pending-write
   buffer, no staging media pipeline, no backup drills, no Trash).
   **Accepted as one bundle.**
6. **Content-bearing `#/l/` links.** Recommended keeping the decoder for
   good. **Changed: the decoder retires at the legacy write cutoff, the
   same date.** What this breaks and the answers: section 10. `B5.1`
   date-gates and announces; `B10.1` removes.
7. **`data.js`, `data.json`, `catalog.csv` contracts.** Keep unchanged.
   **Accepted.**
8. **`i/*.html` and `og/` share pages.** Keep unchanged. **Accepted.**
9. **Bilingual RU/EN for new UI.** Keep. **Accepted.**
10. **Print parity for cloud lists.** Keep, delivered with the item-share
    release. **Accepted** (R9, `B9.1`).
11. **The two-tab `localStorage` merge.** Delete with the local write path
    in the migration release. **Accepted** (R5, `B5.1`).
12. **Anonymous list creation.** Recommended the design's rule (no new
    local lists after the cutoff). **Changed, stricter: from R2 on only a
    signed-in user creates a list.** Anonymous "New list", "Add to list"
    and "Save a copy" ask the user to sign in; existing local lists stay
    editable until the cutoff. Shipped by `B2.2` (prompt in the new-list
    form and the add-to-list menu) and `B2.3` (the shared page's save
    control); specs `FEATURES.md` "Lists", `META.md` section 3,
    `STATE.md`, `COVERAGE.md`; no inventory or golden state changes because
    the unconfigured build the suites drive keeps local creation (section 5,
    "Modes").
13. **Google brand verification and a custom domain.** No. **Accepted.**
14. **Account page, not a dialog** (owner, 2026-09-24). R1 ships the route
    `#/account`, reached from the header control ("Sign in" or the account
    name), with five sections in order: Signed in as; Connected providers;
    Your data (Export JSON, from R6 - absent before); Sign out; Delete
    account. A public contract change in R1 (`ROUTES.md`, `CONTRACTS.md`,
    `docs/fixtures/urls/routes.json`, `tests/contracts.js`, `llms.txt`).
    Reasons: a provider redirect returns cleanly to a route; the privacy
    page links straight to it for erasure. Rejected: a dialog - extra code
    to reopen after the OAuth redirect.
15. **Provider linking in v1** (owner, 2026-09-24; partly reverses decision
    5, the rest of which stands). Connect Google / Connect Discord through
    `linkIdentity`, Disconnect through `unlinkIdentity`, drawn only while
    two or more identities are connected. Automatic linking by verified
    email stays on; manual linking serves users whose Google and Discord
    emails differ; "Allow manual linking" stays **on** (section 15, step
    5). Error case: the provider account already belongs to another
    Supabase user - `linkIdentity` fails with `identity_already_exists` and
    the page shows "This <provider> account is already used by another
    account"; the recovery (JSON export from the account you drop, import
    into the one you keep, from R6) is stated on the privacy page. Coverage:
    vitest with the fake `AuthPort` for connect, disconnect, the
    last-identity guard and the already-linked error; hosted E2E for the
    page's sections and the guard with one identity; real OAuth linking in
    the owner's closeout check (section 15, step 16).

Second round, answered 2026-09-24:

16. **Policy pages in R0** (`B0.1`), conditional privacy voice, contact
    address as the batch's prerequisite; the owner publishes the Google app
    after R0 is live (the console refuses without the privacy link).
17. **Brainstorm ideas 1 (duplicate list) and 5 (share-open count): no.**
18. **Idea 6, "Sign out everywhere": yes**, R1, on `#/account` (`B1.2`).
19. **Idea 7, "edited N ago" and a sort by last edit: yes**, R2 (`B2.2`).
20. **Account preferences: yes**, R1 (`B1.4`), no separate page; language,
    starting section, tables view, print layout, default money mode
    persist per account; account wins, local seeds an empty account, later
    changes write both; anonymous users keep `localStorage`. Reopens the
    `profiles` cut of decision 5 as one `user_prefs` row (`docs/DECISIONS.md`).
21. **Ideas 2, 3, 4-as-page, 8, 9, 10, 11, 12: not in v1** (section 17).
22. **No local JSON export after the cutoff**; migration is the only way
    out (section 10). The earlier question 1 is replaced: **the test build
    gets a deterministic fake cloud** and the goldens cover signed-in and
    signed-out screens (section 8, `B1.1`).
23. **Four named test layers and the CI organisation** (section 8):
    layers 1-3 on every push and pull request, layer 4 on push to `main`,
    `workflow_dispatch` and same-repository pull requests; `deploy` needs
    `e2e`; escape hatch `skip_e2e`; no production credentials in CI.

Settled by the planner, for information: the RLS gate runs in a separate
chain (section 7); `noindex` stays on the policy pages (section 11);
`#/lists` routes are reused for cloud lists (section 4); the worker retires
(section 2); the "Your data" section is absent before R6 rather than a
placeholder; `redirectTo` adopts the allowlisted `?auth-callback=1` form;
the token-free `applied.json` check replaces a `SUPABASE_ACCESS_TOKEN`
read-only check in CI (section 8).

27. **Everything that can be code is code; no Supabase Branching** (owner,
    2026-09-24). Auth settings in `supabase/config.toml` (site URL, the
    three redirects, email, phone and anonymous off, Google and Discord on
    with `env(...)` secrets, manual linking on), applied by `npm run
    config:push` after a read `config diff`, never a blind `--yes`;
    Realtime policies, the broadcast trigger, the Storage bucket and its
    policies are SQL migrations; the dashboard is read-only by convention
    and drift is a defect caught by `config diff` at each release (section
    15, step 15). Lands in `B0.2`. Rejected: the Supabase GitHub
    integration (Branching) - pull-request based, likely paid, and the
    owner pushes to `main`. Recorded in `docs/DECISIONS.md`.

Cloud sessions (section 18), answered 2026-09-24:

24. **Whole releases per host, no scratch branches.** Recommended scratch
    branches per batch; **changed**: a release runs fully in the cloud or
    fully locally; a cloud release starts from the pushed `main`, amends on
    its own task branch, pushes it once at closeout; the owner runs the
    local steps and fast-forwards `main` (section 18, conflicts 1 and 5).
    `CLAUDE.md` gains one line in `B0.2`; the push guard is reshaped to
    "only the current branch, never `main`".
25. **E2E credentials in the cloud as API credentials.** Recommended none;
    **changed**: allowed through the hidden proxy. The proxy carries
    headers only, so the flow drops `E2E_USER_PASSWORD` and mints sessions
    with the secret key through `generateLink` and `verifyOtp` on every
    host; a fail-closed probe refuses layer 4 where the proxy also
    decorates the browser's or the anon client's requests (section 18,
    conflict 3). Production secrets never enter the cloud.
26. **Network "Full".** Recommended "Custom"; **changed**: "Full"; no
    allowlist is kept (section 15, step 20).

Answered 2026-09-24 through the orchestrator, after `B0.1` was dispatched.
Not yet reflected in sections 3, 5, 12 or 14; the planner refresh of the
named batch applies each one and writes the durable ones to
`docs/DECISIONS.md`:

28. **Service worker kept, with caches** (`B0.1`, applied there). `sw.js`
    stays registered for installability. Cache-first for same-origin
    `img/`, `img/thumb/` and hashed `assets/`; the document, `data.js`,
    `pages/`, cross-origin requests and `auth-callback` URLs always go to
    the network. No offline shell. Supersedes section 2 item 2's
    self-unregistering worker. Rejected: the offline shell (sign-in
    callback risk, hashed-name upkeep); no caches (bandwidth on 1272
    images).
29. **Share links are re-copyable** (`B2.1`, `B2.3`). Changed from "hash
    only, shown once": the raw token is stored and readable only by the
    list owner (RLS), so the owner can copy the player or GM link at any
    time; rotate stays as the revoke-and-replace action. Anonymous reads
    still resolve the token server-side. The same applies to item links
    (`B7.1`, `B9.1`). Trade-off accepted: a database leak exposes read-only
    share links.
30. **Saving stays simple; homebrew delete is confirm-then-permanent.**
    Confirmed as planned: no local unsaved-edit buffer, last write wins,
    no conflict warning; homebrew delete has a confirmation and no Trash
    or undo.
31. **Lower default limits with per-user overrides** (`B2.1`, `B7.1`,
    `B5.1`). Defaults: 50 lists per owner, 100 entries per list, 50
    homebrew items per owner (was 200 / 500 / 500; the owner set this after
    two intermediate values the same day). Escape hatch: a `user_limits`
    table (user id, lists, entries per list, homebrew items; null = the
    default) in a migration, with no grant to `anon` or `authenticated`;
    the limit triggers read the user's row when present. The owner raises a
    limit with a local-only command, for example `npm run limits:set --
    --project test|prod --user <email|uuid> --lists 200`, which uses the
    secret key from the local `.env`, never runs in CI or the cloud, and
    prints the before and after values. No admin UI. The limits are also
    stated in `import-v1` (R6). Migration (R5) is exempt: every valid
    local list migrates even above the limits; afterwards the user cannot
    add past a limit until they delete or the owner raises it. The limit
    error message tells the user how to ask for more (the contact address).

Purchase requests (R4, `persist-4-requests`), owner's feature of
2026-09-24. Answered: (1) the requester is anyone with the link, signed in
or not - the first anonymous write; (2) both flows are supported: notify
only, and a signed-in viewer's add-to-own-list with a notification. Open,
with the planner's recommendation (design in sections 3, 5, 12 and 14):

32. **Over-stock lines.** Recommended: refuse the whole request and show
    the failing lines; the owner may then press "Apply available", which
    clamps each line to the stock. Reason: a silent clamp sells what is not
    there without the GM noticing. Alternative: always clamp.
33. **Flow b, prompt or automatic.** Recommended: ask "Notify the GM?"
    once per action with "Remember my choice", stored in
    `user_prefs.notifyGm` (`ask` / `always` / `never`). Reason: some
    players copy items to plan, not to buy, and the preference costs one
    field in an existing row. Alternative: always notify, no setting.
34. **Requester status.** Recommended: yes for everyone - the response's
    `status_key` lets the shared page show Sent / Applied / Declined /
    Expired, kept in `sessionStorage` for that tab. Reason: a player who
    records the items elsewhere needs to know the GM applied them; the key
    reveals status and the request's own lines, nothing about the owner.
    Alternative: fire and forget (the player asks the GM at the table).
35. **Which links may send.** Recommended: both player and GM links, the
    request recording its audience. Reason: a GM-link holder is a co-GM
    the owner trusted with more, not less. Alternative: player links only.
36. **Caps.** Recommended: 20 lines per request, 20 pending per list, 5
    per link per minute, 14-day expiry, 30-day housekeeping at write time,
    40-character name; none in `user_limits`. Reason: a table at play sends
    a handful of requests an hour; the caps bound abuse of the one
    anonymous write without a rate-limit service. Alternative: add the
    pending cap to `user_limits`.
37. **Zero stock.** Recommended: an entry whose quantity reaches zero on
    apply leaves the list, the same as today's "Удалить (N)" on a partial
    removal. Reason: one semantics for stock leaving a shop. Alternative:
    keep the entry at zero as "sold out" (a new state for every list view
    and print card).
38. **Notification channel.** Recommended: in-app only - the private
    Realtime topic and the 45 s poll, a badge on the lists index and the
    Requests panel. Reason: no email or push infrastructure exists and the
    GM is at the table with the app open. Alternative: email through
    Supabase Auth's SMTP (would need a provider) - no.

Answers to 32-38, owner, 2026-09-24 (the R4 planner refresh applies them
to sections 3, 5, 12 and 14 and writes the durable ones to
`docs/DECISIONS.md`):

- 32, 33, 34, 35, 37, 38: **accepted as recommended**.
- 36: **changed.** 100 lines per request (matches the 100-entry list
  limit), 10 pending requests per list, 5 requests per link per minute,
  expiry after **1 hour** (housekeeping at write time), and **no requester
  name field** at all. A request shows its audience (player or GM link) and
  its time only. None of the caps is in `user_limits`. The privacy text
  then has no free-text personal data from requesters to describe.

39. **Nightly backup and keep-alive** (owner, 2026-09-24). Replaces the
    monthly manual dump (section 15, step 17) and the "backup drills"
    line of the scope cut. A scheduled GitHub Actions workflow
    (`backup.yml`, nightly, plus `workflow_dispatch`) runs
    `supabase db dump` for schema and data (roles excluded) against
    production, encrypts the files with `age` to the owner's public key
    (an Actions variable), and uploads them as an artifact with 30-day
    retention. The repository is public, so artifacts are public: nothing
    unencrypted leaves the job, and the job fails closed if the recipient
    is missing. From R7 it also copies the `homebrew-art` objects. The
    nightly run also keeps the free-tier project from pausing (7 days of
    inactivity). Secrets: the production database connection string as an
    Actions secret, used only by this job; this is the one production
    credential in CI, and a written exception to section 7's "no production
    access token in CI". The owner keeps the `age` private key outside the
    repository and the machine's plain files (password manager). A restore
    runbook (download, decrypt, `psql` into the test project first) goes to
    `.claude/README.md` or a `docs/` runbook. It lands with the first
    release that stores user data (R1, `user_prefs`); the R1 planner
    refresh places it in a batch and adds the owner steps (generate the
    `age` key pair, add the secret and the variable) to section 15.
40. **Edge Functions: one, in R7.** Orchestrator recommendation, discussed
    with the owner 2026-09-24; the R7 refresh confirms it. `delete-account`
    (in `supabase/functions/`, deployed from the owner's CLI) verifies the
    caller's session, removes `homebrew-art/<uid>/` through the Storage API
    (Supabase advises against deleting `storage.objects` rows from SQL,
    because the files remain), and deletes the user through
    `auth.admin.deleteUser`. It replaces the R1 SQL `delete_account()` once
    art exists. Homebrew item deletion removes its art through the Storage
    API from the client. The `homebrew-art` bucket declares
    `allowed_mime_types = ['image/webp']` and a file size limit (about
    300 KB) in its migration, so no validation function is needed. No other
    Edge Function: rate limits, expiry and quotas are SQL; backups are
    `backup.yml`; the catalog API is `data.json` and `catalog.csv`.
    Deferred idea (section 17): Discord webhook notifications for purchase
    requests through a trigger and `pg_net`, no Edge Function.
41. **Migrations deploy from CI, automatically; config stays manual**
    (owner, 2026-09-24; R1 builds it with `backup.yml`). Supersedes the
    owner-run `db:push` of section 15 step 15 and section 9's "before the
    push the owner runs `db:push`". On push to `main`, CI applies new
    migrations to the test project, runs layer 4 E2E, then applies them to
    production and deploys, with no approval step; the nightly backup
    (decision 39) is the recovery path. Credentials: the test and the
    production database connection strings as Actions secrets
    (project-scoped; the production one is shared with `backup.yml`);
    migrations run with `supabase db push --db-url`. `config.toml` pushes
    stay a manual owner `config:push` (no account-wide Supabase access
    token in GitHub). The R1 planner redesigns the applied-migration record:
    `supabase/applied.json` is written only by the local wrapper, so the
    `edit-guard.mjs` rule must read the applied set from a source CI keeps
    current (for example the database's `supabase_migrations` history via a
    committed snapshot, or "every migration on `main` is applied"). Owner
    steps (R1): add the two connection-string secrets. Rejected: an
    approval-gated `supabase-production` environment (the owner prefers
    automation, backups cover a bad migration); config push in CI (the
    token is account-wide).

R0 closeout record (2026-09-24): C1 production `config:diff` "drift: none
(4 not-owned)"; C2 `config:push --project test` pushed
`enable_manual_linking`, `minimum_password_length` and
`secure_password_change`; test `config:diff` afterwards "drift: none (4
not-owned)"; C3 no migration; C4 (Google Branding and Publish, device
install checks) follows the deploy.

## 18. Cloud sessions (claude.ai/code)

Facts relied on (code.claude.com cloud-environments docs, 2026-09-24; the
first cloud session after R0 verifies the starred ones): Ubuntu 24.04
x86_64, 4 vCPU, 16 GB, 30 GB; Node 22 on PATH (the repo pins 24); docker
and dockerd preinstalled*; no Chromium preinstalled; the "Trusted" network
allowlist covers package registries and GitHub, a "Custom" list adds
domains; a root setup script (~5 min, cached ~7 days) is set in the
environment dialog; repository `SessionStart` hooks run on every start;
`CLAUDE_CODE_REMOTE=true`; environment variables are visible to the model;
the Bash tool only; the session clones the current remote branch and can
push only its own branch.

**What a cloud session can run.** Layers 1-3 (section 8): `npm run
check`, `npm run check:built`, the `tests/app/` suites against `dist-test/`
(Chrome for Testing downloaded by `npm ci`*), `npm run check:db` (Docker,
no PowerShell detour*). Layer 4 under the condition in conflict 3. Golden
re-seeds are cloud-OK: the goldens are accessibility tree text and control
lists, not pixels (`COVERAGE.md`, "The golden format, and why"), and
ubuntu CI has compared Windows-seeded goldens green since R0c - the
cross-OS proof already exists. Sweep measurements (contrast, geometry) in
the cloud are advisory, as every non-CI run is (`.claude/README.md`'s
doctrine).

**Conflicts settled (owner decisions 24-26, 2026-09-24).**

1. *Commit law and hosts.* A whole release (one task id) runs fully in the
   cloud or fully locally; batches never mix hosts within a release. A
   cloud release starts from the pushed `main`, commits and amends on its
   own working branch named after the task id (`persist-<n>-<name>`), and
   pushes that branch once, at closeout, after the task directory is
   retired. That push is the release's one push: "push once, never
   force-push" reads unchanged with the task branch as its object, and the
   amend window closes at it as always. `CLAUDE.md` gets one line in
   `B0.2`: "A cloud release's one push is its own task branch; the owner
   fast-forwards `main` to it locally." The owner then runs the local
   steps below and `git checkout main && git merge --ff-only
   persist-<n>-<name> && git push`, which triggers `deploy`; a fast-forward
   keeps one commit per release and no merge commit, so the claude.ai/code
   UI merge (a pull request and a merge commit) is not used. The
   `bash-guard.mjs` rule is reshaped and kept: when `CLAUDE_CODE_REMOTE` is
   set, deny a `git push` whose target is `main` or any branch other than
   the current one - a cloud session pushes only its own working branch.
   Rejected: scratch base branches per batch (two extra branch names and a
   cherry-pick per cloud batch, and a mixed-host release whose handoff
   lives in two places).
2. *Goldens.* Cloud-OK, above.
3. *Secrets.* No production secret (DB password, OAuth secrets, service
   keys) ever enters a cloud environment. E2E credentials may enter as API
   credentials (the hidden proxy attaches them to matching HTTP requests;
   they never reach the model). The proxy carries headers, not request
   bodies, so a password sent in `signInWithPassword`'s body cannot go
   through it. Smallest workable shape, adopted for every host: the harness
   stops using `E2E_USER_PASSWORD`; it mints the session with the secret
   key as a header - `auth.admin.generateLink({ type: 'magiclink', email
   })` returns a `hashed_token`, which `verifyOtp({ token_hash, type:
   'magiclink' })` exchanges for a session; the publishable key and URL
   are public and sit in `tests/e2e/config.mjs`. The cloud environment
   then holds one API credential: `Authorization: Bearer
   <E2E_SUPABASE_SECRET_KEY>` for `https://rdjxcjkhsklhprmzxajq.supabase.co`.
   Condition, verified fail-closed at every layer 4 run (`tests/e2e/run.mjs`
   first step): a request with the publishable key alone to a protected
   table must return 401, and a page loaded in Puppeteer must see no
   injected `Authorization` header - if either fails, the proxy is also
   decorating the browser's or the anon client's requests, RLS assertions
   would be meaningless, and layer 4 is refused on that host with a named
   message. Until the first cloud session runs that probe (step 20), a
   cloud release's layer 4 verdict is "conditional". `E2E_USER_PASSWORD`
   stays a CI secret until `B1.3` proves the mint path, then is removed.
4. *Shared state.* A cloud session has its own tree and its own Docker, so
   the one-session-per-tree rule holds; the hosted test project is the one
   shared thing, serialised by the CI concurrency group and by the rule
   that a layer 4 run is one at a time (the owner does not run `npm run
   e2e` while a cloud release runs it).
5. *Owner-only, local, between the cloud push and the fast-forward.* In
   order: (a) `git fetch`, read the release's closeout summary; (b) `npm
   run config:push -- --project test`, `npm run db:push -- --project test`
   (section 15, step 15); (c) the same for `prod`, then Security Advisor;
   (d) the Google or Discord console steps the release names (R0: Branding
   and Publish); (e) fast-forward `main` and push - `deploy` runs; (f) after
   the deploy, the manual OAuth check (step 16); (g) delete the task branch.

**Per-release verdict.**

| Release | Verdict | Reason |
|---|---|---|
| R0 `persist-0-foundation` | local-only | `B0.2` edits the hooks and `settings.json` the session runs under, proves the Docker stack on this host and writes the cloud section itself; the first cloud session (step 20) proves the setup script and the layer 4 probe afterwards |
| R1 `persist-1-auth` | cloud-OK if step 20 passed the layer 4 probe; else local-only | `B1.3` needs layer 4; the contract change and the schema need nothing local |
| R2 `persist-2-lists`, R3 `persist-3-realtime`, R4 `persist-4-requests`, R5 `persist-5-migration`, R6 `persist-6-import-export`, R7 `persist-7-homebrew`, R8 `persist-8-media`, R9 `persist-9-item-share` | cloud-OK (layer 4 conditional as above) | layers 1-3 and the goldens run in the VM; the owner-only steps run locally between the branch push and the fast-forward |
| R10 `persist-10-legacy-removal` | cloud-OK | layers 1-2 only |
| owner steps (section 15) | local-only | dashboards, consoles, `config:push`, `db:push`, the fast-forward of `main` |

**What `B0.2` writes** (`.claude/README.md`, "Cloud sessions"): the
facts above with their verification dates; the layer rule; the branch
rule; the allowlist; the setup script `.claude/cloud-setup.sh` (the
environment dialog runs `bash .claude/cloud-setup.sh`, so the repository
owns it):

```text
1. Node: install nvm, `nvm install $(cat .nvmrc)`, `nvm alias default`.
2. `npm ci` (downloads Chrome for Testing into ~/.cache/puppeteer).
3. gitleaks: download the linux_x64 release tarball from GitHub, install
   to /usr/local/bin, `gitleaks version`.
4. Supabase CLI: `npx supabase --version` (the npm package fetches its
   binary from GitHub releases); optionally `npx supabase start` once to
   pull the images inside the cached layer.
5. Print the versions the SessionStart hook will check.
```

and a `SessionStart` branch in `session-start.mjs` guarded by
`process.env.CLAUDE_CODE_REMOTE === 'true'`: reports the cloud session,
checks Node equals `.nvmrc`, `docker info` answers, the puppeteer cache
exists and gitleaks is on PATH, and states the three rules in one line
each: a whole release on this host, no production secret, push only the
current branch and never `main`. Selftest cases cover the guard both ways.
Network access: "Full" (decision 26), so no allowlist is kept.

## 17. Risks, assumptions, deferred

Carried from R0 (`persist-0-foundation`, closed 2026-09-24; its review
register rows 24-26 and handoff Deferred). The R1 planner refresh places
each one or names it to the owner:

- R1 schema batch, reversibility gate: a real migration has no pre-`up`
  base, so a reversal that leaves an object behind passes when the
  migration is idempotent. Take the base with `supabase db reset --local
  --version <previous>` or `--last`.
- R1 schema batch, layer 3: the additive lint misses `create or replace`
  of an existing object, `set not null`, `revoke` and data statements; the
  invariants miss a view without `security_invoker` and a function `anon`
  can execute through the default PUBLIC `EXECUTE` grant.
- R1, guards: rule 2n covers only `db push`, `config push`, `db reset
  --linked`, `migration up` to a hosted database and the wrappers. Other
  hosted writes (`secrets set`, `functions deploy`, `postgres-config
  update`, `backups restore`, `storage ... --linked`) pass; consider
  deny-by-default for non-local subcommands. `git commit <pathspec>` and
  `git commit -a` leave changes unscanned by 2l and outside 2e/2m.
- Owner checks at R0 closeout, not reproducible by agents: the install
  prompt on Android and desktop Chrome with the registered worker; no
  navigation-preload warning on a device upgraded from the issue 69 worker.
- Small cleanups, no defect: `.impeccable/design.json` still says the app
  runs from `file://` (refresh with `/impeccable document`);
  `AltPanel.svelte`'s tables-link comment cites "no offline copy";
  `clipboard.ts` `legacyCopy` may be removable now that every host has a
  secure context. Any batch touching those files takes them.

- Assumption: Chrome no longer requires a service worker for the install
  prompt. `B0.1`'s closeout has the owner try the install on Android Chrome
  and desktop Chrome; if the prompt is gone, R0 replaces the retiring
  worker with a no-cache worker that has an empty `fetch` listener.
- Assumption: Supabase automatic identity linking by verified email is on
  by default, and `linkIdentity` rejects an identity held by another user
  with the error code `identity_already_exists`; neither is testable on the
  email-only test project - the owner verifies both on production at R1
  closeout (section 15, step 16), and `B1.2` maps any other linking error
  to a generic failure message so a different code cannot pass as success.
- Risk: `ListPage.svelte` (61.7 KB) is the seam of R2; `B2.2` may need a
  split at "a review that cannot be held in one pass" - the planner refresh
  decides after reading the component.
- Risk: goldens re-seeded twice (R0 footer row, R1 footer links); the
  reviewer reads the diff both times.
- Risk: the hosted E2E depends on the test project's schema being pushed by
  hand; the documented failure mode (section 8) names it.
- Risk: Realtime Broadcast from the database (`realtime.send`) and the
  `private: true` channel with a `realtime.messages` policy for `anon` are
  planned from platform documentation, not measured here; `B3.1`'s
  `check:db` case and E2E flow are the proof, and the 45 s poll is the
  fallback if the platform behaves otherwise.
- Risk: `create_purchase_request` is the first RPC `anon` can write
  through; its bounds are inside the function and proven by the layer 3
  matrix (`B4.1`), and a valid share token is the only capability it
  accepts - a leaked GM link is the same exposure it already was, plus
  bounded requests the owner can decline and a rotate that ends it.
- Privacy impact of R4: a typed requester name and the requested items are
  stored for the list owner until 30 days after decision or expiry; the
  privacy page says so and names the deletion (`B4.2`); the name is
  optional and plain text.
- Risk: a `#/l/` link pasted before the cutoff and opened after it is dead
  by the owner's decision; the retired-link page and the `llms.txt`
  announcement are the whole mitigation.
- Risk: the fake cloud drifts from the real adapter; `cloud.contract.ts`
  runs the same assertions against both (layer 1 and layer 4), and the
  seed is the only place fixtures live.
- Risk: applying account preferences after the session resolves can switch
  the language a moment after first paint on a new device; accepted, the
  local key is written back so it happens once per device.
- Deferred: CSP meta policy; homebrew Trash; homebrew import beyond v2's
  create-only; an owner-scoped Realtime topic; brand verification.
- Not in v1 (owner, 2026-09-24, from the brainstorm): list templates; a
  restock note field; a preferences page; a shop restock roll mode;
  homebrew import by pasting a stat block; a player wishlist on a shared
  list (issue 50 with a server); a recent-activity view on `#/account`;
  homebrew sets. Rejected outright: a duplicate-list button; a share-link
  open count.
