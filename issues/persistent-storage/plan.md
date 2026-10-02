# Plan - TASK persistent-storage (programme roadmap)

## Status

- Planning pass 1, 2026-09-24, planner; revised the same day after the
  owner answered decisions 1-13 (section 16). HEAD `12557fe1`, branch
  `claude/persistent-storage-plan-d74d73`.
- NEEDS_HUMAN_CONFIRMATION: no (decisions 1-41 answered, section 16).
- R0 `persist-0-foundation` closed 2026-09-24; R1 `persist-1-auth` closed
  2026-09-25; R2 `persist-2-lists` and R5 `persist-5-migration` closed
  2026-09-26; R5b `persist-5b-account-menu` closed 2026-09-27. Each task
  directory was retired in its closeout commit; the release records are
  section 16, "R1 closeout record", "R2 closeout record", "R5 closeout
  record" and "R5b closeout record". The process task `process-guards`
  and R11 `persist-usage-monitoring` closed 2026-09-27, R3
  `persist-3-realtime` closed 2026-09-27 and R4 `persist-4-requests` closed
  2026-09-28 and R6 `persist-6-import-export` closed 2026-09-30 (section 9,
section 16 "R6 closeout record"). R4b `persist-4b-requests-polish` closed
2026-09-30 (section 16, "R4b closeout record"). `limits-follow-overrides`
closed 2026-09-30 (section 16, "`limits-follow-overrides` closeout
record"). `e2e-import-slowdown` closed 2026-09-30 (section 16,
"`e2e-import-slowdown` closeout record"). Next: R7, rebased onto it.
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
  the requester sees only the send's toast, no request status (owner's
  feedback, 2026-09-27). The first anonymous write in the
  system, bounded by caps (section 5, R4 row). Shipped 2026-09-28 (section
  9); answers: section 16, items 32-38.
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
import bundle beyond what R7d defines; an owner-scoped private Realtime
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
| R3 | As shipped (2026-09-27; migration `20260927120000_realtime.sql` is the record): a deferred constraint trigger on `lists` sends one message per list per transaction with the final revision, privately, to `share:<topic_key>` of every active share and `{ list, revision, by }` to `owner:<uid>` (`by` from the `x-dhloot-tab` header); a revoke or a deleted list sends `{ revision: null }` to the share topic; `select` policies on `realtime.messages` for `share:<uuid>` (`anon`, `authenticated`) and `owner:<uid>` (`authenticated`), no `insert` policy (no client can send); `reorder_list` keeps the given order and puts the other entries after it. Decisions: the 2026-09-25 and 2026-09-26 Realtime files under `docs/decisions/` |
| R4 | As shipped (2026-09-28; migration `20260928120000_purchase_requests.sql` is the record): `purchase_requests` (a client-made id, the list and the share, the audience, `pending`, `applied` or `declined`, `created_at`, `expires_at` an hour on, `decided_at`; no name, no requester id; expired is read, never stored) and `purchase_request_lines` (item, quantity, the price when sent, the quantity applied); the owner selects both, no write grant; `limit_defaults` rows `request_lines` 100 and `pending_requests_per_list` 10; `create_purchase_request(id, token, lines)` for `anon` and `authenticated`, the only writer, with every bound inside it and a replay that inserts nothing; `apply_purchase_request(id, clamp)` and `decline_purchase_request(id)` for the owner; a trigger sends `request` with `{ list, by }` to `owner:<uid>` only. Decisions: the purchase-request files under `docs/decisions/` |
| R6 | As shipped (2026-09-30; migration `20260928130000_import_lists.sql` is the record): `import_lists(p_lists jsonb) returns integer`, `security invoker` (decision file 2 amended) for `authenticated`, create-only with client-made ids (`on conflict (id) do nothing`, another owner's row is hidden by RLS and refused as a conflict), one transaction - the table checks and the limit triggers unwind the whole call; `entries` capped at 5000 per call (22023); `source` and `snapshot` pass through for R7's bundle v2. No table change. Decisions: the R6 files under `docs/decisions/` |
| R7 | As built (2026-10-01; migration `20260930130000_homebrew.sql` and its reversal are the record): two tables - `homebrew_books` {id, owner_id default `auth.uid()`, key `^hb_[a-z2-7]{16}$`, content {en?, ru?, sections?}, revision, timestamps, unique (owner_id, key)} and `homebrew_items` {..., book_id null fk on delete set null, content = the catalog shape's R7 subset, validated by `homebrew_content_valid`}; limits `homebrew_books_per_owner` 20, `homebrew_items_per_owner` 100; `my_limit(key)`; owner-only RLS, `service_role` select and delete; pin, limit, touch (item, book), before-delete and `homebrew` broadcast (`{ by }` on `owner:<uid>`, one per owner per transaction) triggers; `homebrew_snapshot_of(key, content, book)`; `list_entries`: R2's check replaced by two, the bound widened to 32768, a `list_entries_reference_exists` trigger; `get_shared_list` and `clone_shared_list` re-created. Decisions: the 2026-09-30 homebrew files under `docs/decisions/` |
| R7b | No schema change |
| R7c | `homebrew_cards` (sets and rule cards) with `homebrew_cards_per_owner` 100; `homebrew_content_valid`, `homebrew_snapshot_valid` and `homebrew_snapshot_of` replaced (relations, the snapshot's cards); the `list_entries` bound decided (shipped in R7c; the design as built is in `docs/specs/` and `docs/decisions/`) |
| R7d | `import_homebrew(p_books, p_cards, p_items, p_update)`, security invoker, per-call ceilings, skip or update, a held source's sections merged |
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
| `FEATURES.md` "Account lists" (the Requests panel, "Notify the owner", no requester status, apply and decline, the index line, flow b, the limits), `STATE.md` (`prefs.notifyGm` and its Display settings row are R5b's, owner 2026-09-26; R4 rewords the row as a select, owner 2026-09-27), `META.md` section 3 (the first anonymous write), `I18N.md`, `pages/src/privacy.html` and `en/` (a request stores items, counts, link kind and time - no name, account or address; expires in 1 hour; deleted 24 hours after a decision or expiry, at the next send), `pages/src/terms.html` and `en/` (a request is not an order), `COVERAGE.md` | `B4.2` |
| `STATE.md` cutoff and the two-tab merge section; `FEATURES.md` migration banner, `#/l/` retired-link page, local list controls after the cutoff; `META.md` section 3 final text and section 9 install guide; `llms.txt` and `CONTRACTS.md` section 3 gain the retirement date; `pages/src/install.html` and `en/` iOS paragraph | `B5.1` |
| `CONTRACTS.md` section 4 (`schema/import-v1.json`), `llms.txt` import section | `B6.1` |
| `ROUTES.md`, `CONTRACTS.md` sections 1 and 2 (`#/homebrew`, `#/homebrew/new`, `#/homebrew/<key>`, the reserved `hb_` prefix), `routes.json`, `tests/contracts.js`, `llms.txt` | `B7.2` |
| The same set for the `homebrew` table (`#/tables/homebrew`, groups `kind`, `src`, `sect`) | `B7b.1` |
| The catalog `craft` as a list: `data.json`, `catalog.csv`'s `crafts_into`, `CONTRACTS.md` section 4, `README.md`, `llms.txt`, `tests/contracts.js` | `B7c.1` |
| `CONTRACTS.md` section 4 (`schema/homebrew-v1.json`, `schema/import-v2.json`, the zip's `homebrew.json`), `llms.txt` two sections, `tests/derived.js` pins | `B7d.1` |
| `B7.3` and `B7c.2`-`B7c.4` change no public contract | - |
| Same set: `#/h/`, `#/print/list/`, `#/print/s/` | `B9.1` |
| `CONTRACTS.md` section 3 deleted (a history line remains), `ROUTES.md` `#/l/` rows, `docs/fixtures/lists/*.json` deleted, `tests/contracts.js` list-encoding half, `docs/fixtures/urls/routes.json` (`#/l/` -> the not-found page, address kept; `#/lists` tab `null`), `llms.txt` list-link section, `STATE.md`, `FEATURES.md`, `COVERAGE.md` rows | `B10.1` |

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
| R5 | `persist-5-migration` | `B5.1`, `B5.2a`-`B5.2d` - **closed 2026-09-26**, live at the push of `main` | **Moved directly after R2 (owner, 2026-09-25)** so that `LEGACY_WRITE_UNTIL` = 2026-10-26 is reachable (section 10). Shipped: the automatic move of browser lists into the account at sign-in (`move_legacy_list`, one RPC per list, a read-back, `dhloot.migrated.v1` with the first account's id, the one-time notice, `held` for a mismatch, read-only while the move is due); the cutoff `LEGACY_WRITE_UNTIL` with read-only browser lists after it; the retired `#/l/` page and its announcement; the account write buffer (2 s quiet window, early flushes, a `keepalive` close) sent as one `apply_list_writes` request per flush. Migrations `20260925130400` (the column, the index, the exempted limit triggers, `move_legacy_list`), `20260925130500` (its `40001` conflict path), `20260925130600` (`apply_list_writes`). Must be live on production by 2026-10-12, else the date moves |
| R5b | `persist-5b-account-menu` (owner, 2026-09-26: its own release) | `B5b.1` - **closed 2026-09-27**, live at the push of `main` (section 16, "R5b closeout record") | Right after R5, live by 2026-10-19 (before the 2026-10-26 cutoff): the header's account menu («Аккаунт», «Мои списки», «Выйти»; «Мои предметы» joins in R7), the Display section of `#/account` (the five synced settings and R4's `notifyGm` choice), the Lists tab gone from the cutoff (`#/lists` stays a route), and (owner, 2026-09-27) a banner under the header for a signed-out reader with browser lists: sign in before the date, or the app stops showing them |
| - | `process-guards` (owner, 2026-09-26: a process task; Q1 answered A, gate credit, owner 2026-09-27) | `B1`, `B2` - **closed 2026-09-27**. Shipped: the six rules as hooks and scripts (gate credit, the local stack lock, the `.env` guards, the plan review before an implementer dispatch, the reviewer's report-only writes, a test-project migration push after an approving review) and seven decision files under `docs/decisions/` | Right after R5b, before R11: a plan review before the first implement batch when a plan adds a schema change or a SECURITY DEFINER function, changes a public contract, can lose data, or adds a write or sync protocol; a reviewer writes its full report to `issues/<id>/reviews/<batch>.md` (its Write tool limited to that path, enforced by a guard); a host-wide heavy-run lock across sessions, or gate credit for a backgrounded run by its exit code; `tests/db/run.mjs` takes and releases the local stack lock (`%TEMP%\dhloot-local-stack.lock`, 45-minute staleness, the holder's task id) itself; `bash-guard.mjs` denies `.`, `source` and `cat` on `.env*`; a schema batch runs `db:push` to the test project only after its review approves. Each rule was held by hand through R5 |
| R11 | `persist-usage-monitoring` | `B11.1` - **closed 2026-09-27**, live at the push of `main` (commit "feat(persist): report production's free-plan usage nightly"). Shipped: `usage.yml`, `tools/supabase/usage-lib.mjs` and `usage.mjs`, the `usage_snapshots` migration, the `tests/derived.js` pins and three decision files under `docs/decisions/`. The owner's setup steps 1-9 are open (section 15, step 18a) | **Placed after R5 (owner request 2026-09-25, "after r2"; planner 2026-09-25), and after R5b from 2026-09-26**: a nightly `usage.yml` report of production's free-plan usage - database and Storage size, rows per table, an MAU estimate, request counts, users near their count limits - with a forecast, a summary every night, a failed run (GitHub's email) near a limit, the `usage_snapshots` history table and the keep-alive Data API call. The design as built: `.claude/README.md`, "Usage monitoring" |
| - | `display-settings` (owner, 2026-09-27: answers Q1-Q3 A) | `B1` - **closed 2026-09-27**, live at the push of `main`. Shipped: page switches for the tables view and print layout last until a reload, `KeepNote.svelte` links `#/account`, the Display lead line; decision `docs/decisions/2026-09-27-display-defaults-are-set-in-the-account-a-page-switch-lasts-a-visit.md` | **After R11, before R3**: the Display section of `#/account` becomes the one source of defaults - a print layout or tables view picked on its page lasts until a reload, with a note linking `#/account`; the language and the starting-section pin stay saved settings; one page, no tabs |
| R3 | `persist-3-realtime` | `B3.0`-`B3.2` - **closed 2026-09-27**, live at the push of `main` (commit "feat(persist): update shared pages and the owner's lists live"). The owner's steps: "Allow public access" off on both projects, read back each release; confirm a share page updates live on a phone | Live updates on shared pages and (owner's Q1) on the owner's own devices; Realtime is the primary path and the poll runs while it is down (owner, 2026-09-25) |
| R4 | `persist-4-requests` | `B4.1`, `B4.2` - **closed 2026-09-28**, live at the push of `main` (commit "feat(persist): send and answer purchase requests on share links"). The owner's steps: send a request from a phone on a player link and apply it on a desktop; read the privacy page and the reworded Display row in both languages | Purchase requests from a shared list to its owner: anonymous «Сообщить владельцу», the signed-in add that asks to notify (`notifyGm`, the Display row «Добавление из чужого списка» as a select), the owner's Requests panel with apply, «Принять доступное» and decline, the index card line (no requester status: owner's feedback, 2026-09-27) |
| R4b | `persist-4b-requests-polish` | `B4b.1` - **closed 2026-09-30**, live at the push of `main` (commits "feat(persist): keep the selection after a purchase request and fix roll tabs", the budget, `npm audit fix` and closeout commits). The owner's steps: send a request on a phone and see the ticks stay; use «Мин»/«Макс» on a phone; «Скрыть» the decided requests | The owner's requests feedback: the selection kept after a send with «Запрос отправлен», «Мин»/«Макс» joined to the take count, the decided fold with its items and «Скрыть», request clean-up confirmed (no change); the roll-tab bug (owner, 2026-09-29) |
| R6 | `persist-6-import-export` | `B6.1`, `B6.2` - **closed 2026-09-30**, live at the push of `main` (commits "feat(persist): export and import account lists as a published JSON bundle" and the closeout commit after it). The owner's steps: export a list and import it back on a phone; read `llms.txt` and the hint on the import field | JSON export (all, ticked, one list; the data zip) and create-only import of `schema/import-v1.json`; batch selection and deletion on the index; `llms.txt` lets an AI assistant write an import file and read an export alone (owner, 2026-09-27) |
| - | `limits-follow-overrides` (owner, 2026-09-30: Q1 A, Q2 B, Q3 keep) | `B1` - **closed 2026-09-30** (commit "feat(persist): let the import file bounds follow a raised limit"). The owner's steps: none beyond CI green | An override lifts its limit on every path; `import_lists()` takes 1000 lists per call and `import-v1` widens in place to 1000 lists and 5000 entries per list; the ceilings of one call are in `FEATURES.md`, "Limits" |
| - | `e2e-import-slowdown` (owner, 2026-09-30: Q1 A, Q2 A; case L's 5 MB import logged, not asserted) | `B1` - **closed 2026-09-30** (commit "fix(persist): run the list entry triggers once per statement"). The owner's steps: CI green; decide the compute size | The list entry touch and limit triggers run once per statement, so an import is linear in its rows; migration `20260930121000`; a list's revision grows by one per statement |
| R7 | `persist-7-homebrew` | `B7.1`-`B7.3` (planned 2026-09-28, amended 2026-09-30 by planning passes 3-5; built and green 2026-10-01, closed at its closeout push) | Own homebrew items with sources and sections, the editor, `#/homebrew*` and `#/i/<key>` from the account menu's «Мои предметы», live references in the owner's lists, frozen copies on shared pages and in copies, print, the quick item «+ Свой предмет» |
| R7b | `persist-7b-homebrew-catalog` | `B7b.1` (shipped; the design is in `docs/specs/FEATURES.md`) | The homebrew table, own equipment in the equipment tables, one merged search, the chip |
| R7c | `persist-7c-homebrew-relations` | `B7c.1`-`B7c.4` - **closed 2026-10-01** (commit "feat(homebrew): relate own items to the catalog and to each other"; the design as built is in `docs/specs/` and `docs/decisions/`) | The catalog craft as a list, cards, upgrade lines, craft links, sets, relations on catalog cards |
| - | `scale-challenge` (owner, 2026-10-01; working id, no directory yet) | to plan | **After R7c, before R7e** (run in parallel with R7c's last batch, owner 2026-10-01): a read-only challenge of every persistence surface at its limits and at override values (sources 20 with 30 sections each, 100 items, 100 cards, lists and entries at the default and at the import ceilings of 1000 lists and 5000 entries, requests, shares, frozen copies at the 131072-byte bound) on 360 px and desktop: what becomes overloaded, slow or unusable, and the smallest fix in the app's patterns. Its output is findings for the owner to place; each chosen item becomes its own task, a line in a later release, or a `DEBT.md` entry. Its planner decides the shape and cost |
| R7e | `persist-7e-list-quick-item` (owner, 2026-10-01) | `B7e.1` (`issues/persist-7e-list-quick-item/plan.md` is the authority) | **closed 2026-10-02** (`37707817`, pushed). **After R7c, before R7f**: «+ Свой предмет» as a row after a list's last entry with the panel there, and «Изменить» on the success toast (a new tab; the toast held 7000 ms and paused on hover and focus) |
| R7f | `persist-7f-consistency` (owner, 2026-10-01) | `B7f.1`, `B7f.2` - **closed 2026-10-02** (`cb731458`, pushed) | **After R7e, before R7d**: the consistency audit's findings 1-9, 11, 12, 14, 15 on the signed-in pages - counters with their limits (a lists counter included), one failure wording, one delete-confirm ending, the menu's «Списки», one create toast, source and section delete toasts, one load-state component, the editor's heading while loading, one create verb, the undo spec line, «Закрыть»/«Отмена», RU/EN parity |
| R7g | `persist-7g-read-scale` (owner, 2026-10-01, from `scale-challenge` F1, F2, F6) | `B7g.1` - **closed 2026-10-02** (commit "feat(persist): re-read only changed lists and cap a list's frozen copies"; the design as built is in `docs/specs/` and `docs/decisions/`) | **After R7f, before R7d**: a re-read fetches only the lists whose revision moved; ordered lists reads and the pending requests read in keyset pages past PostgREST's 1000-row cap; `get_shared_list(text, bigint)` answers `unchanged` for a known revision; a per-list frozen-copy limit of 1048576 bytes (overridable). F6 (one op over `ids[]`) dropped by the owner |
| R7d | `persist-7d-homebrew-files` | `B7d.1`, `B7d.2` - **closed 2026-10-02** (commit "feat(persist): carry homebrew items by file and move them in one call"; the design as built is in `docs/specs/` and `docs/decisions/`) | homebrew-v1, import-v2, llms.txt with a blind round, import and export, homebrew.json in the zip; bulk moves between sources; the import and export code ships as a lazy chunk like `zip`, and the import report filters skips once (`scale-challenge` F10; owner, 2026-10-01) |
| R7h | `persist-7h-homebrew-page` (owner, 2026-10-02) | to plan | **After R7d, before R9**: the «Мои предметы» search from the eighth item and the counter at the head of the rows (rule 1 amended), `#/homebrew` measured at 300 items (paging only if slow), the «Карты» search (`DEBT.md` D84's line), the «?» help removed from «Ранг» and «Урон» (rule 15 gains: a hint explains the site, never a basic game term), and the «Хоумбрю» chip out of `#/search`'s kind row as the labelled switch «Свои предметы», also in the equipment tables. Split from R7d so the import and export go live after `B7d.2` |
| R9 | `persist-9-item-share` | `B9.1` | `#/h/<token>`, add and clone, print routes for cloud lists |
| R8 | `persist-8-media` | `B8.1` | Homebrew art; ships after R9 (owner, 2026-10-02), so it also brings art to R9's surfaces |
| - | `debt-cleanup` (owner, 2026-10-01; working id, no directory yet) | to plan | **After R8, before `persist-review`**: a generic clean-up release that takes every `docs/specs/DEBT.md` entry still open then (D64, D66 and D90, the `check:db` fail-fast, included; R10 keeps only what its removal deletes: D24, D62, D63 and `MoveNotice`'s half of D64). Its planner decides the batches |
| - | `persist-review` (owner, 2026-09-27; working id, no directory yet; scoped to persistence by the owner, 2026-09-27) | to plan | **After R8 and `debt-cleanup`, before R10** (owner: "one of the latest releases before clean up"): a review of the persistence feature and its code only - the cloud lists, shares, Realtime, requests, import and export, homebrew, the database, its functions and policies, the ports and the account pages - for code, security, functionality, UX, accessibility and performance, and a brainstorm of what could be added or done differently there. It also runs a UI consistency pass over the persistence surfaces (counters and limits, page heads, load, empty and error states, toasts, confirms, button verbs, selection bars, RU/EN parity), after R7f has shipped, with `FEATURES.md` "Consistency rules" (rules 1-16) and `DEBT.md` D74-D80 as the baseline (the audit itself is in git history: `git show 6a23e462:issues/persist-7f-consistency/consistency-audit.md`): it checks the rules R7f set and finds new drift (owner, 2026-10-01). It also re-runs the scale challenge of `scale-challenge` against every surface shipped since (owner, 2026-10-01). Its output is findings and ideas for the owner to choose from; each chosen item becomes its own task or a `DEBT.md` entry. Its planner decides the review's shape and cost |
| R10 | `persist-10-legacy-removal` | `B10.1`-`B10.4` (planned 2026-10-01; `issues/persist-10-legacy-removal/plan.md` is the authority) | The first release after the cutoff date (owner, 2026-09-27; `docs/DECISIONS.md`, "R10 removes browser lists and the move; an old `#/l/` link is not found"): browser lists and all move support go - the codec, its fixtures and contract text, the `#/l/` list page and the retired page (an old `#/l/` link draws the not-found page, the address kept: a contract change), `ListStore`'s browser lists, `LegacyMove`, `MoveNotice`, `MoveStatus`, `StorageNotice`, the move's RPC path; its plan decides whether a migration drops `move_legacy_list` and `lists.legacy_fingerprint` (`DEBT.md` D62, D63). The browser's data is not deleted |

The order is R0, R1, R2, R5, R5b (closed 2026-09-27), the process task
`process-guards`, R11, `display-settings`, R3, R4, R6, R7, R7b, R7c (closed 2026-10-01), `scale-challenge`, R7e, R7f, R7g, task 63 (intelligent search, not a persistence release; owner, 2026-10-02), R7d, R7h, R9, R8, `debt-cleanup`,
`persist-review`, R10 (owner, 2026-09-25; `persist-review` placed before R10 by the owner, 2026-09-27;
`debt-cleanup` placed before `persist-review` by the owner, 2026-10-01;
R9 placed before R8 by the owner, 2026-10-02 (R9 needs nothing of R8);
R7h placed after R7d and before R9 by the owner, 2026-10-02;
`docs/DECISIONS.md`, "`LEGACY_WRITE_UNTIL` is 2026-10-26"; R11 placed after
R5 so R5's 2026-10-12 deadline keeps priority; R5b split from R5 by the
owner, 2026-09-26; the process task placed after R5b by the owner,
2026-09-26; R7 split into R7-R7d by the owner's answer to the R7 plan's
Q6, 2026-09-30, `docs/decisions/2026-09-30-homebrew-ships-in-four-releases.md`; R7e and R7f
placed after R7c and before R7d by the owner, 2026-10-01). R10 is the
first release dispatched after the cutoff date; R3, R4, R5b, R6-R9 (R7b-R7f included) and R11 may
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
  as `STATE.md` already requires. From R10 the app stops knowing about
  browser lists: it never reads, draws or moves them, and deletes nothing
  (owner, 2026-09-27; `docs/DECISIONS.md`, "R10 removes browser lists and
  the move; an old `#/l/` link is not found"; supersedes the move past R10
  for a reader who never signed in). Before the date R5b's banner asks a
  signed-out reader with browser lists to sign in, on every page.
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
  `ROUTES.md` rows; from R10 `#/l/` draws the app's not-found page, the
  address kept, never the retired page and never the home fallback (owner,
  2026-09-27, replacing the `legacyList` route kind that reached the
  retired page); R10's contract batch sets the `#/l/` rows of
  `docs/fixtures/urls/routes.json` to that. `#/print/<id>*<n>` keeps its
  spelling: it is print grammar, not the list link.

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
| `B11.1` | R11, closed 2026-09-27: the `usage_snapshots` migration, `tools/supabase/usage-lib.mjs` and `usage.mjs`, `.github/workflows/usage.yml`, the `tests/derived.js` pins (section 9's R11 row). The design as built is in `.claude/README.md` ("Usage monitoring"), `docs/specs/COVERAGE.md` and `docs/decisions/`; the batch brief is in R11's commit history | - | - | - | - |
| `B3.0`-`B3.2` | R3, closed 2026-09-27: the contract's reorder case made tolerant (`B3.0`), the broadcast triggers and `realtime.messages` policies with `check:db` WebSocket cases (`B3.1`), `EventsPort`, the live feed with the poll only while down, the owner topic on every route, the 20 s write timeout and the share page's hidden status (`B3.2`). The design as built is in `docs/specs/`, `docs/decisions/` and `.claude/README.md`; the batch briefs are in R3's commit history | - | - | - | - |
| `B4.1`-`B4.2` | R4, closed 2026-09-28: the purchase-request tables, functions, limit rows and owner-topic trigger with their layer 3 cases (`B4.1`); the port and the fake with contract case K, the send and flow b, the owner's panel and the index line, the Display row as a select, the privacy and terms text, states cases 54-57 and F12 (`B4.2`). The design as built is in `docs/specs/`, `docs/decisions/` and `.claude/README.md`; the batch briefs are in R4's commit history | - | - | - | - |
| `B4b.1` | R4b, closed 2026-09-30: `RequestSender`'s sent mark and the kept selection, the shared page's prune of ticks, `PickQty`'s joined «Мин» - count - «Макс», the decided fold's items and «Скрыть», `RollPanel` keyed on its section; states case 55 rewritten and two new goldens. The design as built is in `docs/specs/` and `docs/decisions/`; the batch brief is in R4b's commit history | - | - | - | - |
| `B5.1`-`B5.2d` | R5, closed 2026-09-26: the move RPC and its conflict path, the batching RPC `apply_list_writes`, the write buffer with the batching client, the automatic move with the cutoff and the retired `#/l/` page (section 9's R5 row). The design as built is in `docs/specs/`, `docs/decisions/` and `.claude/README.md`; the batch briefs are in R5's commit history | - | - | - | - |
| `B5b.1` | R5b, closed 2026-09-27: the account menu, the Display section of `#/account`, the Lists tab gone after the date, the signed-out move banner (section 9's R5b row). The design as built is in `docs/specs/`, `docs/decisions/` and `.claude/README.md`; the batch brief is in R5b's commit history | - | - | - | - |
| `B1`-`B2` | `process-guards`, closed 2026-09-27: host guards (gate credit, the local stack lock, the `.env` guards) and review gates (the plan review, the reviewer's report file, a migration push after an approving review). The design as built is in `.claude/README.md`, the prompts and `docs/decisions/`; the batch briefs are in the task's commit history | - | - | - | - |
| `B6.1`-`B6.2` | R6, closed 2026-09-30: `schema/import-v1.json`, `docs/fixtures/import/`, the `llms.txt` section, `lib/bundle.ts`, `import_lists` and its layer 3 cases, contract case L (`B6.1`); `BatchBar`, the index's selection with «Скачать JSON (N)» and «Удалить (N)», `ImportPanel`, `lib/zip.ts` and the account's data zip, «Скачать JSON» on a list page, states 58-62 and F13 (`B6.2`). The design as built is in `docs/specs/`, `docs/decisions/` and `.claude/README.md`; the batch briefs are in R6's commit history | - | - | - | - |
| `B7.1` | R7 schema (section 5, R7 row), ports and pure logic: `lib/homebrew.ts`, `HomebrewRepository`, the real adapter and the fake with its seed, contract case M, `tests/db/homebrew.test.mjs`, the usage report's items lines | `COVERAGE.md`, `CONTRACTS.md` fixtures note | layer 1 `check`, layer 3 `check:db`; after the approve `db:push --project test`, layer 4 E2E (~22 min) | required (a migration with SECURITY DEFINER functions) | a commit boundary the harness cannot reach: `B7.2`'s states need this seed, fake port and migration |
| `B7.2` | The store, the derived `AppState.index`, the leave guard, `#/homebrew` with sources and sections, the editor with its failure states, `#/i/<key>` with «Изменить», the labels, the routes contract, `DEBT.md` D69, F14 | section 6 (`B7.2` row); `FEATURES.md`, `STATE.md`, `I18N.md`, `META.md`, privacy | layer 1 `check` x2, `check:built`, `app/states`, `app/contracts`, goldens, `sweep 360`, E2E (~56 min) | required: public contract, new write protocol | a public-contract change (the routes and the `hb_` prefix) |
| `B7.3` | Homebrew in lists: the entry resolver, an exact undo, frozen copies on list, share, index, requests and print pages, the quick item «+ Свой предмет», `DEBT.md` D70, F15 | `FEATURES.md`, `STATE.md`, `COVERAGE.md`, privacy | layer 1 `check` x2, goldens and re-seed, `check:built`, `app/print,app/states`, `app/contracts`, `sweep 360`, E2E (~62 min) | required: a new write path into `list_entries` | a different route and filter set from `B7.2`, and a review not held in one pass |
| `B7b.1` | The `homebrew` table, its group chip, facets `kind`, `src`, `sect`, own equipment in the equipment tables, dynamic `src`, the «Хоумбрю» chip, one merged search with the intro counter (shipped; `docs/specs/FEATURES.md`, "Tables and search") | section 6 (`B7b.1` row); `FEATURES.md` | layer 1 `check` x2, `check:built`, `app/states`, `app/contracts`, goldens compare then re-seed, `sweep 360` (~65 min) | required: public contract (a table id) | new release (R7b), a different route and filter set |
| `B7c.1`-`B7c.4` | R7c, closed 2026-10-01: the catalog `craft` as a list of ids (`B7c.1`), `homebrew_cards`, the relation validators, the snapshot's cards and the `list_entries` bound of 131072 bytes (`B7c.2`), the editor's «Связи», `ItemPicker`, the «Источники» and «Карты» folds (`B7c.3`), relations on catalog cards and rows with «(HB)» and the «HB» rung label (`B7c.4`). The design as built is in `docs/specs/`, `docs/decisions/` and `.claude/README.md`; the batch briefs are in R7c's commit history | - | - | - | - |
| `B7d.1` | `import_homebrew`, `lib/homebrewFile.ts`, `lib/bundle.ts` v2, the two schemas and fixtures, `llms.txt` both sections with a blind round, the port and the fake | section 6 (`B7d.1` row) | layer 1 `check`, layer 3 `check:db`, `check:built`, the blind round; after the approve push, E2E (~34 min) | required: a migration, two public schemas | new release (R7d); the schema batch rule |
| `B7d.2` | The import panel with the «Куда» mapping and skip or update, the download surfaces, `homebrew.json` in the zip, the account hint and the privacy merge steps (`DEBT.md` D69 closed) | `FEATURES.md`, `META.md`, `COVERAGE.md`, privacy | layer 1 `check` x2, `check:built`, `app/states`, `app/contracts`, goldens, E2E (~47 min) | required: new UI | a commit boundary the harness cannot reach without `B7d.1` |
| `B8.1` | Art: decode, square crop, 640 and 160 WebP, upload to the owner folder, `art_url`, rows and cards draw it, replace and remove; layer 2 states: a homebrew row and card with seeded art | `FEATURES.md` | layer 1 `check`, `check:built`, layer 2 `app/states`, goldens, layer 4 E2E (~20 min) | required: UI | new release (R8) |
| `B9.1` | `#/h/<token>` (subscribes to its topic as `B3.1` does), add to list and clone, print routes `#/print/list/<id>` and `#/print/s/<token>` with homebrew cards; layer 2 states: `#/h/` signed out and as `gm2`, both print routes | section 6 row 21 | layer 1 `check` x2, `check:built`, layer 2 filter group, `app/print`, goldens, layer 4 E2E (~27 min) | required: public contract | new release (R9); a public-contract change |
| `B10.1`-`B10.4` | After the cutoff date (planned 2026-10-01, `issues/persist-10-legacy-removal/plan.md` sections 8-12): retire `#/l/` (the not-found page, the address kept), port the list test fixtures to account lists, remove browser lists and the move, the migration that drops `move_legacy_list` | section 6 row 22 | about 161 min for the four batches | required: public contract, a migration | new release (R10), gated on the date |

Total gate cost, one green pass per batch, idle host: about 13 hours
(R7-R7d's ten batches are about 410 minutes by the 2026-09-27 figures - R7
140, R7b 65, R7c 121, R7d 81 - plus four closeouts, against the 70 minutes
this table held for R7 before its refresh),
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

`B3.0`-`B3.2`: shipped in R3 (section 9). Their outlines were superseded by
the release's own plan; the code, the specs and `docs/decisions/` are the
record. Free-plan limits (200 peak connections, 2 million messages a month)
stay a monthly owner check (section 15, step 18); the nightly usage report
carries the Realtime row count of the last 24 hours.

`B11.1` (R11) closed 2026-09-27; the design as built is `.claude/README.md`,
"Usage monitoring". Billed egress, MAU and Realtime connections have no
public API (2026-09-25) and stay the dashboard's.

`B4.1`-`B4.2`: shipped in R4 (section 9). Their outlines were superseded by
the release's own plan; the code, the specs and `docs/decisions/` are the
record.

`B5.1`-`B5.2d`: shipped in R5 (section 9). The code, the specs and
`docs/decisions/` are the record. `B5b.1`: shipped in R5b (section 9);
the same holds.

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
11. Bundle v2 (R7d, `import-v2`) bumps `version`, widens `source` and adds the
homebrew snapshot; the RPC's signature holds.

`B7.1`-`B7.3` (R7, built 2026-10-01; the design as built is in `docs/specs/`
and the 2026-09-30 homebrew decisions under `docs/decisions/`) and
`B7b.1`-`B7d.2` (R7b-R7d; the design as built is in `docs/specs/` and
`docs/decisions/`; R7d's is `issues/persist-7d-homebrew-files/plan.md`): the
record is the whole catalog shape plus `craft_from`, with `craft` and
`craft_from` as lists and a `section`; sources with sections and cards are
rows; own records join `byId` (R7), `searchable`, `allEquip` and a
`homebrew` table (R7b), the relation derivations (R7c); frozen copies join
`byId` alone; «(HB)» marks homebrew, and a homebrew rung on a ladder carries
an «HB» label; the snapshot embeds the source and, from R7c, the cards; the
editor keeps its save button with a guard; a list page makes a plain item
in one press; files in R7d.

`B8.1`: `art_url` as an additive column with a URL-shape CHECK;
`toRecord` maps it to `Record_.img` as an absolute URL, `artSrc` passes an
absolute `img` through and derives the 160 px name by R8's own rule;
`homebrew_snapshot_of`, `snapshotOf` and a new `homebrew_snapshot_valid`
carry `img`; a replaced picture whose URL a frozen copy still names is
answered by the broken-art fallback, so files may be deleted freely (a
reference always draws the current picture); the editor's card
preview reserves the picture slot; decision 40's `delete-account` Edge
Function ships here with the bucket (nothing to delete before R8). R8
ships after R9 (owner, 2026-10-02), so `B8.1` also carries `img` to R9's
surfaces: `#/h/<token>`, the frozen copy that `add_shared_homebrew_to_list`
writes, the print routes, and R9's goldens; and `B8.1` decides what a clone
does with the original owner's picture (copy the file or name it). The
uploader offers the line's picture or another own item's picture; a file is
deleted only when no own item names it.
Acceptance line placed by R11 on `B8.1`: the usage report's Storage row
reads the `homebrew-art` bucket - after the E2E upload, the test project's
report shows a non-zero `storage_bytes`.

`B9.1`: section 5's R9 row; `#/h/<token>` draws `RecordCard` over
`toRecord()` of the projection and subscribes to `share:<topic_key>` as
`B3.1` does; `add_shared_homebrew_to_list` writes a frozen copy; a clone
is the cloner's own item (a new row, a new key, a reference in the
cloner's lists), and «Сделать своим» from a frozen list row is R9's
call; `#/print/list/<id>` and `#/print/s/<token>` load entries, resolve
them through `withRecords(index, none, snapshots)` (a reference from the
owner's items, a frozen row from itself) and reuse `PrintPage`, retiring
`DEBT.md` D70 (a homebrew entry of another account's list does not print
from its address). The projection carries the snapshot's book and cards;
relations to the author's other items travel as frozen names or are
dropped; a clone drops or clones the chain.

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
config, R1, R2, R3, R4, R5, R6, R7, R8):

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

18a. For R11, after its push: the owner setup steps 1-9 of
    `.claude/README.md`, "Usage monitoring" - confirm `migrate-prod`, the
    scoped usage token, the secret `SUPABASE_USAGE_TOKEN_PROD` in the
    Environment `production`, the failed-run email setting, the token's
    expiry reminder, one dispatch of `usage.yml`, the Log Query look the
    next day, the Security Advisor re-run (3 info), and the forecast after
    seven nights.
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
    two intermediate values the same day). **The homebrew item default is
    100** (owner, the R7 plan's Q3, 2026-09-30), with two more keys:
    `homebrew_books_per_owner` 20 (R7) and `homebrew_cards_per_owner` 100
    (R7c). **Amended by the owner
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

R5 closeout record (2026-09-26; one local commit on `main`, amended per
batch and at closeout, pushed once by the owner's approval, "proceed with
all release"):
- Pushed sha: `d679d285`. CI run of the push: 36272330997, success; the
  five `browser` shard jobs took 368, 384, 394, 353 and 356 s (four shards
  took up to 383 s, so the fifth did not shorten the slowest - a fixed
  per-shard cost, for the process task); `migrate-prod` 21:22:36-21:22:53Z
  applied `20260925130400`, `20260925130500`, `20260925130600` before
  `deploy`.
- Security Advisor, linter rerun on both projects after `migrate-prod`
  (orchestrator, owner's Chrome session, 2026-09-26): 0 errors, 9 warnings,
  2 info, the same on test and production. SECURITY DEFINER executable by
  signed-in users: `clone_shared_list`, `create_list_share`,
  `delete_account`, `get_shared_list`, `move_legacy_list` (new in R5, by
  design; `DEBT.md` D62), `reorder_list`, `revoke_list_share`; by anon:
  `get_shared_list` (the anonymous shared page); leaked password protection
  off (no password sign-in). `apply_list_writes` (invoker) adds none.
  Production Data API: 2 of 2 schemas, new tables not exposed
  automatically, max rows 1000.
- Organisation usage 2026-09-18 to 2026-10-18: Log Query 129.07 of 100 GB
  ("upcoming", enforced from 2027), data only on 2026-09-25/26 (about 114
  GB a day); everything else under 10 %. Cause unknown; the owner: worth a
  light look, maybe a Supabase metering defect - R11's planner answers
  which tool reads logs (Management API, CLI, Studio). Answered at R11: no
  repository tool reads hosted logs, so the scans came from outside the
  repository (most likely dashboard pages; not provable); the owner reads
  the per-day figures on the organisation's usage page.
- Shipped: section 9's R5 row. Batches `B5.1` (the column, the index, the
  exempted limit triggers, `move_legacy_list`), `B5.2a` (its `40001`
  conflict path), `B5.2b` (`apply_list_writes`), `B5.2c` (the write buffer
  with the batching client; `DEBT.md` D54, D55 and D58 paid), `B5.2d` (the
  move, the cutoff, the retired page, the fifth CI `browser` shard); each
  reviewed once and remediated once where the review asked. The three
  migrations were on the test project before the push (each after its
  review approved).
- Owner decisions during the release (2026-09-26): the move is automatic
  with two guards (the notice, the first account only); browser lists are
  read-only while the move is due; the write buffer with a batching RPC
  (Q1 option C); the bundle budget 150 kB unconfigured and 200 kB
  configured; F10 proves that edits made before a close land, and the
  `keepalive` flag is proven by unit tests (`COVERAGE.md`, known gap);
  the limit bypass of the move accepted (`DEBT.md` D62).
- Gates on the closeout amend: `rtk npm run check` (the R5 closeout
  summary has the result). The gates before it: `check` 396-404 s,
  vitest 63 files, 1946 tests; `check:db` 216 tests (403 s, `B5.2b`'s fix
  pass); `npm run e2e` PASS (contract A-I, F0-F10; the 1300-entry move
  304-354 ms); goldens re-seeded in four shards (181 states); sweep clean
  at 360; `check:built` 121.0 kB of 150 kB; the configured build 178.2 kB
  of 200 kB.
- Kept defects written at closeout: `DEBT.md` D62 moved under the legacy
  removal; D63 (the move's status says «нет связи» for any failure).
- Pending, owner: the Data API look and the Security Advisor rerun on
  production (expect one more SECURITY DEFINER warning, `move_legacy_list`,
  by design; `apply_list_writes` is `security invoker` and adds none); the
  device check (section 10, question f): sign in on a desktop browser and
  a phone that hold real browser lists, watch them move and the notice
  name them, confirm them in «Ваш аккаунт» on the other device and the
  browser group empty; type a note on an account list on the phone and
  switch apps at once, then confirm it on the desktop; on the desktop type
  a note and a new name and close the tab within two seconds, then confirm
  both on the phone. A defect moves the date (section 10). The 2026-10-12
  checkpoint: R5 live and the device check clean, or the date moves. The
  owner's decision on rotating the test database password (the R5
  closeout summary names why).

R5b closeout record (2026-09-27; one local commit on `main`, amended per
batch, fix pass and closeout, pushed once):
- Pushed sha: `d0acbe13`. CI run of the push: 36284549476, success; the
  five `browser` shard jobs took 395, 397, 384, 347 and 354 s;
  `migrate-prod` 01:14:19-01:14:34Z applied nothing, then `deploy`.
- Shipped: section 9's R5b row. One batch `B5b.1`: the header's account
  menu («Аккаунт», «Мои списки», «Выйти»), the Display section of
  `#/account` (language, starting section, tables view, print layout and
  compact sheet, `notifyGm` in the account row only), nine tabs from the
  cutoff in a build with sign-in, and the signed-out move banner. No
  migration, no route or contract change. Reviewed once
  (fix-then-continue): the one blocker - the «Таблицы» option stored a
  bare `#/tables` against `STATE.md` - and six local nits fixed in the
  one fix cycle; the eighth finding kept as `DEBT.md` D64.
- Owner decisions during the release (2026-09-26/27): the first menu item
  is «Аккаунт», not «Настройки отображения»; `notifyGm` lives in the
  Display section; the move banner, its copy, and «Скрыть» in memory until
  the next page load (`docs/decisions/`, "A signed-out reader with
  browser lists sees a move banner until the cutoff"); R10 removes browser
  lists and the move, and an old `#/l/` link draws the not-found page.
- Gates: `B5b.1` - `npm run check` (vitest 64 files, 1984 tests),
  goldens re-seeded in four shards (63 files: 61 changed, 2 new; 183
  states), the whole layer 2 pool in five local shards (405-532 s each),
  `check:built` 125.0 kB of 150 kB, the configured build 182.2 kB of
  200 kB, `npm run e2e` PASS (contract 9 cases, F0-F10). Fix pass -
  `npm run check` (1988 tests), `app/states` 254 s, goldens compared
  unchanged in four shards, `check:built` passed. Closeout amend: `npm run
  check` and `node tests/derived.js` (the R5b closeout summary has the
  results).
- Kept defects written at closeout: `DEBT.md` D64 (focus falls to `body`
  after «Выйти» in the menu or «Скрыть»/«Скрыть напоминание» in
  `MoveNotice`), in its own section with no owning release yet.
- Pending, owner, after the push: CI (`check`, five `browser` shards,
  `db`, `e2e`, `deploy`) green; the menu, the Display section and the
  banner on production; the release live before 2026-10-19. Named to the
  owner: which release owns D64 (recommended R7); `process-guards` Q1
  (answered A, gate credit, 2026-09-27).

R6 closeout record (2026-09-30; two local commits on `main`: the release commit `885d2978`, then the closeout commit after the foreign `14e6dcf9`, owner's decision 2026-09-29; pushed once):
- Pushed sha: see the closeout summary. `B6.1` was pushed to the test
  project and approved before `B6.2`; `npm run e2e` green (contract case L
  2504 ms and 2446 ms for 5 461 091 bytes; F0-F13).
- Shipped: section 9's R6 row. Two batches: the published contract and
  `import_lists` (`B6.1`), then the UI (`B6.2`): selection and batch
  deletion on the index, the import field with its grouped report, the three
  export surfaces and the data zip. No route change; one migration.
  `B6.2` was reviewed once (approve): the one risk (the import toggle
  stayed enabled during the call) and six local nits fixed in the closeout
  commit.
- Owner decisions during the release (2026-09-27): selection on the index
  and batch deletion (`docs/decisions/`); duplicate names allowed on import;
  the account's data download is a zip; `llms.txt` drops the `#/l/` link
  guidance; Q6, the frozen bounds equal the default limits.
- Gates: `npm run check` (74 files, 2394 tests), `check:built`, `app/states`,
  the print/contracts/typo/hues/stub group, goldens re-seeded in four
  shards (26 changed, 6 new), `sweep.js 360` clean in both languages,
  `npm run e2e`, `check:db` for `B6.1`.
- Kept defects written at closeout: `DEBT.md` D66 (focus falls to `body`
  after a batch delete), in D64's section.
- Named, dropped: `B6.1-N6` (the `or` chain in `import_lists`, only with
  another edit of that migration); `plan-B6.1-23` (`zlib.crc32` in
  `tests/contracts.js` needs Node 22.2 while `engines` says `>=22`;
  `.nvmrc` pins 24). `B6.1-N7` moved to R7's context.
- Pending, owner, after the push: CI green; an export imported back on a
  phone; the file input on a phone browser.

R4b closeout record (2026-09-30; four local commits on `main` after `a6503c49`: `ec573cd8` the release, `61e3a229` the configured budget raised to 210 kB, `ae3f812b` `npm audit fix` for undici, then the closeout commit; pushed once):
- Shipped: section 9's R4b row, one batch. No route, contract or schema
  change. Reviewed once (approve); nits N1-N4 fixed in the closeout commit.
- Owner decisions during the release: the mock review waived (2026-09-29);
  the ends joined to the count, then named «Мин»/«Макс» (2026-09-30); the
  configured bundle budget 210 kB (2026-09-30, after CI run 36638258244
  failed at 202.1 kB and a lazy `ImportPanel` measured 204.1 kB).
- Gates: `npm run check` (2405 tests), `check:built`, `app/states`, goldens
  re-seeded in four shards (6 changed, 2 new), `sweep.js 360` and `1180`
  clean, `npm run e2e`, `npm run budget` 203.0 kB of 210 kB, `npm audit
  --audit-level=high` clean.
- Named to the owner: `B4b.1-N5` (every `timed` golden shows the Russian
  toast in its EN section), fixed by `toast-follows-language` before the
  push; the heading «Запросы (0)» while only decided requests remain (kept
  as shipped; «Скрыть» removes it); `git stash@{0}` holds the rejected lazy
  `ImportPanel` attempt, which the hook would not let an agent drop.
- Pending, owner, after the push: CI green; the steps in section 9's R4b
  row.

`limits-follow-overrides` closeout record (2026-09-30; one local commit on `main` after `7005abeb`; pushed once):
- Shipped: the audit of every fixed number that caps a limit key; migration
  `20260930120000_import_lists_ceiling` (50 to 1000 lists per call);
  `import-v1` widened in place; the ceilings named in `FEATURES.md`,
  "Limits"; decision "`import-v1` bounds are the import call's ceilings,
  not the default limits". Plan reviewed twice, batch reviewed once
  (approve); nits fixed in the one commit.
- Evidence: the local ratio of 1000x5 to 50x100, 1.88 and 2.04, gives a
  hosted estimate of 4701 and 5118 ms, under the 6000 ms rule.
- Gates: `npm run check`, `check:db` (twice), `check:built`, the
  `#/account` goldens (unchanged), `db:push --project test`, `npm run e2e`
  (import of 50 lists of 100 entries: 3131 ms).
- Kept defects written at closeout: `DEBT.md` D67 (`limitOther` to a
  requester), D68 (the fake takes more than 5000 entries in one op).
- Named, dropped: a hosted timing of 1000 lists; an export warning on the
  total rows and the 5 MiB file; the Realtime quota of 1000 messages in one
  commit; a `limits:set` warning past a ceiling of one call.
- Pending, owner, after the push: CI green (the `db` job asserts the ratio
  under 3.2; rerun once and keep the bound if a shared runner fails it).

`e2e-import-slowdown` closeout record (2026-09-30; one commit built in a worktree from `86aaa41c`, pushed once as a fast-forward):
- Cause: the row triggers made an import quadratic in the entries per list
  (50x100: 2.3-3.5 s of server time); the test project is a swapping Nano
  host. Nothing accumulates across e2e runs; the timeout is 8 s.
- Shipped: migration `20260930121000_list_entries_statement_triggers` (five
  statement triggers with transition tables); decision "The list_entries
  touch and limit triggers run once per statement" (amends the
  import-bounds decision); `FEATURES.md` "Limits", `COVERAGE.md` case L and
  layer 3, `.claude/README.md` "Measure the test project". Plan reviewed
  twice, batch reviewed once (approve); nits fixed in the one commit.
- Evidence: applied probe 50x100 323-446 ms, 1000x5 1659 ms plus 377 ms,
  100x100 813 ms; e2e case L 50x100 1001-2039 ms over five runs; the 5 MB
  file 2313-8748 ms (two runs over 6000 ms), 363 ms against 5061 ms of
  server time a minute apart while the host swapped.
- Owner decision after step 10: case L logs the 5 MB import's time and
  asserts only its success; the 50x100 case keeps `IMPORT_MS` 6000.
- Gates: `npm run check` and `check:db` (twice each), `db:push --project
  test`, the probe, five e2e runs (the last green).
- Named, dropped: case J's missed owner message (2026-09-30, run
  36721185871, attempt 1); the transition tables' temp-file spill (seen on
  the notes-heavy insert, 692 blocks); the Nano host swapping; about 3.5 MB
  of empty `list_entries` index pages on the test project; the dashboard's
  disk IO budget (Q3).
- Pending, owner: CI green; the compute size of the test and production
  projects (a larger add-on would steady the 5 MB case; not bought).

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

Carried from R2 (`persist-2-lists`, closed 2026-09-26), all placed by R5:
`legacy_fingerprint` shipped in `B5.1`; D54 paid by the atomic create of
`apply_list_writes`; the restore field and the iOS paragraph were already
gone; question f is R5's owner device check (section 16, "R5 closeout
record"). Still open: `Intl.RelativeTimeFormat` output - the goldens hold
Node's text («изменён 1 час назад», «3 дня назад», «в прошлом месяце»); if
a CI Chrome build differs, pin the text per runtime in the test.

R3 paid D56, D57 and D59 (closed 2026-09-27); R5 paid D55 and D58.

Carried from R5 (`persist-5-migration`, closed 2026-09-26) for later
releases; each planner refresh places its items or names them to the
owner:

- R3: placed and shipped (closed 2026-09-27).
- R6 and R7: `ListRepository` is now `newId`, `list`, `apply`, `move`; the
  seven write methods (`create`, `addEntries`, `reorder` and the others)
  are gone. R6's `import` is its own RPC beside `apply`, and
  `CloudLists.import` then `load()` calls `flushNow()` first. R7 adds a
  homebrew reference through `CloudLists.add` or an `add` op
  (`apply_list_writes` takes `source` and `snapshot`); a homebrew delete's
  re-read waits for the buffer. R4's owner-feed re-read waits for the
  buffer, as R3's does.
- R10: `DEBT.md` D24, D61, D62, D63; the codec, `mergeLists`, `ListStore`'s
  browser lists, the browser group, `StorageNotice`, `LegacyMove`,
  `MoveNotice` (with R5b's banner), `MoveStatus`, the move's RPC path, the
  retired page (`#/l/` draws the not-found page), the pinned test clock
  and `?today=`, the `tab` of `#/lists` in `routes.json` set to `null`; a
  planned decision on dropping `move_legacy_list` and
  `lists.legacy_fingerprint` by a migration (owner, 2026-09-27;
  `docs/DECISIONS.md`, "R10 removes browser lists and the move; an old
  `#/l/` link is not found").
- Not planned (ideas): a per-list move; a "not now" for the move.

Carried from R5b (`persist-5b-account-menu`, closed 2026-09-27):

- R4: placed and shipped (closed 2026-09-28): flow b reads
  `app.notifyGm` and writes `app.setNotifyGm`.
- R7: «Мои предметы» joins the account menu between «Мои списки» and
  «Выйти» (`AccountMenu.svelte`).
- R10: the move banner goes with `MoveNotice`; the `tab` of `#/lists` in
  `routes.json` set to `null` (already in the R10 item above).
- Answered 2026-10-01 (owner): `DEBT.md` D64 and D66 go to `debt-cleanup`
  (section 9), with every other entry still open then; R10 removes only
  `MoveNotice`'s half of D64.

Carried from `process-guards` (closed 2026-09-27):

- Every plan made ahead (R11, R3, R4, R6, R7) writes its `Plan review:`
  line at its refresh, or `agent-guard.mjs` denies its implementer.
- Each schema batch (`B11.1`, `B3.1`, `B4.1`, `B6.1`, `B7.1`, `B7.3`)
  moves its test-project push and `npm run e2e` after the approving
  review (`orchestrate.prompt.md`, "Schema batches"); R7's `B7.1` step 12
  ("the owner's `db:push --project test` in a local release") becomes
  the agent's push after the approve.
- R11's `B11.1` is the first live use of the plan review and the
  migration-push gate (done at R11: both held).

Carried from R4 (`persist-4-requests`, closed 2026-09-28) for later
releases:

- R6: purchase requests are not exported or imported; its plan decides
  whether the bundle says so.
- R7: a request line stores the `item_key` only, so a homebrew entry's line
  whose entry is gone has no name to draw; R7 decides whether lines keep
  the snapshot's name.
- R11's report counts both request tables by itself; no near-limit row
  exists for the two new limits (the owner's call).

Carried from R11 (`persist-usage-monitoring`, closed 2026-09-27):

- The owner: setup steps 1-9 (section 15, step 18a); the first dispatch's
  summary shows the Storage branch production takes and whether the
  keep-alive is reached.
- R3's `B3.1` and R8's `B8.1` carry their usage-report acceptance lines
  (section 14).
- A release that renames `get_shared_list(p_token)` updates `keepAlive` in
  `tools/supabase/usage-lib.mjs` in the same commit.
- `usage.yml`'s schedule, like `backup.yml`'s, stops after 60 days without
  a push; after the programme that is the owner's calendar.

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
- Fact (R3, 2026-09-27): Realtime Broadcast from the database and an
  `anon` join of a private channel are proven by `check:db`'s WebSocket
  cases and the hosted E2E; the 45 s poll stays the fallback while
  Realtime is down.
- Accepted (R4, shipped 2026-09-28): `create_purchase_request` is the
  first function `anon` writes through; a leaked link costs at most 5
  requests a minute and 10 pending on its list, which the owner declines or
  ends with «Удалить ссылку»; a request a stopped link already sent stays
  pending until it expires. The privacy page says what a request stores.
- Risk: a `#/l/` link pasted before the cutoff and opened after it is dead
  by the owner's decision; the retired-link page and the `llms.txt`
  announcement are the whole mitigation.
- Risk: the fake cloud drifts from the real adapter; `cloud.contract.ts`
  runs the same assertions against both (layer 1 and layer 4), and the
  seed is the only place fixtures live.
- Risk: applying account preferences after the session resolves can switch
  the language a moment after first paint on a new device; accepted, the
  local key is written back so it happens once per device.
- Deferred: CSP meta policy; homebrew Trash; an owner-scoped Realtime
  topic; brand verification. Homebrew import updates held keys when the GM
  chooses (R7d).
- Not in v1 (owner, 2026-09-24, from the brainstorm): list templates; a
  restock note field; a preferences page (**superseded 2026-09-26**: the
  owner asked for «Настройки отображения» in the account menu - a section
  of `#/account`, `B5b.1`); a shop restock roll mode;
  homebrew import by pasting a stat block; a player wishlist on a shared
  list (issue 50 with a server); a recent-activity view on `#/account`.
  Homebrew sets are in R7c. Rejected outright: a duplicate-list button; a share-link
  open count.
