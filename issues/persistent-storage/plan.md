# Plan - TASK persistent-storage (programme roadmap)

## Status

- Planning pass 1, 2026-09-24, planner; revised the same day after the
  owner answered decisions 1-13 (section 16). HEAD `12557fe1`, branch
  `claude/persistent-storage-plan-d74d73`.
- NEEDS_HUMAN_CONFIRMATION: no (decisions 1-41 answered, section 16).
- R0 `persist-0-foundation` closed 2026-09-24; R1 `persist-1-auth` closed
  2026-09-25; R2 `persist-2-lists` closed 2026-09-26. Each task directory
  was retired in its closeout commit; the release records are section 16,
  "R1 closeout record" and "R2 closeout record". Next release: R5
  `persist-5-migration` (its plan waits on a worktree branch,
  `context.md`, "Plans made ahead"), then R5b, R3, R4.
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
  and taken counts on the shared page and sends "Notify the owner" - no
  name field (answer 36); a signed-in viewer who adds the selection to
  their own list is asked whether to notify the owner (remembered in
  `user_prefs.notifyGm`). The owner sees a Requests panel on the list
  page, live through the owner topic `owner:<uid>` with the poll as
  fallback, and applies (stock deducted in one transaction) or declines;
  the requester sees pending / applied / declined / expired through a
  request key kept in `sessionStorage`. The first anonymous write in the
  system, bounded by caps (section 5, R4 row). Design:
  `issues/persist-4-requests/plan.md`; answers: section 16, items 32-38.
- From R2 on, only a signed-in user creates a list: anonymous "New list",
  "Add to list" and "Save a copy" ask the user to sign in. Existing local
  lists stay editable until the cutoff (section 10).
- Migration of local lists after sign-in, idempotent, per-list removal after
  read-back; a legacy write cutoff after which local lists are read-only
  and still migratable, and the `#/l/` decoder is retired on the same date
  (section 10).
- JSON export (all, selected, one list) and create-only import of a
  versioned bundle (`import-v1`), published as a JSON Schema for LLM use.
- Homebrew items (same record shape as official items), a "My items"
  search group, add-to-list as a live reference inside the account and a
  frozen copy outside it (owner, 2026-09-26), art upload (client
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
| Design 14 target routes `#/my/lists`, `#/my/homebrew`, `#/my/data/import` | Rejected. `#/lists` and `#/lists/<id>` are reused (the id class `[\w-]+` admits a UUID); homebrew lives at `#/homebrew` and `#/homebrew/<key>` (routes reached from the account menu, no tab - owner, 2026-09-26; R7); import/export is a panel on the lists index and an "Export JSON" section of `#/account`. Fewer contract changes |
| Design 5.3: account section in navigation | Owner 2026-09-24 (decision 14): a header control beside the language switch reads "Sign in" or the account name and opens the route `#/account`; the tab bar keeps ten sections. A dialog was rejected: it needs extra code to reopen after an OAuth redirect, and a plain route is what the privacy page links to for erasure |

Raised, not settled: none beyond section 16.

## 5. Architecture

**Backend** (Supabase, project `zzmrftmzefcqehhyztjq`; test project
`rdjxcjkhsklhprmzxajq`). Schema by release:

| Release | Objects |
|---|---|
| R1 | `public.delete_account()` security definer: deletes the caller's rows and `auth.users` row; `user_prefs(user_id uuid pk references auth.users on delete cascade, prefs jsonb not null default '{}', updated_at)` with owner-only RLS and a `CHECK (pg_column_size(prefs) < 4096)` |
| R2 | As shipped (2026-09-26; migrations `20260925130000`-`20260925130300` are the record): `limit_defaults(key pk, value int null)`, `user_limit_overrides(user_id, key, value int null)`, `effective_limit(user, key)` (decision 31 as amended); `lists(id uuid pk client-generated, owner_id, name, money_mode, player_note, gm_note, revision, created_at, updated_at)` - no `position` (lists are never reordered), `legacy_fingerprint` arrives with R5's writer; `list_entries(id, list_id, item_key, source 'official'\|'homebrew', snapshot jsonb null, position, quantity, price_coins, player_note, gm_note)`; `list_shares(id, list_id, audience, token unique, topic_key uuid default gen_random_uuid(), created_at, revoked_at)` - the raw token, no hash (decision 29); RLS: owner CRUD on `lists` and `list_entries`, owner select on `list_shares`, nothing for `anon`; RPCs `create_list_share`, `revoke_list_share` (no rotate: a link is replaced by delete, then create), `get_shared_list(token)` (the projection, `revision` and `topic_key`; null for a bad or revoked token), `clone_shared_list(token, new_id)`, `reorder_list(list_id, entry_ids)`; triggers bump `lists.revision` and `updated_at` on any list or entry write and hold the limits `effective_limit` reads (50 lists per owner, 100 entries per list) |
| R3 | Revised by the R3 plan (2026-09-25, `issues/persist-3-realtime/plan.md` section 5): a deferred constraint trigger on `lists` sends one message per list per transaction with the final revision, `realtime.send(jsonb_build_object('revision', v_rev), 'revision', 'share:' \|\| topic_key, true)` to every active share (`private` is `true`; the earlier `false` was wrong for private channels), and, if the owner agrees, `{ list, revision, by }` to `owner:<uid>`; a revoke or a deleted list sends `{ revision: null }` to the share topic; `select` policies on `realtime.messages` for `share:<uuid>` (`anon`, `authenticated`) and `owner:<uid>` (`authenticated`), no `insert` policy (no client can send); `reorder_list` becomes tolerant of a stale entry set. All SQL migrations |
| R4 | Revised by the R4 plan (2026-09-26, `issues/persist-4-requests/plan.md` section 5; owner answers 32-38, 36 as changed): `purchase_requests(id, list_id fk cascade, share_id fk cascade, audience, status 'pending'\|'applied'\|'declined', status_key uuid unique, created_at, expires_at = created_at + 1 hour set by the function, decided_at)` - no name, no requester id; "expired" is a pending row past `expires_at`, read, never stored; `purchase_request_lines(request_id, item_key, entry_id on delete set null, quantity 1..99, price_coins snapshot, applied_quantity)`; RLS: the owner selects, no write grant. `limit_defaults` rows `request_lines` 100 and `pending_requests_per_list` 10; the rate (5 per share per minute, from the table), the expiry and a 24-hour retention after a decision or expiry are constants; housekeeping at write time. `create_purchase_request(token, lines)` (`anon`, `authenticated`) answers the `status_key`; `get_purchase_requests(keys)` (`anon`, at most five) answers status and the request's own lines; `apply_purchase_request(id, clamp)` refuses over-stock whole unless `clamp`, zero removes the entry; `decline_purchase_request(id)`. A trigger sends event `request` with `{ list, by }` to R3's `owner:<uid>` on a new or decided request, and `{}` to the sending share's topic on a decision; no new `realtime.messages` policy |
| R6 | Refined by the R6 planning pass (2026-09-26, `issues/persist-6-import-export/plan.md` section 4.5): `import_lists(p_lists jsonb) returns integer` security definer for `authenticated`, create-only with client-made ids (`on conflict (id) do nothing`), one transaction - the table checks and the limit triggers unwind the whole call; `source` and `snapshot` pass through for R7's bundle v2. No table change |
| R7 | Revised by the R7 refresh (2026-09-25, `issues/persist-7-homebrew/plan.md` section 4.3): `homebrew_items(id uuid pk client-generated, owner_id, catalog_key text check '^hb_[a-z2-7]{16}$', content jsonb check homebrew_content_valid(content) and octet_length <= 16384, revision, created_at, updated_at, unique (owner_id, catalog_key))` - the record shape (`kind`, `en`, `ru`, `ende`, `rud`, `tier`, `eq`) in one column, validated by `public.homebrew_content_valid(jsonb)`; no `kind` or `art_url` column (R8 adds `art_url`); owner-only RLS, nothing for `anon`; `homebrew_items_before_update` (pins id, owner, key, created; revision + 1) and `homebrew_items_limit` on `effective_limit(owner, 'homebrew_items_per_owner')` = 50 (decision 31); `homebrew_items_touch` (an edit bumps every referencing list's `revision`) and `homebrew_items_before_delete` (removes the owner's references); `homebrew_snapshot_of(key, content)` = `jsonb_build_object('id', key, 'src', 'homebrew') \|\| content` after the language fallbacks - the frozen form; `list_entries`' R2 CHECK is replaced by `source = 'homebrew' or snapshot is null` and `snapshot is null or homebrew_snapshot_valid(snapshot)` (owner, 2026-09-26: an own entry is a reference with `snapshot` null, a copy that leaves the account is frozen); `get_shared_list` and `clone_shared_list` re-created (the projection fills a reference's `snapshot` from the item; a clone freezes unless the caller owns the list); `service_role` select and delete. `B7.3` adds `import_bundle(p_items, p_lists)` beside R6's `import_lists`. Shares and their RPCs are R9's |
| R8 | Storage bucket `homebrew-art` (`insert into storage.buckets`) and its policies, public read, insert/update/delete only under `<auth.uid()>/` - a SQL migration; `alter table homebrew_items add column art_url text` with a URL-shape CHECK, and a new `homebrew_snapshot_valid` that admits `img` (the R7 refresh, 2026-09-25); the `delete-account` Edge Function of decision 40 lands here, not in R7 |
| R9 | `homebrew_shares` (as `list_shares`: `item_id`, `token`, `topic_key`, `revoked_at`, one active link per item); RPCs `get_shared_homebrew(token)` for `anon`, `clone_shared_homebrew(token, new_id)` with a new key made in SQL, `add_shared_homebrew_to_list(token, list_id, entry_id)` writing the R7 snapshot formula, share create and revoke (the R7 refresh, 2026-09-25) |

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
| `FEATURES.md` "Account lists" (the Requests panel, "Notify the owner", the requester's status, apply and decline, the index line, flow b, the limits), `STATE.md` (`sessionStorage['dhloot.requests.v1']`; `prefs.notifyGm` and its Display settings row are R5b's, owner 2026-09-26), `META.md` section 3 (the first anonymous write), `I18N.md`, `pages/src/privacy.html` and `en/` (a request stores items, counts, link kind and time - no name, account or address; expires in 1 hour; deleted 24 hours after a decision or expiry, at the next send), `pages/src/terms.html` and `en/` (a request is not an order), `COVERAGE.md` | `B4.2` |
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
release**, `persist-<n>-<name>`. A local release follows the standing law
unchanged: first batch commits, later batches amend, closeout deletes
`issues/persist-<n>-<name>/`, pushes once; the push to `main` deploys. A
cloud release pushes its branch after every green commit and the
orchestrator squash-merges it onto `main` (`docs/DECISIONS.md`, 2026-09-24
and 2026-09-25 entries; `.claude/README.md`, "Cloud sessions"). Migrations
reach both projects from CI (decision 41); the owner keeps `config:push`
and re-runs the Security Advisor (section 15). This
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
| R1 | `persist-1-auth` | `B1.1`-`B1.6` - **closed 2026-09-25**, live at the merge onto `main` | Fake cloud and test build (layer 2), sign in, `#/account` with linking and sign out everywhere, delete account, hosted E2E (layer 4) and CI `e2e` job, account preferences, CI migration deploys (decision 41), the nightly backup (decision 39) |
| R2 | `persist-2-lists` | `B2.0`-`B2.3` - **closed 2026-09-26**, live at the push of `main` | The test-migration fix (`B2.0`), then cloud lists with "edited N ago", sign-in-only creation, player and GM share links with polling, save a copy; `llms.txt` and the shared page name the cutoff date |
| R5 | `persist-5-migration` | `B5.1`, `B5.2` - **planned 2026-09-26** (`issues/persist-5-migration/plan.md` is the authority) | **Moved directly after R2 (owner, 2026-09-25)** so that `LEGACY_WRITE_UNTIL` = 2026-10-26 is reachable (section 10): `B5.1` the `legacy_fingerprint` column and index, the exempted limit triggers and the `move_legacy_list` RPC; `B5.2` the automatic move at sign-in with its one-time notice and first-account guard (owner, 2026-09-26), the read-only cutoff, the date-gated `#/l/` retirement and its announcement, the post-date write path without the merge. Must be live on production by 2026-10-12, else the date moves |
| R5b | `persist-5b-account-menu` (owner, 2026-09-26: its own release; `issues/persist-5-migration/plan.md` section 9b is its brief until the refresh gives it a directory) | `B5.3` | Right after R5, live by 2026-10-19 (before the 2026-10-26 cutoff): the header's account menu («Настройки отображения», «Мои списки», «Выйти»; «Мои предметы» joins in R7), the Display section of `#/account` (the five synced settings and R4's `notifyGm` choice), the Lists tab gone from the cutoff (`#/lists` stays a route) |
| R11 | `persist-usage-monitoring` (working id kept; its directory exists) | `B11.1` | **Placed after R5 (owner request 2026-09-25, "after r2"; planner 2026-09-25), and after R5b from 2026-09-26**: a nightly `usage.yml` report of production's free-plan usage - database and Storage size, rows per table, an MAU estimate, request counts, users near their count limits - with a forecast, a summary every night, a failed run (GitHub's email) near a limit, the `usage_snapshots` history table and the keep-alive Data API call. Plan: `issues/persist-usage-monitoring/plan.md` |
| R3 | `persist-3-realtime` | `B3.1`, `B3.2` | Live updates on shared pages and (owner's Q1) on the owner's own devices; Realtime is the primary path and the poll runs while it is down (owner, 2026-09-25) |
| R4 | `persist-4-requests` | `B4.1`, `B4.2` | Purchase requests from a shared list to its owner: anonymous "Notify the owner", the signed-in "add to my list, notify the GM" flow, the owner's Requests panel, apply and decline, requester status |
| R6 | `persist-6-import-export` | `B6.1`, `B6.2` (planned 2026-09-26) | JSON export and import, published schema `schema/import-v1.json` |
| R7 | `persist-7-homebrew` | `B7.1`-`B7.3` (planned 2026-09-26; `issues/persist-7-homebrew/plan.md` is the authority) | Homebrew items as live references in the owner's lists, «Мои предметы» from the account menu and in search, the source tag «Хоумбрю» / "Homebrew" (owner, 2026-09-26), bundle schema v2 |
| R8 | `persist-8-media` | `B8.1` | Homebrew art |
| R9 | `persist-9-item-share` | `B9.1` | `#/h/<token>`, add and clone, print routes for cloud lists |
| R10 | `persist-10-legacy-removal` | `B10.1` | After the cutoff date has passed: the `#/l/` codec, its fixtures and contract text are removed |

The order is R0, R1, R2, R5, R5b, R11, R3, R4, R6-R9, R10 (owner, 2026-09-25;
`docs/DECISIONS.md`, "`LEGACY_WRITE_UNTIL` is 2026-10-26"; R11 placed after
R5 so R5's 2026-10-12 deadline keeps priority; R5b split from R5 by the
owner, 2026-09-26). R10 is the
first release dispatched after the cutoff date; R3, R4, R5b, R6-R9 and R11 may
ship before it. Each release is deployable alone.

## 10. Legacy write cutoff (owner decision D2)

The design's 2026-10-07 cannot hold. Replacement rule, settled 2026-09-24
(decision 2), extended by decisions 6 and 12:

- `LEGACY_WRITE_UNTIL` is a build-time constant (`app/src/lib/legacy.ts`),
  ISO date with a time zone, shown in the migration banner, on the local
  lists index and in `llms.txt` from the day R5 ships.
- Its value is **Monday 2026-10-26**, fixed by the owner 2026-09-25
  (`docs/DECISIONS.md`, "`LEGACY_WRITE_UNTIL` is 2026-10-26"; it replaces
  "the first Monday at least 30 days after R5 reaches production, set in
  R5's closeout"). R2's `llms.txt` and shared page name it from the day R2
  ships; R5 writes the constant. Safety rule: if R5 is not live on
  production by 2026-10-12, the owner moves the date later. R5 ships only
  after the owner has migrated real lists on one desktop browser and one
  phone - how that happens before R5 is live is an open question for R5's
  refresh (question f; answered 2026-09-25: the owner migrates on production
  as the first user right after R5 deploys, and a defect found then moves
  the date - an R5 closeout step, not a merge gate).
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
| `B1.1`-`B1.6` | R1, closed 2026-09-25: the fake cloud and test build, sign-in and `#/account`, the hosted E2E and the CI `e2e` job, account preferences, CI migration deploys and the nightly backup, a states-case fix. The design as built is in `docs/specs/`, `docs/DECISIONS.md` and `.claude/README.md`; the batch briefs are in R1's commit history | - | - | - | - |
| `B2.0`-`B2.3` | R2, closed 2026-09-26: the test-migration fix and the `production` Environment, the lists schema with limits and share links, account lists in the app with sign-in-only creation, share links `#/s/<token>` with "Save a copy". The design as built is in `docs/specs/`, `docs/decisions/` and `.claude/README.md`; the batch briefs are in R2's commit history | - | - | - | - |
| `B11.1` | R11, after R5 and R5b: `usage_snapshots` migration and reversal, `tools/supabase/usage-lib.mjs` and `usage.mjs`, `.github/workflows/usage.yml` (Environment `production`, `contents: read`), `tests/derived.js` pins, layer 1 and layer 3 tests, `.claude/README.md` "Usage monitoring" | `COVERAGE.md`, `META.md` | layer 1 `check`, layer 3 `check:db` (~15 min) | required (schema rule; a workflow that reads a production secret) | new release (R11) |
| `B3.1` | Revised by the R3 plan (2026-09-25; `issues/persist-3-realtime/plan.md` section 10): the database half - broadcast triggers, `realtime.messages` policies, tolerant `reorder_list` (R2 review row R3), `check:db` with `realtime` and `kong` running and WebSocket clients proving delivery, one message per transaction, no client send, reversal of the policies | - | layer 1 `check`, layer 3 `check:db` (~20-25 min, first image pull included) | required: schema rule | new release (R3) |
| `B3.2` | The client half (R3 plan section 11): `EventsPort` (real, lazy, fake with `play` and `setLive`), the `connecting`/`live`/`down` feed with backoff, the share page and (Q1) the owner lists on it, the poll only while down, a 20 s write timeout (R2 review row R4), a hidden status region; layer 2 states; E2E: live update, live revoke, two owner pages | section 6 row 16 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens, layer 4 E2E (~30 min) | required: UI and a new port | a commit the harness cannot reach (the E2E needs `B3.1`'s migration on the test project) |
| `B4.1` | Revised by the R4 plan (2026-09-26; `issues/persist-4-requests/plan.md` section 10): section 5's R4 row in one migration and its reversal; layer 3 matrix: anon sends through an active player or GM token only, a stopped or wrong token is refused alike, bad and stale lines, the line limit, the rate (6th in a minute), the pending cap (11th), housekeeping, the status read shows nothing about the owner, another user cannot read, apply or decline, over-stock refused whole, clamp, zero removes the entry, the `request` events on the owner and share topics; the harness's anon function list and the limit rows | `COVERAGE.md` | layer 1 `check`, layer 3 `check:db` x2 (~16 min) | required (schema rule; the first anonymous write) | new release (R4) |
| `B4.2` | Revised by the R4 plan (section 11): `RequestRepository`, fake and contract case, `env.session`, the requester's send and status block, flow b with `notifyGm`, the owner's Requests panel with apply, «Принять доступное» and decline, the index card line, R3's feeds routing `request`, policy text; layer 2 states and cases; E2E: an anonymous request applied by the owner, stock lowered, the requester's status reads applied | section 6 row 17 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens, sweep at 360, layer 4 E2E (~40 min) | required: new UI, policy text | a commit the harness cannot reach (the E2E needs `B4.1`'s migration on the test project) |
| `B5.1` | Refreshed 2026-09-26 (`issues/persist-5-migration/plan.md` section 8): `lists.legacy_fingerprint` with its check and the partial unique index `(owner_id, legacy_fingerprint)`; the two limit triggers re-created to skip a move (`dhloot.move`, decision 31's exemption); `move_legacy_list(p_id, p_canonical)` - the database hashes the canonical text, inserts the list and entries in one transaction, answers the existing id with `inserted = false`; the layer 3 matrix and the reversal | `COVERAGE.md` | layer 1 `check`, layer 3 `check:db` (~10 min) | required (schema rule) | new release (R5) |
| `B5.2` | The move and the cutoff (`issues/persist-5-migration/plan.md` section 9): `LEGACY_WRITE_UNTIL` in `lib/legacy.ts` with `canonicalList`, a clock port (the test build pinned before the cutoff, `?today=` beside `?as=`), `ListRepository.move`, the `LegacyMove` store run at sign-in (per-list RPC, one read-back, one storage write, `dhloot.migrated.v1` with the first account's id, the tombstones and the notice), the one-time `MoveNotice` under the header and the quiet `MoveStatus` in the storage notice's slot, read-only browser lists after the date (every control in the plan's table; delete stays), the retired-link page for every `#/l/` shape, the texts and specs, `tests/derived.js` pinning the date in every document that names it; layer 2 states (the moved index with the notice, the dismissed notice, another account, read-only index and list, the retired page), states cases 43-44, contract case H, E2E F8 | section 6 row 18 (less the install guide, done in `B2.2`) | layer 1 `check` x2, `check:built`, layer 2 `app/states`, `app/contracts`, goldens, sweep at 360, layer 4 E2E (~45 min) | required: new UI, data safety | SQL judged apart from Svelte; layer 4 needs the RPC on the test project |
| `B5.3` | The account menu, `AppState.signOut`/`setHome`/`setNotifyGm`, the Display section of `#/account`, the Lists tab gone after the date (`issues/persist-5-migration/plan.md` section 9b); recommended as release R5b | `FEATURES.md` ("Account", "Chrome"), `ROUTES.md` ("Sections"), `STATE.md` | layer 1 `check` x2, `check:built`, layer 2 `app/states`, goldens, sweep at 360, layer 4 E2E (~40 min) | required: new UI on every page | a different component set and seed (`Shell`, `AccountPage`); a review apart from `B5.2` |
| `B6.1` | Refined 2026-09-26 (`issues/persist-6-import-export/plan.md` section 8): the contract and the database - `schema/import-v1.json` (draft 2020-12, `$id` the published URL, `additionalProperties: false`), `docs/fixtures/import/`, `tests/contracts.js` pins, `llms.txt` section "Lists as a file (import-v1)" (the bundle replaces LLM-built links), `CONTRACTS.md` section 4, the published-file lists (`ci.yml`, `check-site.lib.mjs`, `<noscript>`); `lib/bundle.ts` (build, validate with JSON paths, parse; a schema-drift test); `ListRepository.import` on the real adapter, the lazy port and the fake; `import_lists` migration, reversal, layer 3 matrix; contract case H and a real-only atomicity check | section 6 row 19 | layer 1 `check`, layer 3 `check:db`, `check:built`, layer 4 E2E (~12-15 min) | required: public contract, schema rule | new release (R6) |
| `B6.2` | The UI: «Экспорт» (a checklist of the account lists, «Скачать JSON (N)») and «Импорт» (choose a file, validate, preview counts and skipped ids, one press) panels under the index's «Ваш аккаунт» heading; `#/account` «Ваши данные» with «Скачать все списки (JSON)»; «Скачать JSON» on an account list's page; `AppState.exportLists`, `CloudLists.import`; the driver's `download()` and `upload()` verbs; layer 2 states as `gm1`: the export panel, the import panel, the preview, the refused file, the imported list; states cases 43-45; E2E F8 | `FEATURES.md`, `META.md` section 3, `COVERAGE.md` | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens, sweep at 360, layer 4 E2E (~37 min) | required: new UI | a public-contract change and SQL apart from Svelte; a commit boundary the harness cannot reach (the states need `B6.1`'s fake `import` and fixtures) |
| `B7.1` | Refreshed 2026-09-25, revised 2026-09-26 (`issues/persist-7-homebrew/plan.md`, the release's authority): R7 schema (section 5, R7 row), the matrix in `tests/db/homebrew.test.mjs` and the projection cases in `list-shares.test.mjs`, the reversal, `lib/homebrew.ts` (`validateDraft`, `toRecord`, `snapshotOf`, `withRecords`), `HomebrewRepository` in `ports/types.ts`, the real adapter and the fake, the seed's three items, a reference row in list 101 and a frozen row in `gm2`'s list, `cloud.contract.ts` case H, the shared fixtures `docs/fixtures/homebrew/` | `COVERAGE.md` | layer 1 `check`, layer 3 `check:db`, layer 4 E2E (~11 min) | required (schema rule) | new release (R7); SQL and ports judged apart from Svelte |
| `B7.2` | `#/homebrew`, `#/homebrew/new`, `#/homebrew/<key>` reached from the account menu's «Мои предметы» (owner, 2026-09-26; no tab current), the editor with the live card preview and the "in N lists" line, the «Мои предметы» search group over `Index.homebrew`, `AppState.index` derived through `withRecords`, add to list as a reference, the list, shared and index pages drawing references and frozen copies, `#/i/<key>` for the owner, print of a homebrew card, delete with the count warning, the `Homebrew` store's refresh on R3's owner topic; layer 2 states as `gm1` and `gm2`; E2E F8; the `DEBT.md` entry for the print address (retired by R9) | section 6 row 20 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens, layer 4 E2E (~29 min) | required: public contract, new UI | a commit boundary the harness cannot reach (needs `B7.1` and R5's menu) and a public-contract change |
| `B7.3` | Bundle schema v2 as an extension of R6's v1: `schema/import-v2.json`, top-level `homebrew`, entries with `source: homebrew` and a frozen `snapshot` (a file never carries a bare reference), export all with items, create-only import through `import_bundle(p_items, p_lists)` beside `import_lists` (one migration; a held key becomes a reference again); `llms.txt`, `CONTRACTS.md` section 4; layer 2 import preview as `gm1`; E2E export-delete-import | section 6 row 20 | layer 1 `check` x2, layer 3 `check:db`, `check:built`, layer 2 `app/states,app/contracts`, goldens, layer 4 E2E (~30 min) | required: public contract | a second public contract with its own fixtures and a migration `B7.2` has none of |
| `B8.1` | Art: decode, square crop, 640 and 160 WebP, upload to the owner folder, `art_url`, rows and cards draw it, replace and remove; layer 2 states: a homebrew row and card with seeded art | `FEATURES.md` | layer 1 `check`, `check:built`, layer 2 `app/states`, goldens, layer 4 E2E (~20 min) | required: UI | new release (R8) |
| `B9.1` | `#/h/<token>` (subscribes to its topic as `B3.1` does), add to list and clone, print routes `#/print/list/<id>` and `#/print/s/<token>` with homebrew cards; layer 2 states: `#/h/` signed out and as `gm2`, both print routes | section 6 row 21 | layer 1 `check` x2, `check:built`, layer 2 filter group, `app/print`, goldens, layer 4 E2E (~27 min) | required: public contract | new release (R9); a public-contract change |
| `B10.1` | After the cutoff date: remove the `#/l/` codec, its writers, fixtures, tests and contract text (section 10 (c)); `legacyList` route kind kept for the retired-link page | section 6 row 22 | layer 1 `check` x2, `check:built`, layer 2 filter group, goldens (~28 min) | required: public contract | new release (R10), gated on the date |

Total gate cost, one green pass per batch, idle host: about 7.7 hours
(R7's three batches are 70 minutes by the 2026-09-25 re-measured figures),
plus about 15 minutes for R11's `B11.1`
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

`B1.1`-`B1.6`: shipped in R1 (section 9). Their outlines were superseded by the
release's own plan; the code, the specs and `docs/DECISIONS.md` are the record.

`B2.0`-`B2.3`: shipped in R2 (section 9). Their outlines were superseded by the
release's own plan; the code, the specs and `docs/decisions/` are the record.

`B3.1`-`B3.2`: planned 2026-09-25 in `issues/persist-3-realtime/plan.md`,
which is the release's authority (owner questions Q1-Q3 answered as
recommended, 2026-09-26).
`B3.1` is the database half, `B3.2` the client half (`EventsPort` over
`supabase.channel(topic, { config: { private: true } })`). The shared page
refetches when a received revision is above the one drawn, coalesced
250 ms, and on every join; the 45 s poll runs only while the feed is down
(`docs/DECISIONS.md`, 2026-09-25, "Realtime is the primary live path ...").
Free-plan limits (200 peak connections, 2 million messages a month; a
Broadcast counts one message plus one per receiver) are a monthly owner
check (section 15, step 18).
Acceptance line placed by R11 on `B3.1`: the nightly usage report gains
`realtime_rows_24h`, the rows of `realtime.messages` inserted in the last
24 hours (a lower bound of billed messages), as an info row; its request
counts already hold `realtime` (`issues/persist-usage-monitoring/plan.md`,
section 11).

`B11.1` (R11, after R5 and R5b; its own plan is the authority): a
nightly `usage.yml` in the Environment `production` reads database size
(`pg_database_size`), rows and bytes per `public` table, Storage bytes
(`storage.objects`), an MAU estimate from `auth.users` and `auth.sessions`,
users near their count limits, and request counts per service from the
Management API's `usage.api-counts` with a scoped read-only token
(`SUPABASE_USAGE_TOKEN_PROD`); stores one `public.usage_snapshots` row a
day; forecasts days left by a 28-day least-squares slope; warns at 50 %
or under 60 days and fails at 80 % or under 14 days (owner, 2026-09-26);
makes one Data API call as the free-tier keep-alive. Billed egress, MAU
and Realtime connections have no public API (2026-09-25) and stay the
dashboard's.

`B4.1`-`B4.2` Purchase requests: planned 2026-09-26 in
`issues/persist-4-requests/plan.md`, which is the release's authority
(its owner question answered 2026-09-26: the remembered "notify the
owner" answer is changed in R5b's Display settings, not in a field R4
adds to `#/account`). The owner's
answer to 36 stands as given: 100 lines per request and 10 pending per
list as `limit_defaults` rows, 5 per share per minute and a 1-hour expiry
as constants, no requester name. The function's bounds are inside it, not
client checks. `B4.1` is the database half, `B4.2` the client half; the
owner's notification rides R3's `owner:<uid>` topic (R3's Q1 answered
yes) as a revision-free nudge, then a re-read; the poll covers a feed that
is down.

`B5.1`-`B5.2` (planned 2026-09-26 in `issues/persist-5-migration/plan.md`,
which is the release's authority): the fingerprint is SHA-256 of a
canonical JSON of the normalised local list (keys sorted, no codec),
computed by the database inside `move_legacy_list`, unique per owner;
the move runs by itself when a signed-in reader's app loads with browser
lists (owner, 2026-09-26: an RPC per list, one read-back, one storage
write, `dhloot.migrated.v1` with the first account's id, the tombstones by
local id and the names for a one-time notice; a later account on that
browser moves nothing); the move is exempt from the count limits; a quiet
status in the storage notice's slot says moving, failed (retried on the
next load) or refused (the list stays, named); `LEGACY_WRITE_UNTIL` gates
every item of section 10 in a configured build, the test build's clock is
pinned before it and `?today=` moves it; the retired-link page for every
`#/l/` shape; after the date the only browser-list writes are the move's
removal and a delete through a fresh read (no merge), and R10 deletes the
pre-date writers and `mergeLists` with the codec; `B5.2` also pays
`docs/specs/DEBT.md` D24's R5 part (a readable `dhloot.lists.v2.bad`
backup moves or is named in the notice). `B5.3` (release R5b, owner,
2026-09-26): the account menu, the Display section of `#/account` with R4's
`notifyGm` choice, nine tabs from the cutoff. The install guide's iOS
paragraph was rewritten by `B2.2`. Decisions: `docs/DECISIONS.md`,
2026-09-26, four entries. Live on production by 2026-10-12 or the date
moves; R5b by 2026-10-19.

`B6.1`-`B6.2` (planned 2026-09-26 in `issues/persist-6-import-export/
plan.md`, the release's authority): the file `import-v1` - `format`
`daggerheart-loot/lists`, `version` 1, `lists[]` in `snake_case` (`name`,
`money_mode`, `player_note`, `gm_note`, `entries[]` with the `catalog.csv`
`id`, `quantity`, `price_coins`, both notes; `source` reserved for v2), no
ids or timestamps, both notes always; `schema/import-v1.json` in the
repository root (copied to `_site` by `ci.yml`, probed by
`check-site.lib.mjs`, linked from `llms.txt` and the `<noscript>` block),
strict (`additionalProperties: false`), frozen; import is create-only with
client-made ids, one `import_lists` transaction (all or none), unknown ids
skipped and named in the preview, the schema's bounds checked in the
client (`lib/bundle.ts`, no dependency) and the account limits by the
database; export from `#/account` (all), the lists index (a checklist) and
an account list's page (one) through `ImagePort.download`. Three decision
files of 2026-09-26 in `docs/decisions/`. Owner questions (all-or-nothing,
both notes, three surfaces, unknown ids skipped) in that plan's section
11. Bundle v2 (R7) bumps `version`, widens `source` and adds the homebrew
snapshot; the RPC's signature holds.

`B7.1`-`B7.3` (refreshed 2026-09-25 in `issues/persist-7-homebrew/plan.md`,
the release's authority): section 5 schema; homebrew content is the
`Record_` shape narrowed to what the form fills (`kind`, names and
descriptions in both languages with at least one name, `tier` 1-4 typed
by the owner and never derived, `eq` for equipment), one jsonb column
validated in SQL and in `lib/homebrew.ts` over shared fixtures; keys
`hb_` + 16 base32 characters, per owner; `Index.homebrew` and
`withRecords(index, records)` merge the owner's items into `byId` and a
second search group without touching `data.js`, the tables or the rolls;
an own item in a list is a live reference (`snapshot` null) drawn from
the merged index, so an edit reaches every list and every open shared
page (the item's touch trigger bumps the lists' `revision`; R3's topics
carry it); a copy that leaves the account - "Save a copy", R4's
add-to-my-list, R6's export, R9's add from a link - is frozen by
`homebrew_snapshot_of`; a delete warns with the count and removes the
references; the pages resolve frozen copies through the same
`withRecords`; the page is reached from the account menu's «Мои
предметы» (R5b builds the menu); saves are a form submit; bundle v2
extends v1 with a `homebrew` array and frozen entries, imported through
`import_bundle(p_items, p_lists)` beside R6's `import_lists` (a held key
becomes a reference). Decisions: `docs/DECISIONS.md`, 2026-09-25, "A
homebrew item is stored as the catalog record shape ...", "A homebrew
save is a form submit ..."; 2026-09-26, "Homebrew in the owner's lists
is a live reference; a copy that leaves is frozen", "Homebrew is reached
from the account menu, not from a tab".

`B8.1`: `art_url` as an additive column with a URL-shape CHECK;
`toRecord` maps it to `Record_.img` as an absolute URL, `artSrc` passes an
absolute `img` through and derives the 160 px name by R8's own rule;
`homebrew_snapshot_of`, `snapshotOf` and a new `homebrew_snapshot_valid`
carry `img`; a replaced picture whose URL a frozen copy still names is
answered by the broken-art fallback, so files may be deleted freely (a
reference always draws the current picture); the editor's card
preview reserves the picture slot; decision 40's `delete-account` Edge
Function ships here with the bucket (nothing to delete before R8).
Acceptance line placed by R11 on `B8.1`: the usage report's Storage row
reads the `homebrew-art` bucket - after the E2E upload, the test project's
report shows a non-zero `storage_bytes`.

`B9.1`: section 5's R9 row; `#/h/<token>` draws `RecordCard` over
`toRecord()` of the projection and subscribes to `share:<topic_key>` as
`B3.1` does; `add_shared_homebrew_to_list` writes a frozen copy; a clone
is the cloner's own item (a new row, a new key, a reference in the
cloner's lists), and «Сделать своим» from a frozen list row is R9's
call; `#/print/list/<id>` and `#/print/s/<token>` load entries, resolve
them through `withRecords(index, snapshots)` (a reference from the
owner's items, a frozen row from itself) and reuse `PrintPage`, retiring
the `DEBT.md` entry `B7.2` writes for the `#/print/<ids>` address of a
list with homebrew entries.

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
    `E2E_USER_EMAIL` are set; `E2E_USER_PASSWORD` was deleted by the owner
    (2026-09-25, `gh secret list`). Done 2026-09-25 for R1: the secrets
    `SUPABASE_DB_URL_TEST` and `SUPABASE_DB_URL_PROD` (the session pooler
    form, `.claude/README.md` "The hosted E2E and the deploy") and the
    variable `BACKUP_AGE_RECIPIENT`.
14. Not in v1: branch protection, `SUPABASE_ACCESS_TOKEN` in CI, the
    Supabase GitHub integration (Branching - decision 27). Configuration is
    pushed from the owner's machine (step 15); migrations from CI (decision
    41). Changed 2026-09-25 (owner, R2): a GitHub Environment `production`
    limited to `main` holds `SUPABASE_DB_URL_PROD` - built in `B2.0`, the
    owner's steps in `.claude/README.md`, "The hosted E2E and the deploy".

Every release that carries a migration or a `config.toml` change (R0
config, R1, R2, R3, R4, R6, R7, R8):

15. Before the merge onto `main`, for `test` then `prod`: `npm run
    config:diff -- --project <name>`, then `npm run config:push --
    --project <name>` if it differs (typed `yes`, never `--yes`); then step
    6. Migrations are not the owner's: `migrate-test` and `migrate-prod` in
    `ci.yml` apply them (decision 41; `.claude/README.md`, "Supabase
    configuration", "Release procedure"). A non-empty `config diff` that the
    repository did not cause is hosted drift - a defect: record it, then
    push the repository's value over it. This is where the drift check
    runs; CI has no access token by design.
16. After the push: `node tools/check-site.mjs` is CI's; the owner signs
    in once on a desktop browser, once on an Android phone and once from an
    iPhone installed app, both providers, and records the result in the
    release handoff. At R1 additionally, on `#/account`: connect the second
    provider (a Discord account whose email differs from the Google one),
    see two identities, disconnect one, see Disconnect vanish with one
    identity left; then, from a second Supabase user, try to connect a
    provider account that the first user already holds and see "This
    <provider> account is already used by another account"; cancel the
    consent screen once and see «Не получилось. Попробуйте ещё раз.»;
    "Sign out everywhere" on one device ends the other's session at its
    next refresh; Back from the provider page re-enables the account
    buttons (proven so far only on a stub window).

Monthly, from R2 on:

17. Replaced by decision 39, built in R1: `backup.yml` dumps production
    nightly (`.claude/README.md`, "Backups and restore"). Nothing monthly.
18. From R3 on: Dashboard -> Reports -> Realtime: peak connections under
    150 and messages under 1.5 million for the month; if either is passed,
    the owner says so and the next release raises the poll interval or
    disables the subscription behind a constant. Realtime needs no
    dashboard toggle: it is on by default, and the `realtime.messages`
    policy is a migration.

At the cutoff date (2026-10-26, fixed 2026-09-25):

18a. For R11, after its push: the scoped usage token, the secret
    `SUPABASE_USAGE_TOKEN_PROD` in the Environment `production`, the
    failed-run email setting, and one dispatch of `usage.yml`
    (`issues/persist-usage-monitoring/plan.md`, section 9).
19. Confirm in production that `#/l/<payload>` draws the retired-link page
    and a local list shows no link buttons; then ask for R10.

Cloud sessions (after R0 is live):

20. Done 2026-09-24, superseded as written: the environment has network
    "Full", the setup field of `.claude/README.md` "Cloud sessions", the
    `E2E_*` names and `SUPABASE_DB_PASSWORD_TEST` as environment variables,
    and **no** API credential (measured to replace every `Authorization`
    header; `docs/DECISIONS.md`, 2026-09-24, "The hosted E2E reads its
    credentials from the environment"). Chrome for Testing needs the proxy's
    authority in `~/.pki/nssdb` (`.claude/cloud-nss.sh`, run by the setup
    script). The measured results are in `.claude/README.md`, "Cloud
    sessions".
21. For a cloud release: the owner and orchestrator closeout lists of
    `.claude/README.md`, "Cloud sessions".

## 16. Owner decisions - answered 2026-09-24

Each: the recommendation as put, then the owner's answer. Durable entries
with rejected alternatives: `docs/DECISIONS.md`, 2026-09-24 (commit
policy, catalog authority, Realtime placement, `#/l/` retirement,
sign-in-only creation).

1. **Commit and release policy.** Recommended one TASK id per release
   (section 9). **Accepted.**
2. **Legacy write cutoff.** Recommended a build-time constant, first Monday
   at least 30 days after the migration release is live, after the owner's
   own migration. **Accepted** (section 10; the release is R5). **Amended
   2026-09-25**: the constant is 2026-10-26, R5 moves directly after R2,
   and the date moves if R5 is not live by 2026-10-12 (section 9, 10;
   `docs/DECISIONS.md`).
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
25. **E2E credentials in the cloud as API credentials.** Superseded
    2026-09-24 by `docs/DECISIONS.md`, "The hosted E2E reads its
    credentials from the environment; no proxy credential" (the proxy
    credential replaced every `Authorization` header). The mint through
    `generateLink` and `verifyOtp` stands. Production secrets never enter
    the cloud.
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
    two intermediate values the same day). **Amended by the owner
    2026-09-25** (`docs/DECISIONS.md`, 2026-09-25, "Count limits are rows
    read by `effective_limit()`"): the escape hatch is two tables, not one
    wide row - `limit_defaults(key pk, value int null)` holds every count
    limit and `user_limit_overrides(user_id, key fk, value int null)` one
    user's override; a missing override is the default, `null` is no
    limit, an override may raise or lower. `effective_limit(user, key)`
    raises for a key not in `limit_defaults`, so a typo never reads as
    unlimited; every limit trigger calls it. No grant to `anon` or
    `authenticated`. The table covers every count limit (lists, entries
    per list, homebrew items, R4's lines per request and pending requests
    per list); R4's rate (5 per link per minute) and expiry (1 hour) stay
    constants. The owner edits an override with a local-only command,
    `npm run limits:set -- --project test|prod --user <email|uuid> --key
    <key> --value <n>|--default|--unlimited|--clear`, over the project's
    connection string from the environment (production needs a terminal),
    never in CI or the cloud, printing the before and after values. No
    admin UI. The limits are also
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

39. **Nightly backup and keep-alive** (owner, 2026-09-24). **Built in
    R1**: `.github/workflows/backup.yml`; the decision and its rejected
    alternatives are `docs/DECISIONS.md`, 2026-09-25, "Production is backed
    up nightly, encrypted to the owner's key, kept 30 days"; the runbook is
    `.claude/README.md`, "Backups and restore". Still owed here: from R7 the
    job also copies the `homebrew-art` objects. The production connection
    string it uses is shared with `migrate-prod` (decision 41).
40. **Edge Functions: one, in R8** (was R7; the R7 refresh of 2026-09-25
    moved it: no file exists before the bucket, so R7's cascade delete is
    complete). Orchestrator recommendation, discussed
    with the owner 2026-09-24. `delete-account`
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
    (owner, 2026-09-24). **Built in R1**: `migrate-test` in the `e2e` job
    and `migrate-prod` in `deploy` (`ci.yml`); the database's
    `supabase_migrations.schema_migrations` is the applied record,
    `applied.json` is gone and `edit-guard.mjs` locks every pushed
    migration. Decision and rejected alternatives: `docs/DECISIONS.md`,
    2026-09-25, "Migrations deploy from CI as steps of `e2e` and `deploy`;
    the database is the applied record"; procedure: `.claude/README.md`,
    "Supabase configuration". `config:push` stays the owner's.

R0 closeout record (2026-09-24): C1 production `config:diff` "drift: none
(4 not-owned)"; C2 `config:push --project test` pushed
`enable_manual_linking`, `minimum_password_length` and
`secure_password_change`; test `config:diff` afterwards "drift: none (4
not-owned)"; C3 no migration; C4 (Google Branding and Publish, device
install checks) follows the deploy. C1-C4 done (owner, 2026-09-24): Google
Branding set, consent screen published, support email
`daggerheart.loot@gmail.com`.

R1 closeout record (2026-09-25; branch `claude/compassionate-cannon-v13iq1`,
one commit per batch, squash-merged by the orchestrator):
- CI before the merge: run 36131497583 (`workflow_dispatch`, `57cf401`)
  green in every job - `audit`, `secrets`, `check`, `db`, `e2e`, `browser`
  1-4 (`browser (1)` 11:49:30-11:55:55Z, states cases 11 and 19 green on
  the first attempt); `deploy` skipped (not `main`). Run 36124766953
  (`06af055`): `migrate-test` 1 s, "Remote database is up to date".
- Migrations for production: `20260925120000_delete_account.sql`,
  `20260925120100_user_prefs.sql`,
  `20260925120200_user_prefs_service_role.sql`, all three already on the
  test project (owner's `db:push`, 2026-09-25). Production held no user
  table before, so no backup precedes the first `migrate-prod`.
- `E2E_USER_PASSWORD` deleted (owner, 2026-09-25).
- Config (orchestrator, 2026-09-25, before the merge): `config:diff` for
  test and prod - `drift: none`, 0 updates; 4 remote-only settings not
  declared in `config.toml` (`auth.sms.twilio.enabled`, pooler
  `default_pool_size`/`max_client_conn`, `storage.vector.enabled`). No
  `config:push`.
- Merge: `c65b845` on `main` (squash of the release branch onto
  `bc48e18`). Run 36135397358 (push): every job green; `migrate-prod`
  applied the three migrations above, log `Finished supabase db push.`;
  `deploy` green.
- First `backup.yml` run: 36136286588 (`workflow_dispatch`, `main`),
  `dump` 12:40:33-12:41:47Z (74 s), artifact `backup-2026-09-25`, 11109
  bytes, expires 2026-10-25.
- Data API and Security Advisor (orchestrator, owner's Chrome session,
  2026-09-25, linter rerun): "Automatically expose new tables" off on both
  projects; both show 2 of 2 schemas, 0 of 1 tables, 0 of 2 functions
  exposed (the dashboard's count; `user_prefs` and `delete_account()` are
  granted to `authenticated` only, and the hosted E2E reaches both).
  Production: 0 errors, 2 warnings - `delete_account()` SECURITY DEFINER
  executable by signed-in users (by design: it deletes only the caller,
  layer 3 pins it) and leaked password protection off (no password
  sign-in). Test: the same two plus `public.rls_auto_enable()` SECURITY
  DEFINER executable by anon and signed-in users - the function of the
  `ensure_rls` event trigger (Supabase's automatic RLS on new tables, on
  test only), not in the repository's migrations. The owner dropped both
  (2026-09-25) so that a migration missing `enable row level security`
  fails on test as it would on production.
- Pending, owner: the OAuth check of step 16 with R1's additions; the
  restore drill from `backup-2026-09-25` - runbook steps 1-5 and 7, never
  step 6 (production) - with the date and the row counts restored.

R2 closeout record (2026-09-26; one local commit on `main`, amended per
batch and at closeout, pushed once by the owner's approval; the pushed sha
is in the R2 closeout summary):
- Shipped: the test-migration fix (`migrate-test.mjs`, decision "CI
  applies the test project's migrations file by file and ignores other
  branches' versions"), the `production` Environment for
  `SUPABASE_DB_URL_PROD`, guard gaps in rule 2n, rule 2p and
  `edit-guard.mjs`; the lists schema with count limits
  (`limit_defaults`, `user_limit_overrides`, `effective_limit`,
  `limits:set`) and share links; account lists in the app with
  sign-in-only creation, save status and "edited N ago"; share links
  `#/s/<token>` (a new public contract) with the Share panel, the shared
  page, "Save a copy" and the `#/l/` announcement naming 2026-10-26.
- Owner change during the last batch: no rotate. A link is replaced by
  delete, then create; `rotate_list_share` left the unpushed migration and
  was dropped from the test project on 2026-09-26.
- Migrations for production (the first `migrate-prod` run in the
  Environment): `20260925130000_limits.sql`, `20260925130100_lists.sql`,
  `20260925130200_list_shares.sql`, `20260925130300_lists_service_role.sql`.
  The test project holds all four (`migrate-test: applied 4`, 2026-09-25).
- Environment steps 1-2 done 2026-09-25 (Environment `production`, id
  22753974407, branch policy `main`, no reviewers; its secret set).
- Gates on the task's commit before closeout: the orchestrator's
  foreground `rtk npm run check` passed and armed the gate (selftest
  812/0, vitest 1697/1697, coverage 97.99 / 91.8 / 98.75 / 98.72). The
  previous amend was made with `SKIP_CHECK_GATE=1`: its check passed but
  ran 10 min on a loaded host, past the 600 s tool cap, so the observer
  could not arm. `npm run check:db` 127 tests, `npm run e2e` PASS
  (contract 8 cases, flows F0-F8), goldens re-seeded in four shards, sweep
  clean at 360.
- Closeout amend: the last review's nits (a second «Сохранить себе» during
  the read-back made a second copy; focus kept in the Share panel row;
  a 43-character sample token in `routes.json`), kept defects D54-D59 in
  `docs/specs/DEBT.md`.
- Pending, owner, after the push: Environment step 3 (watch `migrate-prod`
  and `deploy`, dispatch `backup.yml` once) and step 4 (delete the
  repository secret `SUPABASE_DB_URL_PROD`), with run ids; the `e2e`
  job's `migrate-test` log reports none pending; the Security Advisor on
  production (its security definer warnings are by design: `effective_limit`,
  the entry and limit triggers, `reorder_list`, the share, read and clone
  RPCs); no `rotate_list_share` on
  production.

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

**Conflicts settled (owner decisions 24-26, 2026-09-24), as they stand
after R1.**

1. *Commit law and hosts.* A whole release (one task id) runs fully in the
   cloud or fully locally; batches never mix hosts within a release. The
   branch rule as first written here (amend on a task branch, push once,
   the owner fast-forwards `main`) is superseded: a cloud release pushes
   its session's branch after every green commit and the orchestrator
   squash-merges it (`docs/DECISIONS.md`, 2026-09-24, "A cloud release
   pushes after every green commit; the owner squash-merges it", amended
   2026-09-25; `.claude/README.md`, "Cloud sessions", branch rule; rule 2o).
2. *Goldens.* Cloud-OK, above.
3. *Secrets.* No production secret (database password, OAuth secrets,
   service keys) ever enters a cloud environment. The proxy API credential
   shape is superseded by `docs/DECISIONS.md`, 2026-09-24, "The hosted E2E
   reads its credentials from the environment; no proxy credential": the
   `E2E_*` names and `SUPABASE_DB_PASSWORD_TEST` are environment variables,
   the mint is `generateLink` then `verifyOtp`, and `tests/e2e/probe.mjs`
   refuses layer 4 where a header is rewritten. `E2E_USER_PASSWORD` is gone.
4. *Shared state.* A cloud session has its own tree and its own Docker, so
   the one-session-per-tree rule holds; the hosted test project is the one
   shared thing, serialised by the CI concurrency group and by the rule
   that a layer 4 run is one at a time (the owner does not run `npm run
   e2e` while a cloud release runs it).
5. *Owner and orchestrator steps at closeout.* Superseded by the two lists
   of `.claude/README.md`, "Cloud sessions" (`docs/DECISIONS.md`,
   2026-09-25, "The orchestrator merges a release branch onto `main`; the
   owner keeps the dashboard steps"). No `db:push` by the owner: CI applies
   migrations (decision 41).

**Per-release verdict.**

| Release | Verdict | Reason |
|---|---|---|
| R0 `persist-0-foundation` | local-only (shipped) | `B0.2` edited the hooks the session runs under and proved the Docker stack on this host |
| R1 `persist-1-auth` | shipped: `B1.1`-`B1.4` in the cloud, `B1.5`-`B1.6` on the owner's Windows host (the orchestrator's call; their gates are host-neutral) | layer 4 ran in the cloud once the proxy's authority was in `~/.pki/nssdb`; CI's `e2e` job is its verification of record |
| R2 `persist-2-lists`, R3 `persist-3-realtime`, R4 `persist-4-requests`, R5 `persist-5-migration`, R6 `persist-6-import-export`, R7 `persist-7-homebrew`, R8 `persist-8-media`, R9 `persist-9-item-share` | cloud-OK | layers 1-4 run in the VM (`.claude/README.md`, "Cloud sessions", layer rule); the owner's steps run locally before and after the merge |
| R10 `persist-10-legacy-removal` | cloud-OK | layers 1-2 only |
| owner steps (section 15) | local-only | dashboards, consoles, `config:push` |

The cloud tooling R0 wrote (`.claude/cloud-setup.sh`, `.claude/cloud-nss.sh`,
the `CLAUDE_CODE_REMOTE` branch of `session-start.mjs`, rule 2o) and its
measured facts live in `.claude/README.md`, "Cloud sessions".

## 17. Risks, assumptions, deferred

Carried from R0 (`persist-0-foundation`, closed 2026-09-24), outcome in
R1: the reversibility base (`db reset --local --version`), the additive
lint blind spots, the anon-`EXECUTE` and view invariants, rule 2n's
uncovered hosted writes (now an allowlist) and the 2l/2e pathspec and
`-a` gaps - all built in R1 (`.claude/README.md`, "Hooks" and "Supabase
configuration"; `docs/specs/COVERAGE.md`). Still open, the owner's: the
install prompt on Android and desktop Chrome with the registered worker,
and no navigation-preload warning on a device upgraded from the issue 69
worker. Named to the owner at R1's closeout and dropped from this plan:
`.impeccable/design.json`'s `file://` text, `AltPanel.svelte`'s "no
offline copy" comment, `clipboard.ts` `legacyCopy` (no R1 batch touched
them; any batch that touches those files takes them).

Carried from R1: the three items (the test-migration trap, the
`edit-guard.mjs` lock, rule 2n's gaps) were built in R2's first batch.

Carried from R2 (`persist-2-lists`, closed 2026-09-26) for the R5 planner
refresh, which places each one or names it to the owner:

- `legacy_fingerprint` and its unique index: deferred by R2 to R5's own
  migration (`B5.1`), which therefore also pays layer 3 `check:db`.
- `docs/specs/DEBT.md` D54: a `#/l/` link with more than 100 items saves
  an empty account list; R5's move of browser lists meets the same limit.
- R2 already removed «Восстановить из ссылки» and the install guide's iOS
  paragraph, and old `#/l/` "Save" already saves into the account; R5's
  refresh drops them from `B5.1`. Between R2 and R5 an iPhone reader
  cannot move a browser list from Safari into the installed app.
- Question f is answered (section 10): an R5 closeout step.
- `Intl.RelativeTimeFormat` output: the goldens hold Node's text
  («изменён 1 час назад», «3 дня назад», «в прошлом месяце»); if a CI
  Chrome build differs, pin the text per runtime in the test.

For the R3 (Realtime) planner: `docs/specs/DEBT.md` D55-D59 (a lapsed
session drops a write, a reorder refused after another device's edit, no
timeout on a hanging write, «Поделиться» before a queued create lands, a
failed first `#/s/` read not retried); R3's plan names D56 and D57.

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
- Risk: the hosted E2E needs the test project's schema current;
  `migrate-test` applies it before every `e2e` run (decision 41).
- Risk: Realtime Broadcast from the database (`realtime.send`) and the
  `private: true` channel with a `realtime.messages` policy for `anon` are
  planned from platform documentation, not measured here; `B3.1`'s
  `check:db` WebSocket cases and `B3.2`'s E2E flow are the proof, and the
  45 s poll is the fallback if the platform behaves otherwise (the R3
  plan, section 14, adds the `db reset` and CORS risks).
- Risk: `create_purchase_request` is the first RPC `anon` can write
  through; its bounds are inside the function and proven by the layer 3
  matrix (`B4.1`), and a valid share token is the only capability it
  accepts - a leaked GM link is the same exposure it already was, plus
  bounded requests the owner can decline and a rotate that ends it.
- Privacy impact of R4: a request stores the items, counts, link kind and
  time, and no name, account or address (answer 36); it expires after an
  hour and is deleted 24 hours after a decision or expiry, at the next
  send; the privacy page says so (`B4.2`).
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
  restock note field; a preferences page (**superseded 2026-09-26**: the
  owner asked for «Настройки отображения» in the account menu - a section
  of `#/account`, `B5.3`); a shop restock roll mode;
  homebrew import by pasting a stat block; a player wishlist on a shared
  list (issue 50 with a server); a recent-activity view on `#/account`;
  homebrew sets. Rejected outright: a duplicate-list button; a share-link
  open count.
