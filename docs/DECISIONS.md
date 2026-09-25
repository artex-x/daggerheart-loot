# Decisions

The register of decisions that outlive the task that made them, each with
the alternatives rejected and the reason. Behaviour decisions live in
`docs/specs/`; hook and tooling decisions in `.claude/README.md`,
"Candidates considered"; everything else lands here. Newest first. An entry
is superseded in place with a `Superseded by` line, never deleted; an entry
is at most fifteen lines; a superseded entry folds to its first line.

Within one task, entries run in the order the task settled them, oldest
first. The fifteen-line cap counts body lines only - the `##` heading and
the blank lines around it are free. Past ~400 lines, fold every superseded
entry to its first line before adding another.

## 2026-09-24 - A cloud release pushes after every green commit; the owner squash-merges it

- Task: `persist-1-auth` (owner confirmation, 2026-09-24, cloud session 2).
- Decision: a cloud session pushes its branch after every green commit (a
  reclaimed container loses what is not pushed) and never amends a pushed
  commit, so a cloud release is a branch of one commit per batch and a
  remediation after a push is its own commit. At closeout the owner
  cherry-picks any tooling commit the release carries on its own first, then
  squash-merges the branch onto `main` as the release's one commit (`git
  merge --squash`, authored `artex-x`), pushes `main` and deletes the
  branch. A local release still amends and pushes once. Rule 2o already
  allows exactly these pushes; no guard changes. Amended 2026-09-25: the
  orchestrator merges (entry of that date).
- Rejected: amend plus `--force-with-lease` (the law forbids every force
  shape); one push at closeout (a release longer than one session loses a
  batch); pushing "at session end" (no signal precedes an idle reclaim); N
  commits on `main` (a deploy's undo stops being one revert); the UI merge
  button (a merge commit); a fast-forward (`main` moves under bot commits).

## 2026-09-24 - The hosted E2E reads its credentials from the environment; no proxy credential

- Task: `persist-1-auth` (owner confirmation, 2026-09-24, cloud session 2).
- Decision: the harness reads `E2E_SUPABASE_URL`,
  `E2E_SUPABASE_PUBLISHABLE_KEY`, `E2E_SUPABASE_SECRET_KEY` and
  `E2E_USER_EMAIL` from the process environment on every host (CI secrets,
  `--env-file .env.test.local` locally, the cloud environment's variables).
  The mint stays `generateLink` then `verifyOtp`, creating the user when
  absent. The probe discriminates: `GET /auth/v1/user` with the publishable
  key and no `Authorization` must answer 401 `no_authorization`, from Node
  and from a Puppeteer page, and one carrying `Bearer a.b.c` must be refused
  for that token. The test project's secret key is model-visible; it opens
  the test project only.
- Rejected: a proxy API credential (measured to replace every
  `Authorization` header and not to grant admin); anonymous sign-ins (no
  identity to test `#/account` with); layer 4 in CI only on `main`;
  `signInWithPassword` (a second credential shape for one user); a CI-side
  session mint handed to the cloud (a session token in transit for no gain).

## 2026-09-24 - The account client loads after first paint; a provider redirect settles before mount

- Task: `persist-1-auth` (planner, 2026-09-24; the unconfigured build: owner).
- Decision: `ports/supabase.ts` alone imports `@supabase/supabase-js`, as a
  lazy chunk behind a synchronous `CloudPort` wrapper, so a configured app
  mounts as fast as an unconfigured one. `main.ts` reads `?auth-callback=1`
  before mount, restores the route saved in `sessionStorage` (10 minutes)
  and strips the code and error parameters; the exchange and its outcome
  (`redirectResult()`) resolve after mount: a refused link and a cancelled
  consent arrive on the redirect back. With no configuration the branch is
  a dead literal: no chunk, no account control, `#/account` is not found.
- Rejected: mounting after the chunk loads (every reader waits); a static
  import (the entry carries the client for anonymous readers); supabase-js's
  `detectSessionInUrl` (races the router); a "sign-in unavailable" page
  (owner); loading the chunk only for a reader with a stored session or a
  pending redirect (considered 2026-09-25: it saves a download after first
  paint, not paint, and would read supabase-js's private storage key names).

## 2026-09-24 - Account preferences drop the default money mode; the print layout persists for everyone

- Task: `persist-1-auth` (owner answers of this date to the preferences
  mock's questions 1 and 2).
- Decision: the account preferences are the language, the starting
  section, the tables view and the print layout; "a default money mode for
  new lists" is removed from the release (money mode stays per list). The
  print layout (colour or black-and-white, standard or compact sheet) leaves
  session memory and is kept in `dhloot.prefs.v1` beside the tables view
  for every reader, signed in or not; the account copies it like the rest.
- Rejected: the last money mode picked on an own list as the default (a
  rule nobody sees being applied); a new money-mode control (a new control
  and its mock for one setting); persisting the print layout only for a
  signed-in reader (two behaviours for one control).

## 2026-09-25 - The hosted E2E runs `cloud.contract.ts` under Node's own type stripping

- Task: `persist-1-auth` (planner, 2026-09-25).
- Decision: `tests/e2e/` imports the app's TypeScript ports
  (`cloud.contract.ts`, `supabase.ts`) straight into Node 24, which strips
  erasable types. `tests/e2e/ts-hooks.mjs`, loaded by `--import`, maps a
  `.js` import inside a `.ts` file to its `.ts` sibling and loads `.ts` as
  a module; `tsconfig.json` sets `erasableSyntaxOnly`, so typecheck refuses
  what Node could not strip. Measured 2026-09-25: the contract over the
  fake passes this way, with no warning and no new dependency.
- Rejected: `vite-node` and `esbuild` (neither is in the tree since vitest
  4 and vite 8's rolldown); `tsx` (a dependency for one directory); a
  vitest project for layer 4 (network inside the unit runner's config and
  coverage); bundling with rolldown first (a build step and a temporary
  file per run).

## 2026-09-25 - A blocker fix pass also carries the batch's local nits

- Task: `persist-1-auth` (the human's request of this date).
- Decision: on a fix-then-continue review, the one remediation pass carries
  the blockers and every nit that is cheap, local and safe inside the paths
  the batch touched, mid-plan as well as on the terminal batch. A nit that
  needs a redesign, a public-contract change, a new spec or work outside
  those paths still goes to Deferred or a later batch. An approve with only
  nits mid-plan still spends no cycle. Gates do not move: a nit fix that
  breaks one is reverted and reported.
- Rejected: always deferring nits mid-plan - the fix pass's dispatch and
  gates are already paid, a nit in the same paths adds almost nothing to
  them, and a deferred one costs a pass later (`365952c` ran `npm run check`
  over the same `tests/e2e/` and CI paths as three nits it left behind).

## 2026-09-25 - Commit author and attribution are set in `.claude/settings.json`

- Task: `persist-1-auth` (the human's request of this date).
- Decision: `.claude/settings.json` sets `attribution` empty (no trailer,
  no pull request footer) and `env` with the git author and committer
  `artex-x <artex-x@users.noreply.github.com>`; `CLAUDE.md` keeps only
  "Use Conventional Commits". The `bash-guard.mjs` rule that denies an AI
  attribution trailer stays, as the backstop for a session or host that
  does not load these settings. Settings apply from the next session start.
- Rejected: the author sentence in `CLAUDE.md` (a rule each agent had to
  remember while the harness asked for a trailer, which cost blocked commit
  attempts); retiring the trailer rule (nothing else would catch a trailer
  from a host that ignores the settings); a `git config` step in the cloud
  setup script (one host only, and outside the repository's review).

## 2026-09-25 - Migrations deploy from CI as steps of `e2e` and `deploy`; the database is the applied record

- Task: `persist-1-auth` (owner, 2026-09-24; the shape: planner, 2026-09-25).
- Decision: the `e2e` job first runs `supabase db push --db-url` against
  the test project, and `deploy` runs it against production before its
  build - on a push to `main` or the owner's `skip_e2e` dispatch, which
  refuses when production lacks a migration (`pending-check.mjs`). Both
  connection strings are repository secrets, no Environment. The applied
  record is the database's `supabase_migrations.schema_migrations`:
  `applied.json` and `applied-check.mjs` are gone; `edit-guard.mjs` locks a
  migration that any remote-tracking ref holds (a pushed commit is never
  amended; CI applies what is pushed). `config:push` stays the owner's,
  `db:push` a manual path that records nothing.
- Rejected: separate `migrate-*` jobs (more job-level `if:`s on `deploy`'s
  needs, a second concurrency group for one database); an approval
  Environment (the backup is the recovery); a committed history snapshot
  (drifts as `applied.json` did); "every migration in HEAD" as the lock.

## 2026-09-25 - Production is backed up nightly, encrypted to the owner's key, kept 30 days

- Task: `persist-1-auth` (owner, 2026-09-24: `auth` rows, `17 3 * * *` UTC).
- Decision: `backup.yml` runs nightly and on dispatch: `supabase db dump`
  of the schema and of the `auth` and `public` data (`--schema auth,public`;
  the CLI excludes `auth` by default) with the production connection
  string, each file `age`-encrypted to the `BACKUP_AGE_RECIPIENT` variable
  and uploaded as a 30-day artifact; nothing unencrypted leaves the job,
  which fails closed without a recipient. The private key stays in the
  owner's password manager. The run is production's free-tier keep-alive.
  The privacy page says a backup keeps deleted data at most 30 days. The
  runbook (`.claude/README.md`, "Backups and restore") restores into the
  local stack, then the test project, then production.
- Rejected: a monthly manual dump (nobody remembers a schedule); an
  unencrypted artifact (a public repository's artifacts are public); roles
  in the dump (a new project has its own); a backup before the first
  production migration (production held no user table).

## 2026-09-25 - Agents may write to the test project; production is CI's or the owner's

- Task: `persist-1-auth` (owner, 2026-09-25).
- Decision: `bash-guard.mjs` rule 2n allows a `db`, `migration` or
  `config push` command whose target is provably the test project (a
  `--project-ref` equal to the test ref, a `--db-url` that carries it, or
  a wrapper with `--project test`) and denies production, `--linked` and
  every target the command does not name; `link`, `login`, `secrets`,
  `functions deploy` and `storage` stay denied. `npm run db:push --
  --project test --yes` runs without a terminal and reads the password
  from `SUPABASE_DB_PASSWORD_TEST` (a cloud variable, test only);
  `--project prod` keeps the typed `yes`, the fallback behind `migrate-prod`.
  No production secret enters a cloud environment.
- Rejected: "agents never write to a hosted project" as written (the
  owner's words supersede it); `--linked` as proof of the target (state
  outside the command); a `--yes` for production (the pipeline or a typed
  yes there, by the owner's words).

## 2026-09-25 - The orchestrator merges a release branch onto `main`; the owner keeps the dashboard steps

- Task: `persist-1-auth` (owner, 2026-09-25).
- Decision: at a release's closeout the orchestrator, on a host where the
  push rule allows it, squash-merges the release branch onto `main` as the
  release's one commit (question A's shape; the rebase fallback if the
  squash refuses; never a merge commit, never a force-push), pushes `main`,
  watches the run that deploys and deletes the branch; the agents also
  compact the programme roadmap in the closeout commit. The owner keeps
  what needs a terminal with secrets or a dashboard: `config:push`, the
  Security Advisor, the Data API check, the manual OAuth check, the restore
  drill's private key. Amends the 2026-09-24 entry "A cloud release pushes
  after every green commit; the owner squash-merges it": the merge is the
  orchestrator's now; the rest of that entry stands.
- Rejected: the owner merging (a manual step the pipeline does not need);
  the claude.ai/code merge button (a merge commit).

## 2026-09-24 - The laws of no backend and of `file://` are superseded

- Task: `persist-0-foundation` (owner decisions of this date).
- Decision: three `CLAUDE.md` laws are replaced. "Project shape": "It runs
  from `file://` too." - the app is served over HTTP only. "Architecture
  boundaries": "Preserve relative asset paths and the classic-script data
  adapter required by `file://`; do not use runtime `fetch()` for local
  data." - both stay, for caching and a synchronous boot. "Product laws":
  "Lists live in the URL hash and localStorage; add no backend or upload
  service." - a Supabase backend holds accounts, cloud lists and homebrew,
  and no other server is added. The replacement text, as this date's
  entries settle it, is `docs/specs/META.md` sections 3, 4 and 9 and
  `CONTRACTS.md` sections 4-5.
- Rejected: keeping the laws with a list of exceptions - every persistence
  batch would open with a law conflict.

## 2026-09-24 - The guards judge PowerShell tool commands as well as Bash

- Task: `persist-0-foundation`.
- Context: on this Windows host Docker answers only the PowerShell tool, so
  the Supabase work runs there; `settings.json` guarded the Bash tool only,
  so a PowerShell `git commit`, `git reset --hard` or `supabase db reset
  --linked` passed every guard, and the new gates were bypassable.
- Decision: `bash-guard.mjs` and `check-observer.mjs` register for
  `Bash|PowerShell`. A PowerShell command is normalised (each backtick and
  the character after it become a space, `\` becomes `/`) and runs through
  the same rule families. The observer arms `check:db` from either tool and
  `npm run check` from Bash only.
- Rejected: denying `git` from PowerShell (blocks legitimate reads and still
  leaves `supabase` and `rm` unguarded); leaving PowerShell unguarded.
- Consequences: the normalisation is a habit guard, not a parser;
  `Remove-Item` and other cmdlets are not judged.

## 2026-09-24 - Running from a folder and offline use are nice-to-haves

- Task: `persistent-storage`; worker revised in `persist-0-foundation`.
- Decision: direct `file://` execution ends (the IIFE build,
  `tools/smoke-file-url.mjs` and the from-a-folder address branch go;
  `base: './'` and the classic `data.js` stay) and offline use is retired.
  `sw.js` stays registered, for installability: cache first for same-origin
  `img/`, `img/thumb/` (issue 69's caps and revalidation) and hashed
  `assets/` (immutable, capped at 30); navigations, `data.js`, the manifest,
  `pages/`, other origins and an `auth-callback` URL pass to the network;
  activate deletes every other `dhloot-*` cache (`META.md` section 9).
- Rejected: the offline shell with Supabase bypass rules - a
  shell answered while `?code=` is in the URL is an Auth defect class, and
  hashed names need a precache list kept in step; a worker that unregisters
  itself - no worker puts the install prompt at risk; no caches - 1272
  pictures refetched past `max-age`; an absolute Pages base.

## 2026-09-24 - The persistence programme ships one task per release

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: every deployable sub-feature of the persistence work (auth,
  lists, Realtime, migration, import/export, homebrew, media, item share,
  legacy removal) is its own task, `persist-<n>-<name>`, under the standing
  law unchanged: first batch commits, later batches amend, closeout deletes
  the task directory and pushes once; the push to `main` deploys. The
  programme roadmap stays a task document of `persistent-storage` until the
  last release ships. Migrations are pushed by the owner from the CLI before the
  release push.
- Rejected: one task with one commit per phase and owner-called pushes -
  lawful, but one directory and one growing commit message for months; one
  task per batch - a batch is not a deployable feature; a CI job with
  production database credentials and a protected environment - a new
  class of secret and failure for a personal tool.

## 2026-09-24 - `data.js` in git is the only catalog authority

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: official records never enter the database. A cloud list entry
  stores the official `item_key` (the stable record id) and the client
  resolves it against the in-memory index built from `data.js`, as today;
  a stored fallback name renders a retired id. `catalog.csv`, `data.json`
  and `llms.txt` on Pages stay the machine-readable surface.
- Rejected: the design's manifest -> PostgreSQL -> generated artefacts
  chain with `items`, `catalog_state`, `catalog_releases`, a versioned
  Pages snapshot and an async `CatalogSnapshotPort` - two authorities for
  1272 records the database never queries, and a loading state on every
  official screen; public Edge catalog endpoints - the static files already
  serve LLMs and cost nothing to run.

## 2026-09-24 - Realtime ships in v1, directly after lists, over polling

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: the lists release ships player and GM share pages that refetch
  on focus and every 45 s; the next release adds Supabase Realtime
  Broadcast from a database trigger (`realtime.send` on
  `share:<topic_key>`, payload `{ revision }`) and keeps the poll as the
  fallback. Topics are random and unguessable; a forged message can only
  cause a refetch. The owner's own devices are not subscribed in v1.
- Rejected: deferring Realtime past v1 (the planner's recommendation) - the
  owner values live shared pages above the saved surface; bundling it
  into the lists release - a release is smaller and safer without it; an
  owner-scoped private topic now - refetch on focus covers two devices.

## 2026-09-24 - The `#/l/` link decoder retires at the legacy write cutoff

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: content-bearing `#/l/<payload>` links stop decoding on the
  same date local lists become read-only (`LEGACY_WRITE_UNTIL`, set 30 or
  more days after the migration release is live). Cloud lists never write
  one. From that date `#/l/` draws a retired-link page and the link buttons
  and link import vanish from local lists; a local list's only structured
  export is migration into an account, beside copy text and print. The
  codec, its fixtures, `tests/contracts.js`'s encoding half and the
  `llms.txt` section are removed by a release dispatched after the date;
  `#/l/` keeps a route kind so the page is reached, never the home fallback.
- Rejected: keeping the decoder read-only for good (the planner's
  recommendation; small and pure, every pasted link kept opening) - the
  owner prefers one list model and one link format; a second, later date -
  two announcements for one change.

## 2026-09-24 - Only a signed-in user creates a list, from the lists release on

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: once cloud lists ship, an anonymous visitor creates no list:
  "New list", "Add to list" and "Save a copy" draw a sign-in prompt in the
  slot of the control they replace. Existing local lists stay editable
  until the legacy write cutoff. An unconfigured build (no Supabase URL and
  key, the one the browser suites drive) keeps local creation, because it
  has no account to offer; the prompt states are covered by component tests
  with a fake cloud and by the hosted E2E, never by a golden.
- Rejected: the design's rule - anonymous creation until the cutoff, then
  none (two stores kept alive for the whole window); a fake cloud in the
  production bundle so the goldens could draw the prompt - harness in the
  shipped code.

## 2026-09-24 - The account is a route, `#/account`, with provider linking

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: the header control ("Sign in" or the account name) opens
  `#/account`, a public route with five sections in order: signed in as
  (provider and email from the session, never stored in `public`);
  connected providers (Connect through `linkIdentity`, Disconnect through
  `unlinkIdentity`, drawn only while two or more identities exist); your
  data (Export JSON, once import/export ships); sign out; delete account
  with a typed confirmation calling `delete_account()`. Manual and
  automatic (verified email) linking both stay on. A provider account held
  by another user fails with `identity_already_exists`: "This <provider>
  account is already used by another account"; the privacy page states the
  recovery (export from the account you drop, import into the one you keep).
- Rejected: a dialog - extra code to reopen after the OAuth redirect, and
  no plain URL for the erasure link; no linking UI (the planner's cut) -
  two accounts with no way to join them when the provider emails differ.

## 2026-09-24 - Per-user UI preferences persist in the account, account wins

- Superseded in part by "Account preferences drop the default money mode; the print layout persists for everyone" (2026-09-24).
- Task: `persistent-storage` (owner decision, 2026-09-24; reopens the
  `profiles` cut of the same day's scope decision as one row).
- Decision: for a signed-in user the settings that live in `localStorage`
  or session memory - language, starting section, tables view, print layout
  (colour or black-and-white, compact sheet) and a default money mode for
  new lists - persist in `user_prefs(user_id, prefs jsonb)` and apply on
  every device. Precedence: the account wins; a first sign-in with no row
  seeds it from the local values; every later change writes local first,
  then the account; two devices are last write wins, refetched on focus.
  Anonymous users keep `localStorage`. No settings page: the controls stay
  where they are.
- Rejected: a separate preferences page - the controls already exist;
  local wins - a new device would silently reset the account; `profiles`
  with a display name - nothing shows one.

## 2026-09-24 - The browser suites drive a test build with a deterministic fake cloud

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: `vite build --mode test` writes `dist-test/` with an in-memory
  `CloudPort` fake seeded with fixed users, lists, homebrew, ids, tokens
  and timestamps; `?as=<user>` signs a seeded user in, absent means signed
  out. `tests/app/` drives that build, so every account-era screen has
  offline, parallel, pixel and structural coverage in both states. The
  production build never contains the fake: a build-time define that
  Rollup drops, and `check:built` fails on the fake's marker in `dist/`.
  The same contract assertions run against the fake and the real adapter
  (hosted E2E), so drift fails a gate. Pixel comparisons exist only in this
  layer; real network and real Supabase only in the database and E2E layers.
- Rejected: an unconfigured build keeping local creation as the golden
  subject (the planner's first choice) - the deployed anonymous screens
  would never be captured; a runtime-selectable fake in the production
  bundle - harness in shipped code.

## 2026-09-24 - Supabase configuration is code; the dashboard is read-only; no Branching

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: everything that can be code is code. Auth settings live in
  `supabase/config.toml` (site URL, redirect URLs, email, phone and
  anonymous sign-in off, Google and Discord on with `env(...)` secret
  references, manual linking on) and reach a hosted project only through
  `supabase config push` after a `supabase config diff` that a person has
  read - never a blind `--yes`, because a non-interactive push also writes
  the init template's values over a customised hosted setting. Schema,
  RLS, Realtime policies, the broadcast trigger, the Storage bucket and its
  policies are SQL migrations; Edge Functions, if any, live in
  `supabase/functions/`. The dashboard is read-only by convention: a
  hosted value that differs from the repository is a defect, found by
  `config diff` before each release push (CI holds no access token).
- Rejected: the Supabase GitHub integration (Branching) - pull-request
  based, likely paid, and the owner pushes to `main`; dashboard clicks
  recorded in a checklist - a list nobody diffs.

## 2026-09-24 - A cloud session runs a whole release on its own task branch

- Superseded by "A cloud release pushes after every green commit; the owner squash-merges it" (2026-09-24).
- Full text: `git show dedafaf:docs/DECISIONS.md`.

## 2026-09-24 - The hosted E2E mints its session with the secret key, not a password

- Superseded by "The hosted E2E reads its credentials from the environment; no proxy credential" (2026-09-24).
- Full text: `git show dedafaf:docs/DECISIONS.md`.

## 2026-09-24 - A drag keeps its cached midpoints when another tab rewrites the list

- Task: `debt-cleanup`; was DEBT D42 (`git show 7b0def9:docs/specs/DEBT.md`), closed
  as a kept design.
- Decision: the accepted cost of "A list drag resolves to a gap"
  (2026-09-19). Row midpoints are measured once, at `dragstart`, in
  document coordinates (`app/src/ports/drag.ts`). A second tab writing the
  same list mid-drag re-renders the rows through the storage merge; the
  highlight and the drop then land at the old layout's gap.
- Rejected: re-measuring every row on each `dragover` (undoes the caching
  decision); a mid-drag `onExternalChange` hook on the drag port (a port
  surface for a sub-second window that needs two tabs editing one list).
- How to see it: start a drag in one tab, write a reorder to the same list
  from a second tab mid-drag; the highlight tracks the cached order.

## 2026-09-24 - A secondary weapon's stat line names its damage type, not its class

- Superseded by "Every weapon's stat line names its class, secondary weapons too" (2026-09-24).

## 2026-09-24 - Kept defects live in `docs/specs/DEBT.md`, grouped by the task that owes them

- Task: `debt-cleanup` (the register's own rule since issue 47, 2026-09-11,
  restated with this task's regrouping).
- Decision: a live defect kept on purpose is an entry in `docs/specs/DEBT.md`
  (Where / What / Why deferred / How to verify), written in the batch that
  defers it and deleted by the batch that pays it. Sections are the tasks
  that owe the entries. A kept design goes here, not there; a refactor idea
  with no user-visible defect is named to the human and dropped.
- Rejected: a section of `FEATURES.md` (it says what the app does; "this is
  wrong" in it reads as behaviour); a task directory (retires with the task);
  one GitHub issue per entry (not in the tree, needs `gh`, cannot carry a
  measurement verbatim); the READMEs (a reader's document).

## 2026-09-24 - Outside the drop zone a list drag is refused explicitly

- Task: `debt-cleanup`.
- Decision: while a list drag is live, the document's capturing `dragenter`/
  `dragover` listener cancels every event and sets `dropEffect` to `move`
  inside the zone and `none` outside it; a `drop` outside the zone is
  cancelled without a move (`app/src/ports/drag.ts`). An editable field
  outside the zone, the list's own note first, cannot take the row's
  `text/plain` index as text.
- Rejected: `dropEffect = 'move'` on every `dragover` (the cursor would read
  "move" outside the list, losing the cancellation signal of "A list drag
  resolves to a gap"); leaving the browser default outside the zone (an
  editable neighbour accepts the drop as text).
- Evidence: a trusted puppeteer drag (`page.mouse` down/move/up) in this
  headless Chrome starts a native drag but delivers no `drop` anywhere, even
  inside the zone, and `page.mouse.dragAndDrop` hangs, so the insert was
  never reproduced; the refusal is asserted with synthetic events instead.

## 2026-09-24 - Every weapon's stat line names its class, secondary weapons too

- Task: `debt-cleanup`; the owner reversed the entry above.
- Decision: `eqParts` (`app/src/lib/i18n.ts`) and the share stub's `eqLine`
  (`tools/build-share-pages.js`) print the class on every weapon, never
  inferred from the damage type; the `eq_secondary` filter row that filters
  the class is labelled «Класс»/"Class", as on primary weapons.
- Reason: a character without a Spellcast trait cannot equip a magic weapon,
  so a secondary's class must be as explicit as a primary's; Hope & Fear has
  14 magic secondaries.
- Rejected: the damage type standing in for the class (the entry above);
  dropping the class tag from secondary print cards.
- Cost: 123 records' copied text and table rows, 246 stub `og:description`s
  refreshed by `previews.yml`, and the goldens that draw a secondary's row.

## 2026-09-24 - The print card frame follows the weapon's class

- Task: `debt-cleanup`; the owner asked for it.
- Decision: `PrintCard.svelte` picks the stat strip's ribbon (`ribbon` or
  `ribbon-mag`) and die art (`die-N-phy|mag`) from the weapon's class,
  `eq.cls === 'mag'`, on both strips of a two-strip weapon; the damage box
  still names each strip's own damage type.
- Reason: the frame tells a player the weapon needs Spellcast, as the class
  tag does, and a frame keyed on the damage type contradicted that tag.
- Rejected: the damage type (a magic weapon dealing `any` damage printed a
  physical frame, a physical one dealing magic damage the reverse); a
  per-strip class for `alt` (the second strip is the same weapon).
- Cards changed: q33, q94, q142, q162, q229 become magic; dve38, dve39
  become physical; q171's second strip becomes magic.

## 2026-09-24 - An undo toast takes focus; a plain toast never does

- Task: `debt-cleanup` (owner's answer).
- Decision: a toast that offers an undo moves focus to its button on show
  (`Toast.svelte`), so the keyboard reaches it inside the 7000 ms window.
  When it goes with focus still inside, focus returns to the element it
  came from, or to `#main` when that element left with the action.
  Behaviour: `docs/specs/FEATURES.md`, the undo-toast bullet.
- Rejected: leaving it to issue #57's focus-management pass (recommended,
  overruled: the undo was unreachable from the keyboard in practice);
  lengthening the toast (a longer wait still ends at the page's last tab
  stop); moving focus for every toast (a plain notice needs no answer).

## 2026-09-24 - Repository layout: no asset-home merge, no test colocation, `pages/src/` stays

- Task: `debt-cleanup` (owner's answers to a structure review).
- Decision: the root layout stays. `npm run dev` serves the root files the
  build links into `dist/` (`vite.config.mts`, `rootFiles()`).
- Rejected: one asset home for `img/`, `og/`, `card/` (under `app/public/`
  Vite copies ~90 MB per build; under `assets/` the published URLs stay
  frozen anyway, ~90 citations and ~3200 renames for no behaviour, and it
  contradicts "Share stubs (`i/`) and artwork (`img/`, `og/`) stay tracked
  root folders"); one test file per component (tests already sit in
  `app/src/components/`, and `perFile` coverage rejects a filename match);
  moving `pages/src/` out of `pages/` (a hook, its selftest cases, CI,
  `tests/derived.js` and two specs for tidiness: production never publishes
  `pages/src/`, only the local `dist/` junction exposes it). Revisit the
  last when a new static page is built anyway.

## 2026-09-24 - While the record dialog is open, the toast is drawn inside it

- Task: `debt-cleanup` (owner: fix now).
- Decision: `RecordModal.svelte` renders its own `<Toast inDialog>` and sets
  `app.dialogOpen` after `showModal()`; `Shell.svelte`'s copy draws nothing
  while the flag is set, so one element holds the live region at a time.
  "An undo toast takes focus" holds inside the dialog; when the origin is
  gone, focus returns to the dialog's first control (where `showModal()`
  put it), never to the inert `#main`. A dialog closed while a toast shows
  hands the rest of its time to Shell's copy.
- Rejected: `popover="manual"` from Shell alone (a modal dialog makes every
  node outside it inert, the top layer included: the toast drew but took no
  focus, had no accessibility node, and a click on it reached the backdrop
  and closed the dialog - Chromium, 2026-09-24); `show()` for `showModal()`
  (gives up the focus trap, the inert page and Escape); closing the dialog
  when an undo is offered (loses the card being acted on); moving one toast
  node between Shell and the dialog (a DOM move under Svelte's ownership).

## 2026-09-24 - A drag whose own row leaves the list is void

- Task: `debt-cleanup` (owner: fix now).
- Decision: the drag binding lives as long as the list's id
  (`ListPage.svelte`), not each edit of the list; the dragged entry's id is
  captured at `dragstart` and the drop moves that id. When the dragged row
  leaves the DOM mid-drag (another tab removed it), `app/src/ports/drag.ts`
  voids the drag at the next `dragover`: the marks clear, every later event
  of that drag is refused, the release moves nothing. Its listeners end at
  the `dragend` the browser fires at the detached grip (bound on the grip,
  since it no longer bubbles to the list) or at the next `dragstart`.
- Rejected: voiding on any row change (undoes "A drag keeps its cached
  midpoints when another tab rewrites the list" for nothing the id capture
  does not already give); a document `pointermove` after the drag (none is
  sent during a drag, and a synthetic one proves nothing about a trusted
  one); a component effect watching the rows (a second mechanism).

## 2026-09-23 - Per-language previews: `i/en/<id>.html` and `en/`, seeded into the refresher's state; site cards rendered from one template; a static page is a page per language

- Task: `64`; the owner settled `i/en/<id>.html`, the seed-when-absent rule,
  the English root, two re-rendered cards and one copy per static page.
- Decision: `i/<id>.html` and the root stay Russian and frozen; `i/en/<id>.html`
  and `en/index.html` (`<site>en/`) are English redirect pages from one
  generator, which store `dhloot.lang.v1=en` only when it is absent. The
  new URLs enter `tools/tg-preview/state.json` by `--adopt`, never pushed.
  `tools/artwork/cards.mjs` renders both site cards with a shipped Inter.
  `pages/<id>.html` is Russian, `pages/en/<id>.html` English. DEBT D38 paid.
- Rejected: `i/<id>.en.html`, `en/i/<id>.html`, `i/ru/`, `pages/ru/`; the
  language in the hash; the app served from `en/`; a meta refresh on `en/`;
  a hand-built state; a host font; one two-language page for `pages/`; a
  per-path 404; `hreflang` on the stubs; a `url_en` column.
- Evidence: an English link unfurled in Russian; the Telegram fingerprint
  reads only the `og:` title, description and picture; `og/_share.jpg` had
  Russian lettering and no generator (`7fd046c`); a submitted URL freezes.

## 2026-09-23 - Print card small text keeps the ribbon and gets one paper floor in every view

- Task: `61`, human decision (find it with `git log --grep="Task: 61"`).
- Decision: the ribbon stays; every view gets a `pt` floor (4.5pt labels,
  5pt values and numbers), black ink, no clip on a value, vector halos,
  weights 900/700/600/500, threshold diamonds and arrows of 1.3 mm or more;
  five strip cells (die, modifier on its centre, three label-value blocks).
  After a reprint: labels in tracked capitals, values as written; 0.25em
  under a label; one line down to 4.5pt, else two at 1.2 leading; 0.12em
  after the die's `d`; each threshold arrow grows from its box (R1, CSS):
  a dark arrow in a gold rim in colour, solid black in black and white.
- Rejected: replacing the ribbon; black and white only; a centreline grid; a
  6 pt floor; shorter Russian labels; grey labels; capitals with weight
  contrast; spacing the whole die value; an arrow in the box; the arrow
  through a gap in the frame (4A); a rim with its own base line (first 4C).
- Accepted (compact sheet): Russian long words at 4.8 pt; English `DAMAGE`
  beside a modifier at 3.1-3.7 pt, not `DMG`; a wrapped trait strip 11.3 mm.

## 2026-09-23 - The service worker is a hand-written `app/public/sw.js`

- Superseded in part by "Running from a folder and offline use are nice-to-haves" (2026-09-24): the offline shell and the
  one-IIFE rationale; the file, its tests and its lint block stay.
- Task: `69`; on 2026-09-23 the owner chose a minimal worker (offline
  shell, capped picture cache, silent updates).
- Decision: about 140 lines of plain JS with no dependency, copied verbatim
  into `dist/` by Vite's `publicDir`, linted by its own ESLint block and
  tested through `vm` (`tests/sw.test.mjs`). Policy: `docs/specs/META.md`
  section 9.
- Rejected: `vite-plugin-pwa`/workbox - a build dependency of several MB and
  an `npm audit` surface for a file this size, its registration is an ES module
  (forbidden under `file://`), and its default glob would precache the
  `img/` junction; a second Vite entry - Rollup refuses `iife` with two
  inputs; TypeScript in the app project - the `webworker` lib clashes with
  `dom` in one `tsconfig`; a manifest with no worker - an installed app
  that is blank offline; precaching all 34 MB of `img/`.

## 2026-09-23 - The shell is network first with a cache fallback; updates are silent

- Superseded by "Running from a folder and offline use are nice-to-haves" (2026-09-24): no shell; the document and
  `data.js` always come from the network.
- Full text: `git show 12557fe1:docs/DECISIONS.md`.

## 2026-09-23 - PWA registration is a boot concern in `main.ts` behind `PwaPort`

- Superseded in part by "Running from a folder and offline use are nice-to-haves" (2026-09-24): the protocol guard
  is gone with `file://`; the boot call and the script-added manifest stay.
- Task: `69`.
- Decision: `app/src/main.ts` calls `env.pwa.register()` once, beside
  `mount`. `app/src/ports/pwa.ts` tests the protocol before it touches the
  browser, so `file://` stays a no-op; the same port adds the
  `<link rel="manifest">`, because a static tag fails from a folder
  (`docs/specs/META.md` section 9).
- Rejected: registering in `App.svelte`'s `onMount` - it touches every
  golden's route for a call that draws nothing; a static manifest tag in
  `app/index.html` - Chrome fetches it from a folder and reports a CORS
  error and a failed request.

## 2026-09-23 - Site pages are generated static files under `pages/`, linked from a footer nav row

- Task: `69`; on 2026-09-23 the owner chose generated static pages linked
  from a footer row.
- Decision: `tools/build-pages.js` renders `pages/src/<id>.html` into
  `pages/<id>.html` from one template (both languages, `noindex`, relative
  links); `ci.yml` publishes the outputs only. `Shell.svelte`'s footer gains
  a nav row above the licence line; the install guide is its first link,
  and the persistence work's policy pages follow the same recipe
  (`docs/specs/META.md` section 9, "Static pages").
- Rejected: hash routes - the route grammar is frozen, and a hash has no
  plain URL for a verifier or a messenger; a hand-authored file per page -
  the owner asked for a shell the policy pages drop into; an About route; a
  menu - none exists, and the tab bar switches sections.
- Superseded for "both languages on one page" by the 2026-09-23 per-language
  previews entry (issue 64): one page per language, `pages/en/<id>.html`.

## 2026-09-23 - The install link is drawn only where it can be used

- Superseded in part by "Running from a folder and offline use are nice-to-haves" (2026-09-24): the footer nav row
  is always drawn with the policy links; only the install link hides, in
  the installed app.
- Task: `69`.
- Decision: `AppState.showInstall` is `router.hosted() && !pwa.standalone()`;
  the footer nav row is drawn only when it is true (`FEATURES.md`,
  "Chrome").
- Rejected: always shown - a dead link from a folder, where nothing
  installs, and a done action inside the installed app.

## 2026-09-23 - Row-sized art draws a committed 160 px `img/thumb/` derivative

- Task: `69`; the owner chose 160 px and this task on 2026-09-23.
- Decision: rows (tables, search, shared lists, list pages) and the lists
  index strip draw `img/thumb/<asset>.webp`, 160x160, WebP quality 80, one
  per `img/*.webp` including `_none.webp`; tiles, cards, print and
  copy-image keep the 640 px file (`docs/specs/FEATURES.md`, "Records").
  The set is committed. `tools/artwork/` makes each thumbnail from the
  640 px WebP as the third file of every `install` and `ingest`; `thumbs`
  regenerates the set and refuses an orphan (`docs/artwork.md`). Measured:
  a mean of 2,234 bytes against about 34 KB for the full picture.
- Rejected: `srcset` - a DPR-3 or DPR-4 phone picks the full file; 320 px -
  three times the bytes for a 60 px row; built in CI - root `npm ci`
  carries no encoder and CI builds from the commit; a top-level `thumb/`
  folder - a new junction, CI copy and worker rule for nothing; the
  thumbnail from the upload - a second resize pipeline, and `thumbs` could
  not reproduce what `install` wrote.

## 2026-09-23 - Thumbnails get their own worker cache, capped above the whole set

- Superseded in part by "Running from a folder and offline use are nice-to-haves" (2026-09-24): nothing is
  precached, `img/thumb/_none.webp` included; the cache and its cap stay.
- Task: `69`.
- Decision: `app/public/sw.js` caches `img/thumb/` cache first in
  `dhloot-thumb-v1`, capped at 1500 entries (the set is 1057), with the
  same seven-day revalidation; `img/` keeps `dhloot-img-v1` at 300;
  `img/thumb/_none.webp` is precached; `tests/sw.test.mjs` fails when the
  set outgrows the cap (`docs/specs/META.md` section 9). A tile view of a
  table longer than 300 still evicts its own first full pictures.
- Rejected: sharing `dhloot-img-v1` at 300 - one weapons table evicts its
  own first rows and every full picture; sharing it with a higher cap - an
  entry count bounds no bytes when 2 KB thumbnails and 34 KB pictures mix;
  LRU (store again on a hit) - a cache write on every row draw, and no
  effect on a cache that holds the whole set; precaching every thumbnail -
  2.4 MB on install for visitors who never open a table, and a 1057-name
  list in `sw.js` that changes with every art change.
- Superseded in part by "Pictures revalidate on every cache hit; an unchanged ETag writes nothing" (2026-09-23): the seven-day revalidation.

## 2026-09-23 - Pictures revalidate on every cache hit; an unchanged ETag writes nothing

- Task: `69`, follow-up; on 2026-09-23 the owner chose every-hit
  revalidation so that replaced art reaches installed clients.
- Decision: `app/public/sw.js` answers a hit in `dhloot-img-v1` or
  `dhloot-thumb-v1` from the cache and revalidates it with one
  background `fetch` through `waitUntil`, via the browser's HTTP cache
  (Pages: `max-age=600`, `ETag`). An ok answer with the cached `ETag`
  writes nothing; a changed or absent `ETag` replaces the entry; a
  failed fetch keeps it (`docs/specs/META.md` section 9).
- Rejected: keeping an age threshold - an unchanged answer is not
  rewritten, so its `Date` never advances and the threshold becomes
  every hit unless the worker stores its own check time;
  content-hashed picture URLs (`img/x.webp?v=<hash>`) - `data.js`, the
  artwork tool and `tools/build.js` would carry hashes, a planned
  batch; a cache-name bump per art refresh - every client downloads
  its pictures again, and a bump is easy to forget.
- Accepted cost: one conditional request per picture view past the
  `max-age` (not measured on a device).

## 2026-09-23 - A picture miss is answered before it is stored; an offline thumbnail miss takes the cached full picture

- Superseded in part by "Running from a folder and offline use are nice-to-haves" (2026-09-24): no precached
  placeholder follows the full-picture fallback.
- Task: `69`, follow-up; the owner chose both on 2026-09-23.
- Decision: `imageFirst` returns a fetched picture at once and stores
  and trims it through `waitUntil`, so `trim`'s `cache.keys()` over up
  to 1500 entries is off the answer's path; the cap holds once that
  work settles. Offline, a thumbnail miss takes `img/<x>.webp` from
  `dhloot-img-v1` before the precached placeholder, so a row does not
  mark the record's art failed for the session while the 640 px file
  is cached (`docs/specs/META.md` section 9).
- Rejected: trimming every Nth miss - a counter in a worker is lost
  whenever the browser stops it; the reverse fallback (a thumbnail for
  a full-picture miss) - a 160 px picture upscaled on a card; retrying
  the full picture in the app's `onerror` - app code for a worker
  concern, and online it fetches 34 KB for a failed 2 KB thumbnail.

## 2026-09-23 - Navigations take the navigation preload response

- Superseded by "Running from a folder and offline use are nice-to-haves" (2026-09-24): the worker answers no
  navigation and enables no preload.
- Full text: `git show 12557fe1:docs/DECISIONS.md`.

## 2026-09-23 - A site page links back to the screen the reader came from

- Task: `69`, follow-up; the owner chose it on 2026-09-23.
- Decision: the `tools/build-pages.js` template draws «Назад к
  генератору / Back to the generator» at the top and the bottom of
  every site page, `href="../"`; an inline script calls
  `history.back()` instead when the referrer is the app document and
  the tab has history (`docs/specs/META.md` section 9, "Static pages").
- Rejected: `../` alone - it opens the default section, not the one
  the reader left; the route in the page URL
  (`pages/install.html?from=...`) - app code writes it and a page URL
  carries state; a link at the end of each language section - on a
  phone the reader scrolls the whole page to reach it.
- Superseded in part by the 2026-09-23 per-language previews entry
  (issue 64): each page's link carries its own language, and the script
  takes the app root from the link's own href.

## 2026-09-23 - The installed app asks for persistent storage

- Task: `69`, follow-up; on 2026-09-23 the owner chose to ask only in
  the installed app.
- Decision: `app/src/main.ts` calls `env.pwa.persist()` once at boot,
  after `register()`. `app/src/ports/pwa.ts` calls
  `navigator.storage.persist()` only over http(s), only in the
  installed app (standalone display mode), and only when `persisted()`
  answers false; from `file://` and in a browser tab it does nothing
  (`docs/specs/META.md` section 9).
- Rejected: asking whenever the page is hosted - it would protect a
  browser tab's lists too, but Firefox documents a permission prompt
  for `persist()` (per MDN, not measured here), so a first visit could
  open with a storage prompt. Chrome grants an installed app silently.

## 2026-09-23 - A take line inside the ticked row; the summary names entries and pieces; the shared print and copied prices carry the count

- Task: `67`, round 2, human decision (options 1A, 2A, 3A, 4A).
- Decision: the taken count is a take line inside the ticked row, under the
  art: "Взять [2] из 5 = 1 мешок"; a ticked own row takes the selected style.
  A list page's summary reads "Выбрано 4 позиции · 9 шт.", the pieces only
  when they differ. The shared page's "Печать" writes the taken counts. A
  copied priced line with a count over 1 reads "×2 — по 7 мешков 5 горстей",
  in the selection copy and the whole-list copy.
- Rejected: the count field in the row itself (Кол-во turns into "Взять"
  while ticked) - one cell with two meanings; a `− 2 +` stepper - a second
  quantity control shape; pieces first ("Выбрано 9 шт. в 4 позициях") -
  "Удалить (4)" then sits beside a different number; a captioned stat group
  - two lines in the sticky bar; a print with no counts or with the stock -
  disagrees with the copy; "по" in the selection copy only - two line shapes
  for one list; the old copied text - reads as the price of the whole stack.

## 2026-09-23 - One plural() over Intl.PluralRules counts every number beside a word

- Task: `67`, round 2, human decision (option A).
- Decision: one `plural(n, forms, lang)` in `app/src/lib/plural.ts` picks
  the form by the built-in `Intl.PluralRules`. A form set is one dictionary
  string split by `|` (Russian `one|few|many`, English `one|other`, `%n` the
  number), so `Dict` stays `Record<key, string>`. A verb that agrees with
  the count is inside the form: "Выбрана 1 позиция" / "Выбрано 4 позиции".
  Colon forms ("Карточек: %n") stay. Rule: `docs/specs/I18N.md`, "Rules".
- Rejected: an i18n library - outside the approved dependency baseline
  (`I18N.md`, "No i18n framework") for one function; the hand-written rule -
  two copies (the list count in `i18n.ts`, the money words in `money.ts`)
  and no English rule beyond `n === 1`; ICU MessageFormat strings - a
  parser for three keys.

## 2026-09-23 - Vault of Ages Volume 4: the source errata policy

- Task: `voa4`, human decision (Q1, option C).
- Decision: the book (v1.0, 47 audited defects, the author silent) ships
  with tiered minimal fixes. Typos and the site's line for a core feature
  are fixed in `ende` (T); the description page wins over the card, the
  card only where the page is malformed (`d86+7`, Vengeance Helm's clause
  order) (D, V); a rule is edited only where the book contradicts itself -
  Horrified and Saint's Ensemble (R); every printed balance stays (B).
  Every departure is a row in `docs/provenance/voa4-errata.md`.
- Rejected: verbatim English with the rule in Russian only (the two
  languages state different rules, and `d86+7` cannot be stored); the
  audit's fixes throughout (rules the author never printed; a v1.1 becomes
  a three-way merge).
- Trade-off: the English is no longer a byte-for-byte quote of the book.

## 2026-09-23 - Artifact equipment: `eq.tier: 'A'`, printed as a loot artifact card

- Task: `voa4` (print card: human decision, Q3 option 2).
- Decision: Oath of Balance (`voa4_a3`) is printed in the book's Artifacts
  section, so `Equip.tier` is `Tier | 'A'`: the stat line reads `Артефакт`
  where the rank goes, the equipment tables draw an `Артефакты` section
  after tier 4, the tier facet offers `A` only where a record answers it,
  and the price guess uses the legendary item band. The print card is the
  loot artifact card: the artifact tag, the class tag, no tier band, the
  damage strip. `dataint` allows `'A'` only on a record of that section.
- Rejected: `eq.tier: 4` (an inferred tier, against the product law); the
  stats in the text (hidden from tables, filters and the strip); an
  optional `eq.tier` with `it.tier` fallbacks in every reader; a tier band
  `A` on the print card (a new caption to measure for one card).

## 2026-09-23 - The second set: Saint's Ensemble, a loadout bonus, still no set filter

- Task: `voa4`, human decision (Q2).
- Decision: `set: 'saints-ensemble'` on Saintly Guard, Blade and Vestments;
  the book's per-item line leaves their text and becomes the set bonus,
  worded with the p. 5 Item Sets rule: `When every piece of this set is in
  your loadout, gain +1 Evasion.` Stated once, it cannot stack; worded for
  N members, it needs no member names.
- The 2026-09-19 trigger for a set filter (a second source with sets)
  fired and was declined: two sets, five members, all equipment, and every
  member's card lists and links the rest. Re-open when a set spans loot and
  equipment, or at three sets.
- Rejected: the item's `possess` wording (the book's own rule says
  loadout); a `set` filter group on the equipment tables now.

## 2026-09-23 - A book condition is folded in as a line under the book's name

- Task: `voa4`, human decision (Q4: `Устрашён`).
- Decision: Horrified, a condition from Volume 4's optional rules page, is
  the last line of Horrid Specimen, `Horrified: ...`, in the p. 5 table's
  words; the item's own paraphrase of the condition is dropped. The book prints
  the condition, so the fold adds no text the book lacks. The Russian
  name is `Устрашён`, one word that declines like `Обездвижен`.
- Rejected: a ref (a book condition has no site page); the item's
  paraphrase (it states a different rule from the table); folding
  Dominated, Marked and Paranoid into the Volume 1-3 records that use them
  (product text of shipped records, its own task).

## 2026-09-23 - Vault of Ages Volume 4: the Russian names the draft guessed

- Task: `voa4`, human decision (Q4).
- Decision: «Губитель из Сухостоя», «Идол из Плавника», «Свеча Зова Душ»,
  «Пылестранник», «Тенеруб», «Амулет из Пальца Дьявола», the set «Убранство
  Святого»; «Посох Чёрной Дыры» with `ё`, as 8 of 10 «Чёрн-» names write it.
  Every other draft name is kept.
- Rejected: «Сухостойный Губитель»; «Идол из Топляка» (loses the shore);
  «Фитиль» for Taper (voa2_t2d uses it, but the text says «свеча»);
  «Жнец Теней»; «Амулет Дьявольского Пальца» (it is a severed finger on a
  string); «Облачение Святого» (the Vestments already carry «Облачение»;
  «Комплект» is the set line's own word).

## 2026-09-23 - The list store is raw state; an unchanged stored value is not parsed again

- Task: `68`.
- Decision: `ListStore.lists` is `$state.raw`: every writer already replaces
  the array and the list it changes. The store remembers the
  `dhloot.lists.v2` string it last read or wrote: `save()` does not parse it
  again, and an external-change signal that finds the string `lists` was
  drawn from redraws nothing. The stored format does not change.
- Evidence (this host, 2026-09-23): a list-title keystroke costs 6.8/19/55
  ms at 50/200/500 lists, storage and JSON 1.2/5.4/11 ms of it; the save
  under Svelte 5.57, deep 14/44/94 ms, raw 1.3/5.7/16 ms. An unchanged
  re-read on `#/lists` costs 13/47/128 ms on each return to the tab.
  Measured after the change (built `dist/`, 1100x900): a keystroke at 200
  lists 22 -> 2.5 ms; an unchanged `storage` signal 62 -> under 1 ms with
  no DOM mutation; opening `#/lists` at 500 lists 467 -> 32 ms (24 cards).
- Rejected: a `save()` debounce (the consistent-storage ticket owns it,
  `DEBT.md`, "Consistent storage"); one key per list (a stored-format change
  and a new two-tab merge).
- Accepted trade-off: an in-place write to a stored list redraws nothing -
  the reason phase 8 kept deep state; writers stay immutable.

## 2026-09-23 - Many lists: a name filter on the index, a pinned search and create control in the menu

- Task: `68`. Design target 200 lists; nothing may break before the quota.
- Decision: from the eighth list (`LIST_SEARCH_AT`, the menu's own
  threshold) the index draws a name filter, folded as search folds
  (`foldQuery`), memory only; a create clears it; no match draws «Ничего не
  найдено». Cards, their order and their actions stay. The add-to-list menu
  scrolls its chips only: the label, the search and «+ Новый список» stay in
  view. The menu's search folds the same way, and the new-list form starts
  with the typed query as its name.
- Evidence (2026-09-23): at 50 lists the index is 3447 px at 1100 wide and
  9096 px at 375; «+ Новый список» sits 2209 px down a 338 px menu, and
  already 412 px down at 8 lists.
- Rejected: a new filter string (`findList` reads «Найти список»); a
  shown-of-total count (a second `.fcount`; the cards are the answer); the
  menu's search taking focus on open (a phone's keyboard covers the chips).
- The owner's answers on paging and menu order: the next entry.

## 2026-09-23 - Many lists: the index shows 24 cards at a time; a record's own lists lead its menu

- Task: `68`, the owner's answers to the planner's Q1 and Q2.
- Decision (Q1 = B): the index draws 24 cards (`LIST_PAGE`) of what the
  filter leaves, then «Показать ещё (N)» / "Show more (N)", N still hidden;
  a press adds 24 and focuses the first new card; a query edit folds back
  to 24. The count is session memory (`AppState.listsShown`, as `printBW`
  is): a return from a list keeps it, a reload does not.
- Decision (Q2 = A): a one-record menu puts the lists holding the record
  first, newest first in each group, in the order taken when it opens.
- Rejected, Q1: A, every card drawn (the planner's pick; 11 phone screens
  at 50 lists); C, a compact view in `dhloot.prefs.v1` (stored state, a
  second layout); page numbers (lost on Back without a route change);
  folding back on every return; the count in the address or storage.
- Rejected, Q2: B, newest first everywhere (at 50 lists, membership spread
  over 2200 px); re-sorting on a press (the chip moves under the pointer).

## 2026-09-23 - The black-and-white card grows its rules text to a cap under the name

- Task: `61`, human decision (find it with `git log --grep="Task: 61"`).
- Decision: `fit()` grows a black-and-white card's rules text from
  3.5cqw to at most 5cqw while it fits, then shrinks as before. Colour
  is untouched. The 63x88 mm card stays the default sheet.
- Rejected: replacing the 3x3 sheet with a 4x4 of 44x63 mm cards - every card
  dimension is `cqw`, so it is the same card at 70%: the blank share is
  unchanged, the default text 4.3 pt, the floor 3.2 pt, both Figma nodes
  lost, and the sleeves do not fit (the opt-in compact sheet: "The compact
  sheet is an independent size switch"); growing colour text too - it takes
  the space from the picture, inverting the ladder's order; scaling the whole
  composition (name, tags, strips) - `print.js` measures the strips in design
  units; a cap of 5.5cqw - 1-4 points less blank for text nearly the name's
  size.
- Accepted trade-off: a one-line card stays more than half blank; text
  size varies from card to card between 2.6 and 5cqw; the
  black-and-white node's 12/344 text size becomes a starting size.

## 2026-09-23 - The compact sheet is an independent size switch for both print layouts, kept in session memory

- Task: `61`, human decision (find it with `git log --grep="Task: 61"`).
- Decision: a second print switch, `Обычная` / `Компактная`, beside the
  colour switch: sixteen 44x63 mm cards per A4 sheet in either layout,
  `pages(items, 16)`, the same card at 70% (every dimension is `cqw`).
  `AppState.printCompact` is session memory beside `printBW` (D21). The
  address, the contracts and `printHint` are unchanged.
- Rejected: compact black-and-white only - a 44 mm colour card prints 4.3 pt
  rules text (3.2 pt at the floor) and hides its picture on the longest
  texts; the owner's answer: a reader who does not want compact colour does
  not select it. A single three-option switch - it forced compact to one
  layout. `localStorage` - reverses D21 for one field; both choices would
  move into `dhloot.prefs.v1` together. The URL - `#/print/<ids>` is frozen,
  and the size is the printer's fact.
- Accepted trade-off: compact colour text is 4.3 pt; the longest
  black-and-white texts read at 4.2-4.6 pt; both choices reset on reload.

## 2026-09-23 - A feature an item grants an adversary is a referenced card

- Task: `dv-review` (human review of The Dragon's Vault, 2026-09-23).
- Decision: Nightshroud's (dve66) Slow leaves `ende`/`rud` for the ref
  `slow`, linked to the page that prints it (`adversary/huge-green-ooze`,
  as `elemental-breath` links to the Drakona page). The record text stops
  where the book's does; the ref keeps the site's name and the GM as the
  actor. Rule: `docs/specs/I18N.md`, "Rules".
- Rejected: the fold (text the book does not print, on the card and in the
  print); the Ooze's whole stat block as the ref (one feature under nine
  lines); no Slow text at all (the reader goes looking).
- Accepted trade-off: the print card and the share stub carry no Slow
  text, as dv14 and dv66 print without their stat blocks.

## 2026-09-23 - A list entry's price is the price of one unit; a selection's total is summed in coins

- Task: `50` (find it with `git log --grep="Task: 50"`).
- Decision: `gold` on a list entry is what one unit costs. A selection's total
  is the sum of `gold x taken count` over the ticked, priced entries, in whole
  coins, read once through `priceText` in the list's own money mode - so the
  rounding to two units applies to the total, never line by line. An unpriced
  ticked entry adds nothing and is counted aloud: "Итого: 1 мешок 1 горсть
  (без цены: 1)". With no priced entry ticked, no total is drawn.
- Rejected: `gold` as the price of the whole stack - the price guess
  (`guessPrice`) and the percentage shift already treat it as one record's
  price; summing only the priced rows with no word about the rest - reads as
  a complete total when it is not; no total while any row is unpriced -
  useless for a shop that prices part of its stock; rounding each line
  before summing - the sum of rounded lines drifts from the real price.

## 2026-09-23 - A selection on a list page carries a taken count per entry, in memory, defaulting to the whole stock

- Task: `50`.
- Decision: ticking an entry takes its whole quantity; a count field narrows
  it to 1..quantity. The count lives in memory beside the selection it
  belongs to (`AppState` for the shared page, `ListPage` for an own list) and
  is cleared with it. Removing the selection from an own list takes the
  counts: a partial count lowers the entry's quantity, a full one removes the
  entry, and one undo restores both. Adding the shared page's selection to a
  list carries the taken count as the new entry's quantity.
- Rejected: a default of 1 - silently changes what "Удалить (N)" and the
  bar's add-to-list already do for a ticked stack; turning `app.sel` into a
  map - touches every table and search caller for a list-only need; a count
  in the address or the list link - a public-contract change for state
  `STATE.md` keeps out of storage and links; a separate cart - a second
  selection model beside the one the pages already have.

## 2026-09-23 - The total rides in a selection's copied text, not in a whole list's

- Task: `50`.
- Decision: "Скопировать" on the shared page's selection bar, and a new
  "Скопировать" in the own list's batch bar, copy the ticked records with
  each one's taken count and unit price after the name (the `shareList` line
  shape) and end with the total line. "Скопировать текст" for a whole list
  stays as it is. A table's or search's selection copy is unchanged.
- Rejected: a total at the end of every copied list - changes a pasted
  format nobody can edit afterwards for every list, priced or not; both - two
  totals for the same list read as a disagreement when a selection is part
  of it.

## 2026-09-23 - The taken count sits in a strip under a ticked row; the total sits beside the selected count

- Superseded by "A take line inside the ticked row; the summary names entries and pieces; the shared print and copied prices carry the count" (2026-09-23).

## 2026-09-22 - The print address carries a list's count as `*<n>` per id

- Task: `67`, human decision (find it with `git log --grep="Task: 67"`).
- Decision: `#/print/<id>[*<n>]-...`. A count over 1 is drawn after the
  card's name as ` ×N`, clamped to 99; anything else draws no counter. `*<n>`
  is the list link's own `id*qty` spelling, so one spelling means "quantity"
  in both public formats. Only the list page's print button writes it
  (amended 2026-09-23: the shared page's selection bar writes the taken
  counts too).
- Rejected: the count from memory (the open list) - lost on reload and on
  the copied set link, against `ROUTES.md`'s reason for reading print from
  the address; a repeated id as a count (`ci1-ci1-ci1`) - changes addresses
  already shared, where a repeat is dropped, and 99 is 99 ids; `.` as the
  separator (`ci1.3`) - a second spelling for "quantity"; `x` or `_` - ids
  already hold both; a list-payload print route - a second print grammar for
  one number per card; N printed copies - not what the issue asks for.
- Accepted trade-off: whether a chat client mangles `*` in a pasted URL
  (emphasis, or `%2A`) is unmeasured; such an address falls to the home
  section, as any unreadable address does. The card name cap became three
  lines, not a shrink step: Russian names already print at three.

## 2026-09-22 - The shared page's top control saves a copy; the selection bar alone adds to a list

- Task: `58`.
- Decision: the shared list page's top control is a plain gold "Сохранить
  себе" / "Save to my lists" button, no caret, always drawn whatever the
  selection. One press creates a new own list from the whole shared list -
  ids, both notes, entry meta and money mode - and opens it. Pouring the
  list into an existing list stays possible as select-all plus the
  selection bar's "Добавить в список" chip, now the only add-to-list menu.
- Rejected: relabelling the menu "Сохранить список" / "Save list", caret
  kept - two gold caret buttons with near-identical menus still read alike;
  hiding the top control while a selection exists - it would jump under the
  reader's thumb and keep the bar's own label while shown. Labels
  "Сохранить копию" / "Save a copy" - the bar already holds "Скопировать"; and
  "Клонировать список" / "Clone list" - developer jargon in Russian UI.
- Evidence: issue 58's screenshot, two identical gold "+ Добавить в список"
  buttons on screen at once with rows ticked.

## 2026-09-22 - Russian record text: metric distances, the site's lowercase terms, granted adversary features folded in

- Task: `dragons-vault` (human review of the built app).
- Decision: distances in `ru`/`rud` are rounded metric, as Core, Hope &
  Fear and Vault of Ages already print them (dv39, w36, w56 were the three
  left). Mid-sentence `состояние`, `преимущество`, `помеха`, `активация`,
  `свойство`, `карта`, `домен` are lowercase, as daggerheart.su and the
  rest of the catalogue write them; text that repeats the site verbatim
  keeps the site's casing (q124, q328). A feature an item grants an
  adversary (Nightshroud's Slow) is folded in as its own line under the
  site's name, the GM as the actor. Rules: `docs/specs/I18N.md`.
- Rejected: one casing rule for every term (the site itself is mixed on
  «бросок», «атака», «урон», «реакция» - measured 2026-09-22); re-casing
  site-verbatim text; a ref for Slow (a feature has no page; the Ooze's
  whole block would bury it); rewording the English (it stays the book's).
- Superseded in part by "A feature an item grants an adversary is a
  referenced card" (2026-09-23): the fold of Nightshroud's Slow.
- Narrowed by: 2026-09-23 "Vault of Ages Volume 4: the source errata
  policy" - a book with audited defects gets registered English fixes.

## 2026-09-22 - A feature that swaps a weapon's stat set gets the Versatile second strip

- Task: `dragons-vault` (human review).
- Decision: `eq.alt` holds any second stat set a weapon's own feature
  switches to, not only Versatile's: Ember's Fan the Flames (Agility, Very
  Close, d12+5 mag) and the Steampowered Gauntlets' Supercharge (Strength,
  Melee, d12+4 phy; the -1 Evasion and the Stress to move stay in the
  text). The print card draws it as the second strip. The text stays as
  the book prints it: `eq.alt` is stored data, nothing parses the text at
  render time. `tests/derived.js` names every non-Versatile record that
  carries one.
- Rejected: rewording Ember as "Versatile" (a paid swap is not a free
  choice, and `Универсальное` stays reserved for Versatile); a render-time
  parser; the Spellblade (its summoned stats are its main stats, above).

## 2026-09-19 - Dragon's Vault: source `dv`, table `dv`, section `roll/dv`, ids `dv`/`dve`, one roll over all 145 records

- Task: `dragons-vault` (equipment joined the roll at the human's review,
  2026-09-22).
- Decision: source key `dv`, table id `dv`, section `roll/dv`, loot ids
  `dv1`-`dv77` in the order the detailed entries print (pp. 30-47),
  equipment ids `dve1`-`dve68` in page order (pp. 9-27), Frostwyrd as three
  records. All 145 live in `items.dv` on the Wondrous and Dread model: a
  piece of equipment keeps its stat block, rolls on its book's table and
  still appears in the equipment tables. `roll` is the id's number for loot
  and 77 + the number for equipment ("Random 1-145"). The book has no random
  table by design (p. 29); the help box says so.
- Rejected: `dragons_vault` as the key (every table id here is one short
  word, `voa` the precedent); equipment first, in page order (moves every
  loot roll off its id number for a table the book never prints); a `roll`
  on records left in `eq` (a second mechanism for what `items` already
  does); no roll tab (the help box is the only surface for a source link).

## 2026-09-19 - Dragon's Vault: the detailed entries win over the overview tables

- Task: `dragons-vault`.
- Decision: where pp. 7-8 disagree with an entry (twelve cases, the
  contributor's `dragons_vault_source_issues.md`, each re-read on the PDF
  page), the record carries the entry. `eq.cls` comes from the table's TYPE
  column where the entry prints no class: Nature's Fall and Restless
  Vengeance are Physical with magical damage, Rod of Flaming Skulls Magic.
- Rejected: the tables (the entry is the card a player reads, and its text
  and its stat line are printed together); a per-case pick (Frostwyrd
  Exalted is the one case where the table's `d10+13` is more plausible
  than the entry's `d10+10`, equal to Awakened - a one-off pick makes the
  rule unstatable, so the entry stays and the doubt is recorded here for
  the author's errata).

## 2026-09-19 - Frostwyrd is a two-step craft chain; every upgrade line stays at four tiers

- Task: `dragons-vault` (was a three-rung `eq.line` until 2026-09-22).
- Decision: `craft: 'dve25'` on Dormant and `craft: 'dve26'` on Awakened,
  no `line`; the card reads "Upgrades to" / "Made from" and keeps the
  "Unique" badge. Each rung keeps the lower rungs' features in its own text
  (the book: a rung retains them), so a copied rung's "Upgrades to" block
  carries only the target's lines the rung lacks. `craft` means "upgrades
  to", so a chain of named items fits it; `line` stays the four-tier
  ladder, and `tests/dataint.js` keeps every line at tiers `1,2,3,4` (58).
- Rejected: a three-rung `line` with a relaxed invariant (it cost the
  "Unique" badge); the draft's `upgrade_line` field (nothing renders it);
  three unlinked one-offs (the book prints one weapon that "improves to a
  new tier"); the target's full text in a copy (repeats two of three
  lines); a "Made from" block in a copy (a copy is for players, forward only).

## 2026-09-19 - Gryphon Hammer `bu: 'any'`; the Spellblade carries its summoned stats

- Task: `dragons-vault` (Spellblade and print mark: reviews of 2026-09-22).
- Decision: `Equip.bu` gains `'any'` ("Одноручное/двуручное" /
  "One/Two-Handed"); the burden facet matches it under `1` and `2`; the
  print card draws the one-handed mark with `1/2` as its caption. The
  Spellblade carries the stats the book gives it once summoned: `tr:
  'spellcast'` ("Характеристика Заклинателя" / "Spellcast"), Melee,
  `d10+4`; its trait facet answers all six traits. The print card's trait
  cell reads «Хар. Заклинателя»: the full term does not fit the cell
  (measured 2026-09-23). A trait chip is drawn only where a record of that
  kind answers it, so no `spellcast` chip exists.
- Rejected: two stacked grip marks (no exported vector for the pair,
  `CLAUDE.md` "Export vectors"; `tests/app/print.js` pins one mark per
  card); `bu: 1` plus `burden_options` (nothing reads it); the book's
  printed `Special` trait and `d0` (every surface showed a weapon nobody
  can attack with); a trait chip that selects one record.

## 2026-09-19 - Draft fields `page`, `lore_*`, `gm_note_*`, `state`, `trait_original`, `burden_options`

- Task: `dragons-vault`.
- Decision: `page`, `state`, `trait_original` and `burden_options` are
  dropped (the name and the schema carry their content). `lore_en`/
  `lore_ru` (144 records, ~85 KB) are dropped: no shipped source carries
  flavour text, nothing renders it, and `data.js` is 149 KB gzip on first
  load (`docs/specs/META.md` section 4); adding it later is additive.
  The Chalice of Chaos box (`gm_note_*`, p. 33) is folded verbatim into
  `ende`/`rud` as a final line: it is rules text printed beside the item.
  Frostwyrd's Vestige sidebar (p. 14) is dropped: the book explains
  Vestiges, and three cards repeated it (human review, 2026-09-22).
- Rejected: a folded "Lore" block on the card (a new surface with its own
  dictionary, goldens and print decision, for text the book itself says a
  GM may ignore); keeping the fields in `data.js` unrendered (`CLAUDE.md`:
  add no export before something uses it).

## 2026-09-19 - Dragon's Vault refs: four cards and two adversaries fetched, rules excluded

- Task: `dragons-vault` (adversaries added at the human's review,
  2026-09-22).
- Decision: `refs` gains `pack-predator` (dv71, beastform),
  `elemental-breath` (dv26, Drakona ancestry feature), `vampire` (dve38,
  transformation card), `enrapture` (dve59, Grace spell), and the adversary
  stat blocks `huge-green-ooze` (dv14 turns a character into one) and
  `shambling-zombie` (dv66 raises them), each fetched from
  `ru.`/`en.daggerheart.su` in the `RefCard` shape; a stat block is lines
  of text there, as a beastform's is. No existing ref is reused.
- Rejected: death moves and class features (Risk It All, Blaze of Glory,
  Rally Die - core rules the site does not carry; `llms.txt` sends rules
  questions to the SRD); Counterspell (dv1 names it but does not depend on
  its text).
- Evidence: "Dragon's Breath", named at dispatch, appears in no Dragon's
  Vault text; the nearest is Drakona's "Elemental Breath" on dv26.

## 2026-09-19 - The product link lives in the roll tab's help box

- Task: `dragons-vault`.
- Decision: `https://www.drivethrurpg.com/en/product/581246/the-dragon-s-vault`
  is a link in `help.ts`'s Dragon's Vault box, the surface every shipped
  source uses, and a row in both README source tables.
- Rejected: a hover tooltip on the source badge (`Badge` takes a `title`,
  but a `title` cannot hold a link and never shows on touch; a link the
  reader cannot follow is a citation, not a source - `help.test.ts`).

## 2026-09-19 - Text normalisation for an ingest, and its guard

- Task: `dragons-vault`.
- Decision: in `en`/`ende`/`ru`/`rud`, U+2018/U+2019 become `'`;
  U+201C/U+201D become `"` in English and `«»` in Russian; U+2014, U+2212
  and `«»` stay as the catalogue already carries them (33, 57 and 18
  records). `tests/dataint.js`'s apostrophe guard widens to the four
  quotation marks. Dropped fields are not normalised.
- Rejected: normalising to U+2019 (the other way DEBT D41 offered; the
  catalogue is already ASCII, so D41 was stale and is deleted); ASCII for
  the dash, the minus and the Russian quotes (search folds U+2212 and the
  shipped data carries all three).

## 2026-09-19 - Dragon's Vault art: 145 files, every record arted, one asset per Frostwyrd rung

- Task: `dragons-vault`.
- Decision: the drop is the ledger (`docs/artwork.md`'s three
  preconditions hold: every name resolves to one record, no duplicate
  bytes, all 1254x1254). The human refilled the art drop twice mid-batch;
  the shipped state is 145 files for 145 records, none with `img: ''`.
  Frostwyrd's rungs each take their own asset: the drop delivers three
  distinct renders.
- Rejected: leaving any record out until art arrives (a record may ship
  without art and renders `_none.webp`); any hand conversion.

## 2026-09-19 - Set membership: a named set on the record, members derived, a shared bonus on every member, no filter

- Task: `dragons-vault` (human decisions: structured and designed for N
  members; the bonus first-class at the review of 2026-09-22).
- Decision: `Record_.set?: string` names a record's set (`ember-spark` on
  dve19 and dve20); members are grouped at load (`buildIndex`), never
  stored. The card lists every member in catalogue order, the record itself
  inert: `Комплект: Уголёк, Искра` / `Set: Ember, Spark`. A set's bonus is
  `LOOT.sets[key]` (`en`, `ru` name; `ende`, `rud` text), drawn under that
  line on every member, carried in copied text, share stubs and
  `catalog.csv`, and printed as the last text line, `<name> (<Set>:
  <members>): <text>`. Listing all members needs no Russian case agreement.
- Rejected: the bonus in one member's text (the book's layout; it left
  Ember's holder blind); a copy in each member (two texts to keep equal); a
  stored sibling list; indexing the bonus for search (refs and craft
  targets are not indexed either); a `set` filter group or set page until a
  second source brings sets.

## 2026-09-19 - A reorder is announced through a permanently mounted live region, not the shared toast

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `ListPage.svelte` always mounts an empty `<div class="lsaid"
  role="status" aria-live="polite">` beside `.lrows`. Both movers (`setPos`,
  the drag port's `onDrop`) fill it only when `store.move()` returns true, so
  a no-op move stays silent. The strings name the record and its position
  (`%s`, `%n`, `%m`) with no participle, which would have to agree with the
  record's gender (`docs/specs/I18N.md`, "Rules").
- Rejected: the toast (`app.say`) - its one shared slot drops a pending undo
  prompt; a region mounted only while it holds text - the unreliable half of
  the pattern, and blind to the goldens; a region in `Shell` - adds a node to
  all 110 goldens for one page; announcing a rejected typed position - a
  rejected entry is not a reorder.
- Evidence: `page.accessibility.snapshot()` keeps an empty `role="status"` as
  `status ""`, so the mount re-seeds every list-page golden.

## 2026-09-19 - The drop-gap mark is made instant by narrowing `.row`'s transition, not by overriding the drop classes

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `.row`'s `transition: 0.15s` (which includes the mark's
  `box-shadow`) is narrowed to `border-color 0.15s, opacity 0.15s`, keeping
  the hover border and the dragged row's fade. `.rnote`'s own `transition:
  box-shadow 0.15s` (TASK `dnd3`) is deleted, or its half of the mark would
  fade alone. `dnd3` wrote no entry here, so nothing is superseded.
- Rejected: `transition-duration: 0s` on `.lrow.drop-before`/`.drop-after` -
  a transition uses the style it moves *to*, so the mark would still fade on
  exit.
- Evidence: `dist/` before the fix: `.lrow` `transitionProperty: 'all'`,
  `.rnote` `'box-shadow'` at `'0.15s'`; after: `.lrow` `'border-color,
  opacity'`, `.rnote` `'all'` at `'0s'`, the CSS initial value. A property
  read cannot tell that apart from `.row`'s old shorthand, so
  `tests/app/states.js` case 17 reads `.rnote`'s duration.

## 2026-09-19 - The drag grip is hidden by an `any-hover`/`any-pointer` capability query, not `hover`/`pointer`

- Task: `dnd4` (find the commit with `git log --grep=dnd4`).
- Decision: `@media (any-hover: none) and (any-pointer: coarse)` hides
  `.lrow-grip` in `ListPage.svelte`. HTML5 drag never starts from a touch,
  so the grip is inert where no pointer can hover or point finely. A
  touchscreen laptop or a tablet with a mouse keeps the grip.
- Rejected: `(hover: none)` or `(pointer: coarse)` - they describe only the
  primary input and hide the grip from a working mouse; a script feature
  test - `'draggable'` and `'ontouchstart'` both lie, and the check would
  leave `app/src/ports/`; a width query - width does not predict touch.
- Evidence: `page.emulateMediaFeatures` refuses `hover`/`pointer`; only
  `page.setViewport({ isMobile: true, hasTouch: true })` moves
  `any-hover`/`any-pointer` (`docs/specs/COVERAGE.md`, "app/states - two
  harness facts a device-capability case runs into").

## 2026-09-19 - A drop indicator redraws on a row's own note box when one is open

- Task: `dnd2` (find the commit with `git log --grep=dnd2`).
- Decision: an open note box (`.rnote`, `flex: 0 0 100%`) is a row's own
  last child, and covered `.lrow.drop-after`'s inset box-shadow, which
  paints below its element's children. `.lrow.drop-after .rnote` redraws
  the identical inset on the note; both rules paint when the note is
  open, but `.row`'s own bar is occluded, not absent. A doubled 6px bar
  is avoided only because `.row` carries no bottom padding, so `.rnote`'s
  border box lands on exactly the 3px the base rule draws into - add
  `padding-bottom` to `.lrow` and the mark splits into two lines.
- Rejected: an absolutely positioned `::after` bar - immune to a future
  opaque child, but needs `position: relative` on `.lrow`, a larger blast
  radius than the defect earns; a transparent `.rnote`, trading a visible
  defect for a visible redesign of a surface (`--bg2`) meant to read apart.
- Evidence: measured against `dist/` - a marked row's bottom 200x3 px strip
  read 0/600 gold pixels noted, 400/600 closed, list end and middle alike.

## 2026-09-19 - A list drag resolves to a gap, from the document, not to a row

- Task: `dnd` (find the commit with `git log --grep=dnd`).
- Decision: `nativeDrag` resolves the pointer to a gap index - the number of
  rows above the landing place - from the capturing document `dragover` it
  already binds for edge-scroll, against row midpoints cached at `dragstart`
  in document coordinates. The drop zone is the rows box grown by one
  measured row gap above the first row and below the last. There is no
  horizontal test, so the zone is a band. `drop` moves to the same document
  listener, so every position the highlight promises also accepts a release.
- Rejected: keeping the row-level `dragover` and widening what counts as a
  hit (the 8px `.rows` gap is not a row, so the early return that is the
  defect survives in some form); recomputing row rectangles on every
  `dragover` (a forced layout per frame, and rows cannot move during a
  drag); a horizontal bound on the zone (a person aiming between rows drifts
  vertically, and nothing sits beside the rows on this page).
- Evidence: the comment above `onDocOver` already recorded that the pointer
  spends most of a drag over the gaps between rows; only the scroll was
  moved to the document, never the targeting.

## 2026-09-19 - Both sides of the gap light, and a cancelled drag is shown, not worded

- Task: `dnd` (find the commit with `git log --grep=dnd`).
- Decision: "after 3" and "before 4" are one place, so both rows beside the
  gap carry the existing gold inset. The component derives the pair from the
  unchanged `onOver(over, where)` callback, so no port contract moves.
  Cancelling is signalled rather than worded: outside the zone the
  highlights go out and the cursor refuses the drop, which is what Escape, a
  release outside the list and a drag off the page all look like.
- Rejected: one line drawn in the gap itself (it needs a node inside a flex
  column whose rows are `overflow: hidden`, so it either shifts every row
  below it or forces `position: relative` onto a shared `.rows` rule); an
  explicit Escape key handler (the native drag already consumes Escape and
  fires `dragend`, and a second mechanism for one effect is a second thing
  to keep true); a hint string in `dict.ts` (a tooltip is read before the
  drag, not during it, which is when cancelling is decided).

## 2026-09-18 - Task documents stay tracked; closeout deletes them, never pushed

- Task: `workflow-hygiene` (find the commit with `git log --grep=workflow-hygiene`).
- Decision: `issues/<id>/` stays tracked in git while a task is open. The
  closeout amend runs `git rm -r issues/<id>` before the task's one push, so
  a task's documents never reach the remote - only its permanent-home writes
  and its commit do.
- Rejected: gitignoring `issues/` instead - the deletion path stops being
  guardable (`bash-guard.mjs` denies `rm -r` inside the repo; rule 2i sees a
  glob as a literal token), a worktree or a remote agent at the task's commit
  would not see the documents, and the issue 47 task directory was tracked by
  an owner ruling (later overridden) that would have become an exception
  inside an exception.
- Evidence: pre-amend commits stay in the local reflog only
  (`gc.reflogExpireUnreachable`, 30 days by default), so the closeout audit
  is the only thing that preserves a decision or a measurement made mid-task.

## 2026-09-18 - Durable knowledge is written to its home the batch that makes it, never parked

- Task: `workflow-hygiene`.
- Decision: a durable fact, decision, or defect is written to its permanent
  home in the batch that establishes it, never left in a task document for
  closeout to move. Homes: behaviour -> `docs/specs/`; hook/harness/host
  facts and rationale -> `.claude/README.md`; every other decision ->
  `docs/DECISIONS.md`; a defect kept on purpose or work owed ->
  `docs/specs/DEBT.md`; an idea nobody owns -> dropped, named to the human at
  closeout so they can file it.
- Rejected: parking durable content in the task directory until closeout -
  the audit would then have to reconstruct what was durable from narrative
  written once already, which is exactly how content survives as a citation
  into a directory that is about to be deleted.

## 2026-09-18 - The task-document size budget and compaction stay; retirement becomes primary

- Task: `workflow-hygiene`.
- Decision: the 150 KB warn / 300 KB collapse budget and its compaction
  procedure (`.claude/skills/handoff/SKILL.md`) stay - they guard the *open*
  task, read by every worker at dispatch. Compaction becomes the secondary
  procedure; retirement (deleting the directory at closeout) becomes primary.
- Rejected: dropping compaction now that retirement exists - a long task
  still grows for weeks before it closes (phase 8 ran twelve batches), so
  the mid-task budget problem compaction solves has not gone away.

## 2026-09-18 - Rule 2i generalised from a plan.md file to any task directory

- Task: `workflow-hygiene`.
- Decision: `bash-guard.mjs` rule 2i now denies `rm`/`git rm` of any file
  under `issues/<id>/`, or of the directory itself, while a tracked line
  outside that directory cites `issues/<id>/` (a `git show <sha>:path`
  citation stays exempt) - generalised from denying only a still-cited
  `plan.md`.
- Rejected: retiring the rule instead, on the theory that "nothing may cite
  a task directory" under the new model - a rule nobody enforces at the
  moment of deletion is exactly the rule that produced ten orphaned
  citations for issue 65's retired `plan.md`.
- Evidence: retirement was rare before this task (three directories ever)
  and is now routine (every task's closeout), so the class of orphan the
  rule prevents is attempted at every closeout, not occasionally.

## 2026-09-18 - The push-force guard denies every force form, not just a bare `--force`

- Task: `workflow-hygiene`.
- Decision: `bash-guard.mjs` rule 2b now denies `--force`, `-f`,
  `--force-with-lease` (with or without `=<x>`), `--force-if-includes`, and
  any `+<refspec>` token; `--dry-run` still exempts.
- Rejected: leaving `--force-with-lease` allowed (its previous standing) -
  with one amended commit per task, an amend after a push is the tempting
  mistake, and a lease that happens to succeed is still the force-push
  `CLAUDE.md` forbids.
- Evidence: same class as the standing AI-attribution deny - an explicit
  human rule with zero false positives.

## 2026-09-18 - One commit per task, amended per batch, pushed once at closeout

- Task: `workflow-hygiene` (human decision).
- Decision: a task's first batch runs `git commit`; every later batch and
  the closeout amend it (`git commit --amend`, message rewritten to cover
  the whole task so far); the commit gate (rule 2e) runs on each amend. The
  branch is pushed once, at closeout, after the task directory is deleted;
  the amend window closes at that push. Never force-push, in any form.
- Rejected: pushing at every batch's committed boundary (`CLAUDE.md`'s
  prior rule) - it produced many small commits per task, and a pushed
  commit cannot be amended without a force-push, so the two rules were
  incompatible as soon as amending was adopted.
- Evidence: the reviewer diffs a batch as `git diff <previous sha> HEAD`,
  both shas recorded in the handoff's Completed section.

## 2026-09-18 - The comment standard lives in `CLAUDE.md`, enforced by review and rule 2i, no new hook yet

- Task: `workflow-hygiene`.
- Decision: the four-bullet comment standard (`CLAUDE.md`, "Comments") is
  enforced by the review prompt (section G) and, at retirement, by rule 2i -
  a comment citing `issues/<id>/` blocks the directory's deletion, and the
  writer of that comment pays for it.
- Rejected: a dedicated hook or `tests/` gate now - the written rule has not
  been given a chance to fail yet (`.claude/README.md`'s standing bar for a
  new hook is a repeated mistake, row 29). `.claude/README.md` row 48
  records the cheapest deterministic form for the day it does.

## 2026-09-18 - The issue 47 task directory is audited and retired in this task

- Task: `workflow-hygiene`.
- Decision: the issue 47 task directory (the Svelte migration backlog) is
  read in full, its durable content placed in permanent homes, and the
  directory deleted - overriding the 2026-09-17 ruling in its own handoff to
  keep it permanently. No directory is exempt from the new model.
- Rejected: keeping the 2026-09-17 ruling - it predates this task's model,
  under which every directory whose work has shipped is retired.
- Evidence: the closed records (`sweep.md`, the closing record in
  `handoff.md`) stay reachable through one history pointer,
  `git show 92d6a4b:issues/47/<file>` - `92d6a4b` is the last commit on
  `main` before this task's own commit.

## 2026-09-18 - Retire scope: audit every shipped directory, then delete - never a blind delete

- Task: `workflow-hygiene` (human decision).
- Decision: every task directory whose work has shipped is read in full,
  its durable content moved to a permanent home, every tracked citation into
  it repaired, and only then is the directory deleted.
- Rejected: a blind delete of old task directories - it is exactly what
  produced orphaned citations for issue 65's retired `plan.md`; the audit
  is the fix.

## 2026-09-18 - Decisions live in one `docs/DECISIONS.md`, not a `docs/decisions/` folder

- Task: `workflow-hygiene` (human decision).
- Decision: one register file, `docs/DECISIONS.md`, holds every decision
  that outlives the task that made it (outside behaviour, which stays in
  `docs/specs/`, and hook/tooling rationale, which stays in
  `.claude/README.md`).
- Rejected: a `docs/decisions/` directory of one file per decision - a
  single register is easier to grep and to keep a size discipline over; that
  discipline is accepted as a cost of the choice, not a reason against it.

## 2026-09-18 - Write the comment standard and sweep the whole repository to match it now

- Task: `workflow-hygiene` (human decision).
- Decision: `CLAUDE.md` gains the comment standard in the same task that
  sweeps every existing violation - untrackable citations
  (`B10-N5`, `issues/<id>/` paths, plan/handoff section references) stripped,
  verbose block comments compressed. A large diff is expected and accepted.
- Rejected: writing the rule now and sweeping later, incrementally - the
  existing violations would keep citing a task directory this same task is
  retiring, which rule 2i would then have to deny piecemeal instead of once.

## 2026-09-18 - One commit per task, amend freely, push once - replaces the per-batch push rule

- Superseded by "One commit per task, amended per batch, pushed once at closeout" (2026-09-18), which restated the same decision.

## 2026-09-17 - Nits are processed immediately, per batch, not deferred to a terminal pass

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: nits are cleared in the batch that finds them, against the
  standing "defer mid-plan" rule (`orchestrate.prompt.md`, "Nits") - owner
  instruction. Reviewers still list nits fully; they are acted on.
- Rejected: deferring to the terminal batch as usual - that rule's premise
  ("a later batch re-enters those paths") fails once batches are merged by
  area and do not overlap, so a deferred nit has nothing to ride and arrives
  as a pile instead. `orchestrate.prompt.md`'s "Nits" section now names this
  as the standing exception.

## 2026-09-18 - A batch whose whole scope is other reviews' findings runs with no reviewer

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: the terminal nit-clearing batch ran with no reviewer, by owner
  decision - reviewing a batch whose whole scope is other reviews' findings
  opens a second-order review -> remediate loop with no floor. Substitute:
  every routed finding proves itself in the failing direction as an
  acceptance line. Handoff wording: `Review: not run (owner's decision)`,
  never `not required`. `orchestrate.prompt.md`, "When to run reviewer",
  carries the same sentence.

## 2026-09-17 - Rejected UI/architecture options from the phase-8 review, recorded once

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: no change - these alternatives were considered and rejected
  during review and have no other permanent home now that the task
  directory is gone.
- Rejected: a `<label>` emitted by `Field` (it wraps chip rows and segmented
  switches; a `<label>` around buttons is wrong); `$state.raw` for `lists`
  (a cheap present-cost win traded for a silent failure if anyone later
  mutates in place); extending the truncation checksum over the notes (a
  payload-grammar contract change for a failure the reader can see anyway);
  virtualising the row lists (370 is the largest list drawn, and it moves
  goldens); SHA-pinning the `actions/*` tags (maintenance beyond its value;
  `gitleaks` alone is pinned).
- Superseded in part by "The list store is raw state; an unchanged stored
  value is not parsed again" (2026-09-23): `$state.raw` for `lists`.

## 2026-09-18 - `data.json`/`catalog.csv` staying tracked was not solved by a pretest step

- Task: `untrack-stubs` (retired; recorded here at retirement).
- Decision: `data.json` and `catalog.csv` stay tracked in git (triggers to
  reopen this: `docs/specs/CONTRACTS.md` section 4).
- Rejected: `"pretest": "npm run data"` (fires for `npm run test` but not
  `test:watch`, and makes a plain `npm test` write 1093 files); pointing the
  seven `app/src/lib/*.test.ts` suites at `data.js` instead (changes what
  they prove, voids `COVERAGE.md`'s "the real `data.json`"); `existsSync` +
  `it.skip` (coverage thresholds fail anyway, or the gap is hidden); a
  vitest `globalSetup` builder (the same tree mutation, only hidden).

## 2026-09-18 - Share stubs (`i/`) and artwork (`img/`, `og/`) stay tracked root folders

- Task: `untrack-stubs` (retired; recorded here at retirement).
- Decision: `i/*.html`, `img/`, and `og/` stay tracked at the repository
  root rather than moving under a build output or out of git entirely.
- Rejected: generating stubs into `dist/i/` and dropping the root folder
  (moves a path four suites read off disk - `derived`, `dataint`, `craft`,
  `stub` - and changes what `node tools/build.js` means); git-lfs, a
  shallow-clone recommendation, or a history rewrite for repository size
  (the 146 MB `.git` is `img/` + `og/`, which stay tracked regardless of
  this choice; a rewrite breaks every clone and every sha the specs cite).
- Superseded for i/ by f53f44d, which untracked the stubs (.gitignore,
  CONTRACTS.md section 5); img/ and og/ stay tracked as decided.

## 2026-09-16 - Playwright: not now

- Task: the Svelte migration (issue 47; retired, recorded here at
  retirement).
- Decision: not adopted, by the owner's decision. Scope fence: R0c reduced
  no real-browser coverage (nine `tests/app/` suites run against `dist/`);
  only the side-by-side pixel comparison ended, and that end was
  unavoidable once the app being compared against was deleted.
- Evidence both ways: for adopting it - the states case-7 flake
  (`docs/specs/COVERAGE.md`, "app/states") was hand-rolled event waiting,
  exactly the class auto-waiting locators exist for, and two Chrome runs
  once collided on one tree with no lock between them; against - the
  driver's verbs (`media`, `computed`, `eachAt`, `settle`, drag, click-by-
  name) are bespoke to a bilingual UI and three-width sweeps, and the
  goldens are structural text, so screenshot tooling would replace nothing
  they check.
- Rejected: deciding with no data; a spike before R0c; committing to it up
  front. Still open - the heavy-run lock question beside it
  (`.claude/README.md`, "Batch size and the fixed cost of a run") weighs against the
  same driver question, since a second real-browser dependency would need
  its own guard too.

## 2026-09-17 - The R0c sweep ran as a read-only reviewer-role dispatch, not an implementer step

- Task: the Svelte migration (issue 47; retired, recorded here at
  retirement).
- Decision: the sweep that read the deleted instruments' own assertions for
  what no surviving instrument could see ran as a read-only, reviewer-role
  dispatch, deliberately separate from the implementer batch that did the
  deleting - the implementer's incentive is to delete, which is the wrong
  incentive for a read meant to find what deleting loses.
- Rejected: a gate in `npm run check` (there is nothing mechanical to
  assert - the sweep's findings are read-only prose); the implementer doing
  it in the same batch (anchoring - the same person who wants the deletion
  reviewing what it costs); skipping it because an earlier audit (R0b)
  already covered ten suites (that audit covered suites, not markup,
  conditional CSS, the dictionary, or the 42 parity specs the sweep also
  read).
- Evidence: this generalises to any "delete a whole surface" batch, not only
  R0c's own.
