# Review - plan before B5a (ai-mcp)

Verdict: fix-then-continue
Reviewed: 8f194abd97bd2a70000db1a76c68a5f4c1e5d67e
Scope: plan before B5a

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Tree: `8f194abd` plus the planner's uncommitted edits of `issues/ai-mcp/plan.md`,
`handoff.md` and `context.md` (`git diff 8f194abd -- issues/ai-mcp/`).
`REVIEWED_RE` in `.claude/hooks/lib.mjs` takes a sha only, so the head line
holds the sha and this line names the working tree.

Scope read: plan Status (both "Plan review" lines, "Design pass 2026-11-11"),
sections 3.4, 3.5, 3.6, 3.8, 4 (D7), 5.1, 5.3, 5.4, 6 (B1 "B5 touchpoints and
the second consumer" and the steps it names, B2, B5, B5a, B5b), 7 (Q8-Q11),
8, 9, 10, 11; `context.md` "B5 design facts" and "Second consumer:
bacchus-atlas". Evidence read: `supabase/migrations/` (lists, list writes,
list shares, purchase requests, homebrew, homebrew links, homebrew art,
delete account, realtime, limits), `supabase/config.toml` (auth),
`app/src/ports/supabase.ts` (`homebrewUpdate`, `updateItem`, heads),
`app/src/ports/types.ts`, `preview/public/_routes.json` and `_headers`,
`.claude/hooks/agent-guard.mjs` and `lib.mjs`, `.github/workflows/backup.yml`,
`docs/specs/CONTRACTS.md` (`hb_` row, section 5), `docs/specs/I18N.md`,
`app/src/lib/dict.ts`.

## Blockers

### plan-B5a-1 (blocker, local) - the pre-request guard does not bound resource embedding

Section 6, B5a step 2 and step 3; section 4, D7. The guard decides by
`request.method` and `request.path` only. PostgREST resource embedding
reads other tables through foreign keys under the caller's RLS, on an
allowed path:

- `GET /lists?select=*,list_shares(*)` returns the share tokens
  (`list_shares.list_id references public.lists`, owner select policy).
- `GET /lists?select=*,purchase_requests(*,purchase_request_lines(*))`
  returns the players' requests (`purchase_requests_owner_select`).
- `GET /lists?select=*,list_notices(*)`, and the same chains from
  `list_entries` and `homebrew_items` (`list_entries.hb_item`).

So D7's claim "refuses a token with `client_id` on every table ... outside
the API's list" is false, and the consent sentence "never your ... share
links" is false. Step 3 enumerates tables by top-level path and does not
see it.

Fix text, step 2, after the guard sentence: "Restrictive policies on every
`public` table outside the scope list (`list_shares`, `purchase_requests`,
`purchase_request_lines`, `list_notices`, `print_sets`, `user_prefs` and
every other table that `authenticated` can select; the step 3 query
enumerates them): `create policy <table>_no_client as restrictive for all
to authenticated using ((select auth.jwt() ->> 'client_id') is null) with
check ((select auth.jwt() ->> 'client_id') is null)`. The pre-request
function bounds RPCs and the write methods; the restrictive policies bound
embedding and live in the schema dump." Step 3, add: "an embedding case
from each allowed table to each out-of-scope table it has a foreign-key
path to (for example `lists?select=*,list_shares(*)`) answers empty
embedded arrays or 403 for a client token, and the full rows for an app
token." D7: add "and restrictive policies on the other tables" after
"outside the API's list". The named fallback then keeps only its RPC half.

### plan-B5a-2 (blocker, local) - the step 1 stop rule misses the identity-link takeover

Section 6, B5a step 1; section 7, "Owner stop"; section 9, B5 bullet. The
stop rule measures only `PUT /auth/v1/user` (email, password). This
project has `enable_manual_linking = true` and TOTP enrollment on
(`supabase/config.toml`), and the app links and unlinks identities. If
GoTrue accepts a client token on its user endpoints, a connected app can
link its own Google or Discord identity
(`GET /auth/v1/user/identities/authorize?provider=...`), then sign in as
the reader and reach `delete_account`; or enroll a TOTP factor
(`POST /auth/v1/factors`, then verify) and lock the reader out. The guard
cannot see these: they are not PostgREST.

Fix text, step 1, replace "and whether `PUT /auth/v1/user` with it changes
the email or password" with: "and, with the auth settings of
`supabase/config.toml` pushed to the test project, what the client token
can do on Auth: `PUT /auth/v1/user` (email; password; `data`),
`GET /auth/v1/user/identities/authorize` (link an identity),
`DELETE /auth/v1/user/identities/{id}` (unlink), `POST /auth/v1/factors`
(enroll), `POST /auth/v1/logout?scope=global`, and `GET /auth/v1/user`
(which personal fields it answers). Also record which of
`<SUPABASE_URL>/.well-known/oauth-authorization-server/auth/v1` (RFC 8414
path insertion, which MCP clients try) and
`<SUPABASE_URL>/auth/v1/.well-known/oauth-authorization-server` answer."
Stop rule: "if a client token changes the email or the password, links or
unlinks an identity, or enrolls a factor, stop and return to the owner (a
connected app could take or lock the account); a global logout and a
`data` change are recorded, not a stop." Use the same list in section 7
and section 9.

### plan-B5a-3 (blocker, local) - deletes by a connected app lose more than the plan names

Section 6, B5b Standing check 2 ("Possible loss"), B5a step 5 (the scope
sentence), B5b `/mcp/me` tool descriptions. Standing check 2 of
`review.prompt.md`: a loss that the plan does not name is a blocker. The
plan names "a connected app's delete is permanent". The cascades are
unnamed:

- `DELETE /me/lists/{id}` deletes the list's `list_shares` (every link the
  players hold stops), its `purchase_requests` and lines (the players'
  pending requests) and its `list_notices` (`on delete cascade`,
  `20260925130200_list_shares.sql`, `20260928120000_purchase_requests.sql`).
- `DELETE /me/homebrew-items/{id}` deletes every `list_entries` row that
  links the item, in other accounts' lists too
  (`20261007130000_homebrew_links.sql`: `hb_item ... on delete cascade`,
  "a linked item's edit or delete leaves a notice on each list of another
  owner"), and releases its picture file (`20261014120000_homebrew_art.sql`).
- The guard allows `PATCH` on `homebrew_items` at PostgREST, so a client
  token can set `art` to null and delete the picture file. The consent
  sentence "never your ... pictures" is then false.

Fix text, B5b Standing check 2, after "Possible loss": "a list delete also
deletes its share links, the players' requests and its notices; an item
delete also removes it from every list that links it, other accounts'
lists included (they get a notice), and deletes its picture; a client
token can clear an item's picture at PostgREST. These are the app's own
delete semantics; no copy is kept, and the reader's only recovery is a
lists file or a homebrew file saved before (`FEATURES.md`, "Exports")." B5a step 5, the scope sentence
becomes: "read, change and delete your lists and homebrew items; deleting
a list also ends its share links and the players' requests on it;
deleting an item removes it from every list that holds it and deletes its
picture. It never changes your sign-in, deletes your account, uploads
pictures or makes share links." Write the Russian twin with the same
facts (the app's term «Мои предметы»), and keep the same five facts in
both privacy pages. The descriptions of `delete_list` and
`delete_homebrew_item` name the same cascade. B5b `PUT` keeps `art` as
stored (it omits `art`, as `updateItem` does when `patch.art` is
undefined); state it in the `PUT` row.

## Risks

### plan-B5a-R1 (risk, local) - "Disconnect" does not stop the app for up to an hour

Section 6, B5a step 6 and Standing check 2; D7. `revokeGrant` ends the
sessions and refresh tokens, but an issued access token is a JWT that
PostgREST checks by signature only; it stays valid until `exp` (default
3600 s). The plan says "a revoke ends tokens". Recommended fix (one
indexed read per client-token request, app tokens skip it): the guard also
refuses a client token whose `session_id` has no row in `auth.sessions`,
through a SECURITY DEFINER helper `public.api_client_session_live()` with
`set search_path = public, pg_temp`, `revoke execute ... from public,
anon` and `grant execute ... to authenticated`; step 3 adds "a revoked
grant's unexpired token is refused". Alternative: state the window in the
"Connected apps" text in both languages and in `FEATURES.md`, "Account".
The trade-off of the recommendation is one more definer function under
section H's checks.

### plan-B5a-R2 (risk, local) - the guard is proved only on the local stack and is not in the backup

Section 6, B5a steps 2, 3 and 8; acceptance. (a) `tests/db` runs on the
local CLI stack, where `postgres` is a superuser. On the hosted project
the role setting can be refused or ignored; the fallback names only
"refuses", and an ignored setting passes every local test while the
hosted guard is off. (b) The nightly backup leaves out roles
(`.github/workflows/backup.yml`: "the schema dump leaves out roles (those
need `--role-only`)"), so a restore into a new project drops
`pgrst.db_pre_request` with no error. Fix text: acceptance gains "after
`migrate-test` applies the migration, a client token from step 1 gets 403
`api_client_guard` from `GET /rest/v1/print_sets?limit=1` on the test
project, and an app token gets 200 (recorded in `.claude/README.md`,
'Supabase configuration')"; step 8 gains "the owner runs the same probe on
production after the switch, and 'Restore production (owner)' gains a step
that re-applies the role setting and runs the probe". With plan-B5a-1 the
table half survives a restore; the RPC half depends on this step.

### plan-B5a-R3 (risk, local) - an account `rev` does not cover the derived `record`

Sections 3.4 ("Sync") and 6, B5b (`GET /me/homebrew-items`,
`GET /me/homebrew-items/{id}`). `homebrew_items.revision` moves only with
its own row. The `record` that B5b answers takes `set`, `refs`,
`craft.from` and the source name from `homebrew_cards`, `homebrew_books`,
related items and the catalog; `get_homebrew_item` hashes an md5
`revision` over all of them for that reason. A consumer that mirrors
`record` by the heads misses those changes. A list's `revision` also does
not move when a linked item changes. Fix text, section 3.4, after "(`rev`
is the row's `revision`)": "an account `rev` covers the row's own fields
(`book` and `content` for an item, the list fields and entries for a
list), not the parts of `record` drawn from other rows; a client that
keeps `record` reads it again when it reads that row, and reads each
linked item by the item heads". Keep `If-Match` on the row revision.

### plan-B5a-R4 (risk, local) - the `rev` freeze is too strict and one test is wrong

Sections 5.4 ("Frozen"), 11 (bulk catalog bullet), B1 step 5 and its
acceptance line. B1 freezes "`rev` changing exactly when the record's JSON
changes". That forbids a later change of the hash or of the serialization
without a v2. The step 5 test "an edit of one record changes that `rev`
only" is false: a record's JSON embeds other records (`craft.from` from
`index.craftedFrom`, `set.members`, `refs` text). The catalog `rev` is a
hex string and the account `rev` a bigint. Fix text, frozen rule: "`rev`
is an opaque string, compared for equality only; it changes whenever the
record's JSON changes, and may change at other times (a client then reads
an unchanged record again)". Section 3.4: "every head gives `rev` as a
string (an account row: its revision in decimal); `ETag` is `"<rev>"`".
Step 5 test: "an edit of one record's text changes its `rev` and the `rev`
of each record whose JSON holds that record (craft, set, refs), and no
other".

### plan-B5a-R5 (risk, local) - the client token carries personal claims

Section 6, B5a steps 1, 5, 7; section 3.6 (B5a privacy sentence). A
Supabase access token carries `email`, `phone`, `app_metadata` and
`user_metadata` (the provider name and picture) whatever OIDC scope the
client asks for; the connected app reads them without a call. The consent
page and the privacy sentence name only lists and homebrew items. Fix
text: step 1 records the claims of a client token; if `email` or a name is
present, the consent page and both privacy pages add "and your account's
email and name" (Russian twin with the same facts).

### plan-B5a-R6 (risk, local) - a config push can reset the OAuth server switch

Section 6, B5a steps 1 and 8. The project pushes `supabase/config.toml`
(`npm run config:push`). The plan keeps the OAuth server in "the dashboard
settings". If the pinned CLI's `config.toml` schema has an OAuth server
section, a later push sets it to the file's value and can switch the
server off for every connected app. Fix text, step 1: "check whether the
pinned CLI's `config.toml` has an OAuth server section; if it does, the
settings (enabled, authorization path `/connect`, dynamic registration) go
into `supabase/config.toml`, and the local stack serves them; if not, step
8 records that `config:push` leaves them".

### plan-B5a-R7 (risk, local) - a list `PATCH` retry writes a held copy

Section 6, B5b `PATCH /me/lists/{id}`, `PATCH .../entries/{entry}`,
Standing check 2. Standing check 2: a retry that writes a field from a
copy held from before the conflict is a loss. Last writer wins is the
app's rule, but a server consumer retries later and from older copies than
a tab does. Recommended fix: `PATCH /me/lists/{id}` takes an optional
`If-Match` (412 with the current `ETag` when the revision moved), done as a
direct `lists` update with `eq('revision', r)` and the read-back rule of
`homebrewUpdate`; the guard adds `PATCH` on `lists`; without `If-Match`,
last writer wins. Name the remaining loss (an entry `PATCH`, a `PATCH`
without `If-Match`) in Standing check 2. The trade-off is one more guard
row.

## Nits

- plan-B5a-N1 (local) - B5b `PUT /me/homebrew-items/{id}`: the body
  `{ book, content }` has no `key`, but `key` is NOT NULL, client-made
  (`lib/homebrew.ts`) and `unique (owner_id, key)`. Add: "`key` optional on
  create (made by the service as `lib/homebrew.ts` makes it), ignored on
  replace; a duplicate key is 409 `conflict`; a create whose id belongs to
  another account (the upsert inserts nothing and the read-back sees no
  row) is 409 `conflict`".
- plan-B5a-N2 (local) - Section 5.3, `key` row: add "a homebrew key is
  unique within one account only (`CONTRACTS.md`, `hb_` row, 'per
  account'); `id` is the key across accounts".
- plan-B5a-N3 (local) - B5a step 2: state `grant execute on function
  public.api_client_guard() to anon, authenticated, service_role` (the
  repository's `revoke ... from public` pattern would fail every request),
  exact path equality (`/lists`, not a prefix), `HEAD` judged as `GET`,
  and the reversal file `supabase/reversals/<same name>.sql` (`alter role
  authenticator reset pgrst.db_pre_request; notify pgrst, 'reload
  config';`, drop the policies, drop the function) under the up-down-up
  gate of `check:db`.
- plan-B5a-N4 (local) - Section 3.5 and B1 step 4: `version.json` hashes
  "every other output", and every output, now the public chunks and index
  too, carries `data_version`. State: "the hash is over every output
  rendered with `data_version` empty, then stamped into each file".
- plan-B5a-N5 (local) - Section 5.1: "any unknown path under `/api/`
  answers the JSON 404" and "every answer under `/api/`" need the static
  exception: "under `/api/v1/catalog/` a miss is Pages' `404.html` with
  status 404". B1 step 10: `tests/contracts.js` compares the operations of
  `openapi.json` with `CONTRACTS.md` section 6 and lists the static
  catalog apart, because it is not an operation.
- plan-B5a-N6 (local) - B1 step 9: the index holds no image URLs. The probe
  reads the first chunk that the index names and takes its first record
  with a non-null `image.full`.
- plan-B5a-N7 (local) - Section 3.5 and B1 Standing check 1: a row
  `{"id":"ci12","rev":"0123abcd","chunk":12},` is about 43 B, so the index
  is about 69 KB today and about 210 KB at 3x (the synthetic ids are
  longer), not 45 KB and 135 KB. It stays within 262144 B, which the 3x
  test holds.
- plan-B5a-N8 (local) - Section 11 freezes `*` "on every URL a record's
  `image` names", which includes homebrew Storage URLs (`site.art`) that
  Supabase serves. Narrow it to the catalog image URLs under `<site>img/`
  and `<site>og/`.
- plan-B5a-N9 (local) - B5a step 4: `AppsRepository` becomes
  `AppRepository` (`ListRepository`, `ShareRepository`,
  `HomebrewRepository` in `ports/types.ts`).
- plan-B5a-N10 (local) - B5b `?ids=`: `get_homebrew_items` is SECURITY
  DEFINER and answers any id with no owner filter and no `related`. State
  that the service accepts only ids in the reader's heads (another id is
  400), and which index builds `record` for `?ids=` and for `{id}`, so
  `craft.from` matches `GET /api/v1/homebrew-items/{id}` or the difference
  is named.
- plan-B5a-N11 (local) - Section 4 heading says "(to `docs/decisions/` in
  B1)", but D7 is written in B5a; B5a step 5 fixtures are
  `docs/fixtures/urls/routes.json` and `docs/fixtures/urls/paths.json`.
- plan-B5a-N12 (deferred-scope) - Section 3.4, "Sync and the quota": state
  the ceiling: at one poll per 15 minutes the shared quota holds about 500
  polling users in all (100,000 / 192), less the app's card traffic; a
  changed list costs one read per list, not one per 10. Section 10 defers
  the usage report "until the quota is near", and nothing shows when it is
  near.

## Deviations

- "Plan review: required before B5a" instead of "before B5" (B5 split):
  accepted. `agent-guard.mjs` (`requiredBatches`, `planReview`) reads every
  `required before` line in Status and judges each by its newest
  `reviews/plan-<batch>[-<n>].md`, so this line blocks every implementer
  dispatch, B0 and B1 included. The B1 line is satisfied by
  "Plan review findings applied: reviews/plan-B1-3.md" in Status.
- One review for the B1 delta and B5: accepted. The delta adds no trigger
  kind that the B1 reviews did not cover. Its two security-relevant parts
  (T0 ignores `Authorization`; the frozen sync rule) are reviewed here
  (plan-B5a-R4, N5, N6). No regression against the fixes of
  `plan-B1.md`, `plan-B1-2.md` and `plan-B1-3.md` was found; N4 is older
  than this delta, which extends it to the public files.
- `plan.md` at 172 KB, past the 150 KB warning line: accepted, with the
  compaction after B1.

## Standing checks

1. Scale: checked - B5a States (consent: loading, details, signed out,
   expired id, already consented, approve in flight, failed read and
   approve, 200-character name; connected apps: empty, one, 30, longest
   name, revoke failure; 360 and 1180 px goldens; nothing sticky, no
   input, so no keyboard case); B5b heads at the limits of
   `20260925130000_limits.sql` and `20260930130000_homebrew.sql` (lists 50,
   entries 100, items 100) and at 3x, `?ids=` 10, an add of 100, 422 past
   65536 B; the bulk index at 3x (plan-B5a-N7).
2. Error scenarios: checked - deletes and their cascades (plan-B5a-3),
   retries of an LWW `PATCH` (plan-B5a-R7), the `If-Match`, 412 and 428
   flows against `homebrewUpdate`'s read-back rule in `ports/supabase.ts`
   (sound), creates by client id against `apply_list_writes`'
   `on conflict (id) do nothing` and its 42501 for another account's id
   (sound), revoke (plan-B5a-R1), a stale tab and a revert, the down
   migration order of step 8 (sound), a bulk pull across a deploy (a
   missing chunk answers `404.html` with status 404, which the plan's
   restart rule needs), and two tabs (lists and homebrew writes send
   Realtime messages from triggers, so the app's tab sees an API write).
3. Consistency: checked - "Connected apps" beside the connected providers
   section; `disconnect` («Отключить», "Disconnect") exists in `dict.ts`,
   «Разрешить» and «Отказать» are new (the plan's "as the app's other
   confirms" holds for «Отключить» only); port naming (plan-B5a-N9); one
   `rev` rule across collections (plan-B5a-R4).
4. RU/EN parity: checked - every B5a string is named in both languages;
   the scope sentence changes (plan-B5a-3, R5) and keeps the same facts in
   both; both privacy pages; `/connect`, which Supabase sends without
   `/en/`, opens in the stored language (`I18N.md`, "The choice is a
   preference"), so an English reader gets English; B5b errors and
   `openapi.json` stay English, as section 5.1.

Owner rules: checked - this pass has no owner statement (owner AFK); the
defaults Q8-Q11 have their homes in `plan.md` section 7 and D7 (written in
B5a); the CORS allowlist rule of 2026-11-10 is in D3 and `CONTRACTS.md`
section 6 (B1) and B5b. The owner-AFK log of each default sits outside the
repository and is not checked here.

## Dispatch questions

- Sync. The `{ id, rev }` heads work for deletes (no tombstones; a missing
  id is a delete; `homebrew_items` and `lists` have no soft delete). The
  homebrew `If-Match`, 412 and 428 design matches `homebrewUpdate`
  (`eq('revision', r)`, then a read-back: same patch 200, gone 404, else
  412). The static bulk path works: `_routes.json` exclude wins over
  include, `env.ASSETS` reads the same chunks, and `404.html` gives a 404
  status for a stale chunk. `rev` needs no migration: the catalog `rev` is
  a build-time hash; `lists.revision` and `homebrew_items.revision`
  (bigint, bumped by trigger; a list also by each entry change) exist.
  Limits: plan-B5a-R3, R4. `key` is correct and additive before
  publication (list entries hold `item_key`; relation fields hold keys);
  it needs plan-B5a-N2.
- Security. The pre-request guard is the documented PostgREST mechanism
  and covers RPCs (`rpc/delete_account`, `rpc/delete_account_requests` and
  every SECURITY DEFINER RPC by path) and direct table writes, but not
  embedding (plan-B5a-1), Auth (plan-B5a-2) or Realtime (receive only;
  harmless). Storage: only `homebrew_art_insert` exists ("only the
  database deletes"), so a restrictive insert policy covers uploads; the
  picture can still go through `homebrew_items.art` (plan-B5a-3). The
  fallback holds for tables and RPCs but is triggered by a refusal, not by
  an ignored setting (plan-B5a-R2). The unverified decode in the worker is
  safe: it only refuses or forwards; PostgREST verifies the signature and
  the database bounds the token, so no permission rests on the decode. The
  measurement step is sound in method but too narrow (plan-B5a-2).
- Freeze. Every B1 change is additive before publication. Too strict: the
  `rev` rule (plan-B5a-R4). Not frozen and correct: chunk names, count and
  grouping. CORS is consistent: `*` on public static data (catalog, `/img/`,
  `/og/`) and T0, none on `/me` (account data, bearer token in page
  script), `*` on the protected-resource metadata (public); plan-B5a-N8
  narrows the image promise.
- Quota. 96 x 2 = 192 requests a day per user is correct; 100 users are
  19 % and 5-minute polling 58 %. The bulk catalog costs no Functions
  request. Ceiling: plan-B5a-N12.
- Unblock. `agent-guard.mjs` allows B0 and B1 when the newest
  `reviews/plan-B5a*.md` reads `Verdict: approve`, or reads
  `Verdict: fix-then-continue` and `plan.md` Status (above `## 1.`) holds
  a line that starts `- Plan review findings applied: reviews/plan-B5a.md`
  followed by a space, a punctuation mark or the line end. This report is
  fix-then-continue: the planner applies the findings once and writes that
  line; no second look follows.

## Suggested next action

Resume the planner (or dispatch one with this report and `plan.md`
sections 3.4, 3.5, 5.1, 5.3, 5.4, 6 B1/B5a/B5b, 7, 9, 11) to apply
plan-B5a-1, -2, -3 and R1-R7 as written, apply the `local` nits N1-N11
in the same pass (they are in the paths this review read), file N12 in the
handoff's Deferred, and add the Status line
`- Plan review findings applied: reviews/plan-B5a.md` with one sub-bullet
per finding. Then dispatch B0 or B1.

## Checks still needed

- B5a step 1 on the test project (the owner's switch): the Auth endpoint
  list of plan-B5a-2, the token claims (plan-B5a-R5), the discovery URLs,
  and whether the pinned CLI's `config.toml` has an OAuth server section
  (plan-B5a-R6). A read-only reviewer cannot run them.
- Whether hosted PostgREST applies `pgrst.db_pre_request` from the
  `authenticator` role setting on this project (plan-B5a-R2, the probe
  after `migrate-test`).
- Whether a Supabase OAuth access token stays accepted by PostgREST after
  `revokeGrant` until `exp` (plan-B5a-R1); the docs read in `context.md`
  do not say.
